/* 고객 365일 — 밀접하게 관리되는가.

   고객 관리는 이름을 저장하는 것으로 되지 않는다.
   찾을 수 있어야 하고, 마지막으로 언제 만났는지 보여야 하고,
   다음에 무엇을 할지가 남아야 한다.

   그래서 여기서는 눌러 보고 나서 서버로 나간 것을 직접 읽어 확인한다.
   서버는 가짜로 붙이되, 들어온 것을 그대로 돌려주도록 만들어
   저장한 것이 다시 화면에 살아나는지까지 본다.                       */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8823;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

/* 가짜 서버 — saved_reports 는 쓴 것을 그대로 돌려준다 */
const STUB = `
window.__saved=[];
window.__seq=0;
window.__clients=[
 {id:'c1',advisor_id:'cl',name_masked:'김○○',consent_status:'granted',created_at:'2025-01-10T00:00:00Z',phone:'010-1234-5678'},
 {id:'c2',advisor_id:'cl',name_masked:'김○○',consent_status:'none',created_at:'2025-02-11T00:00:00Z',phone:'010-2222-3333'},
 {id:'c3',advisor_id:'p2',name_masked:'박○○',consent_status:'granted',created_at:'2025-03-12T00:00:00Z',phone:''},
 {id:'c4',advisor_id:'p3',name_masked:'최○○',consent_status:'none',created_at:'2024-01-05T00:00:00Z',phone:''}
];
window.supabase={createClient:function(){
 var mk=function(tbl){
  var f={},neq={},up=null,a={
   select:function(){return a},gte:function(){return a},lte:function(){return a},is:function(){return a},
   in:function(){return a},not:function(){return a},order:function(){return a},
   limit:function(){return a},single:function(){return a},range:function(){return a},
   eq:function(k,v){f[k]=v;return a},
   neq:function(k,v){neq[k]=v;return a},
   insert:function(r){
     if(tbl==='saved_reports'){r.id='r'+(++window.__seq);r.created_at=new Date().toISOString();
       window.__saved.push(JSON.parse(JSON.stringify(r)));}
     return a},
   update:function(r){up=r;return a},
   upsert:function(){return a},
   then:function(res){
     var out=[],i;
     if(up){
       var tgt=(tbl==='saved_reports')?window.__saved:(tbl==='clients'?window.__clients:[]);
       for(i=0;i<tgt.length;i++){
         var m=true,k;
         for(k in f)if((''+tgt[i][k])!==(''+f[k]))m=false;
         if(m)for(k in up)tgt[i][k]=JSON.parse(JSON.stringify(up[k]));
       }
       return Promise.resolve({data:null,error:null}).then(res);
     }
     if(tbl==='saved_reports'){
       out=window.__saved.filter(function(x){
         for(var k in f)if((''+x[k])!==(''+f[k]))return false;
         for(var k2 in neq)if((''+x[k2])===(''+neq[k2]))return false;
         return true;});
     }
     else if(tbl==='clients'){
       out=window.__clients.filter(function(x){for(var k in f)if((''+x[k])!==(''+f[k]))return false;return true;});
       if(f.id&&out.length)out=[out[0]];
     }
     else if(tbl==='profiles')out=[{id:'cl',name:'점검',role:'owner',active:true,plan:'vip'},
      {id:'p2',name:'박서준',role:'member',active:true},
      {id:'p3',name:'최민아',role:'member',active:true}];
     else if(tbl==='documents')out=[];
     return Promise.resolve({data:out,error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'cl',email:'cl@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'cl'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

const ago = n => { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
const later = n => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1240, height: 1200 } });
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
    OS.profile = { id: 'cl', name: '점검', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'cl', email: 'cl@t' } };
    OS.cfg = { schema_version: '32' };
    window.__toast = []; window.toast = m => window.__toast.push('' + m);
    try { localStorage.clear(); } catch (e) { }
  });

  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };
  /* 켜면 「내 고객」 으로 맞춰지는 것은 따로 확인한다(w0). 나머지 검사는 전원을 봐야 하므로 풀어 둔다. */
  const open = async () => { await page.evaluate(() => { OSC.view = 'list'; OSC.q = ''; CM.picked = true; CM.pick = ''; go('clients'); }); await page.waitForTimeout(500); };
  const list = () => page.evaluate(() => ({
    n: document.querySelectorAll('#oscList .cm-row').length,
    names: Array.prototype.map.call(document.querySelectorAll('#oscList .cm-nm'),
      e => ((e.firstChild && e.firstChild.textContent) || e.textContent || '').trim()),
    txt: (document.getElementById('oscList') || {}).textContent || ''
  }));

  await open();
  let L = await list();
  ok(L.n === 4, '고객 ' + L.n + '명이 목록에 나온다');

  /* ── 실명으로 그대로 찾기 ── */
  await page.evaluate(() => {
    cmRealSet('c1', '김철수'); cmRealSet('c2', '김민지'); cmRealSet('c3', '박서준');
    osRenderList();
  });
  L = await list();
  ok(L.names.indexOf('김철수') >= 0, '실명을 적어 두면 목록에 그 이름이 나온다');

  await page.evaluate(() => osClientsFilter('김철수'));
  L = await list();
  ok(L.n === 1 && L.names[0] === '김철수', '"김철수" 를 그대로 치면 한 명만 남는다');

  await page.evaluate(() => osClientsFilter('김○○'));
  L = await list();
  ok(L.n === 2, '마스킹된 이름으로도 여전히 찾힌다 (' + L.n + '명)');

  await page.evaluate(() => osClientsFilter('ㄱㅊㅅ'));
  L = await list();
  ok(L.n === 1 && L.names[0] === '김철수', '초성 "ㄱㅊㅅ" 로도 찾는다');

  await page.evaluate(() => osClientsFilter('5678'));
  L = await list();
  ok(L.n === 1 && L.names[0] === '김철수', '연락처 뒷자리로도 찾는다');

  await page.evaluate(() => osClientsFilter('없는사람'));
  L = await list();
  ok(L.n === 0 && /찾은 고객이 없습니다/.test(L.txt), '없으면 어떻게 찾으면 되는지 알려 준다');
  await page.evaluate(() => osClientsFilter(''));

  /* ── 최근 본 고객 ── */
  let rec = await page.evaluate(() => document.querySelectorAll('.cm-sec .cm-chip').length);
  ok(rec === 0, '아직 연 고객이 없으면 최근 칸도 없다');

  await page.evaluate(() => osOpenClient('c3'));
  await page.waitForTimeout(400);
  await page.evaluate(() => osBackToList());
  await page.waitForTimeout(500);
  const r2 = await page.evaluate(() => ({
    n: document.querySelectorAll('.cm-sec .cm-chip').length,
    first: (document.querySelector('.cm-sec .cm-chip') || {}).textContent || '',
    saved: cmRecent().length
  }));
  ok(r2.n === 1 && /박서준/.test(r2.first), '연 고객이 "최근 본 고객" 에 남는다');

  await page.evaluate(() => { osOpenClient('c1'); });
  await page.waitForTimeout(300);
  await page.evaluate(() => osBackToList());
  await page.waitForTimeout(500);
  const r3 = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('.cm-sec .cm-chip'), e => e.textContent.replace(/\s/g, '')));
  ok(r3.length === 2 && /김철수/.test(r3[0]), '가장 최근에 본 사람이 맨 앞에 온다');

  /* 새로고침해도 남아 있는가 */
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2600);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'cl', name: '점검', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'cl', email: 'cl@t' } };
    window.__toast = []; window.toast = m => window.__toast.push('' + m);
  });
  await open();
  const r4 = await page.evaluate(() => ({
    chips: document.querySelectorAll('.cm-sec .cm-chip').length,
    real: cmRealOf('c1')
  }));
  ok(r4.chips === 2, '새로고침해도 최근 본 고객이 그대로 있다');
  ok(r4.real === '김철수', '적어 둔 실명도 그대로 남는다');

  /* ── 다음 할 일 · 접촉 기록 ── */
  await page.evaluate(() => osOpenClient('c1'));
  await page.waitForTimeout(500);
  const det = await page.evaluate(() => ({
    title: (document.querySelector('.osc-title') || {}).textContent || '',
    rel: !!document.getElementById('cmNextWhat'),
    fam: !!document.getElementById('cmFam'),
    ff: document.querySelectorAll('#cmPanels [id^=cmff_]').length,
    tot: cmFfTotal()
  }));
  ok(/김철수/.test(det.title), '고객 화면 제목이 실명으로 나온다');
  ok(det.rel && det.fam, '관계 칸과 가족 칸이 있다');
  ok(det.ff === det.tot && det.ff >= 20, '팩트파인딩이 ' + det.ff + '칸 모두 그려진다');

  await page.evaluate(d => {
    document.getElementById('cmNextWhat').value = '증권 받아서 보장분석 돌리기';
    document.getElementById('cmNextDue').value = d;
    cmNextSave('c1');
  }, later(3));
  await page.waitForTimeout(500);
  const nx = await page.evaluate(() => ({
    saved: window.__saved.filter(x => x.kind === 'client_meta'),
    shown: (document.querySelector('.cm-next .w') || {}).textContent || ''
  }));
  ok(nx.saved.length === 1 && nx.saved[0].client_id === 'c1', '다음 할 일이 서버에 저장된다');
  ok(nx.saved.length === 1 && /증권/.test(((nx.saved[0].content || {}).next || {}).what || ''), '적은 내용이 그대로 들어간다');
  ok(/증권/.test(nx.shown), '저장하면 바로 화면에 뜬다');

  /* 두 번 저장해도 줄이 두 개가 되면 안 된다 */
  await page.evaluate(() => { document.getElementById('cmNextWhat').value = '다시 전화'; cmNextSave('c1'); });
  await page.waitForTimeout(500);
  const dup = await page.evaluate(() => window.__saved.filter(x => x.kind === 'client_meta' && x.client_id === 'c1'));
  ok(dup.length === 1, '두 번 저장해도 줄은 하나다 (' + dup.length + ')');
  ok(/다시 전화/.test((((dup[0] || {}).content || {}).next || {}).what || ''), '나중에 적은 것으로 덮인다');

  /* 접촉 기록 */
  await page.evaluate(d => {
    document.getElementById('cmTouchHow').value = '만남';
    document.getElementById('cmTouchAt').value = d;
    document.getElementById('cmTouchNote').value = '치료비 통장 설명함';
    cmTouchAdd('c1');
  }, ago(3));
  await page.waitForTimeout(500);
  const tc = await page.evaluate(() => ({
    n: document.querySelectorAll('.cm-ti').length,
    temp: (document.querySelector('.cm-tp') || {}).textContent || '',
    srv: (window.__saved.filter(x => x.kind === 'client_meta' && x.client_id === 'c1')[0] || {}).content
  }));
  ok(tc.n === 1, '접촉 기록이 한 줄 쌓인다');
  ok((tc.srv.touch || []).length === 1 && /치료비/.test(tc.srv.touch[0].note), '서버에도 그대로 들어간다');
  ok(/🔥/.test(tc.temp) && /3일 전/.test(tc.temp), '마지막 접촉으로 관계 온도가 매겨진다 — ' + tc.temp.trim());

  /* 다음 할 일 끝내기 → 접촉 기록으로 넘어간다 */
  await page.evaluate(() => cmNextDone('c1'));
  await page.waitForTimeout(500);
  const dn = await page.evaluate(() => {
    const c = window.__saved.filter(x => x.kind === 'client_meta' && x.client_id === 'c1')[0].content;
    return { next: c.next, touch: c.touch.length, top: c.touch[0] };
  });
  ok(!dn.next, '"끝냈습니다" 를 누르면 다음 할 일이 비워진다');
  ok(dn.touch === 2 && /다시 전화/.test(dn.top.note), '끝낸 일이 접촉 기록으로 남는다');

  /* ── 팩트파인딩 ── */
  await page.evaluate(() => {
    document.getElementById('cmff_f_age').value = '45';
    document.getElementById('cmff_f_income').value = '500';
    document.getElementById('cmff_c_cancer').value = '3000';
    document.getElementById('cmff_f_gender').value = '남성';
    cmFfSave('c1');
  });
  await page.waitForTimeout(500);
  const ff = await page.evaluate(() => ({
    srv: (window.__saved.filter(x => x.kind === 'client_meta' && x.client_id === 'c1')[0] || {}).content.fp,
    cnt: (document.getElementById('cmFfN') || {}).textContent || '',
    n: cmFfCount('c1')
  }));
  ok(ff.srv.f_age === '45' && ff.srv.c_cancer === '3000', '팩트파인딩이 서버에 저장된다');
  ok(ff.n === 4 && /4 \/ /.test(ff.cnt), '몇 칸 채웠는지 세어 준다 — ' + ff.cnt.trim());

  /* 계산기가 알아듣는 이름으로 옮겨지는가 */
  const map = await page.evaluate(() => fpToFin({ f: cmFfRead() }));
  ok(map.s_age === '45' && map.s_gross === '6000' && map.ins_cancer_dx === '3000',
    '계산기 칸 이름으로 정확히 옮겨진다 (나이·연소득·암진단금)');
  ok(map.s_gender === '남성', '성별도 계산기가 쓰는 말로 바뀐다');

  /* ── 가족 묶기 ── */
  await page.evaluate(() => {
    document.getElementById('cmFam').value = '김철수 가족';
    document.getElementById('cmRel').value = '본인';
    cmFamSave('c1');
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => { osBackToList(); });
  await page.waitForTimeout(400);
  await page.evaluate(() => osOpenClient('c2'));
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    document.getElementById('cmFam').value = '김철수 가족';
    document.getElementById('cmRel').value = '배우자';
    cmFamSave('c2');
  });
  await page.waitForTimeout(500);
  const fam = await page.evaluate(() => ({
    mem: document.querySelectorAll('.cm-fmem .cm-chip').length,
    txt: (document.querySelector('.cm-fmem') || {}).textContent || ''
  }));
  ok(fam.mem === 1 && /김철수/.test(fam.txt), '같은 가족이면 상대가 바로가기로 뜬다');

  await page.evaluate(() => osBackToList());
  await page.waitForTimeout(500);
  const grp = await page.evaluate(() => ({
    heads: Array.prototype.map.call(document.querySelectorAll('.cm-fh'), e => e.textContent.replace(/\s+/g, ' ').trim()),
    inFam: document.querySelectorAll('.cm-fam .cm-row').length
  }));
  ok(grp.heads.length === 1 && /김철수 가족/.test(grp.heads[0]) && /2명/.test(grp.heads[0]),
    '목록이 가족으로 묶여 보인다 — ' + grp.heads[0]);
  ok(grp.inFam === 2, '가족 아래에 두 명이 들어간다');

  await page.evaluate(() => cmFamToggle());
  await page.waitForTimeout(200);
  const flat = await page.evaluate(() => document.querySelectorAll('.cm-fam').length);
  ok(flat === 0, '묶기를 끄면 그냥 목록으로 돌아온다');
  await page.evaluate(() => cmFamToggle());

  /* ── 오늘 챙길 고객 ── */
  await page.evaluate(d => {
    cmSave('c3', { next: { what: '증권 받기', due: d }, touch: [] });
  }, ago(2));
  await page.waitForTimeout(400);
  await page.evaluate(() => { cmSave('c4', { bd: (new Date().toISOString().slice(5, 10)) }); });
  await page.waitForTimeout(400);
  await page.evaluate(() => osRenderList());
  const todo = await page.evaluate(() => ({
    txt: (document.querySelector('.cm-todo') || {}).textContent || '',
    due: document.querySelectorAll('.cm-td.due').length,
    bd: document.querySelectorAll('.cm-td.bd').length,
    cold: document.querySelectorAll('.cm-td.cold').length,
    over: document.querySelectorAll('.cm-nx.due').length
  }));
  ok(todo.due === 1 && /기한이 됐습니다/.test(todo.txt), '기한 지난 다음 할 일이 맨 위에 뜬다');
  ok(todo.bd === 1, '오늘 생일인 고객이 잡힌다');
  ok(todo.cold >= 1, '오래 연락 없는 고객이 잡힌다');
  ok(todo.over === 1, '목록 줄에서도 지난 일이 붉게 표시된다');

  /* ── 말로도 ── */
  const voice = await page.evaluate(() => {
    window.__spoke = [];
    window.vaSay = function (t, then) { window.__spoke.push('' + t); if (then) setTimeout(then, 1); };
    VA.speak = false; VA.pend = null; VA.conf = null;
    vaRun('오늘 챙길 고객 누구야');
    return { spoke: window.__spoke.join(' ') };
  });
  ok(/기한이 된 일/.test(voice.spoke), '"오늘 챙길 고객" 을 말로 물어도 답한다 — ' + voice.spoke.slice(0, 44));

  /* ── 관리 기록이 상담 자료 목록에 끼지 않는다 ── */
  await page.evaluate(() => osOpenClient('c1'));
  await page.waitForTimeout(700);
  const reps = await page.evaluate(() => (document.getElementById('oscReps') || {}).textContent || '');
  ok(!/고객 관리/.test(reps), '관리 기록은 "저장된 상담 자료" 목록에 끼지 않는다');

  /* ── 실명은 서버로 나가지 않는다 ── */
  /* ── 누가 맡은 고객인가 ──
     지점장·대표 화면에서는 팀 전체 고객이 한 덩어리로 온다. 그러면 누구를 챙길지 모른다.
     담당자 이름이 붙고, 담당자로 걸러 보고 묶어 볼 수 있어야 한다. */
  await open();   /* 앞 검사가 상세로 들어가 있다 — 목록으로 돌아온다 */

  /* ── 켜면 내 고객부터 보인다 ──
     팀 전체가 한 덩어리로 마주치면 내 것이 어디 있는지부터 못 찾는다. */
  const w0 = await page.evaluate(async () => {
    CM.picked = false; CM.pick = ''; CM.byWho = false; CM.fam = false; OSC.q = '';
    osLoadClients();
    await new Promise(r => setTimeout(r, 900));
    return {
      pick: CM.pick,
      rows: document.querySelectorAll('.cm-row').length,
      txt: ((document.getElementById('oscList') || {}).textContent || '').slice(0, 80)
    };
  });
  ok(w0.pick === 'cl', '켜면 담당자가 「나」 로 맞춰져 있다 (' + (w0.pick || '전체') + ')');
  ok(w0.rows === 2, '처음 보이는 것은 내 고객 둘뿐이다 (' + w0.rows + '명)');
  ok(!/최○○|박○○/.test(w0.txt), '남의 고객은 처음부터 안 섞인다');

  await page.evaluate(() => { CM.pick = ''; CM.byWho = false; CM.fam = false; OSC.q = ''; osRenderList(); });
  await page.waitForTimeout(300);
  const w1 = await page.evaluate(() => ({
    chips: Array.prototype.map.call(document.querySelectorAll('.cm-whos .cm-sb'),
      e => e.textContent.replace(/\s+/g, ' ').trim()),
    tags: Array.prototype.map.call(document.querySelectorAll('.cm-row .cm-wt'), e => e.textContent.trim()),
    rows: document.querySelectorAll('.cm-row').length,
    me: !!document.querySelector('.cm-whos .cm-sb.me')
  }));
  ok(w1.chips.length >= 4, '담당자 고르는 단추가 뜬다 — ' + w1.chips.join(' · '));
  ok(/전체 ?4/.test(w1.chips[0] || ''), '맨 앞은 전체 4명 — ' + w1.chips[0]);
  ok(w1.me, '내 것이 맨 앞에 따로 표시된다');
  ok(w1.chips.join(' ').indexOf('박서준') >= 0 && w1.chips.join(' ').indexOf('최민아') >= 0,
    '팀원 이름이 그대로 나온다');
  ok(w1.tags.length === 2 && w1.tags.indexOf('박서준') >= 0 && w1.tags.indexOf('최민아') >= 0,
    '남이 맡은 고객 줄에만 담당자 딱지가 붙는다 (' + w1.tags.length + '개) — ' + w1.tags.join(','));

  /* 담당자를 하나 고르면 그 사람 것만 */
  const w2 = await page.evaluate(() => {
    cmWhoSet('p2');
    const rows = document.querySelectorAll('.cm-row').length;
    const txt = (document.getElementById('oscList') || {}).textContent || '';
    const on = document.querySelectorAll('.cm-whos .cm-sb.on').length;
    cmWhoSet('p2');   /* 한 번 더 누르면 풀린다 */
    return { rows, txt, on, back: document.querySelectorAll('.cm-row').length };
  });
  ok(w2.rows === 1, '박서준을 고르면 그 사람 고객 한 명만 남는다 (' + w2.rows + '명)');
  ok(/박서준<\/b> 담당 1명|박서준 담당 1명/.test(w2.txt.replace(/\s+/g, ' ')) || /박서준/.test(w2.txt),
    '누구 것을 보고 있는지 적어 준다');
  ok(w2.on === 1, '고른 단추 하나만 켜진다');
  ok(w2.back === 4, '다시 누르면 전체로 돌아온다 (' + w2.back + '명)');

  /* 담당자로 묶어 보기 */
  const w3 = await page.evaluate(() => {
    cmWhoToggle();
    const heads = Array.prototype.map.call(document.querySelectorAll('.cm-fh'),
      e => e.textContent.replace(/\s+/g, ' ').trim());
    const mine = !!document.querySelector('.cm-mytag');
    const fam = CM.fam;
    cmWhoToggle();
    return { heads, mine, fam };
  });
  ok(w3.heads.length === 3, '담당자마다 한 덩어리씩 나온다 (' + w3.heads.length + '덩어리)');
  ok(/점검/.test(w3.heads[0] || ''), '내 고객 덩어리가 맨 위 — ' + w3.heads[0]);
  ok(w3.mine, '내 덩어리에 「내 고객」 이라고 적힌다');
  ok(w3.fam === false, '담당자로 묶으면 가족 묶기는 꺼진다 — 두 가지가 겹치지 않는다');

  /* ── 이름으로 바로 찾기 ── */
  const f1 = await page.evaluate(() => {
    const r = {};
    ['박', '김', 'ㅂ', 'ㅊ', '5678', '박서준'].forEach(q => {
      OSC.q = q; osRenderList();
      r[q] = {
        n: document.querySelectorAll('.cm-row').length,
        txt: ((document.getElementById('oscList') || {}).textContent || '').slice(0, 60)
      };
    });
    OSC.q = ''; osRenderList();
    return r;
  });
  ok(f1['박'].n === 1, '「박」 한 글자로 바로 찾는다 (' + f1['박'].n + '명)');
  ok(f1['김'].n === 2, '「김」 이면 두 명 다 나온다 (' + f1['김'].n + '명)');
  ok(f1['ㅂ'].n === 1, '초성 「ㅂ」 으로도 찾는다 — 박○○ (' + f1['ㅂ'].n + '명)');
  /* 「ㅊ」 은 최○○ 말고 가족명 「김철수 가족」 에도 걸린다. 그게 맞는 동작이다 —
     사람은 고객 이름이 기억 안 나면 가족 이름으로 찾는다. */
  ok(f1['ㅊ'].n === 3, '초성은 고객 이름·가족 이름 둘 다에 걸린다 — 「ㅊ」 이면 최○○ 와 김철수 가족 둘 (' + f1['ㅊ'].n + '명)');
  ok(f1['5678'].n === 1, '연락처 뒷자리로도 찾는다 (' + f1['5678'].n + '명)');
  ok(f1['박서준'].n === 1, '담당자 이름으로 치면 그 사람이 맡은 고객이 나온다 (' + f1['박서준'].n + '명)');

  /* 없는 이름을 치면 무엇으로 찾을 수 있는지 알려 준다 */
  const f2 = await page.evaluate(() => {
    OSC.q = '없는사람'; osRenderList();
    const t = ((document.getElementById('oscList') || {}).textContent || '');
    OSC.q = ''; osRenderList();
    return t;
  });
  ok(/담당자 이름으로도/.test(f2), '못 찾으면 담당자 이름으로도 된다고 알려 준다');

  const leak = await page.evaluate(() => JSON.stringify(window.__saved) + JSON.stringify(window.__clients));
  ok(leak.indexOf('김철수 가족') >= 0, '가족 이름은 서버에 저장된다');
  ok(!/"김철수"/.test(leak), '실명 자체는 서버로 나가지 않는다 — 이 기기 안에만 남는다');

  ok(errs.length === 0, '자바스크립트 오류 없음' + (errs.length ? ' — ' + errs.join(' / ') : ''));

  /* 좁은 화면 */
  await page.setViewportSize({ width: 390, height: 900 });
  await page.evaluate(() => osBackToList());
  await page.waitForTimeout(400);
  const w = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
  ok(w.s <= w.c + 1, '390px 가로 스크롤 없음 (' + w.s + '/' + w.c + ')');

  await browser.close(); srv.close();
  if (fail.length) { console.log('\n✗ 실패 ' + fail.length + '건'); fail.forEach(f => console.log('   - ' + f)); process.exit(1); }
  console.log('\n고객 365일 점검 통과');
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
