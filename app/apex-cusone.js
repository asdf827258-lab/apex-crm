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

  /* ── 찾기 — <b>견주는 규칙도 한 벌</b> ────────────────────────
     고객 365일(cmHit)과 DB 통합 CRM(dbHit)이 거의 같은 셈을 따로
     갖고 있었습니다. 한쪽만 고쳐지면 「고객 365일에서는 찾히는데
     CRM 에서는 안 찾힌다」가 됩니다.

       pool  견줄 글자들 (이름·지역·담당자·메모…)
       q     사람이 친 것
       phone 연락처. 숫자를 쳤으면 <b>뒷자리</b>로도 견준다.
             「010-2222-3456」 을 통째로 붙여 넣어도 걸리게 친 쪽의
             하이픈도 턴다 — 사장님이 실제로 그렇게 붙여 넣으십니다. */
  function cusHit(pool, q, phone) {
    if (!q) return true;
    q = ('' + q).replace(/\s/g, '');
    var i, v, lq = q.toLowerCase();
    if (cusOnlyCho(q)) {
      for (i = 0; i < pool.length; i++) if (pool[i] && cusCho(pool[i]).indexOf(q) >= 0) return true;
      return false;
    }
    for (i = 0; i < pool.length; i++) {
      if (pool[i] && ('' + pool[i]).replace(/\s/g, '').toLowerCase().indexOf(lq) >= 0) return true;
    }
    var num = q.replace(/[^0-9]/g, '');
    if (num.length >= 2 && !/[^0-9\-]/.test(q) && phone) {
      v = ('' + phone).replace(/\D/g, '');
      if (v && v.indexOf(num) >= 0) return true;
    }
    return false;
  }

  /* ── 이름 가리기 — 홍길동 → 홍*동 ────────────────────────────
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
    /* <b>반올림하지 않는다.</b> 187,000원을 「19만원」으로 적으면 그 자리에서
       틀린 숫자다. 억·만·원을 그대로 끊어 적는다 — 「18만 7,000원」. */
    var neg = n < 0, a = Math.abs(n), out = [];
    var eok = Math.floor(a / 100000000);
    var man = Math.floor((a % 100000000) / 10000);
    var won1 = a % 10000;
    if (eok) out.push(eok.toLocaleString() + '억');
    if (man) out.push(man.toLocaleString() + '만');
    if (won1) out.push(won1.toLocaleString() + '원');
    else if (out.length) out[out.length - 1] += '원';   /* 15만 → 15만원 */
    return (neg ? '-' : '') + out.join(' ');
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
    '.cus-nm{font-size:var(--t2,20px);font-weight:800;color:#0F172A;display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.cus-tag{font-size:var(--t6,13px);font-weight:800;padding:2px 7px;border-radius:999px;background:#EEF2FF;color:#3730A3}',
    '.cus-tag.real{background:#FEF3C7;color:#92400E}',
    '.cus-sub{font-size:var(--t6,13px);color:#64748B;margin-top:4px}',
    '.cus-body{padding:4px 16px 14px}',
    '.cus-sec{border-top:1px dashed #E9EDF5;padding:12px 0 4px}',
    '.cus-sec:first-child{border-top:0}',
    '.cus-st{font-size:var(--t6,13px);font-weight:800;color:#94A3B8;letter-spacing:.02em;margin-bottom:7px}',
    '.cus-kv{display:flex;flex-wrap:wrap;gap:7px}',
    '.cus-k{flex:1 1 150px;min-width:130px;border:1px solid #EEF2F7;border-radius:9px;padding:7px 10px;background:#FCFDFF}',
    '.cus-k b{display:block;font-size:var(--t6,13px);font-weight:800;color:#94A3B8;margin-bottom:2px}',
    '.cus-k span{font-size:var(--t6,13px);font-weight:700;color:#0F172A;word-break:break-all}',
    '.cus-unk{color:#B45309;font-weight:700;font-size:var(--t6,13px)}',
    '.cus-none{font-size:var(--t6,13px);color:#94A3B8;padding:6px 0}',
    '.cus-note{font-size:var(--t6,13px);color:#64748B;background:#F8FAFC;border:1px solid #EEF2F7;border-radius:8px;padding:7px 9px;margin-top:8px;line-height:1.6}',
    '.cus-tl{display:flex;flex-direction:column;gap:5px}',
    '.cus-ti{display:flex;gap:7px;align-items:flex-start;font-size:var(--t6,13px);padding:5px 7px;border-radius:8px;background:#FBFCFE;border:1px solid #F1F5F9}',
    '.cus-ti .d{color:#94A3B8;font-weight:700;white-space:nowrap;font-size:var(--t6,13px);padding-top:1px}',
    '.cus-ti .r{color:#fff;font-weight:800;font-size:var(--t6,13px);padding:1px 6px;border-radius:999px;white-space:nowrap}',
    '.cus-ti .n{color:#334155;line-height:1.5;flex:1}',
    '.cus-ti .s{font-size:var(--t6,13px);color:#B0BAC9;white-space:nowrap}',
    '.cus-fam{display:flex;flex-wrap:wrap;gap:6px}',
    '.cus-fchip{border:1px solid #E5E9F0;background:#fff;border-radius:999px;padding:4px 10px;font-size:var(--t6,13px);font-weight:700;color:#0F172A;cursor:pointer}',
    '.cus-fchip em{font-style:normal;color:#64748B;font-weight:600;margin-left:5px;font-size:var(--t6,13px)}',
    '.cus-frow{display:flex;gap:6px;align-items:center;font-size:var(--t6,13px);padding:5px 8px;border:1px solid #F1F5F9;border-radius:8px;background:#FBFCFE}',
    '.cus-frow .rel{font-weight:800;color:#3730A3;min-width:44px}',
    /* 📒 상황별 터치 (cusTouchHtml) — 두 화면이 같은 옷 · 판 X183 */
    '.cus-tc{margin-top:4px}',
    '.cus-tc-hd{font-size:var(--t6,13px);color:#64748B;line-height:1.6;margin:0 0 8px}',
    '.cus-tc-s{border:1px solid #E5E9F0;border-radius:12px;background:#fff;margin-top:8px;overflow:hidden}',
    '.cus-tc-s>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px;min-height:46px;padding:8px 12px;font-size:14.5px}',
    '.cus-tc-s>summary::-webkit-details-marker{display:none}',
    '.cus-tc-s>summary .no{flex:0 0 22px;height:22px;border-radius:50%;background:#EEF2FF;color:#3730A3;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center}',
    '.cus-tc-s>summary b{flex:1;color:#0F172A}',
    '.cus-tc-s>summary em{font-style:normal;font-size:13px;font-weight:700;color:#64748B;background:#F1F5F9;border-radius:999px;padding:2px 8px;white-space:nowrap}',
    '.cus-tc-s[open]>summary{border-bottom:1px solid #EEF2F7;background:#FBFCFE}',
    '.cus-tc-b{padding:6px 12px 12px}',
    '.cus-tc-k{display:flex;gap:10px;padding:6px 0;font-size:13.5px;line-height:1.6;color:#334155}',
    '.cus-tc-k>b{flex:0 0 52px;color:#94A3B8;font-size:13px;font-weight:800;padding-top:2px}',
    '.cus-tc-st{font-size:13px;font-weight:800;color:#94A3B8;margin:12px 0 0}',
    '.cus-tc .t-script{margin-top:8px;padding:12px 14px}',
    '.cus-tc-tx{font-size:13.5px;line-height:1.7;color:#0F172A;white-space:pre-line;margin-top:4px}',
    '.cus-tc-bt{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;align-items:center}',
    '.cus-tc-bt button,.cus-tc-bt a{min-height:40px;padding:0 12px;border-radius:10px;border:1px solid #E5E9F0;background:#fff;font-size:13px;font-weight:700;color:#0F172A;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}',
    '.cus-tc-bt .go{background:#3182F6;border-color:#3182F6;color:#fff}',
    '.cus-tc-bt span{font-size:13px;color:#64748B}',
    '.cus-tc-no{font-size:13px;color:#B45309;background:#FFFBEB;border-radius:9px;padding:8px 10px;margin-top:10px;line-height:1.6}',
    '.cus-tc-nx{font-size:13px;color:#334155;background:#F8FAFC;border-radius:9px;padding:8px 10px;margin-top:6px;line-height:1.6}',
    '.cus-tc-tip{font-size:13px;color:#64748B;line-height:1.6;padding:0 0 6px 62px}',
    '.cus-tc-rp{border:1px solid #EEF2F7;border-radius:10px;padding:9px 11px;margin-top:6px;background:#fff}',
    '.cus-tc-rp .q{font-size:13.5px;font-weight:800;color:#3730A3}',
    '.cus-tc-rp .a{font-size:13.5px;line-height:1.7;color:#0F172A;margin-top:3px}',
    '.cus-tc-bt button:disabled{opacity:.45;cursor:default}',
    '.cus-tc-tabs{display:flex;gap:6px;margin:12px 0 2px;overflow-x:auto}',
    '.cus-tc-tabs button{flex:1 0 auto;min-height:42px;padding:0 12px;border-radius:10px;border:1px solid #E5E9F0;background:#F8FAFC;font-size:13.5px;font-weight:800;color:#64748B;cursor:pointer;white-space:nowrap}',
    '.cus-tc-tabs button.on{background:#EEF2FF;border-color:#C7D2FE;color:#3730A3}',
    '.cus-tc-pane{display:none}',
    '.cus-tc-pane.on{display:block}',
    '.cus-ap-in{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}',
    '.cus-ap-in label{display:flex;flex-direction:column;gap:3px;font-size:13px;font-weight:800;color:#64748B;flex:1 1 130px}',
    '.cus-ap-in label.pl{flex:1 1 100%}',
    '.cus-ap-in input{min-height:44px;border:1px solid #E5E9F0;border-radius:10px;padding:0 10px;font-size:15px;color:#0F172A;background:#fff;font-family:inherit}',
    '.cus-ap-cs{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}',
    '.cus-ap-c{min-height:40px;padding:0 12px;border-radius:999px;border:1px solid #E5E9F0;background:#fff;font-size:13px;font-weight:700;color:#334155;cursor:pointer}',
    '.cus-ap-c.on{background:#0F172A;border-color:#0F172A;color:#fff}',
    '@media print{.cus-tc-bt,.cus-ap-in,.cus-ap-cs,.cus-tc-tabs{display:none}.cus-tc-pane{display:block}.cus-tc-s{break-inside:avoid}}',
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
  /* 연락기록 한 줄기 — 통화와 접촉을 섞어 날짜순. 카드 안에서도, 따로도 같은 그림 */
  function cusLogHtml(L, t) {
    var h = '', i, r;
    L = L || [];
    t = t || {};
    h += '<div class="cus-sec"><div class="cus-st">' + cusEsc(t.title || '연락기록') + ' ' +
      (L.length ? ('<span style="color:#64748B">' + L.length + '건' + (t.title ? '' : ' · 통화와 접촉을 한 줄기로') + '</span>') : '') + '</div>';
    if (!L.length) {
      h += '<div class="cus-none">' + cusEsc(t.none || '아직 연락 기록이 없습니다. 통화 한 번, 카톡 한 번도 남겨 두면 다음에 무슨 말을 할지 알게 됩니다.') + '</div>';
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
    return h;
  }
  /* 🔎 한눈에 — 위 ★ 참고. 값이 하나도 없으면 <b>칸을 안 세웁니다</b> */
  function cusGlanceHtml(v, L) {
    var h = '', i, x, met = 0, low = 0, seen = 0;
    /* 만난 횟수 — <b>연락기록 한 줄기에서</b> 셉니다 (5번). 여기서 또
       기록을 만들지 않습니다. 기록이 없으면 0 이 아니라 <b>모름</b>입니다. */
    for (i = 0; i < (L || []).length; i++) if (/만남|미팅|방문/.test(L[i].kind || '')) met++;
    /* 2026-09-27 · 사장님 말씀 「만기! 청구 이력은 입력하게 만들고」 —
       담을 자리가 생겼으니 목각의 그 둘이 이제 섭니다. <b>적힌 것만</b>
       섭니다: 안 적으셨으면 null 이라 안 그립니다 (1번).                */
    var hasBig = (v.polN != null) || (v.policy && v.policy.premiumWon != null) || (v.due != null);
    /* v.noHead — 앱의 고객 창은 단계를 머리 <b>딱지 하나</b>로 세웁니다. 여기 또 적으면 한 화면에 두 번 섭니다
       (2026-10-23 화면 점검에서 찾음 · 「중복 되는 부분들을 하나로」). CRM 카드는 머리가 이 카드라 그대로 둡니다. */
    var rows = [['사는 곳', v.region], ['어디서 왔나', v.src],
                ['지금 단계', v.stage], ['만난 횟수', (L && L.length) ? (met + '회') : null],
                ['청구', v.clm ? (v.clm.n + '건'
                   + (v.clm.wonR > 0 ? (' · ' + cusWonR(v.clm.wonR)) : '')) : null]];
    if (v.noHead) rows = rows.filter(function (r) { return r[0] !== '지금 단계'; });
    var hasRow = rows.some(function (r) { return r[1] != null && r[1] !== ''; });
    if (!hasBig && !hasRow && !v.wal) return '';
    h += '<div class="t-card" style="margin-bottom:14px">' +
         '<div class="t-lab">🔎 한눈에</div>';
    /* 큰 수 — <b>있는 것만</b> 세웁니다 */
    if (hasBig) {
      h += '<div class="t-row2" style="margin-top:10px">';
      if (v.polN != null)
        h += '<div style="flex:1"><div class="t-num">' + v.polN + '<span>건</span></div>' +
             '<div class="t-lab">보유 계약</div></div>';
      if (v.policy && v.policy.premiumWon != null)
        h += '<div style="flex:1"><div class="t-num">' +
             cusEsc(cusWonR(v.policy.premiumWon) || '—') + '</div>' +
             '<div class="t-lab">월 보험료</div></div>';
      /* ★ 만기는 <b>해</b>만 큰 수로 세우고 달·날은 작게 붙입니다 —
         온 날짜를 44px 로 세우면 폰에서 셋째 칸이 옆으로 삐져나갑니다.
         ★ 「D-30」 이라고 적지 않습니다 (사장님 말씀) — 며칠 남았는지는
           보는 날마다 달라지므로, 보여 주는 것도 <b>날짜</b>입니다.      */
      if (v.due != null) {
        var d4 = String(v.due).replace(/[^0-9]/g, '');
        h += '<div style="flex:1"><div class="t-num">' + cusEsc(d4.slice(0, 4)) +
             (d4.length >= 6 ? ('<span>.' + cusEsc(d4.slice(4, 6)) + '</span>') : '') + '</div>' +
             '<div class="t-lab">만기</div></div>';
      }
      h += '</div>';
    }
    /* 네 줄 — 빈 것은 <b>「아직」</b> 이라고 적습니다. 빈칸으로 두면
       안 적은 것인지 없는 것인지 알 수 없습니다 (1번). */
    if (hasRow) {
      for (i = 0; i < rows.length; i++) {
        x = rows[i];
        h += '<div class="t-row"><span class="m"><b>' + cusEsc(x[0]) + '</b></span>' +
             '<span class="r">' + (x[1] == null || x[1] === ''
               ? '<span class="t-tag">아직</span>'
               : ('<b>' + cusEsc(x[1]) + '</b>')) + '</span></div>';
      }
    }
    /* 8통장 — <b>이름도 등급도 앱이 압니다</b>(waShort · cmWalOf). 여기서
       또 적으면 지도와 갈립니다 (5번). 진단을 안 붙였으면 안 세웁니다. */
    if (v.wal) {
      for (i = 0; i < v.wal.length; i++) {
        if (v.wal[i].lv === 'low') low++;
        if (v.wal[i].lv) seen++;
      }
      h += '<div class="t-sub">8통장 진단 — ' + (seen
        ? ('비어 있는 통장 <b>' + low + '개</b>')
        : '아직 등급을 안 매겼습니다') + '</div><div class="t-chips">';
      for (i = 0; i < v.wal.length; i++) {
        x = v.wal[i];
        h += '<span class="t-chip">' + cusEsc(x.n) + '\u00a0' +
             (x.lv === 'ok' ? '✓' : (x.lv === 'low' ? '✗' : (x.lv === 'mid' ? '△' : '—'))) +
             '</span>';
      }
      h += '</div>';
    }
    h += '</div>';
    return h;
  }
  /* ★ v.only (판 X161 · 사장님 말씀 2026-10-23 「고객창에서 중복된 부분 줄이고」)
       'glance' — 머리 + 🔎 한눈에 만. 앱의 고객 창은 사람·가족·돈·계약·문서를
                  <b>제 탭</b>에서 고치므로, 한눈에 탭에 같은 칸을 또 세우면 겹칩니다.
       'log'    — 연락기록 한 줄기만 (연락 탭). v.logT 로 제목·빈 글을 바꿉니다.
       없으면  — 지금처럼 전부 (DB 통합 CRM 은 이 한 장이 전부라 그대로입니다). */
  function cusCardHtml(v) {
    v = v || {};
    if (v.only === 'log') return '<div class="cus-card"><div class="cus-body">' + cusLogHtml(v.log, v.logT) + '</div></div>';
    var h = '', i, r, L = v.log || [], fam = v.fam || {}, po = v.policy || {};
    var away = v.elsewhere || null;     /* 이 화면에서 안 읽는 값에 적을 말 */
    var d = v.nextAppt ? cusDays(v.nextAppt) : null;

    /* v.noHead — 고객 창 새 판은 머리(이름·담당·약속)를 창 맨 위에 한 번만 세웁니다.
       같은 말을 카드 머리에 또 적으면 한 화면에 두 번 섭니다 (2026-10-23 「중복 되는 부분들을 하나로」). */
    if (v.noHead) h += '<div class="cus-card"><div class="cus-body">';
    else h += '<div class="cus-card"><div class="cus-hd">' +
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

    /* ══ 🔎 <b>한눈에</b> — 목각 사진 2 의 머리 ═══════════════════════
       사장님 말씀 (2026-09-27 · 목각 사진 2) — 「이렇게 <b>깔끔하게</b>
       정리하게 하고」. 큰 수 · 네 줄 · 8통장을 맨 위에 한 번에 보여 줍니다.
       ★ <b>아래 칸들은 그대로</b>입니다 (6번) — 사람·가족·돈·계약·
         연락기록·문서. 감추면 고칠 길이 사라집니다.
       ★ <b>새 CSS 를 한 줄도 안 만들었습니다</b> — ui.css 의 t-card ·
         t-num · t-lab · t-row2 · t-row · t-chips · t-chip · t-sub 만
         씁니다 (사장님 계약 「새 CSS 를 쓰지 마십시오」).
       ★ <b>모르는 것은 안 세웁니다</b> (1번). 목각의 「D-30 만기」 와
         「실비 청구 없음」 은 <b>앱에 담는 자리가 없어</b> 안 그립니다 —
         빈 칸을 그려 두면 적으신 것이 어디에도 저장되지 않습니다.      */
    h += cusGlanceHtml(v, L);
    if (v.only === 'glance') return h + '</div></div>';

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

    /* 연락기록 — 한 줄기 (그리는 자리는 cusLogHtml 하나 · 5번) */
    h += cusLogHtml(L);

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

  /* ══ 📒 <b>상황별 터치</b> — TA → CS · 판 X183 ════════════════════════
     사장님 말씀 (2026-10-24) — 「ta-cs 까지 어떤 상황과 어떻게 터치해야할지 · 문자/카톡 예시 2~3 ·
     전화까지 · dB통합CRM 에 있는 고객 상황과 안겹치고 똑같은 화면을 띄우도록」 → 「대본이 너무 허접 ·
     태도가 엉망 · 더 길게」 · 「약속이 잡히면 약속 안내 문자까지 바로 · 골라서」.

     ★ 글은 apex-stage.js 의 TOUCH · APPT <b>한 곳</b>에 있고, 그리는 것도 <b>여기 한 벌</b>입니다 (5번).
       고객 창(연락 탭 · cmSayHtml)과 DB 통합 CRM(「무엇을 할까」 · sgAskHtml)이 이것을 부릅니다 —
       같은 단계 · 같은 종류 · 같은 약속이면 <b>같은 글</b>이 섭니다.
     ★ 이 함수는 서버를 안 부릅니다. 받은 것(o)을 그리기만 합니다.
       o = { stage, src(어디서 오신 분 · dbs.source), age(나이대 · 모르면 안 줌),
             phone(없으면 문자·전화 단추가 안 섭니다),
             me({name,title,org,phone} — cusMeOf 가 「내 소개」 에서 읽어 줍니다 · 글자 하나만 주면 이름),
             appt(읽은 약속 · 모르면 빈 글), key(보낸 뒤 cusTouchDone 에 넘길 번호) }
     ★ TA 의 첫 상황에는 <b>어디서 오신 분인가</b>에 맞춘 첫 마디(APEX_STAGE.script)를 따로 세웁니다.
       못 알아본 종류면 안 세웁니다 (지어내지 않습니다 · 1번).
     ★ 표에 없는 단계면 <b>빈 글</b>을 돌려줍니다 — 부르는 쪽이 아무것도 안 세웁니다. */
  /* 보내는 사람 — 「내 소개」(설정)를 읽습니다. 앱의 advGet 과 <b>같은 칸</b>(apex_intro_아이디)입니다.
     두 화면이 같은 칸을 읽어야 같은 서명이 나갑니다. 비면 지어 넣지 않습니다 (1번). */
  function cusMeOf(uid, name) {
    var o = {};
    try { o = JSON.parse(localStorage.getItem('apex_intro_' + (uid || 'guest')) || 'null') || {}; } catch (e) { o = {}; }
    return { name: ('' + (o.name || name || '')).trim(), title: ('' + (o.title || '')).trim(),
             org: ('' + (o.org || '')).trim(), phone: ('' + (o.phone || '')).trim() };
  }
  function cusMeNorm(me) {
    if (me == null) me = {};
    if (typeof me === 'string') me = { name: me };
    var n = ('' + (me.name || '')).trim(), ti = ('' + (me.title || '')).trim(), org = ('' + (me.org || '')).trim();
    var nt = (n + (n && ti ? ' ' + ti : '')).trim();
    return {
      name: n, title: ti, org: org, phone: ('' + (me.phone || '')).trim(),
      intro: org ? (org + ' ' + (nt || '담당 설계사')) : (nt ? ('담당 설계사 ' + nt) : '담당 설계사'),
      short: nt || '담당 설계사',
      /* 서명은 구분선 아래 두 줄 — 문자에서 「누가 보냈나」 가 한눈에 갈립니다 */
      sign: '────────\n' + (org ? org + '\n' : '') + (nt || '담당 설계사') + ' 드림'
    };
  }
  function cusFill(t, M, X) {
    var s = '' + (t == null ? '' : t), k;
    s = s.split('{나}').join(M.intro).split('{이름}').join(M.short).split('{서명}').join(M.sign);
    if (X) for (k in X) if (X.hasOwnProperty(k)) s = s.split('{' + k + '}').join(X[k]);
    return s;
  }
  /* 읽은 약속 → 날짜 · 시각 (한국 시각). 시간대가 붙은 값은 바꾸고, 안 붙은 값은 <b>적힌 그대로</b> */
  function cusApptParts(a) {
    var s = ('' + (a || '')).trim(), m, d;
    if (!s) return { d: '', t: '' };
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return { d: s, t: '' };
    if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(s)) {
      d = new Date(s);
      if (isNaN(d.getTime())) return { d: '', t: '' };
      d = new Date(d.getTime() + 9 * 3600000);
      return { d: d.toISOString().slice(0, 10), t: d.toISOString().slice(11, 16) };
    }
    m = s.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
    return m ? { d: m[1], t: m[2] } : { d: '', t: '' };
  }
  var CUS_WD = ['일', '월', '화', '수', '목', '금', '토'];
  function cusApptDay(d) {
    var m = ('' + (d || '')).match(/^(\d{4})-(\d{2})-(\d{2})$/), dt;
    if (!m) return '';
    dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return (+m[2]) + '월 ' + (+m[3]) + '일 (' + CUS_WD[dt.getUTCDay()] + ')';
  }
  function cusApptTime(t) {
    var m = ('' + (t || '')).match(/^(\d{1,2}):(\d{2})/), h, mi;
    if (!m) return '';
    h = +m[1]; mi = +m[2];
    return (h < 12 ? '오전 ' : '오후 ') + (h % 12 === 0 ? 12 : h % 12) + '시' + (mi ? ' ' + mi + '분' : '');
  }
  /* 약속 안내 글 하나 — 날짜·시간이 없으면 그 자리를 비워 두고 <b>못 보낸다</b>고 말합니다 */
  function cusApptText(stage, i, me, d, t, place) {
    var S = w.APEX_STAGE, L = (S && S.apptOf) ? S.apptOf(stage) : [], A = L[i] || L[0], M = cusMeNorm(me),
        day = cusApptDay(d), tm = cusApptTime(t), ok = !!(day && tm), pl = ('' + (place || '')).trim(), sl = [];
    if (!A) return { text: '', ok: false };
    if (M.org) sl.push('🏢 소속 : ' + M.org);
    sl.push('👤 이름 : ' + M.short);
    if (M.phone) sl.push('📱 연락처 : ' + M.phone);
    return { ok: ok, text: cusFill(A.text, M, {
      '일시': ok ? (day + ' ' + tm) : '【날짜·시간을 넣어 주세요】',
      '시각': tm || '【시간을 넣어 주세요】',
      '장소': pl || '정해지는 대로 다시 알려 드리겠습니다',
      '장소에서': pl ? (pl + '에서 ') : '',
      '자리': (S.apptWhat && S.apptWhat[stage]) || '상담',
      '소개줄': sl.join('\n')
    }) };
  }
  function cusTouchHtml(o) {
    o = o || {};
    var S = w.APEX_STAGE, L, AL, i, j, x, m, c, h = '', M, ph, first = null, gen = null, P, st, A0, apOpen;
    if (!S || typeof S.touchOf !== 'function') return '';
    st = String(o.stage == null ? '' : o.stage);
    L = S.touchOf(st);
    if (!L.length) return '';
    M = cusMeNorm(o.me);
    ph = ('' + (o.phone || '')).replace(/[^0-9+]/g, '');
    AL = (typeof S.apptOf === 'function') ? S.apptOf(st) : [];
    P = cusApptParts(o.appt);
    apOpen = !!P.d;
    if (st === 'TA' && typeof S.script === 'function') {
      try {
        first = S.script('TA', o.src || '', o.age || undefined);
        gen = S.script('TA', '');
        if (first && gen && first.t === gen.t && first.say === gen.say) first = null;
      } catch (e) { first = null; }
    }
    h += '<div class="cus-tc" data-ph="' + cusEsc(ph) + '" data-key="' + cusEsc(o.key || '') + '" data-st="' + cusEsc(st) + '"' +
         ' data-me="' + cusEsc(JSON.stringify({ name: M.name, title: M.title, org: M.org, phone: M.phone })) + '">';
    h += '<div class="cus-tc-hd"><b>' + cusEsc(st) + '</b> 에서 자주 만나는 상황 ' + L.length + '가지 — 맞는 것을 펴십시오. ' +
         '글은 <b>보이는 그대로</b> 나갑니다. 보내고 나면 기록 한 칸에 남기십시오.' +
         (ph ? '' : ' <b>번호가 없어</b> 문자·전화 단추는 안 섭니다 — 복사만 됩니다.') +
         (M.org ? '' : ' 글 끝 서명에 <b>소속</b>을 넣으시려면 설정 → 내 소개에 적어 주십시오.') +
         '<br>✍️ 문자·카톡은 굵게·색이 안 됩니다 — 그래서 첫 줄 <b>[제목]</b> · 줄머리 <b>이모지</b> · <b>①②③</b> 번호로 눈에 띄게 했습니다.</div>';
    /* 📅 약속 안내 문자 — 약속이 읽혔으면 맨 위에 펴 둡니다 */
    if (AL.length) {
      A0 = cusApptText(st, 0, M, P.d, P.t, '');
      h += '<details class="cus-tc-s cus-ap" data-k="appt"' + (apOpen ? ' open' : '') + '>' +
           '<summary><span class="no">📅</span><b>약속 안내 문자 — 약속이 잡히면 바로</b><em>' +
             (P.d ? cusEsc(cusApptDay(P.d) + (P.t ? ' ' + cusApptTime(P.t) : '')) : '날짜 넣기') + '</em></summary>' +
           '<div class="cus-tc-b">' +
           '<div class="cus-tc-hd">' + (P.d ? '적혀 있는 약속(배정 DB · 통화 기록)을 읽어 채웠습니다. 다르면 고쳐 주십시오.'
                                        : '아직 적힌 약속이 없습니다 — 날짜와 시간을 넣으면 글이 채워집니다. 지어 넣지 않습니다.') +
             ' 장소는 이 글에만 들어가고 <b>저장하지 않습니다</b>.</div>' +
           '<div class="cus-ap-in">' +
             '<label>날짜<input type="date" class="cus-ap-d" value="' + cusEsc(P.d) + '" oninput="cusApptPaint(this)" onchange="cusApptPaint(this)"></label>' +
             '<label>시간<input type="time" class="cus-ap-t" value="' + cusEsc(P.t) + '" oninput="cusApptPaint(this)" onchange="cusApptPaint(this)"></label>' +
             '<label class="pl">장소<input type="text" class="cus-ap-p" maxlength="60" placeholder="예) 댁 근처 카페 이름" oninput="cusApptPaint(this)"></label>' +
           '</div><div class="cus-ap-cs">';
      for (j = 0; j < AL.length; j++)
        h += '<button type="button" class="cus-ap-c' + (j === 0 ? ' on' : '') + '" data-i="' + j + '" onclick="cusApptPick(this)">' + cusEsc(AL[j].t) + '</button>';
      h += '</div><div class="t-script cus-tc-m cus-ap-m" data-ch="문자"><div class="sh">미리 보기 — 보이는 그대로 나갑니다</div>' +
           '<div class="cus-tc-tx cus-ap-tx">' + cusEsc(A0.text) + '</div>' +
           '<div class="cus-tc-bt"><button type="button" class="cus-ap-b" onclick="cusTouchCopy(this)"' + (A0.ok ? '' : ' disabled') + '>📋 복사</button>' +
           (ph ? '<button type="button" class="go cus-ap-b" onclick="cusTouchSms(this)"' + (A0.ok ? '' : ' disabled') + '>💬 문자로 열기</button>' : '') +
           '<span class="cus-ap-why">' + (A0.ok ? '카톡으로 보내시려면 복사해서 붙여 넣으십시오' : '날짜와 시간을 넣으면 보낼 수 있습니다') + '</span>' +
           '</div></div></div></details>';
    }
    for (i = 0; i < L.length; i++) {
      x = L[i];
      h += '<details class="cus-tc-s" data-k="' + cusEsc(x.k) + '"' + (i === 0 && !apOpen ? ' open' : '') + '>' +
           '<summary><span class="no">' + (i + 1) + '</span><b>' + cusEsc(x.t) + '</b><em>' + cusEsc(x.ch) + '</em></summary>' +
           '<div class="cus-tc-b">' +
           '<div class="cus-tc-k"><b>이럴 때</b><span>' + cusEsc(x.when) + '</span></div>' +
           '<div class="cus-tc-k"><b>이렇게</b><span>' + x.how + '</span></div>';   /* how · next · tip 은 표의 <b> 만 씁니다 */
      /* 상황 안을 <b>탭 셋</b>으로 — 한 번에 다 펴면 폰에서 화면 네 장이 넘었습니다(약 3,600px) */
      h += '<div class="cus-tc-tabs">' +
           '<button type="button" class="on" data-p="msg" onclick="cusTcTab(this)">✉️ 보낼 글 ' + x.msg.length + '</button>' +
           '<button type="button" data-p="call" onclick="cusTcTab(this)">📞 전화 대본</button>' +
           (x.reply && x.reply.length ? '<button type="button" data-p="reply" onclick="cusTcTab(this)">💬 돌아오는 말 ' + x.reply.length + '</button>' : '') +
           '</div><div class="cus-tc-pane on" data-p="msg">';
      h += '<div class="cus-tc-st">✉️ 보낼 글 ' + x.msg.length + '가지 — 쓰임이 저마다 다릅니다</div>';
      for (j = 0; j < x.msg.length; j++) {
        m = x.msg[j];
        h += '<div class="t-script cus-tc-m" data-ch="' + cusEsc(m.ch) + '">' +
             '<div class="sh">' + cusEsc(m.ch) + ' · ' + cusEsc(m.t) + '</div>' +
             '<div class="cus-tc-tx">' + cusEsc(cusFill(m.text, M)) + '</div>' +
             '<div class="cus-tc-bt"><button type="button" onclick="cusTouchCopy(this)">📋 복사</button>' +
             (m.ch === '문자' && ph ? '<button type="button" class="go" onclick="cusTouchSms(this)">💬 문자로 열기</button>' : '') +
             (m.ch === '카톡' ? '<span>복사해서 카톡 창에 붙여 넣으십시오</span>' : '') +
             '</div></div>';
      }
      h += '</div><div class="cus-tc-pane" data-p="call">';
      if (i === 0 && first && first.say) {
        h += '<div class="cus-tc-st">🎯 이 분께 맞춘 첫 마디 — ' + cusEsc(first.t) + '</div>' +
             '<div class="t-script cus-tc-src"><div class="cus-tc-tx">' + cusEsc(first.say) + '</div>' +
             (first.tip ? '<div class="cus-tc-tip">💡 ' + first.tip + '</div>' : '') +
             (first.age ? '<div class="sh">나이대 한마디가 끝에 붙었습니다</div>' : '') +
             '<div class="cus-tc-bt"><button type="button" onclick="cusTouchCopy(this)">📋 복사</button></div></div>';
      }
      h += '<div class="cus-tc-st">📞 전화 대본 — ' + x.call.length + '걸음</div><div class="t-script cus-tc-call">';
      for (j = 0; j < x.call.length; j++) {
        c = x.call[j];
        h += '<div class="sl2"><b>' + (j + 1) + '. ' + cusEsc(c.t) + '</b><span class="cus-tc-tx">' + cusEsc(cusFill(c.say, M)) + '</span></div>' +
             (c.tip ? '<div class="cus-tc-tip">💡 ' + c.tip + '</div>' : '');
      }
      h += '<div class="cus-tc-bt"><button type="button" onclick="cusTouchCopy(this)">📋 대본 복사</button>' +
           (ph ? '<a class="go" href="tel:' + cusEsc(ph) + '" onclick="cusTouchTel(this)">📞 이 대본으로 걸기</a>' : '') +
           '</div></div>';
      h += '</div>';
      if (x.reply && x.reply.length) {
        h += '<div class="cus-tc-pane" data-p="reply"><div class="cus-tc-st">💬 이런 말이 돌아오면</div>';
        for (j = 0; j < x.reply.length; j++)
          h += '<div class="cus-tc-rp"><div class="q">' + cusEsc(x.reply[j].q) + '</div><div class="a">' + cusEsc(cusFill(x.reply[j].a, M)) + '</div></div>';
        h += '</div>';
      }
      h += '<div class="cus-tc-no">하지 말 것 — ' + cusEsc(x.avoid) + '</div>' +
           '<div class="cus-tc-nx">다음 — ' + x.next + '</div>' +
           '</div></details>';
    }
    return h + '</div>';
  }
  /* 📅 고르거나 고치면 미리 보기를 <b>그 자리에서</b> 다시 씁니다 — 같은 cusApptText 로 */
  function cusApptPaint(el) {
    var r = cusTouchRoot(el), box = r ? r.querySelector('.cus-ap') : null, me = {}, on, i, R, q, k, why;
    if (!box) return;
    try { me = JSON.parse(r.getAttribute('data-me') || '{}'); } catch (e) { me = {}; }
    on = box.querySelector('.cus-ap-c.on');
    i = on ? +on.getAttribute('data-i') : 0;
    R = cusApptText(r.getAttribute('data-st') || '', i, me,
      (box.querySelector('.cus-ap-d') || {}).value || '', (box.querySelector('.cus-ap-t') || {}).value || '',
      (box.querySelector('.cus-ap-p') || {}).value || '');
    box.querySelector('.cus-ap-tx').textContent = R.text;
    q = box.querySelectorAll('.cus-ap-b');
    for (k = 0; k < q.length; k++) q[k].disabled = !R.ok;
    why = box.querySelector('.cus-ap-why');
    if (why) why.textContent = R.ok ? '카톡으로 보내시려면 복사해서 붙여 넣으십시오' : '날짜와 시간을 넣으면 보낼 수 있습니다';
  }
  /* 상황 안의 탭 — 고른 칸만 보입니다(인쇄에서는 다 나옵니다) */
  function cusTcTab(btn) {
    var b = btn && btn.closest ? btn.closest('.cus-tc-b') : null, p = btn.getAttribute('data-p'), q, k;
    if (!b) return;
    q = b.querySelectorAll('.cus-tc-tabs button');
    for (k = 0; k < q.length; k++) q[k].classList.toggle('on', q[k] === btn);
    q = b.querySelectorAll('.cus-tc-pane');
    for (k = 0; k < q.length; k++) q[k].classList.toggle('on', q[k].getAttribute('data-p') === p);
  }
  function cusApptPick(btn) {
    var box = btn && btn.closest ? btn.closest('.cus-ap') : null, q, k;
    if (!box) return;
    q = box.querySelectorAll('.cus-ap-c');
    for (k = 0; k < q.length; k++) q[k].classList.remove('on');
    btn.classList.add('on');
    cusApptPaint(btn);
  }
  /* 그 상자의 글 — 단추 글자는 빼고 <b>보이는 글만</b> */
  function cusTouchText(btn) {
    var box = btn && btn.closest ? btn.closest('.t-script') : null, q, t = '', k;
    if (!box) return '';
    q = box.querySelectorAll('.cus-tc-tx');
    for (k = 0; k < q.length; k++) t += (t ? '\n' : '') + (q[k].textContent || '');
    return t;
  }
  function cusTouchRoot(btn) { return btn && btn.closest ? btn.closest('.cus-tc') : null; }
  function cusTouchSay(btn, msg) {
    if (typeof w.toast === 'function') { w.toast(msg); return; }
    var was = btn.textContent;
    btn.textContent = msg;
    setTimeout(function () { btn.textContent = was; }, 1600);
  }
  function cusTouchAfter(btn, ch) {
    var r = cusTouchRoot(btn), key = r ? (r.getAttribute('data-key') || '') : '';
    try { if (typeof w.cusTouchDone === 'function') w.cusTouchDone(key, ch); } catch (e) {}
  }
  /* 복사 — 못 했으면 <b>못 했다고</b> 말합니다 */
  function cusTouchCopy(btn) {
    var t = cusTouchText(btn), no = '복사하지 못했습니다 — 글을 손으로 골라 복사해 주십시오';
    if (!t) { cusTouchSay(btn, '복사할 글이 없습니다'); return; }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText)
        navigator.clipboard.writeText(t).then(function () { cusTouchSay(btn, '복사했습니다'); }, function () { cusTouchSay(btn, no); });
      else cusTouchSay(btn, no);
    } catch (e) { cusTouchSay(btn, no); }
  }
  /* 문자 — 폰의 문자 앱이 <b>그 글을 담고</b> 열립니다. 보내는 것은 사람이 누릅니다 */
  function cusTouchSms(btn) {
    var r = cusTouchRoot(btn), ph = r ? (r.getAttribute('data-ph') || '') : '', t = cusTouchText(btn);
    if (!ph) { cusTouchSay(btn, '번호가 없습니다'); return; }
    try { location.href = 'sms:' + ph + (t ? ('?&body=' + encodeURIComponent(t)) : ''); } catch (e) {}
    cusTouchAfter(btn, '문자');
  }
  function cusTouchTel(btn) { cusTouchAfter(btn, '전화'); }

  w.cusEsc = cusEsc;
  w.cusCho = cusCho;
  w.cusOnlyCho = cusOnlyCho;
  w.cusMask = cusMask;
  w.cusHit = cusHit;
  w.cusWon = cusWon;
  w.cusWonR = cusWonR;
  w.CUS_CHO = CUS_CHO;
  w.cusDate = cusDate;
  w.cusDays = cusDays;
  w.cusLog = cusLog;
  w.cusCss = cusCss;
  w.cusCardHtml = cusCardHtml;
  w.cusLogHtml = cusLogHtml;
  w.cusTouchHtml = cusTouchHtml;
  w.cusTouchCopy = cusTouchCopy;
  w.cusTouchSms = cusTouchSms;
  w.cusTouchTel = cusTouchTel;
  w.cusMeOf = cusMeOf;
  /* 🤖 자비스도 같은 자리채움을 씁니다 — {나}·{이름}·{서명} 을 따로 채우면 서명이 둘이 됩니다 (판 X280 · 5번) */
  w.cusFill = cusFill;
  w.cusMeNorm = cusMeNorm;
  w.cusTouchText = cusTouchText;
  w.cusApptText = cusApptText;
  w.cusApptParts = cusApptParts;
  w.cusApptPaint = cusApptPaint;
  w.cusApptPick = cusApptPick;
  w.cusTcTab = cusTcTab;
})(typeof window !== 'undefined' ? window : this);
