// Tiny Fish Audio client. The API key is never stored in the repo: it comes from
// FISH_API_KEY or ~/.secrets/fish_audio_key (outside the repository).
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export function apiKey() {
  if (process.env.FISH_API_KEY) return process.env.FISH_API_KEY.trim();
  const file = join(homedir(), '.secrets', 'fish_audio_key');
  if (existsSync(file)) return readFileSync(file, 'utf8').trim();
  throw new Error('Set FISH_API_KEY or put the key into ~/.secrets/fish_audio_key');
}

const BASE = 'https://api.fish.audio';

export async function searchVoices({ language, title = '', pageSize = 10 }) {
  const q = new URLSearchParams({ page_size: String(pageSize), page_number: '1', sort_by: 'score' });
  if (language) q.set('language', language);
  if (title) q.set('title', title);
  const res = await fetch(`${BASE}/model?${q}`, { headers: { Authorization: `Bearer ${apiKey()}` } });
  if (!res.ok) throw new Error(`model search ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.items || []).map((m) => ({ id: m._id, title: m.title, languages: m.languages, likes: m.like_count, uses: m.task_count, sample: m.samples?.[0]?.audio }));
}

export async function tts({ text, voice, model = process.env.FISH_MODEL || 's1', speed = 1 }) {
  const res = await fetch(`${BASE}/v1/tts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json', model },
    body: JSON.stringify({ text, reference_id: voice, format: 'mp3', mp3_bitrate: 192, normalize: true, latency: 'normal', prosody: { speed } }),
  });
  if (!res.ok) throw new Error(`tts ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}
