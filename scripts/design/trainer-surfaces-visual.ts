/* Isolated CI visual acceptance. Native controls and synthetic authored examples
 * only; no storage seeding, microphone, credentials, external AI or new scoring. */
import { chromium, type Page } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { optionlessCases } from '../../src/lib/sat-optionless/cases';
import { distractorCases, expectedReason } from '../../src/lib/sat-distractor/cases';
import { listeningCases } from '../../src/lib/listening-replay/cases';
import { overviewItems } from '../../src/lib/task1-overview/cases';
import { translationCases } from '../../src/lib/sat-translation/cases';
import { cases as methodCases } from '../../src/lib/math-method-switch/cases';
import { mathForensicsCases } from '../../src/lib/math-forensics/cases';

const base = process.env.TRAINER_VISUAL_BASE ?? 'http://127.0.0.1:3000';
const dir = 'artifacts/trainer-visual';
const manifest: object[] = [], failures: object[] = [];
const button = (p: Page, name: string) => p.getByRole('button', { name, exact: true });
async function capture(p: Page, name: string) {
  await p.evaluate(() => document.fonts.ready);
  for (const width of [320, 390, 1280]) {
    await p.setViewportSize({ width, height: 900 });
    const heading = p.locator('h2[tabindex="-1"]').first();
    if (await heading.count()) await heading.evaluate(n => n.scrollIntoView({block:'start',behavior:'instant'}));
    const geometry = await p.evaluate(() => ({
      width: innerWidth, firstStartTop: [...document.querySelectorAll('main button')].find(n=>/^Начать/.test(n.textContent??''))?.getBoundingClientRect().top ?? null, overflow: document.documentElement.scrollWidth > innerWidth + 1,
      fields: [...document.querySelectorAll('main input:not([type=checkbox]):not([type=radio]),main textarea')].map(n => ({id:n.id,font:getComputedStyle(n).fontSize,height:Math.round(n.getBoundingClientRect().height)})),
    }));
    await p.screenshot({ path: `${dir}/${name}-${width}.png`, fullPage: false });
    if (width === 390) {
      await p.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
      await p.screenshot({ path: `${dir}/${name}-full.png`, fullPage: true });
    }
    manifest.push({ name, ...geometry });
    if (geometry.overflow) failures.push({ name, width, problem: 'horizontal overflow' });
  }
  const axe = await new AxeBuilder({page:p}).include('main').analyze();
  const serious = axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  if (serious.length) failures.push({ name, axe: serious.map(v => ({id:v.id,nodes:v.nodes.map(n=>n.target)})) });
}
async function choose(p: Page, route: string, index = 0) {
  await p.goto(base + '/trainers/' + route);
  await p.getByRole('heading', {level:1}).waitFor();
  await capture(p, route + '-entry');
  await button(p, 'Начать →').nth(index).click();
}

