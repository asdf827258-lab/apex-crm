/* <b>팀 할 일 — 모두가 보고, 확인은 담당자만.</b>

   사장님 말씀 그대로입니다 — 「투두리스트를 만들어서 팀원들이 체크할수
   있도록. 담당자를 내가 정하면 그 사람이 확인하도록, 다만 모든 사람들이
   다 볼수 있도록. <b>확인만 담당자가 하는거야.</b>」

   ── 여기서 지키는 것 ───────────────────────────────────────────

     1. 홈 화면과 설정에 <b>같은 목록</b>이 뜬다 — 두 벌이 아니다 (5번)
     2. 남의 할 일은 <b>못 누른다</b> — 화면에서 막고, 눌러도 서버에 안 보낸다
     3. 내 할 일은 <b>누르면 저장된다</b> · 서버가 받아 준 <b>뒤에</b> 칠해진다 (1번)
     4. 서버가 거절하면 <b>확인한 척하지 않는다</b> (1번)
     5. 올리기는 <b>지점장급 이상</b>만 — 평사원 화면에는 그 칸이 없다
     6. 담당자 없이 올리지 않는다 — 확인을 누를 사람이 있어야 한다
     7. <b>주민등록번호</b>는 안 올라간다 (3번) · 고객 실명을 적지 말라고 적는다
     8. 표가 없으면 <b>무엇을 하면 되는지</b> 말한다 — 빈 화면으로 두지 않는다
     9. 서버를 <b>되풀이해 부르지 않는다</b> (7번)
    10. SQL 이 <b>한 곳에만</b> 있다 · 준비 SQL(한 번에 전부)에 들어 있다 (5번)
    11. 서버 규칙이 <b>확인을 담당자에게만</b> 연다 — 화면만 막으면 막은 것이 아니다
    12. SQL 에 <code>--</code> 주석을 안 쓴다 (9번)                        */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

const ME = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
/* 견본 사람은 홍길동 (CLAUDE.md 3번) */
const ROWS = [
  { id: 'a1', body: '이번 주 신규 DB 다섯 분께 첫 통화', assignee: ME, assignee_nm: '홍길동',
    due: '2026-09-05', done: false, done_at: null, created_by: ME, created_nm: '홍길동',
    created_at: '2026-09-01T01:00:00Z' },
  { id: 'a2', body: '9월 교육자료 인쇄 · 지점 배포', assignee: OTHER, assignee_nm: '이순신',
    due: '2026-08-30', done: false, done_at: null, created_by: ME, created_nm: '홍길동',
    created_at: '2026-09-01T02:00:00Z' },
  { id: 'a3', body: '상반기 청약 서류 정리', assignee: ME, assignee_nm: '홍길동', due: null,
    done: true, done_at: '2026-08-29T05:00:00Z', created_by: ME, created_nm: '홍길동',
    created_at: '2026-08-20T02:00:00Z' }
];

