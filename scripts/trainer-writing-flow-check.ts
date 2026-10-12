import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writingCases } from '../src/lib/writing-trainer/cases';
import { originalSentence } from '../src/lib/writing-trainer/engine';
import { checkpointKey, parseRecord } from '../src/lib/trainers/checkpoints';

async function main() {
  const base=process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
  const browser=await chromium.launch({headless:true});
  try {
    for(const [index,essay] of writingCases.entries()) {
      const context=await browser.newContext();const page=await context.newPage();const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto(base+'/writing/trainer/practice');
      if(index) await page.getByRole('button',{name:new RegExp(essay.topic)}).click();
      await page.getByRole('button',{name:'Сохранять на этом устройстве',exact:true}).click();
      assert.equal(await page.locator('mark').count(),0,'error fragments remain hidden before checking');
      const [first,second]=essay.grammarIssues;
      await page.getByRole('button',{name:originalSentence(essay,first.sentenceId),exact:true}).click();
      await page.getByLabel('Перепиши выбранное предложение',{exact:true}).fill(first.accepted[0]);
      const unknown='This alternative sentence is reserved for teacher review.';
      await page.getByRole('button',{name:originalSentence(essay,second.sentenceId),exact:true}).click();
      await page.getByLabel('Перепиши выбранное предложение',{exact:true}).fill(unknown);
      await page.getByRole('button',{name:'Проверить мои правки',exact:true}).click();
      assert.ok(await page.locator('mark').count()>0,'errors become visually marked only after reveal');
      await page.getByText('Другой вариант: его может проверить учитель. Автоматически не оцениваем.',{exact:true}).waitFor();
      await page.getByRole('button',{name:'Применить мою проверенную правку',exact:true}).click();
      await page.getByRole('button',{name:'Применить пример к эссе',exact:true}).first().click();
      await page.getByRole('button',{name:'Дальше: ответ на вопрос →',exact:true}).click();
      const key=checkpointKey('writing-task2','guest');
      const drafts:Record<string,string>={}, post:Record<string,string>={};
      for(const criterion of ['task','coherence','lexical'] as const) {
        drafts[criterion]=criterion==='coherence'?essay.revisions[criterion].example:`This original ${criterion} draft needs detailed teacher feedback and is not automatically graded.`;
        post[criterion]=`This revised ${criterion} paragraph is a second attempt for discussion with a teacher.`;
        await page.getByLabel('Твой переписанный абзац',{exact:true}).fill(drafts[criterion]);
        await page.waitForFunction(({key,criterion,text})=>{const raw=localStorage.getItem(key);return raw&&JSON.parse(raw).checkpoint?.data.session.revisionDrafts[criterion]===text;},{key,criterion,text:drafts[criterion]});
        await page.reload();await page.getByRole('button',{name:'Продолжить сохранённую',exact:true}).click();
        assert.equal(await page.getByLabel('Твой переписанный абзац',{exact:true}).inputValue(),drafts[criterion]);
        await page.getByRole('button',{name:'Сравнить с примером',exact:true}).click();
        assert.equal(await page.getByLabel('Твой переписанный абзац',{exact:true}).isDisabled(),true,'first paragraph attempt freezes after reveal');
        if(criterion==='task') await page.getByRole('button',{name:'Применить пример к рабочему эссе',exact:true}).click();
        if(criterion==='coherence') await page.getByRole('button',{name:'Применить мою проверенную правку',exact:true}).click();
        await page.getByLabel('Твоя версия после разбора',{exact:true}).fill(post[criterion]);
        await page.getByRole('button',{name:criterion==='lexical'?'Посмотреть итог →':'Следующий критерий →',exact:true}).click();
      }
      await page.getByRole('heading',{name:'Что изменилось',exact:true}).waitFor();
      await page.waitForFunction(key=>{const raw=localStorage.getItem(key);return raw&&JSON.parse(raw).checkpoint?.data.session.stage==='report';},key);
      await page.reload();await page.getByRole('button',{name:'Продолжить сохранённую',exact:true}).click();
      const record=parseRecord(await page.evaluate(key=>localStorage.getItem(key),key),'writing-task2')!;
      const session=record.checkpoint!.data.session as {grammarDrafts:Record<string,string>;appliedGrammar:Record<string,string>;revisionDrafts:Record<string,string>;postFeedbackDrafts:Record<string,string>;appliedRevisions:Record<string,string>};
      assert.equal(session.grammarDrafts[second.sentenceId],unknown);
      assert.equal(session.appliedGrammar[first.sentenceId],first.accepted[0]);
      assert.equal(session.appliedGrammar[second.sentenceId],second.accepted[0]);
      assert.deepEqual(session.revisionDrafts,drafts);assert.deepEqual(session.postFeedbackDrafts,post);
      assert.equal(session.appliedRevisions.task,essay.revisions.task.example);
      assert.equal(session.appliedRevisions.coherence,drafts.coherence);assert.equal(session.appliedRevisions.lexical,undefined,'unknown unapplied draft cannot become a checked revision');
      for(const width of [320,390,768,1440]) {await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}
      const axe=await new AxeBuilder({page}).include('main').analyze();assert.deepEqual(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
      assert.deepEqual(errors,[]);await context.close();console.log(`PASS Writing ${essay.id}: hidden/revealed errors, unknown alternative kept for teacher, own/sample application provenance, three criteria with frozen first/revised attempts, intermediate/report restore, four widths/axe. Prepared examples do not validate learner quality or IELTS scores.`);
    }
  } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
