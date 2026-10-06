/* ══════════════════════════════════════════════════════════════════
   check-setopen.js — <b>서버 손이 모자라도 설정 화면은 선다.</b>

      node scripts/check-setopen.js

   ── 왜 이 자를 세웠나 — <b>눈먼 화면이 하나 있었습니다</b> ────────────
   말씀대장에 <b>⛔[아직:X02-설정]</b> 로 「설정 화면을 점검 껍데기에서 못 열어
   안 쟀다」 고 적어 두었습니다. 쫓아가 보니 <b>점검 탓이 아니라 진짜 탈</b>이었습니다 —

     TypeError: sb.rpc is not a function
       at osAcLoad → osSettingsAfterRender → go

   서버 꾸러미를 못 받아 오면(CDN 끊김 · 옛 사본) osClient() 는 <b>손을 주지만
   그 손이 rpc 를 못 합니다.</b> osAcLoad 는 `if(!sb)` 만 막고 있어서 그 한 줄이
   <b>go() 까지 올라가 설정 화면 전체가 안 섰습니다.</b>
   <b>사장님이 열쇠·한도 수를 넣으려고 들어오는 바로 그 화면</b>입니다.

   더 나쁜 것 — 관리자 묶음 <b>여섯</b>(osLoadApprovals · osLoadMembers ·
   osAcLoad · osSecurityAfterRender · osNSeenLoad · osBackupLoad)이 <b>맨몸</b>으로
   불려, 하나만 터져도 화면이 안 섰습니다. 그래서 <b>어느 자도 이 화면을 재지
   못하는 눈먼 자리</b>였습니다 — 안 울리는 알람은 알람이 아닙니다 (8번).

   ── 고친 법 ───────────────────────────────────────────────────────
     ① osAcLoad 가 <b>sb.rpc 가 없는 경우</b>도 막고, 터지지 말고
        「서버 꾸러미를 아직 못 받았습니다」 라고 적습니다(있는 osAcErrHtml).
     ② <b>osSetLoad(이름, fn)</b> — 짐을 하나씩 싣되 <b>조용히 삼키지 않습니다.</b>
        못 실린 것을 OS_SET_FAIL 에 들고 있다가 <b>toast 로 말합니다.</b>
        CLAUDE.md 5번이 적어 둔 사고가 바로 조용히 삼킨 것입니다 —
        renderConsultingGuide 가 터진 뒤 try/catch 에 삼켜져 아무도 못 찾았습니다.

   ── ★★ <b>두 겹이고, 겹마다 자가 따로 있어야 합니다</b> ──────────────
   되돌림으로 알았습니다 — <b>sb.rpc 막기를 지워도 [1] 은 초록</b>입니다.
   <b>감싸기(osSetLoad)가 받아 내기 때문</b>입니다. 그러면 「화면은 선다」 만
   보는 자는 <b>안쪽 구멍이 다시 열려도 조용합니다.</b>
   그래서 <b>[5] 가 따로</b> 있습니다 — 겹마다 자를 둡니다. 겉만 보면
   「안 터지니까 됐다」 로 넘어가고, 그것이 안 울리는 알람입니다 (8번).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ 서버 손이 <b>rpc 를 못 해도</b> 설정이 선다 (그때 터졌습니다)
     [2] ★ 서버 손이 <b>아예 없어도</b> 선다
     [3] ★★ 못 읽은 칸을 <b>말한다</b> — OS_SET_FAIL 에 담기고 toast 를 부른다
     [4] ★ 관리자 묶음 여섯이 <b>다 osSetLoad 를 지난다</b> (맨몸이 없다)
     [5] ★ 다시 불러오기 단추가 <b>그대로 선다</b> — 할 일이 있는데 감추지
         않습니다 (6번)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9077;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const SRC = fs.readFileSync('app/index.html', 'utf8');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webmanifest': 'application/json' };

/* ── 씨 — 로그인한 <b>운영자</b>로 둡니다. 관리자 묶음이 돌아야 그 자리를
      잴 수 있습니다. 견본 이름은 「홍길동」 (3번).
   ★ <b>손 모양</b>을 골라 줍니다 — 'rpc없음' · '없음' · '멀쩡'.          */
const SEED = (kind) => {
  try { localStorage.setItem('apex_login_ok', '1'); } catch (e) {}
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  ['osLoadProfile', 'osProfileApply', 'osShowLoginGate', 'arLoad', 'osLoadClients',
   'osCliInfoLoad', 'osRepListLoad', 'osLoadAnalysis', 'nlLoad'].forEach(k => { window[k] = function () {}; });
  window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.osTabAllowed = function () { return true; };
  window.setupDone = function () { return true; }; window.setupCanRun = function () { return true; };
  OS.profile = { id: 'me', user_id: 'me', name: '홍길동', role: 'owner', active: true, plan: 'vip', team_id: 't1' };
  OS.session = { user: { id: 'me' } };
  /* toast 를 <b>불렀는지</b> 적어 둡니다 — 조용히 삼키지 않았는지 보는 자리 */
  window.__toasts = [];
  window.toast = function (t) { window.__toasts.push(String(t)); };
  const chain = v => { const o = { then: function (f, g) { try { f(v); } catch (e) {} return o; },
                                   catch: function () { return o; } };
    ['eq','neq','select','order','limit','in','gte','lte','is','not','or','filter',
     'ilike','like','range','contains','overlaps'].forEach(k => { o[k] = function () { return o; }; });
    o.single = function () { return chain({ data: null }); };
    o.maybeSingle = function () { return chain({ data: null }); }; return o; };
  const from = function () { return {
    select: function () { return chain({ data: [], count: 0 }); },
    update: function () { return chain({}); }, insert: function () { return chain({}); },
    upsert: function () { return chain({}); }, delete: function () { return chain({}); } }; };
  if (kind === '없음') window.osClient = function () { return null; };
  else if (kind === 'rpc없음') window.osClient = function () { return { from: from }; };   /* ★ rpc 가 없습니다 */
  else window.osClient = function () { return { from: from, rpc: function () { return chain({ data: [] }); } }; };
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = [];
  CM.loaded = true; CM.meta = {};
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.db = [];
};

