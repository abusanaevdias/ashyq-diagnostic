import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { trainerBank } from '../src/lib/trainers/bank-sources';
import { draftBatches,draftArchives } from '../src/lib/trainers/draft-review';
import { approvalMaterial } from '../src/lib/trainers/approval-material';
import audio02 from '../src/data/trainer-drafts/listening-audio-02.json';
import audio10 from '../src/data/trainer-drafts/listening-audio-10.json';

const output=path.resolve(process.env.APPROVAL_OUTPUT_DIR??'artifacts/library-ux-034');
async function main(){
 assert.deepEqual(trainerBank.errors,[]);assert.equal(trainerBank.sources.length,108);
 for(const b of [...draftBatches,...draftArchives])assert.equal(crypto.createHash('sha256').update(JSON.stringify(b.units)).digest('hex'),b.content_sha256);
 for(const id of ['01','03','04','08','10','11','13']){
  const current=draftBatches.find(b=>b.batch===id)!;const old=draftArchives.filter(b=>b.batch===id&&String(b.version)!==String(current.version));
  assert.ok(old.length);assert.ok(old.every(b=>b.content_sha256!==current.content_sha256));
 }
 for(const s of trainerBank.sources){
  const m=approvalMaterial(s),e=s.exercise;
  assert.equal(m.rounds.length,e.type==='writing-drill'&&!e.value.transfer?1:2,s.ref.unitId);
  assert.ok(m.rounds.every(r=>r.student.trim()&&r.teacher.trim()));
  for(const r of m.rounds)assert.ok(!r.student.includes('Подходит:')&&!r.student.includes('Ключ:'));
  if(e.type==='task2')e.value.rounds.forEach((r,i)=>{assert.ok(m.rounds[i].student.includes(r.prompt)&&m.rounds[i].student.includes(r.text));assert.ok(!m.rounds[i].student.includes(r.languageOnly));assert.ok(m.rounds[i].teacher.includes(r.example));});
  if(e.type==='reading')e.value.rounds.forEach((r,i)=>{assert.ok(m.rounds[i].student.includes(r.text));r.claims.forEach(c=>assert.ok(m.rounds[i].student.includes(c.statement)));});
  if(e.type==='reading-lab')e.value.rounds.forEach((r,i)=>{r.paragraphs.forEach(p=>assert.ok(m.rounds[i].student.includes(p.text)));r.options.forEach(o=>assert.ok(m.rounds[i].student.includes(o.text)));assert.ok(m.rounds[i].teacher.includes(r.explanation));});
  if(e.type==='sat-rw')e.value.rounds.forEach((r,i)=>{assert.ok(m.rounds[i].student.includes(r.passage));r.choices.forEach(c=>assert.ok(m.rounds[i].student.includes(c.text)));});
  if(e.type==='math')e.value.rounds.forEach((r,i)=>{assert.ok(m.rounds[i].student.includes(r.prompt));assert.ok(m.rounds[i].teacher.includes(r.explanation));if(r.methods)for(const method of r.methods){assert.ok(m.rounds[i].teacher.includes(method.working.join('\n')));assert.ok(!m.rounds[i].student.includes(method.working.join('\n')));}});
  if(e.type==='listening')e.value.rounds.forEach((r,i)=>{assert.ok(!m.rounds[i].student.includes(r.script));assert.ok(m.rounds[i].teacher.includes(r.script));assert.equal(m.rounds[i].audio[0].url,r.fullUrl);});
  if(e.type==='task1-line')e.value.charts.forEach((c,i)=>{c.series.forEach(series=>{assert.ok(m.rounds[i].student.includes(series.name));series.values.forEach(v=>assert.ok(m.rounds[i].student.includes(String(v))));});assert.ok(m.rounds[i].teacher.includes('The table '));});
  if(e.type==='task1-categories')e.value.charts.forEach((c,i)=>{c.categories.forEach((label,j)=>assert.ok(m.rounds[i].student.includes(`${label} | ${c.values[j]}`)));assert.ok(m.rounds[i].teacher.includes('The table '));});
  if(e.type==='task1-diagrams')e.value.charts.forEach((c,i)=>{if(c.chartType==='process')c.diagram.stages.forEach(stage=>assert.ok(m.rounds[i].student.includes(stage.detail)));else c.diagram.frames.forEach(frame=>{assert.ok(m.rounds[i].student.includes(frame.period));frame.cells.forEach(label=>assert.ok(m.rounds[i].student.includes(label)));});});
 }
 const byId=(id:string)=>trainerBank.sources.find(s=>s.ref.unitId===id)!;
 assert.ok(!JSON.stringify(byId('D11').unit).includes('Before installing a rooftop garden'));
 for(const id of ['RW04','RW08']){const e=byId(id).exercise;assert.equal(e.type,'sat-rw');if(e.type==='sat-rw')for(const r of e.value.rounds)assert.match(r.passage,/_____ [a-z]/);}
 const l06=byId('L06').exercise;assert.equal(l06.type,'listening');if(l06.type==='listening')for(const r of l06.value.rounds)assert.ok(!r.instruction?.includes(r.answer));
 const w02=byId('W02').exercise;if(w02.type!=='task2')throw Error('W02 type');assert.ok(!w02.value.rounds[1].example.includes('This claim seems attractive'));
 const w03=byId('W03').exercise;if(w03.type!=='task2')throw Error('W03 type');assert.ok(!w03.value.rounds[0].example.includes('ensure that everyone understands'));assert.ok(w03.value.rounds[0].text.includes(w03.value.rounds[0].argument.before),'separate deliberate weak argument retained');assert.ok(w03.value.rounds[1].issues[5].alternatives.includes(w03.value.rounds[1].issues[5].before),'acceptable burden form not marked categorically wrong');
 const w05=byId('W05').exercise;if(w05.type!=='task2')throw Error('W05 type');assert.ok(w05.value.rounds[0].issues[4].alternatives.includes(w05.value.rounds[0].issues[4].before));
 const w06=byId('W06').exercise;if(w06.type!=='task2')throw Error('W06 type');assert.ok(w06.value.rounds[0].example.includes('I disagree that they should replace most classroom teaching'));assert.ok(w06.value.rounds[0].text.includes(w06.value.rounds[0].argument.before));
 const w08=byId('W08').exercise;if(w08.type!=='task2')throw Error('W08 type');assert.ok(w08.value.rounds[0].issues[3].why.includes('существительным'));assert.ok(w08.value.rounds[0].issues[3].alternatives.includes('forget research, preparation or a final check'));
 const rw06=byId('RW06').exercise;if(rw06.type!=='sat-rw')throw Error('RW06 type');assert.ok(rw06.value.rounds[1].explanation.includes('his указывает на Арона'));assert.equal(rw06.value.rounds[1].key,3);
 const m11=byId('M11').exercise;if(m11.type!=='math')throw Error('M11 type');assert.equal(m11.value.rounds[1].answer,25);assert.equal(100*(150-120)/120,25);assert.equal(100*(150-120)/150,20);assert.ok(m11.value.rounds[1].models?.[0].feedback.includes('во вторник меньше числа в понедельник'));
 const manifest=JSON.parse(await fs.readFile(path.join(output,'manifest.json'),'utf8'));assert.equal(manifest.modules,108);
 for(const [name,sha] of Object.entries(manifest.files))assert.equal(crypto.createHash('sha256').update(await fs.readFile(path.join(output,name))).digest('hex'),sha);
 assert.equal(manifest.media.length,32);
 for(const asset of [...audio02.assets,...audio10.assets]){const bytes=await fs.readFile(path.join(output,asset.url.slice(1)));assert.equal(bytes.length,asset.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256);}
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext(),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(output,'materials-for-approval.html')).href);
  assert.equal(await page.locator('article').count(),108);assert.equal(await page.locator('[data-round="B"]').count(),108);assert.equal(await page.locator('audio').count(),32);
  const w03=page.locator('article').filter({has:page.getByRole('heading',{name:/^W03 ·/})});
  await w03.locator('[data-round="B"] > summary').click();assert.equal(await w03.locator('[data-key="B"]').getAttribute('open'),null);assert.ok(await w03.locator('[data-round="B"] pre').isVisible());
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}
  assert.deepEqual((await new AxeBuilder({page}).analyze()).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
  await page.getByRole('searchbox').fill('L06');assert.equal(await page.locator('article:visible').count(),1);
  const listening=page.locator('article:visible');await listening.locator('[data-round="A"] > summary').click();
  const media=await listening.locator('[data-round="A"] audio').evaluate(async element=>{const audio=element as HTMLAudioElement;await audio.play();audio.pause();return {duration:audio.duration,error:audio.error?.code};});assert.ok(media.duration>1&&!media.error);
  await page.goto(pathToFileURL(path.join(output,'student-materials.html')).href);
  assert.equal(await page.locator('article').count(),108);assert.equal(await page.locator('[data-key]').count(),0);assert.equal(await page.locator('audio').count(),16);
  assert.ok(!(await page.locator('body').textContent())?.includes('Языковые цели включают'));
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
 console.log('PASS108 source-complete A/B exports; separate keys and student-only file;32 exact audio files and playback;7 prior editions archived with valid fingerprints; content regressions;320/390/768/1440, search, key isolation and axe. No human approval/audio-quality/learning claim.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
