/*
 * APEX YUN PRO — 유병자 인수예외질환 실시간 조회
 * ════════════════════════════════════════════════════════════════════════
 * [자료 조회 > ⚠️ 예외질환 인수확인] 화면 맨 위에 붙는 카드다.
 *
 * 원래 이 화면에는 'AI 추정'과 '고지 메모 폼'만 있었다. 실제 보험사 인수기준을
 * 확인하려면 설계사가 A+에셋 사이트를 따로 열어야 했다. 그 표를 그대로 앱 안으로
 * 가져온다 — 24개 보험사의 예외질환·최소경과·치료기간·수술여부·가능상품구분이
 * 원본 그대로 나온다. AI 추정이 아니라 보험사가 제출한 실제 기준이다.
 *
 * 자료는 앱에 복제해 두지 않는다. 물어볼 때마다 /api/aplus-disease 가 원본을
 * 중계하므로 늘 최신본이 보인다. (원본은 CORS 가 닫혀 있어 서버 중계가 필요하다)
 *
 * ── 이 파일을 따로 둔 이유 ────────────────────────────────────────────
 * app/index.html 은 5만 줄짜리 단일 파일이고 여러 사람이 동시에 고친다. 거기에
 * 기능을 직접 써넣으면 충돌이 난다. 그래서 index.html 에는 <script> 한 줄만 넣고
 * 나머지는 전부 여기 둔다. 화면 등록도 전역 CUSTOM 배열에 밀어 넣는 것이 전부다.
 */
