#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   실패했을 때 <b>사람 말</b>로 적나 — 그리고 엉뚱한 데로 보내지 않나

   사장님 말씀 (2026-10-13): 「나머지 11곳도 다 바꿔줘 어떤거 바꾸는지 말해주고」

   ★★ 사장님께 <b>「생성 실패: no」</b> 가 보였습니다. 서버가 준 날글을 그대로
   찍은 것인데, 「no」 는 아무 뜻이 없고 <b>다음에 뭘 해야 하는지</b>가 없습니다.
   판 X101 에서 캐러셀·스튜디오 둘만 고쳤고, 이 판에서 <b>나머지를 다</b> 했습니다.

   ★★ 그런데 열한 곳을 읽어 보니 <b>같은 종류가 아니었습니다</b> —
   열은 AI 부르기 실패인데 하나는 <b>서버(Supabase)</b> 오류(고객 만들기)였습니다.
   거기에 AI 용 글을 쓰면 「설정 → AI 연결을 확인하세요」 라고 적게 되는데,
   <b>AI 와 아무 상관이 없는 일</b>입니다 — 멀쩡한 설정을 고치러 보내는 것이고,
   판 X101 에서 고친 그 실수를 똑같이 다시 하는 것입니다 (1번).
   그래서 자를 <b>둘</b>로 둡니다 — aiFailText · svFailText.

   여기서 못 박는 것은 여섯입니다.

     ① 두 자가 저마다 <b>한 곳</b>에만 있다 (5번)
     ② <b>까닭마다 다음 걸음</b>이 있다 — 늘 같은 말이 아니다
     ③ ★★ <b>서버 자가 AI 설정으로 보내지 않는다</b> — 사장님께 가장
        중요한 한 줄입니다
     ④ 두 자가 내는 글에 <b>꾸밈표(태그)가 한 자도 없다</b> — toast 는
        textContent 로 찍어 태그가 글자 그대로 보입니다
     ⑤ 뜻 없는 날글만 찍지 않는다 — 「no」 를 그대로 찍지 않고 <b>증거는
        남기고 할 일을 적는다</b>
     ⑥ ★ <b>날글이 새는 자리가 늘지 않았다</b> — 기준선으로 봅니다.
        남은 다섯은 AI 도 서버도 아닌 자리(파일 내려받기 · 캔버스 이미지
        저장 · 주식 시세)라 <b>셋째 자</b>가 필요합니다. 줄이면 기준선도
        같이 내립니다 (0-1번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8874;
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
    if (rq.url.indexOf('/api/') === 0) { rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{"ok":true,"news":[]}'); return; }
    const f = path.join(ROOT, decodeURIComponent(rq.url.split('?')[0].split('#')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
    rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(rs);
  }).listen(PORT);
}

/* ★ 날글이 새는 자리의 기준선 — <b>0</b> 입니다. 처음에는 5 로 잡았는데,
   자가 돌려 보니 <b>일곱</b>이었습니다(가름표가 「:」 가 아니라 「—」 인 두 자리를
   제 눈이 놓쳤습니다). 셋째 자(flFailText)를 세워 일곱을 다 옮겼습니다.
   늘면 빨간불입니다 (0-1번).                                              */
const 날글기준선 = 0;

(async () => {
  const srv = serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  await pg.addInitScript(STUB);
  await pg.addInitScript(() => { try { localStorage.setItem('apex_guide_seen_v2', '1'); } catch (e) {} });
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof aiFailText === 'function' && typeof svFailText === 'function' &&
                                 typeof aiFailWhy === 'function' && typeof svFailWhy === 'function',
                           { timeout: 60000 });

  /* ─────────────────────────────────────────────────────────── */
  head('[1] 두 자가 저마다 <b>한 곳</b>에만 있다 (5번)');
  ['aiFailWhy', 'aiFailText', 'svFailWhy', 'svFailText', 'flFailWhy', 'flFailText'].forEach(f => {
    const c = (SRC.match(new RegExp('function\\s+' + f + '\\s*\\(', 'g')) || []).length;
    is(c === 1, f + '() 가 ' + c + '곳에 있다');
  });
  const ai칸 = (SRC.match(/aiFailText\(/g) || []).length - 1;
  const sv칸 = (SRC.match(/svFailText\(/g) || []).length - 1;
  const fl칸 = (SRC.match(/flFailText\(/g) || []).length - 1;
  is(ai칸 >= 15, 'AI 실패를 <b>' + ai칸 + '곳</b>이 그 하나에게 묻는다');
  is(sv칸 >= 20, '서버 실패를 <b>' + sv칸 + '곳</b>이 그 하나에게 묻는다');
  is(fl칸 >= 5, '그림·파일 실패를 <b>' + fl칸 + '곳</b>이 그 하나에게 묻는다');

  /* ─────────────────────────────────────────────────────────── */
  head('[2] <b>까닭마다 다음 걸음</b>이 있다 — 늘 같은 말이 아니다');
  const 말 = await pg.evaluate(() => {
    const mk = o => { const e = new Error(o.m || ''); if (o.s) e.status = o.s; if (o.o) e.overLimit = 1; return e; };
    return {
      ai: {
        키: aiFailText(mk({ s: 401, m: 'invalid x-api-key' })),
        크레딧: aiFailText(mk({ m: 'your credit balance is too low' })),
        한도: aiFailText(mk({ o: 1, m: '한도' })),
        혼잡: aiFailText(mk({ s: 529, m: 'overloaded' })),
        끊김: aiFailText(mk({ m: 'Failed to fetch' })),
        맨404: aiFailText(mk({ s: 404, m: '404' })),
        모델: aiFailText(mk({ s: 404, m: 'does not exist' })),
        날글: aiFailText(mk({ m: 'no' }))
      },
      sv: {
        로그인: svFailText(mk({ m: 'JWT expired' })),
        권한: svFailText(mk({ m: 'new row violates row-level security policy' })),
        중복: svFailText(mk({ m: 'duplicate key value violates unique constraint' })),
        끊김: svFailText(mk({ m: 'Failed to fetch' })),
        바쁨: svFailText(mk({ m: '503 service unavailable' })),
        모름: svFailText(mk({ m: 'something odd' }))
      }
    };
  });
  const 모두 = Object.keys(말.ai).map(k => 말.ai[k]).concat(Object.keys(말.sv).map(k => 말.sv[k]));
  is(모두.every(x => /주세요|여기까지|대체|채우시|쓰시면|알려 주십시오/.test(x)),
     '  모든 답에 <b>다음 걸음</b>이 있다 (' + 모두.length + '가지)');
  is(new Set(모두).size >= 10, '  답이 <b>저마다 다르다</b> — ' + new Set(모두).size + '가지');
  is(/제미나이|크레딧/.test(말.ai.한도) && !/키·창구|키」/.test(말.ai.한도),
     '  AI 한도 초과에 <b>멀쩡한 설정</b>을 고치러 보내지 않는다');
  is(/다시 로그인/.test(말.sv.로그인), '  서버 — 로그인이 풀리면 <b>다시 로그인</b>하라고 한다');
  is(/권한|요청/.test(말.sv.권한), '  서버 — 권한이면 <b>권한을 요청</b>하라고 한다');
  is(/목록|찾아/.test(말.sv.중복), '  서버 — 이미 있으면 <b>목록에서 찾아 쓰라</b>고 한다');
  const 그림 = await pg.evaluate(() => {
    const mk = o => { const e = new Error(o.m || ''); if (o.n) e.name = o.n; return e; };
    return {
      막힘: flFailText(mk({ n: 'NotAllowedError', m: 'clipboard write denied' })),
      큼: flFailText(mk({ m: 'canvas size exceeds limit' })),
      모름: flFailText(mk({ m: 'odd thing' }))
    };
  });
  is(/파일로 내려받/.test(그림.막힘), '  그림 — 막히면 <b>되는 길</b>을 알려 준다 (6번)');
  is(/줄이|한 장씩/.test(그림.큼), '  그림 — 너무 크면 <b>어떻게 줄일지</b> 알려 준다');
  is(!/AI|로그인|설정/.test(그림.막힘 + 그림.큼 + 그림.모름),
     '  그림 — <b>AI·로그인·설정</b>을 고치러 보내지 않는다 (1번)');

  /* ─────────────────────────────────────────────────────────── */
  head('[3] ★★ <b>서버 자가 AI 설정으로 보내지 않는다</b> (1번)');
  const sv모두 = Object.keys(말.sv).map(k => 말.sv[k]);
  is(sv모두.every(x => !/AI\s*연결|API|프록시|모델|크레딧|제미나이|클로드/i.test(x)),
     '  서버 실패 글에 <b>AI 말이 한 자도 없다</b> — ' + sv모두.length + '가지 다 봤다');
  is(!/aiFailText\(\s*r\.error/.test(SRC), '  <b>r.error</b>(서버 오류)를 AI 자에게 넘기는 자리가 없다');
  is(/svFailText\(\s*r\.error/.test(SRC), '  서버 오류는 <b>서버 자</b>에게 넘긴다');
  /* 거꾸로 — callAI 의 catch 에서 서버 자를 부르지 않는다 */
  const callAI칸 = SRC.split('callAI(');
  const 뒤섞임 = callAI칸.filter((blk, i) => i > 0 && /\.catch\([^]{0,400}?svFailText\(/.test(blk.slice(0, 600))).length;
  is(뒤섞임 === 0, '  거꾸로도 안 섞인다 — AI 부르기 실패에 서버 자를 안 쓴다');

  /* ─────────────────────────────────────────────────────────── */
  head('[4] <b>꾸밈표(태그)가 한 자도 없다</b> — toast 는 글자 그대로 찍는다');
  is(모두.every(x => x.indexOf('<') < 0 && x.indexOf('&lt;') < 0),
     '  두 자가 내는 글 ' + 모두.length + '가지에 태그가 없다');
  ['aiFailText', 'svFailText', 'flFailText'].forEach(f => {
    const b = SRC.slice(SRC.indexOf('function ' + f + '('), SRC.indexOf('function ' + f + '(') + 1400);
    is(/replace\(\/<\[\^>\]\*>\/g/.test(b), '  ' + f + ' 가 <b>스스로 태그를 걷는다</b>');
  });

  /* ─────────────────────────────────────────────────────────── */
  head('[5] 뜻 없는 날글만 찍지 않는다');
  is(말.ai.날글 !== 'no' && 말.ai.날글.length > 20, '  AI — 「no」 를 그대로 안 찍는다');
  is(말.ai.날글.indexOf('no') >= 0, '  그래도 <b>증거는 남긴다</b> — 무엇이라 답했는지 적는다 (1번)');
  is(/서버 말|서버가/.test(말.sv.모름), '  서버 — 모를 때도 <b>증거 + 할 일</b>을 적는다');

  /* ─────────────────────────────────────────────────────────── */
  head('[6] <b>날글이 새는 자리가 늘지 않았다</b> (0-1번)');
  /* 주석은 걷어 냅니다 — 머리글에 적어 둔 옛 꼴을 「아직 쓴다」 로 읽으면 헛것입니다 */
  const 줄 = SRC.split('\n').filter(l => !/^\s*(\/\*|\*|\/\/)/.test(l));
  const 새는 = 줄.filter(l => /실패[^']*'\s*\+\s*(\(\()?(e&&e\.message|r\.error\.message|esc\(e\.message)/.test(l));
  is(새는.length <= 날글기준선,
     '  날글이 새는 자리 <b>' + 새는.length + '곳</b> — 기준선 ' + 날글기준선 +
     (새는.length ? '\n      ' + 새는.map(l => l.replace(/^\s+/, '').slice(0, 72)).join('\n      ') : ''));
  is(!/실패: '\+r\.error\.message/.test(줄.join('\n')),
     '  <b>r.error.message</b> 를 그대로 찍는 자리가 한 곳도 없다');

  /* ─────────────────────────────────────────────────────────── */
  head('[7] 조용한가');
  const 시끄 = errs.filter(e => !/favicon|net::ERR|Failed to fetch|abort/i.test(e));
  is(시끄.length === 0, '콘솔 에러 ' + 시끄.length + '건' + (시끄.length ? ' ← ' + 시끄[0] : ''));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '자리 — 위를 보십시오 (' + n + '가지 중)'); process.exit(1); }
  console.log('✓ 실패 글 — 까닭과 다음 걸음을 적고, 엉뚱한 데로 안 보냅니다 (' + n + '자리).');
})();
