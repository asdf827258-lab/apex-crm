/*
 * APEX YUN PRO — 보장분석 전&후 만들기 › 🧠 제안서 설명자료
 * ═════════════════════════════════════════════════════════════════
 * 사장님 말씀(2026-11-24) 「이렇게 컨셉잡아주고, 하는 윤시현의 두뇌와 자료 잡는 컨셉 프로그램」
 *   → 「AI 보장분석 이름을 없애고 보장분석 전후 만들기 안에 넣어서 관리하자」
 *
 * 보장분석·제안서 PDF 를 넣으면
 *   ① 컨셉 카드(유형 · 한 줄 · 니즈 고리 · 불리한 것 · 확인할 것) 를 먼저 세우고
 *   ② 16:9 설명자료(장마다 대본 S · 귀띔) 를 만들고
 *   ③ 숫자가 자료에 있는지 앱이 다시 대 보고, 확인 칸을 다 눌러야 고객용 PDF 가 열린다.
 *
 * ── 규칙이 어디서 왔나 ─────────────────────────────────────────────
 *   PC 의 /yoonsi 스킬(brain.md) 을 줄여 BAPD_BRAIN 한 곳에 옮겼다. 규칙을 고칠 때는
 *   여기 한 곳만 고친다 (CLAUDE.md 5번). 다만 세금은 이 저장소 규칙 2번을 따른다 —
 *   한도·나이·개월 숫자를 화면에 적지 않고 「요건 충족 시」 를 빼지 않는다.
 *
 * ── 지어내지 않는다 (1번) ─────────────────────────────────────────
 *   · AI 는 <b>장별 내용만</b> 정해진 칸에 채운다. 그림(막대 너비·합계)은 앱이 계산한다.
 *   · 막대 합계는 앱이 더한다 — AI 가 적은 합계를 믿지 않는다(11-23 1,000원 오류).
 *   · 화면 숫자가 넣은 자료에서 그대로 안 보이면 「확인할 숫자」 로 올린다.
 *   · 고객 이름은 AI 로 보내지 않는다 — {고객} 자리표만 보내고 이 브라우저에서 바꾼다 (3번).
 *   · 결과는 서버에 저장하지 않는다(준법 회신 2026-11-05 · 개인 저장 금지).
 *
 * ── 이 파일을 따로 둔 이유 ────────────────────────────────────────
 *   index.html 은 여러 세션이 동시에 고친다. 화면 등록은 전역 CUSTOM 에 한 줄,
 *   머리띠는 TAB_ELSEWHERE 에 한 줄 — 나머지는 전부 여기 (보장분석 갈래 접두사 bapd*).
 */
