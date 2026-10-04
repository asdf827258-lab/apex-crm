/* ══════════════════════════════════════════════════════════════════
   🙋 <b>「나」 의 숫자 두 칸</b> — 오늘 한 일 · 밀착관리 (mnu*)

   2026-09-26 · 목업(docs/토스판_사본.html)의 「나」 에는 숫자 두 칸이
   있습니다. 앱의 「나」 는 <b>알람 카드 하나</b>가 화면을 다 먹고 있었습니다.

   여기서 재는 것은 <b>숫자가 뜨나</b>가 아닙니다. 그건 쉽습니다.
   재는 것은 —
     ① <b>없는 값을 지어내지 않나</b> — 고객을 못 읽었으면 0 이 아니라
        「못 읽었습니다」 라고 하나 (1번 · 모름과 0 을 구분한다)
     ② <b>두 곳이 같은 숫자를 말하나</b> — 고객 365일이 세는 그 값을
        그대로 쓰나, 여기서 다시 세지 않나 (5번)
     ③ <b>기록에 있는 갈래 이름</b>을 쓰나 — 목업이 「단계 옮김」 이라고
        적었다고 만남을 그렇게 부르면 그것이 거짓말이다 (1번)
     ④ 고객 이름이 안 나오나 (3번) · 서버를 안 부르나 (7번)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8979;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript',
               '.css':'text/css', '.json':'application/json', '.webmanifest':'application/manifest+json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type':'application/json' }); rs.end('{"key":null,"has":false}'); return; }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const BASE = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user:{ id:'me' } };
  OS.profile = { id:'me', name:'윤시현', role:'owner', active:true, plan:'vip', team_id:'t1' };
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ if(cb)cb(); };
  window.toast=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  OSC.loaded=true; OSC.busy=false; OSC.err=''; OSC.list=[];
  CM.loaded=true; CM.meta={};
  AR.loaded=true; AR.busy=''; AR.cliRows=[]; AR.db=[];
  go('home');
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{ width:430, height:932 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('' + (e && e.message)));

  await p.goto('http://127.0.0.1:'+PORT+'/app/index.html', { waitUntil:'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(BASE);
  await p.waitForTimeout(1200);

  console.log('\n[1] <b>고객을 못 읽었으면 0 이라고 안 한다</b> (1번 — 모름 ≠ 0)');
  const E = await p.evaluate(() => {
    OSC.list = [];
    return { 오늘: mnuTodayHtml(), 관리: mnuCareHtml() };
  });
  const plain = s => (s || '').replace(/<[^>]*>/g, '');
  is(/아직 못 읽었습니다/.test(plain(E.오늘)),
     '  「오늘 한 일」 — <b>못 읽었다</b>고 말한다');
  is(!/>0</.test(E.오늘) || /못 읽었습니다/.test(plain(E.오늘)),
     '  그 자리에 <b>0 을 안 세운다</b> — 0 은 「하나도 안 했다」 는 뜻이 된다');
  is(/고객이 아직 없습니다/.test(plain(E.관리)),
     '  「밀착관리」 — <b>잴 것이 없다</b>고 말한다');

  console.log('\n[2] 고객이 있으면 <b>진짜 숫자</b>가 뜬다');
  const N = await p.evaluate(() => {
    const t = ccToday();
    OSC.list = [
      { id:'c1', name:'홍길동', advisor_id:'me' },
      { id:'c2', name:'홍길순', advisor_id:'me' },
      { id:'c3', name:'홍길상', advisor_id:'me' }];
    /* 오늘 기록 — 전화 하나 · 만남 하나. <b>기록 한 곳</b>에 넣는다 */
    CM.meta = CM.meta || {};
    CM.meta['c1'] = { touch:[{ at:t, how:'전화', note:'30일 관리', cc:1 }] };
    CM.meta['c2'] = { touch:[{ at:t, how:'만남', note:'30일 관리', cc:1 }] };
    CM.meta['c3'] = { touch:[] };
    const mine = ccScope(OSC.list);
    return { 오늘: mnuTodayHtml(), 관리: mnuCareHtml(),
             재는자: { rate: ccRate(mine), over: ccOverList(mine).length, never: ccNeverList(mine).length } };
  });
  const po = plain(N.오늘), pc = plain(N.관리);
  is(/☎️ 전화/.test(po) && /🤝 만남/.test(po),
     '  갈래를 <b>기록에 적힌 이름 그대로</b> 적는다 — 전화 · 문자 · 만남');
  is(!/단계 옮김|메모/.test(po),
     '  <b>없는 갈래를 지어내지 않는다</b> (1번) — 기록에 없는 이름은 안 쓴다');
  is(/\b1\b/.test(po) && !/아직 못 읽었습니다/.test(po),
     '  오늘 남긴 기록이 <b>수로</b> 뜬다');

  console.log('\n[3] ★ <b>고객 365일과 같은 숫자</b>를 말한다 (5번)');
  is(pc.indexOf(N.재는자.rate + '%') >= 0,
     '  주기 안 비율이 <b>ccRate 그 값</b>이다 — ' + N.재는자.rate + '%');
  is(/30일 주기 안/.test(pc) && /주기 넘김/.test(pc) && /한 번도 연락 안 함/.test(pc),
     '  <b>세 칸</b>이 다 선다 — 주기 안 · 넘김 · 한 번도');
  const src = fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8');
  const blk = src.slice(src.indexOf('function mnuCare'), src.indexOf('function mnuCss'));
  is(/ccRate/.test(blk) && /ccOverList/.test(blk) && /ccNeverList/.test(blk),
     '  <b>고객 365일의 자를 그대로 부른다</b> — 여기서 다시 안 센다');
  is(!/for\s*\(/.test(blk.replace(/\/\*[\s\S]*?\*\//g, '')),
     '  <b>제 손으로 세는 되돌이가 없다</b> — 있으면 두 벌이 된다 (5번)');

  console.log('\n[4] 이름은 안 나오고 (3번) · 서버는 안 부른다 (7번)');
  is(!/홍길동|홍길순|홍길상/.test(po + pc), '  <b>고객 이름이 안 나온다</b> — 숫자만 적는다');
  const two = src.slice(src.indexOf('function mnuToday'), src.indexOf('function renderMe'));
  is(!/fetch\s*\(|osClient\s*\(|\.from\s*\(/.test(two),
     '  <b>서버를 부르는 줄이 없다</b> — 이미 손에 있는 것만 읽는다');

  console.log('\n[5] 「나」 화면에 <b>실제로 선다</b>');
  await p.evaluate(() => go('me'));
  await p.waitForTimeout(1200);
  const V = await p.evaluate(() => {
    const el = document.getElementById('dynPane'), t = el ? el.innerText : '';
    return { 오늘: /오늘 한 일/.test(t), 관리: /밀착관리/.test(t),
             알람: /알람 — 하루/.test(t),
             칸: el ? el.querySelectorAll('.mnu-t').length : 0 };
  });
  is(V.오늘, '  <b>오늘 한 일</b> 칸이 선다');
  is(V.관리, '  <b>밀착관리</b> 칸이 선다');
  is(V.알람, '  <b>알람 카드</b>도 그대로 있다 — 밀어내지 않았다 (1번)');
  is(V.칸 >= 6, '  숫자 칸이 <b>여섯</b> 이상 — ' + V.칸 + '개');

  console.log('\n[6] 조용히 터지지 않았나');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' · ' + errs[0]) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 「나」 에 오늘 한 일과 밀착관리가 섭니다. 모르는 것은 모른다고 적습니다.');
  process.exit(bad ? 1 : 0);
})();
