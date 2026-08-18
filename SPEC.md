# Carta Documento — App del Estudio
## Especificación técnica para implementar con Claude Code

---

## 0. Punto de partida (auditoría del sitio original)

Se inspeccionó `imprimir-carta-documento.preimpresos.com`.

**Hallazgo central:** el sitio **no genera el PDF en el navegador**. El formulario hace
`POST` a `imprimir.php` y el PDF se arma **del lado del servidor**. Es decir:

- En la consola del navegador **no hay nada valioso que copiar**: ni coordenadas, ni
  lógica de calibración, ni el motor de PDF. Sólo hay HTML de formulario.
- Reproducir su código no es posible (es server-side) ni conveniente (código ajeno,
  con riesgo de infracción de derechos de autor sobre el software — art. 1 Ley 11.723).
- Lo que **sí** es perfectamente lícito y es el camino correcto: **reconstruir la
  funcionalidad** desde cero. La CD es un formulario oficial del Correo Argentino; las
  medidas de un formulario oficial son un hecho físico, no una obra protegida.

**Riesgo adicional del sitio original:** los datos de remitente, destinatario y el
texto completo de la intimación viajan a un servidor de terceros. Para un estudio
jurídico eso es secreto profesional (art. 7 inc. c, Ley 23.187 CABA / normas
provinciales equivalentes) más datos personales de terceros (Ley 25.326, hoy con
proyecto de reforma). **Motivo suficiente por sí solo para tener herramienta propia.**

---

## 1. Arquitectura decidida

| Componente | Decisión |
|---|---|
| Generación de PDF | `pdf-lib` **100% en el navegador** |
| Persistencia | `IndexedDB` local (destinatarios + historial) |
| Backend | **Ninguno.** Cero datos salen del equipo |
| Distribución | Archivo HTML autónomo o app Vite/React servida en la red interna del estudio |
| Formato de salida | PDF tamaño **oficio argentino: 216 × 330 mm** |

Consecuencia jurídica de la arquitectura: al no haber servidor, el estudio no es
"responsable de una base de datos" en los términos del art. 21 Ley 25.326 respecto de
un tercero — los datos nunca salen del dispositivo del profesional.

---

## 2. Modelo de datos

### 2.1 Campos de la carta (extraídos del formulario original, con sus `maxlength` reales)

| Campo | `name` | Tipo | Máx. | Notas |
|---|---|---|---|---|
| Remitente 1ª línea | `remitente1` | text | 40 | |
| Remitente 2ª línea | `remitente2` | text | 45 | continuación si no entra |
| Domicilio remitente | `domicilior` | text | 30 | |
| CP remitente | `cpr` | text | 10 | |
| Localidad remitente | `localidadr` | text | 30 | |
| Provincia remitente | `provinciar` | text | 20 | |
| Destinatario 1ª línea | `destinatario1` | text | 40 | |
| Destinatario 2ª línea | `destinatario2` | text | 45 | |
| Domicilio destinatario | `domiciliod` | text | 30 | |
| CP destinatario | `cpd` | text | 10 | |
| Localidad destinatario | `localidadd` | text | 30 | |
| Provincia destinatario | `provinciad` | text | 20 | |
| Lugar y fecha | `lugarfecha` | text | — | alineado a la derecha |
| Texto | `texto` | textarea | — | cuerpo, con wrap automático |
| Saludo | `saludo` | text | 70 | alineado a la derecha |
| Apellido y nombres | `apellidoynombre` | text | — | pie de firma |
| Documento | `documento` | text | — | aclarar DNI/CUIT/etc. |
| Dato adicional | `datomas` | text | — | opcional |
| Achicar letra | `achicarletra` | checkbox | — | reduce el `fontSize` del cuerpo |

### 2.2 Calibración (valores por defecto del sitio original, en mm)

```js
const CALIBRACION_DEFAULT = {
  margenSuperior:  5,
  margenInferior:  5,
  margenIzquierdo: 3,
  margenDerecho:   3,
};
```

Estos cuatro números **no son márgenes de diseño**: son el resultado medido de la
**hoja de prueba** impresa en la impresora concreta del estudio. Sirven para corregir
el desplazamiento mecánico de cada impresora. Se persisten por impresora
(`perfilesImpresora`), porque el estudio puede tener más de una.

**Fórmula de corrección** (la clave de todo el sistema):

```
offsetX = margenIzquierdo_medido - margenIzquierdo_nominal   // nominal = 3 mm
offsetY = margenSuperior_medido  - margenSuperior_nominal    // nominal = 5 mm

x_final = COORDS[campo].x - offsetX
y_final = COORDS[campo].y - offsetY
```

