/* 🗂 <b>엑셀로 나눈 갈래가 고객 365일까지 따라가는가</b> — 판 X394

   사장님 말씀 (2026-11-10) — 「엑셀 파일을 넣으면 고객을 <b>자동분류해서
   고객 365에 분류하는</b> 기능 다시 한번 점검하고…」

   ── 재어 보니 절반만 되고 있었습니다 ────────────────────────────────
   가져오기 화면은 잘 나눕니다 — 「갈래 — 유입경로 · 지인소개 2 · 인터넷DB 2 ·
   세미나 2」 로 세고, 갈래마다 빼고 넣을 수도 있습니다. 그런데 <b>넣고 나면
   고객 365일에서 그 갈래가 한 글자도 안 보였습니다</b> — 줄에도, 고객
   카드에도. 값은 메모(household_notes) 안에 「유입경로: 지인소개」 로 섞여
   들어가 있을 뿐 <b>아무도 꺼내 쓰지 않았습니다.</b> 가져오기 화면을 닫는
   순간 분류가 사라집니다.

   ★ 고친 길 — client_meta 에 <b>src</b> 한 칸(판 X394). 'db' 와 같은 모양으로
     여쭙지 않고 조용히 적힙니다. 새 표는 안 만듭니다 — client_meta 는
     saved_reports 안이라 마이그레이션이 없습니다 (7번).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ 넣은 뒤 <b>줄에</b> 갈래가 뜨는가
     [2] ★★ <b>갈래 칩</b>이 서고 수가 맞는가 · 눌러서 걸러지는가
     [3] ★ 갈래로 <b>찾아지는가</b>
     [4] ★★ 갈래를 <b>한 번에</b> 적는가 — 사람 수만큼 두드리면 안 됩니다 (7번)
     [5] ★★ 서버에 간 갈래 줄에 <b>실명이 없는가</b> (3번)
     [6] ★ 갈래 칸이 <b>없는 명단</b>이면 칩 줄 자체가 안 서는가 (헛것 금지 · 8번)
     [7] 조용한가

   ★ 사장님 진짜 서버는 읽지 않습니다. 견본 이름은 홍길동 집안입니다 (3번). */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd();
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
               '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const NAMES = ['홍길동', '홍길순', '홍말순', '임꺽정', '이몽룡', '성춘향'];
const GRP   = ['지인소개', '지인소개', '인터넷DB', '인터넷DB', '세미나', '세미나'];
const UNIQ  = ['세미나', '인터넷DB', '지인소개'];      /* 많은 쪽부터 — 다 둘이라 가나다 */
const CSV = (withGrp) => '고객명,연락처' + (withGrp ? ',유입경로' : '') + '\n' +
  NAMES.map((n, i) => n + ',010-' + (1000 + i) + '-' + (2000 + i) +
    (withGrp ? (',' + GRP[i]) : '')).join('\n') + '\n';

