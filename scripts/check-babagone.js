/* ══════════════════════════════════════════════════════════════════
   check-babagone.js — <b>비포&애프터로 가는 길이 하나도 없나.</b>

   ── 사장님 말씀 (2026-10-07) ─────────────────────────────────────
   <b>「비포 애프터는 아예 삭제해줘」</b>. 어디까지 지울지 여쭈니
   <b>「길만 다 막는다」</b> 를 고르셨습니다 — 화면 코드(함수 165개)는
   파일에 남기고, <b>들어가는 길을 전부</b> 막습니다. 되돌리기 쉽고,
   다른 화면을 건드릴 위험이 없습니다.

   ── 지우기 전에 재 본 것 ─────────────────────────────────────────
   서버에 <b>kind='baba' 로 저장된 자료는 0건</b>이었습니다. 전·후 만들기
   (ba_state) 6건은 그대로입니다 — <b>잃은 자료가 없습니다</b> (1번).

   ── 보는 것 (넓게 잡지 않습니다 · 8번) ───────────────────────────
     [1] <b>길 꼴</b>이 하나도 없나 — 메뉴 칸 · 음성 별칭 · 퀘스트 ·
         단계 도구 · 가이드 칩 · 거절 대응 · 도구 설명표
     [2] ★★ <b>브라우저로</b> — 네 화면을 열어 baba 로 가는 누를 것이 0개
     [3] ★ 대신 세운 <b>전·후 만들기(frmake)</b> 는 그대로 선다 —
         치우기만 하고 대신할 것이 죽어 있으면 그것이 더 나쁩니다 (6번)
     [4] 치료비 리포트에 <b>「비포 & 애프터」 칸이 없고</b> 번호가 1~6 으로
         이어지나 — 빼고 번호를 비우면 고객이 「4번이 어디 갔지」 합니다 (1번)
     ⚠ 화면 <b>안쪽 코드</b>(babaXxx 함수·AI 생성기)는 <b>안 셉니다</b> —
       코드는 남기기로 한 것이라, 세면 헛것입니다 (8번).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = process.cwd();
const PORT = 9143;
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json',
               '.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/json'};
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const SRC = fs.readFileSync('app/index.html', 'utf8');

console.log('[1] <b>길 꼴</b>이 하나도 없나');
/* ★ 꼴을 <b>좁게</b> 적습니다 — 「baba 라는 글자」 를 세면 화면 안쪽 코드가
     다 걸려 헛것이 됩니다. <b>밖에서 들어가는 모양</b>만 셉니다 (8번). */
