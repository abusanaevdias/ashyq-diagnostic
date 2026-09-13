'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CRM_STAGES, CRM_STAGE_LABELS, type CrmRecord, type CrmSnapshot, type CrmStage } from '@/lib/crm';
import { EditorialLabel, RedStar, Wordmark } from '@/components/ui/Brand';

const SESSION_KEY = 'ashyq:crm:admin-key';

async function fetchSnapshot(key: string): Promise<CrmSnapshot> {
  const response = await fetch('/api/crm', {
    headers: { 'x-ashyq-admin-key': key },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('access');
  return response.json() as Promise<CrmSnapshot>;
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

export default function CrmDashboard() {
  const [keyInput, setKeyInput] = useState('');
  const [adminKey, setAdminKey] = useState('');
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
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return;
    setLoading(true);
    fetchSnapshot(stored)
      .then((next) => {
        setAdminKey(stored);
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
      const next = await fetchSnapshot(candidate);
      sessionStorage.setItem(SESSION_KEY, candidate);
      setAdminKey(candidate);
      setSnapshot(next);
      setKeyInput('');
    } catch {
      setError('Не удалось открыть CRM. Проверьте ASHYQ_ADMIN_KEY и настройку сервера.');
    } finally {
      setLoading(false);
    }
  }

  async function refresh(key = adminKey) {
    if (!key) return;
    setSnapshot(await fetchSnapshot(key));
  }

  async function updateRecord(runId: string, payload: { stage?: CrmStage; note?: string }) {
    setSavingId(runId);
    setError('');
    try {
      const response = await fetch('/api/crm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-ashyq-admin-key': adminKey },
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

  async function downloadCsv() {
    try {
      const response = await fetch('/api/leads?contacts=1&format=csv', {
        headers: { 'x-ashyq-admin-key': adminKey },
      });
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
    setAdminKey('');
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

  if (!snapshot || !adminKey) {
    return (
      <main className="shell-narrow flex min-h-dvh items-center py-12">
        <section className="card w-full p-6 sm:p-8">
          <Wordmark size="lg" />
          <EditorialLabel num="CRM" className="mt-6">Закрытый раздел</EditorialLabel>
          <h1 className="display mt-4 text-h1">Воронка заявок</h1>
          <p className="mt-4 text-[0.92rem] leading-relaxed text-ink-soft">Введите административный ключ. Он отправляется только в заголовке запроса и хранится до закрытия этой вкладки.</p>
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
    <div className="min-h-dvh">
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
        <EditorialLabel num="01">Обзор воронки</EditorialLabel>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['Лиды', snapshot.stats.total],
            ['С контактом', snapshot.stats.contacts],
            ['Заявки сезона', snapshot.stats.seasonRequests],
            ['Зачислены', snapshot.stats.byStage.enrolled],
          ].map(([label, value]) => (
            <div key={label} className="card p-4"><p className="label text-ink-faint">{label}</p><p className="display mt-2 text-[2rem] text-red">{value}</p></div>
          ))}
        </div>

        <section className="mt-9">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><EditorialLabel num="02">Контакты и диагностики</EditorialLabel><h1 className="display mt-3 text-h2">Рабочая очередь</h1></div>
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
                    <div className="min-w-0"><p className="display truncate text-[1.05rem]">{recordName(record)}</p><p className="mt-1 truncate font-mono text-[0.68rem] text-ink-faint">{record.phone ? `+${record.phone}` : record.runId}</p></div>
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
