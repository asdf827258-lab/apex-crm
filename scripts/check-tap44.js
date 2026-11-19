/* ══════════════════════════════════════════════════════════════════
   check-tap44.js — <b>폰에서 누르는 자리가 44px 아래로 안 내려가나.</b>
   <b>화면 전부를 한 자리에서 셉니다.</b>
   (판 X488 · 2026-11-19)

   사장님 말씀 — 판 X226 「<b>응 그것도 올려</b>」(글 적는 칸 35개를 44px 로) ·
   판 X238 「<b>응 그것도 고쳐줘</b>」(들어가기 전 화면에 44px 아래가 폰 35 ·
   컴퓨터 29 라고 적어 드린 데 대한 답) · 판 X239 · 판 X243 — <b>네 번</b>
   같은 것을 시키셨습니다.

   ── 왜 이 자가 필요한가 ───────────────────────────────────────────
   44px 를 재는 점검이 이미 <b>42가지</b>나 있습니다. 그런데 저마다
   <b>제 화면만</b> 봅니다 — 「화면 전부에 몇 개 남았나」 를 묻는 자가
   <b>하나도 없었습니다</b> (0-1번 「점검은 저마다 제가 지키려고 만든 것만
   봅니다」).
   그래서 2026-11-19 에 폰 390px 로 화면 105개를 돌며 세어 보니
   44px 아래로 누르는 자리가 <b>332개 · 48개 화면</b>이었습니다 —
     · 글 적는 칸(input[text])   <b>134개</b>  28~36px
     · 보험사 링크(a.lr-go)      <b>87개</b>   32px
     · 숫자 칸(input[number])    <b>75개</b>   28~36px
     · 날짜 칸·칩·링크           36개
   제일 많이 걸린 화면 — ref_jeonsan 76 · fact_find 29 · calc 23 ·
   inv_fund 13 · treatpay 12 · cs_assist 12 · biz_diag 12.
   ★ 까닭은 판 X266 쪽지에 적혀 있었습니다 — 「바닥 두 줄은 button·.btn
     만 보므로 <b>입력칸은 저마다 적어야 합니다</b>」. 저마다 적는다는 것은
     <b>잊을 자리가 200곳이 넘는다</b>는 뜻이고, 209곳이 잊혔습니다 (5번).
   ★ 판 X488 에서 <b>한 곳</b>에 깔았습니다 — @media(max-width:640px) 의
     #dynPane 바닥 묶음. 332 → <b>0</b>.

   ── 재는 법 (헛것을 안 잡게 · 8번) ────────────────────────────────
   ★ <b>누르는 자리만</b> 셉니다 —
     · label 은 <b>입력칸을 품을 때만</b>. 칸 위에 붙은 이름표
       (for= 만 있고 안에 칸이 없는 것)는 설명이라 안 셉니다. 44px 로
       키우면 빈자리만 24px 생깁니다.
     · 체크·라디오·슬라이더는 <b>안 셉니다</b> — 네모가 아니라 감싼 줄이
       누르는 자리이고, 줄은 이미 44px 입니다(판 X266).
   ⚠ 폰 <b>390px</b>(아이폰 폭)에서 잽니다 — 640px 아래에서만 켜지는
     바닥이라 창을 넓혀 재면 이 자가 아무것도 못 봅니다.
   ⚠ 사장님 진짜 서버는 한 번도 안 부릅니다 (7번·8번). 씨앗은
     saydo.js 의 SEED 를 떼어 씁니다 — 두 벌 만들지 않습니다 (5번).

   ── 보는 것 ──────────────────────────────────────────────────────
     [1] ★★ 44px 아래로 누르는 자리가 <b>0개</b> (눈금 TAP_UNDER)
     [2] ★ 자가 <b>눈이 멀지 않았나</b> — 돌아본 화면 수 · 센 누를 자리 수
     [3] ★ 바닥을 <b>한 곳</b>에 깔았나 (소스)
     [4] ★ 옆으로 미는 화면이 없나 — 바닥을 깔다 가로가 터지지 않게
     [5] ★ 조용한가 · <b>서버</b> 요청 0
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd();
const SAY = fs.readFileSync(path.join(ROOT, 'scripts/saydo.js'), 'utf8');
const SEED = (function () {
  const i = SAY.indexOf('const SEED = () => {');
  const j = SAY.indexOf('\n};', i);
  return SAY.slice(SAY.indexOf('{', i) + 1, j);
})();
const 소스 = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');

/* 📏 <b>줄어야 하는 눈금</b> — 늘면 빨간불, 줄이면 여기 수도 같이 내립니다 (0-1번).
     2026-11-19 (판 X488) · 332 → <b>0</b> */
