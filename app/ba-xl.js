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

  /* ══ ③ 꼴(styles) — 쓰는 것만 ════════════════════════════════════
     0 기본 · 1 제목 · 2 범례 · 3 머리 · 4 머리(전) · 5 머리(후) · 6 머리(해지)
     7 머리(신규) · 8 라벨 · 9 담보이름 · 10 표준 · 11 전칸 · 12 후칸 · 13 해지칸
     14 합계전 · 15 합계후 · 16 차이+ · 17 차이- · 18 결과 · 19 합계(손)        */
  var STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts>' +
    '<fonts count="8">' +
      '<font><sz val="10"/><name val="맑은 고딕"/></font>' +                                  /* 0 */
      '<font><b/><sz val="13"/><color rgb="FF217346"/><name val="맑은 고딕"/></font>' +        /* 1 */
      '<font><sz val="9"/><color rgb="FF666666"/><name val="맑은 고딕"/></font>' +             /* 2 */
      '<font><b/><sz val="10"/><name val="맑은 고딕"/></font>' +                               /* 3 */
      '<font><b/><sz val="10"/><color rgb="FFC9283A"/><name val="맑은 고딕"/></font>' +        /* 4 해지 */
      '<font><b/><sz val="10"/><color rgb="FF0B8A3D"/><name val="맑은 고딕"/></font>' +        /* 5 늘어남 */
      '<font><sz val="9"/><color rgb="FF8A6D00"/><name val="맑은 고딕"/></font>' +             /* 6 표준 */
      '<font><b/><sz val="10"/><color rgb="FFB45309"/><name val="맑은 고딕"/></font>' +        /* 7 손 */
    '</fonts>' +
    '<fills count="10">' +
      '<fill><patternFill patternType="none"/></fill>' +
      '<fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FFF6F6F6"/><bgColor indexed="64"/></patternFill></fill>' + /* 2 라벨 */
      '<fill><patternFill patternType="solid"><fgColor rgb="FFFFFDF3"/><bgColor indexed="64"/></patternFill></fill>' + /* 3 표준 */
      '<fill><patternFill patternType="solid"><fgColor rgb="FFF7F8FA"/><bgColor indexed="64"/></patternFill></fill>' + /* 4 전 */
      '<fill><patternFill patternType="solid"><fgColor rgb="FFF2F7FF"/><bgColor indexed="64"/></patternFill></fill>' + /* 5 후 */
      '<fill><patternFill patternType="solid"><fgColor rgb="FFFDF3F3"/><bgColor indexed="64"/></patternFill></fill>' + /* 6 해지 */
      '<fill><patternFill patternType="solid"><fgColor rgb="FFEEF1F5"/><bgColor indexed="64"/></patternFill></fill>' + /* 7 합계전 */
      '<fill><patternFill patternType="solid"><fgColor rgb="FFE6F0FF"/><bgColor indexed="64"/></patternFill></fill>' + /* 8 합계후 */
      '<fill><patternFill patternType="solid"><fgColor rgb="FFF1FBF4"/><bgColor indexed="64"/></patternFill></fill>' + /* 9 신규 */
    '</fills>' +
    '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
      '<border><left style="thin"><color rgb="FFD6D6D6"/></left><right style="thin"><color rgb="FFD6D6D6"/></right>' +
      '<top style="thin"><color rgb="FFD6D6D6"/></top><bottom style="thin"><color rgb="FFD6D6D6"/></bottom><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="20">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +                                               /* 0 */
      '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +                                 /* 1 제목 */
      '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +                                 /* 2 범례 */
      '<xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' + /* 3 머리 */
      '<xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' + /* 4 머리전 */
      '<xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' + /* 5 머리후 */
      '<xf numFmtId="0" fontId="4" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' + /* 6 머리해지 */
      '<xf numFmtId="0" fontId="5" fillId="9" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' + /* 7 머리신규 */
      '<xf numFmtId="0" fontId="0" fillId="2" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' + /* 8 라벨 */
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' + /* 9 담보이름 */
      '<xf numFmtId="164" fontId="6" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>' + /* 10 표준 */
      '<xf numFmtId="164" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/>' + /* 11 전칸 */
      '<xf numFmtId="164" fontId="0" fillId="5" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/>' + /* 12 후칸 */
      '<xf numFmtId="164" fontId="4" fillId="6" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>' + /* 13 해지칸 */
      '<xf numFmtId="164" fontId="3" fillId="7" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>' + /* 14 합계전 */
      '<xf numFmtId="164" fontId="3" fillId="8" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>' + /* 15 합계후 */
      '<xf numFmtId="164" fontId="5" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>' + /* 16 차이+ */
      '<xf numFmtId="164" fontId="4" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>' + /* 17 차이- */
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' + /* 18 결과 */
      '<xf numFmtId="164" fontId="7" fillId="7" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>' + /* 19 합계(손) */
    '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

  function sheet(body, opt) {
    opt = opt || {};
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetViews><sheetView workbookViewId="0"' + (opt.tab ? ' tabSelected="1"' : '') + '>' +
      (opt.freeze ? ('<pane xSplit="' + opt.freeze[0] + '" ySplit="' + opt.freeze[1] + '" topLeftCell="' +
        col(opt.freeze[0]) + (opt.freeze[1] + 1) + '" activePane="bottomRight" state="frozen"/>') : '') +
      '</sheetView></sheetViews>' +
      (opt.cols ? ('<cols>' + opt.cols.map(function (w, i) {
        return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>') : '') +
      '<sheetData>' + body + '</sheetData>' +
      (opt.filter ? ('<autoFilter ref="' + opt.filter + '"/>') : '') +
      '</worksheet>';
  }

  g.BA_XL = { _zip: zip, _sheet: sheet, _cel: cel, _row: row, _col: col, _mask: mask, _styles: STYLES, _N: N };
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
    var cc = cols(S), B = cc.B, A = cc.A, out = [], r, i;
    var nB = B.length, nA = A.length;
    /* 칸 차례 — 0~4 라벨 · 전 nB · 전합계 · 후 nA · 후합계 · 차이 · 결과 */
    var cSumB = 5 + nB, cA0 = cSumB + 1, cSumA = cA0 + nA, cDif = cSumA + 1, cRes = cDif + 1;
    var w = [11, 13, 34, 7, 9];
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

    /* 5줄부터 — 담보 77줄 전부 */
    r = 5;
    STD.forEach(function (gp) {
      gp.rows.forEach(function (rw) {
        var k = rw.k, cells = [];
        cells.push(cel(0, r, gp.big, 8), cel(1, r, gp.mid, 8), cel(2, r, rw.n, 9),
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
    var pr = [cel(0, r, '', 8), cel(1, r, '', 8), cel(2, r, '월 보험료', 3), cel(3, r, '만원', 8), cel(4, r, '', 10)];
    B.forEach(function (x, i2) { pr.push(cel(5 + i2, r, N(x.prem), x.act === 'cancel' ? 13 : 11)); });
    pr.push(cel(cSumB, r, C.premB, 14));
    A.forEach(function (x, i2) { pr.push(cel(cA0 + i2, r, N(x.prem), 12)); });
    pr.push(cel(cSumA, r, C.premA, 15));
    var dp = C.premA - C.premB;
    pr.push(cel(cDif, r, dp, dp > 0 ? 17 : (dp < 0 ? 16 : 0)));   /* 보험료는 늘면 붉게 */
    pr.push(cel(cRes, r, (C.premBn || C.premAn) ? ('보험료 모름 ' + (C.premBn + C.premAn) + '건') : '', 18));
    out.push(row(r, pr));

    return X._sheet(out.join(''), { tab: true, freeze: [5, 4], cols: w,
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
      { name: 'xl/styles.xml', data: X._styles },
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
