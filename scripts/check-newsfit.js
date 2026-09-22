/* 고객 ↔ 소식 맞춤 — <b>잘못된 값을 넣지도 뽑지도 않는가</b>

   사장님 말씀 (2026-09-22) —
     「고객 정보를 읽어서 어떤 뉴스를 전달할지 … <b>잘못된 값을 입력 또는
      추출하지 않도록</b> 여기에 대해서 정말 <b>정밀하게</b> 시스템을 만들어야 돼」

   그래서 이 점검이 보는 것은 「맞게 고르는가」가 아니라
   <b>「틀리게 고르지 않는가」</b> 입니다. 여덟 자리를 못 박습니다.

     ①  <b>근거가 없으면 갈래를 안 만든다.</b> 적힌 것이 하나도 없는 분이
         조용히 어느 갈래로 떨어지면 안 된다 — 실제로 109명 중 105명이
         「보험」으로 떨어지고 있었고 그중 94명이 이 경우였다.
     ②  <b>「모름」과 「0」을 가른다.</b> 보장 칸을 0 으로 <b>적으신</b> 것과
         <b>아직 안 적으신</b> 것은 다른 일이다.
     ③  <b>아니라는 말을 본다.</b> 「가게 접었다」 를 사업자로 읽지 않는다.
     ④  <b>짐작하지 않는다.</b> 대출 잔액만으로 「부동산」이라 말하지 않는다 —
         그 대출이 주택담보인지 우리는 모른다.
     ⑤  <b>인용은 원문 그대로다.</b> 화면에 적는 근거는 우리가 쓴 글이 아니라
         사장님이 적어 두신 그 글자여야 한다.
     ⑥  <b>AI 가 지어내면 버린다.</b> 돌아온 문장이 원문에 없으면 안 쓴다.
         없는 갈래를 말해도 안 쓴다.
     ⑦  <b>동명이인은 안 잇는다.</b> 남의 메모를 이 분 것이라 말하지 않는다.
     ⑧  <b>갈래가 하나도 안 빠진다.</b> 여섯 갈래가 다 규칙에 들어 있다 —
         사슬로 나열하면 반드시 하나를 빠뜨린다(정책자금이 그랬다).

   앞 절반은 브라우저 없이 <b>표와 함수만</b> 봅니다(몇 초). 뒤 절반은
   홈을 실제로 띄워 <b>화면에 그렇게 찍히는지</b> 봅니다.
   견본 이름은 언제나 「홍길동」입니다 (3번).                            */
const path = require('path'), fs = require('fs');
const ROOT = process.cwd();
const F = require(path.join(ROOT, 'apex-newsfit.js')).APEX_FIT;

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
/* ⚠ 점검이 <b>자기가 재는 것이 깨져도</b> 끝까지 돌아야 한다. 한 자리를
   되돌려 봤더니 점검이 빨간불 대신 <b>터져 버려서</b>, 뒤의 두 자리를
   아예 못 쟀다 — 그러면 한 곳이 망가졌을 때 나머지가 통째로 눈이 먼다.
   그래서 화면에 적을 글을 만들 때는 <b>없을 수도 있다</b>고 보고 만든다. */
const plain = v => {
  if (v === null || v === undefined) return '(없음)';
  /* 덩어리가 오면 그대로 「[object Object]」 라고 찍힌다 — 빨간불이 켜졌을 때
     <b>무엇이 왔는지</b> 안 보이면 고치는 데 시간이 두 배로 든다. */
  var t = (typeof v === 'object') ? JSON.stringify(v) : String(v);
  return t.replace(/<[^>]+>/g, '');
};
const head = t => console.log('\n' + t);
const T = '2026-09-22';
const fit = (fp, notes) => F.fit({ fp: fp || {}, notes: notes || [], today: T });

head('[1] <b>근거가 없으면 갈래를 안 만든다</b> (1번)');
const empty = fit({}, []);
is(empty.read === false && empty.cat === '',
   '적힌 것이 하나도 없으면 <b>못 읽음</b> — 조용히 어느 갈래로 안 떨어진다');
is(empty.need.length > 0,
   '  <b>무엇을 채우면 읽히는지</b> 말한다 — ' + plain((empty.need||[]).join(' · ')));
