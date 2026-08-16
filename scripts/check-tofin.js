/* 팩트파인딩 답변이 계산기 사이드바로 <b>저절로</b> 넘어가는가.

   다리는 놓여 있었지만 사람이 단추를 눌러야 건너갔다. 상담자료에서
   스물여섯 칸을 다 물어 놓고 계산기로 넘어오면 사이드바가 비어 있었고,
   그러면 고객 앞에서 같은 것을 두 번 묻는다.

   그리고 넣는 쪽도 시간을 재서 밀어 넣고 있었다. 계산기 파일은 크고
   느린 회선에서는 몇 초씩 걸린다. 그 사이에 넣으면 빈 문서로 날아가
   사라진다. 이제 계산기가 「준비됐다」고 알릴 때 넣는다.

   여기서 확인한다.

     1. 상담자료를 안 열었으면 아무 일도 안 하는가
     2. 상담자료에 적고 계산기를 열면 사이드바가 채워지는가 — 안 누르고
     3. 상담자료가 계산기를 덮고 있지 않은가
     4. 계산기에서 고친 값을 소리 없이 되돌리지 않는가
     5. 상담자료에 새로 적으면 그건 따라오는가                       */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* 틀은 요소에서 직접 얻는다 — page.frames() 는 옛 문서를 물고 있을 때가 있다 */
async function frameOf(page, id) {
  const el = await page.$('#' + id);
  if (!el) return null;
  try { return await el.contentFrame(); } catch (e) { return null; }
}
/* 틀 안에 그 칸이 생길 때까지 기다린다 — 파일이 커서 몇 초씩 걸린다.
   시간을 정해 놓고 재면 느린 날 그대로 빨간불이 된다.               */
async function waitInFrame(page, id, probe, ms) {
  const until = Date.now() + (ms || 45000);
  while (Date.now() < until) {
    const fr = await frameOf(page, id);
    if (fr) {
      try { if (await fr.evaluate(probe)) return fr; } catch (e) { /* 아직 갈아타는 중 */ }
    }
    await sleep(400);
  }
  return null;
}
async function readSide(page, ids) {
  const fr = await frameOf(page, 'finFrame');
  if (!fr) return null;
  try {
    return await fr.evaluate(list => {
      const o = {};
      list.forEach(k => { const e = document.getElementById(k); o[k] = e ? e.value : null; });
      return o;
    }, ids);
  } catch (e) { return null; }
}
async function fillDeck(page, vals) {
  const fr = await frameOf(page, 'fpDeckFrame');
  if (!fr) return false;
  await fr.evaluate(v => {
    Object.keys(v).forEach(k => {
      const e = document.getElementById(k); if (!e) return;
      e.value = v[k];
      try { e.dispatchEvent(new Event('input', { bubbles: true })); } catch (x) {}
      try { e.dispatchEvent(new Event('change', { bubbles: true })); } catch (x) {}
    });
  }, vals);
  return true;
}

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));

  await page.goto(base + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  /* 계산기는 아무나 못 연다 — 대표로 들어와 있을 때를 본다 */
  await page.evaluate(() => { OS.profile = OS.profile || {}; OS.profile.role = 'owner'; });

  console.log('\n[1] 상담자료를 안 열었으면 아무 일도 안 한다');
  const quiet = await page.evaluate(() => {
    let threw = false;
    try { osAutoToFin(); } catch (e) { threw = true; }
    return { threw, mounted: !!(document.getElementById('fpDeckFrame') || {})._mounted };
  });
  is(!quiet.threw, '안 열린 채로 불러도 안 터진다');
  is(!quiet.mounted, '상담자료 틀이 아직 안 물려 있다');

  console.log('\n[2] 상담자료에 적고 계산기를 열면 — 단추를 안 눌러도');
  await page.evaluate(() => { go('fp_deck'); fpDeckOpen(); });
  const deck = await waitInFrame(page, 'fpDeckFrame', () => typeof window.apexToFin === 'function');
  is(!!deck, '상담자료가 다 떴다 (앱과 이어지는 다리까지)');
  if (!deck) { await browser.close(); srv.close(); process.exit(1); }

  is(await fillDeck(page, { f_name: '홍길동', f_age: '47', f_job: '자영업', f_income: '620',
                            f_ret: '62', f_retspend: '410', f_np: '155' }),
     '상담자료 팩트파인딩에 적었다');

  await page.evaluate(() => go('finance'));
  const fin = await waitInFrame(page, 'finFrame', () => !!document.getElementById('s_name'));
  is(!!fin, '계산기가 다 떴다');
  await sleep(2400);        /* 「준비됐다」 를 듣고 값이 들어갈 짬 */
  const got = await readSide(page, ['s_name', 's_age', 's_job', 's_gross', 's_rage', 's_target', 's_nps']);
  is(!!got, '계산기 사이드바를 읽었다');
  if (got) {
    is(got.s_name === '홍길동', '이름이 넘어왔다 — ' + got.s_name);
    is(got.s_age === '47', '나이가 넘어왔다 — ' + got.s_age);
    is(got.s_job === '자영업', '직업이 넘어왔다 — ' + got.s_job);
    is(got.s_gross === '7440', '월소득 620 → 연 총급여 7,440 으로 바뀌어 넘어왔다 — ' + got.s_gross);
    is(got.s_rage === '62', '은퇴 희망나이가 넘어왔다 — ' + got.s_rage);
    is(got.s_target === '410', '은퇴 후 생활비가 넘어왔다 — ' + got.s_target);
    is(got.s_nps === '155', '국민연금 예상액이 넘어왔다 — ' + got.s_nps);
  }

  console.log('\n[3] 상담자료가 계산기를 덮고 있지 않다');
  const mode = await page.evaluate(() => document.body.className);
  is(/finance-mode/.test(mode), '계산기 화면이 켜져 있다 — ' + mode);
  is(!/fpdeck-mode/.test(mode), '상담자료 화면은 꺼져 있다');

  console.log('\n[4] 계산기에서 고친 값을 소리 없이 되돌리지 않는다');
  await fin.evaluate(() => {
    const e = document.getElementById('s_age');
    if (e) { e.value = '55'; e.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await page.evaluate(() => go('home'));
  await sleep(600);
  await page.evaluate(() => go('finance'));
  await sleep(2800);
  const again = await readSide(page, ['s_age']);
  is(again && again.s_age === '55',
     '계산기에서 55 로 고친 것이 그대로 있다 — ' + (again ? again.s_age : '못 읽음'));

  console.log('\n[5] 상담자료에 새로 적으면 그건 따라온다');
  await page.evaluate(() => { go('fp_deck'); fpDeckOpen(); });
  await sleep(900);
  is(await fillDeck(page, { f_age: '51', f_retspend: '480' }), '상담자료에 새 값을 적었다');
  await page.evaluate(() => go('finance'));
  await sleep(3400);
  const fresh = await readSide(page, ['s_age', 's_target']);
  is(fresh && fresh.s_age === '51', '새로 적은 나이가 따라왔다 — ' + (fresh ? fresh.s_age : '?'));
  is(fresh && fresh.s_target === '480', '새로 적은 생활비가 따라왔다 — ' + (fresh ? fresh.s_target : '?'));

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '팩트파인딩 → 계산기 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '팩트파인딩 → 계산기 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
