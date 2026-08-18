# Impresor de Cartas Documento

Aplicación web (100% en el navegador, sin servidor ni dependencias) para
completar e imprimir **Cartas Documento**. Inspirada en herramientas como
`imprimir-carta-documento.preimpresos.com`.

## Características

- **Formulario de carga** con datos de remitente, destinatario, cuerpo,
  lugar/fecha y firma.
- **Guardado automático** en el navegador (`localStorage`). No se envía nada a
  internet.
- **Vista previa a escala real** de la hoja **oficio** (216 × 330 mm, en
  milímetros), para que la impresión salga 1:1.
- **Dos modos de impresión:**
  - **Superponer (formulario oficial):** imprime únicamente el texto, para
    superponerlo sobre el formulario preimpreso de Correo Argentino.
  - **Formulario completo (papel blanco):** dibuja además los recuadros y
    etiquetas, para imprimir todo en una hoja en blanco.
- **Calibración por hoja de prueba:** imprimís un marco patrón, medís con regla
  los 4 márgenes reales que salieron de *tu* impresora y los cargás; con eso se
  corrige tanto el **desplazamiento** como una leve **diferencia de escala**.
  Incluye cuadrícula opcional de 10 mm como guía. Se guarda para tu impresora.
- **Impresión / PDF** con el diálogo del navegador (elegí "Guardar como PDF"
  para generar el archivo).

## Uso

1. Abrí `index.html` en el navegador (doble clic o servilo con cualquier
   servidor estático).
2. Completá los datos en el panel izquierdo.
3. Elegí el modo de impresión arriba a la derecha.
4. Ajustá la calibración si hace falta (ver abajo).
5. Tocá **Imprimir / PDF**. En el diálogo verificá:
   - Tamaño de papel: **Oficio** (216 × 330 mm).
   - Márgenes: **Ninguno**.
   - Escala: **100 %** (desactivá "Ajustar al área de impresión").

## Calibrar tu impresora (hoja de prueba)

Cada impresora imprime unos milímetros corrida y, a veces, con una leve
diferencia de escala. Para ajustarla a tu equipo:

1. Tené a mano un par de hojas **oficio** en blanco.
2. En **Calibración de impresión**, tocá **Imprimir hoja de prueba**. Imprimí
   con papel **Oficio**, márgenes **Ninguno** y escala **100 %**. Sale un marco
   patrón (diseñado a 5 mm arriba/abajo y 3 mm a los lados).
3. Con una regla, medí en milímetros la distancia del **borde de la hoja** hasta
   cada línea del marco (superior, inferior, izquierdo y derecho).
4. Cargá esos 4 valores en la calibración. La app calcula la corrección de
   posición y escala y la aplica a la impresión real.

Si no querés hacer la prueba, dejá los valores por defecto (5 / 5 / 3 / 3):
suele funcionar bien. La calibración queda guardada en tu navegador.

> Si algún bloque queda descolocado respecto de los demás (no es un problema
> global de la impresora sino de este layout), editá sus coordenadas
> (`left`/`top`, en mm) en [`js/config.js`](js/config.js).

## Estructura

```
index.html        Estructura de la página
css/styles.css    Estilos y reglas de impresión (@page A4)
js/config.js      Definición de campos y coordenadas (en mm) — editá acá
js/app.js         Lógica: formulario, vista previa, calibración, impresión
```

## Notas

- Todo funciona offline. Podés hospedarlo en cualquier hosting estático
  (GitHub Pages, Netlify, etc.) o abrir el archivo directamente.
- Las coordenadas en `config.js` están comentadas y son fáciles de ajustar
  para adaptarlas a tu formulario o preferencias.
