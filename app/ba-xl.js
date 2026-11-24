/* ══════════════════════════════════════════════════════════════════════
   ba-xl.js — 📊 <b>보장분석 전·후를 엑셀 한 장으로</b> (판 X534)

   사장님 말씀 (2026-11-23) — 「보장분석 전후 비교자료에서, <b>엑셀 버전</b>으로
   <b>한눈에 모든 보험 모든 보장</b>이 나오도록 만들어보자」

   ★ <b>줄 축은 새로 만들지 않습니다</b> — ba.html 의 STD(「표준 담보 (엑셀 그대로)」 ·
     대분류 3 · 중분류 11 · 담보 77)를 그대로 씁니다. 사장님 엑셀을 본떠 만든
     그 표입니다. 두 벌을 두면 한쪽이 늙습니다 (5번).
   ★ <b>칸 축이 새 것</b>입니다 — 화면의 「표준 담보표」 는 전 합계 · 후 합계만
     보여 주고 <b>어느 보험이 그 담보를 주는지</b>는 안 보여 줍니다. 엑셀에서
     계약 하나하나를 칸으로 세웁니다. 사장님이 고르신 차례는
     <b>㉮ 전 묶음 → 전 합계 → 후 묶음 → 후 합계 → 차이 → 결과</b> 이고,
     담보는 <b>77줄 전부</b>(빈 담보도 줄은 세우고 칸만 비웁니다).

   ── 숫자가 거짓말하지 않게 (1번) ─────────────────────────────────
   · <b>빈 칸 = 안 적힘(모름)</b>. 못 읽은 것을 0 으로 적으면 「보장이 없다」 가
     됩니다. 그래서 「—」 같은 <b>글자도 숫자 칸에 안 넣습니다</b> — 넣으면
     엑셀이 더하지도 못하고 우리가 다시 못 읽습니다 (4-1).
   · <b>합계는 다시 세지 않습니다.</b> 화면이 쓰는 calc() 가 내는 값을 그대로
     옮깁니다 — 손으로 고친 값(S.man)이 있으면 합계가 칸의 합과 <b>다릅니다</b>.
     그때는 그 칸을 「손」 꼴로 칠하고 범례에 적습니다 (5번 — 묻는 곳은 하나).
   · 후 칸이 어디서 오는지는 autoCalc() 그대로입니다 —
     유지는 cov · <b>배서는 cov2</b> · 해지는 <b>아무것도 안 보냄</b> · 새 계약은 cov.

   ── 지키는 것 ──────────────────────────────────────────────────
   · 금액은 전부 <b>만원</b> (4번). 담보마다 목돈·하루·매달·한도를 D칸에 적습니다.
   · <b>이름은 가린 것이 기본</b>(홍○○) — 파일 이름까지. 실명은 한 번 더
     누르셔야 나갑니다 (3번). 가리는 규칙은 본체 osMaskName 과 같은 「첫 글자+○○」
     입니다. ba.html 은 딴 쪽이라 그 함수를 못 부릅니다.
   · <b>바깥 셈틀을 안 들여옵니다</b> — .xlsx(zip)를 손으로 씁니다. 앱이 이미
     엑셀을 손으로 <b>읽고</b> 있으니(cimpXlsx) 같은 집 방식입니다 (5번·9번).
   · <b>대분류·중분류는 세로로 안 묶습니다</b> — 묶으면 엑셀에서 거르기·정렬이
     막히고, 다시 읽을 때 빈 칸으로 보입니다. 줄마다 반복해 적습니다 (4-1).
   ══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';

  /* ── 숫자 읽기 — ba.html 의 num() 을 빌려 씁니다 (5번) ───────────── */
  function N(v) {
    if (typeof g.num === 'function') return g.num(v);
    if (v === '' || v === null || v === undefined) return null;
    var x = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
    return isNaN(x) ? null : x;
  }
  /* ── 이름 가리기 — 본체 osMaskName 과 같은 규칙 (3번) ──────────── */
  function mask(s) {
    s = (s == null ? '' : String(s)).replace(/^\s+|\s+$/g, '');
    return s ? (s.charAt(0) + '○○') : '';
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
      /* 엑셀이 못 받는 제어문자는 뺍니다 — 넣으면 파일이 통째로 안 열립니다 */
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  }

  /* ══ ① zip — 눌러 담지 않고 그대로(stored) 담습니다 ══════════════
     눌러 담으려면 deflate 가 필요한데, 그건 바깥 셈틀입니다. 그대로 담아도
     엑셀이 잘 엽니다. 파일이 조금 클 뿐입니다(담보 77줄이라 수십 KB).      */
  var CRC = (function () {
    var t = [], c, n, k;
    for (n = 0; n < 256; n++) { c = n;
      for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u8) {
    var c = 0xFFFFFFFF, i;
    for (i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function utf8(s) {
    if (g.TextEncoder) return new TextEncoder().encode(s);
    var b = unescape(encodeURIComponent(s)), a = new Uint8Array(b.length), i;
    for (i = 0; i < b.length; i++) a[i] = b.charCodeAt(i) & 0xFF;
    return a;
  }
  function zip(files) {
    var parts = [], cen = [], off = 0, i;
    function u16(v) { return [v & 0xFF, (v >>> 8) & 0xFF]; }
    function u32(v) { return [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]; }
    for (i = 0; i < files.length; i++) {
      var nm = utf8(files[i].name), dt = utf8(files[i].data), cc = crc32(dt);
      var loc = [].concat([0x50, 0x4B, 0x03, 0x04], u16(20), u16(0x0800), u16(0), u16(0), u16(0),
        u32(cc), u32(dt.length), u32(dt.length), u16(nm.length), u16(0));
      parts.push(new Uint8Array(loc), nm, dt);
      /* ⚠ <b>짝으로</b> 담습니다 — push(a, b) 로 하면 둘이 <b>따로</b> 들어가
         아래에서 cen[i][0] 이 바이트 하나가 되고, 가운데 목록이 통째로 깨져
         <b>빈 zip</b> 이 나옵니다. 처음에 그래서 엑셀이 「파일이 없다」 했습니다. */
      cen.push([[].concat([0x50, 0x4B, 0x01, 0x02], u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
        u32(cc), u32(dt.length), u32(dt.length), u16(nm.length), u16(0), u16(0), u16(0), u16(0),
        u32(0), u32(off)), nm]);
      off += loc.length + nm.length + dt.length;
    }
    var cbuf = [], clen = 0;
    for (i = 0; i < cen.length; i++) {
      cbuf.push(new Uint8Array(cen[i][0]), cen[i][1]);
      clen += cen[i][0].length + cen[i][1].length;
    }
    var end = new Uint8Array([].concat([0x50, 0x4B, 0x05, 0x06], u16(0), u16(0),
      u16(files.length), u16(files.length), u32(clen), u32(off), u16(0)));
    return new Blob(parts.concat(cbuf, [end]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /* ══ ② 칸 주소 · 한 칸 ══════════════════════════════════════════ */
  function col(n) { var s = ''; n++; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; } return s; }
  /* v 가 null 이면 <b>칸을 아예 안 씁니다</b> — 「안 적힘」 은 빈 칸입니다 (1번) */
  function cel(c, r, v, st) {
    if (v === null || v === undefined || v === '') return '';
    var a = col(c) + r, s = st ? (' s="' + st + '"') : '';
    if (typeof v === 'number' && isFinite(v)) return '<c r="' + a + '"' + s + '><v>' + v + '</v></c>';
    /* ★ 판 X540 — 꾸밈표(&lt;b&gt;)를 <b>여기서 한 번</b> 걷어냅니다. 앱의 글에는
       &lt;b&gt; 가 섞여 있는데, 부르는 자리마다 지우게 하면 꼭 한 군데를 빠뜨립니다 —
       실제로 「과부족」 과 「그래프」 두 곳에서 글자 그대로 찍혔습니다. 엑셀에는
       칸 안의 일부만 굵게 할 길이 없으니 <b>걷어내는 것이 맞습니다</b>. */
    return '<c r="' + a + '"' + s + ' t="inlineStr"><is><t xml:space="preserve">' +
      esc(String(v).replace(/<\/?[a-zA-Z][^>]*>/g, '')) + '</t></is></c>';
  }
  /* ★ 판 X538 — 줄 높이를 줍니다. 전부 기본(15pt)이면 표가 답답하고
     「엑셀 기본 시트」 처럼 보입니다 (사장님 말씀 「엑셀로 퀄리티는 이것밖에 안되?」). */
  function row(r, cells, ht) {
    return '<row r="' + r + '"' + (ht ? (' ht="' + ht + '" customHeight="1"') : '') + '>' +
      cells.join('') + '</row>';
  }

  /* ══ ③ 꼴(styles) — <b>묶음(부위)마다 제 색</b> (판 X534 · 사장님 말씀
     「색 별로 따로 나누고, 글씨 크기 부위 전부 나눠」) ══════════════════

     STD 가 묶음마다 <b>제 색(c)과 아이콘(ic)</b> 을 이미 들고 있습니다 — 화면에서
     쓰는 그 색 그대로 엑셀에도 칠합니다(두 벌 안 만듭니다 · 5번).
     엑셀에는 <b>반투명이 없어</b> 흰색과 섞은 옅은 색을 손으로 냅니다(tint).

     ── 글자 크기 층 ──────────────────────────────────────────
       13pt 제목 · <b>11.5pt 묶음 머리</b> · 10.5pt 머리 · 10pt 담보·숫자
       · 9pt 단위·범례. 크기가 다르면 눈이 <b>층을 먼저</b> 읽습니다.          */
  function tint(hex, p) {           /* p=0 이면 그 색, 1 이면 흰색 */
    var h = String(hex).replace('#', '');
    function m(i2) { var v = parseInt(h.substr(i2, 2), 16); return Math.round(v + (255 - v) * p); }
    function x(v) { var t = v.toString(16); return t.length < 2 ? ('0' + t) : t; }
    return (x(m(0)) + x(m(2)) + x(m(4))).toUpperCase();
  }
  /* 꼴 번호 — 0~19 는 붙박이, 그 뒤는 묶음마다 셋씩:
       20 + i*3 + 0 : 묶음 머리줄 (그 색 그대로 · 흰 글씨 11.5pt)
       20 + i*3 + 1 : 대분류·중분류 칸 (아주 옅은 그 색 · 그 색 굵은 글씨)
       20 + i*3 + 2 : 담보 이름 칸 (더 옅은 그 색 · 검은 글씨)                */
  function GST(i, k) { return 20 + i * 3 + k; }
  /* 보험료 줄이 쓰는 꼴 — 묶음 꼴 뒤 일곱 (0 전 · 1 후 · 2 전합 · 3 후합 · 4 해지 · 5 줄음 · 6 늘음) */
  function PST(n, k) { return 20 + n * 3 + k; }
  /* ★ 판 X538 — 보험료 꼴 <b>뒤</b>: 묶음마다 큰 제목 하나, 그 뒤 상태 셋 + 부제 */
  function BIG(n, i) { return 20 + n * 3 + 7 + i; }                 /* 묶음 i 의 큰 제목 */
  function STT(n, k) { return 20 + n * 3 + 7 + n + k; }     /* 0 충분 1 부족 2 미가입 3 부제 4 큰 제목 띠 */
  /* 큰 제목 띠 한 줄을 만듭니다 — 칸 수만큼 칠해야 띠가 끊기지 않습니다 */
  function 띠줄(r, t, 칸수, 꼴) {
    /* ⚠ cel 은 값이 없으면 <b>칸을 안 만듭니다</b>(빈 칸 = 모름 · 1번). 그래서
       빈 칸에 색만 입히려면 여기서 <b>직접</b> 찍어야 합니다 — 안 그러면 띠가
       A칸에서 끊깁니다(뽑아서 보고 찾았습니다). */
    var c2 = [cel(0, r, t, 꼴)], i;
    for (i = 1; i < 칸수; i++) c2.push('<c r="' + col(i) + r + '" s="' + 꼴 + '"/>');
    return row(r, c2, 34);
  }

  function styles(GRP) {
    var f = '', fi = '', xf = '', i;
    /* 글꼴 0~8 */
    var FONT = [
      '<sz val="10"/><name val="맑은 고딕"/>',                                           /* 0 기본 */
      '<b/><sz val="13"/><color rgb="FF217346"/><name val="맑은 고딕"/>',                /* 1 제목 */
      '<sz val="9"/><color rgb="FF666666"/><name val="맑은 고딕"/>',                     /* 2 범례 */
      '<b/><sz val="10.5"/><name val="맑은 고딕"/>',                                     /* 3 머리 */
      '<b/><sz val="10.5"/><color rgb="FFC9283A"/><name val="맑은 고딕"/>',              /* 4 해지 */
      '<b/><sz val="10"/><color rgb="FF0B8A3D"/><name val="맑은 고딕"/>',                /* 5 늘어남 */
      '<sz val="9"/><color rgb="FF8A6D00"/><name val="맑은 고딕"/>',                     /* 6 표준 */
      '<b/><sz val="10"/><color rgb="FFB45309"/><name val="맑은 고딕"/>',                /* 7 손 */
      '<b/><sz val="11.5"/><color rgb="FFFFFFFF"/><name val="맑은 고딕"/>',              /* 8 묶음머리 */
      '<sz val="9"/><color rgb="FF666666"/><name val="맑은 고딕"/>'                      /* 9 단위 */
    ];
    /* 묶음마다 굵은 제 색 글꼴 하나 — 10 + i */
    /* 묶음 띠가 이미 「대분류 › 중분류」 를 큰 글씨로 말해 줍니다. 줄마다 반복하는
       이 글자는 <b>거르기·정렬 때문에</b> 남겨 두는 것이라 작고 옅게 둡니다 — 크면
       눈이 그것부터 읽습니다. (9pt · 그 색을 흰색과 반쯤 섞음)                 */
    for (i = 0; i < GRP.length; i++) FONT.push('<sz val="9"/><color rgb="FF' + tint(GRP[i].c, 0.42) + '"/><name val="맑은 고딕"/>');
    /* ★ 판 X538 — 사장님 말씀 「엑셀로 퀄리티는 이것밖에 안되?」.
       머리가 10.5pt 한 줄이라 「엑셀 기본 시트」 로 보였습니다. 큰 제목 글꼴을 보탭니다. */
    var FBIG = FONT.length;                                   /* 큰 제목 — 흰 16pt */
    FONT.push('<b/><sz val="16"/><color rgb="FFFFFFFF"/><name val="맑은 고딕"/>');
    FONT.push('<b/><sz val="10"/><color rgb="FFB45309"/><name val="맑은 고딕"/>');   /* +1 부족 */
    FONT.push('<sz val="10"/><color rgb="FF6B7684"/><name val="맑은 고딕"/>');       /* +2 부제 */
    for (i = 0; i < FONT.length; i++) f += '<font>' + FONT[i] + '</font>';

    var FILL = ['<patternFill patternType="none"/>', '<patternFill patternType="gray125"/>'];
    ['FFF6F6F6', 'FFFFFDF3', 'FFF7F8FA', 'FFF2F7FF', 'FFFDF3F3', 'FFEEF1F5', 'FFE6F0FF', 'FFF1FBF4']
      .forEach(function (c) { FILL.push('<patternFill patternType="solid"><fgColor rgb="' + c + '"/><bgColor indexed="64"/></patternFill>'); });
    /* 묶음마다 셋 — 진한 띠 · 옅은 라벨 · 더 옅은 담보 */
    for (i = 0; i < GRP.length; i++) {
      FILL.push('<patternFill patternType="solid"><fgColor rgb="FF' + tint(GRP[i].c, 0) + '"/><bgColor indexed="64"/></patternFill>');
      FILL.push('<patternFill patternType="solid"><fgColor rgb="FF' + tint(GRP[i].c, 0.86) + '"/><bgColor indexed="64"/></patternFill>');
      FILL.push('<patternFill patternType="solid"><fgColor rgb="FF' + tint(GRP[i].c, 0.95) + '"/><bgColor indexed="64"/></patternFill>');
    }
    /* ★ 판 X538 — 묶음에 매이지 않은 <b>큰 제목 띠</b> 하나 (앞 시트들이 씁니다) */
    var FNAVY = FILL.length;
    FILL.push('<patternFill patternType="solid"><fgColor rgb="FF2B3A55"/><bgColor indexed="64"/></patternFill>');
    for (i = 0; i < FILL.length; i++) fi += '<fill>' + FILL[i] + '</fill>';

    /* ★ 판 X538 — 띠는 <b>테두리 없이</b>. 칸마다 테두리를 그으면 띠가 흰 금으로
       끊겨 보입니다(뽑아서 보고 찾았습니다). */
    function XN(n, fo, fl, al) {
      return '<xf numFmtId="' + n + '" fontId="' + fo + '" fillId="' + fl + '" borderId="0" xfId="0" ' +
        'applyNumberFormat="1" applyFont="1" applyFill="1" applyAlignment="1">' +
        '<alignment ' + (al || 'vertical="center"') + '/></xf>';
    }
    function X(n, fo, fl, al) {
      return '<xf numFmtId="' + n + '" fontId="' + fo + '" fillId="' + fl + '" borderId="1" xfId="0" ' +
        'applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">' +
        '<alignment ' + (al || 'vertical="center"') + '/></xf>';
    }
    xf += '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>';                       /* 0 */
    xf += '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>';         /* 1 제목 */
    xf += '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>';         /* 2 범례 */
    xf += X(0, 3, 2, 'horizontal="center" vertical="center" wrapText="1"');                        /* 3 머리 */
    xf += X(0, 3, 4, 'horizontal="center" vertical="center" wrapText="1"');                        /* 4 머리전 */
    xf += X(0, 3, 5, 'horizontal="center" vertical="center" wrapText="1"');                        /* 5 머리후 */
    xf += X(0, 4, 6, 'horizontal="center" vertical="center" wrapText="1"');                        /* 6 머리해지 */
    xf += X(0, 5, 9, 'horizontal="center" vertical="center" wrapText="1"');                        /* 7 머리신규 */
    xf += X(0, 0, 2, 'horizontal="center" vertical="center"');                                     /* 8 라벨 */
    xf += X(0, 0, 0, 'vertical="center" wrapText="1"');                                            /* 9 담보이름 */
    xf += X(164, 6, 3);                                                                            /* 10 표준 */
    xf += X(164, 0, 4);                                                                            /* 11 전칸 */
    xf += X(164, 0, 5);                                                                            /* 12 후칸 */
    xf += X(164, 4, 6);                                                                            /* 13 해지칸 */
    xf += X(164, 3, 7);                                                                            /* 14 합계전 */
    xf += X(164, 3, 8);                                                                            /* 15 합계후 */
    xf += X(164, 5, 0);                                                                            /* 16 차이+ */
    xf += X(164, 4, 0);                                                                            /* 17 차이- */
    xf += X(0, 0, 0, 'horizontal="center" vertical="center"');                                     /* 18 결과 */
    xf += X(164, 7, 7);                                                                            /* 19 합계(손) */
    for (i = 0; i < GRP.length; i++) {
      var b = 10 + i * 3;                       /* 그 묶음의 fill 세 개 */
      xf += X(0, 8, b, 'horizontal="left" vertical="center"');          /* 묶음머리 */
      xf += X(0, 10 + i, b + 1, 'horizontal="center" vertical="center"'); /* 라벨 */
      xf += X(0, 0, b + 2, 'vertical="center" wrapText="1"');            /* 담보이름 */
    }
    /* 보험료 줄 — 소수점이 보이는 꼴(165). 번호는 묶음 꼴 <b>뒤</b>입니다. */
    xf += X(165, 0, 4);   /* +0 보험료 전 */
    xf += X(165, 0, 5);   /* +1 보험료 후 */
    xf += X(165, 3, 7);   /* +2 보험료 전 합계 */
    xf += X(165, 3, 8);   /* +3 보험료 후 합계 */
    xf += X(165, 4, 6);   /* +4 보험료 해지 */
    xf += X(165, 5, 0);   /* +5 보험료 줄었다(초록) */
    xf += X(165, 4, 0);   /* +6 보험료 늘었다(붉게) */
    /* ★ 판 X538 — 묶음마다 <b>큰 제목 띠</b> 하나 (그 색 바탕 · 흰 16pt) */
    for (i = 0; i < GRP.length; i++) xf += XN(0, FBIG, 10 + i * 3, 'horizontal="left" vertical="center"');
    /* 상태 세 가지 — 글자색만이 아니라 <b>칸을 칠합니다</b>. 눈이 색부터 읽습니다. */
    xf += X(0, 5, 9, 'horizontal="center" vertical="center"');        /* 충분 */
    xf += X(0, FBIG + 1, 3, 'horizontal="center" vertical="center"'); /* 부족 */
    xf += X(0, 4, 6, 'horizontal="center" vertical="center"');        /* 미가입 */
    xf += XN(0, FBIG + 2, 0, 'horizontal="left" vertical="center"');   /* 부제 */
    xf += XN(0, FBIG, FNAVY, 'horizontal="left" vertical="center"');   /* 큰 제목 띠(남색) */
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      /* ⚠ 164(#,##0)만 두었더니 <b>월 보험료 12.4만이 12 로</b>, 합계 27.2 가 27 로
         찍혔습니다 — 뽑아서 눈으로 보고 찾았습니다. 담보 금액은 정수라 164 면
         되지만 보험료는 소수점이 있습니다. 165 를 보탭니다 (1번).            */
      '<numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0"/>' +
      '<numFmt numFmtId="165" formatCode="#,##0.##"/></numFmts>' +
      '<fonts count="' + FONT.length + '">' + f + '</fonts>' +
      '<fills count="' + FILL.length + '">' + fi + '</fills>' +
      '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
      '<border><left style="thin"><color rgb="FFD6D6D6"/></left><right style="thin"><color rgb="FFD6D6D6"/></right>' +
      '<top style="thin"><color rgb="FFD6D6D6"/></top><bottom style="thin"><color rgb="FFD6D6D6"/></bottom><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="' + (20 + GRP.length * 3 + 7 + GRP.length + 5) + '">' + xf + '</cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  }

  function sheet(body, opt) {
    opt = opt || {};
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"' +
      ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      /* 인쇄는 <b>가로 한 장 폭</b>에 맞춥니다 — 안 그러면 칸이 옆으로 길어
         열두 장으로 쪼개집니다(뽑아서 세어 봤습니다). 세로로는 몇 장이든 흐릅니다. */
      /* ★ 판 X538 — <b>탭에 묶음 색</b>을 입힙니다. 시트가 열여섯 장이라
         아래 탭 줄만 봐도 어느 부위인지 바로 압니다. */
      ((opt.fit || opt.tabColor)
        ? ('<sheetPr>' + (opt.tabColor ? ('<tabColor rgb="FF' + opt.tabColor + '"/>') : '') +
           (opt.fit ? '<pageSetUpPr fitToPage="1"/>' : '') + '</sheetPr>')
        : '') +
      /* ★ <b>격자선을 끕니다</b> — 켜 두면 아무리 칠해도 「날 시트」 로 보입니다.
         칸의 경계는 우리가 그린 테두리가 말합니다. */
      '<sheetViews><sheetView showGridLines="0" workbookViewId="0"' +
      (opt.zoom ? (' zoomScale="' + opt.zoom + '" zoomScaleNormal="' + opt.zoom + '"') : '') +
      (opt.tab ? ' tabSelected="1"' : '') + '>' +
      (opt.freeze ? ('<pane xSplit="' + opt.freeze[0] + '" ySplit="' + opt.freeze[1] + '" topLeftCell="' +
        col(opt.freeze[0]) + (opt.freeze[1] + 1) + '" activePane="bottomRight" state="frozen"/>') : '') +
      '</sheetView></sheetViews>' +
      (opt.cols ? ('<cols>' + opt.cols.map(function (w, i) {
        return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>') : '') +
      '<sheetData>' + body + '</sheetData>' +
      (opt.filter ? ('<autoFilter ref="' + opt.filter + '"/>') : '') +
      /* 묶음 띠 한 줄만 <b>합칩니다</b> — 안 합치면 옆 칸에 막혀 「병원비 보…」
         로 잘립니다. 합친 자리의 값은 맨 왼쪽 칸에 들어가므로 다시 읽는 데는
         지장이 없습니다. 담보 줄은 <b>절대 안 합칩니다</b>(거르기·정렬 · 4-1). */
      (opt.merge && opt.merge.length ? ('<mergeCells count="' + opt.merge.length + '">' +
        opt.merge.map(function (m) { return '<mergeCell ref="' + m + '"/>'; }).join('') + '</mergeCells>') : '') +
      /* ★ <b>셀 안 막대</b>(조건부 서식) — 엑셀이 제 손으로 그려 주는 막대입니다.
         「후 − 권장」 칸에 걸면 모자란 칸은 붉게 왼쪽으로, 넘는 칸은 푸르게
         오른쪽으로 섭니다. 숫자를 또 적지 않아도 과부족이 한눈에 보입니다. */
      /* 「후 − 권장」 이 <b>음수인 칸만</b> 붉은 막대가 섭니다 — 모자란 만큼입니다.
         0 이나 넘치는 칸에는 막대를 안 그립니다(그리면 「다 모자란다」 로 읽힙니다 · 1번). */
      (opt.bar ? ('<conditionalFormatting sqref="' + opt.bar + '">' +
        '<cfRule type="dataBar" priority="1"><dataBar showValue="1">' +
        '<cfvo type="min"/><cfvo type="num" val="0"/><color rgb="FFE89B93"/></dataBar>' +
        '</cfRule></conditionalFormatting>') : '') +
      (opt.draw ? '<drawing r:id="rId1"/>' : '') +
      (opt.fit ? ('<printOptions/><pageMargins left="0.3" right="0.3" top="0.4" bottom="0.4" header="0.2" footer="0.2"/>' +
        '<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="' +
        (opt.fitH ? '1' : '0') + '" paperSize="9"/>') :
        '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>') +
      '</worksheet>';
  }

  g.BA_XL = { _zip: zip, _sheet: sheet, _cel: cel, _row: row, _col: col, _mask: mask, _styles: styles,
    _GST: GST, _PST: PST, _BIG: BIG, _STT: STT, _band: 띠줄, _N: N };
})(window);

/* ══════════════════════════════════════════════════════════════════════
   ② 시트 셋을 채웁니다 — 한눈에 · 계약 · 빠진 담보
   ══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var X = g.BA_XL, cel = X._cel, row = X._row, col = X._col, N = X._N;
  var ACT = { keep: '유지', endo: '배서', cancel: '해지', new: '신규' };
  var UFULL = { L: '목돈', D: '하루', M: '매달', A: '한도' };

  /* 칸(계약) 목록을 만듭니다 — autoCalc() 와 <b>같은 규칙</b>입니다 (5번):
     전 = before 전부(cov) · 후 = 유지(cov) · 배서(cov2) · 새 계약(cov).
     ⚠ 해지는 후 묶음에 칸을 안 세웁니다 — 후에는 없는 계약입니다. 사라진 것은
       전 묶음의 붉은 「해지」 머리와 차이·결과 칸이 말해 줍니다.               */
  function cols(S) {
    var B = [], A = [], i, p;
    for (i = 0; i < S.before.length; i++) {
      p = S.before[i];
      B.push({ p: p, cov: p.cov || {}, act: p.act || 'keep', prem: p.premMan });
    }
    for (i = 0; i < S.before.length; i++) {
      p = S.before[i];
      var act = p.act || 'keep';
      if (act === 'cancel') continue;
      A.push({ p: p, cov: (act === 'endo') ? (p.cov2 || {}) : (p.cov || {}), act: act,
        prem: (act === 'endo' && p.premMan2 !== '' && p.premMan2 !== undefined) ? p.premMan2 : p.premMan });
    }
    for (i = 0; i < S.after.length; i++) {
      p = S.after[i];
      A.push({ p: p, cov: p.cov || {}, act: 'new', prem: p.premMan });
    }
    return { B: B, A: A };
  }

  /* 금액을 <b>억·만</b>으로 — 사장님 자료가 「7억 5,802만」 으로 적습니다.
     ⚠ 이것은 <b>글자</b>라 엑셀이 못 더합니다. 그래서 <b>숫자 칸은 그대로 두고</b>
       묶음별 분리 시트의 「읽는 금액」 칸에만 씁니다 (4-1).                     */
  function 억만(v) {
    if (v === null || v === undefined || v === '') return '';
    var n = Math.round(+v); if (!isFinite(n)) return '';
    if (n === 0) return '0';
    var s2 = n < 0 ? '-' : ''; n = Math.abs(n);
    var 억 = Math.floor(n / 10000), 만 = n % 10000;
    return s2 + (억 ? (억 + '억' + (만 ? (' ' + 만.toLocaleString() + '만') : '')) : (만.toLocaleString() + '만'));
  }

  function 한눈에(S, STD, C, nm) {
    var cc = cols(S), B = cc.B, A = cc.A, out = [], merges = [], r, i;
    var nB = B.length, nA = A.length;
    /* 칸 차례 — 사장님 자료(KB 제안서 6쪽)처럼 <b>합계를 계약보다 앞</b>에 둡니다.
       0 묶음 · 1 담보 · 2 단위 · 3 권장 · 4 전 합계 · 전 계약들 · 후 합계 · 후 계약들 · 차이 · 결과 */
    var cSumB = 4, cB0 = 5, cSumA = cB0 + nB, cA0 = cSumA + 1, cDif = cA0 + nA, cRes = cDif + 1;
    var w = [13, 34, 7, 10, 12];
    for (i = 0; i < nB; i++) w.push(14); w.push(12);
    for (i = 0; i < nA; i++) w.push(14); w.push(11, 11);

    /* 띠는 <b>표 끝까지</b> — 짧으면 가운데에서 끊겨 보입니다. 칸 수는 뒤에서 정해집니다. */
    var 띠자리 = out.length;
    out.push('');
    out.push(row(2, [cel(0, 2,
      nm + ' 님' + (S.who.age ? (' (' + S.who.age + '세' + (S.who.sex ? (', ' + (S.who.sex === 'f' ? '여자' : '남자')) : '') + ')') : '') +
      '   ·   뽑은 날 ' + (new Date()).toISOString().slice(0, 10) +
      '   ·   금액은 모두 <만원>   ·   빈 칸 = 안 적힘(모름), 0 은 정말 0 일 때만' +
      '   ·   합계가 칸의 합과 다르면 그 합계를 손으로 고치신 것입니다', 2)]));

    /* ── 머리 세 줄 — 계약마다 회사 / 상품 / 납입·보험료 ── */
    var h1 = [cel(0, 3, '묶음', 3), cel(1, 3, '담보', 3), cel(2, 3, '단위', 3),
      cel(3, 3, '권장', 3), cel(4, 3, '전 합계', 3)];
    var h2 = [cel(0, 4, '', 3), cel(1, 4, '', 3), cel(2, 4, '', 3), cel(3, 4, '(만원)', 3), cel(4, 4, '(만원)', 3)];
    var h3 = [cel(0, 5, '', 3), cel(1, 5, '', 3), cel(2, 5, '', 3), cel(3, 5, '', 3), cel(4, 5, '', 3)];
    function 계약머리(x, c, 번, 쪽) {
      var st = (x.act === 'cancel') ? 6 : (x.act === 'new' ? 7 : (쪽 === '전' ? 4 : 5));
      h1.push(cel(c, 3, '(' + 번 + ') ' + (x.p.co || '회사 모름'), st));
      h2.push(cel(c, 4, x.p.nm || '상품 모름', st));
      h3.push(cel(c, 5,
        (x.p.years ? (x.p.years + '납') : '납입 모름') + ' / ' + (x.p.term || '만기 모름') +
        '  ·  ' + (N(x.prem) !== null ? (N(x.prem) + '만원') : '보험료 모름') +
        '  ·  ' + (ACT[x.act] || ''), st));
    }
    B.forEach(function (x, i2) { 계약머리(x, cB0 + i2, i2 + 1, '전'); });
    h1.push(cel(cSumA, 3, '후 합계', 3)); h2.push(cel(cSumA, 4, '(만원)', 3)); h3.push(cel(cSumA, 5, '', 3));
    A.forEach(function (x, i2) { 계약머리(x, cA0 + i2, i2 + 1, '후'); });
    h1.push(cel(cDif, 3, '차이', 3), cel(cRes, 3, '결과', 3));
    h2.push(cel(cDif, 4, '후 − 전', 3), cel(cRes, 4, '', 3));
    h3.push(cel(cDif, 5, '', 3), cel(cRes, 5, '', 3));
    out.push(row(3, h1), row(4, h2), row(5, h3));
    merges.push('A3:A5', 'B3:B5', 'C3:C5', 'D3:D4', 'E3:E4',
      col(cSumA) + '3:' + col(cSumA) + '4', col(cDif) + '3:' + col(cDif) + '4',
      col(cRes) + '3:' + col(cRes) + '5');

    /* ── 6줄부터 — 묶음마다 <b>왼쪽 띠를 세로로 합쳐</b> 세웁니다 (사장님 자료 꼴) ── */
    r = 6;
    STD.forEach(function (gp, gi) {
      var 첫 = r;
      gp.rows.forEach(function (rw) {
        var k = rw.k, cells = [];
        cells.push(cel(0, r, (r === 첫) ? (gp.ic + ' ' + gp.mid) : ' ', X._GST(gi, 0)));
        cells.push(cel(1, r, rw.n, X._GST(gi, 2)), cel(2, r, UFULL[rw.u] || '', 8),
          cel(3, r, rw.std ? rw.std : null, 10));
        var fb = C.b[k], fa = C.a[k];
        cells.push(cel(cSumB, r, (fb === undefined ? null : fb), (S.man.b[k] !== undefined) ? 19 : 14));
        B.forEach(function (x, i2) { cells.push(cel(cB0 + i2, r, N(x.cov[k]), x.act === 'cancel' ? 13 : 11)); });
        cells.push(cel(cSumA, r, (fa === undefined ? null : fa), (S.man.a[k] !== undefined) ? 19 : 15));
        A.forEach(function (x, i2) { cells.push(cel(cA0 + i2, r, N(x.cov[k]), 12)); });
        var 둘다없음 = (fb === undefined && fa === undefined);
        var d = (fa || 0) - (fb || 0);
        cells.push(cel(cDif, r, 둘다없음 ? null : d, d > 0 ? 16 : (d < 0 ? 17 : 0)));
        cells.push(cel(cRes, r, 둘다없음 ? '빠짐' : (d > 0 ? '⏫ 보장UP' : (d < 0 ? '⏬ 줄어듦' : '유지')), 18));
        out.push(row(r, cells)); r++;
      });
      if (r - 1 > 첫) merges.push('A' + 첫 + ':A' + (r - 1));
    });

    /* 맨 아래 — 월 보험료.  ⚠ 합계는 calc() 가 낸 값 그대로입니다 (5번) */
    var P = function (k) { return X._PST(STD.length, k); };
    var pr = [cel(0, r, '', 8), cel(1, r, '월 보험료', 3), cel(2, r, '만원', 8), cel(3, r, '', 10)];
    pr.push(cel(cSumB, r, C.premB, P(2)));
    B.forEach(function (x, i2) { pr.push(cel(cB0 + i2, r, N(x.prem), x.act === 'cancel' ? P(4) : P(0))); });
    pr.push(cel(cSumA, r, C.premA, P(3)));
    A.forEach(function (x, i2) { pr.push(cel(cA0 + i2, r, N(x.prem), P(1))); });
    var dp = Math.round((C.premA - C.premB) * 100) / 100;
    pr.push(cel(cDif, r, dp, dp > 0 ? P(6) : (dp < 0 ? P(5) : P(0))));
    pr.push(cel(cRes, r, (C.premBn || C.premAn) ? ('보험료 모름 ' + (C.premBn + C.premAn) + '건') : '', 18));
    out.push(row(r, pr));

    /* 비워 둔 띠 자리를 이제 채웁니다 — 칸 수를 알게 됐습니다 */
    out[띠자리] = X._band(1, '  📊  보장분석 전 · 후 — 한눈에 모든 보험 · 모든 보장', w.length, X._STT(STDN(), 4));
    return X._sheet(out.join(''), { tab: true, freeze: [4, 5], cols: w, merge: merges, fit: true,
      tabColor: '2B3A55', zoom: 85,
      filter: 'B3:' + col(cRes) + (r - 1) });
  }

  function 계약시트(S) {
    var out = [], r = 1, i;
    var H = ['구분', '보험사', '상품명', '계약일', '납입기간', '보장기간', '갱신', '월 보험료(만원)', '처리', '적힌 담보'];
    out.push(row(r, H.map(function (t, c) { return cel(c, r, t, 3); }))); r++;
    function put(sd, p) {
      var act = (sd === '후') ? 'new' : (p.act || 'keep');
      var n = 0, k, cv = p.cov || {};
      for (k in cv) if (cv.hasOwnProperty(k) && N(cv[k]) !== null) n++;
      var st = (act === 'cancel') ? 13 : (sd === '후' ? 12 : 11);
      out.push(row(r, [cel(0, r, sd, 8), cel(1, r, p.co || null, 9), cel(2, r, p.nm || null, 9),
        cel(3, r, p.start || null, 8), cel(4, r, p.years || null, 8), cel(5, r, p.term || null, 8),
        cel(6, r, p.rnw || null, 8), cel(7, r, N(p.premMan), st),
        cel(8, r, ACT[act] || '', 18), cel(9, r, n, st)])); r++;
    }
    for (i = 0; i < S.before.length; i++) put('전', S.before[i]);
    for (i = 0; i < S.after.length; i++) put('후', S.after[i]);
    return X._sheet(out.join(''), { freeze: [0, 1], cols: [7, 16, 30, 12, 11, 11, 9, 15, 8, 10],
      tabColor: '6B7684', zoom: 90, fit: true, fitH: true });
  }

  function 빠진시트(STD, C) {
    var out = [], r = 1;
    out.push(row(r, ['대분류', '중분류', '담보', '단위', '표준(만원)'].map(function (t, c) { return cel(c, r, t, 3); }))); r++;
    STD.forEach(function (gp) {
      gp.rows.forEach(function (rw) {
        if (C.b[rw.k] !== undefined || C.a[rw.k] !== undefined) return;
        out.push(row(r, [cel(0, r, gp.big, 8), cel(1, r, gp.mid, 8), cel(2, r, rw.n, 9),
          cel(3, r, UFULL[rw.u] || '', 8), cel(4, r, rw.std ? rw.std : null, 10)])); r++;
      });
    });
    if (r === 2) out.push(row(r, [cel(0, r, '빠진 담보가 없습니다 — 표준 77가지가 모두 적혔습니다.', 9)]));
    return X._sheet(out.join(''), { freeze: [0, 1], cols: [11, 13, 36, 7, 12],
      tabColor: 'C9283A', zoom: 90 });
  }

  /* ══ 📉 과부족 — 사장님 자료 31쪽 「주요 담보별 과부족 현황」 꼴 ═══════
     ★ 과부족을 세는 자는 <b>앱의 gapState</b> 입니다 — ✓갖춤 · △모자람 · ✗없음.
       엑셀에서 다시 셈하지 않습니다 (5번 · 묻는 곳은 하나).
       gapState 는 ba.html 의 전역이라 여기서 바로 부릅니다. 없으면 모른다고 적습니다 (1번). */
  function 상태글(st) { return st === 'o' ? '충분' : (st === 'h' ? '부족' : '미가입'); }
  function 과부족시트(S, STD, C) {
    var out = [], r = 1, G = (typeof g.gapState === 'function') ? g.gapState : null;
    out.push(X._band(r, '  📉  담보별 과부족 — 권장과 견주어', 9, X._STT(STDN(), 4))); r++;
    out.push(row(r, [cel(0, r, G ? '상태는 앱의 gapState 가 냅니다 — ✓충분 · △부족 · ✗미가입 · 금액은 만원'
      : '⚠ 상태를 내는 자(gapState)를 못 불렀습니다 — 금액만 적습니다 (지어내지 않습니다)', 2)])); r++;
    var H = ['묶음', '담보', '단위', '권장', '전(지금)', '후(조정)', '후 − 권장', '상태(전)', '상태(후)'];
    out.push(row(r, H.map(function (t, c) { return cel(c, r, t, 3); }))); r++;
    STD.forEach(function (gp, gi) {
      var 첫 = r;
      gp.rows.forEach(function (rw) {
        var k = rw.k, fb = C.b[k], fa = C.a[k], sd = rw.std || 0;
        var 남 = (sd > 0 && fa !== undefined) ? (fa - sd) : null;
        out.push(row(r, [
          cel(0, r, (r === 첫) ? (gp.ic + ' ' + gp.mid) : ' ', X._GST(gi, 0)),
          cel(1, r, rw.n, X._GST(gi, 2)), cel(2, r, UFULL[rw.u] || '', 8),
          cel(3, r, sd ? sd : null, 10),
          cel(4, r, fb === undefined ? null : fb, 14),
          cel(5, r, fa === undefined ? null : fa, 15),
          cel(6, r, 남, 남 === null ? 0 : (남 >= 0 ? 16 : 17)),
          cel(7, r, G ? 상태글(G(k, fb)) : null, 18),
          cel(8, r, G ? 상태글(G(k, fa)) : null, 18)])); r++;
      });
    });
    return X._sheet(out.join(''), { freeze: [2, 3], fit: true, tabColor: 'B45309', zoom: 90,
      cols: [13, 34, 7, 10, 11, 11, 12, 10, 10], filter: 'A3:I' + (r - 1) });
  }

  /* ══ 📄 묶음마다 한 장 — 사장님 자료 32~38쪽 꼴 ═══════════════════
     「담보별로 지금 이 자료처럼 분리자료도」 — 묶음(부위) 하나가 시트 하나입니다.
     담보마다 권장 · 가입(전·후) · 과부족 · 상태를 한 줄에 놓고, 읽기 쉬운
     <b>억·만 글자</b>를 옆 칸에 같이 답니다(숫자 칸은 그대로 둡니다 · 4-1).     */
  /* ══ 📖 판 X539 — <b>보장범위 · 어떻게 나오나</b> ══════════════════════
     사장님 말씀 2026-11-24 — 「<b>보장범위도 엑셀에 포함시키고, 어떻게 지급되는지
     추측 되도록</b>」.
     ★ 글은 전부 <b>앱에 이미 있는 것</b>입니다 — 보장범위는 DESC(화면의 담보 설명),
       같이 걸리는 이름·제외는 STD 의 syn·not, 지급 모양은 BA_ART.PAY 입니다.
       여기서 새로 쓴 문장이 <b>한 줄도 없습니다</b> (1번).
     ★ <b>금액·요건·기간은 적지 않습니다</b> — 약관과 심사가 정합니다 (1번 · 2번).
       그래서 머리에 「심사 결과에 따릅니다」 를 박아 둡니다.                   */
  function 범위글(k) {
    var d = (g.DESC && g.DESC[k]) ? String(g.DESC[k]) : '';
    if (!d) return '';                                   /* 없으면 빈 칸 — 지어내지 않습니다 */
    return d.split(/<br\s*\/?>|\n/)[0].replace(/<[^>]+>/g, '').trim();
  }
  function 범위시트(STD, C) {
    var out = [], r = 1, G = (typeof g.gapState === 'function') ? g.gapState : null;
    var N = STDN();
    out.push(X._band(r, '  📖  보장범위 · 어떻게 나오나 — 담보마다 무엇을 보고, 어떤 모양으로 나오는가',
      7, X._STT(N, 4))); r++;
    /* ⚠ .replace 는 <b>마지막 조각에만</b> 붙습니다 — 괄호로 묶지 않으면 「&lt;b&gt;」 가
       글자 그대로 찍힙니다(뽑아서 보고 찾았습니다). */
    out.push(row(r, [cel(0, r, ('글은 모두 이 도구의 담보 설명과 이름표에서 왔습니다 — 금액 · 요건 · 기간은 적지 않습니다.' +
      '   ·   보험료 · 보장은 심사 결과에 따릅니다.' +
      '   ·   세금은 요건 충족 시에만 그렇습니다 — 판단은 세무 전문가에게 맡기십시오.'
      ).replace(/<[^>]+>/g, ''), X._STT(N, 3))]
      .concat([1, 2, 3, 4, 5, 6].map(function (c) {
        return '<c r="' + X._col(c) + r + '" s="' + X._STT(N, 3) + '"/>'; })), 22)); r++;
    var H = ['묶음', '담보', '방식', '언제 · 어떻게 나오나', '보장범위 — 무엇을 보는가',
      '같이 걸리는 이름 (상품마다 다름)', '이건 아닙니다'];
    var 머리줄 = r;
    out.push(row(r, H.map(function (t, c) { return cel(c, r, t, 3); }), 26)); r++;
    STD.forEach(function (gp, gi) {
      gp.rows.forEach(function (rw) {
        var 모양 = (g.BA_ART && g.BA_ART.payOf) ? g.BA_ART.payOf(rw.u) : null;
        var st = G ? G(rw.k, C.a[rw.k]) : null;
        out.push(row(r, [
          cel(0, r, gp.mid, X._GST(gi, 1)),
          cel(1, r, rw.n, X._GST(gi, 2)),
          cel(2, r, 모양 ? 모양.n : '', 8),
          cel(3, r, 모양 ? 모양.say.replace(/<[^>]+>/g, '') : '', 9),
          cel(4, r, 범위글(rw.k), 9),
          cel(5, r, (rw.syn || []).join(' · '), 9),
          cel(6, r, (rw.not && rw.not.length) ? (rw.not.join(' · ') + ' 은(는) 안 걸립니다') : '', 9)
        ], 34)); r++;
      });
    });
    return X._sheet(out.join(''), { freeze: [2, 머리줄], fit: true,
      cols: [14, 34, 8, 46, 56, 42, 30], tabColor: '1C7A5B', zoom: 80,
      filter: 'A' + 머리줄 + ':G' + (r - 1) });
  }

  function 묶음시트(gp, gi, C) {
    /* ★ 판 X538 — 사장님 말씀 「<b>엑셀로 퀄리티는 이것밖에 안되?</b>」.
       표가 엑셀 기본값(글씨 10.5 · 줄 높이 15 · 격자선 켜짐)이라 날 시트로 보였습니다.
       엑셀이 가진 것을 씁니다 — <b>큰 제목 띠 · 줄 높이 · 탭 색 · 자동 거르기 ·
       셀 안 막대(조건부 서식) · 인쇄 머리글 반복 · 상태 칸 칠하기</b>. */
    var out = [], r = 1, G = (typeof g.gapState === 'function') ? g.gapState : null;
    var N = STDN(), 모자람 = false;
    /* ① 큰 제목 띠 — 그 묶음 색 바탕에 흰 16pt. A~H 를 합쳐 한 줄로 */
    out.push(X._band(r, '  ' + gp.ic + '  ' + gp.big + '  ›  ' + gp.mid, 8, X._BIG(N, gi))); r++;
    var 셈 = { o: 0, h: 0, x: 0 };
    gp.rows.forEach(function (rw) { if (G) 셈[G(rw.k, C.a[rw.k])]++; });
    /* ★ 판 X539 — 「어떻게 지급되는지 추측 되도록」. 줄마다 같은 말을 되풀이하면
       거르기·정렬만 무거워집니다. 이 묶음에 <b>실제로 나오는 모양</b>만 한 번 적고,
       담보 하나하나는 「보장범위 · 지급」 시트가 말합니다 (5번). */
    var 모양들 = [], 본것 = {};
    gp.rows.forEach(function (rw) {
      var q = (g.BA_ART && g.BA_ART.payOf) ? g.BA_ART.payOf(rw.u) : null;
      if (q && !본것[q.n]) { 본것[q.n] = 1; 모양들.push(q.n + ' — ' + q.when); }
    });
    out.push(row(r, [cel(0, r, '담보 ' + gp.rows.length + '가지' +
      (G ? ('   ·   조정 후 — 충분 ' + 셈.o + ' · 부족 ' + 셈.h + ' · 미가입 ' + 셈.x) : '') +
      '   ·   금액은 만원   ·   나오는 모양 — ' + 모양들.join(' / ') +
      '   ·   「후 − 권장」 칸의 막대는 모자란 만큼입니다', X._STT(N, 3))]
      .concat([1, 2, 3, 4, 5, 6, 7].map(function (c) {
        return '<c r="' + X._col(c) + r + '" s="' + X._STT(N, 3) + '"/>'; })), 22)); r++;
    var H = ['담보', '방식', '권장', '전(지금)', '후(조정)', '후 − 권장', '상태(후)', '읽는 금액(후)'];
    var 머리줄 = r;
    out.push(row(r, H.map(function (t, c) { return cel(c, r, t, 3); }), 26)); r++;
    var 첫줄 = r;
    gp.rows.forEach(function (rw) {
      var k = rw.k, fb = C.b[k], fa = C.a[k], sd = rw.std || 0;
      var 남 = (sd > 0 && fa !== undefined) ? (fa - sd) : null;
      if (남 !== null && 남 < 0) 모자람 = true;
      var st = G ? G(k, fa) : null;
      out.push(row(r, [
        cel(0, r, rw.n, X._GST(gi, 2)), cel(1, r, UFULL[rw.u] || '', 8),
        cel(2, r, sd ? sd : null, 10),
        cel(3, r, fb === undefined ? null : fb, 14),
        cel(4, r, fa === undefined ? null : fa, 15),
        cel(5, r, 남, 남 === null ? 0 : (남 >= 0 ? 16 : 17)),
        /* 상태는 글자색만이 아니라 <b>칸을 칠합니다</b> — 눈이 색부터 읽습니다 */
        cel(6, r, st ? 상태글(st) : null,
          st === 'o' ? X._STT(N, 0) : (st === 'h' ? X._STT(N, 1) : (st === 'x' ? X._STT(N, 2) : 18))),
        cel(7, r, fa === undefined ? null : 억만(fa), 18)], 21)); r++;
    });
    /* ★ 판 X536 — 사장님 말씀 「엑셀로 디자인 짜」. 표 아래에 <b>그 묶음의 도해</b>를
       엑셀 도형으로 얹습니다. 그리는 자는 ba-art.js 한 곳입니다 (5번) —
       사진이 아니라 <b>도형</b>이라 늘려도 같은 선으로 섭니다 (9번). */
    var 도해 = (g.BA_ART && typeof g.BA_ART.scene === 'function')
      ? g.BA_ART.scene(gp.mid, gp.c) : '';
    var 너비 = [38, 8, 11, 12, 12, 13, 11, 15];
    var 끝 = r - 1;
    return { xml: X._sheet(out.join(''), { freeze: [1, 머리줄], fit: true, fitH: true, cols: 너비, draw: !!도해,
      /* 탭에 그 묶음 색 · 머리줄에서 거르기 · 「후 − 권장」 칸에 셀 안 막대 */
      tabColor: String(gp.c || '#3E6FD9').replace('#', '').toUpperCase(),
      filter: 'A' + 머리줄 + ':H' + 끝,
      bar: (끝 >= 첫줄 && 모자람) ? ('F' + 첫줄 + ':F' + 끝) : '',
      merge: ['A1:H1', 'A2:H2'], zoom: 90 }),
      도해: 도해, 줄: r, 폭: 칸폭EMU(너비), 머리줄: 머리줄 };
  }

  /* ══ 🕸 거미줄 그래프 — 사장님 자료 31쪽 「주요 담보별 과부족 현황」 ═══
     엑셀 그림(chart)은 부품 넷이 맞물립니다 —
       xl/charts/chart1.xml          그림 자체(radar)
       xl/drawings/drawing1.xml      그 그림을 시트 어디에 놓을지
       xl/worksheets/_rels/…         시트 → 그림
       xl/drawings/_rels/…           그림 → chart
     ★ <b>그림이 읽는 값은 시트의 칸</b>입니다(c:f 로 가리킵니다). 숫자를 그림 안에
       또 적으면 시트를 고쳐도 그림이 안 따라옵니다 — 두 벌이 됩니다 (5번).
     ★ <b>권장과 가입(후)</b> 두 줄을 겹쳐 그립니다. 사장님 자료처럼 「얼마나
       모자라나」 가 한눈에 보입니다. 값이 없는 담보는 <b>넣지 않습니다</b> (1번). */
  function 차트(개수, 시트) {
    var cat = "'" + 시트 + "'!$B$4:$B$" + (3 + 개수);
    function ser(i2, nm2, colLetter, color) {
      return '<c:ser><c:idx val="' + i2 + '"/><c:order val="' + i2 + '"/>' +
        '<c:tx><c:strRef><c:f>' + "'" + 시트 + "'!$" + colLetter + '$3</c:f></c:strRef></c:tx>' +
        '<c:spPr><a:ln w="22000"><a:solidFill><a:srgbClr val="' + color + '"/></a:solidFill></a:ln>' +
        '<a:solidFill><a:srgbClr val="' + color + '"><a:alpha val="22000"/></a:srgbClr></a:solidFill></c:spPr>' +
        '<c:cat><c:strRef><c:f>' + cat + '</c:f></c:strRef></c:cat>' +
        '<c:val><c:numRef><c:f>' + "'" + 시트 + "'!$" + colLetter + '$4:$' + colLetter + '$' + (3 + 개수) +
        '</c:f></c:numRef></c:val></c:ser>';
    }
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" ' +
      'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><c:chart>' +
      '<c:title><c:tx><c:rich><a:bodyPr/><a:p><a:r><a:rPr lang="ko-KR" sz="1300" b="1"/>' +
      '<a:t>주요 담보 — 권장과 가입(조정 후)</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>' +
      '<c:autoTitleDeleted val="0"/><c:plotArea><c:layout/>' +
      '<c:radarChart><c:radarStyle val="marker"/><c:varyColors val="0"/>' +
      ser(0, '권장', 'C', 'C9A86A') + ser(1, '가입(후)', 'D', '2A5BD7') +
      '<c:axId val="111111111"/><c:axId val="222222222"/></c:radarChart>' +
      '<c:catAx><c:axId val="111111111"/><c:scaling><c:orientation val="minMax"/></c:scaling>' +
      '<c:delete val="0"/><c:axPos val="b"/><c:crossAx val="222222222"/></c:catAx>' +
      '<c:valAx><c:axId val="222222222"/><c:scaling><c:orientation val="minMax"/></c:scaling>' +
      '<c:delete val="0"/><c:axPos val="l"/><c:majorGridlines/><c:crossAx val="111111111"/></c:valAx>' +
      '</c:plotArea><c:legend><c:legendPos val="b"/><c:overlay val="0"/></c:legend>' +
      '<c:plotVisOnly val="1"/></c:chart></c:chartSpace>';
  }
  /* ══ 🖨 판 X536 — 묶음 도해를 엑셀 도형으로 ════════════════════════
     사장님 말씀 「<b>엑셀로 디자인 짜</b>」. 따로 선 HTML 에만 두면 사장님이
     엑셀과 그 문서를 둘 다 들고 다니셔야 합니다.
     ★ 그리는 자는 <b>ba-art.js 한 곳</b>입니다 — 여기서는 옮기기만 합니다 (5번).
     ★ 사진이 아니라 <b>도형</b>입니다 — 래스터는 인쇄에서 뭉개집니다 (9번). */
  /* 엑셀 칸 너비(글자 수) → 화면 점 → EMU. 표와 <b>폭을 맞추려고</b> 잽니다. */
  function 칸폭EMU(ws) {
    var px = 0;
    (ws || []).forEach(function (w) { px += Math.round(w * 7) + 5; });
    return px * 9525;
  }
  function STDN() { return (g.STD || []).length; }
  function 도해판(svg, 줄, 폭) {
    /* ★ 판 X537 — 사장님 말씀 「도형도 그림으로 깔끔하게 딱 정리」.
       ① 도해 폭을 <b>표 폭에 맞춥니다</b> — 좁으면 왼쪽으로 치우쳐 보입니다.
       ② <b>oneCellAnchor</b> 로 칸에 앉힙니다 — 줄을 넣거나 빼도 도해가 따라오고,
          크기는 그대로입니다(absoluteAnchor 는 종이 위에 떠 있어 어긋납니다). */
    var G = g.BA_ART.toDml(svg, { id0: 1000, cx: 폭 || 6480000 });
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" ' +
      'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
      '<xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff>' +
      '<xdr:row>' + 줄 + '</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>' +
      '<xdr:ext cx="' + G.cx + '" cy="' + G.cy + '"/>' +
      G.xml + '<xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>';
  }
  function 그림판(칸) {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" ' +
      'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<xdr:twoCellAnchor><xdr:from><xdr:col>' + 칸 + '</xdr:col><xdr:colOff>0</xdr:colOff>' +
      '<xdr:row>2</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>' +
      '<xdr:to><xdr:col>' + (칸 + 9) + '</xdr:col><xdr:colOff>0</xdr:colOff>' +
      '<xdr:row>26</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>' +
      '<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr>' +
      '<xdr:cNvPr id="2" name="거미줄"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>' +
      '<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>' +
      '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">' +
      '<c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId1"/>' +
      '</a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>';
  }

  /* 📉 그래프가 읽을 <b>작은 표</b> — 권장이 있고 조정 후에 값이 있는 담보만.
     사장님 자료처럼 열두 가지까지만 올립니다(스물이 넘으면 거미줄이 글자로 막힙니다). */
  function 그래프시트(STD, C) {
    var out = [], r = 1, L = [];
    STD.forEach(function (gp) {
      gp.rows.forEach(function (rw) {
        if (!rw.std || rw.std <= 0) return;
        if (C.a[rw.k] === undefined && C.b[rw.k] === undefined) return;
        if (rw.u === 'A') return;                 /* 한도형은 금액으로 안 견줍니다 */
        L.push({ n: (rw.s || rw.n), std: rw.std, a: C.a[rw.k] || 0 });
      });
    });
    /* 모자란 것부터 — 고객이 먼저 보셔야 할 자리입니다 */
    L.sort(function (p1, p2) { return (p1.a - p1.std) - (p2.a - p2.std); });
    L = L.slice(0, 12);
    out.push(X._band(r, '  🕸  주요 담보 — 권장과 가입(조정 후)', 5, X._STT(STDN(), 4))); r++;
    out.push(row(r, [cel(0, r, L.length ? ('권장이 정해진 담보 가운데 <b>모자란 것부터</b> ' + L.length + '가지입니다 · 만원 · 한도형(실손)은 금액으로 안 견주어 뺐습니다')
      : '⚠ 그릴 것이 없습니다 — 권장이 정해진 담보에 적힌 값이 없습니다. 아무 숫자도 만들지 않습니다.', 2)])); r++;
    out.push(row(r, [cel(0, r, 'NO', 3), cel(1, r, '담보', 3), cel(2, r, '권장', 3), cel(3, r, '가입(후)', 3), cel(4, r, '과부족', 3)])); r++;
    L.forEach(function (x, i2) {
      out.push(row(r, [cel(0, r, i2 + 1, 8), cel(1, r, x.n, 9), cel(2, r, x.std, 10),
        cel(3, r, x.a, 15), cel(4, r, x.a - x.std, (x.a - x.std) >= 0 ? 16 : 17)])); r++;
    });
    /* ★ 판 X540 — 표와 거미줄이 두 쪽으로 갈라져 각각 반 쪽만 썼습니다. 한 장에 담습니다. */
    return { xml: X._sheet(out.join(''), { cols: [5, 30, 11, 12, 12], draw: L.length > 2,
      tabColor: '2A5BD7', zoom: 90, fit: true, fitH: true }), n: L.length };
  }

  /* ══ 내려받기 ══════════════════════════════════════════════════ */
  X.make = function (opt) {
    opt = opt || {};
    var S = g.S, STD = g.STD, C = g.calc();
    var 실명 = (S.who && S.who.name) ? String(S.who.name) : '';
    /* 가린 것이 기본 — 실명은 opt.real 일 때만 (3번) */
    var nm = opt.real ? (실명 || '고객') : (X._mask(실명) || '고객');

    /* ── 시트 차례 — 사장님 자료 차례를 그대로 따릅니다 ──────────────
       ① 한눈에(담보 × 계약) ② 계약 ③ 과부족 ④ 그래프 ⑤ 빠진 담보
       ⑥ 보장범위 · 지급 (담보마다 무엇을 보고 어떻게 나오는가)
       ⑦~ 묶음마다 한 장 (담보별 분리자료)                               */
    var GR = 그래프시트(STD, C);
    var SH = [{ n: '한눈에', x: 한눈에(S, STD, C, nm) },
      { n: '계약', x: 계약시트(S) },
      { n: '과부족', x: 과부족시트(S, STD, C) },
      { n: '그래프', x: GR.xml, 그림: GR.n > 2, 줄: GR.n },
      { n: '빠진 담보', x: 빠진시트(STD, C) },
      /* ★ 판 X539 — 사장님 말씀 「보장범위도 엑셀에 포함시키고, 어떻게 지급되는지 추측 되도록」 */
      { n: '보장범위 · 지급', x: 범위시트(STD, C) }];
    STD.forEach(function (gp, gi) {
      /* 시트 이름에는 : \\ / ? * [ ] 를 못 씁니다. 31자가 넘으면 엑셀이 안 엽니다. */
      var 이름 = String(gp.mid).replace(/[:\\\/?*\[\]]/g, ' ').slice(0, 28);
      /* 같은 이름이 두 번 나오면 엑셀이 안 엽니다 — 뒤에 번호를 답니다 */
      var 겹 = 0, 본 = 이름;
      while (SH.some(function (q) { return q.n === 이름; })) { 겹++; 이름 = (본 + ' ' + (겹 + 1)).slice(0, 31); }
      var 묶 = 묶음시트(gp, gi, C);
      SH.push({ n: 이름, x: 묶.xml, 도해: 묶.도해, 도해줄: 묶.줄, 도해폭: 묶.폭 });
    });

    /* 그림이 붙는 시트가 몇 번째인가 — 없으면 -1 */
    var 그림쪽 = -1;
    SH.forEach(function (q, i2) { if (q.그림) 그림쪽 = i2; });

    /* ★ 판 X536 — 그림판은 <b>시트마다 한 장</b>입니다. 거미줄이 1번,
       묶음 도해가 2번부터입니다. 사장님 말씀 「엑셀로 디자인 짜」. */
    var DR = [], no = 1;
    if (그림쪽 >= 0) DR.push({ no: no++, 시트: 그림쪽, 차트: true });
    SH.forEach(function (q, i2) {
      if (!q.도해) return;
      /* 표 아래에 놓습니다 — 표를 가리면 숫자를 못 읽습니다 */
      DR.push({ no: no++, 시트: i2, 도해: q.도해, 줄: (q.도해줄 || 20), 폭: q.도해폭,
        높이: Math.round((q.도해폭 || 6480000) * 300 / 640) });
    });
    function 엑셀글(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    var files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        SH.map(function (q, i2) { return '<Override PartName="/xl/worksheets/sheet' + (i2 + 1) +
          '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        (그림쪽 >= 0 ? '<Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>' : '') +
        DR.map(function (q) { return '<Override PartName="/xl/drawings/drawing' + q.no +
          '.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>'; }).join('') +
        '</Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>' },
      { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
        SH.map(function (q, i2) { return '<sheet name="' + 엑셀글(q.n) + '" sheetId="' + (i2 + 1) +
          '" r:id="rId' + (i2 + 1) + '"/>'; }).join('') +
        '</sheets>' +
        /* ★ 판 X537 — 사장님 말씀 「깔끔하게 딱 정리」. 인쇄하면 <b>표와 도해까지만</b>
           나오게 범위를 못 박습니다. 안 박으면 엑셀이 빈 칸까지 세어 종이가 늘어납니다. */
        /* ★ 이름 자리는 <b>한 묶음</b>입니다 — 인쇄 범위와 머리글 되풀이를 같이 담습니다.
           ① Print_Area  — 묶음 시트는 표+도해까지만 인쇄 (판 X537)
           ② Print_Titles — ★ 판 X540. 사장님 말씀 「전체적으로 이미지 찍어줘」 를 찍어 보니
              두 쪽째부터 <b>머리글이 없어</b> 숫자만 남아 있었습니다. 이어지는 쪽마다
              머리 줄을 되풀이합니다.                                              */
        (function () {
          var T = [];
          DR.forEach(function (q) {
            if (q.차트) return;
            /* ⚠ +2 로는 도해 아래 한 줄이 잘렸습니다(뽑아서 보고 찾음) */
            var 끝 = q.줄 + Math.ceil((q.높이 || 3800000) / 190500) + 4;
            T.push('<definedName name="_xlnm.Print_Area" localSheetId="' + q.시트 + '">\'' +
              엑셀글(String(SH[q.시트].n).replace(/'/g, "''")) + '\'!$A$1:$H$' + 끝 + '</definedName>');
          });
          var 머리 = { '한눈에': '1:4', '과부족': '1:3', '빠진 담보': '1:2', '보장범위 · 지급': '1:3' };
          SH.forEach(function (q, i3) {
            var 줄 = q.도해 ? '1:3' : 머리[q.n];
            if (!줄) return;
            var ab = 줄.split(':');
            T.push('<definedName name="_xlnm.Print_Titles" localSheetId="' + i3 + '">\'' +
              엑셀글(String(q.n).replace(/'/g, "''")) + '\'!$' + ab[0] + ':$' + ab[1] + '</definedName>');
          });
          return T.length ? ('<definedNames>' + T.join('') + '</definedNames>') : '';
        })() +
        '</workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        SH.map(function (q, i2) { return '<Relationship Id="rId' + (i2 + 1) +
          '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i2 + 1) + '.xml"/>'; }).join('') +
        '<Relationship Id="rId' + (SH.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>' },
      { name: 'xl/styles.xml', data: X._styles(STD) }
    ];
    SH.forEach(function (q, i2) { files.push({ name: 'xl/worksheets/sheet' + (i2 + 1) + '.xml', data: q.x }); });
    DR.forEach(function (q) {
      files.push({ name: 'xl/worksheets/_rels/sheet' + (q.시트 + 1) + '.xml.rels',
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" ' +
          'Target="../drawings/drawing' + q.no + '.xml"/></Relationships>' });
      if (q.차트) {
        files.push(
          { name: 'xl/drawings/drawing' + q.no + '.xml', data: 그림판(6) },
          { name: 'xl/drawings/_rels/drawing' + q.no + '.xml.rels',
            data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
              '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
              '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" ' +
              'Target="../charts/chart1.xml"/></Relationships>' },
          { name: 'xl/charts/chart1.xml', data: 차트(SH[q.시트].줄, SH[q.시트].n) });
      } else {
        files.push({ name: 'xl/drawings/drawing' + q.no + '.xml', data: 도해판(q.도해, q.줄, q.폭) });
      }
    });

    var blob = X._zip(files);
    var fn = '보장분석_전후_한눈에_' + nm + '_' + (new Date()).toISOString().slice(0, 10) + '.xlsx';
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = fn;
    /* ⚠ 누르자마자 지우면 브라우저가 <b>이름을 못 받아</b> 「download」 로
       떨어집니다. 내려받기가 시작할 틈을 주고 치웁니다. */
    document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(a.href); }, 4000);
    return { name: fn, size: blob.size, cols: cols(S), sheets: SH.map(function (q) { return q.n; }) };
  };
})(window);
