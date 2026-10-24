/* ══════════════════════════════════════════════════════════════════
   check-nlpick.js (판 X187) — 🗂️ 뉴스를 <b>보험 · 경제 · 저축 · 정책</b>
   넷에서 골라 보고, <b>연령대별 추천 이유</b>가 서나.

   사장님 말씀 (2026-10-24) —
     「오늘 할일이 맨 위에 있어서, 지금할것을 맨위로 올려주고, <b>뉴스도
      많은 것들 중에서 선택할수 있도록 보험 / 경제뉴스/ 저축 /정책 중에서
      골라서 할 수 있도록 만들어 연령대에 맞게 추천이유까지.</b> 그래야
      오늘 할 것들을 순차적으로 할 수 있어.」

   ── 이 자가 걱정하는 것 ────────────────────────────────────────────
   ⓐ <b>묶음표가 두 벌이 되는 것.</b> 「정책」 이 무엇을 담는지는
      apex-newsfit.js 한 곳만 알아야 합니다. 화면에 또 적으면 갈래를 늘릴 때
      한쪽만 고쳐지고, 그 갈래 기사가 조용히 사라집니다 (5번) — FP_MAP ·
      TOFIN_MAP 이 두 벌 되던 그 자리입니다.
   ⓑ <b>칸에 적힌 수가 거짓말하는 것.</b> 「보험 12」 를 눌렀는데 3건이
      나오면 사장님은 그 수를 다시 안 보십니다. 세는 곳이 둘이면 반드시
      갈립니다 (1·5번).
   ⓒ ★★ <b>연령대를 짐작하는 것.</b> 2026-09-22 에 실제 자료로 재어 보고
      지운 자리입니다 — 나이를 근거로 쓰니 <b>읽힌 33분 중 19분이 나이만
      보고</b> 고른 것이었습니다. 「60대시니 연금이 궁금하실 것」 은
      그럴듯할 뿐 적혀 있는 사실이 아닙니다 (1번).
      ★ 그래서 이 자는 추천 이유에 적힌 낱말이 <b>그 기사에 정말 있는
        글자인지</b> 한 글자씩 대조합니다. 하나라도 없으면 빨간불입니다.
      ★ 그리고 <b>BAND 는 그대로 있어야</b> 합니다 — 섞어서 「나이로 고르는
        자」 로 되살리면 그 버그가 돌아옵니다.
   ⓓ <b>한도·나이·개월 수를 적는 것</b> (2번). 시행령에 있고 개정되면
      바뀌는 값이라, 외운 숫자를 말하는 것이 이 자리에서 가장 위험합니다.
   ⓔ <b>낱말이 없는데 있는 척하는 것.</b> 「어느 연령대에나 좋습니다」 는
      아무 말도 안 하면서 뭔가 말한 척합니다 — 없으면 <b>없다고</b> 적습니다.
   ⓕ <b>길이 끊기는 것</b> (6번). 앞줄에 넷을 세우면서 부동산·세금 칸을
      지우면, 여태 그 칸을 보시던 길이 끊깁니다.
   ⓖ <b>홈에서 고른 것이 안 남는 것.</b> 「순차적으로」 하시려면 홈에서
      고르신 것이 뉴스 화면에도 그대로 있어야 합니다.
   ⓗ <b>서버를 더 부르는 것</b> (7번). 고르는 것은 이미 받아 둔 것에서
      거르는 일입니다 — 칸을 누를 때마다 서버를 부르면 안 됩니다.
   ⚠ 홈 높이는 <b>안 잽니다</b> — check-homeone 하나가 봅니다 (5번).
   ⚠ 글씨·대비·44px 도 <b>안 셉니다</b> — check-read 가 봅니다 (5번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8927;
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
const head = (t) => console.log('\n' + t);

/* ── 견본 기사 열한 건 ───────────────────────────────────────────────
   ★ <b>진짜 기사처럼 생긴 제목</b>을 씁니다. 다만 이것은 견본이므로
     언론사·주소는 가짜이고, 화면에 나가지 않습니다. 사람 이름은 한 자도
     안 씁니다 (3번).
   ★ 갈래마다 한 건 이상 · 연령대마다 한 건 이상 · <b>어디에도 안 걸리는
     것</b>도 한 건 둡니다 — 「없으면 없다고 적나」 를 재려면 필요합니다. */
