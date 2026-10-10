/* 🥊 <b>거절 근육 훈련</b> — 거절에 익숙해지는 교육과 프로그램 (2026-10-07)

   사장님 말씀 — 「(보험저널TV 「절대 물러서지 않는 거절처리의 원리와 비밀」)
   이걸 토대로 고객의 거절에 익숙해지는 교육과 프로그램을 만들어줘」

   못 박는 것 —
     ① 메뉴에 서고 go('rej_gym') 이 그 한 파일(reject-gym.html)을 띄운다
     ② 바탕 강의를 <b>제목·채널·주소 그대로</b> 밝힌다 (9번) · 영상에 없는
        2편(구체 스킬)을 지어 적지 않는다
     ③ 역할극 멘트는 <b>apex-stage.js 한 곳</b>에서 온다 — 거절처리 표의 글을
        이 파일에 옮겨 적지 않았다 (5번). 표를 못 읽으면 <b>지어내지 않고</b>
        못 읽었다고 말한다 (1번)
     ④ 서버를 부르지 않는다 (7번) · 저장은 이 기기에만, try 로 감싼다
     ⑤ 하루가 채워지는 셈이 맞다 — 마음 공부 · 과정 목표 · 연습 셋. 과정 목표를
        안 적었으면 「지켰다」 를 못 누른다(무엇을 지켰는지 모르므로 · 1번)
     ⑥ 거절 일기는 「다시 해석」 없이는 안 적힌다 — 그것이 이 칸의 몫이다
     ⑦ 막혔던 거절이 더 자주 나온다                                        */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9137;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml',
  '.png':'image/png', '.webmanifest':'application/manifest+json' };
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const PAGE = fs.readFileSync(path.join(ROOT, 'app/reject-gym.html'), 'utf8');
const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const STAGE = fs.readFileSync(path.join(ROOT, 'apex-stage.js'), 'utf8');
/* 주석을 떼고 본다 — 쪽지 글을 코드로 읽지 않게 */
const CODE = PAGE.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

console.log('\n[1] 메뉴 · 띄우기');
is(/\{id:'rej_gym',[^}]*title:'거절 근육 훈련'/.test(IDX), "TABS 에 rej_gym 이 선다");
is(/\brej_gym:'meet'/.test(IDX), "NAV_WHEN 에 rej_gym 이 있다(고객 만나기)");
is(/else if\(tab==='rej_gym'\)dyn\.innerHTML=renderRejGymPage\(\);/.test(IDX), "go() 가 renderRejGymPage 로 그린다");
is(/function renderRejGymPage\(\)[\s\S]{0,900}src="reject-gym\.html"/.test(IDX), "그 화면이 reject-gym.html 을 띄운다");

console.log('\n[2] 바탕 강의를 밝히나 (9번)');
is(PAGE.indexOf('https://www.youtube.com/watch?v=CO56FQ4JE_A') >= 0, '영상 주소를 그대로 적었다');
is(PAGE.indexOf('절대 물러서지 않는 거절처리의 원리와 비밀') >= 0 && PAGE.indexOf('보험저널TV') >= 0, '제목과 채널을 그대로 적었다');
is(/2편/.test(PAGE) && /이 영상에는 없습니다|이 영상에 <b>없습니다/.test(PAGE), '2편(구체 스킬)은 이 영상에 없다고 밝힌다 — 지어 적지 않는다');

console.log('\n[3] 멘트는 apex-stage.js 한 곳에서 (5번)');
is(/<script src="\.\.\/apex-stage\.js"><\/script>/.test(PAGE), 'apex-stage.js 를 읽는다');
is(/APEX_STAGE\.objList\(\)/.test(CODE), 'APEX_STAGE.objList() 로 표를 받는다');
/* 표의 멘트 글 앞 24자가 이 파일에 하나라도 있으면 옮겨 적은 것 */
const texts = (STAGE.match(/text:'([^']{24,})/g) || []).map(s => s.slice(6, 30));
is(texts.length >= 10, '견줄 멘트를 표에서 읽었다 (' + texts.length + '개)');
const copied = texts.filter(t => PAGE.indexOf(t) >= 0);
is(copied.length === 0, '표의 멘트를 옮겨 적지 않았다' + (copied.length ? ' ← ' + copied.join(' / ') : ''));

