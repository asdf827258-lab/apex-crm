/* 🔦 <b>따라만 가면 되는 길잡이</b> — 판 X433

   사장님 말씀 (2026-11-14) — 「내가 말한 도움말은, <b>딱 그곳에 동그라미 또는
   강조</b>, 다른 곳을 <b>흐리게</b> 하면서, <b>따라가면서</b> 할 수 있도록 하는
   거야. <b>오늘 하루의 루틴</b>을 너가 따라가게 하면서 계속 하게 하는 거지.
   그래야 <b>따라만 가면 되니깐</b>」.

   판 X408 은 걸음마다 <b>한 줄 도움말</b>을 붙였습니다. 그런데 그것은 읽고
   나서 <b>스스로 찾아가야</b> 하는 글이었습니다. 이 자는 사장님 말씀대로
   <b>화면이 데리고 다니는지</b>를 봅니다.

     1. 🔦 눌러 <b>길잡이가 열리나</b> — 덮개가 서나
     2. ★★ <b>그 자리만 밝나</b> — 구멍이 그 칸 위에 있고, 둘레가 어두운가
     3. ★★ <b>다섯 걸음을 다 도나</b> — 「다음」 만 눌러 ①→⑤ 가 차례로
     4. ★ <b>할 일이 없는 걸음도 안 건너뛴다</b> — 「오늘은 없습니다」 라고
        적는다. 조용히 빼면 그 걸음을 안 하신 줄 아십니다 (1번)
     5. ★ <b>걸음을 여기서 또 안 정한다</b> (5번) — HM_WAY 하나를 읽나.
        비우면 길잡이도 같이 빈다
     6. ★ <b>자리를 여기서 또 안 찾는다</b> (5번) — hmWayEl 하나에 묻나
     7. ★ <b>홈이 1px 도 안 길어지나</b> — 덮개는 position:fixed
     8. ★ 닻을 못 찾으면 <b>없는 자리를 안 가리키나</b> (1번)
     9. ★ 누르는 자리가 <b>44px 이상</b>인가 (사장님 손가락 바닥)
    10. ★ 「여기서 하기」 가 <b>옛 길(hmWayGo)을 그대로</b> 부르나 (6번)
    11. ★ 끝내면 <b>오늘 다시 안 여나</b> — 날짜는 mcalToday (UTC 금지)
    12. ★ 그만 두거나 Esc 로 <b>빠져나올 수 있나</b> — 갇히면 안 됩니다

   ★ 사장님 진짜 서버는 한 번도 안 부릅니다 (8번).                        */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r =>
    r.request().url().startsWith('http://127.0.0.1:') ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2700);

  await page.evaluate(() => {
    window.toast = function () {};
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    OS.profile = { id: 'me', name: '윤시현', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'me' } };
    try { localStorage.removeItem('apex_tour_done_v1'); } catch (e) {}
  });

  sec('[5]·[6] 걸음과 자리를 <b>여기서 또 정하지 않는다</b> (5번)');
  const SRC = fs.readFileSync('app/index.html', 'utf8');
  const 토막 = SRC.slice(SRC.indexOf('var HM_TOUR={'), SRC.indexOf('function hmWayTipHtml(){'));
  is(/HM_WAY\[/.test(토막) && /HM_WAY\.length/.test(토막),
     '걸음은 <b>HM_WAY</b> 하나를 읽는다 — 여기 다섯을 또 적지 않았다');
  is(/hmWayEl\(/.test(토막),
     '자리는 <b>hmWayEl</b> 하나에 묻는다 — 닻을 또 찾지 않았다');
  is(/hmWayGo\(/.test(토막),
     '「여기서 하기」 는 <b>옛 길(hmWayGo)</b>을 그대로 부른다 (6번)');
  is(/mcalToday\(\)/.test(토막) && !/toISOString/.test(토막),
     '오늘 날짜는 <b>mcalToday</b> 하나에 묻는다 — toISOString(UTC) 은 안 쓴다');
  /* 걸음 수를 여기 숫자로 박아 두면 HM_WAY 가 늘어도 안 따라옵니다 */
  is(!/다섯 걸음 중[^']*5/.test(토막) || /HM_WAY\.length/.test(토막),
     '걸음 수를 <b>손으로 박지 않았다</b>');

  sec('[1]·[2] 🔦 누르면 열리고 — <b>그 자리만 밝다</b>');
  const O = await page.evaluate(() => {
    /* 비출 자리를 하나 세워 둡니다 — 닻이 없으면 「없는 자리를 안 가리킨다」
       쪽([8])이 돌아 테두리가 0 입니다. 여기서 재는 것은 <b>비추는 모양</b>입니다. */
    const t = document.createElement('div');
    t.id = 'hmTourFake';
    t.style.cssText = 'height:120px;margin:40px 12px;background:#eee';
    document.body.appendChild(t);
    window.__keepEl = window.hmWayEl;
    window.hmWayEl = function () { return document.getElementById('hmTourFake'); };
    hmTourOpen(0);
    const w = document.getElementById('hmTourWrap');
    const h = document.getElementById('hmTourHole');
    const c = document.getElementById('hmTourCard');
    const cs = h ? getComputedStyle(h) : null;
    const ws = w ? getComputedStyle(w) : null;
    return {
      덮개: !!w && w.classList.contains('on'),
      덮개붙박이: ws ? ws.position : '',
      구멍: !!h,
      둘레어둠: cs ? /rgba?\([^)]*\)\s+0px\s+0px\s+0px\s+9999px|9999px/.test(cs.boxShadow) : false,
      테두리: cs ? (parseFloat(cs.outlineWidth) || 0) : 0,
      글칸: !!c && (c.innerText || '').length > 20,
      글: c ? (c.innerText || '').replace(/\s+/g, ' ').slice(0, 90) : ''
    };
  });
  await page.evaluate(() => { window.hmWayEl = window.__keepEl;
    const t = document.getElementById('hmTourFake'); if (t) t.remove(); hmTourClose(); });
  is(O.덮개, '🔦 누르면 덮개가 선다');
  is(O.덮개붙박이 === 'fixed', '덮개가 <b>붙박이(fixed)</b>다 — 홈 길이를 안 늘린다 ([7])');
  is(O.구멍 && O.둘레어둠,
     '★ <b>둘레가 어둡다</b> — 9999px 그림자로 그 자리만 남긴다');
  is(O.테두리 >= 2, '★ <b>그 자리에 테두리</b>가 그려진다 — ' + O.테두리 + 'px (사장님 「동그라미 또는 강조」)');
  is(O.글칸, '무엇을 하면 되는지 글이 선다 — 「' + O.글 + '…」');

  sec('[7] 홈이 <b>1px 도 안 길어진다</b>');
  const H = await page.evaluate(() => {
    const a = document.documentElement.scrollHeight;
    hmTourClose();
    const b = document.documentElement.scrollHeight;
    hmTourOpen(0);
    const c = document.documentElement.scrollHeight;
    return { 닫힘: b, 열림: c, 차: c - b };
  });
  is(Math.abs(H.차) <= 1, '열어도 홈 길이가 그대로다 — ' + H.닫힘 + 'px → ' + H.열림 + 'px');

  sec('[3]·[4] 「다음」 만 눌러 <b>다섯 걸음을 다 돈다</b>');
  const STEPS = await page.evaluate(() => {
    const out = [];
    hmTourOpen(0);
    for (let i = 0; i < 9; i++) {
      const c = document.getElementById('hmTourCard');
      if (!c || !document.getElementById('hmTourWrap').classList.contains('on')) break;
      const t = (c.innerText || '').replace(/\s+/g, ' ');
      out.push({ i: HM_TOUR.i, 글: t.slice(0, 70), 없음: /오늘은 없습니다/.test(t) });
      hmTourNext();
    }
    return { 줄: out, 끝남: !document.getElementById('hmTourWrap').classList.contains('on'),
             걸음수: HM_WAY.length };
  });
  is(STEPS.줄.length === STEPS.걸음수,
     '걸음 ' + STEPS.걸음수 + '개를 <b>다 돈다</b> — 받음 ' + STEPS.줄.length + '개');
  is(STEPS.줄.map(x => x.i).join(',') === STEPS.줄.map((_, k) => k).join(','),
     '차례가 ①→⑤ 로 간다 — 받음 ' + STEPS.줄.map(x => x.i).join(','));
  is(STEPS.끝남, '마지막에서 「끝내기」 를 누르면 <b>덮개가 걷힌다</b>');
  /* 할 일이 없는 걸음(④ 기록은 go 가 늘 false)이 조용히 안 빠지는지 */
  is(STEPS.줄.some(x => x.없음),
     '★ 할 일이 없는 걸음도 <b>「오늘은 없습니다」 라고 적고</b> 선다 — 조용히 안 뺀다 (1번)');

  sec('[11] 끝내면 <b>오늘 다시 안 연다</b>');
  const D = await page.evaluate(() => {
    let v = ''; try { v = localStorage.getItem('apex_tour_done_v1') || ''; } catch (e) {}
    return { 적힘: v, 오늘: (typeof mcalToday === 'function') ? mcalToday() : '', 끝났나: hmTourDone() };
  });
  is(D.적힘 === D.오늘 && D.끝났나, '오늘 날짜로 적힌다 — ' + D.적힘 + ' (오늘 ' + D.오늘 + ')');

  sec('[9] 누르는 자리가 <b>44px 이상</b>이다');
  const B = await page.evaluate(() => {
    hmTourOpen(1);
    return [...document.querySelectorAll('#hmTourCard button')]
      .map(e => ({ t: (e.innerText || '').trim().slice(0, 10),
                   h: Math.round(e.getBoundingClientRect().height) }));
  });
  is(B.length >= 3, '단추가 셋 이상 선다 — ' + B.map(x => x.t).join(' · '));
  is(B.every(x => x.h >= 44), '다 44px 이상 — ' + B.map(x => x.t + ' ' + x.h).join(' · '));

  sec('[8] 닻을 못 찾으면 <b>없는 자리를 안 가리킨다</b> (1번)');
  const MISS = await page.evaluate(() => {
    const keep = window.hmWayEl;
    window.hmWayEl = function () { return null; };
    hmTourOpen(0);
    const h = document.getElementById('hmTourHole');
    const c = document.getElementById('hmTourCard');
    const o = { 빈구멍: !!(h && h.classList.contains('none')),
                말함: /이 칸은 지금 화면에 없습니다/.test(c ? c.innerText : '') };
    window.hmWayEl = keep;
    return o;
  });
  is(MISS.빈구멍, '엉뚱한 자리에 동그라미를 안 그린다');
  is(MISS.말함, '★ <b>「이 칸은 지금 화면에 없습니다」 라고 말한다</b> — 모르면 모른다고 (1번)');

  sec('[12] 빠져나올 수 있다 — 갇히지 않는다');
  const OUT = await page.evaluate(() => {
    hmTourOpen(0);
    hmTourClose();
    const a = !document.getElementById('hmTourWrap').classList.contains('on');
    hmTourOpen(0);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    const b = !document.getElementById('hmTourWrap').classList.contains('on');
    return { 그만: a, esc: b };
  });
  is(OUT.그만, '「그만」 으로 닫힌다');
  is(OUT.esc, 'Esc 로도 닫힌다');

  sec('[10] 들어가는 길이 홈에 선다');
  const IN = await page.evaluate(() => {
    const h = (typeof hmWayTipHtml === 'function') ? hmWayTipHtml() : '';
    return { 글: h.replace(/\s+/g, ' ').slice(0, 120), 투어: /hmTourOpen\(/.test(h) };
  });
  is(IN.투어, '홈의 걸음 줄을 누르면 <b>길잡이가 열린다</b> — 「' + IN.글.slice(0, 70) + '…」');

  sec('[13] 화면이 안 터진다');
  is(errs.length === 0, '터진 것 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데가 걸렸습니다.')
                  : '따라만 가면 되는 길잡이가 섭니다 — 그 자리만 밝고, 다섯 걸음을 다 돕니다.');
  process.exit(bad ? 1 : 0);
})();
