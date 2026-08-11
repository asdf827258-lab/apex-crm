/* 수익률 계산 검산 — 고객에게 말할 숫자라 여기서 확실히 잡는다.

   손으로 답을 알 수 있는 문제만 골라 넣었다. 계산기가 틀리면 여기서 걸린다.
   마지막에 app/index.html 안에 넣어 둔 같은 함수들이 이 파일과
   똑같은 답을 내는지도 대조한다(두 구현이 몰래 갈라지는 것을 막는다). */

const fs = require('fs');
const path = require('path');
const P = require(path.join(process.cwd(), 'scripts/perf-core.js'));

const fail = [];
const ok = (c, m) => { if (!c) { fail.push(m); console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
const near = (a, b, tol) => a != null && b != null && Math.abs(a - b) <= (tol == null ? 1e-4 : tol);
const pct = n => n == null ? 'null' : (Math.round(n * 10000) / 100) + '%';

/* ══ 1) XIRR — 손으로 답을 아는 문제들 ═══════════════════════════════════ */
console.log('\n[1] XIRR (금액가중수익률)');

/* 100만원 넣고 1년 뒤 110만원 → 정확히 10% */
ok(near(P.xirr([{ date: '2025-01-01', amount: -1000000 }, { date: '2026-01-01', amount: 1100000 }]), 0.1, 1e-3),
  '1년에 10% 오르면 10% (' + pct(P.xirr([{ date: '2025-01-01', amount: -1000000 }, { date: '2026-01-01', amount: 1100000 }])) + ')');

/* 반년에 10% → 연환산하면 21% (1.1^2 - 1) */
const half = P.xirr([{ date: '2025-01-01', amount: -1000000 }, { date: '2025-07-02', amount: 1100000 }]);
ok(near(half, 0.21, 0.01), '반년에 10% 면 연 21% 로 환산된다 (' + pct(half) + ')');

/* 원금 그대로면 0% */
ok(near(P.xirr([{ date: '2025-01-01', amount: -1000000 }, { date: '2026-01-01', amount: 1000000 }]), 0, 1e-6),
  '원금 그대로면 0%');

/* 반토막이면 -50% */
ok(near(P.xirr([{ date: '2025-01-01', amount: -1000000 }, { date: '2026-01-01', amount: 500000 }]), -0.5, 1e-3),
  '1년에 반토막이면 -50% (' + pct(P.xirr([{ date: '2025-01-01', amount: -1000000 }, { date: '2026-01-01', amount: 500000 }])) + ')');

/* 추가납입이 있으면 단순 계산과 달라진다 — 이게 XIRR 를 쓰는 이유 */
const add = [
  { date: '2025-01-01', amount: -1000000 },
  { date: '2025-07-01', amount: -1000000 },
  { date: '2026-01-01', amount: 2200000 }
];
const addX = P.xirr(add);
const naive = (2200000 - 2000000) / 2000000;   /* 단순 계산 = 10% */
ok(addX > naive + 0.02,
  '중간에 추가납입하면 단순계산 10% 보다 XIRR 가 높다 (' + pct(addX) + ' > ' + pct(naive) + ') — 늦게 넣은 돈은 짧게 굴었으므로');

/* 순서가 뒤죽박죽이어도 같은 답 */
ok(near(P.xirr(add.slice().reverse()), addX, 1e-6), '현금흐름 순서가 뒤섞여도 같은 답');

/* 계산이 안 되는 경우는 null 을 준다 (0% 로 속이지 않는다) */
ok(P.xirr([{ date: '2025-01-01', amount: -1000000 }]) === null, '흐름이 하나뿐이면 null');
ok(P.xirr([{ date: '2025-01-01', amount: -100 }, { date: '2026-01-01', amount: -100 }]) === null, '전부 같은 부호면 null');
ok(P.xirr([]) === null, '빈 배열이면 null');

/* 전액 손실 근처에서도 죽지 않는다 */
const wipe = P.xirr([{ date: '2025-01-01', amount: -1000000 }, { date: '2026-01-01', amount: 1 }]);
ok(wipe !== null && wipe < -0.99, '거의 전손이어도 숫자를 낸다 (' + pct(wipe) + ')');

/* 여러 번 사고팔아도 수렴한다 */
const many = [];
for (let i = 0; i < 24; i++) many.push({ date: '2024-' + String((i % 12) + 1).padStart(2, '0') + '-01', amount: -100000 });
many.push({ date: '2026-01-01', amount: 2700000 });
ok(P.xirr(many) !== null, '거래 25건이어도 수렴한다 (' + pct(P.xirr(many)) + ')');

/* ══ 2) TWR — 입출금 영향을 걷어내는가 ═══════════════════════════════════ */
console.log('\n[2] TWR (시간가중수익률)');

/* 입출금 없이 100 → 110 → 121 이면 21% */
const t1 = P.twr([
  { date: '2025-01-01', value: 100, flow: 0 },
  { date: '2025-07-01', value: 110, flow: 0 },
  { date: '2026-01-01', value: 121, flow: 0 }
]);
ok(near(t1.total, 0.21, 1e-6), '입출금 없이 10%씩 두 번이면 21% (' + pct(t1.total) + ')');

/* 핵심: 중간에 100 을 더 넣어도 운용 성과는 그대로 21% 여야 한다 */
const t2 = P.twr([
  { date: '2025-01-01', value: 100, flow: 0 },
  { date: '2025-07-01', value: 210, flow: 100 },   /* 110 으로 오른 뒤 100 추가납입 */
  { date: '2026-01-01', value: 231, flow: 0 }      /* 210 → 231 = +10% */
]);
ok(near(t2.total, 0.21, 1e-6),
  '중간에 목돈을 넣어도 운용 성과는 21% 그대로 (' + pct(t2.total) + ') — 입출금 영향이 걷혔다');

/* 두 지표가 갈라지는 대표 상황 — 반토막 난 뒤에 목돈을 넣고 두 배가 된 경우.
   운용 솜씨(TWR)는 본전인데, 실제로 번 돈(XIRR)은 크다. 이 차이를 설명할 수 있어야
   고객에게 "펀드 수익률은 0%인데 왜 내 계좌는 벌었나요" 를 답할 수 있다. */
const tSplit = P.twr([
  { date: '2025-01-01', value: 100, flow: 0 },
  { date: '2025-07-01', value: 1050, flow: 1000 },   /* 100→50 (-50%) 뒤 1000 추가납입 */
  { date: '2026-01-01', value: 2100, flow: 0 }       /* 1050→2100 (+100%) */
]);
const xSplit = P.xirr([
  { date: '2025-01-01', amount: -100 },
  { date: '2025-07-01', amount: -1000 },
  { date: '2026-01-01', amount: 2100 }
]);
ok(near(tSplit.total, 0, 1e-6),
  '반토막 뒤 두 배면 운용 성과(TWR)는 0% — 제자리 (' + pct(tSplit.total) + ')');
ok(xSplit !== null && xSplit > 1.0,
  '같은 계좌의 실제 수익(XIRR)은 크게 플러스 (' + pct(xSplit) + ') — 쌀 때 목돈을 넣었으므로');
ok(Math.abs(xSplit - tSplit.total) > 0.5,
  '두 지표가 크게 갈라진다 — 목적이 다르므로 정상 (차이 ' + pct(xSplit - tSplit.total) + ')');

/* 출금도 마찬가지 */
const t3 = P.twr([
  { date: '2025-01-01', value: 100, flow: 0 },
  { date: '2025-07-01', value: 60, flow: -50 },    /* 110 으로 오른 뒤 50 인출 */
  { date: '2026-01-01', value: 66, flow: 0 }
]);
ok(near(t3.total, 0.21, 1e-6), '중간에 인출해도 21% (' + pct(t3.total) + ')');

/* 1년 미만은 연환산하지 않는다 (과대표시 방지) */
const shortT = P.twr([{ date: '2026-01-01', value: 100, flow: 0 }, { date: '2026-02-01', value: 110, flow: 0 }]);
ok(shortT.annualized === null, '1개월 성과를 연 214% 로 부풀리지 않는다 (annualized=null)');
ok(near(shortT.total, 0.1, 1e-9), '대신 누적 10% 는 그대로 보여준다');

/* 2년이면 연환산한다 */
const longT = P.twr([{ date: '2024-01-01', value: 100, flow: 0 }, { date: '2026-01-01', value: 121, flow: 0 }]);
ok(near(longT.annualized, 0.1, 0.002), '2년에 21% 면 연 10% (' + pct(longT.annualized) + ')');

ok(P.twr([{ date: '2025-01-01', value: 100 }]) === null, '점이 하나뿐이면 null');
ok(P.twr([{ date: '2025-01-01', value: 0, flow: 0 }, { date: '2026-01-01', value: 100, flow: 100 }]) === null,
  '기초가 0인 구간은 수익률을 만들지 않는다 (0 으로 나누지 않는다)');

/* ══ 3) 거래내역 → 현금흐름 ══════════════════════════════════════════════ */
console.log('\n[3] 거래내역 해석');

const txns = [
  { date: '2025-01-02', kind: 'deposit', amount: 5000000 },
  { date: '2025-01-03', kind: 'buy', amount: 3000000 },
  { date: '2025-06-10', kind: 'dividend', amount: 50000 },
  { date: '2025-09-01', kind: 'sell', amount: 1000000 },
  { date: '2025-09-02', kind: 'withdraw', amount: 500000 },
  { date: '2025-12-01', kind: 'fee', amount: 10000 }
];
const flows = P.txnsToFlows(txns, 4800000, '2026-01-01');
ok(flows.length === 7, '거래 6건 + 현재 평가액 = 흐름 7개');
ok(flows[0].amount === -5000000, '납입은 음수 (내 지갑에서 나감)');
ok(flows.filter(f => f.amount > 0 && f.amount === 50000).length === 1, '배당은 양수');
ok(flows[flows.length - 1].amount === 4800000, '마지막에 현재 평가액이 양수로 붙는다');

/* 순납입 = 넣은 돈 - 뺀 돈 */
ok(P.netInvested(txns) === (5000000 + 3000000 + 10000) - (50000 + 1000000 + 500000),
  '순납입 계산 (' + P.netInvested(txns).toLocaleString() + '원)');

/* 모르는 종류는 조용히 무시 — 틀린 숫자를 만드는 것보다 낫다 */
ok(P.txnsToFlows([{ date: '2025-01-01', kind: '???', amount: 999 }], 0).length === 0, '모르는 거래 종류는 계산에 넣지 않는다');

/* ══ 4) 자산배분 ═════════════════════════════════════════════════════════ */
console.log('\n[4] 자산배분');
const alloc = P.allocation([
  { code: '005930', assetClass: '국내주식', value: 5000000 },
  { code: '000660', assetClass: '국내주식', value: 3000000 },
  { code: '360750', assetClass: '해외주식', value: 2000000 }
]);
ok(alloc.total === 10000000, '합계 1,000만원');
ok(alloc.list[0].cls === '국내주식' && near(alloc.list[0].pct, 80, 1e-6), '국내주식 80% (같은 자산군은 합친다)');
ok(near(alloc.list[1].pct, 20, 1e-6), '해외주식 20%');
ok(P.allocation([]).total === 0, '보유가 없으면 0');
ok(P.allocation([{ assetClass: 'x', value: -5 }]).total === 0, '음수 평가액은 무시');

/* ══ 5) 리밸런싱 ═════════════════════════════════════════════════════════ */
console.log('\n[5] 리밸런싱 판정');
const rb = P.rebalance(alloc, [
  { cls: '국내주식', target: 50, band: 5 },
  { cls: '해외주식', target: 30, band: 5 },
  { cls: '채권', target: 20, band: 5 }
]);
const kr = rb.rows.filter(r => r.cls === '국내주식')[0];
const ov = rb.rows.filter(r => r.cls === '해외주식')[0];
const bd = rb.rows.filter(r => r.cls === '채권')[0];

ok(kr.action === 'sell' && near(kr.diff, 30, 1e-6), '국내주식 80% > 목표 50% → 팔라고 한다 (+30%p)');
ok(kr.amount === 3000000, '국내주식 300만원어치 매도 제안 (800만 → 500만)');
ok(ov.action === 'buy' && ov.amount === 1000000, '해외주식 200만 → 300만, 100만원 매수 제안');
ok(bd.action === 'buy' && bd.amount === 2000000, '아예 없는 채권도 200만원 사라고 짚어 준다');
ok(rb.needsRebalance && rb.offCount === 3, '3개 자산군이 밴드를 벗어났다');
ok(rb.buyAmount === rb.sellAmount, '사는 돈과 파는 돈이 맞아떨어진다 (' + rb.buyAmount.toLocaleString() + '원)');
ok(near(rb.targetSum, 100, 1e-6), '목표 합이 100% 인지 확인해 준다');

/* 밴드 안이면 건드리지 않는다 */
const rb2 = P.rebalance(P.allocation([
  { assetClass: '국내주식', value: 5200000 }, { assetClass: '해외주식', value: 4800000 }
]), [{ cls: '국내주식', target: 50, band: 5 }, { cls: '해외주식', target: 50, band: 5 }]);
ok(!rb2.needsRebalance, '52% / 48% 는 밴드(±5%) 안이라 리밸런싱 안 한다');

/* 목표에 없는데 들고 있는 자산군을 빠뜨리지 않는다 */
const rb3 = P.rebalance(P.allocation([
  { assetClass: '국내주식', value: 5000000 }, { assetClass: '코인', value: 5000000 }
]), [{ cls: '국내주식', target: 100, band: 5 }]);
const coin = rb3.rows.filter(r => r.cls === '코인')[0];
ok(coin && coin.unlisted && coin.action === 'sell', '목표에 없는 자산군(코인 50%)도 잡아낸다');

/* 목표 합이 100% 가 아니면 알 수 있어야 한다 */
ok(near(P.rebalance(alloc, [{ cls: '국내주식', target: 50 }]).targetSum, 50, 1e-6),
  '목표 합이 50% 면 50 으로 알려 준다 (합이 안 맞는 설정을 눈치챌 수 있게)');

/* ══ 6) 앱 안의 같은 함수와 답이 일치하는가 ══════════════════════════════ */
console.log('\n[6] 앱(app/index.html) 구현과 대조');
const html = fs.readFileSync(path.join(process.cwd(), 'app/index.html'), 'utf8');
const mark = '/* @perf-core:app start */';
const endMark = '/* @perf-core:app end */';
if (html.indexOf(mark) < 0) {
  ok(false, 'app/index.html 에 성과 계산 블록(@perf-core:app)이 없다');
} else {
  const body = html.slice(html.indexOf(mark) + mark.length, html.indexOf(endMark));
  const sandbox = {};
  new Function('exports', body + '\n;exports.A={ivXirr:ivXirr,ivTwr:ivTwr,ivAlloc:ivAlloc,ivRebal:ivRebal,ivNetInvested:ivNetInvested,ivTxnFlows:ivTxnFlows};')(sandbox);
  const A = sandbox.A;

  const cases = [
    ['1년 10%', () => P.xirr([{ date: '2025-01-01', amount: -1000000 }, { date: '2026-01-01', amount: 1100000 }]), () => A.ivXirr([{ date: '2025-01-01', amount: -1000000 }, { date: '2026-01-01', amount: 1100000 }])],
    ['추가납입', () => P.xirr(add), () => A.ivXirr(add)],
    ['전손 근처', () => wipe, () => A.ivXirr([{ date: '2025-01-01', amount: -1000000 }, { date: '2026-01-01', amount: 1 }])],
    ['거래 25건', () => P.xirr(many), () => A.ivXirr(many)]
  ];
  let same = 0;
  cases.forEach(c => {
    const a = c[1](), b = c[2]();
    if (near(a, b, 1e-6)) same++;
    else ok(false, 'XIRR 불일치 [' + c[0] + '] 서버 ' + pct(a) + ' vs 앱 ' + pct(b));
  });
  ok(same === cases.length, 'XIRR — 서버와 앱이 같은 답 (' + same + '/' + cases.length + '건)');

  const at2 = A.ivTwr([
    { date: '2025-01-01', value: 100, flow: 0 },
    { date: '2025-07-01', value: 210, flow: 100 },
    { date: '2026-01-01', value: 231, flow: 0 }
  ]);
  ok(near(at2.total, t2.total, 1e-9), 'TWR — 서버와 앱이 같은 답 (' + pct(at2.total) + ')');

  const aAlloc = A.ivAlloc([
    { assetClass: '국내주식', value: 5000000 }, { assetClass: '국내주식', value: 3000000 },
    { assetClass: '해외주식', value: 2000000 }
  ]);
  ok(aAlloc.total === alloc.total && near(aAlloc.list[0].pct, alloc.list[0].pct, 1e-9),
    '자산배분 — 서버와 앱이 같은 답');

  const aRb = A.ivRebal(aAlloc, [
    { cls: '국내주식', target: 50, band: 5 }, { cls: '해외주식', target: 30, band: 5 }, { cls: '채권', target: 20, band: 5 }
  ]);
  ok(aRb.offCount === rb.offCount && aRb.buyAmount === rb.buyAmount,
    '리밸런싱 — 서버와 앱이 같은 답');

  ok(A.ivNetInvested(txns) === P.netInvested(txns), '순납입 — 서버와 앱이 같은 답');
  ok(A.ivTxnFlows(txns, 4800000, '2026-01-01').length === flows.length, '거래 해석 — 서버와 앱이 같은 답');
}

console.log('');
if (fail.length) { console.log('실패 ' + fail.length + '건'); process.exit(1); }
console.log('수익률 계산 검산 통과');
