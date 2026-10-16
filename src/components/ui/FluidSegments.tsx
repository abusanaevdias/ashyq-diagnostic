'use client';

import {useEffect,useRef} from 'react';
import styles from './FluidSegments.module.css';

/** Critically damped, retargetable highlight. Native links/buttons keep their own semantics and input. */
export default function FluidSegments({value,label,children}:{value:string;label:string;children:React.ReactNode}) {
 const root=useRef<HTMLDivElement>(null),pill=useRef<HTMLSpanElement>(null);
 const motion=useRef({x:0,w:100,vx:0,vw:0,initialized:false});
 useEffect(()=>{
  const el=root.current,highlight=pill.current;if(!el||!highlight)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,last=0,target={x:0,w:100};
  const paint=()=>{highlight.style.transform=`translateX(${motion.current.x}px) scaleX(${motion.current.w/100})`;el.dataset.fluidReady='true';};
  const tick=(time:number)=>{
   const m=motion.current,dt=last?Math.min((time-last)/1000,.032):1/60;last=time;
   // Semi-implicit integration: critical damping c=2*sqrt(k), no artificial input lock.
   const k=260,c=2*Math.sqrt(k);
   m.vx+=(k*(target.x-m.x)-c*m.vx)*dt;m.x+=m.vx*dt;
   m.vw+=(k*(target.w-m.w)-c*m.vw)*dt;m.w+=m.vw*dt;paint();
   if(Math.abs(target.x-m.x)+Math.abs(target.w-m.w)+Math.abs(m.vx)+Math.abs(m.vw)>.04)frame=requestAnimationFrame(tick);
   else{m.x=target.x;m.w=target.w;m.vx=0;m.vw=0;paint();frame=0;last=0;}
  };
  const measure=()=>{
   const selected=el.querySelector<HTMLElement>('[aria-current="page"],[aria-pressed="true"]');if(!selected)return;
   const base=el.getBoundingClientRect(),bounds=selected.getBoundingClientRect();target={x:bounds.left-base.left+el.scrollLeft-el.clientLeft,w:bounds.width};
   const m=motion.current;if(!m.initialized||reduced.matches){m.x=target.x;m.w=target.w;m.vx=0;m.vw=0;m.initialized=true;cancelAnimationFrame(frame);frame=0;paint();}
   else if(!frame)frame=requestAnimationFrame(tick);
  };
  measure();const resize=new ResizeObserver(measure);resize.observe(el);for(const child of el.querySelectorAll('button,a'))resize.observe(child);
  reduced.addEventListener('change',measure);
  return()=>{cancelAnimationFrame(frame);resize.disconnect();reduced.removeEventListener('change',measure);};
 },[value]);
 return <div ref={root} className={styles.group} role="group" aria-label={label}><span className={styles.decoration}><span ref={pill} className={styles.pill} aria-hidden="true"/></span>{children}</div>;
}
