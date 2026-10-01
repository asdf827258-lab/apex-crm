/* ══════════════════════════════════════════════════════════════════
   check-kbwon.js — <b>금액이 보장분석에서 홈까지 그대로 오는가.</b>

   사장님 말씀 (2026-10-01) — <b>「금액도 담을 수 있게 해줘」</b>.
   앞 판에서 홈에 「📥 읽어 둔 보장분석」 카드를 세웠는데, 그 카드는
   <b>등급</b>(충분·보통·미흡)까지만 말할 수 있었습니다. 금액은
   <b>frwSum 이 다 셈해 놓고 버리고</b> 있었습니다 — 담는 것은 등급뿐이었습니다.

   ── 이 자가 재는 것은 <b>왕복</b>입니다 ──────────────────────────
     보장분석 frwSum → <b>frwPin</b> → client_meta.wal.amt
       → <b>cmWalOf</b> → 홈 카드 금액 줄 · 복사 글
   한 토막만 봐서는 못 잡습니다. 담기는 쪽이 맞아도 홈이 못 읽으면
   사장님 화면에는 안 보이고, 홈이 맞아도 담는 쪽이 0 을 쓰면 「보장이
   없다」 가 됩니다. 그래서 <b>끝에서 끝까지</b> 돌려 봅니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ <b>0 을 「모름」 으로 담지 않는다</b> (1번) — 목돈 담보는 있는데
         금액을 못 읽은 칸은 <b>won:null</b> 이어야 한다. 0원으로 담으면
         「보장이 없다」 는 뜻이 되고, 고객 앞에서 그것이 드러난다
     [2] ★★ <b>담은 금액이 홈에 그대로</b> 뜬다 — 원 단위가 그대로 오고
         (4번), 못 읽은 칸은 「금액 확인 필요」 라고 적힌다
     [3] ★ <b>두 화면이 같은 말</b>을 한다 — 홈은 금액 말을 다시 짓지 않고
         보장분석의 frwBit 을 그대로 부른다 (5번)
     [4] ★★ <b>증권이 못 답하는 셋</b>(생활 · 은퇴·연금 · 자산이전·상속)에는
         금액을 담지 않는다 — 증권에 없다고 「비었다」 고 적으면 <b>없는
         사실</b>을 만드는 것이다 (1번)
     [5] ★★ <b>「증권 읽음」 이 「충분」 으로 안 보인다</b> — 증권은 담보가
         있다는 것까지만 말한다. 초록으로 칠하면 없는 판단이 생긴다 (1번)
     [6] ★★ <b>한 화면이 두 말을 안 한다</b> (0-1번) — 금액 줄에 적힌 통장이
         윗줄에서 「아직 아무것도 없는 곳」 으로 세어지지 않는다.
         금액을 담고 처음 재었을 때 <b>실제로 그랬습니다</b>
     [7] ★★ <b>지도에서 붙여도 금액이 안 사라진다</b> — waAttach 가 wal 을
         통째로 새로 쓰면 담아 둔 금액과 근거가 <b>되돌릴 길 없이</b>
         없어진다. 근거(by)는 금액을 담기 <b>전부터</b> 그렇게 사라지고 있었다
     [8] ★ 금액을 적은 글은 <b>꼬리말도 금액까지 덮는다</b> (2번) —
         「보장 여부와 <b>금액</b>은 약관과 심사 결과에 따릅니다」
     [9] <b>해지가 확정된 담보는 안 센다</b> — 지금 갖고 계신 것이 아니다

   ── ⚠ 이 자가 <b>증명하지 못하는 것</b> ────────────────────────────
   <b>PDF 를 제대로 읽었는지는 안 잽니다.</b> 그것은 check-pdfread 와
   담보 검수가 보는 자리입니다. 이 자는 「<b>읽은 것이 끝까지 그대로
   오는가</b>」 만 봅니다. 읽기가 틀리면 여기는 초록인데 금액은 틀립니다 —
   그래서 카드에 <b>「근거 보기」</b> 단추가 있습니다.
   ══════════════════════════════════════════════════════════════════ */

const 못박은날 = '2026-09-15T09:00:00Z';
const PIN = (iso) => {
  const FIX = new Date(iso).getTime(); const R = Date; const off = FIX - R.now();
  function F(...a){ return a.length ? new R(...a) : new R(R.now() + off); }
  F.now = () => R.now() + off; F.parse = R.parse; F.UTC = R.UTC; F.prototype = R.prototype;
  window.Date = F;
};
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8975;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
               '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{"key":null,"has":false}'); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본 증권 — <b>홍길동</b> 집안 (3번). 일부러 네 가지를 섞습니다:
   금액이 읽힌 목돈 · 금액을 <b>못 읽은</b> 목돈 · 일당 · 실손 · 그리고 <b>해지</b>.  */
