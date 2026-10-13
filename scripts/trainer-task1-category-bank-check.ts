import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import batch from '../src/data/trainer-drafts/batch-09.json';
import {parseDraftTask1Categories}from '../src/lib/trainers/draft-task1-categories';
import {task1PieLayout}from '../src/lib/trainers/task1-pie-layout';
assert.equal(batch.methodically_approved,false);assert.equal(batch.units.length,4);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(batch.units)).digest('hex'),batch.content_sha256);
let charts=0;
for(const unit of batch.units){const pair=parseDraftTask1Categories(unit.exercise_data);assert.ok(pair);assert.equal(unit.status,'DRAFT');
  assert.ok(!unit.student_markdown.includes(pair.charts[1].title));
  for(const c of pair.charts){charts++;const sorted=c.values.map((value,index)=>({value,name:c.categories[index]})).sort((a,b)=>b.value-a.value);const sum=c.values.reduce((a,b)=>a+b,0);
    assert.ok(sorted[0].value+sorted[1].value>sum/2);assert.equal(new Set(c.values).size,c.values.length,'current author overview has unique extrema');
    if(c.chartType==='pie')assert.equal(sum,100);
    assert.ok(c.overview.includes(sorted[0].name)&&c.overview.includes(sorted.at(-1)!.name));
    const expectations=new Map([
      [`${sorted[0].name} was the largest category.`,true],
      [`${sorted.at(-1)!.name} was the smallest category.`,true],
      [c.chartType==='bar'?'The two largest categories together represented more than half of the registrations.':'The two largest shares together made up more than half of the allocation.',sorted[0].value+sorted[1].value>sum/2],
      [`${sorted.at(-1)!.name} was larger than ${sorted[0].name}.`,false],
      [`${c.categories[0]} had ${c.values[0]}${c.chartType==='pie'?'%':' registrations'}.`,true],
      [c.chartType==='bar'?`${sorted[0].name} increased most compared with the previous year.`:'The total allocation was larger than in the previous year.',false]
    ]);
    assert.equal(expectations.size,6);for(const claim of c.claims)assert.equal(claim[1],expectations.get(claim[0]));
    assert.ok(c.model.includes(String(sorted[0].value-sorted.at(-1)!.value)+(c.chartType==='pie'?'-percentage-point':'')));
    assert.ok(c.chartType==='pie'?c.model.includes(`${sorted[0].value-sorted[1].value} percentage points`):c.model.includes(`approximately ${Math.round((sorted[0].value+sorted[1].value)/sum*100)}%`));
  }
}
const original=batch.units[2].exercise_data;
const mutate=(fn:(v:typeof original)=>void)=>{const v=structuredClone(original);fn(v);return v;};
for(const value of [null,[],{}, {...original,publication_ready:true}, {...original,difficulty_status:'CALIBRATED'}, {...original,charts:[original.charts[0],original.charts[0]]},
  mutate(v=>{v.charts[0].chartType='line';}),mutate(v=>{v.charts[0].values[0]=101;}),mutate(v=>{v.charts[0].values[0]=-1;}),mutate(v=>{v.charts[0].values[0]=Infinity;}),mutate(v=>{v.charts[0].categories[1]=v.charts[0].categories[0];}),mutate(v=>{v.charts[0].values.pop();}),mutate(v=>{v.charts[0].unit='USD';}),mutate(v=>{v.charts[0].model='short';}),mutate(v=>{v.charts[0].key=[0,0,0];})])assert.equal(parseDraftTask1Categories(value),null);
for(const values of [[100,0,0],[0,100,0],[97,1,1,1,0,0],[1,1,1,1,1,95],[0,0,0,0,0,100],[50,50,0],[16,16,17,17,17,17]]){
  const {sectors,labels}=task1PieLayout(values);assert.equal(labels.length,values.filter(v=>v>0).length);
  assert.equal(sectors.filter(s=>s.fullCircle).length,values.includes(100)?1:0);
  for(const s of sectors)assert.ok(Math.abs((s.end-s.start)/(Math.PI*2)*100-values[s.index])<1e-10,'true wedge area retained');
  for(const side of ['left','right']){const sorted=labels.filter(l=>l.side===side).sort((a,b)=>a.y-b.y);for(let i=0;i<sorted.length;i++){assert.ok(sorted[i].y>=30&&sorted[i].y<=370);if(i)assert.ok(sorted[i].y-sorted[i-1].y>=34);}}
}
assert.equal(charts,8);
console.log('PASS four category-chart pairs/eight bar-pie charts: independent ranks/totals/proportions/percentage-point differences, all 48 support claims/keys, unique extrema/fresh isolation, 15 malformed sources, full-circle/zero/tiny-share area and nonoverlapping labels. Author DRAFT, no band/approval or native-device claim.');
