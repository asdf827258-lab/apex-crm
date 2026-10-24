/* ══════════════════════════════════════════════════════════════════
   check-selfcheck.js — <b>고객이 혼자 하는 보장 셀프 점검이 제대로 서나</b> (판 X171)

   사장님 말씀 2026-10-23 —
     「보장분석 칸 고객이 스스로 교육이 끝나고 체크할 수 있도록 만들어줘.
       스스로 확인하고 필요한 부분을 체크하는 게 제일 중요해」
     「이거를 직접 쓰게 하고 싶은데」

   「보험의 기준」 강의를 들은 고객이 <b>제 폰에서 링크 하나로</b> 여는
   app/selfcheck.html 을 잽니다. 설계사가 옆에 없는 화면이라, 숫자가
   틀리거나 모르는 칸을 지어 넣으면 <b>고객이 그대로 믿습니다</b> (1번).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ 아무것도 <b>안 보낸다</b> — fetch · XHR · beacon · 웹소켓이
         코드에 없고, 눌러 봐도 요청이 한 번도 안 나간다
     [2] ★★ 이름·전화번호·주민번호 칸이 <b>없다</b> (3번)
     [3] ★★ 안 고른 칸은 <b>「아직」</b> 이다 — 0 도 「모름」 도 아니다 (1번)
     [4] ★★ 판정 — 암 진단비 ÷ 연소득 배수 · 연소득을 모르면 「확인해요」
         (배수를 지어 내지 않는다) · 0 이면 「비어 있어요」
     [5] ★ 「✋ 같이 볼래요」 는 <b>고객이 누른 칸만</b> 센다 — 괜찮은 칸은 안 센다
     [6] ★★ 결과 글에 「약관과 보험사 심사 결과에 따라요」 가 붙는다 (2번)
     [7] ★ 다시 열어도 답이 남고, 「처음부터」 를 누르면 지워진다
     [8] 폰 390px 에서 옆으로 안 밀리고, 누르는 칸이 40px 이상이다
     [9] 인쇄하면 ✋ 단추가 빠지고 ☐ 칸이 선다 (펜으로 쓰는 종이)
     [10] ★★ 내 플로우(판 X180) — 주소 # 뒤의 문항·순서·설계사 이름·첫인사가
          서고, 결론 낱말이 든 첫인사는 안 서며, 판정은 그대로다
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http'), url = require('url');
const { chromium } = require('playwright');
const ROOT = process.cwd(), PORT = 9231, FILE = path.join(ROOT, 'app', 'selfcheck.html');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const src = fs.readFileSync(FILE, 'utf8');
/* 문항·판정은 selfcheck-core.js 한 벌입니다(판 X180) — 쪽에는 그것을 부르는 줄만 있어야 합니다 */
const js = fs.readFileSync(path.join(ROOT, 'app', 'selfcheck-core.js'), 'utf8');

console.log('\n[1] 아무것도 보내지 않는다 — 코드');
is(js.length > 1000, '  점검 코드가 들어 있다 (' + js.length + '자)');
is(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/.test(js),
   '  fetch · XHR · beacon · 웹소켓이 코드에 없다');

