import assert from 'node:assert/strict';
import raw from '../src/data/free-library-content.json';
import { LIBRARY_CHAPTERS } from '../src/data/free-library';
import type { LibrarySection, LibraryBlock } from '../src/lib/free-library';
import { buildLibraryPractice, checkPracticeAnswer } from '../src/lib/library-practice';
import { emptyProgress, practiceFields, progressSource, readProgress } from '../src/lib/library-progress';
import { englishProduction, essayParts, exampleReview, highlightedSentences, isEssay, reviewExample, reviewSteps } from '../src/lib/library-presentation';

const sections = raw.sections as LibrarySection[];
let questions = 0, essays = 0, reviews = 0, production = 0;
for (const chapter of LIBRARY_CHAPTERS) {
  const subset = sections.filter(s=>s.source===chapter.source && s.page>=chapter.start && s.page<=chapter.end);
  // Chapter data uses page bounds; fail if its contract changes rather than silently auditing no content.
  assert.ok(subset.length, chapter.slug);
  for (const set of buildLibraryPractice(subset)) {
    if(!set.questions.length) continue;
    questions+=set.questions.length;
    const source=progressSource(set), fields=practiceFields(set), empty=emptyProgress(source);
    assert.deepEqual(readProgress('',source,fields),empty);
    const q=set.questions[0], value=q.accepted[0] || 'My English response.';
    const record={...empty,values:{[q.id]:value},checked:{[q.id]:true}};
    assert.deepEqual(readProgress(JSON.stringify(record),source,fields),record);
    const full={...empty,values:Object.fromEntries(fields.map(f=>[f.id,'\u0000'.repeat(f.max)]))};
    assert.deepEqual(readProgress(JSON.stringify(full),source,fields),full,'JSON escaping cannot invalidate legal per-field limits');
    for(const bad of ['{', 'null', '[]', JSON.stringify({...record,source:'stale'}), JSON.stringify({...record,current:-1}), JSON.stringify({...record,current:set.questions.length}), JSON.stringify({...record,score:9}), JSON.stringify({...record,values:{unknown:'x'}}), JSON.stringify({...record,values:{[q.id]:'x'.repeat(fields[0].max+1)}}),JSON.stringify({...record,values:{},checked:{[q.id]:true}}),JSON.stringify({...record,checked:{[q.id]:'true'}})]) assert.equal(readProgress(bad,source,fields),null);
    for(const question of set.questions) {
      if(englishProduction(question)) production++;
      if(question.mode==='compare') assert.equal(checkPracticeAnswer(question,question.model),null);
      for(const accepted of question.accepted) assert.equal(checkPracticeAnswer(question,accepted),true);
    }
    if(set.code==='U02-Q-2') assert.ok(englishProduction(set.questions.find(q=>q.id==='U02-07')!));
  }
  for(const section of subset) {
    if(isEssay(section)) {
      essays++; const parts=essayParts(section,subset);
      assert.ok(parts.prompt?.text,`${section.code} prompt`);
      assert.ok(parts.paragraphs.length>=4,`${section.code} complete essay`);
      assert.ok(parts.paragraphs.every(b=>b.text!==parts.prompt?.text));
      if(/^T1[ABC]-C$/.test(section.code)) assert.ok(reviewSteps(section).length>0,'embedded Task 1 review');
      const review=exampleReview(section,subset);
      if(review) assert.equal(reviewExample(review,subset)?.code,section.code);
    }
    const example=reviewExample(section,subset);
    if(example) {
      reviews++; const steps=reviewSteps(section);
      assert.ok(steps.length,`${section.code} review steps`);
      for(const step of steps) for(const paragraph of essayParts(example,subset).paragraphs as LibraryBlock[]) {
        const text: string=paragraph.text!; const marked=highlightedSentences(text,step.blocks.map(b=>b.text??'').join(' '));
        assert.equal(marked.map(s=>s.text).join(''),text,'highlighting preserves every character');
      }
    }
  }
}
assert.equal(questions,322);assert.equal(essays,30);assert.ok(reviews>=27);
assert.deepEqual(highlightedSentences('One sentence. Another sentence.', 'No matching text here.'),[{text:'One sentence. ',marked:false},{text:'Another sentence.',marked:false}]);
console.log(`PASS ${LIBRARY_CHAPTERS.length} chapters/${questions} questions/${essays} essays/${reviews} paired reviews/${production} English production prompts; storage roundtrip, stale/malformed/bounds, grading, exact source-preserving highlights.`);
