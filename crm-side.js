/* ═══════════════════════════════════════════════════════════════════
   crm-side.js — 🗂 <b>DB 통합 CRM 고객 옆창</b> (판 X594)

   사장님 말씀 (2026-11-27)
     「DB통합CRM과 고객칸을 페이지이동없이 유지시키는게 가능할까? …
       DB통합CRM으로 바로 하지만, 고객 누르면 현재 고객 수정하는것처럼 하고싶은데 디자인부터 짜볼까」
     시안(메뉴정리_1단계\CRM_고객옆창_시안.html)을 보시고 「그치 이거지 이대로 만들어 한번에 관리되도록」

   ── 무엇을 하나 ──────────────────────────────────────────────────
   ★ 명단에서 <b>이름을 누르면</b> 그분 「DB 수정」 창이 열립니다(내 고객일 때 · 아니면 예전처럼 고객 한 장).
   ★ 넓은 화면(1100px 이상)에서는 그 창이 <b>가운데를 덮지 않고 오른쪽 옆창</b>으로 섭니다 —
     왼쪽 명단은 그대로 남고(좁은 줄: 고객 · 단계 · 상담 약속 · 관리), 다른 분을 누르면 옆창만 바뀝니다.
   ★ 옆창 맨 위 = 그분 머리(이름 · 단계 · 약속 · 💰 목표 계약금액) + 📞 전화 · 📋 단톡 문구 · ➡️ 다음 단계 +
     칸 세 개 ✏️ 고치기(DB 수정 창) · 📞 통화(TA 결과 기록 창) · 📇 고객 한 장(고객 한 장 창).
   ★ 홈(오늘 화면)에서 이름을 누르면 앱이 DB 통합 CRM 을 열고 window.apexCrmSide(id) 로 그분 옆창을 바로 띄웁니다.
     주소 ?open=<id> 로 열어도 같습니다.

   ── 새로 안 짠 것 ────────────────────────────────────────────────
   ★ <b>저장 코드 없음</b> — 칸 · 저장은 있던 창(openDb · saveDb / openCall · saveCall / cusOpen) 그대로.
     옆창은 그 창들의 <b>자리와 머리</b>만 바꿉니다. 그래서 홈 · 고객 화면 · 업적 숫자가 같이 움직입니다.
   ★ 프로그램으로 부르는 cusOpen(id) 는 예전 그대로(고객 한 장) — 바뀌는 것은 <b>명단의 이름 단추를 손으로 누를 때</b>뿐.
   ★ 좁은 화면(폰)은 창 자리는 예전 그대로(가운데) · 머리와 칸 세 개만 붙습니다.
   ★ 이 파일을 빼면(db-crm.html 맨 아래 한 줄) 예전 화면 그대로 — 되돌리는 길.
   ═══════════════════════════════════════════════════════════════════ */
