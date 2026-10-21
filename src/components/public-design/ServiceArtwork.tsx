import { useId } from 'react';
import { LAND_OPACITIES, landPaths, projectPoint } from './globe-geometry';
import styles from './ServiceArtwork.module.css';

export type ServiceKind = 'ielts' | 'sat' | 'mentoring' | 'package';

/** Real SVG and HTML. Artwork is decorative, not a learner score or an exam chart. */
export default function ServiceArtwork({ kind, caption }: { kind: ServiceKind; caption?: string }) {
  const id = useId().replace(/[^a-z0-9]/gi, '');
  const land = kind === 'mentoring' ? landPaths() : [];
  return <div className={`${styles.art} ${styles[kind]}`} data-approved-art={kind} aria-hidden="true">
    {kind === 'ielts' ? <>
      <span className={styles.caption}>{caption ?? 'Четыре навыка. Один план.'}</span>
      <div className={styles.sheets}><span data-paper="back" /><span data-paper="front"><i /><i /><i /><i /></span></div>
      <strong className={styles.word}>IELTS</strong>
    </> : kind === 'sat' ? <>
      <span className={styles.caption}>Точность начинается с условия.</span>
      <svg className={styles.graph} viewBox="0 0 600 260" preserveAspectRatio="none">
        <defs><pattern id={`grid-${id}`} width="35" height="35" patternUnits="userSpaceOnUse"><path d="M35 0H0V35" fill="none" stroke="currentColor" strokeWidth=".7" /></pattern></defs>
        <rect width="600" height="260" fill={`url(#grid-${id})`} className={styles.grid} />
        <path d="M30 235Q270 -120 570 235" fill="none" stroke="var(--red)" strokeWidth="5" vectorEffect="non-scaling-stroke" />
        <g data-graph-marker transform="translate(90 155)"><circle r="17" fill="var(--red)" opacity=".22" /><circle r="8" fill="var(--red)" stroke="var(--on-dark)" strokeWidth="3" /></g>
      </svg><strong className={styles.word}>SAT</strong>
    </> : kind === 'mentoring' ? <>
      <span className={styles.caption}>Менторство по поступлению</span>
      <div className={styles.globeCopy}><strong>Мир<br />ближе.</strong><small>ЕВРОПА · США<br />ОАЭ · ДРУГИЕ СТРАНЫ</small></div>
      <svg className={styles.globe} viewBox="0 0 400 400" data-vector-globe>
        <circle cx="200" cy="200" r="176" fill="var(--surface)" stroke="var(--hairline)" strokeWidth="1" />
        <g fill="none" stroke="var(--ink-soft)" strokeWidth="3.3" strokeLinecap="round">{LAND_OPACITIES.map((opacity, i) => <path key={i} data-land-layer={i} d={land[i]} opacity={opacity} />)}</g>
        <g fill="var(--red)">{[[-.2,.7,.68],[.4,.45,.79],[.7,.1,.7]].map((point, i) => { const p = projectPoint(point); return <circle key={i} cx={p.cx} cy={p.cy} r="4" data-city-point={i} opacity={p.opacity} />; })}</g>
        <circle cx="200" cy="200" r="176" fill="none" stroke="var(--ink-soft)" strokeOpacity=".2" />
      </svg>
    </> : <><span className={styles.caption}>IELTS + SAT + МЕНТОРСТВО</span><strong className={styles.packageWord}>Всё<br />включено.</strong><span className={styles.packageMark}>↗</span></>}
  </div>;
}
