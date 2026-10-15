import { handleJevSyntheticRequest } from '@/lib/jev/synthetic-server';

export async function POST(request: Request): Promise<Response> {
  return handleJevSyntheticRequest(request);
}
