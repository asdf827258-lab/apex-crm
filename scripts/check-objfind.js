#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   check-objfind.js — 폰에서 <b>거절을 바로 찾나</b> · 인쇄에 <b>전부</b> 나가나
   (판 X114)

   사장님 말씀 (2026-10-15):
     「핸드폰에서 <b>너무 내용이 안 보이고</b> 거절처리 등을 더 쉽게 보도록
      <b>바로 찾도록</b> 해줘 <b>인쇄 하면 거절처리가 모두 나오도록</b>도 해줘」

   ★★ 손대기 전에 폰(390×844)에서 재어 본 것 —
     · 거절처리 탭이 <b>1열 · 7.33 화면</b> · <b>찾는 칸 없음</b> ·
       첫 화면에 거절이 <b>0가지</b>(설명 칸이 다 먹었습니다)
     · 폰에는 오른쪽 칸이 <b>아예 없습니다</b>(.side 는 900px 아래에서 안 섭니다).
       그래서 찾는 길은 아래 띠 「🙅 거절 나왔어요」 쪽지뿐인데 거기도
       <b>찾는 칸이 없어</b> 36줄 <b>2,442px</b> 를 손으로 긁어야 했습니다
       (쪽지는 743px 입니다).
     · 통화 탭 첫 화면이 <b>통째로 「상담 정보」 입력 칸</b>이라 대본은
       900px 를 긁어야 나왔습니다.
     · 인쇄에는 거절 28가지 중 <b>12가지만</b> 나가고 16가지가 빠졌습니다.

   여기서 못 박는 것은 다섯입니다.
     ① 거르는 자가 <b>하나</b>이고 <b>세 자리</b>가 그것을 부른다 (5번)
     ② 폰 거절처리 탭 — 찾는 칸 · 두 열 · 첫 화면에 거절이 선다 · 눌리면 열린다
     ③ 폰 쪽지 — 찾는 칸 · 글자를 넣으면 줄고 · 없으면 <b>없다고 말한다</b> (1번)
     ④ 폰 통화 탭 — 상담 정보가 <b>접힌 채</b> 열리고 요약과 <b>펴기</b>가 보인다 (6번)
     ⑤ 인쇄에 거절이 <b>전부</b> 나간다 · 앞장은 그대로다
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8714;
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript', '.css':'text/css',
               '.png':'image/png', '.svg':'image/svg+xml', '.json':'application/json' };
