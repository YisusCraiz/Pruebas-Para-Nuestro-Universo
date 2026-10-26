import {parseStreamReference,streamReference,sourceSubtitleUrl} from './stream-api.js?v=20261026-captions1';
import {initBrowse} from './browse.js?v=20261026-captions1';
import {initRooms,canLoadSource} from './rooms.js?v=20261026-captions1';
import {activeText} from './subtitles.js?v=20261026-captions1';
import {CaptionTracks,captionPreferences,saveCaptionPreferences} from './caption-tracks.js?v=20261026-captions1';
import {MediaPlayer} from './player.js?v=20261026-captions1';
import {catalog,youtubeId,videoUrl} from './sources.js?v=20261026-captions1';
const $=id=>document.getElementById(id),video=new MediaPlayer($('video'),$('youtubeHost'));
const captions=new CaptionTracks(()=>{render();captionStatus();});
let preferenceStore;try{preferenceStore=window.localStorage;}catch{}
const preferences=captionPreferences(preferenceStore);$('mode').value=preferences.mode;$('captionSize').value=String(preferences.size);
function applyPreferences(){const size=Number($('captionSize').value);$('captions').style.fontSize=`clamp(${15*size/100}px,${2*size/100}vw,${25*size/100}px)`;saveCaptionPreferences(preferenceStore,{mode:$('mode').value,size});render();}
applyPreferences();
function message(text){$('message').textContent=text;}
function load(source,title){if(!canLoadSource(source)){message('Solo el anfitrión puede elegir el episodio. Los archivos locales se usan en solitario.');return false;}
 captions.reset();$('offset').value='0';for(const lang of ['es','en'])$(lang+'File').value=''; $('remoteSubtitles').hidden=true;$('chapterNavigation').hidden=true;
 const id=typeof source==='string'?youtubeId(source):null,item=catalog.find(item=>item.id===id);
 $('title').textContent=item?`${item.series} · ${item.episode}`:title;$('status').textContent=source?'Cargando…':'Sin episodio';message('');
 $('youtubeNote').hidden=!id;$('localSubtitles').hidden=!!id;
 void video.setSource(source);render();return true;
}
$('file').addEventListener('change',e=>{const file=e.target.files[0];if(file)load(file,file.name);});
$('urlForm').addEventListener('submit',e=>{e.preventDefault();try{const url=new URL($('url').value);if(url.protocol!=='https:')throw Error();load(url.href,'Video desde enlace');}catch{message('Introduce un enlace HTTPS de YouTube o un video directo.');}});
for(const lang of ['es','en'])$(lang+'File').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;if(file.size>5*1024*1024){message('El archivo debe pesar menos de 5 MB.');e.target.value='';return;}
 const ok=await captions.load(lang,()=>file.text(),{kind:'file',label:file.name});if(ok){$(lang+'Remote').value='';message(`${lang.toUpperCase()}: archivo cargado.`);}e.target.value='';});
function render(){const mode=$('mode').value,offset=Number($('offset').value)||0;for(const lang of ['es','en'])$(lang+'Line').textContent=mode==='both'||mode===lang?activeText(captions.get(lang).cues,video.currentTime-offset):'';}
function captionStatus(){let failed=false;for(const lang of ['es','en']){const entry=captions.get(lang),name=lang==='es'?'Español':'English';const text={empty:'Sin pista',unavailable:'Sin pista ofrecida',loading:'Cargando…',error:entry.error||'No se pudo cargar'}[entry.status]||`${entry.cues.length} líneas · ${entry.kind==='file'?'archivo propio':'fuente'}`;$(lang+'CaptionStatus').textContent=`${name}: ${text}`;if(entry.status==='error'&&entry.kind==='remote')failed=true;}
 $('retryCaptions').hidden=!failed;
}
video.addEventListener('timeupdate',render);video.addEventListener('seeked',render);$('mode').addEventListener('change',applyPreferences);$('captionSize').addEventListener('change',applyPreferences);$('offset').addEventListener('input',render);
for(const [id,delta] of [['captionEarlier',-.5],['captionLater',.5]])$(id).addEventListener('click',()=>{$('offset').value=String(Math.max(-120,Math.min(120,(Number($('offset').value)||0)+delta)));render();});$('captionReset').addEventListener('click',()=>{$('offset').value='0';render();});
$('captionSettings').addEventListener('click',()=>{$('playerOptions').open=!$('playerOptions').open;if($('playerOptions').open)$('playerOptions').scrollIntoView({behavior:'smooth',block:'nearest'});});
for(const [event,text] of Object.entries({loadedmetadata:'Listo para reproducir',playing:'Reproduciendo',pause:'En pausa',waiting:'Cargando video…',ended:'Episodio terminado'}))video.addEventListener(event,()=>{$('status').textContent=text;});
video.addEventListener('error',()=>{$('status').textContent='No se pudo reproducir';message(video.lastError||'El formato puede no ser compatible o el servidor puede bloquear el enlace.');});

