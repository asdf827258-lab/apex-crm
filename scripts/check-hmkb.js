/* ══════════════════════════════════════════════════════════════════
   check-hmkb.js — <b>홈의 「📥 읽어 둔 보장분석」 카드.</b>

   사장님 말씀 (2026-10-01) — <b>「읽어 둔 보장분석 카드 만들어줘」</b>.
   목각(vHome)에 있고 우리에게 없던 카드입니다.

   ── 왜 이 자가 따로 있나 ─────────────────────────────────────────
   이 카드는 <b>고객 앞에서 「어디가 비었는지」 를 말하는 자리</b>입니다.
   그래서 틀리는 방식이 셋입니다 —
     ① <b>안 본 칸을 비었다고</b> 적는다 (또는 그 반대)
     ② <b>못 읽은 것을 없다고</b> 적는다
     ③ 복사해 가는 글에 <b>한도 · 나이 · 개월 수</b> 같은 숫자가 섞인다
   셋 다 고객 앞에서 무너지는 자리라, 이 자가 셋을 모두 봅니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 카드가 <b>늘 선다</b> — 띄워 둔 것이 없는 날도 자리를 지킨다
         (사장님 말씀 2026-09-26 「있다 없다 하는 칸을 없앱니다」)
     [2] ★★ <b>네 가지를 갈라 적는다</b> (1번) —
         못 읽음 ≠ 띄운 것 없음 ≠ 진단 안 담김 ≠ 미흡 0개.
         못 읽었을 때 <b>숫자가 한 개도 없어야</b> 한다
     [3] ★★ <b>「아직 안 본 칸」 을 0 으로 적지 않는다</b> — 여덟 칸 중
         몇 칸을 봤는지 적고, 안 본 칸의 <b>이름</b>을 적는다
     [4] 말이 <b>고객 카드와 같다</b> — 「비어 있는 통장 N개」 ·
         「미흡으로 찍힌 칸이 없습니다」 (cmWalRefHtml 과 한 입 · 5번)
     [5] ★ 네 단추가 <b>다 살아 있고 있는 화면</b>을 가리킨다 —
         근거 보기(waOpenFor) · 내리기(waDetach) · 관리 멘트 복사 ·
         한 장으로 보기(navGoCli). 모두 <b>있던 함수</b>다 (5번)
     [6] ★★ 복사해 가는 글이 <b>사실만</b>이다 — 한도·나이·개월 수 같은
         숫자가 없고(2번), <b>실명이 안 나간다</b>(3번 · 「고객님」),
         「심사 결과에 따릅니다」 가 빠지지 않는다 (2번)
     [7] <b>「내리기」 가 정말 내린다</b> — 눌러 보고 카드가 ② 로 돌아간다
     [8] 손가락이 닿는다 — 단추가 44px 아래가 없다

   ── ⚠ 이 자가 <b>증명하지 못하는 것</b> ────────────────────────────
   「목각과 똑같다」 는 <b>안 잽니다.</b> 목각은 PDF 에서 읽은 <b>금액</b>을
   담고 우리는 <b>등급</b>(충분·보통·미흡)을 담습니다. 금액 칩은 못 세웁니다 —
   그 자료가 앱에 없습니다. 없는 금액을 지어 적으면 고객이 그것을 사실로
   믿습니다 (1번). 그 대신 목각에 없는 <b>「아직 안 본 칸」</b> 을 적습니다.
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
const ROOT = process.cwd(), PORT = 8973;
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

/* 견본은 <b>홍길동</b> 집안 (3번). 「홍○○」 는 서버가 주는 가린 이름입니다. */
const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '윤시현', role: 'owner', active: true, plan: 'vip', team_id: 't1' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.__toast = ''; window.toast = function (m) { window.__toast = '' + m; };
  window.setupDone = function () { return true; };
  OSC.loaded = true; OSC.busy = false; OSC.err = '';
  OSC.list = [{ id: 'c1', advisor_id: 'me', name_masked: '홍○○', created_at: '2026-09-01' }];
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.db = [];
  go('home');
};

