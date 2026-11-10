/* ♻️ <b>전에 넣은 고객에게도 갈래를 붙이는가</b> — 판 X398

   사장님 말씀 (2026-11-10) — 「<b>전에 넣은 고객들도 갈래 붙일수 있게</b> 해줘」

   ── 왜 길이 없었나 ────────────────────────────────────────────────
   판 X394 로 <b>새로</b> 넣는 분은 갈래가 고객 365일까지 따라갑니다. 그런데
   전에 넣으신 분은 길이 없었습니다 — 같은 엑셀을 다시 넣으시면 그 분들은
   「<b>이미 계신 분</b>」 으로 걸러지기만 하고 갈래는 안 붙었습니다.

   ★ 고친 길 둘 — ① 가져오기 분류 화면에서 「♻️ 이미 계신 N분에게도 갈래를
     붙입니다」 를 켜면 <b>새로 넣지 않고 갈래만</b> 적습니다 ② 한 분은
     고객 카드(가족·소개 고치기)의 「🗂 엑셀 갈래」 칸에서 고칩니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [2] ★★ 새로 넣을 분이 0명이어도 <b>단추가 눌리는가</b> — 같은 엑셀을 다시
         넣으시는 그때가 갈래를 붙이러 오신 때입니다
     [3] ★★ <b>고객이 안 늘어나는가</b> · 쪽지가 <b>두 장이 안 되는가</b>(5-1번)
     [3] ★★ 이미 적힌 갈래를 <b>안 덮는가</b> · 가족 줄 같은 <b>다른 칸이 안 날아가는가</b>
     [3] ★ 서버를 <b>두 번</b>만 두드리는가 (7번)
     [4] ★ 고객 365일 줄과 칩에 그대로 뜨는가
     [5] ★★ 고객 카드에서 <b>한 분</b>을 고칠 수 있는가 · 다른 칸이 안 날아가는가
     [6] ★★ 서버가 <b>묶어 고치기를 안 받으면</b> 한 줄씩 가는가 · <b>그렇다고 적는가</b>(1번)

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
        /* ⚠⚠ 처음에 이 가짜 서버가 upsert·update 를 <b>아무 일도 안 하고
           성공</b>이라 답했습니다 — 그래서 「갈래를 적었다」 는데 쪽지는
           그대로였고, 저는 앱을 의심했습니다. <b>자가 거짓말한 것</b>입니다 (8번).
           진짜 서버처럼 <b>제 자리에 써 넣습니다.</b>                     */
        if (st.op === 'upsert') {
          if (window.__NOUPSERT) return Promise.resolve({ error: { message: 'upsert 막힘' } }).then(o, n);
          [].concat(st.pay || []).forEach(x => {
            const k = T.findIndex(y => y.id === x.id);
            if (k >= 0) T[k] = Object.assign({}, T[k], x); else T.push(Object.assign({}, x));
          });
          return Promise.resolve({ data: [], error: null }).then(o, n);
        }
        if (st.op === 'update') {
          T.forEach((y, k) => {
            let hit = true;
            Object.keys(st.eq).forEach(kk => { if (y[kk] !== st.eq[kk]) hit = false; });
            if (hit) T[k] = Object.assign({}, y, st.pay);
          });
          return Promise.resolve({ data: [], error: null }).then(o, n);
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
  const ctx = await b.newContext({ viewport: { width: 430, height: 950 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()));
  await p.evaluate(SEED);
  await p.waitForTimeout(900);
  await 줄글심기(p);

  /* ══ [1] 전에 넣으신 모양 — 갈래 칸이 없는 명단 ═══════════════════ */
  console.log('[1] 갈래 칸이 <b>없는</b> 명단으로 여섯 분을 넣습니다 (전에 넣으신 모양)');
  await 넣기(p, CSV(false));
  const A = await p.evaluate(() => ({ cli: window.__DB.clients.length,
    meta: (window.__DB.saved_reports || []).filter(x => x.kind === 'client_meta').length }));
  is(A.cli === 6, '  여섯 분이 들어갔다 (받음 ' + A.cli + ')');
  is(A.meta === 0, '  갈래 줄은 <b>한 줄도 안 나갔다</b> — 갈래 칸이 없는 명단입니다 (받음 ' + A.meta + ')');

  /* 진짜 서버처럼 — 몇 분께는 이미 쪽지가 있고, 한 분은 이미 갈래가 적혀 있습니다 */
  await p.evaluate(() => {
    window.__DB.clients.slice(0, 3).forEach((c, i) => {
      const m = cmBlank(); m.fam = '배우자·자녀' + i; m.up = Date.now();
      window.__DB.saved_reports.push({ id: 'old-rid-' + i, advisor_id: 'me', client_id: c.id,
        kind: 'client_meta', title: '고객 관리', content: cmBody(m) });
    });
    const m2 = cmBlank(); m2.xsrc = '손으로적음'; m2.up = Date.now();
    window.__DB.saved_reports.push({ id: 'old-rid-9', advisor_id: 'me',
      client_id: window.__DB.clients[5].id, kind: 'client_meta', title: '고객 관리', content: cmBody(m2) });
    CM.loaded = false; try { cmLoadAll(); } catch (e) {}
  });
  await p.waitForTimeout(1200);
  await p.evaluate(() => { try { cimpReset(); } catch (e) {} });

  /* ══ [2] 같은 분들을 갈래가 든 파일로 다시 ═══════════════════════ */
  console.log('\n[2] ★★ 같은 엑셀을 <b>갈래가 든 파일</b>로 다시 넣습니다');
  const b64 = Buffer.from(CSV(true), 'utf8').toString('base64');
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
  await p.waitForTimeout(900);
  const S1 = await p.evaluate(() => {
    const t = (document.getElementById('cimpSheet') || document.body).innerText.replace(/\s+/g, ' ');
    const bt = document.querySelector('.cimp-b1');
    const ck = [...document.querySelectorAll('#cimpSheet .cimp-ck')].map(x => (x.innerText || '').replace(/\s+/g, ' '));
    return { 글: t, 단추: bt ? (bt.innerText || '').replace(/\s+/g, ' ') : '(없음)',
             잠김: bt ? !!bt.disabled : null, 체크: ck.join(' / ') };
  });
  is(/이미 계신 5분에게도/.test(S1.체크),
     '  ★ 「이미 계신 <b>5분</b>에게도 갈래를 붙입니다」 칸이 선다 — 「' + S1.체크.slice(0, 70) + '」');
  is(/이미 다른 갈래가 적힌 1명은 그대로/.test(S1.체크),
     '  ★★ 이미 갈래가 적힌 분은 <b>그대로 둔다</b>고 적는다 (1번)');
  is(!/새로 넣을 분이 <b>없습니다<\/b>|새로 넣을 분이 없습니다/.test(S1.글),
     '  ★★ 「새로 넣을 분이 없습니다」 라고 <b>안 한다</b> — 갈래를 붙이러 오신 때입니다 (1번)');
  is(/갈래 붙이기/.test(S1.단추),
     '  ★★ 단추가 <b>그때 하는 일</b>을 말한다 — 「' + S1.단추 + '」');

  /* ══ [3] 켜고 누릅니다 ═══════════════════════════════════════════ */
  console.log('\n[3] ★★ 켜고 누르면 — 새로 안 넣고 갈래만 적는가');
  const S2 = await p.evaluate(async () => {
    const ck = [...document.querySelectorAll('#cimpSheet .cimp-ck input')].find(x => !x.disabled);
    if (ck) { ck.checked = true; ck.dispatchEvent(new Event('change', { bubbles: true })); }
    await new Promise(r => setTimeout(r, 500));
    const bt = document.querySelector('.cimp-b1');
    return { 잠김: bt ? !!bt.disabled : null };
  });
  is(S2.잠김 === false, '  ★★ 새로 넣을 분이 0명이어도 단추가 <b>눌린다</b>');
  await p.evaluate(() => { const bt = document.querySelector('.cimp-b1'); if (bt && !bt.disabled) bt.click(); });
  await p.waitForTimeout(3600);
  const D = await p.evaluate(() => {
    const t = (document.getElementById('cimpSheet') || document.body).innerText.replace(/\s+/g, ' ');
    const cnt = {}; window.__CALLS.forEach(c => { cnt[c] = (cnt[c] || 0) + 1; });
    const metas = (window.__DB.saved_reports || []).filter(x => x.kind === 'client_meta');
    return { 글: t, 쪽지수: metas.length,
             갈래: metas.map(x => ((x.content || {}).xsrc || '(빈)')).sort().join(','),
             가족: metas.filter(x => (x.content || {}).fam).length,
             insert: cnt['insert saved_reports'] || 0, upsert: cnt['upsert saved_reports'] || 0,
             update: cnt['update saved_reports'] || 0, cli: window.__DB.clients.length };
  });
  is(D.cli === 6, '  ★★ 고객이 <b>안 늘어난다</b> — 새로 넣는 것이 아닙니다 (받음 ' + D.cli + ')');
  is(D.쪽지수 === 6, '  ★★ 쪽지가 <b>두 장이 안 된다</b> — 이미 있는 분은 고쳐 씁니다 (받음 ' + D.쪽지수 + ' · 5-1번)');
  is(D.갈래 === '세미나,손으로적음,인터넷DB,인터넷DB,지인소개,지인소개',
     '  ★★ 다섯 분께 붙고 <b>「손으로적음」 은 그대로</b>다 — ' + D.갈래);
  is(D.가족 === 3, '  ★★ 가족 줄 같은 <b>다른 칸이 안 날아간다</b> (받음 ' + D.가족 + '개)');
  is(D.insert + D.upsert + D.update <= 2,
     '  ★ 서버를 <b>두 번</b>만 두드린다 — insert ' + D.insert + ' · upsert ' + D.upsert +
     ' · update ' + D.update + ' (7번)');
  is(/이미 계신 <b>5분<\/b>|이미 계신 5분/.test(D.글),
     '  ★ 마친 화면이 <b>몇 분께 붙였는지</b> 적는다');

  /* ══ [4] 고객 365일 ══════════════════════════════════════════════ */
  console.log('\n[4] 고객 365일에 그대로 뜨는가');
  await p.evaluate(() => { try { cimpClose(); } catch (e) {} document.querySelectorAll('#cimpSheet,#cregSheet').forEach(x => x.remove()); });
  await p.evaluate(() => { try { go('clients'); } catch (e) {} });
  await p.waitForTimeout(2400);
  const L = await p.evaluate(() => {
    const r = window.__ROWS();
    const row = document.getElementById('cliFSrcChips');
    return { n: r.n, 칩: row ? [...row.querySelectorAll('.t-chip')].map(x => (x.innerText || '').replace(/\s+/g, ' ')) : [],
             글: r.t };
  });
  is(L.n === 6, '  줄이 여섯 선다 (받음 ' + L.n + ')');
  is((L.글.match(/🗂/g) || []).length === 6, '  ★ 여섯 줄 모두 「🗂 갈래」 가 붙는다 (받음 ' +
     (L.글.match(/🗂/g) || []).length + ')');
  is(L.칩.length === 4, '  ★ 갈래 칩 넷이 선다 — ' + (L.칩.join(' / ') || '(없음)'));

  /* ══ [5] 카드에서 한 분 ═══════════════════════════════════════════ */
  console.log('\n[5] ★★ 고객 카드에서 <b>한 분</b>을 고칠 수 있는가');
  const C = await p.evaluate(async () => {
    const id = window.__DB.clients[0].id;
    try { cusGo({ cli: id, tab: 'info' }); } catch (e) {}
    await new Promise(r => setTimeout(r, 2000));
    try { cuwSheet('fam'); } catch (e) {}
    await new Promise(r => setTimeout(r, 1200));
    const e = document.getElementById('cusXsrc');
    if (!e) return { 칸: false };
    /* ⚠⚠ <b>그림을 찍어 보고 찾았습니다</b> (판 X398) — 칸과 단추를 나란히
       두었더니 단추가 줄을 다 먹어 칸이 <b>「소가」 만큼</b>으로 눌렸습니다.
       글자로만 재던 자는 통과했습니다 — 칸은 거기 있었으니까요 (8번).
       <b>얼마나 넓은지</b>를 같이 봅니다. */
    const w = Math.round(e.getBoundingClientRect().width);
    const before = e.value;
    e.value = '소개자리';
    try { cusXsrcSave(id); } catch (err) {}
    await new Promise(r => setTimeout(r, 2200));
    const row = (window.__DB.saved_reports || []).find(x => x.client_id === id && x.kind === 'client_meta');
    const n = (window.__DB.saved_reports || []).filter(x => x.client_id === id && x.kind === 'client_meta').length;
    return { 칸: true, w: w, 처음: before, 적힘: (row && row.content && row.content.xsrc) || '(없음)',
             가족: (row && row.content && row.content.fam) || '(없음)', 줄수: n };
  });
  is(C.칸, '  갈래 고치는 칸이 <b>카드에 선다</b> (가족 · 소개 고치기)');
  is(C.처음 === '지인소개', '  ★ 지금 갈래가 <b>칸에 미리 들어 있다</b> (받음 「' + C.처음 + '」)');
  is(C.w >= 240, '  ★★ 칸이 <b>눌리지 않는다</b> — 폰 430px 에서 ' + C.w + 'px (적는 글이 보여야 씁니다)');
  is(C.적힘 === '소개자리', '  ★★ 고쳐 저장하면 <b>그대로 적힌다</b> (받음 「' + C.적힘 + '」)');
  is(C.가족 !== '(없음)', '  ★★ 가족 줄 같은 <b>다른 칸이 안 날아간다</b> (받음 「' + C.가족 + '」)');
  is(C.줄수 === 1, '  ★ 쪽지가 <b>한 장</b>이다 — 고쳐 쓰지 또 안 만듭니다 (받음 ' + C.줄수 + ' · 5-1번)');

  /* ══ [6] 묶어 고치기가 막힌 판 ═══════════════════════════════════ */
  console.log('\n[6] ★★ 서버가 <b>묶어 고치기를 안 받으면</b> 한 줄씩 가는가');
  const NU = await p.evaluate(async () => {
    window.__NOUPSERT = true;
    const ids = window.__DB.clients.slice(0, 3).map(c => c.id);
    ids.forEach(id => { const m = cmOf(id); m.xsrc = ''; });
    window.__CALLS.length = 0;
    const r = await new Promise(res => cmSrcFillMany(ids.map(id => ({ id: id, g: '다시붙임' })), null, res));
    const cnt = {}; window.__CALLS.forEach(c => { cnt[c] = (cnt[c] || 0) + 1; });
    const metas = (window.__DB.saved_reports || []).filter(x => x.kind === 'client_meta');
    window.__NOUPSERT = false;
    return { ok: r.ok, fail: r.fail, note: r.note || '',
             붙음: metas.filter(x => (x.content || {}).xsrc === '다시붙임').length,
             upsert: cnt['upsert saved_reports'] || 0, update: cnt['update saved_reports'] || 0,
             쪽지: metas.length };
  });
  is(NU.붙음 === 3 && NU.fail === 0,
     '  ★★ 막혀도 <b>세 분 다 붙는다</b> (붙음 ' + NU.붙음 + ' · 못 적음 ' + NU.fail + ')');
  is(NU.upsert === 1 && NU.update === 3,
     '  ★ 묶음 한 번 → <b>한 줄씩 셋</b>으로 떨어진다 (upsert ' + NU.upsert + ' · update ' + NU.update + ')');
  is(/한 줄씩/.test(NU.note), '  ★★ <b>그렇다고 적는다</b> — 「' + (NU.note || '(아무 말 없음)') + '」 (1번)');
  is(NU.쪽지 === 6, '  ★ 쪽지가 안 늘어난다 (받음 ' + NU.쪽지 + ')');

  console.log('\n[7] 조용한가');
  is(errs.length === 0, errs.length ? ('  콘솔 에러 — ' + errs.slice(0, 2).join(' / ')) : '  콘솔에 에러가 없다');

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
                  : '✓ 전에 넣은 고객에게도 갈래가 붙습니다 — 새로 넣지 않고, 덮지 않고, 서버는 두 번.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('✗ ' + (e && e.message)); try { srv.close(); } catch (_) {} process.exit(1); });
