/* ═══════════════════════════════════════════════════════════════════
   cus-v2.js — 🪪 <b>새 고객 화면 — 시안 9차 「고객 한 분」 디자인 그대로</b> (판 X512)

   사장님 말씀 (2026-11-20)
     「그 다음거 해」 — 새 오늘 화면 다음 차례 ③ 고객 화면.
     「가장 중요한건 목각 그대로 따라가서, 목각 디자인에서, 맞는 기능들을 채우는게 먼저」
     「새화면을 먼저 기준으로 하고, 구화면을 누르면 전 버전으로 할수 있도록」

   ── 무엇을 하나 ──────────────────────────────────────────────────
   ★ 고객 창(cusGo → #cusWin)의 <b>「요약」 자리</b>를 시안(Desktop\코드\메뉴정리_1단계\9차_시안.html
     openCust)의 차례·옷 그대로 그립니다:
       이름 줄(+예상 금액) → 📞 💬 📅 ✍️ → 단계 다섯 칸 → 지금 상황 → 🧭 이분께 권할 것
       → 아는 것 → 보험 → 기록 → 더 보기(연락 · 보장 · 서류 · 정보)
   ★ 칸 속은 <b>라이브 고객 칸 그대로</b> 채웁니다 — 새로 세거나 지어내지 않습니다(1번·5번):
       이름 cmName · 나이 성별 CM_BASE(oscAge) · 배정 줄 CUS.db(단계 · 동네 · 예상 금액)
       지금 상황 · 걱정 · 가족 · 생일 · 계약일 · 만기 · 소개 cmOf(CM_FIELDS) · 할 일 cmNextAll · 약속 cuwAppt
       기록 cusLog(CUS.calls, touch) · 팩트파인딩 cmFfCount · 보장 OSCP · 권할 것 MK_TALK · APEX_STAGE · HM_DOOR
   ★ <b>저장 코드를 새로 짜지 않습니다</b> — 누르면 있던 고치기 칸(cuwSheet · cusReveal → cmCare · cmWorry …)이나
     있던 함수(ccSms · cuwWrite · cuwNxOpen · cqaWal · hmDoorGo · cusTab)를 부르기만 합니다.
   ★ 시안에만 있고 라이브에 <b>칸이 없는 것</b>(하는 일 · 연락 편한 때 · 「보장분석」 단계)은 세우지 않습니다 —
     빈칸을 「＋ 적기」 로 세우면 적을 곳이 없습니다. 「이분 여정」 은 다음 판입니다.

   ── 깨지지 않게 ─────────────────────────────────────────────────
     · 예전 고객 창은 <b>그대로 그려지고 감춰지기만</b> 합니다(요약 탭 · 고치기 화면 아닐 때만).
       연락 · 보장 · 서류 · 정보 탭과 고치기 화면은 <b>예전 그대로</b>입니다 — 맨 아래 「더 보기」 로 갑니다.
     · 「↩ 예전 화면」 을 누른 기기만 예전 요약(localStorage apex_cus_v2 = 'old'), 「✨ 새 화면」 으로 다시('1').
       ⚠ 자동 점검 브라우저(navigator.webdriver)는 예전 화면 — 옛 고객 창 점검들이 그대로 돕니다.
     · ALLOWED = false 한 줄이면 모두 예전 화면. index.html 은 세 자리만(싣기 · 요약 자리 · cuwPaint 안 다시 그리기).
     · 한 칸이 터져도 그 칸만 빠집니다(T · part). 통째로 터지면 예전 요약이 섭니다.
     · 서버를 부르지 않습니다 · 저장하지 않습니다 — 이 기기 고르기(apex_cus_v2) 한 칸만 적습니다.
   점검: scripts/check-cusv2.js
   ═══════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var ALLOWED = true;                 /* 모두에게 끄기 — false 한 줄이면 전원이 예전 화면 */
  var DEFAULT_NEW = true;             /* 고른 적 없는 기기는 새 화면 (새 오늘 화면과 같은 약속) */
  var KEY = 'apex_cus_v2';            /* 이 기기에만 · 서버로 안 갑니다 */

  function el(id) { return g.document.getElementById(id); }
  function E(s) {
    if (typeof g.osEsc === 'function') return g.osEsc(s == null ? '' : String(s));
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function T(fn, def) { try { var v = fn(); return (v === undefined || v === null) ? def : v; } catch (e) { return def; } }
  function Q(s) { return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
  function strip(s) { return String(s == null ? '' : s).replace(/<[^>]*>/g, ''); }
  function robot() { try { return !!(g.navigator && g.navigator.webdriver); } catch (e) { return false; } }
  function on() {
    if (!ALLOWED) return false;
    var v = null;
    try { v = g.localStorage.getItem(KEY); } catch (e) { v = null; }
    if (v === '1') return true;
    if (v === 'old') return false;
    return DEFAULT_NEW && !robot();
  }
  function set(v) { try { g.localStorage.setItem(KEY, v ? '1' : 'old'); } catch (e) {} }

  /* ── 옷 — 시안 9차 CSS 를 .cv2 아래로만 옮긴 것 ─────────────────────── */
  function css() {
    var d = g.document;
    if (d.getElementById('cusV2Css')) return;
    var C = [
      /* 예전 요약 · 머리는 감추기만 — 요약 탭이고 고치기 화면이 아닐 때만 */
      '#cusWin.cv2-on[data-tab="sum"][data-sheet=""]>.cus-head{display:none!important}',
      '#cusWin.cv2-on[data-tab="sum"][data-sheet=""]>[data-cus-tab="sum"]:not(.cv2-box){display:none!important}',
      '#cusWin.cv2-on[data-tab="sum"][data-sheet=""]>.cv2-box{order:-1}',
      '@media print{#cusWin>.cv2-box{display:none!important}}',
      '.cv2{--bg:#F2F4F6;--card:#fff;--ink:#191F28;--sub:#4E5968;--sub2:#6B7684;--sub3:#8B95A1;--line:#E5E8EB;--line2:#F2F4F6;' +
        '--blue:#1A56DB;--blue-l:#EAF1FF;--green:#0B8A4E;--green-l:#E7F6EE;--warn:#C2410C;--warn-l:#FFF1E6;--r:20px;' +
        'color:var(--ink);font-size:15px;line-height:1.45;word-break:keep-all;max-width:560px;margin:0 auto 12px;padding:0 12px;-webkit-font-smoothing:antialiased}',
      '.cv2 *{box-sizing:border-box}',
      '.cv2 button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;text-align:left;margin:0}',
      '.cv2 a{color:inherit;text-decoration:none}',
      /* 예전 화면 ↔ 새 화면 */
      /* 「← 고객 목록」 줄(20px) 오른쪽 끝에 얹습니다 — 시안에 없는 단추라 줄을 따로 안 씁니다 */
      '.cv2 .vtop{display:flex;justify-content:flex-end;margin:-24px 0 4px;pointer-events:none}',
      '.cv2 .vchip{pointer-events:auto;height:30px;padding:0 10px;border-radius:15px;background:var(--t-card,#fff);border:1px solid var(--t-line,#E5E8EB);font-size:13px;font-weight:700;color:var(--t-ink,#191F28)}',
      '.cv2.off .vtop{margin:8px 0 0}',   /* 예전 화면일 땐 탭 줄 밑이라 안 얹습니다 */
      /* 이름 줄 */
      '.cv2 .who{display:flex;align-items:center;gap:12px;padding:4px 2px}',
      '.cv2 .av{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:17px;flex:none;background:var(--blue-l);color:var(--blue)}',
      '.cv2 .wm{flex:1;min-width:0}',
      '.cv2 .wm .nm{font-size:21px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.cv2 .wm .mt{font-size:14px;color:var(--sub2)}',
      '.cv2 .wm .mt button{color:var(--blue);font-weight:700;font-size:14px;min-height:28px}',
      '.cv2 .amt{display:inline-flex;align-items:center;height:44px;padding:0 10px;border-radius:8px;font-size:13px;font-weight:700;background:var(--blue-l);color:var(--blue);flex:none}',
      '.cv2 .chip{display:inline-flex;align-items:center;font-size:13px;font-weight:600;padding:2px 8px;border-radius:7px;background:var(--line2);color:var(--sub)}',
      '.cv2 .chip.w{background:var(--warn-l);color:var(--warn)}',
      /* 단추 넷 */
      '.cv2 .qa4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:14px}',
      '.cv2 .qa4 button,.cv2 .qa4 a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:60px;border-radius:14px;background:#fff;font-size:20px;text-align:center}',
      '.cv2 .qa4 span{font-size:13px;font-weight:700;color:var(--sub)}',
      /* 단계 */
      '.cv2 .steps{display:flex;gap:4px;margin:12px 0 4px}',
      '.cv2 .steps button{flex:1;text-align:center;padding:7px 0 5px;border-radius:10px;font-size:13px;font-weight:600;color:var(--sub3);background:#fff;min-height:44px;line-height:1.2}',
      '.cv2 .steps button small{display:block;font-size:13px;font-weight:500;opacity:.8}',
      '.cv2 .steps button.past{background:var(--blue-l);color:var(--blue)}',
      '.cv2 .steps button.cur{background:var(--blue);color:#fff}',
      /* 지금 상황 */
      '.cv2 .sit{background:#fff;border-radius:20px;padding:16px;margin-top:14px;border:2px solid var(--blue-l)}',
      '.cv2 .sit-h{display:flex;justify-content:space-between;align-items:center}',
      '.cv2 .sit-h b{font-size:15px;color:var(--blue)}',
      '.cv2 .sit-h button{height:44px;padding:0 6px;font-size:14px;font-weight:700;color:var(--sub2)}',
      '.cv2 .sit-care{display:inline-block;font-size:20px;font-weight:800;margin-top:2px}',
      '.cv2 .sit-w{font-size:16px;line-height:1.5;margin-top:6px;color:var(--ink)}',
      '.cv2 .sit-empty{display:block;width:100%;min-height:44px;margin-top:6px;padding:10px 12px;border-radius:12px;background:var(--bg);font-size:14px;color:var(--sub2);text-align:left;line-height:1.45}',
      '.cv2 .sit-n{display:flex;gap:10px;align-items:baseline;width:100%;margin-top:12px;padding-top:12px;border-top:1px solid var(--line2);font-size:14px;min-height:44px}',
      '.cv2 .sit-n span{color:var(--sub2);flex:none;font-weight:600}',
      '.cv2 .sit-n b{font-weight:600;line-height:1.45}',
      /* 권할 것 */
      '.cv2 .recc{background:#fff;border-radius:20px;padding:16px;margin-top:10px}',
      '.cv2 .recc .sit-h b{color:var(--ink)}',
      '.cv2 .rr{display:flex;gap:10px;align-items:baseline;font-size:15px;margin-top:8px;line-height:1.45}',
      '.cv2 .rr span{flex:none;width:44px;font-size:13px;color:var(--sub2);font-weight:700}',
      '.cv2 .rr b{font-weight:600}',
      '.cv2 .rr i{font-style:normal;color:var(--sub3)}',
      '.cv2 .rapps{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:12px -16px 0;padding:0 16px}',
      '.cv2 .rapps::-webkit-scrollbar{display:none}',
      '.cv2 .rapps button{flex:none;white-space:nowrap;height:44px;padding:0 13px;border-radius:12px;background:var(--blue-l);color:var(--blue);font-size:14px;font-weight:700}',
      /* 칸 머리 · 목록 */
      '.cv2 .sec{display:flex;justify-content:space-between;align-items:baseline;margin:20px 2px 0}',
      '.cv2 .sec b{font-size:17px;font-weight:800}',
      '.cv2 .sec small{font-size:13px;color:var(--sub2)}',
      '.cv2 .list{background:#fff;border-radius:var(--r);padding:6px 0;margin-top:8px}',
      '.cv2 .li{display:flex;align-items:center;gap:12px;padding:12px 20px;min-height:64px;width:100%}',
      '.cv2 .li+.li{border-top:1px solid var(--line2)}',
      '.cv2 .li .tx{flex:1;min-width:0}',
      '.cv2 .li .t1{font-size:16px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.cv2 .li .t1.wr{white-space:normal;font-size:15px;font-weight:500}',
      '.cv2 .li .t2{font-size:13px;color:var(--sub2);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.cv2 .li .ar{color:#B0B8C1;font-size:18px}',
      '.cv2 .tile{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;font-size:22px;background:var(--line2);flex:none}',
      '.cv2 .more{width:100%;min-height:44px;font-size:14px;font-weight:600;color:var(--sub2);text-align:center;border-top:1px solid var(--line2)}',
      /* 아는 것 */
      '.cv2 .kgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}',
      '.cv2 .kc{background:#fff;border-radius:14px;padding:10px 12px;min-height:60px;display:flex;flex-direction:column;justify-content:center;text-align:left}',
      '.cv2 .kc span{font-size:13px;color:var(--sub2);font-weight:600}',
      '.cv2 .kc b{font-size:15px;font-weight:700;margin-top:2px;line-height:1.35;word-break:keep-all}',
      '.cv2 .kc.e{background:transparent;border:1.5px dashed #D1D6DB}',
      '.cv2 .kc.e b{color:var(--blue);font-weight:700}',
      '.cv2 .src{font-size:13px;color:var(--sub3);margin:12px 2px 0}'
    ];
    var s = d.createElement('style'); s.id = 'cusV2Css'; s.textContent = C.join('\n');
    (d.head || d.documentElement).appendChild(s);
  }

  /* ── 읽기 — 라이브 고객 칸에 묻기만 ───────────────────────────────── */
  function meta(id) { return T(function () { return g.cmOf(id); }, {}) || {}; }
  function base(id) { return T(function () { return g.CM_BASE[id]; }, {}) || {}; }
  function dbRow() { return T(function () { return g.CUS.db; }, null); }
  function stageOf() { var d = dbRow(); return (d && d.stage) ? String(d.stage) : ''; }
  /* 단계 다섯 칸 — 라이브 단계(APEX_STAGE.order) 를 시안 칸에 담습니다. 「보장분석」 은 라이브 단계가 아니라 안 세웁니다 */
  var STG = [
    { t: '첫 전화', ab: 'TA', s: ['미접촉', '부재', 'TA'] },
    { t: '첫 만남', ab: 'AP', s: ['AP'] },
    { t: '제안', ab: 'PC', s: ['PC'] },
    { t: '청약', ab: 'CS', s: ['CS'] },
    { t: '관리', ab: '', s: ['계약완료', '증권전달', '소개완료'] }
  ];
  function stgI(st) { for (var i = 0; i < STG.length; i++) if (STG[i].s.indexOf(st) >= 0) return i; return -1; }
  function ageNum(id) { var b = base(id); var a = T(function () { return g.oscAge(b.by); }, null); a = parseInt(a, 10); return isNaN(a) ? null : a; }
  function band(id) { var a = ageNum(id); return a == null ? '' : (a < 40 ? '2030' : (a < 60 ? '4050' : '60')); }
  function nameOf(c) { return T(function () { return g.cmName(c); }, '') || (c && c.name_masked) || '고객'; }
  function won(v) { var n = Number(v); if (!v || isNaN(n) || n <= 0) return ''; return n >= 10000 ? (Math.round(n / 10000) + '만원') : (n + '원'); }

  /* ── 칸마다 ─────────────────────────────────────────────────────── */
  function topHtml() {
    return '<div class="vtop"><button type="button" class="vchip" onclick="cusV2Use(false)">↩ 예전 화면</button></div>';
  }
  function whoHtml(c) {
    var id = c.id, b = base(id), d = dbRow(), a = ageNum(id), gd = b.gd === 'M' ? '남' : (b.gd === 'F' ? '여' : ''), bits = [];
    if (a != null || gd) bits.push([a != null ? a + '세' : '', gd].filter(Boolean).join(' · '));
    var area = d ? [d.region, d.dong].filter(Boolean).join(' ') : '';
    if (area) bits.push(area);
    var who = T(function () { return g.cmWhoName(c); }, '');
    if (who) bits.push('담당 ' + who);
    var st = stageOf(), amt = d ? won(d.expect_premium) : '';
    return '<div class="who"><div class="av">' + E(nameOf(c).charAt(0)) + '</div><div class="wm">' +
      '<div class="nm">' + E(nameOf(c)) + '님</div>' +
      '<div class="mt">' + (bits.length ? E(bits.join(' · ')) : '아직 아는 게 적어요') + ' <button type="button" onclick="oscTopEdit()">고치기</button></div></div>' +
      (st === '거절' ? '<span class="chip w">거절</span>' : (amt ? '<span class="amt">예상 ' + E(amt) + '</span>' : '')) + '</div>';
  }
  function qaHtml(c) {
    /* 번호 — 고객 기본 칸 → 연락처 표(ccTelOf) → 배정 줄. 「연락할 분」 카드(79539행)와 같은 차례 */
    var ph = base(c.id).ph || T(function () { return g.ccTelOf(c.id); }, '') || T(function () { return g.CUS.db.phone; }, '') || '';
    return '<div class="qa4">' +
      (ph ? '<a href="tel:' + E(ph) + '">📞<span>전화</span></a>' : '<button type="button" onclick="cuwSheet(\'base\')">📞<span>번호 넣기</span></button>') +
      '<button type="button" onclick="ccSms(\'' + Q(c.id) + '\')">💬<span>문자</span></button>' +
      '<button type="button" onclick="cusTab(\'talk\');cuwNxOpen()">📅<span>일정</span></button>' +
      '<button type="button" onclick="cuwWrite()">✍️<span>기록</span></button></div>';
  }
  function stepsHtml() {
    var ci = stgI(stageOf());
    return '<div class="steps">' + STG.map(function (x, k) {
      return '<button type="button" class="' + (ci < 0 ? '' : (k < ci ? 'past' : (k === ci ? 'cur' : ''))) + '" onclick="cuwSheet(\'stage\')">' + x.t + (x.ab ? '<small>' + x.ab + '</small>' : '') + '</button>';
    }).join('') + '</div>';
  }
  /* 다음 할 일 — 요약 「지금 할 일」(cuwNowHtml)과 같은 차례: 오늘 약속 → 기한 지난 할 일 → 가까운 할 일 → 다음 약속 */
  function nextTxt(c) {
    var t = T(function () { return g.cuwToday(); }, ''), ap = T(function () { return g.cuwAppt(c); }, ''), A = T(function () { return g.cmNextAll(c.id); }, []) || [], i;
    var at = function (a) { return T(function () { return g.cuwApptTxt(a); }, String(a).slice(0, 16)); };
    if (ap && T(function () { return g.cuwApptDay(ap); }, '') === t) return '오늘 ' + (at(ap).split(' ')[1] || '') + ' 약속' + (A[0] ? ' — ' + A[0].what : '');
    for (i = 0; i < A.length; i++) if (A[i].due && A[i].due <= t) return (A[i].due === t ? '오늘까지 · ' : '기한 지남 · ') + A[i].what;
    if (A.length) return A[0].what + (A[0].due ? ' · ' + A[0].due : '');
    if (ap) return '다음 약속 ' + at(ap);
    return '';
  }
  function sitHtml(c) {
    var m = meta(c.id), nx = nextTxt(c);
    return '<div class="sit"><div class="sit-h"><b>지금 상황</b><button type="button" onclick="cusV2Jump(\'cmCare\')">' + (m.care ? '바꾸기' : '고르기') + '</button></div>' +
      (m.care ? '<div class="sit-care">' + E(m.care) + '</div>' : '<button type="button" class="sit-empty" onclick="cusV2Jump(\'cmCare\')">결혼·출산·이사 같은 일이 상담의 문을 엽니다 — 골라 주세요</button>') +
      (m.worry ? '<div class="sit-w">「' + E(m.worry) + '」</div>' : '<button type="button" class="sit-empty" onclick="cusV2Jump(\'cmWorry\')">무엇을 제일 걱정하신다고 하셨나요? — 그 한마디가 다음 통화 첫 문장이 됩니다</button>') +
      '<button type="button" class="sit-n" onclick="cusTab(\'talk\')' + (nx ? '' : ';cuwNxOpen()') + '"><span>다음 할 일</span><b>' + (nx ? E(nx) : '아직 안 잡았어요 — 잡기 ›') + '</b></button></div>';
  }

  /* 🧭 이분께 권할 것 — 시안 8·9차 그대로: 걱정 한마디 → 지금 상황 → 나이대 → 신청한 DB 주제 → 이번 달 1위.
     글은 MK_TALK(상황 10가지) · APEX_STAGE(나이대 · 거절 · 들고 갈 화면) 에서 읽기만 합니다.
     시안이 정한 표는 둘 — 상황 → 상품전략 상황(CARE_CAT) · 상황 → 먼저 펼 화면(CARE_APP) */
  var CARE_CAT = { '결혼 준비': 'women', '출산 · 육아': 'child', '이직 · 퇴사': 'hospital', '이사 · 내 집': 'life', '개업 · 사업': 'accident',
    '자녀 진학': 'child', '건강 문제': 'hospital', '부모님 일': 'care', '은퇴 준비': 'care' };
  var CARE_APP = {
    '결혼 준비': [{ tab: 'wallets' }, { tab: 'finance', track: 'w' }],
    '출산 · 육아': [{ tab: 'finance', track: 'e' }, { tab: 'treatpay' }],
    '이직 · 퇴사': [{ tab: 'med_silbi' }, { tab: 'onecmp' }],
    '이사 · 내 집': [{ tab: 'mikki_talk' }],
    '개업 · 사업': [{ tab: 'biz_diag' }, { tab: 'finance', track: 't' }],
    '자녀 진학': [{ tab: 'finance', track: 'e' }],
    '건강 문제': [{ tab: 'ref_underwrite' }, { tab: 'med_disclosure' }],
    '부모님 일': [{ tab: 'treatpay' }, { tab: 'wallets' }],
    '은퇴 준비': [{ tab: 'finance', track: 'w' }, { tab: 'finance', track: 'c' }]
  };
  var AGE_CAT = { '2030': 'hospital', '4050': 'cancer3', '60': 'care' };
  var STAGE_KO = ['TA', 'AP', 'PC', 'CS', '계약완료'];
  var OBJ_BY = [['think', 'many'], ['family', 'money'], ['think', 'money'], ['money', 'family'], ['agent', 'think']];
  function catPick(c) {
    var M = T(function () { return g.MK_TALK.CATS; }, null); if (!M) return null;
    var m = meta(c.id), b = band(c.id), d = dbRow(), out = null;
    var add = function (k, why) { if (!out && k && M[k]) out = { k: k, why: why }; };
    if (m.worry && /간병|요양|치매|부모/.test(m.worry)) add('care', '걱정 한마디');
    if (m.worry && /화재|가게|누수/.test(m.worry)) add('life', '걱정 한마디');
    if (m.care) add(CARE_CAT[m.care], '지금 상황 「' + m.care + '」');
    if (b) add(AGE_CAT[b], (b === '2030' ? '20·30대' : (b === '4050' ? '40·50대' : '60대 이상')) + '라');
    if (d && d.source) {
      var o = T(function () { return g.TA_OPENER.db(d.source); }, null), tc = T(function () { return g.HM_DOOR.THEME_CAT; }, {}) || {};
      if (o && tc[o.theme]) add(tc[o.theme], '신청하신 「' + (T(function () { return g.TA5.THEMES[o.theme].name; }, '') || d.source) + '」');
    }
    return out;
  }
  function can(id) { return T(function () { return typeof g.osTabAllowed === 'function' ? g.osTabAllowed(id) !== false : true; }, true) && !!T(function () { return g.navItemOf(id); }, null); }
  function appsFor(c) {
    var m = meta(c.id), ci = stgI(stageOf()), K = T(function () { return g.APEX_STAGE.of(STAGE_KO[ci < 0 ? 0 : ci]).know; }, []) || [], out = [], seen = {};
    var add = function (x) {
      var key = x.tab;   /* 재무설계는 갈래(track)를 골라 여는 길이 없어 한 단추로 */ if (seen[key] || !can(x.tab)) return; seen[key] = 1;
      var it = T(function () { return g.navItemOf(x.tab); }, {}) || {};
      out.push({ tab: x.tab, t: (it.icon ? it.icon + ' ' : '') + strip(it.title || x.tab) });
    };
    (CARE_APP[m.care] || []).forEach(add);
    K.forEach(function (k) { if (!(k.tab === 'finance' && k.track)) add(k); });
    return out.slice(0, 4);
  }
  function recHtml(c) {
    var P = catPick(c), M = T(function () { return g.MK_TALK.CATS; }, null);
    if (!M) return '';
    var ci = stgI(stageOf()), b = band(c.id), tip = (T(function () { return g.APEX_STAGE.taAge; }, []) || []).filter(function (a) { return a.k === b; })[0];
    var K = OBJ_BY[ci < 0 ? 0 : ci].slice();
    if (ci <= 0 && b === '2030') K = ['busy', 'phone'];
    if (ci === 1 && b === '60') K = ['meet', 'family'];
    var OL = T(function () { return g.APEX_STAGE.objList(); }, []) || [];
    var O = K.map(function (k) { return OL.filter(function (o) { return o.key === k; })[0]; }).filter(Boolean);
    var C = P ? M[P.k] : null, A = appsFor(c);
    return '<div class="recc"><div class="sit-h"><b>🧭 이분께 권할 것</b>' +
      '<button type="button" onclick="hmDoorGo(\'' + Q(P ? P.k : '') + '\'' + (b === '2030' ? ',\'y2030\'' : '') + ')">상품전략기 ›</button></div>' +
      '<div class="rr"><span>무엇을</span><b>' + (C ? E(C.label) + ' — ' + E((C.dambo || []).slice(0, 2).join(' · ')) + (P.why ? ' <i>(' + E(P.why) + ')</i>' : '') : '<i>지금 상황이나 나이를 적으면 나와요 — 지금은 이번 달 1위</i>') + '</b></div>' +
      '<div class="rr"><span>어떻게</span><b>' + (tip ? E(strip(tip.pt)) : '<i>나이를 적으면 나와요</i>') + '</b></div>' +
      (O.length ? '<div class="rr"><span>막히면</span><b>' + O.map(function (o) { return '「' + E(o.title) + '」'; }).join(' ') + '</b></div>' : '') +
      (A.length ? '<div class="rapps">' + A.map(function (x) { return '<button type="button" onclick="go(\'' + Q(x.tab) + '\')">' + E(x.t) + '</button>'; }).join('') + '</div>' : '') +
      '</div>';
  }

  /* 아는 것 — 라이브 고객 칸이 <b>있는 것만</b>. 누르면 그 칸이 있는 고치기 화면으로(cusReveal) */
  function knowCells(c) {
    var id = c.id, m = meta(id), b = base(id), d = dbRow(), a = ageNum(id), gd = b.gd === 'M' ? '남' : (b.gd === 'F' ? '여' : '');
    var L = [{ l: '나이 · 성별', v: [a != null ? a + '세' : '', gd].filter(Boolean).join(' · '), go: 'oscTopEdit()' }];
    if (d) L.push({ l: '사는 곳', v: [d.region, d.dong].filter(Boolean).join(' '), go: 'cusTab(\'info\')' });
    L.push({ l: '가족', v: m.fam, go: 'cusV2Jump(\'cmFam\')' });
    L.push({ l: '생일', v: m.bd, go: 'cusV2Jump(\'cmBd\')' });
    L.push({ l: '계약일', v: m.cd, go: 'cusV2Jump(\'cmCd\')' });
    L.push({ l: '가장 빠른 만기', v: m.due, go: 'cusV2Jump(\'cmDue\')' });
    L.push({ l: '월 소득', v: (b.inc != null && b.inc !== '') ? b.inc + '만원' : '', go: 'cusV2Jump(\'cliIncome\')' });
    L.push({ l: '소개해 준 분', v: m.ref, go: 'cusV2Jump(\'cmRef\')' });
    L.push({ l: '8통장 진단', v: (m.wal && typeof m.wal === 'object' && Object.keys(m.wal).length) ? '붙였어요' : '', go: 'cqaWal(\'' + Q(id) + '\')' });
    var fn = T(function () { return g.cmFfCount(id); }, 0), ft = T(function () { return g.cmFfTotal(); }, 0);
    L.push({ l: '팩트파인딩', v: fn ? fn + ' / ' + ft + '칸' : '', go: 'cusV2Jump(\'cmFfN\')' });
    return L;
  }
  function knowHtml(c) {
    var L = knowCells(c), n = L.filter(function (x) { return x.v; }).length;
    return '<div class="sec"><b>아는 것</b><small>' + n + ' / ' + L.length + '칸</small></div><div class="kgrid">' + L.map(function (x) {
      return '<button type="button" class="kc' + (x.v ? '' : ' e') + '" onclick="' + x.go + '"><span>' + x.l + '</span><b>' + (x.v ? E(x.v) : '＋ 적기') + '</b></button>';
    }).join('') + '</div>';
  }
  function insHtml(c) {
    var P = T(function () { return g.OSCP; }, null), n = (P && P.rows && !P.busy) ? P.rows.length : null, d = dbRow();
    var prem = d ? won(d.contract_premium) : '';
    var sub = [n != null ? '증권 ' + n + '건' : '', prem ? '우리 계약 월 ' + prem : ''].filter(Boolean).join(' · ');
    return '<div class="sec"><b>보험</b><small>' + (sub ? E(sub) : '증권 아직') + '</small></div><div class="list">' +
      '<button type="button" class="li" onclick="cusTab(\'cov\')"><div class="tile">📂</div><div class="tx"><div class="t1">받아 둔 증권 · 보장분석</div>' +
      '<div class="t2">' + (n ? '계약 · 청구 · 보장분석 전·후' : '증권을 넣으면 빈 곳을 찾아 줘요') + '</div></div><span class="ar">›</span></button></div>';
  }
  function logHtml(c) {
    var m = meta(c.id), L = T(function () { return g.cusLog(g.CUS.calls || [], m.touch || []); }, null);
    if (!L) L = (m.touch || []).map(function (x) { return { src: 'touch', kind: x.how || '접촉', note: x.note || '', at: x.at || '' }; });
    var HE = T(function () { return g.CC_HOWE; }, {}) || {};
    return '<div class="sec"><b>기록</b><small>' + L.length + '개</small></div><div class="list">' +
      (L.length ? L.slice(0, 3).map(function (r) {
        return '<div class="li"><div class="tile">' + (r.src === 'call' ? '📞' : (HE[r.kind] || '🤝')) + '</div><div class="tx"><div class="t1 wr">' +
          E(r.kind + (r.note ? ' — ' + r.note : '')) + '</div><div class="t2">' + E(String(r.at || '').slice(0, 10)) + '</div></div></div>';
      }).join('') : '<div class="li"><div class="tx"><div class="t2">아직 기록이 없어요</div></div></div>') +
      '<button type="button" class="more" onclick="cuwWrite()">＋ 기록 남기기</button></div>';
  }
  /* 더 보기 — 예전 탭 넷. 지우지 않고 여기로 옮깁니다(토스 원칙 ⑤) */
  function moreHtml() {
    var R = [['talk', '🧵', '연락 기록 전체', '통화 · 접촉 · 다음 할 일'], ['cov', '📄', '보장 · 계약 · 청구', '증권 · 보장분석 · 청구'],
      ['doc', '📎', '서류', '올린 파일 · 저장한 상담자료'], ['info', '📇', '정보 전체', '사람 · 가족 · 돈 · 동의']];
    return '<div class="sec"><b>더 보기</b></div><div class="list">' + R.map(function (r) {
      var n = T(function () { return g.cusTabN(r[0]); }, null);
      return '<button type="button" class="li" onclick="cusTab(\'' + r[0] + '\')"><div class="tile">' + r[1] + '</div><div class="tx"><div class="t1">' + r[2] + (n ? ' <small style="color:var(--blue)">' + n + '</small>' : '') + '</div><div class="t2">' + r[3] + '</div></div><span class="ar">›</span></button>';
    }).join('') + '</div>';
  }
  function srcHtml() {
    var d = dbRow();
    return d && d.source ? '<div class="src">' + E('배정 DB · ' + d.source) + '</div>' : '';
  }
  function part(fn, c) { try { return fn(c) || ''; } catch (e) { return ''; } }
  function inner(c) {
    return topHtml() + part(whoHtml, c) + part(qaHtml, c) + part(stepsHtml, c) + part(sitHtml, c) + part(recHtml, c) +
      part(knowHtml, c) + part(insHtml, c) + part(logHtml, c) + part(moreHtml, c) + part(srcHtml, c);
  }

  /* ── 붙이기 ─────────────────────────────────────────────────────── */
  /* 고객 창이 그려질 때 요약 자리에 넣는 글 (osClientDetailHtml 이 부름) */
  function html(c) {
    try {
      if (!c) return '';
      css();
      mark();
      if (!on()) return '<div class="cv2 off" id="cv2">' + (ALLOWED ? '<div class="vtop"><button type="button" class="vchip" onclick="cusV2Use(true)">✨ 새 고객 화면</button></div>' : '') + '</div>';
      return '<div class="cv2" id="cv2">' + inner(c) + '</div>';
    } catch (e) { return ''; }
  }
  /* 창에 「새 화면」 표를 붙입니다 — 그려진 뒤라야 창이 있어 한 박자 뒤에 */
  function mark() {
    var f = function () { var w = el('cusWin'); if (w) w.classList.toggle('cv2-on', on() && !!el('cv2') && !el('cv2').classList.contains('off')); };
    try { if (typeof g.setTimeout === 'function') g.setTimeout(f, 0); } catch (e) {}
    try { f(); } catch (e2) {}
  }
  /* 고객 칸이 다시 그려질 때마다(cuwPaint) 같이 */
  function paint(c) {
    try {
      var b = el('cv2Box'); c = c || T(function () { return g.OSC.current; }, null);
      if (!b || !c) return;
      b.innerHTML = html(c);
      mark();
    } catch (e) {
      var w = el('cusWin'); if (w) w.classList.remove('cv2-on');   /* 터지면 예전 요약 */
    }
  }
  function use(v) {
    set(!!v);
    try { if (typeof g.toast === 'function') g.toast(v ? '✨ 새 고객 화면입니다 — 맨 위 「↩ 예전 화면」 으로 언제든 돌아갑니다' : '↩ 예전 고객 화면으로 돌아왔습니다'); } catch (e) {}
    paint();
  }
  /* 그 칸이 있는 고치기 화면 · 탭으로 데려가서 칸에 손을 놓습니다 — 「고치기」(oscTopEdit) 와 같은 길 */
  function jump(fld) {
    var e = el(fld);
    if (!e) { try { g.cusTab('info'); } catch (x) {} return; }
    try { g.cusReveal(e); } catch (x1) {}
    var f = function () { try { e.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (x2) {} try { e.focus({ preventScroll: true }); } catch (x3) {} };
    try { g.setTimeout(f, 80); } catch (x4) { f(); }
  }

  g.CUS_V2 = { on: on, set: set, html: html, paint: paint, use: use, jump: jump, KEY: KEY, allowed: function () { return ALLOWED; },
    STG: STG, stgI: stgI, catPick: catPick, knowCells: knowCells };
  /* index.html · onclick 이 부르는 이름 — 점(.) 없는 함수여야 check-hmclick 이 「부르는 함수가 있다」 고 읽습니다 */
  g.cusV2Html = html;
  g.cusV2Paint = paint;
  g.cusV2Use = use;
  g.cusV2Jump = jump;
})(window);