Los márgenes inferior y derecho permiten además detectar **escalado** de la impresora
(si el ancho impreso ≠ ancho esperado, hay factor de escala ≠ 1) y corregirlo:

```
escalaX = (216 - izqNominal - derNominal) / (216 - izqMedido - derMedido)
```

### 2.3 Esquema IndexedDB

```
DB: "cd-estudio" (v1)

store "destinatarios"  keyPath: id (uuid), index: nombreNormalizado
  { id, nombre1, nombre2, domicilio, cp, localidad, provincia,
    cuit, notas, creado, actualizado }

store "remitentes"     keyPath: id      // el estudio y sus clientes habituales
  { id, alias, nombre1, nombre2, domicilio, cp, localidad, provincia, esPredeterminado }

store "plantillas"     keyPath: id
  { id, titulo, categoria, cuerpo, variables:[...], creado }
  // categoria: intimacion_pago | despido | rescision | mora | desalojo | otro
  // variables tipo {{MONTO}}, {{PLAZO}}, {{CONTRATO}}

store "historial"      keyPath: id, index: fecha, index: destinatarioId
  { id, fecha, remitenteSnapshot, destinatarioSnapshot, lugarfecha,
    texto, saludo, firmante, documento, datomas,
    expediente, cliente, nroPiezaCorreo, estado, hashTexto }
  // estado: borrador | impresa | despachada | entregada | rechazada | devuelta

store "perfilesImpresora" keyPath: nombre
  { nombre, margenSuperior, margenInferior, margenIzquierdo, margenDerecho, escalaX, escalaY }

store "config"         keyPath: clave
```

**Importante para el historial:** guardar *snapshots* de remitente y destinatario, no
referencias. Si mañana se corrige el domicilio de un destinatario, la CD ya despachada
debe seguir mostrando el domicilio al que efectivamente se despachó. Es prueba.

---

## 3. Mapa de coordenadas

Origen del sistema: **esquina superior izquierda**, unidades en **milímetros**
(pdf-lib usa puntos con origen abajo-izquierda; el helper convierte).

```js
const MM = 2.834645669; // 1 mm en puntos PostScript
const HOJA = { ancho: 216, alto: 330 }; // oficio argentino

// y medido desde ARRIBA; el helper hace: yPt = (HOJA.alto - y) * MM
const COORDS = {
  remitente1:    { x:  22, y:  47, size: 10 },
  remitente2:    { x:  22, y:  52, size: 10 },
  domicilior:    { x:  22, y:  57, size: 10 },
  cpr:           { x:  22, y:  62, size: 10 },
  localidadr:    { x:  40, y:  62, size: 10 },
  provinciar:    { x:  95, y:  62, size: 10 },

  destinatario1: { x:  22, y:  80, size: 10 },
  destinatario2: { x:  22, y:  85, size: 10 },
  domiciliod:    { x:  22, y:  90, size: 10 },
  cpd:           { x:  22, y:  95, size: 10 },
  localidadd:    { x:  40, y:  95, size: 10 },
  provinciad:    { x:  95, y:  95, size: 10 },

  lugarfecha:    { x: 190, y: 115, size: 10, align: 'right' },

  texto: {
    x: 22, y: 125, size: 10,
    ancho: 170,        // mm disponibles para wrap
    interlineado: 4.6, // mm entre líneas
    maxLineas: 34,
    sizeAchicado: 8, interlineadoAchicado: 3.8, maxLineasAchicado: 44
  },

  saludo:          { x: 190, y: 285, size: 10, align: 'right' },
  apellidoynombre: { x:  22, y: 300, size: 10 },
  documento:       { x:  22, y: 305, size: 10 },
  datomas:         { x:  22, y: 310, size: 10 },
};
```

> ⚠️ **Estos valores son ESTIMACIONES iniciales.** El paso siguiente (§4) es
> reemplazarlos por medidas reales tomadas de la CD física. Todo el mapa vive en un
> único objeto exportado para que ajustarlo sea editar un archivo, no tocar lógica.

---

## 4. Procedimiento de calibración (hacerlo antes que nada)

1. Generar la **hoja de grilla** (`grilla-calibracion.pdf`, incluida): grilla en mm
   con ejes rotulados cada 10 mm.
2. Imprimirla en hoja oficio en blanco, **al 100%, sin "ajustar a página"**.
3. Superponerla a trasluz con la CD preimpresa del Correo Argentino.
4. Leer y anotar, para cada campo, la coordenada `(x, y)` en mm donde debe **empezar**
   el texto (esquina inferior izquierda de la primera letra, con ~1 mm de aire sobre
   la línea impresa).
5. Volcar esos valores en `COORDS`.
6. Generar la **hoja de prueba** (`prueba-impresora.pdf`): marcas en los cuatro
   márgenes. Imprimirla, medir con regla los 4 márgenes reales y cargarlos en el panel
   de Calibración → queda guardado el perfil de esa impresora.
