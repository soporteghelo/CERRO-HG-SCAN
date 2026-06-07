// ═══════════════════════════════════════════════════════════════
//  TIPOS VIEW — Gestión de tipos de herramienta (solo master)
// ═══════════════════════════════════════════════════════════════

var TIPOS_VIEW = {
  _items: [],
  _editingIdx: null,

  load: function () {
    var el = document.getElementById('tipos-list');
    if (!el) return;
    el.innerHTML =
      '<div class="skel" style="height:52px;border-radius:12px;margin-bottom:8px"></div>'.repeat(4);
    API.tipos().then(function (data) {
      TIPOS_VIEW._items = Array.isArray(data) ? data : [];
      APP.tipos = TIPOS_VIEW._items; // sync
      TIPOS_VIEW.render();
    }).catch(function () {
      el.innerHTML = '<div class="empty-state"><span class="material-icons">error_outline</span><p>Error al cargar tipos.</p></div>';
    });
  },

  _nombre: function (t) { return typeof t === 'object' ? t.nombre : t; },
  _req:    function (t) { return typeof t === 'object' ? !!t.reqNombre : false; },

  render: function () {
    var el = document.getElementById('tipos-list');
    if (!el) return;
    TIPOS_VIEW._editingIdx = null;
    if (!TIPOS_VIEW._items.length) {
      el.innerHTML = '<div class="empty-state"><span class="material-icons">category</span><p>Sin tipos registrados.</p></div>';
      return;
    }
    el.innerHTML = '';
    TIPOS_VIEW._items.forEach(function (tipo, idx) {
      var nombre = TIPOS_VIEW._nombre(tipo);
      var req    = TIPOS_VIEW._req(tipo);
      var row = document.createElement('div');
      row.id = 'tipo-row-' + idx;
      row.style.cssText = 'display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--border);border-radius:12px;padding:10px 12px;margin-bottom:8px;transition:box-shadow .15s';
      row.innerHTML =
        '<span class="material-icons" style="color:var(--primary);font-size:1.1rem;flex-shrink:0">build_circle</span>' +
        '<span style="flex:1;font-weight:600;font-size:.9rem">' + nombre + '</span>' +
        /* Toggle REQ. NOMBRE */
        '<button onclick="TIPOS_VIEW.toggleReq(' + idx + ')" title="' + (req ? 'Requiere nombre del evaluado: SÍ' : 'No requiere nombre del evaluado') + '"' +
          ' style="background:none;border:none;cursor:pointer;padding:2px">' +
          '<span style="font-size:.68rem;font-weight:700;padding:3px 8px;border-radius:99px;border:1px solid ' +
            (req ? '#2e7d32' : '#bdbdbd') + ';color:' + (req ? '#2e7d32' : '#9e9e9e') + ';background:' +
            (req ? '#e8f5e9' : '#f5f5f5') + ';white-space:nowrap">' + (req ? 'REQ. SÍ' : 'REQ. NO') + '</span>' +
        '</button>' +
        '<button onclick="TIPOS_VIEW.startEdit(' + idx + ')" style="background:none;border:none;cursor:pointer;color:var(--primary);padding:4px;display:flex;align-items:center" title="Editar">' +
          '<span class="material-icons" style="font-size:1.1rem">edit</span>' +
        '</button>' +
        '<button onclick="TIPOS_VIEW.confirmDelete(\'' + nombre.replace(/'/g,"\\'") + '\')" style="background:none;border:none;cursor:pointer;color:var(--danger);padding:4px;display:flex;align-items:center" title="Eliminar">' +
          '<span class="material-icons" style="font-size:1.1rem">delete</span>' +
        '</button>';
      el.appendChild(row);
    });
  },

  toggleReq: function (idx) {
    var tipo   = TIPOS_VIEW._items[idx];
    var nombre = TIPOS_VIEW._nombre(tipo);
    var newReq = !TIPOS_VIEW._req(tipo);
    TIPOS_VIEW._setLoading(true);
    API.editTipo(nombre, nombre, newReq).then(function (res) {
      TIPOS_VIEW._setLoading(false);
      if (res.ok) {
        TIPOS_VIEW._items = res.tipos || TIPOS_VIEW._items;
        APP.tipos = TIPOS_VIEW._items;
        TIPOS_VIEW.render();
        toast(newReq ? '"' + nombre + '" ahora requiere evaluado' : '"' + nombre + '" ya no requiere evaluado', 'success');
      } else {
        toast(res.msg || 'Error', 'error');
      }
    }).catch(function () {
      TIPOS_VIEW._setLoading(false);
      toast('Error de conexión', 'error');
    });
  },

  startEdit: function (idx) {
    var nombre = TIPOS_VIEW._nombre(TIPOS_VIEW._items[idx]);
    var row    = document.getElementById('tipo-row-' + idx);
    if (!row) return;
    TIPOS_VIEW._editingIdx = idx;
    row.innerHTML =
      '<span class="material-icons" style="color:var(--primary);font-size:1.1rem;flex-shrink:0">edit</span>' +
      '<input id="tipo-edit-input" type="text" class="form-control" value="' + nombre + '"' +
        ' style="flex:1;min-height:36px;font-size:.88rem;text-transform:uppercase"' +
        ' oninput="this.value=this.value.toUpperCase()"' +
        ' onkeydown="if(event.key===\'Enter\')TIPOS_VIEW.saveEdit(' + idx + ');if(event.key===\'Escape\')TIPOS_VIEW.render()">' +
      '<button onclick="TIPOS_VIEW.saveEdit(' + idx + ')" style="background:none;border:none;cursor:pointer;color:var(--success);padding:4px;display:flex;align-items:center" title="Guardar">' +
        '<span class="material-icons" style="font-size:1.2rem">check_circle</span>' +
      '</button>' +
      '<button onclick="TIPOS_VIEW.render()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px;display:flex;align-items:center" title="Cancelar">' +
        '<span class="material-icons" style="font-size:1.2rem">cancel</span>' +
      '</button>';
    var inp = document.getElementById('tipo-edit-input');
    if (inp) { inp.focus(); inp.select(); }
  },

  saveEdit: function (idx) {
    var inp = document.getElementById('tipo-edit-input');
    if (!inp) return;
    var nuevo  = inp.value.trim().toUpperCase();
    var tipo   = TIPOS_VIEW._items[idx];
    var old    = TIPOS_VIEW._nombre(tipo);
    var req    = TIPOS_VIEW._req(tipo);
    if (!nuevo) { toast('El nombre no puede estar vacío', 'error'); return; }
    if (nuevo === old) { TIPOS_VIEW.render(); return; }
    TIPOS_VIEW._setLoading(true);
    API.editTipo(old, nuevo, req).then(function (res) {
      TIPOS_VIEW._setLoading(false);
      if (res.ok) {
        TIPOS_VIEW._items = res.tipos || TIPOS_VIEW._items;
        APP.tipos = TIPOS_VIEW._items;
        TIPOS_VIEW.render();
        toast('Tipo actualizado', 'success');
      } else {
        toast(res.msg || 'Error al editar', 'error');
      }
    }).catch(function () {
      TIPOS_VIEW._setLoading(false);
      toast('Error de conexión', 'error');
    });
  },

  confirmDelete: function (nombre) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9000;display:flex;align-items:flex-end;justify-content:center';
    ov.innerHTML =
      '<div style="background:#fff;border-radius:20px 20px 0 0;padding:24px 20px;width:100%;max-width:480px">' +
        '<div style="font-weight:700;font-size:1rem;margin-bottom:6px">¿Eliminar tipo?</div>' +
        '<div style="font-size:.88rem;color:var(--text-muted);margin-bottom:20px">Se eliminará <strong>' + nombre + '</strong> de la lista. Los registros existentes no se verán afectados.</div>' +
        '<button id="td-confirm" class="btn" style="background:var(--danger);color:#fff;margin-bottom:8px"><span class="material-icons">delete</span> Eliminar</button>' +
        '<button id="td-cancel" class="btn btn-outline">Cancelar</button>' +
      '</div>';
    document.body.appendChild(ov);
    document.getElementById('td-cancel').onclick = function () { document.body.removeChild(ov); };
    document.getElementById('td-confirm').onclick = function () {
      document.body.removeChild(ov);
      TIPOS_VIEW.doDelete(nombre);
    };
  },

  doDelete: function (nombre) {
    TIPOS_VIEW._setLoading(true);
    API.deleteTipo(nombre).then(function (res) {
      TIPOS_VIEW._setLoading(false);
      if (res.ok) {
        TIPOS_VIEW._items = res.tipos || [];
        APP.tipos = TIPOS_VIEW._items;
        TIPOS_VIEW.render();
        toast('Tipo eliminado', 'success');
      } else {
        toast(res.msg || 'Error al eliminar', 'error');
      }
    }).catch(function () {
      TIPOS_VIEW._setLoading(false);
      toast('Error de conexión', 'error');
    });
  },

  addNew: function () {
    var inp = document.getElementById('tipos-new-input');
    var reqEl = document.getElementById('tipos-new-req');
    if (!inp) return;
    var val    = inp.value.trim().toUpperCase();
    var reqVal = reqEl ? reqEl.dataset.req === 'true' : false;
    if (!val) { toast('Escribe un nombre', 'error'); return; }
    TIPOS_VIEW._setLoading(true);
    API.addTipo(val, reqVal).then(function (res) {
      TIPOS_VIEW._setLoading(false);
      if (res.ok) {
        TIPOS_VIEW._items = res.tipos || TIPOS_VIEW._items;
        APP.tipos = TIPOS_VIEW._items;
        TIPOS_VIEW.render();
        inp.value = '';
        if (reqEl) { reqEl.dataset.req = 'false'; TIPOS_VIEW._updateReqBtn(reqEl, false); }
        toast('"' + val + '" agregado', 'success');
      } else {
        toast(res.msg || 'Error al agregar', 'error');
      }
    }).catch(function () {
      TIPOS_VIEW._setLoading(false);
      toast('Error de conexión', 'error');
    });
  },

  toggleNewReq: function () {
    var el = document.getElementById('tipos-new-req');
    if (!el) return;
    var newVal = el.dataset.req !== 'true';
    el.dataset.req = String(newVal);
    TIPOS_VIEW._updateReqBtn(el, newVal);
  },

  _updateReqBtn: function (el, req) {
    el.textContent  = req ? 'REQ. SÍ' : 'REQ. NO';
    el.style.color  = req ? '#2e7d32' : '#9e9e9e';
    el.style.background = req ? '#e8f5e9' : '#f5f5f5';
    el.style.borderColor = req ? '#2e7d32' : '#bdbdbd';
    el.title = req ? 'Requiere nombre de evaluado: SÍ (clic para cambiar)' : 'No requiere nombre de evaluado (clic para cambiar)';
  },

  _setLoading: function (on) {
    var btn = document.getElementById('tipos-add-btn');
    if (btn) btn.disabled = on;
  }
};
