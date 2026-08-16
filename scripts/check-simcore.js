#!/usr/bin/env node
/* 모의 포트폴리오 엔진 검사 — node scripts/check-simcore.js
 *
 * 여기서 지키는 것은 돈 계산 규칙이다. 모의라도 규칙이 틀리면 3개월 뒤에
 * 나오는 숫자가 거짓말이 되고, 그 거짓말을 보고 실전을 판단하게 된다.
 */
const S = require('./sim-core.js');

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✅ ' + name); }
  else { fail++; console.log('  ❌ ' + name + (extra ? '  → ' + extra : '')); }
}
function eq(name, got, want) { ok(name, got === want, `got=${got} want=${want}`); }

console.log('\n── 1% 룰: 손절 폭이 수량을 정한다 ──');
{
  /* 잔고 1,000만 · 1% = 10만원 위험 */
  eq('손절 3,000원이면 33주', S.sizeFor(10_000_000, 71_200, 3000), 33);
  eq('손절이 두 배면 수량은 절반', S.sizeFor(10_000_000, 71_200, 6000), 16);
  eq('손절 거리가 0이면 수량도 0', S.sizeFor(10_000_000, 71_200, 0), 0);
  eq('손절이 없으면 수량도 0', S.sizeFor(10_000_000, 71_200, null), 0);
  eq('잔고가 0이면 수량도 0', S.sizeFor(0, 71_200, 3000), 0);

  /* 변동성이 달라도 잃는 돈은 같아야 한다 */
  const a = S.sizeFor(10_000_000, 200, 3) * 3;
  const b = S.sizeFor(10_000_000, 61_240, 2400) * 2400;
  ok('변동성이 달라도 걸리는 돈은 비슷하다', Math.abs(a - b) < 3000, `${a} vs ${b}`);
}

console.log('\n── 평가: 모르는 시세를 0으로 채우지 않는다 ──');
{
  const h = [{ code: 'A', qty: 10, avg: 1000 }, { code: 'B', qty: 5, avg: 2000 }];
  const r = S.value(h, { A: 1200 });
  eq('아는 것은 시세로, 모르는 것은 매입가로', r.value, 10 * 1200 + 5 * 2000);
  eq('모르는 종목 수를 센다', r.unknownPrices, 1);
}

console.log('\n── 하루 결정 ──');
{
  const base = { cash: 10_000_000, holdings: [], peak: 10_000_000, halted: false };
  const px = { '005930': 71_200, '000660': 150_000, '069500': 35_100, 'AAA': 1000 };

  /* 매수 */
  let r = S.decideDay(base, [{ code: '005930', name: '삼성전자', side: 'buy', stopDistance: 3000 }], px);
  ok('매수 1건이 생긴다', r.orders.length === 1 && r.orders[0].side === 'buy');
  ok('현금이 줄었다', r.state.cash < base.cash);
  ok('보유가 늘었다', r.state.holdings.length === 1);
  ok('비용이 붙었다', r.orders[0].amount > 33 * 71_200, `${r.orders[0].amount}`);

  /* 이미 보유 중이면 다시 안 산다.
     ⚠️ peak 은 현재 평가액에 맞춰 둔다. 낙폭 정지가 먼저 걸리면 이 규칙을
        시험하는 게 아니라 정지 규칙을 시험하게 된다 — 처음에 그렇게 짜서 틀렸다. */
  r = S.decideDay(
    { cash: 5_000_000, holdings: [{ code: '005930', qty: 10, avg: 70000 }], peak: 5_712_000 },
    [{ code: '005930', side: 'buy', stopDistance: 3000 }], px);
  eq('이미 보유 중이면 매수 없음', r.orders.length, 0);

  /* 동시 보유 상한 */
  r = S.decideDay(
    { cash: 9_000_000, peak: 10_000_000,
      holdings: [{ code: 'X', qty: 1, avg: 1 }, { code: 'Y', qty: 1, avg: 1 }, { code: 'Z', qty: 1, avg: 1 }] },
    [{ code: '005930', side: 'buy', stopDistance: 3000 }], px);
  eq('3종목이면 더 안 산다', r.orders.filter(o => o.side === 'buy').length, 0);

  /* 매도가 매수보다 먼저 — 현금을 만들어야 살 수 있다 */
  r = S.decideDay(
    { cash: 0, peak: 9_000_000, holdings: [{ code: '000660', name: 'SK하이닉스', qty: 60, avg: 140_000 }] },
    [{ code: '000660', side: 'sell' }, { code: '005930', name: '삼성전자', side: 'buy', stopDistance: 3000 }],
    px);
  ok('판 돈으로 살 수 있다', r.orders.some(o => o.side === 'sell') && r.orders.some(o => o.side === 'buy'),
     JSON.stringify(r.orders.map(o => o.side)));

  /* 안 들고 있는 걸 팔지 않는다 */
  r = S.decideDay(base, [{ code: '005930', side: 'sell' }], px);
  eq('없는 종목은 팔지 않는다', r.orders.length, 0);

  /* 시세를 모르면 건드리지 않는다 */
  r = S.decideDay(base, [{ code: 'ZZZ', side: 'buy', stopDistance: 100 }], px);
  eq('시세를 모르면 사지 않는다', r.orders.length, 0);

  /* 현금이 모자라면 살 수 있는 만큼만 */
  r = S.decideDay({ cash: 100_000, holdings: [], peak: 10_000_000 },
                  [{ code: 'AAA', side: 'buy', stopDistance: 10 }], px);
  const bought = r.orders[0];
  ok('현금 한도 안에서만 산다', !bought || bought.amount <= 100_000, bought && String(bought.amount));
}

