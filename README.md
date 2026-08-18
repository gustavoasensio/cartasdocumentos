# Impresor de Cartas Documento

Aplicación web (100% en el navegador, sin servidor ni dependencias) para
completar e imprimir **Cartas Documento**. Inspirada en herramientas como
`imprimir-carta-documento.preimpresos.com`.

## Características

- **Formulario de carga** con datos de remitente, destinatario, cuerpo,
  lugar/fecha y firma.
- **Guardado automático** en el navegador (`localStorage`). No se envía nada a
  internet.
- **Vista previa a escala real** de la hoja A4 (medidas en milímetros), para que
  la impresión salga 1:1.
- **Dos modos de impresión:**
  - **Superponer (formulario oficial):** imprime únicamente el texto, para
    superponerlo sobre el formulario preimpreso de Correo Argentino.
  - **Formulario completo (papel blanco):** dibuja además los recuadros y
    etiquetas, para imprimir todo en una hoja en blanco.
- **Calibración** de desplazamiento horizontal/vertical y tamaño de fuente,
  con cuadrícula opcional de 10 mm como guía. Se guarda para tu impresora.
- **Impresión / PDF** con el diálogo del navegador (elegí "Guardar como PDF"
  para generar el archivo).

## Uso

1. Abrí `index.html` en el navegador (doble clic o servilo con cualquier
   servidor estático).
2. Completá los datos en el panel izquierdo.
3. Elegí el modo de impresión arriba a la derecha.
4. Ajustá la calibración si hace falta (ver abajo).
5. Tocá **Imprimir / PDF**. En el diálogo verificá:
   - Tamaño de papel: **A4**.
   - Márgenes: **Ninguno**.
   - Escala: **100 %** (desactivá "Ajustar al área de impresión").

## Calibrar sobre el formulario oficial

El formulario oficial de Correo Argentino no tiene medidas públicas exactas,
así que las posiciones de este proyecto son un punto de partida. Para ajustarlo:

1. Activá **Mostrar cuadrícula** y/o usá el modo **Formulario completo** para
   ver dónde cae cada campo.
2. Hacé una impresión de prueba sobre una hoja común y compará (a trasluz o
   superponiendo) contra el formulario oficial.
3. Corregí el **desplazamiento horizontal/vertical** hasta que coincida.
4. Si algún bloque queda descolocado respecto de los demás, editá sus
   coordenadas (`left`/`top`, en mm) en [`js/config.js`](js/config.js).

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
