# API Transporte Público · Paraná

Esta es la API de nuestra aplicación para el Trabajo Final de **Desarrollo para Móviles (UNER)**.
Sale del pedido de Silvina Ferreyra, de la Dirección de Transporte de la Municipalidad de
Paraná (`docs/prd.pdf`): líneas, paradas, horarios de tabla, avisos de desvío y reportes de
demora de los pasajeros.

Devuelve **exactamente** los tipos del PRD, los mismos que están en `src/tipos/`. Al reemplazar
los mocks por `fetch`, los datos encajan sin modificar esos tipos. Los tipos que agrega la API
(el sobre de las respuestas, la sesión y los archivos) están en
[`contract/api.ts`](contract/api.ts).

> **Estado:** la API está completa: red (líneas, paradas, búsqueda, cercanas y QR), horarios
> (tabla, próximos y feriados), cuenta y favoritos, avisos con push, reportes de demora y la
> publicación en la nube. Los cambios, versión por versión, están en el [CHANGELOG](CHANGELOG.md).

Toda respuesta viene en un sobre:

```jsonc
// una lista
{ "datos": [ ... ], "meta": { "total": 14, "pagina": 1, "porPagina": 20 } }
// un solo recurso
{ "datos": { ... }, "meta": null }
// un error (el mensaje está pensado para mostrarlo tal cual en la pantalla)
{ "error": { "codigo": "PARADA_NO_ENCONTRADA", "mensaje": "No existe esa parada." } }
```

