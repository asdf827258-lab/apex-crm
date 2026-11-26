/* ═══════════════════════════════════════════════════════════════════
   my-promise.js — 💬 <b>팀원 약속 비서</b> (판 X573)

   사장님 말씀 (2026-11-26) — 사업단장이 쓰는 「카톡 비서」 를 팀원판으로.
     「숫자와 내용까지, 각 담당 지점장이 알람으로 보고 받게」.

   ── 어디에 서나 ─────────────────────────────────────────────────
   ★ 새 메뉴가 없습니다 — 새 오늘 화면(home-v2.js)의 「🛰 자비스가 챙기는 중」 시트 안에
     「💬 내가 한 약속」 묶음과 「📋 카톡 붙여넣기」 칸이 섭니다.
     home-v2.js 는 한 줄만 부릅니다(MY_PROMISE.html) — 이 파일이 없어도 시트는 그대로 섭니다.

   ── 어떻게 도나 ─────────────────────────────────────────────────
     ① 팀원이 카톡 대화를 붙여 넣는다 (팀원 PC 카톡을 자동으로 만지지 않습니다)
     ② 「가리고 보기」 — 이름 가운데 글자 · 전화번호를 가린 글을 <b>먼저 보여 줍니다</b>.
        안 가려진 이름이 보이면 「가릴 이름」 칸에 적어 더 가립니다.
     ③ 「AI 에게 보내기」 — 가린 글만 /api/generate(callClaude)로 갑니다.
        보내는 순간 붙여 넣은 원문은 칸에서 지웁니다 — <b>원문은 어디에도 저장하지 않습니다</b>.
     ④ 「누구에게 · 무엇을 · 언제까지」 한 줄씩 나옵니다. 팀원이 고치고 <b>✓ 확인</b>을 눌러야 저장됩니다.
     ⑤ 저장은 서버 표 team_promises 한 곳(migration_85) — 본인 · 그 팀 지점장 · 팀장 · 대표가 봅니다.
        그래서 붙여넣기 칸 옆에 「이 약속은 담당 지점장·사업단장에게 공유돼요」 를 적습니다.

   ── 지키는 것 ───────────────────────────────────────────────────
   ★ 늦음 · 놓칠 뻔 · 이름 가리기 규칙은 <b>promise-rule.js(MPR) 한 곳</b> — 서버 알람도 같은 파일 (5번).
   ★ 고객 이름은 가린 꼴(김*수)로만 저장 (3번) · 고객에게 자동으로 보내는 단추 없음.
   ★ 날짜를 지어내지 않습니다 (1번) — 대화에 없으면 빈 칸, 빈 칸이면 3일 뒤 「놓칠 뻔」.
   ★ 서버는 시트를 열 때 <b>한 번</b>만 읽습니다(열린 약속 100줄 · 칸 일곱) — 되풀이 없음 (7번).
   ★ 시각이 있는 약속은 「📅 폰 달력에 담기」 — 앱의 icsBuild 그대로(day.html icsDoc 과 같은 꼴 · 알림 포함).
   ═══════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var TABLE = 'team_promises';
  var COLS = 'id,text,who,due,time,status,created_at';
  var S = { rows: null, err: '', busy: false, masked: '', cand: [], step: 'paste', loadedAt: 0 };

  function el(id) { return g.document.getElementById(id); }
  function E(s) {
    if (typeof g.osEsc === 'function') return g.osEsc(s == null ? '' : String(s));
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function R() { return g.MPR || null; }
  function sb() { try { return typeof g.osClient === 'function' ? g.osClient() : null; } catch (e) { return null; } }
  function uid() { try { return (g.OS && g.OS.profile && g.OS.profile.id) || ''; } catch (e) { return ''; } }
  function toast(t) { try { if (typeof g.toast === 'function') g.toast(t); } catch (e) {} }
  function today() { var M = R(); return M ? M.kstYmd() : new Date().toISOString().slice(0, 10); }
  /* 서버 표가 아직 없을 때(SQL 을 안 돌린 판) — 그렇다고 말합니다 (6번) */
  function noTable(e) { var m = String((e && (e.message || e.code)) || ''); return /42P01|does not exist|could not find the table|schema cache/i.test(m); }
  function errSay(e) { return noTable(e) ? '서버 표가 아직 준비되지 않았어요 — 관리자가 SQL(migration_85) 을 한 번 돌리면 열려요' : '서버에 못 닿았어요 — 잠시 뒤 다시 열어 주세요'; }

  function css() {
    if (el('mpCss')) return;
    var s = g.document.createElement('style'); s.id = 'mpCss';
    s.textContent =
      '#hv2Sheet .mp-share{margin:8px 0 0;padding:10px 12px;border-radius:12px;background:#FFF7E6;color:#8A5300;font-size:14px;line-height:1.5}' +
      '#hv2Sheet .mp-ta{width:100%;min-height:120px;margin-top:8px;border:1px solid #D1D6DB;border-radius:12px;padding:12px;font-size:15px;line-height:1.5;background:#fff;box-sizing:border-box}' +
      '#hv2Sheet .mp-pre{margin-top:8px;padding:12px;border-radius:12px;background:#F2F4F6;font-size:14px;line-height:1.55;white-space:pre-wrap;max-height:200px;overflow:auto}' +
      '#hv2Sheet .mp-in{height:44px;border:1px solid #D1D6DB;border-radius:10px;padding:0 10px;font-size:15px;background:#fff;box-sizing:border-box;min-width:0}' +
      '#hv2Sheet .mp-c{border:1px solid #E5E8EB;border-radius:14px;padding:10px 12px;margin-top:8px;background:#fff}' +
      '#hv2Sheet .mp-c .r{display:flex;gap:6px;margin-top:6px;align-items:center}' +
      '#hv2Sheet .mp-c label{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;min-height:44px}' +
      '#hv2Sheet .mp-c input[type=checkbox]{width:22px;height:22px}' +
      '#hv2Sheet .mp-b{flex:none;min-width:44px;height:44px;padding:0 10px;border-radius:10px;font-size:14px;font-weight:700;background:#F2F4F6;color:#333D4B}' +
      '#hv2Sheet .mp-b.ok{background:#E8F3FF;color:#1A56DB}' +
      '#hv2Sheet .mp-k{flex:none;display:inline-block;min-width:52px;padding:4px 8px;border-radius:8px;font-size:13px;font-weight:800;text-align:center;background:#F2F4F6;color:#4E5968}' +
      '#hv2Sheet .mp-k.late{background:#FFEBEE;color:#C62828}#hv2Sheet .mp-k.stale{background:#FFF1E6;color:#C2410C}#hv2Sheet .mp-k.today{background:#E8F3FF;color:#1A56DB}' +
      '#hv2Sheet .mp-row{display:flex;align-items:center;gap:8px;padding:8px 6px 8px 14px;border-bottom:1px solid #F2F4F6}' +
      '#hv2Sheet .mp-row .tx{flex:1;min-width:0;font-size:15px;line-height:1.45}' +
      '#hv2Sheet .mp-row .tx small{display:block;font-size:13px;color:#6B7684}';
    g.document.head.appendChild(s);
  }

  /* ── 시트 안 묶음 — home-v2.js 의 jvSheet 가 한 줄로 부릅니다 ────────── */
  function html() {
    css();
    setTimeout(function () { load(); paintForm(); }, 0);      /* 시트가 그려진 뒤 — 한 번만 읽음 */
    return '<h2>💬 내가 한 약속 <small id="mpCnt">' + cntTxt() + '</small></h2>' +
      '<div class="list" id="mpList">' + listHtml() + '</div>' +
      '<h2>📋 카톡 붙여넣기 <small>약속한 대화를 붙여 넣으면 한 줄로 뽑아 드려요</small></h2>' +
      '<div class="mp-share" data-mp="share">🔔 이 약속은 <b>담당 지점장·사업단장에게 공유돼요</b> · 고객 이름은 가운데 글자를 가리고, 카톡 원문은 저장하지 않아요<br>⏰ 폰 알람을 켜 두면 <b>아침 8시 · 12시 · 17시</b>(남은 게 있을 때만)와 <b>시각 있는 약속 30분 전</b>에 내 폰으로 알려 드려요</div>' +
      '<div id="mpForm"></div>';
  }
  function cntTxt() {
    var M = R(); if (!S.rows || !M) return '';
    var c = M.count(S.rows, today());
    return c.open + '건' + (c.miss ? ' · 놓친 ' + c.miss : '') + (c.today ? ' · 오늘 ' + c.today : '');
  }
  function dueTxt(p, st) {
    if (st.k === 'late') return st.days + '일 늦음';
    if (st.k === 'stale') return '날짜 없이 ' + st.days + '일째';
    if (st.k === 'today') return '오늘' + (p.time ? ' ' + String(p.time).slice(0, 5) : '');
    if (p.due) return (+String(p.due).slice(5, 7)) + '/' + (+String(p.due).slice(8, 10)) + (p.time ? ' ' + String(p.time).slice(0, 5) : '') + '까지';
    return '날짜 없음';
  }
  function listHtml() {
    var M = R();
    if (!uid()) return '<div class="li"><div class="tx"><div class="t2">로그인하면 약속을 적고 챙길 수 있어요</div></div></div>';
    if (S.err) return '<div class="li"><div class="tx"><div class="t2">' + E(S.err) + '</div></div></div>';
    if (!S.rows) return '<div class="li"><div class="tx"><div class="t2">불러오는 중…</div></div></div>';
    if (!S.rows.length) return '<div class="li"><div class="tx"><div class="t2">아직 적은 약속이 없어요 — 아래에 카톡을 붙여 넣어 보세요</div></div></div>';
    var td = today();
    return M.sort(S.rows, td).map(function (p) {
      var st = M.state(p, td), lab = M.LABEL[st.k] || ((+String(p.due || '').slice(5, 7)) ? (+String(p.due).slice(5, 7)) + '/' + (+String(p.due).slice(8, 10)) : '할 일');
      return '<div class="mp-row" data-mpst="' + st.k + '"><span class="mp-k ' + st.k + '">' + E(lab) + '</span>' +
        '<div class="tx">' + (p.who ? '<b>' + E(p.who) + '님</b> · ' : '') + E(p.text) + '<small>' + E(dueTxt(p, st)) + '</small></div>' +
        (p.due && p.time ? '<button type="button" class="mp-b" aria-label="폰 달력에 담기" title="📅 폰 달력에 담기" onclick="MY_PROMISE.ics(\'' + E(p.id) + '\')">📅</button>' : '') +
        '<button type="button" class="mp-b ok" onclick="MY_PROMISE.done(\'' + E(p.id) + '\')">✓ 했어요</button></div>';
    }).join('');
  }
  function paintList() { var a = el('mpList'), b = el('mpCnt'); if (a) a.innerHTML = listHtml(); if (b) b.textContent = cntTxt(); }

  /* ── 붙여넣기 칸 — 세 걸음(붙여넣기 → 가린 글 보기 → 뽑은 줄 확인) ── */
  function paintForm() {
    var f = el('mpForm'); if (!f) return;
    if (!uid()) { f.innerHTML = ''; return; }
    var h = '';
    if (S.step === 'paste') {
      h = '<textarea id="mpPaste" class="mp-ta" placeholder="카톡 대화를 길게 눌러 복사한 뒤 여기 붙여 넣으세요"></textarea>' +
        '<button type="button" class="btn p" style="margin-top:8px" onclick="MY_PROMISE.mask()">🙈 이름 가리고 보기</button>' +
        '<button type="button" class="btn g" onclick="MY_PROMISE.hand()">✏️ 직접 한 줄 적기</button>';
    } else if (S.step === 'masked') {
      h = '<div class="sub" style="margin-top:8px">AI 에게는 <b>이 글만</b> 가요 — 안 가려진 이름이 보이면 아래에 적어 주세요</div>' +
        '<div class="mp-pre" id="mpPre">' + E(S.masked) + '</div>' +
        '<div class="r" style="display:flex;gap:6px;margin-top:8px"><input id="mpMore" class="mp-in" style="flex:1" placeholder="더 가릴 이름 (예: 홍길동, 홍길순)">' +
        '<button type="button" class="mp-b" onclick="MY_PROMISE.more()">더 가리기</button></div>' +
        '<button type="button" class="btn p" style="margin-top:8px" onclick="MY_PROMISE.ask()"' + (S.busy ? ' disabled' : '') + '>' + (S.busy ? '뽑는 중…' : '🤖 이대로 AI 에게 보내 약속 뽑기') + '</button>' +
        '<button type="button" class="btn g" onclick="MY_PROMISE.reset()">처음으로</button>';
    } else {
      h = '<div class="sub" style="margin-top:8px">' + (S.cand.length ? '고칠 것은 고치고 <b>✓ 확인</b>을 눌러야 저장돼요' : '대화에서 약속을 못 찾았어요 — 직접 적을 수 있어요') + '</div>' +
        S.cand.map(function (c, i) {
          return '<div class="mp-c"><label><input type="checkbox" id="mpOn' + i + '"' + (c.on ? ' checked' : '') + '> 이 약속 저장</label>' +
            '<div class="r"><input id="mpWho' + i + '" class="mp-in" style="width:96px" maxlength="20" placeholder="누구 (김*수)" value="' + E(c.who) + '">' +
            '<input id="mpTxt' + i + '" class="mp-in" style="flex:1" maxlength="60" placeholder="무엇을" value="' + E(c.what) + '"></div>' +
            '<div class="r"><input id="mpDue' + i + '" class="mp-in" type="date" style="flex:1" value="' + E(c.due) + '">' +
            '<input id="mpTm' + i + '" class="mp-in" type="time" style="width:140px" value="' + E(c.time) + '"></div></div>';
        }).join('') +
        '<button type="button" class="btn g" style="margin-top:8px" onclick="MY_PROMISE.hand()">＋ 한 줄 더</button>' +
        (S.cand.length ? '<button type="button" class="btn p" onclick="MY_PROMISE.save()"' + (S.busy ? ' disabled' : '') + '>' + (S.busy ? '저장하는 중…' : '✓ 확인 — 저장') + '</button>' : '') +
        '<button type="button" class="btn g" onclick="MY_PROMISE.reset()">처음으로</button>';
    }
    f.innerHTML = h;
  }

  /* ── 서버 — 열 때 한 번 ────────────────────────────────────────── */
  function load() {
    var c = sb(), me = uid();
    if (!c || !me) { paintList(); return; }
    if (S.loading) return;
    S.loading = true;
    try {
      c.from(TABLE).select(COLS).eq('member_id', me).eq('status', 'open').order('created_at', { ascending: false }).limit(100)
        .then(function (r) {
          S.loading = false;
          if (r && r.error) { S.err = errSay(r.error); S.rows = null; }
          else { S.err = ''; S.rows = (r && r.data) || []; S.loadedAt = Date.now(); }
          paintList();
        }, function (e) { S.loading = false; S.err = errSay(e); paintList(); });
    } catch (e) { S.loading = false; S.err = errSay(e); paintList(); }
  }

  /* ── 누르면 ─────────────────────────────────────────────────────── */
  function namesOf(v) { return String(v || '').split(/[,\s·]+/).filter(function (x) { return /^[가-힣]{2,5}$/.test(x); }); }
  function mask() {
    var t = el('mpPaste'), raw = t ? String(t.value || '') : '', M = R();
    if (!raw.replace(/\s+/g, '')) { toast('카톡 대화를 먼저 붙여 넣어 주세요'); return; }
    if (!M) { toast('가리는 규칙을 못 읽었어요 — 새로고침해 주세요'); return; }
    S.masked = M.maskText(raw.slice(0, 6000));
    S.step = 'masked'; paintForm();
  }
  function more() {
    var i = el('mpMore'), M = R(); if (!i || !M) return;
    var N = namesOf(i.value); if (!N.length) return;
    S.masked = M.maskText(S.masked, N); paintForm();
  }
  function sys() {
    var td = today(), wd = '일월화수목금토'.charAt(new Date(td + 'T00:00:00Z').getUTCDay());
    return '너는 보험 설계사의 카톡 대화에서 <설계사가 고객에게 하겠다고 한 약속>만 뽑는다.\n' +
      '오늘은 ' + td + '(' + wd + ')이다. 「내일」 「금요일」 같은 말은 이 날을 기준으로 날짜로 바꾼다.\n' +
      '규칙:\n- 고객이 한 말이나 설계사의 인사는 약속이 아니다. 설계사가 할 일(보내드릴게요 · 알아봐 드릴게요 · 연락드릴게요 · 체크해 둘게요)만.\n' +
      '- 이름은 대화에 가려진 꼴(김*수) 그대로 쓴다. 가려진 글자를 짐작해 채우지 않는다. 모르면 빈 칸.\n' +
      '- 날짜 · 시각이 대화에 없으면 지어내지 말고 빈 칸으로 둔다.\n' +
      '- what 은 25자 안의 짧은 한국어(예: 청구서류 보내드리기).\n' +
      '- 전화번호 · 주민번호 · 계좌 같은 숫자는 적지 않는다.\n' +
      'JSON 배열로만 답한다. 다른 글은 쓰지 않는다. 약속이 없으면 [].\n' +
      '[{"who":"김*수","what":"청구서류 보내드리기","due":"YYYY-MM-DD 또는 빈 칸","time":"HH:MM 또는 빈 칸"}]';
  }
  function parse(txt) {
    var s = String(txt || ''), a = s.indexOf('['), b = s.lastIndexOf(']');
    if (a < 0 || b <= a) return null;
    try {
      var L = JSON.parse(s.slice(a, b + 1)), M = R();
      if (!L || !L.push) return null;
      return L.slice(0, 10).map(function (x) {
        x = x || {};
        var due = /^\d{4}-\d{2}-\d{2}$/.test(String(x.due || '')) ? String(x.due) : '';
        var tm = /^\d{1,2}:\d{2}$/.test(String(x.time || '')) ? ('0' + x.time).slice(-5) : '';
        var who = M.maskName(String(x.who || '').replace(/님$/, '').slice(0, 20));
        return { on: true, who: who, what: M.maskText(String(x.what || '').slice(0, 60), who ? [who] : []), due: due, time: tm };
      }).filter(function (x) { return x.what; });
    } catch (e) { return null; }
  }
  function ask() {
    if (S.busy || !S.masked) return;
    if (typeof g.callClaude !== 'function') { toast('AI 연결을 못 찾았어요 — 설정 → AI 연결을 확인해 주세요'); return; }
    S.busy = true; paintForm();
    var sent = S.masked;
    /* 원문은 여기서 끝 — 가린 글만 보냅니다 */
    g.callClaude(sys(), '<대화>\n' + sent + '\n</대화>', 800).then(function (txt) {
      S.busy = false;
      var L = parse(txt);
      if (!L) { toast('AI 답을 못 읽었어요 — 한 번 더 눌러 주세요'); paintForm(); return; }
      S.masked = ''; S.cand = L; S.step = 'pick'; paintForm();
    }, function (e) {
      S.busy = false; paintForm();
      toast('AI 가 답하지 못했어요 — ' + String((e && e.message) || '').slice(0, 60));
    });
  }
  function hand() { if (S.step !== 'pick') { S.cand = []; S.masked = ''; S.step = 'pick'; } else readCand(); S.cand.push({ on: true, who: '', what: '', due: '', time: '' }); paintForm(); }
  function readCand() {
    S.cand.forEach(function (c, i) {
      var v = function (p) { var x = el(p + i); return x ? x : null; };
      if (v('mpOn')) c.on = !!v('mpOn').checked;
      if (v('mpWho')) c.who = String(v('mpWho').value || '').trim();
      if (v('mpTxt')) c.what = String(v('mpTxt').value || '').trim();
      if (v('mpDue')) c.due = String(v('mpDue').value || '');
      if (v('mpTm')) c.time = String(v('mpTm').value || '');
    });
  }
  /* 저장 직전 한 번 더 — 사람이 칸에 이름을 다 적어 넣었어도 가린 꼴로만 나갑니다 (3번) */
  function rowOf(c) {
    var M = R(), who = M.maskName(String(c.who || '').replace(/님$/, ''));
    var raw = String(c.who || '').replace(/님$/, '').trim();
    return {
      text: M.maskText(c.what, raw ? [raw] : []).slice(0, 200),
      who: who || null,
      due: /^\d{4}-\d{2}-\d{2}$/.test(c.due) ? c.due : null,
      time: /^\d{2}:\d{2}$/.test(c.time) ? c.time : null
    };
  }
  function save() {
    if (S.busy) return;
    readCand();
    var L = S.cand.filter(function (c) { return c.on && c.what; }).map(rowOf);
    if (!L.length) { toast('저장할 약속을 골라 주세요'); return; }
    var c = sb(); if (!c || !uid()) { toast('로그인한 뒤 저장할 수 있어요'); return; }
    S.busy = true; paintForm();
    c.from(TABLE).insert(L).select(COLS).then(function (r) {
      S.busy = false;
      if (r && r.error) { toast(errSay(r.error)); paintForm(); return; }
      S.rows = ((r && r.data) || []).concat(S.rows || []);
      S.cand = []; S.step = 'paste'; paintForm(); paintList();
      toast('💬 약속 ' + L.length + '건을 적었어요 — 지점장님도 같이 챙겨요');
    }, function (e) { S.busy = false; paintForm(); toast(errSay(e)); });
  }
  function done(id) {
    var c = sb(); if (!c) return;
    c.from(TABLE).update({ status: 'done' }).eq('id', id).then(function (r) {
      if (r && r.error) { toast(errSay(r.error)); return; }
      S.rows = (S.rows || []).filter(function (p) { return p.id !== id; });
      paintList(); toast('✓ 했어요 — 잘 챙기셨어요');
    }, function (e) { toast(errSay(e)); });
  }
  function ics(id) {
    var p = (S.rows || []).filter(function (x) { return x.id === id; })[0]; if (!p || !p.due || !p.time) return;
    var hm = String(p.time).split(':');
    var title = '약속 — ' + (p.who ? p.who + '님 ' : '') + p.text;
    var txt = '';
    try { txt = g.icsBuild('APEX 약속', [{ ds: String(p.due).slice(0, 10), h: +hm[0], m: +hm[1], dur: 30, title: title, body: '', go: 'mycal' }]); } catch (e) { txt = ''; }
    if (!txt) { toast('폰 달력 파일을 못 만들었어요'); return; }
    try {
      var b = new Blob([txt], { type: 'text/calendar;charset=utf-8' }), a = g.document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = 'apex-약속-' + String(p.due).slice(0, 10) + '.ics';
      g.document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      toast('달력 파일을 받았어요 — 누르면 폰 달력이 추가를 물어요');
    } catch (e2) { try { g.copyText(txt); } catch (e3) {} }
  }
  function reset() { S.masked = ''; S.cand = []; S.step = 'paste'; S.busy = false; paintForm(); }

  g.MY_PROMISE = { html: html, load: load, mask: mask, more: more, ask: ask, hand: hand, save: save, done: done, ics: ics, reset: reset,
    _s: S, _parse: parse, _row: rowOf, _sys: sys };
})(window);
