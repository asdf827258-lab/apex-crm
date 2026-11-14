/* ══════════════════════════════════════════════════════════════════
   🌱 <b>성장</b> — 입사부터 경력자까지 한 길로 (판 X409)

   사장님 말씀 (2026-11-10) — 「교육 내용들이 너무 적나라하게 흩어져 있어서
   입사부터, 과정, 경력자까지 레벨업이 되도록 … 교육이나 지식에 관련된
   엄청난 내용들 싹 정리해서 하나로 만들고, <b>단순화</b>하는 과정과
   <b>숙지</b>하는 과정을 「성장」 칸이라는 아래 다 만들고 정리」.

   ── 재어 보고 안 것 ───────────────────────────────────────────────
   ① 과정이 <b>셋</b>인데 서로 모른다 — APEX 마스터 과정(14일 · 앱),
      90일 아카데미(12주 · 영업 · 메뉴 이름은 「APEX 본인 점검란」 이었다),
      보험 마스터 아카데미(L0~L10 · 지식). 진도도 「다음은 여기」 도 따로였다.
   ② 숙지하는 틀은 <b>이미 있었다</b> — 성장판 안 「배워서 터치할 것」
      열두 주제(GB_CUR) · 교재 장 잇기(GB_ACAD) · 스스로 합격(gbStamp).
      숨은 화면 안에 있어 아무도 못 봤다. <b>새로 만들지 않고</b> 꺼내 쓴다 (5번).
   ③ 지식은 서랍 다섯 갈래(증권 분석 · 상담 도구 · 계약·청구 · 자료 조회 ·
      법인)와 교재 안쪽 장(수술분류표 · 치료비 DB · 용어 사전 …)에 흩어져 있다.

   ── 그래서 네 장 — <b>쓰는 법</b>으로 나눈다 ───────────────────────
     🪜 한 길   (순서대로) — 한 번 걸어 지나가는 과정. 내 레벨 하나만 펴고 「지금 할 것 하나」 만.
     🔁 익히기  (숙지)     — 읽는다 → 그날 한 명에게 써 본다 → 30초에 말하면 합격.
     🧰 매번    (찾아 쓰기) — 지나간 뒤에도 그때그때 꺼내는 것. 주제가 아니라 <b>「언제 펴나」</b>로.
     🤝 고객 앞 (같이 보기) — 고객과 같이 보는 것만, <b>상담 순서대로</b>. 꺼내지 않을 것도 적는다.
   사장님 말씀 (2026-11-11) — 「어떻게 분리했는지 그 이유와 설계사들이 어떻게 성장하는지 …
   고객에게 필요한 내용들을 선별해서 … 순차적으로 성장 가능하고 매번 사용할 수 있는 것들에 분류까지」.
   ★ 한 화면은 「매번」 과 「고객 앞」 중 <b>한쪽</b>에만 — 한 길의 걸음은 어느 쪽으로 넘어가는지
     꼬리표(grUseOf)를 답니다. 「왜 이렇게 나눴나」 는 한 길 맨 밑에 접어 둡니다(grWhyHtml).

   ★ <b>화면을 옮기지 않는다</b> (6번) — 현장에서 쥐는 것은 제자리에 두고
     여기서는 문만 연다. 이름은 메뉴 표(TABS)에서, 90일 구간은 AC_ROAD 에서,
     열두 주제는 GB_CUR 에서 꺼낸다. 옮겨 적지 않는다 (5번).
   ★ <b>못 여는 화면은 안 세운다</b> — navItemOf 가 등급으로 거른다 (1번).
   ★ 진도(내 레벨 · 체크)는 <b>이 브라우저</b>에만. 합격 도장만 성장판과
     같은 자리(daily_checks · scope pass)에 남는다 — 두 벌 두지 않는다.
   ★ 서버는 합격 도장 한 줄을 <b>처음 한 번</b>만 읽는다 (7번).
   ══════════════════════════════════════════════════════════════════ */

var GR_KEY='apex_grow_v1';
var GR={tab:'path',q:'',pass:null,passBusy:false,passTried:false};

/* 교재(보험 마스터 아카데미) 장 이름 — 교재 data1/data2 · EXTRA 의 title 그대로.
   check-edu 가 교재 원본과 맞대 봅니다. 다르면 그 자리에서 웁니다. */
var GR_ACAD={
  L0:'보험을 파는 사람 vs 위험을 관리하는 사람',
  L1:'아플 때 돈은 어디서 새는가',
  L2:'실손의료보험 완전정복',
  L3:'진단비 — 암 · 뇌 · 심장',
  L4:'치료비 — 항암 · 방사선 · 주요치료비',
  L5:'수술비 — 종수술비 · N대수술비 · 복층설계',
  L6:'입원 · 간병 · 후유장해',
  L7:'생활 담보 — 운전자 · 배상책임 · 치아 · 태아 · 유병자',
  L8:'보상 실무 — 고지 · 면책 · 청구 · 분쟁',
  L9:'저축 · 연금 · 세금 기초',
  L10:'종합 설계 — 5단계 프로세스와 표준 포트폴리오',
  TEST:'테스트 · 사람별',
  CASE:'케이스 스터디',
  CARD:'화법 전체 카드',
  SURG:'1~5종 수술분류표',
  DB:'실제 치료비 DB',
  TERMS:'용어 사전',
  HEALTH:'헬스케어 서비스',
  GUIDE:'운영 · 활용 가이드'
};

/* ── 🪜 한 길 — 레벨 다섯 ───────────────────────────────────────────
   걸음 하나는 넷 중 하나입니다 —
     {go:'화면 id'}   메뉴의 그 화면
     {acad:'L3'}      교재의 그 장
     {road:2}         90일 아카데미의 그 구간 (AC_ROAD — 끝 기준도 거기서)
     {tab:'learn'}    이 화면의 익히기 장
   d 는 「무엇을 하나」 한 줄. 끝 기준 숫자는 <b>원래 표에 있는 것만</b> 씁니다. */
