/* ════════════════════════════════════════════════════════════════
   B·C·D 영업 강의 — 장면 그림 (판 X186 → 판 X198 · 2026-10-26 다시 그림)

   사장님 말씀 — 「그림이 너무 허접하고 말투가 강의가 없어 그리고 상상하게끔 하는 장도 없고」.
   X186 의 그림은 네모 · 동그라미를 붙여 만든 사람과 공 같은 나무였습니다. 다시 그립니다 —
   ① 땅은 <b>겹겹의 능선</b>입니다. 같은 씨에서 나온 잡음(fbm)으로 산 · 언덕의 실루엣을 만들고,
      멀수록 하늘빛에 묻히게(대기 원근) 칠하고, 능선 사이에 안개를 깝니다.
   ② 빛은 <b>번짐 · 빛줄기 · 테두리 빛</b>으로 그립니다 — 해를 등진 사람의 가장자리에 빛이 맺힙니다.
   ③ 사람은 <b>뼈대에서</b> 그립니다. 머리 · 목 · 어깨 · 팔꿈치 · 손목 · 엉덩이 · 무릎 · 발목을 먼저 놓고,
      굵기가 줄어드는 팔다리와 곡선 몸통 · 옷 · 머리칼을 입힙니다. 7.5 등신, 아이는 5 등신,
      어르신은 등이 굽고 지팡이를 짚습니다. 손을 잡는 팔은 손이 닿는 자리를 거꾸로 풀어(IK) 굽힙니다.

   ★ 전부 <b>직접 그린 SVG</b> 입니다 — 남의 사진 · 삽화를 옮기지 않습니다 (CLAUDE.md 9번).
   ★ 그림 안에는 <b>숫자를 적지 않습니다</b> (1번). 사람은 실루엣이라 누구도 특정하지 않습니다 (3번).
   ★ 모든 모양은 화면(1600×900) 안에 둡니다 — 덱의 넘침 점검이 그 밖을 넘침으로 셉니다.
   ★ 같은 씨에서 늘 같은 그림 — 「한눈에」 와 발표 · 인쇄가 같은 선으로 섭니다.
   ★ id 는 장 하나에 한 벌입니다. 「한눈에」 가 여러 장을 한꺼번에 그릴 때는 덱이 id 에 꼬리를 붙입니다.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var W = 1600, H = 900;

  /* ── 수 · 씨 ─────────────────────────────────────────────────── */
  function r1(v) { return Math.round(v * 10) / 10; }
  function r3(v) { return Math.round(v * 1000) / 1000; }
  function rnd(seed) { var s = seed * 7919 % 233280; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hex(c) { c = c.replace('#', ''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
  function mix(a, b, t) {
    var x = hex(a), y = hex(b);
    return '#' + [0, 1, 2].map(function (i) { var v = Math.round(lerp(x[i], y[i], t)); return (v < 16 ? '0' : '') + v.toString(16); }).join('');
  }
  /* 매끈한 1차원 잡음 — 씨마다 같은 줄 */
  function noise(seed) {
    var r = rnd(seed), p = [];
    for (var i = 0; i < 256; i++) p.push(r() * 2 - 1);
    return function (x) {
      var i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f);
      return lerp(p[((i % 256) + 256) % 256], p[(((i + 1) % 256) + 256) % 256], t);
    };
  }
  function fbm(n, x, oct) {
    var s = 0, a = 1, f = 1, m = 0;
    for (var i = 0; i < oct; i++) { s += a * n(x * f); m += a; a *= 0.5; f *= 2.03; }
    return s / m;
  }

  /* ── 모양 ────────────────────────────────────────────────────── */
  function line(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + r1(p[0]) + ' ' + r1(p[1]); }).join(''); }
  /* 지나는 점들을 매끈한 곡선으로 (Catmull-Rom → 3차 베지에) */
  function smooth(pts, closed, k) {
    k = k == null ? 1 : k;
    var n = pts.length, d = 'M' + r3(pts[0][0]) + ' ' + r3(pts[0][1]);
    var P = function (i) { return closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; };
    for (var i = 0; i < (closed ? n : n - 1); i++) {
      var p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      d += 'C' + r3(p1[0] + (p2[0] - p0[0]) / 6 * k) + ' ' + r3(p1[1] + (p2[1] - p0[1]) / 6 * k) + ' ' +
        r3(p2[0] - (p3[0] - p1[0]) / 6 * k) + ' ' + r3(p2[1] - (p3[1] - p1[1]) / 6 * k) + ' ' + r3(p2[0]) + ' ' + r3(p2[1]);
    }
    return d + (closed ? 'Z' : '');
  }
  function svg(id, body, defs) {
    return '<svg class="art art-' + id + '" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs>' + (defs || '') + '</defs>' + body + '</svg>';
  }
  function stops(s) { return s.map(function (x) { return '<stop offset="' + x[0] + '" stop-color="' + x[1] + '"' + (x[2] != null ? ' stop-opacity="' + x[2] + '"' : '') + '/>'; }).join(''); }
  function lin(id, s, x1, y1, x2, y2) {
    return '<linearGradient id="' + id + '" x1="' + (x1 || 0) + '" y1="' + (y1 || 0) + '" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '">' + stops(s) + '</linearGradient>';
  }
  function rad(id, s, cx, cy, r, fx, fy) {
    return '<radialGradient id="' + id + '" cx="' + (cx == null ? 0.5 : cx) + '" cy="' + (cy == null ? 0.5 : cy) + '" r="' + (r == null ? 0.5 : r) + '"' +
      (fx != null ? ' fx="' + fx + '" fy="' + fy + '"' : '') + '>' + stops(s) + '</radialGradient>';
  }
  function blur(id, sd) { return '<filter id="' + id + '" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="' + sd + '"/></filter>'; }

  /* ── 하늘 · 해 · 별 · 구름 · 빛줄기 ─────────────────────────────── */
  function sky(p, s) { return lin(p + 'sky', s) ; }
  function sun(p, cx, cy, r, core, glow, bloom) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + (bloom || r * 9) + '" fill="url(#' + p + 'bloom)"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r * 2.6 + '" fill="url(#' + p + 'glow)"/>' +
      '<circle class="sunCore" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + core + '"/>';
  }
  function sunDefs(p, glow) {
    return rad(p + 'bloom', [[0, glow, 0.55], [0.25, glow, 0.22], [1, glow, 0]]) + rad(p + 'glow', [[0, '#FFFFFF', 0.9], [0.4, glow, 0.6], [1, glow, 0]]);
  }
  function stars(seed, n, y1, op) {
    var r = rnd(seed), o = '';
    for (var i = 0; i < n; i++) {
      var b = r();
      o += '<circle cx="' + r1(r() * W) + '" cy="' + r1(Math.pow(r(), 1.4) * y1) + '" r="' + r1(0.5 + b * b * 1.9) + '" fill="#fff" opacity="' + (op * (0.25 + r() * 0.75)).toFixed(2) + '"/>';
    }
    return '<g class="twinkle">' + o + '</g>';
  }
  /* 노을 구름 — 길게 누운 타원 묶음을 흐려 결이 남게 */
  function clouds(p, seed, n, y0, y1, top, bot, op) {
    var r = rnd(seed), o = '';
    for (var i = 0; i < n; i++) {
      var cx = r() * W, cy = lerp(y0, y1, r()), rx = 60 + r() * 240, ry = 6 + r() * 18 * (1 - (cy - y0) / (y1 - y0 + 1) * 0.5);
      /* 한 덩이 = 길게 누운 타원 서넛 — 아랫면은 평평하고 윗면이 부풂 */
      for (var k = 0; k < 3; k++) {
        var ox = (r() - 0.5) * rx * 0.9, w = rx * (0.35 + r() * 0.5), hh = ry * (0.6 + r() * 0.8);
        o += '<ellipse cx="' + r1(cx + ox) + '" cy="' + r1(cy - hh * 0.4) + '" rx="' + r1(w) + '" ry="' + r1(hh) + '" fill="url(#' + p + 'cl)" opacity="' + (op * (0.3 + r() * 0.6)).toFixed(2) + '"/>';
      }
    }
    return { defs: lin(p + 'cl', [[0, top], [1, bot]]) +
      '<filter id="' + p + 'cb" x="-20%" y="-60%" width="140%" height="220%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.03" numOctaves="4" seed="' + seed + '"/>' +
      '<feDisplacementMap in="SourceGraphic" scale="46" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="2.2"/></filter>',
      body: '<g class="clouds" filter="url(#' + p + 'cb)">' + o + '</g>' };
  }
  function rays(p, cx, cy, n, len, a0, a1, color, op, seed) {
    var r = rnd(seed || 5), o = '';
    for (var i = 0; i < n; i++) {
      var a = lerp(a0, a1, (i + r() * 0.6) / n) * Math.PI / 180, w = (0.012 + r() * 0.03);
      var x1 = cx + Math.cos(a - w) * len, y1 = cy + Math.sin(a - w) * len, x2 = cx + Math.cos(a + w) * len, y2 = cy + Math.sin(a + w) * len;
      o += '<path d="M' + cx + ' ' + cy + 'L' + r1(x1) + ' ' + r1(y1) + 'L' + r1(x2) + ' ' + r1(y2) + 'Z" opacity="' + (0.35 + r() * 0.65).toFixed(2) + '"/>';
    }
    return { defs: rad(p + 'ry', [[0, color, op], [0.6, color, op * 0.35], [1, color, 0]], cx / W, cy / H, 0.9) + blur(p + 'rb', 8),
      body: '<g class="rays" fill="url(#' + p + 'ry)" filter="url(#' + p + 'rb)" style="mix-blend-mode:screen">' + o + '</g>' };
  }
  /* 떠다니는 먼지 · 반딧불 · 씨앗 */
  function motes(seed, n, x0, x1, y0, y1, color, rmax, op) {
    var r = rnd(seed), o = '';
    for (var i = 0; i < n; i++) o += '<circle cx="' + r1(lerp(x0, x1, r())) + '" cy="' + r1(lerp(y0, y1, r())) + '" r="' + r1(0.6 + r() * rmax) + '" fill="' + color + '" opacity="' + (op * (0.3 + r() * 0.7)).toFixed(2) + '"/>';
    return '<g class="dust">' + o + '</g>';
  }

  /* ── 땅 — 겹겹의 능선과 안개 ─────────────────────────────────── */
  /* y 는 능선의 평균 높이 · amp 는 굴곡 · freq 는 화면 너비에 들어가는 산의 수 · sharp 가 크면 뾰족 */
  function ridge(seed, y, amp, freq, sharp, oct) {
    var n = noise(seed), pts = [[0, H]];
    for (var x = 0; x <= W; x += 10) {
      var v = Math.max(0, Math.min(1, (fbm(n, x / W * freq + seed * 0.37, oct || 5) * 0.5 + 0.3) / 0.6));
      v = Math.pow(v, sharp || 1);
      pts.push([x, y - amp * v]);
    }
    pts.push([W, H]);
    return line(pts) + 'Z';
  }
  function ridgeY(seed, y, amp, freq, sharp, oct, x) {
    var n = noise(seed), v = Math.max(0, Math.min(1, (fbm(n, x / W * freq + seed * 0.37, oct || 5) * 0.5 + 0.3) / 0.6));
    return y - amp * Math.pow(v, sharp || 1);
  }
  /* L = [{seed,y,amp,freq,sharp,color}] 먼 것부터 · fog 는 능선 아래에 깔리는 안개 빛 */
  function range(p, L, fog, fogOp) {
    var d = lin(p + 'fog', [[0, fog, 0], [0.55, fog, fogOp == null ? 0.5 : fogOp], [0.8, fog, (fogOp == null ? 0.5 : fogOp) * 0.4], [1, fog, 0]]), o = '';
    L.forEach(function (l, i) {
      o += '<path d="' + ridge(l.seed, l.y, l.amp, l.freq, l.sharp, l.oct) + '" fill="' + l.color + '"/>';
      if (i < L.length - 1 && l.fog !== false) o += '<rect x="0" y="' + r1(l.y - (l.fh || 90) * 0.75) + '" width="' + W + '" height="' + r1((l.fh || 90) * 1.5) + '" fill="url(#' + p + 'fog)"/>';
    });
    return { defs: d, body: o };
  }
  /* 풀잎 — 땅 윗선(ridge 와 같은 씨)을 따라 */
  function grass(seed, L, n, color, hmin, hmax, lean) {
    var r = rnd(seed * 3 + 1), o = '';
    for (var i = 0; i < n; i++) {
      var x = r() * W, y = ridgeY(L.seed, L.y, L.amp, L.freq, L.sharp, L.oct, x) + 2, h = lerp(hmin, hmax, r()), b = (lean || 0) + (r() - 0.5) * 10;
      o += 'M' + r1(x - 1.4) + ' ' + r1(y) + 'Q' + r1(x + b * 0.4) + ' ' + r1(y - h * 0.6) + ' ' + r1(x + b) + ' ' + r1(y - h) + 'Q' + r1(x + b * 0.4 + 1) + ' ' + r1(y - h * 0.6) + ' ' + r1(x + 1.4) + ' ' + r1(y) + 'Z';
    }
    return '<path d="' + o + '" fill="' + color + '"/>';
  }

  /* ── 나무 ────────────────────────────────────────────────────── */
  /* 활엽수 — 가지가 갈라지고, 잎 덩어리가 가지 끝에 모입니다 */
  function tree(seed, x, y, h, color, lean) {
    var r = rnd(seed), br = '', blobs = [];
    function grow(x0, y0, len, ang, w, depth) {
      var x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
      var mx = (x0 + x1) / 2 + (r() - 0.5) * len * 0.25, my = (y0 + y1) / 2;
      br += '<path d="M' + r1(x0) + ' ' + r1(y0) + 'Q' + r1(mx) + ' ' + r1(my) + ' ' + r1(x1) + ' ' + r1(y1) + '" stroke-width="' + r1(w) + '"/>';
      if (depth <= 0 || len < h * 0.05) { blobs.push([x1, y1, h * (0.07 + r() * 0.05)]); return; }
      if (depth === 1) blobs.push([x1, y1, h * (0.06 + r() * 0.04)]);
      var k = 2 + (r() > 0.6 ? 1 : 0);
      for (var i = 0; i < k; i++) grow(x1, y1, len * (0.62 + r() * 0.2), ang + (i - (k - 1) / 2) * (0.5 + r() * 0.35) + (r() - 0.5) * 0.3, w * 0.62, depth - 1);
    }
    grow(x, y, h * 0.34, -Math.PI / 2 + (lean || 0), h * 0.06, 4);
    br += '<path d="M' + r1(x - h * 0.06) + ' ' + r1(y) + 'Q' + r1(x - h * 0.02) + ' ' + r1(y - h * 0.03) + ' ' + r1(x - h * 0.02) + ' ' + r1(y - h * 0.1) + 'L' + r1(x + h * 0.02) + ' ' + r1(y - h * 0.1) + 'Q' + r1(x + h * 0.02) + ' ' + r1(y - h * 0.03) + ' ' + r1(x + h * 0.06) + ' ' + r1(y) + 'Z" fill="' + color + '" stroke="none"/>';
    var cv = '';
    blobs.forEach(function (b) {
      /* 잎 덩이 — 가운데는 빽빽, 가장자리는 잔잎이 흩어져 하늘이 비칩니다 */
      for (var j = 0; j < 7; j++) {
        var a = r() * Math.PI * 2, d = Math.sqrt(r()) * b[2] * 0.85;
        cv += '<circle cx="' + r1(b[0] + Math.cos(a) * d) + '" cy="' + r1(b[1] + Math.sin(a) * d * 0.7) + '" r="' + r1(b[2] * (0.22 + r() * 0.28)) + '"/>';
      }
      for (var q = 0; q < 16; q++) {
        var a2 = r() * Math.PI * 2, d2 = b[2] * (0.7 + r() * 0.55);
        cv += '<circle cx="' + r1(b[0] + Math.cos(a2) * d2) + '" cy="' + r1(b[1] + Math.sin(a2) * d2 * 0.7) + '" r="' + r1(h * (0.006 + r() * 0.012)) + '"/>';
      }
    });
    return '<g fill="' + color + '"><g stroke="' + color + '" stroke-linecap="round" fill="none">' + br + '</g>' + cv + '</g>';
  }
  /* 침엽수 — 들쭉날쭉한 층 */
  function pine(seed, x, y, h, color) {
    var r = rnd(seed), L = [], R = [], n = 9;
    for (var i = 0; i <= n; i++) {
      var t = i / n, yy = y - h * 0.1 - t * h * 0.9, w = h * 0.24 * (1 - t) * (0.75 + r() * 0.5);
      L.push([x - w, yy + h * 0.035]); L.push([x - w * 0.45, yy]);
      R.push([x + w * 0.45, yy]); R.push([x + w, yy + h * 0.035]);
    }
    var pts = [[x - h * 0.02, y]].concat(L, [[x, y - h]], R.reverse(), [[x + h * 0.02, y]]);
    return '<path d="' + line(pts) + 'Z" fill="' + color + '"/>';
  }

  /* ════════════════════════════════════════════════════════════════
     사람 — 뼈대에서 그립니다
     단위: 키 = 1, 발바닥 = y 0, 위가 음수, 얼굴은 +x 쪽(옆모습). 앞모습(front)은 좌우 대칭.
     ════════════════════════════════════════════════════════════════ */
  function cap(a, b, ra, rb) {
    var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy) || 1e-6, nx = -dy / L, ny = dx / L;
    return 'M' + r3(a[0] + nx * ra) + ' ' + r3(a[1] + ny * ra) + 'L' + r3(b[0] + nx * rb) + ' ' + r3(b[1] + ny * rb) +
      'A' + r3(rb) + ' ' + r3(rb) + ' 0 0 0 ' + r3(b[0] - nx * rb) + ' ' + r3(b[1] - ny * rb) +
      'L' + r3(a[0] - nx * ra) + ' ' + r3(a[1] - ny * ra) + 'A' + r3(ra) + ' ' + r3(ra) + ' 0 0 0 ' + r3(a[0] + nx * ra) + ' ' + r3(a[1] + ny * ra) + 'Z';
  }
  function ell(c, rx, ry, rot) { return '<ellipse cx="' + r3(c[0]) + '" cy="' + r3(c[1]) + '" rx="' + r3(rx) + '" ry="' + r3(ry) + '"' + (rot ? ' transform="rotate(' + r1(rot) + ' ' + r3(c[0]) + ' ' + r3(c[1]) + ')"' : '') + '/>'; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  /* 두 마디 팔다리를 끝점에 맞춰 굽힘(IK) — bend 가 +1 이면 팔꿈치가 뒤(−x)로 */
  function ik(a, t, l1, l2, bend) {
    var dx = t[0] - a[0], dy = t[1] - a[1], d = Math.min(Math.sqrt(dx * dx + dy * dy), l1 + l2 - 1e-4);
    var base = Math.atan2(dy, dx), cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), A = Math.acos(Math.max(-1, Math.min(1, cosA)));
    var ang = base + (bend || 1) * A;
    var e = [a[0] + Math.cos(ang) * l1, a[1] + Math.sin(ang) * l1];
    var ex = t[0] - e[0], ey = t[1] - e[1], el = Math.sqrt(ex * ex + ey * ey) || 1;
    return [e, [e[0] + ex / el * l2, e[1] + ey / el * l2]];
  }

  /* 머리 — 옆모습: 뒤통수는 둥글고, 이마 · 코 · 턱이 앞으로. k 는 크기(아이는 큼) */
  function headSide(c, k, tilt) {
    var P = [[0.0, -0.068], [-0.042, -0.055], [-0.058, -0.016], [-0.052, 0.022], [-0.034, 0.048], [-0.008, 0.056], [0.02, 0.066], [0.04, 0.064],
      [0.047, 0.044], [0.05, 0.026], [0.058, 0.01], [0.052, -0.012], [0.052, -0.036], [0.034, -0.06]];
    return '<path transform="translate(' + r3(c[0]) + ' ' + r3(c[1]) + ') rotate(' + r1(tilt) + ') scale(' + k + ')" d="' + smooth(P, true, 0.9) + '"/>';
  }
  function headFront(c, k, tilt) {
    var P = [[0, -0.07], [-0.044, -0.056], [-0.054, -0.016], [-0.05, 0.022], [-0.034, 0.052], [0, 0.068], [0.034, 0.052], [0.05, 0.022], [0.054, -0.016], [0.044, -0.056]];
    return '<path transform="translate(' + r3(c[0]) + ' ' + r3(c[1]) + ') rotate(' + r1(tilt) + ') scale(' + k + ')" d="' + smooth(P, true, 0.9) + '"/>' +
      ell([c[0] - 0.054 * k, c[1] + 0.004], 0.01 * k, 0.017 * k) + ell([c[0] + 0.054 * k, c[1] + 0.004], 0.01 * k, 0.017 * k);
  }
  /* 옆모습 몸 — j: 관절들 · o: 옷 */
  function sideBody(j, o) {
    var s = '';
    var sh = j.sh, hp = j.hip, ax = sh[0] - hp[0], ay = sh[1] - hp[1], L = Math.sqrt(ax * ax + ay * ay), ux = ax / L, uy = ay / L, nx = -uy, ny = ux;
    /* 몸통 — 어깨에서 엉덩이까지 앞 · 뒤 윤곽 (nx 가 +x 쪽 = 가슴) */
    var at = function (t, w) { return [hp[0] + ax * t + nx * w * -1, hp[1] + ay * t + ny * w * -1]; };
    var k = j.child ? 0.8 : 1, bel = j.belly || 0;
    var front = [at(1.06, -0.04 * k), at(0.86, -0.07 * k), at(0.62, -(0.064 + bel) * k), at(0.3, -(0.058 + bel * 0.6) * k), at(0.0, -0.062 * k)];
    var back = [at(-0.04, 0.075 * k), at(0.22, 0.062 * k), at(0.52, 0.058 * k), at(0.82, 0.068 * k), at(1.04, 0.052 * k)];
    if (j.hunch) back[3] = at(0.85, (0.058 + j.hunch) * k);
    s += '<path d="' + smooth(front.concat(back), true, 0.9) + '"/>';
    /* 목 · 머리 */
    s += '<path d="' + cap(sh, j.neck, 0.034 * k, 0.03 * k) + '"/>';
    s += headSide(j.head, j.child ? 1.42 : 1, j.htilt || 0);
    /* 팔다리 — 먼 쪽부터 (실루엣이라 같은 빛깔) */
    var leg = function (g) { s += '<path d="' + cap(g[0], g[1], 0.06 * k, 0.04 * k) + '"/><path d="' + cap(g[1], g[2], 0.04 * k, 0.024 * k) + '"/><path d="' + cap(g[2], g[3], 0.026 * k, 0.015 * k) + '"/>'; };
    var arm = function (g) { s += ell(add(g[0], [0.006, 0.006]), 0.04 * k, 0.036 * k) + '<path d="' + cap(g[0], g[1], 0.036 * k, 0.027 * k) + '"/><path d="' + cap(g[1], g[2], 0.027 * k, 0.019 * k) + '"/>' + ell(g[2], 0.02 * k, 0.03 * k, g.rot || 0); };
    if (j.legF) leg(j.legF);
    if (j.armF) arm(j.armF);
    if (j.legN) leg(j.legN);
    /* 옷 */
    if (o.coat) {
      var w = o.wind || 0, hemB = [hp[0] - 0.085 - w, -0.24 + Math.abs(w) * 0.2], hemF = [hp[0] + 0.06 - w * 0.4, -0.27];
      s += '<path d="' + smooth([at(1.0, 0.055), at(0.6, 0.06), hemB, [lerp(hemB[0], hemF[0], 0.5), -0.25 + w * 0.05], hemF, at(0.5, -0.06), at(0.95, -0.05)], true, 0.8) + '"/>';
    }
    if (o.skirt) s += '<path d="' + smooth([at(0.42, 0.05), [hp[0] - 0.1 - (o.wind || 0), -0.26], [hp[0] + 0.09, -0.27], at(0.42, -0.05)], true, 0.7) + '"/>';
    if (o.hair === 'long') s += '<path d="' + smooth([add(j.head, [-0.01, -0.055]), add(j.head, [-0.06, 0.0]), add(j.head, [-0.06, 0.09]), add(j.head, [-0.02, 0.1]), add(j.head, [0.01, 0.02])], true) + '"/>';
    if (o.hair === 'bun') s += ell(add(j.head, [-0.045, -0.045]), 0.026, 0.024);
    if (o.hair === 'tail') s += '<path d="' + cap(add(j.head, [-0.04, -0.03]), add(j.head, [-0.09, 0.05]), 0.02, 0.012) + '"/>';
    if (o.hat) s += ell(add(j.head, [0, -0.045]), 0.075, 0.012, j.htilt || 0) + '<path d="' + smooth([add(j.head, [-0.045, -0.045]), add(j.head, [-0.04, -0.09]), add(j.head, [0.035, -0.092]), add(j.head, [0.042, -0.045])], true, 0.6) + '"/>';
    if (j.armN) arm(j.armN);
    if (o.bag) s += '<path d="' + cap(sh, add(hp, [-0.05, 0.02]), 0.006, 0.006) + '"/><rect x="' + r3(hp[0] - 0.1) + '" y="' + r3(hp[1] - 0.02) + '" width="0.09" height="0.075" rx="0.01"/>';
    return s;
  }
  /* 앞(뒤)모습 몸 — 벤치에 앉은 등 · 마주 앉은 사람 */
  function frontBody(j, o) {
    var s = '', k = j.child ? 0.8 : 1, sw = (j.sw || 0.115) * k, ww = 0.08 * k, hw = 0.088 * k, top = j.sh[1], hy = j.hip[1];
    var hun = j.hunch || 0;
    s += '<path d="' + smooth([[-sw * 0.55, top - 0.02 - hun * 0.3], [-sw, top + 0.025], [-ww * 1.05, (top + hy) / 2], [-hw, hy], [hw, hy], [ww * 1.05, (top + hy) / 2], [sw, top + 0.025], [sw * 0.55, top - 0.02 - hun * 0.3]], true, 0.85) + '"/>';
    s += '<path d="' + cap([0, top], j.neck, 0.036 * k, 0.032 * k) + '"/>' + headFront(j.head, j.child ? 1.42 : 1, j.htilt || 0);
    var arm = function (g) { s += ell(add(g[0], [g[0][0] > 0 ? -0.008 : 0.008, 0.008]), 0.034 * k, 0.034 * k) + '<path d="' + cap(g[0], g[1], 0.034 * k, 0.027 * k) + '"/><path d="' + cap(g[1], g[2], 0.028 * k, 0.02 * k) + '"/>' + ell(g[2], 0.02 * k, 0.028 * k); };
    if (j.armL) arm(j.armL);
    if (j.armR) arm(j.armR);
    if (j.legL) { s += '<path d="' + cap(j.legL[0], j.legL[1], 0.06, 0.04) + '"/><path d="' + cap(j.legL[1], j.legL[2], 0.04, 0.025) + '"/>' + ell(add(j.legL[2], [-0.008, 0]), 0.026, 0.016); }
    if (j.legR) { s += '<path d="' + cap(j.legR[0], j.legR[1], 0.06, 0.04) + '"/><path d="' + cap(j.legR[1], j.legR[2], 0.04, 0.025) + '"/>' + ell(add(j.legR[2], [0.008, 0]), 0.026, 0.016); }
    if (o.hair === 'bun') s += ell(add(j.head, [0, -0.06]), 0.03, 0.026);
    if (o.hair === 'long') s += '<path d="' + smooth([add(j.head, [-0.055, -0.02]), add(j.head, [-0.065, 0.08]), add(j.head, [0, 0.1]), add(j.head, [0.065, 0.08]), add(j.head, [0.055, -0.02]), add(j.head, [0, -0.07])], true) + '"/>';
    if (o.hat) s += ell(add(j.head, [0, -0.045]), 0.08, 0.013) + '<path d="' + smooth([add(j.head, [-0.048, -0.045]), add(j.head, [-0.042, -0.095]), add(j.head, [0.042, -0.095]), add(j.head, [0.048, -0.045])], true, 0.6) + '"/>';
    return s;
  }

  /* 자세 — 옆모습은 sideBody, 앞모습은 frontBody 로 */
  var HEADR = [0.05, 0.064], CHILD_HR = [0.075, 0.09];
  function pose(name, o) {
    o = o || {};
    var j;
    if (name === 'stand' || name === 'walk' || name === 'stride') {
      var sw = name === 'stand' ? 0 : name === 'walk' ? 1 : 1.35, ph = o.phase == null ? 1 : o.phase;
      var hip = [0, -0.52], sh = [0.01, -0.805];
      j = { hip: hip, sh: sh, neck: [0.02, -0.86], head: [0.035, -0.928], hr: HEADR, htilt: 8 };
      var kF = [0.055 * sw * ph + 0.01, -0.285], aF = [0.12 * sw * ph, -0.04], tF = [0.12 * sw * ph + 0.065, -0.008];
      var kB = [-0.04 * sw * ph + 0.012, -0.29], aB = [-0.11 * sw * ph, -0.06 + 0.02 * sw], tB = [-0.11 * sw * ph + 0.05, -0.012];
      if (!sw) { kF = [0.02, -0.28]; aF = [0.0, -0.04]; tF = [0.07, -0.008]; kB = [-0.01, -0.285]; aB = [-0.035, -0.04]; tB = [0.035, -0.008]; }
      j.legN = [hip, kF, aF, tF]; j.legF = [hip, kB, aB, tB];
      var swing = 0.09 * sw * ph;
      j.armN = [sh, [sh[0] - swing * 0.6, -0.635], [sh[0] - swing * 1.2 + 0.01, -0.47]];
      j.armF = [sh, [sh[0] + swing * 0.6, -0.635], [sh[0] + swing * 1.2 + 0.015, -0.475]];
    } else if (name === 'elder') {
      /* 등이 굽고 머리가 앞으로 · 무릎이 조금 굽음 · 지팡이는 앞손 */
      var hip2 = [0, -0.49], sh2 = [0.085, -0.75];
      j = { hip: hip2, sh: sh2, neck: [0.115, -0.8], head: [0.145, -0.862], hr: HEADR, htilt: 18, hunch: 0.03 };
      j.legN = [hip2, [0.07, -0.27], [0.05, -0.04], [0.115, -0.008]];
      j.legF = [hip2, [0.0, -0.265], [-0.06, -0.05], [-0.005, -0.01]];
      j.armF = [sh2, [0.07, -0.585], [0.11, -0.45]];
      var c = o.cane || [0.25, 0];
      var A = ik(sh2, [c[0] - 0.01, -0.5], 0.17, 0.16, -1);
      j.armN = [sh2, A[0], A[1]];
      j.cane = [[A[1][0] + 0.005, A[1][1] - 0.01], c];
    } else if (name === 'child') {
      var hc = [0, -0.46], sc = [0.01, -0.735];
      j = { child: true, hip: hc, sh: sc, neck: [0.02, -0.78], head: [0.03, -0.878], hr: CHILD_HR, htilt: 6 };
      var cw = o.walk === false ? 0 : 1;
      j.legN = [hc, [0.06 * cw + 0.01, -0.24], [0.12 * cw, -0.04], [0.12 * cw + 0.07, -0.008]];
      j.legF = [hc, [-0.04 * cw, -0.25], [-0.1 * cw, -0.06], [-0.1 * cw + 0.06, -0.012]];
      j.armN = [sc, [-0.05, -0.59], [-0.04, -0.44]];
      j.armF = [sc, [0.05, -0.59], [0.09, -0.46]];
    } else if (name === 'kneel') {
      var hk = [0, -0.36], sk = [0.02, -0.645];
      j = { hip: hk, sh: sk, neck: [0.035, -0.7], head: [0.06, -0.765], hr: HEADR, htilt: 10 };
      j.legN = [hk, [0.18, -0.25], [0.17, -0.04], [0.235, -0.008]];
      j.legF = [hk, [-0.02, -0.035], [-0.25, -0.03], [-0.3, -0.008]];
      j.armN = [sk, [0.09, -0.49], [0.21, -0.47]];
      j.armF = [sk, [0.1, -0.5], [0.17, -0.38]];
    } else if (name === 'leap') {
      var hl = [0, -0.55], sl = [0.12, -0.8];
      j = { hip: hl, sh: sl, neck: [0.15, -0.85], head: [0.19, -0.915], hr: HEADR, htilt: 22 };
      j.legN = [hl, [0.2, -0.5], [0.16, -0.3], [0.22, -0.27]];
      j.legF = [hl, [-0.14, -0.4], [-0.33, -0.36], [-0.37, -0.31]];
      j.armN = [sl, [0.27, -0.88], [0.4, -0.97]];
      j.armF = [sl, [0.0, -0.7], [-0.13, -0.66]];
    } else if (name === 'phone') {
      var hp3 = [0, -0.52], sp = [0.005, -0.805];
      j = { hip: hp3, sh: sp, neck: [0.018, -0.86], head: [0.03, -0.93], hr: HEADR, htilt: -6 };
      j.legN = [hp3, [0.02, -0.28], [0.0, -0.04], [0.07, -0.008]];
      j.legF = [hp3, [-0.01, -0.285], [-0.035, -0.04], [0.035, -0.008]];
      j.armN = [sp, [0.06, -0.69], [0.05, -0.9]];
      j.armF = [sp, [-0.01, -0.635], [0.01, -0.47]];
      j.phone = [0.06, -0.92];
    } else if (name === 'sitSide') {
      /* 의자에 앉은 옆모습 — 엉덩이가 의자 높이 */
      var hs = [0, -0.27], ss = [-0.01, -0.56];
      j = { hip: hs, sh: ss, neck: [0.005, -0.615], head: [0.02, -0.68], hr: HEADR, htilt: 4 };
      j.legN = [hs, [0.24, -0.275], [0.23, -0.04], [0.295, -0.008]];
      j.legF = [hs, [0.235, -0.28], [0.25, -0.04], [0.31, -0.008]];
      j.armN = o.reach ? [ss, [0.08, -0.42], [0.22, -0.44]] : [ss, [0.02, -0.4], [0.15, -0.36]];
      j.armF = [ss, [0.06, -0.41], [0.19, -0.42]];
      if (o.slump) { /* 고개를 떨군 채 무릎에 팔을 얹음 */
        j.sh = [0.07, -0.535]; j.neck = [0.1, -0.575]; j.head = [0.135, -0.625]; j.htilt = 30; j.hunch = 0.03;
        j.armN = [j.sh, [0.16, -0.38], [0.24, -0.33]]; j.armF = [j.sh, [0.15, -0.39], [0.23, -0.34]];
      }
    } else if (name === 'elderSit' || name === 'sitBack') {
      /* 벤치에 앉은 등(뒤모습) — 엉덩이가 y 0 */
      var eld = name === 'elderSit', hy = 0, top = eld ? -0.29 : -0.31;
      j = { front: true, hip: [0, hy], sh: [0, top], neck: [0, top - 0.06 + (eld ? 0.012 : 0)], head: [eld ? 0.005 : 0, top - (eld ? 0.112 : 0.125)], hr: [0.052, 0.062], hunch: eld ? 0.04 : 0, htilt: o.tilt || 0 };
      j.armL = [[-0.105, top + 0.03], [-0.12, top + 0.16], [-0.07, top + 0.27]];
      j.armR = [[0.105, top + 0.03], [0.12, top + 0.16], [0.07, top + 0.27]];
      if (o.lean) j.armR = [[0.105, top + 0.03], [0.17, top + 0.12], [0.2, top + 0.2]];
    } else if (name === 'front' || name === 'armsUp' || name === 'seatFront') {
      var up = name === 'armsUp', seat = name === 'seatFront';
      j = { front: true, hip: [0, -0.52], sh: [0, -0.81], neck: [0, -0.865], head: [0, -0.93], hr: HEADR };
      if (seat) { j.hip = [0, -0.27]; j.sh = [0, -0.56]; j.neck = [0, -0.615]; j.head = [0, -0.68]; }
      if (o.child) j.child = true;
      var S = j.sh[1];
      j.armL = up ? [[-0.105, S + 0.02], [-0.17, S - 0.14], [-0.22, S - 0.29]] : seat ? [[-0.105, S + 0.02], [-0.118, S + 0.17], [-0.1, S + 0.31]] : [[-0.105, S + 0.02], [-0.125, S + 0.18], [-0.115, S + 0.34]];
      j.armR = up ? [[0.105, S + 0.02], [0.17, S - 0.14], [0.22, S - 0.29]] : seat ? [[0.105, S + 0.02], [0.118, S + 0.17], [0.1, S + 0.31]] : [[0.105, S + 0.02], [0.125, S + 0.18], [0.115, S + 0.34]];
      if (!seat) { j.legL = [[-0.05, -0.52], [-0.055, -0.28], [-0.05, -0.01]]; j.legR = [[0.05, -0.52], [0.055, -0.28], [0.05, -0.01]]; }
    }
    if (o.reachTo && j.armN) { var R = ik(j.sh, o.reachTo, j.child ? 0.14 : 0.17, j.child ? 0.13 : 0.16, o.bend || 1); j.armN = [j.sh, R[0], R[1]]; }
    if (o.reachF && j.armF) { var R2 = ik(j.sh, o.reachF, j.child ? 0.14 : 0.17, j.child ? 0.13 : 0.16, o.bendF || 1); j.armF = [j.sh, R2[0], R2[1]]; }
    return j;
  }
  /* 사람 한 명 — (x,y) 발바닥(앉은 등은 엉덩이) · h 키(px) · 빛 rim 은 테두리 빛 [색, dx, dy] */
  function person(x, y, h, name, o) {
    o = o || {};
    var j = pose(name, o), b = j.front ? frontBody(j, o) : sideBody(j, o);
    if (j.cane) b += '<path d="' + cap(j.cane[0], j.cane[1], 0.009, 0.008) + '"/>';
    if (j.phone) b += '<rect x="' + r3(j.phone[0] - 0.012) + '" y="' + r3(j.phone[1] - 0.03) + '" width="0.022" height="0.05" rx="0.006"/>';
    var tf = function (dx, dy) { return 'translate(' + r1(x + (dx || 0)) + ' ' + r1(y + (dy || 0)) + ') scale(' + r3(h * (o.flip ? -1 : 1)) + ' ' + r3(h) + ')'; };
    var out = '';
    if (o.rim) out += '<g transform="' + tf(o.rim[1], o.rim[2]) + '" fill="' + o.rim[0] + '" opacity="' + (o.rim[3] || 0.9) + '">' + b + '</g>';
    out += '<g class="who-' + name + '" transform="' + tf() + '" fill="' + (o.fill || '#05040A') + '">' + b + '</g>';
    if (j.phone && o.glow) out += '<circle cx="' + r1(x + j.phone[0] * h * (o.flip ? -1 : 1)) + '" cy="' + r1(y + j.phone[1] * h) + '" r="' + r1(h * 0.09) + '" fill="url(#' + o.glow + ')" class="phone"/>';
    return out;
  }
  /* 사람의 그림자 — 땅에 길게 */
  function shadow(x, y, h, dir, op) {
    return '<ellipse cx="' + r1(x + dir * h * 0.55) + '" cy="' + r1(y + 2) + '" rx="' + r1(h * 0.6) + '" ry="' + r1(h * 0.035) + '" fill="#000" opacity="' + (op || 0.35) + '"/>';
  }
  /* 사람의 관절 자리(픽셀) — 손을 맞잡게 할 때 씁니다 */
  function at(x, y, h, u, flip) { return [x + u[0] * h * (flip ? -1 : 1), y + u[1] * h]; }
  function toU(x, y, h, px, flip) { return [(px[0] - x) / h * (flip ? -1 : 1), (px[1] - y) / h]; }

  var ART = {};

  /* ════════ 새벽 길 — 여는 장 · 맺는 장 ════════
     골짜기 너머로 해가 오르고, 길이 해 쪽으로 굽어 갑니다. 먼저 걸어오신 분과 뒤따르는 사람이 걷습니다. */
  ART.dawn = function () {
    var p = 'dw-';
    var L = [
      { seed: 11, y: 610, amp: 150, freq: 2.6, sharp: 1.5, color: '#8A6A90', fh: 70 },
      { seed: 12, y: 650, amp: 130, freq: 3.3, sharp: 1.4, color: '#5C4778', fh: 80 },
      { seed: 13, y: 715, amp: 110, freq: 2.4, sharp: 1.2, color: '#382C58', fh: 90 },
      { seed: 14, y: 790, amp: 90, freq: 1.7, sharp: 1.0, color: '#1E1836', fh: 90 },
      { seed: 15, y: 900, amp: 120, freq: 1.2, sharp: 0.9, color: '#0B0916', fog: false }
    ];
    var rg = range(p, L, '#F6C2A6', 0.38);
    var cl = clouds(p, 4, 20, 300, 500, '#FFD2A8', '#6E4A78', 0.75);
    var ry = rays(p, 1000, 556, 12, 520, 196, 344, '#FFD9A6', 0.12, 9);
    /* 언덕 마루를 따라 난 오솔길 — 두 사람이 해 쪽으로 걷습니다 */
    var path = '';
    var gy = function (x) { return ridgeY(15, 900, 120, 1.2, 0.9, 5, x) + 3; };
    var walkers = person(905, gy(905), 104, 'elder', { fill: '#100B1A', rim: ['#FFC48A', 1.6, 0, 0.85], hat: true, cane: [0.26, 0] }) +
      person(958, gy(958), 116, 'walk', { fill: '#100B1A', rim: ['#FFC48A', 1.6, 0, 0.85], phase: -1 });
    var d = sky(p, [[0, '#070A20'], [0.3, '#1E2048'], [0.48, '#5A3E70'], [0.58, '#C2707A'], [0.64, '#FFB27E'], [0.7, '#FFE2B4']]) +
      sunDefs(p, '#FFC27A') + rg.defs + cl.defs + ry.defs;
    return svg('dawn',
      '<rect width="1600" height="900" fill="url(#' + p + 'sky)"/>' + stars(7, 140, 340, 0.85) + cl.body +
      ry.body + '<g class="sunrise">' + sun(p, 1000, 556, 36, '#FFF4DA', '#FFC27A', 620) + '</g>' + rg.body +
      path +
      grass(5, L[4], 220, '#0C0A17', 6, 22, 4) + walkers +
      motes(31, 30, 700, 1300, 520, 760, '#FFE3B8', 1.6, 0.5), d);
  };

  /* ════════ 벤치의 노부부 — 먼저 이 길을 걸어오신 분들께 ════════
     호숫가 벤치에 두 분이 기대어 앉아 해 지는 물을 봅니다. 할머니는 할아버지 어깨에 머리를 기댑니다. */
  ART.bench = function () {
    var p = 'bn-';
    var L = [{ seed: 21, y: 610, amp: 70, freq: 2.0, sharp: 1.2, color: '#8A5A7E', fh: 40 }, { seed: 22, y: 628, amp: 50, freq: 3.2, sharp: 1.1, color: '#5E3E62', fog: false }];
    var rg = range(p, L, '#FFC1A0', 0.4);
    var cl = clouds(p, 8, 18, 250, 470, '#FFCFA6', '#8A4A6E', 0.75);
    var d = sky(p, [[0, '#1B1838'], [0.38, '#5A3466'], [0.58, '#C66A6E'], [0.66, '#F5A06A'], [0.7, '#FFD49A']]) +
      sunDefs(p, '#FFB874') + rg.defs + cl.defs +
      lin(p + 'lake', [[0, '#F2A877'], [0.12, '#A2607A'], [1, '#1E1530']]) + lin(p + 'shore', [[0, '#120C16'], [1, '#07050A']]) +
      rad(p + 'lamp', [[0, '#FFE6B0', 0.7], [1, '#FFE6B0', 0]]) + blur(p + 'b2', 2);
    /* 물 위 해 그림자 — 가로 줄 */
    var r = rnd(23), refl = '';
    for (var i = 0; i < 26; i++) { var yy = 640 + i * i * 0.32, w = 260 - i * 7 + r() * 60; refl += '<rect x="' + r1(1180 - w / 2 + (r() - 0.5) * 30) + '" y="' + r1(yy) + '" width="' + r1(w) + '" height="' + r1(1.5 + i * 0.12) + '" rx="1" fill="#FFE2B0" opacity="' + (0.75 - i * 0.025).toFixed(2) + '"/>'; }
    /* 앞 둔덕 · 나무 */
    var shore = 'M0 760C200 748 380 752 560 762 760 772 1000 770 1200 758 1380 748 1500 752 1600 760V900H0Z';
    var trees = tree(41, 140, 770, 560, '#08060B', 0.1) + tree(42, 390, 772, 300, '#0A070D', -0.06) + tree(43, 1600, 770, 460, '#08060B', -0.18);
    /* 벤치 — 등받이 판 셋 · 다리 · 팔걸이 */
    /* 뒤에서 본 벤치 — 앉은 두 분의 등이 등받이 판 사이로 보입니다 */
    var bx = 1000, by = 760, bench = '<g fill="#07050A">' +
      '<rect x="' + (bx - 230) + '" y="' + (by - 98) + '" width="460" height="12" rx="3"/>' +
      '<rect x="' + (bx - 210) + '" y="' + (by - 160) + '" width="9" height="160"/><rect x="' + (bx + 201) + '" y="' + (by - 160) + '" width="9" height="160"/>' +
      '<rect x="' + (bx - 120) + '" y="' + (by - 88) + '" width="8" height="88"/><rect x="' + (bx + 112) + '" y="' + (by - 88) + '" width="8" height="88"/></g>';
    var slats = '<g fill="#07050A"><rect x="' + (bx - 232) + '" y="' + (by - 130) + '" width="464" height="12" rx="3"/><rect x="' + (bx - 232) + '" y="' + (by - 158) + '" width="464" height="12" rx="3"/></g>';
    var seat = by - 92;
    var couple = person(bx - 58, seat, 370, 'elderSit', { fill: '#060409', hat: true, lean: true, rim: ['#FFB27A', 1.4, 0, 0.7] }) +
      person(bx + 52, seat, 345, 'elderSit', { fill: '#060409', hair: 'bun', tilt: -16, rim: ['#FFB27A', 1.4, 0, 0.7] });
    var lamp = '<rect x="676" y="430" width="7" height="330" fill="#07050A"/><path d="M664 430H695L687 410H672Z" fill="#07050A"/>' +
      '<circle cx="679.5" cy="438" r="110" fill="url(#' + p + 'lamp)" class="lampglow"/><circle cx="679.5" cy="436" r="6" fill="#FFF0C8"/>';
    return svg('bench',
      '<rect width="1600" height="900" fill="url(#' + p + 'sky)"/>' + stars(23, 60, 220, 0.6) + cl.body +
      sun(p, 1180, 600, 46, '#FFF1CF', '#FFB874', 520) + rg.body +
      '<rect y="636" width="1600" height="140" fill="url(#' + p + 'lake)"/><g filter="url(#' + p + 'b2)">' + refl + '</g>' +
      '<path d="' + shore + '" fill="url(#' + p + 'shore)"/>' + grass(24, { seed: 2, y: 762, amp: 10, freq: 3, sharp: 1 }, 260, '#07050A', 8, 26, 3) +
      trees + lamp + bench + couple + slats +
      motes(25, 16, 0, 1600, 300, 700, '#FFC487', 1.4, 0.45), d);
  };

  /* ════════ 손잡고 걷는 삼대 — 한 집 안의 세 개의 시계 ════════
     황금빛 들길을 지팡이 짚은 할아버지 · 그 손을 잡은 엄마 · 엄마 손을 잡은 아이가 걷습니다. */
  ART.family = function () {
    var p = 'fm-';
    var L = [
      { seed: 51, y: 610, amp: 150, freq: 2.4, sharp: 1.6, color: '#C98478', fh: 60 },
      { seed: 52, y: 660, amp: 120, freq: 3.0, sharp: 1.4, color: '#93545F', fh: 70 },
      { seed: 53, y: 730, amp: 90, freq: 2.0, sharp: 1.2, color: '#5A3141', fh: 70 },
      { seed: 54, y: 900, amp: 130, freq: 1.1, sharp: 0.8, color: '#1A0F16', fog: false }
    ];
    var rg = range(p, L, '#FFD2A0', 0.45);
    var cl = clouds(p, 9, 16, 230, 450, '#FFE0B0', '#B0606A', 0.6);
    var d = sky(p, [[0, '#2A2448'], [0.35, '#7A4A6E'], [0.55, '#E08A6A'], [0.64, '#FFC07A'], [0.68, '#FFE3A8']]) +
      sunDefs(p, '#FFC27A') + rg.defs + cl.defs + lin(p + 'path', [[0, '#C98C6A', 0.65], [1, '#3A2228', 0.9]]);
    /* 세 사람 — 오른쪽(해 쪽)으로 걷습니다. 손이 닿는 자리를 먼저 정하고 팔을 굽힙니다 */
    var gy = 800, xe = 900, xa = 990, xc = 1068, he = 230, ha = 250, hc = 162;
    var hand1 = [950, 666], hand2 = [1038, 668];
    var rim = ['#FFCF94', -1.6, 0, 0.85];
    var ppl =
      shadow(xe, gy, he, -1, 0.3) + shadow(xa, gy, ha, -1, 0.3) + shadow(xc, gy, hc, -1, 0.3) +
      person(xe, gy, he, 'elder', { fill: '#100910', rim: rim, hat: true, cane: [0.3, 0], reachF: toU(xe, gy, he, hand1), bendF: 1 }) +
      person(xa, gy, ha, 'walk', { fill: '#100910', rim: rim, hair: 'long', skirt: true, reachTo: toU(xa, gy, ha, hand1), bend: -1, reachF: toU(xa, gy, ha, hand2), bendF: 1, phase: 0.8 }) +
      person(xc, gy, hc, 'child', { fill: '#100910', rim: rim, hair: 'tail', reachTo: toU(xc, gy, hc, hand2), bend: -1 });
    return svg('family',
      '<rect width="1600" height="900" fill="url(#' + p + 'sky)"/>' + cl.body + sun(p, 1330, 610, 52, '#FFF4D6', '#FFC27A', 620) + rg.body +
      '<path d="M1600 760C1400 770 1220 790 1000 806 760 822 520 850 300 900H900C1100 860 1300 830 1600 800Z" fill="url(#' + p + 'path)"/>' +
      grass(55, L[3], 380, '#1A0F16', 10, 34, 5) + ppl +
      grass(56, { seed: 57, y: 905, amp: 40, freq: 1.4, sharp: 1 }, 140, '#0C070B', 20, 60, 6) +
      motes(58, 40, 600, 1600, 400, 820, '#FFE0A8', 1.8, 0.55), d);
  };


  /* ════════ 인생의 하루 — 해가 하루를 건너갑니다 (강사가 넣은 두 수로 해 자리를 정함) ════════ */
  var DAYPAL = [ /* f: 하늘 위 · 가운데 · 지평선 · 땅 */
    [0.0, '#03050F', '#0A1028', '#1A2040', '#05060C'], [0.2, '#0A1030', '#2A2A5A', '#6A4A70', '#0B0A16'],
    [0.27, '#1C2C66', '#6A6A9A', '#F2A27A', '#14121E'], [0.36, '#2E6AB0', '#7FB2DE', '#E6EEF2', '#1F2A2C'],
    [0.64, '#2C66AA', '#86B6DE', '#F0E6CC', '#20282A'], [0.74, '#2A2E6A', '#B0607A', '#FFB46E', '#160F18'],
    [0.82, '#0E1236', '#3A2A5A', '#B0506A', '#0A0810'], [1.0, '#03050F', '#0A1028', '#1A2040', '#05060C']];
  function dayPal(f) {
    for (var i = 0; i < DAYPAL.length - 1; i++) {
      var a = DAYPAL[i], b = DAYPAL[i + 1];
      if (f <= b[0]) { var t = (f - a[0]) / (b[0] - a[0] || 1); return [1, 2, 3, 4].map(function (k) { return mix(a[k], b[k], t); }); }
    }
    return DAYPAL[0].slice(1);
  }
  ART.day = function (o) {
    o = o || {};
    var p = 'dy-', f = o.f, has = typeof f === 'number' && isFinite(f);
    var ff = has ? Math.max(0, Math.min(1, f)) : 0.76, pal = dayPal(ff);
    var cx = 800, cy = 760, R = 560, ang = Math.PI * (1 - ff), sx = cx + R * Math.cos(ang), sy = cy - R * Math.sin(ang);
    var night = ff < 0.24 || ff > 0.8;
    var L = [{ seed: 61, y: 700, amp: 110, freq: 2.6, sharp: 1.3, color: mix(pal[2], pal[3], 0.55), fh: 60 },
      { seed: 62, y: 740, amp: 80, freq: 2.0, sharp: 1.1, color: mix(pal[2], pal[3], 0.8), fh: 60 },
      { seed: 63, y: 900, amp: 130, freq: 1.0, sharp: 0.9, color: pal[3], fog: false }];
    var rg = range(p, L, pal[2], 0.35);
    var marks = '';
    [['새벽', 0.25], ['한낮', 0.5], ['저녁', 0.75]].forEach(function (t) {
      var a = Math.PI * (1 - t[1]), x = cx + (R + 40) * Math.cos(a), y = cy - (R + 40) * Math.sin(a);
      marks += '<text x="' + r1(x) + '" y="' + r1(y + 8) + '" fill="#E6ECF6" opacity=".55" font-size="24" font-family="Noto Serif KR,serif" text-anchor="middle">' + t[0] + '</text>';
    });
    var gx = function (x) { return ridgeY(63, 900, 130, 1.0, 0.9, 5, x) + 3; };
    var d = sky(p, [[0, pal[0]], [0.55, pal[1]], [0.84, pal[2]]]) + sunDefs(p, night ? '#C9D6FF' : '#FFC878');
    return svg('day',
      '<rect width="1600" height="900" fill="url(#' + p + 'sky)"/>' + (night || !has ? stars(11, 150, 520, night ? 0.9 : 0.35) : '') +
      '<path d="M240 760A560 560 0 0 1 1360 760" fill="none" stroke="#F6C76B" stroke-width="2.5" stroke-dasharray="3 12" opacity=".5"/>' + marks +
      '<g class="' + (has ? 'sunAt' : 'sunArc') + '">' + sun(p, r1(sx), r1(sy), night ? 26 : 34, night ? '#EEF2FF' : '#FFF4DA', night ? '#C9D6FF' : '#FFC878', 420) + '</g>' +
      rg.body + tree(64, 1180, gx(1180), 300, pal[3], 0.04) +
      person(1236, gx(1236), 112, 'stand', { fill: pal[3] }) +
      '<text x="240" y="850" fill="#C9D3E6" opacity=".75" font-size="44" font-weight="800" text-anchor="middle">B</text>' +
      '<text x="1360" y="850" fill="#C9D3E6" opacity=".75" font-size="44" font-weight="800" text-anchor="middle">D</text>', d + rg.defs);
  };

  /* ════════ 차에서 내리지 못하는 밤 — 1부 · 실패 ════════
     텅 빈 지하 아닌 바깥 주차장, 가로등 하나 아래 차 한 대. 시동은 꺼졌고, 운전석의 사람은 고개를 숙였습니다. */
  ART.night = function () {
    var p = 'nt-', r = rnd(71), city = '', wins = '';
    for (var i = 0; i < 26; i++) {
      var bx = i * 64 + r() * 20 - 10, bw = 50 + r() * 40, bh = 120 + r() * 260, by = 560 - bh;
      city += '<rect x="' + r1(bx) + '" y="' + r1(by) + '" width="' + r1(bw) + '" height="' + r1(bh) + '"/>';
      for (var k = 0; k < bh / 22 - 1; k++) for (var m = 0; m < bw / 16 - 1; m++) if (r() > 0.78) wins += '<rect x="' + r1(bx + 6 + m * 16) + '" y="' + r1(by + 10 + k * 22) + '" width="7" height="9" fill="' + (r() > 0.3 ? '#FFD08A' : '#9FC2FF') + '" opacity="' + (0.35 + r() * 0.5).toFixed(2) + '"/>';
    }
    var lines = '';
    for (var j = -6; j <= 7; j++) lines += '<path d="M' + (760 + j * 120) + ' 640L' + (760 + j * 150) + ' 700" stroke="#D8DEEA" stroke-width="3" opacity=".12"/><path d="M' + (760 + j * 190) + ' 820L' + (760 + j * 240) + ' 900" stroke="#D8DEEA" stroke-width="4" opacity=".1"/>';
    lines += '<path d="M0 640H1600M0 820H1600" stroke="#D8DEEA" stroke-width="2" opacity=".06"/>';
    var car = 'M900 742L904 712Q910 696 940 692L1012 686Q1046 650 1094 642L1192 640Q1242 642 1278 682L1306 690Q1324 696 1322 716L1320 740Q1318 750 1302 750L1290 750A42 42 0 0 0 1208 750L1012 750A42 42 0 0 0 930 750L912 750Q900 748 900 742Z';
    var d = sky(p, [[0, '#02040C'], [0.5, '#0A1226'], [0.66, '#2A2034']]) + lin(p + 'cone', [[0, '#FFE2A3', 0.5], [1, '#FFE2A3', 0]]) +
      rad(p + 'pool', [[0, '#FFDFA0', 0.45], [1, '#FFDFA0', 0]]) + rad(p + 'lamp', [[0, '#FFF6D8'], [0.2, '#FFE2A3', 0.7], [1, '#FFE2A3', 0]]) +
      rad(p + 'ph', [[0, '#B8D2FF', 0.85], [1, '#B8D2FF', 0]]) + lin(p + 'gl', [[0, '#4A5878', 0.55], [1, '#141A2A', 0.85]]) +
      lin(p + 'wet', [[0, '#1A2032'], [1, '#05070D']]) + blur(p + 'b1', 1.6) + blur(p + 'b6', 6) +
      '<clipPath id="' + p + 'cc"><path d="M1132 300L1290 900H960Z"/></clipPath>';
    var rain = '', rr = rnd(72);
    for (var q = 0; q < 140; q++) { var x = 960 + rr() * 330, y = 300 + rr() * 560, l = 18 + rr() * 26; rain += '<path d="M' + r1(x) + ' ' + r1(y) + 'l-4 ' + r1(l) + '"/>'; }
    return svg('night',
      '<rect width="1600" height="900" fill="url(#' + p + 'sky)"/>' + stars(19, 40, 260, 0.35) +
      '<g fill="#0E1528" opacity=".7" transform="translate(30 -40) scale(1 1.05)" filter="url(#' + p + 'b6)">' + city + '</g>' +
      '<g fill="#0A1020" filter="url(#' + p + 'b1)">' + city + '</g><g filter="url(#' + p + 'b1)">' + wins + '</g>' +
      '<rect y="520" width="1600" height="60" fill="#3A2A3A" opacity=".35" filter="url(#' + p + 'b6)"/>' +
      '<rect y="560" width="1600" height="340" fill="url(#' + p + 'wet)"/>' + lines +
      /* 가로등 · 빛 기둥 · 빛 웅덩이 */
      '<rect x="1126" y="290" width="10" height="470" fill="#06080F"/><path d="M1104 292H1158L1146 276H1116Z" fill="#06080F"/>' +
      '<path d="M1132 300L1290 900H960Z" fill="url(#' + p + 'cone)" opacity=".75"/><ellipse cx="1120" cy="800" rx="260" ry="60" fill="url(#' + p + 'pool)"/>' +
      '<circle cx="1131" cy="298" r="80" fill="url(#' + p + 'lamp)" class="lampglow"/>' +
      '<g class="rain" stroke="#D9E4F6" stroke-width="1.4" opacity=".45" clip-path="url(#' + p + 'cc)">' + rain + '</g>' +
      /* 젖은 바닥에 비친 불빛 */
      '<rect x="1118" y="770" width="26" height="120" fill="#FFE2A3" opacity=".22" filter="url(#' + p + 'b6)"/>' +
      /* 차 — 창 안의 휴대폰 불빛, 고개 숙인 운전자 */
      '<path d="' + car + '" fill="#05070C"/>' +
      '<path d="M1022 684Q1048 656 1094 650L1150 649V684Z" fill="url(#' + p + 'gl)"/><path d="M1160 649L1192 649Q1230 653 1258 684H1160Z" fill="url(#' + p + 'gl)"/>' +
      '<circle cx="1092" cy="676" r="40" fill="url(#' + p + 'ph)" class="phone"/>' +
      '<g fill="#05070C"><path d="M1112 686C1108 672 1110 660 1120 655 1132 650 1142 658 1142 670 1142 680 1136 686 1128 690Z"/><path d="M1096 690Q1110 676 1124 684L1120 700H1090Z"/></g>' +
      '<rect x="1086" y="672" width="8" height="12" rx="2" fill="#DDE8FF" opacity=".9"/>' +
      '<circle cx="971" cy="750" r="30" fill="#020306"/><circle cx="1249" cy="750" r="30" fill="#020306"/>' +
      '<path d="M904 712L926 712" stroke="#FFE7B0" stroke-width="4" opacity=".0"/>' +
      '<path d="' + car + '" fill="#05070C" opacity=".35" transform="translate(0 1500) scale(1 -1)" filter="url(#' + p + 'b6)"/>', d);
  };

  /* ════════ 빛이 쏟아지는 계단 — 한 칸씩, 그것이 증명 ════════ */
  ART.stairs = function () {
    var p = 'st-', vx = 1060, vy = 300, steps = '', n = 24;
    for (var i = 0; i < n; i++) {
      var t0 = Math.pow(i / n, 1.35), t1 = Math.pow((i + 1) / n, 1.35);
      var y0 = lerp(900, 330, t0), y1 = lerp(900, 330, t1), w0 = lerp(760, 70, t0), w1 = lerp(760, 70, t1), xc0 = lerp(980, vx, t0), xc1 = lerp(980, vx, t1);
      var lit = 0.25 + 0.75 * Math.pow(t0, 1.6);
      steps += '<path d="M' + r1(xc0 - w0 / 2) + ' ' + r1(y0) + 'L' + r1(xc1 - w1 / 2) + ' ' + r1(y1) + 'H' + r1(xc1 + w1 / 2) + 'L' + r1(xc0 + w0 / 2) + ' ' + r1(y0) + 'Z" fill="' + mix('#1A1622', '#C9A878', lit) + '"/>' +
        '<path d="M' + r1(xc1 - w1 / 2) + ' ' + r1(y1) + 'H' + r1(xc1 + w1 / 2) + '" stroke="' + mix('#3A3040', '#FFF0CC', lit) + '" stroke-width="' + r1(lerp(4, 1.2, t1)) + '"/>';
    }
    var ry = rays(p, vx, 240, 18, 900, 60, 125, '#FFE8B8', 0.32, 3);
    var d = lin(p + 'bg', [[0, '#0C0A12'], [1, '#05040A']]) + rad(p + 'door', [[0, '#FFFFFF'], [0.25, '#FFF1C8'], [0.6, '#FFD48A', 0.5], [1, '#FFD48A', 0]]) +
      lin(p + 'wl', [[0, '#05040A'], [1, '#2A2230']], 0, 0, 1, 0) + lin(p + 'wr', [[0, '#2A2230'], [1, '#05040A']], 0, 0, 1, 0) + ry.defs;
    return svg('stairs',
      '<rect width="1600" height="900" fill="url(#' + p + 'bg)"/>' +
      '<circle cx="' + vx + '" cy="240" r="520" fill="url(#' + p + 'door)" opacity=".55"/>' +
      '<path d="M0 0H900L1010 210V340L560 900H0Z" fill="url(#' + p + 'wl)"/><path d="M1600 0H1220L1112 210V340L1420 900H1600Z" fill="url(#' + p + 'wr)"/>' +
      '<rect x="1018" y="150" width="86" height="190" fill="#FFF8E6"/><rect x="1010" y="142" width="102" height="8" fill="#2A2230"/>' +
      steps + ry.body +
      person(990, 892, 190, 'front', { fill: '#05040A', rim: ['#FFE2A8', 0, -1.6, 0.8] }) +
      motes(81, 70, 860, 1260, 160, 700, '#FFF0CC', 1.5, 0.6), d);
  };

  /* ════════ 건너뛰는 사람 — 도전 → 자립 ════════ */
  ART.leap = function () {
    var p = 'lp-';
    var cliffL = function () { var n = noise(91), pts = [[0, 900], [0, 600]]; for (var x = 0; x <= 640; x += 12) pts.push([x, 602 + fbm(n, x / 90, 4) * 18]); pts.push([660, 640], [640, 720], [650, 800], [610, 900]); return line(pts) + 'Z'; };
    var cliffR = function () { var n = noise(92), pts = [[1600, 900], [1600, 580]]; for (var x = 1600; x >= 980; x -= 12) pts.push([x, 586 + fbm(n, x / 90, 4) * 18]); pts.push([958, 620], [975, 700], [960, 790], [990, 900]); return line(pts) + 'Z'; };
    var sea = '', r = rnd(93);
    for (var i = 0; i < 40; i++) sea += '<ellipse cx="' + r1(r() * 1600) + '" cy="' + r1(700 + r() * 200) + '" rx="' + r1(80 + r() * 200) + '" ry="' + r1(20 + r() * 40) + '" opacity="' + (0.3 + r() * 0.5).toFixed(2) + '"/>';
    var cl = clouds(p, 94, 16, 200, 460, '#FFE1B6', '#8A5A7A', 0.6);
    var d = sky(p, [[0, '#14183A'], [0.45, '#5C4A80'], [0.62, '#E2928A'], [0.7, '#FFD2A0']]) + sunDefs(p, '#FFD08A') + cl.defs +
      blur(p + 'sb', 14) + lin(p + 'cf', [[0, '#120E1C'], [1, '#05040A']]);
    return svg('leap',
      '<rect width="1600" height="900" fill="url(#' + p + 'sky)"/>' + stars(95, 50, 200, 0.5) + cl.body + sun(p, 810, 640, 44, '#FFF6DE', '#FFD08A', 700) +
      '<g fill="#F6D2C0" filter="url(#' + p + 'sb)">' + sea + '</g>' +
      '<path d="' + cliffL() + '" fill="url(#' + p + 'cf)"/><path d="' + cliffR() + '" fill="url(#' + p + 'cf)"/>' +
      '<g class="leapf">' + person(770, 600, 250, 'leap', { fill: '#07050C', rim: ['#FFD8A8', 0, -1.8, 0.9], coat: false }) + '</g>' +
      '<g fill="#07050C" opacity=".8"><path d="M300 300q10 -8 20 0q10 -8 20 0" stroke="#07050C" stroke-width="3" fill="none"/><path d="M380 260q8 -6 16 0q8 -6 16 0" stroke="#07050C" stroke-width="2.5" fill="none"/></g>', d);
  };

  /* ════════ 바람 속에 홀로 선 사람 — 1부를 닫으며 ════════ */
  ART.hill = function () {
    var p = 'hl-';
    var hillD = 'M0 900L0 800C200 790 420 770 640 740 860 708 1040 668 1180 650 1300 636 1420 640 1600 660V900Z';
    var g = '', r = rnd(101);
    for (var i = 0; i < 420; i++) {
      var x = r() * 1600, t = x / 1600, y = (t < 0.4 ? lerp(800, 740, t / 0.4) : t < 0.74 ? lerp(740, 650, (t - 0.4) / 0.34) : lerp(650, 660, (t - 0.74) / 0.26)) + 2 + r() * 14, h = 14 + r() * 34;
      g += 'M' + r1(x - 1.6) + ' ' + r1(y) + 'Q' + r1(x - h * 0.3) + ' ' + r1(y - h * 0.6) + ' ' + r1(x - h * 0.7) + ' ' + r1(y - h * 0.85) + 'Q' + r1(x - h * 0.25) + ' ' + r1(y - h * 0.55) + ' ' + r1(x + 1.6) + ' ' + r1(y) + 'Z';
    }
    var wind = '';
    for (var k = 0; k < 9; k++) { var y0 = 200 + k * 50 + r() * 30, x0 = 300 + r() * 1000; wind += '<path d="M' + r1(x0) + ' ' + r1(y0) + 'C' + r1(x0 - 120) + ' ' + r1(y0 - 10) + ' ' + r1(x0 - 220) + ' ' + r1(y0 + 14) + ' ' + r1(x0 - 360) + ' ' + r1(y0 + 4) + '"/>'; }
    var cl = clouds(p, 102, 24, 120, 520, '#C9B8D8', '#3A3058', 0.75);
    var d = sky(p, [[0, '#101530'], [0.4, '#2E3060'], [0.62, '#7A5878'], [0.72, '#E6A27A'], [0.76, '#FFD6A0']]) + sunDefs(p, '#FFC88A') + cl.defs;
    return svg('hill',
      '<rect width="1600" height="900" fill="url(#' + p + 'sky)"/>' + cl.body + sun(p, 420, 660, 30, '#FFF2D6', '#FFC88A', 500) +
      '<path d="' + ridge(103, 690, 90, 2.2, 1.2) + '" fill="#4A3A5C"/>' +
      '<path d="' + hillD + '" fill="#0A0812"/><path d="' + g + '" fill="#0A0812"/>' +
      '<g class="wind" stroke="#E6DDF0" stroke-width="2" fill="none" opacity=".35">' + wind + '</g>' +
      person(1210, 646, 230, 'stand', { fill: '#0A0812', coat: true, wind: 0.07, rim: ['#FFD2A0', -1.6, 0, 0.8] }), d);
  };

  /* ════════ 갈림길 — 길 끝마다 불빛 ════════ */
  ART.fork = function () {
    var p = 'fk-';
    var L = [{ seed: 111, y: 610, amp: 90, freq: 2.4, sharp: 1.3, color: '#3A3456', fh: 60 }, { seed: 112, y: 650, amp: 60, freq: 3.0, sharp: 1.1, color: '#221E36', fog: false }];
    var rg = range(p, L, '#B88A9A', 0.35);
    var houses = '';
    [[330, 640, 1], [880, 600, 0.8], [1380, 628, 1.1]].forEach(function (h, i) {
      var x = h[0], y = h[1], k = h[2];
      houses += '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><path d="M-30 0V-30L0 -52 30 -30V0Z" fill="#0E0B18"/><rect x="-10" y="-24" width="9" height="10" fill="#FFD48A"/><rect x="4" y="-24" width="9" height="10" fill="#FFD48A" opacity=".8"/></g>' +
        '<circle cx="' + x + '" cy="' + (y - 18) + '" r="' + (60 * k) + '" fill="url(#' + p + 'lamp)" class="hope h' + i + '"/>';
    });
    var path = '<path d="M700 900C740 820 770 770 790 730L810 730C830 770 870 820 940 900Z" fill="#3A3248"/>' +
      '<path d="M790 732C700 700 520 676 340 646L346 640C520 664 720 690 800 726Z" fill="#2E283C"/>' +
      '<path d="M796 730C810 690 850 640 878 604L884 606C862 640 826 690 806 730Z" fill="#2E283C"/>' +
      '<path d="M806 728C960 700 1180 664 1376 632L1380 638C1190 672 980 708 812 734Z" fill="#2E283C"/>';
    var post = '<g fill="#07060C"><rect x="742" y="610" width="7" height="130"/><path d="M748 622L806 612 812 622 806 632 748 638Z"/><path d="M742 646L688 640 682 650 688 660 742 662Z"/><path d="M748 668L800 674 806 684 800 692 748 688Z"/></g>';
    var d = sky(p, [[0, '#0C1028'], [0.45, '#2C2850'], [0.62, '#7A5274'], [0.7, '#D88A76']]) + rg.defs + rad(p + 'lamp', [[0, '#FFD48A', 0.55], [1, '#FFD48A', 0]]);
    return svg('fork',
      '<rect width="1600" height="900" fill="url(#' + p + 'sky)"/>' + stars(113, 120, 360, 0.7) + rg.body + houses +
      '<path d="M0 680C400 690 1200 670 1600 680V900H0Z" fill="#120F1E"/>' + path +
      grass(114, { seed: 115, y: 690, amp: 14, freq: 3, sharp: 1 }, 380, '#0A0812', 10, 30, 2) + post +
      person(800, 772, 168, 'front', { fill: '#07060C', rim: ['#E6B4A0', 0, -1.4, 0.6] }) +
      motes(116, 40, 0, 1600, 560, 860, '#FFE48A', 2, 0.7), d);
  };

  /* ════════ 우산 — 아이 쪽으로 기울어진 ════════ */
  ART.umbrella = function () {
    var p = 'um-', r = rnd(121), bok = '';
    for (var i = 0; i < 60; i++) bok += '<circle cx="' + r1(r() * 1600) + '" cy="' + r1(200 + r() * 420) + '" r="' + r1(6 + r() * 26) + '" fill="' + (r() > 0.4 ? '#FFC77A' : '#8FB4FF') + '" opacity="' + (0.12 + r() * 0.3).toFixed(2) + '"/>';
    var rain = '';
    for (var k = 0; k < 260; k++) { var x = r() * 1600, y = r() * 860, l = 16 + r() * 30; rain += '<path d="M' + r1(x) + ' ' + r1(y) + 'l-5 ' + r1(l) + '"/>'; }
    var gy = 760, xa = 1080, xc = 1180, ha = 300, hc = 175;
    var hand = [1124, gy - 160];
    var adult = person(xa, gy, ha, 'walk', { fill: '#05070D', coat: true, reachTo: toU(xa, gy, ha, hand), bend: -1, phase: 0.7, rim: ['#FFCF8A', 1.4, 0, 0.6] });
    var child = person(xc, gy, hc, 'child', { fill: '#05070D', bag: true, rim: ['#FFCF8A', 1.4, 0, 0.6] });
    var tip = [1148, gy - 330], canopy = 'M' + (tip[0] - 160) + ' ' + (tip[1] + 74) + 'Q' + tip[0] + ' ' + (tip[1] - 64) + ' ' + (tip[0] + 170) + ' ' + (tip[1] + 106) +
      'Q' + (tip[0] + 130) + ' ' + (tip[1] + 92) + ' ' + (tip[0] + 96) + ' ' + (tip[1] + 104) + 'Q' + (tip[0] + 50) + ' ' + (tip[1] + 82) + ' ' + (tip[0] + 6) + ' ' + (tip[1] + 92) +
      'Q' + (tip[0] - 40) + ' ' + (tip[1] + 72) + ' ' + (tip[0] - 86) + ' ' + (tip[1] + 80) + 'Q' + (tip[0] - 124) + ' ' + (tip[1] + 66) + ' ' + (tip[0] - 160) + ' ' + (tip[1] + 74) + 'Z';
    var umb = '<path d="M' + hand[0] + ' ' + hand[1] + 'L' + (tip[0] + 6) + ' ' + (tip[1] + 30) + '" stroke="#05070D" stroke-width="5"/><path d="' + canopy + '" fill="#0A0E18"/>' +
      '<path d="' + canopy + '" fill="none" stroke="#FFCF8A" stroke-width="1.5" opacity=".5"/>';
    var d = sky(p, [[0, '#04060E'], [0.6, '#0E1428'], [1, '#141A2E']]) + blur(p + 'bk', 6) + blur(p + 'rf', 3) + rad(p + 'lamp', [[0, '#FFE2A0', 0.6], [1, '#FFE2A0', 0]]) +
      lin(p + 'gr', [[0, '#1A2034'], [1, '#05070D']]);
    var refl = '<g opacity=".28" filter="url(#' + p + 'rf)" transform="translate(0 ' + (gy * 2) + ') scale(1 -1)">' + adult + child + umb + '</g>';
    return svg('umbrella',
      '<rect width="1600" height="900" fill="url(#' + p + 'sky)"/><g filter="url(#' + p + 'bk)">' + bok + '</g>' +
      '<rect x="560" y="250" width="8" height="510" fill="#05070D"/><path d="M546 252H584L576 236H554Z" fill="#05070D"/><circle cx="564" cy="258" r="150" fill="url(#' + p + 'lamp)" class="lampglow"/>' +
      '<rect y="' + gy + '" width="1600" height="140" fill="url(#' + p + 'gr)"/>' + refl +
      adult + child + umb +
      '<g class="rain" stroke="#C9D8F2" stroke-width="1.5" opacity=".35">' + rain + '</g>', d);
  };

  /* ════════ 병원 복도 — 긴 의자의 보호자 ════════ */
  ART.hall = function () {
    var p = 'hl2-', vx = 1120, vy = 420, lights = '', doors = '';
    for (var i = 0; i < 9; i++) {
      var t0 = Math.pow(i / 9, 1.6), t1 = t0 + 0.03 * (1 - t0);
      var a = function (t, x0) { return lerp(x0, vx, t); }, b = function (t, y0) { return lerp(y0, vy, t); };
      lights += '<path d="M' + r1(a(t0, 400)) + ' ' + r1(b(t0, 0)) + 'L' + r1(a(t1, 400)) + ' ' + r1(b(t1, 0)) + 'L' + r1(a(t1, 1500)) + ' ' + r1(b(t1, 0)) + 'L' + r1(a(t0, 1500)) + ' ' + r1(b(t0, 0)) + 'Z" fill="#EAF6F2" opacity="' + (0.9 - i * 0.07).toFixed(2) + '"/>';
      var u0 = Math.pow((i + 0.3) / 9, 1.6), u1 = Math.pow((i + 0.75) / 9, 1.6);
      doors += '<path d="M' + r1(a(u0, 1600)) + ' ' + r1(b(u0, 60)) + 'L' + r1(a(u1, 1600)) + ' ' + r1(b(u1, 60)) + 'L' + r1(a(u1, 1600)) + ' ' + r1(b(u1, 860)) + 'L' + r1(a(u0, 1600)) + ' ' + r1(b(u0, 860)) + 'Z" fill="#0E2026" opacity=".75"/>';
    }
    var chairs = '';
    for (var c = 0; c < 4; c++) { var x = 520 + c * 96; chairs += '<rect x="' + x + '" y="640" width="80" height="12" rx="4"/><rect x="' + (x + 6) + '" y="560" width="68" height="80" rx="8"/><rect x="' + (x + 36) + '" y="652" width="8" height="60"/>'; }
    var d = lin(p + 'fl', [[0, '#6A8A86'], [1, '#0A1416']]) + lin(p + 'wall', [[0, '#1A2E32'], [1, '#2E4A4C']], 0, 0, 1, 0) + rad(p + 'win', [[0, '#FFFFFF'], [0.3, '#FFF2CC'], [1, '#FFF2CC', 0]]) +
      lin(p + 'ce', [[0, '#0E1A1C'], [1, '#2A4040']]) + blur(p + 'fb', 4);
    return svg('hall',
      '<rect width="1600" height="900" fill="#0C1618"/>' +
      '<path d="M0 0H1600L' + vx + ' ' + vy + 'Z" fill="url(#' + p + 'ce)"/><path d="M0 0L' + vx + ' ' + vy + 'L0 900Z" fill="url(#' + p + 'wall)"/>' +
      '<path d="M1600 0L' + vx + ' ' + vy + 'L1600 900Z" fill="#203638"/><path d="M0 900L' + vx + ' ' + vy + 'L1600 900Z" fill="url(#' + p + 'fl)"/>' +
      lights + doors +
      '<rect x="' + (vx - 70) + '" y="' + (vy - 80) + '" width="140" height="150" fill="#FFF8E6"/><circle cx="' + vx + '" cy="' + vy + '" r="260" fill="url(#' + p + 'win)" opacity=".6"/>' +
      '<path d="M' + (vx - 70) + ' ' + (vy + 70) + 'L640 900H1420L' + (vx + 70) + ' ' + (vy + 70) + 'Z" fill="#FFF2CC" opacity=".08"/>' +
      '<path d="M0 560L' + (vx - 70) + ' ' + (vy + 40) + '" stroke="#5A7A78" stroke-width="4" opacity=".35"/>' +
      '<g fill="#081012">' + chairs + '</g>' +
      person(648, 642, 260, 'sitSide', { fill: '#081012', slump: true, hat: false, rim: ['#CFE6E2', 1.2, 0, 0.35] }), d);
  };

  /* ════════ 빈 의자의 아침 — D 다음 날 ════════
     아침 햇살이 식탁을 가로지릅니다. 한 사람은 잔을 두 손으로 감싸고, 맞은편 의자는 비어 있습니다. */
  ART.chair = function () {
    var p = 'ch-';
    var ry = rays(p, 1500, 120, 10, 1500, 150, 175, '#FFE6B4', 0.35, 7);
    var chair = function (x, y, flip) { var k = flip ? -1 : 1; return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ' 1)" fill="#1A120C"><path d="M-8 0V-270Q-8 -282 4 -282H10Q20 -282 18 -270L12 -130H118V-114H14V0Z"/><rect x="100" y="-114" width="14" height="114"/>' +
      '<path d="M-8 -270H18" stroke="#FFDDA8" stroke-width="2" opacity=".35"/><path d="M12 -130H118" stroke="#FFDDA8" stroke-width="2" opacity=".3"/></g>'; };
    var cup = function (x, y, steam) {
      return '<path d="M' + (x - 22) + ' ' + (y - 42) + 'H' + (x + 22) + 'L' + (x + 18) + ' ' + y + 'H' + (x - 18) + 'Z" fill="#E9E1D2"/><path d="M' + (x + 22) + ' ' + (y - 34) + 'q16 4 0 22" fill="none" stroke="#E9E1D2" stroke-width="5"/>' +
        (steam ? '<g class="steam" stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".5"><path d="M' + (x - 6) + ' ' + (y - 50) + 'c-14 -20 14 -30 0 -54"/><path d="M' + (x + 8) + ' ' + (y - 50) + 'c14 -22 -12 -30 4 -60"/></g>' : '');
    };
    var d = lin(p + 'wall', [[0, '#2A2018'], [1, '#120D0A']]) + lin(p + 'win', [[0, '#FFF6E0'], [1, '#FFD9A0']]) + ry.defs + rad(p + 'pool', [[0, '#FFE6B4', 0.35], [1, '#FFE6B4', 0]]);
    return svg('chair',
      '<rect width="1600" height="900" fill="url(#' + p + 'wall)"/>' +
      '<rect x="1300" y="90" width="250" height="360" fill="url(#' + p + 'win)"/><path d="M1425 90V450M1300 270H1550" stroke="#2A2018" stroke-width="10"/><rect x="1290" y="80" width="270" height="380" fill="none" stroke="#1A130E" stroke-width="16"/>' +
      ry.body + '<ellipse cx="900" cy="640" rx="520" ry="80" fill="url(#' + p + 'pool)"/>' +
      '<rect y="760" width="1600" height="140" fill="#0A0706"/>' +
      chair(1240, 760, true) +
      person(640, 760, 330, 'sitSide', { fill: '#0E0A08', reach: true, rim: ['#FFDDA8', 1.6, 0, 0.6] }) +
      '<rect x="560" y="615" width="760" height="18" fill="#140E0A"/><rect x="590" y="633" width="14" height="127" fill="#140E0A"/><rect x="1280" y="633" width="14" height="127" fill="#140E0A"/>' +
      '<rect x="560" y="613" width="760" height="3" fill="#FFDDA8" opacity=".35"/>' +
      cup(730, 613, true) + cup(1150, 613, false) +
      '<g transform="translate(1390 760)"><path d="M-46 0V-74Q-46 -98 -20 -100H20Q46 -98 46 -74V0Z" fill="#22304A"/><path d="M-30 -100Q-30 -126 0 -126 30 -126 30 -100" fill="none" stroke="#22304A" stroke-width="7"/>' +
      '<rect x="-32" y="-60" width="64" height="34" rx="6" fill="#1A2438"/><path d="M-46 -74Q-46 -98 -20 -100" stroke="#FFDDA8" stroke-width="2" fill="none" opacity=".4"/></g>' +
      motes(131, 50, 900, 1500, 120, 600, '#FFF0CC', 1.4, 0.6), d);
  };

  /* ════════ 마주 앉은 두 개의 찻잔 — 4부 · 팩트파인딩 ════════ */
  ART.tea = function () {
    var p = 'te-', r = rnd(141), bok = '', drops = '';
    for (var i = 0; i < 40; i++) bok += '<circle cx="' + r1(200 + r() * 1300) + '" cy="' + r1(60 + r() * 420) + '" r="' + r1(10 + r() * 34) + '" fill="' + (r() > 0.5 ? '#FFC77A' : '#7FA2D8') + '" opacity="' + (0.1 + r() * 0.25).toFixed(2) + '"/>';
    for (var k = 0; k < 70; k++) drops += '<ellipse cx="' + r1(160 + r() * 1300) + '" cy="' + r1(50 + r() * 440) + '" rx="' + r1(1.5 + r() * 3) + '" ry="' + r1(2.5 + r() * 5) + '"/>';
    var cup = function (x, k, flip) {
      var f = flip ? -1 : 1;
      return '<g transform="translate(' + x + ' 690) scale(' + (k * f) + ' ' + k + ')">' +
        '<ellipse cx="0" cy="18" rx="150" ry="26" fill="#1E1612"/><ellipse cx="0" cy="12" rx="140" ry="22" fill="url(#' + p + 'sa)"/>' +
        '<path d="M-96 -96Q-96 10 -40 14H40Q96 10 96 -96Z" fill="url(#' + p + 'po)"/><ellipse cx="0" cy="-96" rx="96" ry="18" fill="#F6EFE2"/><ellipse cx="0" cy="-93" rx="84" ry="13" fill="#7A4A26"/>' +
        '<path d="M94 -70C150 -76 150 -10 84 -18" fill="none" stroke="#E6DCCB" stroke-width="12"/></g>';
    };
    var d = lin(p + 'bg', [[0, '#1A1420'], [1, '#2A1E1A']]) + lin(p + 'tb', [[0, '#4A3222'], [1, '#140C08']]) + lin(p + 'po', [[0, '#C9BFAE'], [0.4, '#F6EFE2'], [1, '#A89C88']], 0, 0, 1, 0) +
      lin(p + 'sa', [[0, '#F2EADC'], [1, '#B8AC98']]) + blur(p + 'bk', 10) + rad(p + 'lamp', [[0, '#FFD08A', 0.45], [1, '#FFD08A', 0]]);
    return svg('tea',
      '<rect width="1600" height="900" fill="url(#' + p + 'bg)"/><rect x="140" y="40" width="1360" height="480" fill="#0E1426"/>' +
      '<g filter="url(#' + p + 'bk)">' + bok + '</g><g fill="#CFE0FF" opacity=".28">' + drops + '</g>' +
      '<path d="M140 40H1500V520H140Z" fill="none" stroke="#120C0A" stroke-width="26"/><path d="M820 40V520" stroke="#120C0A" stroke-width="16"/>' +
      '<circle cx="1420" cy="560" r="420" fill="url(#' + p + 'lamp)"/>' +
      '<path d="M0 600H1600V900H0Z" fill="url(#' + p + 'tb)"/><path d="M0 600H1600" stroke="#8A5A36" stroke-width="3" opacity=".6"/>' +
      cup(820, 1, false) + cup(1300, 0.9, true) +
      '<g class="steam" stroke="#FFFFFF" stroke-width="4" fill="none" opacity=".45"><path d="M820 580C780 520 880 500 860 430 846 380 930 360 990 330"/><path d="M1300 590C1340 530 1250 500 1270 440 1286 390 1180 370 1100 330"/><path d="M840 570C860 520 820 480 850 430"/></g>', d);
  };

  /* ════════ 편지와 촛불 — 나의 마지막 하루 ════════ */
  ART.letter = function () {
    var p = 'lt-', ink = '', r = rnd(151);
    for (var i = 0; i < 9; i++) { var y = 470 + i * 26, x0 = 900, x1 = 1210 - (i === 8 ? 140 : r() * 40), dd = 'M' + x0 + ' ' + y; for (var x = x0; x < x1; x += 18) dd += 'q4 ' + r1(-4 - r() * 4) + ' 9 0q5 ' + r1(4 + r() * 3) + ' 9 0'; ink += '<path d="' + dd + '"/>'; }
    var d = lin(p + 'bg', [[0, '#07060A'], [1, '#17110C']]) + rad(p + 'glow', [[0, '#FFC772', 0.7], [0.4, '#FF9A40', 0.25], [1, '#FF9A40', 0]]) +
      lin(p + 'wax', [[0, '#C9B898'], [0.45, '#F6EDDA'], [1, '#B8A684']], 0, 0, 1, 0) + lin(p + 'pa', [[0, '#F2E8D2'], [1, '#D8C8A6']]) + blur(p + 'b3', 3);
    return svg('letter',
      '<rect width="1600" height="900" fill="url(#' + p + 'bg)"/><circle class="halo" cx="1340" cy="330" r="560" fill="url(#' + p + 'glow)"/>' +
      '<path d="M0 690H1600V900H0Z" fill="#1A120B"/><rect y="690" width="1600" height="4" fill="#5A3A20" opacity=".7"/>' +
      '<g transform="rotate(-5 1060 600)"><rect x="870" y="420" width="380" height="300" fill="url(#' + p + 'pa)"/><g stroke="#3A2C1E" stroke-width="2.4" fill="none" opacity=".7">' + ink + '</g></g>' +
      '<g transform="rotate(8 760 700)"><rect x="660" y="640" width="230" height="140" fill="#D9CBAA"/><path d="M660 640 775 712 890 640" fill="none" stroke="#B8A57E" stroke-width="3"/></g>' +
      '<path d="M1180 760 1430 676" stroke="#0E0E10" stroke-width="10" stroke-linecap="round"/><path d="M1172 763 1190 757" stroke="#C9A24A" stroke-width="6"/>' +
      '<g class="candle"><ellipse cx="1340" cy="692" rx="70" ry="12" fill="#2A1A10"/><rect x="1304" y="410" width="72" height="282" rx="6" fill="url(#' + p + 'wax)"/>' +
      '<path d="M1304 440C1318 452 1326 440 1334 470V520M1376 432C1366 452 1372 470 1360 486" stroke="#E8DCC0" stroke-width="7" fill="none"/>' +
      '<line x1="1340" y1="410" x2="1340" y2="390" stroke="#222" stroke-width="3"/>' +
      '<path class="flame" d="M1340 322C1357 348 1363 366 1357 382 1353 392 1347 396 1340 396S1327 392 1323 382C1317 366 1323 348 1340 322Z" fill="#FFB547"/>' +
      '<path class="flame in" d="M1340 352C1348 364 1350 374 1347 382 1345 386 1343 388 1340 388S1335 386 1333 382C1330 374 1332 364 1340 352Z" fill="#FFF2C6"/></g>' +
      '<g class="smoke" stroke="#B9B2A4" stroke-width="2" fill="none" opacity=".22"><path d="M1340 314C1322 270 1360 240 1340 190C1328 156 1352 130 1342 90"/></g>', d);
  };

  /* ════════ 메멘토 모리 — 정물(해골 · 책 · 모래시계 · 꺼져 가는 촛불 · 흰 국화) ════════
     옛 바니타스 정물의 차림을 따랐습니다. 빛은 오른쪽 촛불에서 — 해골의 왼쪽은 어둠에 잠깁니다. */
  ART.vanitas = function () {
    var p = 'vn-';
    var petals = '';
    for (var i = 0; i < 18; i++) petals += '<ellipse cx="0" cy="-20" rx="6" ry="20" fill="#EEE8DA" transform="rotate(' + (i * 20) + ')"/>';
    for (var j = 0; j < 12; j++) petals += '<ellipse cx="0" cy="-12" rx="4.5" ry="12" fill="#DAD2C0" transform="rotate(' + (j * 30 + 15) + ')"/>';
    var teeth = '';
    [[378, 13], [393, 16], [408, 19], [424, 21], [440, 21], [456, 19], [471, 16], [486, 13]].forEach(function (t) {
      teeth += '<path d="M' + (t[0] - 6.8) + ' 558H' + (t[0] + 6.8) + 'V' + (558 + t[1] - 5) + 'Q' + t[0] + ' ' + (558 + t[1] + 2) + ' ' + (t[0] - 6.8) + ' ' + (558 + t[1] - 5) + 'Z" fill="url(#' + p + 'th)" opacity=".92"/>';
    });
    /* 눈구멍 — 둥근 구멍이 아니라 위가 평평하고 바깥 아래로 처진 모서리 진 구멍 */
    var sock = function (cx, f) {
      var P = function (dx, dy) { return r1(cx + dx * f) + ' ' + dy; };
      return '<path d="M' + P(-30, 408) + 'C' + P(-20, 398) + ' ' + P(4, 396) + ' ' + P(20, 400) + ' ' + P(32, 404) + ' ' + P(38, 414) + ' ' + P(37, 428) + ' ' + P(36, 446) + ' ' + P(28, 462) + ' ' + P(12, 466) + ' ' + P(-6, 468) + ' ' + P(-24, 462) + ' ' + P(-32, 448) + ' ' + P(-38, 432) + ' ' + P(-37, 418) + ' ' + P(-30, 408) + 'Z" fill="url(#' + p + 'so)"/>' +
        '<path d="M' + P(-34, 412) + 'C' + P(-22, 396) + ' ' + P(6, 392) + ' ' + P(24, 396) + ' ' + P(36, 400) + ' ' + P(42, 412) + ' ' + P(41, 424) + '" fill="none" stroke="#2E2216" stroke-width="6" opacity=".5"/>';
    };
    var d = rad(p + 'spot', [[0, '#5A4128', 0.8], [0.55, '#2A1D12', 0.4], [1, '#0A0705', 0]], 0.42, 0.32, 0.75) +
      rad(p + 'bone', [[0, '#FBF3E2'], [0.45, '#D8C9A6'], [0.8, '#7E6E52'], [1, '#2E2618']], 0.66, 0.3, 0.8) +
      rad(p + 'so', [[0, '#030201'], [0.55, '#0E0905'], [0.85, '#2A2016'], [1, '#5A4A34']], 0.5, 0.42, 0.62) + lin(p + 'th', [[0, '#EAE0C8'], [1, '#9C8C6C']]) +
      lin(p + 'table', [[0, '#2A1B10'], [1, '#0C0805']]) + rad(p + 'flame', [[0, '#FFD07A', 0.65], [0.5, '#FF9A40', 0.2], [1, '#FF9A40', 0]]) +
      lin(p + 'glass', [[0, '#C9DDF2', 0.22], [0.5, '#FFFFFF', 0.08], [1, '#C9DDF2', 0.04]], 0, 0, 1, 0) +
      lin(p + 'wax', [[0, '#B8A684'], [0.6, '#F2E8D2'], [1, '#D8CBAE']], 0, 0, 1, 0) + lin(p + 'shade', [[0, '#000000', 0.75], [0.55, '#000000', 0.1], [1, '#000000', 0]], 0, 0, 1, 0) +
      lin(p + 'bk1', [[0, '#3A1E12'], [1, '#5A2E1C']], 0, 0, 0, 1) + blur(p + 'b4', 4) + blur(p + 'b12', 12);
    return svg('vanitas',
      '<rect width="1600" height="900" fill="#080504"/><rect width="1600" height="900" fill="url(#' + p + 'spot)"/>' +
      '<rect y="690" width="1600" height="210" fill="url(#' + p + 'table)"/><rect y="690" width="1600" height="4" fill="#5A3A20" opacity=".8"/>' +
      '<circle class="halo" cx="700" cy="300" r="380" fill="url(#' + p + 'flame)"/>' +
      /* 책 두 권 */
      '<rect x="200" y="614" width="520" height="78" fill="url(#' + p + 'bk1)"/><rect x="214" y="622" width="494" height="62" fill="#D9CCA8" opacity=".85"/><path d="M214 634H708M214 648H708M214 662H708M214 676H708" stroke="#B8A880" stroke-width="1" opacity=".6"/><rect x="200" y="614" width="22" height="78" fill="#24120A"/>' +
      '<rect x="232" y="566" width="456" height="50" fill="#2C283A"/><rect x="244" y="572" width="432" height="38" fill="#CFC2A0" opacity=".8"/><path d="M244 584H676M244 596H676" stroke="#A89A78" stroke-width="1" opacity=".6"/><rect x="232" y="566" width="20" height="50" fill="#1A1724"/>' +
      /* 촛불 — 해골 오른쪽 뒤, 반쯤 탔고 촛농이 흘렀습니다 */
      '<g class="candle"><rect x="670" y="340" width="60" height="276" fill="url(#' + p + 'wax)"/><path d="M670 360C684 372 690 360 698 392V450M730 352C718 370 724 384 712 404" stroke="#EAE0C8" stroke-width="7" fill="none"/>' +
      '<line x1="700" y1="340" x2="700" y2="320" stroke="#1A1A1A" stroke-width="3"/>' +
      '<path class="flame" d="M700 250C715 274 721 290 716 305 713 314 707 318 700 318S687 314 684 305C679 290 685 274 700 250Z" fill="#FFB547"/>' +
      '<path class="flame in" d="M700 278C707 288 709 296 706 303 705 306 703 308 700 308S695 306 694 303C691 296 693 288 700 278Z" fill="#FFF2C6"/></g>' +
      '<g class="smoke" stroke="#BDB5A6" stroke-width="2.4" fill="none" opacity=".26"><path d="M700 242C680 200 724 172 702 128C686 96 716 70 702 30"/><path d="M702 238C730 196 692 166 720 120"/></g>' +
      /* 해골 — 앞에서 본 머리뼈(아래턱 없이). 빛은 오른쪽 촛불에서 */
      '<g class="skull"><ellipse cx="440" cy="572" rx="170" ry="12" fill="#000" opacity=".55"/>' +
      '<path d="M432 254C524 254 588 322 588 412 588 452 576 472 562 490 558 512 550 530 534 542L522 568H342L330 542C314 530 306 512 302 490 288 472 276 452 276 412 276 322 340 254 432 254Z" fill="url(#' + p + 'bone)"/>' +
      '<path d="M276 412C276 322 340 254 432 254 380 270 340 330 338 410 336 460 350 500 372 530L342 568 330 542C314 530 306 512 302 490 288 472 276 452 276 412Z" fill="#1E170E" opacity=".55"/>' +
      '<path d="M432 254C524 254 588 322 588 412 588 452 576 472 562 490 558 512 550 530 534 542L522 568H342L330 542C314 530 306 512 302 490 288 472 276 452 276 412 276 322 340 254 432 254Z" fill="url(#' + p + 'shade)"/>' +
      sock(386, 1) + sock(478, -1) +
      '<path d="M334 406C350 388 372 380 396 382M532 406C516 388 494 380 470 382" stroke="#FFF6E0" stroke-width="5" fill="none" opacity=".35" filter="url(#' + p + 'b4)"/>' +
      '<path d="M433 484C424 500 418 512 421 523 424 530 430 528 433 521 436 528 442 530 445 523 448 512 442 500 433 484Z" fill="#0C0805"/>' +
      '<path d="M300 470C318 452 342 444 360 452M566 470C548 452 524 444 506 452" stroke="#2A2014" stroke-width="9" fill="none" opacity=".35" filter="url(#' + p + 'b4)"/>' +
      '<path d="M318 486C334 498 352 504 372 502M494 502C514 504 532 498 548 486" stroke="#3A2E1E" stroke-width="5" fill="none" opacity=".55"/>' +
      '<path d="M344 552C380 546 486 546 520 552" stroke="#2A2014" stroke-width="3" fill="none" opacity=".7"/>' + teeth +
      '<path d="M372 290C390 310 384 330 372 342M420 262C426 280 444 292 470 290C494 288 506 300 510 316" stroke="#5A4A34" stroke-width="2.2" fill="none" opacity=".55"/>' +
      '<path d="M500 300C540 320 566 360 572 410" stroke="#FFF8EA" stroke-width="10" fill="none" opacity=".25" filter="url(#' + p + 'b4)"/></g>' +
      /* 모래시계 */
      '<g class="glass" transform="translate(900 380)"><rect x="-92" y="0" width="184" height="16" rx="5" fill="#5A3A1E"/><rect x="-92" y="294" width="184" height="16" rx="5" fill="#5A3A1E"/>' +
      '<rect x="-86" y="16" width="9" height="278" fill="#3E2812"/><rect x="77" y="16" width="9" height="278" fill="#3E2812"/>' +
      '<path d="M-62 18H62C62 84 14 124 8 155 14 186 62 226 62 292H-62C-62 226-14 186-8 155-14 124-62 84-62 18Z" fill="url(#' + p + 'glass)" stroke="#D9E6F5" stroke-opacity=".35" stroke-width="2"/>' +
      '<path class="sandTop" d="M-52 34H52C46 80 16 110 0 150-16 110-46 80-52 34Z" fill="#D9AE5E"/>' +
      '<line class="stream" x1="0" y1="152" x2="0" y2="284" stroke="#D9AE5E" stroke-width="2.6" stroke-dasharray="4 5"/>' +
      '<path class="sandBot" d="M-56 290C-44 248-14 230 0 226 14 230 44 248 56 290Z" fill="#D9AE5E"/>' +
      '<path d="M-48 30C-46 80-20 120-6 150" stroke="#FFFFFF" stroke-width="3" opacity=".18" fill="none"/></g>' +
      /* 흰 국화 — 누운 채로 */
      '<path d="M1060 700C1140 690 1240 694 1330 704" stroke="#2E3A20" stroke-width="5" fill="none"/>' +
      '<path d="M1180 692C1196 676 1214 676 1226 690M1270 698C1284 684 1300 686 1310 700" stroke="#2E3A20" stroke-width="4" fill="#3A4A28"/>' +
      '<g transform="translate(1050 690) scale(1.3)">' + petals + '<circle r="6.5" fill="#D9C88A"/></g>', d);
  };

  /* ════════ 여든 번째 생일 식탁 — 상상: 여든 살의 나 ════════ */
  ART.eighty = function () {
    var p = 'ei-';
    var tblY = 640, cake = '<rect x="760" y="' + (tblY - 70) + '" width="120" height="70" rx="6" fill="#F2E6D2"/><rect x="760" y="' + (tblY - 70) + '" width="120" height="14" rx="6" fill="#FFFFFF" opacity=".7"/>';
    for (var i = 0; i < 7; i++) { var x = 772 + i * 16; cake += '<rect x="' + (x - 2) + '" y="' + (tblY - 96) + '" width="4" height="26" fill="#E6D2F0"/><path class="flame" d="M' + x + ' ' + (tblY - 112) + 'c5 7 5 12 0 14c-5 -2 -5 -7 0 -14z" fill="#FFD27A"/>'; }
    var rim = ['#FFC27A', 0, -1.5, 0.75];
    var ppl = person(520, 806, 470, 'seatFront', { fill: '#0C0806', rim: rim, hair: 'long' }) + person(672, 800, 450, 'seatFront', { fill: '#0C0806', rim: rim }) +
      person(968, 770, 330, 'seatFront', { fill: '#0C0806', rim: rim, child: true, hair: 'tail' }) + person(1108, 806, 470, 'seatFront', { fill: '#0C0806', rim: rim });
    var d = lin(p + 'wall', [[0, '#1E140E'], [1, '#0C0806']]) + rad(p + 'glow', [[0, '#FFC27A', 0.8], [0.35, '#FF9A50', 0.3], [1, '#FF9A50', 0]]) + lin(p + 'win', [[0, '#0E1830'], [1, '#22304E']]) +
      lin(p + 'tb', [[0, '#3A2416'], [1, '#120A06']]);
    return svg('eighty',
      '<rect width="1600" height="900" fill="url(#' + p + 'wall)"/>' +
      '<rect x="1220" y="120" width="280" height="340" fill="url(#' + p + 'win)"/>' + stars(161, 30, 0, 0) + '<g fill="#FFFFFF" opacity=".7">' + motes(162, 30, 1230, 1490, 130, 450, '#FFFFFF', 1.6, 0.8) + '</g>' +
      '<path d="M1360 120V460M1220 290H1500" stroke="#120C08" stroke-width="10"/><rect x="1210" y="110" width="300" height="360" fill="none" stroke="#0C0806" stroke-width="16"/>' +
      '<circle cx="820" cy="' + (tblY - 100) + '" r="560" fill="url(#' + p + 'glow)"/>' + ppl +
      '<path d="M380 ' + tblY + 'H1260L1320 720H320Z" fill="url(#' + p + 'tb)"/><rect x="320" y="720" width="1000" height="14" fill="#0C0806"/>' +
      '<path d="M380 ' + tblY + 'H1260" stroke="#FFC27A" stroke-width="2" opacity=".35"/>' + cake +
      person(1420, 790, 420, 'sitSide', { fill: '#0C0806', flip: true, reach: true, rim: ['#FFC27A', -1.6, 0, 0.8], hair: 'bun' }) +
      '<rect y="790" width="1600" height="110" fill="#080503"/>', d);
  };

  /* ════════ 어린 나와 마주 앉다 — 상상: 열 살의 나 ════════ */
  ART.child = function () {
    var p = 'cd-';
    var L = [{ seed: 171, y: 640, amp: 80, freq: 2.0, sharp: 1.2, color: '#C9876E', fh: 50 }, { seed: 172, y: 690, amp: 60, freq: 2.8, sharp: 1.0, color: '#8A5248', fh: 60 }, { seed: 173, y: 900, amp: 160, freq: 1.0, sharp: 0.8, color: '#22140E', fog: false }];
    var rg = range(p, L, '#FFD6A0', 0.45), cl = clouds(p, 174, 14, 220, 460, '#FFE4B4', '#B4686A', 0.55);
    var gy = function (x) { return ridgeY(173, 900, 160, 1.0, 0.8, 5, x) + 4; };
    var xa = 930, xc = 1110, ya = gy(xa), yc = gy(xc), ha = 300, hc = 190;
    var touch = [1022, Math.min(ya, yc) - 106];
    var d = sky(p, [[0, '#2A2244'], [0.4, '#8A5070'], [0.6, '#F2A070'], [0.68, '#FFE0A0']]) + sunDefs(p, '#FFC878') + rg.defs + cl.defs;
    return svg('child',
      '<rect width="1600" height="900" fill="url(#' + p + 'sky)"/>' + cl.body + sun(p, 1020, 600, 48, '#FFF6DC', '#FFC878', 620) + rg.body +
      person(xa, ya, ha, 'kneel', { fill: '#140C08', reachTo: toU(xa, ya, ha, touch), bend: 1, rim: ['#FFD6A0', 1.6, 0, 0.85] }) +
      person(xc, yc, hc, 'child', { fill: '#140C08', flip: true, walk: false, reachTo: toU(xc, yc, hc, touch, true), bend: 1, rim: ['#FFD6A0', -1.6, 0, 0.85], hair: 'tail' }) +
      grass(175, L[2], 520, '#140C08', 14, 46, 3) +
      motes(176, 46, 600, 1500, 380, 760, '#FFF4DA', 2.2, 0.75), d);
  };

  /* ════════ 고객님의 현관 앞 — 상상: 초인종을 누르기 전 3초 ════════ */
  ART.door = function () {
    var p = 'dr-';
    var d = lin(p + 'wall', [[0, '#1E2632'], [1, '#0C1016']]) + lin(p + 'dr', [[0, '#3A2E26'], [1, '#2A201A']], 0, 0, 1, 0) + rad(p + 'ceil', [[0, '#FFF2D0', 0.7], [1, '#FFF2D0', 0]]) +
      lin(p + 'leak', [[0, '#FFD08A', 0.9], [1, '#FFD08A', 0]]) + lin(p + 'fl', [[0, '#2A3038'], [1, '#0A0C10']]) + blur(p + 'b5', 5);
    return svg('door',
      '<rect width="1600" height="900" fill="url(#' + p + 'wall)"/>' +
      '<ellipse cx="1060" cy="120" rx="80" ry="16" fill="#FFF8E6"/><circle cx="1060" cy="140" r="520" fill="url(#' + p + 'ceil)"/>' +
      '<rect x="940" y="250" width="250" height="520" fill="#0A0C10"/><rect x="952" y="262" width="226" height="508" fill="url(#' + p + 'dr)"/>' +
      '<rect x="980" y="300" width="170" height="200" rx="6" fill="none" stroke="#1A140F" stroke-width="5"/><rect x="980" y="530" width="170" height="200" rx="6" fill="none" stroke="#1A140F" stroke-width="5"/>' +
      '<circle cx="1065" cy="380" r="5" fill="#C9A24A"/><rect x="1146" y="510" width="16" height="60" rx="5" fill="#C9A24A"/>' +
      '<rect x="952" y="764" width="226" height="6" fill="#FFD08A"/><path d="M952 770H1178L1250 860H880Z" fill="url(#' + p + 'leak)" opacity=".35" filter="url(#' + p + 'b5)"/>' +
      '<rect x="1214" y="470" width="30" height="46" rx="4" fill="#1A1E26"/><circle cx="1229" cy="500" r="7" fill="#FFE6A8" class="hope h1"/>' +
      '<rect y="770" width="1600" height="130" fill="url(#' + p + 'fl)"/><rect x="920" y="776" width="290" height="26" rx="4" fill="#1A1A20"/>' +
      person(760, 790, 380, 'stand', { fill: '#06080C', bag: true, reachF: [0.25, -0.62], rim: ['#FFE8C0', 0, -1.4, 0.6] }), d);
  };

  /* ════════ 부모님과 걷는 강가 — 상상: 부모님의 손 ════════ */
  ART.parents = function () {
    var p = 'pr-';
    var L = [{ seed: 181, y: 560, amp: 70, freq: 2.0, sharp: 1.2, color: '#8E6A84', fh: 40 }, { seed: 182, y: 590, amp: 40, freq: 3.4, sharp: 1.0, color: '#5A4260', fog: false }];
    var rg = range(p, L, '#FFC9A6', 0.4), cl = clouds(p, 183, 16, 220, 440, '#FFD6B0', '#8A4E6E', 0.7);
    var r = rnd(184), refl = '';
    for (var i = 0; i < 22; i++) refl += '<rect x="' + r1(1180 - 140 + r() * 60 - i * 3) + '" y="' + r1(600 + i * i * 0.5) + '" width="' + r1(200 - i * 6 + r() * 40) + '" height="2" fill="#FFE2B0" opacity="' + (0.7 - i * 0.03).toFixed(2) + '"/>';
    var gyv = 790, xe = 1010, xa = 1092, he = 250, ha = 290, arm = [1050, 640];
    var d = sky(p, [[0, '#1E1A3A'], [0.4, '#6A3E66'], [0.58, '#E28A6E'], [0.64, '#FFD29A']]) + sunDefs(p, '#FFC07A') + rg.defs + cl.defs + lin(p + 'rv', [[0, '#E8A07A'], [1, '#2A1A2A']]);
    return svg('parents',
      '<rect width="1600" height="900" fill="url(#' + p + 'sky)"/>' + cl.body + sun(p, 1180, 572, 40, '#FFF2D6', '#FFC07A', 520) + rg.body +
      '<rect y="596" width="1600" height="140" fill="url(#' + p + 'rv)"/>' + refl +
      '<path d="M0 760C300 740 700 770 1000 776 1300 782 1500 770 1600 772V900H0Z" fill="#140C12"/>' +
      tree(185, 240, 770, 470, '#0C070A', 0.06) + tree(186, 1560, 780, 380, '#0C070A', -0.12) +
      shadow(xe, gyv, he, -1, 0.3) + shadow(xa, gyv, ha, -1, 0.3) +
      person(xe, gyv, he, 'elder', { fill: '#0C070A', hat: true, cane: [0.3, 0], reachF: toU(xe, gyv, he, arm), rim: ['#FFCF9A', 1.4, 0, 0.8] }) +
      person(xa, gyv, ha, 'walk', { fill: '#0C070A', reachTo: toU(xa, gyv, ha, arm), bend: -1, phase: 0.6, rim: ['#FFCF9A', 1.4, 0, 0.8] }) +
      motes(187, 40, 0, 1600, 120, 760, '#FFC24A', 2.6, 0.75), d);
  };

  /* ════════ 창가에서 걸려 온 전화 — 상상: 10년 뒤 ════════ */
  ART.window = function () {
    var p = 'wd-', r = rnd(191), city = '', wins = '';
    for (var i = 0; i < 30; i++) {
      var bx = 520 + i * 36 + r() * 10, bw = 30 + r() * 30, bh = 120 + r() * 330, by = 700 - bh;
      city += '<rect x="' + r1(bx) + '" y="' + r1(by) + '" width="' + r1(bw) + '" height="' + r1(bh) + '"/>';
      for (var k = 0; k < bh / 18 - 1; k++) for (var m = 0; m < bw / 12 - 1; m++) if (r() > 0.72) wins += '<rect x="' + r1(bx + 4 + m * 12) + '" y="' + r1(by + 8 + k * 18) + '" width="5" height="7" fill="' + (r() > 0.3 ? '#FFD08A' : '#A8C8FF') + '" opacity="' + (0.4 + r() * 0.5).toFixed(2) + '"/>';
    }
    var d = lin(p + 'sk', [[0, '#050818'], [1, '#1E2448']]) + lin(p + 'rm', [[0, '#0A0C14'], [1, '#05060A']]) + rad(p + 'ph', [[0, '#C9DCFF', 0.9], [1, '#C9DCFF', 0]]) + blur(p + 'b1', 1.2) +
      '<clipPath id="' + p + 'wc"><rect x="520" y="90" width="1000" height="610"/></clipPath>';
    return svg('window',
      '<rect width="1600" height="900" fill="url(#' + p + 'rm)"/>' +
      '<g clip-path="url(#' + p + 'wc)"><rect x="520" y="90" width="1000" height="610" fill="url(#' + p + 'sk)"/>' + stars(192, 40, 300, 0.6) +
      '<circle cx="1360" cy="210" r="40" fill="#F2EEDC" opacity=".9"/><g fill="#0A0E1E" filter="url(#' + p + 'b1)">' + city + '</g><g filter="url(#' + p + 'b1)">' + wins + '</g></g>' +
      '<path d="M520 90H1520V700H520Z" fill="none" stroke="#05060A" stroke-width="22"/><path d="M1020 90V700M520 395H1520" stroke="#05060A" stroke-width="12"/>' +
      '<path d="M420 40C470 260 450 520 480 860H360V40Z" fill="#0E1018"/>' +
      '<path d="M520 700L300 900H1600V700Z" fill="#06070C"/><path d="M560 700L460 900H1400L1340 700Z" fill="#A8C0E8" opacity=".05"/>' +
      person(900, 880, 560, 'phone', { fill: '#05060A', glow: p + 'ph', rim: ['#B8CCF0', 1.5, 0, 0.6] }), d);
  };

  /* ════════ 새벽 바다 — 상상 · 맺음: 내일 아침 첫 선택 ════════ */
  ART.sea = function () {
    var p = 'se-', r = rnd(201), waves = '', path = '';
    for (var i = 0; i < 70; i++) { var y = 570 + Math.pow(r(), 1.6) * 230, x = r() * 1600, w = 40 + (y - 560) * 0.8 * r(); waves += '<path d="M' + r1(x) + ' ' + r1(y) + 'h' + r1(w) + '"/>'; }
    for (var k = 0; k < 40; k++) { var yy = 572 + k * k * 0.14, ww = 30 + k * 6 + r() * 40; path += '<rect x="' + r1(1060 - ww / 2 + (r() - 0.5) * 20) + '" y="' + r1(yy) + '" width="' + r1(ww) + '" height="' + r1(1.6 + k * 0.05) + '" fill="#FFE2B0" opacity="' + (0.85 - k * 0.018).toFixed(2) + '"/>'; }
    var cl = clouds(p, 202, 18, 240, 500, '#FFD8B0', '#7A5A86', 0.65);
    var d = sky(p, [[0, '#0E1434'], [0.38, '#3C3E72'], [0.55, '#C2788A'], [0.62, '#FFC08A'], [0.645, '#FFE6B8']]) + sunDefs(p, '#FFC88A') + cl.defs +
      lin(p + 'sea', [[0, '#C9908C'], [0.2, '#5A5478'], [1, '#141830']]) + lin(p + 'sand', [[0, '#2A2234'], [1, '#0C0A14']]) + blur(p + 'b2', 1.5);
    return svg('sea',
      '<rect width="1600" height="900" fill="url(#' + p + 'sky)"/>' + stars(203, 60, 220, 0.6) + cl.body + sun(p, 1060, 566, 40, '#FFF6DE', '#FFC88A', 640) +
      '<rect y="568" width="1600" height="232" fill="url(#' + p + 'sea)"/><g filter="url(#' + p + 'b2)">' + path + '</g>' +
      '<g stroke="#FFE8C8" stroke-width="1.6" opacity=".35">' + waves + '</g>' +
      '<path d="M0 800C300 790 700 806 1000 798 1300 790 1500 800 1600 796V900H0Z" fill="url(#' + p + 'sand)"/>' +
      '<path d="M0 800C300 790 700 806 1000 798 1300 790 1500 800 1600 796" stroke="#FFE2B0" stroke-width="2" opacity=".4" fill="none"/>' +
      person(1060, 820, 230, 'front', { fill: '#0C0A14', rim: ['#FFD6A0', 0, -1.6, 0.85] }) +
      '<g stroke="#0C0A14" stroke-width="3" fill="none" opacity=".75"><path d="M560 300q12 -10 24 0q12 -10 24 0"/><path d="M640 270q9 -7 18 0q9 -7 18 0"/><path d="M700 330q7 -5 14 0q7 -5 14 0"/></g>', d);
  };

  /* ════════ 고객님의 자리에서 — 상상: 맞은편에 설계사가 앉아 있습니다 ════════ */
  ART.seat = function () {
    var p = 'sa-';
    var d = lin(p + 'wall', [[0, '#2A241E'], [1, '#14100C']]) + lin(p + 'win', [[0, '#FFFFFF'], [1, '#FFE8C0']]) + rad(p + 'bloom', [[0, '#FFF2D6', 0.8], [1, '#FFF2D6', 0]]) +
      lin(p + 'tb', [[0, '#5A3E28'], [1, '#1E140C']]) + lin(p + 'pa', [[0, '#F6F0E2'], [1, '#D8CCB2']]);
    return svg('seat',
      '<rect width="1600" height="900" fill="url(#' + p + 'wall)"/>' +
      '<rect x="760" y="80" width="560" height="460" fill="url(#' + p + 'win)"/><path d="M1040 80V540M760 310H1320" stroke="#3A3028" stroke-width="10"/>' +
      '<circle cx="1040" cy="320" r="520" fill="url(#' + p + 'bloom)" opacity=".7"/>' +
      '<path d="M700 60C740 260 720 460 760 600H640V60Z" fill="#1A1410"/><path d="M1380 60C1340 260 1360 460 1320 600H1440V60Z" fill="#1A1410"/>' +
      tree(211, 1460, 640, 220, '#14100C', 0) +
      person(1040, 790, 600, 'seatFront', { fill: '#100C08', rim: ['#FFF0D0', 0, -2, 0.9] }) +
      '<path d="M0 640H1600V900H0Z" fill="url(#' + p + 'tb)"/><path d="M0 640H1600" stroke="#8A6A48" stroke-width="3" opacity=".6"/>' +
      '<g transform="rotate(-4 760 760)"><rect x="560" y="700" width="380" height="150" fill="url(#' + p + 'pa)"/><path d="M590 730H900M590 756H880M590 782H860M590 808H820" stroke="#9A8C70" stroke-width="4" opacity=".55"/></g>' +
      '<path d="M980 830 1180 760" stroke="#121012" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="M1300 760H1380L1372 836H1308Z" fill="#E9E1D2"/><path d="M1380 776q20 6 0 34" fill="none" stroke="#E9E1D2" stroke-width="6"/>' +
      '<g class="steam" stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".45"><path d="M1330 750c-14 -20 14 -30 0 -54"/><path d="M1352 750c14 -22 -12 -30 4 -60"/></g>', d);
  };

  window.BCD_ART = ART;
  window.BCD_ART_NAMES = Object.keys(ART);
  window.BCD_ART_KIT = { person: person, tree: tree, ridge: ridge };
})();
