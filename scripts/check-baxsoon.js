/* ⏰ <b>코앞에 온 만기·갱신이 홈에 서는가</b> — 판 X426

   사장님 말씀 <b>X04</b> — 「납입·보장 만기 신호」.
   오래 <b>보류</b>였고, 대장에 그 까닭이 적혀 있었습니다 —

     「증권에서 읽은 계약이 그 분 것만 있어, 홈이 수백 분 것을 다 읽으면
      무료 한도를 넘깁니다(7번). <b>보장분석이 돌 때 다음 만기일 한 줄을
      적어 두는 것이 먼저</b>입니다」

   그 한 줄이 이제 있습니다 — 판 X131 이 sum.end{pay,cov} 를, 판 X423 이
   sum.end.rnw 를 담았고, chkLoad 가 <b>sum 칸만 집어 한 번</b> 받아 옵니다.
   그래서 보류를 풉니다.

   ── 재어 보니 ───────────────────────────────────────────────────
   🩺 화면(go('airep') · AR.cat='check')에 들어가 <b>접힌 칸을 펴야</b>
   만기가 보였습니다. <b>홈만 보시면 이번 달에 보험료가 바뀌는 분이 한 분도
   안 보였습니다.</b> 신호는 <b>찾아가야 보이는 것</b>이 아니라 <b>먼저
   말해 주는 것</b>입니다.

   여기서 확인합니다.

     1. 홈 카드에 <b>코앞 칸이 선다</b> — 접힌 채로, 머리에 사람 수
     2. ★★ <b>코앞만</b> 선다 — 5달 뒤 납입 만기로 오늘 안 울린다
     3. ★★ <b>세는 곳이 하나다</b> (5번) — baxSoon 은 baxRows 를 거를 뿐이고,
        홈의 수와 🩺 화면의 수가 어긋나지 않는다
     4. ★ 보장 만기는 <b>해까지만</b> 안다 — 올해 끝나는 것만, 달은 안 지어낸다
     5. ★ 한 분이 둘이어도 <b>「명」 은 한 번</b> 센다
     6. ★ 못 읽었으면 <b>null</b> — 「0명」 을 안 적는다 (1번)
     7. ★ 코앞이 없으면 <b>칸을 아예 안 세운다</b>
     8. ★ 홈이라 <b>실명</b>이 선다 (3번 · 판 X399 — 홈은 예외)
     9. ★ 「<b>D-30</b>」 이라고 안 적는다 — 사장님이 그렇게 이르셨습니다
    10. ★ 이름표(data-ask)가 붙어 check-onesay 가 견줄 수 있다

   ★ 사장님 진짜 서버는 읽지 않습니다. 견본 이름은 홍길동 집안입니다 (3번). */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  /* 바깥을 한 번도 안 부릅니다 — 사장님 서버도, 남의 서버도 */
  await ctx.route('**://**', r =>
    r.request().url().startsWith('http://127.0.0.1:') ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2700);

  /* 오늘을 못 박습니다 — 「몇 달 남았나」 가 도는 날에 따라 갈리면 안 됩니다 */
  const T = '2026-11-12';
  const F = await page.evaluate((t) => {
    window.toast = function () {};
    window.ccToday = function () { return t; };
    OS.profile = { id: 'me', name: '윤시현', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'me' } };
    OSC.list = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].map(function (id, i) {
      return { id: id, name_masked: '홍○' + '동순돌복쇠판'[i], advisor_id: 'me',
               created_at: '2026-01-01' };
    });
    OSC.loaded = true; CC.calls = {}; CC.loaded = true; CM.loaded = true;
    CM.meta = {};
    CHKS.rows = []; CHKS.at = '방금';
    CHKS.by = {
      /* ① 이번 달 납입 끝 — 코앞 */
      c1: { at: '2026-11-01', sum: { name: '홍○동', top: {},
            end: { pay: { ym: '2026-11', nm: 'KB 종신' }, cov: null, rnw: null } } },
      /* ② 다음 달 갱신 — 코앞 */
      c2: { at: '2026-11-01', sum: { name: '홍○순', top: {},
            end: { pay: null, cov: null,
                   rnw: { ym: '2026-12', nm: '삼성 암보험', every: 3 } } } },
      /* ③ 한 분이 둘 다 코앞 — 줄은 둘, 「명」 은 하나 */
      c3: { at: '2026-11-01', sum: { name: '홍○돌', top: {},
            end: { pay: { ym: '2026-12', nm: '현대 실손' }, cov: null,
                   rnw: { ym: '2026-11', nm: '현대 실손', every: 5 } } } },
      /* ④ 5달 뒤 납입 만기 — 🩺 에는 서지만 코앞은 아닙니다 */
      c4: { at: '2026-11-01', sum: { name: '홍○복', top: {},
            end: { pay: { ym: '2027-04', nm: '먼 것' }, cov: null, rnw: null } } },
      /* ⑤ 올해 끝나는 보장 — 해까지만 아는 것 */
      c5: { at: '2026-11-01', sum: { name: '홍○쇠', top: {},
            end: { pay: null, cov: { y: 2026, age: 60, nm: '정기보험' }, rnw: null } } },
      /* ⑥ 2해 뒤 보장 만기 — 🩺 에는 서지만(BAX_SOON_Y=2) <b>코앞은 아닙니다</b>.
         ⚠ 이 분이 없으면 「올해만 센다」 를 되돌려도 자가 안 웁니다. 처음에
            그랬습니다 — 되돌려 보고 메웠습니다 (8번). */
      c6: { at: '2026-11-01', sum: { name: '홍○판', top: {},
            end: { pay: null, cov: { y: 2028, age: 70, nm: '먼 보장' }, rnw: null } } }
    };
    const S = baxSoon(), R = baxRows();
    return {
      코앞: S.list.map(x => ({ k: x.k, cid: x.cid, s: x.s })), 명: S.n,
      전체: R.length,
      /* 🩺 화면이 세는 수 — 같은 자에게 물었는지 */
      섞임: R.filter(x => x.k === 'pay' || x.k === 'rnw' || x.k === 'cov').length,
      html: hmBaxHtml()
    };
  }, T);

  const cid = (k) => F.코앞.filter(x => x.k === k).map(x => x.cid).join(',');

  console.log('\n[1]·[2] 코앞만 선다');
  is(cid('pay') === 'c1,c3', '이번 달·다음 달 납입 끝 — c1·c3 (받음 ' + cid('pay') + ')');
  is(cid('rnw') === 'c3,c2', '이번 달·다음 달 갱신 — c3·c2 (받음 ' + cid('rnw') + ')');
  is(!F.코앞.some(x => x.cid === 'c4'), '<b>5달 뒤</b> 납입 만기로는 홈에서 안 울린다');

  console.log('\n[4] 보장 만기는 해까지만 안다');
  is(cid('cov') === 'c5', '올해 끝나는 보장만 — c5 (받음 ' + cid('cov') + ')');
  is(!F.코앞.some(x => x.cid === 'c6'),
     '<b>2해 뒤</b> 보장 만기는 🩺 에는 서도 홈 코앞에는 안 선다');
  is(!/\d{4}-\d{2}\s*보장/.test(F.코앞.map(x => x.s).join(' ')),
     '보장 만기에 <b>달을 지어 붙이지 않는다</b> (1번)');

  console.log('\n[5] 한 분이 둘이어도 「명」 은 한 번');
  is(F.코앞.length === 5 && F.명 === 4,
     '줄 5 · 사람 4 (받음 줄 ' + F.코앞.length + ' · 명 ' + F.명 + ')');

  console.log('\n[3] ★★ 세는 곳이 하나다 (5번)');
  is(F.전체 > F.코앞.length,
     '🩺 전체(' + F.전체 + '줄)가 코앞(' + F.코앞.length + '줄)보다 많다 — 거르기만 한다');
  const one = await page.evaluate(() => {
    /* baxRows 를 비우면 <b>홈도 같이</b> 비어야 합니다 — 따로 세고 있으면 안 비웁니다 */
    const keep = window.baxRows;
    window.baxRows = function () { return []; };
    const o = { n: (baxSoon() || {}).n, html: hmBaxHtml() };
    window.baxRows = keep;
    return o;
  });
  is(one.n === 0 && one.html === '',
     'baxRows 를 비우면 홈도 같이 빈다 — <b>따로 세지 않는다</b>');

  console.log('\n[6] 못 읽었으면 null — 「0명」 을 안 적는다 (1번)');
  const unk = await page.evaluate(() => {
    const k = CHKS.rows; CHKS.rows = null;
    const o = { soon: baxSoon(), html: hmBaxHtml() };
    CHKS.rows = k; return o;
  });
  is(unk.soon === null, 'baxSoon 이 null 이다 — 빈 목록이 아니다');
  is(unk.html === '', '못 읽었으면 칸을 아예 안 세운다');

  console.log('\n[7] 코앞이 없으면 칸을 안 세운다');
  const none = await page.evaluate(() => {
    const k = CHKS.by;
    CHKS.by = { c4: { at: '2026-11-01', sum: { name: '홍○복', top: {},
                 end: { pay: { ym: '2027-04', nm: '먼 것' }, cov: null, rnw: null } } } };
    const o = { n: baxSoon().n, html: hmBaxHtml() };
    CHKS.by = k; return o;
  });
  is(none.n === 0 && none.html === '', '먼 것만 있으면 <b>「0명」 을 안 적고</b> 칸도 안 선다');

  console.log('\n[1]·[8]·[9]·[10] 그려진 글');
  is(/hm-fold/.test(F.html) && /코앞에 온 만기·갱신/.test(F.html),
     '<b>접히는 칸</b>으로 선다 — 홈을 더 안 늘린다');
  is(/4명 — 이번 달·다음 달/.test(F.html),
     '머리에 <b>사람 수</b>를 적는다 — 「' + ((F.html.match(/>(\d+명 — [^<]*)</) || [])[1] || '없음') + '」');
  is(/data-ask="코앞만기몇분"/.test(F.html),
     '이름표(data-ask)가 붙어 check-onesay 가 견줄 수 있다');
  is(/홍길동|홍○동/.test(F.html.replace(/홍○/g, '홍○')),
     '이름이 선다 — 홈은 <b>실명이 기본</b>입니다 (3번 · 판 X399)');
  is(!/D-?30|디데이/i.test(F.html),
     '「<b>D-30</b>」 이라고 안 적는다 — 사장님이 그렇게 이르셨습니다');
  is(/🩺 고객 체크 열기/.test(F.html), '눌러서 <b>🩺 화면으로 갈 길</b>이 있다 (6번)');

  console.log('\n[11] 화면에 실제로 선다 — 홈을 그려서');
  const dom = await page.evaluate(() => {
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    const d = document.createElement('div');
    d.id = 'baxsoonProbe';
    /* ⑥ 칸의 <b>몸 그대로</b> 그립니다 — 카드만 그리면 이 칸이 카드 안에
       있는 줄로 재게 됩니다. 실제로 사장님이 보시는 자리는 ⑥ 의 몸입니다. */
    d.innerHTML = HM_MS_BODY.chk();
    document.body.appendChild(d);
    const f = d.querySelector('#hmFold_baxsoon');
    const r = f ? f.getBoundingClientRect() : null;
    /* ★★ <b>제가 홈에 더한 키</b>를 잽니다 — 접이 머리만 재면, 그 위에 펴 둔
       줄을 따로 붙여도 자가 못 봅니다. 되돌림 ⑥ 에서 실제로 안 울었습니다 (8번).
       ⑥ 칸을 두 번 그려 <b>차이</b>를 잽니다. */
    const 키 = () => { const t = document.createElement('div');
      t.style.cssText = 'position:absolute;left:-9999px;top:0;width:390px';
      t.innerHTML = HM_MS_BODY.chk(); document.body.appendChild(t);
      const v = t.getBoundingClientRect().height; t.remove(); return v; };
    const 있을때 = 키();
    const keep = window.hmBaxHtml; window.hmBaxHtml = function () { return ''; };
    const 없을때 = 키(); window.hmBaxHtml = keep;
    const o = { 있나: !!f, 폈나: f ? f.classList.contains('on') : null,
                높이: r ? Math.round(r.height) : -1,
                줄: d.querySelectorAll('.hm-bax-r').length,
                /* ⚠ <b>.hm-chk 로 재면 안 됩니다</b> — 「아무도 없습니다」 를
                   적는 hmChkNoneHtml 도 같은 칸 이름을 씁니다. 처음에 그렇게
                   재어 자가 앱을 헛되이 고발했습니다 (8번). 카드 <b>제 것</b>에게
                   직접 묻습니다. */
                카드없이: (hmChkHtml() === '') && !!f,
                더한키: Math.round(있을때 - 없을때) };
    d.remove();
    return o;
  });
  is(dom.있나, '⑥ 「고객 보험 보기」 칸에 코앞 칸이 선다');
  is(dom.카드없이, '★★ <b>AP·PC·CS 가 한 분도 없어도</b> 선다 — 조용히 빼지 않는다');
  is(dom.폈나 === false, '<b>접힌 채</b>로 선다 — 홈을 길게 하지 않는다');
  is(dom.높이 > 0 && dom.높이 <= 70,
     '접힌 머리가 <b>70px 아래</b>다 (받음 ' + dom.높이 + 'px)');
  is(dom.더한키 > 0 && dom.더한키 <= 80,
     '★ ⑥ 칸에 <b>더한 키가 80px 아래</b>다 — 펴 둔 줄을 몰래 붙이지 않았다 (받음 ' +
     dom.더한키 + 'px)');

  console.log('\n[12] 화면이 안 터진다');
  is(errs.length === 0, '터진 것 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log(bad ? ('\n✗ 어긋남 ' + bad + '곳') : '\n✓ 다 맞습니다');
  process.exit(bad ? 1 : 0);
})();
