/* ══════════════════════════════════════════════════════════════════
   day-rank.js — <b>「오늘 누구부터 거는가」 를 정하는 규칙, 한 곳.</b>

   사장님 말씀 (2026-09-23) —
     「지금 「오늘 걸 사람」 규칙이 app/day.html 831줄 부근에만 있습니다.
      이것을 app/day-rank.js 로 빼내고, day.html 과 app/index.html 이
      <b>그 한 파일</b>을 읽게 하십시오.
      ★ <b>옮기기만 하고 로직을 고치지 마십시오.</b>」

   ── 왜 빼내는가 ──────────────────────────────────────────────────
   이 규칙이 한 번 어긋나 <b>「오늘 걸 사람 198명」</b> 이 떴습니다
   (day.html 818줄 주석). 밀린 사람이 전부 오늘로 몰린 것입니다.
   그 화면을 열면 사람은 앱을 닫습니다.

   지금은 day.html 안에만 있어서, 홈(app/index.html)이 같은 답을 하려면
   <b>또 적어야</b> 합니다. 두 벌이 되는 순간 한쪽만 고쳐지고, 두 화면이
   서로 다른 「오늘 그 분」 을 말하게 됩니다 (CLAUDE.md 5번).

   ── 어디서 읽는가 ────────────────────────────────────────────────
     · app/day.html      <script src="day-rank.js">
     · app/index.html    <script src="day-rank.js">
     · netlify/functions 서버 — netlify.toml 의 included_files 에 넣어 둡니다
     · scripts/check-queue.js 가 <b>이 파일을 그대로 require</b> 해서 잽니다

   ── ⚠ 손대는 규칙 ────────────────────────────────────────────────
   ★ 여기 있는 셈은 <b>day.html 에서 그대로 옮긴 것</b>입니다. 옮길 때
     숫자도 차례도 한 글자 안 고쳤습니다. 고치실 일이 있으면 <b>여기서만</b>
     고치십시오 — 부르는 쪽에 베껴 두면 그 순간 두 벌입니다.
   ★ 화면을 모릅니다. DOM·localStorage·서버를 안 봅니다. 받은 값으로만
     셈합니다 — 그래야 점검이 브라우저 없이 그대로 잽니다 (8번).
   ══════════════════════════════════════════════════════════════════ */
