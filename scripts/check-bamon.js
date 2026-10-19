/* 「지금 매달 얼마 내십니까」 에 한 고객 화면이 <b>한 답</b>만 하는가 (판 X136).

   사장님 말씀 2026-10-19 「소개 설명서 보장분석 전후 자료 설명 방법 디테일하게
   넣어줘야 와닿지」 — 설명서에 「한눈에 숫자 넷을 그대로 읽으십시오」 라고 적으려고
   보여주기 화면을 한 장씩 찍어 보니, 같은 고객 화면 안에서

       한눈에      월 보험료 · 지금 129,900원 → 조정 후 172,000원
       보험료 변화  월 납입            117,500원 →        159,600원
       한 줄 요약   「매달 117,500원을 내고 계십니다」

   가 나란히 서 있었습니다. 한눈에만 calc().premB 로 따로 세었고, 그쪽은
   <b>납입이 끝난 계약</b>의 보험료까지 더했습니다. 나머지는 premCalc 가 세어
   그 계약을 0 으로 둡니다(매달 안 나가므로). 설계사가 첫 장에서 129,900원을
   읽고 다섯 장 뒤에 117,500원을 읽으면, 고객은 <b>둘 중 하나는 틀렸다</b>고 압니다.

   여기서 못 박는 것 —
     1. 견본에 납입이 끝난 계약이 정말 있나 (없으면 이 자는 아무것도 안 잽니다 · 8번)
     2. 「지금」 이 한눈에 · 보험료 변화 · 한 줄 요약 · 만들기 옆 칸에서 같은가
     3. 「조정 후」 가 한눈에 · 보험료 변화 · 왜 나에게 맞는가 · 만들기 옆 칸에서 같은가
     4. 보험료를 하나도 못 적었으면 「0원」 이 아니라 「—」 인가 (1번 — 모름은 0 이 아니다)
     5. 날글에 calc().premB · C.premB 가 다시 안 나타나나 (쌍둥이 · 5번)       */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
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

/* 날글 — 따로 세는 자리가 되살아나면 화면을 열기 전에 잡는다 */
head('날글 — 「지금 매달」 을 세는 자리가 하나인가');
const SRC = fs.readFileSync(path.join(ROOT, 'app/ba.html'), 'utf8');
is(!/\bC\.prem[AB]\b/.test(SRC), 'C.premB · C.premA 로 월 보험료를 찍는 자리가 없다 (premCalc 하나가 답한다)');

(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1280, height: 900 } });
  /* 바깥은 막는다 — 진짜 서버를 읽으면 CI 와 손이 다른 화면을 잽니다 (check-netblock) */
  await ctx.route('**://**', r => (r.request().url().indexOf('127.0.0.1:' + port) >= 0 ? r.continue() : r.abort()));
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));

  await pg.goto('http://127.0.0.1:' + port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(600);
  /* 견본 자료 — 앱이 스스로 넣는 견본이다. 실제 고객 이름이 아니다. */
  await pg.evaluate(() => { localStorage.clear(); doSample(); S.who.name = '홍길동'; S.deck = false; go('make'); });
  await pg.waitForTimeout(400);

  head('1. 견본에 납입이 끝난 계약이 있나 — 없으면 이 자는 헛돈다');
  const done = await pg.evaluate(() => S.before.filter(p => {
    const c = payCalc(p, 'before'); return c.done && c.prem !== null && c.prem > 0; }).length);
  is(done >= 1, '납입이 끝났는데 보험료가 적힌 계약 ' + done + '건');

  const side = await pg.evaluate(() => {
    const b = [].slice.call(document.querySelectorAll('.sum .prem b')).map(x => x.textContent.trim());
    return { now: b[0] || '', after: b[1] || '' };
  });

  await pg.evaluate(() => go('show'));
  await pg.waitForTimeout(500);
  const show = await pg.evaluate(() => {
    const t = id => { const el = document.getElementById(id); return el ? el.innerText : ''; };
    const hero = [].slice.call(document.querySelectorAll('#s1 .hero .hn b')).map(x => x.textContent.trim());
    const m2 = t('s2').match(/월 납입\s*([\d,]+원)\s*([\d,]+원)/) || [];
    const m3 = t('s3').match(/매달 ([\d,]+원)을 내고/) || [];
    const m0 = t('s0').match(/조정 후 ([\d,]+원)/) || [];
    return { heroNow: hero[0] || '', heroAfter: hero[1] || '',
             s2Now: m2[1] || '', s2After: m2[2] || '', s3Now: m3[1] || '', s0After: m0[1] || '' };
  });

  head('2. 「지금 매달」 — 네 자리가 한 답인가');
  console.log('     한눈에 ' + show.heroNow + ' · 보험료 변화 ' + show.s2Now +
              ' · 한 줄 요약 ' + show.s3Now + ' · 만들기 옆 칸 ' + side.now);
  is(/\d/.test(show.heroNow) && /\d/.test(show.s2Now), '한눈에 · 보험료 변화에 숫자가 섰다');
  is(show.heroNow === show.s2Now, '한눈에 = 보험료 변화 (' + show.heroNow + ' / ' + show.s2Now + ')');
  is(show.s3Now === show.s2Now, '한 줄 요약 = 보험료 변화 (' + show.s3Now + ')');
  is(side.now === show.s2Now, '만들기 옆 칸 = 보험료 변화 (' + side.now + ')');

  head('3. 「조정 후」 — 네 자리가 한 답인가');
  is(show.heroAfter === show.s2After, '한눈에 = 보험료 변화 (' + show.heroAfter + ' / ' + show.s2After + ')');
  is(show.s0After === show.s2After, '왜 나에게 맞는가 = 보험료 변화 (' + show.s0After + ')');
  is(side.after === show.s2After, '만들기 옆 칸 = 보험료 변화 (' + side.after + ')');

  head('4. 보험료를 하나도 못 적었으면 「—」 — 0원이 아니다');
  const none = await pg.evaluate(() => {
    S.before.forEach(p => { p.premMan = ''; p.premMan2 = ''; });
    S.after.forEach(p => { p.premMan = ''; });
    go('show');
    const hero = [].slice.call(document.querySelectorAll('#s1 .hero .hn b')).map(x => x.textContent.trim());
    const say = (document.querySelector('#s1') || {}).innerText || '';
    go('make');
    const sb = [].slice.call(document.querySelectorAll('.sum .prem b')).map(x => x.textContent.trim());
    return { hero: hero, say: say, side: sb };
  });
  is(none.hero[0] === '—' && none.hero[1] === '—', '한눈에 「' + none.hero.join(' → ') + '」');
  is(none.side[0] === '—' && none.side[1] === '—', '만들기 옆 칸 「' + none.side.join(' → ') + '」');
  is(!/0원을 내고/.test(none.say), '한눈에 따옴표 줄이 「0원을 내고 계시고」 라고 읽지 않는다');

  head('5. 그리다 터지지 않았나');
  is(errs.length === 0, '페이지 에러 ' + errs.length + '건' + (errs.length ? ' — ' + errs[0] : ''));

  await pg.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await br.close(); srv.close();
  console.log(bad ? '\n✗ ' + bad + '곳이 어긋납니다' : '\n✓ 「지금 매달 얼마」 에 한 답만 합니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
