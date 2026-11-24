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

  head('[5-2] 🎯 담보 핵심 — 연령대별로 차이가 큰가 (사장님 말씀 「차이가 커야만해」)');
  const df = await pg.evaluate(() => {
    S.mode = 'edit'; S.panel = 'age'; render();
    const G = AGE_GUIDE;
    const one = G.map(g => ((g.core || [])[0] || {}).g || '');
    const uniq = one.filter((x, i) => x && one.indexOf(x) === i).length;
    /* 설계 화법 — 구간 사이에 같은 문장이 있나 */
    const all = []; G.forEach(g => (g.talk5 || []).forEach(t => all.push((t || '').replace(/<[^>]+>/g, '').trim())));
    const dup = all.filter((t, i) => t && all.indexOf(t) !== i).length;
    /* 담보안(AGE_PLAN) — 구간끼리 순위가 실제로 다른가 */
    const mids = STD.map(x => x.mid);
    let pairs = 0, diff = 0;
    for (let a = 0; a < G.length; a++) for (let b = a + 1; b < G.length; b++) {
      pairs++;
      let d = 0;
      mids.forEach(m => {
        const x = (AGE_PLAN[G[a].k] || {})[m], y = (AGE_PLAN[G[b].k] || {})[m];
        if (!x || !y) return;
        if (x.p !== y.p || x.m !== y.m) d++;
      });
      if (d >= 3) diff++;
    }
    return { 구간: G.length, 일순위: one, 서로다른일순위: uniq,
      화법줄: all.filter(Boolean).length, 겹친화법: dup,
      굳이없는구간: G.filter(g => !g.drop || !g.drop.length).length,
      쌍: pairs, 많이다른쌍: diff,
      화면핵심: document.querySelectorAll('.acore .ac').length,
      화면화법: document.querySelectorAll('.atalk5 li').length,
      표핵심: document.querySelectorAll('table.agcmp td.acore1').length };
  });
  is(df.서로다른일순위 === df.구간,
    '  ★★ <b>1순위 핵심 담보가 여섯 구간 모두 다르다</b> (' + df.서로다른일순위 + '/' + df.구간 + ') — ' +
    df.일순위.join(' · '));
  is(df.겹친화법 === 0,
    '  ★★ 설계 화법 ' + df.화법줄 + '줄에 <b>구간끼리 똑같은 문장이 없다</b> (' + df.겹친화법 + ')');
  is(df.화법줄 === df.구간 * 5, '  설계 화법이 구간마다 <b>다섯 걸음</b>이다 (' + df.화법줄 + ')');
  is(df.굳이없는구간 === 0, '  구간마다 <b>「이 나이엔 굳이」</b> 가 적혀 있다');
  is(df.많이다른쌍 === df.쌍,
    '  ★ 담보안도 구간끼리 <b>세 묶음 이상 다르다</b> (' + df.많이다른쌍 + '/' + df.쌍 + '쌍)');
  is(df.화면핵심 >= df.구간, '  핵심 담보가 <b>화면에 섰다</b> (' + df.화면핵심 + '칸)');
  is(df.화면화법 >= df.구간 * 5, '  설계 화법이 <b>화면에 섰다</b> (' + df.화면화법 + '줄)');
  is(df.표핵심 === df.구간, '  한눈에 표에 <b>1순위 칸</b>이 있다 (' + df.표핵심 + ')');

  head('[5-3] ✏️ 연령대 기준을 사장님이 고치실 수 있나');
  const ed = await pg.evaluate(() => {
    S.mode = 'edit'; S.panel = 'age'; S.agEdit = {}; S.agEditing = ''; render();
    const btn = document.querySelectorAll('.ag .ah button').length;
    ageEdOpen('40');
    const 칸 = { 금액: !!document.getElementById('ageAmt'), 납입: !!document.getElementById('ageTerm'),
      퍼센트: !!document.getElementById('agePrLo'), 핵심: !!document.getElementById('ageCg0'),
      화법: !!document.getElementById('ageT0') };
    /* 실제로 고쳐 봅니다 — 창이 안 열렸으면 <b>터지지 않고</b> 빨간불로 적습니다 (8번) */
    if (!칸.금액 || !칸.핵심 || !칸.화법)
      return { 단추: btn, 칸: 칸, 섰나: false, 퍼센트: false, 담겼나: false, 되돌아왔나: false,
               못연까닭: '✏️ 고치기 창이 안 열렸습니다' };
    document.getElementById('ageAmt').value = '점검용 금액 기준';
    document.getElementById('agePrLo').value = '3';
    document.getElementById('agePrHi').value = '4';
    document.getElementById('ageCg0').value = '골절 · 화상';
    document.getElementById('ageCw0').value = '점검용 까닭';
    document.getElementById('ageT0').value = '점검용 여는 말';
    ageEdSave('40');
    const t = document.getElementById('app').textContent;
    const 섰나 = /점검용 금액 기준/.test(t) && /점검용 여는 말/.test(t) && /점검용 까닭/.test(t);
    const 퍼센트 = /3~4%/.test(t);
    const 담겼나 = !!(S.agEdit && S.agEdit['40'] && S.agEdit['40'].amt === '점검용 금액 기준');
    ageEdReset('40');
    const u = document.getElementById('app').textContent;
    const 되돌아왔나 = !/점검용/.test(u) && !(S.agEdit || {})['40'];
    return { 단추: btn, 칸: 칸, 섰나: 섰나, 퍼센트: 퍼센트, 담겼나: 담겼나, 되돌아왔나: 되돌아왔나 };
  });
  is(ed.단추 >= 6, '  구간마다 <b>✏️ 고치기</b> 단추가 있다 (' + ed.단추 + ')');
  if (ed.못연까닭) console.log('      · ' + ed.못연까닭);
  ['금액', '납입', '퍼센트', '핵심', '화법'].forEach(k =>
    is(ed.칸[k] === true, '  고치는 칸에 <b>' + k + '</b> 이 있다'));
  is(ed.섰나 === true, '  ★★ 고치면 <b>그 자리에서 바뀐다</b> (금액 · 핵심 담보 · 화법)');
  is(ed.퍼센트 === true, '  보험료 퍼센트도 고쳐진다 (3~4%)');
  is(ed.담겼나 === true, '  고친 값이 <b>담긴다</b> (S.agEdit)');
  is(ed.되돌아왔나 === true, '  ★ <b>처음 값으로</b> 되돌아간다 — 길이 한쪽만 있지 않습니다 (6번)');

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
  const br4 = await pg.evaluate(() => {
    const D = BRAIN_DOC;
    return { 장: D.length,
      show없음: D.filter(d => !d.show).length, no없음: D.filter(d => !d.no).length,
      next없음: D.filter(d => !d.next).length,
      화면show: document.querySelectorAll('.bshow').length,
      화면no: document.querySelectorAll('.bno').length,
      화면next: document.querySelectorAll('.bnext').length };
  });
  is(br4.show없음 === 0 && br4.no없음 === 0 && br4.next없음 === 0,
    '  ★★ 열두 장 <b>모두</b>에 「여기서 보여 주십시오 · 이렇게는 말하지 마십시오 · 그다음 물음」 이 있다');
  is(br4.화면show >= br4.장 && br4.화면no >= br4.장 && br4.화면next >= br4.장,
    '  그 세 줄이 <b>화면에 섰다</b> (' + br4.화면show + ' · ' + br4.화면no + ' · ' + br4.화면next + ')');
  is(br3.열림 === br3.전체 && br3.전체 > 0,
    '  누르면 카드 속 <b>' + br3.전체 + '장이 한꺼번에</b> 펴진다 (' + br3.열림 + ')');

  head('[6-2] 📣 이 설계를 설명하는 화법 (사장님 말씀 「설계를 하면 설명하는 화법까지」)');
  const bp0 = await pg.evaluate(() => {
    doReset(); S.mode = 'edit'; S.panel = 'brain'; render();
    const t = (document.getElementById('bq0') || { textContent: '' }).textContent;
    return { 없을때: /아직 설계가 없습니다/.test(t), 지어냄: /여는 말[\s\S]{0,40}닫는 말/.test(t) };
  });
  is(bp0.없을때 === true, '  ★ 설계가 없으면 <b>말을 지어내지 않는다</b> — 무엇을 채울지 적는다 (1번)');
  const bp = await pg.evaluate(() => {
    doSample(); S.mode = 'edit'; S.panel = 'brain'; render();
    const b = document.getElementById('bpBox'), t = b ? b.textContent : '';
    const P = premCalc();
    return { 칸: document.querySelectorAll('.bps').length,
      담보: document.querySelectorAll('.bpc').length,
      핵심표: document.querySelectorAll('.bpk').length,
      되받아침: document.querySelectorAll('.bprb').length,
      이름샘: /홍철호|홍길동/.test(t),
      심사: /심사 결과에 따릅니다/.test(t),
      세무: /세무 전문가/.test(t),
      월보험료: t.indexOf(fee(P.monA)) >= 0,
      앞으로: t.indexOf(won(P.leftA)) >= 0,
      날글: (typeof bpPlain === 'function') ? bpPlain().length : 0,
      복사단추: /설명 화법 복사/.test(document.getElementById('app').textContent),
      쓰레기: (t.match(/undefined|\bNaN\b/g) || []).length };
  });
  is(bp.칸 >= 7, '  ★★ 설계가 있으면 <b>여는 말부터 닫는 말까지 ' + bp.칸 + '칸</b>이 선다');
  is(bp.담보 >= 1, '  늘어나는 담보를 <b>하나씩</b> 말한다 (' + bp.담보 + '가지)');
  is(bp.핵심표 >= 1, '  <b>이 나이 핵심</b> 담보에 표가 붙는다 (' + bp.핵심표 + ')');
  is(bp.되받아침 >= 2, '  <b>되받아침</b>을 미리 준다 (' + bp.되받아침 + '가지)');
  is(bp.이름샘 === false, '  ★★ <b>고객 이름이 한 자도 안 들어간다</b> — 복사해 어디 붙이실지 모릅니다 (3번)');
  is(bp.월보험료 === true && bp.앞으로 === true,
    '  ★★ 보험료가 <b>이 도구가 센 값 그대로</b>다 — 다시 셈하지 않습니다 (5번)');
  is(bp.심사 === true, '  「<b>심사 결과에 따릅니다</b>」 를 닫는 말에서 안 뺀다 (2번)');
  is(bp.세무 === true, '  세금은 <b>세무 전문가</b>에게 넘긴다 (2번)');
  is(bp.복사단추 === true && bp.날글 > 200, '  <b>복사</b>할 수 있다 (날글 ' + bp.날글 + '자)');
  is(bp.쓰레기 === 0, '  undefined · NaN 이 없다');

  head('[6-3] 💼 따라만 해도 계약까지 가나 (사장님 말씀 「확인하고 정리해」 → 「다 고쳐줘」)');
  const cl = await pg.evaluate(() => {
    doSample(); S.who.incMan = '500'; S.mode = 'edit'; S.panel = 'brain'; render();
    const b = document.getElementById('bpBox'), t = b ? b.textContent : '';
    const mids = [].slice.call(document.querySelectorAll('.bp3i b')).map(x => {
      const nm = x.textContent; let k = '';
      for (const kk in NAME) if (NAME[kk] === nm) k = kk;
      return MID[k] || nm;
    });
    const uniq = mids.filter((m, i) => mids.indexOf(m) === i).length;
    /* 구간마다 깨닫게 하는 질문 */
    const nqNo = AGE_GUIDE.filter(g => !g.nq || g.nq.length < 2).length;
    const nqAll = []; AGE_GUIDE.forEach(g => (g.nq || []).forEach(q => nqAll.push(q.replace(/<[^>]+>/g, '').trim())));
    const nqDup = nqAll.filter((q, i) => nqAll.indexOf(q) !== i).length;
    return {
      세가지: document.querySelectorAll('.bp3i').length, 묶음: uniq,
      예산묻기: document.querySelectorAll('.bpask').length,
      예산먼저: /얼마까지면 해 보시겠다/.test(t),
      클로징: document.querySelectorAll('.bpcl').length,
      진행: /이대로 진행하겠습니다/.test(t),
      날짜: /며칠에 뵐까요/.test(t),
      안하셔도: /안 하시는 것도 갈래의 하나/.test(t),
      상의: /상의해 보고요/.test(t), 여유: /여유가 없어서요/.test(t), 다른데: /다른 데서도/.test(t),
      되받아침: document.querySelectorAll('.bprb').length,
      nq없는구간: nqNo, nq겹침: nqDup, nq수: nqAll.length,
      화면nq: (S.panel = 'age', render(), document.querySelectorAll('.ab.nq li').length),
      해지빈칸: /정리하는 것\(해지\)[^。]{0,80}\.\s*⚠/.test(t)
    };
  });
  is(cl.세가지 === 3, '  ★★ <b>오늘 꼭 말할 세 가지</b>가 선다 (' + cl.세가지 + ') — 열 개를 다 읽지 않습니다');
  is(cl.묶음 === 3, '  ★ 세 가지가 <b>서로 다른 묶음</b>이다 (' + cl.묶음 + '/3) — 같은 말을 세 번 하지 않습니다');
  is(cl.예산묻기 >= 1 && cl.예산먼저, '  ★★ 보험료를 말하기 <b>전에 예산을 묻는다</b> — 통보하지 않습니다');
  is(cl.클로징 === 3, '  ★★ <b>클로징이 세 갈래</b>로 있다 (' + cl.클로징 + ') — 이대로 / 하나만 / 오늘은 안 정함');
  is(cl.진행 === true, '  ★★ <b>「이대로 진행하겠습니다」</b> — 결정을 요청하는 말이 있다');
  is(cl.날짜 === true, '  <b>다음 날짜</b>를 잡는다 — 날짜 없이 끝내지 않습니다');
  is(cl.안하셔도 === true, '  ★ <b>안 하시는 것도 갈래</b>라고 적는다 — 밀어붙이지 않습니다 (6번)');
  is(cl.상의 && cl.여유 && cl.다른데,
    '  ★★ 가장 많이 듣는 거절 <b>셋</b>이 다 있다 — 배우자 상의 · 여유 없음 · 다른 데서도');
  is(cl.되받아침 >= 6, '  되받아침이 <b>' + cl.되받아침 + '가지</b>다');
  is(cl.nq없는구간 === 0, '  ★★ 구간마다 <b>깨닫게 하는 질문</b>이 둘씩 있다 (' + cl.nq수 + '가지)');
  is(cl.nq겹침 === 0, '  그 질문이 구간끼리 <b>겹치지 않는다</b>');
  is(cl.화면nq >= 12, '  연령대 카드에 <b>화면으로 섰다</b> (' + cl.화면nq + '줄)');

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
