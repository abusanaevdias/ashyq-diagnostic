import { handleJevLocalPreviewRequest } from '@/lib/jev/synthetic-server';

export async function POST(request: Request): Promise<Response> {
  return handleJevLocalPreviewRequest(request);
}
