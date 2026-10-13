import { task1MapPositions, type Task1Diagram } from '@/lib/trainers/draft-task1-diagrams';
import styles from './Task1DiagramChart.module.css';

export default function Task1DiagramChart({item}:{item:Task1Diagram}){
  return <figure className={styles.figure}>
    <figcaption lang="en"><strong>{item.title}</strong></figcaption>
    {item.chartType==='process'?<>
      <p>Следуй сверху вниз. Стрелки показывают порядок; время, объём и оборудование известны только там, где подписаны.</p>
      <ol className={styles.stages} role="list">{item.diagram.stages.map((stage,index)=><li key={stage.title}>
        <div className={styles.stage}><span className={styles.number} aria-hidden="true">{index+1}</span><div lang="en"><strong>{stage.title}</strong><p>{stage.detail}</p></div></div>
        {index<item.diagram.stages.length-1&&<span className={styles.arrow} aria-hidden="true">↓</span>}
      </li>)}</ol>
      <p>Воображаемая учебная последовательность. Схема не задаёт универсальный производственный стандарт и не показывает автоматизацию, выход продукции или все реальные операции.</p>
    </>:<>
      <p>Север сверху ↑ · запад слева · восток справа. Это условная карта без масштаба: одинаковые клетки показывают расположение, а не площадь объектов.</p>
      <div className={styles.maps}>{item.diagram.frames.map(frame=><section key={frame.period} aria-label={frame.period}>
        <h5 lang="en">{frame.period}</h5><p className={styles.status}>{frame.status==='proposed'?'Проект: ещё не завершённое изменение':'Показанное состояние'}</p>
        <ol className={styles.grid} role="list">{frame.cells.map((label,index)=><li key={index}><span className={styles.position} lang="en">{task1MapPositions[index]}</span><strong lang="en">{label==='Greenhouse'?<>Green<wbr/>house</>:label}</strong></li>)}</ol>
      </section>)}</div>
      <details><summary>Сопоставить места таблицей</summary><div className={styles.table} role="region" aria-label={`Сопоставление карты: ${item.title}`} tabIndex={0}><table>
        <caption>Расположение объектов; площади не заданы</caption><thead><tr><th scope="col">Position</th>{item.diagram.frames.map(frame=><th key={frame.period} scope="col" lang="en">{frame.period}</th>)}</tr></thead>
        <tbody>{task1MapPositions.map((position,index)=><tr key={position}><th scope="row" lang="en">{position}</th>{item.diagram.frames.map(frame=><td key={frame.period} lang="en">{frame.cells[index]}</td>)}</tr>)}</tbody>
      </table></div></details>
      <p>Новая подпись в том же месте не устанавливает способ строительства. Проект не означает завершённую стройку; число посетителей и вместимость по карте не определяются.</p>
    </>}
  </figure>;
}
