/* ══════════════════════════════════════════════════════════════════
   check-csbar.js — <b>이름 칸이 아예 없던 넷도 「누구 상담인지」 를 적는다.</b>

   사장님 말씀 (2026-10-09) — 「<b>B</b> 해줘」. 판 X76 에서 이름 칸이
   <b>있는</b> 넷을 채웠고(check-fillnm), 여기는 칸이 <b>아예 없던</b> 넷입니다 —
     치료비 지급지도 · 재무&보장 상담자료 · 한장 보험료 비교 · 미끼 레이더

   ── 자리를 새로 만들지 않았습니다 ─────────────────────────────────
   재어 보니 둘은 <b>본체 화면</b>(머리 .page-hd 가 이미 있음)이고 둘은
   <b>전체화면 틀</b>(우리 것은 떠 있는 띠 .fin-float 하나뿐)이었습니다.
   그래서 <b>이미 있는 가구</b>에 칩 한 줄만 답니다.

   ── 이 자가 제일 걱정하는 것 ───────────────────────────────────────
   ⓐ <b>엉뚱한 화면에 이름이 남는 것.</b> 떠 있는 띠는 #dynPane 밖이라,
      지우지 않으면 다음 화면에도 「홍보배 님 상담」 이 그대로 남아
      <b>거짓말</b>이 됩니다.
   ⓑ <b>앞 화면 머리에 꽂고 끝내는 것.</b> go() 가 아직 #dynPane 을 안
      바꿨을 때 넣으면 바로 뒤에 화면이 통째로 덮여 띠가 사라집니다 —
      <b>재무&보장 상담자료에서 실제로 그랬습니다</b>(띠가 아예 안 섰습니다).
   ⓒ <b>어느 이름인가.</b> 넷 다 <b>실명</b>입니다 — 이 띠는 우리 화면이고
      밖으로 나가는 자리가 아닙니다(check-calface · 3번). 그리고 틀 안으로는
      <b>아무것도 새로 안 보냅니다</b> — 한장 보험료 비교는 딴 회사 주소라
      넣을 수도 없고, 미끼 레이더는 홈 ⑥ 에서 이미 가린 이름을 받습니다(X74).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8976;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript',
               '.css':'text/css', '.json':'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 이름은 <b>홍길동</b> 꼴이고, 가린 꼴과 다른 글자가 되도록 세 글자입니다 (3번) */
const SEED = (o) => `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients',
  'osCliInfoLoad','osRepListLoad','chkLoad'].forEach(function(k){window[k]=function(){};});
 window.toast=function(m){window.__T=m;};
 window.setupDone=function(){return true;};window.setupCanRun=function(){return true;};
 window.setupShow=function(){return false;};window.osTabAllowed=function(){return true;};
 window.cmLoadAll=function(cb){if(cb)cb();};
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',user_id:'me',name:'홍길동',role:'owner',user_role:'owner',team:'A',active:true,plan:'pro'};
 window.osClient=function(){var mk=function(){var a={};
   ['select','order','limit','in','is','eq','neq','not','gte','lte','update','insert','upsert','delete','single','range','or','filter']
     .forEach(function(k){a[k]=function(){return a;};});
   a.then=function(f){return Promise.resolve({data:[],error:null}).then(f);};return a;};
   return {from:function(){return mk();},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 CM.loaded=true;CM.who={me:'홍길동'};CM.pick='';CM.picked=true;
 var 실명='홍보배', 가린=osMaskName(실명);
 window.__REAL=실명; window.__MASK=가린;
 /* 실명은 <b>앱이 쓰는 그대로</b> 심습니다 — 창고 이름을 손으로 지어 심었다가
    앱을 모함한 적이 있습니다 (판 X76).                                   */
 try{ cmRealSet('c4',실명); }catch(e){}
 var CLI=[{id:'c4',who:'me',name:실명,nm:실명,name_masked:가린}];
 AR.loaded=true;AR.busy='';AR.calls=[];AR.rep={};AR.db=[];AR.cliRows=CLI;
 OSC.loaded=true;OSC.busy=false;OSC.err='';
 OSC.list=CLI.map(function(c){return {id:c.id,name:c.name,nm:c.nm,name_masked:c.name_masked,who:'me',owner:'me'};});
 CHKS.busy=false;CHKS.err='';CHKS.rows=[];CHKS.fin={};CHKS.by={};
 ${o && o.아무도없이 ? 'try{OSC.current=null;}catch(e){}' : "try{ osOpenClient('c4'); }catch(e){}"}
 HWHO.id='';go('home');`;

