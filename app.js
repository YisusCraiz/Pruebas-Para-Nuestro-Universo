import {initRooms, canLoadSource} from './rooms.js';
import {parseSubtitles, activeText} from './subtitles.js';
const $ = id => document.getElementById(id), video = $('video');
const tracks = {es:[], en:[]}; let objectURL; let currentSource="";
function message(text) {$('message').textContent=text;}
function load(source, title) {
  if (!canLoadSource(source)) {message("Sal de la sala para cambiar un archivo local. Solo el anfitrión puede cambiar el enlace compartido.");return;}
  currentSource=source instanceof File?"":source;
  video.pause();
  if (objectURL) {URL.revokeObjectURL(objectURL);objectURL=null;}
  if (source instanceof File) {objectURL=URL.createObjectURL(source);source=objectURL;}
  video.src=source; video.load(); $('title').textContent=title; $('status').textContent='Cargando…';message('');render();
}
$('file').addEventListener('change', e=>{const file=e.target.files[0];if(file)load(file,file.name);});
$('urlForm').addEventListener('submit', e=>{e.preventDefault();try{const url=new URL($('url').value);if(!['https:','http:'].includes(url.protocol))throw Error();load(url.href,'Video desde enlace');}catch{message('Introduce un enlace HTTP o HTTPS válido.');}});
for (const lang of ['es','en']) $(lang+'File').addEventListener('change', async e=>{
  const file=e.target.files[0];if(!file)return;
  try {if(file.size>5*1024*1024)throw Error('El archivo debe pesar menos de 5 MB.');const cues=parseSubtitles(await file.text());if(!cues.length)throw Error('No encontramos tiempos válidos. Usa un archivo SRT o VTT.');tracks[lang]=cues;message(`${lang.toUpperCase()}: ${cues.length} entradas cargadas.`);render();} catch(error){message(error.message);}
});
function render(){const mode=$('mode').value, offset=Number($('offset').value)||0;for(const lang of ['es','en'])$(lang+'Line').textContent=mode==='both'||mode===lang?activeText(tracks[lang],video.currentTime-offset):'';}
video.addEventListener('timeupdate',render);video.addEventListener('seeked',render);$('mode').addEventListener('change',render);$('offset').addEventListener('input',render);
for(const [event,text] of Object.entries({loadedmetadata:'Listo para reproducir',playing:'Reproduciendo',pause:'En pausa',waiting:'Cargando video…',ended:'Episodio terminado'})) video.addEventListener(event,()=>{$('status').textContent=text;});
video.addEventListener('error',()=>{$('status').textContent='No se pudo reproducir';message('El formato puede no ser compatible o el servidor puede bloquear el enlace. Prueba un MP4 local.');});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('stage').requestFullscreen)await $('stage').requestFullscreen();else message('Tu navegador no permite esta pantalla completa. Puedes girar el celular para ampliar el reproductor.');}catch{message('No se pudo activar la pantalla completa en este navegador.');}});
window.addEventListener('beforeunload',()=>{if(objectURL)URL.revokeObjectURL(objectURL);});

void initRooms({video, load, source:()=>currentSource});
