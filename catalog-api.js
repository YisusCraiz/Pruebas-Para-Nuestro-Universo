import {catalogSearchTerm,catalogCountries} from './catalog-search.js?v=20261026-donghua1';
const API='https://suvcdkqqwrodwxgmcjej.supabase.co/functions/v1/animejj-catalog';
const cache=new Map();
let cooldown=0;
export function plainText(value){return String(value||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();}
export function httpsUrl(value){try{const url=new URL(value);return url.protocol==='https:'?url.href:null;}catch{return null;}}
export function normalizeMedia(raw){
 if(!raw||!Number.isInteger(raw.id))throw Error('La ficha recibida no es válida.');
 return {key:`anilist:${raw.id}`,provider:'anilist',id:raw.id,malId:raw.idMal||null,title:raw.title?.english||raw.title?.romaji||raw.title?.native||'Sin título',titles:Object.values(raw.title||{}).filter(Boolean),cover:httpsUrl(raw.coverImage?.large),year:raw.startDate?.year||null,episodes:raw.episodes||null,format:raw.format||'',country:raw.countryOfOrigin||null,genres:raw.genres||[],score:raw.averageScore||null,description:plainText(raw.description),pageUrl:httpsUrl(raw.siteUrl),
 streaming:(raw.streamingEpisodes||[]).map(e=>({title:e.title||'Episodio',url:httpsUrl(e.url),site:e.site||'Plataforma externa'})).filter(e=>e.url),
 links:(raw.externalLinks||[]).filter(e=>e.type==='STREAMING').map(e=>({site:e.site||'Plataforma',url:httpsUrl(e.url),language:e.language||null})).filter(e=>e.url),
 relations:(raw.relations?.edges||[]).filter(e=>e.node?.type==='ANIME').map(e=>({...normalizeMedia(e.node),relation:e.relationType}))};
}
async function query(action,variables,signal){
 const key=JSON.stringify({action,variables});const entry=cache.get(key);if(entry&&Date.now()-entry.time<300000)return entry.data;
 if(Date.now()<cooldown)throw Error('El catálogo está recibiendo muchas consultas. Espera un momento y vuelve a buscar.');
 const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)controller.abort();const timer=setTimeout(abort,12000);
 try{const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',apikey:'sb_publishable_4DzMuO6nmtNRTh2qOUXu0Q_JIf-PF50'},body:JSON.stringify({action,...variables}),signal:controller.signal});
 if(response.status===429){cooldown=Date.now()+Math.max(1,Number(response.headers.get('Retry-After'))||60)*1000;throw Error('El catálogo pidió una pausa. Vuelve a intentarlo en un minuto.');}
 if(!response.ok)throw Error('El catálogo externo no está disponible ahora. Los episodios de prueba siguen disponibles.');
 const result=await response.json();if(result.errors?.length||!result.data)throw Error('No pudimos obtener la información del catálogo.');
 if(cache.size>=30)cache.delete(cache.keys().next().value);cache.set(key,{time:Date.now(),data:result.data});return result.data;
 }catch(error){if(signal?.aborted)throw new DOMException('Cancelado','AbortError');if(controller.signal.aborted)throw Error('El catálogo tardó demasiado. Puedes intentar de nuevo.');if(error instanceof TypeError)throw Error('No se pudo conectar con el catálogo. Los episodios de prueba siguen disponibles.');throw error;}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
export async function searchAnime(search='',page=1,signal,category='all'){if(!Object.hasOwn(catalogCountries,category))throw Error('Filtro inválido.');const term=catalogSearchTerm(search);const data=await query('search',{search:term,page,category},signal);return {items:data.Page.media.map(normalizeMedia),hasNext:!!data.Page.pageInfo.hasNextPage};}
export async function animeDetails(id,signal){if(!Number.isInteger(id)||id<=0)throw Error('Identificador de anime inválido.');const data=await query('details',{id},signal);return normalizeMedia(data.Media);}

export function posterUrl(value){try{const url=new URL(value);if(url.protocol!=='https:'||url.hostname!=='s4.anilist.co'||!/^\/file\/anilistcdn\/media\/anime\/cover\/(?:small|medium|large)\/[a-zA-Z0-9_.-]+\.(?:jpg|jpeg|png|webp)$/.test(url.pathname))return null;const target=new URL(API);target.searchParams.set('cover',url.pathname);target.searchParams.set('key','sb_publishable_4DzMuO6nmtNRTh2qOUXu0Q_JIf-PF50');return target.href;}catch{return null;}}
