/* <b>보험 마스터 아카데미가 인터넷에 열려 있었다.</b>

   교재는 시험 점수·진도를 Supabase 두 표(bohum_scores·bohum_progress)에
   담는데, 그 표의 규칙이 이랬다 —

     create policy s_r on public.bohum_scores for select to anon using (true);

   <b>「to anon using (true)」 는 로그인 안 한 아무나</b> 라는 뜻이다. anon 키는
   교재 페이지(sync.js)에 그대로 박혀 있으니(공개용이라 그 자체는 정상)
   <b>RLS 가 유일한 문</b>인데 그 문이 열려 있었다.

     읽기   — 인터넷의 누구나 팀원 이름과 시험 점수를 전부
     넣기   — 누구나 아무 점수나  ← 무료 한도를 세 배로 넘긴 그 자리다 (7번)
     고치기 — 누구나 남의 진도를

   고쳤다. <b>로그인한 사람의 토큰</b>으로만 간다. 여기서 지키는 것 —

     1. 저장소 어디에도 <b>「to anon」 정책이 남아 있지 않은가</b>
        (교재 폴더에는 같은 화면이 두 벌 있다 — 한쪽만 고치면 다른 쪽이
        옛 SQL 을 사장님께 그대로 내민다)
     2. 준비 SQL 이 <b>한 벌뿐인가</b> — 세 곳에 적혀 있었다 (5번)
     3. 새 규칙이 <b>authenticated · owner_id</b> 로 서 있는가
     4. sync.js 가 <b>로그인 없이는 서버를 아예 안 부르는가</b>
        (부르고 401 을 받으면 화면에는 「전송 실패」만 뜬다 — 왜인지 모른다)
     5. 로그인하면 <b>다시 붙는가</b> — 한 번 실패하고 영영 안 붙으면
        사장님은 「어제는 됐는데」 하신다
     6. <b>만료된 토큰을 없는 것으로 치는가</b> — 들고 있다가 한 시간 뒤
        말없이 저장이 안 되는 자리다
     7. 안 되는 이유를 <b>화면이 말하는가</b> (1번 — 조용히 안 되면 된 줄 아신다)
     8. 실제로 <b>토큰을 달고 가는가</b> · <b>owner_id 를 담는가</b>
        — 가짜 서버를 세워 오간 것을 받아 본다                            */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const DIR = 'app/보험아카데미';
const SYNC = fs.readFileSync(DIR + '/sync.js', 'utf8');
const MIG = fs.readFileSync('migration_45_bohum_rls.sql', 'utf8');
/* 설명하려고 옛 정책을 인용한 주석까지 잡으면 헛알람이 된다 (8번). 주석을 걷고 본다. */
const nocomment = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ');
const SYNC_CODE = nocomment(SYNC);