(function (W) {
  'use strict';
  var D = W.document, MIN = 1100;
  var MD = { edit: 'dbModal', call: 'callModal', card: 'cusModal' }, IDS = ['dbModal', 'callModal', 'cusModal'];
  var SIDE = { on: false, id: '', tab: '' };
  var O = { openDb: W.openDb, openCall: W.openCall, cusOpen: W.cusOpen, closeModal: W.closeModal, renderDb: W.renderDb };
  if (typeof O.openDb !== 'function' || typeof O.openCall !== 'function' || typeof O.cusOpen !== 'function' || typeof O.closeModal !== 'function') return;

  function el(id) { return D.getElementById(id); }
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function T(f, d) { try { var v = f(); return v === undefined ? d : v; } catch (e) { return d; } }
  function rows() { return T(function () { return dbs; }, []) || []; }                          /* eslint-disable-line no-undef */
  function find(id) { var L = rows(), i; for (i = 0; i < L.length; i++) if (L[i] && L[i].id === id) return L[i]; return null; }
  function can(d) { return !!(d && T(function () { return W.canEditDb(d); }, false)); }
  function anyOpen() { return IDS.some(function (k) { var m = el(k); return m && m.classList.contains('open'); }); }

  function css() {
    if (el('csCss')) return;
    var s = D.createElement('style'); s.id = 'csCss';
    s.textContent = [
      '.cs-head{padding:16px 20px 0;border-bottom:1px solid #E5E8EB;background:#fff;position:sticky;top:0;z-index:2}',
      '.cs-h1{display:flex;align-items:center;gap:12px}',
      '.cs-av{flex:none;width:44px;height:44px;border-radius:22px;background:#EAF1FF;color:#1A56DB;font-weight:800;font-size:18px;display:flex;align-items:center;justify-content:center}',
      '.cs-nm{flex:1;min-width:0}.cs-nm b{display:block;font-size:20px;font-weight:800;color:#191F28}.cs-nm small{display:block;font-size:13px;color:#6B7684}',
      '.cs-x{flex:none;width:40px;height:40px;border-radius:20px;border:0;background:#F2F4F6;font-size:17px;cursor:pointer}',
      '.cs-pills{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}',
      '.cs-pl{display:inline-flex;align-items:center;min-height:30px;padding:0 10px;border-radius:9px;font-size:13px;font-weight:800;background:#EAF1FF;color:#1A56DB}',
      '.cs-pl.g{background:#F2F4F6;color:#4E5968}.cs-pl.amt{background:#FFF8E6;color:#8A5A00}.cs-pl.miss{background:#FFF1E6;color:#C2410C}',
      '.cs-qa{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}',
      '.cs-qa a,.cs-qa button{display:flex;align-items:center;justify-content:center;min-height:44px;padding:0 6px;border-radius:12px;border:0;background:#F2F4F6;font:inherit;font-size:14px;font-weight:700;color:#191F28;text-decoration:none;cursor:pointer;text-align:center}',
      '.cs-qa .p{background:#1A56DB;color:#fff}.cs-qa .off{opacity:.45;cursor:default}',
      '.cs-tabs{display:flex;gap:2px;overflow-x:auto}',
      '.cs-tabs button{flex:none;height:44px;padding:0 12px;border:0;background:none;font:inherit;font-size:15px;font-weight:700;color:#6B7684;border-bottom:2.5px solid transparent;cursor:pointer}',
      '.cs-tabs button.on{color:#191F28;border-color:#191F28}',
      '.modal.cs .modal-head{display:none}',
      '@media(min-width:' + MIN + 'px){',
      'body.cside .main{margin-right:460px}',
      'body.cside .modal.cs{inset:0 0 0 auto;width:460px;background:transparent;padding:0;align-items:stretch;justify-content:flex-end;pointer-events:none;z-index:90}',
      'body.cside .modal.cs .modal-box{pointer-events:auto;width:460px;max-width:none;max-height:none;height:100vh;border-radius:0;box-shadow:-8px 0 30px rgba(15,23,42,.12);display:flex;flex-direction:column;overflow:hidden}',
      'body.cside .modal.cs .modal-body{flex:1;overflow:auto}',
      'body.cside #dbBody td[data-th="배정일"],body.cside #dbBody td[data-th="담당자"],body.cside #dbBody td[data-th="종류"],body.cside #dbBody td[data-th="지역"],' +
        'body.cside #dbBody td[data-th="결과"],body.cside #dbBody td[data-th="접촉"],body.cside #dbBody td[data-th="녹음"],body.cside #dbBody td[data-th="단톡 문구"],body.cside th.cs-hide{display:none}',
      'body.cside #dbBody tr.cs-on td{background:#F5F8FF}body.cside #dbBody tr.cs-on td.name{box-shadow:inset 3px 0 0 #1A56DB}',
      '}'
    ].join('\n');
    D.head.appendChild(s);
  }
  function tagTh() {
    var b = el('dbBody'), t = b && b.closest ? b.closest('table') : null; if (!t || t.__cs) return;
    var HIDE = ['배정일', '담당자', '종류', '지역', '결과', '접촉', '녹음', '단톡 문구'];
    [].forEach.call(t.querySelectorAll('thead th'), function (th) { if (HIDE.indexOf((th.textContent || '').trim()) >= 0) th.classList.add('cs-hide'); });
    t.__cs = 1;
  }
  function mark() {
    var b = el('dbBody'); if (!b) return;
    [].forEach.call(b.querySelectorAll('tr.cs-on'), function (tr) { tr.classList.remove('cs-on'); });
    if (!SIDE.on || !SIDE.id) return;
    var btn = b.querySelector('.cus-open[onclick*="\'' + SIDE.id.replace(/["\\]/g, '') + '\'"]');
    var tr = btn && btn.closest ? btn.closest('tr') : null; if (tr) tr.classList.add('cs-on');
  }
  function off() {
    SIDE.on = false; SIDE.id = ''; SIDE.tab = '';
    D.body.classList.remove('cside');
    IDS.forEach(function (k) { var m = el(k); if (!m) return; m.classList.remove('cs'); var h = m.querySelector('.cs-head'); if (h) h.parentNode.removeChild(h); });
    mark();
  }
  function won(v) { var n = Math.round((+v || 0) / 10000); return n > 0 ? n + '만원' : ''; }
  function head(m, id, tab) {
    var d = find(id), box = m.querySelector('.modal-box'); if (!d || !box) return;
    var old = box.querySelector('.cs-head'); if (old) old.parentNode.removeChild(old);
    var st = T(function () { return W.stageOf(d); }, d.stage || '미접촉') || '미접촉';
    var ap = T(function () { return W.nextAppt(d); }, '') || '';
    var apT = ap ? T(function () { return W.fmt(ap, true); }, ap) : '';
    var amt = won(d.expect_premium), ed = can(d);
    var tel = String(d.phone || '').replace(/[^0-9+]/g, '');
    var nx = ed ? T(function () { return W.sgNextOf(d); }, '') : '';
    var nCall = T(function () { return W.getCalls(id).length; }, 0) || 0;
    var linked = !!(d.client_id && W.parent && W.parent !== W && T(function () { return typeof W.parent.cusGo === 'function'; }, false));
    var nm = String(d.customer_name || '이름 없음');
    var sub = [tel ? '…' + tel.slice(-4) : '', d.region || '', T(function () { return W.srcOf(d); }, '')].filter(Boolean).join(' · ');
    var tb = function (k, lab) { return '<button type="button" class="' + (k === tab ? 'on' : '') + '" onclick="apexCsTab(\'' + k + '\')">' + lab + '</button>'; };
    var h = '<div class="cs-head"><div class="cs-h1"><span class="cs-av">' + E(nm.charAt(0)) + '</span><div class="cs-nm"><b>' + E(nm) + '님</b>' + (sub ? '<small>' + E(sub) + '</small>' : '') + '</div>' +
      '<button type="button" class="cs-x" onclick="apexCsClose()" aria-label="닫기">✕</button></div>' +
      '<div class="cs-pills"><span class="cs-pl">' + E(st) + '</span>' + (apT && apT !== '-' ? '<span class="cs-pl g">🤝 ' + E(apT) + '</span>' : '') +
      '<span class="cs-pl ' + (amt ? 'amt' : 'miss') + '">💰 목표 계약금액 ' + (amt || '?') + '</span></div>' +
      '<div class="cs-qa">' + (tel ? '<a class="p" href="tel:' + E(tel) + '">📞 전화</a>' : '<button type="button" class="off" disabled>📞 번호 없음</button>') +
      '<button type="button" onclick="apexCsCopy()">📋 단톡 문구</button>' +
      (nx ? '<button type="button" onclick="apexCsNext()">➡️ ' + E(nx) + '로</button>' : '<button type="button" onclick="apexCsTab(\'call\')">✍️ 통화 남기기</button>') + '</div>' +
      '<div class="cs-tabs">' + (ed ? tb('edit', '✏️ 고치기') : '') + tb('call', '📞 통화 ' + nCall) + tb('card', linked ? '📇 고객 365일 ↗' : '📇 고객 한 장') + '</div></div>';
    box.insertAdjacentHTML('afterbegin', h);
  }
  /* 칸 하나 열기 — 다른 두 창은 자리만 비우고(닫기 함수 안 부름) 그 창은 있던 함수로 엶 */
  function run(tab, fn, args) {
    var id = args && args[0];
    if (!id) { off(); return fn.apply(W, args); }
    css(); tagTh();
    IDS.forEach(function (k) { if (k !== MD[tab]) { var m = el(k); if (m) { m.classList.remove('open', 'cs'); var h = m.querySelector('.cs-head'); if (h) h.parentNode.removeChild(h); } } });
    var r = fn.apply(W, args), m = el(MD[tab]);
    if (m && m.classList.contains('open')) {
      SIDE.on = true; SIDE.id = id; SIDE.tab = tab;
      D.body.classList.add('cside'); m.classList.add('cs'); head(m, id, tab); mark();
    } else if (!anyOpen()) off();
    return r;
  }
  W.openDb = function (id) { return run('edit', O.openDb, [].slice.call(arguments)); };
  W.openCall = function (id) { return run('call', O.openCall, [].slice.call(arguments)); };
  W.cusOpen = function (id) { return run('card', O.cusOpen, [].slice.call(arguments)); };
  W.closeModal = function (id) {
    var r = O.closeModal.apply(this, arguments);
    if (IDS.indexOf(id) >= 0) { var m = el(id); if (m) { m.classList.remove('cs'); var h = m.querySelector('.cs-head'); if (h) h.parentNode.removeChild(h); } if (!anyOpen()) off(); }
    return r;
  };
  if (typeof O.renderDb === 'function') W.renderDb = function () { var r = O.renderDb.apply(this, arguments); try { tagTh(); mark(); } catch (e) {} return r; };

  /* 명단의 이름 단추를 <b>손으로</b> 누를 때만 — 내 고객이면 ✏️ 고치기로(아니면 예전처럼 고객 한 장) */
  D.addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('#dbBody .cus-open') : null; if (!b) return;
    var mm = /cusOpen\('([^']+)'\)/.exec(b.getAttribute('onclick') || ''); if (!mm) return;
    var d = find(mm[1]); if (!can(d)) return;
    ev.preventDefault(); ev.stopPropagation(); if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    W.openDb(mm[1]);
  }, true);

  W.apexCsTab = function (tab) { var id = SIDE.id; if (!id || !MD[tab]) return; W[{ edit: 'openDb', call: 'openCall', card: 'cusOpen' }[tab]](id); };
  W.apexCsClose = function () { var t = SIDE.tab; if (t) W.closeModal(MD[t]); else off(); };
  W.apexCsCopy = function () { var d = find(SIDE.id); if (!d) return; try { W.copyText(W.report(d)); } catch (e) {} };
  W.apexCsNext = function () { var id = SIDE.id; if (!id) return; W.closeModal(MD[SIDE.tab] || 'dbModal'); try { W.sgUp(id); } catch (e) {} };
  /* 홈(오늘 화면) · 주소 ?open= 에서 — 그분 옆창을 바로 */
  W.apexCrmSide = function (id, tab) {
    var d = find(id); if (!d) return false;
    try { W.goPage('db'); } catch (e) {}
    tab = MD[tab] ? tab : (can(d) ? 'edit' : 'call');
    W[{ edit: 'openDb', call: 'openCall', card: 'cusOpen' }[tab]](id);
    try { var b = el('dbBody'), btn = b && b.querySelector('.cus-open[onclick*="\'' + String(id).replace(/["\\]/g, '') + '\'"]'); if (btn) btn.scrollIntoView({ block: 'center' }); } catch (e2) {}
    return anyOpen();
  };
  try {
    var want = new W.URLSearchParams(W.location.search).get('open');
    if (want) {
      var n = 0, tick = function () {
        var ok = T(function () { return typeof W.apexCrmReady !== 'function' || W.apexCrmReady(); }, false);
        if (ok && find(want)) { W.apexCrmSide(want); return; }
        if (++n < 60) W.setTimeout(tick, 250);
      };
      W.setTimeout(tick, 200);
    }
  } catch (e) {}
  W.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && SIDE.on) W.apexCsClose(); });
})(window);
