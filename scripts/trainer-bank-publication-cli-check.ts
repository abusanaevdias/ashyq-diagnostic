import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const directory=path.resolve('artifacts/trainers-complete-033/publication-cli');fs.mkdirSync(directory,{recursive:true});
const publicationPath=path.resolve('src/data/trainer-publications/release.json'),before=fs.readFileSync(publicationPath);
const run=(...args:string[])=>spawnSync(process.execPath,[path.resolve('node_modules/tsx/dist/cli.mjs'),'scripts/trainer-bank-publication.ts',...args],{encoding:'utf8',timeout:30000});
const audit=run('audit');assert.equal(audit.status,0,audit.stderr);const summary=JSON.parse(audit.stdout);assert.equal(summary.sourceModules,100);assert.equal(summary.releasedModules,0);assert.equal(summary.awaitingApproval.length,100);
for(const [name,body] of [['bad','{bad'],['recommendation',JSON.stringify({format:'ashyq-draft-review-v1',decisions:{}})],['empty',JSON.stringify({format:'ashyq-bank-publication-v1',releases:[]})],['oversize',' '.repeat(1_500_001)]] as const){const input=path.join(directory,name+'.json');fs.writeFileSync(input,body);const result=run('prepare',input);assert.notEqual(result.status,0);assert.deepEqual(fs.readFileSync(publicationPath),before);}
const validation=run('validate',path.join(directory,'empty.json'));assert.equal(validation.status,0,validation.stderr);assert.deepEqual(fs.readFileSync(publicationPath),before);
assert.notEqual(run('prepare').status,0);assert.notEqual(run('unknown').status,0);assert.deepEqual(fs.readFileSync(publicationPath),before);
console.log('PASS actual publication CLI audit100/0/100 and read-only validation; malformed/recommendation/empty/oversize/missing-input/unknown-command preparation refusal preserves exact bundled bytes. No human approval generated or publication prepared.');
