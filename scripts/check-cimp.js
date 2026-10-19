/* 📁 <b>엑셀·CSV 에서 고객을 가져와 분류하는가</b> — 판 X135

   사장님 말씀 (2026-10-19) — 「<b>엑셀이나, 구글드라이브에 고객 정보를
   가져오면 분류할 수 있는 프로그램</b>을 만들었으면 좋겠어」

   ── 손대기 전 ─────────────────────────────────────────────────────
   본체(app/index.html)에는 <b>csv 라는 글자가 한 번도 없었습니다.</b> 엑셀을
   읽는 자리가 아예 없었습니다. 폰 화면(app/day.html)에 「붙여넣기」 가 하나
   있었는데, 그것은 이름과 번호 둘만 뽑아 <b>배정 DB(dbs)</b> 로 넣고 분류는
   없었습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [0] ★★ <b>넣는 자리가 하나인가</b> (5번) — clients 에 줄을 넣는 곳이
         셋이었습니다(osCreateClient · osPickClient · olToMine). 엑셀이
         <b>넷째</b>가 되면 「가린 이름으로 서버에, 실명은 이 기기에」 를 네 곳이
         따로 적습니다. cliMake 밖에 insert 가 하나도 없어야 합니다.
     [1] ★★ <b>진짜 .xlsx 를 만들어 읽는 왕복 시험</b> — zip 을 직접 열어
         머리글·세 줄·시트 이름까지 그대로 나오나. 바깥 셈틀을 안 들여왔으니
         (10번) 우리 손으로 지퍼를 열고, 그것이 정말 되는지 여기서 잽니다.
     [2] ★★ <b>EUC-KR</b> — 윈도우 엑셀의 「CSV(쉼표로 분리)」 는 UTF-8 이
         아닙니다. utf-8 로 읽으면 이름이 통째로 깨져 사장님은 「앱이
         고장났다」 고 보십니다. 깨진 글자를 보고 되읽나.
     [3] ★★ <b>주민등록번호를 안 받나</b> (사장님 규칙) — 머리글이 주민이면
         고를 수 없게 잠기나 · 미리보기에 번호가 안 찍히나 · 다른 칸에 섞여
         있으면 지워서 담나 · 서버로 나가는 글에 번호가 없나
     [4] ★ 값을 <b>지어내지 않나</b> (1번) — 못 읽은 칸은 아예 안 보내나
         (0 으로 보내면 「소득이 0원」 이 됩니다) · 생년 네 꼴을 다 읽나 ·
         <b>나이를 생년으로 고쳐 적지 않나</b>
     [5] ★★ <b>돈 단위</b> (4번) — 엑셀이 「원」 이면 만원으로 고쳐 담나.
         그냥 담으면 <b>만 배</b>입니다 — 「50만원」 이 「50억」 으로 찍힌
         그 자리입니다
     [6] ★★ <b>분류</b> — 새로 넣을 분 · 이미 계신 분(번호 같음) · 같은
         이름(번호 다름) · 파일 안 중복 · 이름 없는 줄 로 갈리나
     [7] ★★ <b>세는 자리가 하나인가</b> (5번) — 단추에 적은 수와 실제로
         들어간 줄 수가 같나. 따로 세면 「9명 넣기」 를 눌러 11명이 들어갑니다
     [8] ★★ <b>가린 이름만 서버로</b> (3번) — 실명은 이 기기(localStorage)에만
     [9] ★★ <b>명단을 못 읽었으면 넣기를 잠그나</b> (1번) — 안 읽은 것을
         「없다」 로 읽으면 같은 분이 한 줄 더 생깁니다
    [10] ★ <b>배정 DB(dbs) 로는 한 줄도 안 가나</b> — 배정 한도(일반 20 ·
         변액 +30)를 세는 자가 무너집니다 (2026-10-09 사고)
    [11] ★ 폰(390px)에서 안 새나 · 누르는 것이 44px 인가

   ★ 사장님 진짜 서버는 읽지 않습니다. 견본 이름은 홍길동 집안입니다 (3번). */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const zlib = require('zlib');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* ── 진짜 zip 을 손으로 만듭니다 — 이것이 왕복 시험의 반쪽입니다 ── */
