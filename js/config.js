/*
 * config.js
 * ---------------------------------------------------------------------------
 * Definición del formulario "Carta Documento" (Modelo CD de Correo Argentino).
 *
 * Coordenadas en MILÍMETROS desde el borde superior izquierdo de la hoja.
 * La hoja es OFICIO 215 x 335 mm (vertical).
 *
 * Se separan dos cosas:
 *   DATA_FIELDS  -> lo que el usuario ESCRIBE (una sola vez).
 *   BLOCKS       -> DÓNDE se imprime cada cosa. Un mismo dato puede imprimirse
 *                   en varios bloques (ej.: Remitente aparece en la copia A.R.
 *                   y en la copia Carta Documento).
 *
 * Las posiciones de los BLOCKS son sólo un punto de partida: con el modo
 * "Ubicar campos" el usuario los arrastra sobre una imagen del formulario y
 * quedan guardados en el navegador. No hace falta medir con regla.
 * ---------------------------------------------------------------------------
 */

// Hoja Oficio 215 x 335 mm.
const SHEET = { width: 215, height: 335 };

// Márgenes nominales de la hoja de prueba de calibración (ver README).
const CALIB_NOMINAL = { top: 5, bottom: 5, left: 3, right: 3 };

// -------- Datos que carga el usuario (panel izquierdo) --------
const DATA_FIELDS = [
  { id: 'rem_nombre',    label: 'Apellido y nombre / Razón social', section: 'Remitente' },
  { id: 'rem_domicilio', label: 'Domicilio',                        section: 'Remitente' },
  { id: 'rem_localidad', label: 'Localidad',                        section: 'Remitente' },
  { id: 'rem_cp',        label: 'C.P.',                             section: 'Remitente' },
  { id: 'rem_provincia', label: 'Provincia',                        section: 'Remitente' },

  { id: 'dest_nombre',    label: 'Apellido y nombre / Razón social', section: 'Destinatario' },
  { id: 'dest_domicilio', label: 'Domicilio',                        section: 'Destinatario' },
  { id: 'dest_localidad', label: 'Localidad',                        section: 'Destinatario' },
  { id: 'dest_cp',        label: 'C.P.',                             section: 'Destinatario' },
  { id: 'dest_provincia', label: 'Provincia',                        section: 'Destinatario' },

  { id: 'texto', label: 'Texto de la carta', section: 'Cuerpo', type: 'textarea', rows: 12 },
];

// -------- Bloques imprimibles (posiciones por defecto, en mm) --------
// kind: 'remitente' | 'destinatario' | 'body'
//   remitente/destinatario  -> arma 3 renglones (nombre / domicilio / loc-cp-prov)
//   body                    -> imprime el texto con saltos de línea
const BLOCKS = [
  { id: 'ar_rem',  kind: 'remitente',    label: 'Remitente (A.R.)',
    left: 8,  top: 18,  width: 95, size: 2.7, lineHeight: 5 },
  { id: 'ar_dest', kind: 'destinatario', label: 'Destinatario (A.R.)',
    left: 8,  top: 42,  width: 95, size: 2.7, lineHeight: 5 },

  { id: 'cd_rem',  kind: 'remitente',    label: 'Remitente (Carta Doc.)',
    left: 8,  top: 118, width: 95, size: 2.7, lineHeight: 5 },
  { id: 'cd_dest', kind: 'destinatario', label: 'Destinatario (Carta Doc.)',
    left: 8,  top: 142, width: 95, size: 2.7, lineHeight: 5 },

  { id: 'body',    kind: 'body',         label: 'Texto de la carta',
    left: 118, top: 30, width: 90, size: 2.8, lineHeight: 4.4 },
];
