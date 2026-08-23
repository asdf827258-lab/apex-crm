/* 공시실에서 상품요약서 주소를 찾아오는 길이 성한가.

   설계사가 상품을 찾아도 그 상품의 문서를 손에 넣는 데가 없었다.
   협회 통합공시에는 상품요약서 PDF 가 있는데, 브라우저는 남의 서버
   파일을 스스로 못 읽는다. 그 한 겹만 서버가 넘겨 준다.

   여기서 지켜야 하는 선이 하나 있다 — <b>PDF 는 서버가 받지 않는다.</b>
   서버는 목록만 읽어 「상품명 · 회사 · 내려받기 주소」 몇 KB 를 돌려주고,
   실제 내려받기는 브라우저가 직접 한다. 원수사 자료를 우리 서버에 두지
   않는다는 약속이 여기서 지켜진다 (CLAUDE.md 9). 그리고 응답이 작아야
   한 달에 한 번 눌러도 서버에 미안하지 않다 (CLAUDE.md 7).

     1. 회사 코드표가 한 곳에만 있는가
     2. 서버가 PDF 를 받지 않는가 — 주소만 돌려주는가
     3. 목록을 제대로 읽어 내는가 (협회를 두드리지 않고 대역으로)
     4. 회사 이름을 제대로 맞추는가
     5. 못 찾으면 왜 못 찾았는지 말하고, 늘 쓰던 길로 넘기는가
     6. 화면이 받기 단추를 <b>협회 직링크</b> 로 다는가

   ※ 점검은 협회 서버를 두드리지 않는다. 실제 응답에서 확인한 구조를
     그대로 본뜬 대역을 쓴다 — 남의 서버를 점검 때마다 부르지 않는다. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = process.cwd(), PORT = 8829;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css', '.json':'application/json' };
let bad = 0;
const is = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) bad++; };
/* 기다리다 안 되면 <b>터지지 말고</b> 빨간불을 켠다.
   waitForFunction 은 시간이 지나면 던져 버려서, 거기서 점검이 통째로 죽는다.
   죽으면 무엇이 어긋났는지가 안 보인다 — 터진 점검은 알람이 아니다. */
async function waitOr(pg, fn, what, ms) {
  try { await pg.waitForFunction(fn, { timeout: ms || 12000 }); is(true, what); return true; }
  catch (e) { is(false, what + ' — 기다렸는데 안 됐습니다'); return false; }
}

/* 협회 목록 페이지의 실제 생김새를 그대로 본뜬 대역 */
function fakeList(rows) {
  return rows.map(r => `
    <tr><td rowspan="2">
      <input type="checkbox" name="listAprChk" id="listAprChk_${r.key}" value="${r.key}">
      <label id="l_memberCd_${r.key}" style="display:none;">${r.cd}</label>
      <label id="l_memberNm_${r.key}" style="display:none;">${r.co}</label>
      <label id="l_prodCd_${r.key}" style="display:none;">${r.key}</label>
      <label id="l_prodNm_${r.key}" style="display:none;">${r.prod}</label>
    </td>
    <td rowspan="2"> ${r.co} </td>
    <td class="t_left" rowspan="2"><a href="${r.page}" target="_blank" title="상품정보">${r.prod}</a></td>
    <td><a href="javascript:void(0)" onclick="fn_fileDown('${r.no}', '${r.seq}')">Download</a></td>
    </tr>`).join('');
}
const ROWS = [
  { key:'K1', cd:'L03', co:'삼성생명', prod:'삼성 더착한종신보험(2608)(무배당)[저해약환급금형]',
    no:'41117', seq:'6', page:'https://www.samsunglife.com/p1' },
  { key:'K2', cd:'L03', co:'삼성생명', prod:'삼성 VVIP 종신보험(2608)(무배당)[저해약환급금형]',
    no:'41119', seq:'6', page:'https://www.samsunglife.com/p2' },
  { key:'K3', cd:'L03', co:'삼성생명', prod:'삼성 간편한 건강보험(2608)(무배당)',
    no:'41120', seq:'6', page:'https://www.samsunglife.com/p3' }
];

