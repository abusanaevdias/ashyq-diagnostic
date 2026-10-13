import audio from '@/data/trainer-drafts/listening-audio-02.json';
import audio10 from '@/data/trainer-drafts/listening-audio-10.json';

export type DraftListeningRound = { prompt: string; instruction?: string; script: string; segment: string; answer: string; accepted: string[]; distractors: string[]; explanation: string; fullUrl: string; segmentUrl: string };
export type DraftListeningPair = { focus: string; rounds: DraftListeningRound[]; voice: string; mediaIdentity:string };
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(key=>Object.hasOwn(v,key));
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 5000;
const words = (value: unknown): value is string[] => Array.isArray(value) && value.length > 0 && value.length <= 10 && value.every(text);
export const normalizeDraftAnswer = (value: string) => value.normalize('NFKC').trim().toLowerCase();
export function compareDraftAnswer(value: string, item: DraftListeningRound): 'match' | 'known-distractor' | 'unreviewed' {
  const answer = normalizeDraftAnswer(value);
  return item.accepted.some(candidate => normalizeDraftAnswer(candidate) === answer) ? 'match' : item.distractors.some(candidate => normalizeDraftAnswer(candidate) === answer) ? 'known-distractor' : 'unreviewed';
}
export function parseDraftListening(value: unknown, unitId: string): DraftListeningPair | null {
  if (!/^L\d{2}$/.test(unitId) || !value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (v.kind !== 'listening-pair-v1' || v.publication_ready !== false || v.audio_status !== 'GENERATED_DRAFT' || !text(v.focus) || !Array.isArray(v.rounds) || v.rounds.length !== 2 || ('difficulty_status' in v && v.difficulty_status !== 'AUTHOR_ESTIMATE_UNCALIBRATED')) return null;
  const manifests=[audio,audio10].filter(manifest=>manifest.assets.some(asset=>asset.unit===unitId));
  if(manifests.length!==1)return null;
  const selected=manifests[0];
  if(selected.format!=='ashyq-draft-listening-audio-v1'||selected.publication_ready!==false||!text(selected.synthetic_voice)||!Number.isInteger(selected.voice_rate)||Math.abs(selected.voice_rate)>10)return null;
  const bound=v.media_identity;
  if(!object(bound)||!exact(bound,['format','voice','rate','assets'])||bound.format!=='ashyq-draft-listening-media-v1'||bound.voice!==selected.synthetic_voice||bound.rate!==selected.voice_rate||!Array.isArray(bound.assets)||bound.assets.length!==4)return null;
  const identityAssets:{round:number;kind:string;url:string;sha256:string;bytes:number}[]=[];
  const rounds: DraftListeningRound[] = [];
  for (const [index, value] of v.rounds.entries()) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const r = value as Record<string, unknown>;
    if (!text(r.prompt) || ('instruction' in r&&!text(r.instruction)) || !text(r.script) || !text(r.segment) || !text(r.answer) || !text(r.explanation) || !words(r.accepted) || !words(r.distractors) || !r.script.includes(r.segment)) return null;
    const accepted = r.accepted.map(normalizeDraftAnswer), distractors = r.distractors.map(normalizeDraftAnswer);
    if (!accepted.includes(normalizeDraftAnswer(r.answer)) || new Set(accepted).size !== accepted.length || new Set(distractors).size !== distractors.length || distractors.some(candidate => accepted.includes(candidate))) return null;
    const assets = ['full', 'segment'].map(kind => selected.assets.filter(asset => asset.unit === unitId && asset.round === index && asset.kind === kind));
    if (assets.some(matches => matches.length !== 1)) return null;
    const [full, segment] = assets.map(matches => matches[0]);
    if (full.text !== r.script || segment.text !== r.segment) return null;
    for(const [kindIndex,asset] of [full,segment].entries()){
      const kind=kindIndex?'segment':'full',stem=`/audio/trainers/drafts/${unitId.toLowerCase()}-${index+1}-${kind}`,expected=bound.assets[index*2+kindIndex];
      if(!/^[a-f0-9]{64}$/.test(asset.sha256)||!Number.isSafeInteger(asset.bytes)||asset.bytes<=44||asset.bytes>10_000_000||(asset.url!==`${stem}.wav`&&asset.url!==`${stem}-${asset.sha256}.wav`)||!object(expected)||!exact(expected,['round','kind','url','sha256','bytes'])||expected.round!==index||expected.kind!==kind||expected.url!==asset.url||expected.sha256!==asset.sha256||expected.bytes!==asset.bytes)return null;
      identityAssets.push({round:index,kind,url:asset.url,sha256:asset.sha256,bytes:asset.bytes});
    }
    rounds.push({ prompt: r.prompt, ...(typeof r.instruction==='string'?{instruction:r.instruction}:{}), script: r.script, segment: r.segment, answer: r.answer, accepted: [...r.accepted], distractors: [...r.distractors], explanation: r.explanation, fullUrl: full.url, segmentUrl: segment.url });
  }
  if (rounds[0].script === rounds[1].script) return null;
  return { focus: v.focus, rounds, voice: selected.synthetic_voice,mediaIdentity:JSON.stringify({format:'ashyq-draft-listening-media-v1',voice:selected.synthetic_voice,rate:selected.voice_rate,assets:identityAssets}) };
}
