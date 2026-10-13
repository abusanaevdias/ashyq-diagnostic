import { bankTask2Fingerprint, emptyBankTask2State, validBankTask2State, type BankTask2State } from './bank-task2-state';
import { bankReadingFingerprint, emptyBankReadingState, validBankReadingState, type BankReadingState } from './bank-reading-state';
import type { BankSource } from './bank-sources';
import {bankMathFingerprint,emptyBankMathState,validBankMathState,type BankMathState} from './bank-math-state';
import {bankSatFingerprint,emptyBankSatState,validBankSatState,type BankSatState} from './bank-sat-state';

export type BankSnapshot=BankTask2State|BankReadingState|BankMathState|BankSatState;
export function bankSnapshotFingerprint(value:BankSnapshot):string{
  switch(value.type){case 'task2':return bankTask2Fingerprint(value);case 'reading':return bankReadingFingerprint(value);case 'math':return bankMathFingerprint(value);case 'sat-rw':return bankSatFingerprint(value);}
}
export function emptyBankSnapshot(source:BankSource):BankSnapshot|null{
  switch(source.exercise.type){case 'task2':return emptyBankTask2State();case 'reading':return emptyBankReadingState();case 'math':return emptyBankMathState();case 'sat-rw':return emptyBankSatState();default:return null;}
}
export function bankSnapshotComplete(value:BankSnapshot):boolean{return value.type==='task2'?value.result:value.report;}
export function validSourceSnapshot(source:BankSource,value:unknown):value is BankSnapshot{
  switch(source.exercise.type){case 'task2':return validBankTask2State(value,source.exercise.value);case 'reading':return validBankReadingState(value,source.exercise.value);case 'math':return validBankMathState(value,source.exercise.value);case 'sat-rw':return validBankSatState(value,source.exercise.value);default:return false;}
}
