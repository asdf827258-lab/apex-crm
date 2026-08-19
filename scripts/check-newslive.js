/* 고객에게 전할 뉴스 — 여섯 칸으로 나뉘고, 정책·상품 뉴스와 이어지는가.

   미끼 레이더에 붙인 서버 창구(/api/market?kind=news)가 잘 돈다. 그 창구는
   config/sources.json 의 칸을 그대로 읽으므로, 칸을 늘리면 그만큼 더 온다.

   여기서는 그것을 <b>고객에게 보낼 수 있는 모양</b>으로 바꾼 자리를 본다.

     1. 메뉴에 있고 열리는가
     2. 서버를 부를 때 늘린 다섯 칸(보험·경제·부동산·생활정책·정책자금)을 다 부르는가
     3. 기사가 낱말대로 여섯 칸에 제대로 들어가는가
        — 「종부세」 처럼 두 칸에 걸치는 것은 두 칸 다 들어가는가
     4. 어느 칸에도 안 걸린 기사는 버리되, <b>몇 건 버렸는지 말하는가</b>
     5. 보낼 문구가 고객 이름 없이, 제목과 주소만으로 만들어지는가
        — 본문을 옮기면 저작권 문제가 된다
     6. 정책·상품 뉴스 화면에서도 같은 것이 보이고, 거기서 이 화면으로 오는가
     7. 401 · 함수 없음 · 0건에서 조용히 끝나지 않고 이유를 말하는가
     8. 미끼상품&접촉전략이 상담 도구에 붙어 열리는가                    */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const TOKEN = 'test-shared-token';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
const APP_HTML = '<!doctype html><html><head><title>APEX YUN PRO</title></head><body>앱 첫 화면</body></html>';

/* 칸마다 하나씩 + 두 칸에 걸치는 것 + 아무 칸에도 안 드는 것 */
const NEWS = [
  { title: '금감원, 실손보험 청구 간소화 시행령 확정', link: 'https://x/1', date: '2026-08-15', source: '보험신문', desc: '' },
  { title: '수도권 아파트 청약 경쟁률 다시 두 자릿수', link: 'https://x/2', date: '2026-08-15', source: '한국경제 부동산', desc: '' },
  { title: '연말정산 세액공제 한도 상향 추진', link: 'https://x/3', date: '2026-08-14', source: '연합뉴스 경제', desc: '' },
  { title: '청년 월세 지원금 신청 기간 연장', link: 'https://x/4', date: '2026-08-14', source: '연합뉴스 사회', desc: '' },
  { title: '한은 기준금리 동결…환율 변동성 확대', link: 'https://x/5', date: '2026-08-13', source: '매일경제 경제', desc: '' },
  { title: '종부세 과세 기준 완화안 국회 제출', link: 'https://x/6', date: '2026-08-13', source: '연합뉴스 정치', desc: '' },
  { title: '소상공인 정책자금 500억 추가 공모…다음 달 접수', link: 'https://x/9', date: '2026-08-13', source: '연합뉴스 산업', desc: '' },
  { title: '프로야구 흥행 신기록…관중 1천만 돌파', link: 'https://x/7', date: '2026-08-12', source: '연합뉴스 사회', desc: '' },
  { title: '가을 단풍 절정 시기 예보', link: 'https://x/8', date: '2026-08-12', source: '연합뉴스 사회', desc: '' }
];

let MODE = 'ok';
let seen = null;

const srv = http.createServer((rq, rs) => {
  const u = url.parse(rq.url);
  const p = decodeURIComponent(u.pathname);

  if (p === '/api/market') {
    seen = { query: u.query || '', token: rq.headers['x-app-token'] || '' };
    const j = (o, code) => { rs.writeHead(code || 200, { 'Content-Type': 'application/json; charset=utf-8' });
                             rs.end(JSON.stringify(o)); };
    if (MODE === 'nofunc') { rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); rs.end(APP_HTML); return; }
    if (seen.token !== TOKEN) return j({ ok: false, message: '토큰이 올바르지 않습니다.' }, 401);
    if (MODE === 'empty') return j({ ok: true, news: [], keywords: [], cats: [] });
    return j({ ok: true, news: NEWS, keywords: [], cats: ['경제', '보험', '부동산', '생활정책', '정책자금'] });
  }

  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    const idx = path.join(f, 'index.html');
    if (fs.existsSync(idx)) f = idx;
    else { rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); rs.end(APP_HTML); return; }
  }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 앱은 켜질 때 APEX_CONFIG.appToken 을 이 기기에 심는다. 시험 서버가 아는
   값으로 바꿔 둬야 401 이 아니라 진짜 응답을 받는다. */
const STUB = t => {
  localStorage.setItem('apex_studio_apptoken', t);
  window.getAppToken = function () { return t; };
  /* 로그인 없이 여는 시험이라 요금제 문이 닫혀 있다. 이 화면의 요금제
     구분(ak)이 정책·상품 뉴스와 같은지는 [1] 에서 따로 본다.        */
  window.osTabAllowed = function () { return true; };
};