var GR_LV=[
 {t:'입사 첫 주',s:'길 익히기',
  goal:'앱에서 길을 잃지 않고, 거절이 왜 무서운지 먼저 안다.',
  st:[
   {go:'manual',    d:'앱 전체를 한 번 훑는다 — 외우지 말고 어디에 무엇이 있는지만.'},
   {go:'apexmaster',d:'하루 한 장씩 실제로 만들어 본다. 첫 주는 1~7일차.'},
   {go:'rej_gym',   d:'화법보다 마음 먼저 — 왜 거절이 싫은지, 「스스로 점검」까지.'},
   {acad:'L0',      d:'교재를 여는 첫 장 — 이 교재를 쓰는 법.'},
   {acad:'L1',      d:'급여 · 비급여 · 직접손실 · 간접손실.'}
  ]},
 {t:'1개월',s:'첫 전화 · 첫 상담',
  goal:'연락이 상담으로 이어진다 — 90일 아카데미 첫 두 구간.',
  st:[
   {road:0},
   {go:'ta_train',  d:'무사고 할인 전환 전화 · 보장분석 DB 스크립트 6단계.'},
   {go:'ta_say',    d:'처음부터 거절처리까지 소리 내어. 실제 전화는 ☎️ TA 스크립트를 띄워 놓고.'},
   {road:1},
   {go:'jiin_grow', d:'지인 명단이 있으면 — 찾아줌에서 보장분석으로 넘어가는 8주.'},
   {acad:'L2',      d:'모든 상담의 출발점.'},
   {acad:'L3',      d:'질병코드로 담보 범위를 읽는다.'}
  ]},
 {t:'2~3개월',s:'풀컨셉 설계 · 졸업',
  goal:'상품 설명이 아니라 삶의 순서를 설계한다 — 90일 아카데미 남은 구간.',
  st:[
   {road:2},
   {acad:'L4',d:'진단 뒤에 실제로 돈이 나가는 곳.'},
   {acad:'L5',d:'평생 가장 자주 쓰이는 담보.'},
   {acad:'L6',d:'치료가 길어질 때 무너지는 지점.'},
   {road:3},
   {go:'fp_talk',d:'상황을 고르면 그 장이 열린다 — 서른 장을 다 외우지 않는다.'},
   {acad:'L9',d:'보장 다음의 대화를 여는 법.'},
   {road:4},
   {road:5},
   {acad:'L7',d:'계약을 완성시키는 마지막 조각.'},
   {acad:'L8',d:'계약을 지키는 기술.'},
   {acad:'L10',d:'배운 것을 한 장으로 조립한다.'},
   {road:6}
  ]},
 {t:'경력자',s:'매달 갱신 · 깊이',
  goal:'과정이 아니라 루틴 — 달마다 상품이 바뀌고, 만나는 고객 층이 넓어진다.',
  st:[
   {go:'insight',   d:'소식지가 나오면 이번 달 결론 · 추천 순위 · 약관 비교부터.'},
   {tab:'learn',    d:'열두 주제를 스스로 합격 — 종이 없이, 고객 앞에서, 30초 안에.'},
   {acad:'TEST',    d:'사람별 테스트로 빈 곳을 찾는다.'},
   {acad:'CASE',    d:'증권 → 담보 지도 → 구멍 진단 → 제안까지 끝까지 푼다.'},
   {go:'mikki_talk',d:'기존 · 거절 고객에게 다시 말을 거는 물꼬.'},
   {go:'biz_diag',  d:'대표 · 사업자 고객으로 넓힐 때.'},
   {go:'mycoach',   d:'받은 코칭에 답하고 스스로 정리한다.'}
  ]},
 {t:'리더 · 강사',s:'가르치기 · 운영',
  goal:'내가 걸어온 길을 팀에 깔아 준다.',
  st:[
   {go:'bcd_lec',   d:'강사 「내 이야기」 와 타임라인을 채워야 완성되는 4시간 강의.'},
   {go:'growboard', d:'팀이 어디서 새는지, 잘하는 사람과 무엇이 다른지.'},
   {go:'teamhub',   d:'오늘 체크 · 이번 주 · 업무 루트.'},
   {acad:'GUIDE',   d:'교재를 교육에 쓰는 법 — 교육 담당자용.'},
   {go:'emcenter',  d:'팀 업적 · 시책 · 주간 마감.'},
   {go:'educal',    d:'신입 교육 주간 · 팀별 교육 · 운영표 — 위 레벨 일정을 여기서 짠다.'}
  ]}
];

/* ── 🧰 매번 — 설계사가 <b>그때그때 꺼내 쓰는</b> 것 ─────────────────────
   한 길(과정)은 한 번 걸어 지나갑니다. 여기는 <b>지나간 뒤에도 매번</b> 펴는 것 —
   그래서 「무엇에 대한 것인가」 가 아니라 <b>「언제 펴나」</b> 로 묶습니다.
   ★ 한 화면은 이 표에서 <b>한 갈래에만</b> 섭니다 (두 곳이면 「어느 쪽이 맞나」 가 됩니다).
   ★ 고객과 <b>같이 보는</b> 화면은 여기 두지 않고 🤝 고객 앞(GR_CUST)에 둡니다 —
     한 화면은 「매번」 과 「고객 앞」 중 <b>한쪽</b>입니다. check-edu 가 봅니다. */
