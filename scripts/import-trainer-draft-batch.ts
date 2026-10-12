import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('Usage: npx tsx scripts/import-trainer-draft-batch.ts <original BATCH_DATA.json>');
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
if (source.format !== 'ashyq-author-review-material-v1' || source.methodically_approved !== false || !Array.isArray(source.units)) throw new Error('Expected an explicitly unapproved author-review batch.');
if (typeof source.batch !== 'string' || !/^\d{2,4}$/.test(source.batch)) throw new Error('Batch must be a numeric identifier, never a filesystem path.');
if (!source.units.length || source.units.length > 100 || !['string', 'number'].includes(typeof source.version)) throw new Error('Expected 1–100 draft units and a version.');
const units = source.units.map((unit: Record<string, unknown>) => {
  for (const key of ['id','title','category','student_markdown','teacher_markdown']) if (typeof unit[key] !== 'string' || !(unit[key] as string).trim()) throw new Error(`Missing ${key}`);
  if (unit.status !== 'DRAFT') throw new Error('Cannot import a non-draft material as an unapproved draft.');
  if (!/^[A-Z][A-Z0-9-]{1,23}$/.test(unit.id as string)) throw new Error('Invalid material ID');
  if (unit.exercise_data !== undefined && (!unit.exercise_data || typeof unit.exercise_data !== 'object' || Array.isArray(unit.exercise_data) || JSON.stringify(unit.exercise_data).length > 100_000)) throw new Error('Invalid structured exercise data');
  return { id: unit.id as string, title: unit.title as string, category: unit.category as string, status: 'DRAFT', student_markdown: unit.student_markdown as string, teacher_markdown: unit.teacher_markdown as string, language_only_markdown: typeof unit.language_only_markdown === 'string' ? unit.language_only_markdown : null, ...(unit.exercise_data === undefined ? {} : { exercise_data: unit.exercise_data }) };
});
if (new Set(units.map((unit: {id: string}) => unit.id)).size !== units.length) throw new Error('Duplicate unit IDs');
const content_sha256 = crypto.createHash('sha256').update(JSON.stringify(units)).digest('hex');
const manifest = { format: 'ashyq-draft-bank-v1', batch: source.batch, version: source.version, source_sha256: source.source_sha256, content_sha256, author: 'Codex', intended_reviewer: 'Dias', methodically_approved: false, units };
const output = path.resolve(`src/data/trainer-drafts/batch-${source.batch}.json`);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Imported ${units.length} DRAFT units; content fingerprint ${content_sha256}. No material was published or approved.`);
