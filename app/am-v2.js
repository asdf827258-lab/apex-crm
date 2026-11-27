/* ═══════════════════════════════════════════════════════════════════
   am-v2.js — ☀️ <b>팀 아침 점검 · 지점장 체크리스트</b> (판 X589)

   사장님 말씀 (2026-11-27) 「팀원들 아침 관리와 체크리스트 정리 하고 싶어」.

   ── 어디서 여나 ──────────────────────────────────────────────────
   ★ 새 오늘 화면 팀원 동그라미 밑 「📊 우리 팀 한눈에」 아래 한 줄 · 팀 한눈에 시트 맨 아래 단추 — 지점장 · 대표만(hwhoCan).
     아래 탭 띠 · 🎙/? 단추는 그대로(사장님 말씀 「그대로 둬」).

   ── 한 장에 셋 ───────────────────────────────────────────────────
   ① 팀원 한 줄씩 — 출근 · 오늘의 미션 네 칸 · 오늘 약속 · 오늘 전화
       출근 = 성장판이 읽은 출근(GB.rows lastAtt — 출근 현황과 같은 표)
       미션 = 팀원이 찍은 그날 체크판(GB.ckIt — 새 오늘 「🎯 오늘의 미션」 이 찍는 그 칸: 📞 d4·d5 · ✍️ d6·d8 · 🩺 d9 · 📣 d10)
              🤝 약속 미션은 팀원 기기에서만 끝났는지 알아(만났어요 · 이분 끝) — 그래서 여기서는 「오늘 약속 n곳」 으로만 적습니다(지어내지 않음).
       약속 = 배정 줄 약속(AR.db appt · 달력 · 챙기는 중과 같은 자) · 전화 = 성장판 그날 통수(GB.callDay — 팀 한눈에와 같은 자)
       활동 0 = 팀 한눈에(TEAM_V2.team)의 그 판정 그대로
     못 읽었으면 「…」 — 0 으로 안 적습니다(1번).
   ② 💬 아침 점검 카톡 문구 — 출근 전 · 미션 안 연 분 · 오늘 약속을 한 덩이로 <b>복사만</b>(보내기는 사장님이 · 저장 없음).
       팀원 이름만 들어가고 고객 이름은 안 들어갑니다.
   ③ 📋 지점장 체크리스트 — 실행 체크판 지점장 탭의 표(CK_LDR a 아침 · b 오전 · c 오후 · d 마감) 그대로.
       ✓ 는 있던 ckToggle('day', id) — 실행 체크판 · 달력과 같은 칸(새 저장 코드 없음).
       칸 옆 숫자(출근 전 · 활동 0 · 먼저 볼 사람)는 ①과 성장판(gbMiss)이 이미 센 것.

   ── 깨지지 않게 ─────────────────────────────────────────────────
     · 서버에 새로 묻지 않습니다 — 있던 gbLoad · arLoad 를 안 읽었을 때만 부름.
     · 시트는 새 오늘 화면의 그 시트(HOME_V2.sheet) — 새 화면을 끄면 들어오는 단추도 같이 사라짐.
   점검: scripts/check-amv2.js
   ═══════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var MIS4 = [['📞', '전화 · 카톡', ['d4', 'd5']], ['✍️', '기록', ['d6', 'd8']], ['🩺', '내일 자료', ['d9']], ['📣', 'SNS', ['d10']]];
  var LDR = [['a', '☀️', '아침 · 출근 시간'], ['b', '👤', '오전 · 사람에게 물어서'], ['c', '🖥️', '오후 · 화면에서'], ['d', '🌙', '마감 · 퇴근 전']];
  var S = { q: '', tries: 0 };

  function E(s) {
    if (typeof g.osEsc === 'function') return g.osEsc(s == null ? '' : String(s));
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function T(fn, def) { try { var v = fn(); return (v === undefined || v === null) ? def : v; } catch (e) { return def; } }
  function Q(s) { return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
  function el(id) { return g.document.getElementById(id); }
  function strip(s) { return String(s == null ? '' : s).replace(/<[^>]*>/g, ''); }

  function css() {
    var d = g.document;
    if (d.getElementById('amV2Css')) return;
    var C = [
      '.am2{--ink:#191F28;--sub:#4E5968;--sub2:#6B7684;--sub3:#8B95A1;--line2:#F2F4F6;--blue:#1A56DB;--blue-l:#EAF1FF;--pos:#0B8A4E;--pos-l:#E7F6EE;--warn:#C2410C;--warn-l:#FFF1E6;color:var(--ink);font-size:15px;line-height:1.45;word-break:keep-all}',
      '.am2 *{box-sizing:border-box}',
      '.am2 h1{font-size:22px;font-weight:800;letter-spacing:-.4px;margin:4px 0 2px}',
      '.am2 h2{display:flex;align-items:baseline;justify-content:space-between;font-size:18px;font-weight:800;margin:22px 2px 8px}.am2 h2 small{font-size:14px;font-weight:700;color:var(--blue)}',
      '.am2 .lead{font-size:14px;color:var(--sub2);margin:0 0 12px}',
      '.am2 .tg{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
      '.am2 .tt{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:14px;border:0;border-radius:16px;background:#fff;font:inherit;color:inherit;text-align:left;cursor:pointer}',
      '.am2 .tt b{font-size:22px;font-weight:800}.am2 .tt b.w{color:var(--warn)}.am2 .tt span{font-size:13px;color:var(--sub2)}',
      '.am2 .tt.on{background:var(--ink);color:#fff}.am2 .tt.on span{color:#D1D6DB}.am2 .tt.on b.w{color:#FFB38A}',
      '.am2 .rows{background:#fff;border-radius:18px;padding:2px 16px;margin-top:12px}',
      '.am2 .r{display:block;width:100%;padding:12px 0;border:0;border-top:1px solid var(--line2);background:none;font:inherit;color:inherit;text-align:left;cursor:pointer}',
      '.am2 .r:first-child{border-top:0}',
      '.am2 .ra{display:flex;justify-content:space-between;align-items:center;gap:8px}',
      '.am2 .rn{font-size:16px;font-weight:700}.am2 .rn small{font-size:13px;font-weight:600;color:var(--sub3);margin-left:4px}',
      '.am2 .at{flex:none;font-size:13px;font-weight:700;padding:3px 10px;border-radius:99px;background:var(--line2);color:var(--sub2)}',
      '.am2 .at.ok{background:var(--pos-l);color:var(--pos)}.am2 .at.no{background:var(--warn-l);color:var(--warn)}',
      '.am2 .rb{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin-top:7px;font-size:13px;color:var(--sub2)}',
      '.am2 .md{display:inline-flex;gap:3px}.am2 .md i{font-style:normal;display:inline-grid;place-items:center;min-width:28px;height:24px;padding:0 4px;border-radius:8px;background:var(--line2);opacity:.45;font-size:13px}',
      '.am2 .md i.on{background:var(--blue-l);opacity:1}',
      '.am2 .rb em{font-style:normal;font-weight:700;color:var(--warn)}.am2 .rb b{color:var(--ink)}',
      '.am2 .btn{display:flex;align-items:center;justify-content:center;height:52px;width:100%;border:0;border-radius:14px;font:inherit;font-size:16px;font-weight:700;cursor:pointer;margin-top:10px}',
      '.am2 .btn.p{background:var(--blue);color:#fff}.am2 .btn.g{background:#fff;color:var(--ink)}',
      '.am2 .msg{white-space:pre-wrap;background:#FFFBEA;border:1px solid #F5E3A3;border-radius:14px;padding:12px 14px;font-size:14px;line-height:1.6;margin-top:10px}',
      '.am2 .ck{background:#fff;border-radius:18px;padding:4px 16px;margin-top:8px}',
      '.am2 .ckh{display:flex;justify-content:space-between;align-items:center;font-size:14px;font-weight:800;color:var(--sub);padding:12px 0 4px}.am2 .ckh span{color:var(--blue)}',
      '.am2 .ci{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--line2)}',
      '.am2 .cb{flex:none;width:44px;height:44px;border:0;border-radius:12px;background:var(--line2);font:inherit;font-size:18px;font-weight:800;color:#fff;cursor:pointer}',
      '.am2 .cb.on{background:var(--pos)}',
      '.am2 .ct{flex:1;min-width:0}.am2 .ct b{display:block;font-size:15px;font-weight:700}.am2 .ct small{display:block;font-size:13px;color:var(--sub2)}',
      '.am2 .ci.on .ct b{color:var(--sub2);text-decoration:line-through}',
      '.am2 .ct em{font-style:normal;font-weight:700;color:var(--warn)}',
      '.am2 .cg{flex:none;height:40px;padding:0 8px;border:0;background:none;font:inherit;font-size:14px;font-weight:700;color:var(--blue);cursor:pointer}',
      '.am2 .wait{padding:28px 4px;text-align:center;color:var(--sub2);font-size:15px}',
      '.am2 .foot{font-size:13px;color:var(--sub3);margin-top:12px}'
    ];
    var s = d.createElement('style'); s.id = 'amV2Css'; s.textContent = C.join('\n');
    (d.head || d.documentElement).appendChild(s);
  }
  function sheet(inner) { css(); try { g.HOME_V2.sheet('<div class="am2" data-am="1">' + inner + '</div>'); return true; } catch (e) { return false; } }
  function close() { try { g.HOME_V2.close(); } catch (e) {} }

  /* ── 읽기 — 있던 창고만 ─────────────────────────────────────────── */
  function GBo() { return T(function () { return g.GB; }, null); }
  function ready() { var B = GBo(); return !!(B && B.loaded && !B.busy); }
  function ensure() {
    try { if (g.AR && !g.AR.loaded && typeof g.arLoad === 'function') g.arLoad(); } catch (e) {}
    try { var B = GBo(); if (B && !B.loaded && !B.busy && typeof g.gbLoad === 'function') g.gbLoad(); } catch (e2) {}
  }
  function today() { return T(function () { return g.mcalToday(); }, '') || new Date().toISOString().slice(0, 10); }
  function dayLabel() { var t = today(), d = new Date(t + 'T00:00:00Z'); return (+t.slice(5, 7)) + '/' + (+t.slice(8, 10)) + '(' + '일월화수목금토'.charAt(d.getUTCDay()) + ')'; }
  function apptsOf(id) {
    var td = today();
    if (!T(function () { return g.AR.loaded; }, false)) return null;
    return (T(function () { return g.AR.db; }, []) || []).filter(function (r) { return r && r.who === id && r.appt && String(r.appt).slice(0, 10) === td; })
      .map(function (r) { return String(r.appt).slice(11, 16); }).sort();
  }
  /* 한 분 — 못 읽은 칸은 null */
  function one(t) {
    var B = GBo() || {}, gd = T(function () { return g.gbDay(0); }, ''), cd = T(function () { return g.ckDayK(); }, '');
    var row = null; (B.rows || []).forEach(function (r) { if (r && r.id === t.id) row = r; });
    var it = ready() ? (T(function () { return B.ckIt[t.id][cd]; }, {}) || {}) : null;
    var mis = it ? MIS4.map(function (m) { return m[2].every(function (k) { return !!it[k]; }); }) : null;
    return {
      id: t.id, nm: t.nm, tm: t.tm, call: t.call, zero: t.zero,
      att: ready() ? !!(row && row.lastAtt === gd) : null,
      mis: mis, misN: mis ? mis.filter(Boolean).length : null,
      ap: apptsOf(t.id)
    };
  }
  function team() {
    return (T(function () { return g.TEAM_V2.team(); }, []) || []).filter(function (t) { return t && !t.me; }).map(one);
  }
  function sortL(L) {
    return L.slice().sort(function (a, b) {
      var x = (a.att === false ? 0 : 1) - (b.att === false ? 0 : 1); if (x) return x;
      return (a.misN || 0) - (b.misN || 0);
    });
  }
  function counts(L) {
    var c = { noatt: 0, nomis: 0, ap: 0, apN: 0, zero: 0 };
    L.forEach(function (t) {
      if (t.att === false) c.noatt++;
      if (t.misN === 0) c.nomis++;
      if (t.ap && t.ap.length) { c.ap += t.ap.length; c.apN++; }
      if (t.zero) c.zero++;
    });
    return c;
  }

  /* ── ① 팀원 한 줄씩 ─────────────────────────────────────────────── */
  function rowHtml(t) {
    var at = t.att == null ? '<span class="at">출근 …</span>' : t.att ? '<span class="at ok">출근 ✓</span>' : '<span class="at no">출근 전</span>';
    var md = t.mis ? '<span class="md" aria-label="오늘의 미션 ' + t.misN + ' / 4">' + MIS4.map(function (m, i) { return '<i class="' + (t.mis[i] ? 'on' : '') + '" title="' + E(m[1]) + '">' + m[0] + '</i>'; }).join('') + '<b style="margin-left:4px;font-size:13px">' + t.misN + '/4</b></span>' : '<span>미션 …</span>';
    var ap = t.ap == null ? '🤝 …' : t.ap.length ? '🤝 약속 <b>' + t.ap.length + '곳</b>' + (t.ap[0] ? ' · ' + E(t.ap[0]) + '부터' : '') : '🤝 약속 없음';
    return '<button type="button" class="r" onclick="amV2Member(\'' + Q(t.id) + '\')"><div class="ra"><div class="rn">' + E(t.nm) + '<small>' + E(t.tm) + '</small></div>' + at + '</div>' +
      '<div class="rb">' + md + '<span>' + ap + '</span><span>📞 ' + (t.call == null ? '…' : t.call + '통') + '</span>' + (t.zero ? '<em>오늘 활동 0</em>' : '') + '</div></button>';
  }
  /* ── ② 아침 점검 카톡 문구 — 복사만 ─────────────────────────────── */
  function msgText(L) {
    var c = counts(L), na = L.filter(function (t) { return t.att === false; }), nm = L.filter(function (t) { return t.misN === 0; }), ap = L.filter(function (t) { return t.ap && t.ap.length; });
    var nmOf = function (t) { return String(t.nm || '').replace(/님$/, ''); };
    var out = ['[' + dayLabel() + ' 아침 점검]'];
    if (ready()) out.push('✅ 출근 ' + (L.length - c.noatt) + ' / ' + L.length + '명' + (na.length ? '\n⏰ 출근 전: ' + na.map(nmOf).join(' · ') : ''));
    if (ap.length) out.push('🤝 오늘 약속: ' + ap.map(function (t) { return nmOf(t) + ' ' + t.ap.length + '곳'; }).join(' · '));
    if (nm.length) out.push('🎯 미션 아직 안 연 분: ' + nm.map(nmOf).join(' · '));
    out.push('');
    out.push('🎯 오늘의 미션 다섯 칸 — 📞 전화·카톡 / 🤝 약속 / ✍️ 기록 / 🩺 내일 자료 / 📣 SNS');
    out.push('끝낼 때마다 「✓ 했어요」 눌러 주세요. 오늘도 한 칸씩 💪');
    return out.join('\n');
  }
  /* ── ③ 지점장 체크리스트 — 실행 체크판 지점장 표 그대로 ──────────── */
  function hintOf(kind, c) {
    if (!ready()) return '';
    if (kind === 'att') return c.noatt ? '출근 전 ' + c.noatt + '명' : '전원 출근';
    if (kind === 'noact') return c.zero ? '오늘 활동 0 · ' + c.zero + '명' : '';
    if (kind === 'miss') { var n = T(function () { return g.gbMiss(g.gbScope()).length; }, null); return n ? '먼저 볼 사람 ' + n + '명' : ''; }
    return '';
  }
  function ckHtml(c) {
    var D = T(function () { return g.CK_LDR; }, null); if (!D || typeof g.ckLoad !== 'function') return '';
    var on = T(function () { return g.ckLoad('day'); }, {}) || {}, all = 0, done = 0;
    var body = LDR.map(function (gp) {
      var L = D[gp[0]] || []; if (!L.length) return '';
      var k = 0;
      var rows = L.map(function (x) {
        var id = x[0], v = !!on[id], hint = hintOf(x[5] || '', c); all++; if (v) { k++; done++; }
        return '<div class="ci' + (v ? ' on' : '') + '"><button type="button" class="cb' + (v ? ' on' : '') + '" aria-label="' + E(strip(x[1])) + (v ? ' 되돌리기' : ' 했어요') + '" onclick="amV2Ck(\'' + Q(id) + '\')">' + (v ? '✓' : '') + '</button>' +
          '<div class="ct"><b>' + E(strip(x[1])) + '</b>' + ((x[2] || hint) ? '<small>' + (hint ? '<em>' + E(hint) + '</em>' + (x[2] ? ' · ' : '') : '') + E(strip(x[2] || '')) + '</small>' : '') + '</div>' +
          (x[4] ? '<button type="button" class="cg" onclick="amV2Go(\'' + Q(x[4]) + '\')">' + E(x[3] || '가기') + ' ›</button>' : '') + '</div>';
      }).join('');
      return '<div class="ckh">' + gp[1] + ' ' + E(gp[2]) + '<span>' + k + ' / ' + L.length + '</span></div>' + rows;
    }).join('');
    return '<h2>📋 지점장 체크리스트<small>' + done + ' / ' + all + '</small></h2><div class="ck">' + body + '</div>' +
      '<div class="foot">실행 체크판 지점장 탭과 같은 칸이에요 — 여기서 누르면 거기도, 달력도 같이 바뀌어요</div>';
  }

  function html() {
    var L0 = team();
    if (!L0.length) return '<h1>☀️ 팀 아침 점검</h1><div class="wait">팀 명단을 읽는 중이에요…</div>' + ckHtml(counts([]));
    var c = counts(L0);
    var L = L0.filter(function (t) {
      if (S.q === 'noatt') return t.att === false; if (S.q === 'nomis') return t.misN === 0; if (S.q === 'ap') return !!(t.ap && t.ap.length); if (S.q === 'zero') return !!t.zero;
      return true;
    });
    var r = ready();
    var tile = function (k, big, lab, warn) { return '<button type="button" class="tt' + (S.q === k ? ' on' : '') + '" onclick="amV2Q(\'' + k + '\')"><b class="' + (warn ? 'w' : '') + '">' + big + '</b><span>' + lab + '</span></button>'; };
    return '<h1>☀️ 팀 아침 점검</h1><div class="lead">' + E(dayLabel()) + ' · ' + L0.length + '명 · 출근 → 오늘의 미션 → 약속 순서로 보세요</div>' +
      '<div class="tg">' + tile('noatt', r ? c.noatt + '명' : '…', '출근 전', c.noatt) + tile('nomis', r ? c.nomis + '명' : '…', '미션 아직 안 연 분', c.nomis) +
        tile('ap', T(function () { return g.AR.loaded; }, false) ? c.ap + '곳' : '…', '오늘 약속' + (c.apN ? ' · ' + c.apN + '명' : '')) + tile('zero', r ? c.zero + '명' : '…', '오늘 활동 0', c.zero) + '</div>' +
      '<div class="rows">' + (L.length ? sortL(L).map(rowHtml).join('') : '<div class="wait">해당하는 사람이 없어요</div>') + '</div>' +
      '<div class="foot">미션 네 칸 = 📞 전화·카톡 · ✍️ 기록 · 🩺 내일 자료 · 📣 SNS (팀원이 「✓ 했어요」 누른 것) · 🤝 약속은 곳 수로</div>' +
      '<h2>💬 아침 점검 카톡 문구</h2><div class="msg">' + E(msgText(L0)) + '</div>' +
      '<button type="button" class="btn p" onclick="amV2Copy()">📋 문구 복사 — 팀 단톡방에 붙여넣기</button>' +
      ckHtml(c);
  }
  /* 시트는 10ms 뒤에 on 이 붙습니다 — 처음 그릴 때(first)는 on 을 안 봄 · 닫힌 뒤에는 안 그림 */
  function repaint(first) {
    var sh = el('hv2Sheet'), box = sh && sh.querySelector('.am2[data-am]');
    if (!box || (!first && !sh.classList.contains('on'))) return false;
    box.innerHTML = html(); return true;
  }
  function wait() {
    if (S.tries > 40) return;
    S.tries++;
    setTimeout(function () { if (!repaint()) return; if (!ready() || !T(function () { return g.AR.loaded; }, false)) wait(); }, 700);
  }
  function open() {
    if (!T(function () { return g.hwhoCan(); }, false)) return;
    ensure(); S.q = ''; S.tries = 0;
    if (!sheet('')) { try { g.go('ckboard'); } catch (e) {} return; }
    repaint(1); wait();
  }
  function setQ(k) { S.q = S.q === k ? '' : k; repaint(); }
  function ck(id) { try { g.ckToggle('day', id); } catch (e) {} repaint(); }
  function copy() {
    var t = msgText(team());
    try { if (typeof g.copyText === 'function') { g.copyText(t); return; } } catch (e) {}
    try { g.navigator.clipboard.writeText(t); if (typeof g.toast === 'function') g.toast('복사되었습니다'); } catch (e2) {}
  }
  function member(id) { try { g.teamV2Open(); g.teamV2Member(id); } catch (e) {} }
  function goTab(tab) { close(); try { g.go(tab); } catch (e) {} }

  g.AM_V2 = { open: open, team: team, msgText: msgText, MIS4: MIS4, LDR: LDR };
  g.amV2Open = open;
  g.amV2Q = setQ;
  g.amV2Ck = ck;
  g.amV2Copy = copy;
  g.amV2Member = member;
  g.amV2Go = goTab;
})(window);
