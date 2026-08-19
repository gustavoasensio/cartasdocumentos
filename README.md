# Carta Documento — App del Estudio

Aplicación web **100 % local, sin backend**, para completar e imprimir Cartas
Documento sobre el formulario preimpreso de Correo Argentino. Nada de lo que
cargás sale del equipo (secreto profesional y datos de terceros): el PDF se
genera en el navegador con `pdf-lib` embebido y funciona offline.

> Reconstruida desde cero según [`SPEC.md`](SPEC.md). No copia código ni assets
> del sitio original; las medidas de un formulario oficial son un hecho físico.

## Archivos

| Archivo | Qué es |
|---|---|
| `carta-documento.html` | La app completa, en un solo archivo (abrir con doble clic). |
| `SPEC.md` | Especificación técnica: arquitectura, COORDS, IndexedDB, fórmula de calibración, roadmap y recaudos legales. |
| `pdf-calibracion/grilla-calibracion.pdf` | Grilla milimetrada para leer coordenadas reales contra la CD física. |
| `pdf-calibracion/prueba-impresora.pdf` | Marcas en los 4 márgenes para calibrar la impresora. |
| `pdf-calibracion/muestra-cd.pdf` | Ejemplo de CD generada. |

*(La app también genera la grilla y la hoja de prueba al vuelo, con el tamaño
de hoja configurado en ese momento.)*

## Uso

1. Abrí `carta-documento.html` en el navegador.
2. Completá los campos y tocá **Generar PDF de la CD**.
3. Imprimí **sobre el formulario preimpreso oficial**, en hoja **Oficio**,
   escala **100 %**, sin "ajustar a página".

## Lo primero: calibrar (una vez por impresora)

Las coordenadas de `COORDS` son **estimaciones** hasta medirlas contra tu
formulario real:

1. **Generar grilla milimetrada** → imprimila al 100 % y superponela a trasluz
   con la CD del Correo. Leé la `(x, y)` en mm donde debe empezar cada campo.
2. Cargá esos valores en la pestaña **Calibración** (editor de COORDS) y usá
   **Exportar COORDS como JSON** para tener el mapa definitivo.
3. **Generar hoja de prueba** → imprimila, medí con regla los 4 márgenes reales
   y cargálos: queda guardado el **perfil de esa impresora** (corrige
   desplazamiento y escala).
4. Imprimí una CD de prueba y compará a trasluz. Iterá.

## Funcionalidades

- **v1 (núcleo):** 18 campos con `maxlength`, contador de caracteres, wrap del
  cuerpo con aviso de "no entra", **cuerpo justificado** (opcional), generación
  de PDF oficio, calibración con perfiles por impresora, grilla y hoja de prueba.
  Imprime Remitente y Destinatario en las **dos copias** (A.R. + Carta
  Documento); cada copia tiene sus propias coordenadas calibrables.
- **v2 (datos):** ABM de destinatarios y remitentes, plantillas con variables
  `{{...}}`, historial automático con nº de pieza/estado y **hash SHA-256** del
  texto, backup JSON.
- **v3 (en curso):**
  - ✅ **Cómputo de plazos** en días hábiles o corridos, con feriados nacionales
    calculados (fijos + Carnaval/Viernes Santo por Pascua + trasladables Ley
    27.399) y tabla **editable por año** para cargar los feriados puente /
    turísticos que fija el PEN por decreto. Marca si el vencimiento cae en día
    inhábil y sugiere el hábil siguiente.
  - Pendiente: tracking de la pieza (Correo), sellado de tiempo del PDF de
    resguardo y firma digital. Ver `SPEC.md` §5.

  > El cómputo de plazos es una **herramienta de apoyo**: no incluye feriados
  > provinciales ni ferias judiciales, y el cálculo definitivo es
  > responsabilidad del profesional.

## Privacidad

Sin servidor: los datos viven en `IndexedDB` del navegador, en tu equipo. El
backup JSON debería guardarse cifrado. La app **no valida el contenido
jurídico**: el texto de la intimación es responsabilidad del profesional
firmante.
