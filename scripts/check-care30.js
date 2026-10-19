/* 🎯 <b>30일 고객관리</b> 가 디테일하게 말하는가 — 판 X132

   사장님 말씀 (2026-10-19) — 「<b>이번달 고객관리 [디테일하게 더
   전문적으로 만들고]</b>」.

   ── 손대기 전 ─────────────────────────────────────────────────────
   표는 「이번 달 연락 <b>12명</b>」 까지만 말했습니다. <b>몇 번</b> 걸었는지,
   <b>어떻게</b>(전화·만남·카톡) 했는지, <b>지난달보다 나아졌는지</b> 는 한
   자도 없었습니다. 사람 수만 보면 <b>한 분께 열 번 건 날과 열 분께 한 번씩
   건 날이 같아 보입니다.</b> 「30일 넘음 7」 을 보고도 <b>누구인지</b> 알
   길이 없었고, VIP(14일)와 일반(30일)이 <b>한 칸에 섞여</b> 있었습니다.

   여기서 확인합니다.

     1. 이번 달 <b>몇 번</b>을 세는가 — 사람 수가 아니라 횟수
     2. <b>갈래별</b>로 적는가 (☎️ 🤝 💬 ✉️)
     3. ★ 「상담」(CRM 말)과 「만남」(365일 말)을 <b>묶어 세는가</b> (5번)
     4. ★★ 지난달은 <b>같은 날짜까지만</b> 견주는가 — 달 초에 「줄었다」 고
        적으면 거짓말입니다 (1번)
     5. ★★ 못 읽었으면 <b>「—」</b> 인가 — 0 으로 적으면 「한 번도 안 했다」
        가 되어 버립니다 (1번)
     6. ★ <b>세는 자가 하나</b>인가 — arCliCalc 가 세고 ccTeamRows 는 싣기만
        하는가. 두 곳에서 세면 표와 홈이 다른 말을 합니다 (5번)
     7. ★ VIP 와 일반을 <b>갈라</b> 세우는가 — 주기가 다릅니다(14일 / 30일)
     8. ★ 줄을 누르면 <b>그 사람의 오늘 터치할 사람</b> 으로 가는가 —
        보내는 자리는 판 X126 의 arTtGo 하나 (5번)
     9. ★ <b>서버를 더 안 부르는가</b> (7번) — 접촉 기록은 arCliCalc 가 이미
        손에 들고 있습니다
    10. class 를 한 줄에 두 번 적지 않는가 — 브라우저가 앞의 것만 씁니다

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
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1200 } });
  await ctx.route('**://**', r =>
    r.request().url().startsWith('http://127.0.0.1:') ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2700);

  /* 오늘을 10월 19일로 못 박습니다 — 「지난달 같은 날까지」 가 도는 날에
     따라 갈리면 안 됩니다 (8번) */
  const T = '2026-10-19';
  const F = await page.evaluate((t) => {
    window.toast = function () {};
    window.arToday = function () { return t; };
    window.ccToday = function () { return t; };
    OS.profile = { id: 'me', name: '윤시현', role: 'owner' };
    OS.session = { user: { id: 'me' } };
    GB.rows = [{ id: 'me', name: '윤시현', team: 'tA', total: 70, last: t, sc: {}, raw: {} },
               { id: 'u2', name: '홍길순', team: 'tA', total: 40, last: t, sc: {}, raw: {} }];
    GB.teams = [{ id: 'tA', name: '1팀' }]; GB.teamOf = { me: 'tA', u2: 'tA' };
    GB.team = ''; GB.loaded = true;
    const clients = [
      { id: 'c1', name_masked: '홍○동', advisor_id: 'me', created_at: '2026-01-01' },
      { id: 'c2', name_masked: '홍○순', advisor_id: 'me', created_at: '2026-01-01' },
      { id: 't1', name_masked: '홍○돌', advisor_id: 'u2', created_at: '2026-01-01' }
    ];
    /* 이번 달: me 는 c1 에 네 번(전화2·만남1·상담1) · c2 에 한 번(카톡)
       지난달: me 는 19일 앞에 두 번, 19일 뒤에 한 번(이건 안 세야 합니다) */
    const metas = [
      { client_id: 'c1', content: { touch: [
          { at: '2026-10-02', how: '전화' }, { at: '2026-10-05', how: '전화' },
          { at: '2026-10-09', how: '만남' }, { at: '2026-10-14', how: '상담' },
          { at: '2026-09-03', how: '전화' }, { at: '2026-09-11', how: '카톡' },
          { at: '2026-09-27', how: '전화' } ] } },
      { client_id: 'c2', content: { touch: [{ at: '2026-10-16', how: '카톡' }] } },
      { client_id: 't1', content: { touch: [{ at: '2026-10-07', how: '전화' }] } }
    ];
    CM.meta = {}; CM.loaded = true;
    AR.cli = arCliCalc(clients, metas);
    AR.cliRows = arCliRows(clients, metas, {});
    AR.db = []; AR.loaded = true;
    const rows = ccTeamRows();
    return { cli: AR.cli, rows: rows.map(r => ({ id: r.id, mN: r.mN, pN: r.pN, mBy: r.mBy,
                                                 over: r.over, vipOver: r.vipOver, mon: r.mon })) };
  }, T);
  const me = F.rows.filter(r => r.id === 'me')[0] || {};
  const u2 = F.rows.filter(r => r.id === 'u2')[0] || {};

  console.log('\n[1] 이번 달 몇 번을 센다 — 사람 수가 아니라 횟수');
  is(me.mN === 5, '윤시현 — 이번 달 5번 (받음 ' + me.mN + ')');
  is(me.mon === 2, '만난 분은 2명 — 횟수와 다른 수다 (받음 ' + me.mon + ')');
  is(u2.mN === 1, '홍길순 — 1번 (받음 ' + u2.mN + ')');

  console.log('\n[4] 지난달은 같은 날짜까지만 견준다');
  is(me.pN === 2, '지난달 19일까지 2번 — 9/27 것은 안 센다 (받음 ' + me.pN + ')');

  console.log('\n[2]·[3] 갈래별로 적고, 「상담」 과 「만남」 을 묶는다');
  const cell = await page.evaluate(() => ({
    n: ccTeamN(ccTeamRows().filter(r => r.id === 'me')[0]),
    vs: ccTeamVs(ccTeamRows().filter(r => r.id === 'me')[0]),
    unk: ccTeamN({ mN: null }), unkVs: ccTeamVs({ mN: null, pN: null })
  }));
  is(/☎️2/.test(cell.n), '전화 2번이 적힌다 (받음 「' + cell.n.replace(/<[^>]*>/g, '') + '」)');
  is(/🤝2/.test(cell.n), '「만남 1 + 상담 1」 이 <b>🤝2</b> 로 묶인다');
  is(!/상담/.test(cell.n), '「상담」 이라는 칸이 따로 안 선다');
  is(/💬1/.test(cell.n), '카톡 1번이 적힌다');

  console.log('\n[5] 못 읽었으면 「—」 — 0 으로 적지 않는다');
  is(/—/.test(cell.unk) && !/>0</.test(cell.unk), '몇 번 칸이 「—」 다');
  is(/—/.test(cell.unkVs), '지난달 대비 칸도 「—」 다');

  console.log('\n[6] 세는 자가 하나다 — arCliCalc 가 세고 ccTeamRows 는 싣는다');
  is(F.cli && F.cli.me && F.cli.me.mN === me.mN,
     'ccTeamRows 의 수가 arCliCalc 의 수와 같다 (' + (F.cli && F.cli.me && F.cli.me.mN) + ' vs ' + me.mN + ')');
  const src = fs.readFileSync('app/index.html', 'utf8');
  const fnRows = (src.match(/function ccTeamRows\(\)\{[\s\S]*?\n\}/) || [''])[0];
  is(!/\.touch/.test(fnRows), 'ccTeamRows 가 접촉 기록을 <b>제 손으로 다시 안 센다</b> (5번)');
  const fn = (src.match(/function ccTeamHtml\(\)\{[\s\S]*?\n\}/) || [''])[0];

  console.log('\n[9] 서버를 더 안 부른다');
  is(!/from\(|\.select\(/.test(fnRows), 'ccTeamRows 가 서버를 안 부른다 (7번)');

  console.log('\n[7]·[8]·[10] 그려진 표');
  const dom = await page.evaluate(() => {
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    AR.cat = 'care'; go('airep');
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    const t = document.querySelector('table.cc-team');
    const ths = [].slice.call(document.querySelectorAll('.cc-team thead th')).map(x => x.textContent.trim());
    const tr = document.querySelector('.cc-team tbody tr');
    return { has: !!t, ths: ths,
             /* ★ <b>줄마다</b> 봅니다. 맨 앞 한 줄만 보면 「나」 줄이 첫째가
                아닐 때 지나갑니다 — 되돌림 ⑦⑧ 이 조용해서 알았습니다 (8번). */
             go: (function(){ var L=[].slice.call(document.querySelectorAll('.cc-team tbody tr'));
                  return L.length>0 && L.every(function(x){
                    return /ccTeamGo/.test(x.getAttribute('onclick')||''); }); })(),
             cls: tr ? (tr.getAttribute('class') || '') : '',
             rowTxt: tr ? tr.textContent.replace(/\s+/g, ' ') : '' };
  });
  await page.waitForTimeout(500);
  is(dom.has, '표가 그려진다');
  is(dom.ths.indexOf('이번 달 몇 번') >= 0, '「이번 달 몇 번」 칸이 있다');
  /* ★ 이름이 거짓말하지 않는가 (4번) — 찍어 보니 「만난 분」 이라 적어 두고
     전화·카톡까지 세고 있었습니다. 「연락한 분」 이 맞는 이름입니다. */
  is(dom.ths.indexOf('이번 달 연락한 분') >= 0 && dom.ths.indexOf('이번 달 만난 분') < 0,
     '사람 수 칸 이름이 「연락한 분」 이다 — 전화·카톡까지 세므로 「만난 분」 은 거짓말이다');
  is(dom.ths.indexOf('지난달 대비') >= 0, '「지난달 대비」 칸이 있다');
  is(dom.ths.some(x => /VIP 넘음/.test(x)), 'VIP 를 <b>갈라</b> 세운다 — 한 칸에 괄호로 안 묻는다');
  is(dom.go, '<b>줄마다</b> ccTeamGo 가 걸려 있다');
  /* ★★ <b>날글에서 봅니다</b>. 화면(DOM)으로는 영영 못 봅니다 — 브라우저가
     파싱하면서 두 번 적힌 class 를 <b>하나로 줄여 버립니다.</b> 되돌림 ⑧ 이
     두 번이나 조용해서 알았습니다. 틀린 자리에서 재면 영영 안 울립니다 (8번). */
  const trTag = (fn.match(/h\+='<tr[^;]*?>'\+/) || [''])[0];
  is(trTag !== '', '줄을 짓는 글을 찾았다');
  is((trTag.match(/class="/g) || []).length === 1,
     'class 를 한 줄에 <b>한 번만</b> 적는다 — 두 번 적으면 브라우저가 앞의 것만 씁니다 (받음 ' +
     (trTag.match(/class="/g) || []).length + '번)');

  /* ★ 이름만 보고 넘기지 않습니다 — <b>실제로 눌러</b> 어디로 갔는지 봅니다 */
  const hit = await page.$('.cc-team tbody tr');
  if (hit) {
    await hit.click();
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => ({ cat: arCat(), who: arTkWho() }));
    is(after.cat === 'touch', '누르면 「오늘 터치할 사람」 으로 간다 (받음 ' + after.cat + ')');
    is(!!after.who, '그 사람으로 좁혀진다 (받음 ' + after.who + ')');
  } else { is(false, '— 눌러 보지 못했습니다'); is(false, '—'); }

  console.log('\n[11] 화면이 안 터진다');
  is(errs.length === 0, '터진 것 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log(bad ? ('\n✗ 어긋남 ' + bad + '곳') : '\n✓ 다 맞습니다');
  process.exit(bad ? 1 : 0);
})();
