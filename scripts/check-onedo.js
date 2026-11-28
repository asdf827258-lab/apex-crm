/* 🎯🛰 <b>오늘 할 일을 한 곳에서 따라가며 할 수 있나</b> — 판 X599

   사장님 말씀 (2026-11-28) —
     「자비스가 챙기는중 이 오늘의 미션하고 비슷한데, 이걸 <b>하나로 오늘 할일을
      따라가면서 할수 있도록</b> 하고 싶어, 오늘의 미션은 <b>그냥 알려만 주는거라서</b> 아쉽거든」

   ── 재어 보고 찾은 것 ───────────────────────────────────────────────
   ① <b>같은 분이 두 칸에 나란히</b> 서 있었습니다 — 홍길동마님 16:00 약속이
      미션 ②와 챙기는 중 「오늘」 양쪽에, 내일 약속이 미션 ④와 「노쇼」 양쪽에.
   ② <b>할 수 있는 단추는 한쪽에만</b> 있었습니다. 미션 시트의 「자비스가 짠 순서」 는
      <b>다른 화면으로 보내는 단추가 8·3·5·3·2개</b>인데 그 자리에서 끝내는 단추는
      1~2개뿐이었고, 챙기는 중은 줄마다 2~4개였습니다 — 「그냥 알려만 주는」 이
      그 자리입니다 (1번).
   ③ <b>미션 안에서도 겹쳤습니다</b> — hmLeft 가 약속 줄까지 안고 있어 같은 분이
      📞 와 🤝 양쪽에 서고, 두 단추가 <b>같은 칸(hmQfin)</b>을 건드려 한쪽을 누르면
      다른 쪽도 사라졌습니다 (5번).
   ④ 고치는 길에 <b>제가 버그를 하나 넣었다가 잡았습니다</b> — jvData 를 한 번만
      돌게 아꼈더니(7번) 「⏭ 오늘 넘김」 뒤 다시 그릴 때 <b>낡은 값을 그대로 써서
      줄이 안 빠졌습니다.</b> 아끼려다 거짓말을 하면 안 됩니다 (1번).

   ── 여기서 재는 것 ─────────────────────────────────────────────────
     [1] ★★ <b>미션을 열면 그 자리에서 할 수 있나</b> — 사람이 있는 미션마다
            사람 줄 + <b>끝내는 단추</b>
     [2] ★★ <b>같은 분이 미션과 챙기는 중 두 곳에 안 서나</b> (사장님 말씀의 핵심 · 5번)
     [3] ★★ <b>미션 안에서도 안 겹치나</b> — 약속은 ②만, 📞 에는 안 섬
     [4] ★★ <b>옮기면서 단추를 안 잃었나</b> (6번) — 만났어요 · 다시 약속 ·
            거절로 정리 · ✓ 했어요 가 미션 쪽에 그대로
     [5] ★★ <b>어디로 갔는지 적나</b> (1번) — 소리 없이 사라지면 빠뜨린 줄 압니다
     [6] ★★ <b>누르면 정말 빠지나</b> — 미션에서 끝내면 그 줄이 빠지고 수가 준다
     [7] ★★ <b>챙기는 중 수가 보이는 줄만 세나</b> (1번)
     [8] ★★ <b>새 저장 코드가 없나</b> (5번) · <b>서버를 안 더 부르나</b> (7번)
     [9] ★  <b>아끼다 낡은 값을 쓰지 않나</b> — 다시 그리기 전에 비우나

   ⚠ <b>안 재는 것과 까닭</b> (8번) —
     · 칸 차례 · 옷이 새는지는 <b>check-homev2</b>, 미션 완료·밀린 것은
       <b>check-misdone</b>, 길이·글씨는 <b>check-phonefit</b> · <b>check-easy</b> 가
       임자입니다. 두 자가 같은 것을 세면 어긋납니다 (5번).
     · 사장님 <b>진짜 서버는 한 번도 안 부릅니다</b> — 바깥은 전부 끊습니다.          */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 9383;
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

