import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { CAREER_STATEMENTS } from '@/data/career/questions';
import { COLOR, RADIUS } from './design-tokens';

/**
 * Общий макет OG-картинок «Компаса»: сам тест и 16 страниц профилей.
 *
 * Это разметка для satori (next/og), а не для браузера — поэтому живёт
 * в lib рядом с `design-tokens`, а не в `components`: гидратации здесь нет,
 * поддерживается только подмножество flex-CSS.
 *
 * satori не читает woff2, поэтому берём те же .woff, что и корневая картинка.
 * Числа в подписи берём из банка, чтобы превью не разошлось с тестом.
 */

export const CAREER_OG_SIZE = { width: 1200, height: 630 } as const;
export const CAREER_OG_CONTENT_TYPE = 'image/png';

const [wordmarkData, manropeCyrillic, manropeLatin] = await Promise.all([
  readFile(join(process.cwd(), 'public/brand/wordmark-red.png'), 'base64'),
  readFile(join(process.cwd(), 'public/fonts/manrope-700-cyrillic.woff')),
  readFile(join(process.cwd(), 'public/fonts/manrope-700-latin.woff')),
]);
const wordmarkSrc = `data:image/png;base64,${wordmarkData}`;

export function careerOgImage({
  code,
  title,
  subtitle,
  highlight,
}: {
  /** Четырёхбуквенный код профиля. У картинки самого теста кода нет. */
  code?: string;
  title: string;
  subtitle: string;
  /** Верхняя строка нижнего блока: топ-профессии или обещание теста. */
  highlight: string;
}) {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: COLOR.bg,
        color: COLOR.ink,
        padding: '36px',
        fontFamily: 'ManropeCyrillic',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: COLOR.surface,
          border: `1px solid ${COLOR.hairline}`,
          borderRadius: RADIUS.xl,
          padding: '48px 54px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={wordmarkSrc} width={157} height={42} alt="" />
          <span
            style={{
              display: 'flex',
              padding: '12px 20px',
              borderRadius: RADIUS.pill,
              background: COLOR.blush,
              color: COLOR.red,
              fontSize: 18,
              letterSpacing: '0.12em',
            }}
          >
            КОМПАС · ПРОФОРИЕНТАЦИЯ
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '980px' }}>
          {code ? (
            <span style={{ color: COLOR.red, fontFamily: 'ManropeLatin', fontSize: 26, letterSpacing: '0.3em' }}>
              {code}
            </span>
          ) : null}
          <span style={{ marginTop: code ? 14 : 0, fontSize: 84, lineHeight: 1.02, letterSpacing: '-0.02em' }}>
            {title}
          </span>
          <span style={{ marginTop: 20, color: COLOR.inkSoft, fontSize: 27 }}>{subtitle}</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderTop: `1px solid ${COLOR.hairline}`,
            paddingTop: '24px',
          }}
        >
          <span style={{ color: COLOR.ink, fontSize: 22 }}>{highlight}</span>
          <span style={{ marginTop: 10, color: COLOR.inkSoft, fontSize: 20 }}>
            {CAREER_STATEMENTS.length} утверждений · шесть минут · бесплатно, без регистрации
          </span>
        </div>
      </div>
    </div>,
    {
      ...CAREER_OG_SIZE,
      fonts: [
        { name: 'ManropeCyrillic', data: manropeCyrillic, weight: 700, style: 'normal' },
        { name: 'ManropeLatin', data: manropeLatin, weight: 700, style: 'normal' },
      ],
    },
  );
}
