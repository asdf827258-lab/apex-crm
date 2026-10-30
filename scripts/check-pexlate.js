/* ══════════════════════════════════════════════════════════════════
   check-pexlate.js — 홈 <b>📊 상담현황</b> 카드가 <b>없는 숫자를 적지 않고,
   멈춘 분을 숨기지 않나.</b>

   사장님 말씀 (2026-10-12) — <b>「팀원들 ap/pc 관리 업적관리는 잘 돌아가고
   있니」</b>. 짐작하지 않고 서버를 세어 봤고, <b>둘</b>이 나왔습니다 —

   ── ① <b>「0원」 이라고 적고 있었습니다</b> ───────────────────────────
   dbs <b>1,676줄 전부</b> 금액 칸(expect_premium·contract_premium)이 비어
   있는데 홈은 「이번 달 <b>0원</b>(14건)」 이라고 적고 있었습니다.
   <b>14건 계약하고 업적이 0원</b> 이라는 뜻으로 읽힙니다 (1번). 바로 아래
   ※ 에 「금액 안 적힌 217건은 안 셌습니다」 가 붙어 있었지만 눈은 큰 수를
   먼저 읽습니다. 합이 0 인 것과 <b>금액을 모르는 것</b>은 다릅니다.
   ⚠ 그런데 <b>건이 아예 없는 달</b>에는 「0원」 이 참입니다 — 거기에
     「안 적으셨습니다」 라고 적으면 그것도 거짓입니다. 가르는 자는
     <b>APEX_PEX.amtKnown 하나</b>입니다 (5번).

   ── ② <b>약속이 지난 분을 아무도 안 말했습니다</b> ───────────────────
   AP·PC·CS <b>188건</b> 가운데 약속이 <b>앞으로</b> 잡힌 것이 <b>셋</b>뿐이고
   <b>142건</b>이 날짜가 지나 있었습니다(가장 오래된 것 6월 9일 · CS 25건은
   <b>전부</b> 한 달 넘게 지났습니다). 단계만 남고 다음 약속이 안 잡힌
   것인데, 화면에 그 말을 하는 자리가 <b>한 곳도 없었습니다.</b>

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ 금액이 <b>한 건도 안 적혔으면</b> 「금액 안 적힘」 이라 적고
         <b>「0원」 을 한 자도 안 적는다</b> (1번) · 건수는 그대로 적는다
     [2] ★★ 하나라도 적혀 있으면 <b>금액을 적는다</b> — 안 그러면 적어도
         안 보여 사장님이 적기를 그만두십니다 (8번 · 헛것 금지)
     [3] ★★ 건이 <b>아예 없으면 0원이 참</b>이다 — 거기까지 가리면 거짓
     [4] ★ 셋이 다 못 적는 상태면 <b>어디서 적는지</b> 말한다 (6번)
     [5] ★★ <b>약속이 지난 분</b> 줄이 서고 그 수가 arApptPast 와 같다 (5번)
     [6] ★★ <b>AP·PC·CS 만</b> 센다 — 계약완료·증권전달은 약속이 지난 것이
         정상이라(이미 만나 계약하셨습니다) 세면 챙길 필요 없는 분이 섞인다
     [7] ★★ 약속이 <b>없는 분</b>은 안 센다 (1번) · <b>오래된 분이 맨 앞</b>
     [8] ★★ 이름을 <b>가린다</b> (3번) · 지난 분이 없으면 <b>줄을 안 세운다</b>
     [9] ★ 서버를 더 안 부른다 (7번) · 카드가 <b>안 불어난다</b>

   ── 시계 ──────────────────────────────────────────────────────────
   ★ <b>박습니다.</b> 「약속이 지났나」 는 오늘이 언제인지에 달려 있어,
     못 안 박으면 CI 가 도는 날에 따라 수가 바뀝니다. 박는 자리는
     <b>lib-clock 한 곳</b>입니다 (5번 · 판 X83).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const CLK = require('./lib-clock.js');

/* 박는 때 — 아래에서 「오늘」 을 셀 때도 <b>이 한 수</b>를 씁니다 (5번) */
const 박는때 = 14;
const 오늘 = CLK.kstDay(박는때);
const 며칠뒤 = (n) => CLK.kstDay(박는때, n);

