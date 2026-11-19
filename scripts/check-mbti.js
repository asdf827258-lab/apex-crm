/* 성향검사 48 · 사주 × MBTI 상담카드 — 실제로 눌러 본다.

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

  console.log('\n결과 화면');
  const rep = await page.evaluate(() => {
    const t = document.getElementById('mbtiReport').textContent;
    return { caps: (t.match(/표 \d/g) || []).filter((v, i, a) => a.indexOf(v) === i),
      rows: document.querySelectorAll('.mb-tb tbody tr').length,
      code: /ENFP/.test(t), print: !!document.querySelector('[onclick="mbtiPrint()"]'),
      pay: /결제|9,900|잠금|토스/.test(document.getElementById('dynPane').textContent) };
  });
  ok(rep.caps.length === 6, '표 1~6 이 한 번에 모두 나온다 (' + rep.caps.join(', ') + ')');
  ok(rep.code, '유형 코드가 결과 맨 위에 나온다');
  ok(rep.rows > 60, '문항별 응답 48행이 표에 들어간다 (전체 ' + rep.rows + '줄)');
  ok(rep.print, '인쇄·PDF 버튼이 있다');
  ok(!rep.pay, '앱 검사 화면에 결제·잠금이 남아 있지 않다');
  if (SHOT) await page.screenshot({ path: SHOT + '/mbti-report.png', fullPage: true });

  /* 저장한 것을 다시 열어도 그대로인가 */
  const again = await page.evaluate(() => {
    const id = MB.result.id;
    mbtiBackToIntro(); mbtiLoadList();
    const listed = /ENFP/.test(document.getElementById('mbtiListHost').textContent);
    mbtiOpenSaved(id);
    return { listed: listed, cap5: /표 5\./.test(document.getElementById('mbtiReport').textContent) };
  });
  ok(again.listed, '지난 검사 목록에 결과가 남는다');
  ok(again.cap5, '저장한 결과를 다시 열어도 표가 그대로 나온다');

  const saved = await page.evaluate(() => (window.__inserts || []).filter(x => x.tbl === 'mbti_tests').pop());
  ok(saved && saved.row && saved.row.member_id === 'mb' && saved.row.type_code === 'ENFP',
     '검사 결과가 서버에 저장된다');

  const link = await page.evaluate(() => {
    mbtiBackToIntro();
    return document.getElementById('dynPane').innerHTML.indexOf('mbtiOpenSaju') >= 0
      || document.getElementById('dynPane').innerHTML.indexOf('mbtiShareLink') >= 0;
  });
  ok(link, '사주 상담카드로 가는 버튼이 있다');

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

  /* ── 사주 × MBTI 상담카드(app/saju-mbti.html) ──────────────────────── */
  console.log('\n사주 상담카드 — 만세력 계산');
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('http://127.0.0.1:' + PORT + '/app/saju-mbti.html' +
    '?agent=%EC%9C%A4%EC%8B%9C%ED%98%84&tel=01012345678&bank=%EA%B5%AD%EB%AF%BC&acct=123-456', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  /* 만세력이 맞는지부터 본다 — 여기가 틀리면 나머지가 전부 틀린다 */
  const cal = await page.evaluate(() => {
    const gz = s => GAN[s.dg] + JI[s.dj];
    const a = sajuCalc(2000, 1, 1, 12, 0, 0);          // 무오일
    const b = sajuCalc(1949, 10, 1, 12, 0, 0);         // 갑자일
    const c = sajuCalc(1990, 5, 15, 9, 30, 0);         // 경오년 신사월 경진일 신사시
    const d = sajuCalc(2024, 1, 15, 3, 0, 0);          // 입춘 전 → 계묘년
    const e1 = sajuCalc(1986, 6, 6, 22, 30, 0);        // 야자시 전
    const e2 = sajuCalc(1986, 6, 6, 23, 30, 0);        // 23시 → 다음날 일진
    const ip = jdToKst(ipchunJd(2024));
    return { a: gz(a), b: gz(b),
      c: [GAN[c.yg] + JI[c.yj], GAN[c.mg] + JI[c.mj], GAN[c.dg] + JI[c.dj], GAN[c.hg] + JI[c.hj]].join(' '),
      dYear: GAN[d.yg] + JI[d.yj], dSy: d.sajuYear,
      e1: gz(e1), e2: gz(e2),
      ip: ip.m + '/' + ip.d + ' ' + ip.H + ':' + ('0' + ip.Mi).slice(-2) };
  });
  ok(cal.a === '무오', '2000-01-01 은 무오일 (' + cal.a + ')');
  ok(cal.b === '갑자', '1949-10-01 은 갑자일 (' + cal.b + ')');
  ok(cal.c === '경오 신사 경진 신사', '1990-05-15 09:30 = 경오 신사 경진 신사 (' + cal.c + ')');
  ok(cal.dYear === '계묘' && cal.dSy === 2023, '1월 15일생은 입춘 전이라 지난해 간지 (' + cal.dYear + ')');
  ok(cal.e1 !== cal.e2, '23시가 넘으면 일진이 다음날로 넘어간다 (' + cal.e1 + ' → ' + cal.e2 + ')');
  ok(cal.ip.indexOf('2/4') === 0, '2024년 입춘을 2월 4일로 잡는다 (' + cal.ip + ' · 공식 17:27)');

  const sip = await page.evaluate(() => {
    const s = sajuCalc(1990, 5, 15, 9, 30, 0), t = sipsinTable(s), o = ohCount(s);
    let sum = 0; for (const k in o) sum += o[k];
    return { rows: t.rows.length, sum: sum, top: t.top,
      day: sipsinOf(s.dg, s.dg), oh: o, str: strengthOf(s).level };
  });
  ok(sip.rows === 7 && sip.sum === 8, '여덟 글자 · 일간 뺀 일곱 자리 십신 (글자 ' + sip.sum + ' · 십신 ' + sip.rows + ')');
  ok(sip.day === '비견', '일간을 자기 자신과 비교하면 비견이다');
  ok(['비겁', '식상', '재성', '관성', '인성'].indexOf(sip.top) >= 0, '십신 우세가 다섯 무리 중 하나로 잡힌다 (' + sip.top + ')');

  console.log('\n성향 · 궁합 · 상담 전략');
  const flow = await page.evaluate(() => {
    S.me = { name: '윤시현', gender: 'M', mbti: 'ENFJ', y: '1978', m: '3', d: '12', H: 14, Mi: 0, noTime: false, adj: false, saju: null, res: null };
    calcPerson(S.me);
    S.cl = { name: '김하나', gender: 'F', mbti: '', y: '1990', m: '5', d: '15', H: 9, Mi: 30, noTime: false, adj: false, saju: null, res: null };
    calcPerson(S.cl);
    const want = { EI: 'I', SN: 'S', TF: 'T', JP: 'J' };
    S.target = 'client'; S.ans = {};
    MBTI_Q.forEach((q, i) => { S.ans[i] = ((q.k > 0) === (want[q.ax] === q.ax.charAt(0))) ? 3 : -3; });
    finishTest();
    const f = fitCalc(S.me, S.cl), p = talkPlan(S.me, S.cl), c = combine(S.cl);
    return { step: S.step, code: personCode(S.cl), cons: S.cl.res.consistency,
      score: f.score, saju: f.sajuScore, mbti: f.mbtiScore,
      rows: p.rows.map(r => r.label + ':' + r.me + r.you + (r.same ? '=' : '≠')),
      tf: p.rows[2].fix, combineRows: c.rows.length, opens: p.opens.length, avoid: p.avoid.length, closes: p.closes.length,
      luck: p.luck.gz };
  });
  ok(flow.step === 'board' && flow.code === 'ISTJ' && flow.cons === 100, '48문항을 채우면 결과판으로 넘어간다 (' + flow.code + ')');
  ok(flow.score > 0 && flow.score <= 100 && flow.saju > 0 && flow.mbti > 0,
     '궁합이 사주 ' + flow.saju + ' · 성향 ' + flow.mbti + ' → 종합 ' + flow.score + '점으로 나온다');
  ok(flow.rows.length === 4, '네 축 모두 나 vs 고객으로 비교된다 — ' + flow.rows.join(' / '));
  ok(/감정 표현을 절반/.test(flow.tf), '나는 F 고객은 T 일 때 "감정 표현을 줄이고 근거부터" 처방이 나온다');
  ok(flow.combineRows === 4 && flow.opens >= 3 && flow.avoid >= 3 && flow.closes >= 2,
     '검사×사주 교차 4줄 · 첫마디 ' + flow.opens + ' · 피할 말 ' + flow.avoid + ' · 클로징 ' + flow.closes);
  ok(/[가-힣]{2}/.test(flow.luck), '올해 세운이 간지로 나온다 (' + flow.luck + ')');

  console.log('\n사주 정밀 — 12운성 · 공망 · 신살 · 대운');
  const pro = await page.evaluate(() => {
    const s = sajuCalc(1990, 5, 15, 9, 30, 0);
    const di = ((jdnOf(1990, 5, 15) + 49) % 60 + 60) % 60;
    const du = daeun(s, 'F');
    return { un: unseong(s.dg, s.dj), unGap: unseong(0, 11), gm: gongmang(di).map(x => JI[x]),
      sin: sinsalOf(s).map(x => x.name), duStart: du.start, duFwd: du.forward,
      du1: GAN[du.list[0].g] + JI[du.list[0].j], du2: GAN[du.list[1].g] + JI[du.list[1].j],
      johu: johu(s).season, len: du.list.length };
  });
  ok(pro.un === '양', '경금 일간의 진(辰)은 12운성 양(養) 자리 (' + pro.un + ')');
  ok(pro.unGap === '장생', '갑목의 해(亥)는 장생 (' + pro.unGap + ')');
  ok(pro.gm.join('') === '신유', '경진일주(갑술순)의 공망은 신·유 (' + pro.gm.join('·') + ')');
  ok(pro.sin.indexOf('화개') >= 0, '일지 진(辰)에서 화개를 잡는다 (' + (pro.sin.join('·') || '없음') + ')');
  ok(!pro.duFwd && pro.duStart === 3, '양년 여자는 역행 · 대운수 3 (역행:' + !pro.duFwd + ' 대운수:' + pro.duStart + ')');
  ok(pro.du1 === '경진' && pro.du2 === '기묘', '월주 신사에서 역행해 경진 → 기묘 (' + pro.du1 + ' → ' + pro.du2 + ')');
  ok(pro.len === 8 && pro.johu === '여름', '대운 8개 · 5월생은 여름 (' + pro.len + '개 / ' + pro.johu + ')');

  const cog = await page.evaluate(() => ({
    istj: funcStack('ISTJ'), enfj: funcStack('ENFJ'), entp: funcStack('ENTP'), isfp: funcStack('ISFP') }));
  ok(cog.istj.dom === 'Si' && cog.istj.aux === 'Te' && cog.istj.inf === 'Ne', 'ISTJ 인지기능 Si-Te-Fi-Ne');
  ok(cog.enfj.dom === 'Fe' && cog.enfj.aux === 'Ni' && cog.enfj.inf === 'Ti', 'ENFJ 인지기능 Fe-Ni-Se-Ti');
  ok(cog.entp.dom === 'Ne' && cog.entp.aux === 'Ti', 'ENTP 인지기능 Ne-Ti-Fe-Si');
  ok(cog.isfp.dom === 'Fi' && cog.isfp.aux === 'Se', 'ISFP 인지기능 Fi-Se-Ni-Te');

  console.log('\n아이스브레이킹 · 보험 · 덕담');
  const ice = await page.evaluate(() => {
    const ib = iceBreak(S.cl);
    goTab('ice');
    const t = document.getElementById('view').textContent;
    const bl = blessing(S.cl);
    return { bless: bl.length, opens: ib.opens.length, asks: ib.asks.length, nos: ib.nos.length,
      polite: bl.filter(x => /(니다|세요|시죠)[.!?]?$/.test(x.replace(/\s+$/, ''))).length,
      hasFlow: /첫 만남 15분/.test(t), noSell: /상품 이야기는 아직/.test(t) };
  });
  ok(ice.bless >= 3, '덕담이 사주·유형에서 여러 줄 나온다 (' + ice.bless + '줄)');
  ok(ice.polite === ice.bless, '덕담이 전부 손님 앞에서 읽을 수 있는 존댓말이다 (' + ice.polite + '/' + ice.bless + ')');
  ok(ice.opens >= 4, '포문 문장이 4개 이상 나온다 (' + ice.opens + ')');
  ok(ice.asks >= 5 && ice.nos >= 3, '질문 ' + ice.asks + '개 · 하면 안 되는 말 ' + ice.nos + '개');
  ok(ice.hasFlow && ice.noSell, '첫 만남 15분 흐름과 "상품 이야기는 아직" 원칙이 들어 있다');

  const ins = await page.evaluate(() => {
    goTab('ins');
    const t = document.getElementById('view').textContent;
    return { tables: document.querySelectorAll('#view table').length,
      buy: /무엇을 사는가/.test(t), care: /연락 주기/.test(t), intro: /소개 부탁/.test(t),
      warn: /가입 권유의 근거|절대 하지 않습니다/.test(t) };
  });
  ok(ins.tables >= 2 && ins.buy && ins.care, '보험 성향 표와 계약 후 관리 표가 나온다 (' + ins.tables + '개)');
  ok(ins.intro, '소개 부탁하는 방법까지 들어 있다');
  ok(ins.warn, '운을 가입 권유 근거로 쓰지 말라는 경고가 붙어 있다');

  console.log('\n인생 운 — 열 가지 · 시기 · 앞으로 12년');
  const life = await page.evaluate(() => {
    goTab('life');
    const ll = lifeLuck(S.cl), st = lifeStages(S.cl), ah = yearAhead(S.cl, 12), lm = lifeMind(S.cl);
    const t = document.getElementById('view').textContent;
    return { n: ll.items.length, keys: ll.items.map(x => x.key),
      allHave: ll.items.every(x => x.read && x.care && x.bless && x.base && x.level),
      stages: st.length, stageLabels: st.map(x => x.pil),
      ahead: ah.length, chung: ah.filter(x => x.rel === '충').map(x => x.year),
      hap: ah.filter(x => x.rel === '육합' || x.rel === '삼합').length,
      mind: !!(lm && lm.career && lm.growth && lm.stress),
      warn: /겁을 주는 상담/.test(t), notFate: /정해진 운명이 아니라/.test(t),
      med: /병원에서 확인/.test(t), len: t.replace(/\s+/g, '').length };
  });
  ok(life.n === 10, '인생 운이 열 가지로 정리된다 (' + life.n + ') — ' + life.keys.join(' · '));
  ok(life.allHave, '열 가지 모두 근거 · 풀이 · 조심할 것 · 덕담이 채워져 있다');
  ok(life.stages === 4 && life.stageLabels.join('') === '년주월주일주시주',
     '근묘화실 — 네 기둥이 초년·청년·중년·말년으로 이어진다');
  ok(life.ahead === 12, '앞으로 12년 세운이 나온다 (' + life.ahead + '년)');
  ok(life.chung.indexOf(2030) >= 0 && life.hap >= 2,
     '경진일주는 2030 경술년에 일지 충으로 잡힌다 (충: ' + life.chung.join(',') + ' · 합 ' + life.hap + '해)');
  ok(life.mind, '성향으로 보는 인생(적성 · 숙제 · 지칠 때 · 40대 이후)도 함께 나온다');
  ok(life.med && life.warn && life.notFate,
     '병은 병원에서 · 겁주지 말 것 · 정해진 운명이 아님 — 세 가지 경고가 모두 붙어 있다');
  ok(life.len > 2500, '인생 운 한 탭에 ' + life.len + '자가 채워진다');

  console.log('\n모드 — 사주 전문 · MBTI 전문');
  const modes = await page.evaluate(() => {
    const out = {};
    ['both', 'saju', 'mbti'].forEach(m => { out[m] = tabsFor(m); });
    /* 사주만 있고 유형이 없는 고객 */
    const keep = JSON.parse(JSON.stringify(S.cl));
    S.mode = 'saju'; S.cl.mbti = ''; S.cl.res = null;
    let sajuOk = true; try { tabsFor('saju').forEach(t => { goTab(t); }); } catch (e) { sajuOk = e.message; }
    /* 유형만 있고 사주가 없는 고객 */
    S.mode = 'mbti'; S.cl.mbti = 'ISTJ'; S.cl.saju = null;
    let mbtiOk = true; try { tabsFor('mbti').forEach(t => { goTab(t); }); } catch (e) { mbtiOk = e.message; }
    S.cl = keep; S.mode = 'both'; draw();
    return { out: out, sajuOk: sajuOk, mbtiOk: mbtiOk };
  });
  ok(modes.out.both.length >= 9 && modes.out.saju.length >= 7 && modes.out.mbti.length >= 8,
     '모드마다 탭이 다르다 — 통합 ' + modes.out.both.length + ' · 사주 ' + modes.out.saju.length + ' · MBTI ' + modes.out.mbti.length);
  ok(modes.sajuOk === true, '유형 없이 사주만으로도 모든 탭이 그려진다' + (modes.sajuOk === true ? '' : ' — ' + modes.sajuOk));
  ok(modes.mbtiOk === true, '사주 없이 유형만으로도 모든 탭이 그려진다' + (modes.mbtiOk === true ? '' : ' — ' + modes.mbtiOk));

  console.log('\n혈액형 · 리스크 · 내 눈용/고객 화면');
  const bl = await page.evaluate(() => {
    S.me.blood = 'O'; S.cl.blood = 'A'; S.view = 'agent'; S.tab = 'blood'; draw();
    const t = document.getElementById('view').textContent;
    return { types: Object.keys(BLOOD).length, fit: bloodFit('O', 'A'), fitAll: Object.keys(BLOOD_FIT).length,
      nick: /신중한 조율가/.test(t), warn: /과학적으로 확인된 것이 아닙니다/.test(t),
      tabIn: tabsFor('both', 'agent').indexOf('blood') >= 0,
      bloodMode: tabsFor('blood', 'agent').join(',') };
  });
  ok(bl.types === 4 && bl.fitAll === 10, '혈액형 네 가지 · 궁합 조합 10개 (' + bl.types + ' / ' + bl.fitAll + ')');
  const bl2 = await page.evaluate(() => {
    const T = ['A', 'B', 'O', 'AB'], miss = [], sc = {};
    T.forEach(x => T.forEach(y => {
      const f = bloodFit(x, y), s2 = bloodScore(x, y);
      if (!f || !s2) miss.push(x + '-' + y);
      sc[x + y] = s2;
      if (bloodScore(x, y) !== bloodScore(y, x)) miss.push('비대칭 ' + x + '-' + y);
    }));
    const deep = Object.keys(BLOOD_DEEP);
    const need = ['life', 'work', 'money', 'love', 'health', 'stress', 'grow', 'with'];
    const bad = [];
    deep.forEach(k => need.forEach(f => { if (!BLOOD_DEEP[k][f]) bad.push(k + '.' + f); }));
    const roles = Object.keys(BLOOD_ROLE).every(g => T.every(x => !!BLOOD_ROLE[g][x]));
    return { miss: miss, bad: bad, roles: roles, ab: sc['BAB'], oab: sc['OAB'] };
  });
  ok(bl2.miss.length === 0, '열여섯 칸 어느 쪽으로 물어도 궁합 글과 점수가 나온다' +
     (bl2.miss.length ? ' — 빈 곳: ' + bl2.miss.slice(0, 4).join(', ') : ''));
  ok(bl2.ab === 74 && bl2.oab === 68, 'AB형이 섞인 조합도 제 점수로 나온다 (B-AB ' + bl2.ab + ' · O-AB ' + bl2.oab + ')');
  ok(bl2.bad.length === 0, '네 혈액형 모두 인생·일·돈·사랑·건강·스트레스·숙제·대하는 법이 채워진다');
  ok(bl2.roles, '윗사람·아랫사람·동료일 때 혈액형별 대응이 모두 있다');

  const bfit = await page.evaluate(() => {
    S.me.blood = 'O'; S.cl.blood = 'A';
    const f = fitCalc(S.me, S.cl);
    S.tab = 'blood'; draw();
    const t = document.getElementById('view').textContent;
    return { blood: f.bloodScore, score: f.score, saju: f.sajuScore, mbti: f.mbtiScore,
      matrix: /혈액형 궁합 한눈에/.test(t), deep: /A형은 이렇게 삽니다/.test(t) };
  });
  ok(bfit.blood === 72, '궁합에 혈액형 점수가 들어간다 (O-A ' + bfit.blood + '점)');
  ok(bfit.score === Math.round((bfit.saju + bfit.mbti + bfit.blood) / 3),
     '종합 점수는 사주 · 성향 · 혈액형 셋의 평균이다 (' + bfit.score + ')');
  ok(bfit.matrix && bfit.deep, '혈액형 탭에 4×4 궁합표와 인생 성향표가 나온다');
  ok(bl.nick && !!bl.fit, 'A형 화면과 O형과의 조합 문구가 나온다');
  ok(bl.warn, '혈액형은 과학적 근거가 없다는 안내가 설계사 화면에 붙어 있다');
  ok(bl.tabIn && bl.bloodMode.indexOf('blood') >= 0, '혈액형을 넣으면 통합 모드에도 탭이 생기고, 혈액형 전용 모드도 있다');

  const risk = await page.evaluate(() => {
    S.tab = 'risk'; draw();
    const rows = riskScan(S.cl, S.me);
    const t = document.getElementById('view').textContent;
    return { n: rows.length, areas: rows.map(r => r.area), full: rows.every(r => r.sig && r.why && r.todo && r.lv),
      onlyMine: /나만 보는 화면/.test(t), rule: /가입 권유의 근거로 쓰지 않습니다/.test(t),
      med: /진단처럼/.test(t) };
  });
  ok(risk.n >= 3 && risk.full, '리스크가 신호·이유·할 일까지 채워져 나온다 (' + risk.n + '건: ' + risk.areas.join(', ') + ')');
  ok(risk.onlyMine && risk.rule && risk.med, '나만 보는 화면 표시와 두 가지 금지 원칙이 붙어 있다');

  const view = await page.evaluate(() => {
    const agent = tabsFor('both', 'agent'), client = tabsFor('both', 'client');
    setView('client');
    const shown = Array.prototype.map.call(document.querySelectorAll('.tabs button'), b => b.textContent);
    const re = /(리스크 진단|거절이 오는 자리|닫히는 순간|민원|불완전판매|중도 이탈|이대로 하면|하면 안 되는 말|이렇게 바꿔라|피할 것|클로징|나만 보는|설계사 전용|고객에게 (말씀|보여))/;
    let leak = '';
    tabsFor(S.mode, 'client').forEach(t => {
      goTab(t);
      const m = document.getElementById('view').textContent.match(re);
      if (m && !leak) leak = t + ': ' + m[0];
    });
    goTab('ice');
    const iceTxt = document.getElementById('view').textContent;
    const meHidden = document.getElementById('meBtn').style.display === 'none';
    const riskBlocked = (function () { S.tab = 'risk'; const h = viewBoard(); S.tab = 'ice'; return /설계사 전용입니다/.test(h); })();
    setView('agent');
    return { agent: agent.length, client: client.length, shown: shown.length, leak: leak,
      bless: /덕담|🌾/.test(iceTxt), noScript: !/포문|하면 안 되는 말/.test(iceTxt),
      meHidden: meHidden, riskBlocked: riskBlocked };
  });
  ok(view.agent === 17 && view.client === 9, '내 눈용 ' + view.agent + '탭 · 고객 화면 ' + view.client + '탭으로 갈린다');
  ok(view.leak === '', '고객 화면에 설계사용 문구가 하나도 새어 나가지 않는다' + (view.leak ? ' — ' + view.leak : ''));
  ok(view.bless && view.noScript, '고객 화면 아이스브레이킹에는 덕담만 남고 화법 대본은 빠진다');
  ok(view.meHidden, '고객 화면에서는 내 카드 버튼도 감춘다');
  ok(view.riskBlocked, '고객 화면에서 리스크 탭을 강제로 열어도 막힌다');

  console.log('\n고민 상담 · 유료화');
  const wr = await page.evaluate(() => {
    S.view = 'agent'; S.worry = {}; S.tab = 'worry'; draw();
    const guess = worryGuess('지금 회사를 계속 다녀야 할지 모르겠습니다. 인정받는 느낌이 없어요.');
    const bad = [];
    WORRY_CATS.forEach(c => {
      const o = worrySolve(S.cl, c.k, '');
      if (!o.one || !o.now || !o.sajuWhy || o.dos.length < 3 || o.donts.length < 2 || !o.bless) bad.push(c.k);
    });
    return { cats: WORRY_CATS.length, guess: guess, bad: bad };
  });
  ok(wr.cats === 10, '고민 종류가 열 가지다 (' + wr.cats + ')');
  ok(wr.guess === 'job', '적어주신 글에서 고민 종류를 알아서 고른다 (' + wr.guess + ')');
  ok(wr.bad.length === 0, '열 가지 모두 진단 · 근거 · 할 것 3 · 하지 말 것 2 · 덕담이 채워진다' +
     (wr.bad.length ? ' — 빈 곳: ' + wr.bad.join(',') : ''));

  const wAgent = await page.evaluate(() => {
    setWorryCat('job'); S.worry.txt = '3년째 인정받는 느낌이 없어요'; worryStart();
    const t = document.getElementById('view').textContent;
    return { paid: isPaid(), full: /이번 달에 이 세 가지만/.test(t), lock: /결제하고 전부 보기/.test(t) };
  });
  ok(wAgent.paid && wAgent.full && !wAgent.lock, '내 눈용에서는 결제 없이 전부 열린다 (설계사 도구는 무료)');

  const wClient = await page.evaluate(() => {
    setView('client'); goTab('worry');
    const t = document.getElementById('view').textContent;
    payOpen();
    const sh = document.getElementById('sheetBody').textContent;
    sheetClose();
    return { lock: /결제하고 전부 보기/.test(t), price: /1,900원/.test(t),
      preview: /🌾/.test(t), full: /이번 달에 이 세 가지만/.test(t),
      bank: /계좌이체/.test(sh), code: /확인 코드/.test(sh) };
  });
  ok(wClient.lock && wClient.price && !wClient.full, '고객 화면에서는 요약까지만 보이고 나머지는 잠긴다');
  ok(wClient.preview, '잠겨 있어도 덕담과 진단 한 줄은 무료로 보인다');
  ok(wClient.bank && wClient.code, '결제창에 연결된 수단과 확인 코드 열기가 나온다');

  const wOpen = await page.evaluate(() => {
    unlockAsk(); document.getElementById('ucode').value = 'apex48'; unlockGo();
    const t = document.getElementById('view').textContent;
    const wrong = (function () {
      try { localStorage.removeItem('worry_paid'); } catch (e) {}
      unlockAsk(); document.getElementById('ucode').value = 'zzz'; unlockGo();
      const bad = isPaid();
      unlockAsk(); document.getElementById('ucode').value = 'APEX48'; unlockGo();
      return bad;
    })();
    return { paid: isPaid(), full: /이번 달에 이 세 가지만/.test(t), when: /언제 움직이면/.test(t), wrong: wrong };
  });
  ok(wOpen.paid && wOpen.full && wOpen.when, '확인 코드를 넣으면 전부 열린다');
  ok(wOpen.wrong === false, '틀린 코드로는 열리지 않는다');
  await page.evaluate(() => { setView('agent'); });

  const payCfg = await page.evaluate(() => ({ agent: PAY.agent, price: PAY.price, bank: PAY.bank, url: PAY.confirmUrl }));
  ok(payCfg.agent === '윤시현' && payCfg.bank === '국민' && payCfg.price === 1900,
     '주소 뒤에 붙인 설계사·계좌가 결제에 들어가고, 값은 기본 1,900원이다');
  ok(payCfg.url === '/api/toss-confirm', '카드 승인은 같은 사이트의 서버 함수로 간다');

  console.log('\n관계 · 매니지먼트');
  const rel = await page.evaluate(() => {
    S.view = 'agent'; S.tab = 'rel'; draw();
    const out = {};
    ROLES.forEach(r => {
      S.cl.rel = r.k;
      const p = relPlan(S.me, S.cl, r.k);
      goTab('rel');
      const t = document.getElementById('view').textContent;
      out[r.k] = { rows: p.rows.length, table: p.table.filter(x => x[1]).length,
        tip: p.rows.every(x => !!x.tip), saju: !!p.saju,
        learn: /이분에게서 무엇을 배울까/.test(t), grow: /이 팀원을 키우려면/.test(t) };
    });
    S.cl.rel = 'client'; draw();
    return { roles: ROLES.length, out: out };
  });
  ok(rel.roles === 5, '관계가 다섯 가지다 — 고객 · 리더 · 상사 · 팀원 · 동료 (' + rel.roles + ')');
  ok(Object.keys(rel.out).every(k => rel.out[k].rows === 4 && rel.out[k].table >= 4 && rel.out[k].tip),
     '관계마다 네 축 대응과 실전 표가 모두 채워진다');
  ok(rel.out.leader.learn && rel.out.boss.learn && !rel.out.staff.learn,
     '윗사람일 때만 "무엇을 배울까"가 붙는다');
  ok(rel.out.staff.grow && !rel.out.leader.grow,
     '아랫사람일 때만 "키우는 법 · 맡길 것"이 붙는다');
  ok(Object.keys(rel.out).every(k => rel.out[k].saju), '관계마다 사주 일간 관계 해석이 붙는다');

  const relPick = await page.evaluate(() => {
    S.step = 'client'; draw();
    const has = /이분은 누구신가요/.test(document.getElementById('view').textContent);
    S.step = 'board'; draw();
    return has;
  });
  ok(relPick, '고객 정보 화면에서 관계를 고를 수 있다');

  const price = await page.evaluate(() => {
    S.view = 'client'; S.worry = { cat: 'money', catName: '돈', done: true }; S.tab = 'worry';
    try { localStorage.removeItem('worry_paid'); } catch (e) {}
    draw();
    const t = document.getElementById('view').textContent;
    S.view = 'agent'; draw();
    return { price: PAY.price, shown: /1,900원/.test(t), old: /9,900원/.test(t) };
  });
  ok(price.price === 1900 && price.shown && !price.old, '고민 상담 값이 1,900원으로 나온다 (' + price.price + ')');

  console.log('\n신당(점집) 풀이');
  const shrine = await page.evaluate(() => {
    S.view = 'agent'; S.tab = 'dang'; S.dang = {}; draw();
    const t = document.getElementById('view').textContent;
    const y = yongsin(S.cl.saju);
    const skin = document.body.classList.contains('shrine-on');
    S.tab = 'ice'; draw();
    const off = !document.body.classList.contains('shrine-on');
    S.tab = 'dang'; draw();
    return { len: t.replace(/\s+/g, '').length, skin: skin, off: off,
      who: /무당/.test(t), yong: /용신/.test(t),
      primary: y.primary, need: y.need, avoid: y.avoid, lvl: y.st.level,
      needHasPrimary: y.need.indexOf(y.primary) >= 0,
      noOverlap: y.need.every(k => y.avoid.indexOf(k) < 0),
      han: /[木火土金水]/.test(t),
      dir: /방향은/.test(t), people: /살리는 사람/.test(t),
      gong: /공망/.test(t), daeun: /대운/.test(t),
      flowWarn: /운은 흐름이지 정해진 답이 아닙니다/.test(t),
      pick: document.querySelectorAll('.wpick button').length,
      noPay: !/결제하고|1,900원|구독/.test(t) };
  });
  ok(shrine.len > 1500, '신당 풀이가 길게 나온다 (' + shrine.len + '자)');
  ok(shrine.who && shrine.yong, '윤시현 무당이 말하는 형식이고, 핵심으로 용신을 짚는다');
  ok(shrine.needHasPrimary && shrine.noOverlap,
     '용신이 제대로 잡힌다 — ' + shrine.lvl + ' → 필요 ' + shrine.need.join('·') +
     ' / 과함 ' + (shrine.avoid.join('·') || '없음') + ' (겹치지 않음)');
  ok(shrine.han && shrine.dir && shrine.people,
     '부적 한 글자 · 방향·시간·색 · 나를 살리는 사람까지 나온다');
  ok(shrine.gong && shrine.daeun, '공망과 대운까지 풀어 준다');
  ok(shrine.flowWarn, '"운은 흐름이지 정해진 답이 아니다"를 못 박는다');
  ok(shrine.pick === 10, '고민 열 가지를 고를 수 있다 (' + shrine.pick + ')');
  ok(shrine.skin && shrine.off, '신당 탭에서만 화면이 점집으로 바뀌고, 나가면 되돌아온다');
  ok(shrine.noPay, '신당에서는 결제를 걸지 않는다');

  const bridge = await page.evaluate(() => {
    const out = {};
    WORRY_CATS.forEach(c => { out[c.k] = !!(APEX_PATH[c.k] && APEX_PATH[c.k].steps.length === 3); });
    S.tab = 'dang'; setDangCat('health');
    const t = document.getElementById('view').textContent;
    const hit = /운이 나쁘|운세가|액운|부정 타|살을 풀|굿을/.test(t);
    setDangCat('money');
    const t2 = document.getElementById('view').textContent;
    const hit2 = /운이 나쁘|운세가|액운|부정 타|살을 풀|굿을/.test(t2);
    setDangCat('money');
    return { all: Object.keys(out).every(k => out[k]), n: Object.keys(out).length,
      apex: /온탑본부에서 할 수 있는 것/.test(t),
      ground: /여기서부터는/.test(t) && /법으로도 금지/.test(t),
      treat: /치료비 통장/.test(t), money8: /여덟 칸/.test(t2),
      fear: hit || hit2 };
  });
  const raw = await page.evaluate(() => {
    const bad = [];
    S.tab = 'dang';
    WORRY_CATS.forEach(c => {
      S.dang = { cat: c.k }; draw();
      const t = document.getElementById('view').textContent;
      if (/<\/?b>|<br>|&lt;b&gt;/.test(t)) bad.push(c.k);
    });
    S.dang = {}; draw();
    return bad;
  });
  ok(raw.length === 0, '신당 풀이에 HTML 태그가 글자로 새지 않는다' + (raw.length ? ' — ' + raw.join(',') : ''));

  ok(bridge.all && bridge.n === 10, '고민 열 가지 모두 온탑본부에서 할 일이 세 걸음으로 준비돼 있다');
  ok(bridge.apex && bridge.treat && bridge.money8, '고민별로 실제 하는 일이 달라진다 (건강→치료비 통장, 돈→여덟 칸)');
  ok(bridge.ground, '"여기서부터는 점이 아니다"라고 선을 긋고, 불안 조장이 금지라고 밝힌다');
  ok(!bridge.fear, '운이 나쁘다는 식의 겁주는 표현을 쓰지 않는다');

  console.log('\n브랜드 · 영업 가능성 · 나의 영업법');
  const brand = await page.evaluate(() => {
    renderBrand();
    const bx = document.getElementById('brandBox').innerHTML;
    BRAND.aplus = 'https://example.com/a.png';
    BRAND.ontop = 'javascript:alert(1)';
    const withImg = brandMarks();
    BRAND.aplus = ''; BRAND.ontop = ''; renderBrand();
    return { marks: bx, org: /에이플러스에셋/.test(brandMarks()), hq: /온탑본부/.test(brandMarks()),
      img: /<img src="https:\/\/example\.com\/a\.png"/.test(withImg),
      blocked: !/javascript:/.test(withImg),
      band: /bband/.test(brandBand('x')) && /에이플러스에셋 온탑본부/.test(brandBand('x')) };
  });
  ok(brand.org && brand.hq, '헤더와 리포트에 에이플러스에셋 · 온탑본부가 함께 들어간다');
  ok(/bmk/.test(brand.marks), '로고 파일이 없어도 마크가 그려진다(외부 요청 없음)');
  ok(brand.img, '로고 주소를 넣으면 그 이미지로 바뀐다 (?logo1= / ?logo2=)');
  ok(brand.blocked, 'javascript: 같은 위험한 로고 주소는 걸러낸다');
  ok(brand.band, '리포트 머리에 브랜드 밴드가 붙는다');

  const sales = await page.evaluate(() => {
    S.view = 'agent'; S.tab = 'sales'; draw();
    const sc = salesCalc(S.cl), ch = salesChannels(sc), cv = salesCurve(sc);
    const t = document.getElementById('view').textContent;
    const vals = SALES_AX.map(a => sc.v[a.k]);
    const wsum = SALES_AX.reduce((x, a) => x + a.w, 0);
    return { n: SALES_AX.length, vals: vals,
      inRange: vals.every(v => v >= 6 && v <= 97),
      wsum: Math.round(wsum * 100) / 100,
      total: sc.total, totalOk: sc.total >= 6 && sc.total <= 97,
      why: SALES_AX.every(a => sc.why[a.k].length > 0),
      chn: ch.length, chnSorted: ch.every((c, i) => i === 0 || ch[i - 1].p >= c.p),
      chnRange: ch.every(c => c.p >= 8 && c.p <= 97),
      curve: !!(cv.t && cv.m3 && cv.m6 && cv.y1 && cv.note),
      risk: salesRisk(sc, S.cl).every(r => r.t && r.d && r.fix),
      noReject: !/탈락|불합격|부적격|채용 불가/.test(t),
      guard: /될 사람과 안 될 사람을 가르는 숫자가 아닙니다/.test(t),
      leader: /리더용/.test(t), axesShown: SALES_AX.every(a => t.indexOf(a.n) >= 0) };
  });
  ok(sales.n === 5 && sales.axesShown, '영업 가능성이 다섯 축으로 나온다 — 개척·신뢰·설명·클로징·지속');
  ok(sales.inRange && sales.totalOk, '다섯 축과 종합 점수가 모두 범위 안이다 (' + sales.vals.join('/') + ' → ' + sales.total + ')');
  ok(sales.wsum === 1, '다섯 축 가중치 합이 정확히 1이다 (' + sales.wsum + ')');
  ok(sales.why, '점수마다 "왜 이렇게 나왔는가" 근거가 붙는다');
  ok(sales.chn === 6 && sales.chnSorted && sales.chnRange, '적합 채널 6개가 점수순으로 정렬돼 나온다');
  ok(sales.curve, '3개월·6개월·1년 성장 곡선과 관리 포인트가 나온다');
  ok(sales.risk, '이탈 위험이 증상·처방까지 채워져 나온다');
  ok(sales.guard && sales.noReject, '"당락을 가르는 점수가 아니다"라고 못 박고, 탈락·부적격 같은 말은 쓰지 않는다');
  ok(sales.leader, '리더용 칸(이탈 위험·관리 처방)이 들어 있다');

  const how = await page.evaluate(() => {
    S.tab = 'how'; draw();
    const t = document.getElementById('view').textContent;
    const code = personCode(S.cl);
    const axes = code.split('').every(c => !!SELL_AX[c]);
    const rt = sellRoutine(salesCalc(S.cl));
    return { axes: axes, four: Object.keys(SELL_AX).length,
      mix: /말의 배합/.test(t) && /숫자/.test(t) && /마음/.test(t),
      routine: rt.nw > 0 && rt.mt > 0 && rt.pr > 0 && !!rt.note,
      routineShown: /신규 접촉/.test(t) && /면담 약속/.test(t),
      reject: /거절을 들었을 때/.test(t), close: /맞는 클로징/.test(t),
      cust: /편한 고객/.test(t) && /어려운 고객/.test(t),
      saju: !S.cl.saju || /나를 움직이는 힘/.test(t),
      coach: /이 사람을 어떻게 가르칠까/.test(t),
      mistakes: /가장 자주 하는 실수/.test(t) };
  });
  ok(how.four === 8 && how.axes, '여덟 축(E·I·S·N·T·F·J·P) 모두 영업법이 채워져 있다');
  ok(how.mix, '숫자와 마음의 배합 비율이 나온다');
  ok(how.routine && how.routineShown, '하루 활동량(신규접촉·면담·제안)이 숫자로 나온다');
  ok(how.reject && how.close && how.mistakes, '거절 대응 · 맞는 클로징 · 자주 하는 실수가 함께 나온다');
  ok(how.cust, '나와 맞는 고객과 어려운 고객이 갈려 나온다');
  ok(how.saju, '사주가 있으면 "나를 움직이는 힘"까지 붙는다');
  ok(how.coach, '리더용 "어떻게 가르칠까"가 붙는다');

  const hidden = await page.evaluate(() => {
    setView('client');
    const cl = tabsFor(S.mode, 'client');
    const sBlocked = (function () { S.tab = 'sales'; const h = viewBoard(); S.tab = 'ice'; return h; })();
    const hBlocked = (function () { S.tab = 'how'; const h = viewBoard(); S.tab = 'ice'; return h; })();
    setView('agent');
    return { noSales: cl.indexOf('sales') < 0, noHow: cl.indexOf('how') < 0,
      sBlocked: /설계사 전용입니다/.test(sBlocked), hBlocked: /설계사 전용입니다/.test(hBlocked) };
  });
  ok(hidden.noSales && hidden.noHow, '영업 가능성과 나의 영업법은 고객 화면에 나오지 않는다');
  ok(hidden.sBlocked && hidden.hBlocked, '고객 화면에서 강제로 열어도 막힌다');

  console.log('\n손님용 링크 — 내 것은 내 눈에만');
  const glink = await page.evaluate(() => {
    const u = guestLink();
    return { u: u, forClient: /[?&]for=client/.test(u), mode: /[?&]mode=/.test(u),
      org: /[?&]org=/.test(u), card: /손님에게 보낼 링크/.test(shareCard()),
      hidden: shareCard().length > 0 };
  });
  ok(glink.forClient && glink.mode && glink.org, '손님 링크에 손님 표시·방식·상호가 담긴다');
  ok(glink.card, '내 카드 화면에 손님 링크 카드가 붙는다');

  const g = await ctx.newPage();
  await g.goto('http://127.0.0.1:' + PORT + '/app/saju-mbti.html?for=client&mode=both&agent=%EC%9C%A4%EC%8B%9C%ED%98%84',
    { waitUntil: 'domcontentloaded' });
  await g.waitForTimeout(700);
  const cover = await g.evaluate(() => ({
    on: GUEST.on, step: S.step, view: S.view,
    key: storeKey(),
    skin: document.body.classList.contains('shrine-on'),
    txt: document.getElementById('view').textContent.replace(/\s+/g, '').length,
    brand: /에이플러스에셋/.test(document.getElementById('view').textContent),
    noMe: document.getElementById('meBtn').style.display === 'none',
    noView: document.getElementById('viewBtn').style.display === 'none',
    steps: Array.prototype.map.call(document.querySelectorAll('.tabs button'), b => b.textContent),
    share: shareCard()
  }));
  ok(cover.on && cover.step === 'cover', '손님 링크로 열면 대문부터 뜬다 (설계사 준비 화면이 아니다)');
  ok(cover.skin && cover.brand && cover.txt > 250, '대문이 점집 화면이고 상호가 박혀 있다 (' + cover.txt + '자)');
  ok(cover.noMe && cover.noView, '손님 화면에는 내 카드 버튼도, 내 눈용 버튼도 없다');
  ok(cover.steps.join('|').indexOf('내 카드') < 0 && cover.steps.join('|').indexOf('대문') >= 0,
     '단계가 손님용으로 바뀐다 — ' + cover.steps.join(' / '));
  ok(cover.key === 'sajumbti_son', '손님 자료는 다른 칸에 저장한다 (내 카드와 안 섞인다)');
  ok(cover.share === '', '손님 화면에는 공유 카드도 안 나온다');

  const lock = await g.evaluate(() => {
    setView('agent');                       // 눌러서 넘어오려는 시도
    const v1 = S.view;
    goStep('me');                           // 내 카드로 가려는 시도
    const s1 = S.step;
    const agentTabs = tabsFor(S.mode, S.view).filter(t => AGENT_TABS[t]);
    const blocked = ['risk', 'sales', 'how', 'fit', 'rel', 'talk', 'ins'].every(t => {
      S.tab = t; const h = viewBoard(); return /설계사 전용입니다/.test(h) || h === '';
    });
    S.tab = 'ice';
    return { v1: v1, s1: s1, nAgent: agentTabs.length, blocked: blocked };
  });
  ok(lock.v1 === 'client', '내 눈용으로 바꾸려 해도 손님 화면에 잠겨 있다');
  ok(lock.s1 !== 'me', '내 카드 화면으로 넘어갈 수 없다');
  ok(lock.nAgent === 0, '손님 탭 목록에 내 눈용 칸이 하나도 없다');
  ok(lock.blocked, '주소로 강제로 열어도 내 눈용 칸은 전부 막힌다');

  const gflow = await g.evaluate(() => {
    goStep('client');
    const p = S.cl;
    p.name = '손님'; p.gender = '남'; p.y = 1990; p.m = 5; p.d = 15; p.H = 9; p.Mi = 30;
    calcPerson(p); p.mbti = 'ISFJ'; p.blood = 'A';
    S.step = 'board'; S.tab = 'dang'; draw();
    const t = document.getElementById('view').textContent;
    return { len: t.replace(/\s+/g, '').length, dang: /앉으시지요/.test(t),
      tabs: tabsFor(S.mode, S.view).length,
      sub: document.getElementById('topSub').textContent };
  });
  ok(gflow.dang && gflow.len > 1500, '손님이 직접 넣고 신당 풀이까지 받는다 (' + gflow.len + '자)');
  ok(gflow.tabs === 9, '손님이 보는 칸은 9개다 (' + gflow.tabs + ')');
  ok(gflow.sub.indexOf('고객 화면') < 0, '손님에게 "고객 화면"이라는 꼬리표를 보이지 않는다');
  const words = await g.evaluate(() => {
    goStep('client');
    const t = document.getElementById('view').textContent;
    const ttl = document.getElementById('topTtl').textContent;
    return { noCustomer: !/고객 정보|고객 유형/.test(t), ttl: ttl,
      mine: /내 정보/.test(t), noMode: !/무엇으로 볼까요/.test(t) };
  });
  ok(words.noCustomer && words.mine, '손님 화면에서는 "고객"이 아니라 "내 정보"로 말한다');
  ok(words.ttl.indexOf('상담카드') < 0, '머리말도 손님용으로 바뀐다 — ' + words.ttl);
  ok(words.noMode, '방식 고르기는 감춘다 (링크에 이미 담겨 있다)');
  await g.close();

  console.log('\n채용 1단계 — 후보 제출');
  /* 앞 시험에서 쌓인 저장값이 넘어오지 않도록 새 칸에서 연다 —
     한 번 왔던 후보는 대문을 건너뛰고 보던 자리로 가는 게 맞다. */
  const rctx = await browser.newContext({ viewport: { width: 1180, height: 1000 } });
  const rc = await rctx.newPage();
  let posted = null;
  await rc.route('**/api/recruit-submit', async route => {
    posted = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, id: 'test-id-1' }) });
  });
  await rc.goto('http://127.0.0.1:' + PORT +
    '/app/saju-mbti.html?for=client&recruit=1&mode=both&rec=11111111-2222-3333-4444-555555555555&agent=%EC%9C%A4%EC%8B%9C%ED%98%84',
    { waitUntil: 'domcontentloaded' });
  await rc.waitForTimeout(700);
  const rset = await rc.evaluate(() => ({
    on: RECRUIT.on, guest: GUEST.on, rec: RECRUIT.rec,
    cover: /상담 신청/.test(document.getElementById('view').textContent),
    tabs: tabsFor('both', 'client')
  }));
  ok(rset.on && rset.guest, '채용 링크는 언제나 손님 화면으로 열린다');
  ok(rset.tabs[rset.tabs.length - 1] === 'apply', '맨 끝에 상담 신청 칸이 붙는다');
  ok(rset.cover, '대문에서 미리 "끝에 신청 칸이 있다"고 알려 준다');

  const need = await rc.evaluate(() => {
    const p = S.cl;
    p.name = '김후보'; p.gender = '남'; p.y = 1994; p.m = 8; p.d = 3; p.H = 14; p.Mi = 0;
    calcPerson(p); p.mbti = 'ENFP'; p.blood = 'O';
    S.step = 'board'; S.tab = 'apply'; draw();
    const before = RECRUIT.sent;
    applySubmit();                                  // 동의 없이 눌러 본다
    return { before: before, sent: RECRUIT.sent };
  });
  ok(!need.sent, '동의 없이 누르면 보내지 않는다');

  await rc.evaluate(() => {
    document.getElementById('apPhone').value = '01022223333';
    document.getElementById('apTime').value = '평일 저녁 7시 이후';
    document.getElementById('apMemo').value = '설명 듣고 싶습니다';
    setApply('intent', 'now');
    setApply('agree', true);
  });
  await rc.waitForTimeout(150);
  await rc.evaluate(() => applySubmit());
  await rc.waitForTimeout(500);
  ok(!!posted, '신청을 누르면 서버 함수로 보낸다');
  if (posted) {
    ok(posted.consent === true && posted.name === '김후보' && posted.phone === '01022223333',
       '동의·이름·연락처가 담겨 간다');
    ok(posted.recruiterId === '11111111-2222-3333-4444-555555555555' && posted.intent === 'now',
       '담당자 배정과 본인이 밝힌 의향이 담겨 간다');
    ok(posted.mbti === 'ENFP' && !!posted.dayGz && posted.blood === 'O',
       '검사 결과(유형·일주·혈액형)가 함께 간다 — ' + posted.mbti + ' · ' + posted.dayGz);
    ok(typeof posted.elapsedSec === 'number' && posted.stage === undefined,
       '행동 신호는 보내고, 단계(stage)는 보내지 않는다 (담당자가 옮긴 단계를 서버가 되돌리지 않는다)');
  }
  const after = await rc.evaluate(() => {
    const t = document.getElementById('view').textContent;
    return { done: /잘 받았습니다/.test(t), keep: /6개월 뒤 자동으로 지워집니다/.test(t) };
  });
  ok(after.done, '보내고 나면 받았다는 화면으로 바뀐다');
  ok(after.keep, '보관 기간을 후보에게 알려 준다');

  const noReject = await rc.evaluate(() => {
    const bad = [];
    tabsFor(S.mode, 'client').forEach(t => {
      S.tab = t; draw();
      if (/합격|불합격|탈락|부적격|적합도 점수/.test(document.getElementById('view').textContent)) bad.push(t);
    });
    return bad;
  });
  ok(noReject.length === 0, '후보 화면 어디에도 합격·탈락 같은 말이 없다' + (noReject.length ? ' — ' + noReject.join(',') : ''));
  await rc.close(); await rctx.close();

  console.log('\n채용 2단계 — 우선순위 · Top 10 · 면담 브리프');
  const lead = await ctx.newPage();
  await lead.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await lead.waitForTimeout(1200);
  const D = n => new Date(Date.now() - n * 86400000).toISOString();
  const sc = await lead.evaluate(d => {
    const mk = o => Object.assign({ id: 'x', name: '', phone: '01000000000', contact_time: '', stage: 'new',
      intent: 'maybe', finished: true, elapsed_sec: 400, consistency: 85, mbti: '', day_gz: '', blood: '',
      memo: '', owner_note: '', created_at: d[0] }, o);
    const best = rqScore(mk({ intent: 'now', contact_time: '저녁', memo: '궁금합니다' })).score;
    const worst = rqScore(mk({ intent: 'no', finished: false, elapsed_sec: 20, consistency: 30, created_at: d[1] })).score;
    const mid = rqScore(mk({ intent: 'soon', contact_time: '아무때나' })).score;
    /* 성향·사주·혈액형이 점수에 끼어드는지 — 그 값만 바꿔 보고 같은지 본다 */
    const a = rqScore(mk({ mbti: 'ENFP', blood: 'O', day_gz: '갑자' })).score;
    const b = rqScore(mk({ mbti: 'ISTJ', blood: 'AB', day_gz: '계해' })).score;
    /* 방치된 건이 위로 올라오는지 */
    const fresh = rqScore(mk({ created_at: d[0] }));
    const stale = rqScore(mk({ created_at: d[2] }));
    return { best: best, worst: worst, mid: mid, same: a === b,
      warn: stale.warn, staleUp: stale.score, freshUp: fresh.score,
      why: rqScore(mk({ intent: 'now' })).why.length };
  }, [D(0.2), D(9), D(5)]);
  ok(sc.best > sc.mid && sc.mid > sc.worst,
     '우선순위가 변별된다 — 좋은 신호 ' + sc.best + ' > 보통 ' + sc.mid + ' > 약함 ' + sc.worst);
  ok(sc.best <= 100 && sc.best >= 85 && sc.worst >= 0 && sc.worst < 40,
     '점수가 100 에 몰리지도, 바닥에 깔리지도 않는다 (' + sc.worst + '~' + sc.best + ')');
  ok(sc.same, '성향·사주·혈액형은 우선순위에 1점도 들어가지 않는다');
  ok(/일째 연락 안 함/.test(sc.warn || ''), '사흘 넘게 방치된 건에 경고가 붙는다 — ' + sc.warn);
  ok(sc.why >= 3, '점수마다 그렇게 나온 이유가 함께 나온다 (' + sc.why + '개)');

  const top = await lead.evaluate(d => {
    OS.profile = { id: '11111111-2222-3333-4444-555555555555', name: '윤시현', role: 'admin' };
    document.getElementById('dynPane').innerHTML = renderRecruit();
    RQ.loaded = true;
    RQ.rows = [
      { id: 'a1', name: '김후보', phone: '01022223333', contact_time: '저녁', stage: 'new', intent: 'now',
        finished: true, elapsed_sec: 412, consistency: 88, mbti: 'ENFP', day_gz: '신유', blood: 'O',
        memo: '설명 듣고 싶습니다', owner_note: '', birth_y: 1994, birth_m: 8, birth_d: 3, birth_h: 14, created_at: d[0] },
      { id: 'a2', name: '이서연', phone: '01077778888', contact_time: '', stage: 'new', intent: 'no',
        finished: false, elapsed_sec: 48, consistency: 0, mbti: '', day_gz: '계축', blood: 'B',
        memo: '', owner_note: '', birth_y: 1999, birth_m: 11, birth_d: 30, birth_h: null, created_at: d[1] },
      { id: 'a3', name: '최민호', phone: '01033334444', contact_time: '아무때나', stage: 'joined', intent: 'soon',
        finished: true, elapsed_sec: 600, consistency: 91, mbti: 'ESTJ', day_gz: '병인', blood: 'A',
        memo: '', owner_note: '', birth_y: 1991, birth_m: 6, birth_d: 9, birth_h: 20, created_at: d[1] }
    ];
    rqPaint();
    const names = rqTop(10).map(x => x.r.name);
    RQ.sort = 'score'; rqPaint();
    const first = (document.querySelector('#rqList b') || {}).textContent;
    return { names: names, first: first, topHtml: document.getElementById('rqTop').innerHTML };
  }, [D(0.2), D(1)]);
  ok(top.names.indexOf('김후보') >= 0, 'Top 10 에 신호가 뚜렷한 후보가 오른다');
  ok(top.names.indexOf('이서연') < 0, '점수가 낮은 후보는 "오늘 연락할 사람"에 올리지 않는다');
  ok(top.names.indexOf('최민호') < 0, '이미 입사한 사람은 연락 목록에서 빠진다');
  ok(top.first === '김후보', '대기열도 우선순위순으로 선다 (' + top.first + ')');
  ok(/브리프/.test(top.topHtml), 'Top 10 에서 바로 브리프를 열 수 있다');

  const handoff = await lead.evaluate(() => {
    localStorage.removeItem('apex_brief_cand');
    const open = window.open; let url = '';
    window.open = u => { url = u; return null; };
    rqBrief('a1');
    window.open = open;
    let o = null; try { o = JSON.parse(localStorage.getItem('apex_brief_cand') || 'null'); } catch (e) {}
    return { url: url, o: o };
  });
  ok(/brief=1/.test(handoff.url) && !/[?&](name|phone)=/.test(handoff.url),
     '브리프는 주소에 개인정보를 싣지 않고 넘긴다');
  ok(handoff.o && handoff.o.name === '김후보' && handoff.o.y === 1994 && handoff.o.mbti === 'ENFP',
     '브리프로 넘기는 값에 생년월일·유형이 들어 있다');
  await lead.close();

  const bctx = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
  const bp = await bctx.newPage();
  await bp.goto('http://127.0.0.1:' + PORT + '/app/saju-mbti.html', { waitUntil: 'domcontentloaded' });
  await bp.waitForTimeout(500);
  await bp.evaluate(o => {
    const me = blank(); me.name = '윤시현'; me.gender = '남'; me.y = 1985; me.m = 3; me.d = 12; me.H = 10;
    me.mbti = 'ENFJ'; me.blood = 'O'; calcPerson(me);
    localStorage.setItem('sajumbti', JSON.stringify({ me: me, cl: blank(), ans: {}, i: 0, step: 'me',
      tab: 'ice', mode: 'both', view: 'agent', worry: {} }));
    localStorage.setItem('apex_brief_cand', JSON.stringify(o));
  }, { name: '김후보', gender: '남', y: 1994, m: 8, d: 3, H: 14, noTime: false, mbti: 'ENFP', blood: 'O',
       phone: '01022223333', contactTime: '평일 저녁 7시 이후', memo: '설명 듣고 싶습니다', intent: 'now',
       when: '11-18 10:21', finished: true, elapsedSec: 412, consistency: 88, stage: 'new' });
  await bp.goto('http://127.0.0.1:' + PORT + '/app/saju-mbti.html?brief=1', { waitUntil: 'domcontentloaded' });
  await bp.waitForTimeout(800);
  const br = await bp.evaluate(() => {
    const t = document.getElementById('view').textContent;
    return { tab: S.tab, key: storeKey(), name: S.cl.name, me: S.me.name,
      len: t.replace(/\s+/g, '').length,
      tel: /010-2222-3333/.test(t), memo: /설명 듣고 싶습니다/.test(t),
      sum: /한 줄 요약/.test(t), open: /첫 3분/.test(t), ask: /물어볼 것/.test(t),
      no: /하지 마세요/.test(t), risk: /흔들리는 자리/.test(t), place: /어디에 붙이고/.test(t),
      fit: /나와의 궁합/.test(t), rule: /뽑고 거르는 문서가 아닙니다/.test(t),
      /* 탭 목록에서 빠지는 것과, 주소로 강제로 열었을 때 막히는 것을 따로 본다 */
      notListed: tabsFor(S.mode, 'client').indexOf('brief') < 0,
      clientBlocked: (function () {
        const v = S.view, t = S.tab;
        S.view = 'client'; S.tab = 'brief';
        const h = viewBoard();
        S.view = v; S.tab = t;
        return /설계사 전용입니다/.test(h);
      })() };
  });
  ok(br.tab === 'brief' && br.name === '김후보' && br.me === '윤시현',
     '브리프로 열면 그 후보가 올라오고 내 카드는 그대로 쓴다');
  ok(br.key === 'sajumbti_brief', '브리프는 저장 칸을 따로 써서 보던 고객 자료를 건드리지 않는다');
  ok(br.tel && br.memo, '연락처는 보기 좋게 끊어 쓰고, 본인이 남긴 말을 그대로 보여준다');
  ok(br.sum && br.open && br.ask && br.no, '한 줄 요약 · 첫 3분 · 물어볼 것 · 하지 말 것이 모두 나온다');
  ok(br.risk && br.place && br.fit, '흔들리는 자리 · 어디에 붙일까 · 나와의 궁합까지 붙는다');
  ok(br.rule, '"뽑고 거르는 문서가 아니다"라고 브리프에도 못 박는다');
  ok(br.notListed && br.clientBlocked, '브리프는 고객 화면 목록에 없고, 강제로 열어도 막힌다');
  ok(br.len > 1000, '브리프가 한 장 분량으로 채워진다 (' + br.len + '자)');
  await bp.close(); await bctx.close();

  console.log('\n채용 3단계 — 묶음 · 문구 · QR · 배정');
  const p3 = await ctx.newPage();
  await p3.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p3.waitForTimeout(1200);
  const D3 = n => new Date(Date.now() - n * 86400000).toISOString();

  /* QR — 규격 표(생성다항식·형식정보)와 대조하고, 내가 그린 격자에서 글자를 되읽는다 */
  const qr = await p3.evaluate(() => {
    const REF = { 7:[0,87,229,146,149,238,102,21],
      10:[0,251,67,46,61,118,70,64,94,32,45],
      26:[0,173,125,158,2,103,182,118,17,145,201,111,28,165,53,161,21,245,142,13,102,48,227,153,145,218,70] };
    let genOk = true;
    Object.keys(REF).forEach(n => {
      const logs = qrGenPoly(+n).map(c => QR_LOG[c]);
      if (JSON.stringify(logs) !== JSON.stringify(REF[n])) genOk = false;
    });
    function maskAt(k, r, c) {
      switch (k) { case 0: return (r + c) % 2 === 0; case 1: return r % 2 === 0; case 2: return c % 3 === 0;
        case 3: return (r + c) % 3 === 0; case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
        case 5: return ((r * c) % 2) + ((r * c) % 3) === 0; case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
        default: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0; }
    }
    /* 격자 → 글자 되읽기 */
    function roundTrip(txt) {
      const q = qrMake(txt); if (!q) return null;
      let bits = [];
      q.place.forEach(rc => { let v = q.grid[rc[0]][rc[1]]; if (maskAt(q.mask, rc[0], rc[1])) v ^= 1; bits.push(v); });
      const words = []; for (let i = 0; i + 8 <= bits.length; i += 8) { let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; words.push(b); }
      const t = QR_M[q.version], nb1 = t[2], short = Math.floor(q.dataWords / q.blocks);
      const lens = []; for (let i = 0; i < q.blocks; i++) lens.push(short + (i >= nb1 ? 1 : 0));
      const blocks = lens.map(l => new Array(l)); let idx = 0, maxLen = Math.max.apply(null, lens);
      for (let i = 0; i < maxLen; i++) for (let j = 0; j < q.blocks; j++) if (i < lens[j]) blocks[j][i] = words[idx++];
      const data = [].concat.apply([], blocks);
      let bs = []; data.forEach(b => { for (let k = 7; k >= 0; k--) bs.push((b >> k) & 1); });
      let p = 0; const take = n => { let v = 0; for (let i = 0; i < n; i++) v = (v << 1) | bs[p++]; return v; };
      if (take(4) !== 4) return { bad: 'mode' };
      const len = take(q.version < 10 ? 8 : 16), out = [];
      for (let i = 0; i < len; i++) out.push(take(8));
      return { text: new TextDecoder().decode(new Uint8Array(out)), q: q };
    }
    const long = 'https://apex.example.com/app/saju-mbti.html?for=client&recruit=1&mode=both&rec=11111111-2222-3333-4444-555555555555&src=seminar';
    const a = roundTrip(long), b = roundTrip('에이플러스에셋 온탑본부');
    const g = a.q.grid, n = a.q.size;
    return { genOk: genOk,
      long: a && a.text === long, kor: b && b.text === '에이플러스에셋 온탑본부',
      size: n === a.q.version * 4 + 17,
      finder: g[0][0] === 1 && g[0][6] === 1 && g[1][1] === 0 && g[3][3] === 1,
      timing: g[6][8] === 1 && g[6][9] === 0, dark: g[n - 8][8] === 1,
      svg: /^<svg[\s\S]*<\/svg>$/.test(qrSvg('x', 120)) && !/https?:\/\//.test(qrSvg('x', 120)),
      ver: a.q.version, mask: a.q.mask };
  });
  ok(qr.genOk, 'QR 생성다항식이 규격 표와 일치한다 (오류정정 코드가 맞다)');
  ok(qr.long && qr.kor, '내가 그린 QR 격자에서 원래 글자가 그대로 되읽힌다 (한글 포함)');
  ok(qr.size && qr.finder && qr.timing && qr.dark,
     'QR 구조가 규격대로다 — 크기 v' + qr.ver + ' · 마스크 ' + qr.mask + ' · 모서리·타이밍·고정칸');
  ok(qr.svg, 'QR은 바깥에서 아무것도 받아오지 않고 직접 그린다');

  const seg = await p3.evaluate(d => {
    OS.profile = { id: 'p1', name: '윤시현', role: 'admin' };
    document.getElementById('dynPane').innerHTML = renderRecruit();
    RQ.loaded = true; RQ.board = false;
    RQ.people = [{ id: 'p1', name: '윤시현' }, { id: 'p2', name: '박팀장' }];
    const base = { phone: '01000000000', contact_time: '저녁', owner_note: '', memo: '', day_gz: '갑자',
      blood: 'O', mbti: 'ENFP', birth_y: 1994, birth_m: 8, birth_d: 3, birth_h: 14, source: 'link', recruiter_id: null };
    RQ.rows = [
      Object.assign({}, base, { id: 'A1', name: '에이', stage: 'new', intent: 'now',   finished: true,  elapsed_sec: 400, consistency: 88, created_at: d[0] }),
      Object.assign({}, base, { id: 'B1', name: '비이', stage: 'new', intent: 'maybe', finished: true,  elapsed_sec: 400, consistency: 55, created_at: d[0], contact_time: '' }),
      Object.assign({}, base, { id: 'C1', name: '씨이', stage: 'new', intent: 'no',    finished: true,  elapsed_sec: 400, consistency: 88, created_at: d[0] }),
      Object.assign({}, base, { id: 'D1', name: '디이', stage: 'new', intent: 'now',   finished: false, elapsed_sec: 30,  consistency: 0,  created_at: d[0] }),
      Object.assign({}, base, { id: 'S1', name: '잠듦', stage: 'new', intent: 'now',   finished: true,  elapsed_sec: 400, consistency: 88, created_at: d[0], next_at: d[1] })
    ];
    rqPaint();
    const segs = {}; RQ.rows.forEach(r => { segs[r.name] = rqSeg(r); });
    const top = rqTop(10).map(x => x.r.name);
    const msgs = {}; ['A1', 'B1', 'C1', 'D1'].forEach(id => { msgs[id] = rqMsg(RQ.rows.filter(r => r.id === id)[0]); });
    return { segs: segs, top: top,
      msgA: msgs.A1, msgD: msgs.D1,
      dLink: /saju-mbti\.html\?for=client&recruit=1/.test(msgs.D1),
      noHype: !/합격|보장|확실|무조건|반드시 성공/.test(Object.keys(msgs).map(k => msgs[k]).join(' ')),
      segCard: /대응 묶음|지금 전화/.test(document.getElementById('rqSeg').textContent),
      assign: /나눠 맡기기/.test(document.getElementById('rqAssign').textContent) };
  }, [D3(0.1), D3(-7)]);
  ok(seg.segs['에이'] === 'A' && seg.segs['비이'] === 'B' && seg.segs['씨이'] === 'C' && seg.segs['디이'] === 'D',
     '네 묶음으로 갈린다 — ' + Object.keys(seg.segs).map(k => k + ':' + seg.segs[k]).join(' '));
  ok(seg.top.indexOf('씨이') < 0 && seg.top.indexOf('디이') < 0,
     '석 달 뒤·이어하기 묶음은 "오늘 연락할 사람"에 섞이지 않는다');
  ok(seg.top.indexOf('잠듦') < 0, '미뤄 둔 건은 그 날이 올 때까지 올라오지 않는다');
  ok(seg.top.indexOf('에이') >= 0 && seg.top.indexOf('비이') >= 0, '지금·자료먼저 묶음은 올라온다');
  ok(seg.dLink, '검사를 못 끝낸 사람 문구에는 이어하기 링크가 들어 있다');
  ok(seg.noHype, '보낼 문구에 합격·보장 같은 말이 없다');
  ok(seg.segCard && seg.assign, '대응 묶음 카드와 담당자 나누기 칸이 그려진다');

  const due = await p3.evaluate(d => {
    RQ.rows = RQ.rows.map(r => r.id === 'S1' ? Object.assign({}, r, { next_at: d[0] }) : r);
    rqPaint();
    return rqTop(10).map(x => x.r.name);
  }, [D3(1)]);
  ok(due.indexOf('잠듦') >= 0, '미뤄 둔 날이 지나면 다시 올라온다');
  await p3.close();

  console.log('\n채용 4단계 — 성과판과 점수 검증');
  const p4 = await ctx.newPage();
  await p4.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p4.waitForTimeout(1200);

  const prep = `
    function H(n){ return new Date(Date.now()-n*3600000).toISOString(); }
    var BASE={phone:'01000000000',contact_time:'저녁',memo:'',owner_note:'',day_gz:'갑자',blood:'O',
      mbti:'ENFP',birth_y:1994,birth_m:8,birth_d:3,birth_h:14,elapsed_sec:400,finished:true,
      consistency:88,next_at:null,source:'link',recruiter_id:'p2'};
    function hi(i,joined){ return Object.assign({},BASE,{id:'h'+i,name:'상'+i,intent:'now',
      created_at:H(400+i*10),contacted_at:H(396+i*10),met_at:H(380+i*10),
      stage:joined?'joined':'closed',joined_at:joined?H(300+i*10):null}); }
    function lo(i,joined){ return Object.assign({},BASE,{id:'l'+i,name:'하'+i,intent:'no',consistency:40,
      elapsed_sec:40,finished:false,created_at:H(420+i*10),contacted_at:H(300+i*10),
      stage:joined?'joined':'closed',joined_at:joined?H(200):null}); }
    OS.profile={id:'p1',name:'윤시현',role:'admin'};
    document.getElementById('dynPane').innerHTML=renderRecruit();
    RQ.loaded=true; RQ.period=0; RQ.people=[{id:'p1',name:'윤시현'},{id:'p2',name:'박팀장'}];
  `;

  /* 날짜 점수가 base 에 섞이지 않는지 — 이게 섞이면 검증이 통째로 틀린다 */
  const baseOk = await p4.evaluate(pre => {
    eval(pre);
    function H(n){ return new Date(Date.now()-n*3600000).toISOString(); }
    const a = Object.assign({}, BASE, { id: 'a', stage: 'new', intent: 'now', created_at: H(1) });
    const b = Object.assign({}, BASE, { id: 'b', stage: 'new', intent: 'now', created_at: H(24 * 60) });
    const ra = rqScore(a), rb = rqScore(b);
    return { sameBase: ra.base === rb.base, diffScore: ra.score !== rb.score, base: ra.base };
  }, prep);
  ok(baseOk.sameBase && baseOk.diffScore,
     '날짜에서 오는 점수는 검증용 base 에 섞이지 않는다 (base ' + baseOk.base + ', 전체 점수는 달라짐)');

  /* 판정 세 갈래 */
  const verdicts = await p4.evaluate(pre => {
    eval(pre);
    const out = {};
    RQ.rows = [hi(0, true), hi(1, false), lo(0, false)];
    out.few = rqValidate().verdict.t;
    RQ.rows = []; for (let i = 0; i < 12; i++) RQ.rows.push(hi(i, i < 5));
    for (let i = 0; i < 12; i++) RQ.rows.push(lo(i, i < 1));
    const good = rqValidate(); out.good = good.verdict.t; out.hiP = good.hiP; out.loP = good.loP;
    RQ.rows = []; for (let i = 0; i < 12; i++) RQ.rows.push(hi(i, i < 1));
    for (let i = 0; i < 12; i++) RQ.rows.push(lo(i, i < 6));
    const rev = rqValidate(); out.rev = rev.verdict.t; out.revC = rev.verdict.c;
    RQ.rows = []; for (let i = 0; i < 12; i++) RQ.rows.push(hi(i, i < 3));
    for (let i = 0; i < 12; i++) RQ.rows.push(lo(i, i < 3));
    out.weak = rqValidate().verdict.t;
    return out;
  }, prep);
  ok(/아직 판단할 수 없습니다/.test(verdicts.few),
     '건수가 적으면 "아직 판단할 수 없다"고 말한다 — 억지로 결론내지 않는다');
  ok(/맞게 가고 있습니다/.test(verdicts.good),
     '높은 점수대가 실제로 더 많이 입사하면 맞다고 한다 (' + verdicts.hiP + '% vs ' + verdicts.loP + '%)');
  ok(/거꾸로 가고 있습니다/.test(verdicts.rev) && verdicts.revC === '#B91C1C',
     '거꾸로 가면 빨갛게 "점수를 믿지 말라"고 말한다');
  ok(/상관이 약합니다/.test(verdicts.weak), '차이가 없으면 상관이 약하다고 말한다');

  const fun = await p4.evaluate(pre => {
    eval(pre);
    function H(n){ return new Date(Date.now()-n*3600000).toISOString(); }
    RQ.rows = [hi(0, true), hi(1, true), hi(2, false),
      Object.assign({}, BASE, { id: 'n1', name: '새', intent: 'now', stage: 'new',
        created_at: H(60), contacted_at: null, joined_at: null, met_at: null, recruiter_id: null, source: 'qr' })];
    rqPaint();
    const s = rqStats();
    const t = document.getElementById('rqStats').textContent;
    return { got: s.got, con: s.con, met: s.met, join: s.join, cold: s.cold,
      resp: s.resp != null, src: /QR/.test(t) && /링크/.test(t), own: /박팀장/.test(t) && /배정 안 됨/.test(t),
      warn: /이틀이 지나도록/.test(t) };
  }, prep);
  ok(fun.got === 4 && fun.con === 3 && fun.met === 3 && fun.join === 2,
     '퍼널이 맞게 센다 — 접수 ' + fun.got + ' 연락 ' + fun.con + ' 면담 ' + fun.met + ' 입사 ' + fun.join);
  ok(fun.resp, '접수에서 첫 연락까지 걸린 시간을 잰다');
  ok(fun.cold === 1 && fun.warn, '이틀 넘게 손 못 댄 건을 따로 세어 경고한다');
  ok(fun.src && fun.own, '경로별·담당자별로 갈라서 보여준다');

  /* 단계 시각은 처음 한 번만 — 되돌렸다 와도 덮어쓰지 않는다 */
  const stamp = await p4.evaluate(pre => {
    eval(pre);
    function H(n){ return new Date(Date.now()-n*3600000).toISOString(); }
    const sent = [];
    osClient = function () {
      return { from: function () { return { update: function (p) { sent.push(p);
        return { eq: function () { return Promise.resolve({}); } }; } }; } };
    };
    const first = H(5);
    RQ.rows = [Object.assign({}, BASE, { id: 'z', name: '지', stage: 'new',
      created_at: H(10), contacted_at: null, met_at: null, joined_at: null })];
    rqSet('z', 'contacted');
    RQ.rows[0].contacted_at = first;          // 저장됐다고 치고
    RQ.rows[0].stage = 'new';                 // 단계를 되돌린 뒤
    rqSet('z', 'contacted');                  // 다시 연락함으로
    return { first: !!sent[0].contacted_at, again: sent[1].contacted_at === undefined };
  }, prep);
  ok(stamp.first, '처음 연락함으로 옮기면 그 시각을 적는다');
  ok(stamp.again, '되돌렸다 다시 와도 처음 시각을 덮어쓰지 않는다 (응답 속도를 되감을 수 없다)');
  await p4.close();

  console.log('\n채용 5단계 — 가중치 조정과 추천');
  const p5 = await ctx.newPage();
  await p5.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p5.waitForTimeout(1200);

  const wset = await p5.evaluate(() => {
    function H(n) { return new Date(Date.now() - n * 3600000).toISOString(); }
    const r = { id: 'x', name: '가', stage: 'new', intent: 'now', finished: true, consistency: 88,
      elapsed_sec: 400, contact_time: '저녁', memo: '메모', created_at: H(1) };
    RQ_W = null; const d = rqScore(r).score;
    rqWSet('intentNow', 0); const z = rqScore(r).score;
    rqWSet('intentNow', 22);
    /* 저장된 값을 읽어 쓰는지 */
    const realGet = osCfgGet;
    osCfgGet = (k, def) => k === 'recruit_weights' ? JSON.stringify({ finished: 40 }) : realGet(k, def);
    RQ_W = null; const loaded = rqW().finished;
    const keptOthers = rqW().intentNow;
    osCfgGet = realGet; RQ_W = null;
    return { d: d, z: z, drop: d - z, loaded: loaded, keptOthers: keptOthers, def: rqW().finished };
  });
  ok(wset.drop === 22, '가중치를 0으로 바꾸면 점수가 그만큼 내려간다 (' + wset.d + ' → ' + wset.z + ')');
  ok(wset.loaded === 40 && wset.keptOthers === 22,
     '저장된 가중치를 읽어 쓰고, 저장 안 된 항목은 기본값을 지킨다');
  ok(wset.def === 18, '설정을 지우면 기본값으로 돌아온다');

  const rec = await p5.evaluate(() => {
    function H(n) { return new Date(Date.now() - n * 3600000).toISOString(); }
    OS.profile = { id: 'p1', name: '윤시현', role: 'admin' };
    RQ.loaded = true; RQ.people = []; RQ_W = null;
    const B = { phone: '01000000000', contact_time: '저녁', owner_note: '', day_gz: '갑자', blood: 'O',
      mbti: 'ENFP', birth_y: 1994, birth_m: 8, birth_d: 3, birth_h: 14, elapsed_sec: 400,
      consistency: 88, next_at: null, source: 'link', recruiter_id: null, intent: 'now' };
    const rows = [];
    /* 신호마다 갈리는 정도를 다르게 심는다 —
       끝까지함은 아주 강하게, 한마디는 거의 무관하게, 일관성은 살짝 반대로. */
    function mk(id, nm, fin, i, joined) {
      return Object.assign({}, B, { id: id, name: nm, finished: fin,
        memo: i % 2 === 0 ? '말' : '',              // 거의 무관
        consistency: i % 3 !== 0 ? 88 : 50,          // 살짝 반대
        elapsed_sec: i < 5 ? 400 : 100,              // 중간쯤 갈림
        intent: i < 8 ? 'now' : 'maybe',             // 꽤 갈림
        created_at: H(400 + i), contacted_at: H(396 + i),
        stage: joined ? 'joined' : 'closed', joined_at: joined ? H(300) : null });
    }
    for (let i = 0; i < 15; i++) rows.push(mk('f' + i, '완' + i, true, i, i < 9));
    for (let i = 0; i < 15; i++) rows.push(mk('n' + i, '미' + i, false, i, i < 1));
    RQ.rows = rows;
    const L = rqLift();
    const fin = L.rows.filter(x => x.k === 'finished')[0];
    const mem = L.rows.filter(x => x.k === 'memo')[0];
    return { ready: L.ready, finLift: Math.round(fin.lift), memLift: Math.round(mem.lift),
      finSug: L.sug.finished, memSug: L.sug.memo, base: L.sug.base,
      soon: L.sug.intentSoon, now: L.sug.intentNow };
  });
  ok(rec.ready, '결론이 충분히 쌓이면 추천이 열린다');
  ok(rec.finLift > rec.memLift + 20,
     '실제로 갈리는 신호와 그렇지 않은 신호를 가려낸다 — 끝까지함 +' + rec.finLift + 'p, 한마디 +' + rec.memLift + 'p');
  ok(rec.finSug > rec.memSug * 2 && rec.finSug <= 22,
     '추천 가중치가 그 차이를 따라간다 — 끝까지함 ' + rec.finSug + ' vs 한마디 ' + rec.memSug);
  ok(rec.soon < rec.now && rec.soon > 0, '의향 네 갈래는 지금 비율을 지키며 같이 움직인다');
  ok(rec.base >= 0 && rec.base <= 60, '바닥 점수를 다시 잡아 구간 뜻이 유지된다 (' + rec.base + ')');

  const thin = await p5.evaluate(() => {
    RQ.rows = RQ.rows.slice(0, 6);
    const L = rqLift();
    const t = (function () { document.getElementById('dynPane').innerHTML = renderRecruit(); rqPaint();
      return document.getElementById('rqTune').textContent; })();
    return { ready: L.ready, msg: /아직 추천할 수 없습니다/.test(t), btn: /이 추천대로 바꾸기/.test(t) };
  });
  ok(!thin.ready && thin.msg && !thin.btn,
     '건수가 모자라면 추천 버튼을 아예 띄우지 않고 몇 건이 더 필요한지 적는다');

  const badge = await p5.evaluate(() => {
    function H(n) { return new Date(Date.now() - n * 3600000).toISOString(); }
    const b = document.createElement('button');
    b.className = 'tab-btn'; b.setAttribute('data-tab', 'recruit'); document.body.appendChild(b);
    const B = { phone: '01000000000', contact_time: '저녁', memo: '말', intent: 'now', finished: true,
      consistency: 88, elapsed_sec: 400, next_at: null, source: 'link', recruiter_id: null };
    RQ.rows = [
      Object.assign({}, B, { id: 'c1', name: '찬', stage: 'new', created_at: H(80), contacted_at: null }),
      Object.assign({}, B, { id: 'c2', name: '둘', stage: 'new', created_at: H(2), contacted_at: null })
    ];
    rqBadge();
    const tc = b.querySelector('.tc');
    const out = { n: tc ? tc.textContent : '', red: tc ? tc.style.background : '', cold: rqCold() };
    b.remove(); return out;
  });
  ok(badge.n === '2' && badge.cold === 1,
     '사이드바에 기다리는 사람 수가 뜨고, 이틀 넘은 건을 따로 센다 (' + badge.n + '명 중 ' + badge.cold + '명 방치)');
  ok(/rgb\(185, 28, 28\)|#B91C1C/i.test(badge.red), '방치된 건이 있으면 배지가 빨개진다');

  const cols = await p5.evaluate(() => ({
    noHeavy: !/answers|,saju|scores/.test(RQ_COLS),
    hasBrief: /birth_y/.test(RQ_COLS) && /mbti/.test(RQ_COLS) && /joined_at/.test(RQ_COLS)
  }));
  ok(cols.noHeavy && cols.hasBrief,
     '목록은 무거운 답안·사주 원본을 빼고 가져온다 (브리프에 쓰는 칸은 유지)');
  await p5.close();

  console.log('\n채용 6단계 — 입사 이후 13주 정착');
  const p6 = await ctx.newPage();
  await p6.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p6.waitForTimeout(1200);

  const st = await p6.evaluate(() => {
    function W(n) { return new Date(Date.now() - n * 7 * 86400000).toISOString(); }
    function H(n) { return new Date(Date.now() - n * 3600000).toISOString(); }
    OS.profile = { id: 'p1', name: '윤시현', role: 'admin' };
    document.getElementById('dynPane').innerHTML = renderRecruit();
    RQ.loaded = true; RQ.period = 0; RQ.outcome = 'join'; RQ.people = [{ id: 'p1', name: '윤시현' }];
    const B = { phone: '01000000000', contact_time: '저녁', memo: '말', owner_note: '', day_gz: '갑자',
      blood: 'O', mbti: 'ENFP', birth_y: 1994, birth_m: 8, birth_d: 3, birth_h: 14, elapsed_sec: 400,
      finished: true, consistency: 88, next_at: null, source: 'seminar', recruiter_id: 'p1',
      intent: 'now', stage: 'joined', contacted_at: H(500), met_at: H(480),
      started_at: null, left_at: null, left_reason: '' };
    RQ.rows = [
      Object.assign({}, B, { id: 's1', name: '정착자', created_at: W(20), joined_at: W(18), started_at: W(17) }),
      Object.assign({}, B, { id: 's2', name: '진행중', created_at: W(6),  joined_at: W(5),  started_at: W(5) }),
      Object.assign({}, B, { id: 's3', name: '이탈자', created_at: W(12), joined_at: W(11), started_at: W(10),
        left_at: W(4), left_reason: '지인시장이 마르고 다음 채널을 못 찾음' }),
      Object.assign({}, B, { id: 's4', name: '위촉전', created_at: W(1),  joined_at: W(0.5) }),
      Object.assign({}, B, { id: 'c1', name: '종료자', stage: 'closed', joined_at: null, created_at: W(9) })
    ];
    rqPaint();
    const S = rqStats(), t = document.getElementById('rqStay').textContent;
    const g = n => RQ.rows.filter(r => r.name === n)[0];
    return {
      w17: rqWeeks(g('정착자')), w5: rqWeeks(g('진행중')), wLeft: rqWeeks(g('이탈자')), wNone: rqWeeks(g('위촉전')),
      stayed: rqStayed(g('정착자')), notYet: rqStayed(g('진행중')),
      leftNotStay: rqStayed(g('이탈자')), isLeft: rqLeft(g('이탈자')),
      funnelStay: S.stay, funnelJoin: S.join,
      hasStayStep: /13주 정착/.test(document.getElementById('rqStats').textContent),
      reason: /지인시장이 마르고/.test(t), next: /다음 고비/.test(t),
      noDate: /위촉일 없음/.test(t), rate: /50%/.test(t)
    };
  });
  ok(st.w17 === 17 && st.w5 === 5, '위촉일에서 주차를 센다 (' + st.w17 + '주 / ' + st.w5 + '주)');
  ok(st.wLeft === 6, '그만둔 사람은 그만둔 날까지만 센다 (' + st.wLeft + '주)');
  ok(st.wNone === null && st.noDate, '위촉일이 없으면 주차를 세지 않고 그렇다고 표시한다');
  ok(st.stayed && !st.notYet && !st.leftNotStay && st.isLeft,
     '13주를 넘기고 안 나간 사람만 정착으로 본다');
  ok(st.funnelJoin === 4 && st.funnelStay === 1 && st.hasStayStep,
     '퍼널에 정착 칸이 붙는다 — 입사 ' + st.funnelJoin + ' → 정착 ' + st.funnelStay);
  ok(st.reason && st.next, '그만둔 이유를 남기고, 진행 중인 사람에게는 다음 고비를 알려 준다');
  ok(st.rate, '정착률을 낸다 (결론 난 건만 놓고)');

  const sw = await p6.evaluate(() => {
    function W(n) { return new Date(Date.now() - n * 7 * 86400000).toISOString(); }
    const B = { phone: '0', contact_time: '저녁', memo: '말', intent: 'now', finished: true,
      consistency: 88, elapsed_sec: 400, next_at: null, source: 'link', recruiter_id: null,
      stage: 'joined', left_at: null, left_reason: '', day_gz: '', mbti: '', blood: '' };
    const rows = [];
    /* 입사는 했지만 반은 13주 전에 나간 상황 */
    for (let i = 0; i < 12; i++) rows.push(Object.assign({}, B, { id: 'a' + i, name: '남' + i,
      created_at: W(30), joined_at: W(28), started_at: W(20) }));
    for (let i = 0; i < 12; i++) rows.push(Object.assign({}, B, { id: 'b' + i, name: '간' + i,
      created_at: W(30), joined_at: W(28), started_at: W(20), left_at: W(14), left_reason: '적응 못함' }));
    RQ.rows = rows;
    RQ.outcome = 'join';
    const byJoin = { decided: RQ.rows.filter(rqDecided).length, won: RQ.rows.filter(rqWon).length, n: rqOutcomeName() };
    RQ.outcome = 'stay';
    const byStay = { decided: RQ.rows.filter(rqDecided).length, won: RQ.rows.filter(rqWon).length, n: rqOutcomeName() };
    const ready = rqStayReady();
    rqPaint();
    const t = document.getElementById('rqStats').textContent;
    RQ.outcome = 'join';
    return { byJoin: byJoin, byStay: byStay, ready: ready.ok, mentions: /13주 정착율|13주 정착/.test(t) };
  });
  ok(sw.byJoin.won === 24 && sw.byStay.won === 12,
     '성공 기준을 바꾸면 결과가 달라진다 — 입사로 보면 ' + sw.byJoin.won + '명, 정착으로 보면 ' + sw.byStay.won + '명');
  ok(sw.byStay.decided === 24 && sw.ready,
     '정착 결론이 충분히 쌓이면 정착 기준으로 보라고 권한다');
  ok(sw.mentions, '검증 문구가 고른 기준을 따라 바뀐다');
  await p6.close();

  console.log('\n화면 · 스크롤 칸');
  for (const t of await page.evaluate(() => tabsFor('both'))) {
    await page.evaluate(x => goTab(x), t);
    await page.waitForTimeout(200);
    const len = await page.evaluate(() => document.getElementById('view').textContent.replace(/\s+/g, '').length);
    ok(len > 400, t + ' 탭이 내용을 그린다 (' + len + '자)');
  }
  const pay = await page.evaluate(() => {
    const hit = [];
    tabsFor('both', 'agent').forEach(t => {
      goTab(t);
      if (/결제하고|1,900원|구독/.test(document.getElementById('view').textContent) && t !== 'worry') hit.push(t);
    });
    goTab('worry');
    return hit;
  });
  ok(pay.length === 0, '결제는 고민 상담에만 있고 다른 탭에는 없다' + (pay.length ? ' — ' + pay.join(',') : ''));
  const ext = await page.evaluate(() => Array.prototype.some.call(document.querySelectorAll('script,link,img'),
    e => /^https?:/.test(e.getAttribute('src') || e.getAttribute('href') || '')));
  ok(!ext, '바깥에서 받아오는 그림·글꼴·스크립트가 없다');

  /* 스크롤 — 여기가 이 화면의 핵심이다 */
  for (const [w, h] of [[1200, 900], [412, 880], [360, 640], [500, 300]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const p = document.getElementById('pane');
      p.scrollTop = 0;
      const can = p.scrollHeight > p.clientHeight + 4;
      p.scrollTop = 400;
      return { can: can, moved: p.scrollTop > 0, flow: document.body.classList.contains('flow'),
        sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth };
    });
    ok((r.moved || r.flow) && r.sw <= r.cw + 2,
       w + '×' + h + ' — 스크롤 칸이 굴러가고 가로 스크롤은 없다' + (r.flow ? ' (문서 스크롤로 되돌림)' : ''));
  }
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.waitForTimeout(300);            // resize 핸들러(fitShell)가 flow 를 걷어낼 시간
  await page.evaluate(() => { S.tab = 'life'; draw(); });   // 확실히 넘치는 탭에서 본다
  await page.waitForTimeout(150);
  const hint = await page.evaluate(() => {
    const p = document.getElementById('pane');
    p.scrollTop = p.scrollHeight;
    return { top: Math.round(p.scrollTop), sh: p.scrollHeight, ch: p.clientHeight,
      cls: document.getElementById('hint').className };
  });
  await page.waitForTimeout(400);
  const hint2 = await page.evaluate(() => document.getElementById('hint').className);
  ok(/off/.test(hint2), '끝까지 내리면 "아래로 더 있어요" 표시가 사라진다 (' +
     hint.top + '/' + (hint.sh - hint.ch) + ' · ' + hint2 + ')');

  await browser.close(); srv.close();
  console.log('');
  if (errs.length) { console.log('콘솔 오류 ' + errs.length + '건'); errs.slice(0, 6).forEach(e => console.log('   ' + e.slice(0, 160))); }
  if (fail.length) { console.log('실패 ' + fail.length + '건'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
  if (errs.length) process.exit(1);
  console.log('성향검사 48 점검 통과');
})().catch(e => { console.error('오류:', e); process.exit(1); });
