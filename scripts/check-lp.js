/* 보장분석 신청 홈페이지 — 신청이 조용히 사라지지 않는가.

   이 페이지는 광고비가 떨어지는 자리다. 앱과 달리 고치는 사람이
   옆에 없고, 들어온 사람은 한 번 튕기면 다시 안 온다.
   그래서 여기서 확인하는 것은 화면이 예쁜지가 아니라 이것이다.

     1. 점검표에서 고른 항목이 폼까지 따라 들어간다
        — 고객이 같은 말을 두 번 적지 않는다
     2. 동의 없이는 접수되지 않는다 — 그리고 왜 안 되는지 말해 준다
     3. 동의 전에는 고객 자료가 한 글자도 밖으로 안 나간다
     4. 서버 설정이 없거나 저장이 실패해도 화면이 조용하지 않다
        — 「접수됐다」 고 거짓말하지 않고, 다른 연락 방법을 준다
     5. 자동 등록(봇)은 접수되지 않는다
     6. 광고 소재 번호(utm)가 신청과 함께 저장된다
        — 어느 소재가 계약까지 갔는지 나중에 못 세면 광고를 못 줄인다   */

const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8831;
const PAGE = '/보장분석/index.html';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

/* 밖으로 나가는 supabase 를 흉내 낸다. 진짜로 보내지 않고, 무엇을 보내려 했는지만 적어 둔다.
   window.__fail 을 켜면 저장이 실패하는 서버가 된다. */
const STUB = `
window.__sent = [];
window.__fail = false;
window.supabase = { createClient: function(){
  return { from: function(){ return { insert: function(row){
    window.__sent.push(row);
    return Promise.resolve(window.__fail ? { error: { message: 'boom' } } : { error: null });
  } }; } };
} };
`;

/* 서버 주소는 페이지가 다 뜬 뒤에 넣는다.
   config.js 가 나중에 읽히면서 먼저 넣어 둔 값을 덮어쓰기 때문이다.
   페이지는 누를 때 이 값을 읽으므로 이 순서로 넣어도 늦지 않다. */
const CONFIG = () => { window.APEX_CONFIG = { url: 'https://stub.supabase.co', key: 'stub-anon-key' }; };

let fails = 0;
const ok = (cond, label) => { console.log((cond ? '  ✓ ' : '  ✗ ') + label); if (!cond) fails++; };

async function open(browser, { stub = true, query = '' } = {}) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  /* 외부 CDN 은 타지 않는다 — 인터넷이 없어도 이 검사는 돌아야 한다 */
  await page.route('**/cdn.jsdelivr.net/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  /* 배포 전 상태를 흉내 낸다 — config.js 가 자리표시 그대로인 경우 */
  await page.route('**/config.js', r => r.fulfill({ status: 200, contentType: 'application/javascript',
    body: 'window.APEX_CONFIG={url:"YOUR_PROJECT_URL",key:"YOUR_ANON_OR_PUBLISHABLE_KEY"};' }));
  if (stub) await page.addInitScript(STUB);
  await page.goto('http://localhost:' + PORT + encodeURI(PAGE) + query, { waitUntil: 'domcontentloaded' });
  if (stub) await page.evaluate(CONFIG);
  return page;
}

/* 첫 화면 점검표에서 앞의 n 개를 고른다 */
async function answer(page, n = 3) {
  const items = await page.$$('#pass .chk');
  for (let i = 0; i < Math.min(n, items.length); i++) await items[i].click();
}

