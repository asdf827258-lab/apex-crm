#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   소식 → 카드뉴스 — 길이 끊기지 않는가

   고객에게 전할 뉴스에서 기사를 고르면 인스타 캐러셀까지 한 번에
   갔습니다. 그런데 <b>정책·상품 뉴스에 올린 뒤에는 길이 끊겼습니다</b> —
   올렸다는 말만 하고 끝나서, 카드뉴스로 가려면 인스타 칸으로 옮겨 가
   제목을 손으로 다시 적어야 했습니다.

   여기서 못 박는 것은 다섯입니다.

     ① 넘기는 자리가 <b>한 곳</b>이다 (newsToCard) — 두 화면이 그 하나를
        부른다. 두 벌이 되면 한쪽만 고쳐 놓고 다 고친 줄 안다 (5번)
     ② 두 화면 모두에 <b>카드뉴스로 가는 단추</b>가 있다
     ③ 올리면 <b>그 화면으로 데려간다</b> — 말만 하고 끝나지 않는다
     ④ 넘기는 것은 <b>제목 · 갈래 · 출처</b>뿐이다. 기사 본문을 옮기지
        않는다 — 남의 글이다 (9번)
     ⑤ 주제 칸에 <b>실제로 글자가 들어간다</b> — 브라우저를 띄워 눌러 본다

   견본 기사는 <b>example.com</b> 으로 둡니다 — 실제 기사인 척하지
   않습니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8838;
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
               '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const STUB = `
