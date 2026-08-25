/* 하루 한 장 — <b>아침 7시에 미리 서고, 직책대로 갈리고, 모르는 것을 감추지 않는가.</b>

   전에는 앱을 열어야 만들어졌다(dgAuto). 대표가 아침에 앱을 안 열면 그날
   한 장이 없었고, 팀원은 아예 자기 것이 없었다. 그래서 시각을 사람이 아니라
   <b>시계</b>에 맡겼다 — netlify.toml 의 schedule 로 KST 07:00 에 돈다.

   이 점검이 지키는 것은 <b>이 작업에서 실제로 틀렸던 자리</b>들이다.

     1. 예약이 <b>정말 아침 7시</b>인가. UTC 로 적는 자리라 9시간을 빼먹으면
        오후 4시에 돈다 — 그러면 아침에 아무것도 없다.
     2. 범위가 <b>표 한 곳</b>에서 나오는가. 직책을 삼항 사슬로 나열하면
        늘 때 반드시 하나를 빠뜨린다 (CLAUDE.md 5번 — 쿠폰 트랙이 두 번 빠졌다).
     3. <b>모름(null)과 0 을 구분</b>하는가. 출근표를 못 읽어서 0명인 것을
        「아무도 안 나왔다」로 읽으면 그 자리에서 사고다 (1번).
     4. <b>사람마다 서버를 부르지 않는가</b>. 팀이 서른이면 서른 번이 된다 (7번).
     5. <b>고객 실명이 서버로 나가지 않는가</b> (3번).
     6. ak 가 <b>등급 열쇠를 겸한다</b> — 찾기 낱말을 늘리면 문이 조용히
        헐거워진다. 실제로 이 작업에서 basic 이 free 로 떨어졌다.            */

const fs = require('fs');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const FN = fs.readFileSync('netlify/functions/daily-brief.js', 'utf8');
const TOML = fs.readFileSync('netlify.toml', 'utf8');
const APP = fs.readFileSync('app/index.html', 'utf8');

/* 주석에 적어 둔 설명을 코드로 착각하면 헛알람이 된다 (CLAUDE.md 8번).
   실제로 check-mklib 에서 그렇게 한 번 데었다 — 여기서는 주석을 걷고 본다. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const FN_CODE = strip(FN);
const APP_CODE = strip(APP);

console.log('\n[1] 아침 7시에 돈다 — UTC 로 적는 자리라 9시간을 빼먹기 쉽다');
const block = TOML.match(/\[functions\."daily-brief"\][^[]*/);
is(!!block, '  netlify.toml 에 daily-brief 예약이 있다');
if (block) {
  const cron = (block[0].match(/schedule\s*=\s*"([^"]+)"/) || [])[1] || '';
  is(!!cron, '  schedule 이 적혀 있다 — ' + (cron || '없음'));
  const [min, hr] = cron.split(/\s+/);
  /* KST 07:00 = UTC 22:00 (전날). 22 가 아니면 아침이 아니다. */
  is(hr === '22' && min === '0',
     '  UTC 22:00 = KST 07:00 이다 — 지금 "' + cron + '"' +
     (hr === '22' ? '' : ' ← KST ' + ((Number(hr) + 9) % 24) + '시에 돕니다'));
}

console.log('\n[2] 범위는 표 한 곳에서 답한다 — 삼항 사슬로 나열하지 않는다');
is(/const\s+SCOPE\s*=\s*\{/.test(FN_CODE), '  SCOPE 표가 있다');
const scopeBlock = (FN_CODE.match(/const\s+SCOPE\s*=\s*\{([^}]*)\}/) || [])[1] || '';
['사업단장', '본부장', '지점장', '팀장', '설계사'].forEach(r =>
  is(scopeBlock.indexOf(r) >= 0, '  「' + r + '」 이 표에 있다'));
is(/all/.test(scopeBlock) && /team/.test(scopeBlock) && /self/.test(scopeBlock),
   '  전원 · 자기 팀 · 자기 것 세 갈래가 다 있다');
/* 직책을 물음표 사슬로 가르면 늘 때 빠뜨린다 */
is(!/rank\s*===?\s*'[^']+'\s*\?[\s\S]{0,80}\?/.test(FN_CODE),
   '  직책을 삼항 사슬로 나열하지 않는다');
/* 표에 없는 직책을 조용히 삼키면 아무도 모른다 */
is(/unknownRank/.test(FN_CODE), '  표에 없는 직책은 조용히 넘기지 않고 남긴다');

console.log('\n[3] 모름(null)과 0 을 구분한다 — 못 읽은 것을 「없다」로 적지 않는다');
is(/===\s*null\s*\?\s*null/.test(FN_CODE),
   '  원자료를 못 읽으면 그 칸도 null 로 남긴다');
