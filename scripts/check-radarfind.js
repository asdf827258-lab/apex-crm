/* <b>미끼레이더에 신상품을 찾는 칸이 없었다.</b>

   사장님 말씀 그대로입니다 —
     「왜 신상품을 검색하는 칸이 없는거야? <b>자동으로</b> 이고,
      제대로 <b>찾아보지도 못하는데</b>」

   재 보니 신상품 레이더 화면에는 <b>기간 · 정렬 · 태그</b> 뿐이었습니다.
   서버가 모아 주는 것만 위에서부터 눈으로 훑어야 했고, 「삼성생명 그
   암보험」 을 찾으려면 스무 줄을 내려야 했습니다. 고객이 「그 상품
   뭐예요」 하고 물으신 자리에서 그러고 있을 수는 없습니다.

   한 칸이 <b>이 화면 전체</b>를 좁힙니다.

     · <b>회사별 신상품</b> — 회사 · 상품명 · 기사 제목 · 언론사
     · <b>뉴스 목록</b>     — 제목 · 언론사 · 태그
     · <b>공시실 바로가기</b> — 회사 이름을 치시면 그 회사만

   마지막 줄이 「제대로 찾아보지도 못한다」 의 답입니다. 기사에 안 나온
   상품이라도 <b>공시실에는 원문이 있습니다.</b> 못 찾았을 때 빈 화면을
   보여 드리는 대신 그리로 보내 드립니다 — <b>없는 상품은 지어내지
   않습니다</b> (CLAUDE.md 1번).

   여기서 확인합니다.
     1. 찾는 칸이 <b>있는가</b>
     2. 회사 이름으로 치면 <b>셋 다</b> 좁혀지는가
     3. 낱말로 치면 뉴스·신상품은 좁고, <b>공시실은 안 비는가</b>
        (한 곳도 안 걸리는데 카드를 비우면 「공시실이 없어졌나」 가 된다)
     4. 띄어 치면 <b>둘 다</b> 들어간 것만 남는가 · 띄어쓰기·괄호를 터는가
     5. 못 찾으면 <b>말하고 · 공시실로 보내는가</b>
     6. 지우면 <b>전부 돌아오는가</b>
     7. 판정하는 자리가 <b>하나</b>인가 (셋이 각자 재면 화면마다 달라진다) */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 180)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/상담자료/미끼레이더/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const R = await page.evaluate(async () => {
    const O = {};
    O.box = !!document.getElementById('radarQ');
    O.clear = !!document.getElementById('radarQX');
    if (!O.box) return O;
    /* 표본 기사 — 실제로 있는 회사·상품 꼴로 만든 시험용 표본이다.
       고객 이름은 안 쓴다 (CLAUDE.md 3번). */
    const NEWS = [
      { title: '삼성생명, "행복한 간편심사 종신보험" 출시', source: '보험신문', date: '2026-08-20', score: 80, tags: ['신상품'] },
      { title: '현대해상, "굿앤굿 어린이보험" 개정… 보장 확대', source: '한국보험신문', date: '2026-08-18', score: 70, tags: ['개정'] },
      { title: 'DB손해보험, "참좋은 암보험" 판매 개시', source: '매일경제', date: '2026-08-15', score: 65, tags: ['신상품'] },
      { title: '금감원, 실손보험 비급여 기준 개정 예고', source: '한국경제', date: '2026-08-10', score: 50, tags: ['제도'] },
      { title: '삼성화재, "다이렉트 운전자보험" 요율 조정', source: '보험신문', date: '2026-08-05', score: 40, tags: ['개정'] }
    ];
    state.news = NEWS; state.mon = ''; state.filter = new Set();
    document.getElementById('selPeriod').value = '9999';
    if (typeof window.npcoSeed === 'function')
      window.npcoSeed(NEWS.map(n => ({ title: n.title, source: n.source, date: n.date, link: '' })));
    const cnt = () => ({
      news: document.querySelectorAll('#newsList .nitem').length,
      co: document.querySelectorAll('#npcoList .npco-co').length,
      gs: document.querySelectorAll('#gongsiList .gs-c').length,
      org: document.querySelectorAll('#gongsiList .gs-o').length,
      newsTxt: (document.getElementById('newsList') || {}).textContent || '',
      coTxt: (document.getElementById('npcoList') || {}).textContent || '',
      gsTxt: (document.getElementById('gongsiList') || {}).textContent || ''
    });
    const set = async v => { MKFIND.set(v); await new Promise(r => setTimeout(r, 60)); return cnt(); };
    O.all = await set('');
    O.co = await set('삼성생명');
    O.word = await set('암보험');
    O.two = await set('삼성 종신');
    O.flat = await set('행복한간편심사');
    O.paren = await set('굿앤굿어린이');
    O.none = await set('없는회사zzz');
    O.back = await set('');
    /* 실제로 칸에 쳐도 도는가 — MKFIND.set 만 되고 칸이 안 물리면 소용없다 */
    const inp = document.getElementById('radarQ');
    inp.value = '삼성생명';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 80));
    O.typed = cnt().news;
    document.getElementById('radarQX').click();
    await new Promise(r => setTimeout(r, 80));
    O.cleared = cnt().news; O.clearedVal = inp.value;
    /* 판정하는 자리가 하나인가 */
    O.one = {
      news: /MKFIND\.on\(/.test(String(renderNews)),
      co: /MKFIND\.on\(/.test(String(window.npcoPaint)),
      gs: /MKFIND\.on\(/.test(String(window.gongsiPaint)),
      reg: MKFIND.redraw.length
    };
    return O;
  });

  console.log('\n[1] 찾는 칸이 있다');
  is(R.box, '  <b>🔎 신상품 찾기</b> 칸이 화면에 있다');
  is(R.clear, '  <b>✕ 지우기</b> 단추가 있다');
  if (!R.box) { await browser.close(); srv.close(); process.exit(1); }

  console.log('\n[2] 회사 이름으로 치면 셋 다 좁혀진다');
  is(R.co.news < R.all.news && R.co.news > 0,
     '  뉴스 ' + R.all.news + '건 → <b>' + R.co.news + '건</b>');
  is(R.co.co < R.all.co && R.co.co > 0,
     '  회사별 신상품 ' + R.all.co + '곳 → <b>' + R.co.co + '곳</b>');
  is(R.co.gs === 1,
     '  <b>공시실이 그 회사 하나</b>로 좁혀진다 — ' + R.all.gs + '곳 → ' + R.co.gs + '곳 ' +
     '(기사에 없는 상품도 여기서 원문을 받으신다)');
  is(/삼성생명/.test(R.co.gsTxt) && /좁혔습니다/.test(R.co.gsTxt),
     '  <b>무엇으로 좁혔는지</b> 적는다 — 지우면 전부 돌아온다고도 적는다');
  is(R.co.org === R.all.org,
     '  <b>협회·금감원</b> 은 그대로 남는다 — ' + R.co.org + '곳 (어느 회사든 쓰는 곳이다)');

  console.log('\n[3] 낱말로 치면 공시실은 안 비운다');
  is(R.word.news === 1 && R.word.co === 1,
     '  「암보험」 — 뉴스 <b>' + R.word.news + '건</b> · 신상품 <b>' + R.word.co + '곳</b>');
  is(R.word.gs === R.all.gs,
     '  공시실은 <b>' + R.word.gs + '곳 그대로</b> — 회사 이름이 아니면 안 줄인다 ' +
     '(한 곳도 안 걸리는데 비우면 「없어졌나」 가 된다)');

  console.log('\n[4] 띄어 치면 둘 다 · 띄어쓰기와 괄호는 턴다');
  is(R.two.news === 1,
     '  「삼성 종신」 — <b>둘 다</b> 들어간 것만 (또는이 아니라 그리고) · ' + R.two.news + '건');
  is(R.flat.news === 1,
     '  「행복한간편심사」 — <b>띄어쓰기 없이</b> 쳐도 찾힌다 · ' + R.flat.news + '건');
  is(R.paren.news === 1,
     '  「굿앤굿어린이」 — 원문은 「굿앤굿 어린이보험」 인데 찾힌다 · ' + R.paren.news + '건');

  console.log('\n[5] 못 찾으면 말하고, 공시실로 보낸다');
  is(R.none.news === 0 && R.none.co === 0, '  없는 말에는 <b>비운다</b> — 헛것을 올리지 않는다');
  is(/없는회사zzz/.test(R.none.newsTxt),
     '  <b>무엇으로 찾았는지</b> 되뇌어 준다 — 오타를 그 자리에서 아신다');
  is(/공시실/.test(R.none.newsTxt) && /공시실/.test(R.none.coTxt),
     '  <b>공시실로 보낸다</b> — 기사에 없는 상품이라도 원문은 있다');
  is(/지어내지 않습니다/.test(R.none.newsTxt) && /지어내지 않습니다/.test(R.none.coTxt),
     '  <b>없는 상품을 지어내지 않는다</b>고 밝힌다 (CLAUDE.md 1번)');
  is(R.none.gs === R.all.gs, '  못 찾아도 <b>공시실은 그대로</b> 있다 — 갈 곳이 남는다');

  console.log('\n[6] 진짜 칸에 쳐도 돌고, 지우면 돌아온다');
  is(R.typed < R.all.news && R.typed > 0,
     '  칸에 「삼성생명」 을 치면 <b>' + R.typed + '건</b> 으로 좁혀진다');
  is(R.cleared === R.all.news && R.clearedVal === '',
     '  ✕ 를 누르면 <b>' + R.cleared + '건 전부</b> 돌아오고 칸도 비워진다');
  is(R.back.news === R.all.news && R.back.co === R.all.co && R.back.gs === R.all.gs,
     '  지우면 셋 다 <b>원래대로</b> — 뉴스 ' + R.back.news + ' · 신상품 ' + R.back.co +
     ' · 공시실 ' + R.back.gs);

  console.log('\n[7] 판정하는 자리는 하나다');
  is(R.one.news && R.one.co && R.one.gs,
     '  세 목록이 모두 <b>MKFIND 하나</b>에 물어본다 — 각자 재면 화면마다 달라진다');
  is(R.one.reg >= 3,
     '  다시 그릴 자리도 <b>한 곳에 등록</b>한다 — ' + R.one.reg + '곳 ' +
     '(따로 부르면 자리를 늘렸을 때 한쪽만 고쳐진다)');

  console.log('\n[8] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 신상품을 찾으실 수가 없습니다')
                  : '✓ 한 칸이 화면 전체를 좁히고 · 못 찾으면 공시실로 보냅니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
