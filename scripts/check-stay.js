/* 보던 화면에서 안 튕기는가 · 쓰던 글이 안 날아가는가.

   「화면이 자꾸 딴 데로 돌아간다」 와 「계속 입력이 안 된다」 는
   같은 뿌리에서 나온 두 증상이었다.

   원인 1 — osSetReload() 가 무조건 go('settings') 를 불렀다.
     설정 화면을 다시 그리려고 만든 함수인데, 「AI 키가 없습니다」 같은
     안내에서도 이걸 불렀다. 보험 비서·니즈분석·두뇌·제안서 어디에
     있든 버튼 한 번에 설정으로 끌려갔다.

   원인 2 — Supabase 가 토큰을 갱신할 때마다(약 한 시간, 그리고 탭을
     다시 켤 때마다) onAuthStateChange 가 돌았고, 그때마다 프로필을
     새로 읽어 osOnLogin → go(현재탭) 으로 <b>화면을 통째로 다시
     그렸다.</b> 같은 사람인데도 보던 자리를 잃고, 입력하던 글이 지워졌다.

   그래서 여기서 확인한다.
     1. 다른 화면에서 osSetReload 를 불러도 그 자리에 그대로 있는가
     2. 같은 사람으로 토큰이 갱신돼도 화면을 다시 안 그리는가
     3. 그때 입력하던 글이 살아 있는가
     4. 사람이 바뀌면(로그아웃·다른 계정) 그때는 제대로 다시 그리는가
     5. <b>새로고침해도 보던 화면 그대로인가</b> — 사장님 말씀 「내가 킨
        화면이 내가 끄지 않는 이상 처음으로 돌아가지 않도록」            */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8849;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

