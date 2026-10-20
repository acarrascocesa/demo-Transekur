# Diseño de la demo

La interfaz se inspira en una hoja de despacho: hora, pasajero y recogida se
leen primero. El naranja de Transekur identifica la acción principal.
No se representa esto como un producto oficial integrado a iLimo.

## Tokens

- Blanco #FFFFFF, lienzo #F5F6F7, carbón #25282B, secundario #62676B.
- Naranja de marca #E98300; botón #A94E00 con texto blanco.
- Verde #24634B, rojo #B42318. Los estados llevan texto e icono.
- Manrope local: texto 14–16 px, títulos 28–40 px, horas con cifras tabulares.
- Separadores finos, radios 8–14 px según función, sin sombras decorativas.

## Distribución

Acceso: logo arriba, introducción y formulario en dos columnas; en móvil,
una sola columna con el formulario inmediatamente después del título.

Despacho:

```
Logo                          nombre / cerrar sesión
Despacho                       Crear servicio
Fecha / Hoy                    actualización
Hora | Cliente | Recogida | Chofer / vehículo | Aviso | Enlace
```

Chofer: logo, saludo, fecha, tarjetas con hora y recogida a la izquierda;
acción de aviso a todo lo ancho en móvil.

Cliente: logo, indicador de aviso simulado, estado y mensaje, identificación
del chofer y vehículo; sin teléfono ni token visibles como datos de producto.

## Revisión antes de construir

Se descarta el dorado, las estadísticas decorativas y una cuadrícula de tarjetas
idénticas para despacho. Se conserva una tabla porque el trabajo consiste en
comparar servicios. Las tarjetas solo se usan en móvil y en la agenda del chofer.
El logo completo tiene 754 × 154 px y se mantiene sobre blanco.

## Revisión final

Se revisaron capturas a 390 y 1440 px y estados pendientes, enviados, vacíos y
de error. Se corrigió el espaciado del título móvil y se aumentó a 16 px el texto
de los campos móviles. Los análisis axe no reportaron infracciones A/AA en las
pantallas comprobadas. El logo conserva proporciones y fondo blanco.
No hay animaciones de entrada; se respeta prefers-reduced-motion.
