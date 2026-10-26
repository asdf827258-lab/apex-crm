/* ══════════════════════════════════════════════════════════════════
   check-hmglance.js — 📱 <b>폰 첫 화면이 한눈에 들어오나</b> (판 X158)

   사장님 말씀 (2026-10-22) — 「<b>핸드폰으로 보니 한눈에 안들어와</b> 이
   부분 해결해줘 <b>토스어플처럼 칸을 활용</b>해보자」.

   ── 재어 본 것 (폰 390×844 · 홈 첫 화면) ──────────────────────────
     손대기 전 : 눈이 멈추는 덩이 <b>일곱</b> · 보이는 글줄 36개 가운데
                 <b>17px 이상이 다섯</b>뿐 · 13px 바닥에 <b>22개</b>가 몰림 ·
                 단계 칩 다섯이 줄줄이 흘러 두 줄로 접히고, 수와 이름이
                 <b>같은 13px</b> 라 어느 단계에 몇 분인지 <b>읽어야</b> 알았음.
     고친 뒤   : 수(24px)·이름(17px)·칸 제목(15px)으로 <b>사다리</b>를 세우고,
                 상담현황을 <b>수가 주인공인 칸 격자</b>로 바꿨습니다.

   ── 이 자가 걱정하는 것 ────────────────────────────────────────────
   ⓐ <b>다시 납작해지는 것.</b> 큰 글씨가 하나씩 작아지면 아무도 모르는
      사이에 옛 화면으로 돌아갑니다. <b>큰 글줄 수</b>에 바닥을 둡니다.
   ⓑ <b>바닥 밑으로 내려가는 것.</b> 폰 첫 화면에 13px 밑 글씨는 0 입니다.
   ⓒ <b>칸이 다시 줄로 풀리는 것.</b> 상담현황은 <b>격자</b>여야 합니다.
   ⓓ <b>칸이 손가락보다 작아지는 것</b> — 44px.
   ⓔ <b>길어지는 것.</b> 키운다고 홈이 늘어나면 안 됩니다 — 총 높이의
      주인은 check-homeone 이고(한 물음에 한 답 · 5번), 여기서는 <b>첫
      화면 안</b>만 봅니다.
   ⓕ <b>글이 사라지는 것.</b> 이 판은 크기와 틈만 고쳤습니다 — 첫 화면에
      서 있던 말은 <b>한 자도</b> 없어지지 않아야 합니다 (6번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8908;
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

/* ★ <b>바닥</b> — 지금 잰 수 그대로입니다. 나빠지면 빨간불, 좋아지면 같이
     옮깁니다. 올리지 마십시오 (0-1번·8번).                              */
/* ⚠ 수는 <b>이 자가 제 씨로 잰 것</b>입니다 — 손으로 재던 딴 자의 수를
   베껴 적었다가 한 번 어긋났습니다. 씨가 다르면 화면도 다릅니다 (8번). */
/* ★★ <b>2026-10-26 (판 X199) · 「큰 글줄 9」 → 「눈이 멈출 자리 12」</b> ────
   사장님 말씀 「<b>ⓒ로 해줘</b>」 로 「지금 할 것」 카드(622px)가 홈 맨 위가
   되면서, 폰 첫 화면이 <b>대시보드에서 카드 한 장</b>으로 바뀌었습니다.
   ⚠ <b>잰 값을 그대로 적습니다</b> — 큰 글줄은 <b>9 → 3</b> 으로 줄었습니다.
     상담현황 격자의 24px 수 다섯과 「오늘 N개예요」 가 둘째 화면으로 갔습니다.
   ★ 그런데 <b>눈이 멈추는 것은 글자 크기만이 아닙니다</b> — 파란 단추 셋,
     회색 왜/판단 상자, 칩 상자가 첫 화면을 나눕니다. 그래서 <b>채워진 큰 칸</b>
     까지 세면 <b>22 → 15</b> 입니다.
   ★ 기준선은 <b>12</b> — 지금 15 에서 세 자리 여유입니다. 3 으로 두면 딱 붙어
     헛 빨간불이 켜지고, 15 로 두면 글자 한 줄만 줄어도 울립니다 (8번).
   ⚠ <b>큰 글줄 수는 그대로 찍어 둡니다</b> — 숨기지 않습니다. 다시 대시보드로
     돌아가면 그 수가 먼저 말해 줍니다 (1번).
   ★ 「가장 큰 글자 24px 이상」 · 「13px 바닥에 몰린 글줄 21 이하」 · 「13px 밑
     글씨 0」 세 가지는 <b>한 자도 안 건드렸습니다</b>.                      */
const BASE = { 멈출자리: 12, 작은글줄: 21, 가장큰수: 24 };

