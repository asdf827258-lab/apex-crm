/* ══════════════════════════════════════════════════════════════════
   check-crmone.js — <b>고객 365일과 DB 통합 CRM 을 한 사람으로</b>.

   사장님 말씀 (2026-10-09) — 「고객DB통합CRM 에 고객 정보와, 고객 365를
   <b>하나로</b> 만들 방법을 찾아」 → <b>「가 해줘」</b>(안전한 분은 바로 잇고,
   나머지는 눌러서).

   ── 재어 본 사실 (살아 있는 서버) ─────────────────────────────────
   · clients 113줄(가린 이름) · dbs 1,674줄(실명) — <b>잇는 칸이 없었습니다</b>
   · 앱은 <b>가린 이름끼리</b> 견줬습니다(담긴 꼴 <b>김*수</b> — 첫 자와 끝 자).
     그런데 113줄 중 <b>22줄(11덩이)</b>이 가린 이름이 같아, 다섯 명에 한
     명꼴로 누가 누구인지 구별이 안 됐습니다.
   · 번호로 겹치는 분 37명 · <b>안전하게 자동으로 이을 수 있는 분 36명</b>
   · ⚠ dbs 안에 <b>같은 번호에 다른 이름이 11덩이</b> — 가족이 집 번호를
     같이 씁니다. 번호만 보고 이으면 <b>부부를 한 사람으로 합칩니다</b>.
   · ⚠ clients 113명 중 <b>63명은 번호가 아예 없습니다</b> — 자동 불가.
   · ⚠ 담당자가 서로 다른 분이 <b>1명</b> 있습니다.

   ── 이 자가 제일 걱정하는 것 ───────────────────────────────────────
   ⓐ ★★ <b>배정 한도 셈이 바뀌는 것.</b> 사장님께서 「DB 배정(팀)은 명단에
      섞지 마십시오」 라고 못 박으셨습니다 — 배정 한도(일반 20 · 변액 +30)가
      깨진 사고 때문입니다. <b>이어 붙여도 한도 셈은 한 자도 안 바뀌어야</b>
      합니다. 「하나로」 는 <b>보이는 것이 하나</b>라는 뜻입니다.
   ⓑ ★★ <b>짐작으로 합치는 것.</b> 짝이 둘 이상이면 아무것도 안 골라야
      하고, 담당자가 다르면 쳐다보지도 않아야 합니다 (1번·3번).
   ⓒ ★★ <b>모름을 숨기는 것.</b> 서버에 칸이 아직 안 담겼으면 「서버 준비가
      아직 남았습니다」 라고 적고, 이어붙이기 단추를 <b>안 내야</b> 합니다 —
      눌러도 안 되는 단추를 세우면 사장님이 고장인 줄 아십니다 (1번·6번).
   ⓓ <b>묻는 곳이 둘이 되는 것.</b> 「같은 사람인가」 는 client_id 한 곳만
      봐야 합니다 (5번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8991;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript',
               '.css':'text/css', '.json':'application/json' };
let 바깥 = 0;
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 씨 — 고객 365일 두 분 · 배정 DB 다섯 줄.
   d1 번호로 짝 · d2 가린 이름으로 짝(약함) · d3 짝 없음 ·
   d4 이미 이어짐 · d5 <b>담당자가 다름</b>(남의 고객으로 새면 안 됩니다). */
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
     .forEach(function(k){a[k]=function(){window.__SB=(window.__SB||0)+1;return a;};});
   a.then=function(f){return Promise.resolve({data:[],error:null}).then(f);};return a;};
   return {from:function(){return mk();},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 OSC.loaded=true;OSC.busy=false;OSC.err='';
 OSC.list=[{id:'c1',advisor_id:'me',name_masked:'홍*동',phone:'010-1111-2222',consent_status:'consented'},
           {id:'c2',advisor_id:'me',name_masked:'김*수',phone:'',consent_status:'consented'}
           ${o && o.둘짝 ? ",{id:'c3',advisor_id:'me',name_masked:'박*수',phone:'010-1111-2222',consent_status:'consented'}" : ''}];
 CM.loaded=true;CM.who={me:'홍길동'};CM.pick='';CM.picked=true;
 AR.loaded=true;AR.busy='';AR.rep={};AR.cliRows=[];
 AR.noLink=${o && o.안담김 ? 'true' : 'false'};
 window.__RAW=[
  {id:'d1',assigned_to:'me',customer_name:'홍길동',phone:'010-1111-2222',region:'서울',stage:'AP',source:'일반',assigned_date:'2026-10-01',client_id:null},
  {id:'d2',assigned_to:'me',customer_name:'김철수',phone:'010-9999-8888',region:'서울',stage:'PC',source:'일반',assigned_date:'2026-10-01',client_id:null},
  {id:'d3',assigned_to:'me',customer_name:'박영수',phone:'010-7777-6666',region:'서울',stage:'TA',source:'일반',assigned_date:'2026-10-01',client_id:null},
  {id:'d4',assigned_to:'me',customer_name:'최이음',phone:'010-5555-4444',region:'서울',stage:'CS',source:'일반',assigned_date:'2026-10-01',client_id:'c1'},
  {id:'d5',assigned_to:'남',customer_name:'홍길동',phone:'010-1111-2222',region:'서울',stage:'AP',source:'일반',assigned_date:'2026-10-01',client_id:null}];
 window.__CALLS=[{db_id:'d1',created_by:'me',call_at:'2026-10-08T01:00:00Z',result:'상담'},
   {db_id:'d2',created_by:'me',call_at:'2026-10-08T02:00:00Z',result:'부재'},
   {db_id:'d3',created_by:'me',call_at:'2026-10-08T03:00:00Z',result:'부재'},
   {db_id:'d4',created_by:'me',call_at:'2026-10-08T04:00:00Z',result:'상담'},
   {db_id:'d5',created_by:'남',call_at:'2026-10-08T05:00:00Z',result:'상담'}];
 AR.db=arDbCalc(window.__RAW,window.__CALLS);
 AR.calls=[];
 AR.reco=arRecoCalc(window.__RAW,window.__CALLS,OSC.list);
 CHKS.busy=false;CHKS.err='';CHKS.rows=[];CHKS.fin={};CHKS.by={};
 HWHO.id='';go('home');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const open = async (o) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**://**', r => {
      const u = r.request().url();
      if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
      바깥++; return r.abort();
    });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
    await p.waitForTimeout(2600);
    await p.evaluate(SEED(o || {})); await p.waitForTimeout(1400);
    return { ctx, p, errs };
  };
  const src = fs.readFileSync('app/index.html', 'utf8');
  const 걷기 = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

  console.log('[1] 📌 <b>묻는 곳이 한 곳</b>이다 (5번 · ⓓ)');
  {
    is((src.match(/function crmLinkOf\(/g) || []).length === 1, '  「어느 고객인가」 를 답하는 자리가 하나다 (crmLinkOf)');
    is((src.match(/function crmLinkOn\(/g) || []).length === 1, '  「서버에 담겼나」 를 답하는 자리가 하나다 (crmLinkOn)');
    is((src.match(/function crmGuess\(/g) || []).length === 1, '  「짝이 될 만한 분」 을 찾는 자리가 하나다 (crmGuess)');
    is((src.match(/function crmLinkSet\(/g) || []).length === 1, '  「이어 붙이기」 를 쓰는 자리가 하나다 (crmLinkSet)');
    const 몸 = 걷기((src.match(/function ccRecoLink\(dbId\)\{[\s\S]*?\n\}/) || [''])[0]);
    is(몸.length > 40 && !/crmGuess\(/.test(몸),
      '  단추는 <b>다시 찾지 않는다</b> — 줄에 적힌 짝을 그대로 쓴다 (화면과 실제가 갈리지 않게)');
  }

  console.log('\n[2] 🗄 <b>서버 준비 SQL</b> 이 그 칸을 담고, 안전한 것만 잇는다');
  {
    is(/add column if not exists client_id uuid references public\.clients\(id\)/.test(src),
      '  잇는 칸을 담는 줄이 있다 (dbs.client_id → clients.id)');
    is(/create index if not exists dbs_client_id_idx/.test(src), '  찾기 쉽게 색인도 담는다');
    is(/count\(distinct nm\) = 1/.test(src),
      '  ★★ <b>그 번호에 이름이 하나뿐</b>일 때만 잇는다 — 가족이 번호를 같이 쓰면 부부를 합칩니다');
    is(/c\.advisor_id = d\.assigned_to/.test(src), '  ★ <b>담당자가 같을 때만</b> 잇는다 (3번)');
    is(/pair\.n = 1/.test(src), '  ★★ 짝이 <b>둘 이상이면 안 잇는다</b>');
    is(/t\.client_id is null/.test(src), '  ★ <b>이미 이어진 줄은 안 건드린다</b>');
    is(!/^\s*"?\s*--/m.test((src.match(/with d as \([\s\S]{0,1800}?pair\.n = 1[^"]*/) || [''])[0]),
      '  SQL 주석에 <b>「-」 두 개를 안 쓴다</b> (9번)');
    const v = (src.match(/var SETUP_VER=(\d+)/) || [])[1];
    const vs = (src.match(/values \('schema_version', '(\d+)'\)/) || [])[1];
    is(v === vs && Number(v) >= 44,
      '  ★ <b>판 번호와 서버 번호가 같다</b> — SETUP_VER ' + v + ' · schema_version ' + vs +
      ' (안 올리면 「서버 준비가 남았습니다」 칸이 아예 안 뜹니다)');
  }

  const A = await open({});
  const R = await A.p.evaluate(() => {
    const row = (id) => ((AR.reco || []).filter(x => x.dbId === id)[0] || null);
    let h = ''; try { h = ccRecoHtml(); } catch (e) { h = '터짐: ' + e; }
    return {
      켜짐: crmLinkOn(),
      추천: (AR.reco || []).map(x => x.dbId),
      d1: row('d1'), d2: row('d2'), d3: row('d3'), d5: row('d5'),
      이어진: crmLinkOf(window.__RAW[3]),
      이어진분: (function () { const c = crmCliOf(window.__RAW[3]); return c ? c.name_masked : null; })(),
      칸이있나: Object.prototype.hasOwnProperty.call(AR.db[0] || {}, 'client_id'),
      화면_이어: (h.match(/이어 붙이기/g) || []).length,
      화면_준비: /서버 준비가 아직 남았습니다/.test(h),
      화면_한도: /배정 한도는/.test(h),
      /* ★★ 한도 셈 — 이어 붙이기 <b>전</b> */
      셈전: JSON.stringify(arTkCount('me'))
    };
  });

  console.log('\n[3] 🔗 <b>이어진 분은 「올릴까요」 에서 빠진다</b> — 이미 그 분입니다');
  is(R.켜짐 === true, '  서버에 칸이 담긴 것으로 본다');
  is(R.추천.indexOf('d4') < 0, '  이어진 줄(d4)이 <b>안 뜬다</b> — 뜨면 같은 분이 두 줄 됩니다');
  is(R.이어진 === 'c1' && R.이어진분 === '홍*동',
    '  이어진 분을 <b>되짚어 찾을 수 있다</b> — ' + R.이어진 + ' · ' + R.이어진분);
  is(R.칸이있나, '  손에 쥔 줄도 그 칸을 <b>같은 이름</b>으로 들고 있다 (4번·5번)');

  console.log('\n[4] 🔎 <b>짝과 까닭을 적는다</b> — 번호는 센 짝, 가린 이름은 약한 짝');
  is(!!R.d1 && R.d1.cliId === 'c1' && R.d1.sure === true && /번호가 같습니다/.test(R.d1.why),
    '  번호가 같으면 <b>센 짝</b> — 「' + ((R.d1 || {}).why || '(없음)') + '」');
  is(!!R.d2 && R.d2.cliId === 'c2' && R.d2.sure === false && /가린 이름/.test(R.d2.why),
    '  가린 이름이 같으면 <b>약한 짝</b>이라 그렇다고 적는다 — 「' + ((R.d2 || {}).why || '(없음)') + '」');
  is(!!R.d3 && !R.d3.cliId, '  짝이 없으면 <b>아무것도 안 적는다</b> (1번)');
  is(R.화면_이어 === 2, '  화면에 이어붙이기 단추가 <b>짝 있는 줄에만</b> 선다 — ' + R.화면_이어 + '개');

  console.log('\n[5] 🙈 <b>남의 고객으로 안 샌다</b> (3번)');
  is(!R.d5 || !R.d5.cliId,
    '  담당자가 다른 줄(d5)에는 <b>짝을 안 붙인다</b> — 번호가 같아도' +
    (R.d5 && R.d5.cliId ? (' ✗ 붙였습니다: ' + R.d5.cliId) : ''));

  console.log('\n[6] ❓ <b>짝이 둘이면 안 고른다</b> — 짐작으로 합치지 않는다 (1번 · ⓑ)');
  const B = await open({ 둘짝: true });
  const RB = await B.p.evaluate(() => {
    const r = ((AR.reco || []).filter(x => x.dbId === 'd1')[0] || null);
    return { 짝: r ? r.cliId : '(줄 없음)', 까닭: r ? r.why : '' };
  });
  is(!RB.짝, '  번호가 같은 분이 둘이면 <b>아무것도 안 고른다</b> — 지금 「' + (RB.짝 || '(안 고름)') + '」');

  console.log('\n[7] ⚠ <b>서버에 칸이 안 담겼으면 그렇다고 말한다</b> (1번·6번 · ⓒ)');
  const C = await open({ 안담김: true });
  const RC = await C.p.evaluate(() => {
    let h = ''; try { h = ccRecoHtml(); } catch (e) { h = '터짐: ' + e; }
    window.__T = '';
    try { crmLinkSet('d1', 'c1'); } catch (e) {}
    return { 켜짐: crmLinkOn(), 이어: (h.match(/이어 붙이기/g) || []).length,
             준비: /서버 준비가 아직 남았습니다/.test(h), 말: '' + (window.__T || '') };
  });
  is(RC.켜짐 === false, '  「안 담겼다」 를 안다');
  is(RC.준비 === true, '  화면에 <b>「서버 준비가 아직 남았습니다」</b> 라고 적는다');
  is(RC.이어 === 0, '  ★ 이어붙이기 단추를 <b>안 낸다</b> — 눌러도 안 되는 단추를 세우지 않습니다');
  is(/서버 준비가 아직 남았습니다/.test(RC.말),
    '  억지로 불러도 <b>막고 까닭을 말한다</b> — 「' + (RC.말 || '(말 없음)').slice(0, 44) + '」');

  console.log('\n[8] ★★ <b>배정 한도 셈이 한 자도 안 바뀐다</b> (사장님 ★ · ⓐ)');
  const RD = await A.p.evaluate(async () => {
    const 전 = JSON.stringify(arTkCount('me'));
    /* 이어 붙입니다 — 손에 쥔 것까지 고쳐 놓고 다시 셉니다 */
    window.__RAW[0].client_id = 'c1';
    AR.db = arDbCalc(window.__RAW, window.__CALLS);
    const 후 = JSON.stringify(arTkCount('me'));
    return { 전: 전, 후: 후, 같나: 전 === 후 };
  });
  is(RD.같나,
    '  이어 붙인 뒤에도 단계별 수가 <b>그대로</b>다 — 배정 한도(일반 20 · 변액 +30)는 여전히 배정 DB 만 셉니다' +
    (RD.같나 ? '' : ('\n      전 ' + RD.전 + '\n      후 ' + RD.후)));
  is(R.화면_한도, '  화면이 <b>그렇다고 적어 둔다</b> — 「배정 한도는 여전히 배정 DB 만 셉니다」');

  console.log('\n[9] 🔌 <b>보는 일로는 서버에 안 간다</b> (7번)');
  /* ⚠ 처음에는 가짜 손잡이의 <b>메서드 호출</b>을 셌다가 「69번 갔다」 고
     헛울었습니다 — 홈의 다른 코드가 부른 것까지 더한 것입니다. 앱이 아니라
     제 자가 틀렸습니다 (8번). 그래서 <b>부르는 글이 있나</b> 를 봅니다. */
  {
    /* 정규식 대신 <b>글자 자리로</b> 자릅니다 — 정규식으로 하다 다섯 자리를
       다 「못 찾음」 으로 읽고 헛울었습니다 (8번). */
    const 몸of = (n) => {
      const a = src.indexOf('function ' + n + '(');
      if (a < 0) return '';
      const b = src.indexOf('\n}', a);
      return 걷기(src.slice(a, b < 0 ? (a + 3000) : (b + 2)));
    };
    const 보는것 = ['crmLinkOn', 'crmLinkOf', 'crmCliOf', 'crmGuess', 'arRecoCalc'];
    let 샌곳 = [];
    보는것.forEach(n => { const m = 몸of(n);
      if (!m) { 샌곳.push(n + '(못 찾음)'); return; }
      if (/osClient\(|\.from\(|fetch\(/.test(m)) 샌곳.push(n); });
    is(샌곳.length === 0,
      '  보는 자리 다섯(' + 보는것.join(' · ') + ')은 <b>서버를 안 부른다</b>' +
      (샌곳.length ? (' — 샌 곳: ' + 샌곳.join(', ')) : ''));
    const w = 몸of('crmLinkSet');
    is(/osClient\(/.test(w) && /\.from\('dbs'\)/.test(w),
      '  ★ <b>쓰는 자리는 crmLinkSet 하나</b>다 — 사람이 누른 그때만 갑니다');
    is(/\.eq\('id',\s*dbId\)/.test(w), '  ★ <b>그 한 줄만</b> 고친다 (eq id) — 통째로 쓸지 않습니다');
    is(!/select\(/.test(w), '  ★ 쓰고 나서 <b>다시 받아 오지 않는다</b> — 손에 있는 것만 고칩니다 (7번)');
  }

  console.log('');
  const 터짐 = [...A.errs, ...B.errs, ...C.errs];
  is(터짐.length === 0, '재는 동안 <b>조용히 터진 곳이 없다</b>' + (터짐.length ? (' — ' + 터짐[0]) : ''));

  await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '곳이 어긋났습니다.')
                  : '\n✓ 고객 365일과 DB 통합 CRM 이 한 사람으로 보이고, 한도 셈은 그대로입니다.');
  process.exit(bad ? 1 : 0);
})();
