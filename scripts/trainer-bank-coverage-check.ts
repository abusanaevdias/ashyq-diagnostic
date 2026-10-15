import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {trainerBank} from '../src/lib/trainers/bank-sources';
import {createBankEntry,emptyBankRecord,parseBankRecord,validBankSnapshot} from '../src/lib/trainers/bank-records';
import {bankSnapshotComplete,bankSnapshotFingerprint,emptyBankSnapshot} from '../src/lib/trainers/bank-snapshots';
const counts:Record<string,number>={};
for(const source of trainerBank.sources){
 const empty=emptyBankSnapshot(source);assert.ok(empty,source.ref.unitId+' has a real adapter');assert.ok(validBankSnapshot(source,empty),source.ref.unitId+' accepts its own pristine state');assert.equal(bankSnapshotComplete(empty),false);assert.equal(bankSnapshotFingerprint(empty),bankSnapshotFingerprint(structuredClone(empty)));
 const entry=createBankEntry(source,empty),record={...emptyBankRecord(source),revision:crypto.randomUUID(),checkpoint:entry};assert.ok(parseBankRecord(JSON.stringify(record),source));counts[source.trainer]=(counts[source.trainer]??0)+1;
 assert.equal(source.unit.status,'DRAFT');assert.equal(source.difficulty,'uncalibrated');
}
assert.equal(trainerBank.sources.length,108);assert.deepEqual(counts,{'reading-evidence':18,'listening-replay':8,'speaking-second-take':10,'task1-overview':8,'writing-task2':8,'writing-drills':24,'sat-optionless':8,'sat-distractor':8,'math-forensics':7,'sat-translation':5,'math-method-switch':4});
console.log('PASS108 source-bound pristine snapshot/record adapters across11 bank families. This checks adapter coverage only; full attempt/UI evidence is in family suites. All sources remain DRAFT and uncalibrated, with no publication or quality claim.');
