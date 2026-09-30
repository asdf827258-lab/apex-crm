/* ══════════════════════════════════════════════════════════════════
   check-ntcpage.js — <b>공지가 제 화면을 갖는다.</b> 홈에서는 빠진다.

   2026-09-30 사장님 말씀 — 「메인에서 공지사항 홈에서는 없애고, 따로
   공지사항 칸 들어가면 거기서 관리할수 있도록해」.

   ★★ <b>이 자가 있는 진짜 까닭 — 「옮기는 것」 과 「지우는 것」 은 다릅니다.</b>
     2026-09-27 에 같은 말씀으로 홈에서 한 번 뺐다가 <b>되돌렸습니다.</b>
     그때는 공지 사진(osNtcImgHtml)이 <b>홈에만</b> 있어서, 빼는 순간 앱
     어디에서도 공지 사진을 볼 수 없었습니다. 서랍에는 사진 칸이 없습니다.
     홈의 그 자리에 「공지가 <b>제 화면</b>을 갖기 전에는 여기서 못 뺀다」 고
     적혀 있었습니다 — 이번에는 화면을 <b>먼저 만들고</b> 뺐습니다.
     이 자는 그 둘을 <b>함께</b> 봅니다: 홈에서 빠졌나 <b>그리고</b>
     빠진 것이 새 화면에 <b>다 있나</b>. 하나만 보면 다시 지울 수 있습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 공지사항이 <b>메뉴에 서고</b> 열린다
     [2] 그 화면에서 <b>읽고 · 대표는 관리까지</b> 된다
     [3] ★★ <b>홈에는 공지가 없다</b> (사장님이 통째로 없애라 하셨습니다)
     [4] ★★ <b>지운 것이 아니다</b> — 사진·확인요청·관리가 새 화면에 다 있다
     [5] <b>베끼지 않았나</b> — 그리는 함수가 한 벌이고, 설정에는
         <b>옮긴 자리 한 줄</b>이 남아 있나 (6번 · 찾던 사람이 헤매지 않게)
     [6] <b>팀원에게는 관리 칸이 안 보인다</b> (사장님 답 「모두 보고 · 대표만 관리」)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9123;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u.indexOf('/.netlify/functions/push') === 0) {
    s.writeHead(200, { 'Content-Type':'application/json' }); s.end('{"key":null,"has":false}'); return; }
  let p = path.join(ROOT, u);
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});

/* 견본은 <b>홍길동</b> (3번). 사진 한 장 든 공지를 하나 심습니다 —
   「사진 자리가 새 화면에 따라왔나」 를 보려면 사진이 있어야 합니다. */
const SEED = (role) => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id:'me', name:'홍길동', role: role, active:true, plan:'vip', team_id:'t1' };
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ if(cb)cb(); };
  window.toast=function(){}; window.setupDone=function(){return true;};
  window.setupCanRun=function(){return true;};
  /* 서버는 빈 답을 곧바로 — 안 막으면 「그날 망 사정」 을 재게 됩니다 */
  const chain = v => { const o = { then:function(f){ try{f(v);}catch(e){} return o; },
                                   catch:function(){ return o; } };
    ['eq','neq','select','order','limit','in','gte','lte','is','not','or','filter',
     'ilike','like','range','contains','overlaps'].forEach(k => { o[k]=function(){ return o; }; });
    o.single=function(){ return chain({data:null}); };
    o.maybeSingle=function(){ return chain({data:null}); }; return o; };
  window.osClient=function(){ return { from:function(){ return {
      select:function(){ return chain({data:[],count:0}); }, update:function(){ return chain({}); },
      insert:function(){ return chain({}); }, upsert:function(){ return chain({}); },
      delete:function(){ return chain({}); } }; } }; };
  try { OSC.loaded=true; OSC.busy=false; OSC.err=''; OSC.list=[]; CM.loaded=true; CM.meta={}; } catch(e){}
  try { AR.loaded=true; AR.busy=''; AR.cliRows=[]; AR.db=[]; } catch(e){}
  /* 공지 한 칸 — 사진 · 글 · <b>나에게</b> 확인 요청.
     ⚠ <b>OS_NOTICE 는 낱개</b>이고 여러 칸은 OS_NTC.list 입니다. 처음에
       OS_NOTICE 에 배열을 심었다가 한 칸도 안 섰습니다 — 자가 제 씨앗을
       못 세워 놓고 「안 보인다」 고 울렸습니다. 심는 자리를 맞춥니다. */
  const 한칸 = { id:'n1', text:'이번 주 팀 미팅은 목요일 오후 2시입니다.', on:true,
    img:'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
    mustAck:true, targets:['me'], ts:'2026-09-30', by:'홍길동' };
  OS_NOTICE = 한칸;
  try { OS_NTC.list=[한칸]; OS_NTC.loaded=true; OS_NTC.at=Date.now(); OS_NTC.err=''; } catch(e){}
  window.osNoticeLoad=function(){};      /* 심은 것을 서버가 덮지 않게 */
  go('home');
};
const 본다 = (sel) => { const h=document.getElementById('dynPane');
  return !!(h && h.querySelector(sel)); };

