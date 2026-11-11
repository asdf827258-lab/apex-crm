/* ✏️ <b>첫 마디를 사장님이 고치고 팀이 함께 쓰나</b> — 판 X412

   사장님 말씀 (2026-11-11) — 「<b>보장분석 신청 한 사람들 멘트가 너무
   별로여서 내가 수정하고 공유</b>할수 있도록 만들어, <b>수정은 오직
   운영자만</b> 가능하도록」

   ── 짜임새 ───────────────────────────────────────────────────────
   원래 말은 apex-stage.js 의 TA_SRC 에 <b>그대로</b> 둡니다. 서버 표
   stage_says 는 <b>덮개 한 겹</b>이고, 줄을 지우면 원래 말이 다시 섭니다.
   묻는 자는 <b>taSay 하나</b>라 한 번 고치시면 홈 한 줄 · 긴 멘트 카드 ·
   📋 복사가 한꺼번에 바뀝니다.

   ── 보는 것 ──────────────────────────────────────────────────────
     [1] ★★ 고치면 <b>세 자리가 한꺼번에</b> 바뀌나 (5번)
         ★★ 안 고친 칸은 <b>원래 말 그대로</b>인가 (1번)
     [2] ★★ 대표가 아니면 <b>고치는 단추가 안 서나</b> · 그래도 <b>읽히나</b> (6번)
         ★★★ <b>서버가 막나</b> — 화면만 가린 것이 아님(RLS 글로 확인)
         ★★ 서버가 막으면 <b>막혔다고 적나</b> — 조용히 성공한 척하지 않나 (1번)
     [3] ★★ <b>되돌릴 길</b>이 있나 — 줄을 지우고 원래 말이 서나 (6번)
     [4] ★★ 서버를 <b>되풀이해 안 부르나</b> (7번) · 받아 둔 것이 먼저 서나
     [5] ★★ 갈래 목록을 <b>여기서 또 안 적나</b> — apex-stage 가 쥔 그대로 (5번)
     [6] ★ 고객 이름·번호가 <b>서버로 안 나가나</b> (3번)

   ★ 사장님 진짜 서버는 안 읽습니다. 견본 이름은 홍길동 집안입니다 (3번). */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
               '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
               '.svg':'image/svg+xml', '.png':'image/png', '.webmanifest':'application/json' };
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

/* 가짜 서버 — stage_says 한 표. <b>대표인지</b>를 서버가 스스로 가립니다(RLS 흉내). */
const SEED = (owner) => {
  window.toast = m => { window.__T = m; };
  window.__DB = { stage_says: [] };
  window.__CALLS = [];
  window.__OWNER = owner;
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '윤시현', role: owner ? 'admin' : 'member', active: true };
  window.osIsOwner = function () { return !!window.__OWNER; };
  window.osAudit = function () {};
  window.osClient = function () {
    const mk = t => { const st = { t, op: '', pay: null, eq: {} }; const a = {
      insert: q => { st.op = 'insert'; st.pay = q; return a; },
      update: q => { st.op = 'update'; st.pay = q; return a; },
      upsert: q => { st.op = 'upsert'; st.pay = q; return a; },
      'delete': () => { st.op = 'delete'; return a; },
      select: () => a, eq: (k, v) => { st.eq[k] = v; return a; },
      order: () => a, range: () => a, limit: () => a, single: () => a,
      is: () => a, not: () => a, neq: () => a, gte: () => a, lte: () => a, 'in': () => a, or: () => a,
      then: (o, n) => {
        window.__CALLS.push((st.op || 'select') + ' ' + st.t);
        const T = window.__DB[st.t] || (window.__DB[st.t] = []);
        if (!st.op) return Promise.resolve({ data: T.map(x => Object.assign({}, x)), error: null }).then(o, n);
        /* ★ 쓰기는 <b>서버가</b> 가립니다 — 화면을 뚫어도 여기서 막힙니다 (RLS is_owner()) */
        if (!window.__OWNER)
          return Promise.resolve({ error: { message: 'new row violates row-level security policy for table "stage_says"' } }).then(o, n);
        if (st.op === 'upsert') {
          const rows = [].concat(st.pay || []);
          rows.forEach(x => { const i = T.findIndex(y => y.k === x.k);
            if (i >= 0) T[i] = Object.assign({}, T[i], x); else T.push(Object.assign({}, x)); });
          return Promise.resolve({ data: [], error: null }).then(o, n);
        }
        if (st.op === 'delete') {
          for (let i = T.length - 1; i >= 0; i--) {
            let hit = true; Object.keys(st.eq).forEach(k => { if (T[i][k] !== st.eq[k]) hit = false; });
            if (hit) T.splice(i, 1);
          }
          return Promise.resolve({ data: [], error: null }).then(o, n);
        }
        return Promise.resolve({ data: [], error: null }).then(o, n);
      } }; return a; };
    return { from: t => mk(t), rpc: () => Promise.resolve({ data: null, error: null }) };
  };
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = [];
  try { localStorage.removeItem('apex_tsay_v1'); } catch (e) {}
  try { osHideLoginGate(); } catch (e) {}
  go('home');
};
const FEED = () => {
  const d = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
  AR.db = arDbCalc([
    { id:'db-1', assigned_to:'me', customer_name:'홍길동', region:'서울', dong:'역삼동',
      phone:'010-1000-2000', source:'보장분석', assigned_date:d(9), next_appt:null }
  ], []);
  AR.loaded = true; AR.err = '';
  try { osHideLoginGate(); } catch (e) {}
  go('home');
};
const 새말 = '고객님, 신청하신 보장분석 건으로 연락드렸습니다. 이번 주 중에 10분만 뵐 수 있을까요.';