7. Imprimir una CD de prueba en hoja en blanco y comparar a trasluz. Iterar.

**Setting de impresión obligatorio en todas las máquinas del estudio:** tamaño
`Oficio / Legal 216×330`, escala **100%**, sin márgenes automáticos, sin "ajustar".

---

## 5. Funcionalidades a implementar

### v1 — núcleo
- [ ] Formulario con los 18 campos y sus `maxlength`
- [ ] Contador de caracteres por campo y aviso al excederse
- [ ] Wrap automático del cuerpo con corte por palabra + aviso de "no entra"
- [ ] Vista previa en pantalla con la CD escaneada de fondo (opcional, mejora enorme)
- [ ] Generación de PDF oficio con `pdf-lib` y descarga
- [ ] Panel de calibración con perfiles por impresora
- [ ] Botones: grilla de calibración / hoja de prueba / CD final

### v2 — datos
- [ ] ABM de destinatarios con autocompletado
- [ ] ABM de remitentes (el estudio y clientes recurrentes)
- [ ] Plantillas con variables `{{...}}` y sustitución al cargar
- [ ] Historial: toda CD generada se guarda automáticamente
- [ ] Buscador de historial por destinatario, expediente, fecha, texto
- [ ] Reimprimir una CD del historial idéntica a la original
- [ ] Campo de nº de pieza del Correo + estado de la pieza
- [ ] Exportar/importar backup completo en JSON (cifrado con passphrase)

### v3 — el diferencial legal-tech
- [ ] **Cómputo de plazos**: cargar fecha de despacho → calcular vencimiento del
      emplazamiento en días hábiles (art. 6 CCyC / plazos procesales), con feriados
      nacionales argentinos
- [ ] **Alerta de vencimiento** integrada al calendario del estudio
- [ ] **Sellado de tiempo**: hash SHA-256 del texto al momento de generar, guardado en
      el historial — acredita integridad de lo enviado
- [ ] Firma digital del PDF de resguardo (Ley 25.506) con token del profesional
- [ ] Generación en lote: mismo texto, N destinatarios (mora de consorcio, etc.)
- [ ] Exportar el historial a CSV/XLSX para control de gestión

---

## 6. Automatización sugerida (n8n / Make)

Todo lo que sigue corre **fuera** de la app, consumiendo el export JSON o un webhook
local, para no romper el modelo "cero backend":

1. **Watcher de plazos** → n8n lee el historial exportado, calcula vencimientos y
   dispara mail/Telegram al abogado 3 días antes.
2. **Tracking Correo Argentino** → nodo HTTP contra el rastreo de piezas con el nº
   cargado; actualiza el estado y avisa cuando figura "entregada" o "rechazada".
   *(La CD rechazada o no retirada se tiene por comunicada — art. 983 CCyC. El aviso
   automático de ese estado es exactamente el dato que dispara el paso procesal
   siguiente.)*
3. **Archivo automático** → al marcar "despachada", guardar el PDF + acuse en la
   carpeta del expediente en Drive/Nextcloud con nomenclatura normalizada.
4. **Alta desde el CRM del estudio** → webhook que precarga destinatario y expediente.

---

## 7. Cuidados legales de la propia herramienta

- **No copiar el código ni los assets del sitio original.** Reconstruir desde cero.
  Las medidas del formulario oficial son datos fácticos, no obra protegida.
- **No reproducir el formulario del Correo Argentino.** La app imprime *sobre* el
  preimpreso oficial adquirido. Imprimir el formulario completo en hoja blanca no
  tiene validez y puede configurar un problema de otro orden.
- **Datos personales de terceros** (el destinatario nunca prestó consentimiento): la
  base local está amparada por el art. 5 inc. 2 ap. b y el art. 26 Ley 25.326 en tanto
  se use para el ejercicio profesional. Definir política de retención y borrado.
- **Secreto profesional**: el backup JSON debe ir cifrado. Nada de sincronizar la
  carpeta a una nube personal sin cifrado.
- La app **no valida contenido jurídico**. Debe mostrarlo así: el control del texto de
  la intimación es responsabilidad exclusiva del profesional firmante.

---

## 8. Orden de implementación sugerido para Claude Code

```
1. Scaffold + módulo de geometría (mm↔pt, COORDS, helpers de dibujo)
2. Grilla de calibración y hoja de prueba  ← primero esto, para medir
3. Formulario + generación de PDF con COORDS estimadas
4. Panel de calibración + perfiles de impresora
5. IndexedDB: destinatarios, remitentes, historial
6. Plantillas con variables
7. Buscador de historial + reimpresión
8. Cómputo de plazos y hash de integridad
```
