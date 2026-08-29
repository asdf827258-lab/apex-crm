/* 전자책 — 처음 오신 분이 <b>혼자</b> 여는 책이다.

   그래서 다른 화면보다 지켜야 할 것이 넷 있다.

     1. <b>사실을 여기에 다시 적지 않는다.</b> 팀 약속·서른 장·조회 대본은
        plan.js · master.js 에 있다. 여기(easy.js)에는 <b>쉬운 풀이</b>만 둔다.
        두 벌이 되면 새로 온 사람이 낡은 쪽을 든 채 고객 앞에 앉는다.
     2. <b>「어려워요」가 실제로 더 쉬운 말을 내놓아야 한다.</b> 단추만 있고
        나올 말이 없으면 그건 알람이 아니라 장식이다.
     3. <b>죽은 링크를 만들지 않는다.</b> 「눌러서 바로 열기」가 없는 화면으로
        가면 신입은 자기가 잘못한 줄 안다.
     4. <b>그림은 손으로 그린다</b>(CLAUDE.md 9). 사진은 <b>우리 앱 화면</b>만
        쓴다 — 남의 자료 삽화를 복제하지 않는다.                             */

const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const EASY = path.join(ROOT, 'app/교육/easy.js');
const BOOK = path.join(ROOT, 'app/교육/book.html');
const APP  = path.join(ROOT, 'app/index.html');

let bad = 0;
const is = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) bad++; };

if (!fs.existsSync(EASY) || !fs.existsSync(BOOK)) {
  console.log('  ✗ app/교육/easy.js · app/교육/book.html 이 있어야 합니다');
  process.exit(1);
}
const E = require(EASY);
const P = require(path.join(ROOT, 'app/교육/plan.js'));
const M = require(path.join(ROOT, 'app/교육/master.js'));
const book = fs.readFileSync(BOOK, 'utf8');
const app = fs.readFileSync(APP, 'utf8');

function flat(v, o) { o = o || [];
  if (typeof v === 'string') o.push(v);
  else if (Array.isArray(v)) v.forEach(x => flat(x, o));
  else if (v && typeof v === 'object') Object.keys(v).forEach(k => flat(v[k], o));
  return o; }

console.log('\n[1] 사실을 다시 적지 않았는가');
is(!/var EDU_PLAN\s*=/.test(book) && !/var EDU_MASTER\s*=/.test(book),
   '  책이 자료를 다시 만들지 않는다 — 읽어서 그리기만 한다');
is(/src="plan\.js"/.test(book) && /src="master\.js"/.test(book) && /src="easy\.js"/.test(book),
   '  책이 세 자료를 다 읽는다');
/* easy.js 가 사실을 베껴 왔으면 두 벌이다.
   태그와 빈칸을 걷고 견준다 — 굵게만 풀거나 띄어쓰기만 고쳐도 베낀 것은 베낀 것이다. */
const norm = x => String(x || '').replace(/<[^>]*>/g, '').replace(/\s+/g, '');
const factTxt = flat({ p: P, m: M }).map(norm).filter(t => t.length > 22);
const copied = flat(E).filter(t => {
  const n = norm(t); if (n.length <= 22) return false;
  return factTxt.some(f => f.indexOf(n) >= 0 || n.indexOf(f) >= 0);
});
is(copied.length === 0, '  쉬운 말이 원문을 베끼지 않았다' +
   (copied.length ? ' — ' + copied[0].slice(0, 34) : ''));

console.log('\n[2] 「어려워요」가 진짜로 더 쉬운 말을 내놓는가');
const notes = E.notes || {};
is(Object.keys(notes).length >= 40, '  풀이가 마흔 개 이상이다 (' + Object.keys(notes).length + ')');
/* 서른 장 전부에 풀이가 있어야 한다 — 하나라도 비면 그 카드에서 막힌 사람은 갈 곳이 없다 */
const noNote = M.cards.filter(c => !notes['m' + c.n]);
is(noNote.length === 0, '  서른 장 <b>모두</b>에 쉬운 풀이가 있다' +
   (noNote.length ? ' — 빠짐: ' + noNote.map(c => c.n).join(',') : ''));
