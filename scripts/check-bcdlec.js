/* 🎤 <b>B·C·D 영업 강의 — 선택이 증명이 되는 시간</b> (판 X178 · 2026-10-23 · 처음 X175 로 적었으나 #644 가 먼저 X175 로 병합해 밀었습니다)

   사장님 말씀 — 「인생은 b와 d 그리고 가운데 c 에 의미 · 리더로써의 실패 · 선택의 과정중에서는
   실패지만 결과를 냈다면 증명 · … 고객님의 수많은 선택에서 날 선택할수 있는 자료 · 타임라인 내가
   힘들었던 과정들은 내가 입력할수 있도록 · 마음을 울리는 영업 강의자료 · 4시간 가량」

   못 박는 것 —
     ① 메뉴에 서고 go('bcd_lec') 이 그 한 파일(bcd-lecture.html)을 띄운다 · 전체 화면이 허락된다
     ② ★ 강사 이야기 · 타임라인이 비어서 온다 — 저장소에 강사님 이야기를 지어 넣지 않는다 (1번)
     ③ ★ 비어 있는 이야기 장은 발표에서 빠지고, 몇 칸이 비었는지 말한다. 적으면 그 글이 그대로 선다
     ④ ★ 인생 곡선 · 증명의 계단 · 장면 장이 타임라인 한 벌(S.tl)에서 선다 — 따로 안 센다 (5번)
     ⑤ 4시간 — 분은 SECTIONS 한 곳 · 합이 240분 · 진행표가 그것을 읽는다 (5번)
     ⑥ 서버를 안 부른다 (7번) · 바깥 스크립트를 안 들여온다 · tnum 을 안 켠다 (4-1번)
     ⑦ ★ 장 어디에도 금액 · 비율 숫자가 없다 · 비과세를 말하는 장은 「요건」 을 함께 말한다 ·
        「심사 결과에 따릅니다」 가 있다 (1번 · 2번)
     ⑧ 워크북은 빈 칸 — 강사님 이야기가 안 들어간다. 강사 대본에는 들어간다
     ⑨ 이 브라우저에만 남는다 — 다시 열어도 남고, 「모두 지우기」 로 지워진다
   판 X176 (2026-10-23 「애니메이션을 넣고 죽음 해골에 대한 이미지 … 뉴스에서 가져오고 이미지도 네이버에서도」) —
     ⑩ ★ 뉴스는 실제 기사만 — 카드마다 언론사 · 제목 · https 원문 주소. 날짜를 모르면 「날짜 확인 못 함」 (9번 · 1번)
        기사 사진을 저장소에 안 넣는다 — 해골 · 모래시계 · 촛불은 직접 그린 SVG
     ⑪ 네이버는 주소만 연다(새 창) — 서버로 받지 않는다 (7번)
     ⑫ 사진 — 넣지 않으면 그 장이 없다 · 넣으면 출처가 장에 서고, 안 적으면 「출처를 안 적었습니다」 ·
        사진은 워크북 · 강사 대본 인쇄에 안 들어간다
     ⑬ 움직임이 실제로 돈다 — 움직임 줄이기를 켠 기기에서는 멈춘다
   판 X177 (2026-10-23 「응 강의라서 적어보게 해」) —
     ⑭ ★ 참가자가 제 폰에 적는 워크북(bcd-workbook.html) — 물음은 bcd-data.js 한 벌. 종이 워크북과 같은 쪽 수 ·
        같은 물음 (5번). 덱 · 워크북 어디에도 물음 목록을 따로 적지 않는다
     ⑮ 적은 것은 그 폰에만 · 다시 열어도 남고 · 다 지우기로 지워진다 · 서버를 안 부른다 (7번)
     ⑯ 마음 점수를 고른 장면만 곡선 점이 된다 — 비운 장면을 0 으로 그리지 않는다 (1번)
     ⑰ 덱의 활동 장마다 「📱 n쪽」 이 그 쪽 제목과 함께 선다 · 덱이 폰 워크북 주소를 띄우고 복사한다
   판 X179 (2026-10-24 「우선 펼쳐서 보일수 있도록」 → 「강의 장 한눈에」) —
     ⑱ ▦ 한눈에 — 발표에 서는 장이 빠짐없이 같은 차례로 작은 화면으로 선다 · 부마다 분 · 시각
     ⑲ ★ 빠지는 장은 점선 칸으로 그 자리에 서서 무엇을 적으면 서는지 말한다 — 발표 목록과 같은 한 곳(deckAll)에서 센다 (1번 · 5번)
     ⑳ 누르면 그 장으로 · 작은 화면은 움직이지 않고 id 를 겹쳐 만들지 않는다  */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9174;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const PAGE = fs.readFileSync(path.join(ROOT, 'app/bcd-lecture.html'), 'utf8');
