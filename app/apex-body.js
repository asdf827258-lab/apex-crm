/* ══════════════════════════════════════════════════════════════════
   apex-body.js — <b>사람 몸 그림 한 벌</b> (판 X318)

   사장님 말씀 2026-11-04 「이미지를 넣어서 조금 더 쉽게」 → 「응 전부 되고」
   보장 전·후(ba.html 「내 몸 어디에」)와 보험의 기준 · 진단·치료 지도(kijun-care.html 「몸 지도」)가
   같은 몸을 씁니다. 두 화면이 각자 그리면 한쪽만 고쳐지는 쌍둥이가 됩니다(CLAUDE.md 5번).
   ★ 직접 그린 SVG 입니다 — 남의 삽화를 옮기지 않습니다(9번). ba.html 에 있던 몸을 그대로 옮겨 왔습니다.
   좌표: viewBox 0 0 200 470 · 뇌 (100,34) · 폐 (88·112,120) · 심장 (105,150) · 위·간 (100,182) · 장 (100,212)
   ES5. 재는 자: scripts/check-kjpics.js
   ══════════════════════════════════════════════════════════════════ */
window.APXBody = {
  VB: '0 0 200 470',
  /* 몸과 장기 — 점(pin)은 부르는 쪽이 얹는다 */
  art: function () {
    return '<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">'+
      '<stop offset="0" stop-color="#FCE0D4"/><stop offset="1" stop-color="#F4BCA8"/></linearGradient></defs>'+
      '<ellipse cx="100" cy="455" rx="52" ry="9" fill="#EEF1F5"/>'+
      '<ellipse cx="100" cy="40" rx="22" ry="26" fill="url(#sk)"/>'+
      '<path d="M93 62 h14 v18 h-14 z" fill="#F2B4A0"/>'+
      '<path d="M66 82 Q100 74 134 82 L138 130 Q136 176 130 228 L70 228 Q64 176 62 130 Z" fill="url(#sk)"/>'+
      '<path d="M69 222 L131 222 L128 252 L72 252 Z" fill="url(#sk)"/>'+
      '<path d="M64 84 L52 92 Q44 140 46 186 L51 232 L59 230 Q54 186 55 144 Q57 110 64 94 Z" fill="url(#sk)"/>'+
      '<path d="M136 84 L148 92 Q156 140 154 186 L149 232 L141 230 Q146 186 145 144 Q143 110 136 94 Z" fill="url(#sk)"/>'+
      '<path d="M72 250 L97 250 L95 330 Q94 390 91 434 L76 434 Q75 390 74 330 Z" fill="url(#sk)"/>'+
      '<path d="M103 250 L128 250 L126 330 Q125 390 124 434 L109 434 Q106 390 105 330 Z" fill="url(#sk)"/>'+
      '<ellipse cx="83" cy="438" rx="10" ry="6" fill="#F2B4A0"/><ellipse cx="116" cy="438" rx="10" ry="6" fill="#F2B4A0"/>'+
      '<ellipse cx="100" cy="34" rx="15" ry="11" fill="#EE9C86" opacity=".65"/>'+
      '<ellipse cx="88" cy="120" rx="12" ry="19" fill="#F09E85" opacity=".5"/>'+
      '<ellipse cx="112" cy="120" rx="12" ry="19" fill="#F09E85" opacity=".5"/>'+
      '<path d="M105 143 q8 -6 11 2 q4 9 -11 17 q-15 -8 -11 -17 q3 -8 11 -2 z" fill="#DC5A48" opacity=".8"/>'+
      '<ellipse cx="100" cy="182" rx="24" ry="21" fill="#E9A075" opacity=".45"/>'+
      '<ellipse cx="100" cy="212" rx="19" ry="14" fill="#D98C6A" opacity=".38"/>';
  },
  svg: function (inner, attrs) {
    return '<svg viewBox="' + this.VB + '" ' + (attrs || 'aria-hidden="true"') + '>' + this.art() + (inner || '') + '</svg>';
  }
};
