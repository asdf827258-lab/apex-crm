/* 🧾 <b>고객 창 판 4 — 청구를 서버로</b> (판 X447)

   설계 docs/고객한장_설계.md 11-6 「판 4 · 청구 서버로 (본인 · 관리자)」 ·
   11-5 「청구 넣기 — ③ 청구일 · 보험사 · 상태 · 지급액」 · 말씀 X161.
   사장님 말씀 (2026-10-22) 「… 신분증 보험금청구자료 <b>계약정보 관리</b> …
   깔끔하게」 · 「1판부터 만들어」.

   ── ⚠ 두 쪽이 다 열려 있었습니다 — 서버를 재어 보고 알았습니다 ───
   ① <b>서버 규칙</b> — claims 가 아직 can_see_client() 였습니다. 본인 ·
     관리자 · <b>팀장</b> 셋입니다. 그런데 claims 에는 diagnosis · kcd_code ·
     treatment · surgery · admit_type 이 있습니다 — <b>병력</b>입니다.
     계약·증권(판 X430 에서 본인만)보다 더 좁혀야 하는데 <b>더 넓었습니다.</b>
     migration_76 이 「claims 는 … 판 4 에서 팀장을 뺍니다」 라고 제 손으로
     적어 둔 자리이고, 그 판 4 가 이것입니다.
   ② <b>넣는 길</b> — claims <b>0줄</b> · aftercare_tasks <b>0줄</b>.
     판 3 과 똑같습니다: 표도 규칙도 있는데 <b>적을 자리가 없었습니다.</b>

   ── 자리 ──────────────────────────────────────────────────────
   사장님 말씀 (2026-10-23) <b>「탭 다섯으로」</b> 라서 설계의 「청구 탭」 은
   이미 <b>보장 탭으로 접혔습니다</b>(CUS_TAB_OLD 의 clm → cov). 그래서 이
   자는 「청구 탭이 섰나」 를 묻지 <b>않습니다</b> — 그것을 물으면 사장님이
   고르신 탭 수를 제 손으로 되돌리게 됩니다 (6번 · 8번). <b>탭이 여전히
   다섯인지</b>를 묻습니다.

   ── 이 자가 보는 것 ────────────────────────────────────────────
     0. ★★ 서버 규칙이 <b>본인 · 관리자</b>인가 — migration 과 앱 안 준비
        SQL 이 글자 그대로 같은가 · 판 번호(47)가 맞는가 · 두 줄표 주석 0
     1. ★★ 「이 분 청구가 무엇인가」 를 <b>묻는 곳이 하나</b>다 (5번) — clmOf
     2. ★ 적는 칸이 <b>보장 탭</b>에 선다 · <b>탭은 여전히 다섯</b>이다
     3. ★★ <b>규칙이 서기 전에는 한 줄도 안 쓴다</b> — 그 전에는 팀장도
        청구를 봅니다. 모를 때도 안 씁니다 (1번)
     4. ★★ <b>민감정보 동의</b>가 없다고 알면 안 쓴다 (설계 11-4) — 그래도
        이미 적어 둔 것은 <b>보인다</b> (6번)
     5. ★★ <b>빈 칸은 null</b> 이다 (1번) — 지급액 0 은 「부지급」 과 구별이
        안 됩니다. 실제로 넣어 보고 <b>보낸 값</b>을 잡아 본다
     6. ★★ <b>이름 · 주민번호를 안 보낸다</b> (3번) — 적는 칸이 없고 보내는
        줄에도 없다
     7. ★★ <b>「받으실 수 있습니다」 를 안 적는다</b> (1번 · 말씀 X131)
     8. ★ 고친 뒤 <b>읽는 자를 다시 부른다</b>
     9. ★ 상태 이름이 <b>표 한 곳</b>(CLM_ST)에서 오고 서버 enum 일곱과 같다
    10. ★ 이 기기에만 있던 옛 청구 이력을 <b>안 지웠다</b> (6번)
    11. ★ 누르는 자리 44px

   ★ 사장님 진짜 서버는 한 번도 안 부릅니다 — Supabase 를 가짜로 갈아 끼워
     <b>보낸 값을 잡아</b> 봅니다 (8번).                                   */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
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
const sec = (t) => console.log('\n' + t);

