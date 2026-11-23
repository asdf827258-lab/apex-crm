/* ══════════════════════════════════════════════════════════════════════
   check-baxl.js — 📊 <b>보장분석 전·후 엑셀이 거짓말하지 않나</b> (판 X528)

   사장님 말씀 (2026-11-23) — 「보장분석 전후 비교자료에서, <b>엑셀 버전</b>으로
   <b>한눈에 모든 보험 모든 보장</b>이 나오도록 만들어보자」

   ★ 이 자는 <b>실제로 .xlsx 를 뽑아 다시 풀어 읽습니다</b> — 우리가 뽑은 것을
     우리가 못 읽으면 엑셀도 못 엽니다 (4-1). zip 을 손으로 읽습니다.

   ── 보는 것 ──────────────────────────────────────────────────
     [1] ★★ 엑셀이 <b>진짜 열리나</b> — zip 여덟 부품 · 시트 셋 · 꼴
     [2] ★★ 줄 축이 <b>STD 그대로</b>인가 — 담보 77줄, 두 벌 만들지 않았나 (5번)
     [3] ★★ 칸 축 — 전은 계약 전부, 후는 <b>유지·배서·신규</b>.
          <b>해지는 후에 칸이 없다</b>(후에는 없는 계약입니다)
     [4] ★★ <b>배서는 cov2</b> 를 쓰나 — autoCalc() 와 같은 규칙 (5번)
     [5] ★★ <b>모름과 0 을 가르나</b> — 안 적힌 담보는 <b>빈 칸</b>.
          「—」 같은 글자를 숫자 자리에 넣지 않았나 (1번·4-1)
     [6] ★★ 합계는 <b>calc() 그대로</b>인가 — 손으로 고치면 칸의 합과 달라도
          그 값이 나와야 합니다 (5번 — 묻는 곳은 하나)
     [7] ★★ <b>이름이 가려져</b> 나가나 — 실명 0 · 「이름 그대로」 는 한 번 더 묻나 (3번)
     [8] ★  숫자가 <b>숫자 칸</b>인가 — 글자로 적으면 엑셀이 더하지 못합니다
     [9] ★  <b>바깥 셈틀 0</b>(9번·10번) · 서버 0(7번) · 터진 곳 0

   ⚠ 사장님 진짜 서버를 한 번도 안 부릅니다 — 파일만 제 자리에서 띄웁니다.
   ⚠ <b>내려받은 파일 이름은 안 봅니다</b> — playwright 는 blob 내려받기를 늘
     「download」 라고 부릅니다(앵커에 이름을 제대로 달아도). 재어 확인했습니다.
     이름은 make() 가 돌려주는 값으로 봅니다.
   ══════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = path.join(__dirname, '..');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* ── zip 을 손으로 읽습니다 — 눌러 담지 않았으니(stored) 그대로 잘라 냅니다 ── */
function unzip(buf) {
  const out = {};
  let e = buf.length - 22;
  while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) return null;
  const n = buf.readUInt16LE(e + 10), cdOff = buf.readUInt32LE(e + 16);
  let p = cdOff;
  for (let i = 0; i < n; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) return null;
    const nmLen = buf.readUInt16LE(p + 28), exLen = buf.readUInt16LE(p + 30),
      cmLen = buf.readUInt16LE(p + 32), lo = buf.readUInt32LE(p + 42),
      size = buf.readUInt32LE(p + 24);
    const nm = buf.slice(p + 46, p + 46 + nmLen).toString('utf8');
    const lnm = buf.readUInt16LE(lo + 26), lex = buf.readUInt16LE(lo + 28);
    out[nm] = buf.slice(lo + 30 + lnm + lex, lo + 30 + lnm + lex + size).toString('utf8');
    p += 46 + nmLen + exLen + cmLen;
  }
  return out;
}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };

