/* ════════════════════════════════════════════════════════════════════════
   종목 분석 — 순수 계산부

   중복 제거 · 최신 가중 · 감성 집계 · 뉴스와 주가 방향 일치 판정이 여기 모여 있다.
   네트워크도 파일도 건드리지 않는다. 규칙이 걸린 코드는 검사가 되어야 하는데
   입출력과 섞여 있으면 검사할 수가 없다. sim-core.js · perf-core.js 와 같은 이유,
   같은 구조다.

     검사:  node scripts/check-analyst.js

   ⚠️ 여기에는 토스 API 를 부르는 코드가 한 줄도 없다. 시세는 밖에서 받아
      넣어 준다. 뉴스도 마찬가지다 — 토스 Open API 에는 뉴스가 없고,
      뉴스는 별도 소스에서 온다.
   ════════════════════════════════════════════════════════════════════════ */

'use strict';

const DEFAULTS = {
  halfLifeHours: 12,      /* 이 시간이 지나면 가중치가 절반이 된다 */
  maxAgeHours: 72,        /* 이보다 오래된 기사는 아예 안 센다 */
  titleSimilarity: 0.72,  /* 제목이 이만큼 닮으면 같은 기사로 본다 */
  minForOpinion: 3        /* 기사가 이보다 적으면 '의견' 을 말하지 않는다 */
};

function n(v) { const x = parseFloat(v); return isFinite(x) ? x : null; }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

/* ── 제목 정규화 ────────────────────────────────────────────────────────
   같은 기사가 언론사마다 조금씩 다르게 실린다. 매체명 꼬리(' - 조선일보'),
   대괄호 말머리('[속보]'), 문장부호, 공백을 걷어내고 비교한다. */
