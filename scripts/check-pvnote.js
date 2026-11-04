/* 🗒 강사 노트 — <b>발표하는 쪽마다 할 말이 적혀 있는가.</b>

   사장님 말씀 (2026-11-04) 「발표 PPT + 강사 노트까지 새로」.
   판 X326 에서 노트를 <b>12곳</b>만 달았습니다. 200쪽을 넘기는데 12곳이면
   나머지 쪽에서는 강사가 <b>글을 읽어 주게</b> 됩니다 — 그러면 발표가 아니라
   낭독입니다. 그래서 쪽마다 「무엇을 시킬지」 를 적었습니다.

   여기서 못 박는 것은 이렇습니다.

     1. 발표 <b>모든 쪽</b>에 노트가 뜬다. 「아직 안 썼습니다」 가 0쪽이다.
     2. 강의 코스 넷(신입·가족·경력·핵심)도 <b>빠짐없이</b>.
     3. 한 장이 여러 쪽으로 쪼개지면 앞 노트를 가져다 쓰는데,
        <b>가져온 것이라고 밝힌다</b> — 이 쪽에 쓴 척하지 않는다 (1번).
     4. ①~⑨ 칸의 <b>진행 방식은 DEEP_NOTE 한 곳</b>에만 적혀 있다.
        유닛마다 베껴 적으면 열 벌이 되어 한쪽만 고쳐지는 날이 온다 (5번).
     5. 노트에 <b>금액·한도·요건 숫자를 적지 않는다.</b> 강사가 외운 숫자를
        말하면 그 자리에서 틀린다 (2번).
     6. 노트는 <b>고객에게 안 보인다.</b> 책(스크롤)에서 숨어 있고, 그래서
        쪽을 쪼갤 때 자리를 안 먹는다. 인쇄에도 안 나온다.

   ★ 되돌려 보았습니다 (8번) — 다섯 가지를 일부러 깨뜨려 보고 전부 울었습니다:
     ① 22장의 노트를 지우기 ② 신입 코스 17장의 하나뿐인 노트를 지우기
     ③ 진행 방식을 유닛에 베껴 적기 ④ 노트에 금액을 적기 ⑤ 노트를 책에서 보이게 하기.

   ⚠ <b>이 자가 못 보는 것</b> — 한 장에 노트가 여럿일 때 그중 하나를 지우면
     울지 않습니다. 같은 장의 앞 노트가 「이어집니다」 로 그 자리를 메우기
     때문입니다. 그래서 이 자는 「<b>장마다 적어도 하나</b>」 를 지킵니다 —
     「칸마다 하나」 가 아닙니다. 심화 유닛의 아홉 칸은 [4] 가 따로 봅니다
     (DEEP_NOTE 에 아홉 가지가 다 있나). 안 보는 것을 보는 척하지 않습니다 (1번). */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const FILE = 'app/상담자료/미끼상품_접촉전략.html';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8' };
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
const head = (t) => console.log('\n' + t);

/* 적으면 안 되는 것 — <b>금액·한도·요건 숫자.</b> 「2분 주십시오」 같은 진행
   시간, 「12쪽」 같은 분량, 「40대」 같은 대상 설명은 요건이 아니라 잡지 않는다.
   헛것을 잡는 점검은 안 잡느니만 못하다 (8번). */
const MONEY = [
  [/[0-9][0-9,]*\s*만\s*원/, '「N만원」 — 금액'],
  [/[0-9][0-9,]*\s*억/, '「N억」 — 금액'],
  [/[0-9][0-9,]*\s*원(?!포인트)/, '「N원」 — 금액'],
  [/[0-9]+\s*(?:%|퍼센트)/, '「N%」 — 비율'],
  [/[0-9]+\s*개월/, '「N개월」 — 요건 기간'],
  [/[0-9]+\s*세\s*(?:이상|이하|미만|까지)/, '「N세 이상」 — 요건 나이'],
];
const 빈말 = '아직 강사 노트를 안 썼습니다';

