/* ══ APEX 고객 ↔ 소식 맞춤 — <b>읽어낸 것에만</b> 말을 붙인다 ═══════════
 *
 * 사장님 말씀 (2026-09-22) —
 *   「고객 정보를 읽어서 <b>어떤 뉴스를 전달할지</b> … <b>잘못된 값을 입력
 *    또는 추출하지 않도록</b> 여기에 대해서 정말 <b>정밀하게</b> 시스템을
 *    만들어야 돼」
 *
 * ── 이 파일이 지키는 것 ────────────────────────────────────────────
 *  ①  <b>근거 없이는 갈래를 안 만든다.</b> fit() 은 근거(why)를 못 붙이면
 *     갈래를 비워 돌려준다. 「모름」이 조용히 어느 갈래로 떨어지는 일이
 *     없다 — 실제로 그렇게 새고 있었다(아래 「고친 자리」).
 *  ②  <b>인용은 원문에서 잘라 온다.</b> 화면에 적는 근거 문장은 우리가
 *     쓴 글이 아니라 <b>사장님이 적어 두신 그 글자</b>다. AI 가 돌려준
 *     문장도 원문에 실제로 있는지 글자로 대조하고, 없으면 버린다.
 *  ③  <b>아니라는 말을 같이 본다.</b> 「가게 접었다」 에서 「가게」만 보고
 *     사업자로 읽으면 안 된다. 낱말마다 <b>아닌 말</b>(no)을 둔다.
 *  ④  <b>고객 칸에 아무것도 안 쓴다.</b> 이 파일은 <b>읽기만</b> 한다.
 *     돌려주는 것은 「제안」이고, 고객 정보로 들어가는 길이 없다 —
 *     잘못된 값이 <b>입력</b>될 자리 자체를 없앤다.
 *  ⑤  <b>오래된 근거는 오래됐다고 말한다.</b> 두 해 전 메모로 오늘을
 *     말하지 않는다.
 *  ⑥  <b>동명이인은 안 잇는다.</b> 이름이 둘 이상에게 걸리면 잇지 않고
 *     못 이었다고 말한다 — 남의 메모를 이 분 것이라 말하면 그 자리에서
 *     끝난다(고객 체크에서 이미 겪은 자리다).
 *
 * ── 고친 자리 (2026-09-22) ─────────────────────────────────────────
 *   옛 ccNewsCat() 은 if 사슬이었다. 109명에게 돌려 보니 —
 *     보험 105명 (그중 <b>94명은 적힌 것이 하나도 없는 사람</b>)
 *     세금 4 · 지원금 1 · 경제 1 · 부동산 0 · <b>정책자금 0</b>
 *   마지막 줄이 「암·사망 보장이 없으면 보험」이라, 아무것도 안 적힌
 *   사람은 0 으로 읽혀 <b>전원 보험</b>으로 떨어졌다. 「모름」이 「보험」
 *   으로 둔갑한 것이다 (1번). 그리고 여섯 갈래 중 <b>정책자금이 규칙에
 *   아예 없어서</b> 사업자 고객에게 그 소식이 한 번도 안 갔다 — 갈래를
 *   사슬로 나열하면 반드시 하나를 빠뜨린다 (5번).
 *
 * 브라우저와 서버(새벽 5시 작업)가 <b>같은 이 파일</b>을 읽는다. 두 벌이
 * 되면 한쪽만 늘어나고, 그 갈래 고객이 조용히 사라진다.
 * ══════════════════════════════════════════════════════════════════ */
