import {parseStreamReference,streamReference,sourceSubtitleUrl} from './stream-api.js?v=20261026-streams1';
import {initBrowse} from './browse.js?v=20261026-streams1';
import {initRooms,canLoadSource} from './rooms.js?v=20261026-streams1';
import {parseSubtitles,activeText} from './subtitles.js';
import {MediaPlayer} from './player.js?v=20261026-streams1';
import {catalog,youtubeId,videoUrl} from './sources.js?v=20261026-streams1';
const $=id=>document.getElementById(id),video=new MediaPlayer($('video'),$('youtubeHost'));
const tracks={es:[],en:[]};let subtitleGeneration=0;const subtitleRequests={es:null,en:null};
function message(text){$('message').textContent=text;}
function load(source,title){if(!canLoadSource(source)){message('Solo el anfitrión puede elegir el episodio. Los archivos locales se usan en solitario.');return false;}
 subtitleGeneration++;for(const lang of ['es','en']){subtitleRequests[lang]?.abort();tracks[lang]=[];} $('remoteSubtitles').hidden=true;$('chapterNavigation').hidden=true;
 const id=typeof source==='string'?youtubeId(source):null,item=catalog.find(item=>item.id===id);
 $('title').textContent=item?`${item.series} · ${item.episode}`:title;$('status').textContent=source?'Cargando…':'Sin episodio';message('');
 $('youtubeNote').hidden=!id;$('localSubtitles').hidden=!!id;
 void video.setSource(source);render();return true;
}
$('file').addEventListener('change',e=>{const file=e.target.files[0];if(file)load(file,file.name);});
$('urlForm').addEventListener('submit',e=>{e.preventDefault();try{const url=new URL($('url').value);if(url.protocol!=='https:')throw Error();load(url.href,'Video desde enlace');}catch{message('Introduce un enlace HTTPS de YouTube o un video directo.');}});
for(const lang of ['es','en'])$(lang+'File').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw Error('El archivo debe pesar menos de 5 MB.');const cues=parseSubtitles(await file.text());if(!cues.length)throw Error('Usa un archivo SRT o VTT válido.');tracks[lang]=cues;message(`${lang.toUpperCase()}: ${cues.length} entradas cargadas.`);render();}catch(error){message(error.message);}});
function render(){const mode=$('mode').value,offset=Number($('offset').value)||0;for(const lang of ['es','en'])$(lang+'Line').textContent=mode==='both'||mode===lang?activeText(tracks[lang],video.currentTime-offset):'';}
video.addEventListener('timeupdate',render);video.addEventListener('seeked',render);$('mode').addEventListener('change',render);$('offset').addEventListener('input',render);
for(const [event,text] of Object.entries({loadedmetadata:'Listo para reproducir',playing:'Reproduciendo',pause:'En pausa',waiting:'Cargando video…',ended:'Episodio terminado'}))video.addEventListener(event,()=>{$('status').textContent=text;});
video.addEventListener('error',()=>{$('status').textContent='No se pudo reproducir';message(video.lastError||'El formato puede no ser compatible o el servidor puede bloquear el enlace.');});

video.addEventListener('providerloading',()=>{$('status').textContent='Preparando capítulo…';message('Consultando la fuente del episodio.');});
async function remoteSubtitle(lang){const info=video.providerInfo,ref=parseStreamReference(video.source),select=$(lang+'Remote');subtitleRequests[lang]?.abort();tracks[lang]=[];render();if(!info||!ref||select.value==='')return;const generation=subtitleGeneration,controller=new AbortController();let timedOut=false;subtitleRequests[lang]=controller;const timeout=setTimeout(()=>{timedOut=true;controller.abort();},25000);try{const response=await fetch(sourceSubtitleUrl(ref,Number(select.value)),{signal:controller.signal});if(!response.ok)throw Error();const raw=await response.text();if(controller.signal.aborted||generation!==subtitleGeneration)return;const cues=parseSubtitles(raw);if(!cues.length)throw Error();tracks[lang]=cues;render();$('sourceSubtitleStatus').textContent=[tracks.es.length?'Español listo':'',tracks.en.length?'English ready':''].filter(Boolean).join(' · ');}catch(error){if((!controller.signal.aborted||timedOut)&&generation===subtitleGeneration)$('sourceSubtitleStatus').textContent=`No pudimos cargar ${lang==='es'?'español':'inglés'}. Puedes elegir otra pista o cargar un archivo.`;}finally{clearTimeout(timeout);}}
video.addEventListener('providerready',()=>{const info=video.providerInfo,ref=parseStreamReference(video.source);if(!info||!ref)return;$('title').textContent=`${info.title} · Capítulo ${info.episode}`;message('');$('chapterNavigation').hidden=false;$('chapterLabel').textContent=`Capítulo ${info.episode}${info.totalEpisodes?' de '+info.totalEpisodes:''}`;const canChoose=canLoadSource(video.source);$('previousChapter').disabled=!canChoose||info.episode<=1;$('nextChapter').disabled=!canChoose||!!info.totalEpisodes&&info.episode>=info.totalEpisodes;
 const available=info.streams[0].subtitles||[];$('remoteSubtitles').hidden=false;for(const lang of ['es','en']){const list=available.filter(t=>String(t.language).toLowerCase().startsWith(lang)||lang==='es'&&/^(spanish|español)/i.test(t.label)||lang==='en'&&/^english/i.test(t.label)).sort((a,b)=>Number(/forced|signs|songs/i.test(a.label))-Number(/forced|signs|songs/i.test(b.label)));const select=$(lang+'Remote');select.replaceChildren(new Option('Sin pista',''),...list.map(t=>new Option(t.label,String(t.index))));select.value=list.length?String(list[0].index):'';select.disabled=!list.length;void remoteSubtitle(lang);}$('sourceSubtitleStatus').textContent=available.length?'Cargando las pistas disponibles…':'Este episodio no ofrece pistas de subtítulos compatibles.';
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
