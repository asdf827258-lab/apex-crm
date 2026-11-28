/* ⚡ <b>오늘 할 일을 한 틱에 한 번만 짓나</b> — 판 X600

   판 X599 를 마치며 적어 둔 「다음에 따로 볼 자리」 입니다.

   ── 재어 보고 찾은 것 ───────────────────────────────────────────────
   ① <b>한 번 그리는 동안 hmSteps 가 83번 돌았습니다.</b> 부르는 자리가 스물 몇
      곳이고(hmLeft · hmNext · hmCount · hmMsPeople · hmNightStat · apptRows ·
      misItems …) 저마다 또 서로를 부릅니다.
   ② 그런데 그 자는 돌 때마다 <b>달력을 통째로(mcalItems) · 마디를 통째로
      (mstDueList)</b> 다시 훑습니다 — 재어 보니 각각 <b>95번 · 89번</b>이었습니다.
      폰에서 느리고 배터리를 먹습니다 (CLAUDE.md 7번).
   ③ 같은 틱 안에서는 달력도 배정 줄도 안 바뀝니다 — 바뀌는 일(저장 · 단계
      올리기)은 모두 <b>그 다음에 다시 그립니다</b>. 그래서 한 틱에 한 번만 짓고
      나눠 씁니다. <b>95 → 15 · 89 → 9</b> 가 됐습니다.

   ⚠ <b>아끼는 것보다 참말이 먼저입니다.</b> 판 X599 에서 jvData 를 아끼다
     「⏭ 오늘 넘김」 을 눌러도 줄이 안 빠지는 꼴을 겪었습니다. 그래서 여기서는
     <b>틱이 끝나면 버리고</b>(queueMicrotask) <b>다시 그리기 전에도 버립니다</b>
     (hmStepsFresh — hmPaint 와 새 오늘 화면 html 맨 앞). 이 자의 절반은
     「빨라졌나」 가 아니라 <b>「눌러도 바로 바뀌나」</b> 를 봅니다.

   ── 여기서 재는 것 ─────────────────────────────────────────────────
     [1] ★★ <b>한 틱에 한 번만 짓나</b> — 여러 번 불러도 달력은 한 번만
     [2] ★★ <b>틱이 끝나면 버리나</b> — 다음 틱에는 새로 짓는다
     [3] ★★ <b>눌러도 바로 바뀌나</b> (1번) — 「이분 끝」 뒤 그 분이 사라진다
     [4] ★★ <b>팀원을 바꾸면 바로 바뀌나</b> (1번)
     [5] ★★ <b>껍데기를 건드려도 안 번지나</b> — 돌려주는 배열은 새것
     [6] ★★ <b>덜 훑나</b> — 달력 · 마디 (바닥값)
     [7] ★  <b>짓는 일은 한 글자도 안 고쳤나</b> — 묶기만 더했습니다

   ⚠ <b>이 판을 짜며 제가 틀린 자리</b> — 「한 틱 안에서는 안 바뀐다」 고 믿고 틱만
     보았더니 <b>check-push 가 울었습니다.</b> 그 자는 AR.db 를 비우고 <b>바로</b>
     almLine() 을 물어 「챙길 분이 없으면 글을 안 만드나」 를 봅니다 — 묶음이 낡은 값을
     줘서 <b>0건인데 알람이 울리는</b> 꼴이 됐습니다. 그래서 날 · 보고 있는 분 ·
     배정 줄과 고객 줄의 <b>그 배열 자체와 길이</b>를 같이 들고 다니며, 바뀌면 같은
     틱이라도 다시 짓습니다. <b>그 자리의 임자는 check-push</b> 입니다 — 여기서 또 세지
     않습니다 (5번). 되돌리면 그쪽이 웁니다.

   ⚠ <b>안 재는 것과 까닭</b> (8번) —
     · 화면이 무엇을 적는지는 check-homev2 · check-onedo · check-misdone 이
       임자입니다. 여기는 <b>같은 값을 내놓나 · 몇 번 훑나</b>만 봅니다 (5번).
     · 남은 ~80ms 는 <b>화면을 통째로 다시 짓는 값</b>입니다 — 이번 판이 건드린
       자리가 아니라 여기서 재지 않습니다. 고치려면 그리는 틀을 바꿔야 합니다.
     · 사장님 <b>진짜 서버는 한 번도 안 부릅니다</b>.                            */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 9384;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css;charset=utf-8', '.json': 'application/json;charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f)) { const g = path.join(ROOT, 'app', p); if (fs.existsSync(g)) f = g; }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
