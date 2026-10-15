import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {draftBatches,draftArchives,emptyDraftReview,reviewKey} from '../src/lib/trainers/draft-review';

async function main(){
 const base=process.env.TRAINER_CHECK_BASE??'http://127.0.0.1:3052';assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext(),page=await context.newPage(),actor='synthetic-edition-035',errors:string[]=[],posts:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(['POST','PUT','PATCH','DELETE'].includes(r.method()))posts.push(r.url());});
  await page.goto(base+'/trainers/material-review');await page.getByRole('heading',{name:'Нужно войти',exact:true}).waitFor();
  const changed=['01','03','04','08','10','11','13'];
  const records=changed.map(id=>{
   const current=draftBatches.find(b=>b.batch===id)!,previous=draftArchives.filter(b=>b.batch===id).sort((a,b)=>Number(b.version)-Number(a.version))[0],review=emptyDraftReview(actor,previous),unit=previous.units[0];
   review.decisions[unit.id]={decision:'recommend',attested:true,comment:`SYNTHETIC previous ${id}/${previous.version}; not real approval`,savedAt:'2026-10-15T00:00:00.000Z'};
   return {current,previous,raw:JSON.stringify(review,null,2)+'\n',key:reviewKey(actor,previous),newKey:reviewKey(actor,current),unit};
  });
  await page.evaluate(({actor,records})=>{for(const r of records)localStorage.setItem(r.key,r.raw);localStorage.setItem('ashyq:v2:session',JSON.stringify({user:{id:actor,name:'Synthetic reviewer',email:'synthetic@example.invalid',role:'teacher',avatarColor:'red'},expiresAt:new Date(Date.now()+3600000).toISOString()}));dispatchEvent(new Event('storage'));},{actor,records});
  for(const r of records){
   await page.getByLabel('Партия материалов',{exact:true}).selectOption(r.current.batch);
   await page.getByRole('heading',{name:`Рассмотрено 0 из ${r.current.units.length}`,exact:true}).waitFor();
   assert.equal(await page.getByLabel('Результат проверки',{exact:true}).inputValue(),'pending');assert.equal(await page.getByRole('checkbox',{name:'Проверил условие, ключ, допустимые альтернативы и понятность разбора.',exact:true}).isChecked(),false);
   const archive=page.getByRole('region',{name:`Архив прежней версии · ${r.previous.version}`,exact:true});await archive.waitFor();
   await archive.getByText(`Рассмотрено в прежней версии: 1 из ${r.previous.units.length}. Это отдельные архивные решения.`,{exact:true}).waitFor();
   const pending=page.waitForEvent('download');await archive.getByRole('button',{name:'Скачать решения прежней версии',exact:true}).click();const download=await pending;const file=await download.path();assert.ok(file);assert.equal(await (await import('node:fs/promises')).readFile(file,'utf8'),r.raw);
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),r.key),r.raw);assert.equal(await page.evaluate(key=>localStorage.getItem(key),r.newKey),null,'old attestation never creates current approval');
  }
  assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);
 }finally{await browser.close();}
 console.log('PASS7 revised batch editions: exact previous-review download/raw retained, current pending/unattested/zero, no automatic migration or server writes. Synthetic role UI is not actual teacher approval/RLS.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
