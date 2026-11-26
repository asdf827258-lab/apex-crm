/* 🖨 <b>덮개로 열리는 화면이 안 깨지고 그대로 인쇄되는가</b> — 판 X565

   사장님 말씀 (2026-11-02) — 「덮개 화면은 뭔데」 → 「응 색 맞춰줘 … <b>모든 인쇄
   하는 부분이 안 깨지고 그대로 인쇄</b>」. 앞의 「색」 은 판 X294 에서 했고
   (check-coverskin), <b>인쇄 쪽은 「다음 판입니다」 로 미뤄</b> 두었습니다.
   그 ⛔[아직:덮개인쇄] 를 걷는 자입니다.

   ── 재어 보니 무엇이 깨져 있었나 (손대기 전) ─────────────────────
     ★★ 📄 <b>증권전달은 인쇄하면 종이가 백지였습니다.</b>
         화면에 <b>10,364자</b>가 서 있는데 인쇄 꼴로 바꾸면 <b>0자</b>.
         <code>@media print{.view{display:none!important}.view.printing{display:block!important}}</code>
         인데 <code>.printing</code> 은 앱의 「인쇄 / PDF」 <b>단추가 붙여 주는</b> 이름이라,
         <b>Ctrl+P · ⌘P · 브라우저 메뉴</b>로 뽑으면 자바스크립트가 안 돌아 전부 숨었습니다.
     ★★ 📕 <b>보험아카데미가 tnum 을 켠 채로 인쇄</b>했습니다 — 152곳.
         저장소에서 유일하게 <code>@media screen</code> 밖에 있던 자리입니다 (4-1번).
     ★★ 🚗 <b>자동차사고 과실분석도 켜 있었습니다 — 90곳.</b> 다만 <b>다른 철자</b>
         (<code>font-variant-numeric:tabular-nums</code>)라 글자로 찾으면 안 걸립니다.
     ★★ 🗓 <b>교육 캘린더가 오른쪽에서 짤렸습니다</b> — 표가 980px, A4 안쪽은 794px.
         <code>min-width:980px</code> 는 <b>화면에서 가로로 미는</b> 표를 위한 것인데
         종이는 밀 수가 없습니다. 토·일 쪽 <b>186px</b> 이 밖으로 나갔습니다.
     ★★ 📘 <b>미끼상품 전자책은 흰 글씨가 흰 종이에</b> 앉았습니다 — 89곳.
         브라우저는 인쇄에서 <b>바탕색을 기본으로 버립니다.</b>
     ★★ 📋 <b>메인 상담자료의 어두운 덮개 창</b>은 짙은 먹 글씨가 짙은 바탕에
         앉아 대비 <b>1.03</b> — 완전히 안 보였습니다 (27곳).
     ★★ 📋 <b>숨 쉬는 움직임이 종이로 새어 나왔습니다</b> — <code>.ch-hint</code> 의
         <code>pulse</code> 가 종이에서 <b>아무 프레임(scale 1.0349)에 얼어붙어</b>
         폭 794px 가 <b>822px</b> 로 찍혀 좌우 14px 씩 나갔습니다 (4곳).
     ★★ 📣 <b>광고심의 꼬리글이 종이에서 안 읽혔습니다</b> — 덱 띠(apex-deck.js)가
         인쇄에서 바탕을 흰색으로 돌리는데 꼬리글 색은 <code>#B6C2D6</code> 라 대비 1.9.
         「청약 권유가 아님 · 약관 우선 · 승환 주의 · 15일 철회 · 설명받을 권리」 를
         적는 자리라 <b>반드시 읽혀야 합니다</b> (2번). 한 곳을 고쳐 <b>덱 열 개</b>가 낫습니다.

   ── 여기서 재는 것 ───────────────────────────────────────────
     [0] 덮개 목록을 <b>lib-fullscr 한 곳</b>에 묻는다 (5번)
     [1] ★★ <b>tnum 이 인쇄에서 하나도 안 켜져 있다</b> — 철자 둘 다 (4-1번)
     [2] ★★ <b>종이 밖으로 나가는 글이 하나도 없다</b> — A4 안쪽 794px
     [3] ★★ <b>인쇄했을 때 글이 사라지지 않는다</b> — 백지로 안 나간다
     [4] ★  인쇄에서 <b>새로</b> 대비 미달이 되는 곳이 기준선 안쪽인가 (내려가기만)
     [5] ★  고친 자리가 <b>글로도 남아 있나</b> — 되돌리면 그 자리에서 운다

   ⚠ <b>제 자가 네 번 틀렸습니다</b> — 다음 세션이 같은 데서 안 데이게 적어 둡니다 (8번).
     ① 글자로 <code>font-feature-settings.*tnum</code> 을 찾아 본체에서 <b>셋</b>을
        찾았는데 전부 <b>주석</b>이었습니다(「tnum 은 쓰지 않는다」 라고 적어 둔 그 줄).
        <b>브라우저로 계산된 값</b>을 재야 참입니다.
     ② 「흰 글씨」 를 바탕 투명도만 보고 셌더니, 어두운 칸 위의 <b>반투명 흰 덧칠</b>
        (<code>rgba(255,255,255,.22)</code>)에서 멈춰 「흰 바탕」 으로 읽었습니다.
        <b>조상까지 올라가 섞어</b> 내려가야 참입니다.
     ③ 밝기만 보고 재니 <b>흰 위의 빨강</b>(#EF4444)까지 「안 읽힘」 으로 걸렸습니다 —
        <b>WCAG 대비</b>로 바꿨습니다. 헛것을 잡는 자는 안 잡는 자보다 나쁩니다.
     ④ 쪽 밖을 <code>scrollWidth</code> 와 견주었더니 <b>제 자신과 견주는 꼴</b>이라
        늘 0 이었습니다. <code>clientWidth</code>(쪽 폭)와 견뎌야 참입니다.

   ⚠ <b>안 재는 것과 까닭</b> (1번 · 8번) —
     · <b>바깥 사이트</b>(💯 한장 보험료 비교)는 우리 파일이 아닙니다.
     · <b>절대 대비</b>는 안 봅니다 — 화면에서도 같은 색인 자리는 X08·X453 의
       「손으로 박은 색」 눈금이 따로 셉니다. 여기서는 <b>인쇄에서 더 나빠지는지</b>만
       봅니다. 두 자가 같은 것을 따로 세면 둘이 어긋납니다 (5번).
     · 남은 <b>보험사 브랜드 색</b>(삼성화재 주황 1.74 · 삼성생명 파랑 4.16 …)은
       <b>안 건드립니다</b> — 브랜드 색이고, X08 이 「기계로 바꾸면 안 되는 일」 로
       못 박은 자리입니다. 기준선으로 묶어 두고 화면마다 눈으로 줄입니다.

   ⚠ <b>브라우저 흉내가 못 하는 것 하나</b> — <code>emulateMedia({media:'print'})</code> 는
     인쇄 규칙을 먹이지만 <b>바탕색을 실제로 버리지는 않습니다.</b> 진짜 인쇄는 기본으로
     버리므로, <code>print-color-adjust:exact</code> 가 빠져 흰 글씨가 흰 종이에 앉는 것은
     <b>[1]~[4] 로는 못 봅니다.</b> 그래서 그것만 [5] 에서 <b>글로</b> 지킵니다 —
     되돌림 시험에서 실제로 [5] 하나만 울었습니다. 덮어 두지 않고 적어 둡니다 (1번).

   ⚠ 바깥은 전부 끊습니다 — 「점검이 사장님 진짜 서버를 읽지 않는다」.         */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const { 덮개이름, 적어도 } = require('./lib-fullscr.js');
