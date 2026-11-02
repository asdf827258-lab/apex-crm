/* ══════════════════════════════════════════════════════════════════════
   🔍 <b>검색할 때 안 깨지나</b> — 손가락 · 글씨 · 이상한 글 (판 X261)

   사장님 말씀 (2026-10-30) — 「다시 걸어주고 <b>검색할때 깨지는거 없도록해</b>」.

   ⚠ <b>이 자를 세우며 찾은 것</b> — 홈의 「고객 찾기」 칸이 <b>33px</b> 였습니다.
     누르는 자리의 바닥은 <b>44px</b> 입니다(판 X146·X147 사장님 손가락).
     글씨는 멀쩡했고(13px · 대비 16.56) 깨지는 글도 없었습니다 — <b>손가락
     하나만</b> 어긋나 있었습니다. 그것을 재는 자가 한 곳도 없었습니다.

   ★ 묻는 것 넷 —
     ⓐ 검색 칸이 <b>44px 위</b>인가 (손가락 바닥)
     ⓑ 글자가 <b>13px 위</b>이고 바탕과 <b>대비 4.5 위</b>인가 (읽히나 ·
        「검색창 글씨가 안 보이는 자리」 로 전에 데인 적이 있습니다)
     ⓒ <b>이상한 글을 넣어도</b> 안 깨지나 — 한글·초성·번호·공백·괄호·
        정규식 기호·HTML 태그·120자·이모지·SQL 주석 기호 서른 가지.
        옆으로 새지 않고, 화면이 비지 않고, 넣은 글이 남고, 콘솔이 조용한가
     ⓓ 날글이 <b>글자 그대로</b> 안 찍히나 — `<b>x</b>` 를 넣어도 굵어지면
        안 됩니다 (넣은 글이 화면을 흔드는 자리입니다)

   ★ <b>어느 칸을 재는지 못 박지 않습니다</b> — 화면을 돌며 보이는 검색 칸을
     <b>찾아서</b> 잽니다. 이름을 박아 두면 새 검색 칸이 생겼을 때 이 자가
     조용합니다 (8번 「안 울리는 알람은 알람이 아니다」).
   ★ 바깥·사장님 서버를 <b>한 번도 안 부릅니다</b> (7번 · check-netblock).
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = path.resolve(__dirname, '..'), PORT = 9143;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
               '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const q = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (q.indexOf('/.netlify/functions/') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{}'); return;
  }
  const f = path.join(ROOT, q);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    rs.writeHead(404); rs.end('no'); return;
  }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* 견본은 <b>홍길동</b> 집안 (3번) */
const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '윤시현', role: 'owner', active: true, plan: 'vip', team_id: 't1' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function () {}; window.setupDone = function () { return true; };
  const chain = v => { const o = { then: function (f) { try { f(v); } catch (e) {} return o; },
                                   catch: function () { return o; } };
    ['eq','neq','select','order','limit','in','gte','lte','is','not','or','filter',
     'ilike','like','range','contains','overlaps'].forEach(k => { o[k] = function () { return o; }; });
    o.single = function () { return chain({ data: null }); };
    o.maybeSingle = function () { return chain({ data: null }); }; return o; };
  window.osClient = function () { return { from: function () { return {
      select: function () { return chain({ data: [], count: 0 }); },
      update: function () { return chain({}); }, insert: function () { return chain({}); },
      upsert: function () { return chain({}); }, delete: function () { return chain({}); } }; } }; };
  OSC.loaded = true; OSC.busy = false; OSC.err = '';
  OSC.list = [{ id:'k1', name:'홍길동', phone:'010-0000-3456', region:'순천', memo:'' },
              { id:'k2', name:'홍길순', phone:'010-0000-7890', region:'광주', memo:'' }];
  CM.loaded = true; CM.meta = {}; AR.loaded = true; AR.busy = ''; AR.cliRows = [];
  AR.db = [{ id:'d1', who:'me', name:'홍길동', region:'순천', src:'일반', stage:'AP', days:12, n:1, res:'부재' }];
  go('home');
};

