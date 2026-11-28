/* 🗜🔎 <b>오늘 화면을 50대 팀원이 봐도 할 수 있나</b> — 판 X597

   사장님 말씀 (2026-11-28) —
     「오늘에서 조금 더 쉽게 팀원들이 고객을 관리하고 사용할 방법과 아이디어를
      재구성해 <b>50대가 봐도 할수 있을정도로</b>」

   ── 재어 보고 찾은 것 ───────────────────────────────────────────────
   ① <b>「🗜 짧게 보기」가 이 화면에서 아무 일도 안 했습니다.</b> 눌러도 키가
      2,708px 그대로인데, 화면은 「감춘 것: 📇 고객 띠 · 🌅 아침 미션 · 🚗 동선 ·
      📅 약속 · 📊 기록 · 📆 이번 주 …」 라고 <b>일곱을 감췄다고</b> 적었습니다.
      그 옷이 <code>#hmTossHost</code>(옛 홈 틀) 밑만 감추는데 새 오늘 화면은
      <code>#hv2</code> 라 <b>한 규칙에도 안 걸린 것</b>입니다 — 화면이 거짓말을
      하고 있었습니다 (1번·6번).
   ② <b>글자 255덩이 가운데 144덩이가 15px 아래</b>였고, 누르는 자리 다섯이
      44px 아래였습니다. 50대 눈·손에는 너무 작습니다.
   ③ 키우는 길을 처음에는 <b>칸 이름을 열두 개 적어</b> 쫓았는데, 재어 보니
      144 중 <b>37만</b> 커졌습니다 — 안 적은 칸은 그대로였습니다. <code>zoom</code>
      한 겹으로 바꾸니 144 → 1 이 됐습니다. ★ 다만 <code>position:fixed</code> 인
      것이 zoom 안에 들면 <code>bottom</code>·<code>right</code> 까지 1.25배가 되어
      <b>자비스 말풍선이 31px 올라가고 띠가 17px 좁아집니다</b> — 그 둘은 뺐습니다.

   ── 여기서 재는 것 ─────────────────────────────────────────────────
     [1] ★★ <b>「🗜 짧게」가 정말 접나</b> — 여덟 칸이 사라지고 키가 줄나
     [2] ★★ <b>적어 둔 것과 실제가 같나</b> (1번) — 안내 줄이 적은 이름 여덟이
            정말 사라진 여덟인가 · 단추 이름이 「다 보기」 로 바뀌나
     [3] ★★ <b>남길 것은 남나</b> — 지금 할 것 · 다섯 걸음 · 챙기는 중 · 아래 띠
     [4] ★★ <b>다시 누르면 그대로 돌아오나</b> (6번)
     [5] ★★ <b>「🔎 글씨 크게」가 정말 크게 하나</b> — 15px 아래가 열에 하나로 ·
            44px 아래 누를 자리 0
     [6] ★★ <b>고정 띠가 안 밀리나</b> — 말풍선·아래 띠의 바닥까지 거리가 그대로
     [7] ★★ <b>시트도 읽히나</b> — 15px 아래 0 · 손잡이가 창 안에 있나
     [8] ★★ <b>되돌리면 정확히 제자리</b> · 옆으로 안 새나
     [9] ★  <b>서버를 안 부르고 이 기기에만 담나</b> (3번 · 7번)

   ⚠ <b>안 재는 것과 까닭</b> (8번) —
     · 칸 차례 · 옷이 새는지는 안 봅니다 — <b>check-homev2</b> 가 임자입니다.
     · 색·둥글기·토큰은 안 봅니다 — <b>check-phonefit</b> 이 임자입니다.
       두 자가 같은 것을 세면 어긋납니다 (5번).
     · 사장님 <b>진짜 서버는 한 번도 안 부릅니다</b> — 바깥은 전부 끊습니다.

   ⚠ <b>이 자를 짜며 제 자가 틀린 자리</b> — 커진 글씨를 셀 때 <code>zoom</code> 을
     빼먹어 「안 커졌다」 고 읽었습니다. <code>getComputedStyle</code> 의
     <code>fontSize</code> 는 zoom 을 안 곱한 값입니다 — 조상의 zoom 을 모두
     곱해서 봅니다.                                                          */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 9381;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css;charset=utf-8', '.json': 'application/json;charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f)) { const g = path.join(ROOT, 'app', p); if (fs.existsSync(g)) f = g; }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});

