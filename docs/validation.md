# Verificación de la implementación

Fecha: 20 de octubre de 2026.

## Comprobado localmente

- Compilación de producción de Next.js y servidor standalone.
- TypeScript sin errores.
- 4 pruebas de fechas: medianoche dominicana, límites de día, fechas inválidas y formato horario.
- 9 pruebas de navegador/API con Chromium y PostgreSQL real:
  - Acceso, despacho y diseño móvil sin desbordamiento horizontal.
  - Crear servicio → chofer asignado → aviso del cliente → hora en despacho.
  - Permisos por rol y chofer, servicios del día y enlaces públicos sin teléfono.
  - Ocho solicitudes simultáneas producen un solo aviso con la misma hora.
  - Validación de formularios, sesiones caducadas y revocación al salir.
  - Consultas parametrizadas y límite de intentos de acceso.
  - Inclusión/exclusión correcta en los límites del día dominicano.
  - Refresco pausado con pestaña oculta, sin petición inicial duplicada.
  - Estados vacíos, enlaces inválidos y error de envío recuperable.
- Comprobaciones axe de WCAG A/AA en acceso, despacho, formulario, chofer y aviso.
- Revisión visual de capturas de escritorio y móvil, incluido el logo y el título móvil.
- Migraciones y seed repetidos sin duplicar servicios ni modificar contraseñas existentes.
- Reinicio de la instancia PostgreSQL: mensajes y horas de aviso permanecen idénticos.
- YAML de Compose analizado; comprobados servicios, puerto local y base sin puerto público.
- npm reportó cero vulnerabilidades tras la instalación final de dependencias.

Durante las pruebas se corrigió la inclusión del binario Argon2 compilado
localmente en el paquete standalone. Se verificó de nuevo el recorrido completo
con el paquete corregido.

## Entorno y límites

Las pruebas se ejecutaron en macOS con Node.js 23.5.0 y PostgreSQL 14.15.
Docker está preparado para Node.js 22 y PostgreSQL 17.

**Docker no está instalado en esta máquina:** no se ejecutó `docker compose build`
ni el arranque/reinicio de contenedores. Esa validación queda pendiente en el VPS
o en un equipo con Docker. El reinicio probado fue de PostgreSQL local.

No se ha publicado en un dominio, configurado HTTPS en el VPS ni enviado correos.
Se entregó un guion de video, no una grabación.
