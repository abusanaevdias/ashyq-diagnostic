/** Видимая пометка «Создано ИИ» поверх фото — Закон РК «Об искусственном интеллекте» (PHOTO-AI-001).
 *  Родитель должен быть position: relative/absolute. Для скринридеров то же сказано в alt. */
export function AiBadge() {
  return <span className="ai-badge" aria-hidden="true">Создано ИИ</span>;
}
