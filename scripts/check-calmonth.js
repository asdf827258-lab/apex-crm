/* ══════════════════════════════════════════════════════════════════
   check-calmonth.js — <b>한 달치가 달력에 보이는가.</b>

   사장님 말씀 (2026-09-23) —
     「캘린더에 <b>한달치 입력 안되어있어</b>」
     「다른 사람들은 월간 캘린더에 한 달 해야 될 일이 <b>모두 입력</b>되어 있니?」
     「아이폰이든 Galaxy든 <b>바탕화면에 네이버 캘린더처럼</b> 쓸 수 있게 됐니?」

   재 보니 <b>값은 서른 날 다 들어 있었습니다.</b> 안 보였을 뿐입니다 —
   칸에 파란 점 하나만 찍히고, mcalCnt 가 매일 하는 일을 <b>숫자에서 빼고</b>
   있었습니다. 그래서 약속이 있는 날만 「1」 이 뜨고 나머지는 점 하나였습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 달력 칸에 <b>글자로</b> 보인다 — 지난 날 0/11 · 앞날 11 · 다 하면 ✓11
     [2] <b>팀원을 고르면 그 팀원 것</b>이 뜬다 · 서버를 더 안 부른다 (7번)
     [3] <b>안 읽은 날은 0 이 아니다</b> (1번) — 30일 앞은 「·11」
     [4] <b>남의 날에 내 체크가 안 보인다</b> (1번·3번) · 못 누른다
     [5] 📆 <b>이번 달 통째로</b> 폰 달력에 — 매일 하는 일은 안 담는다
     [6] <b>이모지가 있어도 안 터진다</b> — icsFold 가 반쪽에서 죽던 자리
     [7] 위젯을 <b>만들어 준다고 말하지 않는다</b> (1번) · 바로가기에 달력
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8964;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' });
    rs.end(JSON.stringify({ key: null, why: '없음', from: 'env', has: false })); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본은 <b>홍길동</b> 집안입니다 (3번). */
