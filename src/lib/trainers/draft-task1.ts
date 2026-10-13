export type DraftTask1Chart = {
  title: string; unit: string; years: number[]; series: { name: string; values: number[] }[];
  overview: string; model: string; claims: [string, boolean][]; key: number[];
};
export type DraftTask1Pair = { charts: DraftTask1Chart[] };
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 12_000;
export const draftTask1Words = (value: string) => value.trim() ? value.trim().split(/\s+/).length : 0;
export function parseDraftTask1(value: unknown): DraftTask1Pair | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (v.kind !== 'task1-pair-v1' || v.publication_ready !== false || !Array.isArray(v.charts) || v.charts.length !== 2) return null;
  const charts: DraftTask1Chart[] = [];
  for (const candidate of v.charts) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
    const c = candidate as Record<string, unknown>;
    if (!text(c.title) || !text(c.unit) || !text(c.overview) || !text(c.model) || draftTask1Words(c.model) < 150 || !Array.isArray(c.years) || c.years.length !== 4 || !c.years.every((year, i, years) => Number.isInteger(year) && year >= 1900 && year <= 2200 && (!i || year > years[i-1])) || !Array.isArray(c.series) || c.series.length !== 3) return null;
    const series: DraftTask1Chart['series'] = [];
    for (const candidate of c.series) {
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
      const s = candidate as Record<string, unknown>;
      if (!text(s.name) || !Array.isArray(s.values) || s.values.length !== 4 || !s.values.every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1e9)) return null;
      series.push({ name: s.name, values: [...s.values] });
    }
    if (new Set(series.map(s => s.name)).size !== 3 || !series.some(s => s.values.some(value => value > 0)) || !Array.isArray(c.claims) || c.claims.length !== 6 || !c.claims.every(claim => Array.isArray(claim) && claim.length === 2 && text(claim[0]) && typeof claim[1] === 'boolean') || new Set(c.claims.map(claim => claim[0])).size !== 6 || !Array.isArray(c.key) || c.key.length !== 3 || new Set(c.key).size !== 3 || !c.key.every(index => Number.isInteger(index) && index >= 0 && index < 6 && c.claims instanceof Array && c.claims[index][1] === true)) return null;
    charts.push({ title: c.title, unit: c.unit, years: [...c.years], series, overview: c.overview, model: c.model, claims: c.claims.map(claim => [claim[0], claim[1]]), key: [...c.key] });
  }
  if (charts[0].title === charts[1].title || JSON.stringify(charts[0].series) === JSON.stringify(charts[1].series)) return null;
  return { charts };
}
export function draftTask1ClaimLabel(chart: Pick<DraftTask1Chart, 'claims'|'key'>, index: number): string {
  return chart.key.includes(index) ? 'Входит в авторский отбор главных особенностей.' : chart.claims[index][1] ? 'Данные подтверждают эту деталь; авторский overview выделяет более общую картину.' : `Это утверждение не подтверждается данными ${'diagram' in chart ? 'схемы' : 'графика'}; не используй его как установленный факт.`;
}
