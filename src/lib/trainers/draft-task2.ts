export const task2Criteria = ['Task Response','Coherence and Cohesion','Lexical Resource','Grammatical Range and Accuracy'] as const;
export type Task2Issue = { id: string; before: string; after: string; why: string; alternatives: string[] };
export type Task2Round = { prompt: string; text: string; issues: Task2Issue[]; argument: { before: string; explanation: string; example: string }; languageOnly: string; example: string; criteria: { name: string; note: string }[] };
export type DraftTask2 = { skill: string; rounds: [Task2Round,Task2Round] };
export type Task2Correction = { quote: string; replacement: string; reason: string };
export const task2Words = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0;
const text = (v: unknown, max = 4000): v is string => typeof v === 'string' && !!v.trim() && v.length <= max;
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const once = (haystack: string, needle: string) => haystack.split(needle).length === 2;

/** Identifies a mentioned source span, never the correctness of a proposed repair. */
export const mentionsTask2Issue = (rows: Task2Correction[], issue: Task2Issue) => rows.some(row => row.quote.includes(issue.before));
export function parseDraftTask2(value: unknown): DraftTask2 | null {
  if (!object(value) || value.kind !== 'task2-pair-v1' || value.publication_ready !== false || value.difficulty_status !== 'AUTHOR_ESTIMATE_UNCALIBRATED' || !text(value.skill) || !Array.isArray(value.rounds) || value.rounds.length !== 2) return null;
  const rounds: Task2Round[] = [];
  for (const r of value.rounds) {
    if (!object(r) || !text(r.prompt) || !text(r.text,24000) || task2Words(r.text)<250 || task2Words(r.text)>600 || !text(r.languageOnly,24000) || !text(r.example,24000) || task2Words(r.example)<250 || !Array.isArray(r.issues) || r.issues.length<1 || r.issues.length>20 || !object(r.argument) || !text(r.argument.before) || !text(r.argument.explanation) || !text(r.argument.example) || !once(r.text,r.argument.before)) return null;
    const issues: Task2Issue[] = [], spans: [number,number][] = [];
    for (const i of r.issues) {
      if (!object(i) || !text(i.id,24) || !text(i.before) || !text(i.after) || i.before===i.after || !text(i.why) || !Array.isArray(i.alternatives) || !i.alternatives.length || i.alternatives.length>10 || !i.alternatives.every(v=>text(v)) || new Set(i.alternatives).size!==i.alternatives.length || !once(r.text,i.before)) return null;
      const start = r.text.indexOf(i.before), end = start+i.before.length;
      if (spans.some(([a,b])=>start<b && end>a)) return null;
      spans.push([start,end]);
      issues.push({ id:i.id,before:i.before,after:i.after,why:i.why,alternatives:[...i.alternatives] });
    }
    if (new Set(issues.map(i=>i.id)).size!==issues.length) return null;
    // Replace original offsets from the end; replacement strings cannot corrupt another target.
    const originalText = r.text;
    let languageOnly = originalText;
    for (const i of [...issues].sort((a,b)=>originalText.indexOf(b.before)-originalText.indexOf(a.before))) {
      const start=originalText.indexOf(i.before); languageOnly=languageOnly.slice(0,start)+i.after+languageOnly.slice(start+i.before.length);
    }
    if (languageOnly!==r.languageOnly || !once(languageOnly,r.argument.before) || languageOnly.replace(r.argument.before,r.argument.example)!==r.example || !Array.isArray(r.criteria) || r.criteria.length!==4 || !r.criteria.every((c,index)=>object(c)&&c.name===task2Criteria[index]&&text(c.note))) return null;
    rounds.push({prompt:r.prompt,text:r.text,issues,argument:{before:r.argument.before,explanation:r.argument.explanation,example:r.argument.example},languageOnly,example:r.example,criteria:r.criteria.map(c=>({name:c.name,note:c.note}))});
  }
  if (rounds[0].prompt===rounds[1].prompt || rounds[0].text===rounds[1].text) return null;
  return {skill:value.skill,rounds:[rounds[0],rounds[1]]};
}
