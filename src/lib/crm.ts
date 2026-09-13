import type { StoredLead } from './lead-server';

export const CRM_STAGES = ['new', 'contacted', 'consultation', 'enrolled', 'lost'] as const;
export type CrmStage = (typeof CRM_STAGES)[number];

export const CRM_STAGE_LABELS: Record<CrmStage, string> = {
  new: 'Новый',
  contacted: 'Связались',
  consultation: 'Разбор назначен',
  enrolled: 'Зачислен',
  lost: 'Неактуально',
};

export interface CrmEvent {
  id: string;
  runId: string;
  type: 'stage_change' | 'note';
  stage?: CrmStage;
  body?: string;
  createdAt: string;
}

export interface CrmActivity {
  id: string;
  type: CrmEvent['type'] | StoredLead['kind'];
  text: string;
  createdAt: string;
}

export interface CrmRecord {
  runId: string;
  exam: StoredLead['exam'];
  kind: StoredLead['kind'];
  name?: string;
  phone?: string;
  grade?: string;
  target?: string;
  plannedWhen?: string;
  band?: string;
  level?: string;
  correct?: number;
  total?: number;
  strongest?: string;
  weakest?: string;
  source?: string;
  campaign?: string;
  stage: CrmStage;
  firstSeenAt: string;
  lastSeenAt: string;
  activities: CrmActivity[];
}

export interface CrmSnapshot {
  records: CrmRecord[];
  stats: {
    total: number;
    contacts: number;
    seasonRequests: number;
    byStage: Record<CrmStage, number>;
    byExam: Record<StoredLead['exam'], number>;
  };
}

function leadActivityText(lead: StoredLead): string {
  if (lead.kind === 'contact') return 'Отправил обращение с сайта';
  if (lead.kind === 'season') return 'Оставил заявку на следующий сезон';
  if (lead.kind === 'whatsapp') return 'Перешёл в WhatsApp';
  return `Завершил диагностику${lead.band ? ` · ${lead.band}` : ''}`;
}

export function buildCrmSnapshot(leads: StoredLead[], events: CrmEvent[]): CrmSnapshot {
  const grouped = new Map<string, StoredLead[]>();
  for (const lead of leads) {
    const list = grouped.get(lead.runId) ?? [];
    list.push(lead);
    grouped.set(lead.runId, list);
  }

  const eventsByRun = new Map<string, CrmEvent[]>();
  for (const event of events) {
    const list = eventsByRun.get(event.runId) ?? [];
    list.push(event);
    eventsByRun.set(event.runId, list);
  }

  const records: CrmRecord[] = [];
  for (const [runId, runLeads] of grouped) {
    const orderedLeads = [...runLeads].sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));
    const first = orderedLeads[0];
    const last = orderedLeads[orderedLeads.length - 1];
    const record: CrmRecord = {
      runId,
      exam: last.exam,
      kind: last.kind,
      stage: 'new',
      firstSeenAt: first.receivedAt,
      lastSeenAt: last.receivedAt,
      activities: [],
    };

    for (const lead of orderedLeads) {
      record.exam = lead.exam;
      record.kind = lead.kind;
      for (const key of ['name', 'phone', 'grade', 'target', 'plannedWhen', 'band', 'level', 'strongest', 'weakest'] as const) {
        if (lead[key] !== undefined) record[key] = lead[key];
      }
      if (lead.correct !== undefined) record.correct = lead.correct;
      if (lead.total !== undefined) record.total = lead.total;
      if (lead.utm?.utm_source) record.source = lead.utm.utm_source;
      if (lead.utm?.utm_campaign) record.campaign = lead.utm.utm_campaign;
      record.activities.push({
        id: `${runId}:${lead.receivedAt}:${lead.kind}`,
        type: lead.kind,
        text: leadActivityText(lead),
        createdAt: lead.receivedAt,
      });
    }

    const runEvents = [...(eventsByRun.get(runId) ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    for (const event of runEvents) {
      if (event.type === 'stage_change' && event.stage) record.stage = event.stage;
      record.activities.push({
        id: event.id,
        type: event.type,
        text:
          event.type === 'stage_change' && event.stage
            ? `Этап изменён: ${CRM_STAGE_LABELS[event.stage]}`
            : event.body ?? 'Заметка',
        createdAt: event.createdAt,
      });
      if (event.createdAt > record.lastSeenAt) record.lastSeenAt = event.createdAt;
    }

    record.activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    records.push(record);
  }

  records.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
  const byStage = Object.fromEntries(CRM_STAGES.map((stage) => [stage, 0])) as Record<CrmStage, number>;
  const byExam: Record<StoredLead['exam'], number> = { sat: 0, ielts: 0 };
  for (const record of records) {
    byStage[record.stage] += 1;
    byExam[record.exam] += 1;
  }

  return {
    records,
    stats: {
      total: records.length,
      contacts: records.filter((record) => Boolean(record.phone)).length,
      seasonRequests: records.filter((record) => record.kind === 'season').length,
      byStage,
      byExam,
    },
  };
}
