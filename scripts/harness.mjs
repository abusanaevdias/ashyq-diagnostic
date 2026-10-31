import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, lstatSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = value => createHash('sha256').update(value).digest('hex');
const fail = message => { throw new Error(message); };
const json = file => JSON.parse(readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, ''));

export function matches(file, glob) {
  const expression = glob.split('**').map(part => part.split('*').map(piece => piece.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*')).join('.*');
  return new RegExp(`^${expression}$`).test(file);
}

export function safePath(value) {
  return typeof value === 'string' && value.length > 0 && !/[\x00-\x1f\x7f]/.test(value) && !value.startsWith('/') && !value.includes('\\') && !value.includes(':') && !value.split('/').some(part => part === '..' || part === '.');
}

function git(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) fail(`git ${args[0]} failed; reconcile checkout before continuing`);
  return result.stdout;
}

export function validateTask(task, policy) {
  if (!/^[A-Z][A-Z0-9-]+-\d+$/.test(task.id ?? '')) fail('Task id is invalid');
  for (const key of ['owner', 'objective']) if (typeof task[key] !== 'string' || !task[key].trim()) fail(`${task.id}: missing ${key}`);
  for (const key of ['scope', 'acceptance', 'counterexamples', 'checks', 'reviews']) {
    if (!Array.isArray(task[key]) || !task[key].length || task[key].some(value => typeof value !== 'string' || !value.trim())) fail(`${task.id}: invalid ${key}`);
  }
  if (task.scope.some(value => !safePath(value) || ['*', '**', '**/*'].includes(value))) fail(`${task.id}: unsafe or unbounded scope`);
  for (const check of task.checks) if (!Object.hasOwn(policy.checks, check)) fail(`${task.id}: unknown check ${check}`);
  if (!Array.isArray(task.routes) || task.routes.some(route => typeof route !== 'string' || !/^\/(?!\/)/.test(route) || route.includes('://'))) fail(`${task.id}: invalid routes`);
  return task;
}

export function assess(files, tasks, policy) {
  const meaningful = files.filter(file => !policy.metadataOnly.includes(file));
  const rules = policy.rules.filter(rule => meaningful.some(file => rule.paths.some(glob => matches(file, glob))));
  const checks = [...new Set(rules.flatMap(rule => rule.checks))];
  const reviews = [...new Set(rules.flatMap(rule => rule.reviews))];
  const uncovered = meaningful.filter(file => !tasks.some(task => task.scope.some(glob => matches(file, glob))));
  const declared = new Set(tasks.flatMap(task => task.checks));
  const declaredReviews = new Set(tasks.flatMap(task => task.reviews));
  return { files, areas: rules.map(rule => rule.id), checks, reviews, uncovered, missingChecks: checks.filter(check => !declared.has(check)), missingReviews: reviews.filter(review => !declaredReviews.has(review)) };
}

function snapshot(baseRef) {
  const base = git(['rev-parse', '--verify', '--end-of-options', `${baseRef}^{commit}`]).trim();
  const head = git(['rev-parse', 'HEAD']).trim();
  const tracked = git(['diff', '--name-only', '-z', '--diff-filter=ACMRD', base, '--']).split('\0').filter(Boolean);
  const untracked = git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean);
  const files = [...new Set([...tracked, ...untracked])].sort();
  for (const file of files) if (!safePath(file)) fail('Unsafe path in checkout');
  const untrackedData = untracked.map(file => {
    const full = path.join(root, file);
    if (!lstatSync(full).isFile()) fail(`Only regular untracked files supported: ${file}`);
    return `${file}\0${hash(readFileSync(full))}`;
  }).join('\n');
  return { base, head, files, fingerprint: hash(head + '\n' + base + '\n' + git(['diff', '--binary', base, '--']) + '\n' + untrackedData) };
}

function collect(base) {
  const policy = json('harness/policy.json');
  if (policy.version !== 1) fail('Unsupported harness policy version');
  for (const file of policy.requiredDocs) if (!safePath(file) || !existsSync(path.join(root, file))) fail(`Missing harness reference: ${file}`);
  const all = readdirSync(path.join(root, 'harness/tasks')).filter(file => file.endsWith('.json')).map(file => validateTask(json(`harness/tasks/${file}`), policy));
  const state = snapshot(base);
  const selected = all.filter(task => state.files.includes(`harness/tasks/${task.id}.json`));
  const ledger = readFileSync(path.join(root, 'HANDOFF.md'), 'utf8');
  for (const task of selected) if (!ledger.includes(`| ${task.id} |`)) fail(`Claim ${task.id} is missing from HANDOFF.md`);
  const assessment = assess(state.files, selected, policy);
  return { ...state, ...assessment, tasks: selected.map(task => task.id), taskDefinitions: selected, policy };
}

