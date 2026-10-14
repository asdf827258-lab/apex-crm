#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   구글이 <b>내린 모델</b>을 부르지 않나 · 같은 말을 <b>매번</b> 하지 않나 (판 X108)

   사장님 말씀 (2026-10-14):
     「제미나이 창구 들쭉날쭉한거 고쳐줘, 그리고 계속 크레딧 없다고 뜨는데
      이거 고쳐놔」

   ★★ ① <b>창구는 멀쩡했습니다.</b> 두 번씩 두드려 보니 한결같았습니다 —
   들쭉날쭉해 보인 까닭은 앱이 <b>구글이 내린 모델</b>을 매번 먼저 부르고
   404 를 받은 뒤 물러나고 있었기 때문입니다. 2026-10-14 에 재어 본 것:

       gemini-2.5-pro                             404  "no longer available"
       gemini-2.5-flash                           404  "no longer available"
       gemini-2.0-flash-preview-image-generation  404  not found
       gemini-pro-latest                          200  OK
       gemini-flash-latest                        200  OK
       gemini-flash-lite-latest                   200  OK
       gemini-2.5-flash-image                     200  OK

   한 번 만들 때마다 <b>헛걸음 한두 번</b>이 들어갔습니다 (7번).

   ★★ ② 「크레딧 없다」 가 <b>글 만들 때마다</b> 떴습니다. 여태는 <b>키가
   거절될 때만</b> 접었는데(aiKeyBad), 지금 막힌 것은 크레딧이라 매번 다시
   불러 400 을 받고 매번 그 말을 띄웠습니다. 사장님은 「또 고장났나」 하시고,
   서버도 헛걸음을 했습니다.

   ⚠ 이 자는 <b>진짜 서버를 안 읽습니다</b> — 그걸 보는 자가 따로 있습니다.
   날글과 브라우저로만 잽니다. 위 수치는 <b>그날 손으로 잰 것</b>이고,
   구글이 또 바꾸면 또 404 가 납니다 — 그때는 GEM_MOVED 에 한 줄 보탭니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8877;
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
               '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
