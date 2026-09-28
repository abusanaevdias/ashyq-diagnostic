'use client';

import { useId, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CLUB_OFFER, enrolmentMessage, PLANNED_GROUPS, PREFERRED_WINDOWS, PROGRAM_LABELS, WEEKDAYS, type EnrolmentProgram } from '@/data/club-offer';
import { WHATSAPP_NUMBER } from '@/lib/config';
import { ArrowIcon, MicroLabel } from './ui/CleanUi';
import ui from './ui/CleanUi.module.css';
import styles from './EnrollmentPlanner.module.css';

export default function EnrollmentPlanner({ fixedProgram }: { fixedProgram?: EnrolmentProgram }) {
  const id = useId();
  const [chosenProgram, setProgram] = useState<EnrolmentProgram>('ielts');
  const [days, setDays] = useState<string[]>([]);
  const [time, setTime] = useState(PREFERRED_WINDOWS[0]);
  const [groupId, setGroupId] = useState(PLANNED_GROUPS[0].id);
  const [error, setError] = useState(false);
  const program = fixedProgram ?? chosenProgram;
  function submit(event: FormEvent<HTMLFormElement>) {
    if (!days.length) { event.preventDefault(); setError(true); }
  }
  return (
    <section className={styles.panel} aria-labelledby={`${id}-heading`}>
      <div className={styles.intro}>
        <MicroLabel>Запись в ASHYQ</MicroLabel>
        <h2 id={`${id}-heading`} className={styles.title}>{program === 'mentoring' ? 'Выберите время для связи' : 'Вечерняя подготовка. Ваша группа.'}</h2>
        <p>Команда работает Пн–Сб, {CLUB_OFFER.workingHours} по Астане. Выберите удобные дни и время — менеджер подтвердит расписание и место.</p>
        {program !== 'mentoring' ? <><div className={styles.slots}><div><strong>19:00–21:00</strong><span>Группы 01–04 · 4 преподавателя</span></div><div><strong>21:00–23:00</strong><span>Группы 05–08 · 4 преподавателя</span></div></div><p>Два часа на занятие, восемь вариантов групп. Пн–Сб, воскресенье — выходной. По данным команды на 28 сентября 2026, идёт добор по 1–2 ученика в группы.</p><p className={styles.note}>Это план организации групп, а не подтверждённые списки занятий. Уровень, направление, преподавателя и регулярные дни подтвердим после диагностики. Наличие мест не обновляется автоматически.</p></> : null}
        <p className={styles.note}>Отправка заявки не означает зачисление или бронь; оплата на сайте не списывается.</p>
      </div>
      <form action={`https://wa.me/${WHATSAPP_NUMBER}`} method="get" target="_blank" onSubmit={submit} className={styles.form} aria-label="Выбор времени для заявки">
        {fixedProgram ? <p className={styles.program}>{PROGRAM_LABELS[program]}</p> : (
          <label className={styles.label} htmlFor={`${id}-program`}>Направление
            <select id={`${id}-program`} value={chosenProgram} onChange={(event) => setProgram(event.target.value as EnrolmentProgram)}>
              {Object.entries(PROGRAM_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        )}
        <fieldset aria-describedby={error ? `${id}-error` : undefined}>
          <legend>Удобные дни — можно выбрать несколько</legend>
          <div className={styles.days}>{WEEKDAYS.map((day) => <label className={styles.day} key={day}><input type="checkbox" checked={days.includes(day)} onChange={(event) => { setDays(event.target.checked ? [...days, day] : days.filter((selected) => selected !== day)); setError(false); }} /><span>{day}</span></label>)}</div>
        </fieldset>
        {program !== 'mentoring' ? <label className={styles.label} htmlFor={`${id}-group`}>Вариант группы, Астана (UTC+5)
          <select id={`${id}-group`} value={groupId} onChange={(event) => { setGroupId(event.target.value); setTime(PLANNED_GROUPS.find((group) => group.id === event.target.value)!.time); }}>{PLANNED_GROUPS.map((group) => <option key={group.id} value={group.id}>{group.label} · {group.time}</option>)}</select>
        </label> : <label className={styles.label} htmlFor={`${id}-time`}>Предпочтительное время для связи, Астана (UTC+5)
          <select id={`${id}-time`} value={time} onChange={(event) => setTime(event.target.value)}>{PREFERRED_WINDOWS.map((window) => <option key={window}>{window}</option>)}</select>
        </label>}
        <input type="hidden" name="text" value={enrolmentMessage(program, days, program === 'mentoring' ? time : PLANNED_GROUPS.find((group) => group.id === groupId)!.time, groupId)} />
        {error ? <p id={`${id}-error`} className={styles.error} role="alert">Выберите хотя бы один удобный день.</p> : null}
        <button type="submit" className={ui.buttonRed}>Открыть заявку в WhatsApp<ArrowIcon /></button>
        <p className={styles.note}>Откроется WhatsApp с готовым текстом. Нажмите «Отправить» там, чтобы команда получила заявку. Предпочитаете форму? <Link className="link-underline" href="/contacts">Оставить контакт</Link>.</p>
      </form>
    </section>
  );
}
