import { ImageResponse } from 'next/og';

export const alt = 'ASHYQ — диагностика IELTS и SAT';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#f7f3ea', color: '#211a16', padding: '72px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, letterSpacing: 5, textTransform: 'uppercase' }}><strong style={{ color: '#ce1e23', fontSize: 44 }}>ashyq</strong><span>People · Knowledge</span></div>
      <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ color: '#ce1e23', fontSize: 86, fontWeight: 800, lineHeight: 0.95 }}>ТВОЯ ТОЧКА А</span><span style={{ marginTop: 24, fontSize: 38 }}>Диагностика IELTS и SAT</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #211a16', paddingTop: 24, fontSize: 24 }}><span>≈20 минут · бесплатно</span><span>A brighter tomorrow</span></div>
    </div>,
    size,
  );
}
