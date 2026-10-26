export function timestamp(value) {
  const parts = value.trim().replace(',', '.').split(':').map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some(n => !Number.isFinite(n) || n < 0)) return NaN;
  return parts.reduce((sum, n) => sum * 60 + n, 0);
}
export function parseSubtitles(raw) {
  if (/^\s*\[(?:Script Info|Events)\]/im.test(raw)) return parseASS(raw);
  return raw.replace(/^\uFEFF/, '').replace(/\r/g, '').split(/\n\s*\n/).flatMap(block => {
    const lines = block.trim().split('\n');
    const index = lines.findIndex(line => line.includes('-->'));
    if (index < 0) return [];
    const [left, right] = lines[index].split('-->');
    const start = timestamp(left), end = timestamp(right.trim().split(/\s/)[0]);
    const text = lines.slice(index + 1).join('\n').replace(/<[^>]*>/g, '').replace(/\{\\[^}]*\}/g, '');
    return Number.isFinite(start) && Number.isFinite(end) && end > start && text ? [{start, end, text}] : [];
  }).sort((a,b) => a.start-b.start);
}
export function activeText(cues, time) { return cues.filter(c => c.start <= time && time < c.end).map(c => c.text).join('\n'); }

export function parseASS(raw){let inEvents=false,fields=['layer','start','end','style','name','marginl','marginr','marginv','effect','text'];const cues=[];for(const line of raw.replace(/^\uFEFF/,'').split(/\r?\n/)){if(/^\[/.test(line.trim())){inEvents=/^\[Events\]/i.test(line.trim());continue;}if(!inEvents)continue;if(/^Format:/i.test(line)){fields=line.slice(line.indexOf(':')+1).split(',').map(v=>v.trim().toLowerCase());continue;}if(!/^Dialogue:/i.test(line))continue;const parts=line.slice(line.indexOf(':')+1).trimStart().split(',');const textIndex=fields.indexOf('text');if(textIndex<0||fields.indexOf('start')<0||fields.indexOf('end')<0||parts.length<fields.length)continue;let text=parts.slice(textIndex).join(',');if(/\{[^}]*\\p[1-9][^}]*\}/.test(text))continue;text=text.replace(/\{[^}]*\}/g,'').replace(/\\[Nn]/g,'\n').replace(/\\h/g,' ').trim();const start=timestamp(parts[fields.indexOf('start')]),end=timestamp(parts[fields.indexOf('end')]);if(Number.isFinite(start)&&Number.isFinite(end)&&end>start&&text)cues.push({start,end,text});}return cues.sort((a,b)=>a.start-b.start);}
