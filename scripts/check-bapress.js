#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   check-bapress.js — 보장분석 만들기의 <b>단추를 실제로 눌러 본다</b> (판 X541)

   사장님 말씀 2026-11-24 — 「엑셀로 다운로드 버튼도 누르고, 보장분석 전후
   만들기에서, <b>파일로저장 옆에 원래 고객 파일에 저장 있었는데 그 칸 다시
   확인</b>하고 마무리해줘」.

   ★ <b>글자를 세지 않습니다.</b> onclick 에 이름이 적혀 있는지가 아니라,
     정말로 <b>눌러서</b> 파일이 떨어지고 새 탭이 서고 말을 해 주는지 봅니다.
     (판 X463 에서 같은 병으로 데였습니다 — 자가 「적혀 있나」 만 묻고 초록이었습니다)

   재는 것
   [1] 「💾 고객 365일에 저장」 칸이 <b>어디서 열어도 선다</b>
       ★★ 워크스페이스 밖에서 열면 <b>아예 숨기고</b> 있었습니다. 사장님 눈에는
          「있던 칸이 없어졌다」 로 보입니다. 누르면 까닭을 말해 주는 길이 이미
          있으니 숨길 까닭이 없습니다 — 단추는 <b>정말로 할 일이 없을 때만</b>
          감춥니다 (CLAUDE.md 6번 · 알람 단추에서 데인 자리).
       ★ 「💾 파일로 저장」 <b>바로 옆</b>인가 — 사장님이 그 자리로 기억하십니다.
       ★ 손가락이 닿는 <b>44px</b> 인가.
   [2] 밖에서 열면 <b>흐리고</b>, <b>눌러 보면 말해 준다</b>
   [3] 「📊 엑셀로 내려받기」 를 눌러 <b>진짜 파일이 떨어진다</b>
   [4] 「🖨 담보별 분리자료」 를 눌러 <b>새 탭에 14쪽이 선다</b>
   [5] 누르는 동안 <b>터지지 않는다</b>

   되돌려 보기 — baSaveBtn 에 style="display:none" 을 되돌리면 [1] 이,
   baXlGo 를 지우면 [3] 이, baArtGo 를 지우면 [4] 가 웁니다.
   ══════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(require('os').tmpdir(), 'bapress-'));

let 깬 = 0, 본 = 0;
function head(t) { console.log('\n' + t.replace(/<[^>]+>/g, '')); }
function is(ok, t) { 본++; if (!ok) 깬++; console.log((ok ? '  ✓ ' : '  ✗ ') + t.replace(/<[^>]+>/g, '')); }

const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