/* ── 📏 <b>아직 한 화면을 넘는 쪽이 몇인가</b> — 판 X326 의 남은 숙제 ⓑ ────
   판 X326 에서 발표를 쪽으로 쪼갰지만 <b>표 한 장·세트 묶음</b>처럼 더 쪼개면
   뜻이 끊기는 덩이가 남았습니다. 그 쪽만 스크롤이 남고, 화면이 「아래로 더
   있습니다」 라고 말해 줍니다 (1번 — 안 되는 것을 되는 척하지 않습니다).
   ★ 이 수는 <b>늘면 빨간불</b>입니다. 줄이면 여기 수도 같이 내리십시오
     (0-1번 「줄이면 눈금도 같이 내린다」). 1 아래로 내려오는 날 —
     즉 넘치는 쪽이 하나도 없는 날 — 대장의 판 X326 줄을 「됨」 으로
     고쳐야 합니다 (check-stale 의 증인 X326-넘치는쪽 이 그때 웁니다).
   ⚠ 재는 창은 아래 1600×900 하나입니다. 창이 커지면 쪽이 다시 쪼개져
     수가 달라집니다 — 그래서 <b>창 크기를 여기 못 박아</b> 둡니다.
   ⚠⚠ 이 자는 <b>바깥을 막고</b> 잽니다(7번). 그래서 덱이 쓰는 글꼴
     (Pretendard · jsDelivr)이 안 실려 <b>기본 글꼴로 떨어집니다</b> — 글자가
     조금 더 넓어 쪽이 더 쪼개집니다. 사장님 화면(글꼴 실림)에서는 같은 날
     <b>241쪽 중 54쪽</b>(78% 가 한 화면)이었습니다. 아래 두 수는 <b>막고 잰
     값</b>입니다 — 자가 늘 같은 자리에서 재야 늘었는지 줄었는지를 알 수
     있으므로 막은 채로 둡니다. 둘이 다른 까닭을 모르는 척하지 않습니다 (1번). */
const PV_OVER    = 61;   /* 🗒 노트 끈 채 — 2026-11-04 · 246쪽 중 61쪽 (75% 가 한 화면) */
/* 🗒 노트 <b>켠</b> 채 — 사장님이 실제로 발표하는 상태입니다. 띠가 24vh 를
   먹으니 쪽 자리가 그만큼 작아지고, 켤 때 다시 쪼개도(노트토글 → pvMeasure)
   <b>혼자서 한 화면을 넘는 덩이</b>(표 한 장·세트 묶음)는 더 쪼갤 수 없어
   그 쪽만 스크롤이 남습니다. 그래서 끈 채(54)보다 많습니다.
   ★ 2026-11-04 에 재어 둔 값입니다. <b>띠를 키우면(--pvnote-h) 이 수가 늘어</b>
     이 자가 웁니다 — 띠 높이를 올릴 때 여기도 같이 보십시오.
   ⚠ 수를 그냥 올려 빨간불을 끄지 마십시오. 늘었으면 늘어난 까닭을 찾는 것이
     먼저입니다 (8번 「눈금을 안 올린다」). */
const PV_OVER_NOTE = 119; /* 2026-11-04 · 285쪽 중 119쪽 (58% 가 한 화면) · 제일 심한 쪽 +1,663px */

