/* ═══════════════════════════════════════════════════════════════════
   my-day.js — 📅 <b>오늘 내 일정</b> · 팀원이 스스로 체크 · 💌 교육매니저 한마디 (판 X554)

   사장님 말씀 (2026-11-24)
     「더 쉽고 이걸 스스로 체크할 수 있도록 / 교육매니저도 함께하고 체크하도록
       뭔가 이걸로 독려하고 스케줄 부족한 부분들을 같이 알아봐 주고 해 나갈 수 있도록」
     → 체크 자리 = CRM 홈 오늘 화면 · 리더 표는 EM 운영센터 주간·월간 표 하나로(90일 로드맵 2단계와 합침)

   ── 무엇을 하나 ──────────────────────────────────────────────────
     새 오늘 화면(home-v2.js) 「이번 달 목표」 밑에 한 칸. 누르면 아래에서 올라오는 판(HOME_V2.sheet):
       · 아침 — 오늘 일정 한 줄 (🔁 교육매니저가 정한 고정 일정 · 📅 CRM 오늘 약속을 눌러 넣기)
       · 저녁 — 했나 ○ 다 함 / △ 일부 / ✕ 못 함 + 한 줄(어땠나 · 도와줄 것)
       · 💌 교육매니저 한마디 — 「확인했어요」 한 번
       · 🔥 스스로 체크 연속 · 이번 주 ○△✕
     적으면 EM 운영센터 em_daily 같은 줄에 들어가 매일 체크 · 주간/월간 표 · 보고서 · 🔎 같이 볼 곳에 바로 뜹니다.

   ── 서버 (EM운영센터_SQL/migration_71_em_my_day.sql) ─────────────────
     em_my_day(d1,d2) 내 줄 읽기 · em_my_rep() 나에게 걸린 고정 일정 · em_my_day_put(dd,p_plan,p_done,p_note)
     (null 칸은 그대로 = 교육매니저가 고친 것을 안 덮음) · em_my_coach_seen(dd).
     ★ 팀원은 em_daily 를 직접 못 읽음 — 교육매니저 메모 · 출근 · 숫자는 안 내려옵니다.
     ★ 함수가 아직 없거나(SQL 전) 읽기가 실패하면 <b>칸을 아예 안 세웁니다</b>(헛칸 금지).

   ── 깨지지 않게 ─────────────────────────────────────────────────
     · 저장 코드는 이 파일의 rpc 넷뿐 — 홈의 다른 저장과 섞이지 않습니다.
     · 팀원 화면을 고른 리더(hwhoIsMe 거짓)에게는 안 보입니다 — 남의 칸에 내 일정이 들어가면 안 됨.
     · 고객 이름은 일정 줄로 옮기지 않습니다(운영센터로 올라감) — CRM 약속은 「14:00 고객 약속」 까지만.
     · 서버는 세션에 한 번 + 저장할 때만 부릅니다(홈을 그릴 때마다 안 부름).
   ═══════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var S = { loaded: false, loading: false, err: '', rows: {}, rep: [], at: 0 };
  var DN = { ok: '○ 다 함', part: '△ 일부', no: '✕ 못 함' };
  var W = '일월화수목금토';

  function E(s) {
    if (typeof g.osEsc === 'function') return g.osEsc(s == null ? '' : String(s));
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function T(fn, def) { try { var v = fn(); return (v === undefined || v === null) ? def : v; } catch (e) { return def; } }
  function el(id) { return g.document.getElementById(id); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function P(s) { var a = String(s).split('-'); return new Date(+a[0], +a[1] - 1, +a[2]); }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function add(s, n) { var d = P(s); d.setDate(d.getDate() + n); return ymd(d); }
  function today() { return T(function () { return g.mcalToday(); }, '') || ymd(new Date()); }
  function md(s) { var d = P(s); return (d.getMonth() + 1) + '/' + d.getDate() + '(' + W.charAt(d.getDay()) + ')'; }
  function sb() { return T(function () { return g.osClient(); }, null); }
  function mine() { return T(function () { return g.OS.profile.id; }, ''); }
  function isMe() { return T(function () { return typeof g.hwhoIsMe !== 'function' || !!g.hwhoIsMe(); }, true); }
  function toast(m) { try { if (typeof g.toast === 'function') g.toast(m); } catch (e) {} }
  function repaint() { try { if (g.HOME_V2 && g.HOME_V2.paint) g.HOME_V2.paint(); } catch (e) {} }

  /* ── 읽기 — 세션에 한 번 ─────────────────────────────────────────── */
  function load(force) {
    var c = sb(); if (!c || !mine()) return;
    if (S.loading || (S.loaded && !force)) return;
    S.loading = true;
    var t = today();
    Promise.all([c.rpc('em_my_day', { d1: add(t, -35), d2: add(t, 7) }), c.rpc('em_my_rep')]).then(function (rs) {
      S.loading = false; S.loaded = true; S.at = Date.now();
      if (rs[0].error) { S.err = rs[0].error.message || 'err'; repaint(); return; }
      S.err = ''; S.rows = {};
      (rs[0].data || []).forEach(function (x) { S.rows[x.d] = x; });
      S.rep = (rs[1] && !rs[1].error && Array.isArray(rs[1].data)) ? rs[1].data : [];
      repaint();
    }, function (e) { S.loading = false; S.loaded = true; S.err = String(e && e.message || e); repaint(); });
  }

  /* 🔁 오늘 걸린 고정 일정 — 운영센터 daily.js repFor 와 같은 규칙(매월 31일은 짧은 달엔 말일) */
  function repOf(d) {
    var dt = P(d), dd = dt.getDate(), last = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate(), w = dt.getDay();
    return (S.rep || []).filter(function (r) {
      return r && (r.k === 'w' ? (r.v || []).indexOf(w) >= 0 : (+r.v === dd || (+r.v > last && dd === last)));
    }).map(function (r) { return String(r.t || ''); }).filter(Boolean).sort();
  }
  /* 📅 CRM 오늘 약속 — 시각만(고객 이름은 안 옮김) */
  function apptOf(d) {
    var it = T(function () { return g.mcalItems(); }, null); if (!it) return [];
    var L = T(function () { return g.mcalDay(it, d); }, []) || [];
    return L.filter(function (z) { return z && z.k === 'appt'; }).map(function (z) {
      var tm = (String(z.s || '').match(/^\d{1,2}:\d{2}/) || [''])[0];
      return (tm ? tm + ' ' : '') + '고객 약속';
    });
  }
  function isWd(d) { var w = P(d).getDay(); return w >= 1 && w <= 5; }
  /* 🔥 스스로 체크 연속 — 오늘 아직이면 어제부터 · 주말은 건너뜀 */
  function streak() {
    var n = 0, d = today(), i;
    for (i = 0; i < 40; i++, d = add(d, -1)) {
      if (!isWd(d)) continue;
      if (S.rows[d] && S.rows[d].self_at) n++; else if (d === today()) continue; else break;
    }
    return n;
  }
  function week() {
    var t = today(), w = (P(t).getDay() + 6) % 7, mon = add(t, -w), out = [], i;
    for (i = 0; i < 5; i++) out.push(add(mon, i));
    return out;
  }
  /* 💌 아직 안 읽은 한마디(최근 7일 중 가장 늦은 것) · 없으면 최근 것 */
  function coachOf() {
    var t = today(), best = null, k;
    for (k in S.rows) {
      var r = S.rows[k];
      if (!r || !r.coach || k < add(t, -7)) continue;
      if (!best || String(r.coach_at || '') > String(best.coach_at || '')) best = r;
    }
    if (!best) return null;
    return { d: best.d, t: best.coach, by: best.coach_by || '교육매니저', seen: !!best.coach_seen_at && String(best.coach_seen_at) >= String(best.coach_at || '') };
  }
  function first(s) { var a = String(s || '').split(/\s*(?:·|,|\/|\n)\s*/).filter(function (x) { return x.trim(); }); return a.length ? a[0] + (a.length > 1 ? ' 외 ' + (a.length - 1) : '') : ''; }

  /* ── 홈 한 칸 (home-v2.js html() 이 부름) ─────────────────────────── */
  function html() {
    if (!mine() || !isMe()) return '';
    if (!S.loaded) { load(); return ''; }
    if (S.err) return '';
    var t = today(), r = S.rows[t] || {}, c = coachOf(), st = streak(), t1 = '오늘 내 일정', t2, ic = '📅', cls = '';
    if (c && !c.seen) { ic = '💌'; t1 = c.by + '님 한마디가 왔어요'; t2 = c.t.split('\n')[0]; cls = ' new'; }
    else if (!r.plan) { var rp = repOf(t); t2 = rp.length ? '🔁 ' + rp.join(' · ') + ' — 한 줄 더 적기' : '아직 안 적었어요 — 한 줄 적기'; cls = ' todo'; }
    else if (!r.done) t2 = first(r.plan) + ' · 저녁에 했나 체크';
    else t2 = DN[r.done] + ' · 오늘 체크 끝';
    return '<button type="button" class="eve myd' + cls + '" id="mydTile" onclick="MY_DAY.open()"><div class="tile">' + ic + '</div><div class="tx"><div class="t1">' + E(t1) + '</div><div class="t2">' + E(t2) + '</div></div>' +
      (st >= 2 && !cls ? '<span class="myd-st">🔥' + st + '</span>' : '') + '<span class="ar">›</span></button>';
  }

  /* ── 판 ─────────────────────────────────────────────────────────── */
  var DRAFT = null;
  function sheetHtml() {
    var t = today(), r = S.rows[t] || {}, c = coachOf(), st = streak();
    var plan = DRAFT ? DRAFT.plan : (r.plan || ''), note = DRAFT ? DRAFT.note : (r.self_note || ''), done = r.done || '';
    var sug = repOf(t).map(function (x) { return ['🔁', x]; }).concat(apptOf(t).map(function (x) { return ['📅', x]; }))
      .filter(function (x) { return plan.indexOf(x[1]) < 0; });
    var h = '<h1>📅 오늘 내 일정</h1><div class="sub">' + E(md(t)) + (r.self_at ? ' · 적어 둠' : '') + '</div>';
    if (c) h += '<div class="myd-coach' + (c.seen ? ' seen' : '') + '"><b>💌 ' + E(c.by) + ' · ' + E(md(c.d)) + '</b><div>' + E(c.t) + '</div>' +
      (c.seen ? '<small>✓ 확인했어요</small>' : '<button type="button" class="btn p" onclick="MY_DAY.seen(\'' + E(c.d) + '\')">확인했어요 👍</button>') + '</div>';
    if (sug.length) h += '<div class="myd-sug">' + sug.map(function (x, i) { return '<button type="button" onclick="MY_DAY.addSug(' + i + ')">' + x[0] + ' ' + E(x[1]) + ' ＋</button>'; }).join('') + '</div>';
    h += '<textarea id="mydPlan" class="myd-in" rows="3" placeholder="예: 10시 보장분석 · 오후 TA 20통 · 4시 증권전달" oninput="MY_DAY.typing()">' + E(plan) + '</textarea>' +
      '<button type="button" class="btn p" onclick="MY_DAY.save()">' + (r.plan ? '고쳐 두기' : '적어 두기') + '</button>' +
      '<h2>저녁에 — 했나요?</h2><div class="myd-dn">' + ['ok', 'part', 'no'].map(function (k) {
        return '<button type="button" class="' + (done === k ? 'on ' + k : '') + '" onclick="MY_DAY.done(\'' + k + '\')">' + DN[k] + '</button>';
      }).join('') + '</div>' +
      '<input id="mydNote" class="myd-in one" maxlength="300" placeholder="한 줄 — 어땠어요? 막힌 점 · 도와줄 것" value="' + E(note) + '" oninput="MY_DAY.typing()" onchange="MY_DAY.save(1)">';
    var wk = week(), ok = 0, pt = 0, no = 0;
    h += '<div class="myd-wk">' + wk.map(function (d) {
      var x = S.rows[d] || {}, m = x.done === 'ok' ? '○' : x.done === 'part' ? '△' : x.done === 'no' ? '✕' : (x.self_at ? '·' : '');
      if (x.done === 'ok') ok++; else if (x.done === 'part') pt++; else if (x.done === 'no') no++;
      return '<div class="' + (d === t ? 'td ' : '') + (x.done || '') + '"><small>' + W.charAt(P(d).getDay()) + '</small><b>' + m + '</b></div>';
    }).join('') + '</div><div class="myd-sum">' + (st ? '🔥 스스로 체크 <b>' + st + '일 연속</b> · ' : '') + '이번 주 ○' + ok + ' △' + pt + ' ✕' + no + '</div>';
    return h;
  }
  function open() {
    if (!g.HOME_V2 || !g.HOME_V2.sheet) return;
    css(); DRAFT = null;
    g.HOME_V2.sheet('<div class="myd-sh">' + sheetHtml() + '</div>');
    if (!S.loaded) load();
  }
  function reSheet() {
    var sh = el('hv2Sheet'), box = sh && sh.querySelector('.myd-sh'); if (!box) return;
    box.innerHTML = sheetHtml();
  }
  function typing() {
    DRAFT = { plan: (el('mydPlan') || {}).value || '', note: (el('mydNote') || {}).value || '' };
  }
  /* 저장 — 바뀐 칸만 보냄(나머지 null = 서버가 그대로 둠) */
  function put(f, quiet) {
    var c = sb(); if (!c) return;
    var t = today(), r = S.rows[t] || { d: t, plan: '', done: '', self_note: '' };
    var args = { dd: t, p_plan: f.plan == null ? null : f.plan, p_done: f.done == null ? null : f.done, p_note: f.note == null ? null : f.note };
    c.rpc('em_my_day_put', args).then(function (res) {
      if (res && res.error) { toast('⚠ 못 적었어요 — 잠시 뒤 다시 눌러 주세요'); return; }
      if (f.plan != null) r.plan = f.plan;
      if (f.done != null) r.done = f.done;
      if (f.note != null) r.self_note = f.note;
      r.self_at = new Date().toISOString(); S.rows[t] = r;
      DRAFT = null; reSheet(); repaint();
      if (!quiet) toast(f.done ? '✅ 오늘 체크 끝! 교육매니저도 같이 봐요' : '📅 적어 뒀어요 — 교육매니저도 같이 봐요');
    }, function () { toast('⚠ 못 적었어요 — 잠시 뒤 다시 눌러 주세요'); });
  }
  function save(quiet) {
    var t = today(), r = S.rows[t] || {};
    var plan = ((el('mydPlan') || {}).value || '').trim(), note = ((el('mydNote') || {}).value || '').trim();
    var f = {};
    if (plan !== (r.plan || '')) f.plan = plan;
    if (note !== (r.self_note || '')) f.note = note;
    if (f.plan == null && f.note == null) { if (!quiet) toast('바뀐 것이 없어요'); return; }
    put(f, quiet);
  }
  function done(k) {
    var t = today(), r = S.rows[t] || {};
    var plan = ((el('mydPlan') || {}).value || '').trim(), note = ((el('mydNote') || {}).value || '').trim();
    var f = { done: r.done === k ? '' : k };
    if (plan !== (r.plan || '')) f.plan = plan;
    if (note !== (r.self_note || '')) f.note = note;
    put(f);
  }
  function addSug(i) {
    var t = today(), ta = el('mydPlan'); if (!ta) return;
    var plan = ta.value;
    var sug = repOf(t).concat(apptOf(t)).filter(function (x) { return plan.indexOf(x) < 0; });
    var x = sug[i]; if (!x) return;
    ta.value = plan.trim() ? plan.trim() + ' · ' + x : x;
    typing(); reSheet();
    var ta2 = el('mydPlan'); if (ta2) ta2.focus();
  }
  function seen(d) {
    var c = sb(); if (!c) return;
    c.rpc('em_my_coach_seen', { dd: d }).then(function (res) {
      if (res && res.error) return;
      if (S.rows[d]) S.rows[d].coach_seen_at = new Date().toISOString();
      reSheet(); repaint(); toast('💌 고마워요 — 교육매니저에게 「읽음」 으로 보여요');
    }, function () {});
  }

  function css() {
    var d = g.document; if (d.getElementById('mydCss')) return;
    var C = [
      '.hv2 .eve.myd{margin-top:12px}',
      '.hv2 .eve.myd.todo .tile,.hv2 .eve.myd.new .tile{background:var(--blue-l)}',
      '.hv2 .eve.myd.new{box-shadow:inset 0 0 0 2px #B5C7F2}',
      '.hv2 .eve.myd .t2{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.hv2 .myd-st{flex:none;font-size:13px;font-weight:800;color:var(--warn);background:var(--warn-l);border-radius:10px;padding:3px 8px}',
      '#hv2Sheet .myd-in{display:block;width:100%;border:0;border-radius:14px;background:#fff;padding:12px 14px;font:inherit;font-size:16px;color:var(--ink);margin-top:10px;resize:vertical;line-height:1.5}',
      '#hv2Sheet .myd-in.one{height:52px}',
      '#hv2Sheet .myd-sug{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}',
      '#hv2Sheet .myd-sug button{height:36px;padding:0 12px;border-radius:18px;background:#fff;font-size:14px;font-weight:700;color:var(--blue)}',
      '#hv2Sheet .myd-dn{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}',
      '#hv2Sheet .myd-dn button{height:52px;border-radius:14px;background:#fff;font-size:16px;font-weight:800;color:var(--sub);text-align:center}',
      '#hv2Sheet .myd-dn button.on.ok{background:#12B76A;color:#fff}#hv2Sheet .myd-dn button.on.part{background:#E79A00;color:#fff}#hv2Sheet .myd-dn button.on.no{background:#E5484D;color:#fff}',
      '#hv2Sheet .myd-coach{background:#fff;border-radius:16px;padding:14px 16px;margin-top:12px;box-shadow:inset 0 0 0 2px #B5C7F2}',
      '#hv2Sheet .myd-coach.seen{box-shadow:none}',
      '#hv2Sheet .myd-coach b{display:block;font-size:13px;color:var(--blue);margin-bottom:4px}',
      '#hv2Sheet .myd-coach div{font-size:16px;line-height:1.6;white-space:pre-line}',
      '#hv2Sheet .myd-coach small{display:block;margin-top:6px;font-size:13px;color:var(--green);font-weight:700}',
      '#hv2Sheet .myd-wk{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:16px}',
      '#hv2Sheet .myd-wk div{background:#fff;border-radius:12px;padding:6px 0;text-align:center}',
      '#hv2Sheet .myd-wk div.td{box-shadow:inset 0 0 0 2px var(--ink)}',
      '#hv2Sheet .myd-wk div.ok{background:#E3F6EC;color:#08834D}#hv2Sheet .myd-wk div.part{background:#FFF3D3;color:#A15C00}#hv2Sheet .myd-wk div.no{background:#FFE6E8;color:#D22030}',
      '#hv2Sheet .myd-wk small{display:block;font-size:13px;color:var(--sub2);font-weight:600}#hv2Sheet .myd-wk b{display:block;font-size:17px;min-height:22px}',
      '#hv2Sheet .myd-sum{font-size:14px;color:var(--sub2);margin:8px 2px 0;text-align:center}'
    ];
    var st = d.createElement('style'); st.id = 'mydCss'; st.textContent = C.join('\n'); d.head.appendChild(st);
  }

  g.MY_DAY = {
    html: function () { css(); return html(); },
    open: open, save: save, done: done, typing: typing, addSug: addSug, seen: seen,
    reload: function () { load(true); },
    /* 점검용 */
    _S: S, _repOf: repOf, _streak: streak, _coach: coachOf
  };
})(window);
