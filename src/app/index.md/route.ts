import { HOME_MARKDOWN, markdownResponse } from '@/lib/agent-content';
export function GET() { return markdownResponse(HOME_MARKDOWN); }
export function HEAD() { return markdownResponse(HOME_MARKDOWN, 200, true); }
