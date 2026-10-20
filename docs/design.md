# Diseño de la demo

La interfaz se inspira en una hoja de despacho premium: hora, pasajero y
recogida se leen primero. El naranja de Transekur identifica la acción
principal. No se representa como un producto oficial integrado a iLimo.
No hay sidebar: cada rol tiene una sola pantalla útil; el chrome multi-módulo
añadiría ruido y pelearía con la app del chofer en móvil.

## Tokens

Definidos en `src/app/globals.css` (`:root`):

- Lienzo `--canvas` #F5F6F7, papel `--paper` #FFFFFF, carbón `--ink` #25282B,
  secundario `--muted` #62676B, línea `--line` / `--line-soft`.
- Naranja de marca `--orange` #E98300; acción `--action` #A94E00 con hover
  `--action-hover` y active `--action-active`; texto de botón en papel.
- Verde `--green` #24634B, rojo `--red` #B42318; fondos de estado
  `--success-bg` / `--error-bg` y bordes asociados.
- Entradas: `--input-border`. Radios `--radius-sm|md|lg` (5–12 px).
- Manrope local: texto 14–16 px, títulos 28–36 px, horas con cifras tabulares.
- Separadores finos, sin sombras decorativas ni franjas de acento gruesas
  (side-stripe) en cards o formularios.

## Distribución

Navegación: header + contenido (sin menú lateral).

Acceso: logo arriba, introducción operativa y formulario en dos columnas;
en móvil, una sola columna con el formulario tras el título. Copy calmado,
sin pitch de landing.

Despacho:

```
Logo                          nombre / cerrar sesión
Despacho                       Crear servicio
Fecha / Hoy                    actualización
Hora | Cliente | Recogida | Chofer / vehículo | Aviso | Enlace
```

Estados de aviso tipográficos (sin píldoras de color). Tabla en escritorio;
en ≤700 px, filas etiquetadas con `data-label`.

Chofer: logo, nombre, fecha, tarjetas con hora dominante y recogida;
CTA «Llego en 10» a ancho completo y altura táctil generosa en móvil.

Cliente: logo, badge «Aviso simulado», mensaje como nota de conserjería,
bloque tipográfico de chofer/vehículo; sin teléfono ni token visibles;
sin círculo-icono decorativo.

## Revisión antes de construir

Se descarta el dorado, las estadísticas decorativas, la cuadrícula de
tarjetas idénticas para despacho y el sidebar. Se conserva una tabla porque
el trabajo consiste en comparar servicios. Las tarjetas solo se usan en
móvil (agenda despacho) y en la agenda del chofer. El logo completo tiene
754 × 154 px y se mantiene sobre blanco.

## Revisión final

Se revisaron capturas a 390 y 1440 px y estados pendientes, enviados, vacíos
y de error. Se unificaron tokens CSS, se refinó el look ops premium y se
ajustó el CTA del chofer y el overflow en móvil. Los análisis axe no
reportaron infracciones A/AA en las pantallas comprobadas. El logo conserva
proporciones y fondo blanco. No hay animaciones de entrada; se respeta
`prefers-reduced-motion`. `overflow-x: clip` en `html`/`body`.
