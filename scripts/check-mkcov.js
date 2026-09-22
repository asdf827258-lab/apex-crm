/* 🎣 미끼 레이더 — <b>홈에서 넘어온 담보</b> (?cov=)

   사장님 말씀 ⑤ (2026-09-22) —
     「고객 365일 한눈에 + 보장분석 전후/KB보장분석 읽고 <b>미끼레이더와
      연계</b>한 관리 프로그램을 홈에서」

   홈(고객 체크)은 보장분석에서 읽은 담보 이름 <b>하나만</b> 넘깁니다.
   그 담보가 암인지 뇌인지 간병인지는 <b>여기가</b> 정합니다 — 이름표
   사전을 들고 있는 곳이 여기라, 저쪽에서 또 가르면 두 곳이 다른 답을
   하는 날이 옵니다 (5번).

   못 박는 것 —
     ① ?cov= 로 오면 <b>🏆 담보별 베스트</b> 가 열리고 그 담보가 적힌다
     ② 가려낸 갈래를 <b>이름으로</b> 말한다 — 암은 암, 뇌·심장은 뇌
     ③ <b>못 가리면 못 가렸다고 적는다</b> (1번) — 비슷한 갈래를 찍어 주면
        엉뚱한 약관 줄을 보고 고객에게 말하게 된다
     ④ <b>저절로 서재 판정을 안 돌린다</b> (7번) — 200쪽 약관을 통째로 읽는
        일은 사장님이 누르실 때만
     ⑤ ?cov= 가 없으면 <b>아무것도 안 바뀐다</b> — 헛것을 안 만든다       */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8951;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const PAGE = '/app/상담자료/미끼레이더/index.html';

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const srv = http.createServer((rq, rs) => {
  const f = path.join(ROOT, decodeURIComponent(url.parse(rq.url).pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const errs = [];
  const open = async (q) => {
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + PAGE + q, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1200);
    return p;
  };

  console.log('\n[1] 🏠 <b>홈에서 넘어온 담보</b>가 그 자리에 선다');
  const p1 = await open('?cov=' + encodeURIComponent('일반암 (최초 1회)'));
  const R1 = await p1.evaluate(() => {
    const box = [...document.querySelectorAll('.card')].find(x => /홈에서 넘어온 담보/.test(x.textContent || ''));
    const best = document.getElementById('p-best');
    return { box: box ? box.textContent.replace(/\s+/g, ' ') : '',
      onBest: !!(best && best.classList.contains('on')),
      state: (document.getElementById('bestState') || {}).textContent || '',
      out: (document.getElementById('bestOut') || {}).innerHTML || '' };
  });
  is(R1.onBest, '  <b>🏆 담보별 베스트</b> 가 열린다 — 사장님이 탭을 찾아 누르지 않으셔도 된다');
  is(/일반암/.test(R1.box), '  넘어온 담보를 <b>그대로</b> 적는다 — 「' + R1.box.slice(0, 54) + '…」');
  is(/아래 <b>암<\/b> 줄|아래 암 줄/.test(R1.box) || /\b암\b/.test(R1.box),
     '  가려낸 갈래를 <b>이름으로</b> 말한다');
  is(/서재 전체 판정/.test(R1.box), '  <b>다음에 무엇을 누르는지</b> 적는다');
  is(R1.out.trim() === '', '  <b>저절로 서재를 안 읽는다</b> (7번) — 판정 결과가 비어 있다');
  await p1.close();

  console.log('\n[2] 뇌·심장도 <b>제 갈래</b>로 간다');
  const p2 = await open('?cov=' + encodeURIComponent('뇌혈관질환 진단비'));
  const R2 = await p2.evaluate(() => {
    const box = [...document.querySelectorAll('.card')].find(x => /홈에서 넘어온 담보/.test(x.textContent || ''));
    return box ? box.textContent.replace(/\s+/g, ' ') : '';
  });
  is(/뇌/.test(R2) && !/못 가렸습니다/.test(R2), '  뇌혈관 → <b>뇌</b> — 「' + R2.slice(0, 54) + '…」');
  await p2.close();

  console.log('\n[3] <b>못 가리면 못 가렸다고 적는다</b> (1번)');
  const p3 = await open('?cov=' + encodeURIComponent('홍길동특약'));
  const R3 = await p3.evaluate(() => {
    const box = [...document.querySelectorAll('.card')].find(x => /홈에서 넘어온 담보/.test(x.textContent || ''));
    return box ? box.textContent.replace(/\s+/g, ' ') : '';
  });
  is(/못 가렸습니다/.test(R3), '  <b>「어느 갈래인지 못 가렸습니다」</b> — 비슷한 갈래를 찍어 주지 않는다');
  is(/직접 골라/.test(R3), '  <b>그럼 무엇을 하면 되는지</b>까지 적는다');
  is(/홍길동/.test(R3), '  그래도 <b>무엇을 들고 왔는지</b>는 말한다');
  await p3.close();

  console.log('\n[4] <b>?cov= 가 없으면 아무것도 안 바뀐다</b> — 헛것을 안 만든다');
  const p4 = await open('');
  const R4 = await p4.evaluate(() => ({
    box: [...document.querySelectorAll('.card')].some(x => /홈에서 넘어온 담보/.test(x.textContent || '')),
    onBest: !!(document.getElementById('p-best')
      && document.getElementById('p-best').classList.contains('on'))
  }));
  is(R4.box === false, '  그 칸을 <b>안 세운다</b>');
  is(R4.onBest === false, '  탭도 <b>안 옮긴다</b>');
  await p4.close();

  console.log('\n[5] <b>가르는 표가 여기 하나뿐</b>이다 (5번)');
  const mk = fs.readFileSync(path.join(ROOT, 'app/상담자료/미끼레이더/index.html'), 'utf8');
  const hm = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is(/COV_BCAT\s*=/.test(mk), '  갈래 표(COV_BCAT)가 <b>미끼 레이더에</b> 있다');
  is(!/COV_BCAT/.test(hm), '  <b>홈에는 없다</b> — 두 곳이 다른 답을 하는 날을 막는다');
  is(/NEWS_RULES/.test(mk.split('function covCat')[1] || ''),
     '  가를 때 <b>이미 있는 이름표 사전</b>을 쓴다 — 키워드를 또 적지 않는다 (5번)');

  is(errs.length === 0, '  화면이 터지지 않았다' + (errs.length ? ' — ' + errs[0] : ''));

  await ctx.close(); await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ 미끼 레이더 — 고칠 자리 ' + bad + '곳'
    : '✓ 미끼 레이더 — 홈에서 넘어온 담보를 제 갈래로 받고, 못 가리면 못 가렸다고 적습니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
