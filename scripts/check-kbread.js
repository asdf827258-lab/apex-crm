/* KB 보장분석 리더 — <b>한 글자도 짐작하지 않는가.</b>

   KB 보장분석은 서식이 고르고, 무엇보다 <b>KB 가 표준담보명과 지급형태를
   이미 적어 준다.</b> 그래서 이 문서는 추측할 것이 없다 — AI 로 뽑으면
   오히려 못 읽거나 지어낼 자리가 생긴다. 규칙으로 읽는다.

   실물 17건으로 만들다 잡은 사고 넷을 여기 못으로 박는다.

   ① <b>「보험료미제공」을 0 으로 적으면 공짜 보험이 된다.</b> null 이다.
   ② <b>「(납입완료)」는 KB 가 직접 알려 주는 상태다.</b> 이 표가 날짜와 금액
      사이에 끼어 있어 보험료를 통째로 못 읽고 있었다(12건). 납입완료는
      보험료 0 · 보장 유지로 이어지는 값이라 놓치면 두 번 틀린다.
   ③ <b>같은 회사·같은 상품·같은 가입일이어도 다른 계약일 수 있다.</b>
      KDB생명 변액연금 두 건을 하나로 합쳐 <b>있는 계약을 없앴다.</b> 쪽이
      넘어가 쪼개진 것은 KB 가 이름 끝에 (1/2)(2/2) 로 적어 준다 —
      그 표가 있을 때만 합친다.
   ④ <b>상품명 안의 숫자를 계약 번호로 보면 한 계약이 둘로 쪼개진다.</b>
      「한화 시그니처 여성 건강보험3.0 무배당 2504」 의 2504 가 그랬다.
      번호는 세 자리를 넘지 않는다.

   그리고 <b>두 곳에서 읽어 견준다</b> — 「전체 계약리스트」와
   「상품별 가입담보상세」. 한 곳만 믿지 않는다. 어긋나면 말한다.       */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': /\.html$/.test(f) ? 'text/html; charset=utf-8' : 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 실물에서 그대로 옮긴 모양. 이름은 「홍길동」 (CLAUDE.md 3번). */
