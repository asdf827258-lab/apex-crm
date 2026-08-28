/*
 * APEX YUN PRO — 유병자 인수예외질환 조회 중계 (Netlify Functions)
 * ════════════════════════════════════════════════════════════════════════
 * 앱의 [자료 조회 > 예외질환 인수확인] 화면이 쓰는 창구다.
 *
 *   GET /api/aplus-disease?q=당뇨&insr=N02&prdt=325&page=1
 *   GET /api/aplus-disease?q=충수염!복막염&all=1     ← 전량(여러 쪽 합쳐서)
 *
 * ── 왜 중계가 필요한가 ────────────────────────────────────────────────
 * 원본은 A+에셋 공개 페이지(aplusga.com/APA/SV/disease.do?sales=Y)의 뒤쪽
 * 엔드포인트다. 로그인은 필요 없지만 **CORS 가 열려 있지 않아** 브라우저에서
 * 우리 도메인이 직접 부르면 Failed to fetch 로 막힌다. 그래서 서버(이 함수)가
 * 대신 부르고 앱에는 같은 출처로 돌려준다. 서버 대 서버 호출에는 쿠키·세션·
 * Referer·User-Agent 가 하나도 필요 없다(확인함).
 *
 * ── 원본 계약 ─────────────────────────────────────────────────────────
 *   POST https://www.aplusga.com/APA/SV/diseaseSearch.do  (form-urlencoded)
 *     INSR_CD        보험사코드 (N=손보전체 L=생보전체 N02 한화손보 … 빈값=전체)
 *     PSB_PRDT_GB    가능상품구분 (325 / 335 / 3N5 WELL100 / 유병자실손 …)
 *     TREATMENT_ITEM 질환명. 2개 이상은 '!' 로 잇는다(화면의 '&' 를 치환한 것)
 *     num            쪽 번호. 한 쪽에 10건
 *     ORDER_BY,SORT  정렬(빈값이면 기본)
 *   응답: JSON 배열. 각 행에 CNT(전체 건수)가 같이 실려 온다.
 *     INSR_NM 보험사 · CATEGORY_CD 분류코드 · TREATMENT_ITEM 예외질환
 *     DISEASE_PRD 최소경과 · TREATMENT_PRD 치료기간 · SURGERY 수술여부
 *     PSB_PRDT_GB 가능상품구분 · BIGO 비고 · CRET_DTM 자료 갱신일
 *
 * ── 지켜야 할 선 ──────────────────────────────────────────────────────
 * 이 자료는 A+에셋이 만들어 공개한 것이다. 앱은 복제해 두지 않고 물어볼 때마다
 * 원본을 그대로 중계한다(그래야 갱신본이 바로 보인다). 화면에도 출처를 밝히고
 * **팀 내부 조회용**으로만 쓴다 — 고객에게 내보내는 자료로 만들지 않는다.
 * 최종 인수 여부는 언제나 해당 보험사 심사와 약관이 우선이다.
 */

var ORIGIN = 'https://www.aplusga.com/APA/SV/diseaseSearch.do';

var PAGE_SIZE = 10;   // 원본이 한 쪽에 내려주는 건수
var MAX_ROWS  = 500;  // all=1 일 때 한 번에 가져올 상한 (원본 부담·응답 크기 방어)
var TIMEOUT   = 12000;

function json(status, body) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // 같은 검색을 반복해 두드리지 않도록 잠깐 캐시한다. 자료는 하루 단위로 바뀐다.
      'Cache-Control': 'public, max-age=300'
    },
    body: JSON.stringify(body)
  };
}

// 원본에 한 쪽을 물어본다.
async function fetchPage(params, num) {
  var body = new URLSearchParams({
    INSR_CD: params.insr || '',
    PSB_PRDT_GB: params.prdt || '',
    TREATMENT_ITEM: params.q || '',
    num: String(num),
    ORDER_BY: '',
    SORT: ''
  }).toString();

  var ctl = new AbortController();
  var timer = setTimeout(function () { ctl.abort(); }, TIMEOUT);
  try {
    var res = await fetch(ORIGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: body,
      signal: ctl.signal
    });
    if (!res.ok) throw new Error('원본 응답 ' + res.status);
    var text = await res.text();
    var rows = JSON.parse(text);
    return Array.isArray(rows) ? rows : [];
  } finally {
    clearTimeout(timer);
  }
}

exports.handler = async function (event) {
  var p = (event && event.queryStringParameters) || {};

  // 화면에서는 '&' 로 여러 질환을 잇는다. 원본이 기대하는 구분자는 '!' 다.
  var q = String(p.q || '').trim().replace(/&/g, '!');
  var params = { q: q, insr: String(p.insr || '').trim(), prdt: String(p.prdt || '').trim() };

  // 조건이 하나도 없으면 전체를 통째로 긁는 꼴이 된다. 그건 막는다.
  if (!params.q && !params.insr && !params.prdt) {
    return json(400, { ok: false, error: '질환명·보험사·상품구분 중 하나는 넣어 주세요.' });
  }

  var wantAll = String(p.all || '') === '1';
  var page = Math.max(1, parseInt(p.page, 10) || 1);

  try {
    var first = await fetchPage(params, wantAll ? 1 : page);
    var total = first.length ? (parseInt(first[0].CNT, 10) || first.length) : 0;

    var rows = first;
    var truncated = false;

    if (wantAll && total > PAGE_SIZE) {
      var cap = Math.min(total, MAX_ROWS);
      truncated = total > MAX_ROWS;
      var lastPage = Math.ceil(cap / PAGE_SIZE);

      // 2쪽부터 나머지를 한꺼번에 가져온다. 한 쪽이라도 실패하면 그 쪽만 비운다.
      var rest = await Promise.all(
        Array.from({ length: lastPage - 1 }, function (_, i) {
          return fetchPage(params, i + 2).catch(function () { return []; });
        })
      );
      rest.forEach(function (r) { rows = rows.concat(r); });

      // ⚠️ 원본 페이징은 쪽 경계에서 한 건씩 겹쳐 내려온다(1쪽 RN 1~10, 2쪽 RN 10~20 …).
      // 한 쪽씩 보는 원본 화면에서는 드러나지 않지만, 이렇게 합치면 그대로 중복이 된다.
      // RN 은 이 검색 결과 안의 순번이라 이걸로 거르면 건수가 정확히 total 과 맞는다.
      var seen = {};
      rows = rows.filter(function (r) {
        var k = String(r && r.RN);
        if (seen[k]) return false;
        seen[k] = 1;
        return true;
      });
    }

    return json(200, {
      ok: true,
      total: total,
      count: rows.length,
      page: wantAll ? 1 : page,
      pageSize: PAGE_SIZE,
      truncated: truncated,   // 상한에 걸려 뒷부분이 잘렸는지
      source: 'A+에셋 유병자 인수예외질환 검색',
      rows: rows
    });
  } catch (e) {
    return json(502, { ok: false, error: '원본 조회에 실패했습니다: ' + (e && e.message ? e.message : String(e)) });
  }
};
