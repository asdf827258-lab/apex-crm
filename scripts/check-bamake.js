/* ══════════════════════════════════════════════════════════════════
   보장분석 전 · 후 만들기 — 메뉴를 누르면 <b>바로</b> 이 화면이 뜨는가.
   그리고 고객 365일에 <b>한 고객 한 줄</b>로 저장되는가.

   ■ 이 화면은 app/ba.html 한 파일이다. 앱은 <b>띄우고 저장만</b> 한다.
   ■ 아무 창이나 보낸 쪽지로 고객 파일에 글이 써지면 안 된다.
   ────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd();
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);

const srv = http.createServer((rq, rs) => {
  let pn = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, pn);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': /\.html$/.test(f) ? 'text/html; charset=utf-8' : 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

(async () => {
  console.log('보장분석 전 · 후 만들기 — 메뉴에서 바로 뜨는가 · 고객에게 저장되는가');
  is(fs.existsSync(path.join(ROOT, 'app/ba.html')), 'app/ba.html 파일이 있다');
  const BA = fs.readFileSync(path.join(ROOT, 'app/ba.html'), 'utf8');

  sec('[1] 이 화면이 들고 있어야 할 것 — 하나라도 빠지면 안 된다');
  [['자동 보장분석', 'function fitCalc('], ['윤시현의 두뇌', 'function brainPick('],
   ['상담 포인트', 'function pointCalc('], ['연령대별 기준', 'var AGE_GUIDE='],
   ['보장분석 기준', 'var STUDY_DOC'], ['사용방법', 'function guideHtml('],
   ['시뮬레이션', 'function simCalc('], ['경제활동기', 'function lifeCalc('],
   ['인체 해부도', 'function anatSvg('], ['납입 보험료', 'function premCalc('],
   ['표준 담보표', 'function stBody('], ['KB 보장분석 읽기', 'function kbParse('],
   ['셈하는 기준(가정치)', 'function assumeHtml('], ['더 넣을 것', 'function needList('],
   ['옛 자료 되살리기', 'function migrate(']
  ].forEach(function (x) { is(BA.indexOf(x[1]) >= 0, x[0] + ' 이 들어 있다'); });
  is(/AI\s*를 부르지 않는다|AI 판단/.test(BA), 'AI 를 부르지 않는다고 적혀 있다');
  is(!/callAI\s*\(|generateContent|api\.openai/.test(BA), '실제로 <b>AI 를 부르지 않는다</b>');

  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  sec('[2] 메뉴를 누르면 바로 뜨는가');
  const m = await page.evaluate(() => {
    let it = null, grp = null;
    TABS.forEach(g => (g.items || []).forEach(x => { if (x.id === 'frmake') { it = x; grp = g.group; } }));
    return { has: !!it, title: it && it.title, grp: grp, hide: !!(it && it.hide),
             opens: (typeof openBa === 'function'),
             wired: /openBa\(\)/.test(String(go)) };
  });
  is(m.has && !m.hide, '메뉴에 「' + (m.title || '?') + '」 가 보이게 있다 (' + m.grp + ')');
  is(m.opens && m.wired, '그 메뉴가 <b>이 화면</b>을 연다 — 옛 리포트가 아니다');

  const opened = await page.evaluate(() => {
    OSC.current = { id: 'c-test', name_masked: '홍○동' };
    openBa();
    return { on: document.getElementById('baScreen').classList.contains('on'),
             src: document.getElementById('baFrame').getAttribute('src'),
             cid: BA.cid };
  });
  is(opened.on && opened.src === 'ba.html', '누르면 <b>바로</b> 전용 화면이 뜬다 (' + opened.src + ')');
  is(opened.cid === 'c-test', '보던 고객을 <b>들고</b> 연다');

  await page.waitForTimeout(2200);
  const fr = page.frames().filter(f => /ba\.html/.test(f.url()))[0];
  is(!!fr, '화면이 실제로 실린다');
  if (fr) {
    await fr.waitForTimeout(1000);
    const inside = await fr.evaluate(() => ({
      alive: typeof S === 'object' && S !== null,
      inframe: INFRAME === true,
      btn: !!document.getElementById('baSaveBtn'),
      shown: document.getElementById('baSaveBtn').style.display !== 'none'
    }));
    is(inside.alive, '화면 안이 <b>멈추지 않고</b> 살아 있다');
    is(inside.inframe && inside.btn && inside.shown, '워크스페이스 안이라 <b>「고객 365일에 저장」</b> 단추가 선다');

    sec('[3] 저장 — 한 고객에 한 줄, 아무나 못 쓴다');
    const said = await page.evaluate(async () => {
      window.__t = [];
      const o = window.toast; window.toast = function (x) { window.__t.push(x); };
      /* ① 남의 창이 보낸 쪽지 — <b>받으면 안 된다</b> */
      window.postMessage({ type: 'apexBaSave', title: '나쁜 저장', state: {} }, '*');
      await new Promise(r => setTimeout(r, 300));
      const bad = window.__t.slice();
      window.toast = o;
      return { bad: bad };
    });
    is(said.bad.length === 0, '<b>우리가 띄운 틀이 아닌 곳</b>에서 온 쪽지는 안 받는다');

    const said2 = await page.evaluate(() => {
      window.__t = [];
      const o = window.toast; window.toast = function (x) { window.__t.push(x); };
      baSave({ title: 't', state: { v: 3 } });
      window.toast = o;
      return window.__t.join(' | ');
    });
    is(/로그인/.test(said2), '로그인 없이 저장하면 <b>그렇다고 말한다</b> — 조용히 실패하지 않는다');

    const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
    const seg = src.slice(src.indexOf('function baSave('), src.indexOf('function baAskSave('));
    is(/kind:'ba_state'/.test(seg), '저장은 <b>이미 있는 표</b>(saved_reports)에 한다 — 새 표를 안 만든다');
    is(/BA\.rid[\s\S]{0,200}update\(/.test(seg), '두 번 저장해도 <b>한 고객에 한 줄</b>이다 — 쌓지 않는다');
    is(/osRepMask/.test(seg), '제목은 <b>가린 이름</b>으로 저장한다 — 실명을 서버에 안 올린다');
  }

  sec('[4] 혼자서도 열리는가 — 파일을 그냥 열었을 때');
  const solo = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const se = []; solo.on('pageerror', e => se.push(e.message));
  await solo.goto('http://127.0.0.1:' + srv.address().port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await solo.waitForTimeout(1200);
  const s2 = await solo.evaluate(() => ({
    app: document.getElementById('app').innerHTML.length,
    inframe: INFRAME,
    btn: document.getElementById('baSaveBtn').style.display
  }));
  is(s2.app > 5000, '워크스페이스 <b>없이도</b> 그대로 열린다 (' + s2.app + '자)');
  is(s2.inframe === false && s2.btn === 'none', '혼자 열면 <b>고객 저장 단추를 안 세운다</b> — 저장할 데가 없으니');

  sec('[5] 화면이 멈추지 않는가');
  is(errs.length === 0, '워크스페이스에서 오류가 없다' + (errs.length ? ' — ' + errs[0] : ''));
  is(se.length === 0, '혼자 열 때 오류가 없다' + (se.length ? ' — ' + se[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데가 걸렸습니다.') : '보장 전 · 후 만들기 점검 통과 — 메뉴에서 바로 뜨고, 고객에게 한 줄로 저장됩니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
