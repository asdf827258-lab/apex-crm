/* ══════════════════════════════════════════════════════════════════
   check-hmwho.js — 홈 <b>📊 상담현황</b> 카드가 <b>「한 사람 것」만</b> 말하나.

   사장님 말씀 (2026-10-12) — 「팀원들 ap/pc 관리 업적관리는 잘 돌아가고
   있니」 를 재던 중에 찾은 자리입니다. 그 카드는 <b>「누구 것인가」 를 두
   곳에 따로 물었습니다</b> —
     · 단계 칩 · 길 위 · 막힌 데 · 🕗 지남 → <b>내 것</b>(hmFlowMe)
     · 업적 세 수                        → <b>고른 사람 것</b>(hwhoPick)
   그래서 재어 보니 (씨 : 내 것 AP1·계약 100만 / 팀원 AP1·PC1·CS1·계약 500만)

     고른 것        단계 칩        길 위    지남   업적
     안 고름        1 AP           1분      1      100만원   ← 맞다
     팀원 홍길순    1 AP (내 것)   1분      1      500만원   ← <b>섞였다</b>
     🏢 팀 전체     1 AP (내 것)   1분      1      100만원   ← <b>전체인데 내 것</b>

   ⚠ 화면은 바로 위 띠에서 <b>「🏢 팀 전체를 보고 있습니다 — N명 것이 섞여
     있습니다. 내 것이 아닙니다」</b>, <b>「👀 지금 ○○ 님 화면을 보고 있습니다」</b>
     라고 <b>적어 둡니다.</b> 그 약속을 이 카드만 어기고 있었습니다 (1번).

   ★ 임자는 <b>이미 있었습니다</b> — hwhoFor() 가 「홈이 실제로 누구의 줄을
     세울지」 를 알고 홈에서 아홉 곳이 부릅니다. 이 카드만 안 물었습니다 (5번).
   ⚠ hwhoPick() 과 hwhoFor() 는 <b>「팀 전체」 에서 갈립니다</b> — 둘 다 빈
     글자를 주는데 hwhoPick 쪽에 「없으면 내 것」 을 붙이면 <b>전체가 내 것으로</b>
     바뀝니다. 그것이 ③ 의 거짓입니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 안 고르면 카드가 <b>다 내 것</b>이다
     [2] ★★ 팀원을 고르면 <b>네 수가 다</b> 그 팀원 것이다 — 하나라도 안
         따라오면 한 카드가 두 사람 것을 적습니다
     [3] ★★ 🏢 팀 전체를 고르면 <b>네 수가 다 합</b>이다 — 업적만 내 것으로
         떨어지던 그 자리입니다
     [4] ★★ <b>묻는 곳이 하나</b>다 (5번) — 카드 안에 「내 것」 을 바로 묻는
         자리가 없다
     [5] ★ <b>화면의 약속과 맞는다</b> — 「내 것이 아닙니다」 띠가 설 때
         카드도 내 것이 아니다
     [6] ★★ <b>설계사는 언제나 제 것</b>이다 (3번) — 고르개가 없는 분에게
         남의 고객이 섞이면 안 됩니다. 서버가 막고 있지만 여기서도 막습니다
     [7] 서버를 더 안 부른다 (7번) · 안 터진다

   ── 시계 ──────────────────────────────────────────────────────────
   ★ <b>박습니다</b> — 🕗 지남은 「오늘」 에 달려 있습니다. 박는 자리는
     lib-clock 한 곳입니다 (5번 · 판 X83).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const CLK = require('./lib-clock.js');

const 박는때 = 14;
const 오늘 = CLK.kstDay(박는때);
const 며칠뒤 = (n) => CLK.kstDay(박는때, n);

const ROOT = path.resolve(__dirname, '..'), PORT = 8969;
const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
let hits = 0;
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{"key":null,"has":false}'); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 씨 — <b>내 것 하나 · 팀원 것 셋</b>. 수가 서로 달라야 「따라왔나」 를
   볼 수 있습니다(같으면 안 따라와도 초록이 됩니다 · 8번).            */
