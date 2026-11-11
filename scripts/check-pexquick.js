/* ═══════════════════════════════════════════════════════════════════
   check-pexquick.js — ✍️ <b>예상업적을 오늘(홈)에서 바로 적나</b> (판 X400)

   사장님 말씀 (2026-11-09) — 「팀원들이 <b>편하게 입력</b>하도록 조치를 취해
   <b>오늘에서</b> 할 순 없나」.

   손대기 전: 예상업적은 🧭 TFA 업무관리 → 팀 관리 → 📊 DB · 업적관리의
   <b>14칸 표</b> 안에서만 적혔습니다. 폰에서는 옆으로 밀어야 했고, 처음 열면
   AP·PC 만 보여 TA 고객에는 못 적었습니다. 홈은 「「DB · 업적관리」 에서
   적으시면」 이라고 <b>말만</b> 했습니다.

   ── 보는 것 ─────────────────────────────────────────────────────────
     [1] ★★ 간편 입력(edu-pipeline.html?quick=1) — 표 대신 <b>한 분 = 한 줄</b>
         · <b>AP · PC 만</b>, PC 묶음 → AP 묶음 · 묶음 안에서 <b>안 적힌 분이 위</b>
         · TA·CS·미접촉·계약완료·보류 빠짐 · 묶음 머리 합계가 치는 대로 바뀜
         (판 X402 · 사장님 말씀 2026-11-10 「예상업적은 AP-PC중인 사람들에 한해서」
          「기존에 분류했던 카테고리가 좋았는데」 → 여쭈니 「AP·PC만, 단계별 묶음」)
     [2] ★★ 「15」 를 치면 <b>150,000원</b>으로 표와 같은 문(pipeline_save)에 간다
         (만원으로 받고 원으로 담는다 · 4번) · Enter 는 다음 분 칸으로
     [3] ★★ 칸을 비우면 <b>빈 글</b>로 간다 — 서버에서 null(안 적음). 0 을 적지 않는다 (1번)
     [4] ★ 팀원은 <b>제 것만</b> · 팀장은 제 팀원까지 고르개로 · 남의 팀은 없다
     [5] ★ 폰에서 옆으로 안 밀리고 · 13px 밑 글씨 0 · 금액 칸 44px 이상
     [6] ★ ?quick 이 없으면 <b>원래 표 그대로</b>다
     [7] ★★ 홈 📊 상담현황에 <b>누르는 토막</b>이 서고, 누르면 <b>그 칸 바로 밑에</b> 펼쳐진다
         (판 X400 · 사장님 말씀 2026-11-10 「하나로 만들자. 두개로 나누지말고 같이 소통되도록」)
     [8] ★★★ 홈이 <b>한 px 도 안 길어진다</b> — 상담현황 단추 줄에 셋째 단추를 세우면
         390px 한 줄에 안 들어 4.2화면 선을 넘습니다(판 X193 에서 재어 본 자리).
         그래서 글 속 토막입니다. 토막을 맨글로 바꿔 그린 홈과 키를 견줍니다.
     [9] ★★★ <b>같이 소통</b> — 칸 안에서 치면 <b>위 「진행중 예상」 이 바로</b> 바뀐다 ·
         서버를 다시 읽지 않는다(7번) · 홈이 다시 그려져도 치던 판이 안 새로 뜬다 ·
         「접기」 하면 남은 것을 바로 보내고 칸이 비워진다

   ⚠ 서버는 가짜입니다 — 이 자는 「어느 문으로 무엇을 보내나」 를 봅니다.
     문이 실제로 적는지는 pipeline_save 의 일입니다(표가 이미 쓰는 문).
   ═══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const CLK = require('./lib-clock.js');

const 박는때 = 14;
const 며칠뒤 = (n) => CLK.kstDay(박는때, n);

const ROOT = path.resolve(__dirname, '..'), PORT = 8981;
const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{"key":null,"has":false}'); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 가짜 서버 — 팀원 me(홍길동) · 팀장 ld · 다른 팀 zz. 이름은 견본(홍길동)만 (3번) */
const FAKE = (rows) => `window.__CALLS=[];window.supabase={createClient:function(){
  var ROLE=(new URLSearchParams(location.search).get('as'))||'member';
  var ME=ROLE==='leader'?'ld':'me';
  var T={profiles:[{id:'me',name:'홍길동',role:'member',active:true},
      {id:'ld',name:'홍팀장',role:ROLE==='leader'?'leader':'member',active:true},
      {id:'zz',name:'홍남팀',role:'member',active:true}],
    teams:[{id:'T1',name:'한팀',leader_id:'ld'},{id:'T2',name:'두팀',leader_id:null}],
    team_members:[{team_id:'T1',member_id:'me'},{team_id:'T1',member_id:'ld'},{team_id:'T2',member_id:'zz'}],
    org_members:[], dbs:${JSON.stringify(rows)}};
  function Q(t){var q={select:function(){return q;},order:function(){return q;},eq:function(){return q;},range:function(){return q;},limit:function(){return q;},
    upsert:function(v){__CALLS.push({upsert:t,v:v});return Promise.resolve({error:null});},
    then:function(ok,no){return Promise.resolve({data:T[t]||[],error:null}).then(ok,no);}};return q;}
  return {auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:ME}}}});}},
    from:Q,
    rpc:function(n,a){__CALLS.push({rpc:n,a:a});return Promise.resolve({data:n==='pipeline_goals'?[]:null,error:null});}};
}};`;
const D = (id, who, stage, expect, extra) => Object.assign({ id, assigned_to: who, assigned_date: 며칠뒤(-5),
  source: '일반', region: '순천', customer_name: '홍길동' + id, next_appt: null, stage,
  expect_premium: expect, contract_premium: null, closed_reason: null }, extra || {});