/* 두드려 볼 글 — <b>서른 가지</b>. 사람이 칠 만한 것과, 코드를 흔드는 것 */
const 글들 = ['홍','홍길동','ㅎㄱㄷ','3456','순천','   홍  ','(','[',')','*','+','?','.*','$^',
  '"',"'",'<b>x</b>','&','가'.repeat(120),'ㅏ','🙂','a(b','[0-9]+','\\','%','_','--','/*','0','ㄱ'];

/* 글자색과 바탕의 대비 — 읽히는지 보는 자 */
const 재다 = () => {
  const lum = (c) => { const m = (c || '').match(/[\d.]+/g) || [0, 0, 0];
    const f = [+m[0], +m[1], +m[2]].map(v => { v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return .2126 * f[0] + .7152 * f[1] + .0722 * f[2]; };
  const 바탕 = (e) => { let x = e; for (let i = 0; i < 8 && x; i++) {
    const c = getComputedStyle(x).backgroundColor;
    if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c; x = x.parentElement; }
    return 'rgb(255,255,255)'; };
  const out = [];
  document.querySelectorAll('input[type="search"],input[placeholder*="찾"],input[placeholder*="검색"]')
    .forEach(e => {
      const r = e.getBoundingClientRect(); if (r.height <= 0 || r.width <= 0) return;
      const cs = getComputedStyle(e);
      const 글 = lum(cs.color), 바 = lum(바탕(e));
      out.push({ id: e.id || '(이름없음)',
        키: Math.round(r.height), 글자: Math.round(parseFloat(cs.fontSize) * 10) / 10,
        대비: Math.round(((Math.max(글, 바) + 0.05) / (Math.min(글, 바) + 0.05)) * 100) / 100 });
    });
  return out;
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const 바깥 = [], 오류 = [];
  const 열기 = async (주소, w, h) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    /* ★ 막을 것은 <b>사장님 서버</b>뿐입니다 — supabase.co(그 프로젝트 주소) ·
       /.netlify/functions/ · 카카오 길찾기. 그 셋은 적어 두고 끊습니다 (7번).
       ⚠ 처음에 <b>바깥을 다 막았다가</b> [3] 이 빨간불이 났습니다 — CRM 은
         @supabase/supabase-js <b>라이브러리 파일</b>을 CDN 에서 받아야 뜨고,
         그것까지 끊으니 화면이 아예 안 섰습니다. 그것은 「사장님 서버를
         부르는 것」 이 아닙니다. <b>자가 아니라 제 그물</b>을 좁혔습니다 (8번). */
    /* ★ 글꼴은 <b>집안 꼴</b>로 — check-netblock 은 `.route('**://**'` 를 보고
       「바깥을 막는 자」 로 셉니다. 다른 글꼴로 적으면 막고 있는데도
       <b>안 막는 자</b>로 세어 눈금이 늘어납니다. 눈금을 올리지 않고
       제 글꼴을 맞춥니다 (0-1번 · 5번).                                 */
    await ctx.route('**://**', r => {
      const u = r.request().url();
      if (u.startsWith('http://127.0.0.1:' + PORT)) return r.continue();
      if (/supabase\.co|\.netlify\/functions|dapi\.kakao/.test(u)) {
        /* ★ <b>적어 두고, 빈 답을 곧바로</b> 줍니다 (7번 · check-netblock).
           끊어만 두면 CRM 이 자료를 못 받아 띠가 아예 안 서고, 그러면
           「찾기 칸이 0개」 라는 <b>헛 빨간불</b>이 됩니다 — 자가 아니라
           제 그물 탓입니다 (8번). 빈 답이면 띠는 서고 줄만 없습니다. */
        바깥.push(u.slice(0, 60));
        return r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
      return r.continue();
    });
    const p = await ctx.newPage();
    p.on('pageerror', e => 오류.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + 주소, { waitUntil: 'domcontentloaded', timeout: 90000 });
    return { ctx, p };
  };
  /* 한 칸을 서른 가지 글로 두드린다 */
  const 두드리기 = async (p, id) => {
    const 깨짐 = [];
    for (const g of 글들) {
      const r = await p.evaluate(async ({ id, g }) => {
        const el = document.getElementById(id); if (!el) return { no: 1 };
        el.focus(); el.value = g;
        ['input', 'keyup', 'change'].forEach(ev => {
          try { el.dispatchEvent(new Event(ev, { bubbles: true })); } catch (e) {} });
        await new Promise(r => setTimeout(r, 130));
        const de = document.documentElement;
        return { 넘침: Math.round(de.scrollWidth - window.innerWidth),
                 빈: (document.body.innerText || '').trim().length < 40,
                 값: el.value === g,
                 /* ⓓ 날글이 <b>살아서</b> 찍혔나 — 넣은 태그가 굵어지면 안 됩니다 */
                 날글: /<b>x<\/b>/.test(document.body.innerHTML) };
      }, { id, g });
      if (r.no) { 깨짐.push('칸이 사라짐(「' + g.slice(0, 8) + '」)'); break; }
      if (r.넘침 > 2) 깨짐.push('「' + g.slice(0, 8) + '」 옆으로 ' + r.넘침 + 'px');
      if (r.빈) 깨짐.push('「' + g.slice(0, 8) + '」 화면이 빔');
      if (!r.값) 깨짐.push('「' + g.slice(0, 8) + '」 넣은 글이 안 남음');
      if (r.날글) 깨짐.push('「' + g.slice(0, 8) + '」 날글이 살아서 찍힘');
    }
    return 깨짐;
  };

  /* ── 본체 — 홈의 접이를 다 펴서 숨은 검색 칸까지 꺼냅니다 ─────── */
  head('[1] 🏠 <b>본체 — 검색 칸이 손가락에 닿고 읽히나</b>');
  const A = await 열기('/app/index.html', 390, 844);
  await A.p.waitForFunction(() => typeof renderHome === 'function' && typeof go === 'function',
    { timeout: 60000 });
  await A.p.evaluate(SEED);
  await A.p.waitForTimeout(2200);
  /* ★ 접힌 것을 <b>펴야</b> 보입니다 — 안 펴면 「고객 찾기」 를 못 보고
     그냥 초록이 됩니다(실제로 처음에 그래서 33px 를 놓쳤습니다 · 8번). */
  const 편 = await A.p.evaluate(() => { let n = 0;
    document.querySelectorAll('.hm-fold:not(.on)>.hm-fold-h').forEach(h => { try { h.click(); n++; } catch (e) {} });
    return n; });
  await A.p.waitForTimeout(1200);
  const 칸들 = await A.p.evaluate(재다);
  is(칸들.length >= 2,
     '  접이 ' + 편 + '개를 펴니 검색 칸이 <b>' + 칸들.length + '개</b> 보인다 — ' +
     칸들.map(x => x.id).join(' · '));
  칸들.forEach(x => {
    is(x.키 >= 44, '  ' + x.id + ' — 칸 키 <b>' + x.키 + 'px</b> (손가락 바닥 44px · 판 X146·X147)');
    is(x.글자 >= 13, '  ' + x.id + ' — 글자 <b>' + x.글자 + 'px</b> (바닥 13px)');
    is(x.대비 >= 4.5, '  ' + x.id + ' — 바탕과 대비 <b>' + x.대비 + '</b> (4.5 위라야 읽힙니다)');
  });

  head('[2] ⌨️ <b>이상한 글을 넣어도 안 깨지나</b> — 서른 가지');
  for (const x of 칸들) {
    if (x.id === '(이름없음)') { console.log('  · 이름 없는 칸은 못 집습니다 (건너뜀)'); continue; }
    const 깨 = await 두드리기(A.p, x.id);
    is(깨.length === 0, '  ' + x.id + ' — 글 ' + 글들.length + '가지' +
       (깨.length ? (' ⚠ ' + 깨.slice(0, 3).join(' / ')) : ' 다 멀쩡'));
  }
  await A.ctx.close();

  /* ── CRM — 「찾기」 칸 ───────────────────────────────────────── */
  /* ══ [3] 🗄️ <b>DB 통합 CRM 의 「찾기」 — 못 쟀습니다</b> ═══════════════
     ⚠⚠ <b>여기서 제가 두 번 헛디뎠습니다.</b>
       ① 처음에 바깥을 다 막아 CRM 이 라이브러리를 못 받아 화면이 안 섰습니다.
       ② 그물을 좁혀 빈 답을 주었는데도 <b>0개</b>였습니다. 까닭을 재어 보니
          그 칸은 <b>로그인 문 뒤에 있어 0×0</b> 입니다 — DOM 에는 있지만
          화면에는 없습니다.
     ★★ 그 전에 손으로 두드려 「멀쩡하다」 고 적었던 것도 <b>숨은 칸을
       두드린 것</b>이라 뜻이 없었습니다. <b>안 한 것은 안 했다고 적습니다</b> (1번).
     ★ 그 문을 지나려면 가짜 서버 묶음이 필요하고, 그것은 <b>check-rtplan 이
       이미 갖고 있습니다</b>. 같은 묶음을 두 벌로 만들지 않습니다 (5번) —
       CRM 찾기 칸의 손가락·글씨를 재는 일은 <b>그 자에게 넘길 자리</b>로
       적어 둡니다.
     ★ 여기서는 <b>지워지지 않았는지</b>만 봅니다 — 그것은 로그인 없이도
       참·거짓을 가릴 수 있고, 조용히 사라지면 잡힙니다.              */
  head('[3] 🗄️ <b>DB 통합 CRM 의 「찾기」 칸이 그대로 있나</b> (로그인 문 뒤라 모양은 못 쟀습니다)');
  const B = await 열기('/db-crm.html?mig=1&me=u1', 1280, 900);
  await B.p.waitForTimeout(3500);
  const C = await B.p.evaluate(() => {
    const el = document.getElementById('search');
    if (!el) return { 있나: false };
    const r = el.getBoundingClientRect();
    return { 있나: true, 보임: r.height > 0 && r.width > 0,
             자리글: el.getAttribute('placeholder') || '' };
  });
  is(C.있나, '  찾기 칸이 <b>그대로 있다</b> — 「' + (C.자리글 || '').slice(0, 30) + '」');
  console.log('  · 화면에 서 있나: ' + (C.보임 ? '섰습니다 — 아래에서 잽니다'
    : '<b>로그인 문 뒤라 0×0</b> 입니다 — 손가락·글씨는 <b>못 쟀습니다</b> (1번)'));
  if (C.있나 && C.보임) {
    const D = await B.p.evaluate(재다);
    D.forEach(x => {
      is(x.키 >= 44, '  ' + x.id + ' — 칸 키 <b>' + x.키 + 'px</b> (손가락 바닥 44px)');
      is(x.글자 >= 13, '  ' + x.id + ' — 글자 <b>' + x.글자 + 'px</b> (바닥 13px)');
      is(x.대비 >= 4.5, '  ' + x.id + ' — 바탕과 대비 <b>' + x.대비 + '</b>');
    });
    for (const x of D) {
      if (x.id === '(이름없음)') continue;
      const 깨 = await 두드리기(B.p, x.id);
      is(깨.length === 0, '  ' + x.id + ' — 글 ' + 글들.length + '가지' +
         (깨.length ? (' ⚠ ' + 깨.slice(0, 3).join(' / ')) : ' 다 멀쩡'));
    }
  }
  await B.ctx.close();

  head('[4] 🤫 <b>조용한가</b> (7번 · 8번)');
  /* ★ 여기서 세는 것은 「부르려 했나」 가 아니라 <b>「진짜로 닿았나」</b> 입니다 —
     부르려 한 것은 이 자가 <b>빈 답으로 막았습니다</b>. 그 수를 적어 둡니다.  */
  is(true, '  사장님 서버로 가려던 것 <b>' + 바깥.length + '번</b>을 이 자가 빈 답으로 막았다' +
     ' — 진짜로 닿은 것은 <b>0번</b>입니다 (7번 · check-netblock)');
  is(오류.length === 0, '  콘솔 오류가 <b>없다</b> — ' + 오류.length + '개' +
     (오류.length ? (' ← ' + [...new Set(오류)].slice(0, 2).join(' / ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ 검색할 때 깨지는 자리 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 본체 검색 칸이 손가락에 닿고 읽히며, 어떤 글을 넣어도 안 깨집니다.');
  console.log('  (CRM 의 찾기 칸은 로그인 문 뒤라 모양을 못 쟀습니다 — 있는지만 봤습니다.)');
})();
