/* <b>고객 한 사람이 네 곳에 나뉘어 있던 것</b> — 1단계

   한 사람이 dbs(배정·단계·계약) · calls(통화) · clients(문서) ·
   saved_reports(가족·접촉) 네 곳에 있고, 화면까지 둘로 갈려 있었습니다.
   상담 직전에 양쪽을 다 열어 봐야 했습니다.

   1단계는 <b>표를 한 칸도 안 고치고</b> 화면만 한 장으로 모읍니다.
   여기서 지키는 것 —

     1. 카드를 그리는 곳은 <b>한 벌</b>이다 (apex-cusone.js). 초성 표도
        이름 가리기도 두 벌이 아니다 (CLAUDE.md 5번)
     2. 연락기록은 <b>한 줄기</b>다 — 통화와 접촉이 섞여 시간순으로 선다.
        세는 곳이 둘이면 「몇 번 연락했나」가 갈린다
     3. <b>모름과 0 을 가른다.</b> 그리고 「여기서 안 읽는 것」을 「모름」
        이라고 적지 않는다 (1번)
     4. 계약 월납은 <b>원</b>이다 (dbs.contract_premium). 만원으로 읽으면
        만 배가 틀린다 (4번)
     5. 아직 담을 자리가 없는 칸(보험사·설계번호·납입수단·납입일·
        청약철회)은 <b>빈 칸으로도 그리지 않는다</b> — 적으면 사라진다
     6. 이름은 <b>가린 것이 기본</b>이다. CRM 카드에서 보려면 한 번 더
        누른다 (3번 · 계획서 규칙 ③)
     7. (2단계) 홈에서 <b>한 칸</b>으로 찾으면 두 곳을 함께 훑고, 누르면
        같은 카드로 간다. 견주는 셈도 한 벌이다                          */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});

