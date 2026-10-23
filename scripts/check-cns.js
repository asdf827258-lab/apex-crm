/* ✅ 고객 동의 네 갈래가 서고, <b>아는 것만 잠그나</b> — 판 X174 (X161 설계의 판 2)

   사장님 말씀 (2026-10-22) 「동의는 네 갈래로」 · (2026-10-23) 「판 2부터 만들어」.
   설계 docs/고객한장_설계.md 7장 — 수집·이용 · 고유식별(주민번호) · 민감(병력) · 광고 수신.

   여기서 잽니다 —
     [1] 준비 SQL(HX_SQL '00') — client_consents 표 · 네 갈래 · 받은 방법 넷 ·
         보는 사람은 본인·관리자·팀장 · 적는 사람은 담당자(와 전체 편집)뿐 ·
         요약 트리거가 clients.consent_status 를 세움 · 판 번호 45 가 앱과 같음 ·
         표가 판 번호를 적는 줄보다 <b>앞</b>에 있음(판 X84 의 그 사고) · <code>--</code> 주석 없음
     [2] ★★ <b>모르면 안 잠근다</b> (1번) — 서버 칸이 없으면 「준비 전」 이라고 말하고
         주민번호·청구 칸은 그대로 열려 있다. 준비 SQL 을 안 돌린 날 163명 모두의 칸이 닫히면 안 됩니다
     [3] 안다면서 받지 않았으면 — 주민번호를 새로 담지 않고 · 청구 이력을 새로 적지 않고 ·
         그 자리에서 「✅ 동의 적기」 가 시트를 연다. 담는 함수도 거절한다(그리는 곳만 막으면 뒷문)
     [4] 이미 담긴 것은 <b>가린 채 보이고 지울 수 있다</b> (6번 — 감추면 지울 길이 사라짐)
     [5] 받았어요 · 철회 — 서버로 가는 줄이 맞나 · 다시 받아도 <b>처음 받은 날을 안 덮나</b> ·
         받은 적 없으면 철회를 안 보내나 · 담당자가 아니면 단추가 없나
     [6] 한 곳 — 잠그는 자리는 cnsLocked 만 묻고, 앱은 consent_status 를 직접 안 쓴다(트리거가 주인 · 5번) ·
         그 분 것만 읽는다(eq client_id · limit · 7번)

   ★ 서버 규칙(RLS)·트리거 자체는 브라우저로 못 잽니다. 만들 때 로컬 Postgres 16 에 같은 모양의
     판을 지어 돌려 봤습니다(받음→granted · 철회→revoked · 다시 받음→granted · 지움→none ·
     팀장/관리자 읽기만 · 남은 0줄 · 남의 고객엔 못 씀 · 고객을 지우면 같이 지워짐 · 두 번 돌려도 안전).
     그 결과는 대장 X174 에 적어 두었습니다.
   ★ 견본 이름은 홍길동 집안입니다 (3번). 진짜 서버는 안 읽습니다. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let f = path.join(ROOT, decodeURIComponent(url.parse(rq.url).pathname));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end(); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const body = (src, head) => { const i = src.indexOf(head); if (i < 0) return ''; const j = src.indexOf('\n}', i); return src.slice(i, j + 2); };

(async () => {
  const SRC = fs.readFileSync('app/index.html', 'utf8');
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 2400 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + port) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await p.goto('http://127.0.0.1:' + port + '/app/index.html'); await p.waitForTimeout(2600);

  console.log('\n[1] 준비 SQL 에 동의 표가 들어 있다');
  const S = await p.evaluate(() => ({ sql: HX_SQL['00'].lines.join('\n'), ver: SETUP_VER, need: HX_SQL['00'].need }));
  const sql = S.sql;
  const iT = sql.indexOf('create table if not exists public.client_consents'), iV = sql.search(/'schema_version',\s*'(\d+)'/);
  is(iT > 0, '  client_consents 표를 만든다');
  is((S.need || []).indexOf('client_consents') >= 0, '  준비 SQL 이 담는 것 목록에도 적혀 있다');
  is(/kind in \('collect','uid','sensitive','ad'\)/.test(sql), '  갈래 넷 — 수집·이용 · 고유식별 · 민감 · 광고');
  is(/method in \('서면','전자서명','녹취','구두'\)/.test(sql), '  받은 방법 넷 — 서면 · 전자서명 · 녹취 · 구두');
  is(/granted_at\s+timestamptz/.test(sql) && /revoked_at\s+timestamptz/.test(sql) && /recorded_by\s+uuid default auth\.uid\(\)/.test(sql),
     '  받은 날 · 철회한 날 · 적은 사람이 남는다');
  is(/primary key \(client_id, kind\)/.test(sql), '  한 분 · 한 갈래는 한 줄 (덮어 적는다)');
  is(/client_consents enable row level security/.test(sql), '  서버 규칙(RLS)을 켠다');
  const rd = (sql.match(/create policy client_consents_read[\s\S]*?\)\);/) || [''])[0];
  const wr = (sql.match(/create policy client_consents_write[\s\S]*?\)\);/) || [''])[0];
  is(/advisor_id = auth\.uid\(\)/.test(rd) && /is_admin\(\)/.test(rd) && /is_my_teammate/.test(rd), '  보는 사람 — 본인 · 관리자 · 팀장 (준법 확인)');
  is(/advisor_id = auth\.uid\(\)/.test(wr) && !/is_admin\(\)|is_my_teammate/.test(wr), '  적는 사람 — 담당자(와 전체 편집)뿐 · 팀장·관리자는 못 고친다');
  is(/create trigger client_consents_sum/.test(sql) && /kind = 'collect'/.test(sql) && /consent_status =/.test(sql),
     '  요약 트리거 — clients.consent_status 를 수집·이용 갈래에서 세운다');
  is(iT > 0 && iV > iT, '  표가 판 번호를 적는 줄보다 <b>앞</b>이다 — 번호만 오르고 표가 없는 일이 없다 (판 X84)');
  const stamped = +((sql.match(/'schema_version',\s*'(\d+)'/) || [])[1] || 0);
  is(stamped === 45 && S.ver === 45, '  판 번호 45 — SQL ' + stamped + ' · 앱 ' + S.ver);
  const seg = iT > 0 ? sql.slice(sql.lastIndexOf('/*', iT), sql.indexOf('execute function public.client_consents_sum();') + 50) : '';
  is(seg && !/(^|\s)--\s/.test(seg.replace(/\/\*[\s\S]*?\*\//g, '')), '  동의 토막에 <code>--</code> 주석이 없다 (9번)');

  console.log('\n[6] 한 곳에서만 묻는다');
  const LOCKERS = ['function cmRrnHtml(', 'function cmRrnSave(', 'function cmDueClmHtml(', 'function cmClmSave(', 'function cmClmAdd('];
  is(LOCKERS.every(h => /cnsLocked\(/.test(body(SRC, h))), '  잠그는 다섯 자리가 다 cnsLocked 를 묻는다 — ' + LOCKERS.length + '곳');
  is(LOCKERS.every(h => !/client_consents|consent_status/.test(body(SRC, h))), '  잠그는 자리가 표·요약을 따로 안 읽는다 (5번)');
  const writes = (SRC.match(/consent_status\s*:\s*['"](granted|revoked|requested)/g) || []).length;
  is(writes === 0, '  앱이 consent_status 를 직접 granted/revoked 로 안 쓴다 — 트리거가 주인 (받음 ' + writes + ')');
  const ld = body(SRC, 'function cnsLoad(');
  is(/\.eq\('client_id',cid\)/.test(ld) && /\.limit\(/.test(ld), '  그 분 것만 읽는다 — eq client_id · limit (7번)');
  is((SRC.match(/cnsLoad\(/g) || []).length <= 4, '  읽는 자리가 몇 곳뿐이다 — 되풀이해서 안 부른다 (7번)');

  /* ── 브라우저 — 견본 서버 ── */
  await p.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    ['osLoadProfile', 'osProfileApply', 'osShowLoginGate', 'arLoad', 'osLoadClients', 'chkLoad'].forEach(k => { window[k] = function () {}; });
    window.setupDone = () => true; window.setupCanRun = () => true; window.setupShow = () => false; window.osTabAllowed = () => true;
    window.cmLoadAll = function (cb) { if (cb) cb(); };
    window.toast = function (m) { window._t = m; };
    window.confirm = function () { return true; };
    OS.session = { user: { id: 'me' } }; OS.profile = { id: 'me', user_id: 'me', name: '홍판서', role: 'owner', user_role: 'owner', team: 'A', active: true };
    window.__UPS = []; window.__READ = 0;
    window.osClient = function () {
      const mk = function (t) { let one = false; const a = {};
        ['select', 'order', 'limit', 'in', 'is', 'neq', 'not', 'gte', 'lte', 'update', 'insert', 'delete', 'range', 'or', 'filter', 'eq'].forEach(k => { a[k] = function () { return a; }; });
        a.single = a.maybeSingle = function () { one = true; return a; };
        a.upsert = function (row, opt) { if (t === 'client_consents') { window.__UPS.push({ row: row, opt: opt }); window.__ROWS = (window.__ROWS || []).filter(x => x.kind !== row.kind).concat([row]); } return a; };
        a.then = function (f, g) {
          if (t === 'client_consents') { window.__READ++;
            if (window.__MODE === 'missing') return Promise.resolve({ data: null, error: { message: 'relation "public.client_consents" does not exist' } }).then(f, g);
            return Promise.resolve({ data: (window.__ROWS || []).slice(), error: null }).then(f, g); }
          let d = [];
          if (t === 'clients') d = [{ id: 'c1', phone: '010-1111-2222', birth_year: 1982, gender: 'M' }];
          return Promise.resolve({ data: one ? (d[0] || null) : d, error: null }).then(f, g); };
        return a; };
      return { from: mk, rpc: function () { return Promise.resolve({ data: null, error: null }); } };
    };
    CM.loaded = true; CM.meta = { c1: {} };
    OSC.loaded = true; OSC.list = [{ id: 'c1', advisor_id: 'me', name_masked: '홍*동', consent_status: 'none', created_at: '2026-09-03' },
                                   { id: 'c2', advisor_id: 'other', name_masked: '홍*순', consent_status: 'none', created_at: '2026-09-10' }];
    AR.loaded = true; AR.calls = []; AR.cliRows = []; AR.db = [];
    go('home');
  });
  await p.waitForTimeout(500);
  const look = () => p.evaluate(() => {
    const t = id => (document.getElementById(id) || {}).textContent || '';
    return { chip: ((document.querySelector('#oscTopBar .ed.cns') || {}).textContent || '').trim(),
             rrnIn: !!document.getElementById('cmRrnIn'), clmIn: !!document.getElementById('cmClmRows'),
             lockUid: /고유식별\(주민번호\) 동의가/.test(t('cmPanels')), lockSen: /민감\(병력\) 동의가/.test(t('cmPanels')),
             info: t('cuwInfo'), sheet: t('cnsSheet'), btns: document.querySelectorAll('#cnsSheet .cns-act button').length };
  });
  const open = async (cid, mode, rows) => {
    await p.evaluate((a) => { window.__MODE = a.mode; window.__ROWS = a.rows; CNS.has = null; CNS.rows = {}; CNS.err = '';
      try { osBackToList(); } catch (e) {} cusGo({ cli: a.cid }); }, { cid, mode, rows });
    await p.waitForTimeout(1300);
    return look();
  };

  console.log('\n[2] ★★ 모르면 안 잠근다 — 서버 칸이 아직 없을 때');
  const A = await open('c1', 'missing', []);
  is(/준비 전/.test(A.chip), '  머리 칩이 「동의 준비 전」 — ' + A.chip);
  is(A.rrnIn && A.clmIn && !A.lockUid && !A.lockSen, '  주민번호·청구 칸이 <b>그대로 열려 있다</b> — 모르는 것을 「없음」 으로 단정하지 않는다');
  is(/서버 준비 SQL\(45판\)/.test(A.info) && /아무것도 잠그지 않습니다/.test(A.info), '  무엇을 하면 되는지 말한다 — 준비 SQL 45판');
  is(/모름/.test(A.info) && !/안 받음/.test(A.info), '  네 갈래 모두 「모름」 — 「안 받음」 이 아니다');

  console.log('\n[3] 안다면서 받지 않았으면 — 잠그고 그 자리에서 동의 적기');
  const B = await open('c1', 'ok', []);
  is(B.chip === '동의 0/4', '  머리 칩 「동의 0/4」 — ' + B.chip);
  is(!B.rrnIn && B.lockUid, '  주민번호 — 새로 담는 칸이 닫히고 잠금 카드가 선다');
  is(!B.clmIn && B.lockSen, '  청구 이력 — 새로 적는 칸이 닫히고 잠금 카드가 선다');
  const go1 = await p.evaluate(() => { cusTab('doc'); const btn = [].slice.call(document.querySelectorAll('#cmPanels .cns-lock button')).filter(x => x.offsetParent !== null)[0];
    if (btn) btn.click(); return document.getElementById('cusWin').getAttribute('data-sheet'); });
  is(go1 === 'cns', '  잠금 카드의 「✅ 동의 적기」 가 동의 시트를 연다 — ' + go1);
  const refuse = await p.evaluate(() => { const n0 = cmRrnOf('c1'); window._t = '';
    const inp = document.createElement('input'); inp.id = 'cmRrnIn'; inp.value = '900101-1234567'; document.body.appendChild(inp);
    cmRrnSave('c1'); inp.remove(); const r1 = cmRrnOf('c1') === n0 && /동의가 없어/.test(window._t);
    window._t = ''; cmClmSave('c1'); const r2 = /동의가 없어/.test(window._t); return r1 && r2; });
  is(refuse, '  담는 함수도 거절한다 — 그리는 곳만 막으면 남은 단추가 뒷문이 됩니다');
  await p.evaluate(() => cuwSheet(''));

  console.log('\n[4] 이미 담긴 것은 가린 채 보이고 지울 수 있다 (6번)');
  const K = await p.evaluate(() => { cmRrnSet('c1', '9001011234568'); cmClmSet('c1', [{ at: '2026-10-01', won: '100000', what: '통원' }]); cmDetailPaint('c1');
    const t = (document.getElementById('cmPanels') || {}).textContent || '';
    const r = { masked: /900101-1/.test(t) && !/9001011234568|900101-1234568/.test(t), del: /지우기/.test(t), clmN: /청구 1건/.test(t) };
    cmRrnSet('c1', ''); cmClmSet('c1', []); cmDetailPaint('c1'); return r; });
  is(K.masked, '  동의 없이 담겨 있던 주민번호는 <b>가린 채</b> 보인다');
  is(K.del, '  지우기가 있다 — 잠가도 지울 길은 남는다');
  is(K.clmN, '  청구 이력은 몇 건인지 말하고 지울 수 있다 — 「청구 1건」');

  console.log('\n[5] 받았어요 · 철회');
  const C = await p.evaluate(async () => { cuwSheet('cns'); document.getElementById('cnsHow_uid').value = '녹취'; cnsSave('c1', 'uid', 'yes');
    await new Promise(r => setTimeout(r, 400)); return JSON.stringify(window.__UPS.slice(-1)[0] || {}); });
  const c = JSON.parse(C);
  is(c.opt && c.opt.onConflict === 'client_id,kind', '  한 분 · 한 갈래로 덮어 적는다 (onConflict client_id,kind)');
  is(c.row && c.row.kind === 'uid' && c.row.method === '녹취' && c.row.granted_at && c.row.revoked_at === null, '  받았어요 — 받은 날 · 방법(녹취) · 철회 비움');
  const C2 = await look();
  is(C2.rrnIn && !C2.lockUid && C2.lockSen && C2.chip === '동의 1/4', '  주민번호 칸만 열리고 청구는 그대로 닫혀 있다 — ' + C2.chip);
  const first = c.row && c.row.granted_at;
  const D = await p.evaluate(async () => { await new Promise(r => setTimeout(r, 30)); document.getElementById('cnsHow_uid').value = '서면'; cnsSave('c1', 'uid', 'yes');
    await new Promise(r => setTimeout(r, 400)); return window.__UPS.slice(-1)[0].row; });
  is(D.granted_at === first && D.method === '서면', '  다시 눌러도 <b>처음 받은 날을 안 덮는다</b> — 방법만 고친다');
  const E = await p.evaluate(async () => { cnsSave('c1', 'uid', 'off'); await new Promise(r => setTimeout(r, 400)); return window.__UPS.slice(-1)[0].row; });
  is(E.revoked_at && E.granted_at === first, '  철회 — 철회한 날을 적고 받은 날은 남긴다');
  const E2 = await look();
  is(!E2.rrnIn && E2.lockUid && /철회되어/.test((await p.evaluate(() => document.getElementById('cmPanels').textContent))), '  철회하면 다시 닫히고 「철회되어」 라고 말한다');
  const F = await p.evaluate(async () => { const n = window.__UPS.length; cnsSave('c1', 'ad', 'off'); await new Promise(r => setTimeout(r, 200)); return window.__UPS.length === n; });
  is(F, '  받은 적 없는 갈래는 철회를 안 보낸다');
  const G = await open('c2', 'ok', []);
  is(G.btns === 0 && /담당자만 적습니다/.test(G.sheet), '  담당자가 아니면 단추가 없고 「담당자만 적습니다」 라고 말한다');

  console.log('\n[7] 조용히 터진 곳이 없다');
  is(!errs.length, '  터진 곳 없음' + (errs.length ? ' — ' + errs.join(' / ') : ''));
  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데 — 동의를 모르는 채로 잠그거나, 알면서 열어 두면 고객 앞에서 무너집니다.'); process.exit(1); }
  console.log('✓ 동의 네 갈래가 서고, 아는 것만 잠급니다.');
})().catch(e => { console.error(e); process.exit(1); });
