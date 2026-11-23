/* ══════════════════════════════════════════════════════════════════
   ba-art.js — 보장분석 <b>담보별 분리자료</b> · 직접 그린 SVG 도해 (판 X529)

   사장님 말씀 2026-11-23 — 「담보별로 지금 이 자료처럼 분리자료도 만들고」 →
   「<b>다로해 직접 svg로 그려서 따로 만들어</b>」.
   원수사 제안서의 삽화는 <b>베껴 쓸 수 없습니다</b>(CLAUDE.md 9번). 그래서 도해 11장을
   전부 <b>직접 SVG 로 그렸습니다</b>. 엑셀에는 SVG 가 안 들어가므로 <b>따로</b> 한 벌
   — 인쇄 한 장짜리 문서로 셉니다.

   ★ 지키는 것
   1번 — <b>그림 안에 지어낸 숫자가 없습니다.</b> 그림의 글자는 ① STD 의 담보 이름,
         ② STUDY_DOC 이 이미 화면에서 말하는 범위 %, ③ 고객 자료에서 온 수뿐입니다.
         못 읽은 값은 빈 칸(「—」)으로 두고 0 으로 적지 않습니다.
   3번 — <b>이름은 가린 것이 기본</b>입니다(나가는 자료이므로). 「이름 그대로」 는 한 번 더 묻습니다.
   4-1번 — 인쇄 문서라 <b>tnum 을 켜지 않습니다.</b> 켜면 우리가 뽑은 PDF 를 우리가 못 읽습니다.
   5번 — 담보 목록(STD) · 과부족 판정(gapState) · 담보 설명(DESC) · 셈(calc) · 몸 그림
         (APXBody) 을 <b>부르기만</b> 합니다. 여기서 다시 세지 않습니다.
         범위 %(뇌·심장 세 겹)는 <b>RANGE 한 곳</b>에만 둡니다 — STUDY_DOC 과 어긋나면
         check-baart 가 빨간불을 켭니다.
   9번 — 남의 삽화·사진이 한 장도 없습니다. 전부 선과 글자입니다.

   재는 자: scripts/check-baart.js
   ES5. 부르는 자리: app/ba.html 의 baArtGo().
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var g = window, A = {};

  /* ── 0. 지어내지 않는 사실 한 곳 ──────────────────────────────────
     뇌 · 심장은 이름이 좁으면 같은 병에도 0원입니다. 그 「세 겹」 의 범위 %는
     화면(보장분석 기준 ②)이 이미 말하는 값입니다. 두 곳에서 각자 적으면
     한쪽만 고쳐집니다 — 그래서 여기 한 벌만 두고 점검이 견줍니다 (5번). */
  A.RANGE = {
    '뇌':   { t: '뇌', o: [['뇌혈관질환', 100], ['뇌졸중', 67], ['뇌출혈', 9]], in2: '뇌경색' },
    '심장': { t: '심장', o: [['심혈관질환', 100], ['허혈성심장질환', 60], ['급성심근경색', 9]], in2: '' }
  };
  /* 보험금이 나오는 네 가지 방식 — 이름도 화면(기준 ①)과 같은 말이어야 합니다 */
  A.PAYWAY = ['목돈', '하루치', '매달', '한도'];

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/[\u0000-\u001f]/g, '');
  }
  /* 담보 설명에는 <b> 가 들어 있습니다 — 그것만 살리고 나머지는 지웁니다 */
  function rich(s) {
    return esc(s).replace(/&lt;(\/?)b&gt;/g, '<$1b>').replace(/&lt;(\/?)i&gt;/g, '<$1i>');
  }
  A._esc = esc;

  /* ── 1. 그림 연장 ─────────────────────────────────────────────────
     도해는 모두 같은 종이(640 × 300)에 그립니다 — 장마다 크기가 달라지면
     인쇄에서 줄이 안 맞습니다. 글자는 11~15 로만 씁니다. */
  var W = 640, H = 300;
  function svg(inner, h) {
    return '<svg class="ar" viewBox="0 0 ' + W + ' ' + (h || H) + '" role="img">' + inner + '</svg>';
  }
  function box(x, y, w, h, r, f, s, sw) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r || 0) +
      '" fill="' + (f || 'none') + '"' + (s ? (' stroke="' + s + '" stroke-width="' + (sw || 1.4) + '"') : '') + '/>';
  }
  function txt(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" font-size="' + (o.sz || 12) + '"' +
      ' fill="' + (o.c || '#333D4B') + '"' + (o.b ? ' font-weight="700"' : '') +
      ' text-anchor="' + (o.a || 'start') + '"' + (o.ls ? ' letter-spacing="-.3"' : '') + '>' + esc(s) + '</text>';
  }
  function ln(x1, y1, x2, y2, c, w, d) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="' + (c || '#C4CAD4') + '" stroke-width="' + (w || 1.3) + '"' +
      (d ? (' stroke-dasharray="' + d + '"') : '') + ' stroke-linecap="round"/>';
  }
  function arw(x1, y1, x2, y2, c) {
    c = c || '#8B95A1';
    var a = Math.atan2(y2 - y1, x2 - x1), L = 7;
    return ln(x1, y1, x2, y2, c, 1.6) +
      '<path d="M' + x2 + ' ' + y2 +
      ' L' + (x2 - L * Math.cos(a - 0.42)) + ' ' + (y2 - L * Math.sin(a - 0.42)) +
      ' L' + (x2 - L * Math.cos(a + 0.42)) + ' ' + (y2 - L * Math.sin(a + 0.42)) + ' Z" fill="' + c + '"/>';
  }
  function dot(cx, cy, r, f) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + f + '"/>'; }
  /* 묶음 색을 흰쪽으로 밝힙니다 — 인쇄에서 글자가 묻히지 않게 */
  function tint(hex, p) {
    var n = parseInt(String(hex).replace('#', ''), 16);
    var r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
    function m(v) { return Math.round(v + (255 - v) * p); }
    return 'rgb(' + m(r) + ',' + m(gg) + ',' + m(b) + ')';
  }
  A._tint = tint;
  /* 긴 글을 폭에 맞춰 줄로 끊습니다 — SVG 는 저절로 안 접힙니다 */
  function wrap(s, per) {
    var w = String(s).split(' '), L = [], cur = '';
    for (var i = 0; i < w.length; i++) {
      if ((cur + ' ' + w[i]).replace(/\s/g, '').length > per && cur) { L.push(cur); cur = w[i]; }
      else cur = cur ? (cur + ' ' + w[i]) : w[i];
    }
    if (cur) L.push(cur);
    return L;
  }
  function para(x, y, s, per, lh, o) {
    return wrap(s, per).map(function (t, i) { return txt(x, y + i * (lh || 16), t, o); }).join('');
  }

  /* 띠 제목 — 도해마다 맨 위 한 줄 */
  function cap(s, c) {
    return box(0, 0, W, 26, 4, tint(c, 0.86)) + txt(12, 18, s, { sz: 13, b: 1, c: c });
  }
  /* 아래 한 마디 — 그림이 무엇을 말하는가 */
  function foot(s, c, y, x) {
    return ln(12, y - 14, W - 12, y - 14, tint(c, 0.6), 1, '3 3') +
      txt(x || 12, y, s, { sz: 11.5, c: '#4E5968' });
  }

  /* ── 2. 도해 11장 ─────────────────────────────────────────────────
     한 장이 한 가지만 말합니다. 그림 안의 담보 이름은 전부 STD 에 있는 이름입니다. */
  var SCENE = {};

  /* ① 실손의료비 — 「쓴 만큼 돌려받는 것」과 「영수증 없이 나오는 목돈」은 다른 지갑 */
  SCENE['실손의료비'] = function (c) {
    var s = cap('실손은 ‘쓴 만큼’, 진단비는 ‘영수증 없이’ — 지갑이 다릅니다', c);
    /* 왼쪽 : 영수증 → 한도 깔때기 → 돌려받음 */
    s += box(24, 44, 256, 224, 10, '#FFFFFF', tint(c, 0.5), 1.4);
    s += txt(38, 66, '실손의료비', { sz: 13, b: 1, c: c });
    s += txt(38, 84, '한도 안에서 · 쓴 만큼', { sz: 11, c: '#8B95A1' });
    /* 영수증 */
    s += '<path d="M46 98 h92 v74 l-8 -6 -8 6 -8 -6 -8 6 -8 -6 -8 6 -8 -6 -8 6 -8 -6 -8 6 -8 -6 Z" fill="#F7F8FA" stroke="' + tint(c, 0.4) + '" stroke-width="1.2"/>';
    for (var i = 0; i < 4; i++) s += ln(56, 112 + i * 14, 128, 112 + i * 14, '#D5DBE3', 1.1);
    s += txt(92, 188, '영수증', { sz: 11, a: 'middle', c: '#6B7684' });
    /* 깔때기 = 한도 */
    s += '<path d="M160 100 h96 l-30 44 v34 h-36 v-34 Z" fill="' + tint(c, 0.82) + '" stroke="' + c + '" stroke-width="1.3"/>';
    s += txt(208, 122, '한도', { sz: 12, b: 1, a: 'middle', c: c });
    s += txt(208, 196, '돌려받는 돈', { sz: 11, a: 'middle', c: '#6B7684' });
    s += arw(140, 136, 156, 122, tint(c, 0.25));
    s += txt(152, 236, '→ 미리 「얼마 나온다」고 말할 수 없습니다', { sz: 11, a: 'middle', c: '#4E5968' });
    /* 오른쪽 : 진단 → 목돈 */
    s += box(300, 44, 316, 224, 10, '#FFFFFF', '#E5E8EB', 1.4);
    s += txt(316, 66, '진단비 (목돈)', { sz: 13, b: 1, c: '#191F28' });
    s += txt(316, 84, '진단만 되면 · 한 번에', { sz: 11, c: '#8B95A1' });
    s += box(316, 98, 118, 74, 8, '#F2F4F6', '#D5DBE3', 1.2);
    s += txt(375, 130, '진 단', { sz: 14, b: 1, a: 'middle', c: '#333D4B' });
    s += txt(375, 150, '확진되는 순간', { sz: 10.5, a: 'middle', c: '#8B95A1' });
    s += arw(442, 135, 476, 135, '#B0B8C1');
    for (var k = 0; k < 3; k++) s += box(486, 150 - k * 18, 96, 15, 4, tint('#F0A33C', 0.3 + k * 0.12), '#D98B2B', 1.1);
    s += txt(534, 188, '영수증 없이', { sz: 11, a: 'middle', c: '#6B7684' });
    s += txt(458, 236, '→ 치료비로 써도, 생활비로 써도 됩니다', { sz: 11, a: 'middle', c: '#4E5968' });
    s += foot('그래서 둘은 같은 자로 못 잽니다. 실손이 있어도 진단비 자리는 비어 있을 수 있습니다.', c, 290);
    return svg(s);
  };

  /* ② 암 — 한 번으로 끝나지 않는다 (담보 이름이 그 구조를 그대로 말합니다) */
  SCENE['암'] = function (c) {
    var s = cap('암은 ‘한 번’이 아닙니다 — 문이 여러 개입니다', c);
    var X = [70, 240, 410, 560], Y = 132;
    var nmz = ['일반암\n최초 1회', '재진단암\n재발암', '전이암\n원격전이', '통합암\n부위마다'];
    for (var i = 0; i < 4; i++) {
      var on = i === 0;
      s += box(X[i] - 56, Y - 42, 112, 84, 10, on ? tint(c, 0.74) : '#FFFFFF', on ? c : tint(c, 0.45), on ? 1.6 : 1.3);
      var pr = nmz[i].split('\n');
      s += txt(X[i], Y - 10, pr[0], { sz: 13, b: 1, a: 'middle', c: on ? '#8A3C18' : c });
      s += txt(X[i], Y + 12, pr[1], { sz: 11, a: 'middle', c: '#6B7684' });
      if (i < 3) s += arw(X[i] + 60, Y, X[i + 1] - 60, Y, tint(c, 0.3));
    }
    s += txt(70, 196, '처음 열리는 문', { sz: 11, a: 'middle', c: '#8B95A1' });
    s += txt(325, 196, '최초 진단비는 여기서 다시 안 열립니다', { sz: 11.5, a: 'middle', c: '#4E5968' });
    /* 옆문 : 유사암은 따로 센다 */
    s += box(24, 222, 592, 46, 8, '#F7F8FA', '#E5E8EB', 1.2);
    s += txt(40, 250, '옆문 — 유사암 (제자리암 · 경계성종양 · 갑상선암 · 기타피부암) 은 ‘각각 1회’ 로 따로 셉니다', { sz: 11.5, c: '#4E5968' });
    s += foot('최초 1회만 들고 있으면, 재발·전이에 열리는 문이 없습니다.', c, 290);
    return svg(s);
  };

  /* ③ 암 치료비 — 치료 한 바퀴 · 급여와 비급여는 따로 */
  SCENE['암 치료비'] = function (c) {
    var s = cap('치료는 한 바퀴를 돕니다 — 급여와 비급여는 따로 나옵니다', c);
    var cx = 196, cy = 158, R = 92;
    var st = ['진단', '수술', '항암약물', '방사선', '추적'];
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + tint(c, 0.62) + '" stroke-width="2" stroke-dasharray="5 5"/>';
    for (var i = 0; i < 5; i++) {
      var a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      var x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
      s += dot(x, y, 24, tint(c, 0.72)) + '<circle cx="' + x + '" cy="' + y + '" r="24" fill="none" stroke="' + c + '" stroke-width="1.3"/>';
      s += txt(x, y + 4, st[i], { sz: 10, b: 1, a: 'middle', c: '#8A3C18' });
    }
    s += txt(cx, cy - 6, '한 바퀴', { sz: 13, b: 1, a: 'middle', c: c });
    s += txt(cx, cy + 12, '단계마다 돈이 든다', { sz: 10.5, a: 'middle', c: '#8B95A1' });
    /* 오른쪽 : 두 겹 */
    s += box(316, 54, 300, 96, 10, tint(c, 0.86), c, 1.4);
    s += txt(332, 80, '비급여', { sz: 13, b: 1, c: '#8A3C18' });
    s += para(332, 100, '전액 본인부담 · 세기조절 방사선 · 로봇수술 · 표적약물 — 이 자리가 비면 영수증이 그대로 남습니다', 25, 16, { sz: 10.5, c: '#4E5968' });
    s += box(316, 160, 300, 68, 10, '#FFFFFF', '#D5DBE3', 1.3);
    s += txt(332, 186, '급여', { sz: 13, b: 1, c: '#333D4B' });
    s += para(332, 206, '건강보험이 함께 내는 자리 — 암 주요치료비는 급여 · 비급여가 따로입니다', 25, 16, { sz: 10.5, c: '#4E5968' });
    s += txt(466, 250, '한 칸에 적으면 둘 중 하나가 없는 것이 됩니다', { sz: 11, a: 'middle', c: '#6B7684' });
    s += foot('진단비는 한 번, 치료비는 바퀴를 돌 때마다 — 그래서 둘 다 봅니다.', c, 290);
    return svg(s);
  };

  /* ④⑤ 뇌 · 심장 — 세 겹 (범위가 곧 돈) */
  function 세겹(c, key) {
    var R = A.RANGE[key], o = R.o;
    var s = cap('이름이 좁으면 같은 병에도 0원 — ‘범위’가 곧 돈입니다', c);
    var cx = 196, cy = 156;
    var rr = [[112, 82], [78, 58], [44, 34]];
    /* 안으로 갈수록 진하게 — 맨 안쪽에서만 흰 글자가 읽힙니다 */
    var FIL = [tint(c, 0.9), tint(c, 0.66), c];
    for (var i = 0; i < 3; i++) {
      s += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rr[i][0] + '" ry="' + rr[i][1] +
        '" fill="' + FIL[i] + '" stroke="' + c + '" stroke-width="' + (1.2 + i * 0.3) + '"/>';
    }
    s += txt(cx, cy - 64, o[0][0], { sz: 12.5, b: 1, a: 'middle', c: c });
    s += txt(cx, cy - 32, o[1][0], { sz: 12.5, b: 1, a: 'middle', c: '#FFFFFF' });
    s += txt(cx, cy + (R.in2 ? -2 : 5), o[2][0], { sz: 12.5, b: 1, a: 'middle', c: '#FFFFFF' });
    if (R.in2) s += txt(cx, cy + 17, '· ' + R.in2, { sz: 11, a: 'middle', c: '#FFFFFF' });
    /* 오른쪽 : 넓은 것이 좁은 것을 덮는다 */
    s += txt(336, 66, '넓은 담보가 좁은 담보를 덮습니다', { sz: 12.5, b: 1, c: '#191F28' });
    for (var k = 0; k < 3; k++) {
      var y = 92 + k * 46, w = Math.round(224 * o[k][1] / 100);
      s += box(336, y, 224, 26, 5, '#F2F4F6');
      s += box(336, y, w, 26, 5, tint(c, 0.26));
      /* 막대가 글자보다 짧으면 글자를 <b>밖으로</b> 냅니다 — 안에 넣으면 묻힙니다 */
      var 안 = w > 92;
      s += txt(안 ? 344 : (w + 344), y + 18, o[k][0], { sz: 11.5, b: 1, c: 안 ? '#FFFFFF' : '#333D4B' });
      s += txt(616, y + 18, o[k][1] + '%', { sz: 11.5, b: 1, a: 'end', c: c });
    }
    s += para(336, 248, '%는 ‘그 이름으로 열리는 범위’ 입니다 — 금액보다 범위가 먼저입니다', 26, 16, { sz: 11, c: '#4E5968' });
    s += foot('좁은 이름만 1억을 들고 있어도, 범위 밖의 병에는 한 푼도 안 나옵니다.', c, 290);
    return svg(s);
  }
  SCENE['뇌'] = function (c) { return 세겹(c, '뇌'); };
  SCENE['심장'] = function (c) { return 세겹(c, '심장'); };

  /* ⑥ 순환계 — 한 담보가 둘을 덮는다 */
  SCENE['순환계 (뇌+심장)'] = function (c) {
    var s = cap('뇌와 심장을 한 담보가 덮습니다 — 겹치는 자리를 봅니다', c);
    s += '<ellipse cx="258" cy="168" rx="96" ry="70" fill="' + tint(c, 0.8) + '" stroke="' + c + '" stroke-width="1.4"/>';
    s += '<ellipse cx="382" cy="168" rx="96" ry="70" fill="' + tint(c, 0.8) + '" stroke="' + c + '" stroke-width="1.4"/>';
    s += txt(196, 162, '뇌', { sz: 15, b: 1, a: 'middle', c: c });
    s += txt(196, 182, '혈관질환', { sz: 11, a: 'middle', c: '#6B7684' });
    s += txt(444, 162, '심장', { sz: 15, b: 1, a: 'middle', c: c });
    s += txt(444, 182, '혈관질환', { sz: 11, a: 'middle', c: '#6B7684' });
    s += txt(320, 160, '순환계', { sz: 13, b: 1, a: 'middle', c: '#8A3C18' });
    s += txt(320, 180, '한 담보로', { sz: 10.5, a: 'middle', c: '#4E5968' });
    /* 우산 — 글자는 <b>우산 위</b>에 진한 색으로. 톱니 위에 흰 글자를 얹으면 묻힙니다. */
    s += txt(320, 46, '순환계질환 진단비 · 순환계 주요치료비', { sz: 12, b: 1, a: 'middle', c: c });
    s += '<path d="M150 98 Q320 56 490 98 Q470 88 452 98 Q432 86 412 98 Q392 86 372 98 Q352 86 332 98 Q312 86 292 98 Q272 86 252 98 Q232 86 212 98 Q192 86 172 98 Q160 90 150 98 Z" fill="' + tint(c, 0.52) + '" stroke="' + c + '" stroke-width="1.3"/>';
    s += ln(320, 76, 320, 104, c, 1.8);
    s += txt(12, 270, '따로따로 들면 둘 다 챙기기 쉽고, 한 담보로 덮으면 겹치는 자리를 아껴 쓸 수 있습니다.', { sz: 11.5, c: '#4E5968' });
    s += foot('어느 쪽이든 ‘비는 자리’ 를 먼저 봅니다 — 이름이 다르면 열리는 병이 다릅니다.', c, 290);
    return svg(s);
  };

  /* ⑦ 수술비 — 같은 수술비도 ‘종’ 이 다르면 다르다 */
  SCENE['수술비'] = function (c) {
    var s = cap('같은 수술비 담보도 ‘종’ 에 따라 금액이 다릅니다', c);
    var bx = 70, by = 244, bw = 72;
    for (var i = 0; i < 5; i++) {
      var h = 28 + i * 32;
      s += box(bx + i * (bw + 14), by - h, bw, h, 6, tint(c, 0.82 - i * 0.12), c, 1.3);
      s += txt(bx + i * (bw + 14) + bw / 2, by - h + 20, (i + 1) + '종', { sz: 12.5, b: 1, a: 'middle', c: i > 2 ? '#FFFFFF' : '#5B4109' });
    }
    s += ln(56, by, 486, by, '#B0B8C1', 1.4);
    /* 「금액」 글자는 뺍니다 — 띠 제목이 이미 말하고, 오른쪽 칸과 겹칩니다 */
    s += arw(498, by, 498, by - 162, tint(c, 0.2));
    s += box(514, 46, 102, 190, 8, '#F7F8FA', '#E5E8EB', 1.2);
    s += para(526, 70, '어느 수술이 몇 종인가는 상품마다 다릅니다 — 약관을 봅니다', 8, 16, { sz: 10.5, c: '#4E5968' });
    s += txt(526, 196, '여기서는', { sz: 10.5, c: '#8B95A1' });
    s += txt(526, 212, '금액을', { sz: 10.5, c: '#8B95A1' });
    s += txt(526, 228, '적지 않습니다', { sz: 10.5, b: 1, c: c });
    s += foot('질병 수술비 · 상해 수술비 · 1~5종 · 특정질병 수술 — 이름이 다르면 열리는 수술이 다릅니다.', c, 290);
    return svg(s);
  };

  /* ⑧ 입원 · 간병 — 하루치와 매달은 세는 자가 다르다 */
  SCENE['입원 · 간병'] = function (c) {
    var s = cap('하루치는 ‘날마다’, 간병은 ‘달마다’ — 세는 자가 다릅니다', c);
    s += txt(28, 62, '입원일당 — 하루마다', { sz: 12.5, b: 1, c: c });
    for (var i = 0; i < 20; i++) {
      s += box(28 + i * 24, 72, 19, 19, 3, tint(c, 0.72), c, 0.9);
    }
    s += txt(28, 112, '30일 입원이면 30배입니다 — 3만원짜리를 「3만원」 으로 세면 거짓말이 됩니다', { sz: 11, c: '#4E5968' });
    s += txt(28, 152, '장기요양 · 간병 — 달마다', { sz: 12.5, b: 1, c: c });
    for (var k = 0; k < 6; k++) {
      s += box(28 + k * 82, 162, 70, 30, 5, tint(c, 0.82), c, 1.1);
      s += txt(63 + k * 82, 182, (k + 1) + '달', { sz: 11, a: 'middle', c: '#1C5B3C' });
    }
    s += txt(524, 182, '…', { sz: 16, c: '#8B95A1' });
    s += txt(28, 212, '끝나는 날이 정해져 있지 않은 유일한 종류입니다', { sz: 11, c: '#4E5968' });
    /* 하루 4시간의 벽 */
    s += box(348, 232, 268, 48, 8, '#FFF7E6', '#E8A33C', 1.3);
    s += '<circle cx="376" cy="256" r="15" fill="#FFFFFF" stroke="#E8A33C" stroke-width="1.4"/>';
    s += ln(376, 256, 376, 246, '#E8A33C', 1.6) + ln(376, 256, 384, 258, '#E8A33C', 1.6);
    s += txt(400, 252, '재가급여 — 하루 4시간의 벽', { sz: 11.5, b: 1, c: '#8A5A08' });
    s += txt(400, 268, '그 벽 밖은 한도 밖입니다', { sz: 10.5, c: '#6B7684' });
    s += box(28, 232, 300, 48, 8, '#F7F8FA', '#E5E8EB', 1.2);
    s += txt(44, 252, '병원비 · 하루치 · 간병은 한 사건에서', { sz: 11, c: '#4E5968' });
    s += txt(44, 268, '각각 열립니다 — 하나만 나오지 않습니다', { sz: 11, c: '#4E5968' });
    return svg(s);
  };

  /* ⑨ 사망 · 장해 — 지급률에 따라 비례 (몸 그림은 APXBody 를 부릅니다) */
  SCENE['사망 · 장해'] = function (c) {
    var s = cap('장해는 ‘있다 / 없다’ 가 아니라 지급률에 따라 비례합니다', c);
    s += '<g transform="translate(40,38) scale(0.47)">' + 몸(['head', 'arm', 'leg']) + '</g>';
    var x0 = 196, x1 = 600, y = 150;
    s += ln(x0, y, x1, y, '#D5DBE3', 2);
    s += '<defs><linearGradient id="arGr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + tint(c, 0.82) + '"/><stop offset="1" stop-color="' + c + '"/></linearGradient></defs>';
    s += box(x0, y - 11, x1 - x0, 22, 5, 'url(#arGr)');
    s += txt(x0, y - 22, '3%', { sz: 11.5, b: 1, c: c });
    s += txt(x1, y - 22, '100%', { sz: 11.5, b: 1, a: 'end', c: c });
    s += txt((x0 + x1) / 2, y - 22, '지급률', { sz: 11.5, a: 'middle', c: '#8B95A1' });
    for (var i = 1; i < 10; i++) s += ln(x0 + (x1 - x0) * i / 10, y + 11, x0 + (x1 - x0) * i / 10, y + 17, '#B0B8C1', 1);
    s += para(x0, y + 42, '「후유장해 3~100%」 는 지급률이 3%만 되어도 그 비율만큼 나온다는 뜻입니다. 지급률이 절반이면 가입금액의 절반입니다.', 33, 17, { sz: 11.5, c: '#4E5968' });
    s += box(x0, y + 80, x1 - x0, 40, 8, '#F7F8FA', '#E5E8EB', 1.2);
    s += txt(x0 + 14, y + 99, '사망은 한 번, 장해는 남은 삶 전체입니다 —', { sz: 11, c: '#4E5968' });
    s += txt(x0 + 14, y + 114, '고도후유장해 생활자금은 ‘매달’ 로 나오는 자리입니다', { sz: 11, c: '#4E5968' });
    s += foot('지급률은 약관의 장해분류표가 정합니다 — 여기서 숫자를 외워 말하지 않습니다.', c, 290);
    return svg(s);
  };

  /* ⑩ 골절 · 화상 — 부위마다 · 정도마다 */
  SCENE['골절 · 화상'] = function (c) {
    var s = cap('부위마다 · 정도마다 — 같은 사고에도 열리는 담보가 다릅니다', c);
    s += '<g transform="translate(46,34) scale(0.5)">' + 몸([]) + '</g>';
    /* 뼈대 좌표(APXBody 의 0 0 200 470)를 그대로 환산합니다 — 어림하면 점이 몸 밖에 찍힙니다 */
    var B = [[100, 40], [52, 230], [148, 230], [85, 330], [115, 330], [78, 430], [113, 430]];
    for (var i = 0; i < B.length; i++) {
      var px = 46 + B[i][0] / 2, py = 34 + B[i][1] / 2;
      s += '<circle cx="' + px + '" cy="' + py + '" r="6.5" fill="' + c + '" stroke="#FFFFFF" stroke-width="1.6"/>';
    }
    s += txt(96, 286, '부위마다 따로', { sz: 11, a: 'middle', c: '#6B7684' });
    var R = [['골절 진단비', '뼈가 부러졌을 때 — 치아파절은 빠집니다'],
             ['골절 수술비', '수술을 했을 때 따로'],
             ['깁스 치료비', '수술이 아니어도 고정했을 때'],
             ['화상 진단비', '정도에 따라 — 중증화상은 따로 셉니다'],
             ['화상 수술비', '수술을 했을 때 따로']];
    for (var k = 0; k < R.length; k++) {
      var y = 48 + k * 46;
      s += box(196, y, 420, 38, 7, k % 2 ? '#FFFFFF' : tint(c, 0.9), tint(c, 0.5), 1.1);
      s += txt(212, y + 17, R[k][0], { sz: 12, b: 1, c: c });
      s += txt(212, y + 32, R[k][1], { sz: 10.5, c: '#6B7684' });
    }
    s += foot('진단 · 수술 · 고정은 다른 담보입니다 — 하나만 있으면 나머지 자리는 비어 있습니다.', c, 290, 196);
    return svg(s);
  };

  /* ⑪ 배상 · 운전자 — 남의 피해와 내 책임은 다른 길 */
  SCENE['배상 · 운전자'] = function (c) {
    var s = cap('남의 피해와 ‘내 책임’ 은 다른 길로 갑니다', c);
    s += box(24, 44, 286, 224, 10, '#FFFFFF', '#D5DBE3', 1.3);
    s += txt(40, 70, '남의 피해', { sz: 13, b: 1, c: '#333D4B' });
    s += txt(40, 88, '자동차보험 · 배상책임이 가는 자리', { sz: 11, c: '#8B95A1' });
    s += box(40, 104, 254, 44, 7, '#F7F8FA', '#E5E8EB', 1.1);
    s += txt(54, 124, '가족일상생활배상책임', { sz: 12, b: 1, c: '#333D4B' });
    s += txt(54, 139, '남의 물건 · 남의 몸에 생긴 손해', { sz: 10.5, c: '#6B7684' });
    s += para(40, 178, '이 자리는 대개 자동차보험 · 주택화재보험에 이미 붙어 있습니다 — 중복을 먼저 봅니다', 30, 16, { sz: 11, c: '#4E5968' });
    s += box(326, 44, 290, 224, 10, tint(c, 0.9), c, 1.4);
    s += txt(342, 70, '내 책임', { sz: 13, b: 1, c: c });
    s += txt(342, 88, '운전자보험만 가는 자리 — 형사 · 행정', { sz: 11, c: '#4E5968' });
    var D = ['교통사고처리지원금', '변호사선임비용', '벌금', '자동차사고 부상치료비'];
    for (var i = 0; i < D.length; i++) {
      var y = 104 + i * 36;
      s += box(342, y, 258, 30, 6, '#FFFFFF', tint(c, 0.5), 1.1);
      s += dot(358, y + 15, 3.4, c);
      s += txt(372, y + 19, D[i], { sz: 11.5, b: 1, c: '#333D4B' });
    }
    s += txt(471, 262, '자동차보험으로는 안 되는 자리입니다', { sz: 11, a: 'middle', c: '#4E5968' });
    s += foot('차를 사면 생기는 자리입니다 — 차가 없으면 미뤄도 됩니다.', c, 290);
    return svg(s);
  };

  /* 몸 — 있는 그림을 부릅니다 (5번). 없으면 세우지 않습니다 (1번) */
  function 몸(hi) {
    if (!g.APXBody || !g.APXBody.art) return '';
    return '<svg viewBox="' + g.APXBody.VB + '" width="200" height="470" x="0" y="0">' + g.APXBody.art() + '</svg>';
  }

  /* 도해 — 묶음 이름으로 찾습니다. 없으면 <b>그리지 않습니다</b>(1번: 지어내지 않는다) */
  A.scene = function (mid, c) {
    return SCENE[mid] ? SCENE[mid](c || '#3E6FD9') : '';
  };
  A._scenes = function () { return Object.keys(SCENE); };

  /* ⓪ 맨 앞 — 보험금이 나오는 네 가지 방식 */
  A.payScene = function () {
    var c = '#3E6FD9', s = cap('보험금은 네 가지 방식으로 나옵니다 — 같은 자로 못 잽니다', c);
    var D = [['목돈', '진단만 되면 한 번에', '영수증 없이'],
             ['하루치', '입원한 날마다', '30일이면 30배'],
             ['매달', '장기요양처럼 달마다', '끝이 정해져 있지 않다'],
             ['한도', '실제로 쓴 만큼', '미리 말할 수 없다']];
    for (var i = 0; i < 4; i++) {
      var x = 24 + i * 150;
      s += box(x, 56, 138, 150, 10, i === 0 ? tint(c, 0.78) : '#FFFFFF', i === 0 ? c : '#D5DBE3', 1.3);
      s += txt(x + 69, 92, D[i][0], { sz: 17, b: 1, a: 'middle', c: i === 0 ? '#153C84' : '#333D4B' });
      s += para(x + 14, 122, D[i][1], 11, 16, { sz: 11, c: '#4E5968' });
      s += txt(x + 14, 186, D[i][2], { sz: 10.5, c: '#8B95A1' });
    }
    /* 「지갑이 여럿」 은 <b>다음 도해</b>가 말합니다 — 같은 말을 두 곳에 두지 않습니다 (5번) */
    s += box(24, 228, 592, 40, 8, '#F7F8FA', '#E5E8EB', 1.2);
    s += txt(40, 253, '이 자료의 합계는 ‘목돈’ 만 더합니다 — 하루치 · 매달 · 한도는 따로 셉니다.', { sz: 11.5, b: 1, c: '#333D4B' });
    return svg(s);
  };

  /* ⓪-2 한 사건에 지갑이 여럿 — 열리는 <b>때</b>가 다릅니다.
     그림의 글자는 STD 의 담보 이름과 위 네 방식의 이름뿐입니다 (1번). */
  A.walletScene = function () {
    var c = '#3E6FD9', s = cap('한 사건에 지갑이 여럿입니다 — 열리는 ‘때’ 가 다릅니다', c);
    /* 가운데 사건 */
    s += box(248, 46, 144, 44, 9, tint(c, 0.74), c, 1.5);
    s += txt(320, 74, '수술 한 번', { sz: 14, b: 1, a: 'middle', c: '#153C84' });
    var D = [[76, '진단비', '확진되는 순간', A.PAYWAY[0]],
             [248, '수술비 · 입원일당', '수술할 때 · 날마다', A.PAYWAY[0] + ' · ' + A.PAYWAY[1]],
             [420, '실손의료비', '영수증이 나올 때', A.PAYWAY[3]]];
    for (var i = 0; i < 3; i++) {
      var x = D[i][0];
      s += arw(320, 92, x + 72, 134, tint(c, 0.3));
      s += box(x, 140, 144, 96, 9, '#FFFFFF', '#D5DBE3', 1.3);
      s += txt(x + 72, 166, D[i][1], { sz: 12.5, b: 1, a: 'middle', c: '#333D4B' });
      s += txt(x + 72, 188, D[i][2], { sz: 11, a: 'middle', c: '#8B95A1' });
      s += box(x + 30, 202, 84, 22, 5, tint(c, 0.86));
      s += txt(x + 72, 217, D[i][3], { sz: 10.5, b: 1, a: 'middle', c: '#153C84' });
    }
    s += foot('그래서 「보험금 얼마 나와요?」 는 ‘어느 단계냐’ 를 물어야 답할 수 있습니다.', c, 268);
    return svg(s, 280);
  };

  /* ── 3. 거미줄 — 권장과 가입(후) 을 겹쳐 봅니다 ───────────────────
     수는 전부 고객 자료에서 옵니다. 모르는 값은 그리지 않습니다 (1번). */
  A.radar = function (rows) {
    var n = rows.length;
    if (n < 3) return '';
    var cx = 320, cy = 246, R = 200, s = '';
    function pt(i, v) {
      var a = -Math.PI / 2 + i * (Math.PI * 2 / n);
      return [cx + R * v * Math.cos(a), cy + R * v * Math.sin(a)];
    }
    for (var r = 1; r <= 4; r++) {
      var p = [];
      for (var i = 0; i < n; i++) p.push(pt(i, r / 4).join(' '));
      s += '<polygon points="' + p.join(',') + '" fill="none" stroke="#E5E8EB" stroke-width="1"/>';
    }
    for (var i2 = 0; i2 < n; i2++) { var e = pt(i2, 1); s += ln(cx, cy, e[0], e[1], '#E5E8EB', 1); }
    function poly(key, col, fill) {
      var p = [];
      for (var i = 0; i < n; i++) {
        var v = rows[i][key];
        p.push(pt(i, (v === null || v === undefined) ? 0 : Math.max(0, Math.min(1, v))).join(' '));
      }
      return '<polygon points="' + p.join(',') + '" fill="' + fill + '" stroke="' + col + '" stroke-width="2"/>';
    }
    s += poly('need', '#8B95A1', 'rgba(139,149,161,.12)');
    s += poly('have', '#3E6FD9', 'rgba(62,111,217,.22)');
    for (var i3 = 0; i3 < n; i3++) {
      var a = -Math.PI / 2 + i3 * (Math.PI * 2 / n);
      var lx = cx + (R + 26) * Math.cos(a), ly = cy + (R + 26) * Math.sin(a);
      var an = Math.abs(Math.cos(a)) < 0.3 ? 'middle' : (Math.cos(a) > 0 ? 'start' : 'end');
      s += txt(lx, ly + 4, rows[i3].n, { sz: 11, a: an, c: '#4E5968' });
      var h = rows[i3].have;
      if (h !== null && h !== undefined) { var q = pt(i3, Math.max(0, Math.min(1, h))); s += dot(q[0], q[1], 3.4, '#3E6FD9'); }
    }
    /* 범례는 <b>왼쪽 아래</b>로 — 위에 두면 축 이름을 가립니다 */
    s += box(10, 428, 158, 54, 6, '#FFFFFF', '#E5E8EB', 1.1);
    s += ln(24, 448, 48, 448, '#8B95A1', 2.4) + txt(56, 452, '표준 (권장)', { sz: 11, c: '#4E5968' });
    s += ln(24, 468, 48, 468, '#3E6FD9', 2.4) + txt(56, 472, '조정 후 가입', { sz: 11, c: '#4E5968' });
    return '<svg class="ar rd" viewBox="0 0 640 500" role="img">' + s + '</svg>';
  };


  /* ── 4. 분리자료 한 벌 ─────────────────────────────────────────────
     A4 한 장에 묶음 하나. 차례는 사장님 자료 차례 그대로입니다 —
     표지 · 보험금 네 방식 · 묶음 11장 · 거미줄.
     ★ 수는 전부 STD · gapState · calc() 에서 옵니다. 여기서 다시 세지 않습니다 (5번).
     ★ 인쇄 문서라 tnum 을 켜지 않습니다 (4-1번).                          */

  function 단위글(u) {
    var M = { L: A.PAYWAY[0], D: A.PAYWAY[1], M: A.PAYWAY[2], A: A.PAYWAY[3] };
    return M[u] || A.PAYWAY[0];
  }
  var MK = { o: '충분', h: '부족', x: '미가입' };

  /* 이름 가리기 — osMaskName 과 같은 규칙 (3번) */
  function mask(s) {
    s = String(s || '').trim();
    if (!s) return '';
    return s.charAt(0) + '○○';
  }
  A._mask = mask;

  /* 한 묶음 장 */
  function 묶음장(gp, C, no) {
    var c = gp.c || '#3E6FD9';
    var cnt = { o: 0, h: 0, x: 0 }, tr = '';
    gp.rows.forEach(function (r) {
      var sa = g.gapState(r.k, C.a[r.k]), sb = g.gapState(r.k, C.b[r.k]);
      cnt[sa]++;
      var 전 = g.amt(r.k, C.b[r.k]), 후 = g.amt(r.k, C.a[r.k]);
      var 변 = (C.b[r.k] !== C.a[r.k]);
      tr += '<tr class="s-' + sa + (변 ? ' chg' : '') + '">' +
        '<td class="nm">' + esc(r.n) + '</td>' +
        '<td class="u">' + esc(단위글(r.u)) + '</td>' +
        '<td class="n">' + esc(r.std > 0 ? g.amt(r.k, r.std) : '—') + '</td>' +
        '<td class="n b4">' + esc(전) + '</td>' +
        '<td class="n af">' + esc(후) + (변 ? '<i class="ar-chg">바뀜</i>' : '') + '</td>' +
        '<td class="st"><b>' + MK[sa] + '</b>' + (sb !== sa ? ('<i>전 ' + MK[sb] + '</i>') : '') + '</td></tr>';
    });

    /* 「이것만은」 — 비어 있는 담보의 설명을 그 자리에서 보여 줍니다.
       비는 자리가 없으면 그 묶음에서 가장 넓은 담보의 설명을 둡니다.
       설명이 없으면 <b>칸을 세우지 않습니다</b> (1번). */
    var 짚 = null;
    gp.rows.forEach(function (r) {
      if (짚) return;
      var sa = g.gapState(r.k, C.a[r.k]);
      if ((sa === 'x' || sa === 'h') && g.DESC && g.DESC[r.k]) 짚 = r;
    });
    if (!짚) gp.rows.forEach(function (r) { if (!짚 && g.DESC && g.DESC[r.k]) 짚 = r; });
    var 설명 = '';
    if (짚) {
      var d = String(g.DESC[짚.k]).split(/<br>|\n/).slice(0, 2).join(' ');
      설명 = '<div class="ar-why" style="border-color:' + tint(c, 0.5) + ';background:' + tint(c, 0.94) + '">' +
        '<div class="ar-why-h">이것만은 — <b>' + esc(짚.n) + '</b></div>' +
        '<div class="ar-why-b">' + rich(d) + '</div></div>';
    }

    var 도 = A.scene(gp.mid, c);
    return '<section class="pg">' +
      '<div class="ar-h" style="border-color:' + c + '">' +
        '<span class="ar-ic">' + esc(gp.ic || '') + '</span>' +
        '<span class="ar-t"><b style="color:' + c + '">' + esc(gp.mid) + '</b>' +
        '<i>' + esc(gp.big) + '</i></span>' +
        '<span class="ar-cnt">충분 ' + cnt.o + ' · 부족 ' + cnt.h + ' · <b>미가입 ' + cnt.x + '</b></span>' +
        '<span class="ar-no">' + no + '</span>' +
      '</div>' +
      (도 ? ('<div class="ar-art">' + 도 + '</div>')
          : '<div class="ar-none">이 묶음은 <b>도해를 세우지 않았습니다</b> — 그릴 근거가 자료에 없습니다.</div>') +
      '<table class="ar-tb"><thead><tr><th>담보</th><th>방식</th><th>권장</th><th>지금</th><th>조정 후</th><th>상태</th></tr></thead>' +
      '<tbody>' + tr + '</tbody></table>' +
      설명 +
      '<div class="ar-say"><div class="ar-say-h">보험 전문가의 한 마디</div><div class="ar-say-b"></div></div>' +
      '</section>';
  }

  /* 급한 순서 · 거미줄 쪽 */
  function 그래프장(STD, C) {
    var L = [];
    STD.forEach(function (gp) {
      var need = 0, have = 0, n = 0;
      gp.rows.forEach(function (r) {
        if (r.u === 'A' || !(r.std > 0)) return;              /* 한도형과 권장 없는 담보는 안 견줍니다 */
        need += r.std; n++;
        var v = C.a[r.k];
        have += (v === null || v === undefined || !isFinite(v)) ? 0 : Math.min(v, r.std);
      });
      if (n > 0) L.push({ n: gp.mid, need: 1, have: need > 0 ? (have / need) : 0, 모름: 0, 권: need, 가: have });
    });
    var rd = A.radar(L);
    var 급 = L.slice().sort(function (a, b) { return a.have - b.have; });
    var tr = 급.map(function (x, i) {
      return '<tr><td class="n">' + (i + 1) + '</td><td class="nm">' + esc(x.n) + '</td>' +
        '<td class="n">' + Math.round(x.have * 100) + '%</td>' +
        '<td class="bar"><span style="width:' + Math.round(Math.max(0, Math.min(1, x.have)) * 100) + '%"></span></td></tr>';
    }).join('');
    return '<section class="pg">' +
      '<div class="ar-h" style="border-color:#3E6FD9"><span class="ar-ic">🕸️</span>' +
      '<span class="ar-t"><b style="color:#3E6FD9">한눈에 — 권장과 지금</b><i>묶음마다 얼마나 채워졌나</i></span>' +
      '<span class="ar-no">마지막</span></div>' +
      (rd ? ('<div class="ar-art">' + rd + '</div>')
          : '<div class="ar-none">견줄 묶음이 <b>셋보다 적어</b> 거미줄을 세우지 않았습니다.</div>') +
      '<table class="ar-tb sm"><thead><tr><th>순서</th><th>묶음</th><th>채워진 정도</th><th></th></tr></thead><tbody>' + tr + '</tbody></table>' +
      '<div class="ar-note">채워진 정도는 <b>권장이 정해진 담보</b>만 견준 것입니다. 한도형(실손)과 권장이 없는 담보는 ' +
      '여기 들어가지 않습니다 — 없는 기준을 만들지 않습니다.</div>' +
      '<div class="ar-say"><div class="ar-say-h">보험 전문가의 한 마디</div><div class="ar-say-b"></div></div>' +
      '</section>';
  }

  var CSS =
    '*{box-sizing:border-box;margin:0;padding:0}' +
    'body{font-family:-apple-system,"Apple SD Gothic Neo","Malgun Gothic","맑은 고딕",sans-serif;' +
      'color:#191F28;background:#F2F4F6;-webkit-text-size-adjust:100%}' +
    '.pg{width:210mm;min-height:297mm;margin:8mm auto;padding:14mm 13mm;background:#fff;' +
      'box-shadow:0 2px 14px rgba(0,0,0,.09);page-break-after:always;break-after:page;display:flex;flex-direction:column}' +
    '.pg:last-of-type{page-break-after:auto;break-after:auto}' +
    '.ar-h{display:flex;align-items:center;gap:10px;border-bottom:3px solid;padding-bottom:9px;margin-bottom:12px}' +
    '.ar-ic{font-size:26px;line-height:1}' +
    '.ar-t{flex:1;display:flex;flex-direction:column;gap:2px}' +
    '.ar-t b{font-size:20px;letter-spacing:-.4px}.ar-t i{font-style:normal;font-size:11.5px;color:#8B95A1}' +
    '.ar-cnt{font-size:11.5px;color:#6B7684;white-space:nowrap}.ar-cnt b{color:#D94A4A}' +
    '.ar-no{font-size:11px;color:#B0B8C1;white-space:nowrap}' +
    '.ar-art{margin:2px 0 12px}.ar-art svg{display:block;width:100%;height:auto}' +
    '.ar-art svg.rd{max-width:150mm;margin:0 auto}' +
    /* ★ 인쇄에서는 거미줄을 줄입니다 — 안 줄이면 이 장만 두 쪽으로 샙니다(쪽 수를 세는 자가 잡았습니다) */
    '.ar-none{margin:10px 0 14px;padding:14px;border:1px dashed #D5DBE3;border-radius:8px;' +
      'font-size:12px;color:#6B7684;background:#F7F8FA}' +
    '.ar-tb{width:100%;border-collapse:collapse;font-size:12px}' +
    '.ar-tb th{background:#F2F4F6;color:#4E5968;font-size:10.5px;font-weight:700;padding:5px 6px;' +
      'border-bottom:1.4px solid #D5DBE3;text-align:left}' +
    '.ar-tb td{padding:7px 6px;border-bottom:1px solid #EEF1F5;vertical-align:middle}' +
    '.ar-tb td.nm{font-weight:600}.ar-tb td.u{color:#8B95A1;font-size:10.5px;white-space:nowrap}' +
    '.ar-tb td.n{text-align:right;white-space:nowrap}' +
    '.ar-tb td.b4{color:#6B7684}.ar-tb td.af{font-weight:700}' +
    '.ar-tb td.st{text-align:right;white-space:nowrap;font-size:10.5px}' +
    '.ar-tb td.st i{font-style:normal;color:#B0B8C1;margin-left:5px}' +
    '.ar-tb tr.s-x td.st b{color:#D94A4A}.ar-tb tr.s-h td.st b{color:#D98B2B}.ar-tb tr.s-o td.st b{color:#1C8A5B}' +
    '.ar-tb tr.s-x td.nm{color:#D94A4A}' +
    '.ar-tb tr.chg td{background:#FFFBF0}' +
    '.ar-chg{font-style:normal;font-size:9.5px;color:#D98B2B;margin-left:5px;border:1px solid #F0D9A8;' +
      'border-radius:3px;padding:0 3px}' +
    '.ar-tb.sm td.bar{width:38%}' +
    '.ar-tb td.bar span{display:block;height:9px;border-radius:5px;background:#3E6FD9;min-width:2px}' +
    '.ar-why{margin:12px 0 0;padding:11px 13px;border:1.4px solid;border-radius:9px}' +
    '.ar-why-h{font-size:11.5px;font-weight:700;color:#4E5968;margin-bottom:5px}' +
    '.ar-why-b{font-size:12px;line-height:1.66;color:#333D4B}' +
    /* 남는 자리를 「한 마디」 칸이 먹습니다 — 흰 여백이 아니라 <b>적는 자리</b>가 됩니다 */
    '.ar-say{margin-top:auto;padding-top:14px;flex:0 0 auto}' +
    '.ar-say-h{font-size:11px;font-weight:700;color:#8B95A1;margin-bottom:5px}' +
    '.ar-say-b{height:32mm;border:1.4px dashed #C4CAD4;border-radius:9px;background:#FCFCFD}' +
    '.ar-note{margin-top:10px;font-size:10.5px;line-height:1.6;color:#8B95A1}' +
    /* 표지 */
    '.cv{justify-content:center;text-align:center}' +
    '.cv h1{font-size:34px;letter-spacing:-1px;margin-bottom:8px}' +
    '.cv .who{font-size:19px;color:#3E6FD9;font-weight:700;margin-bottom:4px}' +
    '.cv .dt{font-size:12px;color:#8B95A1;margin-bottom:26px}' +
    '.cv .sum{display:flex;gap:10px;justify-content:center;margin-bottom:26px}' +
    '.cv .sum div{flex:1;max-width:46mm;padding:13px 8px;border:1.4px solid #E5E8EB;border-radius:11px}' +
    '.cv .sum b{display:block;font-size:27px;line-height:1.2}' +
    '.cv .sum i{font-style:normal;font-size:11px;color:#8B95A1}' +
    '.cv ol{text-align:left;max-width:132mm;margin:0 auto;font-size:12px;line-height:1.95;color:#4E5968}' +
    '.cv .ft{margin-top:26px;font-size:10.5px;line-height:1.75;color:#8B95A1;max-width:150mm;' +
      'margin-left:auto;margin-right:auto;text-align:left}' +
    /* 띠 — 인쇄에는 안 나갑니다 */
    '.bar0{position:sticky;top:0;z-index:9;display:flex;gap:8px;align-items:center;' +
      'padding:9px 14px;background:#191F28;color:#fff;font-size:12.5px}' +
    '.bar0 button{font:inherit;font-weight:700;border:0;border-radius:7px;padding:6px 13px;' +
      'background:#3E6FD9;color:#fff;cursor:pointer}' +
    '.bar0 span{flex:1;opacity:.82;font-size:11.5px}' +
    /* ★ 인쇄 규칙은 <b>맨 끝</b>에 둡니다 — 가운데 두었더니 뒤에 오는 규칙에
       덮여 아무 일도 안 했습니다(같은 세기면 뒤가 이깁니다).
       담보가 14줄인 장(암 치료비)이 한 장을 넘겼고, 화면 자로는 안 보였습니다 —
       <b>진짜 PDF 쪽 수</b>를 세는 자가 잡았습니다. */
    '@media print{body{background:#fff}.bar0{display:none}' +
      '.pg{width:auto;min-height:0;margin:0;padding:0;box-shadow:none}' +
      '.ar-art svg.rd{max-width:118mm}' +
      '.ar-say{padding-top:10px}.ar-say-b{height:20mm}' +
      '.ar-tb td{padding:5px 6px}' +
      '.ar-why{margin-top:10px;padding:9px 12px}' +
      '*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}' +
    '@page{size:A4 portrait;margin:11mm}';

  A.build = function (opt) {
    opt = opt || {};
    var S = g.S, STD = g.STD, C = g.calc();
    var 실명 = (S && S.who && S.who.name) ? String(S.who.name) : '';
    var nm = opt.real ? (실명 || '고객') : (mask(실명) || '고객');
    var d = new Date();
    var 날 = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);

    /* 요약 눈금 — gapHtml 과 같은 자(gapState)로 셉니다 (5번) */
    var cnt = { o: 0, h: 0, x: 0 }, 담보수 = 0;
    STD.forEach(function (gp) {
      gp.rows.forEach(function (r) { cnt[g.gapState(r.k, C.a[r.k])]++; 담보수++; });
    });

    var 쪽 = [];
    쪽.push('<section class="pg cv">' +
      '<h1>보장분석 — 담보별 분리자료</h1>' +
      '<div class="who">' + esc(nm) + ' 님</div>' +
      '<div class="dt">' + esc(날) + ' · 담보 ' + 담보수 + '가지 · 묶음 ' + STD.length + '개' +
      (opt.real ? '' : ' · 이름은 가린 것이 기본입니다') + '</div>' +
      '<div class="sum">' +
        '<div><b style="color:#1C8A5B">' + cnt.o + '</b><i>충분</i></div>' +
        '<div><b style="color:#D98B2B">' + cnt.h + '</b><i>부족</i></div>' +
        '<div><b style="color:#D94A4A">' + cnt.x + '</b><i>미가입</i></div>' +
      '</div>' +
      '<ol>' + STD.map(function (gp) {
        return '<li>' + esc(gp.ic || '') + ' <b>' + esc(gp.mid) + '</b> <span style="color:#8B95A1">' + esc(gp.big) + '</span></li>';
      }).join('') + '<li>🕸️ <b>한눈에 — 권장과 지금</b></li></ol>' +
      '<div class="ft">· 도해는 모두 <b>직접 그린 것</b>입니다. 남의 자료 삽화를 옮기지 않았습니다.<br>' +
      '· 숫자는 <b>고객 자료와 이 도구의 표준</b>에서만 왔습니다. 모르는 값은 「—」 로 두었습니다.<br>' +
      '· 보험료 · 보장은 <b>심사 결과에 따릅니다.</b> 세금은 <b>요건 충족 시</b>에만 그렇습니다 — 판단은 세무 전문가에게 맡기십시오.</div>' +
      '</section>');

    쪽.push('<section class="pg">' +
      '<div class="ar-h" style="border-color:#3E6FD9"><span class="ar-ic">💰</span>' +
      '<span class="ar-t"><b style="color:#3E6FD9">보험금은 네 가지 방식으로 나온다</b>' +
      '<i>먼저 읽는 법</i></span><span class="ar-no">0</span></div>' +
      '<div class="ar-art">' + A.payScene() + '</div>' +
      '<div class="ar-note">이 뒤의 표에서 <b>방식</b> 칸이 그것입니다. ' +
      '「권장」 과 「지금」 은 <b>같은 방식끼리만</b> 견주었습니다 — 하루치와 목돈을 한 자로 재면 만 배가 틀립니다.</div>' +
      '<div class="ar-art" style="margin-top:14px">' + A.walletScene() + '</div>' +
      '<div class="ar-say"><div class="ar-say-h">보험 전문가의 한 마디</div><div class="ar-say-b"></div></div>' +
      '</section>');

    STD.forEach(function (gp, i) { 쪽.push(묶음장(gp, C, (i + 1) + ' / ' + STD.length)); });
    쪽.push(그래프장(STD, C));

    return '<!doctype html><html lang="ko"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>보장분석 담보별 분리자료 — ' + esc(nm) + ' · ' + esc(날) + '</title>' +
      '<style>' + CSS + '</style></head><body>' +
      '<div class="bar0"><button onclick="window.print()">🖨 인쇄 · PDF 로 저장</button>' +
      '<span>A4 ' + 쪽.length + '장 · 「보험 전문가의 한 마디」 칸은 손으로 적는 자리입니다 · 이 띠는 인쇄에 안 나갑니다</span></div>' +
      쪽.join('') + '</body></html>';
  };

  /* 새 탭으로 엽니다 — 파일을 만들지 않습니다 */
  A.open = function (opt) {
    var html = A.build(opt);
    var u = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    var w = g.open(u, '_blank');
    setTimeout(function () { URL.revokeObjectURL(u); }, 60000);
    return { html: html, win: w, url: u };
  };


  /* ── 5. 엑셀 도형으로 옮기기 ───────────────────────────────────────
     사장님 말씀 2026-11-23 — 「엑셀로 하라니까 왜그러는거야 <b>엑셀로 디자인 짜</b>」.
     도해를 따로 선 HTML 에만 두면 사장님은 엑셀과 그 문서를 <b>둘 다</b> 들고
     다니셔야 합니다. 그래서 같은 도해를 <b>엑셀 안으로</b> 넣습니다.

     ★ 그림은 그대로 <b>한 곳</b>입니다 (5번) — SCENE 이 낸 SVG 를 여기서
       엑셀 도형(DrawingML)으로 <b>옮기기만</b> 합니다. 두 번 그리지 않습니다.
     ★ 사진으로 넣지 않습니다 (9번) — 래스터는 인쇄에서 뭉개집니다. 엑셀
       <b>도형</b>이라 크기를 늘려도 같은 선으로 섭니다.
     ★ 글자 크기는 <b>그룹과 같이 안 늘어납니다</b> — DrawingML 의 글자는 절대
       크기입니다. 그래서 늘어난 배율을 셈해 pt 로 바꿔 적습니다.          */

  /* 색 — '#RRGGBB' · 'rgb(r,g,b)' · 'none' */
  function hex6(v) {
    v = String(v || '').trim();
    if (!v || v === 'none') return null;
    var m = v.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (m) {
      return [1, 2, 3].map(function (i) {
        return ('0' + Number(m[i]).toString(16)).slice(-2);
      }).join('').toUpperCase();
    }
    m = v.match(/^#([0-9a-fA-F]{6})$/);
    if (m) return m[1].toUpperCase();
    m = v.match(/^#([0-9a-fA-F]{3})$/);
    if (m) return m[1].split('').map(function (c) { return c + c; }).join('').toUpperCase();
    return null;                       /* url(#…) 같은 것은 부르는 쪽이 대신 정합니다 */
  }
  function at(tag, n) {
    var m = tag.match(new RegExp('\\s' + n + '="([^"]*)"'));
    return m ? m[1] : null;
  }
  function nu(tag, n, d) {
    var v = at(tag, n);
    return v === null ? d : parseFloat(v);
  }
  function fill(c, alpha) {
    var h = hex6(c);
    if (!h) return '<a:noFill/>';
    return '<a:solidFill><a:srgbClr val="' + h + '"/>' +
      (alpha !== null && alpha !== undefined && alpha < 1
        ? '' : '') + '</a:solidFill>';
  }
  function fillA(c, alpha) {
    var h = hex6(c);
    if (!h) return '<a:noFill/>';
    var a = (alpha !== null && alpha !== undefined && alpha < 1)
      ? '<a:alpha val="' + Math.round(alpha * 100000) + '"/>' : '';
    return '<a:solidFill><a:srgbClr val="' + h + '">' + a + '</a:srgbClr></a:solidFill>';
  }
  function line(c, w, dash, U) {
    var h = hex6(c);
    if (!h) return '<a:ln><a:noFill/></a:ln>';
    return '<a:ln w="' + Math.max(3175, Math.round((w || 1) * U)) + '">' +
      '<a:solidFill><a:srgbClr val="' + h + '"/></a:solidFill>' +
      (dash ? '<a:prstDash val="sysDash"/>' : '') + '</a:ln>';
  }

  /* SVG 한 장 → 엑셀 도형 한 묶음. 자식 좌표는 viewBox 를 그대로 씁니다. */
  A.toDml = function (svg, o) {
    o = o || {};
    var vb = (svg.match(/viewBox="([^"]+)"/) || [0, '0 0 640 300'])[1].split(/\s+/).map(Number);
    var VW = vb[2], VH = vb[3];
    var EW = o.cx || 6480000, EH = Math.round(EW * VH / VW);
    var U = EW / VW;                               /* 한 칸이 몇 EMU 인가 */
    var PT = U / 12700;                            /* 한 칸이 몇 pt 인가 — 글자에 씁니다 */
    var id = o.id0 || 100, out = [];

    function sp(nm, x, y, w, h, geom, f, ln, body, rot) {
      return '<xdr:sp macro="" textlink=""><xdr:nvSpPr>' +
        '<xdr:cNvPr id="' + (id++) + '" name="' + nm + '"/><xdr:cNvSpPr/></xdr:nvSpPr><xdr:spPr>' +
        '<a:xfrm' + (rot ? (' rot="' + rot + '"') : '') + '>' +
        '<a:off x="' + Math.round(x * U) + '" y="' + Math.round(y * U) + '"/>' +
        '<a:ext cx="' + Math.max(1, Math.round(w * U)) + '" cy="' + Math.max(1, Math.round(h * U)) + '"/></a:xfrm>' +
        geom + f + ln + '</xdr:spPr>' + (body || '<xdr:txBody><a:bodyPr/><a:lstStyle/><a:p/></xdr:txBody>') +
        '</xdr:sp>';
    }
    function prst(p, adj) { return '<a:prstGeom prst="' + p + '">' + (adj || '<a:avLst/>') + '</a:prstGeom>'; }

    /* 글자 — SVG 의 y 는 <b>밑선</b>, 엑셀은 칸의 <b>위</b>입니다 */
    function txtSp(t, x, y, sz, col, bold, anchor) {
      /* ★ 칸 너비를 글자 수로 어림하지 않습니다 — 한글·숫자·기호가 섞이면 어림이
         흔들려 글이 엉뚱한 자리에 섭니다. <b>가장자리까지 넓게</b> 잡고 정렬로만
         맞춥니다. spAutoFit 도 빼야 합니다 — 엑셀이 칸을 다시 재며 글을 옮깁니다. */
      var h = sz * 1.8, bx, w, algn;
      if (anchor === 'middle') { w = Math.min(x, VW - x) * 2; bx = x - w / 2; algn = 'ctr'; }
      else if (anchor === 'end') { bx = 0; w = x; algn = 'r'; }
      else { bx = x; w = VW - x; algn = 'l'; }
      if (w <= 0) { w = 10; }
      var body = '<xdr:txBody><a:bodyPr wrap="none" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr"/>' +
        '<a:lstStyle/><a:p><a:pPr algn="' + algn + '"/><a:r><a:rPr lang="ko-KR" ' +
        'sz="' + Math.max(400, Math.round(sz * PT * 100)) + '"' + (bold ? ' b="1"' : '') +
        '><a:solidFill><a:srgbClr val="' + (hex6(col) || '333D4B') + '"/></a:solidFill>' +
        '<a:latin typeface="맑은 고딕"/><a:ea typeface="맑은 고딕"/></a:rPr>' +
        '<a:t>' + t + '</a:t></a:r></a:p></xdr:txBody>';
      return sp('글', bx, y - sz * 1.2, w, h, prst('rect'), '<a:noFill/>', '<a:ln><a:noFill/></a:ln>', body);
    }

    /* ★ 길(path)은 <b>제대로 걸어서</b> 읽습니다. 숫자를 둘씩 짝지어 테두리를 재면
       상대 좌표(l · q · h · v)가 섞인 길에서 음수가 나와 도형이 종이 밖으로 나갑니다 —
       실제로 영수증의 톱니(l -8 -6)가 그랬고, 엑셀에서 그 자리가 어긋났습니다.
       걸으면서 <b>절대 좌표</b>로 바꾸고, 그 점들로 테두리를 잽니다. */
    function walk(d) {
      var cmds = d.match(/[MmLlHhVvQqTtCcSsAaZz][^MmLlHhVvQqTtCcSsAaZz]*/g) || [];
      var cx = 0, cy = 0, sx = 0, sy = 0, seg = [], pts = [];
      function put(x, y) { pts.push([x, y]); }
      cmds.forEach(function (c) {
        var k = c[0], rel = (k >= 'a' && k <= 'z');
        var K = k.toUpperCase();
        var a = (c.slice(1).match(/-?\d*\.?\d+(?:e-?\d+)?/gi) || []).map(Number);
        var i, x, y;
        if (K === 'M') {
          for (i = 0; i + 1 < a.length; i += 2) {
            x = rel ? cx + a[i] : a[i]; y = rel ? cy + a[i + 1] : a[i + 1];
            seg.push(i === 0 ? ['M', x, y] : ['L', x, y]);
            cx = x; cy = y; if (i === 0) { sx = x; sy = y; } put(x, y);
          }
        } else if (K === 'L') {
          for (i = 0; i + 1 < a.length; i += 2) {
            x = rel ? cx + a[i] : a[i]; y = rel ? cy + a[i + 1] : a[i + 1];
            seg.push(['L', x, y]); cx = x; cy = y; put(x, y);
          }
        } else if (K === 'H') {
          a.forEach(function (v) { cx = rel ? cx + v : v; seg.push(['L', cx, cy]); put(cx, cy); });
        } else if (K === 'V') {
          a.forEach(function (v) { cy = rel ? cy + v : v; seg.push(['L', cx, cy]); put(cx, cy); });
        } else if (K === 'Q') {
          for (i = 0; i + 3 < a.length; i += 4) {
            var qx = rel ? cx + a[i] : a[i], qy = rel ? cy + a[i + 1] : a[i + 1];
            x = rel ? cx + a[i + 2] : a[i + 2]; y = rel ? cy + a[i + 3] : a[i + 3];
            seg.push(['Q', qx, qy, x, y]); put(qx, qy); put(x, y); cx = x; cy = y;
          }
        } else if (K === 'C') {
          for (i = 0; i + 5 < a.length; i += 6) {
            var c1x = rel ? cx + a[i] : a[i], c1y = rel ? cy + a[i + 1] : a[i + 1];
            var c2x = rel ? cx + a[i + 2] : a[i + 2], c2y = rel ? cy + a[i + 3] : a[i + 3];
            x = rel ? cx + a[i + 4] : a[i + 4]; y = rel ? cy + a[i + 5] : a[i + 5];
            seg.push(['C', c1x, c1y, c2x, c2y, x, y]);
            put(c1x, c1y); put(c2x, c2y); put(x, y); cx = x; cy = y;
          }
        } else if (K === 'Z') { seg.push(['Z']); cx = sx; cy = sy; }
      });
      if (!pts.length) return null;
      var xs = pts.map(function (q) { return q[0]; }), ys = pts.map(function (q) { return q[1]; });
      return { seg: seg,
        x: Math.min.apply(null, xs), y: Math.min.apply(null, ys),
        w: Math.max(1, Math.max.apply(null, xs) - Math.min.apply(null, xs)),
        h: Math.max(1, Math.max.apply(null, ys) - Math.min.apply(null, ys)) };
    }
    function pathGeom(W2) {
      function P(x, y) {
        return '<a:pt x="' + Math.round(x - W2.x) + '" y="' + Math.round(y - W2.y) + '"/>';
      }
      var p = W2.seg.map(function (q) {
        if (q[0] === 'M') return '<a:moveTo>' + P(q[1], q[2]) + '</a:moveTo>';
        if (q[0] === 'L') return '<a:lnTo>' + P(q[1], q[2]) + '</a:lnTo>';
        if (q[0] === 'Q') return '<a:quadBezTo>' + P(q[1], q[2]) + P(q[3], q[4]) + '</a:quadBezTo>';
        if (q[0] === 'C') return '<a:cubicBezTo>' + P(q[1], q[2]) + P(q[3], q[4]) + P(q[5], q[6]) + '</a:cubicBezTo>';
        return '<a:close/>';
      }).join('');
      return '<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="r" b="b"/>' +
        '<a:pathLst><a:path w="' + Math.round(W2.w) + '" h="' + Math.round(W2.h) + '">' + p +
        '</a:path></a:pathLst></a:custGeom>';
    }

    /* ★ <b>변환을 따라갑니다</b> — 몸 그림은 <g transform="translate(a,b) scale(s)">
       안에 있습니다. 이걸 빼먹으면 몸이 제 크기로 서서 종이를 뚫고 나갑니다.
       자리와 크기만 옮기면 됩니다 — 길(custGeom) 은 제 테두리 안에서 늘어납니다. */
    var TR = { x: 0, y: 0, s: 1 }, STK = [];
    function TX(v) { return TR.x + TR.s * v; }
    function TY(v) { return TR.y + TR.s * v; }
    function TL(v) { return TR.s * v; }

    /* 하나씩 옮깁니다 — 그린 차례 그대로여야 가린 것이 같습니다 */
    var toks = svg.match(/<g\b[^>]*>|<\/g>|<(rect|circle|ellipse|line|polygon|path|text)\b[^>]*?(?:\/>|>[\s\S]*?<\/\1>)/g) || [];
    toks.forEach(function (t) {
      if (/^<g\b/.test(t)) {
        STK.push({ x: TR.x, y: TR.y, s: TR.s });
        var tf = (t.match(/transform="([^"]*)"/) || [0, ''])[1];
        var mv = tf.match(/translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/);
        var sc = tf.match(/scale\(\s*(-?[\d.]+)/);
        var ns = sc ? parseFloat(sc[1]) : 1;
        if (mv) { TR.x = TR.x + TR.s * parseFloat(mv[1]); TR.y = TR.y + TR.s * parseFloat(mv[2]); }
        TR.s = TR.s * ns;
        return;
      }
      if (t === '</g>') { var o2 = STK.pop(); if (o2) { TR.x = o2.x; TR.y = o2.y; TR.s = o2.s; } return; }
      var tag = t.match(/^<\w+[^>]*>/)[0];
      var f = at(tag, 'fill'), st = at(tag, 'stroke'), sw = nu(tag, 'stroke-width', 1);
      var op = at(tag, 'opacity'); op = op === null ? 1 : parseFloat(op);
      var dash = !!at(tag, 'stroke-dasharray');
      if (/^<rect/.test(tag)) {
        var x = nu(tag, 'x', 0), y = nu(tag, 'y', 0), w = nu(tag, 'width', 0), h = nu(tag, 'height', 0);
        var rx = nu(tag, 'rx', 0);
        var geo = rx > 0 ? prst('roundRect', '<a:avLst><a:gd name="adj" fmla="val ' +
          Math.min(50000, Math.round(rx / Math.max(1, Math.min(w, h)) * 100000)) + '"/></a:avLst>') : prst('rect');
        out.push(sp('칸', TX(x), TY(y), TL(w), TL(h), geo, fillA(f, op), line(st, sw * TR.s, dash, U)));
      } else if (/^<circle/.test(tag)) {
        var ccx = nu(tag, 'cx', 0), ccy = nu(tag, 'cy', 0), r = nu(tag, 'r', 0);
        out.push(sp('동글', TX(ccx - r), TY(ccy - r), TL(r * 2), TL(r * 2), prst('ellipse'), fillA(f, op), line(st, sw * TR.s, dash, U)));
      } else if (/^<ellipse/.test(tag)) {
        var ex = nu(tag, 'cx', 0), ey = nu(tag, 'cy', 0), rx2 = nu(tag, 'rx', 0), ry2 = nu(tag, 'ry', 0);
        out.push(sp('타원', TX(ex - rx2), TY(ey - ry2), TL(rx2 * 2), TL(ry2 * 2), prst('ellipse'), fillA(f, op), line(st, sw * TR.s, dash, U)));
      } else if (/^<line/.test(tag)) {
        var x1 = nu(tag, 'x1', 0), y1 = nu(tag, 'y1', 0), x2 = nu(tag, 'x2', 0), y2 = nu(tag, 'y2', 0);
        var lx = TX(Math.min(x1, x2)), ly = TY(Math.min(y1, y2));
        var lw = TL(Math.abs(x2 - x1)), lh = TL(Math.abs(y2 - y1));
        var flip = ((x2 - x1) * (y2 - y1) < 0) ? ' flipV="1"' : '';
        var g = '<a:xfrm' + flip + '><a:off x="' + Math.round(lx * U) + '" y="' + Math.round(ly * U) + '"/>' +
          '<a:ext cx="' + Math.max(1, Math.round(lw * U)) + '" cy="' + Math.max(1, Math.round(lh * U)) + '"/></a:xfrm>';
        out.push('<xdr:sp macro="" textlink=""><xdr:nvSpPr><xdr:cNvPr id="' + (id++) + '" name="줄"/>' +
          '<xdr:cNvSpPr/></xdr:nvSpPr><xdr:spPr>' + g + prst('line') + '<a:noFill/>' +
          line(st, sw * TR.s, dash, U) + '</xdr:spPr><xdr:txBody><a:bodyPr/><a:lstStyle/><a:p/></xdr:txBody></xdr:sp>');
      } else if (/^<polygon/.test(tag)) {
        var pts = (at(tag, 'points') || '').trim().split(/[,\s]+/).map(Number);
        if (pts.length >= 6) {
          var d2 = 'M' + pts[0] + ' ' + pts[1];
          for (var i2 = 2; i2 + 1 < pts.length; i2 += 2) d2 += 'L' + pts[i2] + ' ' + pts[i2 + 1];
          d2 += 'Z';
          var b2 = walk(d2);
          if (b2) out.push(sp('꼴', TX(b2.x), TY(b2.y), TL(b2.w), TL(b2.h), pathGeom(b2),
            fillA(f, op), line(st, sw * TR.s, dash, U)));
        }
      } else if (/^<path/.test(tag)) {
        var b3 = walk(at(tag, 'd') || '');
        if (b3 && b3.w > 0 && b3.h > 0) {
          out.push(sp('꼴', TX(b3.x), TY(b3.y), TL(b3.w), TL(b3.h), pathGeom(b3),
            fillA(f === null || /url\(/.test(f) ? (o.gradTo || '#F4BCA8') : f, op),
            line(st, sw * TR.s, dash, U)));
        }
      } else if (/^<text/.test(tag)) {
        var body = t.replace(/^<text[^>]*>/, '').replace(/<\/text>$/, '');
        if (!body.trim()) return;
        out.push(txtSp(body, TX(nu(tag, 'x', 0)), TY(nu(tag, 'y', 0)), TL(nu(tag, 'font-size', 12)),
          at(tag, 'fill'), at(tag, 'font-weight') === '700', at(tag, 'text-anchor') || 'start'));
      }
    });

    return { xml: '<xdr:grpSp><xdr:nvGrpSpPr><xdr:cNvPr id="' + (id++) + '" name="도해"/>' +
      '<xdr:cNvGrpSpPr/></xdr:nvGrpSpPr><xdr:grpSpPr><a:xfrm>' +
      '<a:off x="0" y="0"/><a:ext cx="' + EW + '" cy="' + EH + '"/>' +
      '<a:chOff x="0" y="0"/><a:chExt cx="' + Math.round(VW * U) + '" cy="' + Math.round(VH * U) + '"/>' +
      '</a:xfrm></xdr:grpSpPr>' + out.join('') + '</xdr:grpSp>',
      id: id, cx: EW, cy: EH, 수: out.length };
  };

  g.BA_ART = A;
})();
