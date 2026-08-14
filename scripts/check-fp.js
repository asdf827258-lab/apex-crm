/* 재무설계 라인 — 화법서 · 상담자료 · 고객 파일 저장을 실제로 눌러 본다.

   두 파일은 앱 안에서 창 하나로 열린다. 창 너머로 말이 오가는 구조라
   화면이 그려졌다는 것만으로는 아무것도 보장되지 않는다.
   상담 내용을 실제로 받아오는지, 저장한 것을 그대로 되돌려 놓는지,
   계산기로 넘어가는 숫자가 맞는지까지 봐야 안 깨진 것이다.

   서버는 가짜로 붙인다. saved_reports 는 쓴 것을 그대로 돌려준다.   */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8815;
const SHOT = process.env.FP_SHOT || '';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const STUB = `
window.__saved=[];
window.__clients=[{id:'cl1',name_masked:'김○○'}];
window.supabase={createClient:function(){
 var mk=function(tbl){
  var f={},a={
   select:function(){return a},gte:function(){return a},lte:function(){return a},is:function(){return a},
   neq:function(){return a},in:function(){return a},not:function(){return a},order:function(){return a},
   limit:function(){return a},single:function(){return a},range:function(){return a},
   eq:function(k,v){f[k]=v;return a},
   insert:function(r){ if(tbl==='saved_reports'){ r.id='r'+(window.__saved.length+1);
       r.created_at=new Date().toISOString(); window.__saved.push(r);} return a},
   update:function(){return a},upsert:function(){return a},
   then:function(res){
     var out=[];
     if(tbl==='saved_reports')out=window.__saved.filter(function(x){return !f.kind||x.kind===f.kind});
     else if(tbl==='clients')out=window.__clients;
     else if(tbl==='profiles')out=[{id:'fp',name:'점검',role:'owner',active:true,plan:'vip'}];
     return Promise.resolve({data:out,error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'fp',email:'fp@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'fp'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1240, height: 1000 } });
  /* 폰트 CDN 만 비워 준다 — 나머지는 우리 서버 */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('main: ' + e.message));
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2600);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'fp', name: '점검', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'fp', email: 'fp@t' } };
    OS.cfg = { schema_version: '32' };
    window.__toast = [];
    window.toast = function (m) { window.__toast.push(m); };
  });

  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };

  /* ── 이름 바뀐 것 ── */
  const menu = await page.evaluate(() => {
    var t = [];
    TABS.forEach(g => g.items.forEach(i => t.push(i.id + '|' + i.title)));
    return t;
  });
  ok(menu.indexOf('sangdam|보장분석 상담자료') >= 0, '상담자료 → 보장분석 상담자료');
  ok(menu.indexOf('fp_deck|재무설계 상담자료') >= 0, '재무설계 상담자료 가 메뉴에 있다');
  ok(menu.indexOf('fp_talk|재무설계 실전화법서') >= 0, '재무설계 실전화법서 가 메뉴에 있다');
  ok(menu.filter(x => /^sangdam\|/.test(x)).length === 1, '보장분석 상담자료는 하나만 있다');

  /* ── 화법서 화면 ── */
  await page.evaluate(() => go('fp_talk'));
  await page.waitForTimeout(700);
  const talk = await page.evaluate(() => ({
    rows: document.querySelectorAll('#fpTalkPane .fp-ch').length,
    groups: document.querySelectorAll('#fpTalkPane .fp-gp').length,
    today: !!document.querySelector('.fp-tod'),
    n: FP_CH.length
  }));
  ok(talk.rows === talk.n, '장 ' + talk.rows + '개가 모두 나온다');
  ok(talk.groups === 7, '묶음 ' + talk.groups + '개');
  ok(talk.today, '오늘 이 장이 하나 뽑혀 있다');

  /* 검색 */
  await page.evaluate(() => fpTalkFind('거절'));
  await page.waitForTimeout(200);
  const found = await page.evaluate(() => ({
    n: document.querySelectorAll('#fpTalkPane .fp-ch').length,
    t: (document.getElementById('fpTalkPane') || {}).textContent || ''
  }));
  ok(found.n >= 1 && found.t.indexOf('거절') >= 0, '"거절" 로 찾으면 ' + found.n + '장이 남는다');
  await page.evaluate(() => fpTalkFind('없는말없는말'));
  await page.waitForTimeout(200);
  const none = await page.evaluate(() => document.querySelectorAll('#fpTalkPane .fp-none').length);
  ok(none === 1, '없는 말을 넣으면 안내가 나온다');
  await page.evaluate(() => fpTalkFind(''));
  await page.waitForTimeout(200);

  /* 실제로 열어 본다 — 24장(거절처리)으로 */
  await page.evaluate(() => fpTalkOpen('c24'));
  /* 3.2초를 그냥 기다리면 안 된다. 화법서는 355KB 라 늦게 뜰 때가 있고,
     재무설계앱을 파일로 뺀 뒤로는 첫 화면이 받아 오는 것이 더 늘었다.
     실제로 여섯 번에 두 번꼴로 여기서 헛되이 빨간불이 떴다.
     기다리는 대신 <b>연결됐다는 신호</b>를 기다린다 — 진짜로 안 오면
     그때는 제대로 실패한다. */
  try {
    await page.waitForFunction(() => window.FPT && FPT.ready, { timeout: 20000 });
  } catch (e) { /* 안 오면 아래 ok() 가 잡는다 */ }
  const tOpen = await page.evaluate(() => ({
    mode: document.body.classList.contains('fptalk-mode'),
    src: (document.getElementById('fpTalkFrame') || {}).src || '',
    ready: FPT.ready
  }));
  ok(tOpen.mode, '화법서가 전체화면으로 열린다');
  ok(/실전화법서/.test(decodeURIComponent(tOpen.src)), '화법서 파일이 붙었다');
  ok(tOpen.ready, '화법서가 앱에 연결됐다고 알려 온다');

  const tf = page.frames().find(f => decodeURIComponent(f.url()).indexOf('실전화법서') >= 0);
  ok(!!tf, '화법서 안으로 들어갈 수 있다');
  if (tf) {
    const inside = await tf.evaluate(() => ({
      chs: document.querySelectorAll('section.ch').length,
      c24: !!document.getElementById('c24'),
      title: (document.querySelector('#c24 h2') || {}).textContent || ''
    }));
    ok(inside.chs === 30, '화법서 안에 장이 ' + inside.chs + '개 있다');
    ok(inside.c24 && /거절/.test(inside.title), '24장이 거절처리다 — "' + inside.title.trim() + '"');
  }
  if (SHOT) await page.screenshot({ path: SHOT + '/fp-talk-open.png' });
  await page.evaluate(() => exitFpTalk());
  await page.waitForTimeout(200);
  ok(!(await page.evaluate(() => document.body.classList.contains('fptalk-mode'))), '워크스페이스로 돌아온다');

  /* ── 상담자료 화면 ── */
  await page.evaluate(() => go('fp_deck'));
  await page.waitForTimeout(900);
  const deck = await page.evaluate(() => ({
    flow: document.querySelectorAll('.fp-fl').length,
    close: document.querySelectorAll('.fp-st').length,
    role: document.querySelectorAll('.fp-ch').length,
    empty: (document.getElementById('fpRepPane') || {}).textContent || ''
  }));
  ok(deck.flow === 5, '60분 흐름 ' + deck.flow + '칸');
  ok(deck.close === 5, '계약으로 잇는 순서 ' + deck.close + '단계');
  ok(deck.role === 6, '계산기와 나눠 쓰기 ' + deck.role + '줄');
  ok(/아직 저장한 상담이 없습니다/.test(deck.empty), '처음엔 저장한 상담이 비어 있다');

  await page.evaluate(() => fpDeckOpen());
  await page.waitForTimeout(3600);
  const dOpen = await page.evaluate(() => ({
    mode: document.body.classList.contains('fpdeck-mode'), ready: FPD.ready }));
  ok(dOpen.mode, '상담자료가 전체화면으로 열린다');
  ok(dOpen.ready, '상담자료가 앱에 연결됐다고 알려 온다');

  const df = page.frames().find(f => decodeURIComponent(f.url()).indexOf('재무설계/상담자료') >= 0);
  ok(!!df, '상담자료 안으로 들어갈 수 있다');
  if (!df) { await browser.close(); srv.close(); console.log('실패'); process.exit(1); }

  /* 상담을 실제로 입력한다 */
  await df.evaluate(() => {
    var set = function (id, v) { var e = document.getElementById(id); if (e) { e.value = v;
      try { e.dispatchEvent(new Event('input', { bubbles: true })); } catch (x) {} } };
    set('f_name', '박정우'); set('f_age', '47'); set('f_gender', 'F'); set('f_job', '자영업');
    set('f_income', '620'); set('f_sincome', '180'); set('f_etc', '40');
    set('f_ret', '62'); set('f_retspend', '410'); set('f_np', '155');
    set('f_home', '62000'); set('f_debt', '18000'); set('f_ins', '46');
    set('c_cancer', '5000'); set('c_brain', '2000'); set('c_death', '15000');
    if (typeof addKid === 'function') { document.getElementById('kids').innerHTML = ''; addKid('박서준', 16); addKid('박서연', 12); }
  });
  await page.waitForTimeout(400);

  /* 저장 — 고객 고르기까지 */
  await page.evaluate(() => fpSaveNow());
  await page.waitForTimeout(1400);
  const picker = await page.evaluate(() => !!document.querySelector('.osCliPickRow'));
  ok(picker, '저장을 누르면 고객 고르기가 뜬다');
  ok(!(await page.evaluate(() => document.body.classList.contains('fpdeck-mode'))),
    '저장할 때는 워크스페이스로 나온다 (고객 고르기가 가려지지 않게)');
  await page.evaluate(() => { var b = document.querySelector('.osCliPickRow'); if (b) b.click(); });
  await page.waitForTimeout(2400);

  const saved = await page.evaluate(() => {
    var r = window.__saved[0] || {};
    var f = (r.content && r.content.fp && r.content.fp.f) || {};
    return { n: window.__saved.length, kind: r.kind, title: r.title, cid: r.client_id,
      name: f.f_name, age: f.f_age, income: f.f_income, cancer: f.c_cancer,
      kids: ((r.content && r.content.fp && r.content.fp.kids) || []).length,
      keys: Object.keys(f).length,
      hasAdv: Object.keys(f).some(k => k.indexOf('a_') === 0) };
  });
  ok(saved.n === 1 && saved.kind === 'fp_deck', '고객 파일로 한 건 저장됐다');
  ok(saved.cid === 'cl1', '고른 고객에게 붙었다');
  ok(saved.name === '박정우' && saved.age === '47', '입력한 이름·나이가 그대로 담겼다');
  ok(saved.income === '620' && saved.cancer === '5000', '소득·진단금까지 담겼다');
  ok(saved.kids === 2, '자녀 ' + saved.kids + '명도 담겼다');
  /* 설계사 칸(a_name·a_org…)을 없앤 뒤로 아홉 개가 줄었다. 줄어든 게 맞다 —
     설계사 소개는 「내 소개」 한 곳에서 관리하고, 고객 파일에는 안 섞인다. */
  ok(saved.keys >= 35, '고객 입력칸 ' + saved.keys + '개가 통째로 담겼다');
  ok(!saved.hasAdv, '설계사 칸은 고객 파일에 안 섞인다');
  ok(/박정우/.test(saved.title || ''), '제목에 고객 이름이 들어간다 — ' + saved.title);

  /* 목록에 뜨는지 */
  const listed = await page.evaluate(() => ({
    n: document.querySelectorAll('#fpRepPane .fp-rp').length,
    t: (document.getElementById('fpRepPane') || {}).textContent || '' }));
  ok(listed.n === 1 && /김○○/.test(listed.t), '저장한 상담이 목록에 뜬다');

  /* 창을 비우고 → 다시 열기로 되돌아오는지 */
  await df.evaluate(() => {
    ['f_name', 'f_age', 'f_income', 'c_cancer'].forEach(function (id) {
      var e = document.getElementById(id); if (e) e.value = '';
    });
    document.getElementById('kids').innerHTML = '';
  });
  await page.evaluate(() => fpRepOpen(0));
  await page.waitForTimeout(1600);
  const back = await df.evaluate(() => {
    var g = function (id) { var e = document.getElementById(id); return e ? e.value : null; };
    return { name: g('f_name'), age: g('f_age'), income: g('f_income'), cancer: g('c_cancer'),
      kids: document.querySelectorAll('#kids .kid-row').length,
      kid1: (document.querySelector('#kids .k-name') || {}).value || '' };
  });
  ok(back.name === '박정우' && back.age === '47', '다시 열면 이름·나이가 되돌아온다');
  ok(back.income === '620' && back.cancer === '5000', '소득·진단금도 되돌아온다');
  ok(back.kids === 2 && back.kid1 === '박서준', '자녀 줄도 그대로 살아난다');
  if (SHOT) await page.screenshot({ path: SHOT + '/fp-deck-open.png' });
  await page.evaluate(() => exitFpDeck());
  await page.waitForTimeout(200);

  /* ── 계산기로 넘기기 ── */
  const mapped = await page.evaluate(() => {
    var d = window.__saved[0].content.fp;
    var o = fpToFin(d);
    return { o: o, n: Object.keys(o).length };
  });
  ok(mapped.o.s_name === '박정우', '계산기 고객명으로 넘어간다');
  ok(mapped.o.s_age === '47' && mapped.o.s_rage === '62', '나이·은퇴나이가 넘어간다');
  ok(mapped.o.s_gender === '여성', '성별이 계산기 표기로 바뀐다 (F → 여성)');
  ok(mapped.o.s_gross === '7440', '월소득 620 → 연 총급여 7440 으로 환산된다');
  ok(mapped.o.s_spouse === '180' && mapped.o.s_other === '40', '배우자·기타 소득이 넘어간다');
  ok(mapped.o.ins_cancer_dx === '5000' && mapped.o.ins_life === '15000', '진단금·사망보험금이 보장칸으로 넘어간다');
  ok(mapped.o.s_realty === '62000' && mapped.o.s_debt === '18000', '부동산·부채가 넘어간다');
  ok(mapped.n >= 18, '모두 ' + mapped.n + '칸이 넘어간다');

  const bad = await page.evaluate(() => {
    var ids = {}; TABS.forEach(g => g.items.forEach(i => ids[i.id] = 1));
    var out = [];
    FP_ROLE.forEach(function (r) { if (!ids[r[2]]) out.push(r[2]); });
    return out;
  });
  ok(bad.length === 0, '연결된 화면이 모두 실제로 있다' + (bad.length ? ' — ' + bad.join(',') : ''));

  /* 실제로 계산기까지 흘러가는지 */
  await page.evaluate(() => fpRepToCalc(0));
  await page.waitForTimeout(4200);
  const fin = await page.evaluate(() => {
    var f = document.getElementById('finFrame');
    return { mode: document.body.classList.contains('finance-mode'), mounted: !!(f && f._mounted) };
  });
  ok(fin.mode && fin.mounted, '계산기 화면이 열린다');
  const ff = page.frames().find(f => { try { return f !== page.mainFrame() && f.url().indexOf('실전화법서') < 0
    && f.url().indexOf('상담자료') < 0 && f.name() !== undefined; } catch (e) { return false; } });
  const finVals = await page.evaluate(() => {
    var f = document.getElementById('finFrame');
    try { var d = f.contentDocument;
      var g = function (id) { var e = d.getElementById(id); return e ? e.value : null; };
      return { name: g('s_name'), age: g('s_age'), gross: g('s_gross'), gender: g('s_gender') };
    } catch (e) { return { err: e.message }; }
  });
  ok(finVals.name === '박정우' && finVals.gross === '7440',
    '계산기 칸에 실제로 들어갔다 (' + finVals.name + ' / 연 ' + finVals.gross + '만원)');
  ok(finVals.gender === '여성', '성별 칸도 맞게 들어갔다');
  if (SHOT) await page.screenshot({ path: SHOT + '/fp-calc.png' });

  /* ── 좁은 화면 ── */
  await page.evaluate(() => go('fp_deck'));
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(500);
  const w1 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(w1.sw <= w1.cw + 2, '재무설계 상담자료 390px 가로 스크롤 없음 (' + w1.sw + '/' + w1.cw + ')');
  await page.evaluate(() => go('fp_talk'));
  await page.waitForTimeout(400);
  const w2 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(w2.sw <= w2.cw + 2, '실전화법서 390px 가로 스크롤 없음 (' + w2.sw + '/' + w2.cw + ')');
  if (SHOT) await page.screenshot({ path: SHOT + '/fp-talk-m.png', fullPage: true });

  await browser.close(); srv.close();
  console.log('');
  if (errs.length) { console.log('콘솔 오류 ' + errs.length + '건'); errs.slice(0, 6).forEach(e => console.log('   ' + e.slice(0, 170))); }
  if (fail.length) { console.log('실패 ' + fail.length + '건'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
  if (errs.length) process.exit(1);
  console.log('재무설계 라인 점검 통과');
})().catch(e => { console.error('오류:', e); process.exit(1); });
