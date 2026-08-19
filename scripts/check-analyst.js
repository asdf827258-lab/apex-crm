/* ════════════════════════════════════════════════════════════════════════
   종목 분석 계산이 조용히 틀린 답을 내지 않는가

     node scripts/check-analyst.js

   네트워크를 타지 않는다. 규칙만 본다.
   ════════════════════════════════════════════════════════════════════════ */

const A = require('./analyst-core.js');

let pass = 0, fail = 0;
function ok(name, cond, got) {
  if (cond) { pass++; console.log('  ✅ ' + name); }
  else { fail++; console.log('  ❌ ' + name + (got === undefined ? '' : '  → ' + JSON.stringify(got))); }
}
const NOW = Date.parse('2026-08-17T09:00:00+09:00');
const ago = h => new Date(NOW - h * 3600000).toISOString();

console.log('\n① 같은 기사를 하나로 묶는가');

const dup = A.dedupe([
  { title: '삼성전자, 2분기 영업이익 10조 돌파 - 연합뉴스', url: 'https://a.com/1', source: '연합뉴스', publishedAt: ago(3) },
  { title: '[속보] 삼성전자 2분기 영업이익 10조 돌파', url: 'https://b.com/2', source: '한국경제', publishedAt: ago(2) },
  { title: '삼성전자 2분기 영업이익 10조 돌파 - 매일경제', url: 'https://c.com/3', source: '매일경제', publishedAt: ago(1) },
  { title: 'SK하이닉스 HBM 신제품 공개', url: 'https://d.com/4', source: '조선일보', publishedAt: ago(1) }
]);
ok('3건이 1건으로 묶이고 다른 기사는 남는다', dup.length === 2, dup.map(x => x.title));
ok('가장 이른 것을 남긴다 — 최초 보도가 원본이다', /연합뉴스/.test(dup[0].source), dup[0].source);
ok('몇 곳이 받아썼는지 센다', dup[0].dupCount === 3, dup[0].dupCount);
ok('받아쓴 매체를 모아 둔다', dup[0].dupSources.length === 3, dup[0].dupSources);

/* ⚠️ 글자 단위로 닮음을 재면 삼성전자와 삼성전기가 0.86 으로 묶인다.
      서로 다른 회사가 한 기사가 되는 사고다. */
const two = A.dedupe([
  { title: '삼성전자 주가 상승', url: 'https://a.com/x', source: 'A', publishedAt: ago(2) },
  { title: '삼성전기 주가 상승', url: 'https://b.com/y', source: 'B', publishedAt: ago(1) }
]);
ok('삼성전자와 삼성전기를 같은 기사로 묶지 않는다', two.length === 2, two.length);

const sameUrl = A.dedupe([
  { title: '전혀 다른 제목 하나', url: 'https://a.com/1?utm_source=x', source: 'A', publishedAt: ago(2) },
  { title: '전혀 다른 제목 둘', url: 'https://a.com/1?utm_source=y', source: 'B', publishedAt: ago(1) }
]);
ok('주소가 같으면 추적 파라미터가 달라도 한 건', sameUrl.length === 1, sameUrl.length);

console.log('\n② 최신 기사에 더 무게를 주는가');

ok('방금 기사는 1', A.recencyWeight(ago(0), NOW) === 1);
ok('12시간 전은 0.5 (반감기)', Math.abs(A.recencyWeight(ago(12), NOW) - 0.5) < 0.001);
ok('24시간 전은 0.25', Math.abs(A.recencyWeight(ago(24), NOW) - 0.25) < 0.001);
ok('72시간을 넘으면 0 — 사흘 전 기사로 오늘을 설명하지 않는다', A.recencyWeight(ago(80), NOW) === 0);
ok('시각을 모르면 0 — 언제인지 모르는 기사는 안 센다', A.recencyWeight(null, NOW) === 0);
/* ⚠️ RSS 의 pubDate 가 미래로 오는 경우가 실제로 있다. 그대로 두면 1을 넘어
      옛 기사보다 큰 힘을 갖는다. */
ok('미래 시각이 와도 1을 넘지 않는다', A.recencyWeight(ago(-10), NOW) === 1, A.recencyWeight(ago(-10), NOW));

console.log('\n③ 감성 집계');

