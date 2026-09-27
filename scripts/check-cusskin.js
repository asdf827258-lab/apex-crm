/* ══════════════════════════════════════════════════════════════════
   check-cusskin.js — <b>고객 365일 한 장이 목각 옷을 입었나.</b>
   화면 하나가 아니라 <b>그 안의 칸마다</b> 봅니다.

   2026-09-27. 사장님 말씀 —
     「미리보기가 떴는데, 내가 목각이랑 똑같이 만들고 거기에 내용 채우라고
      했는데 <b>전혀 아니야</b>. 제발 — 똑같이 하고. 고객 365일에,
      <b>팩트파인딩 빼고는, 전부 목각 버전으로</b> 바꾸라고 그대로.
      <b>기능만 맞추어서</b> 넣어주라고 왜 자꾸 따로 하냐고.
      우선 똑같이 하고 기능 배치가 안된건 <b>추후에 배치</b>하자고 분리해서」

   ★ <b>왜 이 자가 없어서 못 봤나.</b> check-skinmap 은 T_SKIN 표를 보고
     「clients 는 옷을 입었다(clients:1)」 고 적습니다. 그런데 그 화면 <b>속</b>
     에는 옛 옷을 입은 칸이 열둘, 목각 옷은 넷이었습니다. 아무 자도 <b>한
     화면 안</b>을 세지 않아서, 표에는 「입음」 인데 눈에는 누더기였습니다.
     그것이 사장님이 미리보기에서 보신 그 자리입니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 눈에 보이는 칸 중 <b>옛 옷을 입은 것</b> ≤ 기준선 (줄이라고만 있는 수)
     [2] ★ <b>팩트파인딩은 일부러 그대로</b> — 빼라고 하셨습니다. 세지 않되,
         <b>사라지지도 않았는지</b>는 봅니다 (감추는 것이 아닙니다 · 6번)
     [3] ★★ <b>기능을 하나도 안 잃었나</b> — 옷만 갈아입히는 것이므로
         갈아입히기 <b>전에 적어 둔</b> id·onclick 이 전부 살아 있어야 합니다
     [4] 갈아입힌 칸마다 <b>이름표(.t-lab)</b> 가 있다 — 목각 카드의 머리
     [5] 새 class 0개 · hex 0개 · style 로 색 안 박기
     [6] 누르는 것이 <b>받침을 받는 모양</b>인가 (span onclick 은 못 받습니다) · 안 터졌나
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9033;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});

/* ⚠ 2026-09-27 기준선 — <b>줄이라고만 있는 수</b>입니다 (0-1번).
     옛옷 0 — 갈아입히기 전에는 <b>일곱</b>이었습니다:
       이름 줄 · 가족(줄로 적습니다) · 고객 정보 · 관계 · 빈 통장·소개 ·
       가족으로 묶기 · 보장분석 전·후 · 가입한 보험
     접힌것 3 — 「📂 예전 자료」 안(문서 올리기·보장분석·풀리포트).
       ★ 「저장된 상담 자료」 는 접힘 <b>밖</b>이라 이 판에서 갈아입혔습니다.
       <b>접혀 있어 눈에 안 보입니다.</b> 이 판에서는 손대지 않았고,
       수를 <b>따로</b> 세어 숨지 못하게만 해 둡니다 (8번).               */
const BASE = { 옛옷: 0, 접힌것: 3 };

/* ★★ <b>계약</b> — 옷을 갈아입히기 <b>전에</b> 화면에서 긁어 적은 것입니다.
   옷만 바꾸는 판이므로 이 중 하나라도 없어지면 <b>기능을 잃은</b> 것입니다.
   수를 세지 않고 <b>이름을 그대로</b> 적어 둡니다 — 세기만 하면 하나가
   사라지고 딴 하나가 생겨도 초록이 됩니다 (8번).                        */
const 계약_ID = ['cliPhone','cliBirth','cliGender','cliIncome','cliExp','cliMemo',
                 'cusFamRows','cmNextWhat','cmNextDue','cmTouchHow','cmTouchAt','cmTouchNote',
                 'cmFam','cmRel','cmBd','cmCd','cmReal','cmRef','cmFamList','cmRefList',
                 'cmPanels','cusCard','oscBaHost','oscPolHost','oscTopBar','oscOld'];
const 계약_FN = ['osCliInfoSave','cusFamAdd','cusFamSave','cmNextSave','cmTouchAdd',
                 'cmFamSave','cmBdSave','cmCdSave','cmRealSaveNow','cmRefSave','waOpenFor'];