var GR_KNOW=[
 {t:'☎️ 연락하기 전',s:'전화 · 문자 직전에 펴 두는 것 — 내가 읽는 말',it:[
   {go:'ta_script',d:'통화 대본 · 거절처리'},
   {go:'ta_say',d:'처음부터 거절처리까지 — 소리 내어 한 번'},
   {go:'silson5',d:'5세대 실비 · 무사고 할인 한 장 TA'},
   {go:'mikki_talk',d:'기존 · 거절 고객에게 다시 말을 거는 물꼬'}]},
 {t:'🩺 상담 전날',s:'병 · 담보 · 약관을 미리 읽어 두는 것',it:[
   {go:'dz_guide',d:'질병마다 원인 · 치료과정 · 그 단계에서 열리는 담보 · 화법'},
   {acad:'TERMS',d:'검색해서 찾아보기'},
   {go:'ref_kcd',d:'질병코드로 특약 범위 찾기'},
   {go:'ref_surgery',d:'수술명으로 분류 찾기'},
   {acad:'SURG',d:'1~72번 원문 전량'},
   {acad:'DB',d:'실제 영수증으로 본 치료비'},
   {acad:'HEALTH',d:'보험금이 못 하는 일'}]},
 {t:'📝 상담하는 동안',s:'묻고 적고 읽어 주는 것 — 화면은 내 쪽',it:[
   {go:'fact_find',d:'상담카드 · 팩트파인딩 — 질문으로 문제를 찾는다'},
   {go:'interpret',d:'증권 문구를 사람 말로 — 신입용 가이드 상담'}]},
 {t:'✍️ 가입 · 심사 · 청구',s:'받아 줄까 · 나올까 — 서류 넣기 전에',it:[
   {go:'med_disclosure',d:'병력 · 수술 이력으로 알릴 것 거르기'},
   {go:'ref_underwrite',d:'유병자 인수 · 거절 병력'},
   {go:'med_silbi',d:'실손에서 얼마 나오나'},
   {go:'claims',d:'질병별 사례 · 지급사례'},
   {go:'ref_hidden',d:'잠자는 보험금 · 청구 시효'},
   {go:'contracts',d:'유지 · 변경 · 해지 판단'}]},
 {t:'🗣️ 보장 다음 대화',s:'저축 · 연금 · 세금으로 넘어갈 때',it:[
   {go:'fp_talk',d:'상황을 고르면 그 장이 열린다 — 화법 서른 장'},
   {go:'inv_econ',d:'금리 · 환율 · 지수 지금'}]},
 {t:'💼 대표님 고객',s:'사업자 · 법인 상담 전에',it:[
   {go:'biz_tax',d:'세금 컨설팅'},
   {go:'biz_retire',d:'퇴직금 · 연금 · IRP'},
   {go:'biz_fund',d:'정책자금'},
   {go:'biz_ins',d:'법인 보험 솔루션'}]},
 {t:'📅 매달 한 번',s:'소식지가 나오면',it:[
   {go:'insight',d:'GA 소식지 · 약관을 달마다 읽은 결론 — 설계사만 봅니다'}]},
 {t:'📕 교재 — 장별',s:'보험 마스터 아카데미 L0~L10 · 막힌 장만 다시 펴기',it:[
   {go:'bohum',d:'교재 첫 화면 — 성장 경로 · 현장 과제 · 전체 통독'},
   {acad:'L0',d:'오리엔테이션 · 이 교재를 쓰는 법'},
   {acad:'L1',d:'직접손실 · 간접손실 · 급여와 비급여'},
   {acad:'L2',d:'1세대부터 · 모든 상담의 출발점'},
   {acad:'L3',d:'질병코드로 담보 범위를 읽는 법'},
   {acad:'L4',d:'진단 이후에 실제로 돈이 나가는 곳'},
   {acad:'L5',d:'평생 가장 자주 쓰이는 담보'},
   {acad:'L6',d:'치료가 길어질 때 무너지는 지점'},
   {acad:'L7',d:'계약을 완성시키는 마지막 조각들'},
   {acad:'L8',d:'계약을 지키는 기술'},
   {acad:'L9',d:'보장 다음의 대화를 여는 법'},
   {acad:'L10',d:'배운 것을 한 장으로 조립하기'},
   {acad:'CARD',d:'교재 전 레벨의 화법 카드'}]},
 {t:'🧭 막혔을 때',s:'어디에 무엇이 있는지 모를 때',it:[
   {go:'helpme',d:'막힌 것을 적으면 순서를 짜 준다'},
   {go:'apexmap',d:'앱 전체 지도'},
   {go:'academy_notion',d:'노션 교육 자료'}]},
 {t:'✅ 매일 내 점검',s:'스스로 재고 적는 것',it:[
   {go:'ckboard',d:'오늘 할 일 체크'},
   {go:'academy',d:'90일 로드맵 · 주간 실행 · 졸업 기준을 스스로 체크'}]}
];

/* ── 🤝 고객 앞 — 고객과 <b>같이 보거나 보내는</b> 것, 상담 순서대로 ─────────
   설계사만 보는 것(대본 · 화법 · 소식지)이 고객 화면에 섞이지 않게 따로 뺐습니다.
   ★ <b>짐작으로 고르지 않았습니다</b> — 화면마다 「고객 앞에서 여는 화면」 · 「고객 손에 간다」 ·
     「고객 링크」 · 「고객 안내문」 · 「발표 모드」 처럼 <b>그 화면 스스로 고객용이라고 적은 것</b>만
     세웠습니다(2026-11-11 41개 확인). 근거를 못 찾은 것(실무 계산기 · 숨은보험금)과 결과가
     복사 · 고객 저장뿐인 것(실비 계산기 · 건강검진)은 🧰 매번에 둡니다.
   마디는 90일 아카데미의 흐름(접촉 → 팩트파인딩 → 보장 → 제안 → 사후)을 그대로 따릅니다. */
var GR_CUST=[
 {t:'① 처음 연락 · 비대면',s:'만나기 전, 고객 손에 가는 것',it:[
   {go:'saybook',d:'상황별로 보낼 문자 · 카톡 — 고르고 다듬어 보낸다'},
   {go:'utphoto',d:'비대면 상담 사진 · 그 사진과 같이 보낼 말'},
   {go:'rjnews',d:'거절했던 고객에게 안부 + 소식 카톡'},
   {go:'news_live',d:'오늘의 소식을 골라 고객에게 보낼 글로'},
   {go:'mkt_card',d:'모바일 명함 — 링크 · QR'}]},
 {t:'② 첫 만남 — 기준 세우기',s:'고객이 스스로 점검해 보게',it:[
   {go:'kijun',d:'보험의 기준 — 강의 덱 · 고객 셀프 점검 링크 · QR'}]},
 {t:'③ 보장 같이 보기',s:'지금 무엇이 있고 어디가 비었나',it:[
   {go:'sangdam',d:'보장분석 상담 덱'},
   {go:'bojang',d:'보장분석 PDF → 1:1 상담 리포트'},
   {go:'treatpay',d:'암 · 뇌 · 심장 — 어느 담보에서 얼마가 나오나'},
   {go:'wallets',d:'8통장으로 빈 곳 찾기'}]},
 {t:'④ 제안 · 비교',s:'바꾸면 무엇이 달라지나',it:[
   {go:'frmake',d:'보장 전 · 후 한 장'},
   {go:'compare',d:'제안서끼리 견주기 — PDF 로 저장'},
   {go:'ai_prop',d:'증권 · 제안서를 고객이 읽을 수 있는 설명서로'},
   {go:'onecmp',d:'보험사 보험료를 한 장에서 견주기 — 고객 링크'},
   {go:'fp_deck',d:'재무 · 보장 상담 덱'},
   {go:'finance',d:'연금 · 노후 · 목돈 · 현금흐름 · 상속 — 발표 덱'},
   {go:'katalk',d:'제안서를 고객에게 보낼 카톡 설명으로'}]},
 {t:'⑤ 계약 뒤 · 사고 · 변경',s:'계약을 지키는 것 — 고객에게 건네는 종이',it:[
   {go:'pdel',d:'증권 전달 — 고객 속지 · 안내장 · 발표 모드'},
   {go:'endorse',d:'계약 변경 — 필요서류 · 고객 안내문'},
   {go:'car_fault',d:'자동차사고 — 고객에게 건네는 안내문 인쇄'}]}
];
/* 고객 앞에 꺼내지 않는 것 — 까닭과 함께 */
var GR_CUST_NO=[
 '🧭 <b>상품전략기</b> — GA 소식지를 읽은 것입니다. 그 화면에 「판매인 교육용 · 고객 제시 불가」 라고 적혀 있습니다.',
 '☎️ <b>TA 스크립트 · TA 전체 대본 · 30초 TA</b> — 내가 읽는 전화 대본입니다. 보낼 글은 「보낼 말 모음」 에서 고릅니다.',
 '🩺 <b>질병 보험가이드</b> — 설계를 고객에게 설명하는 대본이 같이 나옵니다. 연습용입니다.',
 '🎣 <b>미끼상품&접촉전략</b> — 화법서입니다. 그 안에서 초록 딱지가 붙은 그림만 고객에게 보여 줍니다.',
 '📆 <b>4년 유지관리</b> — 수수료 이야기가 적혀 있습니다. 그 화면도 「고객에게 수수료 이야기는 하지 않습니다」 라고 합니다.',
 '📈 <b>성장판 · EM 운영센터</b> — 팀 숫자 · 업적 · 시책입니다.'
];

