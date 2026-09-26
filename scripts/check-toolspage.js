/* ══════════════════════════════════════════════════════════════════
   🧰 <b>도구</b> — 목업의 밝은 화면인가 (tlp*)

   2026-09-26 · 목업(docs/토스판_사본.html vTools)의 「도구」 는 <b>화면</b>
   입니다 — 무엇을 할지 묻고, 찾기 칸이 있고, <b>지금 그 분 단계에 맞는
   것</b>을 먼저 내밀고, 나머지를 <b>언제 쓰는지</b>로 묶습니다. 그런데 앱의
   「도구」 는 화면이 아니라 <b>검은 서랍</b>을 여는 단추였습니다.

   ★ 여기서 재는 것은 <b>세 가지</b>입니다 —
     ① 목업이 말한 그 화면이 실제로 서는가
     ② <b>아무것도 안 없어졌는가</b> — 서랍으로 가는 길이 남아 있는가 (1번)
     ③ <b>표를 두 벌로 만들지 않았는가</b> — NAV_WHEN_G 를 그대로 쓰는가 (5번)
   ★ 고객 이름은 <b>가려서</b> 나오는가 (3번)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8977;
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

/* 견본은 <b>홍길동</b> 집안 (3번) — AP 한 분을 맨 앞에 세운다 */
const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user:{ id:'me' } };
  OS.profile = { id:'me', name:'윤시현', role:'owner', active:true, plan:'vip', team_id:'t1' };
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ if(cb)cb(); };
  window.toast=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  OSC.loaded=true; OSC.busy=false; OSC.err=''; OSC.list=[]; CM.loaded=true; CM.meta={};
  AR.loaded=true; AR.busy=''; AR.cliRows=[];
  AR.db=[{ id:'d1', who:'me', name:'홍길동', region:'순천', src:'일반',
           stage:'AP', days:3, n:2, res:'상담', cAt:'', pAt:'' }];
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
  await p.evaluate(SEED);
  await p.waitForTimeout(1400);

  console.log('\n[1] 아래 띠의 <b>🧰 도구</b>가 화면을 연다 — 서랍이 아니다');
  const T = await p.evaluate(() => {
    const t = TB.filter(x => x.t === '도구')[0] || {};
    return { id: t.id, more: t.id === '__more' };
  });
  is(!T.more && T.id === 'tools', '  띠의 도구 칸이 <b>화면</b>을 가리킨다 — ' + (T.id || '없음'));

  await p.evaluate(() => go('tools'));
  await p.waitForTimeout(1200);

  console.log('\n[2] 목업이 말한 <b>그 화면</b>이 선다');
  const S = await p.evaluate(() => {
    const el = document.getElementById('dynPane'), t = el ? el.innerText : '';
    const q = document.getElementById('tlpQ');
    return { t: t,
      물음: /무엇을\s*하실 건가요/.test(t),
      묶음말: /언제 쓰는지/.test(t),
      찾기칸: !!q,
      옷: !!(el && el.classList.contains('t-skin')),
      묶음수: (el ? el.querySelectorAll('.tlp-c').length : 0),
      줄수: (el ? el.querySelectorAll('.tlp-row').length : 0),
      지금: /지금 .*님께/.test(t),
      칩: (el ? el.querySelectorAll('.tlp-chip').length : 0) };
  });
  is(S.물음,   '  <b>「무엇을 하실 건가요?」</b> 라고 묻는다');
  is(S.묶음말, '  <b>「언제 쓰는지로 묶었습니다」</b> 라고 적는다');
  is(S.찾기칸, '  <b>찾기 칸</b>이 있다');
  is(S.옷,     '  <b>목업 옷</b>을 입는다 (#dynPane 에 t-skin)');
  is(S.줄수 >= 20, '  화면이 <b>여럿 선다</b> — ' + S.줄수 + '줄 · 묶음 ' + S.묶음수 + '칸');
  is(S.지금 && S.칩 > 0, '  <b>「지금 ○○님께」</b> 가 그 단계 도구를 먼저 내민다 — 칩 ' + S.칩 + '개');
  is(!/홍길동/.test(S.t), '  <b>고객 이름을 가린다</b> (3번) — 날이름이 안 보인다');
  /* ★ <b>왼쪽 여백</b> — 2026-09-26 에 이 화면만 0px 이라 제목이 화면
     가장자리에 붙어 있었습니다. 몰아 보다 눈으로 잡았고, 그때까지 아무
     점검도 이것을 안 봤습니다.
     ★ 16 이라는 수를 <b>여기 안 적습니다</b> — 목업 여백이 바뀌면 그 수가
       거짓말이 됩니다. 대신 <b>다른 화면과 견줍니다.</b> 같이 움직이면
       초록, 이 화면만 어긋나면 빨간불입니다.                          */
  const G = await p.evaluate(async () => {
    const big = () => {
      const el = document.getElementById('dynPane');
      const x = [].slice.call(el.querySelectorAll('*'))
        .filter(e => e.offsetParent && e.innerText && e.innerText.trim().length > 2 &&
                     parseFloat(getComputedStyle(e).fontSize) >= 20)[0];
      return x ? Math.round(x.getBoundingClientRect().left) : null;
    };
    const r = { tools: big(), 남: {} };
    /* 화면마다 큰 글씨가 <b>늘 있는 것은 아닙니다</b> — 못 잰 화면은
       건너뜁니다. 억지로 세면 헛것을 잡습니다 (8번).                  */
    for (const t of ['me', 'mycal', 'news_live', 'clients']) {
      go(t); await new Promise(x => setTimeout(x, 800));
      const v = big(); if (v !== null) r.남[t] = v;
    }
    go('tools'); await new Promise(x => setTimeout(x, 900));
    return r;
  });
  const 남키 = Object.keys(G.남), 어긋 = 남키.filter(k => G.남[k] !== G.tools);
  is(G.tools !== null && 남키.length > 0 && 어긋.length === 0,
     '  ★ 제목이 <b>다른 화면과 같은 자리</b>에서 시작한다 (여백을 따로 안 만들었다) — ' +
     '도구 ' + G.tools + 'px · ' + (남키.map(k => k + ' ' + G.남[k] + 'px').join(' · ') || '(잰 화면 없음)') +
     (남키.length === 0 ? ' ← 견줄 화면을 하나도 못 쟀습니다'
      : (어긋.length ? ' ← 이 화면만 어긋납니다' : '')));

  console.log('\n[3] <b>아무것도 안 없어졌다</b> — 서랍으로 가는 길이 남아 있다 (1번)');
  const M = await p.evaluate(() => {
    const el = document.getElementById('dynPane');
    const b = [...el.querySelectorAll('button')].filter(x => /메뉴 전체/.test(x.innerText || ''));
    return { 단추: b.length, 글: /지운 것은 하나도 없습니다/.test(el.innerText || '') };
  });
  is(M.단추 > 0, '  <b>☰ 메뉴 전체</b> 단추가 있다 — 서랍은 그대로다');
  is(M.글,       '  <b>「지운 것은 하나도 없습니다」</b> 라고 적는다');
  const D = await p.evaluate(() => { try { toggleNav(); } catch (e) { return 'X'; }
    const s = document.getElementById('sidebar');
    return s && s.classList.contains('open') ? 'O' : 'X'; });
  is(D === 'O', '  그 단추가 <b>진짜로 서랍을 연다</b>');
  await p.evaluate(() => { try { toggleNav(); } catch (e) {} });
  await p.waitForTimeout(300);

  console.log('\n[4] <b>표를 두 벌로 안 만들었다</b> (5번)');
  const src = fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8');
  const blk = src.slice(src.indexOf('function tlpGroups'), src.indexOf('function tlpCss'));
  is(/NAV_WHEN_G/.test(blk) && /NAV_WHEN\[/.test(blk),
     '  묶음을 <b>NAV_WHEN_G · NAV_WHEN</b> 에서 그대로 읽는다 — 여기서 다시 안 적는다');
  is(/navItemOf/.test(blk), '  이름·아이콘도 <b>navItemOf</b> 한 곳에서 받는다');
  const nowblk = src.slice(src.indexOf('function tlpNowTools'), src.indexOf('function tlpGroups'));
  is(/tdoTools/.test(nowblk), '  단계 도구는 <b>tdoTools</b> 그것을 부른다 — 홈 카드와 같은 표');

  console.log('\n[5] <b>찾기가 된다</b> — 그리고 없으면 없다고 한다 (1번)');
  const F = await p.evaluate(async () => {
    tlpSetQ('보장'); await new Promise(r => setTimeout(r, 300));
    const a = document.getElementById('dynPane').querySelectorAll('.tlp-row').length;
    tlpSetQ('ㅋㅋㅋ없는것ㅋㅋㅋ'); await new Promise(r => setTimeout(r, 300));
    const el = document.getElementById('dynPane');
    const b = el.querySelectorAll('.tlp-row').length;
    const none = /그런 이름은 없습니다/.test(el.innerText || '');
    tlpSetQ(''); await new Promise(r => setTimeout(r, 300));
    const c = document.getElementById('dynPane').querySelectorAll('.tlp-row').length;
    return { a, b, none, c };
  });
  is(F.a > 0 && F.a < F.c, '  치면 <b>줄어든다</b> — 「보장」 ' + F.a + '줄 / 전부 ' + F.c + '줄');
  is(F.b === 0 && F.none, '  없으면 <b>없다고</b> 한다 — 빈 화면으로 두지 않는다 (1번)');
  is(F.c > 0, '  지우면 <b>다 돌아온다</b> — ' + F.c + '줄');

  console.log('\n[6] 조용히 터지지 않았나');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' · ' + errs[0]) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 도구를 누르면 「무엇을 하실 건가요?」 가 서고, 서랍도 그대로 있습니다.');
  process.exit(bad ? 1 : 0);
})();
