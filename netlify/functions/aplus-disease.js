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
var TIMEOUT   = 7000;   // 원본 한 쪽을 기다리는 최대 시간 — 원본은 한 쪽에 5초쯤 걸린다(2026-11-25 실측, 중계 거쳐 5.1~6.7초)
var POOL      = 3;      // 동시에 부르는 쪽 수 — ⚠ 8쪽씩 몰아 부르면 원본이 떨구고, 원본엔 <b>웹방화벽</b>이 있다(직접 부른 PC 가 막힘, 2026-11-25).
                        //   중계(Netlify)가 막히면 예외질환 기능이 통째로 죽는다 — 넉넉히 받으려고 세게 두드리지 말 것
var DEADLINE  = 8000;   // 함수 전체가 쓸 시간(Netlify 동기 함수 10초 안). 넘기면 받은 데까지 + partial 로 답한다
var EXPECT    = 5500;   // 한 쪽에 드는 시간 — 남은 시간이 이보다 짧으면 새 쪽을 시작하지 않는다(끝까지 못 받을 요청으로 원본만 바쁘게 하지 않게)

// 🌐 다른 주소에서 부르는 곳 — 진료분석(고지체크 사이트 jinryo.html · 내 PC 파일)의 「알릴의무 · 예외질환 한 번에」 (판 X501).
// 원본이 CORS 를 닫아 둬서 이 중계를 거치는데, 중계마저 허락을 안 주면 거기서도 막힌다.
// 아무 곳이나(*) 열지 않고 아는 곳만 연다. 'null' = 내 PC 에서 연 파일(file://).
var CORS_OK = ['https://apex-hb-goji.netlify.app', 'null'];
var corsFor = '';

function json(status, body, noStore) {
  var r = {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // 같은 검색을 반복해 두드리지 않도록 잠깐 캐시한다. 자료는 하루 단위로 바뀐다.
      // ⚠ 일부만 받은 답·실패는 캐시하지 않는다 — 5분 동안 같은 빠진 답을 돌려주던 사고(2026-11-24)
      'Cache-Control': (noStore || status !== 200) ? 'no-store' : 'public, max-age=300',
      // 다 받은 답은 Netlify CDN 에 1시간 둔다(여러 설계사가 같은 질환을 물어도 원본은 한 번) — 자료는 하루 단위로 바뀐다.
      // 실패·일부는 CDN 에도 두지 않는다.
      'Netlify-CDN-Cache-Control': (noStore || status !== 200) ? 'no-store' : 'public, s-maxage=3600, durable',
      'Vary': 'Origin',
      // ⚠ 2026-11-24 — 함수가 시간 초과(502)를 내면 Netlify 가 <b>다른 검색어의 옛 답</b>을 stale 로 돌려줬다
      //   (치아 44쪽을 물었는데 「우울」 6건이 옴). 캐시를 검색어·쪽마다 따로 두고, 답에 물은 것을 적어 받는 쪽이 맞대 보게 한다.
      'Netlify-Vary': 'query=q|insr|prdt|page|all'
    },
    body: JSON.stringify(body)
  };
  if (corsFor) r.headers['Access-Control-Allow-Origin'] = corsFor;
  return r;
}

// 원본에 한 쪽을 물어본다.
async function fetchPage(params, num, ms) {
  var body = new URLSearchParams({
    INSR_CD: params.insr || '',
    PSB_PRDT_GB: params.prdt || '',
    TREATMENT_ITEM: params.q || '',
    num: String(num),
    ORDER_BY: '',
    SORT: ''
  }).toString();

  var ctl = new AbortController();
  var timer = setTimeout(function () { ctl.abort(); }, ms || TIMEOUT);
  try {
    var res = await fetch(ORIGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: body,
      signal: ctl.signal
    });
    if (!res.ok) throw new Error('원본 응답 ' + res.status);
    var buf = await res.arrayBuffer();
    var text = new TextDecoder('utf-8').decode(buf).trim();
    if (text.charAt(0) !== '[') {
      // 원본이 표 대신 안내문(EUC-KR HTML)을 준다 — 「웹방화벽에 의해 차단되었습니다」(2026-11-25 실측)
      var kr = ''; try { kr = new TextDecoder('euc-kr').decode(buf); } catch (e) { kr = text; }
      var waf = /방화벽|차단/.test(kr) || /방화벽|차단/.test(text);   // 원본은 EUC-KR 로 준다 — 두 글자 방식 다 본다
      var err = new Error(waf ? '원본(A+에셋) 웹방화벽이 막았습니다 — 잠시 뒤 다시' : '원본이 표가 아닌 답을 줬습니다');
      err.waf = waf;
      throw err;
    }
    var rows = JSON.parse(text);
    return Array.isArray(rows) ? rows : [];
  } finally {
    clearTimeout(timer);
  }
}

