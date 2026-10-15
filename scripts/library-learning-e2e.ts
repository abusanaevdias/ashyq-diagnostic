import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import raw from '../src/data/free-library-content.json';
import { LIBRARY_CHAPTERS } from '../src/data/free-library';
const base=process.env.BASE_URL || 'http://127.0.0.1:3050';
export async function runLibraryLearningCheck(){
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await context.newPage(), errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const out='artifacts/library-ux-034';await mkdir(out,{recursive:true});
 try{
  await page.goto(`${base}/library/grammar-block-1#g1-q`,{waitUntil:'networkidle'});
  let quiz=page.getByRole('region',{name:'Интерактивная практика G1-Q',exact:true});
  await quiz.getByRole('button',{name:'Вопрос 5',exact:true}).click();
  await quiz.getByRole('radio',{name:'have',exact:true}).check();await quiz.getByRole('button',{name:'Проверить ответ',exact:true}).click();
  assert.equal(await quiz.getByRole('button',{name:'Вопрос 5 — неверно',exact:true}).getAttribute('data-result'),'wrong');
  assert.ok((await quiz.getByRole('button',{name:'Вопрос 5 — неверно',exact:true}).innerText()).includes('×'));
  await page.reload({waitUntil:'networkidle'});assert.equal(await quiz.getByRole('radio',{name:'have',exact:true}).isChecked(),true);
  assert.equal(await quiz.getByRole('button',{name:'Вопрос 5 — неверно',exact:true}).count(),1);
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth)),0,`practice overflow ${width}`);
   const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(audit.violations.map(v=>({id:v.id,nodes:v.nodes.length})),[],`practice axe ${width}`);
  }
  await page.setViewportSize({width:390,height:844});
  await quiz.scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/wrong-answer-mobile.png`});
  await quiz.getByRole('radio',{name:'has',exact:true}).check();assert.equal(await quiz.getByRole('button',{name:'Вопрос 5 — есть ответ',exact:true}).count(),1);
  await quiz.getByRole('button',{name:'Проверить ответ',exact:true}).click();assert.equal(await quiz.getByRole('button',{name:'Вопрос 5 — верно',exact:true}).getAttribute('data-result'),'correct');
  await page.goto(`${base}/library/u02-talent-practice#u02-q-2`,{waitUntil:'networkidle'});
  quiz=page.getByRole('region',{name:'Интерактивная практика U02-Q-2',exact:true});assert.ok((await quiz.innerText()).includes('Пишите ответ на английском'));
  const answer='Although talent can provide an early advantage, regular practice is more important for lasting progress because it helps learners identify weaknesses and steadily improve their skills.';
  await quiz.getByLabel('Ваш ответ',{exact:true}).fill(answer);await quiz.getByRole('button',{name:'Сравнить с образцом',exact:true}).click();
  assert.equal(await quiz.getByRole('button',{name:'Вопрос 1 — сравнён с образцом, без оценки',exact:true}).getAttribute('data-result'),'reviewed');
  await page.goto(`${base}/library/reading-equipment#r01-b`,{waitUntil:'networkidle'});
  assert.equal(await page.locator('#r01-b').getByText('The equipment library',{exact:true}).count(),1);
  await page.goto(`${base}/library/u02-talent-practice#u02-q-2`,{waitUntil:'networkidle'});assert.equal(await quiz.getByLabel('Ваш ответ',{exact:true}).inputValue(),answer);
  await page.goto(`${base}/library/u02-talent-practice`,{waitUntil:'networkidle'});assert.equal(await page.locator('[class*="activePanel"] > section:visible').count(),0);
  await page.locator('a[href="#u02-a"]').first().click();assert.equal(await page.locator('[class*="activePanel"] > section:visible').count(),1);
  assert.ok((await page.locator('#u02-a').textContent())!.includes('Начало текста'));
  await page.locator('#u02-a').getByRole('link',{name:'Разобрать этот пример →',exact:true}).click();
  await page.waitForURL('**/u02-talent-practice#u02-a-review');assert.ok(await page.locator('#u02-a-review mark:visible').count()>0);
  await page.locator('#u02-a-review').getByRole('button',{name:/4 · GRA/}).click();assert.ok(await page.locator('#u02-a-review mark:visible').count()>0);
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth)),0,`review overflow ${width}`);
   const a11y=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(a11y.violations.map(v=>({id:v.id,nodes:v.nodes.length})),[],`a11y ${width}`);
   await page.evaluate(()=>scrollTo(0,0));
   if(width===390||width===1440)await page.screenshot({path:`${out}/essay-review-${width}.png`,fullPage:true});
  }
  await page.goBack();assert.ok(page.url().endsWith('#u02-a'),'browser Back restores example');await page.goForward();assert.ok(page.url().endsWith('#u02-a-review'));
  // Another tab cannot silently replace the current screen or its draft.
  const second=await context.newPage();await second.goto(`${base}/library/u02-talent-practice#u02-q-2`,{waitUntil:'networkidle'});
  await page.goto(`${base}/library/u02-talent-practice#u02-q-2`,{waitUntil:'networkidle'});
  const sq=second.getByRole('region',{name:'Интерактивная практика U02-Q-2',exact:true});
  await page.getByRole('region',{name:'Интерактивная практика U02-Q-2',exact:true}).getByLabel('Ваш ответ',{exact:true}).fill('A newer saved answer from the first tab.');
  await sq.getByRole('alert').waitFor();assert.equal(await sq.getByLabel('Ваш ответ',{exact:true}).inputValue(),answer);
  await sq.getByLabel('Ваш ответ',{exact:true}).fill('Keep this conflicting local draft.');
  assert.ok((await second.evaluate(()=>localStorage.getItem('ashyq:library-progress:v1:U02-Q-2')))!.includes('A newer saved answer from the first tab.'));
  second.once('dialog',d=>d.accept());await sq.getByRole('button',{name:'Загрузить сохранённую версию',exact:true}).click();assert.equal(await sq.getByLabel('Ваш ответ',{exact:true}).inputValue(),'A newer saved answer from the first tab.');await second.close();
  await page.locator('a[href="/library"]').first().click();await page.waitForURL('**/library');
  const away=await context.newPage();await away.goto(`${base}/library/u02-talent-practice#u02-q-2`,{waitUntil:'networkidle'});
  await away.getByRole('region',{name:'Интерактивная практика U02-Q-2',exact:true}).getByLabel('Ваш ответ',{exact:true}).fill('Updated while the first tab was outside the lesson.');
  await page.goBack();await page.getByRole('region',{name:'Интерактивная практика U02-Q-2',exact:true}).waitFor();
  assert.equal(await page.getByRole('region',{name:'Интерактивная практика U02-Q-2',exact:true}).getByLabel('Ваш ответ',{exact:true}).inputValue(),'Updated while the first tab was outside the lesson.','SPA remount refreshes a clean snapshot');await away.close();
  for(const [slug,code] of [['task1-courses','T1A-C'],['task1-budget','T1B-C'],['task1-process','T1C-C']]){
   const chapter=LIBRARY_CHAPTERS.find(c=>raw.sections.some(s=>s.code===code&&s.source===c.source&&s.page>=c.start&&s.page<=c.end))!;
   assert.ok(chapter,slug);await page.goto(`${base}/library/${chapter.slug}#${code.toLowerCase()}`,{waitUntil:'networkidle'});
   const report=page.locator(`[id="${code.toLowerCase()}"]`);await report.getByRole('button',{name:'Открыть пошаговый разбор отчёта',exact:true}).click();assert.equal(await report.getByRole('button',{name:'Закрыть пошаговый разбор отчёта',exact:true}).getAttribute('aria-expanded'),'true');
   assert.ok(await report.getByRole('navigation',{name:'Комментарии к эссе',exact:true}).count()>0);
  }
  // A storage failure must preserve the editable response and disclose that it is not durable.
  const failure=await browser.newContext();await failure.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('full','QuotaExceededError');};});
  const fp=await failure.newPage();await fp.goto(`${base}/library/u02-talent-practice#u02-q-2`,{waitUntil:'networkidle'});
  const fq=fp.getByRole('region',{name:'Интерактивная практика U02-Q-2',exact:true});await fq.getByLabel('Ваш ответ',{exact:true}).fill('Keep my unsaved text.');assert.equal(await fq.getByLabel('Ваш ответ',{exact:true}).inputValue(),'Keep my unsaved text.');assert.ok((await fq.getByRole('alert').innerText()).includes('Не удалось сохранить'));await failure.close();
  const corrupt=await browser.newContext();await corrupt.addInitScript(()=>localStorage.setItem('ashyq:library-progress:v1:G1-Q','{"old":"my response"}'));
  const cp=await corrupt.newPage();await cp.goto(`${base}/library/grammar-block-1#g1-q`,{waitUntil:'networkidle'});
  const cq=cp.getByRole('region',{name:'Интерактивная практика G1-Q',exact:true});assert.equal(await cq.getByRole('radio').first().isDisabled(),true);assert.ok((await cq.getByRole('alert').innerText()).includes('повреждён'));assert.equal(await cp.evaluate(()=>localStorage.getItem('ashyq:library-progress:v1:G1-Q')),'{"old":"my response"}');cp.once('dialog',d=>d.accept());await cq.getByRole('button',{name:'Начать заново',exact:true}).click();assert.equal(await cq.getByRole('radio').first().isDisabled(),false);await corrupt.close();
  let stages=0;
  for(const chapter of LIBRARY_CHAPTERS){
   await page.goto(`${base}/library/${chapter.slug}`,{waitUntil:'networkidle'});
   const subset=raw.sections.filter(s=>s.source===chapter.source&&s.page>=chapter.start&&s.page<=chapter.end);
   for(const section of subset){
    await page.evaluate(code=>{location.hash=code;},section.code.toLowerCase());
    await page.waitForFunction(code=>{const el=document.getElementById(code);return !!el&&!el.hidden;},section.code.toLowerCase());
    assert.equal(await page.locator('[class*="activePanel"] > section:visible').count(),1,section.code);
    assert.equal(await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth)),0,`${section.code} overflow`);stages++;
   }
  }
  assert.equal(stages,198);assert.deepEqual(errors,[]);
  await writeFile(`${out}/browser-result.json`,JSON.stringify({chapters:42,stages,errors,persistence:true,correctness:true,review:true,a11yWidths:[320,390,768,1440],quota:true,corrupt:true},null,2));
  console.log('PASS 42 chapters / 198 exclusive stages; reload+navigation persistence; correct/wrong/ungraded; English; annotated essay; Back/Forward; quota/corrupt recovery; four-width overflow and axe.');
 }finally{await browser.close();}
}
if(process.argv[1]?.replace(/\\/g,'/').endsWith('/library-learning-e2e.ts')) runLibraryLearningCheck().catch(e=>{console.error(e);process.exitCode=1;});