(async () => {
  const browser = await chromium.launch();
  try {
    /* ── 1. 점검표가 폼까지 이어진다 ── */
    console.log('\n1. 점검표 → 폼');
    {
      const page = await open(browser);
      await answer(page, 3);
      const on = await page.$$eval('#pass .chk[aria-pressed="true"]', els => els.length);
      ok(on === 3, '고른 3개가 눌린 상태로 남는다 (' + on + '개)');

      ok(await page.isVisible('#result'), '신청서 위에 고른 결과가 나온다');
      ok((await page.textContent('#ringTxt')) === '3/6', '진행 고리가 3/6 을 가리킨다');
      ok((await page.textContent('#heroCta')).includes('3가지'), '첫 화면 버튼이 고른 수를 말한다');

      const picked = await page.inputValue('#f_gaps');
      ok(picked.split(',').length === 3 && picked.includes('지인 권유로 가입'),
        '고른 항목이 신청서에 자동으로 들어간다 (' + picked + ')');

      /* 다시 누르면 빠진다 — 잘못 누른 것을 되돌릴 수 있어야 한다 */
      await (await page.$$('#pass .chk'))[0].click();
      const after = await page.inputValue('#f_gaps');
      ok(!after.includes('지인 권유로 가입') && after.split(',').length === 2,
        '다시 누르면 선택이 풀린다 (' + after + ')');
      await page.close();
    }

    /* ── 1-2. 첫 화면 안에 점검표가 다 들어온다 ──
       광고로 들어온 사람은 스크롤하기 전에 판단한다.
       여섯 문항과 누를 버튼이 첫 화면 밖으로 밀리면 그 자리에서 나간다. */
    console.log('\n1-2. 첫 화면에 다 들어오는가');
    {
      for (const [w, h, name] of [[390, 844, 'iPhone 14'], [360, 780, '갤럭시 · 작은 화면']]) {
        const page = await browser.newPage({ viewport: { width: w, height: h } });
        await page.route('**/cdn.jsdelivr.net/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
        await page.goto('http://localhost:' + PORT + encodeURI(PAGE), { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(400);
        const bottom = await page.$eval('#heroCta', el => el.getBoundingClientRect().bottom);
        ok(bottom <= h, name + ' — 여섯 문항과 버튼이 첫 화면 안에 들어온다 (' + Math.round(bottom) + '/' + h + 'px)');
        await page.close();
      }
    }

    /* ── 2. 동의 없이는 접수되지 않는다 ── */
    console.log('\n2. 동의 없이 제출');
    {
      const page = await open(browser);
      await page.fill('#f_name', '홍길동');
      await page.fill('#f_phone', '010-1234-5678');
      await page.click('#submitBtn');
      await page.waitForTimeout(200);
      const sent = await page.evaluate(() => window.__sent.length);
      ok(sent === 0, '동의 전에는 고객 자료가 한 글자도 밖으로 안 나간다');
      const msg = (await page.textContent('#formMsg')) || '';
      ok(msg.includes('동의'), '왜 안 되는지 말해 준다 — "' + msg.trim().slice(0, 40) + '"');
      await page.close();
    }

    /* ── 3. 이름·번호가 비면 막는다 ── */
    console.log('\n3. 빈 칸으로 제출');
    {
      const page = await open(browser);
      await page.check('#c_privacy');
      await page.click('#submitBtn');
      await page.waitForTimeout(150);
      ok((await page.evaluate(() => window.__sent.length)) === 0, '이름 없이 접수되지 않는다');

      await page.fill('#f_name', '홍길동');
      await page.fill('#f_phone', '010');
      await page.click('#submitBtn');
      await page.waitForTimeout(150);
      ok((await page.evaluate(() => window.__sent.length)) === 0, '번호가 짧으면 접수되지 않는다');
      await page.close();
    }

    /* ── 4. 제대로 채우면 접수되고, 광고 소재가 함께 남는다 ── */
    console.log('\n4. 정상 신청');
    {
      const page = await open(browser, { query: '?utm_source=meta&utm_medium=paid_social&utm_content=03' });
      await answer(page, 3);
      await page.fill('#f_name', '홍길동');
      await page.fill('#f_phone', '010-1234-5678');
      await page.fill('#f_memo', '갱신형이 계속 오릅니다');
      await page.check('#c_privacy');
      await page.check('#c_lookup');
      await page.click('#submitBtn');
      await page.waitForTimeout(300);

      const rows = await page.evaluate(() => window.__sent);
      ok(rows.length === 1, '신청이 한 번만 접수된다');
      const r = rows[0] || {};
      ok(r.customer_name === '홍길동' && r.phone === '010-1234-5678', '이름·연락처가 그대로 간다');
      ok(r.consent_privacy === true && r.consent_lookup === true, '동의 두 개가 기록된다');
      ok(r.source === '보장분석-홈페이지', 'DB 종류가 붙는다 (' + r.source + ')');
      ok(r.utm_source === 'meta' && r.utm_content === '03', '광고 소재 번호가 함께 저장된다 (utm_content=' + r.utm_content + ')');
      ok(typeof r.checked_items === 'string' && r.checked_items.length > 0, '고른 항목도 같이 넘어간다 (' + r.checked_items + ')');

      const msg = (await page.textContent('#formMsg')) || '';
      ok(msg.includes('접수되었습니다'), '접수됐다고 알려 준다');
      ok(await page.isDisabled('#submitBtn'), '두 번 눌러도 두 번 접수되지 않는다');
      await page.close();
    }

    /* ── 5. 저장이 실패해도 조용하지 않다 ── */
    console.log('\n5. 서버가 실패할 때');
    {
      const page = await open(browser);
      await page.evaluate(() => { window.__fail = true; });
      await page.fill('#f_name', '홍길동');
      await page.fill('#f_phone', '010-1234-5678');
      await page.check('#c_privacy');
      await page.click('#submitBtn');
      await page.waitForTimeout(300);
      const msg = (await page.textContent('#formMsg')) || '';
      ok(!msg.includes('접수되었습니다'), '실패했는데 접수됐다고 거짓말하지 않는다');
      ok(msg.includes('실패') || msg.includes('다시'), '다시 하라고 알려 준다');
      ok(!(await page.isDisabled('#submitBtn')), '다시 누를 수 있다');
      await page.close();
    }

    /* ── 6. 서버 설정이 아예 없을 때 ── */
    console.log('\n6. 서버 설정이 없을 때');
    {
      const page = await open(browser, { stub: false });
      await page.fill('#f_name', '홍길동');
      await page.fill('#f_phone', '010-1234-5678');
      await page.check('#c_privacy');
      await page.click('#submitBtn');
      await page.waitForTimeout(200);
      const msg = (await page.textContent('#formMsg')) || '';
      ok(msg.trim().length > 0 && !msg.includes('접수되었습니다'),
        '설정이 없으면 신청이 사라지지 않고 안내가 뜬다 — "' + msg.trim().slice(0, 40) + '"');
      await page.close();
    }

    /* ── 7. 자동 등록(봇) ── */
    console.log('\n7. 봇이 넣을 때');
    {
      const page = await open(browser);
      await page.fill('#f_name', '봇');
      await page.fill('#f_phone', '010-0000-0000');
      await page.check('#c_privacy');
      await page.evaluate(() => { document.getElementById('f_web').value = 'http://spam.example'; });
      await page.click('#submitBtn');
      await page.waitForTimeout(200);
      ok((await page.evaluate(() => window.__sent.length)) === 0, '숨은 칸이 채워져 있으면 접수되지 않는다');
      await page.close();
    }

    /* ── 8. 준법 문구가 화면에 있다 ── */
    console.log('\n8. 준법 문구');
    {
      const page = await open(browser);
      const foot = (await page.textContent('footer')) || '';
      ok(foot.includes('광고심의필'), '광고심의필 자리가 있다');
      ok(foot.includes('보장하지 않습니다'), '보장 안 함 고지가 있다');
      ok(foot.includes('대리·중개업자'), '계약 체결권 고지가 있다');
      const consent = (await page.textContent('.consent')) || '';
      ok(consent.includes('수집항목') && consent.includes('보유기간'), '개인정보 수집 고지가 폼 옆에 있다');
      await page.close();
    }

  } catch (e) {
    console.log('\n✗ 검사 도중 멈춤 — ' + e.message);
    fails++;
  } finally {
    await browser.close();
    srv.close();
  }

  console.log(fails ? `\n✗ ${fails} 개 실패` : '\n✓ 보장분석 신청 홈페이지 — 전부 통과');
  process.exit(fails ? 1 : 0);
})();
