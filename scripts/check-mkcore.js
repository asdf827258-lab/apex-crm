/* ⭐ <b>핵심 강의 — 한 쪽에 한 가지인가.</b>

   사장님 말씀 (2026-11-04) 「이 내용을 핵심강의로 줄여줄수 없나 <b>너무
   복잡하면 어려운데</b>」.

   판 X320 에서 강의 코스를 뒀지만, 코스는 <b>원본 장</b>을 고르는 길이라
   장 하나가 열두 쪽씩 됩니다. 처음 듣는 분에게는 그것도 복잡합니다.
   그래서 <b>요약 한 장</b>을 따로 두었습니다 — 열세 쪽, 한 쪽에 한 가지.

   여기서 못 박는 것은 이렇습니다.

     1. ⭐ 핵심 장이 있고, <b>코스 고르개 맨 앞</b>에 선다. 처음이면 이것을
        고르게 해야 하므로 자리가 중요합니다.
     2. ★★ <b>한 쪽에 한 가지</b> — 소제목(h3) 수와 쪽 수가 같다. 그리고
        ★ <b>넘치는 쪽이 0</b> 이다. 쪽이 화면을 넘으면 그건 「한 가지」 가
        아니라는 뜻입니다. <b>노트를 켠 채로도</b> 그렇습니다 — 사장님은
        노트를 켜고 발표하십니다.
     3. 쪽마다 <b>할 한 마디</b>와 <b>시킬 것</b>이 있다. 생각만 적어 두면
        강사가 또 말을 지어내게 됩니다.
     4. ★★ <b>여기에 새 화법을 적지 않는다</b>(5번) — 이 장은 요약이고,
        대본·담보의 원본은 11·12·13·22장과 PART 2·6 입니다. 그래서 쪽마다
        <b>「더 자세히 → 어느 장」</b> 이 있고, 그 장이 <b>정말 있는지</b>
        봅니다. 없는 장을 가리키면 그 말이 거짓입니다 (1번).
     5. 금액·한도·요건 숫자를 적지 않는다 (2번).
     6. 쪽마다 <b>강사 노트</b>가 있다 (판 X325 와 같은 약속).

   ★ 되돌려 보았습니다 (8번) — 네 가지를 일부러 깨뜨려 보고 전부 울었습니다:
     ① 한 쪽에 두 가지를 몰아넣기 ② 「시키세요」 빼기 ③ 없는 장을 가리키기
     ④ 코스 고르개에서 ⭐ 를 뒤로 보내기.                                  */
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

/* 적으면 안 되는 것 — <b>금액·한도·요건 숫자.</b> 「30초」 「2분」 같은 진행
   시간과 「열세 장」 같은 분량은 요건이 아니라 잡지 않는다 (8번 · 헛것 금지). */
const MONEY = [
  [/[0-9][0-9,]*\s*만\s*원/, '「N만원」 — 금액'],
  [/[0-9][0-9,]*\s*억/, '「N억」 — 금액'],
  [/[0-9][0-9,]*\s*원(?!포인트)/, '「N원」 — 금액'],
  [/[0-9]+\s*(?:%|퍼센트)/, '「N%」 — 비율'],
  [/[0-9]+\s*개월/, '「N개월」 — 요건 기간'],
  [/[0-9]+\s*세\s*(?:이상|이하|미만|까지)/, '「N세 이상」 — 요건 나이'],
];