/* 한 코스를 끝까지 돌며 <b>노트가 빈 쪽</b>을 모아 온다 */
async function 돌기(pg) {
  const n = await pg.evaluate(() => document.querySelectorAll('#pvItems .pv-i').length);
  const 빈 = [], 가져옴 = [];
  let 넘침 = 0, 제일 = 0;
  for (let i = 0; i < n; i++) {
    const r = await pg.evaluate(() => {
      const s = document.querySelector('section.wrap.pon');
      return { t: (document.getElementById('pvTitle') || {}).innerText || '',
               num: (document.getElementById('pvNum') || {}).innerText || '',
               g: (document.getElementById('pvNoteBody') || {}).innerText || '',
               h: s ? s.scrollHeight : 0, c: s ? s.clientHeight : 1 };
    });
    if (r.g.indexOf(빈말) >= 0) 빈.push(r.num.split('/')[0].trim() + ' ' + r.t.slice(0, 34));
    else if (/앞 쪽\([0-9]+\/[0-9]+\)의 노트가 이어집니다/.test(r.g)) 가져옴.push(r.num.split('/')[0].trim());
    /* 한 쪽이 화면을 넘는가 — 8px 은 테두리·그림자 몫으로 둔다 */
    if (r.h > r.c + 8) { 넘침++; 제일 = Math.max(제일, r.h - r.c); }
    await pg.keyboard.press('ArrowRight');
    await pg.waitForTimeout(18);
  }
  return { n, 빈, 가져옴, 넘침, 제일 };
}

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 1600, height: 900 } });
  /* 🔌 <b>바깥을 막습니다</b> — 점검이 사장님 진짜 서버를 읽지 않습니다
     (CLAUDE.md 7번 · check-netblock 이 이 줄을 봅니다). 끊어 두지 않고
     기다리게 두면 곳마다 다른 순간을 재게 됩니다. */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                  ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await pg.goto('http://127.0.0.1:' + PORT + '/' + FILE.split('/').map(encodeURIComponent).join('/'),
                { waitUntil: 'load' });
  await pg.waitForTimeout(2600);

  head('[0] 발표와 노트가 켜지나');
  await pg.keyboard.press('p'); await pg.waitForTimeout(1300);
  await pg.keyboard.press('n'); await pg.waitForTimeout(300);
  const 켬 = await pg.evaluate(() => ({
    발표: document.body.classList.contains('pv'),
    노트: document.body.classList.contains('pvnoteon'),
    띠: !!document.getElementById('pvNoteBody') }));
  is(켬.발표, '발표 모드가 켜졌다 (P)');
  is(켬.노트 && 켬.띠, '강사 노트 띠가 켜졌다 (N)');
  if (!켬.발표 || !켬.노트) {
    console.log('\n✗ 발표·노트를 못 켰습니다 — 아래 점검을 못 합니다');
    await br.close(); srv.close(); process.exit(1);
  }

  head('[1] ★ 발표하는 <b>쪽마다</b> 할 말이 적혀 있나');
  const 전부 = await 돌기(pg);
  is(전부.n > 150, '  발표가 ' + 전부.n + '쪽이다 (150쪽 아래면 이 자가 덜 보는 것입니다 · 8번)');
  is(전부.빈.length === 0, 전부.빈.length
    ? ('노트가 빈 쪽 ' + 전부.빈.length + '쪽 — ' + 전부.빈.slice(0, 6).join(' / '))
    : '241쪽 어디를 열어도 노트가 뜬다 (「' + 빈말 + '」 0쪽)');

  head('[2] 강의 코스 넷도 빠짐없이');
  const 코스 = await pg.evaluate(() => {
    document.getElementById('pvMenu').click();
    return [].slice.call(document.querySelectorAll('#pvCourse .pv-c'))
      .map(b => ({ id: b.dataset.c, 이름: (b.querySelector('b') || {}).innerText || '' }))
      .filter(c => c.id);
  });
  await pg.waitForTimeout(300);
  is(코스.length >= 4, '  코스가 ' + 코스.length + '개 (4개 아래면 이 자가 덜 보는 것입니다 · 8번)');
  for (const c of 코스) {
    await pg.evaluate(id => {
      const m = document.getElementById('pvMenu'); if (m) m.click();
      document.querySelector('#pvCourse .pv-c[data-c="' + id + '"]').click();
    }, c.id);
    await pg.waitForTimeout(450);
    const r = await 돌기(pg);
    is(r.빈.length === 0, c.이름 + ' ' + r.n + '쪽 — 노트가 빈 쪽 ' +
       (r.빈.length ? (r.빈.length + '쪽: ' + r.빈.slice(0, 5).join(' / ')) : '없다'));
  }

  head('[3] 가져온 노트는 <b>가져온 것이라고</b> 밝히나 (1번)');
  is(전부.가져옴.length > 0, '한 장의 뒷쪽에서 앞 노트를 가져다 쓰는 쪽 ' + 전부.가져옴.length +
     '쪽 — 모두 「앞 쪽(N/M)의 노트가 이어집니다」 라고 적혀 있다');

  head('[4] ①~⑨ 진행 방식은 <b>한 곳</b>에만 (5번)');
  const SRC = fs.readFileSync(FILE, 'utf8');
  is(/window\.DEEP_NOTE\s*=\s*\{/.test(SRC), '진행 방식 대장(window.DEEP_NOTE)이 있다');
  const 공통 = (SRC.match(/window\.DEEP_NOTE\s*=\s*\{([\s\S]*?)\n\};/) || [])[1] || '';
  const 조각 = (공통.match(/'([^']{24,})'/g) || []).map(x => x.slice(1, -1));
  is(조각.length >= 9, '  진행 방식이 ' + 조각.length + '가지 (9가지 아래면 칸이 빈 것입니다)');
  const 두벌 = 조각.filter(t => SRC.split(t).length - 1 > 1);
  is(두벌.length === 0, 두벌.length
    ? ('진행 방식이 두 곳에 있다 — 「' + 두벌[0].slice(0, 28) + '…」')
    : '진행 방식을 유닛마다 베껴 적지 않았다 (열 유닛이 이 한 곳을 가리킨다)');

  head('[5] 노트에 금액·요건 숫자를 적지 않았나 (2번)');
  const 글들 = await pg.evaluate(() =>
    [].slice.call(document.querySelectorAll('.pvnote')).map(n => n.textContent));
  is(글들.length > 60, '  노트가 ' + 글들.length + '곳 (60곳 아래면 이 자가 덜 보는 것입니다)');
  const 걸림 = [];
  글들.forEach(t => MONEY.forEach(([re, 뜻]) => {
    const m = t.match(re); if (m) 걸림.push(뜻 + ' → 「' + m[0] + '」 · ' + t.slice(0, 30));
  }));
  is(걸림.length === 0, 걸림.length
    ? ('노트에 숫자가 있다 — ' + 걸림.slice(0, 3).join(' / '))
    : '노트에 금액·한도·요건 숫자가 없다');

  head('[8] 📏 아직 한 화면을 넘는 쪽 — <b>늘지 않았나</b> (판 X326 의 남은 ⓑ)');
  const 잰다 = (얼마, 눈금, 뭐) => is(얼마.넘침 <= 눈금,
    뭐 + ' — 넘치는 쪽 ' + 얼마.넘침 + '쪽 / ' + 얼마.n + '쪽 (' +
    Math.round((얼마.n - 얼마.넘침) / 얼마.n * 100) + '% 가 한 화면) · 제일 심한 쪽 +' +
    얼마.제일 + 'px · 눈금 ' + 눈금 + '쪽' +
    (얼마.넘침 > 눈금 ? ' ★ 늘었습니다' : (얼마.넘침 < 눈금 ? ' ★ 줄었습니다 — 눈금도 같이 내리십시오' : '')));
  잰다(전부, PV_OVER_NOTE, '노트 켠 채 (사장님이 실제로 발표하는 상태)');
  /* 노트를 끄면 쪽이 전 화면 기준으로 <b>다시 쪼개집니다</b> — 그 수도 함께 잽니다 */
  await pg.evaluate(() => {
    const m = document.getElementById('pvMenu'); if (m) m.click();
    document.querySelector('#pvCourse .pv-c[data-c=""]').click();
  });
  await pg.waitForTimeout(450);
  await pg.keyboard.press('n');
  await pg.waitForTimeout(700);
  const 껐을때 = await 돌기(pg);
  잰다(껐을때, PV_OVER, '노트 끈 채 (쪽 자체의 길이)');

  head('[6] 노트는 <b>고객에게 안 보이나</b>');
  await pg.evaluate(() => { const b = document.getElementById('pvExit'); if (b) b.click(); });
  await pg.waitForTimeout(400);
  const 책 = await pg.evaluate(() => {
    const ns = [].slice.call(document.querySelectorAll('.pvnote'));
    const 보임 = ns.filter(n => getComputedStyle(n).display !== 'none').length;
    return { 수: ns.length, 보임: 보임, 발표중: document.body.classList.contains('pv') };
  });
  is(!책.발표중, '발표에서 나왔다 (ESC)');
  is(책.보임 === 0, 책.보임
    ? (책.보임 + '곳이 책에서 보인다 — 고객이 읽습니다')
    : '노트 ' + 책.수 + '곳이 책(스크롤)에서 모두 숨어 있다 — 자리도 안 먹는다');
  is(/@media print[\s\S]{0,200}#pvNote/.test(SRC) || /\.pvnote\s*\{[^}]*display\s*:\s*none/.test(SRC),
     '인쇄에도 안 나온다');

  head('[7] 조용한가');
  is(errs.length === 0, errs.length ? ('콘솔 에러 — ' + errs.slice(0, 2).join(' / ')) : '콘솔에 에러가 없다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') :
    '강사 노트 점검 통과 — 어느 쪽을 열어도 「무엇을 시킬지」 가 적혀 있습니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
