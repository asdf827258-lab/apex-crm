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
    await pg.waitForSelector('#lockPw', { timeout:20000 });
    await pg.fill('#lockPw', 'test1234'); await pg.click('#lockGo');
    await pg.waitForSelector('#lockOv', { state:'detached', timeout:10000 });
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
  } finally { await browser.close(); server.close(); }

  console.log('\n──────────────────────────────');
  console.log(bad ? '공시실 점검 실패 — ' + bad + '가지 어긋납니다.' : '공시실 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
