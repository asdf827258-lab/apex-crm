/* 팀 하루 한 장 — 사업단장이 폰에서 팀을 보는가.

   사업단장의 일은 자기 전화가 아니다. 팀원 스무 명이 오늘 걸었는가,
   안 걸었으면 무슨 말을 해 줄 것인가다. 그런데 그걸 보려면 컴퓨터를
   켜고 TEAM 총괄을 열어야 했다.

   여기서 다섯 가지를 본다.

     하나  · 세 판(오늘·팀원·피드백)이 오류 없이 열리는가
     둘   · 아직 0통인 사람이 따로 서는가 — 그게 리더가 볼 유일한 줄이다
     셋   · AI 에게 보내는 글에 <b>고객 이름·번호·통화 메모가 없는가</b>
            셋째가 가장 중요하다. 팀을 보자고 고객을 넘기면 안 된다.
     넷   · AI 가 전체 한 줄과 사람별 한 줄을 만들어 주는가
     다섯 · 리더가 읽고 <b>복사해서</b> 보내는가 — AI 가 직접 보내지 않는다  */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8898;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
               '.webmanifest': 'application/manifest+json' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

/* AI 대신 답하는 가짜 중계 — 진짜 AI 를 부르지 않고도 길 전체를 볼 수 있다.
   보낸 글은 그대로 돌려받아, 무엇이 나갔는지 검사한다. */
let SENT = '';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS' };
const ai = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }
  let b = ''; req.on('data', c => b += c);
  req.on('end', () => {
    let names = [];
    try {
      const j = JSON.parse(b);
      SENT = j.contents[0].parts[0].text;
      names = SENT.split('\n').slice(3).map(l => l.split('|')[0].trim()).filter(Boolean);
    } catch (e) { }
    const out = {
      all: '오늘 팀 통화 43통입니다. 아직 세 분이 시작을 못 하셨습니다. 남은 오후에 각자 세 통씩만 더 채웁시다.',
      each: names.map(n => ({ name: n, msg: n + ' 님, 오늘 숫자 확인했습니다. 지금 세 통만 더 돌려 주세요. 오후가 제일 잘 받습니다.' }))
    };
    res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, CORS));
    res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(out) }] } }] }));
  });
}).listen(8899);

