'use client';
import Link from 'next/link';
import { useSession } from '@/lib/lms/hooks';
import styles from './TrainerCheckpoint.module.css';

export default function TrainerStaffLinks() {
  const { session, ready } = useSession();
  if (!ready || !session || !['teacher','author'].includes(session.user.role)) return null;
  return <section className={styles.panel} aria-labelledby="trainer-staff-title"><h2 id="trainer-staff-title">Преподавателю</h2><p>Проверь новые материалы и ориентиры оценивания перед использованием с учениками.</p><div className={styles.actions}><Link href="/trainers/bank">Открыть банк практики →</Link><Link href="/trainers/material-review">Проверить черновики заданий →</Link><Link href="/writing/calibration">Проверить ориентиры Writing →</Link></div></section>;
}
