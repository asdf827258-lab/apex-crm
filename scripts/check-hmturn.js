/* ══════════════════════════════════════════════════════════════════
   check-hmturn.js (판 X153) — 🔁 <b>한 동네를 다 돌면 다음 동네로</b>.

   사장님 말씀 (2026-10-22) — 「지역동선을 매번 가까운 지역 또는 약속이
   없다면 추천해서 만들어줘 <b>가장 많은 지역에 유치한 고객들을 위주로
   터치</b>하고 <b>그 터치가 끝난다면, 다른 지역으로 돌아가면서</b> 할 수
   있도록 해줘」.

   ── 손대기 전 ──────────────────────────────────────────────────────
   약속이 없는 날에는 <b>제일 많은 동네 하나</b>를 권했습니다(판 X142).
   그런데 그 동네를 <b>다 도신 날에도 같은 동네</b>를 계속 권했습니다 —
   오늘 그 동네 일은 끝났는데 화면은 어제와 같았습니다.

   ── 이 자가 걱정하는 것 ────────────────────────────────────────────
   ⓐ <b>안 넘어가는 것.</b> 다 닿은 동네를 계속 권하면 하루가 거기서 멈춥니다.
   ⓑ <b>약속을 덮는 것.</b> 약속이 있는 날은 그 동네가 「가까운 지역」 이고,
      돌아가기가 그것을 밀어내면 안 됩니다.
   ⓒ <b>체크로 넘어가는 것.</b> 앉아서 단추만 눌러도 동네가 넘어가면
      거짓입니다 — <b>기록(last)</b>이 오늘이어야 합니다 (1번).
   ⓓ <b>다 하신 날을 못 한 날처럼 적는 것.</b> 「갈 데가 없습니다」 와
      「다 도셨습니다」 는 <b>다른 말</b>입니다 (1번).
   ⓔ <b>지역을 모르는 분·남의 분을 세는 것</b> (1번·3번).
   ⓕ <b>수가 갈리는 것.</b> 화면의 「N분 남았습니다」 는 hmRtRgRound 가
      말하는 수 그대로여야 합니다 (5번).
   ⓖ <b>세는 자가 둘이 되는 것</b> — 「오늘 닿았나」 는 hmRtDid 한 곳 (5번).
   ⓗ <b>서버를 부르는 것</b> (7번) — 손에 있는 AR.db 만 셉니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8907;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript',
               '.css':'text/css', '.json':'application/json' };
let 바깥 = 0;
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 씨 — 동네 셋(순천 3 · 여수 2 · 광양 1) · 지역 모름 하나 · 남의 것 하나.
   이름은 <b>홍길동</b> 집안입니다 (3번).                                */
const SEED = (o) => `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients',
  'osCliInfoLoad','osRepListLoad','chkLoad'].forEach(function(k){window[k]=function(){};});
 window.toast=function(m){};
 window.setupDone=function(){return true;};window.setupShow=function(){return false;};
 window.osTabAllowed=function(){return true;};window.cmLoadAll=function(cb){if(cb)cb();};
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',user_id:'me',name:'홍길동',role:'owner',user_role:'owner',team:'A',active:true,plan:'pro'};
 window.osClient=function(){var mk=function(){var a={};
   ['select','order','limit','in','is','eq','neq','not','gte','lte','update','insert','upsert','delete','single','range','or','filter']
     .forEach(function(k){a[k]=function(){return a;};});
   a.then=function(f){return Promise.resolve({data:[],error:null}).then(f);};return a;};
   return {from:function(){return mk();},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 CM.loaded=true;CM.who={me:'홍길동'};CM.picked=true;
 AR.loaded=true;AR.cliRows=[];AR.calls=[];AR.rep={};
 AR.db=[
  {id:'s1',who:'me',name:'홍길동가',stage:'AP',days:2,region:'순천시'${o&&o.약속?",appt:(typeof arToday==='function'?arToday():'')+'T14:00'":''}},
  {id:'s2',who:'me',name:'홍길동나',stage:'PC',days:3,region:'순천시'},
  {id:'s3',who:'me',name:'홍길동다',stage:'CS',days:1,region:'순천시'},
  {id:'y1',who:'me',name:'홍길동라',stage:'AP',days:4,region:'여수시'},
  {id:'y2',who:'me',name:'홍길동마',stage:'PC',days:5,region:'여수시'},
  {id:'g1',who:'me',name:'홍길동바',stage:'AP',days:6,region:'광양시'},
  {id:'n1',who:'me',name:'홍길동사',stage:'AP',days:7,region:''},
  {id:'o1',who:'남',name:'홍길동아',stage:'AP',days:8,region:'여수시'}];
 OSC.loaded=true;OSC.list=[];CHKS.busy=false;CHKS.rows=[];CHKS.by={};CHKS.fin={};
 HWHO.id='';go('home');`;

