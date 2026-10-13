import {bankSpeakingFingerprint,emptyBankSpeakingState,validBankSpeakingState,type BankSpeakingState} from './bank-speaking-state';
import { bankTask2Fingerprint, emptyBankTask2State, validBankTask2State, type BankTask2State } from './bank-task2-state';
import { bankReadingFingerprint, emptyBankReadingState, validBankReadingState, type BankReadingState } from './bank-reading-state';
import type { BankSource } from './bank-sources';
import {bankMathFingerprint,emptyBankMathState,validBankMathState,type BankMathState} from './bank-math-state';
import {bankSatFingerprint,emptyBankSatState,validBankSatState,type BankSatState} from './bank-sat-state';
import {bankTask1Fingerprint,emptyBankTask1State,validBankTask1State,type BankTask1State} from './bank-task1-state';
import {bankWritingPair,bankWritingFingerprint,emptyBankWritingState,validBankWritingState,type BankWritingState} from './bank-writing-state';
import {bankListeningFingerprint,emptyBankListeningState,validBankListeningState,type BankListeningState} from './bank-listening-state';

export type BankSnapshot=BankTask2State|BankReadingState|BankMathState|BankSatState|BankTask1State|BankWritingState|BankListeningState|BankSpeakingState;
export function bankSnapshotFingerprint(value:BankSnapshot):string{
  switch(value.type){case 'speaking':return bankSpeakingFingerprint(value);case 'task2':return bankTask2Fingerprint(value);case 'reading':return bankReadingFingerprint(value);case 'math':return bankMathFingerprint(value);case 'sat-rw':return bankSatFingerprint(value);case 'task1':return bankTask1Fingerprint(value);case 'writing-drill':return bankWritingFingerprint(value);case 'listening':return bankListeningFingerprint(value);}
}
export function emptyBankSnapshot(source:BankSource):BankSnapshot|null{
  switch(source.exercise.type){case 'speaking':return emptyBankSpeakingState();case 'task2':return emptyBankTask2State();case 'reading':return emptyBankReadingState();case 'math':return emptyBankMathState();case 'sat-rw':return emptyBankSatState();case 'task1-line':case 'task1-categories':case 'task1-diagrams':return emptyBankTask1State();case 'writing-drill':{const pair=bankWritingPair(source);return pair?emptyBankWritingState(pair):null;}case 'listening':return emptyBankListeningState(source.exercise.value);default:return null;}
}
export function bankSnapshotComplete(value:BankSnapshot):boolean{return value.type==='speaking'?value.phase==='result':value.type==='task2'?value.result:value.type==='task1'?value.phase==='report':value.type==='writing-drill'?value.records.length===2:value.report;}
export function validSourceSnapshot(source:BankSource,value:unknown):value is BankSnapshot{
  switch(source.exercise.type){case 'speaking':return validBankSpeakingState(value,source.exercise.value);case 'task2':return validBankTask2State(value,source.exercise.value);case 'reading':return validBankReadingState(value,source.exercise.value);case 'math':return validBankMathState(value,source.exercise.value);case 'sat-rw':return validBankSatState(value,source.exercise.value);case 'task1-line':case 'task1-categories':case 'task1-diagrams':return validBankTask1State(value,source.exercise.value);case 'writing-drill':{const pair=bankWritingPair(source);return !!pair&&validBankWritingState(value,pair);}case 'listening':return validBankListeningState(value,source.exercise.value);default:return false;}
}
