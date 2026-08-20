/* 하루 한 장 — 폰에서 한 장으로 일이 끝나는가.

   지금까지 폰에서 고객을 보려면 TFA 업무관리에서 보고 → DB 통합 CRM 을
   열고 → 명단에서 찾고 → 표를 옆으로 밀어 기록했다. 왕복이 네 번이고,
   폰에서 가로로 밀리는 표는 최악이다.

   app/day.html 은 그 네 번을 한 장으로 합친다. 여기서 보는 것은 다섯 가지다.

     하나 · 네 판(오늘·주간·사람·등록)이 오류 없이 열리는가
     둘  · 「상담」 인데 약속 시각이 없으면 저장이 막히는가 — CRM 의 규칙이다
     셋  · 저장하는 한 줄이 db-crm.html 의 saveCall() 과 같은 모양인가
     넷  · 폰 명단에서 고른 사람이 saveDb() 와 같은 모양으로 들어가는가
     다섯 · 약속을 잡으면 진짜 .ics 가 나오는가 — 폰이 울려야 캘린더다

     여섯 · 로그인 전에는 가짜 숫자를 진짜인 척 내놓지 않는가

   서버에 붙지 않은 상태로 본다. 그래야 매번 같은 답이 나온다.        */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8897;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
               '.webmanifest': 'application/manifest+json' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

