/* <b>홈의 첫인상 — 밝은가 · 읽히는가 · 같은 말을 두 번 안 하는가</b>

   ── 왜 이 점검이 생겼나 ─────────────────────────────────────────

   2026-09-25, 사장님이 폰 화면과 목업(docs/토스판_사본.html)을 나란히
   보시고 <b>「다 해」</b> 하셨습니다. 다섯 자리가 달랐습니다 —

     ① 맨 위가 <b>검은 띠</b>였습니다 (--ink-2 · #1C2434). 화면을 열면
        제일 먼저 보이는 것이 그것이라, 목업의 밝은 결과 첫인상이
        통째로 달랐습니다.
     ② 「오늘 안에 연락해야 할 분이 3명」 이 <b>노란 상자</b>였고, 그 위에
        파란 큰 단추가 <b>글을 덮고</b> 있었습니다 (「있습니다.」 가 가려짐).
     ③ 바로 밑에 <b>파란 공지 상자</b>가 또 있었습니다 — 같은 말을 서랍도
        하고 있어, 대표는 「공지가 없다」 를 세 군데에서 들었습니다.
     ④ 카드 안에 <b>남색 띠</b>(#0F172A)가 한 장 박혀 있었습니다.
     ⑤ <b>「지금 할 것」 이 두 번</b> 나왔습니다 — 얇은 카드 한 장과, 바로
        아래 큰 카드가 같은 분을 같은 말로 다시 적었습니다.

   ── 여기서 지키는 것 ───────────────────────────────────────────

   밝게 바꿀 때 <b>진짜 무서운 것은 색이 안 맞는 것이 아니라, 흰 글씨를
   흰 바탕에 남겨 두는 것</b>입니다. 눈으로는 「비어 있네」 로 보여서
   아무도 버그로 읽지 않습니다. 그래서 여기서는 <b>명암비를 직접 잽니다</b>.

     [1] 맨 위 띠가 <b>밝다</b> · 안의 글이 다 <b>읽힌다</b> ·
         ☰ · 로고 · 🎙 · ⭐ 띠는 <b>그대로 있다</b>(지운 것이 아니다) ·
         오늘 날짜가 <b>진짜 오늘</b>이다
     [2] 소식은 <b>상자가 아니라 한 줄</b>이다 · 44px 은 지킨다 ·
         13px 아래로 안 내려간다 · <b>줄 통째로</b> 눌린다(글을 덮는 단추가 없다)
     [3] 카드 안 띠가 <b>밝다</b> · <b>「모름」 과 「없음」 이 다른 색</b>이다 (1번)
     [4] <b>「지금 할 것」 이 홈에 한 번만</b> 적힌다 (5번)
     [5] 홈에 보이는 <b>모든 글자</b>가 제 바탕 위에서 읽힌다

   ★ <b>모양은 여기서 안 봅니다.</b> 「N분 중 N번째」·동그라미는 check-quest,
     「오늘 안에 연락해야 할 분이 N명」 은 check-crmcare, 띠의 열두 갈래는
     check-topnav, 목업 색표는 check-hmexact 가 봅니다. 같은 것을 두 곳에서
     보면 한쪽만 고쳐질 때 서로 다른 말을 합니다 (5번).                */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const ROOT = process.cwd(), PORT = 8971;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
               '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/') === 0) { rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{"key":null,"has":false}'); return; }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});

/* 견본은 <b>「홍길동」</b> 입니다 — 실제 고객 이름은 안 씁니다 (3번) */
const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '홍길동', role: 'owner', active: true, plan: 'vip', team_id: 't1' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function () {}; window.setupDone = function () { return true; };
  window.setupCanRun = function () { return true; };
  const t = (new Date(Date.now() + 9 * 3600 * 1000)).toISOString().slice(0, 10);
  OSC.loaded = true; OSC.busy = false; OSC.err = '';
  OSC.list = [1, 2, 3, 4, 5, 6].map(i => ({ id: 'c' + i, name_masked: '홍○○', advisor_id: 'me',
                                            consent_status: 'none', created_at: '2026-02-0' + i }));
  CM.loaded = true;
  CM.meta = { c1: { touch: [{ at: t, how: '전화' }] }, c2: { touch: [{ at: t, how: '만남' }] },
              c3: { touch: [{ at: '2026-09-20', how: '전화' }] },
              c4: { touch: [{ at: '2026-07-01', how: '만남' }] }, c5: { touch: [] }, c6: { touch: [] } };
  AR.loaded = true; AR.busy = ''; AR.cliRows = [];
  AR.db = [{ id: 'd1', who: 'me', name: '홍길동', region: '순천', src: '일반', stage: 'AP', days: 3, n: 2, res: '상담', cAt: '', pAt: '' },
           { id: 'd2', who: 'me', name: '홍길순', region: '광주', src: '소개', stage: 'TA', days: 9, n: 1, res: '', cAt: '', pAt: '' }];
};

