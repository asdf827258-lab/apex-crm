/* 급여 · 비급여 · 산정특례를 <b>제대로</b> 알려 주는가 · 한 장씩 카톡으로

   설계사가 여기를 틀리면 <b>고객이 그 말을 믿고 준비를 안 합니다.</b>
   그리고 정작 그 일이 왔을 때 무너집니다. 그래서 넷을 못 박습니다.

     1. <b>표는 한 벌</b>이다 (apex-nhis.js). 윤시현의 두뇌도 자동
        보장분석도 여기를 가리킨다 — 두 벌이 되면 한쪽만 고쳐진다 (5번).
     2. <b>덮는 것만 적지 않는다.</b> 상한제·산정특례는 「무엇을 안 덮는지」를
        같이 적어야 한다. 좋은 쪽만 적으면 그 자리에서는 통해도 정작
        그 일이 왔을 때 무너진다.
     3. <b>비율·한도·기간 같은 숫자를 적지 않는다.</b> 고시로 바뀌는 값이라
        외운 숫자를 고객 앞에서 말하는 것이 가장 위험하다 (2번).
     4. <b>한 장씩 카톡으로</b> — 화면에 보이는 것만 옮기고, 맨 끝에
        「심사 결과에 따릅니다」를 붙인다. 숫자만 잘라 보내면 그것이
        확정된 값으로 읽힌다.                                          */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': /\.js$/.test(f) ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

