/* 성장판 — 리더 얼굴과 팀원 얼굴을 실제로 눌러 본다.

   여기는 숫자가 사람 평가로 이어지는 화면이다. 그래서 화면이 뜬다는 것보다
   심어 둔 기록만큼 점수가 나오는지, 놓친 사람을 실제로 골라내는지,
   합격과 피드백이 서버까지 가는지가 중요하다.

   같은 앱을 두 사람으로 두 번 연다 — 지점장으로 한 번, 팀원으로 한 번.   */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8816;
const SHOT = process.env.GB_SHOT || '';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const kst = new Date(Date.now() + 9 * 3600 * 1000);
const today = kst.toISOString().slice(0, 10);
function ago(n) { const d = new Date(kst); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); }

/* 세 사람 — 잘하는 사람 · 중간 · 놓치고 있는 사람 */
const PEOPLE = [
  { id: 'p_top', name: '최우수', att: 22, call: 130, cli: 10, rep: 9, run: 10, days: 22, pass: 10, lastFb: 3 },
  { id: 'p_mid', name: '중간해', att: 14, call: 45, cli: 3, rep: 2, run: 5, days: 12, pass: 3, lastFb: 12 },
  { id: 'p_low', name: '놓친이', att: 2, call: 0, cli: 0, rep: 0, run: 0, days: 0, pass: 0, lastFb: 0 },
  { id: 'lead1', name: '지점장', att: 20, call: 20, cli: 2, rep: 3, run: 7, days: 18, pass: 5, lastFb: 0 }
];
const DAY_IDS = ['d1','d2','d3','d4','d5','d6','d7','d8','d9','d10','d11'];

const profiles = PEOPLE.map(p => ({ id: p.id, name: p.name, role: p.id === 'lead1' ? 'leader' : 'member', active: true, workspace: 'both' }));
const teams = [{ id: 't1', name: '온탑1팀', leader_id: 'lead1' }];
const team_members = PEOPLE.map(p => ({ team_id: 't1', member_id: p.id }));
const attendance = [], calls = [], clients = [], saved_reports = [], daily_checks = [], pass_rows = [], coach_notes = [];
PEOPLE.forEach(p => {
  for (let i = 0; i < p.att; i++) attendance.push({ member_id: p.id, att_date: ago(i) });
  for (let i = 0; i < p.call; i++) calls.push({ created_by: p.id, call_at: ago(i % 25) + 'T10:00:00' });
  for (let i = 0; i < p.cli; i++) clients.push({ advisor_id: p.id, created_at: ago(i % 25) + 'T10:00:00' });
  for (let i = 0; i < p.rep; i++) saved_reports.push({ advisor_id: p.id, created_at: ago(i % 25) + 'T10:00:00' });
  for (let i = 0; i < p.days; i++) {
    const m = {};
    DAY_IDS.slice(0, p.run).forEach(k => m[k] = true);
    daily_checks.push({ member_id: p.id, check_date: ago(i), scope: 'day', items: m });
  }
  const pm = {};
  for (let i = 0; i < p.pass; i++) pm['s' + (i + 1)] = 1;
  if (p.pass) pass_rows.push({ member_id: p.id, items: pm });
  if (p.lastFb) coach_notes.push({ id: 'n_' + p.id, member_id: p.id, body: '지난 피드백입니다', mood: '칭찬',
    share: true, created_at: ago(p.lastFb) + 'T09:00:00' });
});

