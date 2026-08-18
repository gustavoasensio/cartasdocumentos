/*
 * app.js — lógica del impresor de Cartas Documento.
 * Depende de config.js (SHEET, CALIB_NOMINAL, FIELDS, GUIDES).
 *
 * Calibración
 * -----------
 * Cada impresora reproduce la página con una pequeña distorsión afín (un
 * desplazamiento y a veces una leve escala). La medimos con una "hoja de
 * prueba": imprime un marco a los márgenes nominales (CALIB_NOMINAL); el
 * usuario mide con regla los 4 márgenes que realmente salieron y los carga.
 * Con eso pre-deformamos el contenido para que, tras la distorsión de la
 * impresora, todo caiga en su lugar.
 */
(function () {
  'use strict';

  var STORAGE_DATA  = 'cd_data_v1';
  var STORAGE_CALIB = 'cd_calib_v2';

  var els = {
    formFields: document.getElementById('form-fields'),
    content:    document.getElementById('content'),
    guides:     document.getElementById('guides'),
    grid:       document.getElementById('grid'),
    test:       document.getElementById('test'),
    mode:       document.getElementById('mode'),
    mTop:       document.getElementById('mTop'),
    mBottom:    document.getElementById('mBottom'),
    mLeft:      document.getElementById('mLeft'),
    mRight:     document.getElementById('mRight'),
    showGrid:   document.getElementById('showGrid'),
  };

  var CALIB_DEFAULT = {
    mTop: CALIB_NOMINAL.top, mBottom: CALIB_NOMINAL.bottom,
    mLeft: CALIB_NOMINAL.left, mRight: CALIB_NOMINAL.right,
    mode: 'overlay', showGrid: false,
  };

  // Estado ------------------------------------------------------------------
  var data  = load(STORAGE_DATA, {});
  var calib = load(STORAGE_CALIB, CALIB_DEFAULT);

  // ------------------------------------------------------------------ helpers
  function load(key, fallback) {
    try { return Object.assign({}, fallback, JSON.parse(localStorage.getItem(key)) || {}); }
    catch (e) { return Object.assign({}, fallback); }
  }
  function save(key, obj) {
    try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) {}
  }
  function mm(v) { return v + 'mm'; }
  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; }

  // --------------------------------------------------- construir panel de carga
  function buildForm() {
    var sections = {};
    var order = [];
    FIELDS.forEach(function (f) {
      if (!sections[f.section]) { sections[f.section] = []; order.push(f.section); }
      sections[f.section].push(f);
    });

    order.forEach(function (name) {
      var sec = document.createElement('div');
      sec.className = 'field-section';
      var h = document.createElement('h2');
      h.textContent = name;
      sec.appendChild(h);

      sections[name].forEach(function (f) {
        var wrap = document.createElement('div');
        wrap.className = 'field';
        var lbl = document.createElement('label');
        lbl.textContent = f.label;
        lbl.setAttribute('for', 'in_' + f.id);
        wrap.appendChild(lbl);

        var input;
        if (f.type === 'textarea') {
          input = document.createElement('textarea');
          input.rows = f.rows || 6;
        } else {
          input = document.createElement('input');
          input.type = 'text';
        }
        input.id = 'in_' + f.id;
        input.value = data[f.id] || '';
        input.addEventListener('input', function () {
          data[f.id] = input.value;
          save(STORAGE_DATA, data);
          renderText(f);
        });
        wrap.appendChild(input);
        sec.appendChild(wrap);
      });

      els.formFields.appendChild(sec);
    });
  }

  // ----------------------------------------------------- render de un campo
  function renderText(f) {
    var id = 'txt_' + f.id;
    var node = document.getElementById(id);
    if (!node) {
      node = document.createElement('div');
      node.id = id;
      node.className = 'text-field' + (f.bold ? ' bold' : '');
      els.content.appendChild(node);
    }
    node.textContent = data[f.id] || '';
    node.style.left = mm(f.left);
    node.style.top = mm(f.top);
    node.style.width = mm(f.width);
    node.style.fontSize = mm(f.size);
    if (f.lineHeight) node.style.lineHeight = mm(f.lineHeight);
  }

  function renderAllText() { FIELDS.forEach(renderText); }

  // ------------------------------------------------ render de guías (modo full)
  function renderGuides() {
    els.guides.innerHTML = '';
    if (calib.mode !== 'full') return;

    GUIDES.forEach(function (g) {
      var box = document.createElement('div');
      box.className = 'guide-box' + (g.header ? ' header' : '');
      box.style.left = mm(g.left);
      box.style.top = mm(g.top);
      box.style.width = mm(g.width);
      box.style.height = mm(g.height);
      if (g.header) {
        box.textContent = g.title;
      } else {
        var label = document.createElement('span');
        label.className = 'guide-label';
        label.textContent = g.title;
        label.style.left = mm(g.left + 4);
        label.style.top = mm(g.top);
        els.guides.appendChild(label);
      }
      els.guides.appendChild(box);
    });
  }

  // --------------------------------------------------- transformación de calib.
  // Devuelve la cadena CSS `transform` que pre-deforma el contenido.
  //
  //   Modelo de la impresora:  impreso = a * diseño + b   (por eje)
  //   Marco de prueba impreso a los insets nominales:
  //     borde izq. diseño = nomL   -> impreso = mL
  //     borde der. diseño = W-nomR -> impreso = W-mR
  //   De ahí:  a = (W - mL - mR) / (W - nomL - nomR)
  //   Para cancelar la distorsión aplicamos la inversa (escala 1/a):
  //     s = (W - nomL - nomR) / (W - mL - mR)
  //     t = nom(inicio) - m(inicio) * s
  function calcTransform() {
    var W = SHEET.width, H = SHEET.height;
    var nom = CALIB_NOMINAL;
    var mL = num(calib.mLeft, nom.left),  mR = num(calib.mRight, nom.right);
    var mT = num(calib.mTop, nom.top),    mB = num(calib.mBottom, nom.bottom);

    var denomX = W - mL - mR, denomY = H - mT - mB;
    var sx = denomX > 0 ? (W - nom.left - nom.right) / denomX : 1;
    var sy = denomY > 0 ? (H - nom.top - nom.bottom) / denomY : 1;
    var tx = nom.left - mL * sx;
    var ty = nom.top  - mT * sy;

    return 'translate(' + mm(tx) + ',' + mm(ty) + ') scale(' +
           sx.toFixed(5) + ',' + sy.toFixed(5) + ')';
  }

  function applyCalibration() {
    var t = calcTransform();
    els.content.style.transform = t;
    els.guides.style.transform = t;
    els.grid.hidden = !calib.showGrid;
  }

  // ------------------------------------------------------------- hoja de prueba
  // Dibuja un marco a los márgenes nominales para que el usuario mida lo que
  // su impresora imprime realmente. NO se le aplica calibración.
  function buildTestSheet() {
    var W = SHEET.width, H = SHEET.height, nom = CALIB_NOMINAL;
    els.test.innerHTML = '';

    var frame = document.createElement('div');
    frame.className = 'test-frame';
    frame.style.left = mm(nom.left);
    frame.style.top = mm(nom.top);
    frame.style.width = mm(W - nom.left - nom.right);
    frame.style.height = mm(H - nom.top - nom.bottom);
    els.test.appendChild(frame);

    var title = document.createElement('div');
    title.className = 'test-note test-title';
    title.style.top = mm(H / 2 - 24);
    title.textContent = 'HOJA DE PRUEBA DE CALIBRACIÓN';
    els.test.appendChild(title);

    var info = document.createElement('div');
    info.className = 'test-note';
    info.style.top = mm(H / 2 - 12);
    info.innerHTML =
      'Imprimí en hoja OFICIO, papel "Oficio", márgenes "Ninguno", escala 100%.<br>' +
      'Con una regla, medí en mm la distancia del BORDE de la hoja a cada línea del marco<br>' +
      'y cargá esos 4 valores en la calibración. Valores de diseño: ' +
      'sup ' + nom.top + ' / inf ' + nom.bottom +
      ' / izq ' + nom.left + ' / der ' + nom.right + ' mm.';
    els.test.appendChild(info);

    // Rótulos junto a cada lado.
    addSide('MEDIR ↑ (superior)', W / 2 - 20, nom.top + 3);
    addSide('MEDIR ↓ (inferior)', W / 2 - 20, H - nom.bottom - 8);
    addSide('MEDIR → (izquierdo)', nom.left + 3, H / 2 + 14);
    addSide('MEDIR ← (derecho)', W - nom.right - 32, H / 2 + 14);

    function addSide(text, left, top) {
      var s = document.createElement('div');
      s.className = 'test-side';
      s.style.left = mm(left);
      s.style.top = mm(top);
      s.textContent = text;
      els.test.appendChild(s);
    }
  }

  function printTest() {
    buildTestSheet();
    els.test.hidden = false;
    document.body.classList.add('test-mode');
    var cleanup = function () {
      document.body.classList.remove('test-mode');
      els.test.hidden = true;
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    // Respaldo por si 'afterprint' no dispara en algún navegador.
    setTimeout(cleanup, 1500);
  }

  // ------------------------------------------------------------------- UI init
  function syncControls() {
    els.mode.value = calib.mode;
    els.mTop.value = calib.mTop;
    els.mBottom.value = calib.mBottom;
    els.mLeft.value = calib.mLeft;
    els.mRight.value = calib.mRight;
    els.showGrid.checked = !!calib.showGrid;
  }

  function bindMargin(el, key) {
    el.addEventListener('input', function () {
      calib[key] = el.value; save(STORAGE_CALIB, calib); applyCalibration();
    });
  }

  function initControls() {
    syncControls();

    els.mode.addEventListener('change', function () {
      calib.mode = els.mode.value;
      save(STORAGE_CALIB, calib);
      renderGuides();
    });
    bindMargin(els.mTop, 'mTop');
    bindMargin(els.mBottom, 'mBottom');
    bindMargin(els.mLeft, 'mLeft');
    bindMargin(els.mRight, 'mRight');
    els.showGrid.addEventListener('change', function () {
      calib.showGrid = els.showGrid.checked; save(STORAGE_CALIB, calib); applyCalibration();
    });

    document.getElementById('btn-print').addEventListener('click', function () {
      window.print();
    });
    document.getElementById('btn-test').addEventListener('click', printTest);
    document.getElementById('btn-reset-calib').addEventListener('click', function () {
      calib.mTop = CALIB_NOMINAL.top; calib.mBottom = CALIB_NOMINAL.bottom;
      calib.mLeft = CALIB_NOMINAL.left; calib.mRight = CALIB_NOMINAL.right;
      calib.showGrid = false;
      save(STORAGE_CALIB, calib);
      syncControls();
      applyCalibration();
    });
    document.getElementById('btn-clear').addEventListener('click', function () {
      if (!confirm('¿Borrar todos los datos cargados de la carta?')) return;
      data = {};
      save(STORAGE_DATA, data);
      FIELDS.forEach(function (f) {
        var i = document.getElementById('in_' + f.id);
        if (i) i.value = '';
      });
      renderAllText();
    });
  }

  // ------------------------------------------------------------------- arranque
  buildForm();
  initControls();
  renderAllText();
  renderGuides();
  applyCalibration();
})();
