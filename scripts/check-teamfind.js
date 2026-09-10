#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   팀원 관리 — 찾으면 뜬다

   「팀원관리가 어려워」 라는 말의 정체는 이것이었습니다. 스물여섯 명이
   팀별로 접혀 있고, 점수가 낮은 사람이 위로 올라오게 <b>다시 줄이
   서므로</b>, 어제 본 자리에 오늘은 그 사람이 없습니다. 한 사람을 보려면
   눈으로 훑는 수밖에 없었습니다.

   그래서 찾는 칸을 놓습니다. 여기서 못 박는 것은 여섯입니다.

     ① 칸이 팀원 관리 <b>그 자리</b>에 있다
     ② 이름 · 초성 · 팀 이름 · 직책 <b>넷 다</b> 걸린다
     ③ 글자를 칠 때 <b>커서를 안 잃는다</b> — 판을 통째로 다시 그리면
        한 글자마다 칸을 다시 눌러야 합니다. 그러면 아무도 안 씁니다.
     ④ 없으면 <b>없다고 말하고</b>, 무엇으로 찾을 수 있는지 알려 준다
     ⑤ 위 칩 숫자와 아래 목록이 <b>어긋나지 않는다</b> — 어긋나면 사장님이
        어느 쪽을 믿어야 할지 모릅니다
     ⑥ 지우면 <b>전부 돌아온다</b> — 걸러 놓고 잃어버리면 안 됩니다

   견본 이름은 「홍길동」 계열입니다 (3번). 실제 팀원 이름은 안 씁니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8834;
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
               '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const STUB = `
