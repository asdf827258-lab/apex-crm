/*
 * APEX — 🩺 고지체크 열기 (로그인 창 없이)
 * ════════════════════════════════════════════════════════════════════════
 * [자료 조회 > ⚠️ 예외질환 인수확인] 화면 맨 위에 붙는 카드다.
 *
 * 고지체크(apex-hb-goji.netlify.app)는 다른 주소라 CRM 로그인을 같이 쓰지 못한다.
 * 비밀번호를 한 번 더 넣게 했더니 「로그인이 안 된다」 — 사장님 말씀(2026-11-17)으로 로그인 창을 없앴다.
 *
 * 여기서 누르면: 지금 CRM 로그인 토큰으로 Supabase 함수 goji-open 을 불러 일회용 표를 받고,
 * 고지체크를 「주소#h=표」 로 연다. 고지체크는 그 표로 자기 로그인을 새로 연다.
 * CRM 토큰을 그대로 넘기지 않는 이유 — 두 곳이 같은 토큰을 갱신하면 CRM 이 로그아웃된다.
 *
 * index.html 에는 <script> 한 줄만. 화면 등록은 전역 CUSTOM 배열에 밀어 넣는 것이 전부다.
 */
(function () {
  'use strict';

  var GOJI = 'https://apex-hb-goji.netlify.app/';
  var OPEN_FN = 'https://miakdhxtqofpndtlyzxa.supabase.co/functions/v1/goji-open';

  function card() {
    return '' +
    '<div class="card"><div class="card-hd"><div class="card-title"><span class="ci">🩺</span>고지체크 — 고객 진료기록으로 알릴의무 정리</div>' +
    '<div class="card-desc">고객이 본인 폰에서 인증하면 심평원 5년 진료·처방을 불러와 <b>고지 항목·간편 3·N·5·청약서 기재 문구</b>까지 정리합니다. 따로 로그인하지 않고 지금 CRM 계정으로 열립니다.</div></div>' +
    '<div class="card-body">' +
      '<div class="btn-row"><button class="btn btn-primary" id="gjo_btn" onclick="gojiOpen()">🩺 고지체크 열기</button></div>' +
      '<div id="gjo_msg" style="font-size:var(--t6);color:var(--ink-4);margin-top:8px"></div>' +
    '</div></div>';
  }

  function say(t, bad) {
    var m = document.getElementById('gjo_msg');
    if (m) { m.textContent = t; m.style.color = bad ? '#B91C1C' : ''; }
  }

  window.gojiOpen = function () {
    var sb = typeof osClient === 'function' ? osClient() : null;
    if (!sb) { say('서버 연결 모듈을 불러오지 못했어요. 새로고침해 주세요.', true); return; }
    /* 창은 누른 순간에 먼저 연다 — 기다린 뒤에 열면 팝업 차단에 걸린다 */
    var w = window.open('about:blank', '_blank');
    say('여는 중…');
    sb.auth.getSession().then(function (r) {
      var tok = r && r.data && r.data.session && r.data.session.access_token;
      if (!tok) throw new Error('CRM 에 먼저 로그인해 주세요.');
      return fetch(OPEN_FN, { method: 'POST', headers: { Authorization: 'Bearer ' + tok } });
    }).then(function (res) { return res.json(); }).then(function (d) {
      if (!d || !d.h) throw new Error((d && d.error) || '고지체크를 열지 못했어요.');
      var url = GOJI + '#h=' + encodeURIComponent(d.h);
      if (w && !w.closed) w.location.href = url; else location.href = url;
      say('');
    })['catch'](function (e) {
      if (w && !w.closed) w.close();
      say(e.message || String(e), true);
    });
  };

  function register() {
    if (typeof CUSTOM === 'undefined') return false;
    CUSTOM.unshift({ tab: 'ref_underwrite', render: card });
    return true;
  }
  if (!register()) document.addEventListener('DOMContentLoaded', register);
})();
