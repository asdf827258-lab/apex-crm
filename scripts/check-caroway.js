#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   캐러셀로 가는 길 — 이름이 가리키는 데로 정말 가나

   사장님 바로잡음 (2026-10-13):
     「캐러셀은 저거랑 다르다 정책상품뉴스 맨위에 있던게 캐러셀이야」

   ★★ 판 X100 에서 제가 단추 이름을 「🎨 캐러셀로 제작하기」 로 지어 놓고
   <b>인스타 디자인 스튜디오</b>로 보냈습니다. 이름이 캐러셀인데 캐러셀이
   아닌 데로 갔으니 <b>이름이 거짓말</b>을 하고 있었습니다 (1번).
   진짜 캐러셀은 <b>정책·상품 뉴스 맨 위</b>의 「📅 오늘의 카드뉴스」 —
   8~10장 기획 · 장별 사진 · 1080×1350 저장 — 이고 입력 칸은 #cnAiTopic 입니다.

   여기서 못 박는 것은 여섯입니다.

     ① 넘기는 자리는 <b>한 곳</b>(newsToCard)이고 <b>biz_news</b> 로 간다
     ② 넘어온 주제가 <b>캐러셀 칸</b>(#cnAiTopic)에 실제로 담긴다 —
        제목 · 갈래 · 출처가 다 실린다
     ③ <b>기사 본문은 안 옮긴다</b>(9번) — 그리고 적게 보낸 것을 많이 보낸
        척하지 않고 「제목과 출처만 옮겼습니다」 라고 <b>말해 준다</b> (1번)
     ④ 캐러셀 단추 이름을 아는 곳이 <b>하나</b>다 — 실패 뒤 되돌릴 때
        <b>딴 이름</b>으로 바뀌지 않는다 (판 X101 전에는 섰을 때
        「AI로 캐러셀 만들기」, 실패 뒤 「AI로 8~10장 만들기」 였다 · 5번)
     ⑤ 실패를 <b>사람 말</b>로 적는다 — 서버 날글만 찍지 않고 <b>다음 걸음</b>을
        적는다(「생성 실패: no」 가 실제로 사장님께 보였다). 까닭마다 다음
        걸음이 다르다. ★ 꾸밈표(태그)가 섞이지 않는다 — toast 는
        textContent 라 태그가 <b>글자 그대로</b> 보인다
     ⑥ <b>404 를 「모델명 오류」로 단정하지 않는다</b> (1번) — 404 는 창구가
        내려가도 난다. 글 증거(does not exist 등)가 있을 때만 단정한다

   견본 기사는 <b>example.com · 견본신문</b> 으로 둡니다 (9번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8873;
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
    /* 창구는 빈손으로 답합니다 — 없으면 콘솔 404 가 찍혀 헛 빨간불이 됩니다 (8번) */
    if (rq.url.indexOf('/api/') === 0) {
      rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{"ok":true,"news":[]}'); return;
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
const SEED = () => {
  window.bizNewsCanEdit = function () { return true; };
  window.__toast = []; const real = window.toast;
  window.toast = function (m) { window.__toast.push(String(m)); if (real) real(m); };
  NLIVE.items = [{ t: '실손보험 청구 절차 간소화 시행', s: '견본신문', d: '2026-09-10',
                   u: 'https://example.com/a1', cats: ['ins'] }];
  NLIVE.cat = 'all'; NLIVE.at = '2026-09-10 09:00';
  try { nlSave(); } catch (e) {}
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
  await pg.waitForFunction(() => typeof go === 'function' && typeof newsToCard === 'function' &&
                                 typeof cnFillTopic === 'function' && typeof aiFailText === 'function',
                           { timeout: 60000 });
  await clearOvl(pg);

  /* ─────────────────────────────────────────────────────────── */
  head('[1] 넘기는 자리는 <b>한 곳</b>이고 <b>캐러셀</b>로 간다 (5번)');
  ['newsToCard', 'cnFillTopic', 'cnCaroBtnName', 'aiFailWhy', 'aiFailText'].forEach(f => {
    const c = (SRC.match(new RegExp('function\\s+' + f + '\\s*\\(', 'g')) || []).length;
    is(c === 1, f + '() 가 ' + c + '곳에 있다');
  });
  const hand = SRC.slice(SRC.indexOf('function newsToCard('), SRC.indexOf('function newsToCard(') + 2200);
  is(/go\('biz_news'\)/.test(hand), 'newsToCard 가 <b>biz_news</b>(오늘의 카드뉴스가 선 화면)로 간다');
  is(/cnFillTopic\(0\)/.test(hand), '그 화면의 <b>캐러셀 칸</b>을 채우러 간다');
  is(!/go\('insta'\)/.test(hand), '<b>인스타 스튜디오로는 안 보낸다</b> — 거기는 캐러셀이 아니다');

  /* ─────────────────────────────────────────────────────────── */
  head('[2] 넘어온 주제가 <b>캐러셀 칸</b>에 담긴다');
  await pg.evaluate(() => go('news_live'));
  await pg.waitForTimeout(500);
  await pg.evaluate(SEED);
  await pg.evaluate(() => nlPaint());
  await pg.waitForSelector('.nl-item .nl-b', { timeout: 20000 });
  const go1 = await pg.evaluate(() => {
    let went = ''; const real = window.go;
    window.go = function (x) { went = x; real(x); };
    document.querySelector('.nl-item .nl-b').children[0].click();
    window.go = real; return went;
  });
  await pg.waitForTimeout(2200);
  const r = await pg.evaluate(() => ({
    칸있나: !!document.getElementById('cnAiTopic'),
    값: (document.getElementById('cnAiTopic') || {}).value || '',
    상태: (typeof CN !== 'undefined') ? (CN.aiTopic || '') : '',
    단추: (document.getElementById('cnAiBtn') || {}).textContent || '',
    말: (window.__toast || []).join(' | ')
  }));
  is(go1 === 'biz_news', '  눌러 보면 <b>biz_news</b> 로 간다 — ' + go1);
  is(r.칸있나, '  캐러셀 칸(#cnAiTopic)이 그 화면에 있다');
  is(/실손보험 청구 절차 간소화 시행/.test(r.값), '  <b>제목이 그대로</b> 담긴다');
  is(/견본신문/.test(r.값), '  <b>출처</b>가 같이 담긴다');
  is(/보험/.test(r.값), '  <b>갈래</b>가 붙는다');
  is(r.상태 === r.값 && !!r.상태, '  화면과 속(CN.aiTopic)이 <b>같은 값</b>이다 — 두 말을 안 한다 (5번)');

  /* ─────────────────────────────────────────────────────────── */
  head('[3] 기사 본문은 <b>안 옮긴다</b> — 그리고 그렇다고 말해 준다 (9번·1번)');
  is(!/원문에서 숫자와 시행일을 확인하고/.test(r.값), '  거들어 둔 메모는 안 따라간다');
  is(/제목과 출처만 옮겼/.test(r.말), '  <b>적게 보낸 것을 말해 준다</b> — 많이 보낸 척하지 않는다');
  is(/본문/.test(r.말) && /붙여넣/.test(r.말), '  <b>더 정확히 하는 법</b>도 적어 준다');

  /* ─────────────────────────────────────────────────────────── */
  head('[4] 캐러셀 단추 이름을 아는 곳이 <b>하나</b>다 (5번)');
  const NAME = await pg.evaluate(() => cnCaroBtnName());
  is(!!NAME && !/undefined/.test(NAME), '  앱이 내놓는 이름이 온전하다 — 「' + NAME + '」');
  is(r.단추.indexOf(NAME) >= 0, '  선 단추가 그 이름이다');
  const gen = SRC.slice(SRC.indexOf('function cnAiGen('), SRC.indexOf('function cnAiGen(') + 2600);
  /* ⚠ 「편집 중… (20~50초)」 는 <b>일하는 중</b>이라는 글이라 이름이 아닙니다 —
     그것까지 세면 헛것을 잡습니다(처음에 그래서 울렸습니다 · 8번).
     <b>되돌리는</b> 자리만 봅니다 — 「…중…」 이 아닌 대입. */
  const 대입 = gen.match(/btn\.textContent\s*=\s*[^;]+;/g) || [];
  const 되돌림 = 대입.filter(x => !/중…|중\.\.\./.test(x));
  is(되돌림.length >= 2 && 되돌림.every(x => /cnCaroBtnName\(\)/.test(x)),
     '  되돌릴 때도 <b>그 하나를 부른다</b> — 딴 이름으로 안 바뀐다 (되돌리는 ' +
     되돌림.length + '자리 / 대입 ' + 대입.length + '자리)');
  /* 쪽지 줄은 걷어 내고 셉니다 — 쪽지가 이름을 적는 것은 맞습니다 (판 X100) */
  const 걷은 = SRC.split('\n').filter(l => !/^var APP_BUILD/.test(l)).join('\n');
  is(걷은.split(NAME).length - 1 === 1, '  그 이름 글자가 <b>코드에 한 번만</b> 있다');

  /* ─────────────────────────────────────────────────────────── */
  head('[5] 실패를 <b>사람 말</b>로 적는다 — 날글만 안 찍는다');
  const 글 = await pg.evaluate(() => {
    const mk = o => { const e = new Error(o.m || ''); if (o.s) e.status = o.s; if (o.o) e.overLimit = 1; return e; };
    return {
      날글: aiFailText(mk({ m: 'no' })),
      키: aiFailText(mk({ s: 401, m: 'invalid x-api-key' })),
      크레딧: aiFailText(mk({ m: 'your credit balance is too low' })),
      한도: aiFailText(mk({ o: 1, m: '한도' })),
      혼잡: aiFailText(mk({ s: 529, m: 'overloaded' })),
      맨404: aiFailText(mk({ s: 404, m: '서버가 404 로 답했습니다.' })),
      증거404: aiFailText(mk({ s: 404, m: 'model claude-x does not exist' }))
    };
  });
  const 모두 = Object.keys(글).map(k => 글[k]);
  is(글.날글 !== 'no' && 글.날글.length > 12, '  서버 날글만 찍지 않는다 — 「' + 글.날글.slice(0, 34) + '…」');
  is(모두.every(x => /주세요|여기까지|대체|채우시/.test(x)), '  <b>다음 걸음</b>이 늘 적혀 있다');
  is(!/잠시 뒤|1~2분/.test(글.키) && /잠시 뒤/.test(글.혼잡),
     '  까닭마다 <b>다음 걸음이 다르다</b> — 키 문제에 「기다리세요」 라고 안 한다');
  is(/제미나이|크레딧/.test(글.한도) && !/키·창구/.test(글.한도),
     '  한도 초과에 <b>멀쩡한 설정</b>을 고치러 보내지 않는다 (1번)');
  /* ★ toast 는 textContent 라 태그가 글자 그대로 보입니다 */
  is(모두.every(x => x.indexOf('<') < 0), '  꾸밈표(태그)가 <b>한 자도 안 섞인다</b> — toast 는 글자 그대로 찍는다');
  const two = ['function cnAiGen(', 'function instaRun('].map(k => SRC.slice(SRC.indexOf(k), SRC.indexOf(k) + 2600));
  is(two.every(b => /aiFailText\(/.test(b)), '  캐러셀·스튜디오 <b>둘 다</b> 그 하나를 부른다 (5번)');
  is(two.every(b => !/실패: '\+\(\(e&&e\.message\)\|\|e\)/.test(b) && !/실패: '\+esc\(\(e&&e\.message\)/.test(b)),
     '  날글을 그대로 찍던 자리가 <b>남아 있지 않다</b>');

  /* ─────────────────────────────────────────────────────────── */
  head('[6] <b>404 를 모델명 오류로 단정하지 않는다</b> (1번)');
  is(/모델명/.test(글.증거404), '  글 증거가 있으면 <b>모델명</b>이라고 말한다');
  is(/창구|프록시/.test(글.맨404), '  맨 404 는 <b>창구도 함께</b> 말한다 — 어느 쪽인지 단정하지 않는다');
  is(!/^모델명 오류/.test(글.맨404), '  맨 404 를 모델명 오류라고 <b>먼저 못 박지 않는다</b>');
  const fall = SRC.slice(SRC.indexOf("'Claude').catch(function(e){"), SRC.indexOf("'Claude').catch(function(e){") + 2000);
  is(/aiFailWhy\(e\)/.test(fall), '  대체 판정도 <b>그 하나에게 묻는다</b> — 삼항 사슬이 아니다 (5번)');

  /* ─────────────────────────────────────────────────────────── */
  head('[7] 인스타 화면이 <b>어디로 가야 하는지</b> 말해 준다 (6번)');
  await pg.evaluate(() => go('insta'));
  await pg.waitForTimeout(1200);
  const ins = await pg.evaluate(() => {
    const 보임 = e => e.checkVisibility ? e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) : (e.offsetParent !== null);
    const vis = [].slice.call(document.querySelectorAll('#dynPane button')).filter(보임);
    const pane = document.querySelector('#dynPane .tab-pane.on') || document.querySelector('#dynPane');
    return {
      줄: (document.querySelector('#dynPane .notice') || {}).innerText || '',
      접힘: document.querySelectorAll('#dynPane details.tool-fold').length,
      생성: vis.filter(b => /생성하기|한 번에 생성/.test(b.textContent || '')).length,
      길: vis.filter(b => /오늘의 카드뉴스로/.test(b.textContent || '')).length,
      높이: Math.round(pane.getBoundingClientRect().height)
    };
  });
  is(/오늘의 카드뉴스/.test(ins.줄), '  <b>캐러셀은 저기서 만든다</b>고 적는다');
  is(ins.길 === 1, '  거기로 가는 <b>단추</b>가 있다 — 말만 하고 끝내지 않는다');
  is(ins.접힘 === 2, '  글만 뽑는 자리 둘은 <b>접혀</b> 있다 — 지우지 않았다 (6번) · ' + ins.접힘 + '칸');
  is(ins.생성 === 1, '  보이는 「생성하기」가 <b>하나</b>다 — 전에는 셋이었다 · ' + ins.생성 + '개');
  is(ins.높이 > 0 && ins.높이 < 2000, '  화면이 짧아졌다 — ' + ins.높이 + 'px (전에는 2,534px)');

  /* ─────────────────────────────────────────────────────────── */
  head('[8] 조용한가');
  const 시끄 = errs.filter(e => !/favicon|net::ERR|Failed to fetch|abort/i.test(e));
  is(시끄.length === 0, '콘솔 에러 ' + 시끄.length + '건' + (시끄.length ? ' ← ' + 시끄[0] : ''));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '자리 — 위를 보십시오 (' + n + '가지 중)'); process.exit(1); }
  console.log('✓ 캐러셀로 가는 길 — 이름이 가리키는 데로 갑니다 (' + n + '자리).');
})();
