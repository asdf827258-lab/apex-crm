/* ═══════════════════════════════════════════════════════════════════
   team-v2.js — 👥 <b>팀 한눈에(지점장) · 🙋 나 — 시안 9차 그대로</b> (판 X528)

   사장님 말씀 (2026-11-23) 「6번 해」 — 시안 9차 점검표 고칠 차례 ⑥ 알리기 탭 · 팀 탭(지점장) · 나.
   알리기는 grow-v2.js, 이 파일은 <b>팀</b>과 <b>나</b>입니다.

   ── 어디서 여나 ──────────────────────────────────────────────────
   ★ 시안은 지점장에게 아래 탭 「팀」 을 하나 더 줍니다. 그런데 아래 탭 띠는 사장님 말씀 「그대로 둬」 —
     그래서 <b>새 오늘 화면의 팀원 동그라미 줄 밑 「📊 우리 팀 한눈에」</b> 에서 시트로 엽니다(지점장 · 대표만 · hwhoCan).
   ★ 시안의 「나」 는 오른쪽 위 단추 — 위 띠의 🎙/? 단추도 「그대로 둬」 라 <b>새 오늘 화면 맨 위 줄(이름 가리기 옆)</b>에 「🙋 나」.

   ── 팀 한눈에 — 시안 rTeam · openMember 차례 그대로, 칸 속은 라이브 숫자 그대로 (1번 · 5번) ──
       누가 우리 팀인가 = hwhoRoster(지점장은 자기 팀만 · 대표는 전부 — 오늘 동그라미 줄과 같은 명단) · 이름 hwhoName · 팀 arTeamOf/arTeamName
       목표 · 실적 = monthly_perf(PF.rows — 「DB · 업적관리」 · 새 오늘 목표 칸과 같은 칸, 만원)
       예상 = 진행 중 예상업적(APEX_PEX.sum(…).live.won — 새 오늘 목표 칸 · 업적관리와 같은 자, 원 → 만원 한 곳)
       오늘 전화 = 성장판이 읽는 calls(GB — 그날 몇 통) · 오늘 알리기 = 체크판 d10(아침 미션 ⑤ — 내 것은 이 기기 체크판)
       오늘 활동 0 = 성장판이 본 마지막 활동(전화 · 고객 · 만든 자료 · 체크판)이 오늘이 아니고 알리기도 안 한 분
       오늘 챙길 = 오늘 동그라미 줄의 그 숫자(hwhoList n)
     못 읽었으면 「읽는 중」 — 0 으로 안 적습니다. 시안의 「💬 응원 한마디」 는 라이브에 보내는 자리가 없어 안 세웁니다.
     목표 고치기 = 내 것은 새 오늘 목표 시트(HOME_V2.goal), 팀원 것은 지금처럼 「DB · 업적관리」(arGoCat('dbperf')).
     「👀 이분 화면 보기」 = 오늘 동그라미를 누른 것과 같은 hwhoSet.
   ── 나 — 시안 openMe 그대로: 메뉴 표(TABS)의 나 · 공지 · 설정 · 요금제 · 약관 · 출발 점검 · 폰에 설치 · 건의함
       (등급 · 대표 전용은 navItemOf · osTabAllowed 그대로 — 막힌 것은 안 섬)

   ── 깨지지 않게 ─────────────────────────────────────────────────
     · 서버에 <b>쓰지 않습니다</b>. 읽기도 새로 짜지 않고 있던 arLoad · gbLoad · pfLoad 를 부르기만(이미 읽었으면 안 부름).
     · index.html 은 두 자리 — 싣기 한 줄 · 성장판 셈(gbCalc)이 그날 전화 수와 그날 체크 칸을 GB 에 남기는 두 줄(읽은 것을 버리지 않게만).
     · 시트는 새 오늘 화면의 그 시트(HOME_V2.sheet) — 새 오늘 화면을 끄면(ALLOWED · ↩ 예전 화면) 들어오는 단추도 같이 사라집니다.
   점검: scripts/check-growv2.js
   ═══════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var PROMO_CK = 'd10';
  var ME_IDS = ['me', 'notice', 'settings', 'pricing', 'terms', 'ready', 'phone_app', 'voice'];   /* 시안 openMe 차례 (health 는 라이브에 그 화면이 없음) */
  var S = { f: '전체', by: 'gap', q: '', tries: 0, open: '' };

  function E(s) {
    if (typeof g.osEsc === 'function') return g.osEsc(s == null ? '' : String(s));
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function T(fn, def) { try { var v = fn(); return (v === undefined || v === null) ? def : v; } catch (e) { return def; } }
  function Q(s) { return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
  function el(id) { return g.document.getElementById(id); }
  function man(n) { return (Math.round(n * 10) / 10).toLocaleString('ko-KR') + '만'; }

  /* ── 옷 — 시안 9차 CSS(.tgrid · .tt2 · .fchip · .seg · .tmr · .two · .tw · .who)를 .tm2 아래로만 ── */
  function css() {
    var d = g.document;
    if (d.getElementById('teamV2Css')) return;
    var C = [
      '.tm2{--ink:#191F28;--sub:#4E5968;--sub2:#6B7684;--sub3:#8B95A1;--line2:#F2F4F6;--blue:#1A56DB;--blue-l:#EAF1FF;--neg:#E5484D;--pos:#0B8A4E;--warn:#C2410C;--warn-l:#FFF1E6;--pr:#7C5CFC;--pr-l:#F1EDFF;color:var(--ink);font-size:15px;line-height:1.45;word-break:keep-all}',
      '.tm2 *{box-sizing:border-box}',
      '.tm2 h1{font-size:22px;font-weight:800;letter-spacing:-.4px;margin:4px 0 2px}',
      '.tm2 .lead{font-size:14px;color:var(--sub2);margin:0 0 12px}',
      '.tm2 .neg{color:var(--neg)} .tm2 .pos{color:var(--pos)}',
      '.tm2 .tgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
      '.tm2 .tt2{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:14px;border:0;border-radius:16px;background:#fff;font:inherit;color:inherit;text-align:left;cursor:pointer}',
      '.tm2 .tt2 b{font-size:22px;font-weight:800}',
      '.tm2 .tt2 span{font-size:13px;color:var(--sub2)}',
      '.tm2 .tt2.on{background:var(--ink);color:#fff}.tm2 .tt2.on span{color:#D1D6DB}.tm2 .tt2.on .neg{color:#FF8A8F}',
      '.tm2 .chips{display:flex;gap:6px;overflow-x:auto;flex-wrap:nowrap;margin:12px 0 8px;padding-bottom:2px}',
      '.tm2 .fchip{flex:none;text-align:center;height:34px;padding:0 14px;border-radius:17px;border:1px solid #E5E8EB;background:#fff;font:inherit;font-size:14px;font-weight:600;color:var(--sub);cursor:pointer}',
      '.tm2 .fchip.on{background:var(--ink);border-color:var(--ink);color:#fff}',
      '.tm2 .seg{display:flex;background:#E5E8EB;border-radius:12px;padding:3px;margin:0 0 10px}',
      '.tm2 .seg button{flex:1;text-align:center;height:34px;border:0;border-radius:10px;background:none;font:inherit;font-size:14px;font-weight:600;color:var(--sub2);cursor:pointer}',
      '.tm2 .seg button.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.08)}',
      '.tm2 .rows{background:#fff;border-radius:18px;padding:2px 16px}',
      '.tm2 .tmr{display:block;width:100%;padding:12px 0;border:0;border-top:1px solid var(--line2);background:none;font:inherit;color:inherit;text-align:left;cursor:pointer}',
      '.tm2 .tmr:first-child{border-top:0}',
      '.tm2 .tmr-a{display:flex;justify-content:space-between;align-items:baseline;gap:8px}',
      '.tm2 .tmr-n{font-size:16px;font-weight:700}.tm2 .tmr-n small{font-size:13px;font-weight:600;color:var(--sub3);margin-left:4px}',
      '.tm2 .tmr-v{font-size:14px;font-weight:700;color:var(--sub)}.tm2 .tmr-v.w{color:var(--warn)}',
      '.tm2 .tmr-bar{position:relative;height:8px;border-radius:4px;background:var(--line2);margin:8px 0 6px;display:flex;overflow:visible}',
      '.tm2 .tmr-bar i{display:block;height:100%}.tm2 .tmr-bar i.act{background:var(--blue);border-radius:4px 0 0 4px}.tm2 .tmr-bar i.exp{background:#B9CDF6}',
      '.tm2 .tmr-bar .gl{position:absolute;top:-3px;width:2px;height:14px;background:var(--ink);border-radius:1px}',
      '.tm2 .tmr-s{display:flex;flex-wrap:wrap;gap:10px;font-size:13px;color:var(--sub2)}',
      '.tm2 .tmr-s .ok{color:var(--pr);font-weight:700}.tm2 .tmr-s .no{color:var(--sub3)}',
      '.tm2 .tmr-s em{font-style:normal;font-weight:700;color:var(--warn)}',
      '.tm2 .box{background:#fff;border:1px solid #EEF0F2;border-radius:18px;padding:16px}',
      '.tm2 .box+.box{margin-top:10px}',
      '.tm2 .big{font-size:19px;font-weight:800;line-height:1.35}',
      '.tm2 .leg{display:flex;gap:14px;flex-wrap:wrap;font-size:13px;color:var(--sub2);margin-top:8px}.tm2 .leg b{color:var(--ink)}',
      '.tm2 .two{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}',
      '.tm2 .tw{background:#fff;border-radius:16px;padding:14px}.tm2 .tw.pr{background:var(--pr-l)}',
      '.tm2 .tw-h{font-size:13px;font-weight:700;color:var(--sub)}.tm2 .tw-s{margin-top:6px;font-size:15px;font-weight:600}',
      '.tm2 .who{display:flex;align-items:center;gap:12px}',
      '.tm2 .av{width:48px;height:48px;border-radius:50%;background:var(--blue-l);color:var(--blue);display:grid;place-items:center;font-size:20px;font-weight:800;flex:none}',
      '.tm2 .back{height:32px;padding:0 10px;border:0;border-radius:16px;background:#fff;font:inherit;font-size:13px;font-weight:700;color:var(--sub);cursor:pointer;margin-bottom:8px}',
      '.tm2 .wait{padding:28px 4px;text-align:center;color:var(--sub2);font-size:15px}',
      '.tm2 .list{background:#fff;border-radius:18px;padding:2px 16px}',
      '.tm2 .li{display:flex;align-items:center;gap:12px;padding:12px 0;min-height:58px;width:100%;border:0;background:none;font:inherit;color:inherit;text-align:left;cursor:pointer}',
      '.tm2 .li+.li{border-top:1px solid var(--line2)}',
      '.tm2 .tile{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;font-size:21px;background:var(--line2);flex:none}',
      '.tm2 .li .tx{flex:1;min-width:0}.tm2 .li .t1{font-size:16px;font-weight:600}',
      '.tm2 .li .t2{font-size:13px;color:var(--sub2);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.tm2 .li .ar{color:#B0B8C1;font-size:18px}',
      '.tm2 .btn{display:flex;align-items:center;justify-content:center;height:52px;width:100%;border:0;border-radius:14px;font:inherit;font-size:16px;font-weight:700;cursor:pointer;margin-top:10px}',
      '.tm2 .btn.p{background:var(--blue);color:#fff}.tm2 .btn.g{background:#fff;color:var(--ink)}',
      '.tm2 .foot{font-size:13px;color:var(--sub3);margin-top:12px}'
    ];
    var s = d.createElement('style'); s.id = 'teamV2Css'; s.textContent = C.join('\n');
    (d.head || d.documentElement).appendChild(s);
  }
  function sheet(inner) {
    css();
    try { g.HOME_V2.sheet('<div class="tm2">' + inner + '</div>'); return true; } catch (e) { return false; }
  }
  function close() { try { g.HOME_V2.close(); } catch (e) {} }

  /* ── 읽기 — 있던 창고에 묻기만 ───────────────────────────────────── */
  function GBo() { return T(function () { return g.GB; }, null); }
  function ready() { var B = GBo(); return !!(B && B.loaded && !B.busy); }
  /* 읽기 — 있던 함수를 부르기만, 이미 읽었으면 안 부름 */
  function ensure() {
    try { if (g.AR && !g.AR.loaded && typeof g.arLoad === 'function') g.arLoad(); } catch (e) {}
    try { var B = GBo(); if (B && !B.loaded && !B.busy && typeof g.gbLoad === 'function') g.gbLoad(); } catch (e2) {}
    try { if (g.PF && !g.PF.loaded && !g.PF.loading && typeof g.pfLoad === 'function') g.pfLoad(); } catch (e3) {}
  }
  function ym() { return (T(function () { return g.mstToday(); }, '') || new Date().toISOString().slice(0, 10)).slice(0, 7); }
  function pexWonOf(id) {
    var A = g.AR; if (!A || !A.loaded || !A.db || A.noPex || typeof g.APEX_PEX === 'undefined') return null;
    var L = [];
    for (var i = 0; i < A.db.length; i++) { var r = A.db[i]; if (r.who === id) L.push({ stage: r.stage, closed: r.closed, expect: r.expect, contract: r.contract, cdate: r.cAt }); }
    return T(function () { return g.APEX_PEX.sum(L, ym()).live.won; }, null);
  }
  /* 한 분 — 못 읽은 칸은 null */
  function stat(id, me, nList) {
    var B = GBo() || {}, PF = g.PF || {}, gday = T(function () { return g.gbDay(0); }, ''), cday = T(function () { return g.ckDayK(); }, '');
    var pr = null; (PF.rows || []).forEach(function (r) { if (r && r.owner_id === id) pr = r; });
    var row = null; (B.rows || []).forEach(function (r) { if (r && r.id === id) row = r; });
    var won = pexWonOf(id);
    var promo = id === me ? !!T(function () { return g.hmMsCk()[PROMO_CK]; }, false)
      : !!T(function () { return B.ckIt[id][cday][PROMO_CK]; }, false);
    var call = ready() && B.callDay ? (T(function () { return B.callDay[id][gday]; }, 0) || 0) : null;
    var tid = T(function () { return g.arTeamOf(id); }, '');
    return {
      id: id, me: id === me, nm: id === me ? '나' : T(function () { return g.hwhoName(id); }, '팀원'),
      tm: (tid && T(function () { return g.arTeamName(tid); }, '')) || '소속 없음',
      goal: pr ? (+pr.goal_prem || 0) : (PF.loaded ? 0 : null), act: pr ? (+pr.act_prem || 0) : (PF.loaded ? 0 : null),
      exp: won == null ? null : Math.round(won / 10000),
      call: call, promo: promo, n: nList[id] == null ? null : nList[id],
      zero: ready() ? !(promo || (row && row.last === gday) || call) : null
    };
  }
  function team() {
    var me = T(function () { return g.arMyId(); }, ''), ids = T(function () { return g.hwhoRoster().ids; }, []) || [], nl = {};
    (T(function () { return g.hwhoList(); }, []) || []).forEach(function (x) { nl[x.id] = x.n; });
    return ids.map(function (id) { return stat(id, me, nl); });
  }
  function gapOf(t) { return t.goal ? t.goal - (t.act || 0) - (t.exp || 0) : null; }
  function sorted(L, by) {
    return L.slice().sort(function (a, b) {
      if (by === 'act') return (b.act || 0) - (a.act || 0);
      if (by === 'move') return ((a.call || 0) + (a.promo ? 1 : 0)) - ((b.call || 0) + (b.promo ? 1 : 0));
      var ga = a.goal ? gapOf(a) : 1e9, gb = b.goal ? gapOf(b) : 1e9; return gb - ga;   /* 시안 그대로 — 목표 없는 분이 맨 앞 */
    });
  }

  /* ── 팀 한눈에 ──────────────────────────────────────────────────── */
  function rowHtml(t, top) {
    var w = function (v) { return Math.max(0, Math.min(100, (v || 0) / top * 100)); };
    return '<button type="button" class="tmr" onclick="teamV2Member(\'' + Q(t.id) + '\')"><div class="tmr-a"><div class="tmr-n">' + E(t.nm) + '<small>' + E(t.tm) + '</small></div>' +
      (t.goal ? '<div class="tmr-v">' + man(t.act || 0) + ' / ' + man(t.goal) + '</div>' : (t.goal === 0 ? '<div class="tmr-v w">목표 없음</div>' : '<div class="tmr-v">…</div>')) + '</div>' +
      '<div class="tmr-bar"><i class="act" style="width:' + w(t.act) + '%"></i><i class="exp" style="width:' + w(t.exp) + '%"></i>' + (t.goal ? '<span class="gl" style="left:' + Math.min(99.5, w(t.goal)) + '%"></span>' : '') + '</div>' +
      '<div class="tmr-s"><span>📞 ' + (t.call == null ? '…' : t.call) + '</span>' + (t.n != null ? '<span>오늘 챙길 ' + t.n + '</span>' : '') +
      '<span class="' + (t.promo ? 'ok' : 'no') + '">📣 ' + (t.promo ? '올림' : '아직') + '</span>' + (t.zero ? '<em>오늘 활동 0</em>' : '') + '</div></button>';
  }
  function teamHtml() {
    var L0 = team();
    if (!ready() || !L0.length) return '<h1>우리 팀 한눈에</h1><div class="wait">팀 명단을 읽는 중이에요…</div>';
    var tms = ['전체']; L0.forEach(function (t) { if (tms.indexOf(t.tm) < 0) tms.push(t.tm); });
    if (tms.indexOf(S.f) < 0) S.f = '전체';
    var L = L0.filter(function (t) {
      if (S.f !== '전체' && t.tm !== S.f) return false;
      if (S.q === 'nogoal') return t.goal === 0; if (S.q === 'zero') return !!t.zero; if (S.q === 'nopromo') return !t.promo;
      return true;
    });
    var sg = 0, ga = 0, sa = 0, se = 0, gn = 0, none = 0, zero = 0, np = 0, top = 1;
    L0.forEach(function (t) {
      sa += t.act || 0; se += t.exp || 0; if (t.goal) { sg += t.goal; ga += t.act || 0; gn++; } else if (t.goal === 0) none++;
      if (t.zero) zero++; if (!t.promo) np++; top = Math.max(top, t.goal || 0, (t.act || 0) + (t.exp || 0));
    });
    var pfOk = !!(g.PF && g.PF.loaded);
    var tile = function (k, big, lab, warn) { return '<button type="button" class="tt2' + (S.q === k ? ' on' : '') + '" onclick="teamV2Q(\'' + k + '\')"><b class="' + (warn ? 'neg' : '') + '">' + big + '</b><span>' + lab + '</span></button>'; };
    return '<h1>우리 팀 한눈에</h1><div class="lead">' + (+ym().slice(5, 7)) + '월 · ' + L0.length + '명 · 「DB · 업적관리」 와 같은 숫자</div>' +
      '<div class="tgrid"><button type="button" class="tt2" onclick="teamV2Q(\'\')"><b>' + (pfOk && sg ? Math.round(ga / sg * 100) + '%' : '—') + '</b><span>' +
        (pfOk ? '목표 있는 ' + gn + '명 기준 · 팀 실적 ' + man(sa) + (se ? ' · 예상 ' + man(se) : '') : '목표를 읽는 중이에요') + '</span></button>' +
        tile('nogoal', pfOk ? none + '명' : '…', '목표 없음', none) + tile('zero', zero + '명', '오늘 활동 0', zero) + tile('nopromo', np + '명', '오늘 알리기 안 함', np) + '</div>' +
      (tms.length > 2 ? '<div class="chips">' + tms.map(function (x) { return '<button type="button" class="fchip' + (S.f === x ? ' on' : '') + '" onclick="teamV2F(\'' + Q(x) + '\')">' + E(x) + '</button>'; }).join('') + '</div>' : '<div style="height:12px"></div>') +
      '<div class="seg">' + [['gap', '모자란 순'], ['act', '실적 순'], ['move', '활동 적은 순']].map(function (x) { return '<button type="button" class="' + (S.by === x[0] ? 'on' : '') + '" onclick="teamV2By(\'' + x[0] + '\')">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="rows">' + (L.length ? sorted(L, S.by).map(function (t) { return rowHtml(t, top); }).join('') : '<div class="wait">해당하는 사람이 없어요</div>') + '</div>' +
      '<button type="button" class="btn g" onclick="teamV2Old()">예전 팀 화면(DB · 업적관리)</button>';
  }
  function memberHtml(id) {
    var t = null; team().forEach(function (x) { if (x.id === id) t = x; });
    if (!t) return teamHtml();
    var gap = gapOf(t);
    return '<button type="button" class="back" onclick="teamV2Open()">‹ 팀 한눈에</button>' +
      '<div class="who"><div class="av">' + E(String(t.nm).charAt(0)) + '</div><div><div style="font-size:20px;font-weight:800">' + E(t.nm) + (t.me ? '' : '님') + '</div><div style="font-size:14px;color:var(--sub2)">' + E(t.tm) + '</div></div></div>' +
      '<div class="box" style="margin-top:14px">' +
        (t.goal ? '<div class="big">' + (gap > 0 ? '이대로면 <span class="neg">' + man(gap) + '</span> 모자라요' : '예상대로 되면 <span class="pos">목표를 넘어요</span>') + '</div>'
          : '<div class="big">' + (t.goal === 0 ? '목표가 <span class="neg">아직 없어요</span>' : '목표를 읽는 중이에요') + '</div>') +
        '<div class="leg"><span>실적 <b>' + (t.act == null ? '…' : man(t.act)) + '</b></span><span>예상 <b>' + (t.exp == null ? '못 읽음' : man(t.exp)) + '</b></span><span>목표 <b>' + (t.goal ? man(t.goal) : '—') + '</b></span></div></div>' +
      '<div class="two"><div class="tw"><div class="tw-h">💼 오늘 영업</div><div class="tw-s">전화 ' + (t.call == null ? '…' : t.call) + (t.n != null ? ' · 챙길 ' + t.n : '') + '</div></div>' +
        '<div class="tw pr"><div class="tw-h">📣 오늘 알리기</div><div class="tw-s">' + (t.promo ? '올렸어요' : '아직이에요') + '</div></div></div>' +
      (t.me ? '<button type="button" class="btn p" onclick="teamV2Goal()">' + (t.goal ? '목표 고치기' : '목표 정하기') + '</button>'
        : '<button type="button" class="btn p" onclick="teamV2See(\'' + Q(t.id) + '\')">👀 이분 화면 그대로 보기</button>' +
          '<button type="button" class="btn g" onclick="teamV2Old()">' + (t.goal ? '목표 고치기' : '목표 정하기') + ' — DB · 업적관리에서</button>');
  }
  function paintOpen() {
    var sh = el('hv2Sheet'); if (!sh || !sh.classList.contains('on') || !sh.querySelector('.tm2[data-tv]')) return;
    var box = sh.querySelector('.tm2[data-tv]');
    box.innerHTML = S.open ? memberHtml(S.open) : teamHtml();
  }
  /* 읽는 중이면 다 읽을 때까지 잠깐씩 다시 그립니다 — 서버를 더 부르지 않고 창고만 다시 봄 */
  function wait() {
    if (S.tries > 40) return;
    S.tries++;
    setTimeout(function () { var B = GBo(); paintOpen(); if (!B || !B.loaded || B.busy || !(g.PF && g.PF.loaded)) wait(); }, 700);
  }
  function open() {
    if (!T(function () { return g.hwhoCan(); }, false)) return;
    ensure(); S.open = ''; S.tries = 0;
    if (!sheet('')) { try { g.arGoCat('team'); g.go('airep'); } catch (e) {} return; }
    var sh = el('hv2Sheet'), box = sh && sh.querySelector('.tm2'); if (box) { box.setAttribute('data-tv', '1'); box.innerHTML = teamHtml(); }
    wait();
  }
  function member(id) { S.open = id; paintOpen(); var sh = el('hv2Sheet'); if (sh) sh.scrollTop = 0; }
  function setQ(k) { S.q = S.q === k ? '' : k; paintOpen(); }
  function setF(x) { S.f = x; paintOpen(); }
  function setBy(x) { S.by = x; paintOpen(); }
  function see(id) { close(); try { g.hwhoSet(id); } catch (e) {} try { g.go('home'); } catch (e2) {} }
  function goal() { try { g.HOME_V2.goal(); } catch (e) {} }
  function old() { close(); try { g.arGoCat('dbperf'); } catch (e) {} try { g.go('airep'); } catch (e2) {} }

  /* ── 나 ─────────────────────────────────────────────────────────── */
  function meHtml() {
    var rows = ME_IDS.filter(function (id) {
      return !!T(function () { return g.navItemOf(id); }, null) && T(function () { return g.osTabAllowed(id); }, true) !== false;
    }).map(function (id) {
      var nm = T(function () { return g.ctName(id); }, id), ic = T(function () { return g.ctIcon(id); }, ''), ds = T(function () { return g.ctDesc(id); }, '');
      return '<button type="button" class="li" onclick="meV2Go(\'' + id + '\')"><div class="tile">' + E(ic || '·') + '</div><div class="tx"><div class="t1">' + E(nm) + '</div>' + (ds ? '<div class="t2">' + E(ds) + '</div>' : '') + '</div><span class="ar">›</span></button>';
    }).join('');
    return '<h1 style="margin-bottom:12px">나</h1>' + (rows ? '<div class="list">' + rows + '</div>' : '<div class="wait">열 수 있는 칸이 없어요</div>') +
      '<div class="foot">메뉴 전체는 위 ☰ 에 그대로 있어요</div>';
  }
  function meOpen() { if (!sheet(meHtml())) { try { g.go('me'); } catch (e) {} } }
  function meGo(id) { close(); try { g.go(id); } catch (e) {} }

  g.TEAM_V2 = { open: open, team: team, stat: stat, meOpen: meOpen, ME_IDS: ME_IDS, PROMO_CK: PROMO_CK };
  /* onclick 이 부르는 이름 — 점(.) 없는 함수 */
  g.teamV2Open = open;
  g.teamV2Member = member;
  g.teamV2Q = setQ;
  g.teamV2F = setF;
  g.teamV2By = setBy;
  g.teamV2See = see;
  g.teamV2Goal = goal;
  g.teamV2Old = old;
  g.meV2Open = meOpen;
  g.meV2Go = meGo;
})(window);
