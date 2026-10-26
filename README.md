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

El CDN original devuelve una página Cloudflare “Attention Required” al descargar sus pistas desde Supabase. Esa ruta no se elude. Ahora la página busca pistas independientes mediante animejj-subtitles, con AniZip para identificar episodio/temporada y Gestdown para búsqueda/descarga. Solo se aceptan identificadores coincidentes; si falta el mapa o la pista, siguen disponibles los archivos propios. No se garantiza cobertura ni sincronización exacta para todo el catálogo.

## Subtítulos alternativos automáticos
Al abrir un capítulo se consultan ES/EN mediante animejj-subtitles, una función aislada que no lee cuentas, salas ni secretos. Los servicios reciben identificadores públicos del anime y capítulo, nunca contraseñas, códigos de sala o el video. Se conserva la elección ES/EN/ambos/ninguno. Las opciones muestran la versión de cada pista; su edición puede diferir del video, por lo que puede hacer falta elegir otra versión o ajustar el tiempo. Si cargas un archivo durante la búsqueda, se conserva tu archivo.

La función limita destinos a api.ani.zip y api.gestdown.info, rechaza redirecciones y pistas ajenas al episodio/idioma, limita tamaño y tiempo, y mantiene caché breve y límite preventivo por instancia. Convierte UTF-8/UTF-16 y Windows-1252 para conservar acentos en archivos antiguos. No retransmite video ni necesita una nueva base de datos. El límite por instancia no es una cuota global.

## Subtítulos personales en sala
Los botones Español, English, Ambos y Sin subtítulos están disponibles para anfitrión y acompañante. Cada navegador conserva su idioma, tamaño, pistas y archivos propios. Cambiar estas opciones no publica un evento de reproducción ni modifica la elección del otro. La sala comparte únicamente la fuente, posición y estado de reproducción. La disponibilidad de pistas sigue dependiendo del capítulo.

## Anime y donghua
En Explorar, el selector Todos / Anime · Japón / Donghua · China filtra por countryOfOrigin en AniList antes de paginar. Todos conserva otros países. Las tarjetas y fichas muestran la clasificación cuando el país es JP o CN. Alias exactos: Doupo Cangqiong y Battle Through the Heavens → Dou Po Cangqiong; Combat Continent y Soul Land → Douluo Dalu. No se altera una búsqueda con número de temporada. Se verificaron respuestas reales CN para Doupo y Soul Land, y JP para el catálogo de anime. Encontrar una ficha no garantiza video ni subtítulos.

## Motor de traducción portátil
Se sustituye la dependencia de Chrome Translator por un Web Worker con Transformers.js 2.17.2 y modelos Marian OPUS-MT cuantizados ES↔EN, descargados de Hugging Face con revisiones fijas. No necesita Worker AI nativo de Chrome, cuenta ni clave; requiere WebAssembly y module workers. La primera carga es de aproximadamente 120 MB por dirección, más el runtime. La caché del navegador puede evitar repetir descargas, pero puede ser eliminada por el sistema. La velocidad y compatibilidad dependen del equipo; aún se debe comprobar en el teléfono real del usuario.

La traducción se ejecuta en el dispositivo. El texto no se manda a un servicio remoto de traducción. Cancelar o cambiar capítulo termina el worker y evita publicar resultados incompletos; la pista original se conserva. El botón informa de la descarga y recomienda Wi-Fi. Se mantienen etiquetas de traducción automática y tiempos originales.

Referencias: https://huggingface.co/docs/transformers.js/v2.17.2/en/custom_usage , https://huggingface.co/Xenova/opus-mt-en-es , https://huggingface.co/Xenova/opus-mt-es-en . No se modificó Supabase ni se contrató un servicio de traducción.

Verificación real desde GitHub Pages: inglés → español convirtió “Hello, how are you?” en “Hola, ¿cómo estás?”; español → inglés convirtió “Hola, ¿cómo estás?” en “Hey, how are you?”. Un archivo completo de 302 entradas inglesas produjo 302 entradas españolas. Esto valida ejecución y estructura; no garantiza calidad perfecta en todas las líneas o compatibilidad con todos los teléfonos. Falta la comprobación en el RedMagic real del usuario.

Si eliges un idioma que no tiene pista, se carga la pista original disponible para habilitar el botón de traducción. Elegir Sin subtítulos evita esa carga. La elección y el resultado siguen siendo personales, no se comparten como preferencias de la sala. La suite cuenta con 40 pruebas.
