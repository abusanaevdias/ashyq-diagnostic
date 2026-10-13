import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import batch from '../src/data/trainer-drafts/batch-14.json';
import { draftBatches, emptyDraftReview, parseDraftReview } from '../src/lib/trainers/draft-review';
import { parseDraftTask1Diagrams } from '../src/lib/trainers/draft-task1-diagrams';
assert.equal(batch.methodically_approved,false); assert.equal(batch.units.length,2);
assert.equal(batch.content_sha256,crypto.createHash('sha256').update(JSON.stringify(batch.units)).digest('hex'));
const ids=draftBatches.flatMap(value=>value.units.map(unit=>unit.id));assert.equal(new Set(ids).size,ids.length);
for(const unit of batch.units){
  const pair=parseDraftTask1Diagrams(unit.exercise_data);assert.ok(pair,unit.id);
  assert.equal(unit.status,'DRAFT');assert.ok(!unit.student_markdown.includes(pair.charts[1].title));
  for(const item of pair.charts){
    assert.ok(item.model.split(/\s+/).length>=150);
    assert.equal(item.claims.filter(claim=>claim[1]).length,4);
    assert.ok(item.key.every(index=>item.claims[index][1]));
    assert.ok(unit.teacher_markdown.includes(item.model));
  }
  for(const override of [{publication_ready:true},{difficulty_status:'CALIBRATED'},{charts:[]},{charts:[unit.exercise_data.charts[0],unit.exercise_data.charts[0]]}])assert.equal(parseDraftTask1Diagrams({...unit.exercise_data,...override}),null);
  for(const field of ['title','overview','model']){
    const changed=structuredClone(unit.exercise_data);changed.charts[0][field as 'title'|'overview'|'model']='';assert.equal(parseDraftTask1Diagrams(changed),null);
  }
  const wrong=structuredClone(unit.exercise_data);wrong.charts[0].key=[0,0,0];assert.equal(parseDraftTask1Diagrams(wrong),null);
  const review=JSON.stringify(emptyDraftReview('fixture',batch));
  for(const other of draftBatches.filter(value=>value.batch!==batch.batch))assert.equal(parseDraftReview(review,'fixture',other),null);
}
const processes=parseDraftTask1Diagrams(batch.units[0].exercise_data)!;
assert.deepEqual(processes.charts.map(chart=>chart.key),[[0,1,2],[5,0,1]]);
for(const chart of processes.charts){assert.equal(chart.chartType,'process');if(chart.chartType!=='process')throw Error('Wrong source type');assert.equal(chart.diagram.stages.length,7);}
const first=processes.charts[0];assert.equal(first.chartType,'process');if(first.chartType==='process'){
  assert.ok(first.diagram.stages[2].detail.includes('overnight'));
  assert.ok(first.diagram.stages[4].detail.includes('excess water'));
  assert.ok(first.diagram.stages[5].detail.includes('air-dry'));
  assert.ok(first.diagram.stages[6].detail.includes('dry sheet'));
}
const fresh=processes.charts[1];if(fresh.chartType==='process'){
  assert.ok(fresh.diagram.stages[3].detail.includes('names'));
  assert.ok(fresh.diagram.stages[4].detail.includes('24 hours'));
  assert.ok(fresh.diagram.stages[5].detail.includes('kiln'));
  assert.ok(fresh.diagram.stages[6].detail.includes('cooled and then packed'));
}
const maps=parseDraftTask1Diagrams(batch.units[1].exercise_data)!;
assert.deepEqual(maps.charts.map(chart=>chart.key),[[4,5,0],[3,4,5]]);
const expectedUnchanged=[[4,5,6,7],[2,4,5,6,7]];
for(const [index,chart]of maps.charts.entries()){
  assert.equal(chart.chartType,'map');if(chart.chartType!=='map')throw Error('Wrong source type');
  const[a,b]=chart.diagram.frames;
  assert.deepEqual(a.cells.flatMap((label,i)=>label===b.cells[i]?[i]:[]),expectedUnchanged[index]);
  assert.equal(b.status,index?'proposed':'observed');
  assert.equal(b.cells[8],index?'Café':'Picnic area');
  assert.equal(b.cells[4],index?'Open yard':'Greenhouse');
  assert.equal(b.cells[5],index?'Sports court':'Pond');
}
for(const mode of ['short','bad-status','unchanged','same-period','empty-cell']){
  const changed=structuredClone(batch.units[1].exercise_data);const raw=changed.charts[0].diagram as {frames:{period:string;status:string;cells:string[]}[]};
  if(mode==='short')raw.frames[1].cells.pop();
  if(mode==='bad-status')raw.frames[0].status='proposed';
  if(mode==='unchanged')raw.frames[1].cells=[...raw.frames[0].cells];
  if(mode==='same-period')raw.frames[1].period=raw.frames[0].period;
  if(mode==='empty-cell')raw.frames[1].cells[0]='';
  assert.equal(parseDraftTask1Diagrams(changed),null);
}
console.log(`PASS two Task1 diagram pairs/four full models: seven-step process roles/durations, exact unchanged/changed map positions and proposed-state boundary, rotated keys, 21 malformed sources, fresh isolation and ${ids.length} unique DRAFT modules. Schematics have no measured areas/throughput, methodological approval or IELTS score.`);
