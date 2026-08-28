/* <b>아침에 출근해서 TFA 를 열었을 때.</b>

   사장님이 말씀하신 세 가지입니다.

     ① 「TFA 업무관리에서 대표관리가 현재 없고」
     ② 「메뉴검색이 우선 안되 자꾸 오류가 있어」
     ③ 「내가 출근해서 시작해야 되가지고 매번 기다리는게 시간이 오래걸려」

   재 보니 셋 다 사실이었습니다.

   ① <b>대표 브리핑이 TFA 안에 없었다.</b> 아침 7시에 서버가 만들어 두는
      한 장인데 왼쪽 큰 메뉴의 「조직 관리」 안에만 서 있었다. 아침에
      여는 화면은 TFA 다 — 거기서 못 찾으면 없는 것과 같다.

   ② <b>찾기가 큰 메뉴(TABS)만 봤다.</b> 하루에 제일 많이 부르는 이름은
      TFA <b>안</b>에 있다. 재 보니 열두 칸 중 <b>열한 칸</b>이 안 찾혔다 —
      「팀원 관리」·「해야 할 일」·「30일 고객관리」 전부.

   ③ <b>서른두 명을 한 사람씩 세웠다.</b> AI 한 번이 10초쯤이니 32명이면
      <b>5분</b>이다. 그동안 화면에 「만드는 중 2 / 32」 만 돈다.
      서로 기다릴 이유가 없는 일인데(사람마다 따로 쓰는 보고다) 줄을
      세웠다. 그리고 <b>몇 명이 실패해도</b> 「팀 전원 보고가 준비됐습니다」
      라고 했다 — 두 명이 빈 채로 회의에 들어가신다.

   여기서 확인합니다.
     1. TFA 안에 <b>대표 브리핑</b>이 있는가 · 몸통을 두 번 만들지 않는가
     2. 찾기가 <b>화면 안의 칸</b>까지 찾는가 · 헛알람은 없는가
     3. 서른두 명이 <b>동시에</b> 도는가 · 한 사람도 안 빠지는가
     4. 한 사람이 실패해도 <b>나머지가 도는가</b> · 몇 명이 빠졌는지 말하는가
     5. 세는 숫자가 <b>끝난 수</b>인가 (시작한 수로 세면 다 됐다고 먼저 뜬다)
     6. 돌리는 자리가 <b>하나</b>인가 (단추 · 아침 자동)                */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 180)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[1] TFA 업무관리 안에 대표 브리핑이 있다');
  const one = await page.evaluate(() => ({
    has: AR_CAT.some(c => c[0] === 'brief' && c[2] === '대표 브리핑'),
    why: (AR_CAT.filter(c => c[0] === 'brief')[0] || [])[3] || '',
    body: typeof schInnerHtml === 'function',
    /* 몸통을 두 자리가 각자 그리면 한쪽만 고쳐진다 (CLAUDE.md 5번) */
    viaOne: /schInnerHtml\(\)/.test(String(renderReportPage)) &&
            /schInnerHtml\(\)/.test(String(arBodyHtml)),
    twin: /clm-tab[\s\S]{0,200}오늘의 브리핑/.test(String(renderReportPage)),
    /* 열 때 미리 만들어 둔 한 장을 읽어 와야 몸통이 찬다 */
    loads: /schOpen\(\)/.test(String(arGoCat))
  }));
  is(one.has, '  왼쪽 칸에 <b>📊 대표 브리핑</b>이 선다 — 「' + one.why + '」');
  is(one.body && one.viaOne,
     '  몸통은 <b>schInnerHtml 한 곳</b>에서만 만든다 — 두 자리가 같은 것을 본다');
  is(!one.twin, '  큰 메뉴 쪽이 <b>제 손으로 또 그리지 않는다</b> — 쌍둥이가 없다');
  is(one.loads, '  열면 <b>미리 만들어 둔 한 장을 읽어 온다</b> — 안 부르면 스피너만 돈다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[2] 메뉴 찾기가 화면 안의 칸까지 찾는다');
  const find = await page.evaluate(() => {
    const inner = AR_CAT.map(c => ({ id: 'airep', title: c[2], ak: c[3] }));
    const hit = q => inner.filter(it => navHit(it, q, false)).map(it => it.title);
    const Q = ['팀원 관리', '피드백', '스케줄', '해야 할 일', '30일 고객관리',
               '오늘 터치', '역량', '리더 할 일', '대표 브리핑'];
    const got = Q.map(q => ({ q, t: hit(q) }));
    /* 실제로 그려지는가 · 눌러서 그 칸이 열리는가 */
    navFind('팀원 관리');
    const host = document.getElementById('navHost');
    const drawn = /TFA 업무관리 안/.test(host.textContent);
    const btn = [...host.querySelectorAll('.tab-btn')].filter(x => /팀원 관리/.test(x.textContent))[0];
    if (btn) btn.click();
    const cat = AR.cat;
    /* 없는 말에는 예전처럼 「없습니다」 — 아무거나 올리면 더 못 찾으신다 */
    navFind('zzzz없는것zzzz');
    const none = /로 찾은 메뉴가 없습니다/.test(document.getElementById('navHost').textContent);
    navFind('');
    return { got, drawn, cat, none,
             /* 이름을 여기에 또 적으면 칸이 늘 때 한쪽만 고쳐진다 (5번) */
             oneList: /AR_CAT/.test(String(renderNav)) };
  });
  const missed = find.got.filter(g => !g.t.length).map(g => g.q);
  is(!missed.length,
     '  아홉 가지를 다 찾는다 — ' + (missed.length ? ('<b>못 찾음: ' + missed.join(' · ') + '</b>')
                                                  : find.got.map(g => g.q).join(' · ')));
  is(find.drawn, '  찾기 결과에 <b>「TFA 업무관리 안」</b> 줄이 따로 선다');
  is(find.cat === 'team', '  누르면 <b>그 칸이 열린다</b> — 지금 「' + find.cat + '」');
  is(find.none, '  없는 말에는 <b>「없습니다」</b> 그대로 — 헛것을 올리지 않는다');
  is(find.oneList, '  이름은 <b>AR_CAT 하나</b>에서만 가져온다 — 또 적으면 한쪽만 고쳐진다');

  /* ─────────────────────────────────────────────────────────────── */
  /* 서른두 명을 실제로 돌린다. AI 한 번을 300ms 로 흉내내고, 다섯 번째와
     열두 번째는 <b>일부러 실패</b>시킨다 — 실제로 AI 는 가끔 거절한다. */
  const run = async (failAt) => page.evaluate(async (failAt) => {
    const N = 32;
    GB.rows = []; GB.loaded = true; GB.pass = {}; GB.notes = [];
    for (let i = 0; i < N; i++) GB.rows.push({
      id: 'm' + i, name: '홍길동' + i, role: 'member', team: 't1', total: 50 + i,
      raw: { att: 10, call: 20, cli: 3, rep: 2, run: 5, edu: 1 },
      sc: { att: 50, call: 50, cli: 50, rep: 50, run: 50, edu: 50 },
      last: '2026-08-27', lastAtt: '2026-08-27'
    });
    AR.loaded = true; AR.rep = {}; AR.crm = {}; AR.cli = {}; AR.team = ''; AR.busy = '';
    OS.profile = OS.profile || { name: '윤시현', role: 'owner' };
    let peak = 0, live = 0, calls = 0, over = 0;
    window.callAI = function () {
      calls++; live++; peak = Math.max(peak, live);
      const n = calls;
      return new Promise((ok, no) => setTimeout(() => {
        live--;
        if (failAt.indexOf(n) >= 0) no(new Error('AI 거절'));
        else ok('활동보고: 좋았습니다\n활동격려: 잘하셨습니다');
      }, 300));
    };
    window.arSaveRow = function () {};
    /* 세는 숫자가 전체를 넘거나, 끝나기 전에 32/32 를 띄우지 않는지 본다 */
    const realPaint = window.arPaint;
    window.arPaint = function () {
      const m = /^(\d+) \/ (\d+)/.exec(AR.qmsg || '');
      if (m && (+m[1] > +m[2])) over++;
      if (m && +m[1] === N && live > 0) over++;
      try { realPaint(); } catch (e) {}
    };
    const t0 = Date.now();
    const r = await new Promise(res =>
      arRunQueue(GB.rows.map(x => x.id), { done: (got, total, fail) => res({ got, total, fail }) }));
    window.arPaint = realPaint;
    return { ms: Date.now() - t0, calls, peak, over, r,
             made: Object.keys(AR.rep).length, busy: AR.busy, qmsg: AR.qmsg,
             lanes: AR_LANES, serial: N * 300,
             msg: arDoneMsg(r.got, r.total, r.fail, '팀원 관리') };
  }, failAt);

  console.log('\n[3] 서른두 명이 동시에 돈다 — 한 사람씩 세우면 5분이다');
  const okRun = await run([]);
  is(okRun.peak > 1 && okRun.peak <= okRun.lanes,
     '  <b>' + okRun.peak + '명씩</b> 동시에 돈다 (정한 값 ' + okRun.lanes + ')');
  is(okRun.ms < okRun.serial * 0.5,
     '  한 사람씩보다 <b>' + (okRun.serial / okRun.ms).toFixed(1) + '배</b> 빠르다 — ' +
     okRun.ms + 'ms (한 사람씩이면 ' + okRun.serial + 'ms)');
  is(okRun.calls === 32 && okRun.made === 32 && okRun.r.got === 32,
     '  서른두 명 <b>아무도 안 빠진다</b> — 부른 횟수 ' + okRun.calls + ' · 만든 보고 ' + okRun.made);
  is(!okRun.busy && !okRun.qmsg, '  끝나면 <b>「만드는 중」 이 사라진다</b>');

  console.log('\n[4] 한 사람이 실패해도 나머지가 돌고, 몇 명이 빠졌는지 말한다');
  const badRun = await run([5, 12]);
  is(badRun.calls === 32,
     '  두 명이 막혀도 <b>서른두 명을 다 시도한다</b> — ' + badRun.calls + '번 ' +
     '(줄이 서면 여기서 멈춘다)');
  is(badRun.made === 30 && badRun.r.fail === 2 && badRun.r.got === 30,
     '  <b>된 것과 안 된 것을 가른다</b> — 된 ' + badRun.r.got + ' · 못한 ' + badRun.r.fail);
  is(/2명은 AI 가 답하지 않아 못 만들었습니다/.test(badRun.msg),
     '  <b>몇 명이 빠졌는지 말한다</b> — 「전원 준비됐습니다」 라고 하지 않는다');
  is(/한 번 더/.test(badRun.msg),
     '  <b>어떻게 하면 되는지</b>까지 말한다');
  is(/지어내지는 않습니다/.test(badRun.msg),
     '  <b>없는 보고를 지어내지 않는다</b>고 밝힌다 (CLAUDE.md 1번)');
  is(!/못 만들었습니다/.test(okRun.msg) && /모두 준비됐습니다/.test(okRun.msg),
     '  다 됐을 때는 <b>아무 말도 안 붙인다</b> — 헛알람이 없다');

  console.log('\n[5] 세는 숫자는 끝난 수다');
  is(okRun.over === 0 && badRun.over === 0,
     '  전체를 넘거나 <b>끝나기 전에 다 됐다고</b> 뜨지 않는다 — 어긋난 횟수 ' +
     (okRun.over + badRun.over) + ' (시작한 수로 세면 32/32 를 띄워 놓고 한참 더 돈다)');

  console.log('\n[6] 돌리는 자리는 하나다');
  const oneQ = await page.evaluate(() => ({
    all: /arRunQueue\(/.test(String(arGenAll)),
    auto: /arRunQueue\(/.test(String(arAutoRun)),
    msg: /arDoneMsg\(/.test(String(arGenAll)) && /arDoneMsg\(/.test(String(arAutoRun)),
    /* 제 손으로 줄 세우는 판이 남아 있으면 한쪽만 고쳐진다 */
    own: [arGenAll, arAutoRun].filter(f => /setTimeout\(step/.test(String(f))).length
  }));
  is(oneQ.all && oneQ.auto,
     '  단추와 아침 자동이 <b>같은 arRunQueue</b> 를 부른다');
  is(oneQ.msg, '  끝났을 때 하는 말도 <b>arDoneMsg 한 곳</b>에서 만든다');
  is(oneQ.own === 0,
     '  제 손으로 줄 세우는 판이 <b>안 남아 있다</b> — ' + oneQ.own + '곳');

  /* ─────────────────────────────────────────────────────────────── */
  /* ── 앱을 열면 <b>정말로</b> 저절로 시작되는가 ──────────────────────
     로그인하면 45초 뒤·10분마다 arAutoRun 이 깨어난다. 그런데 그것은
     <b>기록(GB·AR)이 이미 읽혀 있어야만</b> 돌았고, 읽어 주는 유일한
     자리가 <b>아침 창</b>(arBriefMaybe)이었다. 아침 창은 오늘 이미
     보셨거나 꺼 두셨으면 그냥 돌아간다.

     그래서 아침 창을 닫고 앱을 <b>다시 여시면</b>, 또는 아침 창을 꺼
     두셨으면, 10분마다 깨어나 아무것도 안 하고 돌아가기만 했다 —
     TFA 를 손으로 열기 전까지 팀 보고가 영영 안 만들어졌다.
     아무 말도 없이. 「출근해서 시작해야 된다」 의 진짜 뿌리다.       */
  console.log('\n[7] 앱을 열면 저절로 시작된다 — 아침 창을 껐어도');
  const auto = await page.evaluate(() => {
    OS.profile = { name: '윤시현', role: 'owner', id: 'me' };
    const cases = [
      ['아침에 처음 연다', () => {}],
      ['오늘 아침 창을 이미 봤다', () => localStorage.setItem(arBriefKey(), '1')],
      ['아침 창을 꺼 두셨다', () => localStorage.setItem('apex_ar_brief_off', '1')]
    ];
    const realLoad = window.arLoad;
    /* ── <b>시계를 붙잡는다.</b> ────────────────────────────────────
       arAutoRun 은 <code>arDue()</code>(오전 8시 이후) 가 아니면 그냥
       돌아간다. 여태 이 점검은 <b>돌리는 시각</b>에 따라 켜졌다 꺼졌다
       했다 — 자정~오전 8시(KST)에 미는 PR 은 전부 빨간불이 났다.
       실제로 2026-08-29 00:29 에 그렇게 막혔다. 시각으로 갈리는 점검은
       「헛것을 잡는 점검」이다 (CLAUDE.md 8번). 그래서 여기서는 시각을
       <b>우리가 정한다</b> — 8시 전·후를 둘 다 따로 본다. */
    const realNowH = window.arNowH;
    window.arNowH = function () { return AR_H; };          /* 8시가 되었다 */
    const got = cases.map(([label, setup]) => {
      ['apex_ar_brief_off', 'apex_ar_auto_off'].forEach(k => localStorage.removeItem(k));
      Object.keys(localStorage).filter(k => /^apex_ar_(brief|team)_/.test(k))
        .forEach(k => localStorage.removeItem(k));
      GB.loaded = false; GB.rows = null; AR.loaded = false; AR.busy = '';
      let n = 0; window.arLoad = function () { n++; };
      setup();
      try { arBriefMaybe(); } catch (e) {}
      try { arAutoRun(); } catch (e) {}
      return { label, n };
    });
    /* 자동을 <b>끄셨으면</b> 안 읽어야 한다 — 끈 것을 무시하면 안 된다 */
    ['apex_ar_brief_off'].forEach(k => localStorage.removeItem(k));
    Object.keys(localStorage).filter(k => /^apex_ar_(brief|team)_/.test(k))
      .forEach(k => localStorage.removeItem(k));
    GB.loaded = false; AR.loaded = false; AR.busy = '';
    let offN = 0; window.arLoad = function () { offN++; };
    localStorage.setItem('apex_ar_auto_off', '1');
    localStorage.setItem(arBriefKey(), '1');
    try { arAutoRun(); } catch (e) {}
    localStorage.removeItem('apex_ar_auto_off');
    /* 오늘 <b>이미 다 만들었으면</b> 또 읽지 않는다 (CLAUDE.md 7번) */
    Object.keys(localStorage).filter(k => /^apex_ar_brief_/.test(k)).forEach(k => localStorage.removeItem(k));
    GB.loaded = false; AR.loaded = false; AR.busy = '';
    let doneN = 0; window.arLoad = function () { doneN++; };
    localStorage.setItem(arAutoKey(), '1');
    localStorage.setItem(arBriefKey(), '1');
    try { arAutoRun(); } catch (e) {}
    localStorage.removeItem(arAutoKey());
    /* <b>8시 전에는 안 읽어야 한다</b> — 새벽에 서버를 부르면 안 된다 (7번) */
    Object.keys(localStorage).filter(k => /^apex_ar_(brief|team)_/.test(k))
      .forEach(k => localStorage.removeItem(k));
    GB.loaded = false; AR.loaded = false; AR.busy = '';
    let earlyN = 0; window.arLoad = function () { earlyN++; };
    window.arNowH = function () { return AR_H - 1; };      /* 아직 7시다 */
    try { arAutoRun(); } catch (e) {}
    window.arNowH = realNowH;
    window.arLoad = realLoad;
    return { got, offN, doneN, earlyN };
  });
  auto.got.forEach(g => is(g.n > 0,
    '  ' + g.label + ' — <b>기록을 읽으러 간다</b>' + (g.n > 0 ? '' : ' · 안 간다 (TFA 를 손으로 열어야 시작된다)')));
  is(auto.offN === 0,
     '  <b>자동을 끄셨으면</b> 안 읽는다 — 끈 것을 무시하지 않는다 · ' + auto.offN + '번');
  is(auto.doneN === 0,
     '  오늘 <b>이미 다 만들었으면</b> 또 안 읽는다 — ' + auto.doneN + '번 (10분마다 서버를 부르면 안 된다)');
  is(auto.earlyN === 0,
     '  <b>오전 8시 전에는 안 읽는다</b> — ' + auto.earlyN + '번 (새벽에 서버를 부르지 않는다 · 7번)');

  console.log('\n[8] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 아침에 앉아서 기다리시게 됩니다')
                  : '✓ TFA 안에서 다 찾히고 · 동시에 돌고 · 빠진 사람을 말합니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
