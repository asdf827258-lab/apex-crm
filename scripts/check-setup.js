/* 서버 준비 SQL — 저장이 안 되던 것들이 여기 들어 있는가.

   이 앱의 「저장이 안 된다」 는 거의 다 같은 원인이었다. 담을 표나 함수를
   만드는 SQL 을 아직 서버에서 실행하지 않은 것이다. 그런데 화면은
   「저장 실패」 다섯 글자만 띄워서, 무엇을 해야 하는지 알 수가 없었다.

   여기서 두 가지를 본다.

     1. 저장이 막혔을 때 「무엇을 눌러야 하는지」 를 말해 주는가
     2. 홈 배너의 준비 SQL 안에 그동안 빠져 있던 것이 다 들어갔는가
        — 메뉴 접근 설정 · 월간 영업보고서 · 리더 사업계획서 · 계정 중복 정리
        — 특히 사업계획서의 넣기 권한. 이게 「본인 줄만」 이면 리더가
          팀원 목표를 내려보낼 때 그 달 첫 적용이 반드시 막힌다.       */
const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const ROOT=process.cwd();
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css'};
const srv=http.createServer((rq,rs)=>{let p=decodeURIComponent(url.parse(rq.url).pathname);
  let f=path.join(ROOT,p); if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  if(!fs.existsSync(f)){rs.writeHead(404);rs.end('no');return;}
  rs.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'text/plain'});fs.createReadStream(f).pipe(rs);});
