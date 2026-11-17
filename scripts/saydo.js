/* 🔎 <b>말은 하는데 안 하는 자리</b> — 오늘(홈)의 누를 것을 하나씩 눌러 봅니다.

   ★ <b>점검이 아닙니다</b> — CI 에 안 넣습니다. 줄줄이 누르면 앞의 것이 뒤의 것을
     바꿔 놓아 <b>헛것으로 고발</b>합니다(아래 ⚠ 셋). 사람이 보고 의심나는 것만
     새 창에서 하나씩 다시 누르는 <b>길잡이</b>입니다 (8번).

   왜 만들었나 — 2026-11-16 에 ② 만남 칩이 「동선 · 오늘 약속 · <b>이번 주</b>」 라
   적어 놓고 이번 주를 한 번도 안 펴 주던 것을 찾았고(판 X462), 2026-11-17 에
   같은 자로 📒 <b>이번 달</b> 도 찾았습니다(판 X463). 둘 다 <b>가리키는 칸이
   접힌 접이 안</b>이라 눌러도 소리 없이 끝나던 자리입니다.

   ⚠⚠ <b>이 자를 만들며 제가 세 번 틀렸습니다 — 다음 세션은 같은 데서 데이지 마십시오.</b>
     ⑴ 이름표(data-*)를 <b>한 번만</b> 붙였더니, 단추 하나를 누르면 홈이 다시
        그려져 이름표가 날아가 <b>클릭이 아예 안 들어갔습니다</b>. 49개 중 45개를
        거짓으로 고발했습니다. → <b>누르기 직전에</b> 글과 onclick 으로 다시 찾습니다.
     ⑵ 「지금 홈인가」 를 <b>document 전체</b>에서 #hmJobWrap 으로 물었더니, 다른
        화면으로 가도 <b>「홈이다」</b> 라고 답했습니다(안 보이는 칸이 DOM 에 남아
        있습니다). → <b>보이는 키</b>를 묻습니다.
     ⑶ 한 창에서 줄줄이 누르면 앞의 것이 단추를 없애 「못 찾음」 이 납니다
        (「✅ 이분 끝」 을 누르면 다음 분으로 넘어가 그 분의 단추가 사라집니다).
        → <b>의심나는 것은 새 창에서 하나씩</b> 다시 누릅니다.

   쓰는 법 — node scripts/saydo.js                                        */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = '/home/user/apex-crm';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
               '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
               '.png':'image/png', '.svg':'image/svg+xml' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id:'me', name:'윤시현', role:'owner', active:true, plan:'vip', team_id:'t1' };
  OS.cfg = OS.cfg || {}; OS.cfg.schema_version = '47';
  ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients']
    .forEach(k => { window[k] = function () {}; });
  window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function () {}; window.setupDone = () => true;
  const chain = v => { const o = { then: function (f) { try { f(v); } catch (e) {} return o; },
                                   catch: function () { return o; } };
    ['eq','neq','select','order','limit','in','gte','lte','is','not','or','filter','ilike','like','range']
      .forEach(k => { o[k] = function () { return o; }; });
    o.single = () => chain({ data: null }); o.maybeSingle = () => chain({ data: null }); return o; };
  window.osClient = function () { return { from: function () { return {
      select: () => chain({ data: [], count: 0 }), update: () => chain({}), insert: () => chain({}),
      upsert: () => chain({}), delete: () => chain({}) }; } }; };
  OSC.loaded = true; OSC.busy = false; OSC.err = '';
  OSC.list = [{ id:'c1', advisor_id:'me', name_masked:'홍*동', created_at:'2026-09-03' }];
  CM.loaded = true; CM.meta = {};
  AR.loaded = true; AR.busy = ''; AR.cliRows = [];
  AR.db = [{ id:'d0', who:'me', name:'홍길동', region:'순천', src:'일반', stage:'TA', days:3, n:1, res:'' },
           { id:'d1', who:'me', name:'홍길순', region:'광주', src:'소개', stage:'AP', days:9, n:1, res:'' }];
  go('home');
};

