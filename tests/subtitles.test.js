import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseSubtitles,activeText} from '../subtitles.js';
test('SRT, UTF BOM, CRLF and overlapping cues',()=>{const cues=parseSubtitles('\uFEFF1\r\n00:00:01,000 --> 00:00:03,000\r\nHola\r\n\r\n2\r\n00:00:02,000 --> 00:00:04,000\r\nMundo');assert.equal(cues.length,2);assert.equal(activeText(cues,2),'Hola\nMundo');assert.equal(activeText(cues,4),'');});
test('VTT settings, tags and invalid blocks',()=>{const cues=parseSubtitles('WEBVTT\n\n00:01.000 --> 00:02.000 align:start\n<b>Hello</b>\n\n00:03.000 --> 00:01.000\nInvalid');assert.deepEqual(cues,[{start:1,end:2,text:'Hello'}]);});
