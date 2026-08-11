/* AI 제안서 — 글자만 있던 자리에 그림이 들어갔는가, 숫자는 맞는가.

   무엇을 바꿨나.
     8통장은 통장 이름 여덟 개만 적혀 있었다. 그래서 「어디가 급한지」 가
     한눈에 안 왔다. 8통장 진단지도가 쓰는 그래프 도구를 그대로 가져와
     도넛 · 막대 · 생애 지도 · 우선순위로 다시 그렸다.
     준비 안 하면 / 준비하면 도 글만 있어서, 금액을 막대로 세웠다.
     연금은 3층으로 갈라 쌓고, 종신은 <b>법정 세율로 상속세를 계산</b>해
     사망보험금과 나란히 놓았다.

   그림보다 중요한 것은 <b>숫자가 맞는가</b> 다.
   상속세를 잘못 계산해 고객에게 보여주면 그건 사고다.
   그래서 세금 계산은 손으로 아는 답과 하나하나 맞춰 본다.

   확인하는 것.
     1. 금액 읽기 — 「1억 2,000만원」 을 제대로 만원으로 읽는가
     2. 상속세 — 법정 누진세율·공제로 손계산과 맞는가
     3. 복리 — 이율에 따른 결과가 산수와 맞는가
     4. 8통장 — 도넛·막대·생애지도·우선순위가 실제로 그려지는가
     5. 준비안하면/준비하면 — 금액 막대가 그려지는가
     6. 연금·종신 — 3층 쌓기와 상속세 비교가 그려지는가
     7. 상담자료 — 제안서 안에서 열리고, 두 번 안 불러오는가           */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8855;
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

/* 실제 AI 가 내놓을 법한 문서 — 8통장 8칸, 현실 4가지, 연금 3층, 종신 */
const PLAN = {
  title: '내 보험 한눈에 보기', clientLine: '홍길동님 (45세 · 남)의 보험 현황',
  coreBenefit: '어디가 비었는지 사실대로 봅니다.', readDocs: '유효 계약 6건을 읽었습니다.',
  slides: [{ kicker: '표지', title: '표지', lead: '', rows: [] }],
  wallets: [
    { no: '①', name: '생활 통장', purpose: '매달 쓰는 돈', now: '비상자금 2개월', need: '6개월', status: '비어있음', note: '월 470만원이 나가는데 받쳐 줄 돈이 두 달치뿐입니다. 여기부터 봅니다.' },
    { no: '②', name: '병원비 통장(실손)', purpose: '병원비', now: '4세대 실손', need: '유지', status: '충분', note: '실손이 살아 있습니다.' },
    { no: '③', name: '치료비 통장(정액)', purpose: '쉬는 동안 생활비', now: '암 8,000만', need: '1억', status: '부족', note: '유사암이 모자랍니다.' },
    { no: '④', name: '소득공백 통장', purpose: '일 못 할 때', now: '없음', need: '월 300만', status: '비어있음', note: '' },
    { no: '⑤', name: '가족보호 통장', purpose: '남는 가족', now: '종신 1억', need: '3억', status: '부족', note: '' },
    { no: '⑥', name: '은퇴·연금 통장', purpose: '노후', now: '확인 필요', need: '상담에서', status: '확인 필요', note: '' },
    { no: '⑦', name: '간병·장기요양 통장', purpose: '오래 아플 때', now: '없음', need: '월 150만', status: '비어있음', note: '' },
    { no: '⑧', name: '자산이전 통장', purpose: '다음 세대', now: '확인 필요', need: '', status: '확인 필요', note: '' }
  ],
  reality: [
    { headline: '큰 병(암)', story: '진단부터 회복까지 2년.', cost: '3,200만원' },
    { headline: '사고·뇌심', story: '시술로 끝나면 수술비가 안 나옵니다.', cost: '1억 2,000만원' },
    { headline: '소득 단절', story: '대출과 학비는 그대로입니다.', cost: '7,200만원' },
    { headline: '오래 사는 위험', story: '간병 20년.', cost: '확인 필요' }
  ],
  benefit: {
    summary: '같은 일이 생겨도 통장 잔액이 갈립니다.',
    prepared: [{ label: '암 치료 2년', value: '2,000만원 남음', note: '' }, { label: '간병 5년', value: '3,000만원 남음', note: '' }],
    unprepared: [{ label: '암 치료 2년', value: '3,200만원 빠짐', note: '' }, { label: '간병 5년', value: '9,000만원 빠짐', note: '' }]
  },
  pension: {
    needMonthly: '320만원', haveMonthly: '국민 90만원 + 퇴직 40만원 + 개인 20만원',
    gapMonthly: '170만원', planMonthly: '45만원', startAge: '65',
    why: '시간이 곧 원금입니다.', note: '3층 구조'
  },
  wholelife: {
    purpose: '상속 유동성', amount: '3억원', gapYears: '20년', liquidity: '15억원',
    why: '부동산은 급히 못 팝니다.', note: '과하면 조정'
  },
  options: [], nextSteps: ['ㄱ'], risks: ['ㄴ'], evidence: [], _mode: 'explain'
};