(function () {
  'use strict';

  var TAB = 'bapd';

  /* ── 세 칸 전환 띠 — 「보장분석 전&후 만들기」 한 화면처럼 ── */
  var BAPD_SW = [
    { id: 'frmake', ic: '🔀', t: '전·후 만들기' },
    { id: 'bojang', ic: '📑', t: 'AI 리포트' },
    { id: 'bapd',   ic: '🧠', t: '제안서 설명자료' }
  ];
  function swHtml(cur) {
    var h = '<div class="bapd-sw" role="tablist" aria-label="보장분석 전&amp;후 만들기">' +
      '<span class="bapd-sw-t">보장분석 전&amp;후 만들기 ›</span>';
    BAPD_SW.forEach(function (s) {
      h += '<button type="button" role="tab" class="bapd-sw-b' + (s.id === cur ? ' on' : '') +
        '" aria-selected="' + (s.id === cur) + '" onclick="bapdSw(\'' + s.id + '\')">' + s.ic + ' ' + s.t + '</button>';
    });
    return h + '</div>';
  }
  /* 사장님 말씀 2026-11-25 「보장분석 전후 만들기 클릭하면 그 안에 배치해줘」 (판 X556)
     → 전·후 만들기 껍데기(#baScreen)가 떠 있으면 <b>밖으로 나가지 않고</b> 그 안, 안쪽 위 띠
       바로 아래(#baSub)에 그린다. 껍데기가 없을 때(메뉴 찾기·주소)는 예전처럼 제 화면으로 간다. */
  function baOn() { var sc = document.getElementById('baScreen'); return !!(sc && sc.classList.contains('on')); }
  function frameWin() { var f = document.getElementById('baFrame'); try { return f && f.contentWindow; } catch (e) { return null; } }
  function fitTop() {
    var box = document.getElementById('baSub'), w = frameWin(), top = 64;
    try { var bar = w && w.document.querySelector('.bar'); if (bar) top = Math.round(bar.getBoundingClientRect().bottom); } catch (e) {}
    if (box) box.style.top = Math.max(40, top) + 'px';
  }
  window.baSubOpen = function (tab) {
    if (tab !== 'bojang' && tab !== 'bapd') return;
    if (!baOn() && typeof openBa === 'function') openBa();
    var box = document.getElementById('baSub'); if (!box) { if (typeof go === 'function') go(tab); return; }
    /* 같은 화면이 바깥(#dynPane)에도 그려져 있으면 id 가 두 벌이 된다 — 바깥 것을 비운다 */
    try { var d = document.getElementById('dynPane'); if (d && d.querySelector('.bapd-sw')) d.innerHTML = ''; } catch (e) {}
    box.innerHTML = (typeof renderToolPage === 'function') ? renderToolPage(tab) : '';
    box.classList.add('on'); box.scrollTop = 0; box.setAttribute('data-tab', tab);
    var w = frameWin(); try { if (w) { w.BA_SUB = tab; if (w.baTabsPaint) w.baTabsPaint(); } } catch (e) {}
    fitTop(); setTimeout(fitTop, 300);
  };
  window.baSubClose = function (fromInside) {
    var box = document.getElementById('baSub'); if (box) { box.classList.remove('on'); box.innerHTML = ''; box.removeAttribute('data-tab'); }
    if (!fromInside) { var w = frameWin(); try { if (w) { w.BA_SUB = ''; if (w.baTabsPaint) w.baTabsPaint(); } } catch (e) {} }
  };
  if (window.addEventListener) window.addEventListener('resize', function () { var b = document.getElementById('baSub'); if (b && b.classList.contains('on')) fitTop(); });
  window.bapdSw = function (id) {
    if (baOn()) { if (id === 'frmake') window.baSubClose(); else window.baSubOpen(id); return; }
    if (typeof go === 'function') go(id);
  };
  window.bapdSwHtml = swHtml;

  /* ── 규칙(두뇌) — PC /yoonsi 스킬 brain.md 를 줄인 것 ── */
  var BAPD_BRAIN = [
    '너는 APEX 사업단장 윤시현의 방식으로 고객 1:1 상담 설명자료를 짜는 사람이다.',
    '■ 출발점(앵커): 고객이 이미 쓰는 돈에서 시작한다. 순서: ①지금 내는 보험료(해지·전환) ②고객이 정한 예산(새 저축·연금) ③가장 싼 대안(여러 제안 고르기) ④곧 끝나는 기존 보험료(해지 없이 더하기). 표지 h1 에 그 금액을 넣는다.',
    '■ 컨셉 유형 하나를 고른다: 재배치형(같은 돈으로 빈 칸 채우기) · 공백발견형(넘치는 곳 vs 0원, 시간의 빈틈) · 현금흐름형(지금 보험료를 은퇴 후 받는 돈으로) · 문턱비교형(받기 쉬운 정도가 다름, 약관 조건) · 고르기형(새 제안 여러 개 중 하나) · 새저축형(새 돈으로 연금·저축).',
    '■ 니즈 순서: 사실(서류 숫자) → 대비(넘침 vs 0원) → 시간(언제 끝나고 언제 비나) → 열쇠(풀리는 돈·지켜야 할 보물 계약) → 방향 한 문장. 지켜야 할 계약은 "해지하지 마세요"를 먼저 말한다.',
    '■ 장 수: "한눈에/보기 쉽게"면 7~8장, 상품 하나·고르기도 7~8장, 연금·재무설계는 14~18장.',
    '■ 연금은 상품부터 시작하지 않는다: ①"마지막 30년, 월급은 어디서?" 질문 ②노후는 미뤄도 티가 안 남 ③나라 연금의 한계 ④부족분은 숫자로(목돈은 끝나고 연금은 평생) ⑤시간이 가장 비싸다(가입 때 생명표) ⑥둘 중 큰 금액(바닥은 깔고 위는 열어 둠) ⑦달러면 "달러는 투자가 아니라 보험, 맞히지 말고 나눠 갖기" ⑧그래서 얼마(원화·달러 둘 다) ⑧-1 왜 꼭 연금인가(비과세 요건 · 그릇 비교) ⑨물려줄 때 ⑩불리한 것 ⑪반론 "다 맞는 말입니다" ⑫목적을 묻는 질문. 이미 연금이 있는 고객은 "이미 준비하셨습니다 — 그대로 두세요"로 연다. 60대 이상·고소득은 장수·상속·통화 분산이 주인공.',
    '■ 세금(이 앱 규칙): "비과세 상품입니다"라고 결론 내지 않는다. 요건만 보여 주고 "요건 충족 시"를 빼지 않는다. 세금 한도·나이·개월·세율 숫자는 화면에 적지 않는다. 판정은 세무 확인.',
    '■ 한 장 = 메시지 하나. h1 은 결론 문장(강조는 <em>…</em>). 숫자는 크게. 0원은 0원이라 쓴다. 불리한 것(빠지는 담보·손해 구간·감액·면책·갱신)은 빨간 칸으로 숨기지 않고 대안을 같이 적는다.',
    '■ say(대본): "{고객}님"을 부르며 다정하고 짧게, 끝은 반드시 질문 하나. 숫자는 귀로 듣는 말("4만 9천 원", "하루로 치면 1,400원 정도"). 가상 사례는 "예를 들어"로 시작. tip(귀띔): 짚는 순서, 고객 답에 따른 갈림길, 조건·함정. 3줄 안쪽.',
    '■ 숫자: 첨부 자료에 있는 숫자만 쓴다. 없으면 "확인 필요". 감액·면책은 예시 옆에. 등급 경계(예: 4주 미만/이상)를 확인. 판례 번호·기사 날짜를 지어내지 않는다. 보장분석의 0원도 담보 목록을 보고 판단. 갱신으로 납입 후에도 나가는 보험료를 숨기지 않는다. 화면 금액은 실제 납입액.',
    '■ 안전장치(덧붙이면 checks 에 "제가 덧붙인 것"으로 적는다): 해지가 있으면 새 계약 승인 확인 뒤 정리 · 비교안내 · 면책 다시 시작. 무해지·저해지면 중간 해지 손해 구간. 고지를 피하게 돕는 내용은 절대 쓰지 않는다. 설계서가 여러 장이면 이름·생년월일·직업·심사유형·부담보가 다른 곳을 찾아 checks 에 적는다.',
    '■ "고객 제공 불가 / 설계사 교육용" 표시 자료와 소식지는 화면·출처·대본에 쓰지 않는다. 수수료·시책은 쓰지 않는다.',
    '■ src: 장마다 출처(파일 이름·쪽·설계서 번호)를 짧게. 마지막 장 src 에 "실제 보장 내용은 약관과 심사 결과를 따릅니다".'
  ].join('\n');

  var BAPD_KINDS = [
    '[장 종류와 data 모양 — 이 중에서만 고른다]',
    'cover: {kick, h1, lead, chips:["🚗 운전","🏠 집"]}   (첫 장 · h1 에 앵커 금액)',
    'money: {rows:[{label:"지금", sub:"운전자 1건", segs:[{t:"삼성 상해보험(운전자)", v:49000, c:"old"}]}], punch:{num:"+42,059", unit:"원 / 월", text:"하루로 치면 <b>약 1,400원</b>"}}   (c 는 old|blue|teal|gold|green|navy|red · v 는 숫자만, 합계는 앱이 계산)',
    'zero3: {cards:[{ic:"🏥", title:"간병인 쓴 날", from:"0원", to:"하루 20만", what:"…", sub:"<b>그 밖에</b><br>…", hl:true}]}   (카드 3개 · 그대로면 from:"" to:"2억 그대로")',
    'col3: {same:{t:"＝ 그대로", items:[{t:"합의금 <b>최대 2억</b>", s:"작은 설명"}]}, plus:{t:"＋ 새로", items:[…]}, minus:{t:"－ 빠지는 것", items:[…]}, alt:"걱정되시면 …"}',
    'ex3: {cards:[{ic:"🏥", title:"폐렴으로 3주 입원,<br>간병인을 썼다면", rows:[["간병인 20만 × 21일","420만"]], total_label:"받는 돈", total:"450만", foot:"가입 1년 뒤 기준"}]}   (예를 들어 · 카드 3개)',
    'chk6: {items:[{ic:"🧾", title:"…", text:"…"}]}   (조건 6개)',
    'table: {head:["","KB","메리츠"], rows:[["암 진단비","31곳 × 2,000만","2,000만"]], hi:[0], note:"…"}',
    'years: {bars:[{l:"1년", sub:"65세", v:"15.9%", pct:16, tone:"lo"}], note:"…"}   (tone lo=손해 빨강 · ok=원금 이상 초록 · tp=강조 남색)',
    'timeline: {pts:[{age:"64", unit:"세", title:"시작", text:"…", tone:"g"}], note:"…"}   (tone ""|g|y|r · 4~7개)',
    'cards: {cards:[{ic:"🕊", title:"…", text:"…", big:"최소 132,900달러"}], note:"…"}   (2~3개)',
    'steps: {steps:[{title:"새 보험 심사", text:"…"}], qs:["질문1","질문2","질문3"]}   (마지막 장 · 질문 3개)'
  ].join('\n');

  /* ── 상태 ── */
  var S = { files: { bj: [], pr: [] }, plan: null, busy: false, src: '', flags: [], ok: {}, nameShow: '', deck: '', mode: 'auto',
            said: [], goal: [], saidFree: '', dir: '', kakao: null, kakaoErr: '' };
  /* 판 X566 · 사장님 말씀 2026-11-25 「질문을 선택할수 있도록 … 고객이 한말들을 인식하는지가 중요」
     고객이 한 말을 <b>골라</b> 넣는다. 고른 말마다 「몇 장에서 어떻게 답했나」 를 AI 가 적게 하고,
     빠진 말은 앱이 확인 칸으로 올린다 (audit). 문구는 이 표 한 곳에만 둔다 (5번). */
  var BAPD_SAID = [
    ['걱정', ['노후가 걱정돼요', '간병이 걱정돼요', '큰 병 치료비가 걱정돼요', '자녀에게 남겨 주고 싶어요', '가족력이 있어요']],
    ['보험료', ['보험료가 부담돼요', '지금 내는 것도 많아요', '목돈이 묶이는 게 싫어요']],
    ['지금 보험', ['지금 보험으로 충분하지 않아요?', '해지하면 손해 아니에요?', '예전에 든 보험이 좋다던데요']],
    ['가입·결정', ['병력이 있는데 가입이 될까요?', '달러(환율)가 불안해요', '세금은 어떻게 돼요?', '나중에 생각해 볼게요', '가족과 상의해야 해요']]
  ];
  var BAPD_GOAL = ['한눈에 보기 쉽게', '해지하고 이렇게 가입', '여러 제안 중 고르기', '지금 보험에 더하기', '노후·연금 준비', '약관 근거로 꼼꼼히'];
  var BAPD_MAXPR = 6;   /* 사장님 말씀 「가입설계서 갯수를 더 늘려줘」 — 3 → 6. 그림 PDF 는 회사 한도 안에서 고르게 나눠 읽는다(aiFitImagesFair) */
  function saidAll() {
    var free = String(S.saidFree || '').split(/\n+/).map(function (x) { return x.replace(/^\s+|\s+$/g, ''); }).filter(Boolean);
    return S.said.concat(free);
  }
  function chip(kind, t) {
    var on = (kind === 'said' ? S.said : S.goal).indexOf(t) >= 0;
    return '<button type="button" class="bapd-chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" onclick="bapdChip(\'' + kind + '\',this)" data-t="' + esc(t) + '">' + esc(t) + '</button>';
  }
  window.bapdChip = function (kind, el) {
    var t = el.getAttribute('data-t'), L = kind === 'said' ? S.said : S.goal, i = L.indexOf(t);
    keepInputs();
    if (i >= 0) L.splice(i, 1); else L.push(t);
    el.classList.toggle('on', i < 0); el.setAttribute('aria-pressed', String(i < 0));
  };
  /* 칸에 적어 둔 것을 상태로 옮겨 둔다 — 다시 그려도 안 사라지게 */
  function keepInputs() {
    var n = val('bapdName'), w = val('bapdWho'), d = document.getElementById('bapdDir'), f = document.getElementById('bapdSaidFree');
    if (document.getElementById('bapdName')) S.nameShow = n;
    if (document.getElementById('bapdWho')) S.who = w;
    if (d) S.dir = String(d.value || ''); if (f) S.saidFree = String(f.value || '');
  }
  window.BAPD = S;

  function esc(s) { return (typeof osEsc === 'function') ? osEsc(s == null ? '' : String(s)) : String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* AI 가 쓴 글에서 <b> <em> <br> <small> <s> 만 살린다 — 나머지 태그·속성은 버린다 */
  function rich(s) {
    s = String(s == null ? '' : s);
    s = s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
    return s.replace(/&lt;(\/?)(b|em|br|small|s|strong)\s*\/?&gt;/gi, '<$1$2>');
  }
  function val(id) { var e = document.getElementById(id); return e ? String(e.value || '').replace(/^\s+|\s+$/g, '') : ''; }
  function toastx(m) { if (typeof toast === 'function') toast(m); }

  /* ── 화면 ── */
  function fileList(slot) {
    var L = S.files[slot] || [];
    if (!L.length) return '<div class="bapd-none">아직 없음</div>';
    return L.map(function (f, i) {
      return '<div class="bapd-file">📄 ' + esc(f.name) + ' <span>' + Math.round(f.size / 1024) + 'KB</span>' +
        '<button type="button" onclick="bapdDel(\'' + slot + '\',' + i + ')" aria-label="빼기">✕</button></div>';
    }).join('');
  }
  function slotBox(slot, title, desc) {
    return '<div class="bapd-slot"><div class="bapd-slot-t">' + title + '</div><div class="bapd-slot-d">' + desc + '</div>' +
      '<input type="file" id="bapdFile_' + slot + '" accept=".pdf,image/*" multiple style="display:none" onchange="bapdAdd(\'' + slot + '\',this)">' +
      '<button type="button" class="bapd-drop" onclick="document.getElementById(\'bapdFile_' + slot + '\').click()" ' +
      'ondragover="event.preventDefault()" ondrop="bapdDrop(event,\'' + slot + '\')">📎 눌러서 고르기 · 끌어다 놓기</button>' +
      '<div id="bapdList_' + slot + '">' + fileList(slot) + '</div></div>';
  }
  function formHtml() {
    return '<div class="card"><div class="card-body">' +
      '<div class="g2 bapd-g2">' +
        slotBox('bj', '① 보장분석 · 증권 (있으면)', '지금 가입된 보험이 보여야 컨셉이 맞습니다. 없으면 비워 두세요.') +
        slotBox('pr', '② 제안서 · 가입설계서 (1~' + BAPD_MAXPR + '개)', '여러 개면 「고르기」, 연금·달러면 「연금 순서」 로 풉니다. 제안서마다 카톡 설명도 만듭니다.') +
      '</div>' +
      '<div class="bapd-row">' +
        '<label>고객 호칭<input id="bapdName" placeholder="김○○" value="' + esc(S.nameShow) + '"></label>' +
        '<label>담당 설계사<input id="bapdWho" placeholder="예: 홍길동 컨설턴트" value="' + esc(S.who || '') + '"></label>' +
        '<label>장 수<select id="bapdMode"><option value="auto">알아서</option><option value="short">한눈에 7~8장</option><option value="long">자세히 12~18장</option></select></label>' +
      '</div>' +
      '<div class="bapd-q"><div class="bapd-q-t">상담 방향 <span>골라 주세요 · 여럿 가능</span></div><div class="bapd-chips">' +
        BAPD_GOAL.map(function (t) { return chip('goal', t); }).join('') + '</div></div>' +
      '<div class="bapd-q"><div class="bapd-q-t">👂 고객이 한 말 · 질문 <span>고른 말마다 「몇 장에서 어떻게 답했는지」 를 확인합니다</span></div>' +
        BAPD_SAID.map(function (g) { return '<div class="bapd-chips"><b>' + esc(g[0]) + '</b>' + g[1].map(function (t) { return chip('said', t); }).join('') + '</div>'; }).join('') + '</div>' +
      '<label class="bapd-wide">고객이 직접 한 말 (한 줄에 하나 · 그대로 적어 주세요)<textarea id="bapdSaidFree" rows="2" placeholder="예: 우리 엄마가 간병비로 고생하셨어요&#10;예: 의사라 은퇴가 늦어요">' + esc(S.saidFree) + '</textarea></label>' +
      '<label class="bapd-wide">덧붙일 방향 (선택)<textarea id="bapdDir" rows="2" placeholder="예: 운전자보험 4만 9천 원 해지하고 이렇게 가입 / 노후는 달러로 나눠 두고 싶다">' + esc(S.dir) + '</textarea></label>' +
      '<div class="btn-row" style="margin-top:12px"><button type="button" class="btn btn-primary" id="bapdGo" onclick="bapdGen()">🧠 컨셉 잡고 설명자료 만들기</button>' +
      (S.plan ? '<button type="button" class="btn btn-ghost" onclick="bapdReset()">새로 만들기</button>' : '') + '</div>' +
      '<div class="bapd-fine">고객 이름은 AI 로 보내지 않습니다(자리표로 보내고 이 화면에서 바꿉니다). 파일과 결과는 서버에 남기지 않습니다 — 새로고침하면 사라집니다.</div>' +
      '</div></div><div id="bapdOut">' + (S.plan ? outHtml() : '') + '</div>';
  }
  function css() {
    return '<style>' +
      '.bapd-sw{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 14px;padding:8px;border-radius:14px;background:var(--t-card);border:1px solid var(--t-line-2)}' +
      '.bapd-sw-t{font-size:var(--t6);font-weight:800;color:var(--t-ink);margin:0 8px 0 4px}' +
      '.bapd-sw-b{border:0;border-radius:10px;padding:8px 14px;font-size:var(--t6);font-weight:800;font-family:inherit;cursor:pointer;background:var(--t-bg);color:var(--t-sub)}' +
      '.bapd-sw-b.on{background:var(--t-point);color:#fff}' +
      '.bapd-g2{gap:12px}.bapd-slot{border:1px solid var(--t-line-2);border-radius:13px;padding:13px 15px;background:var(--t-card)}' +
      '.bapd-slot-t{font-size:var(--t6);font-weight:800;color:var(--t-ink)}.bapd-slot-d{font-size:var(--t6);color:var(--t-sub);line-height:1.6;margin:3px 0 9px}' +
      '.bapd-drop{width:100%;border:1.5px dashed var(--t-line-3);border-radius:11px;padding:14px;background:var(--t-card);font-size:var(--t6);font-weight:700;color:var(--t-sub);cursor:pointer;font-family:inherit}' +
      '.bapd-file{display:flex;align-items:center;gap:6px;font-size:var(--t6);color:var(--t-ink);margin-top:6px}.bapd-file span{color:var(--t-sub)}' +
      '.bapd-file button{margin-left:auto;border:0;background:var(--t-bg);border-radius:8px;cursor:pointer;font-size:var(--t6);color:var(--t-sub);padding:2px 8px}' +
      '.bapd-none{font-size:var(--t6);color:var(--t-sub);margin-top:6px}' +
      '.bapd-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-top:12px}' +
      '.bapd-row label,.bapd-wide{display:block;font-size:var(--t6);font-weight:700;color:var(--t-ink)}' +
      '.bapd-row input,.bapd-row select,.bapd-wide textarea{display:block;width:100%;box-sizing:border-box;margin-top:4px;border:1px solid var(--t-line);border-radius:9px;padding:9px 11px;font-size:var(--t6);font-family:inherit;color:var(--t-ink);background:var(--t-card)}' +
      '.bapd-wide{margin-top:10px}.bapd-fine{font-size:var(--t6);color:var(--t-sub);line-height:1.7;margin-top:9px}' +
      '.bapd-concept{border-left:5px solid var(--t-point)}.bapd-cl{display:grid;grid-template-columns:96px 1fr;gap:6px 12px;font-size:var(--t6);color:var(--t-ink);line-height:1.6}' +
      '.bapd-cl b{color:var(--t-sub)}.bapd-line{font-size:var(--t4);font-weight:900;color:var(--t-ink);margin:0 0 10px;line-height:1.45}' +
      '.bapd-chk label{display:flex;gap:9px;align-items:flex-start;font-size:var(--t6);color:var(--t-ink);line-height:1.6;padding:7px 0;border-bottom:1px solid var(--t-line-2)}' +
      '.bapd-chk input{margin-top:4px}.bapd-chk .w{color:var(--t-sub)}' +
      '.bapd-frame{width:100%;aspect-ratio:16/9;border:1px solid var(--t-line);border-radius:14px;background:var(--t-bg);display:block}' +
      '.bapd-q{margin-top:12px}.bapd-q-t{font-size:var(--t6);font-weight:800;color:var(--t-ink);margin-bottom:6px}.bapd-q-t span{font-weight:600;color:var(--t-sub);margin-left:6px}' +
      '.bapd-chips{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:6px}.bapd-chips b{font-size:var(--t6);color:var(--t-sub);min-width:64px}' +
      '.bapd-chip{border:1px solid var(--t-line);background:var(--t-card);color:var(--t-ink);border-radius:999px;padding:7px 13px;font-size:var(--t6);font-weight:700;font-family:inherit;cursor:pointer}' +
      '.bapd-chip.on{background:var(--t-point);border-color:var(--t-point);color:#fff}' +
      '.bapd-heard{width:100%;border-collapse:collapse;font-size:var(--t6);color:var(--t-ink)}.bapd-heard td,.bapd-heard th{border-bottom:1px solid var(--t-line-2);padding:8px 6px;text-align:left;vertical-align:top}' +
      '.bapd-heard th{color:var(--t-sub);font-weight:800}.bapd-heard .no{color:var(--t-warn-d,#C2410C);font-weight:800}' +
      '.bapd-kk{border:1px solid var(--t-line-2);border-radius:13px;padding:12px 14px;margin-top:10px;background:var(--t-card)}' +
      '.bapd-kk-t{font-size:var(--t6);font-weight:800;color:var(--t-ink)}.bapd-kk-t span{font-weight:600;color:var(--t-sub);margin-left:6px}' +
      '.bapd-kk textarea{display:block;width:100%;box-sizing:border-box;margin:8px 0;border:1px solid var(--t-line);border-radius:10px;padding:10px 12px;font-size:var(--t6);line-height:1.7;font-family:inherit;color:var(--t-ink);background:#FFFDE7;min-height:230px}' +
      '</style>';
  }
  function page() { return css() + formHtml(); }

  /* ── 파일 ── */
  function add(slot, list) {
    var L = [].slice.call(list || []);
    var over = 0;
    L.forEach(function (f) {
      if (!(/\.pdf$|^image\//i.test(f.name) || /^image\//.test(f.type))) return;
      if (slot === 'pr' && S.files.pr.length >= BAPD_MAXPR) { over++; return; }
      S.files[slot].push(f);
    });
    if (over) toastx('제안서는 ' + BAPD_MAXPR + '개까지입니다 — ' + over + '개는 넣지 않았습니다');
    var box = document.getElementById('bapdList_' + slot); if (box) box.innerHTML = fileList(slot);
  }
  window.bapdAdd = function (slot, inp) { add(slot, inp.files); inp.value = ''; };
  window.bapdDrop = function (ev, slot) { ev.preventDefault(); add(slot, ev.dataTransfer && ev.dataTransfer.files); };
  window.bapdDel = function (slot, i) { S.files[slot].splice(i, 1); var b = document.getElementById('bapdList_' + slot); if (b) b.innerHTML = fileList(slot); };
  window.bapdReset = function () { S.plan = null; S.flags = []; S.ok = {}; S.deck = ''; repaint(); };
  function repaint() { var p = document.getElementById('bapdPage'); if (p) p.innerHTML = page(); }

  /* ── 읽기 → 컨셉 → 장 ── */
  function readParts() {
    var jobs = [];
    ['bj', 'pr'].forEach(function (slot) {
      S.files[slot].forEach(function (f) {
        if (/\.pdf$/i.test(f.name)) {
          jobs.push(extractPdfSmart(f).then(function (r) {
            return { slot: slot, name: f.name, images: r.images || [], text: r.mode === 'image' ? '' : (r.text || '').slice(0, typeof PDF_TEXT_MAX !== 'undefined' ? PDF_TEXT_MAX : 60000) };
          })['catch'](function () { return { slot: slot, name: f.name, images: [], text: '(읽기 실패)' }; }));
        } else if (typeof prImgToB64 === 'function') {
          jobs.push(prImgToB64(f).then(function (b) { return { slot: slot, name: f.name, images: [b], text: '' }; }));
        }
      });
    });
    return Promise.all(jobs);
  }
  function tagOf(slot) { return slot === 'bj' ? '보장분석·증권(지금)' : '제안서(새로)'; }

  window.bapdGen = function () {
    if (S.busy) return;
    if (typeof aiReady === 'function' && !aiReady()) { toastx('설정에서 AI 연결을 먼저 하세요'); return; }
    if (!S.files.pr.length && !S.files.bj.length) { toastx('제안서나 보장분석을 하나 이상 넣으세요'); return; }
    keepInputs(); S.mode = val('bapdMode') || 'auto';
    var dir = [S.goal.join(' · '), String(S.dir || '').replace(/^\s+|\s+$/g, '')].filter(Boolean).join(' / ');
    var said = saidAll(); S.saidUsed = said.slice(); S.kakao = null; S.kakaoErr = '';
    var btn = document.getElementById('bapdGo');
    var say = function (t) { if (btn) btn.textContent = t; };
    S.busy = true; if (btn) btn.disabled = true; say('문서 읽는 중…');

    readParts().then(function (parts) {
      var trim = { parts: parts, note: '' };
      try { trim = pdfTrimParts(parts); } catch (e) {}
      var text = '';
      parts.forEach(function (p) { if (p.text && p.text.replace(/\s+/g, '').length > 10) text += '\n\n===== [' + tagOf(p.slot) + '] ' + p.name + ' =====\n' + p.text; });
      var nImg = 0; parts.forEach(function (p) { nImg += (p.images || []).length; });
      if (!nImg) return { text: text, note: trim.note || '' };
      /* 그림 PDF 는 한 번만 읽어 글로 받아 적는다 — 장마다 다시 싣지 않는다 */
      return aiFitImagesFair(parts.map(function (p) { return { slot: p.slot, name: p.name, images: p.images }; }), 'proposal').then(function (fit) {
        var man = [], idx = 0;
        fit.picked.forEach(function (x) { if (!x.imgs.length) return; var a = idx + 1, b = idx + x.imgs.length; idx = b; man.push('· 이미지 ' + a + (a === b ? '' : '~' + b) + '번 = [' + tagOf(x.slot) + '] ' + x.name); });
        say('그림 페이지 읽는 중… (' + fit.imgs.length + '장)');
        return prReadImgs('[첨부 이미지 목차]\n' + man.join('\n'), fit.imgs, null).then(function (read) {
          return { text: text + '\n\n===== [그림 페이지에서 받아 적은 내용] =====\n' + read, note: [trim.note, fit.note].filter(Boolean).join(' ') };
        });
      });
    }).then(function (got) {
      S.src = got.text; S.readNote = got.note || ''; S.userBase = '';
      var want = { auto: '장 수는 규칙대로 알아서', short: '한눈에 7~8장', long: '자세히 12~18장' }[S.mode];
      var user = '[오늘] ' + (typeof osTodayStr === 'function' ? osTodayStr() : '') + '\n[장 수] ' + want +
        '\n[상담 방향] ' + (dir || '(없음 — 자료만 보고 해석하고 세운 가정을 적는다)') +
        '\n[고객이 한 말 — 하나도 빼지 말고 각각 답한다. 그 장의 say 에서 고객 말을 그대로 되받아 공감부터 하고 답한다]' +
        (said.length ? said.map(function (x, i) { return '\n' + (i + 1) + ') ' + x; }).join('') : '\n(없음)') +
        '\n[제안서 파일] ' + (S.files.pr.map(function (f) { return f.name; }).join(' · ') || '(없음)') +
        '\n[고객 이름] 쓰지 않는다. 화면과 대본에는 {고객} 이라고만 쓴다.' +
        '\n\n[첨부 자료]' + got.text;
      S.userBase = user;   /* 카톡만 다시 만들 때 PDF 를 다시 안 읽는다 */
      say('컨셉 잡는 중…');
      var sys1 = BAPD_BRAIN + '\n\n[이번에 할 일] 컨셉 카드만 만든다. JSON 하나만 출력한다:\n' +
        '{"type":"유형","line":"한 줄 컨셉(앵커 금액 포함)","anchor":"앵커","chain":["니즈 고리 3~5단계"],"loses":["빠지는 것·불리한 것"],"alt":"대안","plan":["장 제목 순서"],"assume":["세운 가정"],"added":["제가 덧붙인 안전장치"],"checks":["고객·세무·회사에 확인할 것"],"mismatch":["설계서끼리 다른 곳"],"heard":[{"said":"고객이 한 말 그대로","where":"답하는 장 번호(예: 3장)","how":"어떻게 답하나 한 줄"}]}\n' +
        '[heard] 는 [고객이 한 말] 하나마다 한 줄씩, 빠짐없이. 답할 장이 없으면 장을 하나 더 만든다.';
      return callAI(sys1, user, 2600, 'proposal').then(function (t1) {
        var c = (typeof prJson === 'function') ? prJson(t1) : JSON.parse(t1);
        if (!c || !c.line) throw new Error('컨셉 카드를 만들지 못했습니다');
        S.concept = c;
        say('설명자료 쓰는 중… (30~60초)');
        var sys2 = BAPD_BRAIN + '\n\n' + BAPD_KINDS + '\n\n[이번에 할 일] 아래 컨셉 카드대로 장을 쓴다. JSON 하나만 출력한다:\n' +
          '{"title":"자료 제목","slides":[{"kind":"cover","kick":"…","h1":"…","say":"…","tip":"…","src":"…","data":{…}}]}\n' +
          '[컨셉 카드]\n' + JSON.stringify(c);
        return callAI(sys2, user, 9000, 'proposal');
      });
    }).then(function (t2) {
      var plan = (typeof prJson === 'function') ? prJson(t2) : JSON.parse(t2);
      if (!plan || !plan.slides || !plan.slides.length) throw new Error('장을 정리하지 못했습니다 — 다시 눌러 주세요');
      S.plan = plan; S.ok = {};
      S.flags = audit(plan);
      S.deck = deckHtml(plan, false);
      S.busy = false; repaint();
      toastx('설명자료 ' + plan.slides.length + '장 · 확인할 것 ' + S.flags.length + '개' + (S.files.pr.length ? ' · 카톡 설명 만드는 중…' : ''));
      if (S.files.pr.length) window.bapdKakao();
      var o = document.getElementById('bapdOut'); if (o && o.scrollIntoView) o.scrollIntoView({ behavior: 'smooth', block: 'start' });
    })['catch'](function (e) {
      S.busy = false; if (btn) { btn.disabled = false; btn.textContent = '🧠 컨셉 잡고 설명자료 만들기'; }
      var m = (e && e.message) || String(e || '');
      var o = document.getElementById('bapdOut');
      if (o) o.innerHTML = '<div class="err-box" style="margin-top:12px">⚠️ 만들지 못했습니다: ' + esc(m) +
        '<div style="margin-top:10px"><button type="button" class="btn btn-ghost" onclick="bapdGen()">🔄 다시 시도</button></div></div>';
      toastx('만들지 못했습니다 — 아래 안내를 보세요');
    });
  };

  /* ── 💬 제안서마다 카카오톡 설명 (사장님 말씀 2026-11-25 「제안서 별로 카카오톡으로 설명해서 보낼수 있도록」) ──
     장(덱)과 따로 한 번 더 부른다 — 한 번에 다 쓰게 하면 길이에 걸려 뒤가 잘린다.
     숫자·세금 점검(audit)을 메시지에도 똑같이 건다. 고객용이라 확인 칸을 다 눌러야 복사가 열린다. */
  var BAPD_KAKAO = [
    '[이번에 할 일] [제안서 파일] 마다 고객에게 카카오톡으로 보낼 설명 메시지를 하나씩 쓴다. JSON 하나만 출력한다:',
    '{"kakao":[{"file":"파일 이름 그대로","title":"한 줄 제목","msg":"본문"}]}',
    '■ {고객}님 으로 시작한다. 다정하고 짧은 줄로 400~600자. 이모지는 2~3개까지.',
    '■ 이 제안서로 무엇이 좋아지는지 2~3가지 — 숫자는 첨부 자료에 있는 것만. 불리한 점·조건도 한 가지 솔직하게.',
    '■ [고객이 한 말] 중 이 제안서와 닿는 말이 있으면 그대로 받아 한 줄로 답한다.',
    '■ 마지막 줄 앞은 질문 하나로 맺는다(예: "이 중에 제일 마음에 걸리는 게 뭐세요?").',
    '■ 맨 끝 줄은 그대로: ※ 자세한 보장·조건은 약관과 상품설명서를 따르며, 가입은 심사 결과에 따라 달라질 수 있어요.',
    '■ 세금 한도·세율 숫자, "무조건·최고·확정" 같은 말, 다른 회사 비방, 링크·전화번호는 쓰지 않는다. 고객 이름은 {고객} 그대로.'
  ].join('\n');
  window.bapdKakao = function () {
    if (!S.plan || !S.userBase) return;
    S.kakao = null; S.kakaoErr = ''; paintKakao('만드는 중…');
    var sys3 = BAPD_BRAIN + '\n\n' + BAPD_KAKAO + '\n[컨셉 카드]\n' + JSON.stringify(S.concept || {});
    return callAI(sys3, S.userBase, 3800, 'proposal').then(function (t) {
      var o = (typeof prJson === 'function') ? prJson(t) : JSON.parse(t);
      var L = (o && o.kakao) || [];
      if (!L.length) throw new Error('카톡 메시지를 정리하지 못했습니다');
      S.kakao = L; S.flags = audit(S.plan); S.ok = {};
      var box = document.getElementById('bapdOut'); if (box) box.innerHTML = outHtml();
      toastx('카톡 설명 ' + L.length + '개 · 확인할 것 ' + S.flags.length + '개');
    })['catch'](function (e) { S.kakaoErr = (e && e.message) || String(e || ''); paintKakao(); });
  };
  function kakaoHtml() {
    var allOk = S.flags.every(function (f) { return S.ok[f.k]; });
    var h = '<div class="card" style="margin-top:12px" id="bapdKk"><div class="card-body"><div class="bapd-line" style="font-size:var(--t5)">💬 제안서마다 카톡 설명' +
      (S.kakao ? ' ' + S.kakao.length + '개' : '') + '</div>';
    if (!S.kakao) {
      h += '<div class="bapd-fine">' + (S.kakaoErr ? '⚠️ 만들지 못했습니다: ' + esc(S.kakaoErr) : (S.files.pr.length ? '만드는 중… (20~40초)' : '제안서를 넣으면 제안서마다 만듭니다.')) + '</div>' +
        (S.kakaoErr ? '<div class="btn-row"><button type="button" class="btn btn-ghost" onclick="bapdKakao()">🔄 카톡 설명만 다시 만들기</button></div>' : '');
      return h + '</div></div>';
    }
    S.kakao.forEach(function (k, i) {
      var msg = fill(k.msg);
      h += '<div class="bapd-kk"><div class="bapd-kk-t">📄 ' + esc(k.file) + '<span>' + esc(fill(k.title)) + ' · ' + msg.length + '자</span></div>' +
        '<textarea id="bapdKkT' + i + '" aria-label="카톡 설명 ' + (i + 1) + '">' + esc(msg) + '</textarea>' +
        '<div class="btn-row"><button type="button" class="btn ' + (allOk ? 'btn-primary' : 'btn-ghost') + '" ' + (allOk ? '' : 'disabled ') + 'onclick="bapdKkCopy(' + i + ')">📋 복사' + (allOk ? '' : ' — 아래 확인을 다 누르면 열립니다') + '</button>' +
        (allOk && typeof navigator !== 'undefined' && navigator.share ? '<button type="button" class="btn btn-ghost" onclick="bapdKkShare(' + i + ')">📤 카톡으로 보내기</button>' : '') + '</div></div>';
    });
    return h + '<div class="bapd-fine">칸 안에서 고치셔도 됩니다 — 복사는 고친 글 그대로 나갑니다. 숫자·세금 점검은 아래 확인 칸에 함께 올라가 있습니다.</div>' +
      '<div class="btn-row"><button type="button" class="btn btn-ghost" onclick="bapdKakao()">🔄 카톡 설명만 다시 만들기</button></div></div></div>';
  }
  function paintKakao() { var b = document.getElementById('bapdKk'); if (b) b.outerHTML = kakaoHtml(); }
  function kkText(i) { var t = document.getElementById('bapdKkT' + i); return t ? t.value : fill((S.kakao[i] || {}).msg); }
  window.bapdKkCopy = function (i) {
    if (!S.flags.every(function (f) { return S.ok[f.k]; })) { toastx('확인 칸을 먼저 모두 눌러 주세요'); return; }
    var t = kkText(i);
    if (typeof copyText === 'function') { copyText(t); return; }
    try { navigator.clipboard.writeText(t).then(function () { toastx('복사했습니다 — 카톡에 붙여 넣으세요'); }); } catch (e) { toastx('복사하지 못했습니다'); }
  };
  window.bapdKkShare = function (i) {
    if (!S.flags.every(function (f) { return S.ok[f.k]; })) { toastx('확인 칸을 먼저 모두 눌러 주세요'); return; }
    try { navigator.share({ text: kkText(i) }); } catch (e) { window.bapdKkCopy(i); }
  };

  /* ── 앱이 다시 대 보는 것 — numbers.py 자리 ──
     ① 화면 숫자가 넣은 자료에 그대로 있나(쉼표 빼고 견줌) — 없으면 「계산했거나 지어낸 숫자」
     ② 세금 장에 한도·세율 숫자가 섰나(규칙 2번)
     ③ AI 가 스스로 적은 확인할 것 · 설계서끼리 다른 곳                       */
  function plain(s) { return String(s || '').replace(/<[^>]+>/g, ' '); }
  function slideText(sl) { return plain(sl.h1) + ' ' + plain(JSON.stringify(sl.data || {})); }
  /* 앱이 직접 셈한 값 — 막대 줄 합계와 그 차이는 「자료에 없음」 으로 올리지 않는다(앱이 맞춘 값이라) */
  function sums(plan) {
    var ok = {};
    plan.slides.forEach(function (sl) {
      if (sl.kind !== 'money' || !sl.data || !sl.data.rows) return;
      var t = sl.data.rows.map(function (r) { var s = 0; (r.segs || []).forEach(function (g) { s += (+g.v || 0); }); return Math.round(s); });
      t.forEach(function (a, i) { ok[a] = 1; t.forEach(function (b, j) { if (i !== j) ok[Math.abs(a - b)] = 1; }); });
    });
    return ok;
  }
  function numTax(t, where, F, seen, src, key) {
    (t.match(/\d[\d,]*(?:\.\d+)?/g) || []).forEach(function (n) {
      var d = n.replace(/,/g, '');
      if (d.replace(/\./g, '').length < 4 || seen[d]) return;
      seen[d] = 1;
      if (src.indexOf(d) < 0) F.push({ k: 'n' + d, t: where + ' 「' + n + '」 — 넣은 자료에서 그대로 찾지 못했습니다. 계산한 값이면 맞는지, 아니면 지운다' });
    });
    if (/비과세|과세|세율|건강보험료|건보료|종합과세/.test(t)) {
      var tax = t.match(/\d[\d,]*\s*(?:만\s*원|만원|억|%|세|개월|년)/g);
      if (tax) F.push({ k: 'tax' + key, t: where + ' 세금 이야기에 숫자(' + tax.slice(0, 3).join(', ') + ')가 있습니다 — 한도·나이·개월은 적지 않습니다(요건만 · 세무 확인)' });
    }
  }
  function norm(x) { return String(x || '').replace(/[\s?!.·,~]/g, ''); }
  function audit(plan) {
    var F = [], seen = sums(plan), src = String(S.src || '').replace(/,/g, '');
    /* 👂 고객이 한 말 — 고른 말마다 답한 장이 있나 */
    var heard = (S.concept && S.concept.heard) || [];
    (S.saidUsed || []).forEach(function (x, j) {
      var h = heard.filter(function (r) { var a = norm(r.said), b = norm(x); return a && b && (a.indexOf(b) >= 0 || b.indexOf(a) >= 0); })[0];
      var no = h && parseInt(String(h.where || '').replace(/[^\d]/g, ''), 10);
      if (!h || !no) F.push({ k: 'hd' + j, t: '고객이 한 말 「' + x + '」 — 답한 장이 없습니다. 대본에 넣거나 다시 만든다' });
      else if (no > plan.slides.length) F.push({ k: 'hd' + j, t: '고객이 한 말 「' + x + '」 — ' + no + '장에 답했다는데 자료는 ' + plan.slides.length + '장입니다' });
    });
    (S.kakao || []).forEach(function (k, i) { numTax(plain(fill(k.msg)), '카톡 ' + (i + 1) + '(' + (k.file || '') + ')', F, seen, src, 'k' + i); });
    plan.slides.forEach(function (sl, i) {
      var t = slideText(sl);
      numTax(t, (i + 1) + '장', F, seen, src, i);   /* 장·카톡이 같은 한 곳으로 잰다 (5번) */
      if (sl.kind === 'money' && sl.data && sl.data.rows) {
        sl.data.rows.forEach(function (r) { (r.segs || []).forEach(function (g) { if (typeof g.v !== 'number' || !isFinite(g.v)) F.push({ k: 'mv' + i, t: (i + 1) + '장 막대 금액 「' + esc(g.t) + '」 이 숫자가 아닙니다 — 확인' }); }); });
        /* 큰 글씨 차액(punch)이 막대 줄 합계의 차이와 같은가 — 11-23 「302,042 ↔ 303,042」 같은 1,000원 어긋남을 여기서 잡는다 */
        var pn = sl.data.punch && String(sl.data.punch.num || '').replace(/[^\d]/g, '');
        if (pn && pn.length >= 3 && !sums({ slides: [sl] })[+pn]) F.push({ k: 'pn' + i, t: (i + 1) + '장 큰 글씨 「' + esc(sl.data.punch.num) + '」 이 막대 합계의 차이와 다릅니다 — 앱이 더하면 ' + (function () { var t = sl.data.rows.map(function (r) { var s = 0; (r.segs || []).forEach(function (g) { s += (+g.v || 0); }); return s; }); return t.length > 1 ? won(Math.abs(t[t.length - 1] - t[0])) : '?'; })() + ' 입니다' });
      }
    });
    var c = S.concept || {};
    (c.mismatch || []).forEach(function (x, j) { F.push({ k: 'mm' + j, t: '설계서끼리 다른 곳 — ' + x }); });
    (c.checks || []).forEach(function (x, j) { F.push({ k: 'ck' + j, t: '확인할 것 — ' + x }); });
    F.push({ k: 'last', t: '장끼리 숫자가 같은지 봤습니다(표지 금액 = 돈 그림 = 마지막 질문 · 「0원」 칸 = 앞 장 보장분석)' });
    return F;
  }

  /* ── 결과 화면 ── */
  function li(a) { return (a || []).map(function (x) { return esc(x); }).join(' · ') || '—'; }
  function outHtml() {
    var c = S.concept || {}, p = S.plan;
    var allOk = S.flags.every(function (f) { return S.ok[f.k]; });
    var h = '<div class="card bapd-concept" style="margin-top:12px"><div class="card-body">' +
      '<div class="bapd-line">' + rich(fill(c.line)) + '</div><div class="bapd-cl">' +
      '<b>유형</b><span>' + esc(c.type) + '</span><b>앵커</b><span>' + esc(fill(c.anchor)) + '</span>' +
      '<b>니즈 고리</b><span>' + li(c.chain) + '</span><b>불리한 것</b><span>' + li(c.loses) + (c.alt ? ' → <b>대안</b> ' + esc(c.alt) : '') + '</span>' +
      '<b>장 구성</b><span>' + li(c.plan) + '</span><b>세운 가정</b><span>' + li(c.assume) + '</span>' +
      '<b>덧붙인 것</b><span>' + li(c.added) + '</span></div>' +
      (S.readNote ? '<div class="bapd-fine">' + esc(S.readNote) + '</div>' : '') + '</div></div>';
    h += '<div class="card" style="margin-top:12px"><div class="card-body">' +
      '<iframe class="bapd-frame" id="bapdFrame" title="설명자료 미리보기"></iframe>' +
      '<div class="btn-row" style="margin-top:10px">' +
      '<button type="button" class="btn btn-primary" onclick="bapdOpen()">⛶ 새 창에서 발표 (S 대본 · F 전체화면)</button>' +
      '<button type="button" class="btn btn-ghost" onclick="bapdPrint(false)">🖨 설계사용 PDF (대본 포함)</button>' +
      '<button type="button" class="btn ' + (allOk ? 'btn-primary' : 'btn-ghost') + '" id="bapdCli" ' + (allOk ? '' : 'disabled ') + 'onclick="bapdPrint(true)">🖨 고객용 PDF' + (allOk ? '' : ' — 아래 확인을 다 누르면 열립니다') + '</button>' +
      '</div></div></div>';
    var used = S.saidUsed || [], heard = c.heard || [];
    if (used.length) {
      h += '<div class="card" style="margin-top:12px"><div class="card-body"><div class="bapd-line" style="font-size:var(--t5)">👂 고객이 한 말 → 답한 자리</div>' +
        '<table class="bapd-heard"><tr><th style="width:34%">고객이 한 말</th><th style="width:12%">어디서</th><th>어떻게 답했나</th></tr>' +
        used.map(function (x) {
          var r = heard.filter(function (q) { var a = norm(q.said), b = norm(x); return a && b && (a.indexOf(b) >= 0 || b.indexOf(a) >= 0); })[0];
          return '<tr><td>「' + esc(x) + '」</td>' + (r ? '<td>' + esc(r.where) + '</td><td>' + esc(fill(r.how)) + '</td>' : '<td class="no">없음</td><td class="no">답한 장이 없습니다 — 확인 칸에 올렸습니다</td>') + '</tr>';
        }).join('') + '</table></div></div>';
    }
    h += kakaoHtml();
    h += '<div class="card" style="margin-top:12px"><div class="card-body bapd-chk"><div class="bapd-line" style="font-size:var(--t5)">고객 앞에 내기 전에 — 확인 ' + S.flags.length + '개</div>' +
      S.flags.map(function (f) {
        return '<label><input type="checkbox" ' + (S.ok[f.k] ? 'checked ' : '') + 'onchange="bapdTick(\'' + f.k + '\',this.checked)"><span>' + esc(f.t) + '</span></label>';
      }).join('') + '<div class="bapd-fine">AI 가 장끼리 숫자를 어긋나게 쓴 적이 있습니다(시험 2026-11-24). 그래서 사람이 한 번 보고 눌러야 고객용이 열립니다.</div></div></div>';
    setTimeout(paintFrame, 30);
    return h;
  }
  function paintFrame() { var f = document.getElementById('bapdFrame'); if (f && S.deck) f.srcdoc = S.deck; }
  window.bapdTick = function (k, on) { S.ok[k] = !!on; var o = document.getElementById('bapdOut'); if (o) { o.innerHTML = outHtml(); } };
  window.bapdOpen = function () {
    var w = window.open('', '_blank'); if (!w) { toastx('팝업이 막혔습니다 — 허용 후 다시'); return; }
    w.document.open(); w.document.write(S.deck); w.document.close();
  };
  window.bapdPrint = function (client) {
    if (client && !S.flags.every(function (f) { return S.ok[f.k]; })) { toastx('확인 칸을 먼저 모두 눌러 주세요'); return; }
    var html = deckHtml(S.plan, !!client);
    var w = window.open('', '_blank'); if (!w) { toastx('팝업이 막혔습니다 — 허용 후 다시'); return; }
    w.document.open(); w.document.write(html); w.document.close();
    setTimeout(function () { try { w.focus(); w.print(); } catch (e) {} }, 900);
  };

  /* ── 덱 ── */
  function fill(s) { var n = S.nameShow || '고객'; return String(s == null ? '' : s).replace(/\{고객\}/g, n); }
  function R(s) { return rich(fill(s)); }
  function won(n) { return Math.round(n).toLocaleString('ko-KR'); }
  var SEG_C = { old: '#9ca3af', blue: '#1d4ed8', teal: '#0e7490', gold: '#b8892b', green: '#047857', navy: '#14306e', red: '#c2410c' };
  function top(sl) { return '<div class="top"><div class="kick">' + R(sl.kick) + '</div><div class="brand">에이플러스에셋</div></div><h1>' + R(sl.h1) + '</h1>'; }
  function body(sl) {
    var d = sl.data || {}, k = sl.kind, h = '';
    if (k === 'money') {
      var rows = d.rows || [], tot = rows.map(function (r) { var s = 0; (r.segs || []).forEach(function (g) { s += (+g.v || 0); }); return s; });
      var mx = Math.max.apply(null, tot.concat([1]));
      h += '<div class="grow" style="margin-top:22px">';
      rows.forEach(function (r, i) {
        h += '<div class="mrow"><div class="lb">' + R(r.label) + '<small>' + R(r.sub) + ' · ' + won(tot[i]) + '원</small></div><div class="bars">';
        (r.segs || []).forEach(function (g) {
          var w = Math.max(6, (+g.v || 0) / mx * 100);
          h += '<div style="width:' + w.toFixed(1) + '%;background:' + (SEG_C[g.c] || SEG_C.blue) + '">' + R(g.t) + '<b>' + won(+g.v || 0) + '</b></div>';
        });
        h += '</div></div>';
      });
      if (d.punch) h += '<div class="punch"><div class="num">' + R(d.punch.num) + '<small>' + R(d.punch.unit) + '</small></div><p>' + R(d.punch.text) + '</p></div>';
      return h + '</div>';
    }
    if (k === 'zero3') {
      h += '<div class="grow k3" style="margin-top:24px">';
      (d.cards || []).slice(0, 3).forEach(function (c) {
        h += '<div class="kc"' + (c.hl ? ' style="border:2px solid #e9c46a;background:#fffbf0"' : '') + '><div class="ic">' + esc(c.ic) + '</div><h3>' + R(c.title) + '</h3>' +
          '<div class="fromto">' + (c.from ? '<s>' + R(c.from) + '</s><span class="ar">→</span>' : '') + '<b' + (c.from ? '' : ' class="g"') + '>' + R(c.to) + '</b></div>' +
          '<div class="what">' + R(c.what) + '</div>' + (c.sub ? '<div class="sub">' + R(c.sub) + '</div>' : '') + '</div>';
      });
      return h + '</div>';
    }
    if (k === 'col3') {
      var box = function (b, cls) { b = b || {}; return '<div class="cbox ' + cls + '"><h3>' + R(b.t) + '</h3><ul>' + (b.items || []).map(function (x) { return '<li>' + R(x.t) + (x.s ? '<small>' + R(x.s) + '</small>' : '') + '</li>'; }).join('') + '</ul>' + (cls === 'cb-out' && d.alt ? '<div class="note warn" style="font-size:15.5px;margin-top:12px;padding:10px 12px">' + R(d.alt) + '</div>' : '') + '</div>'; };
      return '<div class="grow col3" style="margin-top:20px">' + box(d.same, 'cb-same') + box(d.plus, 'cb-new') + box(d.minus, 'cb-out') + '</div>';
    }
    if (k === 'ex3') {
      h += '<div class="grow ex3" style="margin-top:22px">';
      (d.cards || []).slice(0, 3).forEach(function (c) {
        h += '<div class="exc"><div class="hd"><div class="ic">' + esc(c.ic) + '</div><h3>' + R(c.title) + '</h3></div><div class="bd">' +
          (c.rows || []).map(function (r) { return '<div>' + R(r[0]) + '<b>' + R(r[1]) + '</b></div>'; }).join('') + '</div>' +
          '<div class="tot"><span>' + R(c.total_label || '받는 돈') + '</span><b>' + R(c.total) + '</b></div>' + (c.foot ? '<div class="ft">' + R(c.foot) + '</div>' : '') + '</div>';
      });
      return h + '</div>';
    }
    if (k === 'chk6') {
      return '<div class="grow chk6" style="margin-top:22px">' + (d.items || []).slice(0, 6).map(function (x) { return '<div><span class="i">' + esc(x.ic) + '</span><span><b>' + R(x.title) + '</b><p>' + R(x.text) + '</p></span></div>'; }).join('') + '</div>';
    }
    if (k === 'table') {
      var hi = d.hi || [];
      h += '<div class="grow" style="margin-top:16px"><table class="t3"><tr>' + (d.head || []).map(function (x) { return '<th>' + R(x) + '</th>'; }).join('') + '</tr>';
      (d.rows || []).forEach(function (r, i) { h += '<tr' + (hi.indexOf(i) >= 0 ? ' class="money"' : '') + '>' + r.map(function (x) { return '<td>' + R(x) + '</td>'; }).join('') + '</tr>'; });
      return h + '</table>' + (d.note ? '<div class="note" style="margin-top:14px">' + R(d.note) + '</div>' : '') + '</div>';
    }
    if (k === 'years') {
      var B = d.bars || [];
      h += '<div class="grow" style="margin-top:18px"><div class="yb" style="--n:' + Math.max(1, B.length) + ';height:340px">';
      B.forEach(function (b) { var p = Math.max(4, Math.min(100, +b.pct || 0)); h += '<div class="c ' + esc(b.tone || '') + '"><div class="v">' + R(b.v) + '</div><div class="bar" style="height:' + (p * 0.8).toFixed(0) + '%"></div><div class="l">' + R(b.l) + '<small>' + R(b.sub) + '</small></div></div>'; });
      return h + '</div>' + (d.note ? '<div class="note warn" style="margin-top:14px">' + R(d.note) + '</div>' : '') + '</div>';
    }
    if (k === 'timeline') {
      var P = (d.pts || []).slice(0, 7);
      h += '<div class="grow"><div class="tl" style="--n:' + Math.max(1, P.length) + '">';
      P.forEach(function (p) { h += '<div class="p ' + esc(p.tone || '') + '"><div class="dot"></div><div class="age">' + R(p.age) + '<small>' + R(p.unit || '') + '</small></div><h3>' + R(p.title) + '</h3><p>' + R(p.text) + '</p></div>'; });
      return h + '</div>' + (d.note ? '<div class="note" style="margin-top:26px">' + R(d.note) + '</div>' : '') + '</div>';
    }
    if (k === 'cards') {
      var C = (d.cards || []).slice(0, 3);
      h += '<div class="grow cards ' + (C.length === 2 ? 'c2' : 'c3') + '" style="margin-top:22px">';
      C.forEach(function (c) { h += '<div class="card" style="display:flex;flex-direction:column"><div class="ic">' + esc(c.ic) + '</div><h3>' + R(c.title) + '</h3><p>' + R(c.text) + '</p>' + (c.big ? '<div style="margin-top:auto;padding-top:12px;font-size:30px;font-weight:900;color:var(--blue)">' + R(c.big) + '</div>' : '') + '</div>'; });
      return h + '</div>' + (d.note ? '<div class="note">' + R(d.note) + '</div>' : '');
    }
    if (k === 'steps') {
      var T = (d.steps || []).slice(0, 4);
      h += '<div class="grow"><div class="flow" style="grid-template-columns:repeat(' + Math.max(1, T.length) + ',1fr)">';
      T.forEach(function (s, i) { h += '<div class="st"><div class="no">' + (i + 1) + '</div><h3>' + R(s.title) + '</h3><p>' + R(s.text) + '</p></div>'; });
      h += '</div><div class="qbox"><h3>' + esc(fill('{고객}')) + '님께 여쭤볼 것</h3><ol>' + (d.qs || []).slice(0, 3).map(function (q) { return '<li>' + R(q) + '</li>'; }).join('') + '</ol></div></div>';
      return h;
    }
    return '<div class="grow"><div class="note">' + R(JSON.stringify(d)) + '</div></div>';
  }
  function slideHtml(sl, i, n) {
    var a = ' data-say="' + esc(fill(sl.say)) + '" data-tip="' + esc(fill(sl.tip)) + '"';
    if (sl.kind === 'cover') {
      var d = sl.data || {};
      return '<section class="sl cover"' + a + '><div class="brand">에이플러스에셋</div><div class="kick">' + R(sl.kick || d.kick) + '</div>' +
        '<h1>' + R(sl.h1 || d.h1) + '</h1><div class="lead">' + R(d.lead) + '</div>' +
        '<div class="ico3">' + (d.chips || []).slice(0, 4).map(function (c) { return '<span>' + R(c) + '</span>'; }).join('') + '</div>' +
        '<div class="who">담당<b>' + esc(S.who || '') + '</b></div></section>';
    }
    return '<section class="sl"' + a + '>' + top(sl) + body(sl) + '<div class="src">' + R(sl.src) + '</div><div class="pn">' + (i + 1) + '</div></section>';
  }
  function deckHtml(plan, client) {
    var n = plan.slides.length, title = fill(plan.title || '{고객}님 상담 설명자료');
    var sl = plan.slides.map(function (s, i) { return slideHtml(s, i, n); }).join('\n');
    return '<!doctype html><html lang="ko" data-theme="light"><head><meta charset="utf-8"><meta name="color-scheme" content="light"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(title) + '</title>' +
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">' +
      '<style>' + DECK_CSS + '.brand{font-weight:800;font-size:15px;color:#1d3a8a}.cover .brand{position:absolute;top:40px;right:56px;background:#fff;padding:8px 14px;border-radius:10px}' + (client ? '#cheat,#drawer{display:none!important}' : '') + '</style></head><body><div id="stage">' + sl + '</div>' +
      (client ? '' : '<aside id="drawer"><h4>대본 · <span id="dno"></span></h4><div id="dsay"></div><div class="tip" id="dtip"></div></aside>') +
      '<div id="nav"><button onclick="go(cur-1)">◀</button>' + (client ? '' : '<button onclick="toggleD()">대본 (S)</button>') + '<button onclick="fs()">전체화면 (F)</button><button onclick="go(cur+1)">▶</button></div>' +
      (client ? '' : '<div id="cheat"></div>') +
      '<script>' + DECK_JS.replace('%%TITLE%%', esc(title).replace(/'/g, '\\\'')) + '<\/script></body></html>';
  }
  var DECK_JS = [
    "var S=[].slice.call(document.querySelectorAll('.sl')),cur=0;",
    "function $i(i){return document.getElementById(i)}",
    "function fit(){var k=Math.min(innerWidth/1280,(innerHeight-8)/720)*.97;S.forEach(function(s){s.style.zoom=k})}",
    "function go(i){cur=Math.max(0,Math.min(S.length-1,i));S.forEach(function(s,j){s.classList.toggle('on',j===cur)});if($i('dno')){$i('dno').textContent=(cur+1)+' / '+S.length;$i('dsay').textContent=S[cur].dataset.say||'';$i('dtip').textContent=S[cur].dataset.tip?'💡 '+S[cur].dataset.tip:''}}",
    "function toggleD(){var d=$i('drawer');if(d)d.classList.toggle('on')}",
    "function fs(){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}",
    "addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key===' '||e.key==='PageDown')go(cur+1);else if(e.key==='ArrowLeft'||e.key==='PageUp')go(cur-1);else if(e.key==='s'||e.key==='S')toggleD();else if(e.key==='f'||e.key==='F')fs()});",
    "addEventListener('resize',fit);",
    "$i('stage').addEventListener('click',function(e){if(e.target.closest('button'))return;go(e.clientX>innerWidth/2?cur+1:cur-1)});",
    "var ch=$i('cheat');if(ch){var H=document.createElement('h2');H.textContent='%%TITLE%% · 상담 대본';ch.appendChild(H);S.forEach(function(s,i){var h=s.querySelector('h1'),d=document.createElement('div'),b=document.createElement('b'),p=document.createElement('div');d.className='it';b.textContent=(i+1)+'장 · '+(h?h.textContent:'');p.textContent=s.dataset.say||'';d.appendChild(b);d.appendChild(p);if(s.dataset.tip){var t=document.createElement('i');t.textContent='💡 '+s.dataset.tip;d.appendChild(t);}ch.appendChild(d);});}",
    "addEventListener('beforeprint',function(){S.forEach(function(s){s.style.zoom=''})});addEventListener('afterprint',fit);",
    "fit();go(0);"
  ].join('\n');
  var DECK_CSS = ":root{--navy:#14306e;--blue:#1d4ed8;--sky:#e8efff;--gold:#b8892b;--goldbg:#fbf4e4;--ink:#111827;--sub:#4b5563;--mute:#6b7280;--line:#e5e7eb;--bg:#eef1f7;--red:#c2410c;--redbg:#fff1e8;--green:#047857;--greenbg:#e7f7ef}*{box-sizing:border-box;margin:0;padding:0}html,body{background:var(--bg);color:var(--ink);font-family:\"Pretendard Variable\",Pretendard,\"Malgun Gothic\",sans-serif;letter-spacing:-.02em;word-break:keep-all}#stage{position:fixed;inset:0;display:flex;align-items:center;justify-content:center}.sl{width:1280px;height:720px;background:#fff;position:relative;padding:50px 64px 44px;display:none;flex-direction:column;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,.14);border-radius:6px}.sl.on{display:flex}.top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.kick{font-size:17px;font-weight:800;color:var(--gold);letter-spacing:.02em}.brand{display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:15px;color:#1d3a8a;white-space:nowrap}h1{font-size:40px;line-height:1.25;font-weight:800;color:var(--navy);letter-spacing:-.035em}h1 em{font-style:normal;color:var(--blue)}.lead{font-size:20px;color:var(--sub);margin-top:8px;line-height:1.5}.pn{position:absolute;right:28px;bottom:16px;font-size:13px;color:var(--mute)}.src{position:absolute;left:64px;bottom:16px;font-size:12.5px;color:var(--mute)}.grow{flex:1;min-height:0}b.k{color:var(--blue)}.red{color:var(--red)}.grn{color:var(--green)}.cover{background:linear-gradient(135deg,#0f2557 0%,#14306e 55%,#1e3f8f 100%);color:#fff;justify-content:center}.cover .brand{position:absolute;top:40px;right:56px;color:#fff;background:#fff;padding:8px 14px;border-radius:10px;color:#1d3a8a}.cover .kick{color:#e9c46a;font-size:20px}.cover h1{color:#fff;font-size:64px;margin-top:14px}.cover h1 em{color:#ffd36b}.cover .lead{color:#dbe4ff;font-size:24px;margin-top:20px}.cover .who{position:absolute;left:64px;bottom:44px;font-size:18px;color:#c9d6ff}.cover .who b{color:#fff;font-size:22px;margin-left:6px}.ico3{display:flex;gap:14px;margin-top:40px}.ico3 span{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);padding:10px 20px;border-radius:999px;font-size:20px;font-weight:700}.cards{display:grid;gap:18px}.c3{grid-template-columns:repeat(3,1fr)}.c2{grid-template-columns:1fr 1fr}.card{background:#f8faff;border:1px solid #dfe6f5;border-radius:16px;padding:22px 24px}.card .ic{font-size:40px;line-height:1}.card h3{font-size:25px;margin:12px 0 8px;color:var(--navy)}.card p{font-size:18.5px;line-height:1.55;color:#374151}.note{margin-top:16px;background:var(--goldbg);border-left:5px solid var(--gold);padding:14px 18px;border-radius:8px;font-size:19px;line-height:1.5}.warn{background:var(--redbg);border-left-color:var(--red)}table{width:100%;border-collapse:collapse;font-size:17.5px}th{background:var(--navy);color:#fff;font-weight:700;padding:9px 12px;text-align:left}td{padding:8px 12px;border-bottom:1px solid var(--line);vertical-align:middle;line-height:1.35}td.n{font-weight:700;color:#1f2937;white-space:nowrap}tr.hi td{background:#fff8e6}td.bef{color:var(--sub)}td.aft{font-weight:700;color:var(--ink)}.up{display:inline-block;font-size:13px;font-weight:800;color:#fff;background:var(--green);padding:2px 8px;border-radius:999px;margin-left:6px;vertical-align:2px}.dn{background:var(--red)}.same{background:#9ca3af}.pill{display:inline-block;padding:4px 12px;border-radius:999px;font-size:15px;font-weight:800}.p-ok{background:var(--greenbg);color:var(--green)}.p-half{background:#fff4d6;color:#a16207}.p-no{background:var(--redbg);color:var(--red)}.big0{font-size:72px;font-weight:900;color:var(--red);line-height:1}.bign{font-size:44px;font-weight:900;color:var(--navy);line-height:1.1}.kv{display:flex;flex-direction:column;gap:9px}.kv div{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px dashed #d6dbe6;padding:4px 0;font-size:18.5px}.kv div b{font-size:20px;color:var(--navy)}.ba{display:grid;grid-template-columns:330px 1fr;gap:22px}.bef-box{background:#f3f4f6;border-radius:16px;padding:22px;display:flex;flex-direction:column}.aft-box{background:#f5f8ff;border:2px solid #c9d7fb;border-radius:16px;padding:20px 24px}.tag{font-size:15px;font-weight:800;letter-spacing:.04em;margin-bottom:10px}.bef-box .tag{color:var(--mute)}.aft-box .tag{color:var(--blue)}.list{display:grid;gap:8px}.li{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:baseline;font-size:18px;border-bottom:1px solid #e3e9f7;padding:5px 0}.li b{font-size:20px;color:var(--navy);white-space:nowrap}.li small{display:block;font-size:14.5px;color:var(--mute);margin-top:2px}.grp{font-size:15px;font-weight:800;color:var(--gold);margin:6px 0 0}.mx td{padding:6px 12px;font-size:17px}.mx .g td{background:#f1f4fb;font-weight:800;color:var(--navy);font-size:15px;padding:4px 12px}.dot{display:inline-block;width:22px;height:22px;border-radius:50%;border:2.5px solid #9ca3af;vertical-align:middle}.d1{background:linear-gradient(90deg,#f59e0b 50%,#fff 50%);border-color:#f59e0b}.d2{background:var(--green);border-color:var(--green)}.d0{background:#fff}.mx td.c{text-align:center;width:90px}.mx td.arr{text-align:center;color:#9ca3af;width:30px}.wf{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;align-items:end;height:330px;margin-top:10px}.wf .col{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}.wf .bar{width:100%;border-radius:10px 10px 4px 4px}.wf .v{font-size:19px;font-weight:800;margin-bottom:6px;white-space:nowrap}.wf .l{font-size:16px;color:var(--sub);text-align:center;margin-top:8px;line-height:1.3;min-height:42px}.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:8px}.st{background:#f8faff;border:1px solid #dfe6f5;border-radius:16px;padding:20px}.st .no{width:38px;height:38px;border-radius:50%;background:var(--navy);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:19px}.st h3{font-size:21px;margin:12px 0 6px;color:var(--navy)}.st p{font-size:17px;line-height:1.5;color:#374151}.chk{display:grid;grid-template-columns:1fr 1fr;gap:12px 22px}.chk div{font-size:18px;line-height:1.5;padding:12px 16px;background:#fafafa;border:1px solid var(--line);border-radius:12px}.chk div b{display:block;color:var(--navy);font-size:19px;margin-bottom:2px}#drawer{position:fixed;right:0;top:0;bottom:0;width:420px;background:#0f172a;color:#e2e8f0;padding:24px;transform:translateX(100%);transition:.25s;overflow:auto;z-index:9;font-size:17px;line-height:1.7}#drawer.on{transform:none}#drawer h4{color:#fbbf24;margin-bottom:10px;font-size:15px}#drawer .tip{margin-top:14px;padding-top:12px;border-top:1px solid #334155;color:#94a3b8;font-size:15px}#nav{position:fixed;left:50%;bottom:10px;opacity:.3;transition:opacity .2s;transform:translateX(-50%);display:flex;gap:8px;z-index:8}#nav:hover{opacity:1}#nav button{border:0;background:rgba(15,23,42,.75);color:#fff;font-size:14px;padding:7px 13px;border-radius:999px;cursor:pointer;font-family:inherit}#cheat{display:none}@media print{@page{size:A4 landscape;margin:0}@page port{size:A4 portrait;margin:14mm 14mm}html,body{background:#fff}#stage{position:static;display:block}.sl{display:flex!important;zoom:.876!important;margin:90px auto 0;box-shadow:none;border-radius:0;break-after:page;page-break-after:always;-webkit-print-color-adjust:exact;print-color-adjust:exact}#nav,#drawer{display:none!important}#cheat{display:block;page:port;font-size:12.5pt;line-height:1.65}#cheat h2{font-size:17pt;color:#14306e;margin-bottom:8pt}#cheat .it{break-inside:avoid;border-bottom:1px solid #ddd;padding:7pt 0}#cheat .it b{color:#14306e}#cheat .it i{display:block;font-style:normal;color:#666;font-size:11pt;margin-top:2pt}}.cover h1{font-size:60px}.mrow{display:grid;grid-template-columns:120px 1fr;align-items:center;gap:18px;margin-top:14px}.mrow .lb{font-size:24px;font-weight:800;color:var(--navy)}.mrow .lb small{display:block;font-size:15px;color:var(--mute);font-weight:600}.bars{display:flex;height:104px;gap:4px}.bars div{border-radius:10px;display:flex;flex-direction:column;justify-content:center;padding:0 14px;color:#fff;font-weight:800;font-size:17px;line-height:1.2;white-space:nowrap;overflow:hidden}.bars div b{font-size:28px}.b-old{background:#9ca3af}.b-car{background:#1d4ed8}.b-home{background:#0e7490}.b-care{background:#b8892b}.brace{display:grid;grid-template-columns:120px 1fr;gap:18px;margin-top:6px}.brace .in{display:flex;gap:4px}.brace .in div{font-size:16px;font-weight:700;text-align:center;border-top:3px solid;padding-top:6px;line-height:1.35}.punch{margin-top:40px;display:flex;align-items:center;gap:26px;background:var(--navy);color:#fff;border-radius:18px;padding:22px 30px}.punch .num{font-size:54px;font-weight:900;color:#ffd36b;line-height:1;white-space:nowrap}.punch .num small{font-size:24px;color:#fff;font-weight:700;margin-left:4px}.punch p{font-size:21px;line-height:1.5;color:#dbe4ff}.punch p b{color:#fff}.k3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:6px}.kc{border-radius:20px;padding:26px 26px 22px;background:#f8faff;border:1px solid #dfe6f5;display:flex;flex-direction:column}.kc .ic{font-size:44px;line-height:1}.kc h3{font-size:26px;color:var(--navy);margin:10px 0 14px}.fromto{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}.fromto s{font-size:30px;color:#9ca3af;font-weight:800;text-decoration-thickness:3px}.fromto .ar{font-size:28px;color:#9ca3af}.fromto b{font-size:58px;font-weight:900;color:var(--blue);line-height:1.05;letter-spacing:-.04em}.fromto b.g{color:var(--green)}.kc .what{font-size:19px;color:var(--sub);margin-top:10px;line-height:1.45}.kc .sub{margin-top:auto;padding-top:14px;border-top:1px dashed #cdd6ea;font-size:18.5px;line-height:1.55;color:#374151}.kc .sub b{color:var(--navy)}.col3{display:grid;grid-template-columns:1fr 1.25fr 1fr;gap:18px}.cbox{border-radius:18px;padding:20px 22px}.cbox h3{font-size:24px;margin-bottom:16px;display:flex;align-items:center;gap:8px}.cbox ul{list-style:none;display:grid;gap:13px}.cbox li{font-size:19.5px;line-height:1.4;padding-left:20px;position:relative}.cbox li:before{content:'';position:absolute;left:2px;top:9px;width:9px;height:9px;border-radius:50%}.cbox li b{white-space:nowrap}.cb-same{background:#f3f4f6}.cb-same h3{color:#374151}.cb-same li:before{background:#9ca3af}.cb-new{background:#eef4ff;border:2px solid #c9d7fb}.cb-new h3{color:var(--blue)}.cb-new li:before{background:var(--blue)}.cb-out{background:var(--redbg)}.cb-out h3{color:var(--red)}.cb-out li:before{background:var(--red)}.cbox li small{display:block;font-size:15.5px;color:var(--mute)}.ex3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.exc{border:1px solid #dfe6f5;border-radius:20px;overflow:hidden;display:flex;flex-direction:column}.exc .hd{background:#f1f5ff;padding:18px 22px}.exc .hd .ic{font-size:34px}.exc .hd h3{font-size:23px;color:var(--navy);margin-top:6px;line-height:1.35}.exc .bd{padding:20px 22px;display:grid;gap:14px;font-size:19.5px}.exc .bd div{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #eef1f6;padding-bottom:6px}.exc .bd div b{color:var(--navy);white-space:nowrap}.exc .tot{margin-top:auto;background:var(--navy);color:#fff;padding:14px 22px;display:flex;justify-content:space-between;align-items:baseline}.exc .tot span{font-size:16px;color:#c9d6ff}.exc .tot b{font-size:40px;color:#ffd36b;font-weight:900}.exc .ft{padding:10px 22px 14px;font-size:14.5px;color:var(--mute);line-height:1.45}.chk6{display:grid;grid-template-columns:1fr 1fr;gap:14px 20px}.chk6 div{display:grid;grid-template-columns:56px 1fr;gap:14px;align-items:center;background:#fafafa;border:1px solid var(--line);border-radius:16px;padding:16px 22px}.chk6 .i{font-size:42px;line-height:1.1}.chk6 b{display:block;font-size:23px;color:var(--navy);margin-bottom:6px}.chk6 p{font-size:18.5px;line-height:1.5;color:#374151}.flow{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:8px}.flow .st{position:relative}.flow .st:not(:last-child):after{content:'→';position:absolute;right:-17px;top:50%;transform:translateY(-50%);font-size:26px;color:#9ca3af}.qbox{margin-top:34px;background:var(--goldbg);border-radius:18px;padding:22px 28px}.qbox h3{font-size:19px;color:var(--gold);margin-bottom:10px}.qbox ol{padding-left:26px;display:grid;gap:10px;font-size:23px;line-height:1.45}.cover .pn{color:#8ea2d8}.lgd{display:flex;gap:22px;margin:10px 0 0 138px;font-size:17px;color:var(--sub);font-weight:700}.lgd i{display:inline-block;width:16px;height:16px;border-radius:4px;vertical-align:-2px;margin-right:6px}.b-etc{background:#cbd5e1;color:#334155!important}.b-grn{background:var(--green)}.b-navy{background:var(--navy)}.t3{font-size:20px}.t3 th{text-align:center;font-size:20px;padding:11px 10px}.t3 th:first-child{text-align:left;width:190px}.t3 th small{display:block;font-size:15px;font-weight:600;color:#c9d6ff}.t3 td{padding:12px;text-align:center;line-height:1.35}.t3 td:first-child{text-align:left;font-weight:800;color:var(--navy)}.t3 td b{color:var(--blue)}.t3 td small{display:block;font-size:16px;color:var(--mute)}.t3 td.no,.t3 td.no small{color:#9ca3af}.t3 td.bad,.t3 td.bad small{color:var(--red)}.t3 tr.money td{background:#f5f8ff;font-weight:800}.yb{display:grid;grid-template-columns:repeat(var(--n,10),1fr);gap:12px;align-items:end;height:360px}.yb .c{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}.yb .v{font-size:20px;font-weight:800;margin-bottom:6px;white-space:nowrap}.yb .bar{width:100%;border-radius:8px 8px 3px 3px;background:#9ca3af}.yb .l{font-size:17px;color:var(--sub);margin-top:8px;text-align:center;line-height:1.25;font-weight:700}.yb .l small{display:block;font-size:14.5px;font-weight:500;color:var(--mute)}.yb .lo .bar{background:#f2a27c}.yb .lo .v{color:var(--red)}.yb .ok .bar{background:var(--green)}.yb .ok .v{color:var(--green)}.yb .tp .bar{background:var(--navy)}.yb .tp .v{color:var(--navy)}.eq{display:grid;grid-template-columns:1fr 60px .8fr 60px 1.25fr;align-items:center;margin-top:10px}.eq .op{font-size:48px;font-weight:900;color:#9ca3af;text-align:center}.eq .bx{background:#f8faff;border:1px solid #dfe6f5;border-radius:22px;padding:48px 24px;text-align:center}.eq .bx.hl{background:var(--navy);border-color:var(--navy);color:#fff}.eq .bx .t{font-size:22px;color:var(--sub);font-weight:700}.eq .bx.hl .t{color:#c9d6ff}.eq .bx .n{font-size:66px;font-weight:900;color:var(--navy);line-height:1.15;margin:8px 0 6px;letter-spacing:-.04em}.eq .bx.hl .n{color:#ffd36b}.eq .bx .s{font-size:20px;color:var(--sub)}.eq .bx.hl .s{color:#dbe4ff}.tl{position:relative;display:grid;grid-template-columns:repeat(var(--n,5),1fr);margin-top:40px}.tl:before{content:'';position:absolute;left:4%;right:4%;top:32px;height:6px;border-radius:3px;background:#cbd5e1}.tl .p{position:relative;text-align:center;padding:0 4px}.tl .dot{width:38px;height:38px;border-radius:50%;background:#fff;border:7px solid var(--navy);margin:16px auto 14px}.tl .p.g .dot{border-color:var(--green)}.tl .p.y .dot{border-color:var(--gold)}.tl .p.r .dot{border-color:var(--red)}.tl .age{font-size:40px;font-weight:900;color:var(--navy);line-height:1}.tl .age small{font-size:17px;font-weight:700}.tl h3{font-size:23px;margin-top:10px;color:var(--ink)}.tl p{font-size:18px;color:var(--sub);line-height:1.4;margin-top:4px}";

  /* ── 등록 — 화면 한 줄 · 머리띠 한 줄 ── */
  function mount() {
    if (typeof CUSTOM === 'undefined') return false;
    CUSTOM.unshift({ tab: TAB, render: function () { return '<div id="bapdPage">' + page() + '</div>'; } });
    if (typeof TAB_ELSEWHERE !== 'undefined') {
      TAB_ELSEWHERE.bapd = { html: function () { return css() + swHtml('bapd'); } };
      TAB_ELSEWHERE.bojang = { html: function () { return css() + swHtml('bojang'); } };
    }
    if (typeof TAB_META !== 'undefined' && !TAB_META.bapd) {
      TAB_META.bapd = { tag: '보장분석 전&후 만들기', title: '제안서 설명자료', desc: '보장분석·제안서를 넣으면 컨셉을 잡고 16:9 설명자료(대본 포함)를 만듭니다.' };
    }
    return true;
  }
  /* 점검(check-bapd)이 안을 들여다보는 문 — 화면은 이걸 쓰지 않는다 */
  window.bapdT = { audit: audit, deck: deckHtml, S: S, brain: BAPD_BRAIN, sw: swHtml, kakao: kakaoHtml, out: outHtml, said: BAPD_SAID, maxpr: BAPD_MAXPR, kk: BAPD_KAKAO };
  if (!mount()) document.addEventListener('DOMContentLoaded', mount);
})();
