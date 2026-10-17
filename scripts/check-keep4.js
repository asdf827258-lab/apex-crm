#!/usr/bin/env node
/* ═════════════════════════════════════════════════════════════════
   check-keep4.js — 📆 <b>4년 유지관리</b>가 서나 (판 X123 · 2026-10-17)

   사장님 말씀 — 「4년 분급제 관리 새로 만들고 매월 터치하고 몇개월에
   한번은 전화로 무엇을 확인하고 전달할지까지 만들어줘」.

   ⚠ 처음에는 <b>새 판</b>(배정 DB 기반 k4* · 공용 파일 apex-keep4.js)을 지었습니다.
     짓고 나서야 본체에 <b>이미</b> 계약 마디(MST_STEPS · 1·3·6·9·12개월)가 있는
     것을 찾았습니다 — 셋째 표가 될 뻔했습니다. 「석 달째에 무슨 말을
     보내나」 에 표 셋이 다른 답을 합니다 (5번). 그래서 <b>거두고</b>, 있는 표를
     48개월로 늘리고, 이 화면은 그 판을 <b>그대로 세우는 창</b>으로 했습니다.
     이 자는 그 결정이 되돌아가지 않게 봅니다.

   재는 것
     [1] 표가 <b>하나</b>인가 — MST_STEPS 가 한 번만 서고, 4년 화면이 자기 줄을
         따로 세지 않고 mstCardHtml 을 부르나. 거둔 쌍둥이가 안 돌아왔나.
     [2] 화면이 서나 — 메뉴에서 열리고, 「왜 4년인가」 와 <b>회사 규정을 보라</b>는
         말이 있고, 환수 숫자를 적지 않나 (2번).
     [3] ★★ 전화하는 달에 <b>확인할 것 · 전달할 것</b>이 줄에 실제로 서나 ·
         문자 달은 「문자 한 통」 으로 서나 · 지난 전화를 안 챙겼으면 한 줄로 알리나.
     [4] ★ 4년 화면에서 「통화 · 보냈습니다」 를 누르면 <b>고객 365일과 같은
         자리</b>(mstIsDone)에 적히나 — 두 화면이 같은 답을 하나.
     [5] 48개월 차례표가 48줄인가 · 폰(390px)에서 옆으로 안 밀리나.

   견본 이름은 「홍길동」 계열입니다 (3번).
   ═════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8847;
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

/* 쪽지(/* … *\/)는 빼고 잽니다 — 쪽지에 적힌 옛 이름을 살아 있는 코드로 세지 않습니다 */
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '');