const ROOT = process.cwd(), PORT = 8991;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css;charset=utf-8', '.json': 'application/json;charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.woff2': 'font/woff2' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f)) { const g = path.join(ROOT, 'app', p); if (fs.existsSync(g)) f = g; }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});

const APP = fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8');
/* 덮개 → 띄우는 파일. go() 가 주소를 *_URL 상수에 둡니다 (check-coverskin 과 같은 길 · 5번) */
const URLS = {};
for (const m of APP.matchAll(/var ([A-Z_0-9]*URL)\s*=\s*'([^']*)'/g)) URLS[m[1]] = m[2];
const 짝 = {
  finance: 'FIN_URL', crm: 'CRM_URL', apexmap: 'APEXMAP_URL', onecmp: 'ONECMP_URL',
  mikki: 'MIKKI_URL', car_fault: 'CARFAULT_URL', mikki_talk: 'MKTALK_URL',
  sangdam: 'SANGDAM_URL', educal: 'EDUCAL_URL', pdel: 'PDEL_URL', insight: 'INSIGHT_URL',
  bohum: 'BOHUM_URL', frmake: 'BA_URL',
};
const 이름표 = { finance: '📊 재무설계 계산기', crm: '🗄️ DB 통합 CRM', apexmap: '🤖 APEX 자비스',
  onecmp: '💯 한장 보험료 비교', mikki: '🎣 미끼 레이더', car_fault: '🚗 자동차사고 과실',
  mikki_talk: '📘 미끼상품 접촉전략', sangdam: '📋 메인 상담자료', educal: '🗓 교육 캘린더',
  pdel: '📄 증권전달', insight: '📈 월간 인사이트', bohum: '📕 보험아카데미',
  frmake: '📑 보장분석 전·후' };

