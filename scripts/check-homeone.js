/* ══════════════════════════════════════════════════════════════════
   check-homeone.js — <b>홈이 늘 같은 모양인가, 그리고 짧은가.</b>

   사장님 말씀 (2026-09-21) —
     「홈 화면이 너무 복잡하고 <b>화면이 자꾸 달라서</b> 힘들다」
     「오늘 해야할일을 홈에서 모두 다 할수 있도록」
     「오늘 인스타 올릴 뉴스도 만들어서」

   재 보니 그 말씀이 맞았습니다. 홈이 <b>3,541px(폰 4.2화면)</b> 에 단추가
   104개였고, 그중 <b>준비 SQL 425px · 출발 점검 778px · 팀 270px</b> 가
   상태에 따라 떴다 사라졌다 했습니다. <b>1,473px</b>, 화면 한 장 반이 매번
   나타났다 없어지니 같은 화면일 수가 없었습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] <b>칸 차례가 늘 같은가</b> — 준비할 것이 있든 없든, 팀이 있든
         없든 홈의 뼈대가 <b>글자 하나 안 달라져야</b> 한다. 이것이
         「화면이 자꾸 다르다」 를 막는 유일한 자(尺)다.
     [2] <b>짧아졌는가</b> — 폰에서 2.8화면을 넘지 않는다
     [3] ⚙️ 관리 — 접혀 있고, <b>머리에 무엇이 남았는지</b> 적히고,
         펴면 셋이 다 있다 (지운 것이 아니다)
     [4] 📸 오늘 올릴 것 — <b>받아 둔 진짜 기사</b>만 · 제목·언론사·날짜·원문
     [5] <b>기사를 지어내지 않는가</b> (9번) — 받아 둔 것이 없으면
         제목을 만들지 않고 「못 받았다」 고 적고 받아 오는 자리로 모신다
     [6] <b>오늘 고른 기사는 다시 열어도 같은가</b> — 열 때마다 다른 것이
         뜨면 그것이 바로 「화면이 자꾸 다르다」 이다
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8897;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  /* 앱이 부팅할 때 부르는 자리는 <b>배포된 사이트처럼</b> 답해 준다 —
     404 를 주면 이 점검과 무관한 콘솔 오류가 잡힌다 */
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' });
    rs.end(JSON.stringify({ key: null, why: '없음', from: 'env', has: false })); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 진짜 기사 세 건. <b>고객 이름이 아니라 기사 제목</b>이라 그대로 쓴다 */
