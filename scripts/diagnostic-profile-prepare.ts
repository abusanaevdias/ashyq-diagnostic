/** One-shot, server-build-only operations. Never imported by the application. */
import { readFile } from 'node:fs/promises';
import { randomBytes, randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { QUESTION_BANK } from '../src/data/questions';
import { EXAMS } from '../src/lib/config';
import { freezeDiagnostic, type DiagnosticInput } from '../src/lib/diagnostic-profile/model';
import { GET, POST, DELETE } from '../src/app/api/learning-diagnostics/route';

const migration = 'supabase/migrations/20261023000100_diagnostic_profile.sql';
const expectedProject = 'aozhoefgtfrdlllnmdkn';
class PreparationError extends Error {}
function requireCheck(ok: unknown, code: string): asserts ok { if (!ok) throw new PreparationError(code); }
const receipt = (code: string) => console.log(`[diagnostic-profile] ${code}`);
const normalize = (value: string) => value.replace(/\r\n/g, '\n').trim();

async function prepare() {
  const pinned = process.env.DIAGNOSTIC_PROFILE_PREPARE_SHA;
  if (!pinned || pinned !== process.env.VERCEL_GIT_COMMIT_SHA) {
    receipt('OPERATIONS_SKIPPED');
    return;
  }
  requireCheck(/^[a-f0-9]{40}$/.test(pinned), 'COMMIT_PIN_INVALID');
  requireCheck(process.env.VERCEL_ENV === 'production', 'NOT_PRODUCTION');
  requireCheck(process.env.DIAGNOSTIC_PROFILE_ENABLED === 'true', 'RUNTIME_GATE_REQUIRED');
  const mode=process.env.DIAGNOSTIC_PROFILE_ACCEPTANCE_MODE??'bootstrap';
  requireCheck(mode==='bootstrap'||mode==='canonical','ACCEPTANCE_MODE_INVALID');
  requireCheck(process.env.DIAGNOSTIC_PROFILE_PROJECT_REF === expectedProject, 'PROJECT_PIN_REQUIRED');
  const root = process.env.SUPABASE_URL?.replace(/(\/(rest|auth)\/v1)?\/?$/, '');
  requireCheck(root === `https://${expectedProject}.supabase.co`, 'AUTH_PROJECT_MISMATCH');
  requireCheck(process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/(\/(rest|auth)\/v1)?\/?$/, '') === root, 'PUBLIC_PROJECT_MISMATCH');
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  requireCheck(service && anon, 'SERVER_KEYS_UNAVAILABLE');
  for (const key of ['POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'] as const) {
    if (!process.env[key]) continue;
    try {
      const candidate=new URL(process.env[key]!);
      const mode=candidate.hostname===`db.${expectedProject}.supabase.co`?'DIRECT':candidate.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(candidate.username)===`postgres.${expectedProject}`?'POOLED':'UNRECOGNIZED';
      receipt(`${key}_${mode}`);
    } catch { receipt(`${key}_INVALID`); }
  }
  const rawDsn = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
  requireCheck(rawDsn, 'DATABASE_UNAVAILABLE');
  const dsn = new URL(rawDsn);
  const direct = dsn.hostname === `db.${expectedProject}.supabase.co`;
  const pooled = dsn.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(dsn.username) === `postgres.${expectedProject}`;
  requireCheck(['postgres:', 'postgresql:'].includes(dsn.protocol) && (direct || pooled), 'DATABASE_PROJECT_MISMATCH');
  // pg connection-string SSL options replace the explicit SSL object. Remove
  // them, then require CA + hostname verification; never retry with insecure TLS.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'ssl', 'uselibpqcompat']) dsn.searchParams.delete(key);
  const db = new Client({ connectionString: dsn.toString(), ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 10000, statement_timeout: 10000, query_timeout: 12000 });
  let connectionFailed = false;
  db.on('error',()=>{ connectionFailed=true; });
  const qaEmails: string[] = [];
  const qaIds = new Set<string>();
  const runIds: string[] = [];
  const checks = AbortSignal.timeout(150000);
  let connected = false;
  let phase = 'DATABASE_CONNECT';
  let failure: string | null = null;
  const request = async (path: string, key: string, jwt: string | null, method = 'GET', body?: unknown, cleanup = false) => fetch(root + path, {
    method, headers: { apikey: key, ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: cleanup ? AbortSignal.timeout(8000) : AbortSignal.any([checks, AbortSignal.timeout(10000)]), cache: 'no-store',
  });
  try {
    await db.connect(); connected = true;
    phase = 'AUTH_TRIGGER_PREFLIGHT';
    const foundation = await readFile('supabase/migrations/20260914000300_auth_consent.sql', 'utf8');
    const original = await readFile('supabase/migrations/20260914000100_foundation.sql','utf8');
    const timestampBody = original.match(/create or replace function private\.set_updated_at\(\)[\s\S]*?as \$\$([\s\S]*?)\$\$/i)?.[1];
    const trustedBody = foundation.match(/create or replace function private\.handle_new_user\(\)[\s\S]*?as \$\$([\s\S]*?)\$\$/i)?.[1];
    requireCheck(trustedBody, 'TRUSTED_TRIGGER_SOURCE_MISSING');
    const triggers = await db.query<{ relation: string; schema: string; name: string; body: string; tgname:string; tgtype:number; tgenabled:string; tgnargs:number; condition:string|null; prosecdef:boolean; proconfig:string[] }>(`select c.relname as relation, n.nspname as schema, p.proname as name, p.prosrc as body,t.tgname,t.tgtype,t.tgenabled,t.tgnargs,t.tgqual::text as condition,p.prosecdef,p.proconfig
      from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_proc p on p.oid=t.tgfoid join pg_namespace n on n.oid=p.pronamespace
      where t.tgrelid in ('auth.users'::regclass,'public.profiles'::regclass,'auth.identities'::regclass,'auth.sessions'::regclass) and not t.tgisinternal`);
    requireCheck(timestampBody && triggers.rows.length === 2 && triggers.rows.every(t => t.schema==='private' && t.tgenabled==='O' && t.tgnargs===0 && t.condition===null && JSON.stringify(t.proconfig)===JSON.stringify(['search_path=""']) && (t.relation==='users' && t.tgname==='on_auth_user_created' && t.tgtype===5 && t.prosecdef && t.name==='handle_new_user' && normalize(t.body)===normalize(trustedBody) || t.relation==='profiles' && t.tgname==='profiles_updated_at' && t.tgtype===19 && !t.prosecdef && t.name==='set_updated_at' && normalize(t.body)===normalize(timestampBody))), 'UNREVIEWED_AUTH_TRIGGER');
    receipt('AUTH_TRIGGER_PREFLIGHT_PASS');
    phase = 'MIGRATION';
    const sql = await readFile(migration, 'utf8');
    await db.query('begin');
    try {
      await db.query("set local lock_timeout='5s'");
      await db.query('select pg_advisory_xact_lock(20261023, 57001)');
      const history = await db.query("select to_regclass('supabase_migrations.schema_migrations') is not null as tracked, to_regclass('public.diagnostic_snapshots') is not null as present");
      receipt(history.rows[0].tracked ? 'EXISTING_MIGRATION_HISTORY_PRESENT' : 'EXISTING_MIGRATION_HISTORY_UNMANAGED');
      const tracked = history.rows[0].tracked;
      const recorded = tracked ? await db.query('select version from supabase_migrations.schema_migrations where version=$1',['20261023000100']) : { rows: [] };
      requireCheck(!recorded.rows.length || history.rows[0].present, 'HISTORY_SCHEMA_CONFLICT');
      if (!history.rows[0].present) {
        const fn = await db.query("select to_regprocedure('public.valid_diagnostic_snapshot(jsonb)') is not null as present");
        requireCheck(!fn.rows[0].present, 'CONFLICTING_VALIDATOR');
        // Only this reviewed additive feature migration. Keep one transaction,
        // including the advisory lock; never alter existing auth/profile objects.
        await db.query(sql.replace(/^begin;\s*$/mi, '').replace(/^commit;\s*$/mi, ''));
      }
      const validator = await db.query("select p.prosrc,p.prosecdef,p.provolatile,p.proconfig,p.proisstrict,p.proleakproof,(select lanname from pg_language where oid=p.prolang) as language from pg_proc p where p.oid='public.valid_diagnostic_snapshot(jsonb)'::regprocedure");
      requireCheck(validator.rows.length === 1 && !validator.rows[0].prosecdef && validator.rows[0].provolatile==='i' && validator.rows[0].language==='plpgsql' && !validator.rows[0].proisstrict && !validator.rows[0].proleakproof && JSON.stringify(validator.rows[0].proconfig)===JSON.stringify(['search_path=""']) && normalize(validator.rows[0].prosrc) === normalize(sql.match(/as \$\$([\s\S]*?)\$\$/i)![1]), 'VALIDATOR_DRIFT');
      const security = await db.query("select relrowsecurity,relforcerowsecurity from pg_class where oid='public.diagnostic_snapshots'::regclass");
      requireCheck(security.rows[0].relrowsecurity && security.rows[0].relforcerowsecurity, 'RLS_NOT_FORCED');
      const policies = await db.query("select policyname,cmd,roles::text as roles from pg_policies where schemaname='public' and tablename='diagnostic_snapshots'");
      const expectedPolicies = new Map([['diagnostic_read_own','SELECT'],['diagnostic_insert_own','INSERT'],['diagnostic_delete_own','DELETE']]);
      requireCheck(policies.rows.length === 3 && policies.rows.every(p => expectedPolicies.get(p.policyname) === p.cmd && p.roles === '{authenticated}'), 'POLICY_DRIFT');
      for (const role of ['anon','authenticated']) for (const privilege of ['SELECT','INSERT','DELETE','UPDATE','TRUNCATE','REFERENCES','TRIGGER']) {
        const value = await db.query('select has_table_privilege($1,$2,$3) as allowed',[role,'public.diagnostic_snapshots',privilege]);
        requireCheck(value.rows[0].allowed === (role === 'authenticated' && ['SELECT','INSERT','DELETE'].includes(privilege)), 'GRANT_DRIFT');
      }
      // Parse the reviewed table/policy SQL in a temporary relation to obtain
      // PostgreSQL's canonical expressions. It never references real user data;
      // the real auth FK is checked separately (temp→permanent FKs are forbidden).
      const expectedSql = sql.slice(sql.indexOf('create table public.diagnostic_snapshots'))
        .replaceAll('public.diagnostic_snapshots','pg_temp.expected_diagnostic_snapshots')
        .replace('create table pg_temp.','create temporary table pg_temp.')
        .replace(' references auth.users(id) on delete cascade','')
        .replace('\n);','\n) on commit drop;').replace(/^commit;\s*$/mi,'');
      await db.query(expectedSql);
      const canonical = async (relation: string) => {
        const columns=await db.query(`select a.attname,format_type(a.atttypid,a.atttypmod) as type,a.attnotnull,a.attidentity,a.attgenerated,pg_get_expr(d.adbin,d.adrelid) as default_value from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=$1::regclass and a.attnum>0 and not a.attisdropped order by a.attnum`,[relation]);
        const constraints=await db.query("select pg_get_constraintdef(oid) as definition from pg_constraint where conrelid=$1::regclass and contype<>'f' order by definition",[relation]);
        const policies=await db.query('select polname,polcmd,polroles::text,polpermissive,pg_get_expr(polqual,polrelid) as using_clause,pg_get_expr(polwithcheck,polrelid) as check_clause from pg_policy where polrelid=$1::regclass order by polname',[relation]);
        const indexes=await db.query(`select i.indisprimary,i.indisunique,i.indisvalid,i.indisready,i.indkey::text,i.indoption::text,am.amname,pg_get_expr(i.indexprs,i.indrelid) as expressions,pg_get_expr(i.indpred,i.indrelid) as predicate from pg_index i join pg_class c on c.oid=i.indexrelid join pg_am am on am.oid=c.relam where i.indrelid=$1::regclass order by i.indisprimary desc,i.indkey::text`,[relation]);
        return JSON.stringify({columns:columns.rows,constraints:constraints.rows,policies:policies.rows,indexes:indexes.rows});
      };
      requireCheck(await canonical('public.diagnostic_snapshots')===await canonical('pg_temp.expected_diagnostic_snapshots'),'CANONICAL_SCHEMA_DRIFT');
      const foreignKeys=await db.query("select pg_get_constraintdef(oid) as definition from pg_constraint where conrelid='public.diagnostic_snapshots'::regclass and contype='f'");
      requireCheck(foreignKeys.rows.length===1 && foreignKeys.rows[0].definition==='FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE','OWNER_FOREIGN_KEY_DRIFT');
      const unknownTriggers=await db.query("select 1 from pg_trigger where tgrelid='public.diagnostic_snapshots'::regclass and not tgisinternal");
      requireCheck(!unknownTriggers.rows.length,'UNKNOWN_SNAPSHOT_TRIGGER');
      if (tracked && !recorded.rows.length) await db.query('insert into supabase_migrations.schema_migrations (version,statements,name) values ($1,$2,$3)',['20261023000100',[sql],'diagnostic_profile']);
      await db.query("notify pgrst, 'reload schema'");
      await db.query('commit');
    } catch (error) { await db.query('rollback'); throw error; }
    receipt('ADDITIVE_MIGRATION_COMMITTED');
    phase = 'SCHEMA_CACHE';
    let ready = false;
    for (let i=0;i<10;i++) {
      const probe = await request('/rest/v1/diagnostic_snapshots?select=run_id&limit=0',anon,null);
      if ([401,403].includes(probe.status)) { ready=true;break; }
      requireCheck(probe.status===404,'UNEXPECTED_ANONYMOUS_ACCESS');
      await new Promise(resolve=>setTimeout(resolve,500));
    }
    requireCheck(ready,'SCHEMA_CACHE_NOT_READY');
    phase = 'AUTH_QA';
    const settingsResponse=await request('/auth/v1/settings',anon,null);
    requireCheck(settingsResponse.ok,'AUTH_SETTINGS_UNAVAILABLE');
    const settings=await settingsResponse.json();
    // Exercise the actual configured public signup. Never disable confirmation,
    // change provider settings or send real confirmation emails for acceptance.
    requireCheck(settings.external?.email===true && settings.disable_signup===false && settings.mailer_autoconfirm===true,'PUBLIC_SIGNUP_NEEDS_INTERACTIVE_CONFIRMATION');
    const users: { id: string; token: string; email: string; password: string }[] = [];
    for (let i = 0; i < 2; i++) {
      const email = `diagnostic-qa-${randomBytes(18).toString('hex')}@example.invalid`;
      const password = 'Aa9!'+randomBytes(32).toString('base64url');
      qaEmails.push(email); // Recover exact own ID after an ambiguous response.
      console.log(JSON.stringify({syntheticQaPlannedEmail:email}));
      const created = await request('/auth/v1/signup',anon,null,'POST',{email,password,data:{name:'Synthetic diagnostic acceptance',is_minor:false}});
      requireCheck(created.ok,'QA_PUBLIC_SIGNUP_FAILED');
      const registered=await created.json();const user=registered.user;
      requireCheck(user && typeof user.id==='string' && user.email===email && typeof registered.access_token==='string','QA_PUBLIC_SIGNUP_RESPONSE_INVALID');qaIds.add(user.id);
      const signed = await request('/auth/v1/token?grant_type=password', anon, null, 'POST', { email, password });
      requireCheck(signed.ok, 'QA_SIGNIN_FAILED');
      const session = await signed.json(); requireCheck(session.user?.id === user.id && typeof session.access_token === 'string', 'QA_TOKEN_RESPONSE_INVALID');
      const profileResponse=await request('/rest/v1/profiles?select=display_name,role,avatar_color&id=eq.'+encodeURIComponent(user.id),anon,session.access_token);
      requireCheck(profileResponse.ok,'PUBLIC_SIGNUP_PROFILE_READ');
      const profiles=await profileResponse.json();
      requireCheck(profiles.length===1 && profiles[0].role==='student' && profiles[0].display_name==='Synthetic diagnostic acceptance','PUBLIC_SIGNUP_STUDENT_PROFILE');
      users.push({ id: user.id, token: session.access_token, email, password });
    }
    const [a,b] = users;
    const questionIds = EXAMS.ielts.sections.flatMap(section => QUESTION_BANK.filter(q => q.exam === 'ielts' && q.section === section).slice(0,EXAMS.ielts.blueprint.perSection[section]).map(q=>q.id));
    const input: DiagnosticInput = { runId: randomUUID(), exam: 'ielts', questionIds, answers: Object.fromEntries(questionIds.map(id=>[id,null])), target: null, elapsedMs: 60000, finishedAt: Date.now() };
    runIds.push(input.runId);
    const snapshot = freezeDiagnostic(input);
    const privateResponse = (response: Response) => {
      const cache=(response.headers.get('cache-control')??'').toLowerCase().split(',').map(value=>value.trim());
      const vary=(response.headers.get('vary')??'').toLowerCase().split(',').map(value=>value.trim());
      requireCheck(cache.includes('private') && cache.includes('no-store') && vary.includes('authorization'),'PRIVATE_RESPONSE_CACHE_GUARD');
      return response;
    };
    const call = async (method: 'GET'|'POST'|'DELETE', user = a, value?: unknown, actor = user.id) => {
      checks.throwIfAborted(); requireCheck(!connectionFailed,'DATABASE_CONNECTION_LOST');
      const req = new Request('https://ashyq-diagnostic.vercel.app/api/learning-diagnostics',{method,headers:{ Authorization: `Bearer ${user.token}`, 'X-Expected-Actor': actor, 'Content-Type':'application/json' },body:method==='GET'?undefined:JSON.stringify(value)});
      const response = mode==='canonical' ? await fetch(req,{signal:AbortSignal.any([checks,AbortSignal.timeout(15000)]),cache:'no-store',redirect:'error'}) : method==='GET'?await GET(req):method==='POST'?await POST(req):await DELETE(req);
      return privateResponse(response);
    };
    phase = 'RLS_API_QA';
    requireCheck(privateResponse(mode==='canonical' ? await fetch('https://ashyq-diagnostic.vercel.app/api/learning-diagnostics',{signal:AbortSignal.any([checks,AbortSignal.timeout(10000)]),cache:'no-store',redirect:'error'}) : await GET(new Request('https://ashyq-diagnostic.vercel.app/api/learning-diagnostics'))).status === 401, 'ANONYMOUS_API_GUARD');
    requireCheck((await call('POST',a,input,b.id)).status === 409, 'ACTOR_SWITCH_GUARD');
    requireCheck((await call('POST',a,input)).ok, 'OWNER_SAVE');
    requireCheck((await call('POST',a,input)).ok, 'IDEMPOTENT_RETRY');
    requireCheck((await call('POST',a,{...input,elapsedMs:60001})).status === 409, 'IMMUTABILITY_CONFLICT');
    requireCheck((await call('POST',b,input)).status === 409, 'OTHER_OWNER_RUN_CONFLICT');
    requireCheck((await (await call('GET',b)).json()).length === 0, 'OTHER_OWNER_READ_DENIAL');
    const unchanged = async () => {
      const rows = await (await call('GET',a)).json();
      requireCheck(rows.length === 1 && rows[0].runId === input.runId && rows[0].elapsedMs === input.elapsedMs, 'PERSISTED_OWNER_STATE_CHANGED');
    };
    await unchanged();
    const table = '/rest/v1/diagnostic_snapshots';
    const foreignId=randomUUID(); runIds.push(foreignId);
    const deniedInsert = await request(table,anon,b.token,'POST',{run_id:foreignId,owner_id:a.id,finished_at:new Date().toISOString(),snapshot:{...snapshot,runId:foreignId}});
    requireCheck([401,403].includes(deniedInsert.status), 'OTHER_OWNER_INSERT_DENIAL');
    await unchanged();
    const deniedUpdate = await request(table+`?run_id=eq.${input.runId}`,anon,a.token,'PATCH',{snapshot:{...snapshot,elapsedMs:60001}});
    requireCheck([401,403].includes(deniedUpdate.status), 'UPDATE_DENIAL');
    requireCheck((await call('DELETE',b,{runId:input.runId})).ok, 'OTHER_OWNER_DELETE_RESPONSE');
    await unchanged();
    const anonymous = await request(table+'?select=run_id&limit=1',anon,null);
    requireCheck([401,403].includes(anonymous.status), 'ANONYMOUS_TABLE_DENIAL');
    const malformedId = randomUUID(); runIds.push(malformedId);
    const malformed = await request(table,anon,a.token,'POST',{run_id:malformedId,owner_id:a.id,finished_at:new Date().toISOString(),snapshot:{...snapshot,runId:malformedId,version:'1'}});
    requireCheck(malformed.status === 400, 'MALFORMED_SNAPSHOT_DENIAL');
    await unchanged();
    const again = await request('/auth/v1/token?grant_type=password',anon,null,'POST',{email:a.email,password:a.password});
    requireCheck(again.ok,'FRESH_SESSION_SIGNIN');
    const fresh = await again.json(); requireCheck(typeof fresh.access_token==='string','FRESH_SESSION_TOKEN');
    const persisted = await (await call('GET',{...a,token:fresh.access_token})).json();
    requireCheck(persisted.length===1 && persisted[0].runId===input.runId,'FRESH_SESSION_PERSISTENCE');
    requireCheck((await call('DELETE',a,{runId:input.runId})).ok,'OWNER_DELETE');
    requireCheck((await (await call('GET',a)).json()).length===0,'OWNER_DELETE_PERSISTED');
    receipt(mode==='canonical'?'REAL_CANONICAL_A_B_JWT_RLS_API_PASS':'REAL_A_B_JWT_RLS_API_PASS');
  } catch (error) {
    failure = error instanceof PreparationError ? error.message : phase; // Never expose a raw pg/Auth error, DSN, token or response.
    if (phase === 'DATABASE_CONNECT' && error && typeof error === 'object' && 'code' in error) {
      const codes: Record<string,string> = {
        SELF_SIGNED_CERT_IN_CHAIN:'DATABASE_CA_UNTRUSTED', DEPTH_ZERO_SELF_SIGNED_CERT:'DATABASE_CA_UNTRUSTED',
        UNABLE_TO_VERIFY_LEAF_SIGNATURE:'DATABASE_CA_UNTRUSTED', UNABLE_TO_GET_ISSUER_CERT_LOCALLY:'DATABASE_CA_UNTRUSTED',
        CERT_HAS_EXPIRED:'DATABASE_CERT_EXPIRED', ERR_TLS_CERT_ALTNAME_INVALID:'DATABASE_HOSTNAME_INVALID',
        ENETUNREACH:'DATABASE_NETWORK_UNREACHABLE', EHOSTUNREACH:'DATABASE_NETWORK_UNREACHABLE',
        ENOTFOUND:'DATABASE_DNS_FAILED', EAI_AGAIN:'DATABASE_DNS_FAILED', ECONNREFUSED:'DATABASE_CONNECTION_REFUSED',
        ETIMEDOUT:'DATABASE_CONNECTION_TIMEOUT', '28P01':'DATABASE_CREDENTIAL_REJECTED',
      };
      const code = (error as {code:unknown}).code;
      if (typeof code === 'string' && Object.hasOwn(codes,code)) failure=codes[code];
    }
  } finally {
    // Cleanup known identities does not depend on a still-working DB socket.
    // First attempt exact-email recovery for an ambiguous create response.
    let verifiedCleanup = connected && !connectionFailed;
    if (qaEmails.length && connected && !connectionFailed) {
      try {
        const found=await db.query('select id from auth.users where email=any($1::text[])',[qaEmails]);
        for (const row of found.rows) qaIds.add(row.id);
      } catch { verifiedCleanup=false; }
    }
    for (const id of qaIds) {
      let removed=false;
      for (let attempt=0;attempt<2;attempt++) {
        try {
          const result=await request('/auth/v1/admin/users/'+encodeURIComponent(id),service,service,'DELETE',undefined,true);
          if (result.ok || result.status===404) { removed=true;break; }
        } catch { /* Retry only this exact synthetic identity. */ }
      }
      if (!removed) verifiedCleanup=false;
    }
    if (connected && !connectionFailed) {
      try {
        const usersLeft=await db.query('select count(*)::integer as count from auth.users where email=any($1::text[])',[qaEmails]);
        const rowsLeft=runIds.length ? await db.query('select count(*)::integer as count from public.diagnostic_snapshots where run_id=any($1::text[])',[runIds]) : {rows:[{count:0}]};
        verifiedCleanup=verifiedCleanup && usersLeft.rows[0].count===0 && rowsLeft.rows[0].count===0;
      } catch { verifiedCleanup=false; }
    }
    if (qaEmails.length && !verifiedCleanup) {
      failure='QA_CLEANUP';
      receipt('QA_CLEANUP_REQUIRES_ATTENTION');
      // Synthetic, cryptographically unique identities only. No passwords/JWTs.
      console.error(JSON.stringify({syntheticIds:[...qaIds],syntheticEmails:qaEmails}));
    } else if (qaEmails.length) receipt('EXACT_QA_CLEANUP_PASS');
    if (connected) await db.end().catch(()=>{ failure=failure??'DATABASE_CLOSE'; });
    if (connectionFailed) failure=failure??'DATABASE_CONNECTION_LOST';
  }
  if (failure) throw new Error(failure);
  receipt('ACCEPTANCE_PASS_EMAIL_DELIVERY_AND_PHYSICAL_DEVICE_UNCLAIMED');
}

prepare().catch(error => {
  // Only our fixed phase/check labels can reach output.
  const code = error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : 'PREPARATION_FAILED';
  console.error(`[diagnostic-profile] ${code}`);
  process.exitCode = 1;
});
