/* ═══════════════════════════════════════════════════════════════════
   home-v2.js — ✨ <b>새 「오늘」 화면 — 9차 시안 디자인 그대로</b> (판 X502)

   사장님 말씀 (2026-11-20)
     「목각으로 만든 부분이랑 많이 다른데? 기존에 있었던 내용하고 너무 비슷한데」
     「새 홈을 만들어서 … 부작용이나 파일이 깨지는 경우를 예측하고 시행해줘
       그리고, 언제든 빽업할수 있도록 준비해줘」
     「가장 중요한건 목각 그대로 따라가서, 목각 디자인에서, 맞는 기능들을 채우는게 먼저」

   ── 무엇을 하나 ──────────────────────────────────────────────────
   ★ 디자인은 <b>시안(Desktop\코드\메뉴정리_1단계\9차_시안.html) 그대로</b>입니다 —
     색·글자 크기·둥글기·간격을 시안 CSS 에서 옮겼고(.hv2 아래로만 · 앱 옷과 안 섞임),
     칸 차례도 시안 rHome 그대로입니다:
       인사 → 이번 달 목표 → 다섯 걸음 → 🛰 챙기는 중 → 지금 이분(옆으로 넘김)
       → 🧭 이번 달 상품전략 → 이번 주 → 영업 한 바퀴 → 🌙 오늘 돌아보기 → ☰ 다른 메뉴
   ★ 칸 속은 <b>라이브 기능 그대로</b> 채웁니다 — 새로 세거나 지어내지 않습니다(1번·5번):
       남은 분 hmLeft · 카드 줄 hmSteps/hmWhy · TA 카톡 HM_TAMSG · TA 대본 HM_TAMSG.openTa
       상품 HM_DOOR.pick/hmDoorGo · 목표 PF(monthly_perf, pfLoad) · 예상 pexSum
       다섯 걸음 hmWayCall/Meet/Tidy/Rec/Care · 약속 지난 분 arApptPast · 소개 hmReferRows
       마디 mstDueList · 이번 주 mcalItems/mcalDay · 동선 hmRtNear/hmRtOpen
       단계 arStageN · 돌아보기 hmNightSub/hmNightHtml · 메뉴 TABS · 이름 가리기 hmNmToggle
       이분 끝 hmQfin · 오늘은 뒤로 hmSkip · 이분 한 장 hmOpen
   ★ <b>저장 코드를 새로 짜지 않습니다</b> — 누르면 위의 기존 함수를 부르기만 합니다.

   ── 깨지지 않게 ─────────────────────────────────────────────────
     · ★ 판 X505 — 사장님 말씀 (2026-11-20) 「우선 배포하고 <b>새화면을 먼저 기준</b>으로 하고, 구화면을 누르면
       전 버전으로 할수 있도록 우선 만들어, 새버전 전부 마무리 될때까지는」.
       → <b>기본이 새 화면</b>입니다. 「↩ 예전 화면」 을 누른 기기만 예전 화면(localStorage apex_home_v2 = 'old'),
         옛 홈 인사 줄 「✨ 새 화면」 을 누르면 다시 새 화면('1').
       ⚠ <b>자동 점검 브라우저(navigator.webdriver)는 예전 화면</b>을 봅니다 — 예전 화면은 「↩ 예전 화면」 으로
         계속 쓰는 화면이라 그쪽 점검 수십 개가 계속 지켜야 합니다. 새 화면은 check-homev2 가 봅니다.
     · 옛 홈은 <b>지우지 않고 그 아래에 숨겨 둔 채 그대로 돕니다</b> — 옛 칸을 칠하는
       함수가 하나도 안 끊깁니다. 「☰ 다른 메뉴」 맨 위 「예전 오늘 칸 펼치기」 로 다 보입니다.
     · 새 화면을 그리다 오류가 나면 그 자리에서 예전 화면으로 돌아갑니다.

   ── 되돌리는 길 ─────────────────────────────────────────────────
     ① 「↩ 예전 화면」 한 번 · ② 주소 ?home=old · ③ 아래 ALLOWED=false 한 줄(모두)
     ④ 태그 backup/home-before-v2 · ⑤ PC 사본 Desktop\코드\메뉴정리_1단계\백업_새홈전_20261120
   ═══════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var ALLOWED = true;                 /* ③ 모두에게 끄기 — false 한 줄이면 전원이 예전 화면 */
  var DEFAULT_NEW = true;             /* 판 X505 — 고른 적 없는 기기는 새 화면 (사장님 말씀 「새화면을 먼저 기준으로」) */
  var KEY = 'apex_home_v2';           /* 이 기기에만 · 서버로 안 갑니다 */
  var OLD = false;                    /* 예전 오늘 칸을 아래에 펼쳐 보나 */
  var CH = 'kakao';                   /* 카톡 · 문자 */
  var SEL = null;                     /* 이번 주 — 고른 날(0=월) */
  var MOPEN = false, MG = {};         /* ☰ 다른 메뉴 */
  var GOAL_TRY = 0;

  function el(id) { return g.document.getElementById(id); }
  function E(s) {
    if (typeof g.osEsc === 'function') return g.osEsc(s == null ? '' : String(s));
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function T(fn, def) { try { var v = fn(); return (v === undefined || v === null) ? def : v; } catch (e) { return def; } }
  function Q(s) { return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }   /* onclick 안 글 */
  function strip(s) { return String(s == null ? '' : s).replace(/<[^>]*>/g, ''); }

  function robot() { try { return !!(g.navigator && g.navigator.webdriver); } catch (e) { return false; } }
  function on() {
    if (!ALLOWED) return false;
    var v = null;
    try { v = g.localStorage.getItem(KEY); } catch (e) { v = null; }
    if (v === '1') return true;
    if (v === 'old') return false;
    return DEFAULT_NEW && !robot();   /* 고른 적 없으면 새 화면 · 자동 점검은 예전 화면 */
  }
  /* 고르면 이 기기에 남깁니다 — 새 화면 '1' · 예전 화면 'old' */
  function set(v) {
    try { g.localStorage.setItem(KEY, v ? '1' : 'old'); } catch (e) {}
  }
  function fromUrl() {
    try {
      var m = String(g.location.search || '').match(/[?&]home=(v2|old)\b/);
      if (m) set(m[1] === 'v2');
    } catch (e) {}
  }

  /* ── 옷 — 시안 9차 CSS 를 .hv2 아래로만 옮긴 것 ─────────────────────── */
  function css() {
    var d = g.document;
    if (d.getElementById('hmV2Css')) return;
    var C = [
      /* 옛 홈은 숨긴 채 그대로 돕니다 — 「예전 오늘 칸 펼치기」 면 아래에 섭니다 */
      '.tab-pane.hm-toss.hm-v2:not(.hm-v2-old)>*:not(#hv2){display:none!important}',
      '.tab-pane.hm-toss.hm-v2.hm-v2-old>#hv2{margin-bottom:24px;padding-bottom:16px;border-bottom:2px dashed #D1D6DB}',
      '.hv2{--bg:#F2F4F6;--card:#fff;--ink:#191F28;--sub:#4E5968;--sub2:#6B7684;--sub3:#8B95A1;--line:#E5E8EB;--line2:#F2F4F6;' +
        '--blue:#1A56DB;--blue-l:#EAF1FF;--green:#0B8A4E;--green-l:#E7F6EE;--warn:#C2410C;--warn-l:#FFF1E6;--r:20px;' +
        'color:var(--ink);font-size:15px;line-height:1.45;word-break:keep-all;max-width:560px;margin:0 auto;-webkit-font-smoothing:antialiased}',
      '.hv2 *{box-sizing:border-box}',
      '.hv2 button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;text-align:left;margin:0}',
      '.hv2 a{color:inherit;text-decoration:none}',
      /* 맨 위 — 날짜 · 이름 가리기 · 예전 화면 */
      '.hv2 .top{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 2px 6px}',
      '.hv2 .top .day{font-size:15px;font-weight:700;color:var(--sub)}',
      '.hv2 .top .r{display:flex;gap:6px}',
      '.hv2 .nmbtn{height:44px;padding:0 14px;border-radius:22px;background:#fff;font-size:14px;font-weight:700;color:var(--sub);text-align:center}',
      '.hv2 .nmbtn.bk{color:var(--blue)}',
      '.hv2 .hello{font-size:23px;font-weight:800;letter-spacing:-.5px;line-height:1.3;margin:4px 2px 12px}',
      '.hv2 .hello b{color:var(--blue)}',
      '.hv2 .whowrap{margin:0 0 12px}',
      '.hv2 .who-strip{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 0 12px;padding:2px 2px 0}',
      '.hv2 .who-strip::-webkit-scrollbar{display:none}',
      '.hv2 .who-strip button{flex:none;display:flex;flex-direction:column;align-items:center;gap:3px;width:56px;min-height:64px;text-align:center;font-size:13px;color:var(--sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.hv2 .who-strip button small{font-size:13px;color:var(--sub3);font-weight:600}',
      '.hv2 .who-strip .ring{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:15px;background:#fff;position:relative;flex:none}',
      '.hv2 .who-strip .ring svg{position:absolute;inset:0;width:44px;height:44px}',
      '.hv2 .who-strip .ring span{position:relative}',
      '.hv2 .who-strip button.on{color:var(--ink);font-weight:800}',
      '.hv2 .who-strip button.on .ring{background:var(--ink);color:#fff}',
      '.hv2 .whonote{display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--warn-l);color:var(--warn);border-radius:12px;padding:6px 6px 6px 12px;font-size:14px;font-weight:700;margin:-4px 0 12px}',
      '.hv2 .whonote button{height:40px;padding:0 12px;border-radius:10px;background:#fff;color:var(--ink);font-size:14px;font-weight:700;flex:none}',
      /* 이번 달 한 줄 */
      '.hv2 .mon{display:flex;align-items:center;gap:12px;width:100%;background:#fff;border-radius:18px;padding:12px 16px;min-height:60px}',
      '.hv2 .mon .mt{font-size:13px;color:var(--sub2);font-weight:600;white-space:nowrap}',
      '.hv2 .mon .mb{flex:1;min-width:0}',
      '.hv2 .mon .mn{font-size:15px;font-weight:800;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.hv2 .mon .mn em{font-style:normal;color:var(--warn)}',
      '.hv2 .mon .mn em.ok{color:var(--green)}',
      '.hv2 .mon .mn em.n{color:var(--sub2);font-weight:700}',
      '.hv2 .mon .mbar{position:relative;height:6px;border-radius:4px;background:var(--line2);display:flex}',
      '.hv2 .mon .mbar i.act{background:var(--blue);border-radius:4px 0 0 4px}',
      '.hv2 .mon .mbar i.exp{background:#B9CDF6}',
      '.hv2 .mon .mbar .gl{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--ink)}',
      '.hv2 .ar{color:#B0B8C1;font-size:18px}',
      /* 다섯 걸음 */
      '.hv2 .steps5{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;background:#fff;border-radius:18px;padding:8px 6px;margin-top:8px}',
      '.hv2 .steps5 button{display:flex;flex-direction:column;align-items:center;gap:2px;min-height:62px;justify-content:center;border-radius:12px;text-align:center}',
      '.hv2 .steps5 .si{font-size:18px;line-height:1}',
      '.hv2 .steps5 .sl{font-size:13px;color:var(--sub2);font-weight:600}',
      '.hv2 .steps5 .sn{font-size:13px;font-weight:800;color:var(--ink);white-space:nowrap}',
      '.hv2 .steps5 button.cur{background:var(--blue-l)}',
      '.hv2 .steps5 button.cur .sl{color:var(--blue)}',
      '.hv2 .steps5 button.done .sn{color:var(--green)}',
      '.hv2 .steps5 button.pr .sn{color:#6D4AE8}',
      '.hv2 .steps5 button.pr.done .sn{color:var(--green)}',
      '.hv2 .streak{font-size:13px;color:var(--sub2);text-align:right;margin:6px 4px 0}',
      '.hv2 .streak b{color:var(--ink)}',
      '.hv2 .dock{position:fixed;left:12px;right:70px;bottom:calc(66px + env(safe-area-inset-bottom,0px));z-index:140;display:grid;gap:4px;' +
        'background:rgba(255,255,255,.96);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-radius:16px;padding:4px;box-shadow:0 6px 24px rgba(25,31,40,.14)}',
      '.hv2 .dock button{height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:14px;font-weight:700;text-align:center}',
      '.hv2 .dock button:active{background:var(--blue-l);color:var(--blue)}',
      '.hv2 .dock .e{font-size:18px}',
      '#hv2{padding-bottom:64px}',
      '@media(min-width:1101px){.hv2 .dock{position:sticky;left:auto;right:auto;bottom:16px;margin-top:12px}#hv2{padding-bottom:0}}',
      /* 🛰 챙기는 중 */
      '.hv2 .jv{display:flex;align-items:center;gap:12px;width:100%;background:#fff;border-radius:18px;padding:12px 16px;margin-top:12px;min-height:60px;border:1.5px solid #CFE0FF}',
      '.hv2 .jv-i{font-size:22px}',
      '.hv2 .jv-t{flex:1;min-width:0;display:flex;flex-direction:column}',
      '.hv2 .jv-t b{font-size:15px}',
      '.hv2 .jv-t small{font-size:13px;color:var(--sub2)}',
      /* 지금 이분 */
      '.hv2 .qhd{display:flex;justify-content:space-between;align-items:baseline;margin:20px 2px 8px}',
      '.hv2 .qhd b{font-size:18px;font-weight:800}',
      '.hv2 .qhd span{font-size:13px;color:var(--sub2);font-weight:600}',
      /* 시안 그대로 flex-start — 라이브는 카드 길이가 분마다 많이 달라(첫 전화 카드가 김) 줄 높이를
         <b>지금 보는 카드</b>에 맞춥니다(dots 가 넘길 때마다 맞춤) — 짧은 카드 밑에 큰 빈칸이 안 생깁니다 */
      '.hv2 .qrail{display:flex;align-items:flex-start;gap:10px;transition:height .2s;overflow-y:hidden;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding:0 0 4px}',
      '.hv2 .qrail::-webkit-scrollbar{display:none}',
      '.hv2 .qc{flex:none;width:calc(100% - 28px);scroll-snap-align:start;background:#fff;border-radius:22px;padding:18px}',
      '.hv2 .qc:only-child{width:100%}',
      '.hv2 .qtop{display:flex;align-items:center;gap:10px}',
      '.hv2 .av{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;flex:none;background:var(--blue-l);color:var(--blue)}',
      '.hv2 .qtop .nm{font-size:19px;font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.hv2 .qtop .sg{flex:none;font-size:13px;font-weight:700;color:var(--blue);background:var(--blue-l);border-radius:7px;padding:2px 8px;white-space:nowrap}',
      '.hv2 .qwhy{font-size:15px;color:var(--ink);margin:10px 0 0;line-height:1.5}',
      '.hv2 .qwhy small{display:block;font-size:13px;color:var(--sub2);margin-top:2px}',
      '.hv2 .qmsg{margin-top:12px;background:var(--bg);border-radius:14px;padding:12px 14px;font-size:15px;line-height:1.55;position:relative}',
      '.hv2 .qmsg .lb{font-size:13px;font-weight:700;color:var(--sub2);margin-bottom:3px;padding-right:56px}',
      '.hv2 .qmsg .tx{display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-line}',
      '.hv2 .qmsg .cp{position:absolute;right:8px;top:6px;height:44px;padding:0 12px;border-radius:10px;font-size:13px;font-weight:700;color:var(--blue)}',
      '.hv2 .qmsg.help ol{margin:6px 0 0;padding-left:20px}',
      '.hv2 .qmsg.help li{font-size:15px;line-height:1.5;margin:3px 0}',
      '.hv2 .hp-s{font-size:14px;color:var(--sub);line-height:1.5}',
      '.hv2 .hp-s b{color:var(--blue)}',
      '.hv2 .qta{display:grid;grid-template-columns:1.4fr 1fr;gap:6px;margin-top:8px}',
      '.hv2 .qta button{height:46px;border-radius:12px;background:var(--ink);color:#fff;font-size:15px;font-weight:700;text-align:center}',
      '.hv2 .qta button+button{background:var(--line2);color:var(--ink)}',
      '.hv2 .btn{display:flex;align-items:center;justify-content:center;gap:6px;height:52px;border-radius:14px;font-size:16px;font-weight:700;width:100%;text-align:center}',
      '.hv2 .btn.p{background:var(--blue);color:#fff}',
      '.hv2 .btn.g{background:var(--line2);color:var(--ink)}',
      '.hv2 .btn.sm{height:44px;font-size:15px;border-radius:12px}',
      '.hv2 .fl{font-size:13px;font-weight:700;color:var(--sub2);margin:10px 2px 4px}',
      '.hv2 .qres{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
      '.hv2 .qres button{min-height:48px;border-radius:12px;background:var(--line2);font-size:14px;font-weight:700;text-align:center}',
      '.hv2 .qres button.ok{background:var(--green-l);color:var(--green)}',
      '.hv2 .chtg{display:flex;align-items:center;gap:6px;margin-top:8px;flex-wrap:wrap}',
      '.hv2 .chtg button{height:44px;padding:0 14px;border-radius:12px;background:var(--line2);font-size:14px;font-weight:700;color:var(--sub2)}',
      '.hv2 .chtg button.on{background:var(--ink);color:#fff}',
      '.hv2 .qbtns{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}',
      '.hv2 .qbtns button{height:44px;border-radius:12px;background:var(--line2);font-size:14px;font-weight:700;text-align:center}',
      '.hv2 .qins{display:grid;grid-template-columns:1fr auto;gap:6px;margin-top:8px}',
      '.hv2 .qins .ins{display:grid;grid-template-columns:1fr auto;grid-template-areas:"k a" "p p";row-gap:2px;align-items:center;gap:2px 8px;min-height:52px;padding:8px 12px;border-radius:12px;background:var(--blue-l);text-align:left}',
      '.hv2 .qins .k{grid-area:k;font-size:14px;font-weight:800;color:var(--blue);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.hv2 .qins .a{grid-area:a;font-size:13px;font-weight:700;color:var(--blue);white-space:nowrap}',
      '.hv2 .qins .p{grid-area:p;font-size:14px;color:var(--ink);font-weight:600;line-height:1.35}',
      '.hv2 .qins .rc{min-height:52px;padding:0 14px;border-radius:12px;background:var(--line2);font-size:14px;font-weight:700;text-align:center}',
      '.hv2 .dots{display:flex;justify-content:center;gap:5px;margin-top:10px}',
      '.hv2 .dots i{width:6px;height:6px;border-radius:3px;background:#D1D6DB;transition:.2s}',
      '.hv2 .dots i.on{width:18px;background:var(--ink)}',
      '.hv2 .qempty{background:#fff;border-radius:22px;padding:22px 18px;text-align:center;font-size:15px;color:var(--sub)}',
      '.hv2 .qempty b{display:block;font-size:30px;margin-bottom:4px}',
      /* 🧭 이번 달 상품전략 */
      '.hv2 .insc{background:#fff;border-radius:20px;padding:14px 0 14px 16px;margin-top:12px}',
      '.hv2 .insc-h{display:flex;justify-content:space-between;align-items:center;padding-right:16px}',
      '.hv2 .insc-h b{font-size:16px}',
      '.hv2 .insc-h button{height:44px;font-size:14px;font-weight:700;color:var(--blue)}',
      '.hv2 .insc-r{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-right:16px;margin-top:4px}',
      '.hv2 .insc-r::-webkit-scrollbar{display:none}',
      '.hv2 .insc-r button{flex:none;width:150px;min-height:92px;border-radius:14px;background:var(--bg);padding:10px 12px;display:flex;flex-direction:column;gap:3px;text-align:left}',
      '.hv2 .insc-r b{font-size:15px}',
      '.hv2 .insc-r span{font-size:13px;color:var(--sub);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.hv2 .insc-r em{font-style:normal;font-size:13px;font-weight:800;color:var(--blue);margin-top:auto}',
      /* 이번 주 */
      '.hv2 .wkc{background:#fff;border-radius:20px;padding:14px 16px;margin-top:12px}',
      '.hv2 .wkd{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}',
      '.hv2 .wkd button{display:flex;flex-direction:column;align-items:center;gap:2px;min-height:56px;justify-content:center;border-radius:12px;font-size:13px;color:var(--sub2);text-align:center}',
      '.hv2 .wkd button b{font-size:15px;color:var(--ink)}',
      '.hv2 .wkd button i{width:5px;height:5px;border-radius:50%;background:transparent}',
      '.hv2 .wkd button i.y{background:var(--blue)}',
      '.hv2 .wkd button.on{background:var(--ink);color:#C9CED6}',
      '.hv2 .wkd button.on b{color:#fff}',
      '.hv2 .tl{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:14px}',
      '.hv2 .tl .t{font-weight:800;color:var(--blue);width:66px;flex:none}',
      '.hv2 .tl .x{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.hv2 .rtl{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:48px;margin-top:10px;padding:0 14px;border-radius:14px;background:var(--blue-l);color:var(--blue);font-size:14px;font-weight:700}',
      '.hv2 .row2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}',
      /* 영업 한 바퀴 */
      '.hv2 .sec{display:flex;justify-content:space-between;align-items:baseline;margin:20px 2px 0}',
      '.hv2 .sec b{font-size:17px;font-weight:800}',
      '.hv2 .sec small{font-size:13px;color:var(--sub2)}',
      '.hv2 .road2{display:grid;grid-template-columns:repeat(6,1fr);background:#fff;border-radius:18px;padding:6px;margin-top:8px}',
      '.hv2 .road2 button{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:56px;border-radius:12px;text-align:center;position:relative}',
      '.hv2 .road2 b{font-size:17px;font-weight:800}',
      '.hv2 .road2 span{font-size:13px;color:var(--sub2);white-space:nowrap}',
      '.hv2 .road2 button.hot b{color:var(--blue)}',
      '.hv2 .road2 button.hot::after{content:"";position:absolute;top:7px;right:9px;width:6px;height:6px;border-radius:50%;background:#F04452}',
      /* 🌙 · ☰ */
      '.hv2 .eve{display:flex;align-items:center;gap:12px;width:100%;background:#fff;border-radius:18px;padding:12px 16px;margin-top:12px;min-height:60px}',
      '.hv2 .eve .tx{flex:1;min-width:0}',
      '.hv2 .eve .t1{font-size:15px;font-weight:700}',
      '.hv2 .eve .t2{font-size:13px;color:var(--sub2)}',
      '.hv2 .tile{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;font-size:22px;background:var(--line2);flex:none}',
      '.hv2 .mm{display:flex;align-items:center;gap:10px;width:100%;background:#fff;border-radius:18px;padding:0 16px;min-height:56px;margin-top:12px}',
      '.hv2 .mm span:first-child{flex:1;font-size:15px;font-weight:800}',
      '.hv2 .mm small{font-size:13px;color:var(--sub2)}',
      '.hv2 .mm .ar,.hv2 .mmg .ar{transition:transform .2s}',
      '.hv2 .mmb{margin-top:6px}',
      '.hv2 .mmg{display:flex;align-items:center;gap:10px;width:100%;min-height:48px;padding:0 6px}',
      '.hv2 .mmg b{flex:1;font-size:15px}',
      '.hv2 .mmg small{font-size:13px;color:var(--sub2)}',
      '.hv2 .mmg.on .ar{transform:rotate(90deg)}',
      '.hv2 .list{background:#fff;border-radius:var(--r);padding:6px 0}',
      '.hv2 .li{display:flex;align-items:center;gap:12px;padding:12px 20px;min-height:56px;width:100%}',
      '.hv2 .li+.li{border-top:1px solid var(--line2)}',
      '.hv2 .li .tx{flex:1;min-width:0}',
      '.hv2 .li .t1{font-size:16px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.hv2 .li .t2{font-size:13px;color:var(--sub2);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.hv2 .li .e{font-size:20px;width:28px;text-align:center;flex:none}',
      '.hv2 .src{font-size:13px;color:var(--sub3);text-align:center;margin:14px 0 4px}',
      /* 시트 — 아래에서 올라오는 판 */
      '#hv2Dim{position:fixed;inset:0;background:rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:opacity .2s;z-index:9990}',
      '#hv2Dim.on{opacity:1;pointer-events:auto}',
      '#hv2Sheet{position:fixed;left:0;right:0;bottom:0;margin:0 auto;max-width:560px;background:#F2F4F6;border-radius:24px 24px 0 0;max-height:88vh;overflow-y:auto;' +
        'transform:translateY(102%);transition:transform .28s cubic-bezier(.2,.8,.2,1);z-index:9991;padding:10px 20px calc(24px + env(safe-area-inset-bottom,0px))}',
      '#hv2Sheet.on{transform:none}',
      '#hv2Sheet .grab{width:40px;height:5px;border-radius:3px;background:#D1D6DB;margin:0 auto 12px}',
      '#hv2Sheet h1{font-size:22px;font-weight:800;letter-spacing:-.4px;line-height:1.3;margin:6px 0 4px}',
      '#hv2Sheet .sub{font-size:14px;color:var(--sub2);font-weight:600}',
      '#hv2Sheet .say{background:#fff;border-radius:16px;padding:16px 18px;font-size:16px;line-height:1.6;white-space:pre-line;margin-top:10px}',
      '#hv2Sheet .hint{font-size:13px;color:var(--blue);background:var(--blue-l);border-radius:10px;padding:8px 10px;margin-top:10px}',
      '#hv2Sheet .btn{margin-top:8px}',
      '#hv2Sheet h2{font-size:16px;font-weight:800;margin:18px 2px 8px}'
    ];
    var st = d.createElement('style'); st.id = 'hmV2Css'; st.textContent = C.join('\n');
    d.head.appendChild(st);
  }

  /* ── 인사 줄 단추 (옛 홈 · index.html hmTossGreet 가 부릅니다) ───────────── */
  function chip() {
    if (!ALLOWED) return '';
    try { chipCss(); } catch (e) {}
    return on()
      ? '<button type="button" class="hm-v2-chip" onclick="homeV2Use(false)" title="예전 오늘 화면으로 돌아갑니다">↩ 예전 화면</button>'
      : '<button type="button" class="hm-v2-chip" onclick="homeV2Use(true)" title="시안 디자인의 새 오늘 화면 — 언제든 예전 화면으로 돌아갈 수 있습니다">✨ 새 화면</button>';
  }
  function chipCss() {
    var d = g.document;
    if (d.getElementById('hmV2ChipCss')) return;
    var st = d.createElement('style'); st.id = 'hmV2ChipCss';
    /* ⚠ 옛 홈 안이라 <b>목업 색표(ui.css 토큰)만</b> 씁니다 — #3182F6 을 썼다가 「목업에 없는 색 · 대비 3.7」 로 CI 셋이 잡았습니다 */
    st.textContent = '.hm-v2-chip{float:right;appearance:none;border:1px solid var(--t-line);background:var(--t-card);border-radius:999px;padding:4px 10px;min-height:30px;' +
      'font-family:inherit;font-size:13px;font-weight:800;color:var(--t-ink);cursor:pointer;letter-spacing:-.02em;margin-top:2px}';
    d.head.appendChild(st);
  }
  function use(v) {
    set(!!v); OLD = false;
    try { if (typeof g.toast === 'function') g.toast(v ? '✨ 새 오늘 화면입니다 — 맨 위 「↩ 예전 화면」 으로 언제든 돌아갑니다' : '↩ 예전 오늘 화면으로 돌아왔습니다'); } catch (e) {}
    try { if (typeof g.go === 'function') g.go('home'); } catch (e2) {}
  }

  /* ── 칸마다 — 라이브 함수에 묻기만 합니다 ─────────────────────────────── */
  function who() { return T(function () { return g.hwhoFor(); }, ''); }
  function hidden() { return T(function () { return !!g.hmNmHidden(); }, false); }
  function nameOf(x) {
    var n = T(function () { return g.hmFullNm(x.t); }, x && x.t) || '고객';
    n = String(n).replace(/님$/, '');
    if (hidden()) n = n.charAt(0) + '○○';
    return n;
  }
  function dayLabel() {
    var d = new Date(); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + '일월화수목금토'.charAt(d.getDay()) + '요일';
  }
  function topHtml() {
    return '<div class="top"><span class="day">' + E(dayLabel()) + '</span><div class="r">' +
      '<button type="button" class="nmbtn" onclick="HOME_V2.nm()">' + (hidden() ? '👁 이름 보기' : '🙈 이름 가리기') + '</button>' +
      '<button type="button" class="nmbtn bk" onclick="HOME_V2.use(false)">↩ 예전 화면</button></div></div>';
  }
  /* 👥 팀원 화면 그대로 보기 — 시안 who-strip(동그라미 한 줄 · 목표 고리).
     누가 내 팀인지·오늘 몇 건인지는 hwhoList 한 곳, 고르는 것은 hwhoSet 한 곳(옛 고르개와 같은 자 · 5번).
     고리 = 그 분 이번 달 실적/목표(PF.rows · monthly_perf). 목표가 없으면 주황 고리(시안 그대로) — 지어내지 않습니다. */
  function whoHtml() {
    if (!T(function () { return g.hwhoCan(); }, false)) return '';
    var L = T(function () { return g.hwhoList(); }, []) || [];
    if (L.length < 2) { var h0 = T(function () { return g.hwhoBarHtml(); }, ''); return h0 ? '<div class="whowrap">' + h0 + '</div>' : ''; }
    var cur = T(function () { return g.hwhoId(); }, ''), me = T(function () { return g.arMyId(); }, ''), all = T(function () { return g.hwhoIsAll(); }, false);
    var rows = T(function () { return g.PF.rows; }, []) || [], gp = {};
    rows.forEach(function (r) { if (r && r.owner_id) gp[r.owner_id] = { g: +r.goal_prem || 0, a: +r.act_prem || 0 }; });
    var C = 2 * Math.PI * 20;
    var ring = function (id, mid, on, lab, n) {
      var q = gp[id], p = (q && q.g) ? Math.min(1, q.a / q.g) : 0;
      return '<button type="button" class="' + (on ? 'on' : '') + '" onclick="hwhoSet(\'' + Q(id === me ? '' : id) + '\')"><div class="ring"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="20" fill="none" stroke="' + ((q && q.g) ? '#E5E8EB' : '#FFD8BF') + '" stroke-width="3"/>' +
        ((q && q.g) ? '<circle cx="22" cy="22" r="20" fill="none" stroke="#1A56DB" stroke-width="3" stroke-dasharray="' + (C * p) + ' ' + C + '" transform="rotate(-90 22 22)" stroke-linecap="round"/>' : '') + '</svg><span>' + E(mid) + '</span></div>' +
        E(lab) + (n != null ? '<small>' + n + '</small>' : '') + '</button>';
    };
    var h = '<div class="who-strip">';
    L.forEach(function (x) {
      var mine = x.id === me;
      h += ring(x.id, mine ? '나' : String(x.nm || '').charAt(0), mine ? ((!cur || cur === me) && !all) : cur === x.id, mine ? '내 화면' : (x.nm || '팀원'), x.n);
    });
    var A = T(function () { return g.HWHO_ALL; }, '');
    if (A) h += '<button type="button" class="' + (all ? 'on' : '') + '" onclick="hwhoSet(\'' + Q(A) + '\')"><div class="ring">🏢</div>팀 전체</button>';
    h += '</div>';
    if (cur && cur !== me) h += '<div class="whonote"><span>' + (all ? '🏢 팀 전체를 보고 있어요 — 내 것이 아니에요' : '👀 ' + E(T(function () { return g.hwhoName(cur); }, '팀원')) + '님 화면을 그대로 보고 있어요') + '</span><button type="button" onclick="hwhoMe()">← 내 화면</button></div>';
    return h;
  }
  function helloHtml(L) {
    var nm = T(function () { return g.OS.profile.name; }, '') || '설계사';
    var n = (L && L.list) ? L.list.length : 0;
    return '<div class="hello">' + E(nm) + '님, ' + (n ? '오늘 <b>' + n + '분</b> 남았어요' : '오늘 할 일 끝! 🎉') + '</div>';
  }
  /* 이번 달 목표 — monthly_perf(목표·실적, 만원) + 진행 중 예상(pexSum, 원 → 만원) */
  function monHtml() {
    var mo = (new Date().getMonth() + 1) + '월';
    var PF = g.PF || {};
    if (!PF.loaded) return '<button type="button" class="mon" onclick="HOME_V2.goal()"><div class="mt">' + mo + '</div><div class="mb"><div class="mn"><em class="n">목표를 읽는 중이에요</em></div><div class="mbar"></div></div><span class="ar">›</span></button>';
    var r = PF.mine || {}, goal = +r.goal_prem || 0, act = +r.act_prem || 0;
    var exp = Math.round((T(function () { return g.pexSum().live.won; }, 0) || 0) / 10000);
    if (!goal) return '<button type="button" class="mon" onclick="HOME_V2.goal()"><div class="mt">' + mo + '</div><div class="mb"><div class="mn"><em>목표가 아직 없어요</em> — 정하기</div><div class="mbar"></div></div><span class="ar">›</span></button>';
    var gap = goal - act - exp, top = Math.max(goal, act + exp) || 1;
    return '<button type="button" class="mon" onclick="HOME_V2.goal()"><div class="mt">' + mo + ' 목표</div><div class="mb"><div class="mn">' + act + ' / ' + goal + '만 · ' +
      (act >= goal ? '<em class="ok">넘었어요</em>' : gap > 0 ? '<em>이대로면 ' + gap + '만 모자라요</em>' : '<em class="ok">예상대로면 넘어요</em>') + '</div>' +
      '<div class="mbar"><i class="act" style="width:' + (act / top * 100) + '%"></i><i class="exp" style="width:' + (exp / top * 100) + '%"></i><span class="gl" style="left:' + Math.min(99.5, goal / top * 100) + '%"></span></div></div><span class="ar">›</span></button>';
  }
  /* 다섯 걸음 — 시안 그대로 영업 넷(연락 · 만남 · 정리 · 관리) + 📣 나를 알리기.
     영업 넷은 라이브 HM_WAY 와 같은 자(hmWayCall/Meet/Tidy/Care), 알리기는 아침 미션 ⑤
     「오늘 올릴 SNS 캐러셀」 체크(체크판 day · d10)와 같은 자입니다 — 새로 세지 않습니다(5번). */
  var WAY = [['📞', '연락', 'hmWayCall'], ['🤝', '만남', 'hmWayMeet'], ['✍️', '정리', 'hmWayTidy'], ['💌', '관리', 'hmWayCare']];
  var PROMO_CK = 'd10';
  function promoDone() { return !!T(function () { return g.hmMsCk()[PROMO_CK]; }, false); }
  function stepsHtml() {
    var now = T(function () { return g.hmWayNow(); }, 0), pd = promoDone();
    var cur = now === 4 ? 3 : (now === 3 ? -1 : now);
    if (cur < 0) cur = pd ? -1 : 4;
    var st = T(function () { return g.actStreak(); }, null);
    return '<div class="steps5">' + WAY.map(function (w, i) {
      var v = T(function () { return g[w[2]](); }, null);
      return '<button type="button" class="' + (i === cur ? 'cur' : '') + '" onclick="HOME_V2.step(' + i + ')"><span class="si">' + w[0] + '</span><span class="sl">' + w[1] + '</span><span class="sn">' + E(v == null ? '—' : v) + '</span></button>';
    }).join('') +
      '<button type="button" class="pr' + (pd ? ' done' : '') + (cur === 4 ? ' cur' : '') + '" onclick="HOME_V2.step(4)"><span class="si">📣</span><span class="sl">알리기</span><span class="sn">' + (pd ? '1/1' : '0/1') + '</span></button></div>' +
      (st && typeof st.n === 'number' ? '<div class="streak">쉬지 않고 일한 날 <b>연속 ' + st.n + '일</b></div>' : '');
  }
  /* 🛰 챙기는 중 — 끊기기 쉬운 자리: 약속이 지난 분 · 소개 여쭐 차례 · 이번 달 마디 */
  function jvData() {
    var w = who();
    return {
      late: T(function () { return g.arApptPast(w); }, []) || [],
      ref: T(function () { return g.hmReferRows(w); }, []) || [],
      madi: T(function () { return g.mstDueList().monLeft; }, 0) || 0
    };
  }
  function jvHtml() {
    var J = jvData(), n = J.late.length + J.ref.length + J.madi;
    return '<button type="button" class="jv" onclick="HOME_V2.jv()"><span class="jv-i">🛰</span><span class="jv-t"><b>자비스가 챙기는 중</b><small>' +
      (n ? '끊기기 쉬운 자리 ' + n + '곳' : '오늘은 다 챙겼어요') + ' · 약속 지난 분 ' + J.late.length + ' · 소개 차례 ' + J.ref.length + ' · 마디 ' + J.madi + '</small></span><span class="ar">›</span></button>';
  }
  /* 지금 이분 — 한 분 = 한 카드(옆으로 넘김) */
  function isCall(x) { return x && x.k === 'db' && /미접촉|TA|부재/.test(String(x.tk || '')); }
  function taDb(x) {
    var s = T(function () { return g.hmSrcOf(x); }, '') || (x && x.src) || '';
    var d = T(function () { return g.TA_OPENER.db(s); }, null);
    var th = d ? T(function () { return g.TA5.THEMES[d.theme]; }, null) : null;
    return { db: d, th: th, src: s };
  }
  function msgKey(x) { var L = T(function () { return g.HM_TAMSG.list(x); }, []) || []; return L[0] || ''; }
  function msgText(k, x, ch) { return k ? String(T(function () { return g.HM_TAMSG.text(k, x, ch || CH); }, '') || '') : ''; }
  function msgTitle(k) {
    var M = T(function () { return g.TA_MSG.MSG; }, []) || [], i;
    for (i = 0; i < M.length; i++) if (M[i].k === k) return M[i].t || '';
    return '';
  }
  function doorOf(x) {
    var P = T(function () { return g.HM_DOOR.pick(x); }, null) || {};
    var cat = (P.by === 'none') ? '' : (P.cat || '');
    var C = cat ? T(function () { return g.MK_TALK.CATS[cat]; }, null) : null;
    /* 상품은 hm-door.js 의 prods 한 곳 — 걱정을 모르면 그 자가 주는 「이번 달 1위」(HM_DOOR_TOP.top) */
    var p = (T(function () { return g.HM_DOOR.prods(cat); }, []) || [])[0] || null;
    return { cat: cat, band: P.band === '2030' ? 'y2030' : '', lab: C ? C.label : '이번 달 1위', prod: p ? ((p.co ? p.co + ' · ' : '') + p.nm) : '상품전략기에서 보기' };
  }
  function cardHtml(x, i) {
    var key = Q(x.key), nm = nameOf(x), stg = x.kt || T(function () { return g.hmOrdOf(x.k).t; }, '') || '';
    var why = T(function () { return g.hmWhy(x); }, '') || E(x.s || '');
    var h = '<div class="qc" data-i="' + i + '"><div class="qtop"><div class="av">' + E(nm.charAt(0)) + '</div><span class="nm">' + E(nm) + '님</span>' + (stg ? '<span class="sg">' + E(stg) + '</span>' : '') + '</div>';
    h += '<div class="qwhy">' + why + (x.s && why.indexOf(strip(x.s)) < 0 ? '<small>' + E(x.s) + '</small>' : '') + '</div>';
    var tel = T(function () { return g.hmTelOf(x); }, '');
    var callBtn = tel ? '<a class="btn p" style="margin-top:10px" href="tel:' + E(String(tel).replace(/[^0-9+]/g, '')) + '">📞 전화 걸기</a>'
                      : '<button type="button" class="btn p" style="margin-top:10px" onclick="hmOpen(\'' + key + '\')">📞 번호 보고 걸기</button>';
    if (isCall(x)) {
      var P = taDb(x), gain = (P.th && P.th.gain) || [];
      h += '<div class="qmsg help"><div class="lb">🙋 이분 상황 · 도와드릴 것</div><div class="hp-s">' +
        (P.db ? E(P.db.src) + (P.th && P.th.kw ? ' <b>' + E(strip(P.th.kw)) + '</b>' : '') + ' 신청' : '신청 경로를 몰라요' + (P.src ? ' (' + E(P.src) + ')' : '')) + '</div>' +
        (gain.length ? '<ol>' + gain.slice(0, 4).map(function (t) { return '<li>' + E(strip(t)) + '</li>'; }).join('') + '</ol>' : '') + '</div>';
      h += '<div class="qta"><button type="button" onclick="HOME_V2.ta(\'' + key + '\')">📜 TA 스크립트 바로</button><button type="button" onclick="go(\'ta_script\')">대본 한 장</button></div>';
      h += callBtn + '<div class="fl">끊고 나서 결과 하나만 — 카톡·다음 연락이 바로</div>' +
        '<div class="qres"><button type="button" class="ok" onclick="HOME_V2.res(\'' + key + '\',\'ok\')">🤝 약속 잡음</button><button type="button" onclick="HOME_V2.res(\'' + key + '\',\'hold\')">🤔 생각해 볼게요</button>' +
        '<button type="button" onclick="HOME_V2.res(\'' + key + '\',\'miss\')">📵 안 받음</button><button type="button" onclick="HOME_V2.res(\'' + key + '\',\'soft\')">🙅 거절</button></div>';
    } else {
      var k = msgKey(x), t = msgText(k, x);
      if (t) {
        var lab = T(function () { return g.HM_TAMSG.tag(x); }, '💬 보낼 문구') || '💬 보낼 문구';
        var tt = msgTitle(k);
        h += '<div class="qmsg"><div class="lb">' + E(lab) + (tt ? ' · ' + E(tt) : '') + '</div><div class="tx">' + E(t) + '</div>' +
          '<button type="button" class="cp" onclick="HOME_V2.copy(\'' + key + '\',\'' + Q(k) + '\')">복사</button></div>' +
          '<div class="chtg"><button type="button" class="' + (CH === 'kakao' ? 'on' : '') + '" onclick="HOME_V2.ch(\'kakao\')">카톡</button><button type="button" class="' + (CH === 'sms' ? 'on' : '') + '" onclick="HOME_V2.ch(\'sms\')">문자</button></div>';
        h += '<button type="button" class="btn p" style="margin-top:10px" onclick="HOME_V2.sent(\'' + key + '\',\'' + Q(k) + '\')">💬 복사하고 보냈어요</button>';
      } else {
        h += callBtn + '<button type="button" class="btn g sm" style="margin-top:8px" onclick="hmQfin(\'' + key + '\')">✅ 이분 끝</button>';
      }
    }
    h += '<div class="qbtns"><button type="button" onclick="HOME_V2.next(' + i + ')">다음 →</button><button type="button" onclick="hmSkip(\'' + key + '\')">오늘은 뒤로</button></div>';
    var D = doorOf(x);
    h += '<div class="qins"><button type="button" class="ins" onclick="hmDoorGo(\'' + Q(D.cat) + '\',\'' + D.band + '\')"><span class="k">🧭 ' + E(D.lab) + '</span><span class="a">상품전략기 ›</span><span class="p">' + E(D.prod) + '</span></button>' +
      '<button type="button" class="rc" onclick="hmOpen(\'' + key + '\')">이분 자세히</button></div>';
    return h + '</div>';
  }
  function railHtml(L) {
    var list = (L && L.list) || [], all = (L && L.all) || list.length;
    var h = '<div class="qhd"><b>지금 이분</b><span>' + (all - list.length) + ' / ' + all + (list.length > 1 ? ' · 옆으로 넘겨요' : '') + '</span></div>';
    if (!list.length) return h + '<div class="qempty"><b>🎉</b>오늘 볼 분을 다 챙겼어요</div>';
    h += '<div class="qrail" id="hv2Rail" onscroll="HOME_V2.dots()">' + list.map(cardHtml).join('') + '</div>';
    if (list.length > 1) h += '<div class="dots" id="hv2Dots">' + list.map(function (x, i) { return '<i class="' + (i === 0 ? 'on' : '') + '"></i>'; }).join('') + '</div>';
    return h;
  }
  /* 🧭 이번 달 상품전략 — 상황별 1위 상품(HM_DOOR_TOP) · 오늘 볼 분 중 맞는 분 */
  function inscHtml() {
    var tops = T(function () { return g.HM_DOOR_TOP.cats; }, null), CATS = T(function () { return g.MK_TALK.CATS; }, {}) || {};
    if (!tops) return '';
    var by = {}, S = T(function () { return g.hmSteps(); }, []) || [];
    S.forEach(function (x) { var D = doorOf(x); if (D.cat) by[D.cat] = (by[D.cat] || 0) + 1; });
    var ks = Object.keys(tops).filter(function (k) { return (tops[k] || []).length && CATS[k]; });
    ks.sort(function (a, b) { return (by[b] || 0) - (by[a] || 0); });
    var mo = T(function () { return (+g.HM_DOOR_TOP.month.slice(5)) + '월'; }, '이번 달');
    return '<div class="insc"><div class="insc-h"><b>🧭 ' + E(mo) + ' 상품전략</b><button type="button" onclick="hmDoorGo(\'\',\'\')">상품전략기 열기 ›</button></div><div class="insc-r">' +
      ks.map(function (k) { var p = tops[k][0]; return '<button type="button" onclick="hmDoorGo(\'' + Q(k) + '\',\'\')"><b>' + E(CATS[k].label) + '</b><span>' + E(p.nm) + '</span><em>' + (by[k] ? '오늘 볼 분 ' + by[k] + '명' : E(p.co || '')) + '</em></button>'; }).join('') +
      '</div></div>';
  }
  /* 이번 주 — 날을 누르면 그날 일정 · 오늘이면 동선 */
  function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function weekHtml() {
    var it = T(function () { return g.mcalItems(); }, null);
    if (!it) return '';
    var d = new Date(), dow = (d.getDay() + 6) % 7, mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow), W = '월화수목금토일', sel = (SEL == null) ? dow : SEL, i;
    var day = function (k) { return (T(function () { return g.mcalDay(it, k); }, []) || []).filter(function (z) { return z && z.k !== 'rt'; }); };
    var h = '<div class="wkc" id="hv2Week"><div class="wkd">', selKey = '';
    for (i = 0; i < 7; i++) {
      var dd = new Date(mon); dd.setDate(mon.getDate() + i);
      var k = ymd(dd), L = day(k), ap = L.some(function (z) { return z.k === 'appt'; });
      if (i === sel) selKey = k;
      h += '<button type="button" class="' + (i === sel ? 'on' : '') + '" onclick="HOME_V2.day(' + i + ')">' + W.charAt(i) + '<b>' + dd.getDate() + '</b><i class="' + (ap ? 'y' : '') + '"></i></button>';
    }
    h += '</div>';
    var SL = day(selKey), KO = { appt: '약속', next: '할 일', bd: '생일', touch: '연락', sig: '구실', madi: '마디' };
    h += SL.length ? SL.slice(0, 6).map(function (z) {
      var s = String(z.s || ''), tm = (s.match(/^\d{1,2}:\d{2}/) || [''])[0];
      var nm = z.t ? nameOf({ t: z.t }) + '님' : '';
      return '<div class="tl"><span class="t">' + E(tm || KO[z.k] || '일정') + '</span><span class="x">' + E([nm, s.replace(/^\d{1,2}:\d{2}\s*·?\s*/, '')].filter(Boolean).join(' · ')) + '</span></div>';
    }).join('') : '<div class="tl" style="color:var(--sub2)">이날은 일정이 없어요</div>';
    if (sel === dow) {
      var near = T(function () { return g.hmRtNear().length; }, null), R = route();
      var parts = [];
      if (R.km != null) parts.push('동선 ' + (R.km < 1 ? Math.round(R.km * 1000) + 'm' : R.km.toFixed(1) + 'km') + (R.real ? '' : '(어림)'));
      else parts.push('오늘 동선');
      if (R.n) parts.push('약속 ' + R.n + '곳');
      if (R.miss) parts.push('주소 모르는 곳 ' + R.miss);
      if (near != null) parts.push('가는 김에 들를 분 ' + near + '명');
      h += '<button type="button" class="rtl" onclick="hmRtOpen()"><span>📍 ' + E(parts.join(' · ')) + '</span><span>›</span></button>';
    }
    return h + '<div class="row2"><button type="button" class="btn g sm" onclick="go(\'mycal\')">＋ 일정</button><button type="button" class="btn g sm" onclick="go(\'mycal\')">📅 달력 크게</button></div></div>';
  }
  /* 영업 한 바퀴 — 배정 DB 단계별 몇 분(arStageN) · 오늘 볼 분이 있는 칸은 빨간 점 */
  var ROAD = [['첫 전화', ['미접촉', '부재']], ['연락', ['TA']], ['만남', ['AP']], ['제안', ['PC']], ['청약', ['CS']], ['관리', ['계약완료', '증권전달', '소개완료']]];
  function roadHtml() {
    var N = T(function () { return g.arStageN(who()); }, null);
    if (!N) return '';
    var S = T(function () { return g.hmSteps(); }, []) || [];
    return '<div class="sec"><b>영업 한 바퀴</b><small>칸을 누르면 DB 통합 CRM</small></div><div class="road2">' + ROAD.map(function (r) {
      var n = 0, hot = false;
      r[1].forEach(function (k) { n += (N.c[k] || 0); });
      S.forEach(function (x) { if (x.k === 'db' && r[1].indexOf(String(x.tk || '')) >= 0) hot = true; });
      return '<button type="button" class="' + (hot ? 'hot' : '') + '" onclick="go(\'crm\')"><b>' + n + '</b><span>' + r[0] + '</span></button>';
    }).join('') + '</div>';
  }
  function eveHtml(L) {
    var sub = T(function () { return g.hmNightSub(); }, '');
    var done = L ? ((L.all || 0) - ((L.list || []).length)) : 0;
    return '<button type="button" class="eve" onclick="HOME_V2.night()"><div class="tile">🌙</div><div class="tx"><div class="t1">오늘 돌아보기</div><div class="t2">' +
      E(strip(sub)) + ' · 끝낸 분 ' + done + '</div></div><span class="ar">›</span></button>';
  }
  /* ☰ 다른 메뉴 — 앱 메뉴 표(TABS) 그대로, 열 수 있는 것만 */
  function can(id) { return T(function () { return (typeof g.osTabAllowed !== 'function') || g.osTabAllowed(id); }, true); }
  function menuHtml() {
    var G = (T(function () { return g.TABS; }, []) || []).map(function (gr) {
      return { t: gr.group || '', items: (gr.items || []).filter(function (it) { return it && it.id && can(it.id); }) };
    }).filter(function (gr) { return gr.items.length; });
    var n = G.reduce(function (a, gr) { return a + gr.items.length; }, 0);
    var h = '<button type="button" class="mm" onclick="HOME_V2.menu()"><span>☰ 다른 메뉴 펼쳐 보기</span><small>' + n + '개</small><span class="ar" style="transform:rotate(' + (MOPEN ? 90 : 0) + 'deg)">›</span></button>';
    if (!MOPEN) return h;
    h += '<div class="mmb"><button type="button" class="mmg' + (OLD ? ' on' : '') + '" onclick="HOME_V2.old()"><b>📋 예전 오늘 칸 ' + (OLD ? '접기' : '아래에 펼치기') + '</b><small>아침 미션 · 30일 약속 · 상담현황 …</small><span class="ar">›</span></button>';
    G.forEach(function (gr, gi) {
      var o = !!MG[gi];
      h += '<button type="button" class="mmg' + (o ? ' on' : '') + '" onclick="HOME_V2.mg(' + gi + ')"><b>' + E(gr.t) + '</b><small>' + gr.items.length + '</small><span class="ar">›</span></button>';
      if (o) h += '<div class="list" style="margin:0 0 8px">' + gr.items.map(function (it) {
        return '<button type="button" class="li" onclick="go(\'' + Q(it.id) + '\')"><span class="e">' + E(it.icon || '•') + '</span><div class="tx"><div class="t1">' + E(it.title || it.id) + '</div></div><span class="ar">›</span></button>';
      }).join('') + '</div>';
    });
    return h + '</div>';
  }

  function html() {
    var L = T(function () { return g.hmLeft(); }, { list: [], all: 0 });
    return topHtml() + whoHtml() + helloHtml(L) + monHtml() + stepsHtml() + jvHtml() + railHtml(L) +
      inscHtml() + weekHtml() + roadHtml() + eveHtml(L) + menuHtml() +
      '<div class="src">새 오늘 화면 (시험) · 시안 9차 디자인 · 맨 위 「↩ 예전 화면」 으로 언제든 돌아갑니다</div>' + dockHtml();
  }
  /* 늘 떠 있는 세 칸 — 시안 .dock (🧭 상품전략 · 💬 화법 · 📚 공부). 가는 곳은 앱 메뉴 그대로:
     상품전략기(insight) · 미끼상품&접촉전략(mikki_talk · 대본) · 성장 로드맵(edu). 열 수 없는 칸은 안 세웁니다.
     ⚠ 오른쪽 아래 🎙·? 단추를 가리지 않게 오른쪽을 비워 둡니다. */
  /* 사장님 말씀 (2026-11-20) 「화법에는 재무설계 실전화법서 등이며, 보험마스터아카데미도 있어」 —
     칸 하나가 화면 하나로 가지 않고 <b>그 갈래 화면을 다 모은 판</b>을 엽니다(시안 openProd 처럼 아래에서 올라옴).
     ① 먼저 세울 것(손으로 고른 차례) ② 그 밖에 메뉴 표(TABS)에서 이름이 그 갈래인 것 — 새 화면이 생겨도 저절로 들어옵니다.
     열 수 없는 화면은 안 세웁니다. 이름·그림은 메뉴 표 그대로(여기 안 적음 · 5번). */
  var DOCK = {
    prod:  { e: '🧭', t: '상품전략', h: '이번 달 무엇을 들고 갈지', ids: ['insight', 'mikki_talk', 'mikki'], re: /상품전략|미끼|보험사 전산|상품 비교|보험료비교/ },
    talk:  { e: '💬', t: '화법', h: '전화 · 만남 · 거절 · 재무설계에서 할 말', ids: ['mikki_talk', 'fp_talk', 'ta_script', 'ta_say', 'rej_gym'], re: /화법|대본|거절|스크립트|멘트|상담자료/ },
    study: { e: '📚', t: '공부', h: '배우고 익히는 곳', ids: ['bohum', 'edu', 'academy', 'ta_train', 'bcd_lec', 'jiin_grow', 'educal', 'growboard'], re: /아카데미|교육|강의|공부|성장|교재|시험|사전/ }
  };
  function dockItems(k) {
    var D = DOCK[k], out = [], seen = {}, it;
    var add = function (it) { if (it && it.id && !seen[it.id] && can(it.id)) { seen[it.id] = 1; out.push(it); } };
    var of = function (id) { return T(function () { return g.navItemOf(id); }, null); };
    D.ids.forEach(function (id) { add(of(id)); });
    (T(function () { return g.TABS; }, []) || []).forEach(function (gr) { (gr.items || []).forEach(function (x) { if (D.re.test(String(x.title || ''))) add(x); }); });
    return out;
  }
  function dockHtml() {
    var K = ['prod', 'talk', 'study'].filter(function (k) { return dockItems(k).length; });
    if (!K.length) return '';
    return '<div class="dock" style="grid-template-columns:repeat(' + K.length + ',1fr)">' + K.map(function (k) {
      return '<button type="button" onclick="HOME_V2.dock(\'' + k + '\')"><span class="e">' + DOCK[k].e + '</span>' + DOCK[k].t + '</button>';
    }).join('') + '</div>';
  }

  /* 📍 <b>오늘 동선 거리</b> — 사장님 말씀 (2026-11-20) 「동선거리는 재지않고 있다면 해결해야지」.
     ★ 자리(좌표)는 지역 동선(apex-route.js)이 서버 dbs 에 적어 둔 그것 — 약속 장소(next_appt_lat/lng)가
       있으면 그것, 없으면 주소(lat/lng). 홈의 AR.db 에는 좌표 칸이 없어 <b>오늘 약속인 분만</b> 한 번 읽습니다.
     ★ 거리는 지역 동선과 <b>같은 자</b> — 카카오 길찾기로 재 둔 구간(이 기기 apexRouteKmV1)이 있으면 그것,
       없는 구간은 그 화면이 쓰는 서버 길찾기(/.netlify/functions/route-km)에 한 번 묻고 같은 곳에 적습니다.
       길찾기를 못 쓰면 지역 동선과 같은 어림(직선 × 1.35)이고 화면에 「(어림)」 이라고 적습니다 (1번).
     ★ 좌표가 없는 곳은 지어내지 않고 「주소 모르는 곳 N」 으로 적습니다. 약속이 시간 차례로 둘 이상일 때만 잽니다. */
  var GEO = {}, GEO_ASKED = {}, GEO_OFF = false, RK_ASKED = {}, RK_OFF = false;
  function rkKey(a, b) { return [a.lat, a.lng, b.lat, b.lng].map(function (v) { return (+v).toFixed(4); }).join(','); }
  function rkCache() { try { return JSON.parse(g.localStorage.getItem('apexRouteKmV1') || '{}') || {}; } catch (e) { return {}; } }
  function hav(a, b) {
    var R = 6371, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lng - a.lng) * r;
    var x = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function ptOf(d) {
    if (!d) return null;
    if (d.next_appt_lat && d.next_appt_lng) return { lat: +d.next_appt_lat, lng: +d.next_appt_lng };
    if (d.lat && d.lng) return { lat: +d.lat, lng: +d.lng };
    return null;
  }
  function geoLoad(ids) {
    var need = ids.filter(function (id) { return !GEO_ASKED[id]; });
    if (GEO_OFF || !need.length) return;
    need.forEach(function (id) { GEO_ASKED[id] = 1; });
    var sb = T(function () { return g.osClient(); }, null);
    if (!sb) return;
    try {
      sb.from('dbs').select('id,lat,lng,next_appt_lat,next_appt_lng').in('id', need).then(function (r) {
        if (r && r.error) { GEO_OFF = true; return; }       /* 좌표 칸이 없는 서버(migration_46 전) — 조용히 물러남 */
        ((r && r.data) || []).forEach(function (d) { GEO[d.id] = d; });
        paint();
      }, function () { GEO_OFF = true; });
    } catch (e) { GEO_OFF = true; }
  }
  function rkAsk(pairs) {
    var key = pairs.map(function (p) { return rkKey(p.a, p.b); }).join('|');
    if (RK_OFF || RK_ASKED[key] || typeof g.fetch !== 'function') return;
    RK_ASKED[key] = 1;
    g.fetch('/.netlify/functions/route-km', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ legs: pairs.map(function (p) { return { ox: p.a.lng, oy: p.a.lat, dx: p.b.lng, dy: p.b.lat }; }) }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok) { RK_OFF = true; return; }
        var C = rkCache();
        (j.legs || []).forEach(function (v, i) { if (v && v.km != null) C[rkKey(pairs[i].a, pairs[i].b)] = { km: v.km, min: v.min }; });
        try { g.localStorage.setItem('apexRouteKmV1', JSON.stringify(C)); } catch (e) {}
        paint();
      }).catch(function () { RK_OFF = true; });
  }
  function route() {
    var A = T(function () { return g.hmRtAppts(); }, []) || [];
    var out = { n: A.length, miss: 0, km: null, real: false };
    if (!A.length) return out;
    geoLoad(A.map(function (a) { return a.id; }));
    var P = [];
    A.forEach(function (a) { var p = ptOf(GEO[a.id]); if (p) P.push(p); else if (GEO[a.id] || GEO_OFF) out.miss++; });
    if (P.length < 2) return out;
    var C = rkCache(), km = 0, real = true, ask = [];
    for (var i = 1; i < P.length; i++) {
      var w = C[rkKey(P[i - 1], P[i])];
      if (w && w.km != null) km += +w.km;
      else { km += hav(P[i - 1], P[i]) * 1.35; real = false; ask.push({ a: P[i - 1], b: P[i] }); }
    }
    if (ask.length) rkAsk(ask);
    out.km = km; out.real = real;
    return out;
  }

  /* ── 그리기 ─────────────────────────────────────────────────────── */
  function paint() {
    var box = el('hv2'); if (!box) return;
    var r = el('hv2Rail'), l = r ? r.scrollLeft : 0;
    try { box.innerHTML = html(); }
    catch (e) { fallback(e); return; }
    var r2 = el('hv2Rail'); if (r2 && l) r2.scrollLeft = l;
    dots();
  }
  function fallback() {
    try { var p = g.document.querySelector('.tab-pane.hm-toss'); if (p) p.classList.remove('hm-v2', 'hm-v2-old'); var b = el('hv2'); if (b) b.parentNode.removeChild(b); } catch (e2) {}
    try { if (typeof g.toast === 'function') g.toast('새 오늘 화면을 못 세워 예전 화면으로 보여 드립니다'); } catch (e3) {}
  }
  /* 홈을 그린 바로 뒤 — go('home') 이 부릅니다. 꺼져 있으면 아무것도 안 합니다. */
  function apply(dyn) {
    fromUrl();
    if (!on()) return false;
    var d = g.document, p = (dyn || d).querySelector('.tab-pane.hm-toss');
    if (!p || !d.getElementById('hmJobHost')) return false;       /* 로그인 전·어긋난 판 — 예전 화면 그대로 */
    try {
      css();
      var box = d.createElement('div'); box.id = 'hv2'; box.className = 'hv2';
      p.insertBefore(box, p.firstChild);
      p.classList.add('hm-v2');
      p.classList.toggle('hm-v2-old', OLD);
      box.innerHTML = html();
      dots();
      goalLoad();
      return true;
    } catch (e) { fallback(e); return false; }
  }
  /* 목표 — 기존 읽기(pfLoad) 를 한 번만 부르고, 다 읽으면 그 칸을 다시 그립니다 */
  function goalLoad() {
    var PF = g.PF; if (!PF || PF.loaded || typeof g.pfLoad !== 'function') return;
    if (!PF.loading) { try { g.pfLoad(); } catch (e) { return; } }
    if (GOAL_TRY) return;
    GOAL_TRY = 1;
    var n = 0, t = setInterval(function () { n++; if ((g.PF && g.PF.loaded) || n > 40) { clearInterval(t); GOAL_TRY = 0; paint(); } }, 500);
  }

  /* ── 시트 ───────────────────────────────────────────────────────── */
  function sheet(inner) {
    var d = g.document; css();
    var dim = el('hv2Dim'), sh = el('hv2Sheet');
    if (!dim) { dim = d.createElement('div'); dim.id = 'hv2Dim'; dim.onclick = close; d.body.appendChild(dim); }
    if (!sh) { sh = d.createElement('div'); sh.id = 'hv2Sheet'; sh.className = 'hv2'; d.body.appendChild(sh); }
    sh.innerHTML = '<div class="grab"></div>' + inner;
    sh.scrollTop = 0;
    setTimeout(function () { dim.classList.add('on'); sh.classList.add('on'); }, 10);
  }
  function close() { var a = el('hv2Dim'), b = el('hv2Sheet'); if (a) a.classList.remove('on'); if (b) b.classList.remove('on'); }

  /* ── 누르면 — 기존 함수를 부르기만 ─────────────────────────────────── */
  function rowOf(key) { return T(function () { return g.hmStepOf(key); }, null); }
  function copyT(t) { if (!t) return; try { if (typeof g.copyText === 'function') g.copyText(t); } catch (e) {} }
  var RES = { ok: '🤝 약속 잡음', hold: '🤔 생각해 볼게요', miss: '📵 안 받음', soft: '🙅 거절' };
  var API = {
    on: on, set: set, use: use, chip: chip, apply: apply, paint: paint, close: close, allowed: function () { return ALLOWED; }, KEY: KEY,
    nm: function () { try { g.hmNmToggle(); } catch (e) {} paint(); },
    goal: function () { try { g.arGoCat('perf'); } catch (e) {} try { g.go('airep'); } catch (e2) {} },
    step: function (i) {
      if (i === 0) { var r = el('hv2Rail') || el('hv2'); if (r) r.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      if (i === 1) { var w = el('hv2Week'); if (w) w.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      if (i === 2) { API.jv(); return; }
      if (i === 3) { try { g.go('clients'); } catch (e) {} return; }
      API.promo();
    },
    /* 📣 알리기 — 아침 미션 ⑤ 와 같은 체크(hmMsDid) · 만드는 곳은 콘텐츠 허브 */
    promo: function () {
      var pd = promoDone();
      sheet('<h1>📣 오늘 나를 알리기</h1><div class="sub">아침 미션 ⑤ 「오늘 올릴 SNS 캐러셀」 과 같은 체크예요</div>' +
        '<div class="say">' + (pd ? '오늘은 올렸어요 👏' : '오늘의 뉴스로 카드 한 장 만들어 올리기') + '</div>' +
        '<button type="button" class="btn p" onclick="HOME_V2.close();go(\'content\')">🖼 카드 만들러 가기</button>' +
        (pd ? '' : '<button type="button" class="btn g" onclick="HOME_V2.promoOk()">✓ 올렸어요</button>'));
    },
    promoOk: function () { try { g.hmMsDid(PROMO_CK); } catch (e) {} close(); paint(); },
    /* 아래 세 칸 — 그 갈래 화면을 다 모은 판 */
    dock: function (k) {
      var D = DOCK[k]; if (!D) return;
      var L = dockItems(k);
      var desc = function (id) { return strip(T(function () { var m = g.TAB_META[id]; return m && (m.desc || m.d || m.s); }, '') || ''); };
      sheet('<h1>' + D.e + ' ' + E(D.t) + '</h1><div class="sub">' + E(D.h) + ' · ' + L.length + '곳</div>' +
        (k === 'prod' ? inscHtml() : '') +
        '<div class="list" style="margin-top:12px">' + L.map(function (it) {
          var d = desc(it.id);
          return '<button type="button" class="li" onclick="HOME_V2.close();go(\'' + Q(it.id) + '\')"><span class="e">' + E(it.icon || '•') + '</span><div class="tx"><div class="t1">' + E(it.title || it.id) + '</div>' +
            (d ? '<div class="t2">' + E(d) + '</div>' : '') + '</div><span class="ar">›</span></button>';
        }).join('') + '</div>');
    },
    jv: function () {
      var J = jvData();
      var row = function (x, w) { return '<button type="button" class="li" onclick="HOME_V2.close();hmRtPerson(\'' + Q(x.id) + '\')"><span class="e">' + w + '</span><div class="tx"><div class="t1">' + E(nameOf({ t: x.name || x.t || '' })) + '님</div><div class="t2">' + E(x.stage || '') + '</div></div><span class="ar">›</span></button>'; };
      sheet('<h1>🛰 자비스가 챙기는 중</h1><div class="sub">고객이 중간에 끊기기 쉬운 자리예요</div>' +
        '<h2>🕗 약속 날짜가 지난 분 ' + J.late.length + '</h2><div class="list">' + (J.late.length ? J.late.map(function (x) { return row(x, '🕗'); }).join('') : '<div class="li"><div class="tx"><div class="t2">없어요</div></div></div>') + '</div>' +
        '<h2>💬 소개 여쭐 차례 ' + J.ref.length + '</h2><div class="list">' + (J.ref.length ? J.ref.map(function (x) { return row(x, '💬'); }).join('') : '<div class="li"><div class="tx"><div class="t2">없어요</div></div></div>') + '</div>' +
        '<h2>💌 이번 달 보낼 마디 ' + J.madi + '</h2><button type="button" class="btn g" onclick="HOME_V2.close();go(\'clients\')">고객 365일에서 보기</button>');
    },
    ta: function (key) { try { g.HM_TAMSG.openTa(key); } catch (e) { try { g.go('ta_script'); } catch (e2) {} } },
    res: function (key, k) {
      var x = rowOf(key); if (!x) return;
      var t = msgText(k, x, 'kakao'), M = (T(function () { return g.TA_MSG.MSG; }, []) || []).filter(function (m) { return m.k === k; })[0] || {};
      sheet('<div class="sub">' + E(nameOf(x)) + '님 통화 결과</div><h1>' + E(RES[k] || M.t || '') + '</h1>' +
        (M.note ? '<div class="hint">' + E(strip(M.note)) + '</div>' : '') +
        (k === 'ok' ? '<div class="hint" style="color:#C2410C;background:#FFF1E6">📅 날짜·시간·장소는 「이분 한 장」 에서 약속을 적은 뒤 맞춰 보내세요 — 아래 글의 날짜는 아직 정해지지 않은 자리예요</div>' : '') +
        /* 「○○지역」 이 남으면 그 자리에서 담당 지역을 적습니다 — TA 스크립트와 같은 칸(HM_TAMSG.setArea · 이 기기) */
        (t && t.indexOf('○○지역') >= 0 ? '<div class="hint">📍 담당 지역이 비어 「○○지역」 으로 나가요 — <input id="hv2Area" maxlength="30" placeholder="예: 순천" style="width:110px;height:36px;border:1px solid #D1D6DB;border-radius:8px;padding:0 8px;font-size:16px">' +
          ' <button type="button" style="height:36px;padding:0 10px;border-radius:8px;background:#1A56DB;color:#fff;font-weight:700" onclick="HOME_V2.area(\'' + Q(key) + '\',\'' + Q(k) + '\')">적기</button></div>' : '') +
        (t ? '<div class="say">' + E(t) + '</div>' : '<div class="say">TA 스크립트에 이 결과의 카톡이 없어요</div>') +
        (t ? '<button type="button" class="btn g" onclick="HOME_V2.copyRaw(\'' + Q(key) + '\',\'' + Q(k) + '\')">📋 카톡 복사</button>' : '') +
        (k === 'ok' ? '<button type="button" class="btn p" onclick="HOME_V2.copyRaw(\'' + Q(key) + '\',\'ok\');HOME_V2.close();hmOpen(\'' + Q(key) + '\')">복사하고 약속 날짜 적으러 (이분 한 장)</button>' :
          '<button type="button" class="btn p" onclick="HOME_V2.copyRaw(\'' + Q(key) + '\',\'' + Q(k) + '\');HOME_V2.close();hmQfin(\'' + Q(key) + '\')">' + (t ? '복사하고 ' : '') + '이분 끝 · 다음 분으로</button>'));
    },
    area: function (key, k) {
      var i = el('hv2Area'), v = i ? String(i.value || '').trim() : '';
      if (!v) return;
      try { g.HM_TAMSG.setArea(v); } catch (e) {}
      API.res(key, k);
    },
    copyRaw: function (key, k) { var x = rowOf(key); if (x) copyT(msgText(k, x, 'kakao')); },
    copy: function (key, k) { var x = rowOf(key); if (x) copyT(msgText(k, x)); },
    sent: function (key, k) { API.copy(key, k); try { g.hmQfin(key); } catch (e) {} },
    ch: function (c) { CH = c; try { g.HM_TAMSG.setCh(c); } catch (e) {} paint(); },
    next: function (i) { var r = el('hv2Rail'); if (!r || !r.children.length) return; var n = r.children[(i + 1) % r.children.length]; r.scrollTo({ left: n.offsetLeft - r.offsetLeft, behavior: 'smooth' }); },
    dots: dots,
    day: function (i) { SEL = i; paint(); },
    night: function () { var h = T(function () { return g.hmNightHtml(); }, ''); sheet('<h1>🌙 오늘 돌아보기</h1><div class="sub">' + E(strip(T(function () { return g.hmNightSub(); }, ''))) + '</div><div style="margin-top:12px">' + (h || '<div class="say">아직 적을 것이 없어요</div>') + '</div>'); },
    menu: function () { MOPEN = !MOPEN; paint(); },
    mg: function (i) { MG[i] = !MG[i]; paint(); },
    old: function () {
      OLD = !OLD;
      var p = g.document.querySelector('.tab-pane.hm-toss.hm-v2'); if (p) p.classList.toggle('hm-v2-old', OLD);
      paint();
      if (OLD) { var b = el('hv2'); if (b && b.nextElementSibling) b.nextElementSibling.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }
  };
  function dots() {
    var r = el('hv2Rail'); if (!r || !r.children.length) return;
    var w = r.children[0].offsetWidth + 10, i = Math.round(r.scrollLeft / (w || 1)), d = el('hv2Dots');
    i = Math.max(0, Math.min(r.children.length - 1, i));
    if (d) [].forEach.call(d.children, function (e, k) { e.classList.toggle('on', k === i); });
    /* 줄 높이 = 지금 보는 카드 (+ 아래 그림자 몫 4px) */
    var c = r.children[i]; if (c && c.offsetHeight) r.style.height = (c.offsetHeight + 4) + 'px';
  }
  g.HOME_V2 = API;
  /* 옛 홈 단추가 부르는 이름 — 점(.) 없는 함수여야 check-hmclick 이 「부르는 함수가 있다」 고 읽습니다 */
  g.homeV2Use = use;
})(window);
