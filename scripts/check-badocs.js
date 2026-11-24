#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   check-badocs.js — 보장분석 전·후의 <b>보는 자료</b>가 숨지 않고 서는가 (판 X556)

   사장님 말씀 2026-11-24 —
     「보장분석 전후 비교자료에서, 윤시현의 두뇌, 자동보장분석, 가입설계요청서
      디자인 재구성과 내용들 재구성해줘 … 이것보다 더 디테일하게 해주고
      보장분석 기준과 연령대별 기준 다시 만들고 <b>더보기에 숨겨져있어서
      숨기지말고 보이도록</b> 해줘 … <b>엑셀로 다운로드 칸도 딱 보이게</b>」

   ★ 글자를 세지 않습니다 — <b>화면을 실제로 그려</b> 보고 잽니다.

   재는 것
   [1] 📚 자료 띠가 <b>늘 보인다</b> — 여섯 자료가 눌러 열지 않아도 선다
       ★ 보여주기 때는 <b>접힌다</b> — 띠가 두 줄이면 발표 무대가 줄어듭니다(판 X541)
   [2] 📊 <b>엑셀로 내려받기</b>가 위 띠에 선다 — ⑤ 표준 담보표까지 안 내려가도 된다
       ★ ⑤ 의 자리도 <b>그대로</b> 있다 — 길을 지우지 않습니다 (6번)
   [3] 📗 담보 사전이 <b>진짜 사전</b>이다 — 담보마다 약관 범위 · 왜 필요 · 확인할 것
       ★ 글은 kijun-dict.js · DESC 에서 옵니다 — 여기서 다시 쓰지 않습니다 (5번)
   [4] 🎓 보장분석 기준이 <b>갈래로 묶여</b> 있고 꼭지마다 「고객에게 이렇게」가 있다
   [5] 👥 연령대별 기준 — 여섯 구간 한눈에 표 · 첫 3분 · <b>이 집 숫자로 셈한 보험료</b>
       ★ 월소득을 안 적으면 금액을 <b>짐작해 적지 않는다</b> (1번)
   [6] 🧠 두뇌 — 「바로 걸리는 말」을 여섯에서 <b>자르지 않는다</b> · 공부방이 펴져 있다
   [7] 📋 자동 보장분석 — <b>전부 펴기</b> 길이 있고, 기본은 한 칸씩이다 (6번)
   [8] 📋 가입설계 요청서 — 이 도구가 <b>모르는 칸</b>을 적는 자리로 두고 그렇게 말한다
       ★ 담보 줄에 <b>지급 방식 · 약관 범위</b>가 있다 — 받는 쪽이 틀리지 않게
   [9] 어느 화면에도 <b>undefined · NaN</b> 이 안 찍힌다 · 터진 곳 0

   되돌려 보기 — 자료 띠를 지우면 [1], 엑셀을 띠에서 빼면 [2],
   사전 잇기를 끊으면 [3], 갈래를 지우면 [4], 첫 3분을 빼면 [5],
   여섯에서 자르면 [6], 적는 칸을 빼면 [8] 이 웁니다.
   ══════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = path.resolve(__dirname, '..');

let 깬 = 0, 본 = 0;
function head(t) { console.log('\n' + t.replace(/<[^>]+>/g, '')); }
function is(ok, t) { 본++; if (!ok) 깬++; console.log((ok ? '  ✓ ' : '  ✗ ') + t.replace(/<[^>]+>/g, '')); }

const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

