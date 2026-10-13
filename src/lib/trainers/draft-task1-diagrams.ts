import { draftTask1Words, type DraftTask1Chart } from './draft-task1';
type Common = Pick<DraftTask1Chart,'title'|'unit'|'overview'|'model'|'claims'|'key'>;
export type Task1Process = Common & { chartType:'process'; diagram:{stages:{title:string;detail:string}[]} };
export type Task1MapFrame = {period:string;status:'observed'|'proposed';cells:string[]};
export type Task1Map = Common & {chartType:'map';diagram:{frames:[Task1MapFrame,Task1MapFrame]}};
export type Task1Diagram = Task1Process|Task1Map;
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown,max=12000):v is string=>typeof v==='string'&&!!v.trim()&&v.length<=max;
export function parseDraftTask1Diagrams(value:unknown):{charts:Task1Diagram[]}|null{
  if(!object(value)||value.kind!=='task1-diagrams-pair-v1'||value.publication_ready!==false||value.difficulty_status!=='AUTHOR_ESTIMATE_UNCALIBRATED'||!Array.isArray(value.charts)||value.charts.length!==2)return null;
  const charts:Task1Diagram[]=[];
  for(const c of value.charts){
    if(!object(c)||!text(c.title,200)||c.unit!=='schematic'||!text(c.overview)||!text(c.model)||draftTask1Words(c.model)<150||!object(c.diagram)||!Array.isArray(c.claims)||c.claims.length!==6||!c.claims.every(v=>Array.isArray(v)&&v.length===2&&text(v[0])&&typeof v[1]==='boolean')||new Set(c.claims.map(v=>v[0])).size!==6||!Array.isArray(c.key)||c.key.length!==3||new Set(c.key).size!==3||!c.key.every(i=>Number.isInteger(i)&&i>=0&&i<6&&Array.isArray(c.claims)&&c.claims[i][1]===true))return null;
    const common:Common={title:c.title,unit:c.unit,overview:c.overview,model:c.model,claims:c.claims.map(v=>[v[0],v[1]]),key:[...c.key]};
    if(c.chartType==='process'){
      const stages=c.diagram.stages;
      if(!Array.isArray(stages)||stages.length<4||stages.length>10||!stages.every(s=>object(s)&&text(s.title,100)&&text(s.detail,1000))||new Set(stages.map(s=>s.title)).size!==stages.length)return null;
      charts.push({...common,chartType:'process',diagram:{stages:stages.map(s=>({title:s.title,detail:s.detail}))}});
    }else if(c.chartType==='map'){
      if(!Array.isArray(c.diagram.frames)||c.diagram.frames.length!==2)return null;
      const frames:Task1MapFrame[]=[];
      for(const f of c.diagram.frames){
        if(!object(f)||!text(f.period,100)||(f.status!=='observed'&&f.status!=='proposed')||!Array.isArray(f.cells)||f.cells.length!==9||!f.cells.every(v=>text(v,100)))return null;
        frames.push({period:f.period,status:f.status,cells:[...f.cells]});
      }
      if(frames[0].status!=='observed'||frames[0].period===frames[1].period||JSON.stringify(frames[0].cells)===JSON.stringify(frames[1].cells))return null;
      charts.push({...common,chartType:'map',diagram:{frames:[frames[0],frames[1]]}});
    }else return null;
  }
  if(charts[0].chartType!==charts[1].chartType||charts[0].title===charts[1].title||JSON.stringify(charts[0].diagram)===JSON.stringify(charts[1].diagram))return null;
  return{charts};
}
export const task1MapPositions=['Northwest','North','Northeast','West','Centre','East','Southwest','South','Southeast'] as const;
