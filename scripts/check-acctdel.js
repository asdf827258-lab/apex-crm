/* <b>「아이디 삭제가 안된다. 계속 반복되네」</b>

   두 가지가 겹쳐 있었습니다.

   ① 서버가 <b>지우다 말았습니다.</b> 계정을 참조하는 기록(고객·저장한
      자료·출근·체크판…)이 남아 있으면 <code>auth.users</code> 삭제가
      외래키에 걸려 실패합니다. 그런데 함수는 「연결된 기록도 함께
      지운다」 고 물어 놓고 <b>그 기록을 안 지웠습니다.</b> 그래서 지워도
      목록에 그대로 남았습니다.

   ② 그 실패가 <b>잠깐 뜨는 안내</b>로만 지나갔습니다. 왜 안 됐는지
      모르니 같은 자리를 다시 누르게 됩니다 — 그것이 「계속 반복」 입니다.

   ── 그리고 더 깊은 뿌리 ────────────────────────────────────────────
   이 계정 SQL 이 <b>두 곳에 글자까지 똑같이</b> 적혀 있었습니다 —
   조직도의 「한 번에 전부」(HX_SQL) 와 계정 화면의 준비 SQL(OS_ACCT_SQL).
   한쪽만 고치면 <b>어느 화면에서 SQL 을 돌리셨느냐</b>에 따라 고친 판과
   안 고친 판이 갈립니다. git 은 이런 것을 안 잡아 줍니다 (CLAUDE.md 5번).

   여기서 지키는 것
     1. 계정 함수 SQL 이 <b>한 곳</b>에만 있다 · 두 묶음이 같은 것을 준다
     2. hard 면 참조 줄을 <b>실제로</b> 지운다
     3. 지운 뒤 <b>정말 사라졌는지 서버와 목록으로 확인</b>한다
     4. 실패가 <b>그 자리에 남는다</b> — 스쳐 지나가지 않는다
     5. 무엇이 걸려 있는지 <b>표 이름과 건수</b>로 말한다
     6. SQL 에 <code>--</code> 주석을 안 쓴다 (9번)                      */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const SRC = fs.readFileSync('app/index.html', 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, ' ');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

