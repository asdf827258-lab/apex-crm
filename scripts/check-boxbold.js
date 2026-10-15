/* ══════════════════════════════════════════════════════════════════
   check-boxbold.js — <b>칸 안 굵은 글씨</b>가 읽히나. (판 X111 · 2026-10-15)

   고객 365일을 열면 다 하신 날에 <b>초록 칸</b>이 섭니다 —
     ✅ <b>오늘 챙길 분이 없습니다.</b> 주기가 돌아온 고객을 다 도셨습니다.
   그런데 <b>굵은 글씨만 호박색</b>이었습니다. 두 가지가 한꺼번에 틀립니다 —
     ① 다 됐다는 말이 <b>경고처럼</b> 읽힙니다.
     ② #D97706 을 연한 초록(#ECFDF5) 위에 올리면 대비가 <b>3.0</b> 입니다.
        노트북에서 안 읽힙니다.

   까닭은 <b>색을 정하는 자리가 둘</b>이었습니다 (5번) —
     .notice b{color:var(--t-warn-d2)}          #7A4E0A · 6.8  ← 맞는 것
     .t-skin .notice b{color:var(--t-warn)}     #D97706 · 3.0  ← 무게로 이김
   뒤엣것 쪽지에 <b>「#92400E」</b> 라고 적혀 있었습니다. <b>진한</b> 호박을
   적으려다 <b>연한</b> 이름을 쓴 것입니다 — 이름이 거짓말하면 부르는 쪽이
   틀립니다 (4번의 그 교훈).

   ★ 이 자는 <b>굵은 글씨만</b> 봅니다. 칸 자신의 글자색(.notice 가 --warn 을
     쓰는 것)은 <b>목각 색</b>이라 check-onepal 의 봐주는색짝에 적혀 있고,
     고치는 길은 화면 92개가 목각 옷을 못 입은 것과 같은 일입니다(대장 X02).
     여기서 <b>넓게 잡지 않습니다</b> (8번).
   ⚠ check-onepal 도 이 짝을 잡습니다 — 다만 <b>그 칸이 서는 날</b>에만
     보입니다(날마다 내용이 바뀝니다). 그래서 이 자는 <b>칸을 직접 세워</b>
     언제 돌려도 같은 답이 나오게 합니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9111;
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
/* 쪽지(/* … *\/)는 뺍니다 — 쪽지에 적힌 옛 규칙을 살아 있는 규칙으로 세지 않습니다 */
const CSS = SRC.replace(/\/\*[\s\S]*?\*\//g, '');

console.log('\n[1] <b>칸 안 굵은 글씨 색을 정하는 자리가 하나</b>인가 (5번)');
{
  const 줄 = CSS.split('\n').filter(l => /\.notice\s+b\s*\{[^}]*color\s*:/.test(l));
  is(줄.length === 1,
     '  ★★ <b>.notice b 의 색을 정하는 규칙이 한 줄</b> — 지금 ' + 줄.length + '줄' +
     (줄.length !== 1 ? ('\n      ✗ ' + 줄.map(l => l.trim().slice(0, 90)).join('\n      ✗ ') +
        '\n      → 둘이면 무게가 센 쪽이 이깁니다. 한 줄만 두십시오 (5번).') : ''));
  const 한줄 = (줄[0] || '').trim();
  is(/color\s*:\s*var\(--t-warn-d2\)/.test(한줄),
     '  ★ 그 한 줄이 <b>--t-warn-d2</b>(굵은 글씨용 진한 호박)를 쓴다 — ' + (한줄.slice(0, 70) || '(없음)'));
  is(!/\.notice\s+b\s*\{[^}]*color\s*:\s*#/.test(CSS),
     '  굵은 글씨 색을 <b>손 hex</b> 로 박은 자리가 없다 (색표는 한 벌 · 5번)');
  is(!/\.t-skin\s+\.notice\s+b\s*\{/.test(CSS),
     '  ★★ <b>.t-skin .notice b 가 돌아오지 않았다</b> — 그 줄이 3.0 을 입혔습니다');
}

console.log('\n[2] 앱이 <b>정말 그런 칸을 세우나</b> — 지어낸 견본이 아닙니다 (1번)');
const 초록꼴 = 'background:var(--t-pos-l);border-color:#BBF7D0;color:var(--t-pos-d)';
{
  const n = SRC.split(초록꼴).length - 1;
  is(n >= 1, '  ★ <b>초록 칸</b>(--t-pos-l 바탕 · --t-pos-d 글씨)을 세우는 자리가 ' + n + '곳 — 아래에서 그 꼴로 재어 봅니다');
  const b = (SRC.match(/class="notice"[^<]*<b>/g) || []).length;
  is(b >= 10, '  ★ 칸 안에 <b>굵은 글씨</b>를 적는 자리가 ' + b + '곳 — 한 줄을 고치면 이 전부가 같이 바뀝니다');
}

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  /* ★ <b>바깥을 막습니다</b> — 점검이 사장님 진짜 서버를 읽지 않습니다.
     막은 것은 <b>끊습니다</b>(abort) — 기다리게 두면 돌릴 때마다 다른
     순간을 재게 됩니다. check-netblock 이 이 자리를 봅니다. */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                  ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2200);
  await p.evaluate(() => {
    try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
    ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients','osCliInfoLoad',
     'osRepListLoad','osLoadAnalysis','toast'].forEach(k => { window[k] = function(){}; });
    try { OS.profile = {id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true}; } catch(e){}
    try { osHideLoginGate(); } catch(e){}
  });
  /* ★ 목각 옷을 입은 화면에서 재야 합니다 — 안 입은 화면에서 재면 바로 그
     규칙이 안 닿아 <b>0개를 재고 통과</b>합니다 (8번). */
  await p.evaluate(() => { try { go('clients'); } catch(e){} });
  await p.waitForTimeout(900);

  console.log('\n[3] 재어 봅니다 — 칸을 <b>직접 세워</b> 날짜와 무관하게');
  const R = await p.evaluate(꼴 => {
    const dp = document.getElementById('dynPane');
    const 옷 = !!(dp && dp.classList.contains('t-skin'));
    const box = document.createElement('div');
    box.className = 'card';
    box.innerHTML = '<div class="card-body">' +
      '<div class="notice" id="bb1">✅ <b id="bb1b">보통 칸입니다</b> 뒤에 붙는 글입니다.</div>' +
      '<div class="notice" id="bb2" style="' + 꼴 + '">✅ <b id="bb2b">초록 칸입니다</b> 뒤에 붙는 글입니다.</div>' +
      '</div>';
    (dp || document.body).appendChild(box);
    const num = s => ((s||'').match(/[\d.]+/g) || [0,0,0]).slice(0,3).map(Number);
    const lum = c => { const f = x => { x/=255; return x<=.03928 ? x/12.92 : Math.pow((x+.055)/1.055,2.4); };
      return .2126*f(c[0]) + .7152*f(c[1]) + .0722*f(c[2]); };
    const cr = (a,b) => { const L=lum(a), M=lum(b); return Math.round(((Math.max(L,M)+.05)/(Math.min(L,M)+.05))*100)/100; };
    const hex = c => '#'+c.map(x=>Math.round(x).toString(16).padStart(2,'0')).join('').toUpperCase();
    const 재기 = (bid, pid) => {
      const e = document.getElementById(bid), pe = document.getElementById(pid);
      const fg = num(getComputedStyle(e).color), bg = num(getComputedStyle(pe).backgroundColor);
      return { 글:hex(fg), 바탕:hex(bg), 대비:cr(fg,bg), 굵기:getComputedStyle(e).fontWeight };
    };
    const out = { 옷:옷, 보통:재기('bb1b','bb1'), 초록:재기('bb2b','bb2'),
                  초록칸글:(() => { const pe=document.getElementById('bb2');
                    const fg=num(getComputedStyle(pe).color), bg=num(getComputedStyle(pe).backgroundColor);
                    return { 글:hex(fg), 바탕:hex(bg), 대비:cr(fg,bg) }; })() };
    box.remove();
    return out;
  }, 초록꼴);

  is(R.옷, '  ★★ 재는 화면이 <b>목각 옷(.t-skin)을 입고</b> 있다 — 안 입었으면 그 규칙이 안 닿아 <b>헛통과</b>합니다 (8번)');
  is(R.초록.대비 >= 4.5,
     '  ★★ <b>초록 칸</b>의 굵은 글씨가 읽힌다 — ' + R.초록.글 + ' on ' + R.초록.바탕 + ' · 대비 <b>' + R.초록.대비 + '</b> (4.5 이상)');
  is(R.초록.글 !== '#D97706',
     '  ★★ 초록 칸의 굵은 글씨가 <b>연한 호박이 아니다</b> — 지금 ' + R.초록.글 + ' (#D97706 이면 그 사고가 돌아온 것입니다)');
  is(R.보통.대비 >= 4.5,
     '  ★ <b>보통 칸</b>(연한 호박 바탕)의 굵은 글씨도 읽힌다 — ' + R.보통.글 + ' on ' + R.보통.바탕 + ' · 대비 <b>' + R.보통.대비 + '</b>');
  is(+R.초록.굵기 >= 700, '  굵은 글씨로 재었다 — 무게 ' + R.초록.굵기);
  console.log('  · 초록 칸 자신의 글자 — ' + R.초록칸글.글 + ' on ' + R.초록칸글.바탕 + ' · 대비 ' + R.초록칸글.대비 +
              ' (칸 자신의 색은 <b>이 자가 안 봅니다</b> — check-onepal 의 봐주는색짝 쪽입니다)');

  console.log('\n[4] 조용히 터지지 않았나');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ('\n      ✗ ' + errs.slice(0,3).join('\n      ✗ ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 다 초록');
  process.exit(bad ? 1 : 0);
})();
