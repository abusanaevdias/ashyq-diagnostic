import { markdownResponse, NOT_FOUND_MARKDOWN } from '@/lib/agent-content';

export function GET() { return markdownResponse(NOT_FOUND_MARKDOWN, 404); }
export function HEAD() { return markdownResponse(NOT_FOUND_MARKDOWN, 404, true); }
