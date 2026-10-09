/* ══════════════════════════════════════════════════════════════════
   check-tapc.js — <b>전화하는 자리에 그 글이 있고, 묻는 자리에 그 자가 있다.</b>

   사장님 말씀 (2026-10-09) —
     「Ta 모드에서 <b>ta 스크립트가 빠져있어</b> 넣어줘
      Pc 에서 <b>예외질환도</b> 넣어줘
      <b>오늘에 있어</b>」

   ── 재어 보니 ───────────────────────────────────────────────────────
   「오늘」 카드가 단계마다 손에 주는 것은 <b>apex-stage.js 의 BOX 한 표</b>
   에서 나옵니다. 그 표에 —
     · TA 묶음 : cs_assist · sangdam · voiceasst   → <b>TA 스크립트가 없었습니다</b>
     · PC 묶음 : frmake · bojang · compare · …     → <b>예외질환이 없었습니다</b>
   TA 스크립트는 「앱이 아는 것(know)」 에는 <b>이미</b> 있었습니다. 두 목록은
   뜻이 다릅니다 — know 는 「무엇을 가리나」, BOX 는 <b>「무엇을 쥐나」</b> —
   그래서 쌍둥이가 아니고, 쥐는 쪽에만 빠져 카드에서 안 보였습니다.

   ── 넣은 자리 ───────────────────────────────────────────────────────
   ★ TA 는 <b>맨 앞</b>입니다. 카드가 번호로 세우는 것은 앞의 <b>셋</b>이고
     (HM_PICK_TOOLS), 전화를 걸면서 보고 읽는 글이 이것입니다.
   ★ PC 는 <b>넷째</b>입니다. 앞의 셋은 사장님이 2026-09-18 에 못 박으신
     자리라 밀지 않았고, 넷째는 <b>칩 한 줄의 첫 자리</b>라 밀지 않아도
     바로 보입니다.
   ★ TA 스크립트는 <b>덮개</b>로 엽니다 — 전화 중에 홈을 떠나면 돌아올 때
     몇 번째였는지를 다시 찾습니다 (7번). 주소는 <b>한 곳</b>(TASC_URL)에만
     적고 화면과 덮개가 같은 줄을 봅니다 (5번).

   ── ⚠ 이 자를 만들며 제가 또 틀린 것 ────────────────────────────────
   처음 걸음자는 「도구 열 가지가 <b>메뉴에 없다</b>」 고 읽었습니다. 앱이
   아니라 <b>제 씨</b>가 틀렸습니다 — navItemOf 는 visibleTabs() 를 보고,
   그것은 <b>프로필이 있어야</b> 찹니다. 프로필을 안 심고 재서 메뉴가 비어
   있었습니다. 그래서 이 자는 <b>자기 눈이 떠 있는지 먼저 확인</b>합니다
   ([0]) — 단계 도구가 0개로 읽히면 그것은 앱 탓이 아니라 자 탓입니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8974;
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

/* 점검 데이터의 이름은 <b>홍길동</b> 꼴입니다 (3번) */
const SEED = `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients',
  'osCliInfoLoad','osRepListLoad','chkLoad'].forEach(function(k){window[k]=function(){};});
 window.toast=function(m){window.__T=m;};
 window.setupDone=function(){return true;};window.setupCanRun=function(){return true;};
 window.setupShow=function(){return false;};window.osTabAllowed=function(){return true;};
 window.cmLoadAll=function(cb){if(cb)cb();};
 OS.session={user:{id:'me'}};
 /* ★ <b>프로필을 반드시 심습니다</b> — navItemOf 가 visibleTabs() 를 보기
    때문입니다. 안 심으면 메뉴가 비어 「도구가 메뉴에 없다」 고 거짓말합니다. */
 OS.profile={id:'me',user_id:'me',name:'홍길동',role:'owner',user_role:'owner',team:'A',active:true,plan:'pro'};
 window.osClient=function(){var mk=function(){var a={};
   ['select','order','limit','in','is','eq','neq','not','gte','lte','update','insert','upsert','delete','single','range','or','filter']
     .forEach(function(k){a[k]=function(){return a;};});
   a.then=function(f){return Promise.resolve({data:[],error:null}).then(f);};return a;};
   return {from:function(){return mk();},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 CM.loaded=true;CM.who={me:'홍길동'};CM.pick='';CM.picked=true;
 AR.loaded=true;AR.busy='';AR.calls=[];AR.rep={};
 AR.db=[{id:'t1',who:'me',name:'홍길동A',stage:'TA',days:5,region:'서울 강남구',src:'일반'},
        {id:'p1',who:'me',name:'홍길동B',stage:'PC',days:2,region:'서울 강남구',src:'일반'}];
 AR.cliRows=[];
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 CHKS.busy=false;CHKS.err='';CHKS.rows=[];CHKS.fin={};CHKS.by={};
 try{localStorage.removeItem('apex_hm_fold_v1');}catch(e){}
 HWHO.id='';go('home');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html');
  await page.waitForTimeout(2600);
  await page.evaluate(SEED); await page.waitForTimeout(2400);

  const src = fs.readFileSync('app/index.html', 'utf8');
  const stg = fs.readFileSync('apex-stage.js', 'utf8');
  const 걷기 = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

  console.log('[0] ⚠ <b>자기 눈이 떠 있나</b> — 프로필 없이 재면 메뉴가 빕니다');
  const Z = await page.evaluate(() => ({
    ta: (typeof tdoTools === 'function') ? tdoTools('TA').map(x => x.id) : [],
    pc: (typeof tdoTools === 'function') ? tdoTools('PC').map(x => x.id) : [],
    ap: (typeof tdoTools === 'function') ? tdoTools('AP').map(x => x.id) : [] }));
  is(Z.ap.length >= 5, '  AP 도구가 ' + Z.ap.length + '개로 읽힌다 — 0 이면 앱이 아니라 <b>자가 눈을 감은</b> 것입니다');

  console.log('\n[1] ☎️ <b>TA — 전화하면서 볼 글이 맨 앞에 있다</b>');
  {
    const box = (stg.match(/\{when:'TA',[\s\S]*?items:\[([^\]]*)\]/) || ['', ''])[1];
    const ids = box.split(',').map(s => s.replace(/['\s]/g, '')).filter(Boolean);
    is(ids[0] === 'ta_script',
      '  TA 묶음 <b>첫째</b>가 TA 스크립트다 — 지금 「' + (ids[0] || '없음') + '」 (앞의 셋만 번호로 섭니다)');
    is(Z.ta[0] === 'ta_script',
      '  오늘 카드도 <b>첫째로</b> 준다 — ' + Z.ta.join(' · '));
    is(Z.ta.indexOf('voiceasst') >= 0,
      '  밀려난 음성 비서가 <b>없어지지 않았다</b> — 칩으로 그대로 섭니다 (6번)');
  }

  console.log('\n[2] ⚠️ <b>PC — 예외질환이 있고, 못 박은 앞 셋을 밀지 않았다</b>');
  {
    const box = (stg.match(/\{when:'PC',[\s\S]*?items:\[([^\]]*)\]/) || ['', ''])[1];
    const ids = box.split(',').map(s => s.replace(/['\s]/g, '')).filter(Boolean);
    is(ids.indexOf('ref_underwrite') >= 0, '  PC 묶음에 예외질환 인수확인이 <b>있다</b>');
    /* 2026-09-18 사장님이 못 박으신 자리 — check-tdo 가 따로 지키지만,
       여기서도 <b>밀지 않았는지</b> 봅니다. 앞의 셋이 번호 갈래입니다. */
    is(ids[0] === 'frmake' && ids[1] === 'bojang' && ids[2] === 'compare',
      '  사장님이 못 박으신 <b>앞의 셋</b>이 그대로다 — ' + ids.slice(0, 3).join(' · '));
    is(ids[3] === 'ref_underwrite',
      '  예외질환이 <b>넷째</b>다 — 칩 한 줄의 첫 자리라 밀지 않아도 보입니다');
    is(Z.pc.indexOf('ref_underwrite') === 3, '  오늘 카드도 같은 자리에 준다 — ' + Z.pc.slice(0, 5).join(' · '));
  }

  console.log('\n[3] 🧰 <b>오늘 카드에 정말 서나</b> — 세워서 읽습니다');
  const R = await page.evaluate(() => {
    const o = {};
    let L = []; try { L = hmSteps() || []; } catch (e) { o.X = String(e.message).slice(0, 60); }
    o.줄 = L.filter(x => x.k === 'db').map(x => x.tk);
    try { HM_MORE = true; } catch (e) {}
    const 보기 = (tk) => {
      const x = L.filter(y => y.k === 'db' && y.tk === tk)[0];
      if (!x) return { 없음: 1 };
      const h = document.createElement('div');
      h.innerHTML = hmPicksHtml(x);
      const 번호 = [...h.querySelectorAll('.hm-ask-o')].map(e => (e.innerText || '').replace(/\s+/g, ' ').trim());
      const h2 = document.createElement('div');
      h2.innerHTML = (typeof hmBoxHtml === 'function') ? hmBoxHtml(x) : '';
      const 칩 = [...h2.querySelectorAll('.hm-box-b')].map(e => (e.innerText || '').trim());
      return { 번호, 칩 };
    };
    o.TA = 보기('TA'); o.PC = 보기('PC');
    return o;
  });
  is(!R.X && R.줄.indexOf('TA') >= 0 && R.줄.indexOf('PC') >= 0,
    '  「지금 할 것」 에 TA·PC 줄이 선다 — ' + (R.줄 || []).join(' · ') + (R.X ? (' ⚠ ' + R.X) : ''));
  is(!R.TA.없음 && /TA 스크립트/.test((R.TA.번호 || [])[0] || ''),
    '  TA 줄 <b>갈래 1</b> 이 TA 스크립트다 — 「' + (((R.TA.번호 || [])[0]) || '없음').slice(0, 30) + '」');
  is(!R.PC.없음 && /예외질환/.test((R.PC.칩 || [])[0] || ''),
    '  PC 줄 <b>첫 칩</b>이 예외질환이다 — 「' + (((R.PC.칩 || [])[0]) || '없음') + '」');
  is(!R.PC.없음 && (R.PC.번호 || []).length === 4,
    '  PC 는 <b>네 갈래</b> 그대로다 — 도구 셋 + 했습니다 (' + ((R.PC.번호 || []).length) + ')');

  console.log('\n[4] 🫥 <b>눌렀을 때 — 홈을 떠나지 않는다</b> (7번)');
  const C = await page.evaluate(async () => {
    const o = {};
    let L = []; try { L = hmSteps() || []; } catch (e) {}
    const x = L.filter(y => y.k === 'db' && y.tk === 'TA')[0];
    if (!x) return { 없음: 'TA 줄이 없습니다' };
    const h = document.createElement('div'); document.body.appendChild(h);
    h.innerHTML = hmPicksHtml(x);
    const b = [...h.querySelectorAll('.hm-ask-o')].find(e => /TA 스크립트/.test(e.innerText || ''));
    if (!b) return { 없음: '그 단추가 없습니다' };
    b.click();
    await new Promise(r => setTimeout(r, 2400));
    const sh = document.querySelector('#hmSheet,.hm-sheet');
    o.덮개 = !!(sh && sh.classList.contains('on'));
    o.머리 = sh ? ((sh.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 50)) : '';
    const f = sh ? sh.querySelector('iframe') : null;
    o.주소 = f ? (f.getAttribute('src') || '') : '';
    o.탭 = (typeof currentTab === 'function') ? currentTab() : '';
    return o;
  });
  is(C.덮개 === true, '  <b>덮개로 열린다</b> — 홈은 아래 그대로 있습니다' + (C.없음 ? (' ← ' + C.없음) : ''));
  is(/ta-script\.html/.test(C.주소 || ''), '  틀이 <b>그 글</b>을 띄운다 — ' + (C.주소 || '(없음)').slice(0, 40));
  is(C.탭 === 'home', '  <b>아직 홈</b>이다 — 지금 「' + (C.탭 || '?') + '」');
  is(/몇|번째|홍길동/.test(C.머리) || /TA 스크립트/.test(C.머리),
    '  머리에 <b>누구의 몇 번째</b>인지 적힌다 — 「' + C.머리.slice(0, 40) + '」');

  console.log('\n[5] 📌 <b>한 곳에만 적는다</b> (5번)');
  {
    const n = (걷기(src).match(/\/ta-script\.html/g) || []).length;
    is(n === 1, '  「/ta-script.html」 글자가 <b>한 번</b>만 있다 (TASC_URL) — 지금 ' + n + '곳');
    is(/var TASC_URL=/.test(src), '  주소를 담는 자리가 있다 — TASC_URL');
    is(/M\.ta_script\s*=\s*TASC_URL/.test(src), '  덮개 표가 <b>그 줄</b>을 본다 — 베끼지 않습니다');
    const t = (stg.match(/ta_script\s*:\{e:'([^']*)',t:'([^']*)'\}/) || ['', '', '']);
    is(t[2] === 'TA 스크립트', '  이름표가 <b>메뉴와 같은 글자</b>다 — 「' + (t[2] || '없음') + '」 (db-crm 은 이 표를 봅니다)');
  }

  console.log('\n[6] 🧭 <b>know 에도 적었다</b> — CS 가 이미 그렇게 두 곳에 있습니다');
  {
    const pc = (stg.match(/'PC'\s*:\{[\s\S]*?know:\[([\s\S]*?)\]\},/) || ['', ''])[1];
    is(/ref_underwrite/.test(pc), '  PC know 에 예외질환이 있다');
    const 줄 = (pc.match(/\{tab:'ref_underwrite'[^}]*\}/) || [''])[0];
    is(/g:'[^']+'/.test(줄) && /w:'[^']+'/.test(줄),
      '  <b>구분과 「쓸 때」 한 줄</b>이 같이 있다 — ' + (줄.match(/w:'([^']*)'/) || ['', ''])[1].slice(0, 28));
    const ta = (stg.match(/'TA'\s*:\{[\s\S]*?know:\[([\s\S]*?)\]\},/) || ['', ''])[1];
    is(/ta_script/.test(ta), '  TA know 에도 그대로 있다 — 거기에는 <b>원래부터</b> 있었습니다');
  }

  console.log('');
  is(errs.length === 0, '재는 동안 <b>조용히 터진 곳이 없다</b>' + (errs.length ? (' — ' + errs[0]) : ''));

  await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '곳이 어긋났습니다.')
                  : '\n✓ 전화하는 자리에 그 글이 맨 앞에 있고, 묻는 자리에 예외질환이 섭니다.');
  process.exit(bad ? 1 : 0);
})();