(function (root, make) {
  var api = make();
  /* 브라우저와 node 둘 다에서 같은 파일을 읽습니다 — 사본을 안 둡니다 */
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DAYRANK = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  /* ── ① 날짜 ──────────────────────────────────────────────────────
     「무엇을 언제 해야 하는가」 는 고객관리 쪽이 정하는 것이고, 근거 없는
     숫자를 화면에 박아 두면 매일 틀린 명단이 뜹니다. 그래서 날짜는
     <b>사람이 고른 것</b>과 <b>실제로 잡힌 약속</b> 두 가지만 씁니다.
     아무도 안 정했으면 「미정」 입니다 — 지어내지 않습니다 (1번).      */
  function nextOf(r, next) {
    next = next || {};
    if (next[r.id]) return next[r.id];            /* 사람이 고른 날 */
    if (r.appt) return ('' + r.appt).slice(0, 10); /* 잡힌 상담 약속 */
    return '';                                     /* 미정 */
  }
  function due(r, next, today) {
    var d = nextOf(r, next);
    return d ? (d <= today) : false;
  }

  /* ── ② 한 사람의 무게 ────────────────────────────────────────────
     day.html 의 queueAll() 에서 <b>그대로</b> 옮겼습니다. 숫자를 안 고쳤습니다.
     돌려주는 값이 null 이면 「오늘 사람이 아니다」 라는 뜻입니다.        */
  function weightOf(r, o) {
    o = o || {};
    var next = o.next || {}, done = o.done || {}, today = o.today || '';
    if (r.stage === '증권전달') return null;
    if (done[r.id]) return null;
    var ap = (r.appt && ('' + r.appt).slice(0, 10));
    if (ap === today) return 100;                          /* 오늘 약속 */
    if (r.stage === '계약완료') return 90;                 /* 증권이 안 감 — 밀리면 민원 */
    if (due(r, next, today)) return 80 + Math.min(r.days, 15); /* 정해 둔 날이 됐다 */
    if (ap && ap > today) return null;                     /* 약속이 앞에 있으면 오늘 아니다 */
    if (!r.n) return 60 + Math.min(r.days, 30);            /* 한 번도 안 걸었다 */
    if (next[r.id]) return null;                           /* 정해 둔 날이 아직 안 왔다 */
    return Math.min(r.days, 40);                           /* 손 놓은 지 오래된 순 */
  }

  /* ── ③ 오늘 차례 ─────────────────────────────────────────────────
     <b>한 사람은 한 번만</b> 섭니다 (한 분 = 한 퀘스트). 같은 id 가 두
     줄에 있어도 무거운 쪽 하나만 남깁니다 — 오늘 자리에 같은 분이 두 번
     서면 「몇 분 남았나」 가 거짓말이 됩니다.                          */
  function rank(rows, o) {
    var out = [], seen = {}, i, w;
    rows = rows || [];
    for (i = 0; i < rows.length; i++) {
      w = weightOf(rows[i], o);
      if (w === null) continue;
      if (seen[rows[i].id] !== undefined) {
        if (w > out[seen[rows[i].id]].w) out[seen[rows[i].id]] = { r: rows[i], w: w };
        continue;
      }
      seen[rows[i].id] = out.length;
      out.push({ r: rows[i], w: w });
    }
    out.sort(function (a, b) { return b.w - a.w; });
    return out;
  }

  /* ── ④ 30일 약속 ─────────────────────────────────────────────────
     「30일 안에 모든 고객에게」 — 이 앱이 지키자고 만든 약속입니다.
     주기는 앱의 ccCfg() 가 정합니다(days 30 · vipDays 14).

     ★ <b>접촉은 통화·만남만 셉니다.</b> 사장님 말씀 그대로입니다 —
       「단계를 옮긴 것은 접촉이 아닙니다. 섞으면 앉아서 버튼만 눌러도
        약속을 지킨 것이 됩니다.」
       문자·카톡·메모도 여기서는 안 셉니다. 글로만 이어진 것을 「뵀다」 로
       치면 30일 약속이 <b>글자만 오간 관계</b>를 덮어 줍니다.
     ★ 그래서 화면의 「마지막으로 닿은 날」(cmLastTouch)과 <b>일부러 다릅니다.</b>
       그쪽은 「무엇으로든 닿은 날」 이고 이쪽은 「약속을 지킨 날」 입니다.
       두 물음이 다르므로 두 답이 있는 것이지, 두 벌이 아닙니다.        */
  var KEEP_HOW = ['전화', '통화', '만남', '방문', '대면', 'call', 'meet'];
  function isKeep(how) {
    var h = ('' + (how == null ? '' : how)).replace(/\s/g, '');
    for (var i = 0; i < KEEP_HOW.length; i++) if (h.indexOf(KEEP_HOW[i]) >= 0) return true;
    return false;
  }
  /* 통화·만남 중 <b>가장 최근 것</b>. 하나도 없으면 빈 글자 */
  function keepAt(touch, callAt) {
    var best = '', i, t;
    touch = touch || [];
    for (i = 0; i < touch.length; i++) {
      t = touch[i];
      if (!t || !t.at) continue;
      if (!isKeep(t.how)) continue;               /* 단계 이동·문자·메모는 안 센다 */
      if (t.at > best) best = t.at;
    }
    /* CRM 통화 기록은 <b>그 자체가 통화</b>입니다 */
    if (callAt && callAt > best) best = callAt;
    return best;
  }
  /* 며칠 지났나 — 날짜 글자(YYYY-MM-DD)끼리 잽니다 */
  function dayGap(a, b) {
    var x = Date.parse(('' + a).slice(0, 10) + 'T00:00:00Z');
    var y = Date.parse(('' + b).slice(0, 10) + 'T00:00:00Z');
    if (isNaN(x) || isNaN(y)) return null;
    return Math.round((y - x) / 86400000);
  }
  /* 약속을 지켰나 · 넘겼나 · 한 번도 안 뵀나.
     점수는 명세서(docs/토스판_사본.html 의 queue())에서 그대로 옮겼습니다. */
  function promiseOf(o) {
    o = o || {};
    var today = o.today || '', cy = o.cycle > 0 ? o.cycle : 30;
    var at = keepAt(o.touch, o.callAt);
    if (!at) {
      var born = dayGap(o.since, today);
      return { k: 'never', d: (born === null ? null : born), cy: cy, at: '', sc: 560 };
    }
    var d = dayGap(at, today);
    if (d === null) return { k: 'none', d: null, cy: cy, at: at, sc: 0 };
    if (d >= cy) return { k: 'over', d: d, cy: cy, at: at, sc: 500 + Math.min(d - cy, 60) * 2 };
    if (d >= Math.max(1, Math.round(cy * 5 / 6))) return { k: 'soon', d: d, cy: cy, at: at, sc: 0 };
    return { k: 'ok', d: d, cy: cy, at: at, sc: 0 };
  }

  /* ══ 신호 — <b>오늘 이 분께 걸 구실</b> ════════════════════════════
     명세서(docs/토스판_사본.html 의 signals()) 에서 <b>점수와 말을 그대로</b>
     옮겼습니다. 여기서 숫자를 새로 짓지 않습니다.

     ★ <b>두 갈래입니다.</b>
       when:'day'  <b>날짜가 와서</b> 오늘 서는 것 — 생일 · 계약 주년.
                   오늘 자리에 <b>줄을 세웁니다.</b>
       when:'any'  <b>늘 참인 것</b> — 자녀 나이 · 보험료 비중. 줄을 세우면
                   해가 바뀔 때까지 <b>매일 같은 분</b>이 서서 큐가 영영
                   안 줄어듭니다. 그래서 줄은 안 세우고, 이미 선 분의
                   <b>「왜 오늘 이분인가」</b> 로만 씁니다.
     ★ 못 받은 값은 <b>안 세웁니다</b> — 0 으로 적으면 「없다」가 됩니다 (1번).
     ★ 2월 29일 생일은 윤년이 아닌 해에 <b>안 울립니다</b>. 3월 1일로
       옮겨 적으면 그것은 <b>우리가 고른 날</b>이지 그분 생일이 아닙니다.  */
  /* 올해(또는 내년) 의 그 MM-DD — 오늘보다 이르면 내년으로 넘깁니다 */
  function nextMmdd(mmdd, today) {
    var m = ('' + (mmdd == null ? '' : mmdd)).match(/(\d{1,2})\D+(\d{1,2})/);
    var t = ('' + (today == null ? '' : today)).slice(0, 10);
    if (!m || !/^\d{4}-\d{2}-\d{2}$/.test(t)) return '';
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    var s = p(+m[1]) + '-' + p(+m[2]), y = +t.slice(0, 4);
    var d = y + '-' + s;
    return (d < t) ? ((y + 1) + '-' + s) : d;
  }
  function signalsOf(o) {
    o = o || {};
    var today = ('' + (o.today || '')).slice(0, 10), S = [], d, i;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) return S;

    /* 🎂 생일 — <b>D-7 부터 D-1 까지</b>.
       D-0(오늘) 은 달력의 생일 갈래가 이미 세웁니다. 여기서 또 세우면
       같은 생일을 <b>두 곳</b>이 답하게 됩니다 (5번). 여기는 그 앞날만 봅니다. */
    if (o.bd) {
      d = dayGap(today, nextMmdd(o.bd, today));
      if (d !== null && d >= 1 && d <= 7)
        S.push({ id: 'bd', when: 'day', emo: '🎂', t: '생일 D-' + d, ch: '문자',
          aim: '<b>축하만</b> 전한다',
          way: '계약 이야기를 오늘 붙이지 않는다. 그것이 다음 자리를 만든다',
          why: '생일이 ' + d + '일 남았습니다', sc: 700 + (8 - d) * 8 });
    }

    /* 🎗️ 계약 주년 — <b>2년차부터</b>.
       1년차(12개월) 는 MST_STEPS 의 마디가 이미 세웁니다. 여기서 또 세우면
       한 해에 두 번 같은 말을 하게 됩니다 (5번). */
    var cd = ('' + (o.cd || '')).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(cd)) {
      var ann = nextMmdd(cd.slice(5), today);
      d = dayGap(today, ann);
      var yr = ann ? ((+ann.slice(0, 4)) - (+cd.slice(0, 4))) : 0;
      if (d !== null && d >= 0 && d <= 7 && yr >= 2)
        S.push({ id: 'ann', when: 'day', emo: '🎗️',
          t: '계약 ' + yr + '주년 ' + (d ? 'D-' + d : '오늘'), ch: '전화',
          aim: '<b>잘 쓰고 계신지</b> 여쭙는다',
          way: '새 이야기를 붙이지 않는다. 그 해에 달라진 것만 알려 드린다',
          why: '계약하신 지 ' + yr + '년이 됩니다', sc: 640 + (8 - d) * 5 });
    }

    /* 🎒 자녀가 돈이 바뀌는 나이 — 태어난 해만 알면 셈이 섭니다.
       <b>늘 참</b>이라 줄은 안 세웁니다(when:'any'). */
    var K = (o.kids && o.kids.push) ? o.kids : [];
    var got = {};
    for (i = 0; i < K.length; i++) {
      var by = parseInt(('' + K[i]).replace(/[^0-9]/g, ''), 10);
      if (!by || by < 1900 || by > 2200) continue;          /* 모르면 안 센다 (1번) */
      var age = (+today.slice(0, 4)) - by;
      if ([7, 13, 16, 19].indexOf(age) < 0) continue;
      if (got[age]) continue;
      got[age] = 1;
      S.push({ id: 'kid' + age, when: 'any', emo: '🎒', t: '자녀 ' + age + '세', ch: '전화',
        aim: '교육자금 이야기를 <b>꺼낼 자리</b>다',
        way: '상품을 말하지 않는다. 언제 얼마가 드는지부터 같이 센다',
        why: '자녀가 ' + age + '세 — 돈이 바뀌는 길목입니다', sc: 520 });
    }

    /* ⚖️🕳️ 보험료 비중 — <b>둘 다 적혀 있을 때만</b>.
       한쪽만 있으면 나누지 않습니다. 0 으로 채우면 없는 비중이 생깁니다 (1번).
       두 값은 <b>같은 단위(월 만원)</b> 라야 합니다 (4번). */
    var inc = parseFloat(o.finc), ins = parseFloat(o.fins);
    if (isFinite(inc) && isFinite(ins) && inc > 0 && ins > 0) {
      var r = ins / inc * 100;
      if (r >= 8)
        S.push({ id: 'hi', when: 'any', emo: '⚖️', t: '보험료 비중 ' + r.toFixed(0) + '%', ch: '전화',
          aim: '무엇이 들어 있는지 <b>같이 본다</b>',
          way: '줄이자고 먼저 말하지 않는다. 비중을 보여 드리고 판단은 그분이 한다',
          why: '월 소득 ' + inc + '만원에 보험료 ' + ins + '만원입니다', sc: 480 });
      else if (r < 3)
        S.push({ id: 'lo', when: 'any', emo: '🕳️', t: '보험료 비중 ' + r.toFixed(0) + '%', ch: '전화',
          aim: '비어 있는 자리를 <b>확인만</b> 한다',
          way: '부족하다고 단정하지 않는다. 어디가 비었는지 같이 본다',
          why: '월 소득 ' + inc + '만원에 보험료 ' + ins + '만원입니다', sc: 460 });
    }

    S.sort(function (a, b) { return b.sc - a.sc; });
    return S;
  }

  return {
    nextOf: nextOf, due: due, weightOf: weightOf, rank: rank,
    isKeep: isKeep, keepAt: keepAt, dayGap: dayGap, promiseOf: promiseOf,
    nextMmdd: nextMmdd, signalsOf: signalsOf,
    KEEP_HOW: KEEP_HOW
  };
});