/* 옛 규칙이 샌 그 자리를 그대로 재현해 본다 */
is(fit({ f_ins: '' }, []).read === false, '  빈 글자만 있는 것도 <b>못 읽음</b>이다');
is(fit({ c_cancer: '', c_death: '' }, []).read === false,
   '  보장 칸이 <b>비어</b> 있으면 「보험」으로 안 보낸다 ← 94명이 여기로 샜다');

head('[2] <b>「모름」과 「0」을 가른다</b> (1번)');
const zero = fit({ c_cancer: '0', c_death: '0' }, []);
is(zero.read && zero.cat === 'ins', '0 으로 <b>적으신</b> 것은 읽는다 — ' + zero.cat);
is(/0/.test(plain(zero.why && zero.why.say)), '  근거에 <b>0 이라고 적혀 있다</b>고 쓴다 — ' + plain(zero.why && zero.why.say));
is(F.manOf('') === null && F.manOf('0') === 0,
   '  빈칸은 <b>null</b>, 0 은 <b>0</b> — 섞지 않는다');

head('[3] <b>아니라는 말을 본다</b> — 「가게 접었다」');
is(F.biz.hit('제조업 대표') === true, '「제조업 대표」 는 사업자로 읽는다');
is(F.biz.hit('작년에 가게 접었다고 함') === false, '「가게 <b>접었다</b>」 는 사업자로 안 읽는다');
is(F.biz.hit('폐업하고 지금은 회사 다님') === false, '「<b>폐업</b>」 도 마찬가지다');
const shut = fit({}, [{ src: '통화 메모', at: '2026-08-12', t: '작년에 가게 접었다고 함' }]);
is(shut.read === false, '  그래서 <b>못 읽음</b>이 된다 — 틀리게 고르느니 안 고른다');

head('[4] <b>짐작하지 않는다</b> — 대출 잔액만으로 부동산이라 안 한다');
is(fit({ f_debt: '15000' }, []).read === false,
   '대출 잔액만 있으면 <b>안 읽는다</b> — 주택담보인지 신용인지 모른다');
const hl = fit({ f_home: '60000', f_loan: '120' }, []);
is(hl.read && hl.cat === 'realty', '거주 부동산이 <b>같이</b> 적혀 있으면 부동산으로 읽는다');
is(/거주 부동산/.test(plain(hl.why && hl.why.say)) && /대출/.test(plain(hl.why && hl.why.say)),
   '  근거에 <b>둘 다</b> 적는다 — ' + plain(hl.why && hl.why.say));

head('[5] <b>인용은 원문 그대로다</b>');
const memo = '가게 임대료 부담된다고 하심';
const biz = fit({}, [{ src: '통화 메모', at: '2026-08-12', t: memo }]);
is(biz.read && biz.cat === 'fund', '메모에서 <b>정책자금</b>을 읽는다 — 옛 규칙에 아예 없던 갈래다');
const q = plain(biz.why && biz.why.quote).replace(/^…|…$/g, '');
is(memo.indexOf(q) >= 0, '  근거 문장이 <b>원문에 실제로 있다</b> — 「' + q + '」');
is(!!biz.why && biz.why.src === '통화 메모' && biz.why.at === '2026-08-12',
   '  <b>어디서 언제</b> 나온 글인지 같이 말한다 — ' + plain(biz.why && biz.why.src) + ' · ' + plain(biz.why && biz.why.at));

head('[6] <b>오래된 근거는 오래됐다고</b> 말한다');
const old = fit({}, [{ src: '통화 메모', at: '2024-08-12', t: '전세 만기 이야기' }]);
is(old.read && !!old.why && old.why.old > F.oldDays, '두 해 전 메모는 <b>며칠 지났는지</b>를 달고 온다 — ' + plain(old.why && old.why.old) + '일');
const fresh = fit({}, [{ src: '통화 메모', at: '2026-09-20', t: '전세 만기 이야기' }]);
is(!!fresh.why && fresh.why.old === null, '  최근 메모에는 안 붙인다');
is(!!fresh.why && !!old.why && fresh.why.w > old.why.w, '  오래된 것은 <b>힘이 깎인다</b> — ' + plain(old.why && old.why.w) + ' < ' + plain(fresh.why && fresh.why.w));

