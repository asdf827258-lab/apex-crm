/* ══════════════════════════════════════════════════════════════════
   check-crmband.js — 🚦 <b>한도 띠가 실제로 서고, 수가 맞나.</b>

   check-crmpersonal 은 <b>글만 봅니다</b>(fast, 몇 초). 규칙이 지워지면
   바로 울리지만, <b>띠가 DOM 에 안 붙어도 초록</b>입니다. 실제로 그
   구멍에 걸렸습니다 — 띠를 손으로 띄워 보니 🗂️ 줄이 숨어 있었습니다
   (그때는 제 견본의 칸 이름이 틀린 것이었지만, <b>자가 그것을 못 봤다는
   사실은 그대로</b>입니다).

   그래서 이 자는 <b>브라우저로 띄워 수를 읽습니다</b> — 왕복 시험입니다.

   ── 심는 것 (견본은 「홍길동」 · 3번) ───────────────────────────
     홍길동(u1) 앞으로
       · 회사 배정 · 진행중 : <b>7건</b>  (일반 / AP)
       · 회사 배정 · 끝남   : <b>3건</b>  (계약완료 · 증권전달 · 거절)
       · 개인               : <b>5건</b>  (소개 4 · 지인 1)
     고객 365일에는 홍길동 앞으로 셋 — 둘은 CRM 에 없고 하나는 있습니다.
     임꺽정(u2) 것을 하나씩 섞어 <b>남의 것을 안 세는지</b> 봅니다.

   ── 재는 것 ──────────────────────────────────────────────────────
     [1] 띠가 <b>담당자를 고르기 전엔 숨고, 고르면 선다</b>
     [2] ★★ <b>수가 맞다</b> — 7 / 3 / 5. 개인을 한도에 섞으면 12 가 되어
         이 자리가 울립니다. <b>손으로 세다 넘긴 그 사고</b>를 막는 자리입니다
     [3] ★ 화면이 <b>한도를 단정하지 않는다</b> — 「넘었다」 고 안 적습니다 (1번·2번)
     [4] 🗂️ <b>고객 365일에만 있는 분</b>이 2명 — 남의 것도, CRM 에 있는 것도
         안 셉니다
     [5] 거르개 두 갈래가 <b>실제로 거른다</b> — 개인 5줄 · 회사배정 10줄
     [6] 띄우는 동안 <b>콘솔이 조용하다</b>
     [7] ★★ <b>한도 수를 설정에 담으면 띠가 견준다</b> (2026-10-05 · X56-b)
         사장님이 「한도 수 설정에 담아서 띠가 견주게 해 줘」 라고 하셨습니다.
         담긴 수에 따라 여섯 가지로 갈립니다 — 안 담김 · 여유 · 넘김 ·
         사람별이 기본을 이김 · 남의 것이 안 섞임 · <b>깨진 글은 0</b>.
         ★ 깨진 글을 수로 꾸미면 화면이 거짓말합니다 (1번).
         ★ 설정 칸은 <b>운영자만</b> 봅니다 — 팀이 같이 쓰는 수라 담당자가
           제 한도를 스스로 올리면 뜻이 없습니다. 띠는 모두 봅니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = process.cwd();
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);

/* 견본 서버 — 이 저장소가 이미 쓰는 틀(check-dbfind)과 같은 모양입니다 */
const STUB = (QUOTA, ROLE) => `(function(){
function D(id,name,who,src,st){
  return {id:id,customer_name:name,phone:'010-1111-2222',region:'순천시',sigungu:'순천시',
    assigned_to:who,created_by:who,stage:st,assigned_date:'2026-07-01',
    created_at:'2026-07-01T00:00:00Z',source:src,addr:'',lat:null,lng:null,
    next_appt:null,next_appt_place:null,next_appt_lat:null,next_appt_lng:null,
    region_code:null,sido:null,dong:null,followup:null,memo:'',report_name:''};
}
var DBS=[],i;
for(i=0;i<7;i++)DBS.push(D('a'+i,'홍길동A'+i,'u1','일반','AP'));          /* 배정·진행중 7 */
DBS.push(D('b0','홍길동B0','u1','일반','계약완료'));                       /* 배정·끝남 3 */
DBS.push(D('b1','홍길동B1','u1','일반','증권전달'));
DBS.push(D('b2','홍길동B2','u1','일반','거절'));
for(i=0;i<4;i++)DBS.push(D('c'+i,'홍길동C'+i,'u1','소개','PC'));          /* 개인 5 */
DBS.push(D('d0','홍길동D0','u1','지인','TA'));
DBS.push(D('e0','임꺽정','u2','일반','AP'));                               /* 남의 것 */
var T={profiles:[{id:'u1',name:'홍길동',role:'${ROLE || 'admin'}',active:true},
                 {id:'u2',name:'박서준',role:'member',active:true}],
       dbs:DBS,calls:[],attendance:[],teams:[],team_members:[],
       app_config:[{key:'db_sources',value:'일반,소개,지인,개척'}]
         .concat(${QUOTA==null?'[]':"[{key:'db_quota',value:"+JSON.stringify(QUOTA)+"}]"}),
       /* 앱은 advisor_id|name_masked 로 읽습니다 — 서버엔 마스킹만 (3번).
          cusMask 는 가운데를 * 로 채웁니다 : 홍길동Z → 홍**Z */
       clients:[{advisor_id:'u1',name_masked:'홍**Z'},   /* CRM 에 없음 → 센다 */
                {advisor_id:'u1',name_masked:'홍**Y'},   /* CRM 에 없음 → 센다 */
                {advisor_id:'u1',name_masked:'홍***0'},  /* 홍길동A0 → 있음 → 안 센다 */
                {advisor_id:'u2',name_masked:'임*정'}]}; /* 남의 것 → 안 센다 */
function B(tbl){
  var rows=(T[tbl]||[]).slice(),one=false,b={};
  b.select=function(){return b};
  ['eq','neq','in','gte','lte','gt','lt','is','like','ilike','not','or','order','limit','range','contains']
   .forEach(function(k){ b[k]=function(f,v){
     if(k==='eq'&&f&&rows.length&&f in rows[0])rows=rows.filter(function(r){return r[f]===v});
     if(k==='in'&&f&&rows.length&&f in rows[0])rows=rows.filter(function(r){return (v||[]).indexOf(r[f])>=0});
     return b } });
  b.single=b.maybeSingle=function(){one=true;return b};
  ['insert','update','upsert','delete'].forEach(function(k){ b[k]=function(){return b} });
  b.then=function(res,rej){return Promise.resolve({data:one?(rows[0]||null):rows,error:null}).then(res,rej)};
  b.catch=function(f){return b.then(function(x){return x},f)};
  return b;
}
var U={id:'u1',email:'u1@example.com'},S={user:U,access_token:'stub'};
window.supabase={createClient:function(){return {
  from:function(t){return B(t)},
  auth:{ onAuthStateChange:function(cb){setTimeout(function(){cb('SIGNED_IN',S)},0);
           return {data:{subscription:{unsubscribe:function(){}}}} },
    getSession:function(){return Promise.resolve({data:{session:S},error:null})},
    getUser:function(){return Promise.resolve({data:{user:U},error:null})},
    signInWithPassword:function(){return Promise.resolve({error:null})},
    signUp:function(){return Promise.resolve({error:null})},
    signOut:function(){return Promise.resolve({error:null})} },
  channel:function(){return {on:function(){return this},subscribe:function(){return this},unsubscribe:function(){}}},
  removeChannel:function(){}
}}};
})();`;