function assertPlan(plan) {
  if (plan.uncovered.length) fail(`Changes outside this PR's task scopes: ${plan.uncovered.join(', ')}`);
  if (plan.missingChecks.length) fail(`Plan omits required checks: ${plan.missingChecks.join(', ')}`);
  if (plan.missingReviews.length) fail(`Plan omits required reviews: ${plan.missingReviews.join(', ')}`);
  for (const task of plan.taskDefinitions) if (task.reviews.includes('visual') && !task.routes.length) fail(`${task.id}: visual review requires routes`);
}

function outputFile(relative) {
  if (!safePath(relative) || !relative.startsWith('.data/harness/')) fail('Reports must stay under .data/harness/');
  const full = path.join(root, relative);
  let cursor = root;
  for (const segment of relative.split('/')) {
    cursor = path.join(cursor, segment);
    if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) fail('Report paths cannot traverse symbolic links');
  }
  mkdirSync(path.dirname(full), { recursive: true });
  return full;
}

function npmCli() {
  const dir = path.dirname(process.execPath);
  const candidates = [process.env.npm_execpath, path.join(dir, 'node_modules/npm/bin/npm-cli.js'), path.join(dir, '../lib/node_modules/npm/bin/npm-cli.js')];
  const candidate = candidates.find(file => file && path.basename(file) === 'npm-cli.js' && existsSync(file));
  if (!candidate) fail('npm-cli.js not found next to Node; invoke through an npm environment');
  return candidate;
}

export function requireLoopback(value) {
  let url;
  try { url = new URL(value); } catch { fail('BASE_URL must be an explicit loopback HTTP URL'); }
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.username || url.password) fail('Network checks are restricted to loopback HTTP servers');
}

export function validateReport(report, current, required) {
  if (report.version !== 1 || report.head !== current.head || report.base !== current.base || report.fingerprint !== current.fingerprint) fail('Stale report: HEAD, base or source fingerprint changed');
  if (!Array.isArray(report.checks)) fail('Invalid report checks');
  if (!Number.isFinite(Date.parse(report.completedAt)) || Date.parse(report.completedAt) > Date.now() + 300000) fail('Report has no valid completed run');
  if (new Set(report.checks.map(check => check.id)).size !== report.checks.length) fail('Duplicate check records');
  for (const record of report.checks) if (record.exitCode !== 0 || record.signal || record.error) fail(`Report contains an unsuccessful check: ${record.id}`);
  for (const id of required) {
    const record = report.checks.find(check => check.id === id);
    if (!record || record.exitCode !== 0 || record.signal || record.error || !/^[a-f0-9]{64}$/.test(record.stdoutSha256 ?? '') || !/^[a-f0-9]{64}$/.test(record.stderrSha256 ?? '') || !(record.durationMs >= 0)) fail(`Missing or unsuccessful check: ${id}`);
  }
  return true;
}

function redact(value) {
  return value.replace(/(?:postgres(?:ql)?|https?):\/\/[^\s]+/g, '[URL omitted]').replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?/g, '[token omitted]').replace(/(?:Bearer|Authorization|password|secret|token|api[_-]?key)\s*[:= ]\s*\S+/gi, '[credential omitted]');
}

