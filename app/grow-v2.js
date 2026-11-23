/* ═══════════════════════════════════════════════════════════════════
   grow-v2.js — 📣 <b>새 알리기 화면 — 시안 9차 「알리기」 그대로</b> (판 X528)

   사장님 말씀 (2026-11-23) 「6번 해」 — 시안 9차 점검표 고칠 차례 ⑥ 알리기 탭 · 팀 탭(지점장) · 나.
   이 파일은 그중 <b>알리기</b>입니다. 팀 · 나는 team-v2.js.

   ── 무엇을 하나 ──────────────────────────────────────────────────
   ★ 아래 「콘텐츠」 칸(content)이 여는 화면을 시안 rGrow 차례 · 옷 그대로 그립니다:
       알리기 → 이번 주 나를 알린 날(월~금 다섯 칸) → 오늘 올릴 것(🖼 카드 만들기 · ✓ 올렸어요)
       → 만들기(메뉴 목록) → 광고 · 심의 먼저(메뉴 목록)
   ★ 아래 탭 띠의 이름(「콘텐츠」)은 <b>그대로</b>입니다 — 사장님 말씀 「위 즐겨찾기 띠 · 아래 탭 5칸 · 🎙/? 그대로 둬」.
   ★ 칸 속은 <b>라이브 그대로</b>입니다 — 새로 세거나 지어내지 않습니다(1번 · 5번):
       「올렸어요」 = 아침 미션 ⑤ 「오늘 올릴 SNS 캐러셀」 체크(체크판 day · d10) — 새 오늘 화면 📣 알리기 걸음과 <b>같은 칸</b>
         (적기 hmMsDid · 되돌리기 hmMsUndo · 읽기 hmMsCk — 체크판이 서버 daily_checks 로 올림, 여기서는 부르기만)
       이번 주 다섯 칸 = 체크판이 이 기기에 남겨 둔 그날 칸(apex_ck_day_날짜)의 d10 — 이 기기에 없는 날은 ✓ 를 안 찍습니다(모르는 것을 했다고 안 씀)
       카드 만들기 = 아침 미션 ⑤ 가 가리키는 「정책·상품 뉴스」(biz_news) · 메뉴 이름 · 아이콘 · 설명은 TABS · TAB_META 한 곳(ctName · ctIcon · ctDesc)
       등급에 막힌 화면은 안 세웁니다(navItemOf — 예전 콘텐츠 판 hubRowHtml 과 같은 자)
   ★ 시안의 예시 문구(기사 제목 등)는 옮기지 않습니다.

   ── 깨지지 않게 ─────────────────────────────────────────────────
     · 「↩ 예전 화면」 을 누른 기기만 예전 콘텐츠 판(apex_grow_v2 = 'old'), 예전 판 맨 위 「✨ 새 알리기」 로 다시('1').
     · 자동 점검 브라우저(navigator.webdriver)는 예전 판 — 옛 콘텐츠 판 점검이 그대로 돕니다.
     · ALLOWED = false 한 줄이면 모두 예전 판. index.html 은 세 자리만(싣기 · renderContentHub 첫 줄 · 예전 판 맨 위 단추).
     · 서버를 부르지 않습니다 · 새로 저장하지 않습니다 — 이 기기 고르기 한 칸(apex_grow_v2)만 적습니다.
   점검: scripts/check-growv2.js
   ═══════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var ALLOWED = true;                 /* 모두에게 끄기 — false 한 줄이면 전원이 예전 콘텐츠 판 */
  var KEY = 'apex_grow_v2';           /* 이 기기에만 · 서버로 안 갑니다 */
  var PROMO_CK = 'd10';               /* 아침 미션 ⑤ 「오늘 올릴 SNS 캐러셀」 — 새 오늘 화면(home-v2.js)과 같은 칸 */
  var CARD_TAB = 'biz_news';          /* 아침 미션 ⑤ 가 「정책·상품 뉴스에 있는 것」 이라고 가리키는 곳 */
  /* 시안 rGrow 의 두 묶음 — 메뉴 id 만 적습니다(이름 · 설명은 TABS · TAB_META 에서) */
  var MAKE = ['biz_news', 'news_live', 'insta', 'blog', 'threads', 'video', 'calendar'];
  var AD = ['simui', 'mkt_meta', 'mkt_landing', 'mkt_card', 'mkt_volume', 'mkt_combine', 'ext_reply', 'ext_thread', 'ext_naver'];

  function el(id) { return g.document.getElementById(id); }
  function E(s) {
    if (typeof g.osEsc === 'function') return g.osEsc(s == null ? '' : String(s));
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function T(fn, def) { try { var v = fn(); return (v === undefined || v === null) ? def : v; } catch (e) { return def; } }
  function robot() { try { return !!(g.navigator && g.navigator.webdriver); } catch (e) { return false; } }
  function ls(k) { try { return g.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { g.localStorage.setItem(k, v); } catch (e) {} }
  function on() {
    if (!ALLOWED) return false;
    var v = ls(KEY);
    if (v === '1') return true;
    if (v === 'old') return false;
    return !robot();                  /* 고른 적 없는 기기 = 새 화면 (새 오늘 · 고객 · 달력과 같은 약속) */
  }

  /* ── 옷 — 시안 9차 CSS(.card · .wk · .list · .li · .btn · h2)를 .gr2 아래로만 ── */
  function css() {
    var d = g.document;
    if (d.getElementById('growV2Css')) return;
    var C = [
      '.gr2{--bg:#F2F4F6;--ink:#191F28;--sub:#4E5968;--sub2:#6B7684;--sub3:#8B95A1;--line2:#F2F4F6;--blue:#1A56DB;--blue-l:#EAF1FF;--pr:#7C5CFC;--pr-l:#F1EDFF;' +
        'color:var(--ink);font-size:15px;line-height:1.45;word-break:keep-all;max-width:560px;margin:0 auto 12px;-webkit-font-smoothing:antialiased}',
      '.gr2 *{box-sizing:border-box}',
      '.gr2 .hd{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0 2px}',
      '.gr2 h1{font-size:24px;font-weight:800;letter-spacing:-.4px;line-height:1.3;margin:0}',
      '.gr2 .lead{font-size:15px;color:var(--sub2);margin:2px 2px 14px}',
      '.gr2 .vchip{height:30px;padding:0 10px;border-radius:15px;background:#fff;border:1px solid #E5E8EB;font:inherit;font-size:13px;font-weight:700;color:var(--ink);cursor:pointer}',
      '.gr2 .card{background:#fff;border-radius:20px;padding:18px}',
      '.gr2 .card+.card{margin-top:10px}',
      '.gr2 .ch{display:flex;justify-content:space-between;font-size:13px;color:var(--sub2)}',
      '.gr2 .wk{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:12px}',
      '.gr2 .wk div{display:flex;flex-direction:column;align-items:center;gap:6px}',
      '.gr2 .wk b{width:40px;height:40px;border-radius:50%;background:var(--line2);display:grid;place-items:center;font-size:17px;color:#fff}',
      '.gr2 .wk .on b{background:var(--pr)}',
      '.gr2 .wk .td b{box-shadow:0 0 0 2px #fff,0 0 0 4px var(--pr)}',
      '.gr2 .wk span{font-size:13px;color:var(--sub2)}',
      '.gr2 .wk .td span{color:var(--pr);font-weight:700}',
      '.gr2 .tdo{font-size:18px;font-weight:700;margin:4px 0 12px}',
      '.gr2 .btn{display:flex;align-items:center;justify-content:center;gap:6px;height:52px;border:0;border-radius:14px;font:inherit;font-size:16px;font-weight:700;width:100%;text-align:center;cursor:pointer}',
      '.gr2 .btn+.btn{margin-top:8px}',
      '.gr2 .btn.p{background:var(--blue);color:#fff}',
      '.gr2 .btn.g{background:var(--line2);color:var(--ink)}',
      '.gr2 h2{display:flex;align-items:baseline;gap:8px;font-size:18px;font-weight:800;margin:24px 2px 8px}',
      '.gr2 h2 small{font-size:13px;font-weight:600;color:var(--sub2)}',
      '.gr2 .list{background:#fff;border-radius:20px;padding:6px 0}',
      '.gr2 .li{display:flex;align-items:center;gap:12px;padding:12px 20px;min-height:60px;width:100%;border:0;background:none;font:inherit;color:inherit;text-align:left;cursor:pointer}',
      '.gr2 .li+.li{border-top:1px solid var(--line2)}',
      '.gr2 .tile{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;font-size:22px;background:var(--line2);flex:none}',
      '.gr2 .li .tx{flex:1;min-width:0}',
      '.gr2 .li .t1{font-size:16px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.gr2 .li .t2{font-size:13px;color:var(--sub2);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.gr2 .li .ar{color:#B0B8C1;font-size:18px}',
      '.gr2b{display:flex;justify-content:flex-end;margin:0 0 6px}',
      '.gr2b .vchip{height:30px;padding:0 10px;border-radius:15px;background:#fff;border:1px solid #E5E8EB;font:inherit;font-size:13px;font-weight:700;color:#191F28;cursor:pointer}'
    ];
    var s = d.createElement('style'); s.id = 'growV2Css'; s.textContent = C.join('\n');
    (d.head || d.documentElement).appendChild(s);
  }

  /* ── 읽기 — 체크판 · 메뉴 표에 묻기만 ───────────────────────────── */
  function promoToday() { return !!T(function () { return g.hmMsCk()[PROMO_CK]; }, false); }
  function dayK() { return T(function () { return g.ckDayK(); }, '') || new Date().toISOString().slice(0, 10); }
  /* 이번 주 월~금 — 체크판의 날 셈(ckDayK)에서 월요일로 */
  function weekDays() {
    var t = dayK(), d = new Date(t + 'T00:00:00Z'), w = (d.getUTCDay() + 6) % 7, out = [];
    d.setUTCDate(d.getUTCDate() - w);
    for (var i = 0; i < 5; i++) { out.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
    return out;
  }
  /* 그날 올렸나 — 오늘은 체크판(hmMsCk), 지난날은 체크판이 이 기기에 남긴 그날 칸. 없으면 false(✓ 를 안 찍음) */
  function didOn(ds) {
    if (ds === dayK()) return promoToday();
    try { var m = JSON.parse(ls('apex_ck_day_' + ds) || '{}') || {}; return !!m[PROMO_CK]; } catch (e) { return false; }
  }
  function rowHtml(id) {
    if (!T(function () { return g.navItemOf(id); }, null)) return '';     /* 등급에 막힌 화면은 안 세움 — 예전 판과 같은 자 */
    var nm = T(function () { return g.ctName(id); }, id), ic = T(function () { return g.ctIcon(id); }, ''), ds = T(function () { return g.ctDesc(id); }, '');
    return '<button type="button" class="li" onclick="growV2Go(\'' + id + '\')"><div class="tile">' + E(ic || '·') + '</div><div class="tx"><div class="t1">' + E(nm) + '</div>' +
      (ds ? '<div class="t2">' + E(ds) + '</div>' : '') + '</div><span class="ar">›</span></button>';
  }
  function listHtml(ids) { var h = ids.map(rowHtml).join(''); return h ? '<div class="list">' + h + '</div>' : ''; }

  /* ── 붙이기 ─────────────────────────────────────────────────────── */
  function body() {
    var D = ['월', '화', '수', '목', '금'], W = weekDays(), td = dayK(), n = 0, pd = promoToday();
    var wk = W.map(function (ds, i) { var x = didOn(ds); if (x) n++; return '<div class="' + (x ? 'on' : '') + (ds === td ? ' td' : '') + '"><b>' + (x ? '✓' : '') + '</b><span>' + D[i] + '</span></div>'; }).join('');
    var mk = listHtml(MAKE), ad = listHtml(AD);
    return '<div class="hd"><h1>알리기</h1><button type="button" class="vchip" onclick="growV2Use(false)">↩ 예전 화면</button></div>' +
      '<div class="lead">나를 알리고 새 고객을 만나는 곳</div>' +
      '<div class="card"><div class="ch"><span>이번 주 나를 알린 날</span><span>' + n + ' / 5일</span></div><div class="wk">' + wk + '</div></div>' +
      '<div class="card"><div class="ch"><span>오늘 올릴 것</span></div><div class="tdo">' + (pd ? '오늘은 올렸어요 👏' : '오늘의 뉴스로 카드 한 장 만들기') + '</div>' +
        (pd ? '<button type="button" class="btn g" onclick="growV2Undo()">되돌리기</button>'
            : '<button type="button" class="btn p" onclick="growV2Go(\'' + CARD_TAB + '\')">🖼 카드 만들기</button><button type="button" class="btn g" onclick="growV2Done()">✓ 올렸어요</button>') + '</div>' +
      (mk ? '<h2>만들기</h2>' + mk : '') +
      (ad ? '<h2>광고 <small>심의 먼저</small></h2>' + ad : '');
  }
  /* renderContentHub 첫 줄이 부릅니다 — 빈 글이면 예전 콘텐츠 판 */
  function html() {
    try {
      if (!on()) return '';
      css();
      return '<div class="tab-pane on"><div class="gr2" id="gr2">' + body() + '</div></div>';
    } catch (e) { return ''; }
  }
  function repaint() { var b = el('gr2'); if (!b) return; try { b.innerHTML = body(); } catch (e) {} }
  function go(id) { try { g.go(id); } catch (e) {} }
  function done() { try { g.hmMsDid(PROMO_CK); } catch (e) {} repaint(); }       /* 체크판에 그대로 — 새 오늘 화면 📣 걸음도 같이 켜짐 */
  function undo() { try { g.hmMsUndo(PROMO_CK); } catch (e) {} repaint(); }
  function use(v) {
    lsSet(KEY, v ? '1' : 'old');
    try { if (typeof g.toast === 'function') g.toast(v ? '✨ 새 알리기 화면입니다 — 맨 위 「↩ 예전 화면」 으로 언제든 돌아갑니다' : '↩ 예전 콘텐츠 판으로 돌아왔습니다'); } catch (e) {}
    go('content');
  }
  /* 예전 콘텐츠 판 맨 위 — 다시 새 알리기로 */
  function back() { try { if (!ALLOWED || on() || robot()) return ''; css(); return '<div class="gr2b"><button type="button" class="vchip" onclick="growV2Use(true)">✨ 새 알리기</button></div>'; } catch (e) { return ''; } }

  g.GROW_V2 = { on: on, html: html, KEY: KEY, PROMO_CK: PROMO_CK, weekDays: weekDays, allowed: function () { return ALLOWED; } };
  /* index.html · onclick 이 부르는 이름 — 점(.) 없는 함수여야 check-hmclick 이 「부르는 함수가 있다」 고 읽습니다 */
  g.growV2Html = html;
  g.growV2Back = back;
  g.growV2Go = go;
  g.growV2Done = done;
  g.growV2Undo = undo;
  g.growV2Use = use;
})(window);
