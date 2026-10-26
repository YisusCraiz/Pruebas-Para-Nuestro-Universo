export function youtubeId(value) {
  try {
    const url=new URL(value); if(url.protocol!=='https:')return null;
    const host=url.hostname.toLowerCase(); let id;
    if(host==='youtu.be')id=url.pathname.slice(1).split('/')[0];
    else if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(host))id=url.pathname==='/watch'?url.searchParams.get('v'):url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)\/?$/)?.[1];
    return /^[A-Za-z0-9_-]{11}$/.test(id||'')?id:null;
  }catch{return null;}
}
export const catalog=[
 {id:'4gVnBT0t8hQ',series:'Pokémon: Liga Añil',episode:'Episodio 1 · ¡Te elijo a ti!',language:'Español',channel:'PokemonOficialES'},
 {id:'rYDmL5VH-uk',series:'Pokémon: Twilight Wings',episode:'Episodio 1 · Letter',language:'English',channel:'The Official Pokémon YouTube channel'},
 {id:'uyMxQl-PeJE',series:'Pokémon: Paldean Winds',episode:'Episodio 1 · Breathe Out',language:'English',channel:'The Official Pokémon YouTube channel'}
];
export function videoUrl(item){return `https://www.youtube.com/watch?v=${item.id}`;}

export function isHlsUrl(value){try{const url=new URL(value);return url.protocol==='https:'&&/\.m3u8$/i.test(url.pathname);}catch{return false;}}
