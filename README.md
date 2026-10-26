# AnimeJJ · Pruebas para Nuestro Universo
Página: https://yisuscraiz.github.io/Pruebas-Para-Nuestro-Universo/

## Uso
La entrada conserva tres botones: **Crear sala**, **Unirse a sala** y **Ver en solitario**.

- Crear sala pide iniciar sesión solo si hace falta y da un código para la otra persona. Permite elegir el video después de crearla.
- Unirse pide el código. Solo hay lugar para anfitrión y un acompañante; comparte el código de forma privada.
- Solitario entra sin cuenta.

Las cuentas nuevas usan nombre de usuario y contraseña, sin correo ni confirmación. Usuario: 3–24 letras ASCII, números o guion bajo. Contraseña: 8–128 caracteres. Las cuentas antiguas por correo pueden escribir su correo en el campo de usuario. No hay recuperación por correo para las nuevas cuentas.

## Catálogo
Después de entrar aparece:
- **Para probar**: tres referencias verificadas de canales oficiales Pokémon, con ficha y selección de episodio.
- **Explorar anime**: búsqueda paginada de AniList a través de la función de catálogo de Supabase con portadas, sinopsis, año, número de episodios e historias relacionadas. La API puede estar caída o limitar consultas; se informa el error y se conserva la selección de prueba.
- **Mi lista**: títulos guardados en este dispositivo. No se sincronizan con otra cuenta, navegador ni dispositivo.

Una ficha no garantiza reproducción. Solo los episodios con fuente integrada se abren en AnimeJJ. Los enlaces de otras plataformas se identifican como externos, pueden exigir cuenta/suscripción y no se sincronizan con la sala. No se promete audio/subtítulos en idiomas que la fuente no haya confirmado. Las sinopsis aparecen en el idioma entregado por AniList.

## Reproductor
YouTube oficial mediante IFrame API, archivos locales MP4/WebM y enlaces HTTPS directos. Ahora acepta HLS (.m3u8) con hls.js fijado a 1.6.13 o HLS nativo. Calidad/audio se muestran solo cuando el stream los ofrece. CORS y compatibilidad de codecs dependen del origen y navegador. No extrae streams de páginas arbitrarias ni integra servicios con DRM.

YouTube usa sus propios subtítulos, controles y disponibilidad regional. Los subtítulos SRT/VTT/ASS locales y dobles ES/EN son para video directo. Los archivos locales permanecen en el dispositivo y no se transmiten a la sala.

Continuar viendo guarda el minuto de fuentes HTTPS en el navegador, sin guardar archivos locales, contraseñas ni tokens. El historial no es compartido. Su recuperación desde otra cuenta del mismo navegador puede mostrar los mismos títulos guardados porque el almacenamiento es del dispositivo.

## Salas y backend
Supabase PruebasX: proyecto suvcdkqqwrodwxgmcjej. Tablas, RLS, RPC y registro ya desplegados. Fuentes en supabase/.
Solo miembros pueden leer la sala; solo anfitrión modifica video/posición. Los participantes se muestran con nombre e iconos provisionales. Los personajes de Nuestro Universo aún no se conectan. Consulta de sincronización cada 3 s, referencia de reproducción cada 10 s, presencia cada 10 s y desconexión estimada a los 35 s. No es sincronización exacta y puede diferir por anuncios/buffering/autoplay.

El registro servidor usa API administrativa con secreto de entorno, nunca en el navegador. Máximo 20 intentos de registro por hora del proyecto. La clave publicable de cliente no es un secreto. No se ha cambiado la configuración de seguridad global ni integrado la página de producción de Nuestro Universo.

## Desarrollo y verificación
Servidor local: `python -m http.server 8080` o Live Server. No abrir index.html por file://.
`npm test` ejecuta las pruebas. Módulos JS sin proceso de build; GitHub Pages publica main desde la raíz. Los cambios llevan versión de recursos para evitar usar módulos de interfaz antiguos.

Consulta docs/provider-review.md para fuentes revisadas, respuestas observadas, decisiones y límites. La entrega incorpora una conexión experimental a AniZone: ficha → consulta de capítulos → reproducción HLS. Solo se seleccionan coincidencias únicas por título, año, formato y número de episodios cuando está disponible. Incluye paginación, anterior/siguiente y referencias estables para salas/progreso. La disponibilidad y exactitud del contenido dependen de la fuente; no se garantiza todo el catálogo ni audio doblado. Falta validar un capítulo completo en dos dispositivos reales.

La función animejj-catalog está desplegada y devuelve solo consultas públicas predefinidas de búsqueda y ficha. La clave publicable identifica el cliente; no concede acceso a datos privados. Hay validación de acciones/parámetros, tiempo máximo, caché breve y límite preventivo de peticiones por instancia. Se verificó respuesta real 200 para búsqueda de Kimetsu.

Las pistas remotas ES/EN se consultan cuando la fuente las ofrece. ASS se presenta como texto plano (sin tipografía, posicionamiento ni karaoke). Si la fuente rechaza una pista se indica el error y se permite cargar un archivo local. Los videos van directamente del origen al navegador; Supabase no retransmite segmentos de video.

## Ajustes de subtítulos
El botón Subtítulos / Subtitles abre los ajustes. Cada idioma muestra por separado carga, líneas listas, archivo propio o error, y se pueden reintentar solo las pistas remotas fallidas. Se recuerda modo ES/EN/ambos/ninguno y tamaño (80–160%) en el navegador; el desfase vuelve a cero en cada capítulo. Los archivos propios cancelan una descarga pendiente y no se suben al servidor.

Diagnóstico confirmado: el CDN devuelve una página Cloudflare “Attention Required” a Supabase al descargar las pistas. No se elude la verificación; la app informa el bloqueo y conserva la opción de SRT/VTT/ASS locales. Esto no significa que los subtítulos automáticos estén reparados.