(async () => {
  const browser = await chromium.launch();
  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };

  /* 폰 크기로 본다 — 이 화면은 폰에서만 쓴다 */
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  /* 밖으로 나가는 것은 전부 막는다. supabase 도 안 붙는다 → 미리보기 자료로 돈다 */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  /* .ics 는 내려받기로 나간다 — 받아 보는 대신 만들어진 글자를 붙잡는다 */
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch (e) { }
    const B = window.Blob;
    window.__ics = '';
    window.Blob = function (parts, o) { if (o && /calendar/.test(o.type || '')) window.__ics = parts.join(''); return new B(parts, o); };
  });
  await page.goto('http://127.0.0.1:' + PORT + '/app/day.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(1200);

  console.log('\n폰에서 연다');
  ok(await page.locator('.phone').count() === 1, '한 장이 뜬다');
  ok((await page.locator('#dTop').textContent()).indexOf('월') > 0, '오늘 날짜가 맨 위에 있다');
  ok(await page.locator('.tab').count() === 4, '아래 판이 네 개다 (오늘·주간·사람·등록)');

  /* 여섯 · 서버에 못 붙었으면 그렇다고 말해야 한다 */
  const pill = await page.locator('#pSrc').textContent();
  ok(/미리보기/.test(pill), '로그인 전에는 「미리보기」 라고 스스로 밝힌다 (' + pill.trim() + ')');

  console.log('\n네 판을 다 눌러 본다');
  for (const [id, nm] of [['tbWeek', '주간'], ['tbList', '사람'], ['tbReg', '등록'], ['tbToday', '오늘']]) {
    await page.click('#' + id); await page.waitForTimeout(260);
    const n = (await page.locator('#body').innerHTML()).length;
    ok(n > 200, nm + ' 판이 내용을 가지고 열린다 (' + n + '자)');
  }

  console.log('\n오늘 — 한 사람만 세우고, 눌러서 기록한다');
  ok(await page.locator('.now-t b').count() > 0, '맨 앞에 사람이 한 명 서 있다');
  ok(await page.locator('.call2 a.tel').count() === 2, '전화와 문자, 두 갈래가 손에 닿는 자리에 있다');
  const sms = await page.locator('.call2 a.sms').getAttribute('href');
  ok(/^sms:\d+[?&]body=/.test(sms || ''), '문자는 본인 폰의 문자앱으로 열린다 — 본인 번호로 나간다');
  ok(/에이플러스에셋/.test(decodeURIComponent((sms || '').split('body=')[1] || '')), '문구가 db-crm.html 과 같은 말이다');
  ok(/문자에 이렇게 들어갑니다/.test(await page.locator('.smsx').innerText()), '보내기 전에 무슨 말이 나가는지 먼저 보여 준다');
  const before = await page.locator('.save[disabled]').count();
  ok(before === 1, '아무것도 안 고르면 저장이 잠겨 있다');

  /* 둘 · 상담인데 약속이 없으면 CRM 이 거부한다. 여기서 먼저 막는다 */
  await page.evaluate(() => window.dRes('상담')); await page.waitForTimeout(200);
  ok(await page.locator('.save[disabled]').count() === 1, '「상담」만 골라서는 저장이 안 된다');
  ok(/약속 시각/.test(await page.locator('.warn').innerText().catch(() => '')), '왜 안 되는지 화면이 알려 준다');
  await page.evaluate(() => { window.dApD(new Date(Date.now() + 9 * 3600000 + 86400000).toISOString().slice(0, 10)); window.dApT('14:00'); });
  await page.waitForTimeout(220);
  ok(await page.locator('.save.ready').count() === 1, '날짜와 시각을 고르면 저장이 열린다');
  ok(/로 잡습니다/.test(await page.locator('.apok').innerText()), '「내일 (X) 오후 2시 로 잡습니다」 하고 확인해 준다');

  /* 다섯 · 진짜 캘린더 파일인가 */
  console.log('\n캘린더에 담기 — 폰이 울려야 캘린더다');
  await page.click('.apok button'); await page.waitForTimeout(400);
  const ics = await page.evaluate(() => window.__ics || '');
  ok(/BEGIN:VEVENT/.test(ics), '진짜 일정(VEVENT)이 들어 있다');
  ok(/BEGIN:VALARM/.test(ics) && /TRIGGER:-PT60M/.test(ics), '한 시간 전 알람(VALARM)이 들어 있다');
  ok(/DTSTART;TZID=Asia\/Seoul:/.test(ics), '우리 시간대(Asia/Seoul)로 적힌다');
  ok(ics.indexOf('\r\n') > 0, '줄바꿈이 캘린더 규격(CRLF)이다');

  /* 셋 · CRM 에 들어가는 한 줄의 모양 */
  console.log('\n저장하면 CRM 의 calls 표에 이 모양으로 들어간다');
  await page.evaluate(() => { const m = document.getElementById('dMemo'); if (m) { m.value = '보장분석 받아 보시겠다고 하셔서 내일 두 시로 잡았습니다'; window.dMemoIn(m.value); } });
  await page.click('.save.ready'); await page.waitForTimeout(420);
  const show = await page.locator('.show').innerText().catch(() => '');
  ok(/calls/.test(show), 'calls 표라고 밝힌다');
  for (const k of ['db_id', 'created_by', 'call_at', 'result', 'appointment_at', 'memo', 'first_call_issue'])
    ok(show.indexOf(k) >= 0, 'saveCall() 과 같은 칸: ' + k);
  ok(/올리지 않았습니다/.test(show), '미리보기에서는 올리지 않았다고 분명히 말한다');

  /* 넷 · 폰 명단 → 내 배정 DB */
  console.log('\n등록 — 폰 명단에서 고른 사람만 내 배정 DB 로');
  await page.click('#tbReg'); await page.waitForTimeout(300);
  await page.fill('#rgTxt', '홍길동 010-1234-5678\n김영희 010-2345-6789\n박철수 010-3456-7890');
  await page.click('.pastebox .mini'); await page.waitForTimeout(320);
  ok(await page.locator('.rgi').count() === 3, '세 사람을 읽어 들였다');
  await page.evaluate(() => window.rgAll(false)); await page.waitForTimeout(200);
  ok(await page.locator('.save[disabled]').count() === 1, '아무도 안 고르면 넣기가 잠긴다 — 고른 사람만 들어간다');
  await page.evaluate(() => { window.rgTap(0); window.rgTap(2); }); await page.waitForTimeout(220);
  ok(/고른 2명/.test(await page.locator('.save').innerText()), '고른 2명만 넣는다고 적혀 있다');
  await page.click('.save.ready'); await page.waitForTimeout(420);
  const show2 = await page.locator('.show').innerText().catch(() => '');
  ok(/dbs/.test(show2) && /2줄/.test(show2), 'dbs 표에 2줄이 들어간다고 보여 준다');
  for (const k of ['assigned_date', 'assigned_to', 'customer_name', 'phone', 'source', 'region', 'report_name', 'created_by'])
    ok(show2.indexOf(k) >= 0, 'saveDb() 와 같은 칸: ' + k);

  /* 로그인 안 한 폰에서 열었을 때 — 「고장」 이 아니라 「로그인」 이라고 말해야 한다 */
  console.log('\n로그인 전 — 무엇을 누르면 되는지 알려 주는가');
  const p2 = await ctx.newPage();
  await p2.addInitScript(() => {
    window.supabase = { createClient: () => ({
      auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
      from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [] }) }) })
    }) };
  });
  await p2.goto('http://127.0.0.1:' + PORT + '/app/day.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p2.waitForTimeout(900);
  const bar = await p2.locator('.nop').first().innerText().catch(() => '');
  ok(/로그인이 필요합니다/.test(bar), '「로그인이 필요합니다」 라고 맨 위에 세운다');
  ok(await p2.locator('.nop a[href="./index.html"]').count() === 1, '눌러서 APEX 로 가는 단추가 붙어 있다');

  console.log('\n오류');
  ok(errs.length === 0, '화면이 도는 동안 오류가 없다' + (errs.length ? ' — ' + errs.slice(0, 3).join(' / ') : ''));

  await browser.close(); srv.close();
  if (fail.length) { console.log('\n✗ ' + fail.length + '건\n' + fail.map(x => '  · ' + x).join('\n')); process.exit(1); }
  console.log('\n하루 한 장 — 폰에서 한 장으로 끝나고, 그 한 줄이 CRM 모양 그대로입니다.');
})().catch(e => { console.error(e); try { srv.close(); } catch (x) { } process.exit(1); });