const ROWS = [
  D('a1', 'me', 'AP', null, { next_appt: 며칠뒤(2) + 'T01:00:00Z' }),
  D('a2', 'me', 'PC', 150000),
  D('a3', 'me', 'PC', null),
  D('a4', 'me', '미접촉', null),
  D('a7', 'me', 'TA', null),
  D('a8', 'me', 'CS', null),
  D('a5', 'me', '계약완료', 300000, { contract_premium: 300000, contracted_at: 며칠뒤(-1) + 'T00:00:00Z' }),
  D('a6', 'me', 'AP', null, { closed_reason: '보류' }),
  D('b1', 'ld', 'AP', null),
  D('c1', 'zz', 'AP', null)];

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const errs = [];
  const 창 = async (vw) => {
    const ctx = await b.newContext(CLK.ctxOpt(vw ? { viewport: vw } : {}));
    await CLK.pin(ctx, 박는때);
    await ctx.route('**://**', r => {
      const u = r.request().url();
      if (u.indexOf('@supabase/supabase-js') >= 0) return r.fulfill({ status: 200, contentType: 'application/javascript', body: FAKE(ROWS) });
      if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
      return r.abort();
    });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(String(e).slice(0, 160)));
    return p;
  };

  /* ══ [1~5] 팀원 — 간편 입력 ══════════════════════════════════════ */
  console.log('\n[1] ✍️ 간편 입력 — <b>한 분 = 한 줄</b>, 안 적힌 분이 위');
  let p = await 창();
  await p.goto('http://127.0.0.1:' + PORT + '/edu-pipeline.html?quick=1', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForSelector('.qk-r', { timeout: 30000 });
  const A = await p.evaluate(() => ({
    quick: document.body.classList.contains('quick'),
    표: !!document.querySelector('table.gx'),
    줄: [...document.querySelectorAll('.qk-r')].map(r => r.dataset.qid + (r.classList.contains('need') ? '*' : '') + '=' + r.querySelector('[data-qx]').value),
    묶음: [...document.querySelectorAll('[data-qg]')].map(g => g.dataset.qg + ':' + g.querySelector('span').textContent),
    묶음줄: [...document.querySelectorAll('.qk-r')].map(r => { let g = r.previousElementSibling;
      while (g && !g.dataset.qg) g = g.previousElementSibling; return r.dataset.qid + '@' + (g ? g.dataset.qg : '-'); }).join(),
    칩: !!document.querySelector('[data-qall],.qk-chips,[data-addmid]'),
    고르개: !!document.getElementById('qk-who'),
    목표: !!document.querySelector('.qk-goal [data-goal="me"]'),
    옆: document.documentElement.scrollWidth - window.innerWidth,
    작은: [...document.querySelectorAll('#board *')].filter(e => e.offsetParent && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())
      && parseFloat(getComputedStyle(e).fontSize) < 13).map(e => e.tagName + ' ' + getComputedStyle(e).fontSize),
    칸: Math.min(...[...document.querySelectorAll('[data-qx]')].map(e => Math.round(e.getBoundingClientRect().height)))
  }));
  console.log('    줄: ' + A.줄.join(' · '));
  is(A.quick && !A.표, '표 대신 간편 판이 선다');
  console.log('    묶음: ' + A.묶음.join(' · '));
  is(A.줄.join(',') === 'a3*=,a2=15,a1*=', '★★ AP · PC 만 — PC(a3 안 적힘 → a2 15만) 다음 AP(a1) · TA·CS·미접촉·계약완료·보류 빠짐');
  is(A.묶음.join('|') === 'PC:2분 · 예상 15만원|AP:1분 · 예상 0만원', '★★ 단계별 묶음 머리 — PC 위 · AP 아래 · 몇 분 · 예상 합계');
  is(A.묶음줄 === 'a3@PC,a2@PC,a1@AP', '★ 줄은 제 단계 묶음 밑에 선다 (' + A.묶음줄 + ')');
  is(!A.칩, '「미접촉까지」 칩 · 「+ 새 고객 추가」 없음(새 줄은 미접촉이라 이 판에 안 보임 — 표에서 넣음)');
  is(A.목표, '월간목표 칸이 위에 선다(goalHTML 그대로 · 5번)');
  console.log('\n[4] 팀원은 제 것만');
  is(!A.고르개, '팀원에게는 담당자 고르개가 없다');
  console.log('\n[5] 폰에서 읽고 누르기');
  is(A.옆 <= 1, '390px 에서 옆으로 안 밀린다 (' + A.옆 + 'px)');
  is(!A.작은.length, '13px 밑 글씨 0 ' + (A.작은.length ? JSON.stringify(A.작은.slice(0, 4)) : ''));
  is(A.칸 >= 44, '금액 칸 ' + A.칸 + 'px ≥ 44');

  console.log('\n[2] 「15」 → 150,000원 · 표와 같은 문');
  await p.focus('[data-qx="a3"]'); await p.keyboard.type('20'); await p.keyboard.press('Enter');
  const 다음 = await p.evaluate(() => document.activeElement && document.activeElement.dataset.qx);
  is(다음 === 'a2', 'Enter → 다음 분 칸 (' + 다음 + ')');
  await p.keyboard.type('7');
  await p.waitForTimeout(1300);
  const C = await p.evaluate(() => __CALLS.filter(c => c.rpc === 'pipeline_save').map(c => c.a));
  console.log('    보낸 것: ' + JSON.stringify(C));
  is(C.some(c => c.p_id === 'a3' && c.p.expect_premium === '200000'), '★★ a3 「20」 → 200,000원 (pipeline_save)');
  is(C.some(c => c.p_id === 'a2' && c.p.expect_premium === '70000'), '★★ a2 「7」 → 70,000원 (Enter 로 넘어가면 칸이 골라져 있어 고쳐 쓴다)');
  is(C.every(c => Object.keys(c.p).join() === 'expect_premium'), '★ 예상업적 칸 하나만 보낸다(단계·이름은 안 건드린다)');
  is(await p.evaluate(() => !document.querySelector('[data-qid="a3"]').classList.contains('need')), '적으면 「안 적힘」 표시가 빠진다');
  const 머리 = await p.evaluate(() => document.querySelector('[data-qg="PC"] span').textContent);
  is(머리 === '2분 · 예상 27만원', '★★ 치는 대로 PC 묶음 머리 합계가 바뀐다 (' + 머리 + ')');

  console.log('\n[3] 비우면 「안 적음」 — 0 을 적지 않는다 (1번)');
  await p.evaluate(() => { const e = document.querySelector('[data-qx="a2"]'); e.value = ''; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.waitForTimeout(1100);
  const E = await p.evaluate(() => __CALLS.filter(c => c.rpc === 'pipeline_save' && c.a.p_id === 'a2').map(c => c.a.p.expect_premium));
  is(E.length && E[E.length - 1] === '', '★★ 빈 글로 보낸다 → 서버 null (' + JSON.stringify(E) + ')');
  await p.context().close();

  console.log('\n[4] 팀장 — 제 팀원까지, 남의 팀은 없다');
  p = await 창();
  await p.goto('http://127.0.0.1:' + PORT + '/edu-pipeline.html?quick=1&as=leader', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForSelector('#qk-who', { timeout: 30000 });
  const L = await p.evaluate(() => [...document.querySelectorAll('#qk-who option')].map(o => o.value));
  is(L.sort().join() === 'ld,me', '★ 고르개 = 나 + 제 팀원 (' + L.join() + ') — 남의 팀(zz) 없음');
  await p.selectOption('#qk-who', 'me');
  is(await p.evaluate(() => document.querySelectorAll('.qk-r').length) === 3, '팀원을 고르면 그 팀원 고객이 선다');
  await p.context().close();

  console.log('\n[6] ?quick 이 없으면 원래 표');
  p = await 창({ width: 1400, height: 900 });
  await p.goto('http://127.0.0.1:' + PORT + '/edu-pipeline.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForSelector('table.gx', { timeout: 30000 });
  is(await p.evaluate(() => !document.body.classList.contains('quick') && !document.querySelector('.qk-r')), '표 그대로 · 간편 판 없음');
  await p.context().close();

  /* ══ [7~9] 홈 ════════════════════════════════════════════════════ */
  console.log('\n[7] 홈 📊 상담현황 — 누르는 토막 · 덮개');
  p = await 창();
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => typeof renderHome === 'function' && typeof pexSum === 'function'
    && typeof hmPexOpen === 'function' && typeof APEX_PEX !== 'undefined', { timeout: 60000 });
  /* 이번 달 · 지난달 · 진행중 셋 다 「금액 안 적힘」 이 되게 심습니다 — 그때 「DB · 업적관리」 문장이 섭니다 */
  const 이번달 = 며칠뒤(0).slice(0, 7) + '-02';
  const 지난달 = (() => { const [y, m] = 며칠뒤(0).split('-').map(Number); const d = new Date(Date.UTC(y, m - 2, 15)); return d.toISOString().slice(0, 10); })();
  const H = await p.evaluate(async ({ 이번달, 지난달 }) => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.session = { user: { id: 'me' } };
    OS.profile = { id: 'me', user_id: 'me', name: '홍길동', role: 'owner', active: true, plan: 'vip' };
    window.osLoadProfile = function () {}; window.osProfileApply = function () {};
    window.osShowLoginGate = function () {}; window.__AR = 0; window.arLoad = function () { window.__AR++; };
    window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
    window.setupDone = function () { return true; };
    OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = [];
    CM.loaded = true; CM.meta = {};
    AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.calls = []; AR.noPex = false; AR.noLink = false;
    const mk = (id, stage, cAt) => ({ id, who: 'me', name: '홍길동', region: '순천', src: '일반', stage, expect: null, contract: null,
      closed: '', cAt: cAt || '', pAt: '', got: '2026-06-01', n: 1, last: '', res: '미진행', client_id: undefined, appt: '', memo: '', days: 10 });
    /* a1 은 끼운 판(가짜 서버 ROWS)의 그 줄과 <b>같은 id</b> — 판에서 치면 이 줄이 바뀌어야 합니다 */
    AR.db = [mk('d1', '계약완료', 이번달), mk('d2', '증권전달', 지난달), mk('a1', 'AP'), mk('d5', 'PC')];
    const wait = ms => new Promise(r => setTimeout(r, ms));
    try { go('home'); } catch (e) {}
    await wait(500);
    const pane = document.getElementById('dynPane');
    const 키 = () => pane.scrollHeight;
    const 있는 = 키();
    /* 토막을 맨글로 바꿔 다시 그린 홈 — 토막이 줄을 늘리는지 본다 */
    const 원래 = window.hmPexTap;
    window.hmPexTap = function (t) { return t; };
    try { go('home'); } catch (e) {}
    await wait(400);
    const 맨글 = 키();
    window.hmPexTap = 원래;
    try { go('home'); } catch (e) {}
    await wait(400);
    const card = document.getElementById('hmFlow');
    const fold = card && card.closest('.hm-fold');
    if (fold && !fold.classList.contains('on')) { try { hmFoldToggle(fold.id.replace('hmFold_', '')); } catch (e) {} }
    const taps = [...document.querySelectorAll('#hmFlow [data-hmpex]')];
    const line = () => ((document.querySelector('#hmFlow [data-pexline]') || {}).textContent || '');
    const r = { 있는, 맨글, 토막: taps.map(t => t.textContent), 높이: taps.map(t => Math.round(t.getBoundingClientRect().height)),
      빈칸: (document.getElementById('hmPexHost') || {}).innerHTML, 전줄: line() };
    if (taps[0]) {
      taps[0].click();
      await wait(300);
      const fr = document.getElementById('hmPexFr'), sh = document.getElementById('hmSheet');
      r.펼침 = !!fr; r.덮개 = !!(sh && sh.classList.contains('on'));
      r.주소 = fr ? fr.getAttribute('src') : '';
      /* 상담현황 카드 바로 밑에 섰나 — 카드 아래 끝과 칸 위 끝 사이 */
      const fh = document.getElementById('hmFlowHost'), ph = document.getElementById('hmPexHost');
      r.붙음 = !!(fh && ph && fh.nextElementSibling === ph);
    }
    return r;
  }, { 이번달, 지난달 });
  console.log('    토막: ' + JSON.stringify(H.토막) + ' · 높이 ' + JSON.stringify(H.높이));
  is(H.토막.length >= 1 && /진행중 예상/.test(H.토막[0]), '★★ 「✍️ 진행중 예상」 토막이 선다');
  is(H.토막.some(t => /DB · 업적관리/.test(t)), '금액이 다 안 적혔으면 「「DB · 업적관리」」 도 누르는 토막이다(말만 하지 않는다 · 6번)');
  is(H.높이.length && Math.min(...H.높이) >= 44, '누르는 넓이 ' + JSON.stringify(H.높이) + 'px ≥ 44');
  is(H.펼침 && !H.덮개 && /edu-pipeline\.html\?quick=1&embed=1/.test(H.주소 || ''),
    '★★ 누르면 덮개가 아니라 <b>칸 안에</b> 펼쳐진다 (' + H.주소 + ')');
  is(H.붙음, '★ 펼친 칸은 📊 상담현황 바로 밑 — 그러나 #hmFlowHost 밖(다시 그려도 안 지워짐)');
  console.log('\n[8] 홈이 한 px 도 안 길어진다 (접힌 때)');
  is(H.있는 === H.맨글, '★★★ 토막이 있는 홈 ' + H.있는 + 'px = 맨글 홈 ' + H.맨글 + 'px');
  is(H.빈칸 === '', '접힌 때 적는 칸은 빈 칸이다');

  console.log('\n[9] 같이 소통 — 치면 위 합계가 바로');
  const fr = p.frameLocator('#hmPexFr');
  await fr.locator('[data-qx="a1"]').waitFor({ timeout: 30000 });
  const 판 = await p.evaluate(async () => {
    await new Promise(r => setTimeout(r, 600));
    const f = document.getElementById('hmPexFr'), w = f.contentWindow;
    return { 키: Math.round(f.getBoundingClientRect().height),
      속키: Math.ceil(w.document.querySelector('main').getBoundingClientRect().bottom),
      띠: w.getComputedStyle(w.document.querySelector('nav')).display,
      제목: w.getComputedStyle(w.document.querySelector('.qk-top h2')).display,
      옆: w.document.documentElement.scrollWidth - w.innerWidth };
  });
  is(판.띠 === 'none' && 판.제목 === 'none', '칸 안에서는 판의 머리띠·제목을 안 세운다(홈이 이미 적음)');
  is(Math.abs(판.키 - 판.속키) <= 8, '★ 칸 키가 판 키에 맞춰 늘어난다 — 칸 안 스크롤 없음 (' + 판.키 + ' ≈ ' + 판.속키 + 'px)');
  is(판.옆 <= 1, '칸 안에서도 옆으로 안 밀린다 (' + 판.옆 + 'px)');
  await p.evaluate(() => { document.getElementById('hmPexFr').contentWindow.__첫판 = 1; });
  await fr.locator('[data-qx="a1"]').click();
  await p.keyboard.type('20');
  await p.waitForTimeout(250);
  const 후 = await p.evaluate(() => ({ 줄: ((document.querySelector('#hmFlow [data-pexline]') || {}).textContent || ''),
    db: (AR.db.find(x => x.id === 'a1') || {}).expect, ar: window.__AR }));
  console.log('    전: ' + H.전줄.replace(/\s+/g, ' ').slice(0, 90));
  console.log('    후: ' + 후.줄.replace(/\s+/g, ' ').slice(0, 90));
  is(후.db === 200000, '★★ 칸에서 「20」 → 홈 손의 그 줄이 200,000원 (' + 후.db + ')');
  is(/진행중 예상\s*20만원/.test(후.줄) && !/진행중 예상\s*금액 안 적힘/.test(후.줄),
    '★★★ 치자마자 위 「진행중 예상」 이 「금액 안 적힘」 → 20만원 — 닫지 않아도');
  is(후.ar === 0, '★ 서버를 다시 읽지 않는다 (7번) — arLoad ' + 후.ar + '번');
  /* 홈이 다시 그려져도(hmPaint) 판이 새로 안 뜬다 — 치던 칸을 잃지 않는다 */
  await p.evaluate(() => { try { hmPaint(); } catch (e) {} try { hmSidePlace(); } catch (e) {} });
  await p.waitForTimeout(300);
  const 같은판 = await p.evaluate(() => { const f = document.getElementById('hmPexFr'); return !!(f && f.contentWindow.__첫판 === 1); });
  is(같은판, '★★ 홈이 다시 그려져도 칸 안 판은 그대로 (치던 칸을 잃지 않음)');
  is(await p.evaluate(() => /20만원/.test((document.querySelector('#hmFlow [data-pexline]') || {}).textContent || '')),
    '다시 그려도 합계는 20만원 그대로(손의 줄을 고쳤으므로)');
  /* 접기 — 남은 것을 바로 보내고 칸을 비운다 */
  await fr.locator('[data-qx="a3"]').click();
  await p.keyboard.type('5');
  await p.evaluate(() => { const b = [...document.querySelectorAll('#hmPexIn button')].find(x => /접기/.test(x.textContent)); b.click(); });
  await p.waitForTimeout(400);
  const 보냄 = await p.evaluate(() => { const w = document.getElementById('hmPexFr').contentWindow;
    return w.__CALLS.filter(c => c.rpc === 'pipeline_save').map(c => c.a.p_id + '=' + c.a.p.expect_premium); });
  console.log('    보낸 것: ' + JSON.stringify(보냄));
  is(보냄.includes('a1=200000') && 보냄.includes('a3=50000'), '★★ 접는 순간 남은 것(a3 「5」)까지 바로 보낸다 — 700ms 를 안 기다림');
  await p.waitForTimeout(2600);
  is(await p.evaluate(() => (document.getElementById('hmPexHost') || {}).innerHTML === ''), '접으면 칸이 비워진다');
  await p.context().close();

  is(!errs.length, '페이지 오류 0 ' + (errs.length ? JSON.stringify(errs.slice(0, 3)) : ''));
  await b.close(); srv.close();
  console.log(bad ? `\n✗ ${bad}곳이 어긋났습니다` : '\n✓ 예상업적을 오늘에서 바로 적습니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