const NEWS = [
  { t: '실손보험 청구 전산화 2단계 시행 — 의원급 확대', s: '연합뉴스', d: '2026-09-21', u: 'https://example.com/a', cats: ['ins'] },
  { t: '기준금리 동결 … 가계대출 관리 강화', s: '한국경제', d: '2026-09-20', u: 'https://example.com/b', cats: ['econ'] },
  { t: '출산지원금 지자체별 확대 개편안 발표', s: '뉴스1', d: '2026-09-19', u: 'https://example.com/c', cats: ['help'] }
];
const SEED = (o) => `
 window.__T='';
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'${o.role || 'master'}',active:true,plan:'vip',team_id:'t1'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.toast=function(m){window.__T=m;};window.osIsOwner=function(){return false;};
 window.osLoadClients=function(){};window.confirm=function(){return true;};
 GB.loaded=true;GB.teams=[{id:'t1',name:'1팀'}];GB.teamOf={me:'t1',u2:'t1'};
 GB.rows=[{id:'me',name:'홍길동'},{id:'u2',name:'홍길순'}];
 var _e={};window.arRowOf=function(i){var m={me:'홍길동',u2:'홍길순'};return m[i]?{id:i,name:m[i],sc:_e,raw:_e}:null;};
 AR.rep={};AR.loaded=true;AR.busy='';AR.err='';
 AR.db=[{id:'d1',who:'me',name:'홍길동A',region:'순천',src:'일반',stage:'TA',days:9,n:1,res:'부재',cAt:'',pAt:''},
        {id:'d2',who:'u2',name:'홍길순B',region:'천안',src:'일반',stage:'AP',days:3,n:2,res:'상담',cAt:'',pAt:''}];
 AR.cliRows=[];AR.calls=[];CM.loaded=true;CM.who={me:'홍길동',u2:'홍길순'};
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 window.cmLoadAll=function(cb){if(cb)cb();};
 /* 준비할 것이 <b>있는 판</b>과 <b>없는 판</b>을 갈라 만든다 */
 window.setupShow=function(){return ${o.setup ? 'true' : 'false'};};
 window.setupCanRun=function(){return ${o.setup ? 'true' : 'false'};};
 try{ ${o.news
    ? `localStorage.setItem('apex_newslive',JSON.stringify({at:'2026-09-21',got:3,drop:0,items:${JSON.stringify(NEWS)}}));`
    : `localStorage.removeItem('apex_newslive');`}
      localStorage.removeItem('apex_hm_ig_v1');
      localStorage.removeItem('apex_hm_fold_v1'); }catch(e){}
 if(typeof NLIVE!=='undefined'){NLIVE.items=[];NLIVE.at='';}
 if(typeof nlLoad==='function')nlLoad();
 window.osClient=function(){var mk=function(t){var st={t:t,op:'',id:'',sel:false};var a={
   update:function(){st.op='update';return a;},insert:function(){st.op='insert';return a;},
   upsert:function(){st.op='upsert';return a;},'delete':function(){st.op='delete';return a;},
   select:function(){st.sel=true;return a;},order:function(){return a;},range:function(){return a;},
   limit:function(){return a;},single:function(){return a;},gte:function(){return a;},
   'in':function(){return a;},is:function(){return a;},neq:function(){return a;},not:function(){return a;},
   eq:function(k,v){st.id=v;return a;},
   then:function(o2,n2){if(st.op&&!st.sel)return Promise.resolve({error:null}).then(o2,n2);
     return Promise.resolve({data:st.op?[{id:'x'}]:[],error:null}).then(o2,n2);}};return a;};
   return {from:function(t){return mk(t);},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 HWHO.id='';CM.pick='';CM.picked=true;go('home');`;

/* 홈의 <b>뼈대</b> — 칸의 차례. 안에 무엇이 들었는지가 아니라
   「무엇이 어떤 차례로 서 있나」 를 본다. 이것이 달라지면 사장님 눈에
   <b>다른 화면</b>이다. */
/* ⚠ <b>id 만 견주면 안 된다.</b> 빈 칸도 id 는 그대로 있어서, 준비 SQL 을
   도로 홈 본문에 풀어 놓아도 「뼈대가 같다」 가 초록이었다 — 정작 홈은
   2,339px 에서 3,765px 로 부풀었는데도. 사장님이 느끼시는 것은 id 가
   아니라 <b>눈에 보이는 자리</b>다. 그래서 <b>눈에 보이는 칸만</b>(8px 초과)
   세고, 높이가 크게 달라지면 <b>다른 화면</b>으로 친다 (8번).           */
