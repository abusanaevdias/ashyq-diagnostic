/** Remote CI only. Native controls, synthetic answers and a local demo account.
 * No seed, live account/provider, microphone or cloud-acceptance inference. */
import { chromium, type Page } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir,writeFile } from 'node:fs/promises';
import { QUESTION_BANK } from '../../src/data/questions';
import { EXAMS } from '../../src/lib/config';

const dir='artifacts/profile-visual';
const base='http://127.0.0.1:3000';
const manifest:object[]=[],failures:object[]=[];
async function capture(p:Page,name:string,anchor?:string) {
  await p.evaluate(()=>document.fonts.ready);
  for(const width of [320,390,1280]) {
    await p.setViewportSize({width,height:900});
    if(anchor)await p.locator(anchor).evaluate(n=>n.scrollIntoView({block:'start',behavior:'instant'}));
    else await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    const geometry=await p.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1}));
    manifest.push({name,...geometry});if(geometry.overflow)failures.push({name,...geometry});
    await p.screenshot({path:`${dir}/${name}-${width}.png`});
    if(width===390){await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:`${dir}/${name}-full.png`,fullPage:true});}
  }
  const axe=await new AxeBuilder({page:p}).include('main').analyze();
  const serious=axe.violations.filter(v=>v.impact==='serious'||v.impact==='critical');
  if(serious.length)failures.push({name,axe:serious.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))});
}
async function main() {
const browser=await chromium.launch({headless:true});
await mkdir(dir,{recursive:true});
const context=await browser.newContext({viewport:{width:390,height:900}});
const p=await context.newPage();
p.on('pageerror',e=>failures.push({pageerror:e.message}));
try {
  await p.goto(base);
  await p.locator('#hero').getByRole('button',{name:'Начать диагностику IELTS'}).click();
  await p.getByRole('button',{name:EXAMS.ielts.targets[0].label,exact:true}).first().click();
  await p.getByRole('button',{name:'1–3 месяца',exact:true}).click();
  await p.getByRole('button',{name:'Начать',exact:true}).click();
  for(let i=0;i<12;i++) {
    const question=p.locator('[data-question-id]').first();await question.waitFor();
    const id=await question.getAttribute('data-question-id');
    const q=QUESTION_BANK.find(q=>q.id===id);if(!q)throw new Error('Synthetic source question missing');
    const wrong=q.tags?.includes('tfng');
    if(q.kind==='text-input')await p.locator('input[type=text]').first().fill(wrong?'synthetic-wrong':q.correctAnswer);
    else {
      const answer=wrong?q.options!.find(o=>o.id!==q.correctAnswer)!.id:q.correctAnswer;
      await p.locator(`.option:has(.option-key:text-is("${answer}"))`).first().click();
    }
    const next=p.getByRole('button',{name:'Далее',exact:true});
    if(await next.count()){await next.click();await p.waitForFunction(previous=>document.querySelector('[data-question-id]')?.getAttribute('data-question-id')!==previous,id);}
  }
  await p.getByRole('button',{name:'Завершить диагностику',exact:true}).click();
  await p.getByRole('button',{name:'Завершить и увидеть результат',exact:true}).click();
  await p.locator('#save-my-diagnostic').waitFor();
  const stop=p.getByRole('button',{name:'Убрать движение',exact:true});if(await stop.count())await stop.click();
  await capture(p,'diagnostic-result');
  await capture(p,'diagnostic-next','#save-my-diagnostic');
  await p.getByRole('button',{name:'Сохранить результат в моём профиле →',exact:true}).click();
  await p.getByRole('button',{name:/^Войти как ученик\./}).click();
  await p.locator('#my-diagnostics').waitFor();
  await capture(p,'profile-pending','#my-diagnostics');
  await p.getByRole('checkbox',{name:/Это моя попытка/}).check();
  await p.getByRole('button',{name:'Подтвердить сохранение',exact:true}).click();
  await p.getByText('Результат сохранён в демо-профиле этого браузера.',{exact:true}).waitFor();
  await capture(p,'profile-saved','#my-diagnostics');
  await p.getByText('Мои ответы · ✓ верно / × ошибка / — пропуск',{exact:true}).click();
  await capture(p,'profile-answers','#my-diagnostics');
  await p.reload();
  await p.locator('#my-diagnostics select').waitFor();
  await capture(p,'profile-restored','#my-diagnostics');
  await p.getByText('Удалить эту диагностику из профиля',{exact:true}).click();
  await p.getByRole('button',{name:'Выбрать для удаления',exact:true}).click();
  await p.getByRole('button',{name:'Да, удалить эту попытку',exact:true}).click();
  await p.getByText('Диагностика удалена из профиля.',{exact:true}).waitFor();
  await capture(p,'profile-deleted','#my-diagnostics');
} catch(e) {failures.push({flow:e instanceof Error?e.message:String(e)});await p.screenshot({path:dir+'/failure.png',fullPage:true});}
finally {
  await writeFile(dir+'/manifest.json',JSON.stringify({synthetic:true,mode:'local-demo-only; not cloud/auth-email/device acceptance',manifest,failures},null,2));
  await browser.close();
}
if(failures.length)process.exitCode=1;

}
main().catch(()=>{console.error('PROFILE_CAPTURE_FAILED');process.exitCode=1;});
