/* 🎓 <b>교육자금 발표덱 — 고객이 한 쪽에 한 가지만 보는가.</b>

   사장님 말씀 (2026-11-05) 「<b>교육자금계산기가 너무 복잡해</b>, 다시 한번
   준비해서 전체적으로 <b>고객을 이해하기 쉽게</b> 각 발표덱을 전부 보기 쉽게
   수정하고, <b>왜 해야되는지 어필</b>하고」 · 「<b>계산기 자체는 그대로 둬</b>,
   교육자금만, 너무 복잡하게 되어있어서, 수정하는거야」.

   ★★ 재어 보니 그 말씀이 그대로 숫자였습니다 (1440×900 · 발표 모드) —
     여섯 쪽 중 <b>네 쪽이 창을 넘었고</b>, 계산 장은 창을 <b>2,969px</b>
     넘었습니다(화면 넷). 고객 앞에서 네 번 스크롤했습니다. 폰에서는
     그 장이 6,585px(화면 여덟)였습니다.
   ★★ 그리고 <b>발표 둘째 쪽이 설계사용 표</b>였습니다 — 1장 안에 「우리 지역
     지원금 취합본」(229개 시·군·구 · 붙여넣기 · 내보내기)이 들어 있었습니다.

   여기서 못 박는 것은 이렇습니다.

     1. 발표 차례(DECK.e)가 <b>한 쪽에 한 가지</b>로 갈라져 있다 — 열넷 이상.
     2. ★★ <b>설계사용 표(erg)는 발표 차례에 없다</b> — 고객 앞에 안 세웁니다.
        화면은 그대로 있어 스크롤로 씁니다 (6번 · 길을 안 지웁니다).
     3. ★ <b>「왜 지금인가」(ewhy)가 표지 바로 뒤</b>에 있다 (사장님 말씀
        「왜 해야되는지 어필하고」).
     4. 발표가 열넷 이상의 쪽으로 선다.
        ★ <b>넘침(몇 px 넘는가)은 여기서 안 셉니다</b> — 판 X338 에서 다섯 갈래를
        다 쪼개면서 <b>scripts/check-deck5.js</b> 한 곳으로 모았습니다 (5번).
     5. ★★ <b>계산기를 안 건드렸다</b> — 셈하는 자가 쓰는 칸 이름
        (eRes · eMonBox · eWhenBox · eSplit · eFee)이 <b>다 그대로</b> 있고,
        값이 그 자리에 <b>실제로 찍힌다.</b> 장만 갈랐습니다.
     6. ★ 차례에 적힌 id 가 <b>다 정말 있는 장</b>이다 — 없는 id 를 적으면
        그 쪽이 <b>조용히 빠집니다</b>(쿠폰 트랙이 두 번 그렇게 사라졌습니다).

   ★ 되돌려 보았습니다 (8번) — 네 가지를 깨뜨려 보고 전부 울었습니다:
     ⓐ 설계사용 표를 발표 차례에 넣기 ⓑ 「왜 지금」 을 빼기
     ⓒ 계산 칸 이름을 바꾸기 ⓓ 쪼갠 장을 다시 하나로 붙이기.               */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const FILE = 'app/상담자료/통합상담_APEX.html';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
               '.css':'text/css; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* ⚠ 이 수는 이제 <b>안 씁니다</b> — 넘침을 재는 자는 scripts/check-deck5.js 입니다
   (판 X338). 여기 남겨 둔 것은 이 자의 머리글이 아직 2,969px 이야기를 하기
   때문입니다. 선을 고치실 때는 <b>check-deck5 의 넘침선</b>을 고치십시오. */
