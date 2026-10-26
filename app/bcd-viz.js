/* ════════════════════════════════════════════════════════════════
   B·C·D 영업 강의 — 말 장의 그림 도해 (판 X218 · 2026-10-26)

   사장님 말씀 — 「너무 별론데, 디자인의 글만 있다고 감동이 아니라, 이미지 / 강조할 부분들 /
   애니메이션화 / 내용 확인 등 핵심 내용 필요」.
   글줄만 서던 장(text · steps · table · cols)을 <b>그림으로 말하는 장</b>으로 바꿉니다 —
   ① 이미지 : 장마다 그 말을 그린 도해 — 두 개의 시계 · 오르는 계단 · 세 겹의 고리 · 넘어지는 사슬 ·
      뒤집히는 카드 · 다섯 개의 문 · 쌓이는 벽돌 … 아이콘은 직접 그린 선 그림(SVG) 서른여 개.
   ② 강조 : 장마다 「핵심 한 줄」(key) — 마지막에 형광펜이 지나가며 떠오릅니다. 제목의 강조어도 밑줄이 그어집니다.
   ③ 움직임 : 누를 때마다 하나씩 — 아이콘이 선으로 그려지고, 계단을 사람이 오르고, 시계바늘이 돌고, 카드가 뒤집힙니다.
   ④ 내용 확인 : 부마다 「핵심 확인」 — 빈칸을 함께 소리 내어 채우고, 누르면 답이 형광펜으로 섭니다(bcd-lecture.html).

   ★ 직접 그린 SVG 만 — 남의 그림 · 바깥 그림 · 사진을 끌어오지 않습니다 (CLAUDE.md 9번).
   ★ 도해 안에 금액 · 비율 숫자를 적지 않습니다 (1번).
   ★ 말 장의 원래 문장(li)은 그대로 두어 강사 대본 · 인쇄에 갑니다 — 화면에는 짧은 말과 그림이 섭니다.
   판 X219 — 「설계사의 선택 → 고객님이 나를 고르는 이유」 짝(pair) · 두 질문(ask2) · 다섯 이유(whyall).
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 선 아이콘 (64×64 · 굵기는 CSS) ─────────────────────────── */
  var I = {
    compass: '<circle cx="32" cy="32" r="24"/><path d="M32 13 39 32 32 51 25 32Z"/><circle cx="32" cy="32" r="2.5"/>',
    people: '<circle cx="24" cy="21" r="7"/><circle cx="43" cy="24" r="6"/><path d="M11 52C11 41 17 35 24 35S37 41 37 52"/><path d="M36 52C36 44 39 38 43 38S52 43 52 51"/>',
    gauge: '<path d="M10 44A22 22 0 1 1 54 44"/><path d="M32 42 46 24"/><circle cx="32" cy="42" r="3"/><path d="M14 30l4 2M32 18v4M50 30l-4 2"/>',
    mask: '<path d="M14 18C14 13 50 13 50 18 50 40 42 52 32 52S14 40 14 18Z"/><path d="M21 28h7M36 28h7"/><path d="M24 40q8 5 16 0"/>',
    door: '<path d="M18 56V8h28v48"/><circle cx="38" cy="33" r="1.8"/><path d="M10 56h44"/>',
    question: '<circle cx="32" cy="32" r="24"/><path d="M25 25c0-7 14-7 14 1 0 6-7 6-7 12"/><circle cx="32" cy="45" r="1.6"/>',
    zip: '<path d="M10 14h44v28H30l-10 10V42H10Z"/><path d="M18 28h28"/><path d="M22 25v6M28 25v6M34 25v6M40 25v6"/>',
    hand: '<path d="M22 54c-6-8-8-16-6-22V20a3 3 0 0 1 6 0v10V13a3 3 0 0 1 6 0v17V11a3 3 0 0 1 6 0v19V15a3 3 0 0 1 6 0v21c0 10-5 18-12 18Z"/>',
    phone: '<rect x="20" y="6" width="24" height="52" rx="5"/><path d="M28 50h8"/><path d="M50 18q5 6 0 12M54 14q9 10 0 20"/>',
    clock: '<circle cx="32" cy="32" r="24"/><path d="M32 32V17M32 32l10 6"/>',
    coin: '<ellipse cx="32" cy="18" rx="16" ry="6"/><path d="M16 18v10c0 3 7 6 16 6s16-3 16-6V18"/><path d="M16 28v10c0 3 7 6 16 6s16-3 16-6V28"/><path d="M16 38v8c0 3 7 6 16 6s16-3 16-6v-8"/>',
    shield: '<path d="M32 8 50 14v16c0 14-8 22-18 26-10-4-18-12-18-26V14Z"/><path d="M24 32l6 6 12-12"/>',
    sunset: '<path d="M18 42a14 14 0 0 1 28 0"/><path d="M8 42h48M14 50h36"/><path d="M32 14v6M15 22l4 4M49 22l-4 4"/>',
    gift: '<rect x="12" y="26" width="40" height="26" rx="2"/><rect x="10" y="18" width="44" height="8" rx="2"/><path d="M32 18v34"/><path d="M32 18c-7-10-16-5-10 0M32 18c7-10 16-5 10 0"/>',
    jar: '<path d="M22 10h20M24 10v6c-6 4-9 10-9 16v14a6 6 0 0 0 6 6h22a6 6 0 0 0 6-6V32c0-6-3-12-9-16v-6"/><circle cx="32" cy="38" r="6"/>',
    house: '<path d="M10 30 32 10 54 30"/><path d="M16 25v29h32V25"/><path d="M28 54V41h8v13"/>',
    ear: '<path d="M22 40C14 34 15 13 32 11c15-2 21 12 15 23-3 6-9 7-9 14 0 7-9 9-12 3"/><path d="M29 27c0-7 11-7 11 0 0 5-5 6-5 10"/>',
    pen: '<path d="M14 50l4-12L44 12l8 8-26 26Z"/><path d="M39 17l8 8"/><path d="M14 50l9-2"/>',
    hourglass: '<path d="M18 8h28M18 56h28"/><path d="M20 8c0 16 12 20 12 24s-12 8-12 24M44 8c0 16-12 20-12 24s12 8 12 24"/><path d="M26 50h12"/>',
    heart: '<path d="M32 52C20 44 10 36 10 24a10 10 0 0 1 22-6 10 10 0 0 1 22 6c0 12-10 20-22 28Z"/>',
    sprout: '<path d="M32 54V30"/><path d="M32 34c-10 0-14-8-14-14 8 0 14 6 14 14Z"/><path d="M32 30c10 0 14-8 14-14-8 0-14 6-14 14Z"/><path d="M18 54h28"/>',
    chair: '<path d="M20 8v46M20 34h26v20M46 34v-3"/><path d="M20 8h7v26"/>',
    bed: '<path d="M8 22v30M8 38h48v14"/><rect x="12" y="28" width="12" height="7" rx="2"/><path d="M26 30h30v8"/>',
    umbrella: '<path d="M8 32a24 24 0 0 1 48 0Z"/><path d="M32 32v16a4 4 0 0 1-8 0"/><path d="M32 8v-2"/>',
    eye: '<path d="M6 32c8-14 44-14 52 0-8 14-44 14-52 0Z"/><circle cx="32" cy="32" r="7"/>',
    link: '<path d="M27 37l-6 6a8 8 0 0 1-11-11l6-6a8 8 0 0 1 11 0"/><path d="M37 27l6-6a8 8 0 0 1 11 11l-6 6a8 8 0 0 1-11 0"/><path d="M26 38l12-12"/>',
    check: '<circle cx="32" cy="32" r="24"/><path d="M20 33l8 8 16-16"/>',
    star: '<path d="M32 8l7 15 16 2-12 11 3 16-14-8-14 8 3-16L9 25l16-2Z"/>',
    brick: '<rect x="8" y="12" width="22" height="12"/><rect x="34" y="12" width="22" height="12"/><rect x="18" y="28" width="28" height="12"/><rect x="8" y="44" width="22" height="12"/><rect x="34" y="44" width="22" height="12"/>',
    book: '<path d="M32 14C24 8 14 8 8 10v40c6-2 16-2 24 4 8-6 18-6 24-4V10c-6-2-16-2-24 4Z"/><path d="M32 14v40"/>',
    map: '<path d="M8 14 24 8l16 6 16-6v42l-16 6-16-6-16 6Z"/><path d="M24 8v42M40 14v42"/>',
    scale: '<path d="M32 10v44M20 54h24M12 18h40"/><path d="M12 18 6 32a6 4 0 0 0 12 0Z"/><path d="M52 18l-6 14a6 4 0 0 0 12 0Z"/>',
    mirror: '<ellipse cx="32" cy="26" rx="14" ry="18"/><path d="M32 44v10M24 54h16"/><path d="M25 19l6-4"/>',
    anchor: '<circle cx="32" cy="12" r="4"/><path d="M32 16v38M22 26h20"/><path d="M12 40c0 9 9 14 20 14s20-5 20-14"/><path d="M8 44l4-4 4 4M48 44l4-4 4 4"/>',
    handshake: '<path d="M6 30 18 22l12 6 10-6 18 8"/><path d="M18 22 10 38M48 24l6 14"/><path d="M22 34l6 6M28 31l6 6M34 29l6 6"/>',
    flag: '<path d="M16 56V8"/><path d="M16 10h30l-6 10 6 10H16"/>',
    calendar: '<rect x="10" y="14" width="44" height="40" rx="4"/><path d="M10 24h44M22 8v10M42 8v10"/><path d="M24 39l5 5 11-11"/>',
    chat: '<path d="M8 12h32v20H22l-8 8v-8H8Z"/><path d="M44 24h12v18h-6v7l-7-7H30v-6"/>',
    x: '<path d="M18 18l28 28M46 18 18 46"/>',
    target: '<circle cx="32" cy="32" r="24"/><circle cx="32" cy="32" r="14"/><circle cx="32" cy="32" r="4"/>',
    cup: '<path d="M14 26h32v12a16 16 0 0 1-32 0Z"/><path d="M46 30c8 0 8 10 0 10"/><path d="M24 18c-3-4 3-6 0-10M34 18c-3-4 3-6 0-10"/>',
    person: '<circle cx="32" cy="16" r="8"/><path d="M16 56c0-14 7-24 16-24s16 10 16 24"/>',
    tree: '<path d="M32 56V34"/><path d="M32 36c-12 0-18-6-18-14 0-8 8-14 18-14s18 6 18 14c0 8-6 14-18 14Z"/><path d="M24 56h16"/>',
    light: '<path d="M22 36a14 14 0 1 1 20 0c-3 3-4 6-4 10H26c0-4-1-7-4-10Z"/><path d="M26 52h12M28 57h8"/>',
    seed: '<path d="M32 10c12 10 14 26 0 40-14-14-12-30 0-40Z"/><path d="M32 18v28"/>'
  };
  /* 선마다 pathLength="1" — 길이를 몰라도 CSS 가 처음부터 끝까지 그어 줍니다 */
  function icon(n, cls) {
    return '<svg class="vi' + (cls ? ' ' + cls : '') + '" viewBox="0 0 64 64" aria-hidden="true">' +
      (I[n] || I.star).replace(/<(path|circle|ellipse|rect)\b/g, '<$1 pathLength="1"') + '</svg>';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function txt(it) { return '<b>' + esc(it.t) + '</b>' + (it.d ? '<small>' + esc(it.d) + '</small>' : ''); }
  var T = {};

  /* 카드 — 아이콘이 선으로 그려지며 하나씩 */
  T.cards = function (v) {
    return '<div class="vz cards n' + v.items.length + '">' + v.items.map(function (it, i) {
      return '<div class="vc bd" style="--i:' + i + '"><div class="ic">' + icon(it.i) + '</div>' + txt(it) + '</div>';
    }).join('') + '</div>';
  };
  /* 두 개의 시계 — 과정의 시계는 흔들리고, 결과의 시계는 한 방향으로 돕니다 */
  T.clocks = function (v) {
    var face = function (cls) {
      var t = '';
      for (var k = 0; k < 12; k++) { var a = k * Math.PI / 6; t += '<path d="M' + (100 + Math.sin(a) * 78).toFixed(1) + ' ' + (100 - Math.cos(a) * 78).toFixed(1) + 'L' + (100 + Math.sin(a) * 88).toFixed(1) + ' ' + (100 - Math.cos(a) * 88).toFixed(1) + '"/>'; }
      return '<svg class="ckf ' + cls + '" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="92" class="rim"/><g class="tk">' + t + '</g>' +
        '<g class="hh"><path d="M100 100V52"/></g><g class="mh"><path d="M100 100V26"/></g><circle cx="100" cy="100" r="6" class="hub"/></svg>';
    };
    return '<div class="vz clocks"><div class="ck2 bd fail">' + face('jit') + txt(v.a) + '</div>' +
      '<div class="vs bd"><span>' + esc(v.mid || '같은 사건') + '</span></div>' +
      '<div class="ck2 bd proof">' + face('run') + txt(v.b) + '</div></div>';
  };
  /* 계단 — 한 칸씩 솟고, 사람이 그 칸으로 오릅니다(hook) */
  T.stairs = function (v) {
    var n = v.items.length;
    return '<div class="vz climb" style="--n:' + n + '">' + v.items.map(function (it, i) {
      return '<div class="sp bd" style="--i:' + i + ';--h:' + Math.round(26 + 74 * (i + 1) / n) + '%"><div class="lab">' + txt(it) + '</div><div class="blk"><em>' + (i + 1) + '</em></div></div>';
    }).join('') + '<div class="climber">' + icon('person') + '</div></div>';
  };
  /* 맞대기 — 왼쪽은 흐리게, 오른쪽은 밝게. 줄마다 양쪽에서 미끄러져 들어옵니다 */
  T.versus = function (v) {
    return '<div class="vz versus' + (v.rows[0].length === 3 ? ' k3' : '') + '"><div class="vh"><div class="l">' + icon(v.L.i) + '<b>' + esc(v.L.t) + '</b></div><div class="r">' + icon(v.R.i) + '<b>' + esc(v.R.t) + '</b></div></div>' +
      v.rows.map(function (r) {
        var k = r.length === 3 ? '<div class="k">' + esc(r[0]) + '</div>' : '', a = r.length === 3 ? r[1] : r[0], b = r.length === 3 ? r[2] : r[1];
        return '<div class="vr bd">' + k + '<div class="l">' + esc(a) + '</div><div class="ar">→</div><div class="r">' + esc(b) + '</div></div>';
      }).join('') + '</div>';
  };
  /* 세 겹의 고리 — 이름이 서면 그 고리가 그어집니다(hook) */
  T.rings = function (v) {
    var c = '';
    v.items.forEach(function (it, i) { var r = 44 + i * 36; c += '<circle class="tr" cx="150" cy="150" r="' + r + '"/><circle class="rgo r' + i + '" cx="150" cy="150" r="' + r + '" pathLength="1" transform="rotate(-90 150 150)"/>'; });
    return '<div class="vz rings"><svg class="rg" viewBox="0 0 300 300" aria-hidden="true">' + c + '<circle class="core" cx="150" cy="150" r="22"/></svg><div class="rl">' +
      v.items.map(function (it, i) { return '<div class="rli bd" style="--i:' + i + '"><div class="ic">' + icon(it.i) + '</div><div>' + txt(it) + '</div></div>'; }).join('') + '</div></div>';
  };
  /* 사슬 — 하나가 넘어지면 다음이 넘어집니다 */
  T.chain = function (v) {
    return '<div class="vz chain n' + v.items.length + '">' + v.items.map(function (it, i) {
      return '<div class="cn bd' + (i === v.items.length - 1 ? ' last' : '') + '">' + (i ? '<svg class="arw" viewBox="0 0 40 20" aria-hidden="true"><path pathLength="1" d="M2 10H34M26 3l8 7-8 7"/></svg>' : '') +
        '<div class="ic">' + icon(it.i) + '</div>' + txt(it) + '</div>';
    }).join('') + '</div>';
  };
  /* 시간의 줄 — 점이 하나씩 켜지고 줄이 그 점까지 찹니다(hook) */
  T.timeline = function (v) {
    return '<div class="vz timeline" style="--n:' + v.items.length + '"><div class="tl"><i class="fill"></i></div><div class="tms">' + v.items.map(function (it, i) {
      return '<div class="ms bd"><div class="dot">' + icon(it.i) + '</div>' + txt(it) + '</div>';
    }).join('') + '</div></div>';
  };
  /* 궤도 — 가운데 한 사람, 둘레에 고를 것들. 둘레가 천천히 돕니다 */
  T.orbit = function (v) {
    var n = v.items.length;
    return '<div class="vz orbit"><div class="ob"><div class="ring2"></div><div class="mid">' + icon('person') + '<b>' + esc(v.center) + '</b></div>' +
      v.items.map(function (it, i) {
        var a = -Math.PI / 2 + i * 2 * Math.PI / n, x = 50 + Math.cos(a) * 41, y = 50 + Math.sin(a) * 41;
        return '<div class="op bd" style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%"><div class="ic">' + icon(it.i) + '</div>' + txt(it) + '</div>';
      }).join('') + '</div></div>';
  };
  /* 뒤집는 카드 — 한 번 누르면 앞면(고객님의 말), 한 번 더 누르면 뒤집혀 속뜻 · 다음 선택 */
  T.flip = function (v) {
    return '<div class="vz flip n' + v.items.length + '">' + v.items.map(function (it) {
      return '<div class="fc bd"><div class="fl bd"><div class="fa"><i class="fi">' + icon('chat') + '</i><span class="fx">' + esc(v.fa || '') + '</span><b>' + esc(it.a) + '</b><small>' + esc(v.hint || '뒤집어 볼까요?') + '</small></div>' +
        '<div class="fb"><i class="fi">' + icon('light') + '</i><span class="fx">' + esc(v.fb || '') + '</span><b>' + esc(it.b) + '</b>' + (it.c ? '<small>' + esc(it.c) + '</small>' : '') + '</div></div></div>';
    }).join('') + '</div>';
  };
  /* 다섯을 세는 동안 — 원이 하나씩 차오릅니다 */
  T.count = function (v) {
    var dots = '';
    for (var k = 0; k < (v.n || 5); k++) dots += '<i style="--k:' + k + '"><em>' + (k + 1) + '</em></i>';
    return '<div class="vz count"><div class="cd bd">' + dots + '<span>' + esc(v.label || '') + '</span></div><div class="cl">' +
      v.items.map(function (it) { return '<div class="cli bd"><div class="ic">' + icon(it.i) + '</div>' + txt(it) + '</div>'; }).join('') + '</div></div>';
  };
  /* 벽돌 — 아래부터 한 장씩 쌓입니다 */
  T.bricks = function (v) {
    return '<div class="vz bricks">' + v.items.map(function (it, i) {
      return '<div class="bk bd" style="--i:' + i + '"><div class="ic">' + icon(it.i) + '</div>' + txt(it) + '</div>';
    }).join('') + '</div>';
  };
  /* 펼치는 카드 — 손에 쥔 패처럼 하나씩 펼쳐집니다 */
  T.fan = function (v) {
    var n = v.items.length;
    return '<div class="vz fan">' + v.items.map(function (it, i) {
      var r = (i - (n - 1) / 2) * 9;
      return '<div class="fn bd" style="--r:' + r + 'deg;--x:' + ((i - (n - 1) / 2) * 21) + 'cqw;--i:' + i + '"><div class="ic">' + icon(it.i) + '</div>' + txt(it) + '</div>';
    }).join('') + '</div>';
  };
  /* 다섯 개의 문 — 하나씩 열리며 빛이 새어 나오고, 문 안에 그 부의 그림이 섭니다 */
  var DOORI = ['person', 'compass', 'tree', 'ear', 'handshake'];
  T.doors = function (v) {
    return '<div class="vz doors">' + v.items.map(function (it, i) {
      return '<div class="dr bd"><div class="fr"><div class="glow"></div><div class="di">' + icon(it.i || DOORI[i % DOORI.length]) + '</div><div class="lf"></div><em>' + (i + 1) + '</em></div>' + txt(it) + '</div>';
    }).join('') + '</div>';
  };
  /* 하루의 해 — 말이 바뀔 때마다 해가 그 자리로 옮겨 갑니다(hook) */
  T.sun = function (v) {
    var n = v.items.length;
    return '<div class="vz sun"><svg class="arc" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M60 280A440 246 0 0 1 940 280"/></svg><div class="sunb"></div>' +
      v.items.map(function (it, i) {
        var a = Math.PI * (1 - (i + 0.5) / n), x = 50 + Math.cos(a) * 44, y = 93 - Math.sin(a) * 82;
        return '<div class="sm bd" data-x="' + x.toFixed(1) + '" data-y="' + y.toFixed(1) + '" style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%">' + txt(it) + '</div>';
      }).join('') + '</div>';
  };
  /* 저울 — 고르는 쪽과 못 고르는 쪽. 하나 놓일 때마다 저울이 기웁니다 */
  T.scale = function (v) {
    return '<div class="vz scale"><div class="sc"><svg viewBox="0 0 300 220" aria-hidden="true"><path class="post" d="M150 40V200M100 200H200"/>' +
      '<g class="beam"><path d="M40 50H260"/><path d="M40 50 18 100H62Z"/><path d="M260 50 238 100H282Z"/><text x="40" y="128">' + esc(v.L || '고른 것') + '</text><text x="260" y="128">' + esc(v.R || '못 고른 것') + '</text></g>' +
      '<circle cx="150" cy="40" r="7"/></svg></div><div class="sl2">' +
      v.items.map(function (it) { return '<div class="sli bd">' + txt(it) + '</div>'; }).join('') + '</div></div>';
  };

  /* 판 X219 — 「설계사의 선택 → 고객님이 나를 고르는 이유」. 다섯 이유는 bcd-slides.js 의 WHY 한 벌을 받아 그립니다 (5번) */
  var NO = ['1', '2', '3', '4', '5', '6'], ORD = ['첫 번째', '두 번째', '세 번째', '네 번째', '다섯 번째', '여섯 번째'];
  var ARW = '<svg class="parw" viewBox="0 0 64 24" aria-hidden="true"><path pathLength="1" d="M2 12H56M47 4l9 8-9 8"/></svg>';
  /* 아래 다섯 칸 — 앞 부에서 모은 이유는 채워져 있고, 이번 이유는 오른쪽 카드가 설 때 들어옵니다(hook) */
  function why5(W, n) {
    return '<div class="why5">' + W.map(function (w, i) {
      return '<i class="' + (i < n ? 'done' : i === n ? 'now' : '') + '"><em>' + NO[i] + '</em><span>' + (i <= n ? esc(w.you) : '') + '</span></i>';
    }).join('') + '</div>';
  }
  /* 짝 — 왼쪽 설계사의 선택, 화살표가 그어지고, 오른쪽 고객님의 이유 */
  T.pair = function (v) {
    var w = v.why[v.n];
    return '<div class="vz pair"><div class="pr">' +
      '<div class="pc me bd"><div class="ic">' + icon(w.mi) + '</div><span class="fx">설계사의 선택</span>' + txt({ t: w.me, d: w.md }) + '</div>' +
      '<div class="pc you bd">' + ARW + '<div class="ic">' + icon(w.yi) + '</div><span class="fx">고객님이 나를 고르는 ' + ORD[v.n] + ' 이유</span><b>「' + esc(w.you) + '」</b></div>' +
      '</div>' + why5(v.why, v.n) + '</div>';
  };
  /* 두 질문 — 여는 마당. 아래 다섯 칸은 비어 있고, 오늘 하나씩 채웁니다 */
  T.ask2 = function (v) {
    return '<div class="vz pair ask2"><div class="pr">' +
      '<div class="pc me bd"><div class="ic">' + icon(v.a.i) + '</div><span class="fx">질문 하나</span>' + txt(v.a) + '</div>' +
      '<div class="pc you bd">' + ARW + '<div class="ic">' + icon(v.b.i) + '</div><span class="fx">질문 둘</span>' + txt(v.b) + '</div>' +
      '</div><div class="w5 bd">' + why5(v.why, -1) + '<small>오늘 부마다 하나씩 — 다섯 칸을 채웁니다</small></div></div>';
  };
  /* 다섯 이유 모아 보기 — 줄마다 선택 → 이유 */
  T.whyall = function (v) {
    return '<div class="vz whyall">' + v.why.map(function (w, i) {
      return '<div class="wa bd"><em>' + NO[i] + '</em><div class="m"><div class="ic">' + icon(w.mi) + '</div><span>' + esc(w.me) + '</span></div>' + ARW +
        '<div class="y"><div class="ic">' + icon(w.yi) + '</div><b>「' + esc(w.you) + '」</b></div></div>';
    }).join('') + '</div>';
  };

  /* 누를 때마다 — 도해가 지금 몇 번째인지 따라 움직입니다 */
  function hook(stage) {
    var vz = stage.querySelector('.vz');
    if (!vz) return;
    var on = function (sel) { return vz.querySelectorAll(sel + '.bd.on').length; };
    if (vz.classList.contains('climb')) {
      var k = on('.sp'), steps = vz.querySelectorAll('.sp'), cl = vz.querySelector('.climber');
      if (cl) {
        var t = k ? steps[k - 1] : null;
        cl.style.left = t ? (t.offsetLeft + t.offsetWidth / 2) + 'px' : '0px';
        cl.style.bottom = t ? (t.querySelector('.blk').offsetHeight) + 'px' : '0px';
        cl.classList.toggle('on', k > 0);
      }
    } else if (vz.classList.contains('rings')) {
      var n = on('.rli');
      vz.querySelectorAll('.rgo').forEach(function (r, i) { r.classList.toggle('lit', i < n); });
    } else if (vz.classList.contains('timeline')) {
      var m = on('.ms'), all = vz.querySelectorAll('.ms').length;
      var f = vz.querySelector('.fill'); if (f) f.style.width = (m > 1 ? ((m - 1) / (all - 1) * 100) : 0) + '%';
    } else if (vz.classList.contains('sun')) {
      var S = vz.querySelectorAll('.sm.bd.on'), b = vz.querySelector('.sunb');
      if (b) { var last = S[S.length - 1]; b.classList.toggle('on', !!last); if (last) { b.style.left = last.dataset.x + '%'; b.style.top = last.dataset.y + '%'; } }
    } else if (vz.classList.contains('pair') && !vz.classList.contains('ask2')) {
      vz.classList.toggle('got', !!vz.querySelector('.pc.you.bd.on'));
    } else if (vz.classList.contains('scale')) {
      var q = on('.sli'), beam = vz.querySelector('.beam');
      if (beam) beam.style.transform = 'rotate(' + (q ? (q % 2 ? -9 : 7) : 0) + 'deg)';
    }
  }
  /* 「한눈에」 · 인쇄 — 다 선 모양으로 */
  function settle(root) { root.querySelectorAll('.stage').forEach(function (st) { hook(st); }); }

  window.BCD_VIZ = {
    render: function (v) { return (T[v.k] || T.cards)(v); },
    hook: hook, settle: settle, icon: icon,
    kinds: Object.keys(T), icons: Object.keys(I)
  };
})();
