'use client';
import {awaitWritingRequest as abortable} from '../writing-trainer/ai-feedback';
import {encodeSpeakingWav,SPEAKING_SAMPLE_RATE,SpeakingAudioError} from './transcription-wav';

/** Local conversion only. This neither opens a microphone nor contacts the provider. */
export async function prepareSpeakingUpload(blob:Blob,signal:AbortSignal,recordedSeconds:number|null):Promise<{bytes:Uint8Array;hash:string}>{
 signal.throwIfAborted();
 if(!(blob instanceof Blob))throw new SpeakingAudioError('Оригинальная запись недоступна в этой вкладке.');
 if(recordedSeconds!==null&&recordedSeconds>125)throw new SpeakingAudioError('Запись длиннее лимита распознавания. Оригинал не обрезан: можно добавить расшифровку вручную.');
 if(typeof AudioContext==='undefined'||typeof OfflineAudioContext==='undefined'||!globalThis.crypto?.subtle)throw new SpeakingAudioError('Браузер не поддерживает подготовку аудио. Добавь расшифровку вручную.');
 // The recorder passes its own in-memory Blob; no fetch(blob:) or CSP exception is needed.
 if(blob.size>20_000_000)throw new SpeakingAudioError('Локальная запись слишком большая для подготовки. Оригинал не изменён.');
 const decoder=new AudioContext();
 try{
  const decoded=await abortable(decoder.decodeAudioData(await abortable(blob.arrayBuffer(),signal)),signal);signal.throwIfAborted();
  if(decoded.duration<0.2||decoded.duration>120)throw new SpeakingAudioError('Для распознавания нужна запись от 0,2 до 120 секунд. Она не была обрезана.');
  const offline=new OfflineAudioContext(1,Math.round(decoded.duration*SPEAKING_SAMPLE_RATE),SPEAKING_SAMPLE_RATE),input=offline.createBufferSource();input.buffer=decoded;input.connect(offline.destination);input.start();
  const converted=await abortable(offline.startRendering(),signal);signal.throwIfAborted();const bytes=encodeSpeakingWav(converted.getChannelData(0));
  const digest=await abortable(crypto.subtle.digest('SHA-256',bytes.slice().buffer),signal);signal.throwIfAborted();
  return {bytes,hash:Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('')};
 }finally{void decoder.close().catch(()=>{});}
}
