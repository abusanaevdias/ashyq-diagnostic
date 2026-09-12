import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import type { StoredLead } from '@/lib/lead-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Выгрузка собранных лидов для Ashyq.
 *
 * Endpoint отдаёт персональные данные, поэтому без ASHYQ_ADMIN_KEY он
 * не существует вовсе (404) — чтобы забытая переменная окружения не
 * превратилась в открытую базу телефонов.
 */

const LEADS_FILE = path.join(
  process.env.ASHYQ_LEADS_DIR ?? path.join(process.cwd(), '.data'),
  'leads.jsonl',
);

const CSV_COLUMNS: Array<keyof StoredLead> = [
  'receivedAt',
  'kind',
  'exam',
  'name',
  'phone',
  'grade',
  'band',
  'correct',
  'total',
  'target',
  'plannedWhen',
  'weakest',
  'elapsedMin',
];

function keyMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function toCsv(leads: StoredLead[]): string {
  const escape = (value: unknown): string => {
    if (value === undefined || value === null) return '';
    const s = String(value);
    // защита от CSV-инъекции при открытии в Excel
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const header = [...CSV_COLUMNS, 'utm_campaign', 'utm_source'].join(',');
  const rows = leads.map((lead) =>
    [
      ...CSV_COLUMNS.map((col) => escape(lead[col])),
      escape(lead.utm?.utm_campaign),
      escape(lead.utm?.utm_source),
    ].join(','),
  );
  return [header, ...rows].join('\n');
}

export async function GET(req: Request) {
  const expected = process.env.ASHYQ_ADMIN_KEY;
  if (!expected) {
    return new NextResponse('Not found', { status: 404 });
  }

  const url = new URL(req.url);
  const provided =
    url.searchParams.get('key') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    '';

  if (!provided || !keyMatches(provided, expected)) {
    return new NextResponse('Not found', { status: 404 });
  }

  let lines: string[] = [];
  try {
    const raw = await readFile(LEADS_FILE, 'utf8');
    lines = raw.split('\n').filter(Boolean);
  } catch {
    lines = [];
  }

  const leads: StoredLead[] = [];
  for (const line of lines) {
    try {
      leads.push(JSON.parse(line) as StoredLead);
    } catch {
      // одна битая строка не должна ломать всю выгрузку
    }
  }

  const onlyContacts = url.searchParams.get('contacts') === '1';
  const selected = onlyContacts ? leads.filter((l) => l.kind === 'contact' || l.kind === 'season') : leads;

  if (url.searchParams.get('format') === 'csv') {
    return new NextResponse(`﻿${toCsv(selected)}`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="ashyq-leads.csv"',
        'Cache-Control': 'no-store',
      },
    });
  }

  return NextResponse.json(
    {
      total: selected.length,
      contacts: leads.filter((l) => l.kind === 'contact' || l.kind === 'season').length,
      completed: leads.filter((l) => l.kind === 'result').length,
      leads: selected,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