(function (g) {

/* ══ 1. 뉴스 갈래 여섯 — <b>여기 한 곳</b>에만 적는다 ═══════════════
   app/index.html 의 NL_CATS 가 이 표를 가리킨다. 기사를 갈래에 넣는
   낱말(kw)과 고객을 읽는 낱말이 <b>같은 표</b>에서 나와야, 「고객은
   정책자금인데 그 갈래 기사가 한 건도 없다」 가 안 생긴다.            */
var CATS = [
 {id:'ins',   t:'보험',       ic:'🛡️', c:'#1A56DB',
  kw:['보험','보장','담보','실손','진단비','손보','생보','보험료','보험금','금감원','금융감독원',
      '손해보험','생명보험','해지환급금','공시이율','변액','종신','유병자','간편심사']},
 {id:'realty',t:'부동산',     ic:'🏠', c:'#B45309',
  kw:['청약','분양','전세','월세','임대차','재건축','재개발','정비사업','아파트','주택담보','주담대',
      'LTV','DSR','공시가격','보금자리','디딤돌','버팀목','전세사기','입주','매매가','집값','부동산',
      '종부세','종합부동산세','재산세','취득세','양도세','양도소득세','1주택','다주택','임대사업자']},
 {id:'tax',   t:'세금',       ic:'🧾', c:'#7C3AED',
  kw:['연말정산','세액공제','소득공제','종합소득세','양도소득세','양도세','상속세','증여세','종부세',
      '종합부동산세','취득세','재산세','부가세','세법개정','과세표준','비과세','절세','국세청','홈택스',
      '세무조사','면세']},
 {id:'help',  t:'지원금·혜택', ic:'🎁', c:'#047857',
  kw:['지원금','보조금','바우처','장려금','수당','환급','감면','지원사업','공모','청년','신혼부부',
      '출산','육아','다자녀','돌봄','기초연금','국민연금','건강보험료','근로장려금','자녀장려금',
      '실업급여','고용보험','소상공인','정책자금',
      '출산장려금','출산지원금','첫만남이용권','부모급여','아동수당','양육수당','산후조리비',
      '난임','인구감소지역','출산축하금','육아기본수당','조례 개정']},
 {id:'fund',  t:'정책자금·사업자', ic:'🏢', c:'#B91C1C',
  kw:['정책자금','정책금융','소상공인','자영업자','개인사업자','중소기업','벤처기업','창업',
      '신용보증','기술보증','신보','기보','소진공','중진공','중기부','중소벤처기업부',
      '이차보전','저리대출','운전자금','시설자금','경영안정자금','긴급경영안정','융자',
      '고용지원금','고용장려금','일자리안정자금','두루누리','노란우산공제',
      '지원사업','공모사업','수출바우처','스마트공장','새출발기금','대환대출','상환유예','만기연장',
      '부가가치세','종합소득세','원천세','4대보험','전통시장','골목상권','가맹점','프랜차이즈']},
 {id:'econ',  t:'경제',       ic:'📈', c:'#0F766E',
  kw:['기준금리','금리','환율','물가','코스피','코스닥','증시','대출','예금','적금','채권','펀드','ETF',
      'ISA','IRP','연금저축','퇴직연금','배당','수출','경기','소비','가계부채','원화','달러']}
];
var CATID = {}; (function(){ for (var i=0;i<CATS.length;i++) CATID[CATS[i].id]=CATS[i]; })();

/* ══ 2. 팩트파인딩 칸의 <b>뜻</b> — 짐작하지 않기 위한 표 ════════════
   칸 이름만 보고 뜻을 짐작하면 그 자리에서 값을 잘못 읽는다. 질문지
   (CM_FF)에 적힌 그대로를 여기 옮겨 둔다. 단위는 모두 <b>만원</b>이다
   (나이·글자 칸만 다르다) — 만원과 원을 섞으면 만 배가 틀린다 (4번).  */
var FIELD = {
  f_age:     {t:'나이',                 u:'세'},
  f_gender:  {t:'성별',                 u:''},
  f_job:     {t:'직업',                 u:'글'},
  f_ret:     {t:'은퇴 희망나이',        u:'세'},
  f_income:  {t:'본인 월소득',          u:'만원'},
  f_sincome: {t:'배우자 월소득',        u:'만원'},
  f_etc:     {t:'기타 월소득',          u:'만원'},
  f_house:   {t:'주거·관리비(월)',      u:'만원'},
  f_loan:    {t:'대출상환(월)',         u:'만원'},
  f_edu:     {t:'교육비(월)',           u:'만원'},
  f_ins:     {t:'보험료(월)',           u:'만원'},
  f_living:  {t:'생활비(월)',           u:'만원'},
  f_retspend:{t:'은퇴 후 희망 생활비(월)',u:'만원'},
  f_np:      {t:'국민연금 예상액(월)',  u:'만원'},
  f_pp:      {t:'개인연금 월납',        u:'만원'},
  f_dc:      {t:'퇴직연금 적립액',      u:'만원'},
  f_home:    {t:'거주 부동산',          u:'만원'},
  f_debt:    {t:'대출 잔액',            u:'만원'},
  c_cancer:  {t:'암 진단금',            u:'만원'},
  c_brain:   {t:'뇌혈관 진단금',        u:'만원'},
  c_heart:   {t:'심장 진단금',          u:'만원'},
  c_care:    {t:'간병(LTC) 자금',       u:'만원'},
  c_death:   {t:'사망보험금',           u:'만원'}
};

/* 「모름」과 「0」을 가른다 (1번). 빈칸은 null 이지 0 이 아니다. */
function manOf(v) {
  if (v === '' || v === null || v === undefined) return null;
  var n = Number(v);
  return (isFinite(n) && n >= 0) ? n : null;
}
function has(fp, k) { return manOf(fp && fp[k]) !== null; }
function num(fp, k) { var v = manOf(fp && fp[k]); return v === null ? 0 : v; }
function txt(v) { return String(v === null || v === undefined ? '' : v); }

/* ══ 3. 칸에서 읽는 근거 — <b>표 하나</b> (5번) ══════════════════════
   한 줄 = 근거 하나다. 갈래를 늘려도 여기 한 줄만 더하면 된다.
     cat  어느 갈래로 읽나          w    근거의 힘 (큰 것이 이긴다)
     when 언제 이 근거가 서나        say  화면에 적을 말 — <b>왜</b> 그렇게 읽었나
   ★ say 에는 <b>적혀 있는 값</b>을 넣는다. 「대출이 있어서」 보다
     「대출상환 120만원이 적혀 있어서」 가 사장님이 확인하실 수 있는 말이다. */
var RULES = [
 /* ── 사업자 — 정책자금. 옛 규칙에 <b>아예 없던</b> 갈래다 ───────── */
 {id:'job-biz', cat:'fund', w:95,
  when:function(x){ return BIZ.hit(txt(x.fp.f_job)); },
  say:function(x){ return '직업이 「' + txt(x.fp.f_job) + '」 라고 적혀 있습니다'; }},

 /* ── 집 + 그 집에 걸린 대출 ─────────────────────────────────────
    ⚠ <b>대출 잔액만으로 「부동산」이라 말하지 않는다.</b> 그 대출이
      주택담보인지 신용인지 우리는 모른다. 「거주 부동산」이 같이 적혀
      있을 때만 부동산으로 읽는다 — 그래야 지어내지 않는 것이다 (1번). */
 {id:'home-loan', cat:'realty', w:90,
  when:function(x){ return num(x.fp,'f_home') > 0 && (num(x.fp,'f_loan') > 0 || num(x.fp,'f_debt') > 0); },
  say:function(x){ return '거주 부동산 ' + man(num(x.fp,'f_home')) +
      ' · 대출 ' + man(num(x.fp,'f_loan') || num(x.fp,'f_debt')) + '이 적혀 있습니다'; }},
 {id:'home', cat:'realty', w:70,
  when:function(x){ return num(x.fp,'f_home') > 0; },
  say:function(x){ return '거주 부동산 ' + man(num(x.fp,'f_home')) + '이 적혀 있습니다'; }},

 /* 자녀 교육비 → 지원금·혜택(육아·교육) */
 {id:'edu', cat:'help', w:80,
  when:function(x){ return num(x.fp,'f_edu') > 0; },
  say:function(x){ return '교육비 월 ' + man(num(x.fp,'f_edu')) + '이 적혀 있습니다 — 자녀가 있으십니다'; }},

 /* 벌이가 둘이면 연말정산·종소세 이야기가 실제로 걸린다 */
 {id:'income2', cat:'tax', w:75,
  when:function(x){ return num(x.fp,'f_income') > 0 && num(x.fp,'f_sincome') > 0; },
  say:function(x){ return '본인 ' + man(num(x.fp,'f_income')) + ' · 배우자 ' +
      man(num(x.fp,'f_sincome')) + ' — 맞벌이로 적혀 있습니다'; }},

 /* 노후 준비 칸을 적으셨다 → 연금·금리 */
 {id:'ret', cat:'econ', w:70,
  when:function(x){ return num(x.fp,'f_np') > 0 || num(x.fp,'f_pp') > 0 ||
                           num(x.fp,'f_dc') > 0 || num(x.fp,'f_retspend') > 0; },
  say:function(x){
    var p = []; if (num(x.fp,'f_np')>0) p.push('국민연금 ' + man(num(x.fp,'f_np')));
    if (num(x.fp,'f_pp')>0) p.push('개인연금 ' + man(num(x.fp,'f_pp')));
    if (num(x.fp,'f_dc')>0) p.push('퇴직연금 ' + man(num(x.fp,'f_dc')));
    if (num(x.fp,'f_retspend')>0) p.push('은퇴 후 희망 ' + man(num(x.fp,'f_retspend')));
    return p.join(' · ') + '이 적혀 있습니다'; }},

 /* ── 보장이 비어 있다 → 보험 ────────────────────────────────────
    ⚠ <b>여기가 옛 규칙이 샌 자리다.</b> 적힌 것이 하나도 없는 사람은
      0 으로 읽혀 전원 이 줄로 떨어졌다(94명). 그래서 <b>보장 칸을 실제로
      적으셨을 때만</b> 이 줄이 선다 — 「적었는데 비어 있다」와
      「아직 안 적었다」는 다르다 (1번). */
 {id:'cover-gap', cat:'ins', w:85,
  when:function(x){
    var K = ['c_cancer','c_brain','c_heart','c_care','c_death'], i, wrote = 0, zero = 0;
    for (i = 0; i < K.length; i++) { if (has(x.fp, K[i])) { wrote++; if (num(x.fp,K[i]) === 0) zero++; } }
    return wrote > 0 && zero > 0;
  },
  say:function(x){
    var K = ['c_cancer','c_brain','c_heart','c_care','c_death'], i, out = [];
    for (i = 0; i < K.length; i++) if (has(x.fp,K[i]) && num(x.fp,K[i]) === 0) out.push(FIELD[K[i]].t);
    return out.join(' · ') + '이 <b>0</b> 으로 적혀 있습니다'; }},

 /* ── 보험료를 많이 내고 계신다 → 세금(연말정산 공제) ────────────────
    ⚠ <b>기준값을 여기서 지어내지 않는다.</b> 「월 얼마부터 많이 내는 것인가」
      는 사장님이 설정에서 정하시는 값(ccCfg().vipMan)이고, 30일 고객관리가
      이미 그 값으로 VIP 를 가른다. 여기 숫자를 따로 박으면 두 화면이
      <b>다른 사람을 VIP 라고</b> 부르게 된다 (5번).
      못 받았으면 <b>이 줄을 안 세운다</b> — 짐작한 기준으로 말하지 않는다 (1번). */
 {id:'ins-high', cat:'tax', w:60,
  when:function(x){ return x.vipMan > 0 && num(x.fp,'f_ins') >= x.vipMan; },
  say:function(x){ return '보험료 월 ' + man(num(x.fp,'f_ins')) +
      ' — 설정하신 기준(' + man(x.vipMan) + ') 이상입니다'; }}
];

function man(v) { return (v >= 10000) ? ((Math.round(v/1000)/10) + '억') : (v.toLocaleString('ko-KR') + '만원'); }

/* ══ 4. 사업자인가 — 글에서 읽는다 ══════════════════════════════════
   ⚠ <b>아닌 말을 같이 본다.</b> 「가게 접었다」 를 「가게」만 보고
     사업자로 읽으면, 그날 아침 사장님이 그 고객에게 정책자금 이야기를
     꺼내시게 된다. 그것이 이 시스템이 낼 수 있는 가장 나쁜 실수다.     */
var BIZ = {
  yes:['대표','사장','자영','개인사업','사업자','창업','점주','가게','매장','식당','카페','공장',
       '프랜차이즈','가맹','소상공인','법인','임대업','도소매','제조업','건설업','운수업','농업','어업'],
  /* ⚠ <b>실제 자료로 돌려 보고 늘린 것들</b> (2026-09-22).
     「한신뷔페<b>식당업무중</b>」 을 「식당」만 보고 사장으로 읽었다. 거기서
     일하시는 분이다. 「근무·업무중·직원·다님」 이 있으면 <b>안 읽는다</b> —
     사장이신데 그 말이 같이 있어도 안 읽는다. <b>틀리느니 안 고른다.</b> */
  no :['폐업','접었','그만','접고','정리했','문 닫','휴업','퇴사','은퇴','전 대표','옛날','예전',
       '업무중','근무','직원','다님','다닙','재직','사원','과장','부장','팀장','공무원','종결'],
  hit:function(s){
    s = txt(s); if (!s) return false;
    var i, p;
    for (i = 0; i < BIZ.no.length; i++) if (s.indexOf(BIZ.no[i]) >= 0) return false;
    for (i = 0; i < BIZ.yes.length; i++) { p = s.indexOf(BIZ.yes[i]); if (p >= 0) return true; }
    return false;
  },
  /* 어느 낱말에 걸렸는지 — 근거로 적어야 한다 */
  which:function(s){
    s = txt(s); var i;
    for (i = 0; i < BIZ.no.length; i++) if (s.indexOf(BIZ.no[i]) >= 0) return '';
    for (i = 0; i < BIZ.yes.length; i++) if (s.indexOf(BIZ.yes[i]) >= 0) return BIZ.yes[i];
    return '';
  }
};

/* ══ 4-2. <b>직업</b>에서 읽는다 ═══════════════════════════════════════
   사장님 말씀 (2026-09-22) — 「직업 연령대도 읽어서 맞출수 있어!?」

   직업은 <b>사장님이 적어 두신 글</b>이라 짐작이 아니다. 다만 <b>정말
   말할 수 있는 것만</b> 적는다.
     ① 사업을 하신다      → 정책자금 (BIZ 가 본다 · 위 RULES)
     ② 직역연금 자리      → 경제·연금. 공무원·교사·군인은 국민연금이
        아니라 <b>제 연금</b>이 있어, 노후 이야기의 결이 다르다
     ③ 같은 업계에 계신다 → 보험. 업계 소식을 <b>일로</b> 보신다
   ★ <b>그 밖의 직업은 안 읽는다.</b> 「생산직」·「청소」·「IT」 로 갈래를
     정하려면 「이런 일을 하니 이런 보험이 필요하다」 는 <b>우리 짐작</b>을
     얹어야 한다. 그건 지어내는 것이다 (1번). 못 읽었다고 적는다.       */
var JOB = [
 {cat:'econ', w:78,
  kw:['공무원','교사','교원','교장','교감','군인','장교','부사관','직업군인',
      '시청','군청','구청','도청','경찰','소방','우체국','교도','보호감찰','공단','공사'],
  no:['퇴직','그만','전 ','옛'],
  why:'직역연금(공무원·사학·군인연금) 자리입니다 — 노후 이야기의 결이 다릅니다'},
 {cat:'ins',  w:72,
  kw:['보험설계사','설계사','손해사정','재무설계','FC','GA','보험대리점'],
  no:['그만','퇴사'],
  why:'같은 업계에 계십니다 — 업계 소식을 일로 보십니다'}
];
function jobHit(job) {
  var s = txt(job); if (!s) return null;
  var i, j, r, bad;
  for (i = 0; i < JOB.length; i++) {
    r = JOB[i]; bad = false;
    for (j = 0; j < (r.no || []).length; j++) if (s.indexOf(r.no[j]) >= 0) { bad = true; break; }
    if (bad) continue;
    for (j = 0; j < r.kw.length; j++)
      if (s.indexOf(r.kw[j]) >= 0) return { cat:r.cat, w:r.w, word:r.kw[j], why:r.why };
  }
  return null;
}

/* ══ 4-3. 나이대는 <b>근거가 아니다</b> — 동점일 때만 기울인다 ════
   사장님 말씀 (2026-09-22) — 「<b>나이대만 보고 고르지 말고</b>, 매일 아침
   고객을 미팅할 수 있도록 자료를 정말 완벽하고 꼼꾼하게 준비해 줘」.

   맞는 말씀이다. 처음에는 나이대를 힘 42 짜리 <b>근거로</b> 썼는데,
   실제 자료로 돌려 보니 <b>읽힌 33분 중 19분이 나이만 보고</b> 고른 것이었다.
   그것은 근거가 아니라 <b>짐작</b>이다. 「60대시니 연금이 궁금하실 것」은
   그럴듯할 뿐 적혀 있는 사실이 아니다 (1번).

   그래서 지금은 —
     ★ <b>나이대만으로는 절대 소식을 안 고릅니다.</b> 다른 근거가 하나도
       없으면 <b>못 읽었다</b>고 적고, 무엇을 채우면 되는지 말합니다.
     ★ 진짜 근거가 <b>둘 이상이고 힘이 같을 때만</b> 나이대로 기울입니다.
       그때도 <b>기울였다고 화면에 적습니다</b>(tilt).
     ★ 40·50대는 여전히 없습니다 — 나이로 갈리는 제도가 없습니다.
   나이대 자체는 <b>준비 자료(brief)</b> 에 그대로 적혀 나가고, 화법은
   APEX_STAGE.taAge 가 따로 들고 있습니다 — 거기서는 쓸모가 있습니다. */
var BAND_T = { '2030':'20·30대', '4050':'40·50대', '60':'60대 이상' };
var BAND = {
 '2030':{cat:'help', w:42, why:'20·30대 — 청년·신혼부부·출산 지원은 실제로 나이로 갈립니다'},
 '60'  :{cat:'econ', w:42, why:'60대 이상 — 연금·기초연금은 실제로 나이로 갈립니다'}
};

/* ══ 5. 메모에서 읽는 근거 ══════════════════════════════════════════
   통화 메모 791건 · DB 메모 702건 · 가구 메모 38건. 사장님이 고객
   이야기를 실제로 적어 두신 곳은 여기다.
     kw   이 낱말이 있으면 그 갈래
     no   <b>같은 글 안에</b> 이 낱말이 있으면 <b>버린다</b>
   ★ 한 글에서 여러 갈래가 걸릴 수 있다. 그때는 힘(w)이 큰 것이 이기고,
     나머지는 <b>alts</b> 로 같이 돌려준다 — 사장님이 바꾸실 수 있게. */
var WORDS = [
 {cat:'fund',   w:88, kw:BIZ.yes, no:BIZ.no},
 /* ⚠ <b>「아파트」를 뻐다</b> (2026-09-22 · 실제 자료로 돌려 보고). 사장님은
    메모에 <b>주소를 적으십니다</b> — 「강남동로 46-25 204동 1102호 (우두리
    돌산청솔<b>2단지아파트</b>)」. 화재보험 상담단 분을 「집을 알아보시는
    분」으로 읽었습니다. 나머지 낱말은 다 <b>하시려는 일</b>을 가리키는데
    「아파트」만 그냥 <b>사는 곳</b>입니다. 틀리느니 안 고릅니다 (8번).
    ⚠ <b>「청약」도 빼고 「주택청약·청약통장·청약가점」만 남겼습니다</b>
    (2026-09-22). 이 업에서 「청약」은 <b>보험 청약</b>입니다 — 사장님 기록
    11건이 전부 그 뜻이었습니다(「청약/청구/소개」). 주택청약으로 읽으면
    계약을 넣은 분께 <b>부동산 기사</b>를 보내게 됩니다.
    ★ <b>위 CATS 에는 「청약」이 그대로 있고, 그것이 맞습니다.</b> 두 표는 서로
      <b>다른 것을 묻습니다</b> — CATS 는 「이 <b>기사</b>가 무엇에 관한 것인가」,
      여기는 「사장님이 적으신 <b>메모</b>가 무슨 뜻인가」. 신문사가 쓰면 집이고
      설계사가 쓰면 보험입니다. <b>한쪽에 맞추어 「통일」하지 마십시오</b> —
      지금 이렇게 갈라 있는 것이 일부러 그런 것입니다 (5·8번).            */
 {cat:'realty', w:82, kw:['전세','월세','주택청약','청약통장','청약가점','분양','이사','집 사','집을 사','주담대',
                          '주택담보','재건축','재개발','임대차','전세금','보증금'],
                      no:['관심 없','생각 없','안 한다','아니라고']},
 /* ⚠ <b>「자녀」 한 낱말을 뺐다</b> (2026-09-22). 실제 자료로 돌려 보니
    「본인·배우자·<b>자녀</b> 컨설팅」, 「<b>자녀</b>분 종합설계」 처럼 <b>보험 상담</b>
    이야기가 지원금·육아로 읽혔다. 「자녀/프랑스/대사관근무」 는 다 큰 분이다.
    <b>어린 자녀를 가리키는 말</b>만 남긴다 — 넓게 잡는 점검이 안 잡는 것보다
    나쁘다는 말이, 읽어내기에도 그대로 적용된다 (8번). */
 {cat:'help',   w:80, kw:['출산','임신','육아','돌잔치','어린이집','유치원','초등학','중학생','고등학생','입시',
                          '아기','둘째','셋째','다자녀','부모급여','아동수당','양육','실업급여','기초연금'],
                      no:['없다','없어','안 계','미혼','성인','대학생','직장 다']},
 {cat:'tax',    w:76, kw:['연말정산','종소세','종합소득세','상속','증여','양도','세금','절세','세무',
                          '국세청','홈택스','과세'],
                      no:['모르겠','관심 없']},
 {cat:'econ',   w:70, kw:['금리','대출','예금','적금','펀드','주식','ETF','연금저축','IRP','ISA',
                          '퇴직연금','환율','물가','투자'],
                      no:['관심 없','생각 없']},
 /* ⚠ <b>세 가지를 손봤다</b> (2026-09-22 · 실제 자료로 돌려 보고).
    ① <b>병력을 뺐다</b>(수술·입원·암·뇌·심장·간병). 「맹장수술 6년전 4일 입원」
       이 근거로 뽑혀 <b>화면에 그대로</b> 떴다. 고객에게 꺼낼 말이 아니고
       민감한 정보다. 보험으로 보낼 다른 근거가 있으면 그것으로 보내고,
       없으면 <b>안 보낸다</b>.
    ② <b>끝난 일을 뺐다</b>(증권·해지). 이미 판 것이라 「무슨 소식을 드릴까」
       의 근거가 못 된다. 「증권전달」 한 줄로 보험 소식을 고르고 있었다.
    ③ <b>아니라는 말을 늘렸다.</b> 「기존 다른 담당자한테 보장분석 받고 모두
       정리했다고 함 <b>종결</b>」 이 보험으로 읽혔다 — 끝난 분이다. */
 {cat:'ins',    w:66, kw:['실손','진단비','보장분석','보장 점검','보험 점검','갱신','보험료 부담',
                          '리모델링','무보험','보장이 없','보장 공백'],
                      no:['없다고','거절','안 한다','종결','타사','다른 담당자','정리했','해지했']}
];

/* 걸린 자리를 <b>원문에서 잘라</b> 온다 — 우리가 쓴 글이 아니라
   사장님이 적어 두신 그 글자여야 사장님이 확인하실 수 있다 (①②). */
/* ── 인용은 <b>조각 하나</b>만 ────────────────────────────────────────
   앞뒤로 열네 글자씩 잘랐더니 <b>옆의 병력이 딸려 왔다</b> —
   「당뇨합병증/<b>식당운영</b>/」 에서 사업자를 읽었는데 화면에는 당뇨까지
   같이 떴다. 근거로 필요한 것은 <b>걸린 그 조각</b>뿐이다.
   그래서 줄바꿈·슬래시·쉼표·마침표로 조각을 나누고, <b>낱말이 든 조각만</b>
   돌려준다. 조각이 너무 길면 그때만 앞뒤를 줄인다.                     */
function cut(s, word, span) {
  s = txt(s); if (s.indexOf(word) < 0) return '';
  var parts = s.split(/[\n\r\/·,;]|\.\s/), i, seg = '';
  for (i = 0; i < parts.length; i++)
    if (parts[i].indexOf(word) >= 0) { seg = parts[i].replace(/\s+/g, ' ').trim(); break; }
  if (!seg) seg = s.replace(/\s+/g, ' ').trim();
  span = span || 14;
  var p = seg.indexOf(word);
  if (seg.length <= span * 2 + word.length || p < 0) return seg;
  var a = Math.max(0, p - span), b = Math.min(seg.length, p + word.length + span);
  return (a > 0 ? '…' : '') + seg.slice(a, b) + (b < seg.length ? '…' : '');
}
function wordHit(s) {
  s = txt(s); if (!s) return null;
  var i, j, r, bad;
  for (i = 0; i < WORDS.length; i++) {
    r = WORDS[i]; bad = false;
    for (j = 0; j < (r.no || []).length; j++) if (s.indexOf(r.no[j]) >= 0) { bad = true; break; }
    if (bad) continue;
    for (j = 0; j < r.kw.length; j++)
      if (s.indexOf(r.kw[j]) >= 0) return { cat:r.cat, w:r.w, word:r.kw[j], quote:cut(s, r.kw[j]) };
  }
  return null;
}

/* ══ 6. 오래된 근거 ═════════════════════════════════════════════════
   두 해 전 메모로 오늘을 말하지 않는다. 버리지는 않는다 — <b>힘을 깎고
   오래됐다고 적는다.</b> 버리면 그나마 있던 단서까지 사라진다.         */
var OLD_DAYS = 180;
function daysBetween(a, b) {
  var x = Date.parse(a + 'T00:00:00Z'), y = Date.parse(b + 'T00:00:00Z');
  if (!isFinite(x) || !isFinite(y)) return null;
  return Math.round((y - x) / 86400000);
}

/* ══ 7. 읽어낸다 ════════════════════════════════════════════════════
   넣는 것 —
     { fp:{}, job:'', notes:[{src,at,t}], today:'YYYY-MM-DD' }
   돌려주는 것 —
     읽혔으면  { read:true,  cat, why:{src,at,quote,rule,w,old}, alts:[] }
     못 읽으면 { read:false, cat:'', need:[...] }
   ★ <b>근거(why)가 없으면 cat 을 비운다.</b> 이 한 줄이 이 파일의 핵심이다. */
function fit(input) {
  var x = { fp: (input && input.fp) || {}, notes: (input && input.notes) || [],
            vipMan: manOf(input && input.vipMan) || 0,
            band: txt(input && input.band) };
  var today = (input && input.today) || '';
  var found = [], i, r, n, h, d;

  /* ① 칸에서 */
  for (i = 0; i < RULES.length; i++) {
    r = RULES[i];
    try { if (!r.when(x)) continue; } catch (e) { continue; }
    found.push({ cat:r.cat, w:r.w, rule:r.id, src:'고객 365일 · 재무설계 답',
                 at:'', quote:'', say:r.say(x), old:null });
  }
  /* ①-2 직업에서 — 사업자는 위 RULES 가 이미 봤다 */
  var J = jobHit(x.fp.f_job);
  if (J) found.push({ cat:J.cat, w:J.w, rule:'직업:' + J.word, src:'고객 365일 · 재무설계 답',
                      at:'', quote:'', say:'직업이 「' + txt(x.fp.f_job) + '」 — ' + J.why, old:null });
  /* ② 글에서 — <b>읽기 전에 씩는다</b>. 가구 메모에는 주민등록번호·전화번호가
     실제로 들어 있었습니다. 씩지 않으면 그 토막이 그대로 <b>근거 인용</b>으로
     화면에 박힙니다. 이름은 이 브라우저 안이라 그대로 두고, AI 로 보낼 때
     aiPrompt 가 한 번 더 가립니다 (3번). */
  for (i = 0; i < x.notes.length; i++) {
    n = x.notes[i] || {};
    h = wordHit(scrub(n.t));
    if (!h) continue;
    d = (today && n.at) ? daysBetween(String(n.at).slice(0,10), today) : null;
    found.push({ cat:h.cat, w:(d !== null && d > OLD_DAYS) ? Math.round(h.w * 0.6) : h.w,
                 rule:'말:' + h.word, src:n.src || '메모', at:String(n.at||'').slice(0,10),
                 quote:h.quote, say:'', old:(d !== null && d > OLD_DAYS) ? d : null });
  }

  /* ★ <b>나이대는 여기 안 끼어 있다.</b> found 가 비었으면 60대이든
     20대이든 <b>못 읽은 것</b>이다 — 나이로 때우지 않는다 (1번). */
  if (!found.length) return { read:false, cat:'', why:null, alts:[], need:needOf(x), tilt:null };

  found.sort(function (a, b) { return b.w - a.w; });
  /* 동점일 때만 나이대로 기울인다 — 그리고 <b>기울였다고 적는다</b> */
  var tilt = null, B = BAND[x.band];
  if (B) {
    for (i = 0; i < found.length; i++) {
      if (found[i].w < found[0].w) break;          /* 동점인 동안만 본다 */
      if (found[i].cat !== B.cat || i === 0) continue;
      tilt = { band:x.band, why:B.why };
      found.unshift(found.splice(i, 1)[0]);
      break;
    }
  }
  var top = found[0], alts = [], seen = {};
  seen[top.cat] = 1;
  for (i = 1; i < found.length; i++) if (!seen[found[i].cat]) { seen[found[i].cat] = 1; alts.push(found[i]); }
  return { read:true, cat:top.cat, why:top, alts:alts.slice(0, 3), need:[], tilt:tilt };
}

/* 못 읽었을 때 <b>무엇을 채우면 읽히는지</b> 말한다. 「모릅니다」 로
   끝내면 사장님이 하실 일이 없다 (1번). */
function needOf(x) {
  var out = [];
  if (!txt(x.fp.f_job)) out.push('직업');
  if (!has(x.fp,'f_home') && !has(x.fp,'f_debt')) out.push('집 · 대출');
  if (!has(x.fp,'c_cancer') && !has(x.fp,'c_death')) out.push('지금 있는 보장');
  if (!x.notes.length) out.push('통화 메모 한 줄');
  return out.slice(0, 3);
}

/* ══ 8. 이름으로 잇기 — <b>둘 이상이면 안 잇는다</b> ═════════════════
   통화·DB 메모는 배정 DB 에 있고 고객 365일과는 이름으로 이어야 한다.
   동명이인이면 <b>남의 메모</b>를 이 분 것이라 말하게 된다 — 그 자리에서
   상담이 끝난다. 그래서 하나에만 걸릴 때만 잇는다 (⑥).                */
function tie(name, pool) {
  var key = txt(name).replace(/\s+/g, ''), i, hit = [];
  if (!key) return { ok:false, why:'이름이 없습니다' };
  for (i = 0; i < (pool || []).length; i++)
    if (txt(pool[i].name).replace(/\s+/g, '') === key) hit.push(pool[i]);
  if (!hit.length) return { ok:false, why:'배정 DB 에서 못 찾았습니다' };
  if (hit.length > 1) return { ok:false, why:'같은 이름이 ' + hit.length + '분이라 <b>안 이었습니다</b>' };
  return { ok:true, row:hit[0] };
}

/* ══ 9. 기사 고르기 — 진짜 기사만 ══════════════════════════════════
   제목 · 언론사 · 링크가 다 있어야 한다. 날짜가 <b>앞날</b>이면 버린다
   (실제로 그런 피드가 있다). 지어낸 기사는 한 건도 못 나가게 한다 (9번). */
/* ⚠ 기사 한 건이 <b>두 가지 모양</b>으로 다닌다. 서버에서 막 받아 왔을
   때는 {title, desc, source, url} 이고, 앱에 담기고 나면 {t, u, s, d} 다.
   한쪽만 보면 <b>진짜 기사를 전부 버린다</b> — 실제로 그랬다. 둘 다 본다. */
function pickField(it, a, b) { return txt((it && it[a]) || (it && it[b])); }
function goodItem(it, today) {
  if (!it) return false;
  if (!pickField(it, 'title', 't')) return false;
  if (!pickField(it, 'source', 's')) return false;
  if (!/^https?:\/\//.test(pickField(it, 'u', 'url'))) return false;
  var d = pickField(it, 'd', 'date').slice(0, 10);
  /* 날짜는 <b>있을 때만</b> 본다 — 없다고 버리면 날짜를 안 주는 피드가
     통째로 사라진다. 앞날이면 버린다 (실제로 그런 피드가 있다). */
  if (d && today && d > today) return false;
  return true;
}
function pick(cat, items, today) {
  var i, out = [];
  for (i = 0; i < (items || []).length; i++) {
    var it = items[i];
    if (!goodItem(it, today)) continue;
    if ((it.cats || []).indexOf(cat) >= 0) out.push(it);
  }
  return out.length ? out[0] : null;
}

/* ══ 10. AI 는 <b>고르기만</b> 한다 ═════════════════════════════════
   AI 에게 자유롭게 쓰게 두면 없는 사실을 만든다 — 「이 고객은 자영업자
   입니다」 처럼. 그래서 두 가지를 막는다.
     ① <b>여섯 갈래 중 하나를 고르게만</b> 한다. 밖의 답은 버린다.
     ② 근거로 쓴 문장을 <b>원문에서 그대로 복사</b>하게 하고, 돌아온
        문장이 원문에 <b>실제로 있는지 글자로 대조</b>한다. 없으면 버린다.
        ← 지어내면 <b>자동으로 걸린다.</b> 이것이 안전장치의 전부다.
   ★ 이름 · 전화번호는 <b>안 보낸다</b> (3번). 보내는 것은 메모 글뿐이다. */
/* ── AI 로 나가기 전에 <b>씻는다</b> ─────────────────────────────────
   실제 메모를 보니 <b>주민등록번호</b>가 적혀 있었다(두 건). 전화번호·계좌도
   들어갈 수 있다. 이런 것이 바깥으로 나가면 되돌릴 방법이 없다 (10번).
   ★ 갈래를 고르는 데 <b>필요 없는 것</b>이라 지워도 판정이 안 바뀐다.
   ★ <b>이름</b>도 지운다 — 메모에 다른 고객 실명이 적혀 있었다 (3번).
     아는 이름을 넘겨 주면 그것만 지우고, 못 넘겨 줘도 번호는 지운다.
   ★ 지운 자리는 <b>○</b> 로 남긴다 — 통째로 없애면 문장이 무너져서 AI 가
     엉뚱하게 읽는다.                                                    */
function scrub(s, names) {
  var t = txt(s);
  t = t.replace(/\d{6}\s*-\s*\d{7}/g, '○○○○○○-○○○○○○○');      /* 주민등록번호 */
  t = t.replace(/01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/g, '○○○-○○○○-○○○○'); /* 휴대전화 */
  t = t.replace(/0\d{1,2}[-\s.]\d{3,4}[-\s.]\d{4}/g, '○○-○○○-○○○○');       /* 유선전화 */
  t = t.replace(/\d{2,6}-\d{2,6}-\d{2,8}/g, '○○-○○-○○');                     /* 계좌 꼴 */
  t = t.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '○○@○○');                  /* 메일 */
  (names || []).forEach(function (n) {
    n = txt(n).replace(/^\s+|\s+$/g, '');
    if (n.length < 2) return;
    t = t.split(n).join(n.charAt(0) + '○○');
  });
  return t;
}
/* ══ 9. <b>아침 미팅 준비 자료</b> — 지어내지 않고 <b>모아 드린다</b> ══════
   사장님 말씀 (2026-09-22) — 「나이대만 보고 고르지 말고, 매일 아침 고객을
   미팅할 수 있도록 <b>자료를 정말 완벽하고 꼼꼼하게</b> 준비해 줘」.

   그래서 여기가 하는 일은 <b>판단이 아니라 모으기</b>다. 한 분에 대해 앱
   안에 적혀 있는 것을 <b>하나도 안 빠뜨리고</b> 한 자리에 세운다. 우리가
   해석해서 얹는 말은 한 줄도 없다 — 사장님 글자 그대로다.

     ★ <b>값이 없으면 줄을 안 세운다.</b> 대신 「안 적혀 있는 것」으로 모아
       마지막에 적는다 — 빠뜨린 것이 아니라 <b>없는 것</b>임을 아셔야 한다.
     ★ <b>「모름」과 「0」을 가른다.</b> 사망보험금 빈칸은 「안 적으심」이고
       0 은 「없다고 적으심」이다. 섞으면 보장이 없는 분과 안 물어본 분이
       같아 보인다 (1번).
     ★ <b>지난 접촉 기록은 해석하지 않는다.</b> 「청약」·「TA」·「증권드림」
       은 업무 기록이지 고객의 관심사가 아니다. 소식 갈래를 여기서 읽으면
       헛것을 잡는다 (8번). <b>날짜와 함께 그대로 보여 드린다</b> — 어제
       무엇을 했는지가 오늘 첫 마디를 만든다.
     ★ <b>씻고 내보낸다.</b> 주민등록번호·전화·계좌가 메모에 실제로 있다 (3번).
     ★ 금액은 <b>만원</b>으로 받아 억으로 적는다 (4번).                    */
var BRIEF_FP = [
 {t:'수입', ks:['f_income','f_sincome','f_etc']},
 {t:'나가는 돈', ks:['f_house','f_loan','f_edu','f_ins','f_living']},
 {t:'노후', ks:['f_ret','f_retspend','f_np','f_pp','f_dc']},
 {t:'집·빚', ks:['f_home','f_debt']},
 {t:'지금 있는 보장', ks:['c_cancer','c_brain','c_heart','c_care','c_death']}
];
/* <b>만원</b>을 받는다 (4번). 억이 넘으면 억으로 적는다 — 「50,000만원」은
   한 박자 늦게 읽힌다.                                                  */
function briefWon(v) {
  var n = manOf(v); if (n === null) return '';
  if (n === 0) return '0';
  if (n >= 10000) {
    var eok = Math.floor(n / 10000), rest = n % 10000;
    return eok + '억' + (rest ? (' ' + rest.toLocaleString() + '만원') : '');
  }
  return n.toLocaleString() + '만원';
}
function briefOne(fp, k) {
  var f = FIELD[k]; if (!f) return '';
  var raw = fp[k];
  if (f.u === '글') { var t = txt(raw); return t ? (f.t + ' ' + t) : ''; }
  var n = manOf(raw); if (n === null) return '';
  if (f.u === '세') return f.t + ' ' + n + '세';
  /* 0 은 <b>적으신 값</b>이다 — 보장 칸의 0 은 「없다」는 뜻이라 꼭 말한다 */
  if (n === 0) return f.t + ' <b>0</b>' + (k.charAt(0) === 'c' ? ' (없다고 적으심)' : '');
  return f.t + ' ' + briefWon(n);
}
/* 한 분에 대해 <b>적혀 있는 것 전부</b>. 없는 것은 miss 로 따로 모은다.  */
function brief(input) {
  var x = input || {}, fp = x.fp || {}, rows = [], miss = [], i, v, L, g, seg;
  var names = x.names || [];
  var wash = function (t) { return scrub(t, names).replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, ''); };

  /* ① 잡아 둔 약속·마지막 통화 — <b>배정 DB 줄</b>의 사실이다.
     고객 365일 분들은 이 칸이 없고, 배정 DB 분들은 이것밖에 없다 —
     한 틀로 모으면 <b>둘 다 같은 카드</b>를 보시게 된다 (5번).       */
  var db = x.db || {};
  if (txt(db.appt))
    rows.push({ ic:'📅', k:'잡아 둔 약속', v:txt(db.appt).replace('T', ' ').slice(0, 16),
                at:'', src:'DB 통합 CRM' });
  if (txt(db.res) && txt(db.res) !== '미진행')
    rows.push({ ic:'☎️', k:'마지막 통화', v:txt(db.res) + (db.n > 1 ? (' · 지금까지 ' + db.n + '번') : ''),
                at:txt(db.last).slice(0, 10), src:'DB 통합 CRM' });

  /* ② 다음에 하기로 한 것 — 약속은 <b>맨 위</b>다 */
  var nx = x.next || {};
  if (txt(nx.what))
    rows.push({ ic:'📌', k:'다음에 하기로 한 것', v:wash(nx.what),
                at:txt(nx.due), src:'고객 365일' });
  else miss.push('다음에 할 일');

  /* ② 지난번에 하신 것 — <b>해석하지 않고 그대로</b>, 날짜와 함께 */
  L = (x.touch || []).slice(0).filter(function (t) { return t && txt(t.note); });
  L.sort(function (a, b) { return txt(b.at) < txt(a.at) ? -1 : 1; });
  for (i = 0; i < L.length && i < 3; i++)
    rows.push({ ic:'🕘', k:(i ? '' : '지난번에 하신 것'), v:wash(L[i].note),
                at:txt(L[i].at).slice(0, 10), src:txt(L[i].how) });
  if (!L.length) miss.push('지난 접촉 기록');

  /* ③ 그 분이 어떤 분인가 — 직업·나이대 */
  v = txt(fp.f_job);
  if (v) rows.push({ ic:'💼', k:'직업', v:v, at:'', src:'재무설계 답' });
  else miss.push('직업');
  if (txt(x.band)) rows.push({ ic:'🎂', k:'나이대', v:BAND_T[x.band] || txt(x.band),
                               at:'', src:'출생연도' });
  else miss.push('출생연도');

  /* ④ 적어 두신 숫자 — 있는 칸만. <b>0 은 0 이라고</b> 적는다 */
  var anyFp = false;
  for (g = 0; g < BRIEF_FP.length; g++) {
    var parts = [];
    for (i = 0; i < BRIEF_FP[g].ks.length; i++) {
      if (BRIEF_FP[g].ks[i] === 'f_job') continue;
      seg = briefOne(fp, BRIEF_FP[g].ks[i]);
      if (seg) parts.push(seg);
    }
    if (!parts.length) continue;
    anyFp = true;
    rows.push({ ic:'💰', k:BRIEF_FP[g].t, v:parts.join(' · '), at:'', src:'재무설계 답' });
  }
  if (!anyFp) miss.push('재무설계 답');

  /* ⑤ 적어 두신 글 — 가구 메모 · 통화 메모 · DB 메모 */
  var any = false;
  if (txt(x.hn)) { rows.push({ ic:'🏠', k:'가구 메모', v:wash(x.hn), at:'', src:'고객 365일' }); any = true; }
  L = x.notes || [];
  for (i = 0; i < L.length && i < 4; i++) {
    if (!L[i] || !txt(L[i].t)) continue;
    rows.push({ ic:'📝', k:txt(L[i].src) || '메모', v:wash(L[i].t),
                at:txt(L[i].at).slice(0, 10), src:'' });
    any = true;
  }
  if (!any) miss.push('메모 한 줄');

  return { rows:rows, miss:miss, n:rows.length };
}
function aiPrompt(notes, names) {
  var L = [], i;
  for (i = 0; i < (notes || []).length && i < 12; i++)
    L.push('- [' + (notes[i].src || '메모') + ' ' + String(notes[i].at || '').slice(0,10) + '] ' +
           scrub(notes[i].t, names));
  var cats = CATS.map(function (c) { return c.id + '(' + c.t + ')'; }).join(' · ');
  return [
    '아래는 보험 설계사가 한 고객에 대해 적어 둔 메모입니다.',
    '이 고객에게 전할 소식의 갈래를 아래 여섯 중 <하나만> 고르십시오.',
    '  ' + cats,
    '',
    '규칙 — 반드시 지키십시오.',
    '1. 메모에 적혀 있지 않은 사실은 절대 쓰지 마십시오.',
    '2. quote 는 메모에서 <글자 그대로> 복사한 한 조각이어야 합니다. 고치거나 요약하지 마십시오.',
    '3. 고를 근거가 메모에 없으면 cat 을 빈 문자열로 두십시오. 억지로 고르지 마십시오.',
    '4. 아래 JSON 한 줄로만 답하십시오. 다른 말을 붙이지 마십시오.',
    '   {"cat":"","quote":"","why":""}',
    '',
    '메모:',
    L.join('\n')
  ].join('\n');
}
/* 돌아온 답을 받는다 — <b>못 믿을 것은 버린다</b> */
function aiTake(raw, notes) {
  var j = null;
  try {
    var s = txt(raw), a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b < a) return { ok:false, why:'JSON 을 못 찾았습니다' };
    j = JSON.parse(s.slice(a, b + 1));
  } catch (e) { return { ok:false, why:'JSON 이 깨졌습니다' }; }
  var cat = txt(j.cat), q = txt(j.quote).replace(/\s+/g, ' ').replace(/^…|…$/g, '').trim();
  if (!cat) return { ok:false, why:'AI 도 못 골랐습니다' };
  if (!CATID[cat]) return { ok:false, why:'없는 갈래를 말했습니다 — ' + cat };
  if (!q) return { ok:false, why:'근거 문장이 없습니다' };
  /* ★ 원문 대조 — 지어냈으면 여기서 걸린다 */
  var i, hay, hit = null;
  for (i = 0; i < (notes || []).length; i++) {
    hay = txt(notes[i].t).replace(/\s+/g, ' ');
    if (hay.indexOf(q) >= 0) { hit = notes[i]; break; }
  }
  if (!hit) return { ok:false, why:'<b>메모에 없는 문장을 지어냈습니다</b> — 버립니다' };
  return { ok:true, cat:cat, why:{ cat:cat, w:50, rule:'AI', src:(hit.src || '메모'),
    at:String(hit.at || '').slice(0,10), quote:q, say:txt(j.why).slice(0, 80), old:null } };
}

g.APEX_FIT = {
  cats:CATS, catOf:function (id) { return CATID[id] || null; },
  field:FIELD, rules:RULES, words:WORDS, biz:BIZ, job:JOB, band:BAND, bandT:BAND_T, jobHit:jobHit,
  /* 아침 미팅 준비 자료 — <b>판단이 아니라 모으기</b>다 */
  brief:brief, briefWon:briefWon, briefOne:briefOne, briefFp:BRIEF_FP,
  manOf:manOf, cut:cut, wordHit:wordHit, oldDays:OLD_DAYS, scrub:scrub,
  fit:fit, need:needOf, tie:tie,
  goodItem:goodItem, pick:pick,
  aiPrompt:aiPrompt, aiTake:aiTake
};

})(typeof window !== 'undefined' ? window : this);