/* 그 화면을 세우고 <b>정말 그 화면인지 확인한 뒤에</b> 띠를 읽습니다 */
const 보기 = async (p, tab) => await p.evaluate(async (t) => {
  try { go(t); } catch (e) { return { X: String(e.message).slice(0, 50) }; }
  for (let i = 0; i < 28; i++) {
    await new Promise(r => setTimeout(r, 250));
    try { if (currentTab() === t) break; } catch (e) {}
  }
  let b = null;
  for (let i = 0; i < 22; i++) {
    await new Promise(r => setTimeout(r, 450));
    b = document.getElementById('csWhoBar'); if (b) break;
  }
  if (!b) return { 없음: 1, 쟀나: (typeof currentTab === 'function') ? currentTab() : '' };
  const r = b.getBoundingClientRect();
  return { 글: (b.innerText || '').replace(/\s+/g, ' ').trim(),
           어디: b.closest('.fin-float') ? 'float' : (b.closest('.page-hd') ? 'hd' : '?'),
           보이나: (r.width > 0 && r.height > 0),
           쟀나: currentTab(), n: document.querySelectorAll('#csWhoBar').length };
}, tab);

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const open = async (o) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
    await p.waitForTimeout(2600);
    await p.evaluate(SEED(o || {})); await p.waitForTimeout(2200);
    return { ctx, p, errs };
  };
  const src = fs.readFileSync('app/index.html', 'utf8');
  const 걷기 = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

  console.log('[1] 📋 <b>표 한 벌</b>이 넷을 안다 (5번)');
  {
    const n = (src.match(/var\s+CS_BAR\s*=/g) || []).length;
    is(n === 1, '  표가 <b>한 벌</b>이다 — 지금 ' + n + '개');
    const 표 = (src.match(/var CS_BAR=\{[\s\S]*?\n\};/) || [''])[0];
    ['treatpay', 'fp_deck', 'onecmp', 'mikki'].forEach(k =>
      is(표.indexOf(k) >= 0, '  표에 ' + k + ' 가 있다'));
    is(/at:'hd'/.test(표) && /at:'float'/.test(표),
      '  <b>어디에 다는지</b>까지 적는다 — 머리(hd)와 떠 있는 띠(float)');
    const 몸 = 걷기((src.match(/function csBarPaint\(tab\)\{[\s\S]*?\n\}/) || [''])[0]);
    is(/CS_BAR\[tab\]/.test(몸), '  표에서 <b>골라</b> 온다 — 삼항 사슬이 아니다');
    is(!/tab\s*===\s*['"]/.test(몸), '  <b>삼항 사슬이 없다</b> — 화면을 더 이어도 빠뜨릴 자리가 없다');
  }

  console.log('\n[2] 🧑 <b>넷에 정말 선다</b> — 세워서 읽습니다');
  const A = await open({});
  const 바람 = [['treatpay', 'hd'], ['fp_deck', 'hd'], ['onecmp', 'float'], ['mikki', 'float']];
  const 실명 = await A.p.evaluate(() => window.__REAL);
  for (const [tab, 어디] of 바람) {
    const r = await 보기(A.p, tab);
    if (r.X) { is(false, '  ' + tab + ' — 터졌습니다: ' + r.X); continue; }
    if (r.없음) { is(false, '  ' + tab + ' — <b>띠가 안 선다</b> (쟀나 ' + r.쟀나 + ')'); continue; }
    is(r.쟀나 === tab, '  ' + tab + ' — <b>정말 그 화면을 쟀다</b>');
    is(r.어디 === 어디, '  ' + tab + ' — ' + (어디 === 'hd' ? '<b>머리</b>' : '<b>떠 있는 띠</b>') + '에 섰다 (' + r.어디 + ')');
    is(r.보이나 && r.글.indexOf(실명) >= 0, '  ' + tab + ' — 「' + r.글 + '」 (실명 · 우리 화면이니까 · 3번)');
    is(r.n === 1, '  ' + tab + ' — 띠가 <b>하나</b>다 (' + r.n + '개)');
  }

  console.log('\n[3] ⚠★ <b>떠나면 지운다</b> — 떠 있는 띠는 #dynPane 밖이다');
  const r3 = await A.p.evaluate(async () => {
    go('mikki'); await new Promise(r => setTimeout(r, 2200));
    const 있었나 = !!document.getElementById('csWhoBar');
    go('home'); await new Promise(r => setTimeout(r, 2400));
    return { 있었나, 남았나: !!document.getElementById('csWhoBar'), 탭: currentTab() };
  });
  is(r3.있었나, '  미끼 레이더에서 띠가 섰다');
  is(!r3.남았나, '  홈으로 돌아오면 <b>없다</b> — 안 지우면 다음 화면이 거짓말을 합니다 (탭 ' + r3.탭 + ')');

  console.log('\n[4] ⓑ <b>앞 화면에 꽂고 끝내지 않는다</b>');
  {
    /* ⚠ 처음에 꼬리를 `\n})();\n}` 로 잡았다가 <b>아무것도 못 집어</b> 헛울었습니다.
       함수 안에 중괄호가 여러 겹이라, <b>줄 맨 앞의 }</b> 까지로 끊습니다 (8번). */
    const 몸 = 걷기((src.match(/function csBarPaint\(tab\)\{[\s\S]*?\n\}/) || [''])[0]);
    is(!!몸, '  csBarPaint 를 읽었다 — ' + 몸.length + '자');
    is(/tries\s*<\s*\d+\s*\)\s*setTimeout/.test(몸),
      '  넣은 뒤에도 <b>붙어 있나를 지켜본다</b> — go() 가 화면을 덮어도 다시 답니다');
    is(/!document\.getElementById\('csWhoBar'\)/.test(몸),
      '  이미 붙어 있으면 <b>또 안 단다</b> — 지켜보는데 두 번 달면 띠가 둘이 됩니다');
    is(/currentTab\(\)\s*!==\s*tab/.test(몸),
      '  그 사이 <b>다른 화면으로 가셨으면 그만둔다</b> — 늦게 와서 엉뚱한 화면에 안 답니다 (1번)');
    /* 실제로 앞 화면을 거쳐 가도 서는가 — 위 [2] 의 fp_deck 이 그 시험입니다
       (treatpay → fp_deck 으로 이어 갑니다). 여기서는 <b>거꾸로</b> 한 번 더. */
  }
  const r4 = await A.p.evaluate(async () => {
    go('treatpay'); await new Promise(r => setTimeout(r, 2000));
    const a = !!document.getElementById('csWhoBar');
    go('fp_deck'); await new Promise(r => setTimeout(r, 2600));
    const b = document.getElementById('csWhoBar');
    return { a, b: !!b, 어디: b ? (b.closest('.page-hd') ? 'hd' : '?') : '',
             글: b ? (b.innerText || '').replace(/\s+/g, ' ').trim() : '', 탭: currentTab() };
  });
  is(r4.a && r4.b && r4.어디 === 'hd',
    '  치료비 → 재무&보장 으로 <b>이어 가도</b> 머리에 선다 — 「' + r4.글 + '」');

  console.log('\n[5] ★ <b>모르면 안 적는다</b> (1번)');
  const B = await open({ 아무도없이: true });
  const r5 = await B.p.evaluate(async () => {
    const o = { csNm: (typeof csNm === 'function') ? csNm() : '?' };
    go('treatpay'); await new Promise(r => setTimeout(r, 2600));
    o.띠 = !!document.getElementById('csWhoBar');
    return o;
  });
  is(r5.csNm === '', '  고른 분이 없으면 <b>빈 글</b>이다 — 「고객님」 이 아니다');
  is(!r5.띠, '  띠를 <b>아예 안 세운다</b>' + (r5.띠 ? ' ← 섰습니다' : ''));

  console.log('\n[6] 📌 <b>틀 안으로는 아무것도 새로 안 보낸다</b> (5번·3번)');
  {
    /* 한장 보험료 비교는 <b>딴 회사 주소</b>라 넣을 수도 없습니다 */
    const mount = 걷기((src.match(/function mountOneCmp\(\)\{[^}]*\}/) || [''])[0]);
    is(!/nm=/.test(mount), '  한장 보험료 비교 틀 주소에 이름을 <b>안 싣는다</b> — 딴 회사 주소다');
    const mk = 걷기((src.match(/function mountMikki\(\)\{[^}]*\}/) || [''])[0]);
    is(!/nm=/.test(mk),
      '  미끼 레이더 <b>메뉴 길</b>에도 새 길을 안 만든다 — 홈 ⑥ 이 이미 보냅니다(X74 · 5번)');
    const 블록 = 걷기(src.slice(src.indexOf('var CS_BAR='), src.indexOf('function go(tab){')));
    is(!/fetch\(|osClient\(|supabase/.test(블록), '  이 블록이 <b>서버를 한 번도 안 부른다</b> (7번)');
    is(/osEsc\(/.test(블록), '  이름을 <b>씻어서</b> 넣는다 — 메모가 섞여 들어옵니다 (3번)');
    is(/csNm\(/.test(블록) && !/csNmOut\(/.test(블록),
      '  <b>실명</b>을 묻는다(csNm) — 밖으로 나가는 자리가 아니라 우리 화면입니다');
  }

  console.log('');
  const 터짐 = [...A.errs, ...B.errs];
  is(터짐.length === 0, '재는 동안 <b>조용히 터진 곳이 없다</b>' + (터짐.length ? (' — ' + 터짐[0]) : ''));

  await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '곳이 어긋났습니다.')
                  : '\n✓ 이름 칸이 없던 넷도 「누구 상담인지」 를 적고, 떠나면 지웁니다.');
  process.exit(bad ? 1 : 0);
})();
