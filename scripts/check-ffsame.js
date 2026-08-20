/* 팩트파인딩 질문지가 <b>고객 365일과 같은가.</b> 그리고 모르면 평균으로
   채울 수 있는가 — 채운 것이 <b>고객 숫자인 척하지 않는가.</b>

   전에는 두 군데가 달랐다. 상담카드는 「나이·성별」 을 한 칸에 글로 받고
   「월 소득」 을 「900만원」 같은 글자로 받았다. 고객 365일은 나이·성별·
   소득을 따로, 숫자로 받았다. 그래서 같은 고객을 두 번 적어야 했고,
   상담카드에 적은 것은 계산기로 넘어가지도 않았다.

   그리고 상담 자리에서 「글쎄요, 잘 모르겠는데」 가 나오면 거기서 멈췄다.
   빈칸으로 두면 계산이 안 되고, 아무 숫자나 넣으면 <b>그게 고객 숫자인
   줄 알게 된다.</b> 그래서 채우되 <b>노랗게</b> 표시하고, 저장·인쇄·AI 로
   갈 때마다 「이건 평균입니다」 를 달고 간다.

   여기서 확인한다.

     1. 두 화면이 <b>같은 질문지</b>를 쓰는가 — 칸 이름까지
     2. 두 화면이 같은 id 로 서로를 덮지 않는가
     3. 모르는 칸을 평균으로 채우는가 — <b>적힌 값은 안 건드리고</b>
     4. 채운 칸이 <b>눈에 보이게</b> 다른가
     5. 고객이 진짜 숫자를 말하면 표시가 사라지는가
     6. 평균이라는 사실이 계산기·AI·인쇄로 <b>따라가는가</b>
     7. 상담카드에서도 계산기로 바로 넘어가는가                        */
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
  page.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n[1] 두 화면이 같은 질문지를 쓴다');
  const q = await page.evaluate(() => {
    const box = document.createElement('div');
    box.innerHTML = cmFfHtml('', 'cmff_') + cmFfHtml('', 'ffx_');
    document.body.appendChild(box);
    const keys = [];
    CM_FF.forEach(g => g.f.forEach(f => keys.push(f[0])));
    return {
      keys: keys,
      a: keys.filter(k => box.querySelector('#cmff_' + k)).length,
      b: keys.filter(k => box.querySelector('#ffx_' + k)).length,
      labels: CM_FF.map(g => g.t)
    };
  });
  is(q.keys.length >= 25, '  질문지가 ' + q.keys.length + '칸이다');
  is(q.a === q.keys.length, '  고객 365일 쪽에 ' + q.a + '칸이 다 선다');
  is(q.b === q.keys.length, '  상담카드 쪽에 ' + q.b + '칸이 다 선다');
  is(q.labels.length >= 6, '  묶음이 ' + q.labels.length + '개다 — ' + q.labels.join(' · '));
  const html = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const ffBlock = html.slice(html.indexOf('var FACT_FIELDS=['),
                             html.indexOf('var FACT_CATS='));
  is(!/id:'age'/.test(ffBlock) && !/id:'income'/.test(ffBlock) && !/id:'job'/.test(ffBlock),
     '  상담카드에서 나이·직업·소득 글자 칸은 없앴다 — 숫자 질문지가 맡는다');
  is(/id:'goal'/.test(ffBlock) && /id:'health'/.test(ffBlock),
     '  말로 들어야 하는 것(목표·건강)은 그대로 남겼다');
  is(/cmFfHtml\('','ffx_'/.test(html), '  상담카드가 같은 질문지를 그린다');

  console.log('\n[2] 같은 id 로 서로를 덮지 않는다');
  const dup = await page.evaluate(() => {
    const ids = {}, dups = [];
    document.querySelectorAll('[id^="cmff_"],[id^="ffx_"]').forEach(e => {
      if (ids[e.id]) dups.push(e.id); else ids[e.id] = 1;
    });
    return dups;
  });
  is(dup.length === 0, '  같은 이름의 칸이 두 개 있지 않다' + (dup.length ? ' — ' + dup.join(',') : ''));

  console.log('\n[3][4][5] 모르면 평균으로 — 적힌 값은 안 건드린다');
  const av = await page.evaluate(() => {
    for (const k in CM_AVG) delete CM_AVG[k];
    document.getElementById('cmff_f_age').value = '52';    /* 사람이 적은 값 */
    const n = cmFfAvgFill('cmff_');
    const age = document.getElementById('cmff_f_age');
    const inc = document.getElementById('cmff_f_income');
    const before = { n: n, age: age.value, ageMark: age.classList.contains('cm-avg'),
                     inc: inc.value, incMark: inc.classList.contains('cm-avg'),
                     cnt: cmAvgCount('cmff_') };
    /* 고객이 진짜 숫자를 말한다 */
    inc.value = '640'; cmAvgClear(inc);
    return Object.assign(before, { after: inc.classList.contains('cm-avg'), cnt2: cmAvgCount('cmff_') });
  });
  is(av.n > 10, '  빈 칸 ' + av.n + '개를 평균 예시로 채웠다');
  is(av.age === '52' && !av.ageMark, '  이미 적힌 나이 52 는 안 건드렸다 — ' + av.age);
  is(av.inc !== '' && av.incMark, '  빈 칸이던 월소득은 채우고 표시했다 — ' + av.inc);
  is(av.cnt === av.n, '  평균으로 채운 칸 수를 세고 있다 — ' + av.cnt + '칸');
  is(!av.after, '  고객이 640 이라고 말하자 평균 표시가 사라졌다');
  is(av.cnt2 === av.n - 1, '  세는 숫자도 하나 줄었다 — ' + av.cnt2 + '칸');
  const css = await page.evaluate(() => {
    /* 칸의 옷(.cm-*)은 화면이 입혀 준다 — 상담카드 화면을 그리면 함께 들어온다 */
    try { renderFactFind(); } catch (e) {}
    const e = document.getElementById('cmff_f_house');
    if (!e) return null;
    e.classList.add('cm-avg');
    const c = getComputedStyle(e);
    return { bg: c.backgroundColor, bd: c.borderTopColor };
  });
  is(css && css.bg !== 'rgb(255, 255, 255)', '  채운 칸은 바탕색이 다르다 — ' + (css ? css.bg : '없다'));

  console.log('\n[6] 평균이라는 사실이 따라간다');
  const carry = await page.evaluate(() => {
    for (const k in CM_AVG) delete CM_AVG[k];
    CM_FF.forEach(g => g.f.forEach(f => {
      const e = document.getElementById('cmff_' + f[0]); if (e) e.value = '';
    }));
    cmFfAvgFill('cmff_');
    const r = cmFfRead('', 'cmff_');
    const clean = cmFfClean(r);
    return { avg: (r.__avg || []).length, hasAvgKey: '__avg' in clean,
             note: cmSendNote(20, ['나이'], '계산기', r.__avg || []) };
  });
  is(carry.avg > 10, '  읽을 때 평균 칸 이름이 함께 나온다 — ' + carry.avg + '칸');
  is(!carry.hasAvgKey, '  저장할 값에는 그 표시가 섞여 들어가지 않는다');
  is(/평균 예시/.test(carry.note) && /고객 숫자 아님/.test(carry.note),
     '  보낼 때 말해 준다 — ' + carry.note.slice(0, 70));
  is(/평균 예시 — 고객이 모른다고 하신 칸/.test(html), '  AI 에게도 평균이라고 적어 보낸다');
  is(/이 고객의 실제 숫자가 아니므로/.test(html), '  그 값으로 단정하지 말라고 못 박는다');
  is(/factFpRows/.test(html), '  인쇄에도 숫자 칸이 함께 나간다');

  console.log('\n[7] 상담카드에서도 계산기로 바로');
  const to = await page.evaluate(() => {
    let sent = null;
    const old = window.fpPushFin;
    window.fpPushFin = x => { sent = x; };
    const box = document.createElement('div');
    box.innerHTML = '<input id="factCurId" value="">' +
      FACT_FIELDS.map(f => '<input id="ff_' + f.id + '" value="">').join('') +
      cmFfHtml('', 'ffx_');
    document.body.appendChild(box);
    document.getElementById('ff_name').value = '홍길동';
    document.getElementById('ffx_f_age').value = '41';
    document.getElementById('ffx_f_living').value = '210';
    factToCalc();
    window.fpPushFin = old;
    box.remove();
    return sent;
  });
  is(to && to.s_name === '홍길동', '  이름이 간다 — ' + (to ? to.s_name : '안 감'));
  is(to && to.s_age === '41', '  나이가 간다 — ' + (to ? to.s_age : '안 감'));
  is(to && to.s_food === '210', '  생활비가 간다 — ' + (to ? to.s_food : '안 감'));

  console.log('\n[8] 콘솔이 조용하다');
  is(errs.length === 0, '  오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log(bad ? '\n✗ ' + bad + '개 어긋남\n'
                  : '\n──────────────────────────────\n같은 질문지 · 평균 예시 점검 통과 — 다 맞습니다.\n');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
