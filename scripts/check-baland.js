/* 가로 16:9 로 뽑기 — 발표한 것을 <b>그대로</b> 종이에 옮긴다.

   사장님은 발표를 끝내고 그 자리에서 PDF 를 뽑아 카톡으로 보냅니다.
   세로 문서로 뽑으면 고객 폰에서 <b>글자가 깨알</b>이 되고, 발표에서 본
   모양과 달라 「아까 그 화면」을 못 찾습니다. 그래서 가로 한 장씩 뽑습니다.

   여기서 못 박는 것은 다섯 가지입니다.

     1. <b>인쇄가 두 가지라고 화면에 적혀 있다.</b> 단추 하나로 뽑으면
        무엇이 나올지 모른다 — 세로는 잔글까지 전부, 가로는 한 쪽에 한 장.
     2. <b>한 쪽에 한 장</b>이다. 쪽 수가 장 수와 같아야 한다. 한 장이
        두 쪽으로 갈리거나 빈 쪽이 끼면 고객이 넘기다 길을 잃는다.
     3. <b>쪽이 16:9</b> 다. 4:3 이나 A4 로 나오면 위아래가 남거나 잘린다.
     4. <b>무대 모양 그대로</b> 나온다. 장에 무대 모양(.cur)이 안 붙으면
        칸이 무너져 글자가 <b>한 자씩 줄바꿈</b>된다 — 실제로 그랬다.
     5. <b>뽑고 나면 화면이 돌아온다.</b> 안 돌아오면 고객 앞 화면이
        22장 세로로 늘어선 채 남는다.

   그리고 세로(문서)로 뽑을 때의 약속 — <b>접힌 잔글까지 전부</b> — 이
   가로를 넣느라 깨지지 않았는지 같이 본다.                            */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const OUT = path.join(require('os').tmpdir(), 'baland-' + process.pid + '.pdf');
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': /\.js$/.test(f) ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);
/* PDF 를 <b>바이트로</b> 읽는다 — 쪽 수와 쪽 크기만 보면 되므로 라이브러리가 필요 없다 */
const pdfPages = (buf) => (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
const pdfBox = (buf) => {
  const m = buf.toString('latin1').match(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  return m ? { w: +m[3] - +m[1], h: +m[4] - +m[2] } : null;
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + srv.address().port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(700);

  head('[1] 인쇄가 <두 가지>라고 화면에 적혀 있다');
  const btn = await pg.evaluate(() => {
    /* 견본 자료 — 앱이 스스로 넣는 홍길동 자리다. 실제 고객 이름이 아니다. */
    localStorage.clear(); doSample(); S.deck = true; go('show');
    var b = [].slice.call(document.querySelectorAll('.showctl .btn'))
      .map(function (x) { return (x.textContent || '').trim(); });
    return { all: b, doc: b.filter(function (t) { return /세로/.test(t); })[0] || '',
             land: b.filter(function (t) { return /가로/.test(t); })[0] || '' };
  });
  await pg.waitForTimeout(300);
  is(!!btn.doc && /전부/.test(btn.doc), '<세로>는 「잔글까지 전부」라고 적혀 있다 — 「' + btn.doc + '」');
  is(!!btn.land && /16:9|한 장/.test(btn.land), '<가로>는 「한 쪽에 한 장」이라고 적혀 있다 — 「' + btn.land + '」');

  head('[2] 가로로 뽑으면 <모든 장>이 무대 모양으로 선다');
  const set = await pg.evaluate(() => {
    var p = window.print; window.print = function () { };
    printAllOn();                 /* 브라우저가 인쇄 직전에 하는 일을 먼저 해 둔다 */
    baPrint('land');
    window.print = p;
    /* 사람이 뽑을 때는 대화상자가 닫힌 뒤에 afterprint 가 불리지만, 시험에서는
       pg.pdf() 도중에 불려 되돌리기가 먼저 돈다. 그 귀만 잠깐 떼어 둔다. */
    window.removeEventListener('afterprint', baAfterPrint);
    var all = [].slice.call(document.querySelectorAll('#deckShow>section'));
    return { n: all.length, cur: all.filter(function (s) { return s.classList.contains('cur'); }).length,
             css: (document.getElementById('baPageCss') || {}).textContent || '',
             pl: document.body.classList.contains('printland') };
  });
  await pg.waitForTimeout(400);
  is(set.n > 0 && set.cur === set.n,
     '장 ' + set.n + '개가 <하나도 빠짐없이> 무대 모양으로 선다 (지금 ' + set.cur + '개) — 안 붙으면 글자가 한 자씩 줄바꿈된다');
  is(/@page\{size:339mm 191mm/.test(set.css) && set.pl,
     '쪽 크기를 <16:9(339×191mm)>로 잡는다 — A4 로 뽑으면 위아래가 남는다');

  head('[3] 한 쪽에 <한 장> · 쪽이 16:9');
  const buf = await pg.pdf({ path: OUT, printBackground: true, preferCSSPageSize: true });
  const np = pdfPages(buf), box = pdfBox(buf);
  is(np === set.n,
     '쪽 수가 장 수와 <같다> — 장 ' + set.n + '개 → ' + np + '쪽 (갈라진 장도 빈 쪽도 없다)');
  is(!!box && Math.abs(box.w / box.h - 16 / 9) < 0.02,
     '쪽이 <16:9> 다 — ' + (box ? (Math.round(box.w) + '×' + Math.round(box.h) + 'pt · ' + (box.w / box.h).toFixed(3)) : '못 읽음'));

  head('[4] 뽑고 나면 <화면이 돌아온다>');
  const back = await pg.evaluate(() => {
    baPrintDone();
    var all = [].slice.call(document.querySelectorAll('#deckShow>section'));
    return { pl: document.body.classList.contains('printland'),
             css: (document.getElementById('baPageCss') || {}).textContent || '',
             cur: all.filter(function (s) { return s.classList.contains('cur'); }).length, n: all.length };
  });
  await pg.waitForTimeout(300);
  is(!back.pl && !back.css,
     '가로용 규칙이 <남지 않는다> — 화면에 한 순간도 안 남는다');
  is(back.cur === 1,
     '보던 장 <하나만> 다시 선다 (지금 ' + back.cur + ' / ' + back.n + ') — 안 그러면 고객 앞 화면이 세로로 늘어선 채 남는다');

  head('[5] 세로(문서)로 뽑을 때의 약속이 <안 깨졌다>');
  await pg.evaluate(() => { localStorage.clear(); doSample(); S.deck = true; go('show'); });
  await pg.waitForTimeout(400);
  await pg.emulateMedia({ media: 'print' });
  await pg.waitForTimeout(300);
  const doc = await pg.evaluate(() => {
    /* 무대에서 접어 둔 잔글이 <b>종이에서는</b> 펴져야 한다 */
    var L = [].slice.call(document.querySelectorAll('#deckShow>section'));
    var deep = 0, shown = 0;
    L.forEach(function (s) {
      var was = s.className; s.classList.add('cur');
      [].slice.call(s.querySelectorAll('.deep,.sd2,.simft')).forEach(function (e) {
        deep++; if (getComputedStyle(e).display !== 'none') shown++;
      });
      s.className = was;
    });
    return { deep: deep, shown: shown };
  });
  await pg.emulateMedia({ media: 'screen' });
  is(doc.deep > 0 && doc.shown === doc.deep,
     '접어 둔 잔글 ' + doc.deep + '군데가 <종이에서는 전부> 펴진다 (지금 ' + doc.shown + '군데)');

  head('[6] 조용한가');
  is(errs.length === 0, errs.length ? ('콘솔 에러 — ' + errs.join(' / ')) : '콘솔에 에러가 없다');

  try { fs.unlinkSync(OUT); } catch (e) { }
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') :
    '가로 인쇄 점검 통과 — 발표한 그대로 한 쪽에 한 장씩 나갑니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