/* 첫 화면에 서 있어야 하는 말 — 크기만 고쳤으니 하나도 안 사라집니다 (6번) */
/* ★ 판 X199 — 「✅ 오늘 할 일」 칸이 「지금 할 것」 카드와 <b>합쳐졌습니다</b>
   (사장님 말씀 「ⓒ로 해줘」). 칸이 하나가 되었으니 이름표도 하나입니다 —
   <b>말이 사라진 것이 아니라 한 칸이 된 것</b>입니다. 그 칸이 쥐고 있던
   「오늘 볼 분 N분 중 M번째」·📄 보장분석·＋N분 더는 <b>전부 카드 안</b>에
   그대로 있습니다(check-hmjob 이 하나씩 봅니다).                          */
const 있어야 = ['지금 할 것', '보장분석 PDF 넣기', '상담현황', 'DB통합CRM', '무엇을 도울까요'];

const SEED = `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients',
  'osCliInfoLoad','osRepListLoad','chkLoad'].forEach(function(k){window[k]=function(){};});
 window.toast=function(m){};
 window.setupDone=function(){return true;};window.setupShow=function(){return false;};
 window.osTabAllowed=function(){return true;};window.cmLoadAll=function(cb){if(cb)cb();};
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',user_id:'me',name:'홍길동',role:'owner',user_role:'owner',team:'A',active:true,plan:'pro'};
 window.osClient=function(){var mk=function(){var a={};
   ['select','order','limit','in','is','eq','neq','not','gte','lte','update','insert','upsert','delete','single','range','or','filter']
     .forEach(function(k){a[k]=function(){return a;};});
   a.then=function(f){return Promise.resolve({data:[],error:null}).then(f);};return a;};
   return {from:function(){return mk();},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 CM.loaded=true;CM.who={me:'홍길동'};CM.picked=true;
 AR.loaded=true;AR.cliRows=[];AR.calls=[];AR.rep={};
 AR.db=[{id:'a1',who:'me',name:'홍길동가',stage:'AP',days:2,region:'순천시'},
        {id:'a2',who:'me',name:'홍길동나',stage:'AP',days:3,region:'순천시'},
        {id:'a3',who:'me',name:'홍길동다',stage:'AP',days:4,region:'여수시'},
        {id:'a4',who:'me',name:'홍길동라',stage:'AP',days:5,region:'여수시'},
        {id:'p1',who:'me',name:'홍길동마',stage:'PC',days:6,region:'순천시'},
        {id:'p2',who:'me',name:'홍길동바',stage:'PC',days:7,region:'광양시'},
        {id:'c1',who:'me',name:'홍길동사',stage:'CS',days:8,region:'순천시'}];
 OSC.loaded=true;OSC.list=[];CHKS.busy=false;CHKS.rows=[];CHKS.by={};CHKS.fin={};
 HWHO.id='';go('home');`;

