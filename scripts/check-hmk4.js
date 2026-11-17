/* ══════════════════════════════════════════════════════════════════
   check-hmk4.js — <b>4년 계획을 오늘에서.</b> (판 X467 · 2026-11-17)

   사장님 말씀 2026-11-17 — 「4년 계획도 같이 녹여내서 <b>이미 메뉴에
   있다</b>. <b>오늘에서, 고객들 터치하고 관리할수 있도록</b> 만들어」.

   ── 전에는 무엇이 안 됐나 ─────────────────────────────────────────
   홈의 💌 칸은 <b>수만</b> 적었습니다 — 「마디 5건 · 아직 3건」. 그리고
   「보낼 말 보기 →」 를 누르면 <b>고객 365일로 떠났습니다.</b>
   오늘에서 전화도 · 문자도 · 「보냈습니다」 도 할 수가 없었습니다.

   ── 보는 것 ──────────────────────────────────────────────────────
     [1] ★★ <b>접으면 홈이 한 톨도 안 길어진다</b> — 칸이 0px.
         홈 선(check-homeone)에 남은 자리가 3~7px 라, 줄을 펴 두면
         그 자가 웁니다. 그래서 <b>있던 44px 단추</b>를 여는 단추로
         바꾼 것입니다 — 그 약속을 수로 재어 둡니다.
     [2] ★★ <b>누르면 그 자리에서 펴지고 오늘을 안 떠난다</b>
     [3] ★★ <b>터치할 자리가 선다</b> — 📞 전화 · 📋 보낼 말 복사 ·
         ✅ 보냈습니다 가 한 줄 안에
     [4] ★★ <b>「✅ 보냈습니다」 가 오늘에서 먹는다</b> — 줄이 내려가고
         윗줄 「아직 N건」 이 같이 줄고, <b>화면을 안 떠난다</b>
         (이것이 「관리할수 있도록」 입니다)
     [5] ★★ <b>안 보낸 것만 할 일로 세운다</b> — 윗줄 「아직 N건」 과
         <b>같은 수</b>여야 합니다 (0-1번 — 한 화면 두 답 금지)
     [6] ★ <b>번호를 지어내지 않는다</b> (1번) — 모르면 「번호 확인 중」
     [7] ★ <b>떠나는 길은 안 지웠다</b> (6번) — 48개월 차례표와
         「왜 4년인가」 는 여전히 그 화면입니다
     [8] ★ <b>여기서 또 세지 않는다</b> (5번) · <b>새 CSS 0줄</b>
     [9] ★ <b>서버를 한 번도 더 안 부른다</b> (7번)

   ⚠ 이름이 어떻게 서는지(접으면 없고 · 펴면 실명 · 🙈 면 가림)는
     <b>check-hmmadi [6]</b> 이 봅니다 — 두 자가 같은 것을 재지 않습니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8983;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
               '.css': 'text/css', '.json': 'application/json' };
let 부름 = 0;
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/') === 0 || p.indexOf('/rest/v1/') === 0) {
    부름++; rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{}'); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    rs.writeHead(404); rs.end('no'); return;
  }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 2026-10-01 못박음 — 이번 달은 10월입니다 (check-hmmadi 와 같은 날) */
const PIN = () => {
  const R = Date, base = new R('2026-10-01T09:00:00Z').getTime();
  function F() { return arguments.length ? new R(...arguments) : new R(base); }
  F.now = () => base; F.parse = R.parse; F.UTC = R.UTC; F.prototype = R.prototype;
  window.Date = F;
};
const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '홍길동', role: 'owner', active: true, plan: 'vip' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function () {}; window.setupDone = function () { return true; };
  window.actLoad = function () {};
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.db = []; AR.calls = [];
  ACT.day = { '2026-10-01': { call: 1, cli: 0, rep: 0, chk: 0 } }; ACT.from = '2026-08-03';
  try { localStorage.removeItem('apex_mst_done'); } catch (e) {}
  try { localStorage.removeItem('apex_hm_hidenm'); } catch (e) {}
  go('home');
};
/* 10월에 드는 마디 셋 + 10월 밖인 분 하나 + 계약일 모르는 분 하나.
   ★ 이름은 <b>name_masked</b> 에도 넣습니다 — 앱이 읽는 칸이 그쪽입니다.
   ★ 번호는 <b>한 분만</b> 둡니다 — 「모르면 지어내지 않는다」 를 재려면
     모르는 분이 있어야 합니다 (1번). */
