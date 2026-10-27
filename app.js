import {cuesToSrt} from './subtitle-export.js?v=20261027-sources1';
import {decodeCaptionAudio,generateAudioCaptions} from './audio-captions.js?v=20261027-sources1';
import {savedTranslation,readSavedTranslation} from './saved-translation.js?v=20261026-saved1';
import {translationSupported} from './translate-captions.js?v=20261026-portable2';
import {searchAlternativeSubtitles,alternativeSubtitleUrl} from './alternative-subtitles.js?v=20261026-portable2';
import {parseStreamReference,streamReference} from './stream-api.js?v=20261027-sources1';
import {initBrowse} from './browse.js?v=20261027-sources1';
import {initRooms,canLoadSource} from './rooms.js?v=20261027-roomfix1';
import {activeText} from './subtitles.js?v=20261026-portable2';
import {CaptionTracks,captionPreferences,saveCaptionPreferences,captionLoadLanguages} from './caption-tracks.js?v=20261026-portable2';
import {MediaPlayer} from './player.js?v=20261027-sources1';
import {catalog,youtubeId,videoUrl} from './sources.js?v=20261026-portable2';
const $=id=>document.getElementById(id),video=new MediaPlayer($('video'),$('youtubeHost'));
let captionLookup=null,translationJob=null,translatedFrom=null,speechJob=null;
const checkedTranslations=new WeakMap();
const captions=new CaptionTracks(()=>{render();captionStatus();});
let preferenceStore;try{preferenceStore=window.localStorage;}catch{}
const preferences=captionPreferences(preferenceStore);$('mode').value=preferences.mode;$('captionSize').value=String(preferences.size);
function applyPreferences(){for(const button of $('personalCaptionModes').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.captionMode===$('mode').value));const size=Number($('captionSize').value);$('captions').style.fontSize=`clamp(${15*size/100}px,${2*size/100}vw,${25*size/100}px)`;saveCaptionPreferences(preferenceStore,{mode:$('mode').value,size});render();if(video.providerInfo&&captionLookup?.data)for(const lang of captionLoadLanguages($('mode').value,captionLookup.data.tracks.map(t=>t.language)))if(captions.get(lang).status==='empty'&&$(lang+'Remote').value)void remoteSubtitle(lang);}
applyPreferences();
for(const button of $('personalCaptionModes').querySelectorAll('button'))button.addEventListener('click',()=>{$('mode').value=button.dataset.captionMode;applyPreferences();});
function message(text){$('message').textContent=text;}
function load(source,title){if(!canLoadSource(source)){message('Solo el anfitrión puede elegir el episodio. Los archivos locales se usan en solitario.');return false;}
 speechJob=null;$('cancelSpeech').hidden=true;$('speechStatus').textContent='Descarga inicial adicional del modelo de voz. Usa Wi-Fi; en celulares puede tardar bastante.';captionLookup?.controller.abort();captionLookup=null;translationJob=null;translatedFrom=null;$('cancelTranslation').hidden=true;$('translationStatus').textContent='Traducción en tu dispositivo: requiere una pista ES/EN. La primera descarga es de aproximadamente 120 MB por dirección de idioma. Usa Wi-Fi.';captions.reset();$('offset').value='0';for(const lang of ['es','en'])$(lang+'File').value=''; $('providerNote').hidden=true;$('remoteSubtitles').hidden=true;$('chapterNavigation').hidden=true;
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
function captionStatus(){if(translatedFrom&&captions.get(translatedFrom.source)!==translatedFrom.entry){const target=translatedFrom.target;translatedFrom=null;if(['machine'].includes(captions.get(target).kind))captions.clear(target);}let failed=false;for(const lang of ['es','en']){const entry=captions.get(lang),name=lang==='es'?'Español':'English';const text={empty:'Sin pista',unavailable:'Sin pista ofrecida',loading:'Cargando…',error:entry.error||'No se pudo cargar'}[entry.status]||`${entry.cues.length} línea${entry.cues.length===1?'':'s'} · ${entry.kind==='file'?'archivo propio':entry.kind==='machine'?'Traducción automática':entry.kind==='speech'?'Voz → inglés · automática':entry.label||'fuente alternativa'}`;$(lang+'CaptionStatus').textContent=`${name}: ${text}`;$('download'+(lang==='es'?'Es':'En')).disabled=entry.status!=='ready';if(entry.status==='error'&&entry.kind==='remote')failed=true;}
 $('retryCaptions').hidden=!failed&&!captionLookup?.failed;
 if(!speechJob&&!translationJob&&['es','en'].every(lang=>['empty','unavailable','error'].includes(captions.get(lang).status)))$('translationStatus').textContent='No hay una pista ES/EN para traducir. Carga subtítulos propios o abre «Sin pistas: generar desde un archivo».';const missing=['es','en'].find(lang=>['empty','unavailable','error'].includes(captions.get(lang).status)&&captions.get(lang==='es'?'en':'es').status==='ready');$('translateMissing').disabled=!missing||!translationSupported()||!!translationJob;
 if(missing&&!translationJob&&$('mode').value!=='off')void restoreSavedTranslation(missing);
}
video.addEventListener('timeupdate',render);video.addEventListener('seeked',render);$('mode').addEventListener('change',applyPreferences);$('captionSize').addEventListener('change',applyPreferences);$('offset').addEventListener('input',render);
for(const [id,delta] of [['captionEarlier',-.5],['captionLater',.5]])$(id).addEventListener('click',()=>{$('offset').value=String(Math.max(-120,Math.min(120,(Number($('offset').value)||0)+delta)));render();});$('captionReset').addEventListener('click',()=>{$('offset').value='0';render();});
$('captionSettings').addEventListener('click',()=>{$('playerOptions').open=!$('playerOptions').open;if($('playerOptions').open)$('playerOptions').scrollIntoView({behavior:'smooth',block:'nearest'});});
for(const [event,text] of Object.entries({loadedmetadata:'Listo para reproducir',playing:'Reproduciendo',pause:'En pausa',waiting:'Cargando video…',ended:'Episodio terminado'}))video.addEventListener(event,()=>{$('status').textContent=text;});
video.addEventListener('error',()=>{$('status').textContent='No se pudo reproducir';message(video.lastError||'El formato puede no ser compatible o el servidor puede bloquear el enlace.');});

video.addEventListener('providerloading',()=>{$('status').textContent='Preparando capítulo…';message('Consultando la fuente del episodio.');});
async function remoteSubtitle(lang){const ref=parseStreamReference(video.source),select=$(lang+'Remote');if(!video.providerInfo||!ref||select.value===''){captions.clear(lang);return;}
 const trackId=select.value;await captions.load(lang,async signal=>{const controller=new AbortController(),abort=()=>controller.abort();signal.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,45000);try{const response=await fetch(alternativeSubtitleUrl(ref,lang,trackId),{signal:controller.signal});if(!response.ok){let error;try{error=(await response.json()).error;}catch{}throw Error(error||'La fuente no permite cargar esta pista. Usa un archivo propio.');}return await response.text();}catch(error){if(controller.signal.aborted&&!signal.aborted)throw Error('La pista tardó demasiado. Puedes reintentar.');throw error;}finally{clearTimeout(timer);signal.removeEventListener('abort',abort);}},{kind:'remote',label:select.selectedOptions[0]?.textContent||''});
}
async function prepareCaptions(info,ref){captionLookup?.controller.abort();const lookup={controller:new AbortController(),failed:false,data:null};captionLookup=lookup;$('remoteSubtitles').hidden=false;$('sourceSubtitleStatus').textContent='Buscando subtítulos alternativos para este capítulo…';
 for(const lang of ['es','en']){const select=$(lang+'Remote');select.replaceChildren(new Option('Sin pista',''));select.disabled=true;if(!['file','speech'].includes(captions.get(lang).kind))captions.clear(lang,'loading');}
 try{const data=await searchAlternativeSubtitles(ref,lookup.controller.signal);if(lookup!==captionLookup||lookup.controller.signal.aborted)return;lookup.data=data;
 $('sourceSubtitleStatus').textContent=`Fuente alternativa: Gestdown · ${data.mapping.title} · T${data.mapping.season} E${data.mapping.episode}. Si el texto no coincide, elige otra versión o ajusta el tiempo.${data.warnings?.length?' '+data.warnings.join(' · '):''}`;
 for(const lang of ['es','en']){const list=data.tracks.filter(t=>t.language===lang),select=$(lang+'Remote');select.replaceChildren(new Option('Sin pista',''),...list.map(t=>new Option(t.label,t.id)));select.disabled=!list.length;if(['file','speech'].includes(captions.get(lang).kind)){select.value='';continue;}select.value=list[0]?.id||'';if(!list.length)captions.clear(lang,'unavailable');else if(captionLoadLanguages($('mode').value,data.tracks.map(t=>t.language)).includes(lang))void remoteSubtitle(lang);else captions.clear(lang);}
 }catch(error){if(lookup!==captionLookup||lookup.controller.signal.aborted)return;lookup.failed=true;$('sourceSubtitleStatus').textContent=error.message+' Puedes cargar un archivo propio.';for(const lang of ['es','en'])if(!['file','speech'].includes(captions.get(lang).kind))captions.clear(lang,'unavailable');}finally{if(lookup===captionLookup)captionStatus();}
}

