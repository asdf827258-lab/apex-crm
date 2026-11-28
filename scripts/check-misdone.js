/* ✅⏳ <b>오늘의 미션을 다 칠 수 있나 · 밀린 것이 서나</b> — 판 X596

   사장님 말씀 (2026-11-28) —
     「오늘에서 자비스가 챙기는중, <b>오늘 스케줄 밀린것들 다 정리해주는데 왜 그거 안되고</b>,
      <b>오늘 할일에서는 완료를 칠수가 없는데</b> 이거 다시 확인해볼래?」

   ── 재어 보고 찾은 것 둘 ─────────────────────────────────────────
   ① <b>미션 다섯 중 「🤝 오늘 약속」 한 칸만 완료 단추가 0개였습니다.</b>
      MIS 표에서 그 칸만 ck 가 없고, misSheet 의 m.appt 가지가 체크줄을 하나도
      안 세우고 먼저 return 했습니다. 그래서 「오늘의 미션 0/5」 가 <b>영원히
      5/5 가 안 됐습니다</b> — 다 됐다고 적을 길이 없는 자리입니다 (1번·6번).
   ② <b>챙기는 중이 달력을 모레(n=2)부터 읽고 있었습니다.</b> mcalItems 는 날이
      지난 것을 <b>오늘 자리로 끌어다 late 에 원래 날짜를 적어</b> 두는데
      (index.html 19777행), 이 고리가 오늘·내일을 건너뛰어 <b>밀린 것이 한 줄도
      안 섰습니다</b> — 달력 오늘 자리에 다섯이 있는데 카드는 「미리 세운 연락
      0개」 라고 적었습니다 (1번).

   ── 여기서 재는 것 ───────────────────────────────────────────────
     [1] ★★ <b>미션 다섯을 다 칠 수 있나</b> — 시트마다 완료 단추가 하나 이상
     [2] ★★ <b>🤝 오늘 약속을 눌러서 켜지나</b> — 머리 수 · 줄의 ✓ · 담긴 칸
     [3] ★★ <b>적는 자가 하나인가</b> (5번) — hmQfin 을 부르고 새 저장 코드가 없나
     [4] ★★ <b>단계는 안 바뀌나</b> (1번) — 다녀온 것과 만난 것은 다른 일입니다
     [5] ★★ <b>⏳ 밀린 것이 서나</b> — 지난 할 일을 심으면 카드·시트에 서고
            <b>날짜가 원래 날</b>인가(오늘로 적으면 며칠 밀렸는지 모릅니다)
     [6] ★★ <b>같은 분을 두 번 안 세나</b> (5번) — 오늘·내일 약속은 위 묶음이
            이미 세었으니 밀린·미리 목록에 또 넣지 않나
     [7] ★  <b>못 담으면 말하나</b> (1번) — 조용히 삼키면 눌러도 아무 일이 없습니다

   ⚠ <b>안 재는 것과 까닭</b> (8번) —
     · 새 오늘 화면이 서는지 · 길이 · 글씨는 안 봅니다 — check-homev2 ·
       check-phonefit 이 그 임자입니다. 두 자가 같은 것을 세면 어긋납니다 (5번).
     · 사장님 <b>진짜 서버는 한 번도 안 부릅니다</b> — 바깥은 전부 끊습니다.

   ⚠ <b>이 자를 짜며 제 자가 틀린 자리</b> — 완료 단추를 misDid 라는 <b>이름으로</b>
     세다가, 새로 넣은 misApt 를 못 보고 「0개」 라 읽었습니다. 이름으로 세지 않고
     <b>눌러서 켜지나</b>를 봅니다 (8번).                                     */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8949;
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