const WBP = fs.readFileSync(path.join(ROOT, 'app/bcd-workbook.html'), 'utf8');
const DATA = fs.readFileSync(path.join(ROOT, 'app/bcd-data.js'), 'utf8');
const strip = t => t.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
/* 주석을 떼고 본다 — 쪽지 글을 코드로 읽지 않게 */
const CODE = PAGE.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

console.log('\n[1] 메뉴 · 띄우기');
is(/\{id:'bcd_lec',[^}]*title:'B·C·D 영업 강의'/.test(IDX), 'TABS 에 bcd_lec 가 선다');
is(/\bbcd_lec:'meet'/.test(IDX), 'NAV_WHEN 에 bcd_lec 가 있다(고객 만나기)');
is(/var T_SKIN=\{[^}]*\bbcd_lec:1/.test(IDX), 'T_SKIN 에 있다 — 거절 근육 훈련과 같은 옷');
is(/else if\(tab==='bcd_lec'\)dyn\.innerHTML=renderBcdLecPage\(\);/.test(IDX), 'go() 가 renderBcdLecPage 로 그린다');
is(/function renderBcdLecPage\(\)[\s\S]{0,1200}src="bcd-lecture\.html"[^>]*allow="fullscreen"/.test(IDX), '그 화면이 bcd-lecture.html 을 띄우고 전체 화면을 허락한다(빔 프로젝터)');