head('[7] <b>AI 는 고르기만</b> 한다 — 지어내면 버린다');
const notes = [{ src: '통화 메모', at: '2026-08-12', t: memo }];
const pr = F.aiPrompt(notes);
is(/그대로|복사/.test(pr) && /억지로 고르지/.test(pr),
   'AI 에게 <b>원문 그대로 복사</b>하라고 · <b>억지로 고르지 말라</b>고 시킨다');
is(pr.indexOf('홍길동') < 0 && !/010-/.test(pr), '  <b>이름·전화번호가 안 들어간다</b> (3번)');
const made = F.aiTake('{"cat":"fund","quote":"자영업을 하신다","why":"x"}', notes);
is(made.ok === false && /지어냈/.test(plain(made.why)),
   '메모에 <b>없는 문장</b>을 돌려주면 버린다 — ' + plain(made.why));
is(F.aiTake('{"cat":"연금","quote":"가게 임대료"}', notes).ok === false,
   '<b>없는 갈래</b>를 말하면 버린다');
is(F.aiTake('{"cat":"","quote":""}', notes).ok === false, '<b>못 골랐다</b>고 하면 그대로 못 읽음이다');
is(F.aiTake('{"cat":"fund","quote":"가게 임대료 부담"}', notes).ok === true,
   '원문 그대로면 <b>받는다</b>');
is(F.aiTake('말이 안 되는 글', notes).ok === false, '깨진 답도 버린다');

head('[7-2] <b>사장님 진짜 자료로 돌려 보고 막은 자리</b> (2026-09-22)');
/* 109분께 그대로 돌려 보니 34분이 읽혔는데, 들여다보니 <b>네 가지가
   틀리게</b> 읽히고 있었다. 막고 나니 13분이 됐다 — 줄어든 것이 아니라
   <b>정직해진</b> 것이다. 아래가 그 네 가지다. */
const memoEnd  = '기존 다른 담당자한테 보장분석받고 모두 정리했다고함 종결';
is(fit({}, [{ src: 'DB 메모', at: '2026-08-01', t: memoEnd }]).read === false,
   '「<b>종결</b>」 이 있으면 보험으로 안 읽는다 — 끝난 분이다');
is(F.biz.hit('한신뷔페식당업무중') === false,
   '「식당<b>업무중</b>」 은 사장이 아니다 — 거기서 일하시는 분이다');
is(F.biz.hit('당뇨합병증/식당운영/') === true, '  「식당<b>운영</b>」 은 사장으로 읽는다');
const kid = fit({}, [{ src: 'DB 메모', at: '2026-08-25', t: '본인,배우자,자녀 컨설팅' }]);
is(kid.cat !== 'help',
   '「<b>자녀</b> 컨설팅」 을 육아 지원금으로 안 읽는다 — 보험 상담 이야기다');
is(fit({}, [{ src: 'DB 메모', at: '2026-08-18', t: '고지혈증 약 복용중, 맹장수술 6년전 4일 입원' }]).read === false,
   '<b>병력만으로는 안 읽는다</b> — 고객에게 꺼낼 말이 아니고 민감한 정보다');
is(fit({}, [{ src: '통화 메모', at: '2026-08-14', t: '순천에 오셔서 증권전달함' }]).read === false,
   '「<b>증권전달</b>」 은 근거가 못 된다 — 이미 판 것이다');
/* 인용에 <b>옆의 병력이 딸려 오면</b> 안 된다 */
const seg = fit({}, [{ src: '가구 메모', at: '', t: '당뇨합병증/식당운영/이동용' }]);
is(seg.read && seg.cat === 'fund', '「당뇨합병증/<b>식당운영</b>/」 에서 사업자를 읽는다');
is(plain(seg.why && seg.why.quote).indexOf('당뇨') < 0,
   '  인용은 <b>걸린 조각 하나</b>다 — 옆의 병력이 안 딸려 온다 · 「' +
   plain(seg.why && seg.why.quote) + '」');

