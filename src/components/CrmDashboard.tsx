'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CRM_STAGES, CRM_STAGE_LABELS, type CrmRecord, type CrmSnapshot, type CrmStage } from '@/lib/crm';
import { EditorialLabel, RedStar, Wordmark } from '@/components/ui/Brand';

const SESSION_KEY = 'ashyq:crm:admin-key';
/** Вход аккаунтом ASHYQ (CRM-PROD-001) — только когда сайт работает с Supabase Auth. */
const ACCOUNT_LOGIN = process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase';
const NO_CRM_ROLE = 'Нет доступа к CRM — роль выдаёт администратор.';

type AuthHeaders = Record<string, string>;

async function fetchSnapshot(headers: AuthHeaders): Promise<CrmSnapshot> {
  const response = await fetch('/api/crm', { headers, cache: 'no-store' });
  if (!response.ok) throw new Error('access');
  return response.json() as Promise<CrmSnapshot>;
}

/** Access token сессии Supabase как Bearer; null — в аккаунт не вошли. supabase-js грузится только здесь. */
async function accountHeaders(): Promise<AuthHeaders | null> {
  const { getAuth } = await import('@/lib/lms/auth');
  const token = await getAuth().accessToken?.();
  return token ? { authorization: `Bearer ${token}` } : null;
}

