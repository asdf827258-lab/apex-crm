/* <b>「로그인이 갑자기 안 된다」 — 2026-08-28.</b>

   비밀번호도 인터넷도 멀쩡했습니다. 서비스 제공사(Supabase)가 <b>응답을
   아예 안 보내고</b> 있었습니다 (status.supabase.com — API Gateway
   degraded, "Increased response times").

   그러면 약속(Promise)은 <b>성공도 실패도 하지 않고 영영 매달립니다.</b>
   로그인 단추는 「처리 중…」 에서 계속 돌고, 화면은 <b>한 마디도 안</b>
   했습니다. 사장님은 무엇이 잘못됐는지 알 길이 없었습니다.

   거절(reject)은 이미 막혀 있었습니다 — 코드에 「실제로 그렇게 멈췄다」는
   주석까지 붙어 있습니다. <b>안 막힌 것은 「대답이 안 오는 경우」</b> 였고,
   둘은 다릅니다. 거절은 답이 오는 것이고, 무응답은 답이 안 오는 것입니다.

   그래서 <b>이 점검이 그 자리를 지킵니다.</b> 다시는 시간 제한 없는
   기다림이 들어오지 못하게 합니다.

     1. osWait 이 있고 <b>시간 제한</b>이 걸려 있는가
     2. <b>문 세 자리</b>(로그인 · 계정등록 · 세션확인 · 내정보)가 전부
        그것을 지나는가 — 하나라도 맨몸이면 그 길로 다시 멈춘다
     3. 시간이 지나면 <b>거절처럼 답을 만들어</b> 부르는 쪽을 풀어 주는가
     4. 화면이 <b>무엇을 기다리다 지쳤는지 말하는가</b> · 다시 할 단추가 있는가
     5. <b>비밀번호 탓으로 돌리지 않는가</b> — 「비밀번호 문제가 아닙니다」
     6. 나으면 <b>띠를 내리는가</b> — 안 내리면 다 나은 뒤에도 겁을 드린다
     7. 두 번 답하지 않는가 — 시간 초과 뒤에 늦게 온 답이 덮어쓰면 어지럽다

   [8] 은 글자를 안 보고 <b>실제로 매달리게 만들어</b> 봅니다. 영영 안
   끝나는 약속을 서버 자리에 끼워 넣고, 단추가 풀리는지 · 띠가 서는지 ·
   무슨 말이 뜨는지 눈으로 받습니다. 글자만 찾으면 「감싸긴 했는데 안
   푼다」를 못 봅니다.                                                   */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const APP = fs.readFileSync('app/index.html', 'utf8');
