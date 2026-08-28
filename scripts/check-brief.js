/* 하루 한 장 — <b>밤에 안 만들고, 여실 때 서고, 직책대로 갈리고, 모르는 것을 감추지 않는가.</b>

   한동안 서버가 KST 07:00 에 미리 만들어 두었다. 사장님이 껐다 —
   「서버 밤에 안 만들게, 내가 들어가서 확인할 거고」. 이제 대표 브리핑을
   여시면 그 자리에서 모아 세운다.

   <b>끄는 것이 켜는 것보다 조용히 깨진다.</b> 예약 한 줄이면 되살아나므로
   누가 무심코 되돌려 놓아도 아무 표시가 안 난다. 그래서 이 점검이 지킨다.

   이 점검이 지키는 것은 <b>이 작업에서 실제로 틀렸던 자리</b>들이다.

     1. 밤에 <b>정말 안 도는가</b>. 그리고 안 도는데도 화면이 「아침 7시에
        만들어 둔 것입니다」라고 <b>거짓말하지 않는가</b> — 실제로 예약을
        끄자 그 문구만 그대로 남아 있었다. 여실 때 앱이 <b>직접 모으는</b>
        자리가 살아 있어야 화면이 빈 채로 서지 않는다.
     2. 범위가 <b>표 한 곳</b>에서 나오는가. 직책을 삼항 사슬로 나열하면
        늘 때 반드시 하나를 빠뜨린다 (CLAUDE.md 5번 — 쿠폰 트랙이 두 번 빠졌다).
     3. <b>모름(null)과 0 을 구분</b>하는가. 출근표를 못 읽어서 0명인 것을
        「아무도 안 나왔다」로 읽으면 그 자리에서 사고다 (1번).
     4. <b>사람마다 서버를 부르지 않는가</b>. 팀이 서른이면 서른 번이 된다 (7번).
     5. <b>고객 실명이 서버로 나가지 않는가</b> (3번).
     6. 보고 읽기 규칙(reports_select)이 <b>한 곳에만</b> 있는가. 두 곳에 적어
        두었더니 <b>이미 갈라져</b> 있었다 — 12번 묶음은 is_owner(대표만),
        복구용은 is_leader(리더면 <b>남의 팀까지</b>). 마지막에 돌린 쪽이 이겨
        권한이 조용히 달라진다. 리더는 <b>자기 팀만</b> 봐야 한다.
     7. ak 가 <b>등급 열쇠를 겸한다</b> — 찾기 낱말을 늘리면 문이 조용히
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

console.log('\n[1] 밤에 안 만든다 — 사장님이 직접 열어 확인하신다');
/* 주석에 적어 둔 「되살리는 법」 예시까지 예약으로 세면 헛알람이 된다 (8번).
   주석(#)을 걷은 뒤에 본다. */
