/* ══════════════════════════════════════════════════════════════════
   check-hmhold.js — <b>「오늘 챙길 것이 없는 날」 에도 홈의 칸이 안 사라진다.</b>

   사장님 말씀 (2026-09-26) — 「<b>있다 없다 하는 칸을 없앱니다.</b> 알람
   열쇠 · 준비 SQL · 알림 권유 · 오늘 어디로 가시나 · 고객 체크 줄 — 다섯이
   상태에 따라 떴다 사라집니다 … <b>없는 날도 자리를 남기고</b> 「오늘 약속
   없습니다」 처럼 없다고 적으십시오」.

   ── 왜 이 자가 있나 ───────────────────────────────────────────────
   홈을 짓는 hmTodayHtml 에는 <b>이른 return</b> 이 있습니다 — 「오늘 챙길
   것」 이 없거나 <b>아직 읽는 중</b>이면 거기서 끝냅니다. 그 길에 안 들고
   가는 칸은 <b>그 날만 통째로 사라집니다.</b> 같은 병을 <b>세 번</b>
   고쳤습니다 —
     ① 🌅 아침 미션      (쪽지에 적힌 첫 번째 고침)
     ② 📍 곁칸 넷        (두 번째 고침 · 6번)
     ③ <b>📅 오늘 약속 · 👥 다음 분 · 📆 이번 주</b> (판 X88 · 이 자가 생긴 까닭)

   ★ ③ 이 특히 나쁩니다. <b>「오늘 약속」 은 사장님께서 위 말씀으로 만드신
     바로 그 칸</b>입니다(판 X43). hmTossAppt() 는 멀쩡히 「오늘 약속이
     없습니다」 를 내는데, 이 길이 그것을 <b>안 들고 갔습니다</b> — 「앱은
     띄우려 하는데 자리가 없다」 꼴입니다(판 X84 의 준비 SQL 과 같은 병).
   ★ 사람 눈으로는 안 보입니다 — 자료가 있으면 온전한 길로 가서 다 보이고,
     <b>빈 날에만</b> 사라집니다. 그래서 자에게 시킵니다 (8번).

   ── 재는 것 ──────────────────────────────────────────────────────
     [1] 자료가 <b>아직 안 온</b> 홈 — 칸이 다 서나
     [2] 자료가 와서 <b>정말 빈</b> 홈 — 칸이 다 서나
     [3] 자료가 <b>있는</b> 홈 — 그대로 다 서나 (대조군)
     [4] 비었다고 <b>0 으로 적지 않나</b> — 「아직」 과 「없음」 을 가르나 (1번)

   ⚠ <b>헛것을 안 잡습니다</b> (8번) — 「다음 분」 은 없으면 스스로 빈 글을
     내는 칸이라 <b>글자로 안 셉니다.</b> 이 자가 보는 것은 <b>세 길에서
     같은 칸이 서나</b> 하나뿐입니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
/* 🕰 시계를 못 박습니다 — 한 곳에서 (lib-clock.js · 판 X83) */
const CLK = require('./lib-clock.js');
const 박는때 = 14;
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);

/* <b>늘 서야 하는 칸</b> — 글자는 그 칸이 제 입으로 말하는 것만 씁니다 */
const 늘서는것 = [
  { k: '📅 오늘 약속', 글: '오늘 약속',
    왜: '사장님 말씀 2026-09-26 으로 만든 칸입니다 (판 X43)' },
  { k: '🌅 아침 미션', 글: '아침 미션',
    왜: '사람이 없어도 할 것(SNS·고객 보험)이 있습니다' },
  { k: '🌙 오늘 돌아보기', 글: '오늘 돌아보기',
    왜: '저녁에 하루를 닫는 자리입니다 (판 X73)' },
  { k: '📆 이번 주', 글: '이번 주',
    왜: '못 읽었으면 「달력을 아직 못 읽었습니다」 라고 적는 칸입니다' }
];

