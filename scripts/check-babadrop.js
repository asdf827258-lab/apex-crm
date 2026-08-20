/* 비포·애프터가 <b>스스로</b> 맞는가.

   사장님 말씀은 이랬다 — 「해지라고 하면 그 보험이 빠진 상태로 담보가
   빠져서, 비포 애프터에 대한 담보가 눈에 확연히 보이게」.

   그 전제는 <b>정확히 읽는 것</b>이다. 실제로 이런 것이 있었다.

     · 계약 세 건의 월 보험료가 <b>모두 첫 계약 값</b>으로 찍혔다.
       앞뒤 120자로 읽으니 앞 계약이 짧으면 그 보험료를 집었다.
     · 「암진단비(유사암제외)」 의 「유사암」 을 유사암 보장으로 집어
       <b>있지도 않은 3,000만원</b>을 만들어 냈다.

   없는 보장을 있다고 말하는 것은 숫자가 조금 틀린 것과 다르다.
   고객 앞에서 그 자리에 무너진다. 그래서 여기서 못 박는다.

     1. 계약마다 <b>제 보험료</b>를 읽는다 — 앞 계약 것을 베끼지 않는다
     2. 「제외」 라고 적힌 말을 <b>보장으로 만들지 않는다</b>
     3. 해지를 찍으면 그 계약 담보가 <b>기존에서 빠진다</b>
     4. 유지로 되돌리면 숫자가 <b>그대로 돌아온다</b> — 원본은 안 건드린다
     5. 제안서에 <b>얼마나 비는지</b>가 눈에 보이게 선다
     6. 인쇄가 안 짤린다 — 한 쪽보다 긴 것에 「쪼개지 마라」 를 걸지 않는다  */
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

/* 회사가 뽑아 주는 가입설계서 꼴. 견본이므로 고객 이름은 홍길동이다.
   보험료가 계약마다 다르다 — 84,300 / 22,400 / 28,000. */
const BEFORE = [
  '가입설계서  계약자 홍길동  피보험자 홍길동  40세 남',
  '삼성화재 (무)무배당 마이헬스파트너 종합보험  보험기간 100세  납입기간 20년  월보험료 84,300원',
  '  담보명            가입금액',
  '  암진단비(유사암제외)   5,000만원',
  '  유사암진단비           1,000만원',
  '  뇌혈관질환진단비       2,000만원',
  '  질병입원일당           3만원',
  '현대해상 (무)무배당 굿앤굿실손의료비보험  보험기간 100세  월보험료 22,400원',
  '  담보명            가입금액',
  '  질병입원의료비         5,000만원',
  'DB손해보험 (무)무배당 어린이종합보험  보험기간 100세  월보험료 28,000원',
  '  담보명            가입금액',
  '  급성심근경색진단비     1,000만원'
].join('\n');

const AFTER = [
  '가입설계서  계약자 홍길동  40세 남',
  '메리츠화재 (무)무배당 올바른치료보험  월보험료 96,000원',
  '  암진단비(유사암제외)   1억원',
  '  유사암진단비           2,000만원',
  '  뇌혈관질환진단비       3,000만원',
  '  급성심근경색진단비     3,000만원'
].join('\n');

