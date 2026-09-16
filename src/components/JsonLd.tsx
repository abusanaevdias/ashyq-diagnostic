/**
 * Структурированные данные Schema.org (SEO-SCHEMA-001). `<` экранируется,
 * как в node_modules/next/dist/docs/01-app/02-guides/json-ld.md — строка из
 * данных не закроет тег script.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
