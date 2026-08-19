/* 오늘의 터치 — 누구에게 · 어떻게 · 무엇을.

   「30일 지났습니다」 까지는 앱이 말해 줬다. 그런데 그 말만으로는 손이
   안 나간다. 전화를 걸까 카톡을 보낼까, 무슨 말을 꺼낼까를 그 자리에서
   또 생각해야 하기 때문이다. 생각할 게 남아 있으면 미룬다.

   여기서 확인한다.

     1. 사람마다 <b>전화인지 글인지</b>를 정해 주는가 — 그리고 왜 그런지
     2. 먼저 할 사람이 위로 오는가 (한 번도 없음 · VIP · 두 달)
     3. 전화를 너무 안 하면 짚어 주는가
     4. 보낼 글에 <b>고객 이름</b>이 안 들어가는가 (잘못 보내도 안 드러나게)
     5. 규칙을 화면에 그대로 적는가 — 납득해야 따라 한다              */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
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
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  /* 견본 고객 — 실제 이름이 아니라 홍길동·이몽룡·성춘향 */
  const seed = await page.evaluate(() => {
    window.toast = function () {};
    OS.profile = { id: 'me', name: '윤시현', role: 'owner', plan: 'vip' };
    const day = (n) => new Date(Date.now() + 9 * 3600e3 - n * 86400e3).toISOString().slice(0, 10);
    OSC.list = [
      { id: 'c1', name_masked: '홍○동', advisor_id: 'me', created_at: day(40) },   /* 한 번도 없음 */
      { id: 'c2', name_masked: '이○룡', advisor_id: 'me', created_at: day(300) },  /* VIP · 넘김 */
      { id: 'c3', name_masked: '성○향', advisor_id: 'me', created_at: day(300) },  /* 두 달 넘음 */
      { id: 'c4', name_masked: '변○도', advisor_id: 'me', created_at: day(300) },  /* 카톡만 */
      { id: 'c5', name_masked: '방○자', advisor_id: 'me', created_at: day(300) }   /* 여유 */
    ];
    CM.meta = {
      c1: { fp: {}, touch: [] },
      c2: { fp: { f_ins: 150, c_cancer: 5000, c_death: 10000 }, touch: [{ at: day(40), how: '전화' }] },
      c3: { fp: { f_ins: 20, c_cancer: 3000, c_death: 5000 }, touch: [{ at: day(70), how: '전화' }] },
      c4: { fp: { f_ins: 20, c_cancer: 3000, c_death: 5000 },
            touch: [{ at: day(35), how: '카톡' }, { at: day(50), how: '카톡' }, { at: day(60), how: '문자' }] },
      c5: { fp: { f_ins: 20, c_cancer: 3000, c_death: 5000 }, touch: [{ at: day(2), how: '전화' }] }
    };
    CC.calls = {}; CC.loaded = true; CM.loaded = true; CM.pick = '';
    return ccPlanList(OSC.list).map(r => ({ id: r.c.id, k: r.p.k, way: r.p.way, pri: r.p.pri }));
  });

  console.log('\n[1] 사람마다 전화인지 글인지를 정한다');
  const by = {}; seed.forEach(r => by[r.id] = r);
  is(by.c1 && by.c1.k === 'never' && by.c1.way === 'call', '  한 번도 없던 분 → 전화');
  is(by.c2 && by.c2.k === 'vipover' && by.c2.way === 'call', '  VIP 가 주기를 넘김 → 전화');
  is(by.c3 && by.c3.k === 'long' && by.c3.way === 'call', '  두 달 넘게 소식 없음 → 전화');
  is(by.c4 && by.c4.k === 'talkonly' && by.c4.way === 'call', '  요즘 글로만 이어짐 → 전화');
  is(!by.c5, '  얼마 전에 연락한 분은 오늘 할 일에 안 올라온다');

  console.log('\n[2] 먼저 할 사람이 위로 온다');
  is(seed[0].id === 'c1', '  맨 위는 한 번도 없던 분 — ' + seed[0].id);
  is(seed[1].id === 'c2', '  다음은 VIP — ' + seed[1].id);

  console.log('\n[3] 전화를 너무 안 하면 짚어 준다');
  const al = await page.evaluate(() => {
    const day = (n) => new Date(Date.now() + 9 * 3600e3 - n * 86400e3).toISOString().slice(0, 10);
    /* 최근 30일에 카톡만 여덟 건 */
    CM.meta.c5.touch = [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ at: day(i), how: '카톡' }));
    const a = ccCallAlarm(OSC.list);
    CM.meta.c5.touch = [3, 4, 5].map(i => ({ at: day(i), how: '전화' }));
    const b = ccCallAlarm(OSC.list);
    CM.meta.c5.touch = [{ at: day(2), how: '전화' }];
    const c = ccCallAlarm(OSC.list);
    return { many: a, ok: b, few: c };
  });
  is(al.many && al.many.pct === 0, '  카톡만 여덟 건 → 전화 0% 라고 짚는다');
  is(al.ok === null, '  전화를 섞으면 조용하다');
  is(al.few === null, '  기록이 적으면 함부로 말하지 않는다');

  console.log('\n[4] 보낼 글에 고객 이름을 안 넣는다');
  const msg = await page.evaluate(() => {
    try { localStorage.setItem('apex_cli_real_me', JSON.stringify({ c1: '홍길동' })); } catch (e) {}
    return { t: ccMsgText('c1'), name: cmName(OSC.list[0]) };
  });
  is(msg.name === '홍길동', '  화면에는 실명이 보인다');
  is(msg.t.indexOf('홍길동') < 0 && msg.t.indexOf('홍○동') < 0, '  보낼 글에는 이름이 없다');
  is(/고객님/.test(msg.t), '  「고객님」 으로 부른다');
  is(/윤시현/.test(msg.t), '  누가 보내는지는 적는다');

  console.log('\n[5] 규칙을 화면에 그대로 적는다');
  const html = await page.evaluate(() => {
    CC_PLAN_ON = true;
    const h = ccPlanHtml(OSC.list);
    CC_PLAN_ON = false;
    return h;
  });
  is(/이 순서로 정합니다/.test(html), '  「이 순서로 정합니다」 가 있다');
  const rules = await page.evaluate(() => CC_RULES.map(r => r.t));
  rules.forEach(t => is(html.indexOf(t) >= 0, '    ' + t));
  is(/이 기기에만/.test(html), '  연락처가 이 기기에만 남는다고 밝힌다');

  console.log('\n[6] 바로 할 수 있는 단추가 붙어 있다');
  const plain = await page.evaluate(() => ccPlanHtml(OSC.list));
  is(/ccCall\('c1'\)/.test(plain), '  ☎️ 지금 걸기');
  is(/ccCopyMsg\('c1'\)/.test(plain), '  💬 보낼 글 복사');
  is(/ccMark\('c1'/.test(plain), '  ✓ 했음 — 기록이 남는다');
  is(/ccTelAsk\('c1'\)/.test(plain), '  번호가 없으면 넣는 길을 준다');
  is(/오늘의 터치/.test(plain), '  칸 이름이 「오늘의 터치」 다');

  console.log('\n[7] 고객 목록 맨 위에 붙어 있다');
  const top = await page.evaluate(() => cmTopHtml('', OSC.list));
  is(/오늘의 터치/.test(top), '  고객 365일 첫 화면에 나온다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '오늘의 터치 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '오늘의 터치 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