function serve(){ return http.createServer((q,r)=>{
  let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/index.html';
  const f=path.join(ROOT,u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end('no');return}
  r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
  fs.createReadStream(f).pipe(r); }).listen(PORT); }

(async () => {
  console.log('\n[1] 회사 코드표가 한 곳에만 있는가');
  const cfg = JSON.parse(fs.readFileSync('config/gongsi.json', 'utf8'));
  const life = cfg['생명보험'] || {};
  is(Object.keys(life).length >= 20, '  생보사 코드가 있다 (' + Object.keys(life).length + '곳)');
  is(life['삼성생명'] === 'L03' && life['한화생명'] === 'L01', '  코드가 협회 것과 같다');
  is(/pub\.insure\.or\.kr/.test(cfg['목록주소'] || ''), '  목록 주소가 적혀 있다');
  const mk = fs.readFileSync('app/상담자료/미끼레이더/index.html', 'utf8');
  is(!/L0[0-9]['"]\s*:|memberCd\s*:\s*['"]L/.test(mk), '  화면에는 회사 코드를 또 적어 두지 않았다');

  console.log('\n[2] 서버가 PDF 를 받지 않는가 — 주소만 돌려주는가');
  const srvjs = fs.readFileSync('netlify/functions/market.js', 'utf8');
  const gs = (srvjs.match(/async function gongsiList[\s\S]*?\n}/) || [''])[0];
  is(!!gs, '  gongsiList 가 있다');
  is(!/fetch\([^)]*FileDown/.test(srvjs), '  서버가 FileDown(PDF) 을 부르지 않는다');
  is((gs.match(/await fetch\(/g) || []).length === 1, '  바깥을 부르는 곳은 목록 한 곳뿐이다');
  /* 이 함수는 10초에 끊긴다. 첫 판 6초 + 쉼 0.6초 + 다시 2.5초 = 9.1초라
     제일 오래 걸려도 안 잘린다. 숫자를 늘리면 여기서 걸린다. */
  is(/AbortController/.test(gs), '  시간제한을 걸어 둔다');
  const ms = (gs.match(/once\((\d+)\)/g) || []).map(x => +x.replace(/\D/g, ''));
  const wait = +((gs.match(/setTimeout\(r, *(\d+)\)/) || [])[1] || 0);
  const worst = ms.reduce((a, b) => a + b, 0) + wait;
  is(ms.length === 2 && worst <= 9500,
     '  제일 오래 걸려도 10초 안에 끝난다 (' + ms.join('+') + '+' + wait + ' = ' + worst + 'ms)');
  is(/Date\.now\(\) - t0 > 2500/.test(gs), '  느리게 실패한 것은 다시 하지 않는다 — 시간이 없다');
  is(/pageUnit=200/.test(gs), '  한 번에 받아 온다 — 쪽마다 되풀이해 부르지 않는다');

  console.log('\n[3~5] 목록을 읽고 · 이름을 맞추고 · 못 찾으면 말하는가');
  /* 협회 대신 대역이 답한다 */
  const realFetch = global.fetch;
  let asked = null, pdfAsked = 0;
  global.fetch = async (u, o) => {
    asked = String(u);
    if (/FileDown/.test(asked)) { pdfAsked++; }
    return { ok: true, status: 200, text: async () => '<table>' + fakeList(ROWS) + '</table>' };
  };
  const m = require(path.join(ROOT, 'netlify/functions/market.js'));
  const call = async qs => JSON.parse((await m.handler({ httpMethod:'GET', headers:{}, queryStringParameters: qs })).body);

  let j = await call({ kind:'gongsi', co:'삼성생명' });
  is(j.ok === true, '  회사로 찾으면 나온다');
  is((j.items || []).length === 3, '  세 건을 다 읽었다 (' + (j.items||[]).length + ')');
  is(j.items[0].file === 'https://pub.insure.or.kr/FileDown.do?fileNo=41117&seq=6',
     '  내려받기 주소를 그대로 만든다');
  is(j.items[0].prod.indexOf('더착한종신보험') >= 0, '  상품명을 읽는다 — ' + j.items[0].prod.slice(0, 24));
  is(j.items[0].page === 'https://www.samsunglife.com/p1', '  회사 상품페이지도 같이 준다');
  is(/search_memberCd=L03/.test(asked || ''), '  회사 코드로 좁혀 부른다');
  is(pdfAsked === 0, '  PDF 는 한 번도 안 불렀다');
  is(/약관 원문이 아닙니다/.test(j.note || ''), '  요약서이지 약관이 아니라고 밝힌다');

  j = await call({ kind:'gongsi', co:'삼성생명', q:'종신' });
  is(j.matched === 2 && j.items.length === 2, '  상품명으로 좁힌다 (종신 → 2건)');
  j = await call({ kind:'gongsi', co:'삼성생명', q:'없는상품이름' });
  is(j.ok === true && j.matched === 0 && j.items.length === 3,
     '  이름으로 못 찾으면 회사 전체를 보여 주고 그렇다고 적는다');
  j = await call({ kind:'gongsi', co:'삼성' });
  is(j.ok === true, '  짧게 적어도 맞춘다 (삼성 → 삼성생명)');
  j = await call({ kind:'gongsi' });
  is(j.ok === false && (j.companies || []).length >= 20, '  회사를 안 주면 어디를 적을 수 있는지 알려 준다');
  j = await call({ kind:'gongsi', co:'없는곳' });
  is(j.ok === false && /못 찾았습니다/.test(j.message), '  없는 회사는 그렇다고 말한다');

  global.fetch = async () => { throw new Error('협회가 안 받습니다'); };
  j = await call({ kind:'gongsi', co:'삼성생명' });
  is(j.ok === false && !!j.message, '  협회가 죽어도 500 이 아니라 사유를 돌려준다');
  global.fetch = realFetch;

  console.log('\n[6] 화면이 협회 직링크로 다는가');
  const server = serve(); const browser = await chromium.launch();
  try {
    const pg = await browser.newPage();
    const OK = { ok:true, kindOf:'상품요약서', co:'삼성생명', q:'종신', total:28, matched:2, items:[
      { co:'삼성생명', prod:'삼성 더착한종신보험', file:'https://pub.insure.or.kr/FileDown.do?fileNo=41117&seq=6',
        page:'https://www.samsunglife.com/p1' }] };
    let dead = false;
    await pg.route('**/api/market**', r => {
      if (r.request().url().indexOf('kind=gongsi') < 0) return r.abort();
      if (dead) return r.abort();
      r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(OK) });
    });
    await pg.goto('http://127.0.0.1:' + PORT + '/app/상담자료/미끼레이더/index.html'
      .split('/').map(encodeURIComponent).join('/').replace(/%2F/g, '/'),
      { waitUntil:'domcontentloaded', timeout:60000 });
    /* 잠금은 이제 <b>골라 쓰는 것</b>이다 — 안 걸려 있으면 그냥 열린다.
       걸려 있을 때만 푼다. 없는 것을 기다리면 여기서 20초를 버린다. */
    if (await pg.$('#lockPw')) {
      await pg.fill('#lockPw', 'test1234'); await pg.click('#lockGo');
      await pg.waitForSelector('#lockOv', { state: 'detached', timeout: 10000 });
    }
    await pg.evaluate(() => document.querySelector('.tab[data-t="promo"]').click());
    await pg.fill('#pmCo', '삼성생명'); await pg.fill('#pmName', '종신');
    await pg.click('#pmFind2');
    await pg.waitForFunction("document.querySelectorAll('#pmGs .gsrow').length>0", { timeout:10000 });
    const href = await pg.getAttribute('#pmGs .gsrow a.dl', 'href');
    is(/^https:\/\/pub\.insure\.or\.kr\/FileDown\.do/.test(href),
       '  받기 단추가 협회 직링크다 — 우리 서버를 안 탄다');
    is(await pg.getAttribute('#pmGs .gsrow a.dl', 'target') === '_blank', '  브라우저가 직접 받는다');
    const box = await pg.textContent('#pmGs');
    is(/약관 원문이 아닙니다/.test(box), '  요약서이지 약관이 아니라고 화면에도 적는다');
    is(/서재/.test(box), '  받은 파일을 서재에 넣으라고 안내한다');
    dead = true;
    await pg.fill('#pmCo', '삼성생명'); await pg.click('#pmFind2');
    await pg.waitForFunction("/공시실 바로가기/.test(document.querySelector('#pmGs').textContent)", { timeout:10000 });
    is(true, '  서버가 죽으면 늘 쓰던 공시실 바로가기로 넘긴다');

    console.log('\n[7] 이미 본 상품은 다시 모으지 않는가 — 상품명과 판(연월)까지');
    /* 회사 공시실에 들어가 보는 일은 매달 하는 일이다. 지난달에 이미 본 것을
       또 받아 읽으면 200쪽짜리를 헛읽는다.
       연도는 <b>지어내지 않는다 — 상품명 안에 이미 있다.</b> 협회가 주는 이름이
       「삼성 더착한종신보험(2608)(무배당)」 이고 그 (2608) 이 2026년 8월판이다.
       같은 이름이라도 판이 올라가면 다른 상품이다 — 사업비도 담보도 바뀐다. */
    const MANY = { ok:true, kindOf:'상품요약서', co:'삼성생명', q:'', total:3, matched:null, items:[
      { co:'삼성생명', prod:'삼성 더착한종신보험(2608)(무배당)[저해약환급금형]',
        file:'https://pub.insure.or.kr/FileDown.do?fileNo=41117&seq=6', page:'https://x/p1' },
      { co:'삼성생명', prod:'삼성 VVIP 종신보험(2608)(무배당)',
        file:'https://pub.insure.or.kr/FileDown.do?fileNo=41119&seq=6', page:'https://x/p2' },
      { co:'삼성생명', prod:'삼성 간편한 건강보험(2701)(무배당)',
        file:'https://pub.insure.or.kr/FileDown.do?fileNo=41120&seq=6', page:'https://x/p3' }] };
    const p7 = await browser.newPage();
    await p7.route('**/api/market**', r => {
      if (r.request().url().indexOf('kind=gongsi') < 0) return r.abort();
      r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(MANY) });
    });
    await p7.goto('http://127.0.0.1:' + PORT + '/app/상담자료/미끼레이더/index.html',
      { waitUntil:'domcontentloaded', timeout:60000 });
    if (await p7.$('#lockPw')) {
      await p7.fill('#lockPw','test1234'); await p7.click('#lockGo');
      await p7.waitForSelector('#lockOv',{ state:'detached', timeout:10000 });
    }
    await p7.evaluate(() => { try{localStorage.removeItem('mikki_seen')}catch(e){} });
    await p7.evaluate(() => document.querySelector('.tab[data-t="promo"]').click());

    /* 판 읽기 — 여기서 틀리면 아래가 전부 헛것이 된다 */
    const V = await p7.evaluate(() => ({
      ok:  prodVer('삼성 더착한종신보험(2608)(무배당)'),
      no:  prodVer('삼성 어쩌구보험(1234)'),          /* 34월은 없다 */
      none:prodVer('삼성 이름만있는보험'),
      base1: prodBase('삼성 더착한종신보험(2608)(무배당)[저해약환급금형]'),
      base2: prodBase('삼성 더착한종신보험(2701)(무배당)')
    }));
    is(V.ok.ver === '2608' && V.ok.y === 2026 && V.ok.mo === 8,
       '  상품명 안의 (2608) 을 2026년 8월판으로 읽는다');
    is(V.no.ver === '' && V.none.ver === '',
       '  아무 숫자나 연도로 읽지 않는다 — (1234) 는 34월이 없으므로 판이 아니다');
    is(V.base1 === V.base2 && V.base1.length > 3,
       '  판·무배당·[○○형] 을 떼면 같은 상품 줄기로 본다 (' + V.base1 + ')');

    await p7.fill('#pmCo', '삼성생명'); await p7.click('#pmFind2');
    await waitOr(p7, "document.querySelectorAll('#pmGs .gsbadge').length===3", '  목록 세 줄이 뜬다');
    const A = await p7.evaluate(() => ({
      badges: [...document.querySelectorAll('#pmGs .gsbadge')].map(x => x.textContent),
      folded: !!document.querySelector('#pmGs details')
    }));
    is(A.badges.filter(x => /새 상품/.test(x)).length === 3, '  처음에는 셋 다 「새 상품」 이다');
    is(/26년 8월판/.test(A.badges.join(' ')), '  몇 년 몇 월판인지 적어 준다');
    is(!A.folded, '  이미 본 것이 없으면 접을 것도 없다');

    /* 하나를 「봤음」 으로 적는다 = 그 상품은 다시 안 모은다 */
    await p7.evaluate(() => document.querySelectorAll('#pmGs .gsmark')[0].click());
    await waitOr(p7, "!!document.querySelector('#pmGs details')", '  「봤음」 을 누르면 접히는 자리가 생긴다');
    const B = await p7.evaluate(() => ({
      badges: [...document.querySelectorAll('#pmGs .gsbadge')].map(x => x.textContent),
      fold: (document.querySelector('#pmGs details summary') || {}).textContent || '',
      dim: !!document.querySelector('#pmGs .gsrow.seen'),
      led: Object.keys(JSON.parse(localStorage.getItem('mikki_seen') || '{}')).length
    }));
    is(B.led === 1, '  장부에 한 건이 적힌다 (' + B.led + ')');
    is(B.badges.filter(x => /이미 봤습니다/.test(x)).length === 1, '  그 줄이 「이미 봤습니다」 로 바뀐다');
    is(/이미 본 1건/.test(B.fold), '  이미 본 것은 접어 둔다 — 지우지는 않는다 (' + B.fold.trim() + ')');
    is(B.dim, '  접힌 줄은 흐리게 둔다');

    /* 판이 올라가면 다른 상품이다 */
    const C = await p7.evaluate(() => {
      seenMark('삼성생명', '삼성 간편한 건강보험(2608)(무배당)', '시험');
      return seenOf('삼성생명', '삼성 간편한 건강보험(2701)(무배당)');
    });
    is(C && C.state === 'newer' && C.old === '2608' && C.now === '2701',
       '  같은 이름이라도 판이 올라가면 <b>새 상품</b>으로 본다 (' + (C ? C.old + '→' + C.now : '못 읽음') + ')');
    await p7.click('#pmFind2');
    await waitOr(p7, "/판 올라감/.test(document.querySelector('#pmGs').textContent)", '  판이 올라간 것을 목록에 띄운다');
    const D = await p7.evaluate(() => document.querySelector('#pmGs').textContent);
    is(/판 올라감 2608 → 2701/.test(D), '  무엇이 올라갔는지 적어 준다');
    is(/모을 것/.test(D), '  몇 건을 모아야 하는지 먼저 알려 준다');

    /* 되돌릴 자리가 있어야 한다 — 잘못 적혔을 때 */
    await p7.evaluate(() => {
      const b = [...document.querySelectorAll('#pmGs .gsmark')].find(x => x.dataset.on === '1');
      if (b) b.click();
    });
    await p7.waitForTimeout(600);
    const E = await p7.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('mikki_seen') || '{}')).length);
    is(E === 1, '  손으로 「다시 보기로」 되돌릴 수 있다 (' + E + '건 남음)');

    /* 다 본 회사 */
    await p7.evaluate(() => {
      ['삼성 더착한종신보험(2608)(무배당)[저해약환급금형]','삼성 VVIP 종신보험(2608)(무배당)',
       '삼성 간편한 건강보험(2701)(무배당)'].forEach(n => seenMark('삼성생명', n, '시험'));
    });
    await p7.click('#pmFind2');
    await waitOr(p7, "/새로 모을 것이 없습니다/.test(document.querySelector('#pmGs').textContent)", '  다 본 회사에는 모을 것이 없다고 말한다');
    is(true, '  다 본 회사에는 「새로 모을 것이 없습니다」 라고 말한다 — 헛읽지 않게');

    /* 답하는 곳이 하나인가 */
    const src = fs.readFileSync(path.join(ROOT,'app/상담자료/미끼레이더/index.html'),'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g,'');
    is((code.match(/function seenOf\(/g)||[]).length === 1, '  전에 봤는지 답하는 곳은 하나다');
    is((code.match(/function prodVer\(/g)||[]).length === 1, '  판을 읽는 곳도 하나다');
    is(!/mikki_seen/.test(code.replace(/const SEEN_KEY='mikki_seen';/,'')),
       '  장부 열쇠는 한 곳에만 적혀 있다');
    await p7.close();

    console.log('\n[8] 세 단계로 풀려 있는가');
    /* 공시실에서 찾기 · 서재에서 고르기 · 발췌하기가 한 판에 섞여 있었다.
       하는 일이 다른데 나란히 놓여 있어 어디부터 시작하는지가 안 보였다. */
    const p8 = await browser.newPage();
    await p8.route('**/api/market**', r => r.abort());
    await p8.goto('http://127.0.0.1:' + PORT + '/app/상담자료/미끼레이더/index.html',
      { waitUntil:'domcontentloaded', timeout:60000 });
    if (await p8.$('#lockPw')) {
      await p8.fill('#lockPw','test1234'); await p8.click('#lockGo');
      await p8.waitForSelector('#lockOv',{ state:'detached', timeout:10000 });
    }
    await p8.evaluate(() => document.querySelector('.tab[data-t="promo"]').click());
    const S8 = await p8.evaluate(() => {
      const steps = [...document.querySelectorAll('#p-promo .stepc')];
      const inStep = (n, id) => { const e = document.getElementById(id);
        return !!(e && steps[n] && steps[n].parentNode.contains(e)); };
      return {
        n: steps.length,
        txt: steps.map(e => e.innerText.replace(/\s+/g,' ').trim()),
        s1: inStep(0,'pmCo') && inStep(0,'pmGs'),
        s2: inStep(1,'pmDocs') && inStep(1,'pmRun'),
        s3: inStep(2,'pmOut')
      };
    });
    is(S8.n === 3, '  단계가 셋이다 (' + S8.n + ')');
    is(/신상품 확인/.test(S8.txt[0]||''), '  1단계는 신상품 확인 — ' + (S8.txt[0]||''));
    is(/발췌/.test(S8.txt[1]||''), '  2단계는 약관·상품설명서 발췌');
    is(/홍보/.test(S8.txt[2]||''), '  3단계는 어떻게 홍보할까');
    is(S8.s1 && S8.s2 && S8.s3, '  각 단계 안에 그 단계의 것만 들어 있다');
    await p8.close();

    console.log('\n[9] 잠금은 골라 쓰는 것인가');
    const p9 = await browser.newPage();
    await p9.route('**/api/market**', r => r.abort());
    await p9.goto('http://127.0.0.1:' + PORT + '/app/상담자료/미끼레이더/index.html',
      { waitUntil:'domcontentloaded', timeout:60000 });
    await p9.waitForTimeout(1200);
    is(!(await p9.$('#lockPw')), '  안 걸어 두셨으면 암호를 안 묻는다 — 상담 직전에 손이 안 멈춘다');
    const L = await p9.evaluate(async () => {
      const r1 = await window.mikkiLock.on('123');          /* 너무 짧다 */
      const r2 = await window.mikkiLock.on('test1234');
      const has = window.mikkiLock.has();
      window.mikkiLock.off();
      return { short: r1.ok, on: r2.ok, has: has, off: window.mikkiLock.has() };
    });
    is(L.short === false, '  4자 미만은 안 걸린다');
    is(L.on === true && L.has === true, '  켜면 걸린다');
    is(L.off === false, '  끄면 풀린다');
    await p9.reload({ waitUntil:'domcontentloaded' }); await p9.waitForTimeout(900);
    is(!(await p9.$('#lockPw')), '  끈 뒤에는 다시 안 묻는다');
    await p9.close();

  } finally { await browser.close(); server.close(); }

  console.log('\n──────────────────────────────');
  console.log(bad ? '공시실 점검 실패 — ' + bad + '가지 어긋납니다.' : '공시실 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
