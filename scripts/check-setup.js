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
  /* 번호를 여기 박아 두면 올릴 때마다 이 파일도 같이 고쳐야 한다.
     정작 중요한 것은 「앱이 기다리는 번호」와 「SQL 이 남기는 번호」가
     서로 같은가다. 어긋나면 대표님이 SQL 을 돌려도 배너가 안 사라진다. */
  const stamped=(sql.match(/'schema_version',\s*'(\d+)'/)||[])[1];
  is(stamped!==undefined,'SQL 이 끝나면 서버에 판 번호를 남긴다 — '+stamped);
  is(+stamped===r.ver,'그 번호가 앱이 기다리는 번호와 같다 — SQL '+stamped+' · 앱 '+r.ver);
  console.log('\n[3] 서버 열쇠 — 들어가면 바로 보이고, 순서대로 알려 주는가');
  const kb = await page.evaluate(() => {
    OS.profile = OS.profile || {}; OS.profile.role = 'owner';
    try { localStorage.removeItem('apex_nf_keys'); } catch (e) {}
    const g = document.getElementById('osLoginGate'); if (g) g.style.display = 'none';
    go('home'); nfKeyPaint();
    const el = document.getElementById('osNfKeyHome');
    return { has: !!el, n: el ? el.querySelectorAll('button').length : 0,
             t: el ? el.textContent.replace(/\s+/g, ' ') : '' };
  });
  is(kb.has && kb.n === 2, '홈에 열쇠 배너가 단추 두 개와 함께 뜬다');
  is(/서버 열쇠가 아직 없습니다/.test(kb.t), '무엇이 없는지 한 줄로 말한다');
  is(/새벽 5시/.test(kb.t), '안 넣으면 무엇이 멈추는지 적혀 있다');

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
  is(gd && gd.keys.join(',') === 'ANTHROPIC_API_KEY,SUPABASE_SERVICE_ROLE_KEY',
     '열쇠 이름 두 개를 복사할 수 있게 세워 뒀다');
  [['configuration/env', 'Netlify 환경변수'], ['console.anthropic.com', '앤트로픽 콘솔'],
   ['settings/api', 'Supabase API'], ['/deploys', '배포 화면']].forEach(([u, n]) =>
    is(!!gd && gd.links.some(x => x.indexOf(u) >= 0), '  ' + n + ' 로 바로 간다'));
  is(gd && /최고 권한/.test(gd.t), 'service_role 경고가 있다 — 대화창에 붙이지 말라고');
  is(gd && /Clear cache and deploy/.test(gd.t), '재배포해야 열쇠가 들어간다는 것을 적었다');

  const fold = await page.evaluate(() => {
    nfGuideClose(); nfKeyMark(true);
    const a = document.getElementById('osNfKeyHome').innerHTML === '';
    nfKeyMark(false);
    const b2 = document.getElementById('osNfKeyHome').innerHTML !== '';
    OS.profile.role = 'member'; nfKeyPaint();
    const c = document.getElementById('osNfKeyHome').innerHTML === '';
    return { a, b2, c };
  });
  is(fold.a, '한 번 되면 배너가 접힌다');
  is(fold.b2, '안 되면 다시 뜬다');
  is(fold.c, '팀원에게는 안 보인다 — 대표만 넣을 수 있는 일이다');

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad?('점검 실패 — '+bad+'가지'):'점검 통과 — 다 맞습니다.');
  process.exit(bad?1:0);
})();
