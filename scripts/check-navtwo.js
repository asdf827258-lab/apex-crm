/* ══════════════════════════════════════════════════════════════════
   check-navtwo.js — <b>서랍의 두 칸</b> — 왼쪽 CRM 요약 · 오른쪽 전체 지도.

   사장님 말씀 (2026-10-09) — 「찾기 칸을 <b>반으로 쪼개서</b> 왼쪽인 그 칸에
   <b>DB통합CRM 요약</b> 만들어 주고, 오른쪽엔 <b>무엇을 도울까요? 사용설명서</b>
   넣어 줘 — 내꺼 <b>마인드맵으로 펼쳐놨던 것</b>」. 오른쪽은 여쭈어
   <b>🗺️ APEX 전체 지도</b>(apex-map.html · 「자비스」)로 정했습니다.

   ── ⚠ 쪽지가 거짓이었습니다 ───────────────────────────────────────
   코드에 「찾기 칸은 <b>☰ 서랍 맨 위</b>」 라고 두 군데 적혀 있는데, 열어
   재어 보니 <b>맨 아래</b>였습니다 — 폰 674px · 컴퓨터 829px, 공지·메뉴·
   단추 넷 다음입니다. 그래서 이 자는 글을 안 믿고 <b>차례를 실제로</b>
   잽니다(두 칸이 찾기 <b>바로 위</b>인가).

   ── 이 자가 제일 걱정하는 것 ───────────────────────────────────────
   ⓐ <b>또 세는 것.</b> 단계별 건수는 arTkCount 하나가 세고 「진행중」 은
      arTkRun 이 AP·PC·CS 를 더합니다. 여기서 또 더하면 한 곳을 빠뜨려
      <b>서랍과 CRM 화면이 다른 수</b>를 말합니다 (5번).
   ⓑ <b>모름을 0 으로 적는 것.</b> 아직 못 읽었는데 「0명」 이라고 적으면
      「배정이 없다」 는 뜻이 되어 버립니다 (1번).
   ⓒ <b>이름이 새는 것.</b> 서랍은 고객 앞에서도 열립니다 — 수만 적습니다 (3번).
   ⓓ <b>컴퓨터에서 안 갱신되는 것.</b> 넓은 화면은 서랍이 늘 펴져 있어
      「열기」 신호가 없습니다 — 열 때만 그리면 컴퓨터에서는 영원히
      「아직 못 읽었습니다」 입니다. <b>실제로 그랬습니다.</b>
   ⓔ <b>길이 둘이 되는 것.</b> 오른쪽 칸이 전체 지도로 가므로 아래 있던
      🗺️ 단추는 거뒀습니다 — 한 서랍에 같은 화면으로 가는 길이 둘이면
      쌍둥이입니다 (5번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8978;
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

/* 씨 — 배정 DB 다섯 줄. AP·PC·CS 가 하나씩이라 <b>진행중 3</b>, 계약완료 1.
   이름은 <b>홍길동</b> 꼴이고, 서랍에 그 이름이 새는지도 같이 봅니다 (3번). */
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
 AR.loaded=true;AR.busy='';AR.calls=[];AR.rep={};AR.cliRows=[];
 ${o && o.못읽음 ? 'AR.db=null;' : `AR.db=[
   {id:'d1',who:'me',name:'홍길동가',stage:'AP',days:2,region:'서울',src:'일반'},
   {id:'d2',who:'me',name:'홍길동나',stage:'PC',days:3,region:'서울',src:'일반'},
   {id:'d3',who:'me',name:'홍길동다',stage:'CS',days:1,region:'서울',src:'일반'},
   {id:'d4',who:'me',name:'홍길동라',stage:'계약완료',days:5,region:'서울',src:'일반'},
   {id:'d5',who:'me',name:'홍길동마',stage:'미접촉',days:9,region:'서울',src:'일반'}];`}
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 CHKS.busy=false;CHKS.err='';CHKS.rows=[];CHKS.fin={};CHKS.by={};
 HWHO.id='';go('home');`;

/* 서랍을 열고 <b>보이는 차례</b>를 읽습니다 — 글을 안 믿고 자리를 잽니다 */
const 차례 = async (p) => await p.evaluate(async () => {
  try { if (typeof toggleNav === 'function' && !navWide()) toggleNav(); } catch (e) {}
  await new Promise(r => setTimeout(r, 800));
  const sb = document.getElementById('sidebar');
  if (!sb) return { X: '서랍이 없습니다' };
  const out = [];
  sb.querySelectorAll('.sb-guide, .nav-two, .nav-find').forEach(e => {
    const b = e.getBoundingClientRect();
    if (b.height <= 0) return;
    out.push({ top: Math.round(b.top), 키: (e.className || '').toString().split(' ')[0],
               글: (e.innerText || '').replace(/\s+/g, ' ').trim() });
  });
  out.sort((a, b) => a.top - b.top);
  const two = sb.querySelector('.nav-two');
  const btns = two ? [...two.querySelectorAll('button')] : [];
  return { out,
    두칸: !!two,
    칸수: btns.length,
    왼: btns[0] ? (btns[0].innerText || '').replace(/\s+/g, ' ').trim() : '',
    오: btns[1] ? (btns[1].innerText || '').replace(/\s+/g, ' ').trim() : '',
    가는곳: btns.map(b => (b.getAttribute('onclick') || '')),
    지도길: [...sb.querySelectorAll('[onclick]')].filter(e => /apexmap/.test(e.getAttribute('onclick') || '')).length,
    글전부: (sb.innerText || '') };
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const open = async (o, w, h) => {
    const ctx = await b.newContext({ viewport: { width: w || 390, height: h || 844 } });
    await ctx.route('**://**', r => {
      const u = r.request().url();
      if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
      바깥++; return r.abort();
    });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
    await p.waitForTimeout(2600);
    await p.evaluate(SEED(o || {})); await p.waitForTimeout(2200);
    return { ctx, p, errs };
  };
  const src = fs.readFileSync('app/index.html', 'utf8');
  const 걷기 = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

  console.log('[1] 📌 <b>자리가 한 곳</b>이다 (5번)');
  {
    is((src.match(/function navSumHtml\(\)/g) || []).length === 1, '  두 칸을 짓는 자리가 하나다');
    is((src.match(/id="navSumBox"/g) || []).length === 1, '  왼쪽 칸(id)이 하나다');
    is((src.match(/'\.nav-two\{/g) || []).length === 1, '  옷(.nav-two)이 한 곳에만 있다');
    is((걷기(src).match(/navSumHtml\(\)/g) || []).length === 2,
      '  부르는 자리가 하나다 (선언 1 + 호출 1)');
  }

  console.log('\n[2] 🧮 <b>또 세지 않는다</b> (5번)');
  {
    const 몸 = 걷기((src.match(/function navSumCnt\(\)\{[\s\S]*?\n\}/) || [''])[0]);
    is(/arTkCount\(/.test(몸), '  단계별 건수는 <b>arTkCount</b> 가 센다');
    is(/arTkRun\(/.test(몸), '  「진행중」 은 <b>arTkRun</b> 이 더한다');
    is(!/\['AP'\]|\['PC'\]|\['CS'\]/.test(몸),
      '  AP·PC·CS 를 <b>제 손으로 더하지 않는다</b> — 빠뜨릴 자리를 안 만듭니다');
    is(/AR\.db!==null/.test(몸), '  <b>읽었나</b>를 AR.db 로 가린다 (1번)');
  }

  const A = await open({}, 390, 844);
  /* ⚠ <b>이 토막만</b> 셉니다. 처음에는 끝에서 셈을 견주었다가, 뒤에 연 창
     둘(컴퓨터·못읽음)의 <b>시작 요청</b>까지 더해 「4번 불렀다」 고
     헛울었습니다 — 앱이 아니라 제 자가 틀린 것입니다 (8번). */
  const 바깥전 = 바깥;
  const R = await 차례(A.p);
  const 띠그릴때 = 바깥 - 바깥전;

  console.log('\n[3] 📱 <b>폰에서 두 칸이 서고, 찾기 바로 위</b>다');
  is(!R.X && R.두칸 && R.칸수 === 2, '  두 칸이 선다 — ' + (R.칸수 || 0) + '칸');
  {
    const i = (R.out || []).findIndex(x => x.키 === 'nav-two');
    const j = (R.out || []).findIndex(x => x.키 === 'nav-find');
    is(i >= 0 && j >= 0 && j === i + 1,
      '  차례가 <b>두 칸 → 찾기</b>다 (두 칸 ' + i + '번째 · 찾기 ' + j + '번째)');
    is(/DB통합CRM/.test(R.왼), '  왼쪽은 <b>DB통합CRM</b> — 「' + R.왼.slice(0, 34) + '」');
    is(/무엇을 도울까요/.test(R.오) && /전체 지도/.test(R.오),
      '  오른쪽은 <b>무엇을 도울까요 · 전체 지도</b> — 「' + R.오.slice(0, 34) + '」');
  }

  console.log('\n[4] 🔢 <b>수가 맞다</b> — 씨는 AP1·PC1·CS1·계약완료1·미접촉1');
  is(/5\s*명/.test(R.왼), '  전체 <b>5명</b>');
  is(/진행중\s*3/.test(R.왼), '  진행중 <b>3</b> (AP·PC·CS)');
  is(/미전달\s*1/.test(R.왼), '  증권 미전달 <b>1</b>');

  console.log('\n[5] 🙈 <b>이름을 한 자도 안 적는다</b> (3번)');
  is((R.글전부 || '').indexOf('홍길동가') < 0 && (R.글전부 || '').indexOf('홍길동마') < 0,
    '  서랍 어디에도 고객 이름이 없다 — 수만 적습니다');

  console.log('\n[6] 🗺️ <b>길이 하나</b>다 (5번)');
  is(R.지도길 === 1, '  서랍에서 전체 지도로 가는 자리가 <b>하나</b>다 — 지금 ' + R.지도길 + '곳');
  is(/go\('crm'\)/.test((R.가는곳 || [])[0] || ''), '  왼쪽을 누르면 <b>DB 통합 CRM</b> 으로 간다');
  is(/go\('apexmap'\)/.test((R.가는곳 || [])[1] || ''), '  오른쪽을 누르면 <b>전체 지도</b>로 간다');

  console.log('\n[7] 🖥 <b>컴퓨터에서도 수가 적힌다</b> — 열기 신호가 없는 자리');
  const C = await open({}, 1280, 900);
  const RC = await 차례(C.p);
  is(!RC.X && RC.두칸, '  넓은 화면에서도 두 칸이 선다');
  is(/5\s*명/.test(RC.왼 || ''),
    '  <b>수가 적혀 있다</b> — 「' + (RC.왼 || '').slice(0, 34) + '」 (열 때만 그리면 여기가 빕니다)');

  console.log('\n[8] ❓ <b>모름을 0 으로 안 적는다</b> (1번)');
  const D = await open({ 못읽음: true }, 390, 844);
  const RD = await 차례(D.p);
  is(!/\d/.test((RD.왼 || '').replace(/365|통합|CRM/g, '')),
    '  수를 <b>한 자도 안 적는다</b> — 「' + (RD.왼 || '').slice(0, 34) + '」');
  is(/못 읽었습니다/.test(RD.왼 || ''), '  <b>왜 모르는지</b> 적고 길을 준다');

  console.log('\n[9] 🔌 <b>서버를 안 부른다</b> (7번)');
  is(띠그릴때 === 0, '  서랍을 열고 수를 그리는 동안 바깥을 <b>' + 띠그릴때 + '번</b> 불렀다');

  console.log('');
  const 터짐 = [...A.errs, ...C.errs, ...D.errs];
  is(터짐.length === 0, '재는 동안 <b>조용히 터진 곳이 없다</b>' + (터짐.length ? (' — ' + 터짐[0]) : ''));

  await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '곳이 어긋났습니다.')
                  : '\n✓ 서랍이 CRM 요약과 전체 지도를 두 칸으로 들고, 수는 세는 자리 하나에서 옵니다.');
  process.exit(bad ? 1 : 0);
})();
