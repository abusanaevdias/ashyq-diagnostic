import { draftBatches, type DraftBatch, type DraftUnit } from './draft-review';
import type { TrainerId } from './catalog';
import { parseDraftWriting } from './draft-writing';
import { parseDraftTask2 } from './draft-task2';
import { parseDraftReading } from './draft-reading';
import {parseDraftReadingLab} from './draft-reading-lab';
import { parseDraftListening } from './draft-listening';
import { parseDraftSpeaking } from './draft-speaking';
import { parseDraftMath } from './draft-math';
import { parseDraftSatPair } from './draft-sat-rw';
import { parseDraftTask1 } from './draft-task1';
import { parseDraftTask1Categories } from './draft-task1-categories';
import { parseDraftTask1Diagrams } from './draft-task1-diagrams';

export type BankSourceRef = { batchId: string; version: string; contentHash: string; unitId: string };
export type BankExercise =
  | { type: 'writing-drill'; value: NonNullable<ReturnType<typeof parseDraftWriting>> }
  | { type: 'task2'; value: NonNullable<ReturnType<typeof parseDraftTask2>> }
  | { type: 'reading'; value: NonNullable<ReturnType<typeof parseDraftReading>> }
  | { type: 'reading-lab'; value: NonNullable<ReturnType<typeof parseDraftReadingLab>> }
  | { type: 'listening'; value: NonNullable<ReturnType<typeof parseDraftListening>> }
  | { type: 'speaking'; value: NonNullable<ReturnType<typeof parseDraftSpeaking>> }
  | { type: 'math'; value: NonNullable<ReturnType<typeof parseDraftMath>> }
  | { type: 'sat-rw'; value: NonNullable<ReturnType<typeof parseDraftSatPair>> }
  | { type: 'task1-line'; value: NonNullable<ReturnType<typeof parseDraftTask1>> }
  | { type: 'task1-categories'; value: NonNullable<ReturnType<typeof parseDraftTask1Categories>> }
  | { type: 'task1-diagrams'; value: NonNullable<ReturnType<typeof parseDraftTask1Diagrams>> };
export type BankSource = { ref: BankSourceRef; title: string; trainer: TrainerId; skill: string; practiceType: string; difficulty: 'uncalibrated'; authorEstimate: string | null; exercise: BankExercise; unit: DraftUnit };
const object = (value: unknown): value is Record<string,unknown> => !!value && typeof value==='object'&&!Array.isArray(value);
const text = (value: unknown,max=4000): value is string => typeof value==='string'&&!!value.trim()&&value.length<=max;
export function parseBankSourceRef(value: unknown): BankSourceRef | null {
  if(!object(value)||Object.keys(value).length!==4||!Object.hasOwn(value,'batchId')||!Object.hasOwn(value,'version')||!Object.hasOwn(value,'contentHash')||!Object.hasOwn(value,'unitId'))return null;
  if(typeof value.batchId!=='string'||!/^\d{2,4}$/.test(value.batchId)||typeof value.version!=='string'||!/^\d+(?:\.\d+){0,2}$/.test(value.version)||value.version.length>24||typeof value.contentHash!=='string'||! /^[a-f0-9]{64}$/.test(value.contentHash)||typeof value.unitId!=='string'||! /^[A-Z][A-Z0-9-]{1,23}$/.test(value.unitId))return null;
  return {batchId:value.batchId,version:value.version,contentHash:value.contentHash,unitId:value.unitId};
}
export const bankSourceIdentity = (ref: BankSourceRef) => JSON.stringify([ref.batchId,ref.version,ref.contentHash,ref.unitId]);
export const sameBankSource = (a: BankSourceRef,b: BankSourceRef) => bankSourceIdentity(a)===bankSourceIdentity(b);

