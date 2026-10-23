/* 🎤 <b>B·C·D 영업 강의 — 선택이 증명이 되는 시간</b> (판 X175 · 2026-10-23)

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
     ⑨ 이 브라우저에만 남는다 — 다시 열어도 남고, 「모두 지우기」 로 지워진다  */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9174;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const PAGE = fs.readFileSync(path.join(ROOT, 'app/bcd-lecture.html'), 'utf8');
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
is(/const BLANK = \(\) => \(\{ me: \{ name: '', role: '' \}, story: \{\}, tl: \[\] \}\);/.test(CODE), '처음 값(BLANK)이 이름 · 이야기 · 타임라인 모두 빈 칸이다');
is(!/story\s*:\s*\{\s*[a-zA-Z]+\s*:\s*'[^']/.test(CODE) && !/tl\s*:\s*\[\s*\{/.test(CODE), '이야기 · 장면을 미리 적어 둔 줄이 없다');

console.log('\n[3] 서버 · 바깥 스크립트 · tnum (7번 · 4-1번)');
is(!/\bfetch\s*\(|XMLHttpRequest|supabase|\/\.netlify\//i.test(CODE), '서버를 부르는 줄이 없다');
is(!/<script[^>]+src=/i.test(PAGE), '바깥 스크립트를 안 들여온다');
is(!/tnum/.test(PAGE), '숫자 글꼴 tnum 을 안 켠다');

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
    const e0 = await p.evaluate(() => ({ n: D.length, st: D.filter(s => s.ty === 'story').length,
      tl: D.filter(s => /^(event|curve|stairs)$/.test(s.ty)).length, w: $('emptyWarn').innerText, k: STORY.length }));
    is(e0.st === 0 && e0.tl === 0, '비어 있으면 이야기 장 · 타임라인 장이 하나도 안 선다 (지어 넣지 않음)');
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
    const ov = [];
    const all = await p.evaluate(ov => { const o = []; for (let i = 0; i < D.length; i++) { show(i); o.push($('stage').innerText);
      const sl = document.querySelector('#stage .sl'), st = $('stage').getBoundingClientRect();
      if (sl.scrollHeight > sl.clientHeight + 2 || [...sl.querySelectorAll('*')].some(x => x.getBoundingClientRect().bottom > st.bottom + 1)) ov.push(i + 1); }
      show(0); return { o, ov }; }, ov).then(r => { ov.push(...r.ov); return r.o; });
    is(ov.length === 0, '어느 장도 화면(16:9) 밖으로 넘치지 않는다' + (ov.length ? ' ← ' + ov.join(',') + '장' : ''));
    const money = all.filter(t => /\d[\d,]*\s*(만\s*원|억|천만|원\b|%)/.test(t));
    is(money.length === 0, '어느 장에도 금액 · 비율 숫자가 없다' + (money.length ? ' ← ' + money[0].slice(0, 60) : ''));
    const tax = all.filter(t => /비과세/.test(t));
    is(tax.length > 0 && tax.every(t => /요건/.test(t)), '비과세를 말하는 장은 언제나 「요건」 을 함께 말한다');
    is(all.some(t => /심사 결과에 따릅니다/.test(t)), '「심사 결과에 따릅니다」 가 있다');
    is(all.some(t => /홍길동/.test(t)), '견본 고객은 홍길동 (3번)');

    console.log('\n[8] 워크북은 빈 칸 · 강사 대본에는 이야기');
    const bk = await p.evaluate(() => ({ book: bookHtml(), n: (bookHtml().match(/class="wb"/g) || []).length, sc: scriptHtml() }));
    is(bk.n === 5, '참가자 워크북이 5쪽이다');
    is(!/홍길동 점검 이야기|다음 날 또 나갔다/.test(bk.book), '워크북에 강사님 이야기 · 장면이 안 들어간다');
    is(/홍길동 점검 이야기/.test(bk.sc) && /다음 날 또 나갔다/.test(bk.sc), '강사 대본에는 이야기 · 장면이 들어간다');
    await p.evaluate(() => { window.print = () => {}; page('book'); $('prBook').click(); });
    await p.emulateMedia({ media: 'print' });
    is(await p.evaluate(() => getComputedStyle(document.querySelector('.wrap')).display === 'none' && document.querySelectorAll('#printArea .wb').length === 5), '인쇄하면 화면은 숨고 워크북 5쪽만 나온다');
    await p.emulateMedia({ media: 'screen' });

    console.log('\n[9] 이 브라우저에만 — 다시 열어도 남고, 지우면 지워진다 (3번 · 7번)');
    await p.reload({ waitUntil: 'load' });
    is(await p.evaluate(() => S.tl.length === 3 && /홍길동 점검/.test(S.story.leaderFail)), '다시 열어도 적은 것이 남는다');
    await p.evaluate(() => { page('mine'); $('wipe').click(); });
    is(await p.evaluate(() => S.tl.length === 0 && !Object.values(S.story).some(v => v) && localStorage.getItem(KEY) === null), '「모두 지우기」 로 이 기기에서 지워진다');
    is(errs.length === 0, '오류가 없다' + (errs.length ? ' ← ' + errs[0] : ''));
  } catch (e) { is(false, '점검이 멈췄습니다 — ' + e.message); }
  await b.close(); srv.close();
  console.log(bad ? '\n✗ ' + bad + '개가 어긋났습니다' : '\n✓ 모두 맞습니다');
  process.exit(bad ? 1 : 0);
})();