head('[7-3] AI 로 나가기 전에 <b>씻는다</b> (3·10번)');
/* 실제 메모에 <b>주민등록번호</b>가 적혀 있었다. 바깥으로 나가면 되돌릴 수 없다. */
const dirty = '귀화함 메리츠화재실비 951222-2512231 / 김홍락 010-1234-5678 hong@x.com';
const clean = F.scrub(dirty, ['김홍락']);
is(!/\d{6}\s*-\s*\d{7}/.test(clean), '<b>주민등록번호</b>를 지운다 — 실제 메모에 있었다');
is(!/010[-\s.]?\d{3,4}/.test(clean), '<b>전화번호</b>를 지운다');
is(clean.indexOf('@x.com') < 0, '<b>메일</b>을 지운다');
is(clean.indexOf('김홍락') < 0, '<b>이름</b>을 지운다 (3번) — 메모에 다른 고객 실명이 있었다');
is(clean.indexOf('메리츠화재실비') >= 0, '  <b>판정에 쓰는 말은 남긴다</b> — 지우면 못 읽는다');
is(clean.indexOf('○') >= 0, '  지운 자리는 <b>○ 로 남긴다</b> — 통째로 없애면 문장이 무너진다');
const pr2 = F.aiPrompt([{ src: '통화 메모', at: '2026-08-01', t: dirty }], ['김홍락']);
is(!/\d{6}\s*-\s*\d{7}/.test(pr2) && pr2.indexOf('김홍락') < 0,
   'AI 에게 보내는 글은 <b>씻고 나간다</b>');

head('[7-4] <b>직업을 읽는다</b> — 다만 말할 수 있는 세 가지만 (1번)');
/* 사장님 물음 (2026-09-22) — 「직업 연령대도 읽어서 맞출수 있어?」
   됩니다. 다만 <b>짐작 없이 말할 수 있는 것만</b> 읽습니다 — 사업자·직역연금·
   동종업계 셋뿐입니다. 「생산직」·「청소」·「it」 로 갈래를 정하려면 「이런 일을
   하니 이런 소식이 궁금하시다」는 <b>우리 짐작</b>을 엹어야 합니다.           */
is((F.jobHit('순천시청 공무원') || {}).cat === 'econ',
   '<b>공무원</b>은 읽는다 — 직역연금 자리라 노후 이야기의 결이 다르다');
is((F.jobHit('장교') || {}).cat === 'econ', '  <b>장교·군인</b>도 같다');
is((F.jobHit('보호감찰소직원') || {}).cat === 'econ', '  <b>보호감찰소</b>도 같다');
is((F.jobHit('보험설계사') || {}).cat === 'ins',
   '<b>같은 업계</b>에 계시면 보험 — 업계 소식을 일로 보신다');
is(F.jobHit('생산직/설비') === null, '<b>생산직</b>은 안 읽는다 — 짐작을 얹어야 한다');
is(F.jobHit('청소') === null && F.jobHit('it') === null,
   '  <b>청소·it</b> 도 안 읽는다 — 실제로 적혀 있는 직업들이다');
is(F.jobHit('퇴직한 공무원') === null,
   '<b>「퇴직」이 있으면 안 읽는다</b> — 지금 그 자리가 아니다');
is(F.jobHit('') === null && F.jobHit(null) === null, '  빈 칸은 당연히 안 읽는다');
const jobFit = fit({ f_job: '순천시청 공무원' }, []);
is(jobFit.read && jobFit.cat === 'econ' && plain(jobFit.why && jobFit.why.say).indexOf('순천시청') >= 0,
   '근거에 <b>적힌 그대로</b> 적혀 나온다 — 「' +
   plain(jobFit.why && jobFit.why.say).slice(0, 44) + '」');
is(fit({ f_job: '제조업 대표' }, []).cat === 'fund',
   '  <b>사장님은 정책자금</b>으로 — 한 사람이 두 갈래로 갈리지 않는다 (5번)');

head('[7-5] <b>나이대는 가장 약한 근거</b>로 다룬다 (1번)');
const band = b => F.fit({ fp: {}, notes: [], band: b, today: T });
is(band('2030').read && band('2030').cat === 'help',
   '<b>20·30대</b> — 청년·신혼부부·출산 지원은 실제로 나이로 갈린다');
is(band('60').read && band('60').cat === 'econ',
   '<b>60대 이상</b> — 연금·기초연금도 그렇다');
