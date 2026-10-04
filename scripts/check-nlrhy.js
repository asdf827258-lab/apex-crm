/* ══════════════════════════════════════════════════════════════════
   check-nlrhy.js — <b>무엇을 언제 올릴지가 적혀 있나.</b>

   2026-09-26. 사장님 말씀 「목업하고 너무 다른데」. 목업의 콘텐츠 화면
   맨 위에는 <b>「나를 알리는 월·수·금」</b> 과 카드 셋이 있는데 앱에는
   통째로 없었습니다 — 무엇을 언제 올릴지가 어디에도 안 적혀 있어
   매번 「오늘 뭘 올리지」 부터 생각해야 했습니다.

   ★ 여기서 제일 중요한 것은 <b>막지 않는 것</b>입니다. 사장님 말씀 ⑪ 은
     「인스타·블로그 자동화 — SNS관리 · <b>매일</b> 알람」 이고 목업은
     「매일 하지 않습니다」 입니다. <b>두 말씀이 다릅니다.</b> 그래서 리듬은
     보여 드리되 <b>다른 날에 올리셔도 아무것도 안 막습니다.</b>
     막아 버리면 앞선 말씀을 조용히 뒤집는 것입니다 (1번).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 카드 셋이 <b>목업 이름 그대로</b> 선다
     [2] 오늘이 월·수·금이면 <b>그 칸이 켜진다</b>
     [3] ★ <b>막지 않는다</b> — 다른 날에도 「올리셔도 됩니다」 · 단추가 산다
     [4] 표가 <b>한 곳</b>이다 (5번)
     [5] 꼬리표가 <b>한글</b>이고 아래 띠 이름과 같다
     [6] 조용히 터지지 않았나
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9024;
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

const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ if(cb)cb(); };
  window.toast=function(){}; window.nlLoad=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  window.osTabAllowed=function(){return true;};
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.list=[]; CM.loaded=true; CM.meta={};
  AR.loaded=true; AR.busy=''; AR.cliRows=[]; AR.db=[];
  try{ osHideLoginGate(); }catch(e){}
  go('news_live');
};

/* 요일을 정해 놓고 그립니다 — 시계를 기다리면 월요일에만 되는 점검이 됩니다 */
const 요일로 = d => `(function(){
  var R=Date.prototype.getDay;
  Date.prototype.getDay=function(){ return ${d}; };
  var h=nlRhyHtml();
  Date.prototype.getDay=R;
  return h;
})()`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED);
  await p.waitForTimeout(1400);

  console.log('\n[1] 카드 셋이 <b>목업 이름 그대로</b> 선다');
  const A = await p.evaluate(() => {
    const el = document.getElementById('dynPane'), t = el ? el.innerText : '';
    const cards = el ? [].slice.call(el.querySelectorAll('.nlr > div')) : [];
    return { t: t, n: cards.length,
             칸: cards.map(x => x.innerText.replace(/\s+/g, ' ').trim()) };
  });
  is(/나를 알리는/.test(A.t), '  제목 <b>「나를 알리는 월 · 수 · 금」</b> 이 선다');
  is(A.n === 3, '  카드가 <b>셋</b>이다 — ' + A.n + '개');
  ['카드뉴스', '블로그', '릴스 대본'].forEach(nm =>
    is(A.칸.some(x => x.indexOf(nm) >= 0), '  목업의 「' + nm + '」 이 그대로 있다'));
  ['월요일', '수요일', '금요일'].forEach(nm =>
    is(A.칸.some(x => x.indexOf(nm) >= 0), '  「' + nm + '」 칸이 있다'));

  console.log('\n[2] 오늘이 월·수·금이면 <b>그 칸이 켜진다</b>');
  const B = await p.evaluate(([m, w, f, s]) => ({
    월: eval(m), 수: eval(w), 금: eval(f), 토: eval(s)
  }), [요일로(1), 요일로(3), 요일로(5), 요일로(6)]);
  const on = h => (h.match(/class="on"/g) || []).length;
  is(on(B.월) === 1 && /월요일 · 오늘/.test(B.월), '  월요일이면 <b>월 칸만</b> 켜진다');
  is(on(B.수) === 1 && /수요일 · 오늘/.test(B.수), '  수요일이면 <b>수 칸만</b> 켜진다');
  is(on(B.금) === 1 && /금요일 · 오늘/.test(B.금), '  금요일이면 <b>금 칸만</b> 켜진다');
  is(on(B.토) === 0, '  토요일이면 <b>아무 칸도</b> 안 켜진다 — 리듬에 없는 날이다');

  console.log('\n[3] ★ <b>막지 않는다</b> (1번 · 사장님 말씀 ⑪ 「매일」)');
  const plain = h => h.replace(/<[^>]*>/g, '');
  is(/올리셔도 됩니다/.test(plain(B.토)),
     '  리듬에 없는 날에도 <b>「올리셔도 됩니다」</b> 라고 한다');
  is(!/올리지 마|하지 마세요|안 됩니다/.test(plain(B.토)),
     '  ★ <b>「올리지 마세요」 라고 하지 않는다</b> — 앞선 말씀(매일)을 조용히 뒤집지 않는다');
  is(/카드뉴스 하는 날|카드뉴스<\/b> 하는 날/.test(B.월) || /하는 날입니다/.test(B.월),
     '  리듬에 있는 날에는 <b>무엇 하는 날인지</b> 말한다');
  /* 만드는 단추가 <b>요일과 상관없이</b> 살아 있는가 — 막으면 그것부터 사라집니다 */
  const C = await p.evaluate(() => {
    const el = document.getElementById('dynPane');
    const btn = [].slice.call(el.querySelectorAll('button'))
                  .filter(x => x.offsetParent && /뉴스|블로그|카드|올렸/.test(x.innerText));
    return { n: btn.length, 이름: btn.slice(0, 4).map(x => x.innerText.replace(/\s+/g, ' ').trim()) };
  });
  is(C.n >= 2, '  ★ 오늘이 리듬에 없는 날이어도 <b>만드는 단추가 그대로</b> 산다 — ' +
     C.n + '개 · ' + C.이름.join(' | '));

  console.log('\n[4] 표가 <b>한 곳</b>이다 (5번)');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is((SRC.match(/var NL_RHY=/g) || []).length === 1,
     '  요일·무엇 표가 <b>한 벌</b>이다 — 두 벌이면 한쪽만 고쳐진다');
  is(/NL_RHY\[d\]/.test(SRC) && /NL_RHY\[w\]/.test(SRC),
     '  카드도 안내도 <b>그 표에서</b> 읽는다 — 손으로 또 적지 않는다');

  console.log('\n[5] 꼬리표가 <b>한글</b>이고 아래 띠 이름과 같다');
  const D = await p.evaluate(() => {
    const tag = document.querySelector('#dynPane .page-tag');
    const tb = (typeof TB !== 'undefined') ? (TB.filter(x => x.id === 'news_live')[0] || {}).t : '';
    return { tag: tag ? tag.textContent.trim() : '', tb: tb || '' };
  });
  is(!/^[A-Za-z]+$/.test(D.tag), '  꼬리표가 <b>영문만</b>이 아니다 — ' + D.tag);
  is(D.tag === D.tb, '  꼬리표가 <b>아래 띠 이름과 같다</b> — ' + D.tag + ' / ' + D.tb);

  console.log('\n[6] 조용히 터지지 않았나');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0, 2).join(' | ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 무엇을 언제 올릴지가 서고, 다른 날에 올리셔도 안 막습니다.');
  process.exit(bad ? 1 : 0);
})();
