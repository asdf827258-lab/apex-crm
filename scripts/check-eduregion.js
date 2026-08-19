/* 교육자금 — 지자체 지원금을 손으로 적게 하지 않는다.

   여태는 팀원이 시·도와 시·군·구를 <b>글자로 직접</b> 적었다. 그러면
   사람마다 다른 값을 쓰고, 누가 언제 확인한 값인지 아무도 모른다.
   금액이 비면 0 으로 채워져 「지원금이 없는 지역」이 되어 버리기도 했다.

   그래서 전국 시·군·구 뼈대를 파일로 미리 깔고, 화면에서는 <b>고르기만</b> 한다.
   금액마다 <b>확인일자와 출처</b>를 함께 남기고, 반년이 지나면 경고한다.

   여기서 확인한다.

     1. 전국 시·도 17 · 시·군·구 229 가 다 있는가
     2. 시·도를 고르면 그 시·군·구만 나오는가
     3. 금액이 없는 지역을 <b>0 으로 채우지 않는가</b> (「모른다」와 「없다」는 다르다)
     4. 팀 취합본이 파일 위를 덮는가
     5. 반년이 지난 값에 경고가 뜨는가
     6. 파일을 못 읽어도 화면이 안 무너지는가                          */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
let breakJson = false;
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  /* 배포 규칙 흉내 — 없는 주소도 200 으로 앱 HTML 을 돌려준다.
     그 자리에서 r.json() 을 부르면 조용히 터진다. 그걸 견디는지 본다. */
  if (breakJson && /edu-regions\.json$/.test(p)) {
    rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    rs.end('<!doctype html><html><body>앱 화면</body></html>'); return;
  }
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const PAGE = '/app/' + encodeURIComponent('상담자료') + '/' + encodeURIComponent('통합상담_APEX.html');

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto(base + PAGE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n[1] 전국이 다 들어 있다');
  const all = await page.evaluate(() => {
    const R = window.__apexE.regions();
    const cnt = {};
    (R.file ? R.file.regions : []).forEach(r => { cnt[r.sido] = (cnt[r.sido] || 0) + 1; });
    return { n: R.file ? R.file.regions.length : 0, sido: R.sido.length, cnt,
             warn: R.warnDays, meta: R.file ? R.file.meta : null };
  });
  is(all.sido === 17, '  시·도 17개 (나온 값 ' + all.sido + ')');
  is(all.n === 229, '  시·군·구 229개 (나온 값 ' + all.n + ')');
  [['서울특별시', 25], ['경기도', 31], ['전라남도', 22], ['경상북도', 22], ['제주특별자치도', 2],
   ['세종특별자치시', 1]].forEach(([k, v]) =>
    is(all.cnt[k] === v, '    ' + k + ' ' + v + '개 (나온 값 ' + all.cnt[k] + ')'));
  is(all.warn === 180, '  반년(180일)이 지나면 경고한다');
  is(!!(all.meta && all.meta.sources && all.meta.sources.length), '  어디서 확인하는지 출처를 적어 두었다');

  console.log('\n[2] 시·도를 고르면 그 시·군·구만 나온다');
  const pick = await page.evaluate(async () => {
    const sd = document.getElementById('rgSido'), gu = document.getElementById('rgGu');
    sd.value = '전라남도'; sd.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 80));
    const names = Array.from(gu.options).map(o => o.value).filter(Boolean);
    return { n: names.length, has: names.indexOf('해남군') >= 0, no: names.indexOf('종로구') >= 0 };
  });
  is(pick.n === 22, '  전라남도 → 22개 (나온 값 ' + pick.n + ')');
  is(pick.has, '  해남군이 있다');
  is(!pick.no, '  다른 시·도 것이 섞이지 않는다');

  console.log('\n[3] 자료 없는 지역을 0 으로 채우지 않는다');
  const none = await page.evaluate(async () => {
    window.__apexE.set({ local: 555 });
    const gu = document.getElementById('rgGu');
    gu.value = '해남군'; gu.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 80));
    return { local: window.__apexE.get().local,
             box: document.getElementById('rgPickState').textContent.replace(/\s+/g, ' ') };
  });
  is(none.local === 555, '  고른 것만으로 지자체 지원금 칸을 건드리지 않는다 (' + none.local + ')');
  is(/자료 없음/.test(none.box), '  「자료 없음」 이라고 적는다');
  is(/모른다.*없다|0 으로 잡지 않습니다/.test(none.box), '  「모른다」와 「없다」가 다르다고 말한다');

  console.log('\n[4] 팀 취합본이 파일 위를 덮는다');
  const mine = await page.evaluate(async () => {
    window.__apexE.regionSave([{ sido: '전라남도', gu: '해남군', amt: '720', memo: '첫째 기준·분할지급' }],
                              new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10));
    const sd = document.getElementById('rgSido'), gu = document.getElementById('rgGu');
    sd.value = '전라남도'; sd.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 80));
    gu.value = '해남군'; gu.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 80));
    return { local: window.__apexE.get().local,
             box: document.getElementById('rgPickState').textContent.replace(/\s+/g, ' '),
             opt: Array.from(gu.options).find(o => o.value === '해남군').textContent };
  });
  is(mine.local === 720, '  취합본 값이 계산에 들어간다 (' + mine.local + '만원)');
  is(/720/.test(mine.opt), '  고르는 칸에도 금액이 보인다');
  is(/우리 팀 취합본/.test(mine.box), '  우리 팀이 채운 값이라고 표시한다');
  is(/첫째 기준/.test(mine.box), '  조건 메모도 함께 보인다');

  console.log('\n[5] 반년이 지난 값에 경고가 뜬다');
  const old = await page.evaluate(async () => {
    window.__apexE.regionSave([{ sido: '전라남도', gu: '해남군', amt: '720' }], '2025-01-01');
    const gu = document.getElementById('rgGu');
    gu.value = '해남군'; gu.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 80));
    return document.getElementById('rgPickState').textContent.replace(/\s+/g, ' ');
  });
  is(/⚠️|다시 확인/.test(old), '  오래된 값에 경고가 붙는다');
  is(/2025-01-01/.test(old), '  언제 확인한 값인지 적는다');
  is(/해마다 바뀝니다/.test(old), '  왜 다시 확인해야 하는지 말한다');

  console.log('\n[6] 파일을 못 읽어도 안 무너진다');
  breakJson = true;
  const p2 = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const e2 = []; p2.on('pageerror', e => e2.push(String(e).slice(0, 160)));
  await p2.goto(base + PAGE, { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(2600);
  const broke = await p2.evaluate(() => ({
    note: (document.getElementById('rgPickNote').textContent || '').replace(/\s+/g, ' '),
    table: !!document.getElementById('rgTable'),
    edu: !!document.getElementById('eRes').textContent.trim()
  }));
  is(e2.length === 0, '  터지지 않는다' + (e2.length ? ' — ' + e2[0] : ''));
  is(/읽지 못했습니다/.test(broke.note), '  못 읽었다고 화면에 적는다');
  is(broke.table, '  손으로 채우는 표는 그대로 있다 — 없애지 않았다');
  is(broke.edu, '  교육자금 계산은 그대로 돈다');
  await p2.close();
  breakJson = false;

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '지역 지원금 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '지역 지원금 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