(async () => {
  const srv = http.createServer((q, s) => {
    const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    fs.readFile(f, (e, b) => {
      if (e) { s.writeHead(404); s.end(''); }
      else { s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); s.end(b); }
    });
  });
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch();

  /* 한도와 역할을 바꿔 끼워 띄운다 — 담긴 수에 따라 띠가 갈리는지 보려면
     한 판으로는 못 잰다. 한도를 안 담은 판이 [1]~[6] 의 바탕이다. */
  const 띄운다 = async (quota, role) => {
    const pg = await (await br.newContext()).newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(String(e.message || e)));
    pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await pg.route('**/*', async r => {
      const u = r.request().url();
      if (/supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB(quota, role) });
      if (/pretendard/.test(u)) return r.fulfill({ contentType: 'text/css', body: '' });
      if (u.startsWith('http://localhost:' + P)) return r.continue();
      if (/^https?:/.test(u)) return r.fulfill({ status: 204, body: '' });
      return r.continue();
    });
    await pg.goto('http://localhost:' + P + '/db-crm.html', { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => { try { return (eval('dbs') || []).length > 0 } catch (e) { return false } },
                             { timeout: 30000 });
    await pg.evaluate(() => goPage('db'));
    await pg.waitForSelector('#dbBody tr', { timeout: 15000 });
    return { pg, errs };
  };

  /* 담당자를 고르고, 띠에 적힌 글과 배지·설정칸을 읽어 온다 */
  const 띠읽 = async (pg, who) => {
    await pg.evaluate(w => {
      const s = document.getElementById('ownerFilter');
      const v = [...s.options].map(o => o.value).filter(Boolean);
      s.value = w || v[0]; s.dispatchEvent(new Event('change'));
    }, who || '');
    await pg.waitForFunction(() => {
      const e = document.getElementById('crmQuota');
      return e && !e.classList.contains('hidden') && (e.textContent || '').length > 10;
    }, { timeout: 10000 }).catch(() => {});
    return pg.evaluate(() => {
      const e = document.getElementById('crmQuota'), c = document.getElementById('quotaAdminCard');
      return { 글: (e ? (e.textContent || '') : '').replace(/\s+/g, ' ').trim(),
               배지: [...(e ? e.querySelectorAll('.badge') : [])].map(b => b.className + '|' + b.textContent.trim()),
               칸: c ? !c.classList.contains('hidden') : null };
    });
  };

  const 첫판 = await 띄운다(null, 'admin');
  const pg = 첫판.pg, errs = 첫판.errs;

  const 읽 = () => pg.evaluate(() => {
    const g = id => { const e = document.getElementById(id);
      return e ? { 숨: e.classList.contains('hidden'),
                   글: (e.textContent || '').replace(/\s+/g, ' ').trim() } : null; };
    return { 한도: g('crmQuota'), 삼육오: g('dbFindN2'), 명단: g('dbFindN') };
  });

  head('[1] 띠가 <b>담당자를 고르기 전엔 숨고, 고르면 선다</b>');
  const 전 = await 읽();
  is(!!전.한도, '  띠가 설 자리(#crmQuota)가 화면에 있다');
  is(전.한도 && 전.한도.숨,
     '  담당자를 안 고르면 <b>숨는다</b> — 「누구 한도인가」 를 모르면 안 적습니다 (1번)');
  await pg.evaluate(() => {
    const s = document.getElementById('ownerFilter');
    const v = [...s.options].map(o => o.value).filter(Boolean);
    s.value = v[0]; s.dispatchEvent(new Event('change'));
  });
  await pg.waitForFunction(() => {
    const e = document.getElementById('crmQuota');
    return e && !e.classList.contains('hidden') && (e.textContent || '').length > 10;
  }, { timeout: 10000 }).catch(() => {});
  const 후 = await 읽();
  is(후.한도 && !후.한도.숨, '  ★ 담당자를 고르면 <b>실제로 선다</b>');

  head('[2] ★★ <b>수가 맞다</b> — 심은 7 / 3 / 5 (개인을 섞으면 12 가 됩니다)');
  const Q = (후.한도 && 후.한도.글) || '';
  console.log('      띠에 적힌 글 : ' + (Q || '(비었습니다)'));
  is(/회사 배정\s*7건/.test(Q),
     '  ★★ <b>진행중 회사 배정 7건</b> — 개인 5건이 섞이면 12건이 되어 여기가 울립니다');
  is(/끝난 것\s*3건/.test(Q), '  ★ <b>끝난 것 3건</b>을 뺐다고 적는다 (사장님 「진행중만」)');
  is(/개인 고객\s*5건/.test(Q), '  <b>개인 고객 5건</b>은 안 센다고 적는다');
  is(/홍길동/.test(Q), '  <b>누구의 것인지</b> 적는다');

  head('[3] ★ 화면이 <b>한도를 단정하지 않는다</b> (1번·2번)');
  is(/견주지 않습니다/.test(Q),
     '  ★ <b>「한도 수는 아직 안 적혀 있어 견주지 않습니다」</b> — 모르면 모른다고');
  is(!/(넘었|초과|한도 초과|위반)/.test(Q),
     '  ★ <b>「넘었다」 고 안 적는다</b> — 한도 수를 모르면 판정할 수 없습니다');
  is(!/한도\s*(20|30|50)\b/.test(Q), '  들은 수(20·30)를 <b>화면에 안 적는다</b>');

  head('[4] 🗂️ <b>고객 365일에만 있는 분</b>이 2명 — 남의 것·CRM 에 있는 것은 안 센다');
  const C = (후.삼육오 && 후.삼육오.글) || '';
  console.log('      줄에 적힌 글 : ' + (C || '(비었습니다)'));
  is(후.삼육오 && !후.삼육오.숨, '  ★ 줄이 <b>실제로 선다</b> — fast 자는 이것을 못 봅니다');
  is(/여기엔 없는 분\s*2명/.test(C),
     '  ★★ <b>2명</b> — 셋 중 하나는 CRM 에도 있고, 하나는 남의 것입니다');
  is(/개인 갈래/.test(C), '  <b>어디에 넣으면 되는지</b> 가리킨다');

  head('[5] 거르개 두 갈래가 <b>실제로 거른다</b>');
  const 옵 = await pg.evaluate(() => [...document.getElementById('srcFilter').options].map(o => o.value));
  is(옵.indexOf('__개인__') >= 0 && 옵.indexOf('__배정__') >= 0, '  두 갈래가 거르개에 있다');
  const 걸러 = async v => {
    await pg.evaluate(x => { const s = document.getElementById('srcFilter');
      s.value = x; s.dispatchEvent(new Event('change')); }, v);
    await pg.waitForTimeout(250);
    return pg.evaluate(() => document.querySelectorAll('#dbBody tr').length);
  };
  const 개인n = await 걸러('__개인__'), 배정n = await 걸러('__배정__');
  is(개인n === 5, '  ★ 「👤 개인 고객만」 → <b>5줄</b> (소개 4 · 지인 1) · 실제 ' + 개인n + '줄');
  is(배정n === 10, '  ★ 「🏢 회사 배정만」 → <b>10줄</b> (진행중 7 + 끝남 3) · 실제 ' + 배정n + '줄');

  head('[6] 띄우는 동안 <b>콘솔이 조용하다</b>');
  errs.slice(0, 5).forEach(e => console.log('      ⚠ ' + e.slice(0, 180)));
  is(errs.length === 0, '  오류 0개 · 실제 ' + errs.length + '개');

  head('[7] ★★ <b>한도 수를 설정에 담으면 띠가 견준다</b> (사장님 말씀)');
  const 본다 = async (quota, who, role) => {
    const t = await 띄운다(quota, role || 'admin');
    const o = await 띠읽(t.pg, who || '');
    await t.pg.close();
    return { ...o, 오류: t.errs.length };
  };
  /* ⑴ 안 담겼으면 견주지 않고, <b>고칠 길을 보여 준다</b> (6번) */
  const q0 = await 본다(null, 'u1');
  is(/견주지 않습니다/.test(q0.글) && !/한도 \d+건/.test(q0.글),
     '  안 담기면 <b>견주지 않는다</b> — 수를 지어 적지 않습니다 (1번)');
  is(/한도 수 적기/.test(q0.글),
     '  ★ 안 담겼을 때 <b>적는 자리로 가는 단추</b>가 선다 — 「없다」 고만 적으면 그대로 둡니다 (6번)');

  /* ⑵ 여유가 있을 때 — 진행중 7 · 한도 20 → 13건 더 */
  const q1 = await 본다(JSON.stringify({ 기본: 20 }), 'u1');
  console.log('      ' + q1.글);
  is(/한도 <?b?>?20건/.test(q1.글.replace(/<[^>]*>/g, '')) || /한도 20건/.test(q1.글),
     '  담긴 수를 <b>그대로</b> 적는다 (20건)');
  is(/13건 더 받을 수 있습니다/.test(q1.글),
     '  ★★ <b>남은 수를 센다</b> — 20 − 7 = 13 (개인 5건·끝난 3건이 섞이면 틀립니다)');
  is(q1.배지.some(b => /green/.test(b)), '  여유가 있으면 <b>초록</b> 배지 — 이미 있는 이름(badge green)');

  /* ⑶ 넘었을 때 — 진행중 7 · 한도 5 → 2건 넘음 */
  const q2 = await 본다(JSON.stringify({ 기본: 5 }), 'u1');
  console.log('      ' + q2.글);
  is(/2건 넘었습니다/.test(q2.글), '  ★★ <b>넘은 수를 센다</b> — 7 − 5 = 2');
  is(q2.배지.some(b => /red/.test(b)), '  넘으면 <b>붉은</b> 배지 (badge red)');
  is(!/견주지 않습니다/.test(q2.글), '  담겼으면 「견주지 않습니다」 를 <b>더 말하지 않는다</b>');

  /* ⑷ 사람별이 기본을 <b>이긴다</b> — 변액 자격이 있는 분이 여기 들어갑니다 */
  const q3 = await 본다(JSON.stringify({ 기본: 5, 사람: { u1: 50 } }), 'u1');
  console.log('      ' + q3.글);
  is(/한도 50건/.test(q3.글) && !/한도 5건/.test(q3.글),
     '  ★★ <b>이 분만 적은 수가 이긴다</b> (50) — 기본 5 를 덮습니다');
  is(/이분만 따로 적힌 수/.test(q3.글), '  ★ <b>따로 적힌 수라고 밝힌다</b> — 왜 남과 다른지 모르면 의심합니다');
  is(/43건 더 받을 수 있습니다/.test(q3.글), '  남은 수도 그 수로 센다 — 50 − 7 = 43');

  /* ⑸ 남의 것이 안 섞인다 — 박서준은 제 것만 */
  const q4 = await 본다(JSON.stringify({ 기본: 5, 사람: { u1: 50 } }), 'u2');
  console.log('      ' + q4.글);
  is(/박서준/.test(q4.글) && /한도 5건/.test(q4.글),
     '  ★ 박서준에게는 <b>기본 5</b> 가 쓰인다 — 홍길동의 50 이 안 새어 옵니다');
  is(!/이분만 따로 적힌 수/.test(q4.글), '  따로 안 적힌 분에게는 <b>그 말을 안 한다</b>');

  /* ⑹ ★ 적힌 글이 깨졌을 때 — <b>0 으로 둔다</b>. 꾸미면 화면이 거짓말한다 */
  const q5 = await 본다('{이건 JSON 이 아님', 'u1');
  is(/견주지 않습니다/.test(q5.글) && !/한도 \d+건/.test(q5.글),
     '  ★★ <b>깨진 글은 0</b> — 못 읽은 것을 수로 꾸미지 않습니다 (1번 · 모름 ≠ 0)');
  is(q5.오류 === 0, '  깨진 글에도 <b>터지지 않는다</b> · 오류 ' + q5.오류 + '개');

  /* ⑺ ★ 설정 칸은 운영자만 — 띠는 모두 본다 */
  is(q2.칸 === true, '  운영자는 <b>적는 칸을 본다</b>');
  const q6 = await 본다(JSON.stringify({ 기본: 5 }), 'u1', 'member');
  is(q6.칸 === false,
     '  ★ 담당자에게는 <b>적는 칸이 안 보인다</b> — 제 한도를 스스로 올리면 뜻이 없습니다');
  is(/한도 5건/.test(q6.글) && /2건 넘었습니다/.test(q6.글),
     '  ★ 그래도 <b>띠는 본다</b> — 제가 몇 건 들고 있는지는 알아야 합니다');
  is(!/한도 수 적기/.test(q6.글), '  고칠 수 없는 사람에게 <b>고치는 단추를 안 보인다</b>');

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '가지가 어긋났습니다 (' + n + '가지 중)'); process.exit(1); }
  console.log('✓ ' + n + '가지 모두 통과 — 🚦 띠가 서고 수가 맞습니다');
})().catch(e => { console.log('터짐: ' + (e && e.stack || e)); process.exit(1); });
