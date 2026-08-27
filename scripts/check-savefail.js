/* <b>손으로 적으신 것이 이 기기에 안 담겼는데 아무 말이 없던 자리.</b>

   localStorage 쓰기는 막힐 수 있습니다 — 기기 저장 공간이 찼거나,
   사생활 보호 모드이거나, 사파리가 한도를 걸었을 때입니다. 흔합니다.
   폰에서 상담하시니 더 흔합니다.

   그런데 여태 이렇게 삼켰습니다.

     try{ localStorage.setItem(…) }catch(e){}

   막히면 <b>아무 일도 안 일어난 것처럼</b> 보입니다. 화면에는 그대로
   찍혀 있습니다 — 메모리에는 들어 있으니까요. 사장님은 담아 두신 줄
   아시고 상담에 들어가십니다. 그리고 새로고침 한 번에, 폰이 탭을
   버리는 순간에, <b>통째로 사라집니다.</b>

   사라지는 것이 무엇인지가 문제입니다. 전부 <b>손으로 치신 것</b>입니다.

     · 계약 목록      회사 · 상품명 · 보험료 · 유지/해지 · 메모
                     — <b>제안서가 통째로 여기서 나옵니다</b>
     · 고친 값        보장분석에서 되짚어 고치신 담보 · 특약 금액
     · 권장 금액      담보마다 얼마가 필요한지 적어 두신 숫자
     · 제안서 첫머리  고객 호칭 · 설계사 이름 · 연락처 · 인사말
     · 담보 표기      회사마다 다르게 쓰는 이름을 사장님이 더하신 것
     · 회사 이름      자료에서 못 찾은 회사를 사장님이 넣으신 것

   앱이 지어낸 값이 아니라 <b>사장님이 직접 치신 값</b>이라, 사라지면
   다시 만들 방법이 없습니다. 다시 치시는 수밖에 없습니다 — 고객
   앞에서.

   여기서 확인합니다.
     1. 여섯 자리가 막혔을 때 <b>전부 말을 하는가</b>
     2. <b>무엇이</b> 안 담겼는지 이름을 대는가 (「저장 실패」 만으로는
        무엇을 다시 쳐야 하는지 모릅니다)
     3. <b>헛알람이 없는가</b> — 잘 담길 때는 조용한가
     4. 같은 것을 여러 번 쳐도 <b>한 번만</b> 말하는가 (글자마다 부르는
        자리라, 안 막으면 스무 번 뜹니다 — 그러면 안 읽으십니다)
     5. 서로 <b>다른 것</b>이 막히면 각각 말하는가 (한 번 말하고 입을
        닫으면, 두 번째로 잃은 것은 또 조용해집니다)
     6. 말하고 나서도 <b>화면의 값은 그대로 있는가</b> — 상담 중에
        치시던 것을 경고가 날려 버리면 더 나쁩니다                     */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 손으로 치는 여섯 자리. `run` 은 그 자리를 실제로 부르고, `word` 는
   경고가 반드시 대야 하는 이름이다. 표를 <b>하나만</b> 두어 자리가
   늘어도 빠뜨릴 곳이 없게 한다 (CLAUDE.md 5번). */
