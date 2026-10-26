import {test} from 'node:test';
import assert from 'node:assert/strict';
import {youtubeId,catalog,videoUrl} from '../sources.js';
test('supported official YouTube URL formats',()=>{for(const url of ['https://www.youtube.com/watch?v=rYDmL5VH-uk','https://youtu.be/rYDmL5VH-uk?t=12','https://www.youtube.com/embed/rYDmL5VH-uk'])assert.equal(youtubeId(url),'rYDmL5VH-uk');});
test('reject lookalike domains, insecure links and malformed IDs',()=>{for(const url of ['https://youtube.com.evil.org/watch?v=rYDmL5VH-uk','http://youtu.be/rYDmL5VH-uk','javascript:alert(1)','https://www.youtube.com/watch?v=bad'])assert.equal(youtubeId(url),null);});
test('all curated entries have unique valid video identities',()=>{assert.equal(new Set(catalog.map(c=>c.id)).size,catalog.length);for(const item of catalog)assert.equal(youtubeId(videoUrl(item)),item.id);});
