# AnimeJJ · Laboratorio
Pruebas independientes de Nuestro Universo.

## Abrir
https://yisuscraiz.github.io/Pruebas-Para-Nuestro-Universo/

Local: `python -m http.server 8080` o Live Server. No abrir index.html por file://.

## Cuenta
Solo usuario (3–24 letras ASCII, números o guion bajo) y contraseña (8–128 caracteres). No se distingue mayúsculas en el usuario. No requiere correo ni confirmación y entra automáticamente al crear cuenta. Guarda la contraseña: por ahora no hay recuperación por correo. Las cuentas antiguas por correo siguen pudiendo iniciar sesión escribiendo su correo en el campo de usuario; no se migran ni se borran automáticamente.

## Ver juntos
1. Crea una cuenta o inicia sesión.
2. Carga un enlace directo HTTPS de un video autorizado que ambos puedan abrir.
3. Escribe el usuario de tu acompañante y crea la sala.
4. Copia la invitación. Tu acompañante entra con su cuenta y pulsa Entrar a la sala.
5. El anfitrión controla reproducción, pausa y avance. Cada persona carga sus subtítulos ES/EN (SRT/VTT) y elige idioma y volumen.

La sincronización consulta el estado cada 3 segundos y guarda referencias cada 10 segundos al reproducir; depende de red y relojes. No es exacta. Pulsa Activar reproducción si el navegador bloquea el audio. La sala no transmite archivos locales. Estos solo funcionan en el reproductor individual.

## Backend desplegado
Proyecto: suvcdkqqwrodwxgmcjej, cuenta PruebasX.
- Tabla animejj_rooms y RLS aplicadas. Solo anfitrión/invitado pueden leer; solo anfitrión controla estado.
- Función animejj-register desplegada: crea identidades Supabase Auth con identificador interno username@users.animejj.invalid. No es correo real. La API administrativa y claves privilegiadas solo se usan en servidor mediante secretos de Supabase.
- Registro público con validación de usuario/contraseña y contador atómico: máximo 20 intentos por hora para el proyecto. La clave publicable identifica la app y no es un secreto ni protección contra abuso por sí sola.
- Fuente del servidor en supabase/functions/animejj-register. Copia de las definiciones SQL en supabase/setup.sql y supabase/username-signup.sql. No hace falta volver a ejecutarlas en este proyecto.
- El SDK del navegador usa jsDelivr y versión fija 2.57.4.

## Validación
`npm test`; `node --check rooms.js`.
Se verificó en servidor registro, inicio de sesión y rechazo de usuario duplicado con cuenta temporal; pruebas de RLS para anfitrión, invitado y tercero en transacción revertida. Falta prueba de reproducción completa con dos dispositivos reales. No incluye catálogo, HLS, chat, presencia ni recuperación de contraseña. No se integra aún en Nuestro Universo.