const srv = http.createServer((rq, rs) => {
  const f = path.join(ROOT, decodeURIComponent(rq.url.split('?')[0].split('#')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
}).listen(PORT);
const SRC = fs.readFileSync(path.join(ROOT, 'ta-script.html'), 'utf8');
const 날 = SRC.replace(/\/\*[\s\S]*?\*\//g, '');
/* 손대기 전 눈금 (폰 390×844) */
const 전 = { 탭화면: 7.33, 탭열: 1, 첫화면거절: 0, 쪽지높이: 2442, 인쇄거절: 12 };

const 열기 = async (ctx) => {
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:' + PORT + '/ta-script.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForFunction(() => !!document.querySelector('#tabs .tab'), { timeout: 30000 });
  await p.waitForTimeout(1000);
  return p;
};
const 보이는수 = (p, sel) => p.evaluate(s => [].slice.call(document.querySelectorAll(s)).filter(x => x.offsetHeight > 0).length, sel);

(async () => {
  const br = await chromium.launch();
  const errs = [];
  const 폰 = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await 폰.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pc = await br.newContext({ viewport: { width: 1440, height: 900 } });
  await pc.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());

  head('[1] 거르는 자가 <b>하나</b>이고 세 자리가 그것을 부른다 (5번)');
  is((날.match(/function objSift\(/g) || []).length === 1, '  거르는 자가 <b>한 곳</b>이다 — objSift()');
  ['qFilter','shFilter','objTabFilter'].forEach(f => {
    const i = 날.indexOf('function ' + f + '(');
    is(i > 0 && 날.slice(i, i + 260).indexOf('objSift(') > 0, '    ' + f + ' 가 그것을 부른다');
  });
  is(!/\.qobj button\.hide\{/.test(SRC) && /\.objhide\{display:none/.test(SRC),
     '  ★ 감추는 이름도 <b>하나</b>다(.objhide) — 전에는 .qobj 안에서만 듣는 이름이었습니다');

  head('[2] 폰 — <b>거절처리 탭</b>에서 바로 찾는다');
  const p1 = await 열기(폰);
  p1.on('pageerror', e => errs.push(String(e.message || e)));
  await p1.evaluate(() => document.querySelector('#tabs .tab[data-t="obj"]').click());
  await p1.waitForTimeout(800);
  const t = await p1.evaluate(() => {
    const 보임 = e => e.offsetHeight > 0;
    const k = [].slice.call(document.querySelectorAll('#objGrid [data-ob2]')).filter(보임);
    const t0 = k[0].getBoundingClientRect().top;
    return { 가짓수: k.length, 열: k.filter(c => Math.abs(c.getBoundingClientRect().top - t0) < 3).length,
             찾는칸: !!document.getElementById('objFind'),
             센수: (document.getElementById('objCnt') || {}).textContent || '',
             첫화면: k.filter(c => c.getBoundingClientRect().top < 844).length,
             화면: +(document.body.scrollHeight / 844).toFixed(2) };
  });
  is(t.찾는칸, '  🔍 <b>찾는 칸</b>이 있다');
  is(t.열 > 전.탭열, '  거절이 <b>' + t.열 + '열</b>로 선다 — 전에는 ' + 전.탭열 + '열');
  is(t.첫화면 > 전.첫화면거절,
     '  ★★ <b>첫 화면에 거절이 ' + t.첫화면 + '가지</b> 보인다 — 전에는 ' + 전.첫화면거절 +
     '가지였습니다(설명 칸이 다 먹었습니다)');
  is(t.화면 < 전.탭화면, '  탭이 <b>' + t.화면 + ' 화면</b>으로 짧아졌다 — 전 ' + 전.탭화면);
  is(/거절\s*\d+가지/.test(t.센수), '  <b>몇 가지인지 말해 준다</b> — 「' + t.센수 + '」');
  await p1.fill('#objFind', '가족'); await p1.waitForTimeout(400);
  const t2 = await p1.evaluate(() => {
    const k = [].slice.call(document.querySelectorAll('#objGrid [data-ob2]')).filter(e => e.offsetHeight > 0);
    return { 보임: k.length, 센수: (document.getElementById('objCnt') || {}).textContent || '',
             이름: k.length ? k[0].textContent.replace(/\s+/g, ' ').trim().slice(0, 20) : '' };
  });
  is(t2.보임 > 0 && t2.보임 < t.가짓수, '  글자를 넣으면 <b>줄어든다</b> — 「가족」 → ' + t2.보임 + '가지 (' + t2.이름 + ')');
  is(/찾은 것/.test(t2.센수), '  찾은 수를 말해 준다 — 「' + t2.센수 + '」');
  const 열림 = await p1.evaluate(() => { const b = document.querySelector('#objGrid [data-ob2]:not(.objhide)');
    if (!b) return '(없음)'; b.click(); const h = document.querySelector('#objDetail h4'); return h ? h.innerText.trim() : '(안 열림)'; });
  is(열림 !== '(없음)' && 열림 !== '(안 열림)', '  <b>눌러 보면 그 거절이 열린다</b> — ' + 열림);
  await p1.fill('#objFind', '없는글자zzz'); await p1.waitForTimeout(400);
  const t3 = await p1.evaluate(() => ({ 보임: [].slice.call(document.querySelectorAll('#objGrid [data-ob2]')).filter(e => e.offsetHeight > 0).length,
    센수: (document.getElementById('objCnt') || {}).textContent || '' }));
  is(t3.보임 === 0 && /없어요/.test(t3.센수), '  ★ 없으면 <b>없다고 말한다</b> (1번) — 「' + t3.센수 + '」');
  await p1.fill('#objFind', '');

  head('[3] 폰 — 아래 띠 <b>쪽지</b>에서도 바로 찾는다');
  await p1.evaluate(() => document.querySelector('#tabs .tab[data-t="call"]').click());
  await p1.waitForTimeout(600);
  /* ⚠ 판 X115 에서 아래 띠가 바뀌었습니다 — 자주 나오는 거절 여섯이 <b>한 번에</b>
     눌리도록 띠에 직접 섰습니다(전에는 「거절 나왔어요」 → 쪽지 → 고르기 두 번). */
  const 띠전부 = await 보이는수(p1, '#qbar button');
  const 띠거절 = await 보이는수(p1, '#qbar [data-ob]');
  is(띠전부 >= 8, '  아래 띠가 <b>서 있다</b> — 단추 ' + 띠전부 + '개');
  is(띠거절 >= 6, '  ★★ 자주 나오는 거절 <b>' + 띠거절 + '가지가 띠에서 바로</b> 눌린다 (판 X115)');
  await p1.evaluate(() => document.querySelector('[data-qb="obj"]').click());
  await p1.waitForTimeout(700);
  const s1 = await p1.evaluate(() => ({ 찾는칸: !!document.getElementById('shFind'),
    가짓수: [].slice.call(document.querySelectorAll('#shB [data-ob]')).filter(e => e.offsetHeight > 0).length,
    높이: Math.round(document.getElementById('shB').scrollHeight),
    센수: (document.getElementById('shCnt') || {}).textContent || '' }));
  is(s1.찾는칸, '  🔍 <b>쪽지에도 찾는 칸</b>이 있다 — 폰에는 오른쪽 칸이 없어 여기가 유일한 길입니다');
  is(/거절\s*\d+가지/.test(s1.센수), '  몇 가지인지 말해 준다 — 「' + s1.센수 + '」');
  await p1.fill('#shFind', '바빠'); await p1.waitForTimeout(400);
  const s2 = await p1.evaluate(() => ({ 보임: [].slice.call(document.querySelectorAll('#shB [data-ob]')).filter(e => e.offsetHeight > 0).length,
    높이: Math.round(document.getElementById('shB').scrollHeight),
    제목줄: [].slice.call(document.querySelectorAll('#shB .gh')).filter(e => e.offsetHeight > 0).length }));
  is(s2.보임 > 0 && s2.보임 < s1.가짓수, '  글자를 넣으면 <b>줄어든다</b> — 「바빠」 → ' + s2.보임 + '가지');
  is(s2.높이 < 전.쪽지높이 / 2,
     '  ★★ 긁을 것이 <b>' + s2.높이 + 'px</b> 로 줄었다 — 전에는 ' + 전.쪽지높이 + 'px 를 손으로 긁었습니다(쪽지는 743px)');
  is(s2.제목줄 <= 1, '  ★ 아무것도 안 남은 <b>제목 줄은 같이 접힌다</b> (1번) — 지금 ' + s2.제목줄 + '줄');

  head('[4] 폰 — <b>통화 탭 첫 화면에 대본</b>이 선다 (「내용이 안 보이고」)');
  const p2 = await 열기(폰);
  p2.on('pageerror', e => errs.push(String(e.message || e)));
  const c = await p2.evaluate(() => {
    const body = document.getElementById('infoBody'), tg = document.getElementById('infoTg');
    const st = document.querySelector('#script .st, .st');
    return { 접혔나: !!(body && getComputedStyle(body).display === 'none'),
             펴기: tg ? tg.textContent.trim() : '', 요약: (document.getElementById('infoSum') || {}).textContent || '',
             대본머리: st ? Math.round(st.getBoundingClientRect().top) : 99999 };
  });
  is(c.접혔나, '  ★★ 폰에서는 <b>상담 정보가 접힌 채</b> 열린다');
  is(c.펴기 === '펴기', '  ★ <b>펴기 단추</b>가 그대로 있다 (6번) — 「' + c.펴기 + '」');
  is(/님/.test(c.요약), '  접혀도 <b>한 줄 요약</b>이 보인다 — 「' + c.요약.trim().slice(0, 30) + '」');
  is(c.대본머리 < 844, '  ★★ <b>첫 화면(844px) 안에 대본</b>이 선다 — 대본 머리가 ' + c.대본머리 + 'px');
  await p2.click('#infoHd'); await p2.waitForTimeout(400);
  const c2 = await p2.evaluate(() => getComputedStyle(document.getElementById('infoBody')).display !== 'none');
  is(c2, '  눌러서 <b>펼 수 있다</b>');
  await p2.reload({ waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(1400);
  const c3 = await p2.evaluate(() => getComputedStyle(document.getElementById('infoBody')).display !== 'none');
  is(c3, '  ★ 손으로 편 <b>뜻을 기억한다</b> — 다시 열어도 펴져 있다 (1번)');

  head('[5] PC 는 <b>그대로</b>다 — 폰 때문에 PC 를 바꾸지 않았다');
  const p3 = await 열기(pc);
  p3.on('pageerror', e => errs.push(String(e.message || e)));
  const d = await p3.evaluate(() => ({ 상담정보: getComputedStyle(document.getElementById('infoBody')).display !== 'none',
    오른칸: [].slice.call(document.querySelectorAll('#qobj [data-ob]')).filter(e => e.offsetHeight > 0).length }));
  is(d.상담정보, '  PC 에서는 상담 정보가 <b>펴진 채</b>다');
  await p3.fill('#qfind', '이미'); await p3.waitForTimeout(400);
  const d2 = await 보이는수(p3, '#qobj [data-ob]');
  is(d2 > 0 && d2 < d.오른칸, '  PC 오른쪽 칸도 <b>그대로 걸러진다</b> — ' + d.오른칸 + ' → ' + d2 + '가지');

  head('[6] ★★ 인쇄에 거절이 <b>전부</b> 나간다 (사장님 말씀)');
  const pr = await p3.evaluate(() => {
    const ps = document.getElementById('printSheet');
    const 글 = ps.innerText || ps.textContent || '';
    const names = (window.APEX_STAGE && APEX_STAGE.objList) ? APEX_STAGE.objList().map(o => o.title) : [];
    const 빠진 = names.filter(x => x && 글.indexOf(x) < 0);
    return { 칸: ps.querySelectorAll('.pobj').length,   /* 판 X116 — 칸 이름이 .po → .pobj (화면 칸을 통째로 씁니다) */ 표: names.length, 빠진: 빠진.length, 빠진것: 빠진.slice(0, 4),
             앞장: /보장분석 TA 연속 스크립트/.test(글), 머리: /거절처리 전부/.test(글) };
  });
  is(pr.빠진 === 0,
     '  ★★ 표에 있는 거절 <b>' + pr.표 + '가지가 모두</b> 인쇄에 나간다 — 빠진 것 ' + pr.빠진 + '가지' +
     (pr.빠진 ? ('\n      ✗ ' + pr.빠진것.join(' · ')) : '') + ' (전에는 ' + 전.인쇄거절 + '가지만 나갔습니다)');
  is(pr.칸 >= pr.표, '  거절 칸이 <b>' + pr.칸 + '개</b> 짜였다 (화제를 고르면 그 둘도 같이)');

  /* ── 판 X116 — 사장님 말씀 「거절처리를 순서대로 쫙 해줬는데 … 인쇄만 하면
     <b>단축</b>되는데 … <b>인쇄 버전 똑같이</b> 나오게 체크해」 ─────────────
     ⚠ 제가 인쇄를 <b>네 줄</b>(제목 · 첫 한마디 · 넘기는 말 · 멈출 자리)로 줄여
       찍고 있었습니다 — 속마음 · 이어가기 · 4단 멘트 · 재반응별 대답 · 다음
       타이밍 · 코칭 · 피해야 할 표현 · 평가가 통째로 빠졌습니다.
     ★★ 이제 <b>화면의 글이 종이에 한 조각도 안 빠지는지</b> 를 묻습니다 —
       화면에서 그 거절을 열어 글을 받아, 인쇄본 글에 <b>전부 들어 있는지</b>
       낱말 단위로 맞춰 봅니다. 줄여서 찍으면 그 자리에서 빨간불입니다. */
  const 같나 = await p3.evaluate(() => {
    const ids = (window.APEX_STAGE && APEX_STAGE.objList) ? APEX_STAGE.objList().map(o => 'k_' + o.key) : [];
    const 뽑기 = [ids[0], ids[Math.floor(ids.length/2)], ids[ids.length-1]].filter(Boolean);
    const ps = document.getElementById('printSheet');
    const 종이 = (ps.innerText || ps.textContent || '').replace(/\s+/g, '');
    const out = [];
    뽑기.forEach(id => {
      const box = document.createElement('div');
      box.innerHTML = (typeof objDetail === 'function') ? '' : '';
      /* 화면 칸을 그대로 쓴다 — 거절처리 탭의 자리에 그려 본다 */
      const d = document.getElementById('objDetail');
      const keep = d.innerHTML;
      const b = document.querySelector('[data-ob2="' + id + '"]');
      if (b) b.click();
      [].slice.call(d.querySelectorAll('details')).forEach(x => x.open = true);
      const 화면 = (d.innerText || '').replace(/\s+/g, '');
      d.innerHTML = keep;
      /* 낱말(6자 이상)로 견준다 — 짧은 토막은 우연히 맞을 수 있습니다 */
      const 조각 = (d0 => d0)(화면).match(/[가-힣]{6,}/g) || [];
      const 안든 = 조각.filter(w => 종이.indexOf(w) < 0);
      out.push({ id: id, 조각: 조각.length, 안든: 안든.length, 보기: 안든.slice(0, 3) });
    });
    return out;
  });
  같나.forEach(r => {
    is(r.조각 >= 10 && r.안든 === 0,
       '  ★★ <b>' + r.id + '</b> — 화면 글 ' + r.조각 + '조각이 <b>종이에 전부</b> 있다 (안 든 것 ' + r.안든 + ')' +
       (r.안든 ? ('\n      ✗ ' + r.보기.join(' · ')) : ''));
  });
  const 접힘 = await p3.evaluate(() => {
    const ps = document.getElementById('printSheet');
    const d = ps.querySelectorAll('details');
    return { 수: d.length, 닫힌것: [].slice.call(d).filter(x => !x.open).length };
  });
  is(접힘.수 > 0 && 접힘.닫힌것 === 0,
     '  ★ 종이에서는 <b>접힌 칸이 없다</b> — 누를 수가 없으니 펴서 찍습니다 (' + 접힘.수 + '칸)');
  /* ⚠ ★ 처음에 열쇠를 <b>ta_script_v3</b> 로 적었는데 이 화면은 <b>ta_final_v1</b>
     을 씁니다 — 둘 다 없는 값(null)이라 <b>null === null</b> 로 늘 통과하는
     <b>안 울리는 알람</b>이었습니다(되돌림 C 가 안 울려서 알았습니다 · 8번).
     열쇠를 <b>화면에게 물어</b> 쓰고, 값을 <b>먼저 심어</b> 둡니다. */
  const 안덮나 = await p3.evaluate(() => {
    const K = (typeof KEY !== 'undefined') ? KEY : 'ta_final_v1';
    const 읽기 = () => { try { return JSON.parse(localStorage.getItem(K) || '{}').obj || null; } catch(e){ return null; } };
    /* 「지금 보고 있는 거절」 을 분명히 하나 심는다 */
    const 첫 = document.querySelector('#objGrid [data-ob2]');
    if (첫) 첫.click();
    const 전 = 읽기();
    /* ⚠ ★ buildPrint() 를 그냥 부르면 <b>봉투(IIFE) 안이라 안 보여</b> 조용히
       넘어갑니다(try/catch 가 삼킵니다) — 되돌림이 또 안 울렸습니다. 브라우저가
       인쇄할 때와 <b>같은 길</b>로, beforeprint 를 실제로 쏩니다 (8번). */
    const ps = document.getElementById('printSheet');
    ps.innerHTML = '';
    window.dispatchEvent(new Event('beforeprint'));
    const 짜였나 = ps.innerHTML.length > 1000;
    const 후 = 읽기();
    return { 같나: 전 === 후 && !!전, 전: 전, 후: 후, 짜였나: 짜였나 };
  });
  is(안덮나.짜였나, '  ★ 인쇄 직전(beforeprint)에 <b>인쇄본이 다시 짜인다</b> — 빈 채로 나가지 않습니다');
  is(안덮나.같나,
     '  ★★ 인쇄본을 짜도 <b>보고 계시던 거절을 안 덮는다</b> — ' + 안덮나.전 + ' → ' + 안덮나.후 +
     ' (30가지를 차례로 그립니다 · objDetail 의 quiet)');
  is(pr.머리, '  <b>「거절처리 전부」</b> 머리글이 있다');
  is(pr.앞장, '  ★ <b>앞장(A4 한 장)은 그대로</b>다 — 뒤에 붙였을 뿐입니다 (6번)');
  is(/\.ps-objs\{break-before:page/.test(SRC), '  거절은 <b>새 쪽에서</b> 시작한다');
  const 쪽 = await p3.evaluate(async () => { const ps = document.getElementById('printSheet');
    return Math.round(ps.getBoundingClientRect().height); });
  console.log('  · 인쇄본 높이 ' + 쪽 + 'px (A4 한 쪽 ≈ 1,076px · 화면에서 잰 값이라 참고용입니다)');

  head('[7] 조용한가');
  const 시끄 = errs.filter(e => !/favicon|net::ERR|Failed to fetch|abort/i.test(e));
  is(시끄.length === 0, '콘솔 에러 ' + 시끄.length + '건' + (시끄.length ? ' ← ' + 시끄[0] : ''));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '자리 — 위를 보십시오 (' + n + '가지 중)'); process.exit(1); }
  console.log('✓ 폰에서 거절을 바로 찾고, 인쇄에 전부 나갑니다 (' + n + '자리).');
})();
