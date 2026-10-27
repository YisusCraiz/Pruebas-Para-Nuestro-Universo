import {translationCache,translationKey} from './translation-cache.js?v=20261026-saved1';
import {translateCaptionCues} from './translate-captions.js?v=20261026-portable2';
import {parseSubtitles} from './subtitles.js?v=20261026-captions1';
const cancelled=signal=>{if(signal?.aborted)throw new DOMException('Cancelado','AbortError');};
export async function readSavedTranslation(cues,{source,target,signal,cache=translationCache}){
 cancelled(signal);let key,raw;try{key=await translationKey(cues,source,target);raw=await cache.get(key);}catch{return {key:null,raw:null};}cancelled(signal);
 // Corrupt/old records must never appear as another episode or partial result.
 const parsed=typeof raw==='string'?parseSubtitles(raw):[];
 const valid=parsed.length===cues.length&&parsed.every((cue,n)=>Math.abs(cue.start-cues[n].start)<=.001&&Math.abs(cue.end-cues[n].end)<=.001);
 return {key,raw:valid?raw:null};
}
export async function savedTranslation(cues,options){
 const {cache=translationCache,onProgress=()=>{},signal}=options;
 const saved=await readSavedTranslation(cues,options);cancelled(signal);
 if(saved.raw){onProgress({stage:'cached'});return saved.raw;}
 const raw=await translateCaptionCues(cues,options);cancelled(signal);
 let stored=false;try{stored=await cache.put(saved.key,raw);}catch{}cancelled(signal);
 onProgress({stage:stored?'saved':'unsaved'});return raw;
}