/* 폰 첫 화면에서 <b>정말 눈에 보이는</b> 글줄만 — 서랍·머리띠·꼬리띠는 뺍니다 */
const 재기 = () => {
  const 보이나 = (e) => {
    if (e.closest('#sidebar,#tabbar,.t-top,[hidden]')) return false;
    let n = e;
    while (n && n !== document.body) {
      const c = getComputedStyle(n);
      if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false;
      n = n.parentElement;
    }
    const b = e.getBoundingClientRect();
    return b.width > 8 && b.height > 4 && b.left >= -4 && b.left < 390 && b.top < 844 && b.bottom > 0;
  };
  const 줄 = [];
  document.querySelectorAll('#dynPane *').forEach(e => {
    const own = [].slice.call(e.childNodes)
      .filter(n => n.nodeType === 3 && (n.nodeValue || '').trim())
      .map(n => n.nodeValue.trim()).join(' ');
    if (!own || !보이나(e)) return;
    줄.push({ px: Math.round(parseFloat(getComputedStyle(e).fontSize)),
              글: own.replace(/\s+/g, ' ') });
  });
  /* 📦 <b>채워진 큰 칸</b> — 눈이 멈추는 것은 글자 크기만이 아닙니다 (판 X199).
     제 바탕을 가진 <b>44px 이상 · 폭 60px 이상</b>인 자리를 셉니다 — 파란 단추 ·
     회색 상자 · 칸 격자가 그것입니다. <b>속이 복잡한 껍데기</b>(자식 넷 이상)는
     제 자식을 또 세지 않도록 건너뜁니다.                                   */
  let 칸채움 = 0;
  document.querySelectorAll('#dynPane *').forEach(e => {
    if (!보이나(e)) return;
    const b = e.getBoundingClientRect();
    if (b.height < 44 || b.width < 60 || b.top >= 844) return;
    const bg = getComputedStyle(e).backgroundColor;
    if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return;
    if (e.children.length > 3) return;
    칸채움++;
  });
  /* 상담현황 칸이 <b>격자</b>인가 · 칸이 손가락만 한가 */
  const g = document.querySelector('.t-chips.hm-flow');
  const 칸 = g ? [].slice.call(g.children) : [];
  return {
    줄, 칸채움,
    글전부: (document.querySelector('#dynPane .tab-pane.on') || { innerText: '' }).innerText || '',
    격자: g ? getComputedStyle(g).display : '(없음)',
    칸수: 칸.length,
    작은칸: 칸.filter(x => x.getBoundingClientRect().height < 44).length,
    칸수글: 칸.map(x => { const b = x.querySelector('b');
      return b ? Math.round(parseFloat(getComputedStyle(b).fontSize)) : 0; })
  };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
  await p.waitForTimeout(2600);
  await p.evaluate(SEED); await p.waitForTimeout(2000);
  const R = await p.evaluate(재기);

  const 큰 = R.줄.filter(x => x.px >= 17).length;
  const 작은 = R.줄.filter(x => x.px <= 13).length;
  const 밑 = R.줄.filter(x => x.px < 13);
  const 최대 = R.줄.reduce((a, x) => Math.max(a, x.px), 0);

  console.log('[1] 👀 <b>눈이 멈출 자리</b>가 있나 — 글자 사다리');
  const 멈춤 = 큰 + (R.칸채움 || 0);
  console.log('      보이는 글줄 ' + R.줄.length + '개 · 17px 이상 ' + 큰 + '개 · 채운 칸 ' +
    (R.칸채움 || 0) + '개 · 13px 이하 ' + 작은 + '개 · 가장 큰 글자 ' + 최대 + 'px');
  is(R.줄.length > 20, '  첫 화면을 제대로 읽었다 — 글줄 ' + R.줄.length + '개');
  is(멈춤 >= BASE.멈출자리,
     '  ★★ <b>눈이 멈출 자리</b> ' + 멈춤 + '개 (큰 글줄 ' + 큰 + ' + 채운 칸 ' +
     (R.칸채움 || 0) + ') — 바닥 ' + BASE.멈출자리 + ' (줄면 화면이 다시 납작해진 것입니다)');
  is(작은 <= BASE.작은글줄,
     '  ★ <b>13px 바닥에 몰린 글줄</b> ' + 작은 + '개 — 바닥 ' + BASE.작은글줄);
  is(최대 >= BASE.가장큰수,
     '  ★ 가장 큰 글자가 <b>' + 최대 + 'px</b> 이상이다 — 바닥 ' + BASE.가장큰수);
  is(밑.length === 0,
     '  ★★ 폰 첫 화면에 <b>13px 밑 글씨가 없다</b> — ' + 밑.length + '곳' +
     (밑.length ? (' ← ' + 밑.slice(0, 4).map(x => x.px + 'px 「' + x.글.slice(0, 18) + '」').join(' · ')) : ''));

  console.log('\n[2] 🧱 <b>상담현황이 칸 격자</b>인가 (사장님 말씀 「토스어플처럼 칸을 활용」)');
  is(R.격자 === 'grid', '  ★★ 줄이 아니라 <b>격자</b>로 선다 — display 「' + R.격자 + '」');
  is(R.칸수 >= 5, '  단계 칸이 다 섰다 — ' + R.칸수 + '칸');
  is(R.작은칸 === 0, '  ★ 칸이 <b>44px 이상</b>이다 — 작은 칸 ' + R.작은칸 + '개');
  is(R.칸수글.filter(x => x >= 20).length === R.칸수,
     '  ★★ 칸마다 <b>수가 주인공</b>이다 — 수 글자 ' + (R.칸수글.join('·') || '(없음)') + 'px');

  console.log('\n[3] 🚪 <b>말은 하나도 안 사라졌다</b> (6번 — 크기와 틈만 고쳤습니다)');
  const 없음 = 있어야.filter(w => R.글전부.replace(/\s+/g, ' ').indexOf(w) < 0);
  is(없음.length === 0, '  첫 화면의 다섯 마디가 그대로 선다' + (없음.length ? (' ← 없는 것 ' + 없음.join(' · ')) : ''));
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' ← ' + errs[0] : ''));

  /* ⚠ <b>총 높이는 여기서 안 잽니다</b> — 주인은 check-homeone 입니다.
     두 곳에서 각자 재면 답이 갈립니다 (5번).                           */
  console.log('\n      ⚠ 홈 총 높이(4.2화면 선)는 check-homeone 이 봅니다 — 여기서 다시 세지 않습니다 (5번)');

  console.log('\n──────────────────────────────');
  await b.close(); srv.close();
  if (bad) { console.log('✗ 폰 첫 화면 — 고칠 자리 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 폰 첫 화면이 한눈에 들어옵니다 — 큰 글줄 ' + 큰 + '개 · 가장 큰 글자 ' + 최대 +
              'px · 상담현황 ' + R.칸수 + '칸 격자.');
})();