(async () => {
  console.log('══ 📊 보장분석 전·후 엑셀 점검 (판 X528) ══');

  /* ── [9] 소스로 먼저 — 바깥 셈틀을 안 들여왔나 ───────────────── */
  const SRC = fs.readFileSync(path.join(ROOT, 'app/ba-xl.js'), 'utf8');
  head('[9] ★ 바깥 셈틀 · 서버를 안 부르나');
  /* ⚠ <b>「주소가 있나」 로 보면 헛것입니다</b> — .xlsx 안쪽 XML 은 이름표로
     schemas.openxmlformats.org 를 <b>글자 그대로</b> 적게 돼 있습니다. 그건
     네트워크로 가는 주소가 아닙니다. 처음에 그걸 빨간불로 켰습니다.
     그래서 <b>정말 부르는 자리</b>만 봅니다 — fetch · XHR · script · importScripts. */
  const 알맹이 = SRC.replace(/\/\*[\s\S]*?\*\//g, '');
  is(!/\bfetch\s*\(|XMLHttpRequest|importScripts|createElement\(['"]script|\.src\s*=\s*['"]https?:/.test(알맹이),
    '  ba-xl.js 가 바깥을 <b>부르는 자리가 없다</b> — zip 을 손으로 씁니다 (9번·10번)');
  is(!/https?:\/\/(?!schemas\.)/.test(알맹이),
    '  적힌 주소는 엑셀 XML 이름표(schemas.*)뿐이다');
  is(!/JSZip|SheetJS|XLSX\./.test(SRC), '  바깥 엑셀 셈틀을 안 부른다');

  const 바깥 = [], 터짐 = [];
  const srv = http.createServer((rq, rs) => {
    const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
    rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
    fs.createReadStream(f).pipe(rs);
  });
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + P) >= 0) return r.continue();
    바깥.push(u.split('/')[2]); return r.abort();
  });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => 터짐.push(String(e.message).slice(0, 90)));
  await pg.goto('http://127.0.0.1:' + P + '/app/ba.html', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForTimeout(2300);

  /* ── 견본 자료 — 홍길동 (3번). 배서·해지·신규를 모두 한 번씩 ── */
  const seeded = await pg.evaluate(() => {
    const mk = (co, nm, prem, act, cov, cov2) => ({ id: 'p' + Math.random().toString(36).slice(2, 7),
      co: co, nm: nm, term: '100세', start: '2015-03-02', years: '20', rnw: 'no',
      premMan: prem, premMan2: '', act: act, kb: false, cov: cov || {}, cov2: cov2 || {} });
    S.who = { name: '홍길동', age: '48', sex: 'm', retire: '60', life: '85', incMan: '', expMan: '' };
    S.before = [
      mk('삼성화재', '종합보험 7.0', '12.4', 'keep', { silD: '5000', cancer: '3000' }),
      mk('현대해상', '굿앤굿스타', '8.1', 'endo', { cancer: '1000', cancerH: '2000' },
                                                  { cancer: '2000', cancerH: '2000' }),
      mk('DB손해보험', '참좋은보험', '6.7', 'cancel', { cancer: '1000' })];
    S.after = [mk('KB손해보험', 'KB 3대진단', '5.2', 'new', { cancerR: '2000' })];
    S.before[1].premMan2 = '9.4';
    /* ★ 손으로 고친 값 하나 — 합계가 칸의 합과 <b>달라야</b> 합니다 */
    S.man = { b: { cancer: '9999' }, a: {} };
    save();
    const C = calc();
    let n = 0; STD.forEach(g => n += g.rows.length);
    return { std: n, grp: STD.length, 색: STD.map(g => g.c),
      전cancer: C.b.cancer, 후cancer: C.a.cancer, premB: C.premB, premA: C.premA };
  });

  const dl = pg.waitForEvent('download', { timeout: 30000 });
  const made = await pg.evaluate(() => BA_XL.make({ real: false }));
  const d = await dl;
  const tmp = path.join(require('os').tmpdir(), 'baxl-' + Date.now() + '.xlsx');
  await d.saveAs(tmp);
  const Z = unzip(fs.readFileSync(tmp));
  try { fs.unlinkSync(tmp); } catch (e) {}

  head('[1] ★★ 엑셀이 <b>진짜 열리나</b>');
  is(!!Z, '  zip 으로 풀린다');
  const must = ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels',
    'xl/styles.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml', 'xl/worksheets/sheet3.xml'];
  const 없 = must.filter(n => !Z || !Z[n]);
  is(없.length === 0, '  부품 여덟이 다 있다' + (없.length ? (' ← 없음: ' + 없.join(' ')) : ''));
  const s1 = (Z && Z['xl/worksheets/sheet1.xml']) || '';
  is(/<sheet name="한눈에"/.test(Z['xl/workbook.xml'] || '') &&
     /<sheet name="계약"/.test(Z['xl/workbook.xml'] || '') &&
     /<sheet name="빠진 담보"/.test(Z['xl/workbook.xml'] || ''), '  시트 이름 셋 — 한눈에 · 계약 · 빠진 담보');
  is(/<pane xSplit="4" ySplit="5"/.test(s1), '  왼쪽 네 칸 · 머리 다섯 줄이 <b>틀 고정</b>이다');
  is(/<sheet name="과부족"/.test(Z['xl/workbook.xml'] || '') && /<sheet name="그래프"/.test(Z['xl/workbook.xml'] || ''),
    '  시트에 <b>과부족 · 그래프</b> 가 있다 (사장님 자료 31쪽)');
  const 시트수 = ((Z['xl/workbook.xml'] || '').match(/<sheet /g) || []).length;
  is(시트수 === 5 + seeded.grp,
    '  시트 <b>' + 시트수 + '장</b> = 한눈에·계약·과부족·그래프·빠진 담보 + <b>묶음마다 한 장</b> ' + seeded.grp);

  head('[2] ★★ 줄 축이 <b>STD 그대로</b>인가 (두 벌 만들지 않았나 · 5번)');
  const rows = (s1.match(/<row r="(\d+)"/g) || []).length;
  is(seeded.std === 77, '  ba.html 의 STD 담보 <b>' + seeded.std + '줄</b>');
  is(rows === seeded.std + 6,
    '  시트1 줄 <b>' + rows + '</b> = 제목·범례 2 + 머리 3 + 담보 ' + seeded.std + ' + 보험료 1');
  is(!/var\s+STD\s*=/.test(SRC), '  ba-xl.js 가 담보 목록을 <b>다시 적지 않았다</b>');

  const txt = (s1.match(/<t xml:space="preserve">([^<]*)<\/t>/g) || [])
    .map(x => x.replace(/<[^>]+>/g, ''));
  head('[3] ★★ 칸 축 — 전은 전부, 후는 유지·배서·신규 (<b>해지는 후에 없다</b>)');
  /* 머리는 사장님 자료처럼 「(1) 회사 / 상품 / 납입·만기·보험료·처리」 석 줄입니다.
     전·후는 칸 자리로 가릅니다 — 전 합계(E) 다음이 전, 후 합계 다음이 후. */
  const 회사줄 = txt.filter(t => /^\(\d+\) /.test(t));
  const 전칸 = 회사줄.slice(0, 3), 후칸 = 회사줄.slice(3);
  is(전칸.length === 3, '  전 칸 <b>' + 전칸.length + '개</b> — ' + 전칸.join(' · '));
  is(후칸.length === 3, '  후 칸 <b>' + 후칸.length + '개</b> — ' + 후칸.join(' · '));
  is(전칸.some(t => t.indexOf('DB손해보험') >= 0), '  해지 계약도 <b>전</b>에는 선다 (사라진 것이 보이게)');
  is(!후칸.some(t => t.indexOf('DB손해보험') >= 0), '  해지 계약은 <b>후</b>에 칸이 없다');
  is(txt.some(t => /20납 \/ 100세/.test(t)), '  머리에 <b>납입 / 만기</b> 가 적힌다 (사장님 자료 꼴)');
  is(txt.some(t => t.indexOf('해지') >= 0), '  머리에 「해지」 가 적힌다');
  is(txt.some(t => t.indexOf('배서') >= 0), '  머리에 「배서」 가 적힌다');

  head('[4] ★★ <b>배서는 cov2</b> 를 쓰나 (autoCalc 와 같은 규칙 · 5번)');
  is(/\.cov2/.test(SRC) && /act === 'endo'/.test(SRC), '  소스가 배서일 때 cov2 를 고른다');
  /* 후 일반암 = 삼성(유지 → cov 3,000) + 현대(배서 → <b>cov2</b> 2,000)
     + DB(해지 → 0) + KB(신규, 일반암 없음 → 0) = <b>5,000</b>.
     ⚠ 처음에 2,000+2,000 이라고 적었다가 빨간불이 났습니다 — 앱이 아니라
       <b>제 셈이 틀렸습니다</b>(유지분 3,000 을 빼먹었습니다). 배서 전 값은
       1,000 이니, 5,000 이 나왔다는 것 자체가 cov2 를 썼다는 증거입니다. */
  /* ★★ <b>엑셀 칸을 직접 봅니다</b> — calc() 만 보면 소스를 되돌려도 안 웁니다.
     칸 차례는 F,G,H(전 셋) · I(전 합계) · J,K,L(후 셋) · M(후 합계) 이고
     현대해상은 양쪽 모두 가운데이므로 <b>전 G · 후 K</b> 입니다.
     배서 전 1,000 → 배서 후 2,000 이니, K 가 1,000 이면 cov 를 쓴 것입니다. */
  const 일반암줄 = (function () {
    const rs = s1.split('<row ');
    for (let i = 0; i < rs.length; i++) if (rs[i].indexOf('일반암') >= 0) return rs[i];
    return '';
  })();
  const 칸값 = (L) => { const m = 일반암줄.match(new RegExp('<c r="' + L + '\\d+"[^>]*><v>([-0-9.]+)</v>')); return m ? +m[1] : null; };
  is(칸값('G') === 1000, '  엑셀 <b>전</b> 현대해상 칸 = ' + 칸값('G') + ' (배서 전 값)');
  is(칸값('K') === 2000, '  엑셀 <b>후</b> 현대해상 칸 = ' + 칸값('K') + ' — <b>cov2</b> 를 썼다 (cov 였다면 1,000)');
  is(seeded.후cancer === 3000 + 2000,
    '  후 일반암 <b>' + seeded.후cancer + '</b> = 유지 3,000 + 배서본 2,000 ' +
    '(배서 <b>전</b> 값 1,000 이 아니다 · 해지분도 안 들어왔다)');

  head('[2-2] ★★ <b>부위마다 제 색으로 갈라지나</b> (사장님 말씀 「색 별로 따로 나누고, 글씨 크기 부위 전부 나눠」)');
  /* 사장님 자료(KB 제안서 6쪽)처럼 <b>왼쪽 묶음 칸을 세로로 합칩니다</b> —
     띠를 한 줄 세우는 대신 A칸을 묶음만큼 합쳐 색을 칠합니다. */
  const 세로합 = (s1.match(/<mergeCell ref="A\d+:A\d+"/g) || []).length;
  is(세로합 >= seeded.grp, '  왼쪽 묶음 칸을 <b>세로로 ' + 세로합 + '번</b> 합쳤다 — 부위 ' + seeded.grp + '개');
  const ST = (Z && Z['xl/styles.xml']) || '';
  const 색수 = new Set((seeded.색 || []).map(c => c.replace('#', '').toUpperCase())).size;
  const 쓴색 = (seeded.색 || []).filter(c => ST.indexOf('FF' + c.replace('#', '').toUpperCase()) >= 0).length;
  is(쓴색 === (seeded.색 || []).length,
    '  STD 가 들고 있는 <b>그 색 그대로</b> 칠한다 — ' + 쓴색 + '/' + (seeded.색 || []).length +
    '개 (화면과 두 벌이 아니다 · 5번, 서로 다른 색 ' + 색수 + '가지)');
  const 크기 = [...new Set((ST.match(/<sz val="([0-9.]+)"/g) || []).map(x => x.replace(/\D*([0-9.]+).*/, '$1')))];
  is(크기.length >= 4, '  글자 크기가 <b>층</b>이다 — ' + 크기.sort((a, b) => b - a).join(' · ') + 'pt');
  is(/<mergeCell ref="A\d+:[A-Z]+\d+"/.test(s1), '  띠 한 줄만 합쳐 글자가 안 잘린다');
  /* ⚠ <b>머리 줄 합치기까지 잡으면 헛것입니다</b> — 머리(3~5줄)는 사장님 자료처럼
     세로로 합쳐야 「묶음 / 담보 / 단위」 가 가운데 섭니다. 보는 것은 <b>담보 줄</b>
     (6줄부터)이고, 거기서 합쳐도 되는 것은 <b>왼쪽 묶음 칸(A)</b> 하나뿐입니다. */
  const 담보합 = (s1.match(/<mergeCell ref="([A-Z]+)(\d+):/g) || [])
    .map(x => x.replace('<mergeCell ref="', '').replace(':', ''))
    .filter(x => +x.replace(/\D/g, '') >= 6 && x.replace(/\d/g, '') !== 'A');
  is(담보합.length === 0, '  담보 줄에서 합친 것은 <b>왼쪽 묶음 칸뿐</b>이다' +
    (담보합.length ? (' ← ' + 담보합.slice(0, 4).join(' ')) : '') + ' — 다른 칸을 합치면 거르기·정렬이 막힙니다 (4-1)');

  head('[2-4] ★★ <b>뒤에 그래프</b> · <b>담보별 분리자료</b> (사장님 말씀 2026-11-23)');
  is(!!(Z['xl/charts/chart1.xml'] && Z['xl/drawings/drawing1.xml'] &&
        Z['xl/drawings/_rels/drawing1.xml.rels']), '  거미줄 그림 부품 셋이 다 들어 있다');
  const CH = Z['xl/charts/chart1.xml'] || '';
  is(/<c:radarChart>/.test(CH), '  <b>거미줄(radar)</b> 그림이다 — 사장님 자료 31쪽 꼴');
  is((CH.match(/<c:ser>/g) || []).length === 2, '  줄이 둘 — <b>권장</b>과 <b>가입(후)</b> 을 겹쳐 그린다');
  is(/'그래프'!\$[CD]\$/.test(CH) && !/<c:numLit>/.test(CH),
    '  그림이 <b>시트 칸을 가리킨다</b> — 숫자를 그림 안에 또 적지 않았다 (5번)');
  const 묶음시트 = ((Z['xl/workbook.xml'] || '').match(/<sheet /g) || []).length - 5;
  is(묶음시트 === seeded.grp, '  <b>담보별 분리자료</b> — 묶음마다 한 장 ' + 묶음시트 + '장');
  const 어느 = (function () { for (const k in Z) if (/sheet(6|7)\.xml$/.test(k)) return Z[k]; return ''; })();
  is(/충분|부족|미가입/.test(어느), '  분리자료에 <b>충분 · 부족 · 미가입</b> 이 적힌다');
  const BA2 = fs.readFileSync(path.join(ROOT, 'app/ba-xl.js'), 'utf8');
  is(/g\.gapState/.test(BA2) && !/function gapState/.test(BA2),
    '  과부족은 <b>앱의 gapState</b> 가 낸다 — 엑셀에서 다시 셈하지 않는다 (5번)');

  head('[2-3] ★ 숫자 꼴 · 인쇄');
  is(/numFmtId="165" formatCode="#,##0\.##"/.test(ST),
    '  보험료는 <b>소수점이 보이는 꼴</b>이다 — 164 만 두니 12.4만이 <b>12</b> 로 찍혔습니다');
  const 끝줄 = s1.split('<row ').pop();
  is(/<v>12\.4<\/v>/.test(끝줄) && /<v>27\.2<\/v>/.test(끝줄),
    '  보험료 줄에 12.4 · 전 합계 27.2 가 그대로 들어간다');
  is(/fitToWidth="1"/.test(s1) && /orientation="landscape"/.test(s1),
    '  인쇄는 <b>가로 한 장 폭</b>에 맞춘다 (안 맞추면 열두 장으로 쪼개집니다)');

  head('[5] ★★ <b>모름과 0 을 가르나</b> (1번 · 4-1)');
  is(!/<v>—<\/v>|>—</.test(s1), '  「—」 같은 글자를 <b>숫자 자리에 안 넣는다</b>');
  const 결과칸 = txt.filter(t => t === '빠짐').length;
  is(결과칸 > 0, '  안 적힌 담보는 결과 칸에 「빠짐」 으로만 적고 금액은 <b>빈 칸</b> (' + 결과칸 + '줄)');
  is(txt.some(t => /빈 칸\s*=\s*안 적힘\(모름\)/.test(t) && /0 은 정말 0/.test(t)),
    '  범례가 <b>빈 칸 = 안 적힘(모름), 0 은 정말 0 일 때만</b> 이라고 적는다');

  head('[6] ★★ 합계는 <b>calc() 그대로</b>인가 (5번)');
  is(seeded.전cancer === 9999, '  손으로 고친 값이 calc 에 들어 있다 (전 일반암 ' + seeded.전cancer + ')');
  is(s1.indexOf('<v>9999</v>') >= 0, '  엑셀 합계 칸에 <b>9999</b> 가 그대로 — 칸의 합(4,000)이 아니다');
  is(/합계가 칸의 합과 다르면/.test(s1), '  범례가 그 까닭을 적는다 — 손으로 고치신 것');

  head('[7] ★★ <b>이름이 가려져</b> 나가나 (3번)');
  const 온통 = Object.keys(Z || {}).map(k => Z[k]).join('');
  is(온통.indexOf('홍길동') < 0, '  엑셀 어디에도 <b>실명이 없다</b>');
  is(온통.indexOf('홍○○') >= 0, '  가린 이름(홍○○)으로 적힌다');
  is((made.name || '').indexOf('홍○○') >= 0 && (made.name || '').indexOf('홍길동') < 0,
    '  파일 이름도 가린다 — ' + made.name);
  const BA = fs.readFileSync(path.join(ROOT, 'app/ba.html'), 'utf8');
  is(/baXlGo\(1\)/.test(BA) && /confirm\(/.test(BA.slice(BA.indexOf('function baXlGo'), BA.indexOf('function baXlGo') + 600)),
    '  「이름 그대로」 는 <b>한 번 더 묻는다</b>');

  head('[8] ★ 숫자가 <b>숫자 칸</b>인가 (엑셀이 더할 수 있게)');
  const nums = (s1.match(/<v>/g) || []).length;
  is(nums >= 40, '  숫자 칸 <b>' + nums + '개</b>');
  is(!/<is><t[^>]*>[0-9,]+<\/t>/.test(s1), '  금액을 <b>글자로 적지 않았다</b>');

  head('[9] 이어서 — 조용한가');
  is(터짐.length === 0, '  터진 곳 <b>' + 터짐.length + '가지</b>' + (터짐.length ? (' ← ' + 터짐[0]) : ''));
  /* ⚠ <b>「바깥 0」 은 헛것이었습니다</b> — ba.html 은 전부터 글꼴(Gmarket·Pretendard)을
     jsdelivr 에서 받습니다. main 에서도 그렇습니다. 글꼴까지 빨간불로 치면 사람이
     점검을 안 믿게 됩니다(8번). 보는 것은 <b>고객 자료가 나가는 곳</b>입니다 —
     사장님 서버(supabase · netlify 함수 · /api)로 한 번도 안 가야 합니다 (7번·9번). */
  const 밖 = [...new Set(바깥)];
  const 자료 = 밖.filter(h => /supabase|netlify|api/i.test(h));
  is(자료.length === 0, '  고객 자료가 나가려 한 곳 <b>' + 자료.length + '군데</b>' +
    (자료.length ? (' ← ' + 자료.join(' ')) : ''));
  is(true, '  (막은 바깥 ' + 밖.length + '군데 — ' + (밖.join(' · ') || '없음') + ' · 글꼴입니다)');

  /* ══ 🖨 판 X530 — 사장님 말씀 「<b>엑셀로 디자인 짜</b>」 ════════════
     도해가 따로 선 문서에만 있으면 사장님은 둘을 들고 다니셔야 합니다.
     같은 도해가 <b>엑셀 안</b>에 들어갔는지, 그리고 엑셀 도형이
     <b>제 테두리 안에</b> 서는지 잽니다. 사진이 아니라 도형이어야 합니다 (9번). */
  head('[9] ★★ 도해가 <b>엑셀 안</b>에 들어갔나 (사장님 말씀 「엑셀로 디자인 짜」)');
  const 그림판들 = Object.keys(Z).filter(k => /^xl\/drawings\/drawing\d+\.xml$/.test(k));
  is(그림판들.length === 12, '  그림판이 <b>12장</b> — 거미줄 1 + 묶음 도해 11 (' + 그림판들.length + ')');
  const 도형수 = 그림판들.reduce((a2, k) => a2 + (Z[k].match(/<xdr:sp /g) || []).length, 0);
  is(도형수 >= 250, '  엑셀 <b>도형</b>이 ' + 도형수 + '개 — 사진이 아니라 선입니다 (9번)');
  is(!Object.keys(Z).some(k => /^xl\/media\//.test(k)),
    '  <b>그림 파일(png·jpg)이 하나도 없다</b> — 래스터는 인쇄에서 뭉개집니다 (9번)');
  /* 뇌 그림판에 그 묶음의 말이 들어 있나 — 엉뚱한 도해가 붙지 않았나 */
  const 뇌판 = 그림판들.map(k => Z[k]).filter(x => /뇌혈관질환/.test(x) && /뇌졸중/.test(x));
  is(뇌판.length === 1, '  「뇌」 도해가 <b>그 시트에만</b> 한 벌 (' + 뇌판.length + ')');
  is(그림판들.every(k => /<xdr:grpSp>/.test(Z[k]) || /graphicFrame/.test(Z[k])),
    '  그림판마다 <b>한 묶음</b>으로 들어갔다 — 흩어지면 엑셀에서 따로 움직입니다');
  /* ★★ 도형이 제 테두리 밖으로 나가지 않았나 — SVG 의 getBBox 와 같은 자리를 엑셀에서도 봅니다 */
  let 넘친것 = [];
  그림판들.forEach(k => {
    const g2 = Z[k].match(/<a:chExt cx="(\d+)" cy="(\d+)"\/>/);
    if (!g2) return;
    const CX = +g2[1], CY = +g2[2];
    const re = /<a:off x="(-?\d+)" y="(-?\d+)"\/><a:ext cx="(\d+)" cy="(\d+)"\/>/g;
    let m2, 처음 = true;
    while ((m2 = re.exec(Z[k]))) {
      if (처음) { 처음 = false; continue; }                 /* 첫 줄은 묶음 자신 */
      const x2 = +m2[1], y2 = +m2[2], w2 = +m2[3], h2 = +m2[4];
      if (x2 < -5000 || y2 < -5000 || x2 + w2 > CX + 5000 || y2 + h2 > CY + 5000)
        넘친것.push(k.replace('xl/drawings/', '') + ' 가로 ' + x2 + '+' + w2 + '/' + CX +
          ' · 세로 ' + y2 + '+' + h2 + '/' + CY);
    }
  });
  if (넘친것.length) 넘친것.slice(0, 6).forEach(x => console.log('      · ' + x));
  is(넘친것.length === 0, '  ★★ 도형이 <b>제 테두리 밖으로 안 나갔다</b> (' + 넘친것.length + '개)');
  /* 묶음 시트가 제 그림판을 가리키나 */
  const 이음 = Object.keys(Z).filter(k => /^xl\/worksheets\/_rels\/sheet\d+\.xml\.rels$/.test(k));
  is(이음.length === 12, '  시트 → 그림판 이음이 <b>12줄</b> (' + 이음.length + ')');
  is(이음.every(k => /relationships\/drawing/.test(Z[k])), '  이음이 모두 <b>그림판</b>을 가리킨다');
  const 타입 = Z['[Content_Types].xml'] || '';
  is((타입.match(/drawings\/drawing\d+\.xml/g) || []).length === 12,
    '  Content_Types 에 그림판 <b>12장</b>이 적혔다 — 빠지면 엑셀이 안 엽니다');

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데 — 엑셀이 화면과 다른 말을 합니다')
    : '✓ 엑셀 한 장에 모든 보험 · 모든 보장이 거짓 없이 들어갑니다 (판 X528)');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('터짐: ' + e.message); process.exit(2); });
