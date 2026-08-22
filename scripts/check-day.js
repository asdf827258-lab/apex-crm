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
     일곱 · 팀장이 보낸 한 마디가 맨 위에 뜨고, 읽으면 서버로 되돌아가는가

   서버에 붙지 않은 상태로 본다. 그래야 매번 같은 답이 나온다.        */
const { chromium } = require('playwright');
const { SB_STUB } = require('./lib-sbstub.js');
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

  /* 일곱 · 지난번에 들은 말이 오늘 첫 마디로 돌아오는가 — 기록할 이유를 만드는 자리 */
  console.log('\n지난번에 들은 말이 오늘 맨 위로 올라오는가');
  await page.evaluate(() => window.dJump('d2'));   /* 두 번 걸었는데 메모가 없는 사람 */
  await page.waitForTimeout(300);
  const none = await page.locator('.last').first().innerText().catch(() => '');
  ok(/지난번 메모가 없습니다/.test(none), '메모가 없으면 없다고 말한다 — 지어내지 않는다');
  ok(/다음에 이 자리에 그대로/.test(none), '왜 적어야 하는지를 알려 준다 (관리가 아니라 내 손해라서)');

  await page.evaluate(() => window.dJump('d0'));   /* 「보험료가 부담된다」 고 한 사람 */
  await page.waitForTimeout(300);
  const last = await page.locator('.last').first().innerText().catch(() => '');
  ok(/🔁 지난번/.test(last), '「지난번」 칸이 카드 안에 있다');
  ok(/보험료가 부담된다/.test(last), '지난 통화에서 들은 말이 그대로 적혀 있다');
  ok(/오늘 첫 마디/.test(last), '무슨 말로 시작할지가 붙어 있다');
  ok(/님, 지난번에 「/.test(last), '첫 마디가 지난번 말을 되돌려 준다 — 새 화법을 지어내지 않는다');
  ok(/처방전에.*보험료.*를 미리 넣어/.test(last), '지난 메모에서 뽑은 낱말을 처방전에 미리 넣어 둔다 (조사까지 맞춰서)');
  const ph = await page.locator('.memo').getAttribute('placeholder');
  ok(/다음에 이 사람이 뜰 때/.test(ph || ''), '메모 칸이 「이게 다음에 돌아온다」 고 말한다');

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
  ok(!/[^\r]\n/.test(ics), '어느 줄도 규격을 벗어나지 않는다');
  ok(!ics.split('\r\n').some(l => Buffer.byteLength(l, 'utf8') > 75), '한 줄이 75바이트를 넘지 않는다 (한글 일정이 통째로 안 들어가는 것을 막는다)');

  /* 여덟 · 폰이 먼저 울리게 — 열어야 보이는 화면은 안 열린다 */
  console.log('\n알림 — 앱을 안 열어도 그날 폰이 울리는가');
  await page.click('#tbWeek'); await page.waitForTimeout(320);
  ok(await page.locator('.bell2 button').count() === 2, '이번 주 담기 · 평일 아침마다, 두 갈래가 있다');
  await page.evaluate(() => { window.__ics = ''; });
  await page.click('.bell2 button');            /* 이번 주 담기 */
  await page.waitForTimeout(360);
  const wk = await page.evaluate(() => window.__ics || '');
  const nEv = (wk.match(/BEGIN:VEVENT/g) || []).length;
  ok(nEv >= 2, '이번 주 일정이 여러 건 한 파일에 담긴다 (' + nEv + '건)');
  ok((wk.match(/BEGIN:VALARM/g) || []).length === nEv, '모든 일정에 알람이 붙어 있다');
  ok(/TRIGGER:PT0S/.test(wk), '시각이 없는 일(걸 사람·기한·생일)은 그날 아침에 울린다');
  ok(/TRIGGER:-PT60M/.test(wk), '상담 약속은 한 시간 전에 울린다');

  await page.evaluate(() => { window.__ics = ''; });
  await page.click('.bell2 button.gh');         /* 평일 아침마다 */
  await page.waitForTimeout(360);
  const dly = await page.evaluate(() => window.__ics || '');
  ok(/RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR/.test(dly), '평일 아침 알림은 한 번 담으면 되풀이된다');
  ok(/하루 한 장/.test(dly), '알림을 누르면 무엇을 열어야 하는지 적혀 있다');
  await page.click('#tbToday'); await page.waitForTimeout(320);

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

  /* 아홉 · 팀장이 보낸 말이 폰에도 컴퓨터에도 뜨는가 */
  console.log('\n팀장이 보낸 한 마디');
  const TODAY = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const p3 = await ctx.newPage();
  await p3.addInitScript(SB_STUB({
    __me: 'me-1',
    profiles: [{ name: '김민수' }],
    dbs: [{ id: 'x1', assigned_to: 'me-1', customer_name: '홍길동', phone: '010-1111-2222',
            region: '서울', assigned_date: TODAY, source: '방송' }],
    calls: [], clients: [], saved_reports: [],
    /* 처음 열 때는 없다가, 나중에 팀장이 보낸다 */
    team_feedback: { __seq: [[], [{ id: 'f1', from_name: '윤시현', fb_date: TODAY,
      msg: '오늘 11통인데 상담이 1건입니다. 오후 6시 이후로 옮겨서 다섯 통만 더 돌려 보세요.',
      team_msg: '오늘 팀 통화 43통입니다. 각자 세 통씩만 더 채웁시다.', seen_at: null }]] }
  }));
  await p3.goto('http://127.0.0.1:' + PORT + '/app/day.html', { waitUntil: 'domcontentloaded' });
  await p3.waitForTimeout(2200);
  ok(await p3.locator('.tf').count() === 0, '보낸 것이 없으면 아무것도 안 뜬다');
  /* 다른 화면을 보다가 돌아왔다 — 그 사이에 팀장이 보냈다 */
  await p3.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await p3.waitForTimeout(800);
  const tf = await p3.locator('.tf').innerText().catch(() => '');
  ok(/윤시현 님이 오늘 한 마디/.test(tf), '누가 보냈는지와 함께 맨 위에 선다');
  ok(/오후 6시 이후로 옮겨서/.test(tf), '팀장이 쓴 말이 그대로 실린다');
  ok(/팀 전체에게 —/.test(tf), '그날 전체에게 한 말도 같이 보인다');
  ok(await p3.locator('#tbToday .bdg').count() === 1, '아래 「오늘」 탭에 빨간 점이 붙는다');
  const note = await p3.evaluate(() => (window.__notes || [])[0] || null);
  ok(!!note && /윤시현/.test(note.t), '폰 알림이 뜬다 (알림을 켜 둔 폰에서)');

  await p3.click('.tf em button');            /* 읽었습니다 */
  await p3.waitForTimeout(400);
  const wrote = await p3.evaluate(() => window.__wrote.filter(w => w.t === 'team_feedback'));
  ok(wrote.length === 1 && wrote[0].op === 'update' && !!wrote[0].v.seen_at,
     '읽으면 seen_at 이 서버로 되돌아간다 — 팀장 화면에 「읽음」 으로 뜬다');
  ok(await p3.locator('.tf').count() === 0, '읽은 뒤에는 사라진다');
  ok(await p3.locator('#tbToday .bdg').count() === 0, '빨간 점도 같이 없어진다');

  /* 열 · 시각이 기기 시간대에 흔들리지 않는가 — 여기가 틀리면 「몇 시에 걸었나」 가 통째로 무너진다 */
  console.log('\n시간대가 달라도 시각이 맞는가 (뉴욕 시간으로 맞춘 폰)');
  const ny = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true,
    hasTouch: true, timezoneId: 'America/New_York' });
  await ny.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const pz = await ny.newPage();
  pz.on('pageerror', e => errs.push('[tz] ' + e.message));
  await pz.addInitScript(SB_STUB({
    __me: 'me-1', profiles: [{ name: '박서준' }],
    dbs: [{ id: 'z1', assigned_to: 'me-1', customer_name: '권도윤', phone: '010-2222-3333',
            region: '경기', assigned_date: TODAY, source: '보장분석' }],
    calls: [], clients: [], saved_reports: [], team_feedback: [], app_config: []
  }));
  await pz.goto('http://127.0.0.1:' + PORT + '/app/day.html', { waitUntil: 'domcontentloaded' });
  await pz.waitForTimeout(1800);
  const t0 = Date.now();
  await pz.evaluate(() => { window.dCall(); window.dRes('상담'); });
  await pz.waitForTimeout(200);
  const apD = await pz.evaluate(() => {
    const d = new Date(Date.now() + 9 * 3600000 + 86400000).toISOString().slice(0, 10);
    window.dApD(d); window.dApT('14:00'); return d;
  });
  await pz.waitForTimeout(250);
  await pz.evaluate(() => { const m = document.getElementById('dMemo'); m.value = '내일 두 시로 잡았습니다'; window.dMemoIn(m.value); });
  await pz.click('.save.ready'); await pz.waitForTimeout(600);
  const call = await pz.evaluate(() => (window.__wrote.filter(w => w.t === 'calls')[0] || {}).v || null);
  ok(!!call, '뉴욕 시간대 폰에서도 통화 기록이 올라간다');
  const drift = Math.abs(new Date(call.call_at).getTime() - t0);
  ok(drift < 120000, '걸린 시각이 진짜 그 순간이다 — 어긋남 ' + Math.round(drift / 1000) + '초 (9시간이면 32400초)');
  const want = new Date(apD + 'T14:00:00+09:00').toISOString();
  ok(call.appointment_at === want, '약속은 「한국 시각 오후 2시」 로 못박혀 들어간다 (' + call.appointment_at + ')');
  await ny.close();

  /* 열하나 · 고객 365일을 폰에서 고치는가 — 그리고 있던 것을 안 지우는가 */
  console.log('\n고객 365일 — 폰에서 고치기');
  const p5 = await ctx.newPage();
  p5.on('pageerror', e => errs.push('[365] ' + e.message));
  await p5.addInitScript(SB_STUB({
    __me: 'me-1', profiles: [{ name: '박서준' }],
    dbs: [{ id: 'z1', assigned_to: 'me-1', customer_name: '권도윤', phone: '010-2222-3333',
            region: '경기', assigned_date: TODAY, source: '보장분석' }],
    calls: [], team_feedback: [], app_config: [],
    clients: [{ id: 'c1', advisor_id: 'me-1', name_masked: '권*윤', created_at: TODAY }],
    /* 이미 컴퓨터에서 적어 둔 것 — 폰에서 고쳤다고 이게 날아가면 안 된다 */
    saved_reports: [{ id: 'meta-1', client_id: 'c1', content: {
      fp: { f_job: '자영업', f_income: '월 400' }, fam: '권씨네', rel: '본인',
      touch: [{ at: TODAY, how: '전화', note: '증권 확인 부탁드림' }],
      next: null, bd: '', up: 1 } }]
  }));
  await p5.goto('http://127.0.0.1:' + PORT + '/app/day.html', { waitUntil: 'domcontentloaded' });
  await p5.waitForTimeout(1800);
  ok(/고치기/.test(await p5.locator('.c365').innerText()), '고객 365일 칸에 「고치기」 가 붙는다');
  await p5.click('.c365 .ed'); await p5.waitForTimeout(300);
  ok(await p5.locator('.ce').count() === 1, '눌러서 그 자리에서 펴진다');
  ok(await p5.locator('.bd2 select').count() === 2, '생일은 월·일 두 칸으로 고른다 — 연도는 안 받는다');

  await p5.evaluate(() => { window.dCeWhat('증권 전달하고 소개 요청'); });
  await p5.locator('.ce .rn button').nth(2).click();       /* 1주 뒤 */
  await p5.waitForTimeout(200);
  await p5.locator('.bd2 select').first().selectOption('03');
  await p5.locator('.bd2 select').nth(1).selectOption('15');
  await p5.waitForTimeout(250);
  ok(/D-/.test(await p5.locator('.bd2 b').innerText().catch(() => '')), '생일을 고르면 며칠 남았는지 바로 보인다');
  await p5.click('.cebt .sv'); await p5.waitForTimeout(600);

  const meta = await p5.evaluate(() => (window.__wrote.filter(w => w.t === 'saved_reports')[0] || {}).v || null);
  ok(!!meta && !!meta.content, '고객 365일 줄을 고친다 (새로 만들지 않는다)');
  const cn = (meta || {}).content || {};
  ok(cn.next && cn.next.what === '증권 전달하고 소개 요청', '다음 할 일이 들어간다');
  ok(cn.next && cn.next.due === new Date(Date.now() + 9 * 3600000 + 7 * 86400000).toISOString().slice(0, 10),
     '「1주 뒤」 가 그 날짜로 들어간다');
  ok(cn.bd === '03-15', '생일이 MM-DD 로 들어간다 — 앱이 읽는 그 모양');
  ok(cn.fp && cn.fp.f_job === '자영업', '컴퓨터에서 적은 팩트파인딩이 그대로 남는다');
  ok(cn.fam === '권씨네' && cn.rel === '본인', '가족 묶음이 그대로 남는다');
  ok((cn.touch || []).length === 1 && cn.touch[0].note === '증권 확인 부탁드림', '접촉 기록이 그대로 남는다');
  for (const k of ['fp', 'fam', 'rel', 'next', 'touch', 'bd', 'up'])
    ok(k in cn, 'cmSave() 와 같은 칸: ' + k);

  /* 「끝냈습니다」 — 접촉 기록에 남고 다음 할 일은 비워진다 (앱의 cmNextDone 과 같게) */
  const p6 = await ctx.newPage();
  p6.on('pageerror', e => errs.push('[done] ' + e.message));
  await p6.addInitScript(SB_STUB({
    __me: 'me-1', profiles: [{ name: '박서준' }],
    dbs: [{ id: 'z1', assigned_to: 'me-1', customer_name: '권도윤', phone: '010-2222-3333',
            region: '경기', assigned_date: TODAY, source: '보장분석' }],
    calls: [], team_feedback: [],
    /* 대표님이 종류를 여섯 개로 바꿔 두셨다 */
    app_config: [{ key: 'db_sources', value: '일반,방송,농협,보장분석,소개,순천개척' }],
    clients: [{ id: 'c1', advisor_id: 'me-1', name_masked: '권*윤', created_at: TODAY }],
    saved_reports: [{ id: 'meta-1', client_id: 'c1', content: {
      fp: { f_job: '자영업' }, fam: '', rel: '',
      touch: [{ at: TODAY, how: '전화', note: '지난 통화' }],
      next: { what: '증권 전달', due: TODAY }, bd: '03-15', up: 1 } }]
  }));
  await p6.goto('http://127.0.0.1:' + PORT + '/app/day.html', { waitUntil: 'domcontentloaded' });
  await p6.waitForTimeout(1800);
  ok(/증권 전달/.test(await p6.locator('.c365').innerText()), '잡아 둔 다음 할 일이 카드에 보인다');
  ok(/D-/.test(await p6.locator('.c365').innerText()), '생일까지 며칠 남았는지도 보인다');
  await p6.click('.c365 .ed'); await p6.waitForTimeout(300);
  ok(await p6.locator('.cebt .dn').count() === 1, '잡아 둔 일이 있으면 「끝냈습니다」 가 뜬다');
  await p6.click('.cebt .dn'); await p6.waitForTimeout(600);
  const dn = await p6.evaluate(() => ((window.__wrote.filter(w => w.t === 'saved_reports')[0] || {}).v || {}).content || null);
  ok(!!dn && dn.next === null, '끝내면 다음 할 일이 비워진다');
  ok(dn && dn.touch[0] && dn.touch[0].how === '처리' && dn.touch[0].note === '증권 전달',
     '무엇을 끝냈는지 접촉 기록 맨 위에 남는다 — 앱의 「처리」 와 같은 모양');
  ok(dn && dn.touch.length === 2, '있던 접촉 기록은 밀려 내려갈 뿐 안 지워진다');
  ok(dn && dn.bd === '03-15', '생일은 건드리지 않는다');

  /* DB 종류 — 대표가 정한 목록을 폰이 그대로 따라가는가 */
  console.log('\nDB 종류 — 대표가 정하고 폰은 따라가기만');
  await p6.click('#tbReg'); await p6.waitForTimeout(300);
  await p6.fill('#rgTxt', '나신규 010-9999-8888');
  await p6.click('.pastebox .mini'); await p6.waitForTimeout(320);
  const srcs = await p6.locator('.rn button').allInnerTexts();
  ok(srcs.indexOf('순천개척') >= 0, '대표님이 새로 만든 종류가 폰에도 뜬다 (' + srcs.join('·') + ')');
  ok(srcs.indexOf('지인') < 0, '대표님이 안 쓰는 종류는 안 뜬다');

  /* 열둘 · 배정 DB 와 고객 365일이 한 명단에서 보이는가 */
  console.log('\n사람 — 두 표가 한 명단으로');
  const p7 = await ctx.newPage();
  p7.on('pageerror', e => errs.push('[people] ' + e.message));
  await p7.addInitScript(SB_STUB({
    __me: 'me-1', profiles: [{ name: '박서준' }], calls: [], team_feedback: [], app_config: [],
    dbs: [
      { id: 'a1', assigned_to: 'me-1', customer_name: '권도윤', phone: '010-1111-1111', region: '경기', assigned_date: TODAY },
      { id: 'a2', assigned_to: 'me-1', customer_name: '나신규', phone: '010-2222-2222', region: '서울', assigned_date: TODAY }
    ],
    clients: [
      /* 권도윤 은 양쪽에 다 있다 (가린 이름으로 만난다) */
      { id: 'c1', advisor_id: 'me-1', name_masked: '권*윤', created_at: TODAY },
      /* 오래된 계약 고객 — 배정 DB 에는 없다 */
      { id: 'c2', advisor_id: 'me-1', name_masked: '문*희', created_at: TODAY }
    ],
    saved_reports: [
      { id: 'm1', client_id: 'c1', content: { fp: {}, fam: '', rel: '', touch: [], next: { what: '증권 전달', due: TODAY }, bd: '', up: 1 } },
      { id: 'm2', client_id: 'c2', content: { fp: {}, fam: '', rel: '', touch: [], next: { what: '소개 요청', due: TODAY }, bd: '05-02', up: 1 } }
    ]
  }));
  await p7.goto('http://127.0.0.1:' + PORT + '/app/day.html', { waitUntil: 'domcontentloaded' });
  await p7.waitForTimeout(1900);
  await p7.click('#tbList'); await p7.waitForTimeout(400);
  const ls = await p7.locator('#body').innerText();
  ok(/권도윤/.test(ls) && /나신규/.test(ls), '배정 DB 사람이 보인다');
  ok(/문\*희/.test(ls), '고객 365일에만 있는 사람도 같은 명단에 보인다');
  ok(await p7.locator('.row').count() === 3, '세 사람이 선다 — 겹치는 사람은 한 줄로 합쳐진다');
  ok(await p7.locator('.row .both').count() === 1, '양쪽에 다 있는 사람에는 「🗂 365」 가 붙는다');
  ok(await p7.locator('.row .only').count() === 1, '고객 365일에만 있는 사람은 그렇다고 딱지가 붙는다');
  ok(/증권 전달/.test(ls), '합쳐진 사람 줄에 고객 365일의 다음 할 일이 같이 보인다');

  /* 고객 365일에만 있는 사람도 폰에서 고칠 수 있어야 한다 */
  await p7.click('.row .only'); await p7.waitForTimeout(350);
  ok(await p7.locator('.ce').count() === 1, '눌러서 그 자리에서 다음 할 일·생일을 고친다');
  await p7.evaluate(() => window.dCeWhat('생일 문자 보내기'));
  await p7.click('.cebt .sv'); await p7.waitForTimeout(600);
  const w7 = await p7.evaluate(() => (window.__wrote.filter(w => w.t === 'saved_reports')[0] || {}).v || null);
  ok(!!w7 && w7.content.next.what === '생일 문자 보내기', '배정 DB 에 없는 고객도 폰에서 관리된다');
  ok(w7.content.bd === '05-02', '적어 둔 생일은 그대로 남는다');

  /* 걸개 */
  await p7.evaluate(() => window.dFil('c365')); await p7.waitForTimeout(320);
  ok(await p7.locator('.row').count() === 2, '「고객 365일」 로 좁히면 그 사람들만 남는다');
  await p7.evaluate(() => window.dFil('')); await p7.waitForTimeout(250);
  await p7.evaluate(() => window.dFind('문')); await p7.waitForTimeout(400);
  ok(await p7.locator('.row').count() === 1, '고객 365일에만 있는 사람도 이름으로 찾힌다');

  /* 열셋 · 폰에서 못 하는 것은 APEX 로 넘어가는가 — 말만 하고 끝내지 않는가 */
  console.log('\nAPEX 본체로 이어지는가');
  await p7.evaluate(() => window.dFind(''));
  await p7.click('#tbToday'); await p7.waitForTimeout(400);
  ok(await p7.locator('.gogrid .gocard').count() === 6, '오늘 판 아래에 「여기서 이어서 하기」 여섯 칸이 있다');
  const cards = await p7.locator('.gogrid .gocard b').allInnerTexts();
  for (const t of ['DB 통합 CRM', '고객 365일', '상담카드·팩트파인딩', 'AI 보장분석'])
    ok(cards.indexOf(t) >= 0, '이어서 갈 곳: ' + t);
  ok(await p7.locator('.c365 .gox').count() >= 1, '고객 365일 칸에서 APEX 로 가는 단추가 붙는다');

  /* 앱 밖(폰 홈 화면)에서는 주소로 넘어간다 */
  await p7.evaluate(() => { window.__href = ''; });
  const navTo = await p7.evaluate(() => {
    /* 진짜로 넘어가면 검사를 못 이어 가므로 가는 곳만 붙잡는다 */
    const orig = Object.getOwnPropertyDescriptor(window.location, 'href');
    let got = '';
    try { window.dGo('clients'); } catch (e) { got = 'ERR'; }
    return got;
  });
  ok(navTo !== 'ERR', '눌렀을 때 오류 없이 넘어간다');
  await p7.waitForTimeout(500);
  ok(/\?go=clients/.test(p7.url()), 'APEX 의 고객 365일 판으로 바로 열린다 (' + p7.url().split('/').pop() + ')');

  /* 앱 안(iframe)이면 부모에게 열라고 한다 — 새 창이 뜨지 않는다 */
  const p8 = await ctx.newPage();
  await p8.goto('http://127.0.0.1:' + PORT + '/scripts/lib-frame.html', { waitUntil: 'domcontentloaded' });
  await p8.waitForTimeout(1800);
  const asked = await p8.evaluate(() => {
    const w = document.getElementById('f').contentWindow;
    w.dGo('crm');
    return window.__went;
  });
  ok(asked === 'crm', '앱 안에서는 부모에게 「crm 을 열어라」 고 말한다 — 새로 뜨지 않는다');

  /* 홈 화면에 담기 — 맨 위 붙박이. 링크로 받은 사람이 제일 먼저 봐야 하는 것 */
  console.log('\n홈 화면에 추가 — 맨 위 붙박이');
  const pinPage = await ctx.newPage();
  await pinPage.goto('http://127.0.0.1:' + PORT + '/app/day.html', { waitUntil: 'domcontentloaded' });
  await pinPage.waitForTimeout(1200);
  ok(await pinPage.locator('#pin:not([hidden])').count() === 1, '브라우저로 열면 맨 위에 뜬다');
  const pinTxt = await pinPage.locator('#pin').innerText();
  ok(/홈 화면에 추가/.test(pinTxt), '무엇을 하라는지 한 줄로 말한다');
  ok(/Safari/.test(pinTxt) && /안드로이드/.test(pinTxt), '아이폰·안드로이드 두 길을 다 적는다');
  ok(/반드시 Safari/.test(pinTxt), '아이폰은 크롬으로 안 된다고 못박는다 — 제일 많이 막히는 자리');
  /* 화면을 끝까지 내려도 그 자리에 있어야 한다 */
  const pinY0 = await pinPage.locator('#pin').boundingBox();
  await pinPage.evaluate(() => { const b = document.getElementById('body'); b.scrollTop = b.scrollHeight; });
  await pinPage.waitForTimeout(300);
  const pinY1 = await pinPage.locator('#pin').boundingBox();
  ok(pinY0 && pinY1 && Math.abs(pinY0.y - pinY1.y) < 2, '끝까지 내려도 안 사라진다 — 붙박이다');
  /* 접었다 폈다 */
  await pinPage.click('#pinH'); await pinPage.waitForTimeout(200);
  ok(await pinPage.locator('#pinB[hidden]').count() === 1, '눌러서 접을 수 있다 — 자리를 계속 먹지 않는다');
  await pinPage.click('#pinH'); await pinPage.waitForTimeout(200);
  ok(await pinPage.locator('#pinB:not([hidden])').count() === 1, '다시 눌러 펴진다');

  /* 이미 담아서 앱처럼 열고 있으면 뜨지 않는다 */
  const inst = await ctx.newPage();
  await inst.addInitScript(() => {
    const m = window.matchMedia.bind(window);
    window.matchMedia = q => (/standalone/.test(q) ? { matches: true, media: q, addListener() { }, removeListener() { } } : m(q));
  });
  await inst.goto('http://127.0.0.1:' + PORT + '/app/day.html', { waitUntil: 'domcontentloaded' });
  await inst.waitForTimeout(1000);
  ok(await inst.locator('#pin:not([hidden])').count() === 0, '이미 담은 사람에게는 안 뜬다 — 다 한 일을 또 시키지 않는다');

  console.log('\n오류');
  ok(errs.length === 0, '화면이 도는 동안 오류가 없다' + (errs.length ? ' — ' + errs.slice(0, 3).join(' / ') : ''));

  await browser.close(); srv.close();
  if (fail.length) { console.log('\n✗ ' + fail.length + '건\n' + fail.map(x => '  · ' + x).join('\n')); process.exit(1); }
  console.log('\n하루 한 장 — 폰에서 한 장으로 끝나고, 그 한 줄이 CRM 모양 그대로입니다.');
})().catch(e => { console.error(e); try { srv.close(); } catch (x) { } process.exit(1); });
