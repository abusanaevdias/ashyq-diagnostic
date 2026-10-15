export const READING_LAB_MODES=['headings','inference','summary','information'] as const;
export type ReadingLabMode=typeof READING_LAB_MODES[number];
export type ReadingLabRound={id:string;paragraphs:{id:string;text:string}[];prompt:string;prePrompt:string;options:{id:string;text:string}[];answers:string[];evidence:string;explanation:string};
export type ReadingLabPair={kind:'reading-lab-pair-v1';mode:ReadingLabMode;skill:string;rounds:[ReadingLabRound,ReadingLabRound]};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown,max=4000):v is string=>typeof v==='string'&&!!v.trim()&&v.length<=max;
export const readingLabText=(r:ReadingLabRound)=>r.paragraphs.map(p=>p.text).join('\n\n');
export const readingLabContainsWord=(r:ReadingLabRound,value:string)=>(readingLabText(r).match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)??[]).some(word=>word.toLocaleLowerCase('en')===value.trim().toLocaleLowerCase('en'));
export const readingLabAnswerMatches=(r:ReadingLabRound,value:string)=>r.answers.some(a=>a.normalize('NFC').toLocaleLowerCase('en')===value.trim().normalize('NFC').toLocaleLowerCase('en'));
export function parseDraftReadingLab(value:unknown,unitId:string):ReadingLabPair|null{
 if(!object(value)||value.kind!=='reading-lab-pair-v1'||!READING_LAB_MODES.includes(value.mode as ReadingLabMode)||!text(value.skill,200)||!Array.isArray(value.rounds)||value.rounds.length!==2)return null;
 const rounds:ReadingLabRound[]=[];
 for(const [i,item] of value.rounds.entries()){
  if(!object(item)||item.id!==`${unitId}-${i?'B':'A'}`||!text(item.prompt,1000)||!text(item.prePrompt,1000)||!text(item.evidence,1000)||!text(item.explanation,3000)||!Array.isArray(item.paragraphs)||item.paragraphs.length<1||item.paragraphs.length>3||!Array.isArray(item.options)||!Array.isArray(item.answers)||item.answers.length<1||item.answers.length>4)return null;
  const paragraphs:{id:string;text:string}[]=[],options:{id:string;text:string}[]=[],answers:string[]=[];
  for(const [j,p] of item.paragraphs.entries()){if(!object(p)||p.id!=='ABC'[j]||!text(p.text,5000))return null;paragraphs.push({id:p.id,text:p.text});}
  for(const [j,o] of item.options.entries()){if(!object(o)||o.id!=='ABC'[j]||!text(o.text,300))return null;options.push({id:o.id,text:o.text});}
  for(const a of item.answers){if(!text(a,40)||answers.includes(a))return null;answers.push(a);}
  const round={id:item.id as string,paragraphs,prompt:item.prompt,prePrompt:item.prePrompt,options,answers,evidence:item.evidence,explanation:item.explanation};
  if(!readingLabText(round).includes(round.evidence))return null;
  if(value.mode==='summary'){if(options.length!==0||answers.some(a=>a.trim().split(/\s+/u).length!==1||!readingLabContainsWord(round,a)))return null;}
  else if(options.length!==3||answers.length!==1||!options.some(o=>o.id===answers[0]))return null;
  if(value.mode==='information'&&(paragraphs.length!==3||!paragraphs.find(p=>p.id===answers[0])!.text.includes(round.evidence)))return null;
  rounds.push(round);
 }
 if(readingLabText(rounds[0])===readingLabText(rounds[1]))return null;
 return {kind:'reading-lab-pair-v1',mode:value.mode as ReadingLabMode,skill:value.skill,rounds:rounds as [ReadingLabRound,ReadingLabRound]};
}
