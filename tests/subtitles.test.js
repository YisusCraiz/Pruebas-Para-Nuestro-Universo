import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseSubtitles,activeText} from '../subtitles.js';
test('SRT, UTF BOM, CRLF and overlapping cues',()=>{const cues=parseSubtitles('\uFEFF1\r\n00:00:01,000 --> 00:00:03,000\r\nHola\r\n\r\n2\r\n00:00:02,000 --> 00:00:04,000\r\nMundo');assert.equal(cues.length,2);assert.equal(activeText(cues,2),'Hola\nMundo');assert.equal(activeText(cues,4),'');});
test('VTT settings, tags and invalid blocks',()=>{const cues=parseSubtitles('WEBVTT\n\n00:01.000 --> 00:02.000 align:start\n<b>Hello</b>\n\n00:03.000 --> 00:01.000\nInvalid');assert.deepEqual(cues,[{start:1,end:2,text:'Hello'}]);});

test('ASS dialogue keeps text, commas and bilingual line breaks without style commands',()=>{const raw=String.raw`[Script Info]
Title: Example
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.25,0:00:03.50,Default,,0,0,0,,{\b1}Hello, world\NHola
Dialogue: 0,0:00:01.00,0:00:02.00,Default,,0,0,0,,{\p1}m 0 0 l 10 10
`;assert.deepEqual(parseSubtitles(raw),[{start:1.25,end:3.5,text:'Hello, world\nHola'}]);});