is(band('4050').read === false,
   '<b>40·50대는 안 만들었다</b> — 나이로 갈리는 제도가 없어 ' +
   '지어내느니 <b>모른다고</b> 한다');
is(band('').read === false && band(null).read === false,
   '  출생연도를 모르면 당연히 모른다 — 배정 DB 에는 그 칸이 아예 없다');
const strong = F.fit({ fp: { f_job: '자영업' }, notes: [], band: '2030', today: T });
is(strong.cat === 'fund',
   '<b>진짜 근거가 나이대를 이긴다</b> — 자영업 + 20·30대 → ' + plain(strong.cat));
is((strong.alts || []).length > 0,
   '  진 것은 <b>alts 로 남긴다</b> — 사장님이 바꾸실 수 있게');
is(plain(band('60').why && band('60').why.src).indexOf('출생년도') >= 0,
   '  근거가 <b>어디서 왔는지</b> 적는다 — 「' + plain(band('60').why && band('60').why.src) + '」');

head('[7-6] <b>칸에 든 것이 연도인지 날짜인지</b> 가린다 (1번)');
/* 실제 자료 — clients.birth_year 에 <b>생년월일</b>을 적어 두신 분이 7분
   계셨다(19600324 · 850627). 그냥 버리면 <b>아는 나이를 모른다</b>고 적게 되고,
   마음대로 고치면 지어내는 것이다. <b>틀림없을 때만</b> 읽는다.        */
const ST = require(path.join(ROOT, 'apex-stage.js')).APEX_STAGE;
const born = v => ST.bornYear(v, 2026);
is(born(1988) === 1988, '네 자리는 <b>그대로</b> 연도다');
is(born(19600324) === 1960, '여덟 자리 <b>YYYYMMDD</b> → 앞 네 자리 · 실제로 적혀 있던 값이다');
is(born(850627) === 1985 && born(741201) === 1974,
   '여섯 자리 <b>YYMMDD</b> → 나이가 말이 되는 쪽이 <b>하나뿐일 때만</b>');
is(born(20315) === 2002, '  다섯 자리는 <b>앞의 0 이 떨어진</b> 여섯 자리다 (020315)');
is(born(200315) === 0,
   '<b>둘 다 말이 되면 모른다고</b> 한다 — 200315 는 1920 도 2020 도 된다 (1번)');
is(born(19601332) === 0 && born(196) === 0 && born(null) === 0,
   '  달·날이 말이 안 되거나 모양이 아니면 <b>안 읽는다</b>');
is(ST.ageBand(19600324, 2026) === '60' && ST.ageBand(850627, 2026) === '4050',
   '  나이대도 그만큼 더 읽힌다 — <b>세는 곳은 여전히 한 곳</b>이다 (5번)');

head('[7-7] <b>주소를 「집 알아보시는 분」으로 읽지 않는다</b> (8번)');
/* 실제 메모 — 화재보험 상담을 하신 분인데 주소에 「…돌산청솔<b>2단지
   아파트</b>)」 가 있어 부동산으로 읽혔다. 「아파트」는 <b>사는 곳</b>이지
   <b>하시려는 일</b>이 아니다 — 나머지 낱말과 결이 달라 빼다.              */
const addr = '강남동로 46-25 204동 1102호 (우두리 돌산청솔 2단지아파트)';
is(fit({}, [{ src: '가구 메모', at: '', t: addr }]).cat !== 'realty',
   '주소에 들어 있는 「<b>아파트</b>」 를 부동산 관심으로 안 읽는다');
is(fit({}, [{ src: '가구 메모', at: '', t: '전세 재계약 알아보시는 중' }]).cat === 'realty',
   '  진짜 <b>하시려는 일</b>은 그대로 읽는다 — 넓게 말고 확실한 것만 (8번)');
/* 읽기 <b>전에</b> 씩지 않으면 주민등록번호가 그대로 화면 근거로 박힌다 */
const rrn = fit({}, [{ src: '가구 메모', at: '',
  t: '식당운영 / 홍길동 951222-2512231 / 010-1234-5678' }]);