/* 두 표를 받는 가짜 서버 — clients · saved_reports. 부른 것을 다 적어 둡니다. */
const SEED = () => {
  window.__DB = { clients: [], saved_reports: [] };
  window.__CALLS = [];
  window.toast = (m) => { window.__T = m; };
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '윤시현', role: 'owner', active: true };
  window.osAudit = function () {};
  OSC.loaded = false; OSC.busy = false; OSC.err = ''; OSC.list = [];
  try { localStorage.removeItem('apex_cli_real_me'); } catch (e) {}
  let seq = 0;
  window.osClient = function () {
    const mk = (t) => { const st = { t: t, op: '', pay: null, sel: false, eq: {} }; const a = {
      insert: q => { st.op = 'insert'; st.pay = q; return a; },
      update: q => { st.op = 'update'; st.pay = q; return a; },
      upsert: q => { st.op = 'upsert'; st.pay = q; return a; },
      'delete': () => { st.op = 'delete'; return a; },
      select: () => { st.sel = true; return a; },
      eq: (k, v) => { st.eq[k] = v; return a; }, order: () => a, range: () => a,
      limit: () => a, single: () => a,
      is: () => a, not: () => a, neq: () => a, gte: () => a, 'in': () => a,
      then: (o, n) => {
        window.__CALLS.push((st.op || 'select') + ' ' + st.t);
        const T = window.__DB[st.t] || (window.__DB[st.t] = []);
        if (!st.op) {
          let rows = T.map(x => Object.assign({}, x));
          Object.keys(st.eq).forEach(k => { rows = rows.filter(x => x[k] === st.eq[k]); });
          return Promise.resolve({ data: rows, error: null }).then(o, n);
        }
        if (st.op === 'insert') {
          const put = [].concat(st.pay || []).map(x => {
            const row = Object.assign({}, x);
            if (!row.id) row.id = 'srv-' + st.t + '-' + (++seq);
            row.created_at = new Date().toISOString();
            T.push(row); return row;
          });
          if (!st.sel) return Promise.resolve({ error: null }).then(o, n);
          return Promise.resolve({ data: put.map(r => ({ id: r.id, name_masked: r.name_masked })), error: null }).then(o, n);
        }
        return Promise.resolve({ data: [], error: null }).then(o, n);
      } }; return a; };
    return { from: (t) => mk(t), rpc: () => Promise.resolve({ data: null, error: null }) };
  };
  go('home');
};

/* 사람처럼 — 단추 → 📁 → 파일 → 분류 → 넣기 */
const 넣기 = async (p, csv) => {
  const b64 = Buffer.from(csv, 'utf8').toString('base64');
  await p.evaluate(() => { const bt = [...document.querySelectorAll('.hm-cal,button,a')].find(x => /고객 넣기/.test(x.innerText || '')); if (bt) bt.click(); });
  await p.waitForTimeout(350);
  await p.evaluate(() => { const c = [...document.querySelectorAll('#cregSheet .creg-c')].find(x => /엑셀/.test(x.innerText)); if (c) c.click(); });
  await p.waitForTimeout(350);
  await p.evaluate((s) => {
    const bin = atob(s), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const dt = new DataTransfer(); dt.items.add(new File([u], '명단.csv'));
    const inp = document.getElementById('cimpFile'); inp.files = dt.files;
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }, b64);
  await p.waitForTimeout(1400);
  await p.evaluate(() => { const bt = [...document.querySelectorAll('#cimpSheet button')].find(x => /분류해서 보기/.test(x.innerText)); if (bt) bt.click(); });
  await p.waitForTimeout(700);
  await p.evaluate(() => { const bt = document.querySelector('.cimp-b1'); if (bt && !bt.disabled) bt.click(); });
  await p.waitForTimeout(3400);
};
/* 줄 <b>안에서만</b> 읽습니다 — 목록 칸의 글 전체를 읽으면 보드의 이름줄이
   잡혀 거르기를 깨뜨려도 통과합니다. check-cimptoday 에서 데인 자리입니다 (8번).
   ⚠ evaluate 는 인자를 <b>하나만</b> 받으므로, 읽는 법은 화면 안에 심어 둡니다. */
const 줄글심기 = (p) => p.evaluate(() => {
  window.__ROWS = function () {
    var host = document.getElementById('oscList');
    var its = host ? [].slice.call(host.querySelectorAll('[onclick*="osOpenClient"]')) : [];
    return { n: its.length,
             t: its.map(function (x) { return x.innerText || ''; }).join(' | ').replace(/\s+/g, ' ') };
  };
});

