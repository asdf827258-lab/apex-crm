/* 🥇 제안 순위 · 💡 추가 제안 — 판 X396

   사장님 말씀 2026-11-10 「내가 제안서를 넣으면 1순위 2순위 3순위를 넣어줘 · 만약 제안서가 없다면
   추가 제안과 그 이유를 타당하게 만들어서 알려주고」.

     [1] 제안서가 없으면 — 비어 있는 묶음을 급한 순서로 세 개, 권장 금액은 표준 × 나이 배수 그대로(지어낸 숫자 없음)
     [2] 넓은 담보가 있으면 좁은 담보를 따로 권하지 않는다(뇌혈관 ⊃ 뇌졸중 ⊃ 뇌출혈)
     [3] 제안서가 셋이면 — 급한 빈자리를 많이 채우는 순 · 빈자리를 안 채우면 맨 뒤 · 같으면 보험료 적은 쪽
     [4] 계약 카드에 「1순위」 표시 · 발표 화면에 「제안 순위」 장(짧게 보기에도 남는다)
     [5] 나이를 안 적었으면 설계 순서로 매기고 그렇게 밝힌다
     [6] 조용한가                                                                                   */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd();
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

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1400, height: 1000 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.route('**/*', r => /^http:\/\/127\.0\.0\.1/.test(r.request().url()) ? r.continue() : r.abort());
  await pg.goto('http://127.0.0.1:' + port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(800);

  /* 표본 고객(45세) — 실손 · 암 2,000 · 뇌졸중 2,000 · 급성심근경색 3,000 · 운전자는 해지 */
  const A = await pg.evaluate(() => {
    localStorage.clear(); window.confirm = () => true; doSample(); S.after = []; save(); go('edit');
    const fold = document.getElementById('baRank'), folded = { tag: fold.tagName, open: fold.open, sum: fold.querySelector('summary').innerText };
    S.rankOpen = true; save(); go('edit');
    const G = rankSuggest(), b = ageBand();
    const box = document.getElementById('baRank');
    return { band: b && b.k, n: G.n, pick: G.pick.map(x => ({ mid: x.g.mid, p: x.pr.p, why: x.pr.why, rows: x.rows.map(r => [r.k, r.have, r.t, r.need]) })),
      exp: G.pick.map(x => x.rows.filter(r => r.t !== null).every(r => r.t === agePlanAmt(SSTD[r.k], agePlanOf(b.k, x.g.mid).m))),
      html: box ? box.innerText : '', folded };
  });
  head('[1] 제안서가 없으면 — 추가 제안 세 개와 이유');
  is(A.folded.tag === 'DETAILS' && !A.folded.open && /1순위/.test(A.folded.sum) && /3순위/.test(A.folded.sum), '만들기 화면에서는 한 줄로 접혀 순위만 — 「' + A.folded.sum + '」');
  is(A.band === '40', '나이 45 → 40대 담보안으로 셈 — ' + A.band);
  is(A.pick.length === 3 && A.pick.every(x => x.p >= 1), '비어 있는 묶음에서 급한 것 세 개 — ' + A.pick.map(x => x.mid + '(' + x.p + ')').join(' · '));
  is(A.pick.every((x, i) => i === 0 || A.pick[i - 1].p <= x.p), '「지금 바로」 묶음이 「그다음」 보다 앞');
  is(A.exp.every(Boolean), '권장 금액 = 표준 × 40대 배수(agePlanAmt) 그대로 — 지어낸 숫자 없음');
  is(A.pick.every(x => x.why && x.why.length > 5), '묶음마다 이유(40대 담보안의 「왜」)가 붙는다');
  is(/추가 제안/.test(A.html) && /1순위/.test(A.html) && /3순위/.test(A.html) && /사내 상담 기준/.test(A.html), '만들기 화면 ③ 에 「💡 추가 제안」 1~3순위 · 「사내 상담 기준」');

  head('[2] 넓은 담보가 덮는 자리는 따로 권하지 않는다');
  const B = await pg.evaluate(() => {
    const all = rankSuggest(); const brainG = all.pick.concat([]).find(x => x.g.mid === '뇌');
    S.before = [{ id: nid(), co: '', nm: '뇌', act: 'keep', cov: { brain: '2000' }, cov2: {} }]; save();
    const G2 = rankSuggest(), g2 = G2.all.find(x => x.g.mid === '뇌'), have = rankHave('brainh', rankBase());
    S.before = []; save();
    const G3 = rankSuggest(), g3 = G3.all.find(x => x.g.mid === '뇌');
    return { have, rows2: g2 ? g2.rows.map(r => r.k) : [], rows3: g3 ? g3.rows.map(r => r.k) : null, circ: G3.pick.map(x => x.g.mid) };
  });
  is(B.have === 2000, '뇌혈관 2,000 이 있으면 뇌출혈 자리도 2,000 이 있는 것으로 본다 — ' + B.have);
  is(!B.rows2.some(k => /^(stroke|brainh|braini|brain)$/.test(k)), '뇌혈관 2,000 이 있으면 뇌 묶음에서 진단(뇌졸중 · 뇌출혈 · 뇌경색)을 권하지 않는다 — ' + B.rows2.join(','));
  is(!B.rows3 || (B.rows3.indexOf('brain') >= 0 && B.rows3.indexOf('brainh') < 0 && B.rows3.indexOf('stroke') < 0), '아무것도 없으면 가장 넓은 뇌혈관 하나만 권한다 — ' + (B.rows3 || []).join(','));
  is(!(B.circ.indexOf('순환계 (뇌+심장)') >= 0 && (B.circ.indexOf('뇌') >= 0 || B.circ.indexOf('심장') >= 0)), '뇌 · 심장과 순환계를 함께 고르지 않는다 — ' + B.circ.join(' · '));

  head('[3] 제안서가 셋이면 — 1 · 2 · 3순위');
  const C = await pg.evaluate(() => {
    localStorage.clear(); doSample(); S.after = []; S.rankOpen = true;
    S.after.push({ id: 'pZ', co: 'Z손보', nm: '이미 있는 것만', term: '90세만기', start: '2026-11', years: '20', premMan: '1', cov: { silD: '5000' }, ext: [] });
    S.after.push({ id: 'pB', co: 'B손보', nm: '골절 플랜', term: '90세만기', start: '2026-11', years: '20', premMan: '2', cov: { frac: '30', burn: '30' }, ext: [] });
    S.after.push({ id: 'pA', co: 'A손보', nm: '암 플랜', term: '90세만기', start: '2026-11', years: '20', premMan: '8', cov: { cancer: '5000', cantx: '3000' }, ext: [] });
    save(); go('edit');
    const L = rankProps();
    const tags = {}; document.querySelectorAll('.pol.new').forEach(c => { const t = c.querySelector('.tag[class*="rk"]'); tags[c.querySelector('b').innerText] = t ? t.innerText : ''; });
    /* 같은 점수 둘 — 보험료가 적은 쪽이 앞 */
    S.after = [{ id: 't1', nm: '비싼 쪽', premMan: '9', cov: { burn: '30' }, ext: [] }, { id: 't2', nm: '싼 쪽', premMan: '3', cov: { burn: '30' }, ext: [] }];
    const T = rankProps();
    return { order: L.map(x => x.p.id + ':' + x.rank + ':' + x.sc), zero: L.find(x => x.p.id === 'pZ').sc,
      partsA: L.find(x => x.p.id === 'pA').parts.map(x => [x.k, x.have, x.t, x.add]),
      html: document.getElementById('baRank').innerText, tags, tie: T.map(x => x.p.id), tieFlag: T[1].tie };
  });
  is(C.order[0].startsWith('pA:1') && C.order[1].startsWith('pB:2') && C.order[2].startsWith('pZ:3'), '암(지금 바로) 1 · 골절 2 · 이미 있는 것만 3 — ' + C.order.join(' / '));
  is(C.zero === 0, '실손을 이미 갖춘 분께 실손만 다시 넣는 제안은 채우는 빈자리 0');
  is(C.partsA.some(x => x[0] === 'cancer' && x[1] === 2000 && x[3] === x[2] - 2000), '암 플랜 — 지금 2,000 에서 기준까지 모자란 만큼만 「채움」 으로 센다 — ' + JSON.stringify(C.partsA));
  is(/제안 순위/.test(C.html) && /1순위/.test(C.html) && /새로 채우는 빈자리가 없습니다/.test(C.html), '「🥇 제안 순위」 에 이유 · 빈자리 없는 제안은 그렇다고 적는다');
  is(C.tie.join() === 't2,t1' && C.tieFlag, '채우는 정도가 같으면 월 보험료가 적은 쪽이 앞 — 그렇다고 적는다');

  head('[4] 카드 표시 · 발표 화면');
  is(C.tags['암 플랜'] === '1순위' && C.tags['골절 플랜'] === '2순위' && C.tags['이미 있는 것만'] === '3순위', '계약 카드에 순위 표시 — ' + JSON.stringify(C.tags));
  const D = await pg.evaluate(() => {
    localStorage.clear(); doSample(); S.after = [{ id: 'pA', co: 'A손보', nm: '암 플랜', premMan: '8', cov: { cancer: '5000' }, ext: [] }]; save();
    go('show'); const s1 = document.getElementById('sRank');
    const r = { has: !!s1, nm: s1 && s1.getAttribute('data-nm'), txt: s1 ? s1.innerText : '' };
    baSeePreset('short'); r.short = seeOn('sRank');
    S.after = []; save(); render(); const s2 = document.getElementById('sRank');
    r.nm2 = s2 && s2.getAttribute('data-nm'); r.txt2 = s2 ? s2.innerText : '';
    return r;
  });
  is(D.has && D.nm === '제안 순위' && /오늘 제안 드리는 순서/.test(D.txt) && /암 플랜/.test(D.txt), '발표 화면에 「오늘 제안 드리는 순서」 장');
  is(D.short === true, '「짧게 보기」 에도 제안 순위 장은 남는다');
  is(D.nm2 === '추가 제안' && /더 넣으신다면 이 순서로/.test(D.txt2) && /1순위/.test(D.txt2), '제안이 없으면 같은 자리에 「더 넣으신다면 이 순서로」');

  head('[5] 나이를 모르면 설계 순서로');
  const E = await pg.evaluate(() => {
    S.who.age = ''; S.after = []; S.rankOpen = true; save(); go('edit');
    const G = rankSuggest(); return { src: G.pick.map(x => x.pr.src), html: document.getElementById('baRank').innerText };
  });
  is(E.src.length && E.src.every(s => /설계 순서/.test(s)), '설계 순서 번호로 매김 — ' + E.src.join(' · '));
  is(/나이를 적으시면/.test(E.html), '「고객 나이를 적으시면 나이대 기준으로 다시 매깁니다」');

  head('[6] 조용한가');
  is(errs.length === 0, '페이지 에러 ' + errs.length + '건' + (errs.length ? ' — ' + errs.join(' / ') : ''));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '✗ ' + bad + '가지 빨간불' : '✓ 제안서가 있으면 1 · 2 · 3순위와 이유, 없으면 빈자리로 추가 제안과 이유');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('ERR', e); process.exit(1); });
