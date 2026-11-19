/* ═══════════════════════════════════════════════════════════════
   hm-tamsg.js — ☎️ <b>오늘(홈) 카드에 TA 「문자 · 카톡」</b> (판 X494)

   사장님 말씀 (2026-11-19) — 「TA스크립트에 약속 내용 그리고 약속후 카톡내용 보면
   잘 다듬어져있는데 그걸 오늘에서 사용할수 있도록 해서 고객을 디테일하게 연락하고
   관리했음 좋겠어」 → 「오늘에서 TA 문구 쓰는 다음판 진행해줘」.

   판 X493 에서 글을 ta-msg.js 한 곳으로 뗐습니다. 이 파일은 <b>언제 어느 글을
   꺼낼지</b>만 정하고, 글은 TA_MSG.textFor 로 <b>읽기만</b> 합니다 (5번).
   여기에 카톡 문장을 다시 적지 않습니다 — check-hmtamsg 가 봅니다.

   ★ 언제 무엇을
     · 약속이 <b>내일</b>인 분  → 「전날 확인」     (노쇼를 줄이는 자리)
     · 약속이 <b>오늘</b>인 분  → 「당일 출발」
     · 그 밖에는 카드의 첫 마디(apex-stage)를 <b>그대로</b> 둡니다 — 바꾸지 않습니다.
     · 「이분 자세히」 안에는 <b>그 단계에 맞는 카톡</b>을 고르고 베끼는 칸을 둡니다
       (TA → 만남 승낙 · 보류 · 문자로 · 부재 / AP → 전날 · 출발 · 감사 · 분석표 …).
       「연락 원치 않음」 은 넣지 않습니다 — TA 스크립트 쪽지가 「기본은 보내지 않는 것」 입니다.
   ★ 이름 (3번)
     · 고객은 <b>「고객님」</b> — 홈의 첫 마디와 같은 규칙입니다(TA_OPENER · check-touch).
       🙈 가리기를 켰을 때 가린 이름이 카톡에 실려 나가는 일도 없습니다.
     · 설계사 이름은 로그인한 <b>본인</b>(OS.profile.name). 모르면 자리 글(○○○) 그대로 (1번).
   ★ 약속 시간은 배정 DB 줄(AR.db · dbs.next_appt) 에 적힌 것만 씁니다. 장소는 앱에
     적는 자리가 없어 「약속 장소」 라고 적습니다 — 지어내지 않습니다 (1번).
   ═══════════════════════════════════════════════════════════════ */
