import type { LibraryBlock } from '@/lib/free-library';
import styles from './Library.module.css';

function CourseGraph() {
  return <figure className={styles.figure}><figcaption>Enrolments at a fictional college · авторские данные</figcaption>
    <svg viewBox="0 0 600 300" role="img" aria-label="Онлайн: 40, 80, 140, 180; на кампусе: 160, 150, 130, 120. Годы: 2018, 2020, 2022, 2024.">
      {[0, 50, 100, 150, 200].map((value) => <g key={value}><line x1="55" x2="550" y1={250 - value} y2={250 - value} stroke="var(--hairline)" /><text x="42" y={255 - value} textAnchor="end" fill="var(--ink-soft)" fontSize="16">{value}</text></g>)}
      <polyline points="80,210 230,170 380,110 530,70" stroke="var(--red)" strokeWidth="3" fill="none" />
      <polyline points="80,90 230,100 380,120 530,130" stroke="var(--ink)" strokeWidth="3" strokeDasharray="7 5" fill="none" />
      {[2018, 2020, 2022, 2024].map((year, i) => <text key={year} x={80 + 150 * i} y="280" textAnchor="middle" fill="var(--ink)" fontSize="17">{year}</text>)}
      <text x="60" y="24" fill="var(--red-deep)" fontSize="17">Online — solid</text><text x="285" y="24" fill="var(--ink)" fontSize="17">On-campus — dashed</text>
    </svg>
    <div className={styles.tableWrap}><table><caption>Точные значения · число записей на курс</caption><thead><tr><th scope="col">Year</th><th scope="col">Online</th><th scope="col">On-campus</th></tr></thead><tbody>{[[2018, 40, 160], [2020, 80, 150], [2022, 140, 130], [2024, 180, 120]].map((row) => <tr key={row[0]}>{row.map((cell, i) => i ? <td key={i}>{cell}</td> : <th scope="row" key={i}>{cell}</th>)}</tr>)}</tbody></table></div>
  </figure>;
}
function BookFlow() {
  return <figure className={styles.figure}><figcaption>Book preparation · авторский процесс вымышленной библиотеки</figcaption><ol className={styles.flow}><li>Donations arrive</li><li>Staff inspect condition<div className={styles.branches}><div><strong>Unusable books</strong><p>→ Returned to donors. End of this branch.</p></div><div><strong>Usable books</strong><p>→ Continue to cleaning and preparation.</p></div></div></li><li>Clean covers <span>только пригодные книги</span></li><li>Add catalogue record</li><li>Attach barcode</li><li>Place on lending shelves</li></ol><p className={styles.small}>Порядок и обе ветки сохранены из входных данных. Это не описание реальной организации.</p></figure>;
}

export default function LibraryContent({ blocks, title }: { blocks: LibraryBlock[]; title: string }) {
  return <div className={styles.prose}>{blocks.map((block, index) => {
    if (block.kind === 'table' && block.rows?.length) return <div className={styles.tableWrap} key={index}><p className={styles.small}>Таблица: на узком экране прокрутите вправо, если нужно.</p><table><caption>{title} · таблица из материала</caption><thead><tr>{block.rows[0].map((cell, i) => <th scope="col" key={i}>{cell}</th>)}</tr></thead><tbody>{block.rows.slice(1).map((row, r) => <tr key={r}>{row.map((cell, c) => c ? <td key={c}>{cell}</td> : <th scope="row" key={c}>{cell}</th>)}</tr>)}</tbody></table></div>;
    if (block.kind === 'visual') return block.id === 'courses' ? <CourseGraph key={index} /> : <BookFlow key={index} />;
    const sourceUrl = block.href || (block.text && /^https?:\/\/\S+$/.test(block.text.trim()) ? block.text.trim() : undefined);
    if (sourceUrl) return <p key={index}><a href={sourceUrl} className={styles.sourceLink} target="_blank" rel="noopener noreferrer">{block.text} <span aria-hidden="true">↗</span><span className="sr-only"> (новая вкладка)</span></a></p>;
    if (block.kind === 'heading') return <h3 key={index}>{block.text}</h3>;
    if (block.kind === 'criterion') return <p className={styles.criterion} key={index}>{block.text}<span>Учебный ориентир ASHYQ</span></p>;
    const english = block.text && !/[А-Яа-яЁё]/.test(block.text) && /[a-z]/i.test(block.text);
    return <p key={index} lang={english ? 'en' : undefined}>{block.text}</p>;
  })}</div>;
}