is(/<script src="selfcheck-core\.js"><\/script>/.test(src) && !/var ALLQ|\{k:'silson'/.test(src),
   '  ★ 쪽은 selfcheck-core.js 를 부르기만 한다 — 문항 표를 또 박지 않았다(5번)');

console.log('\n[2] 이름·전화번호·주민번호를 묻지 않는다 (3번)');
is(!/type=["']?(tel|email)/.test(src), '  전화·메일 칸이 없다');
const inputs = src.replace(/<script>[\s\S]*?<\/script>/g, '').match(/<input[^>]*>/g) || [];
is(inputs.length === 0, '  화면 틀에 손으로 박은 입력 칸이 없다 — 칸은 문항 표에서만 선다 (' + inputs.length + ')');
is(!/주민|생년월일|data-scn=["'](name|tel|phone)/.test(js), '  문항 표에 주민번호·생년월일·이름 칸이 없다');

const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': (/\.js$/.test(f) ? 'text/javascript' : 'text/html') + '; charset=utf-8' }); fs.createReadStream(f).pipe(rs);
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  /* 바깥은 끊는다 — 글꼴 하나라도 기다리면 곳마다 다른 순간을 잽니다 (check-netblock) */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage(), errs = [], sent = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('request', r => { const t = r.resourceType(); if (/fetch|xhr|websocket|eventsource|ping/.test(t)) sent.push(t + ' ' + r.url()); });
  const U = 'http://127.0.0.1:' + PORT + '/app/selfcheck.html';
  await p.goto(U, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(400);
  const T = s => p.textContent(s).then(x => x.trim());
  const pick = (k, v) => p.click('.sc-q[data-scq="' + k + '"] .sc-op[data-scv="' + v + '"]');
  const st = k => p.getAttribute('.sc-q[data-scq="' + k + '"]', 'data-s');

  console.log('\n[3] 안 고른 칸은 「아직」 이다 (1번)');
  is(await p.locator('.sc-q').count() === 13, '  13문항이 선다');
  is(await T('.prog [data-sccnt="done"]') === '0', '  처음엔 0 문항 답함');
  is(await T('[data-sccnt="left"]') === '13', '  남은 문항 13');
  const z = await p.evaluate(() => ['need', 'mid', 'chk', 'ok'].map(k => document.querySelector('[data-sc="res"] [data-sccnt="' + k + '"]').textContent).join(''));
  is(z === '0000', '  안 고른 칸을 「확인해요」 로도 세지 않는다 (' + z + ')');
  is(await p.locator('.sc-it').count() === 0, '  결과 목록이 비어 있다 — 지어 넣지 않는다');

  console.log('\n[4] 판정');
  await pick('brain', 'h');
  is(await st('brain') === 'mid', '  뇌출혈만 → 채우면 좋아요');
  await pick('nonpay', 'n');
  is(await st('nonpay') === 'need', '  비싼 암 치료 없음 → 비어 있어요');
  await p.fill('[data-scn="c"]', '3000');
  is(await st('cancer') === 'chk', '  ★★ 연소득을 모르면 배수를 안 지어 내고 「확인해요」');
  await p.fill('[data-scn="i"]', '5000');
  is(await st('cancer') === 'mid', '  3,000만 ÷ 5,000만 = 0.6배 → 채우면 좋아요');
  is(/0\.6배/.test(await p.evaluate(() => APXSelf.text())), '  결과 글에 「연소득의 0.6배」');
  await p.fill('[data-scn="c"]', '0');
  is(await st('cancer') === 'need', '  암 진단비 0 → 비어 있어요');
  await p.fill('[data-scn="c"]', '10000');
  is(await st('cancer') === 'ok', '  1억 ÷ 5,000만 = 2배 → 괜찮아요');
  await p.fill('[data-scn="c"]', '');
  is(await st('cancer') === '', '  지우면 다시 「아직」');
  await pick('silson', '?');
  is(await st('silson') === 'chk', '  모르겠어요 → 확인해요');
  await pick('silson', '?');
  is(await st('silson') === '', '  같은 칸을 한 번 더 누르면 답이 풀린다');
  await pick('silson', '2');

  console.log('\n[5] ✋ 는 고객이 누른 칸만 센다');
  is(await T('[data-sccnt="pick"]') === '0', '  아무것도 안 눌렀으면 0 — 저절로 고르지 않는다');
  await p.click('.sc-pick[data-scp="nonpay"]');
  await p.click('.sc-pick[data-scp="brain"]');
  is(await T('[data-sccnt="pick"]') === '2', '  두 칸을 누르면 2');
  is(await p.locator('.sc-pick[data-scp="silson"]').count() === 0, '  괜찮은 칸(실비)에는 ✋ 단추가 없다');

  console.log('\n[6] 결과 글 (2번)');
  const txt = await p.evaluate(() => APXSelf.text());
  is(/약관과 보험사 심사 결과에 따라요/.test(txt), '  「약관과 보험사 심사 결과에 따라요」 가 붙는다');
  is(/같이 볼 칸: 뇌 보장 이름, 비싼 암 치료/.test(txt), '  같이 볼 칸이 고객이 누른 그대로');
  is(!/아직|undefined|NaN|null/.test(txt.split('\n').slice(1, -2).join('\n')), '  안 고른 칸·부서진 값이 글에 안 섞인다');

  console.log('\n[7] 다시 열기 · 처음부터');
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);
  is(await T('.prog [data-sccnt="done"]') === '3', '  다시 열어도 답 3개가 남는다');
  await p.click('[data-sca="clear"]');
  is(await T('.prog [data-sccnt="done"]') === '0', '  「처음부터」 → 0');
  const ls = await p.evaluate(() => localStorage.getItem('apxSelfCheck'));
  is(ls === '{"a":{},"n":{},"p":{}}', '  저장된 답도 비었다');

  console.log('\n[8] 폰 390px');
  is(await p.evaluate(() => document.documentElement.scrollWidth) <= 390, '  옆으로 안 밀린다');
  const hs = await p.$$eval('.sc-op,.sc-pick,.act button', a => a.filter(e => e.offsetParent).map(e => e.getBoundingClientRect().height));
  is(hs.length > 40 && Math.min.apply(null, hs) >= 40, '  누르는 칸 ' + hs.length + '개가 모두 40px 이상 (가장 작은 것 ' + Math.round(Math.min.apply(null, hs)) + 'px)');

  console.log('\n[9] 인쇄 — 펜으로 쓰는 종이');
  await pick('brain', 'v');
  await p.emulateMedia({ media: 'print' });
  is(await p.$eval('.act', e => getComputedStyle(e).display) === 'none', '  인쇄에는 단추가 빠진다');
  const mark = await p.$eval('.sc-q[data-scq="heart"] .sc-op', e => getComputedStyle(e, '::before').content);
  is(/☐/.test(mark), '  안 고른 칸은 ☐');
  const on = await p.$eval('.sc-q[data-scq="brain"] .sc-op.on', e => getComputedStyle(e, '::before').content);
  is(/☑/.test(on), '  고른 칸은 ☑');

  await p.emulateMedia({ media: 'screen' });
  console.log('\n[10] 내 플로우 — 주소 # 뒤');
  await p.evaluate(() => localStorage.removeItem('apxSelfCheck'));
  const H = '#q=brain.cancer.claim&by=' + encodeURIComponent('홍길동') + '&hi=' + encodeURIComponent('오늘 강의 들어 주셔서 고마워요');
  await p.goto(U + H, { waitUntil: 'domcontentloaded' }); await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);
  const order = await p.$$eval('.sc-q', a => a.map(e => e.getAttribute('data-scq')).join(','));
  is(order === 'brain,cancer,claim', '  고른 세 문항이 고른 순서로만 선다 (' + order + ')');
  is(await T('.prog [data-sccnt="all"]') === '3' && await T('[data-sccnt="left"]') === '3', '  「/ 3 답했어요」 · 남은 3 — 열셋이 아니라 고른 수');
  is(await p.isVisible('[data-sc-show="by"]') && /홍길동/.test(await T('[data-sc="by"]')), '  「홍길동 설계사가 보낸 점검이에요」');
  is(/고마워요/.test(await T('[data-sc="hi"]')) && /설계사가 적은 말/.test(await T('.hi')), '  첫인사가 「설계사가 적은 말」 이름표와 함께 선다');
  await pick('brain', 'h');
  is(await st('brain') === 'mid', '  ★ 판정은 그대로 — 뇌출혈만 → 채우면 좋아요 (플로우가 기준을 못 바꾼다)');
  const t2 = await p.evaluate(() => APXSelf.text());
  is(/→ 홍길동 설계사님께/.test(t2) && /약관과 보험사 심사 결과에 따라요/.test(t2), '  결과 글이 「→ 홍길동 설계사님께」 로 가고 약관·심사 문구는 그대로');
  await p.goto(U + '#q=zzz.brain.brain&hi=' + encodeURIComponent('무조건 나오는 비과세 상품이에요'), { waitUntil: 'domcontentloaded' });
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);
  is(await p.locator('.sc-q').count() === 1, '  모르는 문항 이름·겹친 문항은 버린다');
  is(!(await p.isVisible('[data-sc-show="hi"]')), '  ★★ 「무조건 · 비과세」 가 든 첫인사는 안 선다 (1번·2번)');
  is(!(await p.isVisible('[data-sc-show="by"]')), '  설계사 이름이 없으면 「보낸 점검」 줄도 안 선다');
  await p.goto(U + '#q=', { waitUntil: 'domcontentloaded' }); await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);
  is(await p.locator('.sc-q').count() === 13, '  문항을 비워 보내면 열셋 그대로 (빈 점검이 안 된다)');
  const lk = await p.evaluate(() => APXSelf.link({ q: ['silson', 'brain'], by: '홍길동<b>', hi: '원금 보장돼요' }, 'X'));
  is(lk === 'X#q=silson.brain&by=' + encodeURIComponent('홍길동b'), '  링크 짓기 — 꺾쇠는 지우고, 결론 낱말 첫인사는 안 담는다 (' + lk.slice(0, 40) + ')');

  console.log('\n[1] 아무것도 보내지 않는다 — 눌러 본 뒤');
  is(sent.length === 0, '  요청이 한 번도 안 나갔다' + (sent.length ? ' ← ' + sent.slice(0, 3).join(' · ') : ''));
  is(errs.length === 0, '  자바스크립트 오류 0' + (errs.length ? ' ← ' + errs[0] : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 셀프 점검 — 안 보내고, 안 지어 내고, 고객이 고른 칸만 셉니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
