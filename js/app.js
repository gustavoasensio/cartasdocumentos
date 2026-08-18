/*
 * app.js — impresor de Cartas Documento (Modelo CD).
 * Depende de config.js (SHEET, CALIB_NOMINAL, DATA_FIELDS, BLOCKS).
 *
 * Ideas clave
 * -----------
 * - El usuario ESCRIBE los datos una sola vez (DATA_FIELDS).
 * - Cada BLOCK dice DÓNDE se imprime algo; un dato puede repetirse en varios
 *   bloques (copia A.R. y copia Carta Documento).
 * - "Modo ubicar": se carga una imagen del formulario como guía y se arrastran
 *   los bloques a su lugar. Las posiciones quedan guardadas en el navegador.
 * - Calibración por hoja de prueba: corrige el desfasaje/escala de la impresora
 *   (transformación afín aplicada al imprimir, no al ubicar).
 */
(function () {
  'use strict';

  var K = {
    data:   'cd_data_v1',
    calib:  'cd_calib_v2',
    layout: 'cd_layout_v1',
    ui:     'cd_ui_v1',
    bg:     'cd_bg_v1',
  };

  var els = {
    formFields: document.getElementById('form-fields'),
    sheet:      document.getElementById('sheet'),
    content:    document.getElementById('content'),
    grid:       document.getElementById('grid'),
    test:       document.getElementById('test'),
    bg:         document.getElementById('bg'),
    mode:       document.getElementById('mode'),
    editMode:   document.getElementById('editMode'),
    bgFile:     document.getElementById('bgFile'),
    bgOpacity:  document.getElementById('bgOpacity'),
    mTop:    document.getElementById('mTop'),
    mBottom: document.getElementById('mBottom'),
    mLeft:   document.getElementById('mLeft'),
    mRight:  document.getElementById('mRight'),
    showGrid: document.getElementById('showGrid'),
  };

  var CALIB_DEFAULT = {
    mTop: CALIB_NOMINAL.top, mBottom: CALIB_NOMINAL.bottom,
    mLeft: CALIB_NOMINAL.left, mRight: CALIB_NOMINAL.right,
  };
  var UI_DEFAULT = { mode: 'overlay', showGrid: false, editMode: false, bgOpacity: 55 };

  // Estado ------------------------------------------------------------------
  var data   = load(K.data, {});
  var calib  = load(K.calib, CALIB_DEFAULT);
  var layout = load(K.layout, {});          // { blockId: {left, top} }
  var ui     = load(K.ui, UI_DEFAULT);

  // ------------------------------------------------------------------ helpers
  function load(key, fallback) {
    try { return Object.assign({}, fallback, JSON.parse(localStorage.getItem(key)) || {}); }
    catch (e) { return Object.assign({}, fallback); }
  }
  function save(key, obj) { try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) {} }
  function mm(v) { return v + 'mm'; }
  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; }
  function pos(b) { var o = layout[b.id] || {}; return { left: num(o.left, b.left), top: num(o.top, b.top) }; }

  // --------------------------------------------------- construir panel de carga
  function buildForm() {
    var sections = {}, order = [];
    DATA_FIELDS.forEach(function (f) {
      if (!sections[f.section]) { sections[f.section] = []; order.push(f.section); }
      sections[f.section].push(f);
    });
    order.forEach(function (name) {
      var sec = document.createElement('div');
      sec.className = 'field-section';
      var h = document.createElement('h2'); h.textContent = name; sec.appendChild(h);
      sections[name].forEach(function (f) {
        var wrap = document.createElement('div'); wrap.className = 'field';
        var lbl = document.createElement('label'); lbl.textContent = f.label;
        lbl.setAttribute('for', 'in_' + f.id); wrap.appendChild(lbl);
        var input = f.type === 'textarea' ? document.createElement('textarea')
                                          : document.createElement('input');
        if (f.type === 'textarea') input.rows = f.rows || 6; else input.type = 'text';
        input.id = 'in_' + f.id;
        input.value = data[f.id] || '';
        input.addEventListener('input', function () {
          data[f.id] = input.value; save(K.data, data); renderBlocks();
        });
        wrap.appendChild(input); sec.appendChild(wrap);
      });
      els.formFields.appendChild(sec);
    });
  }

  // -------------------------------------------------- contenido de cada bloque
  function linesFor(kind) {
    function L(text, bold) { return { text: (text || ' '), bold: !!bold }; }
    if (kind === 'remitente' || kind === 'destinatario') {
      var p = kind === 'remitente' ? 'rem_' : 'dest_';
      var loc = [data[p + 'localidad'] || ''];
      if (data[p + 'cp']) loc.push('C.P. ' + data[p + 'cp']);
      if (data[p + 'provincia']) loc.push(data[p + 'provincia']);
      return [
        L(data[p + 'nombre'], true),
        L(data[p + 'domicilio']),
        L(loc.join('   ').trim()),
      ];
    }
    if (kind === 'body') {
      var t = (data.texto || '').split('\n');
      return t.map(function (line) { return L(line); });
    }
    return [];
  }

  function renderBlocks() {
    BLOCKS.forEach(function (b) {
      var node = document.getElementById('blk_' + b.id);
      if (!node) {
        node = document.createElement('div');
        node.id = 'blk_' + b.id;
        node.className = 'block';
        node.dataset.id = b.id;
        var tag = document.createElement('span');
        tag.className = 'block-tag'; tag.textContent = b.label;
        node.appendChild(tag);
        var body = document.createElement('div');
        body.className = 'block-body';
        node.appendChild(body);
        els.content.appendChild(node);
      }
      var bodyEl = node.querySelector('.block-body');
      bodyEl.innerHTML = '';
      linesFor(b.kind).forEach(function (l) {
        var d = document.createElement('div');
        d.className = 'ln' + (l.bold ? ' bold' : '');
        d.textContent = l.text;
        if (b.lineHeight) d.style.lineHeight = mm(b.lineHeight);
        bodyEl.appendChild(d);
      });
      applyBlockGeom(b, node);
    });
  }

  function applyBlockGeom(b, node) {
    var p = pos(b);
    node.style.left = mm(p.left);
    node.style.top = mm(p.top);
    node.style.width = mm(b.width);
    node.style.fontSize = mm(b.size);
  }

  // ------------------------------------------------------- calibración (afín)
  function calcTransform() {
    var W = SHEET.width, H = SHEET.height, nom = CALIB_NOMINAL;
    var mL = num(calib.mLeft, nom.left), mR = num(calib.mRight, nom.right);
    var mT = num(calib.mTop, nom.top),   mB = num(calib.mBottom, nom.bottom);
    var dX = W - mL - mR, dY = H - mT - mB;
    var sx = dX > 0 ? (W - nom.left - nom.right) / dX : 1;
    var sy = dY > 0 ? (H - nom.top - nom.bottom) / dY : 1;
    var tx = nom.left - mL * sx, ty = nom.top - mT * sy;
    return 'translate(' + mm(tx) + ',' + mm(ty) + ') scale(' +
           sx.toFixed(5) + ',' + sy.toFixed(5) + ')';
  }

  // Al ubicar (edit-mode) se anula la calibración para arrastrar 1:1 sobre la
  // imagen; la corrección de impresora se aplica sólo para imprimir.
  function applyCalibration() {
    els.content.style.transform = ui.editMode ? 'none' : calcTransform();
    els.grid.hidden = !calib.showGrid;
  }

  // ------------------------------------------------------------- fondo (guía)
  function applyBg() {
    var src = localStorage.getItem(K.bg);
    if (src) { els.bg.src = src; els.bg.hidden = false; }
    else { els.bg.removeAttribute('src'); els.bg.hidden = true; }
    els.bg.style.opacity = (num(ui.bgOpacity, 55) / 100);
  }

  function applyModeClasses() {
    document.body.classList.toggle('mode-full', ui.mode === 'full');
    document.body.classList.toggle('edit-mode', !!ui.editMode);
  }

  // -------------------------------------------------------------------- drag
  function pxPerMm() { return els.sheet.getBoundingClientRect().width / SHEET.width; }

  function initDrag() {
    var active = null; // { b, node, startX, startY, startL, startT }
    els.content.addEventListener('pointerdown', function (e) {
      if (!ui.editMode) return;
      var node = e.target.closest('.block');
      if (!node) return;
      var b = BLOCKS.filter(function (x) { return x.id === node.dataset.id; })[0];
      if (!b) return;
      var p = pos(b);
      active = { b: b, node: node, startX: e.clientX, startY: e.clientY,
                 startL: p.left, startT: p.top };
      node.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    els.content.addEventListener('pointermove', function (e) {
      if (!active) return;
      var k = pxPerMm();
      var nl = active.startL + (e.clientX - active.startX) / k;
      var nt = active.startT + (e.clientY - active.startY) / k;
      nl = Math.max(0, Math.min(SHEET.width - 2, nl));
      nt = Math.max(0, Math.min(SHEET.height - 2, nt));
      active.node.style.left = mm(round1(nl));
      active.node.style.top = mm(round1(nt));
      layout[active.b.id] = { left: round1(nl), top: round1(nt) };
    });
    function end(e) {
      if (!active) return;
      try { active.node.releasePointerCapture(e.pointerId); } catch (x) {}
      save(K.layout, layout);
      active = null;
    }
    els.content.addEventListener('pointerup', end);
    els.content.addEventListener('pointercancel', end);
  }
  function round1(v) { return Math.round(v * 10) / 10; }

  // ------------------------------------------------------------- hoja de prueba
  function buildTestSheet() {
    var W = SHEET.width, H = SHEET.height, nom = CALIB_NOMINAL;
    els.test.innerHTML = '';
    var frame = document.createElement('div');
    frame.className = 'test-frame';
    frame.style.left = mm(nom.left); frame.style.top = mm(nom.top);
    frame.style.width = mm(W - nom.left - nom.right);
    frame.style.height = mm(H - nom.top - nom.bottom);
    els.test.appendChild(frame);

    addNote('HOJA DE PRUEBA DE CALIBRACIÓN', H / 2 - 24, 'test-title');
    addNote('Imprimí en hoja OFICIO, papel "Oficio", márgenes "Ninguno", escala 100%.<br>' +
      'Con una regla, medí en mm del BORDE de la hoja a cada línea del marco<br>' +
      'y cargá esos 4 valores en la calibración. Diseño: sup ' + nom.top + ' / inf ' +
      nom.bottom + ' / izq ' + nom.left + ' / der ' + nom.right + ' mm.', H / 2 - 12);
    addSide('MEDIR ↑ (superior)', W / 2 - 20, nom.top + 3);
    addSide('MEDIR ↓ (inferior)', W / 2 - 20, H - nom.bottom - 8);
    addSide('MEDIR → (izquierdo)', nom.left + 3, H / 2 + 14);
    addSide('MEDIR ← (derecho)', W - nom.right - 32, H / 2 + 14);

    function addNote(html, top, cls) {
      var n = document.createElement('div');
      n.className = 'test-note' + (cls ? ' ' + cls : '');
      n.style.top = mm(top); n.innerHTML = html; els.test.appendChild(n);
    }
    function addSide(text, left, top) {
      var s = document.createElement('div');
      s.className = 'test-side';
      s.style.left = mm(left); s.style.top = mm(top);
      s.textContent = text; els.test.appendChild(s);
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
    setTimeout(cleanup, 1500);
  }

  // ------------------------------------------------------------------- UI init
  function syncControls() {
    els.mode.value = ui.mode;
    els.editMode.checked = !!ui.editMode;
    els.bgOpacity.value = num(ui.bgOpacity, 55);
    els.mTop.value = calib.mTop; els.mBottom.value = calib.mBottom;
    els.mLeft.value = calib.mLeft; els.mRight.value = calib.mRight;
    els.showGrid.checked = !!calib.showGrid;
  }

  function bindMargin(el, key) {
    el.addEventListener('input', function () {
      calib[key] = el.value; save(K.calib, calib); applyCalibration();
    });
  }

  function initControls() {
    syncControls();

    els.mode.addEventListener('change', function () {
      ui.mode = els.mode.value; save(K.ui, ui); applyModeClasses();
    });
    els.editMode.addEventListener('change', function () {
      ui.editMode = els.editMode.checked; save(K.ui, ui);
      applyModeClasses(); applyCalibration();
    });
    els.bgOpacity.addEventListener('input', function () {
      ui.bgOpacity = els.bgOpacity.value; save(K.ui, ui); applyBg();
    });
    els.bgFile.addEventListener('change', function () {
      var file = els.bgFile.files && els.bgFile.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try { localStorage.setItem(K.bg, reader.result); } catch (e) {
          alert('La imagen es muy grande para guardarla. Probá con una más liviana.');
        }
        applyBg();
      };
      reader.readAsDataURL(file);
    });
    document.getElementById('btn-bg-clear').addEventListener('click', function () {
      localStorage.removeItem(K.bg); els.bgFile.value = ''; applyBg();
    });
    document.getElementById('btn-reset-layout').addEventListener('click', function () {
      if (!confirm('¿Volver las posiciones de los bloques a las de fábrica?')) return;
      layout = {}; save(K.layout, layout); renderBlocks();
    });

    bindMargin(els.mTop, 'mTop'); bindMargin(els.mBottom, 'mBottom');
    bindMargin(els.mLeft, 'mLeft'); bindMargin(els.mRight, 'mRight');
    els.showGrid.addEventListener('change', function () {
      calib.showGrid = els.showGrid.checked; save(K.calib, calib); applyCalibration();
    });

    document.getElementById('btn-print').addEventListener('click', function () {
      if (ui.editMode) {
        // Al imprimir salimos del modo ubicar para aplicar la calibración.
        ui.editMode = false; save(K.ui, ui); syncControls();
        applyModeClasses(); applyCalibration();
      }
      window.print();
    });
    document.getElementById('btn-test').addEventListener('click', printTest);
    document.getElementById('btn-reset-calib').addEventListener('click', function () {
      calib.mTop = CALIB_NOMINAL.top; calib.mBottom = CALIB_NOMINAL.bottom;
      calib.mLeft = CALIB_NOMINAL.left; calib.mRight = CALIB_NOMINAL.right;
      calib.showGrid = false; save(K.calib, calib);
      syncControls(); applyCalibration();
    });
    document.getElementById('btn-clear').addEventListener('click', function () {
      if (!confirm('¿Borrar todos los datos cargados de la carta?')) return;
      data = {}; save(K.data, data);
      DATA_FIELDS.forEach(function (f) {
        var i = document.getElementById('in_' + f.id); if (i) i.value = '';
      });
      renderBlocks();
    });
  }

  // ------------------------------------------------------------------- arranque
  buildForm();
  initControls();
  renderBlocks();
  applyModeClasses();
  applyBg();
  applyCalibration();
  initDrag();
})();