async function optionless(p: Page) {
  const c=optionlessCases[0];
  await choose(p,'sat-optionless');
  await capture(p,'optionless-predict');
  for(const round of ['first','transfer'] as const){
    const item=c[round];
    await p.locator('#optionless-prediction').fill(item.modelPrediction);
    await button(p,'Зафиксировать прогноз →').click();
    if(round==='first')await capture(p,'optionless-options');
    await p.getByRole('radio').nth(round==='first'?(item.correctIndex+1)%4:item.correctIndex).check();
    await button(p,'Проверить выбор →').click();
    await capture(p,'optionless-'+(round==='first'?'review':'result'));
    if(round==='first')await button(p,'Проверить навык на новом тексте →').click();
  }
}
async function distractor(p: Page) {
  const c=distractorCases[0];
  await choose(p,'sat-distractor');
  await capture(p,'distractor-answer');
  for(const round of ['first','transfer'] as const){
    const item=c[round], selected=round==='first'?(item.correctIndex+1)%4:item.correctIndex;
    await p.getByRole('radio').nth(selected).check();
    await button(p,'Зафиксировать выбор →').click();
    for(let i=0;i<item.choices.length;i++)if(i!==selected)await p.locator('#reason-'+i).selectOption(expectedReason(item,i));
    if(round==='first')await capture(p,'distractor-reasons');
    await button(p,'Открыть разбор →').click();
    await capture(p,'distractor-'+(round==='first'?'review':'result'));
    if(round==='first')await button(p,'Проверить на новом тексте →').click();
  }
}
async function translation(p: Page) {
  await choose(p,'sat-translation');
  const c=translationCases[0];
  for(let round=0;round<2;round++){
    const item=c.items[round];
    await p.locator('#model-variable').selectOption(item.variable);
    await p.locator('#model-setup').fill(String(item.setup));
    await p.locator('#model-rate').fill(String(item.rate));
    await p.locator('#model-total').fill(String(item.total));
    await p.locator('input[name="equation-form"][value="once"]').check();
    if(round===0)await capture(p,'translation-model');
    await button(p,'Зафиксировать модель →').click();
    await p.locator('#calculation-working').fill('Synthetic visual acceptance: subtract the one-time payment, then divide by the rate.');
    await p.locator('#calculation-answer').fill(String(item.answer));
    if(round===0)await capture(p,'translation-calculate');
    await button(p,'Открыть разбор →').click();
    if(round===0)await capture(p,'translation-review');
    await p.locator('#model-repair').fill('Проверю, что разовый платёж прибавлен один раз и единицы совпадают.');
    await button(p,round===0?'Проверить на новой задаче →':'Сравнить две попытки →').click();
  }
  await capture(p,'translation-result');
}
async function method(p: Page) {
  await choose(p,'math-method-switch');
  for(let round=0;round<2;round++){
    const item=methodCases[0].items[round];
    await p.locator('#method-working').fill('Synthetic visual acceptance: equate the two expressions and substitute x.');
    await p.locator('#method-x').fill(String(item.x));await p.locator('#method-y').fill(String(item.y));
    await p.locator('#used-method').selectOption(round===0?'algebra':'graph');
    if(round===0)await capture(p,'method-solve');
    await button(p,'Зафиксировать и открыть разбор →').click();
    if(round===0){await p.locator('#alternative-method').selectOption('graph');await capture(p,'method-review-graph');}
    await p.locator('#method-plan').fill('Сверю координаты пересечения с обоими уравнениями.');
    // Original button copy differs by round; identify its native phase action.
    await button(p,round===0?'Попробовать на новой задаче →':'Сравнить попытки →').click();
  }
  await capture(p,'method-result');
}
async function task1(p: Page) {
  await p.goto(base+'/trainers/task1-overview');await button(p,'Начать с первого графика →').click();
  for(let round=0;round<2;round++){
    const item=overviewItems[round];
    for(const i of [0,1,2])await p.getByRole('checkbox',{name:item.claims[i].text,exact:true}).check();
    await p.locator('#own-overview').fill(item.modelOverview);
    if(round===0)await capture(p,'task1-overview');
    await button(p,'Зафиксировать overview →').click();
    for(let i=0;i<3;i++)await p.locator('#evidence-'+i).selectOption(String(item.claims[i].evidence));
    await button(p,'Зафиксировать опоры →').click();
    for(let i=0;i<item.inaccurate.length;i++)await p.locator('#accuracy-'+i).selectOption(String(item.inaccurate[i].reason));
    await p.locator('#data-correction').fill(item.inaccurate.map(e=>e.correction).join(' '));
    await button(p,'Открыть разбор →').click();
    if(round===0){
      await capture(p,'task1-review');
      await p.locator('summary').filter({hasText:'Какие особенности важнее всего?'}).click();
      await capture(p,'task1-claims');
      await button(p,'Собрать полный ответ →').click();
      await p.locator('#task1-draft').fill(item.modelResponse);
      await capture(p,'task1-draft');
      await button(p,'Перейти к самопроверке →').click();
      await p.locator('#revision-focus').selectOption('Главное и точность данных');
      await p.getByRole('checkbox',{name:'Я проверил выбранный аспект и решил сохранить текст без правок',exact:true}).check();
      await button(p,'Сохранить и попробовать новый график →').click();
    }else await button(p,'Сравнить две попытки →').click();
  }
  await capture(p,'task1-result');
  await p.getByText('Графики и таблицы двух заданий',{exact:true}).click();
  await capture(p,'task1-result-charts');
}
async function listening(p: Page) {
  await choose(p,'listening-replay');
  const c=listeningCases[0];
  for(const round of ['first','transfer'] as const){
    const item=c[round];
    await p.locator('#listening-type').selectOption(item.answerType);
    await p.locator('#listening-cue').selectOption(item.cue);
    if(round==='first')await capture(p,'listening-predict');
    // Text fallback is explicitly labelled reading; no hearing-quality claim.
    await button(p,'Не могу слушать: использовать текст').click();
    await p.locator('#listening-answer').fill(round==='first'?'Tuesday':item.answer);
    await p.locator('#listening-confidence').selectOption('Средняя');
    if(round==='first')await capture(p,'listening-answer-text');
    await button(p,'Зафиксировать ответ →').click();
    await p.locator('#listening-diagnosis').selectOption({index:1});
    await button(p,'Перейти к проверке →').click();
    if(round==='first'){
      await capture(p,'listening-repair');
      await p.locator('#listening-repair').fill(item.answer);
      await button(p,'Проверить исправление →').click();
      await capture(p,'listening-review');
      await button(p,'Попробовать новую запись →').click();
    }
  }
  await capture(p,'listening-result');
}
async function speaking(p: Page) {
  await p.goto(base+'/trainers/speaking-second-take');await button(p,'Начать подготовку →').click();
  for(let round=0;round<3;round++){
    await p.locator('#speaking-notes').fill('Synthetic speaking notes: a community garden, a volunteer, a useful lesson.');
    if(round===0)await capture(p,'speaking-prepare');
    await button(p,'Я готов к ответу →').click();
    if(round===0)await capture(p,'speaking-capture');
    await button(p,'Самостоятельная попытка без аудио →').click();
    await p.getByRole('checkbox',{name:'Не выделил отдельные моменты; всё равно проверю четыре аспекта',exact:true}).check();
    for(let i=0;i<4;i++)await p.locator('#speaking-rating-'+i).selectOption('Есть удачные и трудные места');
    await p.locator('#speaking-plan').fill('В следующем ответе приведу конкретный пример и объясню его связь с темой.');
    await p.getByRole('checkbox',{name:'Я ответил вслух самостоятельно и заполнил самопроверку',exact:true}).check();
    if(round===0)await capture(p,'speaking-self-review');
    await button(p,'Сохранить самопроверку →').click();
    if(round<2)await button(p,round===0?'Повторить ту же тему по плану →':'Проверить себя на новой теме →').click();
  }
  await capture(p,'speaking-result');
}
async function forensics(p: Page) {
  await choose(p,'math-forensics',1);
  const item=mathForensicsCases[1];
  const steps=p.getByRole('group',{name:'Выбери первую неверную строку решения',exact:true});
  await steps.getByRole('button').nth(1).click();
  await p.getByRole('radio',{name:item.mechanism,exact:true}).check();
  await p.locator('#math-repair').fill('Synthetic own line: After 20% increase: $96');
  await button(p,'Зафиксировать попытку →').click();
  await capture(p,'forensics-percent-mixed');
  await button(p,'Продолжить решение →').click();await p.locator('#math-own-answer').fill('96');
  await button(p,'Зафиксировать решение →').click();
  await p.getByRole('group',{name:'Выбери первую неверную строку решения',exact:true}).getByRole('button').nth(item.transfer.wrongStepIndex).click();
  await p.locator('#math-transfer-answer').fill('148,5');
  await button(p,'Проверить новый пример →').click();await capture(p,'forensics-percent-result');
}

async function main(){
  await mkdir(dir,{recursive:true});const browser=await chromium.launch({headless:true});
  try{
    for(const [name,flow] of Object.entries({optionless,distractor,translation,method,task1,listening,speaking,forensics})){
      const context=await browser.newContext({viewport:{width:390,height:900}}),p=await context.newPage();
      p.setDefaultTimeout(12000);const errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));
      try{await flow(p);if(errors.length)failures.push({name,errors});console.log('CAPTURED',name);}
      catch(error){failures.push({name,error:String(error)});await p.screenshot({path:`${dir}/failure-${name}.png`,fullPage:true}).catch(()=>{});}
      finally{await context.close();}
    }
  }finally{await browser.close();await writeFile(`${dir}/manifest.json`,JSON.stringify({synthetic:true,scope:'visual acceptance; no quality/band evidence',manifest,failures},null,2));}
  if(failures.length){console.error(JSON.stringify(failures,null,2));process.exitCode=1;}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