const bones = (p) => p.evaluate(() => {
  const pane = document.querySelector('.tab-pane.on'); if (!pane) return [];
  return [...pane.children].map(e => {
    const r = e.getBoundingClientRect();
    if (r.height <= 8) return null;
    const id = e.id || (e.className.toString().split(/\s+/)[0] || e.tagName.toLowerCase());
    /* 높이는 <b>100px 자리</b>로 뭉뚱그린다 — 글자 한 줄 차이로 헛빨간불이
       나면 안 되지만, 화면 한 장이 생겼다 없어지는 것은 잡아야 한다 */
    return id + '~' + Math.round(r.height / 100);
  }).filter(Boolean);
});
const tall = (p) => p.evaluate(() => {
  const pane = document.querySelector('.tab-pane.on'); if (!pane) return 0;
  const L = [...pane.children].map(e => e.getBoundingClientRect());
  return Math.round(Math.max.apply(null, L.map(r => r.bottom + scrollY)));
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const open = async (o) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 130)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
    await p.waitForTimeout(2600);
    await p.evaluate(SEED(o)); await p.waitForTimeout(2400);
    return { ctx, p, errs };
  };

  console.log('\n[1] <b>칸 차례가 늘 같다</b> — 준비할 것이 있든 없든');
  const A = await open({ setup: true, news: true });
  const B = await open({ setup: false, news: true });
  const ba = await bones(A.p), bb = await bones(B.p);
  is(ba.length > 0 && ba.join('|') === bb.join('|'),
     '  준비할 것이 있을 때와 없을 때 <b>뼈대가 같다</b>');
  if (ba.join('|') !== bb.join('|')) {
    console.log('     있을 때 · ' + ba.join(' → '));
    console.log('     없을 때 · ' + bb.join(' → '));
  } else console.log('     ' + ba.join(' → '));
  const C = await open({ setup: true, news: false });
  is((await bones(C.p)).join('|') === ba.join('|'),
     '  소식을 못 받았을 때도 <b>뼈대가 같다</b> — 칸은 서고 안에서만 말이 달라진다');

  console.log('\n[2] <b>짧아졌다</b> — 폰에서 2.8화면 이하');
  const hA = await tall(A.p);
  is(hA > 0 && hA <= 844 * 2.8,
     '  홈 높이 <b>' + hA + 'px</b> = 화면 ' + (hA / 844).toFixed(1) + '개 (2.8개 이하 · 고치기 전 4.2개)');

  console.log('\n[3] ⚙️ 관리 — 접혀 있고, 머리가 말해 주고, 펴면 다 있다');
  const m1 = await A.p.evaluate(() => {
    const box = document.getElementById('hmFold_ig');
    const mng = document.getElementById('hmFold_mng');
    return { ig: !!box, mng: !!mng,
      접힘: !!(document.getElementById('hmFoldB_mng') || {}).hidden,
      머리: ((mng || {}).innerText || '').replace(/\s+/g, ' ').trim(),
      높이: mng ? Math.round(mng.getBoundingClientRect().height) : 0 };
  });
  is(m1.mng && m1.접힘, '  접힌 채로 뜬다 — ' + m1.높이 + 'px');
  is(/안 된 것|서버 준비|팀/.test(m1.머리),
     '  머리가 <b>무엇이 남았는지</b> 말한다 — 「' + m1.머리.slice(0, 44) + '」');
  await A.p.evaluate(() => hmFoldToggle('mng')); await A.p.waitForTimeout(500);
  const m2 = await A.p.evaluate(() => {
    const b2 = document.getElementById('hmFoldB_mng');
    return { 펴짐: !b2.hidden, 안에: [...b2.children].map(e => e.id),
      높이: Math.round(b2.getBoundingClientRect().height) };
  });
  is(m2.펴짐 && m2.안에.indexOf('osSetupHome') >= 0 && m2.안에.indexOf('hmReadyHost') >= 0 &&
     m2.안에.indexOf('hmTeamHost') >= 0 && m2.높이 > 300,
     '  펴면 <b>셋이 다 있다</b> — 지운 것이 아니다 · ' + m2.높이 + 'px');

  console.log('\n[4] 📸 오늘 올릴 것 — <b>받아 둔 진짜 기사</b>만');
  await A.p.evaluate(() => hmFoldToggle('ig')); await A.p.waitForTimeout(500);
  const g = await A.p.evaluate(() => ({
    머리: ((document.querySelector('#hmFold_ig .t') || {}).innerText || '').replace(/\s+/g, ' '),
    속: (document.getElementById('hmIgHost') || {}).innerText || '',
    링크: (document.querySelector('#hmIgHost a') || {}).href || '',
    단추: [...document.querySelectorAll('#hmIgHost button')].map(x => x.innerText.trim())
  }));
  is(g.속.indexOf(NEWS[0].t) >= 0, '  <b>제목을 그대로</b> 옮긴다');
  is(g.속.indexOf(NEWS[0].s) >= 0 && g.속.indexOf(NEWS[0].d) >= 0,
     '  <b>언론사·날짜</b>도 그대로 — ' + NEWS[0].s + ' · ' + NEWS[0].d);
  is(g.링크 === NEWS[0].u, '  <b>원문 링크</b>가 그 기사로 간다');
  is(g.머리.indexOf(NEWS[0].t.slice(0, 10)) >= 0, '  펴지 않아도 <b>머리에 제목</b>이 있다');
  is(g.단추.some(x => /캡션/.test(x)) && g.단추.some(x => /카드뉴스/.test(x)) &&
     g.단추.some(x => /보낼 문구/.test(x)),
     '  <b>만들 자리</b>가 그 자리에 있다 — ' + g.단추.join(' · '));
  /* 만드는 도구를 <b>또 만들지 않았는가</b> (5번) — 이미 있는 것을 부른다 */
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const igBlk = (src.split('function hmIgHtml(')[1] || '').slice(0, 2600);
  is(/nlToCard\(/.test(igBlk) && /nlCopy\(/.test(igBlk),
     '  카드뉴스·보낼 문구는 <b>이미 있는 것</b>을 부른다 — 두 벌로 안 만든다 (5번)');

  console.log('\n[5] <b>기사를 지어내지 않는다</b> (9번)');
  await C.p.evaluate(() => hmFoldToggle('ig')); await C.p.waitForTimeout(500);
  const z = await C.p.evaluate(() => ({
    속: (document.getElementById('hmIgHost') || {}).innerText || '',
    머리: ((document.querySelector('#hmFold_ig .t') || {}).innerText || '').replace(/\s+/g, ' ')
  }));
  /* ⚠ 「안 받았습니다」(아직 안 가져옴)와 「못 받았습니다」(가져오려다 실패)는
     다른 말이다. 앱은 앞엣것을 쓴다 — 여기서 뒤엣것만 찾다가 헛빨간불이
     났다. 둘 다 받아 주되, <b>없다는 말과 안 지어낸다는 말</b>은 반드시
     있어야 한다 (1·9번). */
  is(/(안|못) 받았습니다/.test(z.속) && /지어내지 않습니다/.test(z.속),
     '  소식이 없으면 <b>없다고</b> 적고, <b>안 지어낸다</b>고 밝힌다');
  is(!NEWS.some(x => z.속.indexOf(x.t) >= 0) && z.속.length < 300,
     '  <b>없는 제목을 만들지 않는다</b>');
  is(/받아 오기/.test(z.속), '  <b>어디서 받아 오는지</b> 길을 준다 (1번)');
  is(/안 받았습니다/.test(z.머리), '  머리도 <b>그대로</b> 말한다 — 「' + z.머리.replace(/\n/g,' ').slice(0, 40) + '」');

  console.log('\n[6] <b>오늘 고른 기사는 다시 열어도 같다</b>');
  const first = await A.p.evaluate(() => (document.getElementById('hmIgHost') || {}).innerText.split('\n')[0]);
  await A.p.evaluate(() => { go('clients'); }); await A.p.waitForTimeout(700);
  await A.p.evaluate(() => { go('home'); }); await A.p.waitForTimeout(1600);
  await A.p.evaluate(() => { if ((document.getElementById('hmFoldB_ig') || {}).hidden) hmFoldToggle('ig'); });
  await A.p.waitForTimeout(500);
  const again = await A.p.evaluate(() => (document.getElementById('hmIgHost') || {}).innerText.split('\n')[0]);
  is(!!first && first === again, '  다시 열어도 <b>같은 기사</b> — 「' + (again || '').slice(0, 30) + '」');
  /* 그런데 <b>일부러 바꾸면</b> 바뀌어야 한다 — 못 바꾸면 그것도 고장이다 */
  await A.p.evaluate(() => hmIgNext()); await A.p.waitForTimeout(600);
  const next = await A.p.evaluate(() => (document.getElementById('hmIgHost') || {}).innerText.split('\n')[0]);
  is(!!next && next !== again, '  「다른 기사로」 를 누르면 <b>바뀐다</b> — ' + (next || '').slice(0, 26));

  is(A.errs.length === 0 && B.errs.length === 0 && C.errs.length === 0,
     '  화면이 터지지 않았다' + (A.errs[0] || B.errs[0] || C.errs[0] || ''));

  await A.ctx.close(); await B.ctx.close(); await C.ctx.close();
  await b.close(); srv.close();
  console.log('\n' + (bad ? '✗ 홈 한 장 — 고칠 자리 ' + bad + '곳'
    : '✓ 홈은 늘 같은 모양이고, 짧고, 오늘 올릴 것은 받아 둔 진짜 기사입니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