const 견본 = [
  { t:'실손보험 비급여 개편안 발표',                    s:'견본신문', u:'https://example.invalid/1' },
  { t:'기준금리 동결… 코스피 소폭 상승',                s:'견본신문', u:'https://example.invalid/2' },
  { t:'정기예금 금리 다시 들썩… 파킹통장으로 목돈 옮긴다', s:'견본신문', u:'https://example.invalid/3' },
  { t:'소상공인 정책자금 신청 창구 열려',               s:'견본신문', u:'https://example.invalid/4' },
  { t:'출산 지원 확대… 첫만남이용권 대상 늘린다',        s:'견본신문', u:'https://example.invalid/5' },
  { t:'기초연금 수급 범위 조정 논의',                   s:'견본신문', u:'https://example.invalid/6' },
  { t:'대학등록금 동결 기조 유지',                      s:'견본신문', u:'https://example.invalid/7' },
  { t:'종부세 완화안 국회 제출',                        s:'견본신문', u:'https://example.invalid/8' },
  { t:'청년도약계좌 갈아타기 문의 늘어',                s:'견본신문', u:'https://example.invalid/9' },
  { t:'전세 보증금 반환 분쟁 증가',                     s:'견본신문', u:'https://example.invalid/10' },
  { t:'연말정산 간소화 자료 제공 일정 안내',            s:'견본신문', u:'https://example.invalid/11' }
];