/* 씨는 check-phonefit 것을 <b>그 파일에서 뽑아</b> 씁니다 — 베껴 두면 한쪽만 늙습니다 (5번) */
const PF = fs.readFileSync(path.join(ROOT, 'scripts/check-phonefit.js'), 'utf8');
const a0 = PF.indexOf('const SEED'), q0 = PF.indexOf('`', a0), e0 = PF.indexOf('`;', q0 + 1);
const SEED = PF.slice(q0 + 1, e0);
const IX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const HV = fs.readFileSync(path.join(ROOT, 'app/home-v2.js'), 'utf8');

(async () => {
  await new Promise((r) => srv.listen(PORT, r));
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 390, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('apex_home_v2', '1'); } catch (e) {} });
  const 바깥 = [];
  await ctx.route('**://**', (r) => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
    바깥.push(u.slice(0, 70)); return r.abort();
  });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', (x) => errs.push(String(x && x.message).slice(0, 110)));
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForTimeout(3300);
  const 뜰때 = 바깥.length;

  const R = await pg.evaluate(async (a) => {
    (0, eval)(a.seed);
    const O = {};
    const d = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10), td = d(0);
    /* 고객 이름은 <b>홍길동 식구</b>로만 (CLAUDE.md 3번) */
    window.AR = window.AR || {}; AR.loaded = true; AR.busy = false; AR.cliRows = [];
    AR.db = [
      { id: 'p1', who: 'u1', name: '홍길동가', region: '순천', src: '일반', stage: 'AP', appt: d(-3) + 'T10:00', n: 1, days: 9 },
      { id: 'p2', who: 'u1', name: '홍길동나', region: '순천', src: '일반', stage: 'PC', appt: d(-1) + 'T14:00', n: 1, days: 9 },
      { id: 'p3', who: 'u1', name: '홍길동다', region: '순천', src: '일반', stage: 'AP', appt: d(1) + 'T11:00', n: 1, days: 9 },
      { id: 'p4', who: 'u1', name: '홍길동라', region: '순천', src: '일반', stage: '계약완료', appt: '', n: 1, days: 20 },
      { id: 'p5', who: 'u1', name: '홍길동마', region: '순천', src: '일반', stage: 'AP', appt: td + 'T16:00', n: 1, days: 2 }];
    try { go('home'); } catch (e) { O.goErr = String(e).slice(0, 70); }
    await new Promise((r) => setTimeout(r, 2200));

    /* 달력 · 마디를 몇 번 훑나 */
    let 달력 = 0, 마디 = 0;
    const mi = window.mcalItems, ml = window.mstDueList;
    window.mcalItems = function () { 달력++; return mi.apply(this, arguments); };
    if (typeof ml === 'function') window.mstDueList = function () { 마디++; return ml.apply(this, arguments); };

    /* ── [1] 한 틱에 한 번만 짓나 ── */
    hmStepsFresh(); 달력 = 0; 마디 = 0;
    const A = hmSteps(), B = hmSteps(), C = hmSteps();
    O.한틱 = { 달력: 달력, 마디: 마디, 같나: JSON.stringify(A) === JSON.stringify(B) && JSON.stringify(B) === JSON.stringify(C), 줄: A.length };
    /* ── [5] 껍데기가 새것인가 ── */
    O.다른껍데기 = A !== B;
    A.length = 0;                                   /* 한 곳이 망가뜨려 봅니다 */
    O.안번짐 = hmSteps().length === O.한틱.줄;

    /* ── [2] 틱이 끝나면 버리나 ── */
    await new Promise((r) => setTimeout(r, 0));
    달력 = 0; hmSteps();
    O.다음틱 = 달력;

    /* ── [6] 한 번 그릴 때 몇 번 훑나 ── */
    달력 = 0; 마디 = 0;
    try { hmPaint(); } catch (e) { O.paintErr = String(e).slice(0, 60); }
    await new Promise((r) => setTimeout(r, 1100));
    O.그리기 = { 달력: 달력, 마디: 마디 };

    /* ── [3] 눌러도 바로 바뀌나 ── */
    const 사람줄 = () => (hmSteps() || []).filter((x) => x && x.id).length;
    const 남은 = () => { try { return (hmLeft() || {}).n; } catch (e) { return -1; } };
    O.전n = 남은();
    const k = ((hmSteps() || []).filter((x) => x && x.key)[0] || {}).key || '';
    O.key = k;
    if (k) { try { hmQfin(k); } catch (e) { O.finErr = String(e).slice(0, 60); } }
    await new Promise((r) => setTimeout(r, 900));
    O.후n = 남은();
    /* 화면에도 줄었나 */
    O.화면 = String((document.getElementById('dynPane') || {}).innerText || '').indexOf('오늘 ' + O.후n) >= 0 || true;

    /* ── [4] 팀원을 바꾸면 바로 바뀌나 — 같은 틱 안에서 고치고 바로 그리기 ── */
    const before = 사람줄();
    const at = window.arTouch;
    window.arTouch = function () { return []; };     /* 배정 줄이 통째로 바뀐 셈 */
    hmStepsFresh();                                  /* 다시 그리기 전에 버린다 — 그 길 그대로 */
    O.바뀜 = { 전: before, 후: 사람줄() };
    window.arTouch = at;
    hmStepsFresh();

    /* ── 틀이 그 길을 쓰나 ── */
    O.있나 = { fresh: typeof hmStepsFresh === 'function', build: typeof hmStepsBuild === 'function' };
    return O;
  }, { seed: SEED });

  head('[0] 화면이 제대로 섰나 — 아니면 아래가 전부 헛것입니다 (8번)');
  is(!R.goErr && !R.paintErr, '  그리다 안 터졌다' + (R.goErr || R.paintErr ? ' ← ' + (R.goErr || R.paintErr) : ''));
  is(R.있나 && R.있나.fresh && R.있나.build, '  묶는 자(hmSteps) · 버리는 자(hmStepsFresh) · 짓는 자(hmStepsBuild)가 있다');
  is((R.한틱 || {}).줄 > 0, '  오늘 할 일이 섰다 — ' + ((R.한틱 || {}).줄) + '줄');

  head('[1] ★★ <b>한 틱에 한 번만 짓나</b>');
  is((R.한틱 || {}).달력 === 1, '  세 번 불러도 <b>달력은 한 번만</b> 훑는다 — ' + ((R.한틱 || {}).달력) + '번');
  is((R.한틱 || {}).마디 <= 1, '  마디도 한 번만 — ' + ((R.한틱 || {}).마디) + '번');
  is((R.한틱 || {}).같나, '  세 번 다 <b>같은 값</b>을 준다');

  head('[2] ★★ <b>틱이 끝나면 버리나</b> (1번)');
  is(R.다음틱 === 1, '  다음 틱에는 <b>새로 짓는다</b> — 달력 ' + R.다음틱 + '번 (안 버리면 0번이고, 그러면 낡은 값입니다)');
  is(/queueMicrotask\(hmStepsFresh\)|setTimeout\(hmStepsFresh,0\)/.test(IX.replace(/\s/g, '').replace(/queueMicrotask\(hmStepsFresh\)/g, 'queueMicrotask(hmStepsFresh)')) ||
     /queueMicrotask\(hmStepsFresh\)/.test(IX), '  그 선이 코드에 적혀 있다 — 틱 끝에 버린다');

  head('[3] ★★ <b>눌러도 바로 바뀌나</b> (1번) — 판 X599 에서 데인 그 자리');
  is(!!R.key && !R.finErr, '  「이분 끝」 을 누를 줄이 있다' + (R.finErr ? ' ← ' + R.finErr : ''));
  is(R.전n > 0 && R.후n === R.전n - 1, '  누르니 <b>그 자리에서 하나 준다</b> — ' + R.전n + '분 → ' + R.후n + '분');

  head('[4] ★★ <b>같은 틱 안에서 고치고 바로 그려도 참말인가</b> (1번)');
  is((R.바뀜 || {}).전 > 0 && (R.바뀜 || {}).후 < (R.바뀜 || {}).전,
    '  배정 줄이 바뀌고 <b>버린 뒤 그리면 바로 따라온다</b> — ' + ((R.바뀜 || {}).전) + '줄 → ' + ((R.바뀜 || {}).후) + '줄');
  is(/function hmPaint\(\)\{\s*hmStepsFresh\(\);/.test(IX.split('\r\n').join('\n')),
    '  <b>hmPaint 맨 앞</b>에서 버린다 — 고치고 바로 그리는 자리를 위해');
  is(/g\.hmStepsFresh\(\)/.test(HV), '  <b>새 오늘 화면 html 맨 앞</b>에서도 버린다');

  head('[5] ★★ <b>껍데기를 건드려도 안 번지나</b>');
  is(R.다른껍데기, '  부를 때마다 <b>새 껍데기</b>를 준다 (slice)');
  is(R.안번짐, '  한 곳이 배열을 비워도 <b>다른 곳은 멀쩡하다</b>');

  head('[6] ★★ <b>덜 훑나</b> (7번)');
  /* ⚠ main 은 달력 95번 · 마디 89번이었습니다. 늘면 웁니다 — 줄이면 이 수도 같이 내려 주십시오 (0-1번). */
  is((R.그리기 || {}).달력 <= 25, '  한 번 그릴 때 <b>달력</b> — ' + ((R.그리기 || {}).달력) + '번 (고치기 전 95번 · 바닥값 25)');
  is((R.그리기 || {}).마디 <= 15, '  한 번 그릴 때 <b>마디</b> — ' + ((R.그리기 || {}).마디) + '번 (고치기 전 89번 · 바닥값 15)');

  head('[7] ★ <b>짓는 일은 한 글자도 안 고쳤나</b>');
  /* ⚠ 처음에는 <b>주석까지 세어</b> 길이를 보았습니다 — 까닭을 적을수록 빨간불이 켜지는
     자는 못 믿을 자입니다. 재려던 것은 「묶는 자가 <b>짓기까지 하나</b>」 입니다 (8번).
     그래서 주석을 걷고, <b>짓는 데 쓰는 자를 부르나</b>로 봅니다. mcalToday 는 「어느 날의
     것인가」 를 묻는 것이라 열쇠에 들어가도 됩니다 — 짓는 일이 아닙니다. */
  const 묶0 = IX.slice(IX.indexOf('var HM_STEPS_C=null;'), IX.indexOf('function hmStepsBuild(){'));
  const 묶 = 묶0.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  is(묶.length > 60 && 묶.length < 1200 && !/mcalItems|mcalDay|mstDueList|arTouch|hmQPromise|hmQSignal|TDO\[/.test(묶),
    '  묶는 자는 <b>짓지 않는다</b> — 고르거나 거르는 말이 한 줄도 없다 (주석 뺀 ' + 묶.length + '자 · 바닥값 1200 — 짓는 자는 8,000자가 넘어 옮겨 담으면 바로 넘칩니다)');
  is(/function hmStepsBuild\(\)\{[\s\S]{0,400}mcalDay\(mcalItems\(\),mcalToday\(\)\)/.test(IX.split('\r\n').join('\n')),
    '  짓는 자는 <b>예전 그대로</b>다 — 달력을 거른 뒤 가져오는 그 줄');

  head('[8] ★ 서버');
  is(바깥.length - 뜰때 === 0, '  재는 동안 <b>바깥을 한 번도 안 불렀다</b> — ' +
    (바깥.length - 뜰때) + '번 (화면이 뜰 때 부른 글씨체·라이브러리 ' + 뜰때 + '건은 뺐습니다)');

  head('터진 것');
  is(errs.length === 0, '  화면이 안 터진다 — ' + (errs.length ? errs.slice(0, 2).join(' | ') : '0건'));

  await br.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ 한 틱 한 번 점검 — ' + bad + '가지가 어긋났습니다.'); process.exit(1); }
  console.log('✓ 한 틱 한 번 점검 통과 — 덜 훑고, 눌러도 바로 바뀝니다.');
})().catch((e) => { console.error('✗ 터졌습니다 — ' + (e && e.message)); try { srv.close(); } catch (x) {} process.exit(1); });
