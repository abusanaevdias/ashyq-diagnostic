import styles from './Lms.module.css';

/**
 * Markdown-lite (ТЗ): абзацы, заголовки `#`/`##`, списки `- `. Рендер в
 * React-элементы — без dangerouslySetInnerHTML, поэтому текст не может
 * внедрить разметку.
 */
export default function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return (
    <div className={styles.md}>
      {blocks.map((block, index) => {
        const lines = block.split('\n');
        if (lines.every((line) => /^[-*]\s+/.test(line))) {
          return <ul key={index}>{lines.map((line, i) => <li key={i}>{line.replace(/^[-*]\s+/, '')}</li>)}</ul>;
        }
        if (block.startsWith('## ')) return <h3 key={index}>{block.slice(3)}</h3>;
        if (block.startsWith('# ')) return <h2 key={index}>{block.slice(2)}</h2>;
        return <p key={index}>{block}</p>;
      })}
    </div>
  );
}
