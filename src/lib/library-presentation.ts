import type { LibrarySection, LibraryBlock } from './free-library';
import type { PracticeQuestion } from './library-practice';

export const isEssay = (section: LibrarySection) => /^(E0[1-6]-[AC]|U0[1-4]-[ABC]|T1[ABC]-[AC])$/.test(section.code);
const english = (b: LibraryBlock) => b.kind === 'paragraph' && !!b.text && !/[А-Яа-яЁё]/.test(b.text) && b.text.length > 60;
export function essayParts(section: LibrarySection, sections: LibrarySection[]) {
  const base = sections.find(s => s.code === section.code.replace(/-[ABC]$/, '-A'));
  const prompt = base?.blocks.find(english);
  const paragraphs = section.blocks.filter(b => english(b) && b.text !== prompt?.text);
  return {prompt, paragraphs, context: base?.blocks.filter(b => b.kind === 'visual' || b.kind === 'table') ?? [], notes: section.blocks.filter(b => !paragraphs.includes(b) && b.text !== prompt?.text)};
}
export function reviewExample(section: LibrarySection, sections: LibrarySection[]) {
  let code = section.code.replace(/-REVIEW$/, '');
  if (/^E0\d-B$/.test(code) || /^T1[ABC]-B$/.test(code)) code = code.replace(/-B$/, '-A');
  if (/^E0\d-C2$/.test(code)) code = code.replace(/-C2$/, '-C');
  return sections.find(s => s.code === code && isEssay(s) && s.code !== section.code);
}
export function exampleReview(section: LibrarySection, sections: LibrarySection[]) {
  return sections.find(s => reviewExample(s, sections)?.code === section.code);
}
export function reviewSteps(section: LibrarySection): {title: string; blocks: LibraryBlock[]}[] {
  const steps: {title: string; blocks: LibraryBlock[]}[] = [];
  for (const b of section.blocks) {
    if (b.kind === 'criterion') steps.push({title: b.text ?? 'Критерий', blocks: []});
    else if (b.kind === 'table' && b.rows && b.rows.length > 1) {
      for (const row of b.rows.slice(1)) steps.push({title: row[0], blocks: [{kind:'paragraph', text:row.slice(1).join(' · ')}]});
    } else if (steps.length) steps.at(-1)!.blocks.push(b);
  }
  return steps.filter(s => s.blocks.length);
}
/** Only literal evidence may connect a source review to an essay sentence. */
export function highlightedSentences(text: string, review: string): {text: string; marked: boolean}[] {
  const fragments = (review.match(/[A-Za-z][A-Za-z0-9 ,’'\-]+/g) ?? []).map(s => s.trim()).filter(s => s.length >= 10);
  return (text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [text]).map(sentence => ({text:sentence, marked:fragments.some(f => sentence.toLowerCase().includes(f.toLowerCase()))}));
}
/** English production, as distinct from Russian reflection about a writing strategy. */
export function englishProduction(q: PracticeQuestion) {
  if (q.options.length || q.mode === 'auto') return false;
  if (/^(SP[123]-|NEW[1-4]-|X\d{2}$)/.test(q.id)) return true;
  if (['E02-05','E03-03','E03-04','E03-06','E04-06','E05-06','E06-04','T1A-05','T1B-02','T1B-06','T1C-06'].includes(q.id)) return true;
  if (!/^(E0[1-6]|U0[1-4]|T1[ABC]|TR|CC|LR|GR|NEW[1-4]|X\d)/.test(q.id)) return false;
  return /напиш|перепиш|исправ|сформулир|перефраз|замени|добав|развей|разверни|улучши|состав|тезис|overview|\bслов\b|предложени/i.test(q.prompt) || (!!q.model && !/[А-Яа-яЁё]/.test(q.model));
}
