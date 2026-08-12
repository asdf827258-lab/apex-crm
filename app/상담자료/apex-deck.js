/* ════════════════════════════════════════════════════════════════
   상담자료 공통 덧붙임 — apex-deck.js

   상담자료는 메인 한 장과 이야기 덱 열 장, 모두 열한 장으로 나뉘어 있다.
   각 장은 따로 만들어졌기 때문에 상담사 이름도, 소속도, 준법 문구도
   장마다 달랐다. 고객이 보기엔 <b>한 사람이 하는 한 번의 상담</b>인데
   화면마다 말이 달라지면 신뢰가 깎인다.

   그래서 이 파일 하나를 열한 장 모두가 불러 쓴다. 하는 일은 셋뿐이다.

     1) 글 맞추기 — 이름·소속·연락처를 「내 소개」 값으로 통일한다
     2) 준법 — 보험 자료에 필요한 면책 문구를 모든 장에 똑같이 붙인다
     3) 연결   — 앱(AI 제안서)이 보내는 값을 받고, 진행 상황을 알린다

   ★ 각 덱의 HTML 구조는 건드리지 않는다. 이 스크립트만 붙인다.
     예전에 구조를 손댔다가 슬라이드가 서로 안으로 말려 들어간 적이 있다.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__apexDeck) return;      /* 두 번 붙어도 한 번만 돈다 */
  window.__apexDeck = true;

  /* ── 내 소개 ─────────────────────────────────────────────────
     값이 오는 곳은 셋이다. 앞에 있는 것이 이긴다.
       ① 앱이 보내 준 apex:intro (로그인한 사람의 값)
       ② s6_profile     — 메인 상담자료가 예전부터 쓰던 칸
       ③ apex_profile   — 재무설계 상담자료가 쓰던 칸
     ②③ 은 이 파일이 iframe 밖에서 혼자 열렸을 때를 위한 대비다. */
  var INTRO = { name: '', title: '', org: '', years: '', phone: '', email: '', motto: '', tags: '', bio: '' };

  function readLocal() {
    var got = {}, i, k, raw, o;
    var keys = ['s6_profile', 'apex_profile'];
    /* 로그인별로 남는 칸(apex_intro_<아이디>)도 훑는다 */
    try {
      for (i = 0; i < localStorage.length; i++) {
        k = localStorage.key(i);
        if (k && k.indexOf('apex_intro_') === 0) keys.unshift(k);
      }
    } catch (e) {}
    for (i = 0; i < keys.length; i++) {
      try {
        raw = localStorage.getItem(keys[i]);
        if (!raw) continue;
        o = JSON.parse(raw);
        if (o && typeof o === 'object') got = merge(got, o);
      } catch (e2) {}
    }
    return got;
  }

  /* 재무설계 상담자료는 칸 이름이 a_name·a_org … 로 다르다. 같은 말로 맞춘다. */
  var ALIAS = {
    a_name: 'name', a_title: 'title', a_org: 'org', a_years: 'years',
    a_phone: 'phone', a_contact2: 'email', a_motto: 'motto', a_tags: 'tags', a_bio: 'bio',
    region: 'org', intro: 'motto', specialties: 'tags', contact: 'phone'
  };
  function merge(base, src) {
    var out = base || {}, k, kk, v;
    for (k in src) {
      if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
      v = src[k];
      if (v === null || v === undefined) continue;
      if (typeof v === 'object') continue;         /* photos 같은 건 건드리지 않는다 */
      v = ('' + v).replace(/^\s+|\s+$/g, '');
      if (!v) continue;
      kk = ALIAS[k] || k;
      if (Object.prototype.hasOwnProperty.call(INTRO, kk)) out[kk] = v;
    }
    return out;
  }
  function setIntro(src) {
    var got = merge({}, src || {}), k;
    for (k in got) if (Object.prototype.hasOwnProperty.call(got, k)) INTRO[k] = got[k];
  }

  function who() { return INTRO.name || ''; }
  function where() {
    var a = [];
    if (INTRO.org) a.push(INTRO.org);
    if (INTRO.title) a.push(INTRO.title);
    return a.join(' · ');
  }

  /* ── 1) 글 맞추기 ────────────────────────────────────────────
     예전 담당자 이름이 글 안에 박혀 있다. 화면에 보이는 글자만 바꾼다.
     원본은 노드마다 따로 적어 두어서, 이름이 바뀌면 처음부터 다시 맞춘다.
     (한 번 바꾼 글자를 또 바꾸면 「홍길동님 컨설턴트님」 처럼 겹친다) */
  var OLD_NAME = /이동엽/g;
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
  var nodes = null;                                  /* [{n:텍스트노드, s:원본}] */

  function collect() {
    var out = [], walk, n, p;
    if (!document.body || !document.createTreeWalker) return out;
    walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    while ((n = walk.nextNode())) {
      p = n.parentNode;
      if (!p || SKIP[p.nodeName]) continue;
      if (p.id === 'apexDeckBar' || (p.className && ('' + p.className).indexOf('apex-deck-') === 0)) continue;
      if (!n.nodeValue || OLD_NAME.test(n.nodeValue) === false) { OLD_NAME.lastIndex = 0; continue; }
      OLD_NAME.lastIndex = 0;
      out.push({ n: n, s: n.nodeValue });
    }
    return out;
  }

  function fixText() {
    var nm = who(), i;
    if (nodes === null) nodes = collect();
    if (!nm) return;
    for (i = 0; i < nodes.length; i++) {
      try { nodes[i].n.nodeValue = nodes[i].s.replace(OLD_NAME, nm); } catch (e) {}
    }
    /* 문서 제목도 같이 맞춘다 — 새 창으로 띄우면 이게 곧 이름표다 */
    try { if (OLD_NAME.test(document.title)) document.title = document.title.replace(OLD_NAME, nm); } catch (e2) {}
    OLD_NAME.lastIndex = 0;
  }

  /* 사진 옆 이름표처럼 값으로 채워야 하는 자리는 data-apex 로 지정한다 */
  function fixSlots() {
    var els, i, k, v;
    try { els = document.querySelectorAll('[data-apex]'); } catch (e) { return; }
    for (i = 0; i < els.length; i++) {
      k = els[i].getAttribute('data-apex');
      v = (k === 'where') ? where() : (INTRO[k] || '');
      if (v) els[i].textContent = v;
    }
  }

  /* ── 2) 준법 문구 ────────────────────────────────────────────
     보험 자료에는 반드시 따라붙어야 하는 말이 있다. 열한 장 모두 같은 문장을 쓴다.
     화면을 가리지 않도록 한 줄로 깔고, 누르면 전문이 펼쳐진다. */
  var LAW_SHORT = '이 자료는 상품 설명이 아닌 이해를 돕기 위한 참고 자료입니다. 실제 보장은 약관이 정합니다.';
  var LAW_FULL = [
    '이 자료는 보험 상품의 청약을 권유하는 광고가 아니라, 보장 구조에 대한 이해를 돕기 위한 참고 자료입니다.',
    '실제 보장 범위·지급 사유·면책 및 감액 기간은 <b>각 보험사의 약관</b>이 정하며, 약관이 이 자료보다 우선합니다.',
    '기존 계약을 해지하고 새로 가입하시면 <b>보장이 줄거나 보험료가 오를 수 있고, 면책 기간이 다시 시작</b>될 수 있습니다. 해지 전 반드시 비교하십시오.',
    '자료의 통계·사례는 발표된 공개 자료와 실제 지급 건에서 가져왔으며, <b>개인의 지급 결과를 보장하지 않습니다.</b>',
    '보험계약자는 청약 후 15일(증권 수령일 기준) 이내 청약을 철회할 수 있습니다.',
    '금융소비자보호에 관한 법률에 따라 설명받으실 권리가 있습니다. 이해되지 않는 부분은 그 자리에서 물어보십시오.'
  ];

  function bar() {
    var el = document.getElementById('apexDeckBar');
    if (el) return el;
    if (!document.body) return null;

    var css = document.createElement('style');
    css.textContent =
      '#apexDeckBar{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;' +
      'font-family:"Noto Sans KR","Malgun Gothic",sans-serif;font-size:10.5px;line-height:1.5;' +
      'background:rgba(10,14,26,.82);color:#C9D4E5;backdrop-filter:blur(6px);' +
      '-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(255,255,255,.10)}' +
      '#apexDeckBar .apex-deck-row{display:flex;align-items:center;gap:8px;padding:5px 12px;cursor:pointer}' +
      '#apexDeckBar .apex-deck-me{font-weight:800;color:#F1F5F9;white-space:nowrap}' +
      '#apexDeckBar .apex-deck-tip{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:.9}' +
      '#apexDeckBar .apex-deck-cx{opacity:.65;font-size:9.5px;white-space:nowrap}' +
      '#apexDeckBar .apex-deck-full{display:none;max-height:44vh;overflow:auto;padding:4px 14px 13px;' +
      'border-top:1px solid rgba(255,255,255,.08)}' +
      '#apexDeckBar.on .apex-deck-full{display:block}' +
      '#apexDeckBar .apex-deck-full li{margin:6px 0;color:#B6C2D6}' +
      '#apexDeckBar .apex-deck-full b{color:#FDE68A}' +
      '@media print{#apexDeckBar{position:static;background:#fff;color:#333}' +
      '#apexDeckBar.on .apex-deck-full,#apexDeckBar .apex-deck-full{display:block}}';
    document.head.appendChild(css);

    el = document.createElement('div');
    el.id = 'apexDeckBar';
    el.innerHTML =
      '<div class="apex-deck-row"><span class="apex-deck-me" data-apex-me></span>' +
      '<span class="apex-deck-tip">' + LAW_SHORT + '</span>' +
      '<span class="apex-deck-cx">준법 안내 ▾</span></div>' +
      '<ul class="apex-deck-full">' +
      LAW_FULL.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>';
    el.querySelector('.apex-deck-row').onclick = function () {
      el.className = el.className ? '' : 'on';
      el.querySelector('.apex-deck-cx').textContent = el.className ? '닫기 ▴' : '준법 안내 ▾';
    };
    document.body.appendChild(el);
    return el;
  }

  function paintBar() {
    var el = bar(); if (!el) return;
    var me = el.querySelector('[data-apex-me]'); if (!me) return;
    var nm = who(), w = where();
    me.textContent = nm ? (nm + (w ? (' · ' + w) : '')) : '보장분석 상담자료';
  }

  /* ── 3) 앱과 연결 ────────────────────────────────────────────
     앱이 「내 소개」를 보내면 받아서 다시 칠한다. 어디서 왔는지 반드시 확인한다. */
  function apply(src) {
    setIntro(src);
    fixText(); fixSlots(); paintBar();
  }

  window.addEventListener('message', function (ev) {
    if (ev.origin !== location.origin) return;
    var m = ev.data;
    if (!m || typeof m !== 'object') return;
    if (m.t === 'apex:intro') { apply(m.data); return; }
  }, false);

  /* 부모(앱·메인 상담자료)에게 준비됐다고 알린다 — 그래야 값을 보내 준다 */
  function hello() {
    try {
      if (window.parent && window.parent !== window)
        window.parent.postMessage({ t: 'apex:ready', deck: deckName() }, location.origin);
    } catch (e) {}
  }
  function deckName() {
    var p = ('' + location.pathname).split('/');
    return decodeURIComponent(p[p.length - 1] || '');
  }

  /* 어디까지 봤는지 알린다 — 앱이 「다 보셨습니다」 를 표시할 수 있게 */
  function watch() {
    /* 덱마다 STEPS 또는 SLIDES 로 이름이 다르고, const 로 선언돼 window 에 붙지 않는다.
       같은 문서의 일반 스크립트끼리는 이름이 통하므로 typeof 로 조심스럽게 집는다. */
    var arr = null;
    try { if (typeof STEPS !== 'undefined') arr = STEPS; } catch (e) {}
    try { if (!arr && typeof SLIDES !== 'undefined') arr = SLIDES; } catch (e2) {}
    if (!arr) arr = window.STEPS || window.SLIDES;
    if (!arr || !arr.length || typeof window.show !== 'function') return;
    var orig = window.show, last = arr.length - 1, told = false;
    window.show = function (n) {
      var r = orig.apply(this, arguments);
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ t: 'apex:deckstep', deck: deckName(), at: n, of: arr.length }, location.origin);
          if (n >= last && !told) {
            told = true;
            window.parent.postMessage({ t: 'apex:deckdone', deck: deckName() }, location.origin);
          }
        }
      } catch (e) {}
      return r;
    };
  }

  function boot() {
    setIntro(readLocal());
    fixText(); fixSlots(); paintBar();
    watch(); hello();
    /* 덱이 스스로 글자를 다시 그리는 경우가 있어 한 번 더 맞춘다 */
    setTimeout(function () { nodes = null; fixText(); fixSlots(); }, 900);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, false);
  else boot();

  /* 밖에서도 부를 수 있게 열어 둔다 */
  window.apexDeckApply = apply;
})();