const TAP_UNDER = 0;
/* 📏 화면을 <b>열기만</b> 해서 부르는 <b>바깥 서버가 몇 군데</b>인가 — 늘면 빨간불 ([5] 쪽지)
     2026-11-19 (판 X488) · 화면 105개에 <b>3군데</b> —
       · <...>.supabase.co          bohum_scores 를 anon 열쇠로 (apex-bohum-bridge.js)
       · apex-hb-onecompare.netlify.app  한장 보험료 비교 (남의 사이트를 품은 틀)
       · apex-sangdam-photo.netlify.app  비대면 상담사진 (같은 꼴)
     셋 다 정당합니다 — 자가 전부 막고 「나가려 한 것」 만 셉니다. */
const SRV_HOSTS = 3;
/* 📏 적는 칸 글씨가 16px 아래인 것 — 늘면 빨간불 ([6])
     2026-11-19 (판 X489) · 315개 전부 13px 이었습니다 → <b>0</b> */
const FONT_UNDER = 0;
/* 📏 글자가 잘리는 칸 — 글씨를 키운 값이 아니라 <b>원래</b> 그랬던 둘 ([7])
     긴 주소를 넣는 칸(kijun·academy_notion)이고, 글씨를 키우기 전부터
     그랬습니다 — 재어 확인했습니다. 늘면 빨간불입니다. */
const CLIP_OK = 2;
const 창 = { width: 390, height: 844 };

let bad = 0;
const is = (ok, m) => { if (!ok) bad++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); };
const head = (t) => console.log('\n' + t);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

const 잼 = `(() => {
  const p = document.getElementById('dynPane');
  if (!p) return { 센것: 0, 작은것: [], 옆으로: 0 };
  const vis = e => { const s = getComputedStyle(e), r = e.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05 && r.height > 4 && r.width > 8; };
  let 센것 = 0; const 작은것 = [];
  [].slice.call(p.querySelectorAll('button,[onclick],a[href],[role=button],input,select,textarea,label')).forEach(e => {
    if (!vis(e)) return;
    const tag = e.tagName.toLowerCase(), ty = (e.type || '').toLowerCase();
    /* 누르는 자리만 — 위 머리글의 두 가지 뺌 */
    if (tag === 'label' && !e.querySelector('input,select,textarea')) return;
    if (ty === 'checkbox' || ty === 'radio' || ty === 'range' || ty === 'hidden') return;
    센것++;
    const r = e.getBoundingClientRect();
    if (r.height >= 44) return;
    작은것.push({
      꼴: tag + (e.type ? ('[' + e.type + ']') : '') +
          ((e.className && typeof e.className === 'string') ? ('.' + String(e.className).trim().split(/\\s+/)[0]) : ''),
      h: Math.round(r.height),
      글: (e.innerText || e.title || e.value || e.placeholder || '').replace(/\\s+/g, ' ').trim().slice(0, 18)
    });
  });
  /* ── 📱 <b>적는 칸의 글씨</b>와 <b>글자가 잘리는 칸</b> (판 X489) ──────
     아이폰·아이패드는 16px 아래 칸에 초점이 가면 <b>화면을 확 키웁니다</b>
     (사파리·아이폰 크롬 모두 WebKit). 이 앱의 viewport 에는 maximum-scale
     도 user-scalable=no 도 없어 그 키우기가 그대로 일어납니다.
     ⚠ 글씨를 키우면 <b>좁은 칸에서 글자가 잘립니다</b> — 그래서 둘을
       <b>같이</b> 셉니다. 하나만 보면 다른 하나를 망가뜨립니다. */
  const 작은글 = [], 잘린것 = [];
  [].slice.call(p.querySelectorAll('input,textarea,select')).forEach(e => {
    if (!vis(e)) return;
    const ty = (e.type || '').toLowerCase();
    if (['checkbox','radio','range','hidden','button','submit'].indexOf(ty) >= 0) return;
    const f = parseFloat(getComputedStyle(e).fontSize);
    if (f < 16) 작은글.push({ 꼴: e.tagName.toLowerCase() + '[' + ty + ']', px: Math.round(f * 10) / 10,
      글: String(e.placeholder || e.value || e.name || e.id || '').slice(0, 16) });
    /* 여러 줄 칸은 세로로 늘어나니 가로 잘림을 안 봅니다 */
    if (e.tagName.toLowerCase() !== 'textarea' && e.scrollWidth > e.clientWidth + 2)
      잘린것.push({ 꼴: e.tagName.toLowerCase() + '[' + ty + ']',
        w: Math.round(e.getBoundingClientRect().width), 안: e.scrollWidth, 밖: e.clientWidth,
        값: String(e.value || e.placeholder || '').slice(0, 14) });
  });
  return { 센것: 센것, 작은것: 작은것, 작은글: 작은글, 잘린것: 잘린것,
    옆으로: Math.max(0, Math.round(document.documentElement.scrollWidth - window.innerWidth)) };
})()`;

