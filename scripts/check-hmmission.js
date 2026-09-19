/* ══════════════════════════════════════════════════════════════════
   check-hmmission.js — <b>오늘의 미션을 홈에서 끝내는가.</b>

   사장님 말씀 세 가지를 잽니다 (2026-09-18) —

     · 「오늘 터치할 고객 — <b>DB 종류에 맞게 TA 를 바로</b> 띄워 달라」
     · 「거절·부재 고객에겐 <b>카카오톡 메시지</b>를 만들어 줘, 바로 그 자리에서」
     · 「증권전달은 <b>어떻게 추가 계약과 가족 소개를 받는지</b> 자세하게」

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] TA 첫 마디가 <b>DB 종류에 맞게</b> 뜬다 · 서른 가지가 다 제자리로
     [2] 못 알아본 종류도 <b>화면을 안 비운다</b> (1번)
     [3] 카톡 문구를 <b>그 자리에서</b> 짓는다 — 화면을 안 옮긴다
     [4] <b>이름을 AI 에게 안 보낸다</b> (3번)
     [5] AI 에게 <b>단정하지 말라고</b> 못 박는다 (1·2번)
     [6] 못 받으면 <b>못 받았다고</b> 적는다 — 지어내지 않는다 (1번)
     [7] 증권전달에서 <b>추가 계약·가족 소개</b>가 선다
     [8] 그 글에 <b>한도·나이·개월 수 같은 숫자가 없다</b> (2번)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8875;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본은 <b>홍길동</b> 집안입니다 (3번). 이름을 <b>드물게</b> 지어, AI 로 새는지
   글자로 찾아볼 수 있게 합니다 — 흔한 이름이면 다른 글에 우연히 걸립니다. */
/* 오늘에 맞춘 날짜 — 박아 두면 하루만 지나도 점검이 거짓말을 한다 */
const ago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const SEED = (`
  OS.session={user:{id:'me'}};
  OS.profile={id:'me',name:'홍길동',role:'owner',active:true,plan:'vip'};
  window.arLoad=function(){};
  AR.loaded=true; AR.busy=false; AR.cliRows=[];
  AR.db=[
    {id:'t1',who:'me',name:'홍길순',region:'순천시',src:'보장분석3DB',stage:'TA',
     appt:'',days:5,n:1,cAt:'',pAt:''},
    {id:'t2',who:'me',name:'홍말순',region:'여수시',src:'소개',stage:'TA',
     appt:'',days:6,n:1,cAt:'',pAt:''},
    {id:'t3',who:'me',name:'홍갑돌',region:'광양시',src:'알수없는종류',stage:'TA',
     appt:'',days:7,n:1,cAt:'',pAt:''},
    {id:'r1',who:'me',name:'홍쌍리',region:'순천시',src:'일반',stage:'거절',
     appt:'',days:20,n:2,cAt:'',pAt:''},
    /* 증권전달은 <b>증권을 전한 뒤 얼마 안 된 분</b>만 뜹니다 (TDO within).
       날짜를 오늘에 맞춰 심습니다 — 안 그러면 줄이 아예 안 서고, 그러면
       이 점검이 <b>화면 탓</b>을 하게 됩니다 (8번). */
    {id:'p1',who:'me',name:'홍병돌',region:'순천시',src:'일반',stage:'증권전달',
     appt:'',days:3,n:5,cAt:'__C__',pAt:'__P__'}];
  window.toast=function(){};
  if(typeof OSC!=='undefined'){OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=OSC.list||[];}
  window.osLoadClients=function(){};
  go('home');`).replace('__C__', ago(40)).replace('__P__', ago(3));

/* 그 단계의 줄을 <b>맨 앞으로</b> 끌어다 놓고 본다 — hmNext 는 차례대로만
   주므로, 보고 싶은 단계를 보려면 그 줄을 골라 세워야 한다. */
