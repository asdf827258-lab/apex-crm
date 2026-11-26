/* ═══════════════════════════════════════════════════════════════════
   pchk-v2.js — 📱 <b>폰 확인 한 장</b> (판 X576)

   사장님 고름 (2026-11-26) 「폰 확인 한 장」 — 시안 9차 점검표의 마지막 칸 ⑨ 「폰에서 실제로」 와
   오늘 올린 것들(미션 · 만났어요 · 상황 추천 · 말풍선 · 권할 것 · 두 가지 서비스 · 폰·PC 같게)을
   폰에서 <b>한 줄씩 눌러 보고</b> ✓ 됐어요 / 이상해요(+메모) 를 남기는 한 장.

   ── 어디서 여나 ──────────────────────────────────────────────────
   ★ 주소 뒤에 ?pchk=1 — 로그인해서 새 오늘 화면이 서면 이 시트가 저절로 열립니다(폰 홈 화면에 담아 두기 좋게).
   ★ 🙋 나 시트 맨 위 「📱 폰 확인 한 장」 — 대표만(osIsAppAdmin). 팀원 화면에는 안 섬.
   ★ 「가기 ›」 로 그 화면에 다녀오는 동안 화면 위에 「📱 폰 확인 n/12」 알약이 떠 있고, 누르면 다시 이 시트.

   ── 남기는 곳 ───────────────────────────────────────────────────
   ★ 이 기기 한 칸(apex_pchk_<navWho>) + 내 설정 한 줄(user_prefs 의 kv.pchk · 판 X572 표 · 그 사람 줄만).
     서버 부름은 새로 짜지 않고 HOME_V2.prefPut 을 부르기만 — 그래서 제가(작업 세션) 사장님이 남긴 결과를 바로 읽고 고칩니다.
   ★ 「📋 결과 복사」 — 카톡 · 대화창에 붙여 넣는 글(서버가 안 될 때의 길).
   ★ 고객 정보는 담지 않습니다 — 칸 id · 됐어요/이상해요 · 사장님이 쓴 메모뿐.

   ── 깨지지 않게 ─────────────────────────────────────────────────
     · 가는 길은 모두 있던 함수(go · teamV2Open · meV2Open · HOME_V2.*)를 부르기만. 없으면 그 「가기」 단추가 안 섬.
     · 시트는 새 오늘 화면의 그 시트(HOME_V2.sheet) — 새 오늘 화면이 없으면 아무것도 안 함.
   점검: scripts/check-pchk.js
   ═══════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  function T(fn, def) { try { var v = fn(); return (v === undefined || v === null) ? def : v; } catch (e) { return def; } }
  function el(id) { return g.document.getElementById(id); }
  function E(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function H() { return g.HOME_V2 || null; }
  function isBoss() { return !!T(function () { return g.osIsAppAdmin(); }, false); }

  /* 확인할 열두 줄 — 차례는 「아침에 앱을 열고 하루를 도는 순서」.
     go = 누르면 부를 것(있던 함수 이름 · 없으면 단추 안 섬) · how = 해 볼 것 · ok = 이러면 됨 */
  var ITEMS = [
    { id: 'mis', e: '🎯', t: '오늘의 미션', how: '오늘 화면 맨 위 미션 다섯 칸 중 하나를 눌러 「✓ 했어요」', ok: '칸에 체크가 들어가고, 실행 체크판에도 같이 체크돼요', go: ['HOME_V2.mis', 0] },
    { id: 'sit', e: '📍', t: '지금 상황 · 추천 메뉴 3개', how: '고객 카드에서 상황 줄을 보고 「모두 보기」 눌러 보기', ok: '카드에 추천 3개가 보이고, 「모두 보기」 에 나머지가 다 떠요', go: ['HOME_V2.step', 0] },
    { id: 'care', e: '⚙️', t: '상황별 추천 메뉴 고치기 (대표만)', how: '상황 하나 골라 메뉴 하나 더하고 ⭐ 순서 바꿔 보기', ok: '오늘 카드의 추천 3개가 바뀐 순서대로 보여요 · 팀원 폰에도 같게', go: ['HOME_V2.careEdit', ''], boss: 1 },
    { id: 'jvb', e: '💬', t: '자비스 말풍선', how: '고객 카드를 옆으로 넘겨 보기', ok: '아래 말풍선 내용이 카드마다 바뀌고, ✕ 로 닫혀요 · 아래 탭과 안 겹쳐요', go: ['HOME_V2.step', 0] },
    { id: 'rec', e: '🧭', t: '카드 맨 아래 「권할 것」', how: '고객 카드 맨 아래 「🧭 권할 것」 누르기', ok: '그 고객 화면의 「권할 것」 이 바로 열려요', go: ['HOME_V2.step', 0] },
    { id: 'sms', e: '✉️', t: '「문자로 달라고 할 때」 글', how: '고객 카드 「💬 보낼 글」 → 📜 문자로 달라고 할 때', ok: '「보장분석 한 번으로 두 가지」 글이 나오고, 문자로 보낼 때 이모지 없이 나가요', go: ['HOME_V2.step', 0] },
    { id: 'met', e: '🤝', t: '만났어요 (약속 있는 날만)', how: '오늘 약속 카드에서 「🤝 만났어요」 누르기', ok: '만남이 기록되고, 감사 카톡 글이 떠요', go: ['HOME_V2.mis', 1] },
    { id: 'cal', e: '📅', t: '일정 넣으면 폰 달력에도', how: '달력 탭 맨 아래 「📲 폰 달력에도 담기」 켜고 → 오늘 화면에서 일정 하나 넣기', ok: '폰 기본 달력 앱에 그 일정이 들어가요(시험 일정은 확인 뒤 지우셔도 돼요)', go: ['go', 'mycal'] },
    { id: 'team', e: '📊', t: '우리 팀 한눈에 숫자 (지점장 계정)', how: '오늘 화면 팀원 동그라미 밑 「📊 우리 팀 한눈에」', ok: '목표 · 실적 · 오늘 전화가 「DB · 업적관리」 숫자와 같아요', go: ['teamV2Open'] },
    { id: 'newh', e: '🌱', t: '신입 도움말 켜 보기', how: '🙋 나 → 맨 위 「신입 도움말」 켜고 → 영업 한 바퀴 칸 누르기', ok: '칸마다 「할 일 · 하는 법」 이 보여요(다 보면 다시 끄셔도 돼요)', go: ['meV2Open'] },
    { id: 'aim', e: '🤖', t: '자비스에 메뉴 하나 더하기', how: '자비스 → 「＋ 메뉴 더하기」 에서 하나 고르기', ok: '자비스 「내가 더한 메뉴」 에 떠요', go: ['HOME_V2.aiAdd'] },
    { id: 'sync', e: '☁️', t: 'PC 에서 바꾼 것이 폰에도', how: 'PC 에서 자비스에 메뉴를 더한 뒤 → 폰에서 앱을 닫았다 다시 열기', ok: 'PC 에서 더한 메뉴가 폰 자비스에도 똑같이 보여요', go: ['HOME_V2.ai'] }
  ];
  var KEY = 'apex_pchk_';
  var S = { live: false, memo: '' };
  function key() { return KEY + (T(function () { return g.navWho(); }, '') || 'local'); }
  function items() { var b = isBoss(); return ITEMS.filter(function (x) { return !x.boss || b; }); }
  function load() {
    var o = T(function () { return JSON.parse(g.localStorage.getItem(key()) || 'null'); }, null);
    if (!o || typeof o !== 'object') o = T(function () { return H().prefGet('pchk'); }, null);   /* 이 기기에 없으면 계정에 남긴 것 */
    return (o && typeof o === 'object') ? o : {};
  }
  function save(o) {
    o._at = new Date().toISOString();
    try { g.localStorage.setItem(key(), JSON.stringify(o)); } catch (e) {}
    return !!T(function () { return H().prefPut('pchk', o); }, false);
  }
  function count(o) { var L = items(), n = 0; L.forEach(function (x) { if (o[x.id] && o[x.id].s) n++; }); return { n: n, all: L.length }; }
  function canGo(x) {
    var f = x.go && x.go[0]; if (!f) return false;
    if (f.indexOf('HOME_V2.') === 0) return !!(H() && typeof H()[f.slice(8)] === 'function');
    return typeof g[f] === 'function';
  }
  function callGo(x) {
    var f = x.go[0], a = x.go.slice(1);
    try {
      if (f.indexOf('HOME_V2.') === 0) H()[f.slice(8)].apply(null, a);
      else g[f].apply(null, a);
    } catch (e) {}
  }

  function css() {
    var d = g.document; if (el('pchkCss')) return;
    var C = [
      '#hv2Sheet .pc-top{display:flex;align-items:center;gap:10px;margin:6px 0 12px}',
      '#hv2Sheet .pc-bar{flex:1;height:8px;border-radius:99px;background:var(--line);overflow:hidden}#hv2Sheet .pc-bar i{display:block;height:100%;background:var(--blue);border-radius:99px}',
      '#hv2Sheet .pc-n{font-size:14px;font-weight:700;color:var(--sub)}',
      '#hv2Sheet .pc-r{padding:14px 16px;background:var(--card);border-radius:14px;margin-bottom:10px;border:1px solid var(--line)}',
      '#hv2Sheet .pc-r.ok{border-color:#A6E3C3;background:#F3FBF6}#hv2Sheet .pc-r.bad{border-color:#F5C2A8;background:#FFF6F0}',
      '#hv2Sheet .pc-h{display:flex;gap:10px;align-items:flex-start}#hv2Sheet .pc-h .e{font-size:20px;line-height:1.3;flex:none}',
      '#hv2Sheet .pc-h b{display:block;font-size:16px;font-weight:700}',
      '#hv2Sheet .pc-h small{display:block;font-size:13px;color:var(--sub2);margin-top:3px;line-height:1.45}',
      '#hv2Sheet .pc-h small.k{color:#027A48}',
      '#hv2Sheet .pc-st{margin-left:auto;flex:none;font-size:13px;font-weight:700;padding:4px 8px;border-radius:99px;background:var(--line2);color:var(--sub)}',
      '#hv2Sheet .pc-r.ok .pc-st{background:#027A48;color:#fff}#hv2Sheet .pc-r.bad .pc-st{background:#C2410C;color:#fff}',
      '#hv2Sheet .pc-b{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}',
      '#hv2Sheet .pc-b button{height:40px;padding:0 12px;border-radius:10px;font-size:14px;font-weight:700;background:var(--line2);color:var(--ink)}',
      '#hv2Sheet .pc-b button.go{background:var(--blue);color:#fff}#hv2Sheet .pc-b button.y{background:#027A48;color:#fff}#hv2Sheet .pc-b button.n{background:#FFF1E6;color:#C2410C}',
      '#hv2Sheet .pc-m{margin-top:8px}#hv2Sheet .pc-m textarea{width:100%;min-height:64px;border:1px solid #D1D6DB;border-radius:10px;padding:8px 10px;font-size:16px;box-sizing:border-box}',
      '#hv2Sheet .pc-memo{margin-top:6px;font-size:14px;color:#C2410C;line-height:1.45}',
      '#hv2Sheet .pc-ft{font-size:13px;color:var(--sub2);margin:10px 2px 14px;line-height:1.5}',
      '#pchkPill{position:fixed;left:50%;transform:translateX(-50%);top:calc(10px + env(safe-area-inset-top,0px));z-index:9990;height:38px;padding:0 14px;border-radius:99px;background:#191F28;color:#fff;font-size:14px;font-weight:700;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.25)}'
    ];
    var s = d.createElement('style'); s.id = 'pchkCss'; s.textContent = C.join('\n');
    (d.head || d.documentElement).appendChild(s);
  }

  function rowHtml(x, o, i) {
    var r = o[x.id] || {}, st = r.s === 'ok' ? '✓ 됐어요' : (r.s === 'bad' ? '이상해요' : '아직');
    return '<div class="pc-r' + (r.s ? ' ' + r.s : '') + '" id="pchkR' + i + '"><div class="pc-h"><span class="e">' + x.e + '</span><div><b>' + E(x.t) + '</b>' +
      '<small>👉 ' + E(x.how) + '</small><small class="k">✓ ' + E(x.ok) + '</small></div><span class="pc-st">' + st + '</span></div>' +
      (r.s === 'bad' && r.m ? '<div class="pc-memo">📝 ' + E(r.m) + '</div>' : '') +
      '<div class="pc-b">' + (canGo(x) ? '<button type="button" class="go" onclick="pchkGo(' + i + ')">가기 ›</button>' : '') +
      '<button type="button" class="y" onclick="pchkSet(' + i + ',\'ok\')">✓ 됐어요</button>' +
      '<button type="button" class="n" onclick="pchkBad(' + i + ')">이상해요</button>' +
      (r.s ? '<button type="button" onclick="pchkSet(' + i + ',\'\')">지우기</button>' : '') + '</div>' +
      '<div class="pc-m" id="pchkM' + i + '" style="display:none"><textarea id="pchkT' + i + '" maxlength="300" placeholder="무엇이 이상했는지 한 줄 — 예: 말풍선이 아래 탭을 가려요">' + E(r.m || '') + '</textarea>' +
      '<div class="pc-b"><button type="button" class="n" onclick="pchkSet(' + i + ',\'bad\')">이상해요로 남기기</button></div></div></div>';
  }
  function topHtml(o) {
    var c = count(o), p = c.all ? Math.round(c.n * 100 / c.all) : 0;
    return '<div class="pc-top" id="pchkTop"><div class="pc-bar"><i style="width:' + p + '%"></i></div><span class="pc-n">' + c.n + ' / ' + c.all + ' 확인</span></div>';
  }
  function open() {
    var h = H(); if (!h || typeof h.sheet !== 'function') return false;
    css();
    var o = load(), L = items();
    if (Object.keys(o).length) save(o);   /* 이 기기에만 있던 것도 계정에 한 번 */
    h.sheet('<h1>📱 폰 확인 한 장</h1><div class="sub">한 줄씩 「가기 ›」 로 해 보고 ✓ 됐어요 · 이상해요 를 남겨 주세요 — 남기면 바로 고칠게요</div>' +
      topHtml(o) + '<div id="pchkL">' + L.map(function (x, i) { return rowHtml(x, o, i); }).join('') + '</div>' +
      '<button type="button" class="btn g" onclick="pchkCopy()">📋 결과 복사 (카톡 · 대화창에 붙여 넣기)</button>' +
      '<div class="pc-ft">남긴 결과는 이 폰과 사장님 계정에 같이 담겨요(고객 정보 없음). 다 하셨으면 대화창에 「확인 끝」 한마디면 돼요.</div>');
    pill(false);
    return true;
  }
  function redraw(i) {
    var o = load(), L = items(), r = el('pchkR' + i), t = el('pchkTop');
    if (r && L[i]) r.outerHTML = rowHtml(L[i], o, i);
    if (t) t.outerHTML = topHtml(o);
    if (S.live) pill(true);
  }
  function setS(i, s) {
    var x = items()[i]; if (!x) return;
    var o = load(), t = el('pchkT' + i), m = t ? String(t.value || '').trim().slice(0, 300) : '';
    if (!s) delete o[x.id];
    else o[x.id] = s === 'bad' ? { s: 'bad', m: m } : { s: 'ok' };
    var acct = save(o);
    redraw(i);
    if (s) try { if (typeof g.toast === 'function') g.toast(acct ? (s === 'ok' ? '✓ 남겼어요' : '📝 이상해요 — 남겼어요, 고칠게요') : '이 폰에 남겼어요 — 계정은 연결 전이라 「결과 복사」 로 보내 주세요'); } catch (e) {}
  }
  function bad(i) { var m = el('pchkM' + i); if (m) { m.style.display = m.style.display === 'none' ? 'block' : 'none'; var t = el('pchkT' + i); if (t && m.style.display === 'block') t.focus(); } }
  function goTo(i) {
    var x = items()[i]; if (!x) return;
    S.live = true;
    try { H().close(); } catch (e) {}
    callGo(x);
    pill(true);
  }
  function pill(on) {
    var b = el('pchkPill');
    if (!on) { if (b && b.parentNode) b.parentNode.removeChild(b); return; }
    css();
    if (!b) { b = g.document.createElement('button'); b.type = 'button'; b.id = 'pchkPill'; b.onclick = function () { open(); }; g.document.body.appendChild(b); }
    var c = count(load()); b.textContent = '📱 폰 확인 ' + c.n + '/' + c.all + ' · 돌아가기';
  }
  function text() {
    var o = load(), L = items(), c = count(o);
    var out = ['📱 폰 확인 결과 (' + c.n + '/' + c.all + ')'];
    L.forEach(function (x) {
      var r = o[x.id] || {};
      out.push((r.s === 'ok' ? '✅ ' : r.s === 'bad' ? '⚠️ ' : '⬜ ') + x.t + (r.s === 'bad' && r.m ? ' — ' + r.m : ''));
    });
    return out.join('\n');
  }
  function copy() {
    var t = text();
    try { if (typeof g.copyText === 'function') { g.copyText(t); return; } } catch (e) {}
    try { g.navigator.clipboard.writeText(t); if (typeof g.toast === 'function') g.toast('복사했어요'); } catch (e2) {}
  }

  /* ?pchk=1 로 들어오면 — 새 오늘 화면이 선 뒤 한 번 엶(로그인을 기다림 · 길어야 3분) */
  function boot() {
    var q = T(function () { return g.location.search; }, '') || '';
    if (!/[?&]pchk=1\b/.test(q)) return;
    var n = 0, t = setInterval(function () {
      n++;
      if (el('hv2') && H() && typeof H().sheet === 'function') { clearInterval(t); setTimeout(open, 600); return; }
      if (n > 360) clearInterval(t);
    }, 500);
  }

  g.PCHK_V2 = { ITEMS: ITEMS, KEY: KEY, open: open, text: text, items: items, load: load };
  /* onclick 이 부르는 이름 — 점(.) 없는 함수 */
  g.pchkOpen = open;
  g.pchkGo = goTo;
  g.pchkSet = setS;
  g.pchkBad = bad;
  g.pchkCopy = copy;
  if (g.document && g.document.readyState !== 'loading') boot();
  else if (g.document) g.document.addEventListener('DOMContentLoaded', boot);
})(window);
