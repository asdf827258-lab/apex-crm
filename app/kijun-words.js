/* ══════════════════════════════════════════════════════════════════
   kijun-words.js — 보험의 기준 · <b>쉬운 말 풀이 한 벌</b> (판 X419)

   사장님 말씀 2026-11-11 「정말 쉽게 설명하고 눈에 가독성이 가장 중요한데」 → 「응 전부 고치고 병합해」
   어려운 보험 말에 쉬운 풀이를 답니다. 팩트파인딩 · 함께 점검표와 셀프 점검이 같은 풀이를 씁니다 —
   화면마다 따로 풀면 같은 말이 화면마다 다르게 풀립니다(5번).
   w 찾을 말(길이 순으로 긴 것부터 찾습니다) · e 쉬운 풀이(한 줄 · 금액 · 약속 · 세금 말 0 · 괄호 0 —
     풀이가 괄호 안에 들어가므로 괄호를 또 쓰면 「보험(실손의료비))」 처럼 겹칩니다)
   쓰는 법: KJ_WORDS.mark(뿌리, {box: 풀이 상자}) — 처음 나온 자리에 풀이를 보여 주고, 다음부터는 밑줄 + 눌러 보기.
   단추 · 입력칸 · 링크 안은 건드리지 않습니다(누르는 글이 길어지면 더 어렵습니다).
   ES5. 재는 자: scripts/check-kjff.js
   ══════════════════════════════════════════════════════════════════ */
window.KJ_WORDS = (function () {
  var L = [
    { w: '허혈성 심장질환', e: '심장 혈관이 좁아지거나 막힌 병 — 협심증 · 심근경색' },
    { w: '급성심근경색', e: '심장 혈관이 갑자기 막힌 것' },
    { w: '뇌혈관질환', e: '뇌 혈관이 터지거나 막히거나 좁아진 병 전부' },
    { w: '진단비', e: '병이 확정되면 한 번에 받는 돈' },
    { w: '유사암', e: '작은 암 — 갑상선암 · 제자리암 등, 일반 암과 따로 받는 줄' },
    { w: '비급여', e: '건강보험이 안 돼서 전부 내가 내는 치료' },
    { w: '갱신', e: '몇 년마다 보험료가 다시 정해지는 것' },
    { w: '납입', e: '보험료를 내는 것 — 언제까지 내나' },
    { w: '고지', e: '가입할 때 건강 상태를 알려야 하는 것', not: ['고지혈'] },
    { w: '판정', e: '점검 결과' },
    { w: '증권', e: '보험 가입 증서 — 가입한 담보와 금액이 적힌 종이' },
    { w: '담보', e: '보험이 지켜 주는 항목 하나하나' },
    { w: '실비', e: '병원에서 쓴 돈을 돌려받는 보험 — 실손의료비' }
  ];
  L.sort(function (a, b) { return b.w.length - a.w.length; });
  var SKIP = /^(BUTTON|INPUT|TEXTAREA|SELECT|A|SCRIPT|STYLE|ABBR|LABEL)$/;
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function inSkip(n, root) { for (var p = n.parentNode; p && p !== root; p = p.parentNode) { if (p.nodeType === 1 && (SKIP.test(p.tagName) || p.hasAttribute('data-kjw-skip') || p.className === 'kjw-g')) return true; } return false; }
  /* 뿌리 아래 글자에서 말을 찾아 꾸민다. seen: 이미 풀이를 보여 준 말(한 화면에 한 번만 보여 준다) */
  function mark(root, opt) {
    opt = opt || {};
    var seen = opt.seen || {}, found = {};
    if (!root) return found;
    var walk = document.createTreeWalker(root, 4, null, false), nodes = [], n;
    while ((n = walk.nextNode())) if (n.nodeValue && n.nodeValue.trim() && !inSkip(n, root)) nodes.push(n);
    nodes.forEach(function (tn) {
      var s = tn.nodeValue, out = '', i = 0, hit = false;
      while (i < s.length) {
        var best = null;
        for (var j = 0; j < L.length; j++) {
          var k = s.indexOf(L[j].w, i);
          /* 「고지혈증」 의 「고지」 처럼 다른 낱말 안에 든 것은 건너뛴다 */
          while (k >= 0 && L[j].not && L[j].not.some(function (t) { return s.substr(k, t.length) === t; })) k = s.indexOf(L[j].w, k + 1);
          if (k >= 0 && (!best || k < best.k || (k === best.k && L[j].w.length > best.x.w.length))) best = { k: k, x: L[j] };
        }
        if (!best) { out += esc(s.slice(i)); break; }
        out += esc(s.slice(i, best.k));
        var x = best.x, first = !seen[x.w] && !opt.noGloss;
        out += '<abbr class="kjw" data-kjw="' + esc(x.w) + '" title="' + esc(x.e) + '" tabindex="0">' + esc(x.w) + '</abbr>' + (first ? '<span class="kjw-g">(' + esc(x.e) + ')</span>' : '');
        if (first) seen[x.w] = 1;
        found[x.w] = 1; hit = true; i = best.k + x.w.length;
      }
      if (hit) { var sp = document.createElement('span'); sp.innerHTML = out; tn.parentNode.replaceChild(sp, tn); }
    });
    return found;
  }
  /* 화면에 나온 말만 풀이 상자에 모은다 */
  function box(el, used) {
    if (!el) return;
    var list = L.filter(function (x) { return used[x.w]; });
    el.hidden = !list.length;
    el.innerHTML = '<b>📖 쉬운 말 풀이</b><dl>' + list.map(function (x) { return '<dt>' + esc(x.w) + '</dt><dd>' + esc(x.e) + '</dd>'; }).join('') + '</dl>';
  }
  var CSS = '.kjw{text-decoration:underline dotted;text-underline-offset:3px;cursor:help}' +
    '.kjw-g{font-size:.82em;font-weight:600;color:var(--t-point-d);margin-left:2px}' +
    '.kjw-box{margin-top:12px;background:var(--t-point-l);border-radius:var(--t-r-sm);padding:12px 14px;font-size:15px}' +
    '.kjw-box b{display:block;font-size:16px;margin-bottom:6px}' +
    '.kjw-box dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:4px 12px}' +
    '.kjw-box dt{font-weight:800;color:var(--t-point-d)}.kjw-box dd{margin:0}' +
    '@media (max-width:600px){.kjw-box dl{grid-template-columns:1fr}.kjw-box dd{margin-bottom:6px}}';
  function css() { if (document.querySelector('style[data-kjw-css]')) return; var st = document.createElement('style'); st.setAttribute('data-kjw-css', ''); st.textContent = CSS; (document.head || document.documentElement).appendChild(st); }
  return { list: function () { return L.map(function (x) { return { w: x.w, e: x.e, not: x.not || [] }; }); }, mark: mark, box: box, css: css };
})();
