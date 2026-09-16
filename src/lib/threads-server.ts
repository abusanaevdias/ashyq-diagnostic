import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseRest } from './supabase-leads';
import { callTelegram, isManager } from './telegram-auth';
import type { Candidate, Draft, DraftStatus, ThreadsIo, ThreadsPost } from './threads-bot';

/** Настоящие Threads API, Supabase, Claude и Telegram для threads-bot (THREADS-BOT-001). */

const GRAPH = 'https://graph.threads.net';
const DAY = 24 * 3_600_000;
// long-lived токен живёт 60 дней; продлеваем заранее (продлить можно, если ему больше суток)
const REFRESH_BEFORE_MS = 30 * DAY;
export const THREADS_SCOPES = [
  'threads_basic',
  'threads_content_publish',
  'threads_read_replies',
  'threads_manage_replies',
  'threads_manage_mentions',
  'threads_keyword_search',
];

interface AuthRow { user_id: string; username: string; access_token: string; expires_at: string }

/** Запрос к Threads. В ошибке нет URL: в нём токен. */
async function graph<T>(path: string, params: Record<string, string>, method: 'GET' | 'POST' = 'GET'): Promise<T> {
  const url = new URL(path, GRAPH);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, { method, signal: AbortSignal.timeout(15_000), cache: 'no-store' });
  const body = (await response.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!response.ok || body.error) throw new Error(`Threads ${response.status}: ${body.error?.message ?? 'ошибка'}`);
  return body;
}

export async function saveThreadsToken(accessToken: string, expiresInSeconds: number): Promise<string> {
  const me = await graph<{ id: string; username: string }>('/v1.0/me', { fields: 'id,username', access_token: accessToken });
  const expected = process.env.THREADS_USERNAME?.replace(/^@/, '').toLowerCase();
  // иначе любой, кто пройдёт OAuth своим аккаунтом, подменит аккаунт бота
  if (!expected || me.username.toLowerCase() !== expected) throw new Error(`аккаунт @${me.username} не совпадает с THREADS_USERNAME`);
  await supabaseRest('threads_auth', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      id: 1, user_id: me.id, username: me.username, access_token: accessToken,
      expires_at: new Date(Date.now() + expiresInSeconds * 1000).toISOString(), updated_at: new Date().toISOString(),
    }),
  });
  return me.username;
}

/** Код OAuth → long-lived токен → проверка аккаунта → база. */
export async function connectThreads(code: string, redirectUri: string): Promise<string> {
  const form = new URLSearchParams({
    client_id: process.env.THREADS_APP_ID ?? '',
    client_secret: process.env.THREADS_APP_SECRET ?? '',
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  });
  const response = await fetch(`${GRAPH}/oauth/access_token`, { method: 'POST', body: form, signal: AbortSignal.timeout(15_000) });
  const short = (await response.json().catch(() => ({}))) as { access_token?: string; error?: { message?: string }; error_message?: string };
  if (!short.access_token) throw new Error(`обмен кода: ${short.error?.message ?? short.error_message ?? response.status}`);
  const long = await graph<{ access_token: string; expires_in: number }>('/access_token', {
    grant_type: 'th_exchange_token',
    client_secret: process.env.THREADS_APP_SECRET ?? '',
    access_token: short.access_token,
  });
  return saveThreadsToken(long.access_token, long.expires_in);
}

async function auth(): Promise<AuthRow> {
  const [row] = await supabaseRest<AuthRow[]>('threads_auth?select=user_id,username,access_token,expires_at&id=eq.1');
  if (!row) throw new Error('Threads не подключён: открой /api/threads/auth');
  if (Date.parse(row.expires_at) - Date.now() > REFRESH_BEFORE_MS) return row;
  const fresh = await graph<{ access_token: string; expires_in: number }>('/refresh_access_token', {
    grant_type: 'th_refresh_token',
    access_token: row.access_token,
  });
  await saveThreadsToken(fresh.access_token, fresh.expires_in);
  return { ...row, access_token: fresh.access_token };
}

type ApiPost = { id: string; text?: string; username?: string; timestamp: string; permalink?: string; is_reply_owned_by_me?: boolean; replied_to?: { id: string } };
const POST_FIELDS = 'id,text,username,timestamp,permalink';
const toPost = (item: ApiPost): ThreadsPost => ({
  id: item.id, text: item.text, username: item.username, timestamp: item.timestamp, permalink: item.permalink,
  isMine: item.is_reply_owned_by_me, repliedTo: item.replied_to?.id,
});

interface DraftRow {
  id: string; target_id: string; kind: Draft['kind']; status: DraftStatus; author: string; target_text: string;
  context: string | null; permalink: string | null; draft: string | null; final_text: string | null;
  error: string | null; tg_message_id: number | null; decided_by: string | null;
}
const fromRow = (row: DraftRow): Draft => ({
  id: row.id, targetId: row.target_id, kind: row.kind, status: row.status, author: row.author, targetText: row.target_text,
  context: row.context ?? undefined, permalink: row.permalink ?? undefined, draft: row.draft ?? undefined,
  finalText: row.final_text ?? undefined, error: row.error ?? undefined, tgMessageId: row.tg_message_id ?? undefined,
  decidedBy: row.decided_by ?? undefined,
});
const toRow = (draft: Candidate | Draft) => ({
  target_id: draft.targetId, kind: draft.kind, author: draft.author, target_text: draft.targetText,
  context: draft.context ?? null, permalink: draft.permalink ?? null,
  ...('id' in draft ? {
    status: draft.status, draft: draft.draft ?? null, final_text: draft.finalText ?? null, error: draft.error ?? null,
    tg_message_id: draft.tgMessageId ?? null, decided_by: draft.decidedBy ?? null,
  } : { status: 'writing' }),
});
const inList = (values: string[]) => `(${values.map((value) => `"${value.replace(/["\\]/g, '')}"`).join(',')})`;

