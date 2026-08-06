/* 성향검사 48 — 실제로 48문항을 눌러 본다.

   검사는 화면이 그려졌다고 끝이 아니다. 48개를 다 눌러야 결과가 나오는지,
   뒤집어 물은 문항이 제대로 반대로 채점되는지, 결제 전에는 표 1까지만
   보이고 나머지가 잠겨 있는지, 결제 뒤에 정말 열리는지까지 봐야 한다.

   서버는 가짜로 붙인다. 결제창도 부르지 않는다.                        */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8813;
const SHOT = process.env.MB_SHOT || '';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const STUB = `
window.__inserts=[];
window.supabase={createClient:function(){
 var mk=function(tbl){var a={
   select:function(){return a},eq:function(){return a},gte:function(){return a},lte:function(){return a},
   is:function(){return a},neq:function(){return a},in:function(){return a},not:function(){return a},
   order:function(){return a},limit:function(){return a},single:function(){return a},range:function(){return a},
   insert:function(r){window.__inserts.push({tbl:tbl,row:r});return a},
   update:function(){return a},upsert:function(){return a},
   then:function(res){return Promise.resolve({data:[],error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:true,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'mb',email:'mb@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'mb'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

const fail = [];
function ok(cond, msg) { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) fail.push(msg); }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#mbti', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'mb', name: '점검', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'mb', email: 'mb@t' } };
    try { localStorage.clear(); } catch (e) {}
    window.toast = function (m) { window.__toast = m; };
    go('mbti');
  });
  await page.waitForTimeout(500);

  console.log('\n문항 구성');
  const shape = await page.evaluate(() => {
    const by = {}, dir = {};
    MBTI_Q.forEach(q => { by[q.ax] = (by[q.ax] || 0) + 1; dir[q.ax + (q.k > 0 ? '+' : '-')] = (dir[q.ax + (q.k > 0 ? '+' : '-')] || 0) + 1; });
    const txt = {}; let dup = 0;
    MBTI_Q.forEach(q => { if (txt[q.t]) dup++; txt[q.t] = 1; });
    return { n: MBTI_Q.length, by, dir, dup, pages: mbtiPages(), pairs: MBTI_PAIR.length,
             types: Object.keys(MBTI_TYPES).length, scale: MBTI_SCALE.length };
  });
  ok(shape.n === 48, '문항이 48개다 (' + shape.n + ')');
  ok(['EI', 'SN', 'TF', 'JP'].every(k => shape.by[k] === 12), '지표마다 12문항씩이다 — ' + JSON.stringify(shape.by));
  ok(['EI', 'SN', 'TF', 'JP'].every(k => shape.dir[k + '+'] === 6 && shape.dir[k + '-'] === 6),
     '지표마다 절반은 뒤집어 물었다 (6:6)');
  ok(shape.dup === 0, '같은 문장이 겹치지 않는다');
  ok(shape.scale === 6 && shape.pages === 8, '6단계 척도 · 8쪽 (' + shape.scale + '단계 / ' + shape.pages + '쪽)');
  ok(shape.pairs === 8, '일관성 확인용 짝 8쌍');
  ok(shape.types === 16, '16유형 해설이 모두 있다 (' + shape.types + ')');

  const typeFields = await page.evaluate(() => {
    const need = ['nick', 'line', 'str', 'care', 'open', 'doc', 'pace', 'close', 'obj', 'work', 'fit', 'rub'];
    const bad = [];
    Object.keys(MBTI_TYPES).forEach(k => {
      const t = MBTI_TYPES[k];
      need.forEach(f => { if (!t[f] || (t[f].length === 0)) bad.push(k + '.' + f); });
      (t.fit || []).concat(t.rub || []).forEach(c => { if (!MBTI_TYPES[c]) bad.push(k + ' → 없는 유형 ' + c); });
    });
    return bad;
  });
  ok(typeFields.length === 0, '16유형 해설에 빈 칸이 없다' + (typeFields.length ? ' — ' + typeFields.slice(0, 5).join(', ') : ''));

  console.log('\n검사 진행');
  await page.evaluate(() => {
    document.getElementById('mbName').value = '홍길동';
    document.getElementById('mbKind').value = 'client';
    mbtiStart();
  });
  await page.waitForTimeout(300);
  const started = await page.evaluate(() => ({ step: MB.step, qs: document.querySelectorAll('.mb-q').length }));
  ok(started.step === 'test' && started.qs === 6, '시작하면 한 쪽에 6문항이 나온다 (' + started.qs + ')');

  const noName = await page.evaluate(() => {
    MB.step = 'intro'; go('mbti');
    document.getElementById('mbName').value = '';
    window.__toast = ''; mbtiStart();
    const t = window.__toast; MB.step = 'intro';
    document.getElementById('mbName').value = '홍길동'; mbtiStart();
    return t;
  });
  ok(/이름/.test(noName || ''), '이름 없이 시작하면 막는다');

  /* 답 없이 다음으로 넘어가려 하면 막히는가 */
  const guard = await page.evaluate(() => { window.__toast = ''; mbtiPage(1); return { t: window.__toast, page: MB.page, miss: document.querySelectorAll('.mb-q.miss').length }; });
  ok(guard.page === 0 && /답하지 않은/.test(guard.t || ''), '안 고른 채로는 다음 쪽으로 못 간다');
  ok(guard.miss === 6, '안 고른 문항 6개가 빨갛게 표시된다 (' + guard.miss + ')');

  /* 실제로 버튼을 눌러 한 쪽을 채운다 */
  for (let i = 0; i < 6; i++) await page.click('#mbq' + i + ' .mb-opt:nth-child(1)');
  const filled = await page.evaluate(() => ({ on: document.querySelectorAll('.mb-opt.on').length, done: mbtiAnsCount(),
    bar: (document.querySelector('.mb-progbar > i') || {}).style && document.querySelector('.mb-progbar > i').style.width }));
  ok(filled.on === 6 && filled.done === 6, '버튼을 누르면 그 문항만 선택된다 (' + filled.on + '개)');
  ok(filled.bar === '13%' || filled.bar === '12%' || filled.bar === '13%', '진행률 막대가 따라 움직인다 (' + filled.bar + ')');

  await page.evaluate(() => mbtiPage(1));
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => MB.page === 1), '한 쪽을 다 채우면 다음으로 넘어간다');
  ok(await page.evaluate(() => { mbtiPage(-1); return MB.page === 0; }), '이전 쪽으로 되돌아간다');
  ok(await page.evaluate(() => document.querySelectorAll('.mb-opt.on').length === 6), '되돌아오면 골랐던 답이 남아 있다');

  /* 나갔다 들어와도 이어서 되는가 */
  await page.evaluate(() => { mbtiQuit(); });
  await page.waitForTimeout(200);
  const resume = await page.evaluate(() => {
    const has = /하다 만 검사/.test(document.getElementById('dynPane').textContent);
    mbtiResume(); return { has: has, step: MB.step, done: mbtiAnsCount() };
  });
  ok(resume.has && resume.step === 'test' && resume.done === 6, '나갔다 와도 답한 데까지 이어서 한다 (' + resume.done + '문항)');

  /* 48문항을 끝까지 — 실제 채점이 맞는지 보려고 뚜렷한 ENFP 로 답한다 */
  console.log('\n채점');
  const scored = await page.evaluate(() => {
    /* 원하는 유형이 나오도록: 그 글자 쪽이면 매우 그렇다(+3), 아니면 전혀 아니다(-3) */
    const want = { EI: 'E', SN: 'N', TF: 'F', JP: 'P' };
    MBTI_Q.forEach((q, i) => {
      const first = q.ax.charAt(0);
      const pushesFirst = q.k > 0;
      const wantFirst = want[q.ax] === first;
      mbtiPick(i, (pushesFirst === wantFirst) ? 3 : -3);
    });
    mbtiSubmit();
    return { step: MB.step, code: MB.result && MB.result.code, cons: MB.result && MB.result.consistency,
             axes: (MB.result && MB.result.axes || []).map(a => ({ k: a.key, s: a.sum, cl: a.clarity, p: a.pctA })) };
  });
  await page.waitForTimeout(400);
  ok(scored.step === 'result', '48문항을 다 채우면 결과가 나온다');
  ok(scored.code === 'ENFP', '뒤집어 물은 문항까지 반대로 채점된다 — 의도한 ENFP 가 나왔다 (' + scored.code + ')');
  ok(scored.axes.every(a => Math.abs(a.s) === 36), '한쪽으로만 답하면 원점수가 ±36 이 된다');
  ok(scored.axes.every(a => a.cl === '아주 뚜렷'), '분명도가 모두 아주 뚜렷으로 나온다');
  ok(scored.cons === 100, '일관되게 답하면 일관성 100% (' + scored.cons + '%)');

  /* 대충 다 같은 값으로 찍으면 일관성이 무너지는가 */
  const lazy = await page.evaluate(() => {
    const ans = {}; MBTI_Q.forEach((q, i) => ans[i] = 3);
    const sc = mbtiScore(ans);
    return { cons: sc.consistency, border: sc.axes.filter(a => a.border).length };
  });
  ok(lazy.cons <= 10, '전부 매우 그렇다로 찍으면 일관성이 바닥이다 (' + lazy.cons + '%)');
  ok(lazy.border === 4, '그때는 4지표 모두 경계로 잡힌다 (' + lazy.border + '개)');

  console.log('\n결과 화면 · 잠금');
  const locked = await page.evaluate(() => {
    const t = document.getElementById('mbtiReport').textContent;
    return { cap1: /표 1\. 4지표 요약/.test(t), cap2: /표 2\./.test(t), cap4: /표 4\./.test(t),
      lock: !!document.querySelector('.mb-lock'), price: /9,900원/.test(t),
      rows: document.querySelectorAll('.mb-tb tbody tr').length,
      code: /ENFP/.test(t), print: !!document.querySelector('[onclick="mbtiPrint()"]') };
  });
  ok(locked.cap1 && locked.rows === 4, '표 1(4지표 요약) 4줄이 무료로 보인다 (' + locked.rows + '줄)');
  ok(locked.code, '유형 코드가 결과 맨 위에 나온다');
  ok(!locked.cap2 && !locked.cap4, '결제 전에는 표 2~6 이 보이지 않는다');
  ok(locked.lock && locked.price, '잠금 카드와 가격(9,900원)이 나온다');
  ok(!locked.print, '결제 전에는 인쇄 버튼이 없다');
  if (SHOT) await page.screenshot({ path: SHOT + '/mbti-locked.png', fullPage: true });

  console.log('\n결제');
  const pay = await page.evaluate(() => {
    mbtiPayOpen();
    const t = document.getElementById('osPayOverlay').textContent;
    return { open: true, card: /카드 결제/.test(t), bank: /계좌이체/.test(t),
      naver: /네이버페이/.test(t), kakao: /카카오/.test(t), price: /9,900원/.test(t) };
  });
  ok(pay.card && pay.bank && pay.naver && pay.kakao, '결제수단 네 가지가 뜬다');
  ok(pay.price, '결제창에 금액이 나온다');

  const noKey = await page.evaluate(() => { window.__toast = ''; mbtiPayCard(); return window.__toast; });
  ok(/연결/.test(noKey || ''), '토스 키가 없으면 결제창을 부르지 않고 안내한다');

  const bankReq = await page.evaluate(() => {
    PAY_CFG = { bank: '국민은행', account: '123456-01-789012', holder: '윤', naver: '', kakao: '' };
    mbtiPayBank();
    const shown = /123456-01-789012/.test(document.getElementById('osPayOverlay').textContent);
    mbtiPayReq('bank');
    const req = (window.__inserts || []).filter(x => x.tbl === 'payment_requests').pop();
    return { shown: shown, req: req && req.row };
  });
  await page.waitForTimeout(200);
  ok(bankReq.shown, '계좌이체를 고르면 입금 계좌가 나온다');
  ok(bankReq.req && bankReq.req.plan === 'mbti48' && bankReq.req.amount === 9900 && bankReq.req.cycle === 'once',
     '확인 요청이 payment_requests 에 1건 결제로 남는다');
  ok(await page.evaluate(() => /접수/.test(document.getElementById('osPayOverlay').textContent)), '요청 접수 화면으로 바뀐다');

  /* 카드 승인이 돌아온 뒤 — 리포트가 열리는가 */
  const opened = await page.evaluate(() => {
    osPayModalClose();
    mbtiPendSet({ orderId: 'MBTI-TEST-1', resultId: MB.result.id, amount: 9900 });
    mbtiPayApplied(true, '');
    const t = document.getElementById('mbtiReport').textContent;
    return { cap2: /표 2\./.test(t), cap3: /표 3\./.test(t), cap4: /표 4\./.test(t),
      cap5: /표 5\./.test(t), cap6: /표 6\./.test(t), lock: !!document.querySelector('.mb-lock'),
      qrows: document.querySelectorAll('.mb-tb tbody tr').length,
      print: /인쇄/.test(document.getElementById('dynPane').textContent),
      pend: !!mbtiPendGet() };
  });
  ok(opened.cap2 && opened.cap3 && opened.cap4 && opened.cap5 && opened.cap6, '결제 뒤 표 2~6 이 모두 열린다');
  ok(!opened.lock, '잠금 카드가 사라진다');
  ok(opened.qrows > 60, '문항별 응답 48행이 표에 들어간다 (전체 ' + opened.qrows + '줄)');
  ok(opened.print, '인쇄·PDF 버튼이 생긴다');
  ok(!opened.pend, '결제 대기 기록이 지워진다');
  if (SHOT) await page.screenshot({ path: SHOT + '/mbti-paid.png', fullPage: true });

  /* 다시 열어도 계속 열려 있는가 */
  const again = await page.evaluate(() => {
    const id = MB.result.id;
    mbtiBackToIntro(); mbtiLoadList();
    const listed = /ENFP/.test(document.getElementById('mbtiListHost').textContent);
    const openTxt = /열림/.test(document.getElementById('mbtiListHost').textContent);
    mbtiOpenSaved(id);
    return { listed: listed, openTxt: openTxt, cap5: /표 5\./.test(document.getElementById('mbtiReport').textContent) };
  });
  ok(again.listed && again.openTxt, '지난 검사 목록에 결과와 열림 표시가 남는다');
  ok(again.cap5, '결제한 리포트는 다시 열어도 그대로 열린다');

  /* 서버 저장이 실제로 시도되는가 */
  const saved = await page.evaluate(() => (window.__inserts || []).filter(x => x.tbl === 'mbti_tests').pop());
  ok(saved && saved.row && saved.row.member_id === 'mb' && saved.row.type_code === 'ENFP' && !('paid' in saved.row),
     '검사 결과가 서버에 저장되고, paid 는 앱에서 보내지 않는다');

  /* 좁은 화면 */
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(400);
  const wide = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(wide.sw <= wide.cw + 2, '390px 에서 가로 스크롤 없음 (' + wide.sw + '/' + wide.cw + ')');
  await page.evaluate(() => { mbtiBackToIntro(); document.getElementById('mbName').value = '김철수'; mbtiStart(); });
  await page.waitForTimeout(300);
  const wide2 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    cols: getComputedStyle(document.querySelector('.mb-opts')).gridTemplateColumns.split(' ').length }));
  ok(wide2.sw <= wide2.cw + 2, '390px 검사 화면도 가로 스크롤 없음 (' + wide2.sw + '/' + wide2.cw + ')');
  ok(wide2.cols === 3, '좁은 화면에서는 답 버튼이 3칸씩 두 줄로 접힌다 (' + wide2.cols + '칸)');
  if (SHOT) await page.screenshot({ path: SHOT + '/mbti-test-m.png', fullPage: true });

  /* ── 고객에게 보내는 페이지(app/mbti48.html)도 같이 본다 ─────────────── */
  console.log('\n고객용 페이지');
  await page.setViewportSize({ width: 412, height: 900 });
  await page.goto('http://127.0.0.1:' + PORT + '/app/mbti48.html?agent=%EC%9C%A4%EC%8B%9C%ED%98%84&bank=%EA%B5%AD%EB%AF%BC&acct=123-456', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const cute = await page.evaluate(() => ({
    n: MBTI_Q.length, types: Object.keys(MBTI_TYPES).length,
    masc: (document.querySelectorAll('svg.masc') || []).length,
    agent: /윤시현/.test(document.body.textContent),
    ext: Array.prototype.some.call(document.querySelectorAll('script,link,img'),
      e => /^https?:/.test(e.getAttribute('src') || e.getAttribute('href') || ''))
  }));
  ok(cute.n === 48 && cute.types === 16, '고객용 페이지도 48문항 · 16유형이다');
  ok(cute.masc >= 4, '캐릭터 그림이 그 자리에서 그려진다 (' + cute.masc + '개)');
  ok(cute.agent, '주소에 붙여 보낸 설계사 이름이 화면에 나온다');
  ok(!cute.ext, '바깥에서 받아오는 그림·글꼴이 없다 — 인터넷이 느려도 그대로 뜬다');

  const flow = await page.evaluate(() => {
    ST.name = '김하나';
    const want = { EI: 'E', SN: 'N', TF: 'F', JP: 'P' };
    MBTI_Q.forEach((q, i) => {
      const first = q.ax.charAt(0);
      ST.ans[i] = ((q.k > 0) === (want[q.ax] === first)) ? 3 : -3;
    });
    finish();
    const caps = Array.prototype.map.call(document.querySelectorAll('.cap i'), e => e.textContent);
    return { code: ST.res.code, cons: ST.res.consistency, step: ST.step, caps: caps,
      lock: !!document.querySelector('.lock'), price: /9,900원/.test(document.body.textContent) };
  });
  ok(flow.step === 'result' && flow.code === 'ENFP' && flow.cons === 100, '48문항을 채우면 앱과 같은 결과가 나온다 (' + flow.code + ')');
  ok(flow.caps.length === 1 && flow.caps[0] === '표 1' && flow.lock && flow.price,
     '표 1만 보이고 표 2부터는 잠겨 있다 (보이는 표: ' + flow.caps.join(', ') + ')');

  const un = await page.evaluate(() => {
    unlock();
    return { caps: Array.prototype.map.call(document.querySelectorAll('.cap i'), e => e.textContent),
      lock: !!document.querySelector('.lock'), tables: document.querySelectorAll('table').length, paid: ST.paid };
  });
  ok(un.caps.length === 6 && un.tables === 6 && !un.lock && un.paid,
     '열면 표 1~6 여섯 개가 모두 나온다 (' + un.caps.join(', ') + ')');

  await page.waitForTimeout(300);
  const cw2 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    stacked: getComputedStyle(document.querySelector('.stack thead')).display }));
  ok(cw2.sw <= cw2.cw + 2, '412px 에서 가로 스크롤 없음 (' + cw2.sw + '/' + cw2.cw + ')');
  ok(cw2.stacked === 'none', '좁은 화면에서는 표가 한 줄씩 카드로 펼쳐진다');

  const back = await page.evaluate(() => { location.reload(); return true; });
  await page.waitForTimeout(900);
  ok(await page.evaluate(() => /표 6/.test(document.body.textContent)), '새로고침해도 결제한 리포트가 그대로 열려 있다');

  await browser.close(); srv.close();
  console.log('');
  if (errs.length) { console.log('콘솔 오류 ' + errs.length + '건'); errs.slice(0, 6).forEach(e => console.log('   ' + e.slice(0, 160))); }
  if (fail.length) { console.log('실패 ' + fail.length + '건'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
  if (errs.length) process.exit(1);
  console.log('성향검사 48 점검 통과');
})().catch(e => { console.error('오류:', e); process.exit(1); });