video.addEventListener('providerloading',()=>{$('status').textContent='Preparando capítulo…';message('Consultando la fuente del episodio.');});
async function remoteSubtitle(lang){const ref=parseStreamReference(video.source),select=$(lang+'Remote');if(!video.providerInfo||!ref||select.value===''){captions.clear(lang);return;}
 const index=Number(select.value);await captions.load(lang,async signal=>{const controller=new AbortController(),abort=()=>controller.abort();signal.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,20000);try{const response=await fetch(sourceSubtitleUrl(ref,index),{signal:controller.signal});if(!response.ok){let error;try{error=(await response.json()).error;}catch{}throw Error(error||'La fuente no permite cargar esta pista. Usa un archivo propio.');}return await response.text();}catch(error){if(controller.signal.aborted&&!signal.aborted)throw Error('La pista tardó demasiado. Puedes reintentar.');throw error;}finally{clearTimeout(timer);signal.removeEventListener('abort',abort);}},{kind:'remote',label:select.selectedOptions[0]?.textContent||''});
}
$('retryCaptions').addEventListener('click',()=>{for(const lang of ['es','en']){const entry=captions.get(lang);if(entry.status==='error'&&entry.kind==='remote')void remoteSubtitle(lang);}});
video.addEventListener('providerready',()=>{const info=video.providerInfo,ref=parseStreamReference(video.source);if(!info||!ref)return;$('title').textContent=`${info.title} · Capítulo ${info.episode}`;message('');$('chapterNavigation').hidden=false;$('chapterLabel').textContent=`Capítulo ${info.episode}${info.totalEpisodes?' de '+info.totalEpisodes:''}`;const canChoose=canLoadSource(video.source);$('previousChapter').disabled=!canChoose||info.episode<=1;$('nextChapter').disabled=!canChoose||!!info.totalEpisodes&&info.episode>=info.totalEpisodes;
 const available=info.streams[0].subtitles||[];$('remoteSubtitles').hidden=false;for(const lang of ['es','en']){const list=available.filter(t=>String(t.language).toLowerCase().startsWith(lang)||lang==='es'&&/^(spanish|español)/i.test(t.label)||lang==='en'&&/^english/i.test(t.label)).sort((a,b)=>Number(/forced|signs|songs/i.test(a.label))-Number(/forced|signs|songs/i.test(b.label)));const select=$(lang+'Remote');select.replaceChildren(new Option('Sin pista',''),...list.map(t=>new Option(t.label,String(t.index))));select.value=list.length?String(list[0].index):'';select.disabled=!list.length;if(list.length)void remoteSubtitle(lang);else captions.clear(lang,'unavailable');}$('sourceSubtitleStatus').textContent='Las pistas dependen de la fuente. Si fallan, puedes cargar un archivo propio debajo.';
});
for(const lang of ['es','en'])$(lang+'Remote').addEventListener('change',()=>void remoteSubtitle(lang));
for(const [id,offset] of [['previousChapter',-1],['nextChapter',1]])$(id).addEventListener('click',()=>{const ref=parseStreamReference(video.source),info=video.providerInfo;if(ref&&info)load(streamReference(ref.animeId,ref.episode+offset),`${info.title} · Capítulo ${ref.episode+offset}`);});
video.addEventListener('autoplayblocked',()=>message('Pulsa reproducir dentro de YouTube para permitir el audio.'));
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('stage').requestFullscreen)await $('stage').requestFullscreen();else message('Gira tu celular para ampliar el reproductor.');}catch{message('No se pudo activar la pantalla completa.');}});
function updateStreamOptions(){const quality=video.qualityOptions(),audio=video.audioOptions();$('streamOptions').hidden=!quality.length&&!audio.length;$('quality').replaceChildren(new Option('Automática','-1'),...quality.map(option=>new Option(option.label,String(option.value))));$('audioTrack').replaceChildren(...audio.map(option=>new Option(option.label,String(option.value))));$('audioTrackLabel').hidden=!audio.length;}
video.addEventListener('trackschange',updateStreamOptions);$('quality').addEventListener('change',()=>video.setQuality(Number($('quality').value)));$('audioTrack').addEventListener('change',()=>video.setAudio(Number($('audioTrack').value)));
initBrowse({load,video});
void initRooms({video,load,source:()=>video.source});

window.addEventListener('beforeunload',()=>video.dispose());