let anthropic: Anthropic | undefined;

export function threadsIo(): ThreadsIo {
  // токен читаем лениво: webhook Telegram по кнопке не должен падать, пока Threads не нужен
  let session: Promise<AuthRow> | undefined;
  const token = async () => (session ??= auth());

  return {
    myUsername: process.env.THREADS_USERNAME?.replace(/^@/, '') ?? '',

    async myPosts() {
      const { data } = await graph<{ data: ApiPost[] }>('/v1.0/me/threads', { fields: POST_FIELDS, limit: '10', access_token: (await token()).access_token });
      return data.map(toPost);
    },
    async conversation(postId) {
      const { data } = await graph<{ data: ApiPost[] }>(`/v1.0/${encodeURIComponent(postId)}/conversation`, {
        fields: `${POST_FIELDS},is_reply_owned_by_me,replied_to`, reverse: 'false', access_token: (await token()).access_token,
      });
      return data.map(toPost);
    },
    async mentions() {
      const { user_id: userId, access_token: accessToken } = await token();
      const { data } = await graph<{ data: ApiPost[] }>(`/v1.0/${userId}/mentions`, { fields: POST_FIELDS, limit: '25', access_token: accessToken });
      return data.map(toPost);
    },
    async search(query, since) {
      const { data } = await graph<{ data: ApiPost[] }>('/v1.0/keyword_search', {
        q: query, search_type: 'RECENT', fields: POST_FIELDS, limit: '10',
        since: String(Math.floor(since / 1000)), access_token: (await token()).access_token,
      });
      return data.map(toPost);
    },
    async reply(replyToId, text) {
      const { user_id: userId, access_token: accessToken } = await token();
      const container = await graph<{ id: string }>(`/v1.0/${userId}/threads`, { media_type: 'TEXT', text, reply_to_id: replyToId, access_token: accessToken }, 'POST');
      const publish = () => graph<{ id: string }>(`/v1.0/${userId}/threads_publish`, { creation_id: container.id, access_token: accessToken }, 'POST');
      try {
        return (await publish()).id;
      } catch {
        // Meta советует подождать, пока контейнер обработается; тексту обычно хватает секунд
        await new Promise((resolve) => setTimeout(resolve, 5_000));
        return (await publish()).id;
      }
    },

    async knownTargets(targetIds) {
      const known = new Set<string>();
      for (let index = 0; index < targetIds.length; index += 50) {
        const rows = await supabaseRest<Array<{ target_id: string }>>(`threads_drafts?select=target_id&target_id=in.${encodeURIComponent(inList(targetIds.slice(index, index + 50)))}`);
        for (const row of rows) known.add(row.target_id);
      }
      return known;
    },
    async claim(candidate) {
      const rows = await supabaseRest<DraftRow[]>('threads_drafts?on_conflict=target_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
        body: JSON.stringify(toRow(candidate)),
      });
      return rows[0] ? fromRow(rows[0]) : null;
    },
    async save(draft) {
      await supabaseRest(`threads_drafts?id=eq.${encodeURIComponent(draft.id)}`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(toRow(draft)),
      });
    },
    async transition(id, from, to) {
      const rows = await supabaseRest<Array<{ id: string }>>(`threads_drafts?id=eq.${encodeURIComponent(id)}&status=eq.${from}&select=id`, {
        method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ status: to }),
      });
      return rows.length > 0;
    },
    async find(by) {
      const filter = 'id' in by ? `id=eq.${encodeURIComponent(by.id)}` : `tg_message_id=eq.${by.tgMessageId}`;
      const [row] = await supabaseRest<DraftRow[]>(`threads_drafts?select=*&${filter}&limit=1`);
      return row ? fromRow(row) : null;
    },
    async examples() {
      const rows = await supabaseRest<DraftRow[]>('threads_drafts?select=*&status=in.(published,rejected)&decided_by=not.is.null&order=created_at.desc&limit=30');
      return rows.map(fromRow);
    },
    async searchCommentsSince(since) {
      const rows = await supabaseRest<Array<{ id: string }>>(
        `threads_drafts?select=id&kind=eq.search&status=in.(pending,publishing,published)&created_at=gte.${encodeURIComponent(new Date(since).toISOString())}&limit=1000`,
      );
      return rows.length;
    },

    async write({ system, user }) {
      anthropic ??= new Anthropic();
      const response = await anthropic.beta.messages.create({
        model: process.env.THREADS_AI_MODEL || 'claude-opus-5',
        max_tokens: 4_000,
        output_config: { effort: 'medium' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system,
        messages: [{ role: 'user', content: user }],
      });
      if (response.stop_reason === 'refusal') return 'SKIP';
      return response.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('').trim();
    },
    async telegram(method, body) {
      const result = await callTelegram(method, body);
      if (!result.ok) throw new Error(`telegram ${method}: ${result.description ?? 'failed'}`);
      return result.result;
    },
    isManager,
  };
}
