import fs from 'node:fs';
import path from 'node:path';
import {trainerBank,bankSourceIdentity} from '../src/lib/trainers/bank-sources';
import {bankPublication,parseBankPublication} from '../src/lib/trainers/bank-publication';
const [command='audit',inputPath]=process.argv.slice(2);
if(command==='audit'){
 if(trainerBank.errors.length||!bankPublication)throw Error('Invalid source or publication manifest; publication is unavailable.');
 const released=new Set(bankPublication.releases.map(r=>bankSourceIdentity(r.source)));
 console.log(JSON.stringify({format:'ashyq-bank-publication-audit-v1',sourceModules:trainerBank.sources.length,releasedModules:released.size,awaitingApproval:trainerBank.sources.filter(s=>!released.has(bankSourceIdentity(s.ref))).map(s=>s.ref),limitations:'Exact-source receipt integrity only. This does not verify human approval truth, difficulty calibration, provider quality or public runtime delivery.'},null,2));
}else if(command==='validate'||command==='prepare'){
 if(!inputPath)throw Error('Provide an explicit human approval receipt path. Browser review recommendations are not approval receipts.');
 const input=path.resolve(inputPath);if(fs.statSync(input).size>1_500_000)throw Error('Approval receipt exceeds1.5MB.');const packet=parseBankPublication(JSON.parse(fs.readFileSync(input,'utf8')));if(!packet)throw Error('Approval receipt is invalid, stale, incomplete, duplicated or omits a Writing companion. No publication file changed.');
 if(command==='prepare'){
  if(!packet.releases.length)throw Error('Empty approval input cannot prepare a release. No publication file changed.');
  const output=path.resolve('src/data/trainer-publications/release.json');if(output===input)throw Error('Use a separate supplied approval receipt as input.');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(packet,null,2)+'\n');
  console.log(`Prepared ${packet.releases.length} exact-source approval receipts for repository review. This changes build input only; nothing is deployed. Operators must verify the human approval evidence before merging.`);
 }else console.log(`Validated ${packet.releases.length} exact-source receipts. No files changed. Human approval truth and student delivery remain separate checks.`);
}else throw Error('Usage: npx tsx scripts/trainer-bank-publication.ts audit | validate <receipt.json> | prepare <receipt.json>');