(async () => {
  const browser = await chromium.launch();
  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };

  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0 || u.indexOf('127.0.0.1:8899') >= 0) return r.continue();
    return r.fulfill({ status: 200, contentType: 'text/css', body: '' });
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      /* 회사 공용 Gemini 중계가 붙어 있는 폰인 척한다 */
      localStorage.setItem('apex_studio_gproxy', 'http://127.0.0.1:8899/ai');
    } catch (e) { }
  });
  await page.goto('http://127.0.0.1:' + PORT + '/app/team.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(1200);

  console.log('\n폰에서 연다');
  ok(await page.locator('.phone').count() === 1, '한 장이 뜬다');
  ok(await page.locator('.tab').count() === 3, '아래 판이 세 개다 (오늘·팀원·피드백)');
  ok(/미리보기/.test(await page.locator('#pSrc').textContent()), '로그인 전에는 「미리보기」 라고 스스로 밝힌다');
  ok(/명/.test(await page.locator('#pTeam').textContent()), '어느 팀 몇 명을 보고 있는지 맨 위에 적는다');

  console.log('\n오늘 — 리더가 볼 유일한 줄');
  const now = await page.locator('#body').innerText();
  ok(/아직 0통/.test(now), '아직 0통인 사람이 따로 선다');
  ok(await page.locator('.mrow.zero').count() >= 2, '0통인 사람이 붉게 표시된다');
  ok(/몇 시에 걸고 있나/.test(now), '몇 시에 거는지가 보인다 — 오전에 몰렸는지 오후에 몰렸는지');
  ok(await page.locator('.bar i').count() === 14, '8시부터 21시까지 시간대가 그려진다');

  console.log('\n팀원 — 눌러서 자세히');
  await page.click('#tbWho'); await page.waitForTimeout(280);
  const n = await page.locator('.mrow').count();
  ok(n >= 5, '팀원이 줄로 선다 (' + n + '명)');
  ok(await page.locator('.det').count() === 0, '처음에는 접혀 있다');
  await page.click('.mrow'); await page.waitForTimeout(240);
  const det = await page.locator('.det').innerText();
  ok(/오늘 상담/.test(det) && /배정 DB/.test(det), '누르면 그 사람의 숫자가 펼쳐진다');

  console.log('\nAI 에게 무엇이 나가는가 — 여기가 제일 중요하다');
  await page.click('#tbFb'); await page.waitForTimeout(280);
  await page.click('.sec .mini'); await page.waitForTimeout(240);   /* 열어 보기 */
  const dg = await page.locator('.all p').innerText();
  ok(/\[사람별\]/.test(dg), '무엇을 보내는지 리더가 직접 열어 볼 수 있다');
  ok(/김민수/.test(dg), '팀원 이름과 숫자는 나간다');
  ok(!/010-|고객|메모/.test(dg), '고객 이름·전화번호·통화 메모는 나가지 않는다');

  console.log('\nAI 가 쓰고, 사람이 보낸다');
  await page.click('.go'); await page.waitForTimeout(1400);
  ok(/\[팀 합계\]/.test(SENT), 'AI 가 받은 글에 팀 합계가 들어 있다');
  ok(!/010-\d/.test(SENT), 'AI 가 받은 글에 전화번호가 한 줄도 없다');
  const fb = await page.locator('#body').innerText();
  ok(/전체에게 — 단톡방에 그대로/.test(fb), '전체에게 보낼 한 줄이 나온다');
  ok(/오늘 팀 통화 43통/.test(fb), 'AI 가 쓴 말이 그대로 실린다');
  ok(await page.locator('.fbi').count() >= 5, '사람마다 따로 한 줄씩 붙는다');
  ok(await page.locator('.fbi .cp').count() >= 5, '한 사람에게 보낼 말을 따로 복사할 수 있다');
  ok(/전체 복사/.test(fb) && /사람별 전체 복사/.test(fb), '단톡방용·사람별, 두 가지로 복사된다');
  ok(/대표님이 읽고 고쳐서/.test(fb), 'AI 가 직접 보내지 않는다고 화면이 못박는다');

  /* 만들어 둔 것이 팀원 판에도 따라붙는가 */
  await page.click('#tbWho'); await page.waitForTimeout(260);
  await page.evaluate(() => window.tOpen(''));      /* 아까 펴 둔 것을 닫고 다시 편다 */
  await page.click('.mrow'); await page.waitForTimeout(240);
  ok(/이 사람에게 보낼 말/.test(await page.locator('.det').innerText()),
     '팀원을 눌렀을 때 그 사람 피드백이 거기에도 붙는다');

  console.log('\nAI 가 없는 폰');
  const p2 = await ctx.newPage();
  await p2.addInitScript(() => { try { localStorage.clear(); } catch (e) { } });
  await p2.goto('http://127.0.0.1:' + PORT + '/app/team.html', { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(900);
  await p2.click('#tbFb'); await p2.waitForTimeout(240);
  await p2.click('.go'); await p2.waitForTimeout(600);
  const w = await p2.locator('#body').innerText();
  ok(/AI 가 이 폰에 연결되어 있지 않습니다/.test(w), 'AI 가 없으면 없다고 말한다 — 조용히 아무것도 안 하지 않는다');
  ok(await p2.locator('.warnbox a[href="./index.html"]').count() >= 1, '어디로 가면 되는지 단추가 붙는다');

  console.log('\n오류');
  ok(errs.length === 0, '화면이 도는 동안 오류가 없다' + (errs.length ? ' — ' + errs.slice(0, 3).join(' / ') : ''));

  await browser.close(); srv.close(); ai.close();
  if (fail.length) { console.log('\n✗ ' + fail.length + '건\n' + fail.map(x => '  · ' + x).join('\n')); process.exit(1); }
  console.log('\n팀 하루 한 장 — 폰에서 팀이 보이고, 피드백은 사람이 읽고 보냅니다.');
})().catch(e => { console.error(e); try { srv.close(); ai.close(); } catch (x) { } process.exit(1); });
