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
  await page.goto('http://127.0.0.1:' + PORT + '/app/saju-mbti.html', { waitUntil: 'domcontentloaded' });
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
  ok(modes.out.both.length === 8 && modes.out.saju.length === 6 && modes.out.mbti.length === 7,
     '모드마다 탭이 다르다 — 통합 ' + modes.out.both.length + ' · 사주 ' + modes.out.saju.length + ' · MBTI ' + modes.out.mbti.length);
  ok(modes.sajuOk === true, '유형 없이 사주만으로도 모든 탭이 그려진다' + (modes.sajuOk === true ? '' : ' — ' + modes.sajuOk));
  ok(modes.mbtiOk === true, '사주 없이 유형만으로도 모든 탭이 그려진다' + (modes.mbtiOk === true ? '' : ' — ' + modes.mbtiOk));

  console.log('\n화면 · 스크롤 칸');
  for (const t of await page.evaluate(() => tabsFor('both'))) {
    await page.evaluate(x => goTab(x), t);
    await page.waitForTimeout(200);
    const len = await page.evaluate(() => document.getElementById('view').textContent.replace(/\s+/g, '').length);
    ok(len > 400, t + ' 탭이 내용을 그린다 (' + len + '자)');
  }
  const pay = await page.evaluate(() => /결제|9,900|토스|payment|구독/.test(document.body.textContent));
  ok(!pay, '결제 흔적이 어디에도 없다');
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
  await page.evaluate(() => { const p = document.getElementById('pane'); p.scrollTop = p.scrollHeight; });
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.getElementById('hint').classList.contains('off')),
     '끝까지 내리면 "아래로 더 있어요" 표시가 사라진다');

  await browser.close(); srv.close();
  console.log('');
  if (errs.length) { console.log('콘솔 오류 ' + errs.length + '건'); errs.slice(0, 6).forEach(e => console.log('   ' + e.slice(0, 160))); }
  if (fail.length) { console.log('실패 ' + fail.length + '건'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
  if (errs.length) process.exit(1);
  console.log('성향검사 48 점검 통과');
})().catch(e => { console.error('오류:', e); process.exit(1); });
