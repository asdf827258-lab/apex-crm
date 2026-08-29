/* <b>미끼 레이더 — 용어 사전과 신제품 룰 보강.</b>

   신제품이 나올 때마다 정규식을 손으로 쓰면 유지가 안 됩니다. 그래서
   <b>판정이 못 읽은 항목</b>을 약관이 알려 주고, 문장을 고르고 유리·불리만
   누르면 룰이 만들어지게 했습니다. 여기서 두 가지를 봅니다.

   <b>위험한 자리는 명확합니다.</b> 룰을 만드는 재료가 <b>면책 조항</b>이면,
   「보험금을 지급하지 않는 사유」에 적힌 담보 이름을 <b>장점</b>으로 읽는
   룰이 태어납니다. 고객 앞에서 <b>없는 보장을 있다고</b> 말하게 되는
   자리라, 숫자가 조금 틀린 것과 다릅니다. (CLAUDE.md 1번)
   같은 이유로 <b>목차</b>도 재료가 되면 안 됩니다 — 조 제목에 담보 이름이
   그대로 있어서, 안 걸러내면 근거가 목차에서 나옵니다.

   여기서 확인합니다.
     1. 용어 사전이 서는가 · 약관에서 그 말의 자리를 찾아 주는가
     2. 후보 문장에서 <b>면책·목차를 빼는가</b> · 정의 조문은 뒤로 미루는가
     3. 만들어진 룰이 <b>그 회사에서만</b> 걸리는 모양이 아닌가
        (조문 번호를 안 넣는가 · 숫자를 낱자로 안 푸는가)
     4. 화면에 찍힌 <b>「몇 곳」이 실제와 같은가</b> — 면책은 빼고 세는가 (4번)
     5. 붙인 룰이 <b>실제로 판정에 반영</b>되는가 · 되돌리면 <b>원래대로</b> 오는가
     6. <b>헛알람이 없는가</b> — 붙인 룰이 없으면 원래 판정과 한 글자도 안 다른가
     7. 판정하는 곳이 <b>하나</b>인가 — judgeOne 이라는 죽은 판을 되살리지 않았는가  */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  const ct = /\.json$/.test(f) ? 'application/json' : 'text/html';
  rs.writeHead(200, { 'Content-Type': ct + '; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 실제 서식 그대로 — 목차가 앞에 오고, 면책이 지급보다 먼저 오고,
   면책 조항 안에 감액 문구와 <b>같은 말</b>이 들어 있다.
   신제품이라 「2년 미만 · 100분의 30」 이라 원래 룰에 안 걸린다. */
const DOC = '[[p1]] 목 차\n' +
  '제3조(보험금의 지급사유) ................ 5\n' +
  '제4조(보험금을 지급하지 않는 사유) ...... 7\n' +
  '제5조(감액지급) ......................... 9\n' +
  '제20조(뇌혈관질환 진단보험금) ........... 25\n' +
  '[[p3]] 제1조(용어의 정의) 이 약관에서 「유사암」 이란 기타피부암, 갑상선암, 제자리암 및 ' +
  '경계성종양을 말하며 계약일부터 2년 미만에 진단확정된 경우를 포함합니다.\n' +
  '[[p5]] 제3조(보험금의 지급사유) 회사는 피보험자가 암으로 진단확정된 경우 암진단보험금을 지급합니다.\n' +
  '[[p7]] 제4조(보험금을 지급하지 않는 사유) 회사는 다음의 경우에는 보험금을 지급하지 않습니다. ' +
  '계약일부터 2년 미만에 암으로 진단확정되어 약정한 암 보험금의 100분의 30에 해당하는 금액이 이미 지급된 경우.\n' +
  '[[p9]] 제5조(감액지급) 계약일부터 2년 미만에 암으로 진단확정된 경우에는 약정한 암 보험금의 ' +
  '100분의 30을 지급합니다.\n' +
  '[[p25]] 제20조(뇌혈관질환 진단보험금) 회사는 뇌혈관질환(I60~I69)으로 진단확정된 경우 보험금을 지급합니다.\n';

/* 보험과 아무 상관 없는 글 — 여기 걸리면 헛알람이다 */
const JUNK = '오늘 회사 회의에서 3분기 매출을 검토했습니다. 담당자는 다음 주까지 자료를 정리해 ' +
  '제출하기로 했습니다. 회의는 오후 2시에 시작해 한 시간 만에 끝났습니다.';

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port +
    '/app/' + encodeURIComponent('상담자료') + '/' + encodeURIComponent('미끼레이더') + '/index.html';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 180)));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  await page.evaluate(() => { try { localStorage.removeItem('mikki_ext'); } catch (e) { } });

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[1] 용어 사전이 선다 · 약관에서 그 말의 자리를 찾아 준다');
  const g = await page.evaluate((doc) => {
    document.querySelector('#jTaA').value = doc;
    document.querySelector('#jCoA').value = '견본';
    document.querySelector('#jNmA').value = '견본약관';
    const i = YGLOSS.findIndex(x => /유사암/.test(x.t));
    ykFindTerm(i);
    const out = document.querySelector('#ykFindOut').textContent;
    return { n: YGLOSS.length, cats: YCATS.length, term: YGLOSS[i] ? YGLOSS[i].t : '',
             found: /곳/.test(out) && !/없음/.test(out), src: /쪽/.test(out),
             tabs: [...document.querySelectorAll('.tab')].map(t => t.dataset.t) };
  }, DOC);
  is(g.n >= 40, '  용어가 <b>' + g.n + '개</b> 실려 있다 (' + g.cats + '개 갈래)');
  is(g.tabs.includes('gloss') && g.tabs.includes('newrule'),
     '  📜 약관 묶음에 <b>용어 사전 · 신제품 룰 보강</b> 두 칸이 있다');
  is(g.found, '  약관에서 「' + g.term + '」 의 자리를 찾는다');
  is(g.src, '  <b>몇 조 · 몇 쪽</b>인지 같이 적는다 — 고객 앞에서 펼칠 수 있어야 한다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[2] 룰의 재료로 면책·목차를 쓰지 않는다');
  const cand = await page.evaluate((doc) => {
    const rule = RUBRIC.find(r => r.c === '암' && /감액/.test(r.k));
    const list = mSentences(doc, '암');
    const deny = mkDenyRanges(doc), soft = mkSoftRanges(doc);
    return {
      k: rule ? rule.k : '(없음)',
      texts: list.map(o => o.s.slice(0, 26)),
      anyDeny: list.some(o => mkInDeny(deny, o.abs)),
      anyToc: list.some(o => /[.·…]{5,}\s*\d{1,3}\s*$/.test(o.s)),
      softLast: (() => {
        const sorted = list.slice().sort((a, b) => (a.soft ? 1 : 0) - (b.soft ? 1 : 0));
        return sorted.length ? !!sorted[sorted.length - 1].soft : false;
      })(),
      hasPay: list.some(o => /감액지급/.test(o.art)),
      /* 면책 범위는 여럿이다 (목차 줄도 「지급하지 않는 사유」 라 걸린다).
         첫 범위만 보면 함정인지 못 잰다 — 어느 하나에라도 들어 있으면 된다. */
      denyHasWords: deny.some(r => /100\s*분의\s*30/.test(doc.slice(r[0], r[1])))
    };
  }, DOC);
  is(cand.denyHasWords,
     '  견본이 <b>제대로 함정</b>이다 — 면책 조항 안에 감액과 같은 말이 들어 있다');
  is(!cand.anyDeny, '  <b>면책 조항 문장이 후보에 없다</b> — 없는 보장을 만들지 않는다');
  is(!cand.anyToc, '  <b>목차 줄이 후보에 없다</b> — 근거가 목차에서 나오지 않는다');
  is(cand.hasPay, '  진짜 <b>감액지급 조문</b>은 후보에 있다 — 헛되이 다 버리지 않았다');
  is(cand.softLast, '  「용어의 정의」 조문은 버리지 않고 <b>뒤로</b> 미룬다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[3] 만들어진 룰이 그 회사에서만 걸리는 모양이 아니다');
  const pat = await page.evaluate((doc) => {
    const sent = '제5조(감액지급) 계약일부터 2년 미만에 암으로 진단확정된 경우에는 ' +
                 '약정한 암 보험금의 100분의 30을 지급합니다.';
    const toks = mTokens(sent, doc);
    const auto = toks.slice().sort((a, b) => b.score - a.score).filter(t => !t.stop).slice(0, 3).map(t => t.w);
    const inOrder = toks.filter(t => auto.indexOf(t.w) >= 0).map(t => t.w);
    return { toks: toks.map(t => t.w), auto: inOrder,
             gap: mAutoGap(inOrder, sent), pat: mPattern(inOrder, mAutoGap(inOrder, sent)) };
  }, DOC);
  is(!pat.toks.some(w => /^제?\d{1,3}(조|항|호|목|관|절|장)/.test(w)),
     '  <b>조문 번호를 낱말로 쓰지 않는다</b> — 회사마다 조 번호가 다르다');
  is(!/\d\\s\*\d/.test(pat.pat),
     '  <b>숫자를 낱자로 풀지 않는다</b> — 100 을 1\\s*0\\s*0 으로 풀면 130·300 에도 걸린다');
  is(/\\s\*/.test(pat.pat),
     '  한글 사이는 띄어쓰기를 허용한다 — 약관마다 띄어쓰기가 다르다');
  is(new RegExp(pat.pat).test(DOC),
     '  만든 룰이 <b>고른 그 문장에 실제로 걸린다</b> — ' + pat.pat.slice(0, 60));

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[4] 화면에 찍힌 「몇 곳」이 실제와 같다');
  /* 계산을 여기서 다시 하지 않는다. <b>실제 화면을 눌러</b> 찍힌 글자를 읽는다 —
     그래야 「집계는 맞는데 화면에 다른 수가 나오는」 자리를 잡는다. */
  const ui = await page.evaluate((doc) => {
    try { localStorage.removeItem('mikki_ext'); } catch (e) { }
    MEXT.alts = []; MEXT.news = []; mSave();
    document.querySelector('#jCoA').value = '견본';
    document.querySelector('#jNmA').value = '견본약관';
    document.querySelector('#jTaA').value = doc;
    [...document.querySelectorAll('.tab')].forEach(t => { if (t.dataset.t === 'newrule') t.click(); });
    mRender();
    document.querySelector('#mrScan').click();
    const ix = MR.rows.findIndex(o => o.r.c === '암' && /감액/.test(o.r.k));
    if (ix < 0) return { miss: true };
    document.querySelector('#mrOut [data-mrc="' + ix + '"]').click();
    const cands = [...document.querySelectorAll('#mrEd .yk-q')].map(e => e.textContent);
    document.querySelector('#mrEd [data-mb="0"]').click();
    const t = document.querySelector('#mrEd').textContent.replace(/\s+/g, ' ');
    return { miss: false, one: /고른 약관 1곳/.test(t), two: /고른 약관 2곳/.test(t),
             said: /면책 1곳은 뺌/.test(t), first: (cands[0] || '').slice(0, 30) };
  }, DOC);
  is(!ui.miss, '  「자료에 없음」 목록에 <b>암 · 감액기간</b>이 올라온다');
  is(/감액지급/.test(ui.first), '  첫 후보가 <b>감액지급 조문</b>이다 — ' + ui.first);
  is(ui.one && !ui.two, '  화면이 <b>1곳</b>이라고 찍는다 — 면책까지 세어 2곳이라 하지 않는다');
  is(ui.said, '  <b>「면책 1곳은 뺌」</b> 이라고 적는다 — 말없이 버리지 않는다');

  console.log('\n[5] 붙인 룰이 판정에 반영된다 · 되돌리면 원래대로 온다');
  const flow = await page.evaluate(([doc, p]) => {
    MEXT.alts = []; MEXT.news = []; mSave();
    const key = r => r.c === '암' && /감액/.test(r.k);
    const K = RUBRIC.find(key).k;
    const before = judgePrecise(doc, {}).rows.find(key).v;

    MEXT.alts.push({ c: '암', k: K, side: 'b', pat: p, at: '' });
    mSave();
    const after = judgePrecise(doc, {}).rows.find(key);

    /* <b>붙인 룰이 안전장치를 통과하지 못하는가.</b>
       면책 조항 <b>안에만</b> 있는 말로 「유리」 룰을 만들어 본다.
       findIn 이 want='good' 일 때 면책을 피하므로 <b>유리로 서면 안 된다</b> —
       「면책 조항에서만 나옴」 으로 남아야 한다. 확장이 이 문을 열어 주면
       고객 앞에서 없는 보장을 있다고 말하게 된다. */
    MEXT.alts = [{ c: '암', k: K, side: 'g', pat: '2\\s*년[^\\n.]{0,60}이미\\s*지급된', at: '' }];
    mSave();
    const forced = judgePrecise(doc, {}).rows.find(key);

    MEXT.alts = []; MEXT.news = []; mSave();
    const undone = judgePrecise(doc, {}).rows.find(key).v;
    return { before, after: after.v, art: (after.ev || {}).art || '',
             forcedV: forced.v, forcedLab: forced.lab, undone };
  }, [DOC, pat.pat]);
  is(flow.before === 'none', '  붙이기 전 — <b>자료에 없음</b> (신제품이라 옛 룰에 안 걸린다)');
  is(flow.after === 'bad', '  붙인 뒤 — <b>불리</b>로 읽는다 (' + flow.after + ')');
  /* 불리는 면책 조항에 있는 것이 제자리라 findIn 이 안 피한다 — 그것을 그대로 잰다.
     여기서 「감액지급 조문이어야 한다」 고 우기면 <b>헛것을 잡는 점검</b>이 된다. (8번) */
  is(!!flow.art, '  근거 조문을 <b>적어 준다</b> — ' + flow.art);
  is(flow.forcedV !== 'good' && /면책/.test(flow.forcedLab),
     '  <b>면책에만 있는 말로 「유리」 룰을 붙여도 유리로 서지 않는다</b> — ' + flow.forcedLab);
  is(flow.undone === 'none', '  되돌리면 <b>원래대로</b> 온다 — 흔적이 안 남는다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[6] 헛알람이 없다');
  const quiet = await page.evaluate(([doc, junk]) => {
    const ext = MEXT.alts.length + MEXT.news.length;
    const j = judgePrecise(junk, {});
    /* MBASE 를 되쌓은 RUBRIC 이 원본과 같은 모양인가 — 정규식 문자열로 견준다 */
    const shape = RUBRIC.map(r => [r.c, r.k, r.w,
      r.g ? r.g.re.source : '', r.b ? r.b.re.source : '', r.m ? r.m.re.source : ''].join('§'));
    const baseShape = MBASE.map(o => [o.c, o.k, o.w,
      o.g ? o.g.s : '', o.b ? o.b.s : '', o.m ? o.m.s : ''].join('§'));
    return { ext, junkAll: j.rows.every(r => r.v === 'none'), junkTox: j.tox.length,
             same: JSON.stringify(shape) === JSON.stringify(baseShape), n: RUBRIC.length };
  }, [DOC, JUNK]);
  is(quiet.ext === 0, '  붙인 룰이 없는 상태다');
  is(quiet.same,
     '  룰이 없으면 판정표가 <b>원본과 한 글자도 안 다르다</b> (' + quiet.n + '항목)');
  is(quiet.junkAll && quiet.junkTox === 0,
     '  보험과 상관없는 글에는 <b>하나도 안 걸린다</b>');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[7] 판정하는 곳이 하나다');
  const one = fs.readFileSync(path.join(ROOT, 'app/상담자료/미끼레이더/index.html'), 'utf8');
  is(!/function\s+judgeOne\s*\(/.test(one) && !/window\.judgeOne\s*=/.test(one),
     '  <b>judgeOne 이라는 죽은 판을 되살리지 않았다</b> — judgePrecise 하나뿐이다');
  is((one.match(/const\s+MBASE\s*=/g) || []).length === 1,
     '  원본 룰을 떠 두는 자리가 <b>하나</b>다');
  is(errs.length === 0, '  화면에 스크립트 오류가 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '✗ ' + bad + '군데 — 위를 보십시오.'
                  : '용어 사전·룰 보강 점검 통과 — 면책을 장점으로 읽지 않습니다.');
  process.exit(bad ? 1 : 0);
})();
