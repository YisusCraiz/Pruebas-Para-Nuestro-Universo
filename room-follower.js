import {playbackTarget} from './sync.js?v=20261027-roomfix1';
// Never await a potentially blocked play() while processing fresh room state.
export class RoomFollower {
 constructor(video,{onBlocked=()=>{},now=()=>Date.now()}={}){this.video=video;this.onBlocked=onBlocked;this.now=now;this.generation=0;this.pending=null;this.blocked=false;this.room=null;}
 reset(){this.generation++;this.pending=null;this.blocked=false;this.room=null;}
 update(room){this.room=room;return this.sync();}
 sync({gesture=false}={}){const video=this.video,room=this.room;if(!room||video.readyState<1)return;
 const target=Math.min(playbackTarget(room,this.now()),Number.isFinite(video.duration)?Math.max(0,video.duration-.05):Infinity);
 if(Math.abs(video.currentTime-target)>1.5)try{video.currentTime=target;}catch{/* Reapply once metadata/canplay is ready. */}
 if(!room.playing){if(!video.paused)video.pause();this.blocked=false;return;}
 if(!video.paused||this.pending||this.blocked&&!gesture)return;
 const generation=this.generation;this.blocked=false;
 let attempt;try{attempt=video.play();}catch(error){attempt=Promise.reject(error);}
 const pending=Promise.resolve(attempt).then(()=>{if(generation!==this.generation)return;if(!this.room?.playing)video.pause();},error=>{if(generation!==this.generation)return;if(error?.name==='NotAllowedError'||/activar|audio|autoplay/i.test(error?.message||'')){this.blocked=true;this.onBlocked();}}).finally(()=>{if(this.pending===pending)this.pending=null;});
 this.pending=pending;return pending;
 }
 unlock(){this.blocked=false;return this.sync({gesture:true});}
}
