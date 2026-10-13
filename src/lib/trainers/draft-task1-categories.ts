import { draftTask1Words, type DraftTask1Chart } from './draft-task1';
export type Task1CategoryChart = Pick<DraftTask1Chart,'title'|'unit'|'overview'|'model'|'claims'|'key'> & { chartType:'bar'|'pie'; period:string; categories:string[]; values:number[] };
export type DraftTask1CategoryPair = { charts: Task1CategoryChart[] };
const text=(v:unknown,max=12000):v is string=>typeof v==='string'&&!!v.trim()&&v.length<=max;
export function parseDraftTask1Categories(value:unknown):DraftTask1CategoryPair|null{
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const v=value as Record<string,unknown>;
  if(v.kind!=='task1-categories-pair-v1'||v.publication_ready!==false||v.difficulty_status!=='AUTHOR_ESTIMATE_UNCALIBRATED'||!Array.isArray(v.charts)||v.charts.length!==2)return null;
  const charts:Task1CategoryChart[]=[];
  for(const raw of v.charts){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;const c=raw as Record<string,unknown>;
    if((c.chartType!=='bar'&&c.chartType!=='pie')||!text(c.title,200)||!text(c.unit,100)||!text(c.period,100)||!text(c.overview)||!text(c.model)||draftTask1Words(c.model)<150||!Array.isArray(c.categories)||c.categories.length<3||c.categories.length>6||!c.categories.every(v=>text(v,80))||new Set(c.categories).size!==c.categories.length||!Array.isArray(c.values)||c.values.length!==c.categories.length||!c.values.every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1e9)||!c.values.some(v=>v>0))return null;
    if(c.chartType==='pie'&&(c.unit!=='%'||c.values.some(v=>v>100)||Math.abs(c.values.reduce((sum,n)=>sum+n,0)-100)>1e-6))return null;
    if(!Array.isArray(c.claims)||c.claims.length!==6||!c.claims.every(v=>Array.isArray(v)&&v.length===2&&text(v[0])&&typeof v[1]==='boolean')||new Set(c.claims.map(v=>v[0])).size!==6||!Array.isArray(c.key)||c.key.length!==3||new Set(c.key).size!==3||!c.key.every(i=>Number.isInteger(i)&&i>=0&&i<6&&Array.isArray(c.claims)&&c.claims[i][1]===true))return null;
    charts.push({chartType:c.chartType,title:c.title,unit:c.unit,period:c.period,categories:[...c.categories],values:[...c.values],overview:c.overview,model:c.model,claims:c.claims.map(v=>[v[0],v[1]]),key:[...c.key]});
  }
  if(charts[0].title===charts[1].title||JSON.stringify([charts[0].categories,charts[0].values])===JSON.stringify([charts[1].categories,charts[1].values]))return null;
  return{charts};
}
