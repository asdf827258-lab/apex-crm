/* ══════════════════════════════════════════════════════════════════
   kijun-font.js — 보험의 기준 · <b>글씨 크기 한 벌</b> (판 X323)

   사장님 말씀 2026-11-04 「글이 너무 작은데, 조금 더 쉽게 내가 뽑아서 이해하고 대조할수 있도록」
   보험의 기준 화면(사전 · 지도 · 실비 · 가이드 · 대조표 · 설계서)이 같은 글씨 단추를 씁니다(5번).
   ★ 처음 열면 「크게」 — 작다는 말씀이 먼저라서입니다. 보통 · 크게 · 아주 크게 셋.
   ★ 고른 크기는 이 기기에만 남깁니다(localStorage · 고객 정보 아님) — 못 쓰는 기기에선 그냥 「크게」(3번).
   ★ 인쇄도 같은 크기로 뽑습니다. 단, 한 장에 맞춰야 하는 종이(<html data-kjf-print="off">)는 화면만 키웁니다.
   ES5. 재는 자: scripts/check-kjcompare.js
   ══════════════════════════════════════════════════════════════════ */
(function () {
  var KEY = 'kjFont', LV = [{ k: 'm', t: '보통', z: 1 }, { k: 'l', t: '크게', z: 1.15 }, { k: 'x', t: '아주 크게', z: 1.3 }], DEF = 'l';
  var H = document.documentElement;
  function get() { try { var v = localStorage.getItem(KEY); return v && LV.some(function (l) { return l.k === v; }) ? v : DEF; } catch (e) { return DEF; } }
  function put(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* 이 기기에선 못 남김 — 그래도 지금 화면은 바뀐다 */ } }
  var st = document.createElement('style');
  st.setAttribute('data-kjf-style', '');
  /* 폰처럼 좁은 화면에선 「아주 크게」 를 「크게」 로 묶는다 — 화면 폭보다 넓어져 옆으로 새지 않게 */
  st.textContent = '@media screen{body{zoom:var(--kjz,1)}}' +
    '@media screen and (max-width:600px){html[data-kjf="x"] body{zoom:1.15}}' +
    '@media print{html:not([data-kjf-print="off"]) body{zoom:var(--kjz,1)}}' +
    '.kjf{display:inline-flex;align-items:center;gap:2px;background:var(--t-card);border-radius:var(--t-r-sm);padding:3px}' +
    '.kjf span{font:800 12.5px var(--t-font);color:var(--t-sub);padding:0 6px}' +
    '.kjf button{min-height:38px;border:0;border-radius:var(--t-r-xs);padding:0 9px;font:700 13px var(--t-font);background:transparent;color:var(--t-ink);cursor:pointer}' +
    '.kjf button.on{background:var(--t-point);color:var(--t-on)}' +
    '@media print{.kjf{display:none!important}}';
  (document.head || H).appendChild(st);
  function apply(v) {
    var l = LV.filter(function (x) { return x.k === v; })[0] || LV[1];
    H.style.setProperty('--kjz', String(l.z));
    H.setAttribute('data-kjf', l.k);
    [].forEach.call(document.querySelectorAll('.kjf button'), function (b) { b.classList.toggle('on', b.getAttribute('data-kjf-k') === l.k); });
  }
  function mount() {
    var host = document.querySelector('.act') || document.body;
    if (host.querySelector('.kjf')) return;
    var w = document.createElement('div');
    w.className = 'kjf'; w.setAttribute('data-kjf-box', ''); w.setAttribute('role', 'group'); w.setAttribute('aria-label', '글씨 크기');
    w.innerHTML = '<span>🔠 글씨</span>' + LV.map(function (l) { return '<button type="button" data-kjf-k="' + l.k + '">' + l.t + '</button>'; }).join('');
    host.insertBefore(w, host.firstChild);
    w.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('button'); if (!b) return; var v = b.getAttribute('data-kjf-k'); put(v); apply(v); });
    apply(get());
  }
  apply(get());
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  window.KJ_FONT = { get: get, levels: LV };
})();
