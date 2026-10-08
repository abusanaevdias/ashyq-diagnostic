import { LLMS_TXT, markdownResponse } from '@/lib/agent-content';
export function GET() { return markdownResponse(LLMS_TXT); }
export function HEAD() { return markdownResponse(LLMS_TXT, 200, true); }
