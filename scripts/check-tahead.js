#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   check-tahead.js — 머리 <b>한 줄</b> · <b>큰 빨간 접기</b> ·
   거절을 <b>한 번에</b> · 대본에서 거절 줄 뺌 (판 X115)

   사장님 말씀 (2026-10-15):
     「지금 맨위에 TA 스크립트해서 통화 거절처리 문자카톡 이런 부분들을
      <b>최대한 칸을 줄여서 위에 한 줄로</b> 만들고 상담정보도 적은 뒤
      <b>접기 버튼을 빨간색으로 크게</b> 눌러줘 <b>거절처리는 바로 누를 수
      있도록</b> 준비해주고, <b>5단계 연속 대본에서 거절처리는 제외</b>하고,
      <b>거절처리 바로 응대하는 게 가장 중요</b>해 맞추어서 디자인해」

   ★★ 손대기 전에 재어 본 것 —
     · 머리가 폰 <b>221px</b>(이름 101 + 고르개 40 + 탭 47) · PC <b>170px</b>
     · 「접기」 가 <b>53×40 회색</b> 단추 하나뿐이고 <b>칸 머리에만</b> 있어서,
       다 적은 뒤 <b>위로 올라가야</b> 접을 수 있었습니다.
     · 거절을 한 번에 누를 자리가 없었습니다 — 아래 띠에서 「거절 나왔어요」
       를 누르고 쪽지에서 <b>또 골라야</b> 했습니다(두 번).
     · 5단계 대본 안에 거절 줄이 <b>넷</b> 끼어 있었습니다.

   ⚠ 도구 셋을 탭과 한 줄에 두었더니 폰에서 도구가 175px 를 먹어 탭이
     <b>「통화 거절처」</b> 까지만 보였습니다 — 도구를 아랫줄 오른쪽으로
     내리고 탭에 <b>한 줄을 통째로</b> 주었습니다 (8번 · 재서 알았습니다).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8715;
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
const 날 = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
const 전 = { 폰머리: 221, PC머리: 170, 거절줄: 4, 접기: { w: 53, h: 40 } };
const 열기 = async (ctx) => { const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:' + PORT + '/ta-script.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForFunction(() => !!document.querySelector('#tabs .tab'), { timeout: 30000 });
  await p.waitForTimeout(1000); return p; };
const 머리 = p => p.evaluate(() => {
  const h = s => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height) : 0; };
  const tabs = [].slice.call(document.querySelectorAll('#tabs .tab'));
  const t0 = tabs[0].getBoundingClientRect().top;
  const nav = document.querySelector('#tabs').getBoundingClientRect();
  return { 전체: h('.top'), 탭줄: h('#tabs'), 탭폭: Math.round(nav.width),
           한줄인가: tabs.every(b => Math.abs(b.getBoundingClientRect().top - t0) < 3),
           탭수: tabs.length, 탭이름: tabs.map(b => b.dataset.t).join(','),
           로고: !!document.querySelector('.logo'),
           이름글자: (() => { const e = document.querySelector('.brand .bt'); return !!(e && e.offsetHeight > 0); })(),
           도구: ['#fsz', '#fbBtn', '[data-act="print"]'].filter(s => { const e = document.querySelector(s); return e && e.offsetHeight > 0; }).length };
});