(async () => {
  head('[0] 표가 <한 벌>이다 — 두 벌이 되면 한쪽만 고쳐진다 (5번)');
  const nh = fs.readFileSync(path.join(ROOT, 'app/apex-nhis.js'), 'utf8');
  const ba = fs.readFileSync(path.join(ROOT, 'app/ba.html'), 'utf8');
  is(/<script src="apex-nhis.js">/.test(ba), 'ba.html 이 <apex-nhis.js 를 읽어> 온다');
  /* 표를 ba.html 안에 <b>또</b> 만들어 두지 않았는가 */
  const twin = ['NHIS_TERMS', 'NHIS_SHIELD', 'NHIS_CALLOUT', 'NHIS_EASY', 'NHIS_WHY']
    .filter(k => new RegExp('var\\s+' + k + '\\s*=').test(ba));
  is(twin.length === 0, twin.length ? ('ba.html 안에 표를 <또> 만들었다 — ' + twin.join(' ')) :
     '표를 ba.html 안에 <다시 적지 않았다> — 고칠 자리가 한 곳이다');

  head('[1] 국가 제도는 <안 덮는 것>을 같이 적는다');
  /* 파일을 <b>글로</b> 읽어 본다 — 화면에 세우기 전에 여기서 걸러야 한다 */
  const sh = nh.match(/var NHIS_SHIELD[\s\S]*?\n\];/);
  is(!!sh, 'NHIS_SHIELD 표가 있다');
  const shTxt = sh ? sh[0] : '';
  is(/산정특례/.test(shTxt), '<산정특례>가 표에 있다');
  is(/본인부담상한제/.test(shTxt), '<본인부담상한제>가 표에 있다');
  const noCount = (shTxt.match(/\bno:/g) || []).length, okCount = (shTxt.match(/\bok:/g) || []).length;
  is(noCount > 0 && noCount === okCount,
     '제도마다 <덮는 것과 안 덮는 것>이 짝으로 있다 (덮는 것 ' + okCount + ' · 안 덮는 것 ' + noCount + ')');
  is(/비급여/.test(shTxt), '「안 덮는 것」에 <비급여>가 이름으로 적혀 있다');

  head('[2] 바뀌는 <숫자>를 적지 않는다 (2번)');
  /* 「5%」·「5년」·「87만원」 같은 것. 「①②③」·「4세대」 같은 <b>차례</b>는 뺀다.
     넓게 잡으면 헛것을 잡는다 — 확실한 것만 잡는다 (8번). */
  const nums = [];
  nh.split('\n').forEach((ln, i) => {
    const m = ln.match(/(\d+(?:\.\d+)?)\s*(%|퍼센트|년|개월|일|만원|원)/g);
    if (m) nums.push('[' + (i + 1) + '줄] ' + m.join(' '));
  });
  is(nums.length === 0, nums.length ?
     ('바뀌는 숫자를 적어 두었다 — ' + nums.slice(0, 3).join(' / ')) :
     '비율 · 한도 · 기간을 <한 개도> 안 적었다 — 고시로 바뀌는 값이다');
  is(/고시로 바뀝니다/.test(nh) && /국민건강보험공단/.test(nh),
     '<「숫자는 고시로 바뀝니다 — 공단에서 확인」>이라고 화면에도 적는다');

  await new Promise(r => srv.listen(0, r));
  const br = await chromium.launch();
  const ctx = await br.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + srv.address().port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(700);

  head('[3] 🧠 윤시현의 두뇌 — <병원비 공부방>이 실제로 선다');
  const brain = await pg.evaluate(() => {
    /* 견본 자료 — 앱이 스스로 넣는 홍길동 자리다. 실제 고객 이름이 아니다. */
    localStorage.clear(); doSample(); showPanel('brain'); go('edit');
    return { folds: document.querySelectorAll('.nhf').length,
             txt: (document.body.textContent || '').replace(/\s+/g, ' ') };
  });
  await pg.waitForTimeout(300);
  is(brain.folds === 5, '공부방이 <다섯 칸>으로 선다 (지금 ' + brain.folds + '칸)');
  is(/왜 정확히 알아야/.test(brain.txt), '<왜 정확히 알아야 하는지>부터 적는다');
  const open = await pg.evaluate(() => {
    nhOpen('shield');
    var t = (document.querySelector('.nhf.on .nhi') || {}).textContent || '';
    return t.replace(/\s+/g, ' ');
  });
  await pg.waitForTimeout(300);
  is(/산정특례/.test(open) && /덮습니다/.test(open) && /안 덮습니다/.test(open),
     '펴면 <산정특례>의 「덮는 것 · 안 덮는 것」이 나란히 선다');
  /* 「등록」 한 글자로 찾으면 「덮는 것」 칸에도 있어 <b>늘 통과</b>한다.
     못 박아야 하는 것은 <b>「자동이 아니다」</b> 라는 말 그 자체다. */
  is(/자동.{0,6}아닙니다/.test(open) && /등록을 해야/.test(open),
     '<「암이면 자동이 아니다 — 등록을 해야 한다」>를 적는다 — 제일 많이 틀리는 자리');

  head('[4] 📋 자동 보장분석 — <쉬운 말로> 칸');
  const fit = await pg.evaluate(() => {
    showPanel('fit'); S.fitTab = 'easy'; go('edit');
    var sec = document.querySelector('.fitsec[data-k=easy]');
    return { tabs: document.querySelectorAll('.ftb').length,
             q: sec ? sec.querySelectorAll('.nhq').length : 0,
             pic: sec ? sec.querySelectorAll('.nhpic .np1').length : 0,
             txt: sec ? (sec.textContent || '').replace(/\s+/g, ' ') : '',
             /* 칸이 그려져 있어도 <b>누를 단추</b>가 없으면 사장님은 못 갑니다 */
             btn: [].slice.call(document.querySelectorAll('.ftb'))
                    .filter(function (b) { return /쉬운 말/.test(b.textContent || ''); }).length,
             intro: (document.querySelector('.card>p') || {}).textContent || '' };
  });
  await pg.waitForTimeout(300);
  is(fit.btn === 1, '<「쉬운 말로」 단추>가 칸 줄에 있다 — 그려만 두고 못 가면 없는 것과 같다');
  is(fit.q >= 4, '<고객 앞에서 그대로 읽는 문답>이 ' + fit.q + '개 선다');
  is(fit.pic === 3, '<급여 · 비급여 · 병원 밖> 지갑 셋을 한 장으로 보여 준다 (지금 ' + fit.pic + '칸)');
  is(/나라가 값을 정해 둔|값을 미리 정해 둔/.test(fit.txt) && /내가 다 냅니다/.test(fit.txt),
     '어려운 말을 안 쓴다 — 「나라가 값을 정해 둔 치료 / 내가 다 냅니다」');
  is(fit.intro.indexOf(String(fit.tabs) + '칸') >= 0 && !/[한두세네]\s*칸|다섯 칸|여섯 칸|일곱 칸/.test(fit.intro),
     '머리글의 칸 수가 <실제 칸 수와 같다> (' + fit.tabs + '칸) · 손으로 적은 자리가 없다 — 칸을 늘리면 그 자리가 어긋난다');

  head('[5] 💬 한 장씩 카톡으로');
  await pg.evaluate(() => { localStorage.clear(); doSample(); S.deck = true; go('show'); });
  await pg.waitForTimeout(500);
  is(await pg.evaluate(() => !!document.querySelector('#deckBar .dnav.kk')),
     '넘기는 띠에 <💬 단추>가 있다 — 무대 안에 두면 고객이 먼저 본다');
  await pg.evaluate(() => { var L = deckList(), i; for (i = 0; i < L.length; i++) if (L[i].id.indexOf('s8_') === 0) { deckJump(i); return; } });
  await pg.waitForTimeout(400);
  await pg.click('#deckBar .dnav.kk');
  await pg.waitForTimeout(500);
  const cp = await pg.evaluate(() => navigator.clipboard.readText());
  is(cp.length > 60, '누르면 <그 장이 글로> 복사된다 (' + cp.length + '자)');
  is(/심사 결과에 따릅니다/.test(cp),
     '맨 끝에 <「심사 결과에 따릅니다」>가 붙는다 (2번) — 숫자만 잘라 보내면 확정된 값으로 읽힌다');
  is(/설계 기준/.test(cp), '<「설계 기준」>이라고 밝힌다');
  /* 접어 둔 잔글이 따라가면 고객이 <b>안 본 말</b>을 받는다 */
  const hidden = await pg.evaluate(() => {
    var L = deckList(), i = deckAt(L), s = L[i];
    var d = s.querySelector('.deep,.sd2,.simft');
    return d ? (d.textContent || '').replace(/\s+/g, ' ').slice(0, 24) : '';
  });
  is(!hidden || cp.replace(/\s+/g, ' ').indexOf(hidden) < 0,
     '화면에서 <접어 둔 잔글은 안 따라간다> — 고객이 안 본 말을 받지 않는다');

  head('[6] 조용한가');
  is(errs.length === 0, errs.length ? ('콘솔 에러 — ' + errs.join(' / ')) : '콘솔에 에러가 없다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') :
    '병원비 공부방 · 쉬운 말 · 카톡 복사 점검 통과.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