let bad=0; const is=(ok,m)=>{console.log((ok?'  ✓ ':'  ✗ ')+m); if(!ok)bad++;};
(async()=>{
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const page=await b.newPage();
  await page.goto('http://127.0.0.1:'+srv.address().port+'/app/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(2200);
  console.log('\n[1] 저장이 안 될 때 무엇을 하라고 하는가');
  const r=await page.evaluate(()=>({
    미설치: pfWhy('사업계획서를 저장하지 못했습니다',{code:'42P01',message:'relation "public.team_plans" does not exist'}),
    권한:   pfWhy('3명에게 목표를 못 내려보냈습니다',{code:'42501',message:'new row violates row-level security policy'}),
    로그인: pfWhy('저장 실패',{message:'JWT expired'}),
    기타:   pfWhy('저장 실패',{message:'connection reset'}),
    ver:    (typeof SETUP_VER!=='undefined')?SETUP_VER:0
  }));
  Object.keys(r).forEach(k=>{ if(k!=='ver') console.log('    ['+k+'] '+r[k]); });
  is(/서버 준비 SQL/.test(r.미설치),'표가 없을 때 — 준비 SQL 을 가리킨다');
  is(/서버 준비 SQL/.test(r.권한),'권한에 막혔을 때 — 준비 SQL 을 가리킨다');
  is(/로그인이 풀렸/.test(r.로그인),'로그인이 풀렸을 때 — 새로고침을 가리킨다');
  is(/connection reset/.test(r.기타),'모르는 오류는 서버 말을 그대로 보여 준다');
  is(r.ver>=34,'앱이 기다리는 준비 SQL 판이 올라가 있다 — '+r.ver);
  console.log('\n[2] 준비 SQL 안에 빠졌던 것이 들어 있는가');
  const sql=await page.evaluate(()=>HX_SQL['00'].lines.join('\n'));
  [['tool_access','메뉴 접근 설정'],['team_plans','리더 사업계획서'],['monthly_perf','월간 영업보고서'],
   ['admin_delete_account','계정 삭제'],['admin_user_list','계정 목록']].forEach(([k,n])=>{
    is(sql.indexOf(k)>=0, n+' ('+k+')');
  });
  is(/monthly_perf_insert[\s\S]{0,200}can_see_perf\(owner_id\)/.test(sql),
     '넣기 권한이 can_see_perf 로 바뀌었다 — 리더가 팀원 줄을 만들 수 있다');
  is(!/monthly_perf_insert[\s\S]{0,160}with check \(owner_id = auth\.uid\(\)\)/.test(sql),
     '옛 규칙(본인 줄만)이 남아 있지 않다');

  /* ── 팀 하루 한 장 피드백 ─────────────────────────────────────
     리더가 팀원 폰에 꽂는 자리다. 이것이 준비 SQL 밖에 따로 있으면
     대표님께 「그 파일을 여세요」 라고 말해야 한다 — 그러면 안 하신다.
     표만 있고 규칙이 없으면 RLS 에 막혀 아무도 못 읽으니 넷을 다 본다. */
  [['create table if not exists public.team_feedback','표를 만든다'],
   ['team_feedback_read','읽기 규칙'],
   ['team_feedback_insert','넣기 규칙'],
   ['team_feedback_update','읽음 표시 규칙']].forEach(([k,n])=>{
    is(sql.indexOf(k)>=0, '팀 하루 한 장 피드백 — '+n);
  });
  is(/team_feedback_read[\s\S]{0,220}can_see_perf\(member_id\)/.test(sql),
     '보는 잣대가 can_see_perf 다 — 새 잣대를 만들지 않았다');
  is(/team_feedback_uni[\s\S]{0,140}\(member_id, fb_date, from_id\)/.test(sql),
     '같은 사람 · 같은 날은 한 줄로 덮어쓴다');

  /* 번호를 여기 박아 두면 올릴 때마다 이 파일도 같이 고쳐야 한다.
     정작 중요한 것은 「앱이 기다리는 번호」와 「SQL 이 남기는 번호」가
     서로 같은가다. 어긋나면 대표님이 SQL 을 돌려도 배너가 안 사라진다. */
  const stamped=(sql.match(/'schema_version',\s*'(\d+)'/)||[])[1];
  is(stamped!==undefined,'SQL 이 끝나면 서버에 판 번호를 남긴다 — '+stamped);
  is(+stamped===r.ver,'그 번호가 앱이 기다리는 번호와 같다 — SQL '+stamped+' · 앱 '+r.ver);
  console.log('\n[3] 서버 열쇠 — 안내는 그대로, <b>재촉은 안 한다</b>');
  /* ★ 홈의 「서버 열쇠가 아직 없습니다」 재촉은 걷어냈습니다. 그 판정이
     <b>이 브라우저에 담아 둔 딱지 하나</b>만 보고 서버가 실제로 도는지는
     안 보고 단정했기 때문입니다 — 밤일이 멀쩡히 도는데도 매일 아침
     열쇠를 넣으라고 했습니다 (1번 · 아직 모르는 것을 없다고 적은 자리).

     그래서 재는 것을 뒤집습니다 — <b>안 뜨는가</b>를 잽니다. 그리고
     알림을 없앤 것이 아니라는 것도 같이 못 박습니다: 밤일이 정말 안 돌면
     nwBoxHtml() 이 그때 말합니다. 그것은 딱지가 아니라 <b>서버에 물어본
     결과</b>(NW.ok)라서, 되는데 뜨거나 안 되는데 조용할 일이 없습니다. */
  const kb = await page.evaluate(() => {
    OS.profile = OS.profile || {}; OS.profile.role = 'owner';
    try { localStorage.removeItem('apex_nf_keys'); } catch (e) {}
    const g = document.getElementById('osLoginGate'); if (g) g.style.display = 'none';
    go('home');
    const pane = document.getElementById('dynPane') || document.body;
    return { slot: !!document.getElementById('osNfKeyHome'),
             nag: /서버 열쇠가 아직 없습니다/.test(pane.textContent),
             fn: typeof window.nfKeyBarHtml === 'function',
             guide: typeof window.nfGuide === 'function' };
  });
  is(!kb.slot && !kb.nag, '홈에 <b>열쇠 재촉이 안 뜬다</b> — 딱지 하나로 「없다」 고 단정하지 않는다 (1번)');
  is(!kb.fn, '그 판을 그리던 함수가 <b>안 남아 있다</b> — 죽은 판이 돌면 안 된다 (5번)');
  is(kb.guide, '열쇠 넣는 <b>안내는 그대로</b> 있다 — 재촉만 뺐지 길을 없앤 것이 아니다');
  /* 밤일이 안 돌 때는 <b>그때</b> 말해야 한다 — 그건 서버에 물어본 결과다 */
  const nw = await page.evaluate(() => {
    NW.ok = false; NW.msg = 'SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다'; NW.at = '09:00';
    const bad = nwBoxHtml();
    NW.ok = true; NW.msg = '돌고 있습니다';
    const good = nwBoxHtml();
    return { bad: bad.replace(/\s+/g, ' '), good: good.replace(/\s+/g, ' ') };
  });
  is(/안 만들어지고 있습니다/.test(nw.bad) && /열쇠 넣기/.test(nw.bad),
     '밤일이 <b>정말 안 돌 때는</b> 그때 말하고 넣는 길을 준다 — 실패를 성공처럼 말하지 않는다');
  is(/돕니다/.test(nw.good) && !/열쇠 넣기/.test(nw.good),
     '<b>돌고 있으면 조용하다</b> — 되는 것을 안 되는 것처럼 말하지 않는다');

  const gd = await page.evaluate(() => {
    nfGuide();
    const w = document.getElementById('nfGuide');
    if (!w) return null;
    return { steps: w.querySelectorAll('.nfg-c').length,
             keys: Array.from(w.querySelectorAll('.kv-c')).map(e => e.textContent),
             links: Array.from(w.querySelectorAll('a.go')).map(e => e.getAttribute('href')),
             t: w.textContent.replace(/\s+/g, ' ') };
  });
  is(gd && gd.steps === 5, '눌러서 열리는 안내가 다섯 걸음이다 — ' + (gd ? gd.steps : 0));
  /* 글 쓰는 열쇠는 앤트로픽이든 구글이든 하나면 된다 — 둘 다 길을 열어 둔다 */
  is(gd && gd.keys.join(',') === 'ANTHROPIC_API_KEY,GEMINI_API_KEY,SUPABASE_SERVICE_ROLE_KEY',
     '열쇠 이름 셋을 복사할 수 있게 세워 뒀다 — ' + (gd ? gd.keys.join(' / ') : ''));
  is(gd && /둘 중 아무거나 하나만/.test(gd.t), '글 쓰는 열쇠는 하나만 넣으면 된다고 말한다');
  [['configuration/env', 'Netlify 환경변수'], ['console.anthropic.com', '앤트로픽 콘솔'],
   ['settings/api', 'Supabase API'], ['/deploys', '배포 화면'],
   ['aistudio.google.com', 'Google AI Studio']].forEach(([u, n]) =>
    is(!!gd && gd.links.some(x => x.indexOf(u) >= 0), '  ' + n + ' 로 바로 간다'));
  is(gd && /최고 권한/.test(gd.t), 'service_role 경고가 있다 — 대화창에 붙이지 말라고');
  is(gd && /Clear cache and deploy/.test(gd.t), '재배포해야 열쇠가 들어간다는 것을 적었다');

  /* ── 4) <b>준비 SQL 이 실제로 홈 맨 위에 서는가</b> ─────────────────
     여기 있던 배너 점검을 한 번 뗐다가 그대로 사고가 났습니다. 사장님이
     없애라신 것은 <b>「서버 열쇠가 아직 없습니다」 재촉</b>([3])이었는데,
     <b>「서버 준비 SQL」 배너</b>까지 한 덩어리로 보고 같이 뗐습니다.
     그 뒤 홈을 다시 만들면서 osSetupHome 자리가 사라졌고 — 점검이 없으니
     <b>아무도 몰랐습니다.</b> 앱은 띄우려 하는데(setupShow=true, 809자)
     놓일 자리가 없어 아무 데도 안 떴고, 여러 화면이 「홈 맨 위 서버 준비
     SQL」 이라고 가리키는 곳이 <b>빈 자리</b>였습니다.

     그래서 <b>말과 화면이 어긋나지 않는가</b>까지 잽니다. 「홈 맨 위」 라고
     적어 두었으면 홈에 그 자리가 실제로 있어야 합니다 (5번).           */
  console.log('\n[4] 준비 SQL 이 <b>실제로 홈 맨 위에</b> 선다');
  const sb = await page.evaluate(() => {
    OS.session = { user: { id: 'u1' } };
    OS.profile = { id: 'u1', name: '홍길동', role: 'owner', active: true, plan: 'vip' };
    SETUP.hide = false;
    const realCfg = window.osCfgGet;
    /* ① 아직 안 돌린 대표 */
    window.osCfgGet = function (k, d) { return k === 'schema_version' ? '0' : realCfg(k, d); };
    go('home');
    const pane = document.getElementById('dynPane');
    const bar = pane.querySelector('.stp');
    /* ⚠ 2026-09-24 · 잣대를 <b>hmCliHost(내 고객)</b> 에서 <b>hmToday(오늘
       챙길 것)</b> 로 옮겼습니다. 내 고객 칸이 「고객 365일」 로 갔기 때문인데,
       <b>재는 것은 더 세졌습니다</b> — 오늘 챙길 것은 홈의 <b>첫 덩어리</b>라,
       그보다 위면 정말 맨 위입니다. 옛 잣대는 없어진 칸을 가리켜 늘 빨간불
       이었고, 그냥 지웠으면 배너가 맨 아래로 내려가도 아무도 못 봅니다 (8번). */
    const cli = document.getElementById('hmToday');
    const O = {
      shown: !!bar,
      text: bar ? bar.textContent.replace(/\s+/g, ' ').trim() : '',
      /* 오늘 챙길 것보다 <b>위</b>에 있어야 「맨 위」 다 */
      aboveCli: !!(bar && cli && (bar.compareDocumentPosition(cli) & Node.DOCUMENT_POSITION_FOLLOWING)),
      btn: bar ? Array.from(bar.querySelectorAll('button')).map(x => x.textContent.trim()) : []
    };
    /* ② 다 돌린 대표 — 안 떠야 한다 */
    window.osCfgGet = function (k, d) { return k === 'schema_version' ? String(SETUP_VER) : realCfg(k, d); };
    go('home');
    O.afterDone = !!document.getElementById('dynPane').querySelector('.stp');
    /* ③ 팀원 — 할 수 없는 일이라 안 떠야 한다 */
    window.osCfgGet = function (k, d) { return k === 'schema_version' ? '0' : realCfg(k, d); };
    OS.profile.role = 'member';
    go('home');
    O.member = !!document.getElementById('dynPane').querySelector('.stp');
    OS.profile.role = 'owner'; window.osCfgGet = realCfg;
    return O;
  });
  is(sb.shown, '  아직 안 돌리셨으면 홈에 <b>실제로 뜬다</b> — 앱이 띄우려 해도 자리가 없으면 안 뜬다');
  is(sb.aboveCli, '  <b>오늘 챙길 것보다 위</b>에 있다 — 「홈 맨 위」 라고 말하는 곳이 여럿이다');
  is(sb.btn.some(t => /Supabase/.test(t)), '  <b>복사하고 Supabase 열기</b> 단추가 있다 — ' + sb.btn.join(' · '));
  is(sb.btn.some(t => /확인/.test(t)), '  <b>다 됐는지 확인</b> 단추가 있다 — 돌린 뒤 배너가 스스로 사라지는 길');
  is(!sb.afterDone, '  다 돌리신 뒤에는 <b>안 뜬다</b> — 끝난 일이 고객 관리를 가리면 안 된다');
  is(!sb.member, '  팀원에게는 <b>안 뜬다</b> — 팀원은 SQL 을 돌릴 수 없다');
  /* 「홈 맨 위」 라고 <b>말하는</b> 곳이 있으면, 홈에 그 자리가 있어야 한다 (5번) */
  const SRC2 = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const says = (SRC2.match(/홈 맨 위/g) || []).length;
  const home = SRC2.slice(SRC2.indexOf('function renderHome('), SRC2.indexOf('function osPage('));
  is(says === 0 || /id="osSetupHome"/.test(home),
     '  「홈 맨 위」 라고 <b>말하는 곳이 ' + says + '군데</b>인데, 홈에 그 자리가 실제로 있다 (5번)');

  /* ── 5) <b>막혀 있는 것을 홈에서 그 자리에서 푼다</b> ────────────────
     「준비 SQL 이 안 보인다」 에서 나온 칸입니다. 여태 저장이 막히면
     「설정 → 조직도를 보세요」 라고만 했습니다 — 두 걸음이면 안 하십니다.

     여기서 제일 위험한 것은 <b>쌍둥이</b>입니다 (5번). 무엇이 남았는지
     아는 곳은 rdAuto() 하나여야 하고, 줄을 그리는 것도 rdRowHtml() 하나여야
     합니다. 홈이 제 목록을 따로 만들면 출발 점검과 갈라져, 한쪽만 고쳐집니다.

     그리고 <b>7번</b>. 홈은 하루에 수십 번 여는 화면인데 rdLoad 는 서버를
     셋 부릅니다. 막는 자리가 없으면 그대로 요금이 됩니다.               */
  /* ⚠ <b>2026-09-24 · 이 절이 보는 자리가 바뀌었습니다.</b>
     🚦 출발 점검 요약(.hm-rdy · 778px)은 홈에서 「출발 점검」 화면으로
     갔습니다. 그래서 「막혀 있는 것」 은 <b>거기서</b> 재고, 홈에서는
     <b>준비 SQL 한 자리</b>만 잽니다 — 사장님 ★ 「준비 SQL 은 여러 화면이
     「홈 맨 위」 라고 가리키므로 그 자리에 둔다」.

     ★ <b>재는 것을 하나도 안 줄였습니다.</b> 옮긴 자리에서 같은 것을 재고,
     옮기면서 새로 생긴 위험 셋을 더 겁니다 —
       ① 옛 칸이 홈에 <b>남아 있지 않은가</b> (남으면 두 벌 · 5번)
       ② 홈이 이제 출발 점검을 <b>한 번도 안 읽는가</b> (7번 · 전에는 1번)
       ③ 「나중에」 로 닫았을 때 <b>홈 맨 위에 한 줄이 남는가</b>
          — 예전에는 .hm-rdy 가 받아 주었습니다. 그 칸이 없어졌으니
            <b>배너 자리가 스스로</b> 맡아야 합니다. 안 그러면 한 번
            닫는 순간 홈에서 SQL 을 돌릴 길이 사라집니다.               */
  console.log('\n[5] 막혀 있는 것이 <b>출발 점검</b>에 뜨고, 홈 맨 위는 <b>준비 SQL 을 놓치지 않는다</b>');
  const rd = await page.evaluate(async () => {
    /* 흉내 서버 — 대표인데 조직도·백업이 아직 비어 있다 (견본은 홍길동 · 3번) */
    const mk = (tbl) => { const a = {};
      ['select','order','limit','eq','neq','gte','lte','in','is','not','or','filter',
       'range','single','maybeSingle','match','update','upsert','delete','insert']
        .forEach(k => a[k] = () => a);
      a.then = (res) => { window.__q.push(tbl);
        const D = { profiles: [{ id: 'u1', name: '홍길동', role: 'member', active: true, workspace: null }],
                    clients: [{ id: 'c1', consent_status: 'none' }], backups: [] };
        return Promise.resolve({ data: D[tbl] || [], error: null }).then(res); };
      return a; };
    window.__q = [];
    window.osClient = () => ({ from: mk, rpc: () => Promise.resolve({ data: null, error: null }) });
    OS.session = { user: { id: 'u1' } };
    OS.profile = { id: 'u1', name: '홍길동', role: 'owner', active: true, plan: 'vip' };
    /* <b>busy 도 내려놓는다.</b> CI 에는 네트워크가 있어 앞 절의 go('home')
       이 띄운 <b>진짜</b> 요청이 아직 날고 있을 수 있다. 그러면 RD.busy 가
       true 라 여기서 부른 것이 통째로 막혀, 「안 불렀다」 로 읽힌다 —
       실제로 CI 에서만 「0번」 빨간불이 났다 (8번). */
    SETUP.hide = false; RD.rows = null; RD.ms = 0; RD.busy = false;
    const bk = () => window.__q.filter(t => t === 'backups').length;   /* rdLoad 만 읽는 표 */

    /* ① <b>홈</b> — 이제 여기서는 출발 점검을 <b>한 번도</b> 안 읽는다 (7번) */
    go('home');
    await new Promise(r => setTimeout(r, 1400));
    const el = (id) => document.getElementById(id);
    const stp = el('osSetupHome');
    const O = {
      homeRead: bk(),
      homeRdy: !!document.querySelector('.hm-rdy'),
      /* 준비 SQL 자리는 홈에 <b>하나</b>다 (5번) */
      homeSql: document.querySelectorAll('.stp').length,
      homeSqlAct: !!(stp && /setupGo\(\)/.test(stp.innerHTML))
    };
    /* 홈을 다섯 번 더 열어도 그대로 0 이어야 한다 (7번) */
    /* <b>사이를 띄워</b> 연다. 붙여서 돌리면 RD.busy 가 막아 주어, 막이가
       없어도 한 번밖에 안 나온다 — 실제보다 작게 재는 것이다 (8번).     */
    let i; for (i = 0; i < 5; i++) {
      go('clients'); await new Promise(r => setTimeout(r, 120));
      go('home');    await new Promise(r => setTimeout(r, 220));
    }
    O.homeAgain = bk();

    /* ② <b>출발 점검</b> — 옮겨 간 자리. 여기서 읽고, 여기에 다 선다.
       <b>우리가 센 것이 들어올 때까지</b> 기다린다. RD.rows 를 기다리면
       날고 있던 진짜 요청이 먼저 채워 넣어 일찍 빠져나온다. */
    go('ready');
    for (let t = 0; t < 200 && bk() < 1; t++) await new Promise(r => setTimeout(r, 50));
    await new Promise(r => setTimeout(r, 300));
    const pane = el('rdPane');
    O.readRead = bk();
    O.shown = !!pane;
    O.rows = pane ? pane.querySelectorAll('.rd-r').length : 0;
    O.acts = pane ? pane.querySelectorAll('.rd-go').length : 0;
    O.sql  = !!(pane && /서버 준비 SQL/.test(pane.textContent));

    /* ③ 배너를 「나중에」 로 닫아도 — <b>홈 맨 위에 한 줄</b>이 남아야 한다.
       어디에도 안 뜨면 돌릴 길이 사라진다. */
    setupLater();
    go('home'); await new Promise(r => setTimeout(r, 500));
    const c2 = el('osSetupHome');
    O.afterLater = !!(c2 && /서버 준비 SQL/.test(c2.textContent));
    O.laterAct = !!(c2 && /setupGo\(\)/.test(c2.innerHTML));
    O.laterH = c2 ? Math.round(c2.getBoundingClientRect().height) : 0;
    SETUP.hide = false;

    /* ④ 팀원에게는 안 뜬다 — 못 고칠 일을 매일 아침 보여 드리지 않는다 */
    OS.profile.role = 'member'; go('home'); await new Promise(r => setTimeout(r, 300));
    const c3 = el('osSetupHome');
    O.member = !!(c3 && c3.textContent.trim()) || !!document.querySelector('.hm-rdy');
    OS.profile.role = 'owner';
    return O;
  });
  is(rd.homeRead === 0,
     '  홈을 열 때 출발 점검을 <b>한 번도 안 읽는다</b> — ' + rd.homeRead +
     '번 (칸이 「출발 점검」 으로 갔는데도 읽으면 그대로 요금이다 · 7번)');
  is(rd.homeAgain === 0, '  다섯 번 더 열어도 <b>그대로 0</b> — ' + rd.homeAgain + '번 (7번)');
  is(!rd.homeRdy, '  옛 칸(.hm-rdy)이 <b>홈에 안 남았다</b> — 남으면 두 벌이다 (5번)');
  is(rd.homeSql === 1, '  준비 SQL 자리는 홈에 <b>하나</b>다 — ' + rd.homeSql + '곳 (5번)');
  is(rd.homeSqlAct, '  그 자리에서 <b>바로</b> 복사하고 열 수 있다 — 「어디로 가세요」 로 끝나지 않는다');
  is(rd.shown, '  막혀 있는 것이 <b>출발 점검에 뜬다</b>');
  /* 칸이 아예 없으면 아래 둘은 <b>0 이라서</b> 그냥 통과한다 — 그러면 무엇도
     안 잡는 알람이다. 실제로 CI 에서 카드가 안 섰는데 이 둘만 초록이었다.
     <b>칸이 섰다는 것</b>을 같이 걸어 둔다 (8번).                        */
  is(rd.shown && rd.rows >= 1,
     '  남은 것이 <b>빠짐없이</b> 선다 — ' + rd.rows + '줄 (홈처럼 셋에서 자르지 않는다)');
  is(rd.shown && rd.acts >= 1,
     '  줄마다 <b>누를 것</b>이 있다 — ' + rd.acts + '개 (「어디로 가세요」 로 끝나지 않는다)');
  is(rd.sql, '  준비 SQL 도 <b>그 목록에</b> 있다 — 홈 배너를 닫아 두셔도 여기서 보인다');
  is(rd.readRead >= 1, '  출발 점검을 열면 <b>그때 읽는다</b> — ' + rd.readRead + '번');
  is(rd.afterLater,
     '  배너를 <b>「나중에」 로 닫아도 홈 맨 위에 그 자리가 남는다</b> — 어디에도 안 뜨면 돌릴 길이 사라진다');
  is(rd.laterAct, '  그때 <b>복사하고 Supabase 열기</b> 가 그 줄에 그대로 있다');
  is(rd.laterH > 0 && rd.laterH <= 60,
     '  넓은 화면에서는 <b>한 줄</b>이다 — ' + rd.laterH + 'px');
  /* ── ★ <b>폰에서도 재 본다</b> ─────────────────────────────────────
     여기까지는 <b>넓은 화면</b>(1280px)에서만 쟀습니다. 그래서 「한 줄
     48px」 이라고 적었는데, 폰에서 열어 보니 <b>두 줄 91px</b> 이었습니다 —
     한 줄에 드는 너비가 500px 가 넘는데 폰은 320~430px 입니다. 없는 것을
     적은 것입니다 (1번). 사장님은 <b>폰에서</b> 보십니다.

     ★ <b>px 를 박아 두지 않습니다.</b> 「펼친 배너보다 훨씬 작은가」 를
       묻습니다 — 그것이 「닫았다」 의 뜻입니다. 박아 두면 글자 크기를
       바꿀 때마다 이 줄이 낡습니다.
     ★ <b>단추가 갈라지지 않는가</b>도 봅니다. 둘을 따로 두었더니 폰에서
       서로 다른 줄로 갈라져 세 줄(115px)이 됐습니다.                  */
  const ph = await b.newContext({ viewport: { width: 390, height: 844 } });
  const pp = await ph.newPage();
  await pp.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await pp.waitForTimeout(2200);
  const PH = await pp.evaluate(async () => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.session = { user: { id: 'u1' } };
    OS.profile = { id: 'u1', name: '홍길동', role: 'owner', active: true, plan: 'vip' };
    window.osLoadProfile = function () {}; window.osProfileApply = function () {};
    window.osShowLoginGate = function () {}; window.arLoad = function () {};
    window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
    OSC.loaded = true; OSC.list = []; CM.loaded = true; AR.loaded = true; AR.db = [];
    const real = window.osCfgGet;
    window.osCfgGet = function (k, d) { return k === 'schema_version' ? '0' : real(k, d); };
    /* ① 펼친 배너 */
    SETUP.hide = false; go('home'); await new Promise(r => setTimeout(r, 700));
    const open = document.querySelector('#osSetupHome .stp');
    const openH = open ? Math.round(open.getBoundingClientRect().height) : 0;
    /* ② 접은 줄 */
    SETUP.hide = true; go('home'); await new Promise(r => setTimeout(r, 700));
    const one = document.querySelector('#osSetupHome .stp-one');
    const grp = document.querySelector('#osSetupHome .stp-one-b');
    const btn = grp ? [].slice.call(grp.querySelectorAll('.btn')) : [];
    window.osCfgGet = real;
    return {
      openH, foldH: one ? Math.round(one.getBoundingClientRect().height) : 0,
      said: !!(one && /서버 준비 SQL/.test(one.textContent)),
      act: !!(one && /setupGo\(\)/.test(one.innerHTML)),
      /* 단추 둘이 <b>같은 줄</b>에 있나 — 갈라지면 한 줄이 더 생긴다 */
      sameRow: btn.length === 2 &&
        Math.abs(btn[0].getBoundingClientRect().top - btn[1].getBoundingClientRect().top) < 4,
      small: btn.filter(e => e.getBoundingClientRect().height < 30).length,
      wide: grp ? Math.round(grp.getBoundingClientRect().width) : 0
    };
  });
  await ph.close();
  is(PH.said && PH.act,
     '  <b>폰에서도</b> 그 줄이 서고 거기서 바로 돌릴 수 있다 — ' + PH.foldH + 'px');
  is(PH.foldH > 0 && PH.foldH <= PH.openH / 2,
     '  접으면 <b>펼친 배너의 절반 아래</b>다 — ' + PH.foldH + 'px / 펼치면 ' + PH.openH +
     'px (닫았는데 또 덩어리면 닫은 것이 아니다)');
  is(PH.sameRow,
     '  단추 둘이 <b>같은 줄</b>에 붙어 있다 — 따로 두면 폰에서 갈라져 한 줄이 더 생긴다');
  is(PH.wide > 0 && PH.wide <= 300,
     '  단추 덩어리가 <b>제일 좁은 폰(320px)에도</b> 든다 — ' + PH.wide + 'px');
  is(!rd.member, '  팀원에게는 <b>안 뜬다</b> — 못 고칠 일을 매일 아침 보여 드리지 않는다');
  /* ── <b>고치신 직후에 옛말을 하지 않는가</b> ─────────────────────────
     홈에 막이를 걸면서 <b>출발 점검까지</b> 막아 버린 적이 있습니다.
     사장님은 SQL 을 돌리거나 조직도를 고친 <b>직후에</b> 이 화면을 여시는데,
     그때 10분 막이에 걸려 「아직 안 됐습니다」 라고 옛말을 했습니다 —
     방금 하신 일을 안 했다고 말하는 것입니다 (1번). check-ready 가
     잡아 주었습니다. 여기서도 못 박아 둡니다.                          */
  const fresh = await page.evaluate(async () => {
    window.__q = [];
    const bk = () => window.__q.filter(t => t === 'backups').length;
    /* 방금 읽은 참이다 — 막이가 살아 있는 한가운데 */
    RD.ms = Date.now();
    const a0 = bk();
    osReadyAfterRender();
    for (let t = 0; t < 80 && bk() === a0; t++) await new Promise(r => setTimeout(r, 50));
    return bk() - a0;
  });
  is(fresh >= 1, '  <b>출발 점검을 열면 기다리지 않고 다시 읽는다</b> — ' + fresh +
     '번 (고치신 직후에 여시는 화면이라, 막으면 방금 하신 일을 안 했다고 말하게 된다)');
  /* <b>쌍둥이가 아닌가</b> — 홈이 제 목록·제 줄그리기를 따로 만들지 않았는가 (5번) */
  const H = SRC2.slice(SRC2.indexOf('function hmReadyRows('), SRC2.indexOf('var HM_CLI_DOOR'));
  is(/rdAuto\(\)/.test(H) && /rdRowHtml\(/.test(SRC2.slice(SRC2.indexOf('function hmReadyHtml('), SRC2.indexOf('function hmReadyCss('))),
     '  요약 칸이 <b>rdAuto · rdRowHtml 을 그대로 쓴다</b> — 제 목록을 따로 만들면 출발 점검과 갈라진다 (5번)');
  /* ── <b>「그 자리를 누가 맡나」 를 아는 곳이 하나인가</b> (5번) ────────
     setupShow(펼친 배너를 세울까) 와 setupHome(자리 자체를 쓸까) 을 하나로
     섞어 쓰다가 「나중에」 를 누르면 준비 SQL 이 <b>어디에도 안 남는</b>
     구멍이 났습니다. 세는 곳이 둘이 되면 그날이 다시 옵니다.            */
  is((SRC2.match(/function setupHome\(\)/g) || []).length === 1,
     '  <b>setupHome() 이 한 곳</b>에만 있다 — 자리를 누가 맡나는 한 곳만 안다 (5번)');
  is((SRC2.match(/function setupFoldHtml\(\)/g) || []).length === 1 &&
     /return setupFoldHtml\(\)/.test(SRC2.slice(SRC2.indexOf('function setupBarHtml('), SRC2.indexOf('function setupPaint('))),
     '  배너를 안 세울 때 <b>setupFoldHtml() 로 넘긴다</b> — 그냥 \'\' 로 비우면 「나중에」 에 통째로 사라진다');
  is(/function setupShow\(\)\{return setupHome\(\)/.test(SRC2),
     '  setupShow 가 <b>setupHome 을 얹어서</b> 답한다 — 따로 세면 둘이 어긋난다 (5번)');
  is(/setupHome\(\)/.test(H),
     '  요약 칸도 <b>같은 답</b>을 본다 — 「배너가 펼쳐졌나」 가 아니라 「그 자리가 맡고 있나」 (5번)');

  /* ── 6) <b>준비 SQL 을 나눠서 돌릴 수 있는가</b> ─────────────────────
     사장님이 RUN 에서 「연결 타임아웃으로 인해 연결이 종료됨」 을 받으셨습니다.
     준비 SQL 은 297개 문장 · 37,000자를 <b>한 번에</b> 보냅니다.

     여기서 제일 위험한 것은 <b>조각이 원본과 달라지는 것</b>입니다 (1번).
     조각을 다 돌리셨는데 한 줄이 빠져 있으면, 사장님은 다 됐다고 아시고
     그 기능만 조용히 안 됩니다. 그래서 <b>합치면 한 글자도 다르지 않은가</b>
     를 맨 먼저 잽니다. 그다음이 <b>함수 몸통을 안 가르는가</b> 입니다 —
     $fn$ 안에서 잘리면 그 조각은 통째로 안 돕니다.                     */
  console.log('\n[6] 준비 SQL 을 <b>나눠서</b> 돌릴 수 있다 (타임아웃)');
  const sp = await page.evaluate(() => {
    const full = HX_SQL['00'].lines.join('\n');
    const P = setupParts();
    const joined = P.map(x => x.join('\n')).join('\n');
    /* 조각마다 달러 따옴표가 <b>짝</b>이 맞아야 한다 — 안 맞으면 함수 몸통이 갈렸다 */
    const tagsOk = P.every(part => {
      const m = part.join('\n').match(/\$[a-zA-Z_]*\$/g) || [];
      const st = [];
      m.forEach(t => { if (st.length && st[st.length - 1] === t) st.pop(); else st.push(t); });
      return st.length === 0;
    });
    /* <b>문장 한가운데서 끊기지 않았는가.</b> 조각마다, 주석과 빈 줄을
       걷어낸 마지막 줄이 <b>;</b> 로 끝나야 한다. 안 그러면 그 조각은
       반쪽짜리 문장으로 끝나 통째로 안 돈다.                            */
    const wholeOk = P.every(part => {
      const code = part.join('\n')
        .replace(/\/\*[\s\S]*?\*\//g, '')      /* 주석을 걷어낸다 */
        .replace(/\s+$/, '');
      return code === '' || /;$/.test(code);
    });
    const sizes = P.map(x => x.join('\n').length);
    const head = setupPartSql(0).slice(0, 400);
    return {
      n: P.length, same: joined === full, tagsOk, wholeOk, sizes,
      max: Math.max.apply(null, sizes), full: full.length,
      head,
      /* 조각마다 머리말이 붙는가 — 새 세션에서 돌 수도 있다 */
      allHead: P.every((x, i) => /set search_path = public;/.test(setupPartSql(i)) &&
                                 /set lock_timeout/.test(setupPartSql(i))),
      /* 조각 어디에도 -- 주석이 없어야 한다 (9번) */
      noDash: P.every((x, i) => !/(^|\n)\s*--/.test(setupPartSql(i)))
    };
  });
  is(sp.same, '  나눈 것을 <b>합치면 원본과 한 글자도 다르지 않다</b> — ' +
     '한 줄이라도 빠지면 다 하신 줄 아시고 그 기능만 조용히 안 된다 (1번)');
  is(sp.tagsOk, '  <b>함수 몸통($fn$)을 가르지 않는다</b> — 갈리면 그 조각이 통째로 안 돈다');
  is(sp.wholeOk, '  <b>문장 한가운데서 끊기지 않는다</b> — 조각마다 온전한 문장으로 끝난다');
  is(sp.n >= 3 && sp.n <= 12, '  <b>' + sp.n + '조각</b>으로 나뉜다 — 너무 잘게 나누면 누르시다 지치신다');
  is(sp.max <= 12000, '  제일 큰 조각도 <b>' + sp.max + '자</b> — 통째(' + sp.full + '자)보다 확실히 작다');
  is(sp.allHead, '  조각마다 <b>search_path 와 lock_timeout</b> 이 붙는다 — ' +
     '조각은 새 세션에서 돌 수 있고, 잠금에 걸리면 영영 기다리면 안 된다');
  is(sp.noDash, '  조각에 <code>--</code> 주석이 없다 (9번)');
  /* 화면 — 단추가 실제로 서고, 눌러서 복사되는가 */
  const spu = await page.evaluate(async () => {
    OS.profile = { id: 'u1', name: '홍길동', role: 'owner', active: true, plan: 'vip' };
    SETUP.hide = false; SETUP.split = false; SETUP.got = {};
    const realCfg = window.osCfgGet;
    window.osCfgGet = (k, d) => k === 'schema_version' ? '0' : realCfg(k, d);
    window.__cp = ''; window.copyText = t => { window.__cp = '' + t; };
    go('home');
    const bar = () => document.querySelector('#dynPane .stp');
    /* ⚠ 뒷길 다섯(복사만·주소만·나눠서·글로 보기·나중에)은 <b>「안 될 때 ▾」</b>
       뒤에 접혀 있다 — 2026-09-21 · 배너가 425px 라 홈에서 「오늘 할 일」 이
       883px 로 밀려 첫 화면을 벗어났고 check-toss 가 잡았다. <b>지운 것이
       아니라</b> 한 번 뒤이므로, 점검도 그 길을 그대로 밟는다 (8번). */
    const more = Array.from(bar().querySelectorAll('button'))
                      .filter(b => /안 될 때/.test(b.textContent))[0];
    const hadMore = !!more; if (more) more.click();
    const btn = Array.from(bar().querySelectorAll('button'))
                     .filter(b => /나눠서/.test(b.textContent))[0];
    const had = !!btn; if (btn) btn.click();
    const chips = bar().querySelectorAll('.stp-p');
    const before = chips.length;
    if (chips[1]) chips[1].click();
    const got = window.__cp;
    const marked = bar().querySelectorAll('.stp-p.got').length;
    window.osCfgGet = realCfg; SETUP.split = false; SETUP.got = {};
    SETUP.more = false;
    return { had, hadMore, before, len: got.length, second: got === setupPartSql(1), marked,
             says: bar() ? /복사했다는 표시일 뿐/.test(bar().textContent) : false };
  });
  is(spu.hadMore, '  배너에 <b>「안 될 때 ▾」</b> 가 있다 — 뒷길로 가는 문');
  is(spu.had, '  펴면 <b>「⏱ 시간 초과가 났어요 — 나눠서」</b> 단추가 있다');
  is(spu.before === sp.n, '  누르면 조각 단추가 <b>' + spu.before + '개</b> 선다');
  is(spu.second && spu.len > 100, '  조각 단추를 누르면 <b>그 조각이 복사된다</b> — ' + spu.len + '자');
  is(spu.marked === 1, '  누른 것만 <b>「복사함」</b> 으로 표시된다 — ' + spu.marked + '개');
  is(spu.says, '  「복사함」 은 <b>복사했다는 표시일 뿐</b>이라고 적는다 — ' +
     '돌았는지는 서버에 물어야 안다 (1번)');

  /* ── <b>자르는 규칙 자체</b>를 견본으로 겨눈다 ─────────────────────────
     지금 준비 SQL 은 <b>우연히</b> 안전한 자리에서만 잘립니다. 그래서
     달러 따옴표를 안 보게 하거나 「; 로 끝났나」 를 안 보게 해도
     빨간불이 안 켜졌습니다 — <b>안 울리는 알람</b>입니다 (8번).
     규칙을 실제로 밟는 견본을 만들어 겨눕니다: 함수 몸통 안에 빈 줄이
     있고, 문장 한가운데에도 빈 줄이 있는 SQL 입니다. 준비 SQL 이
     언젠가 이런 모양이 되어도 그때 잡힙니다.                            */
  const fx = await page.evaluate(() => {
    const L = [
      'set search_path = public;', '',
      'create or replace function public.보기() returns int language plpgsql as $fn$',
      'begin', '',                       /* 함수 몸통 <b>안</b>의 빈 줄 */
      '  return 1;', '',
      'end;',
      '$fn$;', '',
      'create table if not exists public.보기표(',
      '  a int,', '',                    /* 문장 <b>한가운데</b>의 빈 줄 */
      '  b int', ');', '',
      'select 1;'
    ];
    const P = setupSplit(L, 1);          /* 예산 1 — 자를 수 있는 자리마다 자른다 */
    const tagBad = P.filter(part => {
      const m = part.join('\n').match(/\$[a-zA-Z_]*\$/g) || [];
      const st = []; m.forEach(t => { if (st.length && st[st.length-1]===t) st.pop(); else st.push(t); });
      return st.length !== 0;
    }).length;
    const halfBad = P.filter(part => {
      const code = part.join('\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+$/, '');
      return code !== '' && !/;$/.test(code);
    }).length;
    return { n: P.length, same: P.map(x => x.join('\n')).join('\n') === L.join('\n'),
             tagBad, halfBad };
  });
  is(fx.same, '  견본: 잘게 잘라도 <b>합치면 그대로</b>다 — ' + fx.n + '조각');
  is(fx.tagBad === 0, '  견본: <b>함수 몸통 안의 빈 줄에서 안 자른다</b> — 갈린 조각 ' + fx.tagBad + '개');
  is(fx.halfBad === 0, '  견본: <b>문장 한가운데 빈 줄에서 안 자른다</b> — 반쪽 조각 ' + fx.halfBad + '개');

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad?('점검 실패 — '+bad+'가지'):'점검 통과 — 다 맞습니다.');
  process.exit(bad?1:0);
})();