/* ── ① 소스로 먼저 본다 — 같은 것이 두 곳에 있나 ────────────────── */
function twins() {
  console.log('\n[1] 같은 것을 두 곳에 두지 않았나');
  const idx = fs.readFileSync('app/index.html', 'utf8');
  const crm = fs.readFileSync('db-crm.html', 'utf8');
  const mod = fs.readFileSync('app/apex-cusone.js', 'utf8');
  /* 초성 표 리터럴 — 'ㄲ' 과 'ㅃ' 이 같은 줄에 있으면 그것이 표다 */
  const choLit = t => (t.match(/['"]ㄲ['"]\s*,[\s\S]{0,120}?['"]ㅃ['"]/g) || []).length;
  is(choLit(mod) === 1, '초성 표는 apex-cusone.js 에 하나 (' + choLit(mod) + '개)');
  is(choLit(idx) === 0, 'app/index.html 에는 초성 표가 없다 (' + choLit(idx) + '개)');
  is(choLit(crm) === 0, 'db-crm.html 에는 초성 표가 없다 (' + choLit(crm) + '개)');
  /* 이름 가리기 — 가운데를 * 로 채우는 되풀이가 두 곳에 있으면 안 된다 */
  const maskLit = t => (t.match(/mid\s*\+=\s*['"]\*['"]/g) || []).length;
  is(maskLit(mod) === 1, '이름 가리기도 한 벌 (' + maskLit(mod) + '개)');
  is(maskLit(idx) === 0 && maskLit(crm) === 0, '두 화면에는 가리는 셈이 남아 있지 않다');
  /* 찾는 셈 — 연락처 뒷자리를 견주는 줄이 두 화면에 다시 생기면 안 된다 */
  const hitLit = t => (t.match(/num\.length\s*>=\s*2/g) || []).length;
  is(hitLit(mod) === 1 && hitLit(idx) === 0 && hitLit(crm) === 0,
     '찾는 셈(번호 뒷자리)도 한 벌 — 두 화면에는 없다');
  is(/cusHit\(/.test(idx) && /cusHit\(/.test(crm), '두 화면이 같은 찾기를 부른다');
  is(/apex-cusone\.js/.test(idx) && /apex-cusone\.js/.test(crm), '두 화면이 같은 파일을 싣는다');
}

(async () => {
  twins();
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.route('**/*', async r => {
    const u = r.request().url();
    if (u.startsWith('http://127.0.0.1:' + PORT)) return r.continue();
    if (/^https?:/.test(u)) return r.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
    return r.continue();
  });

  /* ── ② 고객 365일 쪽 ─────────────────────────────────────────── */
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n[2] 고객 365일 — 한 장 카드가 서나');
  const A = await page.evaluate(() => {
    OS.profile = { id: 'me', role: 'member', name: '윤시현' };
    CM.loaded = true; CM.who = { me: '윤시현' };
    OSC.list = [{ id: 'k1', advisor_id: 'me', name_masked: '홍*동',
                  created_at: '2026-01-05T00:00:00Z', phone: '010-1234-5678' }];
    OSC.current = OSC.list[0];
    CM.meta = { k1: { fp: {}, fam: '홍길동 가족', rel: '본인', next: null, bd: '',
                      touch: [{ at: '2026-09-02', how: '카톡', note: '증권 사진 받기로' }],
                      fams: [{ rel: '배우자', name: '', by: '1985', note: '' },
                             { rel: '첫째', name: '', by: '2014', note: '학생' }] } };
    CUS.info = { phone: '010-1234-5678', birth_year: 1980, gender: 'M',
                 monthly_income: 500, monthly_fixed_expense: null };
    CUS.db = { id: 'd1', region: '순천', stage: 'AP', policy_no: 'P-77',
               contract_premium: 150000, contracted_at: '2026-08-20', policy_sent_at: null };
    CUS.calls = [{ db_id: 'd1', call_at: '2026-09-05T02:00:00Z', result: '상담',
                   memo: '보장분석 약속', appointment_at: '2026-09-12T05:00:00Z' }];
    CUS.docN = 2; CUS.repN = null;
    const html = cusAppCardHtml(OSC.current);
    const detail = osClientDetailHtml(OSC.current);
    const log = cusLog(CUS.calls, CM.meta.k1.touch);
    return { html, detail, log, fams: cusFamRowsHtml('k1') };
  });
  is(/홍\*동/.test(A.html) && !/홍길동/.test(A.html.replace(/홍길동 가족/g, '')),
     '이름은 가린 것이 기본 — 실명을 안 적어 두면 홍*동');
  is(/서버에는 가린 이름/.test(A.html), '무엇을 보고 있는지 딱지로 말한다');
  is(A.log.length === 2 && A.log[0].at === '2026-09-05' && A.log[1].at === '2026-09-02',
     '연락기록이 한 줄기로 시간순 — 통화와 접촉이 섞인다');
  is(/CRM 통화/.test(A.html) && /접촉/.test(A.html), '어디서 온 기록인지 줄마다 적는다');
  is(/15만원/.test(A.html), '계약 월납 150,000원을 15만원으로 읽는다 (만 배 사고 없음)');
  is(!/15억/.test(A.html) && !/1,500,000/.test(A.html), '만 배로 부풀지 않았다');
  /* 반올림해서 적으면 그 자리에서 틀린 숫자가 된다 — 187,000원은 19만원이 아니다 */
  const W = await page.evaluate(() => [cusWonR(187000), cusWonR(150000), cusWonR(350000000), cusWonR(5000)]);
  is(W[0] === '18만 7,000원', '187,000원을 「18만 7,000원」으로 — 반올림하지 않는다 (' + W[0] + ')');
  is(W[1] === '15만원' && W[3] === '5,000원', '딱 떨어지면 딱 떨어지게 적는다');
  is(W[2] === '3억 5,000만원', '큰 금액은 억으로 끊어 적는다 (' + W[2] + ')');
  is(/월 생활비<\/b><span><span class="cus-unk">모름/.test(A.html.replace(/\s+/g, ' ')) ||
     /모름/.test(A.html), '안 적은 값은 「모름」 — 0 으로 적지 않는다');
  is(/배우자/.test(A.html) && /1985년생/.test(A.html) && /첫째/.test(A.html),
     '가족이 줄로 선다 (배우자 · 첫째)');
  is(/홍길동 가족/.test(A.html), '가족 묶음 이름도 카드에 보인다');
  is(/아직 담는 자리가 없습니다/.test(A.html), '보험사·납입일은 「자리가 없다」고 말한다');
  is(!/id="cusPayDay"/.test(A.html) && !/납입일<\/b>/.test(A.html),
     '담을 자리가 없는 칸은 빈 칸으로도 안 그린다');
  is(/id="cusCard"/.test(A.detail) && /id="cusFamRows"/.test(A.detail),
     '고객 상세가 카드와 가족 줄을 함께 연다');
  is(!/id="oscCalls"/.test(A.detail), '옛 통화 이력 칸은 없앴다 — 두 곳에서 세지 않는다');
  is(/cusFamRel0/.test(A.fams) && /cusFamBy1/.test(A.fams), '가족 줄을 고칠 칸이 선다');

  console.log('\n[3] 실명을 적어 두면 그 기기에서만 실명으로');
  const B = await page.evaluate(() => {
    cmRealSet('k1', '홍길동');
    const html = cusAppCardHtml(OSC.current);
    cmRealSet('k1', '');
    return html;
  });
  is(/홍길동<\/div>|홍길동\s*<span/.test(B) || /홍길동/.test(B), '실명이 있으면 실명으로 부른다');
  is(/실명 · 이 기기에만/.test(B), '그것이 이 기기에만 있는 이름이라고 적는다');

  /* ── ③ DB 통합 CRM 쪽 — 같은 카드인가 ────────────────────────── */
  console.log('\n[4] DB 통합 CRM — 같은 카드가 열리나');
  await page.goto('http://127.0.0.1:' + PORT + '/db-crm.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const C = await page.evaluate(() => {
    eval(`profile = { id: 'me', role: 'admin', name: '윤시현' }`);
    eval(`profiles = [{ id: 'me', name: '윤시현', active: true }]`);
    eval(`dbs = [{ id: 'd1', assigned_to: 'me', customer_name: '홍길동', phone: '010-1234-5678',
                   region: '순천', source: '일반', stage: 'AP', assigned_date: '2026-08-01',
                   policy_no: 'P-77', contract_premium: 150000, contracted_at: '2026-08-20' }]`);
    eval(`calls = [{ id: 'c1', db_id: 'd1', call_at: '2026-09-05T02:00:00Z', result: '상담',
                     memo: '보장분석 약속', appointment_at: '2026-09-12T05:00:00Z' }]`);
    eval(`cliKeys = {}`);
    cusOpen('d1');
    const open = document.getElementById('cusModal').classList.contains('open');
    const body = document.getElementById('cusBody').innerHTML;
    cusShow('d1');
    const shown = document.getElementById('cusBody').innerHTML;
    closeModal('cusModal');
    return { open, body, shown, again: !!Object.keys(CUS_SHOW).length };
  });
  is(C.open, '이름을 누르면 카드가 열린다');
  is(/홍\*동/.test(C.body) && !/홍길동/.test(C.body), 'CRM 카드도 이름을 가린 것이 기본 (규칙 ③)');
  is(/홍길동/.test(C.shown), '한 번 더 눌러야 실명이 뜬다');
  is(!C.again, '닫으면 이름 보기는 꺼진다 — 다음 사람에게 이어지지 않는다');
  is(/15만원/.test(C.body), 'CRM 카드도 계약 월납을 같은 단위로 읽는다');
  is(/고객 365일에 있습니다/.test(C.body), '안 읽는 값은 「모름」이 아니라 어디 있는지 적는다');
  is(/상담/.test(C.body) && /보장분석 약속/.test(C.body), '통화가 연락기록으로 선다');

  console.log('\n[5] 홈에서 한 칸으로 찾기 (2단계)');
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  const D = await page.evaluate(() => {
    OS.profile = { id: 'me', role: 'member', name: '윤시현' };
    CM.loaded = true; CM.who = { me: '윤시현' }; CM.meta = {};
    OSC.list = [{ id: 'k1', advisor_id: 'me', name_masked: '홍*동',
                  created_at: '2026-01-05T00:00:00Z', phone: '010-1234-5678' }];
    /* 배정 DB 에만 있는 사람 — 아직 365 로 안 넘긴 사람이다 */
    CUSF.dbs = [{ id: 'd9', customer_name: '홍판서', phone: '010-9999-3456',
                  region: '순천', stage: 'TA', assigned_date: '2026-09-01' },
                { id: 'd1', customer_name: '홍길동', phone: '010-1234-5678',
                  region: '광주', stage: 'AP', assigned_date: '2026-08-01' }];
    cmRealSet('k1', '홍길동');
    const box = cusFindHtml();
    cusFindSet('홍');           const both = cusFindRowsHtml();
    cusFindSet('ㅎㄱㄷ');        const cho  = cusFindRowsHtml();
    cusFindSet('010-9999-3456'); const num  = cusFindRowsHtml();
    cusFindSet('없는사람');      const none = cusFindRowsHtml();
    cusFindSet('');
    cmRealSet('k1', '');
    return { box, both, cho, num, none, home: renderHome() };
  });
  is(/id="cusFindQ"/.test(D.box), '홈에 찾는 칸이 한 개 선다');
  is(/id="cusFindQ"/.test(D.home), '홈을 그리면 그 칸이 맨 위에 있다');
  is(/2명 찾았습니다/.test(D.both), '두 곳을 함께 훑는다 — 365 와 배정 DB');
  is(/아직 고객 365일에 없습니다/.test(D.both), '아직 안 넘긴 사람은 그렇다고 말한다');
  is(/한 장 열기/.test(D.both) && /CRM 에서 열기/.test(D.both), '어디로 가는지 줄마다 적는다');
  is(/홍길동/.test(D.both) && !/홍판서/.test(D.both), '배정 DB 이름도 가려서 세운다 (규칙 ③)');
  is(/찾았습니다/.test(D.cho), '초성(ㅎㄱㄷ)으로도 찾힌다');
  is(/찾았습니다/.test(D.num), '「010-9999-3456」 을 통째로 붙여 넣어도 찾힌다');
  is(/찾은 고객이 없습니다/.test(D.none), '못 찾으면 못 찾았다고 적는다');
  is(!/2명 찾았습니다/.test(D.none), '없는데 있는 척하지 않는다');

  console.log('\n[6] 화면이 터지지 않았나');
  const mine = errs.filter(e => /cus|Cus/.test(e));
  is(mine.length === 0, '고객 한 장에서 나온 오류 없음' + (mine.length ? (' — ' + mine[0]) : ''));

  await browser.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '군데') : '\n고객 한 장 — 두 입구가 같은 카드를 세웁니다.');
  process.exit(bad ? 1 : 0);
})();
