/* ═══════════════════════════════════════════════════════════════════
   home-v2.js — ✨ <b>새 「오늘」 화면</b> (시안 9차 차례) — 판 X502

   사장님 말씀 (2026-11-20) — 「목각으로 만든 부분이랑 많이 다른데? 기존에 있었던
   내용하고 너무 비슷한데」 → 「새 홈을 만들어서 … 부작용이나 파일이 깨지는 경우를
   예측하고 시행해줘 그리고, 언제든 빽업할수 있도록 준비해줘」.

   ── 어떻게 만들었나 (깨지지 않게) ─────────────────────────────────
   ★ <b>칸을 새로 짜지 않습니다.</b> 옛 홈(renderHome)이 그린 칸을 그대로 두고,
     이 기기에서 「새 화면」 을 켜면 홈 판에 class 「hm-v2」 하나를 붙여
     <b>보이는 차례만</b> 시안대로 바꿉니다(CSS order · display:contents).
     → 칸을 칠하는 함수(hmPaint 등) · 저장 코드 · 데이터는 <b>한 글자도 안 바뀝니다</b>.
   ★ 시안에 없는 칸은 <b>지우지 않고</b> 맨 밑 「☰ 다른 칸 펼쳐 보기」 안에 접습니다.
     누르면 예전 칸이 전부 그 자리에서 펴집니다 (안 지운다 · 6번).
   ★ <b>기본은 꺼짐</b>입니다 — 켠 기기에서만 새 화면이 보입니다. 팀원 화면은
     본인이 켜기 전까지 그대로입니다.

   ── 되돌리는 길 (넷) ────────────────────────────────────────────
     ① 새 화면 인사 줄 오른쪽 「↩ 예전 화면」 한 번
     ② 주소 끝에 ?home=old  (켜기는 ?home=v2)
     ③ 모두에게 끄기 — 이 파일의 ALLOWED 를 false 로 한 줄 (켜 둔 기기도 예전 화면)
     ④ 저장소 — 태그 backup/home-before-v2 (이 판 바로 앞 main) 로 되돌리기

   ── 부작용을 막는 장치 ───────────────────────────────────────────
     · 바꿔 끼우다 오류가 나면 <b>그 자리에서 예전 화면</b>으로 돌아가고 한 줄 알립니다.
     · 「지금 할 것」 카드(#hmJobHost)가 없으면 새 화면을 안 씁니다(무언가 어긋난 판).
     · 서버를 부르지 않습니다 (7번) · 새로 저장하지 않습니다(이 기기 켜짐 표시 하나뿐).
     · 고객 이름은 옛 홈 그대로(실명 기본 · 🙈 이름 가리기) — 새로 적는 이름 없음 (3번).
   ═══════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var ALLOWED = true;                 /* ③ 모두에게 끄기 — false 한 줄이면 전원이 예전 화면 */
  var KEY = 'apex_home_v2';           /* 이 기기에만 · 서버로 안 갑니다 */
  var ALL = false;                    /* 「☰ 다른 칸 펼쳐 보기」 — 홈을 다시 열면 접힘 */

  /* 시안 차례 — <b>보이는 칸</b>과 그 차례. 여기 없는 칸은 「다른 칸」 으로 접힙니다.
     id 는 옛 홈이 이미 쓰는 이름 그대로입니다(새 이름을 만들지 않습니다 · 5번). */
  var KEEP = [
    ['#osSetupHome', 1],   /* 서버 준비 SQL — 여러 화면이 「홈 맨 위」 라고 가리킴, 평소엔 빈 칸 */
    ['#hmWhoHost', 2],     /* 👤 누구 화면인가 · 팀원 고르기 */
    ['#hmNotiLine', 3],    /* 알람 열쇠·연락 경고 한 줄 (있을 때만 글이 섬) */
    ['#hmTodayHd', 4],     /* 「○○님, 오늘 N개예요」 + 하루 다섯 걸음 */
    ['#hmJobHost', 5],     /* 지금 이분 — 한 분 = 한 카드 */
    ['#hmUpHost', 6],      /* 📅 오늘 약속 · 이번 주 (폰) */
    ['#hmRtHost', 7],      /* 🚗 오늘 동선 */
    ['#hmBandHost', 8],    /* 📇 영업 한 바퀴 — 단계별 몇 분 */
    ['#hmToday', 9]        /* 날짜 · 고객 넣기 · 내 캘린더 · (컴퓨터면 이번 주) · 🌙 오늘 돌아보기 */
  ];
  /* 펴서 한 기둥으로 세울 겉칸 — 이 칸들은 <b>속 칸만</b> 차례를 받습니다 */
  /* ⚠ .hm-2col 의 왼쪽 기둥은 id·class 가 없는 맨 div 입니다 — apply 가 「hm-v2-col」 을 달아 집습니다.
       오른쪽 기둥(#hmSideHost)은 펴지 않고 통째로 「다른 칸」 입니다. */
  var FLAT = ['#hmTossHost', '.tz', '#hmJobWrap', '#hmStack', '.hm-2col', '.hm-v2-col'];

  function on() {
    if (!ALLOWED) return false;
    try { return g.localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }
  function set(v) {
    try { if (v) g.localStorage.setItem(KEY, '1'); else g.localStorage.removeItem(KEY); } catch (e) {}
  }
  /* ② 주소로 켜고 끄기 — ?home=v2 · ?home=old (한 번 읽으면 이 기기에 남습니다) */
  function fromUrl() {
    try {
      var m = String(g.location.search || '').match(/[?&]home=(v2|old)\b/);
      if (m) set(m[1] === 'v2');
    } catch (e) {}
  }

  function css() {
    var d = g.document;
    if (d.getElementById('hmV2Css')) return;
    var P = '.tab-pane.hm-toss.hm-v2';
    var notKeep = KEEP.map(function (k) { return ':not(' + k[0] + ')'; }).join('') +
                  ':not(#hmTossHost):not(.tz):not(#hmJobWrap):not(#hmStack):not(.hm-2col):not(.hm-v2-col):not(#hmV2More)';
    var r = [];
    /* 한 기둥 · 컴퓨터에서는 가운데 720px (시안은 폰 한 기둥) */
    r.push(P + '{display:flex;flex-direction:column;max-width:720px;margin-left:auto;margin-right:auto}');
    /* 겉칸은 펴서 속 칸이 판의 차례를 받게 — 칸을 옮기지 않으므로 칠하는 함수가 그대로 찾습니다 */
    r.push(FLAT.map(function (s) { return P + ' ' + s; }).join(',') + '{display:contents}');
    /* 모든 속 칸은 기본 40번(맨 밑) — 다른 세션이 새 칸을 더해도 맨 위로 튀지 않습니다 */
    r.push([P + '>*'].concat(FLAT.map(function (s) { return P + ' ' + s + '>*'; })).join(',') + '{order:40}');
    KEEP.forEach(function (k) { r.push(P + ' ' + k[0] + '{order:' + k[1] + '}'); });
    /* 시안에 없는 칸 — 접어 둡니다(지우지 않음). 펴면 이 규칙이 통째로 빠져 예전 꼴 그대로 섭니다 */
    var hide = [P + ':not(.hm-v2-all)>*' + notKeep]
      .concat(FLAT.map(function (s) { return P + ':not(.hm-v2-all) ' + s + '>*' + notKeep; }));
    r.push(hide.join(',') + '{display:none}');
    /* 칸 안에서도 시안에 없는 줄 — 펴면 다시 섭니다 */
    r.push([' #hmBand .hm-band-4', ' #hmBand .hm-band-ask', ' .hm-waytip', ' .hm-noti-n']
      .map(function (s) { return P + ':not(.hm-v2-all)' + s; }).join(',') + '{display:none}');
    /* 칸 사이 — 한 기둥에서 붙지 않게 */
    r.push(KEEP.map(function (k) { return P + ' ' + k[0]; }).join(',') + '{margin-bottom:12px}');
    r.push(P + ' #hmV2More{order:30}');
    r.push('#hmV2More{appearance:none;display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;' +
      'min-height:52px;margin:4px 0 12px;padding:12px 16px;border:1px solid var(--t-line,#E5E8EB);border-radius:16px;' +
      'background:var(--t-card,#fff);font-family:inherit;font-size:16px;font-weight:800;color:var(--t-ink,#191F28);cursor:pointer;text-align:left}');
    r.push('#hmV2More small{font-size:13px;font-weight:700;color:var(--t-sub2,#6B7684)}');
    /* 인사 줄 오른쪽 작은 단추 — 줄 높이를 안 늘립니다(홈 길이 그대로) */
    r.push('.hm-v2-chip{float:right;appearance:none;border:1px solid var(--t-line,#E5E8EB);background:var(--t-card,#fff);' +
      'border-radius:999px;padding:4px 10px;min-height:30px;font-family:inherit;font-size:13px;font-weight:800;' +
      'color:var(--t-blue,#3182F6);cursor:pointer;letter-spacing:-.02em;margin-top:2px}');
    var st = d.createElement('style'); st.id = 'hmV2Css'; st.textContent = r.join('\n');
    d.head.appendChild(st);
  }

  /* 인사 줄에 다는 단추 — 옛 화면이면 「✨ 새 화면」, 새 화면이면 「↩ 예전 화면」 */
  function chip() {
    if (!ALLOWED) return '';
    try { css(); } catch (e) {}
    return on()
      ? '<button type="button" class="hm-v2-chip" onclick="HOME_V2.use(false)" title="예전 오늘 화면으로 돌아갑니다">↩ 예전 화면</button>'
      : '<button type="button" class="hm-v2-chip" onclick="HOME_V2.use(true)" title="시안 차례의 새 오늘 화면 — 언제든 예전 화면으로 돌아갈 수 있습니다">✨ 새 화면</button>';
  }
  function use(v) {
    set(!!v); ALL = false;
    try { if (typeof g.toast === 'function') g.toast(v ? '✨ 새 오늘 화면입니다 — 인사 줄 오른쪽 「↩ 예전 화면」 으로 언제든 돌아갑니다' : '↩ 예전 오늘 화면으로 돌아왔습니다'); } catch (e) {}
    try { if (typeof g.go === 'function') g.go('home'); } catch (e2) {}
  }
  function toggleAll() {
    ALL = !ALL;
    var p = g.document.querySelector('.tab-pane.hm-toss.hm-v2');
    if (p) p.classList.toggle('hm-v2-all', ALL);
    var b = g.document.getElementById('hmV2More');
    if (b) b.innerHTML = moreLab(p);
    if (!ALL && p) { try { p.scrollIntoView({ block: 'start' }); } catch (e) {} }
  }
  function moreLab(p) {
    return ALL ? '<span>▴ 다른 칸 접기</span><small>예전 칸 그대로 펼쳐져 있습니다</small>'
               : '<span>☰ 다른 칸 펼쳐 보기</span><small>아침 미션 · 30일 약속 · 메뉴 · 상담현황 …</small>';
  }

  /* 홈을 그린 바로 뒤에 한 번 — go('home') 이 부릅니다. 새 화면이 꺼져 있으면 아무것도 안 합니다. */
  function apply(dyn) {
    fromUrl();
    if (!on()) return false;
    var d = g.document;
    var p = (dyn || d).querySelector('.tab-pane.hm-toss');
    if (!p || !d.getElementById('hmJobHost')) return false;       /* 로그인 전·어긋난 판 — 예전 화면 그대로 */
    try {
      css();
      var col = p.querySelector('.hm-2col>div:not([id])');
      if (col) col.classList.add('hm-v2-col');
      p.classList.add('hm-v2');
      p.classList.toggle('hm-v2-all', ALL);
      if (!d.getElementById('hmV2More')) {
        var b = d.createElement('button');
        b.type = 'button'; b.id = 'hmV2More';
        b.onclick = toggleAll;
        b.innerHTML = moreLab(p);
        p.appendChild(b);
      }
      return true;
    } catch (e) {
      /* 무엇이 어긋났든 <b>예전 화면</b>으로 — 빈 화면을 남기지 않습니다 */
      try { p.classList.remove('hm-v2', 'hm-v2-all'); var m = d.getElementById('hmV2More'); if (m) m.remove(); } catch (e2) {}
      try { if (typeof g.toast === 'function') g.toast('새 오늘 화면을 못 세워 예전 화면으로 보여 드립니다'); } catch (e3) {}
      return false;
    }
  }

  g.HOME_V2 = { on: on, set: set, use: use, chip: chip, apply: apply, toggleAll: toggleAll,
                KEEP: KEEP, FLAT: FLAT, KEY: KEY, allowed: function () { return ALLOWED; } };
})(window);