(function (g) {
  /* 단계 → 이분께 맞는 카톡 (TA 스크립트 갈래 이름 그대로 · 앞의 것이 기본) */
  var BY_STAGE = {
    '미접촉': ['miss', 'info'],
    'TA':     ['ok', 'hold', 'info', 'miss'],
    '부재':   ['miss'],
    '거절':   ['soft'],
    'AP':     ['eve', 'go', 'thanks', 'report'],
    'PC':     ['report', 'later'],
    'CS':     ['signed'],
    '계약완료': ['signed']
  };
  var SEL = {};                 /* 「이분 자세히」 에서 고른 갈래 — 줄(key)마다 */
  var CH = 'kakao';             /* 카톡 · 문자 */

  function esc(s) { return (typeof g.osEsc === 'function') ? g.osEsc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ready() { return !!(g.TA_MSG && g.TA_MSG.textFor && g.TA_MSG.MSG); }
  function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function today() { try { if (typeof g.mcalToday === 'function') return g.mcalToday(); } catch (e) {} return ymd(new Date()); }
  function plus(day, n) { var p = day.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]); d.setDate(d.getDate() + n); return ymd(d); }
  function rows() { return (typeof g.AR !== 'undefined' && g.AR && g.AR.db) ? g.AR.db : []; }

  /* 이 줄의 배정 DB 줄 — 사람 줄은 id 로, 달력 약속 줄(id 없음)은 이름 · 날 · 시각으로 */
  function dbRow(x) {
    if (!x) return null;
    var R = rows(), i;
    if (x.id) { for (i = 0; i < R.length; i++) if (R[i] && R[i].id === x.id) return R[i]; return null; }
    if (x.k === 'appt') {
      var tm = String(x.s || '').slice(0, 5), td = today();
      for (i = 0; i < R.length; i++) {
        var r = R[i]; if (!r || !r.appt) continue;
        var a = String(r.appt);
        if (a.slice(0, 10) === td && a.slice(11, 16) === tm && (r.name || '고객') === x.t) return r;
      }
    }
    return null;
  }
  /* 「11월 20일(금) 오후 2시」 — TA 스크립트가 쓰는 꼴. 못 읽으면 빈 글자 (1번) */
  function whenOf(ap) {
    var a = String(ap || ''); if (!/^\d{4}-\d{2}-\d{2}/.test(a)) return '';
    var p = a.slice(0, 10).split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    var s = (d.getMonth() + 1) + '월 ' + d.getDate() + '일(' + '일월화수목금토'.charAt(d.getDay()) + ')';
    var hh = +a.slice(11, 13), mm = +a.slice(14, 16);
    if (!isNaN(hh) && a.length >= 16) s += ' ' + (hh < 12 ? '오전 ' : '오후 ') + ((hh % 12) || 12) + '시' + (mm ? ' ' + mm + '분' : '');
    return s;
  }
  function apOf(x) {
    var r = dbRow(x);
    if (r && r.appt) return String(r.appt);
    if (x && x.k === 'appt' && x.s) return today() + ' ' + String(x.s).slice(0, 5);
    return '';
  }
  /* 지금 카드 첫 줄에 세울 갈래 — 약속 내일 · 오늘만. 그 밖에는 null (첫 마디 그대로) */
  function moment(x) {
    if (!x || !ready()) return '';
    var ap = apOf(x), d = ap.slice(0, 10), td = today();
    if (!d) return '';
    if (d === td) return 'go';
    if (d === plus(td, 1)) return 'eve';
    return '';
  }
  function fields(x) {
    var r = dbRow(x), me = '';
    try { me = (g.OS && g.OS.profile && g.OS.profile.name) || ''; } catch (e) { me = ''; }
    return { c: '고객', me: me, when: whenOf(apOf(x)), where: '약속 장소', db: (r && r.src) || '' };
  }
  function text(k, x, ch) { return ready() ? g.TA_MSG.textFor(k, fields(x), ch || 'kakao') : ''; }
  function list(x) {
    var r = dbRow(x), st = (x && x.k === 'db') ? x.tk : (r && r.stage) || '', L = (BY_STAGE[st] || []).slice(), m = moment(x);
    if (x && x.k === 'appt' && !L.length) L = ['go', 'thanks'];
    if (m) L = [m].concat(L.filter(function (k) { return k !== m; }));
    return ready() ? L : [];
  }
  function title(k) { var M = ready() ? g.TA_MSG.MSG : [], i; for (i = 0; i < M.length; i++) if (M[i].k === k) return M[i]; return { k: k, t: k }; }

  /* ── 카드 💬 줄 — 약속 내일 · 오늘인 분만 TA 카톡으로 ── */
  function how(x) {
    var k = moment(x); if (!k) return null;
    return { k: k, one: title(k).t + ' — ' + text(k, x, 'kakao').replace(/\s*\n+\s*/g, ' ') };
  }
  /* 달력 약속 줄은 사람 id 가 없어 📞 를 못 세웁니다 — 💬 와 📋 만 (빈 단추를 세우지 않습니다 · 1번) */
  function apptHow(x) {
    var t = how(x); if (!t) return '';
    try { if (typeof g.hmHowCss === 'function') g.hmHowCss(); } catch (e) {}
    return '<div class="hm-how"><span class="hm-how-t">💬 ' + esc(t.one) + '</span>' +
      '<button type="button" class="hm-how-b" onclick="HM_TAMSG.copy(\'' + esc(x.key || '') + '\',\'' + t.k + '\')">📋</button></div>';
  }
  function copy(key, k) {
    var x = (typeof g.hmStepOf === 'function') ? g.hmStepOf(key) : null;
    var t = text(k, x, CH);
    if (!t) { if (typeof g.toast === 'function') g.toast('TA 카톡을 못 불러왔습니다'); return; }
    if (typeof g.copyText === 'function') g.copyText(t);
    else if (typeof g.toast === 'function') g.toast('복사하지 못했습니다');
  }
  function pick(key, k) { SEL[key] = k; if (typeof g.hmPaint === 'function') g.hmPaint(); }
  function setCh(c) { CH = (c === 'sms') ? 'sms' : 'kakao'; if (typeof g.hmPaint === 'function') g.hmPaint(); }

  /* ── 「이분 자세히」 안 — 그 단계에 맞는 카톡을 고르고 베낀다 ── */
  function css() {
    if (typeof document === 'undefined' || document.getElementById('hmTamsgCss')) return;
    var st = document.createElement('style'); st.id = 'hmTamsgCss';
    st.textContent =
      '.hm-tm{border:1px solid var(--t-line);border-radius:var(--t-r-sm,13px);padding:10px 12px;margin-bottom:10px;background:var(--t-card,#fff)}' +
      '.hm-tm-h{font-size:var(--t6);font-weight:800;color:var(--t-ink)}' +
      '.hm-tm-h span{font-weight:600;color:var(--t-sub)}' +
      '.hm-tm-c{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}' +
      '.hm-tm-c button{min-height:44px;padding:0 12px;border:0;border-radius:10px;font-family:inherit;font-size:var(--t6);font-weight:700;cursor:pointer;background:var(--t-bg,#F2F4F6);color:var(--t-sub)}' +
      '.hm-tm-c button.on{background:var(--t-point-l);color:var(--t-point);font-weight:800}' +
      '.hm-tm-t{margin-top:8px;padding:10px 12px;border-radius:10px;background:var(--t-bg,#F2F4F6);font-size:var(--t6);line-height:1.55;color:var(--t-ink);white-space:pre-wrap}' +
      '.hm-tm-n{margin-top:6px;font-size:var(--t6);line-height:1.45;color:var(--t-sub)}' +
      '.hm-tm-a{display:flex;gap:6px;margin-top:8px}' +
      '.hm-tm-a button{min-height:44px;padding:0 12px;border:0;border-radius:10px;font-family:inherit;font-size:var(--t6);font-weight:800;cursor:pointer;background:var(--t-point-l);color:var(--t-point)}' +
      '.hm-tm-a button.g{background:var(--t-bg,#F2F4F6);color:var(--t-sub);font-weight:700}' +
      '.hm-tm-a button.on{background:var(--t-ink);color:#fff}';
    document.head.appendChild(st);
  }
  function html(x) {
    var L = list(x); if (!x || !L.length) return '';
    css();
    var key = x.key || '', k = (SEL[key] && L.indexOf(SEL[key]) >= 0) ? SEL[key] : L[0], M = title(k), m = moment(x);
    return '<div class="hm-tm"><div class="hm-tm-h">💬 TA 카톡 <span>— ' + (m ? (m === 'eve' ? '약속이 내일이라 전날 확인부터' : '오늘 약속이라 출발할 때') : '이 단계에 맞는 것') + ' · TA 스크립트 글 그대로</span></div>' +
      '<div class="hm-tm-c">' + L.map(function (q) { return '<button type="button" class="' + (q === k ? 'on' : '') + '" onclick="HM_TAMSG.pick(\'' + esc(key) + '\',\'' + q + '\')">' + esc(title(q).t) + '</button>'; }).join('') + '</div>' +
      '<div class="hm-tm-t">' + esc(text(k, x, CH)) + '</div>' +
      (M.note ? '<div class="hm-tm-n">' + String(M.note).replace(/<(?!\/?b>)[^>]*>/g, '') + '</div>' : '') +
      '<div class="hm-tm-a"><button type="button" onclick="HM_TAMSG.copy(\'' + esc(key) + '\',\'' + k + '\')">📋 복사</button>' +
        '<button type="button" class="g' + (CH === 'kakao' ? ' on' : '') + '" onclick="HM_TAMSG.setCh(\'kakao\')">카톡</button>' +
        '<button type="button" class="g' + (CH === 'sms' ? ' on' : '') + '" onclick="HM_TAMSG.setCh(\'sms\')">문자</button></div></div>';
  }

  g.HM_TAMSG = { moment: moment, how: how, apptHow: apptHow, list: list, text: text, html: html,
                 copy: copy, pick: pick, setCh: setCh, whenOf: whenOf, BY_STAGE: BY_STAGE };
})(typeof window !== 'undefined' ? window : this);
