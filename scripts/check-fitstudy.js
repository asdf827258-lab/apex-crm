/* 진단서로 <b>공부</b>가 되는가 · 기준을 <b>사장님이 고칠</b> 수 있는가

   진단서는 <b>답</b>을 보여 줍니다. 그런데 답만 보면 고객이 되물을 때
   막힙니다 — 「이 숫자 어디서 나왔어요?」 신입은 셈법을 모르고,
   경력자는 <b>자기 습관</b>을 못 봅니다.

   그리고 연령대 기준은 <b>처음 값</b>일 뿐입니다. 현장에서 맞는 기준은
   사장님이 압니다 — 고치시면 그것이 이 도구의 기준이 되어야 합니다.

   여기서 못 박는 것은 다섯입니다.

     1. <b>칸마다 공부 글이 있다.</b> 여섯 칸 전부 — 하나라도 비면 그
        칸에서 되물을 때 막힌다.
     2. <b>신입이 틀리는 것</b>과 <b>경력자가 놓치는 것</b>을 갈라 적는다.
        둘은 다른 실수다.
     3. <b>꺼 두어도 종이에는 나온다.</b> 진단서를 들고 공부하실 수 있게.
     4. <b>고치면 그 값이 쓰인다</b> — 화면도 인쇄도. 그리고 고친 자리는
        <b>고쳤다고 표시</b>한다. 표시가 없으면 나중에 왜 그 숫자인지
        아무도 설명 못 한다.
     5. <b>되돌릴 수 있다.</b> 되돌릴 수 없는 편집은 무섭다.            */
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
  await new Promise(r => srv.listen(0, r));
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1100, height: 1000 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + srv.address().port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(700);

  head('[1] 진단서 <칸마다> 공부 글이 있다');
  const st = await pg.evaluate(() => {
    /* 견본 자료 — 앱이 스스로 넣는 홍길동 자리다. 실제 고객 이름이 아니다. */
    localStorage.clear(); doSample(); showPanel('fit'); go('edit');
    var need = ['w', 'h', 'n', 'e', 's'], hole = [], short = [];
    FIT_TABS.forEach(function (t) {
      var x = FIT_STUDY[t.k];
      if (!x) { hole.push(t.t + '(통째로)'); return; }
      need.forEach(function (f) {
        if (!x[f]) hole.push(t.t + '·' + f);
        else if (String(x[f]).replace(/<[^>]+>/g, '').length < 12) short.push(t.t + '·' + f);
      });
    });
    return { tabs: FIT_TABS.length, hole: hole, short: short,
             dom: document.querySelectorAll('.fst').length };
  });
  await pg.waitForTimeout(300);
  is(st.hole.length === 0, st.hole.length ? ('빈 자리 — ' + st.hole.slice(0, 5).join(' / ')) :
     '칸 ' + st.tabs + '개 <전부> 다섯 줄(무엇 · 셈법 · 신입 · 경력 · 할 말)을 갖췄다');
  is(st.short.length === 0, st.short.length ? ('한 줄이 너무 짧다 — ' + st.short.slice(0, 4).join(' / ')) :
     '어느 줄도 <빈말이 아니다>');
  is(st.dom === st.tabs, '공부 글이 <칸마다 하나씩> DOM 에 있다 (' + st.dom + ' / ' + st.tabs + ')');

  head('[2] <신입>과 <경력자>를 갈라 적는다 — 둘은 다른 실수다');
  const two = await pg.evaluate(() => {
    var same = [];
    FIT_TABS.forEach(function (t) {
      var x = FIT_STUDY[t.k]; if (!x) return;
      if (String(x.n) === String(x.e)) same.push(t.t);
    });
    var sec = document.querySelector('.fitsec.on .fst');
    return { same: same, txt: sec ? (sec.textContent || '').replace(/\s+/g, ' ') : '' };
  });
  is(two.same.length === 0, two.same.length ? ('같은 말을 두 번 적었다 — ' + two.same.join(' / ')) :
     '<신입이 틀리는 것>과 <경력자가 놓치는 것>이 칸마다 다르다');
  is(/신입이 자주 틀리는 것/.test(two.txt) && /경력자도 놓치는 것/.test(two.txt),
     '화면에 <그 이름 그대로> 적혀 있다 — 무엇을 읽는지 알 수 있다');

  head('[3] 꺼 두어도 <종이에는 나온다>');
  const off = await pg.evaluate(() =>
    [].slice.call(document.querySelectorAll('.fst')).filter(x => getComputedStyle(x).display !== 'none').length);
  await pg.evaluate(() => { S.fitStudy = false; save(); go('edit'); });
  await pg.waitForTimeout(300);
  await pg.emulateMedia({ media: 'print' });
  await pg.waitForTimeout(300);
  const onPaper = await pg.evaluate(() =>
    [].slice.call(document.querySelectorAll('.fst')).filter(x => getComputedStyle(x).display !== 'none').length);
  await pg.emulateMedia({ media: 'screen' });
  is(onPaper === st.tabs,
     '꺼 두어도 <종이에는 ' + onPaper + '칸 전부> 나온다 — 진단서를 들고 공부하실 수 있게');
  /* <b>늘 통과하는 줄을 두지 않는다</b> — 안 울리는 알람은 알람이 아니다 (8번) */
  is(off === 0, '화면에서는 <꺼 두면 안 보인다> — 눌러서 켠다 (지금 화면에 ' + off + '칸)');

  head('[4] 연령대 기준을 <사장님이 고치면 그 값이 쓰인다>');
  const ed = await pg.evaluate(() => {
    localStorage.clear(); doSample(); showPanel('age'); go('edit'); agePlanPick('40');
    function amtOf() {
      var f = [].slice.call(document.querySelectorAll('.apf')).filter(x => /암 치료비/.test(x.textContent))[0];
      var v = f && f.querySelector('.apt td.v');
      return { em: f ? (f.querySelector('.apb em') || {}).textContent.replace(/\s+/g, ' ') : '',
               amt: v ? v.textContent : '', mine: !!(f && f.querySelector('.apmine')) };
    }
    S.apOpen = '암 치료비'; go('edit');
    var b = amtOf();
    if (!S.apEdit) S.apEdit = {};
    S.apEdit['40'] = { '암 치료비': { p: 1, m: 1.4, why: '우리 기준으로는 여기서 크게 잡습니다.' } };
    save(); go('edit');
    var a = amtOf();
    var why = (document.querySelector('.apf.on .apwhy') || {}).textContent || '';
    return { b: b, a: a, why: why.replace(/\s+/g, ' ') };
  });
  await pg.waitForTimeout(300);
  is(ed.b.amt !== ed.a.amt && !!ed.a.amt,
     '고치면 <권장 금액이 바뀐다> — ' + ed.b.amt + ' → ' + ed.a.amt);
  is(ed.a.mine, '고친 자리에 <「사장님이 고침」>이 붙는다 — 어느 것이 사장님 값인지 보인다');
  is(/우리 기준으로는/.test(ed.why), '<고친 이유>가 그대로 화면에 선다');
  is(/140%/.test(ed.a.em), '<바꾼 배수>가 그대로 적힌다 — ' + ed.a.em);

  head('[5] 언제든 <되돌릴 수 있다>');
  const rs = await pg.evaluate(() => {
    var warn = document.querySelector('.apwrap .note.w');
    var hadWarn = !!warn && /고치셨습니다/.test(warn.textContent || '');
    apEditResetAll('40');
    var f = [].slice.call(document.querySelectorAll('.apf')).filter(x => /암 치료비/.test(x.textContent))[0];
    return { hadWarn: hadWarn,
             em: f ? (f.querySelector('.apb em') || {}).textContent.replace(/\s+/g, ' ') : '',
             mine: !!(f && f.querySelector('.apmine')),
             left: JSON.stringify((S.apEdit || {})['40'] || null) };
  });
  await pg.waitForTimeout(300);
  is(rs.hadWarn, '고친 곳이 있으면 <몇 곳을 고쳤는지> 맨 위에 말한다');
  is(!rs.mine && /100%/.test(rs.em), '되돌리면 <처음 값>으로 돌아간다 — ' + rs.em);
  is(rs.left === 'null' || rs.left === '{}', '되돌린 뒤 <남는 찌꺼기가 없다> (' + rs.left + ')');

  head('[6] 조용한가');
  is(errs.length === 0, errs.length ? ('콘솔 에러 — ' + errs.join(' / ')) : '콘솔에 에러가 없다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') :
    '공부 칸 · 사장님 기준 점검 통과 — 혼자 익히고, 고쳐서 쓰실 수 있습니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
