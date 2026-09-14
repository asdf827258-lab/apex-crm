#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   달력에 <b>내가 직접</b> 일정을 넣을 수 있는가

   달력이 여태 <b>앱이 만든 것</b>만 찍었습니다 — 고객 연락 주기 · 약속 ·
   생일 · 할 일. 그래서 「목요일 2시 지점 회의」 같은 <b>내 일정</b>은 적을
   데가 없어, 결국 폰 달력을 따로 켜야 했습니다. 두 군데를 보면 한 군데는
   반드시 안 보게 됩니다.

   여기서 못 박는 것은 여섯입니다.

     ① 날짜를 고르면 <b>그 자리에서</b> 적는다 — 다른 화면으로 안 보낸다
     ② 넣으면 <b>달력에 바로</b> 찍히고, <b>잘못 넣은 것은 지울 수 있다</b>
     ③ 달력은 <b>한 벌</b>이라 홈에서 넣은 것이 내 캘린더에도 있다 (5번)
     ④ <b>서버를 안 부른다</b> (7번) — 글자를 넣어도 바깥으로 나가지 않는다
     ⑤ <b>이 브라우저에만 담긴다고 화면에 적는다</b> (1번) — 다른 기기에서
        안 보이는데 보인다고 하면 거짓말이다
     ⑥ <b>빈 줄·엉뚱한 시각을 안 받는다</b> — 받으면 달력에 빈 칸이 남는다

   견본은 <b>홍길동</b> 계열입니다 (3번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8843;
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
               '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const STUB = `
window.supabase={createClient:function(){
 var mk=function(){var a={select:function(){return a},eq:function(){return a},order:function(){return a},
  limit:function(){return a},single:function(){return a},in:function(){return a},gte:function(){return a},
  lte:function(){return a},is:function(){return a},neq:function(){return a},not:function(){return a},
  range:function(){return a},insert:function(){return a},update:function(){return a},upsert:function(){return a},
  then:function(r){return Promise.resolve({data:[],error:null}).then(r)}};a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({})},getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'u1',email:'u1@example.com'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'u1'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;
function serve() {
  return http.createServer((rq, rs) => {
    const f = path.join(ROOT, decodeURIComponent(rq.url.split('?')[0].split('#')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
    rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(rs);
  }).listen(PORT);
}
const SEL = '#osLoginGate,#osGuide,[id$="Ovl"],[id$="Pop"]';
const clearOvl = pg => pg.evaluate(sel => {
  const wipe = () => document.querySelectorAll(sel).forEach(x => x.remove());
  wipe();
  if (!window.__ovlWatch) {
    window.__ovlWatch = new MutationObserver(wipe);
    window.__ovlWatch.observe(document.body, { childList: true, subtree: false });
  }
}, SEL);

(async () => {
  const srv = serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1280, height: 1100 } });
  /* 페이지가 처음 뜰 때 받는 글꼴·라이브러리까지 세면 <b>엉뚱한 것을</b>
     잡습니다. 재려는 것은 「일정을 넣고 지우는 동안 서버를 부르는가」 뿐이라,
     화면이 다 선 뒤부터 셉니다 (8번 — 헛것을 잡는 점검은 안 잡느니만 못하다). */
  let out = 0, watch = false;
  const outUrls = [];
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
    if (watch) { out++; outUrls.push(u.slice(0, 60)); }
    return r.abort();
  });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.addInitScript(STUB);
  await pg.addInitScript(() => { try { localStorage.setItem('apex_guide_seen_v2', '1'); } catch (e) {} });
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#mycal', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof mcalMyAdd === 'function' && typeof mcalItems === 'function' &&
                                 typeof go === 'function', { timeout: 60000 });
  await clearOvl(pg);
  await pg.evaluate(() => { OS.profile = { id: 'u1', name: '윤시현', role: 'owner' }; go('mycal'); });
  await pg.waitForTimeout(700);
  await clearOvl(pg);
  watch = true;                 /* 여기서부터 센다 — 화면은 이미 다 섰다 */

  /* ─────────────────────────────────────────────────────────── */
  head('[1] 넣는 자리가 <b>한 곳</b>이다 (5번)');
  ['mcalMyAll', 'mcalMyAdd', 'mcalMyDel', 'mcalMyPut', 'mcalMyFormHtml', 'mcalMySave'].forEach(f => {
    const c = (SRC.match(new RegExp('function\\s+' + f + '\\s*\\(', 'g')) || []).length;
    is(c === 1, f + '() 가 ' + c + '곳에 있다');
  });
  is(/my:\{e:'✏️'/.test(SRC.replace(/\s/g, '')) || /my:\s*\{\s*e:\s*'✏️'/.test(SRC),
     '갈래 표(MCAL_KIND)에 <b>내 일정</b>이 한 줄로 들어가 있다 — 삼항 사슬이 아니다');

  /* ─────────────────────────────────────────────────────────── */
  head('[2] 날짜를 고르면 <b>그 자리에서</b> 적는다');
  const form = await pg.evaluate(() => {
    const d = document.querySelector('.mcal-add');
    return { there: !!d, t: !!document.getElementById('mcalMyT'),
             h: !!document.getElementById('mcalMyH'),
             w: d ? Math.round(d.getBoundingClientRect().width) : 0,
             txt: d ? d.textContent.replace(/\s+/g, ' ') : '' };
  });
  is(form.there && form.t && form.w > 100, '고른 날 아래에 <b>적는 칸</b>이 서 있다 — 폭 ' + form.w + 'px');
  is(form.h, '시각 칸이 <b>따로</b> 있다 — 안 적어도 되는 것이라 제목과 나눈다');
  is(/이 브라우저에만/.test(form.txt),
     '<b>이 브라우저에만 담긴다고 적는다</b> (1번) — 다른 기기에서 안 보이는데 보인다고 하면 거짓말이다');
  is(/폰 달력/.test(form.txt), '폰 달력으로는 나간다고 <b>같이</b> 알려 준다');

  /* ─────────────────────────────────────────────────────────── */
  head('[3] 넣으면 <b>달력에 바로</b> 찍힌다');
  const put = await pg.evaluate(() => {
    const t = mcalToday();
    MCAL.sel = t;
    mcalPaint();
    document.getElementById('mcalMyT').value = '지점 회의 — 홍길동 건';
    document.getElementById('mcalMyH').value = '14:00';
    mcalMyPut();
    const items = (mcalItems()[t] || []).filter(x => x.k === 'my');
    const row = document.querySelector('.mcal-it.my');
    return { n: items.length, t: items[0] ? items[0].t : '', s: items[0] ? items[0].s : '',
             shown: !!row, txt: row ? row.textContent.replace(/\s+/g, ' ') : '',
             x: !!(row && row.querySelector('.mcal-x')),
             box: (document.getElementById('mcalMyT') || {}).value };
  });
  is(put.n === 1 && /지점 회의/.test(put.t), '넣은 일정이 <b>그날에 담긴다</b> — 「' + put.t + '」');
  is(put.s === '14:00', '적은 <b>시각이 그대로</b> 간다 — ' + put.s);
  is(put.shown && /지점 회의/.test(put.txt), '<b>그 자리에서 바로 보인다</b> — 다시 그릴 때까지 안 기다린다');
  is(put.x, '<b>지우는 단추</b>가 붙는다 — 잘못 적은 줄이 영영 남으면 안 된다');

  /* ─────────────────────────────────────────────────────────── */
  head('[4] 달력은 <b>한 벌</b>이다 (5번)');
  const cross = await pg.evaluate(() => {
    go('home');
    return new Promise(r => setTimeout(() => {
      const t = mcalToday();
      const inHome = (mcalItems()[t] || []).filter(x => x.k === 'my').length;
      r({ inHome, host: !!document.getElementById('hmCalHost') });
    }, 900));
  });
  is(cross.host && cross.inHome === 1, '내 캘린더에서 넣은 것이 <b>홈 달력에도</b> 있다 — ' + cross.inHome + '건');

  /* ─────────────────────────────────────────────────────────── */
  head('[5] <b>빈 줄·엉뚱한 시각을 안 받는다</b>');
  const guard = await pg.evaluate(() => {
    const said = [];
    const rt = window.toast; window.toast = m => said.push(String(m));
    const t = mcalToday();
    const a = mcalMyAdd(t, '', '   ');            /* 빈 제목 */
    const b = mcalMyAdd(t, '25시', '회의');        /* 엉뚱한 시각 */
    const c = mcalMyAdd('', '', '회의');           /* 날짜 없음 */
    const d = mcalMyAdd(t, '', '시각 없이도 됩니다');
    window.toast = rt;
    return { a, b, c, d, said, n: (mcalItems()[t] || []).filter(x => x.k === 'my').length };
  });
  is(!guard.a && /한 줄만/.test(guard.said.join(' ')), '<b>빈 줄은 안 받는다</b> — 무엇을 하는지 적어 달라고 말한다');
  is(!guard.b && /14:00/.test(guard.said.join(' ')), '<b>엉뚱한 시각은 안 받는다</b> — 어떻게 적는지 보여 준다');
  is(!guard.c, '<b>날짜 없이는 안 받는다</b>');
  is(guard.d === true && guard.n === 2, '시각은 <b>안 적어도 들어간다</b> — ' + guard.n + '건');

  /* ─────────────────────────────────────────────────────────── */
  head('[6] 지우면 <b>사라진다</b>');
  const del = await pg.evaluate(() => {
    const t = mcalToday();
    const first = (mcalItems()[t] || []).filter(x => x.k === 'my')[0];
    mcalMyDel(first.my);
    return (mcalItems()[t] || []).filter(x => x.k === 'my').length;
  });
  is(del === 1, '지운 줄이 <b>달력에서 빠진다</b> — ' + del + '건 남음');

  /* ─────────────────────────────────────────────────────────── */
  head('[7] 폰 달력으로도 <b>같이 나간다</b>');
  const ics = await pg.evaluate(() => {
    const evs = mcalTodayEvents();
    return { any: evs.some(e => /시각 없이도 됩니다/.test(e.title || '')),
             ics: /시각 없이도 됩니다/.test(icsBuild('x', evs)) };
  });
  is(ics.any && ics.ics, '직접 넣은 일정이 <b>폰 달력 글에 실린다</b>');

  /* ─────────────────────────────────────────────────────────── */
  head('[8] <b>서버를 안 부른다</b> (7번)');
  is(out === 0, '일정을 넣고 지우는 동안 바깥으로 나간 요청 ' + out + '건' +
     (out ? ' — ' + outUrls.slice(0, 3).join(' / ') : ''));

  head('[9] 이 길을 도는 동안 <b>터진 곳이 없다</b>');
  const real = errs.filter(x => !/favicon|net::ERR|Failed to load resource|ERR_FAILED/i.test(x));
  is(real.length === 0, '콘솔 에러 0건' + (real.length ? ' — ' + real.slice(0, 3).join(' / ') : ''));

  await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ 내 일정 — ' + bad + '/' + n + ' 자리가 막혔습니다'
                          : '✓ 내 일정 — ' + n + '자리 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