is(rrn.read && plain(rrn.why && rrn.why.quote).indexOf('2512231') < 0,
   '<b>화면 근거에도</b> 주민등록번호가 안 박힌다 — 읽기 <b>전에</b> 씻는다 (3번)');

head('[8] <b>동명이인은 안 잇는다</b> (3번)');
const pool = [{ name: '홍길동', id: 'a' }, { name: '홍길동', id: 'b' }, { name: '홍길순', id: 'c' }];
const two = F.tie('홍길동', pool);
is(two.ok === false && /같은 이름/.test(plain(two.why)), '같은 이름이 둘이면 <b>안 잇고</b> 그렇다고 말한다');
is(F.tie('홍길순', pool).ok === true, '한 분뿐이면 잇는다');
is(F.tie('없는사람', pool).ok === false, '못 찾으면 <b>안 잇는다</b>');

head('[9] <b>갈래가 하나도 안 빠진다</b> (5번)');
const inRules = {};
F.rules.forEach(r => inRules[r.cat] = 1);
F.words.forEach(r => inRules[r.cat] = 1);
const missing = F.cats.filter(c => !inRules[c.id]).map(c => c.t);
is(missing.length === 0,
   '여섯 갈래가 <b>다</b> 규칙에 있다' + (missing.length ? (' ← 빠진 것: ' + missing.join(', ')) : ''));
is(F.cats.length === 6, '  갈래는 여섯이다 (' + F.cats.length + ')');
/* 갈래마다 실제로 하나라도 읽히는 길이 있는가 — 표에만 있고 길이 없으면 없는 것과 같다 */
const reach = {
  ins:    fit({ c_cancer: '0', c_death: '0' }, []),
  realty: fit({ f_home: '60000', f_loan: '120' }, []),
  tax:    fit({ f_income: '500', f_sincome: '250' }, []),
  help:   fit({ f_edu: '90' }, []),
  fund:   fit({ f_job: '제조업 대표' }, []),
  econ:   fit({ f_np: '120' }, [])
};
Object.keys(reach).forEach(k =>
  is(reach[k].read && reach[k].cat === k,
     '  <b>' + (F.catOf(k) || {}).t + '</b> 로 읽히는 길이 있다' +
     (reach[k].read ? '' : ' ← 못 읽음') + (reach[k].cat !== k ? (' ← ' + reach[k].cat) : '')));

head('[10] <b>진짜 기사만</b> 내보낸다 (9번)');
const ok1 = { title: '기준금리 동결', source: '연합뉴스', u: 'https://x/1', d: '2026-09-21', cats: ['econ'] };
is(F.goodItem(ok1, T) === true, '제목·언론사·링크가 다 있으면 받는다');
/* ⚠ 기사 한 건이 <b>두 가지 모양</b>으로 다닌다 — 서버에서 막 받았을 때는
   {title,source,url}, 앱에 담기고 나면 {t,s,u,d} 다. 한쪽만 보면 <b>진짜
   기사를 전부 버린다</b>. 실제로 그렇게 한 번 막혔다. */
is(F.goodItem({ t: '종부세 개편안', s: '한경', u: 'https://x/2', d: '', cats: ['tax'] }, T) === true,
   '<b>앱에 담긴 모양</b>({t,s,u})도 알아본다 ← 여기서 한 번 막혔다');
is(F.goodItem({ t: '제목만', u: 'https://x/2' }, T) === false, '  그 모양에서도 언론사가 없으면 버린다');
is(F.goodItem({ t: 'x', s: '한경', u: 'https://x/2', d: '' }, T) === true,
   '  <b>날짜가 없다고 버리지 않는다</b> — 날짜를 안 주는 피드가 통째로 사라진다');
is(F.goodItem({ title: '', source: '연합', u: 'https://x/1' }, T) === false, '<b>제목이 없으면</b> 버린다');
is(F.goodItem({ title: 'x', source: '', u: 'https://x/1' }, T) === false, '<b>언론사가 없으면</b> 버린다');
is(F.goodItem({ title: 'x', source: '연합', u: '' }, T) === false, '<b>링크가 없으면</b> 버린다');
is(F.goodItem({ title: 'x', source: '연합', u: 'https://x/1', d: '2027-01-01' }, T) === false,
   '날짜가 <b>앞날</b>이면 버린다');
