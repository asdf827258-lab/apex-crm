/* 📸 <b>시키신 말씀 ↔ 지금 화면</b> — 하나씩 재고 찍어 나란히 놓습니다.
   사장님 말씀 2026-11-16 「제발 내가 말한것들을, 놓치지 말고 이행 되었는지
   내가 원한 결과 값이 나왔는지 <b>일일히 다 확인하고 이미지로 보여주고 대조</b>해줘」.

   ★ 점검이 아닙니다 — CI 에 안 넣습니다. <b>사장님께 보여 드리는 자</b>입니다.
     점검은 제가 지키려고 만든 것만 보지만, 이 자는 <b>사장님 말씀을 머리글로</b>
     두고 그 옆에 지금 화면을 붙입니다 (0-1번).
   ★ <b>재서 적습니다.</b> ✓ 는 잰 값이 약속과 맞을 때만 붙습니다 — 지어내지
     않습니다 (1번). 못 재는 것은 「못 쟀습니다」 라고 적습니다.
   ★ 쓰는 법 — node scripts/matchup.js [홈|고객|전부]                      */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const OUT  = process.env.MATCHUP_OUT || path.join(ROOT, '.matchup');
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
               '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
               '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

/* ── 로그인 흉내 — 점검들이 쓰는 그 자리를 그대로 (5번) ───────────── */
const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '윤시현', role: 'owner', active: true, plan: 'vip', team_id: 't1' };
  OS.cfg = OS.cfg || {}; OS.cfg.schema_version = '47';
  ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients']
    .forEach(k => { window[k] = function () {}; });
  window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function () {}; window.setupDone = () => true;
  const chain = v => { const o = { then: function (f) { try { f(v); } catch (e) {} return o; },
                                   catch: function () { return o; } };
    ['eq','neq','select','order','limit','in','gte','lte','is','not','or','filter','ilike','like','range']
      .forEach(k => { o[k] = function () { return o; }; });
    o.single = () => chain({ data: null }); o.maybeSingle = () => chain({ data: null }); return o; };
  window.osClient = function () { return { from: function () { return {
      select: () => chain({ data: [], count: 0 }), update: () => chain({}), insert: () => chain({}),
      upsert: () => chain({}), delete: () => chain({}) }; } }; };
  OSC.loaded = true; OSC.busy = false; OSC.err = '';
  OSC.list = [{ id:'c1', advisor_id:'me', name_masked:'홍*동', created_at:'2026-09-03' }];
  CM.loaded = true; CM.meta = {};
  AR.loaded = true; AR.busy = ''; AR.cliRows = [];
  AR.db = [{ id:'d1', who:'me', name:'홍길동', region:'순천', src:'일반', stage:'AP', days:3, n:2, res:'상담' },
           { id:'d2', who:'me', name:'홍길순', region:'광주', src:'소개', stage:'TA', days:9, n:1, res:'' }];
  go('home');
};