const 본 = async (p) => await p.evaluate(() => {
  const g = (s) => ((document.querySelector(s) || {}).innerText || '').replace(/\s+/g, ' ').trim();
  let w = null, R = [];
  try { w = hmRtWhere(); } catch (e) {}
  try { R = hmRtRgRound(); } catch (e) {}
  return {
    round: R,
    from: w ? w.from : '', now: (w && w.now) ? w.now.rg : '', next: (w && w.next) ? w.next.rg : '',
    rg: w ? Object.keys(w.rg || {}) : [],
    머리: g('#hmFold_rt .hm-fold-h'), turn: g('.hm-rt-turn'),
    none: g('.hm-rt .hm-rt-none'), 카드: g('.hm-rt'),
    /* 화면에 적힌 「N분 남았습니다」 — 글에서 그대로 뽑습니다 */
    적힌남음: (function(){ const t = g('.hm-rt-turn');
      const m = /(\d+)\s*분\s*남았/.exec(t); return m ? +m[1] : null; })()
  };
});
const 닿기 = (p, ids) => p.evaluate((L) => {
  const t = osTodayStr();
  AR.db.forEach(function(r){ if (L.indexOf(r.id) >= 0) r.last = t + 'T09:00:00'; });
  hmPaint();
}, ids).then(() => p.waitForTimeout(420));

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const open = async (o) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**://**', r => {
      if (r.request().url().indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
      바깥++; return r.abort();
    });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
    await p.waitForTimeout(2600);
    await p.evaluate(SEED(o || {})); await p.waitForTimeout(2300);
    return { ctx, p, errs };
  };

  console.log('[1] 🏙 <b>제일 많은 동네부터</b> — 셈이 바른가');
  const A = await open({});
  let o = await 본(A.p);
  const by = {}; (o.round || []).forEach(x => by[x.rg] = x);
  is((o.round || []).length === 3,
     '  동네 <b>셋</b>을 센다 — ' + (o.round || []).map(x => x.rg + ' ' + x.n).join(' · '));
  is(!!by['순천시'] && by['순천시'].n === 3 && !!by['여수시'] && by['여수시'].n === 2,
     '  동네마다 <b>몇 분인지</b> 맞는다 — 순천 3 · 여수 2 · 광양 1');
  is(!(o.round || []).some(x => !x.rg),
     '  ★ <b>지역을 모르는 분은 안 센다</b> (1번) — 어디로 갈지 모르는 수를 안 보탠다');
  is(!!by['여수시'] && by['여수시'].n === 2,
     '  ★ <b>남의 분은 안 센다</b> (3번) — 여수시에 남의 줄이 하나 더 있어도 2분');
  is(o.from === 'top' && o.now === '순천시',
     '  ★★ <b>제일 많은 동네를 권한다</b> — ' + (o.now || '(없음)'));
  is(o.next === '여수시', '  <b>다음은 그 다음 동네</b>다 — ' + (o.next || '(없음)'));
  is(/순천시/.test(o.머리), '  머리글이 그 동네를 적는다 — 「' + o.머리.slice(0, 40) + '」');
  is(/순천시/.test(o.turn) && /여수시/.test(o.turn),
     '  🔁 한 줄이 <b>지금과 다음</b>을 말한다 — 「' + o.turn + '」');
  is(o.적힌남음 === 3,
     '  ★ 화면의 <b>남은 수</b>가 셈과 같다 — 적힌 ' + o.적힌남음 + ' · 센 ' +
     (by['순천시'] ? by['순천시'].left : '?') + ' (5번)');

  console.log('\n[2] 🔁 <b>다 닿으면 다음 동네로</b> (사장님 말씀 그대로)');
  await 닿기(A.p, ['s1', 's2', 's3']);
  o = await 본(A.p);
  is(o.now === '여수시',
     '  ★★ 순천시 셋을 닿으니 <b>여수시</b>로 넘어간다 — ' + (o.now || '(안 넘어감)'));
  is(!!by['순천시'] && (o.round.filter(x => x.rg === '순천시')[0] || {}).left === 0,
     '  순천시는 <b>남은 분 0</b> 이 된다');
  is(o.next === '광양시', '  그 다음은 <b>광양시</b>다 — ' + (o.next || '(없음)'));
  is(/여수시/.test(o.머리) && !/순천시로 권/.test(o.머리),
     '  머리글도 따라간다 — 「' + o.머리.slice(0, 40) + '」');
  await 닿기(A.p, ['s1', 's2', 's3', 'y1', 'y2']);
  o = await 본(A.p);
  is(o.now === '광양시', '  여수시도 닿으니 <b>광양시</b>다 — ' + (o.now || '(안 넘어감)'));
  is(/더 없습니다|광양/.test(o.turn),
     '  마지막 동네에서는 <b>다음이 없다</b>고 적는다 — 「' + o.turn + '」');

  console.log('\n[3] 🎉 <b>다 도신 날</b> — 못 한 날처럼 안 적는다 (1번)');
  await 닿기(A.p, ['s1', 's2', 's3', 'y1', 'y2', 'g1']);
  o = await 본(A.p);
  is(o.from === 'done', '  셈이 <b>다 돌았다</b>고 말한다 — ' + o.from);
  is(/다 도셨습니다/.test(o.none),
     '  ★★ <b>「다 도셨습니다」</b> 라고 적는다 — 「' + o.none + '」');
  is(!/갈 데가 없습니다/.test(o.카드),
     '  ★ <b>「갈 데가 없습니다」 와 다른 말</b>이다 — 다 하신 날을 못 한 날로 안 적는다');
  is(/순천시/.test(o.none) && /여수시/.test(o.none),
     '  <b>어느 동네를 도셨는지</b> 적는다');
  is(A.errs.length === 0, '  터진 곳이 없다' + (A.errs.length ? ' ← ' + A.errs[0] : ''));
  await A.ctx.close();

  console.log('\n[4] ✅ <b>체크가 아니라 기록</b>이다 (1번)');
  const B = await open({});
  await B.p.evaluate(() => {
    /* 「이분 끝」 체크만 눌러 봅니다 — 기록(last)은 안 남깁니다 */
    try { ['db:s1:AP','db:s2:PC','db:s3:CS'].forEach(function(k){ hmQdoneSet(k); }); } catch (e) {}
    hmPaint();
  });
  await B.p.waitForTimeout(420);
  o = await 본(B.p);
  is(o.now === '순천시',
     '  ★★ 체크만으로는 <b>안 넘어간다</b> — ' + (o.now || '(없음)') +
     ' (앉아서 단추만 눌러도 넘어가면 거짓입니다)');
  await B.ctx.close();

  console.log('\n[5] 📅 <b>약속이 먼저</b>다 — 돌아가기가 덮지 않는다');
  const C = await open({ 약속: true });
  o = await 본(C.p);
  is(o.rg.indexOf('순천시') >= 0,
     '  약속이 있는 날은 <b>그 동네</b>가 선다 — [' + o.rg.join(' · ') + ']');
  is(o.from !== 'done', '  약속이 있는 날엔 <b>「다 도셨다」 로 안 빠진다</b>');
  await C.ctx.close();

  console.log('\n[6] 📏 <b>세는 자가 하나</b>인가 (5번) · 서버를 안 부르나 (7번)');
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8')
                .replace(/\/\*[\s\S]*?\*\//g, '');
  is((src.match(/function hmRtDid\(/g) || []).length === 1,
     '  「오늘 닿았나」 를 묻는 자가 <b>하나</b>다 — hmRtDid');
  is((src.match(/function hmRtRgRound\(/g) || []).length === 1,
     '  동네를 세는 자도 <b>하나</b>다 — hmRtRgRound');
  is(/function hmRtRgTop\(n\)\{\s*var R=hmRtRgRound\(\)/.test(src.replace(/\n\s*/g, '')),
     '  ★ 「묶으면 좋을 동네」(hmRtRgTop)도 <b>그 자에게 묻는다</b> — 두 곳에서 안 센다');
  const D = await open({});
  const 바깥전 = 바깥;
  await D.p.evaluate(() => { try { hmRtRgRound(); hmRtWhere(); hmPaint(); } catch (e) {} });
  await D.p.waitForTimeout(400);
  is(바깥 - 바깥전 === 0, '  셈하는 동안 <b>바깥을 안 부른다</b> — ' + (바깥 - 바깥전) + '번 (7번)');
  await D.ctx.close();

  console.log('\n──────────────────────────────');
  await b.close(); srv.close();
  if (bad) { console.log('✗ 지역 돌아가기 — 고칠 자리 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 제일 많은 동네부터 돌고, 다 닿으면 다음 동네로 넘어갑니다.');
})();
