# Transekur · Llego en 10

Demo independiente para la prueba de AI Product Engineer. Despacho crea y asigna
servicios; cada chofer ve sus servicios del día y emite un aviso; cliente y
despacho lo consultan en pantalla. Todos los datos de ejemplo son ficticios.

**Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, PostgreSQL, `pg`,
Argon2id y SWR. Sin ORM ni proveedores de mensajería.

## Probar el flujo

1. Entrar como `despacho`, pulsar **Crear servicio** y asignarlo a Carlos.
2. Abrir **Ver aviso** para observar la vista del cliente pendiente.
3. En otro navegador o ventana privada, entrar como `carlos`.
4. Pulsar **Llego en 10** en el servicio.
5. Cliente y despacho mostrarán el aviso en un máximo aproximado de cinco
   segundos, con la hora de emisión. Recargar conserva el resultado.
6. Entrar como `miguel` para comprobar que ve únicamente sus asignaciones.

Las tres cuentas usan la contraseña definida en `DEMO_PASSWORD` al ejecutar la
carga inicial. Defínela en `.env` (mínimo 12 caracteres) y no la subas al
repositorio. No hay registro público. Volver a ejecutar el seed **no cambia**
contraseñas existentes ni borra avisos.

## Desarrollo local

Requisitos: Node.js 22 LTS, npm y PostgreSQL 14 o superior.

```sh
cp .env.example .env
npm ci
```

Configurar `DATABASE_URL` para una base de datos vacía existente. Para HTTP local,
usar `APP_ORIGIN=http://localhost:3000` y `COOKIE_SECURE=false`.

```sh
npm run db:migrate
npm run db:seed
npm run dev
```

