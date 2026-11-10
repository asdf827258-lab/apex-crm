/* 🆕 <b>엑셀로 넣은 분이 「오늘」 에서 관리되는가</b> — 판 X393

   사장님 말씀 (2026-11-10) — 「엑셀 파일을 넣으면 고객을 자동분류해서
   고객 365에 분류하는 기능 다시 한번 점검하고 <b>오늘 칸에서 관리하고
   할 수 있도록</b> 만들도록 해줘야지」

   ── 재어 보니 <b>세 곳이 다른 답</b>을 하고 있었습니다 ─────────────
   엑셀로 여섯 분을 넣고 그 자리에서 재었습니다.

     🏠 홈(오늘)      — 「오늘 볼 분 <b>6분</b>」 · 「① 연락 0 / 6」   ← 셈
     📇 고객 365일    — 「<b>다 돌았습니다.</b> 주기를 넘긴 고객이 한 명도 없습니다」
     📇 그 아래 칸    — 「<b>오늘 급히 챙길 고객은 없습니다.</b>」

   같은 여섯 분을 두고 <b>정반대로</b> 말했습니다. 게다가 고객 365일은
   <b>한 화면 안에서</b> 어긋났습니다 — 「챙길 고객 없음」 바로 아래에
   「N명은 등록 뒤 <b>한 번도</b> 연락 기록이 없습니다」 가 떠 있었습니다 (0-1번).

   ── 뿌리 ─────────────────────────────────────────────────────────
   ① ccBand 가 연락 기록이 없으면 <b>등록일부터</b> 셉니다. 오늘 넣으면
      0일이라 「주기 안」 입니다 — 그래서 「다 돌았습니다」.
   ② CC_RULES 의 never 규칙에 <b>7일 유예</b>(d>=7)가 있어, 엑셀로 넣은
      분은 <b>일주일 동안</b> 어느 규칙에도 안 걸렸습니다. 할 일이 한 줄도
      안 섰습니다. 그런데 명단을 넣는 까닭은 <b>바로 연락하려는</b> 것입니다.
   ③ cliMission 이 <b>주기 넘김만</b> 오늘 몫에 넣었습니다.

   ── 보는 것 ──────────────────────────────────────────────────────
     [1] 엑셀로 넣으면 <b>고객 365일 오늘 미션</b>에 그분들이 선다
     [2] ★★ 줄마다 <b>까닭이 정확하다</b> — 「아직 안 밀렸습니다」 가 아니라
         「아직 한 번도 연락 안 하셨습니다」
     [3] ★★ 보드가 <b>「다 돌았습니다」 라고 거짓말하지 않는다</b>
     [4] ★ 「첫 연락 전」 칩이 서고 그 수가 맞다
     [5] ★★ <b>세 곳이 같은 답</b>을 한다 — 홈 · 보드 · 미션 (5번 · 0-1번)
     [6] ★ 「밀린 분」 과 「첫 연락 전」 을 <b>섞어 세지 않는다</b> (1번)
     [7] ★ 홈의 「왜 오늘인가」 가 <b>「주기가 돌아왔습니다」 라고 안 한다</b>
     [8] ★ 한 번 연락하면 <b>그 자리에서 빠진다</b> — 헛것을 안 잡습니다 (8번)

   ★ 사장님 진짜 서버는 읽지 않습니다. 견본 이름은 홍길동 집안입니다 (3번). */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const zlib = require('zlib');
const ROOT = process.cwd();
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
               '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
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

/* ── 견본 CSV — 홍길동 집안 여섯. 묶음(25) 보다 적지만 「첫 한 줄 → 나머지」
     두 길을 다 지납니다. 파일 읽기 자체는 check-cimp 가 봅니다.          */
const NAMES = ['홍길동', '홍길순', '홍말순', '임꺽정', '이몽룡', '성춘향'];
const CSV = '고객명,연락처,성별\n' +
  NAMES.map((n, i) => n + ',010-' + (1000 + i) + '-' + (2000 + i) + ',' + (i % 2 ? '여' : '남')).join('\n') + '\n';

