/* 「오늘」 이 폰에서 <b>한눈에</b> 들어오나 — 자간 · 높낮이 · 글자 바닥

   2026-10-23 · 판 X167 · 사장님 말씀 「오늘 한눈에 들어오는지 <b>자간이랑
   높낮이</b> 다시 한번 확인하고 <b>핸드폰에서도 한번에</b> 들어와야 돼」.

   ★★ 폰(390×844)으로 홈 본문만 재어 보니 글줄 149개에 —
      글자 크기 <b>12가지</b> · 자간 <b>13가지</b> · 줄높이 <b>9가지</b> 였습니다.
      그리고 <b>13px 밑이 8줄</b>이었습니다. 「한눈에 안 들어온다」 는 말씀이
      여기서 나옵니다 — 갈래가 많을수록 눈이 어디를 먼저 볼지 못 정합니다.

   ★★ 찾은 <b>진짜 고장</b> — 알림칸(.t-note)이 <b>폰에서 12.5px, 컴퓨터에서
      13.5px</b> 이었습니다. 거꾸로입니다. 사장님은 폰으로 보시는데 폰이 더
      작았습니다. 「막힌 데 — ○○님이 CS에서 8일째입니다」 처럼 <b>읽고
      움직여야 하는 글</b>이 그 칸에 들어갑니다.

   ── 여기서 재는 것 ──────────────────────────────────────
     [1] 홈 본문에 <b>13px 밑</b> 글줄이 늘지 않는다
         ⚠ 2026-10-23 (판 X168) · <b>이제 0 입니다.</b> 마지막 하나였던
           「오늘 약속」(.tz-hc .t)은 사장님이 두 번 「목각대로 가줘」 하셨던
           자리라 남겨 두고 여쭈었더니 <b>「고쳐줘」</b> 하셔서 13px 로
           올렸습니다. 앞말이 뒷말로 바뀐 것이므로 뒷말을 따릅니다.
     [2] <b>글자 크기 · 자간 · 줄높이</b> 갈래가 늘지 않는다 (눈금)
         ⚠ 0 이나 1 을 요구하지 않습니다 — 제목과 본문은 달라야 합니다.
           「헛것을 잡는 점검은 안 잡는 점검보다 나쁘다」 (8번).
           <b>줄이면 기준선도 같이 내립니다</b> (0-1).
     [3] 폰 첫 화면에서 <b>머리가 먹는 자리</b>가 늘지 않는다
   ═════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd();

/* 손대기 전 잰 값 — 늘면 빨간불, 줄이면 여기도 같이 내립니다 */
/* ★ 2026-10-25 (판 X187) — 크기갈래 11 → <b>10</b>. 이 자가 「1가지 줄이셨습니다」
   라고 스스로 일러 준 것을 그대로 따릅니다. 줄였으면 기준선도 같이 내립니다 —
   안 내리면 다음 사람이 하나를 도로 늘려도 이 자가 안 웁니다 (0-1번 · 8번).
   ⚠ 머리px 은 <b>118 그대로</b> 둡니다. 지금 117 이지만 그것은 「맨 위 칸의
     윗틈을 없앴다」 는 이번 판의 값이고, 1px 을 눈금으로 박으면 다음 사람이
     글자 하나만 키워도 울립니다. 118 은 사장님 말씀 2026-10-23 에 맞춰 잰
     자리입니다.                                                           */
const BASE = { 작은글줄: 0, 크기갈래: 10, 자간갈래: 12, 줄높이갈래: 8, 머리px: 118 };

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const SRC = fs.readFileSync(path.join(ROOT, 'scripts', 'check-hmglance.js'), 'utf8');
const SEED = SRC.slice(SRC.indexOf('const SEED = `') + 14, SRC.indexOf('`;', SRC.indexOf('const SEED = `')));

