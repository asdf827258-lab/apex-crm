/* 계산기(app/finance.html)가 세금 혜택을 <b>단정</b>하지 않는가 (판 X147).

   사장님 말씀 2026-10-20 「응」 — 계산기의 비과세 단정 문구를 고치라는 말씀.
   CLAUDE.md 2번 「세금은 언제나 조건부」 를 계산기가 어기고 있었습니다.

       「10년 이상 유지 시 비과세가 적용됩니다」
       「10년을 넘기면 세금이 0원이 됩니다」
       「보험차익 전액 비과세 … 건강보험료 부과 제외」
       「비과세 한도 200만원(서민·농어민 400만원)」 · 「세액공제 최대 148.5만원」

   앞의 셋은 <b>결론</b>입니다. 요건 하나(유지 기간·납입 모양·한도)가 어긋나면 고객
   앞에서 그 문장이 거짓이 됩니다. 뒤의 둘은 <b>시행령 숫자</b>입니다. 개정되면 바뀌는
   값을 외워 적으면, 이 자리에서 가장 위험한 말이 됩니다.

   여기서 못 박는 것 —
     가. 비과세·「세금이 0」·건보료 제외를 말하는 줄에 「요건」 이 함께 있나
         (같은 줄에 없으면 빨간불 · 칸 이름뿐인 줄은 아래 LABEL 에 하나씩 적어 뺍니다)
     나. 비과세·세액공제·한도 옆에 「N만원」 같은 한도 숫자가 적혀 있지 않나
         (칸 이름과 값이 다른 줄에 있는 타일도 보도록 앞 네 줄까지 붙여 봅니다)
     다. 연금 수령·잠금 나이(「55세까지 잠깁니다」)를 숫자로 적지 않나

   ⚠ 계산에 쓰는 수(Math.min(…, 900) 등)는 보지 않습니다 — 글자만 봅니다.
   ⚠ 15.4% 같은 <b>세율</b>은 이 자의 대상이 아닙니다 — 한도·나이만 봅니다.
   ⚠ 헛것을 잡으면 사람이 자를 안 믿습니다(8번). 넓게 잡지 말고, 예외는 LABEL 에
     정확한 글자로 적습니다.                                                       */
const fs = require('fs'), path = require('path');

