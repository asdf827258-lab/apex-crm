/* ══════════════════════════════════════════════════════════════════
   check-know.js — 🧭 <b>「앱이 이미 아는 것」 이 거짓말을 안 하나.</b>

   ── 왜 ───────────────────────────────────────────────────────────
   2026-10-05 · 사장님 말씀 — <b>「구분 잘 지었는데 다시 재구분 지어야할거
   같아 … 이것도 어떤 상황에 쓸지 설명해주고 구분해주면 좋을거 같아,
   각 구분별모두」</b>. 단계마다 가리키는 화면을 다시 묶고, 하나하나에
   <b>구분(g)</b> 과 <b>쓸 때(w)</b> 를 달았습니다.

   이 칸은 고객 앞에서 눌러 여는 자리입니다. 그래서 거짓말하면 바로
   드러납니다 — <b>없는 화면을 가리키거나</b>, <b>이름이 메뉴와 다르거나</b>,
   <b>왜 누르는지 안 적혀 있으면</b>.

   ── 재는 것 ──────────────────────────────────────────────────────
     [1] 칩마다 <b>tab · 구분 · 쓸 때</b> 가 다 있다 (사장님 「각 구분별모두」)
     [2] ★ <b>이름을 표에 또 안 적는다</b> (5번) — 메뉴가 들고 있는 것을
         꺼내 씁니다. 표에 또 적으면 메뉴에서 이름을 고칠 때 표만 옛
         이름으로 남습니다 (실제로 treatpay 가 그랬습니다).
     [3] ★ <b>가리키는 화면이 정말 다 열린다</b> (1번) — 메뉴에 있고,
         눌러서 열립니다. 「갖고 있습니다」 라고 적어 놓고 안 열리면
         고객 앞에서 드러납니다.
     [4] ★ <b>그리는 자리가 하나</b>다 (5번) — 홈과 DB 통합 CRM 이 같은
         함수를 부릅니다. 둘이 각자 그리면 같은 고객에게 다른 것을
         보여 줍니다. 실제로 그랬던 자리입니다.
     [5] 사장님이 콕 집어 말씀하신 것이 <b>그 단계에 있다</b> —
         TA 아홉 · AP 다섯 · PC 둘 · CS 일곱. 그리고 <b>비포&애프터(baba)
         는 어느 단계에도 없다</b>(「모두 삭제해버려」).
     [6] <b>새 CSS·새 class 0</b> · 누르는 것 <b>44px 이상</b> (사장님 계약)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = process.cwd(), PORT = 9122;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const MIME = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml',
  '.png':'image/png','.webmanifest':'application/manifest+json' };
const STUB = fs.readFileSync(path.join(ROOT,'scripts/smoke.js'),'utf8').split('const STUB = `')[1].split('`;')[0];
const srv = http.createServer((q,s)=>{ let p=decodeURIComponent(q.url.split('?')[0]);
  if(p==='/')p='/index.html'; const f=path.join(ROOT,p);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end('');return;}
  s.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
  fs.createReadStream(f).pipe(s); });

/* 사장님이 2026-10-05 에 <b>콕 집어</b> 말씀하신 것. 손으로 적되,
   <b>그 말씀 그대로</b>이고 빠지면 빨간불입니다. 수가 아니라 이름을
   적습니다 — 수만 적으면 다른 것으로 채워도 초록이 됩니다 (8번). */
