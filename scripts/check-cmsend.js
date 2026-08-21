/* 고객 365일 → 재무설계 계산기. <b>빈 손으로 가지 않는가.</b>

   사장님 말씀은 이랬다 — 「재무설계 계산기로 넘기면 생활비, 이름, 나이가
   안 불러와진다」. 뜯어 보니 셋 다 이유가 달랐다.

     · <b>생활비</b>는 적어 둘 칸이 아예 없었다. 팩트파인딩에도, 고객
       정보에도. 없는 값이 넘어갈 리 없다.
     · <b>이름</b>은 실명을 따로 적어 둔 고객만 넘어갔다. 실명을 안 적고
       마스킹 이름만 있는 고객은 「고객님」 으로 남았다.
     · <b>나이</b>는 고객 정보의 출생년도에 있는데, 넘기는 쪽은 팩트파인딩
       스물여섯 칸만 봤다. 옆에 있는 것을 안 보고 있었다.

   상담 자리에서 이것이 비면 고객에게 같은 것을 두 번 묻게 된다.

   여기서 확인한다.

     1. 생활비를 적어 둘 칸이 두 군데 다 있는가
     2. 이름·나이·생활비가 계산기의 어느 칸으로 가는지 이어져 있는가
     3. 팩트파인딩이 비어 있어도 <b>고객 정보</b>가 넘어가는가
     4. 팩트파인딩에 적은 값을 고객 정보가 <b>덮지 않는가</b>
     5. 둘 다 없으면 <b>지어내지 않고</b> 채우라고 말하는가
     6. 계산기 쪽에 그 칸이 실제로 있는가                              */
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

/* 가짜 서버 — 고객 한 명의 기본정보만 돌려준다. 견본이라 이름은 홍길동이다. */
/* 가짜 서버는 <b>체인 전부</b>를 받아 줘야 한다 — 다른 화면이 뒤에서
   .limit()·.order() 를 부르는데 그것이 없으면 엉뚱한 데서 터지고,
   그 오류가 이 점검의 결과인 줄 알게 된다. */
