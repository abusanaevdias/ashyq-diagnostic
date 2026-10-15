import assert from 'node:assert/strict';
import {chromium} from 'playwright';
async function main(){
 const base=process.env.TRAINER_CHECK_BASE??'http://127.0.0.1:3048';assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));const browser=await chromium.launch({headless:true});
 try{const page=await browser.newPage(),errors:string[]=[],posts:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',request=>{if(request.method()==='POST')posts.push(request.url());});await page.goto(base+'/synthetic-speaking-conversion');await page.waitForFunction(()=>typeof (window as unknown as {syntheticSpeakingConversion:unknown}).syntheticSpeakingConversion==='function');
  const convert=(samples:number,cancelled=false)=>page.evaluate(({samples,cancelled})=>(window as unknown as {syntheticSpeakingConversion:(samples:number,cancelled:boolean)=>Promise<{ok:boolean;seconds?:number;bytes?:number;hash?:string;error?:string}>}).syntheticSpeakingConversion(samples,cancelled),{samples,cancelled});
  for(const samples of [3200,16000,1_920_000]){const result=await convert(samples);assert.equal(result.ok,true,JSON.stringify(result));assert.equal(result.seconds,samples/16000);assert.equal(result.bytes,44+samples*2);assert.match(result.hash!,/^[a-f0-9]{64}$/);}
  for(const samples of [3199,1_920_001])assert.equal((await convert(samples)).ok,false);assert.equal((await convert(16000,true)).ok,false);assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);console.log('PASS actual Chromium WAV decode/resample/encode/SHA256 at0.2s/1s/120s and one-frame-under/over limits, pre-abort, no upload. Generated PCM only, not compressed120s codec padding or real speech.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
