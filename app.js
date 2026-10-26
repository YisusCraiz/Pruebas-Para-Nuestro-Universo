import {initRooms,canLoadSource} from './rooms.js?v=20261026-catalog1';
import {parseSubtitles,activeText} from './subtitles.js';
import {MediaPlayer} from './player.js?v=20261026-catalog1';
import {catalog,youtubeId,videoUrl} from './sources.js?v=20261026-catalog1';
const $=id=>document.getElementById(id),video=new MediaPlayer($('video'),$('youtubeHost'));
const tracks={es:[],en:[]};
function message(text){$('message').textContent=text;}
function load(source,title){if(!canLoadSource(source)){message('Solo el anfitrión puede elegir el episodio. Los archivos locales se usan en solitario.');return;}
 const id=typeof source==='string'?youtubeId(source):null,item=catalog.find(item=>item.id===id);
 $('title').textContent=item?`${item.series} · ${item.episode}`:title;$('status').textContent=source?'Cargando…':'Sin episodio';message('');
 $('youtubeNote').hidden=!id;$('localSubtitles').hidden=!!id;
 void video.setSource(source);render();
}
$('file').addEventListener('change',e=>{const file=e.target.files[0];if(file)load(file,file.name);});
$('urlForm').addEventListener('submit',e=>{e.preventDefault();try{const url=new URL($('url').value);if(url.protocol!=='https:')throw Error();load(url.href,'Video desde enlace');}catch{message('Introduce un enlace HTTPS de YouTube o un video directo.');}});
for(const lang of ['es','en'])$(lang+'File').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw Error('El archivo debe pesar menos de 5 MB.');const cues=parseSubtitles(await file.text());if(!cues.length)throw Error('Usa un archivo SRT o VTT válido.');tracks[lang]=cues;message(`${lang.toUpperCase()}: ${cues.length} entradas cargadas.`);render();}catch(error){message(error.message);}});
function render(){const mode=$('mode').value,offset=Number($('offset').value)||0;for(const lang of ['es','en'])$(lang+'Line').textContent=mode==='both'||mode===lang?activeText(tracks[lang],video.currentTime-offset):'';}
video.addEventListener('timeupdate',render);video.addEventListener('seeked',render);$('mode').addEventListener('change',render);$('offset').addEventListener('input',render);
for(const [event,text] of Object.entries({loadedmetadata:'Listo para reproducir',playing:'Reproduciendo',pause:'En pausa',waiting:'Cargando video…',ended:'Episodio terminado'}))video.addEventListener(event,()=>{$('status').textContent=text;});
video.addEventListener('error',()=>{$('status').textContent='No se pudo reproducir';message(video.isYouTube?video.lastError:'El formato puede no ser compatible o el servidor puede bloquear el enlace.');});
video.addEventListener('autoplayblocked',()=>message('Pulsa reproducir dentro de YouTube para permitir el audio.'));
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('stage').requestFullscreen)await $('stage').requestFullscreen();else message('Gira tu celular para ampliar el reproductor.');}catch{message('No se pudo activar la pantalla completa.');}});
function renderCatalog(){const query=$('catalogSearch').value.trim().toLowerCase();$('catalogList').replaceChildren();for(const item of catalog.filter(item=>`${item.series} ${item.episode} ${item.language}`.toLowerCase().includes(query))){const button=document.createElement('button');button.type='button';button.className='episode-card';const name=document.createElement('strong'),desc=document.createElement('span'),lang=document.createElement('small');name.textContent=item.series;desc.textContent=item.episode;lang.textContent=`${item.language} · Canal oficial`;button.append(name,desc,lang);button.addEventListener('click',()=>load(videoUrl(item),item.episode));$('catalogList').append(button);}if(!$('catalogList').children.length){const p=document.createElement('p');p.className='hint';p.textContent='No hay coincidencias en esta selección inicial.';$('catalogList').append(p);}}
$('catalogSearch').addEventListener('input',renderCatalog);renderCatalog();
void initRooms({video,load,source:()=>video.source});

window.addEventListener('beforeunload',()=>video.dispose());