(async () => {
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');

  console.log('\n[5] <b>베끼지 않았나</b> — 그리는 함수가 한 벌인가 (5번)');
  [['osNoticeHomeHtml','읽는 자리'],['osNoticeCardHtml','관리 자리'],['renderNotice','화면']]
    .forEach(([f, w]) => {
      const n = (src.match(new RegExp('function\\s+' + f + '\\s*\\(', 'g')) || []).length;
      is(n === 1, '  ' + f.padEnd(18) + w + ' 를 그리는 함수가 <b>하나</b>다 — ' + n + '개');
    });
  is(/function renderNotice\(\)[\s\S]{0,700}osNoticeHomeHtml\(\)[\s\S]{0,400}osNoticeCardHtml\(\)/.test(src),
     '  새 화면이 그 둘을 <b>그대로 부른다</b> — 베낀 것이 아니다');
  /* ★ 설정에서 찾던 분이 헤매지 않게 — 옮긴 자리 한 줄 (6번) */
  /* ⚠ 파일 안에서는 JS 문자열이라 <b>go(\'notice\')</b> 로 적혀 있습니다 —
     처음에 따옴표만 찾다가 못 봤습니다. 둘 다 받습니다.               */
  is(/공지사항 화면으로 옮겼습니다[\s\S]{0,500}go\(\\?'notice\\?'\)/.test(src),
     '  설정에 <b>옮긴 자리 한 줄</b>이 남아 있다 — 지운 것이 아니다');

  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch();
  const 열기 = async (role) => {
    const ctx = await br.newContext({ viewport: { width: 430, height: 900 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', e => errs.push(String(e.message || e).slice(0, 120)));
    await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(2200);
    await pg.evaluate(SEED, role);
    await pg.waitForTimeout(1500);
    return { ctx, pg, errs };
  };

  /* ── 대표로 ─────────────────────────────────────────────────── */
  const A = await 열기('owner');
  console.log('\n[1] 공지사항이 <b>메뉴에 서고</b> 열린다');
  const 메뉴 = await A.pg.evaluate(() => {
    let hit = null;
    (TABS || []).forEach(g => (g.items || []).forEach(it => { if (it.id === 'notice') hit = { g: g.group, t: it.title, hide: !!it.hide }; }));
    return hit;
  });
  is(!!메뉴 && !메뉴.hide, '  메뉴에 있다 — ' + (메뉴 ? 메뉴.g + ' › ' + 메뉴.t : '없습니다'));
  const 열림 = await A.pg.evaluate(async () => {
    try { go('notice'); } catch (e) { return { err: String(e).slice(0, 90) }; }
    await new Promise(r => setTimeout(r, 1200));
    const h = document.getElementById('dynPane');
    return { 제목: (h.querySelector('.page-title') || {}).textContent || '',
             어디: (typeof currentTab === 'function') ? currentTab() : '' };
  });
  is(/공지/.test(열림.제목), '  열리고 제목이 <b>공지</b> 다 — 「' + (열림.제목 || 열림.err || '') + '」');
  is(열림.어디 === 'notice', '  「지금 어디」 가 <b>notice</b> 라고 답한다 — ' + 열림.어디 + ' (5번)');

  console.log('\n[2] 그 화면에서 <b>읽고 · 대표는 관리까지</b> 된다');
  const 대표 = await A.pg.evaluate((f) => {
    const g = (new Function('return (' + f + ')'))();
    return { 읽기: g('#osNoticeHome'), 글: /목요일 오후 2시/.test(document.getElementById('dynPane').innerText || ''),
             사진: g('#osNoticeHome img'), 확인: /확인/.test(document.getElementById('dynPane').innerText || ''),
             관리: g('#osNtcAdmin'), 올리는칸: g('#osNoticeText'), 게시: g('#osNoticeActive') };
  }, 본다.toString());
  is(대표.읽기 && 대표.글, '  <b>공지 글</b>이 보인다');
  is(대표.관리 && 대표.올리는칸 && 대표.게시, '  대표에게 <b>올리는 칸</b>이 있다 (글·게시)');

  console.log('\n[4] ★★ <b>지운 것이 아니다</b> — 홈에서 빠진 것이 여기 다 있나');
  console.log('    (2026-09-27 에 사진이 홈에만 있어 되돌린 자리입니다)');
  is(대표.사진, '  <b>공지 사진</b> 자리가 따라왔다 — 서랍에는 사진 칸이 없다');
  is(대표.확인, '  <b>확인 요청</b> 자리가 따라왔다');

  console.log('\n[3] ★★ <b>홈에는 공지가 없다</b> (사장님이 통째로 없애라 하셨습니다)');
  const 홈 = await A.pg.evaluate(async (f) => {
    const g = (new Function('return (' + f + ')'))();
    go('home'); await new Promise(r => setTimeout(r, 1400));
    const h = document.getElementById('dynPane');
    return { 자리: g('#osNoticeHome'), 관리: g('#osNtcAdmin'),
             글: /목요일 오후 2시/.test(h.innerText || '') };
  }, 본다.toString());
  is(!홈.자리 && !홈.관리, '  홈에 공지 <b>자리가 없다</b> (#osNoticeHome · #osNtcAdmin)');
  is(!홈.글, '  홈에 공지 <b>글이 안 뜬다</b>');
  /* ★ 그래도 <b>길은 있어야</b> 합니다 — 서랍 맨 위 공지 칸 (6번) */
  is(/onclick="go\(\\?'notice\\?'\)"/.test(src) || /go\('notice'\)/.test(src),
     '  <b>가는 길</b>이 있다 — 서랍·설정에서 공지사항으로 갈 수 있다');
  await A.ctx.close();

  /* ── 팀원으로 ───────────────────────────────────────────────── */
  console.log('\n[6] <b>팀원에게는 관리 칸이 안 보인다</b> (모두 보고 · 대표만 관리)');
  const B = await 열기('fp');
  const 팀원 = await B.pg.evaluate(async (f) => {
    const g = (new Function('return (' + f + ')'))();
    go('notice'); await new Promise(r => setTimeout(r, 1200));
    return { 읽기: g('#osNoticeHome'),
             글: /목요일 오후 2시/.test(document.getElementById('dynPane').innerText || ''),
             관리: g('#osNtcAdmin'), 올리는칸: g('#osNoticeText') };
  }, 본다.toString());
  is(팀원.읽기 && 팀원.글, '  팀원도 <b>공지를 읽는다</b>');
  is(!팀원.관리 && !팀원.올리는칸, '  팀원에게는 <b>올리는 칸이 없다</b>');
  is(B.errs.length === 0 && A.errs.length === 0,
     '  조용히 터진 곳이 없다 — ' + (A.errs.length + B.errs.length) + '건' +
     ((A.errs[0] || B.errs[0]) ? ' ← ' + (A.errs[0] || B.errs[0]) : ''));
  await B.ctx.close();
  await br.close(); srv.close();

  console.log('\n' + '─'.repeat(30));
  console.log(bad ? '✗ ' + bad + '개'
                  : '✓ 공지가 제 화면을 갖고, 홈에서는 빠졌고, 빠진 것이 다 따라왔습니다.');
  process.exit(bad ? 1 : 0);
})();