const 넘침선 = 400;
/* 셈하는 자가 쓰는 칸 — 이름이 바뀌면 값이 어디에도 안 찍힙니다 */
const 계산칸 = ['eRes', 'eMonBox', 'eWhenBox', 'eSplit', 'eFee'];

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 1440, height: 900 } });
  /* 🔌 바깥을 막습니다 (7번) */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                  ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await pg.goto('http://127.0.0.1:' + PORT + '/' + FILE.split('/').map(encodeURIComponent).join('/') + '?track=e',
                { waitUntil: 'load' });
  await pg.waitForTimeout(2500);

  head('[1] 발표 차례가 <b>한 쪽에 한 가지</b>로 갈라져 있나');
  /* ⚠ 차례(DECK)는 덱 안쪽 덩이라 <b>브라우저에서 못 꺼냅니다</b>(window 에
     안 붙습니다). 그래서 <b>파일에서</b> 읽고, 장이 정말 있는지는 브라우저에
     묻습니다 — 안 보이는 것을 보는 척하지 않습니다 (1번). */
  const SRC = fs.readFileSync(path.join(ROOT, FILE), 'utf8');
  const 줄 = (SRC.match(/\n\s*e:\s*\[([\s\S]*?)\],/) || [])[1] || '';
  const 차례 = (줄.match(/'([a-zA-Z0-9]+)'/g) || []).map(x => x.slice(1, -1));
  const 없는장 = await pg.evaluate(ids => ids.filter(id => !document.getElementById(id)), 차례);
  const D = { 차례: 차례, 없는장: 없는장 };
  is(D.차례.length >= 14, '  발표 차례가 <b>' + D.차례.length + '쪽</b> (고치기 전 6쪽 · 14쪽 아래면 다시 뭉친 것입니다)');
  is(D.없는장.length === 0, D.없는장.length
    ? ('차례에 <b>없는 장</b>이 있다 — ' + D.없는장.join(' ') + ' (그 쪽이 조용히 빠집니다)')
    : '차례에 적힌 장이 <b>다 있다</b> — 쿠폰 트랙이 두 번 조용히 사라진 그 자리입니다');

  head('[2] ★★ <b>설계사용 표는 고객 앞에 안 세운다</b>');
  is(D.차례.indexOf('erg') < 0,
     '발표 차례에 <b>erg(우리 지역 취합 표)가 없다</b> — 229개 시·군·구 표를 고객에게 띄우지 않습니다');
  const 있나 = await pg.evaluate(() => !!document.getElementById('erg'));
  is(있나, '그래도 <b>화면은 그대로 있다</b> — 스크롤로 내려오면 쓰십니다 (6번 · 길을 안 지웁니다)');

  head('[3] ★ <b>「왜 지금인가」</b> 가 표지 바로 뒤 (사장님 말씀 「왜 해야되는지 어필하고」)');
  is(D.차례[1] === 'ewhy', '두 번째 쪽이 <b>ewhy</b> 다 — 지금은 「' + (D.차례[1] || '(없음)') + '」');
  const 왜 = await pg.evaluate(() => {
    const s = document.getElementById('ewhy');
    if (!s) return { 없음: true };
    return { 칸: s.querySelectorAll('.card').length,
             글: (s.textContent || '').replace(/\s+/g, ' ').trim().length };
  });
  is(!왜.없음 && 왜.칸 >= 3, '  까닭이 <b>세 가지</b>로 선다 — 칸 ' + (왜.칸 || 0) + '개');

  head('[4] ★ 발표에서 창을 넘어도 <b>' + 넘침선 + 'px 안</b> (고치기 전 2,969px)');
  await pg.click('#presStart'); await pg.waitForTimeout(900);
  const n = await pg.evaluate(() => +document.getElementById('pNum').textContent.split('/')[1]);
  let 넘 = [], 제일 = 0;
  for (let i = 0; i < n; i++) {
    const r = await pg.evaluate(() => {
      const de = document.documentElement, s = document.querySelector('.pon');
      return { id: s ? s.id : '?', 넘침: Math.max(0, de.scrollHeight - de.clientHeight) };
    });
    if (r.넘침 > 8) { 넘.push(r.id + ' +' + r.넘침 + 'px'); 제일 = Math.max(제일, r.넘침); }
    await pg.keyboard.press('ArrowRight');
    await pg.waitForTimeout(120);
  }
  is(n >= 14, '  발표가 <b>' + n + '쪽</b> 선다');
  /* ★ <b>넘침은 여기서 안 묻습니다</b> (판 X338 · CLAUDE.md 5번 「묻는 곳을 하나로」).
     다섯 갈래 전부의 넘침은 <b>scripts/check-deck5.js [1]</b> 이 셉니다. 두 곳에서
     각자 세면 한쪽만 선을 올렸을 때 서로 다른 답을 합니다 — 알람이 둘이면 둘 다
     못 믿게 됩니다. 여기서는 <b>지금 몇 px 인지 적어만</b> 둡니다.          */
  console.log('    (제일 심한 쪽 +' + 제일 + 'px · 창 넘는 쪽 ' + 넘.length + '/' + n +
              ' — 선을 긋는 자는 check-deck5 입니다)');

  head('[5] ★★ <b>계산기를 안 건드렸나</b> — 셈하는 자가 쓰는 칸이 그대로 있고 값이 찍히나');
  const C = await pg.evaluate((칸) => {
    const out = {};
    칸.forEach(id => {
      const e = document.getElementById(id);
      out[id] = { 있나: !!e, 글: e ? (e.textContent || '').replace(/\s+/g, ' ').trim().length : 0 };
    });
    return out;
  }, 계산칸);
  계산칸.forEach(id => {
    is(C[id].있나, '  <b>' + id + '</b> 칸이 있다' + (C[id].있나 ? '' : ' ← 이름이 바뀌면 값이 어디에도 안 찍힙니다'));
  });
  const 빈칸 = 계산칸.filter(id => C[id].있나 && C[id].글 < 4);
  is(빈칸.length === 0, '  칸마다 <b>값이 찍혀 있다</b>' +
     (빈칸.length ? (' ← 빈 칸: ' + 빈칸.join(' ') + ' (장을 가르다 셈을 끊은 것입니다)') : ''));

  head('[6] 조용한가');
  is(errs.length === 0, errs.length ? ('콘솔 에러 — ' + errs.slice(0, 2).join(' / ')) : '콘솔에 에러가 없다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
                  : '교육자금 발표덱 점검 통과 — 한 쪽에 한 가지 · 설계사용 표는 고객 앞에 안 섭니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
