/* 🔌 앱을 <b>켤 때 · 화면을 열 때</b> 서버를 몇 번 부르나 — 판 X281

   사장님 말씀 (2026-11-01) — 「응 <b>서버켤때 부르는거 줄여줘</b>」.

   ── 왜 이 자가 필요한가 ──────────────────────────────────────────────
   무료 한도를 <b>세 배</b>로 넘겨 로그인까지 막힌 적이 있습니다(CLAUDE.md 7번).
   그런데 「켤 때 몇 번 부르나」 를 <b>재는 자가 한 곳도 없었습니다.</b>
   check-egress 는 <b>코드 모양</b>(되풀이·미리받기)을 보지, 실제로 몇 번
   나가는지는 안 셉니다.

   ⚠⚠ <b>제가 그래서 두 번 틀렸습니다</b> (8번) —
     ① 매번 <b>새 브라우저</b>로 열어 늘 「오늘 처음」 이라, 하루 한 번인 출발
        점검을 「켤 때마다 18번」 이라고 사장님께 말씀드렸습니다.
     ② 서버를 <b>전부 막아</b> 모든 부름이 실패했습니다. 앱의 막이(「3분 안엔
        다시 안 읽는다」 · 「이미 읽었다」)는 <b>성공해야</b> 걸립니다. 그래서
        멀쩡한 자리를 「되풀이한다」 고 고발했습니다.
   ★ 그래서 이 자는 <b>줄이 있는 가짜 서버</b>를 세우고, <b>한 창을 이어서</b>
     여러 번 켭니다. 사장님 진짜 서버로는 한 글자도 안 나갑니다.

   ── 여기서 재는 것 ──────────────────────────────────────────────────
     [1] 그날 <b>처음</b> 켤 때 몇 번인가
     [2] 같은 기기로 <b>다시</b> 켤 때 몇 번인가 (출발 점검이 또 돌면 안 됩니다)
     [3] 홈을 <b>처음</b> 열 때 · <b>다시</b> 열 때
     [4] ★ <b>가만히 두면 0번</b> 인가 (7번 — 되풀이해서 부르지 않는다)
     [5] ★ 같은 화면을 <b>다시 그려도</b> 0번인가
     [6] ★★ <b>같은 물음을 두 번 하지 않는가</b> (5번) — 무거운 표를 몇 번 읽나

   ★ 수는 <b>늘면 빨간불</b>입니다. 줄이면 기준선도 같이 내립니다 (0-1번).   */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8956;

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* ── 가짜 서버 — 줄이 <b>있는</b> 답. 이름은 홍길동 집안 (3번) ────────── */
/* 「시계안박음OK」 — 이 자는 <b>몇 번 부르나</b>만 셉니다. 때에 따라 달라지는
   길이·글자를 안 재므로 시계를 못 박지 않습니다. 날짜는 가짜 줄에 넣는
   값일 뿐이고, 앱과 견주는 날짜 도장은 아래에서 <b>앱의 hxToday()</b> 를
   빌려 씁니다 — 자가 제 손으로 날짜를 지으면 하루 갈립니다.
   ⚠ 맨 UTC 로 뽑지 않습니다(한국 날짜로 아홉 시간 더합니다) — check-clockfree. */
const 오늘 = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
const 때 = new Date().toISOString();
const 집안 = ['홍길동', '홍길순', '홍갑돌', '홍말순', '홍판서'];
const 줄 = (tbl, i) => ({
  id: tbl + '-' + i, member_id: 'me', advisor_id: 'me', created_by: 'me', assigned_to: 'me',
  name: 집안[i % 5], name_masked: 집안[i % 5].charAt(0) + '○' + 집안[i % 5].charAt(2),
  customer_name: 집안[i % 5], role: 'advisor', active: true, workspace: 'apex',
  phone: '010-0000-000' + i, region: '순천시', assigned_date: 오늘, stage: 'TA',
  created_at: 때, call_at: 때, att_date: 오늘, check_date: 오늘, appointment_at: null,
  result: '부재', memo: '', scope: 'day', items: {}, body: '', mood: '', share: false,
  client_id: 'clients-' + i, kind: 'client_meta', content: {}, title: '보고',
  team_id: 't1', leader_id: 'me', team: '1팀', text: '공지', author: '홍길동',
  targets: [], must_ack: false, consent_status: 'ok', birth_year: 1980 + i,
  household_notes: '', ok_count: 1, warn_count: 0, bad_count: 0, detail: [],
  due: '', plan: '', value: '', key: '', data: {}
});
const 답 = (u) => {
  const m = String(u).match(/\/rest\/v1\/([a-zA-Z0-9_]+)/);
  const rows = []; for (let i = 0; i < 3; i++) rows.push(줄(m ? m[1] : 'x', i));
  return { status: 200,
    headers: { 'content-type': 'application/json', 'content-range': '0-2/3',
               'access-control-allow-origin': '*' },
    body: JSON.stringify(rows) };
};

