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

/** Ответственный менеджер — пользователь Telegram, нажавший «Взял». */
export interface CrmAssignee {
  id: number;
  name: string;
}

export interface CrmEvent {
  id: string;
  runId: string;
  /** delete — запись скрыта из CRM; новая заявка с тем же runId возвращает её */
  type: 'stage_change' | 'note' | 'assign' | 'delete';
  stage?: CrmStage;
  body?: string;
  assignee?: CrmAssignee;
  createdAt: string;
}

export interface CrmActivity {
  id: string;
  type: CrmEvent['type'] | StoredLead['kind'];
  text: string;
  createdAt: string;
}

/** Канал доставки уведомления о лиде. */
export type DeliveryChannel = 'telegram' | 'webhook';

/**
 * Запись outbox-ledger доставки (`.data/lead-deliveries.jsonl`).
 * Append-only: по паре key+channel актуальна запись с максимальным updatedAt.
 */
export interface DeliveryLedgerEntry {
  id: string;
  key: string;
  runId: string;
  channel: DeliveryChannel;
  status: 'sent' | 'failed';
  attempts: number;
  lastError?: string;
  updatedAt: string;
}

/** Срез состояния доставки одного канала для карточки лида в CRM. */
export interface DeliveryStatus {
  channel: DeliveryChannel;
  status: 'sent' | 'failed';
  attempts: number;
  lastError?: string;
  updatedAt: string;
}

/** Идемпотентность повторной отправки: ключ без receivedAt — клиентский ретрай не плодит дублей. */
export function computeDedupeKey(lead: Pick<StoredLead, 'runId' | 'kind' | 'phone' | 'name' | 'answers'>): string {
  // ответы — отдельный ключ: лид без них (старая версия страницы) не должен блокировать досылку с ответами
  return [lead.runId, lead.kind, lead.phone ?? '', lead.name ?? '', ...(lead.answers ? ['answers'] : [])].join('|').slice(0, 200);
}

const RETRY_MAX_ATTEMPTS = 5;
const RETRY_BACKOFF_MS = 5 * 60_000;

/**
 * Политика авто-retry: неудача, не исчерпан лимит попыток, прошло достаточно
 * времени с последней попытки. Чистая функция — покрывается unit-тестом.
 */
export function isRetryDue(status: DeliveryStatus, now: number = Date.now()): boolean {
  if (status.status !== 'failed') return false;
  if (status.attempts >= RETRY_MAX_ATTEMPTS) return false;
  const updatedAt = Date.parse(status.updatedAt);
  if (Number.isNaN(updatedAt)) return true;
  return now - updatedAt >= RETRY_BACKOFF_MS;
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
  /** Ответы диагностики — разбор ошибок строится в карточке (src/lib/mistakes.ts) */
  answers?: Record<string, string | null>;
  source?: string;
  campaign?: string;
  stage: CrmStage;
  assignee?: CrmAssignee;
  firstSeenAt: string;
  lastSeenAt: string;
  activities: CrmActivity[];
  delivery: DeliveryStatus[];
}

/** Шаг воронки: сколько записей прошло через каждый тип лида. */
export interface AnalyticsFunnel {
  diagnostics: number;
  whatsapp: number;
  contacts: number;
  season: number;
}

/** Срез по UTM-источнику: считаем лиды (не записи). */
export interface AnalyticsSourceRow {
  source: string;
  leads: number;
  contacts: number;
  season: number;
}

/** Точка дневного тренда: лиды, полученные за конкретный UTC-день. */
export interface AnalyticsTrendPoint {
  date: string;
  leads: number;
}

export interface AnalyticsStats {
  leadsLast7Days: number;
  funnel: AnalyticsFunnel;
  bySource: AnalyticsSourceRow[];
  last14Days: AnalyticsTrendPoint[];
}

export interface CrmSnapshot {
  records: CrmRecord[];
  stats: {
    total: number;
    contacts: number;
    seasonRequests: number;
    byStage: Record<CrmStage, number>;
    byExam: Record<StoredLead['exam'], number>;
    deliveries: { sent: number; failed: number };
    analytics: AnalyticsStats;
  };
}

function leadActivityText(lead: StoredLead): string {
  if (lead.kind === 'contact') return 'Отправил обращение с сайта';
  if (lead.kind === 'season') return 'Оставил заявку на следующий сезон';
  if (lead.kind === 'whatsapp') return 'Перешёл в WhatsApp';
  return `Завершил диагностику${lead.band ? ` · ${lead.band}` : ''}`;
}

const DAY_MS = 24 * 60 * 60_000;

/**
 * Аналитика CRM (чистая функция): воронка по типам лидов, срез по UTM-источникам
 * и дневной тренд за 14 дней (UTC). Лиды считаются по receivedAt, записи — по firstSeenAt.
 */
