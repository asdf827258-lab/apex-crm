/*
 * APEX — 📋 알릴의무 · 💰 보험금 찾아줌 (메뉴 둘로 나누기)
 * ════════════════════════════════════════════════════════════════════════
 * 사장님 말씀(2026-11-26) 「CRM 메뉴 나누길 원해」 — 고지체크 진료분석(jinryo.html)을
 * 맨 위 메뉴 「📋 알릴의무 · 💰 보험금 찾아줌 · 🧾 청구 한 건」 으로 나눈 것(고지체크 v18)을
 * CRM 메뉴에서도 따로 연다.
 *
 *   📋 알릴의무      = 원래 「알릴의무 필터」(med_disclosure) 화면 맨 위 → jinryo.html#goji
 *   💰 보험금 찾아줌 = 원래 「숨은보험금찾기」(ref_hidden) 화면 맨 위 → jinryo.html#claim
 *
 * 화면 id 는 그대로 둔다(찾기 낱말 · 영업 한 바퀴 · 지도 · 점검이 모두 id 로 가리킨다).
 * 아래 AI 「알릴의무 필터」 와 「내보험찾아줌」 링크는 그대로 남는다(지우지 않는다).
 *
 * 진료분석은 고객 PDF 를 그 기기 안에서만 읽는다 — 서버로 보내지 않는다. 로그인도 필요 없다.
 * index.html 에는 <script> 한 줄만. 화면 등록은 전역 CUSTOM 배열에 밀어 넣는 것이 전부다.
 * 점검 : scripts/check-alrilclaim.js
 */
(function () {
  'use strict';

  var JINRYO = 'https://apex-hb-goji.netlify.app/jinryo.html';

  var PANES = {
    med_disclosure: {
      hash: 'goji', icon: '📋', title: '알릴의무 — 심평원 PDF 로 바로 정리',
      desc: '고객 「내 진료정보 열람」 PDF(기본·세부·처방)를 넣으면 <b>알릴의무 · 다시 물어볼 것 · 받아 주는 곳(예외질환)</b>까지 한 화면에 나옵니다.'
    },
    ref_hidden: {
      hash: 'claim', icon: '💰', title: '보험금 찾아줌 — 못 받은 보험금 찾기',
      desc: '심평원 PDF 와 보험 자료(KB 보장분석 · 내보험다보여)를 넣으면 <b>받을 수 있는 돈 · 청구 시효 · 실손 세대 비교 · 고객에게 보낼 글</b>까지 나옵니다.'
    }
  };

  function card(id) {
    var p = PANES[id], src = JINRYO + '#' + p.hash;
    return '' +
    '<div class="card" id="alc_' + p.hash + '"><div class="card-hd"><div class="card-title"><span class="ci">' + p.icon + '</span>' + p.title + '</div>' +
    '<div class="card-desc">' + p.desc + ' PDF 는 이 기기 안에서만 읽고 서버로 보내지 않습니다.</div></div>' +
    '<div class="card-body">' +
      '<div class="btn-row" style="margin-bottom:10px">' +
        '<a class="btn btn-primary" href="' + src + '" target="_blank" rel="noopener">' + p.icon + ' 새 창으로 크게 열기</a>' +
      '</div>' +
      '<iframe src="' + src + '" title="' + p.title + '" loading="lazy" ' +
        'style="width:100%;height:80vh;border:1px solid var(--ink-7,#E5E8EB);border-radius:12px;display:block;background:#fff"></iframe>' +
    '</div></div>';
  }

  function register() {
    if (typeof CUSTOM === 'undefined') return false;
    CUSTOM.unshift({ tab: 'ref_hidden', render: function () { return card('ref_hidden'); } });
    CUSTOM.unshift({ tab: 'med_disclosure', render: function () { return card('med_disclosure'); } });
    return true;
  }
  if (!register()) document.addEventListener('DOMContentLoaded', register);
})();
