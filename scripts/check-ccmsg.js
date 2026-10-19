/* 💬 <b>보낼 글</b> 이 이 분 것인가 — 판 X130

   사장님 말씀 (2026-10-19) — 「<b>보낼 글 복사 이것도 너무 형편없고</b>」.

   여태 이 글은 <b>누구에게 보내도 똑같았습니다</b> — 소식 한 줄 말고는
   이 분에 대한 것이 한 자도 없었습니다. 받는 분은 단체 문자라는 것을
   압니다. 게다가 소식이 없으면 「곧 다시 연락드리겠습니다」 라는
   <b>안 지킬 약속</b>을 적었습니다.

   이제 앱이 <b>이미 아는 것</b>으로 고릅니다. 여기서 확인합니다.

     1. 다섯 꼴이 저마다 서는가 — 생일 · 약속한 일 · 소식 · 오래됨 · 안부
     2. ★ 고르는 자리가 <b>ccMsgWhy 하나</b>인가 — 글과 까닭이 갈리지 않는가 (5번)
     3. ★ 차례가 맞는가 — 생일이 다른 모든 것보다 앞인가
     4. ★ <b>고객 이름이 한 자도 안 들어가는가</b> (3번) — 잘못 보내도
        누구인지 안 드러나게. 이 약속은 판 X130 에서도 그대로입니다
     5. ★ <b>금액·보장 내용이 한 자도 안 들어가는가</b> (3번) — 문자로
        나가는 글이라 잘못 가면 그대로 샙니다
     6. ★ <b>안 지킬 약속을 안 적는가</b> (1번) — 아는 것이 없으면 짧게
     7. ★ <b>빈 쪽지를 안 만드는가</b> — cmOf 로 물으면 남의 번호로도
        쪽지가 생깁니다 (판 X126·X127 에서 데인 자리)
     8. 꾸밈표(태그)가 글자 그대로 안 나가는가 — 문자는 날글입니다

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

  /* 오늘을 못 박습니다 — 생일까지 며칠인지가 도는 날에 따라 갈리면 안 됩니다 */
  const R = await page.evaluate(() => {
    window.toast = function () {};
    window.ccToday = function () { return '2026-10-19'; };
    OS.profile = { id: 'me', name: '윤시현', role: 'owner' };
    OS.session = { user: { id: 'me' } };
    OSC.list = [{ id: 'a', advisor_id: 'me', name_masked: '홍○동', created_at: '2026-01-01' }];
    OSC.loaded = true; CC.calls = {}; CC.loaded = true; CM.loaded = true;
    NLIVE = { items: [{ t: '실손보험 4세대 전환 유예 연장', s: '한국경제', cats: ['보험'] }] };
    /* 소식 고르개는 제 자(check-trackc·newsfit)가 따로 봅니다 — 여기서는
       「소식이 있을 때 그 꼴이 서는가」 만 봅니다 */
    window.ccNewsIdx = function (id) { return (id === 'nw') ? 0 : -1; };
    CM.meta = {
      bd: { bd: '10-24', touch: [{ at: '2026-10-10' }],
            /* 생일과 할 일이 <b>둘 다</b> 있을 때 생일이 이겨야 합니다 */
            nx: [{ k: 'n9', what: '서류 받기', due: '2026-10-20' }] },
      nx: { touch: [{ at: '2026-10-10' }],
            nx: [{ k: 'n1', what: '증권 가져다 드리기', due: '2026-10-22' }] },
      nw: { touch: [{ at: '2026-10-10' }] },
      lg: { touch: [{ at: '2026-05-01' }] },
      pl: { touch: [{ at: '2026-10-10' }] }
    };
    const keysBefore = Object.keys(CM.meta).sort().join(',');
    const o = {};
    ['bd', 'nx', 'nw', 'lg', 'pl'].forEach(k => {
      o[k] = { why: ccMsgWhy(k).k, t: ccMsgText(k) };
    });
    /* 아예 모르는 번호로도 불러 봅니다 — 쪽지를 만들면 안 됩니다 */
    o.unknown = { why: ccMsgWhy('없는번호').k, t: ccMsgText('없는번호') };
    return { o: o, before: keysBefore, after: Object.keys(CM.meta).sort().join(',') };
  });
  const O = R.o;

  console.log('\n[1] 다섯 꼴이 저마다 선다');
  is(O.bd.why === 'bd' && /축하드립니다/.test(O.bd.t), '생일 — 축하가 먼저');
  is(O.nx.why === 'next' && /증권 가져다 드리기/.test(O.nx.t), '약속한 일 — 그 일을 그대로 적는다');
  is(O.nw.why === 'news' && /실손보험/.test(O.nw.t), '소식 — 기사 제목과 출처');
  is(O.lg.why === 'long' && /뜸했습니다/.test(O.lg.t), '오래됨 — 뜸했다고 먼저 말한다');
  is(O.pl.why === 'plain' && /잘 지내고 계신지요/.test(O.pl.t), '아는 것이 없을 때 — 짧은 안부');

  console.log('\n[3] 생일이 다른 모든 것보다 앞이다');
  is(O.bd.why === 'bd' && !/서류 받기/.test(O.bd.t),
     '생일과 할 일이 둘 다 있으면 생일이 이긴다 — 할 일은 안 적힌다');

  console.log('\n[2] 고르는 자리가 하나다 — 글과 까닭이 안 갈린다');
  const pair = { bd: /축하/, next: /지난번에 말씀드린/, news: /소식이 있어/,
                 long: /뜸했습니다/, plain: /잘 지내고 계신지요/ };
  let ok2 = true, why2 = '';
  ['bd', 'nx', 'nw', 'lg', 'pl'].forEach(k => {
    const w = O[k].why;
    if (!pair[w] || !pair[w].test(O[k].t)) { ok2 = false; why2 = k + '→' + w; }
  });
  is(ok2, 'ccMsgWhy 가 고른 꼴과 글이 같다' + (why2 ? ' — 어긋남 ' + why2 : ''));

  console.log('\n[4] 고객 이름이 한 자도 안 들어간다 (3번)');
  const NAMES = ['홍길동', '홍○동', '홍길순', '홍갑돌', '홍○순'];
  let leak = '';
  Object.keys(O).forEach(k => NAMES.forEach(n => { if (O[k].t.indexOf(n) >= 0) leak = k + ':' + n; }));
  is(!leak, '어느 꼴에도 이름이 없다' + (leak ? ' — 샌 자리 ' + leak : ''));
  is(Object.keys(O).every(k => /고객님/.test(O[k].t)), '「고객님」 으로 부른다');

  console.log('\n[5] 금액·보장 내용이 한 자도 안 들어간다 (3번)');
  const MONEY = /\d[\d,]*\s*(원|만원|억|만 원)/;
  let m2 = '';
  Object.keys(O).forEach(k => { if (MONEY.test(O[k].t)) m2 = k; });
  is(!m2, '금액이 적힌 꼴이 없다' + (m2 ? ' — ' + m2 : ''));

  console.log('\n[6] 안 지킬 약속을 안 적는다 (1번)');
  is(!/곧 다시 연락드리겠습니다/.test(O.pl.t),
     '아는 것이 없을 때 「곧 다시 연락드리겠습니다」 라고 안 적는다');
  is(O.pl.t.split('\n').filter(x => x.trim()).length <= 3,
     '짧게 끝낸다 — 세 줄 이하 (받음 ' + O.pl.t.split('\n').filter(x => x.trim()).length + '줄)');

  console.log('\n[7] 빈 쪽지를 안 만든다');
  is(R.after === R.before,
     '모르는 번호로 불러도 쪽지가 안 생긴다 (전 ' + R.before + ' → 후 ' + R.after + ')');
  is(O.unknown.why === 'plain' && /잘 지내고 계신지요/.test(O.unknown.t),
     '모르는 번호도 짧은 안부로 끝난다 (1번)');

  console.log('\n[8] 꾸밈표가 글자 그대로 안 나간다');
  let tag = '';
  Object.keys(O).forEach(k => { if (/<\/?[a-zA-Z]/.test(O[k].t) || /&[a-z]+;/.test(O[k].t)) tag = k; });
  is(!tag, '태그·이스케이프가 섞인 꼴이 없다' + (tag ? ' — ' + tag : ''));

  console.log('\n[9] 화면이 안 터진다');
  is(errs.length === 0, '터진 것 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log(bad ? ('\n✗ 어긋남 ' + bad + '곳') : '\n✓ 다 맞습니다');
  process.exit(bad ? 1 : 0);
})();