(async () => {
  await new Promise((r) => srv.listen(PORT, r));
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 390, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('apex_home_v2', '1'); } catch (e) {} });
  const 바깥 = [];
  await ctx.route('**://**', (r) => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
    바깥.push(u.slice(0, 70)); return r.abort();
  });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', (x) => errs.push(String(x && x.message).slice(0, 110)));
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForTimeout(3300);
  const 뜰때 = 바깥.slice();

  const R = await pg.evaluate(async (a) => {
    (0, eval)(a.seed);
    const O = {};
    const d = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10), td = d(0);
    /* 고객 이름은 <b>홍길동 식구</b>로만 (CLAUDE.md 3번) */
    window.AR = window.AR || {}; AR.loaded = true; AR.busy = false; AR.cliRows = [];
    AR.db = [
      { id: 'p1', who: 'u1', name: '홍길동가', region: '순천', src: '일반', stage: 'AP', appt: d(-3) + 'T10:00', n: 1, days: 9 },
      { id: 'p2', who: 'u1', name: '홍길동나', region: '순천', src: '일반', stage: 'PC', appt: d(-1) + 'T14:00', n: 1, days: 9 },
      { id: 'p3', who: 'u1', name: '홍길동다', region: '순천', src: '일반', stage: 'AP', appt: d(1) + 'T11:00', n: 1, days: 9 },
      { id: 'p4', who: 'u1', name: '홍길동라', region: '순천', src: '일반', stage: '계약완료', appt: '', n: 1, days: 20 },
      { id: 'p5', who: 'u1', name: '홍길동마', region: '순천', src: '일반', stage: 'AP', appt: td + 'T16:00', n: 1, days: 2 }];
    /* ⚡ 한 번 그리는 동안 달력을 몇 번 훑나 — jvData 하나마다 한 번입니다 (7번) */
    let 달력 = 0; const mi = window.mcalItems;
    window.mcalItems = function () { 달력++; return mi.apply(this, arguments); };
    try { go('home'); } catch (e) { O.goErr = String(e).slice(0, 70); }
    await new Promise((r) => setTimeout(r, 2200));
    달력 = 0;
    try { HOME_V2.paint(); } catch (e) { O.paintErr = String(e).slice(0, 70); }
    await new Promise((r) => setTimeout(r, 1100));
    O.달력 = 달력;

    const el = (i) => document.getElementById(i);
    const 보임 = (x) => { if (!x) return false; const r = x.getBoundingClientRect(); const c = getComputedStyle(x);
      return r.width > 0 && r.height > 0 && c.display !== 'none'; };
    const 글 = (x) => x ? String(x.textContent || '').replace(/\s+/g, ' ').trim() : '';
    const 시트 = () => el('hv2Sheet');
    /* 사람 이름을 <b>할 수 있는 줄(.jvr)에서만</b> 뽑습니다 — 「홍길동가님」 꼴.
       ⚠ 처음에는 시트 글 <b>전체</b>에서 뽑았더니, 자비스가 적어 준 안내 문장
         (「홍길동마님 · 홍길동가님 외 2명 — 안 받으시면 카톡으로」) 속 이름까지
         「겹친다」 고 세어 멀쩡한 자리를 빨간불로 읽었습니다. 겹치면 안 되는 것은
         <b>할 수 있는 줄</b>이지 안내 글이 아닙니다 (8번). */
    const 이름들 = (root) => { const S = {};
      if (root) Array.from(root.querySelectorAll('.jvr .jvr-n')).filter(보임).forEach((x) => {
        String(x.textContent || '').replace(/홍[가-힣]{1,4}님/g, (m) => { S[m] = 1; return m; }); });
      return Object.keys(S).sort(); };

    /* ── [1] 미션 다섯 — 열면 할 수 있나 ── */
    O.미션 = [];
    for (let i = 0; i < 5; i++) {
      HOME_V2.mis(i); await new Promise((r) => setTimeout(r, 420));
      const s = 시트();
      const 줄 = s ? Array.from(s.querySelectorAll('.jvr')).filter(보임) : [];
      const 끝 = 줄.filter((x) => x.querySelector('.jvr-b button')).length;
      O.미션.push({ i, 제목: 글(s && s.querySelector('h1')).slice(0, 16), 줄: 줄.length, 끝: 끝,
        이름: 이름들(s), 단추: 줄.length ? Array.from(줄[0].querySelectorAll('.jvr-b button')).map(글) : [] });
      HOME_V2.close(); await new Promise((r) => setTimeout(r, 230));
    }
    /* ── [1-2] 카드 딱지 수와 자비스 줄이 <b>같은 답</b>인가 (1번) ── */
    O.딱지 = Array.from(document.querySelectorAll('#hv2 .mis-r')).map((r) => ({
      이름: 글(r.querySelector('.mis-t b')),
      건: 글(r.querySelector('.mis-n')),
      말: 글(r.querySelector('.mis-j')) }));
    O.머리 = 글(document.querySelector('#hv2 .mis .mis-h span'));
    /* ── [2] 챙기는 중에 누가 남았나 ── */
    HOME_V2.jv(); await new Promise((r) => setTimeout(r, 620));
    const s2 = 시트();
    O.챙김 = { 이름: 이름들(s2), 글: 글(s2).slice(0, 900),
      딱지: Array.from(s2.querySelectorAll('.jvr .jvw')).filter(보임).map(글),
      묶음: Array.from(s2.querySelectorAll('h2')).map(글),
      갈래머리: Array.from(s2.querySelectorAll('.jvg-h')).map((x) => 글(x).slice(0, 10)) };
    HOME_V2.close(); await new Promise((r) => setTimeout(r, 260));
    /* ── [6] 미션 ③(기록)에서 하나 넘겨 보기 ── */
    HOME_V2.mis(2); await new Promise((r) => setTimeout(r, 480));
    const s3 = 시트();
    O.전줄 = Array.from(s3.querySelectorAll('.jvr')).filter(보임).length;
    O.전카드 = 글(document.querySelector('#hv2 .mis .mis-h span'));
    const skip = Array.from(s3.querySelectorAll('.jvr-b button')).filter((b) => /오늘 넘김/.test(글(b)))[0];
    O.눌렀나 = !!skip;
    if (skip) { skip.click(); await new Promise((r) => setTimeout(r, 900)); }
    const s4 = 시트();
    O.후줄 = s4 ? Array.from(s4.querySelectorAll('.jvr')).filter(보임).length : -1;
    O.후카드 = 글(document.querySelector('#hv2 .mis .mis-h span'));
    HOME_V2.close(); await new Promise((r) => setTimeout(r, 260));
    /* ── [7] 챙기는 중 수 ── */
    HOME_V2.jv(); await new Promise((r) => setTimeout(r, 560));
    O.챙김수 = 글(시트() && 시트().querySelector('.jvp span'));
    HOME_V2.close();
    return O;
  }, { seed: SEED });

  head('[0] 화면이 제대로 섰나 — 아니면 아래가 전부 헛것입니다 (8번)');
  is((R.미션 || []).length === 5, '  미션 다섯을 다 열었다 — ' + (R.미션 || []).length + '개');
  is(!R.goErr && !R.paintErr, '  그리다 안 터졌다' + (R.goErr || R.paintErr ? ' ← ' + (R.goErr || R.paintErr) : ''));

  head('[1] ★★ <b>미션을 열면 그 자리에서 할 수 있나</b>');
  const 사람미션 = (R.미션 || []).filter((m) => m.줄 > 0);
  is(사람미션.length >= 3, '  사람 줄이 서는 미션이 셋 이상 — ' + 사람미션.length + '개 (' +
    사람미션.map((m) => m.i + '「' + m.제목 + '」' + m.줄 + '줄').join(' · ') + ')');
  사람미션.forEach((m) => is(m.끝 === m.줄,
    '  ' + m.i + ' 「' + m.제목 + '」 — 모든 줄에 <b>그 자리에서 끝내는 단추</b>가 있다 (' + m.끝 + '/' + m.줄 + ') ' +
    (m.단추.length ? '← ' + m.단추.join(' | ') : '')));

  /* ⚠ 사진을 찍어 보고 찾았습니다 — 딱지는 「2건」 인데 자비스 줄은 「외 5명」 이라
     <b>한 화면이 같은 물음에 두 답</b>을 했습니다. misSay 가 hmLeft 를 통째로 세고,
     딱지는 임자 뺀 수를 세고 있었습니다 (1번 · 5번). */
  const 건 = (R.딱지 || []).map((x) => parseInt(String(x.건).replace(/[^0-9]/g, ''), 10) || 0);
  const 합 = 건.reduce((a, b) => a + b, 0), 머리수 = parseInt((String(R.머리).match(/할 일 (\d+)건/) || [0, 0])[1], 10) || 0;
  is(합 === 머리수, '  머리의 「할 일 N건」 = 줄 딱지의 합 — ' + 머리수 + ' vs ' + 건.join('+') + ' = ' + 합);
  const 어긋 = (R.딱지 || []).filter((x) => { const n = parseInt(String(x.건).replace(/[^0-9]/g, ''), 10) || 0;
    const m = String(x.말).match(/외 (\d+)명/); return n && m && (parseInt(m[1], 10) + 2) !== n; });
  is(어긋.length === 0, '  자비스 줄의 사람 수가 <b>딱지와 같다</b>' +
    (어긋.length ? ' ← ' + 어긋.map((x) => x.이름 + ' 딱지 ' + x.건 + ' / 「' + x.말.slice(0, 30) + '」').join(' | ') : ''));

  head('[2] ★★ <b>같은 분이 미션과 챙기는 중 두 곳에 안 서나</b> (사장님 말씀의 핵심 · 5번)');
  const 미션이름 = {}; (R.미션 || []).forEach((m) => (m.이름 || []).forEach((n) => { 미션이름[n] = (미션이름[n] || []).concat(m.i); }));
  const 겹 = (R.챙김.이름 || []).filter((n) => 미션이름[n]);
  is(겹.length === 0, '  미션에 선 분이 챙기는 중에 <b>또 서지 않는다</b> — ' +
    (겹.length ? 겹.length + '명 ← ' + 겹.join(' · ') : '0명') + ' (미션 ' + Object.keys(미션이름).length + '명 · 챙기는 중 ' + (R.챙김.이름 || []).length + '명)');
  /* ⚠ <b>사람이 아니라 일로</b> 봅니다 — 같은 분이라도 「전화」 와 「증권 전달」 은 다른 일입니다.
     겹치면 안 되는 것은 <b>약속 · 지난 약속</b> 이고, 그것은 이제 미션이 안습니다. */
  is((R.챙김.딱지 || []).every((x) => /증권|소개/.test(x)),
    '  챙기는 중에 남은 줄은 <b>증권 · 소개</b>뿐 — ' + ((R.챙김.딱지 || []).join(' · ') || '(없음)'));

  head('[3] ★★ <b>미션 안에서도 안 겹치나</b> (5번)');
  /* ⚠ hmLeft 가 약속 줄까지 안고 있어, 같은 분이 📞 와 🤝 양쪽에 서고
     두 단추가 같은 칸(hmQfin)을 건드렸습니다 — 한쪽을 누르면 다른 쪽도 사라집니다. */
  const 안겹 = Object.keys(미션이름).filter((n) => 미션이름[n].length > 1);
  is(안겹.length === 0, '  한 분이 미션 <b>둘에 걸쳐 서지 않는다</b> — ' +
    (안겹.length ? 안겹.map((n) => n + '(' + 미션이름[n].join(',') + ')').join(' · ') : '0명'));
  is(/x && x\.k !== 'appt'/.test(HV), '  그 선이 코드에 적혀 있다 — 약속은 ② 「오늘 약속」 이 임자');

  head('[4] ★★ <b>옮기면서 단추를 안 잃었나</b> (6번)');
  const 모든단추 = [].concat.apply([], (R.미션 || []).map((m) => m.단추 || []));
  const 있나 = (t) => 모든단추.some((x) => x.indexOf(t) >= 0) || (R.미션 || []).some((m) => (m.이름 || []).length && false);
  is((R.미션 || []).some((m) => (m.단추 || []).some((b) => /만났어요/.test(b))), '  🤝 만났어요 가 미션 쪽에 그대로 선다');
  is((R.미션 || []).some((m) => (m.단추 || []).some((b) => /다시 약속/.test(b))), '  📅 다시 약속 이 미션 쪽에 그대로 선다');
  is((R.미션 || []).some((m) => (m.단추 || []).some((b) => /오늘 넘김/.test(b))), '  ⏭ 오늘 넘김 이 미션 쪽에 그대로 선다');
  is((R.미션 || []).some((m) => (m.단추 || []).some((b) => /했어요|다녀왔어요/.test(b))), '  ✓ 했어요 · 다녀왔어요 가 미션 쪽에 그대로 선다');

  head('[5] ★★ <b>어디로 갔는지 적나</b> (1번)');
  is(/「오늘의 미션」 에서 챙겨요/.test(R.챙김.글), '  챙기는 중이 <b>어디서 챙기는지</b> 적는다 — 소리 없이 사라지면 빠뜨린 줄 압니다');
  is((R.챙김.갈래머리 || []).every((x) => !/약속 확인|약속 지남/.test(x)),
    '  약속 · 지난 약속 묶음은 여기 안 선다 — ' + ((R.챙김.갈래머리 || []).join(' · ') || '(없음)'));

  head('[6] ★★ <b>누르면 정말 빠지나</b>');
  is(R.눌렀나, '  미션 ③ 에 「⏭ 오늘 넘김」 이 있다');
  is(R.후줄 >= 0 && R.후줄 === R.전줄 - 1, '  누르니 <b>그 줄이 빠진다</b> — ' + R.전줄 + '줄 → ' + R.후줄 + '줄');
  is(R.전카드 !== R.후카드, '  카드 머리의 <b>수도 움직인다</b> — ' + R.전카드 + ' → ' + R.후카드);

  head('[7] ★★ <b>챙기는 중 수가 보이는 줄만 세나</b> (1번)');
  is(/^오늘 \d+ \/ \d+ 마침$/.test(R.챙김수 || ''), '  「오늘 n / m 마침」 이 선다 — ' + R.챙김수);
  /* ⚠ 처음에는 <code>function jvFin</code> 이라는 <b>글자</b>를 봤는데, 속을 비워도
     글자는 그대로라 <b>안 울었습니다</b>. 보는 것은 수입니다 — 바로 앞 [6] 에서 미션 ③ 의
     한 줄을 「⏭ 오늘 넘김」 으로 치웠으니, 챙기는 중의 「마침」 에는 그것이
     <b>안 들어가야</b> 합니다(거기 안 보이는 줄이니까 · 1번). */
  is(/^오늘 0 \/ \d+ 마침$/.test(R.챙김수 || ''),
    '  미션에서 치운 줄이 <b>챙기는 중 「마침」 에 안 섞인다</b> — ' + R.챙김수 + ' (미션 ③ 에서 한 줄을 넘긴 뒤)');

  head('[8] ★★ <b>새 저장 코드가 없나</b> (5번) · <b>서버를 안 더 부르나</b> (7번)');
  const 덩이 = HV.slice(HV.indexOf('  function misKey('), HV.indexOf('  function misPlan('));
  is(덩이.length > 1200 && !/setItem|\.rpc\(|\.from\(|fetch\(|localStorage/.test(덩이),
    '  새로 만든 자리가 <b>담지도 서버를 부르지도 않는다</b> — 있던 함수만 (' + 덩이.length + '자)');
  is(/HOME_V2\.misApt\(/.test(HV) && /hmQfin/.test(HV) && /jvBtns\(it\.jx\)|jvRow\(it\.jx\)/.test(HV),
    '  끝내는 길은 <b>있던 것</b> — hmQfin(「이분 끝」 과 같은 칸) · jvBtns(챙기는 중과 같은 단추)');
  const 뒤 = 바깥.slice(뜰때.length);
  is(뒤.length === 0, '  재는 동안 <b>바깥을 한 번도 안 불렀다</b> — ' +
    (뒤.length ? 뒤.slice(0, 2).join(' | ') : '0번') + ' (화면이 뜰 때 부른 글씨체·라이브러리 ' + 뜰때.length + '건은 뺐습니다)');

  head('[9] ★ <b>아끼다 낡은 값을 쓰지 않나</b> (7번 · 1번)');
  /* ⚠ <b>여기는 「한 번만」 이 아니라 「더 나빠지지 않게」 를 지킵니다.</b>
     재어 보니 <b>main 이 이미 95번</b>이었습니다 — 한 번 그리라고 불러도 화면이 여러 번
     지어지고 있었습니다(관찰자 · 타이머). 그것은 이번 판이 만든 것이 아니고 따로 볼
     자리라, 여기서 고치는 척하지 않습니다 (1번). 이 판은 미션 다섯이 저마다 jvData 를
     부르지 않게(jvOnce) · 미션마다 두 번 묻지 않게(MIC) 묶어 <b>99번</b>입니다.
     늘면 웁니다 — 줄이면 이 수도 같이 내려 주십시오 (0-1번). */
  is(R.달력 <= 101, '  달력 훑기가 <b>늘지 않았다</b> — ' + R.달력 + '번 (main 95번 · 지금 99 · 바닥값 101 — 묶음을 풀면 103) ' +
    '← jvOnce · misItems 묶기가 풀리면 여기가 먼저 웁니다');
  is(/function jvFresh\(\)/.test(HV) && (HV.match(/jvFresh\(\);/g) || []).length >= 2,
    '  <b>다시 그리기 전에 비운다</b> — 안 비우면 「⏭ 오늘 넘김」 을 눌러도 줄이 그대로 섭니다');

  head('터진 것');
  is(errs.length === 0, '  화면이 안 터진다 — ' + (errs.length ? errs.slice(0, 2).join(' | ') : '0건'));

  await br.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ 오늘 한 바퀴 점검 — ' + bad + '가지가 어긋났습니다.'); process.exit(1); }
  console.log('✓ 오늘 한 바퀴 점검 통과 — 미션에서 그 자리에서 할 수 있고, 같은 분이 두 곳에 안 섭니다.');
})().catch((e) => { console.error('✗ 터졌습니다 — ' + (e && e.message)); try { srv.close(); } catch (x) {} process.exit(1); });