(async () => {
  console.log('══ 📱 폰에서 누르는 자리 44px 점검 — 화면 전부 (판 X488) ══');

  head('[3] ★ 바닥을 <b>한 곳</b>에 깔았나');
  const 바닥 = /#dynPane input:not\(\[type=checkbox\]\)[^{]*\{[^}]*min-height:44px/.test(소스);
  is(바닥, '  입력칸 바닥이 소스에 있다 — #dynPane input…{min-height:44px}' +
    (바닥 ? '' : ' ← 없습니다. 저마다 적게 되면 또 잊습니다 (5번)'));
  const 링크 = /#dynPane a\.lr-go[^{]*\{[^}]*min-height:44px/.test(소스);
  is(링크, '  네모 링크 바닥도 있다 — a.lr-go·a.iv-chip·a.rd-go');
  const 안쪽 = /@media\(max-width:640px\)/.test(소스);
  is(안쪽, '    640px 아래에서만 켜지는 묶음 안에 있다 (컴퓨터는 안 건드립니다)');

  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: 창, deviceScaleFactor: 1 });
  const 바깥 = [], 터짐 = [];
  /* ⚠ 사장님 진짜 서버를 한 번도 안 부릅니다 (7번) */
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + P) >= 0) return r.continue();
    바깥.push(u); return r.abort();
  });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => 터짐.push(String(e.message || e).slice(0, 100)));
  await pg.goto('http://127.0.0.1:' + P + '/app/index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(2400);
  await pg.evaluate(SEED);
  await pg.waitForTimeout(1100);

  /* 화면 목록은 앱에게 묻습니다 — 여기서 또 적지 않습니다 (5번) */
  const 탭들 = await pg.evaluate(() => {
    const out = [];
    (window.TABS || []).forEach(g => (g.items || []).forEach(t => { if (!t.hide) out.push({ id: t.id, title: t.title }); }));
    return out;
  });

  let 센것 = 0, 옆터짐 = [];
  const 작은것 = [], 작은글 = [], 잘린것 = [];
  for (const t of 탭들) {
    await pg.evaluate((id) => { try { go(id); } catch (e) {} }, t.id);
    await pg.waitForTimeout(620);
    const r = await pg.evaluate(잼);
    센것 += r.센것;
    if (r.옆으로 > 4) 옆터짐.push(t.id + ' +' + r.옆으로 + 'px');
    r.작은것.forEach(x => 작은것.push({ 탭: t.id, 제목: t.title, ...x }));
    r.작은글.forEach(x => 작은글.push({ 탭: t.id, ...x }));
    r.잘린것.forEach(x => 잘린것.push({ 탭: t.id, ...x }));
  }

  head('[1] ★★ 44px 아래로 누르는 자리가 <b>0개</b>인가');
  const 화면수 = new Set(작은것.map(x => x.탭)).size;
  is(작은것.length <= TAP_UNDER,
    '  44px 아래 <b>' + 작은것.length + '개</b> / 화면 ' + 화면수 + '개 · 눈금 ' + TAP_UNDER + '개' +
    (작은것.length > TAP_UNDER ? ' ★ 늘었습니다' :
      (작은것.length < TAP_UNDER ? ' ★ 줄었습니다 — 눈금도 같이 내리십시오 (0-1번)' : '')));
  if (작은것.length) {
    const 꼴별 = {};
    작은것.forEach(x => { (꼴별[x.꼴] = 꼴별[x.꼴] || { n: 0, h: new Set(), 탭: new Set() }); 꼴별[x.꼴].n++; 꼴별[x.꼴].h.add(x.h); 꼴별[x.꼴].탭.add(x.탭); });
    Object.entries(꼴별).sort((a, b) => b[1].n - a[1].n).slice(0, 8).forEach(([k, v]) =>
      console.log('        ' + String(v.n).padStart(4) + '개  ' + k.slice(0, 40).padEnd(42) +
        ' ' + [...v.h].sort((a, b) => a - b).join('·') + 'px   ' + [...v.탭].slice(0, 3).join(' ')));
  }

  head('[2] ★ 자가 <b>눈이 멀지 않았나</b>');
  is(탭들.length >= 90, '    돌아본 화면 <b>' + 탭들.length + '개</b> (90 아래면 이 자가 덜 보는 것입니다)');
  is(센것 >= 300, '    센 누를 자리 <b>' + 센것 + '개</b> (300 아래면 이 자가 덜 보는 것입니다)');

  head('[4] ★ 옆으로 미는 화면이 없나 — 바닥을 깔다 가로가 터지지 않게');
  is(옆터짐.length === 0, '  옆으로 미는 화면 <b>' + 옆터짐.length + '개</b>' +
    (옆터짐.length ? ('\n        ← ' + 옆터짐.slice(0, 5).join(' · ')) : ''));

  head('[6] ★★ 📱 <b>적는 칸의 글씨가 16px 아래로 안 내려가나</b> (판 X489)');
  is(작은글.length <= FONT_UNDER,
    '  16px 아래 <b>' + 작은글.length + '개</b> / 화면 ' + new Set(작은글.map(x => x.탭)).size + '개 · 눈금 ' + FONT_UNDER + '개' +
    (작은글.length > FONT_UNDER ? ' ★ 늘었습니다 — 아이폰에서 칸을 누를 때마다 화면이 확 커집니다' :
      (작은글.length < FONT_UNDER ? ' ★ 줄었습니다 — 눈금도 같이 내리십시오 (0-1번)' : '')));
  if (작은글.length) {
    const g = {};
    작은글.forEach(x => { const k = x.꼴 + ' @' + x.px + 'px'; (g[k] = g[k] || { n: 0, 탭: new Set() }); g[k].n++; g[k].탭.add(x.탭); });
    Object.entries(g).sort((a, b) => b[1].n - a[1].n).slice(0, 6).forEach(([k, v]) =>
      console.log('        ' + String(v.n).padStart(4) + '개  ' + k.padEnd(34) + ' ' + [...v.탭].slice(0, 4).join(' ')));
  }
  const 바닥글 = /#dynPane textarea,#dynPane select\{font-size:max\(16px,1em\) !important\}/.test(소스);
  is(바닥글, '    글씨 바닥이 소스에 <b>한 곳</b> 있다 — font-size:max(16px,1em) !important' +
    (바닥글 ? '' : ' ← !important 가 없으면 .app [style*=…] 의 !important 와 인라인 크기에 집니다'));

  head('[7] ★ 글씨를 키우다 <b>좁은 칸에서 글자가 잘리지 않았나</b>');
  is(잘린것.length <= CLIP_OK,
    '  글자가 잘리는 칸 <b>' + 잘린것.length + '개</b> · 눈금 ' + CLIP_OK + '개' +
    (잘린것.length > CLIP_OK ? ' ★ 늘었습니다 — 글씨를 키운 만큼 담을 자리가 모자랍니다' : ''));
  잘린것.slice(0, 5).forEach(x => console.log('        ' + x.탭.padEnd(16) + x.꼴.padEnd(16) +
    ' 넓이' + String(x.w).padStart(4) + '  안' + x.안 + ' > 밖' + x.밖 + '  「' + x.값 + '」'));
  console.log('      (눈금 ' + CLIP_OK + '개는 긴 주소를 넣는 칸 둘입니다 — 칸 안에서 옆으로 밀려 보는 것이 정상이고,');
  console.log('       글씨를 키우기 <b>전부터</b> 그랬습니다. 재어 확인했습니다.)');

  head('[5] ★ 조용한가 · <b>화면을 열기만 해서</b> 서버로 나가려 한 요청 (7번)');
  const 터 = [...new Set(터짐)];
  is(터.length <= 1, '  터진 곳 <b>' + 터.length + '가지</b>' + (터.length ? (' ← ' + 터.slice(0, 2).join(' / ')) : ''));
  /* ★★ 여기서 처음 「0건이어야 한다」 고 적었다가 <b>헛것을 잡았습니다</b>.
     화면 105개를 열어 보니 서버로 나가려 한 것이 다섯 건 있었고, 재어 보니
     <b>정당한 길</b>이었습니다 — app/apex-bohum-bridge.js 가 bohum_scores 를
     <b>anon 열쇠</b>로 읽습니다(그 표의 열람 규칙이 anon 앞으로 열려 있어
     로그인 열쇠로는 막힙니다). 60초 잠금·12초 끊기가 걸려 있고
     setInterval 도 없습니다 — 7번이 말하는 <b>되풀이 병이 아닙니다</b>.
     ⚠ 그래서 0 을 요구하지 않고 <b>늘면 빨간불인 눈금</b>으로 둡니다.
       화면을 여는 것만으로 서버를 부르는 자리가 <b>새로 생기면</b> 그때
       웁니다 — 예전에 한도를 세 배 넘긴 그 병이 그렇게 들어왔습니다.
     ⚠ 이 자는 바깥을 <b>전부 막고</b> 잽니다 — 사장님 서버에 한 번도 닿지
       않습니다. 세는 것은 「나가려 한 것」 입니다 (8번).
     ⚠ 타이머가 본문을 되풀이해 받는지는 check-egress 가 봅니다 — 여기서
       또 보지 않습니다 (5번). */
  const 서버로 = 바깥.filter(u => /supabase\.co|netlify|\/api\/|\/functions\//i.test(u));
  /* ⚠ <b>건수로 세지 않습니다</b> — 60초 잠금과 늦게 오는 요청 때문에 같은
     코드로도 3건·5건으로 흔들립니다. 흔들리는 눈금은 헛것을 만듭니다 (8번).
     대신 <b>부르는 서버가 몇 군데인가</b>를 셉니다 — 그것은 안 흔들리고,
     <b>새 자리가 생기면</b> 바로 늘어납니다. */
  const 집 = {};
  서버로.forEach(u => { const h = u.replace(/^https?:\/\//, '').split('/')[0]; 집[h] = (집[h] || 0) + 1; });
  const 군데 = Object.keys(집).length;
  is(군데 <= SRV_HOSTS,
    '  화면을 열기만 해서 부르는 서버 <b>' + 군데 + '군데</b> (요청 ' + 서버로.length + '건) · 눈금 ' + SRV_HOSTS + '군데' +
    (군데 > SRV_HOSTS ? ' ★ 늘었습니다 — 화면을 여는 것만으로 서버를 부르는 자리가 새로 생겼습니다' :
      (군데 < SRV_HOSTS ? ' ★ 줄었습니다 — 눈금도 같이 내리십시오 (0-1번)' : '')));
  Object.entries(집).sort().forEach(([h, n]) => console.log('        ' + String(n).padStart(3) + '건  ' + h));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데 — 폰에서 엄지가 옆을 누르거나 글씨가 작습니다')
                  : '✓ 화면 ' + 탭들.length + '개 어디서도 누르는 자리는 44px, 적는 칸 글씨는 16px 아래로 안 내려갑니다 (판 X488·X489)');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('터짐: ' + (e && e.message)); process.exit(2); });
