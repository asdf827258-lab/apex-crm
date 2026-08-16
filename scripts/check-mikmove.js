/* 미끼 레이더를 다른 컴퓨터로 옮길 수 있는가.

   여기 쌓은 약관·판정·컨셉은 전부 이 브라우저 안에 있다 — 약관을
   서버에 올리지 않으려고 일부러 그렇게 만들었다. 그래서 사무실에서
   올린 약관이 집에서는 없다. 원칙은 지키고, 옮기는 길은 있어야 한다.

   그리고 지금은 이게 <b>유일한 백업</b>이다. 브라우저 기록을 지우면
   올려 둔 약관과 판정이 전부 사라지고 되돌릴 방법이 없었다.

   여기서 확인한다 — 진짜 왕복이 되는가.

     1. 자료를 넣고 내보내면 파일이 나오는가
     2. 빈 브라우저에서 그 파일을 넣으면 그대로 살아나는가
     3. 가볍게 내보내면 약관 원본은 빠지고 글은 남는가
     4. 엉뚱한 파일을 넣으면 안 깨지고 말해 주는가                  */
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
const PAGE = '/app/상담자료/미끼레이더/index.html';

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const errs = [];

  /* ── 사무실 컴퓨터 ── */
  const office = await browser.newContext();
  const p1 = await office.newPage();
  p1.on('pageerror', e => errs.push('사무실: ' + String(e).slice(0, 120)));
  await p1.goto(base + PAGE, { waitUntil: 'domcontentloaded' });
  await p1.waitForTimeout(2200);

  console.log('\n[1] 사무실에서 자료를 쌓고 내보낸다');
  is(await p1.evaluate(() => typeof mkExport === 'function'), '「다른 PC로」 기능이 붙어 있다');
  is(await p1.locator('#mkMoveBtn').count() === 1, '우하단에 단추가 있다');

  const packed = await p1.evaluate(async () => {
    /* 약관 두 건 — 하나는 PDF 원본까지 */
    await dbPut({ id: 'd1', title: '무배당 든든종신보험 약관', co: '한화생명', kind: '약관',
                  chars: 120, text: '제5조(보험금의 지급사유) 회사는 피보험자가…',
                  pdf: new Blob([new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55])], { type: 'application/pdf' }) });
    await dbPut({ id: 'd2', title: '간편심사 판매자료', co: '삼성생명', kind: '판매자료',
                  chars: 80, text: '고지 3개 항목만 확인합니다' });
    localStorage.setItem('mikki_concept', JSON.stringify({ month: '8월', 컨셉: '뇌·심장 3종' }));
    localStorage.setItem('mikki_talk', '요즘 이 담보가 갈립니다');
    localStorage.setItem('apex_lead_inbox', '[]');
    localStorage.setItem('남의칸', '건드리면 안 됨');

    /* 내보내기가 만드는 꾸러미를 그대로 받아 본다 */
    const real = URL.createObjectURL, grabbed = {};
    URL.createObjectURL = function (b) { grabbed.blob = b; return real.call(URL, b); };
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { grabbed.name = this.download; };
    mkMovePanel();
    await mkExport(true);
    HTMLAnchorElement.prototype.click = click; URL.createObjectURL = real;
    const txt = await grabbed.blob.text();
    return { name: grabbed.name, txt, size: txt.length };
  });
  is(/^미끼레이더_\d{8}_약관포함\.json$/.test(packed.name || ''), '파일 이름이 알아보기 쉽다 — ' + packed.name);
  const pack = JSON.parse(packed.txt);
  is(pack.what === 'apex-mikki-radar' && pack.ver === 1, '우리 파일이라고 표시돼 있다');
  is(pack.docs.length === 2, '자료 두 건이 담겼다 — ' + pack.docs.length);
  is(!!pack.docs.find(d => d.id === 'd1' && d.pdfB64), '약관 원본(PDF)까지 담겼다');
  is(Object.keys(pack.ls).length === 3, '미끼 저장칸 세 개만 담겼다 — ' + Object.keys(pack.ls).join(', '));
  is(!pack.ls['남의칸'], '남의 저장칸은 안 담는다');

  console.log('\n[2] 가볍게 내보내면 약관 원본은 빠지고 글은 남는다');
  const lite = await p1.evaluate(async () => {
    const real = URL.createObjectURL, g = {};
    URL.createObjectURL = function (b) { g.blob = b; return real.call(URL, b); };
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { g.name = this.download; };
    await mkExport(false);
    HTMLAnchorElement.prototype.click = click; URL.createObjectURL = real;
    return { name: g.name, txt: await g.blob.text() };
  });
  const lp = JSON.parse(lite.txt);
  is(!/약관포함/.test(lite.name || ''), '이름으로 구분된다 — ' + lite.name);
  is(lp.docs.every(d => !d.pdfB64), '약관 원본은 안 담긴다');
  is(lp.docs.find(d => d.id === 'd1').text.indexOf('제5조') >= 0, '뽑아 둔 글은 그대로 담긴다 — 판정은 이걸로 돈다');
  is(lite.txt.length < packed.txt.length, '가벼운 쪽이 더 작다 — ' + lite.txt.length + ' < ' + packed.txt.length);

  console.log('\n[3] 집 컴퓨터에서 그 파일을 넣으면 살아난다');
  const home = await browser.newContext();
  const p2 = await home.newPage();
  p2.on('pageerror', e => errs.push('집: ' + String(e).slice(0, 120)));
  await p2.goto(base + PAGE, { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(2200);
  const empty = await p2.evaluate(async () => (await dbAll()).length);
  is(empty === 0, '집 컴퓨터는 비어 있다');

  const tmp = path.join(require('os').tmpdir(), 'mikki-move.json');
  fs.writeFileSync(tmp, packed.txt);
  await p2.evaluate(() => mkMovePanel());
  await p2.setInputFiles('#mkImpFile', tmp);
  await p2.waitForTimeout(1100);
  const said = await p2.evaluate(() => (document.getElementById('mkMoveMsg') || {}).textContent || '(없음)');
  is(/넣었습니다/.test(said), '넣었다고 답한다 — ' + said.slice(0, 46));
  /* 넣으면 스스로 새로고침한다 — 다 뜰 때까지 기다렸다가 읽는다.
     시간을 정해 놓고 재면 느린 날 그대로 빨간불이 된다. */
  await p2.waitForLoadState('load');
  await p2.waitForTimeout(2000);
  await p2.waitForFunction(() => typeof dbAll === 'function', null, { timeout: 30000 });
  const got = await p2.evaluate(async () => {
    const rows = await dbAll();
    const d1 = rows.find(r => r.id === 'd1');
    return { n: rows.length, title: d1 ? d1.title : '', text: d1 ? (d1.text || '') : '',
             pdf: !!(d1 && d1.pdf), co: d1 ? d1.co : '',
             concept: localStorage.getItem('mikki_concept') || '',
             talk: localStorage.getItem('mikki_talk') || '' };
  });
  is(got.n === 2, '자료 두 건이 그대로 들어왔다 — ' + got.n);
  is(got.title === '무배당 든든종신보험 약관', '제목이 살아 있다 — ' + got.title);
  is(got.co === '한화생명', '회사 구분도 살아 있다');
  is(/제5조/.test(got.text), '약관 글이 살아 있다 — 판정을 다시 돌릴 수 있다');
  is(got.pdf, '약관 원본(PDF)도 살아 있다 — 쪽을 그림으로 뜰 수 있다');
  is(/뇌·심장/.test(got.concept), '이달의 컨셉이 따라왔다');
  is(/갈립니다/.test(got.talk), '화법도 따라왔다');

  console.log('\n[4] 엉뚱한 파일을 넣으면 안 깨진다');
  const junk = path.join(require('os').tmpdir(), 'mikki-junk.json');
  fs.writeFileSync(junk, JSON.stringify({ hello: 'world' }));
  await p2.evaluate(() => { if (!document.getElementById('mkMove')) mkMovePanel(); });
  await p2.setInputFiles('#mkImpFile', junk);
  await p2.waitForTimeout(900);
  const msg = await p2.evaluate(() => (document.getElementById('mkMoveMsg') || {}).textContent || '');
  is(/미끼 레이더 파일이 아닙니다/.test(msg), '아니라고 말해 준다 — ' + msg.slice(0, 40));
  is((await p2.evaluate(async () => (await dbAll()).length)) === 2, '들어 있던 자료는 그대로다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  try { fs.unlinkSync(tmp); fs.unlinkSync(junk); } catch (e) {}
  console.log('\n──────────────────────────────');
  console.log(bad ? '미끼 레이더 옮기기 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '미끼 레이더 옮기기 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
