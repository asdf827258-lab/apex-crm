/* ══════════════════════════════════════════════════════════════════
   check-clichip.js — <b>고객을 갈래로 걸러 볼 수 있나.</b>

   2026-09-26. 사장님 말씀 「목업하고 너무 다른데」. 컴퓨터로 나란히 놓고
   보니 목업의 고객 화면에는 제목 「고객 한 벌로」 와 <b>거르개 칩</b>이
   있는데 앱에는 <b>하나도 없었습니다</b> — 스물이든 이백이든 한 줄로만
   보여서, 「약속 넘긴 분만」 을 보려면 눈으로 훑어야 했습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 칩이 <b>목업 이름 그대로</b> 선다 · 제목도 선다
     [2] ★ <b>「아는 게 적음」 은 안 세운다</b> (1번) — 앱에 그 표가 없다
     [3] 누르면 <b>정말로 걸러진다</b> — 칩에 적힌 수와 목록 수가 같다
     [4] ★ 세는 자가 <b>고객 365일과 같다</b> (5번) — 여기서 다시 안 센다
     [5] 비면 <b>「이 칸에는 아무도 없습니다」</b> · 돌아갈 길을 준다 (1번)
     [6] <b>찾기와 같이</b> 걸린다 — 두 곳에서 따로 거르지 않는다 (5번)
     [7] 조용히 터지지 않았나
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9022;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});

/* 견본 — 이름은 「홍길동」 (3번). 갈래마다 한 사람 이상 들어가게 짭니다. */
const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ if(cb)cb(); };
  window.toast=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  window.osTabAllowed=function(){return true;};
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.busy=false; OSC.err=''; OSC.q=''; OSC.view='list';
  CM.loaded=true; CM.meta={}; CM.pick=null;
  AR.loaded=true; AR.busy=''; AR.cliRows=[]; AR.db=[];
  const t = ccToday();
  const ago = n => new Date(Date.now()-n*864e5).toISOString().slice(0,10);
  /* 일곱 분 — 단계와 기록을 갈래마다 갈라 둡니다 */
  OSC.list = [
    { id:'c0', name:'홍길동', advisor_id:'me', stage:'AP',    created_at:ago(90) },
    { id:'c1', name:'홍길순', advisor_id:'me', stage:'PC',    created_at:ago(90) },
    { id:'c2', name:'홍길상', advisor_id:'me', stage:'TA',    created_at:ago(90) },
    { id:'c3', name:'홍기동', advisor_id:'me', stage:'계약완료', created_at:ago(90) },
    { id:'c4', name:'홍길서', advisor_id:'me', stage:'증권전달', created_at:ago(90) },
    { id:'c5', name:'홍판서', advisor_id:'me', stage:'미접촉', created_at:ago(90) },
    { id:'c6', name:'홍대감', advisor_id:'me', stage:'CS',    created_at:ago(90) }];
  CM.meta['c0']={ touch:[{ at:t,       how:'전화', note:'30일 관리', cc:1 }],
                  next:{ what:'다음 주 방문', due:t } };
  CM.meta['c1']={ touch:[{ at:ago(45), how:'전화', note:'30일 관리', cc:1 }] };
  CM.meta['c2']={ touch:[] };
  try{ osHideLoginGate(); }catch(e){}
  try{ renderNav(); }catch(e){}
  go('clients');
  try{ osRenderList(); }catch(e){}
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED);
  await p.waitForTimeout(1400);

  console.log('\n[1] 칩이 <b>목업 이름 그대로</b> 선다 · 제목도 선다');
  const A = await p.evaluate(() => {
    const row = document.getElementById('cliFChips');
    const cs = row ? [].slice.call(row.querySelectorAll('.t-chip')) : [];
    const pane = document.getElementById('dynPane');
    const t = pane ? pane.innerText : '';
    return { n: cs.length,
             이름: cs.map(x => x.textContent.replace(/\s+/g, ' ').trim()),
             제목: /고객\s*한 벌로/.test(t),
             설명: /한 줄로/.test(t),
             켜짐: cs.filter(x => x.classList.contains('on')).length };
  });
  is(A.제목, '  제목 <b>「고객 한 벌로」</b> 가 선다');
  is(A.설명, '  <b>「한 줄로 세웠습니다」</b> 한 줄 설명도 선다');
  is(A.n >= 7, '  칩이 <b>일곱</b> 선다 — ' + A.n + '개 · ' + A.이름.join(' | '));
  ['오늘', '약속 넘김', '한 번도', '다음 할 일 없음', '진행 중', '계약·증권', '전체']
    .forEach(nm => is(A.이름.some(x => x.indexOf(nm) === 0),
      '  목업의 「' + nm + '」 이 그대로 있다'));
  is(A.켜짐 === 1, '  켜진 칩이 <b>꼭 하나</b>다 — ' + A.켜짐 + '개');

  console.log('\n[2] ★ <b>「아는 게 적음」 은 안 세운다</b> (1번)');
  is(!A.이름.some(x => /아는 게 적음/.test(x)),
     '  목업의 여덟째는 <b>안 세운다</b> — 앱에 그 15칸 표가 없다. 지어내지 않는다');

  console.log('\n[3] 누르면 <b>정말로 걸러진다</b>');
  const B = await p.evaluate(async () => {
    const out = [];
    const chips = () => [].slice.call(document.querySelectorAll('#cliFChips .t-chip'));
    for (const f of ['over', 'never', 'run', 'won', 'today', 'all']) {
      const c = chips().filter(x => x.getAttribute('data-f') === f)[0];
      if (!c) { out.push({ f: f, 없음: true }); continue; }
      const 적힌 = parseInt((c.querySelector('b') || {}).textContent || '-1', 10);
      c.click(); await new Promise(r => setTimeout(r, 400));
      const rows = document.querySelectorAll('#oscList .cm-row, #oscList .osc-row, #oscList [data-cid]');
      out.push({ f: f, 적힌: 적힌, 그려진: rows.length,
                 켜짐: (chips().filter(x => x.getAttribute('data-f') === f)[0] || {})
                        .classList.contains('on') });
    }
    return out;
  });
  B.forEach(x => {
    if (x.없음) { is(false, '  「' + x.f + '」 칩이 없다'); return; }
    is(x.켜짐, '  「' + x.f + '」 를 누르면 <b>그 칩이 켜진다</b>');
    is(x.적힌 === x.그려진,
       '  「' + x.f + '」 — 칩에 적힌 수와 <b>목록 수가 같다</b> — ' +
       x.적힌 + ' / ' + x.그려진);
  });

  console.log('\n[4] ★ 세는 자가 <b>고객 365일과 같다</b> (5번)');
  const C = await p.evaluate(() => {
    const mine = ccScope(OSC.list);
    return { over: ccOverList(mine).length, never: ccNeverList(mine).length,
             칩over: cliFPass(mine, 'over').length, 칩never: cliFPass(mine, 'never').length };
  });
  is(C.over === C.칩over, '  「약속 넘김」 이 <b>ccOverList 와 같다</b> — ' + C.칩over + ' / ' + C.over);
  is(C.never === C.칩never, '  「한 번도」 가 <b>ccNeverList 와 같다</b> — ' + C.칩never + ' / ' + C.never);
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is(/cliFKeys[\s\S]{0,400}ccOverList/.test(SRC) && /cliFKeys[\s\S]{0,400}ccNeverList/.test(SRC),
     '  거르개가 <b>그 자를 그대로 부른다</b> — 규칙을 다시 안 쓴다 (5번)');

  console.log('\n[5] 비면 <b>그 칸이 비었다</b>고 말한다 (1번)');
  const D = await p.evaluate(async () => {
    /* 아무도 없는 갈래를 만듭니다 — 계약·증권은 견본에 둘 있으니 지웁니다 */
    const 담 = OSC.list.slice();
    OSC.list = OSC.list.filter(c => ['계약완료','증권전달','소개완료'].indexOf(c.stage) < 0);
    cliFSet('won'); await new Promise(r => setTimeout(r, 400));
    const t = (document.getElementById('oscList') || {}).innerText || '';
    OSC.list = 담; cliFSet('all'); await new Promise(r => setTimeout(r, 300));
    return { t: t, 돌아옴: (document.querySelectorAll('#oscList .cm-row, #oscList [data-cid]')).length };
  });
  is(/이 칸에는 아무도 없습니다/.test(D.t),
     '  <b>「이 칸에는 아무도 없습니다」</b> 라고 한다 — 「고객이 없다」 고 안 한다');
  /* ★ 「전체」 라는 <b>글자만</b> 보면 다른 문구에도 걸려 <b>안 우는 알람</b>이
     됩니다 (8번). 돌아가라고 <b>말하는 문장</b>을 봅니다. */
  is(/전체[^<]{0,4}를?\s*누르면/.test(D.t),
     '  ★ <b>돌아갈 길</b>을 적는다 — 「전체 를 누르면 다 돌아옵니다」');
  is(D.돌아옴 > 0, '  「전체」 를 누르면 <b>다 돌아온다</b> — ' + D.돌아옴 + '명');

  console.log('\n[6] <b>찾기와 같이</b> 걸린다 (5번)');
  const E = await p.evaluate(async () => {
    const n = () => document.querySelectorAll('#oscList .cm-row, #oscList [data-cid]').length;
    cliFSet('run'); await new Promise(r => setTimeout(r, 300));
    const 칩만 = n();
    /* ★ <b>아무도 안 맞는 글자</b>로 찾습니다. 「홍길동」 처럼 맞을 수도
       있는 글자로 재면 수가 안 줄어도 통과해 <b>안 우는 알람</b>이 됩니다 (8번). */
    OSC.q = 'ㅋㅋ없는이름ㅋㅋ'; osRenderList(); await new Promise(r => setTimeout(r, 300));
    const 찾기까지 = n();
    OSC.q = ''; osRenderList(); await new Promise(r => setTimeout(r, 300));
    const 되돌림 = n();
    cliFSet('all'); await new Promise(r => setTimeout(r, 300));
    return { 칩만: 칩만, 찾기까지: 찾기까지, 되돌림: 되돌림 };
  });
  is(E.칩만 > 0 && E.찾기까지 === 0,
     '  칩 위에 찾기를 더하면 <b>같은 자리에서 또 걸린다</b> — 칩만 ' + E.칩만 +
     ' → 없는 이름으로 찾으면 ' + E.찾기까지);
  is(E.되돌림 === E.칩만,
     '  찾기를 지우면 <b>칩만 걸린 상태로 돌아온다</b> — ' + E.되돌림 + ' / ' + E.칩만);

  console.log('\n[7] 조용히 터지지 않았나');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0, 2).join(' | ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 고객을 갈래로 걸러 볼 수 있고, 세는 자는 고객 365일과 한 벌입니다.');
  process.exit(bad ? 1 : 0);
})();