const ROOT = path.resolve(__dirname, '..'), PORT = 8973;
const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
let hits = 0;
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{"key":null,"has":false}'); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', user_id: 'me', name: '홍길동', role: 'owner', active: true, plan: 'vip' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function (m) { window.__T = m; };
  window.setupDone = function () { return true; };
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = [];
  CM.loaded = true; CM.meta = {};
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.calls = []; AR.db = [];
  AR.noPex = false; AR.noLink = false;
};

/* ★ <b>앱이 실제로 만드는 꼴 그대로</b> 심습니다 — arDbCalc 가 돌려주는 줄입니다.
   꼴이 틀리면 자가 <b>앱이 안 쓰는 길</b>을 재게 됩니다 (판 X88 에서 두 번 틀렸습니다). */
const PUT = (rows) => {
  AR.db = rows.map(r => ({
    id: r.id, who: r.who || 'me', name: r.name || '홍길동', region: '순천', src: '일반',
    stage: r.stage, expect: r.expect, contract: r.contract, closed: r.closed || '',
    cAt: r.cAt || '', pAt: '', got: '2026-06-01', n: 1, last: '', res: '미진행',
    client_id: undefined, appt: r.appt || '', memo: '', days: r.days == null ? 10 : r.days }));
  try { renderHome(); } catch (e) {}
};

