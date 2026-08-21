/* 준비정도 게이지 — <b>권장금액 대비 얼마나 차 있나</b>.

   전에는 담보를 서로 견주는 막대였다. 그런데 사망 1억 옆에 입원일당
   3만원을 그리면 3만원은 <b>보이지도 않는다.</b> 자릿수가 다르기 때문이다.
   그래서 담보마다 <b>자기 자</b>를 세운다 — 회색 칸이 권장금액(100%)이고
   그 안이 얼마나 찼는지를 본다.

   비포·애프터니까 칸이 둘이다. 왼쪽이 <b>지금</b>, 오른쪽이 <b>바꾸면</b>.
   처음엔 한 칸에 두 겹을 포개 그렸는데 개선이 크면 진한 칸이 연한 칸을
   완전히 덮어 <b>「지금」이 안 보였다.</b> 비포가 안 보이는 비포·애프터는
   그림이 아니다.

   여기서 확인한다.

     1. 게이지가 서고 묶음·칸이 그려지는가
     2. <b>지금</b>과 <b>바꾸면</b>이 <b>둘 다 보이는가</b>
     3. 준비정도를 옳게 세는가 — 100% 충분 · 50% 주의 · 그 아래 부족 · 0 미가입
     4. 권장금액 표가 <b>한 벌</b>인가 — 인체 한 장과 같은 표를 쓰는가
     5. 값이 없으면 <b>지어내지 않는가</b>
     6. 권장금액이 <b>설계사 기준</b>이라고 밝히는가                      */
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

/* 견본 — 홍길동 님. 권장금액(BABA_BODY 기본값) 대비 네 갈래가 다 나오게 짰다.
   cancer 권장 5,000 → 지금 5,000(충분) / brain 권장 2,000 → 지금 1,200(주의)
   mi 권장 2,000 → 지금 400(부족)      / dem2 권장 3,000 → 지금 0(미가입)      */