const agg = A.aggregate([
  { sentiment: 'positive', sentimentScore: 0.8, importance: 9, publishedAt: ago(1), dupCount: 3 },
  { sentiment: 'positive', sentimentScore: 0.5, importance: 5, publishedAt: ago(6), dupCount: 1 },
  { sentiment: 'negative', sentimentScore: -0.6, importance: 4, publishedAt: ago(30), dupCount: 1 },
  { sentiment: 'neutral', sentimentScore: 0, importance: 3, publishedAt: ago(2), dupCount: 1 }
], NOW);
ok('오래된 부정 기사보다 최근 긍정 기사가 세다', agg.positiveRatio > agg.negativeRatio, [agg.positiveRatio, agg.negativeRatio]);
ok('비율 셋을 더하면 100', Math.abs(agg.positiveRatio + agg.negativeRatio + agg.neutralRatio - 100) < 0.5,
   [agg.positiveRatio, agg.negativeRatio, agg.neutralRatio]);
ok('종합 점수가 양수', agg.netScore > 0, agg.netScore);
ok('핵심 기사를 무게순으로 준다', agg.top[0].importance === 9, agg.top[0].importance);

/* ⚠️ 중요도 0 을 그대로 곱하면 그 기사가 사라진다 — 있었던 사실이 없던 일이 된다 */
const zero = A.aggregate([{ sentiment: 'negative', sentimentScore: -1, importance: 0, publishedAt: ago(1) }], NOW);
ok('중요도 0 인 기사도 사라지지 않는다', zero.used === 1 && zero.negativeRatio === 100, [zero.used, zero.negativeRatio]);

const old = A.aggregate([{ sentiment: 'positive', sentimentScore: 1, importance: 9, publishedAt: ago(100) }], NOW);
ok('전부 오래됐으면 비율을 0%가 아니라 null 로 — 잴 수 없는 것과 없는 것은 다르다',
   old.positiveRatio === null && old.used === 0, [old.positiveRatio, old.used]);

const few = A.aggregate([{ sentiment: 'positive', sentimentScore: 1, importance: 5, publishedAt: ago(1) }], NOW);
ok('기사가 적으면 여론이라 부르지 않는다', few.enoughForOpinion === false && /적습니다/.test(few.note));

console.log('\n④ 뉴스와 주가 방향');

ok('둘 다 위 → 일치', A.alignment(0.6, 2.4).verdict === 'aligned');
ok('둘 다 아래 → 일치', A.alignment(-0.6, -1.8).verdict === 'aligned');
ok('뉴스 긍정 · 주가 하락 → 어긋남', A.alignment(0.6, -1.8).verdict === 'diverged');
ok('어긋남에는 왜 그런지 적는다', /반영|안 믿/.test(A.alignment(0.6, -1.8).reason));
/* ⚠️ 0.05% 움직임을 두고 '뉴스와 일치' 라고 하면 아무 말도 아니다 */
ok('등락이 미미하면 판정하지 않는다', A.alignment(0.6, 0.05).verdict === 'flat');
ok('감성이 어중간하면 판정하지 않는다', A.alignment(0.05, 3.0).verdict === 'unclear');
ok('감성이나 등락이 없으면 모른다고 한다', A.alignment(null, 3.0).verdict === 'unknown');

console.log('\n⑤ 거래량 변화');

const vol = A.volumeChange(3_000_000, [1_000_000, 1_100_000, 900_000, 1_050_000, 950_000]);
ok('평소의 3배를 잡아낸다', vol.ratio === 3, vol.ratio);
ok('말로도 알려준다', /크게 늘/.test(vol.note));
ok('표본이 적으면 답하지 않는다', A.volumeChange(3_000_000, [1, 2, 3]).ratio === null);
ok('과거 평균이 0 이면 나누지 않는다', A.volumeChange(100, [0, 0, 0, 0, 0]).ratio === null);

console.log('\n⑥ 신뢰도 — 근거가 없을수록 낮아지는가');

const strong = A.confidence({ used: 12, positiveRatio: 70, negativeRatio: 10, enoughForOpinion: true }, true, true);
const weak = A.confidence({ used: 2, positiveRatio: 50, negativeRatio: 45, enoughForOpinion: false }, false, false);
ok('근거가 넉넉하면 높다', strong.score >= 0.9, strong.score);
ok('근거가 부족하면 낮다', weak.score <= 0.2, weak.score);
ok('왜 낮은지 적는다', weak.reasons.length >= 3, weak.reasons);
ok('기사가 아예 없으면 0 — 모르면서 확신하지 않는다', A.confidence({ used: 0 }, true, true).score === 0);
ok('팽팽하면 깎는다',
   A.confidence({ used: 12, positiveRatio: 50, negativeRatio: 48, enoughForOpinion: true }, true, true).score < strong.score);


