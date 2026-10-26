export function playbackTarget(room, now = Date.now()) {
  const elapsed = room.playing ? Math.max(0, (now - Date.parse(room.updated_at)) / 1000) : 0;
  return Math.max(0, Number(room.position) + elapsed);
}
export function safeVideoUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw Error('La sala necesita un enlace directo HTTPS.');
  return url.href;
}
