import { AGENT_INSTRUCTIONS, markdownResponse } from '@/lib/agent-content';
export function GET() { return markdownResponse(AGENT_INSTRUCTIONS); }
export function HEAD() { return markdownResponse(AGENT_INSTRUCTIONS, 200, true); }
