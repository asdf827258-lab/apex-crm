/* ══════════════════════════════════════════════════════════════════
   check-hmsay.js — <b>부재 · 거절 · 기고객에 맞는 말이 그 자리에 있는가.</b>

   사장님 말씀 — 「TA 스크립트 보고 상황에 맞게 짜던지, <b>부재 거절 기고객</b>
   에 맞게 너가 스크립트를 참조해서 만들어」.

   여태는 <b>TA 한 자리</b>에만 첫 마디가 떴습니다. 정작 말이 제일 어려운
   자리 — 안 받으신 분, 거절하신 분, 오래 못 뵌 분 — 은 비어 있었습니다.

   ── 여기서 보는 것 ────────────────────────────────────────────────
     [1] 세 자리에 <b>말이 선다</b> — 부재 · 거절 · 기고객
     [2] <b>말할 것만</b> 적지 않는다 — 다음 한마디 · <b>금지 표현</b> ·
         <b>종료 기준</b>이 같이 선다. ta-script 의 거절처리와 같은 틀이다.
         무엇을 말하면 안 되는지와 언제 그만두는지를 안 적으면, 붙잡다
         그 고객을 영영 잃는다
     [8] <b>입원·회복</b> — 앱이 알 수 없는 상황은 <b>손으로 고르게</b> 한다.
         「이 분이 지금 입원해 계시다」 는 사장님만 아십니다. 그래서 단계로만
         고르면 그 말은 <b>영영 안 뜹니다</b> — 표에만 넣어 두면 죽은 글입니다.
         그리고 이 자리는 <b>파는 전화가 아닙니다</b> — 첫마디에 보장·청구가
         섞이면 안 되고, <b>지급을 약속해서도</b> 안 됩니다 (2번).
     [3] <b>없는 자리는 안 세운다</b> (1번) — AP·PC 처럼 화법이 없는 단계는
         칸이 아예 안 선다. 빈 칸을 세우고 지어 채우지 않는다
     [4] 말은 <b>apex-stage.js 한 곳</b>에서 온다 (5번) — 본체에 또 적으면
         DB 통합 CRM 과 다른 말을 하게 된다
     [5] <b>숫자·이름이 안 들어간다</b> — 보험료·한도·나이(2번), 고객 실명(3번)
     [6] 복사하면 <b>다음 한마디까지</b> 담긴다 — 첫 마디만 들고 가면 그다음에
         막힌다. 금지·종료는 내가 보는 것이라 안 담는다
     [7] TA 는 <b>DB 종류</b>로 갈린다 — 그 자리에만 종류 딱지가 붙는다
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8903;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((rq, rs) => {
  let f = path.join(ROOT, decodeURIComponent(url.parse(rq.url).pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end(); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본은 홍길동 집안입니다 (3번) */
