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
  var INTRO = {
    name: '', title: '', org: '', years: '', phone: '', email: '', motto: '', tags: '', bio: '',
    /* 표지(STARRING)에만 쓰는 값들 */
    nameEn: '', license: '', onair: '', career: '', issue: '', team: '',
    photo: '', photo2: '', photo3: ''
  };

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
      '#apexDeckBar .apex-deck-big{font-size:10px;font-weight:800;white-space:nowrap;cursor:pointer;' +
      'padding:2px 9px;border-radius:999px;border:1px solid rgba(255,255,255,.26);color:#E8EEF8}' +
      '#apexDeckBar .apex-deck-big:hover{background:rgba(255,255,255,.13)}' +
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
      '<span class="apex-deck-big" id="apexBigBtn">글씨 크게</span>' +
      '<span class="apex-deck-cx">준법 안내 ▾</span></div>' +
      '<ul class="apex-deck-full">' +
      LAW_FULL.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>';
    el.querySelector('.apex-deck-row').onclick = function () {
      el.className = el.className ? '' : 'on';
      el.querySelector('.apex-deck-cx').textContent = el.className ? '닫기 ▴' : '준법 안내 ▾';
    };
    /* 나이 드신 고객과 볼 때는 한 단계 더 키운다. 고른 값은 남는다. */
    el.querySelector('.apex-deck-big').onclick = function (ev) {
      ev.stopPropagation();
      bigSet(!document.body.classList.contains('apex-big'));
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
    fixText(); fixSlots(); paintBar(); coverBuild();
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

  /* ── 4) 가독성 ────────────────────────────────────────────────
     상담자료를 재 보니 제목은 60px 인데 <b>정작 읽어야 할 보험 내용이
     10~13px</b> 이었다. 회색(#6B7684)까지 얹혀서 대비도 낮다.
     상담은 고객과 화면을 <b>같이 보는</b> 자리다. 설계사는 외워서 말하지만
     고객은 그 자리에서 처음 읽는다. 작으면 안 읽고, 안 읽으면 안 믿는다.

     크기를 일괄로 올리면 표가 깨진다. 그래서 <b>재서, 작은 것만</b> 올린다.
     원래 크기의 순서는 지킨다 — 9px 짜리와 13px 짜리를 같은 크기로 만들면
     무엇이 중요한지가 사라진다.                                        */
  var RD_BUCKET = [
    { max: 10.6, cls: 'apex-rd-xs' },   /* 9~10px  → 13px */
    { max: 12.1, cls: 'apex-rd-s' },    /* 11~12px → 14px */
    { max: 13.6, cls: 'apex-rd-m' }     /* 13px    → 15px */
  ];
  var RD_DIM = { 'rgb(107, 118, 132)': 1, 'rgb(155, 165, 178)': 1, 'rgb(156, 163, 175)': 1 };
  var rdOn = false;

  function rdCss() {
    if (document.getElementById('apexRdCss')) return;
    var st = document.createElement('style');
    st.id = 'apexRdCss';
    st.textContent =
      '.apex-rd-xs{font-size:13px !important;line-height:1.68 !important}' +
      '.apex-rd-s{font-size:14px !important;line-height:1.72 !important}' +
      '.apex-rd-m{font-size:15px !important;line-height:1.74 !important}' +
      /* 흐린 회색은 흰 바탕에서 대비가 모자란다. 한 단계만 진하게. */
      '.apex-rd-dim{color:#55606E !important}' +
      /* 배경이 흰색에 가까워 경계가 안 보이던 칸에 선을 준다 */
      '.apex-rd-box{border:1px solid rgba(15,23,42,.10) !important;' +
      'box-shadow:0 1px 3px rgba(15,23,42,.045) !important}' +
      /* 「크게」 를 고르면 한 단계 더 */
      'body.apex-big .apex-rd-xs{font-size:15px !important}' +
      'body.apex-big .apex-rd-s{font-size:16px !important}' +
      'body.apex-big .apex-rd-m{font-size:17px !important}' +
      'body.apex-big .apex-rd-dim{color:#404A57 !important}';
    document.head.appendChild(st);
  }

  function rdApply() {
    rdCss();
    var host = document.querySelectorAll('.slide');
    if (!host.length) host = [document.body];
    var i, j, list, e, cs, fs, k, b;
    for (i = 0; i < host.length; i++) {
      list = host[i].querySelectorAll('*');
      for (j = 0; j < list.length; j++) {
        e = list[j];
        if (e.id === 'apexDeckBar' || e.closest('#apexDeckBar,#apexNextBar')) continue;
        if (e._apexRd) continue;
        /* 글자만 든 마지막 칸만 본다 — 부모를 건드리면 자식까지 딸려 커진다 */
        if (e.children.length) { rdBox(e); continue; }
        if (!(e.textContent || '').replace(/\s/g, '').length) continue;
        cs = getComputedStyle(e);
        fs = parseFloat(cs.fontSize);
        if (!(fs > 0)) continue;
        for (k = 0; k < RD_BUCKET.length; k++) {
          if (fs < RD_BUCKET[k].max) { e.classList.add(RD_BUCKET[k].cls); break; }
        }
        if (RD_DIM[cs.color]) e.classList.add('apex-rd-dim');
        e._apexRd = 1;
      }
    }
    rdOn = true;
  }
  /* 흰 바탕에 흰 칸이라 경계가 안 보이던 카드에만 선을 준다.
     아무 칸에나 선을 그으면 화면이 표처럼 갑갑해진다. */
  function rdBox(e) {
    if (e._apexBox) return;
    e._apexBox = 1;
    var cs = getComputedStyle(e);
    if (parseFloat(cs.borderTopWidth) > 0) return;
    if (parseFloat(cs.borderRadius) < 8) return;
    var m = (cs.backgroundColor || '').match(/^rgba?\((\d+), (\d+), (\d+)/);
    if (!m) return;
    var r = +m[1], g = +m[2], b = +m[3];
    if (r < 238 || g < 238 || b < 238) return;          /* 옅은 칸만 */
    if (r === 255 && g === 255 && b === 255) return;    /* 순백은 원래 그런 것 */
    var box = e.getBoundingClientRect();
    if (box.width * box.height < 8000) return;          /* 작은 알약은 놔둔다 */
    e.classList.add('apex-rd-box');
  }

  function bigKey() { return 'apex_big_' + ((INTRO && INTRO.name) || 'me'); }
  function bigGet() { try { return localStorage.getItem(bigKey()) === '1'; } catch (e) { return false; } }
  function bigSet(v) {
    try { localStorage.setItem(bigKey(), v ? '1' : '0'); } catch (e) {}
    document.body.classList.toggle('apex-big', !!v);
    var t = document.getElementById('apexBigBtn');
    if (t) t.textContent = v ? '글씨 크게 ✓' : '글씨 크게';
  }

  /* ── 5) 결과 보고서 다음으로 ─────────────────────────────────
     상담자료의 「📄 결과 보고서」 는 이 자료 안에서 끝난다. 그런데 상담은
     거기서 안 끝난다. 보고서를 덮고 <b>8통장 진단</b>부터 이 고객의 숫자로
     넘어가야 한다. 그 다리를 여기서 놓는다.
     앱 안에서 열렸을 때만 띄운다 — 혼자 열면 넘어갈 곳이 없다.        */
  function inApp() {
    try { return !!(window.parent && window.parent !== window); } catch (e) { return false; }
  }
  function tell(msg) {
    try { if (inApp()) window.parent.postMessage(msg, location.origin); } catch (e) {}
  }
  var NEXTS = [
    { k: 'wallet', t: '🗺️ 8통장 진단', d: '이 고객의 돈을 8개 목적으로 나눠 어디가 비었는지' },
    { k: 'reality', t: '⚠️ 준비하지 않으면', d: '' },
    { k: 'story', t: '🎬 상담 이야기', d: '' }
  ];
  function nextBar(on) {
    var el = document.getElementById('apexNextBar');
    if (!on) { if (el) el.style.display = 'none'; return; }
    if (!inApp()) return;
    if (!el) {
      el = document.createElement('div');
      el.id = 'apexNextBar';
      el.style.cssText = 'position:fixed;left:0;right:0;bottom:28px;z-index:2147482900;' +
        'display:flex;align-items:center;gap:9px;padding:9px 14px;' +
        'background:linear-gradient(90deg,#1D4ED8,#4F46E5);color:#fff;' +
        'font-family:"Noto Sans KR","Malgun Gothic",sans-serif;' +
        'box-shadow:0 -6px 20px rgba(15,23,42,.20)';
      el.innerHTML =
        '<span style="font-size:12px;font-weight:800;opacity:.86;white-space:nowrap">보고서 다음은</span>' +
        '<span id="apexNextWrap" style="display:flex;gap:7px;flex:1;min-width:0;overflow:auto"></span>' +
        '<span style="font-size:11px;opacity:.7;white-space:nowrap;cursor:pointer" ' +
        'onclick="this.parentNode.style.display=\'none\'">닫기 ✕</span>';
      document.body.appendChild(el);
      var wrap = el.querySelector('#apexNextWrap');
      NEXTS.forEach(function (N) {
        var b = document.createElement('button');
        b.type = 'button';
        b.style.cssText = 'padding:6px 13px;border:0;border-radius:9px;background:rgba(255,255,255,.16);' +
          'color:#fff;font-size:12.5px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit';
        b.textContent = N.t + ' ▶';
        b.title = N.d;
        b.onclick = function () { tell({ t: 'apex:next', k: N.k }); };
        wrap.appendChild(b);
      });
    }
    el.style.display = 'flex';
  }
  /* 「결과 보고서」 를 누르는 순간을 잡는다. 자료의 코드는 안 건드린다. */
  function watchReport() {
    if (typeof window.switchSection !== 'function') return;
    var orig = window.switchSection;
    window.switchSection = function (n) {
      var r = orig.apply(this, arguments);
      try {
        if (+n === 2) { tell({ t: 'apex:report' }); nextBar(true); }
        else nextBar(false);
      } catch (e) {}
      return r;
    };
  }

  /* ── 6) 표지 ─────────────────────────────────────────────────
     첫 장은 상담사를 처음 보는 자리다. 사진 106px 에 이름 30px 이면
     화면 절반이 비고 사람이 안 남는다. 사진과 이름을 키우고,
     테두리·그림자·자간을 다듬어 한 장으로 세운다.                     */
  function coverCss() {
    if (document.getElementById('apexCoverCss')) return;
    var st = document.createElement('style');
    st.id = 'apexCoverCss';
    st.textContent =
      '#s1 .s1-hero{gap:0 !important;margin-top:6px !important}' +
      '#s1 .s1-hero-photo{width:190px !important;height:190px !important;' +
      'border:5px solid #fff !important;' +
      'box-shadow:0 26px 60px rgba(29,78,216,.24),0 0 0 1px rgba(15,23,42,.07),' +
      '0 0 0 11px rgba(49,130,246,.055) !important;' +
      'transition:transform .5s cubic-bezier(.2,.8,.2,1) !important}' +
      '#s1 .s1-hero-photo:hover{transform:translateY(-4px) scale(1.02) !important}' +
      '#s1 .s1-hero-photo img{width:100% !important;height:100% !important;object-fit:cover !important}' +
      '#s1 .s1-hero-ph{font-size:78px !important}' +
      '#s1 .s1-hero-name{font-size:clamp(38px,5.2vw,58px) !important;font-weight:900 !important;' +
      'letter-spacing:-.045em !important;line-height:1.1 !important;margin-top:22px !important}' +
      '#s1 .s1-hero-title{font-size:clamp(14px,1.35vw,17px) !important;font-weight:700 !important;' +
      'letter-spacing:.01em !important;margin-top:9px !important;color:#5B6577 !important}' +
      /* 이름 아래에 가는 금색 선 하나 — 표지에만 쓰는 마감 */
      '#s1 .s1-hero-title::after{content:"";display:block;width:52px;height:2px;margin:15px auto 0;' +
      'background:linear-gradient(90deg,#C8A25B,#E8D5A8,#C8A25B);border-radius:2px;opacity:.85}' +
      '#s1 .s1-hero-edit{margin-top:17px !important;opacity:.62;transition:opacity .25s}' +
      '#s1 .s1-hero-edit:hover{opacity:1}' +
      '#s1 .apex-brand{transform:scale(1.12);transform-origin:center}' +
      '#s1 .slide-title{margin-top:30px !important;letter-spacing:-.035em !important}' +
      '@media (max-width:820px){#s1 .s1-hero-photo{width:136px !important;height:136px !important;' +
      'border-width:4px !important}#s1 .s1-hero-ph{font-size:56px !important}}';
    document.head.appendChild(st);
  }

  /* ── 7) 표지를 다시 짓는다 (STARRING) ────────────────────────
     원래 표지는 흰 바탕에 작은 동그란 사진 하나였다. 처음 만나는 자리에서
     사람이 안 남는다. 그래서 <b>왼쪽은 인물 사진, 오른쪽은 이름과 이력</b>
     으로 된 검은 표지를 그 자리에 새로 짓는다.

     ★ 파일의 HTML 은 손대지 않는다. 원래 내용은 <b>숨기고</b>,
       새 표지를 자식으로 <b>덧붙인다.</b> 값이 없으면 원래 표지가 그대로 나온다. */
  var COVER_FALLBACK = { photo: 'photo1.jpg', photo2: 'photo2.png', photo3: 'photo3.jpg' };

  function esc(s) {
    return ('' + (s == null ? '' : s)).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  /* 「NBN 「보험 불만제로」」 처럼 방송사와 프로그램이 붙은 줄을 나눈다 */
  function lines(v) {
    return ('' + (v || '')).split(/\n|,(?![^「]*」)/).map(function (t) {
      return t.replace(/^\s+|\s+$/g, '');
    }).filter(Boolean);
  }
  function station(t) { return ('' + t).split(/[「\s]/)[0] || ''; }
  /* 이름을 못 받았으면 로마자를 억지로 만들지 않는다 — 틀린 이름은 안 쓰는 게 낫다 */
  function coverPhotos() {
    return {
      main: INTRO.photo || COVER_FALLBACK.photo,
      a: INTRO.photo2 || COVER_FALLBACK.photo2,
      b: INTRO.photo3 || COVER_FALLBACK.photo3
    };
  }

  function coverBuildCss() {
    if (document.getElementById('apexStarCss')) return;
    var st = document.createElement('style');
    st.id = 'apexStarCss';
    st.textContent = [
      '#s1.apex-star>*:not(.apex-star-wrap){display:none !important}',
      '#s1.apex-star{padding:0 !important;background:#08080A !important;overflow:hidden}',
      '.apex-star-wrap{position:absolute;inset:0;display:flex;background:#08080A;color:#F3EEE3;',
      'font-family:"Noto Serif KR","Nanum Myeongjo","Noto Sans KR",serif;overflow:hidden}',
      /* 왼쪽 — 인물 */
      '.as-photo{position:relative;flex:0 0 47%;min-width:0;background:#0C0C0E;overflow:hidden}',
      '.as-photo img{width:100%;height:100%;object-fit:cover;object-position:center 12%;',
      'filter:contrast(1.04) saturate(.96)}',
      '.as-photo::after{content:"";position:absolute;inset:0;',
      'background:linear-gradient(90deg,rgba(8,8,10,.55) 0%,rgba(8,8,10,0) 26%,rgba(8,8,10,0) 62%,rgba(8,8,10,.98) 100%)}',
      /* 스튜디오 배경이 밝은 사진이 많다. 가장자리를 어둡게 깔아 검은 판과 이어 붙인다. */
      '.as-photo::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;',
      'background:radial-gradient(115% 78% at 46% 34%,transparent 34%,rgba(8,8,10,.30) 68%,rgba(8,8,10,.86) 100%)}',
      '.as-vert{position:absolute;left:16px;top:50%;transform:translateY(-50%) rotate(180deg);',
      'writing-mode:vertical-rl;font-size:10.5px;letter-spacing:.42em;color:rgba(212,185,120,.78);',
      'z-index:3;font-family:"Noto Sans KR",sans-serif;font-weight:600}',
      '.as-team{position:absolute;left:26px;bottom:52px;z-index:3;font-size:10.5px;letter-spacing:.30em;',
      'color:rgba(212,185,120,.72);font-family:"Noto Sans KR",sans-serif;font-weight:700}',
      /* 오른쪽 — 이름과 이력 */
      '.as-info{flex:1;min-width:0;position:relative;padding:44px 52px 62px 26px;',
      'display:flex;flex-direction:column;justify-content:center;text-align:right}',
      '.as-info::before{content:"";position:absolute;inset:0;pointer-events:none;',
      'background:radial-gradient(120% 80% at 78% 30%,rgba(212,185,120,.075),transparent 62%)}',
      '.as-issue{font-size:12.5px;letter-spacing:.16em;color:#D4B978;font-family:"Noto Sans KR",sans-serif;font-weight:700}',
      '.as-star{font-size:11px;letter-spacing:.46em;color:rgba(212,185,120,.86);margin-top:3px;',
      'font-family:"Noto Sans KR",sans-serif;font-weight:700}',
      '.as-star::before{content:"";display:inline-block;width:54px;height:1px;vertical-align:4px;margin-right:11px;',
      'background:linear-gradient(90deg,transparent,#C8A25B)}',
      '.as-name{font-size:clamp(52px,7.1vw,104px);line-height:1.02;font-weight:700;letter-spacing:.02em;',
      'margin-top:14px;color:#F0E3C4;text-shadow:0 0 42px rgba(212,185,120,.30)}',
      '.as-en{font-size:clamp(13px,1.32vw,20px);letter-spacing:.42em;color:rgba(226,208,163,.78);',
      'margin-top:8px;font-family:"Noto Sans KR",sans-serif;font-weight:500}',
      '.as-role{margin-top:22px;font-size:clamp(17px,1.7vw,25px);font-weight:800;color:#FFFDF7;',
      'font-family:"Noto Sans KR",sans-serif;letter-spacing:-.01em;display:flex;align-items:center;',
      'justify-content:flex-end;gap:13px}',
      '.as-role::before{content:"";width:34px;height:2px;background:linear-gradient(90deg,transparent,#C8A25B)}',
      '.as-quote{margin-top:13px;font-size:clamp(14px,1.32vw,19px);font-style:italic;color:#DCD3C0;line-height:1.6}',
      '.as-rule{margin:22px 0 0;height:1px;background:linear-gradient(90deg,transparent,rgba(212,185,120,.55),rgba(212,185,120,.18))}',
      '.as-facts{display:flex;justify-content:flex-end;gap:clamp(20px,3.2vw,56px);margin-top:17px;text-align:right}',
      '.as-fact{min-width:0}',
      '.as-fl{font-size:10px;letter-spacing:.28em;color:rgba(212,185,120,.80);font-family:"Noto Sans KR",sans-serif;font-weight:700}',
      '.as-fv{margin-top:6px;font-size:clamp(13px,1.15vw,16.5px);color:#F1ECE1;line-height:1.62;',
      'font-family:"Noto Sans KR",sans-serif;font-weight:600;white-space:nowrap}',
      '.as-chips{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-top:19px}',
      '.as-chip{padding:6px 15px;border:1px solid rgba(212,185,120,.42);border-radius:999px;',
      'font-size:12.5px;color:#EBDFC4;font-family:"Noto Sans KR",sans-serif;font-weight:600;white-space:nowrap}',
      '.as-shots{display:flex;justify-content:flex-end;gap:12px;margin-top:20px}',
      '.as-shot{width:clamp(120px,15vw,196px)}',
      '.as-shot img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:3px;',
      'border:1px solid rgba(212,185,120,.26);display:block}',
      '.as-cap{margin-top:6px;font-size:10.5px;color:rgba(226,214,190,.80);text-align:left;',
      'font-family:"Noto Sans KR",sans-serif;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.as-cap i{color:#EF4444;font-style:normal;margin-right:4px}',
      '.as-edit{position:absolute;right:18px;bottom:52px;z-index:4;padding:5px 13px;border-radius:999px;',
      'border:1px solid rgba(212,185,120,.36);background:rgba(255,255,255,.05);color:#E8DCC0;',
      'font-size:11.5px;font-weight:700;cursor:pointer;font-family:"Noto Sans KR",sans-serif;opacity:.55;transition:opacity .25s}',
      '.as-edit:hover{opacity:1}',
      /* 화면이 좁으면 위아래로 쌓는다 — 태블릿 세로에서도 상담한다 */
      '@media (max-width:900px){.apex-star-wrap{flex-direction:column}',
      '.as-photo{flex:0 0 42%}.as-photo::after{background:linear-gradient(180deg,rgba(8,8,10,0) 52%,rgba(8,8,10,.98) 100%)}',
      '.as-vert{display:none}.as-info{padding:16px 22px 26px;justify-content:flex-start;text-align:center}',
      '.as-facts,.as-chips,.as-shots,.as-role{justify-content:center}.as-role::before{display:none}',
      '.as-info::before{display:none}}'
    ].join('');
    document.head.appendChild(st);
  }

  function coverHtml() {
    var P = coverPhotos();
    var on = lines(INTRO.onair), tg = lines(INTRO.tags);
    var facts = [];
    if (INTRO.license) facts.push({ l: 'LICENSE', v: lines(INTRO.license).join('<br>') });
    if (on.length) facts.push({ l: 'ON AIR', v: on.map(esc).join('<br>') });
    if (INTRO.career) facts.push({ l: 'CAREER', v: esc(INTRO.career) });
    else if (INTRO.years) facts.push({ l: 'CAREER', v: esc(INTRO.years) + '년' });

    var shots = [];
    if (P.a) shots.push({ src: P.a, cap: on[0] || '' });
    if (P.b) shots.push({ src: P.b, cap: on[1] || '' });

    var vert = on.map(station).filter(Boolean).join(' · ');

    return '<div class="apex-star-wrap">' +
      '<div class="as-photo">' +
        '<img src="' + esc(P.main) + '" alt="" onerror="this.style.display=\'none\'">' +
        (vert ? '<div class="as-vert">' + esc(vert) + '</div>' : '') +
        (INTRO.team ? '<div class="as-team">' + esc(INTRO.team) + '</div>' : '') +
      '</div>' +
      '<div class="as-info">' +
        '<button type="button" class="as-edit" data-apex-edit>✏️ 내 소개 고치기</button>' +
        (INTRO.issue ? '<div class="as-issue">' + esc(INTRO.issue) + '</div>' : '') +
        '<div class="as-star">STARRING</div>' +
        '<div class="as-name">' + esc(INTRO.name) + '</div>' +
        (INTRO.nameEn ? '<div class="as-en">' + esc(INTRO.nameEn) + '</div>' : '') +
        (INTRO.title ? '<div class="as-role">' + esc(INTRO.title) + '</div>' : '') +
        (INTRO.motto ? '<div class="as-quote">“' + esc(INTRO.motto) + '”</div>' : '') +
        (facts.length ? '<div class="as-rule"></div><div class="as-facts">' +
          facts.map(function (f) {
            return '<div class="as-fact"><div class="as-fl">' + f.l + '</div>' +
              '<div class="as-fv">' + f.v + '</div></div>';
          }).join('') + '</div>' : '') +
        (tg.length ? '<div class="as-chips">' +
          tg.map(function (t) { return '<span class="as-chip">' + esc(t) + '</span>'; }).join('') +
          '</div>' : '') +
        (shots.length ? '<div class="as-shots">' +
          shots.map(function (s) {
            return '<div class="as-shot"><img src="' + esc(s.src) + '" alt="" ' +
              'onerror="this.parentElement.style.display=\'none\'">' +
              (s.cap ? '<div class="as-cap"><i>●</i>ON AIR · ' + esc(s.cap) + '</div>' : '') + '</div>';
          }).join('') + '</div>' : '') +
      '</div></div>';
  }

  /* 이름조차 없으면 새 표지를 짓지 않는다 — 빈 표지보다 원래 것이 낫다 */
  function coverBuild() {
    var s1 = document.getElementById('s1');
    if (!s1) return;
    if (!INTRO.name) {
      s1.classList.remove('apex-star');
      var old = s1.querySelector('.apex-star-wrap');
      if (old) old.parentNode.removeChild(old);
      return;
    }
    coverBuildCss();
    var wrap = s1.querySelector('.apex-star-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      s1.appendChild(wrap);
    }
    wrap.outerHTML = coverHtml();
    s1.classList.add('apex-star');
    var b = s1.querySelector('[data-apex-edit]');
    if (b) b.onclick = function () {
      if (inApp()) { tell({ t: 'apex:editintro' }); return; }
      var e = document.querySelector('#s1 .s1-hero-edit');
      if (e && e.click) { s1.classList.remove('apex-star'); e.click(); }
    };
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
    coverCss(); coverBuild(); rdApply(); bigSet(bigGet());
    watch(); watchReport(); hello();
    /* 덱이 스스로 글자를 다시 그리는 경우가 있어 한 번 더 맞춘다.
       탭을 눌러 나중에 나타나는 칸도 있어서 그때 다시 잰다. */
    setTimeout(function () { nodes = null; fixText(); fixSlots(); rdApply(); }, 900);
    setTimeout(rdApply, 2600);
    document.addEventListener('click', function () { setTimeout(rdApply, 260); }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, false);
  else boot();

  /* 밖에서도 부를 수 있게 열어 둔다 */
  window.apexDeckApply = apply;
})();
