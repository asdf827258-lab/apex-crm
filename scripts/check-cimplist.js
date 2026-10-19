/* 📇 <b>엑셀로 넣은 분이 고객 365일에 실제로 뜨는가</b> — 판 X138

   사장님 말씀 (2026-10-19) — 「고객 365일에서 실제로 보이는지 봐줘」

   ── 재어 보니 조용히 깨지는 자리가 있었습니다 ──────────────────────
   판 X135 의 가져오기는 쉰 분을 <b>묶어서</b> 넣습니다(7번 — 서버를 아껴
   씁니다). 묶어 넣으면 서버가 돌려주는 <b>차례</b>를 믿어야 하는데, 가린
   이름은 「홍*순」 으로 겹치므로 한 칸만 밀려도 <b>남의 실명이 붙습니다.</b>
   그래서 <b>번호를 우리가 지어</b>(bizUuid) 같이 넣었습니다.

   그런데 <b>서버가 그 번호를 안 받고 제 번호를 매기면</b> — 줄은 다 들어가고
   실명도 이 기기에 멀쩡히 담기는데, <b>번호가 어긋나 못 찾습니다.</b>
   고객 365일 열 줄이 전부 「홍*동」 으로 뜹니다. 실명은 있는데 안 보입니다.
   그리고 <b>앱은 한 마디도 안 합니다</b> — 사장님은 까닭을 모르십니다 (1번).

   ★ 고친 길 — <b>첫 묶음은 한 줄만</b> 넣어 봅니다. 한 줄이면 돌아온 번호가
     누구 것인지 틀림없으므로, 받든 안 받든 그 한 분은 바로잡히고 나머지
     길도 그때 정해집니다(받으면 묶음, 안 받으면 한 줄씩).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 넣고 나서 <b>고객 365일 목록에 그 수만큼</b> 뜨는가
     [2] ★★ <b>실명으로</b> 뜨는가 — 가린 이름만 뜨면 누가 누군지 모릅니다
     [3] ★★ <b>서버가 번호를 새로 매겨도</b> 실명으로 뜨는가 (위 까닭)
     [4] ★ 서버에 간 것은 <b>가린 이름</b>뿐인가 (3번)
     [5] ★ 「고객 365일 보기」 단추가 실제로 그 화면을 여는가
     [6] ★ 한 줄씩 가게 됐으면 <b>그렇다고 적는가</b> (1번)

   ★ 사장님 진짜 서버는 읽지 않습니다. 견본 이름은 홍길동 집안입니다 (3번). */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const zlib = require('zlib');
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

/* ── 견본 CSV — 홍길동 집안 여섯. 묶음(25) 보다 적지만 「첫 한 줄 → 나머지」
     두 길을 다 지납니다. 파일 읽기 자체는 check-cimp 가 봅니다.          */
const NAMES = ['홍길동', '홍길순', '홍말순', '임꺽정', '이몽룡', '성춘향'];
const CSV = '고객명,연락처,성별\n' +
  NAMES.map((n, i) => n + ',010-' + (1000 + i) + '-' + (2000 + i) + ',' + (i % 2 ? '여' : '남')).join('\n') + '\n';

