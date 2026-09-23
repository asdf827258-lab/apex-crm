#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   check-baneed.js — <b>KB보장분석을 안 넣으신 분이 제안할 때 같이 보이나.</b>

   사장님 말씀 (2026-09-23) —
     「KB보장분석 입력은 <b>고객마다 입력 안 되신 분들을 체크</b>할 수 있도록,
      오늘 미션 또는 알림에서 <b>고객을 제안할 때 같이</b> 넣어 줘」.

   여태 이 말은 🩺 <b>고객 체크</b> 칸에만 있었습니다. 거기는 AP·PC·CS 만
   섭니다. 정작 아침에 전화 거는 열 분(미접촉·TA·부재·거절·기고객)은
   <b>넣으셨는지 안 넣으셨는지 화면 어디에도 안 적혀</b> 있었습니다.

   ── 보는 것 셋 ────────────────────────────────────────────────────
     [1] <b>제안할 때 같이</b> 적히나 — ① 오늘의 알림 줄마다 · 한 분 퀘스트
         띠 · <b>접어 두어도</b> 머리에 몇 분인지
     [2] <b>「모름」 을 「없음」 으로 안 적나</b> (1번) — 이것이 여기서 제일
         중요합니다. 아직 서버에서 안 받아 온 것을 「보장분석 없음」 이라고
         적으면, 사장님은 <b>이미 넣어 두신 분</b>께 또 증권을 달라고
         하십니다. 그러면 화면을 안 믿게 됩니다.
     [3] <b>두 벌로 세지 않나</b> (5번) — 세는 자리는 CHKS 하나이고,
         <b>사람이 아닌 줄</b>(할 일·내 일정)에는 안 붙는다

   견본 이름은 <b>홍길동</b> 집안입니다 (3번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs'), http = require('http'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8963;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{}'); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 🌅 아침 미션의 씨앗은 <b>check-msfive 것을 그대로</b> 빌립니다 — 두 벌이
   되면 한쪽만 고쳐져 두 점검이 다른 화면을 재게 됩니다 (5번).          */
