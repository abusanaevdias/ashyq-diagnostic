import {loadFont} from '@remotion/fonts';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import React from 'react';
import {
  AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {makePlan, PAUSE_SECONDS, type Timeline} from './plan';
import {sparkSvg, type SparkPose} from './spark';

// Design v3 tokens (design/tokens.css)
const T = {
  bg: '#f8f7f3', surface: '#fdfdfd', blush: '#f9e0db', blushSoft: '#fcf3f0', red: '#de0b1b', redDeep: '#b60916',
  ink: '#161311', inkSoft: '#6e6d6b', hairline: '#efeeea', dark: '#1b1512', onDark: '#f8f7f3', success: '#2e5e3a', successSoft: '#e8efe2',
};
const DISPLAY = 'Manrope';
const BODY = 'Inter';
const SCRIPT = 'Caveat';

// fonts copied into public/fonts by scripts/prepare.mjs
for (const [family, file, weight] of [
  [DISPLAY, 'manrope-800-cyrillic.woff2', '800'], [DISPLAY, 'manrope-800-latin.woff2', '800'],
  [BODY, 'inter-500-cyrillic.woff2', '500'], [BODY, 'inter-500-latin.woff2', '500'],
  [BODY, 'inter-600-cyrillic.woff2', '600'], [BODY, 'inter-600-latin.woff2', '600'],
  [SCRIPT, 'caveat-700-cyrillic.woff2', '700'], [SCRIPT, 'caveat-700-latin.woff2', '700'],
] as const) {
  loadFont({family, url: staticFile(`fonts/${file}`), weight});
}

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const range = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], clamp);
const easeOut = Easing.out(Easing.cubic);

// ---------- headline: words rise out of masks, the accent is written in by hand ----------
const Head: React.FC<{lines: string[]; acc?: string; tIn: number; tOut?: number; top?: number; size?: number; color?: string; accColor?: string; center?: boolean}> = ({
  lines, acc, tIn, tOut, top = 290, size = 78, color = T.ink, accColor = T.redDeep, center = false,
}) => {
  const {fps} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  let i = 0;
  const out = tOut === undefined ? 0 : range(t, tOut, tOut + 0.3);
  const word = (w: string) => {
    const delay = tIn + i++ * 0.05;
    const a = spring({frame: (t - delay) * fps, fps, config: {damping: 200}, durationInFrames: 14});
    return (
      <span key={`${w}-${i}`} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.14em', marginBottom: '-0.14em'}}>
        <span style={{display: 'inline-block', transform: `translateY(${(1 - a) * 118 - out * 118}%)`}}>{w}&nbsp;</span>
      </span>
    );
  };
  const accIn = tIn + lines.join(' ').split(' ').length * 0.05 + 0.1;
  const a = range(t, accIn, accIn + 0.45);
  return (
    <div style={{position: 'absolute', left: center ? 0 : 72, right: center ? 0 : 60, textAlign: center ? 'center' : 'left', top, fontFamily: DISPLAY, fontWeight: 800, fontSize: size, lineHeight: 1.05, letterSpacing: '-0.025em', color}}>
      {lines.map((l, k) => <div key={k} style={{whiteSpace: 'nowrap'}}>{l.split(' ').map(word)}</div>)}
      {acc ? (
        <div style={{fontFamily: SCRIPT, fontWeight: 700, fontSize: size * 1.45, lineHeight: 0.85, color: accColor, opacity: a > 0 ? 1 - out : 0,
          clipPath: `inset(-30% ${(1 - easeOut(a)) * 100}% -30% -5%)`, transform: `rotate(-3deg) translateY(${-out * 36}px)`}}>
          {acc}
        </div>
      ) : null}
    </div>
  );
};

// ---------- the mascot ----------
const Spark: React.FC<{pose: SparkPose; x: number; y: number; size: number}> = ({pose, x, y, size}) => (
  <div style={{position: 'absolute', left: x, top: y, width: size, height: size}} dangerouslySetInnerHTML={{__html: sparkSvg(pose)}} />
);

