import { bankTask2Fingerprint, emptyBankTask2State, validBankTask2State, type BankTask2State } from './bank-task2-state';
import { bankReadingFingerprint, emptyBankReadingState, validBankReadingState, type BankReadingState } from './bank-reading-state';
import type { BankSource } from './bank-sources';
import {bankMathFingerprint,emptyBankMathState,validBankMathState,type BankMathState} from './bank-math-state';
import {bankSatFingerprint,emptyBankSatState,validBankSatState,type BankSatState} from './bank-sat-state';
import {bankTask1Fingerprint,emptyBankTask1State,validBankTask1State,type BankTask1State} from './bank-task1-state';

export type BankSnapshot=BankTask2State|BankReadingState|BankMathState|BankSatState|BankTask1State;
export function bankSnapshotFingerprint(value:BankSnapshot):string{
  switch(value.type){case 'task2':return bankTask2Fingerprint(value);case 'reading':return bankReadingFingerprint(value);case 'math':return bankMathFingerprint(value);case 'sat-rw':return bankSatFingerprint(value);case 'task1':return bankTask1Fingerprint(value);}
}
export function emptyBankSnapshot(source:BankSource):BankSnapshot|null{
  switch(source.exercise.type){case 'task2':return emptyBankTask2State();case 'reading':return emptyBankReadingState();case 'math':return emptyBankMathState();case 'sat-rw':return emptyBankSatState();case 'task1-line':case 'task1-categories':case 'task1-diagrams':return emptyBankTask1State();default:return null;}
}
export function bankSnapshotComplete(value:BankSnapshot):boolean{return value.type==='task2'?value.result:value.type==='task1'?value.phase==='report':value.report;}
export function validSourceSnapshot(source:BankSource,value:unknown):value is BankSnapshot{
  switch(source.exercise.type){case 'task2':return validBankTask2State(value,source.exercise.value);case 'reading':return validBankReadingState(value,source.exercise.value);case 'math':return validBankMathState(value,source.exercise.value);case 'sat-rw':return validBankSatState(value,source.exercise.value);case 'task1-line':case 'task1-categories':case 'task1-diagrams':return validBankTask1State(value,source.exercise.value);default:return false;}
}
