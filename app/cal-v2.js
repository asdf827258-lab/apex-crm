/* ═══════════════════════════════════════════════════════════════════
   cal-v2.js — 📅 <b>새 달력 탭 — 시안 9차 「달력」 그대로</b> (판 X516)

   사장님 말씀 (2026-11-23) 「4번 해」 — 시안 9차 점검표 고칠 차례 ④ 달력 탭(폰 달력 담기 스위치 포함).
   앞서 하신 말씀 — 「캘린더 입력이 편해야 하는데 갤럭시든 아이폰 이든」.

   ── 무엇을 하나 ──────────────────────────────────────────────────
   ★ 아래 「달력」 탭(mycal)을 시안 rCal 차례 · 옷 그대로 그립니다:
       달력 → ‹ 2026년 11월 › → 한 달 판(월요일 시작 · 오늘 파랑 · 고른 날 검정 · 갈래별 색 점)
       → 색 풀이 → 고른 날 목록(시각 · 무엇 · 어디) → (오늘이면) 📍 오늘 동선 → ＋ 일정 넣기 → 📲 폰 달력에도 담기
   ★ 칸 속은 <b>라이브 달력 그대로</b>입니다 — 새로 세거나 지어내지 않습니다(1번 · 5번):
       일정 mcalItems · 하루 mcalDay(담당자 거르기 그대로) · 갈래 · 색 MCAL_KIND · 달 넘기기 mcalYmShift · 날 고르기 MCAL.sel
       · 담당자 붙이기 mcalWhoTag · 줄을 누르면 osOpenClient / 내 일정 지우기 mcalMyDel / 매일 하는 일 mrtPanelHtml
       · ＋ 일정 넣기 = 오늘 화면의 그 시트(HOME_V2.sched — mcalMyPut · mcalCusPut) · 오늘 동선 = 그 시트(HOME_V2.route)
       · 이번 달 통째로 = mcalDownload('month') · 폰으로 나가는 이름은 mcalOutName(기본 가림) 그대로.
   ★ 「📲 폰 달력에도 담기」 스위치 — 웹앱은 폰 달력에 <b>저절로</b> 넣을 권한이 없습니다(앱스토어 앱만).
     그래서 켜 두면 <b>일정을 넣는 그 순간 그 일정 한 건의 폰 달력 파일(.ics)</b>을 바로 받습니다 — 누르면 폰 달력이 「추가」 를 묻고
     그 시각에 울립니다(아이폰 · 갤럭시). 꺼 두면 예전처럼 「넣었어요」 화면의 단추로만. 이 기기에만 적습니다(apex_cal_ics).
   ★ 시안에만 있는 「📣 나를 알리는 날」 점은 안 찍습니다 — 라이브에 그 일정이 없습니다(지어내지 않음).

   ── 깨지지 않게 ─────────────────────────────────────────────────
     · 「↩ 예전 화면」 을 누른 기기만 예전 내 캘린더(apex_cal_v2 = 'old'), 「✨ 새 달력」 으로 다시('1').
       예전 화면(주 · 월 · 설정 · 실명 · 매일 아침 알림)은 한 글자도 안 바뀌었습니다 — 거기로 가는 줄도 맨 아래에 있습니다.
     · 자동 점검 브라우저(navigator.webdriver)는 예전 화면 — 옛 달력 점검이 그대로 돕니다.
     · ALLOWED = false 한 줄이면 모두 예전 화면. index.html 은 세 자리만(싣기 · renderMyCal 첫 줄 · 예전 화면 맨 위 단추).
     · 다시 그리는 자는 예전 그대로 mcalPaint(#mycalHost) 하나 — 날 고르기 · 달 넘기기 · 일정 넣기 뒤에 저절로 따라옵니다.
     · 서버를 부르지 않습니다 · 저장하지 않습니다 — 이 기기 고르기 두 칸(apex_cal_v2 · apex_cal_ics)만 적습니다.
   점검: scripts/check-calv2.js
   ═══════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var ALLOWED = true;                 /* 모두에게 끄기 — false 한 줄이면 전원이 예전 화면 */
  var KEY = 'apex_cal_v2';            /* 이 기기에만 · 서버로 안 갑니다 */
  var ICS_KEY = 'apex_cal_ics';       /* 📲 폰 달력에도 담기 — 이 기기에만 */

  function el(id) { return g.document.getElementById(id); }
  function E(s) {
    if (typeof g.osEsc === 'function') return g.osEsc(s == null ? '' : String(s));
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function T(fn, def) { try { var v = fn(); return (v === undefined || v === null) ? def : v; } catch (e) { return def; } }
  function Q(s) { return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
  function robot() { try { return !!(g.navigator && g.navigator.webdriver); } catch (e) { return false; } }
  function ls(k) { try { return g.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { g.localStorage.setItem(k, v); } catch (e) {} }
  function on() {
    if (!ALLOWED) return false;
    var v = ls(KEY);
    if (v === '1') return true;
    if (v === 'old') return false;
    return !robot();                  /* 고른 적 없는 기기 = 새 화면 (새 오늘 · 고객 화면과 같은 약속) */
  }
  function icsOn() { var v = ls(ICS_KEY); if (v === '1') return true; if (v === '0') return false; return !robot(); }   /* 시안처럼 켜진 채로 시작 · 자동 점검 브라우저는 끔 */

  /* ── 옷 — 시안 9차 CSS(.calhd · .calg · .cd · .calleg · .sw · .li · .btn)를 .cal2 아래로만 ── */
  function css() {
    var d = g.document;
    if (d.getElementById('calV2Css')) return;
    var C = [
      '.cal2{--bg:#F2F4F6;--ink:#191F28;--sub:#4E5968;--sub2:#6B7684;--sub3:#8B95A1;--line2:#F2F4F6;--blue:#1A56DB;--blue-l:#EAF1FF;' +
        'color:var(--ink);font-size:15px;line-height:1.45;word-break:keep-all;max-width:560px;margin:0 auto 12px;-webkit-font-smoothing:antialiased}',
      '.cal2 *{box-sizing:border-box}',
      '.cal2 .hd{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0 10px}',
      '.cal2 h1{font-size:24px;font-weight:800;letter-spacing:-.4px;line-height:1.3;margin:0}',
      '.cal2 .vchip{height:30px;padding:0 10px;border-radius:15px;background:#fff;border:1px solid #E5E8EB;font:inherit;font-size:13px;font-weight:700;color:var(--ink);cursor:pointer}',
      '.cal2 .calhd{display:flex;align-items:center;justify-content:space-between;background:#fff;border-radius:16px;padding:4px}',
      '.cal2 .calhd b{font-size:17px}',
      '.cal2 .calhd button{width:44px;height:44px;border:0;border-radius:12px;background:none;font:inherit;font-size:22px;color:var(--sub);text-align:center;cursor:pointer}',
      '.cal2 .calhd .tdy{width:auto;padding:0 10px;font-size:13px;font-weight:700;color:var(--blue)}',
      '.cal2 .calg{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;background:#fff;border-radius:18px;padding:8px 6px;margin-top:8px}',
      '.cal2 .calg .dh{text-align:center;font-size:13px;color:var(--sub3);font-weight:600;padding:2px 0 6px}',
      '.cal2 .cd{min-height:48px;border:0;background:none;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:6px 0 0;gap:4px;text-align:center;font:inherit;color:inherit;cursor:pointer}',
      '.cal2 .cd b{font-size:15px;font-weight:600}',
      '.cal2 .cd span{display:flex;gap:2px;height:6px}',
      '.cal2 .cd i{width:6px;height:6px;border-radius:50%}',
      '.cal2 .cd.td b{color:var(--blue);font-weight:800}',
      '.cal2 .cd.on{background:var(--ink)}',
      '.cal2 .cd.on b{color:#fff}',
      '.cal2 .calleg{display:flex;gap:12px;flex-wrap:wrap;font-size:13px;color:var(--sub2);margin:8px 4px 0}',
      '.cal2 .calleg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px}',
      '.cal2 .sec{display:flex;justify-content:space-between;align-items:baseline;margin:20px 2px 0}',
      '.cal2 .sec b{font-size:17px;font-weight:800}',
      '.cal2 .sec small{font-size:13px;color:var(--sub2)}',
      '.cal2 .list{background:#fff;border-radius:20px;padding:6px 0;margin-top:8px}',
      '.cal2 .li{display:flex;align-items:center;gap:12px;padding:12px 20px;min-height:60px;width:100%;border:0;background:none;font:inherit;color:inherit;text-align:left;cursor:pointer}',
      '.cal2 .li+.li{border-top:1px solid var(--line2)}',
      '.cal2 .li .time{width:52px;flex:none;font-size:14px;font-weight:700}',
      '.cal2 .li .tx{flex:1;min-width:0}',
      '.cal2 .li .t1{font-size:16px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.cal2 .li .t2{font-size:13px;color:var(--sub2);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.cal2 .li .ar{color:#B0B8C1;font-size:18px}',
      '.cal2 .li .x{flex:none;width:44px;height:44px;border:0;border-radius:12px;background:var(--line2);color:var(--sub2);font:inherit;font-size:15px;cursor:pointer}',
      '.cal2 .li.none{cursor:default}',
      '.cal2 .tile{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;font-size:22px;background:var(--line2);flex:none}',
      '.cal2 .rtl{display:flex;justify-content:space-between;align-items:center;width:100%;min-height:52px;margin-top:10px;padding:0 16px;border:0;border-radius:16px;background:var(--blue-l);color:var(--blue);font:inherit;font-size:15px;font-weight:700;cursor:pointer}',
      '.cal2 .rt{margin-top:10px}',
      '.cal2 .btn{display:flex;align-items:center;justify-content:center;gap:6px;height:52px;border:0;border-radius:14px;font:inherit;font-size:16px;font-weight:700;width:100%;text-align:center;margin-top:14px;cursor:pointer}',
      '.cal2 .btn.p{background:var(--blue);color:#fff}',
      '.cal2 .card{background:#fff;border-radius:20px;margin-top:10px;padding:12px 16px}',
      '.cal2 .sw{width:48px;height:28px;border-radius:14px;background:#D1D6DB;position:relative;flex:none;transition:.2s}',
      '.cal2 .sw i{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:.2s}',
      '.cal2 .sw.on{background:var(--blue)}',
      '.cal2 .sw.on i{left:23px}',
      '.cal2b{display:flex;justify-content:flex-end;margin:0 0 6px}',
      '.cal2b .vchip{height:30px;padding:0 10px;border-radius:15px;background:#fff;border:1px solid #E5E8EB;font:inherit;font-size:13px;font-weight:700;color:#191F28;cursor:pointer}'
    ];
    var s = d.createElement('style'); s.id = 'calV2Css'; s.textContent = C.join('\n');
    (d.head || d.documentElement).appendChild(s);
  }

  /* ── 읽기 — 라이브 달력에 묻기만 ───────────────────────────────── */
  function today() { return T(function () { return g.mcalToday(); }, '') || ''; }
  function ym() { return T(function () { return g.mcalYm(); }, '') || today().slice(0, 7); }
  /* 고른 날 — 안 골랐으면 오늘, 다른 달을 보고 있으면 그 달 1일(판 밖의 날 목록을 세우지 않게) */
  function sel() { var s = T(function () { return g.MCAL.sel; }, ''), t = today(); return s || (t.slice(0, 7) === ym() ? t : ym() + '-01'); }
  function KIND() { return T(function () { return g.MCAL_KIND; }, {}) || {}; }
  /* 「매일 하는 일」(rt)은 날마다 서는 내 몫이라 점 · 건수에서 뺍니다 — 예전 달력의 mcalCnt 와 같은 자 */
  function dayOf(items, ds) { return (T(function () { return g.mcalDay(items, ds); }, []) || []).filter(function (x) { return x && x.k !== 'rt'; }); }
  function hasRt(items, ds) { return (T(function () { return g.mcalDay(items, ds); }, []) || []).some(function (x) { return x && x.k === 'rt'; }); }
  function hmOf(x) { var m = /^(\d{1,2}:\d{2})/.exec(String((x && x.s) || '')); return m ? m[1] : ''; }
  function placeOf(x) { var s = String((x && x.s) || ''); return x.k === 'appt' ? s.replace(/^\d{1,2}:\d{2}\s*(·\s*)?/, '') : (hmOf(x) ? '' : s); }
  function nameTxt(x, many) {
    var t = x.k === 'appt' ? T(function () { return g.hmFullNm(x.t); }, x.t) : x.t;
    return (T(function () { return g.mcalWhoTag(x, many); }, '') || '') + (t || '');
  }

  /* ── 칸마다 ─────────────────────────────────────────────────────── */
  function gridHtml(items) {
    var m = ym(), td = today(), sd = sel(), K = KIND();
    var first = new Date(m + '-01T00:00:00Z'), start = (first.getUTCDay() + 6) % 7;   /* 월요일 시작 — 예전 달력과 같은 셈 */
    var last = new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 0)).getUTCDate();
    var h = '<div class="calg">' + ['월', '화', '수', '목', '금', '토', '일'].map(function (d) { return '<div class="dh">' + d + '</div>'; }).join('');
    for (var i = 0; i < start; i++) h += '<div></div>';
    for (var dd = 1; dd <= last; dd++) {
      var ds = m + '-' + ('0' + dd).slice(-2), L = dayOf(items, ds), seen = {}, dots = '';
      L.forEach(function (x) { if (seen[x.k] || Object.keys(seen).length >= 3) return; seen[x.k] = 1; dots += '<i style="background:' + ((K[x.k] && K[x.k].c) || '#8B95A1') + '"></i>'; });
      h += '<button type="button" class="cd' + (ds === sd ? ' on' : '') + (ds === td ? ' td' : '') + '" onclick="calV2Pick(\'' + ds + '\')"><b>' + dd + '</b><span>' + dots + '</span></button>';
    }
    return h + '</div>';
  }
  function legHtml(items) {
    var m = ym(), K = KIND(), got = {};
    Object.keys(items || {}).forEach(function (ds) { if (ds.slice(0, 7) === m) dayOf(items, ds).forEach(function (x) { got[x.k] = 1; }); });
    var ks = Object.keys(K).filter(function (k) { return got[k]; });
    return ks.length ? '<div class="calleg">' + ks.map(function (k) { return '<span><i style="background:' + K[k].c + '"></i>' + E(K[k].t) + '</span>'; }).join('') + '</div>' : '';
  }
  function dayHtml(items) {
    var sd = sel(), K = KIND(), d = new Date(sd + 'T00:00:00Z');
    var L = dayOf(items, sd).slice().sort(function (a, b) { return (hmOf(a) || '99').localeCompare(hmOf(b) || '99'); });
    var many = T(function () { return g.mcalManyWho(L); }, false);
    var h = '<div class="sec"><b>' + (d.getUTCMonth() + 1) + '월 ' + d.getUTCDate() + '일 ' + '일월화수목금토'[d.getUTCDay()] + '요일' + (sd === today() ? ' · 오늘' : '') + '</b><small>' + L.length + '개</small></div><div class="list">';
    h += L.length ? L.map(function (x) {
      var k = K[x.k] || { e: '•', t: '', c: '#8B95A1' }, pl = placeOf(x), tm = hmOf(x);
      var body = '<div class="time" style="color:' + k.c + '">' + E(tm || '종일') + '</div><div class="tx"><div class="t1">' + k.e + ' ' + E(nameTxt(x, many)) + '</div>' +
        '<div class="t2">' + E([k.t, pl].filter(Boolean).join(' · ')) + (x.late ? ' · ' + E(String(x.late).slice(5).replace('-', '/')) + ' 지났음' : '') + '</div></div>';
      if (x.k === 'my') return '<div class="li none">' + body + '<button type="button" class="x" aria-label="이 일정 지우기" onclick="mcalMyDel(\'' + Q(x.my) + '\')">✕</button></div>';
      var go = x.id ? 'osOpenClient(\'' + Q(x.id) + '\')' : (x.k === 'help' ? 'go(\'airep\')' : 'go(\'clients\')');   /* 예전 날 목록과 같은 길 */
      return '<button type="button" class="li" onclick="' + go + '">' + body + '<span class="ar">›</span></button>';
    }).join('') : '<div class="li none"><div class="tx"><div class="t2">이날은 일정이 없어요</div></div></div>';
    h += '</div>';
    /* 매일 하는 일 — 예전 달력이 펴던 그 칸 그대로(그 자리에서 체크) */
    if (hasRt(items, sd)) { var rt = T(function () { return g.mrtPanelHtml(sd); }, ''); if (rt) h += '<div class="rt">' + rt + '</div>'; }
    if (sd === today()) {
      var ap = L.filter(function (x) { return x.k === 'appt'; }).length;
      h += '<button type="button" class="rtl" onclick="calV2Route()"><span>📍 오늘 동선' + (ap ? ' · 약속 ' + ap + '곳' : ' · 약속 없는 날은 추천 동선') + '</span><span>›</span></button>';
    }
    return h;
  }
  function icsHtml() {
    var o = icsOn();
    return '<button type="button" class="li card" onclick="calV2Ics()"><div class="tile">📲</div><div class="tx"><div class="t1">폰 달력에도 담기</div>' +
      '<div class="t2">' + (o ? '일정을 넣으면 폰 달력 파일도 바로 받아요 · 아이폰 · 갤럭시' : '꺼 두면 「넣었어요」 화면의 단추로만 받아요') + '</div></div><span class="sw' + (o ? ' on' : '') + '"><i></i></span></button>' +
      '<div class="list"><button type="button" class="li" onclick="mcalDownload(\'month\')"><div class="tile">📆</div><div class="tx"><div class="t1">이번 달 통째로 폰 달력에</div><div class="t2">달이 바뀌면 한 번 더 · 고객 이름은 가려서 나가요</div></div><span class="ar">›</span></button>' +
      '<button type="button" class="li" onclick="calV2Use(false)"><div class="tile">⚙️</div><div class="tx"><div class="t1">예전 내 캘린더</div><div class="t2">주 · 월 보기 · 울릴 시각 · 매일 아침 알림 · 실명 설정</div></div><span class="ar">›</span></button></div>';
  }

  /* ── 붙이기 ─────────────────────────────────────────────────────── */
  /* renderMyCal 첫 줄이 부릅니다 — 빈 글이면 예전 내 캘린더 */
  function html() {
    try {
      if (!on()) return '';
      css();
      try { if (typeof g.mcalMyLoad === 'function' && g.OS && g.OS.profile) g.mcalMyLoad(); } catch (e0) {}   /* 내 일정 — 예전 달력과 같은 한 번 */
      var items = T(function () { return g.mcalItems(); }, {}) || {}, m = ym();
      return '<div class="cal2" id="cal2"><div class="hd"><h1>달력</h1><button type="button" class="vchip" onclick="calV2Use(false)">↩ 예전 화면</button></div>' +
        '<div class="calhd"><button type="button" onclick="calV2Move(-1)" aria-label="앞 달">‹</button><b>' + (+m.slice(0, 4)) + '년 ' + (+m.slice(5, 7)) + '월</b>' +
          '<span><button type="button" class="tdy" onclick="calV2Today()">오늘</button><button type="button" onclick="calV2Move(1)" aria-label="다음 달">›</button></span></div>' +
        gridHtml(items) + legHtml(items) + dayHtml(items) +
        '<button type="button" class="btn p" onclick="calV2Add()">＋ 일정 넣기</button>' + icsHtml() + '</div>';
    } catch (e) { return ''; }
  }
  function repaint() { try { if (typeof g.mcalPaint === 'function') g.mcalPaint(); } catch (e) {} }
  function pick(ds) { try { g.MCAL.sel = ds; } catch (e) {} repaint(); }        /* 예전 mcalPick 은 같은 날을 두 번 누르면 풀림 — 시안은 늘 고른 채 */
  function move(n) { try { g.mcalYmShift(n); } catch (e) {} }   /* 달만 넘김(예전 화면의 주 · 월 고르기는 안 건드림) · 고른 날을 비우고 다시 그림 */
  function goToday() { try { g.mcalGoToday(); } catch (e) {} }
  function add() {
    try {
      g.HOME_V2.sched();
      var s = T(function () { return g.MCAL.sel; }, '');
      if (s) g.HOME_V2.schedSet('ds', s);              /* 고른 날로 — 시트의 「다른 날」 칸과 같은 자리 */
    } catch (e) { try { g.go('mycal'); } catch (e2) {} }
  }
  function route() { try { g.HOME_V2.route(); } catch (e) { try { g.hmRtOpen(); } catch (e2) {} } }
  function ics() {
    var v = !icsOn();
    lsSet(ICS_KEY, v ? '1' : '0');
    try { if (typeof g.toast === 'function') g.toast(v ? '📲 일정을 넣으면 폰 달력 파일도 바로 받아요' : '폰 달력 담기를 껐어요 — 「넣었어요」 화면의 단추로만 받아요'); } catch (e) {}
    repaint();
  }
  function use(v) {
    lsSet(KEY, v ? '1' : 'old');
    try { if (typeof g.toast === 'function') g.toast(v ? '✨ 새 달력입니다 — 맨 위 「↩ 예전 화면」 으로 언제든 돌아갑니다' : '↩ 예전 내 캘린더로 돌아왔습니다'); } catch (e) {}
    try { g.go('mycal'); } catch (e2) { repaint(); }
  }
  /* 예전 내 캘린더 맨 위 — 다시 새 달력으로 */
  function back() { try { if (!ALLOWED || on() || robot()) return ''; css(); return '<div class="cal2b"><button type="button" class="vchip" onclick="calV2Use(true)">✨ 새 달력</button></div>'; } catch (e) { return ''; } }

  g.CAL_V2 = { on: on, icsOn: icsOn, html: html, KEY: KEY, ICS_KEY: ICS_KEY, allowed: function () { return ALLOWED; } };
  /* index.html · onclick 이 부르는 이름 — 점(.) 없는 함수여야 check-hmclick 이 「부르는 함수가 있다」 고 읽습니다 */
  g.calV2Html = html;
  g.calV2Back = back;
  g.calV2Pick = pick;
  g.calV2Move = move;
  g.calV2Today = goToday;
  g.calV2Add = add;
  g.calV2Route = route;
  g.calV2Ics = ics;
  g.calV2Use = use;
})(window);