(async () => {
  console.log('══ 🖱 보장분석 단추를 눌러 본다 (판 X541) ══');
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

  const 터짐 = [];
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true });
  /* 바깥은 끊습니다 — 점검이 사장님 진짜 서버를 두드리면 안 됩니다 */
  await ctx.route('**://**', rt => rt.request().url().indexOf('127.0.0.1:' + P) >= 0
    ? rt.continue() : rt.abort());
  const pg = await ctx.newPage();
  pg.on('pageerror', e => 터짐.push(String(e.message).slice(0, 100)));
  pg.on('dialog', d => d.accept());
  await pg.goto('http://127.0.0.1:' + P + '/app/ba.html', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForTimeout(2500);

  /* 견본 — 홍길동 (3번) */
  await pg.evaluate(() => {
    const mk = (co, nm, prem, act, cov, cov2) => ({ id: 'p' + Math.random().toString(36).slice(2, 7),
      co: co, nm: nm, term: '100세', start: '2015-03-02', years: '20', rnw: 'no',
      premMan: prem, premMan2: '', act: act, kb: false, cov: cov || {}, cov2: cov2 || {} });
    S.who = { name: '홍길동', age: '48', sex: 'm', retire: '60', life: '85', incMan: '', expMan: '' };
    S.before = [
      mk('삼성화재', '종합보험 7.0', '12.4', 'keep',
        { silD: '5000', cancer: '3000', brainh: '2000', mi: '2000', inpD: '3', deathD: '5000' }),
      mk('현대해상', '굿앤굿스타', '8.1', 'endo', { cancer: '1000' }, { cancer: '2000', brain: '2000' })];
    S.after = [mk('KB손해보험', 'KB 3대진단', '5.2', 'new', { cancerR: '2000', heartA: '2000' })];
    S.man = { b: {}, a: {} };
    save();
    try { go('edit'); } catch (e) {}
  });
  await pg.waitForTimeout(900);

  head('[1] 「💾 고객 365일에 저장」 칸이 어디서 열어도 서나 (사장님 말씀 「그 칸 다시 확인」)');
  const 칸 = await pg.evaluate(() => {
    const b = document.getElementById('baSaveBtn');
    if (!b) return { 있나: false };
    const cs = getComputedStyle(b), r = b.getBoundingClientRect();
    const 형제 = Array.prototype.slice.call(b.parentElement.children);
    const i = 형제.indexOf(b);
    const 다음 = 형제[i + 1] ? (형제[i + 1].textContent || '').trim() : '';
    return { 있나: true, 보이나: cs.display !== 'none' && r.width > 0 && r.height > 0,
      높이: Math.round(r.height), 흐린가: b.className.indexOf('baOut') >= 0,
      귀띔있나: !!(b.title || '').trim(), 다음칸: 다음.slice(0, 14) };
  });
  is(칸.있나, '  단추가 <b>있다</b>');
  is(칸.보이나 === true, '  ★★ 워크스페이스 밖에서 열어도 <b>선다</b> — 숨기지 않습니다 (6번)');
  is(칸.높이 >= 44, '  손가락이 닿는 <b>44px</b> 이상 (' + 칸.높이 + 'px)');
  is(/파일로 저장/.test(칸.다음칸 || ''),
    '  「💾 <b>파일로 저장</b>」 바로 옆이다 — 사장님이 그 자리로 기억하십니다 (옆칸: ' +
    (칸.다음칸 || '없음') + ')');

  head('[2] 밖에서 열면 흐리고, 눌러 보면 말해 주나');
  is(칸.흐린가 === true, '  밖에서는 <b>흐리다</b>(baOut) — 눌리기는 합니다');
  is(칸.귀띔있나, '  <b>귀띔(title)</b>이 달려 있다');
  await pg.click('#baSaveBtn').catch(() => {});
  await pg.waitForTimeout(500);
  const 말 = await pg.evaluate(() => {
    const t = document.getElementById('baToast');
    return t ? { 글: (t.textContent || '').trim(), 보임: parseFloat(getComputedStyle(t).opacity) > 0.1 } : null;
  });
  is(!!말 && 말.보임, '  ★★ <b>눌러 보니 말해 준다</b> — 글자만 세지 않았습니다');
  is(!!말 && /워크스페이스|파일로 저장/.test(말.글),
    '  무엇을 해야 하는지 <b>그 자리에서</b> 일러 준다' + (말 ? (' — 「' + 말.글.slice(0, 34) + '…」') : ''));

  head('[3] 「📊 엑셀로 내려받기」 를 눌러 진짜 파일이 떨어지나');
  await pg.evaluate(() => { try { go('edit'); } catch (e) {} });
  await pg.waitForTimeout(600);
  const 엑셀단추 = await pg.$('button[onclick="baXlGo(0)"]');
  is(!!엑셀단추, '  단추가 화면에 <b>있다</b>');
  let 받은 = null;
  if (엑셀단추) {
    const dl = pg.waitForEvent('download', { timeout: 45000 });
    await 엑셀단추.click();
    const d = await dl.catch(() => null);
    if (d) { 받은 = path.join(TMP, 'ba.xlsx'); await d.saveAs(받은); }
  }
  is(!!받은, '  ★★ 눌렀더니 <b>파일이 떨어진다</b>');
  const 크기 = 받은 ? fs.statSync(받은).size : 0;
  is(크기 > 100000, '  빈 파일이 아니다 — <b>' + Math.round(크기 / 1024) + 'KB</b>');
  if (받은) {
    const buf = fs.readFileSync(받은);
    is(buf[0] === 0x50 && buf[1] === 0x4B, '  진짜 <b>xlsx(zip)</b> 이다');
  } else is(false, '  진짜 xlsx(zip) 이다');

  head('[4] 「🖨 담보별 분리자료」 를 눌러 새 탭에 자료가 서나');
  const 분리단추 = await pg.$('button[onclick="baArtGo(0)"]');
  is(!!분리단추, '  단추가 화면에 <b>있다</b>');
  let 새 = null;
  if (분리단추) {
    const w = ctx.waitForEvent('page', { timeout: 30000 });
    await 분리단추.click();
    새 = await w.catch(() => null);
  }
  is(!!새, '  ★★ 눌렀더니 <b>새 탭이 선다</b>');
  let 쪽 = 0, 도해 = 0;
  if (새) {
    await 새.waitForTimeout(1300);
    const q = await 새.evaluate(() => ({
      쪽: document.querySelectorAll('.pg').length,
      도해: document.querySelectorAll('svg.ar').length
    })).catch(() => ({ 쪽: 0, 도해: 0 }));
    쪽 = q.쪽; 도해 = q.도해;
  }
  is(쪽 === 14, '  A4 <b>14장</b>이 섰다 (' + 쪽 + ')');
  is(도해 >= 13, '  도해가 <b>13장 넘게</b> 섰다 (' + 도해 + ')');

  head('[5] 누르는 동안 터지지 않았나');
  if (터짐.length) 터짐.slice(0, 5).forEach(e => console.log('      · ' + e));
  is(터짐.length === 0, '  터진 곳 <b>0</b>');

  await br.close();
  srv.close();
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {}
  console.log('\n' + (깬 ? ('✗ ' + 깬 + '/' + 본 + ' 깨짐') : ('✓ ' + 본 + '가지 모두 통과 — 단추를 눌러 봤습니다')));
  process.exit(깬 ? 1 : 0);
})().catch(e => { console.error('터짐: ' + (e && e.stack || e)); process.exit(1); });