const FILE = process.argv[2] || path.join(__dirname, '..', 'app', 'finance.html');
const raw = fs.readFileSync(FILE, 'utf8');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* 주석은 줄 수를 그대로 둔 채 지웁니다 — 줄 번호가 원문과 맞아야 고칠 자리를 찾습니다 */
const keepLines = (m) => m.replace(/[^\n]/g, ' ');
const src = raw
  .replace(/\/\*[\s\S]*?\*\//g, keepLines)
  .replace(/<!--[\s\S]*?-->/g, keepLines);
const lines = src.split('\n').map((l) => /^\s*\/\//.test(l) ? '' : l);
const text = lines.map((l) => l.replace(/<[^>]*>/g, ''));   // 꼬리표를 벗긴 글

/* 칸 이름뿐인 자리 — 결론이 아니라 「무엇을 적는 칸인가」 를 말합니다.
   이 글자를 지운 뒤에 단정 꼴을 찾습니다. 한 줄에 하나씩, 정확한 글자로.            */
const LABEL = [
  '달러·변액(비과세)/월',          // 입력 칸 이름 — 계산기 왼쪽 저축 칸 (s_taxfree)
  '달러/변액(비과세)/월',          // 입력 칸 이름 — 재무 질문지의 같은 칸 (ff_taxfree)
];

/* 가. 단정 꼴 — 이 글이 있는 줄은 「요건」 을 함께 적어야 합니다 */
const ASSERT = [
  [/비과세(가 적용|가 됩니다|가 되는|입니다|이라|라서|라 |됩니다|적용|\)|\.)/, '비과세를 결론으로 말함'],
  [/전액 비과세/,                          '「전액 비과세」'],
  [/세금이 0|세금 0원|과세 0원/,            '「세금이 0」'],
  [/세금이 (안 붙|붙지 않)|세금 없이/,      '「세금이 안 붙는다」'],
  [/(유지(하면|시)|넘기면|견디면)[^'"`]{0,25}비과세/, '「N년 유지하면 비과세」'],
  [/(건보료|건강보험료)[^'"`]{0,20}(제외|안 잡|잡히지 않|미산입|빠집|안 붙|반영 안)/, '건보료 제외를 결론으로 말함'],
  [/비켜 갑/,                              '「세금도 건보료도 비켜 간다」'],
];

head('가. 세금 혜택을 말하는 줄에 「요건」 이 함께 있나 (CLAUDE.md 2번)');
let hitA = 0, seenA = 0;
text.forEach((t0, i) => {
  let t = t0;
  LABEL.forEach((s) => { t = t.split(s).join(''); });
  const why = ASSERT.filter(([re]) => re.test(t)).map(([, w]) => w);
  if (!why.length) return;
  seenA++;
  if (/요건/.test(t)) return;
  hitA++;
  is(false, (i + 1) + '행 · ' + why.join(' · ') + ' — 「요건 충족 시」 가 없습니다\n      ' +
    t.trim().slice(0, 140));
});
is(seenA > 0, '단정 꼴을 찾는 자가 무언가를 보고 있다 (' + seenA + '줄 — 0이면 이 자는 아무것도 안 잽니다)');
if (!hitA) is(true, '세금 혜택을 말하는 ' + seenA + '줄 모두 「요건」 을 함께 적었다');

/* 나. 한도 숫자 — 「N만원」 「N천만」 「N억」 */
const NUM = String.raw`\d[\d,.~]*\s*(?:만원|천만|만(?=[\s)\]+·,=]|$))`;
const LIMIT = [
  [new RegExp('한도[^\\n]{0,20}?' + NUM),          '한도 옆 금액'],
  [new RegExp(NUM + '[^\\n]{0,10}?(세액공제|환급|비과세)'), '금액 + 세액공제·환급·비과세'],
  [new RegExp('(세액공제|비과세)[^\\n]{0,15}?' + NUM), '세액공제·비과세 + 금액'],
  [/2,?000만[^\n]{0,6}비과세|연 2천만/,             'ISA 한도 금액'],
];
head('나. 비과세·세액공제·한도 옆에 시행령 금액을 적지 않았나 (CLAUDE.md 2번)');
let hitB = 0;
const reported = new Set();
text.forEach((t, i) => {
  /* 타일은 칸 이름(「세액공제 한도」)과 값(「900만원」)이 다른 줄에 있습니다 — 앞 네 줄을 붙여 봅니다 */
  const cur = t.trim();
  const win = text.slice(Math.max(0, i - 4), i).map((s) => s.trim()).concat(cur).join(' ');
  LIMIT.forEach(([re, w]) => {
    let m = t.match(re);
    if (!m && /만원|천만/.test(t)) {
      /* 붙인 글에서 찾되, 그 금액이 <b>이 줄</b>에 걸쳐 있을 때만 — 앞줄 것은 앞줄에서 이미 말했습니다 */
      const wm = new RegExp(re.source, 'g');
      let x;
      while ((x = wm.exec(win))) {
        if (x.index + x[0].length > win.length - cur.length) { m = x; break; }
        if (!x[0].length) wm.lastIndex++;
      }
    }
    if (!m) return;
    const key = (i + 1) + w;
    if (reported.has(key)) return;
    reported.add(key); hitB++;
    is(false, (i + 1) + '행 · ' + w + ' — 「' + m[0].slice(0, 60) + '」');
  });
});
if (!hitB) is(true, '한도 금액을 글자로 적은 자리가 없다');

head('다. 연금 수령·잠금 나이를 숫자로 적지 않았나 (CLAUDE.md 2번)');
let hitC = 0;
text.forEach((t, i) => {
  const m = t.match(/\d{2}세\s*(까지|이후|부터)[^'"`\n]{0,12}(잠|연금)/);
  if (m) { hitC++; is(false, (i + 1) + '행 · 「' + m[0] + '」'); }
});
if (!hitC) is(true, '연금 나이를 숫자로 적은 자리가 없다');

console.log(bad ? '\n✗ ' + bad + '곳이 세금을 단정하거나 한도 숫자를 적습니다'
               : '\n✓ 계산기가 세금을 단정하지 않습니다 — 요건만 보여 줍니다');
process.exit(bad ? 1 : 0);
