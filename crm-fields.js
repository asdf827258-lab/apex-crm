/* ═══════════════════════════════════════════════════════════════════
   crm-fields.js — ➕ <b>고객 칸 더하기</b> (판 X595)

   사장님 말씀 (2026-11-27) 「고객 추가나 고객 입력칸은 어떤 칸이든 추가해서 삽입할수 있게 해」

   ── 무엇을 하나 ──────────────────────────────────────────────────
   ★ DB 통합 CRM 「DB 등록 · DB 수정」 창(옆창 ✏️ 고치기와 같은 창) 맨 아래에 <b>➕ 더한 칸</b>이 섭니다.
     대표 · 관리자가 「⚙ 칸 더하기 · 고치기」 에서 칸을 만들면(이름 · 종류 · 고르기 목록) 팀 모두의 창에 같이 섭니다.
     종류 = 글 · 긴 글 · 숫자 · 금액(만원) · 날짜 · 고르기 · 예/아니오. 차례 바꾸기 · 빼기도 그 자리에서.
   ★ 칸 목록은 앱 설정 한 칸(app_config 'db_fields' · 팀 전체가 같이 봄 · 대표 · 관리자만 고침 — 서버 규칙 그대로).
   ★ 고객마다 적은 값은 배정 DB 줄의 여분 칸(dbs.followup)의 <b>_fx</b> 자리에 — <b>서버 표를 새로 만들거나 바꾸지 않습니다</b>.
     followup 의 다른 자리(계약 뒤 챙김 m1 · m3 …)는 그대로 두고 _fx 만 고칩니다(apex-care.js 도 통째로 복사해 고치는 같은 꼴).
   ★ 저장은 있던 「저장」 단추 한 번 — saveDb 가 성공해 창이 닫힌 뒤에 더한 칸만 같은 줄에 한 번 더 적습니다(바뀐 것이 있을 때만).
     새로 넣은 분은 저장 뒤 그 이름 · 번호로 막 생긴 줄을 찾아 적습니다.
   ★ 칸을 빼도 고객 값은 지우지 않습니다(다시 같은 칸을 만들면 돌아옴 — 지운 값은 되살릴 수 없으니).
   ★ 이 파일을 빼면(db-crm.html 맨 아래 한 줄) 예전 창 그대로.
   ═══════════════════════════════════════════════════════════════════ */
