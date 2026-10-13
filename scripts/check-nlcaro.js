#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   「이 소식 → 캐러셀」 단추 — 이름이 한 곳에서 오고, 맨 왼쪽에서 강조되나

   사장님 말씀 (2026-10-13):
     「고객에게 전할 뉴스 들어가면, 정책상품 뉴스에 올리기, 이걸
      [캐러셀로 제작하기] 맨왼쪽 강조버튼으로 만들어서 세팅해」

   ★★ 손대기 전에 재어 보니 <b>같은 일을 하는 단추가 네 자리에 네 이름</b>으로
   있었습니다 —

     고객에게 전할 뉴스   「🎨 이 소식으로 카드뉴스」  평상 단추 · 둘째
     정책·상품 뉴스       「🎨 카드뉴스로」            강조 · 맨 왼쪽
     오늘 ⑤ SNS 캐러셀    「🎨 캐러셀 만들기」         강조 · 맨 왼쪽
     홈 인스타 칸         「🎨 카드뉴스로」            평상 단추 · 둘째

   한 화면만 보면 말이 되는데, 사장님은 네 화면을 오가며 쓰십니다 —
   같은 단추를 <b>세 이름</b>으로 찾으셔야 했습니다. 그리고 이름을 바꾸려면
   네 곳을 다 찾아야 하니, 한 곳만 고치고 나머지가 낡습니다 (5번).

   여기서 못 박는 것은 일곱입니다.

     ① 이름을 아는 곳이 <b>하나</b>다 — nlCardName() · 꼴은 nlCardBtn()
     ② 네 자리가 <b>그 하나를 부른다</b> — 손으로 쓴 캐러셀 단추가 없다
     ③ 고객에게 전할 뉴스에서 <b>맨 왼쪽 · 강조</b>이고, 그 줄의 강조는
        <b>하나</b>다 (둘이면 강조가 아니다)
     ④ <b>길을 지우지 않았다</b> (6번) — 보낼 문구 복사 · 원문 · 정책·상품
        뉴스에 올리기 셋이 그대로 선다. 팀원에게도 <b>강조 단추는 선다</b>
     ⑤ 눌러 보면 <b>정말</b> 인스타 칸이 서고 기사 제목이 주제로 들어간다
     ⑥ 올린 뒤 알려 주는 글이 <b>지금 이름</b>을 말한다 — 글자를 박아 두면
        이름을 바꿀 때 그 글만 낡는다
     ⑦ <b>점검들도 이름을 박아 두지 않았다</b> (8번) — 2026-10-13 에
        check-msfive 가 「캐러셀 만들기」 를 박아 두고 있었습니다. 이름이
        바뀌면 그 줄은 <b>아무것도 재지 않는 줄</b>이 됩니다(없는 글자를
        「없다」 고 확인하니 늘 초록). 자는 앱에 물어서 써야 합니다.

   견본 기사는 <b>example.com · 견본신문</b> 으로 둡니다 — 실제 기사인 척
   하지 않습니다 (9번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8871;
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
    /* ⚠ 고객에게 전할 뉴스를 열면 앱이 /api/market 창구를 부릅니다 — 토막 서버에
       그 창구가 없으면 콘솔에 404 가 찍히고, 그것을 「앱이 터졌다」 로 읽으면
       헛 빨간불입니다. 거르개를 넓히는 대신 <b>창구를 빈손으로 답하게</b>
       둡니다 — 기사는 아래 견본으로 넣습니다. 진짜 서버로는 한 번도 안 나갑니다
       (route 가 127.0.0.1 밖을 다 끊습니다 · 7번). */
    if (rq.url.indexOf('/api/') === 0) {
      rs.writeHead(200, { 'Content-Type': 'application/json' });
      rs.end('{"ok":true,"news":[]}');
      return;
    }
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

/* 견본 기사 둘 — 실제 기사인 척하지 않게 example.com */
const SEED = () => {
  window.bizNewsCanEdit = function () { return true; };      /* 대표로 본다 */
  NLIVE.items = [
    { t: '실손보험 청구 절차 간소화 시행', s: '견본신문', d: '2026-09-10',
      u: 'https://example.com/a1', cats: ['ins'] },
    { t: '전세 대출 금리 기준 변경', s: '견본신문', d: '2026-09-11',
      u: 'https://example.com/a2', cats: ['realty'] }
  ];
  NLIVE.cat = 'all'; NLIVE.at = '2026-09-11 09:00';
  try { nlSave(); } catch (e) {}
};
/* 한 기사의 단추 줄을 그대로 읽어 온다 */
const ROW = () => {
  const it = document.querySelector('.nl-item');
  const b = it ? it.querySelector('.nl-b') : null;
  if (!b) return null;
  const kids = [].slice.call(b.children);
  return {
    글: kids.map(x => (x.textContent || '').trim()),
    꼴: kids.map(x => (x.className || '')),
    첫글: kids.length ? (kids[0].textContent || '').trim() : '',
    첫강조: kids.length ? /\bbtn-primary\b/.test(kids[0].className || '') : false,
    강조수: kids.filter(x => /\bbtn-primary\b/.test(x.className || '')).length,
    손잡이: !!it.querySelector('.nl-b > .nl-card'),
    폭: kids.length ? Math.round(kids[0].getBoundingClientRect().width) : 0
  };
};

(async () => {
  const srv = serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.addInitScript(STUB);
  await pg.addInitScript(() => { try { localStorage.setItem('apex_guide_seen_v2', '1'); } catch (e) {} });
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof go === 'function' && typeof nlItemsHtml === 'function' &&
                                 typeof nlCardName === 'function' && typeof nlCardBtn === 'function',
                           { timeout: 60000 });
  await clearOvl(pg);

  /* ─────────────────────────────────────────────────────────── */
  head('[1] 이름을 아는 곳이 <b>하나</b>다 (5번)');
  ['nlCardName', 'nlCardBtn'].forEach(f => {
    const c = (SRC.match(new RegExp('function\\s+' + f + '\\s*\\(', 'g')) || []).length;
    is(c === 1, f + '() 가 ' + c + '곳에 있다');
  });
  const NAME = await pg.evaluate(() => nlCardName());
  is(!!NAME && NAME.length > 2 && !/undefined/.test(NAME),
     '앱이 내놓는 이름이 <b>온전하다</b> — 「' + NAME + '」');
  /* ⚠ 쪽지(APP_BUILD_NOTE)는 <b>이번 판에 무엇이 바뀌었나</b>를 사장님께 알리는
     글이라 단추 이름을 그대로 적는 것이 맞습니다 — 두 번째 임자가 아닙니다.
     쪽지 줄은 <b>걷어 내고</b> 셉니다. (판 X97 에서도 제 쪽지가 제 자의
     「옮겨 적지 않았나」 가정을 걸어 같은 자리를 걷었습니다. 쪽지는 PR 마다
     새로 쓰므로 낡을 자리가 아닙니다 · CLAUDE.md 6번)                      */
  const 걷은본체 = SRC.split('\n').filter(l => !/^var APP_BUILD/.test(l)).join('\n');
  is(걷은본체.split(NAME).length - 1 === 1,
     '그 이름 글자가 <b>코드에 한 번만</b> 있다 — 옮겨 적은 자리가 없다');
  /* ★ 이름을 내놓는 자리도 하나 — nlCardBtn 만 nlCardName() 을 찍는다 */
  const btnFn = SRC.slice(SRC.indexOf('function nlCardBtn('), SRC.indexOf('function nlCardBtn(') + 500);
  is((btnFn.match(/nlCardName\(\)/g) || []).length === 1,
     'nlCardBtn 이 그 이름을 <b>한 번</b> 찍는다');
  /* ⚠ var 로 두면 그 줄이 돌기 전에 그리는 자리에서 undefined 가 찍힙니다 (판 X99) */
  is(/function\s+nlCardName\s*\(/.test(SRC) && !/var\s+NL_CARD_T/.test(SRC),
     '이름을 <b>함수</b>로 둔다 — var 는 끌어올려도 값이 안 서서 undefined 가 찍힌다');

  /* ─────────────────────────────────────────────────────────── */
  head('[2] 네 자리가 <b>그 하나를 부른다</b> (5번)');
  const 부르는수 = (SRC.match(/nlCardBtn\(\s*'/g) || []).length;
  is(부르는수 >= 4, '네 자리 이상이 nlCardBtn 을 부른다 — ' + 부르는수 + '곳');
  [['nlItemsHtml', '고객에게 전할 뉴스'], ['bizNewsExtraHtml', '정책·상품 뉴스'],
   ['hmIgHtml', '홈 인스타 칸']].forEach(([f, 름]) => {
    const i = SRC.indexOf('function ' + f + '(');
    const blk = i < 0 ? '' : SRC.slice(i, i + 3000);
    is(/nlCardBtn\(/.test(blk), '  ' + 름 + ' 이 부른다');
  });
  /* 오늘 ⑤ 는 표 안의 함수라 function 선언이 아니다 — sns: 토막에서 본다 */
  const sns = SRC.slice(SRC.indexOf(' sns:function()'), SRC.indexOf(' sns:function()') + 1400);
  is(/nlCardBtn\(/.test(sns), '  오늘 ⑤ SNS 캐러셀 이 부른다');
  /* ★★ 손으로 쓴 캐러셀 단추가 없다 — 있으면 이름을 바꿀 때 그 하나가 낡는다 */
  is(!/<button[^>]*nlToCard\(/.test(SRC) && !/<button[^>]*bizNewsToCard\(/.test(SRC),
     '<b>손으로 쓴</b> 캐러셀 단추가 한 곳도 없다');

  /* ─────────────────────────────────────────────────────────── */
  head('[3] 고객에게 전할 뉴스 — <b>맨 왼쪽 · 강조</b> (사장님 말씀)');
  await pg.evaluate(() => go('news_live'));
  await pg.waitForTimeout(500);
  await pg.evaluate(SEED);
  await pg.evaluate(() => nlPaint());
  await pg.waitForSelector('.nl-item .nl-b', { timeout: 20000 });
  const r = await pg.evaluate(ROW);
  is(!!r, '단추 줄이 선다');
  is(r && r.첫글 === NAME, '  <b>맨 왼쪽</b>이 그 단추다 — 「' + (r ? r.첫글 : '') + '」');
  is(r && r.첫강조, '  그 단추가 <b>강조</b>다 (btn-primary)');
  is(r && r.강조수 === 1, '  그 줄의 강조는 <b>하나</b>다 — ' + (r ? r.강조수 : '?') + '개');
  is(r && r.폭 > 40, '  눌릴 만큼 <b>보인다</b> — ' + (r ? r.폭 : 0) + 'px');
  is(r && r.손잡이, '  nl-card 손잡이가 그 줄에 있다 — check-newscard 가 이것으로 찾는다');

  /* ─────────────────────────────────────────────────────────── */
  head('[4] <b>길을 지우지 않았다</b> (6번)');
  const 글 = r ? r.글.join(' | ') : '';
  is(/보낼 문구/.test(글), '  💬 보낼 문구 복사 가 그대로 선다');
  is(/원문/.test(글), '  원문 ↗ 이 그대로 선다');
  is(/정책·상품 뉴스에 올리기/.test(글), '  📰 정책·상품 뉴스에 올리기 가 그대로 선다');
  console.log('      ' + 글);
  /* 팀원에게는 올리기가 안 서는 것이 맞다 — 그래도 <b>강조 단추는 선다</b> */
  const t = await pg.evaluate(() => {
    window.bizNewsCanEdit = function () { return false; };
    nlPaint();
    const it = document.querySelector('.nl-item'), b = it ? it.querySelector('.nl-b') : null;
    const kids = b ? [].slice.call(b.children) : [];
    return { 글: kids.map(x => (x.textContent || '').trim()).join(' | '),
             첫글: kids.length ? (kids[0].textContent || '').trim() : '',
             강조수: kids.filter(x => /\bbtn-primary\b/.test(x.className || '')).length };
  });
  is(!/정책·상품 뉴스에 올리기/.test(t.글), '  팀원에게는 올리기가 <b>안 선다</b> — 대표만 올립니다');
  is(t.첫글 === NAME && t.강조수 === 1, '  팀원에게도 <b>맨 왼쪽 강조</b>는 그대로 — ' + t.첫글);
  await pg.evaluate(() => { window.bizNewsCanEdit = function () { return true; }; nlPaint(); });

  /* ─────────────────────────────────────────────────────────── */
  head('[5] 눌러 보면 <b>정말</b> 캐러셀로 간다');
  const go1 = await pg.evaluate(() => {
    let went = '';
    const real = window.go; window.go = function (x) { went = x; };
    try { sessionStorage.removeItem('apex_nl_topic'); } catch (e) {}
    const it = document.querySelector('.nl-item'), b = it ? it.querySelector('.nl-b') : null;
    if (b && b.children[0]) b.children[0].click();
    window.go = real;
    let topic = ''; try { topic = sessionStorage.getItem('apex_nl_topic') || ''; } catch (e) {}
    return { went: went, topic: topic };
  });
  /* ★ 2026-10-13 · 캐러셀은 「📅 오늘의 카드뉴스」 입니다 (사장님 바로잡음) */
  is(go1.went === 'biz_news', '  누르면 <b>오늘의 카드뉴스</b>로 간다 — ' + go1.went);
  is(/실손보험 청구 절차 간소화 시행/.test(go1.topic), '  <b>기사 제목</b>이 주제로 들어간다');
  is(/견본신문/.test(go1.topic), '  <b>출처</b>도 같이 간다 — 원문을 확인할 수 있어야 한다');

  /* ─────────────────────────────────────────────────────────── */
  head('[6] 올린 뒤 알려 주는 글이 <b>지금 이름</b>을 말한다');
  const toBiz = SRC.slice(SRC.indexOf('function nlToBiz('), SRC.indexOf('function nlToBiz(') + 1600);
  /* ⚠ 함수 토막 전체에서 nlCardName() 을 찾으면 <b>주석에 적힌 것</b>에도 걸립니다 —
     되돌림 ⑦(토스트에 이름을 박음)에서 그 토막의 주석이 「이름은 nlCardName() 한
     곳에서 옵니다」 라고 적고 있어 <b>거짓으로 통과</b>했습니다. 알리는 글 그 줄에서만
     봅니다 (8번).                                                            */
  const 알림줄 = (toBiz.match(/toast\([^\n]*올렸습니다[^\n]*\);/) || [''])[0];
  is(!!알림줄, '  올린 뒤 <b>알려 주는 글</b>이 있다');
  is(/nlCardName\(\)/.test(알림줄), '  그 글이 <b>이름 임자를 부른다</b> — 글자를 박아 두지 않았다');

  /* ─────────────────────────────────────────────────────────── */
  head('[7] <b>점검들도</b> 이름을 박아 두지 않았다 (8번)');
  /* ⚠ 머리글(주석)에 적힌 옛 이름은 역사라 안 셉니다 — 재는 줄에 박혔는지만 봅니다 */
  const 걷기 = s => s.replace(/^\s*\/\*[\s\S]*?\*\/\s*$/m, ' ')
                     .split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
  const 박은자 = fs.readdirSync(path.join(ROOT, 'scripts'))
    .filter(f => /^check-.*\.js$/.test(f))
    .filter(f => 걷기(fs.readFileSync(path.join(ROOT, 'scripts', f), 'utf8')).indexOf(NAME) >= 0);
  is(박은자.length === 0,
     '어느 자도 이름 글자를 <b>재는 줄에 박아 두지 않았다</b>' +
     (박은자.length ? ' ← ' + 박은자.join(' · ') : '') + ' — 앱에 nlCardName() 으로 묻습니다');

  /* ─────────────────────────────────────────────────────────── */
  head('[8] 조용한가');
  const 시끄 = errs.filter(e => !/favicon|net::ERR|Failed to fetch|abort/i.test(e));
  is(시끄.length === 0, '콘솔 에러 ' + 시끄.length + '건' + (시끄.length ? ' ← ' + 시끄[0] : ''));
  is(!/undefined/.test(글), '단추 글에 <b>undefined</b> 가 없다');

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '자리 — 위를 보십시오 (' + n + '가지 중)'); process.exit(1); }
  console.log('✓ 캐러셀 단추 — 이름은 한 곳에서 오고, 맨 왼쪽에서 강조됩니다 (' + n + '자리).');
})();