/* ⭐ 핵심 코스를 끝까지 돌며 쪽마다 잰다 */
async function 돌기(pg) {
  const n = await pg.evaluate(() => window.__present.total);
  const 쪽 = [];
  for (let i = 0; i < n; i++) {
    쪽.push(await pg.evaluate(() => {
      const s = document.querySelector('section.wrap.pon');
      const 보임 = [].slice.call(s.children).filter(e => getComputedStyle(e).display !== 'none');
      return {
        t: (document.getElementById('pvTitle') || {}).innerText || '',
        h: s ? s.scrollHeight : 0, c: s ? s.clientHeight : 1,
        소제목: 보임.filter(e => e.tagName === 'H3').length,
        말: 보임.filter(e => /(^| )key( |$)/.test(e.className || '')).length,
        시킬: 보임.filter(e => /note/.test(e.className || '') && /시키세요/.test(e.textContent || '')).length,
        어디: 보임.filter(e => /mut/.test(e.className || '') && /더 자세히/.test(e.textContent || '')).length,
        노트: (document.getElementById('pvNoteBody') || {}).innerText || '',
      };
    }));
    await pg.keyboard.press('ArrowRight');
    await pg.waitForTimeout(30);
  }
  return 쪽;
}

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 1440, height: 900 } });
  /* 🔌 바깥을 막습니다 — 점검이 사장님 진짜 서버를 읽지 않습니다 (7번) */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                  ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await pg.goto('http://127.0.0.1:' + PORT + '/' + FILE.split('/').map(encodeURIComponent).join('/'),
                { waitUntil: 'load' });
  await pg.waitForTimeout(2600);

  head('[1] ⭐ 핵심 장이 있고 <b>코스 고르개 맨 앞</b>에 선다');
  const SRC = fs.readFileSync(FILE, 'utf8');
  is(/<section id="core"/.test(SRC), '⭐ 핵심 장(id=core)이 있다');
  const 소제목수 = (SRC.slice(SRC.indexOf('<section id="core"'),
    SRC.indexOf('<section id=', SRC.indexOf('<section id="core"') + 10)).match(/<h3 class="subh"/g) || []).length;
  is(소제목수 >= 10, '  소제목이 ' + 소제목수 + '개 (10개 아래면 요약이 아니라 토막입니다)');
  await pg.keyboard.press('p'); await pg.waitForTimeout(1500);
  const 코스 = await pg.evaluate(() => [].slice.call(document.querySelectorAll('#pvCourse .pv-c'))
    .map(b => ({ id: b.dataset.c, 이름: (b.querySelector('b') || {}).innerText || '',
                 쪽: (b.querySelector('u') || {}).innerText || '' })));
  is(코스.length >= 5, '  코스가 ' + 코스.length + '개 (5개 아래면 이 자가 덜 보는 것입니다 · 8번)');
  is(코스[0] && 코스[0].id === 'core',
     '⭐ 핵심 강의가 <b>맨 앞</b>이다 — 지금 맨 앞은 「' +
     ((코스[0] || {}).이름 || '(없음)') + '」 (처음 듣는 분이 이것을 고르게 해야 합니다)');
  /* 옛 길도 남아 있어야 합니다 — 길을 지우지 않습니다 (6번) */
  is(코스.filter(c => c.id === 'short').length === 1 && 코스.filter(c => c.id === '').length === 1,
     '옛 길(⚡ 원본 장으로 · 📚 전부)도 그대로 있다 — 길을 지우지 않습니다 (6번)');

  head('[2] ★★ <b>한 쪽에 한 가지</b> — 노트를 켠 채로도 안 넘친다');
  for (const 노트 of [false, true]) {
    await pg.evaluate(() => {
      const m = document.getElementById('pvMenu'); if (m) m.click();
      document.querySelector('#pvCourse .pv-c[data-c="core"]').click();
    });
    await pg.waitForTimeout(500);
    const 켜짐 = await pg.evaluate(() => document.body.classList.contains('pvnoteon'));
    if (켜짐 !== 노트) { await pg.keyboard.press('n'); await pg.waitForTimeout(800); }
    const 쪽 = await 돌기(pg);
    const 넘 = 쪽.filter(q => q.h > q.c + 8);
    const 둘 = 쪽.filter(q => q.소제목 > 1);
    is(쪽.length === 소제목수,
       '  노트 ' + (노트 ? '켠' : '끈') + ' 채 — 쪽 ' + 쪽.length + '개 · 소제목 ' + 소제목수 +
       '개 (같아야 「한 쪽에 한 가지」 입니다)');
    is(둘.length === 0, '  노트 ' + (노트 ? '켠' : '끈') + ' 채 — 한 쪽에 소제목이 둘 이상인 쪽 ' +
       둘.length + '쪽' + (둘.length ? (' — ' + 둘.slice(0, 3).map(q => q.t.slice(0, 26)).join(' / ')) : ''));
    is(넘.length === 0, '  노트 ' + (노트 ? '켠' : '끈') + ' 채 — <b>넘치는 쪽 ' + 넘.length + '쪽</b>' +
       (넘.length ? (' — ' + 넘.slice(0, 3).map(q => q.t.slice(0, 24) + ' +' + (q.h - q.c) + 'px').join(' / '))
                  : ' (열세 쪽이 다 한 화면에 듭니다)'));
    if (!노트) {
      head('[3] 쪽마다 <b>할 한 마디</b>와 <b>시킬 것</b>이 있다');
      const 말없 = 쪽.filter(q => q.말 === 0 && q.소제목 === 1);
      const 시킬없 = 쪽.filter(q => q.시킬 === 0);
      is(말없.length === 0, '할 말(.key)이 없는 쪽 ' + 말없.length + '쪽' +
         (말없.length ? (' — ' + 말없.slice(0, 3).map(q => q.t.slice(0, 26)).join(' / ')) : ''));
      is(시킬없.length === 0, '「✋ 시키세요」 가 없는 쪽 ' + 시킬없.length + '쪽' +
         (시킬없.length ? (' — ' + 시킬없.slice(0, 3).map(q => q.t.slice(0, 26)).join(' / ')) : ''));

      head('[5] 쪽마다 <b>강사 노트</b>가 있다 (판 X325 와 같은 약속)');
      const 노트없 = 쪽.filter(q => /아직 강사 노트를 안 썼습니다/.test(q.노트));
      is(노트없.length === 0, '노트가 빈 쪽 ' + 노트없.length + '쪽');
    }
  }

  head('[4] ★★ <b>가리키는 장이 정말 있나</b> — 요약이 거짓말하지 않게 (1번 · 5번)');
  const 안 = SRC.slice(SRC.indexOf('<section id="core"'),
    SRC.indexOf('<section id=', SRC.indexOf('<section id="core"') + 10));
  const 가리킴 = [...new Set((안.match(/href="#([a-z0-9]+)"/g) || []).map(x => x.slice(7, -1)))];
  is(가리킴.length >= 10, '  가리키는 장이 ' + 가리킴.length + '개 (10개 아래면 원본을 안 가리키는 것입니다)');
  const 없는장 = 가리킴.filter(id => SRC.indexOf('<section id="' + id + '"') < 0 &&
                                     SRC.indexOf("id:'" + id + "'") < 0);
  is(없는장.length === 0, 없는장.length
    ? ('없는 장을 가리킨다 — ' + 없는장.join(' · ') + ' (「더 자세히」 가 거짓이 됩니다)')
    : '가리키는 장 ' + 가리킴.length + '개가 모두 저장소에 있다');

  head('[6] 금액·한도·요건 숫자를 적지 않았나 (2번)');
  const 글 = 안.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ');
  const 걸림 = [];
  MONEY.forEach(([re, 뜻]) => { const m = 글.match(re); if (m) 걸림.push(뜻 + ' → 「' + m[0] + '」'); });
  is(걸림.length === 0, 걸림.length ? ('숫자가 있다 — ' + 걸림.join(' / '))
                                    : '핵심 장에 금액·한도·요건 숫자가 없다');

  head('[7] 조용한가');
  is(errs.length === 0, errs.length ? ('콘솔 에러 — ' + errs.slice(0, 2).join(' / ')) : '콘솔에 에러가 없다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
                  : '핵심 강의 점검 통과 — 한 쪽에 한 가지, 열세 쪽이 다 한 화면에 듭니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