const SEED = (renum) => {
  window.__DB = { clients: [] };
  window.__RENUM = renum;
  window.toast = (m) => { window.__T = m; };
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '윤시현', role: 'owner', active: true };
  window.osAudit = function () {};
  window.cmLoadAll = function (cb) { if (cb) cb(); };
  OSC.loaded = false; OSC.busy = false; OSC.err = ''; OSC.list = [];
  try { localStorage.removeItem('apex_cli_real_me'); } catch (e) {}
  let seq = 0;
  window.osClient = function () {
    const mk = (t) => { const st = { t: t, op: '', pay: null, sel: false }; const a = {
      insert: q => { st.op = 'insert'; st.pay = q; return a; },
      update: q => { st.op = 'update'; st.pay = q; return a; },
      upsert: q => { st.op = 'upsert'; st.pay = q; return a; },
      'delete': () => { st.op = 'delete'; return a; },
      select: () => { st.sel = true; return a; },
      eq: () => a, order: () => a, range: () => a, limit: () => a, single: () => a,
      is: () => a, not: () => a, neq: () => a, gte: () => a, 'in': () => a,
      then: (o, n) => {
        if (!st.op) {
          const rows = (st.t === 'clients') ? window.__DB.clients.map(x => Object.assign({}, x)) : [];
          return Promise.resolve({ data: rows, error: null }).then(o, n);
        }
        if (st.op === 'insert' && st.t === 'clients') {
          const put = [].concat(st.pay || []).map(x => {
            const row = Object.assign({}, x);
            if (window.__RENUM || !row.id) row.id = 'srv-' + (++seq);
            row.created_at = new Date().toISOString();
            window.__DB.clients.push(row); return row;
          });
          if (!st.sel) return Promise.resolve({ error: null }).then(o, n);
          return Promise.resolve({ data: put.map(r => ({ id: r.id, name_masked: r.name_masked })), error: null }).then(o, n);
        }
        return Promise.resolve({ data: [], error: null }).then(o, n);
      } }; return a; };
    return { from: (t) => mk(t), rpc: () => Promise.resolve({ data: null, error: null }) };
  };
  go('home');
};