/* ══ 대조할 말씀 — <b>사장님이 하신 말 그대로</b>를 머리글로 둡니다 ══════ */
const 홈 = [
  { 번호:'X187', 말씀:'지금할것을 맨위로 올려주고',
    원한것:'「지금 할 것」 이 첫 화면 안에서 끝난다',
    자리:'#hmJobHost',
    재기:() => { const p=document.getElementById('dynPane'), w=document.getElementById('hmJobHost');
      if(!p||!w) return null;
      const t=p.getBoundingClientRect().top, b=w.getBoundingClientRect();
      const 끝=Math.round(b.top-t+b.height), 보임=Math.round(window.innerHeight-t);
      return { ok:끝<=보임, 값:'아랫변 '+끝+'px / 보이는 높이 '+보임+'px' }; } },

  { 번호:'X219', 말씀:'지금 할 것 — 위에 팀원들 누구꺼인지 선택할수 있도록',
    원한것:'팀원 고르개가 「지금 할 것」 바로 위에 선다',
    자리:'#hmWhoHost',
    재기:() => { const w=document.getElementById('hmWhoHost'), j=document.getElementById('hmJobHost');
      if(!w||!j) return null;
      const a=w.getBoundingClientRect(), b=j.getBoundingClientRect();
      return { ok:a.top<b.top && a.height>0, 값:'고르개 y'+Math.round(a.top)+' · 지금 할 것 y'+Math.round(b.top) }; } },

  { 번호:'오늘①', 말씀:'오늘 지역동선 지도가 안 뜬다 — 고쳐줘',
    원한것:'🗺️ 지역 동선 칸이 홈에 선다',
    자리:'#hmRtHost',
    재기:() => { const e=document.getElementById('hmRtHost'); if(!e) return null;
      const h=Math.round(e.getBoundingClientRect().height);
      return { ok:h>60, 값:'키 '+h+'px · '+(e.innerText||'').replace(/\s+/g,' ').trim().slice(0,34) }; } },

  { 번호:'오늘②', 말씀:'도움말을 스포트라이트 투어로 — 그 자리만 밝히고',
    원한것:'🔦 투어 단추가 서고 눌러서 돈다',
    자리:'.hm-tour-b,[onclick*="hmTour"]',
    재기:() => { const b=document.querySelector('[onclick*="hmTour"]');
      return { ok:!!b && typeof hmTourOpen==='function',
               값:(b?('단추 있음 — '+(b.textContent||'').trim().slice(0,18)):'단추 없음')+
                  ' · 함수 '+(typeof hmTourOpen==='function'?'있음':'없음') }; } },

  { 번호:'오늘③', 말씀:'오늘에서 캘린더를 쉽게',
    원한것:'📆 이번 주 칸이 홈에 서고 ＋일정으로 그 자리에서 넣는다',
    자리:'#hmWkHost',
    재기:() => { const e=document.getElementById('hmWkHost'); if(!e) return null;
      const T=(document.getElementById('dynPane')||{}).innerText||'';
      return { ok:/이번 주/.test(T), 값:'칸 있음 · 「이번 주」 '+((T.match(/이번 주/g)||[]).length)+'곳' }; } },

  { 번호:'오늘④', 말씀:'아침 미션 — 위로 · TA 대본 · 며칠째 경고',
    원한것:'🌅 아침 미션이 「지금 할 것」 위에 서고, 며칠째인지 말해 준다',
    자리:'#hmMsTop',
    재기:() => { const e=document.getElementById('hmMsTop'); if(!e) return null;
      const r=e.getBoundingClientRect(), p=document.getElementById('dynPane').getBoundingClientRect();
      const T=(e.innerText||'');
      return { ok:r.height>0 && r.top-p.top<500,
               값:'y'+Math.round(r.top-p.top)+' · 키 '+Math.round(r.height)+'px · '+
                  (/0\/6|\d\/6/.test(T)?'머리글이 어디까지 왔는지 말함':'머리글 비어 있음') }; } },

  { 번호:'오늘⑤', 말씀:'고객의 이름 각자 개인별로 보여주지만 * 이렇게 가리는게 없도록해',
    원한것:'홈은 실명이 기본이고, 가릴 단추(🙈)가 따로 선다',
    자리:'#hmNmBtn',
    재기:() => { const b=document.getElementById('hmNmBtn');
      const T=(document.getElementById('dynPane')||{}).innerText||'';
      const 가린=(T.match(/[가-힣]\*[가-힣]?/g)||[]).length;
      return { ok:!!b && 가린===0, 값:(b?'🙈 단추 있음':'🙈 단추 없음')+' · 홈에 가린 이름 '+가린+'곳' }; } },

  { 번호:'X456', 말씀:'홈이 한 화면에 들게 (X03) + 칸마다 첫 화면에 보이게',
    원한것:'🗜 짧게를 누르면 홈이 한 화면 가까이 줄고, 다시 누르면 돌아온다',
    자리:'#hmShortBtn',
    재기:() => { const b=document.getElementById('hmShortBtn'); if(!b) return null;
      const 전=Math.round(document.getElementById('dynPane').scrollHeight);
      try{ localStorage.setItem('apex_hm_short_v1','1'); hmShortApply(); }catch(e){}
      const 후=Math.round(document.getElementById('dynPane').scrollHeight);
      try{ localStorage.setItem('apex_hm_short_v1','0'); hmShortApply(); }catch(e){}
      return { ok:후>0 && 후<전*0.6, 값:전+'px → '+후+'px ('+(후/844).toFixed(2)+'화면)' }; } },

  { 번호:'X459', 말씀:'오늘 부분이 하나도 안되어있는데 (2026-11-16)',
    원한것:'켜자마자 시키신 것이 다 보인다',
    자리:'#dynPane',
    재기:() => { const p=document.getElementById('dynPane');
      const 접힌=[].slice.call(p.querySelectorAll('.hm-fold-h'))
        .filter(h=>h.getAttribute('aria-expanded')==='false').length;
      return { ok:false,
               값:'접힌 칸 '+접힌+'개 — 켜면 한 줄로 접혀 있습니다. 펴면 「지금 할 것」 이 '+
                  '첫 화면 밖으로 밀려(X187 과 부딪힘) 사장님이 고르셔야 합니다' }; } }
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 430, height: 844 }, deviceScaleFactor: 2 });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                  ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => typeof renderHome === 'function', { timeout: 60000 });
  await pg.evaluate(SEED);
  await pg.waitForTimeout(3000);
  const 판 = await pg.evaluate(() => APP_BUILD);

  const 줄 = [];
  for (const it of 홈) {
    let r = null;
    try { r = await pg.evaluate(it.재기); } catch (e) { r = { ok:false, 값:'재다가 터졌습니다 — ' + String(e).slice(0,50) }; }
    let 그림 = '';
    try {
      const el = await pg.$(it.자리);
      if (el) {
        await el.scrollIntoViewIfNeeded();
        await pg.waitForTimeout(250);
        const f = path.join(OUT, 'm-' + it.번호.replace(/[^\w가-힣]/g,'') + '.png');
        await el.screenshot({ path: f });
        그림 = 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
      }
    } catch (e) {}
    줄.push({ ...it, 결과: r, 그림 });
    console.log((r === null ? '· 못 쟀습니다 ' : (r.ok ? '✓ ' : '✗ ')) +
                it.번호.padEnd(7) + (r ? r.값 : '') );
  }
  await pg.evaluate(() => { try { localStorage.setItem('apex_hm_short_v1','0'); hmShortApply(); } catch(e){} });

  /* ── 📏 <b>사람이 늘면 어떻게 되나</b> — 점검이 헛초록이던 까닭 ──────────
     check-hmms 는 견본에 <b>걸 분이 0명</b>이라 늘 초록이었습니다. 사장님
     화면은 <b>늘 1명 이상</b>입니다 — 실제로 일어나는 자리에서 재야 합니다 (8번). */
  const 사람별 = [];
  for (const n of [0, 1, 2, 5, 10]) {
    /* ⚠ <b>창을 새로 엽니다.</b> 한 창에서 이어 재면 앞의 사람이 남아 0명 값이
         1,054px 로 나왔습니다(홀로 재면 605px) — 틀린 수를 보여 드릴 뻔했습니다 (1번). */
    const c2 = await br.newContext({ viewport: { width: 430, height: 844 } });
    await c2.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                   ? r.continue() : r.abort());
    const p2 = await c2.newPage();
    await p2.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
    await p2.waitForFunction(() => typeof renderHome === 'function', { timeout: 60000 });
    await p2.evaluate(SEED);
    await p2.waitForTimeout(1800);
    await p2.evaluate((n) => {
      const 단계 = ['TA','AP','PC','CS'];
      AR.db = Array.from({ length: n }, (_, i) => ({ id:'d'+i, who:'me', name:'홍길'+i, region:'순천',
        src:'일반', stage:단계[i%4], days:3+i, n:1, res:'' }));
      go('home');
    }, n);
    await p2.waitForTimeout(1800);
    const m = await p2.evaluate(() => {
      const p = document.getElementById('dynPane'), w = document.getElementById('hmJobHost');
      if (!p) return null;
      const t = p.getBoundingClientRect().top, 보임 = Math.round(window.innerHeight - t);
      if (!w) return { 보임, 끝:-1 };
      const b = w.getBoundingClientRect();
      return { 보임, 끝: Math.round(b.top - t + b.height) };
    });
    사람별.push({ n, ...m });
    await c2.close();
  }

  /* ── 대조 장을 그립니다 ─────────────────────────────────────── */
  const esc = s => (''+s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const 된것 = 줄.filter(x => x.결과 && x.결과.ok).length;
  const html = `<!doctype html><html lang="ko"><meta charset="utf-8">
<style>
 *{box-sizing:border-box} body{margin:0;background:#F2F4F6;font:15px/1.6 -apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#191F28}
 .wrap{width:1120px;margin:0 auto;padding:26px}
 h1{font-size:25px;margin:0 0 4px} .sub{color:#636C78;font-size:14px;margin-bottom:18px}
 .sum{background:#fff;border:1px solid #E5E8EB;border-radius:14px;padding:14px 18px;margin-bottom:16px;font-weight:700}
 .row{background:#fff;border:1px solid #E5E8EB;border-radius:14px;margin-bottom:14px;overflow:hidden;display:flex}
 .row.ng{border-color:#FCA5A5}
 .L{flex:1;min-width:0;padding:15px 18px}
 .R{width:330px;flex:none;border-left:1px solid #E5E8EB;background:#F7F9FA;padding:10px;display:flex;align-items:flex-start;justify-content:center}
 .R img{max-width:100%;max-height:430px;object-fit:contain;object-position:top;border-radius:9px;border:1px solid #E5E8EB;background:#fff}
 .no{color:#8B94A3;font-size:13px;padding:22px 8px}
 .tag{display:inline-block;font-size:12px;font-weight:800;padding:2px 9px;border-radius:999px;background:#EBF3FF;color:#1A56DB;margin-right:8px}
 .say{font-size:17px;font-weight:800;margin:6px 0 10px}
 .say:before{content:'「'} .say:after{content:'」'}
 .k{font-size:13px;color:#636C78;margin-top:8px}
 .k b{color:#191F28}
 .v{font-size:14px;margin-top:3px}
 .ok{color:#059669;font-weight:800} .ng2{color:#DC2626;font-weight:800}
 .ft{color:#8B94A3;font-size:13px;margin-top:18px;line-height:1.7}
</style><div class="wrap">
<h1>📸 시키신 말씀 ↔ 지금 화면</h1>
<div class="sub">오늘(홈) 화면 · 판 ${esc(판)} · ${new Date().toLocaleString('ko-KR')} · 폰 430×844 로 재고 찍었습니다</div>
<div class="sum">${홈.length}가지 중 <span class="ok">${된것}가지 맞음</span> · <span class="ng2">${홈.length-된것}가지 안 맞음</span>
 &nbsp;—&nbsp; <span style="font-weight:400;color:#636C78">✓ 는 잰 값이 약속과 맞을 때만 붙습니다. 지어내지 않습니다.</span></div>
${줄.map(x => `<div class="row${x.결과 && x.결과.ok ? '' : ' ng'}">
 <div class="L">
  <span class="tag">${esc(x.번호)}</span><span style="font-size:13px;color:#8B94A3">사장님 말씀</span>
  <div class="say">${esc(x.말씀)}</div>
  <div class="k"><b>원하신 결과</b></div><div class="v">${esc(x.원한것)}</div>
  <div class="k"><b>지금 재어 보니</b></div>
  <div class="v ${x.결과 && x.결과.ok ? 'ok' : 'ng2'}">${x.결과 && x.결과.ok ? '✓ 됩니다' : '✗ 아직입니다'} — ${esc(x.결과 ? x.결과.값 : '못 쟀습니다')}</div>
 </div>
 <div class="R">${x.그림 ? `<img src="${x.그림}">` : '<div class="no">그 자리를 못 찍었습니다</div>'}</div>
</div>`).join('')}
<div class="sum" style="margin-top:22px">📏 왜 「지금 할 것」 이 첫 화면을 넘는가 — <span style="font-weight:400;color:#636C78">오늘 걸 분 수를 바꿔 가며 재었습니다</span></div>
<div class="row"><div class="L" style="width:100%">
<table style="width:100%;border-collapse:collapse;font-size:14px">
<tr style="background:#F7F9FA"><th style="text-align:left;padding:7px 10px;border-bottom:1px solid #E5E8EB">오늘 걸 분</th>
<th style="text-align:right;padding:7px 10px;border-bottom:1px solid #E5E8EB">「지금 할 것」 아랫변</th>
<th style="text-align:right;padding:7px 10px;border-bottom:1px solid #E5E8EB">첫 화면</th>
<th style="text-align:center;padding:7px 10px;border-bottom:1px solid #E5E8EB"> </th></tr>
${사람별.map(x => { const ok = x.끝 > 0 && x.끝 <= x.보임; return `<tr>
<td style="padding:7px 10px;border-bottom:1px solid #F1F3F5">${x.n}명</td>
<td style="padding:7px 10px;text-align:right;border-bottom:1px solid #F1F3F5"><b>${x.끝}px</b></td>
<td style="padding:7px 10px;text-align:right;border-bottom:1px solid #F1F3F5;color:#8B94A3">${x.보임}px</td>
<td style="padding:7px 10px;text-align:center;border-bottom:1px solid #F1F3F5" class="${ok?'ok':'ng2'}">${ok?'✓ 안':'✗ 밖'}</td></tr>`; }).join('')}
</table>
<div class="k" style="margin-top:12px"><b>이것이 「오늘 부분이 하나도 안되어있는데」 의 뿌리입니다.</b></div>
<div class="v">점검(check-hmms)이 초록이었던 것은 <b>그 자의 견본에 걸 분이 0명</b>이기 때문입니다.
사장님 화면은 늘 1명 이상이라, <b>「지금할것을 맨위로」 가 실제로는 한 번도 지켜진 적이 없습니다.</b>
그 아래 것(아침 미션 속 · 지역동선 · 캘린더)은 더 멀어집니다.</div>
</div></div>
<div class="ft">★ 이 장은 <b>점검이 아니라 보고</b>입니다 — CI 에 안 넣습니다. 점검은 제가 지키려고 만든 것만 보지만,
이 장은 <b>사장님 말씀을 머리글로</b> 두고 그 옆에 지금 화면을 붙입니다.<br>
★ 쓰는 법 — <code>node scripts/matchup.js</code></div>
</div></html>`;
  const hf = path.join(OUT, 'matchup.html');
  fs.writeFileSync(hf, html);
  /* ⚠ 바깥을 막은 창에서는 file:// 도 막힙니다 — 보고 장은 <b>안 막은 새 창</b>에서 그립니다 */
  const ctx2 = await br.newContext({ viewport: { width: 1120, height: 1400 }, deviceScaleFactor: 2 });
  const pg2 = await ctx2.newPage();
  await pg2.goto('file://' + hf, { waitUntil: 'load' });
  await pg2.waitForTimeout(600);
  const png = path.join(OUT, '대조-홈.png');
  await pg2.screenshot({ path: png, fullPage: true });
  await ctx2.close();
  console.log('\n📸 ' + png);
  console.log('   ' + 홈.length + '가지 중 ' + 된것 + '가지 맞음 · ' + (홈.length - 된것) + '가지 안 맞음');
  await br.close(); srv.close();
})();