const DOC = [
  '홍길동(40세 ,여자) 님의 전체 보장현황',
  '2026-07-27 09:34:51',
  '※ 기준담보/권장금액 : 기본형(37개)/표준형',
  '수도GA2사업단 | 수도GA2-프런티어3지점/윤시현(6080652)/010-2144-4333 2/60',
  '',
  '홍길동(40세 ,여자) 님의 전체 계약리스트',
  '9131 4,558,107',
  '1 KB손보 (무)KB 슬기로운 간편실속종합건강보험(22.04) 2022-04-13 월납 20년 100세 48,728원',
  '2 한화손보 ',
  '한화 시그니처 여성 건강보험3.0 무배당',
  '2504 ',
  '2025-04-30 월납 20년 100세 66,434원',
  '3 삼성생명 無삼성리빙케어(종신2종)1.2 2004-03-05 월납 20년 종신 136,200원',
  '4 KDB생명 (무)더! 행복드림 변액연금보험 2024-10-02 월납 10년 종신 500,000원',
  '5 KDB생명 (무)더! 행복드림 변액연금보험 2024-10-02 월납 10년 종신 500,000원',
  '6 메트라이프생명 무배당 오늘의달러연금보험 2025-01-06 일시납 0년 종신 34,000,000원',
  '',
  '홍길동(40세 ,여자) 님의 상품별 가입담보상세 ',
  '※ 기준담보/권장금액 : 기본형(37개)/표준형',
  '',
  'KB손보 | 가입일자 : 2022-04-13 |',
  '',
  '(무)KB 슬기로운 간편실속종합건강보험(22.04) (1/2)',
  '',
  '홍길동/홍길동 월납/20년/100세만기',
  '2022-04-13~2086-04-13 48,728원',
  '',
  '1 정액 일반상해사망(경증간편가입)(기본계약) 상해사망(유병자) 100만',
  '2 정액 간호·간병통합서비스사용질병입원일당(1일이상)(경증간편가입) 질병 간호·간병통합서비스사용일당 1만',
  '수도GA2사업단 | 수도GA2-프런티어3지점/윤시현(6080652)/010-2144-4333 13/60',
  '',
  'KB손보 | 가입일자 : 2022-04-13 |',
  '',
  '(무)KB 슬기로운 간편실속종합건강보험(22.04) (2/2)',
  '',
  '홍길동/홍길동 월납/20년/100세만기',
  '2022-04-13~2086-04-13 48,728원',
  '',
  '3 정액 뇌혈관질환진단비 뇌혈관질환진단 2,000만',
  '',
  '한화손보 | 가입일자 : 2025-04-30 |',
  '',
  '한화 시그니처 여성 건강보험3.0 무배당',
  '2504',
  '',
  '홍길동/홍길동 월납/20년/100세만기',
  '2025-04-30~2086-04-30 66,434원',
  '',
  '1 실손 질병입원의료비 질병입원의료비 8,000만',
  /* KB 는 괄호를 끼워 적는다 — 사전이 「질병입원의료비」만 알면 실손이 통째로 미분류가 된다 */
  '2 실손 상해(일반상해,전체상해를 의미) 상해(일반상해,전체상해를 의미)입원의료비 5,000만',
  '3 실손 질병(전체질병을 의미) 질병(전체질병을 의미)통원의료비 30만',
  '4 정액 치주질환수술보험금 기타수술 20만',
  '5 정액 턱관절장애입원보험금(1일이상) 기타입원일당 3만',
  '',
  '삼성생명 | 가입일자 : 2004-03-05 |',
  '',
  '無삼성리빙케어(종신2종)1.2',
  '',
  '김*자/홍길동 월납/20년/9999세만기',
  '2004-03-05~9999-12-31 (납입완료)136,200원',
  '',
  '1 정액 無삼성리빙케어(종신2종)1.2 질병사망 1억',
  '',
  'KDB생명 | 가입일자 : 2024-10-02 |',
  '',
  '(무)더! 행복드림 변액연금보험',
  '',
  '홍길동/홍길동 월납/10년/9999세만기',
  '2024-10-02~9999-12-31 500,000원',
  '',
  '1 정액 (무)더! 행복드림 변액연금보험 일반사망 1,000만',
  '',
  'KDB생명 | 가입일자 : 2024-10-02 |',
  '',
  '(무)더! 행복드림 변액연금보험',
  '',
  '홍길동/홍길동 월납/10년/9999세만기',
  '2024-10-02~9999-12-31 500,000원',
  '',
  '1 정액 (무)더! 행복드림 변액연금보험 일반사망 1,000만',
  '',
  '메트라이프생명 | 가입일자 : 2025-01-06 |',
  '',
  '무배당 오늘의달러연금보험',
  '',
  '홍길동/홍길동 일시납/0년/9999세만기',
  '2025-01-06~9999-12-31 보험료미제공',
  '',
  '1 정액 무배당 오늘의달러연금보험 일반사망 9억 6,410만',
  '',
  '홍길동(40세 ,여자) 님의 실효/해지계약현황',
  '',
  '1 해지* KB손보 (무)LIG플러스장기우대저축보험 2011-11-23 월납 12년 41세 100,000원',
  '2 해지* 메리츠화재 (무) 메리츠 운전자보험 M-Drive1810 2019-02-26 월납 20년 100세 40,000원',
  '',
  '9 정액 해지된보험의암진단비 일반암 5,000만'
].join('\n');