(async () => {
  console.log('══ 📚 보장분석 전·후 — 보는 자료가 숨지 않고 서는가 (판 X556) ══');
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
  const ctx = await br.newContext({ viewport: { width: 1400, height: 1000 } });
  /* 바깥은 끊습니다 — 점검이 사장님 진짜 서버를 두드리면 안 됩니다 */
  await ctx.route('**://**', rt => rt.request().url().indexOf('127.0.0.1:' + P) >= 0
    ? rt.continue() : rt.abort());
  const pg = await ctx.newPage();
  pg.on('pageerror', e => 터짐.push(String(e.message).slice(0, 100)));
  pg.on('dialog', d => d.accept());
  await pg.goto('http://127.0.0.1:' + P + '/app/ba.html', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForTimeout(2500);
  await pg.evaluate(() => { try { doSample(); } catch (e) {} });
  await pg.waitForTimeout(900);

  head('[1] 📚 자료 띠가 늘 보이나 — 눌러 열지 않아도');
  const bar = await pg.evaluate(() => {
    const b = document.getElementById('baDocBar');
    if (!b) return { 있나: false };
    const bs = [].slice.call(b.querySelectorAll('button'));
    const r = b.getBoundingClientRect();
    return { 있나: true, 보이나: getComputedStyle(b).display !== 'none' && r.height > 0,
      이름: bs.map(x => (x.textContent || '').trim()),
      키: Math.min.apply(null, bs.map(x => Math.round(x.getBoundingClientRect().height))),
      더보기안: [].slice.call(document.querySelectorAll('#barMoreBox button')).map(x => (x.textContent || '').trim()) };
  });
  is(bar.있나 && bar.보이나, '  자료 띠가 <b>서 있다</b>');
  const 꼭 = ['윤시현의 두뇌', '자동 보장분석', '보장분석 기준', '연령대별 기준', '담보 사전', '사용방법'];
  꼭.forEach(n => is((bar.이름 || []).some(x => x.indexOf(n) >= 0), '  「' + n + '」 이 띠에 있다'));
  is(bar.키 >= 44, '  손가락이 닿는 <b>44px</b> 이상 (' + bar.키 + 'px)');
  is(!(bar.더보기안 || []).some(x => /보장분석 기준|연령대별 기준/.test(x)),
    '  ★★ 기준·연령대가 <b>「⋯ 더보기」 안에 없다</b> — 숨지 않습니다');

  head('[2] 📊 엑셀로 내려받기가 위 띠에 서나');
  const xl = await pg.evaluate(() => {
    const sp = document.querySelector('.bar .sp');
    const top = [].slice.call(sp.querySelectorAll(':scope > button')).filter(b => b.offsetParent !== null);
    return { 위띠: top.map(b => (b.textContent || '').trim()), 수: top.length,
      표에도: /엑셀로 내려받기/.test(document.getElementById('app').textContent) ||
        !!document.querySelector('button.mini.xl') };
  });
  is(xl.위띠.some(x => /엑셀로 내려받기/.test(x)), '  ★★ <b>엑셀로 내려받기</b>가 위 띠에 있다');
  is(xl.위띠.some(x => /담보별 분리자료/.test(x)), '  🖨 담보별 분리자료도 위 띠에 있다');
  is(xl.수 <= 6, '  위 띠 단추가 <b>여섯 이하</b>다 (' + xl.수 + ') — 열한 개로 돌아가지 않았습니다');
  is(xl.표에도 === true, '  ⑤ 표준 담보표의 <b>그 자리도 그대로</b>다 — 길을 지우지 않습니다 (6번)');

  head('[3] 📗 담보 사전이 진짜 사전인가');
  const dic = await pg.evaluate(() => {
    S.mode = 'edit'; S.panel = 'dict'; render();
    let n = 0, have = 0;
    STD.forEach(g => g.rows.forEach(r => {
      n++; let d = null; try { d = ppDict(PP_K2D[r.k] || ''); } catch (e) {}
      if (d || DESC[r.k]) have++;
    }));
    return { 담보: n, 글있는담보: have,
      칸: document.querySelectorAll('.kjc').length,
      약관범위: document.querySelectorAll('.kjc .kja').length,
      왜: document.querySelectorAll('.kjc .kjl.y').length,
      확인: document.querySelectorAll('.kjc .kjl.c').length,
      한줄: document.querySelectorAll('.kjc .kjl.one').length,
      목차: document.querySelectorAll('.kjjump a').length };
  });
  is(dic.칸 === dic.담보, '  담보 <b>' + dic.담보 + '가지가 모두</b> 칸으로 섰다 (' + dic.칸 + ')');
  is(dic.글있는담보 === dic.담보,
    '  ★★ <b>글이 빠진 담보가 없다</b> (' + dic.글있는담보 + '/' + dic.담보 + ')');
  is(dic.약관범위 >= 60, '  <b>약관에서 보는 범위</b>가 ' + dic.약관범위 + '가지에 적혀 있다');
  is(dic.왜 >= 60, '  <b>왜 필요한가</b>가 ' + dic.왜 + '가지에 적혀 있다');
  is(dic.확인 >= 60, '  <b>확인할 것</b>이 ' + dic.확인 + '가지에 적혀 있다');
  is(dic.한줄 >= 60, '  <b>한 줄로</b>가 ' + dic.한줄 + '가지에 적혀 있다');
  is(dic.목차 >= 10, '  묶음 목차가 <b>' + dic.목차 + '칸</b> 섰다 — 접지 않습니다');
  /* 글은 사전 한 곳에서 옵니다 — ba.html 이 다시 적지 않았나 (5번) */
  const SRC = fs.readFileSync(path.join(ROOT, 'app/ba.html'), 'utf8');
  is(SRC.indexOf('ppDict(PP_K2D[r.k]') >= 0,
    '  ★ 사전을 <b>kijun-dict.js 에서 가져다</b> 쓴다 — 여기 다시 적지 않습니다 (5번)');

  head('[4] 🎓 보장분석 기준이 갈래로 묶였나');
  const st = await pg.evaluate(() => {
    S.mode = 'edit'; S.panel = 'study'; render();
    const ALL = STUDY_DOC.concat(STUDY_DOC2);
    return { 꼭지: ALL.length, 갈래표: (typeof STUDY_GRP !== 'undefined') ? STUDY_GRP.length : 0,
      갈래없는꼭지: ALL.filter(d => !d.g).length,
      say없는꼭지: ALL.filter(d => !d.say).length,
      묶음: document.querySelectorAll('#app .kjg').length,
      고객에게: document.querySelectorAll('.ssay').length,
      목차: document.querySelectorAll('.kjjump a').length };
  });
  is(st.갈래표 >= 4, '  갈래가 <b>' + st.갈래표 + '가지</b> 있다');
  is(st.갈래없는꼭지 === 0, '  <b>갈래를 안 적은 꼭지가 없다</b>');
  is(st.묶음 === st.갈래표, '  갈래마다 칸이 섰다 (' + st.묶음 + '/' + st.갈래표 + ')');
  is(st.say없는꼭지 === 0, '  ★★ 꼭지 ' + st.꼭지 + '가지에 <b>모두</b> 「고객에게 이렇게」가 있다');
  is(st.고객에게 === st.꼭지, '  그 줄이 <b>화면에 섰다</b> (' + st.고객에게 + '/' + st.꼭지 + ')');
  is(st.목차 >= 4, '  목차가 섰다 (' + st.목차 + ') — 접지 않습니다');

  head('[5] 👥 연령대별 기준 — 한눈에 · 첫 3분 · 이 집 숫자');
  const ag = await pg.evaluate(() => {
    S.mode = 'edit'; S.panel = 'age'; S.who.incMan = '500'; render();
    const t = document.getElementById('app').textContent;
    return { 구간: AGE_GUIDE.length,
      say3없는구간: AGE_GUIDE.filter(g => !g.say3 || !g.say3.length).length,
      pr없는구간: AGE_GUIDE.filter(g => g.pr === undefined).length,
      첫3분: document.querySelectorAll('.a3m').length,
      표줄: document.querySelectorAll('table.agcmp tr').length,
      목차: document.querySelectorAll('.kjjump a').length,
      이집셈: /이 집 월소득/.test(t), 셈한값: (t.match(/월 <?b?>?[\d,]+만원? ~ /) || [''])[0] };
  });
  is(ag.첫3분 === ag.구간, '  ★★ <b>첫 3분</b> 대본이 여섯 구간 전부에 있다 (' + ag.첫3분 + '/' + ag.구간 + ')');
  is(ag.say3없는구간 === 0, '  대본을 안 적은 구간이 없다');
  is(ag.pr없는구간 === 0, '  보험료 퍼센트를 <b>한 곳(pr)</b>에 다 적었다');
  is(ag.표줄 === ag.구간 + 1, '  여섯 구간 <b>한눈에 표</b>가 섰다 (머리 + ' + ag.구간 + '줄)');
  is(ag.목차 === ag.구간, '  목차가 여섯 구간을 가리킨다 (' + ag.목차 + ')');
  is(ag.이집셈 === true, '  ★★ 월소득을 적으면 <b>이 집 숫자로</b> 보험료를 셈한다');
  const ag2 = await pg.evaluate(() => {
    S.who.incMan = ''; render();
    const t = document.getElementById('app').textContent;
    return { 안적으면: /월소득.{0,12}적으시면/.test(t), 짐작: /이 집 월소득/.test(t) };
  });
  is(ag2.짐작 === false && ag2.안적으면 === true,
    '  ★★ 월소득이 없으면 <b>짐작해 적지 않고</b> 적어 달라고 말한다 (1번)');

  head('[6] 🧠 두뇌 — 자르지 않나 · 공부방이 펴져 있나');
  const br2 = await pg.evaluate(() => {
    S.mode = 'edit'; S.panel = 'brain'; render();
    const B = brainPick();
    return { hot: B.hot.length, 선카드: document.querySelectorAll('#bq1 .brains .brain, #bq1 .brains > *').length,
      더보기자름: !!document.querySelector('.bhotmore'),
      공부방열림: !!(document.getElementById('bq4') || {}).open,
      그밖: document.querySelectorAll('#bq5 .brains > *').length, rest: B.rest.length };
  });
  is(br2.더보기자름 === false, '  ★★ 「바로 걸리는 말」을 <b>여섯에서 자르지 않는다</b>');
  is(br2.선카드 >= br2.hot, '  걸린 말 <b>' + br2.hot + '개가 전부</b> 섰다 (' + br2.선카드 + ')');
  is(br2.공부방열림 === true, '  🏥 병원비 공부방이 <b>펴져 있다</b>');
  is(br2.그밖 >= br2.rest, '  그 밖의 비유 ' + br2.rest + '개도 <b>펴져 있다</b> (' + br2.그밖 + ')');
  const br3 = await pg.evaluate(() => {
    const 닫힘 = [].slice.call(document.querySelectorAll('.bmore')).filter(d => !d.open).length;
    const 길 = /카드 속.*전부 펴기/.test(document.getElementById('app').textContent);
    brainAllOpen();
    const 열림 = [].slice.call(document.querySelectorAll('.bmore')).filter(d => d.open).length;
    const 전체 = document.querySelectorAll('.bmore').length;
    brainAllOpen();
    return { 기본닫힘: 닫힘, 길: 길, 열림: 열림, 전체: 전체 };
  });
  is(br3.길 === true, '  <b>카드 속까지 전부 펴기</b> 길이 있다');
  is(br3.열림 === br3.전체 && br3.전체 > 0,
    '  누르면 카드 속 <b>' + br3.전체 + '장이 한꺼번에</b> 펴진다 (' + br3.열림 + ')');

  head('[7] 📋 자동 보장분석 — 전부 펴기 길이 있나');
  const ft = await pg.evaluate(() => {
    S.mode = 'edit'; S.panel = 'fit'; S.fitAll = false; render();
    const one = [].slice.call(document.querySelectorAll('.fitsec')).filter(x => x.offsetParent !== null).length;
    const has = /전부 펴기/.test(document.getElementById('app').textContent);
    fitAllOpen();
    const all = [].slice.call(document.querySelectorAll('.fitsec')).filter(x => x.offsetParent !== null).length;
    const n = document.querySelectorAll('.fitsec').length;
    fitAllOpen();
    return { 기본: one, 전부: all, 칸: n, 길: has };
  });
  is(ft.기본 === 1, '  기본은 <b>한 칸씩</b>이다 (' + ft.기본 + ') — 고객 앞 자리는 그대로 (6번)');
  is(ft.길 === true, '  <b>전부 펴기</b> 길이 있다');
  is(ft.전부 === ft.칸, '  누르면 <b>' + ft.칸 + '칸이 한꺼번에</b> 선다 (' + ft.전부 + ')');

  head('[8] 📋 가입설계 요청서 — 모르는 칸을 적는 자리로');
  const rq = await pg.evaluate(() => {
    S.panel = ''; go('req');
    const t = document.getElementById('app').textContent;
    return { 적는칸: document.querySelectorAll('.rqfill td').length,
      말하나: /짐작해 채우지 않았습니다/.test(t),
      직업: /직업/.test(t), 수익자: /수익자/.test(t), 고지: /추적관찰/.test(t),
      납입: /자동이체일/.test(t), 담당: /담당 설계사/.test(t),
      확인칸: document.querySelectorAll('.rqchk li').length,
      승환: /승환계약/.test(t), 세금: /세무 전문가/.test(t), 심사: /심사 결과에 따릅니다/.test(t),
      지급칸: document.querySelectorAll('.rqc td.u').length,
      범위칸: document.querySelectorAll('.rqc td.w').length,
      넓이: Math.round((document.querySelector('.rq') || { getBoundingClientRect: () => ({ width: 0 }) }).getBoundingClientRect().width) };
  });
  is(rq.적는칸 >= 10, '  ★★ 이 도구가 <b>모르는 칸</b>이 적는 자리로 섰다 (' + rq.적는칸 + '칸)');
  is(rq.말하나 === true, '  ★ <b>짐작해 채우지 않았다</b>고 그 자리에서 말한다 (1번)');
  ['직업', '수익자', '고지', '납입', '담당'].forEach(k =>
    is(rq[k] === true, '  ' + ({ 직업: '직업', 수익자: '수익자', 고지: '최근 5년 입원·수술·추적관찰',
      납입: '납입 방법 · 자동이체일', 담당: '담당 설계사' })[k] + ' 칸이 있다'));
  is(rq.확인칸 >= 4, '  ✅ 넘기기 전 확인이 <b>' + rq.확인칸 + '가지</b> 적혀 있다');
  is(rq.승환 === true, '  <b>승환계약</b>(갈아타기 비교설명)을 짚는다');
  is(rq.심사 === true, '  「<b>심사 결과에 따릅니다</b>」 를 빼지 않았다 (2번)');
  is(rq.세금 === true, '  세금은 <b>세무 전문가</b>에게 넘긴다 (2번)');
  is(rq.지급칸 >= 1 && rq.범위칸 >= 1,
    '  ★★ 담보 줄에 <b>지급 방식 · 약관 범위</b>가 있다 (' + rq.지급칸 + ' · ' + rq.범위칸 + ')');
  is(rq.넓이 > 1000, '  종이가 <b>넓게</b> 선다 (' + rq.넓이 + 'px) — 왼쪽 반만 쓰지 않습니다');

  head('[9] 보여주기 무대를 안 줄였나 · 지어낸 글자가 없나');
  const sh = await pg.evaluate(() => {
    go('show');
    const b = document.getElementById('baDocBar');
    return { 자료띠접힘: !b || getComputedStyle(b).display === 'none' };
  });
  is(sh.자료띠접힘 === true, '  ★★ 보여주기 때 자료 띠가 <b>접힌다</b> — 발표 무대를 안 줄입니다 (판 X541)');
  const bad = await pg.evaluate(() => {
    const out = {};
    ['brain', 'fit', 'study', 'age', 'dict', 'guide'].forEach(k => {
      S.mode = 'edit'; S.panel = k; render();
      const t = document.getElementById('app').textContent;
      out[k] = (t.match(/undefined|\bNaN\b/g) || []).length;
    });
    S.panel = ''; go('req');
    out.req = (document.getElementById('app').textContent.match(/undefined|\bNaN\b/g) || []).length;
    return out;
  });
  const 합 = Object.keys(bad).reduce((a, k) => a + bad[k], 0);
  is(합 === 0, '  일곱 화면에 <b>undefined · NaN</b> 이 하나도 없다 (' + 합 + ')');
  if (터짐.length) 터짐.slice(0, 5).forEach(e => console.log('      · ' + e));
  is(터짐.length === 0, '  터진 곳 <b>0</b>');

  await br.close();
  srv.close();
  console.log('\n' + (깬 ? ('✗ ' + 깬 + '/' + 본 + ' 깨짐')
    : ('✓ ' + 본 + '가지 모두 통과 — 자료가 숨지 않고 섭니다')));
  process.exit(깬 ? 1 : 0);
})().catch(e => { console.error('터짐: ' + (e && e.stack || e)); process.exit(1); });
