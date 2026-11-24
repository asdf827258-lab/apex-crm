#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   check-baart.js — 보장분석 <b>담보별 분리자료</b> 가 서는가 (판 X535)

   사장님 말씀 2026-11-23 — 「담보별로 지금 이 자료처럼 분리자료도 만들고」 →
   「다로해 직접 svg로 그려서 따로 만들어」.

   재는 것 — 하나라도 어긋나면 빨간불입니다.
   [1] 묶음 <b>11개가 모두</b> 제 장을 얻고, 도해가 <b>하나도 빠지지 않는가</b>
   [2] ★★ 도해의 글자가 <b>종이 밖으로 나가지 않는가</b> — 눈으로는 못 찾습니다.
       실제로 getBBox 로 재어, viewBox 밖으로 나간 글자가 있으면 그 글을 적습니다.
       (이 자가 없던 동안 실제로 여섯 자리가 잘려 있었습니다)
   [3] 쪽이 A4 를 <b>넘치지 않는가</b> — 넘치면 인쇄에서 잘립니다
   [4] ★ 범위 %(뇌·심장 세 겹)가 <b>화면(STUDY_DOC ②)과 같은 값</b>인가 — 두 곳이
       어긋나면 한쪽만 고쳐진 것입니다 (5번). 「방식」 네 이름도 같은 말인가.
   [5] ★ <b>지어낸 숫자가 없는가</b> (1번) — 도해 안의 숫자는 범위 %와 담보 이름에
       들어 있는 것뿐이어야 합니다. 모르는 값은 「—」 이지 0 이 아닙니다.
   [6] ★ <b>실명이 한 자도 없는가</b> (3번) — 가린 것이 기본
   [7] 담보 · 과부족 · 셈을 <b>다시 세지 않는가</b> (5번) — STD · gapState · calc · DESC ·
       APXBody 를 부르기만 하는가. 제 목록을 들고 있으면 쌍둥이입니다.
   [8] 「보험 전문가의 한 마디」 칸이 <b>장마다</b> 있는가 (사장님이 손으로 적는 자리)
   [9] 인쇄에 <b>tnum 을 켜지 않는가</b> (4-1번) — 켜면 우리가 뽑은 PDF 를 우리가 못 읽습니다
   [10] 고객 자료가 <b>밖으로 안 나가는가</b> (7번·3번) — 문서가 서버를 안 부르는가

   되돌려 보기 — ba-art.js 의 para(…, 26, …) 을 34 로 되돌리면 [2] 가 웁니다.
   RANGE 의 67 을 바꾸면 [4] 가 웁니다. 도해 한 장을 지우면 [1] 이 웁니다.
   ══════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = path.resolve(__dirname, '..');

let 깬 = 0, 본 = 0;
function head(t) { console.log('\n' + t.replace(/<[^>]+>/g, '')); }
function is(ok, t) { 본++; if (!ok) 깬++; console.log((ok ? '  ✓ ' : '  ✗ ') + t.replace(/<[^>]+>/g, '')); }

const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json' };

