/* ══════════════════════════════════════════════════════════════════
   고객 한 장 (cusone) — <b>두 화면이 같은 카드를 세운다</b>

   한 사람이 지금 네 곳에 나뉘어 있습니다.
     ① dbs           배정·단계·지역·약속·계약보험료·증권번호   (팀이 함께 본다)
     ② calls         통화 기록                                (①에 매달림)
     ③ clients       마스킹 이름·연락처·소득·생활비·문서       (담당자만)
     ④ saved_reports 가족·접촉기록·팩트파인딩·생일(JSON)        (③에 매달림)
   화면도 둘입니다 — 고객 365일(app/index.html)과 DB 통합 CRM(db-crm.html).

   그래서 <b>상담 직전에 양쪽을 다 열어 봐야</b> 했습니다. 이 파일은 그
   카드를 한 벌만 두는 자리입니다. 표는 한 칸도 고치지 않습니다 —
   <b>이미 있는 값을 한 장에 모아 보여줄 뿐</b>입니다.

   ■ 여기에는 서버를 부르는 코드가 없습니다. 자료를 모으는 일은 부르는
     화면이 하고, 이 파일은 <b>받은 것을 그리기만</b> 합니다. 그래야 두
     화면이 같은 그림을 냅니다.

   ■ 모르는 것은 <b>「모름」</b>이라고 적습니다. 0 으로 적으면 「없다」는
     뜻이 되어 버립니다 (CLAUDE.md 1번).

   ■ 이름은 <b>마스킹이 기본</b>입니다. 실명은 그 기기에 적어 둔 것이
     있을 때만 부르는 쪽이 넣어 줍니다 (CLAUDE.md 3번 · 계획서 규칙 ③).

   ES5 로 씁니다 — app/index.html 이 ES5 라서입니다.
   ══════════════════════════════════════════════════════════════════ */