/* 명암비 — 실제로 <b>칠해진 값</b>을 겹쳐 가며 잰다.
   투명한 바탕은 위로 올라가며 <b>처음 만나는 불투명한 바탕</b>을 찾는다. */
const CONTRAST_FNS = `
function px(v){var m=(v||'').match(/[\\d.]+/g)||[];return [+m[0]||0,+m[1]||0,+m[2]||0,m.length>3?+m[3]:1];}
function over(f,b){var a=f[3];return [f[0]*a+b[0]*(1-a),f[1]*a+b[1]*(1-a),f[2]*a+b[2]*(1-a),1];}
function lum(c){var r=[0,1,2].map(function(i){var v=c[i]/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});
  return .2126*r[0]+.7152*r[1]+.0722*r[2];}
function ratio(a,b){var x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function bgOf(el){
  var acc=[255,255,255,1],stack=[],e=el;
  while(e&&e!==document.documentElement){ stack.push(px(getComputedStyle(e).backgroundColor)); e=e.parentElement; }
  stack.push(px(getComputedStyle(document.documentElement).backgroundColor));
  var i,out=[255,255,255,1];
  for(i=stack.length-1;i>=0;i--){ if(stack[i][3]>0) out=over(stack[i],out); }
  return out;
}`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4200);
  const booted = await page.evaluate(() => typeof renderHome === 'function' && typeof tnPaint === 'function');
  if (!booted) { console.log('✗ 앱이 뜨지 않았습니다.'); errs.slice(0, 3).forEach(m => console.log('    ' + m));
                 await browser.close(); srv.close(); process.exit(1); }
  await page.evaluate(SEED);
  await page.evaluate(() => go('home'));
  await page.waitForTimeout(2200);

  /* ── [1] 맨 위 띠 ─────────────────────────────────────────────── */
  console.log('\n[1] 맨 위 띠가 <b>밝다</b> — 그리고 안의 것을 하나도 안 잃었다');
  const T = await page.evaluate((fns) => {
    (0, eval)(fns);
    const tn = document.getElementById('topnav');
    if (!tn) return { none: true };
    const bg = bgOf(tn);
    const leaves = [].slice.call(tn.querySelectorAll('*')).filter(e => {
      if (e.children.length) return false;
      const t = (e.textContent || '').trim(); if (!t) return false;
      const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0;
    });
    let worst = 99, who = '';
    leaves.forEach(e => {
      const s = getComputedStyle(e);
      const b = bgOf(e), f = over(px(s.color), b), t = ratio(f, b);
      if (t < worst) { worst = t; who = (e.textContent || '').trim().slice(0, 18); }
    });
    /* 즐겨찾기 딱지를 <b>실제로 담아</b> 재 본다 — 빈 띠만 보면 못 본다 */
    let chip = null;
    try {
      const ids = []; (visibleTabs()).forEach(g => { if (!g.hide) (g.items || []).forEach(x => { if (!x.hide) ids.push(x.id); }); });
      navFav().slice().forEach(id => navFavToggle(id));
      ids.slice(0, 4).reverse().forEach(id => navFavToggle(id));
      const b0 = document.querySelector('#tnFav .tn-fi .tab-btn');
      if (b0) { const s = getComputedStyle(b0), bb = bgOf(b0);
                chip = { r: ratio(over(px(s.color), bb), bb), tx: (b0.textContent || '').trim().slice(0, 12) }; }
    } catch (e) {}
    const day = (document.getElementById('tnDay') || {}).textContent || '';
    return { lum: lum(bg), worst: +worst.toFixed(2), who: who, chip: chip,
             day: day, want: (typeof calLabel === 'function' && typeof ckDayK === 'function') ? calLabel(ckDayK()) : '',
             burger: !!tn.querySelector('.tn-burger'), logo: !!tn.querySelector('.tn-logo'),
             va: !!tn.querySelector('.tn-va'), fav: !!document.getElementById('tnFav') };
  }, CONTRAST_FNS);
  is(!T.none && T.lum > 0.6, '  띠 바탕이 <b>밝다</b> — 밝기 ' + (T.none ? '(띠 없음)' : T.lum.toFixed(2)) + ' (0.6 넘어야 · 검정은 0.02)');
  is(T.worst >= 4.5, '  띠 안의 글이 <b>다 읽힌다</b> — 제일 흐린 「' + T.who + '」 명암비 ' + T.worst + ' (4.5 이상)');
  is(!!T.chip && T.chip.r >= 4.5,
     '  <b>즐겨찾기 딱지</b>도 읽힌다 — 「' + (T.chip ? T.chip.tx : '(못 담음)') + '」 명암비 ' +
     (T.chip ? T.chip.r.toFixed(2) : '?') + ' ← 어두운 띠용 글씨색(--gt)을 그대로 두면 여기서 걸립니다');
  is(T.burger && T.logo && T.va && T.fav,
     '  ☰ · 로고 · 🎙 · ⭐ 띠가 <b>그대로 있다</b> — 색만 바꾼 것이지 걷어낸 것이 아니다');
  is(!!T.day && T.day === T.want,
     '  띠에 <b>오늘 날짜</b>가 적힌다 — 「' + T.day + '」 (calLabel 한 곳에서 · 5번)');

  /* ── [2] 소식은 상자가 아니라 한 줄 ───────────────────────────── */
  console.log('\n[2] 소식은 <b>상자가 아니라 한 줄</b> — 글을 덮는 단추가 없다');
  const N = await page.evaluate(() => {
    const rows = [].slice.call(document.querySelectorAll('.hm-noti .hm-noti-r'));
    return { n: rows.length,
             /* ⚠ <b>72px 입니다.</b> 처음엔 56px 로 두었다가 헛것을 잡았습니다 —
                390px 폰에서 「오늘 안에 연락해야 할 분이 3명 있습니다」 는
                <b>두 줄로 감기고</b>(59px), 그것은 정상입니다. 여기서 잡으려는
                것은 <b>상자로 되돌아가는 것</b>입니다 — 걷어낸 노란 상자는
                단추까지 안고 110px 이 넘었습니다. 두 줄(72px)까지는 줄이고,
                그 위는 상자입니다. 넓게 잡으면 사람이 점검을 안 믿습니다 (8번). */
             tall: rows.filter(e => e.getBoundingClientRect().height > 72)
                       .map(e => Math.round(e.getBoundingClientRect().height)),
             tiny: rows.filter(e => [].slice.call(e.querySelectorAll('*'))
                        .concat([e]).some(x => parseFloat(getComputedStyle(x).fontSize) < 13)).length,
             notBtn: rows.filter(e => e.tagName !== 'BUTTON').length,
             inner: rows.filter(e => e.querySelector('button,a[onclick]')).length,
             box: document.querySelectorAll('.hm-noti .notice,.hm-noti .card').length };
  });
  is(N.n >= 2, '  한 줄짜리가 <b>' + N.n + '줄</b> 섰다 (경고 · 공지)');
  is(N.tall.length === 0, '  <b>상자가 아니다</b> — 72px 넘는 줄 ' + N.tall.length + '개' +
     (N.tall.length ? ' ← ' + N.tall.join('·') + 'px' : ''));
  /* ⚠ <b>44px 은 여기서 안 잽니다.</b> 처음엔 쟀는데, 일부러 30px 로 못을
     박아도 <b>안 울렸습니다</b> — 앱이 이미 `#dynPane button{min-height:44px}`
     로 못을 박아 두었고 CSS 는 min-height 가 height 를 이깁니다. 절대 안
     울리는 알람은 알람이 아닙니다 (8번). 대신 <b>단추인가</b>를 봅니다 —
     단추라야 그 앱 규칙이 걸립니다(바로 아래 줄). */
  is(N.tiny === 0, '  <b>13px 아래로 안 내려간다</b> — 경고는 읽혀야 한다 (' + N.tiny + '개)');
  is(N.notBtn === 0, '  <b>줄 통째로</b> 눌린다 — 글 옆을 눌러도 간다 (' + N.notBtn + '개가 단추가 아님)');
  is(N.inner === 0, '  줄 <b>안에 또 단추가 없다</b> — 겹쳐서 글을 덮던 자리다 (' + N.inner + '개)');
  is(N.box === 0, '  소식 자리에 <b>상자(.notice · .card)가 안 남았다</b> — ' + N.box + '개');

  /* ── [3] 카드 안 띠 ───────────────────────────────────────────── */
  console.log('\n[3] 카드 안 띠가 <b>밝다</b> · 「모름」 과 「없음」 이 다른 색이다');
  const Q = await page.evaluate((fns) => {
    (0, eval)(fns);
    const q = document.querySelector('.hm-q');
    if (!q) return { none: true };
    const bg = bgOf(q);
    /* <b>본문과 딱지를 따로 잽니다.</b> 딱지(.hm-q-t)는 목업이 정한 짝
       (--t-warn 글씨 위 --t-warn-l 바탕)이라 <b>3.0</b> 입니다 — 사장님이
       「목업대로」 가자고 하신 색이라, 여기서 4.5 를 대면 목업 자체가
       빨간불이 됩니다. 딱지는 <b>짧고 굵은 표시</b>라 3.0(WCAG 가 그림·UI
       요소에 대는 자)으로 재고, <b>읽는 글은 4.5</b> 그대로 봅니다. */
    let worst = 99, who = '', wtag = 99, wtagN = '';
    [].slice.call(q.querySelectorAll('*')).forEach(e => {
      if (e.children.length) return;
      const t = (e.textContent || '').trim(); if (!t) return;
      const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
      const b = bgOf(e), f = over(px(getComputedStyle(e).color), b), c = ratio(f, b);
      const tag = !!e.closest('.hm-q-t');
      if (tag) { if (c < wtag) { wtag = c; wtagN = t.slice(0, 18); } }
      else if (c < worst) { worst = c; who = t.slice(0, 18); }
    });
    /* 「모름(wait)」 과 「없음(no)」 을 <b>같은 자리에서 나란히</b> 만들어 잰다 */
    const mk = (cls) => { const d = document.createElement('span');
      d.className = 'hm-q-t ba ' + cls; d.textContent = '재는 중'; q.appendChild(d);
      const s = getComputedStyle(d), out = s.color + '|' + s.backgroundColor; d.remove(); return out; };
    return { lum: lum(bg), worst: +worst.toFixed(2), who: who,
             wtag: +wtag.toFixed(2), wtagN: wtagN, wait: mk('wait'), no: mk('no') };
  }, CONTRAST_FNS);
  is(!Q.none && Q.lum > 0.6, '  띠 바탕이 <b>밝다</b> — 밝기 ' + (Q.none ? '(띠 없음)' : Q.lum.toFixed(2)) + ' (0.6 넘어야)');
  is(Q.worst >= 4.5, '  띠 안의 <b>읽는 글</b>이 다 읽힌다 — 제일 흐린 「' + Q.who + '」 명암비 ' + Q.worst + ' (4.5 이상)');
  is(Q.wtag >= 3, '  <b>딱지</b>도 읽힌다 — 제일 흐린 「' + Q.wtagN + '」 명암비 ' + Q.wtag +
     ' (3 이상 · 목업이 정한 노랑 짝이 3.0 입니다)');
  is(!!Q.wait && Q.wait !== Q.no,
     '  <b>「확인 중(모름)」 과 「없음」 이 다른 색</b>이다 (1번) — 모름 ' + Q.wait + ' / 없음 ' + Q.no +
     (Q.wait === Q.no ? ' ← 같은 색이면 「아직 못 받아 왔다」 가 「보장분석이 없다」 로 읽힙니다' : ''));

  /* ── [4] 「지금 할 것」 이 한 번 ───────────────────────────────── */
  console.log('\n[4] <b>「지금 할 것」 이 홈에 한 번만</b> 적힌다 (5번)');
  const D = await page.evaluate(() => {
    const pane = document.querySelector('.tab-pane.on');
    const hits = [].slice.call(pane.querySelectorAll('*')).filter(e =>
      !e.children.length && (e.textContent || '').trim() === '지금 할 것' &&
      e.getBoundingClientRect().height > 0);
    return { n: hits.length, cls: hits.map(e => e.className || e.tagName),
             lab: !!document.querySelector('.hm-now .hm-now-lab'),
             dead: typeof window.hmTossNow };
  });
  is(D.n === 1, '  「지금 할 것」 이 <b>한 번</b> 적힌다 — ' + D.n + '번 (' + D.cls.join(' · ') + ')');
  is(D.lab, '  그 하나가 <b>한 분 카드 위</b>에 있다 (.hm-now-lab · 목업 .one .lab 자리)');
  is(D.dead === 'undefined', '  얇은 카드를 만들던 <b>함수가 안 남았다</b> — hmTossNow: ' + D.dead +
     (D.dead === 'undefined' ? '' : ' ← 안 부르는 함수를 두면 다음 사람이 다시 세웁니다 (5번)'));

  /* ── [5] 홈의 모든 글이 읽히나 ────────────────────────────────── */
  console.log('\n[5] 밝게 바꾸다 <b>흰 글씨를 흰 바탕에</b> 남기지 않았나');
  const A = await page.evaluate((fns) => {
    (0, eval)(fns);
    const pane = document.querySelector('.tab-pane.on');
    const outs = [];
    [].slice.call(pane.querySelectorAll('*')).forEach(e => {
      if (e.children.length) return;
      const t = (e.textContent || '').trim(); if (!t) return;
      const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
      const s = getComputedStyle(e);
      if (s.visibility === 'hidden' || +s.opacity < 0.9) return;
      /* 이모지만 있는 칸은 <b>제 색으로</b> 그려지는데 computed color 는
         검정이라 헛것이 됩니다 — check-hmexact 와 같은 까닭으로 뺍니다 (8번). */
      if (!/[0-9A-Za-z가-힣]/.test(t)) return;
      const b = bgOf(e), f = over(px(s.color), b), c = ratio(f, b);
      /* ⚠ <b>2.0 입니다 — 4.5 가 아닙니다.</b> 목업이 고른 셋째 잉크
         --t-sub2(#8B95A1)가 흰 바탕에서 <b>2.91</b> 입니다(목업의 「오늘
         3개예요」 가 그 색입니다). 사장님이 고르신 색이라 여기서 4.5 를 대면
         <b>목업 전체가 빨간불</b>이 되고, 그러면 사람이 점검을 안 믿습니다 (8번).
         여기서 잡으려는 것은 <b>망가진 짝</b>입니다 — 밝게 바꾸다 흰 글씨를
         흰 바탕에 남기는 일이고, 그것은 <b>1.0~1.5</b> 입니다. 2.0 이면
         그것만 걸리고 목업 색은 안 걸립니다.
         ★ 목업 색표와 맞는지는 <b>check-hmexact</b> 가 따로 봅니다 (5번). */
      if (c < 2) outs.push(c.toFixed(2) + ' 「' + t.slice(0, 16) + '」');
    });
    return outs;
  }, CONTRAST_FNS);
  is(A.length === 0, '  홈의 글이 <b>전부 제 바탕 위에서 읽힌다</b> — 묻힌 글 ' + A.length + '개' +
     (A.length ? ' ← ' + A.slice(0, 4).join(' · ') : ''));

  console.log('\n[6] 조용히 터지지 않았나');
  is(errs.length === 0, '  콘솔 오류 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 홈 첫인상이 어긋났습니다') :
                    '✓ 홈이 밝고, 글이 다 읽히고, 같은 말을 두 번 안 합니다.');
  process.exit(bad ? 1 : 0);
})();
