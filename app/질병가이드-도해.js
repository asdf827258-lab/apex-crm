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
  function note(x, y, t, color) {
    return '<g class="lbl"><rect x="' + x + '" y="' + (y - 15) + '" width="' + (t.length * 8.2 + 18) +
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
  var KEYS = ['skin_cross', 'skin_cancer', 'cancer_invade', 'wall_layer', 'wall_invade',
              'artery_cross', 'artery_rupture', 'vessel', 'minor_cancer', 'brain_open',
              'approach', 'dialysis', 'joint', 'dementia_step', 'liver_step', 'wallets'];
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