const TOML_CODE = TOML.replace(/^\s*#.*$/gm, '');
const block = TOML_CODE.match(/\[functions\."daily-brief"\][^[]*/);
is(!block, '  netlify.toml 에 daily-brief <b>예약이 없다</b>' +
   (block ? ' ← 되살아났습니다: ' + (block[0].match(/schedule[^\n]*/) || [''])[0].trim() : ''));
/* 껐다는 사실과 되살리는 법이 그 자리에 적혀 있어야 다음 사람이 헤매지 않는다.
   <b>주석 줄만</b> 본다 — 파일 전체에서 찾으면 invest-daily 의 "0 22 * * *" 에
   걸려 되살리는 법을 지워도 초록이 뜬다. 실제로 그랬다 (8번). */
const TOML_NOTE = (TOML.match(/^\s*#.*$/gm) || []).join('\n');
is(/daily-brief/.test(TOML_NOTE) && /schedule\s*=\s*"0 22 \* \* \*"/.test(TOML_NOTE),
   '  <b>되살리는 법</b>을 주석에 적어 두었다 — UTC 22:00 = KST 07:00');
/* 예약을 끄면 화면 문구도 같이 움직여야 한다. 안 그러면 「아침 7시에 만들어
   둔 것입니다」만 남아 화면이 거짓말한다 — 실제로 그렇게 남아 있었다.

   <b>그리는 자리만</b> 본다. 파일 전체를 보면 APP_BUILD_NOTE 가 「전에는 이렇게
   적혀 있었습니다」 하고 옛 문구를 인용하는 것까지 잡아 헛알람이 된다 (8번). */
const fnBody = (name) => {
  const at = APP.indexOf('function ' + name + '(');
  if (at < 0) return '';
  const next = APP.indexOf('\nfunction ', at + 1);
  return APP.slice(at, next < 0 ? at + 6000 : next);
};
const preSrc = fnBody('schPreHtml');
is(!!preSrc, '  미리 만든 한 장을 그리는 자리를 찾았다 (schPreHtml)');
is(!/아침 7시에 미리 만들어 둔 것입니다/.test(preSrc),
   '  화면이 <b>「아침 7시에 만들어 뒀다」고 말하지 않는다</b> — 안 만드는데 그렇게 적으면 거짓말이다');
/* ── 시각 문구는 <b>실제로 돌려 본다</b> ──────────────────────────
   「모릅니다」 라는 글자가 파일 어딘가에 있는지만 보면, 두 갈래 중 한쪽만
   지워도 초록이 뜬다. 실제로 그랬다. 함수를 떼어 내 세 가지를 넣어 본다. */
const madeSrc = (APP.match(/function schMadeAt\(c\)\{[\s\S]*?\n\}/) || [])[0] || '';
is(!!madeSrc, '  만든 시각을 <b>적어 둔 madeAt 에서 읽는</b> 함수가 있다 (schMadeAt)');
if (madeSrc) {
  let f = null;
  try { f = new Function('return (' + madeSrc.replace('function schMadeAt', 'function') + ')')(); }
  catch (e) { /* 문법이 깨졌으면 아래에서 걸린다 */ }
  is(!!f, '  그 함수가 실제로 돈다');
  if (f) {
    const got = f({ madeAt: '2026-08-28T22:00:00.000Z' });
    is(/서버가/.test(got) && /\d/.test(got),
       '  시각이 <b>있으면</b> 그 시각을 그대로 적는다 — ' + got);
    is(!/만든 시각이 적혀|모른/.test(got), '  있는 시각을 「모른다」로 뭉개지 않는다');
    ['적어 두지 않았을 때', '값이 깨졌을 때'].forEach((label, i) => {
      const out = f(i === 0 ? {} : { madeAt: '언젠가' });
      is(/적혀 있지 않습니다/.test(out) && !/\d/.test(out),
         '  ' + label + '는 <b>모른다고 적는다</b> — 시각을 지어내지 않는다 (1번) · ' + out);
    });
  }
}
/* 밤에 안 만들면 화면은 여실 때 직접 모아야 한다. 이 자리가 죽으면 빈 화면이다. */
is(/function schLoad\(/.test(APP_CODE), '  여실 때 <b>직접 모으는</b> 자리(schLoad)가 살아 있다');
is(/그 자리에서<\/b> 모읍니다/.test(APP),
   '  화면이 <b>「여시는 그 자리에서 모읍니다」</b> 라고 말해 준다');
/* 함수를 지우지 않았는지 — 되살리실 때 처음부터 다시 짜지 않아도 되게 */
is(/exports\.handler|module\.exports/.test(FN), '  함수는 <b>지우지 않고</b> 남겨 두었다 — 되살리면 그대로 돈다');

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

console.log('\n[7] 보고 읽기 규칙 — 한 곳에만 있고, 리더는 자기 팀만 본다');
/* 규칙을 두 곳에 적으면 갈라진다. 한 곳에 두고 양쪽이 그것을 가리켜야 한다. */
is(/var SQL_REPORTS_SELECT\s*=/.test(APP_CODE), '  규칙을 한 곳(SQL_REPORTS_SELECT)에 둔다');
/* 그 한 곳 말고 다른 데서 또 만들면 그 순간 두 벌이 된다 */
const madeAt = (APP.match(/create policy reports_select/g) || []).length;
is(madeAt === 1, '  reports_select 를 만드는 자리가 하나다 — ' + madeAt + '곳');
const pol = (APP.match(/var SQL_REPORTS_SELECT=\[([\s\S]*?)\];/) || [])[1] || '';
is(/author_id = auth\.uid\(\)/.test(pol), '  작성자 본인은 자기 것을 본다');
is(/is_owner\(\)/.test(pol), '  대표는 전원 것을 본다');
/* 리더를 is_leader() 로 열면 남의 팀까지 보인다 — leads_team(팀) 으로 좁혀야 한다 */
is(/leads_team\(/.test(pol) && /team_members/.test(pol),
   '  리더는 team_members·leads_team 으로 <b>자기 팀만</b> 본다');
is(!/is_leader\(\)/.test(pol),
   '  is_leader() 로 열지 않는다 — 그러면 남의 팀까지 보인다');
/* 규칙을 고쳤으면 다시 돌리라고 알려야 한다. 안 그러면 옛 규칙이 그대로 남는다. */
const ver = Number((APP.match(/var SETUP_VER=(\d+)/) || [])[1] || 0);
is(ver >= 37, '  SETUP_VER 가 올라가 다시 돌리라고 알린다 — ' + ver);
/* 한 장이 담는 사람이 곧 볼 권한이 있는 사람이다 */
is(/peopleFor\(scope/.test(FN_CODE), '  한 장은 그 사람이 볼 범위만 담는다');
/* 본문은 아예 받아 오지 않는다 — 고객 이야기가 섞일 수 있다 (3번) */
is(!/reports\?select=[^']*\bbody\b/.test(FN),
   '  보고 본문(body)은 아예 받아 오지 않는다');
/* 보고 갈래도 삼항 사슬로 나열하면 늘 때 빠뜨린다 */
is(/const\s+SUB_LABEL\s*=\s*\{/.test(FN_CODE), '  보고 갈래 이름도 표 한 곳에서 온다');

console.log('\n[8] ak 는 등급 열쇠를 겸한다 — 낱말을 늘리면 문이 헐거워진다');
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

console.log('\n[9] 없어진 학교 딱지가 화면에 안 남아 있다');
is(!/YOONSI SCHOOL/.test(APP), '  YOONSI SCHOOL 딱지가 없다');
is(!/윤시스쿨이 오늘 만들어낸|윤시스쿨 데이터를 모으는/.test(APP),
   '  화면 글에 없어진 학교 이름이 없다');
/* ak 의 옛 이름은 일부러 남긴 것이라 여기서 잡지 않는다 */

console.log('\n──────────────────────────────');
console.log(bad ? '✗ ' + bad + '개 어긋남\n'
                : '하루 한 장 점검 통과 — 밤에 안 만들고, 여실 때 서고, 직책대로 갈리고, 모르는 것을 감추지 않습니다.\n');
process.exit(bad ? 1 : 0);