(async () => {
  const srv = http.createServer((q, s) => {
    const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    fs.readFile(f, (e, b) => { if (e) { s.writeHead(404); s.end(''); }
      else { s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); s.end(b); } });
  });
  await new Promise(r => srv.listen(PORT, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  /* 바깥 망을 막습니다 — <b>그날 망 사정</b>을 재지 않으려고 (8번) */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());

  const 열어본다 = async (kind) => {
    const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', e => errs.push(String(e.message || e).slice(0, 160)));
    await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(2500);
    await pg.evaluate(([f, k]) => { eval('(' + f + ')')(k); }, [SEED.toString(), kind]);
    await pg.waitForTimeout(600);
    let 터짐 = '';
    try { await pg.evaluate(() => { go('settings'); }); }
    catch (e) { 터짐 = String(e.message || e).slice(0, 170); }
    await pg.waitForTimeout(1200);
    const r = await pg.evaluate(() => {
      const d = document.getElementById('dynPane');
      return { 잎: d ? d.querySelectorAll('*').length : -1,
               글: (d && d.textContent || '').trim().length,
               실패: (window.OS_SET_FAIL || []).slice(0, 4),
               토스트: (window.__toasts || []).slice(0, 3),
               다시단추: !!document.querySelector('[onclick*="osAcLoad"]') };
    });
    await pg.close();
    return Object.assign(r, { 터짐: 터짐, 콘솔: errs.length });
  };

  console.log('[1] ★★ 서버 손이 <b>rpc 를 못 해도</b> 설정이 선다');
  const a = await 열어본다('rpc없음');
  is(!a.터짐, '  go(\'settings\') 가 <b>안 터진다</b>' + (a.터짐 ? ' ← ' + a.터짐 : ''));
  is(a.잎 > 200, '  화면이 <b>섰다</b> — 잎 ' + a.잎 + '개 · 글 ' + a.글 + '자 (200개 아래면 빈 껍데기입니다)');

  console.log('\n[2] ★ 서버 손이 <b>아예 없어도</b> 선다');
  const b = await 열어본다('없음');
  is(!b.터짐, '  go(\'settings\') 가 <b>안 터진다</b>' + (b.터짐 ? ' ← ' + b.터짐 : ''));
  is(b.잎 > 200, '  화면이 <b>섰다</b> — 잎 ' + b.잎 + '개');

  console.log('\n[3] ★★ 못 읽은 칸을 <b>말한다</b> — 조용히 삼키지 않는다 (1번·5번)');
  is(Array.isArray(a.실패), '  OS_SET_FAIL 을 <b>들고 있다</b>');
  const 말했나 = a.실패.length === 0 || a.토스트.length > 0;
  is(말했나, '  ★★ 못 실린 칸이 있으면 <b>toast 로 말한다</b> — 못 실린 것 ' +
     a.실패.length + '칸 · 한 말 ' + a.토스트.length + '번' +
     (말했나 ? (a.실패.length ? ' · ' + a.실패[0].slice(0, 60) : ' (다 실렸습니다)')
             : ' ← 터진 것을 <b>조용히 삼켰습니다</b>. CLAUDE.md 5번의 그 사고입니다'));

  console.log('\n[4] ★ 관리자 묶음이 <b>다 osSetLoad 를 지난다</b> — 맨몸이 없다');
  is(/function\s+osSetLoad\s*\(/.test(SRC), '  osSetLoad 가 <b>있다</b>');
  const 몸 = (SRC.match(/function\s+osSettingsAfterRender\s*\(\)\s*\{[\s\S]*?\n\}/) || [''])[0];
  is(!!몸, '  osSettingsAfterRender 의 몸을 <b>찾았다</b> — ' + (몸 ? 몸.length + '자' : '못 찾았습니다'));
  ['osLoadApprovals', 'osLoadMembers', 'osAcLoad', 'osSecurityAfterRender',
   'osNSeenLoad', 'osBackupLoad'].forEach(fn => {
    /* 그 이름이 <b>osSetLoad(...) 안쪽</b>에서 불리는가 */
    const 안쪽 = (몸.match(/osSetLoad\([^)]*,\s*function\s*\(\)\s*\{[^}]*\}/g) || []).join(' ');
    is(안쪽.indexOf(fn) >= 0, '  ' + fn.padEnd(22) + ' 가 <b>osSetLoad 안</b>에서 불린다');
  });

  console.log('\n[5] ★ <b>다시 불러오기 단추</b>가 그대로 선다 (6번)');
  is(/typeof\s+sb\.rpc\s*!==\s*'function'/.test(SRC),
     '  osAcLoad 가 <b>sb.rpc 가 없는 경우</b>를 막는다 — 그때 터졌습니다');
  is(/onclick="osAcLoad\(true\)"/.test(SRC),
     '  ★ 「다시 불러오기」 단추가 <b>글자 그대로 있다</b> — 할 일이 있는데 감추지 않습니다');

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 서버 손이 모자라도 설정은 서고, 못 읽은 칸을 말합니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('터짐: ' + (e && e.stack || e)); process.exit(1); });
