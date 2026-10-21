/* 🌱 <b>지인 8주 성장 프로그램</b> — 명단 비운 판 (판 X144 · 2026-10-21)

   사장님 말씀 — 「더 디테일 하게 만들고 수정 / 인쇄 / 추가 / 삭제 기능과 고객에게
   보험금 찾아줌 → 그리고 보장분석 받아야 되는 이유를 명확하게 만들어줘 RP를」 ·
   「토스테마로 아이콘 및 분류 수정하고 … 선생님처럼」 · 「앱에 넣게 명단 비운 판으로 PR」

   못 박는 것 —
     ① 메뉴에 서고 go('jiin_grow') 이 그 한 파일(jiin-grow.html)을 띄운다
     ② ★ 명단이 비어서 온다 — 손글씨로 옮긴 실제 고객 명단이 저장소에 한 줄도 없다 (3번).
        견본 명단 · 연결 고리 견본이 비었고, 넣는 길(추가 · 붙여넣기 · 백업 불러오기)은 산다
     ③ 서버를 안 부른다 (7번) · 엑셀 라이브러리 같은 바깥 셈틀을 안 들여온다 · tnum 을 안 켠다
     ④ ★ 인쇄 · CSV 는 이름을 가린 채가 기본 — 끄면 한 번 더 묻는다 (3번)
     ⑤ ★ 찾은 보험금은 원으로 받아 건별 기록 하나에서만 센다 · 모르면 0원이 아니라 「금액 모름」 (1번 · 4번)
     ⑥ ★ 다리 대본 — 찾은 내용 · 단서가 그 고객 기록에서 온다. 기록이 없으면 지어 채우지
        않고 점선 칸으로 무엇을 적을지 말한다 (1번). 둘째 단서 줄은 단서가 둘일 때만 선다
     ⑦ 설계사 이름은 화면에서 받는다 — 비어 있으면 ○○ (지어 넣지 않음)
     ⑧ 편집 — 대사 · 거절 응대를 넣고 · 고치고 · 지우고 · 처음으로 되돌린다
     ⑨ 돈 이름 규약 (4번) — 원을 받는 함수는 …WonR  */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9171;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml',
  '.png':'image/png', '.webmanifest':'application/manifest+json' };
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const PAGE = fs.readFileSync(path.join(ROOT, 'app/jiin-grow.html'), 'utf8');
const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
/* 주석을 떼고 본다 — 쪽지 글을 코드로 읽지 않게 */
const CODE = PAGE.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

console.log('\n[1] 메뉴 · 띄우기');
is(/\{id:'jiin_grow',[^}]*title:'지인 8주 성장 프로그램'/.test(IDX), 'TABS 에 jiin_grow 가 선다');
is(/\bjiin_grow:'meet'/.test(IDX), 'NAV_WHEN 에 jiin_grow 가 있다(고객 만나기)');
is(/var T_SKIN=\{[^}]*\bjiin_grow:1/.test(IDX), 'T_SKIN 에 있다 — 거절 근육 훈련과 같은 옷');
is(/else if\(tab==='jiin_grow'\)dyn\.innerHTML=renderJiinGrowPage\(\);/.test(IDX), 'go() 가 renderJiinGrowPage 로 그린다');
is(/function renderJiinGrowPage\(\)[\s\S]{0,900}src="jiin-grow\.html"/.test(IDX), '그 화면이 jiin-grow.html 을 띄운다');

