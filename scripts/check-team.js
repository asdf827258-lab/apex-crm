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
     다섯 · 리더가 읽고 <b>복사해서</b> 보내는가 — AI 가 직접 보내지 않는다
     여섯 · 「팀원에게 보내기」 가 team_feedback 에 올바른 줄을 만드는가        */
const { chromium } = require('playwright');
const { SB_STUB } = require('./lib-sbstub.js');
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
  ok(/전체 복사/.test(fb) && /카톡용 전체 복사/.test(fb), '카톡으로 보낼 길도 그대로 남아 있다');
  ok(/대표님이 읽고 고쳐서/.test(fb), 'AI 가 직접 보내지 않는다고 화면이 못박는다');

  /* 만들어 둔 것이 팀원 판에도 따라붙는가 */
  await page.click('#tbWho'); await page.waitForTimeout(260);
  await page.evaluate(() => window.tOpen(''));      /* 아까 펴 둔 것을 닫고 다시 편다 */
  await page.click('.mrow'); await page.waitForTimeout(240);
  ok(/이 사람에게 보낼 말/.test(await page.locator('.det').innerText()),
     '팀원을 눌렀을 때 그 사람 피드백이 거기에도 붙는다');

  /* 여섯 · 진짜로 팀원 폰에 꽂히는가 — 줄의 모양을 본다 */
  console.log('\n팀원 폰으로 바로 보내기');
  const TODAY = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const p4 = await ctx.newPage();
  await p4.addInitScript(SB_STUB({
    __me: 'lead-1',
    profiles: [
      { id: 'lead-1', name: '윤시현', role: 'member', active: true },
      { id: 'm1', name: '김민수', role: 'member', active: true },
      { id: 'm2', name: '박서준', role: 'member', active: true }
    ],
    teams: [{ id: 't1', name: '온탑 1팀', leader_id: 'lead-1' }],
    team_members: [{ team_id: 't1', member_id: 'm1' }, { team_id: 't1', member_id: 'm2' }],
    calls: [
      { created_by: 'm1', call_at: TODAY + 'T09:12:00', result: '부재', appointment_at: null },
      { created_by: 'm1', call_at: TODAY + 'T10:20:00', result: '상담', appointment_at: TODAY + 'T14:00:00' }
    ],
    dbs: [{ id: 'd1', assigned_to: 'm1', assigned_date: TODAY, stage: '' },
          { id: 'd2', assigned_to: 'm2', assigned_date: TODAY, stage: '' }],
    saved_reports: [], team_feedback: []
  }));
  await p4.addInitScript(() => {
    try { localStorage.setItem('apex_studio_gproxy', 'http://127.0.0.1:8899/ai'); } catch (e) { }
  });
  await p4.goto('http://127.0.0.1:' + PORT + '/app/team.html', { waitUntil: 'domcontentloaded' });
  await p4.waitForTimeout(1600);
  ok(/윤시현/.test(await p4.locator('#pSrc').textContent()), '로그인하면 진짜 팀 기록으로 돈다 — 누구로 보고 있는지도 적힌다');
  ok(/온탑 1팀/.test(await p4.locator('#pTeam').textContent()), '조직도의 내 팀을 그대로 따른다');

  await p4.click('#tbFb'); await p4.waitForTimeout(300);
  await p4.click('.go'); await p4.waitForTimeout(1500);
  ok(await p4.locator('.send').count() === 1, '「팀원 폰으로 바로 보내기」 가 뜬다');
  await p4.click('.send .go'); await p4.waitForTimeout(700);

  const sent = await p4.evaluate(() => window.__wrote.filter(w => w.t === 'team_feedback' && w.op === 'upsert'));
  ok(sent.length === 1, '한 번에 모두 보낸다');
  const rows = (sent[0] || {}).v || [];
  ok(rows.length === 2, '팀원 두 명 몫이 만들어진다 — 나에게는 안 보낸다 (' + rows.length + '줄)');
  const r0 = rows[0] || {};
  for (const k of ['member_id', 'from_id', 'from_name', 'fb_date', 'msg', 'team_msg'])
    ok(k in r0, 'team_feedback 의 칸: ' + k);
  ok(r0.from_id === 'lead-1', '보낸 사람은 나로 박힌다 — 남의 이름으로 못 보낸다');
  ok(r0.fb_date === TODAY, '오늘 몫으로 들어간다 — 하루 한 줄');
  ok(rows.every(x => x.member_id !== 'lead-1'), '나 자신에게는 보내지 않는다');
  ok(r0.seen_at === null, '보낸 직후는 「아직 안 읽음」 이다');
  ok(/보냈습니다/.test(await p4.locator('.send u').innerText().catch(() => '')), '몇 시에 보냈는지·몇 명이 읽었는지가 남는다');

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

  /* 일곱 · 팀장이 손댈 것은 APEX 로 이어지는가 */
  console.log('\nAPEX 본체로 이어지는가');
  await p4.click('#tbNow'); await p4.waitForTimeout(350);
  ok(await p4.locator('.gogrid .gocard').count() === 6, '오늘 판 아래에 「여기서 이어서 하기」 여섯 칸이 있다');
  const tc = await p4.locator('.gogrid .gocard b').allInnerTexts();
  for (const x of ['조직도', '성장판', 'DB 통합 CRM'])
    ok(tc.indexOf(x) >= 0, '이어서 갈 곳: ' + x);
  await p4.evaluate(() => window.tApex('org'));
  await p4.waitForTimeout(500);
  ok(/\?go=org/.test(p4.url()), '누르면 APEX 조직도가 바로 열린다');

  console.log('\n오류');
  ok(errs.length === 0, '화면이 도는 동안 오류가 없다' + (errs.length ? ' — ' + errs.slice(0, 3).join(' / ') : ''));

  await browser.close(); srv.close(); ai.close();
  if (fail.length) { console.log('\n✗ ' + fail.length + '건\n' + fail.map(x => '  · ' + x).join('\n')); process.exit(1); }
  console.log('\n팀 하루 한 장 — 폰에서 팀이 보이고, 피드백은 사람이 읽고 보냅니다.');
})().catch(e => { console.error(e); try { srv.close(); ai.close(); } catch (x) { } process.exit(1); });