let CRC = null;
function crc32(b) {
  if (!CRC) { CRC = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
  let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function zip(files) {
  const bufs = [], cd = []; let off = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, 'utf8'), data = Buffer.from(f.data, 'utf8');
    const comp = f.store ? data : zlib.deflateRawSync(data), crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(f.store ? 0 : 8, 8);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(name.length, 26);
    bufs.push(lh, name, comp);
    const ce = Buffer.alloc(46);
    ce.writeUInt32LE(0x02014b50, 0); ce.writeUInt16LE(20, 4); ce.writeUInt16LE(20, 6);
    ce.writeUInt16LE(f.store ? 0 : 8, 10);
    ce.writeUInt32LE(crc, 16); ce.writeUInt32LE(comp.length, 20); ce.writeUInt32LE(data.length, 24);
    ce.writeUInt16LE(name.length, 28); ce.writeUInt32LE(off, 42);
    cd.push(ce, name);
    off += lh.length + name.length + comp.length;
  }
  const cdB = Buffer.concat(cd), eo = Buffer.alloc(22);
  eo.writeUInt32LE(0x06054b50, 0);
  eo.writeUInt16LE(files.length, 8); eo.writeUInt16LE(files.length, 10);
  eo.writeUInt32LE(cdB.length, 12); eo.writeUInt32LE(off, 16);
  return Buffer.concat([...bufs, cdB, eo]);
}
/* 견본 명단 — 홍길동 집안. <b>일부러 험하게</b> 만듭니다:
     2줄 홍길동  번호 있음 · 생년 네 자리 · 소득이 「원」 으로 적힘
     3줄 홍길순  생년이 엑셀 날짜(일련번호) · 주민번호 칸에 번호
     4줄 홍말순  번호 없음 · 생년 여섯 자리
     5줄 (이름 없음) — 지역만 적혀 있음
     6줄 홍길동  2줄과 같은 번호 — 파일 안 중복
     7줄 홍판서  이미 내 고객인 분과 번호가 같음
     8줄 홍갑돌  이미 내 고객인 분과 <b>이름만</b> 같음 (번호는 다름)         */
const SS = ['고객명', '휴대폰', '생년월일', '성별', '지역', '유입경로', '월소득', '주민번호', '나이',
  '홍길동', '010-1111-2222', '남', '서울 강남', '소개', '첫 상담 전',
  '홍길순', '010-3333-4444', '여', '부산 해운대', '방송', '850312-1234567',
  '홍말순', '경기 수원', '지인', '900101',
  '서울 송파',
  '홍판서', '010-7777-8888', '소개',
  '홍갑돌', '010-9999-0000', '방송'];
const six = SS.indexOf('850312-1234567');
const ix = (v) => { const i = SS.indexOf(v); if (i < 0) throw new Error('견본에 없는 글: ' + v); return i; };
const C = (ref, v) => '<c r="' + ref + '" t="s"><v>' + ix(v) + '</v></c>';
const N = (ref, v) => '<c r="' + ref + '"><v>' + v + '</v></c>';
const SHEET1 = '<?xml version="1.0" encoding="UTF-8"?>' +
  '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' +
  '<row r="1">' + C('A1', '고객명') + C('B1', '휴대폰') + C('C1', '생년월일') + C('D1', '성별') +
    C('E1', '지역') + C('F1', '유입경로') + C('G1', '월소득') + C('H1', '주민번호') + C('I1', '나이') + '</row>' +
  /* 소득 5,000,000 — 「원」 으로 적힌 칸입니다 */
  '<row r="2">' + C('A2', '홍길동') + C('B2', '010-1111-2222') + N('C2', 1985) + C('D2', '남') +
    C('E2', '서울 강남') + C('F2', '소개') + N('G2', 5000000) + '</row>' +
  /* 31234 = 엑셀 날짜 → 1985년 */
  '<row r="3">' + C('A3', '홍길순') + C('B3', '010-3333-4444') + N('C3', 31234) + C('D3', '여') +
    C('E3', '부산 해운대') + C('F3', '방송') + '<c r="H3" t="s"><v>' + six + '</v></c>' + '</row>' +
  '<row r="4">' + C('A4', '홍말순') + C('C4', '900101') + C('E4', '경기 수원') + C('F4', '지인') + N('I4', 40) + '</row>' +
  '<row r="5">' + C('E5', '서울 송파') + '</row>' +
  '<row r="6">' + C('A6', '홍길동') + C('B6', '010-1111-2222') + C('F6', '소개') + '</row>' +
  '<row r="7">' + C('A7', '홍판서') + C('B7', '010-7777-8888') + C('F7', '소개') + '</row>' +
  '<row r="8">' + C('A8', '홍갑돌') + C('B8', '010-9999-0000') + C('F8', '방송') + '</row>' +
  '</sheetData></worksheet>';
const SHEET2 = '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>딴 시트</t></is></c></row></sheetData></worksheet>';
const WB = '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
  '<sheet name="고객명단" sheetId="1" r:id="rId1"/><sheet name="메모장" sheetId="2" r:id="rId2"/></sheets></workbook>';
const RELS = '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="worksheets/sheet2.xml"/>' +
  '<Relationship Id="rId3" Target="sharedStrings.xml"/></Relationships>';