const SEED = (o) => `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients',
  'osCliInfoLoad','osRepListLoad','chkLoad'].forEach(function(k){window[k]=function(){};});
 window.toast=function(m){window.__T=m;};
 window.setupDone=function(){return true;};window.setupCanRun=function(){return true;};
 window.setupShow=function(){return false;};window.osTabAllowed=function(){return true;};
 window.cmLoadAll=function(cb){if(cb)cb();};
 /* 받아 오는 자리를 막습니다 — 이 자는 <b>이미 받아 둔 것</b>에서 고르는
    일만 봅니다. 안 막으면 화면이 스스로 서버를 부르러 갑니다 (7번).      */
 window.nlPull=function(d){window.__PULL=(window.__PULL||0)+1;if(typeof d==='function')d();};
 window.nlAuto=function(){return false;};
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',user_id:'me',name:'홍길동',role:'owner',user_role:'owner',team:'A',active:true,plan:'pro'};
 window.osClient=function(){var mk=function(){var a={};
   ['select','order','limit','in','is','eq','neq','not','gte','lte','update','insert','upsert','delete','single','range','or','filter']
     .forEach(function(k){a[k]=function(){return a;};});
   a.then=function(f){return Promise.resolve({data:[],error:null}).then(f);};return a;};
   return {from:function(){return mk();},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 CM.loaded=true;CM.who={me:'홍길동'};CM.pick='';CM.picked=true;
 AR.loaded=true;AR.busy='';AR.calls=[];AR.rep={};
 AR.cliRows=[{id:'c1',name:'홍길동가',nm:'홍길동가'}];
 AR.db=[{id:'d1',who:'me',name:'홍길동가',stage:'AP',days:2,region:'서울',src:'일반'},
        {id:'d2',who:'me',name:'홍길동나',stage:'PC',days:3,region:'서울',src:'일반'}];
 OSC.loaded=true;OSC.busy=false;OSC.err='';
 OSC.list=[{id:'c1',name:'홍길동가',phone:'010'}];
 CHKS.busy=false;CHKS.err='';CHKS.rows=[];CHKS.fin={};CHKS.by={};
 HWHO.id='';
 /* 견본 기사를 <b>앱이 쓰는 그 길로</b> 담습니다 — nlWhich 로 갈래를 붙여
    넣어야 「실제로 그렇게 들어온 기사」 와 같습니다 (8번).               */
 (function(){
   var S=${JSON.stringify(견본)};
   S.forEach(function(it){ it.cats=nlWhich({title:it.t,desc:'',source:it.s}); });
   NLIVE.items=S.filter(function(it){return it.cats.length;});
   NLIVE.at='2026-10-24 09:00';NLIVE.got=S.length;NLIVE.drop=S.length-NLIVE.items.length;
   NLIVE.cat='${(o && o.칸) || 'all'}';NLIVE.age='${(o && o.나이) || 'all'}';
   try{localStorage.removeItem('apex_nl_pick_v1');localStorage.removeItem('apex_hm_ig_v1');}catch(e){}
 })();
 go('${(o && o.탭) || 'news_live'}');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const open = async (o) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**://**', r => {
      if (r.request().url().indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
      바깥++; return r.abort();
    });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
    await p.waitForTimeout(2600);
    await p.evaluate(SEED(o || {})); await p.waitForTimeout(1600);
    return { ctx, p, errs };
  };

  /* ══ [0] 표는 한 곳 ══════════════════════════════════════════════ */
  head('[0] 🗂️ <b>묶음표가 한 곳에만</b> 있나 (5번)');
  const F = require(path.join(ROOT, 'apex-newsfit.js')).APEX_FIT;
  is(F.cats.length >= 7, '  갈래가 <b>일곱 이상</b>이다 — ' + F.cats.length + '개 (저축이 들어왔습니다)');
  const 앞 = (F.main || []).map(k => (F.keyOf(k) || {}).t || k);
  is(앞.join('·') === '보험·경제·저축·정책',
     '  앞줄이 사장님 말씀 그대로 <b>보험 · 경제 · 저축 · 정책</b> 이다 — ' + 앞.join('·'));
  is((F.idsOf('policy') || []).length === 2,
     '  「정책」 이 무엇을 담는지 <b>표가 안다</b> — ' +
     (F.idsOf('policy') || []).map(i => (F.keyOf(i) || {}).t).join(' + '));
  const 뒤 = (F.restIds() || []).map(i => (F.keyOf(i) || {}).t);
  is(뒤.length > 0, '  앞줄에 안 든 칸을 <b>세지 않고 빼서</b> 낸다 — 그 밖에 ' + 뒤.join('·') + ' (6번)');
  /* 화면이 묶음을 또 적고 있지 않나 — 글자로 봅니다 */
  const ix = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is(!/ids\s*:\s*\[\s*['"]help['"]\s*,\s*['"]fund['"]/.test(ix),
     '  index.html 에 묶음표가 <b>두 번째로</b> 적혀 있지 않다 (5번)');
  is(/APEX_FIT\.(main|restIds|keyOf|idsOf)/.test(ix),
     '  화면은 그 표를 <b>물어서</b> 쓴다 — 앞줄을 글자로 박아 두지 않았다');
  /* ★ BAND 가 그대로 있나 — 나이로 고르던 자를 되살리지 않았나 */
  is(!!F.band && !!F.band['60'] && !F.band['4050'],
     '  ★★ <b>BAND 는 그대로</b>다 — 나이는 <b>동점일 때만</b> 기울이고, 40·50대는 여전히 없다 (2026-09-22 의 결정)');
  is(typeof F.ageOf === 'function' && typeof F.ageHas === 'function',
     '  연령대를 <b>기사에서 읽는 자</b>는 따로 있다 (ageOf · ageHas) — BAND 와 섞지 않았다');

  /* ══ [1] 네 갈래를 고를 수 있나 ═════════════════════════════════ */
  head('[1] 🗂️ <b>넷에서 골라</b> 볼 수 있나 — 뉴스 화면');
  const A = await open({});
  let o = await A.p.evaluate(() => {
    const q = s => Array.from(document.querySelectorAll(s));
    return {
      앞줄: q('#nlChips .nl-chips:not(.nl-rest):not(.nl-age) .nl-chip').map(b => b.textContent.replace(/\s+/g,' ').trim()),
      뒷줄: q('#nlChips .nl-rest .nl-chip').map(b => b.textContent.replace(/\s+/g,' ').trim()),
      나이줄: q('#nlChips .nl-age .nl-chip').map(b => b.textContent.replace(/\s+/g,' ').trim()),
      줄수: q('#nlBody .nl-item').length,
      받은것: NLIVE.items.length
    };
  });
  is(o.앞줄.length === 5, '  앞줄에 <b>전체 + 넷</b>이 선다 — ' + o.앞줄.join(' | '));
  is(/보험/.test(o.앞줄.join()) && /경제/.test(o.앞줄.join()) &&
     /저축/.test(o.앞줄.join()) && /정책/.test(o.앞줄.join()),
     '  <b>보험·경제·저축·정책</b> 이 다 있다');
  is(o.뒷줄.length >= 2, '  <b>그 밖에</b> 칸도 그대로 선다 — ' + o.뒷줄.join(' | ') + ' (6번 · 길을 안 지웁니다)');
  is(o.줄수 === o.받은것, '  처음에는 <b>전체</b>가 보인다 — ' + o.줄수 + '건 / 받아 둔 ' + o.받은것 + '건');

  /* ══ [2] ★ 칸에 적힌 수가 거짓말을 안 하나 ══════════════════════ */
  head('[2] ★ <b>칸에 적힌 수 == 눌러서 나오는 수</b> (1·5번)');
  const 수 = await A.p.evaluate(() => {
    const out = [], F = window.APEX_FIT;
    const keys = ['all'].concat(F.main, F.restIds());
    keys.forEach(k => {
      nlSetCat(k);
      const 적힌 = nlCount(k);
      const 나온 = document.querySelectorAll('#nlBody .nl-item').length;
      out.push({ k:k, t:(F.keyOf(k) || { t:'전체' }).t, 적힌:적힌, 나온:나온 });
    });
    nlSetCat('all');
    return out;
  });
  수.forEach(r => is(r.적힌 === r.나온,
    '  <b>' + r.t + '</b> — 칸에 ' + r.적힌 + ' · 눌러서 ' + r.나온 +
    (r.적힌 === r.나온 ? '' : ' ← 갈립니다')));
  is(수.filter(r => r.적힌 > 0).length >= 4,
     '  ★ 재어 볼 거리가 있다 — 기사가 든 칸이 ' + 수.filter(r => r.적힌 > 0).length +
     '개 (하나도 없으면 이 자가 아무것도 못 보는 것입니다 · 8번)');

  /* ══ [3] 🎂 연령대 — 겹쳐 물을 수 있나 ═════════════════════════ */
  head('[3] 🎂 <b>연령대</b>를 겹쳐 고를 수 있나');
  const 나 = await A.p.evaluate(() => {
    const F = window.APEX_FIT, out = { 칸:[], 겹침:[] };
    out.칸 = ['all'].concat(F.ageKeys).map(k => ({ k:k, n:nlAgeCount(k) }));
    F.ageKeys.forEach(bd => {
      nlSetCat('all'); nlSetAge(bd);
      out.겹침.push({ bd:bd, t:F.bandT[bd], 적힌:nlAgeCount(bd),
                      나온:document.querySelectorAll('#nlBody .nl-item').length });
    });
    nlSetAge('all'); nlSetCat('all');
    return out;
  });
  is(나.칸.length === 4, '  연령대 칸이 <b>전체 + 셋</b>이다 — ' +
     나.칸.map(x => x.k + ':' + x.n).join(' · '));
  나.겹침.forEach(r => is(r.적힌 === r.나온,
    '  <b>' + r.t + '</b> — 칸에 ' + r.적힌 + ' · 눌러서 ' + r.나온 +
    (r.적힌 === r.나온 ? '' : ' ← 갈립니다')));
  is(나.겹침.filter(r => r.적힌 > 0).length === 3,
     '  ★★ <b>세 연령대 모두</b> 기사가 하나 이상 걸린다 — ' +
     나.겹침.map(r => r.t + ' ' + r.적힌 + '건').join(' · ') +
     '. 하나가 늘 0 이면 그 연령대 추천은 <b>있는 척</b>입니다 (1번)');
  /* 겹쳐 고르기 — 저축 × 20·30대 */
  const 겹 = await A.p.evaluate(() => {
    nlSetCat('save'); nlSetAge('2030');
    return { 적힌:nlCount('save'), 나온:document.querySelectorAll('#nlBody .nl-item').length,
             글:(document.querySelector('#nlBody') || {}).innerText || '' };
  });
  is(겹.적힌 === 겹.나온,
     '  <b>저축 × 20·30대</b> 를 겹쳐도 수가 안 갈린다 — ' + 겹.적힌 + ' / ' + 겹.나온);
  /* 비면 <b>왜</b> 빈지 말하나 */
  const 빔 = await A.p.evaluate(() => {
    nlSetCat('ins'); nlSetAge('2030');
    const n = document.querySelectorAll('#nlBody .nl-item').length;
    return { n:n, 글:((document.querySelector('#nlBody .nl-empty') || {}).innerText || '').replace(/\s+/g,' ').trim() };
  });
  is(빔.n > 0 || /연령대|전체/.test(빔.글),
     '  좁혀서 비면 <b>왜 빈지</b> 말한다 — ' + (빔.n > 0 ? '(이 칸은 안 비었습니다)' : '「' + 빔.글 + '」'));
  await A.p.evaluate(() => { nlSetCat('all'); nlSetAge('all'); });

  /* ══ [4] ★★ 추천 이유가 기사에 정말 있는 낱말인가 ═══════════════ */
  head('[4] ★★ <b>추천 이유를 지어내지 않나</b> (1번 · 9번)');
  const 이유 = await A.p.evaluate(() => {
    const F = window.APEX_FIT, out = { 줄:[], 지어냄:[], 숫자:[], 없음:0, 있음:0 };
    NLIVE.items.forEach(it => {
      const L = F.ageOf({ t:it.t, desc:it.desc || '' }) || [];
      if (!L.length) { out.없음++; return; }
      out.있음++;
      L.forEach(w => {
        out.줄.push(it.t.slice(0, 16) + ' → ' + w.t + '「' + w.word + '」');
        /* ★ 그 낱말이 <b>이 기사에 정말 있나</b> — 한 글자씩 대조 */
        if ((it.t + ' ' + (it.desc || '')).indexOf(w.word) < 0)
          out.지어냄.push(it.t.slice(0, 20) + ' / ' + w.word);
        /* ★ 한도·나이·개월 수를 적지 않나 (2번) */
        if (/\d/.test(String(w.why) + String(w.t === undefined ? '' : ''))) out.숫자.push(w.why);
      });
    });
    return out;
  });
  is(이유.지어냄.length === 0,
     '  ★★ 추천 이유의 낱말이 <b>그 기사에 정말 있다</b> — 지어낸 것 ' + 이유.지어냄.length +
     '개' + (이유.지어냄.length ? (' ← ' + 이유.지어냄.join(' · ')) : ''));
  is(이유.있음 >= 3,
     '  ★ 재어 볼 거리가 있다 — 낱말이 걸린 기사 ' + 이유.있음 + '건 (0 이면 이 자가 눈이 먼 것입니다 · 8번)');
  is(이유.숫자.length === 0,
     '  <b>한도·나이·개월 수를 안 적는다</b> (2번) — 숫자가 든 이유 ' + 이유.숫자.length + '개');
  /* 화면에 실제로 찍히나 */
  const 찍 = await A.p.evaluate(() => {
    const q = Array.from(document.querySelectorAll('#nlBody .nl-item'));
    const 이유있는 = q.filter(x => x.querySelector('.nl-why:not(.nl-why-no)'));
    const 없다는 = q.filter(x => x.querySelector('.nl-why-no'));
    return { 줄:q.length, 이유:이유있는.length, 없다:없다는.length,
             한줄:(이유있는[0] ? 이유있는[0].querySelector('.nl-why').innerText.replace(/\s+/g,' ').trim() : ''),
             없다글:(없다는[0] ? 없다는[0].querySelector('.nl-why-no').innerText.replace(/\s+/g,' ').trim() : '') };
  });
  is(찍.이유 > 0, '  화면에 <b>그렇게 찍힌다</b> — 「' + 찍.한줄 + '」');
  is(/적혀 있습니다/.test(찍.한줄),
     '  ★★ <b>「기사에 … 라고 적혀 있습니다」</b> 로 적는다 — 「이 고객은 몇 살이니」 가 아니다 (1번)');
  is(찍.이유 + 찍.없다 === 찍.줄,
     '  기사마다 <b>한 자리에서</b> 답한다 — 이유 ' + 찍.이유 + ' + 없다 ' + 찍.없다 + ' = 줄 ' + 찍.줄);

  /* ══ [5] 낱말이 없으면 없다고 하나 ══════════════════════════════ */
  head('[5] ⚠ <b>없으면 없다고</b> 적나 — 「어느 연령대에나」 를 안 하나 (1번)');
  is(찍.없다 > 0, '  낱말이 없는 기사가 <b>있다</b> — ' + 찍.없다 + '건 (다 걸리면 낱말이 너무 넓은 것입니다 · 8번)');
  is(/낱말이 없습니다/.test(찍.없다글),
     '  그 자리에 <b>없다고</b> 적는다 — 「' + 찍.없다글 + '」');
  is(!/어느 연령대에나 (좋|맞|적합)/.test(찍.없다글),
     '  <b>「어느 연령대에나 좋습니다」 로 때우지 않는다</b> — 아무 말도 안 하면서 말한 척하는 글입니다');
  await A.ctx.close();

  /* ══ [6] 🏠 홈에서 고르고, 고른 것이 남나 ══════════════════════ */
  head('[6] 🏠 <b>홈 「지금 할 것」 안에서</b> 고를 수 있나 · 고른 것이 남나');
  const B = await open({ 탭:'home' });
  let h = await B.p.evaluate(() => {
    const g = document.querySelector('.hm-nw-g');
    return { 고르개:!!g,
             칸:g ? Array.from(g.querySelectorAll('.nl-chip')).map(b => b.textContent.replace(/\s+/g,' ').trim()) : [],
             소식:((document.querySelector('.hm-nw .hm-nw-t') || {}).innerText || '').replace(/\s+/g,' ').trim(),
             이유:Array.from(document.querySelectorAll('.hm-nw .nl-why')).length };
  });
  is(h.고르개, '  홈 소식 칸에 <b>고르개가 선다</b> — ' + h.칸.join(' | '));
  is(h.칸.length === 5, '  <b>전체 + 넷</b>이다 — ' + h.칸.length + '개');
  is(h.이유 > 0, '  그 한 건의 <b>추천 이유</b>도 거기 적힌다 — ' + h.이유 + '줄');
  is(/오늘 보낼 소식/.test(h.소식), '  소식 한 줄이 그대로 선다 — 「' + h.소식.slice(0, 40) + '…」');
  /* 「저축」 을 눌러 봅니다 — 오늘 한 건이 그 칸에서 와야 합니다 */
  const 눌 = await B.p.evaluate(() => {
    const bs = Array.from(document.querySelectorAll('.hm-nw-g .nl-chip'));
    const t = bs.filter(x => x.textContent.indexOf('저축') >= 0)[0];
    if (!t) return { err:'저축 칸이 없습니다' };
    t.click();
    return { ok:true };
  });
  await B.p.waitForTimeout(700);
  const 뒤상태 = await B.p.evaluate(() => {
    let 담김 = null; try { 담김 = JSON.parse(localStorage.getItem('apex_nl_pick_v1') || 'null'); } catch (e) {}
    const i = hmIgIdx(), it = (NLIVE.items || [])[i] || {};
    return { 상태:NLIVE.cat, 담김:담김,
             켜짐:Array.from(document.querySelectorAll('.hm-nw-g .nl-chip.on')).map(b => b.textContent.replace(/\s+/g,' ').trim()),
             오늘:it.t || '', 갈래:(it.cats || []).slice(),
             소식:((document.querySelector('.hm-nw .hm-nw-t') || {}).innerText || '').replace(/\s+/g,' ').trim() };
  });
  is(!눌.err && 뒤상태.상태 === 'save', '  「저축」 을 누르면 <b>그 칸이 켜진다</b> — ' + 뒤상태.켜짐.join('|'));
  is(!!(뒤상태.담김 && 뒤상태.담김.cat === 'save'),
     '  ★ 고르신 것이 <b>이 브라우저에 남는다</b> — ' + JSON.stringify(뒤상태.담김) +
     ' (매번 다시 고르면 「순차적으로」 가 안 됩니다)');
  is(뒤상태.갈래.indexOf('save') >= 0,
     '  ★★ 오늘 한 건이 <b>고르신 칸에서</b> 온다 — 「' + 뒤상태.오늘.slice(0, 24) + '」 · 갈래 ' + 뒤상태.갈래.join('/'));
  /* 뉴스 화면으로 가도 그대로인가 */
  const 건너 = await B.p.evaluate(() => {
    go('news_live');
    return 1;
  });
  await B.p.waitForTimeout(900);
  const 건너뒤 = await B.p.evaluate(() => ({
    상태:NLIVE.cat,
    켜짐:Array.from(document.querySelectorAll('#nlChips .nl-chip.on')).map(b => b.textContent.replace(/\s+/g,' ').trim())
  }));
  is(건너뒤.상태 === 'save',
     '  ★ 뉴스 화면으로 가도 <b>그대로 저축</b>이다 — ' + 건너뒤.켜짐.join('|') + ' (묻는 곳이 하나입니다 · 5번)');
  await B.ctx.close();

  /* ══ [7] 서버를 더 안 부르나 · 조용한가 ════════════════════════ */
  head('[7] 🤫 <b>고르는 것은 이미 받아 둔 것에서</b> — 서버를 더 안 부르나 (7번)');
  const C = await open({});
  const 전 = 바깥;
  const pull = await C.p.evaluate(() => {
    const F = window.APEX_FIT;
    ['all'].concat(F.main, F.restIds()).forEach(k => nlSetCat(k));
    F.ageKeys.forEach(bd => nlSetAge(bd));
    nlSetCat('all'); nlSetAge('all');
    return window.__PULL || 0;
  });
  await C.p.waitForTimeout(500);
  is(바깥 - 전 === 0, '  칸을 ' + (5 + 2 + 3) + '번 눌러도 <b>바깥을 안 부른다</b> — ' + (바깥 - 전) + '번');
  is(pull === 0, '  <b>새로 모으러 가지 않는다</b> — nlPull ' + pull + '번');
  is(C.errs.length === 0, '  터진 것이 <b>없다</b> — ' + (C.errs.length ? C.errs.join(' / ') : '0개'));
  await C.ctx.close();

  console.log('\n──────────────────────────────');
  await b.close(); srv.close();
  if (bad) { console.log('✗ 뉴스 고르개 — 고칠 자리 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 넷에서 골라 보시고, 추천 이유는 기사에 적힌 낱말에서만 옵니다.');
})();