const SPOTS = [
  { key: '계약 목록', why: '제안서가 통째로 여기서 나온다',
    run: `BABA.plans=[{id:'p1',co:'삼성화재',nm:'무배당 튼튼종합보험',prem:50000,slot:'b',keep:'',cov:{}}];babaPlanSave();` },
  { key: '고친 값', why: '되짚어 고치신 담보·특약 금액',
    run: `insFixPut('SIG-TEST',{'k1':{w:3000,h:1000}});` },
  { key: '권장 금액', why: '담보마다 얼마가 필요한지',
    run: `babaRecSet('cancer','5000');` },
  { key: '제안서 첫머리', why: '고객 호칭·설계사 이름·인사말',
    run: `window.prompt=function(){return '홍길동 고객님';};babaPropSet('who');` },
  { key: '더하신 담보 표기', why: '회사마다 다른 이름을 사장님이 더하신 것',
    run: `babaSynSave({cancer:['악성신생물']});` },
  { key: '넣으신 회사 이름', why: '자료에서 못 찾은 회사를 넣으신 것',
    run: `insCoMineSave(['가나다생명']);` },
];

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 180)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  /* 저장을 막고 · 무슨 말을 했는지 모아 오는 틀. 진짜 QuotaExceededError
     를 던진다 — 실제로 기기가 찼을 때 브라우저가 던지는 그것이다. */
  await page.evaluate(() => {
    window.__said = [];
    const realToast = window.toast;
    window.toast = function (m) { window.__said.push(String(m)); if (realToast) try { realToast.apply(null, arguments); } catch (e) {} };
    const realSet = localStorage.setItem.bind(localStorage);
    window.__block = false;
    localStorage.setItem = function (k, v) {
      if (window.__block) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
      return realSet(k, v);
    };
    /* 한 번만 말하는 자리라, 자리마다 새로 시작해야 견줄 수 있다 */
    window.__reset = function () { window.__said = []; window._insSaveWarned = {}; };
  });

  const fire = (js, block) => page.evaluate(({ js, block }) => {
    window.__reset(); window.__block = !!block;
    let threw = '';
    try { (new Function(js))(); } catch (e) { threw = String(e && e.message || e); }
    window.__block = false;
    return { said: window.__said.slice(), threw: threw };
  }, { js, block });

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[1] 저장이 막히면 여섯 자리 모두 말을 한다');
  for (const s of SPOTS) {
    const r = await fire(s.run, true);
    const all = r.said.join(' ');
    is(r.said.length > 0 && !r.threw,
       '  <b>' + s.key + '</b> — 말을 한다 (' + s.why + ')' +
       (r.threw ? ' · ⚠ 터졌다: ' + r.threw.slice(0, 60) : ''));
    is(all.indexOf(s.key) >= 0,
       '    <b>무엇이</b> 안 담겼는지 이름을 댄다 — 「' + s.key + '」' +
       (all.indexOf(s.key) >= 0 ? '' : ' · 실제로는 「' + all.slice(0, 60) + '」'));
    is(/새로고침하면 사라집니다/.test(all),
       '    <b>언제 사라지는지</b> 말한다 — 「새로고침하면 사라집니다」');
    is(/저장 공간|보호 모드/.test(all),
       '    <b>무엇을 보시면 되는지</b>까지 말한다 — 저장 공간 · 사생활 보호 모드');
  }

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[2] 잘 담길 때는 조용하다 — 헛알람은 안 잡는 것보다 나쁘다');
  for (const s of SPOTS) {
    const r = await fire(s.run, false);
    is(r.said.length === 0 && !r.threw,
       '  <b>' + s.key + '</b> — 아무 말도 안 한다' +
       (r.said.length ? ' · 실제로는 「' + r.said.join(' ').slice(0, 70) + '」' : ''));
  }

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[3] 같은 것을 여러 번 쳐도 한 번만 말한다');
  const many = await fire(SPOTS[0].run + SPOTS[0].run + SPOTS[0].run, true);
  is(many.said.length === 1,
     '  계약 목록을 세 번 담아도 <b>한 번</b>만 뜬다 — ' + many.said.length + '번 ' +
     '(글자마다 부르는 자리라, 안 막으면 스무 번 뜬다)');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[4] 다른 것이 막히면 그것도 말한다 — 한 번 말하고 입 닫지 않는다');
  const two = await fire(SPOTS[0].run + SPOTS[2].run, true);
  const t = two.said.join(' ');
  is(two.said.length === 2 && /계약 목록/.test(t) && /권장 금액/.test(t),
     '  계약 목록 · 권장 금액이 <b>둘 다</b> 막히면 둘 다 말한다 — ' +
     two.said.length + '번 (' + two.said.map(x => (x.match(/^[^을]+/) || [''])[0]).join(' · ') + ')');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[5] 말하고 나서도 화면의 값은 그대로 있다');
  const keep = await page.evaluate(() => {
    window.__reset(); window.__block = true;
    BABA.plans = [{ id: 'p1', co: '삼성화재', nm: '무배당 튼튼종합보험', prem: 50000, slot: 'b', keep: '', cov: {} }];
    babaPlanSave();
    window.__block = false;
    const L = babaPlanOf('b');
    return { n: L.length, nm: (L[0] || {}).nm || '', prem: (L[0] || {}).prem, said: window.__said.length };
  });
  is(keep.said > 0 && keep.n === 1 && keep.nm === '무배당 튼튼종합보험' && keep.prem === 50000,
     '  못 담았다고 말하면서도 <b>치시던 계약은 안 날린다</b> — ' +
     keep.n + '건 · ' + keep.nm + ' · 월 ' + keep.prem + '원 ' +
     '(상담 중에 경고가 값을 지우면 더 나쁘다)');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[6] 말하는 자리는 한 곳뿐이다');
  const one = await page.evaluate(() => {
    /* 문구가 두 벌이 되면 한쪽만 고쳐진다 (CLAUDE.md 5번). 담는 자리마다
       제 문구를 쓰지 않고 <b>insSaveFail 하나</b>를 부르는지 본다. */
    const srcs = [babaPlanSave, babaPropSet, babaRecSet, babaSynSave, insCoMineSave, insFixPut, babaSave]
      .map(f => String(f));
    /* <b>담는</b> 자리만 본다. 꺼낼 때(getItem·JSON.parse) 조용한 것은
       정상이다 — 아직 담아 둔 것이 없다는 뜻이라 할 말이 없다. 그것까지
       잡으면 헛알람이 된다 (CLAUDE.md 8번). 그래서 setItem 바로 뒤에
       붙은 catch 만 열어 본다. */
    const swallow = [];
    srcs.forEach((s, i) => {
      s.split('localStorage.setItem').slice(1).forEach(tail => {
        const m = tail.match(/catch\s*\([^)]*\)\s*\{([\s\S]*?)\}/);
        if (!m || !/insSaveFail/.test(m[1])) swallow.push(i);
      });
    });
    return {
      viaOne: srcs.every(s => /insSaveFail/.test(s)),
      noOwn: !srcs.some(s => /새로고침하면 사라집니다/.test(s)),
      swallow: swallow.length
    };
  });
  is(one.viaOne, '  일곱 자리가 모두 <b>insSaveFail 하나</b>를 부른다');
  is(one.noOwn, '  제 문구를 따로 쓰는 자리가 없다 — 고칠 곳이 하나다');
  is(one.swallow === 0,
     '  <b>담을 때 말없이 삼키는 자리</b>가 없다 — ' + one.swallow + '곳 ' +
     '(꺼낼 때 조용한 것은 정상이다)');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[7] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 손으로 치신 것이 말없이 사라질 수 있습니다')
                  : '✓ 손으로 치신 것이 안 담기면 무엇이 안 담겼는지 말합니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