/* 「유사암」 줄이 아예 없는 자료. 여기서 유사암이 잡히면 지어낸 것이다. */
const ONLY = [
  '가입설계서  계약자 홍길동',
  '삼성화재 (무)무배당 마이헬스파트너 종합보험  월보험료 84,300원',
  '  암진단비(유사암제외)   5,000만원',
  '  뇌혈관질환진단비       2,000만원'
].join('\n');

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n[1] 계약마다 제 보험료를 읽는다 — 앞 계약 것을 베끼지 않는다');
  const pl = await page.evaluate((t) => {
    const L = babaPlanScan(t);
    return L.map(x => ({ nm: x.nm, prem: x.prem, cov: x.cov || {} }));
  }, BEFORE);
  is(pl.length === 3, '  계약 세 건을 세운다 — ' + pl.length + '건');
  const prem = pl.map(x => x.prem);
  is(prem[0] === 84300, '  첫 계약 84,300원 — ' + prem[0]);
  is(prem[1] === 22400, '  둘째 계약 22,400원 — ' + prem[1] + (prem[1] === 84300 ? ' (앞 계약을 베꼈다)' : ''));
  is(prem[2] === 28000, '  셋째 계약 28,000원 — ' + prem[2] + (prem[2] === 84300 ? ' (앞 계약을 베꼈다)' : ''));
  is(new Set(prem).size === 3, '  셋이 서로 다른 값이다');

  console.log('\n[2] 「제외」 라고 적힌 말을 보장으로 만들지 않는다');
  const sc = await page.evaluate((t) => {
    const s = babaScan(t), o = {};
    for (const k in s) if (s[k] && s[k].won) o[k] = { won: s[k].won, raw: s[k].raw };
    return o;
  }, BEFORE);
  is(sc.cancer && sc.cancer.won === 5000, '  일반암 5,000만원 — ' + (sc.cancer ? sc.cancer.won : 'null'));
  is(sc.cancer2 && sc.cancer2.won === 1000,
     '  유사암은 제 줄에서 1,000만원 — ' + (sc.cancer2 ? sc.cancer2.won : 'null'));
  const only = await page.evaluate((t) => {
    const s = babaScan(t);
    return { c: s.cancer ? s.cancer.won : null, c2: s.cancer2 ? s.cancer2.won : null,
             raw: s.cancer2 ? s.cancer2.raw : '' };
  }, ONLY);
  is(only.c === 5000, '  유사암 줄이 없어도 일반암은 읽는다 — ' + only.c);
  is(only.c2 === null,
     '  유사암 줄이 없으면 유사암은 <b>모름</b> 이다 — ' + (only.c2 === null ? '모름' : only.c2 + ' / ' + only.raw));

  console.log('\n[3] 해지를 찍으면 그 계약 담보가 기존에서 빠진다');
  const drop = await page.evaluate((d) => {
    localStorage.removeItem(BABA_PLAN_KEY);
    BABA.plans = null; babaPlans();
    const bm = babaScan(d.b), am = babaScan(d.a);
    BABA.rows = BABA_TERMS.map(t => {
      const b = bm[t.k] || null, a = am[t.k] || null;
      return { k: t.k, n: t.n, b: b ? b.won : null, a: a ? a.won : null, raw: (b && b.raw) || '' };
    });
    babaPlanMerge(babaPlanScan(d.b), 'b');
    babaPlanMerge(babaPlanScan(d.a), 'a');
    const at = (k) => { const v = babaRowsV().filter(r => r.k === k)[0]; return v ? v.b : null; };
    const raw = (k) => { const v = (BABA.rows || []).filter(r => r.k === k)[0]; return v ? v.b : null; };
    const before = { cancer: at('cancer'), cancer2: at('cancer2'), brain: at('brain') };
    const tgt = babaPlans().filter(x => x.slot === 'b' && /마이헬스/.test(x.nm))[0];
    if (!tgt) return { err: 'no target', plans: babaPlans().map(x => x.nm) };
    const cov = tgt.cov || {};
    let err = '';
    try { babaPlanSet(tgt.id, 'keep', 'drop'); } catch (e) { err = String(e).slice(0, 90); }
    const after = { cancer: at('cancer'), cancer2: at('cancer2'), brain: at('brain') };
    const rawAfter = { cancer: raw('cancer'), brain: raw('brain') };
    const rows = babaDropRows().map(r => r.n + ' ' + r.b0 + '→' + r.b);
    let deck = '';
    try { deck = babaPlanDeckHtml(); } catch (e) { deck = 'ERR ' + e; }
    try { babaPlanSet(tgt.id, 'keep', 'keep'); } catch (e) {}
    const back = { cancer: at('cancer'), cancer2: at('cancer2'), brain: at('brain') };
    return { err, cov, before, after, rawAfter, back, rows,
             deckHas: deck.indexOf('해지하시면 이만큼 빕니다') >= 0,
             n: babaDropCount() };
  }, { b: BEFORE, a: AFTER });

  is(!drop.err, '  유지·해지를 찍어도 화면이 안 깨진다' + (drop.err ? ' — ' + drop.err : ''));
  is(drop.cov && drop.cov.cancer === 5000,
     '  그 계약이 제 담보를 들고 있다 — ' + JSON.stringify(drop.cov || {}));
  is(drop.before && drop.before.cancer === 5000, '  해지 전 일반암 5,000 — ' + (drop.before || {}).cancer);
  is(drop.after && drop.after.cancer === 0,
     '  해지 후 일반암 0 — ' + (drop.after || {}).cancer + ' (그 계약이 들고 있던 5,000이 빠진다)');
  is(drop.after && drop.after.brain === 0, '  해지 후 뇌혈관 0 — ' + (drop.after || {}).brain);
  is(drop.rows && drop.rows.length >= 2, '  빠지는 담보를 줄줄이 말해 준다 — ' + (drop.rows || []).join(' / '));
  is(drop.deckHas, '  제안서에 「해지하시면 이만큼 빕니다」 가 선다');

  console.log('\n[4] 유지로 되돌리면 숫자가 그대로 돌아온다 — 원본은 안 건드린다');
  is(drop.rawAfter && drop.rawAfter.cancer === 5000,
     '  해지를 찍어도 원본 BABA.rows 는 그대로 5,000 — ' + (drop.rawAfter || {}).cancer);
  is(drop.back && drop.back.cancer === 5000, '  유지로 되돌리면 5,000 — ' + (drop.back || {}).cancer);
  is(drop.back && drop.back.brain === 2000, '  뇌혈관도 2,000 으로 돌아온다 — ' + (drop.back || {}).brain);

  console.log('\n[5] 인쇄가 안 짤린다 — 긴 것에 「쪼개지 마라」 를 걸지 않는다');
  const css = await page.evaluate(() => {
    let c = '';
    try { c = babaPropCss(); } catch (e) { c = 'ERR'; }
    /* 인쇄 규칙이 여러 덩이로 나뉘어 있다 — 괄호를 맞춰 전부 모은다 */
    let pr = '', i = 0;
    for (;;) {
      const at = c.indexOf('@media print{', i);
      if (at < 0) break;
      let d = 0, j = at + 12;
      for (; j < c.length; j++) {
        if (c[j] === '{') d++;
        else if (c[j] === '}') { d--; if (!d) break; }
      }
      pr += c.slice(at, j + 1);
      i = j + 1;
    }
    return { ok: c !== 'ERR', pr: pr };
  });
  is(css.ok, '  인쇄 규칙을 만들어 낸다');
  is(/\.bp-sec\{[^}]*break-before:page/.test(css.pr), '  장마다 새 쪽에서 시작한다');
  is(!/\.bp-sec\{[^}]*break-inside:avoid/.test(css.pr),
     '  장 전체에 「쪼개지 마라」 를 걸지 않는다 (한 쪽보다 길면 잘린다)');
  is(!/[^-]table\{[^}]*break-inside:avoid/.test(css.pr),
     '  긴 표에 「쪼개지 마라」 를 걸지 않는다');
  is(/thead\{display:table-header-group/.test(css.pr), '  표가 넘어가면 머리글을 다시 찍는다');
  is(/tr\{[^}]*break-inside:avoid/.test(css.pr), '  표의 한 줄은 반 토막 나지 않는다');
  is(/\.bp-pagebar[^}]*display:none/.test(css.pr), '  화면용 쪽 단추는 인쇄에 안 나온다');

  console.log('\n[6] 콘솔이 조용하다');
  is(errs.length === 0, '  오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log(bad ? '\n✗ ' + bad + '개 어긋남\n' : '\n✓ 모두 통과\n');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