const SST = '<?xml version="1.0" encoding="UTF-8"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="' +
  SS.length + '">' + SS.map(s => '<si><t>' + s + '</t></si>').join('') + '</sst>';
const XLSX = zip([
  { name: '[Content_Types].xml', data: '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>', store: true },
  { name: 'xl/workbook.xml', data: WB },
  { name: 'xl/_rels/workbook.xml.rels', data: RELS },
  { name: 'xl/sharedStrings.xml', data: SST },
  { name: 'xl/worksheets/sheet1.xml', data: SHEET1 },
  { name: 'xl/worksheets/sheet2.xml', data: SHEET2 }
]);
/* EUC-KR CSV — iconv 없이 만듭니다(CI 에 있으리라 믿지 않습니다).
   엑셀이 내보내는 그 꼴입니다. */
function eucKr(txt) {
  const out = [];
  for (const ch of txt) {
    const c = ch.codePointAt(0);
    if (c < 128) { out.push(c); continue; }
    const b = Buffer.from(ch, 'utf8');          /* 한글은 아래 표에서 */
    const k = EUC[ch];
    if (k) { out.push(k >> 8, k & 0xFF); continue; }
    out.push(0x3F);                              /* 못 바꾸면 ? — 그러면 자가 울립니다 */
  }
  return Buffer.from(out);
}
/* 꼭 쓰는 글자만 손으로 — EUC-KR(CP949) 코드입니다 */
const EUC = { '고': 0xB0ED, '객': 0xB0CD, '명': 0xB8ED, '연': 0xBFAC, '락': 0xB7AF, '처': 0xC3B3,
  '성': 0xBCBA, '별': 0xBAB0, '홍': 0xC8AB, '길': 0xB1E6, '동': 0xB5BF, '순': 0xBCF8, '남': 0xB3B2, '여': 0xBFA9 };
const CSVTXT = '고객명,연락처,성별\n홍길동,010-1111-2222,남\n홍길순,010-3333-4444,여\n';