const 말씀 = {
  TA: ['ta_script','brain','onecmp','interpret','cs_assist','ins_asst','utphoto','mikki_talk','biz_news'],
  AP: ['katalk','ins_asst','mikki_talk','ref_underwrite','med_disclosure'],
  PC: ['bohum','contracts'],
  CS: ['pdel','finance','car_fault','claims','ref_kcd','ref_surgery','ref_hidden']
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:'+PORT)>=0
    ? r.continue() : r.fulfill({status:200,contentType:'application/javascript',body:''}));
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(STUB);
  await p.goto('http://127.0.0.1:'+PORT+'/app/index.html#home',{waitUntil:'domcontentloaded',timeout:90000});
  await p.waitForTimeout(2500);
  await p.evaluate(()=>{ document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
    OS.profile={id:'s',name:'점검',role:'owner',plan:'vip'}; OS.session={user:{id:'s'}};
    OS.cfg={schema_version:'29'}; window.toast=function(){}; });

  const T = await p.evaluate(() => {
    const out = { 단계: [], 모든tab: [] };
    (APEX_STAGE.order || []).forEach(k => {
      const L = (APEX_STAGE.map[k] || {}).know || [];
      L.forEach(x => { if (out.모든tab.indexOf(x.tab) < 0) out.모든tab.push(x.tab); });
      const d = document.createElement('div');
      d.innerHTML = (typeof stKnowHtml === 'function') ? stKnowHtml(L) : '';
      out.단계.push({ k: k, 표: L.map(x => ({ tab:x.tab, g:x.g||'', w:x.w||'', t:x.t||'' })),
        줄: [].slice.call(d.querySelectorAll('button.t-row')).map(x => ({
          이름:(x.querySelector('.nm')||{}).textContent||'',
          쓸때:(x.querySelector('.mt')||{}).textContent||'',
          go:(x.getAttribute('onclick')||'') })),
        메뉴이름: L.map(x => { const it = navItemOf(x.tab); return it ? it.title : ''; }) });
    });
    return out;
  });
  const 모든칩 = T.단계.reduce((a,x)=>a.concat(x.표), []);

  console.log('\n[1] 칩마다 <b>tab · 구분 · 쓸 때</b>가 다 있다 (사장님 「각 구분별모두」)');
  const 빠짐 = 모든칩.filter(x => !(x.tab && x.g && x.w));
  is(빠짐.length === 0, '  칩 <b>' + 모든칩.length + '가지</b> 가운데 빠진 것이 없다'
    + (빠짐.length ? ('\n      ✗ ' + 빠짐.map(x => x.tab + '(' + (x.g?'':'구분 없음 ') + (x.w?'':'쓸 때 없음') + ')').join(' · ')) : ''));
  T.단계.forEach(st => { if (!st.표.length) return;
    const g = [...new Set(st.표.map(x => x.g))];
    is(g.length >= 1, '  <b>' + st.k + '</b> — 칩 ' + st.표.length + '가지가 구분 ' + g.length + '묶음 · ' + g.join(' / ')); });

  console.log('\n[2] ★ <b>이름을 표에 또 안 적는다</b> (5번)');
  const 또적음 = 모든칩.filter(x => x.t);
  is(또적음.length === 0, '  표에 이름이 적힌 칩이 <b>없다</b>'
    + (또적음.length ? (' ← ' + 또적음.map(x => x.tab).join(' · ')) : '') + ' — 메뉴에서 꺼내 씁니다');
  const 이름어긋 = [];
  T.단계.forEach(st => st.줄.forEach((r,i) => { if (r.이름 !== st.메뉴이름[i]) 이름어긋.push(st.k+':'+r.이름); }));
  is(이름어긋.length === 0, '  화면에 선 이름이 <b>메뉴와 글자까지 같다</b>'
    + (이름어긋.length ? (' ← ' + 이름어긋.join(' · ')) : ''));

  console.log('\n[3] ★ <b>가리키는 화면이 정말 다 열린다</b> (1번)');
  const 표대로 = T.단계.filter(s => s.표.length !== s.줄.length);
  is(표대로.length === 0, '  단계마다 <b>표만큼 줄이 선다</b>'
    + (표대로.length ? (' ← ' + 표대로.map(s => s.k+' 표'+s.표.length+'/화면'+s.줄.length).join(' · ')) : ''));
  const 안열림 = [];
  for (const t of T.모든tab) {
    try { await p.evaluate(tb => go(tb), t); await p.waitForTimeout(170);
      const ok = await p.evaluate(() => { const d = document.getElementById('dynPane');
        return !!(d && (d.innerText||'').trim().length > 20)
            || !!document.querySelector('.crm-mode,.apexmap-mode,iframe'); });
      if (!ok) 안열림.push(t);
    } catch (e) { 안열림.push(t + '(터짐)'); }
  }
  is(안열림.length === 0, '  가리키는 화면 <b>' + T.모든tab.length + '곳이 다 열린다</b>'
    + (안열림.length ? (' ← 안 열림 ' + 안열림.join(' · ')) : ''));

  console.log('\n[4] ★ <b>그리는 자리가 하나</b>다 (5번)');
  const SRC = fs.readFileSync(path.join(ROOT,'app/index.html'),'utf8');
  is(/function stKnowHtml\(/.test(SRC), '  그리는 함수가 <b>stKnowHtml 하나</b>다');
  const 부름 = (SRC.match(/stKnowHtml\(/g) || []).length;
  is(부름 >= 3, '  <b>홈과 DB 통합 CRM 이 그것을 부른다</b> — ' + 부름 + '곳 (선언 1 + 부르는 자리 2)');
  const SRCC = SRC.replace(/\/\*[\s\S]*?\*\//g, ' ');
  is(!/t-chips[\s\S]{0,200}know/.test(SRCC),
     '  <b>옛 칩 그리기가 안 남았다</b> — 두 벌이 되면 한쪽만 늙습니다');

  console.log('\n[5] ★ 사장님이 <b>콕 집어</b> 말씀하신 것이 그 단계에 있다');
  Object.keys(말씀).forEach(k => {
    const st = T.단계.filter(x => x.k === k)[0];
    const 있는것 = st ? st.표.map(x => x.tab) : [];
    const 빠진 = 말씀[k].filter(t => 있는것.indexOf(t) < 0);
    is(빠진.length === 0, '  <b>' + k + '</b> — 말씀하신 ' + 말씀[k].length + '가지가 다 있다'
      + (빠진.length ? (' ← 빠짐 ' + 빠진.join(' · ')) : ''));
  });
  const baba = 모든칩.filter(x => x.tab === 'baba');
  is(baba.length === 0, '  ★ <b>비포&애프터(baba)가 어느 단계에도 없다</b> — 사장님 「모두 삭제해버려」');

  console.log('\n[6] 새 CSS·새 class 0 · 누르는 것 44px');
  const i0 = SRC.indexOf('function stKnowHtml'), i1 = SRC.indexOf('function hmJudgeHtml');
  const BLK = (i0 >= 0 && i1 > i0) ? SRC.slice(i0, i1).replace(/\/\*[\s\S]*?\*\//g,' ') : '';
  is(BLK.length > 300, '  그리는 묶음을 찾았다 — ' + BLK.length + '자');
  is(!/#[0-9a-fA-F]{3,8}\b/.test(BLK), '  ★ <b>hex 를 한 자도 안 적었다</b>');
  const 쓴class = [...new Set((BLK.match(/class=\\?"([^"\\]+)/g) || []).join(' ')
    .replace(/class=\\?"/g,' ').split(/\s+/).filter(Boolean))];
  const UI = fs.readFileSync(path.join(ROOT,'app/ui.css'),'utf8');
  const 없는class = 쓴class.filter(c => UI.indexOf('.' + c) < 0);
  is(없는class.length === 0, '  ★ <b>ui.css 이름만 썼다</b> — ' + 쓴class.join(' · ')
    + (없는class.length ? (' ← 없는 것 ' + 없는class.join(' · ')) : ''));
  await p.evaluate(() => go('home'));
  await p.waitForTimeout(600);
  const 작은것 = await p.evaluate(() => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:0;top:0;width:390px;visibility:hidden';
    d.innerHTML = stKnowHtml((APEX_STAGE.map.CS || {}).know || []);
    document.body.appendChild(d);
    const n = [].slice.call(d.querySelectorAll('button.t-row'))
      .filter(x => x.getBoundingClientRect().height < 44).length;
    const all = d.querySelectorAll('button.t-row').length;
    d.remove(); return { n: n, all: all };
  });
  is(작은것.n === 0 && 작은것.all > 0,
     '  ★ 누르는 줄이 <b>44px 아래가 없다</b> — ' + 작은것.all + '줄 중 ' + 작은것.n + '개');

  console.log('\n[7] 조용한가');
  is(errs.length === 0, '  콘솔 오류가 없다' + (errs.length ? ' — ' + errs[0] : ''));

  console.log('\n──────────────────────────────');
  await b.close(); srv.close();
  if (bad) { console.log('✗ ' + bad + '가지 — 가리킨 자리가 안 열리면 고객 앞에서 드러납니다.'); process.exit(1); }
  console.log('✓ 단계마다 「무엇을 언제 쓰는지」 가 서고, 가리키는 화면이 다 열립니다.');
})().catch(e => { console.error('터짐: ' + e.message); process.exit(1); });