console.log('\n[4] 서버를 안 부르고, 저장은 감싼다 (7번 · 3번)');
is(!/\bfetch\s*\(|XMLHttpRequest|supabase|\/\.netlify\//i.test(CODE), '서버를 부르는 줄이 없다');
const lsLines = CODE.split('\n').filter(l => /localStorage\./.test(l));
is(lsLines.length > 0 && lsLines.every(l => /try\s*\{/.test(l)), 'localStorage 를 쓰는 줄마다 try 로 감쌌다 (' + lsLines.length + '줄)');
is(!/tnum/.test(PAGE), '숫자 글꼴 tnum 을 안 켠다 (4-1번)');
is(!/id="rgDy(Name|Cust)|placeholder="[^"]*(고객명|성함)/.test(PAGE), '거절 일기에 고객 이름 칸이 없다 (3번)');

const srv = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end(''); return; }
  s.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(s);
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
      ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    const U = 'http://127.0.0.1:' + PORT + '/app/reject-gym.html';
    await p.goto(U, { waitUntil: 'load' });
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.reload({ waitUntil: 'load' });

    console.log('\n[5] 교육 칸');
    is(await p.$$eval('#rgQuiz .rg-log', a => a.length) === 6, '스스로 점검 여섯 문제가 선다');
    await p.click('#rgQuiz .rg-log:nth-child(3) .rg-ox button:first-child');
    is(/맞습니다/.test(await p.textContent('#rgQuiz .rg-log:nth-child(3)')), 'O 를 누르면 바로 까닭이 나온다');

    console.log('\n[6] 거절 연습 — 표에서 온 말인가');
    await p.click('#rgTabs button[data-t="drill"]');
    const cur = await p.evaluate(() => DR.cur && DR.cur.title);
    const titles = await p.evaluate(() => APEX_STAGE.objList().map(o => o.title));
    is(!!cur && titles.indexOf(cur) >= 0, '고객의 말이 거절처리 표에 있는 것이다 — 「' + cur + '」');
    await p.click('text=멘트 펴기');
    const shown = await p.textContent('#rgDrill .rg-ans');
    const want = await p.evaluate(() => APEX_STAGE.objFill(DR.cur.text, '○○○'));
    is(shown === want, '편 멘트가 표의 글과 한 글자도 안 다르다');
    is(/하지 말 말/.test(await p.textContent('#rgDrill')) && /여기서 멈춘다/.test(await p.textContent('#rgDrill')),
      '금지 표현과 멈출 자리를 같이 보여 준다');
    /* 하나를 계속 막히면 그것이 더 자주 나와야 한다 */
    const weakT = titles[0];
    await p.evaluate(t => { RG.stat = {}; RG.stat[t] = { ok: 0, ng: 8 }; }, weakT);
    const hits = await p.evaluate(t => { let n = 0; for (let i = 0; i < 2000; i++) { DR.cur = null; if (rgPick().title === t) n++; } return n; }, weakT);
    const even = 2000 / titles.length;
    is(hits > even * 3, '막혔던 거절이 더 자주 나온다 (' + hits + '/2000 · 고르게면 ' + Math.round(even) + ')');
    await p.evaluate(() => { RG.stat = {}; rgSave(); rgDrillNext(); });
    for (let i = 0; i < 3; i++) { await p.click('text=멘트 펴기'); await p.click('text=막힘없이 말했다'); }
    is(await p.evaluate(() => rgTodayRec().drill) === 3, '세 번 매기면 오늘 연습이 3 이다');

    console.log('\n[7] 10일 프로그램 — 하루가 채워지는 셈');
    await p.click('#rgTabs button[data-t="prog"]');
    let alerted = '';
    p.once('dialog', d => { alerted = d.message(); d.dismiss(); });
    await p.click('#rgToday input[onchange*="proc"]');
    await p.waitForTimeout(100);
    is(/과정 목표를 먼저/.test(alerted) && !(await p.evaluate(() => rgTodayRec().proc)),
      '과정 목표를 안 적었으면 「지켰다」 가 안 눌린다');
    await p.click('#rgTabs button[data-t="goal"]');
    await p.fill('#rgGoalProc', '하루 전화 20통');
    await p.click('#rgGoalSave');
    await p.click('#rgTabs button[data-t="prog"]');
    is(/하루 전화 20통/.test(await p.textContent('#rgToday')), '적은 과정 목표를 그날 칸이 그대로 묻는다');
    await p.click('#rgToday input[onchange*="lesson"]');
    is(await p.textContent('#rgStDone') === '0', '셋 중 둘만 하면 아직 안 채워진다');
    await p.click('#rgToday input[onchange*="proc"]');
    is(await p.textContent('#rgStDone') === '1' && await p.textContent('#rgStStreak') === '1', '셋을 다 하면 채운 날 1 · 연속 1');
    is(await p.evaluate(() => !rgDayDone({ lesson: 1, proc: 1, drill: 2 }) && rgDayDone({ lesson: 1, proc: 1, drill: 3 })),
      '연습이 세 번에 못 미치면 마음 공부·과정 목표를 해도 안 채워진다');
    /* 어제를 채워 두면 연속 2, 그제를 비우면 거기서 끊긴다 */
    const st = await p.evaluate(() => {
      const d = new Date(); d.setDate(d.getDate() - 1); RG.days[rgDay(d)] = { lesson: 1, proc: 1, drill: 3, idx: 0 };
      d.setDate(d.getDate() - 2); RG.days[rgDay(d)] = { lesson: 1, proc: 1, drill: 3, idx: 0 };
      return rgStreak();
    });
    is(st === 2, '연속은 빈 날에서 끊긴다 (오늘·어제 → 2)');
    const st2 = await p.evaluate(() => { const k = rgToday(); const r = RG.days[k]; RG.days[k] = { lesson: 0, proc: 0, drill: 0, idx: -1 }; const n = rgStreak(); RG.days[k] = r; return n; });
    is(st2 === 1, '오늘이 아직 안 채워졌어도 어제까지의 연속은 살아 있다');

    console.log('\n[8] 거절 일기');
    await p.click('#rgTabs button[data-t="diary"]');
    await p.fill('#rgDyWhat', '생각해 볼게요');
    await p.click('#rgDySave');
    is(/다시 해석하면/.test(await p.textContent('#rgDyMsg')) && await p.evaluate(() => RG.diary.length) === 0,
      '「다시 해석」 을 안 고르면 안 적힌다');
    await p.click('#rgDyRe .rg-chip:last-child');
    await p.click('#rgDyNext .rg-chip:first-child');
    await p.click('#rgDySave');
    is(await p.evaluate(() => RG.diary.length) === 1, '고르면 적힌다');
    await p.reload({ waitUntil: 'load' });
    is(await p.evaluate(() => RG.diary.length === 1 && rgTodayRec().drill === 3 && RG.goal.proc === '하루 전화 20통'),
      '다시 열어도 일기·연습·목표가 남아 있다 (이 기기)');

    is(errs.length === 0, '스크립트 오류 0' + (errs.length ? ' ← ' + errs.slice(0, 3).join(' | ') : ''));

    console.log('\n[9] 표를 못 읽으면 지어내지 않나 (1번)');
    const ctx2 = await b.newContext();
    await ctx2.route('**/apex-stage.js', r => r.fulfill({ status: 404, body: '' }));
    await ctx2.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
      ? r.fallback() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const p2 = await ctx2.newPage();
    const e2 = []; p2.on('pageerror', e => e2.push(e.message));
    await p2.goto(U + '?t=drill', { waitUntil: 'load' });
    const t2 = await p2.textContent('#rgDrill');
    is(/읽지 못했습니다/.test(t2) && !/rg-cust/.test(await p2.innerHTML('#rgDrill')), '표가 없으면 고객 말을 세우지 않고 못 읽었다고 적는다');
    is(e2.length === 0, '그때도 오류가 안 난다' + (e2.length ? ' ← ' + e2[0] : ''));

    console.log('\n[10] 본체에서 열리나');
    const STUB = fs.readFileSync(path.join(ROOT, 'scripts/smoke.js'), 'utf8').split('const STUB = `')[1].split('`;')[0];
    const ctx3 = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx3.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
      ? r.continue() : r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    const p3 = await ctx3.newPage();
    const e3 = []; p3.on('pageerror', e => e3.push(e.message));
    await p3.addInitScript(STUB);
    await p3.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p3.waitForTimeout(2500);
    await p3.evaluate(() => { document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
      OS.profile = { id: 's', name: '점검', role: 'owner', plan: 'vip' }; OS.session = { user: { id: 's' } }; window.toast = function () {}; });
    await p3.evaluate(() => go('rej_gym'));
    await p3.waitForTimeout(400);
    const fr = await p3.$('#dynPane iframe[src="reject-gym.html"]');
    is(!!fr, "go('rej_gym') 이 #dynPane 에 그 화면을 띄운다");
    const nv = await p3.evaluate(() => typeof navItemOf === 'function' ? !!navItemOf('rej_gym') : null);
    is(nv !== false, '메뉴 찾기(navItemOf)가 그 화면을 안다');
    if (fr) {
      const f = await fr.contentFrame(); await f.waitForSelector('#rgQuiz .rg-log', { timeout: 15000 });
      is(true, '띄운 화면 안이 실제로 그려진다');
    }
  } finally { await b.close(); srv.close(); }
  console.log(bad ? '\n✗ 거절 근육 훈련 — 고칠 자리 ' + bad + '곳' : '\n✓ 거절 근육 훈련 — 모두 통과');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