/* 가짜 Supabase — <b>보낸 값을 그대로 잡아 둡니다</b>. 진짜 서버로는 한 번도 안 나갑니다 (8번) */
const FAKE = `
window.__SENT=[];
window.osClient=function(){
  var mk=function(tbl){
    var o={__t:tbl,__f:{}};
    o.select=function(){return o;}; o.eq=function(k,v){o.__f[k]=v;return o;};
    o.order=function(){return o;}; o.limit=function(){return o;}; o.range=function(){return o;};
    o.insert=function(row){ window.__SENT.push({op:'insert',tbl:tbl,row:row}); return Promise.resolve({data:[{id:'new1'}],error:null}); };
    o.update=function(row){ window.__SENT.push({op:'update',tbl:tbl,row:row}); return Promise.resolve({data:[],error:null}); };
    o.delete=function(){ window.__SENT.push({op:'delete',tbl:tbl}); return Promise.resolve({data:[],error:null}); };
    o.upsert=function(row){ window.__SENT.push({op:'upsert',tbl:tbl,row:row}); return Promise.resolve({data:[],error:null}); };
    o.then=function(f,g){ return Promise.resolve({data:[],error:null}).then(f,g); };
    return o;
  };
  return { from:mk, storage:{ from:function(){ return { upload:function(){return Promise.resolve({data:{},error:null});},
                                                       createSignedUrl:function(){return Promise.resolve({data:{},error:null});} }; } } };
};
`;

/* 서버 enum claim_status — <b>2026-11-14 에 서버에 물어 받은 일곱</b>입니다.
   자가 서버를 부르지 않으므로 여기에 적어 둡니다. 앱이 없는 상태를 보내면
   insert 가 터지고, 있는 상태를 빠뜨리면 그 청구를 적을 길이 없습니다. */
const 서버상태 = ['intake', 'supplement', 'paid', 'reduced', 'denied', 'reappeal', 'closed'];
const NEED = 48;   /* ★ 판 X503 — 채용 대기열을 넣으면서 SETUP_VER 을 47 → 48 로
                       올렸습니다. 이 자는 셋(SETUP_VER · 앱 안 schema_version · CLM_NEED)이
                       같은지를 보므로 여기도 같이 올립니다 — 한 곳만 남겨 두면 청구 칸이
                       「준비가 안 됐습니다」 로 영영 서 있게 됩니다 (5번). */

