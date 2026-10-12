/* ══════════════════════════════════════════════════════════════════
   check-hmtrend.js — 🔥 <b>홈 「오늘」 의 TA 칸에 요즘 화제가 바로 서나</b>
   (2026-10-12 사장님 말씀 「오늘에서 ta 상태에서 이걸 바로 띄울 수 있게」)

   ── 못 박는 것 ────────────────────────────────────────────────────
     [1] TA 단계인 분의 첫 마디 밑에 <b>고른 화제</b>가 선다
     [2] 「어느 화제를 골랐나」 는 <b>ta-trend.js 한 곳</b>이 쥔다 (5번) —
         ☎️ TA 스크립트에서 고르면 홈도 그 화제, 「화제 없이」 면 홈도 없음
     [3] <b>첫 마디일 때만</b> — 부재·거절 자리에 독감 이야기가 끼면 안 된다
     [4] 화재보험 문의 DB 에는 안 선다 (TA 스크립트와 같은 판단 · 한 곳)
     [5] 복사하면 첫 마디 → 화제 → 다음 한마디 차례로 담긴다
     [6] 「☎️ 전체 대본 · 거절처리」 단추가 TA 스크립트 화면을 연다
     [7] 낡으면 낡았다고 말한다
     [8] 화제 파일을 못 실으면 <b>아무것도 안 세운다</b> — 지어 채우지 않는다 (1번)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8917;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((rq, rs) => {
  let f = path.join(ROOT, decodeURIComponent(url.parse(rq.url).pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end(); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본은 홍길동 (3번) — check-hmsay 와 같은 씨 */
const SEED = (stage, src) => `
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'member',active:true,plan:'vip'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.toast=function(m){window.__T=m;};
 window.osClient=function(){return null;};window.osLoadClients=function(){};
 GB.loaded=true;AR.rep={};AR.loaded=true;AR.busy='';AR.err='';
 AR.db=[{id:'d1',who:'me',name:'홍길동A',region:'순천',src:'${src}',stage:'${stage}',days:20,n:1,res:'',cAt:'',pAt:''}];
 AR.cliRows=[];AR.calls=[];CM.loaded=true;CM.who={me:'홍길동'};
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 window.cmLoadAll=function(cb){if(cb)cb();};
 try{localStorage.removeItem('apex_hm_done');}catch(e){}
 HWHO.id='';CM.pick='';CM.picked=true;
 try{ hmFoldSet('more',true); }catch(e){}
 try{ HM_MORE=true; }catch(e){}
 go('home');`;