const showStage = (page, st) => page.evaluate((st) => {
  /* <b>먼저 다 지웁니다.</b> 앞 토막에서 「했습니다」로 지나 보낸 줄이 남아 있으면,
     보고 싶은 단계가 <b>이미 끝난 것</b>이 되어 화면에 안 섭니다 — 그러면 이 점검이
     제 실수를 화면 탓으로 적습니다. 실제로 한 번 그랬습니다 (8번). */
  try { localStorage.removeItem(HM_DONE_KEY); } catch (e) {}
  const L = hmSteps();
  const x = L.filter(r => (r.k === 'db' ? r.tk : r.k) === st)[0];
  if (!x) return { ok: false, keys: L.map(r => (r.k === 'db' ? r.tk : r.k)) };
  /* 앞의 것들을 「했습니다」로 지나 보낸다 — 실제로 쓰시는 길과 같다 */
  for (const r of L) { if (r.key === x.key) break; hmDoneMark(r.key); }
  hmPaint();
  return { ok: true, key: x.key };
}, st);

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2300);
  await page.evaluate(() => document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()));
  const booted = await page.evaluate(() =>
    typeof hmTaHtml === 'function' && typeof hmKtRun === 'function' && typeof hmPdHtml === 'function');
  if (!booted) {
    console.log('✗ 홈에 TA 첫 마디 · 카톡 문구 · 증권전달 차례가 없습니다.');
    errs.slice(0, 4).forEach(m => console.log('    ' + m));
    await browser.close(); srv.close(); process.exit(1);
  }
  await page.evaluate(SEED);
  await page.waitForTimeout(700);

  /* ── [1][2] TA 첫 마디 ── */
  console.log('\n[1] TA 첫 마디가 <b>DB 종류에 맞게</b> 뜬다');
  const T = await page.evaluate(() => {
    const S = APEX_STAGE.taSay;
    const kinds = ['보장분석3DB', '보장분석17DB', '일반', '소개', '지인', '방송DB',
                   '홈쇼핑DB+', '프로모션DB', '토스DB', '농협', '인하우스', '개척',
                   '알수없는종류', '', null];
    return {
      map: kinds.map(k => ({ k: k === null ? '(없음)' : (k || '(빈칸)'), to: S(k) ? S(k).k : '(못 찾음)' })),
      blank: kinds.filter(k => !S(k) || !S(k).say).length
    };
  });
  const byKind = Object.fromEntries(T.map.map(r => [r.k, r.to]));
  is(byKind['보장분석3DB'] === '보장분석' && byKind['보장분석17DB'] === '보장분석',
     '  <b>보장분석N DB</b> 는 숫자가 달라도 한 무리다 — 열일곱 가지를 낱낱이 안 적는다');
  is(byKind['소개'] === '소개' && byKind['지인'] === '소개', '  <b>소개·지인</b> 이 한 무리다');
  is(byKind['방송DB'] === '방송' && byKind['홈쇼핑DB+'] === '방송' && byKind['토스DB'] === '방송',
     '  <b>방송·홈쇼핑·프로모션·토스</b> 가 한 무리다');
  is(byKind['개척'] === '개척' && byKind['농협'] === '농협', '  <b>개척·농협</b> 이 제 자리로 간다');

  console.log('\n[2] 못 알아본 종류도 <b>화면을 안 비운다</b> (1번)');
  is(byKind['알수없는종류'] === '일반' && byKind['(빈칸)'] === '일반' && byKind['(없음)'] === '일반',
     '  모르는 것·빈칸·없는 것이 다 <b>일반 인사</b>로 간다 — 빈 화면을 안 세운다');
  is(T.blank === 0, '  <b>말이 빈 것이 하나도 없다</b> — ' + T.blank + '개');

  const A = await showStage(page, 'TA');
  is(A.ok, '  홈에 TA 줄이 선다' + (A.ok ? '' : (' ← ' + (A.keys || []).join(','))));
  /* <b>줄마다</b> 맞는 말이 나오는가 — 글자 하나를 박아 두고 견주면, 차례가
     바뀌는 순간 헛알람이 된다. 그 줄의 DB 종류가 정한 무리와 <b>화면</b>을
     견준다 (8번). 세 줄을 하나씩 세워 본다. */
  const TA = await page.evaluate(() => {
    const out = [];
    const L = hmSteps().filter(r => (r.k === 'db' ? r.tk : r.k) === 'TA');
    for (const row of L) {
      try { localStorage.removeItem(HM_DONE_KEY); } catch (e) {}
      for (const r of hmSteps()) { if (r.key === row.key) break; hmDoneMark(r.key); }
      hmPaint();
      const e = document.querySelector('#dynPane .hm-ta');
      out.push({ src: row.src, want: APEX_STAGE.taSay(row.src).t,
                 on: !!e, txt: e ? (e.textContent || '').replace(/\s+/g, ' ') : '' });
    }
    return out;
  });
  is(TA.length === 3 && TA.every(r => r.on),
     '  <b>첫 마디가 바로</b> 떠 있다 — 누르지 않아도 (' + TA.length + '줄)');
  const wrong = TA.filter(r => r.txt.indexOf(r.want) < 0);
  is(wrong.length === 0,
     '  줄마다 <b>그 분의 DB 종류</b>에 맞는 말이 뜬다 — ' +
     TA.map(r => (r.src || '(빈칸)') + '→' + r.want).join(' · ') +
     (wrong.length ? ('  ← 어긋남 ' + wrong.map(r => r.src).join(',')) : ''));
  is(TA.every(r => /복사/.test(r.txt)), '  <b>복사</b>가 그 자리에 있다');

  /* ── [3]~[6] 카톡 문구 ── */
  console.log('\n[3] 카톡 문구를 <b>그 자리에서</b> 짓는다');
  const R = await showStage(page, '거절');
  is(R.ok, '  홈에 거절 줄이 선다');
  const K = await page.evaluate(async () => {
    /* callAI 를 <b>가로챈다</b> — 무엇을 보내는지 그대로 본다 */
    window.__ai = [];
    window.aiReady = function () { return true; };
    window.callAI = function (sys, user) {
      window.__ai.push({ sys: sys, user: user });
      return Promise.resolve('고객님, 안녕하세요. 잠깐 인사드리려 연락드렸습니다.');
    };
    const o = [...document.querySelectorAll('#dynPane .hm-now .hm-ask-o')];
    const i = o.findIndex(b => (b.textContent || '').indexOf('보낼 말 짓기') >= 0);
    let went = ''; const g = window.go; window.go = function (t) { went = t; };
    if (i >= 0) o[i].click();
    await new Promise(r => setTimeout(r, 400));
    window.go = g;
    const box = document.querySelector('#dynPane .hm-kt');
    return { i: i, went: went, boxTxt: box ? (box.textContent || '').replace(/\s+/g, ' ') : '',
             ai: window.__ai, opts: o.map(b => (b.textContent || '').replace(/\s+/g, ' ').trim()) };
  });
  is(K.i >= 0, '  <b>「카톡으로 보낼 말 짓기」</b> 갈래가 있다' +
     (K.i < 0 ? (' ← ' + K.opts.join(' | ').slice(0, 90)) : ''));
  is(K.went === '', '  <b>화면을 안 옮긴다</b> — 그 자리에서 짓는다' + (K.went ? (' ← ' + K.went + ' 로 갔다') : ''));
  is(/안녕하세요/.test(K.boxTxt), '  지은 글이 <b>그 칸에</b> 섰다 — ' + K.boxTxt.slice(0, 40));
  is(/복사/.test(K.boxTxt), '  <b>복사</b>가 그 자리에 있다');

  console.log('\n[4] <b>이름을 AI 에게 안 보낸다</b> (3번)');
  const sent = (K.ai || []).map(x => (x.sys || '') + '\n' + (x.user || '')).join('\n');
  is(K.ai.length === 1, '  AI 를 <b>한 번만</b> 불렀다 — ' + K.ai.length + '번 (7번)');
  is(sent.indexOf('홍쌍리') < 0, '  보낸 글에 <b>고객 이름이 없다</b>');
  is(/고객님/.test(sent), '  <b>「고객님」으로 쓰라</b>고 못 박았다');
  is(/DB 종류/.test(sent) && /지역/.test(sent),
     '  대신 <b>상황</b>은 보낸다 — 단계 · DB 종류 · 지역');
  is(/거절/.test(sent), '  <b>지금 단계</b>를 알려 준다 — 무슨 말을 할지가 거기서 갈린다');

  console.log('\n[5] AI 에게 <b>단정하지 말라고</b> 못 박는다 (1·2번)');
  is(/비과세입니다/.test(sent), '  「비과세입니다」 를 <b>쓰지 말라</b>고 적었다');
  is(/한도|개월/.test(sent) && /숫자/.test(sent), '  <b>한도·나이·개월 수를 적지 말라</b>고 했다');
  is(/심사 결과에 따릅니다/.test(sent), '  「<b>심사 결과에 따릅니다</b>」 를 붙이라고 했다');

  console.log('\n[6] 못 받으면 <b>못 받았다고</b> 적는다 (1번)');
  const F = await page.evaluate(async () => {
    const k = (hmNext().x || {}).key || '';
    window.HMKT[k] = { st: '', txt: '', err: '' };
    window.callAI = function () { return Promise.reject(new Error('서버가 끊었습니다')); };
    hmKtRun(k);
    await new Promise(r => setTimeout(r, 400));
    const box = document.querySelector('#dynPane .hm-kt');
    return (box ? (box.textContent || '') : '').replace(/\s+/g, ' ');
  });
  is(/못 지었습니다/.test(F), '  <b>못 지었다고 말한다</b> — ' + F.slice(0, 46));
  is(/서버가 끊었습니다/.test(F), '  <b>까닭을 그대로</b> 옮긴다 — 지어내지 않는다');
  is(/다시 짓기/.test(F), '  <b>다시 짓기</b>를 내어 준다');

  /* ── [7][8] 증권전달 ── */
  console.log('\n[7] 증권전달에서 <b>추가 계약·가족 소개</b>가 선다');
  const P = await showStage(page, '증권전달');
  is(P.ok, '  홈에 증권전달 줄이 선다');
  const PD = await page.evaluate(() => {
    const e = document.querySelector('#dynPane .hm-pd');
    const items = e ? [...e.querySelectorAll('.hm-pd-i')] : [];
    if (items[2]) items[2].querySelector('.hm-pd-h').click();
    return { n: items.length, head: e ? (e.textContent || '').replace(/\s+/g, ' ') : '' };
  });
  await page.waitForTimeout(250);
  const PD2 = await page.evaluate(() => {
    const e = document.querySelector('#dynPane .hm-pd');
    return (e ? (e.textContent || '') : '').replace(/\s+/g, ' ');
  });
  is(PD.n === 5, '  말하는 차례가 <b>다섯</b> 선다 — ' + PD.n + '개');
  is(/추가 계약/.test(PD.head), '  <b>추가 계약</b>이 어디서 나오는지 적혀 있다');
  is(/가족 소개/.test(PD.head), '  <b>가족 소개</b>가 어디서 나오는지 적혀 있다');
  is(/가족분들은 어떻게/.test(PD2), '  펴면 <b>그대로 읽을 말</b>이 나온다');
  is(/복사/.test(PD2), '  <b>복사</b>가 그 자리에 있다');

  console.log('\n[8] 그 글에 <b>한도·나이·개월 수 같은 숫자가 없다</b> (2번)');
  const N = await page.evaluate(() => {
    const L = APEX_STAGE.pdel.concat(APEX_STAGE.taSrc);
    const body = L.map(x => (x.say || '') + ' ' + (x.why || '') + ' ' + (x.no || '') + ' ' + (x.tip || '')).join('\n');
    /* 「다섯 가지」 처럼 <b>차례를 세는 말</b>은 금액·한도가 아니다. 숫자로 적힌
       것만 본다 — 「상증법 제18조」 를 금액으로 착각하지 않으려는 것과 같다 (8번) */
    const nums = body.match(/\d+\s*(만원|억|원|퍼센트|%|세|개월|년|일)/g) || [];
    const said = /비과세\s*(상품)?입니다|무조건\s*(지급|나옵)|전액\s*보장(됩니다|합니다)|반드시\s*지급/.test(body);
    /* <b>그대로 읽을 말</b>에 태그가 섞이지 않았나 — say 는 화면이 씻어서
       세우므로, 태그를 넣으면 고객 앞에서 &lt;b&gt; 가 <b>글자로 찍힌다</b>.
       실제로 그랬다. why·no·tip 은 굵게 쓰는 자리라 여기서 안 본다. */
    const tagged = APEX_STAGE.pdel.concat(APEX_STAGE.taSrc).concat([APEX_STAGE.taSay('')])
      .filter(x => x && /<[^>]+>/.test(x.say || ''))
      .map(x => (x.n ? ('증권전달 ' + x.n) : ('TA ' + x.k)));
    return { nums: nums, said: said, len: body.length, tagged: tagged };
  });
  is(N.nums.length === 0, '  한도·나이·개월 수가 <b>하나도 없다</b>' +
     (N.nums.length ? (' ← ' + N.nums.join(' / ')) : ' (' + N.len + '자)'));
  is(!N.said, '  <b>단정하는 말이 없다</b> — 지급은 약관과 심사가 정한다');
  is(N.tagged.length === 0,
     '  <b>그대로 읽을 말에 태그가 없다</b> — 넣으면 고객 앞에서 &lt;b&gt; 가 글자로 찍힌다' +
     (N.tagged.length ? (' ← ' + N.tagged.join(' / ')) : ''));

  console.log('\n[9] 조용히 터지지 않았나');
  is(errs.length === 0, '  콘솔 오류 없음' + (errs.length ? ' — ' + errs.slice(0, 2).join(' / ') : ''));

  await browser.close(); srv.close();
  console.log('\n' + (bad ? '✗ ' + bad + '자리' : '✓ 오늘의 미션을 홈에서 — 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