export function computeAnalyticsStats(leads: StoredLead[], records: CrmRecord[], now: number = Date.now()): AnalyticsStats {
  const funnel: AnalyticsFunnel = {
    diagnostics: records.filter((record) => record.activities.some((activity) => activity.type === 'result')).length,
    whatsapp: records.filter((record) => record.activities.some((activity) => activity.type === 'whatsapp')).length,
    contacts: records.filter((record) => record.activities.some((activity) => activity.type === 'contact')).length,
    season: records.filter((record) => record.activities.some((activity) => activity.type === 'season')).length,
  };

  const bySource = new Map<string, AnalyticsSourceRow>();
  for (const lead of leads) {
    const source = lead.utm?.utm_source;
    if (!source) continue;
    const row = bySource.get(source) ?? { source, leads: 0, contacts: 0, season: 0 };
    row.leads += 1;
    if (lead.kind === 'contact') row.contacts += 1;
    if (lead.kind === 'season') row.season += 1;
    bySource.set(source, row);
  }
  const sourceRows = [...bySource.values()].sort((a, b) => b.leads - a.leads || a.source.localeCompare(b.source));

  const today = new Date(now).toISOString().slice(0, 10);
  const leadsPerDay = new Map<string, number>();
  for (const lead of leads) {
    const day = lead.receivedAt.slice(0, 10);
    leadsPerDay.set(day, (leadsPerDay.get(day) ?? 0) + 1);
  }
  const last14Days: AnalyticsTrendPoint[] = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const day = new Date(Date.parse(`${today}T00:00:00.000Z`) - offset * DAY_MS).toISOString().slice(0, 10);
    last14Days.push({ date: day, leads: leadsPerDay.get(day) ?? 0 });
  }

  const weekCutoff = now - 7 * DAY_MS;
  const leadsLast7Days = records.filter((record) => Date.parse(record.firstSeenAt) >= weekCutoff).length;

  return { leadsLast7Days, funnel, bySource: sourceRows, last14Days };
}

export function buildCrmSnapshot(
  leads: StoredLead[],
  events: CrmEvent[],
  deliveries: DeliveryLedgerEntry[] = [],
): CrmSnapshot {
  // Удаление — событие, а не стирание строк: хранилище append-only (файл/Supabase без права delete).
  // Запись скрыта, если удалена позже последней заявки по этому runId (CRM-DELETE-001).
  const lastLeadAt = new Map<string, string>();
  for (const lead of leads) {
    if (lead.receivedAt > (lastLeadAt.get(lead.runId) ?? '')) lastLeadAt.set(lead.runId, lead.receivedAt);
  }
  const deleted = new Set(
    events.filter((event) => event.type === 'delete' && event.createdAt >= (lastLeadAt.get(event.runId) ?? '')).map((event) => event.runId),
  );
  if (deleted.size > 0) {
    leads = leads.filter((lead) => !deleted.has(lead.runId));
    events = events.filter((event) => !deleted.has(event.runId));
  }

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
      delivery: [],
    };

    for (const lead of orderedLeads) {
      record.exam = lead.exam;
      record.kind = lead.kind;
      for (const key of ['name', 'phone', 'grade', 'target', 'plannedWhen', 'band', 'level', 'strongest', 'weakest'] as const) {
        if (lead[key] !== undefined) record[key] = lead[key];
      }
      if (lead.correct !== undefined) record.correct = lead.correct;
      if (lead.total !== undefined) record.total = lead.total;
      if (lead.answers) record.answers = lead.answers;
      if (lead.utm?.utm_source) record.source = lead.utm.utm_source;
      if (lead.utm?.utm_campaign) record.campaign = lead.utm.utm_campaign;
      // досылка ответов к той же диагностике — не новое событие в ленте
      if (lead.kind === 'result' && record.activities.some((activity) => activity.type === 'result')) continue;
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
      if (event.type === 'assign' && event.assignee) record.assignee = event.assignee;
      record.activities.push({
        id: event.id,
        type: event.type,
        text:
          event.type === 'stage_change' && event.stage
            ? `Этап изменён: ${CRM_STAGE_LABELS[event.stage]}`
            : event.type === 'assign'
              ? `Взял в работу: ${event.assignee?.name ?? '—'}`
              : event.body ?? 'Заметка',
        createdAt: event.createdAt,
      });
      if (event.createdAt > record.lastSeenAt) record.lastSeenAt = event.createdAt;
    }

    record.activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    // Актуальное состояние доставки по каждому каналу: ключ | канал → последняя запись.
    const channelState = new Map<DeliveryChannel, DeliveryStatus>();
    for (const entry of deliveries) {
      if (entry.runId !== runId) continue;
      const current = channelState.get(entry.channel);
      if (!current || entry.updatedAt >= current.updatedAt) {
        channelState.set(entry.channel, {
          channel: entry.channel,
          status: entry.status,
          attempts: entry.attempts,
          lastError: entry.lastError,
          updatedAt: entry.updatedAt,
        });
      }
    }
    record.delivery = [...channelState.values()].sort((a, b) => a.channel.localeCompare(b.channel));
    records.push(record);
  }

  records.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
  const byStage = Object.fromEntries(CRM_STAGES.map((stage) => [stage, 0])) as Record<CrmStage, number>;
  const byExam: Record<StoredLead['exam'], number> = { sat: 0, ielts: 0 };
  for (const record of records) {
    byStage[record.stage] += 1;
    byExam[record.exam] += 1;
  }
  // Статистика доставки считается по актуальному состоянию каждого канала.
  const deliveryStates = records.flatMap((record) => record.delivery);
  const deliveries_stats = {
    sent: deliveryStates.filter((item) => item.status === 'sent').length,
    failed: deliveryStates.filter((item) => item.status === 'failed').length,
  };

  return {
    records,
    stats: {
      total: records.length,
      contacts: records.filter((record) => Boolean(record.phone)).length,
      seasonRequests: records.filter((record) => record.kind === 'season').length,
      byStage,
      byExam,
      deliveries: deliveries_stats,
      analytics: computeAnalyticsStats(leads, records),
    },
  };
}