/* 씨는 check-phonefit 것을 <b>그 파일에서 뽑아</b> 씁니다 — 베껴 두면 한쪽만 늙습니다 (5번) */
const PF = fs.readFileSync(path.join(ROOT, 'scripts/check-phonefit.js'), 'utf8');
const a0 = PF.indexOf('const SEED'), q0 = PF.indexOf('`', a0), e0 = PF.indexOf('`;', q0 + 1);
const SEED = PF.slice(q0 + 1, e0);
const HV = fs.readFileSync(path.join(ROOT, 'app/home-v2.js'), 'utf8');
const IX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');

(async () => {
  await new Promise((r) => srv.listen(PORT, r));
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('apex_home_v2', '1'); } catch (e) {} });
  const 바깥부름 = [];
  await ctx.route('**://**', (r) => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
    바깥부름.push(u.slice(0, 80)); return r.abort();
  });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', (x) => errs.push(String(x && x.message).slice(0, 110)));
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForTimeout(3200);

  /* ⚠ 화면이 처음 뜰 때 부르는 것(글씨체 · 라이브러리)은 <b>단추가 부른 것이 아닙니다</b> —
     여기서 금을 긋고, 그 뒤에 늘어난 것만 셉니다. 처음에 이것을 안 갈라 제 자가 울었습니다. */
  const 뜰때부름 = 바깥부름.slice();
  const R = await pg.evaluate(async (a) => {
    (0, eval)(a.seed);
    const O = {};
    const d = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10), td = d(0);
    /* 고객 이름은 <b>홍길동 식구</b>로만 (CLAUDE.md 3번) */
    window.AR = window.AR || {}; AR.loaded = true; AR.busy = false; AR.cliRows = [];
    AR.db = [
      { id: 'p1', who: 'u1', name: '홍길동가', region: '순천', src: '일반', stage: 'AP', appt: d(-3) + 'T10:00', n: 1, days: 9 },
      { id: 'p5', who: 'u1', name: '홍길동마', region: '순천', src: '일반', stage: 'AP', appt: td + 'T16:00', n: 1, days: 2 }];
    try { go('home'); } catch (e) { O.goErr = String(e).slice(0, 70); }
    await new Promise((r) => setTimeout(r, 2200));
    try { HOME_V2.paint(); } catch (e) { O.paintErr = String(e).slice(0, 70); }
    await new Promise((r) => setTimeout(r, 1000));

    /* ── 재는 자들 ── */
    const el = (id) => document.getElementById(id);
    const 보임 = (x) => { if (!x) return false; const r = x.getBoundingClientRect(); const c = getComputedStyle(x);
      return r.width > 0 && r.height > 0 && c.display !== 'none' && c.visibility !== 'hidden'; };
    /* ⚠ <b>zoom 은 fontSize 에 안 섞여 있습니다</b> — 조상 zoom 을 모두 곱합니다 */
    const 배 = (x) => { let z = 1, n = x; while (n && n !== document.body) {
      const v = parseFloat(getComputedStyle(n).zoom || '1'); if (v && v !== 1) z *= v; n = n.parentElement; } return z; };
    const 글자들 = (root) => Array.from(root.querySelectorAll('*'))
      .filter((x) => 보임(x) && x.children.length === 0 && (x.textContent || '').trim());
    const 누를것 = (root) => Array.from(root.querySelectorAll('button,a,[onclick]')).filter(보임);
    /* 📇 칸마다 <b>제 이름표</b> — 안내 줄에 적은 글과 짝지어 둡니다 */
    /* ⚠ 처음에 <b>동선과 영업 한 바퀴를 같은 이름표(.road2)</b> 로 적어, 동선을
       아예 안 보고 있었습니다 — 되돌려 보니 안 울어서 알았습니다 (8번).
       동선은 <code>.rtc</code>, 영업 한 바퀴는 <code>.road2</code> 입니다. */
    const 칸 = { '팀 명단': '.whowrap', '이번 달 목표': '.mon', '상품전략': '.insc',
      '이번 주': '.wkc', '동선': '.rtc', '영업 한 바퀴': '.road2', '저녁': '.eve', '다른 메뉴': '.mm' };
    const 선칸 = () => { const h = el('hv2'); const o = {};
      Object.keys(칸).forEach((k) => { o[k] = !!(h && 보임(h.querySelector(칸[k]))); }); return o; };
    const 잼 = (id) => { const root = el(id); if (!root || !보임(root)) return null;
      const tx = 글자들(root), tp = 누를것(root);
      return { 글자: tx.length, 작은글자: tx.filter((x) => parseFloat(getComputedStyle(x).fontSize) * 배(x) < 15).length,
        단추: tp.length, 작은단추: tp.filter((x) => x.getBoundingClientRect().height < 44).length }; };
    const 띠 = () => { const o = {};
      ['.jvb', '.dock'].forEach((s) => { const x = document.querySelector('#hv2 ' + s);
        o[s] = x && 보임(x) ? Math.round(innerHeight - x.getBoundingClientRect().bottom) + '/' + Math.round(x.getBoundingClientRect().width) : '없음'; });
      return o; };
    const 키 = () => Math.round((el('dynPane') || { scrollHeight: 0 }).scrollHeight);
    const 옆 = () => document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const 짧은단추 = () => el('hmShortBtn');
    const 큰단추 = () => Array.from(document.querySelectorAll('#hv2 .top button')).filter((b) => /글씨/.test(b.textContent || ''))[0];
    const 글머리 = (b) => b ? (b.textContent || '').trim() : '없음';

    /* 🙈 <b>오늘 화면이 위 띠에 이미 선 단추를 또 세우나</b> (판 X598 · 5번)
       ⚠ 「지금 이분」 카드는 같은 글이 석 장 나란히 서는 것이 <b>맞습니다</b>(카드마다 하나) —
         그래서 <b>오늘 화면 안과 밖에 걸쳐</b> 같은 글이 설 때만 셉니다. */
    const 글 = (x) => String(x.textContent || '').replace(/\s+/g, ' ').trim();
    const 모든누를것 = Array.from(document.querySelectorAll('button,a[href],[onclick]')).filter(보임);
    const 묶음 = {};
    모든누를것.forEach((x) => { const t = 글(x); if (!t || t.length > 18) return;
      (묶음[t] = 묶음[t] || []).push({ 안: !!x.closest('#hv2'), id: x.id || '',
        y: Math.round(x.getBoundingClientRect().top), on: String(x.getAttribute('onclick') || '').slice(0, 40) }); });
    O.안팎겹침 = Object.keys(묶음)
      .filter((k) => 묶음[k].some((p) => p.안) && 묶음[k].some((p) => !p.안))
      .map((k) => k + ' ← ' + 묶음[k].map((p) => (p.안 ? '오늘 y' : '위 띠 y') + p.y + (p.id ? '(' + p.id + ')' : '')).join(' · '));

    /* ── 처음 ── */
    O.처음 = { 칸: 선칸(), 키: 키(), 옆: 옆(), 잼: 잼('hv2'),
      짧은글: 글머리(짧은단추()), 큰글: 글머리(큰단추()), 띠: 띠() };
    O.짧은단추있나 = !!짧은단추(); O.큰단추있나 = !!큰단추();
    O.남은것처음 = { 지금할것: !!el('hv2').querySelector('.mis-h,.qrail'),
      다섯걸음: !!el('hv2').querySelector('.steps5'), 챙기는중: !!el('hv2').querySelector('.jv') };

    /* ── [1~4] 🗜 짧게 — <b>실제 단추를 누릅니다</b> ── */
    O.부름전 = true;
    if (짧은단추()) 짧은단추().click();
    await new Promise((r) => setTimeout(r, 700));
    O.짧게 = { 칸: 선칸(), 키: 키(), 옆: 옆(), 잼: 잼('hv2'), 짧은글: 글머리(짧은단추()) };
    const sn = el('hv2') && el('hv2').querySelector('.hv2-sn');
    O.안내줄 = sn && 보임(sn) ? (sn.textContent || '').replace(/\s+/g, ' ') : '';
    O.옛안내줄 = !!(el('hmShortNote') && 보임(el('hmShortNote')));
    O.남은것짧게 = { 지금할것: !!el('hv2').querySelector('.mis-h,.qrail'),
      다섯걸음: !!el('hv2').querySelector('.steps5'), 챙기는중: !!el('hv2').querySelector('.jv'),
      아래띠: !!(el('hv2').querySelector('.dock') || el('hv2').querySelector('.jvb')) };
    /* 다시 눌러 돌아오나 */
    if (짧은단추()) 짧은단추().click();
    await new Promise((r) => setTimeout(r, 700));
    O.짧게되돌림 = { 칸: 선칸(), 키: 키(), 짧은글: 글머리(짧은단추()) };

    /* ── [5~8] 🔎 큰 글씨 — <b>실제 단추를 누릅니다</b> ── */
    if (큰단추()) 큰단추().click();
    await new Promise((r) => setTimeout(r, 700));
    O.크게 = { 잼: 잼('hv2'), 옆: 옆(), 띠: 띠(), 큰글: 글머리(큰단추()),
      몸: document.body.className.indexOf('hv2-big') >= 0 };
    /* 시트도 — 아침 미션 첫 장 */
    try { HOME_V2.mis(0); } catch (e) { O.misErr = String(e).slice(0, 70); }
    await new Promise((r) => setTimeout(r, 700));
    O.시트 = 잼('hv2Sheet');
    const sh = el('hv2Sheet');
    O.시트자리 = sh && 보임(sh) ? { 위: Math.round(sh.getBoundingClientRect().top),
      폭: Math.round(sh.getBoundingClientRect().width) } : null;
    try { HOME_V2.close(); } catch (e) {}
    await new Promise((r) => setTimeout(r, 500));
    if (큰단추()) 큰단추().click();
    await new Promise((r) => setTimeout(r, 700));
    O.크게되돌림 = { 잼: 잼('hv2'), 큰글: 글머리(큰단추()), 몸: document.body.className.indexOf('hv2-big') >= 0 };

    /* ── [9] 이 기기에 담긴 칸 ── */
    O.담긴칸 = Object.keys(localStorage).filter((k) => /short|big/i.test(k)).sort();
    return O;
  }, { seed: SEED });

  const P = R.처음, S = R.짧게, B = R.크게;
  /* 안내 줄과 짝지은 여덟 이름 — 화면 안 <code>칸</code> 과 <b>같은 글</b>이어야 합니다 */
  const 칸이름 = ['팀 명단', '이번 달 목표', '상품전략', '이번 주', '동선', '영업 한 바퀴', '저녁', '다른 메뉴'];

  head('[1] ★★ <b>「🗜 짧게」가 정말 접나</b>');
  is(R.짧은단추있나, '  「🗜 짧게」 단추가 선다 — 눌러 볼 수 있다');
  if (!P || !S) { is(false, '  화면을 못 세웠습니다 — 아래는 못 잽니다'); }
  else {
    const 사라진 = Object.keys(P.칸).filter((k) => P.칸[k] && !S.칸[k]);
    const 선것 = Object.keys(P.칸).filter((k) => P.칸[k]);
    is(선것.length >= 5, '  켜기 전에 접을 칸이 여럿 서 있다 — ' + 선것.length + '칸 (' + 선것.join(' · ') + ')');
    is(사라진.length === 선것.length, '  <b>서 있던 칸이 모두 접혔다</b> — ' + 사라진.length + '/' + 선것.length +
      (사라진.length === 선것.length ? '' : ' ← 안 접힌 것 ' + 선것.filter((k) => S.칸[k]).join(' · ')));
    is(S.키 > 0 && S.키 <= P.키 * 0.85, '  <b>키가 줄었다</b> — ' + P.키 + 'px → ' + S.키 + 'px (' +
      (P.키 ? Math.round((1 - S.키 / P.키) * 100) : 0) + '% 줄었음)');
    is(S.잼 && P.잼 && S.잼.단추 < P.잼.단추, '  누를 것도 줄었다 — ' + P.잼.단추 + '개 → ' + S.잼.단추 + '개');

    head('[2] ★★ <b>적어 둔 것과 실제가 같나</b> (1번)');
    is(!!R.안내줄, '  <b>무엇을 접었는지 적는 줄</b>이 선다');
    const 안적힌 = 사라진.filter((k) => R.안내줄.indexOf(k) < 0);
    /* ⚠ 처음 이 줄을 <code>!사라진.indexOf</code> 로 써서 <b>늘 빈 손</b>이었습니다 —
       함수는 언제나 참이라 걸러지는 것이 하나도 없었습니다. 안 울리는 알람입니다 (8번). */
    const 헛적힌 = Object.keys(칸이름).filter((k) => R.안내줄.indexOf(k) >= 0 && 사라진.indexOf(k) < 0);
    is(안적힌.length === 0, '  접은 칸이 <b>모두 그 줄에 적혀 있다</b>' + (안적힌.length ? ' ← 빠진 것 ' + 안적힌.join(' · ') : ''));
    is(헛적힌.length === 0, '  <b>안 접은 것을 접었다고 안 적는다</b>' + (헛적힌.length ? ' ← ' + 헛적힌.join(' · ') : ''));
    is(/다 보기/.test(S.짧은글), '  단추 이름이 돌아갈 길을 말한다 — 「' + P.짧은글 + '」 → 「' + S.짧은글 + '」');
    is(!R.옛안내줄, '  옛 안내 줄이 <b>겹쳐 안 뜬다</b> (두 줄이 같은 말을 하면 어느 쪽이 참인지 모릅니다)');

    head('[3] ★★ <b>남길 것은 남나</b>');
    is(R.남은것짧게.지금할것, '  🎯 지금 할 것(미션 · 지금 이분)이 남았다');
    is(R.남은것짧게.챙기는중, '  🛰 챙기는 중이 남았다 — 사장님이 바로 앞 판에서 고치라 하신 칸');
    is(R.남은것짧게.아래띠, '  아래 띠(상품전략·화법·공부 · 자비스)가 남았다');

    head('[4] ★★ <b>다시 누르면 그대로 돌아오나</b> (6번)');
    is(R.짧게되돌림.키 === P.키, '  키가 <b>정확히</b> 돌아온다 — ' + R.짧게되돌림.키 + 'px (처음 ' + P.키 + 'px)');
    is(JSON.stringify(R.짧게되돌림.칸) === JSON.stringify(P.칸), '  여덟 칸이 모두 제자리로 돌아온다');
    is(R.짧게되돌림.짧은글 === P.짧은글, '  단추 이름도 돌아온다 — 「' + R.짧게되돌림.짧은글 + '」');
  }

  head('[5] ★★ <b>「🔎 글씨 크게」가 정말 크게 하나</b>');
  is(R.큰단추있나, '  「🔎 글씨 크게」 단추가 맨 위에 선다');
  if (!B || !B.잼 || !P || !P.잼) { is(false, '  못 잼'); }
  else {
    is(B.몸, '  누르면 몸에 이름이 붙는다 (body.hv2-big)');
    is(B.잼.작은글자 * 10 <= P.잼.작은글자, '  <b>15px 아래 글자가 열에 하나 밑으로</b> — ' +
      P.잼.작은글자 + '덩이 → ' + B.잼.작은글자 + '덩이 (글자 ' + B.잼.글자 + '덩이 가운데)');
    is(B.잼.작은단추 === 0, '  <b>44px 아래 누를 자리가 0</b> — ' + P.잼.작은단추 + '개 → ' + B.잼.작은단추 + '개');
    is(/작게/.test(B.큰글), '  단추 이름이 돌아갈 길을 말한다 — 「' + P.큰글 + '」 → 「' + B.큰글 + '」');

    head('[6] ★★ <b>고정 띠가 안 밀리나</b>');
    /* ⚠ position:fixed 가 zoom 안에 들면 bottom·right 까지 커져 자리가 밀립니다 */
    is(P.띠['.jvb'] === B.띠['.jvb'], '  자비스 말풍선 띠가 제자리 — ' + P.띠['.jvb'] + ' → ' + B.띠['.jvb'] + ' (바닥까지/폭)');
    is(P.띠['.dock'] === B.띠['.dock'], '  아래 띠가 제자리 — ' + P.띠['.dock'] + ' → ' + B.띠['.dock']);
    is(/zoom/.test(HV) && /:not\(\.dock\):not\(\.jvb\)/.test(HV), '  그 선이 옷에 적혀 있다 — 고정 띠 둘은 zoom 에서 뺀다');

    head('[7] ★★ <b>시트도 읽히나</b>');
    is(R.시트 && R.시트.글자 > 5, '  시트가 열린다 — 글자 ' + ((R.시트 || {}).글자 || 0) + '덩이');
    is(R.시트 && R.시트.작은글자 === 0, '  시트에 15px 아래 글자가 없다 — ' + ((R.시트 || {}).작은글자) + '덩이');
    is(R.시트 && R.시트.작은단추 === 0, '  시트에 44px 아래 누를 자리가 없다 — ' + ((R.시트 || {}).작은단추) + '개');
    is(R.시트자리 && R.시트자리.위 >= 0, '  <b>손잡이가 창 안에 있다</b> — 위 ' + ((R.시트자리 || {}).위) +
      'px (통째로 키우면 88vh 가 창보다 커져 위가 잘립니다)');

    head('[8] ★★ <b>되돌리면 정확히 제자리</b> · 옆으로 안 새나');
    is(R.크게되돌림 && !R.크게되돌림.몸 && R.크게되돌림.잼 && R.크게되돌림.잼.작은글자 === P.잼.작은글자 &&
      R.크게되돌림.잼.작은단추 === P.잼.작은단추,
      '  되돌리면 처음 수로 <b>정확히</b> 돌아온다 — ' + ((R.크게되돌림.잼 || {}).작은글자) + '덩이 · ' +
      ((R.크게되돌림.잼 || {}).작은단추) + '개 (처음 ' + P.잼.작은글자 + '덩이 · ' + P.잼.작은단추 + '개)');
    is(P.옆 <= 0 && S.옆 <= 0 && B.옆 <= 0, '  어느 상태에서도 옆으로 안 샌다 — 처음 ' + P.옆 + ' · 짧게 ' + S.옆 + ' · 크게 ' + B.옆);
  }

  head('[9] ★ <b>서버를 안 부르고 이 기기에만 담나</b> (3번 · 7번)');
  const 누른뒤 = 바깥부름.slice(뜰때부름.length);
  is(누른뒤.length === 0, '  <b>단추를 누르는 동안 바깥을 한 번도 안 불렀다</b> — ' +
    (누른뒤.length ? 누른뒤.slice(0, 2).join(' | ') : '0번') +
    ' (화면이 뜰 때 부른 글씨체·라이브러리 ' + 뜰때부름.length + '건은 단추가 부른 것이 아니라 셈에서 뺐습니다)');
  is((R.담긴칸 || []).length <= 2 && (R.담긴칸 || []).every((k) => /^apex_/.test(k)),
    '  담긴 칸은 보기 취향 둘뿐 — ' + (R.담긴칸 || []).join(' · '));
  is(!/\.(insert|update|upsert|rpc)\(/.test(HV.slice(HV.indexOf('function bigOn'), HV.indexOf('function bigOn') + 900)),
    '  큰 글씨는 <b>서버에 한 글자도 안 올린다</b> — 이 기기 보기 취향입니다');

  head('[10] ★★ <b>오늘 화면이 위 띠에 이미 선 단추를 또 세우나</b> (5번)');
  /* 재어 보니 「🙈 이름 가리기」 가 글자 하나 안 다르게 <b>69px 차이로 둘</b>이었습니다 —
     위 띠 y44(#hmNmBtn)와 오늘 화면 y113. 50대 팀원이 보면 어느 것이 참인지 모릅니다 (1번). */
  is((R.안팎겹침 || []).length === 0, '  같은 글의 단추가 <b>오늘 화면 안과 위 띠에 걸쳐</b> 서지 않는다 — ' +
    ((R.안팎겹침 || []).length ? (R.안팎겹침.length + '곳 ← ' + R.안팎겹침.slice(0, 2).join(' | ')) : '0곳'));
  is(/function nmUp\(\)[\s\S]{0,200}HM_NM_TABS/.test(HV),
    '  묻는 곳은 <b>HM_NM_TABS 하나</b> — 위 띠가 그 단추를 어느 화면에 세우는지 다시 세지 않는다');
  is(/HM_NM_TABS\[/.test(IX) && /nmUp\(\) \? '' :/.test(HV),
    '  위 띠가 <b>안 세우는 화면에서는 여기서 세운다</b> — 길을 없앤 것이 아닙니다 (6번)');

  head('터진 것');
  is(errs.length === 0, '  화면이 안 터진다 — ' + (errs.length ? errs.slice(0, 2).join(' | ') : '0건'));

  await br.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ 쉬운 오늘 화면 점검 — ' + bad + '가지가 어긋났습니다.'); process.exit(1); }
  console.log('✓ 쉬운 오늘 화면 점검 통과 — 접으면 정말 접히고, 키우면 정말 커집니다.');
})().catch((e) => { console.error('✗ 터졌습니다 — ' + (e && e.message)); try { srv.close(); } catch (x) {} process.exit(1); });
