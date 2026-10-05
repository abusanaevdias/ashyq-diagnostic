import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = fs.readFileSync(path.join(repo, 'src/components/trainers/SpeakingSecondTake.tsx'), 'utf8');
const tree = ts.createSourceFile('component.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const wanted = new Set(['clearClock','releaseMicrophone','cancelCapture','storeTake','startRecording','stopRecording']);
const functions = [];
let cleanup;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name && wanted.has(node.name.text)) functions.push(node.getText(tree));
  if (ts.isCallExpression(node) && node.expression.getText(tree) === 'useEffect' && node.arguments[0]?.getText(tree).includes('URL.revokeObjectURL')) cleanup = node.arguments[0].getText(tree);
  ts.forEachChild(node, visit);
}
visit(tree);
assert.equal(functions.length, wanted.size);
assert.ok(cleanup);
const program = ts.transpileModule(functions.join('\n') + '\n const cleanup = (' + cleanup + ')();\n api = {startRecording,cancelCapture,stopRecording,cleanup};', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

function fixture({denied=false, deferred=false, empty=false, delayedStop=false}={}) {
  let resolvePermission;
  const tracks = { stops: 0, stop() { this.stops++; } };
  const input = { getTracks: () => [tracks] };
  const timers = new Map();
  let nextTimer = 0;
  const state = { now: 1000, pending: false, recording: false, phase: 'capture', takes: [], error: '', created: [], revoked: [] };
  class Recorder {
    static isTypeSupported() { return true; }
    constructor() { this.state = 'inactive'; this.mimeType = 'audio/webm'; state.instance = this; }
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; this.ondataavailable?.({data: new Blob(empty ? [] : ['fixture audio'])}); if (!delayedStop) this.onstop?.(); }
  }
  const context = {
    Blob, MediaRecorder: Recorder,
    navigator: { mediaDevices: {getUserMedia() { return denied ? Promise.reject(new Error('denied')) : deferred ? new Promise(resolve=>resolvePermission=resolve) : Promise.resolve(input); }} },
    performance: {now: () => state.now},
    URL: {createObjectURL() {const url='blob:test-'+state.created.length;state.created.push(url);return url;},revokeObjectURL(url) {state.revoked.push(url);}},
    requestId:{current:0},recorder:{current:null},stream:{current:null},startTime:{current:0},stopTime:{current:0},clock:{current:null},recordingLimit:{current:null},urls:{current:new Set()},
    takeIndex:0,pending:false,recording:false,
    setPending(value) {state.pending=value;context.pending=value;},setRecording(value) {state.recording=value;context.recording=value;},
    setElapsed() {},setError(value) {state.error=value;},setNoMarkers() {},setMarkerNote() {},
    setPhase(value) {state.phase=value;},setTakes(update) {state.takes=update(state.takes);},
    blankTake:(url,seconds)=>({url,seconds}),
    setInterval(callback) {const id=++nextTimer;timers.set(id,callback);return id;},setTimeout(callback) {const id=++nextTimer;timers.set(id,callback);return id;},
    clearInterval(id) {timers.delete(id);},clearTimeout(id) {timers.delete(id);},
  };
  vm.createContext(context); vm.runInContext(program, context);
  return {context,state,tracks,timers,grant:()=>resolvePermission(input)};
}

(async()=> {
  const late=fixture({deferred:true}); const promise=late.context.api.startRecording(); assert.equal(late.state.pending,true);late.context.api.cancelCapture();late.grant();await promise;assert.equal(late.tracks.stops,1);assert.equal(late.state.created.length,0);assert.equal(late.state.pending,false);
  const regular=fixture({delayedStop:true});await regular.context.api.startRecording();assert.equal(regular.state.recording,true);regular.state.now=2000;regular.context.api.stopRecording();regular.state.now=5000;regular.state.instance.onstop();assert.equal(regular.state.takes[0].seconds,1);assert.equal(regular.state.phase,'review');assert.equal(regular.tracks.stops,1);assert.equal(regular.timers.size,0);
  const timed=fixture();await timed.context.api.startRecording();timed.state.now=121000;timed.timers.get(timed.context.recordingLimit.current)();assert.equal(timed.state.takes[0].seconds,120);assert.equal(timed.tracks.stops,1);
  const cancelled=fixture();await cancelled.context.api.startRecording();cancelled.context.api.cancelCapture();assert.equal(cancelled.state.created.length,0);assert.equal(cancelled.tracks.stops,1);assert.equal(cancelled.timers.size,0);
  const blank=fixture({empty:true});await blank.context.api.startRecording();blank.state.now=2000;blank.context.api.stopRecording();assert.equal(blank.state.created.length,0);assert.ok(blank.state.error.includes('пустая'));assert.equal(blank.tracks.stops,1);
  const denied=fixture({denied:true});await denied.context.api.startRecording();assert.equal(denied.state.pending,false);assert.ok(denied.state.error.includes('Микрофон'));assert.equal(denied.state.created.length,0);
  const failed=fixture();await failed.context.api.startRecording();failed.state.instance.onerror();assert.equal(failed.state.created.length,0);assert.equal(failed.tracks.stops,1);assert.ok(failed.state.error.includes('прервалась'));
  const unmounted=fixture();await unmounted.context.api.startRecording();unmounted.context.urls.current.add('blob:previous');unmounted.context.api.cleanup();assert.equal(unmounted.tracks.stops,1);assert.equal(unmounted.state.created.length,0);assert.deepEqual(unmounted.state.revoked,['blob:previous']);assert.equal(unmounted.timers.size,0);
  console.log('PASS 8 extracted-source recorder scenarios; synthetic events only, no browser microphone or codec validation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
