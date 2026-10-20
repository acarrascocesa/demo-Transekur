# Guion de demostración (4:30)

## 0:00–0:30 · Problema y alcance

«El cliente necesita saber que su chofer está cerca. Esta demo conecta despacho,
chofer y una vista de aviso, con datos ficticios. El mensaje es simulado; los
usuarios, permisos y la persistencia sí funcionan.»

## 0:30–1:30 · Despacho

Entrar como despacho. Crear un servicio de hoy para Laura Demo, con teléfono de
ejemplo, recogida y Carlos como chofer. Mostrar el vehículo y abrir «Ver aviso».
La vista del cliente debe indicar que está esperando el aviso.

## 1:30–2:30 · Chofer y cliente

En otra ventana privada, entrar como Carlos con viewport móvil. Mostrar que ve
solo su agenda de hoy. Pulsar «Llego en 10». Mostrar la confirmación y la hora.
Volver al cliente: el mensaje aparece con nombre del chofer y vehículo.

## 2:30–3:10 · Seguimiento y persistencia

Mostrar el aviso en despacho y recargar la página. Señalar que se conserva.
Explicar que una segunda solicitud devuelve el mismo aviso y no cambia su hora.
Entrar como Miguel para mostrar la separación de asignaciones.

## 3:10–4:00 · Decisiones técnicas

«Next.js y PostgreSQL, con consultas SQL parametrizadas mediante pg. Sesiones
persistidas, contraseñas Argon2id y permisos comprobados en cada operación.
La base de datos impide avisos duplicados. Docker Compose separa aplicación,
base de datos y migraciones.»

Mostrar brevemente README y el resultado de las pruebas, sin exponer `.env`.

## 4:00–4:30 · IA, límites y cierre

«Usé Codex y las skills frontend-design y vercel-react-best-practices para
desarrollar y revisar. La app no necesita IA para funcionar. Priorizamos el
flujo completo: no incluimos GPS, pagos, iLimo ni SMS reales.»

Cerrar con el enlace desplegado y dónde encontrar código e instrucciones.
