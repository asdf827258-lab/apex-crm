/* ══ 💬 팀원 약속 — <b>세는 규칙 한 곳</b> (판 X577) ═══════════════════════
 *
 * 사장님 말씀 (2026-11-26) — 카톡 비서를 팀원판으로 · 「숫자와 내용까지, 각 담당
 * 지점장이 알람으로 보고 받게」.
 *
 * ★ <b>앱과 서버가 같은 파일을 읽습니다</b> (5번). 앱(app/my-promise.js)은
 *   <script> 로, 서버(scripts/push-core.js → push-cron)는 netlify.toml 의
 *   included_files 로 받습니다 — alm-slots.js · apex-pex.js 와 같은 방식입니다.
 *   「늦음」·「놓칠 뻔」 을 여기 말고 어디에도 다시 적지 마십시오. 두 벌이 되는
 *   순간 팀원 화면과 지점장 알람이 <b>다른 수</b>를 말합니다.
 *
 * ★ 이름 가리기도 여기 한 곳입니다 (3번) — AI 로 보내기 전 · 저장하기 전 ·
 *   알람 글 · 세 자리가 같은 함수를 부릅니다.
 *     고객 이름  홍길동 → 홍*동 (가운데 글자) · 두 글자 김수 → 김*
 *     전화번호   010-1234-5678 → 010-****-****
 *   ★ 팀원(설계사) 이름은 안 가립니다 — 지점장이 「누구의 약속인지」 알아야
 *     챙길 수 있습니다. 가리는 것은 <b>고객</b>입니다.
 *
 * ★ 판정은 넷뿐입니다 —
 *     done   끝냄
 *     late   마감(due)이 오늘보다 앞 — 「늦음」
 *     stale  날짜 없이 적은 지 STALE_DAYS(3)일 지남 — 「놓칠 뻔한 약속」
 *     today  마감이 오늘
 *     open   그 밖 (아직 여유)
 *   「놓친」 = late + stale. 알람의 「놓친 N건」 은 이 둘의 합입니다.
 *
 * ★ 날짜는 <b>한국 시각</b>으로 셉니다 — UTC 로 세면 아침 9시 전까지 어제로 잡힙니다.
 */