async function restoreSavedTranslation(target){
 const source=target==='es'?'en':'es',entry=captions.get(source),previous=captions.get(target);
 if(entry.kind==='machine'||checkedTranslations.get(entry)===previous)return;
 checkedTranslations.set(entry,previous);
 try{const {raw}=await readSavedTranslation(entry.cues,{source,target});
 if(!raw||translationJob||captions.get(source)!==entry||captions.get(target)!==previous||$('mode').value==='off')return;
 translatedFrom={source,target,entry};
 const ok=await captions.load(target,()=>raw,{kind:'machine',label:'Traducción automática guardada'});
 if(ok&&captions.get(source)===entry)$('translationStatus').textContent='Traducción automática recuperada de este dispositivo. Puede contener errores en nombres o expresiones.';
 }catch{/* Storage failures leave manual translation available. */}
}

$('translateMissing').addEventListener('click',async()=>{const target=['es','en'].find(lang=>['empty','unavailable','error'].includes(captions.get(lang).status)&&captions.get(lang==='es'?'en':'es').status==='ready');if(!target||translationJob)return;const source=target==='es'?'en':'es',entry=captions.get(source),job={source,target};translationJob=job;translatedFrom={source,target,entry};$('cancelTranslation').hidden=false;$('translationStatus').textContent='Preparando el motor de traducción. Primera descarga: aproximadamente 120 MB; después puede reutilizarse desde la caché.';captionStatus();try{const ok=await captions.load(target,signal=>savedTranslation(entry.cues,{source,target,signal,onProgress:p=>{if(translationJob===job)$('translationStatus').textContent=p.stage==='cached'?'Traducción recuperada de este dispositivo.':p.stage==='saved'?'Traducción guardada en este dispositivo.':p.stage==='unsaved'?'Traducción lista; el navegador no permitió guardarla.':p.stage==='download'?`Descargando motor: ${Math.round(p.progress*100)}%`:`Traducción automática: ${p.done}/${p.total} líneas`;if(['cached','saved','unsaved'].includes(p.stage))job.storage=p.stage;}}),{kind:'machine',label:'Traducción automática'});if(translationJob===job)$('translationStatus').textContent=ok?(job.storage==='unsaved'?'Traducción lista, pero no se pudo guardar en este dispositivo.':job.storage==='cached'?'Traducción automática recuperada de este dispositivo.':'Traducción automática lista y guardada en este dispositivo. Puede contener errores en nombres o expresiones.'):'Traducción cancelada o no disponible. La pista original se conserva.';}finally{if(translationJob===job){translationJob=null;$('cancelTranslation').hidden=true;captionStatus();}}});
$('cancelTranslation').addEventListener('click',()=>{if(translationJob)captions.clear(translationJob.target);});

