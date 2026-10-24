/* ════════════════════════════════════════════════════════════════
   B·C·D 영업 강의 — 장면 그림 (판 X186 · 2026-10-24)

   사장님 말씀 — 「근데 내용 / 이미지가 너무 허접해 감동도 없고」.
   장 하나를 화면 가득 채우는 <b>장면</b>으로 다시 그렸습니다 — 새벽 길 · 인생의 하루 ·
   차에서 내리지 못하는 밤 · 빛이 쏟아지는 계단 · 건너뛰는 사람 · 바람 속에 홀로 선 사람 ·
   갈림길 · 우산 · 병원 복도 · 빈 의자의 아침 · 두 개의 찻잔 · 편지와 촛불 · 메멘토 모리 정물.

   ★ 전부 <b>직접 그린 SVG</b> 입니다 — 남의 사진 · 삽화를 옮기지 않습니다 (CLAUDE.md 9번).
     사진처럼 인쇄에서 뭉개지지 않고, 빔 프로젝터 어떤 크기에서도 같은 선으로 섭니다.
   ★ 그림 안에는 <b>숫자를 적지 않습니다</b> (1번). 사람은 실루엣이라 누구도 특정하지 않습니다 (3번).
   ★ 모든 모양은 화면(1600×900) 안에 둡니다 — 덱의 넘침 점검이 그 밖을 넘침으로 셉니다.
   ★ id 는 장 하나에 한 벌입니다. 「한눈에」 가 여러 장을 한꺼번에 그릴 때는 덱이 id 에 꼬리를 붙입니다.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var W = 1600, H = 900;

  /* 사람 실루엣 — 발끝이 (x,y). 키는 s=1 에서 약 180 */
  var POSE = {
    stand: 'M-17 -142C-23 -140-27 -132-28 -120L-32 -70C-32 -65-25 -64-24 -69L-19 -112-18 -60-16 0-5 0-1 -55 1 -55 5 0 16 0 18 -60 19 -112 24 -69C25 -64 32 -65 32 -70L28 -120C27 -132 23 -140 17 -142Z',
    walk: 'M-17 -142C-23 -140-27 -132-28 -120L-36 -80-29 -77-19 -110-18 -62-34 0-22 0-3 -52 1 -52 13 0 25 0 18 -62 19 -110 30 -82 36 -86 28 -120C27 -132 23 -140 17 -142Z',
    sit: 'M-12 -88C2 -95 16 -88 19 -74L22 -44 52 -42 54 0 44 0 42 -30-6 -28C-14 -46-17 -72-12 -88Z',
    coat: 'M-18 -142C-26 -138-30 -128-31 -116L-36 -40-20 -40-18 -12-16 0-5 0-2 -40 2 -40 5 0 16 0 18 -12 20 -40 36 -40 31 -116C30 -128 26 -138 18 -142Z'
  };
  var HEAD = { stand: [0, -159, 15], walk: [2, -159, 15], sit: [8, -102, 14], coat: [0, -159, 15] };
  function fig(x, y, s, fill, pose, extra) {
    pose = pose || 'stand';
    var h = HEAD[pose];
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="' + fill + '"' + (extra || '') + '>' +
      '<circle cx="' + h[0] + '" cy="' + h[1] + '" r="' + h[2] + '"/><path d="' + POSE[pose] + '"/></g>';
  }
  /* 흩어진 점 — 같은 씨로 늘 같은 자리 (그릴 때마다 바뀌면 「한눈에」 와 발표가 다르게 섭니다) */
  function rnd(seed) { var s = seed; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function stars(seed, n, y1, op) {
    var r = rnd(seed), o = '';
    for (var i = 0; i < n; i++) o += '<circle cx="' + (r() * W).toFixed(0) + '" cy="' + (r() * y1).toFixed(0) + '" r="' + (0.6 + r() * 1.6).toFixed(1) + '" fill="#fff" opacity="' + (op * (0.3 + r() * 0.7)).toFixed(2) + '"/>';
    return '<g class="twinkle">' + o + '</g>';
  }
  function rain(seed, n, skip) {
    var r = rnd(seed), o = '';
    for (var i = 0; i < n; i++) {
      var x = r() * W, y = r() * 820, l = 26 + r() * 30;
      if (skip && skip(x, y)) continue;
      o += '<line x1="' + x.toFixed(0) + '" y1="' + y.toFixed(0) + '" x2="' + (x - 7).toFixed(0) + '" y2="' + (y + l).toFixed(0) + '"/>';
    }
    return '<g class="rain" stroke="#A9C4E8" stroke-width="1.6" stroke-linecap="round" opacity=".38">' + o + '</g>';
  }
  function svg(id, body, defs) {
    return '<svg class="art art-' + id + '" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs>' + (defs || '') + '</defs>' + body + '</svg>';
  }
  function lin(id, stops, x2, y2) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</linearGradient>';
  }
  function rad(id, stops, cx, cy, r) {
    return '<radialGradient id="' + id + '" cx="' + (cx == null ? 0.5 : cx) + '" cy="' + (cy == null ? 0.5 : cy) + '" r="' + (r == null ? 0.5 : r) + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</radialGradient>';
  }
  var SOFT = '<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>' +
    '<filter id="blur4" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>';

  var ART = {};

  /* ── 새벽 길 — 여는 장 · 맺는 장 ── */
  ART.dawn = function () {
    var d = lin('dw-sky', [[0, '#070B1E'], [0.42, '#251E48'], [0.6, '#9A4F78'], [0.69, '#F09A5C'], [0.735, '#FFD9A0']]) +
      rad('dw-sun', [[0, '#FFF7DE'], [0.3, '#FFD487'], [1, '#FFB04A', 0]]) +
      lin('dw-road', [[0, '#4A3550'], [1, '#0A0812']]) + lin('dw-haze', [[0, '#FFD9A0', 0], [0.6, '#FFD9A0', 0.28], [1, '#FFD9A0', 0]]) + SOFT;
    return svg('dawn',
      '<rect width="1600" height="900" fill="url(#dw-sky)"/>' + stars(7, 90, 330, 0.8) +
      '<g class="sunrise"><circle cx="800" cy="655" r="330" fill="url(#dw-sun)"/><circle cx="800" cy="655" r="64" fill="#FFF3D1"/></g>' +
      '<rect y="560" width="1600" height="130" fill="url(#dw-haze)"/>' +
      '<path d="M0 655 140 610 260 632 420 572 560 618 700 590 800 606 930 576 1080 616 1240 566 1380 604 1600 584V900H0Z" fill="#3A2953" opacity=".9"/>' +
      '<path d="M0 700C200 664 380 712 560 684 740 656 880 706 1060 680 1250 652 1420 700 1600 672V900H0Z" fill="#17122A"/>' +
      '<path d="M540 900 782 676H818L1060 900Z" fill="url(#dw-road)"/>' +
      '<path d="M798 690H802L806 730H794ZM792 760H808L814 820H786ZM780 860H820L826 900H774Z" fill="#FFD9A0" opacity=".55"/>' +
      fig(842, 812, 0.5, '#07060D', 'walk', ' class="walker"') +
      '<path d="M0 900V820C300 800 420 840 600 900Z" fill="#0C0918"/><path d="M1600 900V830C1320 806 1180 846 1000 900Z" fill="#0C0918"/>', d);
  };

  /* ── 인생의 하루 — 해가 B(왼쪽 땅끝)에서 D(오른쪽 땅끝)로. f(0~1) 를 주면 그 자리에 섭니다 ── */
  ART.day = function (o) {
    o = o || {};
    var f = o.f, has = typeof f === 'number' && isFinite(f);
    var cx = 800, cy = 760, R = 560;
    var ang = Math.PI * (1 - (has ? Math.max(0, Math.min(1, f)) : 0.5));
    var sx = cx + R * Math.cos(ang), sy = cy - R * Math.sin(ang);
    var d = lin('dy-sky', [[0, '#060A1C'], [0.5, '#1C2550'], [0.78, '#5A4A7A'], [0.85, '#C77B6A']]) +
      rad('dy-sun', [[0, '#FFF6D6'], [0.25, '#FFD27A'], [1, '#FFB347', 0]]) + SOFT;
    var ticks = '';
    [['0시', 0], ['6시', 0.25], ['12시', 0.5], ['18시', 0.75], ['24시', 1]].forEach(function (t) {
      var a = Math.PI * (1 - t[1]), x = cx + (R + 34) * Math.cos(a), y = cy - (R + 34) * Math.sin(a);
      ticks += '<text x="' + x.toFixed(0) + '" y="' + (y + 6).toFixed(0) + '" fill="#C9D3E6" opacity=".6" font-size="22" text-anchor="middle">' + t[0] + '</text>';
    });
    return svg('day',
      '<rect width="1600" height="900" fill="url(#dy-sky)"/>' + stars(11, 110, 520, 0.9) +
      '<path d="M240 760A560 560 0 0 1 1360 760" fill="none" stroke="#F6C76B" stroke-width="2.5" stroke-dasharray="3 12" opacity=".55"/>' + ticks +
      '<g class="' + (has ? 'sunAt' : 'sunArc') + '"><circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="190" fill="url(#dy-sun)"/>' +
      '<circle class="sunCore" cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="40" fill="#FFF1C9"/></g>' +
      '<path d="M0 760C260 742 520 770 800 756 1080 742 1340 770 1600 752V900H0Z" fill="#0D1022"/>' +
      '<text x="240" y="830" fill="#93A1BC" font-size="44" font-weight="800" text-anchor="middle">B</text>' +
      '<text x="1360" y="830" fill="#93A1BC" font-size="44" font-weight="800" text-anchor="middle">D</text>' +
      fig(800, 776, 0.42, '#05070F', 'stand'), d);
  };

  /* ── 차에서 내리지 못하는 밤 — 1부 · 실패 ── */
  ART.night = function () {
    var d = lin('nt-sky', [[0, '#03060F'], [1, '#0D1830']]) +
      lin('nt-cone', [[0, '#FFE2A3', 0.42], [1, '#FFE2A3', 0]]) + rad('nt-pool', [[0, '#FFDFA0', 0.35], [1, '#FFDFA0', 0]]) +
      rad('nt-lamp', [[0, '#FFF0C8'], [1, '#FFF0C8', 0]]) + rad('nt-phone', [[0, '#A8C8FF', 0.7], [1, '#A8C8FF', 0]]) + SOFT;
    var lines = '';
    for (var i = -6; i <= 6; i++) lines += '<line x1="' + (800 + i * 40) + '" y1="560" x2="' + (800 + i * 210) + '" y2="900" stroke="#C9D3E6" stroke-width="2" opacity=".09"/>';
    var city = '', r = rnd(3);
    for (var j = 0; j < 46; j++) { var x = r() * 1600, h = 20 + r() * 70; city += '<rect x="' + x.toFixed(0) + '" y="' + (560 - h).toFixed(0) + '" width="' + (14 + r() * 30).toFixed(0) + '" height="' + h.toFixed(0) + '" fill="#0B1428"/>'; if (r() > 0.5) city += '<rect x="' + (x + 4).toFixed(0) + '" y="' + (560 - h + 8).toFixed(0) + '" width="3" height="3" fill="#FFD98A" opacity=".5"/>'; }
    return svg('night',
      '<rect width="1600" height="900" fill="url(#nt-sky)"/>' + stars(19, 40, 300, 0.4) + city +
      '<rect y="560" width="1600" height="340" fill="#070C18"/>' + lines +
      '<path d="M1372 214 900 900H1500Z" fill="url(#nt-cone)"/>' +
      '<ellipse cx="1150" cy="842" rx="320" ry="46" fill="url(#nt-pool)"/>' +
      '<rect x="1448" y="200" width="12" height="700" fill="#141A28"/><path d="M1454 206H1380C1372 206 1368 212 1370 218H1420Z" fill="#1C2335"/>' +
      '<circle class="lampglow" cx="1395" cy="222" r="70" fill="url(#nt-lamp)" opacity=".8"/>' +
      '<g class="car"><path d="M880 834 896 772C906 752 936 742 976 740L1040 698C1062 686 1092 680 1132 680H1220C1262 680 1292 698 1312 728L1352 768C1364 780 1364 806 1358 834Z" fill="#0A0E1A"/>' +
      '<path d="M1000 744 1052 708C1068 700 1090 696 1118 696H1150V744Z" fill="#13203A"/><path d="M1162 696H1218C1248 696 1270 710 1286 736L1290 744H1162Z" fill="#13203A"/>' +
      '<circle class="phone" cx="1118" cy="730" r="34" fill="url(#nt-phone)"/>' +
      '<circle cx="1112" cy="718" r="13" fill="#05080F"/><path d="M1096 744C1098 728 1126 726 1130 744Z" fill="#05080F"/>' +
      '<circle cx="978" cy="838" r="30" fill="#04060B"/><circle cx="1262" cy="838" r="30" fill="#04060B"/></g>' +
      '<ellipse cx="1118" cy="878" rx="250" ry="10" fill="#000" opacity=".5"/>' +
      rain(23, 160, null), d);
  };

  /* ── 빛이 쏟아지는 계단 — 증명 · 자존감 ── */
  ART.stairs = function () {
    var d = rad('st-door', [[0, '#FFF3D0'], [0.5, '#FFD98A', 0.6], [1, '#FFB347', 0]]) +
      lin('st-spill', [[0, '#FFE2A3', 0.5], [1, '#FFE2A3', 0]], 1, 1) + lin('st-bg', [[0, '#05060C'], [1, '#0B0D18']]) + SOFT;
    var steps = 'M120 900V872', n = 12;
    for (var i = 0; i < n; i++) { var x = 120 + i * 84, y = 872 - i * 40; steps += 'H' + (x + 84) + 'V' + (y - 40); }
    steps += 'H1600V900Z';
    var edges = '';
    for (var k = 0; k < n; k++) edges += '<line x1="' + (120 + k * 84) + '" y1="' + (872 - k * 40) + '" x2="' + (204 + k * 84) + '" y2="' + (872 - k * 40) + '" stroke="#FFD98A" stroke-width="3" opacity="' + (0.08 + k * 0.05).toFixed(2) + '"/>';
    var dust = '', r = rnd(5);
    for (var j = 0; j < 40; j++) dust += '<circle cx="' + (700 + r() * 600).toFixed(0) + '" cy="' + (200 + r() * 500).toFixed(0) + '" r="' + (1 + r() * 2).toFixed(1) + '" fill="#FFE7B0" opacity="' + (0.2 + r() * 0.5).toFixed(2) + '"/>';
    return svg('stairs',
      '<rect width="1600" height="900" fill="url(#st-bg)"/>' +
      '<path d="M1130 392 1310 392 1600 120 1600 900 120 900Z" fill="url(#st-spill)" opacity=".55"/>' +
      '<circle cx="1220" cy="260" r="330" fill="url(#st-door)" opacity=".7"/>' +
      '<rect x="1140" y="120" width="170" height="272" fill="#FFF1C6"/>' +
      '<path d="M1140 120 1080 150 1080 420 1140 392Z" fill="#2A2116"/>' +
      '<rect x="1128" y="108" width="194" height="12" fill="#1A140C"/>' +
      '<path d="' + steps + '" fill="#10121D"/>' + edges +
      '<g class="dust">' + dust + '</g>' +
      fig(180, 872, 0.78, '#03040A', 'stand'), d);
  };

  /* ── 건너뛰는 사람 — 과감한 도전 ── */
  ART.leap = function () {
    var d = lin('lp-sky', [[0, '#141634'], [0.45, '#5E3463'], [0.7, '#E07A5B'], [0.8, '#FFC27A']]) +
      rad('lp-sun', [[0, '#FFF0C8'], [0.35, '#FFC46B'], [1, '#FF9A4A', 0]]) + lin('lp-gap', [[0, '#2A1830'], [1, '#05030A']]) + SOFT;
    var birds = '';
    [[420, 220, 1], [470, 200, 0.8], [520, 236, 0.9], [1180, 170, 0.7], [1220, 190, 0.6]].forEach(function (b) {
      birds += '<path d="M' + b[0] + ' ' + b[1] + 'q' + (12 * b[2]) + ' ' + (-10 * b[2]) + ' ' + (24 * b[2]) + ' 0q' + (12 * b[2]) + ' ' + (-10 * b[2]) + ' ' + (24 * b[2]) + ' 0" fill="none" stroke="#1A0F1E" stroke-width="3"/>';
    });
    var leap = 'M-14 -150C-4 -158 14 -156 20 -146L34 -112 62 -106 60 -97 28 -101 22 -86 46 -52 70 -44 66 -35 38 -42 10 -74-20 -50-60 -38-64 -47-30 -64-8 -92-20 -118-48 -128-46 -137-14 -129Z';
    return svg('leap',
      '<rect width="1600" height="900" fill="url(#lp-sky)"/>' +
      '<circle cx="820" cy="720" r="360" fill="url(#lp-sun)"/><circle cx="820" cy="720" r="80" fill="#FFE6B0"/>' +
      '<rect x="600" y="600" width="420" height="300" fill="url(#lp-gap)"/>' + birds +
      '<path d="M0 900V540C140 528 320 534 560 556L700 604 676 900Z" fill="#0F0A16"/>' +
      '<path d="M920 900 960 640 1010 590C1190 556 1400 548 1600 556V900Z" fill="#0F0A16"/>' +
      '<g class="leapf"><g class="leaper" transform="translate(800 470) scale(1.05)" fill="#07040B"><circle cx="16" cy="-168" r="15"/><path d="' + leap + '"/></g></g>', d);
  };

  /* ── 바람 속에 홀로 선 사람 — 자립 · 1부를 닫으며 ── */
  ART.hill = function () {
    var d = lin('hl-sky', [[0, '#0E1730'], [0.55, '#4B5F8E'], [0.8, '#D7A887'], [0.86, '#F5CFA0']]) + SOFT;
    var clouds = '', r = rnd(9);
    for (var i = 0; i < 7; i++) clouds += '<ellipse cx="' + (r() * 1600).toFixed(0) + '" cy="' + (120 + r() * 300).toFixed(0) + '" rx="' + (160 + r() * 220).toFixed(0) + '" ry="' + (22 + r() * 26).toFixed(0) + '" fill="#E8EEF8" opacity="' + (0.06 + r() * 0.1).toFixed(2) + '"/>';
    var grass = '';
    for (var g = 0; g < 70; g++) { var gx = r() * 1600, gy = 760 + r() * 120; grass += '<path d="M' + gx.toFixed(0) + ' ' + gy.toFixed(0) + 'q8 -22 24 -30" stroke="#1B2338" stroke-width="2" fill="none"/>'; }
    var wind = '';
    for (var w = 0; w < 6; w++) wind += '<path d="M' + (100 + w * 240) + ' ' + (300 + (w % 3) * 70) + 'c80 -18 160 18 240 0" stroke="#fff" stroke-width="2" fill="none" opacity=".18"/>';
    return svg('hill',
      '<rect width="1600" height="900" fill="url(#hl-sky)"/>' + '<g class="clouds">' + clouds + '</g>' + '<g class="wind">' + wind + '</g>' +
      '<path d="M0 900V770C300 712 600 650 800 636 1000 650 1300 712 1600 770V900Z" fill="#0B1020"/>' + grass +
      fig(800, 640, 0.95, '#04060C', 'coat'), d);
  };

  /* ── 갈림길 — 영업은 선택의 직업 ── */
  ART.fork = function () {
    var d = lin('fk-sky', [[0, '#0B1230'], [0.55, '#36446C'], [0.62, '#8790B6']]) + lin('fk-fog', [[0, '#C9D3EE', 0], [0.5, '#C9D3EE', 0.3], [1, '#C9D3EE', 0]]) +
      lin('fk-path', [[0, '#DCE4FA', 0.05], [1, '#DCE4FA', 0.4]]) + rad('fk-glow', [[0, '#FFE2A3'], [1, '#FFE2A3', 0]]) + SOFT;
    var lights = '';
    [[300, 548], [800, 528], [1300, 548]].forEach(function (p, i) { lights += '<circle class="hope h' + i + '" cx="' + p[0] + '" cy="' + p[1] + '" r="60" fill="url(#fk-glow)" opacity=".7"/>'; });
    return svg('fork',
      '<rect width="1600" height="900" fill="url(#fk-sky)"/>' + stars(31, 70, 380, 0.7) +
      '<rect y="540" width="1600" height="360" fill="#101629"/>' +
      '<path d="M740 900C720 760 520 640 300 552L320 548C560 630 790 740 820 900Z" fill="url(#fk-path)"/>' +
      '<path d="M770 900C780 760 796 620 800 528L808 528C814 620 830 760 850 900Z" fill="url(#fk-path)"/>' +
      '<path d="M800 900C820 740 1060 630 1300 548L1310 552C1100 640 900 760 880 900Z" fill="url(#fk-path)"/>' +
      lights + '<rect y="500" width="1600" height="110" fill="url(#fk-fog)"/>' +
      '<rect x="1002" y="700" width="7" height="140" fill="#05070F"/>' +
      '<path d="M1009 708H1070L1082 718 1070 728H1009Z" fill="#05070F"/><path d="M1002 734H942L930 744 942 754H1002Z" fill="#05070F"/><path d="M1009 760H1062L1074 770 1062 780H1009Z" fill="#05070F"/>' +
      fig(800, 860, 0.72, '#03050C', 'stand'), d);
  };

  /* ── 우산 — 보험이라는 선택 ── */
  ART.umbrella = function () {
    var d = lin('um-sky', [[0, '#060C1A'], [1, '#18294A']]) + rad('um-lamp', [[0, '#FFE6B0', 0.7], [1, '#FFE6B0', 0]]) +
      lin('um-cloth', [[0, '#F06A50'], [1, '#B8372A']]) + lin('um-wet', [[0, '#1A2A48'], [1, '#070B16']]) + SOFT;
    var skip = function (x, y) { return x > 600 && x < 1000 && y > 470; };
    return svg('umbrella',
      '<rect width="1600" height="900" fill="url(#um-sky)"/>' +
      '<circle cx="1260" cy="180" r="360" fill="url(#um-lamp)"/><rect x="1256" y="170" width="8" height="600" fill="#0E1626"/>' +
      '<rect y="770" width="1600" height="130" fill="url(#um-wet)"/>' +
      '<ellipse cx="1260" cy="820" rx="240" ry="20" fill="#FFE6B0" opacity=".12"/>' + rain(41, 260, skip) +
      '<g opacity=".18" transform="translate(0 1546) scale(1 -1)">' + fig(760, 772, 0.9, '#000', 'coat') + fig(860, 772, 0.55, '#000', 'stand') + '</g>' +
      fig(760, 772, 0.9, '#04070F', 'coat') + fig(860, 772, 0.55, '#04070F', 'stand') +
      '<g class="umb" transform="rotate(-9 800 520)"><path d="M610 540C640 430 960 430 990 540C960 520 930 520 905 540 880 520 850 520 825 540 800 520 770 520 745 540 720 520 690 520 660 540 640 522 624 524 610 540Z" fill="url(#um-cloth)"/>' +
      '<path d="M800 452V640C800 652 790 656 784 648" fill="none" stroke="#1A1A1A" stroke-width="5"/></g>', d);
  };

  /* ── 병원 복도 — 고객님도 B와 D 사이에 ── */
  ART.hall = function () {
    var d = lin('hc-floor', [[0, '#3B4660'], [1, '#121725']]) + lin('hc-ceil', [[0, '#0E121C'], [1, '#262E42']]) +
      rad('hc-win', [[0, '#F2F7FF'], [1, '#B9CDEB', 0]]) + rad('hc-light', [[0, '#EAF2FF', 0.9], [1, '#EAF2FF', 0]]) + SOFT;
    var lights = '';
    [[0.15, 1], [0.38, 0.8], [0.58, 0.62], [0.74, 0.48]].forEach(function (t, i) {
      var y = 40 + t[0] * 400, w = 240 * (1 - t[0]) * 1.2, h = 18 * t[1];
      lights += '<rect class="' + (i === 1 ? 'flick' : '') + '" x="' + (800 - w / 2).toFixed(0) + '" y="' + y.toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" fill="#EEF4FF" opacity=".85"/>' +
        '<ellipse cx="800" cy="' + (900 - t[0] * 420).toFixed(0) + '" rx="' + (w * 0.6).toFixed(0) + '" ry="' + (12 * t[1]).toFixed(0) + '" fill="#DDE8FA" opacity=".12"/>';
    });
    return svg('hall',
      '<path d="M0 0H1600L940 340H660Z" fill="url(#hc-ceil)"/>' +
      '<path d="M0 0 660 340V520L0 900Z" fill="#202739"/><path d="M1600 0 940 340V520L1600 900Z" fill="#1B2232"/>' +
      '<path d="M0 900 660 520H940L1600 900Z" fill="url(#hc-floor)"/>' +
      '<rect x="660" y="340" width="280" height="180" fill="#E4EDFB"/><circle cx="800" cy="430" r="260" fill="url(#hc-win)" opacity=".55"/>' +
      lights +
      '<path d="M180 210 330 290V610L180 690Z" fill="#161C2A"/><path d="M1420 210 1270 290V610L1420 690Z" fill="#141A28"/>' +
      '<path d="M1060 640 1240 690V716L1060 668Z" fill="#2E3850"/><path d="M1070 668V720M1230 714V770" stroke="#11151F" stroke-width="6"/>' +
      fig(1110, 700, 0.95, '#05070D', 'sit'), d);
  };

  /* ── 빈 의자의 아침 — 남는 사람의 삶 ── */
  ART.chair = function () {
    var d = lin('ch-wall', [[0, '#1C2130'], [1, '#2C3140']]) + lin('ch-beam', [[0, '#FFE6B8', 0.55], [1, '#FFE6B8', 0]], 1, 1) +
      rad('ch-win', [[0, '#FFF3DA'], [1, '#FFD9A0', 0]]) + SOFT;
    return svg('chair',
      '<rect width="1600" height="900" fill="url(#ch-wall)"/>' +
      '<rect x="1180" y="120" width="300" height="380" fill="#FFF0D2"/><path d="M1330 120V500M1180 310H1480" stroke="#3A3226" stroke-width="10"/>' +
      '<circle cx="1330" cy="310" r="380" fill="url(#ch-win)" opacity=".45"/>' +
      '<path d="M1180 500 1480 500 1100 900 420 900Z" fill="url(#ch-beam)" opacity=".5"/>' +
      '<rect y="760" width="1600" height="140" fill="#14161F"/>' +
      '<path d="M380 600H1180L1240 640H320Z" fill="#4A3628"/><rect x="320" y="640" width="920" height="16" fill="#2E2219"/>' +
      '<rect x="360" y="656" width="14" height="200" fill="#241A13"/><rect x="1186" y="656" width="14" height="200" fill="#241A13"/>' +
      '<path d="M520 596C520 566 600 566 600 596Z" fill="#E8E0D0"/><ellipse cx="560" cy="596" rx="44" ry="8" fill="#CFC5B2"/>' +
      '<path d="M940 588H990V612C990 624 940 624 940 612Z" fill="#E8E0D0"/><path d="M990 594C1004 594 1004 608 990 608" stroke="#E8E0D0" stroke-width="5" fill="none"/>' +
      '<g class="steam" stroke="#fff" stroke-width="3" fill="none" opacity=".35"><path d="M955 580C945 560 965 548 955 528"/><path d="M972 580C962 556 984 546 972 520"/></g>' +
      '<path d="M410 520H470L478 700H404Z" fill="#3A2C22"/><rect x="396" y="700" width="90" height="12" fill="#3A2C22"/><path d="M404 712V860M478 712V860" stroke="#2A2019" stroke-width="10"/>' +
      '<path d="M418 560C418 530 470 530 470 560V640H418Z" fill="#E7B23E"/><rect x="430" y="574" width="28" height="22" rx="4" fill="#C9942B"/>' +
      '<path d="M1020 420H1100L1112 700H1008Z" fill="#3A2C22"/><rect x="996" y="700" width="128" height="14" fill="#3A2C22"/><path d="M1008 714V860M1112 714V860" stroke="#2A2019" stroke-width="10"/>' +
      '<path d="M1012 430C1040 418 1080 418 1108 430L1116 560C1090 548 1030 548 1004 560Z" fill="#141826"/>', d);
  };

  /* ── 두 개의 찻잔 — 팩트파인딩 ── */
  ART.tea = function () {
    var d = lin('te-bg', [[0, '#120C0A'], [1, '#2E1D14']]) + rad('te-lamp', [[0, '#FFD08A', 0.65], [1, '#FFD08A', 0]]) +
      rad('te-table', [[0, '#7A5238'], [1, '#3A2418']], 0.5, 0.4, 0.6) + SOFT;
    function cup(x) {
      return '<ellipse cx="' + x + '" cy="640" rx="92" ry="20" fill="#E9E1D2"/><path d="M' + (x - 58) + ' 560H' + (x + 58) + 'L' + (x + 48) + ' 626C' + (x + 46) + ' 636 ' + (x - 46) + ' 636 ' + (x - 48) + ' 626Z" fill="#F3EDE2"/>' +
        '<ellipse cx="' + x + '" cy="560" rx="58" ry="12" fill="#6B3E22"/><path d="M' + (x + 58) + ' 574C' + (x + 90) + ' 574 ' + (x + 90) + ' 610 ' + (x + 52) + ' 608" stroke="#F3EDE2" stroke-width="8" fill="none"/>';
    }
    return svg('tea',
      '<rect width="1600" height="900" fill="url(#te-bg)"/><circle cx="420" cy="140" r="520" fill="url(#te-lamp)"/>' +
      '<path d="M400 0V60M330 60H470L440 120H360Z" fill="#1A120D" stroke="#1A120D" stroke-width="4"/>' +
      '<ellipse cx="800" cy="650" rx="560" ry="130" fill="url(#te-table)"/><rect x="760" y="760" width="80" height="140" fill="#1E140D"/>' +
      cup(640) + cup(960) +
      '<g class="steam" stroke="#fff" stroke-width="3" fill="none" opacity=".3"><path d="M630 548C610 510 660 490 640 450C624 420 680 400 700 380"/><path d="M970 548C990 510 940 490 960 450C976 420 920 400 900 380"/></g>' +
      '<path d="M0 900V460C40 440 90 440 120 470V900Z" fill="#0C0806"/><path d="M1600 900V460C1560 440 1510 440 1480 470V900Z" fill="#0C0806"/>', d);
  };

  /* ── 편지와 촛불 — 나의 마지막 하루 ── */
  ART.letter = function () {
    var d = lin('lt-bg', [[0, '#07060A'], [1, '#17110C']]) + rad('lt-glow', [[0, '#FFC772', 0.6], [1, '#FFC772', 0]]) + SOFT;
    return svg('letter',
      '<rect width="1600" height="900" fill="url(#lt-bg)"/><circle class="halo" cx="1240" cy="380" r="420" fill="url(#lt-glow)"/>' +
      '<path d="M0 700H1600V900H0Z" fill="#1C130C"/><rect y="700" width="1600" height="6" fill="#3A2818"/>' +
      '<g transform="rotate(-6 1080 690)"><rect x="900" y="610" width="330" height="200" fill="#E9DFC9"/><path d="M900 610 1065 720 1230 610" fill="none" stroke="#C9BCA0" stroke-width="3"/>' +
      '<rect x="930" y="560" width="270" height="120" fill="#F6EFDF"/><path d="M955 590H1170M955 612H1150M955 634H1120" stroke="#9A8C70" stroke-width="3" opacity=".6"/></g>' +
      '<path d="M1260 760 1470 690" stroke="#121212" stroke-width="9" stroke-linecap="round"/><path d="M1252 764 1268 756" stroke="#C9A24A" stroke-width="5"/>' +
      '<g class="candle"><rect x="1300" y="440" width="70" height="262" rx="6" fill="#EFE5CF"/><path d="M1300 470C1314 480 1322 470 1330 496V540" stroke="#D9CCAF" stroke-width="7" fill="none"/>' +
      '<line x1="1335" y1="440" x2="1335" y2="420" stroke="#222" stroke-width="3"/>' +
      '<path class="flame" d="M1335 352C1352 378 1358 396 1352 412 1348 422 1342 426 1335 426S1322 422 1318 412C1312 396 1318 378 1335 352Z" fill="#FFB547"/>' +
      '<path class="flame in" d="M1335 382C1343 394 1345 404 1342 412 1340 416 1338 418 1335 418S1330 416 1328 412C1325 404 1327 394 1335 382Z" fill="#FFF2C6"/></g>' +
      '<g class="smoke" stroke="#B9B2A4" stroke-width="2" fill="none" opacity=".25"><path d="M1335 344C1320 300 1356 270 1338 220C1326 186 1350 160 1340 120"/></g>', d);
  };

  /* ── 메멘토 모리 — 정물(해골 · 책 · 모래시계 · 꺼져 가는 촛불 · 흰 국화) ── */
  ART.vanitas = function () {
    var d = rad('vn-spot', [[0, '#5A4128', 0.75], [0.6, '#2A1D12', 0.35], [1, '#0A0705', 0]], 0.3, 0.25, 0.8) +
      rad('vn-bone', [[0, '#F4ECD8'], [0.55, '#C8BA98'], [1, '#5E5340']], 0.38, 0.32, 0.75) +
      lin('vn-table', [[0, '#2A1B10'], [1, '#0C0805']]) + rad('vn-flame', [[0, '#FFD07A', 0.6], [1, '#FFD07A', 0]]) +
      lin('vn-glass', [[0, '#C9DDF2', 0.18], [1, '#C9DDF2', 0.05]], 1, 0) + SOFT;
    var petals = '';
    for (var i = 0; i < 16; i++) { var a = i * 22.5; petals += '<ellipse cx="0" cy="-18" rx="6" ry="18" fill="#F2EEE4" transform="rotate(' + a + ')"/>'; }
    for (var j = 0; j < 12; j++) { var b = j * 30 + 15; petals += '<ellipse cx="0" cy="-11" rx="4" ry="11" fill="#E6DFCF" transform="rotate(' + b + ')"/>'; }
    return svg('vanitas',
      '<rect width="1600" height="900" fill="#090604"/><rect width="1600" height="900" fill="url(#vn-spot)"/>' +
      '<rect y="690" width="1600" height="210" fill="url(#vn-table)"/><rect y="690" width="1600" height="5" fill="#4A321C" opacity=".8"/>' +
      /* 촛불 — 해골 오른쪽 뒤 */
      '<circle class="halo" cx="700" cy="300" r="320" fill="url(#vn-flame)"/>' +
      '<g class="candle"><path d="M672 330H728V600H672Z" fill="#E6DBC2"/><path d="M672 352C686 362 692 350 700 380V430M728 344C718 360 722 372 712 390" stroke="#CDBF9F" stroke-width="7" fill="none"/>' +
      '<line x1="700" y1="330" x2="700" y2="312" stroke="#1A1A1A" stroke-width="3"/>' +
      '<path class="flame" d="M700 248C714 270 720 286 715 300 712 309 706 313 700 313S688 309 685 300C680 286 686 270 700 248Z" fill="#FFB547"/>' +
      '<path class="flame in" d="M700 274C707 284 709 292 706 299 705 302 703 304 700 304S695 302 694 299C691 292 693 284 700 274Z" fill="#FFF2C6"/></g>' +
      '<g class="smoke" stroke="#BDB5A6" stroke-width="2.4" fill="none" opacity=".28"><path d="M700 240C680 200 724 172 702 128C686 96 716 70 702 30"/><path d="M702 236C730 196 692 166 720 120"/></g>' +
      /* 책 */
      '<rect x="200" y="612" width="520" height="80" fill="#4A2618"/><rect x="212" y="620" width="496" height="64" fill="#D9CCA8" opacity=".85"/><rect x="200" y="612" width="22" height="80" fill="#2E170E"/>' +
      '<rect x="230" y="548" width="460" height="66" fill="#2E2A3E"/><rect x="242" y="556" width="436" height="50" fill="#CFC2A0" opacity=".8"/><rect x="230" y="548" width="20" height="66" fill="#1E1B2A"/>' +
      /* 해골 — 4분의 3 쪽으로 돌린 머리. 빛은 왼쪽 위(촛불이 아니라 창) · 오른쪽이 그늘 */
      '<g class="skull"><ellipse cx="450" cy="550" rx="180" ry="14" fill="#000" opacity=".5"/>' +
      '<path d="M446 250C338 252 286 330 292 414 296 452 312 478 334 496L338 534C340 548 352 556 366 554L392 550 402 540H500L510 550 534 552C548 552 558 544 560 532L566 496C590 478 606 452 610 414 616 330 556 248 446 250Z" fill="url(#vn-bone)"/>' +
      '<path d="M610 414C616 330 556 248 446 250 520 262 572 320 576 398 580 452 562 490 540 504L534 552C548 552 558 544 560 532L566 496C590 478 606 452 610 414Z" fill="#3A3022" opacity=".55"/>' +
      '<path d="M340 314C372 278 420 262 468 264" stroke="#FFF8E6" stroke-width="10" fill="none" opacity=".35" filter="url(#blur4)"/>' +
      '<path d="M352 396C356 376 372 362 394 360 418 358 438 370 444 392 448 412 440 432 420 440 398 448 372 444 360 428 352 418 350 406 352 396Z" fill="#0E0905"/>' +
      '<path d="M480 394C486 372 506 360 528 362 548 364 562 380 562 400 562 422 548 438 526 440 504 442 484 430 480 412Z" fill="#0E0905"/>' +
      '<path d="M352 396C356 376 372 362 394 360" stroke="#7A6C52" stroke-width="5" fill="none" opacity=".7"/><path d="M480 394C486 372 506 360 528 362" stroke="#7A6C52" stroke-width="5" fill="none" opacity=".6"/>' +
      '<path d="M446 452 430 494C436 502 448 504 456 500 462 504 470 500 470 492Z" fill="#160F09"/>' +
      '<path d="M356 456C372 470 392 476 414 472M500 474C522 478 540 470 556 456" stroke="#8A7C60" stroke-width="5" fill="none" opacity=".55"/>' +
      '<path d="M392 512C420 520 470 520 512 512" stroke="#5E5240" stroke-width="3" fill="none"/>' +
      [[398, 20], [414, 23], [430, 25], [446, 26], [462, 25], [478, 23], [494, 21], [508, 18]].map(function (t) { return '<path d="M' + (t[0] - 7) + ' 514H' + (t[0] + 7) + 'V' + (514 + t[1] - 5) + 'C' + (t[0] + 7) + ' ' + (514 + t[1]) + ' ' + (t[0] - 7) + ' ' + (514 + t[1]) + ' ' + (t[0] - 7) + ' ' + (514 + t[1] - 5) + 'Z" fill="#E8DDC4" stroke="#6E624B" stroke-width="1.6"/>'; }).join('') +
      '<path d="M398 286C410 306 404 326 390 336M520 290C512 304 516 316 528 324" stroke="#8A7C60" stroke-width="2.6" fill="none" opacity=".5"/></g>' +
      /* 모래시계 */
      '<g class="glass" transform="translate(900 380)"><rect x="-90" y="0" width="180" height="16" rx="5" fill="#6A4626"/><rect x="-90" y="294" width="180" height="16" rx="5" fill="#6A4626"/>' +
      '<rect x="-84" y="16" width="9" height="278" fill="#4E3219"/><rect x="75" y="16" width="9" height="278" fill="#4E3219"/>' +
      '<path d="M-62 18H62C62 84 14 124 8 155 14 186 62 226 62 292H-62C-62 226-14 186-8 155-14 124-62 84-62 18Z" fill="url(#vn-glass)" stroke="#D9E6F5" stroke-opacity=".35" stroke-width="2"/>' +
      '<path class="sandTop" d="M-52 34H52C46 80 16 110 0 150-16 110-46 80-52 34Z" fill="#E2B866"/>' +
      '<line class="stream" x1="0" y1="152" x2="0" y2="284" stroke="#E2B866" stroke-width="2.6" stroke-dasharray="4 5"/>' +
      '<path class="sandBot" d="M-56 290C-44 248-14 230 0 226 14 230 44 248 56 290Z" fill="#E2B866"/></g>' +
      /* 흰 국화 — 누운 채로 */
      '<path d="M1060 700C1140 690 1240 694 1330 704" stroke="#3C4A2A" stroke-width="5" fill="none"/>' +
      '<path d="M1180 692C1196 676 1214 676 1226 690M1270 698C1284 684 1300 686 1310 700" stroke="#3C4A2A" stroke-width="4" fill="#4A5A32"/>' +
      '<g transform="translate(1050 690) scale(1.25)">' + petals + '<circle r="6" fill="#E8D9A8"/></g>', d);
  };

  window.BCD_ART = ART;
  window.BCD_ART_NAMES = Object.keys(ART);
})();