/* 지금 화면이 어떤 모습인가 — 누르기 전후로 견줍니다 */
const 찍 = () => {
  const p = document.getElementById('dynPane');
  return {
    글: ((p && p.innerText) || '').replace(/\s+/g, ' ').trim(),
    편것: [].slice.call(document.querySelectorAll('.hm-fold.on')).map(e => e.id).sort().join('|'),
    홈인가: (function(){ var w=document.getElementById('hmJobWrap');
             return !!(w && w.getBoundingClientRect().height > 0); })(),
    스크롤: Math.round(window.scrollY),
    덮개: document.querySelectorAll('.ovl,.modal,[id$="Ovl"],[id$="Modal"]').length,
    /* ★★ 2026-11-17 — <b>네 번째로 제가 틀린 자리입니다.</b> 덮개를 <b>이름으로</b>
       세고 있었습니다(.ovl · .modal · …Ovl · …Modal). 그런데 「➕ 고객 넣기」 가
       띄우는 창은 <b>#cregSheet</b> 라 그 어느 것도 아닙니다 — 430×900px 짜리
       창이 멀쩡히 서는데 이 자는 「아무 일도 안 일어납니다」 라고 고발했습니다.
       ★ 이름으로 적으면 창이 하나 늘 때마다 이 자가 낡습니다. 그래서
         <b>「몸(body)에 붙어 떠 있는 것」 자체를</b> 잽니다 — 이름을 안 묻습니다.
       (헛것을 잡는 자는 안 잡는 자보다 나쁩니다 · 8번) */
    띄운것: [].slice.call(document.body.children).filter(e => {
      if (e.id === 'dynPane') return false;
      if (e.querySelector && e.querySelector('#dynPane')) return false;
      const s = getComputedStyle(e), r = e.getBoundingClientRect();
      return (s.position === 'fixed' || s.position === 'absolute')
        && s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05
        && r.height > 40 && r.width > 40;
    }).map(e => (e.id || e.className || '?') + ':' + Math.round(e.getBoundingClientRect().height))
      .sort().join('|'),
    높이: p ? Math.round(p.scrollHeight) : 0
  };
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 430, height: 844 }, deviceScaleFactor: 1 });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                  ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 120)));
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => typeof renderHome === 'function', { timeout: 60000 });
  await pg.evaluate(SEED);
  await pg.waitForTimeout(2800);

  /* 누를 것 목록 — 홈 안쪽만. 위 띠·아래 띠는 다른 자가 봅니다 (5번) */
  const 목록 = await pg.evaluate(() => {
    const p = document.getElementById('dynPane');
    const out = [];
    [].slice.call(p.querySelectorAll('button,[onclick],[role="button"]')).forEach((e, i) => {
      const r = e.getBoundingClientRect();
      if (r.height < 8 || r.width < 8) return;
      if (e.closest('[hidden]') || getComputedStyle(e).display === 'none') return;
      e.setAttribute('data-saydo', String(i));
      out.push({ i,
        글: (e.innerText || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 46),
        말: (e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 70),
        onclick: (e.getAttribute('onclick') || '').slice(0, 60) });
    });
    return out;
  });
  console.log('오늘 화면에서 누를 수 있는 것 — ' + 목록.length + '개\n');

  const 죽은 = [], 산것 = [];
  for (const it of 목록) {
    const 전 = await pg.evaluate(찍);
    let 터짐 = '';
    const n0 = errs.length;
    /* ⚠⚠ <b>2026-11-17 — 여기서 제 자가 거짓말을 했습니다.</b> 이름표를 <b>한 번만</b>
       붙여 두었는데, 단추 하나를 누르면 홈이 통째로 다시 그려져 <b>이름표가 날아갑니다.</b>
       그래서 둘째부터는 누를 것을 못 찾아 <b>클릭이 아예 안 들어갔고</b>, 자는 그것을
       「눌러도 아무 일 없음」 이라고 적었습니다 — 49개 중 45개를 거짓으로 고발했습니다.
       「헛것을 잡는 점검은 안 잡는 점검보다 나쁘다」(8번). <b>누르기 직전에 다시 붙입니다.</b> */
    const 눌림 = await pg.evaluate((args) => {
      const p = document.getElementById('dynPane');
      const L = [].slice.call(p.querySelectorAll('button,[onclick],[role="button"]'))
        .filter(e => { const r = e.getBoundingClientRect();
          return r.height >= 8 && r.width >= 8 && getComputedStyle(e).display !== 'none'; });
      /* 자리 번호가 아니라 <b>글과 onclick 으로</b> 찾습니다 — 칸이 늘고 줄어도 같은 것을 누릅니다 */
      const 같나 = e => ((e.innerText || e.getAttribute('aria-label') || '')
          .replace(/\s+/g, ' ').trim().slice(0, 46) === args.글) &&
        ((e.getAttribute('onclick') || '').slice(0, 60) === args.onclick);
      const e = L.filter(같나)[0];
      if (!e) return '못 찾음';
      e.click();
      return '';
    }, { 글: it.글, onclick: it.onclick });
    if (눌림) 터짐 = 눌림;
    await pg.waitForTimeout(700);
    const 후 = await pg.evaluate(찍);
    if (errs.length > n0) 터짐 = errs[errs.length - 1];

    const 바뀜 = [];
    if (전.글 !== 후.글) 바뀜.push('글');
    if (전.편것 !== 후.편것) 바뀜.push('접이');
    if (전.홈인가 !== 후.홈인가) 바뀜.push('화면');
    if (Math.abs(전.스크롤 - 후.스크롤) > 8) 바뀜.push('스크롤');
    if (전.덮개 !== 후.덮개) 바뀜.push('덮개');
    if (전.띄운것 !== 후.띄운것) 바뀜.push('띄운 창');
    if (Math.abs(전.높이 - 후.높이) > 8) 바뀜.push('길이');

    const 줄 = { ...it, 바뀜: 바뀜.join('·'), 터짐 };
    if (!바뀜.length || 터짐) 죽은.push(줄); else 산것.push(줄);

    /* 화면이 바뀌었으면 홈으로 돌아옵니다 — 다음 단추를 같은 자리에서 누르려고 */
    /* ⚠ <b>돌아오지 않으면 그 뒤는 전부 거짓입니다.</b> 첫 단추가 go('crm') 이라
       홈을 떠났는데 안 돌아와, 남은 47개가 몽땅 「못 찾음」 으로 찍혔습니다 (8번). */
    if (!후.홈인가 || 전.덮개 !== 후.덮개) {
      for (let t = 0; t < 3; t++) {
        await pg.evaluate(() => { try {
          document.querySelectorAll('.ovl,[id$="Ovl"],[id$="Modal"]').forEach(x => {
            if (x.parentNode) x.parentNode.removeChild(x); });
          go('home');
        } catch (e) {} });
        await pg.waitForTimeout(1300);
        const ok = await pg.evaluate(() => { const w = document.getElementById('hmJobWrap');
          return !!(w && w.getBoundingClientRect().height > 0); });
        if (ok) break;
      }
      const 돌아옴 = await pg.evaluate(() => { const w = document.getElementById('hmJobWrap');
        return !!(w && w.getBoundingClientRect().height > 0); });
      if (!돌아옴) { console.log('⚠ 「' + it.글 + '」 뒤에 홈으로 못 돌아왔습니다 — 여기서 멈춥니다'); break; }
    }
  }

  console.log('✓ 무언가 하는 것 — ' + 산것.length + '개');
  console.log('✗ 눌러도 아무 일 없거나 터지는 것 — ' + 죽은.length + '개\n');
  죽은.forEach(x => console.log('  · 「' + (x.글 || '(글 없음)') + '」' +
    (x.터짐 ? '  ⚠ ' + x.터짐 : '  — 아무 변화 없음') +
    (x.onclick ? '\n      ' + x.onclick : '')));
  if (errs.length) { console.log('\n【브라우저가 토한 것 ' + errs.length + '개】');
    [...new Set(errs)].slice(0, 12).forEach(e => console.log('  ' + e)); }
  await br.close(); srv.close();
})();