const SEED = (stage, src) => `
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'member',active:true,plan:'vip'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.toast=function(m){window.__T=m;};
 window.osClient=function(){return null;};window.osLoadClients=function(){};
 GB.loaded=true;AR.rep={};AR.loaded=true;AR.busy='';AR.err='';
 /* 기고객은 배정 DB 가 아니라 <b>고객 목록</b>에서 올라옵니다 — 심는 자리가 다릅니다 */
 AR.db=(('${stage}'==='기고객')?[]:[{id:'d1',who:'me',name:'홍길동A',region:'순천',
   src:'${src}',stage:'${stage}',days:20,n:1,res:'부재',cAt:'',pAt:''}]);
 AR.cliRows=(('${stage}'==='기고객')?[{id:'c9',name:'홍길동B',who:'me',days:90,plan:'',bd:''}]:[]);
 AR.calls=[];CM.loaded=true;CM.who={me:'홍길동'};
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 window.cmLoadAll=function(cb){if(cb)cb();};
 try{localStorage.removeItem('apex_hm_done');}catch(e){}
 HWHO.id='';CM.pick='';CM.picked=true;go('home');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const browser = await chromium.launch();
  const look = async (stage, src) => {
    const ctx = await browser.newContext({ viewport: { width: 430, height: 930 } });
    /* CI 에는 바깥으로 나가는 길이 있습니다 — 막아 둡니다 */
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2400);
    await page.evaluate(() => document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()));
    await page.evaluate(SEED(stage, src));
    await page.waitForTimeout(900);
    const got = await page.evaluate(() => {
      const e = document.querySelector('.hm-ta');
      if (!e) return null;
      const g = c => { const x = e.querySelector('.hm-ta-p.' + c); return x ? x.innerText.replace(/\s+/g, ' ').trim() : ''; };
      return {
        h: ((e.querySelector('.hm-ta-h') || {}).innerText || '').replace(/\s+/g, ' ').trim(),
        say: ((e.querySelector('.hm-ta-t') || {}).innerText || ''),
        nx: g('nx'), no: g('no'), st: g('st'),
        tip: ((e.querySelector('.hm-ta-n') || {}).innerText || ''),
        srcTag: !!e.querySelector('.hm-ta-h span'),
        /* 굵은 글씨가 줄을 끊지 않나 — 이름표만 블록이어야 한다 */
        inlineB: [...e.querySelectorAll('.hm-ta-p b')].filter(b => getComputedStyle(b).display !== 'inline').length,
        all: e.innerText
      };
    });
    const copied = got ? await page.evaluate(() => {
      let t = ''; window.copyText = function (v) { t = v; };
      const L = hmSteps(); if (!L.length) return '';
      hmTaCopy(L[0].key); return t;
    }) : '';
    await ctx.close();
    return { got, copied, errs };
  };

  const A = {};
  for (const [st, sr] of [['부재', '보장분석3DB'], ['거절', '일반'], ['기고객', ''], ['TA', '소개'], ['AP', '일반'], ['PC', '일반']])
    A[st] = await look(st, sr);

  console.log('\n[1] 세 자리에 <b>말이 선다</b>');
  ['부재', '거절', '기고객'].forEach(k => {
    is(!!A[k].got && A[k].got.say.length > 40,
       '  ' + k + ' — 「' + ((A[k].got && A[k].got.h) || '칸이 안 섰다') + '」 ' +
       ((A[k].got && A[k].got.say.length) || 0) + '자');
  });
  /* 세 자리가 <b>서로 다른 말</b>을 하나 — 같은 글을 세 번 세우면 안 한 것과 같다 */
  const says = ['부재', '거절', '기고객'].map(k => (A[k].got || {}).say || '');
  is(new Set(says).size === 3, '  셋이 <b>서로 다른 말</b>을 한다');

  console.log('\n[2] <b>말할 것만</b> 적지 않는다 — 다음 한마디 · 금지 · 종료');
  ['부재', '거절', '기고객'].forEach(k => {
    const g = A[k].got || {};
    is(!!g.nx && !!g.no && !!g.st,
       '  ' + k + ' — 다음 ' + (g.nx ? '○' : '✗') + ' · 금지 ' + (g.no ? '○' : '✗') + ' · 종료 ' + (g.st ? '○' : '✗'));
  });
  is(/안 합니다/.test((A['거절'].got || {}).no || ''), '  금지 표현은 <b>「안 합니다」</b> 라고 못 박는다');
  is(/그만둡니다/.test((A['거절'].got || {}).st || ''), '  종료 기준은 <b>「그만둡니다」</b> 라고 못 박는다');
  is((A['거절'].got || {}).inlineB === 0,
     '  본문의 굵은 글씨가 <b>줄을 안 끊는다</b> — 급할 때 「하지 마세요」 를 「하세요」 로 읽으면 안 된다');

  console.log('\n[3] <b>없는 자리는 안 세운다</b> (1번)');
  is(!A['AP'].got, '  AP — 화법이 없으면 칸이 <b>아예 안 선다</b>' + (A['AP'].got ? ' ← 섰다' : ''));
  is(!A['PC'].got, '  PC — 마찬가지');

  console.log('\n[4] 말은 <b>apex-stage.js 한 곳</b>에서 온다 (5번)');
  const ix = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const blk = (ix.split('function hmTaHtml(x){')[1] || '').split('function hmTaCss(')[0];
  is(/APEX_STAGE\.script/.test(blk), '  본체는 <b>APEX_STAGE.script</b> 에 묻는다');
  is(!/고객님, 안녕하세요/.test(blk), '  본체에 <b>말을 또 안 적었다</b>');
  const st = fs.readFileSync(path.join(ROOT, 'apex-stage.js'), 'utf8');
  is(/var SAY=/.test(st) && /'부재'/.test(st) && /'거절'/.test(st) && /'기고객'/.test(st),
     '  세 자리의 말이 <b>공용 파일</b>에 있다 — DB 통합 CRM 도 같은 파일을 싣는다');

  console.log('\n[5] <b>숫자·이름이 안 들어간다</b> (2번 · 3번)');
  const body = ['부재', '거절', '기고객'].map(k => (A[k].got || {}).all || '').join('\n');
  const nums = (body.match(/[0-9][0-9,]*\s*(만원|원|세|개월|%|년)/g) || []);
  is(nums.length === 0, '  보험료·한도·나이·개월 수를 <b>안 적는다</b>' + (nums.length ? (' ← ' + nums.join(',')) : ''));
  is(!/홍길동|홍○/.test(body), '  고객 <b>이름이 안 들어간다</b> — 「고객님」 으로 나간다');

  console.log('\n[6] 복사하면 <b>다음 한마디까지</b> 담긴다');
  const cp = A['거절'].copied || '';
  is(cp.indexOf('더 붙잡지 않겠습니다') >= 0, '  말할 멘트가 담긴다');
  is(/다음 한마디/.test(cp), '  <b>다음 한마디</b>도 같이 담긴다');
  is(!/안 합니다|그만둡니다/.test(cp), '  금지·종료는 <b>안 담는다</b> — 그것은 내가 보는 것이다');
  is(!/<b>|<\/b>/.test(cp), '  복사한 글에 <b>태그가 안 섞인다</b>');

  console.log('\n[7] TA 는 <b>DB 종류</b>로 갈린다');
  is(!!A['TA'].got && /소개/.test(A['TA'].got.h), '  소개로 오신 분 — 「' + ((A['TA'].got || {}).h || '') + '」');
  is(!!A['TA'].got && A['TA'].got.srcTag === true, '  첫 마디에는 <b>종류 딱지</b>가 붙는다');
  is(!!A['거절'].got && A['거절'].got.srcTag === false,
     '  두 번째 전화에는 <b>안 붙는다</b> — 출처를 또 되뇌면 그것이 압박이 된다');

  console.log('\n[8] <b>입원·회복</b> — 손으로 골라야 닿는 자리');
  /* 화법이 <b>없는</b> 단계(AP)에서 연다 — 고르는 줄이 거기서도 서야
     「이 분이 지금 입원해 계시다」 를 말할 수 있다 */
  const ctx8 = await browser.newContext({ viewport: { width: 430, height: 930 } });
  await ctx8.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx8.newPage();
  const e8 = []; pg.on('pageerror', e => e8.push(String(e).slice(0, 140)));
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(2400);
  await pg.evaluate(() => document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()));
  await pg.evaluate(SEED('AP', '일반'));
  await pg.waitForTimeout(900);

  const chips = await pg.evaluate(() => [...document.querySelectorAll('.hm-tap-c')].map(x => x.textContent.trim()));
  const apCard = await pg.evaluate(() => !!document.querySelector('.hm-ta'));
  is(chips.length >= 4, '  고르는 줄에 상황이 ' + chips.length + '가지 — ' + chips.join(' · '));
  is(chips.some(c => /입원/.test(c)), '  <b>입원·회복</b>이 그중에 있다');
  is(!apCard, '  AP 에서는 말 칸이 <b>여전히 안 선다</b> — 고르는 줄만 있다 (1번)');
  /* 목록을 본체가 또 적지 않았나 (5번) */
  const ixp = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const pblk = (ixp.split('function hmTaPickHtml(x){')[1] || '').split('function hmTaHtml(')[0];
  /* 괄호까지 본다 — 위 방어줄의 「!APEX_STAGE.sayList」 만으로 통과하면
     목록을 손으로 적어 놓고도 초록이 된다 (8번) */
  is(/APEX_STAGE\.sayList\(\)/.test(pblk), '  상황 목록은 <b>apex-stage 에서</b> 받아 온다');
  is(!/입원|부재|거절/.test(pblk), '  본체에 상황 이름을 <b>또 안 적었다</b>');

  await pg.evaluate(() => { const c = [...document.querySelectorAll('.hm-tap-c')].find(x => /입원/.test(x.textContent)); if (c) c.click(); });
  await pg.waitForTimeout(600);
  const H = await pg.evaluate(() => {
    const e = document.querySelector('.hm-ta');
    if (!e) return null;
    const g = c => { const x = e.querySelector('.hm-ta-p.' + c); return x ? x.innerText.replace(/\s+/g, ' ').trim() : ''; };
    return { h: ((e.querySelector('.hm-ta-h') || {}).innerText || '').replace(/\s+/g, ' ').trim(),
      say: ((e.querySelector('.hm-ta-t') || {}).innerText || ''),
      nx: g('nx'), no: g('no'), st: g('st'),
      tip: ((e.querySelector('.hm-ta-n') || {}).innerText || ''), all: e.innerText,
      own: !!document.querySelector('.hm-tap.own'), back: !!document.querySelector('.hm-tap-b') };
  });
  is(!!H && H.say.length > 30, '  누르면 그 자리에서 <b>말이 선다</b> — 「' + ((H && H.h) || '안 섰다') + '」');
  is(!!H && H.own && H.back, '  <b>내가 고른 것</b>이라고 적히고 되돌아올 길이 있다');
  is(!!H && !!H.nx && !!H.no && !!H.st,
     '  다음 한마디 · 금지 · 종료가 같이 선다 — 다음 ' + (H && H.nx ? '○' : '✗') +
     ' · 금지 ' + (H && H.no ? '○' : '✗') + ' · 종료 ' + (H && H.st ? '○' : '✗'));
  /* ★ 이 자리에서 제일 중요한 것 — <b>첫마디에 보험이 섞이면 안 된다</b> */
  is(!!H && !/보험|보장|청구|보험금|가입/.test(H.say),
     '  첫마디에 <b>보험 이야기가 한 줄도 안 섞인다</b> — 파는 전화가 아니다');
  is(!!H && /먼저 보내|먼저 꺼내|캐묻|안 합니다|꺼내는 것/.test(H.no),
     '  <b>먼저 꺼내지 않는다</b>가 금지에 적혀 있다');
  /* ★ 지급을 약속하지 않는다 (2번) */
  is(!!H && /심사/.test(H.no),
     '  <b>지급은 심사 결과에 따른다</b>고 못 박는다 — 확답은 내가 하는 것이 아니다');
  const n8 = ((H && H.all) || '').match(/[0-9][0-9,]*\s*(만원|원|세|개월|%|년)/g) || [];
  is(n8.length === 0, '  여기도 <b>숫자를 안 적는다</b>' + (n8.length ? (' ← ' + n8.join(',')) : ''));
  is(!!H && !/홍길동|홍○/.test(H.all), '  고객 <b>이름이 안 들어간다</b>');
  /* 복사도 <b>보고 있는 말</b>로 간다 — 단계 말이 복사되면 엉뚱한 글이 나간다 */
  const cp8 = await pg.evaluate(() => { let t = ''; window.copyText = function (v) { t = v; };
    const L = hmSteps(); if (!L.length) return ''; hmTaCopy(L[0].key); return t; });
  is(/소식 듣고/.test(cp8), '  복사도 <b>보고 있는 말</b>로 간다');
  /* ★ 고른 상황이 <b>다음 분에게 따라가면</b> 안 된다 */
  await pg.evaluate(() => { AR.db = [{ id: 'd2', who: 'me', name: '홍길동C', region: '천안',
    src: '소개', stage: 'TA', days: 3, n: 1, res: '', cAt: '', pAt: '' }]; hmPaint(); });
  await pg.waitForTimeout(800);
  const nx8 = await pg.evaluate(() => ({
    h: ((document.querySelector('.hm-ta-h') || {}).innerText || '').replace(/\s+/g, ' ').trim(),
    own: !!document.querySelector('.hm-tap.own') }));
  is(!/입원/.test(nx8.h) && !nx8.own,
     '  <b>다음 분에게는 안 따라간다</b> — 「' + (nx8.h || '(칸 없음)') + '」');
  is(e8.length === 0, '  고르는 동안 안 터졌다' + (e8.length ? ' — ' + e8[0] : ''));
  await ctx8.close();

  const errs = [].concat.apply([], Object.keys(A).map(k => A[k].errs));
  is(errs.length === 0, '  화면이 터지지 않았다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n' + (bad ? '✗ 상황별 화법 — 고칠 자리 ' + bad + '곳'
    : '✓ 상황별 화법 — 부재·거절·기고객·입원에 할 말과 안 할 말, 그만둘 자리가 섭니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