(async () => {
  await new Promise((r) => srv.listen(PORT, r));
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const 열기 = async () => {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
    /* 새 오늘 화면은 자동 점검 브라우저에서 기본이 꺼짐 — 일부러 켭니다 */
    await ctx.addInitScript(() => { try { localStorage.setItem('apex_home_v2', '1'); } catch (e) {} });
    await ctx.route('**://**', (r) => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', (x) => errs.push(String(x && x.message).slice(0, 110)));
    await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await pg.waitForTimeout(3200);
    return { ctx, pg, errs };
  };

  const o = await 열기();
  const R = await o.pg.evaluate(async (a) => {
    (0, eval)(a.seed);
    const O = {};
    const d = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
    const td = d(0);
    /* 고객 이름은 <b>홍길동 식구</b>로만 (CLAUDE.md 3번) */
    window.AR = window.AR || {}; AR.loaded = true; AR.busy = false; AR.cliRows = [];
    AR.db = [
      { id: 'p1', who: 'u1', name: '홍길동가', region: '순천', src: '일반', stage: 'AP', appt: d(-3) + 'T10:00', n: 1, days: 9 },
      { id: 'p2', who: 'u1', name: '홍길동나', region: '순천', src: '일반', stage: 'PC', appt: d(-1) + 'T14:00', n: 1, days: 9 },
      { id: 'p3', who: 'u1', name: '홍길동다', region: '순천', src: '일반', stage: 'AP', appt: d(1) + 'T11:00', n: 1, days: 9 },
      { id: 'p4', who: 'u1', name: '홍길동라', region: '순천', src: '일반', stage: '계약완료', appt: '', n: 1, days: 20 },
      { id: 'p5', who: 'u1', name: '홍길동마', region: '순천', src: '일반', stage: 'AP', appt: td + 'T16:00', n: 1, days: 2 }];
    /* ▶ 「다음 할 일」 — 지난 것 둘(밀린 것) · 앞날 하나 */
    window.cmNextAll = function (id) {
      if (id === 'c1') return [{ due: d(-5), what: '증권 설명 전화', k: 'next' }, { due: d(-2), what: '소개 여쭙기', k: 'next' }];
      if (id === 'c2') return [{ due: d(4), what: '생일 축하 카톡', k: 'next' }];
      return [];
    };
    try { go('home'); } catch (e) { O.goErr = String(e).slice(0, 70); }
    await new Promise((r) => setTimeout(r, 2200));
    try { HOME_V2.paint(); } catch (e) { O.paintErr = String(e).slice(0, 70); }
    await new Promise((r) => setTimeout(r, 1000));

    const pane = () => document.getElementById('dynPane');
    const hdr = () => { const m = ((pane() || {}).innerText || '').match(/오늘의 미션\s*(\d+)\s*\/\s*(\d+)/); return m ? (m[1] + '/' + m[2]) : '?'; };
    const sheetTxt = () => { const s = document.getElementById('hv2Sheet'); return s ? (s.innerText || '').replace(/\s+/g, ' ') : ''; };
    const sheetBtns = () => { const s = document.getElementById('hv2Sheet'); return s ? Array.from(s.querySelectorAll('button')) : []; };
    O.gate = /로그인하면 오늘 챙길/.test((pane() || {}).innerText || '');
    O.rows = document.querySelectorAll('.mis-r').length;

    /* ── [1] 미션 다섯마다 완료를 칠 것이 있나 — <b>이름이 아니라 눌러서</b> ── */
    O.each = [];
    for (let n = 0; n < O.rows; n++) {
      try { HOME_V2.mis(n); } catch (e) {}
      await new Promise((r) => setTimeout(r, 520));
      const bs = sheetBtns();
      const t = (document.querySelector('#hv2Sheet h1') || {}).textContent || '';
      /* 완료로 치는 것 = <b>끝내는 단추를 단 줄</b>.
         ⚠ 판 X599 전에는 <code>.mis-s</code>(체크줄) 하나만 셌는데, 약속 미션이 챙기는 중과
           같은 줄(<code>.jvr</code>)로 바뀌자 <b>멀쩡한 줄을 0개로</b> 읽었습니다. 세는 것은
           옷 이름이 아니라 <b>그 자리에서 끝낼 단추가 달렸나</b> 입니다 (8번). */
      const s = document.getElementById('hv2Sheet');
      const ck = s ? Array.from(s.querySelectorAll('.mis-s,.jvr')) : [];
      const done = ck.filter(function (x) { return x.querySelector('.mis-b,.jvr-b button'); }).length;
      O.each.push({ i: n, t: t.trim().slice(0, 20), ck: ck.length, done: done, n: bs.length });
    }

    /* ── [2] 🤝 오늘 약속 — 눌러서 켜지나 ── */
    O.b4 = hdr();
    try { HOME_V2.mis(1); } catch (e) {}
    await new Promise((r) => setTimeout(r, 620));
    O.aptSub = ((document.querySelector('#hv2Sheet .sub') || {}).textContent || '').slice(0, 80);
    let hit = 0;
    for (let n = 0; n < 4; n++) {
      const b = sheetBtns().find((x) => /misApt/.test(x.getAttribute('onclick') || ''));
      if (!b) break;
      b.click(); await new Promise((r) => setTimeout(r, 820)); hit++;
    }
    O.hit = hit; O.af = hdr();
    const r1 = document.querySelectorAll('.mis-r')[1];
    O.row1 = r1 ? { done: /(^| )done( |$)/.test(r1.className), c: ((r1.querySelector('.mis-c') || {}).textContent || '') } : null;
    O.qdone = (typeof hmQdoneAll === 'function') ? hmQdoneAll() : null;
    O.aptMsg = sheetTxt().slice(0, 60);

    /* ── [5][6] ⏳ 밀린 것 ── */
    try { HOME_V2.jv(); } catch (e) {}
    await new Promise((r) => setTimeout(r, 650));
    const jt = sheetTxt();
    O.jvLate = /⏳ 밀린 것/.test(jt);
    O.jvLateHead = (jt.match(/⏳ 밀린 것\s*(\d+)개[^·]*·[^·]*·[^·]*/) || [''])[0].slice(0, 70);
    O.jvCard = ((document.querySelector('.jv') || {}).textContent || '').replace(/\s+/g, ' ').trim();
    /* 밀린 줄에 적힌 날짜 — 원래 날(5일 전 · 2일 전)이어야 합니다 */
    const md = (n) => { const t = new Date(Date.now() + n * 86400000); return (t.getMonth() + 1) + '/' + t.getDate(); };
    O.want = [md(-5), md(-2)]; O.today = md(0);
    O.lateHas = O.want.filter((x) => jt.indexOf(x) >= 0).length;
    /* 오늘·내일 약속이 밀린·미리 목록에 또 섰나 — 「약속」 글자가 그 토막에 있나 */
    const seg = jt.slice(jt.indexOf('⏳ 밀린 것') >= 0 ? jt.indexOf('⏳ 밀린 것') : 0);
    const seg2 = seg.slice(0, seg.indexOf('💌') >= 0 ? seg.indexOf('💌') : seg.length);
    O.dupAppt = (seg2.match(/· 약속 \d/g) || []).length;
    O.planN = (jt.match(/미리 세워 둔 연락 (\d+)개/) || ['', '?'])[1];
    return O;
  }, { seed: SEED });

  const 글 = (f) => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { return ''; } };
  const HV = 글('app/home-v2.js'), APP = 글('app/index.html');

  head('[0] 화면이 제대로 섰나 — 아니면 아래가 전부 헛것입니다 (8번)');
  is(!R.gate, '  로그인 칸이 아니라 <b>새 오늘 화면</b>이 섰다' + (R.gate ? ' ← 씨가 모자랍니다' : ''));
  is(R.rows === 5, '  미션 줄이 <b>다섯</b> 섰다 — ' + R.rows + '개');

  head('[1] ★★ <b>미션 다섯을 다 칠 수 있나</b> (1번·6번)');
  (R.each || []).forEach((e) => is(e.done >= 1,
    '  ' + e.i + ' 「' + e.t + '」 완료로 칠 것 ' + e.done + '개 · 체크줄 ' + e.ck + '개'));

  head('[2] ★★ <b>🤝 오늘 약속을 눌러서 켜지나</b>');
  is(R.hit >= 1, '  「✓ 다녀왔어요」 를 <b>누를 수 있다</b> — ' + R.hit + '번 눌렀다');
  is(R.b4 !== R.af, '  누르니 머리 수가 <b>움직인다</b> — ' + R.b4 + ' → ' + R.af);
  is(!!(R.row1 && R.row1.done && R.row1.c === '✓'), '  그 줄이 <b>✓ 로 켜진다</b> — ' + JSON.stringify(R.row1));
  is(!!(R.qdone && R.qdone.length), '  담긴 칸에 <b>남는다</b>(하루치 · 날이 바뀌면 다시) — ' + JSON.stringify(R.qdone));
  is(/다 챙겼어요/.test(R.aptMsg), '  다 치면 <b>그렇게 적는다</b> — ' + R.aptMsg.slice(0, 34));

  head('[3] ★★ <b>적는 자가 하나인가</b> (5번)');
  is(/function misApt\([\s\S]{0,400}hmQfin/.test(HV),
     '  <b>hmQfin 하나</b>를 부른다 — 「지금 이분 카드」 의 「이분 끝」 과 같은 칸');
  is(!/function misApt\([\s\S]{0,500}localStorage/.test(HV) && !/function misApt\([\s\S]{0,500}\.from\(/.test(HV),
     '  <b>새 저장 코드가 없다</b> — 담는 곳을 두 벌로 만들지 않습니다');
  is(/function hmQfin\(/.test(APP) && /hmQdoneSet\(key\)/.test(APP),
     '  본체에 그 자가 있다 — hmQfin → hmQdoneSet');

  head('[4] ★★ <b>단계는 안 바뀌나</b> (1번) — 다녀온 것과 만난 것은 다른 일');
  is(!/function misApt\([\s\S]{0,500}(hdbTo|stage)/.test(HV),
     '  misApt 가 <b>단계를 안 올린다</b> — 안 만나고 미룬 약속이 PC 로 올라가면 안 됩니다');
  is(/만났어요/.test(R.aptSub) && /다녀왔어요/.test(R.aptSub),
     '  화면이 <b>둘을 갈라 말한다</b> — ' + R.aptSub.slice(0, 54));

  head('[5] ★★ <b>⏳ 밀린 것이 서나</b>');
  is(R.jvLate, '  시트에 <b>⏳ 밀린 것</b> 묶음이 선다');
  is(/⏳ 밀린 것 \d+개/.test(R.jvCard), '  카드도 그 수를 적는다 — ' + R.jvCard.slice(0, 64));
  is(R.lateHas === 2, '  날짜가 <b>원래 날</b>이다(' + R.want.join(' · ') + ') — ' + R.lateHas + '/2 찾음');
  is(R.jvCard.indexOf('미리 세운 연락 0개') < 0, '  「미리 세운 연락 0개」 라고 <b>거짓으로 적지 않는다</b>');

  head('[6] ★★ <b>같은 분을 두 번 안 세나</b> (5번)');
  is(R.dupAppt === 0, '  오늘·내일 <b>약속</b>이 밀린·미리 목록에 또 안 선다 — ' + R.dupAppt + '줄');
  is(/if \(x\.k === 'appt' && n < 2\) return;/.test(HV),
     '  그 선이 코드에 적혀 있다 — 위 묶음이 이미 세었습니다');

  head('[7] ★ <b>못 담으면 말하나</b> (1번)');
  is(/function misApt\([\s\S]{0,420}toast/.test(HV),
     '  못 부르면 <b>그렇다고 말한다</b> — 조용히 삼키지 않습니다');

  head('터진 것');
  is(o.errs.length === 0, '  화면이 안 터진다 — ' + (o.errs.length ? o.errs.slice(0, 2).join(' | ') : '0건'));

  await br.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ 미션 완료·밀린 것 점검 — ' + bad + '가지가 어긋났습니다.'); process.exit(1); }
  console.log('✓ 미션 완료·밀린 것 점검 통과 — 다섯을 다 칠 수 있고, 밀린 것이 맨 위에 섭니다.');
})().catch((e) => { console.error('✗ 터졌습니다 — ' + (e && e.message)); try { srv.close(); } catch (x) {} process.exit(1); });
