import { DEVELOPER_DOCS, markdownResponse } from '@/lib/agent-content';
export function GET() { return markdownResponse(DEVELOPER_DOCS); }
export function HEAD() { return markdownResponse(DEVELOPER_DOCS, 200, true); }
