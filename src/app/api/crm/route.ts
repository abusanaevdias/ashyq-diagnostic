import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { CRM_STAGES, type CrmEvent, type CrmStage } from '@/lib/crm';
import { appendCrmEvents, readCrmSnapshot, retryRunDeliveries } from '@/lib/crm-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function denied(): NextResponse {
  return new NextResponse('Not found', { status: 404 });
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) return denied();
  return NextResponse.json(await readCrmSnapshot(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function PATCH(request: Request) {
  if (!(await isAuthorized(request))) return denied();

  const raw = await request.text();
  if (raw.length > 4_000) return NextResponse.json({ ok: false }, { status: 413 });

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('bad shape');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const runId = typeof body.runId === 'string' ? body.runId.trim().slice(0, 64) : '';
  const stage = typeof body.stage === 'string' && CRM_STAGES.includes(body.stage as CrmStage)
    ? (body.stage as CrmStage)
    : undefined;
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 1_000) : '';
  const retryDelivery = body.action === 'retry-delivery';
  if (!runId || (!stage && !note && !retryDelivery)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const snapshot = await readCrmSnapshot();
  if (!snapshot.records.some((record) => record.runId === runId)) return denied();

  if (retryDelivery) {
    await retryRunDeliveries(runId);
    return NextResponse.json({ ok: true });
  }

  const createdAt = new Date().toISOString();
  const events: CrmEvent[] = [];
  if (stage) events.push({ id: randomUUID(), runId, type: 'stage_change', stage, createdAt });
  if (note) events.push({ id: randomUUID(), runId, type: 'note', body: note, createdAt });
  await appendCrmEvents(events);

  return NextResponse.json({ ok: true });
}