(async () => {

console.log('\n[1] 저장소 어디에도 익명(anon) 정책이 안 남아 있다');
const files = fs.readdirSync(DIR).filter(f => /\.(js|html)$/.test(f));
let anonAt = [];
files.forEach(f => {
  const t = nocomment(fs.readFileSync(path.join(DIR, f), 'utf8'));
  if (/to\s+anon\b/.test(t)) anonAt.push(f);
});
is(anonAt.length === 0,
   '  교재 폴더 <b>' + files.length + '개 파일</b> 어디에도 「to anon」 정책이 없다' +
   (anonAt.length ? ' ← 남아 있습니다: ' + anonAt.join(' · ') : ''));
is(!/to\s+anon/.test(nocomment(MIG)),
   '  마이그레이션도 <b>anon 에게 열지 않는다</b>');

console.log('\n[2] 준비 SQL 은 한 벌뿐이다 (5번)');
let sqlAt = [];
files.forEach(f => {
  const t = fs.readFileSync(path.join(DIR, f), 'utf8');
  if (/create\s+policy\s+\w+\s+on\s+public\.bohum/.test(t)) sqlAt.push(f);
});
is(sqlAt.length === 0,
   '  화면에는 정책 SQL 을 <b>안 적어 둔다</b> — 저장소 파일 하나를 읽어 온다' +
   (sqlAt.length ? ' ← 또 적혀 있습니다: ' + sqlAt.join(' · ') : ''));
const loaderAt = files.filter(f =>
  /migration_45_bohum_rls\.sql/.test(fs.readFileSync(path.join(DIR, f), 'utf8')));
is(loaderAt.length >= 1, '  그 파일을 <b>가리키는 화면</b>이 있다 — ' + (loaderAt.join(' · ') || '없음'));
is(/지어내지 않습니다/.test(fs.readFileSync(DIR + '/index.html', 'utf8')),
   '  못 받으면 <b>지어내지 않는다</b>고 그 자리에 적는다 (1번)');

/* ── 한 벌로 모았으면, 그 한 벌이 <b>배포에서 실제로 열려야</b> 한다 ────────
   _redirects 의 「/migration_*  …  404!」 가 이 파일까지 같이 막고 있었다.
   404 뒤의 ! 는 실제 파일이 있어도 강제로 막으므로, 로컬에서는 파일이 그냥
   열려 통과하고 <b>운영에서만 조용히 404</b> 가 난다. 실제로 그랬다 —
   사장님이 단추를 눌러도 SQL 이 안 나왔다. 그래서 여기서는 파일이 있는지가
   아니라 <b>Netlify 규칙을 그대로 흉내 내</b> 첫 번째로 걸리는 규칙을 본다. */
console.log('\n[2-1] 그 한 벌이 배포에서 실제로 열린다');
const RD = fs.readFileSync('_redirects', 'utf8');
const RULES = RD.split('\n')
  .map(l => l.replace(/#.*$/, '').trim()).filter(Boolean)
  .map(l => { const p = l.split(/\s+/); return { from: p[0], to: p[1], st: p[2] || '200' }; });
/* Netlify: 위에서 아래로, 처음 걸리는 규칙 하나만 쓴다 */
const firstRule = p => RULES.filter(r => r.from.slice(-1) === '*'
  ? p.indexOf(r.from.slice(0, -1)) === 0 : r.from === p)[0] || null;
/* 화면이 부르는 상대경로를 실제 주소로 편다 — 경로가 바뀌어도 따라간다 */
const GUIDE = fs.readFileSync(DIR + '/index.html', 'utf8');
const relM = GUIDE.match(/SUPA_SQL_FILE\s*=\s*'([^']+)'/);
is(!!relM, '  화면이 부르는 주소를 읽었다 — ' + ((relM && relM[1]) || '(못 읽음)'));
if (relM) {
  const abs = new URL(relM[1], 'http://x/' + DIR + '/').pathname;
  const hit = firstRule(abs);
  is(fs.existsSync(abs.slice(1)), '  그 주소에 파일이 <b>정말 있다</b> — ' + abs);
  is(!(hit && /404/.test(hit.st)),
     '  _redirects 가 그 주소를 <b>안 막는다</b> — ' +
     (hit ? '걸리는 규칙 「' + hit.from + ' → ' + hit.st + '」' : '걸리는 규칙 없음(파일 그대로)') +
     (hit && /404/.test(hit.st) ? ' ← 운영에서만 조용히 404 가 납니다' : ''));
}
is(!/마이그레이션 SQL 은 문자열로/.test(RD),
   '  _redirects 주석이 <b>거짓말을 안 한다</b> — 「HTTP 로 안 부른다」 고 적혀 있으면 다음 사람이 이 예외를 지운다');

console.log('\n[3] 새 규칙 — 로그인한 사람만 · 자기 이름으로만');
/* 맨 위 주석이 <b>옛 정책을 그대로 인용</b>한다 — 걷지 않으면 그것을 읽고
   「anon 그대로네」 라고 잘못 답한다. 실제로 처음에 그렇게 틀렸다 (8번). */
const MIG_CODE = nocomment(MIG);
const pol = (n) => (MIG_CODE.match(new RegExp('create policy ' + n + '[\\s\\S]*?;')) || [''])[0];
is(/to authenticated/.test(pol('s_r')), '  점수 읽기 — <b>로그인한 팀원끼리</b> (팀 순위표가 선다)');
is(/to authenticated/.test(pol('s_w')) && /owner_id = auth\.uid\(\)/.test(pol('s_w')),
   '  점수 넣기 — <b>자기 것으로만</b> (owner_id = auth.uid())');
is(!/create policy s_[ud]/.test(MIG),
   '  점수는 <b>고치거나 지울 수 없다</b> — 쌓기만 한다');
is(/to authenticated/.test(pol('bp_r')), '  진도 읽기 — <b>로그인한 팀원끼리</b>');
is(/owner_id = auth\.uid\(\)/.test(pol('bp_u')),
   '  진도 고치기 — <b>본인 줄만</b>');
is(/with check \(owner_id = auth\.uid\(\)\)/.test(pol('bp_u')),
   '  고치고 나면 <b>반드시 본인 것이 된다</b> — 옛 줄이 남의 것으로 안 넘어간다');
/* 옛 줄을 열어 둔 것은 <일부러> 다. 감추지 않고 적어 두었는지 본다 (1번). */
is(/owner_id is null/.test(pol('bp_u')) && /빈틈을 감추지 않고/.test(MIG),
   '  owner_id 가 빈 옛 줄을 <b>왜 열어 두는지</b> 적어 두었다 · 닫는 법도 적었다');
is(/add column if not exists owner_id/.test(MIG),
   '  이미 쌓인 표에도 <b>그대로 돌아간다</b> (add column if not exists)');

console.log('\n[4] 로그인이 없으면 서버를 아예 안 부른다');
is(/function auth\(/.test(SYNC_CODE) && /function need\(/.test(SYNC_CODE),
   '  로그인 확인이 <b>한 곳</b>에 있다 (auth · need)');
['check', 'pushScore', 'pushProgress', 'pullTeam', 'pullProgress', 'pushAllLocal'].forEach(fn => {
  const body = (SYNC_CODE.match(new RegExp('function ' + fn + '\\([\\s\\S]*?\\n\\}')) || [''])[0];
  is(/need\(\)/.test(body), '  ' + fn + ' 이 <b>먼저 로그인을 본다</b>');
});
is(!/Authorization[^\n]*Bearer\s*'\s*\+\s*CFG\.key/.test(SYNC_CODE),
   '  <b>anon 키로 서버에 안 간다</b> — 토큰으로만 간다');

console.log('\n[5] 로그인하면 다시 붙는다 · 만료된 토큰은 없는 것으로 친다');
is(/STATE\.ok\s*=\s*null/.test(SYNC_CODE) && /NOLOGIN/.test(SYNC_CODE),
   '  로그인 때문에 박아 둔 실패만 <b>지우고 다시 시도한다</b>');
is(/expires_at/.test(SYNC_CODE),
   '  <b>만료된 토큰</b>은 없는 것으로 친다 — 들고 있다 말없이 실패하지 않는다');
is(/base64-/.test(SYNC_CODE), '  세션을 base64 로 담아 두는 판도 읽는다');

console.log('\n[6] 안 되는 이유를 화면이 말한다 (1번)');
is(/로그인해야 팀 취합이 됩니다/.test(SYNC),
   '  <b>「로그인해야 팀 취합이 됩니다」</b> — 조용히 안 되지 않는다');
is(/이 기기에는 그대로 저장됩니다/.test(SYNC),
   '  그래도 <b>이 기기에는 저장된다</b>고 알려 준다 — 공부한 것이 날아간 줄 아신다');

/* ── 여기부터는 실제로 돌려 본다 ─────────────────────────────────
   글자만 찾으면 「부르긴 하는데 토큰을 안 달았다」를 못 본다.
   가짜 Supabase 를 세우고 무엇이 오는지 받아 본다. */
console.log('\n[7] 실제로 — 토큰을 달고 가는가 · owner_id 를 담는가');
const got = [];
const api = http.createServer((rq, rs) => {
  let body = '';
  rq.on('data', d => { body += d; });
  rq.on('end', () => {
    /* 다른 주소라 브라우저가 <b>예비 요청(OPTIONS)</b>을 먼저 보낸다. 그것은
       Authorization 도 본문도 없다 — 본 요청으로 세면 「토큰을 안 달았다」로
       잘못 읽는다. 실제로 처음에 그렇게 틀렸다. 그래서 방식까지 적어 둔다. */
    got.push({ method: rq.method, path: rq.url,
               auth: rq.headers.authorization || '', key: rq.headers.apikey || '',
               body: body });
    rs.writeHead(200, { 'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': '*' });
    rs.end('[]');
  });
});
await new Promise(r => api.listen(0, r));
const API = 'http://127.0.0.1:' + api.address().port;

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});
await new Promise(r => srv.listen(0, r));
const SITE = 'http://127.0.0.1:' + srv.address().port;

const browser = await chromium.launch();
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 180)));
await page.goto(SITE + '/' + DIR + '/sync.js', { waitUntil: 'domcontentloaded' });
/* 견본 이름은 홍길동 (CLAUDE.md 3번) */
await page.goto(SITE + '/app/index.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
await page.setContent('<!doctype html><meta charset="utf-8"><title>t</title>');

const R = await page.evaluate(async ({ src, api }) => {
  const O = {};
  /* 페이지 쪽에서도 센다 — 서버에 닿기 전에 몇 번 불렀는지가 여기서만 정확하다 */
  let calls = 0;
  const realFetch = window.fetch;
  window.fetch = function () { calls++; return realFetch.apply(this, arguments); };
  const put = (v) => localStorage.setItem('sb-127-auth-token', JSON.stringify(v));
  /* ① 로그인 없이 */
  localStorage.clear();
  eval(src.replace(/url\s*:\s*'[^']*'/, "url:'" + api + "/'"));
  O.noLogin = { ok: await SYNC.pushScore({ name: '홍길동', id: 's1', n: '세트', cat: 'c',
                                           score: 8, max: 10, pct: 80, wrong: [] }),
                msg: SYNC.state.msg, who: SYNC.who() };
  await SYNC.check(); await SYNC.pullTeam(); await SYNC.pullProgress();
  O.callsBefore = calls;
  /* ② 만료된 토큰 */
  put({ access_token: 'OLD', expires_at: Math.floor(Date.now() / 1000) - 60, user: { id: 'u1' } });
  O.expired = { who: SYNC.who() };
  /* ③ 살아 있는 토큰 */
  put({ access_token: 'GOOD', expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: 'u1' } });
  O.live = { who: SYNC.who(), ok: await SYNC.pushScore({ name: '홍길동', id: 's1', n: '세트', cat: 'c',
                                                        score: 8, max: 10, pct: 80, wrong: [] }) };
  await SYNC.pushProgress('홍길동', { a: 1 });
  return O;
}, { src: fs.readFileSync(DIR + '/sync.js', 'utf8'), api: API });

is(R.noLogin.ok === false && !R.noLogin.who,
   '  로그인 <b>없이는 안 보낸다</b>');
is(/로그인해야/.test(R.noLogin.msg || ''),
   '  그때 화면에 적히는 말 — 「' + (R.noLogin.msg || '').slice(0, 34) + '…」');
is(R.callsBefore === 0,
   '  로그인 전에는 점수 보내기·확인·팀조회·진도조회 <b>넷 다 서버를 안 불렀다</b> — ' +
   R.callsBefore + '번');
is(!R.expired.who, '  <b>만료된 토큰</b>은 없는 것으로 쳤다');
is(!!R.live.who && R.live.who.uid === 'u1', '  살아 있는 토큰으로는 <b>로그인한 것으로 본다</b>');
const posts = got.filter(g => g.method === 'POST');
is(posts.length >= 2, '  로그인 뒤에 <b>실제로 보냈다</b> — 본 요청 ' + posts.length + '번');

const sent = posts.filter(g => /bohum_scores/.test(g.path))[0];
is(!!sent, '  점수가 bohum_scores 로 갔다');
if (sent) {
  is(sent.auth === 'Bearer GOOD',
     '  <b>사람의 토큰</b>을 달고 갔다 — anon 키가 아니다 · ' + sent.auth.slice(0, 12) + '…');
  is(sent.key && sent.key !== 'GOOD', '  apikey 자리에는 anon 키가 그대로 있다 (PostgREST 가 요구한다)');
  let row = null; try { row = JSON.parse(sent.body); } catch (e) {}
  is(row && row.owner_id === 'u1',
     '  <b>owner_id 를 담아 보냈다</b> — 안 담으면 서버 규칙이 통째로 거절한다 · ' +
     ((row && row.owner_id) || '(없음)'));
  is(row && row.name === '홍길동', '  견본 이름은 홍길동이다 (3번)');
}
const prog = posts.filter(g => /bohum_progress/.test(g.path))[0];
is(!!prog && /"owner_id":"u1"/.test(prog.body || ''), '  진도에도 owner_id 를 담는다');

/* ── 파일이 열리는 것만으로는 부족했다 ────────────────────────────────
   주소가 200 이어도 <b>화면 칸에 안 들어가면</b> 사장님 눈에는 똑같이
   「못 받았습니다」다. 실제로 그랬다 — 가이드를 <b>주소로 바로</b> 여시면
   칸을 그릴 때 SQL 이 아직 안 와 있고, 나중에 도착해도 아무도 칸을 다시
   안 채웠다. 다른 화면을 거쳐 오면 되고 바로 열면 안 되는 화면이었다.
   그래서 여기서는 <b>주소로 바로 여는 쪽</b>을 본다 — 안 되던 쪽이다. */
console.log('\n[7-1] 가이드를 주소로 바로 열어도 SQL 이 칸에 들어온다');
const g = await browser.newPage();
const gerr = [];
g.on('pageerror', e => gerr.push(String(e).slice(0, 140)));
await g.goto(SITE + '/' + DIR + '/index.html#GUIDE', { waitUntil: 'domcontentloaded' });
await g.waitForTimeout(3500);
const G = await g.evaluate(() => {
  const ta = document.getElementById('sqlbox');
  const v = ta ? ta.value : '';
  /* 파일 머리 주석이 <b>옛 정책을 그대로 인용</b>한다 — 걷지 않으면 그것을 읽고
     「anon 그대로네」 라고 잘못 답한다. [3] 이 이미 겪은 자리다 (8번). */
  const code = v.replace(/\/\*[\s\S]*?\*\//g, ' ');
  return { box: !!ta, len: v.length, pol: (code.match(/create policy/g) || []).length,
           anon: /to anon/.test(code) };
});
await g.close();
is(G.box, '  운영 가이드에 SQL 칸이 <b>있다</b>');
is(G.pol > 0,
   '  주소로 바로 열어도 <b>SQL 이 칸에 들어와 있다</b> — 정책 ' + G.pol + '개 · ' + G.len + '자' +
   (G.pol ? '' : ' ← 늦게 온 SQL 을 아무도 칸에 안 넣습니다'));
is(!G.anon, '  칸에 들어온 SQL 에 <b>익명(to anon) 정책이 없다</b> — 엉뚱한 파일을 읽지 않았다');
is(gerr.length === 0, '  그 화면에서 터진 곳이 없다' + (gerr.length ? ' — ' + gerr[0] : ''));
/* 기다림에는 시간 제한이 있어야 한다 — 답이 영영 안 오면 스피너만 돈다 (4-1) */
const GUI = fs.readFileSync(DIR + '/index.html', 'utf8');
const wms = (GUI.match(/SUPA_SQL_WAIT_MS\s*=\s*(\d+)/) || [])[1];
is(wms && +wms >= 3000 && +wms <= 30000,
   '  SQL 을 기다리는 데 <b>시간 제한</b>이 있다 — ' + (wms ? wms + 'ms' : '없음') +
   ' (3~30초 사이여야 한다)');

/* ── 「Run 눌렀는데 됐나?」 에 화면이 답해야 한다 ────────────────────
   2026-08-29 에 실제로 이랬다 — 사장님이 「sql실행했다」 하셨는데 표는
   그대로 열려 있었다. 앱에 SQL 단추가 여럿이라 다른 것을 돌리셨고,
   <b>화면은 아무 말도 안 했다.</b> 눌러도 됐는지 모르는 단추는 알람이
   아니다 (8번). 그래서 <b>바깥 사람인 척</b> 두드려 보는 단추를 붙였고,
   여기서는 네 가지 상태를 다 만들어 <b>말이 달라지는지</b> 본다. */
console.log('\n[7-2] 「지금 익명에게 열려 있는지」 를 화면이 답한다');
let VMODE = 'nomig', vseen = [];
const vapi = http.createServer((rq, rs) => {
  vseen.push({ auth: rq.headers.authorization || '' });
  const H = { 'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };
  /* 예비 요청(OPTIONS)에는 늘 200 — 진짜 Supabase 도 그렇게 답한다.
     여기에 오류를 주면 앱이 아니라 <b>이 점검</b>이 틀린다. 실제로 그랬다. */
  if (rq.method === 'OPTIONS') { rs.writeHead(200, H); rs.end(''); return; }
  const owner = /select=owner_id/.test(rq.url);
  if (VMODE === 'nomig' && owner) {
    rs.writeHead(400, H);
    rs.end(JSON.stringify({ code: '42703', message: 'column bohum_scores.owner_id does not exist' })); return;
  }
  if (VMODE === 'down') return;                      /* 아무 답도 안 한다 */
  rs.writeHead(200, H);
  rs.end(JSON.stringify(owner ? [{ owner_id: null }]
        : (VMODE === 'open' ? [{ team: 'APEX', name: '홍길동', score: 11 }] : [])));
});
await new Promise(r => vapi.listen(0, r));
const VAPI = 'http://127.0.0.1:' + vapi.address().port;
const VWANT = {
  nomig: [/아직 안 돌았습니다/, '안 돌았으면 <b>안 돌았다</b>고 한다 — owner_id 칸이 없다'],
  open:  [/아직 익명에게 열려 있습니다/, '열려 있으면 <b>열렸다</b>고 한다 — 로그인 없이 읽혔다'],
  shut:  [/닫힌 것으로 보입니다/, '닫혔으면 <b>닫힌 것으로 보인다</b>고 한다 (단정하지 않는다 — 1번)'],
  down:  [/확인하지 못했습니다/, '못 물어봤으면 <b>모른다</b>고 한다 — 조용히 「괜찮다」 하지 않는다']
};
let vtok = 0;
for (const m of ['nomig', 'open', 'shut', 'down']) {
  VMODE = m; vseen = [];
  const vp = await browser.newPage();
  await vp.goto(SITE + '/' + DIR + '/index.html#GUIDE', { waitUntil: 'domcontentloaded' });
  await vp.waitForTimeout(2200);
  await vp.evaluate((api) => {
    SYNC.cfg.url = api; SYNC.cfg.key = 'ANONKEY';
    /* <b>로그인해 둔 채로</b> 눌러도 토큰을 붙이면 안 된다 — 바깥 사람 자격이라야
       「바깥에서 보이나」를 잰다. 붙이면 늘 「안 열렸다」 로 나온다. */
    try { localStorage.setItem('sb-127-auth-token', JSON.stringify(
      { access_token: 'SECRET', expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: 'u1' } })); } catch (e) {}
    document.getElementById('sqlVerifyBtn').click();
  }, VAPI);
  await vp.waitForTimeout(m === 'down' ? 14000 : 1600);
  const say = await vp.evaluate(() => {
    const b = document.getElementById('sqlmsg');
    return { cls: b.className, t: (b.textContent || '').replace(/\s+/g, ' ').trim() };
  });
  await vp.close();
  vtok += vseen.filter(s => s.auth).length;
  is(VWANT[m][0].test(say.t), '  ' + VWANT[m][1] + ' — 「' + say.t.slice(0, 30) + '…」');
  is(m === 'shut' ? /ok/.test(say.cls) : /no/.test(say.cls),
     '  ' + m + ' — 색이 맞다 (' + say.cls.replace('setupmsg ', '') + ')');
}
is(vtok === 0,
   '  네 판 모두 <b>로그인 토큰을 안 달고</b> 물었다 — 달면 늘 「안 열렸다」 가 나온다 · ' + vtok + '건');
vapi.close();
const VSRC = fs.readFileSync(DIR + '/index.html', 'utf8');
const vms = (VSRC.match(/SQLV_WAIT_MS\s*=\s*(\d+)/) || [])[1];
is(vms && +vms >= 3000 && +vms <= 30000,
   '  두드리는 데 <b>시간 제한</b>이 있다 — ' + (vms ? vms + 'ms' : '없음') + ' (4-1)');
is(!/링크를 아는 사람은 점수를 넣을 수 있다/.test(VSRC),
   '  보안 메모가 <b>옛말을 안 한다</b> — 이제 로그인한 사람만 넣을 수 있다');

console.log('\n[8] 콘솔이 조용하다');
is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

await browser.close(); srv.close(); api.close();
console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '개 — 교재 점수판이 바깥에 열려 있을 수 있습니다')
                : '✓ 로그인한 사람만 · 자기 이름으로만 · 안 되면 이유를 말합니다');
process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
