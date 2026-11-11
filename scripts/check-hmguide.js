/* 🧭 <b>오늘 가이드 · 멘트 추천</b> — 판 X408

   사장님 말씀 (2026-11-11) — 「오늘 해야할일들이 하나씩 보이는데 <b>너가
   가르켜주고 도움말 붙여서, 하나씩 해나갈수 있도록 가이드를 잡아줘</b>.
   그리고 오늘에서 고객들 연락 돌릴때 <b>멘트 추천</b>등을 해줘 전에
   했었는데 보이지 않아.」

   ── 왜 안 보였나 ─────────────────────────────────────────────────
   말은 <b>없어진 적이 없습니다</b>. apex-stage.js 에 그대로 있고 hmTaHtml 이
   그립니다. 다만 <b>「이분 자세히 ▾」 를 눌러야</b> 나왔습니다. 카드에
   보이는 것은 「🙋 고객의 현재 상황은 무엇인가요?」 라는 <b>되묻는 단추</b>
   뿐이라, 사장님 눈에는 멘트가 사라진 것으로 보였습니다.
   ①~⑤ 걸음 띠도 마찬가지입니다 — 도움말(HM_WAY[].s)이 <b>aria-label 안에만</b>
   있어 눈으로는 안 보였습니다.

   ── 세 층 ────────────────────────────────────────────────────────
     층 1 · 걸음 도움말  .hm-waytip  — 지금 어느 걸음이고 무엇을 하는가
     층 2 · 이렇게 하세요 .hm-how     — ① 전화 ② 첫 마디 + 📋 복사
     층 3 · 멘트 잇기    hmSayStage  — 달력에서 올라온 줄도 화법을 찾는다

   ── 보는 것 ──────────────────────────────────────────────────────
     [1] ★★ 도움말이 <b>눈에 보이는가</b> · 두 줄 안에 드는가
         ★★ 「지금 걸음」 을 <b>다시 세지 않는가</b> — 띠와 글이 같은 걸음 (5번)
         ★  다섯 걸음에 <b>빠짐없이</b> 도움말이 있는가
     [2] ★★ ① 이 <b>진짜 전화 고리</b>인가 · ② 가 멘트 + 📋 복사인가
         ★★ 번호를 모르면 <b>모른다고 적는가</b> (1번)
         ★  단추가 손가락에 닿는가 · 상자가 홈을 많이 안 먹는가
     [3] ★★ 멘트가 <b>출처에 맞는가</b> — apex-stage 한 곳에서 온다 (5번)
         ★★ 📋 복사가 <b>화면의 그 말</b>을 베끼는가 (5번)
     [4] ★★ 접이를 펴면 <b>긴 멘트 카드가 그대로</b> 선다 — 지운 것이 아니다 (6번)
         ★★ 🙋 되묻는 단추도 <b>그대로</b> — 사장님이 시키신 것이다 (6번 · 2026-10-02)
     [5] ★★ 번호를 묻는 자가 <b>두 명단을 다 보는가</b> — 고객 365 · 배정 DB

   ★ 사장님 진짜 서버는 안 읽습니다. 이름은 홍길동 집안입니다 (3번). */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
               '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
               '.svg':'image/svg+xml', '.png':'image/png', '.webmanifest':'application/json' };
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

