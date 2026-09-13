import 'server-only';
import { timingSafeEqual } from 'node:crypto';

function safeEqual(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ASHYQ_ADMIN_KEY);
}

export function hasValidAdminKey(request: Request): boolean {
  const expected = process.env.ASHYQ_ADMIN_KEY;
  if (!expected) return false;

  const url = new URL(request.url);
  const provided =
    request.headers.get('x-ashyq-admin-key') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    url.searchParams.get('key') ??
    '';

  return Boolean(provided) && safeEqual(provided, expected);
}