/* 「모으는 중…」 이 끝날 때까지 */
async function settle(page) {
  await page.waitForFunction(() => typeof NLIVE !== 'undefined' && !NLIVE.busy, null, { timeout: 20000 });
}

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto(base + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, { timeout: 30000 });
  await page.evaluate(STUB, TOKEN);

  console.log('\n[1] 메뉴에 있고, 열린다');
  const menu = await page.evaluate(() => {
    let hit = null, grp = '', talk = null, tgrp = '';
    TABS.forEach(g => (g.items || []).forEach(it => {
      if (it.id === 'news_live') { hit = it; grp = g.group; }
      if (it.id === 'mikki_talk') { talk = it; tgrp = g.group; }
    }));
    return { hit, grp, talk, tgrp };
  });
  is(!!menu.hit && menu.grp === '콘텐츠 제작',
     '「' + (menu.hit ? menu.hit.title : '?') + '」 가 ' + menu.grp + ' 칸에 있다');
  is(!!menu.hit && menu.hit.ak === '콘텐츠·마케팅', '  요금제 구분(ak)이 정책·상품 뉴스와 같다 — ' + (menu.hit || {}).ak);

  await page.evaluate(() => go('news_live'));
  await settle(page);
  const head = await page.evaluate(() => ({
    title: (document.querySelector('.page-title') || {}).textContent || '',
    chips: !!document.getElementById('nlChips'),
    body: !!document.getElementById('nlBody')
  }));
  is(/전할 뉴스/.test(head.title), '  화면이 열린다 — ' + head.title.trim());
  is(head.chips && head.body, '  칸 고르는 줄과 목록이 다 있다');

  console.log('\n[2] 들어가면 스스로 부르고, 늘린 칸을 다 부른다');
  is(seen && seen.token === TOKEN, '  X-App-Token 을 붙여 보낸다');
  const q = seen ? decodeURIComponent(seen.query) : '';
  ['보험', '경제', '부동산', '생활정책', '정책자금'].forEach(c =>
    is(q.indexOf(c) >= 0, '  ' + c + ' 칸을 부른다'));

  console.log('\n[3] 낱말대로 여섯 칸에 들어간다');
  const g = await page.evaluate(() => {
    const by = {};
    NLIVE.items.forEach(it => (it.cats || []).forEach(c => { (by[c] = by[c] || []).push(it.t); }));
    const jeonbu = NLIVE.items.filter(x => /종부세/.test(x.t))[0];
    return { by, n: NLIVE.items.length, got: NLIVE.got, drop: NLIVE.drop,
             jeonbu: jeonbu ? jeonbu.cats : null,
             cats: NL_CATS.map(c => c.id) };
  });
  /* 「정책자금·사업자」 를 더해 여섯 칸이 됐다. 사업자 고객에게는 보험보다
     자금 이야기로 문이 먼저 열리는데, 보험 칸에 섞어 두면 묻힌다. */
  is(g.cats.join(',') === 'ins,realty,tax,help,fund,econ',
    '  칸이 여섯이다 — ' + g.cats.join(' · '));
  is(g.cats.indexOf('fund') >= 0, '  「정책자금·사업자」 칸이 있다');
  is((g.by.ins || []).some(t => /실손/.test(t)), '  실손 기사가 보험 칸에 — ' + (g.by.ins || [])[0]);
  is((g.by.realty || []).some(t => /청약/.test(t)), '  청약 기사가 부동산 칸에');
  is((g.by.tax || []).some(t => /연말정산/.test(t)), '  연말정산 기사가 세금 칸에');
  is((g.by.help || []).some(t => /월세 지원금/.test(t)), '  지원금 기사가 지원금·혜택 칸에');
  is((g.by.fund || []).some(t => /정책자금|소상공인/.test(t)),
    '  정책자금 기사가 정책자금·사업자 칸에 — ' + ((g.by.fund || [])[0] || '(없음)'));
  is((g.by.econ || []).some(t => /기준금리/.test(t)), '  기준금리 기사가 경제 칸에');
  is(!!g.jeonbu && g.jeonbu.indexOf('tax') >= 0 && g.jeonbu.indexOf('realty') >= 0,
     '  「종부세」 는 세금·부동산 두 칸에 다 들어간다 — ' + (g.jeonbu || []).join(', '));

  console.log('\n[4] 안 걸린 기사는 버리되, 버린 수를 말한다');
  is(g.got === 9 && g.n === 7 && g.drop === 2,
     '  9건 받아 7건 남기고 2건 버렸다 — 받음 ' + g.got + ' · 남김 ' + g.n + ' · 버림 ' + g.drop);
  const said = await page.evaluate(() => (document.getElementById('nlHead') || {}).textContent || '');
  is(/버렸/.test(said) && /2건/.test(said), '  화면에 몇 건 버렸는지 적혀 있다 — 조용히 줄이지 않는다');
  const noSport = await page.evaluate(() => NLIVE.items.every(x => !/프로야구|단풍/.test(x.t)));
  is(noSport, '  야구·단풍 기사는 안 들어온다 (고객에게 전할 것이 아니다)');

  console.log('\n[5] 보낼 문구 — 이름 없이, 제목과 주소만');
  const msg = await page.evaluate(() => nlMsg(0));
  is(/고객님/.test(msg), '  「고객님」 으로 나간다 (실명이 안 들어간다)');
  is(msg.indexOf('https://x/') >= 0, '  원문 주소가 들어 있다');
  const one = await page.evaluate(() => NLIVE.items[0].t);
  is(msg.indexOf(one) >= 0, '  제목이 그대로 들어 있다');
  is(!/desc|본문|요약/.test(msg), '  기사 본문은 안 옮긴다');

  console.log('\n[6] 정책·상품 뉴스와 이어진다');
  await page.evaluate(() => go('biz_news'));
  await page.waitForTimeout(500);
  const biz = await page.evaluate(() => {
    const b = document.getElementById('bnLiveBox');
    return { has: !!b, txt: b ? b.textContent.replace(/\s+/g, ' ') : '',
             link: b ? /news_live/.test(b.innerHTML) : false };
  });
  is(biz.has, '  정책·상품 뉴스 안에 「오늘 들어온 뉴스」 판이 있다');
  is(/실손|청약|연말정산|종부세|기준금리|지원금/.test(biz.txt),
     '  모아 둔 기사가 거기서도 보인다 — ' + biz.txt.slice(0, 46));
  is(biz.link, '  거기서 다섯 칸 화면으로 넘어가는 단추가 있다');

  console.log('\n[7] 안 될 때 조용히 끝나지 않는다');
  await page.evaluate(() => { NLIVE.items = []; NLIVE.at = ''; NLIVE.err = ''; nlSave(); });
  MODE = 'nofunc';
  await page.evaluate(() => go('news_live'));
  await settle(page);
  let err = await page.evaluate(() => NLIVE.err);
  is(/api\/market/.test(err) && /배포/.test(err), '  함수가 없는 배포에서 이유를 말한다 — ' + err.slice(0, 42));
  is(!/JSON|Unexpected|SyntaxError/i.test(err), '  영어 오류를 그대로 던지지 않는다');

  MODE = 'ok';
  await page.evaluate(() => { window.getAppToken = function () { return 'wrong-token'; }; NLIVE.err = ''; });
  await page.evaluate(() => nlPull());
  await settle(page);
  err = await page.evaluate(() => NLIVE.err);
  is(/공유 토큰/.test(err), '  토큰이 틀리면 어디를 고치면 되는지 말한다 — ' + err.slice(0, 46));

  await page.evaluate(t => { window.getAppToken = function () { return t; }; }, TOKEN);
  MODE = 'empty';
  await page.evaluate(() => { NLIVE.err = ''; nlPull(); });
  await settle(page);
  err = await page.evaluate(() => NLIVE.err);
  is(/없습니다/.test(err), '  0건이면 0건이라고 말한다 — ' + err.slice(0, 34));
  const alive = await page.evaluate(() => !document.querySelector('.nl-head button').disabled);
  is(alive, '  실패한 뒤에도 단추가 다시 눌린다');

  console.log('\n[8] 미끼상품&접촉전략 — 상담 도구에서 열린다');
  is(!!menu.talk && menu.tgrp === '상담 도구',
     '  「' + (menu.talk ? menu.talk.title : '?') + '」 가 ' + menu.tgrp + ' 칸에 있다');
  await page.evaluate(() => go('mikki_talk'));
  await page.waitForTimeout(900);
  const talk = await page.evaluate(() => {
    const f = document.getElementById('mkTalkFrame');
    return { full: document.body.classList.contains('mktalk-mode'),
             src: f ? (f.getAttribute('src') || '') : '',
             others: ['finance-mode', 'crm-mode', 'sangdam-mode', 'fpdeck-mode', 'fptalk-mode',
                      'mikki-mode', 'yoonsi-mode'].filter(c => document.body.classList.contains(c)),
             listed: OS_FULL_MODES.indexOf('mktalk-mode') >= 0 };
  });
  is(talk.full, '  전체화면으로 열린다');
  is(/미끼상품_접촉전략\.html/.test(talk.src), '  그 문서를 물린다 — ' + talk.src);
  is(talk.listed && talk.others.length === 0, '  다른 전체화면이 위에 겹치지 않는다');
  const fr = await (await page.waitForSelector('#mkTalkFrame')).contentFrame();
  await fr.waitForFunction(() => /미끼상품/.test(document.title), null, { timeout: 20000 });
  const doc = await fr.evaluate(() => ({
    title: document.title,
    parts: document.querySelectorAll('h2').length,
    len: (document.body.innerText || '').replace(/\s+/g, '').length
  }));
  is(doc.parts >= 20, '  장이 ' + doc.parts + '개 들어 있다');
  is(doc.len > 20000, '  글이 ' + doc.len + '자 들어 있다');
  await page.evaluate(() => exitMkTalk());
  await page.waitForTimeout(400);
  is(await page.evaluate(() => !document.body.classList.contains('mktalk-mode')), '  뒤로 나오면 닫힌다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '전할 뉴스 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '전할 뉴스 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
