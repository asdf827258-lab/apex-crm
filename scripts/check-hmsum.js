/* ══════════════════════════════════════════════════════════════════
   check-hmsum.js — <b>홈 맨 위의 두 칸</b> — 왼쪽 CRM 요약 · 오른쪽 전체 지도,
   그 바로 아래 <b>📄 보장분석 PDF 넣기</b> 한 줄.

   사장님 말씀 (2026-10-09) — 「<b>맨 위에</b> 보장분석을 입력하세요 하면 ai
   제안서가 나오는데 <b>그 칸을 반으로 쪼개서</b> 왼쪽인 그 칸에 <b>DB통합CRM
   요약</b> 만들어 주고, 오른쪽엔 <b>무엇을 도울까요? 사용설명서</b> 넣어 줘 —
   내꺼 <b>마인드맵으로 펼쳐놨던 것</b>」.

   ── ⚠ 이 자가 왜 자리를 다시 재나 ─────────────────────────────────
   판 X80 에서 이 칸을 <b>☰ 서랍</b>에 세웠습니다. 「찾기 칸」 으로 알아들은
   것인데, 사장님이 가리키신 것은 <b>홈 맨 위의 히어로</b>(hmTossHero ·
   「KB보장분석 넣어주시면…」 193px) 였습니다. 사장님께서 <b>「아직 변경
   안되었는데 위에」</b> 라고 하셔서 알았습니다. 자는 그때 <b>초록이었습니다</b> —
   엉뚱한 자리를 바르게 재고 있었기 때문입니다. 그래서 이 자는 이제
   <b>홈의 몇 번째인지</b>와 <b>서랍이 원래대로인지</b>를 함께 잽니다.

   ── 이 자가 제일 걱정하는 것 ───────────────────────────────────────
   ⓐ <b>보장분석 길이 끊기는 것.</b> 히어로 자리를 두 칸이 가져갔으니,
      go('bojang') 로 가는 한 줄이 <b>바로 아래 반드시</b> 있어야 합니다.
      「다 됐다」로 보이는 상태에서 길을 감추지 않습니다 (6번).
   ⓑ <b>또 세는 것.</b> 단계별 건수는 arTkCount 하나가 세고 「진행중」 은
      arTkRun 이 AP·PC·CS 를 더합니다 (5번).
   ⓒ <b>모름을 0 으로 적는 것.</b> 「0명」 은 「배정이 없다」 는 뜻입니다 (1번).
   ⓓ <b>이름이 새는 것.</b> 홈은 고객 앞에서 열립니다 — 수만 적습니다 (3번).
   ⓔ <b>옛 히어로가 남는 것.</b> 두 벌이 되면 같은 말이 두 번 섭니다 (5번).
   ⓕ <b>서랍이 안 돌아온 것.</b> 판 X80 에서 거둔 🗺️ 단추가 되살아나고,
      서랍에는 두 칸이 <b>없어야</b> 합니다 — 길이 둘이면 쌍둥이입니다.
   ⓖ <b>사다리 밖 글자.</b> 서랍 것을 베껴 11px(없는 토큰 --t7 의 되돌림값)
      을 썼다가 폰 자에 걸렸습니다. 앱의 바닥은 <b>13px</b> 입니다.
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

/* 🏠 <b>홈 맨 위</b>를 읽습니다 — 글을 안 믿고 자리를 잽니다 */
const 홈 = async (p) => await p.evaluate(async () => {
  const dyn = document.getElementById('dynPane');
  if (!dyn) return { X: '홈 칸이 없습니다' };
  const two = dyn.querySelector('.hm-two');
  const pdf = dyn.querySelector('.hm-pdf');
  const btns = two ? [...two.querySelectorAll('button')] : [];
  const r = e => e ? Math.round(e.getBoundingClientRect().top + (window.scrollY || 0)) : -1;
  /* 홈의 <b>큰 토막들</b>을 위에서 아래로 — 두 칸이 몇 번째인지 보려고 */
  const 덩이 = [];
  [...dyn.children].forEach(e => {
    const b = e.getBoundingClientRect();
    if (b.height <= 0) return;
    덩이.push((e.className || '').toString().split(' ')[0] || e.tagName.toLowerCase());
  });
  return {
    두칸: !!two, 칸수: btns.length,
    두칸위: r(two), pdf위: r(pdf), pdf있나: !!pdf,
    pdf글: pdf ? (pdf.innerText || '').replace(/\s+/g, ' ').trim() : '',
    pdf가는곳: pdf ? (pdf.getAttribute('onclick') || '') : '',
    왼: btns[0] ? (btns[0].innerText || '').replace(/\s+/g, ' ').trim() : '',
    오: btns[1] ? (btns[1].innerText || '').replace(/\s+/g, ' ').trim() : '',
    가는곳: btns.map(b => (b.getAttribute('onclick') || '')),
    옛히어로: dyn.querySelectorAll('.tz-hero').length,
    /* 홈 안에서 보장분석으로 가는 길이 몇 개인가 */
    보장길: [...dyn.querySelectorAll('[onclick]')].filter(e => /go\('bojang'\)/.test(e.getAttribute('onclick') || '')).length,
    덩이: 덩이,
    /* ⚠ <b>칸 안의 글만</b> 봅니다. 처음에는 #dynPane 전체를 보고 「이름이
       샌다」 고 헛울었습니다 — 홈의 「오늘 챙길 것」 카드에는 그 분 이름이
       <b>서야 맞습니다</b>(사장님 화면입니다). 가리는 까닭은 밖으로 나갈
       때이지 이 브라우저 화면이 아닙니다 (3번 · check-calface 의 교훈).   */
    칸글: [two, pdf].filter(Boolean).map(e => (e.innerText || '')).join(' '),
    글전부: (dyn.innerText || ''),
    /* ⓖ 두 칸·한 줄 안의 글자가 <b>13px 아래</b>로 떨어지지 않나 */
    작은글자: (() => {
      const 자리 = [two, pdf].filter(Boolean);
      let n = 0;
      자리.forEach(root => {
        [root, ...root.querySelectorAll('*')].forEach(e => {
          const t = (e.textContent || '').trim(); if (!t) return;
          const px = parseFloat(getComputedStyle(e).fontSize || '0');
          if (px > 0 && px < 13) n++;
        });
      });
      return n;
    })()
  };
});

