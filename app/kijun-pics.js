/* ══════════════════════════════════════════════════════════════════
   kijun-pics.js — 보험의 기준 · <b>그림 한 벌</b> (판 X318)

   사장님 말씀 2026-11-04 「이미지를 넣어서 조금 더 쉽게 할수 있는 방법이 있난」 → 「응 전부 되고」
     kind(k, px)  — 🎴 담보가 나오는 길 다섯 그림(정해진 금액 · 쓴 만큼 · 날 수만큼 · 비율만큼 · 보험료 면제)
                    담보 사전 · 진단·치료 지도 · 실비 이야기가 같은 그림을 씁니다(5번).
     strip()      — 다섯 그림을 한 줄로(뜻풀이와 함께)
     bill()       — 🧾 병원비 한 막대: 공단 몫 · 급여 내 몫 · 비급여 · 실비가 받치는 칸 · 병원비와 따로인 돈
     road(p)      — 🛣️ 병을 겪는 길 한 줄(KJ_PATH 한 길) — 동그라미마다 data-si, 아래 띠는 병원비 → 생활비
   ★ 모두 직접 그린 SVG 입니다 — 남의 삽화를 옮기지 않습니다(9번).
   ★ 그림에 금액 · 비율 숫자를 넣지 않습니다. 막대 칸의 크기는 그림일 뿐 비율이 아니라고 그림 밑에 적습니다(1번).
   ★ 색은 app/ui.css 의 토큰(var(--t-*))으로 칠합니다 — 따로 외운 색표를 두지 않습니다(5번).
   ES5. 재는 자: scripts/check-kjpics.js
   ══════════════════════════════════════════════════════════════════ */