(function () {
  'use strict';

  // 원본 페이지의 선택 항목을 그대로 옮긴 것 (aplusga.com/APA/SV/disease.do)
  var INSURERS = [
    ['', '보험사 전체'], ['N', '손보 전체'], ['L', '생보 전체'],
    ['N02', '한화손보'], ['N71', '농협손보'], ['N13', 'DB손보'], ['N09', '현대해상'],
    ['N05', '흥국화재'], ['N08', '삼성화재'], ['N03', '롯데손보'], ['N01', '메리츠화재'],
    ['N10', 'KB손보'], ['N22', '하나손보'], ['N17', 'AIG손보'],
    ['L02', 'ABL생명'], ['L71', 'DB생명'], ['L01', '한화생명'], ['L04', '흥국생명'],
    ['L42', '농협생명'], ['L51', '라이나생명'], ['L74', '동양생명'], ['L03', '삼성생명'],
    ['L11', '신한라이프'], ['L31', 'iM라이프'], ['L63', '하나생명'], ['L72', '메트라이프']
  ];

  var PRODUCTS = [
    ['', '가능상품구분 전체'], ['325', '325'], ['325*335*355', '325, 335, 355'],
    ['325*335,355*31*Mom편한(어.무.디 플랜)', '325, 335, 355, 31, Mom편한(어.무.디)'],
    ['325*335,355,31*Mom편한*암만암', '325, 335, 355, 31, Mom편한, 암만암'],
    ['333', '333'], ['335', '335'], ['335*325', '335, 325'], ['335*355', '335, 355'],
    ['355', '355'], ['355*335', '355, 335'], ['355*345*335', '355, 345, 335'],
    ['3N5 WELL100', '3N5 WELL100'], ['간편 공통', '간편 공통'], ['건강보험', '건강보험'],
    ['나에게맞춘간편 전플랜**325-1*325 간병치매', '나에게맞춘간편 전플랜, 325-1, 325 간병치매'],
    ['유병자실손', '유병자실손']
  ];

  // 상담에서 자주 걸리는 것들 — 눌러서 바로 조회
  var QUICK = ['당뇨', '고혈압', '갑상선', '디스크', '역류성식도염', '우울증', '협심증', '뇌경색', '자궁근종', '통풍'];

  var LIMIT_RENDER = 400;   // 한 번에 표로 그릴 최대 행수
  var state = { rows: [], total: 0, truncated: false, byInsurer: false, busy: false };

  function E(s) { return (typeof esc === 'function') ? esc(s) : String(s == null ? '' : s); }
  function el(id) { return document.getElementById(id); }
  // 원본 값에 줄바꿈·중복 공백이 섞여 있다(예: "치료종결후/\n암 담보…")
  function clean(s) { return String(s == null ? '' : s).replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim(); }
  function dash(s) { var v = clean(s); return v && v !== '-' ? E(v) : '<span style="color:#C6CBD2">–</span>'; }

  function opts(list, cur) {
    return list.map(function (o) {
      return '<option value="' + E(o[0]) + '"' + (o[0] === cur ? ' selected' : '') + '>' + E(o[1]) + '</option>';
    }).join('');
  }

  function card() {
    return '' +
    '<div class="card"><div class="card-hd"><div class="card-title"><span class="ci">🔎</span>유병자 인수예외질환 조회 <span style="font-size:10px;font-weight:800;color:#1A56DB;background:#EFF4FF;border-radius:999px;padding:3px 8px;margin-left:6px;vertical-align:2px">실제 보험사 기준</span></div>' +
    '<div class="card-desc">질환명을 넣으면 24개 보험사의 <b>인수예외 여부·최소경과·치료기간·수술여부·가능상품구분</b>을 원본 그대로 찾아옵니다. AI 추정이 아니라 보험사가 제출한 실제 기준입니다. (키 불필요)</div></div>' +
    '<div class="card-body">' +
      '<div class="frm cols2">' +
        '<div class="fld span2"><label>질환명 (2개 이상은 &amp; 로 연결 · 최대 4개)</label>' +
          '<input id="apd_q" placeholder="예: 당뇨   ·   충수염&amp;복막염" autocomplete="off"></div>' +
        '<div class="fld"><label>보험사</label><select id="apd_insr">' + opts(INSURERS, '') + '</select></div>' +
        '<div class="fld"><label>가능상품구분</label><select id="apd_prdt">' + opts(PRODUCTS, '') + '</select></div>' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 12px">' +
        QUICK.map(function (k) {
          return '<button type="button" onclick="apdQuick(\'' + E(k) + '\')" style="font-size:11px;background:#fff;border:1px solid var(--ink-7);border-radius:999px;padding:5px 11px;cursor:pointer;color:var(--ink-3)">' + E(k) + '</button>';
        }).join('') +
      '</div>' +
      '<div class="btn-row">' +
        '<button class="btn btn-primary" onclick="apdSearch()">조회</button>' +
        '<button class="btn btn-ghost" onclick="apdSort()">보험사순 정렬</button>' +
        '<button class="btn btn-ghost" onclick="apdCopy()">📋 표 복사</button>' +
        '<a class="btn btn-ghost" href="https://www.aplusga.com/APA/SV/disease.do?sales=Y" target="_blank" rel="noopener">↗ 원본 페이지</a>' +
      '</div>' +
      '<div class="calc-res" id="apd_res"></div>' +
      '<div class="notice" style="margin-top:12px;font-size:11px;color:var(--ink-4);background:var(--ink-8);border-color:var(--ink-7)">' +
        '자료 출처 : <b>A+에셋 유병자 인수예외질환 검색</b>(공개 페이지)을 조회할 때마다 그대로 가져옵니다. ' +
        '<b>팀 내부 조회용</b>이며 고객에게 전달하는 자료로 쓰지 않습니다. ' +
        '실제 인수 여부·부담보 조건은 해당 보험사 심사 결과와 약관이 우선하며, 청약서 질문에는 사실 그대로 고지해야 합니다.' +
      '</div>' +
    '</div></div>';
  }

  function msg(html) { var b = el('apd_res'); if (b) { b.classList.add('on'); b.innerHTML = html; } }

  function table() {
    var rows = state.rows.slice();
    if (state.byInsurer) {
      rows.sort(function (a, b) {
        return String(a.INSR_NM || '').localeCompare(String(b.INSR_NM || ''), 'ko') ||
               String(a.TREATMENT_ITEM || '').localeCompare(String(b.TREATMENT_ITEM || ''), 'ko');
      });
    }
    var shown = rows.slice(0, LIMIT_RENDER);

    var insurers = {};
    state.rows.forEach(function (r) { if (r.INSR_NM) insurers[r.INSR_NM] = 1; });

    var h = '<div class="result-hd" style="border:0;background:transparent;padding:0 0 9px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span class="rl">총 ' + state.total + '건 · 보험사 ' + Object.keys(insurers).length + '곳</span>' +
      (state.byInsurer ? '<span style="font-size:11px;color:var(--ink-4)">보험사순</span>' : '') +
      (state.truncated ? '<span style="font-size:11px;color:#B45309;background:#FEF3C7;border-radius:999px;padding:3px 9px">건수가 많아 앞 500건만 가져왔습니다 — 질환명이나 보험사를 좁혀 주세요</span>' : '') +
      (shown.length < rows.length ? '<span style="font-size:11px;color:var(--ink-4)">화면에는 ' + shown.length + '건 표시</span>' : '') +
      '</div>';

    h += '<div style="overflow-x:auto"><table class="uw-table" style="min-width:900px">' +
      '<thead><tr>' +
        '<th style="width:88px">보험사</th>' +
        '<th style="width:64px">분류코드</th>' +
        '<th style="min-width:190px">예외질환 (질병/상해)</th>' +
        '<th style="width:150px">최소경과</th>' +
        '<th style="width:96px">치료기간</th>' +
        '<th style="width:80px">수술여부</th>' +
        '<th style="min-width:150px">가능상품구분</th>' +
        '<th style="min-width:90px">비고</th>' +
        '<th style="width:78px">갱신</th>' +
      '</tr></thead><tbody>';

    h += shown.map(function (r) {
      return '<tr>' +
        '<td class="p">' + E(clean(r.INSR_NM)) + '</td>' +
        '<td style="font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#64748B">' + dash(r.CATEGORY_CD) + '</td>' +
        '<td style="font-weight:700">' + E(clean(r.TREATMENT_ITEM)) + '</td>' +
        '<td>' + dash(r.DISEASE_PRD) + '</td>' +
        '<td>' + dash(r.TREATMENT_PRD) + '</td>' +
        '<td>' + dash(r.SURGERY) + '</td>' +
        '<td style="font-size:11px">' + dash(r.PSB_PRDT_GB) + '</td>' +
        '<td class="m">' + dash(r.BIGO) + '</td>' +
        '<td class="m">' + E(clean(r.CRET_DTM)) + '</td>' +
      '</tr>';
    }).join('');

    return h + '</tbody></table></div>';
  }

  window.apdQuick = function (k) {
    var q = el('apd_q'); if (!q) return;
    q.value = k;
    window.apdSearch();
  };

  window.apdSort = function () {
    if (!state.rows.length) { if (typeof toast === 'function') toast('먼저 조회해 주세요'); return; }
    state.byInsurer = !state.byInsurer;
    msg(table());
  };

  window.apdCopy = function () {
    if (!state.rows.length) { if (typeof toast === 'function') toast('복사할 결과가 없습니다'); return; }
    var head = ['보험사', '분류코드', '예외질환', '최소경과', '치료기간', '수술여부', '가능상품구분', '비고', '갱신일'].join('\t');
    var body = state.rows.map(function (r) {
      return [r.INSR_NM, r.CATEGORY_CD, r.TREATMENT_ITEM, r.DISEASE_PRD, r.TREATMENT_PRD, r.SURGERY, r.PSB_PRDT_GB, r.BIGO, r.CRET_DTM]
        .map(function (v) { return clean(v); }).join('\t');
    }).join('\n');
    if (typeof copyText === 'function') copyText(head + '\n' + body);
  };

  window.apdSearch = function () {
    if (state.busy) return;
    var q = (el('apd_q') && el('apd_q').value || '').trim();
    var insr = (el('apd_insr') && el('apd_insr').value) || '';
    var prdt = (el('apd_prdt') && el('apd_prdt').value) || '';

    if (!q && !insr && !prdt) {
      if (typeof toast === 'function') toast('질환명을 입력하거나 보험사를 골라 주세요');
      return;
    }

    state.busy = true;
    state.byInsurer = false;
    msg('<div style="padding:26px 0;text-align:center;color:var(--ink-4);font-size:12px">조회 중…</div>');

    var url = '/api/aplus-disease?all=1&q=' + encodeURIComponent(q) +
              '&insr=' + encodeURIComponent(insr) + '&prdt=' + encodeURIComponent(prdt);

    fetch(url).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.ok) throw new Error((d && d.error) || '조회에 실패했습니다');
      state.rows = d.rows || [];
      state.total = d.total || 0;
      state.truncated = !!d.truncated;

      if (!state.rows.length) {
        msg('<div style="padding:24px 0;text-align:center;color:var(--ink-4);font-size:12px">' +
            '조회된 인수예외 기준이 없습니다.<br><span style="font-size:11px">질환명을 더 짧게(예: “갑상선”) 넣어 보세요. ' +
            '예외 목록에 없다고 해서 인수가 보장되는 것은 아니며, 최종 판단은 보험사 심사입니다.</span></div>');
        return;
      }
      msg(table());
    })['catch'](function (e) {
      msg('<div style="padding:20px 0;text-align:center;color:#B91C1C;font-size:12px">' + E(e.message || e) +
          '<br><span style="font-size:11px;color:var(--ink-4)">잠시 후 다시 시도하시거나 위 “원본 페이지”로 확인해 주세요.</span></div>');
    }).then(function () { state.busy = false; });
  };

  // Enter 로도 조회되게 — 카드가 그려진 뒤에 붙여야 하므로 문서 단위로 받는다.
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && ev.target && ev.target.id === 'apd_q') {
      ev.preventDefault();
      window.apdSearch();
    }
  });

  // 화면 등록 — 이 탭의 카드 중 맨 앞에 놓는다(AI 추정보다 실제 기준이 먼저 보이도록).
  function register() {
    if (typeof CUSTOM === 'undefined') return false;
    CUSTOM.unshift({ tab: 'ref_underwrite', render: card });
    return true;
  }
  if (!register()) document.addEventListener('DOMContentLoaded', register);
})();
