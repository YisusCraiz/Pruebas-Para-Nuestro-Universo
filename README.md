# AnimeJJ · Laboratorio
Primera prueba independiente de Nuestro Universo. Sin integración con producción.

## Probar
1. Clona o descarga este repositorio.
2. Ejecuta `python -m http.server 8080` desde esta carpeta (o usa Live Server en VS Code).
3. Abre http://localhost:8080 y selecciona un video MP4/WebM autorizado.
4. Carga subtítulos SRT/VTT en español y/o inglés y selecciona qué mostrar.

No abrir index.html con doble clic: los módulos requieren un servidor HTTP.

## Incluye
- Video local o enlace directo HTTP(S), controles nativos y errores de reproducción.
- Dos subtítulos simultáneos, selección de idioma y ajuste de tiempo.
- Pantalla completa del contenedor cuando el navegador lo permita.
- Diseño adaptable a celular. Los archivos locales no se suben a ningún servidor.

## Límites comprobables
No incluye episodios, scraping, catálogo remoto, HLS, conversión de codecs, cuentas ni salas sincronizadas. Un enlace a una página de anime no es un enlace de video. El formato y la reproducción dependen del navegador y del servidor de origen. En iOS la pantalla completa nativa puede omitir la capa de subtítulos. No se ha validado aún en los dispositivos de los usuarios.

## Supabase · etapa siguiente
Proyecto reservado: https://suvcdkqqwrodwxgmcjej.supabase.co . Esta versión no llama a Supabase ni crea tablas. Antes de añadir usuarios, progreso o salas: configurar Auth, tablas con RLS y acceso limitado a miembros de cada sala. No subir claves secretas ni service_role. La clave publicable se incorporará al implementar esa conexión.

## Validar
`npm test` ejecuta pruebas del parser de subtítulos (SRT/VTT, entradas solapadas e inválidas). `node --check app.js` comprueba sintaxis. Falta prueba de reproducción real en Android y Windows, enlaces externos y subtítulos largos.

## Próximas etapas
1. Validación de un capítulo completo con pistas ES/EN.
2. Autenticación y salas privadas, controles sincronizados y reconexión.
3. Fuentes autorizadas, catálogo e historial.
4. Integración opcional con Nuestro Universo tras aprobar las pruebas.

GitHub Pages puede servir estos archivos estáticos desde la raíz de la rama publicada. No se ha habilitado automáticamente.