window.supabase={createClient:function(){
 var mk=function(){var a={select:function(){return a},eq:function(){return a},order:function(){return a},
  limit:function(){return a},single:function(){return a},in:function(){return a},gte:function(){return a},
  lte:function(){return a},is:function(){return a},neq:function(){return a},not:function(){return a},
  range:function(){return a},insert:function(){return a},update:function(){return a},upsert:function(){return a},
  then:function(r){return Promise.resolve({data:[],error:null}).then(r)}};a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({})},getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'u1',email:'u1@example.com'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'u1'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;
function serve() {
  return http.createServer((rq, rs) => {
    const f = path.join(ROOT, decodeURIComponent(rq.url.split('?')[0].split('#')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
    rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(rs);
  }).listen(PORT);
}

/* ── 견본 팀 ────────────────────────────────────────────────────
   두 팀 · 여섯 사람. 초성이 겹치지 않게, 그러나 <b>이름 한 글자는
   겹치게</b> 두었습니다 — 「홍」으로 치면 셋이 걸려야 거르개가 진짜로
   도는지 알 수 있습니다.                                            */
const SEED = `(function(){
  var mk=function(id,name,role,team,total,last){
    var r={id:id,name:name,role:role,team:team,total:total,last:last,lastAtt:last,days:3,any:true,
           raw:{att:0,run:0,call:0,cli:0,rep:0,stu:0},sc:{}};
    (typeof GB_AX!=='undefined'?GB_AX:[]).forEach(function(a){r.sc[a.k]=0});
    return r;
  };
  GB.teams=[{id:'t1',name:'순천지점'},{id:'t2',name:'광양지점'}];
  GB.rows=[mk('u1','홍길동','leader','t1',80,'2026-09-09'),
           mk('u2','홍길순','member','t1',40,'2026-09-08'),
           mk('u3','박서준','member','t1',30,''),
           mk('u4','홍판서','member','t2',60,'2026-09-01'),
           mk('u5','임꺽정','member','t2',20,''),
           mk('u6','장길산','manager','t2',50,'2026-09-09')];
  GB.teamOf={};GB.rows.forEach(function(r){GB.teamOf[r.id]=r.team});
  GB.team='';GB.loaded=true;GB.busy=false;
  AR.rep={u1:{at:'2026-09-09T00:00:00Z',act:'x',good:'x',stu:'x',con:'x',next:'x',name:'홍길동'}};
  AR.crm={};AR.cli={};AR.f='all';AR.q='';AR.open='';AR.loaded=true;
})();`;

/* 화면에 실제로 서 있는 줄의 이름만 긁는다 — 글자가 아니라 DOM 을 본다 */
const names = pg => pg.evaluate(() => Array.from(document.querySelectorAll('#arTeamList .ar-nmx'))
  .map(e => e.textContent.replace(/\s*\(나\)\s*$/, '').trim()));

const setup = async (pg) => {
  await pg.evaluate(s => { eval(s); }, SEED);
  await pg.evaluate(() => { AR.cat = 'team'; AR.q = ''; AR.f = 'all'; arPaint(); });
  await pg.waitForSelector('#arTeamList', { timeout: 15000 });
};

/* 칸에 <b>사람처럼</b> 친다 — value 를 대입하면 커서 이야기를 못 잰다 */
/* 로그인마다 저절로 열리는 판들(빠른 가이드 · 대표 브리핑 · 달력 알림)을
   치웁니다. 이 점검이 보려는 것은 그 판들이 아니라 <b>그 밑의 칸</b>입니다.
   한 번 지우고 마는 것으로는 모자랍니다 — 예약된 것이 <b>뒤늦게 또</b>
   열려 칸을 덮습니다. 그래서 지켜보다 뜨는 족족 치우게 둡니다.          */
const SEL = '#osLoginGate,#osGuide,[id$="Ovl"],[id$="Pop"]';
const clearOvl = pg => pg.evaluate(sel => {
  const wipe = () => document.querySelectorAll(sel).forEach(x => x.remove());
  wipe();
  if (!window.__ovlWatch) {
    window.__ovlWatch = new MutationObserver(wipe);
    window.__ovlWatch.observe(document.body, { childList: true, subtree: false });
  }
}, SEL);
const type = async (pg, txt) => {
  await clearOvl(pg);
  await pg.click('#arFind');
  await pg.fill('#arFind', '');
  await pg.type('#arFind', txt, { delay: 20 });
  await pg.waitForTimeout(120);
};

(async () => {
  const srv = serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

  await pg.addInitScript(STUB);
  /* 빠른 가이드는 로그인마다 저절로 열립니다 — 열려 있으면 그 밑의 칸을
     못 누릅니다. 「다시 안 보기」를 미리 켜 둡니다 (앱이 실제로 보는 키). */
  await pg.addInitScript(() => { try { localStorage.setItem('apex_guide_seen_v2', '1'); } catch (e) {} });
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#airep', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof go === 'function' && typeof arPaint === 'function' &&
                                 typeof GB !== 'undefined' && typeof AR !== 'undefined', { timeout: 60000 });
  await clearOvl(pg);
  await pg.evaluate(() => go('airep'));
  await pg.waitForFunction(() => !!document.getElementById('arPane'), { timeout: 30000 });
  await setup(pg);

  /* ─────────────────────────────────────────────────────────── */
  head('[1] 찾는 칸이 <b>팀원 관리 그 자리</b>에 있다');
  const box = await pg.evaluate(() => {
    const e = document.getElementById('arFind');
    if (!e) return null;
    const r = e.getBoundingClientRect(), list = document.getElementById('arTeamList');
    return { ph: e.getAttribute('placeholder') || '', w: Math.round(r.width),
             above: !!(list && r.top < list.getBoundingClientRect().top) };
  });
  is(!!box, '팀원 관리에 <b>찾는 칸</b>이 있다');
  is(!!box && box.w > 100, '칸이 눈에 보인다 — 폭 ' + (box ? box.w : 0) + 'px');
  is(!!box && box.above, '칸이 <b>목록 위에</b> 있다 — 스크롤해서 찾아야 하면 없는 것과 같다');
  is(!!box && /초성/.test(box.ph), '무엇으로 찾을 수 있는지 <b>칸에 적혀 있다</b> — ' + (box ? box.ph : ''));
  is((await names(pg)).length === 6, '치기 전에는 <b>여섯 명 전부</b> 보인다');
  /* 칸이 아예 없으면 아래는 전부 「칸을 못 눌렀다」 로 터집니다. 그 스택은
     읽어도 무엇이 틀렸는지 안 보이므로, 여기서 끊고 이유만 남깁니다. */
  if (!box) {
    console.log('\n  ✗ 찾는 칸이 없어 나머지를 잴 수 없습니다 — arFindHtml() 이 팀원 관리에 붙어 있는지 보십시오');
    await br.close(); srv.close(); process.exit(1);
  }

  /* ─────────────────────────────────────────────────────────── */
  head('[2] 이름 · 초성 · 팀 이름 · 직책 <b>넷 다</b> 걸린다');
  await type(pg, '홍');
  let got = await names(pg);
  is(got.length === 3 && got.indexOf('박서준') < 0,
     '이름 — 「홍」 으로 세 명 (' + got.join(', ') + ')');

  await type(pg, 'ㅂㅅㅈ');
  got = await names(pg);
  is(got.length === 1 && got[0] === '박서준', '초성 — 「ㅂㅅㅈ」 으로 박서준 하나');

  await type(pg, '광양');
  got = await names(pg);
  is(got.length === 3 && got.indexOf('홍판서') >= 0 && got.indexOf('홍길동') < 0,
     '팀 이름 — 「광양」 으로 광양지점 셋 (' + got.join(', ') + ')');

  await type(pg, '지점장');
  got = await names(pg);
  is(got.length === 2 && got.indexOf('홍길동') >= 0 && got.indexOf('장길산') >= 0,
     '직책 — 「지점장」 으로 둘 (' + got.join(', ') + ')');

  /* ─────────────────────────────────────────────────────────────
     ★ 여기가 이 점검의 심장입니다. 판을 통째로 다시 그리면 칸이 새로
       서면서 커서가 날아가, 한 글자를 칠 때마다 칸을 다시 눌러야 합니다.
       화면은 멀쩡해 보이고 거르개도 도는데 <b>쓸 수가 없습니다.</b>      */
  head('[3] 글자를 칠 때 <b>커서를 안 잃는다</b>');
  await clearOvl(pg);
  await pg.click('#arFind');
  await pg.fill('#arFind', '');
  await pg.keyboard.type('홍길', { delay: 40 });
  await pg.waitForTimeout(120);
  const cur = await pg.evaluate(() => {
    const a = document.activeElement;
    return { id: a ? a.id : '', v: a && a.value !== undefined ? a.value : '',
             box: (document.getElementById('arFind') || {}).value || '' };
  });
  is(cur.id === 'arFind', '두 글자를 이어 친 뒤에도 <b>커서가 칸에 남아 있다</b> — 지금 ' +
     (cur.id ? '#' + cur.id : '아무 데도 아님'));
  is(cur.box === '홍길', '친 글자가 <b>둘 다</b> 들어갔다 — 「' + cur.box + '」');
  got = await names(pg);
  is(got.length === 2 && got.indexOf('홍판서') < 0,
     '「홍」 셋에서 「홍길」 둘로 <b>좁혀졌다</b> — ' + got.join(', '));

  /* ─────────────────────────────────────────────────────────── */
  head('[4] 없으면 <b>없다고 말한다</b>');
  await type(pg, '없는사람');
  got = await names(pg);
  const none = await pg.evaluate(() => (document.getElementById('arTeamList') || {}).textContent || '');
  is(got.length === 0, '아무도 안 걸리면 <b>줄을 안 세운다</b> — 조용히 전체를 보여 주지 않는다');
  is(/찾은 팀원이 없습니다/.test(none), '「찾은 팀원이 없습니다」 라고 <b>그 자리에 적는다</b>');
  is(/초성/.test(none) && /직책/.test(none),
     '무엇으로 찾을 수 있는지 <b>다시 알려 준다</b> — 막힌 자리에서 길을 준다');

  /* ─────────────────────────────────────────────────────────── */
  head('[5] 위 칩 숫자와 아래 목록이 <b>어긋나지 않는다</b>');
  /* ★ 여기는 <b>글자를 친 직후</b>를 재야 합니다. 저절로 도는 다시 그리기
     (arPaint 예약)가 사이에 끼면, 칩이 스스로 안 따라오는 판도 그 김에
     맞아 버려 알람이 안 울립니다 — CI 에서 실제로 그렇게 새어 나갔습니다.
     그래서 예약된 다시 그리기를 잠깐 끄고, 친 직후 그대로 잽니다.        */
  await pg.evaluate(() => { window.__arPaint = arPaint; window.arPaint = function () {}; });
  await type(pg, '광양');
  const chip = await pg.evaluate(() => {
    /* 팀원 관리의 칩 칸만 본다 — 화면에 .ar-fc 를 쓰는 판이 여럿이라,
       문서에서 첫 번째를 집으면 엉뚱한 것을 재게 된다 */
    const box = document.getElementById('arFilterRow');
    const c = box ? box.querySelector('.ar-fc') : null;
    const s = c ? c.querySelector('span') : null;
    return { lbl: c ? c.textContent : '', n: s ? parseInt(s.textContent, 10) : -1,
             note: (document.getElementById('arFindN') || {}).textContent || '' };
  });
  got = await names(pg);
  is(chip.n === got.length, '「전체」 칩이 <b>찾은 수</b>를 말한다 — 칩 ' + chip.n + ' · 줄 ' + got.length +
     ' (' + chip.lbl + ')');
  is(/3/.test(chip.note), '몇 명 찾았는지 <b>칸 옆에도</b> 적는다 — 「' + chip.note + '」');

  await pg.evaluate(() => { if (window.__arPaint) window.arPaint = window.__arPaint; });

  head('[5-1] 찾는 중에도 <b>다른 거르개가 같이 듣는다</b>');
  await pg.evaluate(() => arFilterSet('norep'));
  await pg.waitForTimeout(120);
  got = await names(pg);
  is(got.length === 3 && got.indexOf('홍길동') < 0,
     '「광양」 + 「보고 없음」 = 셋 — 보고가 있는 홍길동은 원래 순천지점이라 안 걸린다');
  /* 거르개를 누르면 판이 통째로 다시 섭니다. 그때 <b>친 글자가 그대로인데</b>
     지우는 단추가 사라지면, 되돌릴 길이 안 보입니다.                    */
  const xKeep = await pg.evaluate(() => {
    const b = document.getElementById('arFindX');
    return { q: AR.q, seen: !!(b && !b.hidden && b.getBoundingClientRect().width > 0) };
  });
  is(xKeep.q === '광양' && xKeep.seen,
     '칩을 눌러 판이 다시 서도 <b>지우는 단추가 그대로 있다</b> — 친 글자가 남아 있으니까');
  await pg.evaluate(() => { arFilterSet('all'); });
  await pg.waitForTimeout(80);

  /* ─────────────────────────────────────────────────────────── */
  head('[6] 지우면 <b>전부 돌아온다</b>');
  /* 단추는 늘 자리에 있고 <b>숨었다 나왔다</b> 합니다 — 칸(input)을 다시
     세우면 커서를 잃기 때문입니다. 그래서 「있나」로 재면 숨어 있어도
     통과합니다. <b>보이나</b>로, 그리고 <b>글자를 친 직후</b>에 잽니다 —
     판 전체를 다시 그리는 일이 끼면 그 김에 맞아 버립니다.             */
  const xState = () => pg.evaluate(() => {
    const b = document.getElementById('arFindX');
    return { there: !!b, seen: !!(b && !b.hidden && b.getBoundingClientRect().width > 0),
             rows: document.querySelectorAll('#arTeamList .ar-nmx').length,
             q: AR.q, v: (document.getElementById('arFind') || {}).value };
  });

  /* ① 빈 칸에서 시작한다 — 전체 다시 그리기로 확실히 비운다 */
  await pg.evaluate(() => { arQClear(); });
  await pg.waitForTimeout(150);
  let X = await xState();
  is(X.there && !X.seen, '아무것도 안 쳤을 때는 <b>지우는 단추가 숨어 있다</b>');

  /* ② 치면 그 자리에서 나온다 — 여기서 재야 「따라오나」를 잰다 */
  await type(pg, '광양');
  X = await xState();
  is(X.seen, '글자를 치면 <b>그 자리에서 단추가 나온다</b> — 다음 다시 그리기를 기다리지 않는다');
  is(X.rows === 3, '그 사이 목록은 셋 — ' + X.rows + '명');

  /* ③ 지우개로 비워도 그 자리에서 숨는다 — 사장님이 실제로 쓰시는 길 */
  await pg.click('#arFind');
  await pg.keyboard.press('Control+A');
  await pg.keyboard.press('Backspace');
  await pg.waitForTimeout(150);
  X = await xState();
  is(!X.seen, '지우개로 비우면 <b>그 자리에서 단추가 숨는다</b>');
  is(X.rows === 6, '지우개로 다 지우면 <b>여섯 명이 돌아온다</b> — ' + X.rows + '명');

  /* ④ 단추로 지우는 길도 그대로 된다 */
  await type(pg, '광양');
  await clearOvl(pg);
  await pg.evaluate(() => { const b = document.getElementById('arFindX'); if (b) b.click(); });
  await pg.waitForTimeout(200);
  X = await xState();
  is(X.rows === 6, '단추로 지워도 <b>여섯 명이 전부 돌아왔다</b> — ' + X.rows + '명');
  is(X.q === '' && X.v === '', '칸도 같이 비었다 — 지웠는데 글자가 남으면 다음에 또 걸린다');

  head('[7] 이 판을 그리는 동안 <b>터진 곳이 없다</b>');
  const real = errs.filter(x => !/favicon|net::ERR|Failed to load resource|ERR_FAILED/i.test(x));
  is(real.length === 0, '콘솔 에러 0건' + (real.length ? ' — ' + real.slice(0, 3).join(' / ') : ''));

  await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ 팀원 찾기 — ' + bad + '/' + n + ' 자리가 막혔습니다'
                          : '✓ 팀원 찾기 — ' + n + '자리 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