/* 토큰 갱신을 마음대로 일으킬 수 있는 가짜 서버 */
const STUB = `
window.__authCb=null;
window.__profileReads=0;
window.supabase={createClient:function(){
 var mk=function(tbl){var one=false;var a={
   select:function(){return a},eq:function(){return a},gte:function(){return a},lte:function(){return a},
   is:function(){return a},neq:function(){return a},in:function(){return a},not:function(){return a},
   order:function(){return a},limit:function(){return a},range:function(){return a},
   single:function(){one=true;return a},insert:function(){return a},update:function(){return a},upsert:function(){return a},
   then:function(res){
     if(tbl==='profiles')window.__profileReads++;
     var row=(tbl==='profiles')?{id:'u1',name:'점검',role:'owner',active:true,plan:'vip',workspace:'both',status:'approved'}:null;
     var d=one?row:(row?[row]:[]);
     return Promise.resolve({data:d,error:null}).then(res);}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{
   getSession:function(){return Promise.resolve({data:{session:{user:{id:'u1',email:'u1@test'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'u1'}}})},
   onAuthStateChange:function(cb){window.__authCb=cb;return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

let pass = 0, fail = 0;
const ok = m => { pass++; console.log('  ✓ ' + m); };
const no = m => { fail++; console.log('  ✗ ' + m); };
const is = (c, m) => c ? ok(m) : no(m);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2400);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'u1', name: '점검', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'u1', email: 'u1@test' } };
    window.toast = function () {};
  });

  const ready = await page.evaluate(() => typeof osSetReload === 'function' && typeof go === 'function');
  if (!ready) {
    console.log('✗ 앱이 뜨지 않았습니다.');
    errs.slice(0, 4).forEach(m => console.log('    ' + m));
    await browser.close(); srv.close(); process.exit(1);
  }

  /* ── 1 ── */
  console.log('\n[1] 다른 화면에서 안내가 떠도 그 자리에 남는가');
  const spots = ['brain', 'ins_asst', 'cs_needs', 'ai_prop', 'clients', 'bojang', 'contracts'];
  let moved = [];
  for (const t of spots) {
    const r = await page.evaluate(tab => {
      go(tab);
      var before = lastTab;
      osSetReload();                 /* 「AI 키가 없습니다」 안내가 부르는 그 함수 */
      return { before: before, after: lastTab };
    }, t);
    await page.waitForTimeout(80);
    if (r.after !== r.before) moved.push(t + '→' + r.after);
  }
  is(moved.length === 0,
    spots.length + '개 화면에서 눌러도 자리를 안 뺏는다' + (moved.length ? ' — 튄 곳: ' + moved.join(', ') : ''));

  /* 설정에 있을 때는 제대로 다시 그린다 */
  const inSet = await page.evaluate(() => {
    go('settings');
    var n = 0, old = window.renderSettings;
    window.renderSettings = function () { n++; return old.apply(this, arguments); };
    osSetReload();
    window.renderSettings = old;
    return { tab: lastTab, painted: n };
  });
  is(inSet.tab === 'settings' && inSet.painted >= 1, '설정 화면에서는 제대로 다시 그린다');

  /* 사람이 눌러 설정으로 갈 길은 남아 있다 */
  const door = await page.evaluate(() => {
    go('clients');
    osGoSettings();
    return lastTab;
  });
  is(door === 'settings', '사람이 직접 누르면 설정으로 간다 (osGoSettings)');

  /* ── 2 ── */
  console.log('\n[2] 토큰이 갱신돼도 화면·입력이 살아 있는가');
  const keep = await page.evaluate(async () => {
    go('brain');
    /* 사람이 글을 쓰고 있는 상황을 만든다 */
    var ta = document.querySelector('#brainQ') || document.querySelector('textarea');
    if (ta) { ta.value = '고객이 종신보험 해지를 원합니다. 어떻게 상담하죠?'; }
    var beforeTab = lastTab, beforeReads = window.__profileReads;
    /* Supabase 가 한 시간마다 하는 그것 — 같은 사람으로 토큰만 갱신 */
    window.__authCb('TOKEN_REFRESHED', { user: { id: 'u1', email: 'u1@test' } });
    await new Promise(function (r) { setTimeout(r, 600); });
    var ta2 = document.querySelector('#brainQ') || document.querySelector('textarea');
    return { beforeTab: beforeTab, afterTab: lastTab,
      text: ta2 ? ta2.value : '(칸 없음)', hadBox: !!ta,
      readsBefore: beforeReads, readsAfter: window.__profileReads };
  });
  is(keep.afterTab === keep.beforeTab,
    '토큰이 갱신돼도 보던 화면 그대로 (' + keep.beforeTab + ' → ' + keep.afterTab + ')');
  is(keep.readsAfter === keep.readsBefore,
    '같은 사람이면 프로필을 다시 안 읽는다 (' + keep.readsBefore + ' → ' + keep.readsAfter + ')');
  is(!keep.hadBox || /종신보험 해지/.test(keep.text),
    '쓰던 글이 그대로 남는다 — ' + String(keep.text).slice(0, 26));

  /* 여러 번 갱신돼도 마찬가지 */
  const many = await page.evaluate(async () => {
    go('clients');
    var t0 = lastTab, r0 = window.__profileReads;
    for (var i = 0; i < 5; i++) window.__authCb('TOKEN_REFRESHED', { user: { id: 'u1', email: 'u1@test' } });
    await new Promise(function (r) { setTimeout(r, 500); });
    return { same: lastTab === t0, tab: lastTab, reads: window.__profileReads - r0 };
  });
  is(many.same, '다섯 번 갱신돼도 자리를 안 뺏는다 (' + many.tab + ')');
  is(many.reads === 0, '헛되이 서버를 안 부른다 (' + many.reads + '번)');

  /* ── 3 ── */
  console.log('\n[3] 사람이 바뀌면 그때는 제대로 다시 그리는가');
  const changed = await page.evaluate(async () => {
    var r0 = window.__profileReads;
    window.__authCb('SIGNED_IN', { user: { id: 'u2', email: 'u2@test' } });
    await new Promise(function (r) { setTimeout(r, 600); });
    return { reads: window.__profileReads - r0 };
  });
  is(changed.reads >= 1, '다른 계정으로 바뀌면 프로필을 다시 읽는다 (' + changed.reads + '번)');

  const out = await page.evaluate(async () => {
    var gate = false;
    window.osShowLoginGate = function () { gate = true; };
    window.__authCb('SIGNED_OUT', null);
    await new Promise(function (r) { setTimeout(r, 400); });
    return { gate: gate, prof: !!OS.profile };
  });
  is(out.gate === true && out.prof === false, '로그아웃하면 잠금 화면이 뜬다');

  /* ── 4 ── */
  console.log('\n[4] 보던 화면을 기억하는가');
  const mem = await page.evaluate(() => {
    OS.profile = { id: 'u1', name: '점검', role: 'owner', plan: 'vip' };
    window.toast = function () {};
    go('contracts');
    var saved = localStorage.getItem('apex_last_tab');
    /* 다음에 켤 때 어디로 갈지 정하는 곳 */
    var boot = (typeof bootTab === 'function') ? bootTab() : '';
    return { saved: saved, boot: boot };
  });
  is(mem.saved === 'contracts', '보던 화면이 기억된다 (' + mem.saved + ')');
  is(mem.boot === 'contracts', '다음에 켤 때 그 화면으로 간다 (' + mem.boot + ')');

  /* ── 5 ── 사장님 말씀: 「내가 킨 화면이 내가 끄지 않는 이상
     처음으로 돌아가지 않도록」                                        */
  console.log('\n[5] 새로고침해도 <b>보던 화면 그대로</b>인가');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');

  /* ① 첫 화면을 정하는 곳이 <b>한 곳</b>인가 (5번)
     초기화 자리에 go('home') 이 박혀 있으면, 그것이 파일 맨 끝의
     go(bootTab()) 보다 먼저 돌아 「보던 화면」 기억을 통째로 지운다 —
     lastTab · apex_last_tab · 주소(#해시) 셋 다 home 으로 덮이고,
     bootTab() 은 방금 덮인 값을 읽는다. 그래서 폰에서 화면을 아래로
     당기면(당겨서 새로고침) 무엇을 보고 있었든 홈이 열렸다. */
  /* <b>부팅 때 도는 줄만</b> 센다. 여태는 함수 안에 있는 go('home') 까지
     세었다 — 「← 홈」 단추처럼 <b>사장님이 누르실 때</b> 도는 것은 첫 화면을
     정하는 것이 아닌데도 빨간불이 켜졌다. 헛것을 잡는 점검은 안 잡는
     점검보다 나쁘다 (8번).

     이 파일은 최상위 함수를 <b>칸 0</b>에서 연다. 그래서 어떤 줄이 함수
     안인지는 <b>바로 앞의 최상위 `function`</b> 과 <b>바로 앞의 최상위 `}`</b>
     중 어느 것이 뒤에 있는지로 갈린다.

     ★ 이것은 <b>모양</b>을 보는 곁가지다. 진짜 자물쇠는 아래 「13개 화면이
       새로고침해도 그 자리」 — 실제로 다시 열어 보는 시험이다.            */
  const atTop = (idx) => {
    const before = SRC.slice(0, idx);
    return before.lastIndexOf('\nfunction ') <= before.lastIndexOf('\n}');
  };
  const bootRe = /^[ \t]*go\((?:'home'|"home"|bootTab\(\))\);[ \t]*$/gm;
  const boots = [];
  let bm;
  while ((bm = bootRe.exec(SRC)) !== null) if (atTop(bm.index)) boots.push(bm[0].trim());
  is(boots.length === 1 && boots[0] === 'go(bootTab());',
     '<b>부팅 때</b> 첫 화면을 정하는 줄이 하나다 — ' + (boots.join(' / ') || '없음') +
     (boots.length > 1 ? '  ← 초기화의 go(\'home\') 이 보던 화면을 지운다' : ''));

  /* ② 주소를 적는 곳도 한 곳 — go() 맨 끝에 두면 빠른 return 갈래
     (CRM·계산기·지도·비포&애프터·한장비교·미끼레이더·과실비교·미끼화법·
     상담자료·증권전달·보험맵)가 그 줄에 <b>닿지 못하고</b> 먼저 나간다. */
  const hashSets = (SRC.match(/history\.replaceState\(null,\s*''\s*,\s*'#'\+tab\)/g) || []);
  is(hashSets.length === 1, '주소(#해시)를 적는 줄도 <b>하나</b>다 — ' + hashSets.length + '곳');
  const goHead = SRC.slice(SRC.indexOf('function go(tab){'),
                           SRC.indexOf('function go(tab){') + 3000);
  is(/lastTab=tab;[\s\S]{0,1400}replaceState/.test(goHead),
     '주소를 <b>「지금 어디」를 적는 그 자리</b>에서 같이 적는다 — 빠른 return 보다 앞이다');

  /* ③ 아래로 당겨도 새로고침되지 않게 */
  is(/html\{[^}]*overscroll-behavior-y:\s*contain/.test(SRC) &&
     /\.main\{[^}]*overscroll-behavior-y:\s*contain/.test(SRC),
     '<b>아래로 당겨도 새로고침되지 않는다</b> — 스크롤 칸과 바탕 둘 다 막았다');

  /* ④ <b>진짜로</b> 새로고침해서 본다. 코드를 읽어 짐작하지 않는다.
     빠른 return 갈래를 골라 넣는다 — 여기가 주소를 못 적던 자리다. */
  const KEEP = ['crm', 'finance', 'apexmap', 'onecmp', 'mikki', 'car_fault',
                'mikki_talk', 'sangdam', 'pdel', 'bohum', 'clients', 'airep', 'mycal'];
  const lost = [];
  for (const t of KEEP) {
    await page.evaluate(x => { try { go(x); } catch (e) {} }, t);
    await page.waitForTimeout(260);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800);
    const got = await page.evaluate(() => (typeof lastTab === 'string' ? lastTab : ''));
    if (got !== t) lost.push(t + '→' + got);
  }
  is(lost.length === 0,
     KEEP.length + '개 화면이 <b>새로고침해도 그 자리</b>에 남는다' +
     (lost.length ? ('  ← ' + lost.join(', ')) : ''));

  const hard = errs.filter(m => !/ResizeObserver|Failed to fetch|NetworkError/i.test(m));
  is(hard.length === 0, '중간에 터진 곳이 없다' + (hard.length ? ' — ' + hard[0].slice(0, 100) : ''));

  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? '자리 지키기 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : '자리 지키기 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  await browser.close(); srv.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
