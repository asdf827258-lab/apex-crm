/* 자비스 — 말하면 찾아서 진짜로 하는가.

   화면이 뜨는 것은 아무것도 증명하지 않는다.
   "전화 5통 체크해줘" 라고 말한 뒤 기록이 실제로 바뀌었는지,
   "박서준한테 남겨줘" 가 서버에 실제로 들어갔는지를 봐야 한 것이다.

   그래서 여기서는 말을 시키고 나서 저장된 값을 직접 읽어 확인한다.
   AI 는 가짜로 붙인다 — 무엇을 골라 주든 앱이 그대로 실행하는지가 문제다.   */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8821;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

/* 서버는 가짜 — 무엇이 들어왔는지만 그대로 모아 둔다 */
const STUB = `
window.__ins=[];
window.supabase={createClient:function(){
 var mk=function(tbl){
  var f={},a={
   select:function(){return a},gte:function(){return a},lte:function(){return a},is:function(){return a},
   neq:function(){return a},in:function(){return a},not:function(){return a},order:function(){return a},
   limit:function(){return a},single:function(){return a},range:function(){return a},
   eq:function(k,v){f[k]=v;return a},
   insert:function(r){window.__ins.push({t:tbl,r:r});return a},
   update:function(){return a},
   upsert:function(r){window.__ins.push({t:tbl+':up',r:r});return a},
   then:function(res){
     var out=[];
     if(tbl==='profiles')out=[{id:'jv',name:'점검',role:'owner',active:true,plan:'vip'}];
     return Promise.resolve({data:out,error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'jv',email:'jv@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'jv'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

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

  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'jv', name: '점검', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'jv', email: 'jv@t' } };
    OS.cfg = { schema_version: '32' };
    window.__toast = []; window.toast = m => window.__toast.push('' + m);
    /* 소리는 내지 않고, 말한 것만 모은다 */
    window.__spoke = [];
    window.vaSay = function (t, then) { window.__spoke.push('' + t); if (then) setTimeout(then, 1); };
    window.aiReady = () => true;
    /* AI 는 시킨 대로만 답한다 — 앱이 그 답을 실제로 실행하는지가 문제다 */
    window.__ai = []; window.__reply = '';
    window.callAI = function (sys, usr) {
      window.__ai.push({ sys: '' + sys, usr: '' + usr });
      return new Promise(r => setTimeout(() => r(window.__reply), 40));
    };
    /* 서버로 밀어 올리는 것은 막는다 — 기록 자체가 바뀌었는지만 본다 */
    window.ckPush = function () { }; window.hpPush = function () { };
    try { localStorage.clear(); } catch (e) { }
    HELP.list = []; HELP.loaded = true;
    VA.speak = false; VA.pend = null; VA.conf = null; VA.hist = []; VA.log = [];
  });

  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };
  /* 말을 걸고, 답이 나올 때까지 기다린다 */
  const say = async (t, ms) => {
    await page.evaluate(x => { window.__spoke = []; vaRun(x); }, t);
    await page.waitForTimeout(ms || 260);
    return page.evaluate(() => ({
      spoke: window.__spoke.join(' | '),
      ai: window.__ai.length,
      tab: (typeof lastTab !== 'undefined') ? lastTab : '',
      pend: VA.pend ? VA.pend.need : '',
      conf: VA.conf ? VA.conf.k : ''
    }));
  };

  /* ── 사전 자체 ── */
  const reg = await page.evaluate(() => ({
    n: VA_ACT.length,
    keys: VA_ACT.map(a => a.k),
    noRun: VA_ACT.filter(a => typeof a.run !== 'function').map(a => a.k),
    noName: VA_ACT.filter(a => !a.n || !a.ex).map(a => a.k),
    dup: VA_ACT.map(a => a.k).filter((k, i, L) => L.indexOf(k) !== i),
    list: vaActList()
  }));
  ok(reg.n >= 15, '시킬 수 있는 일이 ' + reg.n + '가지 있다');
  ok(reg.noRun.length === 0, '모든 명령에 실제로 하는 코드가 붙어 있다' + (reg.noRun.length ? ' — ' + reg.noRun : ''));
  ok(reg.noName.length === 0, '모든 명령에 이름과 예시가 있다' + (reg.noName.length ? ' — ' + reg.noName : ''));
  ok(reg.dup.length === 0, '키가 겹치지 않는다' + (reg.dup.length ? ' — ' + reg.dup : ''));
  ok(reg.keys.every(k => reg.list.indexOf(k) >= 0), 'AI 에게 주는 목록에 모든 명령이 들어 있다');

  /* ── 말로 체크판을 실제로 바꾼다 ── */
  let r = await say('전화 5통 체크해줘');
  let st = await page.evaluate(() => ({ m: ckLoad('day'), n: CK_ITEMS.day.length }));
  ok(st.m.d4 === 1, '"전화 5통 체크해줘" → 그 항목이 실제로 체크된다');
  ok(/전화 5통 체크했습니다/.test(r.spoke), '무엇을 체크했는지 말해 준다 — ' + r.spoke.slice(0, 40));
  ok(/\d+개 남았습니다/.test(r.spoke), '몇 개 남았는지까지 알려 준다');
  ok(r.ai === 0, '이 정도 말은 AI 없이 그 자리에서 알아듣는다');

  r = await say('전화 5통 체크해줘');
  ok(/이미 체크/.test(r.spoke), '이미 되어 있으면 다시 하지 않고 그렇다고 말한다');

  r = await say('전화 5통 체크 풀어줘');
  st = await page.evaluate(() => ckLoad('day'));
  ok(!st.d4, '"체크 풀어줘" → 실제로 풀린다');

  r = await say('없는항목 체크해줘');
  ok(/찾지 못했습니다/.test(r.spoke), '없는 항목은 찾지 못했다고 말한다 — 아무거나 찍지 않는다');

  /* 말을 흘려도 알아듣는다 */
  await page.evaluate(() => { var m = ckLoad('day'); delete m.d10; ckSave('day', m); });
  r = await say('에스엔에스 체크해줘');
  st = await page.evaluate(() => ckLoad('day'));
  ok(st.d10 === 1, '"에스엔에스" 처럼 흘려 말해도 SNS 1건을 찾아낸다');

  /* ── 도와줄 것 ── */
  r = await say('도와줄 것 김민수 심사 확인');
  let hp = await page.evaluate(() => ({ n: HELP.list.length, last: (HELP.list[0] || {}).what || '', due: (HELP.list[0] || {}).due }));
  ok(hp.n === 1 && /김민수/.test(hp.last), '"도와줄 것 …" → 실제로 적힌다');

  r = await say('도와줄 것 뭐 있어');
  hp = await page.evaluate(() => HELP.list.length);
  ok(hp === 1, '"도와줄 것 뭐 있어" 는 묻는 말이다 — 그 말을 적어 버리지 않는다');
  ok(/김민수/.test(r.spoke) && /1건/.test(r.spoke), '무엇이 있는지 읽어 준다 — ' + r.spoke.slice(0, 40));

  r = await say('김민수 심사 처리했어');
  hp = await page.evaluate(() => ({ done: (HELP.list[0] || {}).done }));
  ok(hp.done === 1, '"처리했어" → 실제로 끝냄 표시가 된다');

  /* ── 값이 모자라면 되묻는다 ── */
  r = await page.evaluate(() => { window.__spoke = []; vaDo(vaActOf('체크'), {}); return { spoke: window.__spoke.join(' '), pend: VA.pend ? VA.pend.need : '' }; });
  ok(r.pend === 'what', '값이 없으면 그 값을 기다린다');
  ok(/어떤 것을 체크할까요/.test(r.spoke), '무엇이 필요한지 되묻는다');

  await page.evaluate(() => { var m = ckLoad('day'); delete m.d5; ckSave('day', m); });
  r = await say('카톡 5건');
  st = await page.evaluate(() => ckLoad('day'));
  ok(st.d5 === 1, '되물은 뒤 답만 말해도 이어서 실행한다');
  ok(!(await page.evaluate(() => !!VA.pend)), '실행하고 나면 기다림이 풀린다');

  r = await page.evaluate(() => { vaDo(vaActOf('체크'), {}); window.__spoke = []; vaRun('아니 됐어'); return { spoke: window.__spoke.join(' '), pend: !!VA.pend }; });
  ok(/취소했습니다/.test(r.spoke) && !r.pend, '되묻는 중에 "아니" 하면 취소된다');

  /* ── 남이 보게 되는 일은 먼저 확인받는다 ── */
  await page.evaluate(() => {
    GB.loaded = true; GB.busy = false; GB.notes = []; GB.pass = {}; GB.team = '';
    GB.rows = [{ id: 'm1', name: '박서준', team: '', sc: {}, raw: {}, total: 60 }];
    window.__ins = [];
  });
  r = await page.evaluate(() => {
    window.__spoke = [];
    vaDo(vaActOf('피드백'), { who: '박서준', what: '이번 주 잘했다' });
    return { spoke: window.__spoke.join(' '), conf: VA.conf ? VA.conf.k : '', ins: window.__ins.length };
  });
  ok(r.conf === '피드백', '팀원에게 남기는 일은 바로 하지 않는다');
  ok(/할까요/.test(r.spoke), '먼저 물어본다 — ' + r.spoke.slice(0, 46));
  ok(r.ins === 0, '확인 전에는 서버로 아무것도 보내지 않는다');

  r = await page.evaluate(() => { window.__spoke = []; vaRun('아니'); return { spoke: window.__spoke.join(' '), ins: window.__ins.length, conf: !!VA.conf }; });
  ok(/취소했습니다/.test(r.spoke) && r.ins === 0 && !r.conf, '"아니" 하면 아무 일도 일어나지 않는다');

  await page.evaluate(() => { vaDo(vaActOf('피드백'), { who: '박서준', what: '이번 주 잘했다' }); });
  r = await page.evaluate(() => { window.__spoke = []; vaRun('응'); return {}; });
  await page.waitForTimeout(400);
  const note = await page.evaluate(() => ({
    ins: window.__ins.filter(x => x.t === 'coach_notes'),
    spoke: window.__spoke.join(' ')
  }));
  ok(note.ins.length === 1, '"응" 하면 그때 실제로 저장된다');
  ok(note.ins.length === 1 && note.ins[0].r.member_id === 'm1', '엉뚱한 사람이 아니라 박서준에게 간다');
  ok(note.ins.length === 1 && /잘했다/.test(note.ins[0].r.body || ''), '말한 내용이 그대로 들어간다');
  ok(/박서준님에게 남겼습니다/.test(note.spoke), '누구에게 남겼는지 말해 준다');

  /* ── 합격 도장 ── */
  await page.evaluate(() => { window.__ins = []; window.gbMyId = () => 'm1'; });
  r = await say('암 합격 도장 찍어줘', 400);
  const pass = await page.evaluate(() => ({
    p: (GB.pass['m1'] || {}), up: window.__ins.filter(x => x.t === 'daily_checks:up')
  }));
  ok(!!pass.p.s2, '"암 합격 도장" → 그 주제가 실제로 합격이 된다');
  ok(pass.up.length === 1 && pass.up[0].r.scope === 'pass', '서버에도 합격으로 올라간다');

  /* ── 읽어 주는 것들 ── */
  r = await say('오늘 브리핑해줘');
  ok(/할 일은/.test(r.spoke), '"브리핑해줘" → 오늘 상황을 한 번에 읽어 준다');
  ok(r.ai === 0, '브리핑도 AI 없이 앱이 답한다');

  r = await say('누구부터 봐야 돼');
  ok(/놓치고 있는/.test(r.spoke), '"누구부터 봐야 돼" → 성장판에서 답한다');

  /* ── AI 가 고른 명령을 실제로 실행한다 ── */
  await page.evaluate(() => { var m = ckLoad('day'); delete m.d11; ckSave('day', m); });
  await page.evaluate(() => { window.__reply = '!실행 체크 {"what":"공부 30분"}\n공부 30분 체크하겠습니다.'; });
  r = await say('아까 그거 있잖아 책 읽은 거 처리 좀', 500);
  st = await page.evaluate(() => ckLoad('day'));
  ok(r.ai === 1, '규칙에 없는 말은 AI 에게 한 번 물어본다');
  ok(st.d11 === 1, 'AI 가 고른 명령이 실제로 실행된다 — 말로만 끝나지 않는다');
  ok(/공부 30분 체크했습니다/.test(r.spoke), '한 일을 앱이 직접 확인해 말해 준다');

  /* AI 가 없는 명령을 지어내면 실행하지 않는다 */
  await page.evaluate(() => { window.__reply = '!실행 고객삭제 {"name":"김민수"}\n삭제하겠습니다.'; });
  r = await say('그거 좀 어떻게 해봐', 500);
  ok(/아직 못 하는 일/.test(r.spoke), '사전에 없는 일은 지어내도 실행되지 않는다');
  ok(!/삭제하겠습니다/.test(r.spoke),
    '앱이 하지 않은 것을 했다고 읽어 주지 않는다 — AI 가 뭐라 했든');

  /* !실행 이 없으면 그냥 답이다 */
  await page.evaluate(() => { window.__reply = '먼저 듣고 나서 말하는 것이 좋습니다.'; });
  r = await say('상담할 때 뭐부터 해야 할까', 500);
  ok(/먼저 듣고/.test(r.spoke), '생각이 필요한 말은 예전처럼 답으로 돌아온다');
  ok(!/!실행/.test(r.spoke), '명령 표시는 사람에게 읽히지 않는다');

  /* AI 프롬프트에 명령 사전이 실려 있다 */
  const sys = await page.evaluate(() => (window.__ai[window.__ai.length - 1] || {}).sys || '');
  ok(/!실행/.test(sys) && /체크/.test(sys), 'AI 에게 무엇을 시킬 수 있는지 함께 알려 준다');

  /* ── 안전 ── */
  await page.evaluate(() => { window.__ins = []; });
  r = await page.evaluate(() => {
    window.__spoke = [];
    vaDo(vaActOf('도와줄것'), { what: '계좌번호 110234567890 확인' });
    return { spoke: window.__spoke.join(' '), n: HELP.list.length };
  });
  ok(/말로 넣지 마세요|다루지 않습니다/.test(r.spoke), '긴 숫자가 섞이면 저장하지 않고 막는다');
  ok(r.n === 1, '막힌 것은 실제로 저장되지 않았다');

  /* ── 오래된 되물음은 되살아나지 않는다 ── */
  r = await page.evaluate(() => {
    VA.pend = { k: '체크', args: {}, need: 'what', at: 1 };
    window.__spoke = [];
    vaRun('체크판 열어');
    return { spoke: window.__spoke.join(' '), pend: !!VA.pend };
  });
  ok(/엽니다/.test(r.spoke) && !r.pend, '한참 지난 되물음은 새 명령을 가로채지 않는다');

  /* ── 실행하다 터져도 비서는 살아 있다 ── */
  r = await page.evaluate(() => {
    window.__spoke = [];
    vaFire({ k: 'x', n: 'x', run: function () { throw new Error('일부러'); } }, {});
    return { spoke: window.__spoke.join(' '), busy: VA.busy };
  });
  ok(/하지 못했습니다/.test(r.spoke), '실행하다 터지면 이유를 말해 준다');
  ok(!r.busy, '터져도 멈춘 채로 남지 않는다');

  ok(errs.length === 0, '자바스크립트 오류 없음' + (errs.length ? ' — ' + errs.join(' / ') : ''));

  await browser.close(); srv.close();
  if (fail.length) { console.log('\n✗ 실패 ' + fail.length + '건'); fail.forEach(f => console.log('   - ' + f)); process.exit(1); }
  console.log('\n자비스 점검 통과');
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