window.supabase={createClient:function(){
 var mk=function(){var a={select:function(){return a},eq:function(){return a},order:function(){return a},
  limit:function(){return a},single:function(){return a},in:function(){return a},gte:function(){return a},
  lte:function(){return a},is:function(){return a},neq:function(){return a},not:function(){return a},
  range:function(){return a},insert:function(){return a},update:function(){return a},upsert:function(){return a},
  then:function(r){return Promise.resolve({data:[],error:null}).then(r)}};a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({})},getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'u1',email:'u1@example.com'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'u1'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;
function serve() {
  return http.createServer((rq, rs) => {
    const f = path.join(ROOT, decodeURIComponent(rq.url.split('?')[0].split('#')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
    rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(rs);
  }).listen(PORT);
}
const SEL = '#osLoginGate,#osGuide,[id$="Ovl"],[id$="Pop"]';
const clearOvl = pg => pg.evaluate(sel => {
  const wipe = () => document.querySelectorAll(sel).forEach(x => x.remove());
  wipe();
  if (!window.__ovlWatch) {
    window.__ovlWatch = new MutationObserver(wipe);
    window.__ovlWatch.observe(document.body, { childList: true, subtree: false });
  }
}, SEL);

/* 견본 기사 — 실제 기사인 척하지 않게 주소는 example.com */
const SEED = () => {
  NLIVE.items = [{ t: '실손보험 청구 절차 간소화 시행', s: '견본신문', d: '2026-09-10',
                   u: 'https://example.com/a1', cats: ['ins'] }];
  NLIVE.cat = 'all'; NLIVE.at = '2026-09-10 09:00';
  try { nlSave(); } catch (e) {}
};

(async () => {
  const srv = serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1280, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.addInitScript(STUB);
  await pg.addInitScript(() => { try { localStorage.setItem('apex_guide_seen_v2', '1'); } catch (e) {} });
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof newsToCard === 'function' && typeof go === 'function' &&
                                 typeof bizNewsToCard === 'function', { timeout: 60000 });
  await clearOvl(pg);

  /* ─────────────────────────────────────────────────────────── */
  head('[1] 넘기는 자리가 <b>한 곳</b>이다 (5번)');
  ['newsToCard', 'nlToCard', 'bizNewsToCard', 'nlFillTopic'].forEach(f => {
    const c = (SRC.match(new RegExp('function\\s+' + f + '\\s*\\(', 'g')) || []).length;
    is(c === 1, f + '() 가 ' + c + '곳에 있다');
  });
  const body = SRC.slice(SRC.indexOf('function nlToCard('), SRC.indexOf('function nlToCard(') + 400);
  is(/newsToCard\(/.test(body), 'nlToCard 는 <b>제 몸통을 안 갖고</b> newsToCard 를 부른다');
  const biz = SRC.slice(SRC.indexOf('function bizNewsToCard('), SRC.indexOf('function bizNewsToCard(') + 600);
  is(/newsToCard\(/.test(biz), 'bizNewsToCard 도 <b>같은 하나</b>를 부른다 — 두 벌이 아니다');
  is((SRC.match(/var BIZ_CAT_NAME\s*=/g) || []).length === 1,
     '칸 이름 표가 <b>한 곳</b>에만 있다 — 삼항 사슬로 늘어놓지 않았다');

  /* ─────────────────────────────────────────────────────────── */
  head('[2] 두 화면 모두에 <b>카드뉴스로 가는 단추</b>가 있다');
  await pg.evaluate(SEED);
  await pg.evaluate(() => go('news_live'));
  await pg.waitForSelector('.nl-item', { timeout: 20000 });
  const liveBtn = await pg.evaluate(() => {
    const b = document.querySelector('.nl-item .nl-card');
    return { there: !!b, txt: b ? b.textContent.trim() : '', w: b ? Math.round(b.getBoundingClientRect().width) : 0 };
  });
  is(liveBtn.there && liveBtn.w > 40, '고객에게 전할 뉴스 — 「' + liveBtn.txt + '」 가 보인다');

  /* 정책·상품 뉴스에 한 건 올려 두고 본다 */
  await pg.evaluate(() => {
    const list = [{ cat: 'finance', tag: '새소식', date: '2026-09-10',
                    title: '실손보험 청구 절차 간소화 시행',
                    desc: '출처: 견본신문 · 원문에서 숫자와 시행일을 확인하고 쓰세요.',
                    url: 'https://example.com/a1' }];
    bizNewsSaveAll(list, function () {});
  });
  await pg.waitForTimeout(300);
  await pg.evaluate(() => go('biz_news'));
  await pg.waitForSelector('.biz-news-item', { timeout: 20000 });
  const bizBtn = await pg.evaluate(() => {
    const b = document.querySelector('.biz-news-item .biz-news-card');
    return { there: !!b, txt: b ? b.textContent.trim() : '', w: b ? Math.round(b.getBoundingClientRect().width) : 0 };
  });
  is(bizBtn.there && bizBtn.w > 40, '정책·상품 뉴스 — 「' + bizBtn.txt + '」 가 보인다 (이 자리가 비어 있었다)');

  /* ─────────────────────────────────────────────────────────── */
  head('[3] 넘기는 것은 <b>제목 · 갈래 · 출처</b>뿐이다 (9번)');
  const topic = await pg.evaluate(() => {
    let went = '';
    const realGo = window.go;
    window.go = function (t) { went = t; };            /* 화면은 안 옮기고 무엇을 담는지만 본다 */
    bizNewsToCard(0);
    window.go = realGo;
    let t = '';
    try { t = sessionStorage.getItem('apex_nl_topic') || ''; } catch (e) {}
    return { t: t, went: went };
  });
  is(/실손보험 청구 절차 간소화 시행/.test(topic.t), '<b>제목이 그대로</b> 실린다');
  is(/견본신문/.test(topic.t), '<b>출처가 같이</b> 간다 — 원문을 확인할 수 있어야 한다');
  is(/금융·보험/.test(topic.t), '<b>갈래 이름</b>이 붙는다 — desc 의 「출처:」 에서 되찾아 온다');
  is(!/원문에서 숫자와 시행일을 확인하고/.test(topic.t),
     '거들어 둔 안내 문구는 <b>안 따라간다</b> — 주제가 아니라 우리 메모다');
  is(topic.went === 'insta', '누르면 <b>인스타 칸으로</b> 간다 — ' + topic.went);

  /* ─────────────────────────────────────────────────────────── */
  head('[4] 올리면 <b>그 화면으로 데려간다</b>');
  const toBiz = SRC.slice(SRC.indexOf('function nlToBiz('), SRC.indexOf('function nlToBiz(') + 1400);
  is(/go\('biz_news'\)/.test(toBiz), '올린 뒤 <b>정책·상품 뉴스로 데려간다</b> — 말만 하고 끝나지 않는다');
  is(/카드뉴스로/.test(toBiz), '올린 뒤 <b>다음에 뭘 누르면 되는지</b> 알려 준다');

  /* ─────────────────────────────────────────────────────────── */
  head('[5] 주제 칸에 <b>실제로 글자가 들어간다</b>');
  await pg.evaluate(() => { try { sessionStorage.removeItem('apex_nl_topic'); } catch (e) {} });
  await clearOvl(pg);
  await pg.evaluate(() => bizNewsToCard(0));
  await pg.waitForSelector('#istudio_topic', { timeout: 20000 });
  await pg.waitForFunction(() => {
    const el = document.getElementById('istudio_topic');
    return !!(el && el.value && el.value.length > 5);
  }, { timeout: 20000 });
  const filled = await pg.evaluate(() => (document.getElementById('istudio_topic') || {}).value || '');
  is(/실손보험 청구 절차 간소화 시행/.test(filled),
     '인스타 <b>주제 칸이 저절로 채워졌다</b> — 「' + filled.slice(0, 32) + '…」');
  is(filled.length > 20, '손으로 다시 적을 것이 <b>없다</b>');

  head('[6] 이 길을 도는 동안 <b>터진 곳이 없다</b>');
  const real = errs.filter(x => !/favicon|net::ERR|Failed to load resource|ERR_FAILED/i.test(x));
  is(real.length === 0, '콘솔 에러 0건' + (real.length ? ' — ' + real.slice(0, 3).join(' / ') : ''));

  await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ 소식 → 카드뉴스 — ' + bad + '/' + n + ' 자리가 막혔습니다'
                          : '✓ 소식 → 카드뉴스 — ' + n + '자리 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
