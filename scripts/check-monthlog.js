/* 📒 <b>이번 달 내가 한 일</b> 이 오늘 안에 서는가 — 판 X130

   사장님 말씀 (2026-10-19) — 「이번주 / 오늘어디로 가시나 / 30일 약속
   [<b>내가 한달동안 진행했던 기록들 여기에 다 표기되게끔 / 월 기준으로</b>]」.

   여태 이 앱은 <b>오늘</b>만 말했습니다. 기록은 두 곳에 쌓여 있는데
   (고객 365일 접촉 기록 · DB 통합 CRM 통화 장부) <b>한 달치를 읽는 자리가
   한 곳도</b> 없었습니다.

   여기서 확인합니다.

     1. 두 곳의 기록이 <b>한 줄기</b>로 모이는가 — 한쪽만 세지 않는가
     2. <b>그 달 것만</b> 서는가 — 지난달·다음달이 안 섞이는가
     3. 달을 앞뒤로 넘기면 그 달 것이 서는가 · <b>앞날로는 안 가는가</b>
     4. ★ 못 읽었으면 <b>「모릅니다」</b> 라고 하는가 — 0 으로 적지 않는가 (1번)
     5. ★ 적힌 수가 <b>줄 수와 같은가</b> — 머리와 목록이 두 답을 하지 않는가 (5번)
     6. ★ 「상담」 과 「만남」 을 <b>묶어 세되</b>, 줄에는 적으신 말 그대로인가 (5번·1번)
     7. ★ <b>지난달과 견주는 수</b>가 같은 날짜까지만인가 — 달 초에 「80% 줄었다」
        고 적으면 거짓말입니다 (1번)
     8. ★ <b>cmOf 를 안 부르는가</b> — 고객 전원을 도는 자리라 빈 쪽지가
        쌓입니다 (판 X126 에서 데인 자리)
     9. ★ 남의 고객이 안 섞이는가 — 거르는 자리는 mcalMine 하나 (3번·5번)
    10. 홈에 실제로 서는가 — 떼어 낸 조각이 아니라 <b>그려진 화면</b>에서

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

  /* ★ <b>달 경계에 안 매이게</b> 못 박습니다. 「며칠 전」 으로 견본을 만들면
     1일에 돌 때 지난달로 넘어가 자가 제 날에만 울립니다 (8번). */
  const TODAY = '2026-10-19';
  const D = (n) => { const d = new Date(Date.UTC(2026, 9, 19) + n * 86400e3);
                     return d.toISOString().slice(0, 10); };

  const F = await page.evaluate((o) => {
    window.toast = function () {};
    /* 오늘을 못 박습니다 — 자가 도는 날에 따라 답이 갈리면 안 됩니다 */
    window.ccToday = function () { return o.t; };
    OS.profile = { id: 'me', name: '윤시현', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'me' } };
    OSC.list = [
      { id: 'c1', name_masked: '홍○동', advisor_id: 'me', created_at: o.d40 },
      { id: 'c2', name_masked: '홍○순', advisor_id: 'me', created_at: o.d40 },
      { id: 't1', name_masked: '홍○복', advisor_id: 'u2', created_at: o.d40 }   /* 남의 고객 */
    ];
    OSC.loaded = true; CC.calls = {}; CC.loaded = true;
    CM.meta = {
      c1: { touch: [{ at: o.d1, how: '전화', note: '증권 전달 약속' },
                    { at: o.d6, how: '만남', note: '보장분석 설명' },
                    { at: o.p5, how: '카톡', note: '지난달 안부' }] },
      c2: { touch: [{ at: o.d2, how: '카톡', note: '자녀 보험' }] },
      t1: { touch: [{ at: o.d2, how: '만남', note: '남의 고객' }] }
    };
    CM.loaded = true;
    AR.db = [{ id: 'db1', who: 'me', name: '홍○판', region: '분당', stage: 'AP', appt: '', days: 3 }];
    AR.calls = [{ w: 'me', d: o.d3, h: 10, r: '상담', b: 'db1' },
                { w: 'me', d: o.d4, h: 11, r: '부재', b: 'db1' },
                { w: 'me', d: o.p9, h: 9,  r: '상담', b: 'db1' }];
    AR.loaded = true;
    /* ★ <b>홈을 먼저 그립니다.</b> 「누구 것인가」 를 답하는 담당자 고르개
       (hwhoPick)는 홈이 서면서 자리를 잡습니다. 그리기 전에 재면 대표에게는
       거르개가 아직 없어 남의 고객이 섞여 들어옵니다 — 자가 앱보다 먼저
       묻는 셈이라 헛 빨간불입니다 (8번). */
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    go('home');
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    const before = Object.keys(CM.meta).sort().join(',');
    const rows = mlogRows();
    const sum = mlogSum();
    const vs = mlogVs();
    return { before: before, after: Object.keys(CM.meta).sort().join(','),
             rows: rows.map(x => ({ d: x.d, nm: x.nm, how: x.how, src: x.src })),
             sum: sum, vs: vs, ym: mlogYm() };
  }, { t: TODAY, d1: D(-1), d2: D(-2), d3: D(-3), d4: D(-4), d6: D(-6),
       /* 지난달 것은 <b>19일보다 앞</b>에 둡니다 — 같은 날짜까지만 견주는
          규칙이라, 뒤쪽에 두면 잘려 나가 0 이 됩니다 (그 규칙을 [7] 이 잽니다) */
       p5: D(-33), p9: D(-35), d40: D(-60) });

  console.log('\n[1] 두 곳의 기록이 한 줄기로 모인다');
  const srcs = {}; F.rows.forEach(r => srcs[r.src] = (srcs[r.src] || 0) + 1);
  is((srcs.cli || 0) === 3, '고객 365일 접촉 기록 3줄 (받음 ' + (srcs.cli || 0) + ')');
  is((srcs.db || 0) === 2, 'DB 통합 CRM 통화 2줄 (받음 ' + (srcs.db || 0) + ')');

  console.log('\n[2] 그 달 것만 선다');
  const off = F.rows.filter(r => r.d.slice(0, 7) !== '2026-10');
  is(off.length === 0, '다른 달이 안 섞인다 (섞인 줄 ' + off.length + ')');
  is(F.rows.length === 5, '이번 달 5줄 (받음 ' + F.rows.length + ')');
  const dsc = F.rows.every((r, i) => i === 0 || F.rows[i - 1].d >= r.d);
  is(dsc, '새 것이 위에 온다');

  console.log('\n[9] 남의 고객이 안 섞인다');
  is(!F.rows.some(r => r.nm === '홍○복'),
     '다른 담당자(u2)의 고객은 안 선다 — 거르는 자리는 mcalMine 하나');

  console.log('\n[8] 남의 고객 번호로 빈 쪽지를 만들지 않는다');
  is(F.after === F.before,
     '내 기기 쪽지가 안 늘어난다 (전 ' + F.before + ' → 후 ' + F.after + ')');
  /* ★ 홈을 <b>한 번 여는 것만으로도</b> 쪽지가 생기면 안 됩니다. 재어 보니
     고객도 아닌 <b>배정 DB 줄 번호</b>로 쪽지가 생기고 있었습니다
     (hmWorryHtml 이 cmOf 로 물었습니다). 고객 365일은 그 쪽지를
     「내가 아는 고객」 으로 셉니다 — 출발 점검의 분모가 늡니다. */
  is(F.before === 'c1,c2,t1',
     '홈을 열어도 고객 아닌 번호로 쪽지가 안 생긴다 (받음 ' + F.before + ')');

  console.log('\n[5] 머리에 적힌 수가 줄 수와 같다');
  is(F.sum && F.sum.n === F.rows.length,
     '「N번」 이 줄 수와 같다 (' + (F.sum && F.sum.n) + ' vs ' + F.rows.length + ')');
  is(F.sum && F.sum.days === 5, '기록한 날 5일 (받음 ' + (F.sum && F.sum.days) + ')');

  console.log('\n[6] 「상담」 과 「만남」 을 묶어 세되, 줄에는 적으신 말 그대로');
  is(F.sum && F.sum.by['만남'] === 2,
     '칩은 「만남 2」 로 묶인다 — 만남 1 + 상담 1 (받음 ' + (F.sum && F.sum.by['만남']) + ')');
  is(!F.sum || !F.sum.by['상담'], '「상담」 이라는 칩이 따로 안 선다');
  is(F.rows.some(r => r.how === '상담') && F.rows.some(r => r.how === '만남'),
     '줄에는 「상담」 과 「만남」 이 적으신 그대로 남는다 (1번)');

  console.log('\n[7] 지난달과는 같은 날짜까지만 견준다');
  is(F.vs && F.vs.cut === true, '이번 달을 보고 있으면 같은 날짜까지만 자른다');
  is(F.vs && F.vs.prev === 2, '지난달 같은 날까지 2번 (받음 ' + (F.vs && F.vs.prev) + ')');

  console.log('\n[3] 달을 앞뒤로 넘긴다 · 앞날로는 안 간다');
  const mv = await page.evaluate(() => {
    mlogMove(-1);
    const back = { ym: mlogYm(), n: (mlogSum() || {}).n };
    mlogMove(1);
    const now = { ym: mlogYm(), n: (mlogSum() || {}).n };
    mlogMove(1);                                   /* 앞날 — 안 가야 한다 */
    const fwd = mlogYm();
    return { back: back, now: now, fwd: fwd };
  });
  is(mv.back.ym === '2026-09', '‹ 를 누르면 9월 (받음 ' + mv.back.ym + ')');
  is(mv.back.n === 2, '9월에는 2줄 (받음 ' + mv.back.n + ')');
  is(mv.now.ym === '2026-10' && mv.now.n === 5, '› 로 10월에 돌아온다 (받음 ' + mv.now.ym + ' · ' + mv.now.n + '줄)');
  is(mv.fwd === '2026-10', '이번 달에서 › 를 더 눌러도 앞날로 안 간다 (받음 ' + mv.fwd + ')');

  console.log('\n[4] 못 읽었으면 「모릅니다」 — 0 으로 적지 않는다');
  const unk = await page.evaluate(() => {
    const k = CM.loaded; CM.loaded = false;
    const r = mlogRows(), s = mlogSum(), h = mlogBodyHtml();
    CM.loaded = k;
    const d = document.createElement('div'); d.innerHTML = h;
    return { rows: r, sum: s, txt: d.textContent };
  });
  is(unk.rows === null, '목록이 <b>null</b> 이다 — 빈 목록이 아니다 (1번)');
  is(unk.sum === null, '셈도 null 이다');
  is(/못 읽었습니다|모릅니다|불러오는 중/.test(unk.txt),
     '화면이 모른다고 적는다 (받음 「' + unk.txt.replace(/\s+/g, ' ').slice(0, 50) + '」)');
  is(!/(^|[^\d])0번/.test(unk.txt), '「0번」 이라고 적지 않는다');

  console.log('\n[10] 홈의 「📈 이번 달 어떻게 하셨나」 접이 안에 선다');
  /* ★★ <b>제 접이를 따로 안 만듭니다</b> (5번). 홈에는 이미 이번 달을
     묻는 접이가 있고, 그 안에 들어갑니다 — 같은 물음에 답하는 자리가
     둘이면 한쪽만 고쳐 놓고 두 말을 합니다.
     ⚠ 따로 세웠더니 홈이 4.2 → 4.25화면이 되어 자 넷이 울었습니다.
       눈금을 올리는 대신 자리를 옮겼습니다 (8번). */
  const shut = await page.evaluate(() => {
    mlogGoNow();
    HM_MSEV.open = false; hmMsPaint();
    return { rows: document.querySelectorAll('.mlog-r').length,
             head: (document.querySelector('.hm-ev-h .n') || {}).textContent || '',
             mine: document.querySelectorAll('.mlog-h, #mlogHost').length };
  });
  is(shut.mine === 0, '제 접이·제 자리를 따로 안 만든다 (받음 ' + shut.mine + '개)');
  is(shut.rows === 0, '접혀 있으면 줄이 안 그려진다 — 홈이 안 길어진다');
  is(/📒\s*5번/.test(shut.head),
     '접힌 채로도 머리에 「📒 5번」 이 보인다 (받음 「' + shut.head + '」)');

  const dom = await page.evaluate(() => {
    HM_MSEV.open = true; hmMsPaint();
    const b = document.querySelector('.hm-ev-b');
    return { inFold: !!(b && b.querySelector('.mlog-b')),
             first: !!(b && b.firstElementChild && b.firstElementChild.className === 'mlog-b'),
             rows: document.querySelectorAll('.mlog-r').length,
             chips: document.querySelectorAll('.mlog-c').length,
             txt: (b ? b.textContent : '').replace(/\s+/g, ' ') };
  });
  is(dom.inFold, '펴면 그 접이 <b>안</b>에 선다');
  is(dom.first, '펴면 「내가 한 일」 이 <b>먼저</b> 온다 — 미션 완수율은 그 다음');
  is(dom.rows === 5, '줄 다섯이 그려진다 (받음 ' + dom.rows + ')');
  is(dom.chips >= 4, '갈래 칩이 선다 (받음 ' + dom.chips + ')');
  is(/지어낸 줄은 한 줄도 없습니다/.test(dom.txt), '지어내지 않았다고 적는다 (1번)');

  console.log('\n[11] 화면이 안 터진다');
  is(errs.length === 0, '터진 것 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log(bad ? ('\n✗ 어긋남 ' + bad + '곳') : '\n✓ 다 맞습니다');
  process.exit(bad ? 1 : 0);
})();