(async () => {
  const src = fs.readFileSync('app/index.html', 'utf8');

  /* ══ [0] 넣는 자리가 하나인가 ══ */
  console.log('\n[0] clients 에 넣는 자리가 cliMake 하나다 (5번)');
  const mk0 = src.indexOf('function cliMake(name,ex,then){');
  const mkEnd = src.indexOf('\n/* ══ 📁 <b>엑셀·CSV');
  is(mk0 > 0 && mkEnd > mk0, 'cliMake · cliMakeMany 토막을 찾았다');
  const owner = src.slice(mk0, mkEnd);
  const outside = src.slice(0, mk0) + src.slice(mkEnd);
  const nIns = (outside.match(/from\('clients'\)\s*\.insert\(/g) || []).length;
  is(nIns === 0, 'cliMake 밖에 clients insert 가 <b>하나도 없다</b> (받음 ' + nIns + '곳)');
  is((owner.match(/from\('clients'\)\s*\.insert\(/g) || []).length >= 3,
     'cliMake 안에는 있다 — 못 받는 서버로 되돌아가는 길까지');
  is(/cmRealSet/.test(owner), '실명은 <b>이 기기에</b> 담는다 — 그 자리도 여기 하나다 (3번)');
  const cimpBlk = src.slice(src.indexOf('var CIMP={open:false'), src.indexOf('function hdbOpen(id,wantStage){'));
  is(cimpBlk.length > 2000, 'cimp 토막을 찾았다');
  is(!/\.insert\(|\.upsert\(|from\('clients'\)|from\('dbs'\)/.test(cimpBlk),
     '가져오기 안에 <b>서버에 넣는 글이 한 줄도 없다</b> — cliMakeMany 를 부르기만 한다 (5번)');
  is(!/fetch\(|XMLHttpRequest|aiRun|aiAsk|\/api\//.test(cimpBlk),
     '파일을 <b>밖으로 보내는 글이 한 줄도 없다</b> — 서버로도, AI 로도 (3번·10번)');
  is(/cregGoXls/.test(src) && /cimpOpen/.test(src), '➕ 고객 넣기 고르개에서 들어간다');

  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()));
  /* ── 가짜 서버 — 나간 글을 전부 적어 둡니다 ── */
  await p.evaluate(() => {
    window.__W = [];
    window.toast = function (m) { window.__T = m; };
    OS.session = { user: { id: 'me' } };
    OS.profile = { id: 'me', name: '홍길동', role: 'owner', active: true };
    window.osLoadClients = function () {};
    window.osAudit = function () {};
    window.cmLoadAll = function (cb) { if (cb) cb(); };
    window.hmPaint = function () {};
    /* 이미 내 고객인 두 분 — 홍판서(번호 같음) · 홍갑돌(이름만 같음) */
    OSC.loaded = true; OSC.busy = false; OSC.err = '';
    OSC.list = [{ id: 'c1', advisor_id: 'me', name_masked: '홍○서', phone: '010-7777-8888' },
                { id: 'c2', advisor_id: 'me', name_masked: '홍○돌', phone: '010-5555-6666' }];
    localStorage.setItem('apex_cli_real_me', JSON.stringify({ c1: '홍판서', c2: '홍갑돌' }));
    window.osClient = function () {
      const mk = (t) => { const st = { t: t, op: '', pay: null, sel: false }; const a = {
        insert: function (q) { st.op = 'insert'; st.pay = q; return a; },
        update: function (q) { st.op = 'update'; st.pay = q; return a; },
        upsert: function (q) { st.op = 'upsert'; st.pay = q; return a; },
        'delete': function () { st.op = 'delete'; return a; },
        select: function () { st.sel = true; return a; },
        eq: function () { return a; }, order: function () { return a; }, limit: function () { return a; },
        range: function () { return a; }, single: function () { return a; },
        then: function (o, n) {
          if (!st.op) return Promise.resolve({ data: [], error: null }).then(o, n);
          window.__W.push({ t: st.t, op: st.op, pay: st.pay });
          if (window.__COLDOWN && st.t === 'clients')
            return Promise.resolve({ data: null, error: { message: "column clients.phone does not exist" } }).then(o, n);
          if (!st.sel) return Promise.resolve({ error: null }).then(o, n);
          const rows = [].concat(st.pay || []).map((x, i) => ({ id: x.id || ('srv-' + i), name_masked: x.name_masked }));
          return Promise.resolve({ data: rows, error: null }).then(o, n);
        } }; return a; };
      return { from: (t) => mk(t), rpc: () => Promise.resolve({ data: null, error: null }) };
    };
    go('home');
  });
  await p.waitForTimeout(700);

  /* ── 파일을 브라우저 안에서 만들어 실제로 읽힙니다 ── */
  const feed = async (name, b64) => {
    await p.evaluate(({ name, b64 }) => {
      const bin = atob(b64), u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      cimpRead(new File([u], name));
    }, { name, b64 });
    await p.waitForTimeout(900);
  };

  console.log('\n[1] 진짜 .xlsx 를 열어 읽는다 (왕복 시험)');
  await p.evaluate(() => { cregOpen(); cregGoXls(); });
  await p.waitForTimeout(300);
  is(await p.evaluate(() => !!document.querySelector('#cimpSheet.on')), '가져오기 창이 열린다');
  await feed('고객명단.xlsx', XLSX.toString('base64'));
  const A = await p.evaluate(() => ({
    step: CIMP.step, err: CIMP.err, head: CIMP.head.slice(), n: CIMP.rows.length,
    sheets: CIMP.sheets.map(s => s.name), r2: (CIMP.rows[1] || []).slice(), r4: (CIMP.rows[3] || []).slice(),
    map: JSON.stringify(CIMP.map)
  }));
  is(A.step === 'map', '칸 맞추기로 넘어간다 (받음 ' + A.step + ' · ' + (A.err || '오류 없음') + ')');
  is(A.head[0] === '고객명' && A.head[7] === '주민번호', '머리글을 그대로 읽는다 — ' + A.head.join('|'));
  is(A.n === 8, '머리글 + 고객 7줄 = 8줄 (받음 ' + A.n + ')');
  is(A.sheets.join('|') === '고객명단|메모장', '시트 이름을 읽는다 — ' + A.sheets.join('|'));
  is(A.r2[0] === '홍길동' && A.r2[1] === '010-1111-2222', '첫 줄이 그대로 — ' + A.r2.slice(0, 3).join('|'));
  is(A.r4[0] === '홍말순' && A.r4[1] === '' && A.r4[2] === '900101',
     '<b>빈 칸이 자리를 지킨다</b> — ' + JSON.stringify(A.r4.slice(0, 4)) + ' (밀리면 연락처 칸에 지역이 들어옵니다)');
  await p.evaluate(() => cimpSheetPick(1));
  await p.waitForTimeout(700);
  is(await p.evaluate(() => (CIMP.rows[0] || [])[0] === '딴 시트' || !!CIMP.err),
     '시트를 바꾸면 그 시트를 읽는다');
  await p.evaluate(() => cimpSheetPick(0));
  await p.waitForTimeout(700);

  console.log('\n[2] EUC-KR CSV 를 되읽는다');
  await feed('명단.csv', eucKr(CSVTXT).toString('base64'));
  const E = await p.evaluate(() => ({ enc: CIMP.enc, h: (CIMP.head || []).join('|'),
    nm: ((CIMP.rows[1] || [])[0] || ''), step: CIMP.step, err: CIMP.err }));
  is(E.step === 'map', 'CSV 도 칸 맞추기로 간다 (' + (E.err || '오류 없음') + ')');
  is(E.enc === 'EUC-KR', 'EUC-KR 이라고 알아본다 (받음 ' + E.enc + ')');
  is(E.nm === '홍길동', '이름이 <b>안 깨진다</b> (받음 ' + E.nm + ')');
  await feed('명단-utf8.csv', Buffer.from('﻿' + CSVTXT, 'utf8').toString('base64'));
  is(await p.evaluate(() => CIMP.enc === 'UTF-8' && (CIMP.rows[1] || [])[0] === '홍길동'),
     'BOM 붙은 UTF-8 도 읽는다');

  /* 다시 엑셀로 — 아래는 모두 엑셀 견본으로 잽니다 */
  await feed('고객명단.xlsx', XLSX.toString('base64'));

  console.log('\n[3] 주민등록번호를 안 받는다');
  const R = await p.evaluate(() => {
    const H = CIMP.head, out = { lock: -1, pick: '', shown: '', payHas: false };
    for (let j = 0; j < H.length; j++) if (H[j] === '주민번호') out.lock = j;
    out.pick = CIMP.map[out.lock] === '' ? '안 가져옴' : ('?' + CIMP.map[out.lock]);
    out.locked = cimpLocked('주민번호') && cimpLocked('주민등록번호') && cimpLocked('RRN');
    out.html = document.querySelector('.cimp-box').innerHTML;
    /* ⚠ 처음에 /850312/ 로 찾다가 <b>제 도움말</b>에 적힌 보기 글자를 잡아
       헛 빨간불을 켰습니다. 재야 하는 것은 앞 여섯 자리가 아니라 <b>주민번호
       그 값</b>(뒤 일곱 자리) 입니다 — 그것이 새면 안 되는 것입니다 (8번). */
    out.shown = /850312\s*[-–]|1234567/.test(out.html) ? '번호가 찍혔다' : '안 찍힘';
    out.erase = cimpRrnOut('홍길동 850312-1234567 님') ;
    out.keepTel = cimpRrnOut('010-1111-2222');
    return out;
  });
  is(R.lock === 7, '주민번호 칸을 찾았다');
  is(R.locked, '주민·주민등록번호·RRN 을 다 잠근다');
  is(R.pick === '안 가져옴', '그 칸은 <b>안 가져옴</b>으로 고정 (받음 ' + R.pick + ')');
  is(R.shown === '안 찍힘', '미리보기에도 번호가 <b>안 찍힌다</b> (받음 ' + R.shown + ')');
  is(!/850312/.test(R.erase) && /주민번호 지움/.test(R.erase), '다른 칸에 섞여 있으면 지운다 — ' + R.erase);
  is(R.keepTel === '010-1111-2222', '전화번호는 <b>안 지운다</b> — 헛것을 안 잡는다 (8번)');

  console.log('\n[4] 값을 지어내지 않는다');
  const V = await p.evaluate(() => ({
    y4: cimpYear('1985'), ySerial: cimpYear('31234'), y6: cimpYear('900101'),
    y6old: cimpYear('850312'), yBad: cimpYear('모름'), yEmpty: cimpYear(''),
    sexM: cimpSex('남'), sexF: cimpSex('여'), sexBad: cimpSex('미정'),
    tel: cimpPhone('01011112222'), telOdd: cimpPhone('내선 1234'),
    manMan: cimpMan('500', '만원'), manWon: cimpMan('5,000,000', '원'), manBad: cimpMan('모름', '만원')
  }));
  is(V.y4 === 1985, '생년 네 자리 1985 → 1985');
  is(V.ySerial === 1985, '엑셀 날짜 31234 → 1985 (받음 ' + V.ySerial + ')');
  is(V.y6old === 1985 && V.y6 === 1990, '여섯 자리 850312 → 1985 · 900101 → 1990');
  is(V.yBad === null && V.yEmpty === null, '못 읽으면 <b>null</b> — 0 이 아니다 (1번)');
  is(V.sexM === 'M' && V.sexF === 'F' && V.sexBad === null, '성별 남→M · 여→F · 모르면 null');
  is(V.tel === '010-1111-2222', '번호를 사람이 읽는 꼴로 — ' + V.tel);
  is(V.telOdd === '내선 1234', '낯선 꼴은 <b>적힌 그대로</b> — 지어내지 않는다');
  is(V.manBad === null, '돈을 못 읽으면 null — 0 으로 안 적는다 (1번)');
  const NA = await p.evaluate(() => {
    let j = -1; for (let k = 0; k < CIMP.head.length; k++) if (CIMP.head[k] === '나이') j = k;
    return { j: j, to: CIMP.map[j] };
  });
  is(NA.j >= 0 && NA.to === 'memo+', '<b>나이는 생년으로 고쳐 적지 않는다</b> — 메모로만 (받음 ' + NA.to + ')');

  console.log('\n[5] 돈 단위 — 만 배를 안 틀린다 (4번)');
  is(V.manMan === 500 && V.manWon === 500,
     '만원 500 = 원 5,000,000 → 둘 다 500만원 (받음 ' + V.manMan + ' / ' + V.manWon + ')');
  const U = await p.evaluate(() => {
    let j = -1; for (let k = 0; k < CIMP.head.length; k++) if (CIMP.head[k] === '월소득') j = k;
    CIMP.map[j] = 'inc'; CIMP.unit = { inc: '만원' }; CIMP.sort = null;
    const a = cimpOne(CIMP.rows[1]).ex.inc;
    CIMP.unit = { inc: '원' }; CIMP.sort = null;
    const b = cimpOne(CIMP.rows[1]).ex.inc;
    return { man: a, won: b, html: (cimpMapHtml().match(/돈 칸의 단위/) || [''])[0] };
  });
  is(U.man === 5000000 && U.won === 500,
     '엑셀에 5,000,000 — 「만원」 이면 그대로, 「원」 이면 500 (받음 ' + U.man + ' / ' + U.won + ')');
  is(U.html === '돈 칸의 단위', '돈 칸이 있으면 <b>단위를 묻는다</b> — 안 물으면 만 배가 틀립니다');
  /* ★★ 묻기만 하면 모자랍니다 — 사장님은 엑셀이 원인지 만원인지 모르십니다.
     <b>고른 단위로 얼마가 되는지</b> 그 자리에 적어 눈으로 보시게 합니다 (4번). */
  const SAY = await p.evaluate(() => {
    let j = -1; for (let k = 0; k < CIMP.head.length; k++) if (CIMP.head[k] === '월소득') j = k;
    CIMP.map[j] = 'inc';
    CIMP.unit = { inc: '만원' }; const a = cimpUnitSay('inc');
    CIMP.unit = { inc: '원' };   const b = cimpUnitSay('inc');
    CIMP.unit = {};
    return { man: a.replace(/<[^>]*>/g, ''), won: b.replace(/<[^>]*>/g, '') };
  });
  is(/5,?000,?000/.test(SAY.man) && /억/.test(SAY.man),
     '「만원」 으로 읽으면 <b>억 단위로 커지는 것</b>을 그 자리에 적는다 — ' + SAY.man.slice(0, 70));
  is(/⚠/.test(SAY.man) && /원.{0,12}적혀/.test(SAY.man),
     '터무니없이 크면 <b>「원 으로 적혀 있지 않은지」</b> 묻는다 — 저 혼자 바꾸지는 않는다 (1번)');
  is(/500만원/.test(SAY.won) && !/⚠/.test(SAY.won),
     '「원」 을 고르면 <b>500만원</b> 이라고 적고 경고를 거둔다 — ' + SAY.won.slice(0, 60));

  console.log('\n[6] 분류');
  const S = await p.evaluate(() => {
    CIMP.unit = {}; CIMP.sort = null;
    const S = cimpSort(); CIMP.sort = S;
    return { ok: S.ok.map(o => o.nm), maybe: S.maybe.map(o => o.nm), dupHave: S.dupHave.map(o => o.nm),
             dupFile: S.dupFile.map(o => o.nm), noName: S.noName.length, noTel: S.noTel.map(o => o.nm),
             gl: S.gl, grp: JSON.stringify(S.grp), haveN: S.have.n, loaded: S.have.loaded };
  });
  is(S.ok.join('|') === '홍길동|홍길순|홍말순', '새로 넣을 분 셋 — ' + S.ok.join('|'));
  is(S.dupHave.join('|') === '홍판서', '번호가 같은 분은 <b>안 넣는다</b> — ' + S.dupHave.join('|'));
  is(S.maybe.join('|') === '홍갑돌', '이름만 같은 분은 <b>따로 묻는다</b> — ' + S.maybe.join('|'));
  is(S.dupFile.join('|') === '홍길동', '파일 안 중복은 앞의 한 줄만 — ' + S.dupFile.join('|'));
  is(S.noName === 1, '이름 없는 줄은 안 넣는다 (받음 ' + S.noName + ')');
  is(S.noTel.join('|') === '홍말순', '번호 없는 분은 넣되 <b>따로 적는다</b> — ' + S.noTel.join('|'));
  is(S.gl.length >= 2, '갈래로 나눈다 — ' + S.grp);

  console.log('\n[7] 세는 자리가 하나다 (5번)');
  /* ⚠⚠ 처음에는 <b>기본 판에서만</b> 단추 수와 줄 수를 견줬습니다. 그런데 기본
     판에서는 S.ok.length 와 cimpPickList().length 가 <b>어차피 같습니다</b> —
     되돌려서 단추가 S.ok.length 를 읽게 해 봤는데 <b>안 울었습니다.</b> 둘이
     갈리는 자리에서 재야 합니다: ① 갈래를 하나 끈 판 ② 「같은 이름도 넣기」 를
     켠 판. 그 둘에서 단추와 줄 수가 같아야 <b>세는 자가 하나</b>입니다 (8번). */
  const btnN = () => p.evaluate(() => {
    CIMP.step = 'sort'; CIMP.busy = ''; cimpPaint();
    const t = (document.querySelector('.cimp-b1') || {}).innerText || '';
    const m = t.match(/(\d+)명/);
    return { btn: m ? +m[1] : -1, pick: cimpPickList().length, ok: CIMP.sort.ok.length };
  });
  const C0 = await btnN();
  is(C0.btn === C0.pick, '기본 판 — 단추에 적은 수 = 넣을 줄 수 (' + C0.btn + ' = ' + C0.pick + ')');
  await p.evaluate(() => cimpGrpOff(0, true));
  const C1 = await btnN();
  is(C1.pick < C0.pick, '갈래를 끄면 넣을 줄이 줄어든다 (' + C0.pick + ' → ' + C1.pick + ')');
  is(C1.btn === C1.pick && C1.btn !== C1.ok,
     '<b>갈래를 끈 판에서도</b> 단추가 같은 수를 말한다 — 단추 ' + C1.btn +
     ' · 줄 ' + C1.pick + ' · (따로 세면 ' + C1.ok + ' 이 찍힙니다)');
  await p.evaluate(() => { cimpGrpOff(0, false); cimpMaybeSet(true); });
  const C2 = await btnN();
  is(C2.pick === C0.pick + 1, '「같은 이름도 넣기」 를 켜면 한 명 늘어난다 (' + C0.pick + ' → ' + C2.pick + ')');
  is(C2.btn === C2.pick && C2.btn !== C2.ok,
     '<b>켠 판에서도</b> 단추가 같은 수를 말한다 — 단추 ' + C2.btn +
     ' · 줄 ' + C2.pick + ' · (따로 세면 ' + C2.ok + ' 이 찍힙니다)');
  await p.evaluate(() => cimpMaybeSet(false));
  const CNT = C0;

  console.log('\n[8] 가린 이름만 서버로 · 실명은 이 기기에 (3번)');
  await p.evaluate(() => { window.__W = []; cimpGo(); });
  await p.waitForTimeout(1200);
  const G = await p.evaluate(() => {
    const W = window.__W.slice(), rows = [];
    W.forEach(w => [].concat(w.pay || []).forEach(x => rows.push(x)));
    return { tabs: W.map(w => w.t + '.' + w.op), rows: rows,
             real: JSON.parse(localStorage.getItem('apex_cli_real_me') || '{}'),
             step: CIMP.step, res: CIMP.res, html: (document.querySelector('.cimp-box') || {}).innerText || '' };
  });
  is(G.tabs.every(t => t === 'clients.insert'), '나간 글이 <b>clients insert 뿐</b>이다 — ' + G.tabs.join(' · '));
  is(G.rows.length === CNT.pick, '넣은 줄이 ' + CNT.pick + '줄이다 (받음 ' + G.rows.length + ')');
  const names = G.rows.map(r => r.name_masked || '');
  /* ⚠ 가린 꼴(홍*동 / 홍○○)은 <b>apex-cusone.js 의 cusMask 한 곳</b>이 정합니다 (5번).
     처음에 /○/ 를 박아 두었다가 실제 꼴이 홍*동 이어서 헛 빨간불이 켜졌습니다.
     재야 하는 것은 <b>실명이 아니고 가려져 있다</b> 입니다 — 꼴을 여기 또 박아
     두면 cusMask 를 고치는 날 이 자가 거짓말을 합니다 (8번).                */
  const realNm = ['홍길동', '홍길순', '홍말순'];
  is(names.length > 0 && names.every(n => n && realNm.indexOf(n) < 0 && /[*○]/.test(n)),
     '서버로는 <b>가린 이름만</b> — ' + names.join('|'));
  const real = JSON.stringify(G.rows);
  is (!/홍길동|홍길순|홍말순/.test(real), '서버로 나간 글에 <b>실명이 없다</b>');
  is(!/850312|1234567/.test(real), '서버로 나간 글에 <b>주민번호가 없다</b>');
  const rv = Object.keys(G.real).map(k => G.real[k]);
  is(rv.indexOf('홍길동') >= 0 && rv.indexOf('홍말순') >= 0,
     '실명은 <b>이 기기에</b> 담겼다 — ' + rv.join('|'));
  const noTel = G.rows.filter(r => !r.phone);
  is(noTel.length === 1, '번호 없는 분은 phone 칸을 <b>아예 안 보낸다</b> (받음 ' + noTel.length + '줄) — 빈 글자를 보내면 「없다」 가 됩니다 (1번)');
  is(G.rows.some(r => r.birth_year === 1985) && G.rows.some(r => r.birth_year === 1990),
     '생년이 그대로 담긴다 — ' + G.rows.map(r => r.birth_year).join('|'));
  is(G.step === 'done' && G.res && G.res.ok === CNT.pick, '마친 화면이 <b>몇 명 넣었는지</b> 적는다 (' + (G.res && G.res.ok) + ')');
  is(/안 넣음|안 넣었/.test(G.html), '<b>안 넣은 것도 적는다</b> — 「넣었습니다」 만 적으면 빠뜨린 줄 모르십니다');

  console.log('\n[9] 명단을 못 읽었으면 넣기를 잠근다 (1번)');
  const LK = await p.evaluate(() => {
    OSC.loaded = false; CIMP.sort = cimpSort(); CIMP.step = 'sort'; CIMP.busy = ''; cimpPaint();
    const b = document.querySelector('.cimp-b1');
    const out = { dis: !!(b && b.disabled), say: /못 읽었습니다/.test((document.querySelector('.cimp-box') || {}).innerText || '') };
    window.__W = []; cimpGo();
    out.sent = window.__W.length;
    OSC.loaded = true;
    return out;
  });
  is(LK.dis, '넣기 단추가 <b>잠긴다</b>');
  is(LK.say, '왜 잠겼는지 <b>적는다</b>');
  is(LK.sent === 0, '그래도 눌러 보면 <b>한 줄도 안 나간다</b> (받음 ' + LK.sent + '건)');

  console.log('\n[10] 배정 DB 로는 한 줄도 안 간다');
  is(!/from\('dbs'\)/.test(cimpBlk) && !/from\('dbs'\)/.test(owner),
     'cimp·cliMake 안에 dbs 가 <b>한 번도 없다</b> — 배정 한도를 세는 자가 무너집니다');

  console.log('\n[11] 폰에서 안 새고 손가락이 닿는다');
  const PH = await p.evaluate(() => {
    OSC.loaded = true; CIMP.step = 'map'; CIMP.busy = ''; CIMP.sort = null; cimpPaint();
    const box = document.querySelector('.cimp-box');
    const small = [].slice.call(document.querySelectorAll('#cimpSheet button,#cimpSheet select,#cimpSheet label'))
      .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 44; })
      .map(e => e.tagName + '.' + (e.className || '') + ' ' + Math.round(e.getBoundingClientRect().height));
    return { w: box ? Math.round(box.getBoundingClientRect().width) : 0,
             over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
             small: small };
  });
  is(PH.w > 0 && PH.w <= 390, '창이 폰 폭(390px) 안에 든다 (받음 ' + PH.w + 'px)');
  is(PH.over <= 0, '가로로 안 밀린다 (받음 ' + PH.over + 'px)');
  is(PH.small.length === 0, '누르는 것이 모두 44px 이상 (작은 것 ' + PH.small.length + '개' +
     (PH.small.length ? ': ' + PH.small.slice(0, 4).join(', ') : '') + ')');

  console.log('\n[12] 서버에 아직 없는 칸이어도 이름은 담는다');
  const CD = await p.evaluate(async () => {
    window.__COLDOWN = true; window.__W = [];
    await new Promise(r => cliMake('홍길동', { ph: '010-1234-5678' }, () => r()));
    window.__COLDOWN = false;
    return { n: window.__W.length, last: window.__W[window.__W.length - 1] };
  });
  is(CD.n >= 2, '칸이 모자라면 <b>그 칸만 빼고 다시</b> 보낸다 (받음 ' + CD.n + '번)');
  is(CD.last && CD.last.pay && !CD.last.pay.phone && CD.last.pay.name_masked,
     '마지막 글은 이름만 — 넣는 것 자체가 막히지 않는다');

  is(errs.length === 0, '조용히 터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' / ') : ''));
  await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '자리 어긋납니다') : '\n✓ 엑셀·CSV 에서 고객을 가져와 분류합니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('✗ ' + (e && e.message)); try { srv.close(); } catch (_) {} process.exit(1); });