/* 그 칸을 <b>한 곳에서</b> 뜹니다 — 두 번 세지 않습니다 (5번) */
const LOOK = () => {
  try { go('home'); } catch (e) {}
  const e = document.getElementById('hmKbHost');
  if (!e) return { no: 1 };
  const t = (e.textContent || '').replace(/\s+/g, ' ').trim();
  return { no: 0, h: Math.round(e.getBoundingClientRect().height), t,
           digits: (t.match(/[0-9]/g) || []).length,
           btn: [].slice.call(e.querySelectorAll('button')).map(b => ({
             t: (b.textContent || '').trim(),
             h: Math.round(b.getBoundingClientRect().height),
             oc: b.getAttribute('onclick') || '',
             fn: ((b.getAttribute('onclick') || '').match(/^\s*([A-Za-z_$][\w$]*)\s*\(/) || [])[1] || '' })),
           tag: [].slice.call(e.querySelectorAll('.t-tag')).map(x =>
             ((x.textContent || '').trim()) + '|' + (x.className || '')) };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  /* ★ <b>바깥을 막습니다</b> — 안 막으면 이 자가 사장님 진짜 고객을 잽니다 */
  await ctx.route('**://**', r =>
    r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  await ctx.addInitScript(PIN, 못박은날);
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => typeof renderHome === 'function' && typeof go === 'function', { timeout: 60000 });
  await p.evaluate(SEED);
  await p.waitForTimeout(2200);

  /* ── [1]·[2] 못 읽었을 때 ──────────────────────────────────── */
  console.log('\n[1] 아직 <b>못 읽었을 때</b> — 「없다」 고 말하지 않는다 (1번)');
  const A = await p.evaluate(() => { CM.loaded = false; CM.meta = {}; WA.cid = ''; return (0, eval)('(' + LOOKSRC + ')')(); },
    undefined).catch(() => null);
  const run = async (prep) => p.evaluate(({ prep, src }) => {
    (0, eval)('(' + prep + ')')();
    return (0, eval)('(' + src + ')')();
  }, { prep: String(prep), src: String(LOOK) });

  const s1 = await run(() => { CM.loaded = false; CM.meta = {}; WA.cid = ''; });
  is(!s1.no, '  카드 칸(#hmKbHost)이 <b>있다</b>');
  is(!s1.no && s1.h > 0, '  <b>자리를 지킨다</b> — ' + s1.h + 'px (없는 날도 안 사라진다)');
  is(s1.t.indexOf('아직 못 읽었습니다') >= 0, '  ★ <b>「아직 못 읽었습니다」</b> 라고 적는다 — 못 읽음 ≠ 없음');
  is(s1.digits === 0, '  ★★ <b>숫자가 한 개도 없다</b> — ' + s1.digits + '개 (못 읽었으면 아무 숫자도 안 적는다)'
    + (s1.digits ? (' ← 「' + s1.t.slice(0, 70) + '」') : ''));

  /* ── [2] 읽었지만 띄워 둔 것이 없을 때 ────────────────────── */
  console.log('\n[2] 읽었지만 <b>띄워 둔 것이 없을 때</b> — 무엇을 하면 되는지 적는다');
  const s2 = await run(() => { CM.loaded = true; CM.meta = {}; WA.cid = ''; WA.cnm = ''; });
  is(s2.t.indexOf('홈에 띄워 둔 보장분석이 없습니다') >= 0, '  <b>없다고 적는다</b>');
  is(s2.t.indexOf('고객에게 붙이기') >= 0, '  <b>어떻게 세우는지</b> 적는다 — 「🙌 고객에게 붙이기」');
  is(s2.btn.some(x => x.oc.indexOf("go('wallets')") >= 0), '  <b>그 화면으로 가는 단추</b>가 있다 — 8통장 진단');

  /* ── [3] 붙였는데 진단이 안 담긴 날 ──────────────────────── */
  console.log('\n[3] 붙였는데 <b>진단이 안 담긴 날</b> — 이것도 갈라 적는다');
  const s3 = await run(() => { CM.loaded = true; CM.meta = {}; WA.cid = 'c1'; WA.cnm = '홍○○'; });
  is(s3.t.indexOf('아직 안 담겼습니다') >= 0, '  <b>안 담겼다</b>고 적는다 — 「빈 통장 0개」 로 적지 않는다');
  is(s3.btn.some(x => x.fn === 'hmKbDown'), '  <b>내리기</b> 단추가 있다 — 잘못 붙인 것을 풀 길이 있다 (6번)');

  /* ── [4] 다 있는 날 ──────────────────────────────────────── */
  console.log('\n[4] <b>다 있는 날</b> — 미흡 둘 · 안 본 칸 셋');
  const s4 = await run(() => {
    CM.loaded = true; WA.cid = 'c1'; WA.cnm = '홍○○';
    CM.meta = { c1: { wal: { at: '2026-09-28', lv: { 2:'ok', 3:'low', 4:'low', 5:'mid', 6:'ok' } } } };
  });
  is(s4.t.indexOf('비어 있는 통장 2개') >= 0,
    '  ★ 말이 <b>고객 카드와 같다</b> — 「비어 있는 통장 2개」 (5번)');
  is(s4.t.indexOf('치료비') >= 0 && s4.t.indexOf('소득공백') >= 0,
    '  <b>어디가 비었는지</b> 이름을 적는다 — 치료비 · 소득공백');
  is(s4.t.indexOf('아직 안 본 곳') >= 0,
    '  ★★ <b>「아직 안 본 곳」</b> 을 따로 적는다 — 안 본 것과 없는 것은 다르다 (1번)');
  is(s4.t.indexOf('여덟 칸 중 5칸') >= 0,
    '  ★ <b>몇 칸을 봤는지</b> 적는다 — 「여덟 칸 중 5칸」 (안 본 칸을 0 으로 묻지 않는다)');
  is(s4.tag.length === 8, '  통장 꼬리표가 <b>여덟</b>이다 — ' + s4.tag.length + '개');
  const noTag = s4.tag.filter(x => x.indexOf('안 봄') >= 0);
  is(noTag.length === 3 && noTag.every(x => !/ (ok|due|no)$/.test(x.split('|')[1] || '')),
    '  ★ 안 본 칸은 <b>「안 봄」 · 색 없음</b>이다 — ' + noTag.length + '개 (빨강으로 칠하면 「비었다」 가 된다)');
  is(s4.tag.filter(x => /\bno\b/.test(x.split('|')[1] || '')).length === 2,
    '  미흡만 <b>빨강</b>이다 — ' + s4.tag.filter(x => /\bno\b/.test(x.split('|')[1] || '')).length + '개');

  /* ── [5] 네 단추 ─────────────────────────────────────────── */
  console.log('\n[5] ★ 네 단추가 <b>다 살아 있고 있던 함수</b>를 부른다 (5번)');
  const live = await p.evaluate(fns => fns.map(f => typeof window[f] === 'function'),
    ['waOpenFor', 'waDetach', 'copyText', 'navGoCli']);
  is(live.every(Boolean), '  부르는 함수가 <b>원래 있던 것</b>이다 — waOpenFor · waDetach · copyText · navGoCli');
  const want = [['근거 보기', 'waOpenFor'], ['내리기', 'hmKbDown'],
                ['관리 멘트 복사', 'hmKbCopy'], ['한 장으로 보기', 'navGoCli']];
  want.forEach(([t, fn]) => {
    const x = s4.btn.filter(b => b.t.indexOf(t) >= 0)[0];
    is(!!x && x.fn === fn, '  <b>「' + t + '」</b> → ' + (x ? (x.fn + '()') : '없습니다'));
  });

  /* ── [6] 복사해 가는 글 ──────────────────────────────────── */
  console.log('\n[6] ★★ 복사해 가는 글이 <b>사실만</b>이다 (1·2·3번)');
  const say = await p.evaluate(() => hmKbTalk(cmWalOf('c1')));
  is(say.indexOf('고객님') >= 0 && say.indexOf('홍') < 0,
    '  ★ <b>실명이 안 나간다</b> — 「고객님」 으로 나간다 (3번)');
  is(say.indexOf('치료비') >= 0 && say.indexOf('소득공백') >= 0, '  비어 있는 곳을 <b>그대로</b> 적는다');
  is(say.indexOf('아직 안 봤다는 뜻') >= 0, '  ★ <b>안 본 칸을 비었다고 하지 않는다</b> (1번)');
  is(say.indexOf('심사 결과에 따릅니다') >= 0, '  ★ <b>「심사 결과에 따릅니다」</b> 가 있다 (2번)');
  /* 한도·나이·개월 수 — <b>맨숫자</b>가 있으면 그 자리에서 빨간불입니다.
     진단 날짜(2026-09-28)는 이 글에 안 넣었으므로 숫자가 0 이어야 합니다.
     ★ <b>예외 한 줄</b> — 「8통장」 은 <b>상품 틀의 이름</b>이지 한도가
       아닙니다(CLAUDE.md 8번의 「상증법 제18조」 와 같은 자리). 이 자를 처음
       돌렸을 때 이것 하나가 울렸습니다 — 글은 「여덟 통장」 으로 고쳤고,
       예외도 남겨 둡니다. 넓게 잡지 말고 <b>확실한 것만</b> 잡습니다.      */
  const nums = (say.replace(/8\s*통장/g, '여덟 통장').match(/[0-9]+/g) || []);
  is(nums.length === 0, '  ★★ <b>맨숫자가 한 개도 없다</b> — ' + nums.length + '개'
    + (nums.length ? (' ← ' + nums.join(' · ') + ' (한도·나이·개월 수는 시행령이 바꿉니다 · 2번)') : ''));
  is(!/[0-9]\s*(세|개월|년|%|퍼센트|만원|억)/.test(say), '  ★ <b>한도 · 나이 · 기간</b>을 적지 않는다 (2번)');

  /* ── [7] 내리기가 정말 내린다 ────────────────────────────── */
  console.log('\n[7] <b>「내리기」 가 정말 내린다</b> — 눌러 봅니다');
  const down = await p.evaluate(({ src }) => {
    const e = document.getElementById('hmKbHost');
    const b = [].slice.call(e.querySelectorAll('button')).filter(x => (x.textContent || '').indexOf('내리기') >= 0)[0];
    if (!b) return { no: 1 };
    b.click();
    return { no: 0, cid: WA.cid || '', after: (0, eval)('(' + src + ')')() };
  }, { src: String(LOOK) });
  is(!down.no, '  단추를 찾았다');
  is(!down.no && down.cid === '', '  <b>붙여 둔 것이 풀렸다</b> — WA.cid 「' + down.cid + '」');
  is(!down.no && down.after.t.indexOf('홈에 띄워 둔 보장분석이 없습니다') >= 0,
    '  카드가 <b>② 로 돌아간다</b> — 사라지지 않는다');

  /* ── [8] 손가락 ──────────────────────────────────────────── */
  console.log('\n[8] <b>손가락이 닿는다</b>');
  const small = s4.btn.filter(x => x.h > 0 && x.h < 44);
  is(small.length === 0, '  단추 ' + s4.btn.length + '개 중 44px 아래가 <b>' + small.length + '개</b>'
    + (small.length ? (' ← ' + small.map(x => x.h + 'px 「' + x.t + '」').join(' / ')) : ''));
  is(errs.length === 0, '  재는 동안 <b>터진 곳이 없다</b>'
    + (errs.length ? (' ← ' + errs.slice(0, 2).join(' / ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 「읽어 둔 보장분석」 카드에 구멍이 있습니다')
                  : '✓ 네 가지를 갈라 적고 · 안 본 칸을 0 으로 적지 않고 · 복사 글에 맨숫자가 없습니다');
  console.log('  ⚠ 「목각과 똑같다」 는 안 잽니다 — 목각은 금액, 우리는 등급입니다. 이 파일 머리에 적어 두었습니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
