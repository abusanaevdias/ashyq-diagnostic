import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'ASHYQ — диагностика IELTS и SAT, прогресс и сообщество';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const [wordmarkData, manropeCyrillic, manropeLatin] = await Promise.all([
  readFile(join(process.cwd(), 'public/brand/wordmark-red.png'), 'base64'),
  readFile(join(process.cwd(), 'public/fonts/manrope-700-cyrillic.woff')),
  readFile(join(process.cwd(), 'public/fonts/manrope-700-latin.woff')),
]);
const wordmarkSrc = `data:image/png;base64,${wordmarkData}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#F8F7F3',
        color: '#161311',
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
          background: '#FDFDFD',
          border: '1px solid #EFEEEA',
          borderRadius: '24px',
          padding: '48px 54px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={wordmarkSrc} width={157} height={42} alt="" />
          <span
            style={{
              display: 'flex',
              padding: '12px 20px',
              borderRadius: '999px',
              background: '#F9E0DB',
              color: '#DE0B1B',
              fontFamily: 'ManropeLatin',
              fontSize: 18,
              letterSpacing: '0.12em',
            }}
          >
            IELTS · SAT · COMMUNITY
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '890px' }}>
          <span style={{ color: '#DE0B1B', fontSize: 20, letterSpacing: '0.14em' }}>
            ПРЕДВАРИТЕЛЬНАЯ ДИАГНОСТИКА
          </span>
          <span style={{ marginTop: 18, fontSize: 70, lineHeight: 1.04, letterSpacing: '-0.02em' }}>
            Твоя точка А. Понятный следующий шаг.
          </span>
          <span style={{ marginTop: 22, color: '#6E6D6B', fontSize: 27 }}>
            IELTS и SAT · прогресс · Match Days · сообщество ASHYQ
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #EFEEEA',
            paddingTop: '24px',
            color: '#6E6D6B',
            fontSize: 20,
          }}
        >
          <span>20 минут · бесплатно · без регистрации</span>
          <span style={{ fontFamily: 'ManropeLatin' }}>ASTANA · ONLINE</span>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'ManropeCyrillic', data: manropeCyrillic, weight: 700, style: 'normal' },
        { name: 'ManropeLatin', data: manropeLatin, weight: 700, style: 'normal' },
      ],
    },
  );
}
