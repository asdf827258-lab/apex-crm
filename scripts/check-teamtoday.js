/* 👥 「오늘」이 <b>팀원 전부에게도</b> 맞는 말을 하는가 — 판 X126

   사장님 말씀 (2026-10-18) — 「오늘의 모든 시스템, <b>다른 팀원들까지</b>
   모두 파악해서 해봐」.

   재어 보니 리더 화면의 팀원 숫자가 <b>거짓말</b>을 하고 있었습니다.
   ★ 제가 판 X122 에서 낸 어긋남입니다. 「다음 할 일」을 여러 개 쌓게
     만들면서, 묻는 자리를 <b>cmNextAll(id) 하나</b>로 모았습니다. 그런데
     cmNextAll 은 <b>이 기기(CM.meta)</b> 를 봅니다 — 내 고객만 거기
     있습니다. 리더 화면(arCliCalc·arCliRows)은 <b>서버가 준 줄(metas)</b>
     을 손에 들고 있으면서 그것을 버리고 제 기기를 물었습니다.

     재어 본 값 (견본 — 내 고객 하나 · 팀원 고객 하나, 둘 다 기한 지난
     할 일이 서버에 담겨 있음)

                                  X122 전    X122~X125
       내 고객 기한 지난 할 일        1건         0건
       팀원 고객 기한 지난 할 일      1건         0건
       내 기기에 생긴 빈 쪽지         0개         2개

   둘 다 「없음」 으로 보입니다 — <b>모르는 것을 0 으로 적은 것</b>이고,
   화면에서는 「없다」 로 읽힙니다 (1번).

   게다가 <b>반대 방향으로도</b> 샜습니다 — arTouch() 는 할 일을 안 적어
   둔 분을 날짜와 상관없이 「기고객」 으로 올립니다(아무도 안 챙기고 있다는
   뜻이라 맞는 규칙입니다). 그런데 팀원 고객은 할 일이 <b>언제나 빈 칸</b>
   이라, 팀원의 고객이 <b>전원</b> 「오늘 터치할 사람」 에 섰습니다.

   그래서 여기서 확인합니다.

     1. 팀원의 「다음 할 일」이 <b>서버가 준 줄</b>에서 읽히는가
        (내 기기 CM.meta 가 비어 있어도)
     2. 남의 고객 번호로 <b>빈 쪽지를 만들지 않는가</b> (cmOf 를 안 부른다)
     3. 내 기기에 있는 쪽지가 더 새 것이면 <b>그것</b>을 쓰는가
     4. 「오늘 터치할 사람」이 팀원 고객 <b>전원</b>으로 넘치지 않는가
     5. 팀원 저마다의 「오늘」 한 줄이 서고, 그 수가 <b>이미 세는 자</b>와
        같은가 — 두 곳에서 각자 세지 않는가 (5번)
     6. 아직 안 읽었으면 <b>「모릅니다」</b> 라고 하는가 — 0 으로 적지 않는가 (1번)

   ★ 사장님 진짜 서버는 읽지 않습니다. 견본 이름은 홍길동 집안입니다 (3번). */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

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

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  await ctx.route('**://**', r =>
    r.request().url().startsWith('http://127.0.0.1:') ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  const day = (n) => new Date(Date.now() + 9 * 3600e3 + n * 86400e3).toISOString().slice(0, 10);

  /* ── 견본 — 나(윤시현) 와 팀원 둘. 고객은 저마다 둘씩 ──────────────
     · c1 내 고객       — 기한 지난 할 일이 <b>서버</b>에 담겨 있다
     · c2 내 고객       — 서버에는 옛 것, <b>내 기기에 더 새 것</b>이 있다
     · t1 홍길순의 고객 — 기한 지난 할 일이 <b>서버</b>에 담겨 있다
     · t2 홍갑돌의 고객 — 할 일이 <b>아예 없다</b> (이분만 기고객이 맞다) */
  const F = await page.evaluate((o) => {
    window.toast = function () {};
    OS.profile = { id: 'me', name: '윤시현', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'me' } };
    /* sc·raw 는 성장판이 채우는 여섯 축입니다 — 빈 꼴로라도 있어야
       팀 줄(arDotsHtml)이 그려집니다 */
    GB.rows = [
      { id: 'me', name: '윤시현', team: 'tA', role: 'owner',  total: 72, last: o.d0, sc: {}, raw: {} },
      { id: 'u2', name: '홍길순', team: 'tA', role: 'member', total: 41, last: o.d5, sc: {}, raw: {} },
      { id: 'u3', name: '홍갑돌', team: 'tA', role: 'member', total: 33, last: '',   sc: {}, raw: {} }
    ];
    GB.teams = [{ id: 'tA', name: '1팀' }];
    GB.teamOf = { me: 'tA', u2: 'tA', u3: 'tA' };
    GB.team = ''; GB.loaded = true; GB.pass = {};
    AR.rep = {}; AR.open = ''; AR.q = ''; AR.f = 'all';

    const clients = [
      { id: 'c1', name_masked: '홍○동', advisor_id: 'me', created_at: o.d40 },
      { id: 'c2', name_masked: '홍○순', advisor_id: 'me', created_at: o.d40 },
      { id: 't1', name_masked: '홍○돌', advisor_id: 'u2', created_at: o.d40 },
      { id: 't2', name_masked: '홍○복', advisor_id: 'u3', created_at: o.d40 }
    ];
    const metas = [
      { client_id: 'c1', content: { nx: [{ k: 'n1', what: '증권 가져다 드리기', due: o.d3 }],
                                    touch: [{ at: o.d3 }] } },
      { client_id: 'c2', content: { nx: [{ k: 'n2', what: '서버에 담긴 옛 것', due: o.d9 }],
                                    touch: [{ at: o.d3 }] } },
      { client_id: 't1', content: { nx: [{ k: 'n3', what: '보장분석 설명', due: o.d3 }],
                                    touch: [{ at: o.d3 }] } },
      { client_id: 't2', content: { touch: [{ at: o.d3 }] } }
    ];
    /* 내 기기에는 c2 만 있다 — 서버보다 <b>새 것</b>이다 */
    CM.meta = { c2: { fp: {}, touch: [{ at: o.d1 }],
                      nx: [{ k: 'n2', what: '이 기기에 적은 새 것', due: o.d2 }] } };
    CM.loaded = true;

    AR.cli = arCliCalc(clients, metas);
    AR.cliRows = arCliRows(clients, metas, {});
    AR.db = [];
    AR.loaded = true;
    return { cli: AR.cli,
             rows: AR.cliRows.map(x => ({ id: x.id, who: x.who, plan: x.plan, due: x.due,
                                          n: (x.plans || []).length })),
             junk: Object.keys(CM.meta).sort() };
  }, { d0: day(0), d1: day(-1), d2: day(2), d3: day(-3), d5: day(-5), d9: day(-9), d40: day(-40) });

  console.log('\n[1] 팀원의 다음 할 일이 서버가 준 줄에서 읽힌다');
  const u2 = F.cli.u2 || {}, me = F.cli.me || {};
  const t1 = F.rows.filter(x => x.id === 't1')[0] || {};
  const c1 = F.rows.filter(x => x.id === 'c1')[0] || {};
  is(u2.plan === 1, '홍길순 — 할 일 적힌 고객 1명 (받음 ' + u2.plan + ')');
  is(u2.due === 1, '홍길순 — 기한 지난 할 일 1건 (받음 ' + u2.due + ')');
  is(t1.plan === '보장분석 설명', '홍길순 고객 줄에 할 일 글이 선다 (받음 「' + t1.plan + '」)');
  is(t1.n === 1, '홍길순 고객 줄에 쌓인 것 1건 (받음 ' + t1.n + ')');
  is(me.due === 1, '내 고객도 서버 줄로 세어진다 — 기한 지난 1건 (받음 ' + me.due + ')');
  is(c1.plan === '증권 가져다 드리기', '내 고객 줄 (받음 「' + c1.plan + '」)');

  console.log('\n[2] 남의 고객 번호로 빈 쪽지를 만들지 않는다');
  is(F.junk.join(',') === 'c2',
     '내 기기 쪽지는 c2 하나뿐이어야 한다 (받음 ' + (F.junk.join(',') || '없음') + ')');

  console.log('\n[2-2] 달력을 먼저 열어도 — 빈 쪽지가 쌓이지 않고 팀 숫자가 뭉개지지 않는다');
  /* 내 캘린더는 대표·지점장에게 <b>남의 고객을 전부</b> 보여 줍니다. 그
     목록을 한 바퀴 돌면서 쪽지를 묻는데, 만드는 자(cmOf)로 물으면 남의
     고객 수만큼 <b>빈 쪽지</b>가 이 기기에 쌓였습니다. 그 빈 쪽지는
     ① 출발 점검의 「고객 직업 한 줄 N/M분」 분모를 늘리고
     ② 리더 화면에서 <b>서버가 준 줄을 덮어</b> 팀 숫자를 다시 0 으로 만듭니다. */
  const cal = await page.evaluate((o) => {
    OSC.list = [
      { id: 'c1', name_masked: '홍○동', advisor_id: 'me', created_at: o.d40 },
      { id: 'c2', name_masked: '홍○순', advisor_id: 'me', created_at: o.d40 },
      { id: 't1', name_masked: '홍○돌', advisor_id: 'u2', created_at: o.d40 },
      { id: 't2', name_masked: '홍○복', advisor_id: 'u3', created_at: o.d40 }
    ];
    OSC.loaded = true; CC.calls = {}; CC.loaded = true;
    const before = Object.keys(CM.meta).sort().join(',');
    let n = 0;
    if (typeof mcalItems === 'function') {
      const it = mcalItems();
      for (const k in it) n += it[k].length;
    }
    const after = Object.keys(CM.meta).sort().join(',');
    /* 달력을 돈 바로 뒤에 리더 화면을 다시 세어 본다 */
    const again = arCliCalc(
      [{ id: 't1', name_masked: '홍○돌', advisor_id: 'u2', created_at: o.d40 }],
      [{ client_id: 't1', content: { nx: [{ k: 'n3', what: '보장분석 설명', due: o.d3 }] } }]);
    return { before: before, after: after, n: n, due: ((again.u2) || {}).due };
  }, { d3: day(-3), d40: day(-40) });
  is(cal.n > 0, '달력이 실제로 무언가를 찍었다 (받음 ' + cal.n + '개)');
  is(cal.after === cal.before,
     '달력을 돌아도 내 기기 쪽지가 안 늘어난다 (전 ' + (cal.before || '없음') +
     ' → 후 ' + (cal.after || '없음') + ')');
  is(cal.due === 1,
     '달력을 먼저 돈 뒤에도 팀 기한 지난 할 일이 1건 (받음 ' + cal.due + ')');

  console.log('\n[2-3] 빈 쪽지가 끼어 있어도 서버가 준 줄을 버리지 않는다');
  /* 빈 쪽지를 만드는 자리를 달력·30일 주기에서는 고쳤지만, cmOf 를 부르는
     자리가 앱에 아직 쉰 곳 넘게 있습니다. 그중 어느 하나가 남의 고객
     번호로 불려도 팀 숫자가 0 으로 돌아가지 않아야 합니다 — 그래서
     cmNextAllOf 가 <b>빈 쪽지면 서버를 한 번 더</b> 봅니다. 손으로 빈 쪽지를
     심어 그 자리를 잽니다 (8번 — 안 울리는 알람은 알람이 아닙니다). */
  const blank = await page.evaluate((o) => {
    CM.meta['t1'] = (typeof cmBlank === 'function') ? cmBlank() : { nx: [], next: null, touch: [] };
    const r = arCliCalc(
      [{ id: 't1', name_masked: '홍○돌', advisor_id: 'u2', created_at: o.d40 }],
      [{ client_id: 't1', content: { nx: [{ k: 'n3', what: '보장분석 설명', due: o.d3 }] } }]);
    const rows = arCliRows(
      [{ id: 't1', name_masked: '홍○돌', advisor_id: 'u2', created_at: o.d40 }],
      [{ client_id: 't1', content: { nx: [{ k: 'n3', what: '보장분석 설명', due: o.d3 }] } }], {});
    delete CM.meta['t1'];
    return { due: ((r.u2) || {}).due, plan: (rows[0] || {}).plan };
  }, { d3: day(-3), d40: day(-40) });
  is(blank.due === 1, '빈 쪽지가 있어도 기한 지난 할 일 1건 (받음 ' + blank.due + ')');
  is(blank.plan === '보장분석 설명',
     '빈 쪽지가 있어도 할 일 글이 선다 (받음 「' + blank.plan + '」)');

  console.log('\n[3] 이 기기 쪽지가 더 새 것이면 그것을 쓴다');
  const c2 = F.rows.filter(x => x.id === 'c2')[0] || {};
  is(c2.plan === '이 기기에 적은 새 것',
     'c2 — 서버의 옛 것이 아니라 이 기기의 새 것 (받음 「' + c2.plan + '」)');

  console.log('\n[4] 「오늘 터치할 사람」이 팀원 고객 전원으로 넘치지 않는다');
  const tk = await page.evaluate(() => {
    const all = arTouch('');
    const ko = l => l.filter(x => x.k === '기고객').map(x => x.id).sort();
    return { all: all.length, old: ko(all),
             u2: ko(arTouch('u2')), u3: ko(arTouch('u3')) };
  });
  is(tk.u2.length === 0,
     '홍길순 — 할 일을 적어 둔 고객은 기고객으로 안 올라온다 (받음 ' + (tk.u2.join(',') || '없음') + ')');
  is(tk.u3.join(',') === 't2',
     '홍갑돌 — 할 일이 없는 그 한 분만 올라온다 (받음 ' + (tk.u3.join(',') || '없음') + ')');

  console.log('\n[5] 팀원 저마다의 「오늘」 한 줄 — 수를 두 곳에서 세지 않는다');
  /* ★ 떼어 낸 <div> 가 아니라 <b>실제로 그려진 화면</b>에서 봅니다.
     판 X121 에서 떼어 낸 조각으로만 재다가, 진짜 화면에서는 두 가지가
     어긋나 있는 것을 놓쳤습니다. */
  await page.evaluate(() => {
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    /* 「팀원 관리」 칸을 먼저 골라 둡니다 — 기본 칸(피드백)은 성장판의
       내 줄을 그려서, 견본에 없는 칸을 보고 터집니다 */
    AR.cat = 'team';
    go('airep');
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
  });
  await page.waitForTimeout(700);
  const tt = await page.evaluate(() => {
    const rows = [].slice.call(document.querySelectorAll('.ar-tt'));
    return { n: rows.length,
             who: rows.map(r => r.getAttribute('data-who') || ''),
             due: rows.map(r => +((r.getAttribute('data-due')) || -1)),
             tkn: rows.map(r => +((r.getAttribute('data-tk')) || -1)),
             /* 같은 물음을 이미 세는 자에게 다시 물어 견준다 */
             ref: rows.map(r => {
               const w = r.getAttribute('data-who') || '';
               return { tk: arTouch(w).length, due: ((AR.cli || {})[w] || {}).due };
             }),
             txt: document.body.textContent };
  });
  is(tt.n === 3, '그려진 화면에 팀원 셋이 다 선다 (받음 ' + tt.n + ')');
  is(tt.n > 0 && tt.who.indexOf('') < 0, '줄마다 누구인지 적혀 있다');
  let same = (tt.n === 3), why = tt.n === 3 ? '' : '줄이 없다';
  for (let i = 0; i < tt.n; i++) {
    if (tt.tkn[i] !== tt.ref[i].tk) { same = false; why = tt.who[i] + ' 터치 ' + tt.tkn[i] + '≠' + tt.ref[i].tk; break; }
    if (tt.due[i] !== tt.ref[i].due) { same = false; why = tt.who[i] + ' 기한 ' + tt.due[i] + '≠' + tt.ref[i].due; break; }
  }
  is(same, '적힌 수가 이미 세는 자(arTouch · AR.cli)와 같다' + (why ? ' — 어긋남 ' + why : ''));
  is(/홍길순/.test(tt.txt) && /홍갑돌/.test(tt.txt), '팀원 이름이 적힌다');

  console.log('\n[5-2] 줄을 누르면 그 사람의 오늘 터치할 사람으로 간다');
  /* 이름만 보고 넘기지 않습니다 — <b>실제로 눌러</b> 어디로 갔는지 봅니다 */
  await page.evaluate(() => { AR.tkTeam = 'tZ'; });   /* 다른 팀으로 좁혀 둔 채 */
  const sel = '.ar-tt[data-who="u2"]';
  const hit = await page.$(sel);
  is(!!hit, '홍길순 줄이 눌릴 자리에 있다');
  if (hit) {
    await hit.click();
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => ({
      cat: arCat(), who: arTkWho(), team: arTkTeam(),
      shown: [].slice.call(document.querySelectorAll('.ar-tk')).length
    }));
    is(after.cat === 'touch', '「오늘 터치할 사람」 으로 갔다 (받음 ' + after.cat + ')');
    is(after.who === 'u2', '그 사람으로 좁혀졌다 (받음 ' + after.who + ')');
    is(after.team === '', '다른 팀으로 좁혀 둔 것은 풀렸다 — 「0명」 이 되지 않는다 (받음 「' + after.team + '」)');
  } else { is(false, '— 눌러 보지 못했습니다'); is(false, '—'); is(false, '—'); }
  await page.evaluate(() => { arGoCat('team'); });
  await page.waitForTimeout(500);

  console.log('\n[6] 아직 안 읽었으면 「모릅니다」 — 0 으로 적지 않는다');
  const unk = await page.evaluate(() => {
    const keep = AR.loaded, kc = AR.cli, kr = AR.cliRows;
    AR.loaded = false; AR.cli = null; AR.cliRows = null;
    const h = (typeof arTodayTeamHtml === 'function') ? arTodayTeamHtml() : '';
    AR.loaded = keep; AR.cli = kc; AR.cliRows = kr;
    const d = document.createElement('div'); d.innerHTML = h;
    return { txt: d.textContent, zero: /(^|[^\d])0건/.test(d.textContent) };
  });
  is(/모릅니다|불러오는 중|아직/.test(unk.txt),
     '안 읽었을 때 모른다고 적는다 (받음 「' + unk.txt.replace(/\s+/g, ' ').slice(0, 60) + '」)');
  is(!unk.zero, '안 읽었는데 「0건」 이라고 적지 않는다');

  console.log('\n[7] 화면이 안 터진다');
  is(errs.length === 0, '터진 것 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log(bad ? ('\n✗ 어긋남 ' + bad + '곳') : '\n✓ 다 맞습니다');
  process.exit(bad ? 1 : 0);
})();
