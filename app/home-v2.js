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
      '.hv2 .hello{display:flex;align-items:center;justify-content:space-between;gap:10px}',
      '.hv2 .mebtn{flex:none;width:44px;height:44px;border-radius:50%;background:#fff;font-size:21px;text-align:center}',
      '.hv2 .hello .hb{flex:none;display:flex;gap:6px}',
      '.hv2 .tmall{display:flex;justify-content:space-between;align-items:center;width:100%;min-height:44px;margin:-4px 0 12px;padding:0 14px;border-radius:14px;background:#fff;font-size:14px;font-weight:700;color:var(--ink)}',
      '.hv2 .tmall span{color:#B0B8C1;font-size:18px}',
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
      '.hv2 .mis{background:#fff;border-radius:var(--r);padding:16px 14px 8px;margin-top:10px}',
      '.hv2 .mis.all{background:var(--green-l)}',
      '.hv2 .mis-h{display:flex;align-items:baseline;justify-content:space-between;padding:0 4px}',
      '.hv2 .mis-h b{font-size:18px;font-weight:800}.hv2 .mis-h span{font-size:15px;font-weight:800;color:var(--blue)}',
      '.hv2 .mis-bar{height:6px;border-radius:3px;background:var(--line2);margin:10px 4px 6px;overflow:hidden}.hv2 .mis-bar i{display:block;height:100%;background:var(--blue);border-radius:3px}',
      '.hv2 .mis.all .mis-bar i{background:var(--green)}',
      '.hv2 .mis-ok{font-size:15px;font-weight:800;color:var(--green);padding:4px 4px 6px}',
      '.hv2 .mis-r{display:flex;align-items:center;gap:12px;width:100%;min-height:58px;padding:8px 4px;text-align:left}',
      '.hv2 .mis-r+.mis-r{border-top:1px solid var(--line2)}',
      '.hv2 .mis-c{flex:none;width:36px;height:36px;border-radius:18px;background:var(--line2);display:flex;align-items:center;justify-content:center;font-size:18px}',
      '.hv2 .mis-r.done .mis-c{background:var(--green);color:#fff;font-weight:800}',
      '.hv2 .mis-t{flex:1;min-width:0;display:flex;flex-direction:column}.hv2 .mis-t b{font-size:16px;font-weight:700}',
      '.hv2 .mis-t small{font-size:13px;color:var(--sub2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.hv2 .mis-r.done .mis-t b{color:var(--sub2);text-decoration:line-through}',
      '#hv2Sheet .mis-s{padding:14px 16px}#hv2Sheet .mis-s+.mis-s{border-top:1px solid var(--line2)}',
      '#hv2Sheet .mis-s1{display:flex;gap:10px;align-items:flex-start}#hv2Sheet .mis-s1 .e{font-size:20px;line-height:1.3}',
      '#hv2Sheet .mis-s1 b{display:block;font-size:16px;font-weight:700}#hv2Sheet .mis-s1 small{display:block;font-size:13px;color:var(--sub2);margin-top:2px}',
      '#hv2Sheet .mis-s2{display:flex;gap:8px;align-items:center;margin:10px 0 0 30px}',
      '#hv2Sheet .mis-b{flex:none;height:40px;padding:0 14px;border-radius:10px;background:var(--blue);color:#fff;font-size:14px;font-weight:700}',
      '#hv2Sheet .mis-b.g{background:var(--line2);color:var(--ink)}',
      '#hv2Sheet .mis-go{flex:none;height:40px;padding:0 10px;font-size:14px;font-weight:700;color:var(--blue)}',
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
      /* ⚠ 판 X510 — 마지막 카드는 「끝에 맞춰」 멈춥니다. 시안처럼 카드 폭이 「100% - 28px」 라 마지막 카드의 왼쪽 끝은
           스크롤 끝보다 멀어 멈출 자리가 없었고, 넘기면 두 번째 카드로 튕겨 돌아왔습니다(라이브에서 넘겨 보고 찾음). */
      '.hv2 .qc:last-child:not(:only-child){scroll-snap-align:end}',
      '.hv2 .qtop{display:flex;align-items:center;gap:10px}',
      '.hv2 .av{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;flex:none;background:var(--blue-l);color:var(--blue)}',
      '.hv2 .qtop .nm{font-size:19px;font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.hv2 .qtop .amt{flex:none;margin-left:auto;height:32px;padding:0 10px;border-radius:8px;font-size:13px;font-weight:700;background:var(--blue-l);color:var(--blue);white-space:nowrap}',
      '.hv2 .qtop .amt.miss{background:var(--warn-l);color:var(--warn)}',
      '.hv2 .btn.ok{background:var(--green-l);color:var(--green);margin-top:8px}',
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
      /* 판 X529 — 시안 qCard 의 「오늘 소식」 · 「🙋 물어볼 것」 */
      '.hv2 .qnews{display:flex;align-items:center;gap:8px;width:100%;min-height:44px;margin-top:8px;padding:8px 12px;border-radius:12px;background:var(--bg);font-size:14px;text-align:left}',
      '.hv2 .qnews b{flex:none;font-size:13px;font-weight:800;color:var(--blue)}',
      '.hv2 .qnews span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink);font-weight:600}',
      '.hv2 .qnews i{flex:none;font-style:normal;font-size:13px;font-weight:700;color:var(--sub2)}',
      '.hv2 .qask{margin-top:8px;padding:10px 12px;border-radius:12px;background:var(--warn-l)}',
      '.hv2 .qask .q{font-size:14px;font-weight:700;color:var(--ink);line-height:1.45}',
      '.hv2 .qask .t-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}',
      /* 판 X532 — 🧰 이분께 맞는 도구 */
      '.hv2 .qtools{margin-top:8px}',
      '.hv2 .qtools .lb{display:flex;align-items:center;gap:4px;flex-wrap:wrap}.hv2 .qtools .cfx{margin-left:auto;font-size:13px;font-weight:700;color:var(--blue);padding:2px 4px}',
      '.hv2 .qsit{display:flex;align-items:center;gap:8px;margin-top:10px;padding:10px 12px;border-radius:12px;background:#F9FAFB}',
      '.hv2 .qsit .k{font-size:13px;font-weight:700;color:var(--sub2)}.hv2 .qsit b{font-size:15px;font-weight:800}.hv2 .qsit .no{font-size:14px;color:var(--sub3)}',
      '.hv2 .qsit button{margin-left:auto;height:32px;padding:0 12px;border-radius:8px;background:#fff;border:1px solid var(--line);font-size:13px;font-weight:700;color:var(--blue)}',
      '.hv2 .qtools .lb{font-size:13px;font-weight:700;color:var(--sub2)}',
      '.hv2 .qtools .lb small{font-weight:600;color:var(--sub3);margin-left:4px}',
      '.hv2 .qtools .tc{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px}',
      '.hv2 .qtools .tc button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:64px;padding:6px 4px;border-radius:12px;background:var(--blue-l);color:var(--blue);font-size:13px;font-weight:700;line-height:1.3;text-align:center;word-break:keep-all}',
      '.hv2 .qtools .tc button i{font-style:normal;font-size:20px;line-height:1}',
      '.hv2 .qtools .tc button span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.hv2 .qask .t-chip{min-height:44px;height:auto;padding:0 12px;border:0;border-radius:22px;background:#fff;font-size:14px;font-weight:700;color:var(--ink);text-align:center}',
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
      /* 📍 오늘 동선 카드 · 시트 (시안 4차 routeCard · openRoute) */
      '.hv2 .rtc{display:flex;align-items:center;gap:12px;width:100%;background:#fff;border-radius:var(--r);padding:14px 16px;margin-top:10px;min-height:72px;text-align:left}',
      '.hv2 .rtc .tile{background:var(--blue-l)}',
      '.hv2 .rtc .tx{flex:1;min-width:0}',
      '.hv2 .rtc .t1{font-size:16px;font-weight:700;line-height:1.35}',
      '.hv2 .rtc .t2{font-size:13px;color:var(--sub2);margin-top:2px}',
      '.hv2 .rtc .ar{color:#B0B8C1;font-size:18px}',
      '.hv2 .mapsvg{display:block;width:100%;height:auto;margin-top:12px}',
      '.hv2 .mapnote{font-size:13px;color:var(--sub3);margin:6px 2px 0}',
      '.hv2 .tile.no{background:var(--blue);color:#fff;font-weight:800;font-size:16px}',
      '.hv2 .tile.w{background:var(--warn-l)}',
      /* 📅 일정 넣기 시트 */
      '#hv2Sheet .seg2{display:grid;grid-template-columns:1fr 1fr;gap:4px;background:#E5E8EB;border-radius:14px;padding:4px;margin-top:10px}',
      '#hv2Sheet .seg2 button{height:44px;border-radius:11px;font-size:15px;font-weight:700;color:var(--sub);text-align:center}',
      '#hv2Sheet .seg2 button.on{background:#fff;color:var(--ink)}',
      '#hv2Sheet .chipr{display:flex;gap:6px;flex-wrap:wrap}',
      '#hv2Sheet .jvw{flex:none;min-width:58px;height:28px;padding:0 8px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;background:var(--line2);color:var(--sub2)}',
      '#hv2Sheet .jvw.on{background:var(--warn-l);color:var(--warn)}',
      '#hv2Sheet .jvnote{background:#fff;border-radius:16px;padding:12px 14px;margin-top:12px;font-size:14px;color:var(--sub);line-height:1.6}',
      '#hv2Sheet .chipr button,#hv2Sheet .chipr .pick{position:relative;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;min-width:64px;height:52px;padding:0 12px;border-radius:14px;background:#fff;font-size:15px;font-weight:700;color:var(--ink);text-align:center;overflow:hidden}',
      '#hv2Sheet .chipr small{font-size:12px;font-weight:600;color:var(--sub2)}',
      '#hv2Sheet .chipr button.on{background:var(--ink);color:#fff}',
      '#hv2Sheet .chipr button.on small{color:#D1D6DB}',
      '#hv2Sheet .chipr .pick input{position:absolute;inset:0;opacity:0;width:100%;height:100%;font-size:16px}',
      '#hv2Sheet .sch-in{display:block;width:100%;height:52px;border:0;border-radius:14px;background:#fff;padding:0 14px;font:inherit;font-size:16px;color:var(--ink)}',
      '#hv2Sheet .sch-ok{display:flex;flex-direction:column;gap:4px;background:var(--green-l);border-radius:16px;padding:16px;margin-top:10px}',
      '#hv2Sheet .sch-ok b{color:var(--green);font-size:17px}',
      '#hv2Sheet a.btn{text-decoration:none}',
      /* 판 X514 — 화법 · 상품전략 · 공부 시트 (시안 .seg · .say · .card · .mini 그대로) */
      '#hv2Sheet .tseg{display:flex;gap:6px;overflow-x:auto;margin:12px -20px 6px;padding:0 20px;scrollbar-width:none}',
      '#hv2Sheet .tseg::-webkit-scrollbar{display:none}',
      '#hv2Sheet .tseg button{flex:none;height:40px;padding:0 14px;border-radius:20px;background:#fff;font-size:15px;font-weight:700;color:var(--sub);white-space:nowrap}',
      '#hv2Sheet .tseg button.on{background:var(--ink);color:#fff}',
      '#hv2Sheet .say .q{font-size:14px;font-weight:800;color:var(--warn);margin-bottom:4px;white-space:normal}',
      '#hv2Sheet .say .tp{font-size:13px;color:var(--sub2);line-height:1.5;margin-top:8px;white-space:normal}',
      '#hv2Sheet .say .cp{display:block;margin:8px 0 0 auto;height:40px;padding:0 14px;border-radius:10px;background:var(--blue-l);color:var(--blue);font-size:14px;font-weight:700}',
      '#hv2Sheet .pcard{background:#fff;border-radius:20px;padding:16px;margin-top:10px}',
      '#hv2Sheet .who2{font-size:14px;color:var(--sub2);font-weight:600}',
      '#hv2Sheet .rprod{background:#fff;border-radius:16px;padding:14px 16px;margin-top:10px;font-size:15px;font-weight:600;line-height:1.7}',
      '#hv2Sheet .rprod small{display:block;font-size:13px;font-weight:500;color:var(--sub3);margin-top:4px}',
      '#hv2Sheet .pcard .ph{display:flex;justify-content:space-between;align-items:baseline;gap:8px}',
      '#hv2Sheet .pcard .ph b{font-size:17px;font-weight:800}',
      '#hv2Sheet .pcard .ph span{font-size:13px;color:var(--blue);font-weight:700;flex:none}',
      '#hv2Sheet .pcard .hk{font-size:14px;color:var(--sub);line-height:1.5;margin:6px 0}',
      '#hv2Sheet .pcard .p1{font-size:13px;color:var(--sub2);margin-bottom:6px}',
      '#hv2Sheet .pcard .mini{display:flex;align-items:center;gap:10px;width:100%;min-height:56px;border-top:1px solid var(--line2);text-align:left}',
      '#hv2Sheet .pcard .mini .av{width:34px;height:34px;border-radius:50%;background:var(--blue-l);color:var(--blue);display:grid;place-items:center;font-weight:800;flex:none}',
      '#hv2Sheet .pcard .mini .tx{flex:1;min-width:0;display:flex;flex-direction:column}',
      '#hv2Sheet .pcard .mini .tx b{font-size:15px;font-weight:700}',
      '#hv2Sheet .pcard .mini .tx small{font-size:13px;color:var(--sub2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '#hv2Sheet .pcard .mini .go{font-size:14px;color:var(--blue);font-weight:700;flex:none}',
      '#hv2Sheet .pcard .door{display:block;width:100%;height:44px;margin-top:8px;border-radius:12px;background:var(--line2);font-size:15px;font-weight:700;color:var(--ink);text-align:center}',
      '#hv2Sheet .scard{background:#fff;border-radius:20px;padding:16px 18px;margin-top:12px}',
      '#hv2Sheet .scard .k{font-size:13px;color:var(--sub2);font-weight:600}',
      '#hv2Sheet .scard .n{font-size:18px;font-weight:800;margin:4px 0 6px;line-height:1.4}',
      '#hv2Sheet .scard .d{font-size:14px;color:var(--sub);line-height:1.55;margin-top:4px}',
      '#hv2Sheet .numin{display:flex;align-items:center;gap:8px;background:#fff;border-radius:14px;height:58px;padding:0 16px}',
      '#hv2Sheet .numin input{flex:1;min-width:0;border:0;background:none;font:inherit;font-size:22px;font-weight:800;color:var(--ink);outline:none}',
      '#hv2Sheet .numin span{font-size:16px;font-weight:700;color:var(--sub2)}',
      '#hv2Sheet h2 small{font-size:13px;color:var(--sub2);font-weight:600;margin-left:4px}',
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
      '#hv2Sheet h2{font-size:16px;font-weight:800;margin:18px 2px 8px}',
      '#hv2Sheet .nwh{margin-top:12px;background:#ECFDF3;border-radius:14px;padding:12px 14px;font-size:15px;line-height:1.5;color:#05603A}',
      '#hv2Sheet .nwh div+div{margin-top:6px}',
      '#hv2Sheet .nwh b{display:block;font-size:13px;color:#027A48;margin-bottom:1px}'
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
    /* 📊 시안 「팀」 탭 — 아래 탭 띠는 그대로 두라 하셔서 여기서 시트로 (team-v2.js · 판 X528) */
    if (typeof g.teamV2Open === 'function') h += '<button type="button" class="tmall" onclick="teamV2Open()">📊 우리 팀 한눈에<span>›</span></button>';
    if (cur && cur !== me) h += '<div class="whonote"><span>' + (all ? '🏢 팀 전체를 보고 있어요 — 내 것이 아니에요' : '👀 ' + E(T(function () { return g.hwhoName(cur); }, '팀원')) + '님 화면을 그대로 보고 있어요') + '</span><button type="button" onclick="hwhoMe()">← 내 화면</button></div>';
    return h;
  }
  function helloHtml(L) {
    var nm = T(function () { return g.OS.profile.name; }, '') || '설계사';
    var n = (L && L.list) ? L.list.length : 0;
    /* 🙋 나 — 시안 오른쪽 위 단추(openMe). 맨 위 줄은 폰 폭이 꽉 차 인사 줄 오른쪽에 (team-v2.js · 판 X528) */
    var meB = typeof g.meV2Open === 'function' ? '<button type="button" class="mebtn" onclick="meV2Open()" aria-label="나 — 알람 · 공지 · 설정">🙋</button>' : '';
    /* 🤖 자비스 — 시안 오른쪽 위 「자비스에게 말로 묻기」(openJarvis · 판 X530). 🙋 나 옆에 */
    var jvB = can('apexmap') ? '<button type="button" class="mebtn" onclick="HOME_V2.ai()" aria-label="자비스에게 묻기 · AI 도우미">🤖</button>' : '';
    return '<div class="hello"><span>' + E(nm) + '님, ' + (n ? '오늘 <b>' + n + '분</b> 남았어요' : '오늘 할 일 끝! 🎉') + '</span><span class="hb">' + jvB + meB + '</span></div>';
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
  /* 🎯 오늘의 미션 (판 X557 · 사장님 말씀 2026-11-25 「오늘 해야 될 미션을 딱 보여주고 그 미션을 해결해나가는게 오늘이야」 → 「제안대로 세워」).
     흩어져 있던 셋(옛 홈 아침 미션 여섯 · 실행 체크판 열하나 · 다섯 걸음)에서 하루에 꼭 끝낼 다섯을 골라 맨 위 한 판.
     ★ 새로 세지 않습니다 — 끝났나는 <b>실행 체크판(hmMsCk · 지점장 화면의 그 근거)</b>과 <b>오늘 약속 카드(hmSteps · hmIsDone · hmQdone)</b> 그대로.
       칸 이름 · 설명 · 가는 곳은 체크판 표(CK_ITEMS.day) 한 곳에서 읽습니다(여기 또 적지 않음).
     ★ 「✓ 했어요」 = 아침 미션 · 📣 알리기 걸음이 쓰던 hmMsDid(ck) · 「되돌리기」 = hmMsUndo — 새 저장 코드 없음.
     ★ 약속 미션은 오늘 약속 카드를 다 챙기면(🤝 만났어요 · 이분 끝) 저절로 끝 · 약속이 없는 날은 「오늘 약속 없음」 으로 끝난 셈. */
  var MIS = [
    { e: '📞', t: '전화 · 카톡', ck: ['d4', 'd5'], rail: 1 },
    { e: '🤝', t: '오늘 약속', appt: 1 },
    { e: '✍️', t: '통화 결과 · 만난 분 기록', ck: ['d6', 'd8'] },
    { e: '🩺', t: '내일 상담 자료 준비', ck: ['d9'] },
    { e: '📣', t: 'SNS 올리기', ck: ['d10'], make: 1 }
  ];
  function ckItem(id) {
    var L = T(function () { return g.CK_ITEMS.day; }, []) || [], i;
    for (i = 0; i < L.length; i++) if (L[i] && L[i][0] === id) return { id: id, t: strip(L[i][1] || id), d: strip(L[i][2] || ''), gl: L[i][3] || '', tab: L[i][4] || '' };
    return { id: id, t: id, d: '', gl: '', tab: '' };
  }
  function apptRows() {
    var S = (T(function () { return g.hmSteps(); }, []) || []).filter(function (x) { return x && x.k === 'appt'; });
    var left = S.filter(function (x) { return !T(function () { return g.hmIsDone(x.key) || g.hmQdone(x.key); }, false); });
    return { all: S.length, left: left };
  }
  function misState(m) {
    if (m.appt) {
      var A = apptRows();
      return { done: !A.left.length, sub: A.all ? (A.all - A.left.length) + ' / ' + A.all + '곳 · 만나면 「🤝 만났어요」' : '오늘 약속 없음', n: A.all };
    }
    var ck = T(function () { return g.hmMsCk(); }, {}) || {}, k = 0;
    m.ck.forEach(function (id) { if (ck[id]) k++; });
    return { done: k === m.ck.length, sub: m.ck.map(function (id) { return (ck[id] ? '✓ ' : '') + ckItem(id).t; }).join(' · '), k: k };
  }
  function misHtml() {
    if (typeof g.hmMsCk !== 'function' || !T(function () { return g.CK_ITEMS.day.length; }, 0)) return '';
    var S = MIS.map(misState), n = S.filter(function (x) { return x.done; }).length, all = n === MIS.length;
    var h = '<div class="mis' + (all ? ' all' : '') + '"><div class="mis-h"><b>🎯 오늘의 미션</b><span>' + n + ' / ' + MIS.length + '</span></div>' +
      '<div class="mis-bar"><i style="width:' + Math.round(n / MIS.length * 100) + '%"></i></div>';
    if (all) h += '<div class="mis-ok">오늘 미션 완료 🎉 수고 많으셨어요</div>';
    h += MIS.map(function (m, i) {
      var st = S[i];
      return '<button type="button" class="mis-r' + (st.done ? ' done' : '') + '" onclick="HOME_V2.mis(' + i + ')"><span class="mis-c">' + (st.done ? '✓' : m.e) + '</span>' +
        '<span class="mis-t"><b>' + E(m.t) + '</b><small>' + E(st.sub) + '</small></span><span class="ar">›</span></button>';
    }).join('');
    return h + '</div>';
  }
  function misSheet(i) {
    var m = MIS[i]; if (!m) return;
    if (m.appt) {
      var A = apptRows();
      if (!A.left.length) { sheet('<h1>🤝 오늘 약속</h1><div class="sub">' + (A.all ? '오늘 약속 ' + A.all + '곳을 다 챙겼어요 👏' : '오늘은 잡힌 약속이 없어요') + '</div>' + (A.all ? '' : '<button type="button" class="btn g" onclick="HOME_V2.close();go(\'mycal\')">📅 달력에서 약속 보기</button>')); return; }
      close(); misRail(A.left[0].key); return;
    }
    var ck = T(function () { return g.hmMsCk(); }, {}) || {};
    var h = '<h1>' + m.e + ' ' + E(m.t) + '</h1><div class="sub">끝내면 「✓ 했어요」 — 실행 체크판에도 같이 담겨요</div><div class="list" style="margin-top:12px;padding:0">' + m.ck.map(function (id) {
      var c = ckItem(id), on = !!ck[id];
      return '<div class="mis-s"><div class="mis-s1"><span class="e">' + (on ? '✅' : '⬜') + '</span><div><b>' + E(c.t) + '</b>' + (c.d ? '<small>' + E(c.d) + '</small>' : '') + '</div></div><div class="mis-s2">' +
        (on ? '<button type="button" class="mis-b g" onclick="HOME_V2.misUndo(' + i + ',\'' + id + '\')">되돌리기</button>' : '<button type="button" class="mis-b" onclick="HOME_V2.misDid(' + i + ',\'' + id + '\')">✓ 했어요</button>') +
        (c.tab ? '<button type="button" class="mis-go" onclick="HOME_V2.close();go(\'' + Q(c.tab) + '\')">' + E(c.gl || '가기') + ' ›</button>' : '') + '</div></div>';
    }).join('') + '</div>';
    if (m.rail) h += '<button type="button" class="btn p" style="margin-top:12px" onclick="HOME_V2.close();HOME_V2.step(0)">📞 지금 이분 카드로 — 한 분씩 걸기</button>';
    if (m.make) h += '<button type="button" class="btn p" style="margin-top:12px" onclick="HOME_V2.close();go(\'content\')">🖼 카드 만들러 가기</button>';
    sheet(h);
  }
  function misRail(key) {
    var L = (T(function () { return g.hmLeft(); }, { list: [] }) || { list: [] }).list || [], j = -1, k;
    for (k = 0; k < L.length; k++) if (L[k].key === key) { j = k; break; }
    var r = el('hv2Rail'); if (!r) return;
    r.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (j >= 0 && r.children[j]) r.scrollTo({ left: r.children[j].offsetLeft - r.offsetLeft, behavior: 'smooth' });
  }
  function misDid(i, ck, undo) {
    try { if (undo) g.hmMsUndo(ck); else g.hmMsDid(ck); } catch (e) {}
    paint(); misSheet(i);
  }
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
  /* 🛰 챙기는 중 — 시안 9차 openJv (판 X526) · 「오늘 끊기기 쉬운 자리」 + 「미리 세워 둔 연락」.
     ★ 새로 세는 자가 없습니다 — 배정 줄의 약속 · 단계(AR.db) · 약속 지난 분(arApptPast) · 소개 여쭐 차례(hmReferRows)
       · 이번 달 마디(mstDueList) · 달력의 앞날 할 일 · 약속(mcalItems · mcalDay — 달력 탭과 같은 자).
     ★ 시안의 「예약 확인 · 감사 · 철회 안내 보냈나」 는 라이브가 보낸 날을 안 남겨 세우지 않습니다(지어내지 않음).
       그 대신 라이브가 아는 자리 — 내일 약속(노쇼) · 오늘 약속 · 약속 지남 · 계약완료인데 증권 전달 전 · 소개 차례. */
  function ymdPlus(n) { var t = T(function () { return g.mcalToday(); }, '') || new Date().toISOString().slice(0, 10), d = new Date(t + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function jvData() {
    var w = who(), td = ymdPlus(0), tm = ymdPlus(1), L = [], P = [];
    var nm = function (r) { return nameOf({ t: r.name || r.t || '' }) + '님'; };
    var db = (T(function () { return g.AR.db; }, []) || []).filter(function (r) { return r && r.id && (!w || r.who === w); });
    db.forEach(function (r) {
      var ad = r.appt ? String(r.appt).slice(0, 10) : '', hm = r.appt ? String(r.appt).slice(11, 16) : '';
      if (ad === tm) L.push({ id: r.id, w: '노쇼', t: nm(r) + ' 내일' + (hm ? ' ' + hm : '') + ' 약속 — 전날 확인 카톡' });
      else if (ad === td) L.push({ id: r.id, w: '오늘', t: nm(r) + (hm ? ' ' + hm : '') + ' 약속 — 출발할 때 카톡' });
      if (r.stage === '계약완료') L.push({ id: r.id, w: '증권', t: nm(r) + ' 계약완료 — 증권 전달이 남았어요' });
    });
    (T(function () { return g.arApptPast(w); }, []) || []).forEach(function (r) {
      L.push({ id: r.id, w: '약속 지남', t: nm(r) + ' ' + String(r.appt || '').slice(5, 10).replace('-', '/') + ' 약속 지남 — 만났으면 감사, 못 만났으면 다시 약속' });
    });
    (T(function () { return g.hmReferRows(w); }, []) || []).forEach(function (r) { L.push({ id: r.id, w: '소개', t: nm(r) + ' 소개 여쭐 차례' }); });
    var I = T(function () { return g.mcalItems(); }, {}) || {};
    for (var n = 2; n <= 14; n++) {
      var ds = ymdPlus(n);
      (T(function () { return g.mcalDay(I, ds); }, []) || []).forEach(function (x) {
        if (!x || (x.k !== 'next' && x.k !== 'appt')) return;
        var t = x.k === 'appt' ? T(function () { return g.hmFullNm(x.t); }, x.t) : x.t;
        P.push({ ds: ds, cid: x.id || '', w: (+ds.slice(5, 7)) + '/' + (+ds.slice(8, 10)), t: (t || '') + ' · ' + (x.k === 'appt' ? '약속' + (x.s ? ' ' + String(x.s).slice(0, 5) : '') : '할 일') });
      });
    }
    return { L: L, P: P, madi: T(function () { return g.mstDueList().monLeft; }, 0) || 0 };
  }
  function jvHtml() {
    var J = jvData(), n = J.L.length;
    return '<button type="button" class="jv" onclick="HOME_V2.jv()"><span class="jv-i">🛰</span><span class="jv-t"><b>자비스가 챙기는 중</b><small>' +
      (n ? '오늘 끊기기 쉬운 자리 ' + n + '곳' : '오늘은 다 챙겼어요') + ' · 미리 세운 연락 ' + J.P.length + '개' + (J.madi ? ' · 마디 ' + J.madi : '') + '</small></span><span class="ar">›</span></button>';
  }
  /* 🤖 자비스로 합친 AI (시안 9차 openJarvis · PLACE 의 'ai' 일곱 · 판 X530) — 사장님 말씀 「AI 7개 → 자비스 하나로」(2026-11-24).
     ★ 묻는 곳은 자비스 하나 — 「APEX 자비스 모드」(apexmap · 서랍 맨 위 그 칸과 같은 길 · 말로 물으면 화면을 엶).
     ★ 나머지 여섯은 <b>지우지 않고</b> 자비스 밑 한 묶음으로 — 화면 · 메뉴 표(TABS) · 서랍은 그대로, 이름 · 그림 · 설명은 메뉴 표에서.
       오늘 화면 「☰ 다른 메뉴」 에서도 흩어져 있던 일곱을 맨 아래 한 갈래로 모읍니다(이 화면 안에서만 · TABS 안 건드림). */
  var AI_IDS = ['apexmap', 'assistant', 'voiceasst', 'brain', 'cs_assist', 'ins_asst', 'helpme'];
  function aiItems() {
    var by = {};
    (T(function () { return g.TABS; }, []) || []).forEach(function (gr) { (gr.items || []).forEach(function (it) { if (it && it.id && AI_IDS.indexOf(it.id) >= 0 && !by[it.id]) by[it.id] = it; }); });
    return AI_IDS.filter(function (id) { return by[id] && can(id); }).map(function (id) { return by[id]; });
  }
  function aiSheet() {
    var A = aiItems(), main = A.filter(function (it) { return it.id === 'apexmap'; })[0], rest = A.filter(function (it) { return it.id !== 'apexmap'; });
    var n = T(function () { return g.navJvCount(); }, 0) || 0;
    sheet('<h1>🤖 자비스</h1><div class="sub">말로 물으면 화면을 열어 드려요</div>' +
      (main ? '<button type="button" class="btn p" onclick="HOME_V2.close();go(\'apexmap\')">🤖 자비스에게 묻기' + (n ? ' · 화면 ' + n + '개' : '') + '</button>' : '') +
      '<button type="button" class="btn g" onclick="HOME_V2.jv()">🛰 자비스가 챙기는 중 보기</button>' +
      (rest.length ? '<h2>자비스로 합친 AI <small>' + rest.length + '</small></h2>' + dockRows(rest) : '') +
      aiMineHtml());
  }
  /* ➕ 판 X549 — 사장님 말씀 「자비스로 합친 AI 에서 추천 메뉴를 내가 추가할 수 있도록」(2026-11-24).
     ★ 일곱(AI_IDS)은 그대로 — 사장님이 고른 메뉴는 그 아래 「내가 더한 메뉴」 한 묶음 · ✕ 로 뺌 · ▲ 로 위로.
     ★ 이 기기에 · 사람마다 남습니다 — 즐겨찾기(navFav) · 상담 자리 보내기(stg) 와 같은 자리 · 이름도 같은 navWho.
       서버로 안 나갑니다(새 서버 저장 없음).
     ★ 메뉴 표(TABS) · ☰ 서랍 · 오늘 「다른 메뉴」 묶음은 안 건드림 — 이름 · 그림 · 설명은 메뉴 표에서 읽기만.
     ★ 열 수 없는 화면(권한 · 없어진 화면)은 안 섬 — 적어 둔 것은 그대로 두어 다시 열리면 다시 섬. */
  var AI_KEY = 'apex_ai_mine_';
  function aiKey() { return AI_KEY + (T(function () { return g.navWho(); }, '') || 'local'); }
  function aiMine() {
    var v = T(function () { return JSON.parse(g.localStorage.getItem(aiKey()) || '[]'); }, []), out = [];
    (v && v.push ? v : []).forEach(function (id) { if (typeof id === 'string' && id && AI_IDS.indexOf(id) < 0 && out.indexOf(id) < 0) out.push(id); });
    return out;
  }
  function aiMineSet(L) { try { g.localStorage.setItem(aiKey(), JSON.stringify(L.slice(0, 30))); } catch (e) {} }
  function menuBy() {
    var by = {};
    (T(function () { return g.TABS; }, []) || []).forEach(function (gr) { (gr.items || []).forEach(function (it) { if (it && it.id && !by[it.id]) by[it.id] = it; }); });
    return by;
  }
  function aiMineItems() { var by = menuBy(); return aiMine().map(function (id) { return by[id]; }).filter(function (it) { return it && can(it.id); }); }
  function aiMineHtml() {
    var M = aiMineItems();
    var desc = function (id) { return strip(T(function () { var m = g.TAB_META[id]; return m && (m.desc || m.d || m.s); }, '') || ''); };
    var h = M.length ? '<h2>내가 더한 메뉴 <small>' + M.length + '</small></h2><div class="list">' + M.map(function (it, i) {
      var d = desc(it.id);
      return '<div class="li" style="padding:0 6px 0 0;gap:0"><button type="button" style="flex:1;min-width:0;display:flex;align-items:center;gap:12px;padding:12px 8px 12px 20px;text-align:left" onclick="HOME_V2.close();go(\'' + Q(it.id) + '\')"><span class="e">' + E(it.icon || '•') + '</span><div class="tx"><div class="t1">' + E(it.title || it.id) + '</div>' +
        (d ? '<div class="t2">' + E(d) + '</div>' : '') + '</div></button>' +
        (i ? '<button type="button" aria-label="위로" title="위로" style="width:40px;height:44px;font-size:15px;color:var(--sub2)" onclick="HOME_V2.aiUp(\'' + Q(it.id) + '\')">▲</button>' : '') +
        '<button type="button" aria-label="자비스에서 빼기" title="자비스에서 빼기" style="width:40px;height:44px;font-size:17px;color:var(--sub2)" onclick="HOME_V2.aiDel(\'' + Q(it.id) + '\')">✕</button></div>';
    }).join('') + '</div>' : '';
    return h + '<button type="button" class="btn" style="margin-top:12px;background:#fff;color:var(--blue);border:1px dashed #B5C7F2" onclick="HOME_V2.aiAdd()">＋ 메뉴 더하기</button>';
  }
  /* 고르는 판 — 「다른 메뉴」 와 같은 묶음(menuGroups) · 일곱은 이미 있으니 뺌 · 이름으로 찾기 */
  var AIQ = '';
  function aiPickList() {
    var mine = aiMine(), q = AIQ.replace(/\s+/g, '').toLowerCase(), n = 0;
    var h = menuGroups().map(function (gr) {
      var L = gr.items.filter(function (x) { return AI_IDS.indexOf(x.it.id) < 0 && (!q || String(x.it.title || x.it.id).replace(/\s+/g, '').toLowerCase().indexOf(q) >= 0); });
      if (!L.length) return '';
      n += L.length;
      return '<h2>' + E(gr.t) + ' <small>' + L.length + '</small></h2><div class="list">' + L.map(function (x) {
        var it = x.it, on = mine.indexOf(it.id) >= 0;
        return '<button type="button" class="li" onclick="HOME_V2.aiPut(\'' + Q(it.id) + '\')"><span class="e">' + E(it.icon || '•') + '</span><div class="tx"><div class="t1">' + E(it.title || it.id) + '</div>' +
          (x.sub ? '<div class="t2">' + E(x.sub) + '</div>' : '') + '</div><span style="flex:none;font-size:14px;font-weight:700;color:' + (on ? 'var(--blue)' : 'var(--sub2)') + '">' + (on ? '✓ 들어감' : '＋ 더하기') + '</span></button>';
      }).join('') + '</div>';
    }).join('');
    return n ? h : '<div class="say">「' + E(AIQ) + '」 이(가) 들어간 메뉴가 없어요</div>';
  }
  function aiAddSheet() {
    AIQ = '';
    sheet('<h1>＋ 자비스에 메뉴 더하기</h1><div class="sub">누르면 자비스 「내가 더한 메뉴」 에 들어가요 · 이 기기에 남아요</div>' +
      '<input id="hv2AiQ" type="search" placeholder="메뉴 이름으로 찾기" oninput="HOME_V2.aiQ(this.value)" style="width:100%;height:48px;margin-top:12px;border:1px solid #D1D6DB;border-radius:12px;padding:0 14px;font-size:16px;background:#fff">' +
      '<div id="hv2AiL">' + aiPickList() + '</div>' +
      '<button type="button" class="btn p" style="margin-top:14px" onclick="HOME_V2.ai()">다 골랐어요 — 자비스로</button>');
  }
  function jvSheet() {
    var J = jvData();
    var row = function (x, on) {
      var go = x.id ? 'HOME_V2.close();hmRtPerson(\'' + Q(x.id) + '\')' : (x.cid ? 'HOME_V2.close();osOpenClient(\'' + Q(x.cid) + '\')' : 'HOME_V2.close();try{MCAL.sel=\'' + Q(x.ds) + '\'}catch(e){};go(\'mycal\')');
      return '<button type="button" class="li" onclick="' + go + '"><span class="jvw' + (on ? ' on' : '') + '">' + E(x.w) + '</span><div class="tx"><div class="t1" style="white-space:normal;font-size:15px">' + E(x.t) + '</div></div><span class="ar">›</span></button>';
    };
    var none = '<div class="li"><div class="tx"><div class="t2">오늘은 다 챙겼어요</div></div></div>';
    sheet('<h1>🛰 자비스가 챙기는 중</h1><div class="sub">고객이 중간에 끊기기 쉬운 자리를 모아 두었어요</div>' +
      '<h2>오늘 <small>' + J.L.length + '곳</small></h2><div class="list">' + (J.L.length ? J.L.map(function (x) { return row(x, true); }).join('') : none) + '</div>' +
      '<h2>미리 세워 둔 연락 <small>' + J.P.length + '개 · 2주 안 · 달력에도 있어요</small></h2><div class="list">' + (J.P.length ? J.P.slice(0, 20).map(function (x) { return row(x, false); }).join('') : '<div class="li"><div class="tx"><div class="t2">2주 안에 잡아 둔 연락이 없어요</div></div></div>') +
        (J.P.length > 20 ? '<button type="button" class="li" onclick="HOME_V2.close();go(\'mycal\')"><div class="tx"><div class="t1" style="color:var(--blue)">나머지 ' + (J.P.length - 20) + '개는 달력에서 ›</div></div></button>' : '') + '</div>' +
      (J.madi ? '<button type="button" class="btn g" style="margin-top:12px" onclick="HOME_V2.close();go(\'clients\')">💌 이번 달 보낼 마디 ' + J.madi + ' — 고객 365일에서</button>' : '') +
      '<div class="jvnote">끊기기 쉬운 자리 — 약속 전날 확인을 안 함(노쇼) · 약속이 지난 뒤 연락이 끊김 · 계약 뒤 증권 전달이 빠짐 · 소개 여쭐 때를 놓침. 앞날 연락은 고객 칸의 「다음 할 일」 과 약속에서 와요.</div>');
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
    var h = '<div class="qc" data-i="' + i + '"><div class="qtop"><div class="av">' + E(nm.charAt(0)) + '</div><span class="nm">' + E(nm) + '님</span>' + (stg ? '<span class="sg">' + E(stg) + '</span>' : '') + (x.k === 'db' && /^(AP|PC|CS)$/.test(String(x.tk || '')) && x.id ? amtChip(x.id) : '') + '</div>';
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
        /* 💬 카톡처럼 보고 보내기 — 사장님 말씀 (2026-11-21) 「안부 카톡이나 문자도 디자인 짜라니까」 → 보내기 화면(msg-v2.js).
           빨리 끝낼 때를 위해 「복사하고 보냈어요」 는 그대로 둡니다 */
        if (g.MSG_V2) h += '<button type="button" class="btn p" style="margin-top:10px" onclick="HOME_V2.say(\'' + key + '\')">💬 카톡처럼 보고 보내기</button>' +
          '<button type="button" class="btn g sm" style="margin-top:8px" onclick="HOME_V2.sent(\'' + key + '\',\'' + Q(k) + '\')">복사하고 보냈어요</button>';
        else h += '<button type="button" class="btn p" style="margin-top:10px" onclick="HOME_V2.sent(\'' + key + '\',\'' + Q(k) + '\')">💬 복사하고 보냈어요</button>';
      } else {
        h += callBtn + '<button type="button" class="btn g sm" style="margin-top:8px" onclick="hmQfin(\'' + key + '\')">✅ 이분 끝</button>';
      }
    }
    h += newsHtml(x) + askHtml(x) + sitHtml(x) + toolsHtml(x);
    if (x.k === 'db' && String(x.tk || '') === 'CS' && x.id) h += '<button type="button" class="btn ok" onclick="HOME_V2.won(\'' + Q(x.id) + '\')">✓ 계약됐어요</button>';
    h += '<div class="qbtns"><button type="button" onclick="HOME_V2.next(' + i + ')">다음 →</button><button type="button" onclick="hmSkip(\'' + key + '\')">오늘은 뒤로</button></div>';
    var D = doorOf(x);
    h += '<div class="qins"><button type="button" class="ins" onclick="hmDoorGo(\'' + Q(D.cat) + '\',\'' + D.band + '\')"><span class="k">🧭 ' + E(D.lab) + '</span><span class="a">상품전략기 ›</span><span class="p">' + E(D.prod) + '</span></button>' +
      '<button type="button" class="rc" onclick="hmOpen(\'' + key + '\')">이분 자세히</button></div>';
    return h + '</div>';
  }
  /* 📰 오늘 소식 (시안 qCard 「오늘 소식」 · 판 X529) — 이분께 맞는 기사 한 건.
     고르는 자는 아침 미션 「이 분께 보낼 소식」 과 같은 ccNewsIdx(관심 갈래 ccFitOf × 받아 둔 뉴스 NLIVE) · 누르면 있던 ccNews(복사).
     고객 365일 고객만(배정 DB 줄은 관심을 몰라 안 섬) · 뉴스를 아직 못 받았거나 맞는 기사가 없으면 줄을 안 세움 — 소식을 지어내지 않습니다. */
  function cliOf(x) { return (x && x.id && x.k !== 'db' && x.k !== 'my') ? x.id : ''; }
  function newsHtml(x) {
    var id = cliOf(x); if (!id) return '';
    var i = T(function () { return g.ccNewsIdx(id); }, -1); if (!(i >= 0)) return '';
    var it = T(function () { return g.NLIVE.items[i]; }, null); if (!it || !it.t) return '';
    return '<button type="button" class="qnews" onclick="ccNews(\'' + Q(id) + '\')"><b>📰 오늘 소식</b><span>' + E(it.t) + '</span><i>복사</i></button>';
  }
  /* 🙋 물어볼 것 (시안 qCard qask · 판 X529) — 「한 가지만 여쭙니다」 가 고른 한 가지(cqaAsk)와 그 답 단추(cqaAnsHtml) 그대로.
     답은 있던 자리(cmSave · cmNextSave · 고객 칸)로만 갑니다 — 저장 코드 새로 없음. 누른 뒤 이 화면도 한 번 다시 그립니다(askAfter). */
  /* 🧰 이분께 맞는 도구 (사장님 말씀 2026-11-24 「오늘에서 고객의 상황에 맞게 어떤 도구를 추천해주는지도 띄워줘」 · 판 X532)
     고르는 자는 고객 화면 「🧭 이분께 권할 것 · 들고 갈 화면」 과 <b>같은 한 곳</b>(CUS_V2.appsBy — 상황 CARE_APP 먼저 → 단계 APEX_STAGE know).
     상황 = 고객 365일 「지금 상황」(cmOf · 배정 DB 카드는 모름) · 단계 = 배정 DB 카드는 그 줄 단계, 고객 카드는 그분 배정 줄 단계(crmDbsOf), 모르면 단계 도구는 안 붙임.
     열 수 없는 화면은 안 섬 · 상황도 단계도 모르면 줄째 안 섬(지어내지 않음). 누르면 그 화면. */
  /* 📍 지금 상황 · ⚙ 상황별 추천 (판 X558 · 사장님 말씀 2026-11-25 「고객의 현재 상황이 안보이고 상황에 추천하는 메뉴 두개 정도 있는데
     내가 추가할수 있도록 해줘 다른 사람은 손 못대게」).
     ① 카드에 「📍 지금 상황」 — 고객 365일 고객만(배정 DB 줄은 상황 칸이 없음). 모르면 「고르기」.
        고르기는 고객 화면 「지금 상황」 과 같은 칸 — 목록 CM_CARE · 저장 cmSave(id, {care}) 그대로(새 저장 코드 없음).
     ② 「⚙ 추천 고치기」 — 대표 · 관리자에게만 단추(osIsAppAdmin). 상황마다 기본(CARE_APP · 🔒) 뒤에 더할 메뉴를 고름.
        저장은 있던 osCfgSet('care_apps', …) — 서버 app_config 는 is_owner() · is_admin() 만 쓸 수 있어 <b>다른 사람은 서버에서 막힘</b>.
        고른 것은 CUS_V2.appsBy 한 곳으로 들어가 오늘 카드 · 고객 화면 「권할 것」 에 같이 섬. */
  function isBoss() { return !!T(function () { return g.osIsAppAdmin(); }, false); }
  function careList() { return (T(function () { return g.CM_CARE; }, []) || []).filter(Boolean); }
  function sitHtml(x) {
    var id = cliOf(x); if (!id || !careList().length) return '';
    var c = T(function () { return g.cmOf(id).care; }, '') || '';
    return '<div class="qsit"><span class="k">📍 지금 상황</span>' + (c ? '<b>' + E(c) + '</b>' : '<span class="no">몰라요</span>') +
      '<button type="button" onclick="HOME_V2.sit(\'' + Q(x.key) + '\')">' + (c ? '바꾸기' : '고르기') + '</button></div>';
  }
  function sitSheet(key) {
    var x = rowOf(key), id = cliOf(x); if (!id) return;
    var L = careList(), c = T(function () { return g.cmOf(id).care; }, '') || '';
    sheet('<div class="sub">' + E(nameOf(x)) + '님</div><h1>📍 지금 상황</h1><div class="sub">고객 화면 「지금 상황」 과 같은 칸이에요 — 고르면 맞는 도구가 바뀌어요</div>' +
      '<div class="chipr" style="margin-top:12px;flex-wrap:wrap">' + L.map(function (t, i) { return '<button type="button" class="' + (t === c ? 'on' : '') + '" onclick="HOME_V2.sitPut(\'' + Q(key) + '\',' + i + ')">' + E(t) + '</button>'; }).join('') +
      '<button type="button" class="' + (c ? '' : 'on') + '" onclick="HOME_V2.sitPut(\'' + Q(key) + '\',-1)">없음 · 모름</button></div>');
  }
  function sitPut(key, i) {
    var x = rowOf(key), id = cliOf(x); if (!id) return;
    var v = i < 0 ? '' : (careList()[i] || ''), c = T(function () { return g.cmOf(id).care; }, '') || '';
    if (v === c) { close(); return; }
    try { g.cmSave(id, { care: v }, function () { try { g.toast(v ? '「' + v + '」 로 골랐어요 — 맞는 도구가 바뀌었어요' : '상황을 비웠어요'); } catch (e) {} close(); paint(); }); } catch (e2) {}
  }
  var CE = { care: '', q: '' };
  function careMap() { return T(function () { var o = JSON.parse(g.osCfgGet(g.CUS_V2.CARE_KEY, '{}') || '{}'); return (o && typeof o === 'object' && !o.push) ? o : {}; }, {}) || {}; }
  function careSave(M, msg) {
    var o = {}; Object.keys(M).forEach(function (k) { if (M[k] && M[k].length) o[k] = M[k].slice(0, 12); });
    try { g.osCfgSet(g.CUS_V2.CARE_KEY, JSON.stringify(o), function () { careEditSheet(); }); } catch (e) {}
  }
  function careEditSheet(care) {
    if (!isBoss()) { try { g.toast('대표 · 관리자만 고칠 수 있어요'); } catch (e) {} return; }
    var L = careList(); if (care != null) { CE.care = care || CE.care || L[0] || ''; CE.q = ''; }
    if (!CE.care) CE.care = L[0] || '';
    var base = T(function () { return g.CUS_V2.CARE_APP[CE.care]; }, []) || [], mine = careMap()[CE.care] || [];
    var nm = function (tab) { var it = T(function () { return g.navItemOf(tab); }, null) || {}; return (it.icon ? it.icon + ' ' : '') + (it.title || tab); };
    var seenB = {};
    var h = '<h1>⚙ 상황별 추천 메뉴</h1><div class="sub">고른 상황의 고객 카드 · 고객 화면 「권할 것」 에 같이 떠요 · 팀 모두에게 · 고치기는 대표 · 관리자만</div>' +
      '<div class="chipr" style="margin-top:12px;flex-wrap:wrap">' + L.map(function (t, i) { return '<button type="button" class="' + (t === CE.care ? 'on' : '') + '" onclick="HOME_V2.careTo(' + i + ')">' + E(t) + '</button>'; }).join('') + '</div>' +
      '<h2>' + E(CE.care) + ' <small>기본 ' + base.length + ' · 더한 것 ' + mine.length + '</small></h2><div class="list">' +
      base.map(function (b) { if (seenB[b.tab]) return ''; seenB[b.tab] = 1; return '<div class="li"><span class="e">🔒</span><div class="tx"><div class="t1">' + E(nm(b.tab)) + '</div><div class="t2">기본</div></div></div>'; }).join('') +
      mine.map(function (t, i) {
        return '<div class="li" style="padding-right:6px"><span class="e">➕</span><div class="tx"><div class="t1">' + E(nm(t)) + '</div><div class="t2">사장님이 더함</div></div>' +
          (i ? '<button type="button" aria-label="위로" style="width:40px;height:44px;font-size:15px;color:var(--sub2)" onclick="HOME_V2.careUp(' + i + ')">▲</button>' : '') +
          '<button type="button" aria-label="빼기" style="width:40px;height:44px;font-size:17px;color:var(--sub2)" onclick="HOME_V2.careDel(' + i + ')">✕</button></div>';
      }).join('') + '</div>' +
      '<h2>메뉴 더하기</h2><input id="hv2CareQ" type="search" placeholder="메뉴 이름으로 찾기" oninput="HOME_V2.careQ(this.value)" value="' + E(CE.q) + '" style="width:100%;height:48px;border:1px solid #D1D6DB;border-radius:12px;padding:0 14px;font-size:16px;background:#fff">' +
      '<div id="hv2CareL">' + carePick() + '</div>';
    sheet(h);
  }
  function carePick() {
    var base = (T(function () { return g.CUS_V2.CARE_APP[CE.care]; }, []) || []).map(function (b) { return b.tab; }), mine = careMap()[CE.care] || [];
    var q = CE.q.replace(/\s+/g, '').toLowerCase(), n = 0;
    var h = menuGroups().map(function (gr) {
      var L = gr.items.filter(function (x) { return base.indexOf(x.it.id) < 0 && (!q || String(x.it.title || x.it.id).replace(/\s+/g, '').toLowerCase().indexOf(q) >= 0); });
      if (!L.length) return '';
      n += L.length;
      return '<h2 style="margin-top:12px">' + E(gr.t) + '</h2><div class="list">' + L.map(function (x) {
        var on = mine.indexOf(x.it.id) >= 0;
        return '<button type="button" class="li" onclick="HOME_V2.carePut(\'' + Q(x.it.id) + '\')"><span class="e">' + E(x.it.icon || '•') + '</span><div class="tx"><div class="t1">' + E(x.it.title || x.it.id) + '</div></div>' +
          '<span style="flex:none;font-size:14px;font-weight:700;color:' + (on ? 'var(--blue)' : 'var(--sub2)') + '">' + (on ? '✓ 들어감' : '＋ 더하기') + '</span></button>';
      }).join('') + '</div>';
    }).join('');
    return n ? h : '<div class="say">「' + E(CE.q) + '」 이(가) 들어간 메뉴가 없어요</div>';
  }
  function careEdit(fn) {
    return function (a) {
      if (!isBoss()) return;
      var M = careMap(), L = (M[CE.care] || []).slice();
      fn(L, a); M[CE.care] = L; careSave(M);
    };
  }
  function toolsOf(x) {
    if (!x || x.k === 'my') return null;
    var db = x.k === 'db', id = x.id || '';
    var care = db ? '' : (T(function () { return g.cmOf(id).care; }, '') || '');
    var st = db ? String(x.tk || '') : (T(function () { return g.crmDbsOf(id)[0].stage; }, '') || '');
    var A = T(function () { return g.CUS_V2.appsBy(care, st, true); }, null);
    if (!A || !A.length) return null;
    var si = T(function () { return g.CUS_V2.stgI(st); }, -1), sn = si >= 0 ? T(function () { return g.CUS_V2.STG[si].t; }, '') : '';
    var why = [care ? '「' + care + '」' : '', sn ? sn + ' 단계' : ''].filter(Boolean).join(' · ');
    return { A: A.slice(0, 6), why: why, care: care };
  }
  function toolsHtml(x) {
    var R = toolsOf(x); if (!R) return '';
    return '<div class="qtools"><div class="lb">🧰 이분께 맞는 도구' + (R.why ? '<small>' + E(R.why) + '</small>' : '') +
      (isBoss() ? '<button type="button" class="cfx" onclick="HOME_V2.careEdit(\'' + Q(R.care || '') + '\')">⚙ 추천 고치기</button>' : '') + '</div><div class="tc">' +
      R.A.map(function (a) {
        var ic = T(function () { return g.navItemOf(a.tab).icon; }, '') || '', nm = (ic && a.t.indexOf(ic + ' ') === 0) ? a.t.slice(ic.length + 1) : a.t;
        return '<button type="button" onclick="go(\'' + Q(a.tab) + '\')">' + (ic ? '<i>' + E(ic) + '</i>' : '') + '<span>' + E(nm) + '</span></button>';
      }).join('') + '</div></div>';
  }
  function askHtml(x) {
    var id = cliOf(x); if (!id) return '';
    var a = T(function () { return g.cqaAsk(id); }, null); if (!a || !a.q || !a.q.ask) return '';
    var ans = T(function () { return g.cqaAnsHtml(id, a); }, '') || '';
    return '<div class="qask" onclick="HOME_V2.askAfter()"><div class="q">🙋 ' + E(strip(a.q.ask)) + '</div>' + ans + '</div>';
  }
  function railHtml(L) {
    var list = (L && L.list) || [], all = (L && L.all) || list.length;
    var h = '<div class="qhd"><b>지금 이분</b><span>' + (all - list.length) + ' / ' + all + (list.length > 1 ? ' · 옆으로 넘겨요' : '') + '</span></div>';
    if (!list.length) return h + '<div class="qempty"><b>🎉</b>오늘 볼 분을 다 챙겼어요</div>';
    h += '<div class="qrail" id="hv2Rail" onscroll="HOME_V2.dots()">' + list.map(cardHtml).join('') + '</div>';
    /* 점은 시안처럼 여덟 개까지 — 카드가 많으면(팀원 화면은 100장 넘음) 점 하나가 여러 장을 맡습니다.
       ⚠ 판 X511 전에는 카드 수만큼 점을 세워, 147장이면 점 147개(1,600px 넘는 줄)가 섰습니다. */
    if (list.length > 1) {
      var nd = Math.min(DOT_MAX, list.length), dh = '';
      for (var di = 0; di < nd; di++) dh += '<i class="' + (di === 0 ? 'on' : '') + '"></i>';
      h += '<div class="dots" id="hv2Dots">' + dh + '</div>';
    }
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
      ks.map(function (k) { var p = tops[k][0]; return '<button type="button" onclick="HOME_V2.insK(\'' + Q(k) + '\')"><b>' + E(CATS[k].label) + '</b><span>' + E(p.nm) + '</span><em>' + (by[k] ? '오늘 볼 분 ' + by[k] + '명' : E(p.co || '')) + '</em></button>'; }).join('') +
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
    /* 시안처럼 몇 줄만 — 약속이 먼저, 그 밖은 셋까지(나머지는 「외 N건」 · 달력 크게에서 다 봄) */
    SL = SL.slice().sort(function (a, b) { return (a.k === 'appt' ? 0 : 1) - (b.k === 'appt' ? 0 : 1); });
    var SHOW = 3;
    h += SL.length ? SL.slice(0, SHOW).map(function (z) {
      var s = String(z.s || ''), tm = (s.match(/^\d{1,2}:\d{2}/) || [''])[0];
      var nm = z.t ? nameOf({ t: z.t }) + '님' : '';
      return '<div class="tl"><span class="t">' + E(tm || KO[z.k] || '일정') + '</span><span class="x">' + E([nm, s.replace(/^\d{1,2}:\d{2}\s*·?\s*/, '')].filter(Boolean).join(' · ')) + '</span></div>';
    }).join('') + (SL.length > SHOW ? '<div class="tl" style="color:var(--sub2)"><span class="t"></span><span class="x">외 ' + (SL.length - SHOW) + '건 — 달력 크게에서</span></div>' : '')
      : '<div class="tl" style="color:var(--sub2)">이날은 일정이 없어요</div>';
    /* 📍 동선은 이번 주 칸 밑 「오늘 동선」 카드(routeHtml) 한 곳에서 말합니다 — 판 X512 전에는 이 칸 맨 아래 한 줄이었고,
         카드를 세우면서 같은 수가 두 번 서게 되어 이 줄을 걷었습니다. 약속이 없는 날의 「추천 1~3」 줄은 그대로(오늘 어디 가는지) */
    if (sel === dow && !route().n) {
      var RR = recRoute();
      if (!RR.list.length) RR = { list: recAny() };   /* 동네가 적힌 분이 없어도 만날 분은 추천 (판 X512 · 「약속 없어도 추천 띄우고」) */
      if (RR.list.length) {
        if (!SL.length) h = h.replace('<div class="tl" style="color:var(--sub2)">이날은 일정이 없어요</div>', '<div class="tl" style="color:var(--sub2)">오늘은 약속이 없어요 — 이 동네를 묶어 보세요</div>');
        h += RR.list.slice(0, 3).map(function (r, i) {
          return '<div class="tl"><span class="t">추천 ' + (i + 1) + '</span><span class="x">' + E([nameOf({ t: r.name }) + '님', r.stage || '첫 전화', [r.region, r.dong].filter(Boolean).join(' ')].filter(Boolean).join(' · ')) + '</span></div>';
        }).join('');
      }
    }
    return h + '<div class="row2"><button type="button" class="btn g sm" onclick="HOME_V2.sched()">＋ 일정</button><button type="button" class="btn g sm" onclick="go(\'mycal\')">📅 달력 크게</button></div></div>';
  }
  /* 영업 한 바퀴 — 배정 DB 단계별 몇 분(arStageN) · 오늘 볼 분이 있는 칸은 빨간 점 */
  var ROAD = [['첫 전화', ['미접촉', '부재']], ['연락', ['TA']], ['만남', ['AP']], ['제안', ['PC']], ['청약', ['CS']], ['관리', ['계약완료', '증권전달', '소개완료']]];
  function roadHtml() {
    var N = T(function () { return g.arStageN(who()); }, null);
    if (!N) return '';
    var S = T(function () { return g.hmSteps(); }, []) || [];
    return '<div class="sec"><b>영업 한 바퀴</b><small>' + (newOn() ? '🌱 칸을 누르면 할 일 · 하는 법' : '칸을 누르면 그 단계 분들') + '</small></div><div class="road2">' + ROAD.map(function (r, i) {
      var n = 0, hot = false;
      r[1].forEach(function (k) { n += (N.c[k] || 0); });
      S.forEach(function (x) { if (x.k === 'db' && r[1].indexOf(String(x.tk || '')) >= 0) hot = true; });
      return '<button type="button" class="' + (hot ? 'hot' : '') + '" onclick="HOME_V2.stage(' + i + ')"><b>' + n + '</b><span>' + r[0] + '</span></button>';
    }).join('') + '</div>';
  }
  /* 🌱 신입 도움말 (판 X551 · 단순화 순서 ⑤ 「신입 / 설계사 / 지점장 보기」 · 시안 9차 role 'new' 의 「이 칸에서 할 일 — …」).
     사장님이 고르신 길(2026-11-24) 「🙋 나 시트에 스위치」 — 앱엔 「신입」 직급이 없어 <b>켜는 사람이 정합니다</b>.
     ★ 켜면: 영업 한 바퀴 머리 「🌱 칸을 누르면 할 일 · 하는 법」 · 단계 시트 맨 위 「🌱 이 칸에서 할 일 / 어떻게」.
       글은 <b>APEX_STAGE.aimText · wayText 그대로</b>(화법 시트 · TA 스크립트와 같은 원본 · 지어낸 말 없음).
     ★ 이 기기에 · 사람마다(apex_newhelp_<navWho> · 즐겨찾기와 같은 자리) · 서버 안 나감. 기본은 꺼짐.
     ★ 지점장 쪽(팀 동그라미 · 📊 우리 팀 한눈에)은 판 X528 그대로 — 아래 탭 띠는 그대로. */
  var NEW_KEY = 'apex_newhelp_';
  function newKey() { return NEW_KEY + (T(function () { return g.navWho(); }, '') || 'local'); }
  function newOn() { return T(function () { return g.localStorage.getItem(newKey()); }, null) === '1'; }
  function newSet(v) { try { if (v) g.localStorage.setItem(newKey(), '1'); else g.localStorage.removeItem(newKey()); } catch (e) {} }
  /* 🔁 영업 한 바퀴 칸 → 그 단계 분들 + 이 단계에서 쓰는 것 (시안 9차 openStage · 판 X513)
     ★ 분들 = 배정 DB(AR.db) — 칸 숫자를 센 자(arStageN)와 <b>같은 거름</b>(지금 보는 분 · 단계)이라 숫자와 줄 수가 같습니다.
     ★ 한 분을 누르면 자비스 · 추천 동선과 같은 길(hmRtPerson → 그분 한 장). 쓰는 것 = APEX_STAGE.tools(단계) 그대로.
     ★ 예전 길(DB 통합 CRM 명단)은 맨 아래 단추로 남깁니다 — 지우지 않습니다. */
  var ROAD_KEY = ['미접촉', 'TA', 'AP', 'PC', 'CS', '계약완료'];
  function stageRows(i) {
    var R = ROAD[i], w = who();
    return (T(function () { return g.AR.db; }, []) || []).filter(function (r) {
      return r && r.id && R[1].indexOf(String(r.stage || '미접촉')) >= 0 && (!w || r.who === w);
    }).sort(function (a, b) { return (+(b.days === 9999 ? -1 : b.days) || 0) - (+(a.days === 9999 ? -1 : a.days) || 0); });
  }
  function stageSheet(i) {
    var R = ROAD[i]; if (!R) return;
    var L = stageRows(i), K = ROAD_KEY[i], MAX = 30;
    var aim = strip(T(function () { return g.APEX_STAGE.aimText(K); }, '') || '');
    var tools = (T(function () { return g.APEX_STAGE.tools(K); }, []) || []).filter(function (x) { return x && x.id && can(x.id); });
    var dTxt = function (d) { return d == null || d === 9999 ? '연락 기록 없음' : (d === 0 ? '오늘 연락' : d + '일 전 연락'); };
    var nw = newOn(), way = nw ? strip(T(function () { return g.APEX_STAGE.wayText(K); }, '') || '') : '';
    var h = '<h1>' + E(R[0]) + ' <span style="color:var(--sub2);font-size:17px">' + E(R[1].join(' · ')) + '</span></h1>' +
      '<div class="sub">' + E([nw ? '' : aim, '모두 ' + L.length + '명'].filter(Boolean).join(' · ')) + '</div>' +
      (nw && (aim || way) ? '<div class="nwh">' + (aim ? '<div><b>🌱 이 칸에서 할 일</b>' + E(aim) + '</div>' : '') + (way ? '<div><b>어떻게</b>' + E(way) + '</div>' : '') + '</div>' : '');
    h += '<div class="list" style="margin-top:12px">' + (L.length ? L.slice(0, MAX).map(function (r) {
      return '<button type="button" class="li" onclick="HOME_V2.close();hmRtPerson(\'' + Q(r.id) + '\')"><div class="tile">' + E(String(nameOf({ t: r.name || '' })).replace(/^\s*\[[^\]]*\]\s*/, '').charAt(0) || '·') + '</div><div class="tx"><div class="t1">' + E(nameOf({ t: r.name || '' })) + '님</div>' +
        '<div class="t2">' + E([r.stage || '미접촉', [r.region, r.dong].filter(Boolean).join(' '), r.appt ? '약속 ' + String(r.appt).slice(5, 16).replace('T', ' ') : dTxt(r.days)].filter(Boolean).join(' · ')) + '</div></div><span class="ar">›</span></button>';
    }).join('') : '<div class="li"><div class="tx"><div class="t2">이 단계에 계신 분이 없어요</div></div></div>') +
      (L.length > MAX ? '<button type="button" class="li" onclick="HOME_V2.close();go(\'crm\')"><div class="tx"><div class="t1" style="color:var(--blue)">나머지 ' + (L.length - MAX) + '명은 DB 통합 CRM 에서 ›</div></div></button>' : '') + '</div>';
    if (tools.length) h += '<h2>이 단계에서 쓰는 것</h2><div class="list">' + tools.map(function (x) {
      return '<button type="button" class="li" onclick="HOME_V2.close();go(\'' + Q(x.id) + '\')"><span class="e">' + E(x.e || '•') + '</span><div class="tx"><div class="t1">' + E(x.t || x.id) + '</div></div><span class="ar">›</span></button>';
    }).join('') + '</div>';
    h += '<button type="button" class="btn g" onclick="HOME_V2.close();go(\'crm\')">📋 DB 통합 CRM 에서 전부 보기</button>';
    sheet(h);
  }
  /* 🎯 목표 시트 (시안 9차 openGoal · 판 X513) — 금액 · 건수 → 고객 한 분당 목표가 저절로.
     ★ 저장은 있던 pfSave 하나(monthly_perf 같은 줄 · DB · 업적관리 표와 「내 업적」 이 쓰는 그 칸) — 새 저장 코드 없음.
       건수만 바꿔도 금액을 같이 보냅니다(DB · 업적관리와 같은 까닭 — 금액이 0 으로 깔리지 않게).
     ★ 늘 「내」 목표만 적습니다. 팀원 목표는 리더가 DB · 업적관리에서(그쪽 단추). */
  function goalSheet() {
    var PF = g.PF || {};
    if (!PF.loaded) { goalLoad(); sheet('<h1>🎯 이번 달 목표</h1><div class="sub">목표를 읽는 중이에요 — 잠시 뒤 다시 눌러 주세요</div>'); return; }
    var r = PF.mine || {}, gv = +r.goal_prem || 0, cv = +r.goal_case || 0, av = +r.act_prem || 0, ac = +r.act_case || 0;
    var ym = T(function () { return g.pfYmLabel(g.pfYm()); }, '') || ((new Date().getMonth() + 1) + '월');
    var me = T(function () { return g.arMyId(); }, ''), w = who();
    var lead = !!T(function () { return g.pfIsLead(); }, false);
    var h = '<h1>🎯 ' + E(ym) + ' 내 목표</h1><div class="sub">월초 보험료 기준 · DB · 업적관리 표와 같은 칸이에요</div>' +
      (w && me && w !== me ? '<div class="hint">지금 보고 있는 팀원 것이 아니라 <b>내</b> 목표를 적어요</div>' : '') +
      (r.from_team ? '<div class="hint">팀 사업계획서에서 내려온 목표예요 — 여기서 고치면 내 칸만 바뀌어요</div>' : '') +
      '<h2>이번 달 목표 금액</h2><label class="numin"><input id="hv2GoalP" type="number" inputmode="numeric" min="0" value="' + (gv || '') + '" placeholder="0" oninput="HOME_V2.goalPer()"><span>만원</span></label>' +
      '<div class="chipr" style="margin-top:6px">' + [100, 150, 200, 300].map(function (q) { return '<button type="button" onclick="HOME_V2.goalQ(' + q + ')">' + q + '<small>만원</small></button>'; }).join('') + '</div>' +
      '<h2>목표 건수</h2><label class="numin"><input id="hv2GoalC" type="number" inputmode="numeric" min="0" value="' + (cv || '') + '" placeholder="0" oninput="HOME_V2.goalPer()"><span>건</span></label>' +
      '<div class="say" id="hv2GoalPer"></div>' +
      ((av || ac) ? '<div class="sub" style="margin:8px 2px 0">지금 실적 ' + av + '만 · ' + ac + '건</div>' : '') +
      '<button type="button" class="btn p" onclick="HOME_V2.goalPut()">저장</button>' + amtMissHtml() +
      (lead ? '<button type="button" class="btn g" onclick="HOME_V2.close();arGoCat(\'dbperf\');go(\'airep\')">👥 팀원 목표는 DB · 업적관리에서</button>' : '') +
      '<button type="button" class="btn g" onclick="HOME_V2.goalOld()">업적 · 월간보고 자세히</button>';
    sheet(h);
    goalPer();
  }
  /* 💰 예상 월납 · ✓ 계약됐어요 — 시안 9차 openAmt · openClose (판 X526 · 사장님 말씀 「5번 해」 · 고르신 것 「같은 서버 문 한 줄」).
     ★ 저장은 「DB · 업적관리」 가 쓰는 <b>그 서버 문 하나</b>(pipeline_save — 진행 칸만 고치는 문)입니다. 본체엔 이 칸을 적는 함수가 없어
       그 문을 부르는 자리를 <b>여기 한 곳</b>(pexSave)만 둡니다. 같은 칸 · 같은 권한이라 표 · EM 상담 보드 · 업적 합계가 그대로 따라옵니다.
     ★ 단위 — 칸(expect_premium · contract_premium)은 <b>원</b>, 손으로 치는 것은 <b>만원</b>. 만 배 하는 자리는 toWon 한 곳.
     ★ 「계약됐어요」 는 DB · 업적관리 queueSave 의 「계약완료」 규칙 그대로 — 체결일(contracted_at) 지금 · 증권 전달일 비움 · 계약 업적.
       고친 뒤 손에 든 줄은 있던 자로 맞춥니다(hmPexPut · hdbLocal · hmPexRow — 끼운 업적판이 쓰는 그 길). 내 고객이 아니면 안 고칩니다(hdbCan). */
  var PEX_Q = [5, 10, 20, 30], WON_Q = [10, 20, 30, 50];
  function dbr(id) { return T(function () { return g.hdbRow(id); }, null) || (T(function () { return g.AR.db; }, []) || []).filter(function (r) { return r && String(r.id) === String(id); })[0] || null; }
  function manOf(won) { var n = +won || 0; return n > 0 ? Math.round(n / 10000) : 0; }
  function toWon(man) { return Math.round(man) * 10000; }
  function amtChip(id) { var m = manOf((dbr(id) || {}).expect); return '<button type="button" class="amt' + (m ? '' : ' miss') + '" onclick="event.stopPropagation();HOME_V2.amt(\'' + Q(id) + '\')">' + (m ? '예상 ' + m + '만' : '금액 ?') + '</button>'; }
  function amtMiss() {
    var w = who();
    return (T(function () { return g.AR.db; }, []) || []).filter(function (r) { return r && r.id && (!w || r.who === w) && /^(AP|PC|CS)$/.test(String(r.stage || '')) && !(+r.expect > 0); });
  }
  function amtMissHtml() {
    var M = amtMiss(); if (!M.length) return '';
    return '<button type="button" class="btn g" onclick="HOME_V2.amt(\'' + Q(M[0].id) + '\')">💰 예상 월납 안 적힌 ' + M.length + '분 — ' + E(nameOf({ t: M[0].name || '' })) + '님부터 적기</button>';
  }
  function numSheet(o) {
    sheet('<h1>' + E(o.h1) + '</h1><div class="sub">' + E(o.sub) + '</div>' +
      '<label class="numin" style="margin-top:12px"><input id="hv2Num" type="number" inputmode="numeric" min="0" value="' + (o.val || '') + '" placeholder="0"><span>만원</span></label>' +
      '<div class="chipr" style="margin-top:6px">' + o.q.map(function (q) { return '<button type="button" onclick="HOME_V2.numQ(' + q + ')">' + q + '<small>만원</small></button>'; }).join('') + '</div>' +
      (o.note ? '<div class="sub" style="margin-top:8px">' + E(o.note) + '</div>' : '') +
      '<button type="button" class="btn p" onclick="' + o.put + '">저장</button><button type="button" class="btn g" onclick="HOME_V2.close()">닫기</button>');
  }
  function numVal() { var i = el('hv2Num'); return Math.max(0, Math.round(+((i && i.value) || 0) || 0)); }
  function amtSheet(id) {
    var r = dbr(id); if (!r) { try { g.toast('그분 줄을 아직 못 읽었어요 — 잠시 뒤 다시'); } catch (e) {} return; }
    numSheet({ h1: nameOf({ t: r.name || '' }) + '님 예상 월납', sub: '이분이 계약하시면 들어올 월 보험료예요. 어림값이어도 괜찮아요.', val: manOf(r.expect), q: PEX_Q,
      note: 'DB · 업적관리 · EM 상담 보드와 같은 칸에 적혀요', put: 'HOME_V2.amtPut(\'' + Q(id) + '\')' });
  }
  function wonSheet(id) {
    var r = dbr(id); if (!r) { try { g.toast('그분 줄을 아직 못 읽었어요 — 잠시 뒤 다시'); } catch (e) {} return; }
    numSheet({ h1: nameOf({ t: r.name || '' }) + '님 계약 축하해요 🎉', sub: '계약된 월 보험료를 적어 주세요. 계약 업적에 적고 「계약완료」 로 옮겨요.', val: manOf(r.contract) || manOf(r.expect), q: WON_Q,
      note: '체결일은 오늘로 적혀요 · 다음은 증권 전달이에요', put: 'HOME_V2.wonPut(\'' + Q(id) + '\')' });
  }
  function pexSave(id, patch, ok) {
    var r = dbr(id), say = function (t) { try { g.toast(t); } catch (e) {} };
    if (!r) { say('그분 줄을 아직 못 읽었어요'); return; }
    if (typeof g.hdbCan === 'function' && !g.hdbCan(r)) { say('내 고객이 아니면 바꿀 수 없어요'); return; }
    var sb = T(function () { return g.osClient(); }, null);
    if (!sb || typeof sb.rpc !== 'function') { say('서버에 연결되어 있지 않아요'); return; }
    close();
    sb.rpc('pipeline_save', { p_id: id, p: patch }).then(function (res) {
      if (res && res.error) { say('저장하지 못했어요 — ' + (res.error.message || '')); return; }
      try { ok(r); } catch (e) {}
    }, function (e) { say('저장하지 못했어요 — ' + ((e && e.message) || '네트워크 오류')); });
  }
  function cusSync(id, p) {
    try { var d = g.CUS && g.CUS.db; if (d && String(d.id) === String(id)) { for (var k in p) if (p.hasOwnProperty(k)) d[k] = p[k]; if (typeof g.cusV2Paint === 'function') g.cusV2Paint(); } } catch (e) {}
  }
  function amtPut(id) {
    var v = numVal(); if (!v) { try { g.toast('금액을 적어 주세요'); } catch (e) {} return; }
    var won = toWon(v);
    pexSave(id, { expect_premium: String(won) }, function () {
      try { g.hmPexPut(id, won); } catch (e) {}
      cusSync(id, { expect_premium: won });
      try { g.toast('예상 월납 ' + v + '만원 — DB · 업적관리 · EM 상담 보드와 같은 칸에 적었어요'); } catch (e2) {}
      paint();
    });
  }
  function wonPut(id) {
    var v = numVal(); if (!v) { try { g.toast('금액을 적어 주세요'); } catch (e) {} return; }
    var won = toWon(v), td = ymdPlus(0);
    pexSave(id, { stage: '계약완료', contracted_at: new Date().toISOString(), policy_sent_at: '', contract_premium: String(won) }, function () {
      try { g.hdbLocal(id, { stage: '계약완료', contract: won, cAt: td }); } catch (e) {}
      try { g.hmPexRow(); } catch (e1) {}
      cusSync(id, { stage: '계약완료', contract_premium: won });
      try { g.toast('🎉 계약완료로 옮기고 계약 업적 ' + v + '만원을 적었어요 · 다음은 증권 전달이에요'); } catch (e2) {}
      paint();
    });
  }
  function goalVal(id) { var i = el(id); return Math.max(0, Math.round(+((i && i.value) || 0) || 0)); }
  function goalPer() {
    var p = goalVal('hv2GoalP'), c = goalVal('hv2GoalC'), o = el('hv2GoalPer'); if (!o) return;
    o.innerHTML = (p && c) ? '고객 한 분당 목표 <b>' + (Math.round(p / c * 10) / 10) + '만원</b> — 저절로 나와요' : '금액과 건수를 적으면 고객 한 분당 목표가 나와요';
  }
  function goalPut() {
    var p = goalVal('hv2GoalP'), c = goalVal('hv2GoalC');
    if (!p) { try { g.toast('목표 금액을 적어 주세요'); } catch (e) {} return; }
    if (typeof g.pfSave !== 'function') { API.goalOld(); return; }
    close();
    var done = function () { if (g.PF && !g.PF.loaded) { try { g.toast('목표를 ' + p + '만원' + (c ? ' · ' + c + '건' : '') + '으로 정했어요'); } catch (e) {} goalLoad(); } };
    try { var q = g.pfSave({ goal_prem: p, goal_case: c }, true); if (q && q.then) q.then(done); } catch (e) {}
  }
  function eveHtml(L) {
    var sub = T(function () { return g.hmNightSub(); }, '');
    var done = L ? ((L.all || 0) - ((L.list || []).length)) : 0;
    return '<button type="button" class="eve" onclick="HOME_V2.night()"><div class="tile">🌙</div><div class="tx"><div class="t1">오늘 돌아보기</div><div class="t2">' +
      E(strip(sub)) + ' · 끝낸 분 ' + done + '</div></div><span class="ar">›</span></button>';
  }
  /* ☰ 다른 메뉴 — 열 수 있는 것만 */
  function can(id) { return T(function () { return (typeof g.osTabAllowed !== 'function') || g.osTabAllowed(id); }, true); }
  /* 🗂 판 X531 — 사장님 말씀 「그 다음거 진행해 · 서랍에서는 숨기지마」(2026-11-24) · 단순화 순서 ④ 나머지(TA · 교육 · 고지 각 하나로).
     이 화면의 「다른 메뉴」 를 <b>시안 9차 PLACE · moreMenus 묶음</b>(쓰는 때 · 목적별)으로 세웁니다 —
       TA 대본 · 문자 · 화법서 · 거절 연습은 💬 화법 한 갈래, 교육 · 아카데미 · 신입 TA 연습은 📚 공부 한 갈래,
       고지 · 인수(알릴의무 · 인수 가능 여부)는 영업 한 바퀴 「청약」 칸 한 자리.
     ★ 표는 시안 PLACE 를 node 로 그대로 옮긴 것(손으로 안 적음) · 이름 · 그림은 메뉴 표(TABS) 한 곳에서.
     ★ 메뉴 표 · ☰ 서랍 · 화면은 안 건드림(서랍은 예전 묶음 그대로) · 표에 없는 화면(새로 생긴 것)은 <b>예전 묶음 이름 그대로</b> 맨 아래에 — 잃는 화면 없음.
     ★ AI 일곱은 판 X530 의 자비스 묶음(aiItems) 그대로. */
  var PLACE_G = {
    st_ta: ['ref_hidden'],
    st_ap: ['fact_find', 'fp_deck', 'kijun', 'sangdam', 'utphoto', 'cs_needs'],
    st_an: ['bojang', 'frmake', 'treatpay', 'wallets', 'interpret'],
    st_pc: ['onecmp', 'finance', 'compare', 'ai_prop', 'katalk', 'calc'],
    st_cs: ['ref_underwrite', 'med_disclosure', 'ref_jeonsan', 'cs_gso'],
    st_cm: ['pdel', 'claims', 'keep4', 'med_silbi', 'endorse', 'contracts', 'car_fault', 'med_checkup'],
    prod: ['insight', 'mikki_talk', 'mikki', 'biz_news'],
    talk: ['silson5', 'ta_script', 'ta_say', 'saybook', 'fp_talk', 'rej_gym'],
    study: ['edu', 'manual', 'apexmaster', 'bohum', 'academy', 'ta_train', 'jiin_grow', 'mycoach', 'bcd_lec', 'academy_notion', 'growboard', 'dz_guide'],
    grow: ['content', 'news_live', 'blog', 'threads', 'insta', 'video', 'calendar', 'simui', 'mkt_meta', 'mkt_volume', 'mkt_combine', 'mkt_landing', 'mkt_card', 'ext_reply', 'ext_thread', 'ext_naver'],
    cust: ['clients', 'crm', 'rjnews', 'home', 'ckboard', 'myperf', 'mycal'],
    find: ['ref_kcd', 'ref_surgery', 'ref_hira'],
    money: ['biz_diag', 'biz_fund', 'biz_tax', 'biz_ins', 'biz_retire', 'biz_staff', 'inv_stock', 'inv_fund', 'inv_perf', 'inv_econ'],
    team: ['airep', 'org', 'attend', 'audit', 'teamhub', 'daily', 'report', 'branch_coach', 'hq', 'emcenter', 'educal'],
    me: ['me', 'notice', 'settings', 'pricing', 'terms', 'ready', 'health', 'phone_app', 'voice'],
    ai: ['assistant', 'voiceasst', 'brain', 'cs_assist', 'ins_asst', 'apexmap', 'helpme']
  };
  var PLACE_T = [['st', '🛠 영업 한 바퀴 도구'], ['prod', '🧭 상품전략'], ['talk', '💬 화법'], ['study', '📚 공부'], ['grow', '📣 알리기'], ['cust', '👥 고객'],
    ['find', '🔎 찾아보기'], ['money', '🏢 법인 · 투자'], ['team', '👥 팀 관리'], ['me', '🙋 나 · 설정']];
  var STG_T = { st_ta: '첫 전화', st_ap: '첫 만남', st_an: '보장분석', st_pc: '제안', st_cs: '청약', st_cm: '관리' };
  function menuGroups() {
    var by = {}, seen = {}, G = [];
    (T(function () { return g.TABS; }, []) || []).forEach(function (gr) { (gr.items || []).forEach(function (it) { if (it && it.id && !by[it.id]) by[it.id] = { it: it, gt: gr.group || '' }; }); });
    var take = function (id) { var x = by[id]; if (!x || seen[id] || !can(id) || AI_IDS.indexOf(id) >= 0) return null; seen[id] = 1; return x.it; };
    PLACE_T.forEach(function (p) {
      var items = [];
      if (p[0] === 'st') ['st_ta', 'st_ap', 'st_an', 'st_pc', 'st_cs', 'st_cm'].forEach(function (k) { PLACE_G[k].forEach(function (id) { var it = take(id); if (it) items.push({ it: it, sub: STG_T[k] }); }); });
      else PLACE_G[p[0]].forEach(function (id) { var it = take(id); if (it) items.push({ it: it }); });
      if (items.length) G.push({ t: p[1], items: items });
    });
    var AIG = aiItems().filter(function (it) { if (seen[it.id]) return false; seen[it.id] = 1; return true; });
    if (AIG.length) G.push({ t: '🤖 자비스로 합친 AI', items: AIG.map(function (it) { return { it: it }; }) });
    /* 표에 없는 화면 — 예전 묶음 이름 그대로 */
    var rest = {}, rk = [];
    Object.keys(by).forEach(function (id) { var x = by[id]; if (seen[id] || !can(id)) return; seen[id] = 1; if (!rest[x.gt]) { rest[x.gt] = []; rk.push(x.gt); } rest[x.gt].push({ it: x.it }); });
    rk.forEach(function (t) { G.push({ t: t, items: rest[t] }); });
    return G;
  }
  function menuHtml() {
    var G = menuGroups();
    var n = G.reduce(function (a, gr) { return a + gr.items.length; }, 0);
    var h = '<button type="button" class="mm" onclick="HOME_V2.menu()"><span>☰ 다른 메뉴 펼쳐 보기</span><small>' + n + '개</small><span class="ar" style="transform:rotate(' + (MOPEN ? 90 : 0) + 'deg)">›</span></button>';
    if (!MOPEN) return h;
    h += '<div class="mmb"><button type="button" class="mmg' + (OLD ? ' on' : '') + '" onclick="HOME_V2.old()"><b>📋 예전 오늘 칸 ' + (OLD ? '접기' : '아래에 펼치기') + '</b><small>아침 미션 · 30일 약속 · 상담현황 …</small><span class="ar">›</span></button>';
    G.forEach(function (gr, gi) {
      var o = !!MG[gi];
      h += '<button type="button" class="mmg' + (o ? ' on' : '') + '" onclick="HOME_V2.mg(' + gi + ')"><b>' + E(gr.t) + '</b><small>' + gr.items.length + '</small><span class="ar">›</span></button>';
      if (o) h += '<div class="list" style="margin:0 0 8px">' + gr.items.map(function (x) {
        var it = x.it;
        return '<button type="button" class="li" onclick="go(\'' + Q(it.id) + '\')"><span class="e">' + E(it.icon || '•') + '</span><div class="tx"><div class="t1">' + E(it.title || it.id) + '</div>' + (x.sub ? '<div class="t2">' + E(x.sub) + '</div>' : '') + '</div><span class="ar">›</span></button>';
      }).join('') + '</div>';
    });
    return h + '</div>';
  }

  function html() {
    var L = T(function () { return g.hmLeft(); }, { list: [], all: 0 });
    return topHtml() + whoHtml() + helloHtml(L) + part(misHtml) + monHtml() + stepsHtml() + jvHtml() + railHtml(L) +
      inscHtml() + weekHtml() + part(routeHtml) + roadHtml() + eveHtml(L) + menuHtml() +
      dockHtml();
    /* ⚠ 판 X511 — 맨 아래 「새 오늘 화면 (시험) · 시안 9차 디자인 · …」 설명 줄을 거뒀습니다
         (시안에 없음 · 토스 원칙 ③ 화면에 설명 문장 금지). 예전 화면으로 가는 길은 맨 위 「↩ 예전 화면」 단추 하나. */
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
  /* 그 갈래 화면 목록(판 X513 까지 아래 칸을 누르면 뜨던 것) — 시트 맨 아래 「모든 화면」 과 dockAll */
  function dockRows(L) {
    var desc = function (id) { return strip(T(function () { var m = g.TAB_META[id]; return m && (m.desc || m.d || m.s); }, '') || ''); };
    return '<div class="list">' + L.map(function (it) {
      var d = desc(it.id);
      return '<button type="button" class="li" onclick="HOME_V2.close();go(\'' + Q(it.id) + '\')"><span class="e">' + E(it.icon || '•') + '</span><div class="tx"><div class="t1">' + E(it.title || it.id) + '</div>' +
        (d ? '<div class="t2">' + E(d) + '</div>' : '') + '</div><span class="ar">›</span></button>';
    }).join('') + '</div>';
  }
  function dockAll(k) {
    var D = DOCK[k]; if (!D) return;
    var L = dockItems(k);
    sheet('<h1>' + D.e + ' ' + E(D.t) + '</h1><div class="sub">' + E(D.h) + ' · ' + L.length + '곳</div><div style="margin-top:12px">' + dockRows(L) + '</div>');
  }
  function allBtn(k, n) { return n ? '<button type="button" class="btn g" onclick="HOME_V2.dockAll(\'' + k + '\')">' + DOCK[k].e + ' ' + DOCK[k].t + ' 모든 화면 ' + n + '곳 ›</button>' : ''; }

  /* 💬 화법 시트 (시안 9차 openTalk · 판 X514) — 단계 칩 → 그대로 말할 문장 · 복사 → 전체 대본.
     ★ 글은 라이브 원본에서 읽기만 — 첫 전화 · 부재 = APEX_STAGE.script(TA 대본 첫 마디 · SAY),
       거절 = APEX_STAGE.objList(TA 스크립트 거절 28가지), 만남 · 제안 · 청약 = 그 단계 할 일(aim · way · q) + TA_MSG 카톡,
       관리 = APEX_STAGE.pdel(증권 전달 차례). 시안의 예시 문장은 쓰지 않습니다(지어낸 말 없음).
     ★ 이름은 넣지 않고 「고객님」 — 오늘 화면엔 고른 고객이 없습니다(TA 대본과 같은 약속). */
  var TALK_TAB = [['ta', '📞 첫 전화'], ['miss', '📵 부재'], ['rej', '🙅 거절'], ['ap', '🤝 만남'], ['pc', '📄 제안'], ['cs', '✍️ 청약'], ['cm', '💌 관리']];
  var TALK_ST = { ta: 'TA', miss: '부재', ap: 'AP', pc: 'PC', cs: 'CS', cm: '계약완료' };
  var TALK_KK = { miss: ['miss'], ap: ['eve', 'go', 'thanks'], pc: ['report', 'later'], cs: ['signed'] };
  var TALKK = 'ta', REJ_ALL = 0, STUDY_ALL = 0, TXT = [];
  function sayBox(t, q2, tip) {
    if (!t) return '';
    var i = TXT.push(String(t)) - 1;
    return '<div class="say">' + (q2 ? '<div class="q">' + E(q2) + '</div>' : '') + E(t) +
      (tip ? '<div class="tp">' + E(strip(tip)) + '</div>' : '') + '<button type="button" class="cp" onclick="HOME_V2.talkCp(' + i + ')">📋 복사</button></div>';
  }
  function kakaoOf(k) {
    var f = { c: '고객', me: T(function () { return g.OS.profile.name; }, '') || '', area: T(function () { return g.HM_TAMSG.area(); }, '') || '' };
    return String(T(function () { return g.TA_MSG.textFor(k, f, 'kakao'); }, '') || '');
  }
  function talkSheet() {
    var A = T(function () { return g.APEX_STAGE; }, null);
    TXT = [];
    var h = '<h1>💬 화법</h1><div class="sub">단계를 고르면 그대로 말할 문장이 나와요</div>' +
      '<div class="tseg">' + TALK_TAB.map(function (x) { return '<button type="button" class="' + (TALKK === x[0] ? 'on' : '') + '" onclick="HOME_V2.talk(\'' + x[0] + '\')">' + x[1] + '</button>'; }).join('') + '</div>';
    var st = TALK_ST[TALKK], M = st && A ? T(function () { return A.of(st); }, null) : null;
    if (M && TALKK !== 'miss') {
      h += '<div class="hint"><b>' + E(strip(A.aimText(st))) + '</b> — ' + E(strip(A.wayText(st))) + '</div>';
      if (M.note) h += '<div class="hint" style="color:var(--warn);background:var(--warn-l)">' + E(strip(M.note)) + '</div>';
    }
    if (TALKK === 'ta' || TALKK === 'miss') {
      var S = A ? T(function () { return A.script(st); }, null) : null;
      if (S) h += '<h2>' + E(TALKK === 'ta' ? '첫 마디 — ' + (S.t || '') : S.t || '') + '</h2>' + sayBox(S.say, '', S.tip);
    }
    if (TALKK === 'rej') {
      var O = A ? (T(function () { return A.objList(); }, []) || []) : [], n = REJ_ALL ? O.length : 6;
      h += '<h2>이 말이 나오면 <small>' + O.length + '가지 · TA 스크립트 거절 처리</small></h2>' +
        O.slice(0, n).map(function (o) { return sayBox(strip(o.one || o.text || ''), '「' + strip(o.title || '') + '」', o.tone); }).join('') +
        (O.length > n ? '<button type="button" class="btn g" onclick="HOME_V2.talkMore()">나머지 ' + (O.length - n) + '가지 더 보기</button>' : '');
    }
    if (M && M.q && M.q.length && TALKK !== 'miss') h += '<h2>이 자리에서 가릴 것</h2><div class="say">' + M.q.map(function (x) { return '· ' + E(strip(x)); }).join('<br>') + '</div>';
    if (TALKK === 'cm') {
      var P = A ? (T(function () { return A.pdel; }, []) || []) : [];
      if (P.length) h += '<h2>증권 전할 때 — 말하는 차례</h2>' + P.map(function (p) { return sayBox(p.say, (p.n ? p.n + '. ' : '') + strip(p.t || ''), p.no); }).join('');
    }
    (TALK_KK[TALKK] || []).forEach(function (k) {
      var t = kakaoOf(k); if (t) h += '<h2>💬 카톡 — ' + E(msgTitle(k) || k) + '</h2>' + sayBox(t);
    });
    var L = dockItems('talk');
    h += '<h2>전체 대본 · 화법서</h2>' + dockRows(L.slice(0, 5)) + allBtn('talk', L.length > 5 ? L.length : 0);
    sheet(h);
  }

  /* 🧭 상품전략 시트 (시안 9차 openProd · 판 X514) — 이번 달 상황별 1위 상품 → 오늘 볼 분 중 맞는 분 → 그 상황 구실.
     ★ 상품 = HM_DOOR_TOP(상품전략기와 같은 순위) · 구실 = MK_TALK hook · 맞는 분 = 오늘 할 일(hmSteps) 중 HM_DOOR.pick 이 그 상황을 고른 분.
       오늘 화면 「상품전략」 줄과 같은 자(doorOf)라 숫자가 같습니다. 새로 세는 것 없음. */
  function prodSheet() {
    var tops = T(function () { return g.HM_DOOR_TOP.cats; }, null) || {}, CATS = T(function () { return g.MK_TALK.CATS; }, {}) || {};
    var by = {}, S = T(function () { return g.hmSteps(); }, []) || [];
    S.forEach(function (x) { var D = doorOf(x); if (D.cat) (by[D.cat] = by[D.cat] || []).push(x); });
    var ks = Object.keys(tops).filter(function (k) { return (tops[k] || []).length && CATS[k]; });
    ks.sort(function (a, b) { return ((by[b] || []).length - (by[a] || []).length); });
    var mo = T(function () { return (+g.HM_DOOR_TOP.month.slice(5)) + '월'; }, '이번 달');
    var h = '<h1>🧭 ' + E(mo) + ' 상품전략</h1><div class="sub">이번 달 상품을 내 고객에게 맞춰, 연락할 구실로 바꿔 드려요</div>';
    if (!ks.length) h += '<div class="say">이번 달 상품이 아직 안 들어왔어요 — 상품전략기에서 소식지를 넣으면 여기 서요</div>';
    ks.forEach(function (k) {
      var C = CATS[k], P = tops[k][0] || {}, L = by[k] || [];
      h += '<div class="pcard"><div class="ph"><b>' + E(C.label || k) + '</b><span>' + (L.length ? '오늘 볼 분 ' + L.length + '명' : '') + '</span></div>' +
        (C.hook ? '<div class="hk">「' + E(strip(C.hook)) + '」</div>' : '') +
        '<div class="p1">이번 달 1위 · ' + E([P.co, P.nm].filter(Boolean).join(' · ')) + '</div>' +
        L.slice(0, 3).map(function (x) {
          return '<button type="button" class="mini" onclick="HOME_V2.close();hmOpen(\'' + Q(x.key) + '\')"><span class="av">' + E(String(nameOf(x)).replace(/^\s*\[[^\]]*\]\s*/, '').charAt(0) || '·') + '</span><span class="tx"><b>' + E(nameOf(x)) + '님</b><small>' + E(strip(T(function () { return g.hmWhy(x); }, '') || x.s || '')) + '</small></span><span class="go">이분 ›</span></button>';
        }).join('') +
        '<button type="button" class="door" onclick="HOME_V2.close();hmDoorGo(\'' + Q(k) + '\',\'\')">🎣 이 구실로 문 열기 ›</button></div>';
    });
    var L2 = dockItems('prod').filter(function (it) { return it.id !== 'insight'; });
    h += '<button type="button" class="btn p" onclick="HOME_V2.close();hmDoorGo(\'\',\'\')">상품전략기 전체 열기</button>' +
      (L2.length ? '<h2>연락 거리 · 비교</h2>' + dockRows(L2.slice(0, 4)) + allBtn('prod', L2.length > 4 ? L2.length + 1 : 0) : '');
    sheet(h);
  }

  /* 🧭 상황 하나 (시안 9차 openInsK · 판 X529) — 오늘 「상품전략」 칸에서 상황을 누르면 앱 안 시트 먼저:
     구실(MK_TALK hook) → 이번 달 상품 순위(HM_DOOR_TOP — 상품전략기와 같은 순위) → 이 이야기로 연락할 오늘 볼 분(doorOf — 위 시트와 같은 자) → 맨 아래에서 상품전략기 「🎣 문 열기」.
     시안은 「내 고객」 전부를 세지만 라이브는 오늘 볼 분(hmSteps)만 압니다 — 그렇게 적습니다. */
  function insKSheet(k) {
    var tops = T(function () { return g.HM_DOOR_TOP.cats; }, null) || {}, C = T(function () { return g.MK_TALK.CATS[k]; }, null), P = tops[k] || [];
    if (!C || !P.length) { try { g.hmDoorGo(k, ''); } catch (e) {} return; }
    var L = (T(function () { return g.hmSteps(); }, []) || []).filter(function (x) { return doorOf(x).cat === k; });
    var h = '<div class="who2">이번 달 상품전략</div><h1>🧭 ' + E(C.label || k) + '</h1>' +
      (C.hook ? '<div class="say">「' + E(strip(C.hook)) + '」</div>' : '') +
      '<div class="rprod">' + P.map(function (p, i) { return (i + 1) + '. ' + E([p.co, p.nm].filter(Boolean).join(' · ')); }).join('<br>') + '<small>설계사용 · 소식지 기준 · 상품전략기와 같은 순위</small></div>' +
      '<h2>이 이야기로 연락할 오늘 볼 분 <small>' + L.length + '명</small></h2>' +
      (L.length ? '<div class="pcard">' + L.map(function (x) {
        return '<button type="button" class="mini" onclick="HOME_V2.close();hmOpen(\'' + Q(x.key) + '\')"><span class="av">' + E(String(nameOf(x)).replace(/^\s*\[[^\]]*\]\s*/, '').charAt(0) || '·') + '</span><span class="tx"><b>' + E(nameOf(x)) + '님</b><small>' + E(strip(T(function () { return g.hmWhy(x); }, '') || x.s || '')) + '</small></span><span class="ar">›</span></button>';
      }).join('') + '</div>' : '<div class="sub">오늘 볼 분 가운데 이 상황인 분은 없어요</div>') +
      '<button type="button" class="btn p" onclick="HOME_V2.close();hmDoorGo(\'' + Q(k) + '\',\'\')">상품전략기 「🎣 문 열기」 로 이어 보기</button>';
    sheet(h);
  }

  /* 📚 공부 시트 (시안 9차 openStudy · 판 X514) — 오늘의 공부 하나 → 내 길 → 과정.
     ★ 「오늘의 공부」 = 🌱 성장 로드맵(app/apex-grow.js)의 「지금 할 것 하나」 그대로 — 내 레벨(grState)에서 아직 안 끝낸 첫 걸음(grSteps · grIsOn).
       여는 문도 그 걸음의 것(now.open) · 끝냈다는 체크는 성장 화면에서(이 시트는 읽기만). 성장 로드맵이 없는 판이면 이 칸만 빠집니다. */
  function studyNow() {
    var v = T(function () { return g.grState(); }, null), LV = T(function () { return g.GR_LV; }, null);
    if (!v || !LV || !LV.length) return null;
    var lv = Math.max(0, Math.min(+v.lv || 0, LV.length - 1)), s = T(function () { return g.grSteps(lv); }, []) || [], nd = 0, now = null;
    s.forEach(function (x) { if (T(function () { return g.grIsOn(x, v); }, false)) nd++; else if (!now) now = x; });
    return { lv: lv, L: LV[lv] || {}, n: s.length, nd: nd, now: now, last: lv >= LV.length - 1 };
  }
  function studySheet() {
    var N = studyNow(), h = '<h1>📚 공부</h1><div class="sub">오늘 하나만 하면 돼요</div>';
    if (N && N.now) {
      var x = N.now;
      h += '<div class="scard"><div class="k">오늘의 공부 · Lv.' + N.lv + ' 다음 걸음</div><div class="n">' + E((x.ic || '') + ' ' + (x.n || '')) + '</div>' +
        (x.d ? '<div class="d">' + E(strip(x.d)) + '</div>' : '') +
        (x.pass ? '<div class="d"><b>합격 기준</b> — ' + E(strip(x.pass)) + '</div>' : '') +
        (x.done ? '<div class="d"><b>끝 기준</b> — ' + E(strip(x.done)) + '</div>' : '') +
        (x.open ? '<button type="button" class="btn p" onclick="HOME_V2.close();' + E(x.open) + '">시작하기</button>' : '') + '</div>';
    } else if (N && N.n) {
      h += '<div class="scard"><div class="k">Lv.' + N.lv + ' 끝</div><div class="n">' + E(N.L.t || '') + ' 을 다 걸었어요 🎉</div><div class="d">' + (N.last ? '마지막 레벨이에요' : '다음 레벨은 성장 로드맵에서 골라요') + '</div></div>';
    }
    if (N && can('edu')) h += '<h2>내 길</h2><div class="list"><button type="button" class="li" onclick="HOME_V2.close();go(\'edu\')"><span class="e">🌱</span><div class="tx"><div class="t1">성장 로드맵 · Lv.' + N.lv + ' ' + E(N.L.t || '') + '</div>' +
      '<div class="t2">' + E((N.L.s ? N.L.s + ' · ' : '') + N.nd + ' / ' + N.n + ' 걸음') + '</div></div><span class="ar">›</span></button></div>';
    var L = dockItems('study').filter(function (it) { return it.id !== 'edu'; }), n = STUDY_ALL ? L.length : 5;
    if (L.length) h += '<h2>과정 <small>' + L.length + '개</small></h2>' + dockRows(L.slice(0, n)) +
      (L.length > 5 ? '<button type="button" class="btn g" onclick="HOME_V2.studyMore()">' + (STUDY_ALL ? '접기' : '더 보기 ' + (L.length - 5) + '개') + '</button>' : '');
    sheet(h);
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
    /* 한 번에 80분씩 — 주소 줄이 너무 길어지지 않게 (판 X510 · 추천 동선이 한 분의 배정 DB 를 다 봄) */
    for (var c = 0; c < need.length; c += 80) (function (part) {
      try {
        sb.from('dbs').select('id,lat,lng,next_appt_lat,next_appt_lng,next_appt_place').in('id', part).then(function (r) {
          if (r && r.error) { GEO_OFF = true; return; }       /* 좌표 칸이 없는 서버(migration_46 전) — 조용히 물러남 */
          ((r && r.data) || []).forEach(function (d) { GEO[d.id] = d; });
          paint();
        }, function () { GEO_OFF = true; });
      } catch (e) { GEO_OFF = true; }
    })(need.slice(c, c + 80));
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
    var L = legs(P); out.km = L.km; out.real = L.real;
    return out;
  }
  /* 차례대로 놓인 점들의 거리 — 길찾기로 재 둔 구간은 그 값, 아니면 어림(직선 × 1.35) + 길찾기에 묻기 */
  function legs(P) {
    var C = rkCache(), km = 0, real = true, ask = [];
    for (var i = 1; i < P.length; i++) {
      var w = C[rkKey(P[i - 1], P[i])], st = hav(P[i - 1], P[i]);
      /* ⚠ 같은 건물·같은 주소(50m 안)는 길찾기가 답을 안 줍니다(라이브에서 null 로 옴) — 0km 로 치고 안 묻습니다.
           안 그러면 그 한 구간 때문에 전체가 늘 「(어림)」 으로 남았습니다. */
      if (st < 0.05) continue;
      if (w && w.km != null) km += +w.km;
      else { km += st * 1.35; real = false; ask.push({ a: P[i - 1], b: P[i] }); }
    }
    if (ask.length) rkAsk(ask);
    return { km: km, real: real };
  }

  /* 📍 <b>약속이 없는 날의 추천 동선</b> — 사장님 말씀 (2026-11-20) 「약속이 없어도 목각처럼 띄울수 있도록
     해결할 방법을 찾아서 띄어줘」.
     ⚠ 라이브의 「권한 동네」(hmRtWhere · hmRtMeet)는 <b>늘 로그인한 본인 기준</b>(hmTmMe)이라, 배정 DB 가
       거의 없는 대표 계정이나 팀원 화면에서는 비었습니다. 그래서 <b>지금 보고 있는 분(hwhoFor)</b>의 배정 DB 로 셉니다.
     ★ 동네 — 오늘 볼 분(hmSteps)이 있는 동네가 먼저, 없으면 만날 분이 가장 많은 동네(hmRtKey 로 같은 동네를 묶음).
     ★ 들를 분 — 그 동네의 만남(AP) → 제안(PC) → 청약(CS) → 연락(TA) → 첫 전화(미접촉·부재) 차례로 여섯 분까지.
       거절·계약 끝난 분은 안 넣습니다.
     ★ 길 — 좌표(지역 동선이 적어 둔 dbs 칸)가 있는 분만, 첫 분에서 가장 가까운 분을 차례로 잇습니다.
       거리는 약속 동선과 같은 자(길찾기 · 어림). 좌표가 없는 분은 「주소 모르는 곳 N」.
     ★ 동네가 적힌 분이 하나도 없으면 <b>지어내지 않고</b> 지역 동선에서 동네를 고르게 안내합니다. */
  var REC_ORD = { AP: 1, PC: 2, CS: 3, TA: 4, '미접촉': 5, '부재': 6 };
  function recRoute() {
    var who = T(function () { return g.hwhoFor(); }, '') || '', all = T(function () { return g.hwhoIsAll(); }, false);
    /* 같은 동네를 하나로 — 「광양」·「광양시」·「광양 시」 (판 X510 · 라이브에서 좌표 있는 분이 「광양시」 쪽에 따로 있었음) */
    var key = function (v) { return String(v == null ? '' : v).replace(/\s+/g, '').replace(/(특별자치시|특별자치도|특별시|광역시|시|군)$/, ''); };
    var rows = (T(function () { return g.AR.db; }, []) || []).filter(function (r) {
      return r && r.id && r.region && REC_ORD[String(r.stage || '미접촉')] && (all || !who || r.who === who);
    });
    if (!rows.length) return { rg: '', list: [], km: null, miss: 0 };
    var by = {}, today = {};
    (T(function () { return g.hmSteps(); }, []) || []).forEach(function (x) { if (x && x.region) today[key(x.region)] = 1; });
    rows.forEach(function (r) { var k = key(r.region); (by[k] = by[k] || []).push(r); });
    /* ★ 판 X510 — 좌표가 있는 분을 먼저. 라이브에서 팀원 화면을 차례로 열어 보니 단계 차례 앞 여섯 분이
         모두 좌표가 없어 「주소 모르는 곳 6」 만 서고 거리가 빈 경우가 셋이었습니다.
         ① 이분의 배정 DB 좌표를 한 번 읽고(80분씩 · 처음 한 번만) ② 동네는 「오늘 볼 분이 있는 곳」 다음
         「좌표 있는 분이 많은 곳」 다음 「분이 많은 곳」 ③ 그 동네에서 단계 차례는 지키되 <b>좌표가 있는 분부터</b>
         여섯. 모자라면 좌표 없는 분으로 채우고 「주소 모르는 곳」 으로 적습니다(지어내지 않음). */
    var ord0 = function (a, b) { return (REC_ORD[a.stage || '미접촉'] - REC_ORD[b.stage || '미접촉']) || ((b.days || 0) - (a.days || 0)); };
    geoLoad(rows.slice().sort(ord0).slice(0, 400).map(function (r) { return r.id; }));
    var geoN = function (k) { return by[k].filter(function (r) { return !!ptOf(GEO[r.id]); }).length; };
    var ks = Object.keys(by).sort(function (a, b) {
      return ((today[b] ? 1 : 0) - (today[a] ? 1 : 0)) || (geoN(b) - geoN(a)) || (by[b].length - by[a].length);
    });
    var pool = by[ks[0]].slice().sort(ord0);
    var has = pool.filter(function (r) { return !!ptOf(GEO[r.id]); });
    var pick = has.slice(0, 6);
    pool.forEach(function (r) { if (pick.length < 6 && pick.indexOf(r) < 0 && !ptOf(GEO[r.id])) pick.push(r); });
    var pts = [], miss = 0;
    pick.forEach(function (r) { var p = ptOf(GEO[r.id]); if (p) pts.push({ p: p, r: r }); else if (GEO[r.id] || GEO_OFF) miss++; });
    /* 가장 가까운 분을 차례로 — 첫 분은 단계가 가장 앞선 분 */
    var ord = [];
    if (pts.length) {
      var left = pts.slice(1); ord.push(pts[0]);
      while (left.length) {
        var last = ord[ord.length - 1].p, bi = 0, bd = Infinity;
        left.forEach(function (q, i) { var dd = hav(last, q.p); if (dd < bd) { bd = dd; bi = i; } });
        ord.push(left.splice(bi, 1)[0]);
      }
    }
    var L = ord.length >= 2 ? legs(ord.map(function (o) { return o.p; })) : null;
    var list = ord.map(function (o) { return o.r; }).concat(pick.filter(function (r) { return !ord.some(function (o) { return o.r === r; }); }));
    return { rg: by[ks[0]][0].region, list: list, km: L ? L.km : null, real: L ? L.real : false, miss: miss };
  }

  /* 📍 <b>오늘 동선 카드</b> — 사장님 말씀 (2026-11-21) 「오늘 어디가는지랑 지역동선 다 어디갔는데 없잖아」.
     예전 오늘 화면에는 「🗺️ 지역 동선 →」 카드와 「오늘 약속」 목록이 따로 섰는데, 새 화면에서는 이번 주 칸 맨 아래
     한 줄로만 남아 거의 안 보였습니다. 시안 4차 routeCard 그대로 카드 한 장을 늘 세우고, 누르면 시안 openRoute 시트.
     ★ 약속 = hmRtAppts(라이브 「오늘 약속」 그대로) · 장소 = dbs.next_appt_place · 거리 = route()/recRoute() 와 같은 자
     ★ 들를 분 = 약속이 있으면 hmRtNear(라이브 「가는 김에 걸 분」) · 없으면 추천 동선(recRoute)
     ★ 그림은 <b>실제 좌표를 줄여 그린 것</b> — 좌표 없는 분은 그리지 않고 「주소 모르는 곳」 으로만. 크게는 지역 동선(hmRtOpen · 카카오맵) */
  function part(fn) { try { return fn() || ''; } catch (e) { return ''; } }
  function kmTxt(km, real) { return km == null ? '' : ((km < 1 ? Math.round(km * 1000) + 'm' : km.toFixed(1) + 'km') + (real ? '' : '(어림)')); }
  function routeData() {
    var A = T(function () { return g.hmRtAppts(); }, []) || [], R = route();
    if (A.length) {
      var near = T(function () { return g.hmRtNear(); }, []) || [];
      return { kind: 'appt', A: A, km: R.km, real: R.real, miss: R.miss, rg: (A[0] && A[0].rg) || '', near: near.map(function (x) { return { id: x.id, nm: x.t || x.name || x.nm || '', why: [x.sub, x.s].filter(Boolean).join(' · ') }; }) };
    }
    var RR = recRoute();
    if (RR.list.length) return { kind: 'rec', A: [], km: RR.km, real: RR.real, miss: RR.miss, rg: RR.rg,
      near: RR.list.map(function (r) { return { id: r.id, nm: r.name || '', why: [r.stage || '첫 전화', [r.region, r.dong].filter(Boolean).join(' ')].join(' · '), tel: r.phone || '' }; }) };
    var AN = recAny();
    if (AN.length) return { kind: 'any', A: [], km: null, near: AN.map(function (r) { return { id: r.id, nm: r.name || '', why: [r.stage || '첫 전화', '동네 모름'].join(' · ') }; }) };
    return { kind: 'none', A: [], near: [] };
  }
  /* 📍 동네가 적힌 분이 하나도 없을 때 — 길은 못 짜도 <b>오늘 만나면 좋을 분</b>은 추천합니다 (사장님 말씀 2026-11-21
     「약속 없어도 추천 띄우고」). 지금 보고 있는 분(hwhoFor)의 배정 DB 에서 추천 동선과 같은 차례(AP → PC → CS → TA → 첫 전화),
     오래 연락 못 한 분 먼저, 셋까지. 동네는 지어내지 않고 「동네 모름」. */
  function recAny() {
    var who = T(function () { return g.hwhoFor(); }, '') || '', all = T(function () { return g.hwhoIsAll(); }, false);
    var rows = (T(function () { return g.AR.db; }, []) || []).filter(function (r) {
      return r && r.id && REC_ORD[String(r.stage || '미접촉')] && (all || !who || r.who === who);
    });
    return rows.sort(function (a, b) { return (REC_ORD[a.stage || '미접촉'] - REC_ORD[b.stage || '미접촉']) || ((b.days || 0) - (a.days || 0)); }).slice(0, 3);
  }
  function routeHtml() {
    var D = routeData(), t1, t2;
    if (D.kind === 'appt') { t1 = '오늘 동선' + (D.km != null ? ' ' + kmTxt(D.km, D.real) : '') + ' · 약속 ' + D.A.length + '곳'; t2 = [D.rg, '가는 김에 들를 분 ' + D.near.length + '명', D.miss ? '주소 모르는 곳 ' + D.miss : ''].filter(Boolean).join(' · '); }
    else if (D.kind === 'rec') { t1 = '오늘은 약속이 없어요 · 추천 동선 ' + D.rg; t2 = ['들를 분 ' + D.near.length + '명', D.km != null ? kmTxt(D.km, D.real) : '', D.miss ? '주소 모르는 곳 ' + D.miss : ''].filter(Boolean).join(' · '); }
    else if (D.kind === 'any') { t1 = '오늘은 약속이 없어요 · 만날 분 추천 ' + D.near.length + '명'; t2 = '동네가 적힌 고객이 아직 없어요 — 지역 동선에서 동네를 고르면 길까지 짜 드려요'; }
    else { t1 = '🗺️ 지역 동선'; t2 = '동네가 적힌 고객이 아직 없어요 — 동네를 골라 하루를 묶어요'; }
    return '<button type="button" class="rtc" onclick="HOME_V2.route()"><div class="tile">📍</div><div class="tx"><div class="t1">' + E(t1) + '</div><div class="t2">' + E(t2) + '</div></div><span class="ar">›</span></button>';
  }
  /* 실제 좌표를 340×190 에 줄여 그림 — 약속은 파란 번호, 들를 분은 주황 동그라미 */
  function mapSvg(stops, near) {
    var P = [];
    stops.forEach(function (s, i) { var p = ptOf(GEO[s.id]); if (p) P.push({ p: p, k: 's', n: i + 1 }); });
    near.forEach(function (s) { var p = ptOf(GEO[s.id]); if (p) P.push({ p: p, k: 'n' }); });
    if (!P.length) return '';
    var la = P.map(function (o) { return o.p.lat; }), ln = P.map(function (o) { return o.p.lng; });
    var a0 = Math.min.apply(null, la), a1 = Math.max.apply(null, la), n0 = Math.min.apply(null, ln), n1 = Math.max.apply(null, ln);
    var sx = function (v) { return n1 === n0 ? 170 : 30 + (v - n0) / (n1 - n0) * 280; }, sy = function (v) { return a1 === a0 ? 95 : 160 - (v - a0) / (a1 - a0) * 130; };
    var h = '<svg viewBox="0 0 340 190" class="mapsvg" role="img" aria-label="오늘 동선 그림"><rect width="340" height="190" rx="16" fill="#EEF2F6"/>';
    var S = P.filter(function (o) { return o.k === 's'; });
    if (S.length > 1) h += '<path d="' + S.map(function (o, i) { return (i ? 'L' : 'M') + sx(o.p.lng).toFixed(1) + ' ' + sy(o.p.lat).toFixed(1); }).join(' ') + '" stroke="#1A56DB" stroke-width="4" stroke-dasharray="2 7" stroke-linecap="round" fill="none"/>';
    P.filter(function (o) { return o.k === 'n'; }).forEach(function (o) { h += '<circle cx="' + sx(o.p.lng).toFixed(1) + '" cy="' + sy(o.p.lat).toFixed(1) + '" r="7" fill="#fff" stroke="#C2410C" stroke-width="3"/>'; });
    /* 같은 건물처럼 거의 같은 자리(12px 안)는 한 점으로 묶어 「1·2·3」 — 겹쳐서 번호가 사라지지 않게 */
    var G = [];
    S.forEach(function (o) { var x = sx(o.p.lng), y = sy(o.p.lat), q = G.filter(function (k) { return Math.abs(k.x - x) < 12 && Math.abs(k.y - y) < 12; })[0]; if (q) q.n.push(o.n); else G.push({ x: x, y: y, n: [o.n] }); });
    G.forEach(function (k) { var t = k.n.join('·'), r = t.length > 2 ? 9 + t.length * 3.6 : 13; h += (t.length > 2 ? '<rect x="' + (k.x - r).toFixed(1) + '" y="' + (k.y - 13).toFixed(1) + '" width="' + (2 * r).toFixed(1) + '" height="26" rx="13" fill="#1A56DB"/>' : '<circle cx="' + k.x.toFixed(1) + '" cy="' + k.y.toFixed(1) + '" r="13" fill="#1A56DB"/>') + '<text x="' + k.x.toFixed(1) + '" y="' + (k.y + 5).toFixed(1) + '" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">' + t + '</text>'; });
    return h + '</svg><div class="mapnote">실제 위치를 줄여 그린 그림이에요 · 크게는 카카오맵에서</div>';
  }
  function routeSheet() {
    var D = routeData();
    var lead = D.kind === 'none' ? '오늘 약속도, 동네가 적힌 고객도 아직 없어요' : D.kind === 'any' ? '동네가 적힌 분이 없어 길은 못 짜요 — 만날 분만 추천해요' : [D.rg, D.km != null ? '약 ' + kmTxt(D.km, D.real) : '', D.miss ? '주소 모르는 곳 ' + D.miss : ''].filter(Boolean).join(' · ');
    var h = '<h1>📍 ' + (D.kind === 'rec' ? '추천 동선' : D.kind === 'any' ? '오늘 만날 분 추천' : '오늘 동선') + '</h1><div class="sub">' + E(lead) + '</div>';
    h += (D.kind === 'none' || D.kind === 'any') ? '' : (D.kind === 'rec' ? mapSvg(D.near, []) : mapSvg(D.A, D.near));
    if (D.A.length) h += '<h2>약속</h2><div class="list">' + D.A.map(function (a, i) {
      var pl = (GEO[a.id] && GEO[a.id].next_appt_place) || '';
      return '<button type="button" class="li" onclick="HOME_V2.close();hmRtPerson(\'' + Q(a.id) + '\')"><div class="tile no">' + (i + 1) + '</div><div class="tx"><div class="t1">' + E((a.hm || '시간 미정') + ' · ' + nameOf({ t: a.nm }) + '님') + '</div>' +
        '<div class="t2">' + E([pl || '장소 미정', a.st].filter(Boolean).join(' · ')) + '</div></div><span class="ar">›</span></button>';
    }).join('') + '</div>';
    if (D.near.length) h += '<h2>' + (D.kind === 'rec' ? '들를 분' : D.kind === 'any' ? '만날 분' : '가는 김에 들를 분') + ' <small>' + (D.kind === 'rec' ? '같은 동네 · 가까운 차례로' : D.kind === 'any' ? '만남 → 제안 → 청약 → 연락 차례' : '같은 동네 · 연락 주기가 된 분') + '</small></h2><div class="list">' + D.near.slice(0, 8).map(function (n) {
      return '<button type="button" class="li" onclick="HOME_V2.close();hmRtPerson(\'' + Q(n.id) + '\')">' + (D.kind === 'rec' ? '<div class="tile no">' + (D.near.indexOf(n) + 1) + '</div>' : '<div class="tile w">📞</div>') + '<div class="tx"><div class="t1">' + E(nameOf({ t: n.nm }) + '님') + '</div><div class="t2">' + E(n.why) + '</div></div><span class="ar">›</span></button>';
    }).join('') + '</div>';
    h += '<button type="button" class="btn p" style="margin-top:14px" onclick="HOME_V2.close();hmRtOpen()">🗺 지역 동선 · 카카오맵으로 크게 보기</button>';
    sheet(h);
  }
  /* 📅 <b>일정 넣기</b> — 사장님 말씀 (2026-11-21) 「캘린더 입력이 편해야 하는데 갤럭시든 아이폰 이든」. 시안 6차 「＋ 일정 넣기」.
     ★ 날짜 · 시각은 <b>단추 한 번</b>(오늘 · 내일 · 모레 / 10시 · 14시 · 19시)이 먼저, 그 밖은 폰 기본 고르개(input date · time —
       갤럭시 · 아이폰이 저마다 제 달력 휠을 띄움).
     ★ <b>저장 코드를 새로 짜지 않습니다</b> — 내 일정은 mcalMyPut(내 캘린더와 같은 칸 · 같은 id), 고객 일정은 mcalCusPut
       (앞날은 다음 할 일 · 지난날은 접촉 기록 — 고객 365일과 같은 자리). 고르는 날은 MCAL.sel 한 곳.
     ★ 넣은 뒤 「📲 폰 달력에 넣기」 = 라이브 icsBuild 로 그 일정 한 건 .ics(아이폰 · 갤럭시 달력이 받음 · 알림 포함),
       「Google 캘린더」 는 구글 달력 추가 화면을 엶(갤럭시에서 구글 달력 쓰실 때). 고객 이름은 폰 달력으로 나갈 때 mcalOutName 으로 가림.
     ★ 판 X516 — 달력 탭의 「📲 폰 달력에도 담기」 스위치(CAL_V2.icsOn · 이 기기에만)가 켜져 있으면 「넣기」 를 누른 그 순간 그 한 건의 .ics 를 바로 받습니다
       (같은 schedIcs · 누르는 손길 안이라 폰이 막지 않음). 웹앱은 폰 달력에 저절로 넣을 권한이 없어 이것이 「담기」 의 전부입니다. */
  var SCH = { tab: 'me', ds: '', hm: '', cid: '', done: null };
  function ymdAdd(n) { var t = T(function () { return g.mcalToday(); }, '') || new Date().toISOString().slice(0, 10); var d = new Date(t + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function schedHtml() {
    var cs = T(function () { return g.mcalCusList(); }, []) || [], HOW = T(function () { return g.CM_HOW; }, ['전화']) || ['전화'];
    var dayB = [[0, '오늘'], [1, '내일'], [2, '모레']].map(function (x) { var d = ymdAdd(x[0]); return '<button type="button" class="' + (SCH.ds === d ? 'on' : '') + '" onclick="HOME_V2.schedSet(\'ds\',\'' + d + '\')">' + x[1] + '<small>' + (+d.slice(5, 7)) + '/' + (+d.slice(8, 10)) + '</small></button>'; }).join('');
    var tmB = ['10:00', '14:00', '19:00'].map(function (t) { return '<button type="button" class="' + (SCH.hm === t ? 'on' : '') + '" onclick="HOME_V2.schedSet(\'hm\',\'' + t + '\')">' + t + '</button>'; }).join('') +
      '<button type="button" class="' + (!SCH.hm ? 'on' : '') + '" onclick="HOME_V2.schedSet(\'hm\',\'\')">시각 없이</button>';
    var h = '<h1>📅 일정 넣기</h1>';
    if (SCH.done) {
      var D = SCH.done;
      return h + '<div class="sch-ok"><b>✓ 넣었어요</b><span>' + E(D.label) + '</span></div>' +
        (D.ics ? '<div class="sub" style="margin-top:8px">📲 폰 달력 파일도 받았어요 — 끄려면 달력 탭 맨 아래 「폰 달력에도 담기」</div>' : '') +
        '<button type="button" class="btn p" style="margin-top:12px" onclick="HOME_V2.schedIcs()">📲 폰 달력에 ' + (D.ics ? '다시 받기' : '넣기') + ' <small style="font-weight:600;opacity:.85">아이폰 · 갤럭시</small></button>' +
        '<a class="btn g" style="margin-top:8px" target="_blank" rel="noopener" href="' + E(D.gcal) + '">Google 캘린더로</a>' +
        '<div class="sub" style="margin-top:8px">받은 파일을 누르면 폰 달력이 「추가」 를 물어요 · 알림은 그 시각에 울려요</div>' +
        '<button type="button" class="btn g" style="margin-top:12px" onclick="HOME_V2.sched()">＋ 하나 더 넣기</button>';
    }
    h += '<div class="seg2"><button type="button" class="' + (SCH.tab === 'me' ? 'on' : '') + '" onclick="HOME_V2.schedSet(\'tab\',\'me\')">📌 내 일정</button>' +
      '<button type="button" class="' + (SCH.tab === 'cus' ? 'on' : '') + '" onclick="HOME_V2.schedSet(\'tab\',\'cus\')">👤 고객 일정</button></div>';
    h += '<h2>언제</h2><div class="chipr">' + dayB + '<label class="pick">📆 다른 날<input type="date" value="' + E(SCH.ds) + '" onchange="HOME_V2.schedSet(\'ds\',this.value)"></label></div>';
    h += '<div class="chipr" style="margin-top:6px">' + tmB + '<label class="pick">🕘 시각<input type="time" value="' + E(SCH.hm) + '" onchange="HOME_V2.schedSet(\'hm\',this.value)"></label></div>';
    h += '<div class="sub" style="margin-top:6px">' + E(SCH.ds ? (+SCH.ds.slice(5, 7)) + '월 ' + (+SCH.ds.slice(8, 10)) + '일' + (SCH.hm ? ' ' + SCH.hm : ' · 시각 없음') : '날짜를 골라 주세요') + '</div>';
    if (SCH.tab === 'me') {
      h += '<h2>무엇</h2><input id="mcalMyT" class="sch-in" type="text" maxlength="80" placeholder="한 줄로 (예: 지점 회의 · 홍○동님 보장분석)">' +
        '<input id="mcalMyH" type="hidden" value="' + E(SCH.hm) + '">' +
        '<button type="button" class="btn p" style="margin-top:12px" onclick="HOME_V2.schedPut()">넣기</button>';
    } else {
      h += '<h2>누구</h2>' + (cs.length ? '<select id="mcalCusId" class="sch-in">' + cs.map(function (c) { var nm = T(function () { return g.mcalName(c); }, '') || c.name_masked || '고객'; return '<option value="' + E(c.id) + '"' + (c.id === SCH.cid ? ' selected' : '') + '>' + E(nm) + '</option>'; }).join('') + '</select>'
        : '<div class="sub">고객 명단을 아직 못 읽었어요 — 고객 탭을 한 번 열면 여기서 고를 수 있어요</div>') +
        '<h2>무엇</h2><select id="mcalCusHow" class="sch-in">' + HOW.map(function (x) { return '<option value="' + E(x) + '">' + E(x) + '</option>'; }).join('') + '</select>' +
        '<input id="mcalCusNote" class="sch-in" style="margin-top:6px" type="text" maxlength="140" placeholder="무엇을 할지 한 줄 (예: 보장분석 설명)">' +
        (cs.length ? '<button type="button" class="btn p" style="margin-top:12px" onclick="HOME_V2.schedPut()">넣기</button>' : '');
    }
    return h;
  }
  function schedOpen(o) {
    o = o || {};
    SCH.done = null; SCH.tab = o.cid ? 'cus' : (SCH.tab || 'me'); SCH.cid = o.cid || ''; if (!SCH.ds) SCH.ds = ymdAdd(0);
    sheet('<div id="hv2Sch">' + schedHtml() + '</div>');
  }
  function schedPaint() {
    var b = el('hv2Sch'); if (b && b.parentNode) { b.innerHTML = schedHtml(); return; }
    var sh = el('hv2Sheet'); if (sh) sh.innerHTML = '<div class="grab"></div><div id="hv2Sch">' + schedHtml() + '</div>';   /* 칸을 못 찾으면 시트째 */
  }
  function schedSet(k, v) {
    var keep = { t: (el('mcalMyT') || {}).value, n: (el('mcalCusNote') || {}).value, c: (el('mcalCusId') || {}).value };
    SCH[k] = v || '';
    if (keep.c) SCH.cid = keep.c;
    schedPaint();
    if (keep.t && el('mcalMyT')) el('mcalMyT').value = keep.t;
    if (keep.n && el('mcalCusNote')) el('mcalCusNote').value = keep.n;
  }
  function schedPut() {
    if (!SCH.ds) { try { g.toast('날짜를 먼저 골라 주세요'); } catch (e) {} return; }
    try { g.MCAL.sel = SCH.ds; } catch (e0) {}
    var title = '', label = '', ok = false;
    if (SCH.tab === 'me') {
      var t = ((el('mcalMyT') || {}).value || '').trim(); if (el('mcalMyH')) el('mcalMyH').value = SCH.hm;
      if (!t) { try { g.toast('무엇을 하는 일정인지 한 줄만 적어 주세요'); } catch (e1) {} return; }
      try { g.mcalMyPut(); ok = true; } catch (e2) { ok = false; }
      title = t; label = t;
    } else {
      var id = (el('mcalCusId') || {}).value || '', how = (el('mcalCusHow') || {}).value || '', note = ((el('mcalCusNote') || {}).value || '').trim();
      if (!id) { try { g.toast('고객을 먼저 골라 주세요'); } catch (e3) {} return; }
      var c = (T(function () { return g.mcalCusList(); }, []) || []).filter(function (x) { return x.id === id; })[0];
      try { g.mcalCusPut(); ok = true; } catch (e4) { ok = false; }
      title = (T(function () { return g.mcalOutName(c); }, '') || '고객') + ' · ' + how + (note ? ' — ' + note : '');
      label = (T(function () { return g.mcalName(c); }, '') || '고객') + '님 · ' + how + (note ? ' — ' + note : '');
    }
    if (!ok) return;
    var hh = SCH.hm ? +SCH.hm.slice(0, 2) : 9, mm = SCH.hm ? +SCH.hm.slice(3, 5) : 0;
    var st = SCH.ds.replace(/-/g, '') + (SCH.hm ? 'T' + SCH.hm.replace(':', '') + '00' : ''), en = '';
    if (SCH.hm) { var e = new Date(Date.UTC(2000, 0, 1, hh, mm + 30)); en = SCH.ds.replace(/-/g, '') + 'T' + ('0' + e.getUTCHours()).slice(-2) + ('0' + e.getUTCMinutes()).slice(-2) + '00'; }
    else { var d2 = new Date(SCH.ds + 'T00:00:00Z'); d2.setUTCDate(d2.getUTCDate() + 1); en = d2.toISOString().slice(0, 10).replace(/-/g, ''); }
    SCH.done = { ds: SCH.ds, h: hh, m: mm, title: title, label: (+SCH.ds.slice(5, 7)) + '/' + (+SCH.ds.slice(8, 10)) + (SCH.hm ? ' ' + SCH.hm : '') + ' · ' + label,
      gcal: 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) + '&dates=' + st + '/' + en + '&ctz=Asia/Seoul' };
    /* 📲 달력 탭 스위치가 켜져 있으면 그 자리에서 폰 달력 파일까지 (판 X516) */
    try { if (g.CAL_V2 && g.CAL_V2.icsOn()) { SCH.done.ics = true; schedIcs(); } } catch (eI) {}
    schedPaint(); paint();
  }
  function schedIcs() {
    var D = SCH.done; if (!D) return;
    var txt = T(function () { return g.icsBuild('APEX 일정', [{ ds: D.ds, h: D.h, m: D.m, dur: 30, title: D.title, body: '', go: 'mycal' }]); }, '');
    if (!txt) { try { g.toast('폰 달력 파일을 못 만들었어요'); } catch (e) {} return; }
    try {
      var b = new Blob([txt], { type: 'text/calendar;charset=utf-8' }), a = g.document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = 'apex-일정-' + D.ds + '.ics';
      g.document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      g.toast('달력 파일을 받았어요 — 누르면 폰 달력이 추가를 물어요');
    } catch (e2) { try { g.copyText(txt); } catch (e3) {} }
  }

  /* 💬 보내기 화면 — 오늘 화면 카드의 글(HM_TAMSG.list · text) 그대로. 「보냈어요」 = 이분 끝(hmQfin) */
  function sayOpen(key) {
    var x = rowOf(key); if (!x || !g.MSG_V2) return;
    var items = (T(function () { return g.HM_TAMSG.list(x); }, []) || []).map(function (k) {
      var m = /^m\d+$/.test(k) ? T(function () { return g.MST_TOUCH[+k.slice(1)]; }, null) : null;
      var M = m ? null : (T(function () { return g.TA_MSG.MSG; }, []) || []).filter(function (o) { return o.k === k; })[0];
      return { k: k, lb: m ? m.ic + ' ' + m.t : '📜 ' + ((M && M.t) || k), note: m ? m.why : strip((M && M.note) || ''), text: function (ch) { return msgText(k, x, ch); } };
    });
    g.MSG_V2.open({ who: nameOf(x), tel: T(function () { return g.hmTelOf(x); }, ''), title: T(function () { return g.HM_TAMSG.tag(x); }, '') || '💬 보낼 글', ch: CH, items: items,
      onSent: function () { try { g.hmQfin(key); } catch (e) {} paint(); } });
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
    on: on, set: set, use: use, chip: chip, apply: apply, paint: paint, close: close, sheet: sheet,
    insK: insKSheet,
    /* 🙋 답 단추를 누른 뒤 — 저장이 끝날 즈음 이 화면만 다시 그림(답한 물음이 빠지고 다음 것이 섬) */
    askAfter: function () { setTimeout(function () { paint(); }, 900); }, allowed: function () { return ALLOWED; }, KEY: KEY,
    nm: function () { try { g.hmNmToggle(); } catch (e) {} paint(); },
    goal: goalSheet, goalPer: goalPer, goalPut: goalPut,
    goalQ: function (q) { var i = el('hv2GoalP'); if (i) i.value = q; goalPer(); },
    /* 판 X512 까지 목표 칸이 하던 일 — 「내 업적 · 월간보고」 로. 이제 시트 맨 아래 단추 */
    goalOld: function () { close(); try { g.arGoCat('perf'); } catch (e) {} try { g.go('airep'); } catch (e2) {} },
    stage: stageSheet,
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
    /* 아래 세 칸 — 판 X514 부터 시안 9차 openTalk · openProd · openStudy 시트. 예전 「그 갈래 화면 목록」 은 각 시트 맨 아래 「모든 화면」 */
    dock: function (k) { if (k === 'talk') return talkSheet(); if (k === 'prod') return prodSheet(); if (k === 'study') return studySheet(); dockAll(k); },
    dockAll: dockAll,
    talk: function (k) { TALKK = k; REJ_ALL = 0; talkSheet(); },
    talkMore: function () { REJ_ALL = 1; talkSheet(); },
    talkCp: function (i) { copyT(TXT[i]); },
    studyMore: function () { STUDY_ALL = STUDY_ALL ? 0 : 1; studySheet(); },
    jv: jvSheet,
    ai: aiSheet,
    aiAdd: aiAddSheet,
    sit: sitSheet, sitPut: sitPut,
    careEdit: function (care) { careEditSheet(care == null ? '' : care); },
    careTo: function (i) { CE.care = careList()[i] || CE.care; CE.q = ''; careEditSheet(); },
    careQ: function (v) { CE.q = String(v || ''); var b = el('hv2CareL'); if (b) b.innerHTML = carePick(); },
    carePut: careEdit(function (L, id) { var i = L.indexOf(id); if (i >= 0) L.splice(i, 1); else L.push(id); }),
    careDel: careEdit(function (L, i) { L.splice(i, 1); }),
    careUp: careEdit(function (L, i) { if (i > 0) { var t = L[i]; L.splice(i, 1); L.splice(i - 1, 0, t); } }),
    mis: misSheet, misDid: function (i, ck) { misDid(i, ck, 0); }, misUndo: function (i, ck) { misDid(i, ck, 1); },
    newOn: newOn,
    newHelp: function () { var v = !newOn(); newSet(v); try { if (typeof g.toast === 'function') g.toast(v ? '🌱 신입 도움말을 켰어요 — 영업 한 바퀴 칸을 눌러 보세요' : '신입 도움말을 껐어요'); } catch (e) {} try { paint(); } catch (e2) {} return v; },
    aiQ: function (v) { AIQ = String(v || ''); var b = el('hv2AiL'); if (b) b.innerHTML = aiPickList(); },
    aiPut: function (id) {
      var L = aiMine(), i = L.indexOf(id);
      if (i >= 0) L.splice(i, 1); else L.push(id);
      aiMineSet(L);
      var b = el('hv2AiL'); if (b) b.innerHTML = aiPickList();
      try { if (typeof g.toast === 'function') g.toast(i >= 0 ? '자비스에서 뺐어요' : '🤖 자비스에 넣었어요'); } catch (e) {}
    },
    aiDel: function (id) { aiMineSet(aiMine().filter(function (x) { return x !== id; })); aiSheet(); },
    aiUp: function (id) { var L = aiMine(), i = L.indexOf(id); if (i > 0) { L.splice(i, 1); L.splice(i - 1, 0, id); aiMineSet(L); } aiSheet(); },
    amt: amtSheet, won: wonSheet, amtPut: amtPut, wonPut: wonPut,
    numQ: function (q) { var i = el('hv2Num'); if (i) i.value = q; },
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
    say: sayOpen,
    sched: schedOpen, schedSet: schedSet, schedPut: schedPut, schedIcs: schedIcs,
    route: routeSheet,
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
  /* 카드 i 번째(0부터) → 점 몇 번째. 카드가 점보다 많으면 고르게 나눠 맡깁니다(첫 장 = 첫 점, 끝 장 = 끝 점) */
  var DOT_MAX = 8;
  function dotOf(i, n) { return n <= DOT_MAX ? i : Math.round(i * (DOT_MAX - 1) / (n - 1)); }
  function dots() {
    var r = el('hv2Rail'); if (!r || !r.children.length) return;
    var w = r.children[0].offsetWidth + 10, i = Math.round(r.scrollLeft / (w || 1)), d = el('hv2Dots');
    i = Math.max(0, Math.min(r.children.length - 1, i));
    var j = dotOf(i, r.children.length);
    if (d) [].forEach.call(d.children, function (e, k) { e.classList.toggle('on', k === j); });
    /* 줄 높이 = 지금 보는 카드 (+ 아래 그림자 몫 4px) */
    var c = r.children[i]; if (c && c.offsetHeight) r.style.height = (c.offsetHeight + 4) + 'px';
  }
  g.HOME_V2 = API;
  /* 옛 홈 단추가 부르는 이름 — 점(.) 없는 함수여야 check-hmclick 이 「부르는 함수가 있다」 고 읽습니다 */
  g.homeV2Use = use;
})(window);