const SEED = (renum) => {
  window.__DB = { clients: [] };
  window.__RENUM = renum;
  window.toast = (m) => { window.__T = m; };
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '윤시현', role: 'owner', active: true };
  window.osAudit = function () {};
  window.cmLoadAll = function (cb) { if (cb) cb(); };
  OSC.loaded = false; OSC.busy = false; OSC.err = ''; OSC.list = [];
  try { localStorage.removeItem('apex_cli_real_me'); } catch (e) {}
  let seq = 0;
  window.osClient = function () {
    const mk = (t) => { const st = { t: t, op: '', pay: null, sel: false }; const a = {
      insert: q => { st.op = 'insert'; st.pay = q; return a; },
      update: q => { st.op = 'update'; st.pay = q; return a; },
      upsert: q => { st.op = 'upsert'; st.pay = q; return a; },
      'delete': () => { st.op = 'delete'; return a; },
      select: () => { st.sel = true; return a; },
      eq: () => a, order: () => a, range: () => a, limit: () => a, single: () => a,
      is: () => a, not: () => a, neq: () => a, gte: () => a, 'in': () => a,
      then: (o, n) => {
        if (!st.op) {
          const rows = (st.t === 'clients') ? window.__DB.clients.map(x => Object.assign({}, x)) : [];
          return Promise.resolve({ data: rows, error: null }).then(o, n);
        }
        if (st.op === 'insert' && st.t === 'clients') {
          const put = [].concat(st.pay || []).map(x => {
            const row = Object.assign({}, x);
            if (window.__RENUM || !row.id) row.id = 'srv-' + (++seq);
            row.created_at = new Date().toISOString();
            window.__DB.clients.push(row); return row;
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

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const b = await chromium.launch();
  const b64 = Buffer.from(CSV, 'utf8').toString('base64');
  for (const renum of [false, true]) {
    const tag = renum ? '서버가 제 번호를 매기는 판' : '서버가 우리 번호를 받는 판';
    console.log('\n[' + (renum ? '3' : '1') + '] ' + tag);
    const ctx = await b.newContext({ viewport: { width: 430, height: 950 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
    await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()));
    await p.evaluate(SEED, renum);
    await p.waitForTimeout(800);
    /* 사람처럼 — 단추 → 📁 → 파일 → 분류 → 넣기 */
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
    await p.waitForTimeout(600);
    await p.evaluate(() => { const bt = document.querySelector('.cimp-b1'); if (bt && !bt.disabled) bt.click(); });
    await p.waitForTimeout(2600);
    const G = await p.evaluate(() => ({
      db: window.__DB.clients.length,
      real: JSON.parse(localStorage.getItem('apex_cli_real_me') || '{}'),
      srvTxt: JSON.stringify(window.__DB.clients),
      note: (CIMP.res || {}).note || '', ok: (CIMP.res || {}).ok, noid: (CIMP.res || {}).noid
    }));
    is(G.db === 6, '서버에 <b>6줄</b>이 들어갔다 (받음 ' + G.db + ')');
    is(G.ok === 6 && !G.noid, '앱도 6명 넣었다고 센다 (받음 ' + G.ok + ' · 번호 못 받음 ' + G.noid + ')');
    is(!new RegExp(NAMES.join('|')).test(G.srvTxt), '서버에 간 것은 <b>가린 이름</b>뿐이다 (3번)');
    /* 「고객 365일 보기」 를 눌러 봅니다 */
    const went = await p.evaluate(() => {
      const bt = [...document.querySelectorAll('#cimpSheet button')].find(x => /고객 365일 보기/.test(x.innerText));
      if (!bt) return ''; bt.click(); return 'ok';
    });
    await p.waitForTimeout(2600);
    const L = await p.evaluate((names) => {
      const host = document.getElementById('oscList');
      const t = host ? host.innerText : '';
      return { tab: (typeof currentTab === 'function') ? currentTab() : '?',
               n: OSC.list.length, loaded: OSC.loaded,
               shown: names.filter(x => t.indexOf(x) >= 0),
               byName: OSC.list.map(c => (typeof cmName === 'function') ? cmName(c) : (c.name_masked || '')) };
    }, NAMES);
    is(went === 'ok' && L.tab === 'clients', '「고객 365일 보기」 가 <b>그 화면을 연다</b> (받음 ' + L.tab + ')');
    is(L.loaded && L.n === 6, '목록에 <b>6줄</b>이 선다 (받음 ' + L.n + ')');
    is(L.shown.length === 6,
       '여섯 분이 <b>실명으로</b> 뜬다 — ' + (L.shown.join(',') || '(한 분도 실명으로 안 뜹니다)') +
       (L.shown.length === 6 ? '' : ' · cmName: ' + L.byName.join(',')));
    if (renum)
      is(/한 줄씩|번호를 새로/.test(G.note),
         '한 줄씩 가게 됐으면 <b>그렇다고 적는다</b> — 「' + (G.note || '(아무 말 없음)') + '」');
    is(errs.length === 0, '조용히 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));
    await ctx.close();
  }
  await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '자리 어긋납니다') : '\n✓ 엑셀로 넣은 분이 고객 365일에 실명으로 뜹니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('✗ ' + (e && e.message)); try { srv.close(); } catch (_) {} process.exit(1); });