is(/miss/.test(FN_CODE), '  못 읽은 자리를 따로 모아 밝힌다');
is(/miss/.test(APP_CODE) && /0 이 아니라 모름|0이 아니라 모름/.test(APP),
   '  화면이 「0 이 아니라 모름」이라고 말해 준다');
/* 못 읽었을 때 0 으로 눙치면 「아무도 안 나왔다」가 된다 */
is(!/\|\|\s*0\s*;\s*\/\*?\s*못/.test(FN_CODE) && !/attendance\s*\|\|\s*\[\]/.test(FN_CODE),
   '  못 읽은 표를 빈 배열이나 0 으로 바꿔치지 않는다');
is(/명단을 못 읽으면|profiles 를 못 읽었습니다/.test(FN),
   '  명단을 못 읽으면 아무 한 장도 세우지 않는다');

console.log('\n[4] 사람마다 서버를 부르지 않는다 — 팀이 서른이면 서른 번이다');
/* 사람 도는 자리 안에서 서버를 부르면 그것이 곧 N 번이다 */
const perPerson = /everyone\.forEach\([\s\S]*?\}\);/.exec(FN_CODE);
is(!!perPerson, '  사람마다 도는 자리를 찾았다');
if (perPerson) {
  is(!/\bawait\b|\bsb\(/.test(perPerson[0]),
     '  사람 도는 자리 안에서 서버를 부르지 않는다');
}
is((FN_CODE.match(/Promise\.all\(/g) || []).length >= 1,
   '  표를 한 번에 모아 읽는다');
/* 앱 쪽 — 여는 순간에 표 아홉 개를 훑던 자리 */
is(/SCH\.pre/.test(APP_CODE), '  앱은 미리 만들어 둔 한 줄을 읽는다');
is(/schOpen/.test(APP_CODE), '  여는 자리(schOpen)가 따로 있다');
is(/view==='today'&&SCH\.pre&&!st/.test(APP_CODE.replace(/\s+/g, '')) ||
   /view==='today'\s*&&\s*SCH\.pre\s*&&\s*!st/.test(APP_CODE),
   '  한 장만 보고 닫으면 표 아홉 개를 안 부른다');
/* 미리 만든 것이 없을 때 빈 화면을 세우면 「오늘은 아무 일도 없었다」로 읽힌다 */
is(/schLoad\(\)/.test(APP_CODE.slice(APP_CODE.indexOf('function schOpen'),
                                     APP_CODE.indexOf('function schOpen') + 900)),
   '  미리 만든 것이 없으면 예전처럼 직접 모은다');

console.log('\n[5] 고객 실명이 서버로 나가지 않는다');
is(!/clients\?select=[^']*name/.test(FN),
   '  고객 표에서 이름을 받아 오지 않는다 — 건수만 센다');
is(!/홍길동/.test(FN), '  견본 이름이 섞여 들어가 있지 않다');

console.log('\n[6] 어제 것을 오늘 것인 척 세우지 않는다');
is(/c\.date\s*===\s*schToday\(\)/.test(APP_CODE),
   '  날짜가 오늘이 아니면 없는 것으로 친다');
is(/kind=eq\.[^&]*&created_at=gte/.test(FN),
   '  같은 날 것이 이미 있으면 지우고 새로 넣는다 — 두 벌이 안 쌓인다');

console.log('\n[7] ak 는 등급 열쇠를 겸한다 — 낱말을 늘리면 문이 헐거워진다');
const repLine = (APP.match(/\{id:'report'[^}]*\}/) || [''])[0];
is(!!repLine, '  대표 브리핑 메뉴 줄을 찾았다');
if (repLine) {
  const ak = (repLine.match(/ak:'([^']*)'/) || [])[1] || '';
  is(!!ak, '  ak 가 있다 — ' + (ak || '없음'));
  /* 열쇠가 등급표에 없으면 free 로 떨어진다. 실제로 이 작업에서 그랬다. */
  is(APP.indexOf("'" + ak + "':'basic'") >= 0,
     '  그 ak 가 등급표에 basic 으로 적혀 있다 — 문이 안 헐거워졌다');
  is(ak.indexOf('윤시스쿨') >= 0, '  옛 이름으로도 찾힌다');
}

console.log('\n[8] 없어진 학교 딱지가 화면에 안 남아 있다');
is(!/YOONSI SCHOOL/.test(APP), '  YOONSI SCHOOL 딱지가 없다');
is(!/윤시스쿨이 오늘 만들어낸|윤시스쿨 데이터를 모으는/.test(APP),
   '  화면 글에 없어진 학교 이름이 없다');
/* ak 의 옛 이름은 일부러 남긴 것이라 여기서 잡지 않는다 */

console.log('\n──────────────────────────────');
console.log(bad ? '✗ ' + bad + '개 어긋남\n'
                : '하루 한 장 점검 통과 — 아침 7시에 서고, 직책대로 갈리고, 모르는 것을 감추지 않습니다.\n');
process.exit(bad ? 1 : 0);
