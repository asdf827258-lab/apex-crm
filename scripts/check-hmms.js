/* 🌅 <b>아침 미션 — 위로 · TA 대본 · 며칠째 안 했는지</b> (판 X435)

   사장님 말씀 (2026-11-14) —
     「맨 밑에 오늘 아침 미션에서도 TA인데, 우리 <b>TA 스크립트</b>가 있는데,
      이 부분을 연결해서 할 수 있는 멘트로 <b>바로 연결</b>하도록 해야지
      <b>디비 종류</b>도 나와 있는데, 거기에 맞추어서 스크립트를 띄워.
      [<b>아침 미션을 오늘 칸에 따로 만들어서</b>] <b>위 쪽에 따로 배치</b>하여서
      <b>클릭하면 펼쳐지고</b> 할 수 있도록 만들자.
      아침 미션을 계속 안 하는 사람은 <b>며칠째 안 했다 · 몇 명 안 했다
      경고문</b>을 띄워 줘 각자 맞추어서」.

   ── 이 자가 보는 것 ────────────────────────────────────────────
     1. 미션 접이가 <b>갈래별 줄보다 위</b>에 있다
     2. ★★ TA 대본을 <b>여기서 또 안 만든다</b> (5번) — hmTaHtml 하나
     3. ★ 그 분 <b>DB 종류</b>로 고른다 — 머리에 그 종류가 적힌다
     4. ★ <b>접힌 채로</b> 서서 한 화면을 안 넘는다 (사장님 「클릭하면 펼쳐지고」)
     5. ★★ 며칠째는 <b>이 기기 체크판</b>에서 세고 <b>서버를 새로 안 부른다</b> (7번)
     6. ★★ 팀 수는 <b>이미 받아 둔 판</b>이 있을 때만 말한다 — 없으면 입을
        다문다. 「0명이 안 했다」 는 「다 했다」 는 뜻이 됩니다 (1번)
     7. ★ 하루 거른 것으로는 <b>안 나무란다</b> — 이틀부터
     8. ★ <b>접어 두어도 경고가 보인다</b> — 펴야 보이면 뜻이 없습니다
     9. ★ 기록이 아예 없는 날은 <b>안 센다</b> — 모르는 것을 「안 했다」 로
        읽으면 처음 쓰시는 분께 첫날부터 경고가 뜹니다 (1번)

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
    try { go('home'); } catch (e) {}
    try { if (typeof hmPaint === 'function') hmPaint(); } catch (e) {}
  });
  await page.waitForTimeout(500);

  const SRC = fs.readFileSync('app/index.html', 'utf8');

  sec('[1] ★★ 미션 접이가 <b>「오늘」 카드 맨 위</b>에 선다 (판 X439)');
  /* ⚠⚠ <b>판 X435 에서 이 자는 반쪽만 물었습니다.</b> 「갈래별 줄(.hm-rows)보다
     위인가」 만 물었는데, <b>그 줄 묶음 자체가 홈 맨 밑</b>이라 미션은 여전히
     폰에서 y2,254(홈 전체 2,493)였습니다 — 사장님 말씀 「맨 밑에 … 위 쪽에
     따로 배치」 가 하나도 안 풀렸는데 <b>자는 초록이었습니다.</b> 화면을 찍어
     보고서야 알았습니다. 그래서 이제 <b>진짜 자리를 px 로</b> 묻습니다 (8번). */
  const P = await page.evaluate(() => {
    const pane = document.getElementById('dynPane');
    const top = pane ? pane.getBoundingClientRect().top : 0;
    const y = (sel) => { const e = document.querySelector(sel); if (!e) return null;
      const b = e.getBoundingClientRect(); return { 위: Math.round(b.top - top), 키: Math.round(b.height) }; };
    return { 미션: y('#hmFold_ms'), 띠: y('#hmBandHost'), 지금: y('#hmJobHost'),
             자리: !!document.getElementById('hmMsTop'),
             홈: pane ? Math.round(pane.scrollHeight) : 0,
             보임: Math.round((window.innerHeight - top)) };
  });
  is(!!P.미션, '🌅 아침 미션 접이가 홈에 선다');
  is(P.자리, '  세우는 자리가 <b>「오늘」 카드 안</b>이다 (#hmMsTop)');
  is(!!P.미션 && !!P.띠 && P.미션.위 >= P.띠.위 && P.미션.위 <= P.띠.위 + P.띠.키 + 24,
     '  ★★ <b>한 장 띠 바로 아래</b>에 선다 — y' + (P.미션 ? P.미션.위 : -1) +
     ' (띠 y' + (P.띠 ? P.띠.위 : -1) + '+' + (P.띠 ? P.띠.키 : 0) + ')');
  is(!!P.미션 && P.미션.위 <= P.보임,
     '  ★★ <b>폰 첫 화면 안</b>에 있다 — y' + (P.미션 ? P.미션.위 : -1) + ' / 보이는 높이 ' + P.보임 + 'px');
  is(!!P.지금 && P.지금.위 + P.지금.키 <= P.보임,
     '  ★ 「지금 할 것」 을 <b>첫 화면 밖으로 밀지 않았다</b> — 끝 y' +
     (P.지금 ? P.지금.위 + P.지금.키 : -1) + ' (판 X187 사장님 말씀 「지금할것을 맨위로」)');
  /* ★ 짓는 자는 하나인가 — 두 곳에서 세우면 홈에 미션이 둘 섭니다 (5번) */
  is((SRC.match(/hmMsFoldHtml\(\)/g) || []).length === 2,
     '  ★ 짓는 자(hmMsFoldHtml)를 <b>한 곳에서만</b> 세운다 (5번)');

  sec('[2]·[3] TA 대본 — <b>여기서 또 안 만들고</b> DB 종류로 고른다');
  const 미션토막 = SRC.slice(SRC.indexOf(' plan:function(P){'), SRC.indexOf(' call:function(P){'));
  is(/hmTaHtml\(/.test(미션토막), 'hmTaHtml <b>하나</b>를 부른다 — 대본을 여기서 또 안 짰다 (5번)');
  is(/hmSrcOf\(/.test(미션토막), '머리에 그 분 <b>DB 종류</b>를 적는다 (hmSrcOf)');
  is(/hmFoldWrap\('msta'/.test(미션토막), '<b>접이</b>로 둔다 — 사장님 「클릭하면 펼쳐지고」');
  is(!/TA_SRC|taSay\(/.test(미션토막), '대본 표(TA_SRC)를 여기서 직접 안 읽는다 — 묻는 곳은 하나 (5번)');

  sec('[5]·[6] 며칠째 · 몇 명 — <b>서버를 새로 안 부른다</b> (7번)');
  const 경고토막 = SRC.slice(SRC.indexOf('var HM_MS_WARN_MAX='), SRC.indexOf('function hmMsSub(){'));
  is(!/\.from\(|fetch\(|osClient\(/.test(경고토막),
     '이 토막에 <b>서버를 부르는 줄이 한 줄도 없다</b>');
  is(/localStorage\.getItem\('apex_ck_day_/.test(경고토막),
     '며칠째는 <b>이 기기 체크판</b>에서 센다');
  is(/GB\.loaded/.test(경고토막),
     '팀 수는 <b>이미 받아 둔 판(GB)</b>이 있을 때만 센다');
  is(/return null/.test(경고토막.slice(경고토막.indexOf('function hmMsWarnTeam'))),
     '안 받아 두었으면 <b>null</b> — 「0명」 이라고 안 적는다 (1번)');

  sec('[7]·[9] 하루 거른 것으로는 안 나무라고, <b>모르는 날은 안 센다</b>');
  const W = await page.evaluate(() => {
    const base = ckNow();
    const d = (n) => new Date(base.getTime() - n * 86400000).toISOString().slice(0, 10);
    const put = (n, done) => localStorage.setItem('apex_ck_day_' + d(n),
      JSON.stringify(done ? { [HM_MS[0].ck]: 1 } : {}));
    const wipe = () => { for (let i = 1; i <= 20; i++) localStorage.removeItem('apex_ck_day_' + d(i)); };
    const out = {};
    wipe(); out.기록없음 = hmMsWarnDays();
    wipe(); put(1, false); out.하루 = hmMsWarnDays(); out.하루글 = hmMsWarnTxt();
    wipe(); put(1, false); put(2, false); put(3, false); out.사흘 = hmMsWarnDays();
    out.사흘글 = hmMsWarnTxt();
    wipe(); put(1, false); put(2, true); out.어제만 = hmMsWarnDays();
    wipe();
    return out;
  });
  is(W.기록없음 === 0, '기록이 아예 없으면 <b>0일</b> — 처음 쓰시는 분께 첫날부터 안 나무란다');
  is(W.하루 === 1 && !W.하루글, '하루 걸렀을 땐 <b>아무 말도 안 한다</b>');
  is(W.사흘 === 3 && /3일째/.test(W.사흘글), '사흘 걸렀으면 <b>「3일째」</b> 라고 말한다 — 「' + W.사흘글.replace(/<[^>]+>/g, '') + '」');
  is(W.어제만 === 1, '중간에 하신 날이 있으면 <b>거기서 멈춘다</b> — ' + W.어제만 + '일');

  sec('[8] <b>접어 두어도 경고가 보인다</b>');
  const H = await page.evaluate(() => {
    const base = ckNow();
    const d = (n) => new Date(base.getTime() - n * 86400000).toISOString().slice(0, 10);
    for (let i = 1; i <= 4; i++) localStorage.setItem('apex_ck_day_' + d(i), '{}');
    const sub = hmMsSub();
    const card = hmMsHtml();
    for (let i = 1; i <= 4; i++) localStorage.removeItem('apex_ck_day_' + d(i));
    return { 머리: sub, 칸: /hm-ms-wr/.test(card) };
  });
  is(/4일째/.test(H.머리), '접이 <b>머리글</b>에 적힌다 — 「' + H.머리.slice(0, 48) + '…」');
  is(!/</.test(H.머리), '머리글에 <b>날글(태그)을 안 넣는다</b> — osEsc 를 지나는 자리입니다 (0-1번)');
  is(H.칸, '펴면 칸 <b>맨 위</b>에도 선다');

  sec('[4] 접힌 채로 서서 <b>한 화면을 안 넘는다</b>');
  const F = await page.evaluate(() => {
    const f = document.getElementById('hmFold_ms');
    return { 폈나: f ? f.classList.contains('on') : null,
             키: f ? Math.round(f.getBoundingClientRect().height) : -1 };
  });
  is(F.폈나 === false, '처음에는 <b>접혀</b> 있다');
  is(F.키 > 0 && F.키 <= 120, '접힌 키가 <b>120px 아래</b>다 — ' + F.키 + 'px');

  sec('[10] 화면이 안 터진다');
  is(errs.length === 0, '터진 것 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데가 걸렸습니다.')
                  : '아침 미션이 위에 서고, 대본이 DB 종류로 뜨고, 며칠째인지 말해 줍니다.');
  process.exit(bad ? 1 : 0);
})();