/* ── 부르는 자리를 이름까지 적는 껍데기 ─────────────────────────────── */
const HOOK = function () {
  window.__FROM = [];
  var 걸었나 = false;
  var 줄뽑기 = function (st) {
    return String(st || '').split('\n').slice(2).map(function (x) { return x.trim() })
      .filter(function (x) { return /index\.html|apex-/.test(x) })
      .map(function (x) {
        var f = x.match(/at ([A-Za-z0-9_$.]+)/), l = x.match(/:(\d+):\d+/g);
        return (f ? f[1] : '?') + '@' + (l ? l[l.length - 1].split(':')[1] : '?');
      });
  };
  var 걸기 = function () {
    if (걸었나 || typeof window.osClient !== 'function') return;
    var 원 = window.osClient;
    window.osClient = function () {
      var c = 원.apply(this, arguments);
      if (c && typeof c.from === 'function' && !c.__wrapped) {
        c.__wrapped = 1; var f = c.from.bind(c);
        c.from = function (n) {
          var st = ''; try { throw new Error('x') } catch (e) { st = e.stack }
          window.__FROM.push({ n: n, mark: window.__MARK || '', st: 줄뽑기(st).slice(0, 5) });
          return f(n);
        };
      }
      return c;
    };
    걸었나 = true;
  };
  var iv = setInterval(걸기, 20); setTimeout(function () { clearInterval(iv) }, 200000);
};

const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

/* ★ 기준선 — <b>세어서 적은 수</b>입니다 (2026-11-01 · 판 X281).
   늘면 빨간불입니다. 줄이면 이 줄을 같이 내리십시오 (0-1번).          */
/* ⚠ 2026-11-01 · 판 X281 에서 <b>줄였으니 기준선도 같이 내립니다</b> (0-1번) —
   홈 처음 <b>28 → 24</b>. 무엇보다 <b>고객 표가 홈 한 번에 4번 → 1번</b>입니다
   (사장님 서버에 고객이 1,943분 계십니다 — 네 벌 받던 것을 한 벌로).
   담당자 표도 <b>2번 → 1번</b>.
   ⚠ 관리 기록(saved_reports)은 <b>안 묶었습니다</b> — 묶었더니 「방금 저장한
     것이 안 보인다」 가 되어 되돌렸습니다(까닭은 cmLoadAll 머리에 적었습니다).
     그래서 제일 많이 읽는 표는 7 그대로이고, 고객 목록도 6 그대로입니다.   */
/* ⬆ 판 X412 · 2026-11-11 — 홈처음 24 → <b>25</b>. 한 번 늘었고, 그 한 번이
   무엇인지 적습니다: <b>tsayLoad</b> — 사장님이 고치신 TA 첫 마디
   (stage_says)를 받아 옵니다. 사장님 말씀 「내가 수정하고 <b>공유</b>할수
   있도록」 이라 <b>받아 와야 팀이 같은 말을 씁니다</b>.
   ★ <b>조일 만큼 조였습니다</b> — 한 세션에 한 번이던 것을 <b>하루에 한 번</b>
     으로 줄였습니다(tsayFresh). 받아 둔 것은 이 기기에 남아, 그날 두 번째
     부터는 <b>0번</b>입니다. 안 보는 화면(document.hidden)에서도 안 묻습니다.
   ⚠ <b>올리기만 하는 선은 선이 아닙니다</b> — 다음에 또 올리실 때는 무엇을
     줄였는지 먼저 적어 주십시오. */