/* ════════════════════════════════════════════════════════════════════════
   오늘의 정리 — 주제 묶기와 보유 연결
   ════════════════════════════════════════════════════════════════════════ */
console.log('\n⑦ 주제로 묶는가');

const news = [
  { title: '삼성전자 HBM4 양산 앞당긴다', publishedAt: ago(2), dupCount: 3 },
  { title: 'SK하이닉스 반도체 수출 급증', publishedAt: ago(3), dupCount: 1 },
  { title: '한국은행 기준금리 동결', publishedAt: ago(4), dupCount: 5 },
  { title: '원달러 환율 1,420원 돌파', publishedAt: ago(5), dupCount: 2 },
  { title: '고환율에 반도체 수출업체 수혜', publishedAt: ago(1), dupCount: 1 },
  { title: '오늘의 운세', publishedAt: ago(2), dupCount: 1 }
];
const g = A.clusterByTopic(news, NOW);
const names = g.map(x => x.name);
ok('반도체·금리·환율이 각각 묶인다',
   names.indexOf('반도체·AI') >= 0 && names.indexOf('금리·통화') >= 0 && names.indexOf('환율') >= 0, names);
/* ⚠️ 한 기사가 여러 주제에 걸린다(고환율 + 반도체). 하나에만 넣으면 다른
      쪽에서 사라진다. */
const semi = g.filter(x => x.id === 'semi')[0], fx = g.filter(x => x.id === 'fx')[0];
ok('두 주제에 걸친 기사는 양쪽에 다 들어간다',
   semi.items.some(x => /고환율/.test(x.title)) && fx.items.some(x => /고환율/.test(x.title)));
ok('아무 주제에도 안 걸리면 기타로 간다',
   (g.filter(x => x.id === 'etc')[0] || { items: [] }).items.some(x => /운세/.test(x.title)));
ok('큰 묶음이 앞에 온다', g[0].weight >= g[g.length - 1].weight, g.map(x => x.name + ':' + x.weight));

/* ⚠️ 사흘 지난 기사로 '오늘의 정리' 를 쓰면 안 된다 */
const oldOnly = A.clusterByTopic([{ title: '반도체 호황', publishedAt: ago(100), dupCount: 1 }], NOW);
ok('오래된 기사만 있으면 묶음이 안 생긴다', oldOnly.length === 0, oldOnly.length);

console.log('\n⑧ 보유 종목에 기사를 잇는가');

const link = A.linkToHoldings(
  [{ code: '005930', name: '삼성전자' }, { code: '000660', name: 'SK하이닉스' }, { code: '999999', name: '없는회사' }],
  news, NOW);
ok('이름이 들어간 기사만 잇는다', link[0].count === 1 && /삼성전자/.test(link[0].news[0].title), link[0].count);
ok('닿는 기사가 없으면 0 으로 둔다 — 억지로 잇지 않는다', link[2].count === 0);
/* ⚠️ 이름이 한 글자면 아무 기사나 딸려 온다 */
ok('한 글자 이름은 잇지 않는다',
   A.linkToHoldings([{ code: 'X', name: '한' }], news, NOW)[0].count === 0);
ok('오래된 기사는 안 잇는다',
   A.linkToHoldings([{ code: 'A', name: '삼성전자' }],
     [{ title: '삼성전자 옛날 기사', publishedAt: ago(200) }], NOW)[0].count === 0);

/* ⚠️ '기타' 는 주제가 아니라 주제를 못 붙인 것이다. 크기로 줄 세우면 맨 앞에
      오는데, 읽는 사람은 첫 칸을 오늘의 핵심으로 읽는다. 실제로 36건 중
      21건이 기타여서 지역 개발사업이 1등으로 올라와 있었다. */
const manyEtc = A.clusterByTopic([
  { title: '인천 옛 공병단 개발사업 차질', publishedAt: ago(1), dupCount: 1 },
  { title: '울산 계절근로 조례안 마련', publishedAt: ago(1), dupCount: 1 },
  { title: '부산 축제 개막', publishedAt: ago(1), dupCount: 1 },
  { title: '삼성전자 HBM 양산', publishedAt: ago(1), dupCount: 1 }
], NOW);
ok('기타는 크기와 무관하게 맨 뒤로 간다',
   manyEtc[manyEtc.length - 1].id === 'etc' && manyEtc[0].id === 'semi',
   manyEtc.map(x => x.id + ':' + x.items.length));

console.log('\n' + (fail ? '❌' : '✅') + '  ' + pass + ' 통과 · ' + fail + ' 실패\n');
process.exit(fail ? 1 : 0);