exports.handler = async function (event) {
  var p = (event && event.queryStringParameters) || {};
  var hd = (event && event.headers) || {};
  var org = String(hd.origin || hd.Origin || '');
  corsFor = CORS_OK.indexOf(org) >= 0 ? org : '';

  // 화면에서는 '&' 로 여러 질환을 잇는다. 원본이 기대하는 구분자는 '!' 다.
  var q = String(p.q || '').trim().replace(/&/g, '!');
  var params = { q: q, insr: String(p.insr || '').trim(), prdt: String(p.prdt || '').trim() };

  // 조건이 하나도 없으면 전체를 통째로 긁는 꼴이 된다. 그건 막는다.
  if (!params.q && !params.insr && !params.prdt) {
    return json(400, { ok: false, error: '질환명·보험사·상품구분 중 하나는 넣어 주세요.' });
  }

  var t0 = Date.now();
  var wantAll = String(p.all || '') === '1';
  var page = Math.max(1, parseInt(p.page, 10) || 1);

  try {
    // all=1 이면 1쪽과 함께 2·3쪽도 같이 부른다 — 원본이 쪽마다 5초라, 1쪽을 기다린 뒤 부르면 시간 안에 한 쪽도 더 못 받는다.
    // (30건 이하 — 당뇨·우울·고혈압 같은 흔한 검색 — 는 이 한 번으로 끝난다)
    var pre = {};
    var firstSet = wantAll ? [1, 2, 3].slice(0, POOL) : [page];
    var settled = await Promise.all(firstSet.map(function (n) {
      return fetchPage(params, n).then(function (r) { return { n: n, rows: r }; }, function (e) { return { n: n, err: e }; });
    }));
    if (settled[0].err) throw settled[0].err;
    settled.slice(1).forEach(function (x) { if (!x.err) pre[x.n] = x.rows; });
    var first = settled[0].rows;
    var total = first.length ? (parseInt(first[0].CNT, 10) || first.length) : 0;

    var rows = first;
    var truncated = false;

    var missing = [];
    if (wantAll && total > PAGE_SIZE) {
      var cap = Math.min(total, MAX_ROWS);
      truncated = total > MAX_ROWS;
      var lastPage = Math.ceil(cap / PAGE_SIZE);

      // 2쪽부터 나머지를 POOL 개씩 나눠 부르고, 실패한 쪽은 시간이 남는 한 다시 부른다.
      // ⚠ 예전엔 Promise.all 로 수십 쪽을 한꺼번에 불러 실패한 쪽을 [] 로 삼키고 ok 로 답했다 —
      //   갑상선 369건 중 160건, 치아 535건 중 372건만 오고 아무도 몰랐다(2026-11-24). 회사가 통째로 빠진다.
      var got = {}, queue = [], tries = {}, stop = false;
      for (var n = 2; n <= lastPage; n++) { if (pre[n]) got[n] = pre[n]; else queue.push(n); }
      var worker = async function () {
        while (queue.length) {
          var left = DEADLINE - (Date.now() - t0);
          if (stop || left < EXPECT) return;          // 남은 시간에 한 쪽도 못 받는다 — 여기서 멈추고 partial 로 답한다(나머지는 화면이 page=N 으로)
          var pg = queue.shift();
          try { got[pg] = await fetchPage(params, pg, Math.min(TIMEOUT, left)); }
          catch (e) {
            if (e && e.waf) { stop = true; return; }   // 방화벽이 막으면 더 두드리지 않는다
            tries[pg] = (tries[pg] || 0) + 1;
            if (tries[pg] < 3) { await new Promise(function (r) { setTimeout(r, 300 * tries[pg]); }); queue.push(pg); }
          }
        }
      };
      var lanes = [];
      for (var w = 0; w < POOL; w++) lanes.push(worker());
      await Promise.all(lanes);
      for (var m = 2; m <= lastPage; m++) { if (got[m]) rows = rows.concat(got[m]); else missing.push(m); }

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

    // 다 받았는지는 쪽 성공이 아니라 <b>건수</b>로 본다 — 원본이 빈 쪽을 200 으로 줄 수도 있다.
    var want = wantAll ? Math.min(total, MAX_ROWS) : rows.length;
    var partial = wantAll && rows.length < want;
    return json(200, {
      ok: true,
      total: total,
      count: rows.length,
      q: params.q, insr: params.insr, prdt: params.prdt, all: wantAll,   // 받는 쪽이 「내가 물은 것의 답인가」를 맞대 본다
      page: wantAll ? 1 : page,
      pageSize: PAGE_SIZE,
      truncated: truncated,   // 상한에 걸려 뒷부분이 잘렸는지
      partial: partial,       // 원본이 일부 쪽을 끝내 안 줬는지 — true 면 missing 쪽을 page=N 으로 다시 부르면 된다
      missing: missing,
      source: 'A+에셋 유병자 인수예외질환 검색',
      rows: rows
    }, partial);
  } catch (e) {
    // ⚠ 실패도 200 으로 답한다(ok:false · no-store). 502 로 답하면 Netlify 가 <b>다른 검색어의 옛 200 답</b>을 대신 내줬다
    //   (2026-11-24: 치아 44쪽 → 「우울」, #884 뒤에도 치아 42쪽 → 「갑상선」 2쪽). 받는 쪽은 ok·q 를 보고 다시 부른다.
    return json(200, { ok: false, q: params.q, insr: params.insr, prdt: params.prdt, all: wantAll, page: page, waf: !!(e && e.waf), retry: !(e && e.waf),
      error: (e && e.waf) ? e.message : '원본 조회에 실패했습니다: ' + (e && e.message ? e.message : String(e)) }, true);
  }
};