(async () => {
  const br = await chromium.launch();
  const errs = [];
  const 폰 = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await 폰.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pc = await br.newContext({ viewport: { width: 1440, height: 900 } });
  await pc.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());

  head('[1] 머리가 <b>한 줄</b>이고 칸을 덜 먹는다 (사장님 말씀)');
  const p1 = await 열기(폰); p1.on('pageerror', e => errs.push(String(e.message || e)));
  const m = await 머리(p1);
  is(m.한줄인가 && m.탭수 === 6, '  ★★ 탭 여섯이 <b>한 줄</b>에 선다 — ' + m.탭이름);
  is(m.전체 < 전.폰머리 * 0.6,
     '  ★★ 폰 머리가 <b>' + m.전체 + 'px</b> 다 — 전에는 ' + 전.폰머리 + 'px 였습니다');
  is(m.탭폭 >= 300,
     '  ★ 탭이 <b>그 줄을 통째로</b> 쓴다 — ' + m.탭폭 + 'px (도구를 한 줄에 두면 160px 까지 줄어듭니다)');
  is(!m.이름글자 && m.로고, '  폰에서는 이름 글자를 접고 <b>로고는 남긴다</b>');
  is(m.도구 === 3, '  ★ 도구 셋(글씨 크기 · 피드백 · 인쇄)이 <b>그대로 보인다</b> (6번) — ' + m.도구 + '개');
  const p2 = await 열기(pc); p2.on('pageerror', e => errs.push(String(e.message || e)));
  const mp = await 머리(p2);
  is(mp.한줄인가 && mp.탭수 === 6, '  PC 도 탭 여섯이 한 줄이다');
  is(mp.전체 < 전.PC머리, '  PC 머리가 <b>' + mp.전체 + 'px</b> 다 — 전에는 ' + 전.PC머리 + 'px');
  is(mp.이름글자, '  PC 에서는 <b>이름이 그대로</b> 보인다');

  head('[2] ★★ 상담 정보 — 다 적은 뒤 <b>큰 빨간 접기</b> (사장님 말씀)');
  const 큰 = await p2.evaluate(() => {
    const b = document.getElementById('infoDone'); if (!b) return null;
    const r = b.getBoundingClientRect(), cs = getComputedStyle(b);
    const card = document.getElementById('infoCard').getBoundingClientRect();
    const rgb = (cs.backgroundColor.match(/\d+/g) || []).map(Number);
    return { 보임: r.height > 0, 높이: Math.round(r.height), 폭: Math.round(r.width),
             칸폭: Math.round(card.width), 색: cs.backgroundColor, 빨간가: rgb[0] > 200 && rgb[1] < 120 && rgb[2] < 140,
             글: b.textContent.trim(), 글씨: parseFloat(cs.fontSize) };
  });
  is(!!큰 && 큰.보임, '  펴 둔 동안 <b>큰 단추가 선다</b> — 「' + (큰 ? 큰.글 : '(없음)') + '」');
  is(!!큰 && 큰.빨간가, '  ★★ <b>빨간색</b>이다 — ' + (큰 ? 큰.색 : '-'));
  is(!!큰 && 큰.높이 >= 44 && 큰.글씨 >= 15,
     '  ★★ <b>크다</b> — 높이 ' + (큰 ? 큰.높이 : 0) + 'px · 글씨 ' + (큰 ? 큰.글씨 : 0) + 'px (전에는 ' +
     전.접기.w + '×' + 전.접기.h + ' 회색이었습니다)');
  is(!!큰 && 큰.폭 > 큰.칸폭 * 0.8, '  ★ 칸을 <b>가로로 다 쓴다</b> — ' + (큰 ? 큰.폭 : 0) + ' / ' + (큰 ? 큰.칸폭 : 0) + 'px');
  await p2.click('#infoDone'); await p2.waitForTimeout(500);
  const 접힌 = await p2.evaluate(() => ({
    접혔나: getComputedStyle(document.getElementById('infoBody')).display === 'none',
    큰단추: (document.getElementById('infoDone') || {}).offsetHeight > 0,
    머리단추: (document.getElementById('infoTg') || {}).textContent.trim() }));
  is(접힌.접혔나, '  눌러서 <b>그 자리에서 접힌다</b> — 머리까지 올라가지 않습니다');
  is(!접힌.큰단추, '  ★ 접히면 큰 단추는 <b>사라진다</b> — 할 일이 없을 때만 감춥니다 (6번)');
  is(접힌.머리단추 === '펴기', '  머리 단추는 <b>펴기</b>로 바뀐다 — ' + 접힌.머리단추);
  is((날.match(/data-act="infofold"/g) || []).length === 2,
     '  ★ 누르는 자리는 둘이어도 <b>하는 일은 한 곳</b>이다 (5번) — infoOpen()');

  head('[3] ★★ 거절을 <b>한 번에</b> 누른다 (「바로 응대하는 게 가장 중요」)');
  const 띠 = await p1.evaluate(() => {
    const box = document.getElementById('qbar');
    const 봄 = e => e.offsetHeight > 0;
    const 전부 = [].slice.call(box.querySelectorAll('button')).filter(봄);
    return { 보임: box.offsetHeight > 0, 수: 전부.length,
             바로: [].slice.call(box.querySelectorAll('[data-ob]')).filter(봄).length,
             쪽지: [].slice.call(box.querySelectorAll('[data-qb="obj"]')).filter(봄).length,
             첫글: 전부.length ? 전부[0].textContent.trim() : '',
             미끄러지나: getComputedStyle(box).overflowX === 'auto' };
  });
  is(띠.보임 && 띠.바로 >= 6, '  ★★ 자주 나오는 거절 <b>' + 띠.바로 + '가지가 한 번에</b> 눌린다 (전에는 두 번이었습니다)');
  is(띠.쪽지 === 1, '  🔍 <b>거절 전부</b>(찾는 칸이 있는 쪽지)도 한 자리 있다 — 「' + 띠.첫글 + '」');
  is(띠.미끄러지나, '  띠가 <b>한 줄로 미끄러진다</b> — 넘쳐도 안 잘립니다');
  is(/function renderQbar\(\)/.test(날) && /EMERG\.map/.test(날),
     '  ★ 띠를 <b>EMERG 표 한 곳</b>에서 그린다 (5번) — 손으로 적지 않는다');
  const 눌림 = await p1.evaluate(() => { const b = document.querySelector('#qbar [data-ob]'); b.click();
    const sh = document.getElementById('sheet');
    return { 열렸나: sh.classList.contains('on'), 글: (document.getElementById('shT') || {}).textContent }; });
  is(눌림.열렸나, '  ★ 눌러 보면 <b>바로 그 거절이 열린다</b> — 「' + 눌림.글 + '」');

  head('[4] ★★ 5단계 연속 대본에서 <b>거절 줄을 뺐다</b> (사장님 말씀)');
  const 대본 = await p2.evaluate(() => ({
    거절줄: [].slice.call(document.querySelectorAll('#script .objrow')).filter(e => e.offsetHeight > 0).length,
    단계: [].slice.call(document.querySelectorAll('#script .st')).filter(e => e.offsetHeight > 0).length,
    길: /아래 띠|오른쪽 칸/.test(document.getElementById('script').textContent) }));
  is(대본.거절줄 === 0, '  ★★ 대본 안에 거절 줄이 <b>없다</b> — 전에는 ' + 전.거절줄 + '줄이 끼어 있었습니다');
  is(대본.단계 === 5, '  다섯 단계는 <b>그대로</b>다 — ' + 대본.단계 + '칸 (지운 것이 아닙니다)');
  is(대본.길, '  ★ 대본이 <b>어디서 누르는지</b> 말해 준다 (6번) — 「아래 띠 · 오른쪽 칸」');
  const 거절수 = await p1.evaluate(() => { try { return APEX_STAGE.objList().length; } catch(e) { return 0; } });
  is(거절수 >= 28, '  ★ 거절 자체는 <b>한 가지도 안 줄었다</b> — 표에 ' + 거절수 + '가지');

  head('[5] 조용한가');
  const 시끄 = errs.filter(e => !/favicon|net::ERR|Failed to fetch|abort/i.test(e));
  is(시끄.length === 0, '콘솔 에러 ' + 시끄.length + '건' + (시끄.length ? ' ← ' + 시끄[0] : ''));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '자리 — 위를 보십시오 (' + n + '가지 중)'); process.exit(1); }
  console.log('✓ 머리는 한 줄, 접기는 크고 빨갛고, 거절은 한 번에 눌립니다 (' + n + '자리).');
})();