/* 주석에 적어 둔 사연을 코드로 착각하면 헛알람이 된다 (CLAUDE.md 8번) */
const CODE = APP.replace(/\/\*[\s\S]*?\*\//g, ' ');

/* 한 함수 몸통만 떼어 낸다 — 파일 전체에서 찾으면 옆 함수가 감쌌는데도 통과한다 */
const body = (name) => {
  const at = CODE.indexOf('function ' + name + '(');
  if (at < 0) return '';
  const next = CODE.indexOf('\nfunction ', at + 1);
  return CODE.slice(at, next < 0 ? at + 9000 : next);
};

(async () => {

console.log('\n[1] 기다림에 시간 제한이 걸려 있다');
const wait = body('osWait');
is(!!wait, '  osWait 이 있다 — 기다리는 자리가 <b>한 곳</b>이다 (5번)');
is(/setTimeout\(/.test(wait), '  <b>시간 제한</b>을 실제로 건다');
/* 「이름 붙은 값이 있다」 만 보면 99999999 로 늘려 놓아도 통과한다 —
   실제로 그렇게 뚫렸다. 사람이 못 기다리는 길이면 안 건 것과 같다 (8번). */
const waitMs = Number((CODE.match(/var OS_WAIT_MS\s*=\s*(\d+)/) || [])[1] || 0);
is(waitMs >= 3000 && waitMs <= 30000,
   '  제한 시간이 <b>사람이 기다릴 만한 길이</b>다 — ' + (waitMs || '없음') + 'ms ' +
   '(3~30초 사이여야 한다. 너무 길면 안 건 것과 같다)');
is(/clearTimeout\(/.test(wait), '  제때 오면 <b>시계를 끈다</b> — 헛띠를 안 세운다');

console.log('\n[2] 문 네 자리가 전부 그것을 지난다 — 하나라도 맨몸이면 그 길로 멈춘다');
const GATES = [
  ['로그인',        'osSubmit',     /osWait\(\s*sb\.auth\.signInWithPassword/],
  ['계정 등록',     'osSubmit',     /osWait\(\s*sb\.auth\.signUp/],
  ['세션 확인',     'osBootAuth',   /osWait\(\s*sb\.auth\.getSession/],
  ['내 정보 읽기',  'osLoadProfile',/osWait\(\s*sb\.from\('profiles'\)/],
];
GATES.forEach(([label, fn, re]) => {
  const b = body(fn);
  is(!!b && re.test(b), '  <b>' + label + '</b> 이 osWait 을 지난다 (' + fn + ')');
});
/* 「한 군데라도 감쌌으면 통과」 로 두었더니, 같은 함수 안의 <b>다른</b> 부름을
   맨몸으로 되돌려도 초록이 떴다 — 실제로 그렇게 뚫렸다. 세어서 본다 (8번). */
const prof = body('osLoadProfile');
const profAll = (prof.match(/sb\.from\('profiles'\)/g) || []).length;
const profWrapped = (prof.match(/osWait\(\s*sb\.from\('profiles'\)/g) || []).length;
is(profAll > 0 && profAll === profWrapped,
   '  내 정보를 읽는 자리 ' + profAll + '곳이 <b>모두</b> 감싸져 있다 (' + profWrapped + '곳)');
/* 맨몸으로 부르는 자리가 남아 있으면 그 길로 그대로 멈춘다 */
['signInWithPassword', 'signUp', 'getSession'].forEach(call => {
  const raw = (CODE.match(new RegExp('(?<!osWait\\(\\s{0,4})sb\\.auth\\.' + call + '\\(', 'g')) || []);
  const wrapped = (CODE.match(new RegExp('osWait\\(\\s*sb\\.auth\\.' + call + '\\(', 'g')) || []);
  const all = (CODE.match(new RegExp('sb\\.auth\\.' + call + '\\(', 'g')) || []);
  is(all.length === wrapped.length,
     '  sb.auth.' + call + ' 을 부르는 자리 ' + all.length + '곳이 <b>모두</b> 감싸져 있다 (' +
     wrapped.length + '곳)');
});

console.log('\n[3] 시간이 지나면 거절처럼 답을 만들어 준다 — 부르는 쪽을 풀어 준다');
is(/resolve\(\{[^}]*error:/.test(wait.replace(/\s+/g, '')) || /resolve\(\{\s*data:null\s*,\s*error:/.test(wait),
   '  <b>reject 가 아니라 resolve</b> 로 답한다 — 부르는 쪽이 고칠 것이 없다');
is(/timeout/.test(wait), '  「timeout」 이라는 낱말을 남긴다 — osNetDown 이 알아본다');
is(/timeout/.test(body('osNetDown')),
   '  osNetDown 이 그 낱말을 <b>서버 탓</b>으로 읽는다');

console.log('\n[4] 화면이 무엇을 기다리다 지쳤는지 말한다 (1번)');
is(/function osDownBar\(/.test(CODE), '  띠를 세우는 자리가 있다');
is(/서버가 응답하지 않습니다/.test(APP), '  <b>「서버가 응답하지 않습니다」</b> 라고 적는다');
is(/OS_DOWN\.what/.test(body('osDownBar')), '  <b>무엇을</b> 기다렸는지 이름을 댄다');
is(/osDownRetry\(\)/.test(APP), '  <b>다시 시도</b> 단추가 있다');
is(!/location\.reload/.test(body('osDownRetry')),
   '  다시 시도가 <b>새로고침이 아니다</b> — 쓰던 글이 날아가면 안 된다');

console.log('\n[5] 비밀번호 탓으로 돌리지 않는다');
is(/비밀번호 문제가 아닙니다|비밀번호나 인터넷 문제가 아닐 수 있습니다/.test(APP),
   '  <b>「비밀번호 문제가 아닙니다」</b> 를 분명히 적는다');

console.log('\n[6] 나으면 띠를 내린다');
is(/function osServerOk\(/.test(CODE), '  내리는 자리가 있다 (osServerOk)');
is((CODE.match(/osServerOk\(\)/g) || []).length >= 3,
   '  받아 온 자리들이 실제로 <b>내린다</b> — ' + (CODE.match(/osServerOk\(\)/g) || []).length + '곳');

/* [7] 은 <b>코드 모양이 아니라 결과</b>로만 봅니다. 「if(t===null)return」 이
   있는지 세어 봤더니, 두 갈래 중 한쪽만 지워도 초록이 떴고 — 게다가 그렇게
   지워도 실제 동작은 안 바뀝니다(약속은 한 번만 정해집니다). 안 바뀌는 것을
   잡는 점검은 헛알람입니다(8번). 그래서 아래 [8] 의 「늦게 온 답」 하나로
   갈음합니다 — 그것은 사장님이 실제로 겪는 결과입니다. */

/* ── 실제로 매달리게 만들어 본다 ──────────────────────────────── */
console.log('\n[8] 실제로 — 서버가 대답을 안 하면 화면이 풀리는가');
const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});
await new Promise(r => srv.listen(0, r));
const browser = await chromium.launch();
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 180)));
await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2200);

const R = await page.evaluate(async () => {
  const O = {};
  /* 줄이기 <b>전에</b> 실제 값을 적어 둔다 — 줄여 놓고 재면 파일에 무한대가
     적혀 있어도 못 본다 */
  O.realMs = OS_WAIT_MS;
  /* 제한을 짧게 줄여 시험한다 — 12초를 기다리면 점검이 느려진다 */
  OS_WAIT_MS = 400;
  const 영영 = new Promise(function () { });      /* 성공도 실패도 안 하는 약속 */

  /* ① osWait 이 스스로 풀리는가 */
  const t0 = Date.now();
  const r = await osWait(영영, '시험 대기');
  O.freed = !!(r && r.error);
  O.ms = Date.now() - t0;
  O.msg = (r && r.error && r.error.message) || '';
  O.isTimeout = !!(r && r.error && r.error.timeout);

  /* ② 띠가 섰는가 · 무엇을 기다렸다고 말하는가 */
  const bar = document.getElementById('osDownBar');
  O.bar = !!bar;
  O.barText = bar ? bar.textContent.replace(/\s+/g, ' ').trim() : '';
  O.hasRetry = !!(bar && bar.querySelector('button'));

  /* ③ 사람 말로 바꿔 주는가 — 비밀번호 탓을 안 하는가 */
  O.human = osLoginErr(O.msg);

  /* ④ 나으면 내려가는가 */
  osServerOk();
  O.barGone = !document.getElementById('osDownBar');

  /* ⑤ 늦게 온 답이 덮어쓰지 않는가 */
  let late = null, resolveLate;
  const 늦게 = new Promise(function (res) { resolveLate = res; });
  const p2 = osWait(늦게, '늦은 답').then(function (x) { late = x; });
  await new Promise(r2 => setTimeout(r2, 700));
  resolveLate({ data: 'LATE', error: null });
  await p2;
  O.lateKept = !!(late && late.error && late.error.timeout);
  return O;
});

is(R.realMs >= 3000 && R.realMs <= 30000,
   '  브라우저에서 <b>실제로 쓰이는</b> 제한이 사람이 기다릴 길이다 — ' + R.realMs + 'ms');
is(R.freed, '  대답이 <b>영영 안 와도</b> 스스로 풀린다 — ' + R.ms + 'ms 만에');
is(R.ms < 2000, '  제한 시간 안에 풀린다 (400ms 로 줄여 시험) — ' + R.ms + 'ms');
is(R.isTimeout && /시험 대기/.test(R.msg), '  <b>무엇을</b> 기다렸는지 답에 담긴다 — ' + R.msg);
is(R.bar, '  화면에 <b>띠가 선다</b>');
is(/서버가 응답하지 않습니다/.test(R.barText) && /시험 대기/.test(R.barText),
   '  띠가 이름을 대고 말한다 — 「' + R.barText.slice(0, 58) + '…」');
is(R.hasRetry, '  띠에 <b>다시 시도</b> 단추가 붙어 있다');
is(/비밀번호/.test(R.human) && !/올바르지 않습니다/.test(R.human),
   '  로그인 칸에는 <b>비밀번호 탓이 아니라고</b> 적힌다 — 「' + R.human.slice(0, 46) + '…」');
is(R.barGone, '  나으면 <b>띠가 내려간다</b>');
is(R.lateKept, '  시간 초과 뒤 <b>늦게 온 답이 덮어쓰지 않는다</b>');

console.log('\n[9] 콘솔이 조용하다');
is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

await browser.close(); srv.close();
console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '개 — 서버가 조용히 죽으면 화면이 말없이 멈춥니다')
                : '✓ 서버가 대답을 안 해도 화면이 풀리고, 왜 그런지 말합니다');
process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
