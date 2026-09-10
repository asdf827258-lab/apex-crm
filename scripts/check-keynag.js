#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   되는 것을 또 하라고 하지 않는다 — 키 안내

   AI 는 앱이 켜질 때 회사 프록시로 <b>저절로 붙습니다</b>. 그런데 홈에서
   매번 열리는 빠른 가이드가 그것과 상관없이 「설정 → 내 API 키를 넣으면…」
   을 늘 띄웠습니다. 이미 되는 것을 또 하라고 하니 <b>안 되는 줄 아십니다.</b>

   「실패를 성공처럼 말하지 않는다」의 반대편입니다 — <b>되는 것을 안 되는
   것처럼 말하지도 않습니다</b> (1번).

   지키는 것 셋
     ① 붙어 있으면 <b>붙어 있다고</b> 말한다 — 키를 넣으라 하지 않는다
     ② 정말 안 붙었을 때는 <b>넣으시라고</b> 말한다 — 숨기지 않는다
     ③ 「지금 붙어 있나」를 답하는 자리가 하나다 (5번)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8834;
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
               '.png': 'image/png', '.svg': 'image/svg+xml' };
const STUB = `window.supabase={createClient:function(){var mk=function(){var a={select:function(){return a},
 eq:function(){return a},order:function(){return a},limit:function(){return a},single:function(){return a},
 in:function(){return a},gte:function(){return a},lte:function(){return a},is:function(){return a},
 neq:function(){return a},not:function(){return a},range:function(){return a},insert:function(){return a},
 update:function(){return a},upsert:function(){return a},
 then:function(r){return Promise.resolve({data:[],error:null}).then(r)}};a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
 storage:{from:function(){return {upload:function(){return Promise.resolve({})},getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
 auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'t',email:'t@t'}}}})},
  getUser:function(){return Promise.resolve({data:{user:{id:'t'}}})},
  onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
  signOut:function(){return Promise.resolve({})}}};}};`;
function serve() {
  return http.createServer((rq, rs) => {
    let p = decodeURIComponent(rq.url.split('?')[0].split('#')[0]);
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
    rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(rs);
  }).listen(PORT);
}