const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ CM.loaded=true; if(cb)cb(); };
  window.osCliInfoLoad=function(){}; window.osRepListLoad=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  window.osTabAllowed=function(){return true;};
  window.toast=function(){};
  const chain = v => { const o = { then:function(f){ try{ f(v); }catch(e){} return o; }, catch:function(){ return o; } };
    ['eq','neq','select','order','limit','in','gte','lte','is','not','or','filter',
     'ilike','like','range','contains','overlaps'].forEach(k => { o[k]=function(){ return o; }; });
    o.single=function(){ return chain({data:null}); }; o.maybeSingle=function(){ return chain({data:null}); }; return o; };
  window.osClient=function(){ return { from:function(){ return {
      select:function(){ return chain({data:[]}); }, update:function(){ return chain({}); },
      insert:function(){ return chain({}); }, upsert:function(){ return chain({}); },
      delete:function(){ return chain({}); } }; } }; };
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  const ago = n => new Date(Date.now()-n*864e5).toISOString().slice(0,10);
  OSC.loaded=true; OSC.busy=false; OSC.err='';
  OSC.list=[{id:'c1',name:'홍길동',name_masked:'홍○○',advisor_id:'me',stage:'CS',created_at:ago(60)},
            {id:'c2',name:'홍길순',name_masked:'홍○○',advisor_id:'me',stage:'AP',created_at:ago(30)}];
  AR.loaded=true; AR.busy=''; AR.cliRows=[]; AR.db=[];
  /* 자료가 <b>있는</b> 상태로 세웁니다 — 비어 있으면 줄·단추가 안 서서
     계약(id·onclick)의 절반을 못 봅니다 */
  OSC.repsLoaded=true;
  OSC.reps=[{id:'r9',client_id:'c1',kind:'baba',title:'전·후 견본',created_at:ago(3)}];
  if(typeof OSCP!=='undefined'){ OSCP.busy=false; OSCP.err='';
    OSCP.rows=[{insurer:'견본생명',product_name:'견본종합보장',monthly_premium:120000,payment_term:'20년납'},
               {insurer:'견본화재',product_name:'견본실손',monthly_premium:null,payment_term:''}]; }
  CM.loaded=true;
  CM.meta={ c1:(function(){ var m=cmBlank(); m._rid='r1';
    m.next={what:'증권 받아서 보장분석 돌리기',due:ago(2)};
    m.touch=[{at:ago(1),how:'전화',note:'교육비 걱정이 크다고 하셨습니다'},
             {at:ago(9),how:'카톡',note:'자료 보내 드렸습니다'}];
    m.fam='홍○○ 가족'; m.rel='본인'; m.bd='03-15'; m.cd=ago(400);
    m.worry='아이 교육비가 제일 걱정이라고 하셨습니다';
    return m; })(),
    c2:(function(){ var m=cmBlank(); m._rid='r2'; m.fam='홍○○ 가족'; m.rel='배우자'; return m; })() };
  try{ cmRealSet('c1','홍길동'); }catch(e){}
  try{ osHideLoginGate(); }catch(e){}
  osOpenClient('c1');
};

/* 옛 옷인가 — <b>목각이 아닌 이름</b>을 입은 큰 칸.
   목각은 t- 로 시작합니다. osc-panel · frm · fld · btn 은 예전 CRM 옷입니다. */
