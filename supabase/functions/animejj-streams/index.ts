import {embeddedJSON,selectAniZone,parseEpisodeItems,htmlEntities} from './provider-parsers.js';
const KEY='sb_publishable_4DzMuO6nmtNRTh2qOUXu0Q_JIf-PF50';
const SITE='https://anizone.to';
const cors={'Access-Control-Allow-Origin':'https://yisuscraiz.github.io','Access-Control-Allow-Headers':'apikey,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{headers:cors,status});
const infoCache=new Map<number,any>(),watchCache=new Map<string,any>(),pending=new Map<string,Promise<any>>();let minute=0,calls=0;
function limited(){const now=Math.floor(Date.now()/60000);if(now!==minute){minute=now;calls=0;}return ++calls>40;}
function safeURL(value:unknown){try{const url=new URL(String(value));return url.protocol==='https:'?url.href:null;}catch{return null;}}
async function request(url:string,options:RequestInit={}){const res=await fetch(url,{...options,headers:{Accept:'application/json,text/html','User-Agent':'AnimeJJ/0.4 (private watch app)',...options.headers},signal:AbortSignal.timeout(12000),redirect:'error'});if(!res.ok)throw Error('La fuente no está disponible en este momento.');return res;}
async function textPage(url:string,options:RequestInit={}){const res=await request(url,options),text=await res.text();if(text.length>3000000)throw Error('La fuente devolvió una respuesta demasiado grande.');if(/cf-chl|verify you are human|checking your browser/i.test(text))throw Error('La fuente solicita una verificación que AnimeJJ no puede completar.');return {res,text};}
function trimCache(map:Map<any,any>){if(map.size>=25)map.delete(map.keys().next().value);}
function cookies(res:Response){const values=typeof res.headers.getSetCookie==='function'?res.headers.getSetCookie():[res.headers.get('set-cookie')||''];return values.map(v=>v.split(';')[0]).filter(Boolean).join('; ');}
function pageState(html:string,cookie:string){const snapshots=[...html.matchAll(/wire:snapshot="([^"]*)"/gi)];const snapshot=snapshots.find(x=>x[1].includes('pages.anime-detail'))?.[1]||snapshots.find(x=>htmlEntities(x[1]).includes('anime-detail'))?.[1]||'';const csrf=html.match(/<meta[^>]*name="csrf-token"[^>]*content="([^"]+)"/i)?.[1]||'';return {snapshot:htmlEntities(snapshot),csrf,cookie,cursor:html.match(/nextCursor:\s*'([^']+)'/)?.[1]||null,hasMore:/hasMore:\s*true/.test(html)};}
async function getInfo(id:number){const cached=infoCache.get(id);if(cached&&Date.now()-cached.time<180000)return cached;if(pending.has('info:'+id))return pending.get('info:'+id);const promise=(async()=>{
 const res=await request('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'query($id:Int){Media(id:$id,type:ANIME){id title{romaji english native} startDate{year} format status episodes}}',variables:{id}})});const data=await res.json(),media=data.data?.Media;if(!media)throw Error('No pudimos identificar esta serie.');
 let selected:any=null;
 for(const title of [...new Set([media.title.romaji,media.title.english].filter(Boolean))]){const page=await textPage(SITE+'/anime?search='+encodeURIComponent(title as string));const candidates=embeddedJSON(page.text,'items');selected=selectAniZone(candidates,media);if(selected)break;}
 if(!selected)throw Error('No encontramos una coincidencia segura para esta temporada en la fuente.');
 const detail=await textPage(SITE+'/anime/'+selected.slug);const rows=embeddedJSON(detail.text,'items');const episodes=parseEpisodeItems(rows);if(!episodes.length)throw Error('La fuente no tiene episodios disponibles para esta temporada.');
 const info={time:Date.now(),media,slug:selected.slug,pages:[episodes],state:pageState(detail.text,cookies(detail.res))};trimCache(infoCache);infoCache.set(id,info);return info;
 })().finally(()=>pending.delete('info:'+id));pending.set('info:'+id,promise);return promise;}
async function episodes(id:number,page:number){const info=await getInfo(id);while(info.pages.length<page&&info.state.hasMore){const key='page:'+id;if(pending.has(key)){await pending.get(key);continue;}
 const promise=(async()=>{const state=info.state;if(!state.snapshot||!state.cursor||!state.csrf){state.hasMore=false;return;}const {res,text}=await textPage(SITE+'/livewire/update',{method:'POST',headers:{'Content-Type':'application/json','X-Livewire':'','X-CSRF-TOKEN':state.csrf,'X-Requested-With':'XMLHttpRequest',Cookie:state.cookie,Origin:SITE,Referer:SITE+'/anime/'+info.slug},body:JSON.stringify({components:[{snapshot:state.snapshot,updates:{},calls:[{path:'',method:'loadPage',params:[state.cursor]}]}]})});const data=JSON.parse(text),component=data.components?.[0],dispatch=component?.effects?.dispatches?.find((item:any)=>item.name==='items-loaded');if(!dispatch?.params?.items){state.hasMore=false;return;}const next=parseEpisodeItems(dispatch.params.items);info.pages.push(next);info.state={...state,snapshot:component.snapshot||state.snapshot,cursor:dispatch.params.nextCursor||null,hasMore:!!dispatch.params.hasMore,cookie:cookies(res)||state.cookie};})().finally(()=>pending.delete(key));pending.set(key,promise);await promise;}
 return {provider:'anizone',animeId:id,title:info.media.title.english||info.media.title.romaji,episodes:info.pages[page-1]||[],page,hasMore:page<info.pages.length||info.state.hasMore};}
async function watch(id:number,episode:number){const key=id+':'+episode,cached=watchCache.get(key);if(cached&&Date.now()-cached.time<60000)return cached.data;if(pending.has('watch:'+key))return pending.get('watch:'+key);
 const promise=(async()=>{const info=await getInfo(id);if(info.media.status==='FINISHED'&&info.media.episodes&&episode>info.media.episodes)throw Error('Ese episodio no pertenece a esta temporada.');const {text}=await textPage(SITE+'/anime/'+info.slug+'/'+episode);const data=embeddedJSON(text,'vidstackPlayer'),url=safeURL(data?.src);if(!url)throw Error('La fuente no entregó un video compatible para este episodio.');const tracks=(data.subtitles||[]).map((t:any,index:number)=>({index,url:safeURL(t.file),label:String(t.title||t.language||'Subtítulos'),language:String(t.language||'und'),format:String(t.format||'ass')})).filter((t:any)=>t.url);
 const result={provider:'anizone',animeId:id,episode,title:info.media.title.english||info.media.title.romaji,totalEpisodes:info.media.episodes||null,streams:[{url,type:'hls',subtitles:tracks}]};trimCache(watchCache);watchCache.set(key,{time:Date.now(),data:result});return result;})().finally(()=>pending.delete('watch:'+key));pending.set('watch:'+key,promise);return promise;}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 const url=new URL(req.url),key=req.method==='GET'?url.searchParams.get('key'):req.headers.get('apikey');if(key!==KEY)return reply({error:'Cliente no reconocido.'},401);
 if(!['GET','POST'].includes(req.method))return reply({error:'Método no permitido.'},405);
 if(limited())return reply({error:'Espera un minuto antes de consultar más episodios.'},429);
 try{
 if(req.method==='GET'){
  const id=Number(url.searchParams.get('animeId')),ep=Number(url.searchParams.get('episode')),index=Number(url.searchParams.get('track'));
  if(!Number.isInteger(id)||id<1||id>9999999||!Number.isInteger(ep)||ep<1||ep>100000||!Number.isInteger(index)||index<0||index>200)return reply({error:'Subtítulo inválido.'},400);
  const result=await watch(id,ep),track=result.streams[0].subtitles.find((t:any)=>t.index===index);if(!track)return reply({error:'Pista no disponible.'},404);
  const upstream=new URL(track.url);if(upstream.protocol!=='https:'||upstream.port||!(/^[a-z0-9-]+\.vid-cdn\.xyz$/i.test(upstream.hostname)))return reply({error:'La pista no admite carga integrada.'},422);
  const res=await fetch(upstream.href,{signal:AbortSignal.timeout(12000),redirect:'error'});if(!res.ok){console.warn('subtitle upstream status',res.status);throw Error('La fuente no permite cargar esta pista ahora.');}if(Number(res.headers.get('content-length'))>2000000)return reply({error:'Pista demasiado grande.'},413);const text=await res.text();if(text.length>2000000)return reply({error:'Pista demasiado grande.'},413);
  return new Response(text,{headers:{...cors,'Content-Type':'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=60'}});
 }
 const text=await req.text();if(text.length>512)return reply({error:'Solicitud inválida.'},400);const {action,animeId,episode,page=1}=JSON.parse(text);if(!Number.isInteger(animeId)||animeId<1||animeId>9999999)return reply({error:'Anime inválido.'},400);
 if(action==='episodes'&&Number.isInteger(page)&&page>=1&&page<=30)return reply(await episodes(animeId,page));
 if(action==='watch'&&Number.isInteger(episode)&&episode>=1&&episode<=100000)return reply(await watch(animeId,episode));
 return reply({error:'Acción inválida.'},400);
 }catch(error){return reply({error:error instanceof Error?error.message:'No pudimos consultar la fuente.',provider:'anizone'},503);}
});
