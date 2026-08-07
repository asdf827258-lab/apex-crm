/* 윤시현의 두뇌 — 물어본 것을 다시 치지 않고 발표자료까지 한 번에.

   여기서 확인하는 것은 세 가지다.
   하나, 질문칸 옆 단추 하나로 "묻고 → 답 받고 → 파일" 이 끊기지 않고 이어지는가.
   둘, 이미 받아 둔 답이 있으면 카드가 그 질문을 알아보고 그대로 자료로 만드는가.
   셋, 예전에 쓰던 "주제 적고 만들기" 길이 사라지지 않았는가.

   파일이 실제로 만들어지는지까지 봐야 한다. 그래서 pxSave 를 지우지 않고
   진짜 pxBuild 를 태운 뒤 크기만 돌려주도록 바꿔 둔다. 내려받기만 막는다.   */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8817;
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
 var mk=function(tbl){
  var f={},a={
   select:function(){return a},gte:function(){return a},lte:function(){return a},is:function(){return a},
   neq:function(){return a},in:function(){return a},not:function(){return a},order:function(){return a},
   limit:function(){return a},single:function(){return a},range:function(){return a},
   eq:function(k,v){f[k]=v;return a},
   insert:function(){return a},update:function(){return a},upsert:function(){return a},
   then:function(res){
     var out=[];
     if(tbl==='profiles')out=[{id:'bp',name:'점검',role:'owner',active:true,plan:'vip'}];
     return Promise.resolve({data:out,error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'bp',email:'bp@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'bp'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

/* 두뇌가 돌려줄 원고 — 숫자·표가 있는 브리핑 모양 */
const ANSWER = [
  '## 요약',
  '- 보장 공백: 3,200만원',
  '- 월 보험료 여력: 34만원',
  '- 준비 기간: 18개월',
  '',
  '## 현황',
  '| 구분 | 현재 | 기준 |',
  '| --- | --- | --- |',
  '| 실손 | 있음 | 있음 |',
  '| 치료비 | 1,000만원 | 5,000만원 |',
  '',
  '## 실행',
  '1. 이번 주 증권 분석',
  '2. 다음 주 설계안 제시'
].join('\n');

/* 두뇌가 구성까지 돌려줄 때 쓰는 JSON — bdParse 가 읽는 모양 */
const PLAN = JSON.stringify({
  title: '보장 공백 3,200만원',
  sections: [
    { kind: 'kpi', title: '한눈에', items: [{ label: '보장 공백', value: '3,200만원' }, { label: '월 여력', value: '34만원' }] },
    { kind: 'table', title: '현황', head: ['구분', '현재', '기준'], rows: [['실손', '있음', '있음'], ['치료비', '1,000만', '5,000만']] },
    { kind: 'compare', title: '두면 이렇게 된다', left: { title: '지금', items: ['공백 3,200만원'] }, right: { title: '하면', items: ['공백 0'] } },
    { kind: 'chart', title: '기대', chart: 'bars', labels: ['1년', '3년', '5년'], values: [12, 34, 61] },
    { kind: 'table', title: '실행', head: ['할 일', '언제', '누가'], rows: [['증권 분석', '이번 주', '설계사']] },
    { kind: 'bullets', title: '확인할 점', items: ['약관 기준 확인'] }
  ]
});

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1240, height: 1100 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('main: ' + e.message));
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  /* 앱이 스스로 정의한 뒤에 덮어써야 한다 — 먼저 넣으면 앱 정의가 이긴다 */
  await page.evaluate(([answer, plan]) => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'bp', name: '점검', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'bp', email: 'bp@t' } };
    OS.cfg = { schema_version: '32' };
    window.__toast = [];
    window.toast = function (m) { window.__toast.push('' + m); };
    window.aiReady = function () { return true; };
    window.__ai = [];
    window.callAI = function (sys, usr) {
      window.__ai.push('' + usr);
      /* 구성(JSON)을 달라는 요청이면 구성을, 아니면 원고를 준다 */
      var wantPlan = ('' + usr).indexOf('[본문]') >= 0;
      return new Promise(function (res) { setTimeout(function () { res(wantPlan ? plan : answer); }, 60); });
    };
    /* 진짜 pxBuild 는 태우고 내려받기만 막는다 */
    window.__decks = [];
    window.pxSave = function (deck, name) {
      window.__decks.push({ name: name, n: (deck.slides || []).length, title: deck.title });
      return pxBuild(deck).size;
    };
  }, [ANSWER, PLAN]);

  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };

  await page.evaluate(() => go('brain'));
  await page.waitForTimeout(500);

  /* ── 화면 ── */
  const shape = await page.evaluate(() => ({
    ask: !!document.getElementById('bdAsk'),
    askTxt: (document.getElementById('bdAsk') || {}).textContent || '',
    now: !!document.getElementById('bdNow'),
    nowOff: !!(document.getElementById('bdNow') || {}).disabled,
    line: (document.getElementById('bdLastLine') || {}).textContent || '',
    box: ((document.getElementById('bdTopicBox') || {}).style || {}).display,
    topic: !!document.getElementById('bdTopic'),
    go: !!document.getElementById('bdGo')
  }));
  ok(shape.ask && shape.askTxt.indexOf('발표자료') >= 0, '질문칸에 "물어보고 발표자료까지" 단추가 있다');
  ok(shape.now, '카드에 "방금 답을 발표자료로" 단추가 있다');
  ok(shape.nowOff, '대화가 없으면 그 단추는 눌리지 않는다');
  ok(shape.line.indexOf('아직 대화가 없습니다') >= 0, '대화가 없다고 알려 준다');
  ok(shape.box === 'none', '주제 칸은 접혀 있다 — 평소엔 칠 일이 없다');
  ok(shape.topic && shape.go, '예전 "주제 적고 만들기" 길도 그대로 남아 있다');

  /* ── 한 번에: 물어보고 발표자료까지 ── */
  const mid = await page.evaluate(() => {
    document.getElementById('brainQ').value = '40대 자영업 대표에게 치료비 통장 설명';
    brainAskPpt();
    return {
      busy: BRAIN.busy,
      askOff: !!(document.getElementById('bdAsk') || {}).disabled
    };
  });
  ok(mid.busy, '누르면 두뇌가 생각하기 시작한다');
  ok(mid.askOff, '생각하는 동안에는 단추가 잠긴다 — 두 번 눌러도 두 번 만들지 않는다');

  await page.waitForTimeout(2500);
  const one = await page.evaluate(() => ({
    hist: BRAIN.hist.length,
    a: (BRAIN.hist[0] || {}).a || '',
    q: (BRAIN.hist[0] || {}).q || '',
    decks: window.__decks.slice(),
    ai: window.__ai.length,
    toast: window.__toast.slice()
  }));
  ok(one.hist === 1 && one.a.indexOf('보장 공백') >= 0, '두뇌가 답을 내놓았다');
  ok(one.q.indexOf('치료비 통장') >= 0, '물어본 말이 그대로 남아 있다');
  ok(one.decks.length === 1, '되묻지 않고 파일까지 한 번에 나왔다');
  ok(one.decks.length === 1 && one.decks[0].n >= 6,
    '장표가 ' + ((one.decks[0] || {}).n || 0) + '장 만들어졌다');
  ok(one.decks.length === 1 && /\.pptx$/.test(one.decks[0].name || ''), '파일 이름이 .pptx 로 끝난다');
  ok(one.ai >= 2, '원고 한 번, 구성 한 번 — 두뇌를 두 번 썼다');

  /* ── 카드가 방금 답을 알아본다 ── */
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => ({
    nowOff: !!(document.getElementById('bdNow') || {}).disabled,
    line: (document.getElementById('bdLastLine') || {}).textContent || '',
    askOff: !!(document.getElementById('bdAsk') || {}).disabled
  }));
  ok(!after.nowOff, '답이 생기면 "방금 답을 발표자료로" 가 눌린다');
  ok(after.line.indexOf('치료비 통장') >= 0, '카드가 방금 물어본 말을 그대로 보여 준다');
  ok(!after.askOff, '다 끝나면 단추가 다시 살아난다');

  /* ── 카드 단추로 한 번 더 ── */
  await page.evaluate(() => { window.__decks = []; document.getElementById('bdNow').click(); });
  await page.waitForTimeout(2200);
  const again = await page.evaluate(() => ({ decks: window.__decks.slice() }));
  ok(again.decks.length === 1, '카드 단추만 눌러도 그 답이 자료가 된다 — 주제를 다시 치지 않는다');
  ok(again.decks.length === 1 && (again.decks[0].title || '').indexOf('치료비 통장') >= 0,
    '표지 제목이 물어본 말에서 나온다');

  /* ── 실패한 답은 원고로 삼지 않는다 ── */
  await page.evaluate(() => {
    BRAIN.hist.push({ q: '망한 질문', a: '__ERR__연결 끊김' });
    bdPaint();
  });
  const err = await page.evaluate(() => ({
    line: (document.getElementById('bdLastLine') || {}).textContent || '',
    off: !!(document.getElementById('bdNow') || {}).disabled
  }));
  ok(err.line.indexOf('치료비 통장') >= 0, '오류가 난 대화는 건너뛰고 멀쩡한 답을 잡는다');
  ok(!err.off, '멀쩡한 답이 하나라도 있으면 단추는 살아 있다');

  /* ── 남의 글이 화면을 헤집지 않는다 ── */
  await page.evaluate(() => {
    BRAIN.hist = [{ q: '<img src=x onerror=alert(1)>표', a: '괜찮은 답' }];
    bdPaint();
  });
  const safe = await page.evaluate(() => ({
    imgs: document.querySelectorAll('#bdLastLine img').length,
    txt: (document.getElementById('bdLastLine') || {}).textContent || ''
  }));
  ok(safe.imgs === 0 && safe.txt.indexOf('<img') >= 0, '질문 속 태그는 글자로만 보인다');

  /* ── 예전 길: 주제 적고 만들기 ── */
  await page.evaluate(() => {
    window.__decks = [];
    BRAIN.hist = [];
    go('brain');
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    document.querySelector('#bdTopicBox').previousElementSibling.querySelector('.btn-ghost').click();
  });
  const opened = await page.evaluate(() => (document.getElementById('bdTopicBox') || {}).style.display);
  ok(opened === 'block', '"새 주제로 만들기" 를 누르면 주제 칸이 펼쳐진다');

  await page.evaluate(() => {
    var t = document.getElementById('bdTopic');
    t.value = '신입 설계사 3개월 정착 계획';
    bdTopic(t.value);
    bdRun();
  });
  await page.waitForTimeout(3000);
  const old = await page.evaluate(() => ({ decks: window.__decks.slice(), busy: BDECK.busy }));
  ok(old.decks.length === 1, '주제만 적어도 예전처럼 자료가 나온다');
  ok(!old.busy, '끝나면 "만드는 중" 이 풀린다');

  /* ── 말로 시켜도 파일까지 ── */
  const word = await page.evaluate(() => ({
    yes: ['피피티 만들어줘', 'PPT 로 만들어줘', '발표자료 하나 만들어줘', '슬라이드 만들어줘', '파워포인트 만들어줘']
      .map(x => vaWantsPpt(vaNorm(x))),
    no: ['블로그 글 하나 써줘', '카톡 문구 만들어줘'].map(x => vaWantsPpt(vaNorm(x)))
  }));
  ok(word.yes.every(Boolean), '"피피티/발표자료/슬라이드 만들어줘" 를 자료 요청으로 알아듣는다');
  ok(word.no.every(x => !x), '글만 달라는 말은 파일까지 만들지 않는다');

  await page.evaluate(() => {
    window.__decks = []; BRAIN.hist = []; VA.making = false; VA.speak = false;
    vaMake('40대 고객 대상 치료비 통장 발표자료 만들어줘');
  });
  await page.waitForTimeout(4200);
  const voice = await page.evaluate(() => ({
    decks: window.__decks.slice(),
    said: (VA.log || []).map(x => x.t).join(' | '),
    making: VA.making
  }));
  ok(voice.decks.length === 1, '말로 시켜도 파일이 나온다');
  ok(!voice.making, '다 끝나면 "만드는 중" 이 풀린다');
  ok(voice.said.indexOf('발표자료 파일') >= 0, '파일까지 만든다고 말해 준다');

  /* ── 빈 상태 방어 ── */
  await page.evaluate(() => { BRAIN.hist = []; window.__toast = []; bdFromLast(); });
  const guard = await page.evaluate(() => window.__toast.slice());
  ok(guard.some(t => t.indexOf('먼저 물어보세요') >= 0), '대화가 없을 때 눌러도 안내만 나온다');

  ok(errs.length === 0, '자바스크립트 오류 없음' + (errs.length ? ' — ' + errs.join(' / ') : ''));

  await browser.close(); srv.close();
  if (fail.length) { console.log('\n✗ 실패 ' + fail.length + '건'); fail.forEach(f => console.log('   - ' + f)); process.exit(1); }
  console.log('\n두뇌 발표자료 점검 통과');
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
