import {parseSubtitles} from './subtitles.js?v=20261026-captions1';
const languages=['es','en'];
export class CaptionTracks {
 constructor(onChange=()=>{}){this.onChange=onChange;this.entries={};for(const lang of languages)this.entries[lang]={cues:[],status:'empty',kind:null,label:'',controller:null};}
 get(lang){if(!languages.includes(lang))throw Error('Idioma inválido.');return this.entries[lang];}
 clear(lang,status='empty'){const entry=this.get(lang);entry.controller?.abort();this.entries[lang]={cues:[],status,kind:null,label:'',controller:null};this.onChange();}
 reset(){for(const lang of languages)this.clear(lang);}
 async load(lang,read,{kind='remote',label=''}={}){this.get(lang).controller?.abort();const controller=new AbortController(),entry={cues:[],status:'loading',kind,label,controller};this.entries[lang]=entry;this.onChange();
  try{const raw=await read(controller.signal);if(controller.signal.aborted||this.entries[lang]!==entry)return false;if(typeof raw!=='string'||raw.length>5*1024*1024)throw Error('Archivo demasiado grande.');const cues=parseSubtitles(raw);if(!cues.length)throw Error('No hay subtítulos válidos.');entry.cues=cues;entry.status='ready';this.onChange();return true;}
  catch(error){if(controller.signal.aborted||this.entries[lang]!==entry)return false;entry.status='error';entry.error=error.message||'No se pudo cargar la pista.';this.onChange();return false;}
 }
}
const key='animejj.caption-preferences.v1';
export function captionPreferences(storage){try{const value=JSON.parse(storage.getItem(key)||'{}');return {mode:['both','es','en','off'].includes(value?.mode)?value.mode:'both',size:[80,100,120,140,160].includes(value?.size)?value.size:100};}catch{return {mode:'both',size:100};}}
export function saveCaptionPreferences(storage,value){try{storage.setItem(key,JSON.stringify({mode:['both','es','en','off'].includes(value.mode)?value.mode:'both',size:[80,100,120,140,160].includes(value.size)?value.size:100}));}catch{}}

// If a chosen language is missing, load the available original for translation.
export function captionLoadLanguages(mode,languages){const available=['es','en'].filter(lang=>languages.includes(lang));if(mode==='off')return [];if(mode==='both')return available;return available.includes(mode)?[mode]:available;}