const PUT = (rows) => {
  OSC.loaded = true; OSC.busy = false; OSC.err = '';
  OSC.list = (rows || []).map(r => ({ id: r[0], name: r[2] || '홍길동',
    name_masked: r[2] || '홍길동', advisor_id: 'me', phone: r[3] || '' }));
  CM.loaded = true; CM.meta = {};
  (rows || []).forEach(r => { CM.meta[r[0]] = r[1] ? { cd: r[1] } : {}; });
};
const ROWS = [['c1', '2026-09-05', '홍길동A', '010-0000-0001'],
              ['c2', '2026-07-20', '홍길동B', ''],
              ['c3', '2025-10-10', '홍길순',  '010-0000-0003'],
              ['c4', '2026-10-01', '홍갑돌',  ''],
              ['c5', '',           '홍말순',  '']];

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const 터짐 = [];
  p.on('pageerror', e => 터짐.push(String(e.message || e)));
  await p.addInitScript(PIN);
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html',
    { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForTimeout(3600);
  await p.evaluate(SEED);
  await p.waitForTimeout(400);
  await p.evaluate(PUT, ROWS);
  부름 = 0;                                   /* 여기부터 셉니다 */
  await p.evaluate(() => { go('home'); });
  await p.waitForTimeout(700);

  /* 💌 칸을 찾아 둡니다 — 폰에서는 접이 안에 있습니다 */
  const 폄 = await p.evaluate(() => {
    const k = [];
    document.querySelectorAll('#dynPane .hm-fold').forEach(f => {
      if (!f.classList.contains('on') && /이번 달 고객 관리/.test(f.innerText || '')) {
        const id = f.id.replace('hmFold_', ''); try { hmFoldToggle(id); k.push(id); } catch (e) {}
      }
    });
    return k;
  });
  await p.waitForTimeout(300);

  console.log('[1] ★★ 접으면 홈이 한 톨도 안 길어진다 — 칸이 0px');
  const 닫 = await p.evaluate(() => {
    const e = document.getElementById('hmK4Box'), pane = document.getElementById('dynPane');
    return { 있나: !!e, 키: e ? Math.round(e.getBoundingClientRect().height) : -1,
             글: e ? (e.innerHTML || '').length : -1,
             홈: pane ? Math.round(pane.getBoundingClientRect().height) : 0,
             열림: (typeof HMK4 !== 'undefined') ? !!HMK4.open : null };
  });
  is(닫.있나, '  칸이 있다 — #hmK4Box');
  is(닫.열림 === false, '  ★ <b>기본은 접혀 있다</b> — HMK4.open = ' + 닫.열림);
  is(닫.키 === 0 && 닫.글 === 0,
    '  ★★ <b>접으면 0px · 글 0자</b> — ' + 닫.키 + 'px · ' + 닫.글 + '자 (홈 선에 남은 자리가 3~7px 입니다)');

  console.log('\n[2] ★★ 누르면 그 자리에서 펴지고 오늘을 안 떠난다');
  const 열 = await p.evaluate(async () => {
    const b2 = [].slice.call(document.querySelectorAll('#dynPane .hm-rt-go'))
      .filter(e => (e.textContent || '').indexOf('보낼 말') >= 0)[0];
    if (!b2) return { no: '단추를 못 찾았습니다' };
    const 글전 = (b2.textContent || '').trim();
    b2.click();
    await new Promise(r => setTimeout(r, 500));
    const e = document.getElementById('hmK4Box');
    return { 글전: 글전, 글후: (document.getElementById('hmK4Btn') || {}).textContent || '',
             키: e ? Math.round(e.getBoundingClientRect().height) : 0,
             화면: (typeof currentTab === 'function') ? currentTab() : '',
             줄: e ? e.querySelectorAll('.mst-row:not([data-ans])').length : 0,
             글: e ? (e.innerText || '').replace(/\s+/g, ' ') : '' };
  });
  is(!열.no && 열.키 > 100, '  ★★ <b>펴졌다</b> — ' + 열.키 + 'px');
  is(열.화면 === 'home', '  ★★ <b>아직 오늘이다</b> — ' + (열.화면 || '모름') + ' (떠나지 않습니다)');
  is(/보낼 말 보기/.test(열.글전) && /▴/.test(열.글후),
    '  ★ 단추 글자는 <b>목각 그대로</b>이고 화살표만 바뀐다 — 「' + 열.글전 + '」 → 「' + (열.글후 || '').trim() + '」');
  is(열.줄 >= 3, '  ★ 마디 줄이 섰다 — <b>' + 열.줄 + '줄</b> (10월에 드는 마디 셋)');

  console.log('\n[3] ★★ 터치할 자리가 선다 — 📞 · 📋 · ✅');
  const 단 = await p.evaluate(() => {
    const e = document.getElementById('hmK4Box'); if (!e) return {};
    const 한줄 = e.querySelector('.mst-row:not([data-ans])');
    const t = 한줄 ? (한줄.innerText || '') : '';
    const tel = e.querySelectorAll('a.hm-rt-tel[href^="tel:"]').length;
    const 작은 = [].slice.call(e.querySelectorAll('button,a'))
      .filter(x => { const r = x.getBoundingClientRect(); return r.height > 0 && r.height < 44; })
      .map(x => Math.round(x.getBoundingClientRect().height) + 'px 「' + (x.textContent || '').trim() + '」');
    return { 복사: /보낼 말 복사/.test(t), 보냄: /보냈습니다/.test(t), tel: tel,
             확인: /확인할 것/.test(e.innerText || ''), 전달: /전달할 것/.test(e.innerText || ''),
             작은: 작은 };
  });
  is(!!단.복사 && !!단.보냄, '  ★★ 한 줄 안에 <b>📋 보낼 말 복사 · ✅ 보냈습니다</b>');
  is(단.tel >= 1, '  ★★ <b>📞 전화</b>가 걸린다 — tel: 링크 ' + 단.tel + '개 (번호 아는 분만)');
  is(!!단.확인 && !!단.전달,
    '  ★ 전화하면서 볼 <b>☑ 확인할 것 · 📣 전달할 것</b>도 같이 편다 — 4년 유지관리 화면과 같은 글');
  is((단.작은 || []).length === 0,
    '  ★ 누르는 것이 다 <b>44px 이상</b>' + ((단.작은 || []).length ? (' ← ' + 단.작은.join(' / ')) : ''));

  console.log('\n[4] ★★ 「✅ 보냈습니다」 가 오늘에서 먹는다');
  const 눌 = await p.evaluate(async () => {
    const 전 = (function () {
      const e = document.getElementById('hmK4Box');
      const n = document.querySelector('#dynPane [data-ask="이번달마디"]');
      const 아 = (document.querySelector('#dynPane .hm-rt-n0') || {}).innerText || '';
      return { 줄: e ? e.querySelectorAll('.mst-row:not([data-ans])').length : 0,
               마디: n ? (n.textContent || '') : '', 아직: 아.replace(/\s+/g, ' ') };
    })();
    const e0 = document.getElementById('hmK4Box');
    const btn = [].slice.call(e0.querySelectorAll('button'))
      .filter(x => /보냈습니다/.test(x.textContent || ''))[0];
    if (!btn) return { no: '「보냈습니다」 단추를 못 찾았습니다' };
    btn.click();
    await new Promise(r => setTimeout(r, 600));
    const e = document.getElementById('hmK4Box');
    const n = document.querySelector('#dynPane [data-ask="이번달마디"]');
    const 아 = (document.querySelector('#dynPane .hm-rt-n0') || {}).innerText || '';
    return { 전: 전,
             줄: e ? e.querySelectorAll('.mst-row:not([data-ans])').length : -1,
             답줄: e ? e.querySelectorAll('.mst-row[data-ans]').length : -1,
             마디: n ? (n.textContent || '') : '', 아직: 아.replace(/\s+/g, ' '),
             화면: (typeof currentTab === 'function') ? currentTab() : '',
             열림: (typeof HMK4 !== 'undefined') ? !!HMK4.open : null };
  });
  is(!눌.no && 눌.줄 === 눌.전.줄 - 1,
    '  ★★ <b>그 줄이 할 일에서 내려갔다</b> — ' + (눌.전 ? 눌.전.줄 : '?') + '줄 → ' + 눌.줄 + '줄');
  is(눌.화면 === 'home' && 눌.열림 === true,
    '  ★★ <b>화면을 안 떠나고 접히지도 않았다</b> — ' + (눌.화면 || '모름') + ' · 펴짐 ' + 눌.열림);
  is(눌.전 && 눌.마디 === 눌.전.마디,
    '  ★ <b>「마디 N건」 은 그대로</b>다 — ' + (눌.전 ? 눌.전.마디 : '?') + ' → ' + 눌.마디
      + ' (줄면 「없어졌다」 로 읽힙니다)');
  is(눌.전 && 눌.아직 !== 눌.전.아직,
    '  ★★ <b>「아직 N건」 이 줄었다</b> — 「' + (눌.전 ? 눌.전.아직 : '?') + '」 → 「' + 눌.아직 + '」');
  is(눌.답줄 >= 1,
    '  ★ 보낸 줄이 <b>「답을 적어 주십시오」</b> 로 올라왔다 — ' + 눌.답줄 + '줄 (사장님 말씀 2026-10-02)');

  console.log('\n[5] ★★ 안 보낸 것만 할 일로 — 윗줄 「아직 N건」 과 같은 수 (0-1번)');
  const 같 = await p.evaluate(() => {
    const L = mstDueList(), e = document.getElementById('hmK4Box');
    return { monLeft: L.monLeft, 줄: e ? e.querySelectorAll('.mst-row:not([data-ans])').length : -1,
             mon: L.mon.length, ansNo: L.ansNo };
  });
  is(같.monLeft === 같.줄,
    '  ★★ <b>할 일 줄 = 아직 안 보낸 것</b> — ' + 같.줄 + '줄 ↔ ' + 같.monLeft + '건 (한 화면 두 답 금지)');

  console.log('\n[6] ★ 번호를 지어내지 않는다 (1번)');
  const 번 = await p.evaluate(() => {
    const e = document.getElementById('hmK4Box'); if (!e) return {};
    const t = e.innerText || '';
    return { 모름: /번호 확인 중|번호 없음/.test(t),
             가짜: /010-\d{4}-\d{4}/.test(t) && !/010-0000-000/.test(t) };
  });
  is(!!번.모름, '  ★ 번호를 모르는 분은 <b>「번호 확인 중」</b> 이라고 선다 — 지어내지 않습니다');
  is(!번.가짜, '  ★ 심어 둔 것 말고 <b>번호를 지어낸 자리가 없다</b>');

  console.log('\n[7] ★ 떠나는 길은 안 지웠다 (6번)');
  const 길 = await p.evaluate(() => {
    const e = document.getElementById('hmK4Box'); if (!e) return {};
    const b2 = [].slice.call(e.querySelectorAll('button'))
      .filter(x => /4년 유지관리 화면/.test(x.textContent || ''))[0];
    return { 있나: !!b2, 글: b2 ? (b2.textContent || '').trim() : '' };
  });
  is(!!길.있나, '  ★ <b>「📆 4년 유지관리 화면에서 전부 보기 →」</b> 가 있다 — 48개월 차례표는 그 화면입니다');

  console.log('\n[8] ★ 여기서 또 세지 않는다 (5번) · 새 CSS 0줄');
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const FN = (nm) => { const i = src.indexOf('function ' + nm + '('); if (i < 0) return '';
    const r = src.slice(i + 1), e = r.indexOf('\nfunction '); return e > 0 ? r.slice(0, e) : r.slice(0, 4000); };
  const K4 = FN('hmK4BodyHtml');
  is(K4.length > 0, '  hmK4BodyHtml 을 찾았다 — ' + K4.length + '자');
  is(K4.length > 0 && !/mstAdd\(|\.cd\b|new Date\(/.test(K4),
    '  ★★ <b>계약일을 직접 읽거나 날을 세지 않는다</b> — 세는 자는 mstDueList 하나입니다');
  is(K4.length > 0 && /mstRowHtml\(/.test(K4) && /mstAnsRowHtml\(/.test(K4),
    '  ★★ <b>줄은 4년 유지관리가 쓰는 그 자</b>가 그립니다 — 베껴 적지 않았습니다');
  is(K4.length > 0 && !/<style|\.hmK4|\.hm-k4/.test(K4),
    '  ★ <b>새 CSS 0줄</b> — 있던 .mst-* · .hm-rt-* 뿐입니다');
  is(K4.length > 0 && /mstCss\(\)/.test(K4),
    '  ★ <b>옷을 이 화면에서도 부른다</b> (5번) — 안 부르면 홈에서 줄이 벌거벗습니다');

  console.log('\n[9] ★ 서버를 한 번도 더 안 부른다 (7번)');
  is(부름 === 0, '  켜고 펴고 누르는 동안 서버 부름 <b>' + 부름 + '번</b>');
  is(터짐.length === 0, '  조용히 터진 곳이 없다' + (터짐.length ? (' ← ' + 터짐.slice(0, 2).join(' / ')) : ''));

  await p.evaluate((k) => { k.forEach(id => { try { hmFoldToggle(id); } catch (e) {} }); }, 폄);
  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데 — 오늘에서 고객을 터치·관리하지 못합니다')
                  : '✓ 접으면 0px · 누르면 그 자리에서 펴지고 · 📞 전화와 ✅ 보냈습니다가 오늘에서 먹습니다 (판 X467)');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('터짐: ' + (e && e.message)); try { srv.close(); } catch (x) {} process.exit(2); });