/* 견본 — 출처가 서로 다른 셋. 임꺽정은 <b>번호가 없습니다</b>(1번을 재려고). */
const SEED = () => {
  window.toast = m => { window.__T = m; };
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '윤시현', role: 'owner', active: true };
  window.osAudit = function () {};
  window.osClient = function () {
    const mk = t => { const st = { t, sel: false }; const a = {
      insert: () => a, update: () => a, upsert: () => a, 'delete': () => a,
      select: () => { st.sel = true; return a; },
      eq: () => a, order: () => a, range: () => a, limit: () => a, single: () => a,
      is: () => a, not: () => a, neq: () => a, gte: () => a, lte: () => a, 'in': () => a, or: () => a,
      then: (o, n) => Promise.resolve({ data: [], error: null }).then(o, n) }; return a; };
    return { from: t => mk(t), rpc: () => Promise.resolve({ data: null, error: null }) };
  };
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = [];
  try { osHideLoginGate(); } catch (e) {}
  go('home');
};
const FEED = () => {
  const d = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
  const DBS = [
    { id:'db-1', assigned_to:'me', customer_name:'홍길동', region:'서울', dong:'역삼동',
      phone:'010-1000-2000', source:'보장분석', assigned_date:d(9), next_appt:null },
    { id:'db-2', assigned_to:'me', customer_name:'홍길순', region:'서울', dong:'삼성동',
      phone:'010-1001-2001', source:'지인소개', assigned_date:d(4), next_appt:null },
    { id:'db-3', assigned_to:'me', customer_name:'임꺽정', region:'성남', dong:'분당',
      phone:'', source:'홈쇼핑', assigned_date:d(2), next_appt:null }
  ];
  AR.db = arDbCalc(DBS, []); AR.loaded = true; AR.err = '';
  try { osHideLoginGate(); } catch (e) {}
  go('home');
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  /* ★ <b>바깥을 막습니다</b> — 점검이 사장님 진짜 서버를 읽으면 안 됩니다.
     막은 것은 <b>끊습니다</b>(abort): 기다리게 두면 곳마다 다른 순간을 잽니다. */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + port) >= 0
                                ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push('' + e.message));
  await pg.goto(`http://127.0.0.1:${port}/app/index.html`, { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => typeof go === 'function' && typeof hmWayHd === 'function', { timeout: 30000 });
  await pg.evaluate(SEED); await pg.waitForTimeout(900);
  await pg.evaluate(FEED); await pg.waitForTimeout(1400);

  console.log('\n[1] 🧭 <b>지금 어느 걸음이고 무엇을 하는가</b> — 걸음 도움말');
  const tip = await pg.evaluate(() => {
    const e = document.querySelector('.hm-waytip');
    if (!e) return null;
    const r = e.getBoundingClientRect();
    /* 띠에서 파랗게 선 걸음 — <b>글과 같은 걸음이어야</b> 합니다 */
    const on = document.querySelector('.hm-way-c.on');
    return { txt: e.innerText.replace(/\s+/g, ' ').trim(), h: Math.round(r.height),
             k: e.getAttribute('data-waytip'), rail: !!document.querySelector('.hm-way'),
             onk: on ? on.getAttribute('data-wc') : '', cut: /…|\.\.\./.test(e.innerText),
             tbl: (typeof HM_WAY !== 'undefined') ? HM_WAY.map(w => ({ k: w.k, h: !!w.h, s: !!w.s })) : [] };
  });
  is(!!tip, '  도움말 한 줄이 <b>눈에 보인다</b> — 여태 aria-label 안에만 있었다');
  if (!tip) { console.log('\n✗ 도움말 줄이 없어 더 못 봅니다'); await br.close(); srv.close(); process.exit(1); }
  console.log('      「' + tip.txt + '」 (' + tip.h + 'px · 걸음=' + tip.k + ')');
  is(tip.h <= 64, '  <b>두 줄 안</b>에 든다 — ' + tip.h + 'px ≤ 64 (홈 선을 많이 안 먹는다)');
  is(tip.rail, '  ①~⑤ 띠는 <b>그대로</b> 있다 — 바꾼 것이 아니라 보탠 것이다 (6번)');
  is(!!tip.k && tip.k === tip.onk,
     '  ★★ 「지금 걸음」 을 <b>다시 세지 않는다</b> — 띠(' + tip.onk + ')와 글(' + tip.k + ')이 같다 (5번)');
  is(tip.tbl.length === 5 && tip.tbl.every(w => w.h),
     '  다섯 걸음에 <b>빠짐없이</b> 도움말이 있다 — ' + tip.tbl.filter(w => w.h).length + '/5 (HM_WAY 표 한 곳 · 5번)');

  console.log('\n[2] ✅ <b>이렇게 하세요</b> — 한 분을 끝내는 두 걸음');
  const how = await pg.evaluate(() => {
    const e = document.querySelector('.hm-how');
    if (!e) return null;
    const a = e.querySelector('a.hm-how-b'), c = e.querySelector('button.hm-how-b');
    const t = e.querySelector('.hm-how-t');
    return { h: Math.round(e.getBoundingClientRect().height),
      say: t ? t.innerText.replace(/\s+/g, ' ').trim() : '',
      tel: a ? a.getAttribute('href') : '', telT: a ? a.innerText.trim() : '',
      telH: a ? Math.round(a.getBoundingClientRect().height) : 0,
      cp: c ? (c.getAttribute('onclick') || '') : '', cpT: c ? c.innerText.trim() : '',
      cpH: c ? Math.round(c.getBoundingClientRect().height) : 0,
      /* ★★ <b>말이 잘렸나</b> — 여기서 두 번 데였습니다. 글자로 읽으면
         (innerText) 잘려도 <b>전문이 나와</b> 멀쩡해 보입니다. 라이브를
         찍어 보고서야 「신청해…」 에서 끊긴 것을 봤습니다. 이제 <b>그려진
         높이</b>로 잽니다 — 속이 겉보다 크면 잘린 것입니다 (8번). */
      cut: t ? (t.scrollHeight - t.clientHeight > 2) : false,
      cutPx: t ? (t.scrollHeight - t.clientHeight) : 0,
      /* 「이분 끝」 단추가 <b>제 이름(.hm-nx-f)</b>으로 찾아지나 — 내 글이 남의 눈을
         가리면 안 됩니다. check-hmblank 가 글자로 찾다 제 도움말을 눌렀습니다 (8번). */
      fin: !!document.querySelector('#dynPane .hm-nx-f') };
  });
  is(!!how, '  카드에 <b>한 줄</b>이 선다 — 펴 보지 않아도 번호와 첫 마디가 보인다');
  if (!how) { console.log('\n✗ 줄이 없어 더 못 봅니다'); await br.close(); srv.close(); process.exit(1); }
  console.log('      [' + how.telT + ' → ' + how.tel + '] ' + how.say.slice(0, 50) + ' [' + how.cpT + ']');
  is(/^tel:\d/.test(how.tel || ''), '  ★★ <b>진짜 전화 고리</b>다 — ' + (how.tel || '없음'));
  is(/hmTaCopy\(/.test(how.cp || ''),
     '  ★★ 📋 복사가 <b>이미 있던 자(hmTaCopy)</b>를 부른다 — 새로 베끼지 않는다 (5번)');
  is(how.telH >= 44 && how.cpH >= 44, '  단추가 <b>손가락에 닿는다</b> — ' + how.telH + '·' + how.cpH + 'px (≥44)');
  is(how.h <= 80, '  ★★ <b>한 줄을 넘지 않는다</b> — ' + how.h + 'px ≤ 80 (카드에 예산을 쥔 자가 넷입니다)');
  is(how.fin, '  ★★ 「이분 끝」 단추가 <b>제 이름(.hm-nx-f)</b>으로 찾아진다 — 내 글이 남의 눈을 안 가린다');
  is(!how.cut, '  ★★ 첫 마디가 <b>안 잘린다</b> — 그려진 높이로 잽니다(넘친 ' + how.cutPx + 'px). ' +
     '글자로 읽으면 잘려도 전문이 나와 멀쩡해 보입니다 (8번)');
  /* 출처마다 길이가 다릅니다 — <b>제일 긴 것</b>으로도 재야 합니다 (1번) */
  const cutAll = await pg.evaluate(() => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:16px;top:0;width:328px;visibility:hidden';
    document.body.appendChild(d);
    const out = [];
    ['보장분석', '지인소개', '홈쇼핑', '농협', '개척', ''].forEach(v => {
      d.innerHTML = hmHowHtml({ id: 'db-1', k: 'db', tk: 'TA', key: 'db-1', src: v });
      const t = d.querySelector('.hm-how-t');
      if (t) out.push({ v: v || '(없음)', px: t.scrollHeight - t.clientHeight });
    });
    d.remove(); return out;
  });
  console.log('      ' + cutAll.map(x => x.v + (x.px > 2 ? ('✗넘침' + x.px) : '✓')).join(' · '));
  is(cutAll.every(x => x.px <= 2), '  ★★ <b>출처 여섯 갈래 어느 것도</b> 안 잘린다 — 제일 긴 말로도 잽니다');

  console.log('\n[3] 💬 <b>멘트는 apex-stage 한 곳에서</b> 온다 (5번 · 1번)');
  /* ⚠ 처음엔 「다음 분」 을 세 번 눌러 견주었는데, 그러면 <b>줄이 다 뒤로
     밀려</b> 뒤따르는 [4] 가 카드를 못 찾았습니다. <b>자가 화면을 망가뜨리면
     안 됩니다</b> — 누르지 않고, 말을 내는 자에게 바로 묻습니다 (8번). */
  const say = await pg.evaluate(() => {
    const SRC = ['보장분석', '지인소개', '홈쇼핑'];
    const one = v => (typeof APEX_STAGE !== 'undefined' && APEX_STAGE.script)
      ? ((('' + ((APEX_STAGE.script('TA', v) || {}).say || '')).split('\n')[0]) || '') : '';
    return { says: SRC.map(one), srcs: SRC };
  });
  console.log('      ' + say.says.map((s, i) => say.srcs[i] + ' → ' + s.slice(0, 44)).join('\n      '));
  is(say.says.filter(Boolean).length >= 2, '  출처마다 <b>저마다 첫 마디</b>가 있다');
  is(new Set(say.says.filter(Boolean)).size >= 2,
     '  ★★ 출처가 다르면 <b>말도 다르다</b> — 열일곱 갈래가 같은 인사를 받지 않는다');
  /* 📋 복사가 <b>화면의 그 말</b>을 베끼는가 — 둘이 갈리면 보고 쓴 말과 붙여넣은 말이 다릅니다 */
  const cp = await pg.evaluate(() => {
    const r = (typeof hmNext === 'function') ? hmNext() : null;
    const x = r && r.x; if (!x) return null;
    const S = (typeof APEX_STAGE !== 'undefined' && APEX_STAGE.script)
      ? APEX_STAGE.script(hmTaKind(x), hmSrcOf(x)) : null;
    const e = document.querySelector('.hm-how .hm-how-t');
    return { one: S ? ('' + S.say).split('\n')[0] : '', scr: e ? e.innerText.replace(/^💬\s*/, '').trim() : '' };
  });
  is(!!cp && !!cp.one && cp.scr.indexOf(cp.one.slice(0, 18)) >= 0,
     '  ★★ 화면의 첫 마디와 복사가 <b>같은 자에게</b> 묻는다 (5번)');

  console.log('\n[4] 🙈 <b>접은 것이지 지운 것이 아니다</b> (6번)');
  const pre = await pg.evaluate(() => !!document.querySelector('.hm-ta'));
  is(!pre, '  접힌 채로는 <b>긴 멘트 카드가 안 선다</b> — 홈이 길어지지 않는다');
  await pg.evaluate(() => {
    const f = [...document.querySelectorAll('.hm-more-b')].find(x => /이분 자세히/.test(x.innerText || ''));
    if (f) f.click();
  });
  await pg.waitForTimeout(700);
  const post = await pg.evaluate(() => ({
    ta: !!document.querySelector('.hm-ta'),
    ask: /현재 상황은 무엇인가요/.test(document.body.innerText) }));
  is(post.ta, '  <b>펴면 긴 멘트 카드가 그대로</b> 선다 — 한 줄로 줄인 것이지 뺀 것이 아니다');
  is(post.ask, '  🙋 <b>되묻는 단추도 그대로</b> — 사장님이 시키신 것이다 (2026-10-02)');

  console.log('\n[5] 📞 <b>번호를 묻는 자는 두 명단을 다 본다</b> (1번 · 5번)');
  const tel = await pg.evaluate(() => {
    /* 고객 365(OSC.list)에만 있는 분 — 여태 배정 DB 만 보아 「모른다」 고 했습니다 */
    OSC.list = [{ id: 'cli-9', name: '홍말순', phone: '010-7777-8888' }];
    const a = { of: hmTelOf('cli-9'), href: hmTelHref('cli-9'), known: hmTelKnown('cli-9') };
    const b = { of: hmTelOf('db-1'), known: hmTelKnown('db-1') };     /* 배정 DB 쪽은 그대로 */
    const c = { of: hmTelOf('db-3'), known: hmTelKnown('db-3') };     /* 적혀 있지 않은 분 */
    const d = { of: hmTelOf('없는사람'), known: hmTelKnown('없는사람') };
    OSC.list = [];
    return { a, b, c, d };
  });
  is(tel.a.of === '010-7777-8888' && /^tel:\d/.test(tel.a.href),
     '  ★★ 고객 365 에 계신 분의 번호를 <b>찾는다</b> — ' + (tel.a.of || '못 찾음'));
  is(tel.b.of === '010-1000-2000', '  배정 DB 쪽 답은 <b>그대로</b>다 — ' + (tel.b.of || '못 찾음') + ' (먼저 본다)');
  is(tel.c.known && !tel.c.of, '  ★ 번호가 <b>안 적힌 분</b>은 「없다」 — 0 이나 「-」 로 안 채운다 (1번)');
  is(!tel.d.known && !tel.d.of, '  ★ <b>모르는 분</b>은 「아직 못 물었다」 — 「없다」 와 가린다 (1번)');
  const nophone = await pg.evaluate(() => {
    const h = (typeof hmHowHtml === 'function') ? hmHowHtml({ id: 'db-3', k: 'db', tk: 'TA', key: 'db-3', src: '홈쇼핑' }) : '';
    /* 「번호 없음」(서버가 없다고 함) 과 「번호 확인 중」(아직 못 물음) 을 가립니다 (1번) */
    const m = /class="hm-how-b g">([^<]*)</.exec(h);
    return { h: h, tel: /href="tel:/.test(h), say: /번호 없음|번호 확인 중/.test(h), t: m ? m[1] : '' };
  });
  is(!nophone.tel && nophone.say,
     '  ★★ 번호를 모르면 <b>빈 고리를 안 세우고 모른다고 적는다</b> (1번) — ' + (nophone.t || '없음'));

  console.log('\n[6] 🧨 <b>화면이 터지지 않았다</b>');
  is(errs.length === 0, errs.length ? ('  콘솔 에러 — ' + errs.slice(0, 3).join(' | ')) : '  콘솔 에러 <b>없음</b>');

  console.log('\n' + (bad ? ('✗ 오늘 가이드 — 고칠 자리 ' + bad + '곳') :
    '✓ 걸음마다 도움말이 서고, 멘트는 펴 보지 않아도 보입니다'));
  await br.close(); srv.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.error('터짐: ' + e.message); process.exit(2); });