window.KJ_PIC = (function () {
  var C = {
    fx:   { ink: 'var(--t-point-d)', bg: 'var(--t-point-l)', t: '정해진 금액', d: '일이 생기면 정한 돈 한 번' },
    rl:   { ink: 'var(--t-pos-d)',   bg: 'var(--t-pos-l)',   t: '쓴 만큼',     d: '영수증 안에서 돌려받기' },
    day:  { ink: 'var(--t-warn-d)',  bg: 'var(--t-warn-l)',  t: '날 수만큼',   d: '하루 금액 × 입원 · 통원 날' },
    rate: { ink: 'var(--t-pur)',     bg: 'var(--t-pur-l)',   t: '비율만큼',    d: '가입 금액 × 장해 지급률' },
    wv:   { ink: 'var(--t-ink)',     bg: 'var(--t-bg-2)',    t: '보험료 면제', d: '남은 보험료를 안 내요 · 보장은 그대로' }
  };
  /* 그림 몸통 — 0 0 48 48 판 위에 그린다 */
  var BODY = {
    fx: function (k) { return '<rect x="7" y="12" width="34" height="24" rx="3" fill="#fff" stroke="' + k + '" stroke-width="2.6"/><path d="M7.5 13.5 L24 26 L40.5 13.5" fill="none" stroke="' + k + '" stroke-width="2.6" stroke-linejoin="round"/>'; },
    rl: function (k) { return '<path d="M11 7 L33 7 L33 39 L29.3 36.5 L25.6 39 L22 36.5 L18.3 39 L14.6 36.5 L11 39 Z" fill="#fff" stroke="' + k + '" stroke-width="2.4" stroke-linejoin="round"/><line x1="15.5" y1="15" x2="28.5" y2="15" stroke="' + k + '" stroke-width="2.2"/><line x1="15.5" y1="21" x2="26" y2="21" stroke="' + k + '" stroke-width="2.2"/><path d="M43 29 a7 7 0 1 1 -2.4 -5.3 M41.6 19.6 L40.8 24.2 L36.4 23.4" fill="none" stroke="' + k + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'; },
    day: function (k) { return '<rect x="8" y="10" width="32" height="30" rx="4" fill="#fff" stroke="' + k + '" stroke-width="2.4"/><rect x="8" y="10" width="32" height="8" rx="3" fill="' + k + '"/><g fill="' + k + '"><circle cx="15" cy="25" r="2.2"/><circle cx="22" cy="25" r="2.2"/><circle cx="29" cy="25" r="2.2"/><circle cx="35" cy="25" r="2.2"/><circle cx="15" cy="33" r="2.2"/><circle cx="22" cy="33" r="2.2"/></g>'; },
    rate: function (k) { return '<path d="M8 34 A16 16 0 0 1 40 34" fill="none" stroke="' + k + '" stroke-width="6" opacity=".22"/><path d="M8 34 A16 16 0 0 1 32 20.2" fill="none" stroke="' + k + '" stroke-width="6" stroke-linecap="round"/><line x1="24" y1="34" x2="33" y2="22" stroke="' + k + '" stroke-width="2.6" stroke-linecap="round"/><circle cx="24" cy="34" r="3" fill="' + k + '"/>'; },
    wv: function (k) { return '<circle cx="24" cy="24" r="16" fill="#fff" stroke="' + k + '" stroke-width="2.6"/><rect x="18" y="16" width="4.2" height="16" rx="1.2" fill="' + k + '"/><rect x="25.8" y="16" width="4.2" height="16" rx="1.2" fill="' + k + '"/>'; }
  };
  function kind(k, px) {
    var c = C[k]; if (!c) return '';
    px = px || 18;
    return '<svg class="kjp" data-kjp="' + k + '" viewBox="0 0 48 48" width="' + px + '" height="' + px + '" aria-hidden="true">' + BODY[k](c.ink) + '</svg>';
  }
  function strip() {
    return '<div class="kjp-strip" data-kjp-strip>' + ['fx', 'rl', 'day', 'rate', 'wv'].map(function (k) {
      var c = C[k];
      return '<div class="kjp-card" style="background:' + c.bg + ';color:' + c.ink + '">' + kind(k, 44) + '<b>' + c.t + '</b><span>' + c.d + '</span></div>';
    }).join('') + '</div>';
  }
  function bill() {
    var T = 'font-family:var(--t-font)';
    return '<svg class="kjp-bill" data-kjp-bill viewBox="0 0 640 300" width="100%" role="img" aria-label="병원비 한 막대 — 공단 몫, 급여 내 몫, 비급여. 실비는 내 몫과 비급여를 한도 안에서 받치고, 진단비와 생활비는 병원비와 따로예요." style="' + T + '">' +
      '<text x="0" y="20" font-size="15" font-weight="800" fill="var(--t-ink)">🧾 이번 병원비</text>' +
      '<rect x="0" y="32" width="280" height="62" rx="10" fill="var(--t-bg-2)"/>' +
      '<text x="140" y="58" text-anchor="middle" font-size="15" font-weight="800" fill="var(--t-ink)">공단이 내는 몫</text>' +
      '<text x="140" y="80" text-anchor="middle" font-size="12.5" fill="var(--t-sub)">급여 — 건강보험</text>' +
      '<rect x="285" y="32" width="150" height="62" rx="10" fill="var(--t-pos-l)"/>' +
      '<text x="360" y="58" text-anchor="middle" font-size="15" font-weight="800" fill="var(--t-pos-d)">내 몫</text>' +
      '<text x="360" y="80" text-anchor="middle" font-size="12.5" fill="var(--t-pos-d)">급여 본인부담</text>' +
      '<rect x="440" y="32" width="200" height="62" rx="10" fill="var(--t-neg-l)"/>' +
      '<text x="540" y="58" text-anchor="middle" font-size="15" font-weight="800" fill="var(--t-neg-d)">비급여</text>' +
      '<text x="540" y="80" text-anchor="middle" font-size="12.5" fill="var(--t-neg-d)">전부 내가 — 로봇 · 신약 등</text>' +
      '<path d="M287 106 L287 118 L638 118 L638 106" fill="none" stroke="var(--t-point)" stroke-width="2.6"/>' +
      '<rect x="350" y="128" width="226" height="32" rx="8" fill="var(--t-point-l)"/>' +
      '<g transform="translate(358,132) scale(.5)">' + BODY.rl('var(--t-point-d)') + '</g>' +
      '<text x="388" y="149" font-size="13.5" font-weight="800" fill="var(--t-point-d)">실비 — 한도 · 횟수 안에서</text>' +
      '<line x1="0" y1="184" x2="640" y2="184" stroke="var(--t-line)" stroke-dasharray="4 4"/>' +
      '<text x="0" y="210" font-size="15" font-weight="800" fill="var(--t-ink)">병원비와 따로</text>' +
      '<rect x="0" y="222" width="312" height="72" rx="10" fill="var(--t-point-l)"/>' +
      '<g transform="translate(12,236) scale(.9)">' + BODY.fx('var(--t-point-d)') + '</g>' +
      '<text x="62" y="250" font-size="14" font-weight="800" fill="var(--t-point-d)">진단비 · 수술비 · 치료비</text>' +
      '<text x="62" y="272" font-size="12.5" fill="var(--t-point-d)">급여 · 비급여와 상관없이 약관 조건대로</text>' +
      '<rect x="324" y="222" width="316" height="72" rx="10" fill="var(--t-pur-l)"/>' +
      '<text x="340" y="250" font-size="14" font-weight="800" fill="var(--t-pur)">💸 끊긴 월급 · 간병 · 생활비</text>' +
      '<text x="340" y="272" font-size="12.5" fill="var(--t-pur)">실비는 안 받쳐요 → 진단비 · 생활비 · 간병 담보</text>' +
      '</svg>' +
      '<p class="kjp-note">⚠ 칸 크기는 그림일 뿐 — 비율이 아니에요. 같은 치료도 급여 · 비급여가 갈려요 — 심평원 · 병원에서 확인해요.</p>';
  }
  var MOC = { h: 'var(--t-point)', b: 'var(--t-warn)', l: 'var(--t-pur)' };
  function road(p) {
    var n = p.d.length, W = 1000, pad = 70, gap = n > 1 ? (W - pad * 2) / (n - 1) : 0, i, h = '';
    h += '<svg class="kjp-road" data-kjp-road="' + p.g + '" viewBox="0 0 ' + W + ' 178" width="100%" role="img" aria-label="' + p.t + ' — ' + n + '단계" style="font-family:var(--t-font)">';
    h += '<line x1="' + pad + '" y1="56" x2="' + (W - pad) + '" y2="56" stroke="var(--t-line)" stroke-width="10" stroke-linecap="round"/>';
    for (i = 0; i < n; i++) {
      var st = p.d[i], x = pad + gap * i, col = MOC[st.m] || 'var(--t-point)';
      h += '<g class="kjp-st" data-si="' + i + '" tabindex="0" role="button" aria-label="' + (i + 1) + '단계 ' + st.s + '" style="cursor:pointer">' +
        '<circle cx="' + x + '" cy="56" r="26" fill="' + col + '"/>' +
        '<text x="' + x + '" y="63" text-anchor="middle" font-size="19" font-weight="800" fill="#fff">' + (i + 1) + '</text>' +
        '<text x="' + x + '" y="108" text-anchor="middle" font-size="14.5" font-weight="800" fill="var(--t-ink)">' + st.s + '</text>' +
        '<text x="' + x + '" y="128" text-anchor="middle" font-size="12" font-weight="700" fill="' + col + '">' + ({ h: '병원비', l: '생활비', b: '병원비 · 생활비' }[st.m] || '') + '</text></g>';
    }
    /* 아래 띠 — 단계마다 그 단계의 돈 색으로 칠한 칸을 잇고, 띠 전체를 둥근 틀 하나로 자른다 */
    var cid = 'kjpb-' + p.g;
    h += '<defs><clipPath id="' + cid + '"><rect x="' + (pad - 30) + '" y="146" width="' + (W - pad * 2 + 60) + '" height="18" rx="9"/></clipPath></defs><g clip-path="url(#' + cid + ')">';
    for (i = 0; i < n; i++) {
      var x0 = i === 0 ? pad - 30 : pad + gap * (i - 0.5), x1 = i === n - 1 ? W - pad + 30 : pad + gap * (i + 0.5);
      h += '<rect x="' + x0 + '" y="146" width="' + (x1 - x0 + 0.5) + '" height="18" fill="' + (MOC[p.d[i].m] || 'var(--t-point)') + '" opacity=".88"/>';
    }
    h += '</g>';
    h += '<text x="' + (pad - 20) + '" y="159.5" font-size="12" font-weight="800" fill="#fff">💸 병원비</text>';
    h += '<text x="' + (W - pad + 20) + '" y="159.5" text-anchor="end" font-size="12" font-weight="800" fill="#fff">생활비 · 끊긴 월급 💸</text>';
    return h + '</svg>';
  }
  return { kind: kind, strip: strip, bill: bill, road: road, KIND: C };
})();
