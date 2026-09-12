import { IS_WHATSAPP_CONFIGURED, WHATSAPP_NUMBER } from './config';
import { utmToQuery } from './storage';
import type { DiagnosticResult, ExamId, UtmParams } from './types';

/**
 * WhatsApp CTA.
 * Сообщение собирается автоматически из результата диагностики,
 * плюс прокидывается UTM-контекст, чтобы Ashyq видел, какая рассылка конвертит.
 */

export interface WaContext {
  exam: ExamId;
  result?: DiagnosticResult | null;
  target?: string | null;
  utm?: UtmParams;
  /** 'result' — основная CTA, 'prep' — secondary */
  intent?: 'result' | 'prep';
  name?: string;
  grade?: string;
  phone?: string;
}

function targetLabel(exam: ExamId, target: string | null | undefined): string {
  if (!target || target === 'unknown') return 'цель пока не выбрана';
  return exam === 'sat' ? `${target}+` : target;
}

export function buildWhatsAppMessage(ctx: WaContext): string {
  const { exam, result, target, utm, intent = 'result', name, grade, phone } = ctx;
  const lines: string[] = [];

  if (intent === 'prep') {
    lines.push('Привет! Прошёл(-ла) быструю диагностику Ashyq.');
    lines.push(exam === 'sat' ? 'Интересует подготовка к SAT.' : 'Интересует подготовка к IELTS.');
    if (result) {
      lines.push(
        exam === 'sat'
          ? `Предварительный диапазон: ${result.band.rangeLabel}.`
          : `Предварительный readiness: ${result.band.rangeLabel}.`,
      );
    }
    lines.push('Хочу узнать про формат подготовки.');
  } else if (exam === 'sat') {
    lines.push('Привет! Я прошёл диагностику Ashyq.');
    lines.push(`Мой результат: ${result ? result.band.rangeLabel : '—'} (предварительный диапазон).`);
    lines.push(`Цель: ${targetLabel(exam, target)}.`);
    if (result && result.weakest[0]) {
      lines.push(`Больше всего теряю в: ${result.weakest.map((w) => w.domain).join(', ')}.`);
    }
    lines.push('Хочу получить разбор.');
  } else {
    lines.push('Привет! Я прошёл IELTS диагностику Ashyq.');
    lines.push(`Мой предварительный уровень: ${result ? result.band.rangeLabel : '—'}.`);
    lines.push(`Цель: ${targetLabel(exam, target)}.`);
    if (result && result.weakest[0]) {
      lines.push(`Слабее всего: ${result.weakest.map((w) => `${w.section === 'listening' ? 'Listening' : 'Reading'} — ${w.domain}`).join(', ')}.`);
    }
    lines.push('Хочу получить разбор.');
  }

  if (name) lines.push(`Имя: ${name}.`);
  if (grade) lines.push(`Класс: ${grade}.`);
  if (phone) lines.push(`Телефон: ${phone}.`);

  const campaign = utm?.utm_campaign ? ` Кампания: ${utm.utm_campaign}.` : '';
  if (campaign) lines.push(campaign.trim());

  return lines.join('\n');
}

export function buildWhatsAppLink(ctx: WaContext): string {
  const text = buildWhatsAppMessage(ctx);
  const base = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  return `${base}${utmToQuery(ctx.utm ?? {})}`;
}

export function openWhatsApp(ctx: WaContext): void {
  if (typeof window === 'undefined') return;
  window.open(buildWhatsAppLink(ctx), '_blank', 'noopener,noreferrer');
}

export { IS_WHATSAPP_CONFIGURED, WHATSAPP_NUMBER };