(async () => {
  const srv = serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  await pg.addInitScript(STUB);
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof aiReady === 'function' && typeof osGuideAiRow === 'function', { timeout: 60000 });
  await pg.waitForTimeout(600);

  head('[1] 앱이 켜지면 AI 가 <b>저절로 붙는다</b>');
  const st = await pg.evaluate(() => ({
    ready: aiReady(), auto: isAutoConnected(), conn: getConn(), proxy: getProxy(),
    pill: (document.getElementById('keyPillTxt') || {}).textContent
  }));
  is(st.ready, 'aiReady() 가 <b>참</b>이다 — 회사 프록시로 붙어 있다');
  is(st.auto && st.conn === 'proxy' && !!st.proxy, '자동 연결이 <b>실제로 걸려</b> 있다 — ' + st.conn + ' ' + st.proxy);
  is(/연결됨/.test(st.pill || ''), '서랍 아래 딱지가 <b>「연결됨」</b>이라고 적는다 — ' + st.pill);

  head('[2] 붙어 있으면 <b>키를 넣으라 하지 않는다</b>');
  const on = await pg.evaluate(() => {
    const r = osGuideAiRow();
    return { ic: r[0], t: r[1], d: r[2], body: osQuickGuideBody() };
  });
  is(!/키를 넣으면|키에 키를 넣으시면|넣으면 공용 한도가 차도/.test(on.t + on.d.replace(/그때만[\s\S]*$/, '')),
     '<b>「키를 넣으세요」로 시작하지 않는다</b>');
  is(/이미 연결/.test(on.t), '제목이 <b>「이미 연결돼 있습니다」</b>다 — ' + on.t);
  is(/따로 키를 넣지 않으셔도 됩니다/.test(on.d), '<b>안 넣어도 된다</b>고 못 박는다');
  is(on.ic === '✅', '딱지가 <b>✅</b> 다 — 🔑 는 「할 일이 남았다」로 읽힌다');
  is(/한도/.test(on.d), '언제는 넣으면 좋은지도 <b>같이</b> 적는다 — 숨기지 않는다');
  is(!/설정 → "내 API 키"를 넣으면 공용 한도가 차도/.test(on.body),
     '가이드 본문에 <b>옛 재촉 줄이 안 남았다</b>');

  head('[3] 정말 안 붙었으면 <b>넣으시라고</b> 말한다');
  const off = await pg.evaluate(() => {
    const rc = claudeReady, rg = geminiReady;
    window.claudeReady = function () { return false };
    window.geminiReady = function () { return false };
    const r = osGuideAiRow();
    window.claudeReady = rc; window.geminiReady = rg;
    return { ic: r[0], t: r[1], d: r[2] };
  });
  is(off.ic === '🔑' && /필요/.test(off.t), '안 붙었을 때는 <b>🔑 · 「연결이 필요합니다」</b> — ' + off.t);
  is(/설정/.test(off.d) && /넣으시면|넣으면/.test(off.d), '<b>어디서 무엇을</b> 하면 되는지 적는다');

  head('[1-1] 알약은 <b>확인하기 전에</b> 「미설정」이라고 단정하지 않는다');
  /* 서랍 아래 알약은 <b>모든 화면</b>에 서 있습니다. 첫 그림에서 「API 키
     미설정」 이라고 박아 두면, 붙는 데 걸리는 그 잠깐 동안 매번 그 말이
     스칩니다 — 사장님이 「자꾸 키 넣으라고 뜬다」 고 하신 자리입니다.
     아직 모르는 것을 「없다」 로 적으면 안 됩니다 (1번).               */
  is(!/id="keyPillTxt">[^<]*미설정/.test(SRC),
     'HTML 에 <b>「미설정」이 박혀 있지 않다</b> — 확인 전에는 단정하지 않는다');
  is(/id="keyPillTxt">[^<]*확인 중/.test(SRC),
     '처음에는 <b>「확인 중」</b>으로 선다 — 사장님이 하실 일이 없는 동안 재촉하지 않는다');

  /* 붙는 중(자동 연결이 걸려 있으나 아직 대답 전)에도 재촉하지 않는다 */
  const mid = await pg.evaluate(() => {
    const rc = claudeReady, rg = geminiReady;
    window.claudeReady = function () { return false };
    window.geminiReady = function () { return false };
    updateKeyPill();
    const t = (document.getElementById('keyPillTxt') || {}).textContent;
    window.claudeReady = rc; window.geminiReady = rg;
    updateKeyPill();
    return { mid: t, back: (document.getElementById('keyPillTxt') || {}).textContent };
  });
  is(/확인 중/.test(mid.mid),
     '저절로 붙는 중이면 <b>「확인 중」</b>이라 적는다 — 재촉하지 않는다 (' + mid.mid + ')');
  is(/연결됨/.test(mid.back), '붙고 나면 <b>다시 「연결됨」</b>으로 돌아온다 — ' + mid.back);

  /* 자동 연결이 아예 없으면 그때는 <b>넣으시라고</b> 말해야 한다 — 숨기면 안 된다 */
  const noAuto = await pg.evaluate(() => {
    const rc = claudeReady, rg = geminiReady, ia = isAutoConnected;
    window.claudeReady = function () { return false };
    window.geminiReady = function () { return false };
    window.isAutoConnected = function () { return false };
    updateKeyPill();
    const t = (document.getElementById('keyPillTxt') || {}).textContent;
    window.claudeReady = rc; window.geminiReady = rg; window.isAutoConnected = ia;
    updateKeyPill();
    return t;
  });
  is(/필요/.test(noAuto || ''),
     '붙을 길이 아예 없으면 <b>「연결 필요」</b>라고 말한다 — 숨기지 않는다 (' + noAuto + ')');

  head('[4] 「지금 붙어 있나」를 답하는 자리가 하나다 (5번)');
  ['osGuideAiRow', 'aiReady', 'isAutoConnected'].forEach(f => {
    const c = (SRC.match(new RegExp('function\\s+' + f + '\\s*\\(', 'g')) || []).length;
    is(c === 1, f + '() 가 ' + c + '곳에 있다');
  });
  is(!/\['🔑','한도 백업 키'/.test(SRC), '가이드 표에 <b>키 줄을 박아 두지 않았다</b> — 붙었나 보고 정한다');

  is(errs.length === 0, errs.length ? ('콘솔 에러 ' + errs.length + '건 — ' + errs[0]) : '끝까지 콘솔 에러 <0건>');

  await ctx.close(); await br.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ ' + bad + '가지 빨간불'); process.exit(1); }
  console.log('키 안내 점검 통과 — ' + n + '가지. 되는 것을 또 하라고 하지 않습니다.');
})().catch(e => { console.error(e); process.exit(1); });