async function main() {
  const [action = 'help', ...args] = process.argv.slice(2);
  const option = (name, fallback) => { const index = args.indexOf(name); return index < 0 ? fallback : args[index + 1] ?? fail(`${name} requires a value`); };
  if (action === 'help') {
    console.log('node scripts/harness.mjs plan|check|run|verify [--base REF] [--checks id,id] [--report .data/harness/run.json]');
    console.log('Read docs/harness/README.md. Existing complete CI and deployment acceptance remain mandatory.');
    return;
  }
  if (!['plan', 'check', 'run', 'verify'].includes(action)) fail(`Unknown action: ${action}`);
  const base = option('--base', process.env.HARNESS_BASE || 'origin/main');
  const plan = collect(base);
  const summary = { head: plan.head, base: plan.base, fingerprint: plan.fingerprint, tasks: plan.tasks, files: plan.files, areas: plan.areas, checks: plan.checks, reviews: plan.reviews, uncovered: plan.uncovered, missingChecks: plan.missingChecks, missingReviews: plan.missingReviews, fullCiRequired: true, deploymentNotProven: true };
  if (action === 'plan') { console.log(JSON.stringify(summary, null, 2)); return; }
  const reportPath = option('--report', '.data/harness/run.json');
  if (action === 'check') {
    writeFileSync(outputFile('.data/harness/plan.json'), JSON.stringify(summary, null, 2));
    assertPlan(plan);
    console.log(`PASS harness contract: ${plan.tasks.length} changed task plans; ${plan.files.length} paths covered; areas=${plan.areas.join(',') || 'metadata-only'}`);
    return;
  }
  assertPlan(plan);
  if (action === 'verify') {
    const report = json(reportPath);
    validateReport(report, plan, [...new Set(plan.taskDefinitions.flatMap(task => task.checks))]);
    for (const record of report.checks) for (const stream of ['stdout', 'stderr']) {
      const log = record.logs?.[stream];
      if (!log || !safePath(log.file) || !log.file.startsWith('.data/harness/') || !existsSync(path.join(root, log.file)) || hash(readFileSync(path.join(root, log.file))) !== log.sha256) fail(`Missing or changed saved log: ${record.id}/${stream}`);
    }
    console.log('PASS current source-bound command evidence; manual reviews, complete CI and live release still require separate evidence');
    return;
  }
  if (process.env.VERCEL_ENV === 'production') fail('Do not run the local harness in production');
  const checks = option('--checks', [...new Set(plan.taskDefinitions.flatMap(task => task.checks))].join(',')).split(',').filter(Boolean);
  if (!checks.length || checks.some(id => !Object.hasOwn(plan.policy.checks, id))) fail('Choose registered check IDs; shell commands are not accepted');
  for (const id of checks) if (plan.policy.checks[id].loopback) requireLoopback(process.env.BASE_URL);
  let report = { version: 1, head: plan.head, base: plan.base, fingerprint: plan.fingerprint, startedAt: new Date().toISOString(), checks: [] };
  if (existsSync(outputFile(reportPath))) {
    const previous = json(reportPath);
    if (previous.version === 1 && previous.head === plan.head && previous.base === plan.base && previous.fingerprint === plan.fingerprint && Array.isArray(previous.checks)) report = previous;
  }
  delete report.completedAt;
  for (const id of checks) {
    const check = plan.policy.checks[id];
    const argv = check.npm ? [npmCli(), 'run', check.npm] : [path.join(root, check.node)];
    const started = Date.now();
    const result = spawnSync(process.execPath, argv, { cwd: root, encoding: 'utf8', shell: false, timeout: 25 * 60 * 1000, maxBuffer: 32 * 1024 * 1024, env: { ...process.env, DIAGNOSTIC_PROFILE_PREPARE_SHA: '' } });
    const logRoot = path.posix.dirname(reportPath);
    const logs = {};
    for (const stream of ['stdout', 'stderr']) {
      const content = redact(result[stream] ?? '');
      const file = `${logRoot}/${id}.${stream}.log`;
      writeFileSync(outputFile(file), content);
      logs[stream] = { file, sha256: hash(content) };
    }
    report.checks = report.checks.filter(check => check.id !== id);
    report.checks.push({ id, exitCode: result.status, signal: result.signal, error: result.error?.code ?? null, durationMs: Date.now() - started, stdoutSha256: hash(result.stdout ?? ''), stderrSha256: hash(result.stderr ?? ''), logs });
    writeFileSync(outputFile(reportPath), JSON.stringify(report, null, 2));
    console.log(`${result.status === 0 ? 'PASS' : 'FAIL'} ${id} (${Date.now() - started}ms)`);
    if (result.status !== 0 || result.signal || result.error) { console.error(redact((result.stderr || result.stdout || 'No output').slice(-8000))); fail(`Check failed: ${id}`); }
  }
  const after = snapshot(plan.base);
  if (after.fingerprint !== plan.fingerprint) fail('Source changed during checks; rerun after reconciling it');
  report.completedAt = new Date().toISOString();
  writeFileSync(outputFile(reportPath), JSON.stringify(report, null, 2));
  console.log(`Evidence saved: ${reportPath}`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main().catch(error => { console.error(`HARNESS: ${error.message}`); process.exitCode = 1; });