const NOTKB = '어떤 보험사 보장분석\n담보명 가입금액\n일반암진단비 3,000만원\n뇌출혈진단비 1,000만원';

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  const has = await page.evaluate(() => typeof kbParse === 'function' && typeof kbLooks === 'function');
  is(has, 'KB 리더가 실제로 실려 있다');
  if (!has) { await browser.close(); srv.close(); process.exit(1); }

  console.log('\n[1] 남의 서식에는 손대지 않는다');
  const looks = await page.evaluate(([doc, other]) => ({
    kb: kbLooks(doc), no: kbLooks(other),
    parsed: kbParse(other)
  }), [DOC, NOTKB]);
  is(looks.kb === true, 'KB 서식을 알아본다');
  is(looks.no === false, 'KB 가 아니면 <b>스스로 물러난다</b> — 억지로 읽으면 조용히 틀린 값이 들어온다');
  is(looks.parsed.ok === false && /서식이 아닙니다/.test(looks.parsed.why),
     '물러날 때 <b>왜 안 읽었는지</b> 말한다');

  console.log('\n[2] 금액 — 0 과 모름을 섞지 않는다');
  const amt = await page.evaluate(() => ({
    man: kbWonR('100만'), eok: kbWonR('9억 6,410만'), won: kbWonR('48,728원'),
    dash: kbWonR('-'), empty: kbWonR(''), junk: kbWonR('보험료미제공')
  }));
  is(amt.man === 1000000, '「100만」 = 100만원 (' + amt.man + ')');
  is(amt.eok === 964100000, '「9억 6,410만」 = 9억 6,410만원 (' + amt.eok + ')');
  is(amt.won === 48728, '「48,728원」 = 48,728원');
  is(amt.dash === null && amt.empty === null && amt.junk === null,
     '못 읽은 것은 <b>null</b> 이다 — 0 으로 적으면 「없다」가 된다');

  console.log('\n[3] 계약 — 합칠 것만 합치고, 다른 것은 안 합친다');
  const r = await page.evaluate((doc) => {
    const p = kbParse(doc);
    const pick = function(co, part){
      for (var i=0;i<p.contracts.length;i++)
        if (p.contracts[i].co===co && p.contracts[i].nm.indexOf(part)>=0) return p.contracts[i];
      return null;
    };
    let covs = 0; p.contracts.forEach(c => covs += c.covs.length);
    return {
      ok: p.ok, ct: p.contracts.length, covs: covs, listed: p.listed, gap: p.gap,
      lapsed: p.lapsed.length, paidUp: p.paidUp, noPrem: p.noPrem,
      person: p.person,
      kb: pick('KB손보','슬기로운'),
      kdbN: p.contracts.filter(c => c.co === 'KDB생명').length,
      hw: pick('한화손보','시그니처'),
      ss: pick('삼성생명','리빙케어'),
      met: pick('메트라이프생명','달러연금'),
      names: p.contracts.map(c => c.co + ' ' + c.nm.slice(0, 18)),
      covNames: p.contracts.map(c => c.covs.map(v => v.raw + '→' + v.std)).join(' | ')
    };
  }, DOC);
  is(r.ok, '읽었다 — 계약 ' + r.ct + '건 · 담보 ' + r.covs + '개');
  is(r.ct === 6, '계약 6건 — (1/2)(2/2) 는 합치고 그 밖에는 안 합친다 (' + r.ct + ')');
  is(r.kb && r.kb.covs.length === 3,
     '(1/2)(2/2) 로 쪼개진 계약은 <b>하나로</b> 합친다 — 담보 3개 (' + (r.kb ? r.kb.covs.length : '?') + ')');
  is(r.kdbN === 2,
     '같은 회사·상품·가입일이어도 <b>표가 없으면 다른 계약</b>이다 — KDB 2건 (' + r.kdbN + ')');
  is(!!r.hw && r.hw.premWon === 66434,
     '상품명 안의 숫자(2504)를 계약 번호로 보지 않는다 — 한화 보험료 ' + (r.hw ? r.hw.premWon : '?'));

  console.log('\n[4] 납입완료와 보험료미제공 — KB 가 알려 주는 것을 흘리지 않는다');
  is(!!r.ss && r.ss.paidUp === true && r.ss.premWon === 136200,
     '「(납입완료)136,200원」 — 상태와 금액을 <b>둘 다</b> 읽는다');
  is(r.paidUp === 1, '납입완료 건수를 센다 (' + r.paidUp + ')');
  is(!!r.met && r.met.premWon === null && /미제공/.test(r.met.premNote || ''),
     '「보험료미제공」은 <b>null</b> 이고 왜 없는지 적는다');
  is(r.noPrem === 1, '보험료를 모르는 계약 수를 센다 (' + r.noPrem + ')');

  console.log('\n[5] 읽지 않아야 할 것');
  is(r.lapsed === 2, '실효·해지 계약 2건을 <b>빼고 세어 말한다</b> (' + r.lapsed + ')');
  is(r.covNames.indexOf('해지된보험의암진단비') < 0,
     '해지 구간의 담보를 <b>살아 있는 보장으로 읽지 않는다</b>');
  is(r.names.filter(n => /^\d/.test(n)).length === 0, '쪽 머리 숫자를 계약으로 세지 않는다');
  is(r.covs === 12, '담보는 12개 — 쪽 머리글·안내문을 담보로 세지 않는다 (' + r.covs + ')');

  console.log('\n[6] 두 곳에서 읽어 견준다');
  is(r.listed === 6, '「전체 계약리스트」에서도 6건을 읽는다 (' + r.listed + ')');
  is(r.gap === 0, '두 출처가 <b>어긋나지 않는다</b> (차이 ' + r.gap + ')');

  console.log('\n[7] 사람과 이름');
  is(r.person.name === '홍길동' && r.person.age === 40 && r.person.sex === 'F',
     '이름·나이·성별을 읽는다 (' + r.person.name + '/' + r.person.age + '/' + r.person.sex + ')');

  console.log('\n[8] 담보 이름 — 원문과 KB표준명을 가르되, 원문은 통째로 지킨다');
  const nm = await page.evaluate(() => ({
    a: kbSplitName('일반상해사망(경증간편가입)(기본계약) 상해사망(유병자)'),
    b: kbSplitName('간호·간병통합서비스사용질병입원일당(1일이상)(경증간편가입) 질병 간호·간병통합서비스사용일당'),
    c: kbSplitName('뇌혈관질환진단비 뇌혈관질환진단')
  }));
  is(nm.a.raw === '일반상해사망(경증간편가입)(기본계약)' && nm.a.std === '상해사망(유병자)',
     '괄호로 끝나면 그 뒤가 KB표준명이다');
  is(nm.b.std === '질병 간호·간병통합서비스사용일당',
     'KB표준명에 띄어쓰기가 있어도 통째로 가져온다');
  is(nm.c.raw === '뇌혈관질환진단비' && nm.c.std === '뇌혈관질환진단',
     '괄호가 없으면 마지막 공백에서 가른다');

  console.log('\n[9] 이 리더는 AI 를 부르지 않는다');
  const APP = fs.readFileSync('app/index.html', 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
  const from = APP.indexOf('function kbWonR'), to = APP.indexOf('function kbParse');
  const seg = (from > 0 && to > from) ? APP.slice(from, to) : '';
  is(seg.length > 500, 'KB 리더 구간을 찾을 수 있다');
  is(!/callAI\s*\(|callAIVision\s*\(|generateContent/.test(seg),
     'KB 리더 안에서 <b>AI 를 부르지 않는다</b> — 짐작할 것이 없는 문서다');

  /* ── 읽은 것이 <b>실제로 화면까지</b> 가는가 ────────────────────────
     글자를 읽는 것과, 그것이 계약·담보가 되어 전·후에 서는 것은 다른 일이다.
     읽어만 놓고 안 실리면 「읽었다」는 말만 남는다.                      */
  console.log('\n읽은 것이 전 · 후 만들기까지 가는가');
  const flow = await page.evaluate((t) => {
    const K = kbParse(t);
    FR.state = frBlankState(); FR.pols = []; FR.covs = []; FR.cid = 'c1'; FR.client = {};
    FR.kbTmp = { K: K, name: 't.pdf' };
    var _toast = window.toast, _paint = window.frPaint, _save = window.frSaveState;
    window.toast = function(){}; window.frPaint = function(){}; window.frSaveState = function(){};
    frKbApply();                       /* 사장님이 「이대로 넣기」를 누른 것과 같은 길 */
    window.toast = _toast; window.frPaint = _paint; window.frSaveState = _save;
    const merged = FR.covs.length;
    const M = frMaster(), T = frCounts(M);
    /* 두 번 눌러도 두 번 들어가지 않아야 한다 */
    frKbMerge();
    const M2 = frMaster();
    const mk = frMakeHtml(M);
    const idle = frKbIdleHtml();
    const std = (nm) => { const r = M.filter(m => m.raw.indexOf(nm) >= 0)[0]; return r ? r.std : '없음'; };
    return {
      merged, pols: FR.pols.length, covs: FR.covs.length,
      master: M.length, lost: T.lost, twice: M2.length, kbCount: frKbCount(),
      /* 담보가 제 계약에 붙었는가 */
      orphan: M.filter(m => !m.pol || !m.pol.id).length,
      /* 지급 방식 */
      actual: M.filter(m => m.pay === 'ACTUAL').length,
      daily: M.filter(m => m.pay === 'DAILY').length,
      /* KB 표준담보명으로 알아본 것들 — 괄호가 껴도 놓치지 않는가 */
      silIn: std('상해(일반상해'), silOut: std('질병(전체질병'),
      surgEtc: std('치주질환수술'), hosEtc: std('턱관절장애입원'),
      silson: M.filter(m => m.cat === 'SILSON').length,
      /* 납입완료 계약의 보험료가 전·후 모두 0 인가 */
      premB: frPrem().beforeWon,
      /* 화면 */
      onScreen: mk.indexOf('KB 보장분석') >= 0,
      idleSays: idle.indexOf('넣어 두셨습니다') >= 0,
      canClear: idle.indexOf('frKbClear') >= 0,
      preview: frKbPreviewHtml(K, 't.pdf')
    };
  }, DOC);
  is(flow.merged === 12 && flow.covs === 12 && flow.pols === 6,
     'KB 로 읽은 계약 <b>' + flow.pols + '건</b> · 담보 <b>' + flow.covs + '개</b>가 그대로 얹힌다');
  is(flow.lost === 0 && flow.master === 12,
     '읽은 담보가 <b>하나도 사라지지 않는다</b> — 표에 ' + flow.master + '개가 전부 선다');
  is(flow.twice === flow.master,
     '두 번 얹어도 <b>두 벌이 되지 않는다</b> (' + flow.twice + ')');
  is(flow.orphan === 0,
     '담보가 <b>제 계약에 붙는다</b> — 떠도는 담보 ' + flow.orphan + '개');
  is(flow.actual === 3 && flow.daily === 2,
     '실손(' + flow.actual + ') · 일당(' + flow.daily + ')을 <b>갈라 본다</b> — 하루치를 목돈으로 세지 않는다');
  is(flow.silIn === '실손 입원의료비' && flow.silOut === '실손 통원의료비',
     'KB 표준담보명에 <b>괄호가 껴도</b> 실손을 알아본다 — 「상해(일반상해…)입원의료비」 → ' + flow.silIn);
  is(flow.surgEtc === '기타 수술비' && flow.hosEtc === '기타 입원일당',
     'KB 가 「기타수술」·「기타입원일당」이라 적어 준 것도 <b>알아듣는다</b>');
  is(flow.premB === 48728 + 66434 + 500000 + 500000,
     '납입완료 계약(삼성 136,200원)과 보험료미제공은 <b>합계에 안 넣는다</b> (' + flow.premB + '원)');
  is(flow.onScreen && flow.idleSays && flow.canClear,
     '전 · 후 만들기 화면에 <b>서고</b>, 넣은 것을 <b>도로 뺄 수</b> 있다');
  is(flow.preview.indexOf('정확히 같습니다') >= 0 || flow.preview.indexOf('건이 다릅니다') >= 0,
     '넣기 전에 <b>두 출처를 맞춰 본 결과</b>를 보여 준다');

  is(errs.length === 0, '화면을 여는 동안 오류가 나지 않는다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데가 걸렸습니다.')
                  : 'KB 리더 점검 통과 — 한 글자도 짐작하지 않습니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
