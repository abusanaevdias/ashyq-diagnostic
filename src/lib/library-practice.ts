import type { LibrarySection } from './free-library';

export type PracticeQuestion = {
  id: string; prompt: string; options: { value: string; label: string }[];
  accepted: string[]; model: string; explanation: string;
  mode: 'auto' | 'compare'; sourceSection: string; sourcePage: number;
};
export type PracticeSet = { code: string; instructions: string; questions: PracticeQuestion[] };
const CODE = '(?:(?:E0[1-6]|T1[ABC]|R0[1-3]|G[1-3]|C[1-2]|L0[1-3]|SP[1-3]|NEW[1-4]|U0[1-4]|TR|CC|LR|GR)-\\d{2}|X\\d{2})';
const start = new RegExp(`^(?:\\d+\\.\\s*)?(${CODE})(?=\\s|$)`);
const listening: Record<string, string[]> = {
  'L01-01': ['Thursday'], 'L01-02': ['10:30', 'ten thirty'], 'L01-03': ['35', 'thirty-five'],
  'L01-04': ['notebook'], 'L01-05': ['6', 'six'], 'L01-06': ['Monday'],
  'L02-01': ['two', '2'], 'L02-02': ['B'], 'L02-03': ['notes'], 'L02-04': ['1200'],
  'L02-05': ['Friday'], 'L02-06': ['clarity'], 'L03-01': ['silent'], 'L03-02': ['90', 'ninety'],
  'L03-03': ['B'], 'L03-04': ['card'], 'L03-05': ['8', 'eight', '20:00'], 'L03-06': ['NO'],
};

export function normalizePracticeAnswer(value: string) {
  return value.normalize('NFKC').trim().toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').replace(/[.!?]+$/, '');
}
export function checkPracticeAnswer(question: PracticeQuestion, value: string): boolean | null {
  if (question.mode !== 'auto' || !value.trim()) return null;
  return question.accepted.some((answer) => normalizePracticeAnswer(answer) === normalizePracticeAnswer(value));
}

function splitSection(section: LibrarySection) {
  const entries: { id: string; parts: string[] }[] = [];
  const intro: string[] = [];
  for (const block of section.blocks) {
    const texts = block.text ? [block.text] : block.rows?.flat() ?? [];
    for (const text of texts) {
      const match = text.match(start);
      if (match) entries.push({ id: match[1], parts: [text.slice(match[0].length).replace(/^\s*[·/]\s*/, '').trim()] });
      else if (entries.length) entries.at(-1)!.parts.push(text);
      else intro.push(text);
    }
  }
  return { entries, intro: intro.join('\n\n') };
}

function choiceOptions(text: string) {
  const matches = [...text.matchAll(/(?:^|\s)([A-D])\.\s+/g)];
  if (matches.length >= 2 && matches[0][1] === 'A' && matches.every((match, i) => match[1] === 'ABCD'[i])) {
    return {
      prompt: text.slice(0, matches[0].index).trim(),
      options: matches.map((match, i) => ({ value: match[1], label: text.slice(match.index! + match[0].length, matches[i + 1]?.index ?? text.length).trim() })),
    };
  }
  const parentheses = [...text.matchAll(/\(([^()]*\/[^()]*)\)/g)].at(-1);
  if (parentheses) {
    const options = parentheses[1].split('/').map((part) => part.trim());
    if (options.length >= 2 && options.length <= 4 && options.every((part) => part.length > 0 && part.length < 100)) {
      return { prompt: text.replace(parentheses[0], '').trim(), options: options.map((value) => ({ value, label: value })) };
    }
  }
  return { prompt: text, options: [] as { value: string; label: string }[] };
}

/** Parse only source-coded questions; semantic writing is never scored by string equality. */
export function buildLibraryPractice(sections: LibrarySection[]): PracticeSet[] {
  const keys = new Map<string, string[]>();
  const speakingRubric = sections.find((section) => section.code === 'S-REVIEW')?.blocks.find((block) => block.kind === 'table')?.rows?.slice(1).map((row) => row.join(': ')).join('\n\n') ?? '';
  for (const section of sections.filter((section) => section.answer || section.code === 'S-REVIEW')) {
    for (const entry of splitSection(section).entries) {
      if (keys.has(entry.id)) throw new Error(`Duplicate practice key ${entry.id}`);
      keys.set(entry.id, entry.parts.filter(Boolean));
    }
  }
  return sections.filter((section) => section.exercise && section.code !== 'S-REVIEW').map((section) => {
    const source = splitSection(section);
    return { code: section.code, instructions: source.intro, questions: source.entries.map((entry): PracticeQuestion => {
      const text = entry.parts.filter((part) => !/^Мой ответ\s*\/\s*заметки:/.test(part))
        .join('\n\n').replace(/Ответ:\s*_+/g, '').trim();
      const parsed = choiceOptions(text);
      const key = keys.get(entry.id) ?? [];
      const model = key[0] ?? (/^SP[12]-/.test(entry.id) && speakingRubric ? 'Критерии самопроверки Speaking из материала' : '');
      const explanation = key.length > 1 ? key.slice(1).join('\n\n') : !key.length && /^SP[12]-/.test(entry.id) ? speakingRubric : model;
      let accepted: string[] = [];
      let options = parsed.options;
      if (model && options.length) {
        const matches = options.filter((option) => normalizePracticeAnswer(model) === normalizePracticeAnswer(option.value)
          || normalizePracticeAnswer(model).startsWith(`${normalizePracticeAnswer(option.value)} `));
        if (matches.length === 1) accepted = [matches[0].value];
      }
      if (/^R01-/.test(entry.id) && model) {
        options = ['TRUE', 'FALSE', 'NOT GIVEN'].map((value) => ({ value, label: value }));
        accepted = options.filter((option) => model.startsWith(option.value)).map((option) => option.value);
      }
      if (/^R03-0[2-6]$/.test(entry.id) && model) {
        options = ['YES', 'NO', 'NOT GIVEN'].map((value) => ({ value, label: value }));
        accepted = options.filter((option) => model.startsWith(option.value + ' ')).map((option) => option.value);
      }
      if (/^R02-0[1-5]$/.test(entry.id) && model) {
        const headings = [...source.intro.matchAll(/(?:^|\s)(i|ii|iii|iv|v|vi|vii)\.\s+/g)];
        options = headings.map((match, i) => ({ value: match[1], label: source.intro.slice(match.index! + match[0].length, headings[i + 1]?.index ?? source.intro.indexOf('\n\n')).trim() }));
        accepted = options.filter((option) => model.startsWith(option.value + ' ')).map((option) => option.value);
      }
      if (/^(?:R02-(?:0[6-9]|10)|R03-(?:0[7-9]|10))$/.test(entry.id) && model) accepted = [model.split(/\s/)[0]];
      if (listening[entry.id] && model) accepted = listening[entry.id];
      return { id: entry.id, prompt: accepted.length ? parsed.prompt : text, options: accepted.length ? options : [], accepted, model, explanation,
        mode: accepted.length ? 'auto' : 'compare', sourceSection: section.code, sourcePage: section.page };
    }) };
  });
}
