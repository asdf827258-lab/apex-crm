#!/usr/bin/env node
/* ═════════════════════════════════════════════════════════════════
   check-maneasy.js — 🌱 사용가이드의 「처음이세요? — 윤프로 쉽게」 가 서나 (판 X134 · 2026-10-19)

   사장님 말씀 — 「윤프로 소개랑 사용설명서 최대한 쉽게」 · 「실제 영업 현장에서
   어떻게 쓰이는지 자세하게」 · 「메인세션에 적용해줘」.

   재는 것
     [1] 대본을 <b>베끼지 않았나</b> — 현장의 하루에 나오는 말이 apex-stage · MST_FIXED ·
         rjnMsg 에서 오고, 이 칸 코드에 그 글자가 박혀 있지 않나 (5번).
         단추가 <b>메뉴에 있는 화면</b>만 가리키나 · 일곱 걸음이 일곱인가.
     [2] 가이드 맨 위에 서나 · 세 칸이 눌리나 · 아래 탭바 이름이 TB 그대로인가.
     [3] ★★ 현장의 하루에 <b>지금 대본</b>이 그대로 서나 — 전화 다섯 마디 · 지금 바빠요 ·
         부재 · 4년 3개월째 · 거절 고객 소식. 대본을 바꾸면 가이드도 바뀌나.
     [4] ★★ 대본을 못 읽으면 <b>못 읽었다고</b> 적나 — 비슷한 말을 지어 넣지 않나 (1번).
     [5] 단추를 누르면 그 화면으로 가나 · 폰 390px · 콘솔 에러 0.
   ═════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8871;
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


const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '');
head('[1] 대본을 베끼지 않았나 · 단추가 진짜 화면인가 (5번)');
const blk = CODE.slice(CODE.indexOf('var MAN_EASY='), CODE.indexOf('function manEasyHtml'));
const STG = fs.readFileSync(path.join(ROOT, 'apex-stage.js'), 'utf8');
{
  is(blk.length > 2000, '「윤프로 쉽게」 칸 코드가 있다');
  const copied = ['바쁘실 때 받아 주셔서', '보험료 빠져나가는 날짜', 'APEX 윤시현입니다', '며칠 전에 연락드렸다가', '불쑥 연락드려'].filter(t => blk.indexOf(t) >= 0);
  is(copied.length === 0, '  ★★ 대본 글자가 이 칸에 <b>박혀 있지 않다</b> — 그 자리에서 꺼낸다' + (copied.length ? ' ← ' + copied.join(' · ') : ''));
  is(STG.indexOf('바쁘실 때 받아 주셔서') >= 0, '  (그 대본은 apex-stage.js 한 곳에 있다)');
  const ids = [...blk.matchAll(/\['([a-z_0-9]+)','[^']*','[^']*'\]/g)].map(m => m[1]);
  const tabIds = new Set([...SRC.matchAll(/\{id:'([a-z_0-9]+)'/g)].map(m => m[1]));
  const miss = [...new Set(ids)].filter(i => !tabIds.has(i));
  is(ids.length >= 10 && miss.length === 0, '  단추 ' + ids.length + '개가 <b>메뉴에 있는 화면</b>만 가리킨다' + (miss.length ? ' ← 없는 화면 ' + miss.join(',') : ''));
}

(async () => {
  const srv = serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1440, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await pg.addInitScript(STUB);
  await pg.addInitScript(() => { try { localStorage.setItem('apex_guide_seen_v2', '1'); } catch (e) {} });
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof manEasyHtml === 'function' && typeof APEX_STAGE !== 'undefined' && typeof go === 'function', { timeout: 60000 });
  await clearOvl(pg);
  await pg.evaluate(() => { go('manual'); });
  await pg.waitForTimeout(400);
  const t = () => pg.evaluate(() => { const e = document.getElementById('manEasy'); return e ? e.innerText : ''; });

  head('[2] 가이드 맨 위에 서나 · 세 칸 · 탭바 이름');
  const s2 = await pg.evaluate(() => {
    const b = document.getElementById('manBody'), e = document.getElementById('manEasy');
    return { has: !!e,
             /* ⚠ 판 X152 — 앞머리 이모지가 선 그림이 되어 글에서 빠졌습니다.
                약속(「처음이세요가 주제별 안내보다 먼저」)은 그대로입니다.
                ★★ 처음에 「📚 주제별 안내」 → 「주제별 안내」 로만 풀었다가
                  <b>헛 빨간불</b>을 켰습니다 — 그 낱말이 머리글보다 앞에
                  <b>풀이글 속</b>에 한 번 더 있어서, 글자 자리로 재면 차례가
                  뒤집혀 보입니다(주제별@144 · 처음@159). 이모지가 머리글을
                  <b>가려 주고</b> 있었던 것입니다.
                ★ 그래서 글자 자리가 아니라 <b>칸의 차례</b>로 잽니다 —
                  머리글은 「주제별 안내」 로 <b>시작하는</b> 칸이고,
                  그것이 #manEasy 보다 <b>뒤에</b> 와야 합니다 (8번). */
             before: (function(){
               if(!b || !e) return false;
               /* ★ <b>머리글만</b> 집습니다 — 같은 낱말이 바로 위 풀이글 속
                  (「… 그 아래 <b>주제별 안내</b>를 펼치십시오」)에도 있습니다.
                  머리글에는 앞머리 그림이 있었고, 그 자국이 <b>data-emo</b> 에
                  남아 있습니다 (판 X152). 그것으로 가립니다.             */
               var w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT), nd, hd = null;
               while((nd = w.nextNode())){
                 if(!/^\s*주제별 안내/.test(nd.nodeValue || '')) continue;
                 if(!nd.parentElement || !nd.parentElement.hasAttribute('data-emo')) continue;
                 hd = nd.parentElement; break;
               }
               if(!hd) return false;
               return !!(e.compareDocumentPosition(hd) & Node.DOCUMENT_POSITION_FOLLOWING);
             })(),
             tb: TB.map(x => x.t), txt: e ? e.innerText : '' };
  });
  is(s2.has && s2.before, '사용가이드에 「처음이세요? — 윤프로 쉽게」 가 <b>주제별 안내보다 먼저</b> 선다');
  is(/세 가지/.test(s2.txt) && /꼭 지키는 것/.test(s2.txt), '① 소개 — 세 가지 · 꼭 지키는 것');
  is(s2.tb.every(x => s2.txt.indexOf(x) >= 0), '  아래 탭바 이름이 <b>TB 그대로</b> — ' + s2.tb.join(' · '));
  await pg.evaluate(() => manEasyPick('steps')); await pg.waitForTimeout(150);
  const s3 = await t();
  is((s3.match(/[①②③④⑤⑥⑦]/g) || []).length >= 7 && /계약 뒤 매달/.test(s3), '② 일곱 걸음이 <b>일곱</b> 다 선다');
  is(/모름/.test(s3) && /심사 결과/.test(s3), '  보장분석 걸음에 「모름」 · 「심사 결과」 가 있다 (1·2번)');

  head('[3] ★★ 현장의 하루에 <b>지금 대본</b>이 그대로 서나');
  await pg.evaluate(() => manEasyPick('day')); await pg.waitForTimeout(150);
  const live = await pg.evaluate(() => {
    const strip = s => String(s || '').replace(/<[^>]+>/g, '');
    const busy = APEX_STAGE.obj.filter(o => o.key === 'busy')[0];
    const m3 = MST_FIXED.filter(x => x.m === 3)[0];
    return { frame: strip(APEX_STAGE.taFrame[1].s), busy: strip(busy.one), m3: (m3.say || '').split('\n')[0],
             abs: (APEX_STAGE.script('부재', '', '').say || '').split('\n')[0], rj: (rjnMsg('') || '').split('\n')[0],
             way: strip(TDO.AP.way) };
  });
  const d3 = await t();
  is(d3.indexOf(live.frame) >= 0, '10:00 — 전화 다섯 마디가 apex-stage 그대로 — ' + live.frame);
  is(d3.indexOf(live.busy) >= 0, '10:05 — 「지금 바빠요」 대답이 거절처리 표 그대로');
  is(/하지 않는 말/.test(d3), '  하지 말 말도 같이 선다');
  is(d3.indexOf(live.abs) >= 0, '11:30 — 부재 대본 그대로');
  is(d3.indexOf(live.way) >= 0, '14:00 — 만남의 목표가 단계표(TDO) 그대로');
  is(live.rj && d3.indexOf(live.rj) >= 0, '17:00 — 거절 고객 소식의 글 그대로');
  is(d3.indexOf(live.m3) >= 0, '18:00 — 4년 유지관리 3개월째 말 그대로');
  is(/시각은 예시/.test(d3), '  시각은 <b>예시</b>라고 밝힌다');
  const chg = await pg.evaluate(() => { const b = APEX_STAGE.obj.filter(o => o.key === 'busy')[0], keep = b.one;
    b.one = '홍길동 시험 대본'; manEasyPick('day'); const r = document.getElementById('manEasy').innerText; b.one = keep; manEasyPick('day'); return r; });
  is(chg.indexOf('홍길동 시험 대본') >= 0, '  ★ 대본을 바꾸면 <b>가이드도 바뀐다</b> — 베낀 글이 아니다');

  head('[4] ★★ 대본을 못 읽으면 지어내지 않는다 (1번)');
  const gone = await pg.evaluate(() => { const keep = window.APEX_STAGE; window.APEX_STAGE = undefined; let r = '';
    try { manEasyPick('day'); r = document.getElementById('manEasy').innerText; } catch (e) { r = 'ERR ' + e.message; }
    window.APEX_STAGE = keep; manEasyPick('day'); return r; });
  is(!/^ERR/.test(gone) && /아직 못 읽었습니다/.test(gone), '대본 표가 없으면 <b>못 읽었다</b>고 적는다 — 터지지 않는다');
  is(gone.indexOf(live.busy) < 0, '  그때 그 말이 <b>안 선다</b>');

  head('[5] 단추가 그 화면으로 가나 · 폰 390px · 에러');
  await pg.evaluate(() => manEasyPick('steps')); await pg.waitForTimeout(100);
  const went = await pg.evaluate(() => { const b = [...document.querySelectorAll('#manEasy button')].filter(x => /4년 유지관리/.test(x.textContent))[0];
    if (!b) return ''; b.click(); return (typeof currentTab === 'function') ? currentTab() : (location.hash || ''); });
  is(/keep4/.test(went), '「📆 4년 유지관리」 단추를 누르면 그 화면으로 간다 — ' + went);
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.evaluate(() => { go('manual'); manEasyPick('day'); }); await pg.waitForTimeout(300);
  const wide = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  is(wide <= 2, '폰(390px)에서 옆으로 안 밀린다 — 넘친 폭 ' + wide + 'px');
  const tiny = await pg.evaluate(() => { let n = 0; document.querySelectorAll('#manEasy *').forEach(e => { if (!e.offsetParent) return;
    const c = e.childNodes[0]; if (!(c && c.nodeType === 3 && c.nodeValue.trim())) return; if (parseFloat(getComputedStyle(e).fontSize) < 13) n++; }); return n; });
  is(tiny === 0, '  13px 아래 글자 0개 — ' + tiny);
  is(errs.length === 0, '콘솔 에러 ' + errs.length + '건' + (errs.length ? ' — ' + errs[0].slice(0, 120) : ''));
  await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ 윤프로 쉽게 — ' + bad + '/' + n + ' 자리가 막혔습니다' : '✓ 윤프로 쉽게 — ' + n + '자리 통과 · 대본은 그 자리에서 · 못 읽으면 못 읽었다고'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('점검 중 오류:', e.message); process.exit(1); });