/* ⚠ 바깥 사이트는 우리 파일이 아니라 못 고칩니다 — 까닭을 적어 둡니다 (8번) */
const 바깥 = { onecmp: '바깥 사이트(apex-hb-onecompare)라 우리 파일이 아닙니다' };

/* ── 내려가기만 하는 눈금 ─────────────────────────────────────
   인쇄에서 <b>새로</b> 대비 미달이 되는 곳. 화면에서도 같은 색인 자리는 세지 않습니다.
   남은 것은 보험사 브랜드 색과 덱의 제 회색조라, 줄이는 것은 눈으로 할 일입니다.
   ★ 이 수는 <b>늘면 빨간불</b>이고, 줄이면 이 줄도 같이 내립니다 (CLAUDE.md 0-1번). */
const 기준선 = { sangdam: 238, car_fault: 70, bohum: 7 };

/* A4 안쪽 폭 — 210mm 에서 좌우 10mm 여백을 뺀 190mm ≈ 718px 이지만,
   브라우저가 인쇄 미리보기에서 쓰는 쪽 상자는 창 폭을 따릅니다. 그래서
   창을 <b>A4 폭(794px = 210mm @96dpi)</b> 으로 두고 그 안을 벗어나는지 봅니다. */
const A4 = 794;

/* 인쇄 꼴에서 한 쪽을 재는 눈 — 브라우저 안에서 돕니다 */
const 재는눈 = () => {
  const W = document.documentElement.clientWidth;
  const vis = (e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed';
  const 길 = (e) => { const a = []; let n = e;
    while (n && n !== document.body) {
      a.unshift((n.id ? '#' + n.id : n.tagName.toLowerCase()) +
        (typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\s+/)[0] : ''));
      n = n.parentElement; }
    return a.slice(-3).join('>'); };
  const px = (v) => { const m = (v || '').match(/[\d.]+/g); if (!m) return null;
    return { r: +m[0], g: +m[1], b: +m[2], a: m.length > 3 ? +m[3] : 1 }; };
  const 섞 = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a),
                          b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const L = (c) => { const f = (x) => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); };
    return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
  const 대비 = (a, b) => { const l1 = L(a), l2 = L(b); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); };
  /* 글 뒤에 <b>정말로</b> 깔린 색 — 반투명은 아래와 섞어 내려간다 (제 허물 ②) */
  const 바탕 = (e) => { const st = []; let n = e;
    while (n && n !== document.documentElement) {
      if (getComputedStyle(n).backgroundImage !== 'none') return null;   /* 그림이면 판정 안 함 */
      const c = px(getComputedStyle(n).backgroundColor); if (c && c.a > 0) st.push(c);
      n = n.parentElement; }
    let out = { r: 255, g: 255, b: 255, a: 1 };                          /* 종이는 흰색 */
    for (let i = st.length - 1; i >= 0; i--) out = 섞(st[i], out);
    return out; };
  const o = { tnum: [], over: [], low: {}, len: (document.body.innerText || '').replace(/\s+/g, ' ').trim().length, W: W };
  [].slice.call(document.querySelectorAll('body *')).forEach((e) => {
    if (!vis(e)) return;
    let own = ''; [].slice.call(e.childNodes).forEach((n) => { if (n.nodeType === 3) own += n.nodeValue; });
    own = own.replace(/\s+/g, ' ').trim(); if (!own) return;
    const cs = getComputedStyle(e);
    /* 철자는 둘이다 — 둘 다 본다 (4-1번) */
    if (/tnum|tabular/.test((cs.fontFeatureSettings || '') + ' ' + (cs.fontVariantNumeric || '')))
      o.tnum.push(길(e) + ' 「' + own.slice(0, 22) + '」');
    const b = e.getBoundingClientRect();
    if (b.width > 0 && b.right > W + 2) o.over.push(Math.round(b.right) + 'px ' + 길(e) + ' 「' + own.slice(0, 22) + '」');
    const bg = 바탕(e); if (!bg) return;
    const fg = px(cs.color); if (!fg) return;
    const c = 대비(섞(fg, bg), bg);
    const sz = parseFloat(cs.fontSize) || 14, bold = (+cs.fontWeight >= 700 || cs.fontWeight === 'bold');
    const 선 = (sz >= 24 || (sz >= 18.66 && bold)) ? 3.0 : 4.5;          /* WCAG AA */
    if (c < 선) o.low[길(e) + '|' + own.slice(0, 22)] = +c.toFixed(2);
  });
  return o;
};

