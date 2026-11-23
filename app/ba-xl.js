/* ══════════════════════════════════════════════════════════════════════
   ba-xl.js — 📊 <b>보장분석 전·후를 엑셀 한 장으로</b> (판 X527)

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
    return '<c r="' + a + '"' + s + ' t="inlineStr"><is><t xml:space="preserve">' + esc(v) + '</t></is></c>';
  }
  function row(r, cells) { return '<row r="' + r + '">' + cells.join('') + '</row>'; }

  /* ══ ③ 꼴(styles) — <b>묶음(부위)마다 제 색</b> (판 X527 · 사장님 말씀
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
    for (i = 0; i < FILL.length; i++) fi += '<fill>' + FILL[i] + '</fill>';

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
      '<cellXfs count="' + (20 + GRP.length * 3 + 7) + '">' + xf + '</cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  }

  function sheet(body, opt) {
    opt = opt || {};
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      /* 인쇄는 <b>가로 한 장 폭</b>에 맞춥니다 — 안 그러면 칸이 옆으로 길어
         열두 장으로 쪼개집니다(뽑아서 세어 봤습니다). 세로로는 몇 장이든 흐릅니다. */
      (opt.fit ? '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' : '') +
      '<sheetViews><sheetView workbookViewId="0"' + (opt.tab ? ' tabSelected="1"' : '') + '>' +
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
      (opt.fit ? ('<printOptions/><pageMargins left="0.3" right="0.3" top="0.4" bottom="0.4" header="0.2" footer="0.2"/>' +
        '<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0" paperSize="9"/>') :
        '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>') +
      '</worksheet>';
  }

  g.BA_XL = { _zip: zip, _sheet: sheet, _cel: cel, _row: row, _col: col, _mask: mask, _styles: styles, _GST: GST, _PST: PST, _N: N };
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

  function 한눈에(S, STD, C, nm) {
    var cc = cols(S), B = cc.B, A = cc.A, out = [], merges = [], r, i;
    var nB = B.length, nA = A.length;
    /* 칸 차례 — 0~4 라벨 · 전 nB · 전합계 · 후 nA · 후합계 · 차이 · 결과 */
    var cSumB = 5 + nB, cA0 = cSumB + 1, cSumA = cA0 + nA, cDif = cSumA + 1, cRes = cDif + 1;
    /* ⚠ A칸 11 로는 「3대질병 의료보장」 이 <b>잘립니다</b> — 뽑아서 눈으로
       보고 넓혔습니다. 담보 이름 칸도 긴 것(「뇌혈관 주요치료비 (혈전용해 ·
       혈관중재술 · 수술)」)에 맞춥니다. */
    var w = [14, 13, 36, 7, 9];   /* A·B 는 이제 <b>거르기용</b>입니다 — 이름은 띠가 말합니다 */
    for (i = 0; i < nB; i++) w.push(13); w.push(11);
    for (i = 0; i < nA; i++) w.push(13); w.push(11, 10, 11);

    /* 1줄 제목 · 2줄 범례 */
    out.push(row(1, [cel(0, 1, '📊 보장분석 전 · 후 — 한눈에 모든 보험 · 모든 보장', 1)]));
    out.push(row(2, [cel(0, 2,
      nm + ' 님' + (S.who.age ? (' · ' + S.who.age + '세') : '') +
      (S.who.sex ? (' · ' + (S.who.sex === 'f' ? '여' : '남')) : '') +
      ' · 뽑은 날 ' + (new Date()).toISOString().slice(0, 10) +
      ' · 금액은 모두 만원 · 빈 칸은 「안 적힘(모름)」 이고 0 은 정말 0 일 때만입니다' +
      ' · 합계가 칸의 합과 다르면 그 합계를 손으로 고치신 것입니다', 2)]));

    /* 3·4줄 머리 */
    var h1 = [cel(0, 3, '대분류', 3), cel(1, 3, '중분류', 3), cel(2, 3, '담보', 3),
      cel(3, 3, '단위', 3), cel(4, 3, '표준', 3)];
    var h2 = [cel(0, 4, '', 3), cel(1, 4, '', 3), cel(2, 4, '', 3), cel(3, 4, '', 3), cel(4, 4, '(만원)', 3)];
    B.forEach(function (x, i2) {
      var st = (x.act === 'cancel') ? 6 : 4;
      h1.push(cel(5 + i2, 3, '[전] ' + (x.p.co || '회사 모름'), st));
      h2.push(cel(5 + i2, 4, (x.p.nm || '상품 모름') + ' · ' +
        (N(x.prem) !== null ? ('월 ' + N(x.prem) + '만') : '보험료 모름') + ' · ' + (ACT[x.act] || ''), st));
    });
    h1.push(cel(cSumB, 3, '전 합계', 3)); h2.push(cel(cSumB, 4, '(만원)', 3));
    A.forEach(function (x, i2) {
      var st = (x.act === 'new') ? 7 : 5;
      h1.push(cel(cA0 + i2, 3, '[후] ' + (x.p.co || '회사 모름'), st));
      h2.push(cel(cA0 + i2, 4, (x.p.nm || '상품 모름') + ' · ' +
        (N(x.prem) !== null ? ('월 ' + N(x.prem) + '만') : '보험료 모름') + ' · ' + (ACT[x.act] || ''), st));
    });
    h1.push(cel(cSumA, 3, '후 합계', 3), cel(cDif, 3, '차이', 3), cel(cRes, 3, '결과', 3));
    h2.push(cel(cSumA, 4, '(만원)', 3), cel(cDif, 4, '후 − 전', 3), cel(cRes, 4, '', 3));
    out.push(row(3, h1), row(4, h2));

    /* 5줄부터 — <b>묶음(부위)마다 띠 한 줄</b> + 그 묶음의 담보들.
       사장님 말씀 「색 별로 따로 나누고, 글씨 크기 부위 전부 나눠」 —
       77줄이 한 덩어리로 붙어 있으면 부위가 안 갈립니다. 묶음마다 <b>제 색</b>으로
       띠를 세우고(화면에서 쓰는 그 색 그대로 · 5번) 글자 크기를 층으로 나눕니다. */
    r = 5;
    STD.forEach(function (gp, gi) {
      /* ── 묶음 띠 한 줄 — 칸 끝까지 그 색으로 칠합니다 ── */
      var 띠 = [], ci;
      var 셈 = 0;
      gp.rows.forEach(function (rw) { if (C.b[rw.k] !== undefined || C.a[rw.k] !== undefined) 셈++; });
      띠.push(cel(0, r, gp.ic + ' ' + gp.big + ' › ' + gp.mid +
        '   (담보 ' + gp.rows.length + '개 · 적힌 것 ' + 셈 + '개)', X._GST(gi, 0)));
      for (ci = 1; ci <= cRes; ci++) 띠.push(cel(ci, r, ' ', X._GST(gi, 0)));
      out.push('<row r="' + r + '" ht="20" customHeight="1">' + 띠.join('') + '</row>');
      merges.push('A' + r + ':' + col(cRes) + r); r++;

      gp.rows.forEach(function (rw) {
        var k = rw.k, cells = [];
        cells.push(cel(0, r, gp.big, X._GST(gi, 1)), cel(1, r, gp.mid, X._GST(gi, 1)),
          cel(2, r, rw.n, X._GST(gi, 2)),
          cel(3, r, UFULL[rw.u] || '', 8), cel(4, r, rw.std ? rw.std : null, 10));
        B.forEach(function (x, i2) {
          cells.push(cel(5 + i2, r, N(x.cov[k]), x.act === 'cancel' ? 13 : 11)); });
        var fb = C.b[k], fa = C.a[k];
        cells.push(cel(cSumB, r, (fb === undefined ? null : fb),
          (S.man.b[k] !== undefined) ? 19 : 14));
        A.forEach(function (x, i2) { cells.push(cel(cA0 + i2, r, N(x.cov[k]), 12)); });
        cells.push(cel(cSumA, r, (fa === undefined ? null : fa),
          (S.man.a[k] !== undefined) ? 19 : 15));
        var 둘다없음 = (fb === undefined && fa === undefined);
        var d = (fa || 0) - (fb || 0);
        cells.push(cel(cDif, r, 둘다없음 ? null : d, d > 0 ? 16 : (d < 0 ? 17 : 0)));
        cells.push(cel(cRes, r, 둘다없음 ? '빠짐' : (d > 0 ? '⏫ 보장UP' : (d < 0 ? '⏬ 줄어듦' : '유지')), 18));
        out.push(row(r, cells)); r++;
      });
    });

    /* 맨 아래 — 월 보험료.  ⚠ 합계는 calc() 가 낸 값 그대로입니다 (5번) */
    var P = function (k) { return X._PST(STD.length, k); };
    var pr = [cel(0, r, '', 8), cel(1, r, '', 8), cel(2, r, '월 보험료', 3), cel(3, r, '만원', 8), cel(4, r, '', 10)];
    B.forEach(function (x, i2) { pr.push(cel(5 + i2, r, N(x.prem), x.act === 'cancel' ? P(4) : P(0))); });
    pr.push(cel(cSumB, r, C.premB, P(2)));
    A.forEach(function (x, i2) { pr.push(cel(cA0 + i2, r, N(x.prem), P(1))); });
    pr.push(cel(cSumA, r, C.premA, P(3)));
    var dp = Math.round((C.premA - C.premB) * 100) / 100;
    pr.push(cel(cDif, r, dp, dp > 0 ? P(6) : (dp < 0 ? P(5) : P(0))));   /* 보험료는 늘면 붉게 */
    pr.push(cel(cRes, r, (C.premBn || C.premAn) ? ('보험료 모름 ' + (C.premBn + C.premAn) + '건') : '', 18));
    out.push(row(r, pr));

    return X._sheet(out.join(''), { tab: true, freeze: [5, 4], cols: w, merge: merges, fit: true,
      filter: 'A3:' + col(cRes) + (r - 1) });
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
    return X._sheet(out.join(''), { freeze: [0, 1], cols: [7, 16, 30, 12, 11, 11, 9, 15, 8, 10] });
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
    return X._sheet(out.join(''), { freeze: [0, 1], cols: [11, 13, 36, 7, 12] });
  }

  /* ══ 내려받기 ══════════════════════════════════════════════════ */
  X.make = function (opt) {
    opt = opt || {};
    var S = g.S, STD = g.STD, C = g.calc();
    var 실명 = (S.who && S.who.name) ? String(S.who.name) : '';
    /* 가린 것이 기본 — 실명은 opt.real 일 때만 (3번) */
    var nm = opt.real ? (실명 || '고객') : (X._mask(실명) || '고객');
    var files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>' },
      { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
        '<sheet name="한눈에" sheetId="1" r:id="rId1"/>' +
        '<sheet name="계약" sheetId="2" r:id="rId2"/>' +
        '<sheet name="빠진 담보" sheetId="3" r:id="rId3"/>' +
        '</sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>' +
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>' +
        '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>' },
      { name: 'xl/styles.xml', data: X._styles(STD) },
      { name: 'xl/worksheets/sheet1.xml', data: 한눈에(S, STD, C, nm) },
      { name: 'xl/worksheets/sheet2.xml', data: 계약시트(S) },
      { name: 'xl/worksheets/sheet3.xml', data: 빠진시트(STD, C) }
    ];
    var blob = X._zip(files);
    var fn = '보장분석_전후_한눈에_' + nm + '_' + (new Date()).toISOString().slice(0, 10) + '.xlsx';
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = fn;
    /* ⚠ 누르자마자 지우면 브라우저가 <b>이름을 못 받아</b> 「download」 로
       떨어집니다. 내려받기가 시작할 틈을 주고 치웁니다. */
    document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(a.href); }, 4000);
    return { name: fn, size: blob.size, cols: cols(S) };
  };
})(window);
