import {test} from 'node:test';
import assert from 'node:assert/strict';
import {playbackTarget,safeVideoUrl} from '../sync.js';
test('room playback advances only while playing and clamps future clocks',()=>{const base={position:20,updated_at:'2026-01-01T00:00:00Z',playing:false};const now=Date.parse(base.updated_at);assert.equal(playbackTarget(base,now+5000),20);assert.equal(playbackTarget({...base,playing:true},now+5000),25);assert.equal(playbackTarget({...base,playing:true},now-1000),20);});
test('rooms reject local, insecure and script URLs',()=>{for(const url of ['blob:test','javascript:alert(1)','http://example.org/a.mp4'])assert.throws(()=>safeVideoUrl(url));assert.equal(safeVideoUrl('https://example.org/a.mp4'),'https://example.org/a.mp4');});

test('shared playback payload excludes host subtitle choices and local viewing settings',async()=>{const {roomPlaybackUpdate}=await import('../sync.js');const video={currentTime:42,paused:false,ended:false,mode:'es',subtitleId:'private-choice',captionSize:140,offset:2};const payload=roomPlaybackUpdate('https://example.org/episode.mp4',video);assert.deepEqual(payload,{media_url:'https://example.org/episode.mp4',position:42,playing:true});video.mode='en';video.offset=-4;assert.deepEqual(roomPlaybackUpdate('https://example.org/episode.mp4',video),payload);});