console.log('\n[2] 명단이 비어서 오나 (3번)');
is(/const SEED=\[\];/.test(CODE), '견본 명단(SEED)이 비었다');
is(/const CLUSTERS=\[\];/.test(CODE), '연결 고리 견본이 비었다 — 이름이 든 묶음을 안 둔다');
is(!/\[\s*\d+\s*,\s*'(계약|가망)'\s*,\s*'[^']+'/.test(CODE), '「번호 · 계약/가망 · 이름」 꼴의 명단 줄이 한 줄도 없다');
is(!/ids:\s*\[\s*\d/.test(CODE), '고객 번호를 묶어 둔 줄이 없다');

console.log('\n[3] 서버 · 바깥 셈틀 (7번 · 4-1번)');
is(!/\bfetch\s*\(|XMLHttpRequest|supabase|\/\.netlify\//i.test(CODE), '서버를 부르는 줄이 없다');
is(!/<script[^>]+src=/i.test(PAGE), '바깥 스크립트를 안 들여온다 (엑셀 라이브러리 없음 — CSV 로만)');
is(!/tnum/.test(PAGE), '숫자 글꼴 tnum 을 안 켠다');

console.log('\n[4] 돈 이름 규약 (4번)');
is(/function fmtWonR\(n\)/.test(CODE) && !/\bwonTxt\b/.test(CODE), '원을 받는 금액 함수가 …WonR 이다');

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
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
      ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    const dialogs = []; p.on('dialog', d => { dialogs.push(d.message()); d.accept(); });
    await p.goto('http://127.0.0.1:' + PORT + '/app/jiin-grow.html', { waitUntil: 'load' });
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.reload({ waitUntil: 'load' });

    console.log('\n[5] 빈 명단으로 서나');
    is(await p.evaluate(() => S.customers.length) === 0, '처음 열면 고객이 0명이다');
    is(/명단이 비어 있어요/.test(await p.textContent('#today')), '홈이 「명단이 비어 있어요」 라고 말한다 — 「모두 한 바퀴」 라고 안 한다');
    await p.evaluate(() => go('rp'));
    is(errs.length === 0, '고객 없이 RP 를 열어도 오류가 없다' + (errs.length ? ' ← ' + errs[0] : ''));

    console.log('\n[6] 넣는 길 — 추가 · 찾은 보험금 (원 · 건별)');
    await p.evaluate(() => go('cust'));
    await p.click('button[data-act="add"][data-sc="cust"]');
    await p.fill('#mForm [name=name]', '홍길동'); await p.selectOption('#mForm [name=g]', '계약');
    await p.click('#mSave');
    is(await p.evaluate(() => S.customers.length === 1 && S.customers[0].name === '홍길동'), '고객 추가가 된다');
    await p.click('#dSeg [data-d="fd"]');
    await p.click('[data-act="add"][data-sc="find"]');
    await p.fill('#mForm [name=what]', '정형외과 통원'); await p.fill('#mForm [name=amt]', '234000');
    await p.click('#mSave');
    await p.click('[data-act="add"][data-sc="find"]');
    await p.selectOption('#mForm [name=kind]', '숨은 보험금'); await p.fill('#mForm [name=what]', '만기 보험금');
    await p.click('#mSave');
    const sum = await p.evaluate(() => foundSummary(S.customers[0]));
    is(sum === '숨은 보험금 1건 · 병원비 1건, 합계 23만 4,000원' || sum === '병원비 1건 · 숨은 보험금 1건, 합계 23만 4,000원', '찾은 내용을 건별로 모아 원 단위로 적는다 — 「' + sum + '」');
    is(/금액 모름/.test(await p.textContent('#drawer')), '금액을 비운 건은 0원이 아니라 「금액 모름」 이다 (1번)');
    is(await p.evaluate(() => S.customers[0].steps[2] && S.customers[0].steps[3]), '숨은 보험금 · 병원비를 적으면 그 단계가 체크된다');
    is(/23만 4,000원/.test(await p.evaluate(() => { renderHome(); return $('#stats').textContent; })), '홈 합계가 같은 기록에서 센 수다 (5번)');
    is(await p.evaluate(() => S.customers[0].found === undefined), '합계를 따로 담는 칸이 없다 — 세는 곳이 하나');

    console.log('\n[7] 다리 대본 — 그 고객 기록에서 오나 · 없으면 안 지어내나 (1번)');
    await p.evaluate(() => { closeDrawer(); go('rp'); $('#rpWho').value = String(S.customers[0].id); rpScen = 'b1'; renderRP(); });
    is(await p.$$eval('#rpChat .phx', a => a.length) >= 1, '단서를 안 골랐으면 점선 칸으로 「무엇을 고를지」 말한다');
    is(/23만 4,000원/.test(await p.textContent('#rpChat')), '찾은 금액이 대본에 들어간다');
    is(!/그리고 하나 더요/.test(await p.textContent('#rpChat')), '단서가 없으면 둘째 단서 줄이 안 선다');
    await p.click('#rpBridge label.clue:has(input[data-clue="c_dup"])');
    const say1 = await p.evaluate(() => CLUES.find(q => q.id === 'c_dup').say);
    is((await p.textContent('#rpChat')).indexOf(say1) >= 0, '고른 단서의 말이 대본 「단서」 자리에 들어간다');
    is(!/그리고 하나 더요/.test(await p.textContent('#rpChat')), '단서 하나면 둘째 줄은 아직 안 선다');
    await p.click('#rpBridge label.clue:has(input[data-clue="c_nodiag"])');
    is(/그리고 하나 더요/.test(await p.textContent('#rpChat')), '단서가 둘이면 둘째 줄이 선다');
    is(await p.evaluate(() => S.customers[0].clues.join(',')) === 'c_dup,c_nodiag', '고른 순서대로 고객 기록에 남는다');

    console.log('\n[8] 설계사 이름 — 화면에서 받는다');
    await p.evaluate(() => { rpScen = 's1'; renderRP(); });
    is(/저 ○○예요/.test(await p.textContent('#rpChat')), '이름을 안 적었으면 ○○ 로 둔다 — 지어 넣지 않는다');
    await p.evaluate(() => go('home')); await p.fill('#meName', '홍길동');
    await p.evaluate(() => go('rp'));
    is(/저 길동예요/.test(await p.textContent('#rpChat')), '적은 이름이 대본에 들어간다 (부르는 이름)');

    console.log('\n[9] 편집 — 넣기 · 고치기 · 지우기 · 처음으로');
    await p.click('#editT');
    const n0 = await p.evaluate(() => scenById('s1').lines.length);
    await p.click('#rpAddLine [data-act="add"]'); await p.fill('#mForm [name=x]', '점검 대사'); await p.click('#mSave');
    is(await p.evaluate(() => scenById('s1').lines.length) === n0 + 1, '대사를 넣는다');
    await p.click('#rpChat .ln:last-of-type [data-act="edit"]'); await p.fill('#mForm [name=x]', '고친 대사'); await p.click('#mSave');
    is(await p.evaluate(() => scenById('s1').lines.slice(-1)[0].x) === '고친 대사', '대사를 고친다');
    await p.click('#rpChat .ln:last-of-type [data-act="del"]');
    is(await p.evaluate(() => scenById('s1').lines.length) === n0, '대사를 지운다');
    const o0 = await p.evaluate(() => S.lib.objs.length);
    await p.click('[data-tools="objs:obj"] [data-act="add"]'); await p.fill('#mForm [name=q]', '"점검"'); await p.click('#mSave');
    await p.click('[data-tools="objs:obj"] [data-act="reset"]');
    is(await p.evaluate(() => S.lib.objs.length) === o0, '거절 응대를 넣고 「처음 내용으로」 되돌린다');
    await p.click('#editT');

    console.log('\n[10] 인쇄 · CSV — 이름을 가린 채가 기본 (3번)');
    is(await p.evaluate(() => S.pmask === true), '「이름 가리기」 가 처음부터 켜져 있다');
    await p.evaluate(() => { window.print = () => {}; printCust(S.customers[0]); });
    await p.emulateMedia({ media: 'print' });
    const pt = await p.evaluate(() => document.querySelector('#printArea').innerText);
    is(/홍○○/.test(pt) && !/홍길동/.test(pt), '한 장 인쇄에 실명이 아니라 홍○○ 가 찍힌다');
    await p.emulateMedia({ media: 'screen' });
    await p.evaluate(() => { document.body.classList.remove('printing'); go('cust'); });
    const csv = await p.evaluate(async () => { let got = null; window.dl = (blob) => { got = blob; }; $('#exX').click(); return got ? await got.text() : ''; });
    is(/홍○○/.test(csv) && !/홍길동/.test(csv), 'CSV 에도 가린 이름이 간다');
    dialogs.length = 0;
    await p.evaluate(() => { S.pmask = false; syncPmask(); });
    p.removeAllListeners('dialog'); p.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
    const csv2 = await p.evaluate(async () => { let got = null; window.dl = (blob) => { got = blob; }; $('#exX').click(); return got ? await got.text() : ''; });
    is(dialogs.some(m => /실명이 든 파일/.test(m)) && csv2 === '', '가리기를 끄면 한 번 더 묻고, 「아니오」 면 파일을 안 만든다');

    is(errs.length === 0, '오류 없이 끝났다' + (errs.length ? ' ← ' + errs[0] : ''));

    console.log('\n[11] 본체에서 열리나');
    const STUB = fs.readFileSync(path.join(ROOT, 'scripts/smoke.js'), 'utf8').split('const STUB = `')[1].split('`;')[0];
    const ctx3 = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx3.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
      ? r.continue() : r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    const p3 = await ctx3.newPage();
    await p3.addInitScript(STUB);
    await p3.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p3.waitForTimeout(2500);
    await p3.evaluate(() => { document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
      OS.profile = { id: 's', name: '점검', role: 'owner', plan: 'vip' }; OS.session = { user: { id: 's' } }; window.toast = function () {}; });
    await p3.evaluate(() => go('jiin_grow'));
    await p3.waitForTimeout(400);
    const fr = await p3.$('#dynPane iframe[src="jiin-grow.html"]');
    is(!!fr, "go('jiin_grow') 이 #dynPane 에 그 화면을 띄운다");
    const nv = await p3.evaluate(() => typeof navItemOf === 'function' ? !!navItemOf('jiin_grow') : null);
    is(nv !== false, '메뉴 찾기(navItemOf)가 그 화면을 안다');
    if (fr) {
      const f = await fr.contentFrame(); await f.waitForSelector('#stats .v', { timeout: 15000 });
      is(true, '띄운 화면 안이 실제로 그려진다');
      /* 없는 파일 대신 앱의 화면으로 — 안에서 누르면 본체가 그 화면으로 간다 */
      await f.evaluate(() => { setTimeout(() => appGo('claims'), 0); });
      await p3.waitForTimeout(400);
      is(await p3.evaluate(() => typeof currentTab === 'function' ? currentTab() === 'claims' : !document.querySelector('#dynPane iframe[src="jiin-grow.html"]')),
        '안의 「앱 화면」 단추가 본체를 그 화면으로 보낸다');
    }
  } finally { await b.close(); srv.close(); }
  console.log(bad ? '\n✗ 지인 8주 성장 프로그램 — 고칠 자리 ' + bad + '곳' : '\n✓ 지인 8주 성장 프로그램 — 모두 통과');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