const READ = () => {
  const e = document.querySelector('.hm-ta');
  if (!e) return { card: false };
  const t = e.querySelector('.hm-ta-p.tr');
  return { card: true, tr: t ? t.innerText.replace(/\s+/g, ' ').trim() : '',
           go: !!e.querySelector('.hm-ta-go') };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const browser = await chromium.launch();
  const B = 'http://127.0.0.1:' + PORT;
  const open = async (ctx, stage, src, pre) => {
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await page.goto(B + '/app/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2400);
    await page.evaluate(() => document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()));
    if (pre) await page.evaluate(pre);
    await page.evaluate(SEED(stage, src));
    await page.waitForTimeout(900);
    return { page, errs };
  };
  const mkctx = async () => {
    const c = await browser.newContext({ viewport: { width: 430, height: 930 } });
    await c.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    return c;
  };

  global.window = global; require(path.join(ROOT, 'ta-trend.js'));
  const T = global.TA_TREND;

  console.log('\n[0] 한 곳 (5번)');
  const IX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const TA = fs.readFileSync(path.join(ROOT, 'ta-script.html'), 'utf8');
  is(/<script src="\.\.\/ta-trend\.js"><\/script>/.test(IX), '본체가 ta-trend.js 를 싣는다');
  const blk = (IX.split('function hmTaTrend(S,x){')[1] || '').split('function hmTaCopy(')[0];
  is(/TA_TREND\.pick\(\)/.test(blk) && /TA_TREND\.off\(/.test(blk), '홈은 고른 화제·뺄 DB 를 TA_TREND 에 묻는다');
  is(IX.indexOf('apex_ta_trend') < 0 && TA.indexOf('apex_ta_trend') < 0,
     '고른 화제를 담는 열쇠를 화면이 따로 쥐지 않는다 — ta-trend.js 만 안다');
  is(!/dbKey\s*===\s*'ns'\s*\?\s*null\s*:\s*trendNow/.test(TA), 'TA 스크립트도 「화재보험이면 뺀다」 를 TA_TREND.off 에 묻는다');

  const ctx = await mkctx();
  console.log('\n[1] TA 단계 — 고른 화제가 선다');
  let { page, errs } = await open(ctx, 'TA', '소개');
  let r = await page.evaluate(READ);
  const first = T.list[0];
  is(r.card && r.tr.indexOf(first.open) >= 0, '아무것도 안 골랐으면 첫 화제 — 「' + first.t + '」');
  is(/인사 다음 한마디/.test(r.tr), '「인사 다음 한마디」 라고 자리를 말한다');

  console.log('\n[2] TA 스크립트에서 고르면 홈도 따라온다');
  const tp = await ctx.newPage();
  await tp.goto(B + '/ta-script.html', { waitUntil: 'load' }); await tp.waitForTimeout(400);
  await tp.evaluate(k => document.querySelector('.trend-tab[data-key="' + k + '"]').click(), T.list[2].key);
  await page.evaluate(() => hmPaint()); await page.waitForTimeout(300);
  r = await page.evaluate(READ);
  is(r.tr.indexOf(T.list[2].open) >= 0, 'TA 스크립트에서 「' + T.list[2].t + '」 를 고르면 홈도 그것');
  await tp.evaluate(() => document.querySelector('.trend-tab[data-key="none"]').click());
  await page.evaluate(() => hmPaint()); await page.waitForTimeout(300);
  r = await page.evaluate(READ);
  is(r.card && !r.tr, '「화제 없이」 를 고르면 홈에도 안 선다 (첫 마디 칸은 그대로)');
  await tp.evaluate(k => document.querySelector('.trend-tab[data-key="' + k + '"]').click(), T.list[0].key);
  await tp.close();
  await page.evaluate(() => hmPaint()); await page.waitForTimeout(300);

  console.log('\n[5] 복사 차례');
  const cp = await page.evaluate(() => { let t = ''; window.copyText = v => { t = v; }; hmTaCopy(hmSteps()[0].key); return t; });
  const iO = cp.indexOf(first.open), iN = cp.indexOf('다음 한마디');
  is(iO > 0 && (iN < 0 || iO < iN), '첫 마디 뒤에 화제가 담긴다' + (iN >= 0 ? ' · 다음 한마디보다 앞' : ''));

  console.log('\n[6] 전체 대본 단추');
  is(r.go || (await page.evaluate(READ)).go, '「☎️ 전체 대본 · 거절처리」 단추가 있다');
  await page.evaluate(() => document.querySelector('.hm-ta-go').click()); await page.waitForTimeout(700);
  const went = await page.evaluate(() => !!document.querySelector('#dynPane iframe[src*="ta-script.html"]'));
  is(went, '누르면 TA 스크립트 화면이 열린다');
  is(errs.length === 0, '스크립트 오류 0' + (errs.length ? ' ← ' + errs.slice(0, 2).join(' | ') : ''));
  await page.close();

  console.log('\n[7] 낡으면');
  ({ page, errs } = await open(ctx, 'TA', '소개', () => { TA_TREND.asOf = '2000-01-01'; }));
  r = await page.evaluate(READ);
  is(/지났습니다/.test(r.tr), '기준일에서 ' + T.stale + '일이 넘으면 「지났습니다」 라고 말한다');
  await page.close();

  console.log('\n[3] 첫 마디일 때만');
  for (const st of ['거절', '부재']) {
    ({ page, errs } = await open(ctx, st, '일반'));
    r = await page.evaluate(READ);
    is(r.card && !r.tr, st + ' 자리에는 화제가 안 낀다');
    await page.close();
  }

  console.log('\n[4] 화재보험 문의 DB');
  ({ page, errs } = await open(ctx, 'TA', 'NS홈쇼핑 화재보험'));
  r = await page.evaluate(READ);
  is(r.card && !r.tr, 'NS홈쇼핑 화재보험 DB 에는 안 선다');
  await page.close();
  ({ page, errs } = await open(ctx, '미접촉', '보장분석3DB'));
  r = await page.evaluate(READ);
  is(r.card && r.tr.indexOf(first.open) >= 0, '아직 못 건 분(미접촉)의 첫 마디에도 선다');
  await page.close();
  await ctx.close();

  console.log('\n[8] 화제 파일을 못 실으면');
  const c2 = await mkctx();
  await c2.route('**/ta-trend.js', rr => rr.fulfill({ status: 404, body: '' }));
  ({ page, errs } = await open(c2, 'TA', '소개'));
  r = await page.evaluate(READ);
  is(r.card && !r.tr, '첫 마디 칸은 그대로, 화제 칸은 안 선다');
  /* 홈은 칸마다 try 로 감싸 그립니다 — 터져도 화면에는 안 보이고 pageerror 도 안 뜹니다.
     그래서 <b>직접 불러</b> 터지는지 봅니다 (안 울리는 알람은 알람이 아니다 · 8번) */
  const thrown = await page.evaluate(() => { try { hmTaHtml(hmSteps()[0]); hmTaCopy(hmSteps()[0].key); return ''; } catch (e) { return String(e.message || e); } });
  is(errs.length === 0 && !thrown, '그때도 오류가 안 난다' + (errs.length ? ' ← ' + errs[0] : '') + (thrown ? ' ← ' + thrown : ''));
  await c2.close();

  await browser.close(); srv.close();
  console.log(bad ? '\n✗ 홈 TA 화제 — 고칠 자리 ' + bad + '곳' : '\n✓ 홈 TA 화제 — 모두 통과');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
