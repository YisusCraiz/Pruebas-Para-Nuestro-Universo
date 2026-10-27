// Parse data literals only. Never execute scripts supplied by an upstream page.
export function decodeJSString(raw){return raw.replace(/\\(?:u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|([\s\S]))/g,(_all,unicode,hex,char)=>unicode?String.fromCharCode(parseInt(unicode,16)):hex?String.fromCharCode(parseInt(hex,16)):({n:'\n',r:'\r',t:'\t',b:'\b',f:'\f',v:'\v','0':'\0'}[char]??char));}
export function embeddedJSON(html,name){const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const start=name==='vidstackPlayer'?`${escaped}\\s*\\(\\s*JSON\\.parse\\('`:`${escaped}\\s*:\\s*JSON\\.parse\\('`;const match=String(html).match(new RegExp(start+"((?:[^'\\\\]|\\\\.)*)'\\)",'i'));if(!match)return null;try{return JSON.parse(decodeJSString(match[1]));}catch{return null;}}
export function normalizeTitle(value){return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');}
export function selectAniZone(items,media){const names=new Set([...Object.values(media.title||{}),...(media.synonyms||[])].filter(Boolean).map(normalizeTitle).filter(Boolean));const year=media.startDate?.year;const format={TV:'tv',TV_SHORT:'tv',ONA:'ona',MOVIE:'movie',SPECIAL:'special',OVA:'ova'}[media.format];const candidates=(Array.isArray(items)?items:[]).filter(item=>{
 const slug=String(item.slug||'');if(!/^[a-z0-9-]+$/i.test(slug))return false;
 const titles=[item.main_title,...Object.values(item.title_list||{})];if(!titles.some(t=>normalizeTitle(t)&&names.has(normalizeTitle(t))))return false;
 if(year&&Number(item.start_year)!==year)return false;
 const type=String(item.type||'').toLowerCase();if(format&&type&&!type.includes(format)&&!(format==='ona'&&type.includes('web')))return false;
 if(media.status==='FINISHED'&&media.episodes&&Number(item.episode_count)!==media.episodes)return false;
 return true;
 });return candidates.length===1?candidates[0]:null;}

export function parseEpisodeItems(items){return (Array.isArray(items)?items:[]).map(item=>({number:Number(item.slug),title:item.title_list?.['1']||Object.values(item.title_list||{})[0]||`Episodio ${item.slug}`,available:Number(item.videos_count)>0})).filter(item=>Number.isInteger(item.number)&&item.number>0&&item.available).sort((a,b)=>a.number-b.number);}
export function htmlEntities(value){return String(value||'').replace(/&quot;/g,'"').replace(/&#039;|&#39;|&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');}

export function providerSearchTitles(media){return [...new Set([media.title?.romaji,media.title?.english,...(media.synonyms||[])].filter(title=>typeof title==='string'&&title.trim().length>1&&title.length<=100))].slice(0,4);}
