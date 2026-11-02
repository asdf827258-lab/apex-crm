/* 🎨 <b>덮개로 열리는 화면의 색이 본체와 같은가</b> — 판 X294

   사장님 말씀 (2026-11-02) — 「덮개 화면은 뭔데」 → 「응 <b>색 맞춰줘</b>」.

   ── 무엇이 문제였나 ────────────────────────────────────────────────
   메뉴 열둘은 누르면 <b>앱이 통째로 숨고</b> 그 화면이 창을 덮습니다(덮개).
   본체의 목업 옷은 <code>#dynPane</code> 에 붙는데, 덮개가 서면 그 칸이 앱과
   함께 숨으므로 <b>옷이 닿지 않습니다</b>. 그래서 열두 파일이 저마다 색을
   <b>손으로 박아</b> 두었습니다.

   ★★ 재어 보니 <b>여섯은 우연히 값이 같았고 넷이 달랐습니다.</b>
       (쪽 바탕 / 글자색 · 2026-11-02 손대기 전)
         📊 재무설계 계산기   249,250,251 / 13,17,23
         🗄️ DB 통합 CRM     247,248,250 / 51,61,75
         🤖 APEX 자비스 모드  투명        / 14,26,48
         🚗 자동차사고 과실    237,240,244 / 19,26,35
       같은 값을 손으로 박아 둔 여섯도 <b>언제든 어긋날 수 있습니다</b> —
       아무도 안 재고 있었기 때문입니다 (CLAUDE.md 0-1번).

   ── 어떻게 고쳤나 ──────────────────────────────────────────────────
   파일의 <b>제 토큰 이름은 그대로 두고 값만</b> 공용 토큰(app/ui.css)을
   가리키게 했습니다 — <code>--text:var(--t-ink)</code> 꼴입니다. 그러면
   다음에 토큰 하나를 고치면 열둘이 같이 따라옵니다 (CLAUDE.md 5번).
   ui.css 의 선택자는 전부 <code>.t-</code> 접두사(밖은 .cqa-hi·.cm-nx* 뿐이고
   덮개 파일에 그 이름이 하나도 없습니다)라 <b>모양은 안 바뀝니다</b>.

   ── 여기서 재는 것 ────────────────────────────────────────────────
     [1] ★★ <b>찍히는 색</b>을 브라우저로 재서 본체와 견준다 (글로 안 찾습니다)
     [2] ★  파일이 공용 토큰을 <b>부르고 또 쓰나</b> — 값을 다시 박지 않았나
     [3] ★  토큰 값이 한 곳(ui.css)에만 있나 · 덮개 목록을 따로 세지 않나 (5번)

   ⚠ <b>빼 둔 둘은 까닭을 적어 둡니다</b> (CLAUDE.md 1번 · 8번) —
     · 📋 보장분석 상담자료 — <b>슬라이드 덱</b>입니다. 바탕이 --dark 이고
       (어두운 테마에 「밝은 테마 마감」 을 덧입힌 것) 슬라이드가 그 위에
       섭니다. 회색 바탕을 넣으면 슬라이드 뒤가 회색이 됩니다.
     · 💯 한장 보험료 비교 — <b>바깥 사이트</b>(apex-hb-onecompare.netlify.app)
       라 우리 파일이 아닙니다. 색을 못 바꿉니다.
     · 🤖 APEX 자비스 모드의 <b>쪽 바탕은 투명</b>이 맞습니다 — 본체 안에
       물려 본체 바탕을 그대로 받습니다. 글자·선만 봅니다.
     · 지도 바탕(--bg1·--bg2) · 길·자전거길·섬 같은 <b>도해 색은 안 봅니다</b> —
       그림을 그림답게 하는 색이라 맞추면 오히려 틀립니다.

   ⚠ <b>덮개 목록은 lib-fullscr.js 한 곳에 묻습니다</b> — 여기 베끼면
     덮개를 하나 만들 때 이 자만 낡습니다 (5번).

   ⚠ <b>되돌림 ③ 이 알려 준 것</b> — ui.css 를 못 받으면 var(--t-ink) 가 비어
     글자가 <b>검정(0,0,0)</b> 으로 떨어집니다. 읽히긴 하지만 색이 틀립니다.
     그래서 「ui.css 를 부르나」 를 [2] 에서 따로 봅니다. 값을 fallback 으로
     한 번 더 적지는 않습니다 — 적으면 토큰이 두 벌이 됩니다 (5번).

   ★ 되돌림 넷이 다 웁니다 — ① DB CRM 의 --bg·--text ② 계산기의 --ink-9·--ink-1
     ③ 자비스 모드가 ui.css 를 안 부르게 ④ 자동차사고의 --ground·--ink.

   ★ 바깥으로 한 글자도 안 나갑니다.                                    */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8974;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css;charset=utf-8', '.json': 'application/json;charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f)) { const g = path.join(ROOT, 'app', p); if (fs.existsSync(g)) f = g; }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});

