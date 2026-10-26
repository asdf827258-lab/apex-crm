/* 📱 계산기 대시보드가 폰에서 잘리지 않나 · 모자라는 돈에 「−」 가 붙나 (판 X218)

   사장님 말씀 2026-10-26 「재무설계 계산기 띄워」 → 「응 우선 고쳐봐」.
   실제 사이트를 폰(390)으로 열어 찍어 보니 셋이 깨져 있었습니다.

     가. 대시보드 머리 — 「🖨 보고서 출력 · 🧭 함께 점검 상담 · 📊 한눈에 결과」 가 제목과 한 줄에 끼어
         오른쪽 끝이 잘렸고 「함께 / 점검 / 상담」 처럼 세 줄로 꺾였습니다 → 좁으면 제목 아래 줄로
     나. 「월 잉여금 99만 ⚠ 적자」 — 모자라는 돈인데 「−」 가 없어 남는 돈처럼 읽혔습니다(1번)
         → 모자라면 「월 모자라는 돈 −99만」, 남으면 「월 잉여금」
     다. 두 칸 격자(.g2)가 칸마다 160px 로 눌려 「재무 건전성 점수」 오른쪽 글이 칸 밖으로 잘렸습니다 → 좁으면 한 칸.
         PC(1280)에서는 그대로 두 칸

   되돌려 보기 — .dash-act 의 줄바꿈을 빼면 가 가 · Math.abs 앞의 「−」 를 빼면 나 가 · .g2 한 칸을 빼면 다 가 웁니다. */
const path = require('path');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  const open = async (w) => { const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    await ctx.route('**://**', (r) => /^(file|data|blob):/.test(r.request().url()) ? r.continue() : r.abort());
    const pg = await ctx.newPage(); pg.errs = []; pg.on('pageerror', (e) => pg.errs.push(e.message)); pg.on('dialog', (d) => d.accept());
    await pg.goto('file://' + path.join(ROOT, 'app/finance.html'));
    await pg.waitForFunction(() => typeof finSample === 'function', null, { timeout: 15000 });
    await pg.evaluate(() => finSample()); await pg.waitForTimeout(400); return pg; };
  const pg = await open(390);

  head('가. 대시보드 머리 단추가 폰에서 안 잘린다');
  const a = await pg.evaluate(() => { const W = document.documentElement.clientWidth;
    return { W, doc: document.documentElement.scrollWidth, btn: [...document.querySelectorAll('#tab-dashboard .sec-hd button')].map((x) => { const q = x.getBoundingClientRect(), lh = parseFloat(getComputedStyle(x).lineHeight) || 20; return { t: x.textContent.trim(), right: q.right, h: q.height, lines: Math.round((q.height - parseFloat(getComputedStyle(x).paddingTop) - parseFloat(getComputedStyle(x).paddingBottom)) / lh) }; }) }; });
  is(a.btn.length === 3, '머리 단추 셋 — ' + a.btn.map((x) => x.t).join(' · '));
  is(a.btn.every((x) => x.right <= a.W - 8), '셋 다 화면 안(오른쪽 여백 8px 이상)' + a.btn.filter((x) => x.right > a.W - 8).map((x) => ' — ' + x.t + ' ' + Math.round(x.right) + 'px').join(''));
  is(a.btn.every((x) => x.lines <= 1), '단추 글자가 한 줄 — 「함께 / 점검 / 상담」 처럼 꺾이지 않는다' + a.btn.filter((x) => x.lines > 1).map((x) => ' — ' + x.t + ' ' + x.lines + '줄').join(''));
  is(a.doc <= a.W, '대시보드가 옆으로 넘치지 않는다 (' + a.doc + ' / ' + a.W + ')');

  head('나. 모자라는 돈에 「−」');
  const m1 = await pg.evaluate(() => { const c = [...document.querySelectorAll('#dash-metrics .mb')].pop(); return { l: c.querySelector('.ml').textContent, v: c.querySelector('.mv').textContent.trim(), s: finCore().surplus }; });
  is(m1.s < 0 && m1.l === '월 모자라는 돈' && m1.v.startsWith('−' + Math.abs(m1.s)), '견본(남는 돈 ' + m1.s + ') — 「월 모자라는 돈 −' + Math.abs(m1.s) + '만」 — 지금: ' + m1.l + ' ' + m1.v);
  const m2 = await pg.evaluate(() => { const e = document.getElementById('s_gross'); e.value = '9000'; e.dispatchEvent(new Event('input', { bubbles: true })); render();
    const c = [...document.querySelectorAll('#dash-metrics .mb')].pop(); return { l: c.querySelector('.ml').textContent, v: c.querySelector('.mv').textContent.trim(), s: finCore().surplus }; });
  is(m2.s > 0 && m2.l === '월 잉여금' && !/^[−-]/.test(m2.v), '남으면(' + m2.s + ') 「월 잉여금」 · 「−」 없음 — 지금: ' + m2.l + ' ' + m2.v);

  head('다. 두 칸 격자가 폰에서 한 칸 · PC 는 그대로');
  const c1 = await pg.evaluate(() => { const g = document.querySelector('#tab-dashboard .g2'), cols = getComputedStyle(g).gridTemplateColumns.split(' ').length, r = [];
    document.querySelectorAll('#tab-dashboard .card').forEach((c) => { const q = c.getBoundingClientRect(); c.querySelectorAll('*').forEach((e) => { const z = e.getBoundingClientRect(); if (z.width && z.right > q.right + 1 && e.children.length === 0 && e.textContent.trim()) r.push(e.textContent.trim().slice(0, 10)); }); });
    return { cols, clip: [...new Set(r)].slice(0, 5) }; });
  is(c1.cols === 1, '폰(390)에서 .g2 는 한 칸 (지금 ' + c1.cols + '칸)');
  is(!c1.clip.length, '대시보드 카드 밖으로 잘린 글자 0' + (c1.clip.length ? ' — ' + c1.clip.join(' · ') : ''));
  const pc = await open(1280);
  const c2 = await pc.evaluate(() => getComputedStyle(document.querySelector('#tab-dashboard .g2')).gridTemplateColumns.split(' ').length);
  is(c2 === 2, 'PC(1280)에서는 그대로 두 칸 (지금 ' + c2 + '칸)');
  is(!pg.errs.length && !pc.errs.length, '페이지 오류 0' + (pg.errs.concat(pc.errs).length ? ' — ' + pg.errs.concat(pc.errs)[0] : ''));
  await b.close();
  console.log('\n' + (bad ? '✗ ' + bad + '개 어긋남 — 폰 대시보드를 고객 앞에 세울 수 없습니다' : '✓ 폰 대시보드 — 머리 단추 안 잘림 · 모자라는 돈 「−」 · 두 칸 격자 한 칸'));
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