is(F.pick('econ', [ok1], T) === ok1 && F.pick('fund', [ok1], T) === null,
   '그 갈래 기사만 고른다 — 없으면 <b>안 고른다</b>');

head('[11] <b>고객 칸에 아무것도 안 쓴다</b> (4번 · 입력을 막는 자리)');
const src = fs.readFileSync(path.join(ROOT, 'apex-newsfit.js'), 'utf8');
is(!/\bcmSave\s*\(|\.upsert\s*\(|\.insert\s*\(|\.update\s*\(/.test(src),
   '이 파일에는 <b>쓰는 자리가 한 곳도 없다</b> — 잘못된 값이 고객 정보로 들어갈 길 자체가 없다');
const before = JSON.stringify({ fp: { f_job: '제조업 대표' }, notes: notes });
const inp = { fp: { f_job: '제조업 대표' }, notes: notes };
F.fit(inp);
is(JSON.stringify({ fp: inp.fp, notes: inp.notes }) === before, '  넣어 준 것을 <b>고치지도 않는다</b>');

head('[12] 앱이 <b>이 표 하나</b>를 본다 (5번)');
const ix = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
is(/apex-newsfit\.js/.test(ix), 'index.html 이 이 파일을 읽어 들인다');
is(/var NL_CATS=\(typeof APEX_FIT/.test(ix), '뉴스 갈래표를 <b>여기서 가져다</b> 쓴다 — 또 적지 않는다');
is(!/\{id:'realty',t:'부동산'/.test(ix), '  index.html 에 갈래표가 <b>두 번째로</b> 적혀 있지 않다');
const ccSrc = (ix.split('function ccNewsCat(')[1] || '').slice(0, 260);
is(/ccFitOf/.test(ccSrc) && !/return 'ins'/.test(ccSrc),
   '옛 if 사슬이 없어졌다 — 못 읽으면 <b>빈 글자</b>를 돌려준다');
const idxSrc = (ix.split('function ccNewsIdx(')[1] || '').slice(0, 420);
is(/if\(!want\)return -1/.test(idxSrc),
   '갈래를 못 읽었으면 <b>기사를 안 고른다</b> — 맨 앞 기사를 그냥 주던 자리였다');
is(/goodItem/.test(idxSrc), '  고른 기사가 <b>진짜 기사인지</b> 한 번 더 본다 (9번)');
/* ── 새로 붙인 세 줄이 <b>실제로 연결되어</b> 있나 ────────────── */
const fitSrc = (ix.split('function ccFitOf(')[1] || '').slice(0, 520);
is(/band:ccBandOf\(id\)/.test(fitSrc),
   '<b>나이대를 같이 넘긴다</b> — 안 넘기면 표만 있고 아무도 안 쓴다');
const bandSrc = (ix.split('function ccBandOf(')[1] || '').slice(0, 420);
is(/APEX_STAGE\.ageBand/.test(bandSrc),
   '  나이대를 <b>여기서 안 센다</b> — APEX_STAGE.ageBand 한 곳이 센다 (5번)');
is(/AR\.cliRows/.test(bandSrc) && !/f_age/.test(bandSrc),
   '  출생연도는 <b>고객 365일</b> 에서만 찾는다 — f_age 에는 「12」 같은 값이 들어 있다');
is(/select\('id,advisor_id,name_masked,created_at,birth_year,household_notes'\)/.test(ix),
   '<b>가구 메모를 한 칸 더</b> 받는다 — 부르는 횟수는 그대로다 (7번)');
const notesSrc = (ix.split('function ccFitNotes(')[1] || '').slice(0, 900);
is(/C\[i\]\.hn/.test(notesSrc),
   '  그 가구 메모가 <b>실제로 엔진에 들어간다</b> — 고객 365일 분들은 ' +
   '통화 메모가 한 줄도 안 잡힌다');

console.log('\n' + '─'.repeat(30));
console.log(bad ? ('✗ 고객 ↔ 소식 — 고칠 자리 ' + bad + '곳')
                : '✓ 못 읽으면 못 읽었다고 하고, 지어낸 것은 한 건도 안 나갑니다.');
process.exit(bad ? 1 : 0);