function serve() {
  return http.createServer((rq, rs) => {
    const f = path.join(ROOT, decodeURIComponent(rq.url.split('?')[0].split('#')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
    rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(rs);
  }).listen(PORT);
}

/* 2026-10-14 에 <b>손으로 재어</b> 404 였던 이름들 */
const 죽은이름 = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash',
                  'gemini-1.5-flash', 'gemini-1.5-pro',
                  'gemini-2.0-flash-preview-image-generation'];

(async () => {
  const srv = serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1280, height: 900 } });
  /* ★ 바깥으로 한 발짝도 안 나갑니다 */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof gemLive === 'function' && typeof getGeminiProModel === 'function' &&
                                 typeof aiClaudeDone === 'function', { timeout: 60000 });

  /* ─────────────────────────────────────────────────────────── */
  head('[1] 이사표가 <b>한 곳</b>이고 두 자리가 그것을 지난다 (5번)');
  is((SRC.match(/var GEM_MOVED\s*=/g) || []).length === 1, '  GEM_MOVED 표가 한 곳에 있다');
  is((SRC.match(/function\s+gemLive\s*\(/g) || []).length === 1, '  gemLive() 가 한 곳에 있다');
  ['getGeminiModel', 'getGeminiProModel'].forEach(f => {
    const b = SRC.slice(SRC.indexOf('function ' + f + '('), SRC.indexOf('function ' + f + '(') + 160);
    is(/gemLive\(/.test(b), '  ' + f + ' 가 <b>이사표를 지난다</b>');
  });

  /* ─────────────────────────────────────────────────────────── */
  head('[2] <b>죽은 이름</b>을 더는 안 부른다');
  /* 이사표 안쪽(왼쪽 칸)은 당연히 죽은 이름입니다 — 그 토막은 빼고 봅니다 */
  const i0 = SRC.indexOf('var GEM_MOVED'), i1 = SRC.indexOf('};', i0);
  const 밖 = SRC.slice(0, i0) + SRC.slice(i1);
  죽은이름.forEach(m => {
    is(밖.indexOf("'" + m + "'") < 0, '  ' + m + ' 을 안 쓴다');
  });
  is(/'gemini-pro-latest'/.test(SRC), '  살아 있는 품질 모델(gemini-pro-latest)을 쓴다');

  /* ─────────────────────────────────────────────────────────── */
  head('[3] 기기에 <b>옛 이름</b>이 담겨 있어도 산 이름으로 나온다');
  const 옮김 = await pg.evaluate((죽) => {
    const o = {};
    죽.forEach(m => { o[m] = gemLive(m); });
    LS.set('gpromodel', 'gemini-2.5-pro'); o['담아둔 품질'] = getGeminiProModel();
    LS.set('gmodel', 'gemini-2.0-flash'); o['담아둔 일반'] = getGeminiModel();
    return o;
  }, 죽은이름);
  죽은이름.forEach(m => {
    is(옮김[m] && 옮김[m] !== m, '  ' + m + ' → ' + 옮김[m]);
  });
  is(옮김['담아둔 품질'] === 'gemini-flash-latest',
     '  기기에 담긴 옛 품질 이름이 <b>열면 옮겨진다</b> — ' + 옮김['담아둔 품질'] +
     ' (창구가 30초에 끊어 pro 는 기본이 아닙니다)');
  is(옮김['담아둔 일반'] === 'gemini-flash-latest', '  기기에 담긴 옛 일반 이름도 옮겨진다 — ' + 옮김['담아둔 일반']);

  /* ─────────────────────────────────────────────────────────── */
  head('[4] 설정 고르개에 <b>죽은 이름이 없다</b>');
  const 고르개 = (SRC.match(/g?p?opt\('gemini-[^']*'/g) || []).map(x => x.replace(/.*'(.*)'/, '$1'));
  const 죽은고르개 = 고르개.filter(x => 죽은이름.indexOf(x) >= 0);
  is(죽은고르개.length === 0, '  고를 수 있는 것이 다 살아 있다 — ' +
     [].concat(고르개).filter((v, i, a) => a.indexOf(v) === i).join(' · ') +
     (죽은고르개.length ? '\n      ← 죽은 것: ' + 죽은고르개.join(' · ') : ''));

  /* ─────────────────────────────────────────────────────────── */
  head('[4-2] 느려서 <b>끊겨도</b> 물러난다 (판 X109 에서 데인 자리)');
  /* ⚠ 판 X108 에서 품질 기본을 gemini-pro-latest 로 두었다가 캐러셀이 아예
     안 만들어졌습니다. 창구(Netlify 함수)가 <b>~30초</b>에 끊는데 pro 가 그보다
     느려 <b>504</b> 가 납니다. 전에는 pro 가 즉시 404 라 곧장 flash 로 가서
     돌아갔던 것인데, 제가 404 를 없애며 그 <b>우연한 안전장치</b>를 같이
     없앴습니다. 재어 본 것: pro 큰 요청 504(31.3초) · flash 작은 요청 200(12.1초). */
  /* ⚠ LS.set(…,'') 로는 못 잽니다 — 칸이 있으면 빈 글자를 돌려주지 기본값으로
     안 갑니다(처음에 그래서 빈칸이 나왔습니다). <b>날글의 기본값</b>을 봅니다. */
  const 기본줄 = SRC.slice(SRC.indexOf('function getGeminiProModel('), SRC.indexOf('function getGeminiProModel(') + 140);
  const 기본 = (기본줄.match(/LS\.get\('gpromodel','([^']*)'\)/) || [])[1] || '';
  is(기본 === 'gemini-flash-latest',
     '  품질 <b>기본</b>이 창구가 버티는 것이다 — ' + (기본 || '(못 읽음)') + ' (pro 는 고를 수는 있습니다)');
  const smart = SRC.slice(SRC.indexOf('function callGeminiSmart('), SRC.indexOf('function callGeminiSmart(') + 1400);
  is(/st===504/.test(smart) && /timedOut/.test(smart),
     '  <b>504·시간 초과</b>면 기본 모델로 물러난다 — 그대로 죽지 않는다');
  const 말504 = await pg.evaluate(() => {
    const e = new Error('gateway timeout'); e.status = 504;
    return { why: aiFailWhy(e), say: aiFailText(e) };
  });
  is(/제한 시간|30초/.test(말504.why), '  504 를 <b>사람 말</b>로 가른다 — ' + 말504.why);
  is(/장수를 줄이|짧게/.test(말504.say), '  <b>할 수 있는 일</b>을 알려 준다 — ' + 말504.say.slice(-34));
  is(말504.say.indexOf('<') < 0, '  그 말에 꺾쇠가 없다');

  /* ─────────────────────────────────────────────────────────── */
  head('[5] 클로드를 <b>이번 접속에 한 번만</b> 접는다 (사장님 말씀)');
  const 접 = await pg.evaluate(() => {
    const mk = o => { const e = new Error(o.m || ''); if (o.s) e.status = o.s; if (o.o) e.overLimit = 1; return e; };
    return {
      크레딧: aiClaudeDone(mk({ m: 'your credit balance is too low' })),
      한도: aiClaudeDone(mk({ o: 1, m: '한도' })),
      키: aiClaudeDone(mk({ m: 'invalid x-api-key' })),
      혼잡: aiClaudeDone(mk({ s: 529, m: 'overloaded' })),
      끊김: aiClaudeDone(mk({ m: 'Failed to fetch' })),
      그냥: aiClaudeDone(mk({ s: 400, m: 'bad request' }))
    };
  });
  is(접.크레딧 && 접.한도 && 접.키, '  <b>회복 못 할 것</b>이면 접는다 — 크레딧 · 하루 한도 · 키 거절');
  is(!접.혼잡 && !접.끊김 && !접.그냥,
     '  <b>잠깐인 것</b>에는 안 접는다 — 혼잡 · 인터넷 끊김 · 그냥 실패 (8번)');
  const blk = SRC.slice(SRC.indexOf("'Claude').catch(function(e){"), SRC.indexOf("'Claude').catch(function(e){") + 1600);
  is(/if\(aiClaudeDone\(e\)\)AI_DEAD\.claude=true/.test(blk), '  그때 <b>AI_DEAD.claude</b> 를 세운다');
  is(/if\(!AI_SAID\.claude\)/.test(blk), '  같은 말을 <b>한 번만</b> 한다 (AI_SAID)');
  is(/AI_SAID\.claude=true/.test(blk), '  말하고 나서 적어 둔다');
  is(!/크레딧\/키 확인 필요/.test(blk), '  겁주던 옛 글이 <b>남아 있지 않다</b>');
  /* 접고 나면 다시 안 부른다 — 서버를 아껴 씁니다 (7번) */
  const 다시 = await pg.evaluate(() => {
    const 전 = claudeReady(); AI_DEAD.claude = true; const 후 = claudeReady();
    AI_DEAD.claude = false; return { 전: 전, 후: 후 };
  });
  is(다시.후 === false, '  접은 뒤에는 <b>클로드를 다시 안 부른다</b> — 헛걸음을 안 한다 (7번)');

  /* ─────────────────────────────────────────────────────────── */
  head('[6] 조용한가');
  const 시끄 = errs.filter(e => !/favicon|net::ERR|Failed to fetch|abort/i.test(e));
  is(시끄.length === 0, '콘솔 에러 ' + 시끄.length + '건' + (시끄.length ? ' ← ' + 시끄[0] : ''));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '자리 — 위를 보십시오 (' + n + '가지 중)'); process.exit(1); }
  console.log('✓ 죽은 모델을 안 부르고, 같은 말을 매번 하지 않습니다 (' + n + '자리).');
})();