(async () => {
  const srv = http.createServer((rq, rs) => {
    let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
    let f = path.join(ROOT, p);
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
    /* ★ 파일마다 알맞은 꼴로 — 전부 text/html 로 내주면 <b>ui.css 가 통째로
       무시되어</b> 옷을 안 입은 화면을 재게 됩니다. 만들 때 실제로 그랬습니다. */
    const MM = { '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml' };
    rs.writeHead(200, { 'Content-Type': (MM[path.extname(f)] || 'text/html') + '; charset=utf-8' });
    fs.createReadStream(f).pipe(rs);
  });
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  /* 바깥을 끊습니다 — 사장님 진짜 서버를 읽지 않습니다 */
  await ctx.route('**://**', r => r.request().url().startsWith('http://127.0.0.1:' + P) ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 120)));
  await pg.goto('http://127.0.0.1:' + P + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => typeof window.go === 'function', null, { timeout: 30000 });
  await pg.evaluate(SEED);
  await pg.waitForTimeout(1800);

  const R = await pg.evaluate(() => {
    const pane = document.querySelector('.tab-pane.on') || document.getElementById('dynPane');
    const vis = e => !!(e && (e.offsetWidth || e.offsetHeight));
    const rows = [];
    const w = document.createTreeWalker(pane, NodeFilter.SHOW_TEXT, null); let n;
    while ((n = w.nextNode())) {
      const t = (n.nodeValue || '').replace(/\s+/g, ' ').trim();
      if (!t || t.length < 2) continue;
      const el = n.parentElement; if (!el || !vis(el)) continue;
      const cs = getComputedStyle(el);
      const F = Math.round(parseFloat(cs.fontSize) * 10) / 10;
      const L = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing);
      const H = cs.lineHeight === 'normal' ? -1 : parseFloat(cs.lineHeight);
      rows.push({ F, em: Math.round(L / F * 1000) / 1000,
                  r: H > 0 ? Math.round(H / F * 100) / 100 : -1,
                  c: (el.getAttribute('class') || el.tagName.toLowerCase()).split(' ')[0],
                  t: t.slice(0, 20) });
    }
    /* 홈 본문이 몇 px 에서 시작하나 — <b>머리(앱 바)가 먹는 자리</b>
       ★★ <b>2026-10-26 (판 X199) — 「첫 글자」 가 아니라 「첫 덩이」 를 잽니다.</b>
         이 줄의 이름은 「<b>머리가 먹는 자리</b>」 인데, 첫 글자를 재면 <b>첫 칸의
         안쪽 여백과 줄 가운데맞춤까지</b> 같이 재게 됩니다. 판 X199 에서 맨 위
         칸이 「지금 할 것」 카드로 바뀌자, 그 머리줄이 44px 단추에 <b>가운데로</b>
         맞춰지면서 첫 글자가 12px 아래로 내려가 <b>117 → 131px</b> 이 되었습니다 —
         앱 바는 한 자도 안 커졌는데 자가 커졌다고 말한 것입니다 (1번).
         ★ <b>첫 덩이는 104px 로 고치기 전과 똑같습니다</b>(두 판을 다 재어 봤습니다).
         ★ 기준선 118 은 <b>한 자도 안 내렸습니다</b> — 묻는 것만 제 이름에 맞췄습니다.
         ⚠ 칸 안쪽 여백·글자 크기는 다른 자들이 봅니다 (check-hmfill · check-hmglance). */
    let head = -1;
    { for (const c of [].slice.call(pane.children)) {
        const b = c.getBoundingClientRect();
        if (b.height > 0) { head = Math.round(b.top); break; } } }
    return { rows, head, vh: window.innerHeight };
  });

  const uniq = k => [...new Set(R.rows.map(x => x[k]))].sort((a, b) => a - b);
  const small = R.rows.filter(x => x.F < 13);
  const F = uniq('F'), E = uniq('em'), L = uniq('r').filter(x => x > 0);

  console.log('\n[1] 홈 본문에 13px 밑 글줄이 늘지 않았나 (폰 390×844 · 글줄 ' + R.rows.length + '개)');
  small.forEach(s => console.log('     ' + s.F + 'px  .' + s.c + '  「' + s.t + '」'));
  is(small.length <= BASE.작은글줄,
     '  13px 밑 <b>' + small.length + '줄</b> — 기준선 ' + BASE.작은글줄 + ' 이하' +
     (small.length > BASE.작은글줄 ? '  ← 늘었습니다' : ''));
  if (small.length < BASE.작은글줄)
    console.log('     ★ ' + (BASE.작은글줄 - small.length) + '줄을 줄이셨습니다 — BASE.작은글줄 을 ' + small.length + ' 로 내려 주십시오');

  console.log('\n[2] 글자 크기 · 자간 · 줄높이 갈래가 늘지 않았나 (눈금)');
  console.log('     크기  ' + F.map(x => x + 'px').join(' · '));
  console.log('     자간  ' + E.map(x => x + 'em').join(' · '));
  console.log('     높낮이 ' + L.map(x => x + '배').join(' · '));
  is(F.length <= BASE.크기갈래, '  글자 크기 <b>' + F.length + '가지</b> — 기준선 ' + BASE.크기갈래 + ' 이하');
  is(E.length <= BASE.자간갈래, '  자간 <b>' + E.length + '가지</b> — 기준선 ' + BASE.자간갈래 + ' 이하');
  is(L.length <= BASE.줄높이갈래, '  줄높이 <b>' + L.length + '가지</b> — 기준선 ' + BASE.줄높이갈래 + ' 이하');
  [['크기갈래', F.length], ['자간갈래', E.length], ['줄높이갈래', L.length]].forEach(([k, v]) => {
    if (v < BASE[k]) console.log('     ★ ' + k + ' 를 ' + (BASE[k] - v) + '가지 줄이셨습니다 — BASE.' + k + ' 를 ' + v + ' 로 내려 주십시오');
  });

  console.log('\n[3] 폰 첫 화면에서 머리가 먹는 자리');
  is(R.head >= 0 && R.head <= BASE.머리px,
     '  홈 본문이 <b>' + R.head + 'px</b> 에서 시작한다 — 기준선 ' + BASE.머리px + 'px 이하 (' +
     Math.round(R.head / R.vh * 100) + '%)');

  console.log('\n[4] 조용한가');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
                  : '✓ 폰에서 「오늘」 의 글자 갈래가 늘지 않았고, 13px 밑도 늘지 않았습니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