/* 가짜 서버 — 진짜 서버를 안 부른다. 무엇을 몇 번 불렀는지 세어 둔다. */
function stub(opt) {
  opt = opt || {};
  return `
  window.__q = []; window.__rows = ${JSON.stringify(ROWS)};
  window.__failUpdate = ${opt.failUpdate ? 'true' : 'false'};
  window.__toldTxt = []; (function(){ var t = window.toast;
    window.toast = function (x) { window.__toldTxt.push(String(x)); if (t) try { t(x); } catch (e) {} }; })();
  OS.session = { user: { id: '${ME}' } };
  OS.profile = { id: '${ME}', name: '홍길동', role: '${opt.role || 'owner'}', active: true, plan: 'pro' };
  window.osClient = function () {
    const mk = (tbl) => {
      const q = { tbl };
      ['select','order','limit','eq','gte','lte','in','is','neq','not','or','filter','range','single','maybeSingle']
        .forEach(m => q[m] = function () { return q; });
      q.then = function (ok) {
        window.__q.push(tbl + ':select');
        if (tbl === 'team_todos') return Promise.resolve(ok(${opt.missing
          ? "{ data: null, error: { code: 'PGRST205', message: \"Could not find the table 'public.team_todos'\" } }"
          : '{ data: window.__rows, error: null }'}));
        if (tbl === 'profiles') return Promise.resolve(ok({ data: [
          { id: '${ME}', name: '홍길동', role: 'owner', active: true },
          { id: '${OTHER}', name: '이순신', role: 'member', active: true }], error: null }));
        return Promise.resolve(ok({ data: [], error: null }));
      };
      q.insert = function (row) { window.__q.push(tbl + ':insert'); window.__ins = row;
        return { then: (ok) => Promise.resolve(ok({ data: [row], error: null })) }; };
      q.upsert = function (row) { window.__q.push(tbl + ':upsert');
        return { then: (ok) => Promise.resolve(ok({ data: [row], error: null })) }; };
      q.update = function (row) { window.__q.push(tbl + ':update'); window.__upd = row;
        return { eq: () => ({ then: (ok) => Promise.resolve(ok(window.__failUpdate
          ? { data: null, error: { message: '확인은 담당자 본인만 할 수 있습니다' } }
          : { data: [row], error: null })) }) }; };
      q.delete = function () { window.__q.push(tbl + ':delete');
        return { eq: () => ({ then: (ok) => Promise.resolve(ok({ data: [], error: null })) }) }; };
      return q;
    };
    /* 설정 화면은 rpc·upsert 도 부른다 — 가짜 서버가 그것까지 받아 줘야
       「팀 할 일」 이 아닌 자리에서 터져 이 점검이 헛돈다 */
    return { from: mk, rpc: () => ({ then: (ok) => Promise.resolve(ok({ data: [], error: null })) }),
             auth: { getSession: () => Promise.resolve({ data: { session: null } }) } };
  };
  TDO.loaded = false; TDO.list = []; TDO.err = ''; TDO.missing = false; TDO.openForm = false;
  TDOW.loaded = false; TDOW.rows = [];`;
}