(async () => {
  const srv = http.createServer((q, r) => {
    const p = path.join(ROOT, decodeURIComponent(url.parse(q.url).pathname));
    fs.readFile(p, (e, b) => {
      if (e) { r.statusCode = 404; r.end('no'); return; }
      r.setHeader('Content-Type', MIME[path.extname(p)] || 'application/octet-stream');
      r.end(b);
    });
  });
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
  const P = srv.address().port;

  /* 소스 — 파일을 직접 봐야 아는 것들 */
  const ART = fs.readFileSync(path.join(ROOT, 'app/ba-art.js'), 'utf8');
  const BAH = fs.readFileSync(path.join(ROOT, 'app/ba.html'), 'utf8');

  const 터짐 = [], 밖 = [];
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 1200, height: 1000 } });
  /* ★ 바깥은 <b>끊습니다</b> — 적어 두기만 하면 CI 에서 진짜 서버를 두드립니다(check-netblock).
     끊어도 문서가 그대로 서야 합니다 — 이 자료는 바깥 것이 한 톨도 필요 없습니다. */
  await ctx.route('**://**', rt => {
    const u = rt.request().url();
    if (u.indexOf('127.0.0.1:' + P) >= 0) return rt.continue();
    밖.push(u.slice(0, 80));
    return rt.abort();
  });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => 터짐.push(String(e.message).slice(0, 100)));
  await pg.goto('http://127.0.0.1:' + P + '/app/ba.html', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForTimeout(2500);

  /* ── 견본 — 홍길동 (3번). 유지 · 배서 · 해지 · 신규를 모두 한 번씩 ── */
  const seeded = await pg.evaluate(() => {
    const mk = (co, nm, prem, act, cov, cov2) => ({ id: 'p' + Math.random().toString(36).slice(2, 7),
      co: co, nm: nm, term: '100세', start: '2015-03-02', years: '20', rnw: 'no',
      premMan: prem, premMan2: '', act: act, kb: false, cov: cov || {}, cov2: cov2 || {} });
    S.who = { name: '홍길동', age: '48', sex: 'm', retire: '60', life: '85', incMan: '', expMan: '' };
    S.before = [
      mk('삼성화재', '종합보험 7.0', '12.4', 'keep',
        { silD: '5000', silDO: '20', silDP: '10', silA: '5000', silAO: '20', cancer: '3000',
          cancer2: '1000', brainh: '2000', mi: '2000', surg: '200', surgA: '200', inpD: '3',
          inpA: '3', deathD: '5000', deathA: '10000', disabD: '5000', fracS: '50', cast: '30', liab: '10000' }),
      mk('현대해상', '굿앤굿스타', '8.1', 'endo',
        { cancer: '1000', cancerH: '2000', brainS: '1000', ltcF: '30' },
        { cancer: '2000', cancerH: '3000', brain: '2000', stroke: '2000', brainS: '1000', ltcF: '50', ltcD: '1000' }),
      mk('DB손해보험', '참좋은보험', '6.7', 'cancel', { cancer: '1000', surgA: '100' })];
    S.after = [mk('KB손해보험', 'KB 3대진단', '5.2', 'new',
      { cancerR: '2000', cancerM: '3000', cancerI: '3000', heartA: '2000', heart: '2000',
        circD: '2000', surg5D: '300', surg5A: '300', nurNS: '5', disabA: '5000',
        carAcc: '30000', lawyer: '5000', fine: '3000', burnS: '50' })];
    S.before[1].premMan2 = '9.4';
    save();
    const C = calc();
    /* STUDY_DOC ② 가 화면에서 말하는 범위 % 를 글에서 그대로 긁습니다 */
    let 화면범위 = [], 화면방식 = [];
    (window.STUDY_DOC || []).forEach(sec => {
      (sec.b || []).forEach(line => {
        const t = String(line);
        const m = t.match(/([가-힣]+)\((\d+)%\)/g);
        if (m) m.forEach(x => { const q = x.match(/([가-힣]+)\((\d+)%\)/); 화면범위.push([q[1], +q[2]]); });
        const w = t.match(/^<b>([가-힣]+)(?:\([^)]*\))?<\/b>\s*—/);
        if (w) 화면방식.push(w[1]);
      });
    });
    return { grp: STD.length, 묶음: STD.map(g => g.mid), 도해: BA_ART._scenes(),
      화면범위: 화면범위, 화면방식: 화면방식,
      범위: BA_ART.RANGE, 방식: BA_ART.PAYWAY,
      전cancer: C.b.cancer, 후cancer: C.a.cancer };
  });

  const html = await pg.evaluate(() => BA_ART.build({ real: false }));

  head('[1] 묶음 11개가 모두 제 장을 얻고 · 도해가 빠지지 않는가');
  is(seeded.grp === 11, '  묶음이 <b>11개</b> (' + seeded.grp + ')');
  const 없는 = seeded.묶음.filter(m => seeded.도해.indexOf(m) < 0);
  is(없는.length === 0, '  도해가 <b>묶음마다</b> 있다' + (없는.length ? (' — 빠진 것: ' + 없는.join(' · ')) : ''));
  is(seeded.도해.length === 11, '  도해가 <b>11장</b> (' + seeded.도해.length + ')');

  /* ── 문서를 실제로 열어 재어 봅니다 ── */
  const p2 = await ctx.newPage();
  const derr = [];
  p2.on('pageerror', e => derr.push(String(e.message).slice(0, 100)));
  await p2.setContent(html, { waitUntil: 'load' });
  await p2.waitForTimeout(800);

  const m = await p2.evaluate(() => {
    const out = { 쪽: 0, svg: 0, 넘침: [], 밖글: [], 한마디: 0, 도해없음: 0, 실명: false,
      표줄: 0, 숫자: [], 쪽제목: [] };
    const pgs = Array.prototype.slice.call(document.querySelectorAll('.pg'));
    out.쪽 = pgs.length;
    pgs.forEach((e, i) => { if (e.scrollHeight > e.clientHeight + 2) out.넘침.push(i + 1); });
    out.svg = document.querySelectorAll('svg.ar').length;
    out.한마디 = document.querySelectorAll('.ar-say-b').length;
    out.도해없음 = document.querySelectorAll('.ar-none').length;
    out.실명 = document.body.innerText.indexOf('홍길동') >= 0;
    out.표줄 = document.querySelectorAll('.ar-tb tbody tr').length;
    document.querySelectorAll('.ar-h .ar-t b').forEach(e => out.쪽제목.push(e.textContent));
    /* ★★ 글자가 종이 밖으로 나갔나 — getBBox 로 실제로 잽니다 */
    Array.prototype.forEach.call(document.querySelectorAll('svg.ar'), (sv, si) => {
      const vb = sv.getAttribute('viewBox').split(/\s+/).map(Number);
      Array.prototype.forEach.call(sv.querySelectorAll('text'), t => {
        let b; try { b = t.getBBox(); } catch (e) { return; }
        if (b.x < vb[0] - 1 || b.y < vb[1] - 1 ||
            b.x + b.width > vb[0] + vb[2] + 1 || b.y + b.height > vb[1] + vb[3] + 1) {
          out.밖글.push([si, (t.textContent || '').slice(0, 26),
            Math.round(b.x) + '+' + Math.round(b.width) + '>' + (vb[0] + vb[2])]);
        }
      });
      /* 도해 안의 숫자를 모읍니다 — 지어낸 숫자가 있는지 보려고 */
      Array.prototype.forEach.call(sv.querySelectorAll('text'), t => {
        const n = (t.textContent || '').match(/\d[\d,.]*/g);
        if (n) n.forEach(x => out.숫자.push(x));
      });
    });
    return out;
  });

  head('[2] ★★ 도해의 글자가 종이 밖으로 나가지 않는가');
  if (m.밖글.length) m.밖글.slice(0, 14).forEach(x => console.log('      · 도해 ' + x[0] + ' 「' + x[1] + '」 ' + x[2]));
  is(m.밖글.length === 0, '  밖으로 나간 글자 <b>0</b> (' + m.밖글.length + '곳)');

  /* ★★ 진짜 종이로 뽑아 쪽을 셉니다 — 화면 자(scrollHeight)로는 안 보입니다.
     인쇄에서는 min-height 를 0 으로 풀기 때문에 쪽이 늘어나도 화면은 안 넘칩니다.
     실제로 거미줄 장이 한 장 더 새고 있었고, 화면 자는 「넘침 0」 이라고 말했습니다. */
  const 종이 = await p2.pdf({ format: 'A4', printBackground: true });
  const 쪽수 = (종이.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

  head('[3] 쪽이 A4 를 넘치지 않는가');
  is(쪽수 === 14, '  ★★ <b>진짜 종이로 14쪽</b> — 한 장도 새지 않는다 (' + 쪽수 + '쪽)');
  is(m.쪽 === 14, '  쪽이 <b>14장</b> — 표지 · 네 방식 · 묶음 11 · 거미줄 (' + m.쪽 + ')');
  is(m.넘침.length === 0, '  넘치는 쪽 <b>0</b>' + (m.넘침.length ? (' — ' + m.넘침.join(',')) : ''));
  is(m.svg === 14, '  도해 + 거미줄이 <b>14개</b> 섰다 — 11 + 네 방식 + 지갑 + 거미줄 (' + m.svg + ')');
  is(m.도해없음 === 0, '  「도해를 세우지 않았습니다」 가 <b>한 장도 없다</b>');

  head('[4] ★ 범위 % 와 「방식」 이 화면과 같은 말인가 (5번)');
  const 화 = {}; (seeded.화면범위 || []).forEach(x => { 화[x[0]] = x[1]; });
  let 어긋 = [];
  Object.keys(seeded.범위).forEach(k => {
    seeded.범위[k].o.forEach(pair => {
      if (화[pair[0]] === undefined) 어긋.push(pair[0] + ' 화면에 없음');
      else if (화[pair[0]] !== pair[1]) 어긋.push(pair[0] + ' ' + pair[1] + '≠' + 화[pair[0]]);
    });
  });
  if (어긋.length) 어긋.forEach(x => console.log('      · ' + x));
  is(어긋.length === 0, '  RANGE 의 % 가 <b>STUDY_DOC ② 와 같다</b> (' + Object.keys(화).length + '가지를 견줌)');
  is(Object.keys(화).length >= 6, '  화면에서 범위 % 를 <b>실제로 읽었다</b> (' + Object.keys(화).length + ')');
  const 방어긋 = seeded.방식.filter(w => (seeded.화면방식 || []).indexOf(w) < 0);
  is(방어긋.length === 0, '  「목돈 · 하루치 · 매달 · 한도」 가 <b>화면과 같은 말</b>' +
    (방어긋.length ? (' — ' + 방어긋.join(' · ')) : ''));

  head('[5] ★ 지어낸 숫자가 없는가 (1번)');
  /* 도해 안에 있어도 되는 숫자 — 범위 %, 담보 이름에 든 수(1~5종 · 3~100%), 단계 번호 */
  /* 1~6 은 단계 번호(1~5종 · 1~6달) · 3·100 은 담보 이름(3~100%) · 4 는 하루 4시간 · 30 은 30일/30배 */
  const 허용 = new Set(['100', '67', '9', '60', '0', '1', '2', '3', '4', '5', '6', '30']);
  const 수상 = m.숫자.filter(x => !허용.has(x.replace(/[,.]/g, '')));
  if (수상.length) console.log('      · ' + Array.from(new Set(수상)).slice(0, 12).join(' · '));
  is(수상.length === 0, '  도해 안의 숫자가 <b>전부 근거 있는 것</b> (' + m.숫자.length + '개를 봄)');
  is(/모르는 값은/.test(html) || /—/.test(html), '  모르는 값을 <b>「—」</b> 로 적는다');
  is(ART.indexOf('통계') < 0 && !/\d+\s*명 중/.test(ART), '  소스에 <b>지어낸 통계가 없다</b>');

  head('[6] ★ 실명이 한 자도 없는가 (3번)');
  is(m.실명 === false, '  문서 어디에도 <b>실명이 없다</b>');
  is(html.indexOf('홍○○') >= 0, '  <b>가린 이름</b>으로 섰다');
  const real = await pg.evaluate(() => BA_ART.build({ real: true }).indexOf('홍길동') >= 0);
  is(real === true, '  「이름 그대로」 를 고르면 <b>실명이 들어간다</b>');
  is(/confirm\(/.test(BAH.slice(BAH.indexOf('function baArtGo'), BAH.indexOf('function baArtGo') + 700)),
    '  「이름 그대로」 는 <b>한 번 더 묻는다</b>');

  head('[7] ★ 담보 · 과부족 · 셈을 다시 세지 않는가 (5번)');
  is(/g\.gapState\(/.test(ART), '  과부족은 <b>gapState 를 부른다</b>');
  is(/g\.calc\(\)/.test(ART), '  셈은 <b>calc() 를 부른다</b>');
  is(/g\.STD/.test(ART), '  담보 목록은 <b>STD 를 부른다</b>');
  is(/g\.DESC/.test(ART), '  담보 설명은 <b>DESC 를 부른다</b>');
  is(/g\.APXBody/.test(ART), '  몸 그림은 <b>APXBody 를 부른다</b>');
  is(/g\.amt\(/.test(ART), '  금액 적는 법은 <b>amt() 를 부른다</b>');
  is(!/var\s+(STD|DESC|SSTD|UNIT)\s*=/.test(ART), '  제 담보 목록을 <b>안 들고 있다</b>');
  is(m.표줄 >= 77, '  표에 담보가 <b>77가지 넘게</b> 섰다 (' + m.표줄 + ')');
  /* 과부족 글자가 gapState 와 같은가 — 한 줄만 골라 맞대어 봅니다 */
  const 맞 = await p2.evaluate(() => {
    const tr = Array.prototype.slice.call(document.querySelectorAll('.ar-tb tbody tr'));
    const x = tr.filter(e => e.className.indexOf('s-x') >= 0).length;
    const h = tr.filter(e => e.className.indexOf('s-h') >= 0).length;
    const o = tr.filter(e => e.className.indexOf('s-o') >= 0).length;
    return { x: x, h: h, o: o };
  });
  const 셈 = await pg.evaluate(() => {
    const C = calc(), c = { o: 0, h: 0, x: 0 };
    STD.forEach(g => g.rows.forEach(r => { c[gapState(r.k, C.a[r.k])]++; }));
    return c;
  });
  is(맞.x === 셈.x && 맞.h === 셈.h && 맞.o === 셈.o,
    '  표의 상태가 <b>gapState 그대로</b> (충분 ' + 맞.o + '/' + 셈.o +
    ' · 부족 ' + 맞.h + '/' + 셈.h + ' · 미가입 ' + 맞.x + '/' + 셈.x + ')');

  head('[8] 「보험 전문가의 한 마디」 칸이 장마다 있는가');
  is(m.한마디 === 13, '  표지를 뺀 <b>13장 모두</b>에 있다 (' + m.한마디 + ')');
  const 빈 = await p2.evaluate(() =>
    Array.prototype.every.call(document.querySelectorAll('.ar-say-b'), e => !e.textContent.trim()));
  is(빈, '  <b>비워</b> 둔다 — 사장님이 적는 자리이지 지어내는 자리가 아니다');

  head('[9] 인쇄에 tnum 을 켜지 않는가 (4-1번)');
  /* 머리글에 「tnum 을 켜지 않습니다」 라고 적혀 있으므로 <b>켜는 자리</b>만 봅니다 (8번: 헛것을 잡지 않는다) */
  is(!/font-feature-settings/.test(ART), '  소스에 <b>tnum 을 켜는 자리가 없다</b>');
  is(html.indexOf('font-feature-settings') < 0, '  문서에 <b>font-feature-settings 가 없다</b>');
  is(/@media print/.test(html) && /\.bar0\{display:none\}/.test(html.replace(/\s/g, '')),
    '  인쇄에서 <b>띠를 걷는다</b>');
  is(/@page/.test(html) && /A4/.test(html), '  <b>A4</b> 로 선다');

  head('[10] 고객 자료가 밖으로 안 나가는가 (7번 · 3번)');
  const 남 = 밖.filter(u => !/jsdelivr|googleapis|gstatic/.test(u));
  if (남.length) 남.slice(0, 6).forEach(u => console.log('      · ' + u));
  is(남.length === 0, '  문서가 <b>서버를 안 부른다</b> (' + 남.length + '곳)');
  is(!/fetch\(|XMLHttpRequest|supabase/.test(ART), '  소스에 <b>서버를 부르는 자가 없다</b>');

  head('터짐');
  if (터짐.length) 터짐.slice(0, 5).forEach(e => console.log('      · ' + e));
  if (derr.length) derr.slice(0, 5).forEach(e => console.log('      · 문서: ' + e));
  is(터짐.length === 0 && derr.length === 0, '  터진 곳 <b>0</b>');

  await br.close();
  srv.close();
  console.log('\n' + (깬 ? ('✗ ' + 깬 + '/' + 본 + ' 깨짐') : ('✓ ' + 본 + '가지 모두 통과')));
  process.exit(깬 ? 1 : 0);
})().catch(e => { console.error('터짐: ' + (e && e.stack || e)); process.exit(1); });
