/* 🔥 <b>TA 첫 화제</b> — 요즘 고객이 관심 갖는 이야기로 먼저 연다
   (2026-10-11 사장님 말씀 「ta할때 요즘 투렌드로 고객이 좋아하고 관심있을 주제로 먼저 던져줘」)

   못 박는 것 —
     ① 화제는 ta-trend.js <b>한 곳</b>에 있고 ta-script.html 이 그것을 읽는다 (5번)
     ② 화제마다 출처(제목·낸 곳·날짜·주소)가 있다 — 블로그·광고 글이 아니다 (9번)
     ③ 첫 마디 · 잇는 말에 <b>숫자가 없다</b> — 할인율·한도·나이를 외워 말하지 않는다 (1번·2번)
     ④ 첫 마디 · 잇는 말에 「갈아타세요」 같은 권유가 없다 · 피해야 할 표현이 같이 선다
     ⑤ 고르면 대본의 <b>자기소개 바로 앞</b>(② 첫 줄)에 그 한마디가 들어간다 — 2026-10-14 새 TA 스크립트
     ⑥ 「화제 없이」 를 고르면 안 들어가고, 다시 열어도 그 선택이 남는다
     ⑦ 화재보험(NS) 문의 대본에는 넣지 않는다 — 상품 문의 전화라 화제가 끼면 어색하다
     ⑧ 화제가 낡으면(asOf 에서 stale 일 지남) 화면이 그렇게 말한다
     ⑨ 화제 파일을 못 실으면 지어내지 않고 못 읽었다고 말한다 (1번)                         */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9143;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const TA = fs.readFileSync(path.join(ROOT, 'ta-script.html'), 'utf8');
global.window = global; require(path.join(ROOT, 'ta-trend.js'));
const T = global.TA_TREND;

