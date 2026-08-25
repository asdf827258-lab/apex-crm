/* DB 통합 CRM — <b>브라우저 하나가 어긋나서 통째로 안 열리던 자리.</b>

   접속 정보는 세 곳에서 온다.
     ① 파일에 박아 둔 것(window.APEX_CONFIG)
     ② <b>이 브라우저에 저장된 것</b>(localStorage)
     ③ 기본값(APEX_DEFAULT_SB) — 앱과 같은 프로젝트·같은 공개 anon 키

   ②가 ③을 이긴다. 그래서 설정 화면에 <b>한 번 잘못 저장하면</b> 올바른
   기본값이 있어도 그 브라우저에서는 <b>영원히</b> 안 열렸다. 되돌리는
   resetConfig() 는 있는데 <b>부르는 단추가 화면에 없었다.</b> 사장님이
   「또 안 된다」 고 하신 자리다.

   게다가 라이브러리를 못 받아 왔을 때도 「<b>연결 설정을 확인해 주세요</b>」
   라고 말했다. 설정은 멀쩡한데 키를 다시 넣게 만들고, 그러다 잘못 저장하면
   그때부터 진짜로 안 열린다 — 고장을 스스로 만드는 안내였다.

   여기서 확인한다.
     1. 아무것도 안 건드린 브라우저는 <b>설정 화면 없이</b> 바로 열리는가
     2. 못 쓸 설정이 저장돼 있으면 <b>스스로</b> 기본 연결로 돌아가는가
     3. 제대로 넣은 설정은 <b>그대로 존중</b>하는가 — 남의 프로젝트를 뺏지 않는다
     4. 되돌릴 단추가 <b>화면에</b> 있는가
     5. 라이브러리를 못 받았을 때 <b>설정 탓으로 돌리지 않는가</b>            */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const PAGE = '/db-crm.html';
const SRC = fs.readFileSync('db-crm.html', 'utf8');
/* 이 브라우저에 저장하는 열쇠 이름은 파일에서 읽는다 — 짐작하면 엉뚱한 칸에
   넣고 「스스로 나았다」 는 헛통과가 나온다. 실제로 한 번 그렇게 속았다. */
const KEY = (SRC.match(/const CONFIG_KEY\s*=\s*"([^"]+)"/) || [])[1];

/* CDN 은 점검 환경에서 안 나간다. 우리 쪽 판단만 재려고 라이브러리를 흉내 낸다 —
   진짜 supabase 를 부르는 것이 목적이 아니라, <b>어느 설정으로</b> 부르는지가 목적이다. */
const STUB = 'window.supabase={createClient:function(u,k){window.__used={u:u,k:k};' +
  'return {auth:{onAuthStateChange:function(){},getSession:function(){return Promise.resolve({data:{}});}}};}};';

let noLib = false;   /* true 면 라이브러리를 아예 안 실어 준다 */

const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p === '/__stub.js') { rs.writeHead(200, { 'Content-Type': 'text/javascript' }); rs.end(STUB); return; }
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  let body = fs.readFileSync(f, 'utf8');
  if (p === PAGE) {
    body = body.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>',
                        noLib ? '' : '<script src="/__stub.js"></script>');
  }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  rs.end(body);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();

  const open = async (seed) => {
    const pg = await browser.newPage();
    await pg.goto(base + PAGE, { waitUntil: 'domcontentloaded' });
    if (seed !== undefined) await pg.evaluate(([k, v]) => {
      try { localStorage.setItem(k, v); } catch (e) {}
    }, [KEY, seed]);
    await pg.reload({ waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(1100);
    const r = await pg.evaluate(() => ({
      cfg: !document.getElementById('configScreen').classList.contains('hidden'),
      auth: !document.getElementById('authScreen').classList.contains('hidden'),
      why: (document.getElementById('cfgWhy') || {}).textContent || '',
      used: window.__used || null
    }));
    await pg.close();
    return r;
  };
  const isDefault = r => !!(r.used && /miakdhxtqofpndtlyzxa/.test(r.used.u));

  console.log('\n[0] 열쇠 이름을 파일에서 읽었다');
  is(!!KEY, '  localStorage 열쇠 — ' + (KEY || '(못 읽음)'));

  console.log('\n[1] 아무것도 안 건드린 브라우저는 바로 열린다');
  let r = await open(undefined);
  is(!r.cfg && r.auth, '  설정 화면이 안 뜨고 로그인으로 넘어간다');
  is(isDefault(r), '  앱과 같은 프로젝트로 붙는다');

  console.log('\n[2] 못 쓸 설정이 저장돼 있으면 스스로 낫는다');
  const rot = [
    ['{"url":"","key":""}', '빈 값'],
    ['{"url":"https://xxxxx.supabase.co","key":"eyJ"}', '예시값 그대로'],
    ['{"url":"https://YOUR_PROJECT.supabase.co","key":"k"}', '자리표시자'],
    ['{"url":"http://오타","key":"k"}', '오타난 주소'],
    ['깨진글자', '깨진 JSON']
  ];
  for (const [seed, why] of rot) {
    r = await open(seed);
    is(!r.cfg && isDefault(r), '  ' + why + ' → 기본 연결로 되돌아간다');
  }

  console.log('\n[3] 제대로 넣은 설정은 그대로 존중한다 — 남의 프로젝트를 뺏지 않는다');
  r = await open('{"url":"https://myown12345.supabase.co","key":"eyJabc"}');
  is(!r.cfg && !!(r.used && /myown12345/.test(r.used.u)),
     '  직접 넣은 주소로 붙는다 — ' + (r.used ? r.used.u : '(안 붙음)'));

  console.log('\n[4] 되돌릴 단추가 화면에 있다');
  const pg = await browser.newPage();
  await pg.goto(base + PAGE, { waitUntil: 'domcontentloaded' });
  const btns = await pg.evaluate(() =>
    [].map.call(document.querySelectorAll('#configScreen button'),
      b => ({ t: b.textContent.trim(), on: b.getAttribute('onclick') || '' })));
  await pg.close();
  is(btns.some(b => /resetConfig/.test(b.on)),
     '  기본 연결로 되돌리는 단추가 있다 — ' + btns.map(b => b.t).join(' / '));

  console.log('\n[5] 라이브러리를 못 받았을 때 설정 탓으로 돌리지 않는다');
  noLib = true;
  r = await open(undefined);
  noLib = false;
  is(/설정 문제가 아닙니다/.test(r.why),
     '  「설정 문제가 아닙니다」 라고 밝힌다 — ' + (r.why.slice(0, 46) || '(아무 말도 없음)'));
  is(/새로고침/.test(r.why), '  무엇을 하면 되는지 말한다 — 새로고침');
  is(!/키를 다시/.test(r.why) || /다시 넣지 않으셔도/.test(r.why),
     '  키를 다시 넣으라고 하지 않는다 — 그러다 잘못 저장하면 진짜로 막힌다');

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '✗ ' + bad + '개 어긋남\n'
                  : 'CRM 연결 점검 통과 — 어긋난 설정은 스스로 낫고, 넣은 설정은 그대로 갑니다.\n');
  process.exit(bad ? 1 : 0);
})();
