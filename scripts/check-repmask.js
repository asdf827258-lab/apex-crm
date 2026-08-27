/* <b>서버에는 가린 이름만 간다.</b>

   「고객 365일 저장」 을 누르면 상담 글이 통째로 saved_reports 로
   올라간다. 그 글에 <b>실명</b>이 섞여 있으면 그대로 서버에 남는다 —
   보장분석 리포트는 증권에서 읽은 이름을 표지에 싣고, AI 가 쓴 글은
   인사말·맺음말에 이름을 흩뿌린다. 실명은 <b>이 브라우저에만</b>
   둔다 (CLAUDE.md 3번).

   막는 자리는 <b>하나</b>여야 한다 — 여섯 도구가 osRepSaveToClient
   한 목을 지난다. 도구마다 각자 가리면 새 도구가 생기는 날 그 도구만
   그냥 나간다 (5번).

   여기서 확인한다.
     1. 저장 글에서 <b>실명이 가려진다</b> — 제목까지
     2. 무엇이 이름인지 <b>짐작하지 않는다</b> — 사장님이 적어 두신
        이름만 바꾼다. 안 적어 두셨으면 아무것도 안 건드린다
     3. 화면·종이는 <b>그대로 실명</b> — 그 자리에는 고객 본인이 앉아 있다
     4. 새 고객을 만들면 <b>실명을 이 브라우저에</b> 남긴다. 안 남기면
        방금 적으신 이름을 앱이 잊어, 나가는 글에서 골라낼 수도 없다
     5. 글이 <b>망가지지 않는다</b> — 가린 뒤에도 그대로 읽힌다        */

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