/** Exact kind adapter. A malformed source cannot fall through to another exercise type. */
export function parseBankExercise(value: unknown,unitId: string): BankExercise | null {
  if(!object(value))return null;
  const prefixes:Record<string,RegExp>={'reading-lab-pair-v1':/^R\d{2,4}$/,'writing-drill-v1':/^D\d{2,4}$/,'task2-pair-v1':/^W\d{2,4}$/,'reading-evidence-pair-v1':/^R\d{2,4}$/,'listening-pair-v1':/^L\d{2}$/,'speaking-pair-v1':/^S\d{2,4}$/,'sat-math-pair-v1':/^M\d{2,4}$/,'sat-rw-pair-v1':/^RW\d{2,4}$/,'task1-pair-v1':/^T\d{3,5}$/,'task1-categories-pair-v1':/^T\d{3,5}$/,'task1-diagrams-pair-v1':/^T\d{3,5}$/};
  if(typeof value.kind!=='string'||!Object.hasOwn(prefixes,value.kind)||!prefixes[value.kind].test(unitId))return null;
  switch(value.kind){
    case 'reading-lab-pair-v1': {if(!/^R\d{2,4}$/.test(unitId))return null;const parsed=parseDraftReadingLab(value,unitId);return parsed?{type:'reading-lab',value:parsed}:null;}
    case 'writing-drill-v1': {const parsed=parseDraftWriting(value);return parsed&&parsed.id===unitId?{type:'writing-drill',value:parsed}:null;}
    case 'task2-pair-v1': {const parsed=parseDraftTask2(value);return parsed?{type:'task2',value:parsed}:null;}
    case 'reading-evidence-pair-v1': {const parsed=parseDraftReading(value);return parsed&&parsed.rounds.every((r,i)=>r.id===`${unitId}-${i?'B':'A'}`)?{type:'reading',value:parsed}:null;}
    case 'listening-pair-v1': {const parsed=parseDraftListening(value,unitId);return parsed?{type:'listening',value:parsed}:null;}
    case 'speaking-pair-v1': {const parsed=parseDraftSpeaking(value);return parsed?{type:'speaking',value:parsed}:null;}
    case 'sat-math-pair-v1': {const parsed=parseDraftMath(value);return parsed&&parsed.rounds.every((r,i)=>r.id===`${unitId}-${i?'B':'A'}`)?{type:'math',value:parsed}:null;}
    case 'sat-rw-pair-v1': {const parsed=parseDraftSatPair(value);return parsed&&parsed.rounds.every((r,i)=>r.id===`${unitId}-${i?'B':'A'}`)?{type:'sat-rw',value:parsed}:null;}
    case 'task1-pair-v1': {const parsed=parseDraftTask1(value);return parsed?{type:'task1-line',value:parsed}:null;}
    case 'task1-categories-pair-v1': {const parsed=parseDraftTask1Categories(value);return parsed?{type:'task1-categories',value:parsed}:null;}
    case 'task1-diagrams-pair-v1': {const parsed=parseDraftTask1Diagrams(value);return parsed?{type:'task1-diagrams',value:parsed}:null;}
    default:return null;
  }
}
function metadata(exercise: BankExercise): Pick<BankSource,'trainer'|'skill'|'practiceType'> {
  switch(exercise.type){
    case 'reading-lab':return {trainer:'reading-evidence',skill:exercise.value.skill,practiceType:{headings:'Главная мысль перед выбором заголовка',inference:'Вывод из фактов',summary:'Грамматическая форма и слово для summary',information:'Поиск информации по абзацам'}[exercise.value.mode]};
    case 'writing-drill':return {trainer:'writing-drills',skill:exercise.value.criterion,practiceType:{combine:'Объединение мыслей',grammar:'Грамматическая правка',argument:'Развитие аргумента'}[exercise.value.mode]};
    case 'task2':return {trainer:'writing-task2',skill:exercise.value.skill,practiceType:'Полное эссе: язык и аргумент'};
    case 'reading':return {trainer:'reading-evidence',skill:exercise.value.skill,practiceType:'TRUE / FALSE / NOT GIVEN с опорой'};
    case 'listening':return {trainer:'listening-replay',skill:exercise.value.focus,practiceType:'Слушание, постепенная помощь и пересмотр'};
    case 'speaking':return {trainer:'speaking-second-take',skill:exercise.value.skill??'Самостоятельный ответ, повтор и другая тема',practiceType:'Speaking Part 2: три попытки'};
    case 'math':return {trainer:{translation:'sat-translation',forensics:'math-forensics','method-switch':'math-method-switch'}[exercise.value.family] as TrainerId,skill:exercise.value.skill,practiceType:{translation:'Модель по условию',forensics:'Первый неверный переход','method-switch':'Сравнение способов'}[exercise.value.family]};
    case 'sat-rw':return {trainer:exercise.value.trainer,skill:exercise.value.skill,practiceType:exercise.value.trainer==='sat-optionless'?'Прогноз до вариантов':'Разбор вариантов и обоснований'};
    case 'task1-line':return {trainer:'task1-overview',skill:'Общие тенденции и точность данных',practiceType:'Линейные графики'};
    case 'task1-categories':return {trainer:'task1-overview',skill:'Главные категории, сравнения и точность данных',practiceType:exercise.value.charts[0].chartType==='pie'?'Круговые диаграммы':'Столбчатые диаграммы'};
    case 'task1-diagrams':return {trainer:'task1-overview',skill:exercise.value.charts[0].chartType==='map'?'Изменения, сохранённые объекты и статус проекта':'Порядок, этапы и границы процесса',practiceType:exercise.value.charts[0].chartType==='map'?'Сравнение карт':'Процессы'};
  }
}

