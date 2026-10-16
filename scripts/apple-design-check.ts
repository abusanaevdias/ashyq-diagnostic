import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import raw from '../src/data/free-library-content.json';
import {trainerCatalog} from '../src/lib/trainers/catalog';

async function main(){
 const base=process.env.BASE_URL??'http://127.0.0.1:3054';assert.ok(['localhost','127.0.0.1','ashyq-diagnostic.vercel.app'].includes(new URL(base).hostname));
 const output='artifacts/apple-design-036';await fs.mkdir(output,{recursive:true});
 const review=raw.sections.find(s=>s.code==='U02-A-REVIEW')!;
 const libraryReview='/library/u02-talent-practice#'+review.code.toLowerCase();
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({reducedMotion:'reduce'});await context.route('**/_vercel/insights/**',route=>route.fulfill({status:204}));const page=await context.newPage(),errors:string[]=[],posts:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(['POST','PUT','PATCH','DELETE'].includes(r.method()))posts.push(r.url());});
  await page.goto(base+'/trainers');await page.getByRole('heading',{name:'Учись на своей первой попытке',exact:true}).waitFor();
  const filters=page.getByRole('group',{name:'Фильтр по экзамену',exact:true});
  assert.equal(await page.locator('[data-trainer-exam]').count(),11);
  for(const exam of ['SAT','IELTS']){await filters.getByRole('button',{name:exam,exact:true}).click();assert.equal(await page.locator('[data-trainer-exam]').count(),exam==='SAT'?5:6);assert.equal(await page.locator(`[data-trainer-exam]:not([data-trainer-exam="${exam}"])`).count(),0);}
  await filters.getByRole('button',{name:'Все',exact:true}).focus();await page.keyboard.press('Enter');assert.equal(await page.locator('[data-trainer-exam]').count(),11);
  const hrefs=await page.locator('[data-trainer-exam] a').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')));for(const item of trainerCatalog)assert.ok(hrefs.includes(item.id==='writing-task2'?'/writing/trainer':item.href));
  await page.goto(base+'/');await page.getByRole('heading',{level:1}).waitFor();
  // System fonts differ between Windows and the Linux release runner. Keep both
  // free entry points inside the short phone viewport with either fallback.
  await page.setViewportSize({width:390,height:664});
  for(const family of ['system-ui','Arial, sans-serif','sans-serif']){
   await page.locator('[data-study-design="apple"]').evaluate((node,font)=>{(node as HTMLElement).style.setProperty('--font-system',font);},family);
   const entry=await page.getByRole('navigation',{name:'Первые шаги: диагностика и библиотека'}).getByRole('link',{name:/Бесплатная библиотека/}).boundingBox();
   assert.ok(entry&&entry.y+entry.height<=664,`free library above fold with ${family}: ${entry?entry.y+entry.height:'missing'}`);
  }
  await page.locator('[data-study-design="apple"]').evaluate(node=>{(node as HTMLElement).style.removeProperty('--font-system');});
  const demo=page.getByRole('region',{name:'Учебный пример работы тренажёра',exact:true});await demo.getByRole('button',{name:'Показать объяснение',exact:false}).click();assert.equal(await demo.locator('mark').textContent(),'makes');await demo.getByRole('button',{name:'Вернуться к своей попытке',exact:false}).click();assert.equal(await demo.locator('mark').textContent(),'make');
  await page.goto(base+libraryReview);await page.setViewportSize({width:320,height:900});
  await page.getByRole('button',{name:/4 · GRA/}).filter({visible:true}).click();
  // Long labels must fit the inner comment card even with wider glyph metrics.
  await page.addStyleTag({content:'[data-inline-review] button {font-size:20px !important}'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'expanded GRA controls fit320px');
  for(const button of await page.locator('[data-inline-review] button').all())assert.ok(await button.evaluate(node=>node.getBoundingClientRect().right<=node.parentElement!.getBoundingClientRect().right+1),'comment controls stay inside their own card');
  const routes=['/','/trainers','/library',libraryReview,...trainerCatalog.map(t=>t.id==='writing-task2'?'/writing/trainer':t.href),'/writing/trainer/practice'];
  const audited=[];
  for(const route of [...new Set(routes)]){
   await page.goto(base+route);await page.locator('[data-study-design="apple"]').waitFor();await page.getByRole('heading',{level:1}).first().waitFor();
   for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:900});await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
    const bounds=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(bounds.scroll<=bounds.width+1,`${route} overflow ${width}: ${bounds.scroll}`);
    assert.ok((await page.locator('main').first().evaluate(el=>getComputedStyle(el).fontFamily)).startsWith('system-ui'),`${route}: approved system typography`);
    assert.equal(await page.getByRole('group',{name:'Разделы обучения',exact:true}).filter({visible:true}).count(),1,`${route}: one visible study navigation`);
    const violations=(await new AxeBuilder({page}).include('main').analyze()).violations;assert.deepEqual(violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],`${route} ${width}`);audited.push({route,width});
    if((route==='/'||route==='/trainers'||route===libraryReview)&&(width===390||width===1440)){await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));const name=route==='/'?'home':route==='/trainers'?'catalog':'lesson';await page.screenshot({path:`${output}/${name}-${width}.png`,fullPage:true});await page.screenshot({path:`${output}/${name}-top-${width}.png`,clip:{x:0,y:0,width,height:1200}});}
   }
  }
  // The menu still gives access to the remaining public pages and login on small screens.
  await page.goto(base+'/trainers');await page.setViewportSize({width:390,height:844});const menu=page.getByLabel('Открыть меню',{exact:true});await menu.click();await page.getByRole('navigation',{name:'Основная навигация',exact:true}).getByRole('link',{name:'Курсы',exact:true}).filter({visible:true}).waitFor();await page.keyboard.press('Escape');assert.equal(await menu.evaluate(node=>node===document.activeElement),true);
  await page.addStyleTag({content:'html {font-size:200% !important}'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'200% text does not overflow');
  await page.emulateMedia({contrast:'more'});assert.deepEqual((await new AxeBuilder({page}).include('main').analyze()).violations.map(v=>v.id),[],'high contrast and200% text');
  assert.ok(await page.getByRole('group',{name:'Фильтр по экзамену',exact:true}).evaluate(group=>{const selected=group.querySelector('[aria-pressed="true"]')!.getBoundingClientRect(),pill=group.querySelector('span[aria-hidden]')!.getBoundingClientRect();return Math.abs(selected.left-pill.left)<1&&Math.abs(selected.width-pill.width)<1;}),'high contrast border preserves indicator alignment');
  assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);
  await context.close();
  // Re-target while the spring is moving; controls are never locked during motion.
  const moving=await browser.newContext({reducedMotion:'no-preference'});await moving.route('**/_vercel/insights/**',route=>route.fulfill({status:204}));const motionPage=await moving.newPage();await motionPage.goto(base+'/trainers');const movingFilters=motionPage.getByRole('group',{name:'Фильтр по экзамену',exact:true});
  for(const label of ['SAT','IELTS','SAT','Все','IELTS']){await movingFilters.getByRole('button',{name:label,exact:true}).click({force:true});}
  assert.equal(await movingFilters.getByRole('button',{name:'IELTS',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await motionPage.locator('[data-trainer-exam]').count(),6);assert.equal(await movingFilters.locator('button:disabled').count(),0);
  await motionPage.waitForFunction(()=>{const group=document.querySelector('[aria-label="Фильтр по экзамену"]')!,selected=group.querySelector('[aria-pressed="true"]')!.getBoundingClientRect(),pill=group.querySelector('span[aria-hidden]')!.getBoundingClientRect();return Math.abs(pill.left-selected.left)<1&&Math.abs(pill.width-selected.width)<1;});await moving.close();
  // Reproduce the Linux resize race: the previous highlight geometry can survive
  // a shrink until ResizeObserver delivers. Clip decoration only, keeping native
  // links/focus outside that layer and usable even before the next paint.
  for(const reducedMotion of ['reduce','no-preference'] as const){
   const resizing=await browser.newContext({viewport:{width:768,height:844},reducedMotion});
   await resizing.addInitScript(()=>{const Native=window.ResizeObserver;window.ResizeObserver=class extends Native{constructor(callback:ResizeObserverCallback){super((entries,observer)=>{setTimeout(()=>callback(entries,observer),2000);});}};});
   const narrow=await resizing.newPage();await narrow.goto(base+'/library/grammar-block-1#g1-q');await narrow.locator('[data-fluid-ready]').filter({visible:true}).waitFor();
   await narrow.setViewportSize({width:320,height:844});assert.equal(await narrow.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0,`no transient decoration overflow: ${reducedMotion}`);
   const navigation=narrow.getByRole('group',{name:'Разделы обучения',exact:true}).filter({visible:true});
   for(const link of await navigation.getByRole('link').all())assert.ok(await link.evaluate(node=>{const r=node.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}),'actual links remain visible');
   await resizing.close();
  }
  await fs.writeFile(`${output}/checks.json`,JSON.stringify({base,audited,errors,posts,limits:'Responsive browser emulation and interface checks, not physical phone or learning-quality acceptance.'},null,2));
  console.log(`PASS approved Apple study design: ${audited.length} route/width axe+overflow checks;11 working trainer entries, IELTS6/SAT5/native keyboard filters, real demo reveal, one visible route nav,200% text, interruptible spring re-target and reduced motion. No storage/role/scoring changes.`);
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