/** Запуск как Telegram Mini App: Telegram кладёт подписанный initData в hash адреса. */
function telegramInitData(): string {
  return new URLSearchParams(window.location.hash.slice(1)).get('tgWebAppData') ?? '';
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function recordName(record: CrmRecord): string {
  return record.name || record.phone || `Аноним · ${record.runId.slice(0, 8)}`;
}

/** Конверсия шага воронки к предыдущему: N/prev в %, иначе прочерк. */
function funnelConversion(value: number, prev: number): string {
  return prev > 0 ? `${Math.round((value / prev) * 100)}%` : '—';
}

export default function CrmDashboard() {
  const router = useRouter();
  const [keyInput, setKeyInput] = useState('');
  const [auth, setAuth] = useState<AuthHeaders | null>(null);
  const [snapshot, setSnapshot] = useState<CrmSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState<'all' | CrmStage>('all');
  const [visibleCount, setVisibleCount] = useState(12);
  const [selectedId, setSelectedId] = useState('');
  const [note, setNote] = useState('');
  const [savingId, setSavingId] = useState('');

  useEffect(() => {
    const initData = telegramInitData();
    if (initData) {
      const headers = { 'x-telegram-init-data': initData };
      // runId из кнопки «Открыть в CRM» под заявкой — сразу её карточка
      const runId = new URLSearchParams(initData).get('start_param') ?? '';
      setLoading(true);
      fetchSnapshot(headers)
        .then((next) => {
          setAuth(headers);
          setSnapshot(next);
          if (runId) {
            setSearch(runId);
            setSelectedId(runId);
          }
        })
        .catch(() => setError('Нет доступа: CRM в Telegram открывается только участникам группы с заявками.'))
        .finally(() => setLoading(false));
      return;
    }

    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) {
      // уже вошли в аккаунт ASHYQ (например, вернулись с /login) — CRM открывается сама
      if (ACCOUNT_LOGIN) {
        accountHeaders()
          .then(async (headers) => {
            if (!headers) return;
            setSnapshot(await fetchSnapshot(headers));
            setAuth(headers);
          })
          .catch(() => setError(NO_CRM_ROLE));
      }
      return;
    }
    setLoading(true);
    fetchSnapshot({ 'x-ashyq-admin-key': stored })
      .then((next) => {
        setAuth({ 'x-ashyq-admin-key': stored });
        setSnapshot(next);
      })
      .catch(() => sessionStorage.removeItem(SESSION_KEY))
      .finally(() => setLoading(false));
  }, []);

  async function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = keyInput.trim();
    if (!candidate) return;
    setLoading(true);
    setError('');
    try {
      const next = await fetchSnapshot({ 'x-ashyq-admin-key': candidate });
      sessionStorage.setItem(SESSION_KEY, candidate);
      setAuth({ 'x-ashyq-admin-key': candidate });
      setSnapshot(next);
      setKeyInput('');
    } catch {
      setError('Не удалось открыть CRM. Проверьте ASHYQ_ADMIN_KEY и настройку сервера.');
    } finally {
      setLoading(false);
    }
  }

  async function unlockWithAccount() {
    setLoading(true);
    setError('');
    try {
      const headers = await accountHeaders();
      if (!headers) {
        router.push('/login?next=/crm');
        return;
      }
      setSnapshot(await fetchSnapshot(headers));
      setAuth(headers);
    } catch {
      setError(NO_CRM_ROLE);
    } finally {
      setLoading(false);
    }
  }

  // access token живёт час: supabase-js обновляет его сам, забираем свежий раз в минуту
  const accountMode = Boolean(auth?.authorization);
  useEffect(() => {
    if (!accountMode) return;
    const timer = window.setInterval(() => {
      void accountHeaders().then((headers) => headers && setAuth(headers));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [accountMode]);

  async function refresh() {
    if (!auth) return;
    setSnapshot(await fetchSnapshot(auth));
  }

  async function updateRecord(runId: string, payload: { stage?: CrmStage; note?: string; action?: string }) {
    setSavingId(runId);
    setError('');
    try {
      const response = await fetch('/api/crm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({ runId, ...payload }),
      });
      if (!response.ok) throw new Error('save');
      await refresh();
      if (payload.note) setNote('');
    } catch {
      setError('Изменение не сохранилось. Обновите страницу и попробуйте ещё раз.');
    } finally {
      setSavingId('');
    }
  }

  async function retryDelivery(runId: string) {
    await updateRecord(runId, { action: 'retry-delivery' });
  }

  async function downloadCsv() {
    try {
      const response = await fetch('/api/leads?contacts=1&format=csv', { headers: auth ?? {} });
      if (!response.ok) throw new Error('download');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ashyq-leads.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Не удалось подготовить CSV.');
    }
  }

  function lock() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuth(null);
    setSnapshot(null);
    setSelectedId('');
  }

  const records = useMemo(() => {
    if (!snapshot) return [];
    const needle = search.trim().toLowerCase();
    return snapshot.records.filter((record) => {
      if (stage !== 'all' && record.stage !== stage) return false;
      if (!needle) return true;
      return [record.name, record.phone, record.grade, record.exam, record.band, record.source, record.campaign, record.runId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [search, snapshot, stage]);

  if (!snapshot || !auth) {
    return (
      <main className="v3 shell-narrow flex min-h-dvh items-center py-12">
        <section className="card w-full p-6 sm:p-8">
          <Wordmark size="lg" />
          <EditorialLabel className="mt-6">Закрытый раздел</EditorialLabel>
          <h1 className="display mt-4 text-h1">Воронка заявок</h1>
          {ACCOUNT_LOGIN ? (
            <button className="btn btn-ink mt-6" type="button" onClick={() => void unlockWithAccount()} disabled={loading}>Войти аккаунтом ASHYQ</button>
          ) : null}
          <p className="mt-4 text-[0.92rem] leading-relaxed text-ink-soft">{ACCOUNT_LOGIN ? 'Или введите' : 'Введите'} административный ключ. Он отправляется только в заголовке запроса и хранится до закрытия этой вкладки.</p>
          <form className="mt-6" onSubmit={unlock}>
            <label className="label text-ink-faint" htmlFor="crm-key">ASHYQ admin key</label>
            <input id="crm-key" className="field mt-1.5" type="password" autoComplete="current-password" value={keyInput} onChange={(event) => setKeyInput(event.target.value)} required />
            <button className="btn btn-primary mt-4" type="submit" disabled={loading}>{loading ? 'Проверяем…' : 'Открыть CRM'}</button>
          </form>
          {error ? <p role="alert" className="mt-4 border border-red/40 bg-red/5 p-3 text-[0.85rem] text-red">{error}</p> : null}
          <Link href="/" className="btn btn-quiet mt-4">Вернуться на сайт</Link>
        </section>
      </main>
    );
  }

  return (
    <div className="v3 min-h-dvh">
      <header className="border-b border-line bg-paper-card">
        <div className="shell-wide flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4"><Wordmark size="md" /><span className="label text-ink-faint">CRM · Leads</span></div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-quiet btn-small" onClick={downloadCsv}>Скачать CSV</button>
            <button type="button" className="btn btn-outline btn-small" onClick={lock}>Закрыть</button>
          </div>
        </div>
      </header>

      <main className="shell-wide py-8 sm:py-10">
        <EditorialLabel>Обзор воронки</EditorialLabel>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['Лиды', snapshot.stats.total],
            ['С контактом', snapshot.stats.contacts],
            ['Заявки сезона', snapshot.stats.seasonRequests],
            ['Зачислены', snapshot.stats.byStage.enrolled],
            ...(snapshot.stats.deliveries.failed > 0
              ? [['Не доставлено', snapshot.stats.deliveries.failed] as const]
              : []),
          ].map(([label, value]) => (
            <div key={label} className="card p-4"><p className="label text-ink-faint">{label}</p><p className="display mt-2 text-[2rem] text-red">{value}</p></div>
          ))}
        </div>

        <section className="mt-9">
          <EditorialLabel>Аналитика</EditorialLabel>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Диагностики', value: snapshot.stats.analytics.funnel.diagnostics },
              { label: 'В WhatsApp', value: snapshot.stats.analytics.funnel.whatsapp },
              { label: 'Обращения', value: snapshot.stats.analytics.funnel.contacts },
              { label: 'Заявки на сезон', value: snapshot.stats.analytics.funnel.season },
            ].map((step, index, steps) => {
              const prev = index > 0 ? steps[index - 1].value : 0;
              return (
                <div key={step.label} className="card p-4">
                  <p className="label text-ink-faint">{step.label}</p>
                  <p className="display mt-2 text-[2rem] text-red">{step.value}</p>
                  <p className="mt-1 text-[0.72rem] text-ink-faint">Конверсия: {index === 0 ? '—' : funnelConversion(step.value, prev)}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="card p-4">
              <p className="label text-ink-faint">Лиды за 14 дней</p>
              <div className="mt-4 flex h-32 items-end gap-1.5" role="img" aria-label={`Лиды за 14 дней: всего ${snapshot.stats.analytics.last14Days.reduce((sum, point) => sum + point.leads, 0)}`}>
                {(() => {
                  const max = Math.max(...snapshot.stats.analytics.last14Days.map((item) => item.leads), 1);
                  return snapshot.stats.analytics.last14Days.map((point) => {
                    const height = Math.max(Math.round((point.leads / max) * 100), point.leads > 0 ? 6 : 2);
                    return (
                      <div key={point.date} className="flex h-full flex-1 flex-col justify-end" title={`${point.date}: ${point.leads}`}>
                        <div className="w-full bg-red" style={{ height: `${height}%` }} />
                      </div>
                    );
                  });
                })()}
              </div>
              <p className="mt-2 flex justify-between font-mono text-[0.64rem] text-ink-faint">
                <span>{snapshot.stats.analytics.last14Days[0]?.date}</span>
                <span>{snapshot.stats.analytics.last14Days[snapshot.stats.analytics.last14Days.length - 1]?.date}</span>
              </p>
            </div>
            <div className="card p-4">
              <p className="label text-ink-faint">Источники</p>
              <table className="mt-3 w-full text-[0.86rem]">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="label py-2 font-medium text-ink-faint">Источник</th>
                    <th scope="col" className="label py-2 text-right font-medium text-ink-faint">Лиды</th>
                    <th scope="col" className="label py-2 text-right font-medium text-ink-faint">Обращения</th>
                    <th scope="col" className="label py-2 text-right font-medium text-ink-faint">Заявки сезона</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.stats.analytics.bySource.slice(0, 5).map((row) => (
                    <tr key={row.source} className="border-b border-line/60">
                      <td className="max-w-[10rem] truncate py-2 font-semibold">{row.source}</td>
                      <td className="py-2 text-right">{row.leads}</td>
                      <td className="py-2 text-right">{row.contacts}</td>
                      <td className="py-2 text-right">{row.season}</td>
                    </tr>
                  ))}
                  {snapshot.stats.analytics.bySource.length === 0 ? (
                    <tr><td colSpan={4} className="py-3 text-ink-soft">UTM-меток пока нет</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mt-9">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><EditorialLabel>Контакты и диагностики</EditorialLabel><h1 className="display mt-3 text-h2">Рабочая очередь</h1></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label text-ink-faint" htmlFor="crm-search">Поиск</label><input id="crm-search" className="field mt-1.5 min-h-[46px]" value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(12); }} placeholder="Имя, телефон, источник" /></div>
              <div><label className="label text-ink-faint" htmlFor="crm-stage">Этап</label><select id="crm-stage" className="field mt-1.5 min-h-[46px]" value={stage} onChange={(event) => { setStage(event.target.value as 'all' | CrmStage); setVisibleCount(12); }}><option value="all">Все этапы</option>{CRM_STAGES.map((item) => <option key={item} value={item}>{CRM_STAGE_LABELS[item]} · {snapshot.stats.byStage[item]}</option>)}</select></div>
            </div>
          </div>

          {error ? <p role="alert" className="mt-4 border border-red/40 bg-red/5 p-3 text-[0.85rem] text-red">{error}</p> : null}

          {records.length === 0 ? (
            <div className="card mt-6 p-8 text-center"><RedStar className="mx-auto h-4 w-4 text-red" /><h2 className="display mt-4 text-h3">Ничего не найдено</h2><p className="mt-2 text-ink-soft">Измените фильтр или дождитесь первой заявки.</p></div>
          ) : (
            <div className="mt-6 space-y-3">
              {records.slice(0, visibleCount).map((record) => (
                <article key={record.runId} className="card overflow-hidden">
                  <div className="grid items-center gap-4 p-4 md:grid-cols-[minmax(0,1.5fr)_0.7fr_0.8fr_1fr_auto]">
                    <div className="min-w-0"><p className="display truncate text-[1.05rem]">{recordName(record)}</p><p className="mt-1 truncate font-mono text-[0.68rem] text-ink-faint">{record.phone ? `+${record.phone}` : record.runId}</p>{record.assignee ? <p className="mt-1 truncate text-[0.7rem] text-ink-soft">Взял: {record.assignee.name}</p> : null}{record.delivery.some((item) => item.status === 'failed') ? <p className="mt-1 text-[0.7rem] font-semibold text-red">Не доставлено: {record.delivery.filter((item) => item.status === 'failed').map((item) => item.channel).join(', ')}</p> : null}</div>
                    <div><p className="label text-ink-faint">Экзамен</p><p className="mt-1 font-semibold uppercase">{record.exam}</p></div>
                    <div><p className="label text-ink-faint">Результат</p><p className="mt-1 font-semibold">{record.band ?? '—'}</p></div>
                    <div>
                      <label className="sr-only" htmlFor={`stage-${record.runId}`}>Этап для {recordName(record)}</label>
                      <select id={`stage-${record.runId}`} className="field min-h-[42px] py-2 text-[0.86rem]" value={record.stage} disabled={savingId === record.runId} onChange={(event) => updateRecord(record.runId, { stage: event.target.value as CrmStage })}>{CRM_STAGES.map((item) => <option key={item} value={item}>{CRM_STAGE_LABELS[item]}</option>)}</select>
                    </div>
                    <button type="button" className="btn btn-quiet btn-small" aria-expanded={selectedId === record.runId} onClick={() => { setNote(''); setSelectedId(selectedId === record.runId ? '' : record.runId); }}>История</button>
                  </div>
                  {selectedId === record.runId ? (
                    <div className="grid gap-6 border-t border-line bg-paper-deep/35 p-4 lg:grid-cols-2">
                      <div>
                        <p className="label text-ink-faint">Карточка</p>
                        <dl className="mt-3 grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 text-[0.86rem]">
                          <dt className="text-ink-faint">Класс</dt><dd>{record.grade ?? '—'}</dd>
                          <dt className="text-ink-faint">Цель</dt><dd>{record.target ?? '—'}</dd>
                          <dt className="text-ink-faint">Слабее всего</dt><dd>{record.weakest ?? '—'}</dd>
                          <dt className="text-ink-faint">Источник</dt><dd>{record.source ?? '—'}{record.campaign ? ` · ${record.campaign}` : ''}</dd>
                          <dt className="text-ink-faint">Первый контакт</dt><dd>{formatDate(record.firstSeenAt)}</dd>
                          <dt className="text-ink-faint">Доставка</dt>
                          <dd>
                            {record.delivery.length === 0
                              ? 'каналы не настроены'
                              : record.delivery.map((item) => (
                                <span key={item.channel} className={item.status === 'sent' ? 'mr-3 inline-block text-[0.8rem] text-ink' : 'mr-3 inline-block text-[0.8rem] font-semibold text-red'}>
                                  {item.channel === 'telegram' ? 'Telegram' : 'Webhook'}: {item.status === 'sent' ? 'отправлено' : `не доставлено (${item.attempts})`}
                                </span>
                              ))}
                            {record.delivery.some((item) => item.status === 'failed') ? (
                              <button type="button" className="btn btn-outline btn-small mt-2" disabled={savingId === record.runId} onClick={() => void retryDelivery(record.runId)}>
                                Повторить доставку
                              </button>
                            ) : null}
                          </dd>
                        </dl>
                        {record.phone ? <a className="btn btn-ink mt-5" href={`https://wa.me/${record.phone}`} target="_blank" rel="noopener noreferrer">Открыть WhatsApp</a> : null}
                      </div>
                      <div>
                        <p className="label text-ink-faint">Лента активности</p>
                        <ol className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-2">
                          {record.activities.map((activity) => <li key={activity.id} className="border-l-2 border-line pl-3"><p className="text-[0.86rem] text-ink">{activity.text}</p><time className="font-mono text-[0.64rem] text-ink-faint">{formatDate(activity.createdAt)}</time></li>)}
                        </ol>
                        <form className="mt-4" onSubmit={(event) => { event.preventDefault(); if (note.trim()) void updateRecord(record.runId, { note }); }}>
                          <label className="label text-ink-faint" htmlFor={`note-${record.runId}`}>Добавить заметку</label>
                          <textarea id={`note-${record.runId}`} className="field mt-1.5 min-h-24 resize-y" maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} />
                          <button type="submit" className="btn btn-primary btn-small mt-3" disabled={!note.trim() || savingId === record.runId}>Сохранить заметку</button>
                        </form>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
              {records.length > visibleCount ? (
                <button type="button" className="btn btn-outline mt-5" onClick={() => setVisibleCount((count) => count + 12)}>
                  Показать ещё · {records.length - visibleCount}
                </button>
              ) : null}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
