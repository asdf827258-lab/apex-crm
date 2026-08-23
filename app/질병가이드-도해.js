/* ════════════════════════════════════════════════════════════════
   질병 보험가이드 — 도해 (window.DZ_VIZ)

   고객은 글보다 그림을 먼저 봅니다. 특히 <b>왜 이 술식은 수술이고 저건
   시술인가</b> 는 말로 설명하면 3분, 그림으로 보여 주면 10초입니다.

   ★ 남의 자료 삽화를 복제하지 않습니다. 전부 여기서 <b>직접 그립니다.</b>
     사진은 인쇄에서 뭉개지고 화면 크기마다 달라지지만, SVG 는 어디서나
     같은 선으로 섭니다.
   ★ 해부도가 아니라 <b>설명용 도식</b>입니다. 실제 몸의 모양·비율과
     다릅니다. 화면에도 그렇게 적습니다.
   ★ 3D 는 CSS 원근(perspective)으로 겹을 띄웁니다. 끌면 돌아갑니다.
     바깥에서 아무것도 받아 오지 않습니다.

   쓰는 법:  DZ_VIZ.get('stomach_layer')  →  {t, d, dz:[질병id], html}
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 사실 그림 — 실제 조직에 가깝게 그린다 ─────────────────
     처음엔 색칠한 판 네 장을 3D 로 돌렸다. 「깊이」 는 보였지만
     <b>조직처럼 보이지가 않았다.</b> 고객이 보고 싶은 것은 판이 아니라
     제 살과 제 혈관이다.

     그래서 다시 그린다. 각질층·기저막·콜라겐 섬유·적혈구·지방세포까지
     교과서에 있는 그대로 층을 세우고, 그 위에 병이 어디서 시작해 어디까지
     파고드는지를 얹는다. 돌리는 대신 <b>확대해서 들여다본다</b> —
     조직은 돌려 보는 것이 아니라 들여다보는 것이다.

     ★ 사진이 아니라 <b>손으로 그린 그림</b>이다. 남의 자료를 복제하지 않는다.
     ★ 실제 두께·비율과 다르다. 층의 차례와 관계를 보여 주는 그림이다.
     ★ 진단이나 치료를 대신하지 않는다.                                  */

  /* 늘 같은 그림이 나와야 한다 — 열 때마다 세포 자리가 바뀌면 안 된다 */
  function rnd(seed) {
    var s = seed || 7;
    return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }

  var ASEQ = 0;
  /* 확대해서 보는 그림 한 장 */
  function art(o) {
    var id = 'dza' + (++ASEQ);
    return '<div class="dzart" id="' + id + '" data-vb="' + o.vb + '">' +
      '<div class="dzart-tools">' +
        '<button type="button" class="dzart-b" data-act="out">−</button>' +
        '<button type="button" class="dzart-b" data-act="in">+ 확대</button>' +
        '<button type="button" class="dzart-b" data-act="reset">처음으로</button>' +
        '<button type="button" class="dzart-b on" data-act="label">이름표 끄기</button>' +
      '</div>' +
      '<div class="dzart-view">' + o.svg + '</div>' +
      '<div class="dzart-hint">끌어서 옮기고, 휠이나 <b>+ 확대</b> 로 크게 봅니다 · 고객 앞에서는 <b>이름표를 끄고</b> 하나씩 짚어 보세요</div>' +
      '</div>';
  }

  /* 평면 도해 — 3D 가 필요 없는 것은 굳이 돌리지 않는다 */
  function flat(svg) { return '<div class="dzflat">' + svg + '</div>'; }

  /* ── 자주 쓰는 조각 ─────────────────────────────────────────── */
  var V = {};

  /* 이름표 — 짚는 점에서 선을 끌어 글자로 잇는다 */
  function lbl(x1, y1, x2, y2, t, sub, color) {
    color = color || '#334155';
    return '<g class="lbl">' +
      '<path d="M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 + '" stroke="' + color +
      '" stroke-width="1.4" fill="none" stroke-dasharray="4 3" opacity=".8"/>' +
      '<circle cx="' + x1 + '" cy="' + y1 + '" r="3.4" fill="' + color + '"/>' +
      '<text x="' + (x2 + 9) + '" y="' + (y2 + 5) + '" font-size="14.5" font-weight="800" fill="#0D1117">' + t + '</text>' +
      (sub ? '<text x="' + (x2 + 9) + '" y="' + (y2 + 23) + '" font-size="11.8" fill="#4B5563">' + sub + '</text>' : '') +
      '</g>';
  }
  /* 상자 너비를 t.length 로 재고 있었다. 한글은 라틴 글자보다 넓어
     긴 문장에서 <b>상자가 글자보다 짧아 잘려 나갔다.</b> 글자마다 재어 더한다. */
  function tw(t) {
    var w = 0, i, c;
    for (i = 0; i < t.length; i++) {
      c = t.charCodeAt(i);
      w += (c > 0x1100 && c < 0xD7FF) || (c >= 0xFF00 && c <= 0xFF60) ? 13.2 : 7.3;
    }
    return w;
  }
  function note(x, y, t, color) {
    return '<g class="lbl"><rect x="' + x + '" y="' + (y - 15) + '" width="' + (tw(t) + 18).toFixed(0) +
      '" height="23" rx="7" fill="' + (color || '#0F172A') + '" opacity=".92"/>' +
      '<text x="' + (x + 9) + '" y="' + (y + 1) + '" font-size="12.5" font-weight="800" fill="#fff">' + t + '</text></g>';
  }

  /* ═══ 피부 — 실제 층 그대로 ═══════════════════════════════════
     표피(각질층·유극층·기저층) · 기저막 · 진피(콜라겐·혈관·모낭·땀샘) ·
     피하지방. 표피와 진피의 경계는 <b>물결</b>이다 — 평평하지 않다.     */
  function skinBase(tumor) {
    var R = rnd(20260823), s = '';
    function wy(x) { return 190 + 15 * Math.sin(x / 36) + 5 * Math.sin(x / 12 + 1); }
    var X0 = 30, X1 = 700, i, j, x, y;

    /* 경계선 좌표 */
    function waveD(from, to, step) {
      var d = '', k;
      for (k = from; (step > 0 ? k <= to : k >= to); k += step) d += (d ? ' L' : 'M') + k + ' ' + wy(k).toFixed(1);
      return d;
    }
    var dermTop = waveD(X0, X1, 6);
    var epiPath = 'M' + X0 + ' 36 L' + X1 + ' 36 L' + X1 + ' ' + wy(X1).toFixed(1) + ' ' +
      waveD(X1, X0, -6).replace('M', 'L') + ' Z';
    var dermPath = 'M' + X0 + ' ' + wy(X0).toFixed(1) + ' ' + dermTop.replace('M', 'L') +
      ' L' + X1 + ' 404 L' + X0 + ' 404 Z';

    s += '<defs>' +
      '<linearGradient id="skEpi" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#F3E2CE"/><stop offset=".38" stop-color="#F8DCC4"/>' +
        '<stop offset="1" stop-color="#EFC49F"/></linearGradient>' +
      '<linearGradient id="skDerm" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#FBDDD8"/><stop offset="1" stop-color="#F3C7C0"/></linearGradient>' +
      '<linearGradient id="skFat" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#FDF3CE"/><stop offset="1" stop-color="#F8E7AE"/></linearGradient>' +
      '<clipPath id="cpEpi"><path d="' + epiPath + '"/></clipPath>' +
      '<clipPath id="cpDerm"><path d="' + dermPath + '"/></clipPath>' +
      '<clipPath id="cpFat"><rect x="' + X0 + '" y="404" width="' + (X1 - X0) + '" height="128"/></clipPath>' +
      '</defs>';

    /* 바탕 층 */
    s += '<rect x="' + X0 + '" y="12" width="' + (X1 - X0) + '" height="24" fill="#EFF3F8"/>';
    s += '<path d="' + epiPath + '" fill="url(#skEpi)"/>';
    s += '<path d="' + dermPath + '" fill="url(#skDerm)"/>';
    s += '<rect x="' + X0 + '" y="404" width="' + (X1 - X0) + '" height="128" fill="url(#skFat)"/>';

    /* ── 각질층 — 얇은 겹이 여러 장 쌓여 벗겨진다 ── */
    s += '<g clip-path="url(#cpEpi)">';
    for (i = 0; i < 9; i++) {
      y = 40 + i * 4.6;
      var d = 'M' + X0 + ' ' + y;
      for (x = X0 + 10; x <= X1; x += 22) d += ' Q' + (x - 11) + ' ' + (y + (i % 2 ? 2.4 : -2.4)) + ' ' + x + ' ' + y;
      s += '<path d="' + d + '" stroke="#DCC3A2" stroke-width="1.5" fill="none" opacity="' + (0.55 + i * 0.03) + '"/>';
    }
    /* 벗겨져 들리는 조각 */
    for (i = 0; i < 5; i++) {
      x = 70 + i * 130 + R() * 30;
      s += '<path d="M' + x + ' 40 q16 -7 34 -1 q-15 6 -34 1 Z" fill="#E7D2B6" stroke="#CBB08A" stroke-width="1"/>';
    }

    /* ── 유극층·과립층 — 다각형 세포, 위로 갈수록 납작 ── */
    var rows = [[86, 15, 7.5], [106, 14, 9], [126, 13, 10.5], [146, 12, 11.5]];
    for (j = 0; j < rows.length; j++) {
      var ry = rows[j][0], rw = rows[j][1], rh = rows[j][2];
      for (x = X0 + 8; x < X1; x += rw * 2 + 3) {
        var jitter = (R() - 0.5) * 3;
        s += '<ellipse cx="' + (x + jitter).toFixed(1) + '" cy="' + ry + '" rx="' + rw + '" ry="' + rh +
             '" fill="#FAE6D3" stroke="#D9A87E" stroke-width="1.1" opacity=".95"/>';
        if (j > 0) s += '<ellipse cx="' + (x + jitter).toFixed(1) + '" cy="' + ry + '" rx="' + (rw * 0.34) +
             '" ry="' + (rh * 0.4) + '" fill="#B9855C" opacity=".72"/>';
      }
    }

    /* ── 기저층 — 기둥 세포가 한 줄로 서 있다 + 멜라닌세포 ── */
    var mel = [];
    for (x = X0 + 10; x < X1; x += 15) {
      var by = wy(x);
      s += '<rect x="' + (x - 6) + '" y="' + (by - 26).toFixed(1) + '" width="12" height="24" rx="5.5" ' +
           'fill="#EDBE93" stroke="#C58B57" stroke-width="1.1"/>';
      s += '<ellipse cx="' + x + '" cy="' + (by - 14).toFixed(1) + '" rx="4" ry="6.5" fill="#96603A" opacity=".8"/>';
      if ((x - X0 - 10) % 105 === 0) mel.push([x, by]);
    }
    /* 멜라닌세포 — 가지를 위로 뻗는다 (흑색종이 시작하는 세포) */
    for (i = 0; i < mel.length; i++) {
      var mx = mel[i][0], my = mel[i][1] - 8;
      s += '<g><path d="M' + mx + ' ' + my + ' l-9 -16 M' + mx + ' ' + my + ' l9 -18 M' + mx + ' ' + my + ' l0 -22" ' +
           'stroke="#5A3A24" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
           '<ellipse cx="' + mx + '" cy="' + my + '" rx="6.5" ry="5.5" fill="#4A2E1C"/></g>';
    }
    s += '</g>';

    /* ── 기저막 — 이 한 줄이 침윤암과 상피내암을 가른다 ── */
    s += '<path d="' + dermTop + '" stroke="#B45309" stroke-width="3.4" fill="none"/>';
    s += '<path d="' + dermTop + '" stroke="#FCD34D" stroke-width="1.2" fill="none" opacity=".85"/>';

    /* ── 진피 ── */
    s += '<g clip-path="url(#cpDerm)">';
    /* 콜라겐 섬유 다발 */
    for (i = 0; i < 190; i++) {
      x = X0 + R() * (X1 - X0); y = 210 + R() * 190;
      var len = 26 + R() * 46, tilt = (R() - 0.5) * 26;
      s += '<path d="M' + x.toFixed(0) + ' ' + y.toFixed(0) + ' q' + (len / 2).toFixed(0) + ' ' + tilt.toFixed(0) +
           ' ' + len.toFixed(0) + ' 0" stroke="#E4A79D" stroke-width="' + (1 + R() * 1.6).toFixed(1) +
           '" fill="none" opacity="' + (0.45 + R() * 0.4).toFixed(2) + '"/>';
    }
    /* 유두층 모세혈관 고리 — 물결 봉우리마다 하나씩 올라온다 */
    for (x = X0 + 30; x < X1; x += 72) {
      var ty = wy(x) + 10;
      s += '<path d="M' + (x - 5) + ' ' + (ty + 46) + ' C' + (x - 7) + ' ' + (ty + 8) + ' ' + (x + 7) + ' ' + (ty + 8) +
           ' ' + (x + 5) + ' ' + (ty + 46) + '" stroke="#D9534F" stroke-width="2.6" fill="none"/>';
      s += '<circle cx="' + x + '" cy="' + (ty + 14) + '" r="2.2" fill="#C0392B"/>';
    }
    /* 큰 혈관 두 개 — 안에 적혈구 */
    function vessel(cx, cy, w, h, wall, lumen) {
      var g = '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + w + '" ry="' + h + '" fill="' + wall + '"/>' +
              '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (w - 5) + '" ry="' + (h - 5) + '" fill="' + lumen + '"/>';
      for (var q = 0; q < 9; q++) {
        var ax = cx + (R() - 0.5) * (w - 14), ay = cy + (R() - 0.5) * (h - 12);
        g += '<ellipse cx="' + ax.toFixed(0) + '" cy="' + ay.toFixed(0) + '" rx="5.2" ry="3.6" fill="#C62828"/>' +
             '<ellipse cx="' + ax.toFixed(0) + '" cy="' + ay.toFixed(0) + '" rx="2.2" ry="1.5" fill="#E57373"/>';
      }
      return g;
    }
    s += vessel(150, 352, 34, 20, '#C0392B', '#F7C9C4');
    s += vessel(600, 344, 30, 18, '#4A6FA5', '#CFDCF0');

    /* 모낭 + 피지선 + 입모근 */
    var hx = 300;
    s += '<path d="M' + (hx - 13) + ' 196 C' + (hx - 20) + ' 280 ' + (hx - 6) + ' 330 ' + (hx + 4) + ' 384 ' +
         'l26 -4 C' + (hx + 18) + ' 326 ' + (hx + 8) + ' 274 ' + (hx + 15) + ' 196 Z" fill="#F0D3AE" stroke="#C99A63" stroke-width="1.8"/>';
    s += '<path d="M' + hx + ' 384 l14 -2" stroke="#C99A63" stroke-width="1.4"/>';
    s += '<ellipse cx="' + (hx + 10) + '" cy="378" rx="15" ry="12" fill="#E8C398" stroke="#C99A63" stroke-width="1.6"/>';
    for (i = 0; i < 6; i++) {
      var sx = hx - 30 - (i % 3) * 6, sy = 236 + Math.floor(i / 3) * 17;
      s += '<circle cx="' + sx + '" cy="' + sy + '" r="10" fill="#FBE9B6" stroke="#D8B45F" stroke-width="1.4"/>';
    }
    s += '<path d="M' + (hx - 44) + ' 238 l-40 46" stroke="#C9756B" stroke-width="6" stroke-linecap="round" opacity=".85"/>';

    /* 땀샘 — 아래에서 꼬이고 관이 표피를 뚫고 올라간다 */
    var sw = 520;
    var coil = 'M' + sw + ' 380';
    for (i = 0; i < 7; i++) coil += ' q' + (i % 2 ? -30 : 30) + ' 12 0 24';
    s += '<path d="' + coil + '" stroke="#8FBF9E" stroke-width="7" fill="none" stroke-linecap="round" opacity=".95"/>';
    s += '<path d="M' + sw + ' 380 C' + (sw + 8) + ' 300 ' + (sw - 8) + ' 250 ' + (sw + 2) + ' ' + (wy(sw) + 4).toFixed(0) +
         '" stroke="#8FBF9E" stroke-width="5" fill="none"/>';
    s += '</g>';
    /* 털 — 모낭에서 나와 표피를 뚫고 밖으로 (진피 클립 밖이라야 보인다) */
    s += '<path d="M' + (hx + 1) + ' 300 C' + (hx - 5) + ' 200 ' + (hx + 7) + ' 90 ' + (hx + 2) + ' 6" ' +
         'stroke="#6B4423" stroke-width="4.4" fill="none" stroke-linecap="round"/>';

    /* 땀구멍 — 표피를 통과해 밖으로 */
    s += '<path d="M' + (sw + 2) + ' ' + (wy(sw) + 4).toFixed(0) + ' C' + (sw + 10) + ' 130 ' + (sw - 6) + ' 90 ' + (sw + 4) + ' 38" ' +
         'stroke="#8FBF9E" stroke-width="4.2" fill="none" opacity=".9"/>';

    /* 신경 */
    s += '<path d="M40 300 q60 -18 108 4 q54 20 104 -6" stroke="#E0B84A" stroke-width="3" fill="none" opacity=".9"/>';

    /* ── 피하지방 ── */
    s += '<g clip-path="url(#cpFat)">';
    for (j = 0; j < 3; j++) {
      for (i = 0; i < 16; i++) {
        var fx = X0 + 24 + i * 42 + (j % 2 ? 20 : 0) + (R() - 0.5) * 8;
        var fy = 430 + j * 40 + (R() - 0.5) * 8;
        var fr = 19 + R() * 6;
        s += '<circle cx="' + fx.toFixed(0) + '" cy="' + fy.toFixed(0) + '" r="' + fr.toFixed(0) +
             '" fill="#FFFBE8" stroke="#DEBB63" stroke-width="1.6"/>';
        s += '<circle cx="' + (fx + fr * 0.62).toFixed(0) + '" cy="' + (fy - fr * 0.5).toFixed(0) + '" r="3.2" fill="#B9923C"/>';
      }
    }
    s += '<path d="M' + X0 + ' 470 q170 -14 336 2 q160 14 334 -4" stroke="#D9B25A" stroke-width="2.4" fill="none" opacity=".7"/>';
    s += '</g>';

    /* 층 경계선 */
    s += '<path d="M' + X0 + ' 404 L' + X1 + ' 404" stroke="#D6A94E" stroke-width="2.2" opacity=".85"/>';
    s += '<rect x="' + X0 + '" y="12" width="' + (X1 - X0) + '" height="520" fill="none" stroke="#CBD5E1" stroke-width="1.5"/>';

    /* ── 병변 ── */
    if (tumor) {
      /* ① 기저세포암 — 기저층에서 시작해 아래로 둥글게 밀고 내려간다 */
      var bx = 130, by = wy(bx);
      s += '<path d="M' + (bx - 26) + ' ' + (by - 4) + ' q26 60 52 0 q-8 34 -26 36 q-18 -2 -26 -36 Z" fill="#7C3AED" opacity=".8"/>';
      for (i = 0; i < 9; i++) s += '<circle cx="' + (bx - 18 + (i % 4) * 12) + '" cy="' + (by + 12 + Math.floor(i / 4) * 13) +
        '" r="4.4" fill="#4C1D95"/>';
      /* ② 편평세포암 — 표피 안에서 두꺼워지고 각질을 만든다 */
      var qx = 400;
      s += '<path d="M' + (qx - 46) + ' 40 q46 -22 92 0 q10 60 -6 108 q-40 22 -80 0 q-16 -50 -6 -108 Z" fill="#DC2626" opacity=".55"/>';
      for (i = 0; i < 14; i++) s += '<circle cx="' + (qx - 34 + (i % 5) * 17) + '" cy="' + (62 + Math.floor(i / 5) * 22) +
        '" r="5.2" fill="#991B1B" opacity=".9"/>';
      /* ③ 흑색종 — 멜라닌세포에서 시작해 기저막을 뚫고 진피로, 혈관으로 */
      var nx = 600, ny = wy(nx);
      s += '<path d="M' + (nx - 40) + ' ' + (ny - 30) + ' q40 -20 80 0 q6 26 -8 40 q-32 14 -64 0 q-14 -14 -8 -40 Z" fill="#1F2937" opacity=".92"/>';
      s += '<path d="M' + (nx - 6) + ' ' + (ny + 6) + ' q-10 46 4 84 q16 34 34 44" stroke="#111827" stroke-width="13" ' +
           'fill="none" stroke-linecap="round" opacity=".9"/>';
      for (i = 0; i < 10; i++) s += '<circle cx="' + (nx - 14 + R() * 46).toFixed(0) + '" cy="' + (ny + 30 + R() * 96).toFixed(0) +
        '" r="' + (4 + R() * 3).toFixed(1) + '" fill="#0B1220"/>';
      s += '<path d="M' + (nx + 10) + ' ' + (ny + 120) + ' q-8 24 8 40" stroke="#111827" stroke-width="6" fill="none" stroke-dasharray="7 5"/>';
    }
    return s;
  }

  V.skin_cross = {
    t: '피부는 이렇게 생겼습니다 — 실제 층 그대로',
    d: '위에서부터 <b>각질층 · 표피 · 기저막 · 진피 · 피하지방</b>입니다. 표피와 진피의 경계는 평평하지 않고 <b>물결처럼 맞물려</b> 있습니다. ' +
       '진피에는 콜라겐 섬유와 혈관·모낭·피지선·땀샘·신경이 들어 있고, 그 아래가 지방입니다. ' +
       '<b>확대해서</b> 각질층이 여러 겹으로 벗겨지는 것, 기저층 세포가 한 줄로 서 있는 것까지 보실 수 있습니다.',
    dz: ['skin'],
    build: function () {
      var s = '<svg viewBox="0 0 1080 560" width="1080" height="560">' + skinBase(0);
      s += lbl(360, 52, 716, 52, '각질층', '죽은 세포가 겹겹이 · 매일 벗겨집니다', '#8B5E3C');
      s += lbl(230, 116, 716, 112, '표피', '아래에서 새 세포가 올라와 밀어 냅니다', '#B45309');
      s += lbl(470, 186, 716, 176, '기저층 · 멜라닌세포', '새 세포가 태어나는 줄 · 검은 세포가 색을 만듭니다', '#5A3A24');
      s += lbl(250, 200, 716, 240, '기저막', '이 한 줄을 뚫었느냐가 암의 갈림길입니다', '#B45309');
      s += lbl(430, 300, 716, 304, '진피 · 콜라겐', '피부의 힘줄 · 여기에 혈관과 신경이 있습니다', '#C0392B');
      s += lbl(300, 300, 716, 368, '모낭 · 피지선', '털이 자라는 주머니와 기름샘', '#C99A63');
      s += lbl(520, 400, 716, 424, '땀샘', '아래에서 꼬였다가 관이 표피를 뚫고 나갑니다', '#4E8C63');
      s += lbl(300, 460, 716, 476, '피하지방', '지방세포 하나하나가 기름 방울입니다', '#B9923C');
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1080 560' });
    }
  };

  V.skin_cancer = {
    t: '피부암은 어디서 시작해 어디까지 갑니까',
    d: '같은 피부암이라도 <b>시작하는 세포와 파고드는 깊이가 다릅니다.</b> ' +
       '기저세포암은 기저층에서 아래로 밀고 내려가고, 편평세포암은 표피 안에서 두꺼워지며, ' +
       '<b>흑색종은 멜라닌세포에서 시작해 기저막을 뚫고 진피의 혈관까지 내려갑니다.</b> ' +
       '보험에서 이 셋이 갈리는 자리이기도 합니다 — 기타피부암은 유사암, <b>악성흑색종(C43)은 일반암</b>으로 보는 것이 통상입니다.',
    dz: ['skin'],
    build: function () {
      var s = '<svg viewBox="0 0 1080 560" width="1080" height="560">' + skinBase(1);
      s += note(96, 560 - 22, '① 기저세포암 — 기저층에서 아래로', '#5B21B6');
      s += note(352, 560 - 22, '② 편평세포암 — 표피 안에서', '#991B1B');
      s += note(618, 560 - 22, '③ 흑색종 — 기저막을 뚫고 혈관까지', '#111827');
      s += lbl(130, 236, 716, 96, '① 기저세포암', '기저층에서 생겨 아래로 밀고 내려갑니다', '#5B21B6');
      s += lbl(400, 96, 716, 176, '② 편평세포암', '표피 안에서 두꺼워지고 각질을 만듭니다', '#991B1B');
      s += lbl(600, 168, 716, 268, '③ 흑색종 시작', '기저층의 멜라닌세포에서 생깁니다', '#111827');
      s += lbl(626, 306, 716, 348, '기저막을 뚫는다', '여기서부터 침윤암입니다', '#B45309');
      s += lbl(640, 400, 716, 432, '혈관을 타고 전이', '깊이 내려갈수록 멀리 갑니다', '#C0392B');
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1080 560' });
    }
  };


  /* ═══ 위·대장 벽 — 실제 층 단면 ═════════════════════════════
     점막(상피·고유판·점막근판) · 점막하층 · 고유근층(안쪽 돌림/바깥쪽 세로) ·
     장막. 핵심은 <b>림프관과 혈관이 점막하층부터 있다</b>는 것이다.
     그래서 점막에 머문 암은 내시경으로 벗겨 낼 수 있고, 점막하층을 넘으면
     전이 위험이 생겨 장기를 잘라 낸다.                                  */
  function gutWall(tumor) {
    var R = rnd(19771103), s = '', i, x, y;
    var X0 = 30, X1 = 700;
    s += '<defs>' +
      '<linearGradient id="gwMuc" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#FBD9D2"/><stop offset="1" stop-color="#F2BDB4"/></linearGradient>' +
      '<linearGradient id="gwSub" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#FDEBC8"/><stop offset="1" stop-color="#F8DCA6"/></linearGradient>' +
      '<linearGradient id="gwMus" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#E7C7C2"/><stop offset="1" stop-color="#D9AFA8"/></linearGradient>' +
      '</defs>';

    /* 층 바탕 */
    s += '<rect x="' + X0 + '" y="20" width="' + (X1 - X0) + '" height="26" fill="#EFF3F8"/>';   /* 속(내강) */
    s += '<rect x="' + X0 + '" y="46" width="' + (X1 - X0) + '" height="150" fill="url(#gwMuc)"/>';  /* 점막 */
    s += '<rect x="' + X0 + '" y="196" width="' + (X1 - X0) + '" height="96" fill="url(#gwSub)"/>';  /* 점막하층 */
    s += '<rect x="' + X0 + '" y="292" width="' + (X1 - X0) + '" height="70" fill="url(#gwMus)"/>';  /* 돌림근 */
    s += '<rect x="' + X0 + '" y="362" width="' + (X1 - X0) + '" height="62" fill="#DCB6AE"/>';      /* 세로근 */
    s += '<rect x="' + X0 + '" y="424" width="' + (X1 - X0) + '" height="26" fill="#E7E3DA"/>';      /* 장막 */

    /* ── 점막 — 손가락처럼 솟은 융모/샘 ── */
    for (x = X0 + 14; x < X1; x += 26) {
      var h = 108 + R() * 16;
      s += '<path d="M' + x + ' 190 L' + x + ' ' + (190 - h).toFixed(0) + ' q11 -13 22 0 L' + (x + 22) + ' 190 Z" ' +
           'fill="#F7C8C0" stroke="#D98D82" stroke-width="1.5"/>';
      for (i = 0; i < 6; i++) {
        s += '<ellipse cx="' + (x + 5.5) + '" cy="' + (190 - 14 - i * 17).toFixed(0) + '" rx="4.6" ry="6.4" fill="#C9645A" opacity=".55"/>';
        s += '<ellipse cx="' + (x + 16.5) + '" cy="' + (190 - 20 - i * 17).toFixed(0) + '" rx="4.6" ry="6.4" fill="#C9645A" opacity=".55"/>';
      }
    }
    /* 점막근판 — 점막의 바닥 */
    s += '<path d="M' + X0 + ' 194 L' + X1 + ' 194" stroke="#B4534A" stroke-width="3" opacity=".9"/>';

    /* ── 점막하층 — 여기부터 혈관과 림프관이 있다 ── */
    for (i = 0; i < 6; i++) {
      x = X0 + 60 + i * 108;
      s += '<ellipse cx="' + x + '" cy="' + (222 + (i % 2) * 34) + '" rx="17" ry="11" fill="#C0392B"/>' +
           '<ellipse cx="' + x + '" cy="' + (222 + (i % 2) * 34) + '" rx="12" ry="6.5" fill="#F7C9C4"/>';
      s += '<ellipse cx="' + (x + 44) + '" cy="' + (252 - (i % 2) * 30) + '" rx="16" ry="10" fill="#3F8A5F"/>' +
           '<ellipse cx="' + (x + 44) + '" cy="' + (252 - (i % 2) * 30) + '" rx="11" ry="5.6" fill="#D8F0E2"/>';
    }
    for (i = 0; i < 80; i++) {
      x = X0 + R() * (X1 - X0); y = 200 + R() * 86;
      s += '<path d="M' + x.toFixed(0) + ' ' + y.toFixed(0) + ' q14 ' + ((R() - 0.5) * 12).toFixed(0) + ' 28 0" ' +
           'stroke="#E0B36A" stroke-width="1.3" fill="none" opacity=".6"/>';
    }

    /* ── 고유근층 — 안쪽은 돌림(점), 바깥쪽은 세로(줄) ── */
    for (i = 0; i < 150; i++) {
      x = X0 + 8 + R() * (X1 - X0 - 16); y = 300 + R() * 54;
      s += '<ellipse cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" rx="6" ry="3.4" fill="#C79289" opacity=".75"/>';
    }
    for (x = X0 + 10; x < X1; x += 13) {
      s += '<path d="M' + x + ' 368 L' + (x + 3) + ' 418" stroke="#C08A82" stroke-width="4" opacity=".8" stroke-linecap="round"/>';
    }
    /* 근육층 사이 신경얼기 */
    for (i = 0; i < 5; i++) {
      x = X0 + 90 + i * 130;
      s += '<circle cx="' + x + '" cy="360" r="7" fill="#E0B84A" stroke="#B08A22" stroke-width="1.4"/>';
    }

    /* 층 경계 */
    ['46:#B4534A', '196:#D19A3F', '292:#B07F77', '362:#A87168', '424:#8E8A80'].forEach(function (t) {
      var p = t.split(':');
      s += '<path d="M' + X0 + ' ' + p[0] + ' L' + X1 + ' ' + p[0] + '" stroke="' + p[1] + '" stroke-width="2" opacity=".85"/>';
    });
    s += '<rect x="' + X0 + '" y="20" width="' + (X1 - X0) + '" height="430" fill="none" stroke="#CBD5E1" stroke-width="1.5"/>';

    /* ── 종양 ── */
    if (tumor) {
      /* ① 점막에 머문 것 */
      s += '<path d="M96 96 q34 -30 68 -4 q10 40 -10 84 q-30 16 -54 2 q-16 -46 -4 -82 Z" fill="#7F1D1D" opacity=".9"/>';
      for (i = 0; i < 12; i++) s += '<circle cx="' + (104 + (i % 4) * 17) + '" cy="' + (104 + Math.floor(i / 4) * 22) +
        '" r="5" fill="#450A0A"/>';
      /* ② 점막하층까지 내려간 것 */
      s += '<path d="M330 92 q40 -28 78 -2 q16 60 -4 122 q-38 24 -70 2 q-20 -60 -4 -122 Z" fill="#7F1D1D" opacity=".9"/>';
      s += '<path d="M356 208 q22 26 46 8 q10 30 -16 44 q-30 6 -38 -22 Z" fill="#450A0A"/>';
      /* 림프관·혈관으로 들어가는 세포 */
      s += '<circle cx="386" cy="252" r="6" fill="#450A0A"/><circle cx="404" cy="240" r="5" fill="#450A0A"/>';
      /* ③ 근육층을 넘어 장막까지 */
      s += '<path d="M566 92 q44 -30 84 -2 q18 66 -2 132 q-40 26 -76 2 q-22 -66 -6 -132 Z" fill="#7F1D1D" opacity=".9"/>';
      s += '<path d="M588 216 q34 40 66 18 q10 62 -14 112 q-38 24 -62 -6 q-14 -66 10 -124 Z" fill="#5B1111" opacity=".92"/>';
      s += '<path d="M604 430 q22 12 44 -4" stroke="#450A0A" stroke-width="7" fill="none" stroke-linecap="round"/>';
    }
    return s;
  }

  V.wall_layer = {
    t: '위·대장 벽은 이렇게 생겼습니다 — 실제 층 단면',
    d: '속(음식이 지나가는 쪽)부터 <b>점막 · 점막하층 · 근육층 · 장막</b>입니다. ' +
       '점막은 손가락처럼 솟은 샘으로 덮여 있고, <b>혈관과 림프관은 점막하층부터</b> 나타납니다. ' +
       '바로 이 때문에 <b>점막에 머문 암은 내시경으로 벗겨 낼 수 있고(ESD), 점막하층을 넘으면 잘라 냅니다</b> — ' +
       '그 아래에 퍼져 나갈 길이 있기 때문입니다.',
    dz: ['cancer_major'],
    build: function () {
      var s = '<svg viewBox="0 0 1000 470" width="1000" height="470">' + gutWall(0);
      s += lbl(360, 30, 716, 34, '속 (내강)', '음식이 지나가는 쪽입니다', '#64748B');
      s += lbl(200, 120, 716, 84, '점막', '손가락처럼 솟은 샘 — 암은 대개 여기서 시작합니다', '#B4534A');
      s += lbl(430, 240, 716, 170, '점막하층', '혈관과 림프관이 여기부터 있습니다 — 퍼져 나갈 길', '#B45309');
      s += lbl(300, 326, 716, 262, '근육층', '안쪽은 돌림근, 바깥쪽은 세로근 — 음식을 밀어 냅니다', '#A8615A');
      s += lbl(520, 436, 716, 348, '장막 (바깥막)', '뚫으면 배 안으로 퍼질 수 있습니다', '#7C7468');
      s += lbl(126, 222, 716, 412, '이 그림의 요점', '길(혈관·림프관)이 점막하층부터 열립니다', '#0F172A');
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1000 470' });
    }
  };

  V.wall_invade = {
    t: '얼마나 깊이 파고들었나 — 그래서 술식이 갈립니다',
    d: '같은 위암·대장암이라도 <b>깊이가 다르면 하는 수술이 다릅니다.</b> ' +
       '점막에 머물면 배를 열지 않고 내시경으로 벗겨 내고, 점막하층을 넘어가면 <b>퍼져 나갈 길에 닿았기 때문에</b> 장기와 림프절을 함께 잘라 냅니다. ' +
       '보험에서도 여기가 갈립니다 — 내시경으로 끝나면 <b>수술비 담보에서 수술로 안 볼 수 있습니다.</b>',
    dz: ['cancer_major'],
    build: function () {
      var s = '<svg viewBox="0 0 1000 470" width="1000" height="470">' + gutWall(1);
      s += note(74, 462, '① 점막에만', '#166534');
      s += note(318, 462, '② 점막하층까지', '#B45309');
      s += note(556, 462, '③ 근육층을 넘어', '#991B1B');
      s += lbl(130, 140, 716, 70, '① 점막에만 머문 암', '내시경으로 벗겨 냅니다 (ESD) · 배를 열지 않습니다', '#166534');
      s += lbl(370, 240, 716, 160, '② 점막하층까지 내려간 암', '혈관·림프관에 닿습니다 → 잘라 내고 림프절도 봅니다', '#B45309');
      s += lbl(400, 258, 716, 240, '림프관으로 들어가는 세포', '여기서부터 전이가 시작됩니다', '#7F1D1D');
      s += lbl(620, 330, 716, 320, '③ 근육층을 넘은 암', '장막까지 뚫으면 배 안으로 퍼질 수 있습니다', '#991B1B');
      s += lbl(614, 434, 716, 402, '장막을 뚫음', '더 큰 수술과 항암이 따라옵니다', '#450A0A');
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1000 470' });
    }
  };

  /* ═══ 혈관 — 실제 단면 ══════════════════════════════════════
     동맥은 세 겹이다. 안쪽부터 내막(내피세포 한 줄) · 중막(평활근·탄성판) ·
     외막(콜라겐). 기름때(죽상반)는 <b>내막 안쪽에</b> 쌓이고, 그 위를 얇은
     섬유 피막이 덮는다. 이 피막이 찢어지는 순간 피떡이 생겨 막힌다.       */
  function artery(cx, cy, R0, plaque, R) {
    var s = '', i, a, r, t;
    /* 외막 */
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R0 + '" fill="#F4E2D6" stroke="#C8A183" stroke-width="2"/>';
    for (i = 0; i < 90; i++) {
      a = R() * Math.PI * 2; r = R0 - 6 - R() * 26;
      var px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      t = (a * 180 / Math.PI) + 90;
      s += '<path d="M' + px.toFixed(0) + ' ' + py.toFixed(0) + ' q9 4 18 0" stroke="#D6AE8C" stroke-width="1.3" ' +
           'fill="none" opacity=".75" transform="rotate(' + t.toFixed(0) + ' ' + px.toFixed(0) + ' ' + py.toFixed(0) + ')"/>';
    }
    /* 외막의 제 혈관 (vasa vasorum) */
    for (i = 0; i < 5; i++) {
      a = i * 1.26 + 0.4; r = R0 - 16;
      s += '<circle cx="' + (cx + Math.cos(a) * r).toFixed(0) + '" cy="' + (cy + Math.sin(a) * r).toFixed(0) +
           '" r="5" fill="#C0392B" opacity=".8"/>';
    }
    /* 중막 — 평활근이 둘레를 감싼다 */
    var R1 = R0 - 34;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R1 + '" fill="#E3B7AE" stroke="#B9776C" stroke-width="2.4"/>';
    for (i = 0; i < 210; i++) {
      a = R() * Math.PI * 2; r = R1 - 5 - R() * (R1 - 46);
      var mx = cx + Math.cos(a) * r, my = cy + Math.sin(a) * r;
      t = (a * 180 / Math.PI) + 90;
      s += '<ellipse cx="' + mx.toFixed(0) + '" cy="' + my.toFixed(0) + '" rx="8.5" ry="3" fill="#C88C82" ' +
           'transform="rotate(' + t.toFixed(0) + ' ' + mx.toFixed(0) + ' ' + my.toFixed(0) + ')" opacity=".9"/>';
    }
    /* 탄성판 — 물결치는 동심원 */
    for (i = 0; i < 3; i++) {
      r = R1 - 12 - i * 16;
      var d = '', k;
      for (k = 0; k <= 72; k++) {
        a = k / 72 * Math.PI * 2;
        var rr = r + Math.sin(k * 1.7) * 2.6;
        d += (k ? ' L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1);
      }
      s += '<path d="' + d + ' Z" stroke="#A45C50" stroke-width="1.8" fill="none" opacity=".8"/>';
    }
    /* 내막 + 내피세포 한 줄 */
    var R2 = R0 - 78;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R2 + '" fill="#FBE9E5" stroke="#C98C82" stroke-width="1.6"/>';
    var R3 = R2 - 9;
    for (i = 0; i < 46; i++) {
      a = i / 46 * Math.PI * 2;
      var ex = cx + Math.cos(a) * R3, ey = cy + Math.sin(a) * R3;
      t = (a * 180 / Math.PI) + 90;
      s += '<ellipse cx="' + ex.toFixed(0) + '" cy="' + ey.toFixed(0) + '" rx="7" ry="3.2" fill="#F6C6BC" ' +
           'stroke="#B9776C" stroke-width="1" transform="rotate(' + t.toFixed(0) + ' ' + ex.toFixed(0) + ' ' + ey.toFixed(0) + ')"/>';
    }
    /* 내강 */
    var lum = R3 - 5;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + lum + '" fill="#FDF6F4"/>';

    /* 죽상반 — 아래쪽에 치우쳐 쌓인다 */
    if (plaque) {
      var th = plaque === 1 ? 0.34 : 0.62;           /* 두께 비율 */
      var pr = lum * th;
      s += '<path d="M' + (cx - lum * 0.95) + ' ' + (cy + lum * 0.28) +
           ' Q' + cx + ' ' + (cy + lum * 0.34 - pr * 2.1) + ' ' + (cx + lum * 0.95) + ' ' + (cy + lum * 0.28) +
           ' A' + lum + ' ' + lum + ' 0 0 0 ' + (cx - lum * 0.95) + ' ' + (cy + lum * 0.28) + ' Z" ' +
           'fill="#F0D68A" stroke="#C9A23F" stroke-width="1.6"/>';
      /* 지질핵 */
      s += '<ellipse cx="' + cx + '" cy="' + (cy + lum * 0.42).toFixed(0) + '" rx="' + (lum * 0.52).toFixed(0) +
           '" ry="' + (pr * 0.72).toFixed(0) + '" fill="#E9C24A" opacity=".95"/>';
      /* 콜레스테롤 결정 — 바늘 모양 틈 */
      for (i = 0; i < 9; i++) {
        var qx = cx - lum * 0.38 + i * (lum * 0.095), qy = cy + lum * 0.42 + (R() - 0.5) * pr * 0.7;
        s += '<path d="M' + qx.toFixed(0) + ' ' + qy.toFixed(0) + ' l' + (10 + R() * 12).toFixed(0) + ' ' +
             ((R() - 0.5) * 10).toFixed(0) + '" stroke="#fff" stroke-width="2.4" opacity=".92" stroke-linecap="round"/>';
      }
      /* 거품세포 */
      for (i = 0; i < 14; i++) {
        var fx = cx + (R() - 0.5) * lum * 1.3, fy = cy + lum * 0.22 + R() * pr * 1.2;
        s += '<circle cx="' + fx.toFixed(0) + '" cy="' + fy.toFixed(0) + '" r="6.5" fill="#FFF6D6" stroke="#C9A23F" stroke-width="1.2"/>';
        s += '<circle cx="' + (fx + 2).toFixed(0) + '" cy="' + (fy - 2).toFixed(0) + '" r="2" fill="#8A6B1F"/>';
      }
      /* 석회화 */
      s += '<path d="M' + (cx - lum * 0.62) + ' ' + (cy + lum * 0.56) + ' q16 -12 32 -2 q-6 14 -32 2 Z" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1.4"/>';
      /* 섬유성 피막 */
      s += '<path d="M' + (cx - lum * 0.95) + ' ' + (cy + lum * 0.28) +
           ' Q' + cx + ' ' + (cy + lum * 0.34 - pr * 2.1) + ' ' + (cx + lum * 0.95) + ' ' + (cy + lum * 0.28) + '" ' +
           'stroke="#F5F5F4" stroke-width="5" fill="none"/>';
      s += '<path d="M' + (cx - lum * 0.95) + ' ' + (cy + lum * 0.28) +
           ' Q' + cx + ' ' + (cy + lum * 0.34 - pr * 2.1) + ' ' + (cx + lum * 0.95) + ' ' + (cy + lum * 0.28) + '" ' +
           'stroke="#B7B3AC" stroke-width="1.4" fill="none"/>';
    }

    /* 적혈구 — 가운데가 옅은 원반 */
    var n = plaque === 2 ? 5 : (plaque === 1 ? 11 : 20);
    for (i = 0; i < n; i++) {
      a = R() * Math.PI * 2; r = R() * lum * (plaque ? 0.5 : 0.86);
      var rx0 = cx + Math.cos(a) * r, ry0 = cy - (plaque ? lum * 0.34 : 0) + Math.sin(a) * r * (plaque ? 0.5 : 1);
      t = R() * 180;
      s += '<g transform="rotate(' + t.toFixed(0) + ' ' + rx0.toFixed(0) + ' ' + ry0.toFixed(0) + ')">' +
           '<ellipse cx="' + rx0.toFixed(0) + '" cy="' + ry0.toFixed(0) + '" rx="9" ry="6.4" fill="#C62828"/>' +
           '<ellipse cx="' + rx0.toFixed(0) + '" cy="' + ry0.toFixed(0) + '" rx="4" ry="2.8" fill="#E57373"/></g>';
    }
    return s;
  }

  V.artery_cross = {
    t: '혈관은 세 겹입니다 — 실제 단면',
    d: '동맥을 잘라 보면 <b>안쪽부터 내막 · 중막 · 외막</b> 세 겹입니다. 내막 맨 안쪽에는 <b>내피세포가 한 줄</b>로 깔려 있어 피가 미끄러지듯 흐릅니다. ' +
       '기름때(죽상반)는 바로 <b>이 내피 아래에</b> 쌓입니다 — 혈관 안쪽에 때가 끼는 것이 아니라, <b>벽 속에</b> 쌓여 안쪽으로 부풀어 오르는 것입니다. ' +
       '확대해서 노란 지질핵과 그 위를 덮은 얇은 흰 피막을 보십시오.',
    dz: ['mi', 'stroke', 'chronic'],
    build: function () {
      var R = rnd(20240517);
      var s = '<svg viewBox="0 0 1080 560" width="1080" height="560">';
      s += '<rect x="0" y="0" width="1080" height="560" fill="#FBFCFD"/>';
      s += artery(196, 268, 172, 0, R);
      s += artery(556, 268, 172, 1, R);
      s += '<text x="196" y="486" font-size="16" font-weight="800" fill="#0D1117" text-anchor="middle">정상 동맥</text>';
      s += '<text x="196" y="510" font-size="12.5" fill="#4B5563" text-anchor="middle">길이 넓고 피가 잘 흐릅니다</text>';
      s += '<text x="556" y="486" font-size="16" font-weight="800" fill="#0D1117" text-anchor="middle">기름때가 쌓인 동맥</text>';
      s += '<text x="556" y="510" font-size="12.5" fill="#4B5563" text-anchor="middle">벽 속에 쌓여 안쪽으로 부풀어 오릅니다</text>';
      s += lbl(196, 113, 742, 84, '외막', '바깥을 감싸는 콜라겐 · 제 혈관도 있습니다', '#A97C5C');
      s += lbl(196, 150, 742, 148, '중막', '평활근이 둘레를 감아 조였다 폈다 합니다', '#A45C50');
      s += lbl(196, 183, 742, 212, '내막 · 내피세포', '피와 맞닿는 한 줄 — 여기가 상하면서 시작됩니다', '#B9776C');
      s += lbl(160, 268, 742, 276, '적혈구', '가운데가 옴폭한 원반입니다', '#C62828');
      s += lbl(556, 302, 742, 340, '지질핵(기름 덩어리)', '콜레스테롤 결정과 거품세포가 뭉쳐 있습니다', '#B7891F');
      s += lbl(556, 240, 742, 404, '섬유성 피막', '이 얇은 뚜껑이 찢어지면 피떡이 생깁니다', '#8A857D');
      s += lbl(504, 315, 742, 468, '석회화', '오래되면 딱딱하게 굳습니다', '#64748B');
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1080 560' });
      return art({ svg: s, vb: '0 0 1080 560' });
    }
  };

  V.artery_rupture = {
    t: '피막이 찢어지는 순간 — 이래서 갑자기 옵니다',
    d: '「어제까지 멀쩡했는데」 라는 말이 나오는 이유입니다. 기름때는 여러 해에 걸쳐 조용히 쌓이지만, ' +
       '<b>그 위를 덮은 얇은 피막이 찢어지는 것은 한순간</b>입니다. 찢어진 자리에 피가 닿으면 몸은 상처인 줄 알고 피를 굳혀 버립니다. ' +
       '그렇게 만들어진 피떡이 남은 길마저 막습니다 — 이것이 심근경색이고 뇌경색입니다.',
    dz: ['mi', 'stroke'],
    build: function () {
      var R = rnd(31415926);
      var s = '<svg viewBox="0 0 1080 560" width="1080" height="560">';
      s += '<rect x="0" y="0" width="1080" height="560" fill="#FBFCFD"/>';
      s += artery(196, 268, 172, 1, R);
      s += artery(556, 268, 172, 2, R);
      /* 찢어진 자리와 피떡 */
      var cx = 556, cy = 268, lum = 172 - 92;
      s += '<path d="M' + (cx - 20) + ' ' + (cy + lum * 0.06) + ' l14 -16 l10 16 l12 -12" stroke="#7F1D1D" stroke-width="3.6" fill="none" stroke-linecap="round"/>';
      var clot = 'M' + (cx - 62) + ' ' + (cy - 6);
      for (var i = 0; i < 10; i++) clot += ' q' + (i % 2 ? 16 : -16) + ' -14 ' + 13 + ' -' + (5 + R() * 8).toFixed(0);
      s += '<path d="' + clot + '" stroke="#7F1D1D" stroke-width="5" fill="none" opacity=".9"/>';
      s += '<ellipse cx="' + cx + '" cy="' + (cy - 26) + '" rx="66" ry="34" fill="#991B1B" opacity=".85"/>';
      for (i = 0; i < 26; i++) {
        var px = cx + (R() - 0.5) * 120, py = cy - 26 + (R() - 0.5) * 58;
        s += '<circle cx="' + px.toFixed(0) + '" cy="' + py.toFixed(0) + '" r="' + (2.4 + R() * 2).toFixed(1) + '" fill="#FCA5A5" opacity=".9"/>';
      }
      s += '<text x="196" y="486" font-size="16" font-weight="800" fill="#0D1117" text-anchor="middle">쌓이는 동안 — 여러 해</text>';
      s += '<text x="196" y="510" font-size="12.5" fill="#4B5563" text-anchor="middle">아프지 않습니다. 그래서 모릅니다</text>';
      s += '<text x="556" y="486" font-size="16" font-weight="800" fill="#0D1117" text-anchor="middle">찢어지는 순간 — 한순간</text>';
      s += '<text x="556" y="510" font-size="12.5" fill="#4B5563" text-anchor="middle">피떡이 남은 길을 막습니다</text>';
      s += lbl(540, 274, 742, 120, '찢어진 피막', '뚜껑이 터진 자리입니다', '#7F1D1D');
      s += lbl(556, 242, 742, 208, '피떡(혈전)', '몸이 상처인 줄 알고 피를 굳힙니다', '#991B1B');
      s += lbl(596, 248, 742, 296, '혈소판', '먼저 달라붙어 그물의 시작이 됩니다', '#DC2626');
      s += lbl(556, 300, 742, 384, '남은 기름때', '이건 그대로 있습니다 — 그래서 또 옵니다', '#B7891F');
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1080 560' });
    }
  };

  /* ═══ 암 — 세포가 기저막을 뚫는 순간 ════════════════════════
     상피는 <b>기저막</b>이라는 얇은 막 위에 얹혀 있다. 세포가 아무리
     이상해져도 이 막 위에 머물러 있으면 퍼져 나갈 길이 없다(제자리암).
     이 막을 뚫고 내려가면 그 아래 혈관·림프관에 닿는다(침윤암).
     보험이 유사암과 일반암을 가르는 자리가 바로 여기다.                */
  function epiPanel(x0, mode, R) {
    var s = '', i, j, W = 218, TOP = 66, BM = 262, BOT = 396;
    /* 결합조직(아래) */
    s += '<rect x="' + x0 + '" y="' + BM + '" width="' + W + '" height="' + (BOT - BM) + '" fill="#FBE3DE"/>';
    for (i = 0; i < 46; i++) {
      var cx0 = x0 + 6 + R() * (W - 12), cy0 = BM + 8 + R() * (BOT - BM - 16);
      s += '<path d="M' + cx0.toFixed(0) + ' ' + cy0.toFixed(0) + ' q13 ' + ((R() - 0.5) * 10).toFixed(0) + ' 26 0" ' +
           'stroke="#E7A99F" stroke-width="1.3" fill="none" opacity=".8"/>';
    }
    /* 혈관 하나 */
    var vx = x0 + W * 0.66, vy = BOT - 34;
    s += '<ellipse cx="' + vx.toFixed(0) + '" cy="' + vy + '" rx="34" ry="19" fill="#C0392B"/>' +
         '<ellipse cx="' + vx.toFixed(0) + '" cy="' + vy + '" rx="28" ry="13" fill="#FBDDDA"/>';
    for (i = 0; i < 4; i++) {
      var bx = vx - 16 + i * 11, by = vy + (R() - 0.5) * 12;
      s += '<ellipse cx="' + bx.toFixed(0) + '" cy="' + by.toFixed(0) + '" rx="6.4" ry="4.4" fill="#C62828"/>' +
           '<ellipse cx="' + bx.toFixed(0) + '" cy="' + by.toFixed(0) + '" rx="2.6" ry="1.8" fill="#E57373"/>';
    }
    /* 상피(위) */
    s += '<rect x="' + x0 + '" y="' + TOP + '" width="' + W + '" height="' + (BM - TOP) + '" fill="#FDF0E4"/>';

    var rows = [[BM - 26, 13, 11], [BM - 54, 13, 10], [BM - 82, 13, 9], [BM - 108, 14, 7.5], [BM - 130, 15, 6]];
    for (j = 0; j < rows.length; j++) {
      var ry = rows[j][0], rw = rows[j][1], rh = rows[j][2];
      for (var x = x0 + 10; x < x0 + W - 6; x += rw * 2 + 2) {
        var odd = 0, big = 0, dark = 0;
        if (mode === 1 && j <= 1) { odd = 1; big = 1; }                  /* 이형성 — 아래쪽만 */
        if (mode === 2) { odd = 1; big = 1; dark = 1; }                  /* 상피내암 — 전층 */
        if (mode === 3) { odd = 1; big = 1; dark = 1; }
        var jx = odd ? (R() - 0.5) * 7 : 0, jy = odd ? (R() - 0.5) * 6 : 0;
        var w2 = rw * (big ? 0.9 + R() * 0.5 : 1), h2 = rh * (big ? 0.9 + R() * 0.5 : 1);
        s += '<ellipse cx="' + (x + jx).toFixed(1) + '" cy="' + (ry + jy).toFixed(1) + '" rx="' + w2.toFixed(1) +
             '" ry="' + h2.toFixed(1) + '" fill="#FBE2CE" stroke="#D9A87E" stroke-width="1.1"/>';
        var nr = big ? (0.44 + R() * 0.26) : 0.3;
        s += '<ellipse cx="' + (x + jx).toFixed(1) + '" cy="' + (ry + jy).toFixed(1) + '" rx="' + (w2 * nr).toFixed(1) +
             '" ry="' + (h2 * nr).toFixed(1) + '" fill="' + (dark ? '#5B2E86' : '#9A6A45') + '" opacity="' + (dark ? '.92' : '.8') + '"/>';
      }
    }
    /* 기저막 */
    if (mode < 3) {
      s += '<path d="M' + x0 + ' ' + BM + ' L' + (x0 + W) + ' ' + BM + '" stroke="#B45309" stroke-width="5"/>';
      s += '<path d="M' + x0 + ' ' + BM + ' L' + (x0 + W) + ' ' + BM + '" stroke="#FCD34D" stroke-width="1.6"/>';
    } else {
      /* 뚫린 기저막 — 조각조각 끊어진다 */
      var seg = [[0, 46], [58, 30], [104, 22], [150, 68]];
      for (i = 0; i < seg.length; i++) {
        s += '<path d="M' + (x0 + seg[i][0]) + ' ' + BM + ' l' + seg[i][1] + ' 0" stroke="#B45309" stroke-width="5"/>';
        s += '<path d="M' + (x0 + seg[i][0]) + ' ' + BM + ' l' + seg[i][1] + ' 0" stroke="#FCD34D" stroke-width="1.6"/>';
      }
      /* 아래로 내려간 암세포 무리 */
      for (i = 0; i < 16; i++) {
        var ix = x0 + 22 + R() * (W - 50), iy = BM + 12 + R() * 96;
        s += '<ellipse cx="' + ix.toFixed(0) + '" cy="' + iy.toFixed(0) + '" rx="' + (9 + R() * 4).toFixed(1) +
             '" ry="' + (8 + R() * 3).toFixed(1) + '" fill="#F3D2BC" stroke="#B4785A" stroke-width="1.1"/>';
        s += '<ellipse cx="' + ix.toFixed(0) + '" cy="' + iy.toFixed(0) + '" rx="5.4" ry="4.6" fill="#5B2E86" opacity=".92"/>';
      }
      /* 혈관 안으로 들어가는 세포 */
      s += '<ellipse cx="' + (vx - 4).toFixed(0) + '" cy="' + (vy - 3) + '" rx="9" ry="8" fill="#F3D2BC" stroke="#B4785A" stroke-width="1.1"/>';
      s += '<ellipse cx="' + (vx - 4).toFixed(0) + '" cy="' + (vy - 3) + '" rx="5" ry="4.4" fill="#5B2E86"/>';
      s += '<path d="M' + (vx - 40) + ' ' + (vy - 26) + ' q16 12 30 18" stroke="#5B2E86" stroke-width="2.4" ' +
           'fill="none" stroke-dasharray="5 4"/>';
    }
    s += '<rect x="' + x0 + '" y="' + TOP + '" width="' + W + '" height="' + (BOT - TOP) + '" fill="none" stroke="#CBD5E1" stroke-width="1.4"/>';
    return s;
  }

  V.cancer_invade = {
    t: '암세포는 이렇게 자랍니다 — 기저막을 뚫느냐',
    d: '피부든 위든 자궁경부든, 겉을 덮은 세포층은 <b>기저막</b>이라는 얇은 막 위에 얹혀 있습니다. ' +
       '세포가 이상해지고(이형성) 층 전체가 암세포로 바뀌어도, <b>이 막 위에 머물러 있으면 퍼져 나갈 길이 없습니다</b> — 이것이 제자리암입니다. ' +
       '이 막을 뚫고 내려가는 순간 그 아래 <b>혈관과 림프관에 닿습니다</b> — 이것이 침윤암입니다. ' +
       '보험이 <b>유사암과 일반암을 가르는 자리</b>가 바로 이 한 줄입니다.',
    dz: ['cancer_major', 'cancer_female', 'thyroid', 'skin'],
    build: function () {
      var R = rnd(88888), s = '';
      s = '<svg viewBox="0 0 1000 570" width="1000" height="570">';
      s += '<rect x="0" y="0" width="1000" height="570" fill="#FBFCFD"/>';
      var titles = [
        ['정상', ['세포가 줄 맞춰 있고', '핵이 작습니다'], '#166534'],
        ['이형성', ['아래쪽 세포가 커지고', '배열이 흐트러집니다'], '#B45309'],
        ['제자리암 (상피내암)', ['층 전체가 암세포', '그러나 막은 온전합니다'], '#7C3AED'],
        ['침윤암', ['막을 뚫고 내려가', '혈관에 닿습니다'], '#991B1B']
      ];
      for (var i = 0; i < 4; i++) {
        var x0 = 24 + i * 240;
        s += epiPanel(x0, i, R);
        s += '<text x="' + (x0 + 109) + '" y="46" font-size="15.5" font-weight="800" fill="' + titles[i][2] +
             '" text-anchor="middle">' + titles[i][0] + '</text>';
        s += '<text x="' + (x0 + 109) + '" y="422" font-size="11.8" fill="#4B5563" text-anchor="middle">' + titles[i][1][0] + '</text>';
        s += '<text x="' + (x0 + 109) + '" y="440" font-size="11.8" fill="#4B5563" text-anchor="middle">' + titles[i][1][1] + '</text>';
      }
      /* 기저막이 어디인지 한 번 짚어 준다 — 선이 엉키지 않게 아래에서 */
      s += '<g class="lbl">';
      s += '<path d="M133 262 L133 300" stroke="#B45309" stroke-width="2" stroke-dasharray="4 3"/>';
      s += '<circle cx="133" cy="262" r="4" fill="#B45309"/>';
      s += '<rect x="46" y="300" width="176" height="26" rx="8" fill="#B45309"/>';
      s += '<text x="134" y="318" font-size="12.5" font-weight="800" fill="#fff" text-anchor="middle">기저막 (노란 줄)</text>';
      /* 보험 칸 */
      s += '<rect x="24" y="462" width="698" height="36" rx="10" fill="#D97706" opacity=".15" stroke="#D97706" stroke-width="1.6"/>';
      s += '<text x="373" y="486" font-size="13.5" font-weight="800" fill="#B45309" text-anchor="middle">여기까지는 막 위 — 보험에서는 유사암(제자리암) 칸</text>';
      s += '<rect x="744" y="462" width="232" height="36" rx="10" fill="#DC2626" opacity=".15" stroke="#DC2626" stroke-width="1.6"/>';
      s += '<text x="860" y="486" font-size="13.5" font-weight="800" fill="#991B1B" text-anchor="middle">막을 뚫으면 일반암 칸</text>';
      s += '<rect x="24" y="510" width="952" height="40" rx="11" fill="#0F172A" opacity=".93"/>';
      s += '<text x="500" y="536" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">' +
        '기저막을 뚫었느냐 — 그 한 줄이 유사암과 일반암을 가릅니다</text>';
      s += '</g>';
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1000 570' });
    }
  };

  /* ═══ 2. 혈관 — 좁아지고, 막히고, 열어 둔다 ═══ */
  function tube(idn, plaque, stent, cap) {
    /* 원통 하나 — 앞뒤 타원으로 두께를 만든다 */
    var s = '<svg viewBox="0 0 210 150" width="210" height="150">';
    s += '<defs><linearGradient id="g' + idn + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#FCA5A5"/><stop offset="1" stop-color="#DC2626"/></linearGradient></defs>';
    /* 바깥 벽 */
    s += '<path d="M30 40 L180 40 A16 32 0 0 1 180 104 L30 104 A16 32 0 0 1 30 40 Z" fill="url(#g' + idn + ')" opacity=".28"/>';
    s += '<ellipse cx="30" cy="72" rx="16" ry="32" fill="#FEE2E2" stroke="#DC2626" stroke-width="2.5"/>';
    s += '<path d="M30 40 L180 40" stroke="#DC2626" stroke-width="2.5" fill="none"/>';
    s += '<path d="M30 104 L180 104" stroke="#DC2626" stroke-width="2.5" fill="none"/>';
    s += '<ellipse cx="180" cy="72" rx="16" ry="32" fill="none" stroke="#DC2626" stroke-width="2.5"/>';
    /* 기름때 */
    if (plaque > 0) {
      var t = 4 + plaque * 20;
      s += '<path d="M70 ' + (40 + t) + ' Q105 ' + (52 + t) + ' 145 ' + (40 + t) + ' L145 40 L70 40 Z" fill="#FBBF24" opacity=".9"/>';
      s += '<path d="M70 ' + (104 - t) + ' Q105 ' + (92 - t) + ' 145 ' + (104 - t) + ' L145 104 L70 104 Z" fill="#FBBF24" opacity=".9"/>';
    }
    /* 스텐트 그물 */
    if (stent) {
      var m = '';
      for (var i = 0; i < 7; i++) {
        var x = 70 + i * 12;
        m += '<path d="M' + x + ' 44 L' + (x + 12) + ' 100 M' + x + ' 100 L' + (x + 12) + ' 44" ' +
             'stroke="#1A56DB" stroke-width="2.2" fill="none" opacity=".95"/>';
      }
      s += m;
    }
    s += '<text x="105" y="132" font-size="12.5" font-weight="800" fill="#0D1117" text-anchor="middle">' + cap + '</text>';
    s += '</svg>';
    return s;
  }
  /* ═══ 심장 — 관상동맥 세 갈래와, 막히면 죽는 자리 ═══════════════
     심장은 제 밥그릇이 따로 있다. 심장 <b>겉</b>을 타고 내려가는
     관상동맥이다. 왼쪽 주간부에서 앞내림가지(LAD)와 휘돌이가지(LCx)가
     갈리고, 오른쪽으로 오른관상동맥(RCA)이 돈다.

     중요한 것은 <b>어디가 막히면 어디가 죽는가</b> 이다. 혈관은 가지를
     치며 내려가므로 <b>위쪽이 막힐수록 굶는 자리가 넓다.</b>

     윤곽을 베지에로 어림했더니 <b>달걀</b>이 나왔다. 그래서 둘레를
     각도·반지름으로 찍고 매끄럽게 잇는다 — 숫자 몇 개만 만지면 모양이
     잡히고, 눈으로 보고 고칠 수 있다.

     ★ 실제 비율·모양과 다르다. 갈래와 관계를 보여 주는 그림이다.          */

  /* 점들을 매끄러운 닫힌 곡선으로 잇는다 (Catmull-Rom → 3차 베지에) */
  function smoothClosed(pts) {
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1), n = pts.length, i;
    for (i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ',' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) +
           ',' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d + ' Z';
  }

  /* 앞에서 본 심장 — 밑동은 넓고 오른위로 기울며, 꼭지는 왼아래를 향한다 */
  var HEART_PTS = [
    [470, 100], [558, 110], [632, 152], [674, 226], [690, 314],
    [668, 400], [618, 472], [548, 530], [480, 566], [432, 580],
    [400, 558], [370, 494], [344, 400], [332, 288], [356, 182], [408, 124]
  ];
  var HEART_D = smoothClosed(HEART_PTS);

  function heartBody(occl) {
    var R = rnd(20260824), s = '', i, a, x, y, t;

    s += '<defs>' +
      '<clipPath id="cpHeart"><path d="' + HEART_D + '"/></clipPath>' +
      '<linearGradient id="gMyo" x1="0.1" y1="0" x2="0.9" y2="1">' +
        '<stop offset="0" stop-color="#BE4A41"/><stop offset="0.55" stop-color="#A63A33"/>' +
        '<stop offset="1" stop-color="#7E2823"/></linearGradient>' +
      '<linearGradient id="gDead" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#EFE2D2"/><stop offset="1" stop-color="#CBB299"/></linearGradient>' +
      '<linearGradient id="gAo" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="#9E332F"/><stop offset="0.45" stop-color="#C85850"/>' +
        '<stop offset="1" stop-color="#8E2B27"/></linearGradient>' +
      '<linearGradient id="gPa" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="#3F628F"/><stop offset="0.45" stop-color="#6D93C2"/>' +
        '<stop offset="1" stop-color="#3A5C87"/></linearGradient>' +
      '</defs>';

    /* ── 큰 혈관 — 심장 뒤에서 위로 뻗어 나간다(손잡이가 아니다) ── */
    /* 대동맥: 밑동에서 올라가 오른쪽으로 활처럼 휘어 화면 밖으로 */
    s += '<path d="M556 150 C560 92 578 56 616 40 C664 20 712 40 726 84 C736 116 730 150 716 178" ' +
         'fill="none" stroke="url(#gAo)" stroke-width="46" stroke-linecap="round"/>';
    /* 대동맥에서 갈라져 나가는 목·팔 동맥 세 줄기 */
    ['M636 40 L630 6', 'M672 34 L676 4', 'M706 54 L722 24'].forEach(function (d) {
      s += '<path d="' + d + '" stroke="url(#gAo)" stroke-width="15" stroke-linecap="round" fill="none"/>';
    });
    /* 폐동맥: 밑동에서 왼위로 갈라져 나간다 */
    s += '<path d="M470 128 C452 78 414 48 366 46 C322 44 296 72 300 108" ' +
         'fill="none" stroke="url(#gPa)" stroke-width="40" stroke-linecap="round"/>';
    /* 위·아래 대정맥 */
    s += '<path d="M346 168 C330 116 328 74 340 34" fill="none" stroke="#4A6FA5" ' +
         'stroke-width="34" stroke-linecap="round" opacity=".95"/>';
    s += '<path d="M372 526 C360 566 356 592 360 616" fill="none" stroke="#4A6FA5" ' +
         'stroke-width="26" stroke-linecap="round" opacity=".9"/>';

    /* ── 심장 몸통 ── */
    s += '<path d="' + HEART_D + '" fill="url(#gMyo)" stroke="#6B211D" stroke-width="3.2"/>';
    s += '<g clip-path="url(#cpHeart)">';
    /* 심근은 나선으로 감긴다 — 결을 그 방향으로 눕힌다 */
    for (i = 0; i < 230; i++) {
      x = 320 + R() * 380; y = 100 + R() * 450;
      t = -46 + (x - 320) / 380 * 78 + (y - 100) / 450 * 26 + (R() - 0.5) * 16;
      s += '<path d="M' + x.toFixed(0) + ' ' + y.toFixed(0) + ' q28 11 58 3" stroke="#93332C" ' +
           'stroke-width="' + (1.3 + R() * 1.7).toFixed(1) + '" fill="none" opacity="' + (0.3 + R() * 0.4).toFixed(2) +
           '" transform="rotate(' + t.toFixed(0) + ' ' + x.toFixed(0) + ' ' + y.toFixed(0) + ')"/>';
    }
    /* 위쪽 두 방(심방)은 결이 다르고 조금 어둡다 */
    s += '<path d="M330 252 C364 168 412 118 468 104 C560 112 634 152 676 226 ' +
         'C600 250 512 258 434 250 C392 246 356 248 330 252 Z" fill="#8E302A" opacity=".55"/>';
    /* 심방귀 — 귀처럼 접혀 나온 조각 */
    s += '<path d="M352 176 q-26 22 -14 50 q26 14 44 -12 q-6 -22 -30 -38 Z" fill="#93332D" ' +
         'stroke="#6B211D" stroke-width="2"/>';
    s += '<path d="M614 168 q30 20 22 50 q-28 16 -46 -10 q4 -22 24 -40 Z" fill="#93332D" ' +
         'stroke="#6B211D" stroke-width="2"/>';
    s += '</g>';

    /* ── 고랑 — 혈관이 지나가는 홈 ── */
    /* 방실고랑: 심방과 심실 사이를 비스듬히 두른다 */
    var AV = 'M336 258 C400 300 480 312 566 296 C624 284 660 260 678 236';
    /* 앞심실사이고랑: 밑동 가운데에서 꼭지까지 내려간다 */
    var IV = 'M492 262 C476 340 462 424 448 534';
    s += '<g clip-path="url(#cpHeart)">';
    s += '<path d="' + AV + '" fill="none" stroke="#75241F" stroke-width="13" opacity=".45"/>';
    s += '<path d="' + IV + '" fill="none" stroke="#75241F" stroke-width="11" opacity=".4"/>';
    s += '</g>';

    /* ── 죽은 자리 — 막힌 곳보다 아래가 창백해진다 ────────────── */
    var DEAD = {
      lad_hi: 'M486 268 C444 340 428 440 448 534 C512 508 560 442 574 356 C560 300 528 272 486 268 Z',
      lad_lo: 'M462 392 C444 448 442 496 450 534 C496 512 526 468 534 414 C512 396 486 388 462 392 Z',
      rca:    'M342 268 C352 356 382 448 436 528 C420 442 410 356 414 274 C392 266 364 264 342 268 Z'
    };
    if (occl && DEAD[occl]) {
      var R2 = rnd(4242);
      s += '<g clip-path="url(#cpHeart)">';
      s += '<path d="' + DEAD[occl] + '" fill="url(#gDead)" opacity=".94"/>';
      for (i = 0; i < 46; i++) {
        x = 330 + R2() * 280; y = 260 + R2() * 270;
        s += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + (1 + R2() * 2.2).toFixed(1) +
             '" fill="#A98763" opacity=".45"/>';
      }
      s += '<path d="' + DEAD[occl] + '" fill="none" stroke="#8A6A4A" stroke-width="2.6" stroke-dasharray="7 5"/>';
      s += '</g>';
    }

    /* ── 관상동맥 ─────────────────────────────────────────────── */
    function vessel(d, w, col) {
      return '<path d="' + d + '" fill="none" stroke="#5E1414" stroke-width="' + (w + 4).toFixed(1) +
             '" stroke-linecap="round" opacity=".3"/>' +
             '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w +
             '" stroke-linecap="round"/>' +
             '<path d="' + d + '" fill="none" stroke="#F6B3AE" stroke-width="' + (w * 0.3).toFixed(1) +
             '" stroke-linecap="round" opacity=".5"/>';
    }
    var LM  = 'M600 214 C566 226 528 244 500 262';
    var LAD = 'M500 262 C484 340 470 424 456 528';
    var LCX = 'M500 262 C548 276 596 274 636 254 C664 292 668 348 650 400 C636 440 612 468 586 486';
    var RCA = 'M414 224 C376 238 350 250 338 266 C346 350 376 440 428 522';

    s += '<g clip-path="url(#cpHeart)">';
    s += vessel(RCA, 13, '#C0392B');
    s += vessel(LCX, 12, '#C0392B');
    s += vessel(LAD, 14, '#C0392B');
    s += vessel(LM, 17, '#C0392B');
    /* 잔가지 — 고랑에서 근육 쪽으로 뻗는다 */
    [['M494 302 C466 312 444 330 432 356', 6], ['M486 356 C458 368 438 388 428 412', 5.4],
     ['M476 412 C452 424 434 442 426 464', 4.8], ['M498 300 C526 312 544 332 552 358', 5.6],
     ['M490 358 C516 372 532 392 538 416', 5], ['M480 416 C504 430 518 448 524 468', 4.4],
     ['M646 300 C616 312 598 332 590 358', 5.6], ['M656 350 C630 364 614 384 608 408', 4.8],
     ['M636 424 C614 438 600 456 594 476', 4.4], ['M346 306 C372 318 390 336 398 360', 5.4],
     ['M362 362 C386 376 402 394 408 416', 4.8], ['M382 418 C404 432 418 448 424 466', 4.2],
     ['M596 226 C606 256 604 284 594 306', 4.6], ['M440 232 C430 260 428 286 434 308', 4.6]
    ].forEach(function (b) { s += vessel(b[0], b[1], '#CC4B3C'); });
    /* 정맥 — 고랑을 따라 파랗게 */
    s += '<path d="' + AV + '" fill="none" stroke="#4A6FA5" stroke-width="9" opacity=".6" stroke-linecap="round"/>';
    s += '<path d="M510 268 C494 344 480 428 468 528" fill="none" stroke="#4A6FA5" stroke-width="7" ' +
         'opacity=".5" stroke-linecap="round"/>';
    s += '</g>';

    /* 막은 피떡 */
    var OCC = { lad_hi: [494, 292], lad_lo: [474, 408], rca: [340, 288] };
    if (occl && OCC[occl]) {
      var ox = OCC[occl][0], oy = OCC[occl][1];
      s += '<circle cx="' + ox + '" cy="' + oy + '" r="19" fill="#1F2937" opacity=".2"/>';
      s += '<circle cx="' + ox + '" cy="' + oy + '" r="11.5" fill="#3B0764"/>';
      for (i = 0; i < 10; i++) {
        a = i * 0.63;
        s += '<circle cx="' + (ox + Math.cos(a) * (3 + R() * 5)).toFixed(0) + '" cy="' +
             (oy + Math.sin(a) * (3 + R() * 5)).toFixed(0) + '" r="2.1" fill="#7E22CE" opacity=".85"/>';
      }
      s += '<circle cx="' + ox + '" cy="' + oy + '" r="21" fill="none" stroke="#3B0764" ' +
           'stroke-width="2.4" stroke-dasharray="5 4"/>';
    }
    return s;
  }

  V.heart_coro = {
    t: '심장의 밥그릇 — 관상동맥 세 갈래',
    d: '심장도 제 밥그릇이 따로 있습니다. 심장 <b>겉</b>을 타고 내려가는 관상동맥입니다. ' +
       '왼쪽 주간부에서 <b>앞내림가지</b>와 <b>휘돌이가지</b>가 갈리고, 오른쪽으로 <b>오른관상동맥</b>이 돕니다. ' +
       '이 세 갈래가 잔가지를 뻗어 심장 근육 전체를 먹여 살립니다. ' +
       '<b>가지 하나가 막히면 그 아래 근육이 굶습니다.</b>',
    dz: ['mi'],
    build: function () {
      var s = '<svg viewBox="0 0 1100 660" width="1100" height="660">' + heartBody(0);
      s += lbl(600, 214, 762, 128, '좌주간부', '여기서 두 갈래로 갈립니다 — 가장 위쪽입니다', '#8B1A1A');
      s += lbl(478, 350, 762, 194, '앞내림가지 (LAD)', '앞면과 꼭지를 먹입니다 — 가장 넓은 몫', '#B91C1C');
      s += lbl(658, 330, 762, 260, '휘돌이가지 (LCx)', '왼쪽 옆·뒤를 감아 돕니다', '#B91C1C');
      s += lbl(348, 330, 762, 326, '오른관상동맥 (RCA)', '오른쪽과 아래벽을 먹입니다', '#B91C1C');
      s += lbl(566, 296, 762, 392, '고랑', '심방과 심실 사이의 홈 — 혈관은 이 홈을 탑니다', '#75241F');
      s += lbl(432, 356, 762, 458, '잔가지', '갈수록 가늘어져 근육 속으로 들어갑니다', '#CC4B3C');
      s += lbl(680, 96, 762, 524, '대동맥', '심장이 밀어낸 피가 온몸으로 나가는 길', '#9E332F');
      s += lbl(310, 92, 96, 44, '폐동맥 · 대정맥', '허파로 가고, 몸에서 돌아오는 길', '#3F628F');
      s += note(300, 636, '겉을 타고 내려가는 혈관이라, 위쪽이 막힐수록 굶는 자리가 넓습니다', '#0F172A');
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1100 660' });
    }
  };

  V.heart_dead = {
    t: '어디가 막히면 어디가 죽습니까 — 세 자리를 견줍니다',
    d: '같은 「심근경색」이라도 <b>막힌 자리가 위냐 아래냐</b>에 따라 죽는 근육의 넓이가 다릅니다. ' +
       '창백해진 곳이 피가 끊겨 굶는 근육이고, 보라색 덩어리가 막은 피떡입니다. ' +
       '위쪽이 막히면 <b>그 아래 전부</b>가 한꺼번에 굶습니다. ' +
       '그래서 같은 병명이라도 뒤에 남는 것(심부전·후유장해)이 사람마다 크게 다릅니다.',
    dz: ['mi'],
    build: function () {
      var P = [
        ['lad_hi', '① 앞내림가지 위쪽이 막힘', '앞벽과 꼭지가 통째로 — 가장 넓습니다', '#991B1B'],
        ['lad_lo', '② 같은 가지 아래쪽이 막힘', '꼭지 부분만 — 좁습니다', '#B45309'],
        ['rca',    '③ 오른관상동맥이 막힘', '오른쪽·아래벽 — 맥이 느려지기도 합니다', '#166534']
      ];
      var s = '<svg viewBox="0 0 1100 560" width="1100" height="560">';
      P.forEach(function (p, i) {
        var x = 24 + i * 356;
        s += '<rect x="' + x + '" y="10" width="336" height="28" rx="9" fill="' + p[3] + '"/>';
        s += '<text x="' + (x + 14) + '" y="29" font-size="14" font-weight="800" fill="#fff">' + p[1] + '</text>';
        s += '<g transform="translate(' + (x - 68) + ' 32) scale(0.3)">' + heartBody(p[0]) + '</g>';
        s += '<text x="' + (x + 10) + '" y="248" font-size="13.5" font-weight="800" fill="#0D1117">' + p[2] + '</text>';
      });
      s += '<g class="lbl">' +
        '<text x="28" y="298" font-size="14.5" font-weight="800" fill="#0D1117">' +
        '창백한 곳 = 피가 끊긴 근육 · 보라색 덩어리 = 막은 피떡</text>' +
        '<text x="28" y="322" font-size="12.8" fill="#4B5563">' +
        '한 번 죽은 심장 근육은 되살아나지 않습니다 — 그래서 시간 싸움이라고 합니다.</text></g>';
      s += '<rect x="24" y="348" width="1052" height="104" rx="14" fill="#0F172A"/>';
      s += '<text x="48" y="382" font-size="15" font-weight="800" fill="#fff">보험에서 갈리는 자리</text>';
      s += '<text x="48" y="408" font-size="13.2" fill="#CBD5E1">' +
           '셋 다 진단명이 다를 수 있습니다 — 급성심근경색(I21)일 수도, 협심증(I20)일 수도 있습니다.</text>';
      s += '<text x="48" y="430" font-size="13.2" fill="#CBD5E1">' +
           '담보가 급성심근경색만인지 허혈성심장질환 전체인지가 지급을 가릅니다. 최종 지급은 약관과 심사가 정합니다.</text>';
      s += '<text x="24" y="480" font-size="11.8" fill="#6B7280">' +
           '실제 비율·모양과 다릅니다. 굶는 자리의 넓이 관계를 보여 주는 그림입니다.</text>';
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1100 560' });
    }
  };

  /* ═══ 뇌 — 위에서 내려다본 단면 (CT 로 보는 그 모양) ═════════════
     상담에서 가장 많이 갈리는 자리가 <b>뇌경색이냐 뇌출혈이냐</b> 이다.
     담보 이름이 「뇌출혈」 하나면 가장 흔한 뇌경색에서 한 푼도 안 나온다.
     그 둘이 <b>그림에서 어떻게 다른지</b> 를 보여 주는 것이 이 그림의 일이다.

       · 뇌경색 — 혈관이 막혀 그 아래가 <b>굶는다.</b> 창백해진다.
       · 뇌출혈 — 혈관이 터져 피가 <b>고인다.</b> 덩어리가 되어 옆을 민다.

     뇌 표면의 주름(이랑과 고랑)은 자리마다 다르지만, 여기서는 늘 같은
     그림이 나오도록 씨앗을 고정해 그린다.

     ★ 실제 비율·모양과 다르다. 관계를 보여 주는 그림이다.               */
  var BRAIN_PTS = [
    [520, 92], [606, 104], [676, 140], [722, 200], [740, 274], [742, 352],
    [724, 428], [686, 488], [624, 528], [540, 542], [456, 528], [394, 488],
    [356, 428], [338, 352], [340, 274], [358, 200], [404, 140], [464, 104]
  ];
  var BRAIN_D = smoothClosed(BRAIN_PTS);

  /* 뇌 한 장. mode: 0 정상 · 1 뇌경색 · 2 뇌출혈 */
  function brainAxial(mode) {
    var R = rnd(20260825), s = '', i, a, x, y, r;
    var CX = 540, CY = 320;
    /* 위축 — 뇌가 줄어 머리뼈와 사이가 벌고, 고랑이 넓어지고,
       빈자리를 물(뇌실)이 대신 채운다. 그림에서 이 셋이 함께 보여야
       「뇌가 줄어듭니다」 가 말이 된다. */
    var SH = (mode === 3) ? 0.86 : 1, VZ = (mode === 3) ? 1.7 : 1;

    s += '<defs>' +
      '<clipPath id="cpBrain' + mode + '"><path d="' + BRAIN_D + '"/></clipPath>' +
      '<radialGradient id="gGray' + mode + '" cx="0.42" cy="0.36" r="0.78">' +
        '<stop offset="0" stop-color="#E7DCD2"/><stop offset="1" stop-color="#C9BAAC"/></radialGradient>' +
      '<linearGradient id="gWhite' + mode + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#F3EDE6"/><stop offset="1" stop-color="#E2D8CD"/></linearGradient>' +
      '</defs>';

    /* 머리뼈 — 바깥 테 */
    s += '<path d="' + BRAIN_D + '" fill="none" stroke="#E8E2D8" stroke-width="34" ' +
         'transform="translate(' + CX + ' ' + CY + ') scale(1.075) translate(' + (-CX) + ' ' + (-CY) + ')"/>';
    s += '<path d="' + BRAIN_D + '" fill="none" stroke="#B9AE9C" stroke-width="3" ' +
         'transform="translate(' + CX + ' ' + CY + ') scale(1.075) translate(' + (-CX) + ' ' + (-CY) + ')"/>';
    s += '<path d="' + BRAIN_D + '" fill="none" stroke="#CFC5B4" stroke-width="2.4" ' +
         'transform="translate(' + CX + ' ' + CY + ') scale(1.13) translate(' + (-CX) + ' ' + (-CY) + ')"/>';

    /* 뇌 — 회색질(겉)과 백색질(속) */
    if (SH !== 1) s += '<g transform="translate(' + CX + ' ' + CY + ') scale(' + SH + ') translate(' + (-CX) + ' ' + (-CY) + ')">';
    s += '<path d="' + BRAIN_D + '" fill="url(#gGray' + mode + ')" stroke="#9E8F80" stroke-width="2.6"/>';
    s += '<g clip-path="url(#cpBrain' + mode + ')">';
    s += '<path d="' + BRAIN_D + '" fill="url(#gWhite' + mode + ')" ' +
         'transform="translate(' + CX + ' ' + CY + ') scale(0.79) translate(' + (-CX) + ' ' + (-CY) + ')"/>';

    /* 이랑과 고랑 — 겉에서 안쪽으로 파고든 주름 */
    for (i = 0; i < 88; i++) {
      a = (i / 88) * Math.PI * 2 + 0.05;
      var rr = 196 + 22 * Math.sin(a * 3.1) + 14 * Math.sin(a * 5.7 + 1.2);
      var x1 = CX + Math.cos(a) * rr * 1.0, y1 = CY + Math.sin(a) * rr * 1.06;
      var dep = 34 + R() * 30;
      var x2 = CX + Math.cos(a + 0.06) * (rr - dep), y2 = CY + Math.sin(a + 0.06) * (rr - dep) * 1.06;
      s += '<path d="M' + x1.toFixed(0) + ' ' + y1.toFixed(0) + ' Q' +
           ((x1 + x2) / 2 + (R() - 0.5) * 22).toFixed(0) + ' ' + ((y1 + y2) / 2 + (R() - 0.5) * 22).toFixed(0) +
           ' ' + x2.toFixed(0) + ' ' + y2.toFixed(0) + '" stroke="#A8998A" stroke-width="' +
           (2.2 + R() * 2).toFixed(1) + '" fill="none" opacity="' + (0.5 + R() * 0.35).toFixed(2) + '"/>';
    }
    /* 겉을 도는 잔주름 */
    for (i = 0; i < 165; i++) {
      a = R() * Math.PI * 2; r = 150 + R() * 62;
      x = CX + Math.cos(a) * r; y = CY + Math.sin(a) * r * 1.05;
      s += '<path d="M' + x.toFixed(0) + ' ' + y.toFixed(0) + ' q12 6 24 -1" stroke="#B3A596" ' +
           'stroke-width="1.5" fill="none" opacity=".4" transform="rotate(' +
           (a * 180 / Math.PI + 90).toFixed(0) + ' ' + x.toFixed(0) + ' ' + y.toFixed(0) + ')"/>';
    }

    /* 가운데 금 — 대뇌낫 */
    s += '<path d="M540 96 L540 538" stroke="#8B7D6E" stroke-width="4" opacity=".85"/>';
    /* 앞뒤를 알려 주는 홈 */
    s += '<path d="M540 118 q-16 26 -2 52 q16 -26 2 -52" fill="#8B7D6E" opacity=".5"/>';

    /* 뇌실 — 나비 모양 */
    var VENT_L = 'M508 246 C486 262 474 300 480 344 C486 378 500 396 512 392 C518 366 516 300 508 246 Z';
    var VENT_R = 'M572 246 C594 262 606 300 600 344 C594 378 580 396 568 392 C562 366 564 300 572 246 Z';
    var vt = VZ === 1 ? '' : ' transform="translate(540 320) scale(' + VZ + ') translate(-540 -320)"';
    s += '<path d="' + VENT_L + '" fill="#6E7F92" opacity=".75"' + vt + '/>';
    s += '<path d="' + VENT_R + '" fill="#6E7F92" opacity=".75"' + vt + '/>';
    /* 깊은 회색질 덩어리 */
    s += '<ellipse cx="472" cy="304" rx="30" ry="46" fill="#B49E8B" opacity=".8"/>';
    s += '<ellipse cx="608" cy="304" rx="30" ry="46" fill="#B49E8B" opacity=".8"/>';

    /* ── 큰 혈관 — 바닥에서 올라와 갈라진다 ── */
    function art2(d, w) {
      return '<path d="' + d + '" fill="none" stroke="#8B1A1A" stroke-width="' + (w + 3) + '" opacity=".28" stroke-linecap="round"/>' +
             '<path d="' + d + '" fill="none" stroke="#C0392B" stroke-width="' + w + '" stroke-linecap="round"/>';
    }
    var MCA_L = 'M508 336 C462 330 424 316 396 296 C368 276 348 258 338 240';
    var MCA_R = 'M572 336 C618 330 656 316 684 296 C712 276 732 258 742 240';
    var ACA_L = 'M520 330 C512 288 512 236 520 186';
    var ACA_R = 'M560 330 C568 288 568 236 560 186';
    var PCA_L = 'M516 350 C500 396 480 442 456 478';
    var PCA_R = 'M564 350 C580 396 600 442 624 478';
    s += art2(MCA_L, 11) + art2(MCA_R, 11) + art2(ACA_L, 8) + art2(ACA_R, 8) + art2(PCA_L, 8) + art2(PCA_R, 8);
    /* 잔가지 */
    [[ 'M420 306 C404 282 396 258 398 236', 5], ['M456 322 C444 296 440 272 444 250', 5],
     ['M660 306 C676 282 684 258 682 236', 5], ['M624 322 C636 296 640 272 636 250', 5],
     ['M516 250 C500 236 486 226 470 220', 4.4], ['M564 250 C580 236 594 226 610 220', 4.4],
     ['M492 430 C476 448 462 462 446 470', 4.4], ['M588 430 C604 448 618 462 634 470', 4.4]
    ].forEach(function (b) { s += art2(b[0], b[1]); });
    /* 관통동맥 — 큰 혈관 줄기에서 <b>곧게 위로</b> 파고들어 깊은 회색질로
       들어가는 가는 가지다. 고혈압에서 잘 터지는 자리가 바로 여기라,
       이 가지들이 보여야 「여기가 터집니다」 가 그림에서 말이 된다. */
    for (i = 0; i < 30; i++) {
      var side = i < 15 ? 0 : 1, j2 = i % 15;
      var px = (side ? 566 : 514) + (side ? 1 : -1) * (6 + j2 * 5.4) + (R() - 0.5) * 5;
      var y0 = 340 + (R() - 0.5) * 10;                    /* 줄기에서 나와 */
      var y1 = 268 - R() * 30;                            /* 깊은 회색질로 */
      s += '<path d="M' + px.toFixed(0) + ' ' + y0.toFixed(0) + ' Q' +
           (px + (R() - 0.5) * 12).toFixed(0) + ' ' + ((y0 + y1) / 2).toFixed(0) + ' ' +
           (px + (R() - 0.5) * 10).toFixed(0) + ' ' + y1.toFixed(0) +
           '" stroke="#C0392B" stroke-width="' + (1.9 + R() * 1.5).toFixed(1) +
           '" fill="none" opacity=".8" stroke-linecap="round"/>';
    }
    /* 겉을 덮는 잔가지 — 짧게, 결처럼 */
    for (i = 0; i < 44; i++) {
      a = R() * Math.PI * 2; r = 178 + R() * 18;
      var sx = CX + Math.cos(a) * r, sy = CY + Math.sin(a) * r * 1.04;
      var el = 11 + R() * 12;
      s += '<path d="M' + sx.toFixed(0) + ' ' + sy.toFixed(0) + ' L' +
           (CX + Math.cos(a) * (r - el)).toFixed(0) + ' ' +
           (CY + Math.sin(a) * (r - el) * 1.04).toFixed(0) +
           '" stroke="#C0392B" stroke-width="1.7" opacity=".45" stroke-linecap="round"/>';
    }
    s += '</g>';
    if (SH !== 1) s += '</g>';

    /* ── 병 ── */
    /* 왼쪽 중간대뇌동맥 영역 (화면에서는 왼쪽 반) */
    var TERR_MCA = 'M508 336 C452 328 402 306 366 272 C346 246 342 208 356 176 ' +
                   'C392 232 442 274 508 288 Z';
    var TERR_MCA_BIG = 'M512 300 C440 300 386 272 356 226 C344 268 344 330 360 386 ' +
                       'C388 448 448 494 512 500 Z';
    if (mode === 1) {
      s += '<g clip-path="url(#cpBrain1)">';
      s += '<path d="' + TERR_MCA_BIG + '" fill="#F2EDE4" opacity=".92"/>';
      var R3 = rnd(818);
      for (i = 0; i < 60; i++) {
        x = 350 + R3() * 170; y = 230 + R3() * 260;
        s += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + (1 + R3() * 2.4).toFixed(1) +
             '" fill="#CFC3B2" opacity=".55"/>';
      }
      s += '<path d="' + TERR_MCA_BIG + '" fill="none" stroke="#9C8B76" stroke-width="2.6" stroke-dasharray="8 5"/>';
      /* 뇌실이 병 쪽으로 조금 넓어진다 */
      s += '</g>';
      /* 막은 피떡 */
      s += '<circle cx="470" cy="326" r="17" fill="#1F2937" opacity=".2"/>';
      s += '<circle cx="470" cy="326" r="10.5" fill="#3B0764"/>';
      for (i = 0; i < 9; i++) {
        a = i * 0.7;
        s += '<circle cx="' + (470 + Math.cos(a) * (3 + R() * 4)).toFixed(0) + '" cy="' +
             (326 + Math.sin(a) * (3 + R() * 4)).toFixed(0) + '" r="2" fill="#7E22CE" opacity=".85"/>';
      }
    }
    if (mode === 2) {
      /* 피가 고여 덩어리가 되고, 가운데 금이 반대쪽으로 밀린다 */
      s += '<g clip-path="url(#cpBrain2)">';
      s += '<path d="M470 258 C412 268 384 320 396 378 C410 434 462 462 508 444 ' +
           'C540 424 546 356 528 302 C516 268 496 254 470 258 Z" fill="#7A1220"/>';
      s += '<path d="M470 258 C412 268 384 320 396 378 C410 434 462 462 508 444 ' +
           'C540 424 546 356 528 302 C516 268 496 254 470 258 Z" fill="none" stroke="#4C0A14" stroke-width="3"/>';
      var R4 = rnd(919);
      for (i = 0; i < 70; i++) {
        x = 396 + R4() * 148; y = 262 + R4() * 190;
        s += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + (1.4 + R4() * 3).toFixed(1) +
             '" fill="#9C1A2B" opacity=".55"/>';
      }
      /* 둘레가 붓는다 */
      s += '<path d="M470 240 C396 254 358 322 374 392 C392 456 458 490 518 466" fill="none" ' +
           'stroke="#C9A9A9" stroke-width="14" opacity=".45"/>';
      /* 밀린 가운데 금 */
      s += '<path d="M540 96 C556 200 574 300 566 400 C562 470 550 510 540 538" ' +
           'stroke="#8B7D6E" stroke-width="4.4" fill="none"/>';
      s += '<path d="M540 96 L540 538" stroke="#8B7D6E" stroke-width="3" opacity=".28" stroke-dasharray="6 5"/>';
      s += '</g>';
      /* 터진 자리 */
      s += '<circle cx="470" cy="300" r="8" fill="#4C0A14"/>';
    }
    return s;
  }

  V.brain_terr = {
    t: '뇌는 세 갈래가 나눠 먹입니다 — 어디가 막히면 어디가 죽나',
    d: '뇌도 혈관이 <b>구역을 나눠</b> 먹입니다. 가운데를 크게 맡는 <b>중간대뇌동맥</b>, ' +
       '앞쪽을 맡는 <b>앞대뇌동맥</b>, 뒤쪽을 맡는 <b>뒤대뇌동맥</b>입니다. ' +
       '한 갈래가 막히면 <b>그 구역이 통째로</b> 굶습니다 — 그래서 막힌 자리에 따라 남는 장애가 다릅니다. ' +
       '위에서 내려다본 단면이라, 병원에서 보시는 CT 와 같은 방향입니다.',
    dz: ['stroke'],
    build: function () {
      var s = '<svg viewBox="0 0 1120 620" width="1120" height="620">' + brainAxial(0);
      s += lbl(430, 300, 790, 118, '중간대뇌동맥 (MCA)', '가장 넓은 구역 — 팔·다리·말이 여기 걸립니다', '#B91C1C');
      s += lbl(520, 220, 790, 184, '앞대뇌동맥 (ACA)', '앞쪽 안쪽 — 다리 쪽이 많이 걸립니다', '#B91C1C');
      s += lbl(500, 430, 790, 250, '뒤대뇌동맥 (PCA)', '뒤쪽 — 보는 것이 걸립니다', '#B91C1C');
      s += lbl(508, 320, 790, 316, '뇌실', '물(뇌척수액)이 도는 방입니다', '#4A6076');
      s += lbl(608, 304, 790, 382, '깊은 회색질 · 관통동맥', '곧게 파고드는 가는 가지 — 여기가 잘 터집니다', '#7A6A58');
      s += lbl(670, 160, 790, 448, '이랑과 고랑', '뇌 겉의 주름 — 겉이 회색질, 속이 백색질입니다', '#8B7D6E');
      s += lbl(540, 120, 300, 118, '가운데 금', '좌우를 가르는 막입니다', '#8B7D6E');
      s += note(300, 596, '한 갈래가 막히면 그 구역이 통째로 굶습니다 — 자리에 따라 남는 장애가 다릅니다', '#0F172A');
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1120 620' });
    }
  };

  V.brain_vs = {
    t: '막힌 것과 터진 것 — 담보 이름이 여기서 갈립니다',
    d: '<b>뇌경색</b>은 혈관이 막혀 그 아래가 굶는 것이고, <b>뇌출혈</b>은 혈관이 터져 피가 고이는 것입니다. ' +
       '그림에서 보시듯 <b>전혀 다른 일</b>인데, 증권에는 「뇌출혈」 하나만 적혀 있는 경우가 많습니다. ' +
       '그러면 <b>훨씬 흔한 뇌경색에서 한 푼도 나오지 않습니다.</b> ' +
       '담보 이름이 아니라 <b>담는 질병코드 범위</b>를 보셔야 하는 이유입니다.',
    dz: ['stroke'],
    build: function () {
      var P = [
        [0, '정상', '피가 골고루 돕니다', '#334155'],
        [1, '뇌경색 — 막혔습니다', '그 구역이 창백해집니다 (굶습니다)', '#1D4ED8'],
        [2, '뇌출혈 — 터졌습니다', '피가 고여 덩어리가 되고 가운데 금이 밀립니다', '#991B1B']
      ];
      var s = '<svg viewBox="0 0 1120 620" width="1120" height="620">';
      P.forEach(function (p, i) {
        var x = 24 + i * 358;
        s += '<rect x="' + x + '" y="10" width="340" height="28" rx="9" fill="' + p[3] + '"/>';
        s += '<text x="' + (x + 14) + '" y="29" font-size="14" font-weight="800" fill="#fff">' + p[1] + '</text>';
        s += '<g transform="translate(' + (x - 104) + ' 30) scale(0.335)">' + brainAxial(p[0]) + '</g>';
        s += '<text x="' + (x + 10) + '" y="272" font-size="13.2" font-weight="800" fill="#0D1117">' + p[2] + '</text>';
      });
      s += '<rect x="24" y="300" width="1072" height="150" rx="14" fill="#0F172A"/>';
      s += '<text x="48" y="334" font-size="15" font-weight="800" fill="#fff">증권에서 이것만 보십시오</text>';
      s += '<text x="48" y="362" font-size="13.2" fill="#CBD5E1">' +
           '「뇌출혈」 만 적혀 있으면 — 가운데 그림(뇌경색)에서 나오지 않을 수 있습니다.</text>';
      s += '<text x="48" y="386" font-size="13.2" fill="#CBD5E1">' +
           '「뇌졸중」 이면 막힌 것과 터진 것을 함께 담고, 「뇌혈관질환」 이면 더 넓게 담습니다.</text>';
      s += '<text x="48" y="410" font-size="13.2" fill="#93C5FD">' +
           '다만 <tspan font-weight="800">이름이 아니라 약관의 질병코드 범위</tspan>가 정합니다. 최종 지급은 약관과 심사가 정합니다.</text>';
      s += '<text x="24" y="480" font-size="11.8" fill="#6B7280">' +
           '실제 비율·모양과 다릅니다. 두 병이 어떻게 다른지를 보여 주는 그림입니다.</text>';
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1120 500' });
    }
  };

  /* ═══ 콩팥 — 거르는 기계와, 그것을 대신하는 기계 ═══════════════
     투석 상담에서 가장 안 먹히는 말이 「신장이 나빠지면 투석합니다」 이다.
     <b>무엇을 거르는지</b> 를 모르면 남 얘기로 들린다.

     그래서 둘을 나란히 놓는다.
       · 콩팥 안에서 실제로 거르는 자리 — <b>사구체</b>. 모세혈관 뭉치다.
       · 그것이 망가졌을 때 몸 밖에서 대신 거르는 것 — <b>투석</b>.

     투석은 <b>고치는 것이 아니라 대신하는 것</b>이다. 그래서 평생 간다.

     ★ 실제 비율·모양과 다르다. 관계를 보여 주는 그림이다.               */
  function kidneyBody() {
    var R = rnd(20260826), s = '', i, a, x, y;

    /* 콩팥 겉 — 강낭콩 모양, 안쪽이 옴폭 들어간다 */
    var K = 'M300 96 C378 92 442 148 456 232 C468 306 452 388 408 444 ' +
            'C368 494 306 512 258 486 C226 468 214 434 226 404 ' +
            'C244 358 250 320 232 288 C214 256 216 216 240 176 ' +
            'C258 144 274 110 300 96 Z';
    s += '<defs><clipPath id="cpKid"><path d="' + K + '"/></clipPath>' +
      '<linearGradient id="gKid" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#B4544C"/><stop offset="1" stop-color="#8A322C"/></linearGradient></defs>';
    s += '<path d="' + K + '" fill="url(#gKid)" stroke="#6B211D" stroke-width="3"/>';
    s += '<g clip-path="url(#cpKid)">';

    /* 겉껍질(피질) — 바깥 띠 */
    s += '<path d="' + K + '" fill="#C4675E" opacity=".85"/>';
    s += '<path d="' + K + '" fill="#9E3E37" transform="translate(300 290) scale(0.74) translate(-300 -290)"/>';

    /* 속질 피라미드 — 안쪽을 향해 삼각으로 모인다 */
    var PY = [[356,168,-38],[404,236,-8],[400,320,14],[356,392,42],[300,440,72]];
    PY.forEach(function (p) {
      s += '<g transform="rotate(' + p[2] + ' ' + p[0] + ' ' + p[1] + ')">' +
        '<path d="M' + (p[0] - 40) + ' ' + (p[1] - 34) + ' L' + (p[0] + 34) + ' ' + p[1] +
        ' L' + (p[0] - 40) + ' ' + (p[1] + 34) + ' Z" fill="#B9645A" opacity=".9"/>';
      for (i = 0; i < 9; i++) {
        s += '<path d="M' + (p[0] - 38) + ' ' + (p[1] - 28 + i * 7) + ' L' + (p[0] + 28) + ' ' +
             (p[1] - 8 + i * 2).toFixed(0) + '" stroke="#8E4038" stroke-width="1.5" opacity=".65"/>';
      }
      s += '</g>';
    });
    /* 잔 → 신우 → 요관 */
    s += '<path d="M262 300 C300 226 322 214 356 206 M262 300 C300 262 330 258 372 262 ' +
         'M262 300 C302 306 332 312 372 330 M262 300 C300 342 322 366 344 400" ' +
         'fill="none" stroke="#E6D9B8" stroke-width="13" stroke-linecap="round" opacity=".95"/>';
    s += '<path d="M262 300 C238 306 226 322 224 344 C222 372 232 392 250 404" ' +
         'fill="none" stroke="#E6D9B8" stroke-width="20" stroke-linecap="round"/>';
    /* 굵은 혈관이 들어가고 나온다 */
    s += '<path d="M232 268 C200 262 176 258 150 258" fill="none" stroke="#C0392B" stroke-width="17" stroke-linecap="round"/>';
    s += '<path d="M236 320 C204 328 180 334 154 336" fill="none" stroke="#4A6FA5" stroke-width="15" stroke-linecap="round"/>';
    /* 잔가지 — 피질 쪽으로 부챗살 */
    for (i = 0; i < 26; i++) {
      a = -1.15 + (i / 25) * 2.4;
      var r0 = 62, r1 = 150 + R() * 26;
      s += '<path d="M' + (256 + Math.cos(a) * r0).toFixed(0) + ' ' + (296 + Math.sin(a) * r0).toFixed(0) +
           ' Q' + (256 + Math.cos(a) * (r0 + r1) / 2 + 14).toFixed(0) + ' ' +
           (296 + Math.sin(a) * (r0 + r1) / 2).toFixed(0) + ' ' +
           (256 + Math.cos(a) * r1).toFixed(0) + ' ' + (296 + Math.sin(a) * r1).toFixed(0) +
           '" stroke="' + (i % 2 ? '#C0392B' : '#4A6FA5') + '" stroke-width="' + (2 + R() * 2).toFixed(1) +
           '" fill="none" opacity=".7"/>';
    }
    /* 겉껍질에 박힌 알갱이들 — 사구체 */
    for (i = 0; i < 54; i++) {
      a = -1.3 + R() * 2.7; var rr = 150 + R() * 44;
      x = 256 + Math.cos(a) * rr; y = 296 + Math.sin(a) * rr;
      s += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + (3.6 + R() * 2).toFixed(1) +
           '" fill="#7E1F1A" opacity=".8"/>';
    }
    s += '</g>';

    /* ── 확대해서 본 사구체 한 개 ── */
    var GX = 700, GY = 210;
    s += '<circle cx="' + GX + '" cy="' + GY + '" r="118" fill="#FFF8F2" stroke="#C8A183" stroke-width="3"/>';
    s += '<path d="M' + (256 + 170) + ' 200 L' + (GX - 120) + ' ' + (GY - 30) + '" stroke="#8A6A4A" ' +
         'stroke-width="1.6" stroke-dasharray="5 4" fill="none"/>';
    /* 보먼주머니 */
    s += '<circle cx="' + GX + '" cy="' + GY + '" r="82" fill="#FDEFE2" stroke="#B98A63" stroke-width="2.6"/>';
    /* 들어오는 혈관은 굵고, 나가는 혈관은 가늘다 — 그래서 안에서 눌려 걸러진다 */
    s += '<path d="M' + (GX - 130) + ' ' + (GY + 40) + ' C' + (GX - 96) + ' ' + (GY + 34) + ' ' +
         (GX - 74) + ' ' + (GY + 22) + ' ' + (GX - 52) + ' ' + (GY + 10) + '" fill="none" ' +
         'stroke="#C0392B" stroke-width="17" stroke-linecap="round"/>';
    s += '<path d="M' + (GX - 118) + ' ' + (GY + 66) + ' C' + (GX - 88) + ' ' + (GY + 62) + ' ' +
         (GX - 66) + ' ' + (GY + 52) + ' ' + (GX - 46) + ' ' + (GY + 42) + '" fill="none" ' +
         'stroke="#C0392B" stroke-width="9" stroke-linecap="round"/>';
    /* 모세혈관 뭉치 — 실타래 */
    var R5 = rnd(5151);
    for (i = 0; i < 26; i++) {
      a = R5() * Math.PI * 2; var rad = 16 + R5() * 34;
      var cx2 = GX + Math.cos(a) * (rad * 0.7), cy2 = GY + Math.sin(a) * (rad * 0.7);
      s += '<circle cx="' + cx2.toFixed(0) + '" cy="' + cy2.toFixed(0) + '" r="' + (10 + R5() * 12).toFixed(0) +
           '" fill="none" stroke="#C0392B" stroke-width="' + (5 + R5() * 3).toFixed(1) + '" opacity=".8"/>';
    }
    /* 걸러져 나가는 물 */
    s += '<path d="M' + (GX + 40) + ' ' + (GY + 62) + ' C' + (GX + 76) + ' ' + (GY + 86) + ' ' +
         (GX + 66) + ' ' + (GY + 122) + ' ' + (GX + 26) + ' ' + (GY + 130) + '" fill="none" ' +
         'stroke="#E6D9B8" stroke-width="15" stroke-linecap="round"/>';
    for (i = 0; i < 10; i++) {
      s += '<circle cx="' + (GX + 30 + R() * 46).toFixed(0) + '" cy="' + (GY + 70 + R() * 52).toFixed(0) +
           '" r="' + (2 + R() * 2).toFixed(1) + '" fill="#C8B98C" opacity=".9"/>';
    }
    return s;
  }

  V.kidney_filter = {
    t: '콩팥은 어떻게 거릅니까 — 거르는 자리는 <b>모세혈관 뭉치</b>입니다',
    d: '콩팥 겉껍질에는 <b>실타래처럼 뭉친 모세혈관</b>이 수없이 박혀 있습니다. ' +
       '들어오는 혈관은 굵고 나가는 혈관은 가늘어, 그 안에서 <b>피가 눌립니다.</b> ' +
       '눌린 힘으로 물과 노폐물이 짜여 나오고, 몸에 필요한 것은 되돌려 받습니다. ' +
       '이 뭉치가 망가지면 <b>다시 자라지 않습니다</b> — 그래서 신장병은 되돌아오지 않습니다.',
    dz: ['kidney'],
    build: function () {
      var s = '<svg viewBox="0 0 900 560" width="900" height="560">' + kidneyBody();
      s += lbl(300, 140, 640, 396, '겉껍질 (피질)', '거르는 뭉치가 여기 박혀 있습니다', '#C4675E');
      s += lbl(390, 300, 640, 452, '속질', '걸러진 물이 모여 내려가는 관들', '#B9645A');
      s += lbl(240, 380, 640, 508, '신우 · 요관', '오줌이 모여 방광으로 갑니다', '#A48C50');
      s += lbl(700, 210, 250, 40, '사구체 — 거르는 뭉치', '들어오는 길은 굵고 나가는 길은 가늡니다', '#B91C1C');
      s += lbl(726, 340, 250, 500, '걸러져 나온 물', '여기서 오줌이 시작됩니다', '#A48C50');
      s += note(250, 546, '이 뭉치는 한번 망가지면 다시 자라지 않습니다', '#0F172A');
      s += '</svg>';
      return art({ svg: s, vb: '0 0 900 560' });
    }
  };

  V.dialysis_real = {
    t: '투석은 <b>고치는 것이 아니라 대신하는 것</b>입니다',
    d: '망가진 콩팥을 되살리는 치료가 아닙니다. 콩팥이 하던 일을 <b>몸 밖 기계가 대신</b> 합니다. ' +
       '피를 뽑아 얇은 막에 흘리고, 막 건너편으로 노폐물과 물을 넘긴 뒤 다시 몸으로 돌려보냅니다. ' +
       '그래서 <b>끝이 없습니다.</b> 일주일에 몇 번씩, 이식을 받기 전까지 평생 이어집니다. ' +
       '보험에서 이 병이 무거운 이유는 치료비 자체보다 <b>끝나지 않는다는 것</b>에 있습니다.',
    dz: ['kidney', 'chronic'],
    build: function () {
      var R = rnd(777), s = '<svg viewBox="0 0 1000 520" width="1000" height="520">', i, x, y;

      /* 팔 — 동정맥루 */
      s += '<path d="M60 150 C120 128 200 126 250 150 C250 196 250 240 250 286 ' +
           'C200 312 120 310 60 288 Z" fill="#F0D9C6" stroke="#C8A183" stroke-width="2.6"/>';
      s += '<path d="M70 214 C130 200 190 200 246 214" fill="none" stroke="#C0392B" stroke-width="13" opacity=".9"/>';
      s += '<path d="M70 244 C130 234 190 234 246 244" fill="none" stroke="#4A6FA5" stroke-width="11" opacity=".85"/>';
      /* 이어붙인 자리 — 굵어진 혈관 */
      s += '<ellipse cx="150" cy="229" rx="42" ry="21" fill="#B03A3A" opacity=".9"/>';
      s += '<ellipse cx="150" cy="229" rx="42" ry="21" fill="none" stroke="#7F1D1D" stroke-width="2.4"/>';
      s += '<circle cx="126" cy="222" r="4.4" fill="#0F172A"/><circle cx="172" cy="236" r="4.4" fill="#0F172A"/>';
      s += lbl(150, 229, 60, 88, '동정맥루', '동맥과 정맥을 이어 굵게 만든 자리 — 여기에 바늘을 꽂습니다', '#8B1A1A');

      /* 나가는 줄 */
      s += '<path d="M172 236 C260 268 300 300 340 300" fill="none" stroke="#C0392B" stroke-width="11" stroke-linecap="round"/>';
      /* 펌프 */
      s += '<circle cx="372" cy="300" r="30" fill="#E5E7EB" stroke="#9CA3AF" stroke-width="3"/>';
      s += '<circle cx="372" cy="300" r="12" fill="#9CA3AF"/>';
      s += '<path d="M372 270 A30 30 0 0 1 396 316" fill="none" stroke="#6B7280" stroke-width="7" stroke-linecap="round"/>';
      s += lbl(372, 300, 336, 396, '펌프', '피를 일정하게 돌립니다', '#4B5563');

      /* 투석기 — 속이 빈 실 다발 */
      s += '<rect x="446" y="140" width="130" height="290" rx="42" fill="#EEF2F7" stroke="#94A3B8" stroke-width="3"/>';
      s += '<rect x="446" y="140" width="130" height="290" rx="42" fill="none" stroke="#CBD5E1" stroke-width="10" opacity=".5"/>';
      for (i = 0; i < 17; i++) {
        x = 458 + i * 6.6;
        s += '<path d="M' + x + ' 156 L' + x + ' 414" stroke="#C0392B" stroke-width="2.6" opacity=".8"/>';
      }
      for (i = 0; i < 60; i++) {
        s += '<circle cx="' + (452 + R() * 118).toFixed(0) + '" cy="' + (158 + R() * 254).toFixed(0) +
             '" r="' + (1.6 + R() * 2.4).toFixed(1) + '" fill="#0EA5A5" opacity=".45"/>';
      }
      s += '<path d="M372 270 C372 200 400 172 446 172" fill="none" stroke="#C0392B" stroke-width="11" stroke-linecap="round"/>';
      s += '<path d="M576 172 C640 172 660 200 660 250" fill="none" stroke="#4A6FA5" stroke-width="11" stroke-linecap="round"/>';
      /* 투석액 — 반대 방향으로 흐른다 */
      s += '<path d="M576 400 C630 400 654 372 654 330 M446 400 C400 400 384 380 384 350" ' +
           'fill="none" stroke="#0EA5A5" stroke-width="8" stroke-linecap="round" opacity=".8"/>';
      s += lbl(510, 286, 700, 120, '얇은 막 (투석기)', '속이 빈 가는 실 다발 — 이 막이 콩팥을 대신합니다', '#334155');
      s += lbl(576, 400, 700, 186, '투석액', '피와 반대 방향으로 흘려야 잘 넘어갑니다', '#0E7490');

      /* 돌아오는 줄 */
      s += '<path d="M660 250 C700 300 620 380 480 470 C380 486 240 420 150 300 C138 282 132 262 126 240" ' +
           'fill="none" stroke="#4A6FA5" stroke-width="11" stroke-linecap="round" opacity=".9"/>';
      s += lbl(480, 470, 700, 252, '몸으로 되돌아갑니다', '깨끗해진 피가 다시 들어갑니다', '#3F628F');

      /* 넘어가는 것들 */
      s += '<g class="lbl">';
      s += '<rect x="700" y="300" width="272" height="150" rx="14" fill="#0F172A"/>';
      s += '<text x="722" y="330" font-size="14" font-weight="800" fill="#fff">막을 건너가는 것</text>';
      s += '<text x="722" y="356" font-size="12.8" fill="#CBD5E1">노폐물 · 남는 물 · 넘치는 전해질</text>';
      s += '<text x="722" y="384" font-size="14" font-weight="800" fill="#fff">건너가지 못하는 것</text>';
      s += '<text x="722" y="410" font-size="12.8" fill="#CBD5E1">적혈구 · 단백질 — 알이 커서 막을 못 지납니다</text>';
      s += '<text x="722" y="436" font-size="12.5" fill="#93C5FD">그래서 피는 남고, 찌꺼기만 빠집니다</text>';
      s += '</g>';
      s += note(60, 500, '고치는 것이 아니라 대신하는 것이라, 일주일에 몇 번씩 이식 전까지 이어집니다', '#0F172A');
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1000 520' });
    }
  };

  /* ═══ 간 — 굳어 가는 네 걸음 (소엽 단면) ═══════════════════════
     간은 <b>육각형 방(소엽)</b>이 벌집처럼 붙어 있는 장기다. 방 가운데에
     정맥이 서고, 방 모서리마다 문맥·동맥·담관 셋이 함께 지난다.
     간세포는 그 사이를 <b>줄</b>로 늘어서고, 줄 사이 틈(굴모양혈관)으로
     피가 스며 지난다 — 그래서 간은 「거르는 스펀지」에 가깝다.

     술·지방·바이러스가 오래 가면 이 방이 순서대로 무너진다.
       ① 정상 → ② 지방이 낀다 → ③ 줄 사이에 흉터가 낀다 → ④ 방이 무너져 혹이 된다

     ④ 는 <b>되돌아오지 않는다.</b> 그래서 ②·③ 에서 잡는 것이 전부다.

     ★ 실제 비율·모양과 다르다. 관계를 보여 주는 그림이다.               */
  function lobule(stage, R) {
    var s = '', i, j, a, x, y;
    var CX = 150, CY = 150, RAD = 118;

    /* 육각형 방 */
    var pts = [], ang;
    for (i = 0; i < 6; i++) {
      ang = -Math.PI / 2 + i * Math.PI / 3;
      pts.push([CX + Math.cos(ang) * RAD, CY + Math.sin(ang) * RAD]);
    }
    var hex = 'M' + pts.map(function (p) { return p[0].toFixed(0) + ' ' + p[1].toFixed(0); }).join(' L') + ' Z';
    s += '<defs><clipPath id="cpLob' + stage + '"><path d="' + hex + '"/></clipPath></defs>';
    s += '<path d="' + hex + '" fill="' + (stage >= 3 ? '#C8A98C' : '#D8B08A') + '" stroke="#9A7350" stroke-width="2.6"/>';
    s += '<g clip-path="url(#cpLob' + stage + ')">';

    /* 간세포 줄 — 가운데 정맥에서 바깥으로 뻗는다 */
    for (i = 0; i < 30; i++) {
      a = (i / 30) * Math.PI * 2;
      var wob = stage >= 3 ? 16 : 5;
      var d = 'M' + (CX + Math.cos(a) * 16).toFixed(0) + ' ' + (CY + Math.sin(a) * 16).toFixed(0) +
              ' Q' + (CX + Math.cos(a + 0.12) * 70 + (R() - 0.5) * wob).toFixed(0) + ' ' +
              (CY + Math.sin(a + 0.12) * 70 + (R() - 0.5) * wob).toFixed(0) + ' ' +
              (CX + Math.cos(a) * 124).toFixed(0) + ' ' + (CY + Math.sin(a) * 124).toFixed(0);
      s += '<path d="' + d + '" stroke="#B98A63" stroke-width="' + (5 + R() * 2).toFixed(1) +
           '" fill="none" opacity=".85"/>';
      s += '<path d="' + d + '" stroke="#8E6A4A" stroke-width="1.3" fill="none" opacity=".5"/>';
    }
    /* 간세포 — 알갱이 */
    for (i = 0; i < 130; i++) {
      a = R() * Math.PI * 2; var rr = 18 + R() * 104;
      x = CX + Math.cos(a) * rr; y = CY + Math.sin(a) * rr;
      s += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + (3.4 + R() * 1.8).toFixed(1) +
           '" fill="#E2C29E" stroke="#A9825C" stroke-width="0.9"/>';
      s += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="1.5" fill="#7B5A3C" opacity=".8"/>';
    }
    /* ② 지방 방울 */
    if (stage >= 1) {
      var n = stage === 1 ? 78 : (stage === 2 ? 54 : 30);
      for (i = 0; i < n; i++) {
        a = R() * Math.PI * 2; var r2 = 20 + R() * 100;
        s += '<circle cx="' + (CX + Math.cos(a) * r2).toFixed(0) + '" cy="' + (CY + Math.sin(a) * r2).toFixed(0) +
             '" r="' + (4 + R() * 5).toFixed(1) + '" fill="#F5E06B" stroke="#D9BE3E" stroke-width="1" opacity=".9"/>';
      }
    }
    /* ③ 흉터 — 줄 사이를 가로지르는 띠 */
    if (stage >= 2) {
      var m = stage === 2 ? 9 : 16;
      for (i = 0; i < m; i++) {
        a = (i / m) * Math.PI * 2 + 0.2;
        var d2 = 'M' + (CX + Math.cos(a) * 30).toFixed(0) + ' ' + (CY + Math.sin(a) * 30).toFixed(0);
        for (j = 1; j <= 5; j++) {
          var rr2 = 30 + j * 20;
          d2 += ' L' + (CX + Math.cos(a + (R() - 0.5) * 0.5) * rr2).toFixed(0) + ' ' +
                (CY + Math.sin(a + (R() - 0.5) * 0.5) * rr2).toFixed(0);
        }
        s += '<path d="' + d2 + '" stroke="#8FA88C" stroke-width="' + (stage === 2 ? 4 : 8) +
             '" fill="none" opacity=".9" stroke-linejoin="round"/>';
      }
    }
    /* ④ 혹(결절) — 흉터에 갇힌 간세포 덩어리 */
    if (stage >= 3) {
      for (i = 0; i < 7; i++) {
        a = i * 0.9; var r3 = 42 + (i % 3) * 30;
        s += '<circle cx="' + (CX + Math.cos(a) * r3).toFixed(0) + '" cy="' + (CY + Math.sin(a) * r3).toFixed(0) +
             '" r="' + (17 + R() * 9).toFixed(0) + '" fill="#D9B489" stroke="#7E8F72" stroke-width="5" opacity=".95"/>';
      }
    }
    /* 가운데 정맥 */
    s += '<circle cx="' + CX + '" cy="' + CY + '" r="17" fill="#4A6FA5" opacity=".9"/>';
    s += '<circle cx="' + CX + '" cy="' + CY + '" r="17" fill="none" stroke="#2F4C74" stroke-width="2"/>';
    s += '</g>';
    /* 모서리마다 셋이 함께 지난다 — 문맥·동맥·담관 */
    pts.forEach(function (p) {
      s += '<circle cx="' + (p[0] - 7).toFixed(0) + '" cy="' + (p[1] + 4).toFixed(0) + '" r="7" fill="#4A6FA5"/>';
      s += '<circle cx="' + (p[0] + 7).toFixed(0) + '" cy="' + (p[1] + 2).toFixed(0) + '" r="4.6" fill="#C0392B"/>';
      s += '<circle cx="' + p[0].toFixed(0) + '" cy="' + (p[1] - 8).toFixed(0) + '" r="4.6" fill="#7C9A3E"/>';
    });
    return s;
  }

  V.liver_lobule = {
    t: '간이 굳어 가는 네 걸음 — 방 하나를 들여다봅니다',
    d: '간은 <b>육각형 방</b>이 벌집처럼 붙어 있습니다. 가운데에 정맥이 서고, 모서리마다 ' +
       '<b>문맥·동맥·담관</b> 셋이 함께 지납니다. 간세포는 그 사이를 줄로 늘어서고, 줄 사이 틈으로 피가 스며 지납니다. ' +
       '술·지방·바이러스가 오래 가면 <b>지방이 끼고 → 줄 사이에 흉터가 차고 → 방이 무너져 혹이 됩니다.</b> ' +
       '마지막 걸음은 <b>되돌아오지 않습니다</b> — 그래서 앞의 두 걸음에서 잡아야 합니다.',
    dz: ['liver', 'chronic'],
    build: function () {
      var R = rnd(20260827);
      var P = [
        ['정상', '줄이 곧고 틈이 열려 있습니다', '#166534'],
        ['지방간', '세포마다 기름방울이 낍니다 — 아직 되돌아옵니다', '#B45309'],
        ['섬유화', '줄 사이에 흉터가 찹니다 — 피가 지나기 어려워집니다', '#C2410C'],
        ['간경변', '방이 무너져 혹이 됩니다 — 되돌아오지 않습니다', '#991B1B']
      ];
      var s = '<svg viewBox="0 0 1300 470" width="1300" height="470">';
      P.forEach(function (p, i) {
        var x = 20 + i * 320;
        s += '<rect x="' + x + '" y="8" width="300" height="28" rx="9" fill="' + p[2] + '"/>';
        s += '<text x="' + (x + 14) + '" y="27" font-size="14" font-weight="800" fill="#fff">' +
             '④①②③'.charAt(i === 0 ? 1 : (i === 1 ? 2 : (i === 2 ? 3 : 0))) + ' ' + p[0] + '</text>';
        s += '<g transform="translate(' + (x + 6) + ' 46)">' + lobule(i, R) + '</g>';
        s += '<text x="' + (x + 4) + '" y="382" font-size="12.8" font-weight="800" fill="#0D1117">' + p[1] + '</text>';
      });
      s += '<g class="lbl">';
      s += '<circle cx="40" cy="412" r="8" fill="#4A6FA5"/><text x="54" y="417" font-size="12.5" fill="#334155">가운데 정맥 · 문맥</text>';
      s += '<circle cx="210" cy="412" r="6" fill="#C0392B"/><text x="222" y="417" font-size="12.5" fill="#334155">동맥</text>';
      s += '<circle cx="300" cy="412" r="6" fill="#7C9A3E"/><text x="312" y="417" font-size="12.5" fill="#334155">담관 (쓸개즙 길)</text>';
      s += '<circle cx="470" cy="412" r="7" fill="#F5E06B" stroke="#D9BE3E" stroke-width="1.4"/><text x="484" y="417" font-size="12.5" fill="#334155">기름방울</text>';
      s += '<rect x="580" y="406" width="26" height="7" rx="3" fill="#8FA88C"/><text x="614" y="417" font-size="12.5" fill="#334155">흉터 (섬유)</text>';
      s += '</g>';
      s += note(20, 452, '앞의 두 걸음에서 잡으면 되돌아옵니다 — 마지막 걸음은 되돌아오지 않습니다', '#0F172A');
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1300 470' });
    }
  };

  /* ═══ 척추 — 디스크가 밀려 나와 신경을 누릅니다 ═══════════════
     척추뼈 사이에는 <b>물주머니</b>가 하나씩 끼어 있다. 가운데가 젤리
     같은 속질핵이고, 그것을 질긴 섬유테가 겹겹이 감싼다. 나이가 들고
     눌리는 시간이 쌓이면 테가 갈라지고, 젤리가 <b>뒤로</b> 밀려 나온다.
     뒤에는 신경뿌리가 지난다 — 그래서 다리가 저린다.

     보험에서 여기가 갈리는 이유는 <b>고치는 방법이 여럿</b>이라서다.
     바늘로 하는 것, 내시경으로 하는 것, 째고 하는 것이 다 다르고,
     약관이 그중 어디까지를 「수술」로 보는지가 지급을 가른다.

     ★ 실제 비율·모양과 다르다. 관계를 보여 주는 그림이다.               */
  function discPanel(stage, R) {
    var s = '', i, a;
    var CX = 160, CY = 150;

    /* 척추뼈 몸통 — 위아래 */
    s += '<path d="M52 46 C52 26 72 18 160 18 C248 18 268 26 268 46 L268 92 ' +
         'C268 106 236 112 160 112 C84 112 52 106 52 92 Z" fill="#EDE3D2" stroke="#B9A98C" stroke-width="2.6"/>';
    s += '<path d="M52 254 C52 274 72 282 160 282 C248 282 268 274 268 254 L268 208 ' +
         'C268 194 236 188 160 188 C84 188 52 194 52 208 Z" fill="#EDE3D2" stroke="#B9A98C" stroke-width="2.6"/>';
    /* 뼈 속 결 */
    for (i = 0; i < 46; i++) {
      var bx = 58 + R() * 204, by = (R() < 0.5 ? 24 + R() * 80 : 196 + R() * 80);
      s += '<path d="M' + bx.toFixed(0) + ' ' + by.toFixed(0) + ' l' + (6 + R() * 12).toFixed(0) + ' ' +
           ((R() - 0.5) * 10).toFixed(0) + '" stroke="#C9B89A" stroke-width="1.6" opacity=".8"/>';
    }
    /* 뒤쪽 뼈 기둥과 신경이 지나는 굴 */
    s += '<path d="M268 40 L318 34 L332 62 L322 98 L268 96 Z" fill="#E3D8C4" stroke="#B9A98C" stroke-width="2.4"/>';
    s += '<path d="M268 260 L318 266 L332 238 L322 202 L268 204 Z" fill="#E3D8C4" stroke="#B9A98C" stroke-width="2.4"/>';

    /* 디스크 — 섬유테와 속질핵 */
    var bulge = [0, 14, 34, 52][stage];
    var ring = 'M52 116 C52 104 84 96 160 96 C236 96 268 104 268 116 ' +
               'C' + (268 + bulge) + ' 132 ' + (268 + bulge) + ' 168 268 184 ' +
               'C268 196 236 204 160 204 C84 204 52 196 52 184 C52 168 52 132 52 116 Z';
    s += '<path d="' + ring + '" fill="#CFDCE4" stroke="#7E97A8" stroke-width="2.6"/>';
    /* 섬유테 — 겹겹이 감긴 테 */
    for (i = 0; i < 7; i++) {
      var k = i / 7, w = 96 - i * 11, h = 46 - i * 4.6;
      s += '<ellipse cx="' + (160 + bulge * k * 1.1).toFixed(0) + '" cy="' + CY + '" rx="' + (w + 12).toFixed(0) +
           '" ry="' + h.toFixed(0) + '" fill="none" stroke="#8FA9B8" stroke-width="2.2" opacity="' +
           (0.85 - i * 0.06).toFixed(2) + '"/>';
    }
    /* 갈라진 테 */
    if (stage >= 1) {
      for (i = 0; i < 2 + stage; i++) {
        var ay = 132 + i * 12;
        s += '<path d="M' + (236 - i * 6) + ' ' + ay + ' L' + (272 + bulge * 0.8).toFixed(0) + ' ' +
             (ay + 6) + '" stroke="#5C7484" stroke-width="2.4" opacity=".9"/>';
      }
    }
    /* 속질핵 — 젤리 */
    var nx = 160 + bulge * 1.25;
    s += '<ellipse cx="' + nx.toFixed(0) + '" cy="' + CY + '" rx="' + (44 - stage * 3).toFixed(0) +
         '" ry="' + (32 - stage * 2).toFixed(0) + '" fill="#8ECAE0" stroke="#3F87A6" stroke-width="2.4" opacity=".95"/>';
    for (i = 0; i < 16; i++) {
      a = R() * Math.PI * 2;
      s += '<circle cx="' + (nx + Math.cos(a) * R() * 32).toFixed(0) + '" cy="' + (CY + Math.sin(a) * R() * 22).toFixed(0) +
           '" r="' + (1.6 + R() * 2).toFixed(1) + '" fill="#B9E3F0" opacity=".9"/>';
    }
    /* 밀려 나온 젤리 */
    if (stage >= 2) {
      s += '<path d="M266 128 C' + (292 + bulge) + ' 128 ' + (300 + bulge) + ' 150 ' + (292 + bulge) + ' 172 ' +
           'C' + (280 + bulge) + ' 184 266 180 264 172 Z" fill="#8ECAE0" stroke="#3F87A6" stroke-width="2.4"/>';
    }

    /* 신경뿌리 — 뒤로 지난다 */
    var press = stage >= 2 ? (stage === 3 ? 16 : 8) : 0;
    s += '<path d="M330 30 C' + (334 + press) + ' 90 ' + (334 + press) + ' 210 330 270" fill="none" ' +
         'stroke="#E3C878" stroke-width="' + (18 - press * 0.5).toFixed(1) + '" stroke-linecap="round"/>';
    s += '<path d="M330 30 C' + (334 + press) + ' 90 ' + (334 + press) + ' 210 330 270" fill="none" ' +
         'stroke="#C9A63E" stroke-width="2" opacity=".6"/>';
    if (stage >= 2) {
      s += '<circle cx="' + (332 + press) + '" cy="150" r="' + (20 + stage * 3) + '" fill="none" ' +
           'stroke="#DC2626" stroke-width="3" stroke-dasharray="5 4"/>';
    }
    return s;
  }

  V.disc_press = {
    t: '디스크는 <b>뒤로</b> 밀려 나옵니다 — 거기에 신경이 있습니다',
    d: '척추뼈 사이에는 물주머니가 하나씩 끼어 있습니다. 가운데가 젤리 같은 <b>속질핵</b>, ' +
       '그것을 질긴 <b>섬유테</b>가 겹겹이 감싸고 있습니다. 눌리는 시간이 쌓이면 테가 갈라지고 ' +
       '젤리가 <b>뒤쪽으로</b> 밀려 나옵니다. 하필 뒤에는 신경뿌리가 지납니다 — 그래서 허리가 아니라 ' +
       '<b>다리가 저립니다.</b>',
    dz: ['joint'],
    build: function () {
      var R = rnd(20260828);
      var P = [
        ['정상', '젤리가 가운데 있고 테가 온전합니다', '#166534'],
        ['부풀음', '테가 늘어나 전체가 불룩해집니다', '#B45309'],
        ['튀어나옴', '테가 갈라져 젤리가 밀려 나옵니다', '#C2410C'],
        ['신경 눌림', '밀려 나온 젤리가 신경을 누릅니다 — 다리가 저립니다', '#991B1B']
      ];
      var s = '<svg viewBox="0 0 1560 480" width="1560" height="480">';
      P.forEach(function (p, i) {
        var x = 16 + i * 386;
        s += '<rect x="' + x + '" y="8" width="366" height="28" rx="9" fill="' + p[2] + '"/>';
        s += '<text x="' + (x + 14) + '" y="27" font-size="14" font-weight="800" fill="#fff">' +
             ['①', '②', '③', '④'][i] + ' ' + p[0] + '</text>';
        s += '<g transform="translate(' + (x + 4) + ' 48)">' + discPanel(i, R) + '</g>';
        s += '<text x="' + (x + 4) + '" y="386" font-size="12.8" font-weight="800" fill="#0D1117">' +
             p[1] + '</text>';
      });
      s += '<g class="lbl">';
      s += '<ellipse cx="40" cy="414" rx="14" ry="9" fill="#8ECAE0" stroke="#3F87A6" stroke-width="1.6"/>';
      s += '<text x="62" y="419" font-size="12.5" fill="#334155">속질핵 (젤리)</text>';
      s += '<ellipse cx="220" cy="414" rx="16" ry="9" fill="none" stroke="#8FA9B8" stroke-width="2.2"/>';
      s += '<text x="244" y="419" font-size="12.5" fill="#334155">섬유테 (겹겹이 감긴 테)</text>';
      s += '<rect x="500" y="408" width="26" height="12" rx="6" fill="#E3C878"/>';
      s += '<text x="534" y="419" font-size="12.5" fill="#334155">신경뿌리</text>';
      s += '<rect x="640" y="406" width="26" height="16" rx="5" fill="#EDE3D2" stroke="#B9A98C" stroke-width="1.6"/>';
      s += '<text x="674" y="419" font-size="12.5" fill="#334155">척추뼈</text>';
      s += '</g>';
      s += '<rect x="16" y="436" width="1528" height="36" rx="10" fill="#0F172A"/>';
      s += '<text x="38" y="459" font-size="13.2" fill="#CBD5E1">' +
           '고치는 방법이 여럿입니다 — 바늘로 하는 것 · 내시경으로 하는 것 · 째고 하는 것. ' +
           '약관이 그중 어디까지를 「수술」로 보는지가 지급을 가릅니다.</text>';
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1560 480' });
    }
  };

  /* ═══ 골수 — 피를 만드는 공장, 그리고 그 공장이 무너지는 것 ═══════
     혈액암은 <b>덩어리가 생기는 병이 아니다.</b> 그래서 「어디에 났습니까」
     라는 질문이 안 통하고, 설계사도 설명하기 어려워한다.

     피는 뼈 속 <b>골수</b>에서 만들어진다. 한 줄기 세포에서 적혈구·백혈구·
     혈소판 셋이 갈라져 나온다. 백혈병은 그중 한 갈래가 <b>덜 자란 채로</b>
     끝없이 불어나 공장을 가득 메우는 병이다. 자리를 빼앗긴 나머지 둘이
     못 만들어지니 — <b>숨차고(적혈구), 자꾸 감염되고(백혈구), 멍이 든다(혈소판).</b>

     이 그림의 요점은 하나다. 덩어리를 잘라 내는 병이 아니라서
     <b>수술비가 놀고, 대신 입원과 치료비가 길게 나간다.</b>

     ★ 실제 비율·모양과 다르다. 관계를 보여 주는 그림이다.               */
  function marrowPanel(sick, R) {
    var s = '', i, a, x, y;
    /* 뼈 껍질 — 단단한 겉과 성긴 속 */
    s += '<path d="M30 24 L330 24 L330 300 L30 300 Z" fill="#F2EADA" stroke="#B9A98C" stroke-width="3"/>';
    s += '<rect x="30" y="24" width="300" height="26" fill="#E0D3B8"/>';
    s += '<rect x="30" y="274" width="300" height="26" fill="#E0D3B8"/>';
    /* 성긴 뼈기둥 */
    for (i = 0; i < 34; i++) {
      x = 36 + R() * 288; y = 54 + R() * 214;
      s += '<path d="M' + x.toFixed(0) + ' ' + y.toFixed(0) + ' l' + (16 + R() * 26).toFixed(0) + ' ' +
           ((R() - 0.5) * 26).toFixed(0) + '" stroke="#DCCDAE" stroke-width="' + (3 + R() * 3).toFixed(1) +
           '" opacity=".9" stroke-linecap="round"/>';
    }
    /* 굴 — 피가 빠져나가는 길 */
    s += '<path d="M30 168 C110 150 200 190 330 164" fill="none" stroke="#C0392B" stroke-width="9" opacity=".45"/>';

    /* 세포들 */
    function cell(x, y, r, fill, ring, dot) {
      var o = '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + r.toFixed(1) +
              '" fill="' + fill + '" stroke="' + ring + '" stroke-width="1.2"/>';
      if (dot) o += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + (r * 0.45).toFixed(1) +
                    '" fill="' + dot + '" opacity=".9"/>';
      return o;
    }
    var nRed = sick ? 8 : 46, nWhiteOK = sick ? 5 : 20, nPlt = sick ? 5 : 26, nBlast = sick ? 92 : 0;
    for (i = 0; i < nRed; i++) {           /* 적혈구 — 가운데가 옴폭 */
      x = 40 + R() * 280; y = 58 + R() * 210;
      s += cell(x, y, 6.4, '#C0392B', '#8E2A22', '#9B2F26');
    }
    for (i = 0; i < nWhiteOK; i++) {       /* 다 자란 백혈구 */
      x = 40 + R() * 280; y = 58 + R() * 210;
      s += cell(x, y, 8.2, '#EEF2F7', '#7E93A8', '#5B7186');
    }
    for (i = 0; i < nPlt; i++) {           /* 혈소판 — 작은 조각 */
      x = 40 + R() * 280; y = 58 + R() * 210;
      s += '<path d="M' + x.toFixed(0) + ' ' + y.toFixed(0) + ' l6 -3 l4 5 l-5 4 Z" fill="#D9A441" opacity=".95"/>';
    }
    for (i = 0; i < nBlast; i++) {         /* 덜 자란 세포 — 핵이 크다 */
      x = 40 + R() * 280; y = 58 + R() * 210;
      s += cell(x, y, 9.4, '#DCC9E8', '#7E5AA0', '#6D3FA0');
    }
    return s;
  }

  V.marrow = {
    t: '혈액암은 <b>덩어리가 생기는 병이 아닙니다</b> — 공장이 메워지는 병입니다',
    d: '피는 뼈 속 <b>골수</b>에서 만들어집니다. 한 줄기 세포에서 <b>적혈구·백혈구·혈소판</b> 셋이 갈라져 나옵니다. ' +
       '백혈병은 그중 한 갈래가 <b>덜 자란 채로</b> 끝없이 불어나 공장을 가득 메우는 병입니다. ' +
       '자리를 빼앗긴 나머지가 못 만들어지니 — <b>숨차고(적혈구), 자꾸 감염되고(백혈구), 멍이 듭니다(혈소판).</b> ' +
       '덩어리를 잘라 내는 병이 아니라서 <b>수술비가 놀고, 대신 입원과 치료비가 길게 나갑니다.</b>',
    dz: ['cancer_blood'],
    build: function () {
      var R = rnd(20260829);
      var s = '<svg viewBox="0 0 1120 520" width="1120" height="520">';
      s += '<rect x="24" y="8" width="360" height="28" rx="9" fill="#166534"/>';
      s += '<text x="38" y="27" font-size="14" font-weight="800" fill="#fff">① 정상 골수 — 셋이 고루 만들어집니다</text>';
      s += '<g transform="translate(24 44)">' + marrowPanel(0, R) + '</g>';
      s += '<rect x="420" y="8" width="360" height="28" rx="9" fill="#991B1B"/>';
      s += '<text x="434" y="27" font-size="14" font-weight="800" fill="#fff">② 백혈병 — 덜 자란 세포가 자리를 메웁니다</text>';
      s += '<g transform="translate(420 44)">' + marrowPanel(1, R) + '</g>';

      /* 범례 */
      s += '<g class="lbl">';
      s += '<circle cx="820" cy="70" r="7" fill="#C0392B" stroke="#8E2A22" stroke-width="1.2"/>';
      s += '<text x="838" y="75" font-size="13" font-weight="800" fill="#0D1117">적혈구</text>';
      s += '<text x="838" y="93" font-size="12" fill="#4B5563">모자라면 숨이 찹니다</text>';
      s += '<circle cx="820" cy="126" r="8" fill="#EEF2F7" stroke="#7E93A8" stroke-width="1.4"/>';
      s += '<text x="838" y="131" font-size="13" font-weight="800" fill="#0D1117">백혈구</text>';
      s += '<text x="838" y="149" font-size="12" fill="#4B5563">모자라면 자꾸 감염됩니다</text>';
      s += '<path d="M814 178 l8 -4 l5 6 l-7 5 Z" fill="#D9A441"/>';
      s += '<text x="838" y="187" font-size="13" font-weight="800" fill="#0D1117">혈소판</text>';
      s += '<text x="838" y="205" font-size="12" fill="#4B5563">모자라면 멍이 들고 피가 안 멎습니다</text>';
      s += '<circle cx="820" cy="238" r="9" fill="#DCC9E8" stroke="#7E5AA0" stroke-width="1.4"/>';
      s += '<text x="838" y="243" font-size="13" font-weight="800" fill="#0D1117">덜 자란 세포</text>';
      s += '<text x="838" y="261" font-size="12" fill="#4B5563">일은 못 하면서 자리만 차지합니다</text>';
      s += '</g>';

      s += '<rect x="24" y="374" width="1072" height="112" rx="14" fill="#0F172A"/>';
      s += '<text x="48" y="406" font-size="15" font-weight="800" fill="#fff">그래서 설계가 다릅니다</text>';
      s += '<text x="48" y="432" font-size="13.2" fill="#CBD5E1">' +
           '잘라 낼 덩어리가 없으니 수술비 담보가 놉니다. 대신 오래 입원하고, 항암을 여러 차례 받습니다.</text>';
      s += '<text x="48" y="456" font-size="13.2" fill="#93C5FD">' +
           '입원일당의 한도일수와, 치료할 때마다 열리는 치료비 담보가 실지급을 가릅니다.</text>';
      s += '<text x="24" y="510" font-size="11.8" fill="#6B7280">' +
           '실제 비율·모양과 다릅니다. 무엇이 무엇을 밀어내는지를 보여 주는 그림입니다.</text>';
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1120 520' });
    }
  };

  /* ═══ 갑상선 — 나비 하나와, 그 뒤에 지나는 것들 ═══════════════
     갑상선 상담이 어려운 이유는 <b>「암인데 암이 아닌 것처럼」</b> 다뤄지기
     때문이다. 실제로 많은 약관이 이것을 유사암(소액암) 칸에 넣어 감액한다.

     그런데 <b>수술은 진짜다.</b> 목 앞 나비 모양 장기 바로 뒤로
     목소리를 내는 신경(되돌이후두신경)이 지나고, 뒤쪽 네 귀퉁이에
     칼슘을 맡는 좁쌀만 한 부갑상선이 붙어 있다. 그래서 절반만 떼느냐
     전부 떼느냐가 <b>그 뒤 평생</b>을 가른다.

     ★ 실제 비율·모양과 다르다. 관계를 보여 주는 그림이다.               */
  function thyroid(mode, R) {
    var s = '', i, x, y;
    /* 목 — 기도와 후두 */
    s += '<path d="M258 30 C258 18 342 18 342 30 L342 400 C342 414 258 414 258 400 Z" ' +
         'fill="#F0DCCB" stroke="#C8A183" stroke-width="2.6"/>';
    for (i = 0; i < 11; i++) {
      s += '<rect x="256" y="' + (56 + i * 30) + '" width="88" height="17" rx="8" ' +
           'fill="#E3CBB6" stroke="#C09B78" stroke-width="1.8"/>';
    }
    s += '<path d="M266 26 C266 6 334 6 334 26" fill="#E8D3C0" stroke="#C8A183" stroke-width="2.6"/>';

    /* 갑상선 — 나비 */
    function lobe(sign, gone) {
      var cx = 300 + sign * 44;          /* 기도 옆에 딱 붙는다 — 그래야 나비가 된다 */
      if (gone) return '<path d="M' + cx + ' 118 q' + (sign * 52) + ' 24 ' + (sign * 44) + ' 96 q' +
        (-sign * 16) + ' 62 ' + (-sign * 48) + ' 68 q' + (-sign * 30) + ' -76 ' + (sign * 4) + ' -164 Z" ' +
        'fill="none" stroke="#B08F72" stroke-width="2.4" stroke-dasharray="7 5"/>';
      var LD = 'M' + cx + ' 118 q' + (sign * 52) + ' 24 ' + (sign * 44) + ' 96 q' +
        (-sign * 16) + ' 62 ' + (-sign * 48) + ' 68 q' + (-sign * 30) + ' -76 ' + (sign * 4) + ' -164 Z';
      var cid = 'cpThy' + mode + (sign > 0 ? 'R' : 'L');
      var o = '<defs><clipPath id="' + cid + '"><path d="' + LD + '"/></clipPath></defs>';
      o += '<path d="' + LD + '" fill="#B4544C" stroke="#7E2A24" stroke-width="2.6"/>';
      /* 소포 — 알갱이가 촘촘하다. 잎 밖으로 새지 않게 잎 모양으로 잘라 낸다 */
      o += '<g clip-path="url(#' + cid + ')">';
      for (i = 0; i < 60; i++) {
        x = cx + sign * (R() * 54 + 2); y = 126 + R() * 150;
        o += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + (3.6 + R() * 2.4).toFixed(1) +
             '" fill="#D4736A" stroke="#8E3830" stroke-width="0.9" opacity=".95"/>';
      }
      o += '</g>';
      return o;
    }
    /* 가운데 다리 */
    if (mode !== 3) s += '<path d="M266 196 q34 -16 68 0 q0 32 -34 34 q-34 -2 -34 -34 Z" fill="#B4544C" stroke="#7E2A24" stroke-width="2.4"/>';
    s += lobe(-1, mode === 3);
    s += lobe(1, mode === 2 || mode === 3);

    /* 혹 — 오른쪽 잎에 */
    if (mode >= 1) {
      s += '<circle cx="' + (300 + 44 + 30) + '" cy="190" r="26" ' +
           'fill="' + (mode >= 2 ? '#EADFD3' : '#3F2A55') + '" stroke="' + (mode >= 2 ? '#B08F72' : '#241436') +
           '" stroke-width="2.6"' + (mode >= 2 ? ' stroke-dasharray="6 4"' : '') + '/>';
      if (mode === 1) {
        for (i = 0; i < 14; i++) {
          s += '<circle cx="' + (374 + (R() - 0.5) * 34).toFixed(0) + '" cy="' + (190 + (R() - 0.5) * 34).toFixed(0) +
               '" r="' + (2 + R() * 2.4).toFixed(1) + '" fill="#6D3FA0" opacity=".9"/>';
        }
      }
    }

    /* 뒤로 지나는 것 — 목소리 신경 */
    s += '<path d="M232 400 C238 320 240 240 236 150 C234 112 240 84 254 62" fill="none" ' +
         'stroke="#E3C878" stroke-width="9" stroke-linecap="round"/>';
    s += '<path d="M368 400 C362 320 360 240 364 150 C366 112 360 84 346 62" fill="none" ' +
         'stroke="#E3C878" stroke-width="9" stroke-linecap="round"/>';
    /* 좁쌀 넷 — 부갑상선 */
    [[250,146],[254,258],[350,146],[346,258]].forEach(function (p) {
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="9" fill="#D9A441" stroke="#9A6F1E" stroke-width="2"/>';
    });
    return s;
  }

  V.thyroid_lobe = {
    t: '갑상선 — 절반을 떼느냐 전부를 떼느냐가 그 뒤를 가릅니다',
    d: '목 앞의 <b>나비 모양</b> 장기입니다. 바로 뒤로 <b>목소리를 내는 신경</b>이 지나고, ' +
       '뒤쪽 네 귀퉁이에 칼슘을 맡는 <b>좁쌀만 한 부갑상선</b>이 붙어 있습니다. ' +
       '그래서 <b>얼마나 떼느냐</b>가 그 뒤 평생을 가릅니다 — 전부 떼면 호르몬제를 평생 드십니다. ' +
       '보험에서는 이 병이 <b>유사암(소액암)</b> 칸으로 가 감액되는 약관이 많은데, ' +
       '수술과 그 뒤는 감액되지 않습니다. 그 간극을 미리 좁혀 두지 않으면 지급 때 민원이 됩니다.',
    dz: ['thyroid'],
    build: function () {
      var R = rnd(20260830);
      var P = [
        [0, '정상', '나비 하나, 뒤에 신경과 부갑상선', '#334155'],
        [1, '혹이 생김', '한쪽 잎에 결절 — 세침검사로 확인합니다', '#B45309'],
        [2, '반절제', '한쪽만 뗍니다 — 남은 쪽이 일하면 약을 안 드실 수도', '#1D4ED8'],
        [3, '전절제', '전부 뗍니다 — 호르몬제를 평생 드십니다', '#991B1B']
      ];
      var s = '<svg viewBox="0 0 1420 560" width="1420" height="560">';
      P.forEach(function (p, i) {
        var x = 20 + i * 348;
        s += '<rect x="' + x + '" y="8" width="330" height="28" rx="9" fill="' + p[3] + '"/>';
        s += '<text x="' + (x + 14) + '" y="27" font-size="14" font-weight="800" fill="#fff">' +
             ['①', '②', '③', '④'][i] + ' ' + p[1] + '</text>';
        s += '<g transform="translate(' + (x - 130) + ' 44) scale(0.79)">' + thyroid(p[0], R) + '</g>';
        s += '<text x="' + (x + 4) + '" y="392" font-size="12.8" font-weight="800" fill="#0D1117">' + p[2] + '</text>';
      });
      s += '<g class="lbl">';
      s += '<rect x="36" y="414" width="26" height="10" rx="5" fill="#E3C878"/>';
      s += '<text x="72" y="424" font-size="12.5" fill="#334155">목소리를 내는 신경 — 다치면 쉰 목소리가 남습니다</text>';
      s += '<circle cx="472" cy="419" r="8" fill="#D9A441" stroke="#9A6F1E" stroke-width="1.8"/>';
      s += '<text x="490" y="424" font-size="12.5" fill="#334155">부갑상선 — 칼슘을 맡습니다. 다치면 손발이 저립니다</text>';
      s += '<circle cx="900" cy="419" r="8" fill="#3F2A55"/>';
      s += '<text x="918" y="424" font-size="12.5" fill="#334155">혹 (결절)</text>';
      s += '</g>';
      s += '<rect x="20" y="444" width="1380" height="96" rx="14" fill="#0F172A"/>';
      s += '<text x="44" y="476" font-size="15" font-weight="800" fill="#fff">고객 기대와 약관의 간극</text>';
      s += '<text x="44" y="502" font-size="13.2" fill="#CBD5E1">' +
           '「암이라는데 왜 이것밖에 안 나옵니까」 — 많은 약관이 이 병을 유사암 칸에 넣어 감액합니다.</text>';
      s += '<text x="44" y="524" font-size="13.2" fill="#93C5FD">' +
           '어느 칸에서 나오는 암인지를 가입 전에 말해 두십시오. 분류와 지급은 약관과 심사가 정합니다.</text>';
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1420 560' });
    }
  };

  V.brain_atrophy = {
    t: '치매 — 뇌가 줄어들고, 그 빈자리를 물이 채웁니다',
    d: '치매는 <b>기억이 나빠지는 것</b>으로 시작하지만, 몸에서 일어나는 일은 <b>뇌가 실제로 줄어드는 것</b>입니다. ' +
       '겉의 주름이 얇아지고 고랑이 넓어지며, 뇌와 머리뼈 사이가 벌어집니다. 그 빈자리를 물이 대신 채워 ' +
       '가운데 방(뇌실)이 커집니다. ' +
       '<b>줄어든 것은 돌아오지 않습니다</b> — 그래서 이 병의 부담은 치료비가 아니라 <b>돌보는 시간</b>에 있습니다.',
    dz: ['dementia'],
    build: function () {
      var s = '<svg viewBox="0 0 1120 600" width="1120" height="600">';
      [[0, '정상', '주름이 두껍고 뇌가 머리뼈에 닿아 있습니다', '#334155'],
       [3, '위축', '주름이 얇아지고 사이가 벌어지며, 가운데 방이 커집니다', '#6D28D9']
      ].forEach(function (p, i) {
        var x = 30 + i * 546;
        s += '<rect x="' + x + '" y="10" width="510" height="28" rx="9" fill="' + p[3] + '"/>';
        s += '<text x="' + (x + 14) + '" y="29" font-size="14" font-weight="800" fill="#fff">' +
             ['①', '②'][i] + ' ' + p[1] + '</text>';
        s += '<g transform="translate(' + (x - 132) + ' 32) scale(0.5)">' + brainAxial(p[0]) + '</g>';
        s += '<text x="' + (x + 8) + '" y="374" font-size="13.2" font-weight="800" fill="#0D1117">' + p[2] + '</text>';
      });
      s += '<rect x="30" y="400" width="1060" height="136" rx="14" fill="#0F172A"/>';
      s += '<text x="54" y="434" font-size="15" font-weight="800" fill="#fff">그래서 설계가 다릅니다</text>';
      s += '<text x="54" y="460" font-size="13.2" fill="#CBD5E1">' +
           '수술도 항암도 없습니다. 진단비 한 번으로 끝나는 병이 아니라 <tspan font-weight="800" fill="#fff">돌보는 시간이 길게 이어지는</tspan> 병입니다.</text>';
      s += '<text x="54" y="484" font-size="13.2" fill="#CBD5E1">' +
           '등급을 받으면 열리는 자리(장기요양·치매), 사람을 쓰면 열리는 자리(간병인사용일당),</text>';
      s += '<text x="54" y="506" font-size="13.2" fill="#93C5FD">' +
           '요양병원에 들어가면 열리는 자리 — 이 셋이 실제 부담을 받칩니다. 일반 입원일당은 요양병원에서 빠지는 약관이 많습니다.</text>';
      s += '<text x="30" y="566" font-size="11.8" fill="#6B7280">' +
           '실제 비율·모양과 다릅니다. 무엇이 어떻게 달라지는지를 보여 주는 그림입니다. 진단은 의사가 합니다.</text>';
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1120 600' });
    }
  };

  /* ═══ 유방 — 젖샘과 겨드랑 사이 ═══════════════════════════════
     유방은 <b>젖을 만드는 방(젖샘엽)</b>과 그것을 젖꼭지로 나르는 <b>관</b>,
     그 사이를 채운 지방으로 되어 있다. 대부분의 유방암은 <b>관</b>에서 시작한다.

     설계에서 중요한 것은 <b>겨드랑</b>이다. 유방의 림프는 겨드랑으로 모이고,
     암세포도 그 길을 탄다. 그래서 수술이 가슴에서 끝나지 않고 겨드랑까지
     간다 — 얼마나 떼느냐에 따라 팔이 붓는 것이 평생 남기도 한다.

     ★ 실제 비율·모양과 다르다. 관계를 보여 주는 그림이다.               */
  function breastBody(mode, R) {
    var s = '', i, a, x, y;
    /* 가슴벽과 근육 */
    s += '<path d="M120 60 L168 60 L168 470 L120 470 Z" fill="#EDE3D2" stroke="#B9A98C" stroke-width="2.6"/>';
    s += '<path d="M168 60 L200 60 L200 470 L168 470 Z" fill="#B4544C" stroke="#7E2A24" stroke-width="2.4"/>';
    for (i = 0; i < 22; i++) {
      s += '<path d="M170 ' + (66 + i * 18) + ' L198 ' + (72 + i * 18) + '" stroke="#93332D" stroke-width="1.8" opacity=".7"/>';
    }
    /* 유방 겉 — 옆에서 본 반달 */
    var B = 'M200 96 C330 100 424 176 434 262 C440 344 348 424 200 430 Z';
    s += '<defs><clipPath id="cpBr' + mode + '"><path d="' + B + '"/></clipPath></defs>';
    s += '<path d="' + B + '" fill="#F6E2D2" stroke="#C8A183" stroke-width="2.8"/>';
    s += '<g clip-path="url(#cpBr' + mode + ')">';
    /* 지방 — 방울방울 */
    for (i = 0; i < 120; i++) {
      x = 206 + R() * 226; y = 100 + R() * 326;
      s += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + (7 + R() * 7).toFixed(1) +
           '" fill="#FBEFE2" stroke="#E3CBB6" stroke-width="1.2" opacity=".85"/>';
    }
    /* 쿠퍼인대 — 가슴벽에서 살갗까지 걸린 줄 */
    for (i = 0; i < 9; i++) {
      var yy = 118 + i * 36;
      s += '<path d="M204 ' + yy + ' Q320 ' + (yy - 14) + ' 420 ' + (yy + 8) + '" stroke="#DCC6AE" ' +
           'stroke-width="2.4" fill="none" opacity=".8"/>';
    }
    /* 젖샘엽과 관 — 젖꼭지로 모인다 */
    var NX = 436, NY = 264;
    for (i = 0; i < 9; i++) {
      a = -1.05 + (i / 8) * 2.1;
      var lx = NX - 150 - Math.cos(a) * 46, ly = NY + Math.sin(a) * 150;
      s += '<path d="M' + lx.toFixed(0) + ' ' + ly.toFixed(0) + ' Q' + (NX - 90).toFixed(0) + ' ' +
           (NY + (ly - NY) * 0.55).toFixed(0) + ' ' + (NX - 12) + ' ' + NY +
           '" stroke="#D9A441" stroke-width="6" fill="none" opacity=".92"/>';
      /* 방울처럼 매달린 젖샘엽 */
      for (var j = 0; j < 7; j++) {
        var t2 = j / 7, bx = lx - 26 + R() * 30, by = ly - 26 + R() * 52;
        s += '<circle cx="' + bx.toFixed(0) + '" cy="' + by.toFixed(0) + '" r="' + (7 + R() * 4).toFixed(1) +
             '" fill="#E8C98C" stroke="#B08A3C" stroke-width="1.4" opacity=".95"/>';
      }
    }
    /* 종양 — 관에서 시작한다 */
    if (mode >= 1) {
      s += '<circle cx="316" cy="212" r="30" fill="#3F2A55" opacity=".92"/>';
      for (i = 0; i < 18; i++) {
        a = R() * Math.PI * 2;
        s += '<circle cx="' + (316 + Math.cos(a) * R() * 34).toFixed(0) + '" cy="' +
             (212 + Math.sin(a) * R() * 34).toFixed(0) + '" r="' + (2.4 + R() * 2.6).toFixed(1) +
             '" fill="#6D3FA0" opacity=".9"/>';
      }
      /* 삐죽한 가장자리 — 파고드는 모양 */
      for (i = 0; i < 12; i++) {
        a = i * 0.52;
        s += '<path d="M' + (316 + Math.cos(a) * 28).toFixed(0) + ' ' + (212 + Math.sin(a) * 28).toFixed(0) +
             ' L' + (316 + Math.cos(a) * (40 + R() * 14)).toFixed(0) + ' ' +
             (212 + Math.sin(a) * (40 + R() * 14)).toFixed(0) + '" stroke="#3F2A55" stroke-width="3.4" ' +
             'stroke-linecap="round" opacity=".85"/>';
      }
    }
    s += '</g>';
    /* 젖꼭지 */
    s += '<path d="M432 240 q22 -6 26 22 q-4 28 -26 24 Z" fill="#C88A76" stroke="#9A6350" stroke-width="2.4"/>';

    /* ── 겨드랑 림프절 ── */
    var LN = [[520,120],[566,150],[540,186],[592,196],[556,232],[606,244]];
    /* 림프가 흐르는 길 */
    s += '<path d="M330 170 C400 140 460 122 512 118" stroke="#7C9A3E" stroke-width="5" fill="none" opacity=".8"/>';
    s += '<path d="M340 210 C420 190 480 168 534 152" stroke="#7C9A3E" stroke-width="4" fill="none" opacity=".7"/>';
    LN.forEach(function (p, k) {
      var sick = mode >= 2 && k < 2;
      s += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="17" ry="13" fill="' +
           (sick ? '#3F2A55' : '#B8D08A') + '" stroke="' + (sick ? '#241436' : '#6E8C3A') + '" stroke-width="2.2"/>';
      if (k < LN.length - 1) {
        s += '<path d="M' + p[0] + ' ' + p[1] + ' L' + LN[k + 1][0] + ' ' + LN[k + 1][1] +
             '" stroke="#7C9A3E" stroke-width="3" opacity=".7"/>';
      }
    });
    return s;
  }

  V.breast_node = {
    t: '유방암은 <b>겨드랑</b>까지 갑니다 — 그래서 수술이 가슴에서 안 끝납니다',
    d: '유방은 젖을 만드는 <b>방(젖샘엽)</b>과 그것을 젖꼭지로 나르는 <b>관</b>, 그 사이를 채운 지방으로 되어 있습니다. ' +
       '대부분의 유방암은 <b>관</b>에서 시작합니다. 그런데 유방의 림프는 <b>겨드랑</b>으로 모이고, 암세포도 그 길을 탑니다. ' +
       '그래서 수술이 가슴에서 끝나지 않고 겨드랑까지 갑니다 — 얼마나 떼느냐에 따라 <b>팔이 붓는 것이 평생 남기도 합니다.</b>',
    dz: ['cancer_female'],
    build: function () {
      var R = rnd(20260831);
      var P = [
        [0, '정상', '관이 젖꼭지로 모이고, 림프는 겨드랑으로 흐릅니다', '#334155'],
        [1, '관에서 시작', '가장자리가 삐죽하게 파고듭니다', '#B45309'],
        [2, '겨드랑까지', '림프절이 굳어집니다 — 수술 범위가 넓어집니다', '#991B1B']
      ];
      var s = '<svg viewBox="0 0 1980 620" width="1980" height="620">';
      P.forEach(function (p, i) {
        var x = 20 + i * 654;
        s += '<rect x="' + x + '" y="10" width="630" height="28" rx="9" fill="' + p[3] + '"/>';
        s += '<text x="' + (x + 14) + '" y="29" font-size="14" font-weight="800" fill="#fff">' +
             ['①', '②', '③'][i] + ' ' + p[1] + '</text>';
        s += '<g transform="translate(' + (x - 90) + ' 44)">' + breastBody(p[0], R) + '</g>';
        s += '<text x="' + (x + 6) + '" y="546" font-size="13.2" font-weight="800" fill="#0D1117">' + p[2] + '</text>';
      });
      s += '<g class="lbl">';
      s += '<circle cx="40" cy="576" r="9" fill="#E8C98C" stroke="#B08A3C" stroke-width="1.6"/>';
      s += '<text x="58" y="581" font-size="12.5" fill="#334155">젖샘엽 (젖을 만드는 방)</text>';
      s += '<rect x="270" y="572" width="26" height="7" rx="3" fill="#D9A441"/>';
      s += '<text x="306" y="581" font-size="12.5" fill="#334155">유관 (젖꼭지로 나르는 길)</text>';
      s += '<ellipse cx="580" cy="576" rx="15" ry="11" fill="#B8D08A" stroke="#6E8C3A" stroke-width="1.8"/>';
      s += '<text x="602" y="581" font-size="12.5" fill="#334155">림프절 — 겨드랑에 줄지어 있습니다</text>';
      s += '<circle cx="900" cy="576" r="10" fill="#3F2A55"/>';
      s += '<text x="918" y="581" font-size="12.5" fill="#334155">암 — 굳어진 림프절도 같은 색으로 그렸습니다</text>';
      s += '<text x="1320" y="581" font-size="12.5" fill="#6B7280">실제 비율·모양과 다릅니다. 관계를 보여 주는 그림입니다.</text>';
      s += '</g>';
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1980 620' });
    }
  };

  /* ═══ 배를 여는 두 가지 길 — 째느냐, 뚫느냐 ═════════════════════
     담낭·맹장 같은 흔한 수술에서 설계사가 가장 많이 듣는 말이
     「배 안 째고 했는데요」 이다. 그 말이 <b>보험에서 무슨 뜻인지</b> 를
     설명하지 못하면 상담이 멈춘다.

     배벽은 겹이다 — 살갗 · 지방 · 근막 · 근육 · 복막. 개복은 이 겹을
     <b>한 줄로 길게</b> 가르고, 복강경은 <b>작은 구멍 몇 개</b>로 관을 꽂아
     카메라와 기구를 넣는다. 몸에는 복강경이 낫지만, 약관에서는
     <b>어느 쪽이든 수술로 보는지</b> 가 따로 정해져 있다.

     ★ 실제 비율·모양과 다르다. 관계를 보여 주는 그림이다.               */
  function bellyWall(open, R) {
    var s = '', i, x, y;
    var X0 = 40, X1 = 620;
    /* 겹 — 위에서부터 */
    var L = [
      ['살갗',       58,  22, '#F3DCC8', '#D6B394'],
      ['피하지방',   80,  56, '#FBF0DC', '#E4D2A8'],
      ['근막',      136,  14, '#E6E0D0', '#B9AE92'],
      ['근육',      150,  60, '#B4544C', '#7E2A24'],
      ['복막',      210,  10, '#E8EEF2', '#9DB2C0']
    ];
    L.forEach(function (l) {
      s += '<rect x="' + X0 + '" y="' + l[1] + '" width="' + (X1 - X0) + '" height="' + l[2] +
           '" fill="' + l[3] + '" stroke="' + l[4] + '" stroke-width="2"/>';
    });
    /* 살갗 결 · 지방 방울 · 근육 결 */
    for (i = 0; i < 60; i++) {
      x = X0 + 4 + R() * (X1 - X0 - 8);
      s += '<circle cx="' + x.toFixed(0) + '" cy="' + (60 + R() * 50).toFixed(0) + '" r="' + (4 + R() * 5).toFixed(1) +
           '" fill="#FFF8E8" stroke="#E4D2A8" stroke-width="1" opacity=".85"/>';
    }
    for (i = 0; i < 52; i++) {
      x = X0 + 6 + R() * (X1 - X0 - 12); y = 154 + R() * 52;
      s += '<path d="M' + x.toFixed(0) + ' ' + y.toFixed(0) + ' l' + (10 + R() * 16).toFixed(0) + ' 0" ' +
           'stroke="#93332D" stroke-width="' + (1.6 + R() * 1.6).toFixed(1) + '" opacity=".75"/>';
    }
    /* 배 안 — 장기 */
    s += '<rect x="' + X0 + '" y="220" width="' + (X1 - X0) + '" height="150" fill="#F7EFE6"/>';
    /* 담낭 — 배 모양 주머니 */
    s += '<path d="M330 246 q46 -10 58 30 q10 44 -22 62 q-40 12 -52 -26 q-8 -42 16 -66 Z" ' +
         'fill="#9FBF6A" stroke="#6E8C3A" stroke-width="2.6"/>';
    s += '<path d="M338 244 q-24 -18 -42 -14" stroke="#6E8C3A" stroke-width="6" fill="none" stroke-linecap="round"/>';
    /* 간 자락 */
    s += '<path d="M' + X0 + ' 226 C160 232 260 236 340 232 C300 254 200 262 ' + X0 + ' 258 Z" ' +
         'fill="#B4544C" opacity=".75"/>';
    /* 장 */
    for (i = 0; i < 5; i++) {
      s += '<ellipse cx="' + (450 + (i % 3) * 52) + '" cy="' + (290 + Math.floor(i / 3) * 48) +
           '" rx="34" ry="24" fill="#E5B79A" stroke="#B98A63" stroke-width="2.2"/>';
    }

    if (open) {
      /* 개복 — 한 줄로 길게 가른다 */
      s += '<path d="M250 50 L250 220 M410 50 L410 220" stroke="#8B1A1A" stroke-width="3" opacity=".35"/>';
      s += '<path d="M250 50 C214 90 214 180 250 220 L410 220 C446 180 446 90 410 50 Z" fill="#FBF7F2" opacity=".55"/>';
      s += '<path d="M250 50 C214 90 214 180 250 220" stroke="#8B1A1A" stroke-width="4" fill="none"/>';
      s += '<path d="M410 50 C446 90 446 180 410 220" stroke="#8B1A1A" stroke-width="4" fill="none"/>';
      /* 벌린 자리를 잡아 주는 기구 */
      s += '<rect x="232" y="120" width="26" height="70" rx="6" fill="#9CA3AF" stroke="#6B7280" stroke-width="2"/>';
      s += '<rect x="402" y="120" width="26" height="70" rx="6" fill="#9CA3AF" stroke="#6B7280" stroke-width="2"/>';
      /* 손이 들어간다 */
      s += '<path d="M300 40 C300 120 316 190 340 230" stroke="#E0BFA6" stroke-width="34" ' +
           'stroke-linecap="round" fill="none"/>';
      s += '<path d="M300 40 C300 120 316 190 340 230" stroke="#C79E82" stroke-width="2" fill="none" opacity=".7"/>';
    } else {
      /* 복강경 — 작은 구멍 셋에 관을 꽂는다. 배는 가스로 부풀린다 */
      s += '<path d="' + 'M' + X0 + ' 220 C200 196 440 196 ' + X1 + ' 220' + '" fill="none" ' +
           'stroke="#9DB2C0" stroke-width="3" stroke-dasharray="8 5"/>';
      [[168, -22], [330, 0], [492, 22]].forEach(function (t, k) {
        var tx = t[0];
        s += '<rect x="' + (tx - 13) + '" y="' + (30 + 0) + '" width="26" height="196" rx="7" ' +
             'fill="#CBD5E1" stroke="#7E8C9A" stroke-width="2.2"/>';
        s += '<rect x="' + (tx - 19) + '" y="14" width="38" height="26" rx="8" fill="#94A3B8" stroke="#64748B" stroke-width="2"/>';
        /* 관 끝에서 나오는 것 */
        if (k === 1) {   /* 카메라 */
          s += '<circle cx="' + tx + '" cy="238" r="11" fill="#334155" stroke="#0F172A" stroke-width="2"/>';
          s += '<circle cx="' + tx + '" cy="238" r="5" fill="#93C5FD"/>';
          s += '<path d="M' + (tx - 46) + ' 300 L' + tx + ' 244 L' + (tx + 46) + ' 300" fill="#BFDBFE" opacity=".35"/>';
        } else {
          s += '<path d="M' + tx + ' 232 L' + (tx + (k ? -26 : 26)) + ' 268" stroke="#94A3B8" ' +
               'stroke-width="7" stroke-linecap="round"/>';
          s += '<path d="M' + (tx + (k ? -26 : 26)) + ' 268 l' + (k ? -12 : 12) + ' 10 M' +
               (tx + (k ? -26 : 26)) + ' 268 l' + (k ? -14 : 14) + ' -4" stroke="#64748B" ' +
               'stroke-width="4" stroke-linecap="round"/>';
        }
      });
    }
    return s;
  }

  V.belly_open = {
    t: '째느냐, 뚫느냐 — 배를 여는 두 가지 길',
    d: '배벽은 겹입니다 — <b>살갗 · 지방 · 근막 · 근육 · 복막.</b> ' +
       '개복은 이 겹을 <b>한 줄로 길게</b> 가르고 손을 넣습니다. 복강경은 <b>작은 구멍 몇 개</b>로 관을 꽂아 ' +
       '카메라와 기구를 넣고, 배는 가스로 부풀려 공간을 만듭니다. ' +
       '몸에는 복강경이 훨씬 낫습니다 — 덜 아프고 빨리 나갑니다. ' +
       '다만 <b>보험에서는 흉터 크기로 정하지 않습니다.</b> 약관의 수술 분류에 드는지가 전부입니다.',
    dz: ['surgery', 'cancer_major'],
    build: function () {
      var R = rnd(20260901);
      var s = '<svg viewBox="0 0 1400 560" width="1400" height="560">';
      [[1, '개복 — 한 줄로 길게 가릅니다', '겹을 다 가르고 손이 들어갑니다. 오래 아프고 오래 입원합니다.', '#991B1B'],
       [0, '복강경 — 작은 구멍 몇 개', '관을 꽂아 카메라와 기구를 넣습니다. 덜 아프고 빨리 나갑니다.', '#1D4ED8']
      ].forEach(function (p, i) {
        var x = 20 + i * 690;
        s += '<rect x="' + x + '" y="10" width="666" height="28" rx="9" fill="' + p[3] + '"/>';
        s += '<text x="' + (x + 14) + '" y="29" font-size="14" font-weight="800" fill="#fff">' +
             ['①', '②'][i] + ' ' + p[1] + '</text>';
        s += '<g transform="translate(' + (x - 20) + ' 44)">' + bellyWall(p[0], R) + '</g>';
        s += '<text x="' + (x + 6) + '" y="452" font-size="13.2" font-weight="800" fill="#0D1117">' + p[2] + '</text>';
      });
      s += '<g class="lbl">';
      ['살갗', '피하지방', '근막', '근육', '복막'].forEach(function (t, k) {
        s += '<rect x="' + (30 + k * 128) + '" y="470" width="22" height="12" rx="3" fill="' +
             ['#F3DCC8', '#FBF0DC', '#E6E0D0', '#B4544C', '#E8EEF2'][k] + '" stroke="#9A8C74" stroke-width="1.4"/>';
        s += '<text x="' + (60 + k * 128) + '" y="480" font-size="12.5" fill="#334155">' + t + '</text>';
      });
      s += '</g>';
      s += '<rect x="20" y="494" width="1360" height="52" rx="12" fill="#0F172A"/>';
      s += '<text x="44" y="516" font-size="13.4" font-weight="800" fill="#fff">' +
           '「배 안 째고 했는데요」 — 그 말이 보험에서 뜻하는 것</text>';
      s += '<text x="44" y="536" font-size="12.8" fill="#93C5FD">' +
           '흉터가 작다고 수술이 아닌 것이 아닙니다. 약관의 수술 분류에 드는지가 전부이고, 그것은 약관과 심사가 정합니다.</text>';
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1400 560' });
    }
  };

  /* ═══ 눈 — 렌즈 한 장이 뿌예지는 병 ═══════════════════════════
     백내장은 <b>우리나라에서 가장 많이 하는 수술</b> 축에 든다. 그런데
     상담에서 가장 자주 부딪히는 것도 이 병이다 — 「보험 되죠?」 라고
     물으시는데, <b>렌즈를 무엇으로 넣느냐</b>에 따라 답이 갈리기 때문이다.

     눈은 사진기와 같다. 앞의 <b>각막</b>과 <b>수정체</b>가 렌즈이고,
     뒤의 <b>망막</b>이 필름이다. 백내장은 <b>렌즈가 뿌예지는 것</b>이라
     그 렌즈를 빼고 인공 렌즈를 넣는다. 필름(망막)은 그대로다 —
     그래서 망막이 상한 사람은 렌즈를 바꿔도 잘 안 보인다.

     ★ 실제 비율·모양과 다르다. 관계를 보여 주는 그림이다.               */
  function eyeBall(mode, R) {
    var s = '', i, a, x, y;
    var CX = 300, CY = 240, RR = 190;

    s += '<defs><clipPath id="cpEye' + mode + '"><circle cx="' + CX + '" cy="' + CY + '" r="' + RR + '"/></clipPath>' +
      '<radialGradient id="gVit' + mode + '" cx="0.5" cy="0.5" r="0.6">' +
      '<stop offset="0" stop-color="#EAF4F8"/><stop offset="1" stop-color="#CFE3EC"/></radialGradient>' +
      '<linearGradient id="gLens' + mode + '" x1="0" y1="0" x2="1" y2="0">' +
      (mode === 1
        ? '<stop offset="0" stop-color="#D8C89C"/><stop offset="0.5" stop-color="#B79E62"/><stop offset="1" stop-color="#D8C89C"/>'
        : '<stop offset="0" stop-color="#E8F6FB"/><stop offset="0.5" stop-color="#CFEAF4"/><stop offset="1" stop-color="#E8F6FB"/>') +
      '</linearGradient></defs>';

    /* 흰자(공막)와 속 */
    s += '<circle cx="' + CX + '" cy="' + CY + '" r="' + RR + '" fill="#F6F3EC" stroke="#C9BFA9" stroke-width="4"/>';
    s += '<circle cx="' + CX + '" cy="' + CY + '" r="' + (RR - 14) + '" fill="url(#gVit' + mode + ')"/>';
    s += '<g clip-path="url(#cpEye' + mode + ')">';

    /* 맥락막·망막 — 뒤쪽 안쪽 벽 */
    s += '<circle cx="' + CX + '" cy="' + CY + '" r="' + (RR - 16) + '" fill="none" stroke="#B4544C" stroke-width="11" opacity=".85"/>';
    s += '<circle cx="' + CX + '" cy="' + CY + '" r="' + (RR - 25) + '" fill="none" stroke="#E9C6A8" stroke-width="8" opacity=".9"/>';
    /* 망막의 혈관 — 시신경에서 부챗살로 */
    for (i = 0; i < 12; i++) {
      a = -1.9 + (i / 11) * 3.8;
      s += '<path d="M' + (CX + RR - 34) + ' ' + CY + ' Q' + (CX + 90) + ' ' + (CY + Math.sin(a) * 70).toFixed(0) +
           ' ' + (CX + Math.cos(a) * 40).toFixed(0) + ' ' + (CY + Math.sin(a) * 150).toFixed(0) +
           '" stroke="#C0392B" stroke-width="' + (1.6 + R() * 1.6).toFixed(1) + '" fill="none" opacity=".65"/>';
    }
    /* 황반 — 가장 잘 보이는 자리 */
    s += '<ellipse cx="' + (CX + RR - 52) + '" cy="' + (CY + 26) + '" rx="20" ry="14" fill="#8E4038" opacity=".7"/>';

    /* 홍채와 동공 */
    s += '<path d="M' + (CX - RR + 18) + ' ' + (CY - 92) + ' q46 26 46 52 q0 26 -46 52" fill="#5B7186" stroke="#3C4E5E" stroke-width="2.4"/>';
    s += '<path d="M' + (CX - RR + 18) + ' ' + (CY + 92) + ' q46 -26 46 -52 q0 -26 -46 -52" fill="#5B7186" stroke="#3C4E5E" stroke-width="2.4"/>';

    /* 수정체 — 볼록렌즈 */
    var lx = CX - RR + 66;
    if (mode !== 2) {
      s += '<path d="M' + lx + ' ' + (CY - 54) + ' q40 26 40 54 q0 28 -40 54 q-40 -26 -40 -54 q0 -28 40 -54 Z" ' +
           'fill="url(#gLens' + mode + ')" stroke="' + (mode === 1 ? '#8E7434' : '#8FB8C8') + '" stroke-width="2.6"/>';
      /* 렌즈의 결 */
      for (i = 1; i <= 3; i++) {
        s += '<path d="M' + lx + ' ' + (CY - 54 + i * 9) + ' q' + (30 - i * 6) + ' ' + (26 - i * 4) + ' ' +
             (30 - i * 6) + ' ' + (54 - i * 9) + ' q0 ' + (28 - i * 5) + ' -' + (30 - i * 6) + ' ' + (54 - i * 9) +
             '" fill="none" stroke="' + (mode === 1 ? '#9A8244' : '#A9CEDC') + '" stroke-width="1.6" opacity=".8"/>';
      }
      if (mode === 1) {   /* 뿌예진 알갱이 */
        for (i = 0; i < 70; i++) {
          a = R() * Math.PI * 2; var rr = R() * 46;
          s += '<circle cx="' + (lx + Math.cos(a) * rr * 0.72).toFixed(0) + '" cy="' + (CY + Math.sin(a) * rr).toFixed(0) +
               '" r="' + (1.6 + R() * 2.6).toFixed(1) + '" fill="#F0E6C4" opacity=".8"/>';
        }
      }
    } else {
      /* 인공 수정체 — 얇은 판에 다리 둘 */
      s += '<path d="M' + lx + ' ' + (CY - 34) + ' q26 16 26 34 q0 18 -26 34 q-26 -16 -26 -34 q0 -18 26 -34 Z" ' +
           'fill="#E8F6FB" stroke="#3F87A6" stroke-width="2.6"/>';
      s += '<path d="M' + (lx - 22) + ' ' + (CY - 26) + ' q-30 -22 -14 -50 M' + (lx - 22) + ' ' + (CY + 26) +
           ' q-30 22 -14 50" stroke="#3F87A6" stroke-width="3" fill="none"/>';
      s += '<circle cx="' + lx + '" cy="' + CY + '" r="9" fill="none" stroke="#93C5FD" stroke-width="2" opacity=".8"/>';
    }
    /* 모양체 — 렌즈를 잡아 주는 실 */
    for (i = -3; i <= 3; i++) {
      if (!i) continue;
      s += '<path d="M' + (lx + 6) + ' ' + (CY + i * 16) + ' L' + (CX - RR + 30) + ' ' + (CY + i * 30) +
           '" stroke="#9AA7B4" stroke-width="1.8" opacity=".8"/>';
    }

    /* 빛이 지나가는 길 */
    var ok = mode !== 1;
    s += '<path d="M' + (CX - RR - 40) + ' ' + (CY - 30) + ' L' + lx + ' ' + CY + ' L' + (CX + RR - 52) + ' ' + (CY + 26) + '" ' +
         'stroke="' + (ok ? '#F59E0B' : '#CBD5E1') + '" stroke-width="3" fill="none" opacity="' + (ok ? '.95' : '.4') + '"/>';
    s += '<path d="M' + (CX - RR - 40) + ' ' + (CY + 30) + ' L' + lx + ' ' + CY + ' L' + (CX + RR - 52) + ' ' + (CY + 26) + '" ' +
         'stroke="' + (ok ? '#F59E0B' : '#CBD5E1') + '" stroke-width="3" fill="none" opacity="' + (ok ? '.95' : '.4') + '"/>';
    if (mode === 1) {  /* 흩어지는 빛 */
      for (i = 0; i < 9; i++) {
        a = -0.8 + i * 0.2;
        s += '<path d="M' + (lx + 30) + ' ' + CY + ' L' + (lx + 30 + Math.cos(a) * 150).toFixed(0) + ' ' +
             (CY + Math.sin(a) * 150).toFixed(0) + '" stroke="#F59E0B" stroke-width="1.6" opacity=".35"/>';
      }
    }
    s += '</g>';

    /* 각막 — 앞으로 볼록 */
    s += '<path d="M' + (CX - RR + 18) + ' ' + (CY - 92) + ' q-58 44 -58 92 q0 48 58 92" fill="#F0FAFD" ' +
         'stroke="#7FB6C9" stroke-width="4" opacity=".92"/>';
    /* 시신경 */
    s += '<path d="M' + (CX + RR - 6) + ' ' + (CY - 26) + ' q56 -6 78 8 q-22 40 -78 44 Z" fill="#E8D9B8" stroke="#B39A62" stroke-width="2.6"/>';
    return s;
  }

  V.eye_cataract = {
    t: '백내장 — 렌즈 한 장이 뿌예지는 병입니다',
    d: '눈은 사진기와 같습니다. 앞의 <b>각막과 수정체</b>가 렌즈이고, 뒤의 <b>망막</b>이 필름입니다. ' +
       '백내장은 <b>렌즈가 뿌예지는 것</b>이라, 그 렌즈를 빼고 <b>인공 렌즈</b>를 넣습니다. ' +
       '필름은 그대로 둡니다 — 그래서 망막이 이미 상한 분은 렌즈를 바꿔도 기대만큼 안 보입니다. ' +
       '보험에서 갈리는 곳은 <b>어떤 렌즈를 넣느냐</b> 입니다.',
    dz: ['cataract'],
    build: function () {
      var R = rnd(20260902);
      var P = [
        [0, '정상', '렌즈가 맑아 빛이 한 점으로 모입니다', '#334155'],
        [1, '백내장', '렌즈가 뿌예져 빛이 <tspan font-weight="800">흩어집니다</tspan> — 안개 낀 것처럼 보입니다', '#B45309'],
        [2, '인공 렌즈를 넣은 뒤', '뿌연 렌즈를 빼고 인공 렌즈를 넣습니다', '#1D4ED8']
      ];
      var s = '<svg viewBox="0 0 1900 620" width="1900" height="620">';
      P.forEach(function (p, i) {
        var x = 20 + i * 626;
        s += '<rect x="' + x + '" y="10" width="600" height="28" rx="9" fill="' + p[3] + '"/>';
        s += '<text x="' + (x + 14) + '" y="29" font-size="14" font-weight="800" fill="#fff">' +
             ['①', '②', '③'][i] + ' ' + p[1] + '</text>';
        s += '<g transform="translate(' + (x + 10) + ' 44)">' + eyeBall(p[0], R) + '</g>';
        s += '<text x="' + (x + 6) + '" y="536" font-size="13" font-weight="800" fill="#0D1117">' + p[2] + '</text>';
      });
      s += '<g class="lbl">';
      s += '<text x="30" y="572" font-size="12.5" fill="#334155">' +
           '왼쪽이 앞(빛이 들어오는 쪽), 오른쪽이 뒤(망막·시신경)입니다. 노란 선이 빛이 지나가는 길입니다.</text>';
      s += '<text x="30" y="594" font-size="12.5" fill="#6B7280">' +
           '실제 비율·모양과 다릅니다. 무엇이 뿌예지고 무엇을 바꾸는지를 보여 주는 그림입니다.</text>';
      s += '</g>';
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1900 620' });
    }
  };

  /* ═══ 허파 — 나뭇가지 끝에 매달린 주머니들 ══════════════════════
     허파는 <b>나무</b>다. 기관에서 갈라진 가지가 스무 번 넘게 갈라지고,
     그 끝에 <b>포도송이 같은 주머니(폐포)</b>가 매달려 있다. 주머니 겉을
     모세혈관이 그물처럼 감싸고, 그 얇은 벽 하나를 사이에 두고
     <b>산소와 이산화탄소가 자리를 바꾼다.</b>

     그래서 허파 병은 두 갈래다.
       · <b>주머니 안이 차는 병</b> — 폐렴. 물과 고름이 차서 바꿀 자리가 없다.
       · <b>주머니 벽이 무너지는 병</b> — COPD. 작은 주머니 여럿이 큰 자루
         하나가 되어 <b>넓이가 줄고</b>, 숨을 내쉴 때 길이 눌려 닫힌다.

     둘 다 「숨이 찬다」 지만 <b>이유가 정반대</b>다. 그래서 치료도 다르다.

     ★ 실제 비율·모양과 다르다. 관계를 보여 주는 그림이다.               */
  function alveoli(mode, R) {
    var s = '', i, j, a, x, y;
    var CX = 250, CY = 220;

    /* 끝가지 — 여기서 주머니로 갈라진다 */
    var narrow = mode === 2;
    s += '<path d="M20 220 C80 220 110 220 150 220" fill="none" stroke="#E0C7B4" stroke-width="' +
         (narrow ? 18 : 30) + '" stroke-linecap="round"/>';
    s += '<path d="M20 220 C80 220 110 220 150 220" fill="none" stroke="#F6E8DC" stroke-width="' +
         (narrow ? 8 : 18) + '" stroke-linecap="round"/>';
    if (narrow) {
      /* 벽이 두꺼워지고 가래가 낀다 */
      s += '<path d="M20 220 C80 220 110 220 150 220" fill="none" stroke="#C9A98C" stroke-width="26" ' +
           'stroke-linecap="round" opacity=".35"/>';
      for (i = 0; i < 8; i++) {
        s += '<ellipse cx="' + (34 + i * 15) + '" cy="' + (218 + (R() - 0.5) * 8).toFixed(0) +
             '" rx="6" ry="3.4" fill="#B7C58A" opacity=".85"/>';
      }
    }

    /* 주머니 — 정상은 작은 것 여럿, COPD 는 큰 자루 몇 개 */
    var sacs = [];
    if (mode === 2) {
      sacs = [[250,150,74],[330,236,64],[236,300,60],[356,124,44]];
    } else {
      for (i = 0; i < 7; i++) {
        a = -1.5 + (i / 6) * 3.0;
        sacs.push([CX + Math.cos(a) * 86, CY + Math.sin(a) * 96, 40 + (i % 2) * 8]);
      }
      for (i = 0; i < 6; i++) {
        a = -1.2 + (i / 5) * 2.4;
        sacs.push([CX + 70 + Math.cos(a) * 96, CY + Math.sin(a) * 108, 34 + (i % 2) * 7]);
      }
    }
    /* 가지에서 주머니로 이어지는 목 */
    sacs.forEach(function (p) {
      s += '<path d="M150 220 L' + p[0].toFixed(0) + ' ' + p[1].toFixed(0) + '" stroke="#E0C7B4" ' +
           'stroke-width="' + (narrow ? 6 : 9) + '" stroke-linecap="round" opacity=".9"/>';
    });
    sacs.forEach(function (p, k) {
      var filled = mode === 1 && k % 3 !== 2;
      s += '<circle cx="' + p[0].toFixed(0) + '" cy="' + p[1].toFixed(0) + '" r="' + p[2] +
           '" fill="' + (filled ? '#D8CFA8' : '#FDF6EE') + '" stroke="' + (mode === 2 ? '#C4B49E' : '#D9BFA6') +
           '" stroke-width="' + (mode === 2 ? 2 : 3) + '"' + (mode === 2 ? ' stroke-dasharray="7 5"' : '') + '/>';
      if (filled) {
        /* 물과 고름 — 싸우는 세포들 */
        for (i = 0; i < 22; i++) {
          a = R() * Math.PI * 2; var rr = R() * (p[2] - 8);
          s += '<circle cx="' + (p[0] + Math.cos(a) * rr).toFixed(0) + '" cy="' + (p[1] + Math.sin(a) * rr).toFixed(0) +
               '" r="' + (2.2 + R() * 3).toFixed(1) + '" fill="' + (i % 3 ? '#B7C58A' : '#EEF2F7') +
               '" stroke="#8E9C62" stroke-width="0.8" opacity=".9"/>';
        }
      }
      /* 겉을 감싼 모세혈관 그물 */
      for (i = 0; i < 7; i++) {
        a = (i / 7) * Math.PI * 2;
        s += '<path d="M' + (p[0] + Math.cos(a) * p[2]).toFixed(0) + ' ' + (p[1] + Math.sin(a) * p[2]).toFixed(0) +
             ' q' + (Math.cos(a + 1) * 14).toFixed(0) + ' ' + (Math.sin(a + 1) * 14).toFixed(0) + ' ' +
             (Math.cos(a + 0.9) * p[2] * 0.52).toFixed(0) + ' ' + (Math.sin(a + 0.9) * p[2] * 0.52).toFixed(0) +
             '" stroke="#C0392B" stroke-width="' + (mode === 2 ? 1.4 : 2.4) + '" fill="none" opacity="' +
             (mode === 2 ? '.35' : '.7') + '"/>';
      }
    });
    /* COPD — 무너진 벽 자국 */
    if (mode === 2) {
      for (i = 0; i < 14; i++) {
        x = 200 + R() * 190; y = 130 + R() * 200;
        s += '<path d="M' + x.toFixed(0) + ' ' + y.toFixed(0) + ' l' + (10 + R() * 16).toFixed(0) + ' ' +
             ((R() - 0.5) * 18).toFixed(0) + '" stroke="#C4B49E" stroke-width="2.4" opacity=".6" stroke-dasharray="4 4"/>';
      }
    }
    /* 산소와 이산화탄소가 자리를 바꾸는 것 */
    if (mode === 0) {
      for (i = 0; i < 5; i++) {
        var sp = sacs[i * 2];
        if (!sp) continue;
        s += '<path d="M' + (sp[0] + sp[2] - 6) + ' ' + sp[1] + ' l16 -9 M' + (sp[0] + sp[2] + 12) + ' ' +
             (sp[1] + 8) + ' l-16 9" stroke="#1D4ED8" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>';
      }
    }
    return s;
  }

  V.lung_alv = {
    t: '허파 — 차는 병(폐렴)과 무너지는 병(COPD)은 정반대입니다',
    d: '허파는 <b>나무</b>입니다. 가지 끝에 포도송이 같은 <b>주머니(폐포)</b>가 매달려 있고, ' +
       '그 겉을 모세혈관이 감싸 <b>얇은 벽 하나를 사이에 두고</b> 산소와 이산화탄소가 자리를 바꿉니다. ' +
       '<b>폐렴</b>은 그 주머니 <b>안이 차는</b> 병이고, <b>COPD</b>는 주머니 <b>벽이 무너지는</b> 병입니다. ' +
       '둘 다 「숨이 찬다」 고 하시지만 <b>이유가 정반대</b>라 치료도 다릅니다.',
    dz: ['pneumonia', 'copd'],
    build: function () {
      var R = rnd(20260903);
      var P = [
        [0, '정상', '주머니가 비어 있고 겉을 혈관이 감쌉니다 — 파란 화살표가 자리를 바꾸는 곳', '#334155'],
        [1, '폐렴 — 안이 찹니다', '물과 고름이 차서 <tspan font-weight="800">바꿀 자리가 없어집니다.</tspan> 약으로 비워 냅니다', '#991B1B'],
        [2, 'COPD — 벽이 무너집니다', '작은 주머니 여럿이 <tspan font-weight="800">큰 자루 하나</tspan>가 되어 넓이가 줄고, 길도 좁아집니다', '#B45309']
      ];
      var s = '<svg viewBox="0 0 1560 560" width="1560" height="560">';
      P.forEach(function (p, i) {
        var x = 20 + i * 512;
        s += '<rect x="' + x + '" y="10" width="490" height="28" rx="9" fill="' + p[3] + '"/>';
        s += '<text x="' + (x + 14) + '" y="29" font-size="14" font-weight="800" fill="#fff">' +
             ['①', '②', '③'][i] + ' ' + p[1] + '</text>';
        s += '<g transform="translate(' + (x + 4) + ' 44) scale(1.02)">' + alveoli(p[0], R) + '</g>';
        s += '<text x="' + (x + 4) + '" y="452" font-size="13" font-weight="800" fill="#0D1117">' + p[2] + '</text>';
      });
      s += '<g class="lbl">';
      s += '<circle cx="38" cy="486" r="9" fill="#FDF6EE" stroke="#D9BFA6" stroke-width="2.4"/>';
      s += '<text x="56" y="491" font-size="12.5" fill="#334155">폐포 (숨을 바꾸는 주머니)</text>';
      s += '<path d="M300 486 q12 -8 24 0" stroke="#C0392B" stroke-width="2.6" fill="none"/>';
      s += '<text x="336" y="491" font-size="12.5" fill="#334155">모세혈관 그물</text>';
      s += '<rect x="520" y="480" width="26" height="12" rx="6" fill="#E0C7B4"/>';
      s += '<text x="556" y="491" font-size="12.5" fill="#334155">기관지 (공기가 오가는 길)</text>';
      s += '<circle cx="820" cy="486" r="7" fill="#B7C58A" stroke="#8E9C62" stroke-width="1"/>';
      s += '<text x="836" y="491" font-size="12.5" fill="#334155">고름·염증 세포</text>';
      s += '</g>';
      s += '<rect x="20" y="504" width="1520" height="44" rx="11" fill="#0F172A"/>';
      s += '<text x="44" y="524" font-size="13.2" font-weight="800" fill="#fff">' +
           '보험에서 갈리는 자리 — 둘 다 수술이 아닙니다</text>';
      s += '<text x="44" y="542" font-size="12.5" fill="#93C5FD">' +
           '수술비가 놀고 <tspan font-weight="800" fill="#fff">입원일당과 실손</tspan>이 일합니다. COPD 는 좋아졌다 나빠졌다 하며 ' +
           '<tspan font-weight="800" fill="#fff">반복 입원</tspan>하므로 한도일수를 보십시오.</text>';
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1560 560' });
    }
  };

  /* ═══ 전립선 — 요도를 감싼 밤톨 ══════════════════════════════
     남성 상담에서 가장 자주 어긋나는 말이 <b>「소변 잘 나오니까 괜찮다」</b> 이다.
     그런데 전립선은 <b>안쪽이 커지는 병(비대증)</b>과 <b>바깥쪽에 생기는 병(암)</b>이
     자리가 다르다.

       · 비대증 — <b>요도를 감싼 안쪽</b>이 커진다 → 소변 줄기가 가늘어진다(증상이 먼저)
       · 암     — 대개 <b>바깥쪽 가장자리</b>에 생긴다 → <b>한참 동안 아무 증상이 없다</b>

     그래서 소변이 잘 나오는 것은 암이 없다는 뜻이 아니다. 그리고 이 암은
     <b>뼈로 잘 간다.</b> 그림에 그 길까지 함께 둔다.

     ★ 실제 비율·모양과 다르다. 관계를 보여 주는 그림이다.               */
  function prostate(mode, R) {
    var s = '', i, a, x, y;
    var PX = 250, PY = 300;

    /* 방광 */
    s += '<path d="M130 90 C130 40 370 40 370 90 C382 150 366 200 320 224 ' +
         'C300 234 200 234 180 224 C134 200 118 150 130 90 Z" fill="#F3E8DC" stroke="#C8A183" stroke-width="3"/>';
    for (i = 0; i < 26; i++) {
      s += '<path d="M' + (140 + R() * 220).toFixed(0) + ' ' + (60 + R() * 150).toFixed(0) +
           ' l' + (10 + R() * 18).toFixed(0) + ' ' + ((R() - 0.5) * 10).toFixed(0) +
           '" stroke="#DCC3A8" stroke-width="1.8" opacity=".8"/>';
    }
    /* 오줌 — 차 있는 정도 */
    var pee = mode === 1 ? 0.62 : 0.34;
    s += '<path d="M136 ' + (224 - 150 * pee).toFixed(0) + ' C200 ' + (214 - 150 * pee).toFixed(0) +
         ' 300 ' + (214 - 150 * pee).toFixed(0) + ' 364 ' + (224 - 150 * pee).toFixed(0) +
         ' C360 190 340 216 320 224 C300 234 200 234 180 224 C160 216 140 190 136 ' +
         (224 - 150 * pee).toFixed(0) + ' Z" fill="#EFDFA8" opacity=".85"/>';
    if (mode === 1) s += note(150, 120, '다 못 비웁니다', '#B45309');

    /* 요관 둘 */
    s += '<path d="M132 96 C96 70 78 40 74 12 M368 96 C404 70 422 40 426 12" fill="none" ' +
         'stroke="#E0C7B4" stroke-width="13" stroke-linecap="round"/>';

    /* 전립선 — 밤톨 모양, 요도가 가운데를 지난다 */
    var w = mode === 1 ? 120 : 88, hgt = mode === 1 ? 104 : 78;
    s += '<ellipse cx="' + PX + '" cy="' + PY + '" rx="' + w + '" ry="' + hgt + '" ' +
         'fill="#D9A98F" stroke="#A87856" stroke-width="3"/>';
    /* 바깥쪽(주변부) — 암이 잘 생기는 자리 */
    s += '<path d="M' + (PX - w) + ' ' + PY + ' a' + w + ' ' + hgt + ' 0 0 0 ' + (w * 2) + ' 0 Z" ' +
         'fill="#C9927A" opacity=".85"/>';
    /* 안쪽(이행부) — 비대증이 커지는 자리 */
    s += '<ellipse cx="' + PX + '" cy="' + (PY - 6) + '" rx="' + (mode === 1 ? 62 : 38) + '" ry="' +
         (mode === 1 ? 50 : 32) + '" fill="#E8C4AC" stroke="#B98A63" stroke-width="2.4"/>';
    /* 샘 조직 알갱이 */
    for (i = 0; i < 70; i++) {
      a = R() * Math.PI * 2; var rr = R();
      x = PX + Math.cos(a) * rr * (w - 12); y = PY + Math.sin(a) * rr * (hgt - 12);
      s += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + (2.6 + R() * 2.4).toFixed(1) +
           '" fill="#C08A6C" opacity=".55"/>';
    }
    /* 요도 — 전립선 가운데를 지난다. 비대증이면 눌려 좁아진다 */
    var uw = mode === 1 ? 7 : 17;
    s += '<path d="M' + PX + ' 226 L' + PX + ' ' + (PY - hgt + 6) + '" stroke="#E0C7B4" stroke-width="22" stroke-linecap="round"/>';
    s += '<path d="M' + PX + ' ' + (PY - hgt + 6) + ' L' + PX + ' ' + (PY + hgt - 6) + '" stroke="#B98A63" stroke-width="24"/>';
    s += '<path d="M' + PX + ' ' + (PY - hgt + 6) + ' L' + PX + ' ' + (PY + hgt - 6) + '" stroke="#F6E8DC" stroke-width="' + uw + '"/>';
    s += '<path d="M' + PX + ' ' + (PY + hgt - 6) + ' C' + PX + ' 470 ' + (PX + 10) + ' 520 ' + (PX + 26) + ' 560" ' +
         'fill="none" stroke="#E0C7B4" stroke-width="20" stroke-linecap="round"/>';
    s += '<path d="M' + PX + ' ' + (PY + hgt - 6) + ' C' + PX + ' 470 ' + (PX + 10) + ' 520 ' + (PX + 26) + ' 560" ' +
         'fill="none" stroke="#F6E8DC" stroke-width="9" stroke-linecap="round"/>';

    /* 암 — 바깥쪽 가장자리에 */
    if (mode === 2) {
      s += '<circle cx="' + (PX - 52) + '" cy="' + (PY + 34) + '" r="26" fill="#3F2A55" opacity=".93"/>';
      for (i = 0; i < 16; i++) {
        a = R() * Math.PI * 2;
        s += '<circle cx="' + (PX - 52 + Math.cos(a) * R() * 30).toFixed(0) + '" cy="' +
             (PY + 34 + Math.sin(a) * R() * 30).toFixed(0) + '" r="' + (2.2 + R() * 2.6).toFixed(1) +
             '" fill="#6D3FA0" opacity=".9"/>';
      }
      s += '<circle cx="' + (PX + 44) + '" cy="' + (PY + 40) + '" r="15" fill="#3F2A55" opacity=".85"/>';
      /* 뼈로 가는 길 */
      s += '<path d="M' + (PX + 62) + ' ' + (PY + 44) + ' C400 380 440 300 452 220" fill="none" ' +
           'stroke="#7E22CE" stroke-width="5" stroke-dasharray="9 6"/>';
      s += '<path d="M430 150 q40 -10 56 22 q10 40 -22 58 q-42 8 -56 -26 q-6 -38 22 -54 Z" ' +
           'fill="#EDE3D2" stroke="#B9A98C" stroke-width="2.6"/>';
      for (i = 0; i < 16; i++) {
        s += '<path d="M' + (438 + R() * 46).toFixed(0) + ' ' + (162 + R() * 62).toFixed(0) +
             ' l' + (7 + R() * 10).toFixed(0) + ' ' + ((R() - 0.5) * 8).toFixed(0) +
             '" stroke="#C9B89A" stroke-width="1.8"/>';
      }
      s += '<circle cx="462" cy="196" r="13" fill="#3F2A55" opacity=".9"/>';
      s += '<circle cx="444" cy="176" r="8" fill="#6D3FA0" opacity=".85"/>';
    }
    /* 정낭 */
    s += '<path d="M' + (PX - w - 30) + ' ' + (PY - 70) + ' q-40 -14 -56 14 q14 30 56 22 Z" ' +
         'fill="#C9927A" stroke="#A87856" stroke-width="2.4"/>';
    s += '<path d="M' + (PX + w + 30) + ' ' + (PY - 70) + ' q40 -14 56 14 q-14 30 -56 22 Z" ' +
         'fill="#C9927A" stroke="#A87856" stroke-width="2.4"/>';
    /* 직장 — 손가락으로 만지는 쪽 */
    s += '<path d="M' + (PX - 6) + ' ' + (PY + hgt + 26) + ' C160 400 150 470 150 540" fill="none" ' +
         'stroke="#B4544C" stroke-width="30" stroke-linecap="round" opacity=".65"/>';
    return s;
  }

  V.prostate_zone = {
    t: '전립선 — 커지는 자리와 암이 생기는 자리가 다릅니다',
    d: '전립선은 방광 아래에서 <b>요도를 감싸고 있는 밤톨</b>입니다. 그래서 커지면 소변 줄기가 가늘어집니다. ' +
       '그런데 <b>커지는 자리(안쪽)</b> 와 <b>암이 생기는 자리(바깥쪽 가장자리)</b> 가 다릅니다. ' +
       '그래서 <b>소변이 잘 나온다고 암이 없는 것이 아닙니다</b> — 이 암은 한참 동안 아무 증상이 없습니다. ' +
       '그리고 <b>뼈로 잘 갑니다.</b>',
    dz: ['prostate'],
    build: function () {
      var R = rnd(20260904);
      var P = [
        [0, '정상', '요도가 시원하게 지나갑니다', '#334155'],
        [1, '전립선비대증 — 안쪽이 커짐', '요도가 눌려 <tspan font-weight="800">줄기가 가늘어지고</tspan> 다 못 비웁니다', '#B45309'],
        [2, '전립선암 — 바깥쪽에 생김', '한참 <tspan font-weight="800">증상이 없습니다.</tspan> 그리고 뼈로 갑니다', '#991B1B']
      ];
      var s = '<svg viewBox="0 0 1760 700" width="1760" height="700">';
      P.forEach(function (p, i) {
        var x = 20 + i * 578;
        s += '<rect x="' + x + '" y="10" width="556" height="28" rx="9" fill="' + p[3] + '"/>';
        s += '<text x="' + (x + 14) + '" y="29" font-size="14" font-weight="800" fill="#fff">' +
             ['①', '②', '③'][i] + ' ' + p[1] + '</text>';
        s += '<g transform="translate(' + (x + 10) + ' 44)">' + prostate(p[0], R) + '</g>';
        s += '<text x="' + (x + 6) + '" y="644" font-size="13" font-weight="800" fill="#0D1117">' + p[2] + '</text>';
      });
      s += '<g class="lbl">';
      s += '<circle cx="38" cy="674" r="9" fill="#E8C4AC" stroke="#B98A63" stroke-width="2"/>';
      s += '<text x="56" y="679" font-size="12.5" fill="#334155">안쪽 — 비대증이 커지는 자리</text>';
      s += '<circle cx="330" cy="674" r="9" fill="#C9927A" stroke="#A87856" stroke-width="2"/>';
      s += '<text x="348" y="679" font-size="12.5" fill="#334155">바깥쪽 — 암이 잘 생기는 자리</text>';
      s += '<circle cx="660" cy="674" r="9" fill="#3F2A55"/>';
      s += '<text x="678" y="679" font-size="12.5" fill="#334155">암 · 뼈로 옮겨 간 것도 같은 색</text>';
      s += '<text x="1020" y="679" font-size="12.5" fill="#6B7280">실제 비율·모양과 다릅니다. 자리 관계를 보여 주는 그림입니다.</text>';
      s += '</g>';
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1760 700' });
    }
  };

  /* ═══ 자궁 — 혹이 어디에 붙었느냐가 전부다 ═════════════════════
     자궁근종은 <b>여성에게 매우 흔한</b> 혹이다. 그런데 상담에서 「있대요」
     로 끝나는 이유는, <b>같은 근종이라도 붙은 자리에 따라 완전히 다른 병</b>
     이라는 것을 말해 주지 못해서다.

       · <b>점막하</b>(안쪽 방으로 튀어나옴) — 작아도 <b>출혈이 심하다.</b> 내시경으로 뗀다
       · <b>근층내</b>(벽 속) — 가장 흔하다. 크면 누른다
       · <b>장막하</b>(바깥으로 튀어나옴) — 커도 증상이 적다. 다른 장기를 민다

     그리고 <b>자궁내막증</b>은 근종과 아예 다른 병이다 — 안쪽 방에 있어야 할
     내막이 <b>밖에</b> 자리를 잡아 달마다 그 자리에서 피가 난다.

     ★ 실제 비율·모양과 다르다. 관계를 보여 주는 그림이다.               */
  function uterus(mode, R) {
    var s = '', i, a, x, y;
    var CX = 300, CY = 250;

    /* 자궁 몸통 — 서양배를 거꾸로 */
    var U = 'M' + (CX - 118) + ' ' + (CY - 60) + ' C' + (CX - 130) + ' ' + (CY + 60) + ' ' +
            (CX - 66) + ' ' + (CY + 150) + ' ' + (CX - 34) + ' ' + (CY + 176) +
            ' L' + (CX + 34) + ' ' + (CY + 176) + ' C' + (CX + 66) + ' ' + (CY + 150) + ' ' +
            (CX + 130) + ' ' + (CY + 60) + ' ' + (CX + 118) + ' ' + (CY - 60) +
            ' C' + (CX + 70) + ' ' + (CY - 128) + ' ' + (CX - 70) + ' ' + (CY - 128) + ' ' +
            (CX - 118) + ' ' + (CY - 60) + ' Z';
    s += '<defs><clipPath id="cpUt' + mode + '"><path d="' + U + '"/></clipPath></defs>';
    s += '<path d="' + U + '" fill="#C9827E" stroke="#8E4C49" stroke-width="3"/>';
    s += '<g clip-path="url(#cpUt' + mode + ')">';
    /* 근층 — 결이 감긴다 */
    for (i = 0; i < 150; i++) {
      x = CX - 130 + R() * 260; y = CY - 130 + R() * 310;
      var t = -40 + (x - CX + 130) / 260 * 80;
      s += '<path d="M' + x.toFixed(0) + ' ' + y.toFixed(0) + ' q22 8 44 2" stroke="#A65E5A" ' +
           'stroke-width="' + (1.3 + R() * 1.5).toFixed(1) + '" fill="none" opacity="' + (0.3 + R() * 0.4).toFixed(2) +
           '" transform="rotate(' + t.toFixed(0) + ' ' + x.toFixed(0) + ' ' + y.toFixed(0) + ')"/>';
    }
    /* 안쪽 방과 내막 */
    var CAV = 'M' + (CX - 58) + ' ' + (CY - 52) + ' L' + (CX + 58) + ' ' + (CY - 52) +
              ' L' + (CX + 12) + ' ' + (CY + 96) + ' L' + (CX - 12) + ' ' + (CY + 96) + ' Z';
    s += '<path d="' + CAV + '" fill="#F0D9D8" stroke="#C08A88" stroke-width="2.4"/>';
    s += '<path d="' + CAV + '" fill="none" stroke="#D9564F" stroke-width="7" opacity=".7"/>';
    s += '</g>';

    /* 자궁경부와 질 */
    s += '<path d="M' + (CX - 34) + ' ' + (CY + 176) + ' L' + (CX + 34) + ' ' + (CY + 176) +
         ' L' + (CX + 40) + ' ' + (CY + 236) + ' L' + (CX - 40) + ' ' + (CY + 236) + ' Z" ' +
         'fill="#B4706C" stroke="#8E4C49" stroke-width="2.6"/>';
    s += '<path d="M' + CX + ' ' + (CY + 96) + ' L' + CX + ' ' + (CY + 232) + '" stroke="#F0D9D8" stroke-width="9"/>';

    /* 난관과 난소 */
    [-1, 1].forEach(function (sg) {
      s += '<path d="M' + (CX + sg * 112) + ' ' + (CY - 68) + ' C' + (CX + sg * 190) + ' ' + (CY - 108) + ' ' +
           (CX + sg * 236) + ' ' + (CY - 60) + ' ' + (CX + sg * 226) + ' ' + (CY - 14) + '" fill="none" ' +
           'stroke="#D9A98F" stroke-width="11" stroke-linecap="round"/>';
      /* 나팔 끝 */
      for (i = 0; i < 6; i++) {
        a = -0.5 + i * 0.22;
        s += '<path d="M' + (CX + sg * 226) + ' ' + (CY - 14) + ' l' + (sg * Math.cos(a) * 22).toFixed(0) +
             ' ' + (Math.sin(a) * 22).toFixed(0) + '" stroke="#D9A98F" stroke-width="4" stroke-linecap="round"/>';
      }
      s += '<ellipse cx="' + (CX + sg * 226) + '" cy="' + (CY + 34) + '" rx="34" ry="24" ' +
           'fill="#E8CFA8" stroke="#B8975E" stroke-width="2.6"/>';
      for (i = 0; i < 7; i++) {
        s += '<circle cx="' + (CX + sg * 226 + (R() - 0.5) * 44).toFixed(0) + '" cy="' + (CY + 34 + (R() - 0.5) * 30).toFixed(0) +
             '" r="' + (3 + R() * 3).toFixed(1) + '" fill="#FBF3DC" stroke="#B8975E" stroke-width="1.2"/>';
      }
    });

    /* ② 근종 세 자리 */
    if (mode === 1) {
      /* 점막하 — 안쪽 방으로 */
      s += '<circle cx="' + (CX - 16) + '" cy="' + (CY - 6) + '" r="30" fill="#E8DCC6" stroke="#A88F5E" stroke-width="3"/>';
      s += '<text x="' + (CX - 16) + '" y="' + (CY - 1) + '" font-size="13" font-weight="800" fill="#7A6438" text-anchor="middle">①</text>';
      /* 근층내 — 벽 속 */
      s += '<circle cx="' + (CX + 74) + '" cy="' + (CY + 24) + '" r="34" fill="#E8DCC6" stroke="#A88F5E" stroke-width="3"/>';
      s += '<text x="' + (CX + 74) + '" y="' + (CY + 29) + '" font-size="13" font-weight="800" fill="#7A6438" text-anchor="middle">②</text>';
      /* 장막하 — 바깥으로 */
      s += '<circle cx="' + (CX - 128) + '" cy="' + (CY - 84) + '" r="42" fill="#E8DCC6" stroke="#A88F5E" stroke-width="3"/>';
      s += '<text x="' + (CX - 128) + '" y="' + (CY - 79) + '" font-size="13" font-weight="800" fill="#7A6438" text-anchor="middle">③</text>';
      /* 내막이 밀려 출혈이 는다 */
      s += '<path d="M' + (CX - 40) + ' ' + (CY + 40) + ' q20 26 40 44" stroke="#D9564F" stroke-width="6" fill="none" opacity=".8"/>';
    }
    /* ③ 자궁내막증 — 내막이 밖에 자리를 잡음 */
    if (mode === 2) {
      [[CX - 226, CY + 34], [CX + 226, CY + 26], [CX - 132, CY + 130], [CX + 128, CY + 138], [CX + 40, CY - 128]]
        .forEach(function (p, k) {
          s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (10 + (k % 3) * 5) + '" fill="#7A1220" opacity=".9"/>';
          for (i = 0; i < 5; i++) {
            a = R() * Math.PI * 2;
            s += '<circle cx="' + (p[0] + Math.cos(a) * (12 + R() * 12)).toFixed(0) + '" cy="' +
                 (p[1] + Math.sin(a) * (12 + R() * 12)).toFixed(0) + '" r="' + (2.4 + R() * 2.4).toFixed(1) +
                 '" fill="#9C1A2B" opacity=".85"/>';
          }
        });
      /* 들러붙음 */
      s += '<path d="M' + (CX - 190) + ' ' + (CY + 70) + ' C' + (CX - 120) + ' ' + (CY + 120) + ' ' +
           (CX + 120) + ' ' + (CY + 126) + ' ' + (CX + 190) + ' ' + (CY + 66) + '" fill="none" ' +
           'stroke="#B98A63" stroke-width="3" stroke-dasharray="8 6" opacity=".9"/>';
    }
    return s;
  }

  V.uterus_myoma = {
    t: '자궁 — 같은 혹이라도 <b>붙은 자리</b>가 다르면 다른 병입니다',
    d: '자궁근종은 아주 흔합니다. 그래서 「있대요」 로 끝나기 쉬운데, ' +
       '실제로는 <b>어디에 붙었느냐</b> 가 증상도 수술도 가릅니다. ' +
       '<b>안쪽 방으로 튀어나온 것</b>은 작아도 출혈이 심하고, <b>벽 속</b>은 가장 흔하며, ' +
       '<b>바깥으로 튀어나온 것</b>은 커도 증상이 적습니다. ' +
       '<b>자궁내막증</b>은 아예 다른 병입니다 — 안에 있어야 할 내막이 <b>밖에</b> 자리를 잡아 ' +
       '달마다 그 자리에서 피가 나고, 장기끼리 들러붙습니다.',
    dz: ['myoma'],
    build: function () {
      var R = rnd(20260905);
      var P = [
        [0, '정상', '안쪽 방을 두꺼운 근육이 감싸고 있습니다', '#334155'],
        [1, '근종 — 붙은 자리 셋', '①안쪽으로(출혈이 심함) ②벽 속(가장 흔함) ③바깥으로(커도 조용함)', '#B45309'],
        [2, '자궁내막증', '내막이 <tspan font-weight="800">밖에</tspan> 자리를 잡아 달마다 피가 나고 들러붙습니다', '#991B1B']
      ];
      var s = '<svg viewBox="0 0 1900 620" width="1900" height="620">';
      P.forEach(function (p, i) {
        var x = 20 + i * 626;
        s += '<rect x="' + x + '" y="10" width="600" height="28" rx="9" fill="' + p[3] + '"/>';
        s += '<text x="' + (x + 14) + '" y="29" font-size="14" font-weight="800" fill="#fff">' +
             ['①', '②', '③'][i] + ' ' + p[1] + '</text>';
        s += '<g transform="translate(' + (x - 4) + ' 44)">' + uterus(p[0], R) + '</g>';
        s += '<text x="' + (x + 6) + '" y="562" font-size="13" font-weight="800" fill="#0D1117">' + p[2] + '</text>';
      });
      s += '<g class="lbl">';
      s += '<circle cx="38" cy="592" r="10" fill="#E8DCC6" stroke="#A88F5E" stroke-width="2.4"/>';
      s += '<text x="58" y="597" font-size="12.5" fill="#334155">근종 (근육이 뭉친 혹)</text>';
      s += '<path d="M330 592 l30 0" stroke="#D9564F" stroke-width="6"/>';
      s += '<text x="372" y="597" font-size="12.5" fill="#334155">자궁내막 (달마다 헐고 다시 자라는 안쪽 막)</text>';
      s += '<circle cx="880" cy="592" r="9" fill="#7A1220"/>';
      s += '<text x="898" y="597" font-size="12.5" fill="#334155">밖에 자리 잡은 내막 (자궁내막증)</text>';
      s += '<text x="1360" y="597" font-size="12.5" fill="#6B7280">실제 비율·모양과 다릅니다. 자리 관계를 보여 주는 그림입니다.</text>';
      s += '</g>';
      s += '</svg>';
      return art({ svg: s, vb: '0 0 1900 620' });
    }
  };

  /* ═══ 대상포진 — 신경에 숨어 있다가 그 신경을 타고 나온다 ══════
     상담에서 대상포진이 어려운 이유는 <b>「피부병이 아니다」</b> 는 것을
     설명하기 어려워서다. 이 병은 <b>신경의 병</b>이다.

     어릴 때 수두를 앓으면 바이러스가 없어지지 않고 <b>척수 옆 신경절</b>에
     숨는다. 몸이 지치면 깨어나서 <b>그 신경 한 가닥을 타고</b> 피부로 나온다.
     신경 한 가닥이 맡는 자리가 몸통을 <b>한 바퀴 감는 띠</b>라서,
     발진도 <b>한쪽에 띠 모양</b>으로 난다 — 가운데를 넘지 않는다.

     그리고 진짜 무서운 것은 발진이 아니라 <b>그 뒤에 남는 신경통</b>이다.
     피부는 나았는데 통증만 몇 달·몇 해 남는다.

     ★ 실제 비율·모양과 다르다. 관계를 보여 주는 그림이다.               */
  function zoster(mode, R) {
    var s = '', i, a, x, y;
    var CX = 300, CY = 260;

    /* 몸통 단면 — 배 쪽이 위, 등 쪽이 아래 */
    s += '<ellipse cx="' + CX + '" cy="' + CY + '" rx="232" ry="168" fill="#F6E3D2" stroke="#C8A183" stroke-width="3.4"/>';
    s += '<ellipse cx="' + CX + '" cy="' + CY + '" rx="216" ry="152" fill="#FBEFE2" stroke="#E3CBB6" stroke-width="2"/>';
    /* 근육 띠 */
    for (i = 0; i < 60; i++) {
      a = R() * Math.PI * 2; var rr = 0.86 + R() * 0.12;
      x = CX + Math.cos(a) * 216 * rr; y = CY + Math.sin(a) * 152 * rr;
      s += '<path d="M' + x.toFixed(0) + ' ' + y.toFixed(0) + ' l' + (Math.cos(a + 1.57) * 16).toFixed(0) + ' ' +
           (Math.sin(a + 1.57) * 16).toFixed(0) + '" stroke="#D8A88C" stroke-width="2.2" opacity=".7"/>';
    }
    /* 속 — 장기 자리 */
    s += '<ellipse cx="' + CX + '" cy="' + (CY - 14) + '" rx="150" ry="98" fill="#F0DFCE" opacity=".8"/>';

    /* 척추뼈와 척수 — 등 쪽(아래) */
    var SX = CX, SY = CY + 116;
    s += '<path d="M' + (SX - 46) + ' ' + (SY - 30) + ' q46 -22 92 0 q10 34 -10 58 q-36 16 -72 0 q-20 -24 -10 -58 Z" ' +
         'fill="#EDE3D2" stroke="#B9A98C" stroke-width="3"/>';
    s += '<circle cx="' + SX + '" cy="' + (SY + 2) + '" r="24" fill="#E8EEF2" stroke="#9DB2C0" stroke-width="2.6"/>';
    s += '<path d="M' + (SX - 12) + ' ' + (SY - 8) + ' q12 -8 24 0 q4 18 -12 24 q-16 -6 -12 -24 Z" fill="#B8C6D2"/>';
    s += '<path d="M' + SX + ' ' + (SY + 26) + ' l0 26 M' + (SX - 30) + ' ' + (SY + 22) + ' l-16 20 M' +
         (SX + 30) + ' ' + (SY + 22) + ' l16 20" stroke="#CFC5B4" stroke-width="9" stroke-linecap="round"/>';

    /* 신경절 — 바이러스가 숨는 곳 (한쪽만) */
    var GX = SX - 44, GY = SY - 6;
    var awake = mode >= 1;
    s += '<ellipse cx="' + GX + '" cy="' + GY + '" rx="19" ry="14" fill="' + (awake ? '#7E22CE' : '#E3C878') +
         '" stroke="' + (awake ? '#4C1D95' : '#9A6F1E') + '" stroke-width="2.6"/>';
    if (!awake) {
      for (i = 0; i < 5; i++) {
        s += '<circle cx="' + (GX + (R() - 0.5) * 22).toFixed(0) + '" cy="' + (GY + (R() - 0.5) * 16).toFixed(0) +
             '" r="2.4" fill="#7E22CE" opacity=".85"/>';
      }
    }

    /* 신경 한 가닥 — 몸통을 감아 앞으로 */
    var NP = 'M' + GX + ' ' + GY + ' C' + (CX - 200) + ' ' + (CY + 90) + ' ' +
             (CX - 224) + ' ' + (CY - 60) + ' ' + (CX - 120) + ' ' + (CY - 132) +
             ' C' + (CX - 60) + ' ' + (CY - 168) + ' ' + (CX + 20) + ' ' + (CY - 160) + ' ' +
             (CX + 60) + ' ' + (CY - 146);
    s += '<path d="' + NP + '" fill="none" stroke="' + (awake ? '#A855F7' : '#E3C878') + '" stroke-width="9" ' +
         'stroke-linecap="round" opacity="' + (awake ? '1' : '.9') + '"/>';
    if (awake) {
      s += '<path d="' + NP + '" fill="none" stroke="#F0ABFC" stroke-width="3" stroke-linecap="round" opacity=".8"/>';
      /* 타고 올라가는 것 */
      for (i = 0; i < 9; i++) {
        var t2 = i / 9;
        s += '<circle cx="' + (GX + (CX + 60 - GX) * t2 * 0.5 - 120 * Math.sin(t2 * 3)).toFixed(0) + '" cy="' +
             (GY - 240 * t2 + 60 * Math.sin(t2 * 3.2)).toFixed(0) + '" r="3.4" fill="#7E22CE" opacity=".75"/>';
      }
    }
    /* 반대쪽 신경 — 조용하다 */
    s += '<path d="M' + (SX + 44) + ' ' + GY + ' C' + (CX + 200) + ' ' + (CY + 90) + ' ' +
         (CX + 224) + ' ' + (CY - 60) + ' ' + (CX + 120) + ' ' + (CY - 132) +
         ' C' + (CX + 60) + ' ' + (CY - 168) + ' ' + (CX - 20) + ' ' + (CY - 160) + ' ' +
         (CX - 60) + ' ' + (CY - 146) + '" fill="none" stroke="#E3C878" stroke-width="9" ' +
         'stroke-linecap="round" opacity=".55"/>';
    s += '<ellipse cx="' + (SX + 44) + '" cy="' + GY + '" rx="19" ry="14" fill="#E3C878" stroke="#9A6F1E" stroke-width="2.6" opacity=".65"/>';

    /* 발진 — 그 신경이 맡는 띠에만, 한쪽에만 */
    if (mode === 2 || mode === 3) {
      var faded = mode === 3;
      for (i = 0; i < 46; i++) {
        var tt = R();
        var bx = GX + (CX + 60 - GX) * tt * 0.5 - 130 * Math.sin(tt * 3) + (R() - 0.5) * 26;
        var by = GY - 250 * tt + 62 * Math.sin(tt * 3.2) + (R() - 0.5) * 22;
        s += '<circle cx="' + bx.toFixed(0) + '" cy="' + by.toFixed(0) + '" r="' + (3.4 + R() * 4).toFixed(1) +
             '" fill="' + (faded ? '#D8BFB2' : '#C0392B') + '" stroke="' + (faded ? '#B49A8C' : '#7F1D1D') +
             '" stroke-width="1.2" opacity="' + (faded ? '.7' : '.92') + '"/>';
        if (!faded && i % 3 === 0) {
          s += '<circle cx="' + bx.toFixed(0) + '" cy="' + (by - 1).toFixed(0) + '" r="1.8" fill="#FDE68A"/>';
        }
      }
      /* 가운데를 넘지 않는다 */
      s += '<path d="M' + CX + ' ' + (CY - 168) + ' L' + CX + ' ' + (CY + 168) + '" stroke="#334155" ' +
           'stroke-width="2.4" stroke-dasharray="8 6" opacity=".55"/>';
    }
    /* 남은 통증 — 번개 */
    if (mode === 3) {
      for (i = 0; i < 6; i++) {
        var tt2 = 0.15 + i * 0.14;
        var zx = GX + (CX + 60 - GX) * tt2 * 0.5 - 130 * Math.sin(tt2 * 3);
        var zy = GY - 250 * tt2 + 62 * Math.sin(tt2 * 3.2);
        s += '<path d="M' + zx.toFixed(0) + ' ' + (zy - 26).toFixed(0) + ' l10 16 l-7 3 l11 17 l-16 -14 l7 -4 Z" ' +
             'fill="#7E22CE" opacity=".9"/>';
      }
    }
    return s;
  }

  V.zoster_nerve = {
    t: '대상포진은 <b>피부병이 아니라 신경의 병</b>입니다',
    d: '어릴 때 수두를 앓으면 바이러스가 없어지지 않고 <b>척수 옆 신경절</b>에 숨습니다. ' +
       '몸이 지치면 깨어나 <b>그 신경 한 가닥을 타고</b> 피부로 나옵니다. ' +
       '신경 한 가닥이 맡는 자리가 몸통을 한 바퀴 감는 <b>띠</b>라서, 발진도 <b>한쪽에 띠 모양</b>으로 나고 ' +
       '<b>가운데를 넘지 않습니다.</b> ' +
       '진짜 무서운 것은 발진이 아니라 <b>그 뒤에 남는 신경통</b>입니다 — 피부는 나았는데 통증만 오래 남습니다.',
    dz: ['zoster'],
    build: function () {
      var R = rnd(20260906);
      var P = [
        [0, '숨어 있음', '수두를 앓은 뒤, 바이러스가 <tspan font-weight="800">신경절에 숨어</tspan> 지냅니다', '#334155'],
        [1, '깨어나 신경을 탐', '몸이 지치면 깨어나 <tspan font-weight="800">그 신경 한 가닥</tspan>을 타고 올라갑니다', '#B45309'],
        [2, '띠 모양 발진', '그 신경이 맡는 자리에만 — <tspan font-weight="800">한쪽, 가운데를 안 넘습니다</tspan>', '#991B1B'],
        [3, '그 뒤에 남는 신경통', '피부는 나았는데 <tspan font-weight="800">통증만 남습니다</tspan>', '#6D28D9']
      ];
      var s = '<svg viewBox="0 0 2380 600" width="2380" height="600">';
      P.forEach(function (p, i) {
        var x = 20 + i * 590;
        s += '<rect x="' + x + '" y="10" width="566" height="28" rx="9" fill="' + p[3] + '"/>';
        s += '<text x="' + (x + 14) + '" y="29" font-size="14" font-weight="800" fill="#fff">' +
             ['①', '②', '③', '④'][i] + ' ' + p[1] + '</text>';
        s += '<g transform="translate(' + (x + 20) + ' 44)">' + zoster(p[0], R) + '</g>';
        s += '<text x="' + (x + 6) + '" y="524" font-size="13" font-weight="800" fill="#0D1117">' + p[2] + '</text>';
      });
      s += '<g class="lbl">';
      s += '<ellipse cx="40" cy="556" rx="16" ry="11" fill="#E3C878" stroke="#9A6F1E" stroke-width="2"/>';
      s += '<text x="62" y="561" font-size="12.5" fill="#334155">신경절 (바이러스가 숨는 곳)</text>';
      s += '<path d="M370 556 l34 0" stroke="#A855F7" stroke-width="8" stroke-linecap="round"/>';
      s += '<text x="416" y="561" font-size="12.5" fill="#334155">깨어난 신경 — 이 가닥을 타고 나옵니다</text>';
      s += '<circle cx="880" cy="556" r="8" fill="#C0392B" stroke="#7F1D1D" stroke-width="1.2"/>';
      s += '<text x="898" y="561" font-size="12.5" fill="#334155">물집</text>';
      s += '<path d="M990 546 l10 16 l-7 3 l11 17 l-16 -14 l7 -4 Z" fill="#7E22CE"/>';
      s += '<text x="1016" y="561" font-size="12.5" fill="#334155">남은 신경통</text>';
      s += '<text x="1160" y="561" font-size="12.5" fill="#6B7280">' +
           '점선이 몸의 가운데입니다 — 발진이 이 선을 넘지 않는 것이 이 병의 표시입니다. 실제 비율·모양과 다릅니다.</text>';
      s += '</g>';
      s += '</svg>';
      return art({ svg: s, vb: '0 0 2380 600' });
    }
  };

  V.vessel = {
    t: '혈관은 이렇게 좁아지고, 이렇게 엽니다',
    d: '기름때가 쌓여 길이 좁아지다가(협심증), 그 덩어리가 터지면 피떡이 생겨 완전히 막힙니다(심근경색). ' +
       '스텐트는 <b>그 자리에 그물망을 펴서 열어 두는 것</b>이지 기름때를 없애는 것이 아닙니다. ' +
       '그래서 평생 약을 먹고, 다시 좁아지면 또 넣습니다.',
    dz: ['mi', 'stroke', 'chronic'],
    build: function () {
      return flat('<div class="dzrow">' +
        tube(1, 0, 0, '정상 — 길이 열려 있다') +
        tube(2, 1, 0, '협착 — 좁아진다(협심증)') +
        tube(3, 2, 0, '폐색 — 막힌다(심근경색)') +
        tube(4, 1.4, 1, '스텐트 — 열어 둔다(PCI)') +
        '</div>');
    }
  };

  /* ═══ 3. 뇌 — 막힌 자리를 여는 세 가지 길 ═══ */
  V.brain_open = {
    t: '막힌 뇌혈관을 여는 세 가지 길',
    d: '같은 뇌경색인데 <b>어떻게 열었느냐</b>에 따라 보험이 완전히 달라집니다. ' +
       '약으로 녹이면 수술이 아니고, 관을 넣어 꺼내면 시술이며, 머리를 열면 수술입니다. ' +
       '가장 흔한 것은 <b>맨 왼쪽</b>인데, 수술비 담보만 가진 분은 여기서 한 푼도 못 받습니다.',
    dz: ['stroke'],
    build: function () {
      function head(inner, cap, badge, bc) {
        return '<svg viewBox="0 0 200 206" width="200" height="206">' +
          '<path d="M95 16 C136 16 166 46 166 88 C166 118 148 140 128 150 L128 166 L62 166 L62 150 C42 140 24 118 24 88 C24 46 54 16 95 16 Z" ' +
          'fill="#F1F5F9" stroke="#475569" stroke-width="2.5"/>' +
          '<path d="M60 60 Q95 44 130 62 M52 92 Q95 74 138 96 M60 124 Q95 108 130 126" stroke="#CBD5E1" stroke-width="2" fill="none"/>' +
          /* 혈관 */
          '<path d="M52 132 Q72 96 92 84 Q112 72 132 56" stroke="#DC2626" stroke-width="4.5" fill="none" stroke-linecap="round"/>' +
          inner +
          '<rect x="10" y="180" width="180" height="20" rx="10" fill="' + bc + '"/>' +
          '<text x="100" y="194" font-size="11" font-weight="800" fill="#fff" text-anchor="middle">' + badge + '</text>' +
          '<text x="95" y="12" font-size="12" font-weight="800" fill="#0D1117" text-anchor="middle">' + cap + '</text>' +
          '</svg>';
      }
      var clot = '<circle cx="92" cy="84" r="9" fill="#1F2937"/>';
      return flat('<div class="dzrow">' +
        head(clot + '<path d="M138 84 L106 84" stroke="#059669" stroke-width="3" stroke-dasharray="5 4" marker-end="url(#a1)"/>' +
             '<circle cx="92" cy="84" r="13" fill="none" stroke="#059669" stroke-width="2.5" stroke-dasharray="4 4"/>',
             '① 약으로 녹인다', '혈전용해 · 수술 아님', '#059669') +
        head(clot + '<path d="M168 150 Q130 120 104 90" stroke="#7C3AED" stroke-width="3.5" fill="none"/>' +
             '<circle cx="100" cy="87" r="6" fill="none" stroke="#7C3AED" stroke-width="3"/>',
             '② 관을 넣어 꺼낸다', '혈전제거 · 시술', '#7C3AED') +
        head(clot + '<path d="M64 34 A44 44 0 0 1 128 40" stroke="#1A56DB" stroke-width="5" fill="none" stroke-linecap="round"/>' +
             '<path d="M70 40 L120 46" stroke="#1A56DB" stroke-width="2" stroke-dasharray="4 3"/>',
             '③ 머리를 연다', '개두술 · 수술', '#1A56DB') +
        '</div>' +
        '<svg width="0" height="0"><defs><marker id="a1" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">' +
        '<path d="M0 0 L7 3.5 L0 7 Z" fill="#059669"/></marker></defs></svg>');
    }
  };

  /* ═══ 4. 배를 여는 세 가지 — 절개 크기가 다릅니다 ═══ */
  V.approach = {
    t: '배를 여는 세 가지 — 흉터와 회복이 다릅니다',
    d: '같은 장기를 떼어 내도 <b>어떻게 들어가느냐</b>가 다릅니다. 크게 열수록 회복이 길고, 작게 들어갈수록 값이 오릅니다. ' +
       '로봇은 <b>비급여인 경우가 많아</b> 정액 수술비가 나와도 사용료가 자부담으로 남습니다.',
    dz: ['cancer_major', 'surgery', 'cancer_female'],
    build: function () {
      function belly(marks, cap, cost, cc) {
        return '<svg viewBox="0 0 170 200" width="170" height="200">' +
          '<rect x="20" y="20" width="130" height="150" rx="30" fill="#FEF3C7" stroke="#D97706" stroke-width="2.5"/>' +
          '<ellipse cx="85" cy="96" rx="10" ry="12" fill="#FDE68A" stroke="#D97706" stroke-width="1.6"/>' +
          marks +
          '<text x="85" y="14" font-size="12" font-weight="800" fill="#0D1117" text-anchor="middle">' + cap + '</text>' +
          '<rect x="24" y="176" width="122" height="18" rx="9" fill="' + cc + '"/>' +
          '<text x="85" y="189" font-size="10.5" font-weight="800" fill="#fff" text-anchor="middle">' + cost + '</text>' +
          '</svg>';
      }
      return flat('<div class="dzrow">' +
        belly('<path d="M85 44 L85 148" stroke="#DC2626" stroke-width="5" stroke-linecap="round"/>',
              '개복', '크게 연다 · 회복 김', '#DC2626') +
        belly('<circle cx="60" cy="70" r="5" fill="#DC2626"/><circle cx="110" cy="70" r="5" fill="#DC2626"/>' +
              '<circle cx="85" cy="130" r="5" fill="#DC2626"/><circle cx="60" cy="120" r="5" fill="#DC2626"/>',
              '복강경', '구멍 몇 개 · 회복 빠름', '#D97706') +
        belly('<circle cx="58" cy="72" r="5" fill="#DC2626"/><circle cx="112" cy="72" r="5" fill="#DC2626"/>' +
              '<circle cx="85" cy="132" r="5" fill="#DC2626"/><circle cx="58" cy="118" r="5" fill="#DC2626"/>' +
              '<path d="M30 40 L58 66 M140 40 L112 66" stroke="#1A56DB" stroke-width="3" stroke-linecap="round"/>' +
              '<rect x="16" y="26" width="20" height="16" rx="4" fill="#1A56DB"/><rect x="134" y="26" width="20" height="16" rx="4" fill="#1A56DB"/>',
              '로봇', '비급여인 경우 많음', '#1A56DB') +
        '</div>');
    }
  };

  /* ═══ 5. 투석 — 몸 밖에 정수기를 답니다 ═══ */
  V.dialysis = {
    t: '투석은 몸 밖에 정수기를 다는 일입니다',
    d: '콩팥이 못 거르면 <b>팔의 굵은 혈관(동정맥루)</b>에서 피를 빼내 기계의 필터로 걸러 다시 넣습니다. ' +
       '보통 주 3회, 한 번에 서너 시간입니다. 일주일의 절반이 병원 일정이 되므로 <b>치료비보다 소득이 먼저 무너집니다.</b>',
    dz: ['kidney', 'chronic'],
    build: function () {
      return flat('<svg viewBox="0 0 620 230" width="620" height="230">' +
        /* 팔 */
        '<rect x="14" y="70" width="150" height="70" rx="34" fill="#FEF3C7" stroke="#D97706" stroke-width="2.5"/>' +
        '<path d="M30 106 L150 106" stroke="#DC2626" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M30 92 L150 92" stroke="#2563EB" stroke-width="5" stroke-linecap="round"/>' +
        '<circle cx="96" cy="100" r="15" fill="none" stroke="#7C3AED" stroke-width="3"/>' +
        '<text x="89" y="164" font-size="12" font-weight="800" fill="#0D1117">동정맥루(AVF)</text>' +
        '<text x="89" y="182" font-size="11" fill="#6B7280">동맥과 정맥을 이어 만든 굵은 혈관</text>' +
        /* 나가는 관 */
        '<path d="M164 112 Q210 112 240 112" stroke="#DC2626" stroke-width="7" fill="none" stroke-linecap="round"/>' +
        '<polygon points="240,104 258,112 240,120" fill="#DC2626"/>' +
        /* 필터 */
        '<rect x="262" y="52" width="96" height="128" rx="16" fill="#EFF4FF" stroke="#1A56DB" stroke-width="2.5"/>' +
        '<path d="M278 70 L278 162 M294 70 L294 162 M310 70 L310 162 M326 70 L326 162 M342 70 L342 162" ' +
        'stroke="#93C5FD" stroke-width="4" stroke-linecap="round"/>' +
        '<text x="310" y="44" font-size="12.5" font-weight="800" fill="#1A56DB" text-anchor="middle">투석기 · 필터</text>' +
        '<text x="310" y="200" font-size="11" fill="#6B7280" text-anchor="middle">노폐물과 물을 걸러 냅니다</text>' +
        /* 돌아오는 관 */
        '<path d="M358 92 Q420 92 448 92" stroke="#2563EB" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        '<path d="M448 92 L448 150 Q448 168 430 168 L180 168 Q164 168 164 150 L164 128" ' +
        'stroke="#2563EB" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        '<polygon points="156,128 172,128 164,112" fill="#2563EB"/>' +
        /* 시간 */
        '<rect x="470" y="60" width="136" height="112" rx="14" fill="#FEF2F2" stroke="#DC2626" stroke-width="2"/>' +
        '<text x="538" y="88" font-size="12" font-weight="800" fill="#DC2626" text-anchor="middle">주 3회 · 서너 시간</text>' +
        '<text x="538" y="112" font-size="11" fill="#4B5563" text-anchor="middle">월 · 수 · 금</text>' +
        '<text x="538" y="134" font-size="11" fill="#4B5563" text-anchor="middle">일주일의 절반이</text>' +
        '<text x="538" y="152" font-size="11" fill="#4B5563" text-anchor="middle">병원 일정이 됩니다</text>' +
        '</svg>');
    }
  };

  /* ═══ 6. 무릎 — 연골이 닳고, 관절면을 바꿔 끼웁니다 ═══ */
  V.joint = {
    t: '연골이 닳으면 관절면을 바꿔 끼웁니다',
    d: '무릎은 뼈와 뼈 사이에 <b>연골이라는 방석</b>이 있습니다. 이 방석이 닳아 없어지면 뼈끼리 부딪혀 아픕니다. ' +
       '인공관절 치환술은 뼈 끝을 다듬어 <b>금속·플라스틱 관절면으로 갈아 끼우는</b> 수술입니다.',
    dz: ['joint'],
    build: function () {
      function knee(gap, gapColor, impl, cap) {
        var s = '<svg viewBox="0 0 150 190" width="150" height="190">';
        s += '<path d="M46 16 Q75 8 104 16 L104 66 Q98 82 75 82 Q52 82 46 66 Z" fill="#F3F4F6" stroke="#6B7280" stroke-width="2.5"/>';
        s += '<path d="M46 ' + (86 + gap) + ' Q52 ' + (72 + gap) + ' 75 ' + (72 + gap) + ' Q98 ' + (72 + gap) + ' 104 ' + (86 + gap) +
             ' L104 158 Q75 166 46 158 Z" fill="#F3F4F6" stroke="#6B7280" stroke-width="2.5"/>';
        if (gap > 0) s += '<rect x="48" y="' + (74) + '" width="54" height="' + gap + '" rx="' + Math.min(6, gap) + '" fill="' + gapColor + '"/>';
        if (impl) {
          s += '<path d="M44 60 Q75 52 106 60 L106 76 Q75 84 44 76 Z" fill="#94A3B8" stroke="#334155" stroke-width="2"/>';
          s += '<rect x="46" y="86" width="58" height="12" rx="4" fill="#CBD5E1" stroke="#334155" stroke-width="2"/>';
          s += '<rect x="52" y="98" width="46" height="8" rx="3" fill="#94A3B8" stroke="#334155" stroke-width="1.6"/>';
        }
        s += '<text x="75" y="182" font-size="12" font-weight="800" fill="#0D1117" text-anchor="middle">' + cap + '</text>';
        s += '</svg>';
        return s;
      }
      return flat('<div class="dzrow">' +
        knee(14, '#34D399', 0, '정상 — 방석이 있다') +
        knee(6, '#FBBF24', 0, '닳는 중 — 아프기 시작') +
        knee(1, '#EF4444', 0, '뼈끼리 닿음 — 통증') +
        knee(12, '#CBD5E1', 1, '인공관절로 교체') +
        '</div>');
    }
  };

  /* ═══ 7. 치매 — 계단은 내려가기만 합니다 ═══ */
  V.dementia_step = {
    t: '계단은 내려가기만 합니다',
    d: '치매는 한 번에 오지 않고 <b>계단을 내려가듯</b> 진행합니다. 그리고 올라오지 않습니다. ' +
       '보험에서 중요한 것은 <b>몇 번째 계단부터 지급되는가</b> 입니다. 맨 아래 칸에서만 열리는 담보는 실제로 열리는 일이 드뭅니다.',
    dz: ['dementia'],
    build: function () {
      var steps = [
        ['경도인지장애', '깜빡깜빡 · 혼자 생활 가능', '#059669', '대개 담보 안 열림'],
        ['경증', '같은 말 되묻기 · 길 잃음', '#65A30D', '여기부터 열리는 담보인가?'],
        ['중등도', '옷 입기·씻기 도움 필요', '#D97706', '돌봄이 본격적으로 시작'],
        ['중증', '대부분 도움 필요', '#DC2626', '여기만 담는 담보는 늦다']
      ];
      var s = '<svg viewBox="0 0 660 300" width="660" height="300">';
      steps.forEach(function (st, i) {
        var x = 20 + i * 158, y = 40 + i * 56, w = 148, h = 300 - y - 20;
        s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12" fill="' + st[2] + '" opacity=".13" stroke="' + st[2] + '" stroke-width="2"/>';
        s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="30" rx="12" fill="' + st[2] + '"/>';
        s += '<text x="' + (x + w / 2) + '" y="' + (y + 20) + '" font-size="13" font-weight="800" fill="#fff" text-anchor="middle">' + st[0] + '</text>';
        s += '<text x="' + (x + 10) + '" y="' + (y + 52) + '" font-size="11" fill="#374151">' + st[1] + '</text>';
        s += '<text x="' + (x + 10) + '" y="' + (y + 76) + '" font-size="11" font-weight="800" fill="' + st[2] + '">' + st[3] + '</text>';
        if (i < 3) s += '<path d="M' + (x + w + 2) + ' ' + (y + 46) + ' L' + (x + w + 8) + ' ' + (y + 46) + '" stroke="#9CA3AF" stroke-width="2"/>';
      });
      s += '<text x="20" y="24" font-size="12" font-weight="800" fill="#6B7280">← 시간</text>';
      s += '</svg>';
      return flat(s);
    }
  };

  /* ═══ 8. 간 — 굳으면 되돌아오지 않습니다 ═══ */
  V.liver_step = {
    t: '간은 굳으면 되돌아오지 않습니다',
    d: '오랜 염증이 간을 굳게 만듭니다. <b>지방간·간염 단계에서는 되돌릴 여지가 있지만, 굳은 부분은 그대로입니다.</b> ' +
       '그리고 간경변이 있으면 간암 위험이 높아 정기적으로 검사를 받습니다.',
    dz: ['liver', 'chronic'],
    build: function () {
      function liver(fill, texture, cap, sub, cc) {
        var s = '<svg viewBox="0 0 160 175" width="160" height="175">';
        s += '<path d="M22 52 Q26 26 62 24 Q96 22 122 34 Q142 44 138 78 Q134 116 100 128 Q62 140 38 116 Q18 94 22 52 Z" ' +
             'fill="' + fill + '" stroke="#7C2D12" stroke-width="2.5"/>';
        s += texture;
        s += '<text x="80" y="150" font-size="12.5" font-weight="800" fill="#0D1117" text-anchor="middle">' + cap + '</text>';
        s += '<text x="80" y="168" font-size="10.5" fill="' + cc + '" text-anchor="middle" font-weight="700">' + sub + '</text>';
        s += '</svg>';
        return s;
      }
      return flat('<div class="dzrow">' +
        liver('#F87171', '', '정상', '매끈합니다', '#059669') +
        liver('#FCD34D', '<circle cx="60" cy="62" r="5" fill="#FDE68A"/><circle cx="92" cy="80" r="6" fill="#FDE68A"/><circle cx="72" cy="98" r="4" fill="#FDE68A"/>',
              '지방간', '아직 되돌릴 여지', '#65A30D') +
        liver('#C084FC', '<path d="M40 60 L120 74 M36 84 L112 96 M46 104 L104 114" stroke="#7E22CE" stroke-width="2.5"/>',
              '섬유화', '굳기 시작', '#D97706') +
        liver('#9CA3AF', '<circle cx="54" cy="58" r="9" fill="#6B7280"/><circle cx="86" cy="70" r="11" fill="#6B7280"/>' +
              '<circle cx="66" cy="96" r="10" fill="#6B7280"/><circle cx="104" cy="98" r="8" fill="#6B7280"/>',
              '간경변', '되돌아오지 않음', '#DC2626') +
        '</div>');
    }
  };

  /* ═══ 9. 진단비와 치료비는 다른 지갑입니다 ═══ */
  V.wallets = {
    t: '한 사건, 여러 지갑',
    d: '고객은 「암보험 있어요」 라고 말하지만, 실제로는 <b>지갑이 여러 개</b> 열립니다. ' +
       '진단만으로 열리는 지갑, 치료를 받아야 열리는 지갑, 쓴 만큼만 돌려주는 지갑이 서로 다릅니다. ' +
       '하나가 비어 있으면 그 자리는 그대로 본인 몫입니다.',
    dz: ['cancer_major', 'cancer_blood', 'stroke', 'mi'],
    build: function () {
      var W = [
        ['진단비', '확진되면 한 번', '#1A56DB', '치료 방법을 고를 수 있게'],
        ['수술·시술비', '수술을 받으면', '#7C3AED', '시술은 인정이 갈립니다'],
        ['치료비', '치료를 받을 때마다', '#059669', '표적·면역은 여기'],
        ['입원일당', '입원한 날짜만큼', '#D97706', '한도일수를 봅니다'],
        ['실손', '쓴 만큼 돌려받음', '#0891B2', '세대가 부담을 가릅니다']
      ];
      var s = '<svg viewBox="0 0 660 210" width="660" height="210">';
      s += '<rect x="14" y="14" width="632" height="40" rx="12" fill="#0F172A"/>';
      s += '<text x="330" y="40" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">한 번의 진단 · 한 번의 입원</text>';
      W.forEach(function (w, i) {
        var x = 14 + i * 128;
        s += '<path d="M330 54 L' + (x + 56) + ' 84" stroke="' + w[2] + '" stroke-width="2.5" opacity=".6"/>';
        s += '<rect x="' + x + '" y="84" width="112" height="112" rx="14" fill="' + w[2] + '" opacity=".12" stroke="' + w[2] + '" stroke-width="2"/>';
        s += '<rect x="' + x + '" y="84" width="112" height="28" rx="12" fill="' + w[2] + '"/>';
        s += '<text x="' + (x + 56) + '" y="103" font-size="12.5" font-weight="800" fill="#fff" text-anchor="middle">' + w[0] + '</text>';
        s += '<text x="' + (x + 56) + '" y="132" font-size="11" fill="#374151" text-anchor="middle">' + w[1] + '</text>';
        s += '<text x="' + (x + 56) + '" y="164" font-size="10.5" fill="#6B7280" text-anchor="middle">' + w[3].slice(0, 10) + '</text>';
        s += '<text x="' + (x + 56) + '" y="180" font-size="10.5" fill="#6B7280" text-anchor="middle">' + w[3].slice(10) + '</text>';
      });
      s += '</svg>';
      return flat(s);
    }
  };

  /* ═══ 10. 같은 「암」인데 칸이 둘입니다 ═══ */
  V.minor_cancer = {
    t: '같은 「암」인데 칸이 둘입니다',
    d: '진단서에 암이라고 적혀 있어도 보험은 <b>두 칸</b>으로 나눠 놓았습니다. 갑상선암·제자리암·경계성종양은 유사암 칸에 들어가 ' +
       '일반암의 10~20% 가 통상입니다. 이 그림을 <b>가입할 때</b> 보여 드리면, 나중에 항의가 아니라 이해가 됩니다.',
    dz: ['thyroid', 'cancer_female'],
    build: function () {
      var s = '<svg viewBox="0 0 620 240" width="620" height="240">';
      s += '<rect x="16" y="16" width="588" height="36" rx="12" fill="#0F172A"/>';
      s += '<text x="310" y="41" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">진단서에 적힌 말 — 「암」</text>';
      /* 왼쪽 일반암 */
      s += '<path d="M310 52 L180 86" stroke="#1A56DB" stroke-width="3"/>';
      s += '<rect x="30" y="86" width="272" height="132" rx="16" fill="#EFF4FF" stroke="#1A56DB" stroke-width="2.5"/>';
      s += '<rect x="30" y="86" width="272" height="32" rx="14" fill="#1A56DB"/>';
      s += '<text x="166" y="108" font-size="13.5" font-weight="800" fill="#fff" text-anchor="middle">일반암 칸</text>';
      s += '<text x="46" y="140" font-size="12" fill="#374151">위·폐·간·췌·대장·유방 등</text>';
      s += '<text x="46" y="164" font-size="12" fill="#374151">가입금액 그대로 지급</text>';
      s += '<rect x="46" y="176" width="240" height="28" rx="8" fill="#1A56DB" opacity=".16"/>';
      s += '<text x="166" y="195" font-size="13" font-weight="800" fill="#1A56DB" text-anchor="middle">예: 5,000만 → 5,000만</text>';
      /* 오른쪽 유사암 */
      s += '<path d="M310 52 L452 86" stroke="#D97706" stroke-width="3"/>';
      s += '<rect x="318" y="86" width="286" height="132" rx="16" fill="#FFFBEB" stroke="#D97706" stroke-width="2.5"/>';
      s += '<rect x="318" y="86" width="286" height="32" rx="14" fill="#D97706"/>';
      s += '<text x="461" y="108" font-size="13.5" font-weight="800" fill="#fff" text-anchor="middle">유사암 칸 (소액암)</text>';
      s += '<text x="334" y="140" font-size="12" fill="#374151">갑상선암 · 제자리암 · 경계성종양</text>';
      s += '<text x="334" y="164" font-size="12" fill="#374151">일반암의 10~20% 가 통상</text>';
      s += '<rect x="334" y="176" width="254" height="28" rx="8" fill="#D97706" opacity=".18"/>';
      s += '<text x="461" y="195" font-size="13" font-weight="800" fill="#B45309" text-anchor="middle">예: 5,000만 → 500만 수준</text>';
      s += '<text x="310" y="234" font-size="11" fill="#6B7280" text-anchor="middle">금액은 구조를 보여 주는 예시입니다 — 실제 비율과 지급은 가입한 약관이 정합니다</text>';
      s += '</svg>';
      return flat(s);
    }
  };

  /* ── 바깥에 내주는 문 ─────────────────────────────────────── */
  /* 목록을 손으로 적어 두었더니 <b>V 와 쌍둥이</b>가 됐다. 그림을 새로 그리고
     목록에 안 넣으면 조용히 사라진다 — 실제로 심장 그림 두 장을 그려 놓고
     한나절 못 찾았다. 그래서 <b>V 가 곧 목록</b>이다. 차례는 적어 놓은 차례. */
  var KEYS = Object.keys(V);
  window.DZ_VIZ = {
    keys: KEYS,
    /* 손으로 그린 도해입니다 — 어디에 쓰든 이 말을 함께 답니다 */
    note: '손으로 <b>직접 그린 그림</b>입니다 — 사진이 아닙니다. 층의 차례와 관계를 보여 주는 그림이라 실제 두께·비율과 다르며, 진단이나 치료를 대신하지 않습니다.',
    get: function (k) {
      var v = V[k];
      if (!v) return null;
      return { k: k, t: v.t, d: v.d, dz: v.dz, html: v.build() };
    },
    /* 이 질병에 붙는 도해들 */
    forDz: function (id) {
      var out = [], i;
      for (i = 0; i < KEYS.length; i++) {
        if (V[KEYS[i]].dz.indexOf(id) >= 0) out.push(window.DZ_VIZ.get(KEYS[i]));
      }
      return out;
    },
    /* 확대해서 들여다보기 — 화면에 붙인 뒤 한 번 불러 준다.
       조직은 돌려 보는 것이 아니라 들여다보는 것이다.
         · 끌면 옮겨지고
         · + − 로, 두 손가락으로, 두 번 눌러 크게 보고
         · 이름표를 끄면 고객 앞에서 하나씩 짚을 수 있다               */
    bind: function (root) {
      var list = (root || document).querySelectorAll('.dzart');
      Array.prototype.forEach.call(list, function (el) {
        if (el._bound) return;
        el._bound = true;
        var svg = el.querySelector('svg');
        var view = el.querySelector('.dzart-view');
        if (!svg || !view) return;

        var b = (el.getAttribute('data-vb') || '0 0 1000 560').split(/\s+/);
        var B = { x: +b[0], y: +b[1], w: +b[2], h: +b[3] };
        var V0 = { x: B.x, y: B.y, w: B.w, h: B.h };

        function apply() {
          svg.setAttribute('viewBox', V0.x.toFixed(1) + ' ' + V0.y.toFixed(1) + ' ' +
            V0.w.toFixed(1) + ' ' + V0.h.toFixed(1));
        }
        /* (px,py) 는 상자 안의 비율(0~1). 그 점을 붙잡은 채 크기만 바꾼다 */
        function zoom(f, px, py) {
          var nw = V0.w / f, nh = V0.h / f;
          if (nw > B.w) { nw = B.w; nh = B.h; }
          if (nw < B.w / 8) { nw = B.w / 8; nh = B.h / 8; }
          if (px == null) { px = 0.5; py = 0.5; }
          V0.x += (V0.w - nw) * px;
          V0.y += (V0.h - nh) * py;
          V0.w = nw; V0.h = nh;
          clamp(); apply();
        }
        function clamp() {
          if (V0.x < B.x) V0.x = B.x;
          if (V0.y < B.y) V0.y = B.y;
          if (V0.x + V0.w > B.x + B.w) V0.x = B.x + B.w - V0.w;
          if (V0.y + V0.h > B.y + B.h) V0.y = B.y + B.h - V0.h;
        }
        function at(e) {
          var r = view.getBoundingClientRect();
          return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
        }

        /* 단추 */
        Array.prototype.forEach.call(el.querySelectorAll('.dzart-b'), function (btn) {
          btn.addEventListener('click', function (ev) {
            ev.stopPropagation();
            var act = btn.getAttribute('data-act');
            if (act === 'in') zoom(1.5);
            else if (act === 'out') zoom(1 / 1.5);
            else if (act === 'reset') { V0 = { x: B.x, y: B.y, w: B.w, h: B.h }; apply(); }
            else if (act === 'label') {
              el.classList.toggle('nolbl');
              var off = el.classList.contains('nolbl');
              btn.textContent = off ? '이름표 켜기' : '이름표 끄기';
              btn.className = 'dzart-b' + (off ? '' : ' on');
            }
          });
        });

        /* 끌어서 옮기기 */
        var on = false, lx = 0, ly = 0;
        function down(x, y) { on = true; lx = x; ly = y; el.classList.add('dragging'); }
        function move(x, y) {
          if (!on) return;
          var r = view.getBoundingClientRect();
          V0.x -= (x - lx) * (V0.w / r.width);
          V0.y -= (y - ly) * (V0.h / r.height);
          lx = x; ly = y; clamp(); apply();
        }
        function up() { on = false; el.classList.remove('dragging'); }
        view.addEventListener('mousedown', function (e) { down(e.clientX, e.clientY); e.preventDefault(); });
        window.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); });
        window.addEventListener('mouseup', up);

        /* 두 번 누르면 그 자리를 크게 */
        view.addEventListener('dblclick', function (e) { var p = at(e); zoom(1.8, p.x, p.y); });

        /* 휠은 <b>Ctrl 과 함께일 때만</b> 크기를 바꾼다 — 안 그러면 화면이 안 내려간다.
           트랙패드에서 손가락을 오므리면 브라우저가 ctrl+휠로 보내 준다. */
        view.addEventListener('wheel', function (e) {
          if (!e.ctrlKey && !e.metaKey) return;
          e.preventDefault();
          var p = at(e);
          zoom(e.deltaY < 0 ? 1.18 : 1 / 1.18, p.x, p.y);
        }, { passive: false });

        /* 손가락 — 하나면 옮기고, 둘이면 오므려 크게 */
        var pinch = 0;
        function dist(t) {
          var dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY;
          return Math.sqrt(dx * dx + dy * dy);
        }
        view.addEventListener('touchstart', function (e) {
          if (e.touches.length === 1) down(e.touches[0].clientX, e.touches[0].clientY);
          else if (e.touches.length === 2) { on = false; pinch = dist(e.touches); }
        }, { passive: true });
        view.addEventListener('touchmove', function (e) {
          if (e.touches.length === 2 && pinch) {
            var d = dist(e.touches);
            if (d > 0) { zoom(d / pinch, 0.5, 0.5); pinch = d; }
            e.preventDefault();
          } else if (e.touches.length === 1 && on) {
            move(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
          }
        }, { passive: false });
        view.addEventListener('touchend', function () { pinch = 0; up(); });

        apply();
      });
    }
  };
})();
