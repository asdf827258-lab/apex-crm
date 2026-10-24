/* ══════════════════════════════════════════════════════════════════
   check-icoslot.js — 🖼 <b>본체는 이모지 그대로</b> · 선 그림 한 벌은
   고객 화면이 쓴다.

   ── 이 자의 약속이 한 번 뒤집혔습니다 ──────────────────────────────
   판 X147·X151·X155 에서 사장님 말씀 「이모지 선 그림으로 바꿔줘」 ·
   「남은 이모지도 바꿔」 를 따라 본체의 그림 자리 2,582곳과 글 앞머리
   642곳을 선 그림으로 갈아입혔습니다. 그리고 라이브를 보신 사장님께서
   2026-10-22 에 <b>「이모지 내용은 원래가 좋아 아이콘 그것은 원래대로
   바꿔」</b> 라고 하셨습니다 (판 X157).

   그래서 이 자가 재는 것이 바뀌었습니다 —
     여태 : 「그림 자리가 <b>다</b> 선 그림인가」
     이제 : 「본체에서 <b>한 자리도 안 바꾸나</b> · 그림 한 벌은 <b>살려
             두었나</b> · <b>다시 켜면 정말 돌아오나</b>」

   ★ 자 이름(icoslot)과 파일은 그대로 둡니다 — 이름을 바꾸면 checks.tsv ·
     대장 · 지난 쪽지가 가리키는 자리가 다 낡습니다 (11번 ③).

   ── 이 자가 걱정하는 것 ────────────────────────────────────────────
   ⓐ <b>슬그머니 다시 켜지는 것.</b> 사장님이 원래대로 두라고 하셨는데
      다음 세션이 「이모지가 남았네」 하고 또 바꾸면 안 됩니다.
   ⓑ <b>지웠다가 고객 화면이 깨지는 것.</b> 보장 전·후(app/ba.html)는
      그림을 <b>이름으로</b> 불러 씁니다(baIco). APEX_ICON 을 지우면 그
      화면의 장 제목 그림이 통째로 사라집니다. <b>함수를 지우지
      않습니다</b> (사장님 규칙 · 6번).
   ⓒ <b>스위치가 죽은 줄이 되는 것.</b> 「다시 켜시려면 한 줄만」 이라고
      적어 두고 정작 안 켜지면 그 글이 거짓말입니다 (1번·0-1번). 그래서
      <b>켜 보고</b> 잽니다.
   ⓓ <b>묻는 곳이 두 벌이 되는 것</b> (5번) — ICO_SWAP 한 줄입니다.
   ⓔ <b>그림 자리가 빈 칸이 되는 것.</b> 안 바꾼다는 것은 <b>이모지가
      그대로 선다</b>는 뜻이지 아무것도 없다는 뜻이 아닙니다 (1번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8906;
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
 AR.db=[{id:'d1',who:'me',name:'홍길동가',stage:'AP',days:2,region:'서울',src:'일반'}];
 OSC.loaded=true;OSC.list=[];CHKS.busy=false;CHKS.rows=[];CHKS.by={};CHKS.fin={};
 HWHO.id='';go('home');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
  await p.waitForTimeout(2600);
  await p.evaluate(SEED); await p.waitForTimeout(2200);

  const ico = fs.readFileSync(path.join(ROOT, 'app/apex-icon.js'), 'utf8');
  const idx = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const ba  = fs.readFileSync(path.join(ROOT, 'app/ba.html'), 'utf8');

  console.log('[1] 🎚 <b>묻는 곳이 하나</b>다 (ICO_SWAP · 5번)');
  is((ico.match(/^var ICO_SWAP *=/gm) || []).length === 1,
     '  켤까 말까를 아는 곳이 <b>app/apex-icon.js 한 줄</b>이다');
  is(!/ICO_SWAP/.test(idx.replace(/\/\*[\s\S]*?\*\//g, '')),
     '  본체에는 그 스위치가 <b>없다</b> — 두 벌이면 한쪽만 켜집니다');
  is(/^var ICO_SWAP *= *false;/m.test(ico),
     '  지금은 <b>꺼져</b> 있다 — 사장님 말씀 「이모지 내용은 원래가 좋아」');
  is((ico.match(/var APEX_ICON_OF *=/g) || []).length === 1 &&
     !/APEX_ICON_OF *=/.test(idx.replace(/\/\*[\s\S]*?\*\//g, '')),
     '  이모지 → 그림 표도 <b>한 곳</b>에만 있다');
  is(/if \(!ICO_SWAP\) return;/.test(ico) &&
     /if \(!ICO_SWAP\) return '<span class="ico-emo">/.test(ico),
     '  <b>두 입구가 다 그 한 줄을 본다</b> — 화면을 갈아끼우는 자(icoWatch)와 ' +
     '글을 짓는 자(icoFromEmoji)');

  console.log('\n[2] 🙅 <b>본체에서는 한 자리도 안 바꾼다</b> (사장님 말씀)');
  /* 앱이 가진 화면을 그대로 돕니다 — 목록을 따로 안 적습니다 (5번) */
  const 돌기 = await p.evaluate(async () => {
    const out = { 화면: 0, 칸: 0, 그림: 0, 앞머리: 0, 이모지: 0, 빈칸: [], 도구그림: 0, 칸머리: 0, 칸머리그림: 0 };
    let tabs = [];
    try { tabs = Object.keys(TABS).reduce((a, g) => a.concat(TABS[g].items.map(x => x.id)), []); }
    catch (e) { tabs = ['home']; }
    const SL = (typeof ICO_SLOT === 'string') ? ICO_SLOT : '';
    for (const t of tabs) {
      try { go(t); } catch (e) { continue; }
      /* ⚠ 지켜보는 자가 <b>한 틀(rAF) 뒤</b>에 돌던 자리입니다 — 꺼 두었어도
         같은 만큼 기다려 재야 「안 바뀌었다」 가 참말입니다 (8번). */
      await new Promise(r => setTimeout(r, 140));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      out.화면++;
      /* ⚠ 2026-10-24 (판 X185) · 여기 <b>🧰 도구 화면만 예외</b>로 빼 둔 줄이
         하루 있었습니다(판 X184). 사장님이 라이브를 보시고 <b>「이모지는 전으로
         돌려 이상해」</b> 하셔서 <b>예외를 걷었습니다</b> — 이제 도구 화면도
         똑같이 0 이어야 합니다. 판 X157 과 같은 답이 두 번 나온 자리입니다. */
      out.그림 += document.querySelectorAll('.tab-pane.on svg.ico').length;
      out.앞머리 += document.querySelectorAll('.tab-pane.on .ico-l').length;
      [].slice.call(document.querySelectorAll(SL)).forEach(e => {
        out.칸++;
        const s = (e.textContent || '').replace(/\s/g, '');
        if (s) out.이모지++; else if (!e.children.length) out.빈칸.push(t);
      });
    }
    /* ★ 🧰 도구(tools)는 <b>TABS 에 없습니다</b> — 아래 띠에서만 여는 화면이라
       위 목록에 안 잡힙니다. 그래서 따로 들릅니다. 처음에 이것을 빠뜨려
       「0개」 가 나왔고, 예외가 죽은 줄인 줄 알았습니다 (자를 고쳤습니다). */
    try{ go('tools');
      await new Promise(r => setTimeout(r, 160));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      out.화면++;
      out.그림 += document.querySelectorAll('.tab-pane.on svg.ico').length;
      /* ★ 칸 머리도 따로 셉니다 — 도구 화면은 접혀 있어 칸 머리만 보입니다.
         여기에 그림이 서면 그것이 「또 바꾼 것」 입니다. */
      out.칸머리   = document.querySelectorAll('.tlp-head .e').length;
      out.칸머리그림 = document.querySelectorAll('.tlp-head .e svg.ico').length;
    }catch(e){}
    go('home'); await new Promise(r => setTimeout(r, 300));
    return out;
  });
  console.log('      화면 ' + 돌기.화면 + '개 · 그림 자리 ' + 돌기.칸 + '곳 · 글자가 선 자리 ' + 돌기.이모지 + '곳');
  is(돌기.화면 > 20 && 돌기.칸 > 0, '  화면을 돌며 그림 자리를 찾았다 — ' + 돌기.칸 + '곳');
  is(돌기.그림 === 0,
     '  ★★ 본체에 <b>선 그림이 한 곳도 없다</b> — 🧰 도구 화면까지 세어 svg.ico ' +
     돌기.그림 + '개');

  console.log('\n[2-1] 🧰 <b>도구 화면도 이모지 그대로</b>인가 (판 X185)');
  /* ★ 이 화면은 접혀 있어 <b>칸 머리만</b> 보입니다 — 화면 전체만 세면
     접힌 속의 변화를 놓칩니다. 칸 머리를 따로 봅니다.
     ⚠ 2026-10-24 에 이 화면만 선 그림으로 해 봤다가(판 X184) 사장님이
       <b>「이모지는 전으로 돌려 이상해」</b> 하셔서 되돌렸습니다. 판 X157 과
       <b>같은 답이 두 번</b> 나온 자리입니다 — 다시 켜지 마십시오. */
  is(돌기.칸머리 > 0 && 돌기.칸머리그림 === 0,
     '  🧰 도구 화면의 <b>칸 머리가 이모지</b>다 — 선 그림 ' +
     돌기.칸머리그림 + '/' + 돌기.칸머리);
  is(돌기.앞머리 === 0,
     '  ★★ 글 앞머리도 <b>안 갈아 끼운다</b> — .ico-l ' + 돌기.앞머리 + '개');
  is(돌기.빈칸.length === 0,
     '  ★ 안 바꾼다는 것은 <b>이모지가 그대로 선다</b>는 뜻이다 — 빈 칸 ' +
     돌기.빈칸.length + '곳 (1번)' + (돌기.빈칸.length ? (' ← ' + 돌기.빈칸.slice(0, 5).join(' · ')) : ''));

  console.log('\n[3] 🗂 <b>그림 한 벌은 지우지 않았다</b> (사장님 규칙 · 6번)');
  /* 보장 전·후(ba.html)는 그림을 <b>이름으로</b> 부릅니다 — 지우면 거기
     장 제목 그림이 통째로 사라집니다. 그리고 사장님이 다시 켜시려면
     돌아올 자리가 있어야 합니다.                                      */
  const 벌 = await p.evaluate(() => ({
    가짓수: (typeof icoCount === 'function') ? icoCount() : 0,
    함수: ['icoSvg', 'icoFromEmoji', 'icoSlots', 'icoLead', 'icoWatch']
            .filter(k => typeof window[k] === 'function').length
  }));
  is(벌.가짓수 >= 90, '  그림이 <b>' + 벌.가짓수 + '가지</b> 그대로 있다');
  is(벌.함수 === 5, '  부르는 자 다섯이 <b>다 살아 있다</b> — ' + 벌.함수 + '/5');
  is(/function baIco\(/.test(ba) && /icoSvg\(/.test(ba),
     '  보장 전·후가 그림을 <b>이름으로</b> 불러 쓴다 (고객 화면은 그대로입니다)');
  is(!/icoWatch\(/.test(ba),
     '  그 화면은 갈아끼우는 자를 <b>안 부른다</b> — 사장님 말씀 「고객에게 보여주는 건 지금 좋으니까 냅두고」');

  console.log('\n[4] 🔌 ★★ <b>다시 켜면 정말 돌아온다</b> — 스위치가 죽은 줄이 아닌가');
  /* 「한 줄만 true 로」 라고 적어 두고 안 켜지면 그 글이 거짓말입니다 (1번).
     켜 보고, <b>끈 자리로 되돌려</b> 둡니다.                           */
  const 켬 = await p.evaluate(() => {
    const mk = () => { const h = document.createElement('div');
      h.className = 'tab-pane on';
      h.innerHTML = '<span class="ci">📊</span><div id="zz">📅 오늘 할 일</div>';
      document.body.appendChild(h); return h; };
    const off = { h: mk() };
    off.슬롯 = icoSlots(off.h); off.앞 = icoLead(off.h);
    off.글 = icoFromEmoji('📊', 20);
    off.h.remove();
    window.ICO_SWAP = true;
    const on = { h: mk() };
    on.슬롯 = icoSlots(on.h); on.앞 = icoLead(on.h);
    on.글 = icoFromEmoji('📊', 20);
    on.svg = !!on.h.querySelector('svg.ico');
    on.남은글 = (document.getElementById('zz') || {}).textContent || '';
    on.h.remove();
    window.ICO_SWAP = false;
    const back = icoFromEmoji('📊', 20);
    return { off: { 글: off.글 }, on: { 슬롯: on.슬롯, 앞: on.앞, 글: on.글, svg: on.svg, 남은글: on.남은글 }, back };
  });
  is(/^<span class="ico-emo">📊<\/span>$/.test(켬.off.글),
     '  꺼 두면 글을 지을 때도 <b>이모지 그대로</b> — 「' + 켬.off.글 + '」');
  is(/^<svg class="ico"/.test(켬.on.글), '  켜면 <b>선 그림</b>이 나온다');
  is(켬.on.슬롯 >= 1 && 켬.on.앞 >= 1 && 켬.on.svg,
     '  ★ 켜면 화면도 <b>갈아 끼운다</b> — 그림 자리 ' + 켬.on.슬롯 + '곳 · 앞머리 ' + 켬.on.앞 + '곳');
  is(/오늘 할 일/.test(켬.on.남은글),
     '  ★ 켜도 <b>나머지 글은 그대로</b> — 「' + 켬.on.남은글.trim() + '」');
  is(/^<span class="ico-emo">📊<\/span>$/.test(켬.back),
     '  ★ 다시 끄면 <b>이모지로 돌아온다</b> — 한 줄이 양쪽을 다 가릅니다');

  console.log('\n[5] 🚫 <b>켜 두었을 때도 안 건드리는 것</b> — 돌아올 자리를 지킵니다');
  /* 판 X151·X155 에서 지킨 약속입니다. 지금은 꺼 두었지만, 사장님이 다시
     켜셨을 때 그때의 조심성이 그대로 있어야 합니다.                    */
  const 손 = await p.evaluate(() => {
    window.ICO_SWAP = true;
    const host = document.createElement('div');
    host.className = 'tab-pane on';
    host.innerHTML =
      '<span class="ci">🫠</span>' +                       /* 표에 없는 이모지 */
      '<span class="ci">🔔 새 소식이 없습니다</span>' +       /* 글이 섞인 자리 */
      '<span class="ci"><b>📊</b></span>' +                 /* 안에 칸이 있는 자리 */
      '<span class="ci">📊</span>';                         /* 바뀌어야 하는 자리 */
    document.body.appendChild(host);
    const n1 = icoSlots(host);
    const 글 = [].slice.call(host.children).map(e => (e.textContent || '').trim());
    const svg = [].slice.call(host.children).map(e => !!e.querySelector('svg.ico'));
    const n2 = icoSlots(host);                              /* 두 번 돌려도 같나 */
    const 글2 = [].slice.call(host.children).map(e => (e.textContent || '').trim());
    const 색 = (() => { const s = host.querySelector('svg.ico');
      return s ? (s.getAttribute('stroke') || '') : ''; })();
    host.remove();

    const h2 = document.createElement('div');
    h2.className = 'tab-pane on';
    h2.innerHTML =
      '<div id="t1">📊 상담현황 — 지금 어디에 몇 분</div>' +
      '<div id="t2">🫠 모르는 그림입니다</div>' +
      '<div id="t3">가운데 📑 는 그대로 둡니다</div>' +
      '<div data-noico><div id="t4">📊 손대지 마십시오</div></div>' +
      '<input id="t5" value="📊 적는 칸">';
    document.body.appendChild(h2);
    const m1 = icoLead(h2);
    const g = (id) => { const e = document.getElementById(id); return e ? (e.textContent || '') : '(없음)'; };
    const sv = (id) => { const e = document.getElementById(id); return !!(e && e.querySelector('svg.ico')); };
    const o = { n1, n2, 글, 글2, svg, 색, m1, t1: g('t1'), t2: g('t2'), t3: g('t3'), t4: g('t4'),
                s1: sv('t1'), s2: sv('t2'), s3: sv('t3'), s4: sv('t4'),
                입력: (document.getElementById('t5') || {}).value || '' };
    o.m2 = icoLead(h2); o.t1b = g('t1');
    h2.remove();
    window.ICO_SWAP = false;
    return o;
  });
  is(손.svg[0] === false && 손.글[0] === '🫠',
     '  <b>표에 없는 이모지는 그대로</b> 둔다 — 「' + 손.글[0] + '」 (1번)');
  is(손.svg[1] === false && /새 소식/.test(손.글[1]),
     '  <b>글이 섞인 자리는 안 건드린다</b>(icoSlots)');
  is(손.svg[2] === false, '  <b>안에 칸이 있으면</b> 안 건드린다');
  is(손.svg[3] === true && 손.n1 === 1 && 손.n2 === 0 && 손.글.join('|') === 손.글2.join('|'),
     '  <b>그림 자리만</b> 바꾸고 <b>두 번 돌려도 같다</b> — 첫 판 ' + 손.n1 + '곳 · 두 번째 ' + 손.n2 + '곳');
  is(손.색 === 'currentColor',
     '  선이 <b>글자색을 따른다</b> — stroke 「' + 손.색 + '」 (색을 박으면 어두운 칸에서 사라집니다)');
  is(손.s1 && /상담현황 — 지금 어디에 몇 분/.test(손.t1),
     '  앞머리만 바꾸고 <b>나머지 글은 그대로</b>');
  is(!손.s2 && /🫠/.test(손.t2), '  앞머리도 <b>표에 없으면 그대로</b> (1번)');
  /* ⚠ <b>되돌려 보고 한 번 다시 만든 줄입니다</b> (8번). 처음에는 정규식
     앞의 ^ 만 떼어 보고 「안 울린다」 고 생각했는데, 그 꼴로는 exec 가
     <b>첫 낱말</b>(「가운데」)에서 멈춰 애초에 버그가 안 생겼습니다 —
     <b>되돌림이 병을 못 만든 것</b>이지 자가 눈을 감은 것이 아니었습니다. */
  is(!손.s3 && /📑/.test(손.t3), '  ★★ <b>글 가운데 이모지는 안 건드린다</b> — 글이 쪼개지면 수를 세는 자리가 틀립니다');
  is(!손.s4 && /📊/.test(손.t4), '  <b>data-noico</b> 를 단 칸과 그 속은 통째로 건너뛴다');
  is(/📊/.test(손.입력), '  <b>적는 칸</b>은 손대지 않는다');
  is(손.m1 === 1 && 손.m2 === 0 && 손.t1 === 손.t1b,
     '  앞머리도 <b>두 번 돌려도 같다</b> — 첫 판 ' + 손.m1 + '곳 · 두 번째 ' + 손.m2 + '곳');

  console.log('\n[6] 🙆 <b>고객에게 보여주는 화면의 문</b>은 닫힌 채로 둔다');
  is(/if \(!document\.getElementById\('dynPane'\)\) return;/.test(ico),
     '  켜더라도 갈아끼우는 자는 <b>#dynPane 이 있는 화면에서만</b> 돈다 (본체)');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' ← ' + errs[0] : ''));

  console.log('\n──────────────────────────────');
  await b.close(); srv.close();
  if (bad) { console.log('✗ 그림 자리 — 고칠 자리 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 본체는 이모지 그대로입니다 — 그림 자리 ' + 돌기.칸 + '곳 · 선 그림 0곳. ' +
              '그림 ' + 벌.가짓수 + '가지는 고객 화면용으로 살려 두었고, 스위치 한 줄로 되살아납니다.');
})();