(function (W) {
  'use strict';
  var D = W.document, KEY = 'db_fields', MAX = 30;
  var TY = [['text', '글'], ['long', '긴 글'], ['num', '숫자'], ['won', '금액(만원)'], ['date', '날짜'], ['sel', '고르기'], ['yn', '예/아니오']];
  var FX = { defs: [], init: '', id: '', draft: null };
  var O = { openDb: W.openDb, saveDb: W.saveDb };
  if (typeof O.openDb !== 'function' || typeof O.saveDb !== 'function') return;

  function el(id) { return D.getElementById(id); }
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function T(f, d) { try { var v = f(); return v === undefined ? d : v; } catch (e) { return d; } }
  function say(m, ms) { try { W.toast(m, ms); } catch (e) {} }
  function client() { return T(function () { return sb; }, null); }                                 /* eslint-disable-line no-undef */
  function rows() { return T(function () { return dbs; }, []) || []; }                               /* eslint-disable-line no-undef */
  function find(id) { var L = rows(), i; for (i = 0; i < L.length; i++) if (L[i] && L[i].id === id) return L[i]; return null; }
  function par() { var P = T(function () { return W.parent && W.parent !== W && typeof W.parent.osCfgGet === 'function' ? W.parent : null; }, null); return P; }
  function admin() {
    var P = par();
    if (P && T(function () { return (typeof P.osIsOwner === 'function' && P.osIsOwner()) || (typeof P.osIsAppAdmin === 'function' && P.osIsAppAdmin()); }, false)) return true;
    return !!T(function () { return W.canManage(); }, false);
  }
  function clean(L) {
    var seen = {};
    return (Array.isArray(L) ? L : []).filter(function (f) {
      if (!f || typeof f.k !== 'string' || !/^f[a-z0-9]{2,20}$/.test(f.k) || seen[f.k] || !String(f.t || '').trim()) return false;
      seen[f.k] = 1; return true;
    }).slice(0, MAX).map(function (f) {
      var ty = TY.some(function (x) { return x[0] === f.ty; }) ? f.ty : 'text';
      return { k: f.k, t: String(f.t).trim().slice(0, 20), ty: ty, o: ty === 'sel' ? (Array.isArray(f.o) ? f.o : []).map(function (x) { return String(x).trim().slice(0, 20); }).filter(Boolean).slice(0, 20) : [] };
    });
  }
  function parse(v) { try { return clean(JSON.parse(v || '[]')); } catch (e) { return []; } }
  function loadDefs(cb) {
    var P = par(), s;
    if (P) { FX.defs = parse(T(function () { return P.osCfgGet(KEY, ''); }, '')); if (cb) cb(); return; }
    s = client(); if (!s) { if (cb) cb(); return; }
    try {
      s.from('app_config').select('value').eq('key', KEY).maybeSingle().then(function (r) {
        if (r && !r.error && r.data) FX.defs = parse(r.data.value);
        if (cb) cb();
      }, function () { if (cb) cb(); });
    } catch (e) { if (cb) cb(); }
  }
  function valsOf(d) { var f = d && d.followup; return (f && typeof f === 'object' && f._fx && typeof f._fx === 'object') ? f._fx : {}; }

  function css() {
    if (el('fxCss')) return;
    var s = D.createElement('style'); s.id = 'fxCss';
    s.textContent = [
      '#fxBox{margin-top:16px;padding-top:14px;border-top:1px dashed #D6DCE4}',
      '#fxBox .fx-h{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}',
      '#fxBox .fx-h b{font-size:15px}#fxBox .fx-h small{display:block;font-size:13px;font-weight:600;color:#94A3B8}',
      '#fxBox .fx-yn{display:flex;gap:6px}#fxBox .fx-yn button{flex:1;min-height:44px;border-radius:10px;border:1px solid #E5E8EB;background:#fff;font:inherit;font-size:14px;font-weight:700;cursor:pointer}',
      '#fxBox .fx-yn button.on{background:#1A56DB;border-color:#1A56DB;color:#fff}',
      '#fxModal .fx-row{display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid #EEF1F4}',
      '#fxModal .fx-row .tx{flex:1;min-width:0}#fxModal .fx-row .tx b{display:block;font-size:15px}#fxModal .fx-row .tx small{display:block;font-size:13px;color:#6B7684}',
      '#fxModal .fx-row button{min-width:40px;min-height:40px;border-radius:10px;border:1px solid #E5E8EB;background:#fff;font:inherit;font-size:14px;cursor:pointer}',
      '#fxModal .fx-add{display:grid;grid-template-columns:1fr 150px;gap:8px;margin-top:14px}',
      '#fxModal .fx-add input,#fxModal .fx-add select{min-height:44px}',
      '#fxModal .fx-empty{font-size:14px;color:#6B7684;padding:12px 0}'
    ].join('\n');
    D.head.appendChild(s);
  }
  function inp(f, v) {
    var id = 'fx_' + f.k, val = v == null ? '' : v;
    if (f.ty === 'long') return '<textarea id="' + id + '">' + E(val) + '</textarea>';
    if (f.ty === 'num' || f.ty === 'won') return '<input id="' + id + '" type="number" inputmode="numeric" step="any" value="' + E(val) + '"' + (f.ty === 'won' ? ' placeholder="만원"' : '') + '>';
    if (f.ty === 'date') return '<input id="' + id + '" type="date" value="' + E(val) + '">';
    if (f.ty === 'sel') return '<select id="' + id + '"><option value="">— 고르기 —</option>' + f.o.concat(val && f.o.indexOf(val) < 0 ? [val] : []).map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + E(o) + '</option>'; }).join('') + '</select>';
    if (f.ty === 'yn') return '<div class="fx-yn" id="' + id + '" data-v="' + E(val) + '">' + ['예', '아니오'].map(function (o) { return '<button type="button" class="' + (o === val ? 'on' : '') + '" onclick="apexFxYn(\'' + f.k + '\',\'' + o + '\')">' + o + '</button>'; }).join('') + '</div>';
    return '<input id="' + id + '" value="' + E(val) + '">';
  }
  function read() {
    var o = {};
    FX.defs.forEach(function (f) {
      var e = el('fx_' + f.k); if (!e) return;
      var v = f.ty === 'yn' ? (e.getAttribute('data-v') || '') : String(e.value == null ? '' : e.value).trim();
      if (v !== '') o[f.k] = v;
    });
    return o;
  }
  function paint() {
    var m = el('dbModal'), body = m && m.querySelector('.modal-body'); if (!body) return;
    css();
    var box = el('fxBox');
    if (!box) { box = D.createElement('div'); box.id = 'fxBox'; body.appendChild(box); }
    var ad = admin(), d = FX.id ? find(FX.id) : null, V = valsOf(d);
    if (!FX.defs.length && !ad) { box.innerHTML = ''; box.style.display = 'none'; FX.init = '{}'; return; }
    box.style.display = '';
    box.innerHTML = '<div class="fx-h"><div><b>➕ 더한 칸</b><small>' + (FX.defs.length ? '팀이 같이 쓰는 칸 ' + FX.defs.length + '개 · 저장 단추 한 번에 같이 적혀요' : '아직 더한 칸이 없어요') + '</small></div>' +
      (ad ? '<button type="button" class="btn btn-light btn-sm" onclick="apexFxManage()">⚙ 칸 더하기 · 고치기</button>' : '') + '</div>' +
      (FX.defs.length ? '<div class="formgrid">' + FX.defs.map(function (f) {
        return '<div class="field' + (f.ty === 'long' ? ' full' : '') + '"><label>' + E(f.t) + (f.ty === 'won' ? ' <small style="font-weight:600;color:#94A3B8">만원</small>' : '') + '</label>' + inp(f, V[f.k]) + '</div>';
      }).join('') + '</div>' : '');
    FX.init = JSON.stringify(read());
  }
  W.apexFxYn = function (k, v) {
    var e = el('fx_' + k); if (!e) return;
    var nv = e.getAttribute('data-v') === v ? '' : v; e.setAttribute('data-v', nv);
    [].forEach.call(e.querySelectorAll('button'), function (b) { b.classList.toggle('on', b.textContent === nv); });
  };

  /* 창이 열릴 때 — 있던 openDb(옆창 감싸기 포함)를 먼저 부르고 그 밑에 칸을 세움 */
  W.openDb = function (id) {
    var r = O.openDb.apply(this, arguments);
    FX.id = id || '';
    try { paint(); } catch (e) {}
    loadDefs(function () { try { if (el('dbModal') && el('dbModal').classList.contains('open') && FX.id === (id || '')) paint(); } catch (e) {} });
    return r;
  };
  /* 저장 — 있던 saveDb 가 성공(창이 닫힘)한 뒤 바뀐 칸만 같은 줄 followup._fx 에 */
  function newest(nm, ph) {
    var L = rows().filter(function (d) { return d && d.customer_name === nm && String(d.phone || '') === ph; });
    L.sort(function (a, b) { return String(b.created_at || '') < String(a.created_at || '') ? -1 : 1; });
    return L[0] || null;
  }
  function putFx(row, vals) {
    var s = client(); if (!s || !row) return Promise.resolve();
    var f = Object.assign({}, (row.followup && typeof row.followup === 'object') ? row.followup : {});
    var cur = Object.assign({}, valsOf(row));
    FX.defs.forEach(function (df) { if (vals[df.k] == null) delete cur[df.k]; else cur[df.k] = vals[df.k]; });
    f._fx = cur;
    return s.from('dbs').update({ followup: f }).eq('id', row.id).select('id').then(function (r) {
      if (r && r.error) { say('더한 칸을 저장하지 못했습니다 — ' + (r.error.message || ''), 6000); return; }
      if (!r || !r.data || !r.data.length) { say('더한 칸 — 서버가 받지 않았습니다(내 고객이 아닐 수 있어요)', 6000); return; }
      row.followup = f;
    }, function (e) { say('더한 칸을 저장하지 못했습니다 — ' + ((e && e.message) || '네트워크'), 6000); });
  }
  W.saveDb = async function () {
    var id = (el('dbId') || {}).value || '', vals = FX.defs.length ? read() : {}, dirty = FX.defs.length && JSON.stringify(vals) !== FX.init;
    var nm = String((el('customerName') || {}).value || '').trim(), ph = String((el('phone') || {}).value || '').trim();
    var r = await O.saveDb.apply(this, arguments);
    try {
      if (!dirty || (el('dbModal') && el('dbModal').classList.contains('open'))) return r;   /* 바뀐 것 없음 · 저장 실패(창 그대로) */
      if (!id && !Object.keys(vals).length) return r;
      await putFx(id ? find(id) : newest(nm, ph), vals);
    } catch (e) {}
    return r;
  };

  /* ⚙ 칸 더하기 · 고치기 — 대표 · 관리자만 (서버도 app_config 는 대표 · 관리자만 씀) */
  function host() {
    var m = el('fxModal'); if (m) return m;
    m = D.createElement('div'); m.className = 'modal'; m.id = 'fxModal';
    m.innerHTML = '<div class="modal-box" style="max-width:560px"><div class="modal-head"><h3>⚙ 고객 칸 더하기 · 고치기<small style="display:block;font-size:13px;font-weight:600;color:#94A3B8;margin-top:2px">팀 모두의 DB 등록 · 수정 창에 같이 섭니다</small></h3>' +
      '<button class="close" onclick="apexFxShut()">×</button></div><div class="modal-body" id="fxBody"></div>' +
      '<div class="modal-foot"><button class="btn btn-light" onclick="apexFxShut()">취소</button><button class="btn btn-primary" onclick="apexFxSave()">모두에게 저장</button></div></div>';
    D.body.appendChild(m);
    return m;
  }
  function tyName(ty) { var x = TY.filter(function (t) { return t[0] === ty; })[0]; return x ? x[1] : '글'; }
  function mPaint() {
    var L = FX.draft || [];
    el('fxBody').innerHTML = (L.length ? L.map(function (f, i) {
      return '<div class="fx-row"><div class="tx"><b>' + E(f.t) + '</b><small>' + tyName(f.ty) + (f.ty === 'sel' ? ' · ' + E(f.o.join(' / ') || '목록 없음') : '') + '</small></div>' +
        '<button type="button" onclick="apexFxMv(' + i + ',-1)"' + (i ? '' : ' disabled') + ' aria-label="위로">↑</button><button type="button" onclick="apexFxMv(' + i + ',1)"' + (i < L.length - 1 ? '' : ' disabled') + ' aria-label="아래로">↓</button>' +
        '<button type="button" onclick="apexFxDel(' + i + ')" aria-label="빼기">✕</button></div>';
    }).join('') : '<div class="fx-empty">아직 더한 칸이 없어요 — 아래에서 하나 만들어 보세요 (예: 소개자 · 관심 상품 · 기존 보험사 · 차량 번호)</div>') +
      '<div class="fx-add"><input id="fxNewT" maxlength="20" placeholder="칸 이름 (예: 관심 상품)"><select id="fxNewTy" onchange="apexFxTy()">' + TY.map(function (t) { return '<option value="' + t[0] + '">' + t[1] + '</option>'; }).join('') + '</select>' +
      '<input id="fxNewO" class="hidden" style="grid-column:1/-1" placeholder="고르기 목록 — 쉼표로 (예: 암, 실손, 연금)">' +
      '<button type="button" class="btn btn-light" style="grid-column:1/-1;min-height:44px" onclick="apexFxAdd()">＋ 이 칸 더하기</button></div>' +
      '<div class="notice" style="margin-top:12px;font-size:13px;line-height:1.6">칸을 빼도 고객에게 적힌 값은 지우지 않아요. 저장은 「모두에게 저장」 을 눌러야 해요.</div>';
  }
  W.apexFxManage = function () {
    if (!admin()) { say('칸은 대표 · 관리자만 더할 수 있어요'); return; }
    css(); host(); FX.draft = JSON.parse(JSON.stringify(FX.defs)); mPaint(); el('fxModal').classList.add('open');
  };
  W.apexFxShut = function () { var m = el('fxModal'); if (m) m.classList.remove('open'); FX.draft = null; };
  W.apexFxTy = function () { var o = el('fxNewO'); if (o) o.classList.toggle('hidden', (el('fxNewTy') || {}).value !== 'sel'); };
  W.apexFxAdd = function () {
    var t = String((el('fxNewT') || {}).value || '').trim(), ty = (el('fxNewTy') || {}).value || 'text';
    var o = String((el('fxNewO') || {}).value || '').split(/[,，\n]/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (!t) { say('칸 이름을 적어 주세요'); return; }
    if (FX.draft.length >= MAX) { say('칸은 ' + MAX + '개까지예요'); return; }
    if (FX.draft.some(function (f) { return f.t === t; })) { say('같은 이름의 칸이 있어요'); return; }
    if (ty === 'sel' && !o.length) { say('고르기 목록을 쉼표로 적어 주세요'); return; }
    FX.draft.push({ k: 'f' + Date.now().toString(36) + Math.floor(Math.random() * 36).toString(36), t: t.slice(0, 20), ty: ty, o: ty === 'sel' ? o.slice(0, 20) : [] });
    mPaint();
  };
  W.apexFxMv = function (i, dir) { var L = FX.draft, j = i + dir; if (!L || j < 0 || j >= L.length) return; var x = L[i]; L[i] = L[j]; L[j] = x; mPaint(); };
  W.apexFxDel = function (i) { if (!FX.draft) return; FX.draft.splice(i, 1); mPaint(); };
  W.apexFxSave = function () {
    if (!admin()) { say('칸은 대표 · 관리자만 고칠 수 있어요'); return; }
    var v = JSON.stringify(clean(FX.draft)), P = par(), done = function () {
      W.apexFxShut();
      if (el('dbModal') && el('dbModal').classList.contains('open')) { var keep = read(); paint(); FX.defs.forEach(function (f) { var e = el('fx_' + f.k); if (e && keep[f.k] != null) { if (f.ty === 'yn') W.apexFxYn(f.k, keep[f.k]); else e.value = keep[f.k]; } }); }
    };
    if (P && typeof P.osCfgSet === 'function') {
      P.osCfgSet(KEY, v, function () { FX.defs = parse(T(function () { return P.osCfgGet(KEY, ''); }, '')); done(); });
      return;
    }
    var s = client(); if (!s) { say('서버 연결이 필요합니다'); return; }
    s.from('app_config').upsert({ key: KEY, value: v, updated_at: new Date().toISOString() }, { onConflict: 'key' }).then(function (r) {
      if (r && r.error) { say('저장하지 못했습니다 — ' + (r.error.message || ''), 6000); return; }
      FX.defs = parse(v); say('저장했습니다.'); done();
    }, function () { say('저장 실패'); });
  };
  W.apexFxDefs = function () { return FX.defs.slice(); };
  loadDefs();
})(window);
