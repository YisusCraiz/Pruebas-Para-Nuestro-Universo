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

## Fase 2: cuentas y sala para dos
El sitio usa Supabase Auth (correo y contraseña) y una tabla con RLS. No se usa service_role. El SDK se carga desde jsDelivr fijado a 2.57.4; no hay instalación de paquetes para servir la página.

### Preparación obligatoria en la cuenta alterna
La conexión administrativa actual no tiene acceso a ese proyecto. **El SQL aún no fue ejecutado.**
1. Abre https://supabase.com/dashboard/project/suvcdkqqwrodwxgmcjej/sql/new y ejecuta el contenido de `supabase/setup.sql`. Comprueba los resultados de las consultas finales.
2. En Authentication > Providers, habilita Email y mantén la confirmación de correo activa. No actives acceso anónimo para estas pruebas.
3. En Authentication > URL Configuration, configura Site URL y Redirect URLs con https://yisuscraiz.github.io/Pruebas-Para-Nuestro-Universo/ .
4. Crea ambas cuentas y confirma sus correos. Estas cuentas son de AnimeJJ, no las de Nuestro Universo.
5. Carga un enlace directo HTTPS autorizado, escribe el correo de la otra cuenta y crea sala. Copia la invitación. La otra persona inicia sesión y pulsa Entrar a la sala.

### Alcance y limitaciones
- Solo anfitrión e invitado por correo pueden leer la sala; solo anfitrión modifica video/estado. El UUID del enlace no concede acceso por sí solo. No cambien el correo de cuenta durante la prueba.
- El anfitrión controla reproducción, pausa y avance. El invitado puede elegir subtítulos y volumen propios.
- Se consulta el estado cada 3 s y se guarda una referencia cada 10 s al reproducir. No es sincronización exacta; depende del reloj de ambos dispositivos y de la red.
- Si el navegador bloquea el audio automático, pulsa Activar reproducción. Al volver a la pestaña se vuelve a consultar el estado.
- Las salas no transmiten archivos locales: ambos dispositivos cargan el mismo enlace. Los subtítulos no se comparten automáticamente.
- Las salas persisten hasta que su dueño las elimine en Supabase. No hay indicador de presencia, chat ni historial todavía.
- Falta validación SQL/RLS en la cuenta alterna y prueba real de dos usuarios/dispositivos. No se considera lista la integración con Nuestro Universo.
