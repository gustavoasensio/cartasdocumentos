/*
 * config.js
 * ---------------------------------------------------------------------------
 * Definición del formulario "Carta Documento".
 *
 * Todas las coordenadas están en MILÍMETROS y referidas al borde superior
 * izquierdo de la hoja A4 (210 x 297 mm).
 *
 * IMPORTANTE sobre la calibración:
 *   El formulario OFICIAL de Correo Argentino no tiene medidas públicas
 *   exactas, así que este layout es un punto de partida razonable. Para
 *   ajustarlo a tu formulario real:
 *     1. Usá el modo "Formulario completo" para ver dónde cae cada campo.
 *     2. Ajustá el desplazamiento global X/Y desde el panel de Calibración.
 *     3. Si algún bloque necesita corrección fina, editá su "top"/"left" acá.
 * ---------------------------------------------------------------------------
 */

// Tamaño de la hoja (Oficio vertical: 216 x 330 mm).
// La Carta Documento de Correo Argentino se imprime en hoja oficio.
const SHEET = { width: 216, height: 330 };

// Márgenes "nominales" con los que se diseña la hoja de prueba de calibración.
// Son los valores por defecto que ve el usuario. La hoja de prueba dibuja un
// marco a estas distancias del borde; el usuario mide lo que realmente imprimió
// su impresora y carga esos 4 valores para corregir posición y escala.
const CALIB_NOMINAL = { top: 5, bottom: 5, left: 3, right: 3 };

// Definición de cada campo del formulario.
//   id      : identificador único (también se usa para guardar en el navegador)
//   label   : etiqueta que se muestra en el panel de carga y como guía
//   left/top: posición en mm del texto sobre la hoja
//   width   : ancho disponible en mm (para el recuadro guía y el ajuste de texto)
//   size    : tamaño de fuente en mm
//   section : agrupación en el panel de carga
//   type    : 'text' (por defecto) | 'textarea'
//   rows    : sólo para textarea (líneas visibles en el panel de carga)
//   bold    : true para negrita
const FIELDS = [
  // ----- Encabezado -----
  { id: 'numero',   label: 'Carta Documento N°', section: 'Encabezado',
    left: 122, top: 23.5, width: 73, size: 3.4, bold: true },
  { id: 'fecha',    label: 'Lugar y fecha',      section: 'Encabezado',
    left: 15,  top: 23.5, width: 100, size: 3.2 },

  // ----- Remitente -----
  { id: 'rem_nombre',    label: 'Apellido y nombre / Razón social', section: 'Remitente',
    left: 20, top: 34, width: 175, size: 3.2, bold: true },
  { id: 'rem_domicilio', label: 'Domicilio',                        section: 'Remitente',
    left: 20, top: 41, width: 175, size: 3.2 },
  { id: 'rem_localidad', label: 'Localidad',                        section: 'Remitente',
    left: 20, top: 48, width: 90, size: 3.2 },
  { id: 'rem_cp',        label: 'C.P.',                             section: 'Remitente',
    left: 112, top: 48, width: 25, size: 3.2 },
  { id: 'rem_provincia', label: 'Provincia',                        section: 'Remitente',
    left: 140, top: 48, width: 55, size: 3.2 },

  // ----- Destinatario -----
  { id: 'dest_nombre',    label: 'Apellido y nombre / Razón social', section: 'Destinatario',
    left: 20, top: 66, width: 175, size: 3.2, bold: true },
  { id: 'dest_domicilio', label: 'Domicilio',                        section: 'Destinatario',
    left: 20, top: 73, width: 175, size: 3.2 },
  { id: 'dest_localidad', label: 'Localidad',                        section: 'Destinatario',
    left: 20, top: 80, width: 90, size: 3.2 },
  { id: 'dest_cp',        label: 'C.P.',                             section: 'Destinatario',
    left: 112, top: 80, width: 25, size: 3.2 },
  { id: 'dest_provincia', label: 'Provincia',                        section: 'Destinatario',
    left: 140, top: 80, width: 55, size: 3.2 },

  // ----- Cuerpo -----
  { id: 'texto', label: 'Texto de la carta', section: 'Cuerpo',
    left: 18, top: 96, width: 180, size: 3.2, type: 'textarea', rows: 16,
    lineHeight: 6 /* mm entre renglones del cuerpo */ },

  // ----- Pie / firma -----
  { id: 'firma',      label: 'Firma',      section: 'Firma',
    left: 120, top: 291, width: 78, size: 3.2 },
  { id: 'aclaracion', label: 'Aclaración', section: 'Firma',
    left: 120, top: 299, width: 78, size: 3.0 },
];

// Recuadros y etiquetas que se dibujan SÓLO en el modo "Formulario completo".
//   Cada guía es un rectángulo con un rótulo arriba a la izquierda.
const GUIDES = [
  { title: 'CARTA DOCUMENTO', left: 12, top: 6, width: 192, height: 15,
    header: true },
  { title: 'REMITENTE',    left: 12, top: 28, width: 192, height: 26 },
  { title: 'DESTINATARIO', left: 12, top: 60, width: 192, height: 26 },
  { title: 'TEXTO',        left: 12, top: 92, width: 192, height: 193 },
  { title: 'FIRMA Y ACLARACIÓN', left: 12, top: 288, width: 192, height: 24 },
];