let pass = 0, fail = 0;
const ok = m => { pass++; console.log('  ✓ ' + m); };
const no = m => { fail++; console.log('  ✗ ' + m); };
const is = (c, m) => c ? ok(m) : no(m);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'u1', name: '점검', role: 'owner', plan: 'vip' };
    window.toast = function () {};
  });

  const ready = await page.evaluate(() => typeof prWalletHtml === 'function' && typeof prTaxOf === 'function'
    && typeof prMoney === 'function' && typeof prFV === 'function');
  if (!ready) {
    console.log('✗ 앱이 뜨지 않았습니다.');
    errs.slice(0, 4).forEach(m => console.log('    ' + m));
    await browser.close(); srv.close(); process.exit(1);
  }

  /* ═══ 1. 금액 읽기 ═══ */
  console.log('\n[1] 사람이 쓴 금액을 제대로 읽는가 (단위: 만원)');
  const M = await page.evaluate(() => ({
    a: prMoney('3,200만원'), b: prMoney('1억 2,000만원'), c: prMoney('1억'),
    d: prMoney('5천만원'), e: prMoney('320만'), f: prMoney('확인 필요'),
    g: prMoney(''), h: prMoney('약 8억원'), i: prMoney('35,000,000원')
  }));
  is(M.a === 3200, '「3,200만원」 → 3,200만 (' + M.a + ')');
  is(M.b === 12000, '「1억 2,000만원」 → 12,000만 (' + M.b + ')');
  is(M.c === 10000, '「1억」 → 10,000만 (' + M.c + ')');
  is(M.d === 5000, '「5천만원」 → 5,000만 (' + M.d + ')');
  is(M.e === 320, '「320만」 → 320만 (' + M.e + ')');
  is(M.h === 80000, '「약 8억원」 → 80,000만 (' + M.h + ')');
  is(M.i === 3500, '「35,000,000원」 → 3,500만 (' + M.i + ')');
  is(M.f === 0 && M.g === 0, '「확인 필요」 는 0 으로 두고 그리지 않는다 — 지어내지 않는다');

  /* ═══ 2. 상속세 — 손으로 아는 답과 맞는가 ═══ */
  console.log('\n[2] 상속세가 법정 세율·공제와 맞는가');
  const T = await page.evaluate(() => ({
    /* 15억, 배우자 있음 → 공제 10억 → 과세표준 5억 → 20% − 1,000만 = 9,000만 */
    a: prTaxOf(150000, true),
    /* 15억, 배우자 없음 → 공제 5억 → 과세표준 10억 → 30% − 6,000만 = 2억 4,000만 */
    b: prTaxOf(150000, false),
    /* 8억, 배우자 있음 → 공제 10억 → 과세표준 0 → 세금 0 */
    c: prTaxOf(80000, true),
    /* 50억, 배우자 있음 → 공제 10억 → 과세표준 40억 → 50% − 4억 6,000만 = 15억 4,000만 */
    d: prTaxOf(500000, true),
    /* 10억 5천, 배우자 있음 → 공제 10억 → 과세표준 5,000만 → 10% = 500만 */
    e: prTaxOf(105000, true),
    law: PR_TAX.law
  }));
  is(T.a.ded === 100000 && T.a.base === 50000 && T.a.tax === 9000,
    '15억·배우자 있음 → 과세표준 5억 · 세금 9,000만 (' + T.a.tax + ')');
  is(T.b.ded === 50000 && T.b.base === 100000 && T.b.tax === 24000,
    '15억·배우자 없음 → 과세표준 10억 · 세금 2억 4,000만 (' + T.b.tax + ')');
  is(T.c.base === 0 && T.c.tax === 0, '8억·배우자 있음 → 공제 안에 들어와 세금 없음');
  is(T.d.base === 400000 && T.d.tax === 154000,
    '50억·배우자 있음 → 과세표준 40억 · 세금 15억 4,000만 (' + T.d.tax + ')');
  is(T.e.base === 5000 && T.e.tax === 500, '10억5천 → 과세표준 5,000만 · 세금 500만 (' + T.e.tax + ')');
  is(/상속세 및 증여세법/.test(T.law), '어느 법에 근거했는지 화면에 적는다 — ' + T.law.slice(0, 22));

  /* ═══ 3. 복리 ═══ */
  console.log('\n[3] 이율 비교가 산수와 맞는가');
  const F = await page.evaluate(() => {
    /* 월 30만 × 20년, 연 6% → 월 0.5% 복리 240회 */
    var m = 0.06 / 12, n = 240, hand = 30 * ((Math.pow(1 + m, n) - 1) / m);
    return { got: prFV(30, 20, 0.06), hand: hand, zero: prFV(30, 20, 0), paid: 30 * 240 };
  });
  is(Math.abs(F.got - F.hand) < 0.01, '연 6% · 월 30만 · 20년 = 손계산과 일치 (' + Math.round(F.got) + '만원)');
  is(F.zero === F.paid, '이율 0% 면 낸 돈 그대로다 (' + F.zero + '만원)');
  is(F.got > F.paid * 1.5, '복리가 실제로 불어난다 — 낸 돈 ' + F.paid + '만 → ' + Math.round(F.got) + '만');

  /* ═══ 4~7. 화면 ═══ */
  const V = await page.evaluate(plan => {
    var host = document.createElement('div'); host.id = 'prOut'; document.body.appendChild(host);
    PR.plan = plan; PRC.init = false;
    var out = {};
    var grab = function (v) { PR.view = v; prPaint(); return host.innerHTML; };

    var w = grab('wallet');
    out.wallet = {
      donut: (w.match(/<svg/g) || []).length,
      bars: /8개 통장별 충족도/.test(w),
      gantt: /생애 재무 리스크 지도/.test(w),
      pri: (w.match(/class="rank /g) || []).length,
      firstPri: (function () { var m = w.match(/class="rank (\w+)"/); return m ? m[1] : ''; })(),
      grade: /취약|보완 필요|양호|우수/.test(w),
      counts: /비어있음/.test(w) && /확인 필요/.test(w)
    };
    var r = grab('reality');
    out.reality = { chart: /그때 드는 돈/.test(r), svg: (r.match(/<svg/g) || []).length, cards: (r.match(/AI 생성 일러스트|사진 만들기/g) || []).length };
    var b = grab('benefit');
    out.benefit = { chart: /통장 잔액/.test(b), svg: (b.match(/<svg/g) || []).length };
    var pl = grab('plan');
    out.plan = {
      layers: /연금 3층/.test(pl), stack: /국민/.test(pl) && /퇴직/.test(pl) && /개인/.test(pl),
      rate: /이율이 결과를 가릅니다/.test(pl),
      tax: /상속세는 얼마고/.test(pl),
      taxNum: /9,?000만|9000만/.test(pl.replace(/<[^>]+>/g, '')) || /1억 5,000만/.test(pl),
      band: /30억 초과/.test(pl),
      law: /상속세 및 증여세법/.test(pl),
      verdict: /모자랍니다|낼 수 있습니다/.test(pl),
      svg: (pl.match(/<svg/g) || []).length,
      warn: /보장되지 않습니다/.test(pl) && /세무 전문가/.test(pl),
      /* 「지금 연금」 줄 끝의 합계가 150만원이어야 한다 (90+40+20) */
      have150: (function () {
        var m = pl.match(/지금 연금[\s\S]{0,3000}?<\/svg>/);
        return !!(m && /150만원/.test(m[0]));
      })(),
      haveTxt: (function () {
        var m = pl.match(/지금 연금[\s\S]{0,3000}?<\/svg>/);
        var t = m ? (m[0].match(/>(\d[\d,]*만원|\d+억[^<]*)</g) || []) : [];
        return t.join(' ') || '못 읽음';
      })()
    };
    var sd = grab('sangdam');
    out.sd = {
      order: /발표 순서/.test(sd),
      steps: (sd.match(/<li>/g) || []).length,
      frames: document.querySelectorAll('#prSdFrame').length,
      wrapShown: (function () { var x = document.getElementById('prSdWrap'); return x ? x.style.display !== 'none' : false; })()
    };
    /* 다른 칸으로 갔다가 돌아와도 자료를 두 번 불러오지 않는다 */
    grab('wallet');
    var hiddenNow = (function () { var x = document.getElementById('prSdWrap'); return x ? x.style.display === 'none' : false; })();
    grab('sangdam');
    out.sd.frames2 = document.querySelectorAll('#prSdFrame').length;
    out.sd.hidesWhenAway = hiddenNow;
    host.parentNode.removeChild(host);
    return out;
  }, PLAN);

  console.log('\n[4] 8통장이 그림으로 나오는가');
  is(V.wallet.donut >= 3, '도넛 · 막대 · 생애 지도가 다 그려진다 (그림 ' + V.wallet.donut + '개)');
  is(V.wallet.bars, '8개 통장별 충족도 막대가 있다');
  is(V.wallet.gantt, '생애 재무 리스크 지도가 있다');
  is(V.wallet.pri === 8, '우선순위가 여덟 칸 다 나온다 (' + V.wallet.pri + '칸)');
  is(V.wallet.firstPri === 'low', '가장 급한 것(비어있음)을 1번으로 올린다 — ' + V.wallet.firstPri);
  is(V.wallet.grade, '종합 등급을 매긴다');
  is(V.wallet.counts, '비어있음·확인 필요를 따로 센다 — 모르는 것을 없다고 하지 않는다');

  console.log('\n[5] 준비 안 하면 / 준비하면 이 그림으로 나오는가');
  is(V.reality.chart && V.reality.svg >= 1, '상황마다 드는 돈이 막대로 나온다');
  is(V.reality.cards >= 4, '상황 카드 네 개가 그대로 있다 (' + V.reality.cards + '개)');
  is(V.benefit.chart && V.benefit.svg >= 1, '준비했을 때와 안 했을 때가 나란히 막대로 나온다');

  console.log('\n[6] 연금 · 종신이 근거와 함께 나오는가');
  is(V.plan.layers && V.plan.stack, '연금이 국민 · 퇴직 · 개인 3층으로 쌓인다');
  is(V.plan.have150, '3층 합계를 제대로 더한다 — 국민 90 + 퇴직 40 + 개인 20 = 150만원 (' + V.plan.haveTxt + ')');
  is(V.plan.rate, '이율에 따라 결과가 갈리는 것을 보여 준다');
  is(V.plan.tax && V.plan.band, '상속세를 법정 세율표와 함께 계산한다');
  is(V.plan.law, '어느 법인지 화면에 적는다');
  is(V.plan.verdict, '사망보험금으로 낼 수 있는지 없는지 결론을 낸다');
  is(V.plan.svg >= 2, '그림이 그려진다 (' + V.plan.svg + '개)');
  is(V.plan.warn, '단정하지 않는다 — 「보장되지 않습니다」 · 「세무 전문가와 함께」 를 적는다');

  console.log('\n[7] 상담자료가 제안서 안에서 열리는가');
  is(V.sd.order && V.sd.steps >= 7, '발표 순서가 일곱 단계로 안내된다 (' + V.sd.steps + '단계)');
  is(V.sd.frames === 1 && V.sd.wrapShown, '상담자료가 제안서 안에 뜬다');
  is(V.sd.hidesWhenAway, '다른 칸으로 가면 숨는다');
  is(V.sd.frames2 === 1, '돌아와도 자료를 다시 안 불러온다 (틀 ' + V.sd.frames2 + '개) — 1.7MB 를 두 번 받지 않는다');

  /* 첫 화면이 상담자료인가 */
  const first = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is(/PR\.view='sangdam'/.test(first), '문서를 만들면 상담자료부터 편다 — 이야기의 뼈대가 먼저다');

  const hard = errs.filter(m => !/ResizeObserver|Failed to fetch|NetworkError/i.test(m));
  is(hard.length === 0, '중간에 터진 곳이 없다' + (hard.length ? ' — ' + hard[0].slice(0, 110) : ''));

  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? '제안서 시각화 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : '제안서 시각화 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  await browser.close(); srv.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