/* 흉내 서버 — rpc 이름마다 답을 따로 준다 */
const FAKE = `(function(plan){
  return {
    from:function(){ var a={}; ['select','eq','order','limit','insert','update','delete']
      .forEach(function(k){ a[k]=function(){ return a; }; });
      a.then=function(res){ return Promise.resolve({data:[],error:null}).then(res); };
      return a; },
    rpc:function(name,args){
      var r=plan[name];
      if(typeof r==='function')r=r(args);
      return Promise.resolve(r||{data:null,error:null});
    }
  };
})`;

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  page.on('dialog', d => d.accept('hong@example.com'));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  console.log('\n[1] 계정 함수 SQL 이 한 곳에만 있다 — 두 묶음이 같은 것을 준다');
  const S = await page.evaluate(() => {
    const acct = OS_ACCT_SQL.join('\n');
    const all = HX_SQL['00'].lines.join('\n');
    return {
      one: typeof OS_ACCT_FN_SQL !== 'undefined' && OS_ACCT_FN_SQL.length > 50,
      acctDel: (acct.match(/create or replace function public\.admin_delete_account/g) || []).length,
      allDel: (all.match(/create or replace function public\.admin_delete_account/g) || []).length,
      acctDetail: /admin_account_refs_detail/.test(acct),
      allDetail: /admin_account_refs_detail/.test(all),
      acctHard: /if hard then/.test(acct),
      allHard: /if hard then/.test(all),
      /* hard 면 참조 줄을 실제로 지우는가 */
      wipes: /delete from public\.%I where %I = \$1/.test(acct) &&
             /delete from public\.%I where %I = \$1/.test(all),
      /* 지운 뒤 서버가 스스로 확인하는가 */
      verify: /if exists \(select 1 from auth\.users where id = target\) then/.test(acct),
      fkSay: /foreign_key_violation/.test(acct),
      grant: /grant execute on function public\.admin_account_refs_detail\(uuid\) to authenticated;/.test(acct),
      dash: /(^|\n)\s*--/.test(acct + '\n' + all)
    };
  });
  is(S.one, '  <b>OS_ACCT_FN_SQL 한 벌</b>에 모여 있다');
  is(S.acctDel === 1 && S.allDel === 1,
     '  삭제 함수가 각 묶음에 <b>한 번씩</b>만 적힌다 — 계정 SQL ' + S.acctDel + ' · 한 번에 전부 ' + S.allDel);
  is(S.acctDetail && S.allDetail,
     '  <b>두 묶음 다</b> 「무엇이 걸려 있나」 함수를 가진다 — 어느 화면에서 돌려도 같다');
  is(S.acctHard && S.allHard, '  <b>두 묶음 다</b> hard 처리를 가진다');
  is(S.wipes, '  hard 면 참조 줄을 <b>실제로 지운다</b> — 여태 물어만 보고 안 지웠다');
  is(S.verify, '  지운 뒤 <b>서버가 스스로 확인</b>한다 — 남아 있으면 됐다고 안 한다');
  is(S.fkSay, '  외래키에 걸리면 <b>무엇이 막았는지 그대로</b> 올려 보낸다');
  is(S.grant, '  새 함수에 <b>권한</b>이 붙어 있다 — 없으면 대표님이 못 부른다');
  is(!S.dash, '  SQL 에 <code>--</code> 주석을 안 쓴다 (9번)');

  console.log('\n[2] 지우다 실패하면 — 그 자리에 남는다');
  const F = await page.evaluate(async (FAKE_SRC) => {
    const chain = eval(FAKE_SRC)({
      admin_account_refs: { data: 12, error: null },
      admin_delete_account: { data: null, error: { message: 'update or delete on table "users" violates foreign key constraint' } }
    });
    window.osClient = function () { return chain; };
    OS.profile = { id: 'u1', name: '홍길동', role: 'owner', active: true, plan: 'pro' };
    OSAC.note = null;
    osAcDelete('u9', 'hong@example.com', '홍길순');
    await new Promise(r => setTimeout(r, 400));
    const n = OSAC.note;
    const d = document.createElement('div');
    d.innerHTML = osAcNoteHtml('u9');
    const t = d.textContent.replace(/\s+/g, ' ').trim();
    return { kind: n && n.kind, t, forOther: osAcNoteHtml('uX') };
  }, FAKE);
  is(F.kind === 'err', '  실패가 <b>남는다</b> — 스쳐 지나가지 않는다');
  is(/지우지 못했습니다/.test(F.t), '  <b>지우지 못했다</b>고 말한다 — 「됐다」 라고 안 한다');
  is(/foreign key/.test(F.t), '  <b>서버가 한 말을 그대로</b> 보여 준다 — 「' + F.t.slice(0, 46) + '…」');
  is(F.forOther === '', '  <b>그 줄에만</b> 뜬다 — 다른 사람 줄에는 안 붙는다');

  console.log('\n[3] 서버는 지웠다는데 목록에 그대로면 — 그렇다고 말한다');
  const G = await page.evaluate(async (FAKE_SRC) => {
    const chain = eval(FAKE_SRC)({
      admin_account_refs: { data: 0, error: null },
      admin_delete_account: { data: 'hong@example.com', error: null },
      /* 지웠다는데 목록에는 그대로 있다 */
      admin_user_list: { data: [{ id: 'u9', email: 'hong@example.com', name: '홍길순' }], error: null }
    });
    window.osClient = function () { return chain; };
    OSAC.note = null;
    osAcDelete('u9', 'hong@example.com', '홍길순');
    await new Promise(r => setTimeout(r, 600));
    const d = document.createElement('div'); d.innerHTML = osAcNoteHtml('u9');
    return { kind: OSAC.note && OSAC.note.kind, t: d.textContent.replace(/\s+/g, ' ').trim() };
  }, FAKE);
  is(G.kind === 'err', '  <b>됐다고 안 한다</b>');
  is(/목록에 그대로/.test(G.t), '  목록에 <b>그대로 있다</b>고 말한다 — 「' + G.t.slice(0, 42) + '…」');

  console.log('\n[4] 정말 사라졌을 때만 됐다고 한다');
  const H = await page.evaluate(async (FAKE_SRC) => {
    const chain = eval(FAKE_SRC)({
      admin_account_refs: { data: 3, error: null },
      admin_delete_account: { data: 'hong@example.com', error: null },
      admin_user_list: { data: [{ id: 'u1', email: 'me@example.com', name: '홍길동' }], error: null }
    });
    window.osClient = function () { return chain; };
    OSAC.note = null;
    let said = '';
    const realToast = window.toast; window.toast = function (m) { said += ' ' + m; };
    osAcDelete('u9', 'hong@example.com', '홍길순');
    await new Promise(r => setTimeout(r, 600));
    window.toast = realToast;
    return { note: OSAC.note && OSAC.note.id, said: said.replace(/\s+/g, ' ').trim(), rows: OSAC.rows.length };
  }, FAKE);
  is(!H.note, '  안내가 <b>걷힌다</b> — 다 됐으니 남길 것이 없다');
  is(/사라진 것을 확인/.test(H.said),
     '  <b>확인했다</b>고 말한다 — 「' + H.said.slice(0, 50) + '…」');
  is(H.rows === 1, '  목록이 <b>다시 읽힌다</b> — ' + H.rows + '명');

  console.log('\n[5] 「무엇이 걸려 있나」 — 표 이름과 건수로 말한다');
  const R = await page.evaluate(async (FAKE_SRC) => {
    const chain = eval(FAKE_SRC)({
      admin_account_refs_detail: { data: [{ t: 'clients', c: 'advisor_id', n: 12 },
                                          { t: 'saved_reports', c: 'advisor_id', n: 3 }], error: null }
    });
    window.osClient = function () { return chain; };
    OSAC.note = null;
    osAcRefs('u9');
    await new Promise(r => setTimeout(r, 400));
    const d = document.createElement('div'); d.innerHTML = osAcNoteHtml('u9');
    const t1 = d.textContent.replace(/\s+/g, ' ').trim();

    const none = eval(FAKE_SRC)({ admin_account_refs_detail: { data: [], error: null } });
    window.osClient = function () { return none; };
    osAcRefs('u9');
    await new Promise(r => setTimeout(r, 300));
    const d2 = document.createElement('div'); d2.innerHTML = osAcNoteHtml('u9');
    return { t1, t2: d2.textContent.replace(/\s+/g, ' ').trim() };
  }, FAKE);
  is(/clients/.test(R.t1) && /12건/.test(R.t1),
     '  <b>표 이름과 건수</b>를 댄다 — 「' + R.t1.slice(0, 48) + '…」');
  is(/15건/.test(R.t1), '  <b>합계</b>도 센다');
  is(/함께 사라집니다/.test(R.t1), '  지우면 <b>그 기록도 사라진다</b>고 미리 말한다');
  is(/붙잡고 있는 기록이 없습니다/.test(R.t2), '  걸린 것이 없으면 <b>없다고</b> 말한다');

  console.log('\n[6] 준비 SQL 을 안 돌리셨으면 그렇게 말한다');
  const N = await page.evaluate(async (FAKE_SRC) => {
    const chain = eval(FAKE_SRC)({
      admin_account_refs: { data: null,
        error: { message: 'Could not find the function public.admin_account_refs in the schema cache' } }
    });
    window.osClient = function () { return chain; };
    OSAC.note = null;
    osAcDelete('u9', 'hong@example.com', '홍길순');
    await new Promise(r => setTimeout(r, 400));
    const d = document.createElement('div'); d.innerHTML = osAcNoteHtml('u9');
    return d.textContent.replace(/\s+/g, ' ').trim();
  }, FAKE);
  is(/준비 SQL/.test(N) && /한 번 더/.test(N),
     '  <b>준비 SQL 을 한 번 더</b> 돌리라고 말한다 — 「' + N.slice(0, 50) + '…」');

  console.log('\n[7] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 계정이 안 지워지는데 왜인지 알 수 없습니다')
                  : '✓ 지우면 정말 지워지고, 안 되면 왜 안 되는지 그 자리에 남습니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
