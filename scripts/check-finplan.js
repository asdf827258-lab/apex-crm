/* 재무 계산이 한 줄기인가, 그리고 답이 맞는가.

   전에는 같은 계산이 여기저기 흩어져 있었다.
     · 복리 함수가 여덟 벌이었고, 그중 하나만 이율을 0.04 로 받아 백 배가 틀렸다
     · 상속세가 세 벌이었고 공제가 달라 같은 재산에 다른 세액이 나왔다
     · 달러는 한 탭에서 수익률 0%, 옆 탭에서 3.5% 복리였다
   고객 앞에서 화면을 넘기다 숫자가 달라지면 그 자리에서 상담이 끝난다.

   그래서 여기서 확인한다.

     1. 가정값과 계산식이 한 곳에 있는가
     2. 세금·복리 계산이 <b>손으로 푼 답</b>과 같은가 (교과서 문제로 검산)
     3. 세 화면이 실제로 뜨고, 부족액을 이어받는가
     4. base64 안에 든 계산기도 검사한다 — 여태 아무도 안 봤다        */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8867;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const STUB = `
window.supabase={createClient:function(){
 var mk=function(){var one=false;var a={
   select:function(){return a},eq:function(){return a},gte:function(){return a},lte:function(){return a},
   is:function(){return a},neq:function(){return a},in:function(){return a},not:function(){return a},
   order:function(){return a},limit:function(){return a},range:function(){return a},
   single:function(){one=true;return a},insert:function(){return a},update:function(){return a},upsert:function(){return a},
   then:function(res){return Promise.resolve({data:one?null:[],error:null}).then(res);}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'u1'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'u1'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

let pass = 0, fail = 0;
const ok = m => { pass++; console.log('  ✓ ' + m); };
const no = m => { fail++; console.log('  ✗ ' + m); };
const is = (c, m) => c ? ok(m) : no(m);
const fmt = v => (Math.abs(v) < 100 && v % 1 !== 0) ? v.toFixed(3) : Math.round(v).toLocaleString();
const near = (a, b, tol, m) => is(Math.abs(a - b) <= tol, m + ' — 나온 값 ' + fmt(a) + ', 손으로 푼 답 ' + fmt(b));

(async () => {
  const app = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');

  /* ═══ 1. 가정값이 한 곳에 있는가 ═══ */
  console.log('\n[1] 가정값과 계산식이 한 곳에 모였는가');
  is(/var FIN_ASSUME=\{/.test(app), '가정값이 FIN_ASSUME 한 덩어리로 있다');
  ['inf', 'retUsd', 'usdNow', 'usdEnd', 'taxInt', 'drawRate']
    .forEach(k => is(new RegExp('\\b' + k + ':').test(app.slice(app.indexOf('var FIN_ASSUME={'), app.indexOf('var FIN_ASSUME={') + 900)),
      'FIN_ASSUME 에 ' + k + ' 가 있다'));
  is(/var FIN_TAX=\{/.test(app) && /상속세 및 증여세법/.test(app), '세율·공제가 FIN_TAX 한 곳에 있고 근거 법을 밝힌다');
  ['finFV', 'finPMT', 'finNeed', 'finReal', 'finToday', 'finTaxOf', 'finInherit', 'finGiftTax']
    .forEach(k => is(new RegExp('function ' + k + '\\(').test(app), k + ' 가 있다'));

  /* 새 화면이 옛 함수를 안 쓰는가 — 섞이면 다시 백 배 사고가 난다 */
  const newPart = app.slice(app.indexOf('var FIN_ASSUME={'), app.indexOf('function renderCalcPage('));
  is(!/\bprFV\(|\bicFv\(|\bdkFv\(|\btrFv\(|\bfvMonthly\(/.test(newPart),
    '새 화면은 옛 복리 함수를 쓰지 않는다 (단위 규약이 달라 섞으면 백 배 틀린다)');

  /* ═══ 2. 손으로 푼 답과 맞는가 ═══ */
  console.log('\n[2] 계산이 맞는가 — 답을 아는 문제로 검산한다');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    window.__toasts = []; window.toast = m => window.__toasts.push(m);
    if (!window.OS.profile) window.OS.profile = { id: 'u1', name: '윤시현', role: 'admin', plan: 'pro' };
  });

  const M = await page.evaluate(() => ({
    /* 엑셀 FV(5%/12, 240, -100) = 41,103 */
    fv: finFV(100, 20, 5),
    fv0: finFV(50, 10, 0),                       /* 이자 0 이면 그냥 원금 6,000 */
    /* 엑셀 PMT(4%/12, 240, -41103) = 249.05 */
    pmt: finPMT(41103, 20, 4),
    need: finNeed(50000, 20, 5),                 /* 5억 만들려면 월 얼마 */
    real: finReal(5, 2.3),                       /* 피셔식 (1.05/1.023-1) = 2.639% */
    today: finToday(10000, 10, 3),               /* 10년 뒤 1억의 오늘 값 = 7,441 */
    /* 상속세 20억·부채2억·금융5억·배우자·자녀2 → 손계산 7,344만원 */
    inh: finInherit({ estate: 200000, debt: 20000, fin: 50000, spouse: 1, children: 2 }),
    /* 성년 자녀에게 3억 → 과표 2.5억 → 4,000만 → 3% 공제 → 3,880만 */
    gift: finGiftTax(30000, 'adult', false, false),
    /* 공제 안이면 세금 0 */
    gift0: finGiftTax(5000, 'adult', false, false).tax,
    /* 세대생략 30% 할증 */
    skip: finGiftTax(30000, 'adult', false, true).calc,
    /* 과세표준 구간 경계 — 1억 이하 10% */
    band1: finTaxOf(10000), band2: finTaxOf(50000)
  }));

  near(M.fv, 41103, 2, '월 100만원 20년 5% 적립 = 41,103만원');
  near(M.fv0, 6000, 0, '이율 0% 면 낸 만큼만 남는다');
  near(M.pmt, 249, 1, '4억1천을 20년 4% 로 나눠 받으면 월 249만원');
  near(M.need, 122, 1, '20년 뒤 5억을 만들려면 월 122만원');
  near(M.real, 2.639, 0.01, '수익 5%·물가 2.3% 의 실질수익률은 2.639%');
  near(M.today, 7441, 2, '10년 뒤 1억은 오늘 돈 7,441만원 (물가 3%)');
  near(M.band1, 1000, 0, '과세표준 1억이면 10% 인 1,000만원');
  near(M.band2, 9000, 0, '과세표준 5억이면 20% − 누진공제 1,000 = 9,000만원');

  near(M.inh.net, 180000, 0, '순재산 = 재산 20억 − 빚 2억');
  near(M.inh.lumpDed, 50000, 0, '일괄공제 5억 (기초 2억 + 자녀 1억 보다 크므로)');
  near(M.inh.spouseDed, 77143, 2, '배우자공제 = 18억 × 1.5/3.5');
  near(M.inh.finDed, 10000, 0, '금융재산공제 = 5억의 20%');
  near(M.inh.base, 42857, 2, '과세표준 = 18억 − 13.71억');
  near(M.inh.tax, 7344, 2, '낼 상속세 7,344만원');

  near(M.gift.base, 25000, 0, '증여 과세표준 = 3억 − 공제 5,000만');
  near(M.gift.calc, 4000, 0, '산출세액 4,000만원');
  near(M.gift.tax, 3880, 0, '신고세액공제 3% 빼면 3,880만원');
  is(M.gift0 === 0, '공제 안(5,000만)이면 증여세가 없다');
  near(M.skip, 5200, 0, '세대생략이면 30% 붙어 5,200만원');

  /* ═══ 3. 세 화면이 뜨는가 ═══ */
  console.log('\n[3] 세 화면이 뜨고, 부족액을 이어받는가');
  for (const [tab, id, word] of [['fin_usd', 'fuOut', '환율'], ['fin_gift', 'fgOut', '상속세'], ['fin_ins', 'fiOut', '보험']]) {
    const R = await page.evaluate(async ([t, boxId]) => {
      go(t);
      await new Promise(r => setTimeout(r, 700));
      const box = document.getElementById(boxId);
      const host = document.getElementById('dyn') || document.body;
      return { drawn: !!box && box.innerText.length > 120, text: (host.innerText || '').slice(0, 900) };
    }, [tab, id]);
    is(R.drawn, tab + ' 화면이 열자마자 결과까지 그린다');
    is(R.text.indexOf(word) >= 0, tab + ' 에 「' + word + '」 가 나온다');
  }

  /* 계산기가 말한 부족액이 달러 플랜 입력칸에 그대로 들어가는가 */
  const G = await page.evaluate(async () => {
    finGapSet(180, 25, '재무설계 계산기');
    go('fin_usd');
    await new Promise(r => setTimeout(r, 700));
    const el = document.getElementById('fu_pay');
    const host = document.getElementById('dyn') || document.body;
    return { pay: el ? +el.value : 0, bar: (host.innerText || '').indexOf('이어서 상담 중') >= 0 };
  });
  is(G.pay === 180, '부족액 월 180만원이 달러 플랜에 그대로 들어간다 (' + G.pay + ')');
  is(G.bar, '어디서 넘어왔는지 화면 위에 밝힌다');

  /* 법 근거와 면책이 붙어 있는가 — 보험 자료에는 반드시 필요하다 */
  const LAW = await page.evaluate(async () => {
    go('fin_gift');
    await new Promise(r => setTimeout(r, 700));
    return (document.getElementById('dyn') || document.body).innerText;
  });
  is(/상증세법|상속세 및 증여세법/.test(LAW), '근거 법 조문을 밝힌다');
  is(/세무 전문가|개산/.test(LAW), '개산치임을 밝힌다');
  is(/10년|5년/.test(LAW), '증여 합산 기간을 알린다');

  /* ═══ 4. base64 안 계산기 — 여태 아무도 안 봤다 ═══ */
  console.log('\n[4] base64 안에 든 계산기도 들여다본다');
  const b64 = (app.match(/<script type="text\/plain" id="finB64">([\s\S]*?)<\/script>/) || [])[1] || '';
  is(b64.length > 100000, 'finB64 가 있다 (' + Math.round(b64.length / 1024) + 'KB)');
  let dec = '';
  try { dec = Buffer.from(b64.trim(), 'base64').toString('utf8'); } catch (e) {}
  is(dec.length > 100000, '풀어 읽을 수 있다 (' + Math.round(dec.length / 1024) + 'KB)');
  is(/<\/html>/.test(dec), '끝까지 온전하다 — 잘리면 계산기가 빈 화면이 된다');
  const tabs = (dec.match(/id="tab-([a-z]+)"/g) || []).length;
  is(tabs >= 10, '탭이 ' + tabs + '개 들어 있다');
  is(/function apxPen\(/.test(dec), '연금 엔진(apxPen)이 그대로 있다');

  /* 다리는 우리 틀에서 온 것만 받는가 */
  is(/e\.source!==fr\.contentWindow/.test(app.replace(/\s/g, '')),
    '계산기가 보낸 쪽지는 <b>우리가 띄운 그 틀</b>에서 온 것만 받는다');

  const hard = errs.filter(m => !/ResizeObserver|Failed to fetch|NetworkError/i.test(m));
  is(hard.length === 0, '중간에 터진 곳이 없다' + (hard.length ? ' — ' + hard[0].slice(0, 120) : ''));

  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? '재무 플랜 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : '재무 플랜 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  await browser.close(); srv.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
