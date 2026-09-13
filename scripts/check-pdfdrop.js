#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   증권 PDF 를 <b>끌어다 놓을</b> 수 있는가

   설계사는 증권 PDF 를 폴더에서 꺼내 놓습니다. 「파일 고르기」 를 눌러
   창을 띄우고 폴더를 다시 찾아 들어가는 것보다 <b>끌어다 놓는 편</b>이
   언제나 빠릅니다. 그런데 받는 자리가 넷인데 <b>둘만</b> 됐습니다.

   여기서 못 박는 것은 넷입니다.

     ① <b>네 자리가 다</b> 끌어다 놓기를 받는다 — 미끼 도구 · 고객 365일
        문서 · AI 제안서 첨부 · 재무설계 KB
     ② 플러밍이 <b>한 곳</b>이다 (5번) — osDragOver · OS_DROP_TO 표 하나.
        자리마다 따로 적으면 한 곳을 고칠 때 나머지가 그대로 남는다
     ③ <b>기본 동작을 막는다</b> — 안 막으면 떨어뜨린 PDF 를 탭이 그냥
        열어서 <b>보시던 화면이 통째로 날아간다</b>. 제일 놀라는 자리다
     ④ 떨어뜨리면 <b>실제로 담긴다</b> — 브라우저를 띄워 진짜로 떨어뜨려 본다

   견본 파일은 <b>홍길동</b> 증권으로 둡니다 (3번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8842;
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

/* 진짜로 떨어뜨린다 — DataTransfer 를 만들어 drop 을 쏜다.
   기본 동작을 막았는지 보려고 <b>defaultPrevented</b> 를 같이 돌려받는다. */
const dropOn = (pg, sel, name) => pg.evaluate(([sel, name]) => {
  const el = document.querySelector(sel);
  if (!el) return { there: false };
  const dt = new DataTransfer();
  dt.items.add(new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], name, { type: 'application/pdf' }));
  const over = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt });
  el.dispatchEvent(over);
  const dragged = el.classList.contains('drag');
  const ev = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });
  el.dispatchEvent(ev);
  return { there: true, stopped: ev.defaultPrevented, overStopped: over.defaultPrevented,
           dragged: dragged, cleared: !el.classList.contains('drag') };
}, [sel, name]);