const FAKE = `(function(){
  if(!window.__toast){
    window.__toast = [];
    var t = window.toast;
    window.toast = function(m, ms){ window.__toast.push(String(m)); if(t) try{t(m,ms);}catch(e){} };
  }
  window.__row = { birth_year:1980, gender:'M', monthly_income:500, monthly_fixed_expense:280 };
  function res(){
    var r = { error: window.__row ? null : {message:'없음'}, data: window.__row };
    var p = { then:function(ok){ try{ ok(r); }catch(e){} return p; }, catch:function(){ return p; } };
    return p;
  }
  function q(){
    var o = { single:res, then:function(ok){ return res().then(ok); },
              catch:function(){ return this; } };
    ['select','eq','in','order','limit','gte','lte','neq','is','range','filter','not','or','maybeSingle']
      .forEach(function(k){ o[k] = function(){ return o; }; });
    o.single = res;
    return o;
  }
  OS.sb = { from:function(){ return q(); } };
  CM_BASE = {};
  OSC.list = [{ id:'c1', name_masked:'홍*동' }];
  window.__pushed = null;
  fpPushFin = function(x){ window.__pushed = x; };
  fpDeckOpen = function(){};
})()`;

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n[1] 생활비를 적어 둘 칸이 있다');
  const ff = await page.evaluate(() => {
    const all = [];
    CM_FF.forEach(g => g.f.forEach(x => all.push(x[0])));
    return { keys: all, n: all.length };
  });
  is(ff.keys.indexOf('f_living') >= 0, '  팩트파인딩에 생활비 칸(f_living)이 있다');
  is(ff.keys.indexOf('f_age') >= 0 && ff.keys.indexOf('f_income') >= 0, '  나이·월소득 칸도 있다');
  const html = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is(/id="cliExp"/.test(html), '  고객 정보에도 월 생활비 칸(cliExp)이 있다');
  is(/monthly_fixed_expense:\(parseInt\(osVal\('cliExp'\)/.test(html), '  그 칸이 서버로 저장된다');
  is(/select\('phone,birth_year,gender,monthly_income,monthly_fixed_expense,household_notes'\)/.test(html),
     '  다시 열 때 그 칸도 읽어 온다');

  console.log('\n[2] 계산기의 어느 칸으로 가는지 이어져 있다');
  const map = await page.evaluate(() => {
    const o = {};
    TOFIN_MAP.forEach(r => { o[r[0]] = r[1]; });
    return o;
  });
  [['f_name', 's_name', '이름'], ['f_age', 's_age', '나이'],
   ['f_living', 's_food', '생활비'], ['f_income', 's_gross', '월 소득'],
   ['f_gender', 's_gender', '성별']].forEach(x =>
    is(map[x[0]] === x[1], '  ' + x[2] + ' — ' + x[0] + ' → ' + (map[x[0]] || '이어져 있지 않다')));

  console.log('\n[3] 팩트파인딩이 비어 있어도 고객 정보가 넘어간다');
  const r1 = await page.evaluate((fake) => {
    eval(fake);
    CM.meta = { c1: { fp: {}, touch: [] } };          /* 팩트파인딩 텅 빔 */
    return new Promise(res => {
      cmToCalc('c1');
      setTimeout(() => res({ pushed: window.__pushed, toast: window.__toast.slice() }), 300);
    });
  }, FAKE);
  const P = r1.pushed || {};
  is(!!r1.pushed, '  그래도 넘어간다' + (r1.pushed ? '' : ' — ' + r1.toast.join(' | ')));
  is(P.s_name === '홍*동', '  이름 — ' + P.s_name + ' (실명이 없으면 마스킹 이름이라도)');
  is(P.s_age === String(new Date().getFullYear() - 1980), '  나이 — 출생년도 1980 → ' + P.s_age);
  is(P.s_gender === '남성', '  성별 — ' + P.s_gender);
  is(P.s_food === '280', '  생활비 — 월 고정지출 280 → ' + P.s_food);
  is(P.s_gross === '6000', '  월 소득 500 → 연 총급여 6000 — ' + P.s_gross);
  is(/고객 정보에서 가져왔습니다/.test(r1.toast.join(' ')),
     '  어디서 가져온 값인지 말해 준다 — ' + (r1.toast[r1.toast.length - 1] || '').slice(0, 70));

  console.log('\n[4] 팩트파인딩에 적은 값을 고객 정보가 덮지 않는다');
  const r2 = await page.evaluate((fake) => {
    eval(fake);
    CM.meta = { c1: { fp: { f_age: '52', f_living: '190', f_income: '700' }, touch: [] } };
    return new Promise(res => {
      cmToCalc('c1');
      setTimeout(() => res({ pushed: window.__pushed, toast: window.__toast.slice() }), 300);
    });
  }, FAKE);
  const Q = r2.pushed || {};
  is(Q.s_age === '52', '  나이는 적어 둔 52 그대로 — ' + Q.s_age + ' (기본정보는 ' + (new Date().getFullYear() - 1980) + ')');
  is(Q.s_food === '190', '  생활비는 적어 둔 190 그대로 — ' + Q.s_food + ' (기본정보는 280)');
  is(Q.s_gross === '8400', '  월소득 700 → 8400 그대로 — ' + Q.s_gross);
  is(Q.s_name === '홍*동', '  이름은 여전히 채워진다 — ' + Q.s_name);

  console.log('\n[4-2] 성별은 어떤 표기로 적혀 있어도 알아듣는다');
  const gd = await page.evaluate(() =>
    ['M', 'F', '남성', '여성', '남', '여', ''].map(v => fpMapApply({ f_gender: v }).s_gender || '(안 보냄)'));
  is(gd[0] === '남성' && gd[2] === '남성' && gd[4] === '남성', '  M · 남성 · 남 → 남성 — ' + [gd[0], gd[2], gd[4]].join(' '));
  is(gd[1] === '여성' && gd[3] === '여성' && gd[5] === '여성',
     '  F · 여성 · 여 → 여성 — ' + [gd[1], gd[3], gd[5]].join(' ') + ' (전에는 「여성」 이 남성으로 갔다)');
  is(gd[6] === '(안 보냄)', '  비어 있으면 안 보낸다 — 짐작으로 남성이라 하지 않는다');

  console.log('\n[4-3] 넘기는 표는 하나다 — 두 벌로 갈라져 있지 않다');
  const one = await page.evaluate(() => ({
    same: TOFIN_MAP === FP_MAP,
    living: FP_MAP.filter(r => r[0] === 'f_living').map(r => r[1]).join(''),
    all3: FP_MAP.every(r => r.length === 3)
  }));
  is(one.same, '  FP_MAP 과 TOFIN_MAP 이 같은 표다 — 한 곳만 고치면 된다');
  is(one.living === 's_food', '  그 표에 생활비가 있다 — f_living → ' + one.living);
  is(one.all3, '  모든 줄에 옮기는 방법이 적혀 있다');

  console.log('\n[5] 둘 다 없으면 지어내지 않는다');
  const r3 = await page.evaluate((fake) => {
    eval(fake);
    window.__row = null;                             /* 서버에도 아무것도 없다 */
    CM_BASE = {};
    OSC.list = [];                                   /* 이름조차 없다 */
    CM.meta = { c9: { fp: {}, touch: [] } };
    try{ localStorage.removeItem('apex_cli_real_' + cmWho()); }catch(e){}
    window.__pushed = null; window.__toast = [];
    return new Promise(res => {
      cmToCalc('c9');
      setTimeout(() => res({ pushed: window.__pushed, toast: window.__toast.slice() }), 300);
    });
  }, FAKE);
  is(r3.pushed === null, '  아무것도 안 넘긴다 — 빈 칸을 지어내 채우지 않는다');
  is(/먼저 채워 주세요/.test(r3.toast.join(' ')),
     '  무엇을 해야 하는지 말해 준다 — ' + (r3.toast[0] || '').slice(0, 60));

  console.log('\n[6] 계산기 쪽에 그 칸이 실제로 있다');
  const fin = fs.readFileSync(path.join(ROOT, 'app/finance.html'), 'utf8');
  ['s_name', 's_age', 's_gender', 's_food', 's_gross'].forEach(id =>
    is(new RegExp('id="' + id + '"').test(fin), '  finance.html 에 ' + id + ' 칸이 있다'));

  console.log('\n[7] 콘솔이 조용하다');
  is(errs.length === 0, '  오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log(bad ? '\n✗ ' + bad + '개 어긋남\n'
                  : '\n──────────────────────────────\n계산기로 넘기기 점검 통과 — 다 맞습니다.\n');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