const APP = fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8');
const UI = fs.readFileSync(path.join(ROOT, 'app', 'ui.css'), 'utf8');

/* 덮개 이름은 <b>한 곳</b>에 묻습니다 (5번) */
const { 덮개이름, 적어도 } = require('./lib-fullscr.js');

/* 덮개 → 띄우는 파일. go() 가 주소를 *_URL 상수에 두므로 그 표를 읽습니다. */
const URLS = {};
for (const m of APP.matchAll(/var ([A-Z_0-9]*URL)\s*=\s*'([^']*)'/g)) URLS[m[1]] = m[2];
const 짝 = {
  finance: 'FIN_URL', crm: 'CRM_URL', apexmap: 'APEXMAP_URL', onecmp: 'ONECMP_URL',
  mikki: 'MIKKI_URL', car_fault: 'CARFAULT_URL', mikki_talk: 'MKTALK_URL',
  sangdam: 'SANGDAM_URL', educal: 'EDUCAL_URL', pdel: 'PDEL_URL',
  bohum: 'BOHUM_URL', frmake: 'BA_URL',
};
/* 메뉴에 적힌 한국말 이름 */
const 이름표 = {};
for (const m of APP.matchAll(/id:'([a-z_0-9]+)'[^}]{0,140}?icon:'([^']*)',title:'([^']+)'/g))
  이름표[m[1]] = m[2] + ' ' + m[3];

