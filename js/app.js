/*
 * app.js — lógica del impresor de Cartas Documento.
 * Depende de config.js (SHEET, FIELDS, GUIDES).
 */
(function () {
  'use strict';

  var STORAGE_DATA  = 'cd_data_v1';
  var STORAGE_CALIB = 'cd_calib_v1';

  var els = {
    formFields: document.getElementById('form-fields'),
    content:    document.getElementById('content'),
    guides:     document.getElementById('guides'),
    grid:       document.getElementById('grid'),
    mode:       document.getElementById('mode'),
    offsetX:    document.getElementById('offsetX'),
    offsetY:    document.getElementById('offsetY'),
    fontScale:  document.getElementById('fontScale'),
    showGrid:   document.getElementById('showGrid'),
  };

  // Estado ------------------------------------------------------------------
  var data  = load(STORAGE_DATA, {});
  var calib = load(STORAGE_CALIB, { offsetX: 0, offsetY: 0, fontScale: 100, mode: 'overlay', showGrid: false });

  // ------------------------------------------------------------------ helpers
  function load(key, fallback) {
    try { return Object.assign({}, fallback, JSON.parse(localStorage.getItem(key)) || {}); }
    catch (e) { return Object.assign({}, fallback); }
  }
  function save(key, obj) {
    try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) {}
  }
  function mm(v) { return v + 'mm'; }

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
    var scale = (Number(calib.fontScale) || 100) / 100;
    node.style.left = mm(f.left);
    node.style.top = mm(f.top);
    node.style.width = mm(f.width);
    node.style.fontSize = mm(f.size * scale);
    if (f.lineHeight) node.style.lineHeight = mm(f.lineHeight * scale);
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

  // ------------------------------------------------------- aplicar calibración
  function applyCalibration() {
    var t = 'translate(' + mm(Number(calib.offsetX) || 0) + ',' + mm(Number(calib.offsetY) || 0) + ')';
    els.content.style.transform = t;
    els.guides.style.transform = t;
    els.grid.hidden = !calib.showGrid;
  }

  // ------------------------------------------------------------------- UI init
  // Vuelca el estado de calibración a los controles (sin enlazar eventos).
  function syncControls() {
    els.mode.value = calib.mode;
    els.offsetX.value = calib.offsetX;
    els.offsetY.value = calib.offsetY;
    els.fontScale.value = calib.fontScale;
    els.showGrid.checked = !!calib.showGrid;
  }

  function initControls() {
    syncControls();

    els.mode.addEventListener('change', function () {
      calib.mode = els.mode.value;
      save(STORAGE_CALIB, calib);
      renderGuides();
    });
    els.offsetX.addEventListener('input', function () {
      calib.offsetX = els.offsetX.value; save(STORAGE_CALIB, calib); applyCalibration();
    });
    els.offsetY.addEventListener('input', function () {
      calib.offsetY = els.offsetY.value; save(STORAGE_CALIB, calib); applyCalibration();
    });
    els.fontScale.addEventListener('input', function () {
      calib.fontScale = els.fontScale.value; save(STORAGE_CALIB, calib); renderAllText();
    });
    els.showGrid.addEventListener('change', function () {
      calib.showGrid = els.showGrid.checked; save(STORAGE_CALIB, calib); applyCalibration();
    });

    document.getElementById('btn-print').addEventListener('click', function () {
      window.print();
    });
    document.getElementById('btn-reset-calib').addEventListener('click', function () {
      calib.offsetX = 0; calib.offsetY = 0; calib.fontScale = 100; calib.showGrid = false;
      save(STORAGE_CALIB, calib);
      syncControls();      // re-sincroniza inputs (sin re-enlazar eventos)
      applyCalibration();
      renderAllText();
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
