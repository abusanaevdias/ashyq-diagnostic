import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './Lms.module.css';

const INLINE_MARKDOWN = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((\/(?!\/)[^)\s]*|https:\/\/[^)\s]+)\)/g;

function renderInline(text: string): ReactNode {
  const children: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  INLINE_MARKDOWN.lastIndex = 0;

  while ((match = INLINE_MARKDOWN.exec(text))) {
    if (match.index > cursor) children.push(text.slice(cursor, match.index));
    if (match[1]) {
      children.push(<strong key={`strong-${match.index}`}>{match[1]}</strong>);
    } else if (match[2] && match[3]) {
      const href = match[3];
      children.push(href.startsWith('/')
        ? <Link key={`link-${match.index}`} href={href}>{match[2]}</Link>
        : <a key={`link-${match.index}`} href={href} target="_blank" rel="noreferrer">{match[2]}</a>);
    }
    cursor = INLINE_MARKDOWN.lastIndex;
  }

  if (cursor < text.length) children.push(text.slice(cursor));
  return children.length ? children : text;
}

/**
 * Markdown-lite: абзацы, заголовки `#`/`##`, списки `- `, выделение `**`
 * и ссылки на внутренние пути или HTTPS-источники. Рендер в React-элементы
 * не интерпретирует пользовательский текст как HTML.
 */
export default function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return (
    <div className={styles.md}>
      {blocks.map((block, index) => {
        const lines = block.split('\n');
        if (lines.every((line) => /^[-*]\s+/.test(line))) {
          return <ul key={index}>{lines.map((line, i) => <li key={i}>{renderInline(line.replace(/^[-*]\s+/, ''))}</li>)}</ul>;
        }
        if (block.startsWith('## ')) return <h3 key={index}>{renderInline(block.slice(3))}</h3>;
        if (block.startsWith('# ')) return <h2 key={index}>{renderInline(block.slice(2))}</h2>;
        return <p key={index}>{renderInline(block)}</p>;
      })}
    </div>
  );
}