/* ── 저장 (이 브라우저) ── */
function grState(){
  try{ var v=JSON.parse(localStorage.getItem(GR_KEY)||'{}');
       if(v&&typeof v==='object'){ if(!v.done||typeof v.done!=='object')v.done={}; if(!(v.lv>=0))v.lv=0; return v; } }catch(e){}
  return {lv:0,done:{}};
}
function grSave(v){ try{ localStorage.setItem(GR_KEY,JSON.stringify(v)); }catch(e){} }

/* ── 걸음 하나를 읽는다 — 못 여는 것은 null (세우지 않는다) ── */
function grKey(s){
  return s.go?('go:'+s.go):(s.acad?('acad:'+s.acad):(s.road!=null?('road:'+s.road):('tab:'+s.tab)));
}
function grStep(s){
  var it,r;
  if(s.go){
    it=(typeof navItemOf==='function')?navItemOf(s.go):null;
    if(!it)return null;
    return {k:grKey(s),ic:it.icon||'•',n:it.title||s.go,d:s.d||'',open:"grOpen('go','"+s.go+"')"};
  }
  if(s.acad){
    if(!GR_ACAD[s.acad]||typeof navItemOf!=='function'||!navItemOf('bohum'))return null;
    return {k:grKey(s),ic:'📕',n:'교재 '+(/^L\d/.test(s.acad)?s.acad+' · ':'')+GR_ACAD[s.acad],
            d:s.d||'',open:"grOpen('acad','"+s.acad+"')"};
  }
  if(s.road!=null){
    r=(typeof AC_ROAD!=='undefined')?AC_ROAD[s.road]:null;
    if(!r||typeof navItemOf!=='function'||!navItemOf('academy'))return null;
    return {k:grKey(s),ic:'📈',n:'90일 아카데미 '+r.r+' · '+r.goal,d:r.focus,done:r.out,
            open:"grOpen('go','academy')",tools:r.tools||[]};
  }
  if(s.tab)return {k:grKey(s),ic:'🔁',n:'익히기 — 열두 주제',d:s.d||'',open:"grTab('"+s.tab+"')"};
  return null;
}
function grSteps(lv){
  var L=GR_LV[lv],out=[],i,x;
  if(!L)return out;
  for(i=0;i<L.st.length;i++){ x=grStep(L.st[i]); if(x)out.push(x); }
  return out;
}

/* ── 여는 문 ── */
function grOpen(k,v){
  if(k==='acad'){ if(typeof bohumAt==='function')bohumAt(v); else go('bohum'); return; }
  if(typeof osTabAllowed==='function'&&!osTabAllowed(v)){
    toast('이 화면은 아직 열려 있지 않습니다 — 대표님께 문의해 주세요');return;
  }
  go(v);
}
function grTab(t){ GR.tab=t; grPaint(); try{ window.scrollTo(0,0); }catch(e){} }
function grLv(n){ var v=grState(); v.lv=n; grSave(v); grPaint(); }
function grTick(k){
  var v=grState();
  if(v.done[k])delete v.done[k]; else v.done[k]=1;
  grSave(v); grPaint();
}

/* ── 진도 숫자 — 다른 화면이 이미 센 것을 그대로 읽는다 ── */
function grMasterN(){
  if(typeof amDone!=='function'||typeof AM_DAYS==='undefined')return null;
  var v=amDone(),i,n=0;
  for(i=0;i<AM_DAYS.length;i++)if(v[AM_DAYS[i].d])n++;
  return {n:n,of:AM_DAYS.length};
}
function grPassMap(){
  var me=(typeof gbMyId==='function')?gbMyId():null;
  if(me&&typeof GB!=='undefined'&&GB.loaded)return GB.pass[me]||{};
  return GR.pass;
}
function grPassN(){
  var m=grPassMap(),k,n=0;
  if(!m)return null;
  for(k in m)if(m[k])n++;
  return n;
}
/* 합격 도장은 성장판과 같은 줄을 씁니다. 성장판이 이미 읽었으면 안 부릅니다 (7번) */
function grPassLoad(){
  if(GR.passTried||GR.passBusy)return;
  var me=(typeof gbMyId==='function')?gbMyId():null;
  if(!me)return;
  if(typeof GB!=='undefined'&&GB.loaded){GR.passTried=true;return;}
  var sb=(typeof osClient==='function')?osClient():null;
  if(!sb){GR.passTried=true;GR.pass={};return;}
  GR.passBusy=true;
  sb.from('daily_checks').select('items').eq('member_id',me).eq('scope','pass')
    .eq('check_date','2000-01-01').limit(1)
    .then(function(r){
      GR.passBusy=false;GR.passTried=true;
      var row=(r&&r.data&&r.data[0])||null;
      GR.pass=(row&&row.items&&typeof row.items==='object')?row.items:{};
      grPaint();
    },function(){GR.passBusy=false;GR.passTried=true;GR.pass={};grPaint();});
}
function grStamp(s){
  if(typeof gbStamp!=='function'||typeof GB==='undefined'){toast('성장판을 한 번 열어 주세요');return;}
  var me=(typeof gbMyId==='function')?gbMyId():null;
  if(!me){toast('로그인해야 합격을 남길 수 있습니다',5000);return;}
  if(!GB.loaded&&!GR.pass){toast('합격 기록을 읽는 중입니다 — 잠시 뒤 눌러 주세요');return;}
  if(!GB.loaded&&!GB.pass[me])GB.pass[me]=GR.pass;
  gbStamp(s);
  if(!GB.loaded)GR.pass=GB.pass[me];
  grPaint();
}