La documentación completa, con ejemplos y todos los errores de cada endpoint, está en
**`/docs`** (por ejemplo, <http://localhost:3000/docs>).

---

## 1. Con Docker: un solo comando (recomendado)

Con [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y
abierto, no hace falta instalar nada más. En la carpeta del proyecto:

```bash
docker compose up
```

La primera vez tarda unos minutos (arma la imagen). Al aparecer `La API está escuchando`,
la base se crea automáticamente y se cargan los datos de demo. La API puede verificarse en
<http://localhost:3000/salud>.

Para usar otro motor de base de datos:

| Comando | Qué levanta |
|---|---|
| `docker compose up` | API + SQLite |
| `docker compose -f compose.postgres.yaml up` | API + PostgreSQL 17 (en la compu, puerto 5433) |
| `docker compose -f compose.mysql.yaml up` | API + MySQL 8.4 (en la compu, puerto 3307) |
| `docker compose -f compose.mariadb.yaml up` | API + MariaDB 11 (en la compu, puerto 3308) |

Las bases quedan publicadas en puertos que no son los de siempre, así no chocan con una base
que ya esté instalada. Se pueden consultar con DBeaver (usuario `api`, contraseña `api`, base `api`).

Las fotos y los videos se guardan, por defecto, en un volumen de Docker. Para probar con
almacenamiento tipo Amazon S3 (como el que se usa en producción), se puede sumar el emulador a
cualquiera de los comandos anteriores:

```bash
docker compose -f compose.yaml -f compose.storage-s3.yaml up
docker compose -f compose.postgres.yaml -f compose.storage-s3.yaml up
```

(Hay otro, `compose.storage-localstack.yaml`, que pide una cuenta gratis de LocalStack y la
variable `LOCALSTACK_AUTH_TOKEN`; con el de S3 alcanza.) La app no nota la diferencia.

- **Frenar:** `Ctrl + C`, o `docker compose down` desde otra terminal.
- **Volver a cero** (borra la base y las fotos, y la próxima vez se vuelven a cargar los
  datos de demo): `docker compose down -v` y después `docker compose up`.
- **Otro puerto:** `PUERTO=4000 docker compose up`.

## 2. Sin Docker, con SQLite

Se necesita **Node 24** y **pnpm**.

1. Instalar Node 24 desde <https://nodejs.org> (la versión LTS). Con `nvm`, alcanza con ejecutar
   `nvm use` en la carpeta del proyecto.
2. Activar pnpm, incluido con Node: `corepack enable`.

Después, en la carpeta del proyecto:

```bash
pnpm install
pnpm db:reiniciar
pnpm dev
```

`pnpm db:reiniciar` crea la base (un archivo en `datos/api.sqlite`) y carga los datos de
demo. `pnpm dev` levanta la API en el puerto 3000 y se reinicia automáticamente al cambiar el código.

La configuración está en un archivo `.env`. Si no existe, se usan los valores por defecto.
Para cambiarla, se puede copiar `.env.example` como `.env` y editarlo: cada variable tiene un
comentario que explica para qué sirve.

## 3. Sin Docker, con PostgreSQL, MySQL o MariaDB instalados

1. Crear una base vacía (por ejemplo `transporte`), con el juego de caracteres `utf8mb4` si
   es MySQL o MariaDB.
2. En el `.env`, indicá el motor y los datos de conexión:

   ```bash
   # PostgreSQL
   DB_MOTOR=postgres
   DB_URL=postgres://usuario:contraseña@localhost:5432/transporte

   # MySQL
   DB_MOTOR=mysql
   DB_URL=mysql://usuario:contraseña@localhost:3306/transporte

   # MariaDB
   DB_MOTOR=mariadb
   DB_URL=mysql://root:@localhost:3306/transporte
   ```

3. `pnpm db:reiniciar` y `pnpm dev`.

> ⚠️ **XAMPP instala MariaDB, no MySQL**, aunque el panel diga "MySQL". Configurá
> `DB_MOTOR=mariadb`: con `mysql` contra un servidor MariaDB la API no queda estable.

Si la contraseña tiene caracteres especiales, codificalos con `%`: `@` → `%40`, `#` → `%23`,
`/` → `%2F`.

## 4. Conectarte desde el teléfono

El teléfono con Expo Go **no llega a `localhost`**: `localhost` en el teléfono es el propio
teléfono. La conexión debe realizarse mediante la IP de la computadora.

1. El teléfono y la computadora tienen que estar en **la misma red wifi**.
2. Al arrancar, la API imprime las direcciones que encontró, por ejemplo
   `Desde el teléfono (misma red wifi): http://192.168.0.10:3000`. Con Docker no las puede
   ver: consultar la IP de la computadora (en Windows `ipconfig`, en Mac y Linux
   `ifconfig` o en la configuración de red) y usar esa dirección.
3. Abrir `http://<esa IP>:3000/salud` **en el navegador del teléfono**. Si aparece
   `"estado":"ok"`, la app también va a llegar.
4. Si no llega:
   - **Windows:** la primera vez que arranca, Windows pregunta si dejar pasar a Node por el
     firewall. Debe estar permitido en **redes privadas**, y la wifi debe estar
     marcada como red privada.
   - Los **antivirus** (Avast, ESET, Kaspersky…) suelen tener su propio firewall: habilitar
     el puerto 3000 o verificá temporalmente si el firewall impide la conexión.
   - Las redes de la facultad y algunas públicas aíslan los dispositivos entre sí. En ese caso,
     se puede probar con el hotspot del teléfono.

La app recibe la dirección de la API mediante `EXPO_PUBLIC_API_URL`. Para una prueba en un
teléfono, se configura con la IP de la computadora; los pasos están en
[`../frontend/README.md`](../frontend/README.md).

Las URLs de las fotos y los videos que devuelve la API se arman con la misma dirección que
usó el teléfono, así que funcionan sin configurar nada.

## 5. Usuarios de demo

Todas las cuentas tienen la contraseña **`demo1234`**.

| Email | Rol | Para qué sirve |
|---|---|---|
| `julian@mail.com` | pasajero | Julián Ferrari, el del PRD (`usr-320`). |
| `nuevo@demo.ar` | pasajero | Una cuenta sin nada: para ver las listas vacías. |
| `transporte@parana.demo.ar` | Dirección de Transporte | Publica avisos y ve el resumen de reportes. |

Se pueden crear más cuentas con `POST /auth/registro`: siempre son de pasajero.

**Cómo se usa la sesión:** `POST /auth/ingreso` devuelve un `token`. Guardalo con
`expo-secure-store` (nunca en `kv-store`) y mandalo en cada pedido que lo necesite:

```ts
fetch(`${API}/yo`, { headers: { Authorization: `Bearer ${token}` } });
```

El token dura **30 días**. Cuando vence, la API responde `401 NO_AUTENTICADO` y hay que
volver a ingresar.

## 5.1. Qué hay en los datos de demo

Al arrancar (o con `pnpm db:reiniciar`) la API carga una red de demo verosímil de
Paraná. Los ids de los ejemplos del PRD son los mismos para facilitar la comparación con
las pantallas del documento.

| Qué | Cuánto | Detalle |
|---|---|---|
| Líneas | 14 | `lin-05` es "Puerto Viejo — San Agustín" (la del PRD). Las 5 y 14 tienen ida y vuelta completas, con paradas **distintas** en cada sentido. |
| Paradas | 73 | `par-101` es Alameda y Urquiza. También están Almafuerte y Newbery y la zona de calle Corrientes. |
| Horarios | miles | De tabla, generados por frecuencia: primer servicio 05:20, último hacia las 23:00, con frecuencias distintas en hábiles, sábados, domingos y feriados. `hor-4410` es el del PRD. |
| Feriados | 2026 y 2027 | Nacionales, de la fuente oficial. |
| Avisos | 5 | `avi-088` es el desvío por obra en Corrientes (con trazado alternativo y video). |
| Reportes | 5 | `rep-3390` es el del PRD (no pasó, 2 confirmaciones). |

Las fechas de avisos y reportes son **relativas a "ahora"**: siempre hay avisos vigentes,
uno próximo y uno terminado, aunque levantes la API otro día o congeles el reloj.

**Los casos feos que el PRD pide probar, y dónde encontrarlos:**

| Caso | Dónde |
|---|---|
| Se terminó el servicio del día | La línea `lin-13` termina a las 21:00. Con `RELOJ_FIJO=2026-09-18T22:00:00-03:00`, `GET /paradas/<cabecera>/proximos?lineaId=lin-13` sólo trae servicios de mañana (se reconocen porque su `hora` es menor que la actual). |
| Una línea con desvío | `avi-088` (líneas 2, 7 y 9), con `trazadoAlternativo` y `videoUrl`. |
| Un aviso sin video | `avi-089` (`informativo`, sin fecha de fin) y los demás, salvo `avi-088`. |
| Un aviso de suspensión | `avi-090`: la unidad descompuesta en Almafuerte y Newbery (línea 8). |
| Un aviso próximo y uno terminado | `avi-091` (empieza en tres días) y `avi-092` (ya terminó): `GET /avisos?estado=todos`. |
| Una línea inactiva | `lin-11`: no tiene servicio y no aparece en los próximos. |
| Paradas sin refugio, y con y sin QR | `par-103` y `par-106` no tienen refugio; `par-104` y `par-108` no tienen QR. |
| Una lista vacía | Ingresá con `nuevo@demo.ar` (sin favoritos) o consultá los reportes de una parada que no tiene (todas salvo `par-101`). |
| Un reporte con foto | `rep-3394` (la foto se baja de `/archivos/...`). |
| Un reporte viejo | `rep-3393`: pasaron más de 90 minutos, no se lista ni se puede confirmar. |
| Un feriado que cae sábado | 20 de junio de 2026 (Belgrano): usa la tabla de feriado. |
| Un error de red | Cabecera `X-Simular: error-500` (sección 8). |

El video y la foto de demo están generados en el código (sin derechos de terceros): el video
es un MP4 mínimo, sirve para probar la descarga y el `Range`, pero no tiene imagen. Para ver
una imagen real, se puede subir un clip con `POST /archivos`.

## 6. Endpoints

`🌐` público (no hace falta cuenta) · `🔒` con sesión · `🛠` sólo la Dirección de Transporte.

<!-- endpoints:inicio -->
| Método | Ruta | Acceso | Qué hace |
|---|---|---|---|
| `POST` | `/archivos` | 🔒 con sesión | Subir una foto, un audio o un video |
| `GET` | `/archivos/:clave` | 🌐 público | Descargar un archivo |
| `GET` | `/salud` | 🌐 público | ¿Anda la API? |
| `GET` | `/lineas` | 🌐 público | Las líneas, con sus recorridos |
| `GET` | `/lineas/:id` | 🌐 público | Detalle de una línea |
| `GET` | `/paradas` | 🌐 público | Paradas: búsqueda, por línea y cercanas |
| `GET` | `/paradas/qr/:codigo` | 🌐 público | Resolver el QR de una parada |
| `GET` | `/paradas/:id` | 🌐 público | Detalle de una parada |
| `GET` | `/horarios` | 🌐 público | Tabla de horarios de una línea o de una parada |
| `GET` | `/paradas/:id/proximos` | 🌐 público | Próximos pasos de las líneas por una parada |
| `GET` | `/feriados` | 🌐 público | Feriados de un año |
| `GET` | `/avisos` | 🌐 público | Avisos de la Dirección de Transporte |
| `POST` | `/avisos` | 🛠 direccion | Publicar un aviso |
| `GET` | `/avisos/:id` | 🌐 público | Detalle de un aviso |
| `PATCH` | `/avisos/:id` | 🛠 direccion | Editar un aviso |
| `POST` | `/avisos/:id/finalizar` | 🛠 direccion | Terminar un aviso ahora |
| `GET` | `/reportes-demora` | 🌐 público | Reportes recientes de una parada o una línea |
| `POST` | `/reportes-demora` | 🔒 con sesión | Reportar una demora |
| `GET` | `/reportes-demora/resumen` | 🛠 direccion | Resumen de reportes para la Dirección |
| `POST` | `/reportes-demora/:id/confirmaciones` | 🔒 con sesión | Confirmar un reporte |
| `POST` | `/auth/registro` | 🌐 público | Crear una cuenta de pasajero |
| `POST` | `/auth/ingreso` | 🌐 público | Ingresar con email y contraseña |
| `GET` | `/yo` | 🔒 con sesión | Mi cuenta |
| `PATCH` | `/yo` | 🔒 con sesión | Cambiar mi nombre, los avisos o el tema |
| `PUT` | `/yo/lineas-favoritas/:lineaId` | 🔒 con sesión | Agregar una línea a favoritas |
| `DELETE` | `/yo/lineas-favoritas/:lineaId` | 🔒 con sesión | Quitar una línea de favoritas |
| `PUT` | `/yo/paradas-favoritas/:paradaId` | 🔒 con sesión | Agregar una parada a favoritas |
| `DELETE` | `/yo/paradas-favoritas/:paradaId` | 🔒 con sesión | Quitar una parada de favoritas |
| `POST` | `/dispositivos` | 🔒 con sesión | Registrar el token de push del teléfono |
| `POST` | `/dispositivos/prueba` | 🔒 con sesión | Mandarme una push de prueba |
| `DELETE` | `/dispositivos/:tokenExpo` | 🔒 con sesión | Dar de baja el token de push del teléfono |
<!-- endpoints:fin -->

### Subir fotos, audios y videos

Los archivos se suben **antes** que el recurso: primero `POST /archivos` (con sesión,
`multipart/form-data`, campo `archivo`), que devuelve la `url`; después se envía esa `url`
en el recurso (por ejemplo, en `fotoUri` de un reporte). Así, la cola sin conexión sube la
foto cuando vuelve la señal y luego envía el reporte.

```ts
const formulario = new FormData();
formulario.append('archivo', { uri: foto.uri, name: 'foto.jpg', type: 'image/jpeg' } as any);
const r = await fetch(`${API}/archivos`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formulario,
});
const { datos } = await r.json(); // { url, tipo: "imagen", bytes }
```

Límites: fotos jpeg, png o webp hasta 5 MB; audio m4a, aac o mp3 hasta 10 MB; video mp4
hasta 30 MB. Los videos se pueden reproducir con `expo-video` directo desde la URL.

### Notificaciones push

> **Esta parte la completan ustedes.** Guardar los tokens y mandar las push no vienen hechos:
> `POST /dispositivos`, `POST /dispositivos/prueba` y `DELETE /dispositivos/:tokenExpo` responden
> `501 NO_IMPLEMENTADO` hasta que los programen. Guía y pistas en
> [`docs/NOTIFICATIONS.md`](docs/NOTIFICATIONS.md); para comprobar su trabajo, `pnpm test:notificaciones`.

1. Pedí permiso y obtené el token con `expo-notifications`.
2. Registralo: `POST /dispositivos` con `{ "tokenExpo": "ExponentPushToken[…]", "plataforma": "android" }`.
3. Prueba: `POST /dispositivos/prueba` envía una notificación al dispositivo registrado.
4. Al cerrar sesión: `DELETE /dispositivos/<tokenExpo>`.

La API manda push sólo cuando pasa algo en el servidor (por ejemplo, un aviso nuevo en una
línea favorita) y sólo si la persona tiene `avisosActivos: true`. Los recordatorios del
tipo "avisame 10 minutos antes del de las 7:15" son **notificaciones locales** que programa
la app: la API no las manda.

### Horarios y feriados

- `GET /horarios` necesita `lineaId` o `paradaId`. Descargá la tabla entera con `porPagina=5000` y
  guardala en el teléfono para que esté disponible sin señal.
- Para elegir la tabla (`habil`, `sabado`, `domingo` o `feriado`) sin conexión, guardar también
  `GET /feriados?anio=2026` y `?anio=2027`. **`Feriado` no está en el PRD:** está en
  [`contract/api.ts`](contract/api.ts). Un feriado gana sobre el sábado y el domingo.
- `GET /paradas/:id/proximos` devuelve los siguientes pasos de cada línea. Si ya no hay más
  servicio hoy, vienen los de mañana a primera hora, con el `tipoDeDia` de mañana: se
  reconocen porque su `hora` es menor que la hora de ahora.
- La API no sabe dónde está cada colectivo: son horas de tabla.

## 7. Errores

Todo error viene como `{ "error": { "codigo", "mensaje" } }`. El **código** no cambia nunca:
usalo para decidir qué hacer. El **mensaje** está en castellano y se puede mostrar tal cual.

<!-- errores:inicio -->
| Código | HTTP | Mensaje |
|---|---|---|
| `VALIDACION_FALLIDA` | 400 | Revisá los datos que mandaste. |
| `CREDENCIALES_INVALIDAS` | 401 | El email o la contraseña no son correctos. |
| `NO_AUTENTICADO` | 401 | Tenés que ingresar con tu cuenta. |
| `SIN_PERMISO` | 403 | No tenés permiso para hacer esto. |
| `ARCHIVO_NO_ENCONTRADO` | 404 | No encontramos ese archivo. |
| `AVISO_NO_ENCONTRADO` | 404 | No existe ese aviso. |
| `LINEA_NO_ENCONTRADA` | 404 | No existe esa línea. |
| `PARADA_NO_ENCONTRADA` | 404 | No existe esa parada. |
| `QR_NO_RECONOCIDO` | 404 | Ese código no es de una parada de Paraná. |
| `REPORTE_NO_ENCONTRADO` | 404 | No encontramos ese reporte. |
| `RUTA_NO_ENCONTRADA` | 404 | Esa dirección no existe en la API. |
| `EMAIL_YA_REGISTRADO` | 409 | Ya hay una cuenta con ese email. |
| `ID_EN_USO` | 409 | Ese identificador ya está en uso. |
| `REPORTE_YA_ENVIADO` | 409 | Ya avisaste de esta línea en esta parada hace un rato. |
| `ARCHIVO_DEMASIADO_GRANDE` | 413 | El archivo es demasiado grande. |
| `TIPO_DE_ARCHIVO_NO_PERMITIDO` | 415 | Ese tipo de archivo no está permitido. Mandá una foto, un audio o un video. |
| `RANGO_NO_VALIDO` | 416 | No se puede enviar esa parte del archivo. |
| `ARCHIVO_NO_SUBIDO` | 422 | Primero hay que subir la foto o el video. |
| `CONFIRMACION_PROPIA` | 422 | No podés confirmar tu propio reporte. |
| `FECHA_EN_EL_FUTURO` | 422 | La fecha del reporte no puede ser posterior a este momento. |
| `LINEA_NO_PARA_EN_PARADA` | 422 | Esa línea no para en esta parada. |
| `REPORTE_VENCIDO` | 422 | Ese reporte ya es viejo para confirmarlo. |
| `ERROR_INTERNO` | 500 | Algo salió mal. Probá de nuevo en un rato. |
| `NO_IMPLEMENTADO` | 501 | Esta parte la programan ustedes. Mirá docs/NOTIFICATIONS.md. |
| `ALMACEN_NO_DISPONIBLE` | 503 | No pudimos acceder a los archivos. Probá de nuevo en un rato. |
<!-- errores:fin -->

## 8. Probar errores, demoras y horarios

Nuestra app debe mostrar correctamente los errores de red y los estados de carga. Para probarlos
sin apagar el wifi, se puede enviar la cabecera `X-Simular` en cualquier pedido:

| Cabecera | Qué pasa |
|---|---|
| `X-Simular: error-500` | Responde `500 ERROR_INTERNO`. |
| `X-Simular: demora-3000` | Responde bien, pero 3 segundos tarde (hasta 30000). |

Anda con `SIMULACION_HABILITADA=true`, que es lo que viene en desarrollo y en Docker.

**Congelar el reloj:** con `RELOJ_FIJO=2026-11-14T22:00:00-03:00` en el `.env` (o
`RELOJ_FIJO=… docker compose up`), la API cree que siempre es ese momento. Sirve para ver
qué muestra la app cuando ya pasó el último colectivo del día, o durante un sábado o un feriado.

La API incluye en cada respuesta la cabecera `Date` con la hora del servidor; sirve para
indicar "información de hace 2 horas" al mostrar datos guardados.

## 9. Volver los datos al estado inicial

- Sin Docker: `pnpm db:reiniciar` (borra todo, crea las tablas y carga los datos de demo).
  Contra una base en la nube pide `--confirmar`.
- Con Docker: `docker compose down -v` y `docker compose up`.

## 10. Problemas frecuentes

| Lo que pasa | Qué hacer |
|---|---|
| La API no arranca y dice qué variable falta | El mensaje indica qué variable falta. Copiar `.env.example` como `.env`. |
| El teléfono no llega a la API | Consultá la sección 4: misma wifi, IP de la computadora y firewall. |
| `Network request failed` en Android con `http://` | Expo Go permite `http`; en un build propio hay que habilitar el tráfico sin cifrar o usar la API publicada con `https`. |
| `401 NO_AUTENTICADO` | Falta `Authorization: Bearer <token>`, o el token venció (30 días): iniciá sesión nuevamente. |
| `pnpm install` se queja de `better-sqlite3` | Usar Node 24. En Windows, si igual falla, instalar las "Build Tools" de Visual Studio o usar Docker. |
| `EADDRINUSE` (el puerto está ocupado) | Ya hay algo en el 3000 (¿otra API corriendo?). Cerrar ese proceso o usar `PUERTO=4000`. |
| Con XAMPP la base se comporta raro | Configurar `DB_MOTOR=mariadb` (sección 3). |
| Docker: `port is already allocated` | Otro programa usa ese puerto: `PUERTO=4000 docker compose up`. |
| Publicada, la primera llamada tarda más de un minuto | Es normal en el plan gratis de Render: el servicio se duerme a los 15 minutos sin uso. La app debe mostrar "cargando" (sección 11). |
| Supabase: la API no se conecta después de unos días | El plan gratis **pausa el proyecto** tras una semana sin uso: reactivar el proyecto desde el panel de Supabase. |
| `No pudimos acceder a los archivos` (`ALMACEN_NO_DISPONIBLE`) | Ejecutá `pnpm archivos:probar`: el resultado indica si fallan las credenciales, el bucket o la región. |
| Consultar la base por dentro | Con Docker, conectar DBeaver a los puertos de la sección 1. Con SQLite, abrir `datos/api.sqlite`. |

## 11. En la nube: publicar la API

Con Docker o con `pnpm dev` la API corre en la computadora local. Para el **build de producción con
EAS** se necesita una dirección `https://` accesible desde cualquier red: una app instalada no puede
apuntar a una IP local. La combinación gratuita y sin tarjeta utilizada:

| Pieza | Servicio |
|---|---|
| La API (la imagen del `Dockerfile`) | **Render**, web service |
| La base de datos | **Supabase** (PostgreSQL) |
| Las fotos y los videos | **Supabase Storage** |

Alternativas que también entran: Koyeb para la API; Neon o Aiven para la base; Cloudflare R2,
Backblaze B2 o Amazon S3 para los archivos. Se elige con variables de entorno, sin tocar código.

### Paso a paso con Render + Supabase

1. **Supabase**: crear un proyecto en <https://supabase.com> y guardar la contraseña de la base.
2. **La base**: en el proyecto, botón **Connect** → **Session pooler** → copiar la cadena e ingresar la
   contraseña. Tiene que tener `…pooler.supabase.com` y el puerto **5432**. (No sirve la conexión
   directa, que es sólo IPv6, ni la del puerto 6543: la API informa si la conexión es incorrecta.)
3. **El bucket**: **Storage** → **New bucket** → asignar el nombre `archivos` (privado).
4. **Las claves de archivos**: **Storage** → **S3 Connection** → **New access key**. Anotar
   `Access key ID`, `Secret access key` y la **Region** del proyecto.
5. **Render**: <https://render.com> → **New** → **Blueprint** → seleccioná el repositorio del grupo.
   Render lee `render.yaml` y solicita los datos que faltan:

   | Variable | Qué poner |
   |---|---|
   | `DB_URL` | la cadena del paso 2 |
   | `SUPABASE_PROYECTO` | las letras de `https://<proyecto>.supabase.co` |
   | `S3_REGION` | la región del paso 4 (por ejemplo `sa-east-1`) |
   | `S3_BUCKET` | `archivos` |
   | `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | las del paso 4 |

   `JWT_SECRETO` lo genera Render solo.
6. Esperar el primer deploy (unos minutos). La API crea las tablas en el esquema `api` y carga los
   datos de demo sola.
7. **Verificación** desde una terminal: `pnpm publicado:probar https://api-publicada.onrender.com`.
   Revisá `/salud`, la presencia de datos y que las URLs de los archivos usen `https://` y respondan.

> También se puede usar el botón
> `https://render.com/deploy?repo=https://github.com/<organizacion>/<repositorio>`.

### Cosas que conviene saber

- **Arranque en frío:** el servicio gratis de Render se **duerme a los 15 minutos** sin tráfico y
  tarda alrededor de un minuto en despertar. La primera llamada puede tardar: la app tiene que
  mostrar que está cargando (el PRD ya lo pide).
- **Supabase pausa el proyecto** después de una semana sin uso (plan gratis). Se reactiva desde el panel.
- **Neon** suspende la base a los 5 minutos sin uso: la primera conexión tarda un poco más.
  **Aiven** apaga el servicio gratis tras un tiempo sin uso y avisa por mail.
- **La base gratis de Render** vence a los 30 días: por eso no la usamos.
- Con `ENTORNO=publicado` la API **no arranca** si dejaste SQLite, archivos en disco, el
  `JWT_SECRETO` de desarrollo (o uno de menos de 32 caracteres) o la simulación de errores. El
  mensaje dice qué cambiar.
- Los archivos subidos se ven siempre por `https://<api-publicada>/archivos/…`: la app no sabe dónde están guardados.
- Para volver los datos de demo a cero en la nube: `pnpm db:reiniciar --confirmar` con el `.env`
  apuntando a esa base. Borra **sólo el esquema `api`**, nunca otros (en Supabase conviven `auth`, `storage`…).

### Verificar la configuración antes de publicar

Indicá las variables en el `.env` (el `.env.example` trae un bloque por proveedor y explica
dónde conseguir cada dato) y ejecutá:

| Comando | Qué hace |
|---|---|
| `pnpm db:probar` | Se conecta a la base, muestra motor y esquema, crea y borra una tabla de prueba. Si falla, dice por qué (contraseña, pooler equivocado, certificado). |
| `pnpm archivos:probar` | Sube un archivo chico al proveedor, lo lee entero y por rango, y lo borra. Si falla, dice si es el bucket, las credenciales o la región. |
| `pnpm publicado:probar <url>` | Lo de arriba, pero contra la API ya publicada. |

Variables de la base: `DB_PROVEEDOR` (`supabase`, `neon`, `aiven-postgres`, `aiven-mysql`), `DB_URL`,
`DB_SSL` (`no`, `si`, `si-sin-verificar`), `DB_SSL_CA` y `DB_ESQUEMA`. Variables de los archivos:
`ARCHIVOS_PROVEEDOR` (`local`, `supabase`, `aws`, `r2`, `b2`, `s3proxy`, `localstack`) y sus `S3_*`.
Si el servidor rechaza el certificado, el mensaje de la API indica si corresponde usar
`DB_SSL=si-sin-verificar` o configurar la CA en `DB_SSL_CA`.

---

Para la cátedra: las reglas de construcción están en `AGENTS.md`, la especificación del
proyecto en `docs/SPECIFICATION.md` y las decisiones sobre los huecos del PRD en
`docs/DECISIONS.md`. `pnpm verificar` corre tipos, lint y todos los tests;
`pnpm test:e2e:matriz` corre los e2e contra los cuatro motores (y los archivos contra S3Proxy) y
`pnpm docker:probar` prueba los compose.

## Equipo

- Luciano Cirvini
- Sofia Guardia
- Mariano Jimenez
- Macarena Schefer
