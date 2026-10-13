import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import batch from '../src/data/trainer-drafts/batch-08.json';
import batch13 from '../src/data/trainer-drafts/batch-13.json';
import batch01 from '../src/data/trainer-drafts/batch-01.json';
import { parseDraftTask2 } from '../src/lib/trainers/draft-task2';

async function main(){
  const base=process.env.TRAINER_CHECK_BASE??'http://127.0.0.1:3043';assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext(),page=await context.newPage(),errors:string[]=[],posts:string[]=[];
    page.on('pageerror',e=>errors.push(e.message));context.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
    await page.goto(base+'/trainers/material-review');await page.getByRole('heading',{name:'Нужно войти',exact:true}).waitFor();
    await page.evaluate(()=>{localStorage.setItem('ashyq:v2:session',JSON.stringify({user:{id:'synthetic-task2-review',name:'Synthetic reviewer',email:'synthetic@example.invalid',role:'teacher',avatarColor:'red'},expiresAt:new Date(Date.now()+3600000).toISOString()}));dispatchEvent(new Event('storage'));});
    await page.getByLabel('Партия материалов',{exact:true}).selectOption('08');
    for(const unit of [...batch.units,...batch13.units,...batch01.units.filter(value=>value.id.startsWith('W'))]){
      await page.getByLabel('Партия материалов',{exact:true}).selectOption(batch01.units.some(value=>value.id===unit.id)?'01':batch13.units.some(value=>value.id===unit.id)?'13':'08');
      const pair=parseDraftTask2(unit.exercise_data);assert.ok(pair);
      await page.getByLabel('Выбери материал',{exact:true}).selectOption(unit.id);
      const preview=page.getByRole('region',{name:'Пробное эссе · DRAFT',exact:true});
      await preview.getByRole('button',{name:'Начать пробу эссе',exact:true}).click();
      for(const [index,r]of pair.rounds.entries()){
        await preview.getByRole('heading',{name:index?'Новый текст · самостоятельный поиск':'Первый текст · самостоятельный поиск',exact:true}).waitFor();
        assert.equal(await preview.locator('[data-task2-source] mark').count(),0);
        if(!index) assert.equal(await preview.getByText(pair.rounds[1].prompt,{exact:true}).count(),0);
        assert.equal(await preview.getByText(r.argument.explanation,{exact:true}).count(),0);
        const reveal=preview.getByRole('button',{name:'Зафиксировать поиск и показать разбор',exact:true});
        await reveal.click();await preview.getByRole('alert').filter({hasText:'Заполни исходный фрагмент'}).waitFor();
        if(index===0){
          await preview.getByLabel('Исходный фрагмент 1',{exact:true}).fill('not a real quote');
          await preview.getByLabel('Твоя правка 1',{exact:true}).fill('deliberately wrong correction');
          await preview.getByLabel('Почему меняешь 1',{exact:true}).fill('Synthetic independent explanation.');
          await reveal.click();await preview.getByRole('alert').filter({hasText:'скопировать точно'}).waitFor();
          await preview.getByLabel('Исходный фрагмент 1',{exact:true}).fill(r.issues[0].before);
          await preview.getByRole('button',{name:'Добавить языковую правку',exact:true}).click();
          await preview.getByLabel('Исходный фрагмент 2',{exact:true}).fill(r.issues[1].before);
          await preview.getByLabel('Твоя правка 2',{exact:true}).fill(r.issues[1].after);
          await preview.getByLabel('Почему меняешь 2',{exact:true}).fill('Another synthetic explanation.');
          await preview.getByRole('button',{name:'Убрать правку 2',exact:true}).click();
          assert.equal(await preview.getByLabel('Исходный фрагмент 2',{exact:true}).count(),0);
        }else await preview.getByRole('checkbox',{name:/Не нашёл языковых проблем/}).check();
        await reveal.click();await preview.getByRole('alert').filter({hasText:'фрагмент аргумента'}).waitFor();
        await preview.getByLabel('Фрагмент аргумента, который хочешь проверить',{exact:true}).fill('fabricated argument');
        await preview.getByLabel('Что нужно уточнить или объяснить в аргументе?',{exact:true}).fill(`Synthetic argument reasoning ${unit.id}-${index}.`);
        await reveal.click();await preview.getByRole('alert').filter({hasText:'фрагмент аргумента'}).waitFor();
        await preview.getByLabel('Фрагмент аргумента, который хочешь проверить',{exact:true}).fill(r.argument.before);
        await reveal.click();
        await preview.getByRole('heading',{name:index?'Разбор нового текста':'Разбор первого текста',exact:true}).waitFor();
        assert.equal(await page.evaluate(()=>document.activeElement?.textContent),index?'Разбор нового текста':'Разбор первого текста');
        assert.equal(await preview.locator('[data-task2-source] mark').count(),r.issues.length);
        assert.equal(await preview.getByLabel('Исходный фрагмент 1',{exact:true}).count(),0,'initial fields no longer editable');
        assert.equal(await preview.getByRole('heading',{name:/Исходный фрагмент указан; правка не оценена/}).count(),index?0:1,'deliberately wrong repair gets no correctness claim');
        assert.equal(await preview.getByRole('heading',{name:/Этот целевой фрагмент не указан/}).count(),r.issues.length-(index?0:1));
        await preview.getByText(r.argument.explanation,{exact:true}).waitFor();
        assert.equal(await preview.getByText(r.example,{exact:true}).isVisible(),false);
        await preview.getByText('Показать пример с развитием аргумента',{exact:true}).click();await preview.getByText(r.example,{exact:true}).waitFor({state:'visible'});
        const next=preview.getByRole('button',{name:index?'Завершить пробу двух эссе':'Перейти к новому эссе',exact:true});
        await next.click();await preview.getByRole('alert').filter({hasText:'отдельная версия'}).waitFor();
        await preview.getByLabel('Твоя отдельная версия эссе после разбора',{exact:true}).fill(Array(249).fill('boundary').join(' '));
        await preview.getByRole('checkbox',{name:/Я сравнил язык/}).check();await preview.getByLabel('Что изменил и что ещё требует проверки?',{exact:true}).fill(`Synthetic reflection ${unit.id}-${index}.`);
        await next.click();await preview.getByRole('alert').filter({hasText:'отдельная версия'}).waitFor();
        // An unchanged source is allowed after comparison; no fake semantic quality gate.
        await preview.getByLabel('Твоя отдельная версия эссе после разбора',{exact:true}).fill(r.text);
        await preview.getByRole('checkbox',{name:/Я сравнил язык/}).uncheck();await next.click();await preview.getByRole('alert').filter({hasText:'подтверждение'}).waitFor();
        await preview.getByRole('checkbox',{name:/Я сравнил язык/}).check();
        await preview.getByLabel('Что изменил и что ещё требует проверки?',{exact:true}).fill('');await next.click();await preview.getByRole('alert').filter({hasText:'рефлексия'}).waitFor();
        await preview.getByLabel('Что изменил и что ещё требует проверки?',{exact:true}).fill(`Synthetic reflection ${unit.id}-${index}.`);
        if(['W01','W02','W03','W06'].includes(unit.id)&&index===0)for(const width of [320,390,768,1440]){
          await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
          assert.deepEqual((await new AxeBuilder({page}).include('main').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations,[]);
          if(width===390||width===1440){await preview.locator('[data-task2-source]').evaluate(e=>window.scrollTo({top:e.getBoundingClientRect().top+scrollY-155,behavior:'instant'}));await page.screenshot({path:`artifacts/trainers-complete-033/draft-task2-${unit.id}-feedback-${width}.png`});}
        }
        await next.click();
      }
      await preview.getByRole('heading',{name:'Два эссе: первая работа и версии после разбора',exact:true}).waitFor();
      await preview.getByText('deliberately wrong correction',{exact:false}).waitFor();
      for(let index=0;index<2;index++)await preview.getByText(`Synthetic argument reasoning ${unit.id}-${index}.`,{exact:true}).waitFor();
      assert.equal(await preview.getByText('Языковые проблемы не были указаны.',{exact:true}).count(),1);
      for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual((await new AxeBuilder({page}).include('main').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations,[]);}
      await preview.getByRole('button',{name:'Начать новую временную пробу эссе',exact:true}).click();await preview.getByRole('button',{name:'Начать пробу эссе',exact:true}).waitFor();
    }
    await page.reload();await page.getByLabel('Партия материалов',{exact:true}).selectOption('08');
    assert.equal(await page.getByRole('button',{name:'Начать пробу эссе',exact:true}).count(),1);
    assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('ashyq:trainer-review:')||k.startsWith('ashyq:trainer-checkpoint:')).length),0);
    assert.deepEqual(posts,[]);assert.deepEqual(errors,[]);
    console.log('PASS eight Task2 pairs/sixteen full essay flows including legacy v2: hidden keys/fresh text, own exact-quote/reason guards, add/remove/explicit no-findings, immutable search, wrong repair never marked correct, per-source numbered target highlights, separate language-only/developed examples, revision volume/manual acknowledgement/reflection, unchanged revision, first/fresh provenance, reset/reload/no writes, stage focus, four widths and axe. Synthetic manual-review fixtures; no free-text quality/band/approval claim.');
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