const MS = fs.readFileSync(path.join(ROOT, 'scripts/check-msfive.js'), 'utf8');
const SEED_SRC = MS.match(/const SEED = \(o\) => `([\s\S]*?)`;\n\n\(async/)[1];
const NEWS = eval(MS.match(/const NEWS = (\[[\s\S]*?\n\]);\n/)[1]);      /* eslint-disable-line no-eval */
const SEED = (o) => new Function('o', 'NEWS', 'return `' + SEED_SRC + '`;')(o || {}, NEWS);

/* 화면에서 읽어 오는 것 — <b>글자 그대로</b> 봅니다 */
const LOOK = () => {
  const rows = [...document.querySelectorAll('.hm-ma')].map(e => ({
    nm: ((e.querySelector('.hm-ma-h b') || {}).textContent || ''),
    ba: ((e.querySelector('.hm-ma-a u.ba') || {}).textContent || ''),
    red: !!e.querySelector('.hm-ma-a u.ba.no')
  }));
  const box = document.getElementById('hmFold_ms');
  const head = box ? (box.querySelector('.hm-fold-h .t') || {}).innerText || '' : '';
  return {
    rows: rows,
    head: head.replace(/\s+/g, ' ').trim(),
    band: ((document.querySelector('.hm-q .hm-q-t.ba') || {}).textContent || ''),
    msHi: Math.round(((document.getElementById('hmMsHost') || {}).getBoundingClientRect
      ? document.getElementById('hmMsHost').getBoundingClientRect().height : 0))
  };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
  await p.waitForTimeout(2600);
  await p.evaluate(SEED({})); await p.waitForTimeout(2400);
  await p.evaluate(() => { if (!hmFoldOpen('ms')) hmFoldToggle('ms'); });
  await p.waitForTimeout(260);
  await p.evaluate(() => hmMsJump(0)); await p.waitForTimeout(260);

  /* 오늘 뽑힌 분들께 고객 365일 카드를 붙여 둡니다 — 퀘스트 띠의 그 분까지 */
  const set = (fn) => p.evaluate(fn).then(() => p.waitForTimeout(320));
  const cards = () => p.evaluate(() => {
    const N = hmMsPeople().map(x => x.nm), q = hmNext();
    if (q.x && q.x.t && N.indexOf(q.x.t) < 0) N.push(q.x.t);
    AR.cliRows = N.map((n, i) => ({ id: 'c' + i, name: n, nm: n }));
    return N;
  });

  console.log('\n[1] <b>고객을 제안할 때 같이</b> 적힌다');
  const names = await cards();
  await set(() => { CHKS.rows = []; CHKS.by = {}; hmMsPaint(); hmPaint(); });
  let o = await p.evaluate(LOOK);
  is(o.rows.length >= 2, '  ① 오늘의 알림에 <b>여러 분</b>이 선다 — ' + o.rows.length + '분');
  is(o.rows.length > 0 && o.rows.every(r => r.ba),
     '  <b>줄마다</b> 보장분석이 적힌다 — ' + o.rows.map(r => r.nm + ' ' + (r.ba || '(없음)')).join(' / '));
  is(o.rows.length > 0 && o.rows.every(r => r.red),
     '  안 넣으신 분은 <b>눈에 띄게</b> 적힌다 (붉은 글씨)');
  is(/보장분석 없음\s*\d+명/.test(o.head),
     '  <b>접어 두셔도</b> 머리에 몇 분인지 보인다 — 「' + o.head.slice(0, 64) + '」');
  is(!!o.band, '  <b>한 분 퀘스트 띠</b>에도 적힌다 — 「' + (o.band || '(없음)') + '」');

  console.log('\n[2] <b>「모름」 을 「없음」 으로 안 적는다</b> (1번)');
  /* chkLoad 를 막아 <b>아직 안 받아 온</b> 판을 만듭니다 */
  await set(() => { window.chkLoad = function () {}; CHKS.rows = null; CHKS.by = {}; hmMsPaint(); hmPaint(); });
  o = await p.evaluate(LOOK);
  is(o.rows.length > 0 && o.rows.every(r => /확인 중/.test(r.ba)),
     '  아직 안 받아 왔으면 <b>「확인 중」</b> 이라 적는다 — ' + (o.rows[0] || {}).ba);
  is(o.rows.every(r => !/없음/.test(r.ba)),
     '  안 받아 온 것을 <b>「없음」 이라고 안 적는다</b> — 이미 넣어 두신 분께 또 달라고 하게 된다');
  is(!/보장분석 없음/.test(o.head) && !/보장분석 다 있음/.test(o.head),
     '  머리에도 <b>수를 안 적는다</b> — 「0명」 은 「다 넣으셨다」 로 읽힌다');
  is(!o.rows.some(r => r.red), '  <b>붉게도 안 칠한다</b> — 모르는 것은 손 쓸 일이 아니다');

  console.log('\n[3] <b>두 벌로 세지 않는다</b> (5번)');
  await set(() => { window.chkLoad = function () {}; CHKS.rows = [{}];
    CHKS.by = { c0: { at: '2026-09-01', sum: {} } }; hmMsPaint(); hmPaint(); });
  o = await p.evaluate(LOOK);
  const have = o.rows.filter(r => /있음/.test(r.ba)).length;
  is(have === 1, '  <b>CHKS 한 곳</b>이 답한다 — 한 분만 넣어 두면 한 분만 「있음」 (' + have + '분)');
  const hm = (o.head.match(/보장분석 없음 (\d+)명/) || [])[1];
  is(hm && (+hm) === o.rows.length - 1,
     '  머리의 수가 <b>줄과 맞는다</b> — 머리 ' + hm + '명 · 줄 ' + (o.rows.length - 1) + '명 (두 곳에서 따로 세면 갈립니다)');
  /* <b>사람이 아닌 줄</b>에는 안 붙는가 — 표는 HM_ACT 하나가 안다 */
  const who = await p.evaluate(() => {
    const A = HM_ACT, out = { 사람: [], 아님: [] };
    Object.keys(A).forEach(k => (A[k].ba ? out.사람 : out.아님).push(k));
    return { out: out,
      쪽지: hmBaOf({ k: 'my', t: '내 일정 한 줄' }),
      사람쪽지: hmBaOf({ k: 'db', t: '홍길동A' }) };
  });
  is(who.쪽지 === null, '  <b>사람이 아닌 줄</b>에는 안 붙는다 — ' + who.out.아님.join(' · '));
  is(!!who.사람쪽지, '  <b>사람인 줄</b>에는 붙는다 — ' + who.out.사람.join(' · '));
  is(o.msHi > 0 && o.msHi <= 844,
     '  미션 칸이 <b>' + o.msHi + 'px</b> — 한 화면(844) 이하 (줄을 새로 안 만들고 🎯 줄에 얹었습니다)');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ 보장분석 체크 — 고칠 자리 ' + bad + '곳'); await b.close(); srv.close(); process.exit(1); }
  console.log('✓ 안 넣으신 분이 제안할 때 같이 보이고, 모르는 것을 없다고 안 적습니다. (' + names.length + '분)');
  await b.close(); srv.close();
})();
