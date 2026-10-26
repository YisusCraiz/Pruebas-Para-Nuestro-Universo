# Revisión de fuentes para AnimeJJ

## Referencia: Kitsune
Repositorio revisado: https://github.com/Dovakiin0/Kitsune (master, referencias de búsqueda resueltas al commit cd05752f01d3365fdd5a600445703084383f3c78).
Licencia MIT, copyright 2026 Dovakiin0. Se revisaron README, configuración, rutas episodes/watch y proveedores. Esta entrega no copia código de Kitsune; usa su separación entre catálogo, disponibilidad y reproducción como referencia arquitectónica.

El proyecto ejecuta su API de proveedores en rutas de Next.js. Algunos conectores necesitan sesiones, cookies, headers y dependencias de servidor; su Companion es un proceso local. Por tanto, copiar sus pantallas a GitHub Pages no reproduce su funcionamiento. No se añadieron servicios de pago ni procesos locales obligatorios.

## Qué está operativo en el código publicado
- Selección manual de tres videos oficiales, integración YouTube y salas existentes.
- Cliente AniList para búsqueda paginada, ficha, relaciones y enlaces de streaming externos. Sin credenciales AniList ni copia masiva de datos; caché temporal en memoria, límite de resultados y manejo de 429/errores GraphQL.
- Los enlaces de plataformas externas se abren como enlaces, nunca se confunden con streams ni se introducen en un iframe arbitrario.
- HLS por enlace directo .m3u8 vía hls.js 1.6.13 (o soporte nativo), sujeto a CORS, codecs y accesibilidad del origen. Sin proxy abierto ni extracción de DRM.
- Lista personal y progreso de fuentes HTTPS guardados solo en el navegador actual. No es sincronización de historial entre dispositivos ni una lista de AniList.

## Verificación y límites de esta sesión
- La consulta directa de catálogo a graphql.anilist.co devolvió HTTP 403 desde el entorno de ejecución.
- La comprobación de api.jikan.moe devolvió HTTP 503.
- La comprobación de senshi.to/episodes/16498 devolvió HTTP 403. No se verificó su extracción/reproducción ni se añadió como fuente activa.
- Esos resultados no prueban disponibilidad desde los dispositivos del usuario. No se intentó eludir desafíos, permisos, autenticación ni restricciones de red.
- Pruebas automáticas cubren normalización de metadatos, URLs, errores GraphQL, límites de almacenamiento, adaptador HLS simulado, subtítulos y cambio YouTube/directo. No equivalen a validar episodios de proveedores en vivo.

## Próxima condición para activar un proveedor amplio
Conseguir una fuente reproducible y mantenible; probar búsqueda → identificación inequívoca de temporada → episodio → video y pistas reales en ambos dispositivos. Si requiere servidor, desplegar un backend dedicado y comprobar sus límites de tráfico antes de reemplazar la selección de prueba. No basta con que el proyecto tenga estrellas o muestre portadas.

Documentación:
- https://docs.anilist.co/guide/terms-of-use
- https://docs.anilist.co/guide/rate-limiting
- https://docs.anilist.co/reference/object/media
- https://github.com/video-dev/hls.js

## Resolución de conexión del catálogo
La función animejj-catalog se desplegó en Supabase con dos operaciones fijas (search/details), destino único AniList, validación de parámetros, caché en memoria y límite preventivo de peticiones. No permite enviar consultas GraphQL arbitrarias ni URLs. Solo consume datos públicos y no lee tablas, usuarios ni secretos administrativos. La búsqueda real de Kimetsu respondió HTTP 200 a través de ella. La página usa esa función para resolver el fallo observado en la llamada directa desde el navegador. Esto habilita metadatos, no fuentes de video.

Se verificó la búsqueda y ficha de Kimetsu desde la página publicada. La función de catálogo también sirve las portadas de AniList mediante una ruta GET que valida clave publicable y restringe host/ruta/formato/tamaño; no acepta destinos arbitrarios ni redirecciones. Esto evita el fallo de imágenes observado en el navegador de prueba. Los enlaces de streaming continúan siendo externos hasta integrar una fuente de video.