(async () => {
  console.log('팀 할 일 — 모두가 보고, 확인은 담당자만');
  const SRC = fs.readFileSync('app/index.html', 'utf8');

  sec('[1] 서버 규칙 — 화면만 막으면 막은 것이 아니다');
  const sqlM = SRC.match(/var OS_TODO_SQL=\[([\s\S]*?)\n\];/);
  is(!!sqlM, 'SQL 이 <b>OS_TODO_SQL 한 곳</b>에 있다');
  const SQL = sqlM ? sqlM[1] : '';
  is(/create table if not exists public\.team_todos/.test(SQL), '  표 team_todos 를 만든다');
  is(/alter table public\.team_todos enable row level security/.test(SQL), '  행 보안을 <b>켠다</b>');
  /* <b>붙어 있는 두 줄</b>로 본다. 사이를 [\s\S]*? 로 벌려 두면 저 아래
     엉뚱한 정책의 「using (true)」 가 잡혀, 읽기를 좁혀도 안 울린다 (8번). */
  is(/create policy team_todos_read on public\.team_todos",\s*\n\s*"\s*for select to authenticated using \(true\);/.test(SQL),
     '  읽기는 <b>로그인한 팀원 모두</b> — 누가 무엇을 맡았는지 다 보인다');
  is(/team_todos_insert[\s\S]*?is_leader\(\)[\s\S]*?created_by = auth\.uid\(\)/.test(SQL),
     '  올리기는 <b>지점장급 이상</b>만 · 올린 사람은 반드시 본인');
  is(/team_todos_update_mine[\s\S]*?using \(assignee = auth\.uid\(\)\) with check \(assignee = auth\.uid\(\)\)/.test(SQL),
     '  담당자는 <b>자기 줄만</b> 고친다');
  /* 리더에게 고치기를 열어 두었으므로, 정책만으로는 리더가 남의 확인을 대신
     찍을 수 있다. 그 자리를 <b>방아쇠</b>가 막아야 한다 — 이것이 이 기능의 핵심이다. */
  is(/create or replace function public\.team_todos_guard\(\)/.test(SQL) &&
     /new\.done is distinct from old\.done/.test(SQL) &&
     /auth\.uid\(\) is distinct from old\.assignee/.test(SQL) &&
     /raise exception/.test(SQL),
     '  <b>확인(done)은 담당자 본인만</b> — 서버 방아쇠가 그것을 막는다');
  is(/create trigger team_todos_guard_t before update on public\.team_todos/.test(SQL),
     '  그 방아쇠가 <b>실제로 걸려 있다</b> (create trigger)');
  is(SQL.split('\n').every(l => !/^\s*"[^"]*--/.test(l)), '  SQL 에 <b>-- 주석을 안 쓴다</b> (9번)');
  /* 준비 SQL(한 번에 전부)에 들어 있어야 한다 — 안 들어 있으면 사장님이
     따로 한 번 더 돌려야 하고, 그것을 모르면 「안 됩니다」 가 된다 */
  is(/\.concat\(OS_ACCT_FN_SQL\)\.concat\(OS_TODO_SQL\)/.test(SRC),
     '  <b>준비 SQL(한 번에 전부)</b> 에 이어 붙어 있다 — 따로 돌릴 필요가 없다');
  is(/"advisor_intro","terms_verdicts","team_feedback","team_todos"/.test(SRC),
     '  준비 SQL 목록에 <b>이름도</b> 적혀 있다 — 무엇이 들어가는지 보인다');
  is((SRC.match(/create table if not exists public\.team_todos/g) || []).length === 1,
     '  이 SQL 이 <b>두 곳에 없다</b> — 한 벌뿐이다 (5번)');

  await new Promise(r => srv.listen(0, r));
  const B = 'http://127.0.0.1:' + srv.address().port + '/app/';
  const browser = await chromium.launch();
  const errs = [];
  const fresh = async (opt, w) => {
    const p = await browser.newPage({ viewport: { width: w || 1280, height: 950 } });
    p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.goto(B, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2200);
    await p.evaluate(stub(opt));
    await p.evaluate(() => { go('home'); });
    await p.waitForTimeout(700);
    return p;
  };

  sec('[2] 홈에 뜬다 — 모두가 보고, 내 몫이 눈에 띈다');
  const page = await fresh({});
  const H = await page.evaluate(() => {
    const b = document.getElementById('tdoHome');
    return { there: !!b, rows: b ? b.querySelectorAll('.tdo-row').length : -1,
             mine: b ? b.querySelectorAll('.tdo-row.mine').length : -1,
             done: b ? b.querySelectorAll('.tdo-row.done').length : -1,
             ro: b ? b.querySelectorAll('.tdo-ck.ro').length : -1,
             txt: b ? b.textContent.replace(/\s+/g, ' ') : '',
             calls: window.__q.filter(x => x === 'team_todos:select').length };
  });
  is(H.there && H.rows === 3, '  홈 화면에 <b>세 줄이 다</b> 뜬다 — 남의 할 일도 보인다 (' + H.rows + ')');
  is(H.mine === 1, '  <b>내 몫</b>이 따로 표시된다 (' + H.mine + '줄)');
  is(H.done === 1, '  확인한 줄은 <b>확인한 줄로</b> 보인다');
  is(/담당 이순신/.test(H.txt), '  누가 맡았는지 <b>이름</b>이 적힌다');
  is(/지났습니다/.test(H.txt), '  기한이 지난 것은 <b>지났다고</b> 말한다');
  is(H.calls === 1, '  홈을 열 때 서버를 <b>한 번만</b> 부른다 (7번) — ' + H.calls + '번');
  /* 화면을 나갔다 <b>다시 들어와도</b> 또 부르면 안 된다 — 하루에 홈을 수십 번
     열고, 그때마다 부르면 공짜 한도가 그것으로 다 나간다 (7번). 한 번만
     열어 보고 넘어가면 이 자리를 못 잡는다. */
  const H2 = await page.evaluate(async () => {
    go('clients'); await new Promise(r => setTimeout(r, 300));
    go('home');    await new Promise(r => setTimeout(r, 400));
    return { calls: window.__q.filter(x => x === 'team_todos:select').length,
             rows: document.querySelectorAll('#tdoHome .tdo-row').length };
  });
  is(H2.calls === 1, '  나갔다 <b>다시 들어와도</b> 또 안 부른다 (7번) — 모두 ' + H2.calls + '번');
  is(H2.rows === 3, '  그래도 <b>목록은 그대로</b> 뜬다 (' + H2.rows + '줄) — 담고 있던 것을 그린다');

  sec('[3] 확인은 담당자만 — 남의 것은 눌러도 서버로 안 간다');
  const L = await page.evaluate(async () => {
    const q0 = window.__q.filter(x => x === 'team_todos:update').length;
    const rows = [...document.querySelectorAll('#tdoHome .tdo-row')];
    const other = rows[1];                       /* 이순신 몫 */
    other.querySelector('.tdo-ck').click();
    await new Promise(r => setTimeout(r, 250));
    return { ro: other.querySelector('.tdo-ck').classList.contains('ro'),
             on: other.querySelector('.tdo-ck').classList.contains('on'),
             sent: window.__q.filter(x => x === 'team_todos:update').length - q0,
             said: window.__toldTxt.slice(-1)[0] || '' };
  });
  is(L.ro, '  남의 줄은 <b>잠겨</b> 보인다');
  is(L.sent === 0, '  눌러도 <b>서버로 안 보낸다</b> — ' + L.sent + '번');
  is(!L.on, '  <b>칠해지지 않는다</b> — 확인한 것처럼 보이지 않는다');
  is(/담당자/.test(L.said), '  왜 안 되는지 <b>말해 준다</b> — 「' + L.said + '」');

  sec('[4] 내 할 일 — 누르면 저장되고, 저장된 <b>뒤에</b> 칠해진다');
  const K = await page.evaluate(async () => {
    const row = document.querySelectorAll('#tdoHome .tdo-row')[0];
    row.querySelector('.tdo-ck').click();
    await new Promise(r => setTimeout(r, 250));
    return { on: document.querySelectorAll('#tdoHome .tdo-row')[0].querySelector('.tdo-ck').classList.contains('on'),
             sent: window.__q.filter(x => x === 'team_todos:update').length,
             body: JSON.stringify(window.__upd || {}),
             said: window.__toldTxt.slice(-1)[0] || '' };
  });
  is(K.sent === 1, '  서버로 <b>보낸다</b> (' + K.sent + '번)');
  is(/"done":true/.test(K.body), '  보내는 것은 <b>done 한 칸</b>뿐이다 — ' + K.body);
  is(K.on, '  받아 준 <b>뒤에</b> 칠해진다');
  is(/확인/.test(K.said), '  확인했다고 <b>말해 준다</b> — 「' + K.said + '」');

  sec('[5] 서버가 거절하면 확인한 척하지 않는다 (1번)');
  const F = await fresh({ failUpdate: true });
  const R = await F.evaluate(async () => {
    const row = document.querySelectorAll('#tdoHome .tdo-row')[0];
    row.querySelector('.tdo-ck').click();
    await new Promise(r => setTimeout(r, 300));
    return { on: document.querySelectorAll('#tdoHome .tdo-row')[0].querySelector('.tdo-ck').classList.contains('on'),
             said: window.__toldTxt.slice(-1)[0] || '' };
  });
  is(!R.on, '  거절당하면 <b>안 칠해진다</b>');
  is(/저장하지 못했습니다/.test(R.said), '  <b>실패했다고 말한다</b> — 「' + R.said + '」');
  await F.close();

  sec('[6] 올리기 — 지점장급 이상만 · 담당자를 반드시 고른다');
  const M = await fresh({ role: 'member' });
  const NM = await M.evaluate(() => ({
    form: !!document.querySelector('#tdoHome .tdo-form'),
    rows: document.querySelectorAll('#tdoHome .tdo-row').length
  }));
  is(!NM.form, '  평사원 화면에는 <b>올리는 칸이 없다</b>');
  is(NM.rows === 3, '  그래도 <b>목록은 다 보인다</b> (' + NM.rows + '줄) — 보기는 모두에게');
  await M.close();

  const A = await page.evaluate(async () => {
    const O = {};
    tdoFormOpen();
    await new Promise(r => setTimeout(r, 300));
    O.opened = !!document.querySelector('#tdoHome .tdo-form textarea');
    O.who = document.querySelectorAll('#tdoHome .tdo-form select option').length;
    O.warn = (document.querySelector('#tdoHome .tdo-form .warn') || {}).textContent || '';
    /* ① 담당자 없이 */
    document.getElementById('tdoBody').value = '내일 지점 회의 자료 만들기';
    const q0 = window.__q.filter(x => x === 'team_todos:insert').length;
    tdoAdd();
    await new Promise(r => setTimeout(r, 150));
    O.noWho = window.__q.filter(x => x === 'team_todos:insert').length - q0;
    O.noWhoSaid = window.__toldTxt.slice(-1)[0] || '';
    /* ② 주민등록번호를 적었을 때 */
    document.getElementById('tdoBody').value = '홍길동 900101-1234567 서류 확인';
    document.getElementById('tdoWho').value = '${OTHER}'.replace(/\\$\\{OTHER\\}/, '');
    const sel = document.getElementById('tdoWho'); sel.selectedIndex = 2;
    tdoAdd();
    await new Promise(r => setTimeout(r, 150));
    O.rrn = window.__q.filter(x => x === 'team_todos:insert').length - q0;
    O.rrnSaid = window.__toldTxt.slice(-1)[0] || '';
    /* ③ 제대로 */
    document.getElementById('tdoBody').value = '내일 지점 회의 자료 만들기';
    document.getElementById('tdoDue').value = '2026-09-10';
    tdoAdd();
    await new Promise(r => setTimeout(r, 350));
    O.ok = window.__q.filter(x => x === 'team_todos:insert').length - q0;
    O.sent = JSON.stringify(window.__ins || {});
    O.reload = window.__q.filter(x => x === 'team_todos:select').length;
    return O;
  });
  is(A.opened, '  「＋ 할 일 올리기」 를 누르면 <b>칸이 열린다</b>');
  is(A.who > 1, '  담당자로 <b>고를 사람 목록</b>이 온다 (' + A.who + '칸)');
  is(/실명/.test(A.warn) && /김○○/.test(A.warn),
     '  <b>고객 실명을 적지 말라</b>고 그 자리에 적는다 (3번)');
  is(A.noWho === 0 && /담당자를 고르십시오/.test(A.noWhoSaid),
     '  담당자 없이는 <b>안 올린다</b> — 「' + A.noWhoSaid + '」');
  is(A.rrn === 0 && /주민등록번호/.test(A.rrnSaid),
     '  <b>주민등록번호가 있으면 안 올린다</b> (3번) — 「' + A.rrnSaid + '」');
  is(A.ok === 1, '  제대로 적으면 <b>올라간다</b>');
  is(/"assignee_nm":"이순신"/.test(A.sent) && /"created_by"/.test(A.sent) && /"due":"2026-09-10"/.test(A.sent),
     '  담당자·올린 사람·기한이 <b>함께</b> 간다');
  is(!/\d{6}\s*-\s*\d{7}/.test(A.sent), '  올라간 글에 <b>주민등록번호가 없다</b>');

  sec('[7] 홈과 설정이 같은 것을 그린다 — 두 벌이 아니다 (5번)');
  const S = await page.evaluate(async () => {
    go('settings');
    await new Promise(r => setTimeout(r, 700));
    const set = document.getElementById('tdoSet');
    const rows = set ? [...set.querySelectorAll('.tdo-row .tdo-bd .t')].map(x => x.textContent) : null;
    return { there: !!set, rows: rows, x: set ? set.querySelectorAll('.tdo-x').length : -1,
             sql: !!document.getElementById('tdoSqlBox'),
             one: (String(tdoHtml).match(/tdoRowHtml\(/g) || []).length };
  });
  is(S.there, '  설정에도 <b>같은 목록</b>이 선다');
  is(S.rows && S.rows.length === 3, '  줄 수가 같다 (' + (S.rows || []).length + ')');
  is(S.x > 0, '  설정에서는 <b>지울 수도</b> 있다 (' + S.x + '개)');
  is(S.sql, '  <b>SQL 을 그 자리에서</b> 볼 수 있다 — 무엇을 돌려야 하는지');
  is((SRC.match(/function tdoRowHtml\(/g) || []).length === 1,
     '  줄을 그리는 함수가 <b>하나</b>다 — 홈과 설정이 다른 모양일 수 없다');

  sec('[8] 표가 아직 없으면 무엇을 하면 되는지 말한다 (1번)');
  const N = await fresh({ missing: true });
  const NX = await N.evaluate(() => ({
    txt: (document.getElementById('tdoHome') || {}).textContent || '',
    rows: document.querySelectorAll('#tdoHome .tdo-row').length
  }));
  is(NX.rows === 0, '  없는 줄을 <b>지어내지 않는다</b>');
  is(/준비 SQL/.test(NX.txt) && /설정/.test(NX.txt),
     '  <b>무엇을 하면 되는지</b> 적는다 — 「설정 → 준비 SQL」');
  await N.close();

  sec('[9] 로그인 전에는 서버를 안 부르고, 자리도 안 세운다 (7번)');
  const G = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  await G.goto(B, { waitUntil: 'domcontentloaded' });
  await G.waitForTimeout(2200);
  const GX = await G.evaluate(async () => {
    window.__q = [];
    const old = window.osClient;
    window.osClient = function () { window.__q.push('called'); return old ? old() : null; };
    OS.session = null; OS.profile = null;
    /* 「이미 읽었다」 는 표시를 지우고 잰다 — 안 지우면 그 표시 때문에 안 부른
       것을 「로그인 전이라 안 불렀다」 로 잘못 읽는다 (8번). */
    TDO.loaded = false; TDO.busy = '';
    tdoPaint(); tdoLoad();
    await new Promise(r => setTimeout(r, 250));
    return { html: (document.getElementById('tdoHome') || {}).innerHTML || '', calls: window.__q.length };
  });
  is(GX.html === '', '  로그인 전에는 <b>자리를 안 세운다</b>');
  is(GX.calls === 0, '  로그인 전에는 <b>서버를 안 부른다</b> — ' + GX.calls + '번');
  await G.close();

  sec('[10] 폰에서 가로로 안 밀린다');
  const P = await fresh({}, 390);
  const PX = await P.evaluate(() => ({ d: document.documentElement.scrollWidth, w: window.innerWidth,
                                       rows: document.querySelectorAll('#tdoHome .tdo-row').length }));
  is(PX.rows === 3, '  폰에서도 <b>세 줄이 다</b> 보인다');
  is(PX.d <= PX.w, '  가로 스크롤 없음 (' + PX.d + '/' + PX.w + ')');
  await P.close();

  sec('[11] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await page.close();
  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 팀 할 일이 제 몫을 못 합니다')
                  : '✓ 모두가 보고, 확인은 담당자만 — 화면에서도 서버에서도 그렇습니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