/* ── 그리기 ── */
function grCss(){
  if(document.getElementById('grCss'))return;
  var st=document.createElement('style'); st.id='grCss';
  st.textContent=
    '.gr-seg{display:flex;gap:6px;background:var(--t-card);border-radius:var(--t-r);padding:6px;margin:0 0 12px}'+
    '.gr-seg button{flex:1;min-height:44px;border:0;border-radius:14px;background:none;font-family:inherit;'+
      'font-size:var(--t5);font-weight:800;color:var(--t-sub);cursor:pointer}'+
    '.gr-seg button.on{background:var(--t-point);color:#fff}'+
    '.gr-seg button i{display:block;font-style:normal;font-size:var(--t6);font-weight:600}'+
    '.gr-lad{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}'+
    '.gr-lad button{flex:1 0 auto;min-width:92px;min-height:56px;border:1px solid var(--t-line);border-radius:14px;'+
      'background:var(--t-card);font-family:inherit;text-align:left;padding:8px 10px;cursor:pointer;color:var(--t-ink)}'+
    '.gr-lad button b{display:block;font-size:var(--t6);color:var(--t-sub);font-weight:800}'+
    '.gr-lad button span{display:block;font-size:var(--t5);font-weight:800;white-space:nowrap}'+
    '.gr-lad button.on{background:var(--t-point);border-color:var(--t-point)}'+
    '.gr-lad button.on b,.gr-lad button.on span{color:#fff}'+
    '.gr-lad button.ok b::after{content:" ✓"}'+
    '.gr-now{background:var(--t-point-l);border-radius:var(--t-r);padding:16px;margin-top:12px}'+
    '.gr-now .k{font-size:var(--t6);font-weight:800;color:var(--t-point)}'+
    '.gr-now .n{font-size:var(--t3);font-weight:800;color:var(--t-ink);margin:4px 0;line-height:1.4}'+
    '.gr-now .d{font-size:var(--t5);color:var(--t-sub);line-height:1.55}'+
    '.gr-btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}'+
    '.gr-b{min-height:44px;padding:0 16px;border-radius:12px;border:0;font-family:inherit;font-size:var(--t5);'+
      'font-weight:800;cursor:pointer;background:var(--t-point);color:#fff}'+
    '.gr-b.ghost{background:var(--t-card);color:var(--t-ink);border:1px solid var(--t-line)}'+
    '.gr-goal{font-size:var(--t5);color:var(--t-ink);line-height:1.6;margin:2px 0 6px}'+
    '.gr-hd{font-size:var(--t4);font-weight:800;color:var(--t-ink);margin:0 0 2px}'+
    '.gr-hd i{display:block;font-style:normal;font-size:var(--t6);font-weight:600;color:var(--t-sub);margin-top:2px}'+
    '.gr-st{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--t-line)}'+
    '.gr-st:first-of-type{border-top:0}'+
    '.gr-ck{flex:none;width:44px;height:44px;border-radius:12px;border:2px solid var(--t-line);background:var(--t-card);'+
      'font-size:var(--t4);font-weight:800;color:#fff;cursor:pointer;font-family:inherit}'+
    '.gr-st.on .gr-ck{background:var(--t-pos);border-color:var(--t-pos)}'+
    '.gr-tx{flex:1;min-width:0}'+
    '.gr-tx .n{display:block;width:100%;text-align:left;background:none;border:0;padding:0;min-height:44px;'+
      'font-family:inherit;font-size:var(--t5);font-weight:800;color:var(--t-ink);cursor:pointer;line-height:1.45}'+
    '.gr-st.on .gr-tx .n{color:var(--t-sub)}'+
    '.gr-tx .d{font-size:var(--t6);color:var(--t-sub);line-height:1.55}'+
    '.gr-tx .ok{font-size:var(--t6);color:var(--t-pos);font-weight:800;margin-top:3px;line-height:1.5}'+
    '.gr-tools{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}'+
    '.gr-tool{min-height:44px;padding:0 12px;border-radius:10px;border:1px solid var(--t-line);background:var(--t-card);'+
      'font-family:inherit;font-size:var(--t6);font-weight:700;color:var(--t-ink);cursor:pointer}'+
    '.gr-pill{display:inline-block;font-size:var(--t6);font-weight:800;color:var(--t-point);margin-left:6px}'+
    '.gr-row{display:flex;align-items:center;gap:10px;width:100%;min-height:52px;padding:6px 0;background:none;border:0;'+
      'border-top:1px solid var(--t-line);text-align:left;cursor:pointer;font-family:inherit}'+
    '.gr-row:first-of-type{border-top:0}'+
    '.gr-row .ic{flex:none;width:34px;height:34px;border-radius:10px;background:var(--t-bg);display:flex;'+
      'align-items:center;justify-content:center;font-size:18px}'+
    '.gr-row .tx{flex:1;min-width:0}'+
    '.gr-row .tx b{display:block;font-size:var(--t5);font-weight:800;color:var(--t-ink);line-height:1.4}'+
    '.gr-row .tx span{display:block;font-size:var(--t6);color:var(--t-sub);line-height:1.5}'+
    '.gr-row .go{flex:none;color:var(--t-sub);font-size:var(--t5)}'+
    '.gr-q{width:100%;min-height:48px;border:1px solid var(--t-line);border-radius:14px;padding:0 14px;'+
      'font-family:inherit;font-size:var(--t4);color:var(--t-ink);background:var(--t-card);box-sizing:border-box}'+
    '.gr-step3{display:flex;gap:8px;margin-top:8px}'+
    '.gr-step3 div{flex:1;background:var(--t-bg);border-radius:12px;padding:10px;font-size:var(--t6);color:var(--t-sub);line-height:1.5}'+
    '.gr-step3 b{display:block;font-size:var(--t5);color:var(--t-ink)}'+
    '.gr-prog{display:flex;gap:8px;flex-wrap:wrap}'+
    '.gr-prog button{flex:1 1 140px;min-height:64px;text-align:left;border:1px solid var(--t-line);border-radius:14px;'+
      'background:var(--t-card);padding:10px 12px;font-family:inherit;cursor:pointer}'+
    '.gr-prog b{display:block;font-size:var(--t3);color:var(--t-ink);font-weight:800}'+
    '.gr-prog span{display:block;font-size:var(--t6);color:var(--t-sub)}'+
    '.gr-su{padding:12px 0;border-top:1px solid var(--t-line)}'+
    '.gr-su:first-of-type{border-top:0}'+
    '.gr-su .top{display:flex;gap:10px;align-items:flex-start}'+
    '.gr-su.on .gr-ck{background:var(--t-pos);border-color:var(--t-pos)}'+
    '.gr-su .nm{font-size:var(--t4);font-weight:800;color:var(--t-ink);line-height:1.45}'+
    '.gr-su .ln{font-size:var(--t6);color:var(--t-sub);line-height:1.55;margin-top:2px}'+
    '.gr-su .ln b{color:var(--t-ink)}'+
    '.gr-none{font-size:var(--t6);color:var(--t-sub);line-height:1.6}'+
    '.gr-foot{font-size:var(--t6);color:var(--t-sub);line-height:1.6;margin:12px 0 0;padding:0 16px;word-break:keep-all}'+
    '.gr-seg button{padding:0 2px;word-break:keep-all}'+
    '.gr-use{display:inline-block;font-size:var(--t6);font-weight:800;color:var(--t-point);margin-top:3px}'+
    '.gr-why summary{min-height:44px;display:flex;align-items:center;cursor:pointer;font-size:var(--t5);font-weight:800;color:var(--t-ink)}'+
    '.gr-why p{font-size:var(--t6);color:var(--t-sub);line-height:1.65;margin:6px 0}'+
    '.gr-why p b{color:var(--t-ink)}'+
    '.gr-ax{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}'+
    '.gr-ax span{font-size:var(--t6);color:var(--t-ink);background:var(--t-bg);border-radius:10px;padding:6px 10px;line-height:1.45}'+
    '.gr-no ul{margin:8px 0 0;padding:0 0 0 20px}'+
    '.gr-no .gr-hd i{color:var(--t-sub)}'+
    '.gr-no li{font-size:var(--t6);color:var(--t-ink);line-height:1.6;margin:4px 0}';
  document.head.appendChild(st);
}