const SEED = () => `
 window.__T='';window.__CALLS=0;
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'master',active:true,plan:'vip',team_id:'t1'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.toast=function(m){window.__T=m;};
 window.osLoadClients=function(){};window.confirm=function(){return true;};
 GB.loaded=true;GB.teams=[{id:'t1',name:'1팀'}];GB.teamOf={me:'t1',u2:'t1'};
 GB.rows=[{id:'me',name:'홍길동'},{id:'u2',name:'홍길순'}];
 var _e={};window.arRowOf=function(i){var m={me:'홍길동',u2:'홍길순'};
   return m[i]?{id:i,name:m[i],sc:_e,raw:_e}:null;};
 AR.rep={};AR.loaded=true;AR.busy='';AR.err='';
 AR.db=[{id:'d1',who:'me',name:'홍길동A',region:'순천',src:'일반',stage:'AP',days:3,n:2,
         res:'상담',appt:mcalShift(mcalToday(),2)+' 14:00',cAt:'',pAt:''}];
 AR.cliRows=[];AR.calls=[];CM.loaded=true;CM.who={me:'홍길동',u2:'홍길순'};
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 window.cmLoadAll=function(cb){if(cb)cb();};
 window.setupShow=function(){return false;};window.setupCanRun=function(){return true;};
 /* 서버를 <b>몇 번 부르는지</b> 센다 (7번) */
 window.osClient=function(){window.__CALLS++;return null;};
 /* 오늘·어제 내 기록을 이 브라우저에 둔다 */
 try{
  var all={},i,L=CK_ITEMS.day;
  for(i=0;i<L.length;i++)all[L[i][0]]=1;
  localStorage.setItem('apex_ck_day_'+mcalToday(),JSON.stringify({d2:1,d3:1,d4:1}));
  localStorage.setItem('apex_ck_day_'+mcalShift(mcalToday(),-1),JSON.stringify(all));
 }catch(e){}
 HWHO.id='';CM.pick='';CM.picked=true;go('mycal');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
  await p.waitForTimeout(2600);
  await p.evaluate(SEED()); await p.waitForTimeout(1800);
  is(errs.length === 0, '  달력을 여는 동안 콘솔 오류가 없다' + (errs.length ? ' — ' + errs[0] : ''));

  console.log('\n[1] 달력 칸에 <b>글자로</b> 보인다 — 점 하나로는 「없다」 로 읽힌다');
  const A = await p.evaluate(() => {
    const T = mcalToday(), ym = mcalYm();
    const it = mcalItems();
    const rt = d => mcalRtOf(mcalDay(it, d));
    const grid = document.querySelector('.mcal-grid');
    const cells = grid ? [...grid.querySelectorAll('.mcal-d:not(.off)')] : [];
    const txt = cells.map(e => (e.innerText || '').replace(/\s+/g, ' ').trim());
    const small = cells.filter(e => {
      const r = e.querySelector('.rt'); if (!r) return false;
      return parseFloat(getComputedStyle(r).fontSize) < 13;
    }).length;
    const days = new Date(Date.UTC(+ym.slice(0,4), +ym.slice(5,7), 0)).getUTCDate();
    return { days, cells: cells.length,
      withRt: txt.filter(t => /\d+\s*\/\s*\d+|✓\d+|·\d+|^\d+\s+\d+$/.test(t)).length,
      today: mcalRtTxt(rt(T)), y1: mcalRtTxt(rt(mcalShift(T, -1))),
      soon: mcalRtTxt(rt(mcalShift(T, 3))), small,
      tot: (rt(T) || {}).tot || 0, sample: txt.slice(0, 3) };
  });
  is(A.cells === A.days, '  이 달 <b>' + A.days + '칸</b>이 다 선다 — ' + A.cells + '칸');
  is(/^\d+\/\d+$/.test(A.today), '  오늘은 <b>한 / 모두</b> 로 적는다 — ' + A.today);
  is(A.y1 === '✓' + A.tot, '  다 한 날은 <b>✓' + A.tot + '</b> — ' + A.y1);
  /* ⚠ 앞날을 「0/11」 로 적으면 <b>「못 했다」</b> 로 읽힌다 (1번) */
  is(A.soon === '' + A.tot && A.soon.indexOf('/') < 0,
     '  앞날은 <b>가짓수만</b> — 「0/' + A.tot + '」 로 적지 않는다 (1번) — ' + A.soon);
  is(A.withRt >= A.days - 1,
     '  <b>' + A.withRt + '칸</b>에 글자가 찍힌다 — 점 하나로는 「비어 있다」 로 보인다');
  is(A.small === 0, '  글자가 <b>13px 아래로 안 내려간다</b> — 폰에서 안 읽힌다');

  console.log('\n[2][3] <b>팀원을 고르면 그 팀원 것</b> · 안 읽은 날은 0 이 아니다');
  const before = await p.evaluate(() => window.__CALLS);
  const B = await p.evaluate(() => {
    const T = mcalToday();
    GB.ckFrom = mcalShift(T, -29);
    GB.ckDay = { u2: {} };
    GB.ckDay.u2[T] = 4;
    GB.ckDay.u2[mcalShift(T, -1)] = 11;
    /* ⚠ <b>원래 것을 들고 있다 돌려놓습니다.</b> delete 로는 안 돌아옵니다 —
       function 선언으로 만든 전역은 지워지지 않아, 아래 [4][5] 가 계속
       팀원을 고른 판으로 돌았습니다. CLAUDE.md 5번이 경고하는 그 자리입니다. */
    window.__pick0 = hwhoPick;
    window.hwhoPick = function () { return 'u2'; };
    const it = mcalItems();
    const rt = d => mcalRtOf(mcalDay(it, d));
    const old = mcalShift(T, -40);
    return { today: mcalRtTxt(rt(T)), y1: mcalRtTxt(rt(mcalShift(T, -1))),
             unread: mcalRtN('u2', old), unreadTxt: mcalRtTxt({ rt: old, n: null, tot: 11 }),
             mineN: mcalRtN('me', T), who: mcalRtWho(), isMe: mcalRtIsMe('u2') };
  });
  const after = await p.evaluate(() => window.__CALLS);
  is(B.who === 'u2' && !B.isMe, '  <b>고른 사람</b>을 그린다 — ' + B.who);
  is(B.today === '4/11', '  그 팀원의 <b>오늘</b> — ' + B.today);
  is(B.y1 === '✓11', '  그 팀원의 <b>어제</b> — ' + B.y1);
  is(after === before, '  <b>서버를 더 안 부른다</b> (7번) — 이미 읽어 둔 것을 쓴다 (' + before + '→' + after + ')');
  /* ⚠ 30일 앞은 <b>안 읽은 날</b>이다. 0 으로 적으면 「안 했다」 가 된다 (1번) */
  is(B.unread === null, '  <b>안 읽은 날은 「모른다」</b> — 0 으로 채우지 않는다 (1번)');
  is(B.unreadTxt.indexOf('0') !== 0 && /^·/.test(B.unreadTxt),
     '  그 날은 <b>「' + B.unreadTxt + '」</b> 로 적는다 — 「0/11」 이 아니다');

  console.log('\n[4] <b>남의 날에 내 체크가 안 보인다</b> (1번·3번)');
  const C = await p.evaluate(() => {
    const t = mrtPanelHtml(mcalToday());
    return { html: t, txt: t.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '),
             boxes: (t.match(/class="mrt-it/g) || []).length,
             toggle: /mrtToggle\(/.test(t) };
  });
  is(C.boxes === 0 && !C.toggle,
     '  체크 칸이 <b>안 뜨고 못 누른다</b> — 눌러도 내 기록이 바뀌면 안 된다');
  is(/홍길순/.test(C.txt), '  <b>누구 것인지</b> 적는다 — ' + C.txt.slice(0, 60).trim());
  is(/못 봅니다|그분 화면/.test(C.txt), '  <b>어느 것을 했는지는 모른다</b>고 적는다 (1번)');
  /* 내 것으로 돌아오면 체크가 다시 뜬다 — 전부 막은 것이 아니다 (8번) */
  /* ⚠ 이 칸은 <b>접힌 채로</b> 섭니다 — 안 펴고 재면 체크 칸이 0 개라
     「막혔다」 로 잘못 읽습니다. 펴고 잽니다 (8번). */
  const D = await p.evaluate(() => { window.hwhoPick = window.__pick0;
    const ds = mcalToday();
    if (!mrtOpenIs(ds)) MRT.open = ds;
    const t = mrtPanelHtml(ds);
    return { boxes: (t.match(/class="mrt-it/g) || []).length, toggle: /mrtToggle\(/.test(t),
             who: mcalRtWho(), open: mrtOpenIs(ds) }; });
  is(D.open && D.boxes > 0 && D.toggle,
     '  <b>내 날에는 그대로 체크된다</b> — 전부 막은 것이 아니다 (' + D.who + ' · 칸 ' + D.boxes + '개)');

  console.log('\n[5][6] 📆 <b>이번 달 통째로</b> 폰 달력에 · 이모지에서 안 터진다');
  const E = await p.evaluate(() => {
    let err = '';
    let evs = [], txt = '';
    try { evs = mcalMonthEvents(); txt = icsBuild('APEX 이번 달', evs); }
    catch (e) { err = String(e); }
    /* ⚠ <b>이모지 한 자</b>로 내보내기가 통째로 죽던 자리 (💬 = 서러게이트 쌍) */
    let emo = '';
    try { icsFold('SUMMARY:💬 카톡·문자 · 📌 약속 · 🎂 생일'); } catch (e) { emo = String(e); }
    return { n: evs.length, err, emo,
             rt: evs.filter(e => /매일 하는 일/.test(e.title)).length,
             ve: (txt.match(/BEGIN:VEVENT/g) || []).length,
             end: /END:VCALENDAR/.test(txt),
             kinds: [...new Set(evs.map(e => e.title.replace(/\s*\d+건$/, '')))].slice(0, 6) };
  });
  is(!E.err, '  이번 달을 <b>만들어 낸다</b>' + (E.err ? (' ← ' + E.err.slice(0, 70)) : ''));
  is(E.n > 0 && E.ve === E.n && E.end,
     '  일정 <b>' + E.n + '건</b>이 그대로 담긴다 — ' + E.kinds.join(' / '));
  /* 매일 하는 일은 <b>안 담는다</b> — 서른 줄이 날마다 찍히면 폰 달력이 글자밭이 된다 */
  is(E.rt === 0, '  <b>매일 하는 일은 안 담는다</b> — 폰에 있어 봐야 못 누른다');
  is(!E.emo, '  <b>이모지가 있어도 안 터진다</b>' + (E.emo ? (' ← ' + E.emo.slice(0, 60)) : '') +
     ' — 반쪽에서 죽으면 단추를 눌러도 아무 일이 안 일어난다');

  console.log('\n[7] 위젯을 <b>만들어 준다고 말하지 않는다</b> (1번) · 바로가기에 달력');
  /* ⚠ 이 안내는 <b>접힌 채로</b> 섭니다(날마다 보는 자리가 밀리지 않게).
     접힌 글은 innerText 에 안 잡히므로 <b>펴서</b> 잽니다 — 사장님이 실제로
     열어 읽을 수 있는지를 재는 것이 맞습니다 (8번). */
  const F = await p.evaluate(() => {
    const el = document.getElementById('dynPane') || document.body;
    const ds = [...el.querySelectorAll('details')];
    ds.forEach(d => { d.open = true; });
    const t = (el.innerText || '').replace(/\s+/g, ' ');
    return { t, folds: ds.length };
  });
  is(F.folds > 0, '  <b>접어 두었다</b> — 한 번 읽고 마는 글이 날마다 보는 달력을 밀어내면 안 된다 (' + F.folds + '칸)');
  is(/위젯을 직접 만들 수는 없습니다|위젯은 못/.test(F.t),
     '  펴면 <b>못 만든다고</b> 적혀 있다 — 「만들어 드립니다」 라고 적으면 폰에서 찾으시다 못 찾는다');
  is(/달력 위젯/.test(F.t) && /통째로 넣기/.test(F.t),
     '  대신 <b>폰이 가진 달력 위젯</b>으로 가는 길을 적는다');
  const mf = JSON.parse(fs.readFileSync('app/manifest.webmanifest', 'utf8'));
  const sc = (mf.shortcuts || []).map(x => x.url);
  is(sc.some(u => /go=mycal/.test(u)),
     '  홈 아이콘 바로가기에 <b>달력</b>이 있다 — ' + sc.join(' · '));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 한 달치가 달력에 보이고, 폰 달력으로 통째로 나갑니다.');
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
