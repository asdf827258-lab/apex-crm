/* 🤖 <b>자비스 새 판 목각이 앱의 글을 그대로 옮겼나</b> (판 X328)

   사장님 말씀 2026-11-04 — 「자비스 목각 버전으로 우선 만들자. 우선」.
   목각(docs/mokgak/자비스.html)은 그림이지만 <b>「화면의 글은 지금 자비스가 실제로 띄우는
   글 그대로」</b> 라고 적어 두었습니다. 그 말이 거짓이 되면, 그림을 보고 본체에 옷을 입힐 때
   <b>지어낸 대본</b>이 고객 앞으로 나갑니다 (1번).

   여기서 지키는 것 (브라우저 없이 · 몇 초)
     [1] 그림 속 대본(다섯 마디 · 「필요 없어요」 첫 마디 · 이어서)이 apex-stage.js 에 <b>한 글자도 다르지 않게</b> 있다
     [2] 거절 고르기의 말이 <b>두 거절 표</b>(apex-stage.js 의 obj · 질병가이드의 rej)에 있는 이름이다
     [3] 연금 문구가 자비스(app/apex-map.html)의 문구와 같다 — 접지 않고 늘 보인다고 적은 그 문구
     [4] 견본 고객은 홍길동뿐 — 다른 이름 · 진짜 번호가 없다 (3번)
     [5] 그림이 「앱이 아닙니다」 를 밝히고, /docs 는 밖으로 안 나간다(_redirects)               */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const plain = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\{[^{}]{1,8}\}/g, '').replace(/\s+/g, ' ').trim();

console.log('자비스 새 판 목각 — 앱의 글 그대로인가 (판 X328)');
const MK = rd('docs/mokgak/자비스.html');
const W = {}; new Function('window', rd('apex-stage.js'))(W);
const ST = W.APEX_STAGE;
const D = {}; new Function('window', rd('app/질병가이드-data.js'))(D);
const DZ = D.DZ_DATA;
const JV = rd('app/apex-map.html');

console.log('\n[1] 그림 속 대본이 표에 그대로');
const frame = (ST.taFrame || []).map(f => plain(f.s));
const inMk = frame.filter(t => t && MK.indexOf(t) >= 0);
is(frame.length >= 5 && inMk.length === frame.length, '전화를 여는 다섯 마디 — ' + inMk.length + '/' + frame.length + '줄이 표 그대로');
const nope = (ST.obj || []).filter(o => o.title === '필요 없어요')[0] || {};
const fill = t => { try { return ST.objFill(t); } catch (e) { return t; } };
is(!!nope.one && MK.indexOf(plain(fill(nope.one))) >= 0 && MK.indexOf(plain(fill(nope.follow))) >= 0 && MK.indexOf(plain(nope.stop)) >= 0,
   '「필요 없어요」 — 첫 마디 · 이어서 · 멈출 때가 표 그대로');

console.log('\n[2] 거절 고르기의 말이 두 표에 있는 이름');
const names = (ST.obj || []).map(o => plain(o.title)).concat(((DZ.rej || {}).all || []).reduce((a, o) => a.concat(plain(o.q).split(' · ')), []));
const chips = [];
MK.replace(/\[((?:'[^']+',?)+)\]\.map\(function\(t\)\{ return '<button class="chip">「'/g, (m, list) => { list.replace(/'([^']+)'/g, (mm, t) => { chips.push(t); }); });
const miss = chips.filter(t => names.indexOf(t) < 0);
is(chips.length >= 10 && !miss.length, '고르는 말 ' + chips.length + '가지가 모두 앱의 거절 표에 있다' + (miss.length ? ' ← 없음: ' + miss.join(' · ') : ''));
is(new Set(chips).size === chips.length, '같은 말이 두 번 서지 않는다 (그림에 「두 번 서지 않습니다」 라고 적었습니다)');

console.log('\n[3] 연금 문구가 자비스와 같다');
const pm = /※ 최저보증 금액 기준입니다\.[^<'"]*약관과 보험사 심사 결과에 따릅니다\./.exec(MK);
is(!!pm && JV.indexOf(pm[0]) >= 0, '연금 문구(최저보증 · 물가 · 약관과 심사)가 자비스의 문구와 한 글자도 다르지 않다');

console.log('\n[4] 견본 고객은 홍길동뿐');
/* 고객 이름이 서는 자리 셋 — 오늘 챙길 것 줄 · 고객 카드 제목 · 확인 판 「누구」 칸 (「속마음」 같은 꼬리표는 이름이 아닙니다) */
const people = [];
[/<span><b>([가-힣]{2,4})<\/b> —/g, /<h3>([가-힣]{2,4})<\/h3>/g, /<span>누구<\/span><b>([가-힣]{2,4})<\/b>/g].forEach(re => {
  let m; while ((m = re.exec(MK))) if (m[1] !== '홍길동') people.push(m[1]); });
const seen = [/<span><b>홍길동<\/b> —/, /<h3>홍길동<\/h3>/, /<span>누구<\/span><b>홍길동<\/b>/].every(re => re.test(MK));
const phones = (MK.match(/01[016789]-\d{3,4}-\d{4}/g) || []).filter(p => p !== '010-1234-5678');
is(seen && !people.length && !phones.length, '이름이 서는 자리 셋 모두 홍길동 · 다른 고객 이름 0 · 시험용 아닌 번호 0' + (people.length ? ' ← ' + people.join(',') : '') + (phones.length ? ' ← ' + phones.join(',') : ''));

console.log('\n[5] 그림이라고 밝히고, 밖으로 안 나간다');
is(/목각\(그림\)입니다 — 앱이 아닙니다/.test(MK), '「목각(그림)입니다 — 앱이 아닙니다」 를 머리에 적었다');
const RD = fs.existsSync(path.join(ROOT, '_redirects')) ? rd('_redirects') : '';
is(/^\/docs\/\*\s+\S+\s+404/m.test(RD), '/docs/* 가 _redirects 에서 404 — 그림이 라이브 주소로 안 나간다');

console.log('\n' + (bad ? '✗ ' + bad + '곳이 어긋났습니다' : '✓ 목각의 글이 앱의 글 그대로입니다'));
process.exit(bad ? 1 : 0);
