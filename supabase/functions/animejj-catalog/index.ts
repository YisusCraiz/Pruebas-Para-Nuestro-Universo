const headers={'Access-Control-Allow-Origin':'https://yisuscraiz.github.io','Access-Control-Allow-Headers':'apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{headers,status});
const summary='id idMal title{romaji english native} coverImage{large} startDate{year} episodes format genres averageScore siteUrl';
const cache=new Map<string,{time:number,data:unknown}>();let minute=0,requests=0;
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'Método no permitido.'},405);
 if(req.headers.get('apikey')!=='sb_publishable_4DzMuO6nmtNRTh2qOUXu0Q_JIf-PF50')return reply({error:'Cliente no reconocido.'},401);
 try{
 const raw=await req.text();if(raw.length>1024)return reply({error:'Solicitud inválida.'},400);
 const {action,search='',page=1,id}=JSON.parse(raw);let query,variables;
 if(action==='search'){if(typeof search!=='string'||search.length>100||!Number.isInteger(page)||page<1||page>100)return reply({error:'Búsqueda inválida.'},400);query=`query($search:String,$page:Int){Page(page:$page,perPage:12){pageInfo{hasNextPage currentPage} media(type:ANIME,isAdult:false,search:$search,sort:POPULARITY_DESC){${summary}}}}`;variables={search:search.trim()||null,page};}
 else if(action==='details'&&Number.isInteger(id)&&id>0){query=`query($id:Int){Media(id:$id,type:ANIME){${summary} description(asHtml:false) streamingEpisodes{title url site} externalLinks{site url type language} relations{edges{relationType node{${summary} type}}}}}`;variables={id};}
 else return reply({error:'Acción inválida.'},400);
 const key=JSON.stringify({action,variables}),cached=cache.get(key);if(cached&&Date.now()-cached.time<300000)return reply(cached.data);
 const bucket=Math.floor(Date.now()/60000);if(bucket!==minute){minute=bucket;requests=0;}if(++requests>20)return reply({error:'El catálogo está ocupado. Espera un minuto.'},429);
 const res=await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json','User-Agent':'AnimeJJ/0.3 (private anime watch room)'},body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(10000)});
 if(!res.ok)return reply({error:'El catálogo externo no está disponible ahora.',upstreamStatus:res.status},res.status===429?429:503);
 const data=await res.json();if(data.errors?.length||!data.data)return reply({error:'No pudimos consultar el catálogo.'},503);
 if(cache.size>=30)cache.delete(cache.keys().next().value!);cache.set(key,{time:Date.now(),data});return reply(data);
 }catch{return reply({error:'No se pudo consultar el catálogo.'},503);}
});