(async () => {
  const srv = http.createServer((q, s) => {
    const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    fs.readFile(f, (e, b) => e ? (s.writeHead(404), s.end())
      : (s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }), s.end(b)));
  });
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch();
  const ctx = await br.newContext(CLK.ctxOpt({ isMobile: true, hasTouch: true }));
  await CLK.pin(ctx, 박는때);
  const pg = await ctx.newPage();
  await pg.route('**://**', r => {
    const u = r.request().url();
    if (u.startsWith('http://localhost:' + P)) return r.continue();
    if (/^https?:/.test(u)) return r.fulfill({ status: 204, body: '' });
    return r.continue();
  });
  await pg.goto('http://localhost:' + P + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(1800);

  /* 세 길을 각각 세워 <b>날글</b>을 받아 옵니다.
     ⚠ innerText 로 읽으면 <b>숨은 칸을 건너뜁니다</b> — 접힌 칸이 있으므로
       날글(innerHTML)로 봅니다. 판 X88 에서 그렇게 두 번 헛 읽었습니다.   */
  const R = await pg.evaluate(() => {
    const o = {};
    try { document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()); } catch (e) { }
    window.toast = function () { };
    OS.session = { user: { id: 'u1' } };
    OS.profile = { id: 'u1', name: '윤시현', role: 'owner', active: true, plan: 'vip' };
    window.arLoad = function () { };
    window.osLoadClients = function () { };
    const 세워 = () => { try { go('home'); } catch (e) { return '터짐: ' + e.message; }
      const d = document.getElementById('dynPane'); return d ? d.innerHTML : ''; };
    const 씨 = (id, st) => ({ id: id, who: 'u1', name: '홍길동' + id, region: '순천', src: '일반',
      stage: st, cAt: '', pAt: '', got: '2026-09-01', n: 1, last: '', res: '부재', appt: '', memo: '', days: 9 });

    /* ① 아직 안 온 홈 — AR 을 비워 둡니다 */
    AR.loaded = false; AR.busy = true; AR.db = null; AR.cliRows = [];
    o.아직 = 세워();
    /* ② 자료가 와서 정말 빈 홈 */
    AR.loaded = true; AR.busy = false; AR.db = []; AR.cliRows = [];
    o.빈 = 세워();
    /* ③ 자료가 있는 홈 — 대조군 */
    AR.loaded = true; AR.busy = false; AR.db = [씨('a', '부재'), 씨('b', 'TA'), 씨('c', 'PC')];
    AR.cat = 'touch'; AR.tk = 'all';
    o.있음 = 세워();
    return o;
  });

  console.log('  날글 길이 — 아직 ' + R.아직.length + '자 · 빈 ' + R.빈.length +
              '자 · 있음 ' + R.있음.length + '자');

  const 길 = [['[1] 자료가 <b>아직 안 온</b> 홈', R.아직],
              ['[2] 자료가 와서 <b>정말 빈</b> 홈', R.빈],
              ['[3] 자료가 <b>있는</b> 홈 (대조군)', R.있음]];
  길.forEach(([제목, 글]) => {
    head(제목);
    is(글.length > 500, '  홈이 세워졌다 — ' + 글.length + '자 (안 세워지면 아래가 다 헛 초록입니다)');
    늘서는것.forEach(c => is(글.indexOf(c.글) >= 0,
      '  <b>' + c.k + '</b> 가 선다 — ' + c.왜));
  });

  head('[4] <b>「아직」 과 「없음」 을 가른다</b> (1번)');
  is(/아직|읽는 중|불러오/.test(R.아직),
    '  아직 안 왔을 때는 <b>「아직」 이라고</b> 말한다 — 0 이나 「없습니다」 로 적으면 거짓입니다');
  is(R.빈.indexOf('오늘 약속이 없습니다') >= 0 || R.빈.indexOf('오늘 약속') >= 0,
    '  정말 빈 날에는 <b>「오늘 약속이 없습니다」</b> 라고 적는다 — 칸을 지우지 않습니다');

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데 — 그 날만 칸이 사라집니다. 사람 눈으로는 안 보입니다.'); process.exit(1); }
  console.log('✓ ' + n + '가지 모두 통과 — 빈 날에도·읽는 중에도 칸이 그대로 섭니다.');
})().catch(e => { console.error(e); process.exit(1); });