const 선 = { 처음: 19, 다시: 2, 홈처음: 25, 홈다시: 0, 고객: 6, 가만히: 0, 다시그리기: 0,
             무거운표: 7, 고객표: 1, 담당자표: 1 };

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 } });
  await ctx.addInitScript(HOOK);
  let 바깥 = 0;
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.startsWith('http://127.0.0.1:' + PORT)) return r.continue();
    /* ★ 사장님 서버·우리 함수는 가짜가 받습니다 — 진짜로는 안 나갑니다 */
    if (/supabase\.co|\/api\//.test(u)) { 바깥++; return r.fulfill(답(u)) }
    return r.continue();                 /* 라이브러리(CDN)는 받아야 앱이 섭니다 */
  });

  const 켜기 = async (mark) => {
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 120)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => typeof go === 'function', { timeout: 60000 });
    await p.waitForTimeout(1200);
    await p.evaluate(m => {
      OS.session = { user: { id: 'me' } };
      OS.profile = { id: 'me', name: '홍길동', role: 'owner', active: true, plan: 'vip' };
      document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
      window.__MARK = m;
    }, mark);
    await p.waitForTimeout(11000);
    return { p: p, errs: errs };
  };
  const 세기 = async (p, mark) => (await p.evaluate(m => (window.__FROM || []).filter(x => x.mark === m).length, mark));
  const 누가 = async (p, mark) => (await p.evaluate(m => {
    const L = (window.__FROM || []).filter(x => x.mark === m), o = {};
    L.forEach(x => { const k = (x.st.find(s => !/^http@/.test(s)) || x.st[0] || '?'); o[k] = (o[k] || 0) + 1 });
    return Object.keys(o).sort((a, c) => o[c] - o[a]).slice(0, 6).map(k => k + ' ' + o[k] + '번');
  }, mark));

  head('[1] 그날 <b>처음</b> 켤 때');
  const A = await 켜기('처음');
  const n1 = await 세기(A.p, '처음');
  is(n1 <= 선.처음, '  처음 켤 때 <b>' + n1 + '번</b> (기준선 ' + 선.처음 + ') — ' + (await 누가(A.p, '처음')).join(' · '));
  is(!A.errs.length, '  조용히 터진 곳이 없다' + (A.errs.length ? ' — ' + A.errs[0] : ''));

  head('[3] 홈을 <b>처음</b> 열 때 · <b>다시</b> 열 때');
  await A.p.evaluate(() => { window.__MARK = '홈처음'; go('home') });
  await A.p.waitForTimeout(9000);
  const n3 = await 세기(A.p, '홈처음');
  is(n3 <= 선.홈처음, '  홈 처음 <b>' + n3 + '번</b> (기준선 ' + 선.홈처음 + ') — ' + (await 누가(A.p, '홈처음')).join(' · '));

  await A.p.evaluate(() => { window.__MARK = '고객'; go('clients') });
  await A.p.waitForTimeout(5000);
  const n5 = await 세기(A.p, '고객');
  is(n5 <= 선.고객, '  고객 목록 <b>' + n5 + '번</b> (기준선 ' + 선.고객 + ')');

  await A.p.evaluate(() => { window.__MARK = '홈다시'; go('home') });
  await A.p.waitForTimeout(7000);
  const n4 = await 세기(A.p, '홈다시');
  is(n4 <= 선.홈다시, '  ★ 홈 <b>다시</b> 열면 <b>' + n4 + '번</b> (기준선 ' + 선.홈다시 + ') — 이미 손에 있는 것을 또 안 받습니다 (7번)');

  head('[5] 같은 화면을 <b>다시 그려도</b> 안 부른다');
  await A.p.evaluate(async () => {
    window.__MARK = '다시그리기';
    for (var i = 0; i < 5; i++) { try { hmPaint && hmPaint() } catch (e) {} await new Promise(r => setTimeout(r, 400)); }
  });
  await A.p.waitForTimeout(2500);
  const n6 = await 세기(A.p, '다시그리기');
  is(n6 <= 선.다시그리기, '  다시 그리기 ×5 → <b>' + n6 + '번</b> (기준선 ' + 선.다시그리기 + ')');

  head('[4] ★ <b>가만히 두면 안 부른다</b> (7번)');
  await A.p.evaluate(() => { window.__MARK = '가만히' });
  await A.p.waitForTimeout(25000);
  const n7 = await 세기(A.p, '가만히');
  is(n7 <= 선.가만히, '  가만히 25초 → <b>' + n7 + '번</b> (기준선 ' + 선.가만히 + ')');

  head('[6] ★★ <b>같은 무거운 표를 몇 번 읽나</b> (5번)');
  const 무거움 = await A.p.evaluate(() => {
    const L = (window.__FROM || []).filter(x => x.mark === '홈처음');
    const o = {}; L.forEach(x => { o[x.n] = (o[x.n] || 0) + 1 });
    return ['clients', 'calls', 'dbs', 'saved_reports', 'profiles'].map(k => [k, o[k] || 0]);
  });
  const 최다 = Math.max.apply(null, 무거움.map(x => x[1]));
  const 몇 = (k) => (무거움.filter(x => x[0] === k)[0] || [, 0])[1];
  is(최다 <= 선.무거운표,
     '  홈 한 번에 — ' + 무거움.map(x => x[0] + ' <b>' + x[1] + '번</b>').join(' · ') +
     '   (제일 많이 읽는 표 ' + 최다 + '번 · 기준선 ' + 선.무거운표 + ')');
  /* ★★ <b>제일 무거운 표</b>는 따로 지킵니다 — 사장님 서버의 고객 1,943분이
     홈 한 번에 네 벌 내려오던 자리입니다 (판 X281 · 5번·7번). */
  is(몇('clients') <= 선.고객표,
     '  ★★ <b>고객 표</b>를 홈 한 번에 ' + 몇('clients') + '번 읽는다 (기준선 ' + 선.고객표 +
     ') — 판 X281 전에는 <b>4번</b>이었습니다');
  is(몇('profiles') <= 선.담당자표,
     '  ★ <b>담당자 표</b>를 ' + 몇('profiles') + '번 읽는다 (기준선 ' + 선.담당자표 +
     ') — 전에는 2번이었습니다');
  await A.p.close();

  /* ── [7] ★ 출발 점검이 <b>이레에 한 번</b>인가 (판 X281) ──────────────
     켤 때 19번 가운데 17번이 출발 점검이었습니다. 날마다 돌 까닭이 없어
     이레로 늘렸습니다 — <b>그게 진짜 그런지</b> 날짜 도장을 바꿔 가며 봅니다.
     안 울리는 알람은 알람이 아닙니다 (8번).                             */
  head('[7] ★ 출발 점검이 <b>이레에 한 번</b>인가');
  const 날짜도장 = async (일전) => {
    const p = await ctx.newPage();
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
    /* ★ 도장은 <b>앱이 적는 그 글자</b>여야 합니다 — 앱의 hxToday() 를 빌려
       거기서 날을 뺍니다. 자가 제 손으로 날짜를 지으면 하루 갈립니다 (5번). */
    await p.evaluate(d => {
      try {
        var t = (typeof hxToday === 'function') ? hxToday() : null;
        if (!t) return;
        var ms = Date.parse(t + 'T00:00:00Z') - d * 86400000;
        localStorage.setItem('apex_hx_day', new Date(ms).toISOString().slice(0, 10));
      } catch (e) {}
    }, 일전);
    await p.reload({ waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => typeof go === 'function', { timeout: 60000 });
    await p.waitForTimeout(1200);
    await p.evaluate(() => {
      OS.session = { user: { id: 'me' } };
      OS.profile = { id: 'me', name: '홍길동', role: 'owner', active: true, plan: 'vip' };
      document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
      window.__MARK = '도장';
    });
    await p.waitForTimeout(10000);
    const n = await p.evaluate(() => (window.__FROM || [])
      .filter(x => x.mark === '도장' && x.st.some(s => /^hxServer@/.test(s))).length);
    await p.close(); return n;
  };
  const 어제 = await 날짜도장(1);
  is(어제 === 0, '  <b>어제</b> 돌았으면 오늘은 안 돈다 — 출발 점검 ' + 어제 + '번');
  const 사흘 = await 날짜도장(3);
  is(사흘 === 0, '  <b>사흘 전</b>에 돌았어도 아직 안 돈다 — ' + 사흘 + '번');
  const 여드레 = await 날짜도장(8);
  is(여드레 >= 17, '  ★ <b>여드레</b>가 지나면 돈다 — ' + 여드레 + '번 (안 돌면 영영 안 봅니다 · 1번)');

  head('[2] 같은 기기로 <b>다시</b> 켤 때 — 출발 점검이 또 돌면 안 된다');
  const B = await 켜기('다시');
  const n2 = await 세기(B.p, '다시');
  is(n2 <= 선.다시, '  다시 켤 때 <b>' + n2 + '번</b> (기준선 ' + 선.다시 + ') — ' + (await 누가(B.p, '다시')).join(' · '));
  await B.p.close();

  is(바깥 > 0, '  가짜 서버가 실제로 받았다 — ' + 바깥 + '번 (진짜 서버로는 0번)');

  await ctx.close(); await b.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ 빨간불 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 켤 때 ' + n1 + '번 · 홈 처음 ' + n3 + '번 · 홈 다시 ' + n4 + '번 · 가만히 ' + n7 + '번.');
})();
