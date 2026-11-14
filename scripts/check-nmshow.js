/* 👤 <b>고객 이름이 가려져서 못 알아보는 자리</b> — 판 X436

   사장님 말씀 (2026-11-14) — 「고객의 이름 각자 개인별로 보여주지만
   <b>* 이렇게 가리는 게 없도록 해. 검색하고 알아보는 데 어려움이 커</b> 해결해」.

   ── 재어 보니 ───────────────────────────────────────────────────
   판 X399 (2026-11-09) 에 <b>홈은 실명이 기본</b>이 되었고, 맨 위 띠의
   「🙈 이름 가리기」 하나로 가리기로 했습니다. 그런데 <b>그 스위치를 안 보는
   자리</b>가 남아 있었습니다 —
     · 달력 칸의 약속 칩 — <b>늘</b> 가려져 있었습니다 (osMaskName 직접 호출)
     · 「지금 이 분께」 줄 — 같은 까닭
   사장님은 약속에 <b>누가 있는지</b>를 그 칸에서 보십니다. 늘 「홍○동」 이면
   검색도 식별도 안 됩니다.

   ── 이 자가 지키는 것 ─────────────────────────────────────────
     1. ★★ <b>가릴지 묻는 곳이 하나</b>다 (5번) — hmNmHidden / hmFullNm.
        화면에 찍는 자리가 osMaskName 을 <b>직접</b> 부르지 않는다
     2. ★ 가리기를 <b>껐을 때</b>(기본) 달력 칩에 실명이 선다
     3. ★ 가리기를 <b>켜면</b> 그 자리도 같이 가려진다 — 고객 앞에서
     4. ★★ <b>나가는 자리는 안 바뀐다</b> (3번) — 폰 달력으로 실려 가는
        이름(mcalOutName)은 그대로 가림이 기본이고, 서버에 담는 이름
        (name_masked)·AI 로 보내는 이름(bjMaskForSave)도 그대로다
     5. ★ 스위치는 <b>이 브라우저에만</b> 남는다 (3번)

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
  await page.waitForTimeout(2600);
  await page.evaluate(() => {
    window.toast = function () {};
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    OS.profile = { id: 'me', name: '윤시현', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'me' } };
  });

  const SRC = fs.readFileSync('app/index.html', 'utf8');

  sec('[1] ★★ 가릴지 묻는 곳이 <b>하나</b>다 (5번)');
  /* 화면에 찍는 두 자리가 osMaskName 을 직접 안 부르는지 — 줄로 집어 봅니다 */
  const 칩줄 = (SRC.match(/var wt=mcalWhoTag\([^\n]*\n?/) || [''])[0];
  is(/hmFullNm\(/.test(칩줄) && !/osMaskName\(/.test(칩줄),
     '달력 약속 칩이 <b>hmFullNm</b> 을 부른다 — 「' + 칩줄.trim().slice(0, 70) + '…」');
  const 지금줄 = (SRC.match(/var who=nm\?[^\n]*\n?/) || [''])[0];
  is(/hmFullNm\(/.test(지금줄) && !/osMaskName\(/.test(지금줄),
     '「지금 이 분께」 줄이 <b>hmFullNm</b> 을 부른다');
  is(/function hmNmHidden\(\)/.test(SRC) && /apex_hm_hidenm/.test(SRC),
     '스위치는 <b>hmNmHidden 하나</b>다 (apex_hm_hidenm)');

  sec('[2]·[3] 껐을 땐 실명 · 켜면 같이 가려진다');
  const N = await page.evaluate(() => {
    const out = {};
    try { localStorage.removeItem('apex_hm_hidenm'); } catch (e) {}
    out.기본 = hmFullNm('홍길동');
    out.숨김꺼짐 = hmNmHidden();
    try { localStorage.setItem('apex_hm_hidenm', '1'); } catch (e) {}
    out.켠뒤 = hmFullNm('홍길동');
    out.숨김켜짐 = hmNmHidden();
    try { localStorage.removeItem('apex_hm_hidenm'); } catch (e) {}
    return out;
  });
  is(N.숨김꺼짐 === false && N.기본 === '홍길동',
     '기본은 <b>실명</b>이다 — 「' + N.기본 + '」 (판 X399 사장님 결정)');
  /* ⚠ 가리는 글자는 <b>*</b> 입니다 — 사장님이 「이렇게 가리는 게 없도록」 하신 그 글자.
     처음에 ○ 를 찾다가 멀쩡한 자리를 고발했습니다 (8번). */
  is(N.숨김켜짐 === true && N.켠뒤 !== '홍길동' && /[*○]/.test(N.켠뒤),
     '🙈 를 누르면 <b>같이 가려진다</b> — 「' + N.켠뒤 + '」 (고객 앞에서)');

  sec('[4] ★★ <b>나가는 자리는 안 바뀐다</b> (3번)');
  /* 폰 달력으로 나가는 이름 — 기본이 가림이어야 합니다 */
  const O = await page.evaluate(() => {
    const c = { name_masked: '', customer_name: '홍길동', name: '홍길동' };
    let d = null; try { d = mcalCfg(); } catch (e) {}
    let v = ''; try { v = mcalOutName(c); } catch (e) { v = 'ERR'; }
    return { real기본: d ? !!d.real : null, 나가는이름: v };
  });
  is(O.real기본 === false, '폰 달력에 실명을 싣는 설정이 <b>꺼짐이 기본</b>이다');
  is(O.나가는이름 !== '홍길동' && /[*○]/.test(O.나가는이름),
     '폰 달력으로 나가는 이름은 <b>가려져</b> 있다 — 「' + O.나가는이름 + '」');
  is(/name_masked:\s*\(typeof osMaskName/.test(SRC),
     '서버에 담는 이름은 <b>그대로 가린다</b> (name_masked)');
  is(/function bjMaskForSave/.test(SRC) && /osMaskName\(nm\)/.test(SRC),
     'AI 로 보내는 글의 이름도 <b>그대로 가린다</b>');

  sec('[4-1] ★★ <b>실명을 찍는 화면에는 가릴 단추가 선다</b> (판 X437 · 6번)');
  /* ⚠ 2026-11-14 — 판 X436 에서 도구 화면이 실명을 찍기 시작했는데, 그 화면에는
     「🙈 이름 가리기」 가 <b>안 섰습니다</b>. 즉 고객 앞에서 가릴 길이 없었습니다.
     CLAUDE.md 6번이 적어 둔 바로 그 자리입니다 — 「다 됐다」 로 보이는 상태에서
     고칠 단추를 감추지 않는다. check-toolspage 가 「늘 가린다」 로 울어 드러났습니다. */
  is(/var HM_NM_TABS=\{/.test(SRC) && /HM_NM_TABS\[tab\]/.test(SRC),
     '단추가 <b>어디에 서는지 묻는 곳이 하나</b>다 (HM_NM_TABS · 5번)');
  const B = await page.evaluate(async () => {
    const out = {};
    for (const t of ['home', 'tools', 'clients']) {
      try { go(t); } catch (e) {}
      await new Promise(z => setTimeout(z, 600));
      const b = document.getElementById('hmNmBtn');
      out[t] = !!(b && b.offsetParent);
    }
    return out;
  });
  is(B.home === true, '  <b>오늘</b> 화면에 선다');
  is(B.tools === true, '  <b>도구</b> 화면에 선다 — 거기서도 실명을 찍기 때문입니다');
  is(B.clients === false,
     '  실명을 안 찍는 화면에는 <b>안 선다</b> — 할 일이 없는 단추는 감춥니다 (6번)');

  sec('[5] 스위치는 <b>이 브라우저에만</b> 남는다 (3번)');
  const SW = SRC.slice(SRC.indexOf('function hmNmHidden()'), SRC.indexOf('function hmNmBtnSync'));
  is(!/\.from\(|insert\(|upsert\(|fetch\(/.test(SW),
     '스위치를 <b>서버에 안 올린다</b> — 이 기기에만 남습니다');

  sec('[6] 화면이 안 터진다');
  is(errs.length === 0, '터진 것 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데가 걸렸습니다.')
                  : '화면에서는 실명으로 알아보시고, 나가는 자리는 그대로 가립니다.');
  process.exit(bad ? 1 : 0);
})();