(async () => {
  await new Promise((r) => srv.listen(PORT, r));
  const br = await chromium.launch({ args: ['--no-sandbox'] });

  head('[0] 덮개 목록을 <b>한 곳</b>에 묻는다 (5번)');
  const 덮개 = 덮개이름(APP);
  is(덮개.length >= 적어도, '  lib-fullscr 이 덮개 <b>' + 덮개.length + '개</b>를 찾았다 (적어도 ' + 적어도 + ')');
  const 모르는 = 덮개.filter((t) => !짝[t]);
  is(모르는.length === 0, '  덮개가 다 <b>어느 파일을 띄우는지</b> 안다' +
     (모르는.length ? ' ⚠ 모르는 것: ' + 모르는.join(', ') : ''));

  const 잰값 = {};
  for (const k of 덮개) {
    if (바깥[k]) continue;
    const u = URLS[짝[k]] || '';
    if (!u || /^https?:/.test(u)) continue;
    const p = '/' + (u.startsWith('/') ? u.slice(1) : 'app/' + u);
    const ctx = await br.newContext({ viewport: { width: A4, height: 1123 } });
    /* ★ 바깥은 전부 끊습니다 — 안 끊으면 이 자가 사장님 Supabase·카카오를 부릅니다 (7번) */
    await ctx.route('**://**', (r) => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const pg = await ctx.newPage();
    try {
      await pg.goto('http://127.0.0.1:' + PORT + p, { waitUntil: 'domcontentloaded', timeout: 50000 });
      await pg.waitForTimeout(2800);
      const 화면 = await pg.evaluate(재는눈);
      await pg.emulateMedia({ media: 'print' });
      await pg.waitForTimeout(900);
      const 인쇄 = await pg.evaluate(재는눈);
      잰값[k] = { 화면, 인쇄 };
    } catch (e) { 잰값[k] = { err: String(e.message).slice(0, 70) }; }
    await ctx.close();
  }
  await br.close();

  const 열린것 = Object.keys(잰값).filter((k) => !잰값[k].err);
  head('[1] ★★ <b>tnum 이 인쇄에서 하나도 안 켜져 있다</b> — 철자 둘 다 (CLAUDE.md 4-1)');
  is(열린것.length >= 10, '  덮개 <b>' + 열린것.length + '개</b>를 인쇄 꼴로 실제로 띄워 재었다' +
     (Object.keys(잰값).filter((k) => 잰값[k].err).length
        ? ' ⚠ 못 연 것: ' + Object.keys(잰값).filter((k) => 잰값[k].err).map((k) => k + '(' + 잰값[k].err + ')').join(', ') : ''));
  열린것.forEach((k) => {
    const n = 잰값[k].인쇄.tnum.length;
    is(n === 0, '  ' + (이름표[k] || k) + ' — 인쇄에서 tnum ' + (n ? ('<b>' + n + '곳</b> 켜져 있다 (' +
      잰값[k].인쇄.tnum.slice(0, 2).join(' / ') + ') — PDF 로 저장하면 숫자가 유니코드를 잃습니다')
      : '0곳') + (잰값[k].화면.tnum.length ? '  (화면 ' + 잰값[k].화면.tnum.length + '곳 → 인쇄 0)' : ''));
  });

  head('[2] ★★ <b>종이 밖으로 나가는 글이 하나도 없다</b> — A4 안쪽 ' + A4 + 'px');
  열린것.forEach((k) => {
    const n = 잰값[k].인쇄.over.length;
    is(n === 0, '  ' + (이름표[k] || k) + ' — 쪽 밖 ' + (n ? ('<b>' + n + '곳</b> (' +
      잰값[k].인쇄.over.slice(0, 2).join(' / ') + ')') : '0곳') +
      (잰값[k].화면.over.length ? '  (화면 ' + 잰값[k].화면.over.length + '곳 → 인쇄 0)' : ''));
  });

  head('[3] ★★ <b>인쇄했을 때 글이 사라지지 않는다</b> — 백지로 안 나간다');
  열린것.forEach((k) => {
    const s = 잰값[k].화면.len, p = 잰값[k].인쇄.len;
    /* 틀(머리띠·단추·서랍)은 숨는 것이 맞으므로 전부를 요구하지 않습니다.
       <b>백지</b>와 <b>거의 백지</b>만 잡습니다 — 증권전달이 0자로 나갔던 그 자리입니다. */
    const ok = p > 0 && (s === 0 || p >= Math.max(40, s * 0.12));
    is(ok, '  ' + (이름표[k] || k) + ' — 글자 화면 ' + s + ' → 인쇄 <b>' + p + '</b>' +
      (ok ? '' : ' ⚠ 종이가 비어 나갑니다 — 인쇄 규칙이 내용까지 숨기고 있습니다'));
  });

  head('[4] ★ 인쇄에서 <b>새로</b> 대비 미달이 되는 곳이 기준선 안쪽인가 (내려가기만)');
  열린것.forEach((k) => {
    const 화 = 잰값[k].화면.low, 인 = 잰값[k].인쇄.low;
    const 새 = Object.keys(인).filter((x) => !(x in 화));
    const 선 = 기준선[k] || 0;
    is(새.length <= 선, '  ' + (이름표[k] || k) + ' — 인쇄에서 새로 미달 <b>' + 새.length + '</b>곳 (기준선 ' + 선 + ')' +
      (새.length > 선 ? ' ⚠ ' + 새.slice(0, 2).map((x) => 인[x] + ' ' + x).join(' / ') : '') +
      (새.length < 선 ? '  ★ 기준선을 ' + 새.length + ' 로 내려 주십시오' : ''));
  });

  head('[5] ★ 고친 자리가 <b>글로도 남아 있나</b> — 되돌리면 운다');
  const 글 = (f) => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { return ''; } };
  const pdel = 글('app/증권전달/index.html');
  is(/\.view\.on\s*,\s*\.view\.printing\s*\{\s*display:\s*block/.test(pdel),
     '  📄 증권전달 — <b>지금 보고 계신 장(.on)</b>도 인쇄에 나간다 (Ctrl+P 로도)');
  const bohum = 글('app/보험아카데미/index.html');
  is(/@media screen\{[^}]*font-feature-settings:'tnum'/.test(bohum),
     '  📕 보험아카데미 — tnum 이 <b>@media screen 안</b>에만 있다 (4-1번)');
  is(/@media print\{[\s\S]{0,900}\.foot\{color:#333D4B!important\}/.test(bohum),
     '  📕 보험아카데미 — <b>법정 꼬리글</b>이 종이에서 짙다 (2번)');
  const edu = 글('app/edu-cal.html');
  is(/@media print\{[\s\S]{0,2600}\.cal\{min-width:0!important/.test(edu),
     '  🗓 교육 캘린더 — 종이에서 표의 <b>가로 밀기를 푼다</b> (쪽 안으로)');
  const deck = 글('app/상담자료/apex-deck.js');
  is(/@media print\{[\s\S]{0,400}apex-deck-full li\{color:#333D4B\}/.test(deck),
     '  📣 덱 띠 — <b>광고심의 꼬리글</b>이 종이에서 읽힌다 (덱 열 개 공통 · 5번)');
  const sang = 글('app/상담자료/메인 상담자료.html');
  is(/\.s15-modal\s*\{\s*background:\s*#fff\s*!important/.test(sang),
     '  📋 메인 상담자료 — <b>어두운 덮개 창</b>이 종이에서 흰 바탕이다');
  is(/\.ch-hint\s*\{\s*animation:\s*none\s*!important/.test(sang),
     '  📋 메인 상담자료 — <b>숨 쉬는 움직임</b>을 종이에서 끈다 (얼어붙어 폭이 커집니다)');
  const mk = 글('app/상담자료/미끼상품_접촉전략.html');
  is(/@media print\{[\s\S]{0,200}print-color-adjust:\s*exact/.test(mk),
     '  📘 미끼상품 — <b>바탕을 그대로 찍는다</b> (흰 글씨가 흰 종이에 안 앉게)');
  const car = 글('app/상담자료/자동차사고_과실분석.html');
  is(/@media print\{[\s\S]{0,200}font-variant-numeric:\s*normal!important/.test(car),
     '  🚗 자동차사고 과실 — 종이에서 tnum <b>두 철자를 다</b> 끈다 (4-1번)');

  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '가지 빨간불 — 뽑은 종이가 깨집니다'); process.exit(1); }
  console.log('✓ 덮개 인쇄 점검 통과 — 뽑으면 그대로 나옵니다.');
  srv.close(); process.exit(0);
})();
