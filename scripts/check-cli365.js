/* <b>「고객 365일 들어가면 달력에 이번 달 할 일 · 매일 미션이 있어야 하는데
   지금은 설정에 있다」</b>

   달력과 「오늘 챙길 분」 은 <b>고객 관리</b> 이야기인데, 「내 캘린더」 라는
   이름으로 <b>시스템 메뉴</b>(설정·요금제·약관 옆)에 서 있었다. 고객을 보러
   들어온 자리에 없으면 없는 것과 같다.

   여기서 지키는 것
     1. 고객 365일을 열면 <b>오늘의 미션</b>과 <b>이번 달 달력</b>이 맨 위에 선다
     2. 미션은 30일 고객관리가 쓰는 <b>ccBand 그대로</b> 센다 — 따로 세지 않는다
     3. <b>못 세면 아무 말도 안 한다</b> — 「0명」 과 「모름」 은 다르다 (1번)
     4. 달력은 <b>한 벌</b>이다 — 세 곳에서 같은 것을 부른다 (5번)
     5. 날짜를 누르면 <b>실제로 바뀐다</b> — 서 있는 자리를 다시 그린다      */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

/* 견본 사람은 홍길동 (CLAUDE.md 3번) */
const SEED = `
  OS.profile = { id: 'me', role: 'member', name: '윤시현' };
  OSC.view = 'list'; CM.pick = 'me'; CM.picked = true; CM.loaded = true;
  CM.who = { me: '윤시현' };
  const t = mcalToday();
  const ago = (n) => { const d = new Date(t + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - n);
                       return d.toISOString().slice(0, 10); };
  OSC.list = [
    { id: 'k1', advisor_id: 'me', name_masked: '홍○동', created_at: ago(400) + 'T00:00:00Z' },
    { id: 'k2', advisor_id: 'me', name_masked: '홍○순', created_at: ago(400) + 'T00:00:00Z' },
    { id: 'k3', advisor_id: 'me', name_masked: '홍○보', created_at: ago(400) + 'T00:00:00Z' },
    { id: 'k4', advisor_id: 'me', name_masked: '홍○자', created_at: ago(400) + 'T00:00:00Z' }
  ];
  CM.meta = {};
  CC.calls = { k1: ago(90), k2: ago(80), k3: t, k4: ago(1) };
`;

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n[1] 고객이 아직 안 읽혔으면 — 아무 숫자도 안 만든다');
  const A = await page.evaluate(() => {
    OS.profile = { id: 'me', role: 'member' };
    OSC.view = 'list'; OSC.list = [];
    return { m: cliMission(), html: cliMissionHtml() };
  });
  is(A.m === null && !A.html, '  <b>「0명」 이라고 하지 않는다</b> — 칸 자체를 안 세운다 (1번)');

  console.log('\n[2] 오늘의 미션이 이름으로 뜬다');
  const B = await page.evaluate(new Function(SEED + `
    const m = cliMission(), html = cliMissionHtml();
    return { due: m.due.map(x => x.c.name_masked), done: m.done, total: m.total,
             first: m.due[0] ? m.due[0].c.name_masked : '',
             says: /밀린 분 2명|오늘 몫 2명|오늘 챙길 분 2명/.test(html),
             name: html.indexOf('홍○동') >= 0 && html.indexOf('홍○순') >= 0,
             opens: html.indexOf("osOpenClient('k1')") >= 0,
             doneSaid: /오늘 연락한 분 <b>1명<\\/b>/.test(html) };
  `));
  is(B.due.length === 2, '  주기가 지난 분만 미션에 든다 — ' + B.due.join(' · '));
  is(B.first === '홍○동', '  <b>오래 묵은 분이 맨 위</b>로 — 지금 맨 위: ' + B.first);
  is(B.done === 1 && B.doneSaid, '  오늘 이미 연락한 분은 <b>미션에서 빠지고 따로 센다</b>');
  is(B.says && B.name && B.opens, '  화면에 이름이 뜨고 <b>누르면 그 고객 카드</b>가 열린다');

  console.log('\n[2-2] 이번 달 목표를 하루 몫으로 나눈다');
  const B2 = await page.evaluate(new Function(SEED + `
    const raw = localStorage.getItem(CC_CFG_KEY);
    /* ① 목표를 안 정하면 = 맡으신 고객 <b>전원</b> */
    localStorage.removeItem(CC_CFG_KEY);
    const auto = cliMonth();
    /* ② 목표를 2명으로 정하면 그 수로 */
    const c = ccCfg(); c.goal = 2;
    localStorage.setItem(CC_CFG_KEY, JSON.stringify(c));
    const set = cliMonth();
    const setHtml = cliMonthHtml();
    localStorage.removeItem(CC_CFG_KEY);
    const html = cliMissionHtml();
    if (raw) localStorage.setItem(CC_CFG_KEY, raw);
    /* 이번 달에 연락한 사람 수를 <b>시험이 따로</b> 센다 — 오늘이 1일이면
       「어제」 는 지난달이다. 달 경계에 흔들리는 기대값을 쓰면 안 된다. */
    const ym = t.slice(0, 7);
    const expDone = Object.keys(CC.calls)
      .filter(k => (CC.calls[k] || '').slice(0, 7) === ym).length;
    /* 이달에 남은 <b>날 수</b> — 이레가 넘으면 그 안에 주말이 반드시 있다.
       그러니 영업일은 날 수보다 <b>적어야</b> 한다. 앱의 셈을 여기서 그대로
       베껴 견주면 둘 다 틀려도 통과한다 — 성질로 잰다. */
    const y = +t.slice(0, 4), mo = +t.slice(5, 7), dd = +t.slice(8, 10);
    const lastD = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    const daysLeft = lastD - dd + 1;
    return { daysLeft, expDone, autoGoal: auto.goal, total: auto.total, done: auto.done, left: auto.left,
             biz: auto.biz, quota: auto.quota,
             math: auto.quota === Math.ceil(auto.left / auto.biz),
             setGoal: set.goal, setSaid: /이번 달 2명 중/.test(setHtml),
             autoSaid: /맡으신 고객 전원/.test(cliMonthHtml()),
             inMission: /오늘 몫/.test(html) && /남은 영업일/.test(html) };
  `));
  is(B2.autoGoal === B2.total && B2.autoSaid,
     '  목표를 안 정하면 <b>맡으신 고객 전원</b> — ' + B2.autoGoal + '명');
  is(B2.done === B2.expDone && B2.left === B2.autoGoal - B2.done,
     '  이번 달에 이미 연락한 분은 <b>몫에서 뺀다</b> — 한 분 ' + B2.done + '명 · 남은 ' + B2.left + '명');
  is(B2.math && B2.biz >= 1,
     '  <b>남은 사람 ÷ 남은 영업일</b> = 오늘 몫 — ' + B2.left + ' ÷ ' + B2.biz + ' → ' + B2.quota + '명');
  is(B2.daysLeft < 7 || B2.biz < B2.daysLeft,
     '  <b>주말은 빼고</b> 센다 — 남은 날 ' + B2.daysLeft + '일 중 영업일 ' + B2.biz + '일');
  is(B2.setGoal === 2 && B2.setSaid, '  목표를 정하면 <b>그 수</b>로 센다 — 2명');
  is(B2.inMission, '  미션 칸에 <b>오늘 몫</b>이 함께 뜬다');

  console.log('\n[2-3] 몫이 밀린 분보다 많으면 — 다음으로 오래된 분으로 잇는다');
  const B3 = await page.evaluate(new Function(SEED + `
    /* 밀린 분은 하나뿐인데 몫이 더 큰 자리.
       남은 영업일은 달마다 달라 몫이 흔들린다 — 여기서는 <b>1일로 고정</b>해
       「몫이 밀린 분보다 클 때」 만 본다. 영업일 계산 자체는 [2-2] 에서 따로 잰다. */
    CC.calls = { k1: ago(95), k2: ago(3), k3: ago(4), k4: ago(5) };
    const realBiz = window.cliBizLeft; window.cliBizLeft = function(){ return 1; };
    const m = cliMission(), mm = cliMonth(), html = cliMissionHtml();
    window.cliBizLeft = realBiz;
    return { due: m.due.length, rest: m.rest.length, quota: mm.quota,
             shown: (html.match(/osOpenClient/g) || []).length,
             says: /아직 안 밀렸습니다/.test(html) };
  `));
  is(B3.due === 1 && B3.quota > 1, '  밀린 분 ' + B3.due + '명 · 오늘 몫 ' + B3.quota + '명');
  is(B3.shown >= Math.min(B3.quota, 1 + B3.rest),
     '  <b>몫만큼 줄이 선다</b> — ' + B3.shown + '명이 떴다');
  is(B3.says, '  이어 붙인 분에게는 <b>「아직 안 밀렸습니다」</b>라고 적는다 (1번)');

  console.log('\n[3] 다 돌았으면 그렇게 말한다 — 겁주지 않는다 (8번)');
  const C = await page.evaluate(new Function(SEED + `
    CC.calls = { k1: t, k2: t, k3: t, k4: t };
    const m = cliMission(), mm = cliMonth(), html = cliMissionHtml();
    return { due: m.due.length, quota: mm.quota,
             ok: /오늘 챙길 분이 없습니다/.test(html),
             month: /이번 달 몫을 다 채우셨습니다/.test(html) };
  `));
  is(C.due === 0 && C.ok, '  「오늘 챙길 분이 없습니다」 라고 말한다');
  is(C.quota === 0 && C.month, '  이번 달 몫도 <b>다 채웠다</b>고 말한다');

  console.log('\n[4] 이번 달 달력이 고객 365일 맨 위에 선다 — 그리고 한 벌이다');
  const D = await page.evaluate(new Function(SEED + `
    const html = renderClientsPage();
    return { top: html.indexOf('cli365Top') >= 0,
             cal: (html.match(/mcal-hd/g) || []).length,
             mission: html.indexOf('오늘의 미션') >= 0,
             order: html.indexOf('오늘의 미션') < html.indexOf('이번 달 고객 관리'),
             beforeList: html.indexOf('cli365Top') < html.indexOf('oscList'),
             phone: html.indexOf('폰 기본 달력에 넣기') >= 0 };
  `));
  is(D.top && D.cal === 1, '  달력이 <b>한 벌</b> 선다');
  is(D.mission && D.order && D.beforeList, '  미션 → 달력 → 목록 차례로, <b>목록보다 위</b>에');
  is(!D.phone, '  폰 내보내기 칸은 <b>여기 또 안 붙인다</b> — 설정 → 내 캘린더 자리다');

  console.log('\n[5] 날짜를 누르면 실제로 바뀐다');
  const E = await page.evaluate(new Function(SEED + `
    const host = document.createElement('div'); host.id = 'cli365Top';
    document.body.appendChild(host);
    cli365TopPaint();
    const before = host.innerHTML.length;
    /* MCAL.ym 은 비어 있을 수 있다 — 달을 계산해 주는 것은 mcalYm() 이다 */
    const other = mcalYm() + '-15';
    MCAL.sel = ''; mcalPick(other);
    const sel = MCAL.sel;
    const after = host.innerHTML;
    const shows = after.indexOf('15일') >= 0;
    MCAL.sel = ''; host.remove();
    return { sel, shows, before, len: after.length };
  `));
  is(E.sel, '  누른 날이 <b>골라진다</b>');
  is(E.shows, '  그리고 <b>그 자리가 다시 그려진다</b> — 그날 것이 아래에 뜬다');

  console.log('\n[6] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 어긋납니다')
                  : '✓ 고객 365일을 열면 오늘 할 일부터 보입니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