(function (root) {
  'use strict';

  var STALE_DAYS = 3;          /* 날짜 없는 약속 — 적은 지 사흘이면 「놓칠 뻔」 */
  var PUSH_H = 8;              /* 지점장 · 대표 알람 시각(한국 시각) — ☀️ 아침 조회(8:30) 전에 폰에 와 있게. 정각에만 보내므로 8시.
                                  8시 「블로그 한 줄」 과 같은 시각이지만 TAG 가 달라 서로 안 지웁니다 */
  var PEOPLE_MAX = 8;          /* 알람에 이름을 적는 팀원 수 — 넘으면 「외 N명」 */
  /* 폰 알람 딱지 — sw.js 는 같은 딱지면 <b>덮어씁니다</b>(기본 apex-today). 같은 시각에 뜨는 알람끼리
     서로 지우지 않게 셋을 따로 둡니다 — 지점장은 8시에 팀 보고와 자기 약속을 둘 다 받습니다. */
  var TAG = 'apex-promise';          /* 지점장 · 대표 — 팀 보고 */
  var TAG_ME = 'apex-promise-me';    /* 팀원 본인 — 오늘 챙길 약속 */
  var TAG_SOON = 'apex-promise-soon';/* 팀원 본인 — 시각 있는 약속 30분 전 */
  /* 팀원 본인 알람 (2026-11-26 · 사업단장 「각자 팀원들에게도 매일 할일들 완료 해야될것들에 대해서
     수시적으로 안내 연락까지 갈수 있도록 해」)
       8시   ☀️ 오늘 챙길 약속 N건 · 놓친 M건  — 앞 3개
       12시 · 17시  📋 아직 남은 약속 N건      — 남은 게 있을 때만(다 끝냈으면 안 울림)
       시각 있는 약속  ⏰ 30분 전               — promise-cron 이 30분마다 깨어나 30~59분 뒤 약속을 봅니다
     「챙길」 = 놓친(늦음 · 놓칠 뻔) + 오늘 마감. 마감이 아직 남은 약속으로는 울리지 않습니다.
     「✓ 했어요」 를 누르면 status=done 이 되어 다음 알람부터 저절로 빠집니다. */
  var MEM_H = [8, 12, 17];
  var SOON_MIN = 30;
  var ME_MAX = 3;              /* 팀원 본인 알람에 적는 줄 수 */
  var LIST_MAX = 4;            /* 알람에 이름까지 적는 줄 수 — 잠긴 화면에 다 들어가게 */

  function kstYmd(ms) {
    var d = new Date((ms == null ? Date.now() : ms) + 9 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  }
  function ymdOf(v) {           /* '2026-11-26' · '2026-11-26T01:00:00Z' → 한국 날짜 */
    if (!v) return '';
    var s = String(v);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    var t = Date.parse(s);
    return isNaN(t) ? '' : kstYmd(t);
  }
  function daysBetween(a, b) {  /* b - a (일) */
    var x = Date.parse(a + 'T00:00:00Z'), y = Date.parse(b + 'T00:00:00Z');
    if (isNaN(x) || isNaN(y)) return 0;
    return Math.round((y - x) / 86400000);
  }

  /* ── 판정 — {k, days} · days = 늦은 날 수(late) · 적은 지 날 수(stale) ── */
  function state(p, today) {
    today = today || kstYmd();
    if (!p) return { k: 'open', days: 0 };
    if (p.status === 'done') return { k: 'done', days: 0 };
    var due = ymdOf(p.due);
    if (due) {
      var n = daysBetween(due, today);
      if (n > 0) return { k: 'late', days: n };
      if (n === 0) return { k: 'today', days: 0 };
      return { k: 'open', days: 0 };
    }
    var made = ymdOf(p.created_at) || today, m = daysBetween(made, today);
    if (m >= STALE_DAYS) return { k: 'stale', days: m };
    return { k: 'open', days: m };
  }
  function missed(p, today) { var k = state(p, today).k; return k === 'late' || k === 'stale'; }
  var LABEL = { late: '늦음', stale: '놓칠 뻔', today: '오늘', open: '', done: '끝' };
  var RANK = { late: 0, stale: 1, today: 2, open: 3, done: 4 };
  function sort(L, today) {
    return (L || []).slice().sort(function (a, b) {
      var x = state(a, today), y = state(b, today);
      if (RANK[x.k] !== RANK[y.k]) return RANK[x.k] - RANK[y.k];
      if (x.days !== y.days) return y.days - x.days;
      return String(a.due || '9999').localeCompare(String(b.due || '9999'));
    });
  }

  /* ── 이름 가리기 ────────────────────────────────────────────────── */
  function maskName(s) {
    s = String(s == null ? '' : s).replace(/^\s+|\s+$/g, '');
    if (!s) return '';
    if (/[*○]/.test(s)) return s;                 /* 이미 가림 */
    if (!/^[가-힣]{2,5}$/.test(s)) return s;      /* 한글 이름 꼴이 아니면 그대로(「고객」 같은 말) */
    if (s.length === 2) return s.charAt(0) + '*';
    return s.charAt(0) + new Array(s.length - 1).join('*') + s.charAt(s.length - 1);
  }
  /* 성 — 이 글자로 시작하는 2~4글자 + 호칭이면 이름으로 봅니다 */
  var SUR = '김이박최정강조윤장임한오서신권황안송류유전홍고문양손배백허남심노하곽성차주우구민진나지엄채원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모탁국어은편용예경봉사부';
  /* 호칭 앞에 와도 이름이 아닌 말 — 「고객님」 이 「고*님」 이 되지 않게 */
  var STOP = ['고객', '선생', '사장', '원장', '부장', '과장', '차장', '실장', '팀장', '이사', '회장', '대표', '주임',
    '전무', '상무', '대리', '기사', '성함', '명의', '이분', '저분', '그분', '우리', '고모', '이모', '삼촌', '조카',
    '부모', '장모', '장인', '모친', '부친', '어머', '아버', '형님', '언니', '오빠', '누나', '동생', '친구', '여러',
    '손님', '환자', '담당', '보험', '문의', '주인', '사모', '선배', '후배', '지점', '본부', '설계', '매니', '상담',
    '가족', '남편', '아내', '부인', '자녀', '아드', '따님', '할머', '할아', '이번', '다음', '오늘', '내일', '모레',
    '기존', '신규', '해당', '모든', '많은', '우수', '장기', '소개', '저희', '제가', '진짜', '정말', '감사', '수고', '안녕', '반갑', '고생', '전화', '연락', '문자', '카톡'];
  var HON = '(님|씨|고객님|고객|선생님|사장님|대표님|원장님|어머님|아버님|부장님|과장님|이사님|회장님|여사님)';
  var RE_HON = new RegExp('([' + SUR + '][가-힣]{1,3})( ?)' + HON, 'g');
  function stopWord(w) {
    for (var i = 0; i < STOP.length; i++) if (w.indexOf(STOP[i]) === 0) return true;
    return false;
  }
  function maskPhone(t) {
    return String(t || '')
      .replace(/(01[016789])[-.\s]?\d{3,4}[-.\s]?\d{4}/g, '$1-****-****')
      .replace(/\b(0[2-6]\d?)[-.\s]\d{3,4}[-.\s]\d{4}\b/g, '$1-****-****');
  }
  /* 글 전체 — 전화번호 · 호칭 앞 이름 · 카톡 말한 사람 칸 · 따로 아는 이름(names) */
  function maskText(t, names) {
    var s = maskPhone(t);
    /* 카톡 PC 꼴 「[홍길동] [오후 3:12] …」 · 내보내기 꼴 「2026. 11. 26. 오후 3:12, 홍길동 : …」 */
    s = s.replace(/^\[([^\]\n]{2,5})\](?=\s*\[)/gm, function (m, n) { return '[' + maskName(n) + ']'; });
    s = s.replace(/(,\s*)([가-힣]{2,5})(\s*:\s)/g, function (m, a, n, b) { return a + maskName(n) + b; });
    s = s.replace(RE_HON, function (m, n, sp, h) {
      if (stopWord(n)) return m;
      return maskName(n) + sp + h;
    });
    (names || []).forEach(function (n) {
      n = String(n || '').replace(/^\s+|\s+$/g, '');
      if (!/^[가-힣]{2,5}$/.test(n)) return;
      s = s.split(n).join(maskName(n));
    });
    return s;
  }

  /* ── 알람 — 숫자 + 내용(가린 이름) ─────────────────────────────────
     rows : [{member_id, team_id, text, who, due, status, created_at}]
     nm   : {member_id: '이름'} — 팀원 이름(안 가림)
     teams: {team_id: '팀 이름'} — 대표 알람에만
     열린 약속이 하나도 없으면 null — 「0건」 알람은 방해입니다(alm-slots.js 와 같은 뜻). */
  function lineOf(p, nm, today) {
    var s = state(p, today);
    var who = p.who ? maskName(p.who) + '님 ' : '';
    var tail = s.k === 'late' ? s.days + '일 늦음' : s.k === 'stale' ? s.days + '일째' : s.k === 'today' ? '오늘' : '';
    var t = maskText(String(p.text || ''), p.who ? [p.who] : []).slice(0, 30);
    return ((nm && nm[p.member_id]) || '팀원') + ' · ' + who + t + (tail ? ' · ' + tail : '');
  }
  function count(rows, today) {
    var o = { open: 0, miss: 0, late: 0, stale: 0, today: 0 };
    (rows || []).forEach(function (p) {
      var k = state(p, today).k;
      if (k === 'done') return;
      o.open++;
      if (k === 'late') { o.late++; o.miss++; }
      else if (k === 'stale') { o.stale++; o.miss++; }
      else if (k === 'today') o.today++;
    });
    return o;
  }
  /* 팀원마다 숫자 — [{id, name, open, miss}] · 놓친 것 많은 사람이 앞 (아침 조회에서 먼저 부를 사람) */
  function byMember(rows, nm, today) {
    var by = {};
    (rows || []).forEach(function (p) {
      if (!p || p.status === 'done') return;
      var id = p.member_id || '';
      var o = by[id] = by[id] || { id: id, name: (nm && nm[id]) || '팀원', open: 0, miss: 0 };
      o.open++; if (missed(p, today)) o.miss++;
    });
    return Object.keys(by).map(function (k) { return by[k]; })
      .sort(function (a, b) { return b.miss - a.miss || b.open - a.open || String(a.name).localeCompare(String(b.name)); });
  }
  function personLine(L) {
    return L.map(function (x) { return x.name + ' 열린 ' + x.open + (x.miss ? '·놓친 ' + x.miss : ''); }).join(' / ');
  }
  /* ☀️ 아침 조회 알람 (2026-11-26 · 사업단장 「아침에 통솔이 되어야 해」)
     제목  ☀️ 아침 조회 · 팀원 약속 N건 · 놓친 M건      (대표는 「사업단 약속」)
     1줄   (대표만) 팀마다 숫자
     2줄   팀원마다 「열린 n·놓친 n」 — 지점장은 약속 있는 팀원 전부, 대표는 놓친 사람부터
     3줄~  ⚠ 놓친 약속 — 누가 · 가린 고객 · 무엇 · 며칠 (LIST_MAX 줄)
     ★ tag 를 따로 둡니다 — 서비스워커(sw.js)는 같은 tag 면 덮어써서, 같은 시각의 다른 알람과 서로 지웁니다. */
  function pushFor(rows, nm, today, opt) {
    opt = opt || {};
    today = today || kstYmd();
    var open = (rows || []).filter(function (p) { return p && p.status !== 'done'; });
    if (!open.length) return null;
    var c = count(open, today);
    var title = '☀️ 아침 조회 · ' + (opt.all ? '사업단 약속 ' : '팀원 약속 ') + c.open + '건 · 놓친 ' + c.miss + '건';
    var L = [];
    if (opt.all && opt.teams) {       /* 대표 — 팀마다 숫자 한 줄 */
      var by = {};
      open.forEach(function (p) { var k = p.team_id || ''; (by[k] = by[k] || []).push(p); });
      var T = Object.keys(by).map(function (k) { var x = count(by[k], today); return { n: opt.teams[k] || '팀 없음', o: x.open, m: x.miss }; })
        .sort(function (a, b) { return b.m - a.m || b.o - a.o; });
      L.push(T.map(function (x) { return x.n + ' ' + x.o + (x.m ? '(놓침 ' + x.m + ')' : ''); }).join(' · '));
    }
    var P = byMember(open, nm, today);
    if (opt.all) { var PM = P.filter(function (x) { return x.miss; }); if (PM.length) P = PM; }
    var pl = personLine(P.slice(0, PEOPLE_MAX));
    L.push(pl + (P.length > PEOPLE_MAX ? ' / 외 ' + (P.length - PEOPLE_MAX) + '명' : ''));
    var miss = sort(open.filter(function (p) { return missed(p, today); }), today);
    var show = miss.length ? miss : sort(open.filter(function (p) { return state(p, today).k === 'today'; }), today);
    if (miss.length) L.push('⚠ 놓친 약속');
    else L.push(show.length ? '놓친 약속은 없어요 · 오늘 마감' : '놓친 약속은 없어요');
    show.slice(0, LIST_MAX).forEach(function (p) { L.push(lineOf(p, nm, today)); });
    if (show.length > LIST_MAX) L.push('외 ' + (show.length - LIST_MAX) + '건 — 앱에서 보기');
    return { title: title, body: L.join('\n'), go: '/app/index.html', tag: TAG, n: c, people: byMember(open, nm, today) };
  }

  /* ── 팀원 본인 알람 ─────────────────────────────────────────────── */
  function hmOf(t) {            /* '15:00' · '15:00:00' → 분(900) · 없으면 -1 */
    var m = /^(\d{1,2}):(\d{2})/.exec(String(t || ''));
    return m ? (+m[1]) * 60 + (+m[2]) : -1;
  }
  function hhmm(n) { return ('0' + Math.floor(n / 60)).slice(-2) + ':' + ('0' + (n % 60)).slice(-2); }
  function mustToday(p, today) { var k = state(p, today).k; return k === 'late' || k === 'stale' || k === 'today'; }
  function meLine(p, today) {   /* 내 알람 한 줄 — 팀원 이름 없이 「홍*동님 무엇 · 상태」 */
    var s = state(p, today), n = hmOf(p.time);
    var who = p.who ? maskName(p.who) + '님 ' : '';
    var t = maskText(String(p.text || ''), p.who ? [p.who] : []).slice(0, 30);
    var tail = s.k === 'late' ? s.days + '일 늦음' : s.k === 'stale' ? '날짜 없이 ' + s.days + '일째' : s.k === 'today' ? '오늘' + (n >= 0 ? ' ' + hhmm(n) : '') : '';
    return '· ' + who + t + (tail ? ' — ' + tail : '');
  }
  /* h = 한국 시각(8 · 12 · 17). 챙길 것이 없으면 null — 「0건」 알람은 방해입니다. */
  function memberPush(rows, h, today) {
    today = today || kstYmd();
    if (MEM_H.indexOf(h) < 0) return null;
    var L = sort((rows || []).filter(function (p) { return p && p.status !== 'done' && mustToday(p, today); }), today);
    if (!L.length) return null;
    var c = count(L, today);
    var title = h === MEM_H[0]
      ? '☀️ 오늘 챙길 약속 ' + L.length + '건' + (c.miss ? ' · 놓친 ' + c.miss + '건' : '')
      : '📋 아직 남은 약속 ' + L.length + '건' + (c.miss ? ' · 놓친 ' + c.miss + '건' : '');
    var B = L.slice(0, ME_MAX).map(function (p) { return meLine(p, today); });
    if (L.length > ME_MAX) B.push('외 ' + (L.length - ME_MAX) + '건');
    B.push('끝냈으면 앱에서 ✓ 했어요 — 다음 알림에서 빠져요');
    return { title: title, body: B.join('\n'), go: '/app/index.html', tag: TAG_ME, n: L.length };
  }
  /* nowMin = 깨어난 시각(한국 시각, 하루의 분). 오늘 마감 · 시각이 nowMin+30 ~ nowMin+59 인 약속.
     30분마다 깨어나므로 한 약속은 <b>한 번만</b> 걸립니다(창이 겹치지 않음). */
  function soonPush(rows, today, nowMin) {
    today = today || kstYmd();
    var a = nowMin + SOON_MIN, b = a + 30;
    var L = (rows || []).filter(function (p) {
      if (!p || p.status === 'done' || ymdOf(p.due) !== today) return false;
      var n = hmOf(p.time); return n >= a && n < b;
    }).sort(function (x, y) { return hmOf(x.time) - hmOf(y.time); });
    if (!L.length) return null;
    var one = function (p) {
      return hhmm(hmOf(p.time)) + ' ' + (p.who ? maskName(p.who) + '님 ' : '') + maskText(String(p.text || ''), p.who ? [p.who] : []).slice(0, 30);
    };
    if (L.length === 1) return { title: '⏰ ' + one(L[0]), body: '30분쯤 뒤예요 · 끝나면 앱에서 ✓ 했어요', go: '/app/index.html', tag: TAG_SOON, n: 1 };
    return { title: '⏰ 곧 약속 ' + L.length + '건', body: L.map(one).join('\n'), go: '/app/index.html', tag: TAG_SOON, n: L.length };
  }

  var API = {
    STALE_DAYS: STALE_DAYS, PUSH_H: PUSH_H, LIST_MAX: LIST_MAX, PEOPLE_MAX: PEOPLE_MAX, TAG: TAG, LABEL: LABEL,
    kstYmd: kstYmd, ymdOf: ymdOf, state: state, missed: missed, sort: sort, count: count,
    maskName: maskName, maskPhone: maskPhone, maskText: maskText,
    lineOf: lineOf, byMember: byMember, pushFor: pushFor,
    MEM_H: MEM_H, SOON_MIN: SOON_MIN, ME_MAX: ME_MAX, TAG_ME: TAG_ME, TAG_SOON: TAG_SOON,
    hmOf: hmOf, mustToday: mustToday, memberPush: memberPush, soonPush: soonPush
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;   /* 서버 */
  root.MPR = API;                                                             /* 앱 */
})(typeof globalThis !== 'undefined' ? globalThis : this);
