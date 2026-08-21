/* 일시납 · 쿠폰 운용 — 목돈을 넣어 두고 해마다(다달이) 받는다.

   제안서 넷을 직접 읽어 옮긴 값으로 만든 트랙이다. 여기서 확인한다.

     1. 제안서 숫자가 그대로 있는가 (메트 매년 · AIA 매월)
     2. 비례 환산이 맞는가 — 그리고 「비례 환산한 참고치」라고 밝히는가
     3. <b>받은 것 + 남은 것</b> 합계를 보여주는가
        (환급률만 보여주면 「원금 반토막」으로 오해한다)
     4. 세금을 단정하지 않는가 — 「요건 충족 시」로만
     5. 부동산 월세와 그대로 견주지 않는가
        (월세는 건물을 두고 나오는 돈, 쿠폰은 원금에서 먼저 나가는 돈)
     6. 여섯 장이 다 있는가 · 폰에서 가로로 안 밀리는가
     7. (같은 파일) 교육자금 — 월 얼마 넣으면 얼마가 되는지 보이는가     */
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
const PAGE = '/app/' + encodeURIComponent('상담자료') + '/' + encodeURIComponent('통합상담_APEX.html');
const near = (a, b, tol) => Math.abs(a - b) <= (tol || 1);

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto(base + PAGE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  await page.evaluate(() => window.__go('c'));
  await page.waitForTimeout(300);

  console.log('\n[1] 제안서 숫자가 그대로 있다');
  /* 배수 1 이 되게 맞춘다 — 제안서 $71,000 / $70,700 그대로 */
  const one = await page.evaluate(() => {
    const out = {};
    ['y5', 'y10', 'y20'].forEach(t => {
      window.__apexC.set({ co: 'met', type: t, fxIn: 1484, man: 71000 * 1484 / 10000, scen: 'cur' });
      const r = window.__apexC.result();
      out[t] = { each: r.each, times: r.times, got: r.gotTotal, usd: r.usdIn };
    });
    window.__apexC.set({ co: 'aia', fxIn: 1484, man: 70700 * 1484 / 10000 });
    const a = window.__apexC.result();
    out.aia = { each: a.each, times: a.times, got: a.gotTotal, usd: a.usdIn };
    return out;
  });
  is(near(one.y5.usd, 71000, 1), '  일시납 $71,000 (나온 값 ' + Math.round(one.y5.usd) + ')');
  is(near(one.y5.each, 8502.51, 1) && one.y5.times === 5, '  5년형 매년 $8,502.51 × 5회');
  is(near(one.y10.each, 4828.78, 1) && one.y10.times === 10, '  10년형 매년 $4,828.78 × 10회');
  is(near(one.y20.each, 3058.49, 1) && one.y20.times === 20, '  20년형 매년 $3,058.49 × 20회');
  is(near(one.y5.got, 42512.55, 2), '  5년형 누계 $42,512.55');
  is(near(one.y10.got, 48287.80, 2), '  10년형 누계 $48,287.80');
  is(near(one.y20.got, 61169.80, 2), '  20년형 누계 $61,169.80');
  is(near(one.aia.usd, 70700, 1) && near(one.aia.each, 227.93, 0.5) && one.aia.times === 120,
     '  AIA 매월 $227.93 × 120회 · 일시납 $70,700');
  is(near(one.aia.got, 27351.60, 2), '  AIA 누계 $27,351.60');

  console.log('\n[2] 비례 환산이 맞고, 참고치라고 밝힌다');
  const half = await page.evaluate(() => {
    window.__apexC.set({ co: 'met', type: 'y5', fxIn: 1484, man: 71000 * 1484 / 10000 / 2 });
    const r = window.__apexC.result();
    return { each: r.each, note: (document.getElementById('cpSumNote').textContent || '').replace(/\s+/g, ' ') };
  });
  is(near(half.each, 8502.51 / 2, 1), '  절반을 넣으면 절반이 나온다 ($' + Math.round(half.each) + ')');
  is(/비례 환산한 참고치/.test(half.note), '  「비례 환산한 참고치」 라고 적는다');
  is(/나이|이율/.test(half.note), '  나이·이율이 다르면 곡선이 달라진다고 밝힌다');

  console.log('\n[3] 받은 것 + 남은 것 합계를 보여준다');
  const sums = await page.evaluate(() => {
    const out = {};
    ['y5', 'y10', 'y20'].forEach(t => {
      window.__apexC.set({ co: 'met', type: t, fxIn: 1484, fxOut: 1484,
                           man: 71000 * 1484 / 10000, scen: 'cur' });
      out[t] = (document.getElementById('cpSumTable').textContent || '').replace(/\s+/g, ' ');
    });
    window.__apexC.set({ co: 'aia', fxIn: 1484, fxOut: 1484, man: 70700 * 1484 / 10000, scen: 'cur' });
    out.aia = (document.getElementById('cpSumTable').textContent || '').replace(/\s+/g, ' ');
    return out;
  });
  is(/162\.6%/.test(sums.y5),  '  5년형 20년차 162.6%');
  is(/170\.8%/.test(sums.y10), '  10년형 20년차 170.8%');
  is(/188\.9%/.test(sums.y20), '  20년형 20년차 188.9%');
  is(/138\.7%/.test(sums.aia), '  AIA 10년차 138.7%');
  is(/받은 것 \+ 남은 것/.test(await page.evaluate(() =>
      document.getElementById('trackC').textContent.replace(/\s+/g, ' '))),
     '  「받은 것 + 남은 것」 이라는 말이 화면에 있다');

  console.log('\n[4] 세금을 단정하지 않는다');
  const txt = await page.evaluate(() => document.getElementById('trackC').textContent.replace(/\s+/g, ' '));
  is(/요건 충족 시|요건을 충족할 때/.test(txt), '  「요건 충족 시」 로 조건부 표기한다');
  is(!/쿠폰이라서 세금이 없|비과세 상품입니다(?!」)/.test(txt.replace(/✕[\s\S]{0,200}/g, '')),
     '  「세금이 없다」 는 결론을 쓰지 않는다');
  is(/세무 자문이 아닙니다/.test(txt), '  세무 자문이 아니라고 밝힌다');
  is(/원화환산납입/.test(txt), '  원화환산납입서비스가 비과세 요건을 깰 수 있다고 짚는다');

  console.log('\n[5] 부동산 월세와 그대로 견주지 않는다');
  const vs = await page.evaluate(() => document.getElementById('cpVs').textContent.replace(/\s+/g, ' '));
  is(/그대로 견주시면 안 됩니다/.test(vs), '  「그대로 견주면 안 된다」 고 크게 적는다');
  is(/원금에서 먼저 나가는/.test(vs), '  원금에서 먼저 나간다는 사실을 적는다');
  is(/손에 쥐고 있는 것 전부/.test(vs), '  정직하게 견줄 수 있는 표를 따로 놓는다');
  is(/건물값이 그대로라고 가정/.test(vs), '  부동산 쪽 가정도 밝힌다');
  is(/건강보험료/.test(vs), '  건강보험료가 더 붙을 수 있다고 짚는다');

  console.log('\n[6] 일곱 장이 다 있다');
  /* 1장은 넷으로 갈렸다 — 도해 셋이 한 장에 다 들어가 <b>키가 3,093px</b> 이라
     카드 밑에 묻혀 있었다. 발표 한 장이 네 화면이면 아래는 아무도 안 본다. */
  [['월세를 받는 것', '1장 · 건물과 월세를 가른다'],
   ['따로 붙지 않습니다', '1장① · 세금'],
   ['먼저 오는 고지서', '1장② · 건강보험료'],
   ['열두 달이', '1장③ · 실제로 들어오는 달'],
   ['거치해서 굴린다', '2장'], ['쿠폰이', '3장'],
   ['받는 방법에 따라', '4장 · 얼마 · 어떻게'],
   ['얼마 넣으면', '5장 · 계산'],
   ['요건을 충족할 때', '6장'], ['나란히 보기', '7장']]
    .forEach(([w, n]) => is(txt.indexOf(w) >= 0, '  ' + n + ' — ' + w));
  const nav = await page.evaluate(() => ({
    btn: !!document.querySelector('.nt[data-go="c"]'),
    fk: !!document.querySelector('.fk[data-go="c"]'),
    track: !!document.getElementById('trackC')
  }));
  is(nav.btn && nav.fk && nav.track, '  위 차림표·첫 화면 갈래 카드·본문이 다 붙어 있다');

  console.log('\n[7] 폰에서 가로로 안 밀린다');
  const ph = await browser.newPage({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true });
  ph.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await ph.goto(base + PAGE, { waitUntil: 'domcontentloaded' });
  await ph.waitForTimeout(2200);
  for (const k of ['w', 'd', 't', 'e', 'c']) {
    const r = await ph.evaluate(async (k) => {
      window.__go(k); await new Promise(r => setTimeout(r, 260));
      const de = document.documentElement; return { sw: de.scrollWidth, cw: de.clientWidth };
    }, k);
    is(r.sw <= r.cw + 1, '  갈래 ' + k + ' (' + r.sw + '/' + r.cw + ')');
  }
  await ph.close();

  console.log('\n[8] 교육자금 — 월 얼마 넣으면 얼마');
  const edu = await page.evaluate(() => {
    window.__go('e');
    window.__apexE.set({ mon: 30, fxIn: 1484, fxOut: 1484, prod: 'met', age: 0, go: 19 });
    const on = (document.getElementById('eMonBox').textContent || '').replace(/\s+/g, ' ');
    window.__apexE.set({ mon: 60 });
    const dbl = (document.getElementById('eMonBox').textContent || '').replace(/\s+/g, ' ');
    window.__apexE.set({ mon: 0 });
    const zero = (document.getElementById('eMonBox').textContent || '').replace(/\s+/g, ' ');
    window.__apexE.set({ mon: 30 });
    return { on, dbl, zero };
  });
  is(/월 30만원씩 5년 넣으면/.test(edu.on), '  월 납입액을 적으면 계산된다');
  is(/1,800만원/.test(edu.on), '  30만 × 60개월 = 1,800만원');
  is(/3,600만원/.test(edu.dbl), '  60만으로 바꾸면 3,600만원 — 숫자만 바뀐다');
  is(/환급률/.test(edu.on) && /찾는 시점/.test(edu.on), '  찾는 시점별 환급률·수령액이 표로 나온다');
  is(/지원금과 나란히/.test(edu.on), '  지원금 재원과 나란히 놓는다');
  is(/금액을 적으면 여기 계산됩니다/.test(edu.zero), '  0 이면 억지로 계산하지 않고 안내만 한다');

  console.log('\n[9] 금융소비자보호 — 반드시 적을 것을 적었는가');
  const disc = await page.evaluate(() => (document.body.textContent || '').replace(/\s+/g, ' '));
  [['갈래 E', '갈래 E 유의사항이 따로 있다'],
   ['비례 환산한 참고치', '비례 환산이라고 밝힌다'],
   ['원금 손실', '외화보험 원금 손실을 밝힌다'],
   ['미래 수익을 보장하지 않습니다', '미래 수익을 보장하지 않는다고 적는다'],
   ['예금자보호', '예금자보호 한도를 적는다'],
   ['MVA', 'AIA 해약환급금 계산과 MVA 를 적는다'],
   ['세무 전문가', '세무 전문가와 상담하라고 적는다'],
   ['양도소득세·취득세·중개보수는 반영하지 않았습니다', '부동산 비교에서 뺀 세금을 밝힌다']]
    .forEach(([w, n]) => is(disc.indexOf(w) >= 0, '  ' + n));

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '일시납·쿠폰 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '일시납·쿠폰 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