const open = async (pg, who) => {
  const ctx = await pg.context().browser().newContext({ viewport: { width: 390, height: 844 } });
  return ctx;
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });

  /* ── 대표로 ───────────────────────────────────────────── */
  const c1 = await br.newContext({ viewport: { width: 390, height: 844 } });
  await c1.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + port) >= 0 ? r.continue() : r.abort());
  const pg = await c1.newPage();
  const errs = []; pg.on('pageerror', e => errs.push('' + e.message));
  await pg.goto(`http://127.0.0.1:${port}/app/index.html`, { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => typeof go === 'function' && typeof tsayOpen === 'function', { timeout: 30000 });
  await pg.evaluate(SEED, true); await pg.waitForTimeout(900);
  await pg.evaluate(FEED); await pg.waitForTimeout(1400);

  console.log('\n[5] 🗂 <b>갈래 목록은 apex-stage 가 쥔 그대로</b>다 (5번)');
  const keys = await pg.evaluate(() => ({
    mine: tsayKeys(),
    stage: APEX_STAGE.taSrc.map(x => x.k).concat([APEX_STAGE.taAny.k]) }));
  console.log('      ' + keys.mine.join(' · '));
  is(keys.mine.length === keys.stage.length && keys.mine.every((k, i) => k === keys.stage[i]),
     '  목록을 <b>여기서 또 안 적는다</b> — ' + keys.mine.length + '갈래가 한 글자도 안 다르다');

  console.log('\n[1] ✏️ <b>고치면 세 자리가 한꺼번에</b> 바뀐다 (5번)');
  const before = await pg.evaluate(() => {
    const one = document.querySelector('.hm-how .hm-how-t');
    return { 한줄: one ? one.innerText.replace(/\s+/g, ' ').trim() : '',
             말: APEX_STAGE.script('TA', '보장분석').say.split('\n')[0],
             제목: APEX_STAGE.script('TA', '보장분석').t };
  });
  await pg.evaluate(async (say) => {
    tsayOpen('보장분석');
    await new Promise(r => setTimeout(r, 400));
    document.getElementById('tsaySay').value = say;
    tsaySave();
    await new Promise(r => setTimeout(r, 700));
  }, 새말);
  await pg.waitForTimeout(900);
  const after = await pg.evaluate(() => {
    const one = document.querySelector('.hm-how .hm-how-t');
    const S = APEX_STAGE.script('TA', '보장분석');
    let 복사 = '';
    try { const r = hmNext(), x = r && r.x;
      복사 = x ? (APEX_STAGE.script(hmTaKind(x), hmSrcOf(x)).say || '') : ''; } catch (e) {}
    return { 한줄: one ? one.innerText.replace(/\s+/g, ' ').trim() : '',
             말: S.say.split('\n')[0], 제목: S.t, 복사: 복사.split('\n')[0],
             서버: (window.__DB.stage_says || []).length,
             토스트: window.__T || '' };
  });
  console.log('      전 : ' + before.한줄.slice(0, 44));
  console.log('      후 : ' + after.한줄.slice(0, 44));
  is(after.말.indexOf('10분만') >= 0, '  ★★ 말이 <b>고친 말</b>로 바뀐다');
  is(after.한줄.indexOf('10분만') >= 0, '  ★★ <b>홈 한 줄</b>도 같이 바뀐다 — 묻는 자가 하나라서 (5번)');
  is(after.복사.indexOf('10분만') >= 0, '  ★★ <b>📋 복사</b>도 같은 말을 베낀다');
  is(after.제목 === before.제목, '  ★★ <b>안 고친 칸(제목)은 원래 말 그대로</b> (1번) — 「' + after.제목 + '」');
  /* ★★ ⚠ 처음에 이 자가 <b>안 울었습니다</b> — 저장은 세 칸을 늘 다 쓰므로
     「칸이 빈」 경우를 한 번도 안 지났습니다. 덮개를 직접 끼워 그 경우만 봅니다 (8번). */
  const 빈칸 = await pg.evaluate((say) => {
    const B = APEX_STAGE.taSayBase('보장분석');
    APEX_STAGE.taSayOver({ 보장분석: { say: say, t: '', tip: '' } });
    const S = APEX_STAGE.script('TA', '보장분석');
    const out = { t: S.t, tip: S.tip, say: S.say.split('\n')[0], bt: B.t, btip: B.tip };
    APEX_STAGE.taSayOver(null);
    return out;
  }, 새말);
  is(빈칸.t === 빈칸.bt && 빈칸.tip === 빈칸.btip && 빈칸.say.indexOf('10분만') >= 0,
     '  ★★★ <b>칸을 비워 둔 것은 「지운 것」 이 아니다</b> — 제목·조언이 원래 말로 선다 (1번) — 「' + 빈칸.t + '」');
  is(after.서버 === 1, '  서버에 <b>한 줄</b>만 담긴다 — ' + after.서버 + '줄');
  const 안나감 = await pg.evaluate(() => JSON.stringify(window.__DB.stage_says || []));
  is(!/홍길동|010-/.test(안나감), '  ★ 고객 <b>이름·번호가 서버로 안 나간다</b> (3번)');

  console.log('\n[3] ↩️ <b>원래 말로 되돌릴 길</b>이 있다 (6번)');
  /* ⚠ 처음엔 서버 줄만 보아, <b>단추를 떼어도 안 울었습니다</b> — 길이 화면에
     서는지를 먼저 봅니다. 길이 없으면 되돌릴 방법이 없습니다 (6번 · 8번). */
  const undo = await pg.evaluate(async () => {
    tsayOpen('보장분석'); await new Promise(r => setTimeout(r, 450));
    const box = document.getElementById('tsaySheet');
    const b = box ? [...box.querySelectorAll('button')].find(x => /원래 말로/.test(x.innerText || '')) : null;
    return { 있나: !!b, px: b ? Math.round(b.getBoundingClientRect().height) : 0 };
  });
  is(undo.있나, '  ★★ 고친 갈래에 <b>「원래 말로」 단추가 선다</b> — 길이 없으면 되돌릴 수 없다 (6번)');
  is(undo.px >= 44, '  단추가 <b>손가락에 닿는다</b> — ' + undo.px + 'px');
  await pg.evaluate(async () => { tsayReset(); await new Promise(r => setTimeout(r, 700)); });
  await pg.waitForTimeout(800);
  const back = await pg.evaluate(() => ({
    말: APEX_STAGE.script('TA', '보장분석').say.split('\n')[0],
    서버: (window.__DB.stage_says || []).length }));
  is(back.말 === before.말, '  ★★ <b>처음 말</b>이 다시 선다 — 「' + back.말.slice(0, 30) + '…」');
  is(back.서버 === 0, '  서버 줄이 <b>지워진다</b> — ' + back.서버 + '줄');

  console.log('\n[4] 🔌 <b>서버를 되풀이해 안 부른다</b> (7번)');
  const n1 = await pg.evaluate(() => { window.__CALLS.length = 0; go('home'); return 0; });
  await pg.waitForTimeout(1200);
  await pg.evaluate(() => go('home')); await pg.waitForTimeout(1200);
  const calls = await pg.evaluate(() => window.__CALLS.filter(x => /stage_says/.test(x)).length);
  is(calls === 0, '  홈을 <b>두 번 더 그려도</b> stage_says 를 안 부른다 — ' + calls + '번');
  const cache = await pg.evaluate(() => { try { return !!JSON.parse(localStorage.getItem('apex_tsay_v1') || 'null'); } catch (e) { return false; } });
  is(cache, '  받아 둔 것이 <b>이 기기에 남는다</b> — 다음에 바로 선다');
  /* ★★ <b>하루에 한 번</b>인가 — 앱을 새로 켜도 그날 두 번째부터는 안 묻습니다.
     check-boot 의 「홈 처음」 눈금을 하나 쓰는 자리라, 그 한 번이 정말
     하루치인지 여기서 잽니다 (7번). */
  const 하루 = await pg.evaluate(() => {
    TSAY.loaded = false;                 /* 앱을 새로 켠 셈 */
    window.__CALLS.length = 0;
    const before = tsayFresh();
    tsayLoad(false, null);
    return { fresh: before, n: window.__CALLS.filter(x => /stage_says/.test(x)).length };
  });
  await pg.waitForTimeout(500);
  const 하루n = await pg.evaluate(() => window.__CALLS.filter(x => /stage_says/.test(x)).length);
  is(하루.fresh && 하루n === 0,
     '  ★★ <b>하루에 한 번</b>이다 — 앱을 새로 켜도 그날 두 번째부터 ' + 하루n + '번 (7번)');

  console.log('\n[2] 🔒 <b>오직 운영자만</b> 고친다');
  const ownerBtn = await pg.evaluate(() => {
    hmTaCss();
    return /hm-ta-ed/.test(tsayEditBtn('보장분석'));
  });
  is(ownerBtn, '  대표에게는 ✏️ 단추가 <b>선다</b>');

  /* ── 팀원으로 — 같은 서버, 다른 사람 ─────────────────── */
  const c2 = await br.newContext({ viewport: { width: 390, height: 844 } });
  await c2.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + port) >= 0 ? r.continue() : r.abort());
  const pg2 = await c2.newPage();
  const errs2 = []; pg2.on('pageerror', e => errs2.push('' + e.message));
  await pg2.goto(`http://127.0.0.1:${port}/app/index.html`, { waitUntil: 'domcontentloaded' });
  await pg2.waitForFunction(() => typeof go === 'function' && typeof tsayOpen === 'function', { timeout: 30000 });
  await pg2.evaluate(SEED, false); await pg2.waitForTimeout(900);
  await pg2.evaluate(FEED); await pg2.waitForTimeout(1200);

  const mem = await pg2.evaluate(async () => {
    tsayOpen('보장분석');
    await new Promise(r => setTimeout(r, 500));
    const box = document.getElementById('tsaySheet');
    const t = box ? box.innerText.replace(/\s+/g, ' ') : '';
    return { 열림: !!(box && box.classList.contains('on')),
             단추: /hm-ta-ed/.test(tsayEditBtn('보장분석')),
             저장단추: !!(box && [...box.querySelectorAll('button')].find(b => /저장/.test(b.innerText))),
             /* ⚠ 처음엔 innerText 로 봤는데 멘트는 <b>textarea 안</b>이라
                안 잡혔습니다 — 앱이 아니라 제 자가 틀렸습니다 (8번). */
             읽힘: /안녕하세요/.test((document.getElementById('tsaySay') || {}).value || ''),
             글: t.slice(0, 70),
             칸잠김: !!(document.getElementById('tsaySay') || {}).readOnly };
  });
  is(!mem.단추, '  ★★ 팀원에게는 ✏️ 단추가 <b>안 선다</b> — 눌러도 안 되는 단추는 안 세운다');
  is(!mem.저장단추, '  ★★ 팀원 화면에는 <b>저장 단추가 없다</b>');
  is(mem.칸잠김, '  ★ 적는 칸이 <b>잠겨</b> 있다');
  is(mem.읽힘, '  ★★ 그래도 <b>읽을 수는 있다</b> — 지운 것이 아니다 (6번)');
  is(/대표만 고칠 수 있습니다/.test(mem.글), '  ★ <b>왜 못 고치는지</b> 적는다 (1번) — 「' + mem.글.slice(0, 40) + '…」');

  const 뚫기 = await pg2.evaluate(async () => {
    /* ★★★ <b>화면을 뚫고</b> 저장해 봅니다 — 서버가 막아야 합니다 */
    window.osIsOwner = function () { return true; };
    tsayOpen('보장분석');
    await new Promise(r => setTimeout(r, 400));
    document.getElementById('tsaySay').value = '몰래 고친 말';
    tsaySave();
    await new Promise(r => setTimeout(r, 800));
    const box = document.getElementById('tsaySheet');
    return { 담김: (window.__DB.stage_says || []).length,
             적힘: box ? /서버가 받지 않았습니다/.test(box.innerText) : false,
             글: box ? (box.innerText.match(/서버가 받지 않았습니다[^\n]*/) || [''])[0] : '' };
  });
  is(뚫기.담김 === 0, '  ★★★ 화면을 뚫어도 <b>서버가 막는다</b> — 담긴 줄 ' + 뚫기.담김 + '개 (RLS is_owner())');
  is(뚫기.적힘, '  ★★ 막히면 <b>막혔다고 적는다</b> — 조용히 성공한 척하지 않는다 (1번)');
  if (뚫기.글) console.log('      ' + 뚫기.글.slice(0, 80));

  console.log('\n[6] 🧨 <b>터진 것이 없다</b>');
  const all = errs.concat(errs2);
  is(all.length === 0, all.length ? ('  콘솔 에러 — ' + all.slice(0, 3).join(' | ')) : '  콘솔 에러 <b>없음</b>');

  console.log('\n' + (bad ? ('✗ 첫 마디 고치기 — 고칠 자리 ' + bad + '곳') :
    '✓ 대표만 고치고, 고치면 팀 모두가 같은 말을 씁니다'));
  await br.close(); srv.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.error('터짐: ' + e.message); process.exit(2); });
