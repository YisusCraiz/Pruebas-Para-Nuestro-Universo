import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {translationKey,translationCache} from '../translation-cache.js';
import {savedTranslation,readSavedTranslation} from '../saved-translation.js';
import {parseSubtitles} from '../subtitles.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const cues=[{start:1.25,end:2.75,text:'Hello'}];
function fixture(){const records=new Map();let calls=0;return {records,get calls(){return calls;},cache:{get:async k=>records.get(k),put:async(k,raw)=>{records.set(k,raw);return true;}},api:{create:async()=>{calls++;return {translate:async()=>'Hola',destroy(){}};}}};}
test('completed translation survives a new call without starting the model',async()=>{const f=fixture(),options={source:'en',target:'es',...f};const stages=[];const first=await savedTranslation(cues,{...options,onProgress:p=>stages.push(p.stage)});const second=await savedTranslation(cues,{...options,api:{create(){throw Error('Must not load the model');}}});assert.equal(first,second);assert.equal(f.calls,1);assert.ok(stages.includes('saved'));assert.equal(parseSubtitles(second)[0].text,'Hola');});
test('cache identity separates language, text and timing changes',async()=>{const key=await translationKey(cues,'en','es');for(const changed of [[[{...cues[0],text:'Goodbye'}],'en','es'],[[{...cues[0],start:1.5}],'en','es'],[cues,'es','en']])assert.notEqual(await translationKey(...changed),key);});
test('incomplete and mistimed records are ignored',async()=>{const f=fixture();const key=await translationKey(cues,'en','es');f.records.set(key,'1\n00:00:08,000 --> 00:00:09,000\nHola\n');assert.equal((await readSavedTranslation(cues,{source:'en',target:'es',cache:f.cache})).raw,null);});
test('storage failure still returns a complete translation',async()=>{const f=fixture(),stages=[];const raw=await savedTranslation(cues,{source:'en',target:'es',api:f.api,cache:{get:async()=>{throw Error('Denied');},put:async()=>{throw Error('Quota');}},onProgress:p=>stages.push(p.stage)});assert.equal(parseSubtitles(raw)[0].text,'Hola');assert.ok(stages.includes('unsaved'));});
test('cancelled jobs never save partial output or return a cached result',async()=>{const f=fixture(),controller=new AbortController();await assert.rejects(savedTranslation(cues,{source:'en',target:'es',cache:f.cache,signal:controller.signal,api:{create:async()=>({translate:async()=>{controller.abort();return 'Hola';},destroy(){}})}}),{name:'AbortError'});assert.equal(f.records.size,0);await assert.rejects(readSavedTranslation(cues,{source:'en',target:'es',signal:controller.signal,cache:f.cache}),{name:'AbortError'});});
test('unavailable IndexedDB is an optional cache',async()=>{assert.equal(await translationCache.get('missing'),null);assert.equal(await translationCache.put('key','raw'),false);});