console.log('\n[2] 강사 이야기가 비어서 오나 (1번)');
is(/const BLANK = \(\) => \(\{ me: \{ name: '', role: '' \}, story: \{\}, tl: \[\], photos: \[\] \}\);/.test(CODE), '처음 값(BLANK)이 이름 · 이야기 · 타임라인 · 사진 모두 빈 칸이다');
is(!/data:image\/(png|jpe?g|webp|gif);base64/i.test(PAGE) && !/<img[^>]+src="(?!' \+)/i.test(PAGE), '저장소에 사진(기사 사진 · 네이버 이미지)을 안 넣었다 — 그림은 직접 그린 SVG (9번)');
is(!/story\s*:\s*\{\s*[a-zA-Z]+\s*:\s*'[^']/.test(CODE) && !/tl\s*:\s*\[\s*\{/.test(CODE), '이야기 · 장면을 미리 적어 둔 줄이 없다');

console.log('\n[3] 서버 · 바깥 스크립트 · tnum (7번 · 4-1번)');
is([CODE, strip(WBP), strip(DATA)].every(t => !/\bfetch\s*\(|XMLHttpRequest|supabase|\/\.netlify\//i.test(t)), '덱 · 폰 워크북 · 글 한 벌 모두 서버를 부르는 줄이 없다');
const srcs = t => (t.match(/<script[^>]+src="([^"]+)"/gi) || []).map(x => /src="([^"]+)"/i.exec(x)[1]);
is(srcs(PAGE).join() === 'bcd-data.js' && srcs(WBP).join() === 'bcd-data.js', '바깥 스크립트를 안 들여온다 — 둘 다 옆 파일 bcd-data.js 하나만 읽는다');
is(![PAGE, WBP].some(t => /tnum/.test(t)), '숫자 글꼴 tnum 을 안 켠다');
is(!/const (LIFE|FF|OBS|WB) = \[/.test(CODE) && !/const (LIFE|FF|OBS|WB) = \[/.test(strip(WBP)) && !/'내가 말한 시간보다 고객이/.test(CODE + strip(WBP)),
  '★ 생애 지도 · 팩트파인딩 · 관찰 체크 · 워크북 물음을 덱 · 폰 워크북에 따로 적지 않았다 — bcd-data.js 한 벌 (5번)');

const srv = http.createServer((q, s) => {
  const p = decodeURIComponent(q.url.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end(''); return; }
  s.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(s);
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  try {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
      ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    p.on('dialog', d => d.accept());
    const URL = 'http://127.0.0.1:' + PORT + '/app/bcd-lecture.html';
    await p.goto(URL, { waitUntil: 'load' });
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.reload({ waitUntil: 'load' });

    console.log('\n[4] 빈 채로 서나 — 이야기 장은 빠지고 몇 칸이 비었는지 말한다');
    const e0 = await p.evaluate(() => ({ n: D.length, st: D.filter(s => s.ty === 'story').length, ph: D.filter(s => s.ty === 'photo').length,
      tl: D.filter(s => /^(event|curve|stairs)$/.test(s.ty)).length, w: $('emptyWarn').innerText, k: STORY.length }));
    is(e0.st === 0 && e0.tl === 0 && e0.ph === 0, '비어 있으면 이야기 장 · 타임라인 장 · 사진 장이 하나도 안 선다 (지어 넣지 않음)');
    is(new RegExp('내 이야기 ' + e0.k + '칸').test(e0.w) && /0장면/.test(e0.w) && /건너뜁니다/.test(e0.w), '「아직 안 적은 내 이야기 ' + e0.k + '칸 · 타임라인 0장면 — 건너뜁니다」 라고 말한다');
    is(e0.n >= 40, '이야기 없이도 강의 뼈대가 선다 — ' + e0.n + '장');
    /* 끝까지 넘겨 본다 — 어느 장에서도 오류가 없어야 한다 */
    for (let i = 0; i < e0.n; i++) await p.keyboard.press('ArrowRight');
    is(await p.evaluate(() => cur === D.length - 1), '→ 키로 마지막 장까지 넘어간다');
    is(errs.length === 0, '빈 채로 모든 장을 넘겨도 오류가 없다' + (errs.length ? ' ← ' + errs[0] : ''));

    console.log('\n[5] 4시간 — SECTIONS 한 곳 (5번)');
    const pl = await p.evaluate(() => { page('plan'); return { tot: TOTAL_MIN, sum: SECTIONS.reduce((a, s) => a + s.min, 0), foot: document.querySelector('#planTbl tfoot').innerText,
      orphan: SLIDES.filter(s => !SEC[s.sec]).length, brk: SECTIONS.filter(s => s.brk).length }; });
    is(pl.tot === 240 && pl.sum === 240, '모든 부와 쉬는 시간의 합이 240분(4시간)이다 — ' + pl.tot + '분');
    is(/17:00/.test(pl.foot) && /240분/.test(pl.foot), '13:00 에 시작하면 진행표가 17:00 · 240분에 끝난다');
    is(pl.orphan === 0, '모든 장이 SECTIONS 의 한 부에 들어 있다');
    is(pl.brk >= 3, '쉬는 시간이 ' + pl.brk + '번 — 4시간 강의에 숨 쉴 틈');

    console.log('\n[6] 적으면 그대로 선다 — 이야기 · 타임라인 (S.tl 한 벌)');
    await p.evaluate(() => page('mine'));
    await p.fill('#st_leaderFail', '홍길동 점검 이야기 — 팀이 무너진 날');
    await p.fill('#meName', '홍길동');
    for (const t of ['처음 거절당한 날', '팀원이 떠난 날', '다시 일어선 날']) await p.click('#seedChips button[data-seed="' + t + '"]');
    const fill = async (i, f, v) => {
      const sel = '#tlList .ev[data-i="' + i + '"] [data-f="' + f + '"]';
      if (f === 'score' || f === 'res') await p.selectOption(sel, v); else await p.fill(sel, v);
    };
    await fill(0, 'score', '-3'); await fill(0, 'res', 'fail'); await fill(0, 'choice', '다음 날 또 나갔다');
    await fill(1, 'score', '-5'); await fill(1, 'res', 'proof');
    await fill(2, 'score', '4'); await fill(2, 'res', 'proof'); await fill(2, 'y', '2024');
    await p.evaluate(() => page('deck'));
    const e1 = await p.evaluate(() => ({ st: D.filter(s => s.ty === 'story').map(s => s.k), ev: D.filter(s => s.ty === 'event').length,
      cv: D.filter(s => s.ty === 'curve').length, sr: D.filter(s => s.ty === 'stairs').length, w: $('emptyWarn').innerText }));
    is(e1.st.length === 1 && e1.st[0] === 'leaderFail', '적은 이야기 칸 하나만 장으로 선다');
    is(e1.ev === 3, '장면 셋 → 장면 장 셋');
    is(e1.cv === 2 && e1.sr === 1, '인생 곡선(1부 · 5부) 둘 · 증명의 계단 하나가 선다');
    is(/7칸/.test(e1.w) && !/0장면/.test(e1.w), '경고가 남은 칸 수(7칸)로 줄어든다');
    const go = ty => p.evaluate(t => { const i = D.findIndex(s => s.ty === t); show(i); return $('stage').innerText; }, ty);
    is(/홍길동 점검 이야기/.test(await go('story')), '이야기 장에 적은 글이 그대로 선다');
    is(/다음 날 또 나갔다/.test(await go('event')) && /과정에서는 실패/.test(await p.textContent('#stage')), '장면 장에 「그때 내가 한 선택」 과 결과가 선다');
    await go('curve');
    is(await p.$$eval('#stage svg circle', a => a.length) === 3, '인생 곡선의 점이 마음 점수를 적은 장면 수(3)와 같다');
    const st = await go('stairs');
    is(/2계단/.test(st) && await p.$$eval('#stage .stairs > div', a => a.length) === 2, '증명의 계단이 「결과로 증명」 장면 수(2)와 같다');
    is(/홍길동/.test(await p.evaluate(() => { show(0); return $('stage').innerText; })), '표지에 강사 이름이 선다');
    const fit = await p.evaluate(() => { const keep = S.story.leaderFail;
      S.story.leaderFail = ('그날 나는 주차장에서 한 시간을 못 내렸습니다.\n').repeat(40).slice(0, STORY_MAX);
      show(D.findIndex(s => s.ty === 'story')); const el = document.querySelector('#stage .story'); const r = el.scrollHeight <= el.clientHeight + 2;
      S.story.leaderFail = keep; return r && STORY_MAX; });
    is(fit, '이야기 칸 끝(' + fit + '자 · 줄바꿈 가득)까지 적어도 장에서 안 잘린다 — 적는 칸이 말하는 길이와 장이 맞는다');
    await p.evaluate(() => { S.tl[1].score = ''; save(); });
    await go('stairs');
    is(await p.evaluate(() => D.filter(s => s.ty === 'curve').length) === 2 && await p.evaluate(() => scored().length) === 2, '점수를 비운 장면은 곡선에서 빠진다 — 0 으로 그리지 않는다');

    console.log('\n[7] 숫자 · 세금 · 보험 말 (1번 · 2번)');
    await p.emulateMedia({ reducedMotion: 'reduce' });   /* 움직이는 중인 자리를 넘침으로 잘못 재지 않게 */
    const ov = [];
    const all = await p.evaluate(ov => { const o = []; for (let i = 0; i < D.length; i++) { show(i); o.push((D[i].ty === 'news' ? '\u0000뉴스\u0000' : '') + $('stage').innerText);
      const sl = document.querySelector('#stage .sl'), st = $('stage').getBoundingClientRect();
      if (sl.scrollHeight > sl.clientHeight + 2 || [...sl.querySelectorAll('*')].some(x => x.getBoundingClientRect().bottom > st.bottom + 1)) ov.push(i + 1); }
      show(0); return { o, ov }; }, ov).then(r => { ov.push(...r.ov); return r.o; });
    is(ov.length === 0, '어느 장도 화면(16:9) 밖으로 넘치지 않는다' + (ov.length ? ' ← ' + ov.join(',') + '장' : ''));
    await p.emulateMedia({ reducedMotion: 'no-preference' });
    /* 뉴스 장은 기사 제목을 그대로 옮기므로 기사 속 숫자가 섭니다 — 그 장만 빼고, 대신 [10] 에서 출처를 잽니다 */
    const money = all.filter(t => t.indexOf('\u0000뉴스\u0000') < 0 && /\d[\d,]*\s*(만\s*원|억|천만|원\b|%)/.test(t));
    is(money.length === 0, '뉴스 장 말고는 어느 장에도 금액 · 비율 숫자가 없다' + (money.length ? ' ← ' + money[0].slice(0, 60) : ''));
    const tax = all.filter(t => /비과세/.test(t));
    is(tax.length > 0 && tax.every(t => /요건/.test(t)), '비과세를 말하는 장은 언제나 「요건」 을 함께 말한다');
    is(all.some(t => /심사 결과에 따릅니다/.test(t)), '「심사 결과에 따릅니다」 가 있다');
    is(all.some(t => /홍길동/.test(t)), '견본 고객은 홍길동 (3번)');

    console.log('\n[8] 워크북은 빈 칸 · 강사 대본에는 이야기');
    const bk = await p.evaluate(() => ({ book: bookHtml(), n: (bookHtml().match(/class="wb"/g) || []).length, sc: scriptHtml() }));
    is(bk.n === 6 && await p.evaluate(() => WB.length) === 6, '참가자 워크북이 6쪽이다 — 글 한 벌(WB)의 쪽 수 그대로 (3쪽 · 나의 마지막 하루)');
    is(!/홍길동 점검 이야기|다음 날 또 나갔다/.test(bk.book), '워크북에 강사님 이야기 · 장면이 안 들어간다');
    is(/홍길동 점검 이야기/.test(bk.sc) && /다음 날 또 나갔다/.test(bk.sc), '강사 대본에는 이야기 · 장면이 들어간다');
    await p.evaluate(() => { window.print = () => {}; page('book'); $('prBook').click(); });
    await p.emulateMedia({ media: 'print' });
    is(await p.evaluate(() => getComputedStyle(document.querySelector('.wrap')).display === 'none' && document.querySelectorAll('#printArea .wb').length === 6), '인쇄하면 화면은 숨고 워크북 6쪽만 나온다');
    await p.emulateMedia({ media: 'screen' });

    console.log('\n[10] 뉴스 — 실제 기사 · 출처 · 날짜 (9번 · 1번)');
    await p.evaluate(() => page('deck'));   /* 움직임은 보이는 쪽에서만 돕니다 */
    const nw = await p.evaluate(() => NEWS.map(n => ({ o: n.o, t: n.t, u: n.u, d: n.d, set: n.set })));
    is(nw.length >= 4 && nw.every(n => n.o && n.t && /^https:\/\/[^\s]+\.[a-z]{2,}\//.test(n.u)), '기사 ' + nw.length + '건 모두 언론사 · 제목 · https 원문 주소가 있다');
    is(nw.every(n => !n.d || /^\d{4}[.\-]\s?\d{1,2}[.\-]\s?\d{1,2}\.?$/.test(n.d)), '날짜는 원문 꼴 그대로이거나 비어 있다');
    const nsl = await p.evaluate(() => { const o = []; D.forEach((s, i) => { if (s.ty === 'news') { show(i); o.push({ set: s.set, txt: $('stage').innerText,
      a: [...document.querySelectorAll('#stage a')].map(a => [a.getAttribute('href'), a.target]) }); } }); return o; });
    is(nsl.length === 2 && nsl.every(x => nw.filter(n => n.set === x.set).every(n => x.txt.indexOf(n.o) >= 0 && x.txt.indexOf(n.t) >= 0)), '뉴스 장 둘 — 기사마다 언론사와 제목이 그 장에 선다');
    is(nw.some(n => !n.d) ? nsl.some(x => /날짜 확인 못 함/.test(x.txt)) : true, '날짜를 확인 못 한 기사는 「날짜 확인 못 함」 이라 적는다 — 지어 적지 않는다');
    const links = nsl.flatMap(x => x.a);
    is(links.every(([h, t]) => t === '_blank' && /^https:\/\//.test(h)), '장 안의 링크는 모두 새 창으로 원문 · 네이버를 연다');
    is(links.some(([h]) => /^https:\/\/search\.naver\.com\/search\.naver\?where=news&query=/.test(h)), '네이버 최신 기사 찾기 링크가 있다(주소만 엽니다)');
    is(/\/\* 메멘토 모리[\s\S]{0,80}직접 그렸습니다/.test(PAGE) && await p.evaluate(() => { show(D.findIndex(s => s.ty === 'memento')); return !!document.querySelector('#stage .skull path') && !!document.querySelector('#stage .glass .sandTop') && !!document.querySelector('#stage .candle .flame'); }),
      '메멘토 모리 장 — 해골 · 모래시계 · 촛불이 직접 그린 SVG 로 선다');

    console.log('\n[11] 움직임 — 돌고, 줄이기를 켜면 멈춘다');
    const an = await p.evaluate(() => document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('#stage')).map(a => a.animationName));
    is(an.indexOf('sandTop') >= 0 && an.indexOf('flicker') >= 0 && an.indexOf('float') >= 0, '모래가 떨어지고 · 촛불이 흔들리고 · 해골이 떠 있다 (' + [...new Set(an)].slice(0, 6).join(',') + ')');
    await p.evaluate(() => show(0));
    is(await p.evaluate(() => document.getAnimations().some(a => a.animationName === 'pop')), '표지의 C 가 튀어나온다');
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await p.evaluate(() => show(D.findIndex(s => s.ty === 'memento')));
    is(await p.evaluate(() => document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('#stage')).length) === 0, '움직임 줄이기를 켠 기기에서는 아무것도 안 움직인다');
    await p.emulateMedia({ reducedMotion: 'no-preference' });

    console.log('\n[12] 사진 — 넣으면 서고 · 출처를 말하고 · 인쇄에는 안 들어간다');
    await p.evaluate(() => page('mine'));
    is(await p.$$eval('#nvImg a', a => a.length > 0 && a.every(x => x.target === '_blank' && /^https:\/\/search\.naver\.com\/search\.naver\?where=image&query=/.test(x.href))), '네이버 이미지 찾기는 새 창으로 주소만 연다');
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8DwnwEJMDGgAQBu4gP+3l2ZyAAAAABJRU5ErkJggg==', 'base64');
    await p.setInputFiles('#phAdd', [{ name: 'a.png', mimeType: 'image/png', buffer: png }, { name: 'b.png', mimeType: 'image/png', buffer: png }]);
    await p.waitForFunction(() => S.photos.length === 2);
    await p.fill('.ph-row[data-i="0"] [data-pf="cap"]', '점검 사진 설명');
    await p.fill('.ph-row[data-i="0"] [data-pf="from"]', '직접 촬영');
    const ph = await p.evaluate(() => { page('deck'); const o = D.map((s, i) => [s.ty, i]).filter(x => x[0] === 'photo');
      show(o[0][1]); const a = $('stage').innerText; show(o[1][1]); const b = $('stage').innerText;
      return { n: o.length, a, b, src: /^data:image\/jpeg/.test(S.photos[0].src), sec: D[o[0][1]].sec, book: bookHtml(), sc: scriptHtml() }; });
    is(ph.n === 2 && ph.sec === 'p3', '넣은 사진 둘이 3부에 한 장씩 선다');
    is(ph.src, '사진은 줄여 JPEG 로 담는다');
    is(/점검 사진 설명/.test(ph.a) && /출처 · 직접 촬영/.test(ph.a), '설명과 출처가 장에 선다');
    is(/출처를 안 적었습니다/.test(ph.b), '출처를 안 적으면 그 장이 그렇다고 말한다');
    is(!/<img|data:image/.test(ph.book) && !/<img|data:image/.test(ph.sc) && /출처: 직접 촬영/.test(ph.sc), '워크북 · 강사 대본 인쇄에 사진이 안 들어간다 — 대본에는 설명 · 출처만');
    is(await p.evaluate(() => { const s0 = TOTAL_MIN; return s0 === 240; }), '장이 늘어도 4시간(240분) 그대로');

    console.log('\n[13] 📱 함께 적기 — 덱이 폰 워크북을 가리키나 · 활동 장마다 쪽이 서나');
    await p.evaluate(() => page('deck'));
    const pw = await p.evaluate(() => { const i = D.findIndex(s => s.ty === 'phone'); if (i < 0) return null; show(i);
      return { txt: $('stage').innerText, sec: D[i].sec, href: (document.querySelector('#stage a[href]') || {}).getAttribute && document.querySelector('#stage a[href]').getAttribute('href'), url: wbUrl() }; });
    is(pw && pw.sec === 'open' && /bcd-workbook\.html$/.test(pw.url) && pw.txt.indexOf(pw.url) >= 0 && pw.href === 'bcd-workbook.html', '여는 마당에 폰 워크북 주소가 크게 서고 열어 보기가 그 파일로 간다');
    is(/링크 복사/.test(pw.txt), '「링크 복사」 단추가 있다(단톡방에 올리기)');
    const wk = await p.evaluate(() => { const o = []; D.forEach((s, i) => { if (s.ty === 'work') { show(i); const t = $('stage').innerText; const m = /워크북 (\d)쪽/.exec(s.steps.join(' ') + ' ' + s.say);
      o.push({ wb: s.wb, badge: s.wb ? t.indexOf('워크북 ' + s.wb + '쪽') >= 0 && t.indexOf(WB[s.wb - 1].t) >= 0 : false, said: m ? +m[1] : null }); } }); return o; });
    is(wk.length >= 7 && wk.every(w => w.wb >= 1 && w.wb <= 6 && w.badge), '활동 장 ' + wk.length + '개 모두 「📱 n쪽 — 그 쪽 제목」 이 선다');
    is(wk.every(w => w.said === null || w.said === w.wb), '활동 장의 말(「워크북 n쪽」)과 쪽 표시가 같다');
    is(new Set(wk.map(w => w.wb)).size === 6, '워크북 여섯 쪽이 모두 어느 활동에서 쓰인다');

    console.log('\n[15] ▦ 한눈에 — 강의 전체를 펼쳐 보나');
    await p.evaluate(() => { window.__keep = JSON.stringify(S); localStorage.removeItem(KEY); S = load(); S.story.leaderFail = '홍길동 점검 — 펼쳐 보기'; save(); page('deck'); show(0); });
    await p.click('#ovBtn');
    const ovw = await p.evaluate(() => { const A = deckAll();
      return { open: !$('ov').hidden && $('stageBox').hidden, cards: document.querySelectorAll('#ov .ovc').length, d: D.length,
        holes: document.querySelectorAll('#ov .ovx').length, skip: A.filter(x => x.skip).length,
        order: [...document.querySelectorAll('#ov .ovc')].every((c, i) => +c.dataset.i === i),
        secs: [...document.querySelectorAll('#ov .ovs h3 small')].map(x => +(/(\d+)분/.exec(x.textContent) || [0, 0])[1]).reduce((a, b) => a + b, 0),
        story: /홍길동 점검 — 펼쳐 보기/.test($('ov').innerText),
        nest: document.querySelectorAll('#ov .ovg > :not(.ovc):not(.ovx)').length, grid: [...document.querySelectorAll('#ov .ovg')].every(g => g.children.length > 0),
        ids: [...document.querySelectorAll('[id]')].map(x => x.id).filter((v, i, a) => a.indexOf(v) !== i),
        anim: document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('#ov')).length }; });
    is(ovw.open, '▦ 한눈에를 누르면 펼친 판이 서고 큰 화면은 접힌다');
    is(ovw.cards === ovw.d && ovw.order, '발표에 서는 장 ' + ovw.d + '장이 빠짐없이 같은 차례로 선다');
    is(ovw.holes === ovw.skip && ovw.holes > 0, '빠지는 장 ' + ovw.skip + '개가 점선 칸으로 그 자리에 서서 무엇을 적으면 서는지 말한다');
    is(ovw.secs === 240, '부마다 분을 더하면 240분');
    is(ovw.story, '적은 이야기가 작은 화면에도 그대로 선다');
    is(ovw.nest === 0 && ovw.grid, '펼친 판이 깨지지 않는다 — 칸 안에는 작은 화면과 점선 칸만 선다(단추 속 단추가 문서를 쪼개지 않게)');
    is(ovw.ids.length === 0, '작은 화면이 id 를 겹쳐 만들지 않는다' + (ovw.ids.length ? ' ← ' + ovw.ids.slice(0, 3).join(',') : ''));
    is(ovw.anim === 0, '작은 화면은 움직이지 않는다(장 수십 개가 한꺼번에 돌지 않게)');
    const pick = await p.evaluate(() => { const c = document.querySelectorAll('#ov .ovc')[7]; c.click(); return { cur, hid: $('ov').hidden, big: !$('stageBox').hidden }; });
    is(pick.cur === 7 && pick.hid && pick.big, '작은 화면을 누르면 그 장(8번째)으로 가고 펼친 판이 닫힌다');
    await p.keyboard.press('g');
    is(await p.evaluate(() => !$('ov').hidden), 'G 키로 펼친다');
    await p.keyboard.press('Escape');
    is(await p.evaluate(() => $('ov').hidden && !$('stageBox').hidden), 'Esc 로 닫힌다');
    await p.evaluate(() => { S = JSON.parse(window.__keep); save(); });   /* 앞 점검이 적어 둔 것을 되돌려 놓습니다 — [9] 가 그것을 봅니다 */

    console.log('\n[14] 📱 폰 워크북 — 적고 · 남고 · 그리고 · 뽑고 · 지운다 (bcd-workbook.html)');
    const q = await ctx.newPage({ viewport: { width: 390, height: 844 } });
    const qe = []; q.on('pageerror', e => qe.push(e.message)); q.on('dialog', d => d.accept());
    await q.setViewportSize({ width: 390, height: 844 });
    await q.goto('http://127.0.0.1:' + PORT + '/app/bcd-workbook.html', { waitUntil: 'load' });
    await q.evaluate(() => { localStorage.removeItem(KEY); }); await q.reload({ waitUntil: 'load' });
    const w0 = await q.evaluate(() => ({ pages: document.querySelectorAll('.pg').length, tabs: document.querySelectorAll('#tabs button').length, n: WB.length,
      qs: WB.flatMap(p => p.items).filter(it => it.ty !== 'curve' && it.ty !== 'ff').every(it => document.body.innerText.indexOf(it.q.split('___')[0].trim()) >= 0 || document.body.innerHTML.indexOf(it.q.split('___')[0].trim()) >= 0),
      sw: document.documentElement.scrollWidth, prog: $('prog').textContent }));
    is(w0.pages === w0.n && w0.tabs === w0.n, '쪽이 글 한 벌(WB)과 같은 ' + w0.n + '쪽이다');
    is(w0.qs, '종이 워크북의 물음이 폰에도 그대로 선다(같은 글)');
    is(w0.sw <= 390, '폰 폭(390px)에서 옆으로 안 넘친다 — ' + w0.sw + 'px');
    is(/· 0 \/ \d+칸 적음/.test(w0.prog), '처음에는 「0 / n칸 적음」 — 아무것도 미리 안 적혀 있다');
    await q.fill('[data-k="today.0"]', '오늘은 일찍 일어났다');
    await q.selectOption('[data-k="scenes.0.s"]', '-4'); await q.fill('[data-k="scenes.0.t"]', '첫 거절'); await q.selectOption('[data-k="scenes.0.r"]', 'fail');
    is(await q.$$eval('#cv_scenes circle', a => a.length) === 0 && /지금 1장면/.test(await q.textContent('#cv_scenes')), '점수를 한 장면만 고르면 곡선 대신 「두 장면 이상」 이라 말한다');
    await q.selectOption('[data-k="scenes.1.s"]', '3'); await q.fill('[data-k="scenes.1.t"]', '다시 일어선 날'); await q.fill('[data-k="scenes.2.t"]', '점수 안 고른 장면');
    is(await q.$$eval('#cv_scenes circle', a => a.length) === 2, '점수를 고른 두 장면만 곡선의 점이 된다 — 비운 장면을 0 으로 안 그린다 (1번)');
    await q.click('#tabs button[data-p="2"]');
    await q.fill('[data-k="word"]', '고마웠다 길동아');
    await q.click('#tabs button[data-p="3"]'); await q.click('[data-life="where"][data-i="4"]');
    await q.click('#tabs button[data-p="4"]'); await q.check('[data-k="obs.1"]'); await q.fill('[data-k="ff.3.f"]', '모름');
    await q.click('#tabs button[data-p="5"]'); await q.fill('[data-k="proved"]', '끝까지 가는 것');
    await q.reload({ waitUntil: 'load' });
    const w1 = await q.evaluate(() => ({ a: A['today.0'], w: A['word'], l: A['where'], o: A['obs.1'], f: A['ff.3.f'], p: A['proved'], prog: $('prog').textContent,
      lifeOn: document.querySelector('[data-life="where"][data-i="4"]').classList.contains('on') }));
    is(w1.a === '오늘은 일찍 일어났다' && w1.w === '고마웠다 길동아' && w1.l === '4' && w1.o === true && w1.f === '모름' && w1.p === '끝까지 가는 것' && w1.lifeOn, '다시 열어도 그 폰에 적은 것이 남는다 (글 · 생애 지도 · 체크)');
    is(!/· 0 \//.test(w1.prog), '적은 칸 수가 머리에 선다 — ' + w1.prog.replace('· ', ''));
    await q.evaluate(() => { window.print = () => {}; $('prBtn').click(); });
    await q.emulateMedia({ media: 'print' });
    const pt = await q.evaluate(() => ({ t: $('printArea').innerText, n: document.querySelectorAll('#printArea section').length, hid: getComputedStyle(document.querySelector('.wrap')).display === 'none', svg: !!document.querySelector('#printArea svg circle') }));
    is(pt.n === 6 && pt.hid && /고마웠다 길동아/.test(pt.t) && /끝까지 가는 것/.test(pt.t) && /☑ 마음\(Feeling\)/.test(pt.t) && pt.svg, '인쇄 · PDF — 6쪽에 적은 것 · 체크 · 곡선이 그대로 찍힌다');
    await q.emulateMedia({ media: 'screen' });
    await q.click('#wipe');
    is(await q.evaluate(() => Object.keys(A).length === 0 && localStorage.getItem(KEY) === null && document.querySelector('[data-k="today.0"]').value === ''), '「다 지우기」 로 그 폰에서 지워진다');
    is(qe.length === 0, '폰 워크북에 오류가 없다' + (qe.length ? ' ← ' + qe[0] : ''));
    await q.close();

    console.log('\n[9] 이 브라우저에만 — 다시 열어도 남고, 지우면 지워진다 (3번 · 7번)');
    await p.reload({ waitUntil: 'load' });
    is(await p.evaluate(() => S.tl.length === 3 && /홍길동 점검/.test(S.story.leaderFail)), '다시 열어도 적은 것이 남는다');
    await p.evaluate(() => { page('mine'); $('wipe').click(); });
    is(await p.evaluate(() => S.tl.length === 0 && S.photos.length === 0 && !Object.values(S.story).some(v => v) && localStorage.getItem(KEY) === null), '「모두 지우기」 로 이 기기에서 지워진다 (사진까지)');
    is(errs.length === 0, '오류가 없다' + (errs.length ? ' ← ' + errs[0] : ''));
  } catch (e) { is(false, '점검이 멈췄습니다 — ' + e.message); }
  await b.close(); srv.close();
  console.log(bad ? '\n✗ ' + bad + '개가 어긋났습니다' : '\n✓ 모두 맞습니다');
  process.exit(bad ? 1 : 0);
})();
