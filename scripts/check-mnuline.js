/* ══════════════════════════════════════════════════════════════════
   check-mnuline.js — 말씀 <b>X06 의 남은 둘</b>이 정말 서 있나.

   사장님 말씀 X06 (2026-09-26) — 「목각과 지금 것을 견주어 … 한 가지씩
   고치고」. 그 줄의 메모에 열사흘 동안 <b>「아직 남은 것」 셋</b>이 적혀
   있었습니다 :
     ① 「나」 의 <b>셋째 숫자 — 만난 뒤 한 줄 %</b>
     ② 홈 <b>「연속 N일」</b> 머리            ← <b>이미 섰습니다</b>
     ③ 고객 <b>한 줄에 「아는 것 N/M」</b>
   ②는 판에서 이미 세웠고 <b>check-hmrun</b> 이 재고 있습니다 — 여기서 또
   재지 않습니다 (5번 · 8번). 이 자는 <b>①과 ③</b> 을 봅니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ ① <b>세 수가 선다</b> — 한 줄 적음 % · 만난 기록 · 한 줄 없음.
         그리고 <b>화면의 % 와 mnuLine() 의 pct 가 같다</b> (5번)
     [2] ★★ ① <b>단추 한 번으로 남긴 것은 안 센다</b> — 「오늘 연락함」 은
         note 에 앱이 적은 말을 넣고 cc 표를 붙입니다. 그것을 「한 줄」 로
         세면 <b>안 쓰고도 100%</b> 가 됩니다. note 가 빈 것도 안 셉니다
     [3] ★★ ① <b>모르면 숫자를 안 적는다</b> (1번) — 만남 기록이 없거나
         고객을 못 읽었으면 null 이고, 카드에 <b>% 가 한 개도</b> 없습니다.
         0% 는 「만나고도 한 줄도 안 적으셨다」 는 <b>없는 사실</b>입니다
     [4] ★ ① <b>세는 곳은 한 곳</b> — 나누는 셈이 app 에 하나뿐이다 (5번)
     [5] ★★ ③ <b>고객 한 줄에 「아는 것 N/M」</b> 이 선다. 그리고 그 수가
         <b>cqaTally() 와 같다</b> — 목록이 따로 세지 않습니다 (5번)
     [6] ★★ ③ <b>분모를 박아 두지 않는다</b> (1번) — 대장에는 2026-09-26 에
         「N/8」 이라고 적혀 있었는데 지금은 <b>열하나</b>입니다. 여쭐 칸은
         늘어납니다. 8 을 박으면 그날부터 거짓말입니다
     [7] ★★ ③ <b>모르면 안 적는다</b> (1번) · <b>배정 DB 줄에는 안 붙는다</b>
     [8] ★ ③ <b>줄이 안 불어난다</b> — 폰에서 한 줄이 두 줄로 벌어지면
         한 화면에 드는 고객이 줄어듭니다
     [9] ★ ③ <b>두 수에 이름이 붙었다</b> — 여태 「0/25」 라고만 적혀 있어
         수 둘이 나란히 서면 어느 것이 무엇인지 알 수 없었습니다

   ── 시계 ──────────────────────────────────────────────────────────
   ★ <b>박습니다.</b> 이 자는 「오늘 몇 건」 을 세고, ccToday() 는 한국
     날짜라, 못 안 박으면 CI 가 도는 시각에 따라 심은 기록이 <b>어제 것</b>
     이 됩니다. 박는 자리는 <b>lib-clock 한 곳</b>입니다 (5번 · 판 X83).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const CLK = require('./lib-clock.js');

/* 박는 때 — 아래에서 「오늘」 을 셀 때도 <b>이 한 수</b>를 씁니다.
   두 곳에 적으면 한쪽만 늙습니다 (5번).                           */
const 박는때 = 14;
const 오늘 = CLK.kstDay(박는때);

const ROOT = path.resolve(__dirname, '..'), PORT = 8977;
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