function normTitle(s) {
  return String(s || '')
    .replace(/\s+[-–—|]\s+[^-–—|]{1,20}$/, '')     /* 끝에 붙는 매체명 */
    .replace(/\[[^\]]{1,12}\]/g, ' ')              /* [속보] [단독] */
    .replace(/["'“”‘’`]/g, '')
    .replace(/[.,!?·…:;()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/* 두 제목이 얼마나 닮았나 — 낱말 집합의 자카드 계수.
   글자 단위로 재면 '삼성전자' 와 '삼성전기' 가 0.86 으로 나와 서로 다른
   회사를 같은 기사로 묶는다. 실제로 그렇게 짜서 묶였다. */
function similarity(a, b) {
  const A = new Set(normTitle(a).split(' ').filter(w => w.length > 1));
  const B = new Set(normTitle(b).split(' ').filter(w => w.length > 1));
  if (!A.size || !B.size) return 0;
  let hit = 0;
  A.forEach(w => { if (B.has(w)) hit++; });
  return hit / (A.size + B.size - hit);
}

/* ── 중복 제거 ──────────────────────────────────────────────────────────
   같은 사건을 여러 매체가 쓴다. 그대로 세면 '기사가 많다' = '중요하다' 가
   되어 버려서, 통신사 하나가 뿌린 것을 열 곳이 받아쓴 날 중요도가 부풀려진다.

   남길 하나는 '가장 이른 것' 으로 고른다. 최초 보도가 원본이고 나머지는
   받아쓰기다. 대신 몇 곳이 받아썼는지(dupCount)를 남긴다 — 그 자체가 신호다. */
function dedupe(items, opts) {
  const o = Object.assign({}, DEFAULTS, opts || {});
  const rows = (items || []).filter(x => x && x.title);
  const byTime = rows.slice().sort((a, b) => tms(a.publishedAt) - tms(b.publishedAt));

  const kept = [];
  byTime.forEach(item => {
    const url = String(item.url || '').split('?')[0];
    let hit = null;
    for (const k of kept) {
      if (url && String(k.url || '').split('?')[0] === url) { hit = k; break; }
      if (similarity(k.title, item.title) >= o.titleSimilarity) { hit = k; break; }
    }
    if (hit) {
      hit.dupCount = (hit.dupCount || 1) + 1;
      if (hit.dupSources.indexOf(item.source) < 0 && item.source) hit.dupSources.push(item.source);
      return;
    }
    kept.push(Object.assign({}, item, { dupCount: 1, dupSources: item.source ? [item.source] : [] }));
  });
  return kept;
}

function tms(v) {
  if (v == null) return 0;
  const t = Date.parse(v);
  return isFinite(t) ? t : 0;
}

/* ── 최신 가중 ──────────────────────────────────────────────────────────
   반감기 방식. 12시간 지나면 0.5, 24시간이면 0.25.
   maxAgeHours 를 넘으면 0 이다 — 사흘 전 기사로 오늘을 설명하면 안 된다.

   ⚠️ 미래 시각이 오면 1 로 자른다. RSS 의 pubDate 가 앞서 있는 경우가 실제로
      있는데, 그대로 두면 지수가 1을 넘어 옛 기사보다 더 큰 힘을 갖는다. */
function recencyWeight(publishedAt, nowMs, opts) {
  const o = Object.assign({}, DEFAULTS, opts || {});
  const t = tms(publishedAt);
  if (!t) return 0;                                   /* 시각을 모르면 안 센다 */
  const ageH = (nowMs - t) / 3600000;
  if (ageH > o.maxAgeHours) return 0;
  if (ageH <= 0) return 1;
  return Math.pow(0.5, ageH / o.halfLifeHours);
}

/* ── 감성 집계 ──────────────────────────────────────────────────────────
   기사 하나하나의 sentiment 를 최신 가중치와 중요도로 눌러 합친다.
   단순 개수 비율이 아니다 — 사흘 전 잡담 열 건이 오늘 실적 발표 한 건을
   이기면 안 된다.

   비율(positiveRatio 등)은 가중치 합 기준이며, 합이 0 이면 null 을 준다.
   0% 라고 적으면 '부정이 하나도 없다' 로 읽히는데 사실은 '잴 수 없다' 이다. */
function aggregate(analyzed, nowMs, opts) {
  const o = Object.assign({}, DEFAULTS, opts || {});
  const rows = (analyzed || []).filter(x => x && x.sentiment);

  let wPos = 0, wNeg = 0, wNeu = 0, wSum = 0, scoreSum = 0;
  const scored = [];

  rows.forEach(r => {
    const rw = recencyWeight(r.publishedAt, nowMs, o);
    if (rw <= 0) return;
    /* 중요도(0~10)를 0.5~1.5 배로 환산한다. 중요도를 그대로 곱하면
       중요도 0 인 기사가 완전히 사라져, 있었던 사실이 없던 일이 된다. */
    const imp = clamp(n(r.importance) == null ? 5 : n(r.importance), 0, 10);
    const w = rw * (0.5 + imp / 10);
    /* 받아쓴 매체가 많으면 조금 더 실어 준다. 다만 로그로 눌러
       한 사건이 스무 곳에 실렸다고 스무 배가 되지 않게 한다. */
    const dup = 1 + Math.log2(Math.max(1, n(r.dupCount) || 1)) * 0.25;
    const wt = w * dup;

    wSum += wt;
    if (r.sentiment === 'positive') wPos += wt;
    else if (r.sentiment === 'negative') wNeg += wt;
    else wNeu += wt;

    const sc = n(r.sentimentScore);
    if (sc != null) scoreSum += clamp(sc, -1, 1) * wt;
    scored.push({ item: r, weight: wt, recency: rw });
  });

  scored.sort((a, b) => b.weight - a.weight);

  const enough = rows.length >= o.minForOpinion;
  return {
    used: scored.length,
    total: rows.length,
    weightSum: Math.round(wSum * 1000) / 1000,
    positiveRatio: wSum ? Math.round(wPos / wSum * 1000) / 10 : null,
    negativeRatio: wSum ? Math.round(wNeg / wSum * 1000) / 10 : null,
    neutralRatio: wSum ? Math.round(wNeu / wSum * 1000) / 10 : null,
    /* -1(비관) ~ +1(낙관) */
    netScore: wSum ? Math.round(scoreSum / wSum * 1000) / 1000 : null,
    top: scored.slice(0, 5).map(s => s.item),
    /* 표본이 적으면 비율을 말하되 '의견' 으로는 쓰지 말라고 알린다 */
    enoughForOpinion: enough,
    note: enough ? '' : '기사 ' + rows.length + '건 — 여론을 말하기에는 적습니다'
  };
}

/* ── 뉴스와 주가 방향이 맞는가 ──────────────────────────────────────────
   맞으면 '뉴스대로 갔다', 어긋나면 '뉴스와 반대로 갔다'.
   어긋난 쪽이 오히려 볼 거리다 — 좋은 소식에 빠졌다면 이미 반영됐거나
   시장이 안 믿는 것이다.

   ⚠️ 등락률이 미미하면(±0.3% 미만) 판정하지 않는다. 0.05% 움직임을 두고
      '뉴스와 일치' 라고 말하는 건 아무 말도 아니다. */
function alignment(netScore, changeRate, opts) {
  const s = n(netScore), c = n(changeRate);
  const flat = (opts && n(opts.flatPct) != null) ? n(opts.flatPct) : 0.3;
  const weak = (opts && n(opts.weakScore) != null) ? n(opts.weakScore) : 0.15;

  if (s == null || c == null) return { verdict: 'unknown', reason: '뉴스 감성 또는 등락률이 없습니다' };
  if (Math.abs(c) < flat) return { verdict: 'flat', reason: '등락이 ±' + flat + '% 미만이라 방향을 말할 수 없습니다' };
  if (Math.abs(s) < weak) return { verdict: 'unclear', reason: '뉴스 감성이 한쪽으로 기울지 않았습니다' };

  const same = (s > 0 && c > 0) || (s < 0 && c < 0);
  return {
    verdict: same ? 'aligned' : 'diverged',
    reason: same
      ? '뉴스 방향과 주가 방향이 같습니다'
      : (s > 0
          ? '뉴스는 긍정인데 주가는 내렸습니다 — 이미 반영됐거나 시장이 안 믿는 것입니다'
          : '뉴스는 부정인데 주가는 올랐습니다 — 악재가 예상보다 가볍거나 다른 힘이 있습니다')
  };
}

/* ── 거래량 변화 ────────────────────────────────────────────────────────
   오늘 거래량이 최근 평균의 몇 배인가. 뉴스가 실제로 사람을 움직였는지
   보는 가장 단순한 자다. 평균이 0 이거나 표본이 적으면 답하지 않는다. */
function volumeChange(todayVolume, pastVolumes) {
  const v = n(todayVolume);
  const past = (pastVolumes || []).map(n).filter(x => x != null && x > 0);
  if (v == null || past.length < 5) return { ratio: null, note: '비교할 과거 거래량이 부족합니다' };
  const avg = past.reduce((a, b) => a + b, 0) / past.length;
  if (!avg) return { ratio: null, note: '과거 평균 거래량이 0 입니다' };
  const r = Math.round(v / avg * 100) / 100;
  return {
    ratio: r, average: Math.round(avg), samples: past.length,
    note: r >= 2 ? '평소의 ' + r + '배 — 크게 늘었습니다'
        : r >= 1.3 ? '평소보다 늘었습니다'
        : r <= 0.5 ? '평소의 절반 이하입니다' : '평소 수준입니다'
  };
}

/* ── AI 신뢰도 ──────────────────────────────────────────────────────────
   '얼마나 믿을 만한 결론인가' 를 0~1 로. 다음이 모자라면 낮아진다:
     · 기사 수가 적다
     · 기사가 오래됐다
     · 감성이 반반으로 갈린다
     · 시세를 못 받았다
   ⚠️ 근거가 없을수록 낮아져야 한다. 값이 없을 때 기본을 높게 두면
      "모르지만 확신함" 이 되어 제일 위험하다. */
function confidence(agg, hasPrice, hasDisclosure) {
  if (!agg || !agg.used) return { score: 0, reasons: ['분석할 기사가 없습니다'] };
  const reasons = [];
  let s = 1;

  if (agg.used < 3) { s *= 0.45; reasons.push('기사 ' + agg.used + '건뿐'); }
  else if (agg.used < 6) { s *= 0.75; reasons.push('기사 ' + agg.used + '건'); }

  /* 감성이 반반이면 결론을 못 내린다 */
  const p = agg.positiveRatio, ng = agg.negativeRatio;
  if (p != null && ng != null) {
    const gap = Math.abs(p - ng);
    if (gap < 15) { s *= 0.6; reasons.push('긍정·부정이 팽팽함'); }
    else if (gap < 30) { s *= 0.85; }
  }

  if (!hasPrice) { s *= 0.6; reasons.push('시세를 못 받음'); }
  if (!hasDisclosure) { s *= 0.9; reasons.push('공시 확인 안 됨'); }
  if (!agg.enoughForOpinion) { s *= 0.8; }

  return { score: Math.round(clamp(s, 0, 1) * 100) / 100, reasons: reasons };
}

module.exports = {
  DEFAULTS, normTitle, similarity, dedupe, recencyWeight,
  aggregate, alignment, volumeChange, confidence
};
