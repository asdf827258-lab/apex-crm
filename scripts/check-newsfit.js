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
const head = t => console.log('\n' + t);
const T = '2026-09-22';
const fit = (fp, notes) => F.fit({ fp: fp || {}, notes: notes || [], today: T });

head('[1] <b>근거가 없으면 갈래를 안 만든다</b> (1번)');
const empty = fit({}, []);
is(empty.read === false && empty.cat === '',
   '적힌 것이 하나도 없으면 <b>못 읽음</b> — 조용히 어느 갈래로 안 떨어진다');
is(empty.need.length > 0,
   '  <b>무엇을 채우면 읽히는지</b> 말한다 — ' + empty.need.join(' · '));
/* 옛 규칙이 샌 그 자리를 그대로 재현해 본다 */
is(fit({ f_ins: '' }, []).read === false, '  빈 글자만 있는 것도 <b>못 읽음</b>이다');
is(fit({ c_cancer: '', c_death: '' }, []).read === false,
   '  보장 칸이 <b>비어</b> 있으면 「보험」으로 안 보낸다 ← 94명이 여기로 샜다');

head('[2] <b>「모름」과 「0」을 가른다</b> (1번)');
const zero = fit({ c_cancer: '0', c_death: '0' }, []);
is(zero.read && zero.cat === 'ins', '0 으로 <b>적으신</b> 것은 읽는다 — ' + zero.cat);
is(/0/.test(zero.why.say), '  근거에 <b>0 이라고 적혀 있다</b>고 쓴다 — ' + zero.why.say.replace(/<[^>]+>/g, ''));
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
is(/거주 부동산/.test(hl.why.say) && /대출/.test(hl.why.say),
   '  근거에 <b>둘 다</b> 적는다 — ' + hl.why.say.replace(/<[^>]+>/g, ''));

head('[5] <b>인용은 원문 그대로다</b>');
const memo = '가게 임대료 부담된다고 하심';
const biz = fit({}, [{ src: '통화 메모', at: '2026-08-12', t: memo }]);
is(biz.read && biz.cat === 'fund', '메모에서 <b>정책자금</b>을 읽는다 — 옛 규칙에 아예 없던 갈래다');
const q = biz.why.quote.replace(/^…|…$/g, '');
is(memo.indexOf(q) >= 0, '  근거 문장이 <b>원문에 실제로 있다</b> — 「' + q + '」');
is(biz.why.src === '통화 메모' && biz.why.at === '2026-08-12',
   '  <b>어디서 언제</b> 나온 글인지 같이 말한다 — ' + biz.why.src + ' · ' + biz.why.at);

head('[6] <b>오래된 근거는 오래됐다고</b> 말한다');
const old = fit({}, [{ src: '통화 메모', at: '2024-08-12', t: '전세 만기 이야기' }]);
is(old.read && old.why.old > F.oldDays, '두 해 전 메모는 <b>며칠 지났는지</b>를 달고 온다 — ' + old.why.old + '일');
const fresh = fit({}, [{ src: '통화 메모', at: '2026-09-20', t: '전세 만기 이야기' }]);
is(fresh.why.old === null, '  최근 메모에는 안 붙인다');
is(fresh.why.w > old.why.w, '  오래된 것은 <b>힘이 깎인다</b> — ' + old.why.w + ' < ' + fresh.why.w);

head('[7] <b>AI 는 고르기만</b> 한다 — 지어내면 버린다');
const notes = [{ src: '통화 메모', at: '2026-08-12', t: memo }];
const pr = F.aiPrompt(notes);
is(/그대로|복사/.test(pr) && /억지로 고르지/.test(pr),
   'AI 에게 <b>원문 그대로 복사</b>하라고 · <b>억지로 고르지 말라</b>고 시킨다');
is(pr.indexOf('홍길동') < 0 && !/010-/.test(pr), '  <b>이름·전화번호가 안 들어간다</b> (3번)');
const made = F.aiTake('{"cat":"fund","quote":"자영업을 하신다","why":"x"}', notes);
is(made.ok === false && /지어냈/.test(made.why),
   '메모에 <b>없는 문장</b>을 돌려주면 버린다 — ' + made.why.replace(/<[^>]+>/g, ''));
is(F.aiTake('{"cat":"연금","quote":"가게 임대료"}', notes).ok === false,
   '<b>없는 갈래</b>를 말하면 버린다');
is(F.aiTake('{"cat":"","quote":""}', notes).ok === false, '<b>못 골랐다</b>고 하면 그대로 못 읽음이다');
is(F.aiTake('{"cat":"fund","quote":"가게 임대료 부담"}', notes).ok === true,
   '원문 그대로면 <b>받는다</b>');
is(F.aiTake('말이 안 되는 글', notes).ok === false, '깨진 답도 버린다');

head('[8] <b>동명이인은 안 잇는다</b> (3번)');
const pool = [{ name: '홍길동', id: 'a' }, { name: '홍길동', id: 'b' }, { name: '홍길순', id: 'c' }];
const two = F.tie('홍길동', pool);
is(two.ok === false && /같은 이름/.test(two.why), '같은 이름이 둘이면 <b>안 잇고</b> 그렇다고 말한다');
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

console.log('\n' + '─'.repeat(30));
console.log(bad ? ('✗ 고객 ↔ 소식 — 고칠 자리 ' + bad + '곳')
                : '✓ 못 읽으면 못 읽었다고 하고, 지어낸 것은 한 건도 안 나갑니다.');
process.exit(bad ? 1 : 0);
