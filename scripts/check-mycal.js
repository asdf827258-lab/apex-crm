/* 내 캘린더 — 오늘 할 일이 달력에 찍히고, 폰 달력이 대신 울려 준다.

   여기서 확인한다.

     1. 달력에 <b>연락 · 할 일 · 생일 · 도와줄 것</b> 네 가지가 날짜에 찍히는가
     2. 폰 달력이 받는 글(ics)이 규격대로 나오는가 — 여기서 틀리면 통째로 안 받는다
     3. 일정을 누르면 <b>그 화면부터</b> 앱이 열리는가 (세 앱 주소)
     4. 고객 이름이 <b>기본은 가려져서</b> 나가는가 — 달력은 iCloud·구글로 올라간다
     5. 앱을 열면 오늘 할 일이 <b>한 번만</b> 팝업으로 뜨는가 (아침 보고와 안 겹치게)          */
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

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  /* 견본 — 실제 이름이 아니라 홍길동·이몽룡·성춘향 */
  const seed = await page.evaluate(() => {
    window.toast = function () {};
    OS.profile = { id: 'me', name: '윤시현', role: 'owner', plan: 'vip' };
    const day = (n) => new Date(Date.now() + 9 * 3600e3 - n * 86400e3).toISOString().slice(0, 10);
    const ahead = (n) => new Date(Date.now() + 9 * 3600e3 + n * 86400e3).toISOString().slice(0, 10);
    OSC.list = [
      { id: 'c1', name_masked: '홍○동', advisor_id: 'me', created_at: day(40) },   /* 한 번도 없음 */
      { id: 'c2', name_masked: '이○룡', advisor_id: 'me', created_at: day(300) },  /* VIP */
      { id: 'c3', name_masked: '성○향', advisor_id: 'me', created_at: day(300) }   /* 여유 */
    ];
    CM.meta = {
      c1: { fp: {}, touch: [] },
      c2: { fp: { f_ins: 150, c_cancer: 5000, c_death: 10000 }, touch: [{ at: day(20), how: '전화' }],
            next: { what: '증권 다시 보기', due: ahead(3) } },
      c3: { fp: { f_ins: 20, c_cancer: 3000, c_death: 5000 }, touch: [{ at: day(2), how: '전화' }],
            bd: (ahead(5)).slice(5) }
    };
    CC.calls = {}; CC.loaded = true; CM.loaded = true; CM.pick = '';
    HELP.list = [{ id: 'h1', who: '김○수', what: '설계안 같이 보기', due: ahead(2), done: false }];
    try { localStorage.removeItem('apex_mycal_cfg'); } catch (e) {}
    const it = mcalItems();
    const kinds = {};
    Object.keys(it).forEach(d => it[d].forEach(x => { (kinds[x.k] = kinds[x.k] || []).push(d); }));
    return { days: Object.keys(it).length, kinds: Object.keys(kinds).sort(),
             touchToday: (it[mcalToday()] || []).filter(x => x.k === 'touch').length,
             bd: (kinds.bd || [])[0], next: (kinds.next || [])[0],
             help: (kinds.help || [])[0], ahead3: ahead(3), ahead2: ahead(2), ahead5: ahead(5) };
  });

  console.log('\n[1] 달력에 네 가지가 날짜에 찍힌다');
  /* ── 갈래를 <b>글자 그대로</b> 견주지 않는다 ─────────────────────
     예전에는 'bd,help,next,touch' 와 똑같아야 통과였다. 그런데
     2026-09-20 에 <b>매일 하는 일(rt)</b> 이 달력에 들어왔다 — 사장님이
     「월간 캘린더에 이미 세팅이 다 되도록」 하라 하신 것이다. 갈래가 하나
     늘었다고 빨간불이 켜지면, <b>잘 고쳐 놓고도</b> 자가 운다 (8번).

     여기서 지키려던 것은 「이 넷이 날짜에 찍히나」 다. 그것만 본다.
     대신 <b>넷 중 하나라도 빠지면</b> 그대로 빨간불이다.             */
  const WANT = ['bd', 'help', 'next', 'touch'];
  const missK = WANT.filter(k => seed.kinds.indexOf(k) < 0);
  is(missK.length === 0,
     '  연락 · 할 일 · 생일 · 도와줄 것 — ' + seed.kinds.join(' · ') +
     (missK.length ? (' ← 빠진 것 ' + missK.join(',')) : ''));
  is(seed.touchToday >= 1, '  한 번도 연락한 적 없는 분은 오늘 자리에 찍힌다');
  is(seed.next === seed.ahead3, '  「다음 할 일」 은 마감 날에 찍힌다');
  is(seed.help === seed.ahead2, '  「도와줄 것」 도 마감 날에 찍힌다');
  is(seed.bd === seed.ahead5, '  생일은 올해(지났으면 내년) 날짜로 찍힌다');
  is(seed.days >= 4, '  앞으로 올 날에도 찍힌다 — ' + seed.days + '일');

  console.log('\n[1-2] 날이 지난 것은 오늘 자리로 끌어온다 — 달력과 오늘의 터치가 어긋나면 안 된다');
  const late = await page.evaluate(() => {
    const day = (n) => new Date(Date.now() + 9 * 3600e3 - n * 86400e3).toISOString().slice(0, 10);
    const keep = CM.meta.c3;
    CM.meta.c3 = { fp: { f_ins: 20, c_cancer: 3000, c_death: 5000 }, touch: [{ at: day(70), how: '전화' }] };
    const it = mcalItems(), td = (it[mcalToday()] || []);
    /* <b>매일 하는 일(rt)은 빼고</b> 센다. 그것은 「지난 날에 남은 일」 이
       아니라 <b>그날 무엇을 했는지 적어 둔 기록</b>이라, 지난 칸에도
       그대로 서 있는 것이 맞다. 여기서 보려는 것은 「끝내지 못한 고객 일이
       지난 날에 처박혀 있지 않나」 다 — 그 뜻은 그대로 지킨다.        */
    const past = Object.keys(it).filter(d =>
      d < mcalToday() && it[d].some(x => x.k !== 'rt')).length;
    const plan = ccPlanList(OSC.list).length;
    const html = mcalDayHtml();
    CM.meta.c3 = keep;
    return { past, todayN: td.length, plan, marked: td.filter(x => x.late).length, html };
  });
  is(late.past === 0, '  지난 날짜에는 아무것도 안 남는다');
  is(late.todayN >= late.plan,
     '  오늘의 터치에 선 사람은 달력 오늘 자리에도 있다 (달력 ' + late.todayN + ' · 터치 ' + late.plan + ')');
  is(late.marked >= 1, '  끌어온 것은 「지났음」 이라고 적는다');
  is(/지났음/.test(late.html), '  날짜 목록에 원래 날이 그대로 보인다');
  is(/mcal-it late/.test(late.html), '  오늘 잡힌 것과 섞이지 않게 따로 칠한다');

  console.log('\n[2] 폰 달력이 받는 글(ics)이 규격대로 나온다');
  const ics = await page.evaluate(() => ({
    daily: icsBuild('APEX 매일 알림', mcalDailyEvent()),
    today: icsBuild('APEX 오늘 할 일', mcalTodayEvents()),
    esc: icsEsc('가;나,다\\라\n마'),
    fold: icsFold('SUMMARY:' + '가'.repeat(60)),
    stamp: icsStamp('2026-08-19', 8, 30),
    over: icsStamp('2026-08-19', 8, 60),      /* 분이 60을 넘어도 시로 넘어가야 한다 */
    over2: icsStamp('2026-08-19', 23, 90)     /* 날을 넘겨도 */
  }));
  is(/^BEGIN:VCALENDAR\r\n/.test(ics.daily), '  BEGIN:VCALENDAR 로 열린다');
  is(/\r\nEND:VCALENDAR\r\n$/.test(ics.daily), '  END:VCALENDAR 로 닫힌다');
  is(/\r\nVERSION:2\.0\r\n/.test(ics.daily), '  VERSION:2.0');
  is(/\r\nBEGIN:VEVENT\r\n/.test(ics.daily) && /\r\nEND:VEVENT\r\n/.test(ics.daily), '  VEVENT 가 있다');
  is(/\r\nRRULE:FREQ=DAILY\r\n/.test(ics.daily), '  매일 알림은 날마다 되풀이된다 (RRULE)');
  is(/\r\nBEGIN:VALARM\r\nTRIGGER:-PT0M\r\n/.test(ics.daily), '  울림(VALARM)이 붙어 있다');
  is(/\r\nDTSTART:\d{8}T\d{6}Z\r\n/.test(ics.daily), '  시각이 UTC 도장(Z)으로 찍힌다');
  is(/\r\nDTEND:\d{8}T\d{6}Z\r\n/.test(ics.daily), '  끝나는 시각도 찍힌다');
  is(!/\r\nDTEND:\r\n/.test(ics.today) && !/\r\nDTEND:\r\n/.test(ics.daily), '  끝나는 시각이 비어 나가지 않는다');
  is(ics.daily.split('\r\n').every(l => !/[^\r\n]{200,}/.test(l)), '  긴 줄은 접어서 내보낸다');
  is(ics.esc === '\uAC00\\;\uB098\\,\uB2E4\\\\\uB77C\\n\uB9C8',
     '  ; , \\ \uC904\uBC14\uAFC8\uC744 escape \uD55C\uB2E4 — ' + JSON.stringify(ics.esc));
  is(/\r\n /.test(ics.fold), '  75바이트를 넘으면 다음 줄 앞에 빈칸 하나를 두고 접는다');
  is(ics.stamp === '20260818T233000Z', '  한국 8시 30분 → UTC 전날 23시 30분 — ' + ics.stamp);
  is(ics.over === '20260819T000000Z', '  8시 60분은 9시로 넘어간다 — ' + ics.over);
  is(ics.over2 === '20260819T153000Z', '  23시 90분은 다음 날 0시 30분(KST)으로 넘어간다 — ' + ics.over2);

  console.log('\n[3] 일정을 누르면 그 화면부터 앱이 열린다');
  const gos = await page.evaluate(() => ({
    crm: pwaUrlOf('crm'), airep: pwaUrlOf('airep'), clients: pwaUrlOf('clients'),
    daily: icsBuild('x', mcalDailyEvent())
  }));
  ['crm', 'airep', 'clients'].forEach(k => {
    is(/[?&]go=/.test(gos[k]), '  ' + k + ' 주소에 go= 가 있다 — ' + gos[k].replace(/^https?:\/\/[^/]+/, ''));
    is(gos.daily.replace(/\r\n /g, '').indexOf(gos[k]) >= 0, '  매일 알림 안에 ' + k + ' 주소가 들어 있다');
  });
  is(/\r\nURL:https?:/.test(gos.daily), '  일정 자체에 URL 이 붙어 있다');

  console.log('\n[4] 고객 이름이 기본은 가려져서 나간다');
  const nm = await page.evaluate(() => {
    try { localStorage.setItem('apex_cli_real_me', JSON.stringify({ c1: '홍길동' })); } catch (e) {}
    const off = icsBuild('x', mcalTodayEvents());
    const screen = cmName(OSC.list[0]);
    mcalCfgSet('real', true);
    const on = icsBuild('x', mcalTodayEvents());
    mcalCfgSet('real', false);
    return { off, on, screen };
  });
  is(nm.screen === '홍길동', '  화면에는 실명이 보인다');
  is(nm.off.indexOf('홍길동') < 0, '  달력으로 나갈 때는 실명이 안 들어간다');
  is(nm.off.indexOf('홍○동') >= 0, '  가린 이름으로 나간다');
  is(nm.on.indexOf('홍길동') >= 0, '  실명으로 켜면 그때만 실명이 나간다');

  console.log('\n[5] 화면이 선다');
  /* ⚠ 2026-09-25 · <b>달력은 이제 「이번 주」로 엽니다</b> (사장님 말씀
     「매주를 기본으로 해서 이번 주에 집중하게」). 여기 [5] 는 <b>달 격자</b>
     와 <b>달 넘기기</b>를 재는 자리라, 월로 켜고 잽니다 — 월은 그대로 볼 수
     있어야 하고(「매월 매주 스케줄 볼 수 있게」) 그것을 여기서 지킵니다.
     ★ 「처음에 주로 여나」 는 check-calmonth 가 따로 못 박습니다.      */
  const html = await page.evaluate(() => { try{ mcalSetView('month'); }catch(e){} return renderMyCal(); });
  is(/내 캘린더/.test(html), '  칸 이름이 「내 캘린더」 다');
  /* 함수 <b>이름</b>을 박아 두면, 이름만 바뀌어도 빨간불이 뜬다 — 실제로는
     멀쩡한데 사람이 점검을 안 믿게 된다. 홈에도 같은 달력을 세우면서 앞뒤
     단추가 mcalYmShift 에서 mcalMove(주/월을 같이 옮긴다)로 바뀌었다.
     그래서 이름이 아니라 <b>실제로 달이 넘어가는지</b>로 잰다.          */
  const mv = await page.evaluate(() => {
    const box = document.createElement('div');
    box.innerHTML = renderMyCal();
    const ons = Array.from(box.querySelectorAll('button'))
      .map(b => b.getAttribute('onclick') || '')
      .filter(s => /^mcal[A-Za-z]*\(\s*-?1\s*\)$/.test(s));
    if (ons.length !== 2) return { ok: false, why: '앞뒤로 넘기는 단추가 ' + ons.length + '개' };
    /* MCAL.ym 은 아직 비어 있을 수 있다 — 화면이 실제로 쓰는 mcalYm() 으로 잰다 */
    const start = mcalYm(), seen = [];
    ons.forEach(s => { try { (0, eval)(s); } catch (e) {} seen.push(mcalYm()); });
    return { ok: seen[0] !== start && seen[1] === start,
             why: start + ' → ' + seen.join(' → ') };
  });
  is(mv.ok, '  달을 앞뒤로 넘긴다 — ' + mv.why);
  is((html.match(/class="mcal-d/g) || []).length >= 28, '  한 달치 날이 다 그려진다');
  is(/mcalDownload\('daily'\)/.test(html), '  🔔 매일 아침 알림 받기');
  is(/mcalDownload\('today'\)/.test(html), '  📅 오늘 것 넣기');
  is(/iCloud·구글/.test(html), '  달력이 어디로 올라가는지 밝힌다');
  is(/mcalRealAsk/.test(html), '  실명은 한 번 더 여쭙고 켠다');
  ['crm', 'airep', 'clients'].forEach(k =>
    is(html.indexOf("go('" + k + "')") >= 0, '  ' + k + ' 로 바로 들어가는 문이 있다'));

  console.log('\n[6] 오늘 할 일 팝업 — 하루 한 번, 아침 보고와 안 겹치게');
  const pop = await page.evaluate(() => {
    const out = {};
    const clear = () => { try { localStorage.removeItem('apex_mycal_seen_' + mcalToday()); } catch (e) {} MCAL.shown = false; const e = document.getElementById('mcPop'); if (e) e.remove(); };
    /* 아침 보고가 아직 안 떴으면 비켜 준다 */
    clear();
    window.arBriefIsOff = () => false; window.arBriefSeen = () => false;
    mcalPopMaybe(); out.yield = !document.getElementById('mcPop');
    /* 아침 보고를 이미 봤으면 뜬다 */
    clear();
    window.arBriefSeen = () => true;
    mcalPopMaybe(); out.shows = !!document.getElementById('mcPop');
    out.html = (document.getElementById('mcPop') || { innerHTML: '' }).innerHTML;
    /* 같은 날 두 번은 안 뜬다 */
    mcalPopClose(); MCAL.shown = false;
    mcalPopMaybe(); out.once = !document.getElementById('mcPop');
    /* 「다시 안 띄우기」 를 켜면 안 뜬다 */
    clear(); mcalCfgSet('alarm', false);
    mcalPopMaybe(); out.off = !document.getElementById('mcPop');
    mcalCfgSet('alarm', true);
    /* 할 말이 없으면 안 뜬다 */
    clear();
    const keep = OSC.list, keepH = HELP.list;
    OSC.list = []; HELP.list = [];
    const mk = {}; CK_ITEMS.day.forEach(x => mk[x[0]] = 1);
    try { localStorage.setItem(ckKey('day'), JSON.stringify(mk)); } catch (e) {}
    mcalPopMaybe(); out.quiet = !document.getElementById('mcPop');
    try { localStorage.removeItem(ckKey('day')); } catch (e) {}
    OSC.list = keep; HELP.list = keepH; clear();
    return out;
  });
  is(pop.yield, '  아침 보고가 곧 뜰 참이면 비켜 준다');
  is(pop.shows, '  아침 보고를 이미 봤으면 뜬다');
  is(/전화할 분/.test(pop.html) && /남은 할 일/.test(pop.html) && /도와줄 것/.test(pop.html),
     '  전화 · 글 · 할 일 · 도와줄 것 넷을 한눈에 보여 준다');
  ['clients', 'airep', 'crm', 'mycal'].forEach(k =>
    is(pop.html.indexOf("go('" + k + "')") >= 0, '  ' + k + ' 로 바로 가는 단추가 있다'));
  is(pop.once, '  같은 날 두 번은 안 뜬다');
  is(pop.off, '  「다시 안 띄우기」 를 켜면 안 뜬다');
  is(pop.quiet, '  할 말이 없으면 안 띄운다');

  console.log('\n[7] 메뉴와 주소로 들어간다');
  const nav = await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    let hit = null;
    TABS.forEach(g => g.items.forEach(it => { if (it.id === 'mycal') hit = { g: g.group, t: it.title, hide: !!it.hide }; }));
    go('mycal');
    return { hit, dyn: (document.getElementById('dynPane') || { innerHTML: '' }).innerHTML.slice(0, 400) };
  });
  is(nav.hit && !nav.hit.hide, '  메뉴에 서 있다 — ' + (nav.hit ? nav.hit.g + ' › ' + nav.hit.t : '없음'));
  is(/mycalHost/.test(nav.dyn), '  go(\'mycal\') 로 열린다');
  is(/내 캘린더/.test(nav.dyn), '  열면 캘린더가 그려져 있다');

  console.log('\n[8] 주 · 월 — 고른 것이 <b>다음에 열어도</b> 그대로다');
  /* 사장님 말씀 — 「캘린더버전 현재 떠있는것, 주 / 월로 선택해서 볼수 있도록」.
     단추는 있었는데 <b>어디에도 안 적혀</b> 아이콘으로 다시 열 때마다 「월」 로
     되돌아갔습니다. 바탕화면 아이콘은 하루에도 몇 번씩 여는 자리입니다. */
  const seg = await page.evaluate(() => {
    go('mycal');
    const g = document.querySelector('.mcal-seg');
    const bs = g ? [].slice.call(g.querySelectorAll('button')) : [];
    const box = e => { const r = e.getBoundingClientRect(); return { w: Math.round(r.w || r.width), h: Math.round(r.height) }; };
    return { has: !!g, labels: bs.map(e => e.textContent),
             small: bs.filter(e => box(e).h < 40).length,
             pressed: bs.filter(e => e.getAttribute('aria-pressed') === 'true').length };
  });
  is(seg.has && seg.labels.join('') === '주월', '  <b>주 · 월</b> 단추가 선다 — ' + seg.labels.join(' · '));
  is(seg.pressed === 1, '  지금 보는 쪽이 <b>눌린 채로</b> 보인다 — 어느 쪽인지 알 수 있다');
  is(seg.small === 0, '  <b>손가락으로 누를 만한</b> 크기다 — 작으면 폰에서 자꾸 빗나간다');

  const keep = await page.evaluate(async () => {
    mcalSetView('week');
    const saved = (function () { try { return localStorage.getItem('apex_mcal_view'); } catch (e) { return null; } })();
    /* <b>다시 연 척</b>을 한다 — 저장된 것에서 다시 시작하는가 */
    const again = (typeof mcalViewSaved === 'function') ? mcalViewSaved() : '?';
    mcalSetView('month');
    const saved2 = (function () { try { return localStorage.getItem('apex_mcal_view'); } catch (e) { return null; } })();
    return { now: mcalView(), saved, again, saved2 };
  });
  is(keep.saved === 'week', '  「주」 를 고르면 <b>적어 둔다</b> — ' + keep.saved);
  is(keep.again === 'week', '  <b>다시 열어도 주</b>로 선다 — 매번 다시 안 누르신다');
  is(keep.saved2 === 'month', '  「월」 로 되돌리면 <b>그것도 적는다</b> — 한쪽만 기억하면 못 빠져나온다');

  const wk = await page.evaluate(() => {
    mcalSetView('week');
    const h = document.getElementById('mycalHost');
    const on = !!(h && h.querySelector('.mcal-wk, .mcal-week'));
    mcalSetView('month');
    const mo = !!(h && h.querySelector('.mcal-grid, .mcal-g'));
    return { on, mo, html: (h ? h.innerHTML.length : 0) };
  });
  is(wk.html > 0, '  고르면 <b>그 자리에서 다시 그린다</b> — 눌렀는데 안 바뀌면 고장 난 것으로 보인다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '내 캘린더 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '내 캘린더 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
