/* <b>한 장</b>으로 보이는가 — 연금 · 투자 · 상속.

   사장님 말씀은 이랬다 — 「무언가를 들어가서 보지 않고 한번에 고객의
   상황을 보여줘야 한다」, 「상속-증여도 어렵다」.

   맞는 말이다. 표가 맞아도 고객은 첫 표에서 손을 놓는다. 숫자를 읽어
   드리는 것과 <b>보이게 하는 것</b>은 다르다. 그래서 세 화면 맨 앞에
   그림 한 장씩을 세웠다.

     · 연금 — 목표 · 지금 · 함께라면 세 막대. 빈 자리가 눈에 보인다.
     · 투자 — 나눈 자리 다섯 · 기간이 만드는 곡선 · 수익률이 만드는 표.
     · 상속 — 같은 돈을 사망보험금 · 은행 · 현금에 두면 그날 얼마인가.

   그리고 이 세 장은 <b>지어내지 않는다.</b> 넣으신 값이 없으면 그림을
   세우지 않고 무엇을 채워야 하는지 말한다. 세금은 「요건 충족 시」로만
   적고 단정하지 않는다.

   여기서 확인한다.

     1. 세 화면 맨 앞에 한 장이 서는가
     2. 값이 없으면 <b>안 지어내는가</b>
     3. 그림이 실제로 그려지는가 — 빈 껍데기가 아닌가
     4. 세금을 단정하지 않는가
     5. 숫자가 <b>사이드바 값</b>에서 나오는가 — 바꾸면 따라 바뀌는가     */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8' };
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

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/finance.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n[1] 투자 — 나눈 자리 · 기간 · 수익률이 한 장에');
  const iv = await page.evaluate(() => {
    switchTab('invest');
    const b = document.getElementById('ivOne');
    return { has: !!b, svg: b ? b.querySelectorAll('svg').length : 0,
             paths: b ? b.querySelectorAll('svg path').length : 0,
             rows: b ? b.querySelectorAll('table tbody tr').length : 0,
             txt: b ? b.textContent.replace(/\s+/g, ' ') : '' };
  });
  is(iv.has && iv.svg === 1, '  그래프가 한 장 선다');
  is(iv.paths >= 4, '  원금선 + 수익률 곡선 셋 — 선 ' + iv.paths + '개');
  is(iv.rows >= 2, '  기간 × 수익률 표가 ' + iv.rows + '줄');
  ['연금저축', 'IRP', 'ISA', '비과세 저축', '일반 투자'].forEach(k =>
    is(iv.txt.indexOf(k) >= 0, '  나눈 자리 — ' + k));
  is(/요건.{0,6}충족/.test(iv.txt), '  세제는 「요건 충족 시」 로만 말한다');
  is(/보장하지 않습니다/.test(iv.txt), '  미래 수익을 보장하지 않는다고 밝힌다');
  is(/같은 돈입니다/.test(iv.txt), '  「같은 돈인데 달라지는 것은 나누는 자리와 기간」 을 말한다');

  console.log('\n[2] 투자 — 넣은 값이 없으면 지어내지 않는다');
  const iv0 = await page.evaluate(() => {
    const keep = {};
    ['s_pension', 's_irp', 's_isa', 's_taxfree', 's_general'].forEach(id => {
      const e = document.getElementById(id); keep[id] = e.value; e.value = '0';
    });
    ivOnePaint();
    const t = document.getElementById('ivOne').textContent.replace(/\s+/g, ' ');
    const n = document.getElementById('ivOne').querySelectorAll('svg').length;
    for (const k in keep) document.getElementById(k).value = keep[k];
    ivOnePaint();
    return { t: t, n: n };
  });
  is(iv0.n === 0, '  금액이 0 이면 그래프를 안 그린다');
  is(/아무 숫자도 만들지 않습니다/.test(iv0.t), '  「아무 숫자도 만들지 않습니다」 라고 적는다');

  console.log('\n[3] 투자 — 사이드바 값을 그대로 쓴다');
  const ivFollow = await page.evaluate(() => {
    const e = document.getElementById('s_pension'), old = e.value;
    e.value = '999'; ivOnePaint();
    const a = document.getElementById('ivOne').textContent.indexOf('999') >= 0 ||
              /1,0[0-9][0-9]만/.test(document.getElementById('ivOne').textContent);
    e.value = old; ivOnePaint();
    return a;
  });
  is(ivFollow, '  연금저축 칸을 바꾸면 한 장이 따라 바뀐다');

  console.log('\n[4] 연금 — 목표 · 지금 · 함께라면 세 막대');
  const ps = await page.evaluate(() => {
    document.getElementById('s_target').value = '300';
    switchTab('pension'); renderPensionSim();
    const c = document.querySelector('#pension-sim .card');
    return { tag: c ? (c.querySelector('.card-tag') || {}).textContent : '',
             svg: c ? c.querySelectorAll('svg').length : 0,
             bars: c ? c.querySelectorAll('svg rect').length : 0,
             txt: c ? c.textContent.replace(/\s+/g, ' ') : '' };
  });
  is(ps.tag === 'ONE PAGE', '  맨 앞 카드가 한 장이다 — ' + ps.tag);
  is(ps.svg === 1 && ps.bars >= 6, '  막대 그림이 선다 — 사각형 ' + ps.bars + '개');
  ['목표', '지금 이대로', '함께라면'].forEach(k =>
    is(ps.txt.indexOf(k) >= 0, '  ' + k + ' 막대가 있다'));
  is(/물가상승률은 넣지 않았습니다/.test(ps.txt), '  물가를 넣지 않았다고 밝힌다');

  console.log('\n[5] 연금 — 목표가 없으면 막대를 세우지 않는다');
  const ps0 = await page.evaluate(() => {
    const e = document.getElementById('s_target'), old = e.value;
    e.value = '0'; renderPensionSim();
    const c = document.querySelector('#pension-sim .card');
    const r = { svg: c ? c.querySelectorAll('svg').length : 0,
                txt: c ? c.textContent.replace(/\s+/g, ' ') : '' };
    e.value = old; renderPensionSim();
    return r;
  });
  is(ps0.svg === 0, '  목표가 비면 그림을 안 그린다');
  is(/아무 숫자도 만들지 않습니다/.test(ps0.txt), '  무엇을 채워야 하는지 말한다');

  console.log('\n[6] 상속 — 사망보험금 · 은행 · 현금 세 길');
  const lg = await page.evaluate(() => {
    document.getElementById('ins_life').value = '10000';
    switchTab('inherit'); renderInherit();
    const c = document.querySelector('#inherit-content .card');
    return { tag: c ? (c.querySelector('.card-tag') || {}).textContent : '',
             svg: c ? c.querySelectorAll('svg').length : 0,
             rows: c ? c.querySelectorAll('table tbody tr').length : 0,
             txt: c ? c.textContent.replace(/\s+/g, ' ') : '' };
  });
  is(lg.tag === 'ONE QUESTION', '  맨 앞 카드가 한 장이다 — ' + lg.tag);
  is(lg.svg === 1, '  그래프가 선다');
  is(lg.rows >= 3, '  「그날이 언제냐」 표가 ' + lg.rows + '줄');
  ['사망보험금', '은행', '현금'].forEach(k =>
    is(lg.txt.indexOf(k) >= 0, '  ' + k + ' 이야기가 있다'));
  is(/낸 돈의 .*배/.test(lg.txt), '  낸 돈 대비 몇 배인지 말해 준다');
  is(/6개월 안에 현금/.test(lg.txt), '  상속세는 6개월 안에 현금이라는 것을 말한다');
  is(/이미 가진 것을 지키려고/.test(lg.txt), '  왜 자산을 지키려면 사망보험금인지 말한다');

  console.log('\n[7] 상속 — 세금을 단정하지 않는다');
  is(/단정하지 않습니다/.test(lg.txt), '  「세금은 단정하지 않습니다」 라고 밝힌다');
  is(/계약자 · 피보험자 · 수익자/.test(lg.txt), '  구성에 따라 갈린다고 짚는다');
  is(/보험료를 실제로 누가 냈는지/.test(lg.txt), '  누가 냈는지가 갈림길이라고 짚는다');
  is(/세무 전문가와 확인/.test(lg.txt), '  세무 전문가와 확인하라고 적는다');
  is(/심사 결과에 따릅니다/.test(lg.txt), '  실제 보험료는 심사에 따른다고 밝힌다');

  console.log('\n[8] 상속 — 값을 바꾸면 따라 바뀐다');
  const lgFollow = await page.evaluate(() => {
    lgvSet('face', 30000);
    const t = document.querySelector('#inherit-content .card').textContent;
    lgvSet('face', 0);
    return /3억/.test(t);
  });
  is(lgFollow, '  남기려는 금액을 3억으로 바꾸면 3억으로 선다');

  console.log('\n[9] 콘솔이 조용하다');
  is(errs.length === 0, '  오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log(bad ? '\n✗ ' + bad + '개 어긋남\n'
                  : '\n──────────────────────────────\n한 장 점검 통과 — 다 맞습니다.\n');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