const 길 = [
  ['메뉴 칸',       /\{id:'baba',icon:/g],
  ['음성 별칭',     /'비포애프터'\s*:\s*'baba'/g],
  ['퀘스트·바로가기', /go\s*[:(]\s*'baba'/g],
  ['도구 칩',       /\['baba'\s*,/g],
  ['가이드 칩',     /manChip\('baba'/g],
  ['거절 대응',     /tab:'baba'\s*,\s*tn:/g],
  ['도구 설명표',   /\n\s*baba:\{tag:/g]
];
길.forEach(([nm, rx]) => {
  const n = (SRC.match(rx) || []).length;
  is(n === 0, '  ' + nm.padEnd(14) + ' <b>' + n + '곳</b>' + (n ? ' ← 아직 길이 남아 있습니다' : ''));
});

console.log('\n[4] 치료비 리포트에 <b>그 칸이 없고</b> 번호가 1~6 으로 이어지나 (1번)');
/* ★★ <b>주석을 먼저 뗍니다.</b> 안 떼면 <b>제 설명이 거짓 빨간불</b>을 냅니다 —
   「이 칸을 뺐습니다」 라고 적어 둔 쪽지의 글자를 <b>칸</b>으로 읽습니다.
   이 세션에서 네 번째 같은 병입니다 (8번).                              */
const 코드만 = (t) => (t || '').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const 몸 = 코드만((() => { const a = SRC.indexOf('function tpBody(ctx){');
  if (a < 0) return ''; const b = SRC.indexOf('\nfunction ', a + 10); return SRC.slice(a, b > a ? b : a + 20000); })());
is(!!몸, '  tpBody 의 몸을 <b>찾았다</b>' + (몸 ? ' — ' + 몸.length + '자' : ' ← 이름이 바뀌었으면 이 자도 고쳐야 합니다'));
is(!!몸 && 몸.indexOf('비포 & 애프터') < 0 && 몸.indexOf('비포&애프터') < 0,
   '  ★ 리포트에 <b>「비포 & 애프터」 칸이 없다</b>');
const 칸 = [1, 2, 3, 4, 5, 6].map(n => (몸.match(new RegExp('if\\(want\\(' + n + '\\)\\)')) || []).length);
is(칸.every(x => x === 1), '  ★ 칸이 <b>1~6 으로 하나씩</b> 있다 — ' + 칸.join('·'));
is(!!몸 && !/if\(want\(7\)\)/.test(몸), '  ★ <b>7번은 없다</b> — 번호를 다시 매겼다');
const 글번호 = (몸.match(/<span class="n">(\d)<\/span>/g) || []).map(x => x.replace(/\D/g, '')).join('');
is(글번호 === '123456', '  ★ 화면에 찍히는 번호도 <b>1·2·3·4·5·6</b> — ' + (글번호 || '없음') +
   (글번호 === '123456' ? '' : ' ← 번호가 비면 고객이 「4번이 어디 갔지」 합니다'));

(async () => {
  console.log('\n[2]~[3] <b>브라우저로 재 봅니다</b>');
  const srv = http.createServer((q, s) => {
    const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    fs.readFile(f, (e, b) => { if (e) { s.writeHead(404); s.end(''); }
      else { s.writeHead(200, {'content-type': MIME[path.extname(f)] || 'application/octet-stream'}); s.end(b); } });
  });
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch();
  const SEED = () => {
    try { localStorage.setItem('apex_login_ok', '1'); } catch (e) {}
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients','osCliInfoLoad',
     'osRepListLoad','osLoadAnalysis','nlLoad','gbLoad'].forEach(k => { window[k] = function () {}; });
    window.toast = function () {};
    window.cmLoadAll = function (cb) { if (cb) cb(); };
    window.osTabAllowed = function () { return true; };
    window.setupDone = function () { return true; };
    window.setupCanRun = function () { return true; };
    OS.profile = {id:'me', user_id:'me', name:'홍길동', role:'owner', active:true, plan:'vip', team_id:'t1'};
    OS.session = {user:{id:'me'}};
    const chain = v => { const o = {then:function (f) { try { f(v); } catch (e) {} return o; }, catch:function () { return o; }};
      ['eq','neq','select','order','limit','in','gte','lte','is','not','or','filter','ilike','like','range','contains','overlaps']
        .forEach(k => { o[k] = function () { return o; }; });
      o.single = function () { return chain({data:null}); };
      o.maybeSingle = function () { return chain({data:null}); }; return o; };
    window.osClient = function () { return {from:function () { return {
      select:function () { return chain({data:[], count:0}); }, update:function () { return chain({}); },
      insert:function () { return chain({}); }, upsert:function () { return chain({}); },
      delete:function () { return chain({}); }}; }, rpc:function () { return chain({data:[]}); }}; };
    AR.loaded = true; AR.busy = ''; AR.db = []; AR.cliRows = [];
    CM.loaded = true; CM.who = {me:'홍길동'}; CM.meta = {};
    OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = [];
  };
  try {
    const ctx = await br.newContext({viewport:{width:1280, height:900}});
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const pg = await ctx.newPage(); pg.on('pageerror', () => {});
    await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', {waitUntil:'domcontentloaded'});
    await pg.waitForTimeout(2300);
    await pg.evaluate(t => { eval('(' + t + ')')(); }, SEED.toString());
    await pg.waitForTimeout(600);
    /* ★ 메뉴 칸이 <b>아예 없다</b> — 찾기·음성도 이것을 봅니다 */
    const nav = await pg.evaluate(() => {
      try { return typeof navItemOf === 'function' ? !!navItemOf('baba') : null; } catch (e) { return 'terr'; }
    });
    is(nav === false, '  ★★ <b>메뉴에 비포&애프터가 없다</b> — navItemOf(baba) ' +
       (nav === false ? '없음' : String(nav)));
    /* ★ 네 화면을 열어 <b>누를 것</b>을 훑는다 */
    /* ★ 훑는 화면을 <b>넓혔습니다</b> — 처음엔 넷만 보다가 <b>실행 체크판과
         풀리포트 안의 길 둘을 놓쳤습니다</b>. 옛 자(check-fullreport)가 그것을
         잡아 주었습니다. 자가 좁으면 「없다」 는 말이 거짓이 됩니다 (8번). */
    for (const tab of ['home', 'manual', 'clients', 'bojang', 'frmake', 'ready', 'airep']) {
      const r = await pg.evaluate((t) => {
        try { go(t); } catch (e) {}
        const 누를것 = [].slice.call(document.querySelectorAll('[onclick]'));
        const 길 = 누를것.filter(e => /baba/.test(e.getAttribute('onclick') || ''))
          .map(e => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 20));
        const 글 = (document.getElementById('dynPane') || document.body).innerText || '';
        return {길: 길, 비포: (글.match(/비포\s*&?\s*애프터/g) || []).length};
      }, tab);
      await pg.waitForTimeout(500);
      is(r.길.length === 0, '  ★★ ' + tab.padEnd(8) + ' — baba 로 가는 <b>누를 것 ' + r.길.length + '개</b>' +
         (r.길.length ? ' ← ' + r.길.join(' · ') : ''));
      is(r.비포 === 0, '  ★ ' + tab.padEnd(8) + ' — 「비포&애프터」 라는 <b>글자 ' + r.비포 + '군데</b>');
    }
    /* ── [3] 대신 세운 것은 <b>살아 있나</b> (6번) ── */
    const fr = await pg.evaluate(() => {
      try { return typeof navItemOf === 'function' ? !!navItemOf('frmake') : null; } catch (e) { return 'terr'; }
    });
    is(fr === true, '  ★ 대신 세운 <b>보장분석 전·후 만들기</b> 는 그대로 선다 — ' +
       (fr === true ? '메뉴에 있음' : String(fr)) + (fr === true ? '' : ' ← 치우기만 하면 그것이 더 나쁩니다 (6번)'));
    await ctx.close();
  } catch (e) {
    is(false, '  재는 중에 터졌습니다 — ' + (e && e.message));
  }
  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 비포&애프터로 가는 길이 하나도 없고, 대신 세운 전·후 만들기는 그대로 섭니다.');
  process.exit(bad ? 1 : 0);
})();