const STUB = (who) => `
window.__me=${JSON.stringify(who)};
window.__ins=[];
window.__ups=[];
window.__data={
 profiles:${JSON.stringify(profiles)},teams:${JSON.stringify(teams)},
 team_members:${JSON.stringify(team_members)},attendance:${JSON.stringify(attendance)},
 calls:${JSON.stringify(calls)},clients:${JSON.stringify(clients)},
 saved_reports:${JSON.stringify(saved_reports)},daily_checks:${JSON.stringify(daily_checks)},
 pass:${JSON.stringify(pass_rows)},coach_notes:${JSON.stringify(coach_notes)}};
window.supabase={createClient:function(){
 var mk=function(tbl){
  var f={},a={
   select:function(){return a},gte:function(){return a},lte:function(){return a},is:function(){return a},
   neq:function(){return a},in:function(){return a},not:function(){return a},order:function(){return a},
   limit:function(){return a},single:function(){return a},range:function(){return a},
   eq:function(k,v){f[k]=v;return a},
   insert:function(r){window.__ins.push({tbl:tbl,row:JSON.parse(JSON.stringify(r))});return a},
   update:function(){return a},
   upsert:function(r){window.__ups.push({tbl:tbl,row:JSON.parse(JSON.stringify(r))});
     if(tbl==='daily_checks'&&r.scope==='pass'){
       var hit=false;
       window.__data.pass.forEach(function(x){if(x.member_id===r.member_id){x.items=r.items;hit=true;}});
       if(!hit)window.__data.pass.push({member_id:r.member_id,items:r.items});
     }
     return a},
   then:function(res){
     var out=[];
     if(tbl==='daily_checks')out=(f.scope==='pass')?window.__data.pass:window.__data.daily_checks;
     else if(window.__data[tbl])out=window.__data[tbl];
     return Promise.resolve({data:out,error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:window.__me.id,email:'x@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:window.__me.id}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

async function openAs(browser, who) {
  const ctx = await browser.newContext({ viewport: { width: 1240, height: 1100 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(who.name + ': ' + e.message));
  await page.addInitScript(STUB(who));
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  await page.evaluate(w => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: w.id, name: w.name, role: w.role, plan: 'vip' };
    OS.session = { user: { id: w.id, email: 'x@t' } };
    OS.cfg = { schema_version: '32' };
    window.__toast = []; window.toast = function (m) { window.__toast.push(m); };
  }, who);
  return { page, errs };
}

(async () => {
  const browser = await chromium.launch();
  const fail = [];
  const errs = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };

  /* ═══ 지점장으로 ═══ */
  console.log('── 지점장');
  const L = await openAs(browser, { id: 'lead1', name: '지점장', role: 'leader' });
  errs.push(...L.errs);
  await L.page.evaluate(() => go('growboard'));
  await L.page.waitForTimeout(2200);

  const lead = await L.page.evaluate(() => ({
    face: (document.querySelector('.gb-fb.on') || {}).textContent || '',
    sum: (document.querySelector('.gb-sum') || {}).textContent || '',
    miss: document.querySelectorAll('.gb-ms').length,
    rows: document.querySelectorAll('.gb-rw').length,
    week: document.querySelectorAll('.gb-wk').length,
    rowsTxt: Array.prototype.map.call(document.querySelectorAll('.gb-nm2'), e => e.textContent.trim()),
    scores: Array.prototype.map.call(document.querySelectorAll('.gb-sc'), e => parseInt(e.textContent, 10))
  }));
  ok(lead.face === '팀 보기', '지점장은 팀 보기가 먼저 열린다');
  ok(lead.rows === 4, '팀원 카드 ' + lead.rows + '장');
  ok(lead.week === 5, '이번 주 할 일 ' + lead.week + '줄 (월~금)');
  ok(/팀원4명/.test(lead.sum.replace(/\s/g, '')), '요약에 팀원 수가 나온다');
  ok(lead.miss >= 1, '놓치고 있는 사람이 ' + lead.miss + '명 잡힌다');

  const missTxt = await L.page.evaluate(() => (document.querySelector('.gb-ms') || {}).textContent || '');
  ok(/놓친이/.test(missTxt), '가장 먼저 잡히는 사람이 놓친이다');
  ok(/출근은 하는데 활동 기록이 한 건도 없습니다/.test(missTxt),
    '출근만 찍고 아무것도 안 하는 사람을 잡아낸다 — ' +
    missTxt.replace(/\s+/g, ' ').slice(0, 70));

  /* 점수가 심은 대로 나오는지 */
  const sc = await L.page.evaluate(() => {
    var o = {};
    GB.rows.forEach(r => o[r.name] = { total: r.total, sc: r.sc, raw: r.raw });
    return o;
  });
  ok(sc['최우수'].total > sc['중간해'].total && sc['중간해'].total > sc['놓친이'].total,
    '점수 순서가 맞다 (최우수 ' + sc['최우수'].total + ' > 중간해 ' + sc['중간해'].total + ' > 놓친이 ' + sc['놓친이'].total + ')');
  ok(sc['최우수'].sc.call === 100, '통화 130건 → 활동 100점 (기준 100통에서 상한)');
  ok(sc['중간해'].sc.call === 45, '통화 45건 → 활동 45점');
  ok(sc['놓친이'].total === 0 || sc['놓친이'].total < 15, '놓친이는 ' + sc['놓친이'].total + '점');
  ok(sc['최우수'].raw.run === 10, '체크판 하루 평균 ' + sc['최우수'].raw.run + '개');
  ok(sc['최우수'].raw.stu === 10, '합격 ' + sc['최우수'].raw.stu + '개가 공부 점수로 들어간다');

  /* 팀원 카드를 열어 본다 */
  await L.page.evaluate(() => {
    var r = GB.rows.filter(x => x.name === '중간해')[0];
    gbWrite(r.id);
  });
  await L.page.waitForTimeout(400);
  const card = await L.page.evaluate(() => ({
    ax: document.querySelectorAll('.gb-body .gb-ax').length,
    bars: document.querySelectorAll('.gb-body .gb-b').length,
    hit: (document.querySelector('.gb-body .gb-hit') || {}).textContent || '',
    pass: document.querySelectorAll('.gb-pc').length,
    passOn: document.querySelectorAll('.gb-pc.on').length,
    form: !!document.querySelector('.gb-fm textarea'),
    old: document.querySelectorAll('.gb-fm .gb-nt').length
  }));
  ok(card.ax === 6, '여섯 축이 모두 나온다');
  ok(card.bars === 18, '축마다 나·팀평균·잘하는사람 세 줄 (' + card.bars + '개)');
  ok(/할 말은 이것 하나입니다/.test(card.hit), '이 사람에게 할 말 하나가 뽑힌다');
  ok(card.pass === 12 && card.passOn === 3, '합격 현황 ' + card.passOn + '/' + card.pass);
  ok(card.form, '피드백 쓰는 칸이 있다');
  ok(card.old === 1, '지난 피드백이 보인다');

  /* 피드백을 실제로 남긴다 */
  await L.page.evaluate(() => {
    var r = GB.rows.filter(x => x.name === '중간해')[0];
    document.getElementById('gbNb_' + r.id).value = '전화 시간을 오전으로 고정합시다';
    document.getElementById('gbNm_' + r.id).value = '약속';
    gbNoteSave(r.id);
  });
  await L.page.waitForTimeout(900);
  const wrote = await L.page.evaluate(() => {
    var w = window.__ins.filter(x => x.tbl === 'coach_notes');
    return { n: w.length, row: w[0] ? w[0].row : null, toast: window.__toast.slice(-1)[0] || '' };
  });
  ok(wrote.n === 1, '피드백이 서버로 한 건 갔다');
  ok(wrote.row && wrote.row.body === '전화 시간을 오전으로 고정합시다', '적은 내용이 그대로 갔다');
  ok(wrote.row && wrote.row.mood === '약속' && wrote.row.share === true, '갈래와 공개 여부가 함께 갔다');
  ok(/팀원 화면에도 보입니다/.test(wrote.toast), '공개로 남기면 그렇게 알려 준다');

  /* 지점장도 자기 성장을 본다 */
  await L.page.evaluate(() => gbGoFace('me'));
  await L.page.waitForTimeout(500);
  const leadMe = await L.page.evaluate(() => ({
    big: (document.querySelector('.gb-big .n') || {}).textContent || '',
    cur: document.querySelectorAll('.gb-cu').length,
    up: document.querySelectorAll('.gb-up').length
  }));
  ok(/\d/.test(leadMe.big), '지점장도 자기 점수를 본다 (' + leadMe.big.trim() + ')');
  ok(leadMe.cur === 12, '배워서 터치할 것 ' + leadMe.cur + '개');
  ok(leadMe.up >= 1 && leadMe.up <= 3, '올릴 수 있는 곳이 ' + leadMe.up + '개 뽑힌다');
  if (SHOT) { await L.page.evaluate(() => gbGoFace('lead')); await L.page.waitForTimeout(500);
    await L.page.screenshot({ path: SHOT + '/gb-lead.png', fullPage: true }); }

  /* ═══ 팀원으로 ═══ */
  console.log('── 팀원');
  const M = await openAs(browser, { id: 'p_mid', name: '중간해', role: 'member' });
  errs.push(...M.errs);
  await M.page.evaluate(() => go('growboard'));
  await M.page.waitForTimeout(2200);

  const mem = await M.page.evaluate(() => ({
    faceTabs: document.querySelectorAll('.gb-fb').length,
    big: (document.querySelector('.gb-big .n') || {}).textContent || '',
    name: (document.querySelector('.gb-big .s b') || {}).textContent || '',
    hit: (document.querySelector('.gb-hit') || {}).textContent || '',
    ax: document.querySelectorAll('.gb-ax').length,
    cur: document.querySelectorAll('.gb-cu').length,
    notes: document.querySelectorAll('.gb-nt').length,
    lead: document.querySelectorAll('.gb-ms').length,
    many: GB.many
  }));
  ok(mem.faceTabs === 0, '팀원에게는 팀 보기 탭이 없다 — 자기 화면만');
  ok(mem.name === '중간해', '내 이름이 나온다');
  ok(mem.ax === 6, '여섯 축이 모두 나온다');
  ok(/여기가 가장 벌어져 있습니다/.test(mem.hit), '가장 벌어진 축이 하나 뽑힌다 — ' +
    mem.hit.replace(/\s+/g, ' ').slice(0, 60));
  ok(mem.cur === 12, '배워서 터치할 것 ' + mem.cur + '개');
  ok(mem.notes >= 1, '받은 피드백이 ' + mem.notes + '건 보인다');
  ok(mem.lead === 0, '팀원 화면에는 놓친 사람 목록이 없다');

  const cmp = await M.page.evaluate(() => {
    var r = gbMe(), list = gbScope();
    return { mine: r.sc.call, avg: gbAvg(list, 'call'), top: gbTop(list, 'call'),
      labels: Array.prototype.map.call(document.querySelectorAll('.gb-ax:first-of-type .gb-b .l'), e => e.textContent) };
  });
  ok(cmp.top > cmp.mine, '잘하는 사람이 나보다 높게 나온다 (' + cmp.mine + ' vs ' + cmp.top + ')');
  ok(cmp.labels.join(',') === '나,팀 평균,잘하는 사람', '나 / 팀 평균 / 잘하는 사람 세 줄로 견준다');

  /* 습관 처방이 축마다 다른지 */
  const fixes = await M.page.evaluate(() => GB_AX.map(a => a.fix));
  ok(new Set(fixes).size === 6, '습관 처방이 축마다 다르다 (' + new Set(fixes).size + '가지)');

  /* 스스로 합격 도장 */
  const before = await M.page.evaluate(() => ({ n: gbPassN('p_mid'), sc: gbMe().sc.stu, total: gbMe().total }));
  await M.page.evaluate(() => gbStamp('s7'));
  await M.page.waitForTimeout(700);
  const after = await M.page.evaluate(() => ({
    n: gbPassN('p_mid'), sc: gbMe().sc.stu, total: gbMe().total,
    up: window.__ups.filter(x => x.tbl === 'daily_checks' && x.row.scope === 'pass'),
    on: document.querySelectorAll('.gb-cu.on').length
  }));
  ok(after.n === before.n + 1, '합격을 찍으면 개수가 오른다 (' + before.n + ' → ' + after.n + ')');
  ok(after.sc > before.sc, '공부 점수가 오른다 (' + before.sc + ' → ' + after.sc + ')');
  ok(after.total > before.total, '전체 점수도 오른다 (' + before.total + ' → ' + after.total + ')');
  ok(after.up.length === 1 && after.up[0].row.scope === 'pass' && after.up[0].row.check_date === '2000-01-01',
    '합격이 서버(daily_checks scope=pass)로 저장된다');
  ok(after.up[0].row.items.s7 === 1, '찍은 주제가 그대로 담긴다');
  ok(after.on === after.n, '화면에도 ' + after.on + '개가 체크돼 있다');

  /* 다시 누르면 취소 */
  await M.page.evaluate(() => gbStamp('s7'));
  await M.page.waitForTimeout(600);
  const undo = await M.page.evaluate(() => gbPassN('p_mid'));
  ok(undo === before.n, '다시 누르면 합격이 취소된다');

  /* 커리큘럼이 화법서와 이어져 있는지 */
  const link = await M.page.evaluate(() => {
    var ids = {}; FP_CH.forEach(c => ids[c[0]] = 1);
    return GB_CUR.filter(c => !ids[c[2]]).map(c => c[0]);
  });
  ok(link.length === 0, '열두 주제가 모두 실제 화법서 장으로 이어진다' + (link.length ? ' — ' + link.join(',') : ''));

  const tabs = await M.page.evaluate(() => {
    var ids = {}; TABS.forEach(g => g.items.forEach(i => ids[i.id] = 1));
    var bad = GB_AX.filter(a => !ids[a.tab] && a.tab !== 'growboard').map(a => a.tab);
    return { bad: bad, one: TABS.filter(g => g.group === '성장·교육')[0].items.length };
  });
  ok(tabs.bad.length === 0, '축마다 연결된 화면이 실제로 있다');
  ok(tabs.one === 1, '성장·교육 메뉴가 하나로 합쳐졌다 (' + tabs.one + '개)');

  /* 옛 화면들이 그대로 살아 있는지 — 아무것도 깨뜨리지 않았는지 */
  const still = [];
  for (const t of ['teamx', 'growth', 'ckteam', 'branch_coach', 'mycoach']) {
    const r = await M.page.evaluate(x => {
      try { go(x); var d = document.getElementById('dyn') || document.querySelector('.tab-pane.on') || document.body;
        return (d.textContent || '').replace(/\s+/g, '').length; } catch (e) { return -1; }
    }, t);
    await M.page.waitForTimeout(180);
    if (r < 40) still.push(t + '(' + r + ')');
  }
  ok(still.length === 0, '메뉴에서 뺀 화면도 그대로 열린다' + (still.length ? ' — ' + still.join(',') : ''));

  await M.page.evaluate(() => go('growboard'));
  await M.page.waitForTimeout(900);
  await M.page.setViewportSize({ width: 390, height: 900 });
  await M.page.waitForTimeout(500);
  const w = await M.page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(w.sw <= w.cw + 2, '390px 가로 스크롤 없음 (' + w.sw + '/' + w.cw + ')');
  if (SHOT) await M.page.screenshot({ path: SHOT + '/gb-me-m.png', fullPage: true });
  if (SHOT) { await M.page.setViewportSize({ width: 1240, height: 1100 }); await M.page.waitForTimeout(400);
    await M.page.screenshot({ path: SHOT + '/gb-me.png', fullPage: true }); }

  await browser.close(); srv.close();
  console.log('');
  if (errs.length) { console.log('콘솔 오류 ' + errs.length + '건'); errs.slice(0, 6).forEach(e => console.log('   ' + e.slice(0, 170))); }
  if (fail.length) { console.log('실패 ' + fail.length + '건'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
  if (errs.length) process.exit(1);
  console.log('성장판 점검 통과');
})().catch(e => { console.error('오류:', e); process.exit(1); });
