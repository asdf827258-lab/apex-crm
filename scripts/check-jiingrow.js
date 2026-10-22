/* 🌱 <b>지인 8주 성장 프로그램</b> — 명단 비운 판 (판 X145 · 2026-10-21) · 이름·회사 · 미청구 찾기 · 안내장 (판 X152 · 2026-10-22)

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
     ⑨ 돈 이름 규약 (4번) — 원을 받는 함수는 …WonR
   판 X152 —
     ⑩ 이름·회사는 한 곳(S.cfg) — 대본·회사 소개·거절 응대가 그 값을 읽고, 조사가 받침에 맞는다(길동이에요/주희예요)
     ⑪ 대본 점검 — 모든 대본에 안 채운 {자리} 가 0 · 결과 전달은 결과 세 줄이 비면 지어 말하지 않는다 (1번)
     ⑫ ★ 미청구 찾기 — 칸을 잘못 잡지 않는다(기관기호·본인부담률·투약일수) · 묶음 청구·접수일만 있는 청구를
        「청구 안 된 듯」 으로 단정하지 않는다 · 조건이 비면 금액을 안 지어내고 「0원」 이라 하지 않는다 (1번)
     ⑬ ★ 안내장 — 「심사 결과에 따릅니다」 · 3년 · 「내부 교육용」 쪽지가 안 붙는다 · 이름은 가린 채가 기본 (2번 · 3번)  */
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
    is(/저 길동이에요/.test(await p.textContent('#rpChat')), '적은 이름이 대본에 들어간다 — 받침에 맞는 조사(길동이에요)');

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

    console.log('\n[12] 이름·회사 — 한 곳에서 바꾸면 다 바뀌나 (5번)');
    await p.evaluate(() => { S.me = '홍판서'; S.cfg = Object.assign({}, S.cfg, { prev: '견본생명', prevS: '견본', cur: '견본에셋금융', phone: '010-0000-0000' }); save(); renderAll(); go('why'); });
    is((await p.textContent('#t-why h1')).replace(/\s/g, '') === '견본생명에서견본에셋금융으로온이유', '회사 소개 제목이 설정을 읽는다 (조사 「으로」 까지)');
    is(/견본에 있을 땐/.test(await p.textContent('#objs')) && /견본은 비싸요/.test(await p.textContent('#dont')), '거절 응대 · 하지 않는 말도 같은 설정 — 조사 「은」');
    await p.evaluate(() => { go('rp'); rpScen = 's1'; renderRP(); });
    is(/견본생명에서 견본에셋금융이라는 회사로/.test(await p.textContent('#rpChat')), '대본도 같은 설정 — 조사 「이라는」');

    console.log('\n[13] 대본 점검 — 안 채운 자리 · 지어 말하기 (1번)');
    const left = await p.evaluate(() => { const out = []; const c = S.customers[0]; for (const full of [false, true]) { if (full) { c.res = { good: '실비는 잘 들어 있어요', gap: '진단비가 비어 있어요', todo: '진단비 비교' }; c.clues = ['c_where', 'c_dup']; }
      S.lib.scen.forEach(x => { rpScen = x.id; renderRP(); if (/\{[A-Z]/.test($('#rpChat').innerText + $('#rpTitle').innerText + $('#rpGoal').innerText)) out.push(x.id); }); } return out; });
    is(left.length === 0, '모든 대본에 안 채운 {자리} 가 0' + (left.length ? ' ← ' + left.join(',') : ''));
    await p.evaluate(() => { S.customers[0].res = { good: '', gap: '', todo: '' }; rpScen = 's5'; renderRP(); });
    is(!/잘 챙겨 두셨고요|지금 비어 있어요/.test(await p.textContent('#rpChat')) && await p.$$eval('#rpChat .phx', a => a.length) >= 3, '결과 전달 — 결과 세 줄이 비면 지어 말하지 않고 점선 칸');

    console.log('\n[14] 미청구 찾기 — 칸 · 판정 · 금액 (1번)');
    await p.evaluate(() => { sbWhoId = S.customers[0].id; const s = sbOf(S.customers[0]); s.visits = []; s.claims = []; s.cond = {}; go('silbi'); sbRender(); });
    const tk = (ty, x) => p.evaluate(([t, txt]) => sbTake(t, sbRead(t, txt)), [ty, x]);
    await tk('visit', ['번호\t진료일자\t요양기관기호\t요양기관명\t진료구분\t입내원일수\t투약일수\t본인부담률\t본인부담금(원)',
      '1\t2025.03.04\t12345678\t견본정형외과의원\t외래\t1\t3\t30%\t12,000원', '2\t2025.03.11\t12345678\t견본정형외과의원\t외래\t1\t3\t30%\t12,000원',
      '3\t2025.05.02\t22222222\t견본내과의원\t외래\t1\t0\t30%\t40,000원', '4\t2025.09.01\t33333333\t견본병원\t입원\t3\t0\t20%\t300,000원', '\t합계\t\t\t\t\t\t\t364,000원'].join('\n'));
    const vs = await p.evaluate(() => sbOf(S.customers[0]).visits.map(v => [v.org, v.cost, v.days]));
    is(vs.length === 4 && vs[0][0] === '견본정형외과의원' && vs[0][1] === 12000 && vs[3][2] === 3, '기관기호·본인부담률·투약일수를 잘못 잡지 않고 합계 줄을 뺀다 ' + JSON.stringify(vs[0]));
    const mp = await p.evaluate(() => sbRead('visit', '일자\t기관기호\t병원\t본인부담률\t본인부담\n2025-01-02\t123\t견본의원\t30%\t5,000').map);
    is(mp.org === 2 && mp.cost === 4, '머리줄이 흔한 말뿐이어도 「기관기호」 · 「본인부담률」 을 피한다 ' + JSON.stringify(mp));
    await tk('claim', ['청구일자\t사고일자\t병원명\t청구금액\t지급금액', '2025-03-25\t2025-03-04\t견본정형외과\t24,000\t4,000'].join('\n'));
    await p.evaluate(() => sbRender());
    let J = await p.evaluate(() => { const o = {}; sbJudge(S.customers[0]).forEach(j => o[j.v.d] = j.st); return o; });
    is(J['2025-03-04'] === 'claimed', '사고일자 · 「정형외과」=「정형외과의원」 으로 맞댄다');
    is(J['2025-03-11'] === 'check', '같은 병원을 묶어 청구했을 수 있으면 「청구 안 된 듯」 으로 단정하지 않는다');
    is(J['2025-05-02'] === 'unclaimed' && J['2025-09-01'] === 'unclaimed', '청구 기록이 없으면 「청구 안 된 듯」');
    let M = await p.evaluate(() => { const m = sbSum(S.customers[0]); return [m.U.length, m.unknown]; });
    is(M[0] === 2 && M[1] === 2 && /조건 필요/.test(await p.textContent('.sbsum')) && !/약 0원/.test(await p.textContent('.letter')), '조건이 비면 금액을 안 지어내고 「0원」 이라 하지 않는다');
    await p.evaluate(() => { const s = sbOf(S.customers[0]); s.cond = { clinic: 10000, rate: 20, inRate: 20 }; sbRender(); });
    M = await p.evaluate(() => sbSum(S.customers[0]).est);
    is(M === 270000, '적어 넣은 조건으로만 센다 — (40,000−10,000) + 300,000×80% = 270,000 (' + M + ')');
    await p.evaluate(() => { const el = document.querySelector('[data-sbcond="rate"]'); el.value = '0.3'; el.dispatchEvent(new Event('change', { bubbles: true })); });
    is(await p.evaluate(() => sbOf(S.customers[0]).cond.rate) === 30, '비율 0.3 은 30% 로 받는다');
    await p.evaluate(() => { const s = sbOf(S.customers[0]); s.claims = [{ id: 'f', d: '2025-05-20', dk: 'filed', org: '견본내과의원', amt: 40000, paid: '' }]; });
    J = await p.evaluate(() => { const o = {}; sbJudge(S.customers[0]).forEach(j => o[j.v.d] = j.st); return o; });
    is(J['2025-05-02'] === 'check', '청구 내역에 접수일만 있으면 그 앞 같은 병원 진료를 단정하지 않는다');

    console.log('\n[15] 안내장 (2번 · 3번)');
    await p.evaluate(() => { sbOf(S.customers[0]).claims = []; sbRender(); });
    const lt = await p.textContent('.letter');
    is(/심사 결과에 따릅니다/.test(lt) && /상법 제662조/.test(lt) && /010-0000-0000/.test(lt) && /견본에셋금융/.test(lt), '안내장 — 심사 결과 · 3년 · 보내는 사람 연락처 · 지금 회사');
    await p.evaluate(() => { window.print = () => {}; S.pmask = true; $('#sbLetterPrint').click(); });
    await p.emulateMedia({ media: 'print' });
    const lp = await p.evaluate(() => document.querySelector('#printArea').innerText);
    await p.emulateMedia({ media: 'screen' }); await p.evaluate(() => document.body.classList.remove('printing'));
    is(/홍○○/.test(lp) && !/홍길동/.test(lp) && !/내부 교육용/.test(lp), '안내장 인쇄 — 이름은 가린 채 · 「내부 교육용」 쪽지 없음');

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
