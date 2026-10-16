import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { trainerBank } from '../src/lib/trainers/bank-sources';
import { approvalMaterial } from '../src/lib/trainers/approval-material';
import { bankWritingPair } from '../src/lib/trainers/bank-writing-state';

const escape = (text: string) => text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const output=path.resolve(process.env.APPROVAL_OUTPUT_DIR??'artifacts/library-ux-034');
async function main(){
 if(trainerBank.errors.length)throw Error(trainerBank.errors.join('\n'));
 await mkdir(output,{recursive:true});
 const materials=trainerBank.sources.map(source=>{
  const material=approvalMaterial(source),pair=source.exercise.type==='writing-drill'?bankWritingPair(source):null;
  const next=pair&&material.rounds.length===1?trainerBank.sources.find(s=>s.ref.batchId===source.ref.batchId&&s.ref.contentHash===source.ref.contentHash&&s.ref.unitId===pair[1].id):null;
  if(next){material.rounds.push(approvalMaterial(next).rounds[0]);material.notes+=` B — отдельный существующий модуль ${next.ref.unitId} в том же пакете и редакции. Это близкая практика направления, не доказательство переноса конкретного правила. Не показывать его ключ до попытки.`;}
  return {source,material};
 });
 const intro=`# Материалы ASHYQ для проверки\n\n${materials.length} модулей DRAFT. Никакого автоматического одобрения или публикации. Экспорт построен из тех же валидированных структурированных источников, что и тренажёры: полные A/B, условия, варианты, исходные эссе, таблицы/схемы и учебные аудиозаписи.\n\nЭто пособие для преподавателя: ответы здесь не вводятся и не сохраняются. Выдайте A без ключа, примите попытку и правку, затем отдельно выдайте B без разбора. В HTML B и его ключ раскрываются отдельно. Для слепой проверки используйте отдельный ученический файл.\n\nАудио синтетическое; запись нужно прослушать, её наличие не означает методического одобрения. Speaking оценивается отдельно по реальной речи. Свободные ответы — ручная проверка смысла и допустимых альтернатив, без band.\n`;
 const identity=(s:typeof trainerBank.sources[number])=>`Пакет ${s.ref.batchId} · версия ${s.ref.version} · SHA256 ${s.ref.contentHash} · DRAFT`;
 let markdown=intro,studentMd=intro.replace('В HTML B и его ключ раскрываются отдельно.','В этом ученическом файле ключей нет.');
 const articles:string[]=[],studentArticles:string[]=[],media=new Set<string>();
 for(const {source:s,material:m} of materials){
  let body='',studentBody='';const heading=`${s.ref.unitId} · ${s.title}`;
  markdown+=`\n---\n\n## ${heading}\n\n${identity(s)}\n\n${m.notes}\n`;
  studentMd+=`\n---\n\n## ${heading}\n\n${identity(s)}\n`;
  for(const [index,r] of m.rounds.entries()){
   const label=index?'B — новое задание':'A — первая попытка';
   const audioParts=r.audio.map((a,i)=>{media.add(a.url);const audio=`<p>${escape(a.label)} · синтетический голос</p><audio controls preload="none" src=".${escape(a.url)}" aria-label="${escape(`${s.ref.unitId} ${label}: ${a.label}`)}"></audio>`;return i?`<details><summary>Помощь после первой попытки: короткий фрагмент</summary>${audio}</details>`:audio;});
   const student=`<pre>${escape(r.student)}</pre>${audioParts[0]??''}`,teacher=`${audioParts.slice(1).join('')}<pre>${escape(r.teacher)}</pre>`;
   body+=`<details data-round="${index?'B':'A'}"><summary>${label} — без ключа</summary>${student}</details><details data-key="${index?'B':'A'}"><summary>Ключ и разбор ${index?'B':'A'} — после попытки</summary>${teacher}</details>`;
   studentBody+=`<details><summary>${label}</summary>${student}</details>`;
   const links=r.audio.map(a=>`[${a.label} — синтетический голос](.${a.url})`);
   markdown+=`\n### ${label}\n\n${r.student}\n\n${links[0]??''}\n\n### Ключ ${index?'B':'A'}\n\n${links.slice(1).join('\n')}\n\n${r.teacher}\n`;
   studentMd+=`\n### ${label}\n\n${r.student}\n\n${links[0]??''}\n`;
  }
  const wrap=(content:string)=>`<article data-search="${escape(`${s.ref.unitId} ${s.title} ${s.practiceType}`.toLowerCase())}"><h2>${escape(heading)}</h2><p>${escape(s.practiceType)}</p>${content}<small>${escape(identity(s))}</small></article>`;
  articles.push(wrap(`<p>${escape(m.notes)}</p>${body}`));studentArticles.push(wrap(studentBody));
 }
 for(const url of media){
  if(!/^\/audio\/trainers\/drafts\/[a-z0-9-]+\.wav$/.test(url))throw Error('Unexpected media path');
  const target=path.join(output,url.slice(1));await mkdir(path.dirname(target),{recursive:true});await copyFile(path.join('public',url.slice(1)),target);
 }
 const page=(items:string[],student=false)=>`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ASHYQ · ${student?'задания без ключей':'пакет проверки'}</title><style>body{font:17px/1.7 system-ui;max-width:1000px;margin:auto;padding:24px;color:#161311;background:#faf8f4}h1{line-height:1.2}article{background:white;border:1px solid #ddd;border-radius:16px;padding:24px;margin:20px 0;min-width:0}summary{cursor:pointer;padding:14px 0;font-weight:700}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}input{padding:14px;font:inherit;width:100%;box-sizing:border-box}small{overflow-wrap:anywhere}audio{width:100%;max-width:100%}a{color:#b60916}</style><main><h1>${student?'Задания без ключей':'Что нужно проверить'}</h1><p>${materials.length} модулей · DRAFT. Это отдельное пособие: ответы здесь не сохраняются. Ученик пишет на отдельном листе или в своём документе. Выдавайте новое B после первой попытки, разбора и своей правки A. ${student?'Ключи исключены.':'A, B и их ключи открываются отдельно. Полный комплект для независимой проверки: <a href="student-materials.html">ученическая версия без ключей</a>.'}</p><p>Синтетическое аудио нужно прослушать; его наличие не означает одобрения качества. Источники Speaking не подтверждают качество речи. Свободный ответ не оценивается совпадением с единственным образцом. Сложность и band не откалиброваны.</p><label>Поиск по коду, названию или типу<input id="search" type="search" placeholder="Например: W01, грамматика, Reading"></label>${items.join('')}</main><script>document.getElementById('search').addEventListener('input',e=>{const q=e.target.value.toLowerCase().trim();document.querySelectorAll('article').forEach(a=>a.hidden=!a.dataset.search.includes(q))})</script></html>`;
 const outputs={'materials-for-approval.html':page(articles),'materials-for-approval.md':markdown,'student-materials.html':page(studentArticles,true),'student-materials.md':studentMd};
 for(const [file,text] of Object.entries(outputs))await writeFile(path.join(output,file),text);
 const manifest={format:'ashyq-approval-export-v2',modules:materials.length,media:[...media],sources:trainerBank.sources.map(s=>s.ref),files:Object.fromEntries(Object.entries(outputs).map(([name,body])=>[name,crypto.createHash('sha256').update(body).digest('hex')]))};
 await writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(`Prepared ${materials.length} DRAFT modules from validated runtime sources, separate student/key A/B, ${media.size} local audio files; no approvals/publication changes. ${output}`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