(async () => {
  const SRC = fs.readFileSync('app/index.html', 'utf8');

  /* ── [0] 서버 규칙 ─────────────────────────────────────────── */
  sec('[0] ★★ 서버 규칙이 <b>본인 · 관리자</b>인가 — 세 곳(파일 · 앱 · 판 번호)이 같은가');
  const SQLS = fs.readdirSync('.').filter(f => /^migration_.*\.sql$/.test(f));
  const 청구파일 = SQLS.filter(f => /on\s+public\.claims/i.test(fs.readFileSync(f, 'utf8')));
  is(청구파일.length >= 1, '청구 규칙을 적어 둔 migration 파일이 있다 (받음 ' +
     (청구파일.join(' · ') || '없음') + ')');
  const M = 청구파일.map(f => fs.readFileSync(f, 'utf8')).join('\n');
  is(/create policy\s+claims_mine_admin\s+on\s+public\.claims[\s\S]{0,300}?is_my_client_or_admin/i.test(M),
     '★★ 청구 규칙이 <b>is_my_client_or_admin</b> 을 부른다 — 본인 · 관리자 (설계 4장)');
  is(!/create policy\s+\w+\s+on\s+public\.claims[\s\S]{0,300}?can_see_client/i.test(M),
     '★★ 옛 규칙(can_see_client)이 그 자리에 <b>남아 있지 않다</b> — 남으면 팀장이 병력을 봅니다');
  is(/select\s+public\.is_admin\(\)\s+or\s+public\.is_my_client\(cid\)/i.test(M),
     '★ 그 자가 <b>본인을 또 적지 않고</b> is_my_client 를 부른다 (5번)');
  is(!/^\s*--/m.test(M), 'SQL 에 두 줄표(마이너스 둘) 주석이 없다 (9번)');
  /* ★ 앱 안 준비 SQL 과 <b>글자 그대로</b> 같은가 — 세 곳이 갈라지면 새 서버는 옛 규칙으로 섭니다.
     ⚠ 앱 안 SQL 은 줄마다 따옴표로 싸인 배열입니다. 이음매를 <b>먼저</b> 지웁니다
       (check-ctronly 가 데인 그 자리 그대로). */
  const 앱SQL = SRC.replace(/",\s*\n\s*"/g, '\n').replace(/\\"/g, '"');
  const 문장 = (M.match(/^(create policy|drop policy|grant execute|create or replace function)[^\n]*$/gim) || []);
  const 빠진 = 문장.filter(x => 앱SQL.indexOf(x.replace(/\s+$/, '')) < 0);
  is(문장.length >= 5, '준비 SQL 에 문장이 다섯 이상이다 (받음 ' + 문장.length + ')');
  is(빠진.length === 0, '★ 그 문장이 <b>앱 안 SQL 에도 글자 그대로</b> 있다' +
     (빠진.length ? (' ← 빠짐: ' + 빠진.slice(0, 2).join(' / ')) : ''));
  const sv = (SRC.match(/var SETUP_VER=(\d+)/) || [])[1];
  const av = (SRC.match(/"values \('schema_version', '(\d+)'\)",/) || [])[1];
  is(+sv === NEED && +av === NEED,
     '★ SETUP_VER(' + sv + ') · 앱 안 schema_version(' + av + ') · 이 자가 요구하는 판(' + NEED + ') 이 <b>셋 다 같다</b>');
  is(new RegExp('var CLM_NEED=' + NEED + ';').test(SRC),
     '★ 앱의 CLM_NEED 도 <b>' + NEED + '</b> 이다 — 요구하는 판을 두 곳에 다르게 적지 않습니다 (5번)');

  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r =>
    r.request().url().startsWith('http://127.0.0.1:') ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  await page.evaluate(FAKE);
  await page.evaluate((need) => {
    window.toast = function () {};
    window.confirm = function () { return true; };
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    OS.profile = { id: 'me', name: '윤시현', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'me' } };
    /* 서버 규칙이 <b>섰다</b>고 둡니다 — setupVer 가 보는 그 자리에 적습니다 */
    OS.cfg = OS.cfg || {}; OS.cfg.schema_version = '' + need;
    /* 견본 고객 — 이름은 홍길동 식구만 (3번) */
    OSC.current = { id: 'c1', name_masked: '홍○동', created_at: '2026-01-02T00:00:00Z' };
    OSC.list = [OSC.current];
    /* 동의는 <b>받았다</b>고 둡니다 — 잠금은 [4] 에서 따로 켜 봅니다 */
    if (typeof CNS !== 'undefined') {
      CNS.has = true; CNS.rows = { c1: { sensitive: { granted_at: '2026-10-01' } } };
    }
    /* ⚠ <b>진짜 자리를 세웁니다</b> — clmOpen 은 #clmHost 에 그립니다. 자리를 안 세우고
       clmSave 를 부르면 칸이 없어 값이 다 빈 채로 읽혀 「적으신 칸이 없습니다」 가
       됩니다. 판 X446 에서 그렇게 재어 멀쩡한 자리를 고발했습니다 (8번).
       ★ <b>#dynPane 안</b>에 세웁니다 — 누르는 자리 44px 규칙이 거기서 섭니다. */
    const pane = document.getElementById('dynPane') || document.body;
    const host = document.createElement('div'); host.id = 'clmHost';
    pane.appendChild(host);
  }, NEED);

  /* ── [1] 묻는 곳 하나 ───────────────────────────────────────── */
  sec('[1] ★★ 「이 분 청구가 무엇인가」 를 <b>묻는 곳이 하나</b>다 (5번)');
  is(/function clmOf\(/.test(SRC), 'clmOf 가 있다');
  const ONE = await page.evaluate(() => {
    CLMW.cid = 'c1'; CLMW.busy = false; CLMW.err = '';
    const out = {};
    CLMW.rows = null;                              out.못읽음 = clmOf('c1');
    CLMW.busy = true; CLMW.rows = [];              out.읽는중 = clmOf('c1');
    CLMW.busy = false; CLMW.rows = [{ id: 'q1' }]; out.한건 = (clmOf('c1') || []).length;
    out.딴사람 = clmOf('zzz');
    return out;
  });
  is(ONE.못읽음 === null && ONE.읽는중 === null,
     '  ★ 못 읽었거나 읽는 중이면 <b>null</b> — 「0건」 이라고 안 한다 (1번)');
  is(ONE.한건 === 1, '  읽었으면 그 줄을 준다');
  is(ONE.딴사람 === null, '  ★ <b>다른 분 것을 안 준다</b> — 읽어 둔 것이 그 분 것이 아니면 null');
  is((SRC.match(/function clmLoad\(/g) || []).length === 1 &&
     /from\('claims'\)\.select|'claims','id,treated_at/.test(SRC.replace(/\s+/g, '')) ||
     /arAll\(sb,'claims'/.test(SRC),
     '  ★ 서버에서 <b>읽는 자도 하나</b>(clmLoad) — 두 곳에서 읽으면 수가 갈립니다 (5번·7번)');

  /* ── [2] 자리 · 탭 다섯 ─────────────────────────────────────── */
  sec('[2] ★ 적는 칸이 <b>보장 탭</b>에 선다 · <b>탭은 여전히 다섯</b>이다');
  is(/cusSec\('cov','<div id="clmHost">'/.test(SRC.replace(/\s+/g, ' ')),
     '🧾 청구 칸이 <b>보장(cov) 탭</b>에 선다');
  const TABS = await page.evaluate(() => ({
    수: (typeof CUS_TABS !== 'undefined') ? CUS_TABS.length : -1,
    이름: (typeof CUS_TABS !== 'undefined') ? CUS_TABS.map(x => x[1]).join(' · ') : '',
    옛clm: (typeof CUS_TAB_OLD !== 'undefined') ? CUS_TAB_OLD.clm : ''
  }));
  is(TABS.수 === 5, '  ★★ 탭이 <b>다섯</b>이다 — ' + TABS.이름 +
     ' (사장님 말씀 2026-10-23 「탭 다섯으로」 · 새 탭을 만들지 않습니다)');
  is(TABS.옛clm === 'cov', "  옛 이름 clm 은 여전히 <b>cov</b> 로 받는다 — 옛 길이 안 끊긴다 (6번)");
  const OPEN = await page.evaluate(async () => {
    CLMW.cid = 'c1'; CLMW.busy = false; CLMW.rows = []; CLMW.err = '';
    const 닫힘 = clmHtml(OSC.current);
    clmOpen('');
    await new Promise(z => setTimeout(z, 140));
    const 열림 = clmHtml(OSC.current);
    clmClose();
    return { 닫힘칸: /clm_diagnosis/.test(닫힘), 열림칸: /clm_diagnosis/.test(열림),
             단추: /＋ 청구/.test(닫힘),
             원: /지급액 \(<b>원<\/b>\)/.test(열림),
             /* ⚠ 이 자가 <b>제 글을 고발했습니다</b> — 화면이 「「보험금을 받으실 수 있습니다」 는
                이 자리에서 말하지 않습니다」 라고 <b>적어 두는</b> 것이 맞는데, 글자만 찾으니 걸렸습니다.
                그 <b>밝히는 문장을 먼저 걷고</b> 봅니다 — 그러면 아무리 밝혀도 안 울고, 정말로
                「받으실 수 있습니다」 라고 <b>말하면</b> 웁니다 (8번 · check-trackc 에서 배운 꼴). */
             받는다: /받으실 수 있|받을 수 있습니다/.test(
               (열림 + 닫힘).replace(/「[^」]*」\s*는\s*<b>이 자리에서 말하지 않습니다<\/b>/g, ' ')),
             말씀: /이 자리에서 말하지 않습니다/.test(닫힘) };
  });
  is(OPEN.닫힘칸 === false && OPEN.단추, '  처음에는 <b>접혀</b> 있고 「＋ 청구」 단추가 선다');
  is(OPEN.열림칸, '  누르면 <b>적는 칸이 펴진다</b>');

  /* ── [3] 규칙이 서기 전에는 안 쓴다 ─────────────────────────── */
  sec('[3] ★★ <b>규칙이 서기 전에는 한 줄도 안 쓴다</b> — 그 전에는 팀장도 청구를 봅니다');
  const RDY = await page.evaluate((need) => {
    const 재자 = (v) => {
      OS.cfg = OS.cfg || {};
      if (v === null) delete OS.cfg.schema_version; else OS.cfg.schema_version = '' + v;
      return clmReady();
    };
    const out = { 섰다: 재자(need), 옛것: 재자(need - 1), 모름: 재자(null) };
    out.옛것글 = (() => { OS.cfg.schema_version = '' + (need - 1);
      CLMW.cid = 'c1'; CLMW.busy = false; CLMW.rows = [];
      return /서버 규칙이 아직 옛 것|시스템 점검 열기/.test(clmHtml(OSC.current)); })();
    OS.cfg.schema_version = '' + need;
    return out;
  }, NEED);
  /* ⚠⚠ <b>이 자가 처음에 울지 않았습니다.</b> 잠금을 일부러 빼고 돌려도 「0줄」 이라
     초록이었습니다 — 까닭은 <b>칸을 세우고 값을 채우지 않아서</b>였습니다. 그러면 잠금이
     없어도 clmSave 가 「적으신 칸이 없습니다」 로 돌아서 아무것도 안 보냅니다.
     즉 <b>안 울리는 알람</b>이었습니다 (8번 · 판 X446 의 check-ctrput 에서 데인 그 병).
     이제 <b>진짜로 적어 넣고</b> 잽니다 — 잠금을 빼면 그 자리에서 웁니다. */
  const 옛보냄 = await page.evaluate(async (need) => {
    OS.cfg.schema_version = '' + (need - 1);
    CLMW.cid = 'c1'; CLMW.busy = false; CLMW.rows = []; CLMW.err = ''; CLMW.id = '';
    CLMW.open = true;
    /* 칸을 <b>강제로</b> 세웁니다 — 옛 서버에서는 clmHtml 이 칸을 안 그리는 것이 맞습니다.
       그래서 자리를 손으로 세워 값을 채우고, 그래도 안 보내는지를 봅니다. */
    const host = document.getElementById('clmHost');
    host.innerHTML = '<input id="clm_diagnosis" value="위염"/>' +
      '<input id="clm_payout_amount" value="3000000"/><select id="clm_status">' +
      '<option value="intake" selected>접수</option></select>' +
      '<input id="clm_treated_at"/><input id="clm_kcd_code"/><input id="clm_treatment"/>' +
      '<input id="clm_surgery"/><select id="clm_admit_type"><option value="" selected></option></select>' +
      '<input id="clm_reduced_or_denied_reason"/>' +
      '<select id="clm_premium_waiver"><option value="" selected></option></select>';
    window.__SENT = [];
    clmSave();
    await new Promise(z => setTimeout(z, 120));
    const n = window.__SENT.filter(x => x.tbl === 'claims').length;
    OS.cfg.schema_version = '' + need; CLMW.open = false; host.innerHTML = '';
    return n;
  }, NEED);
  RDY.옛것보냄 = 옛보냄;
  is(RDY.섰다 === 'ok' && RDY.옛것 === 'old' && RDY.모름 === '',
     "clmReady 가 세 가지를 가른다 — 섰다('ok') · 옛것('old') · <b>모름('')</b> (1번)");
  is(RDY.옛것보냄 === 0, '★★ 옛 서버에서는 <b>한 줄도 안 보낸다</b> (받음 ' + RDY.옛것보냄 + '줄)');
  is(RDY.옛것글, '  화면에 <b>무엇을 하면 되는지</b> 적는다 — 「준비 SQL 47판」 과 가는 길');

  /* ── [4] 민감정보 동의 ─────────────────────────────────────── */
  sec('[4] ★★ <b>민감정보 동의</b>가 없다고 알면 안 쓴다 (설계 11-4) — 그래도 적어 둔 것은 보인다');
  const CNSK = await page.evaluate(() => {
    const 전 = CNS.rows;
    CNS.has = true; CNS.rows = { c1: {} };          /* 안다 · 안 받았다 */
    CLMW.cid = 'c1'; CLMW.busy = false; CLMW.open = true; CLMW.id = '';
    CLMW.rows = [{ id: 'q9', diagnosis: '위염', treated_at: '2026-05-02', status: 'paid', payout_amount: 300000 }];
    /* ⚠ [3] 과 같은 병을 여기서도 고쳤습니다 — 칸을 안 세우면 잠금이 없어도 0줄입니다 (8번) */
    const host = document.getElementById('clmHost');
    host.innerHTML = '<input id="clm_diagnosis" value="위염"/>' +
      '<input id="clm_payout_amount" value="3000000"/><select id="clm_status">' +
      '<option value="intake" selected>접수</option></select>' +
      '<input id="clm_treated_at"/><input id="clm_kcd_code"/><input id="clm_treatment"/>' +
      '<input id="clm_surgery"/><select id="clm_admit_type"><option value="" selected></option></select>' +
      '<input id="clm_reduced_or_denied_reason"/>' +
      '<select id="clm_premium_waiver"><option value="" selected></option></select>';
    window.__SENT = [];
    clmSave();
    host.innerHTML = '';
    const h = clmHtml(OSC.current);
    const out = { 보냄: window.__SENT.filter(x => x.tbl === 'claims').length,
                  잠금글: /동의가 (없어|철회되어)/.test(h),
                  적어둔것: /위염/.test(h),
                  단추: /＋ 청구/.test(h) };
    CNS.rows = 전; CLMW.open = false;
    return out;
  });
  is(CNSK.보냄 === 0, '동의가 없다고 <b>아는</b> 때는 한 줄도 안 보낸다 (받음 ' + CNSK.보냄 + '줄)');
  is(CNSK.잠금글, '  그 자리에서 <b>「✅ 동의 적기」</b> 로 보낸다 (설계 11-4)');
  is(CNSK.적어둔것, '  ★ 그래도 <b>이미 적어 둔 청구는 보인다</b> — 감추면 지울 길이 사라집니다 (6번)');
  is(CNSK.단추 === false, '  잠겨 있으면 「＋ 청구」 단추는 <b>안 선다</b> — 눌러도 안 되는 단추를 안 둡니다');

  /* ── [5]·[6] 빈 칸은 null · 원 단위 · 이름 안 보냄 ──────────── */
  sec('[5]·[6] ★★ <b>빈 칸은 null</b> · 지급액은 원 · <b>이름 · 주민번호를 안 보낸다</b>');
  is(OPEN.원, '지급액 칸 이름에 <b>원</b>이 적혀 있다 (4번) — 만원이 아닙니다');
  is(!/id="clm_(policyholder|insured|name|rrn)"/.test(SRC),
     '★★ <b>이름 · 주민번호를 적는 칸이 없다</b> (3번)');
  const PUT = await page.evaluate(async () => {
    CLMW.cid = 'c1'; CLMW.busy = false; CLMW.rows = []; CLMW.err = ''; CLMW.id = '';
    window.__SENT = [];
    clmOpen('');
    await new Promise(z => setTimeout(z, 160));
    const set = (k, v) => { const e = document.getElementById('clm_' + k); if (e) e.value = v; };
    /* 진단명과 지급액만 적고 <b>나머지는 비웁니다</b> */
    set('diagnosis', '위염'); set('payout_amount', '3000000');
    clmSave();
    await new Promise(z => setTimeout(z, 120));
    const 보낸것 = window.__SENT.filter(x => x.tbl === 'claims');
    /* 빈 칸으로 또 눌러 보기 — <b>아무것도 안 가야</b> 합니다 */
    window.__SENT = [];
    clmOpen('');
    await new Promise(z => setTimeout(z, 160));
    clmSave();
    await new Promise(z => setTimeout(z, 80));
    const 빈것 = window.__SENT.filter(x => x.tbl === 'claims').length;
    clmClose();
    return { row: (보낸것[0] || {}).row || null, 몇: 보낸것.length, 빈것: 빈것,
             키: 보낸것[0] ? Object.keys(보낸것[0].row) : [] };
  });
  is(PUT.몇 === 1 && PUT.row, '적어 넣기를 누르면 <b>한 줄이 간다</b> (받음 ' + PUT.몇 + '줄)');
  if (PUT.row) {
    const r = PUT.row;
    is(r.payout_amount === 3000000,
       '★ 지급액이 <b>원 그대로</b> 간다 — ' + r.payout_amount + ' (만원이면 300 이었을 것입니다 · 4번)');
    is(r.diagnosis === '위염', '  적은 칸은 그대로 간다');
    is(r.treated_at === null && r.kcd_code === null && r.surgery === null,
       '★★ <b>안 적은 칸은 null</b> 이다 (1번) — 빈 글자도 0 도 아닙니다');
    is(r.payout_amount !== 0, '  ★ 지급액을 0 으로 안 만든다 — 0 이면 <b>「부지급」 과 구별이 안 됩니다</b>');
    is(r.premium_waiver === null, '  ★ 납입면제도 안 고르면 <b>null</b> — 「아니오」 로 단정하지 않습니다 (1번)');
    is(r.status === 'intake', '  상태를 안 고르면 <b>접수(intake)</b> — 서버 기본값과 같습니다');
    is(r.client_id === 'c1', '  어느 분 것인지 붙여 보낸다');
    is(!('policyholder' in r) && !('insured' in r) && !('name' in r) && !('rrn' in r),
       '★★ 보내는 줄에 <b>이름 · 주민번호가 없다</b> (3번) — 받음: ' + PUT.키.join(' · '));
  }
  is(PUT.빈것 === 0, '★★ 한 칸도 안 적으면 <b>빈 줄을 안 만든다</b> (받음 ' + PUT.빈것 + '줄) — 「청구 1건」 이 거짓이 됩니다');

  /* ── [7] 받을 수 있다고 말하지 않는다 ──────────────────────── */
  sec('[7] ★★ <b>「받으실 수 있습니다」 를 안 적는다</b> (1번 · 말씀 X131)');
  is(OPEN.받는다 === false, '화면에 「받으실 수 있습니다」 가 <b>없다</b> — 병원 기록과 약관을 봐야 아는 일입니다');
  is(OPEN.말씀, '  그렇다고 <b>입을 다물지 않는다</b> — 왜 여기서 말하지 않는지 적는다 (1번)');

  /* ── [8] 고친 뒤 다시 읽는다 ───────────────────────────────── */
  sec('[8] ★ 고친 뒤 <b>읽는 자를 다시 부른다</b> — 옛 값이 남으면 안 들어간 줄 아십니다');
  const SAVE = SRC.slice(SRC.indexOf('function clmSave()'), SRC.indexOf('function clmDel()'));
  is(/clmLoad\(true\)/.test(SAVE), 'clmSave 가 clmLoad(true) 를 부른다');
  const DEL = SRC.slice(SRC.indexOf('function clmDel()'), SRC.indexOf('function clmDel()') + 1200);
  is(/clmLoad\(true\)/.test(DEL), '  지운 뒤에도 다시 읽는다');

  /* ── [9] 상태 표 한 곳 ─────────────────────────────────────── */
  sec('[9] ★ 상태 이름이 <b>표 한 곳</b>(CLM_ST)에서 오고 서버 enum 일곱과 같다');
  const ST = await page.evaluate(() => ({
    키: (typeof CLM_ST !== 'undefined') ? CLM_ST.map(x => x[0]) : [],
    글: (typeof CLM_ST !== 'undefined') ? CLM_ST.map(x => x[1]).join(' · ') : '',
    한글: (typeof clmStName === 'function') ? clmStName('supplement') : ''
  }));
  is(ST.키.join(',') === 서버상태.join(','),
     'CLM_ST 가 서버 enum 일곱과 <b>같다</b> — ' + ST.글 +
     (ST.키.join(',') === 서버상태.join(',') ? '' : ' ← 받음: ' + ST.키.join(',')));
  is(ST.한글 === '보완 필요', '  이름을 바꾸는 자도 <b>그 표</b>를 본다 (5번) — supplement → ' + ST.한글);

  /* ── [10] 옛 청구 이력을 안 지웠다 ─────────────────────────── */
  sec('[10] ★ 이 기기에만 있던 <b>옛 청구 이력을 안 지웠다</b> (6번)');
  ['cmClmOf', 'cmClmRowsHtml', 'cmClmSave', 'cmClmWipe'].forEach(n =>
    is(new RegExp('function ' + n + '\\(').test(SRC), '  ' + n + ' 이 그대로 있다'));
  const 가리킴 = await page.evaluate(() => {
    const 전 = window.cmClmOf;
    window.cmClmOf = function () { return [{ d: '2026-01-01' }, { d: '2026-02-01' }]; };
    CLMW.cid = 'c1'; CLMW.busy = false; CLMW.rows = [];
    const h = clmHtml(OSC.current);
    window.cmClmOf = 전;
    return /이 기기에만 적어 둔 옛 청구 이력 <b>2건<\/b>/.test(h);
  });
  is(가리킴, '  ★ 기기에 있는 것이 <b>몇 건인지 · 어디 있는지</b> 가리킨다 (5번 — 두 곳에 각자 적지 않게)');

  /* ── [11] 손가락이 닿는다 ──────────────────────────────────── */
  sec('[11] ★ 누르는 자리 44px');
  const 작은 = await page.evaluate(async () => {
    CLMW.cid = 'c1'; CLMW.busy = false; CLMW.rows = []; CLMW.err = '';
    clmOpen('');
    await new Promise(z => setTimeout(z, 200));
    const host = document.getElementById('clmHost');
    const L = [].slice.call(host.querySelectorAll('button,select,input'));
    return L.map(e => ({ t: (e.textContent || e.id || '').slice(0, 22),
                         h: Math.round(e.getBoundingClientRect().height) }))
            .filter(o => o.h > 0 && o.h < 44);
  });
  is(작은.length === 0, '44px 아래가 <b>' + 작은.length + '개</b>' +
     (작은.length ? (' ← ' + 작은.map(o => o.h + 'px 「' + o.t + '」').join(' / ')) : ''));
  is(errs.length === 0, '재는 동안 <b>터진 곳이 없다</b>' +
     (errs.length ? (' ← ' + errs.slice(0, 2).join(' / ')) : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데가 걸렸습니다.'); process.exit(1); }
  console.log('✓ 청구를 서버에 적을 수 있고, 규칙이 서기 전에는 한 줄도 안 씁니다 — 담당자와 관리자만 봅니다.');
})().catch(e => { console.error('터짐: ' + e.message); try { srv.close(); } catch (x) {} process.exit(1); });
