/* 🗺️ <b>읽은 증권을 여덟 통장으로 — 근거와 함께</b> (판 ⑦).

   목각 vKb(docs/APEX_목각.html 1145행) 의 ②읽은 담보 · ③여덟 통장 ·
   ④근거 · ⑤관리 멘트 · ⑥홈에 띄우기.

   여기서 확인합니다.
     1. ★ <b>사전이 두 벌이 아닌가</b> (5번) — 담보를 읽는 곳은
        frClassify 하나, 통장 이름은 waShort 하나. 목각의 KBMAP·WALL 을
        본체로 베껴 오지 않았는가
     2. 읽은 담보가 <b>통장으로 옮겨지는가</b>
     3. ★ <b>금액은 목돈만</b> 더하는가 — 일당·실손을 더하면 없는 숫자가
        생긴다 (1번). 못 읽은 금액을 0 으로 세지 않는가
     4. <b>해지 확정은 빼고</b>, 「해지검토」 는 남기는가
     5. ★★ <b>모름 ≠ 없음</b> (1번) — 담보를 못 읽었으면 「빈 통장 8칸」
        이라고 적지 않는가
     6. ★ <b>여덟 중 셋은 증권이 답하지 못한다</b> — 생활 · 은퇴·연금 ·
        자산이전·상속 을 「비었다」 고 적지 않는가 (1번)
     7. <b>근거</b> — 계약 · 원문 그대로 · 몇 쪽 · 어느 담보로. 원문이
        없으면 없다고 적는가. 통장에 못 넣은 담보를 조용히 버리지 않는가
     8. <b>관리 멘트</b> — 이름을 가리는가(3번) · 비율·한도·기간 숫자를
        안 적는가(2번) · 「심사 결과에 따릅니다」 가 있는가(2번)
     9. ★ <b>홈에 띄우기</b> — 빈 통장만 담고, 손으로 적어 두신 판정을
        안 덮고, 증권이 답 못 하는 셋은 손대지 않는가. 그리고 「빈 통장」
        을 답하는 곳이 <b>여전히 cmWalLow 하나</b>인가 (5번)
    10. 새 CSS 0줄 · 조용히 터진 곳 없음

   ★ 견본 이름은 <b>홍길동</b> 입니다 (3번).                            */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd();
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  await ctx.route('**://**', r =>
    r.request().url().indexOf('127.0.0.1:' + srv.address().port) >= 0 ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 170)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n🗺️ 읽은 증권을 여덟 통장으로 — 근거와 함께');

  const R = await page.evaluate(() => {
    /* ── 견본 증권 한 장 ── 금액은 <b>원</b> 입니다 (4번) */
    const COV = [
      ['일반암진단비',       30000000, 3, '3쪽 일반암진단비 3,000만원'],
      ['유사암진단비',        6000000, 3, '3쪽 유사암진단비 600만원'],
      ['뇌졸중진단비',       20000000, 3, ''],                    /* 원문 조각 없음 */
      ['질병수술비',          3000000, 4, '4쪽 질병수술비 300만원'],
      ['암직접치료비',            null, 4, '4쪽 암직접치료비 (금액 못 읽음)'],
      ['상해입원일당',          30000, 5, '5쪽 상해입원일당 3만원'],
      ['질병입원일당',          30000, 5, '5쪽 질병입원일당 3만원'],
      ['중환자실입원일당',     100000, 5, ''],
      ['실손의료비',         50000000, 6, '6쪽 실손의료비'],
      ['통원의료비',           300000, 6, ''],
      ['질병사망',          100000000, 7, '7쪽 질병사망 1억'],
      ['일반상해후유장해',   50000000, 7, ''],
      ['간병인사용입원일당',   100000, 8, '8쪽 간병인사용입원일당 10만원'],
      ['소득보상금',         12000000, 8, ''],
      ['알수없는특이담보',    1000000, 9, '9쪽 알수없는특이담보'],   /* 미분류 */
      ['장기요양간병비',     20000000, 8, '']
    ];
    const mk = (i) => ({ id: 'cv' + i, policy_id: 'p1',
      original_name: COV[i][0], normalized_name: null, category: null,
      amount: COV[i][1], payment_frequency: '', source_page: COV[i][2],
      source_text: COV[i][3], confidence: 9, verification_status: 'extracted' });
    const seed = () => {
      FR.pols = [{ id: 'p1', insurer: '홍길동생명', product_name: '건강한 백세',
                   monthly_premium: 120000, payment_term: '20년납', coverage_term: '100세',
                   renewable: false, policyholder: '홍○○', insured: '홍○○' }];
      FR.covs = COV.map((_, i) => mk(i));
      FR.state = frBlankState();
      FR.cid = 'c1'; FR.client = { id: 'c1', name: '홍길동', name_masked: '홍○○' };
      CM.loaded = true; CM.meta = {};
      OSC.loaded = true; OSC.list = [{ id: 'c1', name_masked: '홍○○' }];
    };
    seed();

    const out = {};
    /* ── [1] 사전·이름이 한 벌인가 ── */
    out.names = []; for (let n = 1; n <= 8; n++) out.names.push([frwName(n), waShort(n)]);
    out.purAll = FR_PUR.map(p => p[0]);
    out.purMapped = Object.keys(FRW_W);
    out.walVals = out.purMapped.map(k => FRW_W[k]);
    out.ask = FRW_ASK.slice(); out.unk = FRW_UNK.slice();

    /* ── [2][3] 담보가 통장으로 · 금액은 목돈만 ── */
    const M = frMaster();
    const s = frwSum(M);
    out.all = s.all; out.read = s.read; out.skipN = s.skip.length;
    out.w = {}; FRW_ASK.forEach(n => { const b = s.w[n];
      out.w[n] = { n: b.n, won: b.won, lump: b.lump, daily: b.daily, actual: b.actual }; });
    out.gap = s.gap.slice();

    /* ── [4] 해지 확정은 빼고 · 해지검토는 남는다 ── */
    const st = frState();
    st.cact = { cv10: 'CANCEL', cv11: 'REVIEW_CANCEL' };   /* 질병사망 해지 · 후유장해 해지검토 */
    const s2 = frwSum(frMaster());
    out.afterCancel = { w5: s2.w[5].n, w4: s2.w[4].n, all: s2.all };
    st.cact = {};

    /* ── [5] 모름 ≠ 없음 ── */
    const keep = FR.covs; FR.covs = [];
    const empty = frwCardHtml(frMaster());
    out.emptyCard = { txt: empty.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '),
                      said: empty.indexOf('아무 숫자도 만들지 않습니다') >= 0,
                      /* 못 읽은 판에서 <b>수를 적는 것 자체</b>가 거짓입니다 */
                      num: /\d+\s*(칸|건|개)/.test(empty.replace(/<[^>]*>/g, ' ')) };
    FR.covs = keep;

    /* ── [6][7] 카드 · 근거 ── */
    const card = frwCardHtml(frMaster());
    out.card = { len: card.length,
      txt: card.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '),
      unkSaid: FRW_UNK.every(n => card.indexOf(frwName(n)) >= 0) &&
               card.indexOf('증권으로는 알 수 없습니다') >= 0,
      pol: card.indexOf('홍길동생명') >= 0,
      raw: card.indexOf('일반암진단비') >= 0,
      /* ★ 한 쪽만 맞으면 초록이 되던 자리였습니다. <b>읽은 쪽 전부</b>를 봅니다 */
      pages: [...new Set(FR.covs.map(c => c.source_page))].map(
        n => [n, card.indexOf('<b>' + n + '쪽</b>') >= 0]),
      noSrc: card.indexOf('원문 조각이 저장되어 있지 않습니다') >= 0,
      /* ★ 합계만 보면 「못 읽은 금액을 0 으로 세기」 를 못 잡습니다 — 0 을
         더해도 합은 그대로입니다. <b>근거에 뭐라 적혔는지</b> 를 봅니다 */
      naAmt: card.indexOf('확인 필요') >= 0, zeroAmt: /0원/.test(card),
      skipSaid: card.indexOf('통장에 못 넣은 담보') >= 0,
      folded: card.indexOf('<details>') >= 0,
      cls: (card.match(/class="([^"]+)"/g) || []).join(' ') };

    /* ── [8] 관리 멘트 ── */
    const talk = frwTalk(s, frwNm());
    out.talk = { t: talk, real: talk.indexOf('홍길동') >= 0, masked: talk.indexOf('홍○○') >= 0,
      judge: talk.indexOf('심사 결과에 따릅니다') >= 0,
      pct: /\d+\s*%/.test(talk), age: /\d+\s*세/.test(talk),
      unk: FRW_UNK.every(n => talk.indexOf(frwName(n)) >= 0) };

    /* ── [9] 홈에 띄우기 ──
       ⚠ <b>빈 통장이 있는 판</b>으로 다시 씨를 뿌립니다. 다섯 자리가 다 찬
         판에서 「띄우기」 를 재면 담을 것이 없어 <b>헛초록</b>이 됩니다 (8번).
       ⚠ 그리고 <b>두 칸</b>을 비웁니다 — 하나는 사장님이 손으로 판정해
         두신 칸, 하나는 빈 칸입니다. 한 칸만 비우면 「손으로 적어 두신 것을
         안 덮는다」 를 <b>재지 못한 채</b> 초록이 됩니다 — 덮을 것이 없으니
         빗장을 떼어도 아무 일이 안 일어납니다. 되돌려 보고 알았습니다 (8번).
         간병 담보 둘과 사망 담보를 빼서 간병·요양(7)·가족보호(5) 를 비웁니다. */
    FR.covs = FR.covs.filter(c => c.original_name.indexOf('간병') < 0 &&
                                  c.original_name.indexOf('장기요양') < 0 &&
                                  c.original_name.indexOf('사망') < 0);
    const s3 = frwSum(frMaster());
    out.gap2 = s3.gap.slice();
    let patch = null;
    const realSave = window.cmSave;
    window.cmSave = function (id, p, then) {
      patch = p; const m = cmOf(id); for (const k in p) m[k] = p[k]; if (then) then();
    };
    /* 손으로 적어 두신 판정 둘을 미리 둡니다 — 이것을 덮으면 안 됩니다 */
    /* 7(간병·요양) 은 <b>증권도 비었다 하고 사장님도 판정해 두신</b> 칸입니다 —
       빗장이 실제로 막아야 하는 바로 그 자리입니다 */
    cmOf('c1').wal = { at: '2026-09-01', lv: { 4: 'ok', 6: 'low', 7: 'ok' } };
    frwPin();
    out.pin = patch;
    out.pinLow = (typeof cmWalLow === 'function') ? cmWalLow('c1') : null;
    out.lv = (patch && patch.wal && patch.wal.lv) ? patch.wal.lv : {};
    out.by = (patch && patch.wal && patch.wal.by) ? patch.wal.by : {};
    /* 한 번 더 눌러도 <b>같은 자리</b>여야 합니다 */
    frwPin();
    out.lv2 = (patch && patch.wal && patch.wal.lv) ? patch.wal.lv : {};
    window.cmSave = realSave;

    /* 화면에 실제로 붙여 본다 — 터지면 아래 [10] 이 잡습니다 */
    const box = document.createElement('div'); box.id = 'frwProbe';
    box.innerHTML = card; document.body.appendChild(box);
    out.mounted = !!document.getElementById('frwProbe');
    return out;
  });

  console.log('\n[1] ★ 사전이 두 벌이 아니다 (5번)');
  is(R.names.every(p => p[0] === p[1]),
     '  통장 이름이 <b>waShort 한 곳</b>에서 온다 — ' + R.names.map(p => p[0]).join(' · '));
  is(!/var\s+WALL\s*=/.test(SRC) && !/var\s+KBMAP\s*=/.test(SRC),
     '  목각의 <b>KBMAP · WALL</b> 을 본체로 베껴 오지 않았다 — 담보 사전은 frClassify 하나다');
  is(R.purMapped.length === R.purAll.length - 1 &&
     R.purAll.filter(k => k !== 'OTHER').every(k => R.purMapped.indexOf(k) >= 0),
     '  FR_PUR 열한 갈래 중 <b>기타만 빼고</b> 다 옮긴다 — 삼항 사슬이 아니라 표 하나다 (' +
     R.purMapped.length + '/' + (R.purAll.length - 1) + ')');
  is(R.ask.length === 5 && R.unk.length === 3 &&
     R.ask.concat(R.unk).sort().join() === '1,2,3,4,5,6,7,8' &&
     !R.ask.some(n => R.unk.indexOf(n) >= 0),
     '  <b>다섯 + 셋 = 여덟</b>, 겹치지 않는다 — 묻는 곳 ' + R.ask.join(',') + ' · 모르는 곳 ' + R.unk.join(','));

  console.log('\n[2][3] ★ 담보가 통장으로 · <b>금액은 목돈만</b> (1번)');
  is(R.read === 15 && R.skipN === 1,
     '  담보 <b>15건</b>을 통장으로 옮기고 <b>1건</b>은 못 넣었다고 적는다 — ' +
     R.read + '건 · 못 넣음 ' + R.skipN + '건');
  is(R.w[3].n === 5 && R.w[2].n === 5 && R.w[4].n === 2 && R.w[5].n === 1 && R.w[7].n === 2,
     '  통장마다 제 담보가 들어간다 — 치료비 ' + R.w[3].n + ' · 병원비 ' + R.w[2].n +
     ' · 소득공백 ' + R.w[4].n + ' · 가족보호 ' + R.w[5].n + ' · 간병 ' + R.w[7].n);
  /* 병원비 통장은 일당 셋 + 실손 둘뿐 — <b>더하면 없는 숫자가 생긴다</b> */
  is(R.w[2].won === 0 && R.w[2].daily === 3 && R.w[2].actual === 2,
     '  <b>일당·실손은 금액으로 안 더한다</b> — 병원비 통장 ' + R.w[2].won + '원 (일당 ' +
     R.w[2].daily + ' · 실손 ' + R.w[2].actual + ')');
  /* 치료비 = 일반암 3,000만 + 유사암 600만 + 뇌졸중 2,000만 + 수술 300만, 금액 못 읽은 1건 제외 */
  is(R.w[3].won === 59000000 && R.w[3].lump === 5,
     '  <b>못 읽은 금액을 0 으로 세지 않는다</b> (1번) — 치료비 목돈 5건 중 4건만 더해 ' +
     R.w[3].won + '원');

  console.log('\n[4] 해지 확정은 빼고 · <b>해지검토는 남는다</b>');
  is(R.afterCancel.w5 === 0 && R.afterCancel.w4 === 2,
     '  해지한 담보는 빠지고 <b>해지검토는 남는다</b> — 가족보호 ' + R.afterCancel.w5 +
     '건 · 소득공백 ' + R.afterCancel.w4 + '건');

  console.log('\n[5] ★★ <b>모름 ≠ 없음</b> (1번)');
  is(R.emptyCard.said && !R.emptyCard.num,
     '  못 읽었으면 <b>「아무 숫자도 만들지 않습니다」</b> — 빈 칸 수를 적지 않는다' +
     (R.emptyCard.num ? (' ← 수를 적었습니다: ' + R.emptyCard.txt.slice(0, 90)) : ''));

  console.log('\n[6] ★ <b>여덟 중 셋은 증권이 답하지 못한다</b> (1번)');
  is(R.card.unkSaid,
     '  생활 · 은퇴·연금 · 자산이전·상속 을 <b>「증권으로는 알 수 없습니다」</b> 로 적는다');
  is(R.gap.length === 0,
     '  이 견본에서는 다섯 자리가 다 찼다 — 빈 통장 ' + R.gap.length + '칸');

  console.log('\n[7] <b>근거</b> — 계약 · 원문 그대로 · 몇 쪽 · 어느 담보로');
  is(R.card.pol, '  <b>어느 계약</b>에서 나온 담보인지 적는다 — 홍길동생명');
  is(R.card.raw, '  <b>원문 담보명 그대로</b> 적는다 — 일반암진단비');
  is(R.card.pages.length > 1 && R.card.pages.every(x => x[1]),
     '  <b>읽은 쪽이 하나도 안 빠진다</b> — ' + R.card.pages.map(x => x[0] + '쪽').join(' · ') +
     (R.card.pages.some(x => !x[1])
       ? (' ← 빠진 쪽 ' + R.card.pages.filter(x => !x[1]).map(x => x[0]).join(' ')) : ''));
  is(R.card.naAmt && !R.card.zeroAmt,
     '  금액을 못 읽은 담보는 <b>「확인 필요」</b> 라고 적는다 — 「0원」 이라고 적으면 ' +
     '「보장이 없다」 는 뜻이 된다 (1번)');
  is(R.card.noSrc,
     '  원문 조각이 없으면 <b>없다고 적는다</b> — 있는 척하지 않는다 (1번)');
  is(R.card.skipSaid,
     '  통장에 못 넣은 담보를 <b>조용히 버리지 않는다</b> — 몇 건인지·왜인지 적는다');
  is(R.card.folded,
     '  근거는 <b>접어 둔다</b> — 날마다 보는 글이 아니라 따질 때 펴는 글이다');

  console.log('\n[8] <b>관리 멘트</b> — 가리고 · 숫자를 안 적고 · 조건부로');
  is(!R.talk.real && R.talk.masked,
     '  이름을 <b>가린 채로</b> 만든다 (3번) — 복사되어 밖으로 나가는 글이다');
  is(R.talk.judge, '  <b>「심사 결과에 따릅니다」</b> 를 빼지 않는다 (2번)');
  is(!R.talk.pct && !R.talk.age,
     '  <b>비율 · 나이 숫자를 안 적는다</b> (2번) — 개정되면 바뀌는 값이다');
  is(R.talk.unk, '  <b>모르는 셋</b>을 멘트에서도 모른다고 말한다 (1번)');

  console.log('\n[9] ★ <b>홈에 띄우기</b> — 빈 칸만 담고 적어 두신 것을 안 덮는다');
  is(R.gap2.length === 2 && R.gap2.join() === '5,7',
     '  씨앗에 <b>빈 통장이 둘</b> 있다 — 하나는 손으로 판정해 두신 칸이다 (8번) · ' +
     R.gap2.map(n => R.names[n - 1][0]).join(' · '));
  is(!!(R.pin && R.pin.wal && R.pin.wal.lv),
     '  <b>이미 있는 자리(client_meta.wal)</b> 에 담는다 — 새 표를 안 만든다');
  is(R.lv[5] === 'low' && R.by[5] === '증권',
     '  증권이 <b>비었다고 말한 빈 칸</b>을 담는다 — 가족보호 「' + (R.lv[5] || '—') +
     '」 · 출처 「' + (R.by[5] || '—') + '」');
  /* ★★ 여기가 빗장입니다 — 7 은 증권도 「비었다」 하고 사장님도 판정해 두신 칸 */
  is(R.lv[7] === 'ok' && !R.by[7],
     '  증권이 비었다 해도 <b>사장님이 판정해 두신 칸은 안 덮는다</b> — 간병·요양 「' +
     (R.lv[7] || '—') + '」 그대로 (출처 「' + (R.by[7] || '—') + '」)');
  is(R.lv[4] === 'ok' && !R.by[4],
     '  증권이 답한 칸도 <b>손 판정이 이긴다</b> — 소득공백 「' + (R.lv[4] || '—') + '」 그대로');
  is(R.lv[6] === 'low' && !R.by[6],
     '  증권이 답 못 하는 셋은 <b>손대지 않는다</b> — 은퇴·연금은 사람이 적어 둔 그대로');
  is(JSON.stringify(R.lv) === JSON.stringify(R.lv2),
     '  한 번 더 눌러도 <b>같은 자리</b>다 — 누를 때마다 늘어나지 않는다');
  is(Array.isArray(R.pinLow) && R.pinLow.indexOf(R.names[4][0]) >= 0 &&
     R.pinLow.indexOf(R.names[5][0]) >= 0 &&
     R.pinLow.indexOf(R.names[3][0]) < 0 && R.pinLow.indexOf(R.names[6][0]) < 0,
     '  「빈 통장」 을 답하는 곳이 <b>여전히 cmWalLow 하나</b>다 (5번) — ' +
     (R.pinLow || []).join(' · '));

  console.log('\n[10] 새 CSS 0줄 · 조용히 터진 곳이 없다');
  const used = [...new Set((R.card.cls.match(/[a-z][a-z0-9-]*/g) || [])
    .filter(c => c.indexOf('fr-') === 0 || c === 'r' || c === 'sub' || c === 'n'))];
  const miss = used.filter(c => SRC.indexOf('.' + c) < 0);
  is(miss.length === 0, '  쓴 이름 ' + used.length + '개가 <b>전부 이미 있는 것</b>이다' +
     (miss.length ? (' ← 없는 것 ' + miss.join(' · ')) : ' — ' + used.join(' · ')));
  is(R.mounted && errs.length === 0,
     '  화면에 붙여도 <b>안 터진다</b>' + (errs.length ? (' ← ' + errs[0]) : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데 — 읽지 않은 것을 통장에 적으면 고객 앞에서 무너집니다.')
                  : '✓ 읽은 증권만으로 여덟 통장을 말하고, 무엇을 보고 그렇게 읽었는지 근거를 답니다.');
  await browser.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