console.log('\n[1] 한 곳');
is(/<script src="ta-trend\.js"><\/script>/.test(TA), 'ta-script.html 이 ta-trend.js 를 읽는다');
is(/window\.TA_TREND/.test(TA) && !/open:\s*'/.test(TA), 'ta-script.html 은 화제 글을 따로 적지 않는다 — 표를 읽기만 한다');
const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const copied = (T.list || []).filter(t => IDX.indexOf(t.open) >= 0).map(t => t.key);
is(copied.length === 0, '본체에 화제 글을 옮겨 적지 않았다' + (copied.length ? ' ← ' + copied.join(',') : ''));

console.log('\n[2] 출처 (9번)');
is(/^\d{4}-\d{2}-\d{2}$/.test(T.asOf) && T.stale > 0, '기준일(asOf)과 낡는 날수(stale)가 있다 — ' + T.asOf + ' · ' + T.stale + '일');
is((T.list || []).length >= 4, '화제가 ' + (T.list || []).length + '가지 있다');
const srcBad = [];
(T.list || []).forEach(t => (t.src || []).forEach(s => {
  if (!s.t || !s.o || !/^\d{4}-\d{2}-\d{2}$/.test(s.d) || !/^https:\/\//.test(s.u)) srcBad.push(t.key + ' 칸 빠짐');
  if (/blog|tistory|brunch|cafe\.naver|post\.naver/i.test(s.u)) srcBad.push(t.key + ' 블로그');
  if (s.d > T.asOf) srcBad.push(t.key + ' 기준일보다 뒤 날짜');
}));
is((T.list || []).every(t => (t.src || []).length >= 1) && srcBad.length === 0, '화제마다 출처(제목·낸 곳·날짜·주소)가 있고 블로그가 아니다' + (srcBad.length ? ' ← ' + srcBad.join(', ') : ''));

console.log('\n[3] 첫 마디가 지키는 것 (1번·2번)');
/* ⚠ 「5세대 실손」 의 5 는 <b>상품 이름</b>이지 외워 말하는 수(할인율·한도·나이)가 아닙니다 —
   그 꼴(숫자+세대)만 떼고 잽니다. 헛것을 잡는 자는 안 잡는 자보다 나쁩니다 (8번). */
const digit = (T.list || []).filter(t => /[0-9０-９]/.test((t.open + t.bridge).replace(/[0-9]세대/g, ''))).map(t => t.key);
is(digit.length === 0, '첫 마디 · 잇는 말에 숫자가 없다' + (digit.length ? ' ← ' + digit.join(',') : ''));
const push = (T.list || []).filter(t => /갈아타|바꾸세요|바꾸셔야|무조건|꼭 드세요|가입하세요/.test(t.open + t.bridge)).map(t => t.key);
is(push.length === 0, '첫 마디 · 잇는 말에 권유(갈아타세요·무조건) 가 없다' + (push.length ? ' ← ' + push.join(',') : ''));
is((T.list || []).every(t => t.avoid && t.st && t.ic && t.t), '화제마다 피해야 할 표현 · 상태가 같이 있다');

const srv = http.createServer((q, s) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end(''); return; }
  s.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(s);
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.fulfill({ status: 200, body: '' }));
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    const U = 'http://127.0.0.1:' + PORT + '/ta-script.html';
    await p.goto(U, { waitUntil: 'load' });
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(300);

    console.log('\n[4] 대본에 들어가나');
    /* 2026-10-14 — TA 스크립트를 새 화면(5단계 연속 대본)으로 바꿨습니다. 화제는 ② 자기소개 바로 앞 첫 줄에 섭니다.
       고르는 단추는 그대로 .trend-tab[data-key] (홈 점검 check-hmtrend 도 이 단추를 누릅니다). */
    const 둘째 = () => { const e = document.querySelector('#script .st.c2 .me'); return e ? e.textContent : ''; };
    const 대본 = () => document.getElementById('script').textContent;
    const r1 = await p.evaluate((둘째src) => {
      const 둘째 = eval(둘째src);
      TA_APP.setDB('analysis1');
      const t = TA_TREND.list[0];
      document.querySelector('.trend-tab[data-key="' + t.key + '"]').click();
      return { s2: 둘째(), all: document.getElementById('script').textContent, open: t.open, bridge: t.bridge,
               tabs: document.querySelectorAll('.trend-tab').length, n: TA_TREND.list.length,
               intro: document.getElementById('script').textContent.indexOf('지역 담당') };
    }, '(' + 둘째.toString() + ')');
    is(r1.tabs === r1.n + 1, '화제 ' + r1.n + '가지 + 「화제 없이」 단추가 선다');
    is(r1.s2.indexOf(r1.open) >= 0 && r1.s2.indexOf(r1.bridge) >= 0, '② 첫 줄이 그 화제의 첫 마디 + 잇는 말이다');
    is(r1.all.indexOf(r1.open) >= 0 && r1.all.indexOf(r1.open) < r1.intro, '자기소개보다 <b>앞</b>에 선다 (인사 다음 한마디)');

    const r2 = await p.evaluate((src) => {
      document.querySelector('.trend-tab[data-key="' + TA_TREND.list[2].key + '"]').click();
      const a = document.getElementById('script').textContent;
      return { has2: a.indexOf(TA_TREND.list[2].open) >= 0, has0: a.indexOf(TA_TREND.list[0].open) >= 0 };
    });
    is(r2.has2 && !r2.has0, '다른 화제를 누르면 대본도 그 화제로 바뀐다');

    const r3 = await p.evaluate(() => {
      document.querySelector('.trend-tab[data-key="none"]').click();
      const a = document.getElementById('script').textContent;
      return TA_TREND.list.some(t => a.indexOf(t.open) >= 0);
    });
    is(r3 === false, '「화제 없이」 면 대본에 화제가 안 들어간다');
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(300);
    const r4 = await p.evaluate(() => { TA_APP.setDB('analysis1');
      const a = document.getElementById('script').textContent;
      return { on: (document.querySelector('.trend-tab.active') || {}).dataset.key, has: TA_TREND.list.some(t => a.indexOf(t.open) >= 0) }; });
    is(r4.on === 'none' && !r4.has, '다시 열어도 「화제 없이」 선택이 남는다');

    console.log('\n[5] 화재보험 대본 · 낡음');
    const r5 = await p.evaluate(() => {
      document.querySelector('.trend-tab[data-key="' + TA_TREND.list[0].key + '"]').click();
      TA_APP.setDB('ns');
      const a = document.getElementById('script').textContent;
      return TA_TREND.list.some(t => a.indexOf(t.open) >= 0);
    });
    is(r5 === false, '화재보험(NS) 문의 대본에는 화제를 넣지 않는다');
    const r6 = await p.evaluate(() => {
      const keep = TA_TREND.asOf;
      const d = new Date(); d.setDate(d.getDate() - TA_TREND.stale - 5);
      TA_TREND.asOf = d.toISOString().slice(0, 10); TA_APP.render();
      const stale = document.getElementById('trendStale');
      const out = { on: stale.classList.contains('show'), t: stale.textContent };
      TA_TREND.asOf = keep; TA_APP.render();
      return out;
    });
    is(r6.on && /지났습니다/.test(r6.t), '기준일에서 ' + T.stale + '일이 넘으면 「낡았다」 고 말한다');

    is(errs.length === 0, '스크립트 오류 0' + (errs.length ? ' ← ' + errs.slice(0, 3).join(' | ') : ''));

    console.log('\n[6] 화제 파일을 못 실으면');
    const ctx2 = await b.newContext();
    await ctx2.route('**/ta-trend.js', r => r.fulfill({ status: 404, body: '' }));
    await ctx2.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.fallback() : r.fulfill({ status: 200, body: '' }));
    const p2 = await ctx2.newPage(); const e2 = []; p2.on('pageerror', e => e2.push(e.message));
    await p2.goto(U, { waitUntil: 'load' }); await p2.waitForTimeout(300);
    const r7 = await p2.evaluate(() => { TA_APP.setDB('analysis1');
      return { t: document.getElementById('trendBody').textContent, a: document.getElementById('script').textContent }; });
    is(/읽지 못했습니다/.test(r7.t) && /쉽게 말씀드리면/.test(r7.a), '못 읽었다고 말하고, 대본은 화제 없이 원래대로 선다');
    is(e2.length === 0, '그때도 오류가 안 난다' + (e2.length ? ' ← ' + e2[0] : ''));
  } finally { await b.close(); srv.close(); }
  console.log(bad ? '\n✗ TA 첫 화제 — 고칠 자리 ' + bad + '곳' : '\n✓ TA 첫 화제 — 모두 통과');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
