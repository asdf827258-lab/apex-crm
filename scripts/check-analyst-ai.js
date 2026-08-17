/* ════════════════════════════════════════════════════════════════════════
   AI 가 돌려준 것을 그대로 믿지 않는가

     node scripts/check-analyst-ai.js     (네트워크 안 탐)

   AI 는 형식을 곧잘 지키다가 가끔 어긴다. 어긴 것을 그대로 통과시키면
   화면에 조용히 틀린 값이 뜬다. 여기 검사는 그 자리들을 하나씩 건다.
   ════════════════════════════════════════════════════════════════════════ */

const AI = require('./analyst-ai.js');

let pass = 0, fail = 0;
function ok(name, cond, got) {
  if (cond) { pass++; console.log('  ✅ ' + name); }
  else { fail++; console.log('  ❌ ' + name + (got === undefined ? '' : '  → ' + JSON.stringify(got))); }
}

const ORIGIN = {
  ticker: '005930', company: '삼성전자',
  title: '삼성전자, 2분기 영업이익 10조 돌파',
  publishedAt: '2026-08-17T00:00:00.000Z', source: '연합뉴스'
};
const GOOD = {
  summary: '', sentiment: 'positive', sentimentScore: 0.7, importance: 8,
  reason: '영업이익이 시장 예상을 넘었다', keywords: ['실적', '영업이익'],
  riskFactors: [], catalysts: ['실적 개선']
};

console.log('\n① 사실 칸은 AI 말이 아니라 원본을 쓰는가');

const v = AI.validateOne(Object.assign({}, GOOD, {
  title: '삼성전자 영업이익 12조 돌파',      /* AI 가 제목을 슬쩍 바꿨다 */
  publishedAt: '2020-01-01', source: '가짜일보', ticker: 'FAKE'
}), ORIGIN);
ok('제목은 원본을 쓴다 — AI 가 바꿔도 안 따라간다', v.row.title === ORIGIN.title, v.row.title);
ok('작성시각도 원본', v.row.publishedAt === ORIGIN.publishedAt, v.row.publishedAt);
ok('언론사도 원본', v.row.source === '연합뉴스', v.row.source);
ok('티커도 원본', v.row.ticker === '005930', v.row.ticker);

console.log('\n② 라벨과 점수가 어긋나면');

const bad1 = AI.validateOne(Object.assign({}, GOOD, { sentiment: 'positive', sentimentScore: -0.7 }), ORIGIN);
ok('positive 인데 점수가 음수면 버린다', bad1.ok === false, bad1.problems);
const bad2 = AI.validateOne(Object.assign({}, GOOD, { sentiment: 'negative', sentimentScore: 0.5 }), ORIGIN);
ok('negative 인데 점수가 양수면 버린다', bad2.ok === false, bad2.problems);
ok('왜 버렸는지 남긴다', /어긋난다/.test(bad2.problems.join(' ')));
/* ⚠️ 한쪽에 맞춰 다른 쪽을 고치면 있지도 않은 판단을 만들어 내는 것이다 */
const neu = AI.validateOne(Object.assign({}, GOOD, { sentiment: 'neutral', sentimentScore: -0.3 }), ORIGIN);
ok('neutral 은 점수 부호를 따지지 않는다', neu.ok === true);

console.log('\n③ 범위를 벗어난 값');

const over = AI.validateOne(Object.assign({}, GOOD, { sentimentScore: 3.5, importance: 99 }), ORIGIN);
ok('점수를 1로 자른다', over.row.sentimentScore === 1, over.row.sentimentScore);
ok('중요도를 10으로 자른다', over.row.importance === 10, over.row.importance);
ok('잘랐다고 남긴다', over.problems.length >= 2, over.problems);

const nan = AI.validateOne(Object.assign({}, GOOD, { sentimentScore: '몰라요', importance: null }), ORIGIN);
ok('숫자가 아니면 0 으로 두고 기록한다', nan.row.sentimentScore === 0 && nan.row.importance === 0);
ok('숫자 아님을 남긴다', /숫자가 아니다/.test(nan.problems.join(' ')));

const wrongLabel = AI.validateOne(Object.assign({}, GOOD, { sentiment: '좋음' }), ORIGIN);
ok('모르는 라벨은 neutral 로 두고 기록한다', wrongLabel.row.sentiment === 'neutral' && /sentiment 가/.test(wrongLabel.problems.join(' ')));

console.log('\n④ 배열 칸');

const arr = AI.validateOne(Object.assign({}, GOOD, {
  keywords: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
  riskFactors: '문자열로 옴', catalysts: [null, '', '  ', '유효']
}), ORIGIN);
ok('키워드는 8개까지', arr.row.keywords.length === 8, arr.row.keywords.length);
ok('배열이 아니면 빈 배열', Array.isArray(arr.row.riskFactors) && arr.row.riskFactors.length === 0);
ok('빈 값은 걸러낸다', arr.row.catalysts.length === 1 && arr.row.catalysts[0] === '유효', arr.row.catalysts);

console.log('\n⑤ 스키마 모양이 사용자가 정한 그대로인가');

const keys = Object.keys(AI.emptyShape());
const want = ['ticker', 'company', 'title', 'publishedAt', 'source', 'summary',
              'sentiment', 'sentimentScore', 'importance', 'reason',
              'keywords', 'riskFactors', 'catalysts'];
ok('칸 13개가 순서까지 같다', JSON.stringify(keys) === JSON.stringify(want), keys);

console.log('\n⑥ 모델 응답에서 JSON 을 건져 내는가');

ok('```json 울타리를 벗긴다', AI.extractJson('```json\n{"items":[1]}\n```') != null);
ok('앞뒤 잡담이 붙어도 건진다', AI.extractJson('네, 결과입니다:\n{"items":[]}\n감사합니다') != null);
ok('JSON 이 아예 없으면 null', AI.extractJson('죄송합니다 할 수 없습니다') === null);
ok('깨진 JSON 도 null', AI.extractJson('{"items":[') === null);

console.log('\n⑦ 묶음 검증 — 버린 것을 조용히 없애지 않는가');

const batch = AI.validateBatch(
  [GOOD, Object.assign({}, GOOD, { sentiment: 'positive', sentimentScore: -1 }), GOOD],
  [ORIGIN, Object.assign({}, ORIGIN, { title: '버려질 기사' }), ORIGIN]);
ok('통과 2건 · 탈락 1건', batch.rows.length === 2 && batch.dropped.length === 1,
   [batch.rows.length, batch.dropped.length]);
ok('탈락한 기사 제목을 남긴다', batch.dropped[0].title === '버려질 기사', batch.dropped[0]);

console.log('\n⑧ 프롬프트가 지켜야 할 것을 말하는가');

ok('제목만 주어진다고 못 박는다', /제목.*만 주어진다|본문은 없다/.test(AI.SYSTEM));
ok('지어내지 말라고 한다', /지어내|없는 수치/.test(AI.SYSTEM));
ok('순서를 지키라고 한다', /순서도 같아야/.test(AI.SYSTEM));

console.log('\n' + (fail ? '❌' : '✅') + '  ' + pass + ' 통과 · ' + fail + ' 실패\n');
process.exit(fail ? 1 : 0);