/* 🗂️ <b>서랍</b>은 원래대로 돌아왔나 (판 X80 되돌림) */
const 서랍 = async (p) => await p.evaluate(async () => {
  try { if (typeof toggleNav === 'function' && !navWide()) toggleNav(); } catch (e) {}
  await new Promise(r => setTimeout(r, 800));
  const sb = document.getElementById('sidebar');
  if (!sb) return { X: '서랍이 없습니다' };
  const out = [];
  sb.querySelectorAll('.sb-guide, .hm-two, .nav-two, .nav-find').forEach(e => {
    const b = e.getBoundingClientRect();
    if (b.height <= 0) return;
    out.push({ top: Math.round(b.top), 키: (e.className || '').toString().split(' ').slice(0, 2).join('.') });
  });
  out.sort((a, b) => a.top - b.top);
  return { out,
    두칸있나: !!sb.querySelector('.hm-two, .nav-two'),
    지도단추: sb.querySelectorAll('.sb-guide.map').length,
    지도길: [...sb.querySelectorAll('[onclick]')].filter(e => /apexmap/.test(e.getAttribute('onclick') || '')).length };
});

(async () => {
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
    is((src.match(/function hmSumHtml\(\)/g) || []).length === 1, '  두 칸을 짓는 자리가 하나다');
    is((src.match(/id="hmSumBox"/g) || []).length === 1, '  왼쪽 칸(id)이 하나다');
    is((src.match(/'\.hm-two\{/g) || []).length === 1, '  옷(.hm-two)이 한 곳에만 있다');
    is((걷기(src).match(/hmSumHtml\(\)/g) || []).length === 2,
      '  부르는 자리가 하나다 (선언 1 + 호출 1)');
    is((src.match(/'\.hm-pdf\{/g) || []).length === 1, '  📄 한 줄의 옷도 한 곳에만 있다');
  }

  console.log('\n[2] 🧮 <b>또 세지 않는다</b> (5번)');
  {
    const 몸 = 걷기((src.match(/function hmSumCnt\(\)\{[\s\S]*?\n\}/) || [''])[0]);
    is(몸.length > 40, '  셈하는 몸을 찾았다 (' + 몸.length + '자)');
    is(/arTkCount\(/.test(몸), '  단계별 건수는 <b>arTkCount</b> 가 센다');
    is(/arTkRun\(/.test(몸), '  「진행중」 은 <b>arTkRun</b> 이 더한다');
    is(!/\['AP'\]|\['PC'\]|\['CS'\]/.test(몸),
      '  AP·PC·CS 를 <b>제 손으로 더하지 않는다</b> — 빠뜨릴 자리를 안 만듭니다');
    is(/AR\.db!==null/.test(몸), '  <b>읽었나</b>를 AR.db 로 가린다 (1번)');
  }

  const A = await open({}, 390, 844);
  /* ⚠ <b>이 토막만</b> 셉니다 — 뒤에 연 창들의 시작 요청까지 더해
     「4번 불렀다」 고 헛울었던 적이 있습니다 (8번). */
  const 바깥전 = 바깥;
  const H = await 홈(A.p);
  const 그릴때 = 바깥 - 바깥전;

  console.log('\n[3] 🏠 <b>홈 맨 위</b>에 두 칸이 선다 — 히어로가 섰던 자리');
  is(!H.X && H.두칸 && H.칸수 === 2, '  두 칸이 선다 — ' + (H.칸수 || 0) + '칸');
  is(H.두칸위 > 0 && H.두칸위 < 844,
    '  <b>첫 화면 안</b>에 있다 — 위에서 ' + H.두칸위 + 'px (화면 844px)');
  is(/DB통합CRM/.test(H.왼), '  왼쪽은 <b>DB통합CRM</b> — 「' + (H.왼 || '').slice(0, 34) + '」');
  is(/무엇을 도울까요/.test(H.오) && /전체 지도/.test(H.오),
    '  오른쪽은 <b>무엇을 도울까요 · 전체 지도</b> — 「' + (H.오 || '').slice(0, 34) + '」');
  is(H.옛히어로 === 0,
    '  <b>옛 히어로가 안 남았다</b> — .tz-hero ' + H.옛히어로 + '개 (두 벌이면 같은 말이 두 번 · 5번)');

  console.log('\n[4] 📄 <b>보장분석 길이 살아 있다</b> — 바로 아래 한 줄 (6번)');
  is(H.pdf있나, '  📄 한 줄이 선다');
  is(H.pdf위 > H.두칸위, '  <b>두 칸 바로 아래</b>다 — 두 칸 ' + H.두칸위 + 'px · 한 줄 ' + H.pdf위 + 'px');
  is(/보장분석/.test(H.pdf글), '  글에 <b>보장분석</b> 이 있다 — 「' + H.pdf글 + '」');
  is(/go\('bojang'\)/.test(H.pdf가는곳), "  누르면 <b>go('bojang')</b> 으로 간다");
  is(H.보장길 === 1,
    '  홈에서 보장분석으로 가는 자리가 <b>하나</b>다 — 지금 ' + H.보장길 + '곳 (둘이면 쌍둥이 · 5번)');

  console.log('\n[5] 🔢 <b>수가 맞다</b> — 씨는 AP1·PC1·CS1·계약완료1·미접촉1');
  is(/5\s*명/.test(H.왼), '  전체 <b>5명</b>');
  is(/진행중\s*3/.test(H.왼), '  진행중 <b>3</b> (AP·PC·CS)');
  is(/미전달\s*1/.test(H.왼), '  증권 미전달 <b>1</b>');

  console.log('\n[6] 🙈 <b>두 칸·한 줄에 이름을 한 자도 안 적는다</b> (3번)');
  {
    const 샜나 = /홍길동/.test(H.칸글 || '');
    is(!샜나, '  두 칸과 📄 한 줄에 고객 이름이 없다 — 수만 적습니다' +
      (샜나 ? (' — 「' + (H.칸글 || '').slice(0, 50) + '」') : ''));
    /* ★ 홈 전체에는 이름이 <b>있어야</b> 맞습니다 — 자가 그걸 「샌다」 고
       읽지 않도록 여기서 함께 적어 둡니다 (헛것을 잡는 자가 더 나쁩니다 · 8번). */
    is(/홍길동/.test(H.글전부 || ''),
      '  ↔ 홈 <b>다른 자리</b>에는 그 분 이름이 선다 — 가리는 까닭은 밖으로 나갈 때입니다');
  }

  console.log('\n[7] 🔤 <b>글자가 사다리 안</b>이다 — 바닥은 13px (ⓖ)');
  is(H.작은글자 === 0,
    '  두 칸·한 줄 안에 13px 아래가 <b>' + H.작은글자 + '개</b>' +
    ' (서랍 것을 베껴 11px 을 썼다가 폰 자에 걸린 자리입니다)');

  console.log('\n[8] 🗂️ <b>서랍은 원래대로</b> 돌아왔다 (판 X80 되돌림 · ⓕ)');
  const SB = await 서랍(A.p);
  is(!SB.X && SB.두칸있나 === false, '  서랍에는 두 칸이 <b>없다</b>');
  is(SB.지도단추 === 1, '  🗺️ <b>APEX 전체 지도 단추가 하나</b> 돌아왔다 — 지금 ' + SB.지도단추 + '개');
  is(SB.지도길 === 1, '  서랍에서 지도로 가는 자리가 <b>하나</b>다 — 지금 ' + SB.지도길 + '곳');

  console.log('\n[9] 🧭 <b>왼쪽·오른쪽이 제 곳으로</b> 간다');
  is(/go\('crm'\)/.test((H.가는곳 || [])[0] || ''), '  왼쪽을 누르면 <b>DB 통합 CRM</b> 으로 간다');
  is(/go\('apexmap'\)/.test((H.가는곳 || [])[1] || ''), '  오른쪽을 누르면 <b>전체 지도</b>로 간다');

  console.log('\n[10] 🖥 <b>컴퓨터에서도 수가 적힌다</b>');
  const C = await open({}, 1280, 900);
  const HC = await 홈(C.p);
  is(!HC.X && HC.두칸, '  넓은 화면에서도 두 칸이 선다');
  is(/5\s*명/.test(HC.왼 || ''),
    '  <b>수가 적혀 있다</b> — 「' + (HC.왼 || '').slice(0, 34) + '」');
  is(HC.pdf있나, '  📄 한 줄도 선다');

  console.log('\n[11] ❓ <b>모름을 0 으로 안 적는다</b> (1번)');
  const D = await open({ 못읽음: true }, 390, 844);
  const HD = await 홈(D.p);
  is(!/\d/.test((HD.왼 || '').replace(/365|통합|CRM/g, '')),
    '  수를 <b>한 자도 안 적는다</b> — 「' + (HD.왼 || '').slice(0, 40) + '」');
  is(/못 읽었습니다/.test(HD.왼 || ''), '  <b>왜 모르는지</b> 적고 길을 준다');
  is(HD.pdf있나, '  못 읽었어도 <b>보장분석 길은 그대로</b>다 (6번)');

  console.log('\n[12] 🔌 <b>서버를 안 부른다</b> (7번)');
  is(그릴때 === 0, '  홈 맨 위를 그리고 수를 채우는 동안 바깥을 <b>' + 그릴때 + '번</b> 불렀다');

  console.log('');
  const 터짐 = [...A.errs, ...C.errs, ...D.errs];
  is(터짐.length === 0, '재는 동안 <b>조용히 터진 곳이 없다</b>' + (터짐.length ? (' — ' + 터짐[0]) : ''));

  await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '곳이 어긋났습니다.')
                  : '\n✓ 홈 맨 위가 CRM 요약과 전체 지도를 두 칸으로 들고, 보장분석 한 줄은 그 아래 그대로 있습니다.');
  process.exit(bad ? 1 : 0);
})();