/* ── 심는 것 ───────────────────────────────────────────────────────
   ★ <b>앱이 실제로 적는 꼴 그대로</b> 심습니다 — cmTouchAdd 는 {at,how,note},
     ccMark 는 거기에 cc:1 을 더하고, cqaTouch 는 note 를 빈 글자로 둡니다.
     심는 꼴이 틀리면 자가 <b>안 쓰는 길</b>을 재게 됩니다 (판 X88 에서
     ACT.day 꼴을 두 번 틀렸습니다).
   ★ 이름은 <b>홍길동</b>입니다 (3번).                                 */
const SEED = (일) => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '홍길동', role: 'owner', active: true, plan: 'vip' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function () {}; window.setupDone = function () { return true; };
  OSC.loaded = true; OSC.busy = false; OSC.err = '';
  OSC.list = [{ id: 'c1', name_masked: '홍*동', advisor_id: 'me', consent_status: 'none' },
              { id: 'c2', name_masked: '홍*순', advisor_id: 'me', consent_status: 'none' }];
  CM.loaded = true; CM.meta = {};
  /* c1 — 오늘 만남 셋 : 손으로 친 말 · 빈 글자(단추) · cc 표(오늘 연락함).
          <b>한 줄은 하나</b>입니다. 전화는 만남이 아니라 분모에도 안 듭니다. */
  CM.meta.c1 = Object.assign(cmBlank(), { touch: [
    { at: 일, how: '만남', note: '자녀 교육비를 걱정하신다' },
    { at: 일, how: '만남', note: '' },
    { at: 일, how: '만남', note: '30일 관리', cc: 1 },
    { at: 일, how: '전화', note: '부재였다' } ] });
  /* c2 — 지난 만남 둘 : 손으로 친 말 하나 · 빈 글자 하나 */
  CM.meta.c2 = Object.assign(cmBlank(), { touch: [
    { at: '2026-09-01', how: '만남', note: '건강 얘기를 하셨다' },
    { at: '2026-09-02', how: '만남', note: '' } ] });
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.db = []; AR.calls = [];
};

/* 「나」 화면을 열고 ✍️ 카드만 집어 옵니다 — <b>카드로 찾습니다</b>.
   화면 전체 글에서 「%」 를 찾으면 밀착관리 카드의 100% 를 집어 옵니다. */
const 나보기 = () => {
  try { go('me'); } catch (e) {}
  const cards = [].slice.call(document.querySelectorAll('#dynPane .card'));
  const card = cards.filter(e => ((e.querySelector('.card-title') || {}).textContent || '')
    .indexOf('만난 뒤 한 줄') >= 0)[0];
  return { 있나: !!card,
           글: card ? (card.innerText || '').replace(/\s+/g, ' ') : '',
           칸: card ? [].slice.call(card.querySelectorAll('.mnu-t'))
                 .map(e => (e.innerText || '').replace(/\s+/g, ' ')) : [],
           퍼센트: card ? ((card.innerText || '').match(/\d+%/g) || []) : [],
           단추: card ? card.querySelectorAll('button').length : 0,
           셈: (typeof mnuLine === 'function') ? mnuLine() : undefined };
};

/* 고객 목록을 그리고 한 줄을 집어 옵니다 — <b>osRenderList 를 직접 부릅니다</b>.
   go('clients') 만 하면 서버를 기다리는 뼈대(hold-sk*)가 서 있어 줄이 0 개입니다
   (실제로 그래서 「줄을 못 찾았다」 는 헛 빨간불을 한 번 봤습니다).           */