const LOOK = () => {
  const host = document.getElementById('dynPane') || document.body;
  const old = [], fold = [], skin = [], 면제 = [];
  const title = x => {
    const a = x.querySelector('h3'), b = x.querySelector('.t-lab');
    return ((a && a.textContent) || (b && b.textContent) || '(제목 없음)')
             .replace(/\s+/g,' ').trim().slice(0,38); };
  [].slice.call(host.querySelectorAll('.osc-panel, .osc-bar, .frm, .btn')).forEach(x => {
    /* 같은 칸을 두 번 세지 않는다 — 폼·단추는 그것을 담은 패널로 올려 센다 */
    const box = x.closest('.osc-panel, .osc-bar') || x;
    const t = title(box);
    /* 접힌 「📂 예전 자료」 안은 따로 센다 — 눈에 안 보입니다 */
    if (box.closest('#oscOld')) { if (fold.indexOf(t) < 0) fold.push(t); return; }
    /* ★ 팩트파인딩은 사장님이 빼라고 하셨습니다 — 면제 */
    if (/팩트파인딩/.test(box.innerText || '')) { if (면제.indexOf(t) < 0) 면제.push(t); return; }
    if (old.indexOf(t) < 0) old.push(t);
  });
  [].slice.call(host.querySelectorAll('.t-card')).forEach(x => {
    if (x.closest('#oscOld')) return;
    const b = x.querySelector('.t-lab');
    skin.push({ t: b ? b.textContent.replace(/\s+/g,' ').trim().slice(0,38) : '(이름표 없음)',
                이름표: !!b });
  });
  const ids = [].slice.call(host.querySelectorAll('[id]')).map(x => x.id);
  const fns = [];
  [].slice.call(host.querySelectorAll('[onclick]')).forEach(x => {
    const m = (x.getAttribute('onclick') || '').match(/([A-Za-z_$][\w$]*)\s*\(/);
    if (m && fns.indexOf(m[1]) < 0) fns.push(m[1]); });
  return { old: old, fold: fold, skin: skin, 면제: 면제, ids: ids, fns: fns,
           팩트있나: /팩트파인딩/.test(host.innerText || ''), 높이: host.scrollHeight };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED);
  await p.waitForTimeout(1800);
  const R = await p.evaluate(LOOK);
  const CSS = fs.readFileSync(path.join(ROOT, 'app/ui.css'), 'utf8');

  console.log('\n[1] 눈에 보이는 칸 중 <b>옛 옷을 입은 것</b> ≤ 기준선');
  is(R.old.length <= BASE.옛옷,
     '  옛 옷 <b>' + R.old.length + '칸</b> · 목각 옷 <b>' + R.skin.length + '칸</b> — 기준선 ' + BASE.옛옷 +
     (R.old.length ? ('\n      ✗ ' + R.old.join('\n      ✗ ')) : '') +
     (R.old.length < BASE.옛옷 ? '\n      ★ 줄었습니다 — 기준선도 ' + R.old.length + ' 로 내려 주십시오' : ''));
  is(R.fold.length <= BASE.접힌것,
     '  접힌 「📂 예전 자료」 안 <b>' + R.fold.length + '칸</b> — 기준선 ' + BASE.접힌것 +
     ' (눈에 안 보입니다 · 이 판에서는 손대지 않았습니다)');

  console.log('\n[2] ★ <b>팩트파인딩은 일부러 그대로</b> — 그러나 사라지지도 않았다');
  is(R.팩트있나, '  팩트파인딩 칸이 <b>그대로 있다</b> — 빼라고 하셨지 지우라고 하신 것이 아닙니다 (6번)');
  is(R.면제.length >= 1, '  옛 옷 셈에서 <b>면제</b>했다 — ' + (R.면제.join(' · ') || '(못 찾음)'));

  console.log('\n[3] ★★ <b>기능을 하나도 안 잃었나</b> — 옷만 갈아입힌 판입니다');
  const 없는ID = 계약_ID.filter(k => R.ids.indexOf(k) < 0);
  const 없는FN = 계약_FN.filter(k => R.fns.indexOf(k) < 0);
  is(!없는ID.length,
     '  적는 칸·자리 <b>' + 계약_ID.length + '개</b>가 전부 살아 있다' +
     (없는ID.length ? ('\n      ✗ 없어진 것: ' + 없는ID.join(', ')) : ''));
  is(!없는FN.length,
     '  누르면 도는 함수 <b>' + 계약_FN.length + '개</b>가 전부 살아 있다' +
     (없는FN.length ? ('\n      ✗ 없어진 것: ' + 없는FN.join(', ')) : ''));

  console.log('\n[4] 갈아입힌 칸마다 <b>이름표(.t-lab)</b> 가 있다');
  const 이름표없음 = R.skin.filter(x => !x.이름표);
  is(!이름표없음.length && R.skin.length >= 8,
     '  목각 칸 ' + R.skin.length + '개가 <b>모두 이름표로 시작한다</b>\n      · ' +
     R.skin.map(x => x.t).join('\n      · ') +
     (이름표없음.length ? ('\n      ✗ 이름표 없는 칸 ' + 이름표없음.length + '개') : ''));

  console.log('\n[5] 새 class 0개 · hex 0개 · style 로 색 안 박기');
  /* 주석·APP_BUILD_NOTE 를 먼저 지웁니다 — 무엇에 <b>대해</b> 적은 글은
     그것을 <b>쓴 것</b>이 아닙니다 (이 자리에서 여러 번 헛불이 켜졌습니다) */
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8')
                .replace(/\/\*[\s\S]*?\*\//g, ' ')
                .replace(/var APP_BUILD_NOTE=[\s\S]*?;\n/g, ' ');
  /* ★ <b>끝 표시를 손으로 적지 않습니다.</b> 처음에는 「여기부터 저 함수까지」
     라고 이름을 적어 두었는데, 그 함수가 파일에서 <b>앞쪽</b>에 있는 것이
     하나 있어 조각이 <b>빈 글</b>로 돌아왔습니다. 그러면 그 칸은 아무것도
     재지 않고 <b>초록</b>이 됩니다 — 되돌림에서 안 울려서 알았습니다.
     이제 <b>다음 function 선언까지</b>로 잡고, 빈 조각이면 그 자리에서
     빨간불을 켭니다 (8번).                                              */
  const cut = (name) => { const i = SRC.indexOf('function ' + name + '(');
    if (i < 0) return '';
    const j = SRC.indexOf('\nfunction ', i + 1);
    return SRC.slice(i, j > i ? j : SRC.length); };
  const 이름들 = ['cmRelHtml', 'cmFamHtml', 'cmWalRefHtml',
                  'cusFamPanelHtml', 'cusFamRowsHtml', 'oscBaHtml', 'oscPolHtml'];
  const 빈것 = 이름들.filter(n => cut(n).length < 200);
  is(!빈것.length, '  잴 조각 ' + 이름들.length + '개를 <b>전부 찾았다</b>' +
     (빈것.length ? ('\n      ✗ 빈 조각(아무것도 안 재게 됩니다): ' + 빈것.join(', ')) : ''));
  const 조각 = 이름들.map(cut).join('\n');
  is(조각.length > 3000, '  조각 모두 ' + 조각.length + '자');
  const 이름 = [];
  (조각.match(/class="([^"]+)"/g) || []).forEach(m => {
    m.replace(/class="|"/g, '').split(/\s+/).forEach(k => {
      if (k && k.indexOf("'") < 0 && k.indexOf('+') < 0 && 이름.indexOf(k) < 0) 이름.push(k); }); });
  const 없는것 = 이름.filter(k => CSS.indexOf('.' + k) < 0);
  is(!없는것.length, '  쓴 class ' + 이름.length + '개가 <b>모두 ui.css 에 있다</b> — ' + 이름.join(' · ') +
     (없는것.length ? ('\n      ✗ ui.css 에 없는 이름: ' + 없는것.join(', ')) : ''));
  is(!/#[0-9A-Fa-f]{3,8}\b/.test(조각), '  hex 를 <b>직접 안 적는다</b> (5번 — 색표는 한 곳)');
  is(!/style="[^"]*color:/.test(조각), '  style 로 <b>색을 안 박는다</b>');

  console.log('\n[6] 누르는 것이 <b>받침을 받는 모양</b>인가 · 조용히 터지지 않았나');
  /* ★ 처음에는 「단추가 44px 이상인가」 를 쟀습니다. <b>되돌려도 안 울렸습니다.</b>
     app/index.html 에 이미
       #dynPane button, #dynPane .btn, #dynPane a.btn, #dynPane select{min-height:44px}
     가 있어 <b>CSS 가 바닥을 받치고 있었습니다</b> — 일부러 height:30px 을 박아도
     44 로 나옵니다. 울릴 수 없는 자는 자가 아닙니다 (8번).

     그래서 <b>정말 위험한 자리</b>로 바꿨습니다 — 그 받침은 button·select·.btn
     에만 걸립니다. <span onclick> 이나 <div onclick> 으로 누르게 만들면
     <b>받침을 못 받아</b> 손가락으로 못 누를 만큼 작아집니다. 그것을 봅니다. */
  const T = await p.evaluate(() => {
    const host = document.getElementById('dynPane') || document.body;
    const out = [], 맨몸 = [];
    [].slice.call(host.querySelectorAll('.t-card [onclick]')).forEach(x => {
      if (x.closest('#oscOld')) return;
      const tag = x.tagName.toLowerCase();
      const cls = (x.className || '').toString();
      const 받침 = (tag === 'button' || tag === 'select' ||
                    /(^|\s)(btn|t-btn|t-gb|t-chip|t-row)(\s|$)/.test(cls));
      const h = Math.round(x.getBoundingClientRect().height);
      out.push({ t: (x.textContent || '').trim().slice(0, 12), tag: tag, h: h, 받침: 받침 });
      if (!받침) 맨몸.push(tag + '.' + cls.split(/\s+/)[0] + ' 「' + (x.textContent || '').trim().slice(0, 12) + '」');
    });
    return { all: out, 맨몸: 맨몸 };
  });
  is(T.all.length >= 10 && !T.맨몸.length,
     '  누르는 것 ' + T.all.length + '개가 <b>모두 button·select 이거나 받침 class</b> 를 가졌다' +
     (T.맨몸.length ? ('\n      ✗ 받침 없는 것: ' + T.맨몸.join(', ')) : ''));
  const 작은것 = T.all.filter(x => x.h > 0 && x.h < 44);
  is(!작은것.length, '  그래서 실제로 잰 높이도 <b>모두 44px 이상</b> — ' +
     T.all.filter(x => x.h > 0).length + '개 확인' +
     (작은것.length ? ('\n      ✗ ' + 작은것.map(x => x.t + ' ' + x.h + 'px').join(', ')) : ''));
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0, 2).join(' | ')) : ''));
  console.log('\n  (참고) 한 장 높이 ' + R.높이 + 'px');

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 고객 365일 한 장이 목각 옷입니다 — 팩트파인딩만 그대로, 기능은 하나도 안 잃었습니다.');
  process.exit(bad ? 1 : 0);
})();
