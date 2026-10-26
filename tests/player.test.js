import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MediaPlayer} from '../player.js';
test('YouTube adapter cues, plays, seeks and switches back to direct video',async()=>{
 const captions={hidden:false};globalThis.document={getElementById:()=>captions,createElement:()=>({})};globalThis.location={origin:'https://example.org'};
 class Native extends EventTarget{paused=true;currentTime=0;readyState=0;duration=100;controls=true;pause(){this.paused=true;}play(){this.paused=false;return Promise.resolve();}load(){}removeAttribute(){}}
 class YT{constructor(host,options){this.o=options;this.time=0;this.state=5;queueMicrotask(()=>options.events.onReady());}cueVideoById(id){this.id=id;this.o.events.onStateChange({data:5});}getCurrentTime(){return this.time;}getDuration(){return 100;}getPlayerState(){return this.state;}playVideo(){this.state=1;this.o.events.onStateChange({data:1});}pauseVideo(){this.state=2;this.o.events.onStateChange({data:2});}seekTo(n){this.time=n;}destroy(){}}
 globalThis.window={YT:{Player:YT}};
 const native=new Native(),container={hidden:true,replaceChildren(){}};const player=new MediaPlayer(native,container);
 try{let metadata=0;player.addEventListener('loadedmetadata',()=>metadata++);await player.setSource('https://www.youtube.com/watch?v=rYDmL5VH-uk');assert.equal(player.readyState,1);assert.equal(metadata,1);assert.equal(captions.hidden,true);assert.equal(native.hidden,true);await player.play();assert.equal(player.paused,false);player.currentTime=18;assert.equal(player.currentTime,18);await player.setSource('https://example.org/video.mp4');assert.equal(player.isYouTube,false);assert.equal(native.src,'https://example.org/video.mp4');assert.equal(captions.hidden,false);assert.equal(container.hidden,true);}finally{player.dispose();}
});

test('HLS adapter attaches a manifest and releases its engine when changing sources',async()=>{
 globalThis.document={getElementById:()=>({hidden:false})};globalThis.location={origin:'https://example.org'};
 let engine;
 class Hls{static Events={ERROR:'error',MANIFEST_PARSED:'manifest',AUDIO_TRACKS_UPDATED:'audio'};static isSupported(){return true;}constructor(){engine=this;this.levels=[{height:720}];this.audioTracks=[{name:'English'}];}on(){}loadSource(url){this.url=url;}attachMedia(element){this.element=element;}destroy(){this.destroyed=true;}}
 globalThis.window={Hls};
 class Native extends EventTarget{paused=true;currentTime=0;readyState=0;pause(){}load(){}removeAttribute(){}canPlayType(){return '';}}
 const native=new Native(),player=new MediaPlayer(native,{hidden:true});
 try{await player.setSource('https://example.org/master.m3u8');assert.equal(engine.url,'https://example.org/master.m3u8');assert.equal(engine.element,native);assert.equal(player.qualityOptions()[0].label,'720p');assert.equal(player.audioOptions()[0].label,'English');player.setQuality(0);assert.equal(engine.currentLevel,0);await player.setSource('https://example.org/video.mp4');assert.equal(engine.destroyed,true);assert.equal(player.hls,null);}finally{player.dispose();}
});