const SEED = (일) => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', user_id: 'me', name: '홍길동', role: 'owner', active: true, plan: 'vip', team_id: 't1' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function () {}; window.setupDone = function () { return true; };
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = [];
  CM.loaded = true; CM.meta = {}; CM.who = { me: '홍길동', u2: '홍길순' };
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.calls = []; AR.noPex = false;
  const d = (n) => new Date(new Date(일 + 'T00:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10);
  const row = (id, who, stage, o) => Object.assign({ id: id, who: who, name: '홍길동',
    region: '순천', src: '일반', stage: stage, expect: null, contract: null, closed: '',
    cAt: '', pAt: '', got: '2026-06-01', n: 1, last: '', res: '상담',
    appt: '', memo: '', days: 12 }, o || {});
  AR.db = [
    row('m1', 'me', 'AP', { appt: d(-30) }),
    row('m2', 'me', '계약완료', { contract: 1000000, cAt: 일 }),
    row('u1', 'u2', 'AP', { appt: d(-40) }),
    row('u2a', 'u2', 'PC', { appt: d(-50) }),
    row('u3', 'u2', 'CS', { appt: d(-60) }),
    row('u4', 'u2', '계약완료', { contract: 5000000, cAt: 일 })];
};

/* 네 수를 한 번에 — <b>카드 하나에서</b> 집어 옵니다 */
const LOOK = () => {
  try { go('home'); } catch (e) {}
  /* ⬆ 판 X279 — 단계 칩 · 🕗 지남은 맨 위 📇 <b>한 장 띠</b>(#hmBand)로
     올라갔습니다. 두 칸을 <b>한 몸</b>으로 읽습니다 — 둘 다 같은 hwhoFor 에게
     묻는지가 이 자의 물음이라, 자리만 바뀌었지 재는 것은 같습니다. */
  const c = document.getElementById('hmFlow'), bd = document.getElementById('hmBand');
  const t = ((bd ? bd.textContent : '') + ' ' + (c ? c.textContent : '')).replace(/\s+/g, ' ');
  const 칩 = bd ? [].slice.call(bd.querySelectorAll('button.t-chip'))
    .filter(e => (e.textContent || '').indexOf('지남') >= 0)[0] : null;
  const num = (re) => { const m = t.match(re); return m ? +m[1] : null; };
  return {
    있나: !!c,
    ap: num(/(\d+) 🤝 (?:\S+ )?AP/), pc: num(/(\d+) 📄 (?:\S+ )?PC/), cs: num(/(\d+) ✍️ (?:\S+ )?CS/),
    길위: num(/모두 (\d+)분/),
    지남: 칩 ? +((칩.textContent || '').match(/\d+/) || [0])[0] : null,
    업적: num(/이번 달 (\d+)만원/),
    업적건: num(/이번 달 [^(]*\((\d+)건\)/),
    띠: (function () { const e = document.querySelector('#dynPane .hwho-tx');
      return e ? (e.textContent || '').replace(/\s+/g, ' ').trim() : ''; })(),
    hwhoFor: (typeof hwhoFor === 'function') ? hwhoFor() : undefined
  };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const errs = [];
  const ctx = await b.newContext(CLK.ctxOpt({ viewport: { width: 390, height: 844 } }));
  await CLK.pin(ctx, 박는때);
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
    hits++; return r.abort();
  });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html',
    { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => typeof renderHome === 'function' && typeof hwhoFor === 'function'
    && typeof arApptPast === 'function' && typeof pexSum === 'function', { timeout: 60000 });
  await p.evaluate(SEED, 오늘);
  await p.waitForTimeout(900);
  const hits0 = hits;
  /* 고르개를 돌립니다 — <b>담아 두는 자리(HWHO.id)만</b> 바꿉니다.
     ⚠ 처음 판에서 <b>hwhoId 를 통째로 덮었습니다.</b> 그런데 「고를 수 있는
       분인가」 를 막는 한 줄이 <b>바로 그 안</b>에 있습니다 —
       hwhoId(){ if(!hwhoCan())return ''; ... }. 덮으니 그 막이 사라져,
       [6] 이 「설계사에게 남의 것이 보인다」 고 울렸습니다. <b>자가 막을
       뜯어 놓고 막이 없다고 울린 것</b>입니다. 지금은 담는 자리만 바꾸고
       hwhoCan·hwhoId·hwhoFor 는 <b>앱 것 그대로</b> 돕니다 (8번).       */
  const 골라보기 = (v, lead) => p.evaluate(({ v, lead, look }) => {
    window.arIsLead = function () { return lead !== false; };
    HWHO.id = (v === '*') ? HWHO_ALL : v;
    return (0, eval)('(' + look + ')')();
  }, { v, lead, look: String(LOOK) });

  /* ══ [1] 안 고름 ═══════════════════════════════════════════════ */
  console.log('\n[1] 👤 <b>안 고르면 다 내 것</b>이다');
  const A = await 골라보기('', true);
  is(A.있나, '  카드가 <b>선다</b>');
  is(A.ap === 1 && A.pc === 0 && A.cs === 0,
     '  단계 칩이 <b>AP 1 · PC 0 · CS 0</b> — ' + A.ap + '/' + A.pc + '/' + A.cs);
  is(A.길위 === 1 && A.지남 === 1 && A.업적 === 100,
     '  길 위 <b>1분</b> · 지남 <b>1</b> · 업적 <b>100만원</b> — ' +
     A.길위 + '분 / ' + A.지남 + ' / ' + A.업적 + '만원');

  /* ══ [2] 팀원을 고름 ══════════════════════════════════════════ */
  console.log('\n[2] 👀 <b>팀원을 고르면 네 수가 다 그 팀원 것</b>이다 (5번)');
  const B = await 골라보기('u2', true);
  is(B.ap === 1 && B.pc === 1 && B.cs === 1,
     '  ★★ 단계 칩이 <b>AP 1 · PC 1 · CS 1</b> 로 바뀐다 — ' +
     B.ap + '/' + B.pc + '/' + B.cs + ' (안 바뀌면 내 것이 그대로 선 것입니다)');
  is(B.길위 === 3, '  ★★ 길 위가 <b>3분</b> 이다 — ' + B.길위 + '분');
  is(B.지남 === 3, '  ★★ 지남이 <b>3</b> 이다 — ' + B.지남);
  is(B.업적 === 500, '  업적이 <b>500만원</b> 이다 — ' + B.업적 + '만원');
  is(B.hwhoFor === 'u2', '  hwhoFor() 가 <b>u2</b> 라고 답한다 — ' + B.hwhoFor);

  /* ══ [3] 팀 전체 ══════════════════════════════════════════════ */
  console.log('\n[3] 🏢 <b>팀 전체를 고르면 네 수가 다 합</b>이다');
  const C = await 골라보기('*', true);
  is(C.hwhoFor === '', '  hwhoFor() 가 <b>빈 글자</b>(안 거른다) 라고 답한다 — 「' + C.hwhoFor + '」');
  is(C.ap === 2 && C.pc === 1 && C.cs === 1,
     '  ★★ 단계 칩이 <b>AP 2 · PC 1 · CS 1</b> — ' + C.ap + '/' + C.pc + '/' + C.cs);
  is(C.길위 === 4, '  ★★ 길 위가 <b>4분</b> 이다 — ' + C.길위 + '분');
  is(C.지남 === 4, '  ★★ 지남이 <b>4</b> 이다 — ' + C.지남);
  is(C.업적 === 600 && C.업적건 === 2,
     '  ★★ 업적이 <b>600만원(2건)</b> 이다 — ' + C.업적 + '만원(' + C.업적건 + '건). ' +
     '여기가 「전체인데 내 것(100만원)」 으로 떨어지던 자리입니다');

  /* ══ [4] 묻는 곳이 하나 ═══════════════════════════════════════ */
  console.log('\n[4] 🔎 <b>묻는 곳이 하나</b>인가 (5번)');
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  /* ⚠ <b>쪽지를 걷어 내고 셉니다.</b> 처음 판에서 그냥 셌더니 <b>4곳</b>이
     나왔습니다 — 제가 두 토막에 적어 둔 쪽지가 「hwhoFor() 한 곳에 묻습니다」
     라고 말하고 있었기 때문입니다. 제 글이 제 자를 울린 것이 이 저장소에서
     <b>다섯 번째</b>입니다(판 X83 check-clockfree · 판 X89 세 번). 넓게
     찾기를 그만두고 <b>도는 글만</b> 봅니다 (8번).                       */
  const 걷기 = (t) => {
    let out = '', 안에 = false;
    t.split('\n').forEach(line => {
      let x = line;
      if (안에) { if (x.indexOf('*/') >= 0) { x = x.slice(x.indexOf('*/') + 2); 안에 = false; } else x = ''; }
      x = x.replace(/\/\*[\s\S]*?\*\//g, '');
      if (x.indexOf('/*') >= 0) { x = x.slice(0, x.indexOf('/*')); 안에 = true; }
      out += x + '\n';
    });
    return out;
  };
  const 토막 = (이름) => { const i = src.indexOf('function ' + 이름 + '(');
    if (i < 0) return ''; const j = src.indexOf('\nfunction ', i + 10);
    return 걷기(src.slice(i, j < 0 ? src.length : j)); };
  const 카드 = 토막('hmFlowHtml'), 줄 = 토막('pexRows');
  const 셈 = (t, w) => t.split(w).length - 1;
  is(!!카드.trim() && !!줄.trim(),
     '  두 토막을 찾았다(쪽지 걷은 뒤) — hmFlowHtml ' + 카드.replace(/\s+/g, ' ').trim().length +
     '자 · pexRows ' + 줄.replace(/\s+/g, ' ').trim().length + '자');
  is(셈(카드, 'hwhoFor()') === 1 && 셈(줄, 'hwhoFor()') === 1,
     '  ★★ 둘이 <b>저마다 한 번</b> hwhoFor() 에게 묻는다 — 카드 ' +
     셈(카드, 'hwhoFor()') + '곳 · 업적줄 ' + 셈(줄, 'hwhoFor()') + '곳');
  /* ⚠ <b>되돌아갈 자리(||hmFlowMe())는 봐 줍니다</b> — hwhoFor 를 못 찾는
     판에서 쓰는 자리이고, 거기까지 막으면 못 찾는 판에 카드가 통째로
     빕니다. 막는 것은 <b>hwhoFor 를 안 묻고</b> 바로 내 것을 쓰는 자리입니다. */
  is(셈(카드, 'hwhoPick()') === 0 && 셈(줄, 'hwhoPick()') === 0,
     '  ★ 카드가 <b>hwhoPick() 을 따로 안 묻는다</b> — 「팀 전체」 에서 갈리는 자입니다');
  is(셈(카드, 'hmFlowMe()') === 1 && 셈(줄, 'hmFlowMe()') === 1,
     '  ★ hmFlowMe() 는 <b>되돌아갈 자리로만</b> 남는다 — 카드 ' +
     셈(카드, 'hmFlowMe()') + '곳 · 업적줄 ' + 셈(줄, 'hmFlowMe()') + '곳');
  is(/function hmFlowMe\(/.test(src), '  ⚠ hmFlowMe 를 <b>안 지웠다</b> (사장님 ★)');
  /* 📇 판 X279 — <b>띠도 같은 자에게 한 번</b> 묻습니다. 띠가 제 손으로 「누구」 를
     고르면 고르개를 눌러도 띠만 내 것으로 남습니다 (5번). */
  const 띠 = 토막('hmBandHtml');
  is(!!띠.trim() && 셈(띠, 'hwhoFor()') === 1 && 셈(띠, 'hwhoPick()') === 0,
     '  ★★ 📇 한 장 띠도 <b>hwhoFor() 에게 한 번</b> 묻는다 — ' + 셈(띠, 'hwhoFor()') + '곳');

  /* ══ [5] 화면의 약속과 맞는다 ═════════════════════════════════ */
  console.log('\n[5] 🤝 <b>화면이 적어 둔 약속과 맞는다</b> (1번)');
  is(/내 것이 아닙니다/.test(B.띠), '  팀원을 고르면 띠가 <b>「내 것이 아닙니다」</b> — ' + B.띠.slice(0, 44));
  is(/팀 전체/.test(C.띠), '  팀 전체를 고르면 띠가 <b>그렇다고</b> 적는다 — ' + C.띠.slice(0, 44));
  is(/내 화면/.test(A.띠), '  안 고르면 띠가 <b>「내 화면」</b> 이라 적는다 — ' + A.띠.slice(0, 30));

  /* ══ [6] 설계사는 언제나 제 것 ════════════════════════════════ */
  console.log('\n[6] 🔒 <b>설계사는 언제나 제 것</b>이다 (3번)');
  const D = await 골라보기('u2', false);   /* 고를 수 없는 분이 고른 값을 들고 있어도 */
  is(D.hwhoFor === 'me',
     '  ★★ hwhoFor() 가 <b>내 것</b>이라 답한다 — ' + D.hwhoFor +
     ' (고른 값이 남아 있어도 고르개가 없는 분에게는 안 먹습니다)');
  is(D.ap === 1 && D.길위 === 1 && D.지남 === 1 && D.업적 === 100,
     '  ★★ 카드가 <b>내 것</b>이다 — AP ' + D.ap + ' / ' + D.길위 + '분 / ' +
     D.지남 + ' / ' + D.업적 + '만원 (남의 고객이 안 섞입니다)');

  /* ══ [7] 서버 · 터짐 ══════════════════════════════════════════ */
  console.log('\n[7] 🌐 서버를 더 안 부른다 (7번) · 안 터진다');
  is(hits === hits0, '  밖으로 <b>' + (hits - hits0) + '번</b>');
  is(errs.length === 0, '  터진 것이 없다 — ' + JSON.stringify(errs.slice(0, 3)));

  await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '가지가 어긋납니다')
                  : '\n✓ 카드 하나가 한 사람 것만 말합니다');
  process.exit(bad ? 1 : 0);
})();