console.log('\n── 낙폭 정지 ──');
{
  /* 고점 1,000만 → 현재 890만 = 11% 낙폭 */
  const r = S.decideDay(
    { cash: 0, peak: 10_000_000, halted: false,
      holdings: [{ code: '005930', name: '삼성전자', qty: 125, avg: 80_000 }] },
    [{ code: '069500', side: 'buy', stopDistance: 900 }],
    { '005930': 71_200, '069500': 35_100 });

  ok('정지선을 넘으면 전량 판다', r.orders.every(o => o.side === 'sell') && r.orders.length === 1);
  ok('정지되면 새로 사지 않는다', !r.orders.some(o => o.side === 'buy'));
  ok('정지 표시가 남는다', r.state.halted === true);
  ok('왜 멈췄는지 적는다', r.notes.some(t => t.includes('정지선')));

  /* 이미 정지 상태면 아무것도 안 한다 */
  const r2 = S.decideDay({ cash: 1_000_000, holdings: [], peak: 10_000_000, halted: true },
                         [{ code: '005930', side: 'buy', stopDistance: 3000 }], { '005930': 71_200 });
  eq('정지 상태에서는 주문 없음', r2.orders.length, 0);
}

console.log('\n── 시나리오: 하나의 숫자를 뽑지 않는다 ──');
{
  const few = Array.from({ length: 20 }, (_, i) => ({ date: `2026-01-${i + 1}`, value: 1000 + i }));
  ok('표본이 적으면 말하지 않는다', S.scenarios(few).ok === false);
  ok('얼마나 부족한지 알려준다', typeof S.scenarios(few).reason === 'string');

  /* 100일치 — 변동이 있는 계열 */
  let v = 10_000_000;
  const navs = Array.from({ length: 120 }, (_, i) => {
    v = v * (1 + (Math.sin(i * 1.7) * 0.012));      /* 결정적, ±1.2% 안팎 */
    return { date: '2026-' + String((i % 12) + 1).padStart(2, '0') + '-01', value: Math.round(v), flow: 0 };
  });
  const s = S.scenarios(navs);
  ok('표본이 차면 답한다', s.ok === true, JSON.stringify(s).slice(0, 80));
  ok('셋 다 나온다', [s.bad, s.mid, s.good].every(x => typeof x === 'number'));
  ok('나쁜쪽 ≤ 중간 ≤ 좋은쪽', s.bad <= s.mid && s.mid <= s.good, `${s.bad} / ${s.mid} / ${s.good}`);
  ok('가정을 같이 준다', Array.isArray(s.assumptions) && s.assumptions.length >= 3);
  ok('예측이 아니라고 적는다', s.assumptions.some(a => a.includes('예측이 아닙니다')));
  ok('아무리 나빠도 -100% 아래로 안 간다', s.bad > -100);
}

console.log(`\n${fail ? '❌' : '✅'}  ${pass} 통과 · ${fail} 실패\n`);
process.exit(fail ? 1 : 0);
