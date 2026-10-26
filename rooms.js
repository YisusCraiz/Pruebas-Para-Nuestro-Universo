import {normalizeUsername,usernameEmail,displayUsername} from './username.js';
import {playbackTarget, safeVideoUrl} from './sync.js';
const $ = id => document.getElementById(id);
const say = text => $('roomMessage').textContent = text;
let client, user, room, timer, applying = false, pending = false, lastVersion = '', disposed = false;
let player;
export function canLoadSource(source) {return !room || applying || (room.owner_id===user?.id && typeof source==='string' && source.startsWith('https://'));}
const inviteId = new URLSearchParams(location.search).get('room');
if (inviteId) $('roomId').value = inviteId;
function check(error) { if (error) throw error; }
function explain(error) {
  const message = error?.message || 'No pudimos completar la operación.';
  say(/schema cache|does not exist|Could not find the table/i.test(message) ? 'Falta preparar Supabase: ejecuta supabase/setup.sql en el SQL Editor de la cuenta alterna.' : message);
}
function authUI() {
  $('accountStatus').textContent = user ? `Sesión: ${displayUsername(user)}` : 'Sin sesión · Puedes seguir usando el reproductor';
  $('authForm').hidden = !!user; $('logout').hidden = !user; $('roomControls').hidden = !user;
}
async function leave() {
  clearInterval(timer); timer=null; room=null; lastVersion='';
  if(player)player.video.controls=true;
  $('roomStatus').textContent='Sin sala';$('leaveRoom').hidden=true;$('copyRoom').hidden=true;
}
async function useRoom(next) {
  player.video.pause();
  await leave(); room=next; $('roomId').value=room.id;
  $('leaveRoom').hidden=false;$('copyRoom').hidden=false;
  await apply(next);
  timer=setInterval(refresh,3000);
}
async function apply(next) {
  if(!room || next.id!==room.id)return;
  room=next;
  const host=room.owner_id===user?.id;
  $('roomStatus').textContent=host?'Eres anfitrión · Tú controlas el video':'Invitado · Siguiendo al anfitrión';
  player.video.controls=host;
  if(host){if(player.source()!==room.media_url){applying=true;player.load(room.media_url,'Video de la sala');applying=false;}return;}
  applying=true;
  try {
    if(player.source()!==room.media_url){player.load(room.media_url,'Video de la sala');lastVersion='';}
    if(player.video.readyState<1)return;
    const target=Math.min(playbackTarget(room),Number.isFinite(player.video.duration)?player.video.duration:Infinity);
    if(Math.abs(player.video.currentTime-target)>1.5)player.video.currentTime=target;
    if(room.playing && player.video.paused){try{await player.video.play();}catch{say('Pulsa «Activar reproducción» para permitir el audio en este dispositivo.');}}
    if(!room.playing && !player.video.paused)player.video.pause();
    lastVersion=room.updated_at;
  } finally {applying=false;}
}
async function refresh() {
  if(!room||pending||document.hidden)return;
  const id=room.id;
  try {const {data,error}=await client.from('animejj_rooms').select('*').eq('id',id).single();check(error);await apply(data);}
  catch(error){explain(error);}
}
async function publish() {
  if(!room||room.owner_id!==user?.id||applying||pending||player.video.readyState<1)return;
  pending=true;
  try {
    const media_url=safeVideoUrl(player.source());
    const {data,error}=await client.from('animejj_rooms').update({media_url,position:player.video.currentTime,playing:!player.video.paused&&!player.video.ended}).eq('id',room.id).select().single();check(error);room=data;
  }catch(error){explain(error);}finally{pending=false;}
}
const run = fn => async event => {event?.preventDefault();try{await fn(event);}catch(error){explain(error);}};
export async function initRooms(adapter) {
  player=adapter;
  try {
    const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm');
    client=createClient('https://suvcdkqqwrodwxgmcjej.supabase.co','sb_publishable_4DzMuO6nmtNRTh2qOUXu0Q_JIf-PF50');
    const {data,error}=await client.auth.getSession();check(error);user=data.session?.user;authUI();
    client.auth.onAuthStateChange((_event,session)=>{const previous=user?.id;user=session?.user;authUI();if(previous&&previous!==user?.id)void leave();});
    $('authForm').addEventListener('submit',run(async event=>{
      const name=$('email').value.trim(),password=$('password').value;
      const buttons=[...$('authForm').querySelectorAll('button')];buttons.forEach(button=>button.disabled=true);
      try {
        if(event.submitter?.value==='signup') {
          const username=normalizeUsername(name);
          const response=await fetch('https://suvcdkqqwrodwxgmcjej.supabase.co/functions/v1/animejj-register',{method:'POST',headers:{'Content-Type':'application/json','apikey':'sb_publishable_4DzMuO6nmtNRTh2qOUXu0Q_JIf-PF50'},body:JSON.stringify({username,password})});
          const result=await response.json();if(!response.ok)throw Error(result.error||'No pudimos crear la cuenta.');
          const {error}=await client.auth.signInWithPassword({email:usernameEmail(username),password});check(error);
          say('¡Cuenta creada! Ya puedes crear una sala.');
        }else {
          const email=name.includes('@')?name.toLowerCase():usernameEmail(name);
          const {error}=await client.auth.signInWithPassword({email,password});
          if(error)throw Error('No pudimos iniciar sesión. Revisa tu usuario y contraseña.');
          say('Sesión iniciada.');
        }
      }finally{buttons.forEach(button=>button.disabled=false);}
      $('password').value='';
    }));
    $('logout').addEventListener('click',run(async()=>{await leave();const {error}=await client.auth.signOut();check(error);say('Sesión cerrada.');}));
    $('createRoom').addEventListener('click',run(async()=>{
      const media_url=safeVideoUrl(player.source());const guest_email=usernameEmail($('guestEmail').value);
      if(!guest_email||!$('guestEmail').checkValidity())throw Error('Escribe el usuario de la cuenta que vas a invitar.');
      if(guest_email===user.email.toLowerCase())throw Error('Invita a una cuenta diferente a la tuya.');
      const {data,error}=await client.from('animejj_rooms').insert({owner_id:user.id,guest_email,media_url,position:0,playing:false}).select().single();check(error);player.video.pause();await useRoom(data);say('Sala creada. Copia la invitación y envíasela a tu acompañante.');
    }));
    $('joinRoom').addEventListener('click',run(async()=>{
      const id=$('roomId').value.trim();if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id))throw Error('Pega el identificador de sala de la invitación.');
      const {data,error}=await client.from('animejj_rooms').select('*').eq('id',id).maybeSingle();check(error);
      if(!data)throw Error('Sala no encontrada o tu usuario no está invitado.');await useRoom(data);say('Sala conectada. Cada persona carga sus subtítulos en su dispositivo.');
    }));
    $('leaveRoom').addEventListener('click',run(async()=>{await leave();say('Saliste de la sala.');}));
    $('copyRoom').addEventListener('click',run(async()=>{const url=new URL(location.href);url.search='';url.searchParams.set('room',room.id);try{await navigator.clipboard.writeText(url.href);say('Invitación copiada.');}catch{$('invitation').value=url.href;$('invitation').hidden=false;$('invitation').select();say('Copia el enlace del campo de invitación.');}}));
    $('unlockPlayback').addEventListener('click',run(async()=>{if(!room)throw Error('Entra primero a una sala.');await player.video.play();await refresh();}));
    for(const event of ['play','pause','seeked','ended'])player.video.addEventListener(event,()=>{void publish();});
    setInterval(()=>{if(room?.owner_id===user?.id&&!player.video.paused)void publish();},10000);
    player.video.addEventListener('loadedmetadata',()=>{if(room&&room.owner_id!==user?.id)void refresh();});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();});
    say('Conexión configurada. Inicia sesión para probar las salas.');
  }catch(error){explain(error);$('accountStatus').textContent='La conexión de cuentas no está disponible. El reproductor local sigue funcionando.';}
}
