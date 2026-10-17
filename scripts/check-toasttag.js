/* ══════════════════════════════════════════════════════════════════
   check-toasttag.js — 알림 줄(toast)에 <b>태그가 글자로 찍히지 않나</b>. (판 X122 · 2026-10-17)

   아침 보고에서 AI 가 한 명을 못 만들면 아래 줄이 뜹니다 —
     <b>1명 중 0명</b> 준비됐습니다 — <b>1명은 AI 가 답하지 않아 …</b>
   태그가 <b>글자 그대로</b> 찍혔습니다. toast 가 textContent 로 넣는데,
   부르는 자리 열 곳 넘게가 <b>…</b> 를 넘기고 있었습니다.

   고친 자리는 <b>받는 곳 하나</b>(toastFill)입니다 (5번). 그래서 이 자도
   부르는 자리를 세지 않고 <b>toast 를 직접 불러</b> 찍힌 것을 봅니다.

   ★ innerHTML 로 고치면 이 자가 울립니다 — 고객 이름이 날글로 섞여 오는
     자리가 있어, 태그를 그대로 믿으면 안 됩니다 (3번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9127;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});

const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');

console.log('\n[1] <b>정말 태그를 넘기는 자리가 있나</b> — 지어낸 견본이 아닙니다 (1번)');
{
  const n = (SRC.match(/toast\('[^'\n]*<b>/g) || []).length;
  is(n >= 5, '  ★ toast 에 <b>…</b> 를 넘기는 자리가 ' + n + '곳 — 받는 곳 하나를 고치면 이 전부가 같이 낫습니다');
  is(/function arDoneMsg\([^)]*\)\{[\s\S]{0,400}'<b>'/.test(SRC),
     '  아침 보고의 「몇 명 중 몇 명」 줄(arDoneMsg)이 <b>를 넘긴다 — 사장님이 보신 그 줄');
  is(!/function toast\(msg,ms\)\{[^}]*\.innerHTML\s*=\s*msg/.test(SRC),
     '  ★★ toast 가 innerHTML 로 <b>날글을 그대로</b> 넣지 않는다 (3번)');
}

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  /* 바깥을 막습니다 — 점검이 사장님 진짜 서버를 읽지 않습니다 (check-netblock) */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                  ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2200);

  const say = (msg) => p.evaluate(m => {
    toast(m, 60000);
    const t = document.getElementById('toast');
    return { text: t.textContent, html: t.innerHTML,
             tags: Array.prototype.map.call(t.querySelectorAll('*'), x => x.tagName),
             attrs: Array.prototype.reduce.call(t.querySelectorAll('*'), (a, x) => a + x.attributes.length, 0) };
  }, msg);

  console.log('\n[2] <b>사장님이 보신 그 줄</b> — 아침 보고에서 한 명이 빠졌을 때');
  {
    const msg = await p.evaluate(() => arDoneMsg(0, 1, 1, '팀원 관리'));
    const r = await say(msg);
    is(r.text.indexOf('<b>') < 0 && r.text.indexOf('</b>') < 0,
       '  ★★ 찍힌 글에 <b>「<b>」 가 글자로 안 보인다</b> — 「' + r.text.slice(0, 50) + '…」');
    is(r.text.indexOf('1명 중 0명') >= 0 && r.text.indexOf('AI 가 답하지 않아') >= 0,
       '  말은 한 글자도 안 빠졌다 — 「1명 중 0명」 · 「AI 가 답하지 않아」');
    is(r.tags.filter(x => x === 'B').length === 2, '  ★ 굵게 쓴 두 곳이 <b>정말 굵게</b> 선다 — B ' + r.tags.filter(x => x === 'B').length + '개');
  }

  console.log('\n[3] <b>태그를 믿지 않는다</b> — 날글로 섞여 오는 이름 (3번)');
  {
    const r = await say('<img src="x" onerror="window.__tx=1">홍길동<script>window.__ty=1<\/script> 님');
    await p.waitForTimeout(400);
    const fired = await p.evaluate(() => [window.__tx, window.__ty]);
    is(r.tags.length === 0, '  ★★ img·script 가 <b>요소로 서지 않는다</b> — ' + (r.tags.join(',') || '없음'));
    is(fired[0] === undefined && fired[1] === undefined, '  ★★ 안에 든 것이 <b>돌지 않는다</b>');
    is(r.text === '홍길동 님', '  이름 글자는 남고 script 속 글은 찍히지 않는다 — 「' + r.text + '」');
    const r2 = await say('<b onclick="window.__tz=1" style="color:red" class="x">굵게</b>');
    is(r2.tags.join() === 'B' && r2.attrs === 0, '  ★ 살리는 b 에도 <b>속성은 하나도</b> 안 옮긴다 — 속성 ' + r2.attrs + '개');
  }

  console.log('\n[4] <b>글자만 있는 줄은 그대로</b> — 헛것을 만들지 않습니다 (8번)');
  {
    is((await say('김&amp;박 님')).text === '김&박 님', '  osEsc 를 지난 이름(&amp;)은 <b>한 번만</b> 풀린다');
    is((await say('a < b 일 때')).text === 'a < b 일 때', '  「<」 가 든 보통 글은 그대로');
    is((await say('저장했습니다')).text === '저장했습니다', '  태그 없는 글은 그대로');
    is((await say('첫 줄<br>둘째 줄')).tags.join() === 'BR', '  <br> 은 줄바꿈으로 선다');
  }

  is(errs.length === 0, '\n  화면에 에러가 없다' + (errs.length ? ' — ' + errs[0].slice(0, 100) : ''));
  await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '곳이 틀렸습니다') : '\n✓ 알림 줄 — 태그가 글자로 안 찍히고, 날글 태그는 믿지 않습니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('점검 중 오류:', e.message); process.exit(1); });