Abrir [localhost:3000](http://localhost:3000). Las fuentes Manrope y el logo se
sirven localmente, sin peticiones a Google Fonts ni dependencias externas de UI.

## Docker Compose

1. Copiar `.env.example` a `.env`.
2. Definir `POSTGRES_USER`, `POSTGRES_DB` y una contraseña fuerte en
   `POSTGRES_PASSWORD`. Usar una contraseña hexadecimal generada, por ejemplo con
   `openssl rand -hex 24`, para no requerir escape en la URL de conexión.
3. Definir `APP_ORIGIN` con el origen exacto, sin rutas: `https://demo.example.com`.
4. En HTTPS configurar `COOKIE_SECURE=true`. Para probar localmente por HTTP,
   establecer explícitamente `false`.
5. Elegir `DEMO_PASSWORD` para las cuentas ficticias.

```sh
docker compose up -d --build
docker compose --profile tools run --rm seed
docker compose ps
docker compose logs --tail=100 app migrate
```

Compose construye la conexión a PostgreSQL con las variables `POSTGRES_*`;
`DATABASE_URL` del archivo `.env` solo se usa al ejecutar scripts fuera de Docker.
La base no publica puertos. La aplicación escucha en `127.0.0.1:3000` del host.
Las migraciones terminan antes de arrancar la aplicación; el seed es manual.

El runtime de la aplicación corre como usuario `node`. El contenedor de
herramientas incluye dependencias de desarrollo para migrar y cargar datos, pero
no se usa como servidor web. Las imágenes usan las ramas mantenidas Node 22 y
PostgreSQL 17; los paquetes npm se fijan con versión exacta y lockfile.

### VPS y HTTPS

El dominio y proxy se configuran al desplegar. Si el proxy corre en el host,
dirigirlo a `127.0.0.1:3000`. Si corre en Docker, conectar el servicio `app` a su
red y dirigirlo a `app:3000`; no publicar PostgreSQL. Terminar TLS en el proxy,
preservar el host y habilitar límites de petición razonables.

`APP_ORIGIN` debe coincidir con el origen desde el que se abre la demo; de lo
contrario se rechazan las operaciones de escritura. No publicar con cookies
inseguras ni reutilizar contraseñas de otros sistemas.

### Actualizar y comprobar persistencia

```sh
docker compose build
docker compose run --rm migrate
docker compose up -d
docker compose restart app db
```

Después del reinicio, los servicios y avisos deben seguir visibles. El volumen
`postgres_data` conserva PostgreSQL. No usar `docker compose down -v` salvo que
se quiera borrar la base de datos.

### Copia y restauración

Crear un respaldo antes de aplicar nuevas migraciones:

```sh
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > transekur.dump
```

Para restaurar, usar una base vacía separada y comprobar primero el respaldo.
Ejemplo con una base `transekur_restore`:

```sh
docker compose exec -T db sh -c 'createdb -U "$POSTGRES_USER" transekur_restore'
docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d transekur_restore' < transekur.dump
```

## Arquitectura y decisiones

- **SQL parametrizado:** acceso a PostgreSQL únicamente desde el servidor mediante
  un pool de `pg`. No se interpolan datos de solicitudes dentro del SQL.
- **Migraciones:** archivos SQL ordenados en `db/migrations`, aplicados en una
  transacción con bloqueo asesor. Cada archivo tiene un checksum; modificar una
  migración ya aplicada causa un error. Los cambios siguientes son nuevos archivos.
- **Autorización:** cada endpoint comprueba sesión y rol. La consulta de avisos
  exige que el servicio pertenezca al chofer y corresponda al día actual.
- **Sesiones:** 24 horas, token aleatorio de 256 bits; solo se guarda su SHA-256.
  Cookies HttpOnly, SameSite=Lax y Secure con HTTPS. Cerrar sesión revoca el token.
- **Acceso:** contraseñas Argon2id, mensajes genéricos y contadores persistidos.
  Límite de 10 intentos por usuario y 200 globales en ventanas de 15 minutos.
  El límite global es una decisión sencilla para una demo pequeña, no una
  protección completa para un servicio público de gran escala.
- **Aviso idempotente:** índice único de `notices.service_id` y
  `INSERT ... ON CONFLICT DO NOTHING`. Un reintento recupera el mensaje y hora
  originales, incluso con solicitudes concurrentes.
- **Fechas:** UTC en PostgreSQL (`timestamptz`) y presentación en
  `America/Santo_Domingo`, UTC−4. La hora de llegada es una estimación manual.
- **Enlace de cliente:** token aleatorio de 192 bits. Quien tenga el enlace puede
  ver ese aviso; no hay índice público, teléfono ni listado de otros servicios.
  No se simula una confirmación de recepción por SMS.
- **React:** Server Components para carga inicial; componentes cliente para
  formularios y acciones. SWR deduplica el refresco cada cinco segundos y lo
  pausa con la pestaña oculta. Sin caché compartida de datos privados.
- **Diseño:** logo original, Manrope local y blanco/gris/naranja. Tabla para
  despacho, tarjetas táctiles para chofer y mensaje central para cliente.

### Interfaces HTTP

| Método y ruta                       | Acceso                          | Comportamiento                                       |
| ----------------------------------- | ------------------------------- | ---------------------------------------------------- |
| `POST /api/login`                   | Público + origen válido         | Usuario/contraseña → cookie y destino                |
| `POST /api/logout`                  | Origen válido                   | Revocar sesión y borrar cookie                       |
| `GET /api/services?date=YYYY-MM-DD` | Autenticado                     | Despacho por fecha; chofer solo sus servicios de hoy |
| `POST /api/services`                | Despacho + origen válido        | Crear servicio con chofer y vehículo                 |
| `POST /api/services/:id/notice`     | Chofer asignado + origen válido | Emitir o recuperar aviso único                       |
| `GET /api/notices/:token`           | Poseedor del enlace             | Aviso, chofer y vehículo; nunca teléfono             |
| `GET /api/health`                   | Público                         | `200` si PostgreSQL responde; `503` si no            |

El formulario de creación envía `clientName`, `phone`, `pickup`, `date`, `time`
y `driverId`. Errores HTTP: 400 para datos inválidos, 401 para sesión ausente,
403 para rol/origen no permitido, 404 para recurso no accesible y 429 para límite
de acceso. Las respuestas incluyen `{ error: "mensaje" }`.

## Pruebas

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
```

Crear una base **separada y desechable** cuyo nombre termine en `_test`, configurar
`TEST_DATABASE_URL` y ejecutar:

```sh
npm run test:e2e
```

La suite aplica migraciones y **vacía exclusivamente la base de pruebas** antes
de cargar datos. Ejecuta el build de producción en el puerto 3100. Rechaza bases
cuyo nombre no termine en `_test`.

Cubre recorrido UI, permisos, concurrencia, privacidad, origen, caducidad,
cierre de sesión, validaciones, límites horarios y refresco en segundo plano.
Capturas y trazas quedan en `test-results/`; informe en `playwright-report/`.

## Herramientas e IA

Se usó Codex para implementar, revisar y probar el proyecto. Skills utilizadas:

- `frontend-design` de Anthropic: dirección visual, tokens y revisión de pantallas.
- `vercel-react-best-practices`: separación servidor/cliente, autorización,
  consultas independientes, datos mínimos y deduplicación.

La aplicación no llama modelos de IA ni necesita claves de un proveedor de IA.
La IA ayudó al desarrollo; el funcionamiento del aviso es determinista.

## Alcance

Incluye login, creación/asignación, agenda, aviso persistido y vista de cliente.
No incluye iLimo, GPS, SMS/WhatsApp, pagos, administración de cuentas, edición o
reasignación de servicios ni «Llegué». Los correos de seguimiento no se envían
automáticamente. El guion del video está en `docs/video-script.md`.