const SAMPLE = {
  cancer: [5000, 5000], brain: [1200, 3000], mi: [400, 2000], dem2: [0, 3000],
  inpD: [2, 3], death: [5000, 10000]
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  const seed = (S) => page.evaluate((S) => {
    try { localStorage.removeItem(BABA_REC_KEY); } catch (e) {}
    BABA.plans = [];
    BABA.rows = BABA_TERMS.map(t => ({ k: t.k, n: t.n,
      b: S[t.k] ? S[t.k][0] : null, a: S[t.k] ? S[t.k][1] : null, raw: '' }));
    const box = document.getElementById('gbox') || document.createElement('div');
    box.id = 'gbox';
    box.innerHTML = babaGaugeHtml();
    if (!box.parentNode) document.body.appendChild(box);
    return {
      html: box.innerHTML,
      txt: box.textContent.replace(/\s+/g, ' '),
      grps: box.querySelectorAll('.bg-grp').length,
      cells: box.querySelectorAll('.bg-cell').length,
      halves: box.querySelectorAll('.bg-half').length,
      tally: babaReadyTally()
    };
  }, S);

  console.log('\n[1] 게이지가 선다');
  const r = await seed(SAMPLE);
  is(r.grps >= 3, '  묶음이 ' + r.grps + '개 선다');
  is(r.cells === 6, '  값이 있는 담보 여섯 개만 그린다 — ' + r.cells + '개');
  is(r.halves === r.cells * 2, '  칸마다 <지금·바꾸면> 둘이다 — ' + r.halves + '칸');
  is(/권장금액/.test(r.txt) && /가입금액/.test(r.txt), '  권장금액 · 가입금액 축을 적는다');

  console.log('\n[2] 지금과 바꾸면이 둘 다 보인다');
  const vis = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('#gbox .bg-cell').forEach(c => {
      const nm = (c.querySelector('.bg-nm') || {}).textContent || '';
      const bars = c.querySelectorAll('.bg-bar');
      const o = c.querySelector('.bg-bar.old'), n = c.querySelector('.bg-bar.new');
      out.push({ nm: nm, n: bars.length,
                 oh: o ? o.style.height : '', nh: n ? n.style.height : '',
                 tags: [].map.call(c.querySelectorAll('.bg-tag'), t => t.textContent).join('/') });
    });
    return out;
  });
  is(vis.every(v => v.n === 2), '  칸마다 막대가 둘 있다');
  is(vis.every(v => v.tags === '지금/바꾸면'), '  왼쪽 「지금」 · 오른쪽 「바꾸면」 이라 적혀 있다');
  /* 브라우저가 style.height 를 「60.0%」→「60%」 로 다듬는다. 글자로 견주면
     멀쩡한 코드를 틀렸다고 부른다 — 숫자로 견준다. */
  const pc = v => parseFloat(String(v || '').replace('%', ''));
  const brain = vis.filter(v => /뇌혈관/.test(v.nm))[0];
  is(brain && pc(brain.oh) === 60 && pc(brain.nh) === 100,
     '  뇌혈관 권장 2,000 — 지금 1,200(60%) → 바꾸면 3,000(100%) : ' +
     (brain ? brain.oh + ' → ' + brain.nh : '없다'));
  const dem = vis.filter(v => /중증치매/.test(v.nm))[0];
  is(dem && pc(dem.oh) === 0 && pc(dem.nh) === 100,
     '  지금이 0 이어도 <지금 칸>이 사라지지 않는다 — ' +
     (dem ? (dem.oh || '0%') + ' → ' + dem.nh : '없다'));
  is(/5,000만 → 1억|1,200만 → 3,000만/.test(r.txt.replace(/\s+/g, ' ')) ||
     /→/.test(r.txt), '  칸 밑에 「지금 → 바꾸면」 금액을 적는다');

  console.log('\n[3] 준비정도를 옳게 센다');
  /* 판정은 <바꾸면> 기준이다 — 오늘 정하실 것을 말하는 자리이므로 */
  is(r.tally.o === 6 && r.tally.w === 0 && r.tally.d === 0 && r.tally.x === 0,
     '  개선안이 다 권장까지 차면 여섯 개 모두 충분 — ' + JSON.stringify(r.tally));
  const only = await seed({ cancer: [5000, 5000], brain: [1200, 1200], mi: [400, 400], dem2: [0, 0] });
  is(only.tally.o === 1 && only.tally.w === 1 && only.tally.d === 1,
     '  충분1 · 주의1 · 부족1 로 갈린다 — ' + JSON.stringify(only.tally));
  is(only.cells === 3, '  둘 다 0 인 담보(중증치매)는 아예 안 그린다 — ' + only.cells + '개');
  const cut = await page.evaluate(() => ({
    o: babaReadyOf(1000, 1000).t, w: babaReadyOf(1000, 500).t,
    d: babaReadyOf(1000, 499).t, x: babaReadyOf(1000, 0).t,
    none: babaReadyOf(0, 500)
  }));
  is(cut.o === '충분' && cut.w === '주의' && cut.d === '부족' && cut.x === '미가입',
     '  100% 충분 / 50% 주의 / 49.9% 부족 / 0 미가입 — ' + [cut.o, cut.w, cut.d, cut.x].join(' '));
  is(cut.none === null, '  권장금액이 없으면 판정하지 않는다 — 없는 기준으로 매기지 않는다');

  console.log('\n[4] 권장금액 표는 한 벌이다');
  const html = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is((html.match(/function babaRec\s*\(/g) || []).length === 1,
     '  babaRec() 이 하나뿐이다 — 인체 한 장과 같은 표를 쓴다');
  is((html.match(/var BABA_REC_KEY\s*=/g) || []).length === 1, '  저장하는 자리도 하나다');
  const same = await page.evaluate(() => {
    const rec = babaRec(), body = {};
    BABA_BODY.forEach(g => g.rows.forEach(r => { body[r[0]] = r[1]; }));
    const keys = Object.keys(body);
    return { n: keys.length, ok: keys.every(k => rec[k] === body[k]) };
  });
  is(same.ok && same.n > 30, '  게이지가 인체 한 장의 ' + same.n + '개 권장금액을 그대로 쓴다');
  const edit = await page.evaluate(() => {
    babaRecSet('cancer', 8000);
    const g = babaGaugeHtml();
    localStorage.removeItem(BABA_REC_KEY);
    return /8,000만/.test(g);
  });
  is(edit, '  권장금액을 고치면 게이지가 따라 바뀐다');

  console.log('\n[5] 값이 없으면 지어내지 않는다');
  const zero = await seed({});
  is(zero.cells === 0, '  그릴 담보가 없으면 한 칸도 안 그린다');
  is(/없는 숫자는 만들지 않습니다/.test(zero.txt), '  「없는 숫자는 만들지 않습니다」 라고 적는다');

  console.log('\n[6] 권장금액이 무엇인지 밝힌다');
  is(/설계사가 정한 기준/.test(r.txt), '  「설계사가 정한 기준」 이라고 적는다');
  is(/법이나 회사가 정한 값이 아닙니다/.test(r.txt), '  법·회사가 정한 값이 아니라고 못 박는다');
  is(/기본값/.test(r.txt), '  아직 안 고쳤으면 기본값이라고 알려 준다');
  is(/단위는 <b>만원<\/b>|단위는 만원/.test(r.txt.replace(/\s+/g, ' ')) || /만원/.test(r.txt),
     '  단위가 만원이라고 적는다');
  is(/심사 결과에 따릅니다/.test(r.txt), '  실제 가입은 심사에 따른다고 밝힌다');

  console.log('\n[7] 콘솔이 조용하다');
  is(errs.length === 0, '  오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log(bad ? '\n✗ ' + bad + '개 어긋남\n'
                  : '\n──────────────────────────────\n준비정도 게이지 점검 통과 — 다 맞습니다.\n');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