/** Bundled manifests are trusted build inputs; the release validator verifies their content hashes. */
export function createBankSources(batches: DraftBatch[]): { sources: BankSource[]; errors: string[] } {
  const sources:BankSource[]=[],errors:string[]=[],seen=new Set<string>();
  for(const batch of batches){
    for(const unit of batch.units){
      const ref=parseBankSourceRef({batchId:batch.batch,version:String(batch.version),contentHash:batch.content_sha256,unitId:unit.id});
      if(!ref||unit.status!=='DRAFT'||batch.methodically_approved!==false||!text(unit.title,300)||!text(unit.student_markdown,100000)||!text(unit.teacher_markdown,100000)){errors.push(`${batch.batch}/${unit.id}: invalid source manifest`);continue;}
      if(seen.has(unit.id)){errors.push(`${batch.batch}/${unit.id}: duplicate active ID`);continue;}seen.add(unit.id);
      const exercise=parseBankExercise(unit.exercise_data,unit.id);
      if(!exercise){errors.push(`${batch.batch}/${unit.id}: unsupported or invalid exercise`);continue;}
      const raw=object(unit.exercise_data)?unit.exercise_data:null;
      sources.push({ref,title:unit.title,...metadata(exercise),difficulty:'uncalibrated',authorEstimate:raw&&text(raw.difficulty,300)?raw.difficulty:null,exercise,unit});
    }
  }
  // Partial registries would quietly omit malformed content or hide an ID collision.
  return errors.length?{sources:[],errors}:{sources,errors};
}
export const trainerBank = createBankSources(draftBatches);
export function findBankSource(ref: BankSourceRef,sources: BankSource[]=trainerBank.sources): BankSource | null {
  const normalized=parseBankSourceRef(ref);return normalized?sources.find(source=>sameBankSource(source.ref,normalized))??null:null;
}
type Query = {getAll:(key:string)=>string[]};
export function parseBankSourceQuery(query: Query): BankSourceRef | null {
  const keys=['sourceBatch','sourceVersion','sourceHash','sourceUnit'] as const;
  const values=keys.map(key=>query.getAll(key));if(values.some(value=>value.length!==1))return null;
  return parseBankSourceRef({batchId:values[0][0],version:values[1][0],contentHash:values[2][0],unitId:values[3][0]});
}
export function bankSourceQuery(ref: BankSourceRef): string {
  return new URLSearchParams({sourceBatch:ref.batchId,sourceVersion:ref.version,sourceHash:ref.contentHash,sourceUnit:ref.unitId}).toString();
}