head('[1] 표가 <b>하나</b>인가 — 4년 화면이 자기 줄을 따로 세지 않나 (5번)');
{
  is((CODE.match(/var MST_STEPS\s*=/g) || []).length === 1, '마디 표(MST_STEPS)는 <b>한 번만</b> 선다');
  const k = /function renderKeep4\(\)\{([\s\S]*?)\n\}/.exec(CODE), kp = /function kp4CardInner\(\)\{([\s\S]*?)\n\}/.exec(CODE);
  is(!!k && !!kp, '4년 화면(renderKeep4 · kp4CardInner)이 있다');
  is(!!kp && /mstCardHtml\(\)/.test(kp[1]), '  ★ 4년 화면의 판은 <b>mstCardHtml 을 부른다</b> — 고객 365일과 같은 판');
  is(!!k && !/mstOf\(|mstAdd\(|\.cd\b|MST_FIXED|MST_TOUCH/.test((k ? k[1] : '') + (kp ? kp[1] : '')),
     '  ★ 4년 화면이 <b>제 손으로 날짜·마디를 세지 않는다</b> (mstOf·mstAdd·계약일을 안 만진다)');
  is(!/function k4[A-Z]|\bK4\s*=\s*\{|apex-keep4\.js/.test(CODE) && !fs.existsSync(path.join(ROOT, 'apex-keep4.js')),
     '  ★★ 거둔 쌍둥이(k4* · apex-keep4.js)가 <b>돌아오지 않았다</b>');
  is(/\{id:'keep4'[^}]*title:'4년 유지관리'/.test(SRC), '메뉴(TABS)에 「4년 유지관리」 가 있다');
  is(/function cli365TopPaint\(\)\{[\s\S]{0,400}kp4Paint\(\)/.test(SRC),
     '  다시 칠하는 곳은 <b>cli365TopPaint 하나</b>를 지난다 — 계약일이 늦게 와도, 눌러도');
}

(async () => {
  const srv = serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1440, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  /* 바깥 주소는 이 자가 <b>일부러 막습니다</b>(기사 불러오기 등) — 그 실패는 앱 탓이 아닙니다 (8번) */
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await pg.addInitScript(STUB);
  await pg.addInitScript(() => { try { localStorage.setItem('apex_guide_seen_v2', '1'); } catch (e) {} });
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#clients', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof mstCardHtml === 'function' && typeof renderKeep4 === 'function' &&
                                 typeof cmBlank === 'function' && typeof go === 'function', { timeout: 60000 });
  await clearOvl(pg);

  /* 견본 — 계약 13개월째(문자 달 · 12개월 전화를 안 챙김) 한 분, 3개월째(전화 달) 한 분.
     날짜는 <b>앱이 세는 그 셈</b>(mstAdd)으로 거꾸로 짚습니다 — 자가 따로 날짜를
     세면 밤 0시~9시에 하루가 어긋납니다(check-clockfree). */
  await pg.evaluate(() => {
    try { localStorage.removeItem('apex_mst_done'); } catch (e) {}
    const T = mstToday();
    const back = m => { const p = T.split('-'); return mstAdd((+p[0] - 5) + '-' + p[1] + '-' + p[2], 60 - m); };
    OS.profile = OS.profile || { id: 'u1', name: '홍길동', role: 'fp' };
    OSC.list = [
      { id: 'c1', name_masked: '홍○동', advisor_id: 'u1' },
      { id: 'c2', name_masked: '임○정', advisor_id: 'u1' }
    ];
    OSC.loaded = true; OSC.busy = false; OSC.err = '';
    CM.meta = { c1: Object.assign(cmBlank(), { cd: back(13) }), c2: Object.assign(cmBlank(), { cd: back(3) }) };
    CM.loaded = true;
    window.__cd = { c1: CM.meta.c1.cd, c2: CM.meta.c2.cd };
  });
  await pg.evaluate(() => go('keep4'));
  await pg.waitForTimeout(400);

  head('[2] 화면이 서나 — 「왜 4년인가」 · 회사 규정을 보라고 하나 (2번)');
  const pane = await pg.evaluate(() => {
    const d = document.querySelector('.tab-pane.on') || document.body;
    return { t: d.innerText || '', card: !!document.querySelector('#kp4Card #mstCard') };
  });
  is(/4년 유지관리/.test(pane.t), '메뉴에서 열린다 — 「📆 4년 유지관리」');
  is(/왜 4년인가/.test(pane.t) && /회사 수수료 규정/.test(pane.t), '「왜 4년인가」 와 <b>회사 수수료 규정을 확인하라</b>는 말이 있다');
  is(!/\d+\s*%|\d+\s*회차에/.test(pane.t.split('계약 마디 접점')[0]),
     '  ★ 환수 기준을 <b>숫자로 적지 않는다</b> — 회사·상품마다 다르고 바뀝니다');
  is(pane.card, '  ★ 그 안에 고객 365일과 <b>같은 판</b>(#mstCard)이 선다');
  is(/4년 · 48개월/.test(pane.t), '판 머리에 <b>4년 · 48개월</b> 이라고 적는다');

  head('[3] ★★ 전화하는 달에 <b>확인할 것 · 전달할 것</b>이 서나');
  const rows = await pg.evaluate(() => [].slice.call(document.querySelectorAll('#kp4Card .mst-row:not([data-ans])'))
    .map(r => ({ t: r.innerText || '', btn: [].slice.call(r.querySelectorAll('.mst-b')).map(b => b.textContent) })));
  const r2 = rows.filter(r => /임○정/.test(r.t))[0] || { t: '', btn: [] };
  const r1 = rows.filter(r => /홍○동/.test(r.t))[0] || { t: '', btn: [] };
  is(/3개월/.test(r2.t) && /📞 전화하는 달/.test(r2.t), '3개월째 분은 <b>📞 전화하는 달</b>로 선다');
  is(/확인할 것/.test(r2.t) && /전달할 것/.test(r2.t), '  ★★ 그 줄에 <b>☑ 확인할 것 · 📣 전달할 것</b>이 둘 다 있다');
  is(r2.btn.some(b => /통화 · 보냈습니다/.test(b)), '  전화 달의 단추는 「✅ 통화 · 보냈습니다」');
  is(/13개월/.test(r1.t) && /💬 문자 한 통/.test(r1.t) && !/확인할 것/.test(r1.t),
     '13개월째 분은 <b>💬 문자 한 통</b>으로 서고, 확인 목록을 지어 붙이지 않는다');
  is(/지난 전화\(12개월/.test(r1.t), '  ★ 12개월 전화를 안 챙겼으면 <b>그 줄 안에 한 줄로</b> 알린다 — 줄을 더 세우지 않는다');
  is(rows.length === 2, '  계약 하나에 <b>지금 마디 하나</b>만 선다 — ' + rows.length + '줄 (밀린 달을 쏟지 않는다)');
  is(!/홍길동|임꺽정/.test(rows.map(r => r.t).join('')), '  이름은 가린 모양(홍○동)으로만 선다 (3번)');

  head('[4] ★ 4년 화면에서 누른 것이 <b>고객 365일과 같은 자리</b>에 적히나');
  await pg.evaluate(() => {
    const b = [].slice.call(document.querySelectorAll('#kp4Card .mst-row:not([data-ans])'))
      .filter(r => /임○정/.test(r.innerText))[0];
    const x = b && [].slice.call(b.querySelectorAll('.mst-b')).filter(y => /통화 · 보냈습니다/.test(y.textContent))[0];
    if (x) x.click();
  });
  await pg.waitForTimeout(300);
  const after = await pg.evaluate(() => ({
    done: mstIsDone('c2', 3),
    t: (document.getElementById('kp4Card') || {}).innerText || '',
    same: (function () { const L = mstDueList(); return L.due.map(x => x.c.id + ':' + x.hit.step.m).join(','); })()
  }));
  is(after.done, '「통화 · 보냈습니다」 가 <b>mstIsDone</b> 에 적힌다 — 고객 365일이 읽는 그 자리');
  is(!/임○정[\s\S]{0,80}3개월[\s\S]{0,40}전화하는 달/.test(after.t.split('보냈습니다 — 답을')[0]),
     '  누른 마디는 <b>4년 화면에서도 바로 내려간다</b> — 다시 칠하는 곳이 하나라서');
  is(after.same.indexOf('c2:3') < 0, '  ★ 세는 자(mstDueList)도 같은 답을 한다 — ' + (after.same || '(없음)'));
  /* ★★ 2026-10-17 · 처음 짰을 때 실제로 그랬습니다 — 3개월째를 챙기자 <b>그 앞
     2개월째 문자가 다시 올라왔습니다</b>(c2:2). 마디가 달마다 서면서 생긴 일입니다.
     뒤 달을 챙겼으면 앞 달은 <b>지나간 것</b>입니다 — 다시 세우면 같은 분께
     하루에 두 번 연락하게 됩니다. */
  is(!/c2:/.test(after.same), '  ★★ 뒤 달을 챙기면 <b>앞 달이 다시 올라오지 않는다</b> — 같은 분께 두 번 연락하지 않게');

  head('[5] 48개월 차례표 · 폰');
  await pg.evaluate(() => kp4PlanToggle());
  await pg.waitForTimeout(150);
  const plan = await pg.evaluate(() => document.querySelectorAll('#kp4Plan .mst-row').length);
  is(plan === 48, '「48개월 차례 전체 보기」 를 펴면 <b>48줄</b>이 선다 — ' + plan + '줄');
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.evaluate(() => go('keep4'));
  await pg.waitForTimeout(400);
  const wide = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  is(wide <= 2, '폰(390px)에서 <b>옆으로 안 밀린다</b> — 넘친 폭 ' + wide + 'px');

  head('[6] 그리는 동안 <b>터진 곳이 없다</b>');
  is(errs.length === 0, '콘솔 에러 ' + errs.length + '건' + (errs.length ? ' — ' + errs[0].slice(0, 120) : ''));

  await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ 4년 유지관리 — ' + bad + '/' + n + ' 자리가 막혔습니다'
                          : '✓ 4년 유지관리 — ' + n + '자리 통과 · 표 하나 · 같은 판 · 전화 달엔 확인·전달'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('점검 중 오류:', e.message); process.exit(1); });