function renderGrow(){
  grCss();
  var h='<div class="tab-pane on"><div class="page-hd">'+
    '<div class="page-tag">성장</div>'+
    '<div class="page-title">🌱 성장 로드맵</div>'+
    '<div class="page-desc">입사부터 경력자까지 한 길로 — 지금 레벨에서 할 것 하나만 봅니다.</div></div>'+
    '<div id="grHost">'+grInnerHtml()+'</div></div>';
  return h;
}
function grAfter(){ if(GR.tab==='learn')grPassLoad(); }
function grPaint(){
  var el=document.getElementById('grHost');
  if(!el)return;
  el.innerHTML=grInnerHtml();
  grAfter();
}
function grInnerHtml(){
  var T=[['path','🪜 한 길','순서대로'],['learn','🔁 익히기','숙지'],['know','🧰 매번','찾아 쓰기'],['cust','🤝 고객 앞','같이 보기']],i,h='<div class="gr-seg" role="tablist">';
  for(i=0;i<T.length;i++)
    h+='<button type="button" role="tab" class="'+(GR.tab===T[i][0]?'on':'')+'" onclick="grTab(\''+T[i][0]+'\')">'+
       T[i][1]+'<i>'+T[i][2]+'</i></button>';
  h+='</div>';
  if(GR.tab==='learn')return h+grLearnHtml();
  if(GR.tab==='know')return h+grKnowHtml();
  if(GR.tab==='cust')return h+grCustHtml();
  return h+grPathHtml();
}

/* 🪜 한 길 */
function grLvDone(lv,v){
  var s=grSteps(lv),i;
  if(!s.length)return false;
  for(i=0;i<s.length;i++)if(!v.done[s[i].k])return false;
  return true;
}
function grPathHtml(){
  var v=grState(),lv=Math.min(v.lv,GR_LV.length-1),L=GR_LV[lv],s=grSteps(lv),i,h='',now=null,nd=0;
  h+='<div class="t-card"><div class="gr-hd">내 레벨<i>눌러서 옮깁니다 — 이 기기에만 남습니다</i></div><div class="gr-lad">';
  for(i=0;i<GR_LV.length;i++)
    h+='<button type="button" class="'+(i===lv?'on ':'')+(grLvDone(i,v)?'ok':'')+'" onclick="grLv('+i+')">'+
       '<b>Lv.'+i+'</b><span>'+osEsc(GR_LV[i].t)+'</span></button>';
  h+='</div>';
  for(i=0;i<s.length;i++){ if(v.done[s[i].k])nd++; else if(!now)now=s[i]; }
  if(now){
    h+='<div class="gr-now"><div class="k">지금 할 것 하나</div>'+
      '<div class="n">'+osEsc(now.ic)+' '+osEsc(now.n)+'</div>'+
      (now.d?'<div class="d">'+osEsc(now.d)+'</div>':'')+
      (now.done?'<div class="d"><b>끝 기준</b> — '+osEsc(now.done)+'</div>':'')+
      '<div class="gr-btns"><button type="button" class="gr-b" onclick="'+now.open+'">열기</button>'+
      '<button type="button" class="gr-b ghost" onclick="grTick(\''+now.k+'\')">끝냈어요 ✓</button></div></div>';
  }else if(s.length){
    h+='<div class="gr-now"><div class="k">Lv.'+lv+' 끝</div>'+
      '<div class="n">'+osEsc(L.t)+' 을 다 걸었습니다</div>'+
      (lv<GR_LV.length-1
        ?'<div class="gr-btns"><button type="button" class="gr-b" onclick="grLv('+(lv+1)+')">다음 레벨 — '+osEsc(GR_LV[lv+1].t)+' →</button></div>'
        :'<div class="d">마지막 레벨입니다.</div>')+'</div>';
  }
  h+='</div>';

  h+='<div class="t-card"><div class="gr-hd">Lv.'+lv+' · '+osEsc(L.t)+' — '+osEsc(L.s)+
     '<span class="gr-pill">'+nd+' / '+s.length+'</span></div>'+
     '<div class="gr-goal">'+osEsc(L.goal)+'</div>';
  if(!s.length)h+='<div class="gr-none">이 레벨에서 여실 수 있는 화면이 없습니다 — 등급에 막힌 화면만 안 섭니다.</div>';
  for(i=0;i<s.length;i++)h+=grStepHtml(s[i],!!v.done[s[i].k]);
  h+='</div>';
  h+=grWhyHtml();
  h+='<div class="gr-foot">체크는 이 기기에만 남습니다 — 남이 보면 「해야 하는 것」 이 되어 체크만 하게 됩니다. '+
     '레벨은 건너뛰어도 됩니다 — 이직한 경력자는 Lv.0 의 앱 익히기만 하고 Lv.3 으로 가십시오.</div>';
  return h;
}
function grStepHtml(x,on){
  var t='',i,tl,it;
  if(x.tools&&x.tools.length){
    for(i=0;i<x.tools.length;i++){
      tl=x.tools[i]; it=(typeof navItemOf==='function')?navItemOf(tl[0]):null;
      if(it)t+='<button type="button" class="gr-tool" onclick="grOpen(\'go\',\''+osEsc(tl[0])+'\')">'+
               osEsc(it.icon||tl[1])+' '+osEsc(it.title||tl[2])+'</button>';
    }
  }
  if(x.k==='go:apexmaster'){ var m=grMasterN(); if(m)x.d=x.d+' (지금 '+m.n+' / '+m.of+')'; }
  var u=grUseOf(x.k);
  return '<div class="gr-st'+(on?' on':'')+'">'+
    '<button type="button" class="gr-ck" onclick="grTick(\''+x.k+'\')" aria-label="끝냄 표시">'+(on?'✓':'')+'</button>'+
    '<div class="gr-tx"><button type="button" class="n" onclick="'+x.open+'">'+osEsc(x.ic)+' '+osEsc(x.n)+' ›</button>'+
    (x.d?'<div class="d">'+osEsc(x.d)+'</div>':'')+
    (u==='know'?'<div class="gr-use">🧰 끝낸 뒤에도 「매번」 칸에서 꺼내 씁니다</div>':'')+
    (u==='cust'?'<div class="gr-use">🤝 익히고 나면 「고객 앞」 칸에서 폅니다</div>':'')+
    (x.done?'<div class="ok">✓ 끝 기준 · '+osEsc(x.done)+'</div>':'')+
    (t?'<div class="gr-tools">'+t+'</div>':'')+'</div></div>';
}

