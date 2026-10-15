import assert from 'node:assert/strict';
import { awaitWritingRequest } from '../src/lib/writing-trainer/ai-feedback';
import {blankOwnDraft,parseOwnDraft,serializeOwnDraft,parseOwnDraftExport,ownDraftExport,ownDraftReportBlocks} from '../src/lib/writing-trainer/own-draft';

async function main(){
 const draft=blankOwnDraft();draft.prompt='Synthetic task?';draft.original='Original synthetic essay.';draft.working='Current synthetic essay.';draft.step=0;
 draft.ai.grammar={source:draft.working,context:{prompt:draft.prompt,original:draft.original},feedback:{summary:'Synthetic transport only.',strengths:[],issues:[],nextAction:'Review independently.'}};
 assert.deepEqual(parseOwnDraft(serializeOwnDraft(draft)),draft);assert.deepEqual(parseOwnDraftExport(ownDraftExport(draft)),draft);assert.ok(ownDraftReportBlocks(draft).some(b=>b.text.includes('Задание для этой подсказки:\n'+draft.prompt)));
 for(const context of [null,{},[],{prompt:draft.prompt},{prompt:draft.prompt,original:draft.original,extra:true},{prompt:'x'.repeat(1001),original:draft.original},{prompt:draft.prompt,original:'x'.repeat(10001)},{prompt:' ',original:draft.original}]){const bad=structuredClone(draft);Object.assign(bad.ai.grammar!,{context});assert.equal(parseOwnDraft(JSON.stringify(bad)),null);}
 delete draft.ai.grammar!.context;assert.deepEqual(parseOwnDraft(serializeOwnDraft(draft)),draft);assert.ok(ownDraftReportBlocks(draft).some(b=>b.text.includes('Контекст старой подсказки неизвестен')));
 const controller=new AbortController();const hung=awaitWritingRequest(new Promise<string>(()=>{}),controller.signal);controller.abort(new Error('Synthetic caller cancellation'));await assert.rejects(hung,/Synthetic caller/);
 // AbortSignal.timeout uses an unref timer in Node; keep this test process alive until observed.
 const keepAlive=setTimeout(()=>{},1000);
 try{const timeout=awaitWritingRequest(new Promise<string>(()=>{}),AbortSignal.timeout(30));await assert.rejects(timeout,e=>e instanceof DOMException&&e.name==='TimeoutError');}finally{clearTimeout(keepAlive);}
 assert.equal(await awaitWritingRequest(Promise.resolve('synthetic token'),new AbortController().signal),'synthetic token');
 const aborted=new AbortController();aborted.abort(new Error('Already aborted'));await assert.rejects(awaitWritingRequest(Promise.reject(new Error('Late auth failure')),aborted.signal),/Already aborted/);
 console.log('PASS contextual feedback draft/JSON/Word and legacy unknown, strict malformed context rejection, hanging auth cancellation/timeout, late rejected auth consumption. No credentials, real provider or accuracy evidence.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