/* 견본은 언제나 홍길동 — 실제 고객 이름을 쓰지 않는다 (CLAUDE.md 3번) */
const DOC =
  '홍길동 님의 전체 계약리스트\n' +
  '계약 건수 1건 합계보험료 500,000원\n' +
  '1 정상 삼성화재 무배당 튼튼종합보험 2018-03-01 월납 20 년 100 세 500,000 원\n' +
  '홍길동 님의 담보별 진단현황\n' +
  '암 진단 일반암진단비 권장 5,000만 1 가입 3,000만 1 부족 -2,000만\n';

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 180)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[1] 나가는 목 한 곳에서 가린다');
  const one = await page.evaluate(() => {
    const O = {};
    O.hasMask = typeof osRepMask === 'function';
    O.oneDoor = /content\s*=\s*osRepMask\(/.test(String(osRepSaveToClient));
    /* 제목에도 이름이 들어간다 — 「AI 고객 설명서 — 홍길동 님 제안」.
       본문만 가리고 제목을 두면 목록에 실명이 그대로 뜬다. */
    O.titleToo = /title\s*=\s*osRepMask\(/.test(String(osRepSaveToClient));
    /* 사장님이 적어 두신 실명이 있을 때 */
    const real = () => '홍길동';
    const keep = window.cmRealOf;
    window.cmRealOf = real;
    const out = osRepMask({ md: '홍길동 님의 보장 현황입니다. 홍길동님, 확인 부탁드립니다.',
                            deck: { client: { name: '홍길동' } } }, 'cid', '홍*동');
    window.cmRealOf = keep;
    const j = JSON.stringify(out);
    O.real = (j.match(/홍길동/g) || []).length;
    O.masked = (j.match(/홍\*동/g) || []).length;
    O.readable = /님의 보장 현황입니다/.test(out.md) && !!(out.deck && out.deck.client);
    return O;
  });
  is(one.hasMask && one.oneDoor,
     '  <b>osRepSaveToClient 한 목</b>에서 가린다 — 도구마다 각자 가리면 새 도구가 그냥 나간다');
  is(one.titleToo,
     '  <b>제목도</b> 가린다 — 본문만 가리면 고객 365일 목록에 실명이 그대로 뜬다');
  is(one.real === 0 && one.masked === 3,
     '  글 안의 실명을 <b>모두</b> 가린다 — 실명 ' + one.real + ' · 가린 이름 ' + one.masked);
  is(one.readable, '  가린 뒤에도 글이 <b>그대로 읽힌다</b>');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[2] 짐작하지 않는다');
  const two = await page.evaluate(() => {
    const O = {};
    const keep = window.cmRealOf;
    /* 적어 두신 이름이 없으면 <b>아무것도 안 건드린다</b> */
    window.cmRealOf = () => '';
    O.noName = JSON.stringify(osRepMask({ md: '홍길동 님' }, 'cid', '홍*동'));
    /* 글에 그 이름이 아예 없으면 그대로 둔다 */
    window.cmRealOf = () => '홍길동';
    O.noHit = JSON.stringify(osRepMask({ md: '이 자료에는 이름이 없습니다' }, 'cid', '홍*동'));
    /* 한 글자 이름은 안 건드린다 — 아무 낱말에나 걸려 글을 망친다.
       가린 이름을 <b>일부러 다르게</b> 넘겨, 길이 방어가 실제로 무는지 본다.
       같은 글자를 넘기면 「바꿔도 그대로」 라 시험이 통과해 버린다. */
    window.cmRealOf = () => '김';
    O.tooShort = JSON.stringify(osRepMask({ md: '김치 · 김밥 · 김포' }, 'cid', '가림'));
    window.cmRealOf = keep;
    return O;
  });
  is(/홍길동/.test(two.noName),
     '  적어 두신 실명이 <b>없으면</b> 아무것도 안 건드린다 — 무엇이 이름인지 우리는 모른다');
  is(/이름이 없습니다/.test(two.noHit), '  글에 그 이름이 없으면 그대로 둔다');
  is(/김치 · 김밥 · 김포/.test(two.tooShort),
     '  <b>한 글자</b> 이름으로는 안 가린다 — 아무 낱말에나 걸려 글을 망친다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[3] 보장분석 리포트 — 화면은 실명, 서버는 가린 이름');
  const three = await page.evaluate((DOC) => {
    const O = {};
    const sc = insScan(DOC);
    const deck = bjLocalDeck([{ name: 'a.pdf', text: DOC }], {}, 'AI 없음', sc);
    document.body.insertAdjacentHTML('beforeend', '<div id="pres_rm"></div>');
    const res = document.getElementById('pres_rm');
    res._scan = sc; res._deck = deck;
    res.innerHTML = '<div id="doc_pres_rm">' + bjDeckHtml(deck) + '</div>';
    let sent = null;
    const real = window.osRepSaveToClient;
    window.osRepSaveToClient = function (k, t, c) { sent = c; };
    bjSave('rm');
    window.osRepSaveToClient = real;
    const j = JSON.stringify(sent || {});
    O.real = (j.match(/홍길동/g) || []).length;
    O.masked = (j.match(/홍\*동/g) || []).length;
    O.screen = (bjDeckHtml(deck).match(/홍길동/g) || []).length;
    O.kept = deck.client.name;
    return O;
  }, DOC);
  is(three.real === 0 && three.masked > 0,
     '  증권에서 읽은 실명이 <b>서버로 안 간다</b> — 가린 이름 ' + three.masked + '군데 (실명 ' + three.real + ')');
  is(three.screen > 0, '  화면·종이는 <b>그대로 실명</b> — 그 자리에는 고객 본인이 앉아 있다');
  is(three.kept === '홍길동', '  원본 리포트를 <b>안 망가뜨린다</b> — 저장본만 가린다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[4] 새 고객을 만들면 실명을 이 브라우저에 남긴다');
  const four = await page.evaluate(() => {
    const src = String(osPickClient);
    return { keeps: /cmRealSet\(c\.id\s*,\s*name\)/.test(src),
             masksOnServer: /name_masked:\s*osMaskName\(name\)/.test(src) };
  });
  is(four.masksOnServer, '  서버에는 <b>가린 이름</b>으로 만든다');
  is(four.keeps,
     '  실명은 <b>이 브라우저에</b> 남긴다 — 안 남기면 방금 적으신 이름을 앱이 잊어, ' +
     '화면에도 김*수 로만 뜨고 나가는 글에서 골라낼 수도 없다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[5] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('서버 이름 가리기 점검 실패 — ' + bad + '가지 어긋납니다.')
                  : '서버 이름 가리기 점검 통과 — 실명은 이 브라우저에만 남습니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