/* 한 길의 걸음이 끝난 뒤 어디로 가나 — 「매번」 · 「고객 앞」 표에 있으면 그쪽 */
function grUseOf(k){
  var T=[['know',GR_KNOW],['cust',GR_CUST]],i,j,n;
  for(n=0;n<T.length;n++)for(i=0;i<T[n][1].length;i++)for(j=0;j<T[n][1][i].it.length;j++)
    if(grKey(T[n][1][i].it[j])===k)return T[n][0];
  return null;
}

/* 왜 이렇게 나눴나 · 설계사는 어떻게 크나 — 숫자는 <b>성장판(GB_AX)과 90일 아카데미(AC_ROAD)</b>에
   이미 있는 것만 읽습니다. 여기서 새로 짓지 않습니다 (1번 · 5번) */
function grWhyHtml(){
  var h='<details class="t-card gr-why"><summary>왜 이렇게 나눴나 · 설계사는 어떻게 크나 ›</summary>'+
    '<p><b>쓰는 법이 셋이라 셋으로 나눴습니다.</b> 🪜 한 번 걸어 지나가는 과정 · 🧰 상담 때마다 꺼내 쓰는 것 · '+
    '🤝 고객과 같이 보는 것. 한데 섞어 두면 신입은 「이걸 다 해야 하나」 에서 멈추고, '+
    '경력자는 매번 쓰는 것을 과정 사이에서 찾느라 헤맵니다.</p>'+
    '<p><b>순서는 앞 걸음이 뒤 걸음의 재료가 되게 놓았습니다.</b> 앱에서 길을 알아야 연락을 하고, 연락이 돼야 상담이 있고, '+
    '상담이 쌓여야 보장 · 저축 · 연금으로 넓어지고, 혼자 설 수 있어야 남을 가르칩니다.</p>'+
    '<p><b>고객 앞을 따로 뺀 까닭</b> — 대본 · 화법 · 소식지처럼 설계사만 보는 것이 고객 화면에 섞이지 않게 하려고요.</p>';
  var i,a,t='';
  if(typeof GB_AX!=='undefined'){
    for(i=0;i<GB_AX.length;i++){ a=GB_AX[i]; t+='<span>'+osEsc(a.n)+' — '+osEsc(a.w)+' · 기준 '+a.t+osEsc(a.u)+'</span>'; }
    h+='<p><b>성장은 이 여섯으로 잽니다</b> — 성장판과 같은 자입니다. 습관(출근 · 실행)이 먼저 서야 활동이 붙고, '+
       '활동이 고객과 자료가 되고, 그 위에 공부가 얹힙니다.</p><div class="gr-ax">'+t+'</div>';
  }
  t='';
  if(typeof AC_ROAD!=='undefined'){
    for(i=0;i<AC_ROAD.length;i++)if(/→/.test(AC_ROAD[i].grow||''))t+='<span>'+osEsc(AC_ROAD[i].p)+' · '+osEsc(AC_ROAD[i].grow)+'</span>';
    if(t)h+='<p><b>90일 동안 바뀌는 것</b> — 90일 아카데미 구간마다 적힌 「달라지는 점」 입니다.</p><div class="gr-ax">'+t+'</div>';
  }
  return h+'</details>';
}

/* 🔁 익히기 */
function grLearnHtml(){
  var h='',m=grMasterN(),pn=grPassN(),pm=grPassMap()||{},i,c,ac,on;
  h+='<div class="t-card"><div class="gr-hd">익히는 법은 하나<i>읽어서 늘지 않습니다 — 써 봐야 상담에서 나옵니다</i></div>'+
    '<div class="gr-step3"><div><b>① 읽는다</b>교재 그 장 한 장</div>'+
    '<div><b>② 써 본다</b>그날 한 명에게</div>'+
    '<div><b>③ 합격</b>종이 없이 30초에 말하면</div></div></div>';

  h+='<div class="t-card"><div class="gr-hd">내 진도<i>각 화면이 센 수를 그대로 읽습니다</i></div><div class="gr-prog">';
  if(m&&navItemOf('apexmaster'))
    h+='<button type="button" onclick="grOpen(\'go\',\'apexmaster\')"><b>'+m.n+' / '+m.of+'</b><span>APEX 마스터 과정</span></button>';
  if(typeof GB_CUR!=='undefined')
    h+='<button type="button" onclick="var e=document.getElementById(\'grSubj\');if(e)e.scrollIntoView({behavior:\'smooth\'})"><b>'+(pn==null?'…':pn)+' / '+GB_CUR.length+'</b><span>열두 주제 합격</span></button>';
  if(navItemOf('academy'))
    h+='<button type="button" onclick="grOpen(\'go\',\'academy\')"><b>90일</b><span>아카데미 — 진도는 그 안에</span></button>';
  h+='</div></div>';

  if(typeof GB_CUR==='undefined')return h+'<div class="t-card"><div class="gr-none">열두 주제 표를 못 읽었습니다.</div></div>';
  h+='<div class="t-card" id="grSubj"><div class="gr-hd">배워서 터치할 열두 주제<span class="gr-pill">'+(pn==null?'…':pn)+' / '+GB_CUR.length+'</span>'+
     '<i>합격은 스스로 줍니다 — 아무도 대신 눌러 주지 않습니다. 성장판과 같은 기록입니다</i></div>';
  for(i=0;i<GB_CUR.length;i++){
    c=GB_CUR[i]; on=!!pm[c[0]];
    ac=(typeof GB_ACAD!=='undefined')?GB_ACAD[c[0]]:null;
    h+='<div class="gr-su'+(on?' on':'')+'"><div class="top">'+
      '<button type="button" class="gr-ck" onclick="grStamp(\''+c[0]+'\')" aria-label="합격">'+(on?'✓':'')+'</button>'+
      '<div class="gr-tx"><div class="nm">'+osEsc(c[1])+'</div>'+
      '<div class="ln"><b>배울 것</b> '+osEsc(c[3])+'</div>'+
      '<div class="ln"><b>이런 고객에게</b> '+osEsc(c[4])+'</div>'+
      '<div class="ln"><b>합격 기준</b> '+osEsc(c[5])+'</div>'+
      '<div class="gr-tools">'+
        (ac?'<button type="button" class="gr-tool" onclick="gbOpenAcad(\''+c[0]+'\')">📕 교재 '+osEsc(ac.l)+' 읽기</button>'
           :'<span class="gr-none">교재에 이 주제 장이 없습니다</span>')+
        '<button type="button" class="gr-tool" onclick="fpTalkOpen(\''+c[2]+'\')">🗣️ 화법서로 써 보기</button>'+
      '</div></div></div></div>';
  }
  h+='</div>';
  return h;
}