/* 풀이가 원문의 세 배를 넘으면 그건 쉬운 말이 아니라 더 긴 말이다.
   재는 것은 <b>글자</b>다 — 태그를 세면 굵게 쓴 만큼 길어 보인다. */
const bare = s2 => String(s2 || '').replace(/<[^>]*>/g, '');
const longer = M.cards.filter(c => {
  const n = bare(notes['m' + c.n]); if (!n) return false;
  return n.length > Math.max(bare(c.what).length * 3, 100);
});
is(longer.length === 0, '  풀이가 원문보다 장황하지 않다' +
   (longer.length ? ' — ' + longer.map(c => c.n).join(',') : ''));
/* 말투를 바꿔야 「아, 쉬운 말이구나」가 온다 */
const haeyo = Object.keys(notes).filter(k => /요\.|요<|에요|예요|어요/.test(notes[k])).length;
is(haeyo >= Object.keys(notes).length * 0.8,
   '  풀이는 「해요」 말투다 — 본문과 결이 달라야 눈에 띈다 (' + haeyo + '/' + Object.keys(notes).length + ')');
is(/data-hard=/.test(book) && /class="easy"/.test(book), '  「어려워요」 단추와 펼침 자리가 있다');
is(/hard\[/.test(book), '  어렵다고 누른 것이 남는다');
is(/V\.mine\s*=/.test(book), '  어려워한 곳이 <b>한 곳에 모인다</b> — 매니저에게 보여 줄 수 있다');

console.log('\n[3] 어려운 말 사전');
const T = E.terms || {};
is(Object.keys(T).length >= 40, '  낱말이 마흔 개 이상이다 (' + Object.keys(T).length + ')');
const thinT = Object.keys(T).filter(w => bare(T[w]).length < 25);
is(thinT.length === 0, '  낱말 풀이가 한 줄로 끝나지 않는다 — 모르는 사람에게는 한 줄이 부족하다' +
   (thinT.length ? ' — ' + thinT.join(', ') : ''));
/* 이 일에서 신입이 제일 먼저 막히는 말들 */
['팩트파인딩', '담보', '실손', '면책', '갱신형', '소득공백', '환급률', '심사', '알릴의무', 'VIP', '게이트', '검수']
  .forEach(w => is(!!T[w], '  「' + w + '」 풀이가 있다'));
is(/data-tm=/.test(book), '  본문에서 낱말을 눌러 볼 수 있다');
is(/class="sheet"/.test(book), '  뜻풀이가 아래에서 올라온다');

console.log('\n[4] 눌러서 바로 열리는가');
const tabIds = new Set([...app.matchAll(/\{id:'([a-z_0-9]+)',icon:/g)].map(m => m[1]));
is(/index\.html\?go=/.test(book), '  화면으로 가는 링크가 있다');
is(/target="_top"/.test(book), '  앱 안 액자에서도 화면이 바뀐다');
/* 이름표에 없는 화면은 링크를 안 만든다 — 죽은 링크가 생기지 않게 */
is(/if\(!nm\) continue;/.test(book), '  이름표에 없는 화면은 링크를 만들지 않는다');
const deadName = Object.keys(P.screens).filter(id => !tabIds.has(id));
is(deadName.length === 0, '  이름표의 화면이 전부 앱에 있다' +
   (deadName.length ? ' — ' + deadName.join(',') : ''));

console.log('\n[5] 그림과 사진');
is(/var FIG\s*=/.test(book), '  그림을 <b>손으로 그린다</b> (CLAUDE.md 9)');
const figNames = [...book.matchAll(/^\s(\w+):function\(\)\{/gm)].map(m => m[1]);
is(Object.values(E.figs || {}).every(f => book.indexOf(f + ':function()') >= 0),
   '  표가 부르는 그림이 전부 그려져 있다');
is((Object.keys(E.figs || {}).length) >= 6, '  그림이 여섯 개 이상이다');
is(!/<img[^>]+src="https?:/.test(book), '  바깥에서 이미지를 끌어오지 않는다');
Object.keys(E.pics || {}).forEach(k => {
  const src = E.pics[k][0];
  is(fs.existsSync(path.join(ROOT, 'app/교육', src)), '  사진 ' + src + ' 이 실제로 있다');
  is(!!E.pics[k][1], '  사진 ' + src + ' 에 설명이 붙어 있다');
});
/* 사진이 무거우면 폰에서 안 열린다 */
let heavy = [];
Object.keys(E.pics || {}).forEach(k => {
  const f = path.join(ROOT, 'app/교육', E.pics[k][0]);
  if (fs.existsSync(f) && fs.statSync(f).size > 300 * 1024) heavy.push(E.pics[k][0]);
});
is(heavy.length === 0, '  사진이 무겁지 않다' + (heavy.length ? ' — ' + heavy.join(',') : ''));

console.log('\n[6] 차근차근 쌓이는가');
is(/class="stack"/.test(book), '  쌓이는 것이 눈에 보인다');
is(/이어보기|첫 장부터/.test(book), '  읽던 자리로 <b>이어보기</b>가 있다');
is(/data-read=/.test(book), '  읽은 장이 표시된다');
is(/tocHtml/.test(book), '  목차가 있다');

console.log('\n[7] 앱 메뉴에 서 있는가');
is(/\{id:'edu_book'/.test(app), '  메뉴에 전자책이 있다');
is(/EDUBOOK_URL='교육\/book\.html'/.test(app), '  앱이 책을 가리킨다');
is(/tab==='edu_book'/.test(app), '  go() 가 책을 연다');
is(/'edubook-mode'/.test(app) && /OS_FULL_MODES=[\s\S]{0,240}edubook-mode/.test(app),
   '  전체화면 목록에 들어 있다');
is(/edubook-mode'\)\)exitEduBook\(\)/.test(app), '  Esc 로 빠져나온다');

console.log('\n[8] 인쇄');
const css = book.replace(/\/\*[\s\S]*?\*\//g, '');
is(!/font-feature-settings/.test(css),
   '  tnum 을 켜지 않았다 — 켜고 PDF 로 저장하면 숫자가 유니코드를 잃는다');
is(/@media print/.test(css), '  인쇄 규칙이 있다');
is(/window\.print/.test(book), '  인쇄 단추가 있다');

/* ── 여기까지는 글자만 봤다. 아래는 실제로 열어 본다. ── */
const { chromium } = require('playwright');
const http = require('http');
const PORT = 8901;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript',
  '.jpg':'image/jpeg', '.png':'image/png', '.css':'text/css' };
const srv = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html';
  const f = path.join(ROOT, u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
}).listen(PORT);
const U = 'http://127.0.0.1:' + PORT + '/app/' + encodeURIComponent('교육') + '/book.html';

(async () => {
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  pg.on('pageerror', e => errs.push('' + e));
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::|ERR_/.test(m.text())) errs.push(m.text()); });

  console.log('\n[9] 폰에서 실제로 열리는가');
  await pg.goto(U, { waitUntil: 'networkidle' });
  const chs = await pg.$$eval('.tci', n => n.map(x => x.getAttribute('data-go')));
  is(chs.length >= 10, '  장이 ' + chs.length + '개 선다');
  let over = [], thin = [], nofig = 0, nopic = 0;
  for (const k of chs) {
    await pg.goto(U + '#' + k, { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(180);
    const w = await pg.evaluate(() => document.documentElement.scrollWidth);
    const t = await pg.$eval('#pane', n => n.innerText);
    if (w > 392) over.push(k + '(' + w + ')');
    if (k !== 'mine' && t.length < 300) thin.push(k + '(' + t.length + ')');
    nofig += (await pg.$$('figure svg')).length;
    nopic += (await pg.$$('figure img')).length;
  }
  is(over.length === 0, '  가로로 안 밀린다' + (over.length ? ' — ' + over.join(', ') : ''));
  is(thin.length === 0, '  빈 장이 없다' + (thin.length ? ' — ' + thin.join(', ') : ''));
  is(nofig >= 6, '  그림이 실제로 그려진다 (' + nofig + ')');
  is(nopic >= 3, '  사진이 실제로 뜬다 (' + nopic + ')');

  console.log('\n[10] 어려운 말을 눌러 보면');
  await pg.goto(U + '#mast', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(250);
  is((await pg.$$('.tm')).length > 5, '  본문에 점선 그어진 낱말이 있다');
  await pg.click('.tm');
  await pg.waitForTimeout(320);
  const w1 = await pg.$eval('#shw', n => n.textContent);
  const m1 = await pg.$eval('#shm', n => n.textContent);
  is(!!w1 && m1.length > 15, '  누르면 뜻이 올라온다 — 「' + w1 + '」');
  is(!!T[w1], '  올라온 뜻이 <b>사전에서</b> 왔다');
  await pg.click('#shc');
  await pg.waitForTimeout(300);
  is(!(await pg.$eval('#sheet', n => n.classList.contains('on'))), '  닫힌다');

  console.log('\n[11] 「어려워요」를 눌러 보면');
  const before = (await pg.$$('.easy')).length;
  await pg.click('.hardb');
  await pg.waitForTimeout(300);
  is((await pg.$$('.easy')).length === before + 1, '  그 자리에서 쉬운 말이 펴진다');
  const easyTxt = await pg.$eval('.easy', n => n.innerText);
  is(easyTxt.length > 20, '  펴진 말이 비어 있지 않다');
  await pg.goto(U + '#mine', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(250);
  is((await pg.$$('.li')).length >= 1, '  어려워한 곳이 <b>모인다</b>');
  await pg.click('[data-clr]');
  await pg.waitForTimeout(250);
  is((await pg.$$('.li')).length === 0, '  지울 수 있다');

  console.log('\n[12] 눌러서 바로 열리는가 · 읽은 표시');
  await pg.goto(U + '#mast', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(250);
  const hrefs = await pg.$$eval('a.op', n => n.map(x => x.getAttribute('href')));
  is(hrefs.length > 0, '  「바로 열기」 단추가 있다 (' + hrefs.length + ')');
  is(hrefs.every(h => /^\.\.\/index\.html\?go=/.test(h)), '  단추가 전부 앱 화면을 가리킨다');
  const goIds = hrefs.map(h => decodeURIComponent(h.split('go=')[1]));
  const dead = goIds.filter(id => !tabIds.has(id));
  is(dead.length === 0, '  죽은 링크가 없다' + (dead.length ? ' — ' + dead.join(',') : ''));
  await pg.goto(U + '#team', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(220);
  await pg.click('[data-read]');
  await pg.waitForTimeout(250);
  is(/읽었어요/.test(await pg.$eval('[data-read]', n => n.textContent)), '  읽음이 찍힌다');
  await pg.goto(U + '#cover', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(250);
  is((await pg.$$('.tci.done')).length === 1, '  목차에 읽은 표시가 남는다');
  is(/이어보기/.test(await pg.$eval('#pane', n => n.innerText)), '  <b>이어보기</b>가 뜬다');
  is((await pg.$$('.stack i')).length === M.cards.length, '  쌓기 칸이 서른 개다');
  await pg.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  is(errs.length === 0, '  중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await br.close(); srv.close();
  console.log(bad ? '\n✗ ' + bad + '건\n' : '\n전자책 점검 통과\n');
  process.exit(bad ? 1 : 0);
})();
