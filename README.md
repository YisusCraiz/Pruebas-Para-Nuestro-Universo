# AnimeJJ · Laboratorio
Pruebas independientes de Nuestro Universo.

## Abrir
https://yisuscraiz.github.io/Pruebas-Para-Nuestro-Universo/

Local: `python -m http.server 8080` o Live Server. No abrir index.html por file://.

## Cuenta
Solo usuario (3–24 letras ASCII, números o guion bajo) y contraseña (8–128 caracteres). No se distingue mayúsculas en el usuario. No requiere correo ni confirmación y entra automáticamente al crear cuenta. Guarda la contraseña: por ahora no hay recuperación por correo. Las cuentas antiguas por correo siguen pudiendo iniciar sesión escribiendo su correo en el campo de usuario; no se migran ni se borran automáticamente.

## Pantalla simple
- **Crear sala**: inicia sesión si es necesario; se crea antes de elegir el video. Comparte el código mostrado.
- **Unirse a sala**: escribe el código e inicia sesión con tu usuario. Solo admite anfitrión y un acompañante. Quien tenga el código puede ocupar la segunda plaza; no lo publiques.
- **Ver en solitario**: entra sin cuenta.

Dentro de la sala aparecen los usuarios y su estado de conexión (actualizado por latidos cada 10 s; desconexión estimada tras 35 s). Los iconos son provisionales, no personajes del Universo. El anfitrión elige un enlace directo HTTPS y controla el video; cada uno elige subtítulos y volumen. Los archivos locales son solo para modo solitario. Ajustes de subtítulos plegados por defecto.

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

Salas simplificadas: RPC animejj_room_action con autenticación obligatoria, código de 12 caracteres, ingreso atómico con bloqueo de fila y límite de intentos. Función privilegiada en esquema privado y envoltura pública sin privilegios elevados. Pruebas transaccionales: código generado, segunda plaza, rechazo de tercero y latidos sin alterar el reloj de reproducción. SQL aplicado conservado en supabase/simple-rooms.sql.