(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const b = await chromium.launch();
  const b64 = Buffer.from(CSV, 'utf8').toString('base64');
  const ctx = await b.newContext({ viewport: { width: 430, height: 950 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()));
  await p.evaluate(SEED, false);
  await p.waitForTimeout(800);
  /* 사람처럼 — 단추 → 📁 → 파일 → 분류 → 넣기 */
  await p.evaluate(() => { const bt = [...document.querySelectorAll('.hm-cal,button,a')].find(x => /고객 넣기/.test(x.innerText || '')); if (bt) bt.click(); });
  await p.waitForTimeout(350);
  await p.evaluate(() => { const c = [...document.querySelectorAll('#cregSheet .creg-c')].find(x => /엑셀/.test(x.innerText)); if (c) c.click(); });
  await p.waitForTimeout(350);
  await p.evaluate((s) => {
    const bin = atob(s), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const dt = new DataTransfer(); dt.items.add(new File([u], '명단.csv'));
    const inp = document.getElementById('cimpFile'); inp.files = dt.files;
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }, b64);
  await p.waitForTimeout(1400);
  await p.evaluate(() => { const bt = [...document.querySelectorAll('#cimpSheet button')].find(x => /분류해서 보기/.test(x.innerText)); if (bt) bt.click(); });
  await p.waitForTimeout(600);
  await p.evaluate(() => { const bt = document.querySelector('.cimp-b1'); if (bt && !bt.disabled) bt.click(); });
  await p.waitForTimeout(2600);
  const put = await p.evaluate(() => window.__DB.clients.length);
  console.log('[0] 엑셀로 넣기');
  is(put === 6, '  여섯 분이 들어갔다 (받음 ' + put + ')');

  /* ── 🏠 홈 ── */
  await p.evaluate(() => { try { go('home'); } catch (e) {} });
  await p.waitForTimeout(1800);
  const H = await p.evaluate(() => {
    let n = 0; try { n = (typeof hmSteps === 'function') ? hmSteps().length : -1; } catch (e) { n = -2; }
    const t = (document.getElementById('dynPane') || document.body).innerText.replace(/\s+/g, ' ');
    return { n, why: (t.match(/왜 오늘인가[^·]{0,46}/) || [''])[0], 볼분: (t.match(/오늘 볼 분 (\d+)분/) || [])[1] || '' };
  });
  console.log('\n[7] 🏠 홈 — 까닭이 정확한가');
  is(H.n === 6, '  홈이 여섯 분을 오늘 할 일로 센다 (받음 ' + H.n + ')');
  is(!/주기가 돌아왔습니다/.test(H.why),
     '  ★★ 「<b>주기가 돌아왔습니다</b>」 라고 안 한다 — 돌아온 주기가 없습니다 (1번)');
  is(/한 번도/.test(H.why), '  ★ 「' + H.why.slice(0, 40) + '」');

  /* ── 📇 고객 365일 ── */
  await p.evaluate(() => { try { go('clients'); } catch (e) {} });
  await p.waitForTimeout(1900);
  const C = await p.evaluate(() => {
    const all = (document.getElementById('dynPane') || document.body).innerText.replace(/\s+/g, ' ');
    const card = [...document.querySelectorAll('.card')].find(x => /오늘의 미션/.test(x.innerText || ''));
    const mis = card ? (card.innerText || '').replace(/\s+/g, ' ') : '';
    const pills = [...document.querySelectorAll('.cc-pill')].map(x => (x.innerText || '').replace(/\s+/g, ' '));
    return { all, mis, pills };
  });
  console.log('\n[1]·[2] 📇 고객 365일 — 오늘 미션에 서는가');
  is(/🆕/.test(C.mis), '  ★★ 첫 연락 전인 분이 <b>미션에 선다</b>');
  is((C.mis.match(/한 번도 연락 안 하셨습니다/g) || []).length === 6,
     '  여섯 분이 다 섰다 (받음 ' + (C.mis.match(/한 번도 연락 안 하셨습니다/g) || []).length + ')');
  is(!/아직 안 밀렸습니다/.test(C.mis),
     '  ★★ 「<b>아직 안 밀렸습니다</b>」 라고 안 한다 — 왜 오늘 떴는지 알 수 없어집니다 (1번)');

  console.log('\n[3]·[4]·[6] 보드가 거짓말하지 않는가');
  is(!/다 돌았습니다/.test(C.all),
     '  ★★ 「<b>다 돌았습니다</b>」 라고 안 한다 — 첫 연락 전인 분이 여섯입니다 (1번)');
  is(!/오늘 급히 챙길 고객은 없습니다/.test(C.all),
     '  ★★ 「<b>오늘 급히 챙길 고객은 없습니다</b>」 라고도 안 한다 (0-1번)');
  is(/아직 첫 연락 전/.test(C.all), '  ★ 「N명은 아직 첫 연락 전입니다」 라고 적는다');
  const pil = C.pills.find(x => /첫 연락 전/.test(x)) || '';
  is(/^6/.test(pil.replace(/\s/g, '')), '  ★ <b>「첫 연락 전」 칩</b>이 서고 그 수가 6 이다 — 「' + pil + '」');
  is(!/밀린 분/.test(C.mis),
     '  ★ <b>「밀린 분」 과 섞어 세지 않는다</b> — 엑셀로 막 넣은 분은 밀린 것이 아닙니다 (1번)');
  is(/첫 연락 전 6명/.test(C.mis), '  ★ 미션 머리에 <b>첫 연락 전 6명</b> 이라 적는다');

  console.log('\n[5] ★★ 세 곳이 같은 답을 하는가 (5번 · 0-1번)');
  is(H.볼분 === '6' && /첫 연락 전 6명/.test(C.mis) && /6명/.test((C.all.match(/아직 첫 연락 전[^.]*/) || [''])[0] + (C.all.match(/다만 <?b?>?(\d+)명/) || [''])[0]),
     '  홈 「오늘 볼 분 ' + H.볼분 + '분」 · 미션 「첫 연락 전 6명」 · 보드 「6명은 아직 첫 연락 전」');

  console.log('\n[9] ★★ 「오늘」 칸 — 사장님이 거기서 바로 관리하실 수 있는가');
  const T = await p.evaluate(async (names) => {
    const chip = [...document.querySelectorAll('.t-chip[data-f=\"today\"]')][0];
    const lab = chip ? (chip.innerText || '').replace(/\s+/g, ' ') : '(칩이 없습니다)';
    if (chip) chip.click();
    await new Promise(r => setTimeout(r, 1400));
    const host = document.getElementById('oscList');
    /* ⚠⚠ 처음에 저는 <b>목록 칸의 글 전체</b>를 읽었습니다 — 거기에는 보드의
       「첫 연락 전」 이름줄도 들어 있어, 거르기를 일부러 깨뜨려도 여섯 이름이
       그대로 보였습니다. <b>안 울리는 알람</b>이었습니다 (8번). 이제 <b>줄
       안에서만</b> 읽습니다. */
    const its = host ? [...host.querySelectorAll('[onclick*=\"osOpenClient\"]')] : [];
    const txt = its.map(x => (x.innerText || '')).join(' ').replace(/\s+/g, ' ');
    return { lab: lab, f: (typeof CLI_F !== 'undefined') ? CLI_F : '?',
             shown: names.filter(x => txt.indexOf(x) >= 0), open: its.length,
             txt: txt.slice(0, 150) };
  }, NAMES);
  is(/^오늘 6$/.test(T.lab), '  ★ 「오늘」 칩에 <b>6</b> 이라 적힌다 — 「' + T.lab + '」');
  is(T.f === 'today', '  칩을 누르면 그 칸으로 간다 (받음 ' + T.f + ')');
  is(T.shown.length === 6,
     '  ★★ 「오늘」 칸에 여섯 분이 <b>실명으로</b> 선다 — ' +
     (T.shown.join(',') || '(한 분도 안 뜹니다 · 「' + T.txt + '」)'));
  is(T.open >= 6, '  ★ 줄마다 <b>고객 카드를 여는 자리</b>가 있다 (받음 ' + T.open + ')');

  console.log('\n[8] 한 번 연락하면 그 자리에서 빠지는가 (헛것을 안 잡는다 · 8번)');
  const after = await p.evaluate(async () => {
    const id = (window.__DB.clients[0] || {}).id;
    const t = (typeof mcalToday === 'function') ? mcalToday() : '';
    try { CC.calls[id] = t; } catch (e) {}
    try { go('home'); } catch (e) {}
    await new Promise(r => setTimeout(r, 600));
    try { go('clients'); } catch (e) {}
    await new Promise(r => setTimeout(r, 2200));
    const card = [...document.querySelectorAll('.card')].find(x => /오늘의 미션/.test(x.innerText || ''));
    /* ⚠ 처음에 <b>공백 정규화를 빠뜨려</b> 0 이 나왔습니다 — 앱이 아니라
       <b>제가 틀렸습니다</b> (8번). 위 토막과 같이 씻어서 셉니다. */
    const txt = card ? (card.innerText || '').replace(/\s+/g, ' ') : '';
    return { n: (txt.match(/한 번도 연락 안 하셨습니다/g) || []).length,
             머리: (txt.match(/첫 연락 전 (\d+)명/) || [])[1] || '',
             달: (txt.match(/이번 달 \d+명 중 (\d+)명 하셨습니다/) || [])[1] || '',
             카드: !!card };
  });
  is(after.n === 5 && after.머리 === '5',
     '  한 분을 연락 기록하면 <b>다섯</b>으로 줄어든다 (줄 ' + after.n + ' · 머리 ' + after.머리 + '명)');
  is(after.달 === '1', '  ★ 「이번 달 <b>1명</b> 하셨습니다」 로 같이 바뀐다 (받음 ' + after.달 + ')');

  console.log('\n[6-2] 조용한가');
  is(errs.length === 0, errs.length ? ('콘솔 에러 — ' + errs.slice(0, 2).join(' / ')) : '  콘솔에 에러가 없다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
                  : '✓ 엑셀로 넣은 분이 오늘 칸에서 관리됩니다 — 세 곳이 같은 답을 합니다.');
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