/* 📚 지식 창고 */
/* 질병 보험가이드의 병 마흔 — 이름과 찾기 낱말을 그 표(DZ_DATA.list)에서 그대로 읽습니다.
   「갑상선」 을 치면 질병 보험가이드 줄이 서고, 찾은 병 이름이 그 줄에 붙습니다 (5번) */
function grDzHits(q){
  var L=(window.DZ_DATA&&DZ_DATA.list)||[],out=[],i;
  if(!q)return out;
  for(i=0;i<L.length;i++)
    if(((L[i].name||'')+' '+(L[i].find||'')+' '+(L[i].grp||'')).toLowerCase().indexOf(q)>=0)out.push(L[i].name);
  return out;
}
function grKnowRow(s,q){
  var x=grStep(s),g='',hit=[],d=s.d||'';
  if(!x)return null;
  if(s.go)g=grGroupOf(s.go);
  else if(s.acad)g='보험 마스터 아카데미 안';
  if(s.go==='dz_guide'){
    hit=grDzHits(q);
    if(hit.length)d='찾은 병 — '+hit.slice(0,4).join(' · ')+(hit.length>4?' 외 '+(hit.length-4):'');
  }
  return {t:(x.n+' '+(s.d||'')+' '+g+' '+((navItemOf(s.go||'')||{}).ak||'')).toLowerCase(),hit:hit.length>0,
    h:'<button type="button" class="gr-row" onclick="'+x.open+'">'+
      '<span class="ic">'+osEsc(x.ic)+'</span>'+
      '<span class="tx"><b>'+osEsc(x.n)+'</b><span>'+osEsc(d)+(g?' · '+osEsc(g):'')+'</span></span>'+
      '<span class="go">›</span></button>'};
}
function grGroupOf(id){
  var i,j,g;
  if(typeof TABS==='undefined')return '';
  for(i=0;i<TABS.length;i++){ g=TABS[i]; if(g.hide)continue;
    for(j=0;j<(g.items||[]).length;j++)if(g.items[j].id===id)return '☰ '+g.group; }
  return '';
}
function grKnowHtml(){
  return '<div class="t-card"><input class="gr-q" type="search" placeholder="찾기 — 암 · 실손 · 수술 · 연금 · 고지 (고객 앞도 같이)" '+
    'value="'+osEsc(GR.q)+'" oninput="grFind(this.value)" aria-label="지식 찾기"></div>'+
    '<div id="grKnow">'+grKnowList()+'</div>';
}
/* 🤝 고객 앞 — 상담 순서대로. 찾기 칸은 없습니다 — 다섯 마디를 위에서 아래로 따라가면 됩니다 */
function grCustHtml(){
  var h='<div class="t-card"><div class="gr-hd">고객과 같이 보거나 보내는 것<i>상담 순서대로 놓았습니다 — 그 화면 스스로 「고객용」 이라고 적은 것만 골랐습니다</i></div></div>',i,j,g,r,rows,n=0;
  for(i=0;i<GR_CUST.length;i++){
    g=GR_CUST[i]; rows='';
    for(j=0;j<g.it.length;j++){ r=grKnowRow(g.it[j],''); if(r){ rows+=r.h; n++; } }
    if(rows)h+='<div class="t-card"><div class="gr-hd">'+osEsc(g.t)+'<i>'+osEsc(g.s)+'</i></div>'+rows+'</div>';
  }
  if(!n)h+='<div class="t-card"><div class="gr-none">여실 수 있는 것이 없습니다.</div></div>';
  h+='<div class="t-card gr-no"><div class="gr-hd">고객 앞에 꺼내지 않는 것<i>설계사만 봅니다 — 화면을 돌려 보여 주지 마십시오</i></div><ul>';
  for(i=0;i<GR_CUST_NO.length;i++)h+='<li>'+GR_CUST_NO[i]+'</li>';
  return h+'</ul></div>';
}
function grFind(v){ GR.q=v||''; var el=document.getElementById('grKnow'); if(el)el.innerHTML=grKnowList(); }
function grKnowList(){
  var q=(GR.q||'').replace(/^\s+|\s+$/g,'').toLowerCase(),i,j,g,r,rows,h='',n=0,L=GR_KNOW.slice(0);
  /* 찾을 때는 🤝 고객 앞도 같이 — 찾기 칸은 하나입니다 */
  if(q)for(i=0;i<GR_CUST.length;i++)L.push({t:'🤝 고객 앞 · '+GR_CUST[i].t,s:GR_CUST[i].s,it:GR_CUST[i].it});
  for(i=0;i<L.length;i++){
    g=L[i]; rows='';
    for(j=0;j<g.it.length;j++){
      r=grKnowRow(g.it[j],q);
      if(!r)continue;
      if(q&&!r.hit&&r.t.indexOf(q)<0&&(g.t+' '+g.s).toLowerCase().indexOf(q)<0)continue;
      rows+=r.h; n++;
    }
    if(rows)h+='<div class="t-card"><div class="gr-hd">'+osEsc(g.t)+'<i>'+osEsc(g.s)+'</i></div>'+rows+'</div>';
  }
  if(!n)h='<div class="t-card"><div class="gr-none">'+(q?'「'+osEsc(GR.q)+'」 로 찾은 것이 없습니다.':'여실 수 있는 것이 없습니다.')+'</div></div>';
  return h+'<div class="gr-foot">화면은 제자리에 있습니다 — 여기서는 문만 엽니다. 현장에서 쓰던 길(☰ 서랍)도 그대로입니다.</div>';
}