/* 빼 두는 자리 — 까닭을 코드에 적어 둡니다 (8번) */
const 바탕빼기 = {
  sangdam: '슬라이드 덱 — 바탕이 --dark 이고 슬라이드가 그 위에 섭니다',
  apexmap: '본체 안에 물려 본체 바탕을 그대로 받습니다 (투명이 맞습니다)',
};
const 바깥 = { onecmp: '바깥 사이트라 우리 파일이 아닙니다' };

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch({ args: ['--no-sandbox'] });

  head('[0] 덮개 목록을 <b>한 곳</b>에 묻는다 (5번)');
  const 덮개 = 덮개이름(APP);
  is(덮개.length >= 적어도, '  lib-fullscr 이 덮개 <b>' + 덮개.length + '개</b>를 찾았다 (적어도 ' + 적어도 + ')');
  const 모르는 = 덮개.filter(t => !짝[t]);
  is(모르는.length === 0, '  열둘이 다 <b>어느 파일을 띄우는지</b> 안다' +
     (모르는.length ? ' ⚠ 모르는 것: ' + 모르는.join(', ') + ' — 이 자에 짝을 적어 주십시오' : ''));

  /* 색을 재는 틀 — 쪽 바탕 · 글자색 */
  const 재기 = async (u) => {
    const pg = await br.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await pg.goto('http://127.0.0.1:' + PORT + u, { waitUntil: 'domcontentloaded', timeout: 40000 });
      await pg.waitForTimeout(2200);
      const r = await pg.evaluate(() => {
        const cs = getComputedStyle(document.body);
        return { bg: cs.backgroundColor, fg: cs.color,
                 ui: [...document.styleSheets].some(s => (s.href || '').includes('ui.css')),
                 tok: getComputedStyle(document.documentElement).getPropertyValue('--t-ink').trim() };
      });
      await pg.close();
      return r;
    } catch (e) { await pg.close().catch(() => {}); return { bg: '못 열었습니다', fg: '', ui: false, tok: '' }; }
  };

  head('[1] ★★ <b>찍히는 색</b>이 본체와 같은가 — 브라우저로 잽니다');
  const 기준 = await 재기('/app/index.html');
  is(/^rgb/.test(기준.bg) && /^rgb/.test(기준.fg),
     '  본체(기준) — 쪽 바탕 <b>' + 기준.bg + '</b> · 글자 <b>' + 기준.fg + '</b>');
  is(기준.tok.toUpperCase() === '#191F28',
     '  기준 토큰 --t-ink 가 <b>' + (기준.tok || '(못 읽음)') + '</b> 다 (ui.css 한 곳에서)');

  const 어긋 = [];
  const 본 = [];
  for (const t of 덮개) {
    const key = 짝[t]; if (!key) continue;
    const u = URLS[key] || '';
    if (바깥[t] || /^https?:/.test(u)) { 본.push([t, '(바깥)', '(바깥)', false]); continue; }
    const 길 = u.startsWith('/') ? u : '/app/' + u;
    const r = await 재기(길);
    본.push([t, r.bg, r.fg, r.ui]);
    const 이름 = 이름표[t] || t;
    if (r.fg !== 기준.fg) 어긋.push(이름 + ' 글자 ' + r.fg + ' (기준 ' + 기준.fg + ')');
    if (!바탕빼기[t] && r.bg !== 기준.bg) 어긋.push(이름 + ' 쪽 바탕 ' + r.bg + ' (기준 ' + 기준.bg + ')');
  }
  for (const [t, bg, fg, ui] of 본)
    console.log('      ' + (이름표[t] || t).padEnd(24) + '바탕 ' + String(bg).padEnd(19) +
                '글자 ' + String(fg).padEnd(19) + 'ui.css ' + (ui ? '✓' : '·') +
                (바탕빼기[t] ? '   ⚠ 바탕은 안 봅니다 — ' + 바탕빼기[t] : ''));
  is(어긋.length === 0,
     '  ★★ 색이 어긋난 화면 <b>' + 어긋.length + '개</b>' +
     (어긋.length ? ' ⚠ ' + 어긋.slice(0, 5).join(' · ') : ' — 손대기 전에는 넷이었습니다'));

  head('[2] ★ 파일이 공용 토큰을 <b>부르고 또 쓰나</b> — 값을 다시 박지 않았나');
  const 봐야 = { finance: 'FIN_URL', crm: 'CRM_URL', apexmap: 'APEXMAP_URL', car_fault: 'CARFAULT_URL' };
  for (const [t, key] of Object.entries(봐야)) {
    const u = URLS[key] || '';
    const p = path.join(ROOT, u.startsWith('/') ? u.slice(1) : path.join('app', u));
    if (!fs.existsSync(p)) { is(false, '  ' + t + ' 의 파일을 못 찾았습니다 — ' + u); continue; }
    const s = fs.readFileSync(p, 'utf8');
    /* ⚠ 주소는 파일이 어디 있느냐에 따라 다릅니다 — db-crm.html 은 저장소
       뿌리라 "app/ui.css", 상담자료 아래는 "../ui.css" 입니다. 처음에
       (?:\.\.\/)*ui\.css 로만 봐서 <b>앱이 맞는데 자가 빨간불</b>을 켰습니다. */
    const 부름 = /href="[^"]*\bui\.css"/.test(s);
    const 씀 = (s.match(/var\(\s*--t-(?:ink|bg|sub|line|card)\b/g) || []).length;
    is(부름 && 씀 >= 3,
       '  ' + (이름표[t] || t).padEnd(22) + ' ui.css ' + (부름 ? '부름' : '<b>안 부름</b>') +
       ' · 토큰 쓴 곳 <b>' + 씀 + '</b>곳');
  }

  head('[3] ★ 토큰 값은 <b>ui.css 한 곳</b>에만 (5번)');
  const 토큰줄 = (UI.match(/--t-(?:ink|bg|sub|line|card)\s*:/g) || []).length;
  is(토큰줄 >= 5, '  ui.css 가 바탕·글자·선·칸 토큰을 <b>' + 토큰줄 + '줄</b> 들고 있다');
  /* 덮개 파일이 토큰을 <b>제 손으로 다시 정의</b>하면 두 벌이 됩니다 */
  const 두벌 = [];
  for (const key of ['FIN_URL', 'CRM_URL', 'APEXMAP_URL', 'CARFAULT_URL']) {
    const u = URLS[key] || '';
    const p = path.join(ROOT, u.startsWith('/') ? u.slice(1) : path.join('app', u));
    if (!fs.existsSync(p)) continue;
    const s = fs.readFileSync(p, 'utf8');
    for (const m of s.matchAll(/(--t-(?:ink|bg|sub|line|card)[a-z0-9-]*)\s*:\s*(#[0-9a-fA-F]{3,8})/g))
      두벌.push(path.basename(p) + ' 가 ' + m[1] + ' 를 ' + m[2] + ' 로 다시 적었습니다');
  }
  is(두벌.length === 0, '  덮개 파일이 공용 토큰을 <b>다시 정의하지 않는다</b>' +
     (두벌.length ? ' ⚠ ' + 두벌.slice(0, 3).join(' · ') : ''));

  await br.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ 빨간불 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 덮개로 열리는 화면의 바탕·글자가 본체와 같은 색이고, 그 색은 ui.css 한 곳에서 옵니다.');
})();