const 목록보기 = () => {
  try { go('clients'); } catch (e) {}
  try { osRenderList(); } catch (e) {}
  const rows = [].slice.call(document.querySelectorAll('#oscList .t-row'));
  return { 줄수: rows.length,
           높이: rows[0] ? Math.round(rows[0].getBoundingClientRect().height) : 0,
           아는칸: rows.map(e => { const k = e.querySelector('.cm-kn');
             return k ? (k.textContent || '').replace(/\s+/g, ' ') : ''; }),
           팩트칸: rows.map(e => { const k = e.querySelector('.cm-ff');
             return k ? (k.textContent || '').replace(/\s+/g, ' ') : ''; }),
           셈: (typeof cqaTally === 'function')
                 ? OSC.list.map(c => { const t = cqaTally(c.id);
                     return t ? (t.got + '/' + t.all) : null; }) : undefined,
           물음수: (typeof cqaQs === 'function') ? cqaQs().length : null };
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
  await p.waitForFunction(() => typeof renderMe === 'function' && typeof cmRowHtml === 'function'
    && typeof cqaTally === 'function', { timeout: 60000 });
  await p.evaluate(SEED, 오늘);
  await p.waitForTimeout(900);
  const hits0 = hits;

  /* ══ [1] ① 세 수가 선다 ══════════════════════════════════════ */
  console.log('\n[1] ✍️ <b>만난 뒤 한 줄</b> — 「나」 에 셋째 숫자가 선다');
  const A = await p.evaluate(나보기);
  is(A.있나, '  카드가 <b>선다</b> — 「만난 뒤 한 줄」');
  is(A.칸.length === 3, '  숫자 칸이 <b>셋</b>이다 — ' + A.칸.length + ' · ' + A.칸.join(' / '));
  is(/한 줄 적음/.test(A.글) && /만난 기록/.test(A.글) && /한 줄 없음/.test(A.글),
     '  세 이름이 다 적힌다 — 한 줄 적음 · 만난 기록 · 한 줄 없음');
  is(A.셈 && A.퍼센트.length >= 1 && A.퍼센트[0] === A.셈.pct + '%',
     '  ★★ <b>화면의 % 와 mnuLine() 이 같다</b> (5번) — 화면 ' +
     (A.퍼센트[0] || '없음') + ' · 셈 ' + (A.셈 ? A.셈.pct + '%' : '없음'));
  is(A.단추 >= 1, '  적으러 가는 단추를 <b>안 감춥니다</b> (6번) — ' + A.단추 + '개');

  /* ══ [2] ① 단추 한 번으로 남긴 것은 안 센다 ══════════════════ */
  console.log('\n[2] ✍️ <b>단추 한 번으로 남긴 기록</b>은 한 줄이 아니다');
  /* 심은 것 — 만남 다섯(오늘 셋 · 지난 둘), 그 가운데 손으로 친 말은 둘 */
  is(A.셈 && A.셈.만남 === 5,
     '  만남만 <b>다섯</b> 센다 — 전화는 분모에 안 든다 (' + (A.셈 && A.셈.만남) + ')');
  is(A.셈 && A.셈.한줄 === 2,
     '  한 줄은 <b>둘</b>이다 — 빈 글자(cqaTouch)와 cc 표(ccMark)는 빠진다 (' +
     (A.셈 && A.셈.한줄) + ')');
  is(A.셈 && A.셈.pct === 40, '  그래서 <b>40%</b> 다 — 2/5 (' + (A.셈 && A.셈.pct) + '%)');
  is(A.셈 && A.셈.오늘만남 === 3 && A.셈.오늘한줄 === 1,
     '  오늘 몫은 <b>3건 중 1건</b> — 못 박은 날(' + 오늘 + ') 것만 센다 (' +
     (A.셈 && A.셈.오늘만남) + '/' + (A.셈 && A.셈.오늘한줄) + ')');
  is(/3건 중 1건/.test(A.글), '  그 말이 <b>화면에도</b> 적힌다');

  /* ══ [3] ① 모르면 숫자를 안 적는다 (1번) ════════════════════ */
  console.log('\n[3] ✍️ <b>모르면 0% 가 아니다</b> (1번)');
  /* 만남 기록을 <b>치웁니다</b> — 전화만 남깁니다. 「전화는 했는데 만난
     적이 없다」 는 실제로 흔한 상태이고, 그 때 % 를 적으면 안 됩니다.  */
  const B = await p.evaluate((f) => {
    CM.meta.c1.touch = [{ at: '2026-09-01', how: '전화', note: '부재였다' }];
    CM.meta.c2.touch = [];
    return (0, eval)('(' + f + ')')();
  }, String(나보기));
  is(B.셈 === null, '  ★★ 만남이 없으면 <b>null</b> 이다 — 0 이 아닙니다');
  is(B.있나, '  그래도 카드는 <b>섭니다</b> — 칸이 사라지면 사장님은 지운 줄 아십니다');
  is(B.퍼센트.length === 0, '  ★★ 카드에 <b>% 가 한 개도 없다</b> — ' + JSON.stringify(B.퍼센트));
  is(/아직 없습니다/.test(B.글), '  <b>「아직 없습니다」</b> 라고 적는다');
  const C = await p.evaluate((f) => {
    CM.loaded = false;
    const r = (0, eval)('(' + f + ')')();
    CM.loaded = true;
    return r;
  }, String(나보기));
  is(C.셈 === null, '  ★ <b>고객을 못 읽었어도</b> null 이다 (CM.loaded=false)');

  /* ══ [4] ① 세는 곳은 한 곳 (5번) ════════════════════════════ */
  console.log('\n[4] ✍️ <b>세는 곳이 하나</b>인가 (5번)');
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const 나눔 = (src.match(/한줄\s*\/\s*o?\.?만남/g) || []).length;
  is(나눔 === 1, '  ★ 나누는 셈이 <b>하나</b>다 — ' + 나눔 + '곳 (mnuLine)');
  is((src.match(/function mnuLine\s*\(/g) || []).length === 1,
     '  mnuLine 선언이 하나다');
  is(/mnuLineHtml\(\)/.test(src) && (src.match(/mnuLineHtml\(\)\+/g) || []).length === 1,
     '  부르는 자리도 <b>하나</b>다 (renderMe)');

  /* ══ [5] ③ 고객 한 줄에 「아는 것 N/M」 ═════════════════════ */
  console.log('\n[5] 🙋 <b>아는 것 N/M</b> — 고객 한 줄에서도 보인다');
  await p.evaluate(SEED, 오늘);
  await p.waitForTimeout(500);
  const D = await p.evaluate(목록보기);
  is(D.줄수 === 2, '  줄이 <b>둘</b> 선다 — ' + D.줄수);
  is(D.아는칸.every(x => /^아는 것 \d+\/\d+$/.test(x)),
     '  두 줄에 다 <b>「아는 것 N/M」</b> 이 있다 — ' + JSON.stringify(D.아는칸));
  is(JSON.stringify(D.아는칸.map(x => x.replace('아는 것 ', ''))) === JSON.stringify(D.셈),
     '  ★★ <b>cqaTally 와 같은 수</b>다 (5번) — 줄 ' +
     JSON.stringify(D.아는칸.map(x => x.replace('아는 것 ', ''))) + ' · 셈 ' + JSON.stringify(D.셈));

  /* ══ [6] ③ 분모를 박아 두지 않는다 (1번) ════════════════════ */
  console.log('\n[6] 🙋 <b>분모를 박아 두지 않는다</b> (1번)');
  is(D.아는칸.every(x => x.split('/')[1] === String(D.물음수)),
     '  ★★ 분모가 <b>cqaQs() 그대로</b>다 — 지금 ' + D.물음수 + '가지 · 줄 ' +
     JSON.stringify(D.아는칸.map(x => x.split('/')[1])));
  /* ⚠ <b>좁게 찾습니다.</b> 처음 판에서 「아는 것」 뒤로 아무 글자나 지나
     숫자·슬래시를 찾게 두었더니, 바로 위에 제가 적은 <b>쪽지 자체</b>가
     걸렸습니다(쪽지에 「여태 「0/25」」 라고 적혀 있습니다). 판 X83 에서
     check-clockfree 를 제 쪽지로 울린 것과 <b>같은 덫</b>입니다. 지금은
     「아는 것」 <b>바로 뒤에 숫자</b>인 것만 봅니다 — 박아 둔 분모는 그 꼴로만
     나타납니다 (8번 · 헛것을 잡는 자는 안 잡는 자보다 나쁘다).            */
  const 박힌 = (src.match(/아는 것\s*\d+\s*\//g) || []);
  is(박힌.length === 0, '  ★ app 에 <b>「아는 것 N/」 숫자가 박혀 있지 않다</b> — ' +
     JSON.stringify(박힌));
  is(D.물음수 !== 8, '  ⚠ 대장의 <b>「N/8」 은 이미 낡았다</b> — 지금 ' + D.물음수 + '가지다');
  /* ★★ <b>여기가 이 토막의 심장입니다.</b> 위의 글자 찾기만으로는
     「'+t.got+'/11」 처럼 <b>이어 붙인 분모</b>를 못 봅니다 — 되돌려 보니
     실제로 안 울렸습니다. 그래서 <b>여쭐 칸을 한 가지 늘려 보고</b> 줄의
     분모가 따라오는지 봅니다. 따라오면 <b>읽어 온 것</b>이고, 그대로면
     <b>적어 둔 것</b>입니다. 늘린 칸은 바로 되돌립니다.               */
  const H = await p.evaluate((f) => {
    const 원 = window.cqaQs;
    window.cqaQs = function () {
      return 원().concat([{ k: '__자가늘린칸', q: { ask: '자가 늘린 칸', why: '', pri: 99 } }]); };
    const r = (0, eval)('(' + f + ')')();
    window.cqaQs = 원;
    return r;
  }, String(목록보기));
  is(H.물음수 === D.물음수 + 1, '  여쭐 칸을 <b>하나 늘렸다</b> — ' + D.물음수 + ' → ' + H.물음수);
  is(H.아는칸.every(x => x.split('/')[1] === String(H.물음수)),
     '  ★★ <b>분모가 따라온다</b> — 읽어 온 수입니다 (' + JSON.stringify(H.아는칸) + ')');
  const I = await p.evaluate(목록보기);
  is(I.아는칸.every(x => x.split('/')[1] === String(D.물음수)),
     '  되돌려 놓았다 — ' + JSON.stringify(I.아는칸));

  /* ══ [7] ③ 모르면 안 적는다 · 배정 DB 줄에는 안 붙는다 ═════ */
  console.log('\n[7] 🙋 <b>모르면 안 적는다</b> (1번) · 배정 DB 줄에는 안 붙는다');
  const E = await p.evaluate((f) => {
    CM.loaded = false;
    const r = (0, eval)('(' + f + ')')();
    CM.loaded = true;
    return r;
  }, String(목록보기));
  is(E.아는칸.every(x => x === ''),
     '  ★★ 못 읽었으면 <b>칸이 아예 없다</b> — 0/11 이라고 안 적습니다 (' +
     JSON.stringify(E.아는칸) + ')');
  const F = await p.evaluate(() => {
    const h = cmRowHtml({ id: 'd1', _db: true, _dbid: 'd1', name_masked: '홍*동',
                          region: '순천', src: '일반', stage: 'TA' });
    return { kn: /cm-kn/.test(h), ff: /cm-ff/.test(h), len: h.length };
  });
  is(!F.kn && !F.ff,
     '  ★ <b>배정 DB 줄</b>에는 두 칸이 다 없다 — 그 분께는 아직 없는 것입니다 (1번)');

  /* ══ [8] ③ 줄이 안 불어난다 ════════════════════════════════ */
  console.log('\n[8] 🙋 <b>줄이 안 불어난다</b> — 폰에서');
  /* ★ <b>절대 높이로 안 잽니다.</b> 한 줄의 키는 그 분 상태마다 다릅니다 —
     재어 보니 같은 390px 에서 <b>160px 에서 223px 까지</b> 벌어집니다(「오늘
     연락함」 을 누르신 분은 줄 안에 「되돌리기」 가 서고, 지난 기록이 많은
     분은 더 깁니다). 거기에 고정 바닥을 걸면 <b>제 칸과 상관없는 것</b> 때문에
     빨간불이 켜집니다 (8번).
     그래서 <b>내 칸을 떼고 다시 재어 견줍니다</b> — 「내가 보탠 것 때문에
     벌어졌나」 를 바로 묻습니다.
     ── 2026-10-11 에 잰 값 ──
       390px  · 지난 기록만 있는 분 221 → <b>223</b> (+2)
       390px  · 오늘 「연락함」 누르신 분 160 → <b>178</b> (+18 · 한 줄 접힘)
       1440px · 109·113 → <b>그대로</b> (컴퓨터에서는 안 벌어집니다)
     +18 은 접이 한 줄 몫입니다. 여기서 더 벌어지면 칸이 <b>줄</b>이 된 것이고,
     그러면 폰 한 화면에 드는 고객이 줄어듭니다.                        */
  const 더늘어도 = 20;
  const G = await p.evaluate(() => {
    const 원 = window.cmRowHtml;
    const 재기 = () => { osRenderList();
      return [].slice.call(document.querySelectorAll('#oscList .t-row'))
        .map(e => Math.round(e.getBoundingClientRect().height)); };
    const 지금 = 재기();
    /* 내가 보탠 것만 떼어 냅니다 — 「아는 것」 칸과 「팩트」 라는 이름표 */
    window.cmRowHtml = function (c) {
      return 원(c).replace(/<span class="cm-kn">[^<]*<\/span>/, '').replace('팩트 ', ''); };
    const 전 = 재기();
    window.cmRowHtml = 원; osRenderList();
    return { 전: 전, 지금: 지금 };
  });
  const 늘어난 = G.지금.map((h, i) => h - G.전[i]);
  is(늘어난.every(d => d >= 0 && d <= 더늘어도),
     '  ★ 내 칸 때문에 벌어진 몫이 <b>' + JSON.stringify(늘어난) + 'px</b> 다 — ' +
     더늘어도 + 'px 까지 (전 ' + JSON.stringify(G.전) + ' → 지금 ' + JSON.stringify(G.지금) + ')');
  /* ⚠ 위 견줌은 <b>내 칸만</b> 떼고 잽니다. 두 칸이 같이 커지면 차이가 그대로라
     못 보므로, <b>달아난 높이</b>로 한 번 더 막습니다.
     ── 되돌려 본 것 (2026-10-11) ──
       · 칸 글을 <b>길게</b> 늘여 봤습니다 → 높이는 <b>그대로</b>였고 (접이 안에서
         남는 자리에 들어갑니다) [5]의 <b>꼴 검사</b>가 울렸습니다
       · 칸을 <b>flex:0 0 100% 줄</b>로 만들어 봤습니다 → 높이가 <b>그대로</b>입니다.
         .rt 가 이미 접혀 있어 그 칸은 이미 제 줄에 서 있었습니다 — <b>망가진 것이
         아니라 아무 일도 안 일어난 것</b>입니다. 안 울리는 것이 맞습니다 (8번)
       · 칸을 <b>30px 글씨</b>로 키워 봤습니다 → [78,40]px · 261px 로 <b>둘 다</b>
         울렸습니다. 정말 벌어지는 자리는 잡습니다
     ★ 이것은 <b>정밀한 자가 아니라 달아남을 막는 울타리</b>입니다. 지금 가장 긴
       줄이 223px 이고, 폰 한 화면(844px)에 <b>세 줄</b>은 들어야 명단입니다.  */
  const 울타리 = 260;
  is(G.지금.every(h => h > 0 && h <= 울타리),
     '  ★ 어느 줄도 <b>' + 울타리 + 'px</b> 를 안 넘는다 — ' + JSON.stringify(G.지금) + 'px');

  /* ══ [9] ③ 두 수에 이름이 붙었다 ═══════════════════════════ */
  console.log('\n[9] 🙋 <b>두 수에 이름이 붙었다</b>');
  is(D.팩트칸.every(x => /^팩트 \d+\/\d+$/.test(x)),
     '  ★ 옆 칸도 <b>이름이 있다</b> — ' + JSON.stringify(D.팩트칸) +
     ' (여태 「0/25」 뿐이었습니다)');
  is(/\.cm-ff,\.cm-kn\{/.test(src) || /\.cm-kn,\.cm-ff\{/.test(src),
     '  ★ 두 칸이 <b>같은 옷</b>이다 — 규칙 한 줄 (5번)');

  /* ══ 끝 ════════════════════════════════════════════════════ */
  is(hits === hits0, '  🌐 <b>서버를 안 부른다</b> (7번) — 밖으로 ' + (hits - hits0) + '번');
  is(errs.length === 0, '  💥 터진 것이 없다 — ' + JSON.stringify(errs.slice(0, 3)));

  await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '가지가 어긋납니다') : '\n✓ X06 의 ①③ 이 다 섭니다');
  process.exit(bad ? 1 : 0);
})();
