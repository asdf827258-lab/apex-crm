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
  /* ⚠ 2026-09-25 · <b>둘로 갈랐습니다 — 합친 것은 그대로입니다.</b>
     「오늘 몇 통 걸고 몇 분 만났나」 를 세려면 통화와 만남을 갈라야 합니다.
     그렇다고 여기 말고 <b>다른 곳</b>에 또 적으면 두 벌이 됩니다 (5번).
     그래서 갈래 둘을 두고 KEEP_HOW 는 <b>그 둘을 합친 것</b>으로 둡니다 —
     30일 약속 셈(promiseOf)은 한 글자도 안 바뀝니다. 차례만 달라지는데
     isKeep 은 <b>하나라도 걸리면</b> 참이라 차례는 상관없습니다. */
  var CALL_HOW = ['전화', '통화', 'call'];
  var MEET_HOW = ['만남', '방문', '대면', 'meet'];
  var KEEP_HOW = CALL_HOW.concat(MEET_HOW);
  function hasHow(how, LIST) {
    var h = ('' + (how == null ? '' : how)).replace(/\s/g, ''), i;
    for (i = 0; i < LIST.length; i++) if (h.indexOf(LIST[i]) >= 0) return true;
    return false;
  }
  function isCall(how) { return hasHow(how, CALL_HOW); }
  function isMeet(how) { return hasHow(how, MEET_HOW); }
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

    /* 🎉📅 <b>만기</b> — 보장분석이 적어 둔 한 줄로만 봅니다.
       ★ <b>「D-30」 이라고 안 씁니다</b> (1번). 가입 시기가 "2019-04" 처럼
         <b>달까지만</b> 있어, 일 단위 D-day 는 <b>없는 정밀도</b>입니다.
         납입은 <b>달</b>까지, 보장은 <b>해</b>까지 아는 대로만 말합니다.
       ★ <b>점수도 지어내지 않습니다.</b> 명세서는 납입만기 690~750(D-30~D-0),
         보장만기 663~753 이라고 정해 두었습니다. 우리는 며칠 남았는지를
         모르므로 그 <b>양 끝</b>만 씁니다 — 이번 달이면 가까운 쪽, 다음 달이면
         먼 쪽. 가운데 값을 지어내면 모르는 것을 아는 척하는 것입니다.
       ★ 이 줄은 <b>추정</b>입니다. 증권을 보고 적은 날짜가 생기면 그쪽이
         이깁니다. 그래서 화면에도 <b>출처를 같이</b> 적습니다.          */
    var E=o.end||null;
    if(E&&E.pay&&/^\d{4}-\d{2}$/.test(''+E.pay.ym)){
      var pm=(+(''+E.pay.ym).slice(0,4))*12+(+(''+E.pay.ym).slice(5,7));
      var nm=(+today.slice(0,4))*12+(+today.slice(5,7));
      var gap=pm-nm;                                   /* 0 = 이번 달 · 1 = 다음 달 */
      if(gap===0||gap===1)
        S.push({id:'payend', when:'day', emo:'🎉',
          t:'납입 만기 '+(gap?'다음 달':'이번 달'), ch:'전화',
          aim:'<b>이제 다 내셨다</b>고 알려 드린다',
          way:'새 상품을 오늘 붙이지 않는다. 축하가 먼저다 — 그 자리에서 소개가 나온다',
          why:(gap?'다음 달':'이번 달')+'에 보험료 납입이 끝납니다 — '+E.pay.ym+
              (E.pay.nm?(' · '+E.pay.nm):'')+' ('+(E.src||'보장분석에서 셈')+')',
          sc:(gap?690:750)});
    }
    if(E&&E.cov&&E.cov.y){
      var dy=(+E.cov.y)-(+today.slice(0,4));
      /* <b>올해 안</b>일 때만 세웁니다 — 해까지밖에 모르니 그 위로는
         「가깝다」 고 말할 자격이 없습니다. 점수도 명세서의 <b>먼 쪽</b>입니다. */
      if(dy===0)
        S.push({id:'end', when:'day', emo:'📅', t:'보장 만기 올해', ch:'전화',
          aim:'만기 전에 <b>한 번 같이 본다</b>',
          way:'바꾸자고 먼저 말하지 않는다. 지금 것을 정확히 알려 드리는 자리다',
          why:'올해 보장이 끝나는 계약이 있습니다 — '+E.cov.y+'년'+
              (E.cov.age?(' · '+E.cov.age+'세 만기'):'')+(E.cov.nm?(' · '+E.cov.nm):'')+
              ' ('+(E.src||'보장분석에서 셈')+')',
          sc:663});
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

  /* ══ 📊 <b>오늘 얼마나 움직이셨나</b> ═══════════════════════════════
     사장님 말씀 — 「활동량(전화·만남·기록)」.

     ★ <b>「했다고 누른 것」이 아니라 「기록이 남은 것」</b>을 셉니다 (1번).
       daily_checks 의 체크는 <b>다른 물음</b>입니다 — 앉아서 단추만 눌러도
       열한 칸이 다 차기 때문입니다. 두 수는 서로 다른 것을 재므로 둘 다
       있는 것이 맞고, 여기서 세는 것은 <b>기록</b> 쪽입니다.
     ★ 무엇이 통화이고 무엇이 만남인지는 <b>위 표 한 곳</b>이 압니다 —
       30일 약속을 세는 자와 같은 자입니다 (5번).
     ★ <b>기록</b>은 카톡·문자·메일까지 <b>전부</b> 셉니다. 「오늘 손을
       몇 번 댔나」 라서, 통화·만남만 세면 카톡만 돌린 날이 0 이 됩니다.
     ★ 날짜를 못 읽는 줄은 <b>안 셉니다</b> — 오늘 것인지 모르니까요.    */
  function actOf(rows, today) {
    var t = ('' + (today || '')).slice(0, 10), i, r, o = { call: 0, meet: 0, all: 0 };
    rows = rows || [];
    for (i = 0; i < rows.length; i++) {
      r = rows[i];
      if (!r || !r.at || ('' + r.at).slice(0, 10) !== t) continue;
      o.all++;
      if (isCall(r.how)) o.call++;
      else if (isMeet(r.how)) o.meet++;          /* 한 줄이 둘로 세지 않게 */
    }
    return o;
  }

  return {
    nextOf: nextOf, due: due, weightOf: weightOf, rank: rank,
    isKeep: isKeep, isCall: isCall, isMeet: isMeet,
    keepAt: keepAt, dayGap: dayGap, promiseOf: promiseOf,
    nextMmdd: nextMmdd, signalsOf: signalsOf, actOf: actOf,
    KEEP_HOW: KEEP_HOW, CALL_HOW: CALL_HOW, MEET_HOW: MEET_HOW
  };
});