const LOOK = () => {
  try { go('home'); } catch (e) {}
  const card = document.getElementById('hmFlow');
  const 글 = card ? (card.textContent || '').replace(/\s+/g, ' ') : '';
  /* 🕗 칸은 <b>단추</b>입니다 — 다른 칩은 적어 둔 수라 span 입니다 */
  const 칩 = card ? [].slice.call(card.querySelectorAll('button.t-chip'))
    .filter(e => (e.textContent || '').indexOf('지남') >= 0)[0] : null;
  const pane = document.getElementById('dynPane');
  return {
    있나: !!card, 글: 글,
    칩글: 칩 ? (칩.textContent || '').replace(/\s+/g, ' ').trim() : '',
    칩수: 칩 ? +((칩.textContent || '').match(/\d+/) || [0])[0] : null,
    칩말: 칩 ? (칩.getAttribute('aria-label') || '') : '',
    칩높이: 칩 ? Math.round(칩.getBoundingClientRect().height) : 0,
    칩가는곳: 칩 ? (칩.getAttribute('onclick') || '') : '',
    문장: (글.match(/그중 \d+명은 약속이 지났습니다/) || [])[0] || '',
    카드: card ? Math.round(card.getBoundingClientRect().height) : 0,
    홈: pane ? Math.round(pane.scrollHeight) : 0,
    셈: (typeof pexSum === 'function') ? pexSum() : undefined,
    지난셈: (typeof arApptPast === 'function')
      ? (function () { const L = arApptPast(typeof arMyId === 'function' ? arMyId() : null);
          return L ? { n: L.length, first: L[0] ? { id: L[0].id, stage: L[0].stage } : null } : null; })()
      : undefined,
    단추: card ? [].slice.call(card.querySelectorAll('button'))
      .map(b => ({ t: (b.textContent || '').replace(/\s+/g, ' ').trim(),
                   h: Math.round(b.getBoundingClientRect().height) })) : []
  };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const errs = [];
  const ctx = await b.newContext(CLK.ctxOpt({ viewport: { width: 390, height: 844 } }));
  await CLK.pin(ctx, 박는때);
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
    hits++; return r.abort();
  });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html',
    { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => typeof renderHome === 'function' && typeof pexSum === 'function'
    && typeof arApptPast === 'function' && typeof APEX_PEX !== 'undefined', { timeout: 60000 });
  await p.evaluate(SEED);
  await p.waitForTimeout(900);
  const hits0 = hits;
  const 보기 = (rows) => p.evaluate(({ rows, put, look }) => {
    (0, eval)('(' + put + ')')(rows);
    return (0, eval)('(' + look + ')')();
  }, { rows, put: String(PUT), look: String(LOOK) });

  /* ══ [1~4] 💰 금액이 안 적혔을 때 ══════════════════════════════ */
  console.log('\n[1] 💰 <b>금액이 한 건도 안 적혔으면</b> 「0원」 을 안 적는다 (1번)');
  /* 서버에 지금 든 것 그대로 — 체결 건에 금액이 하나도 없습니다 */
  const 빈금액 = [
    { id: 'd1', stage: '계약완료', expect: null, contract: null, cAt: 오늘.slice(0, 7) + '-02' },
    { id: 'd2', stage: '계약완료', expect: null, contract: null, cAt: 오늘.slice(0, 7) + '-05' },
    { id: 'd3', stage: '증권전달', expect: null, contract: null, cAt: '2026-09-20' },
    { id: 'd4', stage: 'AP', expect: null, contract: null, appt: 며칠뒤(-40) },
    { id: 'd5', stage: 'PC', expect: null, contract: null, appt: 며칠뒤(-9) }];
  const A = await 보기(빈금액);
  is(A.있나, '  카드가 <b>선다</b> — 📊 상담현황');
  is(/이번 달 금액 안 적힘\(2건\)/.test(A.글),
     '  ★★ 이번 달 <b>「금액 안 적힘(2건)」</b> — 「0원」 이 아닙니다');
  is(/지난달 금액 안 적힘\(1건\)/.test(A.글), '  ★★ 지난달도 <b>금액 안 적힘(1건)</b>');
  is(/진행중 예상 금액 안 적힘\(2건\)/.test(A.글), '  ★★ 진행중도 <b>금액 안 적힘(2건)</b>');
  is(A.글.indexOf('0원') < 0, '  ★★ 카드에 <b>「0원」 이 한 자도 없다</b>');
  is(/금액 안 적힌 <?b?>?5건|금액 안 적힌 5건/.test(A.글.replace(/<[^>]*>/g, '')),
     '  ⚠ 몇 건이 안 적혔는지는 <b>그대로 밝힌다</b> — ' +
     ((A.글.match(/금액 안 적힌 \d+건/) || [])[0] || '없음'));

  console.log('\n[2] 💰 <b>하나라도 적혀 있으면 금액을 적는다</b> (8번 · 헛것 금지)');
  const 한건적힘 = 빈금액.map(r => (r.id === 'd1' ? Object.assign({}, r, { contract: 1200000 }) : r));
  const B = await 보기(한건적힘);
  is(/이번 달 120만원\(2건\)/.test(B.글) || /이번 달 1,200,000원\(2건\)/.test(B.글),
     '  ★★ 이번 달에 <b>금액이 선다</b> — ' + ((B.글.match(/이번 달 [^·]+/) || [])[0] || ''));
  is(/지난달 금액 안 적힘/.test(B.글),
     '  ★ 지난달은 그대로 <b>안 적힘</b> — 칸마다 따로 가릅니다');

  console.log('\n[3] 💰 <b>건이 아예 없으면 0원이 참</b>이다 (8번)');
  const 체결없음 = [{ id: 'd4', stage: 'AP', expect: 500000, contract: null, appt: 며칠뒤(-3) }];
  const C = await 보기(체결없음);
  is(/이번 달 0원\(0건\)/.test(C.글),
     '  ★★ 이번 달 <b>0원(0건)</b> — 한 건도 없으면 0원이 사실입니다 (' +
     ((C.글.match(/이번 달 [^·]+/) || [])[0] || '') + ')');
  is(/진행중 예상 50만원\(1건\)|진행중 예상 500,000원\(1건\)/.test(C.글),
     '  ★ 적힌 금액은 <b>그대로</b> 선다');

  console.log('\n[4] 💰 셋이 다 못 적는 상태면 <b>어디서 적는지</b> 말한다 (6번)');
  is(/「DB · 업적관리」 에서 예상업적을 적으시면/.test(A.글),
     '  ★ 길을 알려 준다 — 「금액 안 적힘」 만 세 번이면 고장으로 보입니다');
  is(!/「DB · 업적관리」 에서 예상업적을 적으시면/.test(C.글),
     '  ⚠ 적을 수 있는 상태에서는 <b>그 줄을 안 세운다</b> — 시끄럽습니다');

  /* ══ [5~8] 🕗 약속이 지난 분 ════════════════════════════════════ */
  console.log('\n[5] 🕗 <b>약속이 지난 분</b> 칸이 서고 수가 셈과 같다 (5번)');
  is(!!A.칩글, '  🕗 칸이 <b>선다</b> — 「' + (A.칩글 || '없음') + '」');
  is(A.지난셈 && A.지난셈.n === 2, '  셈이 <b>둘</b>이다 — ' + (A.지난셈 && A.지난셈.n));
  is(A.칩수 === (A.지난셈 && A.지난셈.n),
     '  ★★ <b>칸과 셈이 같은 수</b>다 (5번) — 칸 ' + A.칩수 + ' · 셈 ' + (A.지난셈 && A.지난셈.n));
  is(/그중 2명은 약속이 지났습니다/.test(A.글),
     '  ★★ <b>글줄도 같은 수</b>를 적는다 — 「' + A.문장 + '」');
  is(/약속 날짜가 지난 분 2명/.test(A.칩말),
     '  ★ 칸에 <b>온 말</b>이 달려 있다 (눈으로만 알아보는 칸이 아니다) — 「' + A.칩말 + '」');
  is(/hmRtPerson\('d4'\)/.test(A.칩가는곳),
     '  ★★ 누르면 <b>가장 오래된 분</b>으로 간다 — ' + A.칩가는곳);

  console.log('\n[6] 🕗 <b>AP·PC·CS 만</b> 센다');
  const 끝난것 = [
    { id: 'e1', stage: '계약완료', expect: 1000000, contract: 1000000, cAt: 오늘, appt: 며칠뒤(-50) },
    { id: 'e2', stage: '증권전달', expect: 1000000, contract: 1000000, cAt: 오늘, appt: 며칠뒤(-60) },
    { id: 'e3', stage: 'TA', expect: null, contract: null, appt: 며칠뒤(-70) },
    { id: 'e4', stage: 'CS', expect: 800000, contract: null, appt: 며칠뒤(-31) }];
  const D = await 보기(끝난것);
  is(D.지난셈 && D.지난셈.n === 1,
     '  ★★ <b>CS 하나만</b> 센다 — 계약완료·증권전달·TA 는 안 셉니다 (' +
     (D.지난셈 && D.지난셈.n) + '명)');
  is(D.칩수 === 1, '  칸도 <b>1</b> 이다 — 「' + D.칩글 + '」');
  is(D.지난셈 && D.지난셈.first && D.지난셈.first.stage === 'CS',
     '  그 하나가 <b>CS</b> 다 — ' + (D.지난셈 && D.지난셈.first && D.지난셈.first.stage));

  console.log('\n[7] 🕗 약속 <b>없는 분</b>은 안 세고, <b>오래된 분이 맨 앞</b>이다');
  const 섞음 = [
    { id: 'f1', stage: 'AP', expect: null, contract: null, appt: '' },
    { id: 'f2', stage: 'PC', expect: null, contract: null, appt: 며칠뒤(-5) },
    { id: 'f3', stage: 'AP', expect: null, contract: null, appt: 며칠뒤(-120) },
    { id: 'f4', stage: 'CS', expect: null, contract: null, appt: 며칠뒤(+3) }];
  const E = await 보기(섞음);
  is(E.지난셈 && E.지난셈.n === 2 && E.칩수 === 2,
     '  ★★ <b>둘만</b> 센다 — 약속 없는 분과 앞으로 만날 분은 빠집니다 (1번) (칸 ' +
     E.칩수 + ' · 셈 ' + (E.지난셈 && E.지난셈.n) + ')');
  is(/hmRtPerson\('f3'\)/.test(E.칩가는곳),
     '  ★ <b>120일 지난 분</b>으로 간다 — ' + E.칩가는곳);

  console.log('\n[8] 🕗 지난 분이 없으면 <b>칸을 안 세운다</b> · 이름을 안 적는다 (3번)');
  const 없음 = [{ id: 'g1', stage: 'AP', expect: null, contract: null, appt: 며칠뒤(+7) }];
  const F = await 보기(없음);
  is(!F.칩글, '  ★ 칸이 <b>안 선다</b> — 「약속지남 0」 은 적을 말이 아닙니다');
  is(!F.문장, '  글줄에도 <b>안 적는다</b>');
  is(F.있나, '  그래도 카드는 <b>선다</b>');
  is(A.글.indexOf('홍길동') < 0 && D.글.indexOf('홍길동') < 0,
     '  ★★ 카드에 <b>이름이 한 자도 없다</b> (3번) — 수와 길만 적습니다');

  /* ══ [9] 길이 · 손 · 서버 ═══════════════════════════════════════ */
  console.log('\n[9] 📏 <b>홈이 사장님 선(기본 3.56 + 무거운 씨 0.1화면) 안쪽</b>이다 · 칸이 44px · 서버를 안 부른다');
  /* ★★ <b>여기가 이 토막의 심장입니다.</b> 처음 판에서 저는 「막힌 데」 처럼
     쪽지 한 상자로 세웠고, <b>제 자는 초록</b>이었습니다 — 제 씨의 홈이
     4.16화면이었기 때문입니다. 그런데 홈 높이를 재는 check-homeone 의 씨에는
     <b>약속 날짜(appt)가 한 줄도 없어</b> 그 칸이 아예 안 서는 상태만 재고
     있었고, 사장님 서버에는 <b>142건</b>이 있습니다. 그 씨에 날짜를 심어 보니
     <b>4.20~4.21화면</b> — 사장님이 못 박으신 선을 넘었습니다 (8번 · 판
     X80·X84 에서 데인 그 자리).
     그래서 ① check-homeone 의 씨에 <b>약속 날짜를 심고</b> ② 꼴을 넷 재어
     <b>칩 「N 🕗 지남」(0px) + 있던 문장 늘리기(24px)</b> 로 바꿨습니다.
     ★ 이 자도 <b>제 씨로 한 번 더</b> 봅니다 — 지난 약속이 많은 판입니다. */
  /* ★ <b>2026-10-30 (판 X248) — 4.2 → 5.6 화면.</b> 「오늘 어디로」 가
     <b>처음부터 펴진 채로</b> 섭니다 (사장님 말씀 「내가 추천 띄우고」 ·
     「홈이 길어져도 괜찮다」). 임자는 <b>check-homeone 의 HOME_SCR</b>(4.4)
     한 곳이고, 왜 올렸는지는 거기 적혀 있습니다 — 저는 느슨하게 하지
     않았습니다 (8번).
     ⚠ <b>왜 4.4 가 아니고 5.6 인가</b> — 이 자의 씨는 <b>지난 약속 12건</b>
       입니다(위 쪽지). 그 열두 분이 한 동네에 모여 동선 칸에 <b>칩 11 · 줄
       11</b> 로 서서, 펴 둔 속만 <b>1,717px</b> 입니다. 접혀 있을 때 3.46화면
       이던 것이 <b>5.49화면</b>이 됩니다. 그래서 기본 선(4.4) 위에
       <b>무거운 씨 몫 +1.2</b> 를 둡니다 — 남은 자리 93px.
     ★ 이 수가 <b>check-homeone 보다 느슨한</b> 까닭은 씨가 다르기 때문이고,
       <b>길이의 진짜 선은 거기</b>입니다. 그쪽이 먼저 울립니다.           */
  /* ⬇ <b>2026-10-30 (판 X249) · 5.6 → 3.9 — 같은 날 크게 내렸습니다.</b>
     위 쪽지의 「동선 속만 1,717px」 가 <b>없어졌습니다</b> — 사장님께서
     「오른쪽에 조그만하게」 하셔서 걸 분 전화 줄을 접이 안으로 넣고 이름
     알약만 밖에 두었습니다. 이 무거운 씨에서도 홈이 4,637 → <b>3,091px
     (3.66화면)</b> 입니다. 기본 선(3.8) 위에 <b>무거운 씨 몫 0.1</b> 만
     남습니다. 줄였으면 눈금도 같이 내립니다 (0-1번). 남은 자리 201px. */
  /* ⬇ 판 X255 · 3.9 → 3.75 — 이 무거운 씨에서도 2,969px(3.52화면).
     기본 선(3.65) 위에 무거운 씨 몫 0.1 그대로입니다 (0-1번).
     ⬇ <b>판 X258 · 3.75 → 3.66</b> — 사장님께서 「접이로 — 머리만 두고
     접기」 를 고르셔서 📰 오늘 보낼 소식을 폰에서 접었습니다. 기본 선이
     3.65 → <b>3.56</b> 으로 0.09 내려갔으니 이 선도 그대로 0.09 내립니다 —
     무거운 씨 몫 0.1 은 건드리지 않습니다 (0-1번 · 임자는 HOME_SCR 한 곳). */
  const 선 = 3.66;
  const 많음 = [];
  for (let i = 0; i < 12; i++)
    많음.push({ id: 'h' + i, stage: ['AP', 'PC', 'CS'][i % 3],
                expect: null, contract: null, appt: 며칠뒤(-(5 + i * 9)) });
  const H = await 보기(많음);
  is(H.칩수 === 12, '  12명이 다 세어진다 — 「' + H.칩글 + '」');
  is(H.홈 / 844 <= 선,
     '  ★★ <b>홈이 ' + (H.홈 / 844).toFixed(2) + '화면</b>이다 — 선 ' + 선 +
     '화면 (' + H.홈 + 'px · 남은 자리 ' + Math.round(844 * 선 - H.홈) + 'px)');
  const G = await p.evaluate(({ rows, put }) => {
    (0, eval)('(' + put + ')')(rows);
    const 재기 = () => { try { go('home'); } catch (e) {}
      const c = document.getElementById('hmFlow');
      return c ? Math.round(c.getBoundingClientRect().height) : 0; };
    const 지금 = 재기();
    const 원 = window.arApptPast;
    window.arApptPast = function () { return []; };
    const 전 = 재기();
    window.arApptPast = 원;
    return { 전: 전, 지금: 지금, 되돌림: 재기() };
  }, { rows: 많음, put: String(PUT) });
  is(G.되돌림 === G.지금, '  재기 전후가 <b>같은 상태</b>다 — ' + G.지금 + ' · ' + G.되돌림 + 'px');
  /* ⚠ <b>같은 씨 안에서</b> 재야 합니다 — 처음 판에서 바로 앞 토막이 심어 둔
     다른 씨의 카드를 재어 「250px」 라는 말이 안 되는 수가 나왔습니다.      */
  const 더늘어도 = 40;
  is(G.지금 - G.전 >= 0 && G.지금 - G.전 <= 더늘어도,
     '  ★ 내 칸·글 몫이 <b>' + (G.지금 - G.전) + 'px</b> 다 — ' + 더늘어도 +
     'px 까지 (떼면 ' + G.전 + ' → 붙이면 ' + G.지금 + ')');
  is(H.단추.length >= 3 && H.단추.every(x => x.h >= 44),
     '  ★ 카드의 단추가 다 <b>44px 이상</b>이다 — ' +
     H.단추.map(x => x.t + ' ' + x.h).join(' · '));
  is(hits === hits0, '  🌐 <b>서버를 안 부른다</b> (7번) — 밖으로 ' + (hits - hits0) + '번');
  is(errs.length === 0, '  💥 터진 것이 없다 — ' + JSON.stringify(errs.slice(0, 3)));

  await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '가지가 어긋납니다')
                  : '\n✓ 없는 금액을 안 적고, 멈춘 분을 안 숨깁니다');
  process.exit(bad ? 1 : 0);
})();
