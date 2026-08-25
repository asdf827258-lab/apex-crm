/* 비포&애프터 — <b>유지한 보험이 애프터에 남는가.</b>

   제일 크게 틀렸던 자리입니다. 계약에 「유지」 를 찍어 두고 새 제안서를
   올리면, 애프터가 <b>새 제안서만</b> 되었습니다. 유지한 보험의 담보가
   통째로 사라져, 화면은 <b>기존을 전부 해지한 것</b>과 똑같은 그림이
   되었습니다. 고객이 그 자리에서 「그럼 지금 있는 건 다 없어지는 겁니까」
   라고 묻습니다.

   셈은 이래야 합니다.

       애프터 = 해지 안 한 기존 계약 + 새 제안서

   해지로 찍은 것<b>만</b> 빠집니다. 아직 안 정한 것은 그대로 남습니다 —
   안 정했다는 것은 지금 그대로라는 뜻이지 없애겠다는 뜻이 아닙니다.

   회사 이름도 여기서 봅니다. 담보와 보험료는 맞는데 <b>회사만</b> 틀리던
   자리입니다 — 창 안에서 <b>가장 긴</b> 이름을 골라, 현대해상(4자) 계약에
   이웃한 DB손해보험(6자)이 붙었습니다. 고객은 제 보험사를 압니다.

   여기서 확인합니다.
     1. 회사·상품 이름을 계약마다 <b>제 것으로</b> 읽는가
     2. 애프터에 <b>유지한 보험이 남는가</b> — 명세의 예시 그대로
     3. 전부 유지 · 일부 해지 · 전부 해지가 각각 맞는가
     4. 아직 안 정한 것을 <b>해지로 둔갑</b>시키지 않는가
     5. 원본은 안 건드리는가 — 되돌리면 숫자가 그대로 돌아오는가
     6. 유지·해지를 눌러도 <b>화면이 안 튀는가</b>
     7. 몇 건이 유지·해지·미정인지 <b>세는 곳이 하나인가</b>
     8. 계약 목록이 비면 <b>말해 주는가</b> — 조용히 어긋나던 자리다
     9. <b>이름이 같은 계약</b>이 서로를 지우지 않는가 — 「튼튼건강보험」 은
        회사마다 있다. 이름만 보고 접으면 둘째 계약이 통째로 사라진다        */

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

/* 명세가 든 예시를 그대로 옮긴다. 견본 이름은 홍길동 (CLAUDE.md 3번).
   회사가 <b>일부러 섞여</b> 있다 — 짧은 이름 옆에 긴 이름을 둔다. */