// ---------- live waveform from the English recording ----------
const Wave: React.FC<{src: string; startSec: number; active: boolean}> = ({src, startSec, active}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audioData = useAudioData(src);
  const bars = 36;
  const local = frame - Math.round(startSec * fps);
  const values = audioData && active && local >= 0
    ? visualizeAudio({fps, frame: local, audioData, numberOfSamples: 64, optimizeFor: 'speed'}).slice(0, bars)
    : new Array(bars).fill(0);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 8, height: 120, marginTop: 20}}>
      {values.map((v, i) => (
        <div key={i} style={{flex: 1, borderRadius: 6, background: active ? T.red : '#e2e0da', height: `${Math.max(8, Math.min(1, v * 6) * 120)}px`}} />
      ))}
    </div>
  );
};

export const Dictation: React.FC<{timeline: Timeline | null}> = ({timeline}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (!timeline) return <AbsoluteFill style={{background: T.bg}} />;
  const P = makePlan(timeline);
  const L = timeline.lines;
  const t = frame / fps;
  const f = (s: number) => Math.round(s * fps);

  // key beats inside the reveal voice line («пятнадцать» … «пятьдесят»)
  const rv = P.voice.reveal;
  const strikeAt = rv + L.reveal.duration * 0.3;
  const fiftyAt = rv + L.reveal.duration * 0.62;
  const fixAt = rv + L.reveal.duration * 0.78;

  const inRecord = t >= P.voice.record && t < P.voice.record + L.record.duration;
  const pauseLeft = Math.max(0, P.pause[1] - t);

  // panels: cream → blush for the pause → cream
  const pausePanel = range(t, P.pause[0] - 0.1, P.pause[0] + 0.3) * (1 - range(t, P.pause[1], P.pause[1] + 0.35));
  const cardOut = range(t, P.cta[0] - 0.3, P.cta[0] + 0.1);
  const cardIn = spring({frame, fps, config: {damping: 16, mass: 0.8}, durationInFrames: 20});

  // the spark
  let pose: SparkPose = {headphones: true};
  let sx = 760;
  let sy = 1190;
  let size = 300;
  if (t < P.record[0]) pose = {...pose, name: 'wave', phase: t * 1.6};
  else if (t < P.pause[0]) pose = {...pose, name: 'think', lookX: -6, lookY: -4};
  else if (t < P.reveal[0]) {
    pose = {...pose, name: 'think', lookX: Math.sin(t * 3) * 7};
    sx += Math.sin(t * 40) * 2 * range(t, P.pause[1] - 2, P.pause[1]);
  } else if (t < P.cta[0]) pose = t < fixAt ? {...pose, name: 'cheer', mood: 'wow'} : {...pose, name: 'cheer'};
  else {
    const e = P.cta[0];
    const fly = Easing.inOut(Easing.cubic)(range(t, e + 0.05, e + 0.75));
    const land = spring({frame: frame - f(e + 0.75), fps, config: {damping: 9}, durationInFrames: 24});
    sx = interpolate(fly, [0, 1], [-520, 390]);
    sy = interpolate(fly, [0, 1], [200, 330]) - Math.sin(Math.PI * fly) * 130;
    size = 300;
    pose = t < e + 0.75 ? {name: 'fly'} : {name: t < e + 1.6 ? 'cheer' : 'wave', phase: t * 1.6, squash: 1 - 0.18 * (1 - land) * Math.sin(Math.PI * Math.min(1, land))};
  }
  sy += t < 0.3 ? (1 - easeOut(range(t, 0, 0.3))) * 300 : 0;
  if (t > P.cta[0] - 0.35 && t < P.cta[0]) sy += range(t, P.cta[0] - 0.35, P.cta[0]) * 900;
  const blinkAt = [1.2, P.pause[0] + 1, P.reveal[0] + 2, P.duration - 1];
  pose.blink = Math.max(0, ...blinkAt.map((b) => 1 - Math.abs(t - b) / 0.09));

  const fieldText = t >= fixAt ? '50' : t >= P.pause[0] ? (Math.floor(t * 2.5) % 2 ? '|' : '') : '';
  const fieldOk = t >= fixAt;
  const bed = (s: number) => {
    // quiet music bed, ducked under speech and silent during the answer pause
    const sec = s / fps;
    const underVoice = Object.entries(P.voice).some(([k, v]) => sec >= v - 0.1 && sec < v + L[k as keyof typeof L].duration + 0.1);
    if (sec >= P.pause[0] && sec < P.pause[1]) return 0.02;
    return underVoice ? 0.05 : 0.14;
  };

  return (
    <AbsoluteFill style={{background: T.bg, fontFamily: BODY, color: T.ink}}>
      <AbsoluteFill style={{background: T.blush, transform: `translateY(${(1 - pausePanel) * 100}%)`}} />

      {/* ---------- audio ---------- */}
      <Audio src={staticFile('sfx/bed.wav')} volume={bed} />
      {(['hook', 'record', 'reveal', 'cta'] as const).map((k) => (
        <Sequence key={k} from={f(P.voice[k])} durationInFrames={f(L[k].duration + 0.3)}>
          <Audio src={staticFile(L[k].file)} volume={k === 'record' ? 1 : 1} />
        </Sequence>
      ))}
      {Array.from({length: PAUSE_SECONDS}, (_, i) => (
        <Sequence key={`tick${i}`} from={f(P.pause[0] + i)} durationInFrames={f(0.3)}><Audio src={staticFile('sfx/tick.wav')} volume={0.7} /></Sequence>
      ))}
      <Sequence from={f(fixAt)} durationInFrames={f(1)}><Audio src={staticFile('sfx/chime.wav')} volume={0.5} /></Sequence>
      {[P.record[0], P.pause[0], P.reveal[0], P.cta[0]].map((s, i) => (
        <Sequence key={`w${i}`} from={Math.max(0, f(s - 0.25))} durationInFrames={f(0.5)}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.35} /></Sequence>
      ))}

      {/* ---------- headlines ---------- */}
      <Head lines={['Проверим твой']} acc="Listening?" tIn={-1} tOut={P.record[0] - 0.3} />
      <Head lines={['Слушай внимательно —']} acc="запиши сумму" tIn={P.record[0] + 0.05} tOut={P.pause[0] - 0.3} />
      <Head lines={['5 секунд —']} acc="твой ответ?" tIn={P.pause[0] + 0.1} tOut={P.pause[1] - 0.3} />
      <Head lines={['Это была']} acc="ловушка" tIn={P.reveal[0] + 0.1} tOut={P.cta[0] - 0.3} />

      {/* ---------- the enrolment form ---------- */}
      <div style={{
        position: 'absolute', left: 64, right: 64, top: 600, background: T.surface, borderRadius: 44, padding: '40px 44px 44px',
        boxShadow: '0 24px 72px rgba(22,19,17,0.1)', transform: `translateY(${(1 - cardIn) * 60 - cardOut * 1400}px)`,
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <span style={{borderRadius: 999, padding: '12px 22px', font: `600 28px/1 ${BODY}`, background: T.blushSoft, color: T.redDeep}}>IELTS Listening · Part 1</span>
          <span style={{font: `600 26px/1 ${BODY}`, color: inRecord ? T.red : T.inkSoft}}>{inRecord ? '● идёт запись' : 'Write ONE WORD AND/OR A NUMBER'}</span>
        </div>
        <div style={{font: `800 46px/1.2 ${DISPLAY}`, marginTop: 24, letterSpacing: '-0.01em'}}>Course enrolment form</div>
        <Wave src={staticFile(L.record.file)} startSec={P.voice.record} active={inRecord} />
        {[['Name', 'Aru Serik'], ['Start date', '14 October']].map(([k, v]) => (
          <div key={k} style={{display: 'flex', gap: 18, marginTop: 20, font: `500 34px/1.3 ${BODY}`}}>
            <span style={{color: T.inkSoft, width: 230}}>{k}:</span><span>{v}</span>
          </div>
        ))}
        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 22}}>
          <span style={{font: `600 34px/1 ${BODY}`, width: 230}}>Course fee: £</span>
          <div style={{
            flex: 1, height: 92, borderRadius: 22, border: `4px solid ${fieldOk ? T.success : t >= P.pause[0] ? T.ink : '#e2e0da'}`,
            display: 'flex', alignItems: 'center', padding: '0 24px', font: `800 50px/1 ${DISPLAY}`, color: fieldOk ? T.success : T.ink,
            transform: `scale(${fieldOk ? interpolate(spring({frame: frame - f(fixAt), fps, config: {damping: 10}}), [0, 1], [1.12, 1]) : 1})`,
          }}>
            {fieldText}{fieldOk ? <span style={{marginLeft: 'auto', fontSize: 40}}>✓</span> : null}
          </div>
        </div>
      </div>

      {/* ---------- pause countdown ---------- */}
      {t >= P.pause[0] - 0.2 && t < P.pause[1] + 0.3 ? (
        <div style={{position: 'absolute', left: 72, top: 1150, display: 'flex', alignItems: 'center', gap: 24,
          opacity: range(t, P.pause[0] - 0.2, P.pause[0]) * (1 - range(t, P.pause[1], P.pause[1] + 0.3))}}>
          <svg width="96" height="96" viewBox="0 0 96 96" style={{transform: 'rotate(-90deg)'}}>
            <circle cx="48" cy="48" r="40" fill="none" stroke={T.surface} strokeWidth="10" />
            <circle cx="48" cy="48" r="40" fill="none" stroke={T.red} strokeWidth="10" strokeLinecap="round" strokeDasharray={251.3} strokeDashoffset={251.3 * (1 - pauseLeft / PAUSE_SECONDS)} />
          </svg>
          <span style={{font: `800 64px/1 ${DISPLAY}`}}>{Math.ceil(pauseLeft)}</span>
        </div>
      ) : null}

      {/* ---------- reveal: what the speaker actually said ---------- */}
      {t >= P.reveal[0] && t < P.cta[0] + 0.3 ? (
        <div style={{position: 'absolute', left: 64, right: 64, top: 1150, borderRadius: 32, padding: '24px 30px', background: T.surface,
          boxShadow: '0 14px 40px rgba(22,19,17,0.08)', font: `500 34px/1.4 ${BODY}`,
          opacity: range(t, P.reveal[0] + 0.2, P.reveal[0] + 0.5) * (1 - cardOut),
          transform: `translateY(${(1 - easeOut(range(t, P.reveal[0] + 0.2, P.reveal[0] + 0.5))) * 30}px)`}}>
          “…the course fee is{' '}
          <span style={{color: t >= strikeAt ? T.red : T.ink, textDecoration: t >= strikeAt ? 'line-through' : 'none'}}>fifteen</span>…
          sorry, I mean{' '}
          <span style={{color: t >= fiftyAt ? T.success : T.ink, fontWeight: t >= fiftyAt ? 700 : 500, background: t >= fiftyAt ? T.successSoft : 'transparent', borderRadius: 8, padding: '0 6px'}}>fifty</span>{' '}
          pounds”
        </div>
      ) : null}

      {/* ---------- end card ---------- */}
      {t >= P.cta[0] ? (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: 600, textAlign: 'center', opacity: range(t, P.cta[0] + 0.05, P.cta[0] + 0.2),
            transform: `scale(${interpolate(spring({frame: frame - f(P.cta[0]), fps, config: {damping: 12}}), [0, 1], [0.8, 1])})`}}>
            <Img src={staticFile('brand/wordmark-ink.png')} style={{width: 520, mixBlendMode: 'multiply'}} />
          </div>
          <Head lines={['Проверь свой уровень']} acc="бесплатно" tIn={P.cta[0] + 0.45} top={820} size={72} center />
          <p style={{position: 'absolute', left: 0, right: 0, top: 1050, textAlign: 'center', font: `500 38px/1.35 ${BODY}`, color: T.inkSoft,
            opacity: range(t, P.cta[0] + 1.1, P.cta[0] + 1.4)}}>Диагностика IELTS · ~20 минут · ссылка в профиле</p>
          <p style={{position: 'absolute', left: 0, right: 0, top: 1170, textAlign: 'center', font: `600 26px/1 ${BODY}`, color: T.inkSoft,
            opacity: range(t, P.cta[0] + 1.3, P.cta[0] + 1.6)}}>Голоса в ролике созданы ИИ</p>
        </>
      ) : null}

      <Spark pose={pose} x={sx} y={sy} size={size} />
    </AbsoluteFill>
  );
};