$('speechFile').addEventListener('change',async event=>{const file=event.target.files[0];event.target.value='';if(!file)return;
 if(['ready','loading'].includes(captions.get('en').status)){message('Ya hay una pista inglesa o una carga en curso. Se conserva la pista actual.');return;}
 const job={language:$('speechLanguage').value,quality:$('speechQuality').value};speechJob=job;$('cancelSpeech').hidden=false;$('speechStatus').textContent='Leyendo audio en este dispositivo…';
 try{const ok=await captions.load('en',async signal=>{const {audio}=await decodeCaptionAudio(file,signal);return generateAudioCaptions(audio,{signal,language:job.language,quality:job.quality,onProgress:p=>{if(speechJob!==job)return;if(p.stage==='complete')job.saved=p.saved;$('speechStatus').textContent=p.stage==='download'?`Descargando modelo de voz: ${Math.round(p.progress)}%`:p.stage==='resume'?`Recuperados ${p.done}/${p.total} bloques; continuando…`:p.stage==='complete'?'Reconocimiento terminado.':`Reconociendo voz: ${p.done}/${p.total} bloques · ${Math.floor((p.seconds||0)/60)} min procesados${p.saved?' · avance guardado':''}`;}});},{kind:'speech',label:'Voz → inglés · automática'});
 if(speechJob===job)$('speechStatus').textContent=ok?`Pista inglesa generada automáticamente${job.saved?' y guardada en este dispositivo':''}. Puedes descargar el SRT o traducirla al español. Revisa el texto y los tiempos.`:'Reconocimiento detenido o no disponible. Los bloques que pudieron guardarse se recuperan al elegir el mismo archivo, idioma y modelo. Revisa el estado de English.';
 }finally{if(speechJob===job){speechJob=null;$('cancelSpeech').hidden=true;}}});
