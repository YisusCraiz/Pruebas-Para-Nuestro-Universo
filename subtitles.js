export function timestamp(value) {
  const parts = value.trim().replace(',', '.').split(':').map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some(n => !Number.isFinite(n) || n < 0)) return NaN;
  return parts.reduce((sum, n) => sum * 60 + n, 0);
}
export function parseSubtitles(raw) {
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
