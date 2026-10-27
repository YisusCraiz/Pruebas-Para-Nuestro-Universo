// Store completed subtitles only. The digest includes every original cue and time.
export const TRANSLATION_REVISION='opus-mt-q8-20261026-v1';
const MAX_BYTES=20*1024*1024,MAX_ENTRIES=40;
export async function translationKey(cues,source,target){
 if(!globalThis.crypto?.subtle)return null;
 const bytes=new TextEncoder().encode(JSON.stringify([TRANSLATION_REVISION,source,target,cues.map(({start,end,text})=>[start,end,text])]));
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
}
function openDatabase(){return new Promise((resolve,reject)=>{
 if(!globalThis.indexedDB){reject(Error('Storage unavailable'));return;}
 const request=indexedDB.open('animejj-translations',1);let expired=false;
 const timer=setTimeout(()=>{expired=true;reject(Error('Storage timeout'));},2000);
 request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('tracks'))request.result.createObjectStore('tracks',{keyPath:'key'});};
 request.onsuccess=()=>{clearTimeout(timer);if(expired)request.result.close();else resolve(request.result);};
 request.onerror=()=>{clearTimeout(timer);reject(request.error);};request.onblocked=()=>{clearTimeout(timer);expired=true;reject(Error('Storage blocked'));};
 });}
async function transaction(mode,operation){let db;try{db=await openDatabase();return await new Promise((resolve,reject)=>{const tx=db.transaction('tracks',mode);let result;const timer=setTimeout(()=>{try{tx.abort();}catch{}reject(Error('Storage timeout'));},3000);tx.oncomplete=()=>{clearTimeout(timer);resolve(result);};tx.onabort=tx.onerror=()=>{clearTimeout(timer);reject(tx.error||Error('Storage failed'));};operation(tx.objectStore('tracks'),value=>{result=value;});});}finally{db?.close();}}
export const translationCache={
 async get(key){if(!key)return null;try{return await transaction('readonly',(store,done)=>{const request=store.get(key);request.onsuccess=()=>done(request.result?.raw||null);});}catch{return null;}},
 async put(key,raw){if(!key||typeof raw!=='string')return false;const bytes=new TextEncoder().encode(raw).byteLength;if(bytes>MAX_BYTES)return false;try{return await transaction('readwrite',(store,done)=>{const request=store.getAll();request.onsuccess=()=>{const rows=request.result.filter(row=>row.key!==key).sort((a,b)=>b.savedAt-a.savedAt);let size=bytes,count=1;for(const row of rows){if(count>=MAX_ENTRIES||size+row.bytes>MAX_BYTES)store.delete(row.key);else{size+=row.bytes;count++;}}store.put({key,raw,bytes,savedAt:Date.now()});done(true);};});}catch{return false;}}
};