const 판 = async (b, PORT, withGrp) => {
  const ctx = await b.newContext({ viewport: { width: 430, height: 950 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()));
  await p.evaluate(SEED);
  await p.waitForTimeout(900);
  await 줄글심기(p);
  await 넣기(p, CSV(withGrp));
  return { ctx, p, errs };
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const b = await chromium.launch();

  /* ══ 갈래 칸이 있는 명단 ══════════════════════════════════════════ */
  console.log('[0] 유입경로 칸이 든 명단으로 여섯 분을 넣습니다');
  const A = await 판(b, PORT, true);
  const S = await A.p.evaluate(() => {
    const cnt = {};
    window.__CALLS.forEach(c => { cnt[c] = (cnt[c] || 0) + 1; });
    return { cli: window.__DB.clients.length,
             meta: (window.__DB.saved_reports || []).filter(x => x.kind === 'client_meta'),
             쓴글: cnt, txt: JSON.stringify(window.__DB.saved_reports || []) };
  });
  is(S.cli === 6, '  여섯 분이 들어갔다 (받음 ' + S.cli + ')');

  console.log('\n[4] ★★ 갈래를 <b>한 번에</b> 적는가 (7번)');
  is((S.쓴글['insert saved_reports'] || 0) === 1,
     '  갈래 줄은 <b>한 번</b>에 나간다 — 쉰 분이면 쉰 번 두드리면 안 됩니다 (받음 ' +
     (S.쓴글['insert saved_reports'] || 0) + '번)');
  is(S.meta.length === 6,
     '  여섯 분의 갈래가 다 적혔다 (받음 ' + S.meta.length + ')');
  const 적힌갈래 = S.meta.map(x => (x.content || {}).xsrc || '(빈)').sort();
  is(JSON.stringify(적힌갈래) === JSON.stringify(GRP.slice().sort()),
     '  ★ 갈래가 <b>제 사람에게</b> 붙었다 — ' + 적힌갈래.join(','));

  console.log('\n[5] ★★ 서버에 간 갈래 줄에 실명이 없는가 (3번)');
  is(!new RegExp(NAMES.join('|')).test(S.txt), '  갈래 줄에 <b>실명이 없다</b>');
  is(!/010-10\d\d/.test(S.txt), '  갈래 줄에 <b>연락처도 없다</b>');

  console.log('\n[1] ★★ 고객 365일 <b>줄에</b> 갈래가 뜨는가');
  await A.p.evaluate(() => { try { go('clients'); } catch (e) {} });
  await A.p.waitForTimeout(2200);
  const R = await A.p.evaluate((g) => {
    const r = window.__ROWS();
    return { n: r.n, 보임: g.filter(x => r.t.indexOf('🗂 ' + x) >= 0), 줄: r.t.slice(0, 150) };
  }, UNIQ);
  is(R.n === 6, '  줄이 여섯 섰다 (받음 ' + R.n + ')');
  is(R.보임.length === UNIQ.length,
     '  ★★ 줄마다 「🗂 갈래」 가 뜬다 — ' + (R.보임.join(',') || '(한 줄도 안 뜹니다 · 「' + R.줄 + '」)'));

  console.log('\n[2] ★★ 갈래 칩이 서고 눌러서 걸러지는가');
  const C = await A.p.evaluate(() => {
    const row = document.getElementById('cliFSrcChips');
    return { 줄있나: !!row,
             lab: row ? (row.innerText || '').replace(/\s+/g, ' ') : '',
             칩: row ? [...row.querySelectorAll('.t-chip')].map(x => (x.innerText || '').replace(/\s+/g, ' ')) : [] };
  });
  is(C.줄있나, '  갈래 줄이 선다');
  is(/엑셀 갈래/.test(C.lab), '  ★ 무슨 줄인지 <b>적혀 있다</b> — 「' + C.lab.slice(0, 40) + '」');
  is(JSON.stringify(C.칩) === JSON.stringify(UNIQ.map(x => x + ' 2')),
     '  ★ 칩 셋이 각각 <b>2</b> 다 — ' + (C.칩.join(' / ') || '(없음)'));
  const F = await A.p.evaluate(async () => {
    const c = [...document.querySelectorAll('#cliFSrcChips .t-chip')].find(x => /세미나/.test(x.innerText));
    if (!c) return { ok: false };
    c.click();
    await new Promise(r => setTimeout(r, 1400));
    const r = window.__ROWS();
    return { ok: true, n: r.n, t: r.t, f: (typeof CLI_F !== 'undefined') ? CLI_F : '?' };
  });
  is(F.ok && F.f === 'xsrc:세미나' && F.n === 2,
     '  ★★ 「세미나」 를 누르면 <b>두 줄만</b> 남는다 (칸 ' + F.f + ' · 줄 ' + F.n + ')');
  is(F.ok && F.t.indexOf('홍길동') < 0 && /이몽룡|성춘향/.test(F.t),
     '  ★ 남은 두 줄이 <b>그 갈래 분들</b>이다 — ' + String(F.t || '').slice(0, 70));

  console.log('\n[3] ★ 갈래로 찾아지는가');
  const Q = await A.p.evaluate(async () => {
    try { cliFSet('all'); } catch (e) {}
    OSC.q = '인터넷DB';
    try { osRenderList(); } catch (e) {}
    await new Promise(r => setTimeout(r, 700));
    const r = window.__ROWS();
    OSC.q = ''; try { osRenderList(); } catch (e) {}
    return r;
  });
  is(Q.n === 2, '  「인터넷DB」 라고 치면 <b>두 분</b>이 뜬다 (받음 ' + Q.n + ')');
  is(/홍말순|임꺽정/.test(Q.t), '  ★ 그 갈래 분들이다 — ' + String(Q.t || '').slice(0, 60));

  /* ⚠⚠ <b>하마터면 줄과 카드가 다른 말을 할 뻔했습니다</b> (판 X394) —
     처음에 갈래를 client_meta 의 <b>'src'</b> 에 썼는데, 그 칸은 이미
     「어디서 오셨나(소개·지인·개척)」 가 쓰는 <b>열쇠 칸</b>이었습니다.
     고객 카드는 cregSrcName(m.src) 로 그 열쇠를 사람 말로 바꿔 적으므로,
     「지인소개」 같은 날글을 넣으면 카드가 <b>빈칸</b>이 됩니다.
     칸을 'xsrc' 로 갈랐고, 여기서 <b>카드도 같은 말을 하는지</b> 봅니다 (5번). */
  console.log('\n[9] ★★ 고객 카드도 줄과 <b>같은 말</b>을 하는가');
  const K = await A.p.evaluate(async () => {
    const id = (window.__DB.clients[0] || {}).id;
    /* 여는 함수는 <b>cusGo 하나</b>입니다 (판 X161) */
    /* 「어디서 오셨나」·「엑셀 갈래」 는 <b>정보</b> 탭에 섭니다 (CUS_TABS) */
    try { cusGo({ cli: id, tab: 'info' }); } catch (e) {}
    await new Promise(r => setTimeout(r, 2400));
    /* ⚠ 창(#cusWin) <b>안에서만</b> 읽습니다 — body 를 통째로 읽으면 서랍
       메뉴 글이 잡혀 헛것이 됩니다 (이 판에서 두 번 밟은 자리입니다 · 8번) */
    const w = document.getElementById('cusWin');
    const t = w ? (w.innerText || '').replace(/\s+/g, ' ') : '';
    return { 창: !!w, 갈래: /엑셀 갈래 지인소개/.test(t),
             어디: (t.match(/어디서 오셨나[^·]{0,16}/) || [''])[0],
             /* ★ 제가 실제로 저지른 그 실수 — 날글을 'src' 에 쓰지 않았나 */
             src: ((CM.meta || {})[id] || {}).src || '',
             토막: (t.match(/엑셀 갈래[^·]{0,16}/) || [''])[0],
             글: t.slice(0, 160) };
  });
  is(K.창, '  고객 창이 열린다 (#cusWin)');
  is(K.갈래, '  ★★ 카드가 「<b>엑셀 갈래 — 지인소개</b>」 라고 적는다 — 「' +
     (K.토막 || ('(한 자도 안 적습니다) · 창 글: ' + K.글)) + '」');
  /* ⚠⚠ <b>제가 실제로 저지른 실수를 그대로 묻습니다</b> (판 X394) — 갈래를
     'src' 에 쓰면 그 칸은 CREG_SRC 의 <b>열쇠</b>(ref·kin·new·old)를 담는
     자리라 cregSrcName 이 빈 글자를 돌려주고, 카드의 「어디서 오셨나」 가
     <b>빈칸</b>으로 섭니다. 엑셀 갈래는 'xsrc' 에만 적혀야 합니다 (5번). */
  is(K.src === '',
     '  ★★ 엑셀 갈래를 <b>「어디서 오셨나」 칸(src)에 쓰지 않는다</b> — 거기 쓰면 '
     + '카드가 빈칸이 됩니다 (받음 「' + K.src + '」)');
  is(!/어디서 오셨나\s*$/.test(K.어디.trim()),
     '  ★ 「어디서 오셨나」 가 <b>빈칸으로 서지 않는다</b> — 「' + (K.어디 || '(엑셀로 넣은 분이라 그 줄 자체가 없습니다 — 맞습니다)') + '」');

  console.log('\n[7] 조용한가');
  is(A.errs.length === 0, A.errs.length ? ('  콘솔 에러 — ' + A.errs.slice(0, 2).join(' / ')) : '  콘솔에 에러가 없다');
  await A.ctx.close();

  /* ══ 갈래 칸이 없는 명단 — 헛것을 안 세웁니다 ═══════════════════ */
  console.log('\n[6] ★★ 갈래 칸이 없는 명단이면 <b>칩 줄 자체가 안 선다</b> (8번)');
  const B = await 판(b, PORT, false);
  await B.p.evaluate(() => { try { go('clients'); } catch (e) {} });
  await B.p.waitForTimeout(2200);
  const N = await B.p.evaluate(() => {
    const r = window.__ROWS();
    return { n: r.n, 줄있나: !!document.getElementById('cliFSrcChips'),
             메모: (window.__DB.saved_reports || []).filter(x => x.kind === 'client_meta').length,
             글: r.t.slice(0, 120) };
  });
  is(N.n === 6, '  여섯 분은 그대로 들어간다 (받음 ' + N.n + ')');
  is(!N.줄있나, '  ★★ 갈래 줄이 <b>안 선다</b> — 빈 줄을 세우면 「뭐가 사라졌나」 하십니다');
  is(N.메모 === 0, '  ★ 갈래 줄도 <b>한 줄도 안 나간다</b> — 빈 값을 적지 않습니다 (받음 ' + N.메모 + ' · 1번)');
  is(!/🗂/.test(N.글), '  ★ 줄에도 「🗂」 가 안 붙는다 — ' + N.글.slice(0, 60));
  /* ⚠⚠ cmOf 는 쪽지가 없으면 <b>만들어 넣습니다</b>(판 X126·X130 에서 데인 자리).
     갈래를 묻는 자리는 목록을 그릴 때마다 <b>모든 고객</b>을 지나므로 거기서
     그것을 부르면 한 번 열 때마다 빈 쪽지가 쌓입니다.
     ⚠ <b>처음에 「CM.meta 가 비었나」 로 쟀다가 되돌렸습니다</b> — 줄을 그리는
       cmRowHtml·cmHit 이 <b>전부터</b> cmOf 를 부르고 있어, 고치기 전에도 고친
       뒤에도 똑같이 여섯이었습니다. 그것은 <b>헛것을 잡는 자</b>입니다 (8번).
       여기서는 <b>갈래를 묻는 두 자리만</b> 따로 불러 봅니다 — 아직 아무도 안
       건드린 번호로 물었을 때 쪽지가 생기면 빨간불입니다. */
  const 빈쪽지 = await B.p.evaluate(() => {
    const id = 'nobody-' + Date.now();
    const before = Object.keys(CM.meta || {}).length;
    try { cliFSrc([{ id: id }]); } catch (e) {}
    try { cliFHit({ id: id }, 'xsrc:세미나', {}); } catch (e) {}
    const after = Object.keys(CM.meta || {}).length;
    return { 늘었나: after - before, 생겼나: !!(CM.meta || {})[id] };
  });
  is(빈쪽지.늘었나 === 0 && !빈쪽지.생겼나,
     '  ★★ 갈래를 물어도 <b>빈 쪽지를 안 만든다</b> — cmOf 가 아니라 cmMetaOf 로 묻습니다 ' +
     '(늘어난 쪽지 ' + 빈쪽지.늘었나 + '개 · 판 X126)');
  is(B.errs.length === 0, B.errs.length ? ('  콘솔 에러 — ' + B.errs.slice(0, 2).join(' / ')) : '  콘솔에 에러가 없다');
  await B.ctx.close();

  /* ══ [8] 새로 켰을 때 — 갈래가 <b>서버에서 돌아오나</b> ═══════════════
     가져온 직후에만 보이고 다음 날 아침에 사라지면 못 쓰는 기능입니다.
     여기서는 <b>가져오기를 아예 안 하고</b>, 서버에 이미 갈래가 적혀 있는
     판으로 고객 365일을 엽니다 — 켤 때마다 지나는 길 그대로입니다. */
  console.log('\n[8] ★★ 새로 켜도 갈래가 돌아오는가 (서버에서 읽어 오나)');
  const Cx = await b.newContext({ viewport: { width: 430, height: 950 } });
  await Cx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const px = await Cx.newPage();
  const ex = [];
  px.on('pageerror', e => ex.push(String(e).slice(0, 160)));
  await px.goto('http://127.0.0.1:' + PORT + '/app/index.html');
  await px.waitForTimeout(2500);
  await px.evaluate(() => document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()));
  await px.evaluate(SEED);
  await px.waitForTimeout(900);
  await 줄글심기(px);
  await px.evaluate((g) => {
    /* 어제 넣어 둔 세 분 — clients 와 client_meta 가 서버에 이미 있습니다 */
    g.forEach((v, i) => {
      const id = 'old-' + i;
      window.__DB.clients.push({ id: id, advisor_id: 'me', name_masked: '홍○○',
        created_at: '2026-11-01T00:00:00.000Z', consent_status: 'none' });
      window.__DB.saved_reports.push({ id: 'r-' + i, advisor_id: 'me', client_id: id,
        kind: 'client_meta', title: '고객 관리', content: { xsrc: v } });
    });
    OSC.loaded = false; OSC.busy = false; CM.loaded = false;
    try { osLoadClients(); } catch (e) {}
    try { cmLoadAll(); } catch (e) {}
  }, UNIQ);
  await px.waitForTimeout(1200);
  await px.evaluate(() => { try { go('clients'); } catch (e) {} });
  await px.waitForTimeout(2400);
  const X = await px.evaluate((g) => {
    const r = window.__ROWS();
    const row = document.getElementById('cliFSrcChips');
    return { n: r.n, 칩: row ? [...row.querySelectorAll('.t-chip')].map(x => (x.innerText || '').replace(/\s+/g, ' ')) : [],
             보임: g.filter(x => r.t.indexOf('🗂 ' + x) >= 0), 글: r.t.slice(0, 120) };
  }, UNIQ);
  is(X.n === 3, '  어제 넣은 세 분이 선다 (받음 ' + X.n + ')');
  is(X.보임.length === 3,
     '  ★★ 가져오기를 안 했는데도 줄에 <b>갈래가 돌아온다</b> — ' +
     (X.보임.join(',') || '(안 돌아옵니다 · 「' + X.글 + '」)'));
  is(JSON.stringify(X.칩) === JSON.stringify(UNIQ.map(x => x + ' 1')),
     '  ★ 갈래 칩도 선다 — ' + (X.칩.join(' / ') || '(없음)'));
  is(ex.length === 0, ex.length ? ('  콘솔 에러 — ' + ex.slice(0, 2).join(' / ')) : '  콘솔에 에러가 없다');
  await Cx.close();

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
                  : '✓ 엑셀로 나눈 갈래가 고객 365일까지 따라갑니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('✗ ' + (e && e.message)); try { srv.close(); } catch (_) {} process.exit(1); });
