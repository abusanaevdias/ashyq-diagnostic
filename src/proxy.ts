import { NextResponse, type NextRequest } from 'next/server';
import { AGENT_LINKS, HOME_MARKDOWN, markdownResponse, prefersMarkdown } from './lib/agent-content';

export function proxy(request: NextRequest) {
  const read = request.method === 'GET' || request.method === 'HEAD';
  const markdown = read && prefersMarkdown(request.headers.get('accept'));
  if (request.nextUrl.pathname === '/' && markdown) {
    return markdownResponse(HOME_MARKDOWN, 200, request.method === 'HEAD');
  }

  const headers = new Headers(request.headers);
  // Overwrite caller-supplied markers. Only negotiated reads activate fallback.
  headers.set('x-ashyq-markdown', markdown ? '1' : '0');
  const response = NextResponse.next({ request: { headers } });
  if (read) response.headers.set('Vary', 'Accept');
  if (request.nextUrl.pathname === '/') {
    response.headers.set('Link', `</index.md>; rel="alternate"; type="text/markdown", ${AGENT_LINKS}`);
  }
  return response;
}

export const config = { matcher: '/((?!_next/).*)' };
