const KEY='animejj-watch-library-v1';
export function createLibrary(storage){
 function read(){try{const d=JSON.parse(storage.getItem(KEY)||'{}');return {saved:Array.isArray(d.saved)?d.saved.slice(0,30):[],progress:Array.isArray(d.progress)?d.progress.slice(0,12):[]};}catch{return {saved:[],progress:[]};}}
 function write(data){try{storage.setItem(KEY,JSON.stringify(data));return true;}catch{return false;}}
 return {
 saved:()=>read().saved,
 toggle(item){const d=read(),index=d.saved.findIndex(x=>x.key===item.key);if(index>=0)d.saved.splice(index,1);else d.saved.unshift({key:item.key,id:item.id,provider:item.provider,title:item.title,cover:item.cover,year:item.year,episodes:item.episodes});return {saved:index<0,persisted:write(d)};},
 has:key=>read().saved.some(x=>x.key===key),
 progress:()=>read().progress,
 record({source,title,position,duration}){if(!source?.startsWith('https:')||!Number.isFinite(position)||position<0)return false;const d=read();d.progress=d.progress.filter(x=>x.source!==source);d.progress.unshift({source,title,position,duration:Number.isFinite(duration)?duration:null,updatedAt:Date.now()});d.progress=d.progress.slice(0,12);return write(d);}
 };
}