(function (w) {
  'use strict';

  /* ── 글자 ────────────────────────────────────────────────── */
  function cusEsc(s) {
    return ('' + (s == null ? '' : s))
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── 초성 — <b>표를 한 벌만 둔다</b> ──────────────────────────
     전에는 app/index.html 의 CM_CHO 와 db-crm.html 의 DB_CHO 가 따로
     있었습니다. 같은 표가 두 곳에 있으면 한쪽만 고쳐집니다 (5번). */
  var CUS_CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  function cusCho(s) {
    var o = '', i, c;
    s = '' + (s == null ? '' : s);
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      if (c >= 0xAC00 && c <= 0xD7A3) o += CUS_CHO[Math.floor((c - 0xAC00) / 588)];
      else o += s.charAt(i);
    }
    return o;
  }
  function cusOnlyCho(s) {
    var i;
    s = '' + (s == null ? '' : s);
    if (!s) return false;
    for (i = 0; i < s.length; i++) if (CUS_CHO.indexOf(s.charAt(i)) < 0) return false;
    return true;
  }

  /* ── 이름 가리기 — 김철수 → 김*수 ────────────────────────────
     고객 365일(osMaskName)과 CRM(crmMask)이 각자 갖고 있던 것을
     여기 한 벌로 모읍니다. 두 곳이 다르게 가리면 같은 사람이 다른
     사람으로 보입니다. */
  function cusMask(name) {
    var t = ('' + (name == null ? '' : name)).replace(/^\s+|\s+$/g, ''), mid = '', i;
    if (t.length <= 1) return t;
    if (t.length === 2) return t.charAt(0) + '*';
    for (i = 1; i < t.length - 1; i++) mid += '*';
    return t.charAt(0) + mid + t.charAt(t.length - 1);
  }

  /* ── 숫자 ────────────────────────────────────────────────────
     cusWon 은 <b>만원</b>을 받습니다 (CLAUDE.md 4번의 이름 규약).
     모르면 null 을 주십시오 — 0 과 다릅니다. */
  function cusWon(man) {
    if (man == null || man === '') return null;
    var n = Math.round(+man);
    if (isNaN(n)) return null;
    if (Math.abs(n) >= 10000) {
      var uk = Math.floor(Math.abs(n) / 10000), rest = Math.abs(n) % 10000;
      return (n < 0 ? '-' : '') + uk + '억' + (rest ? (' ' + rest.toLocaleString() + '만원') : '원');
    }
    return n.toLocaleString() + '만원';
  }
  /* cusWonR 은 <b>원</b>을 받습니다. dbs.contract_premium 이 원이라서입니다 —
     이름이 단위를 말하지 않으면 만 배가 틀립니다(CLAUDE.md 4번).
     읽기는 만원·억으로 바꿔 적습니다. 「500,000원」보다 「50만원」이 빠릅니다. */
  function cusWonR(won) {
    if (won == null || won === '') return null;
    var n = Math.round(+won);
    if (isNaN(n)) return null;
    if (n === 0) return '0원';
    if (Math.abs(n) < 10000) return n.toLocaleString() + '원';
    var man = Math.round(n / 10000);
    return cusWon(man);            /* 원단위OK — 만원으로 바꿔 넘긴다 */
  }
  function cusDate(v) {
    if (!v) return '';
    var s = '' + v;
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10).replace(/-/g, '.');
    var d = new Date(s);
    if (isNaN(d)) return s;
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate());
  }
  function cusDays(v) {
    if (!v) return null;
    var d = new Date(('' + v).slice(0, 10) + 'T00:00:00Z');
    if (isNaN(d)) return null;
    var t = new Date(new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10) + 'T00:00:00Z');
    return Math.round((t - d) / 86400000);
  }

  /* 값이 없으면 <b>「모름」</b>. 「-」 로 적으면 없는 것처럼 읽힙니다.

     away 를 주면 「모름」 대신 그 말을 적습니다. <b>모르는 것과 여기서
     안 보는 것은 다릅니다</b> — DB 통합 CRM 은 소득·생활비를 아예 읽지
     않습니다. 그것을 「모름」이라고 적으면 고객 365일에 적어 둔 값까지
     없는 것처럼 보입니다(1번). */
  function cusVal(v, away) {
    if (v == null || v === '') return '<span class="cus-unk">' + (away ? cusEsc(away) : '모름') + '</span>';
    return cusEsc(v);
  }

  /* ── 연락기록을 <b>한 줄기</b>로 ──────────────────────────────
     통화(calls, DB 통합 CRM)와 접촉(saved_reports.touch, 고객 365일)이
     따로 쌓여 있습니다. 「몇 번 연락했나」를 두 곳에서 세면 타율이
     갈립니다. 그래서 <b>섞는 일은 이 함수 하나에서만</b> 합니다
     (계획서 규칙 ④).

     calls : [{call_at,result,memo,appointment_at}]
     touch : [{at,how,note}]
     돌려주는 줄 : {at:'2026-09-01', kind:'상담', note:'', src:'call'|'touch'} */
  function cusLog(calls, touch) {
    var out = [], i, x, at;
    calls = calls || []; touch = touch || [];
    for (i = 0; i < calls.length; i++) {
      x = calls[i] || {};
      at = ('' + (x.call_at || '')).slice(0, 10);
      if (!at) continue;
      out.push({
        at: at, kind: x.result || '통화', src: 'call',
        note: (x.memo || '') + (x.appointment_at ? (' · 약속 ' + ('' + x.appointment_at).slice(0, 10)) : '')
      });
    }
    for (i = 0; i < touch.length; i++) {
      x = touch[i] || {};
      at = ('' + (x.at || '')).slice(0, 10);
      if (!at) continue;
      out.push({ at: at, kind: x.how || '접촉', src: 'touch', note: x.note || '' });
    }
    out.sort(function (a, b) { return a.at < b.at ? 1 : (a.at > b.at ? -1 : 0); });
    return out;
  }

  /* ── 칸 모양 — <b>쓰는 화면에서 저마다 부른다</b> (5번) ─────── */
  var CUS_CSS = [
    '.cus-card{border:1px solid #E5E9F0;border-radius:14px;background:#fff;overflow:hidden;margin-bottom:16px}',
    '.cus-hd{padding:14px 16px;background:linear-gradient(180deg,#F8FAFF,#fff);border-bottom:1px solid #EEF2F7}',
    '.cus-nm{font-size:19px;font-weight:800;color:#0F172A;display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.cus-tag{font-size:10.5px;font-weight:800;padding:2px 7px;border-radius:999px;background:#EEF2FF;color:#3730A3}',
    '.cus-tag.real{background:#FEF3C7;color:#92400E}',
    '.cus-sub{font-size:11.5px;color:#64748B;margin-top:4px}',
    '.cus-body{padding:4px 16px 14px}',
    '.cus-sec{border-top:1px dashed #E9EDF5;padding:12px 0 4px}',
    '.cus-sec:first-child{border-top:0}',
    '.cus-st{font-size:11px;font-weight:800;color:#94A3B8;letter-spacing:.02em;margin-bottom:7px}',
    '.cus-kv{display:flex;flex-wrap:wrap;gap:7px}',
    '.cus-k{flex:1 1 150px;min-width:130px;border:1px solid #EEF2F7;border-radius:9px;padding:7px 10px;background:#FCFDFF}',
    '.cus-k b{display:block;font-size:10.5px;font-weight:800;color:#94A3B8;margin-bottom:2px}',
    '.cus-k span{font-size:13px;font-weight:700;color:#0F172A;word-break:break-all}',
    '.cus-unk{color:#B45309;font-weight:700;font-size:12px}',
    '.cus-none{font-size:12px;color:#94A3B8;padding:6px 0}',
    '.cus-note{font-size:11px;color:#64748B;background:#F8FAFC;border:1px solid #EEF2F7;border-radius:8px;padding:7px 9px;margin-top:8px;line-height:1.6}',
    '.cus-tl{display:flex;flex-direction:column;gap:5px}',
    '.cus-ti{display:flex;gap:7px;align-items:flex-start;font-size:12px;padding:5px 7px;border-radius:8px;background:#FBFCFE;border:1px solid #F1F5F9}',
    '.cus-ti .d{color:#94A3B8;font-weight:700;white-space:nowrap;font-size:11px;padding-top:1px}',
    '.cus-ti .r{color:#fff;font-weight:800;font-size:10.5px;padding:1px 6px;border-radius:999px;white-space:nowrap}',
    '.cus-ti .n{color:#334155;line-height:1.5;flex:1}',
    '.cus-ti .s{font-size:10px;color:#B0BAC9;white-space:nowrap}',
    '.cus-fam{display:flex;flex-wrap:wrap;gap:6px}',
    '.cus-fchip{border:1px solid #E5E9F0;background:#fff;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;color:#0F172A;cursor:pointer}',
    '.cus-fchip em{font-style:normal;color:#64748B;font-weight:600;margin-left:5px;font-size:11px}',
    '.cus-frow{display:flex;gap:6px;align-items:center;font-size:12.5px;padding:5px 8px;border:1px solid #F1F5F9;border-radius:8px;background:#FBFCFE}',
    '.cus-frow .rel{font-weight:800;color:#3730A3;min-width:44px}',
    '@media print{.cus-card{break-inside:avoid}}'
  ].join('');
  function cusCss() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('cusOneCss')) return;
    var st = document.createElement('style');
    st.id = 'cusOneCss';
    st.textContent = CUS_CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  var TONE = { '상담': '#059669', '거절': '#DC2626', '부재': '#D97706' };

  /* ── 카드 한 장 ──────────────────────────────────────────────
     v 의 모양(없으면 null 을 주십시오 — 빈 문자열 말고 null):
       name, real(bool)   보여 줄 이름 / 그것이 실명인가
       tag                이름 옆 딱지. 안 주면 real 로 고른다 — 화면마다
                          사실이 다르다(CRM 의 이름은 팀이 함께 본다)
       phone, region, birth, gender, owner
       stage, nextAppt
       incomeMan, expenseMan          (만원)
       policy:{no,premiumWon,contractedAt,sentAt}   (premiumWon 은 <b>원</b>)
       fam:{key,rel,linked:[{id,name,rel}],members:[{rel,name,by,note}]}
       log:[…]  (cusLog 가 만든 것)
       docs:{n,reports}  또는 null  (CRM 에서는 안 보이므로 null)
       elsewhere          이 화면에서 <b>안 읽는</b> 값에 적을 말.
                          예) '고객 365일에 있습니다'. 「모름」과 다르다
       where:'app'|'crm'
       act:{fam:'함수이름(id)'}  버튼은 부르는 화면이 정합니다   */
  function cusCardHtml(v) {
    v = v || {};
    var h = '', i, r, L = v.log || [], fam = v.fam || {}, po = v.policy || {};
    var away = v.elsewhere || null;     /* 이 화면에서 안 읽는 값에 적을 말 */
    var d = v.nextAppt ? cusDays(v.nextAppt) : null;

    h += '<div class="cus-card"><div class="cus-hd">' +
      '<div class="cus-nm">' + cusEsc(v.name || '이름 없음') +
        '<span class="cus-tag' + (v.real ? ' real' : '') + '">' +
          cusEsc(v.tag || (v.real ? '실명 · 이 기기에만' : '서버에는 가린 이름')) + '</span>' +
        (v.stage ? '<span class="cus-tag">' + cusEsc(v.stage) + '</span>' : '') +
      '</div>' +
      '<div class="cus-sub">' +
        (v.owner ? ('담당 ' + cusEsc(v.owner) + ' · ') : '') +
        (v.nextAppt
          ? ('다음 약속 <b>' + cusDate(v.nextAppt) + '</b>' +
             (d === null ? '' : (d > 0 ? (' · ' + d + '일 지났습니다') : (d === 0 ? ' · 오늘입니다' : (' · ' + (-d) + '일 남았습니다')))))
          : '잡아 둔 약속이 없습니다') +
      '</div></div><div class="cus-body">';

    /* 사람 */
    h += '<div class="cus-sec"><div class="cus-st">사람</div><div class="cus-kv">' +
      '<div class="cus-k"><b>연락처</b><span>' + cusVal(v.phone) + '</span></div>' +
      '<div class="cus-k"><b>지역</b><span>' + cusVal(v.region) + '</span></div>' +
      '<div class="cus-k"><b>출생년도</b><span>' + cusVal(v.birth, away) + '</span></div>' +
      '<div class="cus-k"><b>성별</b><span>' + cusVal(v.gender === 'M' ? '남' : (v.gender === 'F' ? '여' : null), away) + '</span></div>' +
      '</div></div>';

    /* 가족 */
    h += '<div class="cus-sec"><div class="cus-st">가족</div>';
    if (fam.linked && fam.linked.length) {
      h += '<div class="cus-fam" style="margin-bottom:7px">';
      for (i = 0; i < fam.linked.length; i++) {
        r = fam.linked[i];
        h += '<button type="button" class="cus-fchip"' +
          (v.act && v.act.open ? (' onclick="' + v.act.open + '(\'' + cusEsc(r.id) + '\')"') : '') +
          '>' + cusEsc(r.name) + (r.rel ? ('<em>' + cusEsc(r.rel) + '</em>') : '') + '</button>';
      }
      h += '</div>';
    }
    if (fam.members && fam.members.length) {
      for (i = 0; i < fam.members.length; i++) {
        r = fam.members[i] || {};
        h += '<div class="cus-frow"><span class="rel">' + cusEsc(r.rel || '가족') + '</span>' +
          '<span>' + cusEsc(r.name || '') + '</span>' +
          (r.by ? ('<span style="color:#64748B">' + cusEsc(r.by) + '년생</span>') : '') +
          (r.note ? ('<span style="color:#94A3B8">' + cusEsc(r.note) + '</span>') : '') + '</div>';
      }
    } else if (!(fam.linked && fam.linked.length)) {
      h += '<div class="cus-none">아직 가족을 적지 않았습니다. 한 사람만 보면 보장은 늘 모자라 보입니다.</div>';
    }
    if (fam.key) h += '<div class="cus-note">가족 묶음 <b>' + cusEsc(fam.key) + '</b>' + (fam.rel ? (' · 이 사람의 자리 <b>' + cusEsc(fam.rel) + '</b>') : '') + '</div>';
    h += '</div>';

    /* 돈 */
    h += '<div class="cus-sec"><div class="cus-st">돈</div><div class="cus-kv">' +
      '<div class="cus-k"><b>월 소득</b><span>' + (cusWon(v.incomeMan) || cusVal(null, away)) + '</span></div>' +
      '<div class="cus-k"><b>월 생활비</b><span>' + (cusWon(v.expenseMan) || cusVal(null, away)) + '</span></div>' +
      '</div></div>';

    /* 계약 — <b>이미 서버에 있는데 화면에 안 보이던 값</b>입니다 */
    h += '<div class="cus-sec"><div class="cus-st">계약</div><div class="cus-kv">' +
      '<div class="cus-k"><b>증권번호</b><span>' + cusVal(po.no) + '</span></div>' +
      '<div class="cus-k"><b>계약 월납</b><span>' + (cusWonR(po.premiumWon) || cusVal(null)) + '</span></div>' +
      '<div class="cus-k"><b>계약일</b><span>' + cusVal(po.contractedAt ? cusDate(po.contractedAt) : null) + '</span></div>' +
      '<div class="cus-k"><b>증권 전달</b><span>' + cusVal(po.sentAt ? cusDate(po.sentAt) : null) + '</span></div>' +
      '</div>' +
      '<div class="cus-note">보험사 · 설계번호 · 납입수단 · 납입일 · 청약철회는 <b>아직 담는 자리가 없습니다.</b> ' +
      '빈 칸을 먼저 그려 두면 적으신 것이 어디에도 저장되지 않습니다 — 칸과 저장을 같이 세울 때 함께 엽니다.</div>' +
      '</div>';

    /* 연락기록 — 한 줄기 */
    h += '<div class="cus-sec"><div class="cus-st">연락기록 ' +
      (L.length ? ('<span style="color:#64748B">' + L.length + '건 · 통화와 접촉을 한 줄기로</span>') : '') + '</div>';
    if (!L.length) {
      h += '<div class="cus-none">아직 연락 기록이 없습니다. 통화 한 번, 카톡 한 번도 남겨 두면 다음에 무슨 말을 할지 알게 됩니다.</div>';
    } else {
      h += '<div class="cus-tl">';
      for (i = 0; i < L.length && i < 20; i++) {
        r = L[i];
        h += '<div class="cus-ti"><span class="d">' + cusEsc(cusDate(r.at)) + '</span>' +
          '<span class="r" style="background:' + (TONE[r.kind] || '#64748B') + '">' + cusEsc(r.kind) + '</span>' +
          '<span class="n">' + cusEsc(r.note || '메모 없음') + '</span>' +
          '<span class="s">' + (r.src === 'call' ? 'CRM 통화' : '접촉') + '</span></div>';
      }
      h += '</div>';
      if (L.length > 20) h += '<div class="cus-none">가장 최근 20건만 보여 줍니다.</div>';
    }
    h += '</div>';

    /* 문서 */
    h += '<div class="cus-sec"><div class="cus-st">문서 · 리포트</div>';
    if (v.docs) {
      h += '<div class="cus-kv">' +
        '<div class="cus-k"><b>올린 문서</b><span>' + cusVal(v.docs.n == null ? null : (v.docs.n + '건')) + '</span></div>' +
        '<div class="cus-k"><b>저장한 상담자료</b><span>' + cusVal(v.docs.reports == null ? null : (v.docs.reports + '건')) + '</span></div>' +
        '</div>';
    } else {
      h += '<div class="cus-none">증권·제안서와 저장한 상담자료는 <b>고객 365일</b>에서 봅니다.</div>';
    }
    h += '</div>';

    h += '</div></div>';
    return h;
  }

  w.cusEsc = cusEsc;
  w.cusCho = cusCho;
  w.cusOnlyCho = cusOnlyCho;
  w.cusMask = cusMask;
  w.cusWon = cusWon;
  w.cusWonR = cusWonR;
  w.CUS_CHO = CUS_CHO;
  w.cusDate = cusDate;
  w.cusDays = cusDays;
  w.cusLog = cusLog;
  w.cusCss = cusCss;
  w.cusCardHtml = cusCardHtml;
})(typeof window !== 'undefined' ? window : this);
