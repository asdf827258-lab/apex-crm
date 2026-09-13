#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   한 칸에서 <b>사람까지</b> 찾는가

   서랍 맨 위 찾기가 여태 <b>화면 이름</b>만 봤습니다. 사장님이 제일 자주
   떠올리시는 말은 <b>사람 이름</b>인데 — 「홍길동 어디 있더라」 — 그걸
   치면 「찾은 메뉴가 없습니다」 가 떠서 <b>없는 것처럼</b> 보였습니다.
   실제로는 고객 365일에 그대로 계십니다.

   여기서 못 박는 것은 여섯입니다.

     ① 고객 이름으로 찾히고, 누르면 <b>그 고객 카드가 열린다</b>
     ② 팀원 이름으로 찾히고, 누르면 <b>팀원 관리에 그 이름이 들어간 채</b> 열린다
     ③ <b>초성</b>으로도 찾힌다 — 메뉴와 같은 판정(navHit)을 쓴다 (5번)
     ④ <b>안 읽은 것을 「없다」 라고 하지 않는다</b> (1번) — 아직 목록을
        안 읽었으면 어디를 한 번 열면 되는지 말한다
     ⑤ <b>서버를 새로 부르지 않는다</b> (7번) — 글자를 쳐도 요청이 안 나간다
     ⑥ <b>헛것을 안 잡는다</b> (8번) — 고객 id(무작위 글자)까지 뒤져서
        「3」 한 글자에 엉뚱한 분이 걸리면 안 된다

   견본 이름은 <b>홍길동</b> 계열입니다 (3번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8841;
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
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
const SEL = '#osLoginGate,#osGuide,[id$="Ovl"],[id$="Pop"]';
const clearOvl = pg => pg.evaluate(sel => {
  const wipe = () => document.querySelectorAll(sel).forEach(x => x.remove());
  wipe();
  if (!window.__ovlWatch) {
    window.__ovlWatch = new MutationObserver(wipe);
    window.__ovlWatch.observe(document.body, { childList: true, subtree: false });
  }
}, SEL);

/* 고객 id 는 실제처럼 <b>무작위 글자</b>로 둡니다 — 그래야 ⑥ 이 의미가 있습니다.
   일부러 「3」 을 여럿 넣어 두었습니다. */
const SEED = `(function(){
  OSC.list=[
    {id:'c3a3b3-1111',name_masked:'홍○동'},
    {id:'d3f3e3-2222',name_masked:'김○순'},
    {id:'a1b2c3-3333',name_masked:'박○준'}];
  OSC.view='list';OSC.current=null;
  GB.teams=[{id:'t1',name:'순천지점'},{id:'t2',name:'광양지점'}];
  var mk=function(id,nm,role,team,total,last){
    var r={id:id,name:nm,role:role,team:team,total:total,last:last,lastAtt:last,days:3,any:true,
           raw:{att:0,run:0,call:0,cli:0,rep:0,stu:0},sc:{}};
    (typeof GB_AX!=='undefined'?GB_AX:[]).forEach(function(a){r.sc[a.k]=0});
    return r;};
  GB.rows=[mk('u1','홍길동','leader','t1',80,'2026-09-09'),
           mk('u2','임꺽정','member','t2',20,'')];
  AR.rep={};AR.crm={};AR.cli={};AR.f='all';AR.q='';AR.open='';AR.loaded=true;
  GB.teamOf={u1:'t1',u2:'t2'};GB.team='';GB.loaded=true;GB.busy=false;
  try{ cmLSSet('apex_cli_real_'+cmWho(),{'c3a3b3-1111':'홍길동','d3f3e3-2222':'김길순','a1b2c3-3333':'박길준'}); }catch(e){}
})();`;

const type = async (pg, q) => {
  await clearOvl(pg);
  await pg.evaluate(v => { const el = document.getElementById('navFind'); if (el) el.value = v; navFind(v); }, q);
  await pg.waitForTimeout(120);
};
const rows = pg => pg.evaluate(() => Array.from(document.querySelectorAll('#navBody .nav-group')).map(g => ({
  t: (g.querySelector('.ngl-t') || {}).textContent || '',
  n: +(((g.querySelector('.ngl-n') || {}).textContent) || 0),
  items: Array.from(g.querySelectorAll('.nav-row .tab-btn')).map(b => ({
    txt: b.textContent.replace(/\s+/g, ' ').trim(), on: b.getAttribute('onclick') || '' }))
})));

(async () => {
  const srv = serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1440, height: 950 } });
  /* 서버를 새로 부르는지 <b>실제로 셉니다</b> — 막지 않고 세기만 합니다 */
  let out = 0;
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
    out++; return r.abort();
  });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.addInitScript(STUB);
  await pg.addInitScript(() => { try { localStorage.setItem('apex_guide_seen_v2', '1'); } catch (e) {} });
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof navFind === 'function' && typeof navPeopleFind === 'function' &&
                                 typeof OSC !== 'undefined' && typeof GB !== 'undefined' &&
                                 !!document.getElementById('navBody'), { timeout: 60000 });
  await clearOvl(pg);

  /* ─────────────────────────────────────────────────────────── */
  head('[1] 판정은 <b>한 곳</b>이다 (5번)');
  ['navPeopleFind', 'navPeopleHtml', 'navGoCli', 'navGoTeam', 'navHit'].forEach(f => {
    const c = (SRC.match(new RegExp('function\\s+' + f + '\\s*\\(', 'g')) || []).length;
    is(c === 1, f + '() 가 ' + c + '곳에 있다');
  });
  const body = SRC.slice(SRC.indexOf('function navPeopleFind('), SRC.indexOf('function navPeopleFind(') + 1200);
  is(/navHit\(/.test(body), 'navPeopleFind 는 <b>제 판정을 안 갖고</b> navHit 를 부른다 — 초성·영타가 저절로 따라온다');
  is(/navPplItem\(/.test(body), '견줄 것을 <b>navPplItem 하나</b>로 만든다');

  /* ─────────────────────────────────────────────────────────── */
  head('[2] 찾기 칸이 <b>무엇을 찾는지</b> 적혀 있다');
  const ph = await pg.evaluate(() => (document.getElementById('navFind') || {}).placeholder || '');
  is(/고객/.test(ph) && /팀원/.test(ph) && /화면/.test(ph),
     '칸에 「화면 · 고객 · 팀원」 이 적혀 있다 — 「' + ph + '」');

  /* ─────────────────────────────────────────────────────────── */
  head('[3] 아직 <b>안 읽었을 때</b> — 없다고 하지 않는다 (1번)');
  await type(pg, '홍길동');
  let none = await pg.evaluate(() => (document.querySelector('#navBody .nav-none') || {}).textContent || '');
  is(/아직 안 읽었습니다/.test(none), '<b>「아직 안 읽었습니다」</b> 라고 말한다 — 0 명이라고 적지 않는다');
  is(/고객 365일/.test(none) && /TFA/.test(none), '어디를 <b>한 번 열면 되는지</b> 알려 준다');

  /* ─────────────────────────────────────────────────────────── */
  head('[4] 고객·팀원이 <b>이름으로 찾힌다</b>');
  await pg.evaluate(SEED);
  await type(pg, '홍길동');
  let gs = await rows(pg);
  const cli = gs.filter(g => g.t === '고객')[0], team = gs.filter(g => g.t === '팀원')[0];
  is(!!cli && cli.n === 1 && /홍길동/.test(cli.items[0].txt), '고객 「홍길동」 이 걸린다');
  is(!!cli && /navGoCli\('c3a3b3-1111'\)/.test(cli.items[0].on), '누르면 <b>그 고객 카드</b>로 간다');
  is(!!team && team.n === 1 && /홍길동/.test(team.items[0].txt), '팀원 「홍길동」 도 같이 걸린다');
  is(!!team && /navGoTeam\('u1'\)/.test(team.items[0].on), '팀원은 <b>id 로</b> 넘긴다 — 이름에 따옴표가 있어도 안 깨진다');
  is(!!team && /지점장/.test(team.items[0].txt), '직책·팀이 <b>같이 보인다</b> — 동명이인을 가릴 수 있어야 한다');
  is(gs.length >= 2 && gs[0].t === '고객', '사람이 <b>맨 위에</b> 선다 — 이름을 치셨으면 그게 답이다');

  /* ─────────────────────────────────────────────────────────── */
  head('[5] <b>초성</b>으로도 찾힌다 (5번 — 메뉴와 같은 판정)');
  await type(pg, 'ㅎㄱㄷ');
  gs = await rows(pg);
  is(gs.filter(g => g.t === '고객').length === 1 && gs.filter(g => g.t === '팀원').length === 1,
     '「ㅎㄱㄷ」 로 고객과 팀원이 둘 다 걸린다');

  /* ─────────────────────────────────────────────────────────── */
  head('[6] <b>헛것을 안 잡는다</b> (8번)');
  await type(pg, '3');
  gs = await rows(pg);
  const c3 = gs.filter(g => g.t === '고객')[0];
  is(!c3, '「3」 을 쳐도 고객이 <b>안 걸린다</b> — id 의 무작위 글자를 뒤지지 않는다' +
     (c3 ? ' — ' + c3.n + '명이 걸렸다' : ''));
  await type(pg, '없는사람이름');
  none = await pg.evaluate(() => (document.querySelector('#navBody .nav-none') || {}).textContent || '');
  is(/찾은 것이 없습니다/.test(none) && !/아직 안 읽었습니다/.test(none),
     '읽어 둔 뒤에 못 찾으면 <b>그때는 없다고</b> 말한다');

  /* ─────────────────────────────────────────────────────────── */
  head('[7] 눌러서 <b>실제로 그 자리로 간다</b>');
  await type(pg, '홍길동');
  await clearOvl(pg);
  await pg.evaluate(() => { navGoCli('c3a3b3-1111'); });
  await pg.waitForTimeout(400);
  const atCli = await pg.evaluate(() => ({ view: OSC.view, cur: OSC.current ? OSC.current.id : '' }));
  is(atCli.view === 'detail' && atCli.cur === 'c3a3b3-1111', '고객을 누르면 <b>그 분 카드가 열린다</b>');
  await clearOvl(pg);
  await pg.evaluate(() => { navGoTeam('u1'); });
  await pg.waitForTimeout(500);
  const atTeam = await pg.evaluate(() => ({ cat: AR.cat, q: AR.q }));
  is(atTeam.cat === 'team' && atTeam.q === '홍길동',
     '팀원을 누르면 팀원 관리가 열리고 <b>찾는 칸에 그 이름이 들어가 있다</b> — 「' + atTeam.q + '」');

  /* ─────────────────────────────────────────────────────────── */
  head('[8] 글자를 쳐도 <b>서버를 새로 안 부른다</b> (7번)');
  const before = out;
  await type(pg, '홍');
  await type(pg, '홍길');
  await type(pg, '홍길동');
  await pg.waitForTimeout(300);
  is(out === before, '세 번 치는 동안 바깥으로 나간 요청 ' + (out - before) + '건');

  head('[9] 이 길을 도는 동안 <b>터진 곳이 없다</b>');
  const real = errs.filter(x => !/favicon|net::ERR|Failed to load resource|ERR_FAILED/i.test(x));
  is(real.length === 0, '콘솔 에러 0건' + (real.length ? ' — ' + real.slice(0, 3).join(' / ') : ''));

  await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ 한 칸에서 사람까지 — ' + bad + '/' + n + ' 자리가 막혔습니다'
                          : '✓ 한 칸에서 사람까지 — ' + n + '자리 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
