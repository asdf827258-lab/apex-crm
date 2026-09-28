/* 🧍 <b>한 사람 = 한 줄</b> — 배정 DB 와 내 고객이 한 명단인가.

   사장님 말씀 — 「한 명단」. 여태 같은 사람이 <b>두 표에 따로</b> 앉아
   있었습니다. 배정 DB 는 dbs, 내 고객은 clients. 이어 주는 것이 <b>이름
   글자</b>뿐이라 코드에도 이렇게 적혀 있었습니다 —
   「⚠ 동명이인은 못 가립니다」(app/index.html 12259행).
   이름으로 붙이면 <b>다른 사람의 증권</b>을 그 분 것이라고 말하게 됩니다.

   여기서 확인합니다.
     1. 배정 DB 와 내 고객이 <b>한 명단</b>에 선다
     2. 「내 고객으로」 뒤에 <b>줄이 하나만</b> 남는다 — 다리(client_meta.db)
     3. 그 뒤 <b>단계를 올려도 줄이 안 늘어난다</b>
     4. ★★ <b>동명이인 두 분이 안 붙는다</b> — 이 판의 본업입니다
     5. 다리가 있으면 <b>이름 대조보다 다리를 먼저</b> 본다
     6. 거르개 <b>여섯 + 접힌 다섯</b> — 칩의 수가 진짜 수인가
     7. ★ <b>접힌 다섯이 여전히 도는가</b> — 접었다고 죽으면 그것은 지운 것입니다
     8. 출처 꼬리표 <b>세 가지</b>가 다 선다
     9. ★★ <b>명단을 안 읽은 채</b> 「내 고객으로」 를 누르면 멈추는가 —
        안 멈추면 이미 내 고객인 분이 <b>한 줄 더</b> 생깁니다 (1번)
    10. <b>모르는 것을 0 으로 안 적는다</b> — 부재 수
    11. 쓴 t- 이름이 전부 ui.css 에 있다 (새 CSS 0줄)

   ★ 견본 이름은 <b>홍길동</b> 입니다 (3번). 목각의 가짜 이름 일곱은
     가져오지 않았습니다.                                              */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const UICSS = fs.readFileSync(path.join(ROOT, 'app/ui.css'), 'utf8');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8' };
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

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 480, height: 820 } });
  await ctx.route('**://**', r =>
    r.request().url().indexOf('127.0.0.1:' + srv.address().port) >= 0 ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 170)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n🧍 한 사람 = 한 줄 — 배정 DB 와 내 고객이 한 명단인가');

  const R = await page.evaluate(() => {
    const me = 'me-1';
    OS.profile = OS.profile || {}; OS.profile.id = me;
    OS.session = OS.session || { user: { id: me } };
    CM.pick = ''; CM.picked = true; CM.byWho = false; CM.fam = false;
    OSC.q = ''; OSC.loaded = true;
    window.hwhoFor = function () { return me; };

    /* 고객 셋 — 소개 한 분, 그냥 내 고객 둘. 견본은 홍길동 (3번) */
    const cli = [
      { id: 'c1', advisor_id: me, name_masked: '홍○○', consent_status: 'none' },
      { id: 'c2', advisor_id: me, name_masked: '홍○○', consent_status: 'none' },
      { id: 'c3', advisor_id: me, name_masked: '홍○○', consent_status: 'none' },
    ];
    /* 배정 DB 넷 — 그 중 <b>둘이 동명이인</b>입니다 */
    const db = [
      { id: 'd1', who: me, name: '홍길동', region: '강남구', stage: 'AP', src: '배정', days: 5, appt: '' },
      { id: 'd2', who: me, name: '홍길동', region: '서초구', stage: 'TA', src: '배정', days: 40, appt: '' },
      { id: 'd3', who: me, name: '홍길순', region: '강남구', stage: '미접촉', src: '배정', days: 2, appt: '' },
      { id: 'd9', who: 'other', name: '홍길칠', region: '강남구', stage: 'AP', src: '배정', days: 3, appt: '' },
    ];
    CM.meta = {
      c1: { ref: 'c2' },                 /* 소개로 오신 분 */
      c2: {}, c3: {}
    };
    OSC.list = cli;
    AR.db = db; AR.cliRows = cli.map(c => ({ id: c.id, who: me, name: '', nm: c.name_masked }));
    AR.calls = [{ w: me, d: '2026-09-01', h: 10, r: '부재', b: 'd1' },
                { w: me, d: '2026-09-02', h: 10, r: '부재', b: 'd1' },
                { w: me, d: '2026-09-03', h: 10, r: '상담', b: 'd2' }];
    AR.loaded = true;

    const out = {};
    const ids = (L) => L.map(x => x.id);

    out.merged = ids(olRows(OSC.list));
    out.from = { c1: olFromOf(cli[0]), c3: olFromOf(cli[2]),
                 d1: olFromOf({ _db: true }) };

    /* 「내 고객으로」 를 누른 뒤와 <b>같은 상태</b>를 만든다 — 다리를 놓는다 */
    const c4 = { id: 'c4', advisor_id: me, name_masked: '홍○○', consent_status: 'none' };
    OSC.list = cli.concat([c4]);
    AR.cliRows = AR.cliRows.concat([{ id: 'c4', who: me, name: '', nm: '홍○○' }]);
    CM.meta.c4 = { db: 'd1' };
    out.after = ids(olRows(OSC.list));
    /* 단계를 올려도 줄이 안 늘어나는가 */
    db[0].stage = 'PC';
    out.afterStage = ids(olRows(OSC.list));

    /* ★★ 동명이인 — 다리는 d1 에만. d2 는 이름이 같아도 c4 로 안 붙어야 한다 */
    out.bridge1 = (chkFind(chkCliBy(), '홍길동', 'd1') || {}).id || '';
    out.bridge2 = (chkFind(chkCliBy(), '홍길동', 'd2') || {}).id || '';

    /* 거르개 */
    const rows = olRows(OSC.list);
    out.fd = CLI_FD.map(f => f[0]);
    out.fd2 = CLI_FD2.map(f => f[0]);
    out.counts = {};
    cliFAll().forEach(f => { out.counts[f[0]] = cliFPass(rows, f[0]).length; });
    CLI_FMORE = false; out.chipsClosed = cliFHtml(rows);
    CLI_FMORE = true;  out.chipsOpen = cliFHtml(rows);
    CLI_FMORE = false;

    /* 부재 — 모르면 -1 */
    out.abs = { d1: olAbsOf({ _db: true, _dbid: 'd1' }), c4: olAbsOf(c4),
                c3: olAbsOf(cli[2]) };

    /* 줄 그리기 — 출처 꼬리표 셋 */
    out.html = cmRowsHtml(rows);

    /* ★★ 명단을 안 읽은 채 누르면 멈추는가 — 서버를 부르는지 지켜본다 */
    let hit = 0;
    const realClient = window.osClient;
    window.osClient = function () { hit++; return { from: function () { return { insert: function () { return { select: function () { return { then: function () {} }; } }; } }; } }; };
    AR.cliRows = null;
    olToMine('d3');
    out.blockedHit = hit;
    AR.cliRows = cli.concat([{ id: 'c4', who: me, name: '', nm: '홍○○' }])
      .map(c => ({ id: c.id, who: me, name: '', nm: c.name_masked || '홍○○' }));
    /* 이미 다리가 있는 분을 또 누르면? 서버를 안 불러야 한다 */
    olToMine('d1');
    out.dupHit = hit;
    window.osClient = realClient;
    return out;
  });

  console.log('\n[1] 배정 DB 와 내 고객이 한 명단에 선다');
  is(R.merged.indexOf('c1') >= 0 && R.merged.indexOf('db:d1') >= 0,
     '  고객 줄과 배정 DB 줄이 같이 있다 — ' + R.merged.join(' · '));
  is(R.merged.indexOf('db:d9') < 0, '  <b>남의 배정 DB 는 안 선다</b> (3번)');

  console.log('\n[2] 「내 고객으로」 뒤에 줄이 하나만 남는다 — 다리(client_meta.db)');
  is(R.after.indexOf('db:d1') < 0, '  배정 DB 줄이 <b>사라졌다</b> — 그 분은 c4 로 섰다');
  is(R.after.indexOf('c4') >= 0, '  고객 줄로 <b>하나만</b> 남았다');
  is(R.after.length === R.merged.length, '  <b>수가 안 늘었다</b> — ' + R.merged.length + ' → ' + R.after.length);

  console.log('\n[3] 그 뒤 단계를 올려도 줄이 안 늘어난다');
  is(R.afterStage.length === R.after.length && R.afterStage.indexOf('db:d1') < 0,
     '  AP → PC 로 올려도 ' + R.afterStage.length + '줄 그대로');

  console.log('\n[4] ★★ 동명이인 두 분이 안 붙는다 — 이 판의 본업');
  is(R.bridge1 === 'c4', '  다리가 놓인 d1 은 <b>c4 로</b> 이어진다 — ' + (R.bridge1 || '없음'));
  is(R.bridge2 !== 'c4',
     '  <b>이름이 같은 d2 는 c4 로 안 붙는다</b> — ' + (R.bridge2 || '안 붙음') +
     (R.bridge2 === 'c4' ? '\n      ✗ 다른 사람의 증권을 그 분 것이라고 말하게 됩니다' : ''));

  console.log('\n[5][6] 거르개 여섯 + 접힌 다섯');
  const WANT6 = ['today', 'db', 'mine', 'stuck', 'abs', 'all'];
  is(JSON.stringify(R.fd) === JSON.stringify(WANT6),
     '  앞 여섯이 <b>목각 차례 그대로</b> — ' + R.fd.join(' · '));
  is(R.fd2.length === 5, '  접힌 다섯이 있다 — ' + R.fd2.join(' · '));
  is(R.counts.db >= 1, '  「새 DB」 가 센다 — ' + R.counts.db + '명');
  is(R.counts.mine >= 1, '  「내 고객」 이 센다 — ' + R.counts.mine + '명');
  is(R.counts.abs === 1, '  「부재 잦음」 이 <b>부재 있는 분만</b> 센다 — ' + R.counts.abs + '명');
  is(R.counts.stuck >= 0, '  「막힌 것」 이 센다 — ' + R.counts.stuck + '명');

  console.log('\n[7] ★ 접힌 다섯이 여전히 돈다 — 접었다고 죽으면 그것은 지운 것');
  R.fd2.forEach(k => is(typeof R.counts[k] === 'number',
     '  ' + k + ' — 접혀 있어도 센다 (' + R.counts[k] + ')'));
  is(R.chipsClosed.indexOf('더 5') >= 0, '  닫으면 <b>「더 5」</b> 하나로 접힌다');
  is(R.chipsOpen.indexOf('접기') >= 0 && R.chipsOpen.indexOf('약속 넘김') >= 0,
     '  펴면 다섯이 <b>다 나온다</b>');

  console.log('\n[8] 출처 꼬리표 세 가지가 다 선다');
  [['📥 배정 DB', 't-tag b'], ['🙌 소개', 't-tag p'], ['🪪 내 고객', 't-tag ok']].forEach(([t, cls]) => {
    is(R.html.indexOf(t) >= 0, '  ' + t + ' 가 선다');
    is(R.html.indexOf('class="' + cls + '"') >= 0, '    ' + cls + ' 옷을 입었다');
  });

  console.log('\n[9] ★★ 명단을 안 읽은 채 누르면 멈춘다 — 안 멈추면 줄이 두 개가 됩니다');
  is(R.blockedHit === 0, '  안 읽었을 때 <b>서버를 안 불렀다</b> — 부른 횟수 ' + R.blockedHit +
     (R.blockedHit ? '\n      ✗ 이미 내 고객인 분이 한 줄 더 생깁니다 (1번)' : ''));
  is(R.dupHit === 0, '  <b>이미 다리가 있는 분</b>을 또 눌러도 안 불렀다 — ' + R.dupHit);

  console.log('\n[10] 모르는 것을 0 으로 안 적는다');
  is(R.abs.d1 === 2, '  배정 DB 줄의 부재 <b>2번</b> — ' + R.abs.d1);
  is(R.abs.c4 === 2, '  다리가 있는 고객도 <b>같은 2번</b> — ' + R.abs.c4 + ' (다리가 이어 줍니다)');
  is(R.abs.c3 === -1, '  다리가 없어 <b>모르는</b> 분은 -1 — ' + R.abs.c3 + ' (0 이 아닙니다)');

  console.log('\n[11] 쓴 t- 이름이 전부 ui.css 에 있다 (새 CSS 0줄)');
  const names = [];
  (R.html.match(/class="(t-[^"]*)"/g) || []).forEach(c => {
    c.replace(/class="|"/g, '').split(/\s+/).forEach(n => { if (n && names.indexOf(n) < 0) names.push(n); });
  });
  const 없는것 = names.filter(n => UICSS.indexOf('.' + n) < 0);
  is(names.length > 0 && 없는것.length === 0,
     '  t- 이름 ' + names.length + '개가 전부 ui.css 에 있다 — ' + names.join(' · ') +
     (없는것.length ? '\n      ✗ 없는 이름: ' + 없는것.join(' · ') : ''));

  console.log('\n[12] 조용히 터진 곳이 없다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? '\n      ✗ ' + errs.slice(0, 3).join('\n      ✗ ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데 — 한 사람이 두 줄이 되면 어느 것이 최신인지 알 수 없습니다.'); process.exit(1); }
  console.log('✓ 한 사람 = 한 줄입니다 — 동명이인은 안 붙고, 접힌 다섯도 그대로 돕니다.');
})().catch(e => { console.error(e); process.exit(1); });
