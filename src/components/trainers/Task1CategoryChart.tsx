'use client';
import { useId } from 'react';
import type { Task1CategoryChart as Chart } from '@/lib/trainers/draft-task1-categories';
import { task1PieLayout } from '@/lib/trainers/task1-pie-layout';
import styles from './Task1CategoryChart.module.css';

export default function Task1CategoryChart({item}:{item:Chart}){
  const id=useId().replace(/:/g,'');
  const maximum=Math.max(1,...item.values);
  const {sectors,labels}=task1PieLayout(item.values);
  return <figure className={styles.chart}><figcaption><strong lang="en">{item.title}</strong><span>{item.period} · {item.unit}</span></figcaption>
    {item.chartType==='bar'?<ol className={styles.bars}>{item.categories.map((category,i)=><li key={category}><div><span lang="en">{category}</span><strong>{item.values[i]}</strong></div><div className={styles.track} aria-hidden="true"><span style={{width:`${item.values[i]/maximum*100}%`}}/></div></li>)}</ol>:<>
      <svg viewBox="0 0 400 400" role="img" aria-label={`Круговая диаграмма: ${item.title}. Сегменты пронумерованы; категории и доли перечислены ниже.`}><defs>{item.categories.map((_,i)=><pattern id={`${id}-segment-${i}`} key={i} width={8+i*2} height={8+i*2} patternUnits="userSpaceOnUse" patternTransform={`rotate(${i*30})`}><rect width="100%" height="100%" className={styles.patternBase}/><path d={i%2?'M0 0 L0 12':'M0 0 L12 12'} className={styles.patternLine}/></pattern>)}</defs>{sectors.map((sector,i)=>item.values[i]>0&&(sector.fullCircle?<circle key={i} cx="200" cy="200" r="130" fill={`url(#${id}-segment-${i})`} className={styles.sector}/>:<path key={i} d={sector.path} fill={`url(#${id}-segment-${i})`} className={styles.sector}/>))}{labels.map(label=><g key={label.index}><path d={`M${label.anchorX} ${label.anchorY} L${label.side==='right'?345:55} ${label.y} L${label.side==='right'?355:45} ${label.y}`} className={styles.leader}/><circle data-pie-label cx={label.side==='right'?370:30} cy={label.y} r="15" className={styles.numberBackground}/><text x={label.side==='right'?370:30} y={label.y+7} textAnchor="middle">{label.index+1}</text></g>)}</svg>
      <ol className={styles.legend}>{item.categories.map((category,i)=><li key={category}><span className={styles.index} aria-hidden="true">{i+1}.</span><span><span lang="en">{category}</span> — <strong>{item.values[i]}%</strong></span></li>)}</ol>
    </>}
    <details><summary>Точные значения таблицей</summary><div className={styles.table} role="region" aria-label={`Таблица данных: ${item.title}`} tabIndex={0}><table><caption>{item.period} · {item.unit}</caption><thead><tr><th scope="col">Category</th><th scope="col">Value</th></tr></thead><tbody>{item.categories.map((category,i)=><tr key={category}><th scope="row" lang="en">{category}</th><td>{item.values[i]}{item.chartType==='pie'?'%':''}</td></tr>)}</tbody></table></div></details>
    <p>Категории относятся к одному указанному периоду. Данные не показывают изменение во времени или причины различий.{item.chartType==='pie'?' Доли составляют 100%; без размера бюджета нельзя определить абсолютные суммы.':''}</p>
  </figure>;
}