for(const [id,lang] of [['downloadEs','es'],['downloadEn','en']])$(id).addEventListener('click',()=>{const entry=captions.get(lang);if(entry.status!=='ready')return;const blob=new Blob([cuesToSrt(entry.cues)],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`animejj-${lang}${['speech','machine'].includes(entry.kind)?'-automatico':''}.srt`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('cancelSpeech').addEventListener('click',()=>{if(speechJob)captions.clear('en');});

$('retryCaptions').addEventListener('click',()=>{if(captionLookup?.failed){const ref=parseStreamReference(video.source);if(ref&&video.providerInfo)void prepareCaptions(video.providerInfo,ref);return;}for(const lang of ['es','en']){const entry=captions.get(lang);if(entry.status==='error'&&entry.kind==='remote')void remoteSubtitle(lang);}});
video.addEventListener('providerready',()=>{const info=video.providerInfo,ref=parseStreamReference(video.source);if(!info||!ref)return;$('title').textContent=`${info.title} · Capítulo ${info.episode}`;message('');$('chapterNavigation').hidden=false;$('chapterLabel').textContent=`Capítulo ${info.episode}${info.totalEpisodes?' de '+info.totalEpisodes:''}`;const canChoose=canLoadSource(video.source);$('previousChapter').disabled=!canChoose||info.episode<=1;$('nextChapter').disabled=!canChoose||!!info.totalEpisodes&&info.episode>=info.totalEpisodes;
 const embedded=info.streams?.[0]?.type==='dailymotion';$('providerNote').hidden=!embedded;$('providerNote').textContent='Fuente adicional con reproductor Dailymotion: los CC se eligen dentro del video y pueden variar por capítulo. Los subtítulos incrustados no se pueden ocultar. Los botones ES/EN de AnimeJJ controlan las pistas que cargues aquí. Los anuncios pueden causar diferencias temporales en sala.';void prepareCaptions(info,ref);
});
for(const lang of ['es','en'])$(lang+'Remote').addEventListener('change',()=>void remoteSubtitle(lang));
for(const [id,offset] of [['previousChapter',-1],['nextChapter',1]])$(id).addEventListener('click',()=>{const ref=parseStreamReference(video.source),info=video.providerInfo;if(ref&&info)load(streamReference(ref.animeId,ref.episode+offset,ref.provider),`${info.title} · Capítulo ${ref.episode+offset}`);});
video.addEventListener('autoplayblocked',()=>message('Pulsa reproducir dentro de YouTube para permitir el audio.'));
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('stage').requestFullscreen)await $('stage').requestFullscreen();else message('Gira tu celular para ampliar el reproductor.');}catch{message('No se pudo activar la pantalla completa.');}});
function updateStreamOptions(){const quality=video.qualityOptions(),audio=video.audioOptions();$('streamOptions').hidden=!quality.length&&!audio.length;$('quality').replaceChildren(new Option('Automática','-1'),...quality.map(option=>new Option(option.label,String(option.value))));$('audioTrack').replaceChildren(...audio.map(option=>new Option(option.label,String(option.value))));$('audioTrackLabel').hidden=!audio.length;}
video.addEventListener('trackschange',updateStreamOptions);$('quality').addEventListener('change',()=>video.setQuality(Number($('quality').value)));$('audioTrack').addEventListener('change',()=>video.setAudio(Number($('audioTrack').value)));
initBrowse({load,video});
void initRooms({video,load,source:()=>video.source});

window.addEventListener('beforeunload',()=>video.dispose());
