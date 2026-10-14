import assert from 'node:assert/strict';
import defaults from './fixtures/trainer-pilot-report-defaults.json';
import {trainerCatalog,type TrainerId} from '../src/lib/trainers/catalog';
import {pilotReportBlocks} from '../src/lib/trainers/pilot-report';
import {buildPlainDocx} from '../src/lib/trainers/docx-package';
import {validSnapshot,MAX_RECORD_BYTES,type Snapshot} from '../src/lib/trainers/checkpoints';
import {readingCases} from '../src/lib/reading-evidence/cases';
import {optionlessCases} from '../src/lib/sat-optionless/cases';
import {distractorCases,expectedReason} from '../src/lib/sat-distractor/cases';
import {listeningCases} from '../src/lib/listening-replay/cases';
import {overviewItems} from '../src/lib/task1-overview/cases';
import {mathForensicsCases} from '../src/lib/math-forensics/cases';
import {translationCases} from '../src/lib/sat-translation/cases';
import {cases as methods} from '../src/lib/math-method-switch/cases';
import {createSession} from '../src/lib/writing-trainer/engine';
import {writingCases} from '../src/lib/writing-trainer/cases';
import {writingDrills} from '../src/lib/writing-trainer/drills';
const fixtures=defaults as Record<TrainerId,Snapshot>,marker='PRIVATE OWN TEXT <tag> 🧪';
const sourceStrings=(value:unknown):string[]=>typeof value==='string'?[value]:Array.isArray(value)?value.flatMap(sourceStrings):value&&typeof value==='object'?Object.values(value).flatMap(sourceStrings):[];
const unopenedText=sourceStrings([readingCases,optionlessCases,distractorCases,listeningCases,overviewItems,mathForensicsCases,translationCases,methods,writingCases,writingDrills]).filter(s=>s.length>100);
export function partialPilotReportState(trainer:TrainerId):Snapshot{
 const v=structuredClone(fixtures[trainer]);
 switch(trainer){case 'reading-evidence':Object.assign(v,{caseIndex:0,phase:'first',answer:'TRUE',evidenceId:readingCases[0].task.sentences[0].id,confidence:'high'});break;case 'listening-replay':Object.assign(v,{caseIndex:0,phase:'answer',prediction:listeningCases[0].first.answerType,cue:listeningCases[0].first.cue,answer:marker,stopped:true});break;case 'speaking-second-take':Object.assign(v,{phase:'prepare',notes:marker});break;case 'task1-overview':Object.assign(v,{phase:'select',overview:marker});break;case 'writing-task2':(v.session as Snapshot).grammarDrafts={[writingCases[0].grammarIssues[0].sentenceId]:marker};(v.session as Snapshot).selectedSentenceId=writingCases[0].grammarIssues[0].sentenceId;break;case 'writing-drills':Object.assign(v,{mode:'grammar',draft:marker});break;case 'sat-optionless':Object.assign(v,{caseIndex:0,phase:'predict',prediction:marker});break;case 'sat-distractor':Object.assign(v,{caseIndex:0,phase:'answer',answerIndex:0});break;case 'math-forensics':Object.assign(v,{caseIndex:0,phase:'locate',repairLine:marker});break;case 'sat-translation':{const r=translationCases[0].items[0];Object.assign(v,{phase:'calculate',variable:r.variable,setup:String(r.setup),rate:String(r.rate),total:String(r.total),form:'once',model:{variable:r.variable,setup:r.setup,rate:r.rate,total:r.total,form:'once'},working:marker});break;}case 'math-method-switch':Object.assign(v,{phase:'solve',working:marker});break;}
 assert.ok(validSnapshot(trainer,v),trainer);return v;
}
const completed:Partial<Record<TrainerId,Snapshot>>={};
const read=(task:typeof readingCases[number]['task'])=>({answer:task.answer,evidenceId:task.evidenceId,confidence:'high'});
completed['reading-evidence']={...fixtures['reading-evidence'],caseIndex:0,phase:'result',first:read(readingCases[0].task),repair:read(readingCases[0].task),transfer:read(readingCases[0].transfer)};
completed['sat-optionless']={...fixtures['sat-optionless'],caseIndex:0,phase:'result',first:{prediction:'OWN FIRST PREDICTION',choiceIndex:optionlessCases[0].first.correctIndex},transfer:{prediction:'OWN OTHER PREDICTION',choiceIndex:optionlessCases[0].transfer.correctIndex}};
const da=(r:typeof distractorCases[number]['first'])=>({answerIndex:r.correctIndex,reasons:Object.fromEntries(r.choices.map((_,i)=>[i,expectedReason(r,i)]))});
completed['sat-distractor']={...fixtures['sat-distractor'],caseIndex:0,phase:'result',first:da(distractorCases[0].first),transfer:da(distractorCases[0].transfer)};
const math=mathForensicsCases[0];completed['math-forensics']={...fixtures['math-forensics'],caseIndex:0,phase:'result',firstAttempt:{stepIndex:math.wrongStepIndex,mechanism:math.mechanism,repairLine:'OWN FIRST LINE'},ownAnswer:String(math.finalAnswer),transferAttempt:{stepIndex:math.transfer.wrongStepIndex,answer:String(math.transfer.answer)}};
const la=(r:typeof listeningCases[number]['first'])=>({answer:r.answer,type:r.answerType,cue:r.cue,confidence:'Высокая',diagnosis:'Own observation',level:3,repaired:r.answer,textMode:true,textHelp:true,stopped:true});
completed['listening-replay']={...fixtures['listening-replay'],caseIndex:0,phase:'result',first:la(listeningCases[0].first),transfer:la(listeningCases[0].transfer)};
const oa=(r:typeof overviewItems[number])=>({selected:[0,1,2],overview:'Own overview',evidence:Object.fromEntries([0,1,2].map(i=>[i,r.claims[i].evidence])),reasons:Object.fromEntries(r.inaccurate.map((x,i)=>[i,x.reason])),correction:'Own correction'});
completed['task1-overview']={...fixtures['task1-overview'],phase:'result',round:1,first:oa(overviewItems[0]),transfer:oa(overviewItems[1]),draft:'OWN FIRST FULL TEXT',revision:'OWN REVISED FULL TEXT'};
const ta=(r:typeof translationCases[number]['items'][number])=>({model:{variable:r.variable,setup:r.setup,rate:r.rate,total:r.total,form:'once'},answer:r.answer,working:'Own working',repair:'Own plan'}),translations=translationCases[0].items.map(ta);
completed['sat-translation']={...fixtures['sat-translation'],phase:'result',round:1,attempts:translations,model:translations[1].model};
completed['math-method-switch']={...fixtures['math-method-switch'],phase:'result',round:1,attempts:methods[0].items.map(r=>({x:r.x,y:r.y,working:'Own working',method:'algebra',seconds:null,plan:'Own plan'}))};
completed['speaking-second-take']={...fixtures['speaking-second-take'],phase:'result',takeIndex:2,takes:[0,1,2].map(i=>({url:null,seconds:null,markers:[],ratings:Array(4).fill('Нужно поработать'),plan:`OWN TAKE PLAN ${i}`,confirmed:true,preparationNotes:`OWN TAKE NOTES ${i}`,noSpecificMoments:true}))};
completed['writing-task2']={session:{...createSession(writingCases[0].id),stage:'report',furthestStage:'report',grammarDrafts:{[writingCases[0].grammarIssues[0].sentenceId]:'OWN GRAMMAR TEXT'},revisionDrafts:{task:'OWN BEFORE FEEDBACK TEXT'},postFeedbackDrafts:{task:'OWN AFTER FEEDBACK TEXT'}}};
completed['writing-drills']={...fixtures['writing-drills'],completed:[writingDrills[0].id]};
for(const item of trainerCatalog){
 for(const value of [fixtures[item.id],partialPilotReportState(item.id),completed[item.id]!]){
  const before=JSON.stringify(value),blocks=pilotReportBlocks(item.id,value),text=blocks.map(b=>b.text).join('\n');assert.equal(JSON.stringify(value),before);assert.ok(text.includes(item.title));assert.ok(text.includes('JSON'));assert.ok(buildPlainDocx(blocks).length>1000);assert.equal(text.includes('blob:'),false);
 }
 const partial=pilotReportBlocks(item.id,partialPilotReportState(item.id)).map(b=>b.text).join('\n');assert.equal(partial.includes('Другое задание · после работы с первым'),false,'no unopened future response');if(!['sat-distractor','reading-evidence'].includes(item.id))assert.ok(partial.includes(marker));
 for(const text of unopenedText)assert.equal(partial.includes(text),false,`${item.id}: unopened source/key/model leaked`);
 assert.throws(()=>pilotReportBlocks(item.id,{...fixtures[item.id],alien:true}));
}
const text=(id:TrainerId)=>pilotReportBlocks(id,completed[id]!).map(b=>b.text).join('\n');assert.ok(text('speaking-second-take').includes('Повтор той же темы'));assert.ok(text('speaking-second-take').includes('Pronunciation'));assert.ok(text('speaking-second-take').includes('OWN TAKE NOTES 2'));assert.ok(text('listening-replay').includes('по тексту'));assert.ok(text('listening-replay').includes('с помощью'));assert.ok(text('listening-replay').includes('прерывалось'));assert.ok(text('writing-task2').includes('OWN BEFORE FEEDBACK TEXT'));assert.ok(text('writing-task2').includes('OWN AFTER FEEDBACK TEXT'));assert.ok(text('task1-overview').includes('OWN FIRST FULL TEXT'));assert.ok(text('task1-overview').includes('OWN REVISED FULL TEXT'));
assert.ok(pilotReportBlocks('listening-replay',fixtures['listening-replay']).some(b=>b.text.includes('Уровень помощи')&&b.text.endsWith('не указано')));
for(const id of ['sat-translation','math-method-switch'] as const)assert.ok(pilotReportBlocks(id,fixtures[id]).some(b=>b.text.includes('номер: не выбрано')));
const legacySpeaking=structuredClone(completed['speaking-second-take']!);for(const take of legacySpeaking.takes as Snapshot[]){delete take.preparationNotes;delete take.noSpecificMoments;}assert.equal(pilotReportBlocks('speaking-second-take',legacySpeaking).filter(b=>b.text.includes('нет данных в старой записи')).length,6);
const large=structuredClone(completed['speaking-second-take']!);let markerId=1;for(const take of large.takes as Snapshot[]){take.markers=Array.from({length:50},()=>({id:markerId++,second:null,kind:'Долгая пауза',note:'Я'.repeat(1000)}));take.noSpecificMoments=false;}assert.equal(validSnapshot('speaking-second-take',large),false,'stored snapshot budget remains100KB');assert.equal(validSnapshot('speaking-second-take',large,MAX_RECORD_BYTES),true,'Word accepts larger shape-valid UI work');const largeBlocks=pilotReportBlocks('speaking-second-take',large);assert.equal(largeBlocks.filter(b=>b.text.includes('Я'.repeat(1000))).length,150);assert.ok(buildPlainDocx(largeBlocks).length>300_000);for(const limit of [0,-1,NaN,Infinity,MAX_RECORD_BYTES+1])assert.equal(validSnapshot('speaking-second-take',large,limit),false);
console.log('PASS11 public v1 empty/partial/completed synthetic response reports, valid-state rejection/nonmutation, separate frozen first/repair/other and Speaking repeat, help/interrupt/text/self-assessment/unknown disclosures, no future response, DOCX packaging. No actual UI/download/physical-device or quality calibration claim.');