(async () => {
  const srv = serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1440, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.addInitScript(STUB);
  await pg.addInitScript(() => { try { localStorage.setItem('apex_guide_seen_v2', '1'); } catch (e) {} });
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof osDragOver === 'function' && typeof osDropTo === 'function' &&
                                 typeof go === 'function', { timeout: 60000 });
  await clearOvl(pg);

  /* ─────────────────────────────────────────────────────────── */
  head('[1] 플러밍이 <b>한 곳</b>이다 (5번)');
  ['osDragOver', 'osDropTo', 'osDropShim', 'osBindDrop', 'pdfDrag'].forEach(f => {
    const c = (SRC.match(new RegExp('function\\s+' + f + '\\s*\\(', 'g')) || []).length;
    is(c === 1, f + '() 가 ' + c + '곳에 있다');
  });
  is((SRC.match(/var OS_DROP_TO\s*=/g) || []).length === 1,
     '받는 자리 표가 <b>한 곳</b>에만 있다 — 삼항 사슬로 늘어놓지 않았다');
  const pdfd = SRC.slice(SRC.indexOf('function pdfDrag('), SRC.indexOf('function pdfDrag(') + 120);
  is(/osDragOver\(/.test(pdfd), '먼저 있던 pdfDrag 도 <b>같은 플러밍</b>을 쓴다 — 제 몸통을 안 갖는다');
  const bind = SRC.slice(SRC.indexOf('function osBindDrop('), SRC.indexOf('function osBindDrop(') + 700);
  is(/osDragOver\(/.test(bind) && /OS_DROP_TO\./.test(bind),
     '고객 365일 문서 드롭도 <b>같은 한 곳</b>을 거친다');
  /* 새로 적은 자리가 기본 동작을 막는 함수를 <b>반드시</b> 지나가는가 */
  const raw = (SRC.match(/ondrop="[^"]*"/g) || []);
  is(raw.length > 0 && raw.every(x => /osDropTo\(|pdfDrop\(/.test(x)),
     'HTML 에 적힌 ondrop ' + raw.length + '자리가 <b>모두</b> 한 곳을 거친다');

  /* ─────────────────────────────────────────────────────────── */
  head('[2] AI 제안서 첨부 — <b>끌어다 놓기</b>가 생겼다');
  await pg.evaluate(() => go('ai_prop'));
  await pg.waitForTimeout(600);
  await clearOvl(pg);
  let box = await pg.evaluate(() => {
    const d = document.querySelector('.dropzone[ondrop*="\'pr\'"]');
    return { there: !!d, txt: d ? d.textContent.replace(/\s+/g, ' ').trim() : '',
             w: d ? Math.round(d.getBoundingClientRect().width) : 0 };
  });
  is(box.there && box.w > 80, '첨부 자리가 <b>끌어다 놓는 칸</b>으로 서 있다 — 폭 ' + box.w + 'px');
  is(/끌어다 놓기/.test(box.txt), '<b>끌어다 놓아도 된다고 적혀 있다</b> — 안 적으면 아무도 안 해 본다');
  let d = await dropOn(pg, '.dropzone[ondrop*="\'pr\'"]', '홍길동_증권.pdf');
  is(d.there && d.dragged, '끌어오면 <b>칸이 반응한다</b> — 여기 놓으면 되는지 보인다');
  is(d.cleared, '놓고 나면 <b>표시가 사라진다</b>');
  is(d.stopped && d.overStopped,
     '<b>탭이 PDF 를 그냥 열지 않는다</b> — 안 막으면 보시던 화면이 통째로 날아간다');
  const got = await pg.evaluate(() => {
    let t = 0; Object.keys(PR.files || {}).forEach(k => { t += (PR.files[k] || []).length; });
    return t;
  });
  is(got === 1, '떨어뜨린 증권이 <b>실제로 담겼다</b> — ' + got + '건');

  /* ─────────────────────────────────────────────────────────── */
  head('[3] 재무설계 KB PDF — 같은 자리에서 받는다');
  const frOK = SRC.indexOf("ondrop=\"osDropTo(event,\\'frkb\\')\"") >= 0 ||
               /ondrop="osDropTo\(event,\\'frkb\\'\)"/.test(SRC);
  is(frOK, '재무설계 KB 칸도 <b>끌어다 놓기</b>를 받는다');
  is(/frkb:function|frkb:\s*function/.test(SRC.replace(/\s+/g, '')) ||
     /frkb:\s*function/.test(SRC),
     '받는 자리가 <b>표에 적혀 있다</b> — 새 자리를 늘려도 빠뜨릴 곳이 없다');

  /* ─────────────────────────────────────────────────────────── */
  head('[4] 먼저 있던 두 자리도 <b>그대로 된다</b>');
  await pg.evaluate(() => go('clients'));
  await pg.waitForTimeout(700);
  await clearOvl(pg);
  const cliZone = await pg.evaluate(() => !!document.getElementById('oscDrop') ||
    /oscDrop/.test(document.body.innerHTML));
  is(cliZone || /id="oscDrop"/.test(SRC), '고객 365일 문서 칸이 <b>그대로 있다</b>');
  is(/ondrop="pdfDrop\(/.test(SRC), '미끼 도구의 PDF 칸도 <b>그대로 있다</b>');

  head('[5] 이 길을 도는 동안 <b>터진 곳이 없다</b>');
  const real = errs.filter(x => !/favicon|net::ERR|Failed to load resource|ERR_FAILED/i.test(x));
  is(real.length === 0, '콘솔 에러 0건' + (real.length ? ' — ' + real.slice(0, 3).join(' / ') : ''));

  await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ 증권 끌어다 놓기 — ' + bad + '/' + n + ' 자리가 막혔습니다'
                          : '✓ 증권 끌어다 놓기 — ' + n + '자리 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