const BEFORE = [
  '가입설계서  계약자 홍길동  피보험자 홍길동  48세 남',
  '삼성화재 (무)무배당 A종합보험  보험기간 100세  월보험료 50,000원',
  '  암진단비(유사암제외)   3,000만원',
  '  뇌혈관질환진단비       1,000만원',
  '현대해상 (무)무배당 B건강보험  보험기간 100세  월보험료 40,000원',
  '  암진단비(유사암제외)   2,000만원',
  '  급성심근경색진단비     1,000만원',
  'KB손해보험 (무)무배당 C라이프플러스보험  보험기간 90세  월보험료 30,000원',
  '  질병수술비             100만원'
].join('\n');
const AFTER = [
  '가입설계서  계약자 홍길동  48세 남',
  '흥국화재 (무)무배당 D치료보험  월보험료 90,000원',
  '  암진단비(유사암제외)   2,000만원',
  '  뇌혈관질환진단비       2,000만원',
  '  허혈성심장질환진단비   2,000만원'
].join('\n');

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  /* 폰 크기에서 재야 화면 튐이 보인다 */
  const page = await browser.newPage({ viewport: { width: 480, height: 820 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 170)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  /* 자료를 읽어 표와 계약 목록을 세운다 */
  const setup = await page.evaluate((d) => {
    /* 이 화면은 로그인해야 열린다. 여기서 재는 것은 로그인 문이 아니라 그 안의 셈이다. */
    window.osTabAllowed = function () { return true; };
    localStorage.removeItem(BABA_PLAN_KEY); localStorage.removeItem(BABA_ROW_KEY);
    BABA.plans = null; babaPlans();
    const bm = babaScan(d.b), am = babaScan(d.a);
    BABA.rows = BABA_TERMS.map(t => {
      const b = bm[t.k] || null, a = am[t.k] || null;
      return { k: t.k, n: t.n, b: b ? b.won : null, a: a ? a.won : null, raw: (b && b.raw) || '' };
    });
    babaSave();
    babaPlanMerge(babaPlanScan(d.b), 'b');
    babaPlanMerge(babaPlanScan(d.a), 'a');
    go('baba');
    return { b: babaPlanOf('b').map(x => ({ co: x.co, nm: x.nm, prem: x.prem, cov: x.cov })),
             a: babaPlanOf('a').map(x => ({ co: x.co, nm: x.nm })) };
  }, { b: BEFORE, a: AFTER });
  await page.waitForTimeout(700);

  console.log('\n[1] 계약마다 제 회사·제 이름·제 보험료를 읽는다');
  const want = [['삼성화재', 'A종합보험', 50000], ['현대해상', 'B건강보험', 40000],
                ['KB손해보험', 'C라이프플러스보험', 30000]];
  is(setup.b.length === 3, '  기존 계약 3건 — ' + setup.b.length + '건');
  want.forEach((w, i) => {
    const g = setup.b[i] || {};
    is(g.co === w[0], '  ' + (i + 1) + '. 회사 ' + (g.co || '(없음)') +
       (g.co === w[0] ? '' : ' ← ' + w[0] + ' 여야 한다 (이웃 회사를 끌어왔다)'));
    is(('' + (g.nm || '')).indexOf(w[1]) >= 0,
       '     상품 ' + (g.nm || '(없음)') + (('' + (g.nm || '')).indexOf(w[1]) >= 0 ? '' : ' ← ' + w[1] + ' 가 들어 있어야 한다'));
    is(g.prem === w[2], '     보험료 ' + g.prem + (g.prem === w[2] ? '' : ' ← ' + w[2]));
  });
  is(setup.a.length === 1 && setup.a[0].co === '흥국화재',
     '  새 제안 1건 — ' + setup.a.map(x => x.co + ' ' + x.nm).join(' / '));

  /* 담보 하나를 뽑아 오는 손잡이 */
  const at = (k) => page.evaluate((k) => {
    const r = babaRowsV().filter(x => x.k === k)[0];
    return r ? { b: r.b, a: r.a } : null;
  }, k);
  const setKeep = (i, v) => page.evaluate(([i, v]) => {
    const L = babaPlanOf('b'); babaPlanSet(L[i].id, 'keep', v);
  }, [i, v]);

  console.log('\n[2] 애프터 = 유지한 기존 + 새 제안서 (명세 §5 예시 그대로)');
  await setKeep(0, 'keep');   /* 삼성화재 A 유지 */
  await setKeep(1, 'drop');   /* 현대해상 B 해지 */
  await setKeep(2, 'keep');   /* KB C 유지 */
  let c = await at('cancer'), br = await at('brain'), h = await at('heart'), mi = await at('mi');
  is(c && c.a === 5000, '  암진단 애프터 5,000 = A 3,000 + 신규 2,000 — ' + (c ? c.a : 'null') +
     (c && c.a === 2000 ? ' (새 제안서만 남았다 — 유지한 A 가 사라졌다)' : ''));
  is(br && br.a === 3000, '  뇌혈관 애프터 3,000 = A 1,000 + 신규 2,000 — ' + (br ? br.a : 'null'));
  is(h && h.a === 2000, '  허혈성 애프터 2,000 = 신규만 (기존에 없던 담보) — ' + (h ? h.a : 'null'));
  is(mi && (mi.a === null || mi.a === 0),
     '  심근경색은 애프터에 없다 — B 를 해지했다 (' + (mi ? mi.a : 'null') + ')');
  is(c && c.b === 3000, '  기존은 해지를 반영해 3,000 — ' + (c ? c.b : 'null'));

  console.log('\n[3] 전부 유지 — 기존 전체가 애프터에 남는다');
  await setKeep(1, 'keep');
  c = await at('cancer'); mi = await at('mi');
  is(c && c.a === 7000, '  암진단 7,000 = A 3,000 + B 2,000 + 신규 2,000 — ' + (c ? c.a : 'null'));
  is(mi && mi.a === 1000, '  심근경색 1,000 이 애프터에 돌아온다 — ' + (mi ? mi.a : 'null'));
  is(c && c.b === 5000, '  기존도 A+B 를 더해 5,000 — ' + (c ? c.b : 'null') +
     (c && c.b === 3000 ? ' (한 계약 것만 집었다)' : ''));

  console.log('\n[4] 전부 해지 — 그때만 애프터가 새 제안서만 된다');
  await setKeep(0, 'drop'); await setKeep(1, 'drop'); await setKeep(2, 'drop');
  c = await at('cancer'); mi = await at('mi');
  is(c && c.a === 2000, '  암진단 애프터 2,000 = 신규만 — ' + (c ? c.a : 'null'));
  is(c && c.b === 0, '  기존은 0 — ' + (c ? c.b : 'null'));

  console.log('\n[5] 아직 안 정한 것을 해지로 둔갑시키지 않는다');
  await setKeep(0, ''); await setKeep(1, ''); await setKeep(2, '');
  const und = await page.evaluate(() => ({
    tally: babaKeepTally(), dropN: babaDropCount(), dropMap: babaDropMap().__n,
    cancer: (babaRowsV().filter(r => r.k === 'cancer')[0] || {}),
    note: (typeof babaUndecNote === 'function') ? babaUndecNote() : ''
  }));
  is(und.tally.undec === 3 && und.tally.drop === 0 && und.tally.keep === 0,
     '  셋 다 미정으로 센다 — ' + JSON.stringify(und.tally));
  is(und.dropN === 0 && und.dropMap === 0, '  해지로 세지 않는다');
  is(und.cancer.b === 5000, '  기존이 안 깎인다 — ' + und.cancer.b);
  is(und.cancer.a === 7000, '  애프터에도 그대로 남는다 — ' + und.cancer.a);
  is(/그대로 두시는 것/.test(und.note),
     '  <b>어떻게 셈했는지 밝힌다</b> — ' + (und.note.replace(/<[^>]+>/g, '') || '(아무 말도 없음)'));

  console.log('\n[6] 원본은 안 건드린다 — 되돌리면 그대로 돌아온다');
  const back = await page.evaluate(() => {
    const raw = (BABA.rows.filter(r => r.k === 'cancer')[0] || {}).b;
    const L = babaPlanOf('b');
    babaPlanSet(L[1].id, 'keep', 'drop');
    const cut = (babaRowsV().filter(r => r.k === 'cancer')[0] || {}).b;
    babaPlanSet(L[1].id, 'keep', 'keep');
    const on = (babaRowsV().filter(r => r.k === 'cancer')[0] || {}).b;
    return { raw: raw, cut: cut, on: on };
  });
  is(back.raw === 3000, '  원본(BABA.rows)은 읽은 그대로 — ' + back.raw);
  is(back.cut === 3000 && back.on === 5000,
     '  해지 3,000 → 유지 5,000 으로 오간다 — ' + back.cut + ' / ' + back.on);

  console.log('\n[7] 유지·해지를 눌러도 화면이 안 튄다 (명세 §4)');
  const jump = await page.evaluate(async () => {
    const pick = () => [].slice.call(document.querySelectorAll('#babaGrid [onclick*="babaPlanSet"]'))
      .filter(b => /'keep'/.test(b.getAttribute('onclick') || ''));
    const btns = pick();
    if (!btns.length) return { none: true };
    const b = btns[btns.length - 1];
    b.scrollIntoView({ block: 'center' });
    await new Promise(r => setTimeout(r, 250));
    const main = document.getElementById('main') || document.scrollingElement;
    const win = document.scrollingElement || document.documentElement;
    const m0 = main.scrollTop, w0 = win.scrollTop, y0 = b.getBoundingClientRect().top;
    b.click();
    await new Promise(r => setTimeout(r, 400));
    const b2 = pick();
    const y1 = b2.length ? b2[b2.length - 1].getBoundingClientRect().top : null;
    return { n: btns.length, main: [m0, main.scrollTop], win: [w0, win.scrollTop],
             seen: [Math.round(y0), y1 === null ? null : Math.round(y1)],
             shift: y1 === null ? null : Math.round(Math.abs(y1 - y0)),
             submit: btns.some(x => (x.getAttribute('type') || '') !== 'button') };
  });
  if (jump.none) { is(false, '  유지·해지 단추를 화면에서 못 찾았다'); }
  else {
    is(jump.n >= 9, '  유지·해지·미정 단추가 계약마다 있다 — ' + jump.n + '개');
    is(!jump.submit, '  단추가 전부 type="button" 이다 — form 이 저절로 넘어가지 않는다');
    is(jump.main[0] === jump.main[1], '  본문 스크롤이 안 움직인다 — ' + jump.main.join(' → '));
    is(jump.win[0] === jump.win[1], '  창 스크롤도 안 움직인다 — ' + jump.win.join(' → '));
    is(jump.shift !== null && jump.shift <= 24,
       '  누른 단추가 눈에서 안 벗어난다 — ' + jump.seen.join('px → ') + 'px (' + jump.shift + 'px)');
  }

  console.log('\n[8] 세는 곳은 하나다 — 편집 칸과 제안서가 같은 숫자를 말한다');
  const same = await page.evaluate(() => {
    const L = babaPlanOf('b');
    babaPlanSet(L[0].id, 'keep', 'keep');
    babaPlanSet(L[1].id, 'keep', 'drop');
    babaPlanSet(L[2].id, 'keep', '');
    const strip = h => { const d = document.createElement('div'); d.innerHTML = h;
                         return d.textContent.replace(/\s+/g, ' '); };
    return { tally: babaKeepTally(),
             edit: strip(babaPlanEditHtml()), deck: strip(babaPlanDeckHtml()) };
  });
  const T = same.tally;
  is(T.all === 3 && T.keep === 1 && T.drop === 1 && T.undec === 1,
     '  유지 1 · 해지 1 · 미정 1 — ' + JSON.stringify(T));
  ['유지 1건', '해지 1건'].forEach(w => {
    is(same.edit.indexOf(w) >= 0 && same.deck.indexOf(w) >= 0,
       '  편집 칸과 제안서가 둘 다 「' + w + '」 이라고 적는다');
  });
  is(/전체 3건/.test(same.edit), '  편집 칸에 전체 건수가 있다 (명세 §7)');
  is(/아직 안 정함 1건/.test(same.edit) && /아직 안 정함 1건/.test(same.deck),
     '  미정 건수를 양쪽 다 따로 적는다');
  is(/그대로 두시는 것/.test(same.edit),
     '  미정을 어떻게 셈했는지 편집 칸에서도 밝힌다');
  is(/애프터에도 그대로 남습니다|덮어쓰지 않습니다/.test(same.edit),
     '  유지가 애프터에 남는다고 화면에 적어 둔다');

  console.log('\n[9] 계약 목록이 비면 말해 준다 (명세 §8)');
  const empty = await page.evaluate(() => {
    const keep = babaPlans().slice();
    BABA.plans = [];
    const strip = h => { const d = document.createElement('div'); d.innerHTML = h;
                         return d.textContent.replace(/\s+/g, ' '); };
    const why = strip(babaWhyHtml());
    BABA.plans = keep;
    return why;
  });
  is(/계약 목록이 비어 있습니다/.test(empty),
     '  「유지·해지를 찍어도 반영되지 않습니다」 라고 알린다 — ' + empty.slice(0, 90));

  console.log('\n[10] 손으로 적은 표는 건드리지 않는다');
  const hand = await page.evaluate(() => {
    const keep = babaPlans().slice();
    BABA.plans = [];
    BABA.rows = [{ k: 'cancer', n: '암 진단비(일반암)', b: 5000, a: 8000, own: true },
                 { k: 'brain', n: '뇌혈관질환 진단비', b: null, a: 3000, own: true }];
    const v = babaRowsV();
    BABA.plans = keep;
    return v.map(r => ({ k: r.k, b: r.b, a: r.a }));
  });
  is(JSON.stringify(hand) === JSON.stringify([{ k: 'cancer', b: 5000, a: 8000 },
                                              { k: 'brain', b: null, a: 3000 }]),
     '  계약이 없으면 적으신 값 그대로 — ' + JSON.stringify(hand));

  console.log('\n[11] 이름이 같아도 계약이 서로를 지우지 않는다 (명세 §17)');
  const dup = await page.evaluate(() => {
    /* 「튼튼건강보험」 은 회사마다 있다. 이름만 보고 접으면 둘째 계약이
       통째로 사라져 그 담보가 기존에서 빠진다. */
    const T = [
      '가입설계서 계약자 홍길동',
      '삼성화재 (무)무배당 튼튼건강보험  월보험료 30,000원',
      '  암진단비(유사암제외)   1,000만원',
      '현대해상 (무)무배당 튼튼건강보험  월보험료 40,000원',
      '  암진단비(유사암제외)   2,000만원'
    ].join('\n');
    /* 같은 회사가 상품을 여럿 갖고 있어도 갈라야 한다 */
    const S = [
      '가입설계서 계약자 홍길동',
      '삼성화재 (무)무배당 알파종합보험  월보험료 30,000원',
      '  암진단비(유사암제외)   1,000만원',
      '삼성화재 (무)무배당 베타건강보험  월보험료 40,000원',
      '  뇌혈관질환진단비       2,000만원'
    ].join('\n');
    /* 스무 건도 스무 건으로 선다 */
    const CO = ['삼성화재','현대해상','DB손해보험','KB손해보험','메리츠화재',
                '한화손해보험','흥국화재','롯데손해보험','MG손해보험','하나손해보험'];
    let M = '가입설계서 계약자 홍길동';
    for (let i = 0; i < 20; i++)
      M += '\n' + CO[i % CO.length] + ' (무)무배당 P' + (i + 1) + '종합보험  월보험료 ' +
           (10000 + i * 1000) + '원\n  암진단비(유사암제외)   ' + (1000 + i * 100) + '만원';
    const keep = babaPlans().slice();
    localStorage.removeItem(BABA_PLAN_KEY); BABA.plans = null; babaPlans();
    const found = babaPlanScan(T);
    babaPlanMerge(found, 'b');
    const ids = babaPlanOf('b').map(x => x.id);
    const out = { dup: found.map(x => ({ co: x.co, prem: x.prem, cov: x.cov })),
                  ids: ids, uniq: new Set(ids).size,
                  sameco: babaPlanScan(S).map(x => x.nm),
                  many: babaPlanScan(M).length };
    BABA.plans = keep; babaPlanSave();
    return out;
  });
  is(dup.dup.length === 2,
     '  같은 이름·다른 회사는 두 계약으로 — ' + dup.dup.length + '건 ' + JSON.stringify(dup.dup));
  is(dup.dup.length === 2 && dup.dup[0].cov.cancer === 1000 && dup.dup[1].cov.cancer === 2000,
     '  담보도 각자 제 것을 들고 있다');
  is(dup.uniq === dup.ids.length && dup.ids.length === 2,
     '  목록에서도 <b>id 로</b> 갈린다 — ' + dup.ids.length + '건 · 서로 다른 id ' + dup.uniq + '개');
  is(dup.sameco.length === 2,
     '  같은 회사 상품 두 건도 갈린다 — ' + dup.sameco.join(' / '));
  is(dup.many === 20, '  스무 건이 스무 건으로 선다 — ' + dup.many + '건');

  console.log('\n[12] 콘솔이 조용하다');
  is(errs.length === 0, '  오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '✗ ' + bad + '개 어긋남\n'
                  : '유지·해지 점검 통과 — 유지한 보험이 애프터에 그대로 남습니다.\n');
  process.exit(bad ? 1 : 0);
})();