const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '윤시현', role: 'owner', active: true, plan: 'vip' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.__toast = ''; window.toast = function (m) { window.__toast = '' + m; };
  window.setupDone = function () { return true; };
  OSC.loaded = true; OSC.busy = false; OSC.err = '';
  OSC.list = [{ id: 'c1', advisor_id: 'me', name_masked: '홍○○', created_at: '2026-09-01' }];
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.db = [];
  CM.loaded = true; CM.meta = {};
  /* 서버로 안 보냅니다 — 담는 자리만 그대로 씁니다 */
  window.cmSave = function (id, patch, then) {
    var m = cmOf(id), k; for (k in patch) if (patch.hasOwnProperty(k)) m[k] = patch[k];
    if (then) then();
  };
  var pol = { insurer: '○○생명', product_name: '견본' };
  window.frMaster = function () { return [
    { pur:'DIAGNOSIS', pay:'LUMP',  bWon:30000000,  raw:'일반암진단비',  std:'암진단비', page:3, pol:pol },
    { pur:'DIAGNOSIS', pay:'LUMP',  bWon:20000000,  raw:'뇌졸중진단비',  std:'뇌진단비', page:3, pol:pol },
    { pur:'SURGERY',   pay:'LUMP',  bWon:null,      raw:'질병수술비',    std:'수술비',   page:4, pol:pol },
    { pur:'HOSPITAL',  pay:'DAILY', bWon:null,      raw:'상해입원일당',  std:'입원일당', page:4, pol:pol },
    { pur:'ACTUAL_EXPENSE', pay:'ACTUAL', bWon:null, raw:'실손의료비',   std:'실손',     page:5, pol:pol },
    { pur:'DEATH',     pay:'LUMP',  bWon:100000000, raw:'질병사망',      std:'사망',     page:6, pol:pol },
    /* ★ <b>해지가 확정된 담보</b> — 세면 안 됩니다 */
    { pur:'NURSING',   pay:'LUMP',  bWon:70000000,  raw:'간병인지원',    std:'간병',     page:7, pol:pol, cact:'CANCEL' }
  ]; };
  FR.cid = 'c1'; FR.client = { id:'c1', name_masked:'홍○○' };
  go('home');
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  /* ★ 바깥을 막습니다 — 안 막으면 이 자가 사장님 진짜 고객을 잽니다 */
  await ctx.route('**://**', r =>
    r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  await ctx.addInitScript(PIN, 못박은날);
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => typeof renderHome === 'function' && typeof frwSum === 'function'
                             && typeof frwPin === 'function' && typeof hmKbWon === 'function', { timeout: 60000 });
  await p.evaluate(SEED);
  await p.waitForTimeout(2200);

  /* ── 왕복을 <b>한 번에</b> 돌립니다 ───────────────────────────── */
  const R = await p.evaluate(() => {
    const o = {};
    const S = frwSum(frMaster());
    o.sum = { all: S.all, read: S.read, gap: S.gap.slice(),
              w: Object.keys(S.w).reduce((a, k) => (a[k] = { n:S.w[k].n, won:S.w[k].won,
                   lump:S.w[k].lump, daily:S.w[k].daily, actual:S.w[k].actual }, a), {}) };
    frwPin();
    o.toast = window.__toast;
    o.wal = JSON.parse(JSON.stringify(cmWalOf('c1') || {}));
    WA.cid = 'c1'; WA.cnm = '홍○○';
    go('home');
    const e = document.getElementById('hmKbHost');
    o.card = (e.textContent || '').replace(/\s+/g, ' ').trim();
    o.wonLine = ((e.querySelector('.t-note') || {}).textContent || '').replace(/\s+/g, ' ').trim();
    o.tag = [].slice.call(e.querySelectorAll('.t-tag')).map(x =>
      ((x.textContent || '').trim()) + '|' + (x.className || ''));
    o.say = hmKbTalk(cmWalOf('c1'));
    o.bits = hmKbWon(cmWalOf('c1'));
    /* frwBit 을 그대로 부르는지 — 바꿔치기해 보면 홈 글도 같이 바뀐다 */
    const real = window.frwBit;
    window.frwBit = function () { return '★자리표시★'; };
    o.viaFrwBit = hmKbWon(cmWalOf('c1')).join(' / ');
    window.frwBit = real;
    /* 지도에서 붙여 본다 */
    WA.diag = { 1:'mid', 3:'ok' };
    window.osPickClient = function (cb) { cb('c1', '홍○○'); };
    waAttach();
    o.afterMap = JSON.parse(JSON.stringify(cmWalOf('c1') || {}));
    return o;
  });

  console.log('\n[1] ★★ <b>0 을 「모름」 으로 담지 않는다</b> (1번)');
  const A = R.wal.amt || {};
  is(!!R.wal.amt, '  금액 칸(wal.amt)에 담겼다 — ' + Object.keys(A).join(' · ') + '번 통장');
  is(A[2] && A[2].won === null,
    '  ★★ 목돈을 <b>못 읽은 칸은 null</b> 이다 — 병원비 won ' + JSON.stringify(A[2] && A[2].won)
      + ' (0원으로 담으면 「보장이 없다」 가 됩니다)');
  is(A[3] && A[3].won === 50000000,
    '  읽은 금액은 <b>그대로</b> 담긴다 — 치료비 ' + JSON.stringify(A[3] && A[3].won) + '원 (3,000만 + 2,000만)');
  is(A[5] && A[5].won === 100000000, '  가족보호 ' + JSON.stringify(A[5] && A[5].won) + '원');
  is(!!(A[2] && A[2].daily === 1 && A[2].actual === 1),
    '  일당·실손은 <b>건수로</b> 남는다 — 더하면 없는 숫자가 생깁니다 (일당 '
      + (A[2] && A[2].daily) + '건 · 실손 ' + (A[2] && A[2].actual) + '건)');

  console.log('\n[2] ★★ <b>담은 금액이 홈에 그대로</b> 뜬다');
  is(!!R.wonLine, '  금액 줄이 <b>선다</b> — ' + (R.wonLine || '안 섰습니다'));
  is(R.wonLine.indexOf('5,000만원') >= 0, '  <b>치료비 5,000만원</b> — 원 단위가 그대로 옵니다 (4번)');
  is(R.wonLine.indexOf('1억원') >= 0, '  <b>가족보호 1억원</b> — 큰 금액은 억으로 (4번)');
  is(R.wonLine.indexOf('일당 1건') >= 0 && R.wonLine.indexOf('실손 1건') >= 0,
    '  일당·실손은 <b>건수로</b> 적는다');

  console.log('\n[3] ★ <b>두 화면이 같은 말</b>을 한다 (5번)');
  is(R.viaFrwBit.indexOf('★자리표시★') >= 0,
    '  홈이 <b>frwBit 을 그대로 부른다</b> — 바꿔치기하면 홈 글도 같이 바뀝니다 ('
      + R.viaFrwBit.slice(0, 40) + ')');

  console.log('\n[4] ★★ <b>증권이 못 답하는 셋</b>에는 금액을 담지 않는다 (1번)');
  /* ⚠ 이 자리를 <b>고쳤습니다</b> (2026-10-01). 처음에는 「1·6·8 에 금액이
     없다」 만 보았는데, 되돌려 보니 <b>안 울렸습니다</b> — FRW_W 에 그 셋으로
     가는 담보 갈래가 애초에 없어서 <b>무엇을 되돌려도 참</b>이었습니다.
     안 울리는 알람은 알람이 아닙니다 (8번). 그래서 <b>정말로 깨질 수 있는
     것</b>을 봅니다 — 가르는 표 자체를. 누가 'RETIRE→6' 같은 갈래를 더하거나
     FRW_ASK 를 건드리면 그 자리에서 빨간불입니다.                        */
  const part = await p.evaluate(() => ({
    ask: FRW_ASK.slice(), unk: FRW_UNK.slice(),
    toUnk: Object.keys(FRW_W).filter(k => FRW_UNK.indexOf(FRW_W[k]) >= 0)
                             .map(k => k + '→' + FRW_W[k])
  }));
  is(part.unk.slice().sort().join(',') === '1,6,8',
    '  못 답하는 셋이 <b>1 · 6 · 8</b> 이다 — ' + part.unk.join(' · ')
      + ' (생활 · 은퇴·연금 · 자산이전·상속)');
  is(part.ask.concat(part.unk).sort((a, b) => a - b).join(',') === '1,2,3,4,5,6,7,8',
    '  여덟을 <b>빠짐없이 둘로</b> 가른다 — 묻는 쪽 ' + part.ask.length
      + '칸 + 못 묻는 쪽 ' + part.unk.length + '칸');
  is(part.toUnk.length === 0,
    '  ★★ 담보 갈래가 그 셋을 <b>가리키지 않는다</b> — ' + part.toUnk.length + '가지'
      + (part.toUnk.length ? (' ← ' + part.toUnk.join(' / ')
          + ' (증권에 없다고 「비었다」 고 적으면 없는 사실을 만듭니다)') : ''));
  is(!A[1] && !A[6] && !A[8],
    '  그리고 <b>실제로도 안 담겼다</b>' + ((A[1] || A[6] || A[8]) ? ' ← 담겼습니다' : ''));

  console.log('\n[5] ★★ <b>「증권 읽음」 이 「충분」 으로 안 보인다</b> (1번)');
  const rdTag = R.tag.filter(x => x.indexOf('증권 읽음') >= 0);
  is(rdTag.length === 3, '  「증권 읽음」 꼬리표가 <b>3개</b> — ' + rdTag.length + '개');
  is(rdTag.every(x => !/\bok\b/.test((x.split('|')[1] || ''))),
    '  ★★ <b>초록(ok)이 아니다</b> — ' + rdTag.map(x => x.split('|')[1]).join(' / ')
      + ' (초록으로 칠하면 「충분」 이라는 없는 판단이 생깁니다)');

  console.log('\n[6] ★★ <b>한 화면이 두 말을 안 한다</b> (0-1번)');
  const inWon = ['병원비', '치료비', '가족보호'];
  const m = R.card.match(/아직 아무것도 없는 곳 — ([^💰]*)/);
  const none = m ? m[1] : '';
  is(R.card.indexOf('증권만 읽은 곳') >= 0,
    '  <b>「증권만 읽은 곳」</b> 을 따로 적는다 — 판정은 아직 없습니다');
  is(inWon.every(x => none.indexOf(x) < 0),
    '  ★★ 금액 줄에 적힌 통장이 <b>「아직 아무것도 없는 곳」 에 안 들어간다</b>'
      + ' — 그쪽 글: 「' + none.trim().slice(0, 40) + '」');

  console.log('\n[7] ★★ <b>지도에서 붙여도 금액이 안 사라진다</b>');
  is(!!(R.afterMap.amt && R.afterMap.amt[3] && R.afterMap.amt[3].won === 50000000),
    '  붙인 뒤에도 금액이 <b>그대로</b>다 — 치료비 '
      + JSON.stringify(R.afterMap.amt && R.afterMap.amt[3] && R.afterMap.amt[3].won) + '원');
  is(R.afterMap.lv && R.afterMap.lv[1] === 'mid' && R.afterMap.lv[3] === 'ok',
    '  지도에서 누른 판정은 <b>그대로 담긴다</b> — 지우는 것이 아닙니다');
  is(!(R.afterMap.by && R.afterMap.by[3]),
    '  ★ 판정이 바뀐 칸의 <b>옛 근거는 버린다</b> — 바뀐 판정에 옛 까닭을 붙이면 거짓입니다 (1번)');

  console.log('\n[8] ★ 금액을 적은 글은 <b>꼬리말도 금액까지</b> 덮는다 (2번)');
  is(R.say.indexOf('증권에서 읽은 것') >= 0, '  복사 글에 <b>읽은 금액</b>이 들어간다');
  is(R.say.indexOf('보장 여부와 금액은 약관과 심사 결과에 따릅니다') >= 0,
    '  ★★ <b>「보장 여부와 금액은 약관과 심사 결과에 따릅니다」</b> — 금액만 적고 넘어가지 않습니다');
  is(!/[0-9]\s*(세|개월|%|퍼센트)/.test(R.say) && R.say.indexOf('한도는') < 0,
    '  ★ <b>한도 · 나이 · 개월 수</b>는 여전히 안 적는다 (2번)');
  is(R.say.indexOf('홍') < 0, '  ★ <b>실명이 안 나간다</b> (3번)');

  console.log('\n[9] <b>해지가 확정된 담보는 안 센다</b>');
  is(!A[7], '  간병·요양(7) 에 금액이 <b>없다</b> — 해지된 7,000만원을 세지 않았습니다'
    + (A[7] ? (' ← ' + JSON.stringify(A[7])) : ''));
  is(R.sum.all === 6, '  셈에서도 <b>6건</b>만 센다 — ' + R.sum.all + '건');
  is(R.toast.indexOf('금액은 2칸에 담았습니다') >= 0,
    '  <b>몇 칸에 담았는지</b> 말한다 — 「' + R.toast.slice(0, 80) + '」');
  is(errs.length === 0, '  재는 동안 <b>터진 곳이 없다</b>'
    + (errs.length ? (' ← ' + errs.slice(0, 2).join(' / ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 금액이 보장분석에서 홈까지 오는 길에 구멍이 있습니다')
                  : '✓ 금액이 끝에서 끝까지 그대로 오고 · 못 읽은 칸은 0 이 아니고 · 지도에서 붙여도 안 사라집니다');
  console.log('  ⚠ PDF 를 제대로 읽었는지는 안 잽니다 — 그래서 카드에 「근거 보기」 단추가 있습니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
