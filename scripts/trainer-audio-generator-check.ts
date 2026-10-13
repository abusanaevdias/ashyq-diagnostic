import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync}from 'node:child_process';
import batch from '../src/data/trainer-drafts/batch-10.json';
import audio02 from '../src/data/trainer-drafts/listening-audio-02.json';

assert.equal(process.platform,'win32','Offline System.Speech generator requires Windows');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'ashyq-audio-collision-'));
try{
  for(const folder of ['scripts','src/data/trainer-drafts','public/audio/trainers/drafts'])fs.mkdirSync(path.join(root,folder),{recursive:true});
  fs.copyFileSync('scripts/generate-draft-listening.ps1',path.join(root,'scripts/generate-draft-listening.ps1'));
  const invalid=structuredClone(batch);invalid.units[0].id='L03';
  fs.writeFileSync(path.join(root,'src/data/trainer-drafts/batch-10.json'),JSON.stringify(invalid));
  fs.writeFileSync(path.join(root,'src/data/trainer-drafts/listening-audio-02.json'),JSON.stringify(audio02));
  const sentinel=path.join(root,'public/audio/trainers/drafts/l03-1-full.wav');fs.writeFileSync(sentinel,'foreign-audio-sentinel');
  const result=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(root,'scripts/generate-draft-listening.ps1'),'-Batch','10'],{cwd:root,encoding:'utf8',timeout:20000});
  assert.equal(result.error,undefined);assert.notEqual(result.status,0);assert.match(result.stdout+result.stderr,/Another batch owns an audio unit ID/);
  assert.equal(fs.readFileSync(sentinel,'utf8'),'foreign-audio-sentinel');
  assert.equal(fs.readdirSync(path.dirname(sentinel)).length,1,'no audio generated before ownership rejection');
  console.log('PASS isolated offline-audio generator counterexample: a foreign batch unit ID rejects before voice/output and preserves existing audio exactly. No project source/audio was mutated by this fixture.');
}finally{
  const resolved=path.resolve(root),parent=path.resolve(os.tmpdir());
  if(path.dirname(resolved)!==parent||!path.basename(resolved).startsWith('ashyq-audio-collision-'))throw new Error('Refusing cleanup outside the exact generated temporary directory');
  fs.rmSync(resolved,{recursive:true,force:true});
}
