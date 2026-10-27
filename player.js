import {DailymotionPlayer,dailymotionReference} from './dailymotion-player.js?v=20261027-sources3';
import {parseStreamReference,resolveEpisode} from './stream-api.js?v=20261027-sources3';
import {youtubeId,isHlsUrl} from './sources.js?v=20261026-streams1';
let youtubeAPI;
async function hlsClass(){if(window.Hls)return window.Hls;return (await import('https://cdn.jsdelivr.net/npm/hls.js@1.6.13/dist/hls.mjs')).default;}
function getAPI(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(!youtubeAPI)youtubeAPI=new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{youtubeAPI=null;reject(Error('No se pudo cargar YouTube. Revisa tu conexión.'));},15000);const previous=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{clearTimeout(timeout);previous?.();resolve(window.YT);};const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>{clearTimeout(timeout);youtubeAPI=null;reject(Error('Tu navegador bloqueó YouTube.'));};document.head.append(script);});return youtubeAPI;
}
export class MediaPlayer extends EventTarget {
 constructor(native,container,options={}){super();this.native=native;this.container=container;this.kind='direct';this.generation=0;this.ready=false;this.loading=false;this.objectURL=null;this.source='';this.dm=null;this.yt=null;this.apiReady=null;this.lastTick=0;this.playAttempt=null;this.hls=null;this.resolveSource=options.resolveSource||resolveEpisode;this.providerInfo=null;this.sourceController=null;
 for(const name of ['play','playing','pause','timeupdate','seeked','loadedmetadata','canplay','waiting','ended','error'])native.addEventListener(name,()=>{if(this.kind==='direct'&&this.source){if(name==='loadedmetadata')this.loading=false;this.emit(name);}});
 this.ticker=setInterval(()=>{if(this.kind==='youtube'&&this.ready){const time=this.currentTime;if(Math.abs(time-this.lastTick)>1.8)this.emit('seeked');this.lastTick=time;this.emit('timeupdate');}},500);
 }
 dispose(){this.sourceController?.abort();this.dm?.destroy();this.hls?.destroy();clearInterval(this.ticker);this.pause();this.yt?.destroy?.();if(this.objectURL)URL.revokeObjectURL(this.objectURL);}
 emit(name){this.dispatchEvent(new Event(name));}
 qualityOptions(){return this.hls?.levels?.map((level,index)=>({value:index,label:level.height?`${level.height}p`:`Calidad ${index+1}`}))||[];}
 audioOptions(){return this.hls?.audioTracks?.map((track,index)=>({value:index,label:track.name||track.lang||`Audio ${index+1}`}))||[];}
 setQuality(index){if(this.hls)this.hls.currentLevel=index;}
 setAudio(index){if(this.hls)this.hls.audioTrack=index;}
 get isYouTube(){return this.kind==='youtube';}
 get currentTime(){if(this.kind==='dailymotion')return this.dm?.currentTime||0;return this.isYouTube?(this.ready?this.yt.getCurrentTime():0):this.native.currentTime;}
 set currentTime(value){if(this.kind==='dailymotion'){this.dm?.seek(value);return;}if(this.isYouTube){if(this.ready){this.lastTick=value;this.yt.seekTo(value,true);}}else this.native.currentTime=value;}
 get duration(){if(this.kind==='dailymotion')return this.dm?.duration||Infinity;return this.isYouTube?(this.ready?this.yt.getDuration()||Infinity:Infinity):this.native.duration;}
 get readyState(){if(this.kind==='dailymotion')return this.dm?.readyState||0;if(this.loading)return 0;return this.isYouTube?(this.ready?1:0):this.native.readyState;}
 get paused(){if(this.kind==='dailymotion')return this.dm?.paused??true;return this.isYouTube?(!this.ready||this.yt.getPlayerState()!==1):this.native.paused;}
 get ended(){if(this.kind==='dailymotion')return this.dm?.ended||false;return this.isYouTube?(this.ready&&this.yt.getPlayerState()===0):this.native.ended;}
 set controls(value){this.native.controls=value;}
 get controls(){return this.native.controls;}
 pause(){this.dm?.pause();this.native.pause();if(this.yt&&this.apiReady)this.yt.pauseVideo?.();}
 async play(){if(this.kind==='dailymotion')return this.dm.play();if(!this.isYouTube)return this.native.play();if(!this.ready)throw Error('Espera a que cargue el episodio.');this.yt.playVideo();await new Promise((resolve,reject)=>{const id=setTimeout(()=>reject(Error('Pulsa reproducir en YouTube para activar el audio.')),1800);this.playAttempt=()=>{clearTimeout(id);resolve();};if(this.yt.getPlayerState()===1)this.playAttempt();});}
 async setSource(source){const generation=++this.generation;this.dm?.destroy();this.dm=null;this.sourceController?.abort();this.sourceController=new AbortController();this.providerInfo=null;this.loading=true;this.pause();this.ready=false;this.hls?.destroy();this.hls=null;this.lastError='';this.source=source instanceof File?'':source;if(this.objectURL){URL.revokeObjectURL(this.objectURL);this.objectURL=null;}
 const ref=typeof source==='string'?parseStreamReference(source):null;
 if(ref){this.kind='direct';this.native.hidden=false;this.container.hidden=true;this.native.removeAttribute('src');this.native.load();document.getElementById('captions').hidden=false;this.emit('providerloading');try{const info=await this.resolveSource(ref,this.sourceController.signal);if(generation!==this.generation)return;this.providerInfo=info;source=info.streams[0].url;this.emit('providerready');}catch(error){if(generation===this.generation&&error.name!=='AbortError'){this.lastError=error.message;this.emit('error');}return;}}
 const dmRef=typeof source==='string'?dailymotionReference(source):null;if(dmRef){this.kind='dailymotion';this.native.hidden=true;this.container.hidden=false;this.native.removeAttribute('src');this.native.load();document.getElementById('captions').hidden=false;const choices=(this.providerInfo?.streams||[{url:source}]).filter(item=>dailymotionReference(item.url));let index=0;
 const attempt=async()=>{if(generation!==this.generation)return;this.dm?.destroy();const dm=new DailymotionPlayer(this.container);this.dm=dm;let failed=false;for(const name of ['play','playing','pause','timeupdate','seeked','loadedmetadata','canplay','waiting','ended','autoplayblocked','error'])dm.addEventListener(name,()=>{if(this.dm!==dm||generation!==this.generation||failed)return;if(name==='error'){failed=true;if(/no longer available|not found|deleted|removed/i.test(dm.error)&&index+1<choices.length){index++;this.emit('waiting');void attempt();return;}this.lastError=dm.error;}this.emit(name);});try{await dm.load(dailymotionReference(choices[index].url));}catch(error){if(generation===this.generation){this.lastError=error.message;this.emit('error');}}};await attempt();return;}
 const id=typeof source==='string'?youtubeId(source):null;this.kind=id?'youtube':'direct';this.native.hidden=!!id;this.container.hidden=!id;document.getElementById('captions').hidden=!!id;this.emit('trackschange');
 if(!id){this.native.removeAttribute('src');
 if(typeof source==='string'&&isHlsUrl(source)&&!this.native.canPlayType?.('application/vnd.apple.mpegurl')){
  this.native.load();try{const Hls=await hlsClass();if(generation!==this.generation)return;if(!Hls.isSupported())throw Error('Este navegador no puede reproducir HLS.');const hls=new Hls({enableWorker:true,maxBufferLength:30});this.hls=hls;hls.on(Hls.Events.ERROR,(_event,data)=>{if(data.fatal&&this.hls===hls){this.lastError='No se pudo cargar el stream HLS. El servidor puede estar caído o no permitir reproducción desde esta página.';this.emit('error');}});hls.loadSource(source);hls.attachMedia(this.native);this.emit('trackschange');hls.on(Hls.Events.MANIFEST_PARSED,()=>this.emit('trackschange'));hls.on(Hls.Events.AUDIO_TRACKS_UPDATED,()=>this.emit('trackschange'));}catch(error){if(generation===this.generation){this.lastError=error.message;this.emit('error');}}return;
 }
 if(source instanceof File){this.objectURL=URL.createObjectURL(source);this.native.src=this.objectURL;this.source=this.objectURL;}else if(source)this.native.src=source;this.native.load();this.emit('trackschange');return;}
 this.native.removeAttribute('src');this.native.load();
 try{const YT=await getAPI();if(generation!==this.generation)return;
 if(!this.yt){this.apiReady=new Promise(resolve=>{const host=document.createElement('div');this.container.replaceChildren(host);this.yt=new YT.Player(host,{width:'100%',height:'100%',host:'https://www.youtube-nocookie.com',playerVars:{origin:location.origin,playsinline:1,rel:0},events:{onReady:()=>resolve(),onStateChange:event=>{if(!this.isYouTube)return;if(event.data===5){this.loading=false;this.ready=true;this.emit('loadedmetadata');}if(event.data===1){this.loading=false;this.ready=true;this.playAttempt?.();this.playAttempt=null;this.emit('play');this.emit('playing');}if(event.data===2)this.emit('pause');if(event.data===3)this.emit('waiting');if(event.data===0)this.emit('ended');},onAutoplayBlocked:()=>this.emit('autoplayblocked'),onError:event=>{if(!this.isYouTube)return;this.lastError=[101,150].includes(event.data)?'El canal no permite insertar este video. Prueba otro episodio.':event.data===100?'El episodio no está disponible. Prueba otro.':event.data===153?'YouTube no pudo verificar la página. Abre AnimeJJ desde su enlace de GitHub Pages.':'YouTube no pudo reproducir este episodio. Puede existir una restricción regional.';this.emit('error');}}});});}
 await this.apiReady;if(generation!==this.generation)return;this.yt.cueVideoById(id);this.lastTick=0;
 }catch(error){if(generation===this.generation){this.lastError=error.message;this.emit('error');}}
 }
}
