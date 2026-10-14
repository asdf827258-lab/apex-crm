#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   캐러셀을 저장하면 쓸 수 있는 것이 나오나

   사장님 말씀 (2026-10-13): 「캐러셀 실제로 만들어봐」 → 뽑아 보니 넷이
   걸렸고, 「1번 먼저 해줘」 로 그 넷을 고쳤습니다.

   ★★ <b>실제로 뽑아 보기 전에는 몰랐던 것들</b>입니다. 화면으로는 멀쩡했습니다.

     ① 다섯 장이 <b>같은 이름으로 덮였습니다</b>. 처음엔 「<a> 를 문서에 안
        붙여서」 라고 짚었는데 <b>틀렸습니다</b> — 빈 쪽에서 따로 재어 보니
        한글 파일 이름이 까닭이었습니다(「붙임.png」·「안붙임.png」·
        「데이터URL.png」 셋 다 「download」 로 떨어지고 ascii.png 만 살았습니다).
        이름을 <b>ASCII</b> 로 둡니다.
     ② 사진을 안 넣으면 <b>카드의 2/3가 빈 파란 칸</b>으로 저장됩니다.
        화면에는 「✨ AI 사진 생성 또는 🖼 업로드」 라고 떠 있는데 저장본에는
        그 글이 없습니다. <b>막지 않고 말씀만</b> 드립니다 (6번).
     ③ 「<b>5장</b>을 저장합니다」 가 글자로 박혀 있었습니다 — AI 로 8~10장을
        만들면 그 말이 거짓이 됩니다 (5번).
     ④ 자료 출처가 <b>카드 어디에도 없었습니다</b>. 문구 복사에만 있었습니다.
        보험 글은 고객이 그대로 믿는 글이라 카드에 있어야 합니다 (9번).

   여기서 못 박는 것은 그 넷이고, <b>진짜로 눌러 받아 봅니다</b>.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const ROOT = process.cwd(), PORT = 8875;
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
    if (rq.url.indexOf('/api/') === 0) { rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{"ok":true,"news":[]}'); return; }
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
  if (!window.__ovlWatch) { window.__ovlWatch = new MutationObserver(wipe); window.__ovlWatch.observe(document.body, { childList: true, subtree: false }); }
}, SEL);
const SEED = () => {
  window.bizNewsCanEdit = function () { return true; };
  window.__toast = []; window.toast = function (m) { window.__toast.push(String(m)); };
};

(async () => {
  const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'caro-'));
  const srv = serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1280, height: 1100 }, acceptDownloads: true });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  const 받음 = [];
  pg.on('download', async d => {
    const nm = d.suggestedFilename();
    받음.push(nm);
    try { await d.saveAs(path.join(OUT, nm)); } catch (e) { errs.push('내려받기 ' + e.message); }
  });
  await pg.addInitScript(STUB);
  await pg.addInitScript(() => { try { localStorage.setItem('apex_guide_seen_v2', '1'); } catch (e) {} });
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof go === 'function' && typeof cardnewsSaveAll === 'function' &&
                                 typeof cnFileName === 'function' && typeof cnSrcOf === 'function' &&
                                 typeof cnNoImg === 'function', { timeout: 60000 });
  await clearOvl(pg);
  await pg.evaluate(SEED);
  await pg.evaluate(() => go('biz_news'));
  await pg.waitForSelector('#cnHost', { timeout: 30000 });
  await pg.waitForTimeout(900);

  /* ─────────────────────────────────────────────────────────── */
  head('[1] 파일 이름이 <b>ASCII</b> 이고 한 곳에서 온다 (5번)');
  ['cnFileName', 'cnSrcOf', 'cnNoImg', 'cnPutA'].forEach(f => {
    const c = (SRC.match(new RegExp('function\\s+' + f + '\\s*\\(', 'g')) || []).length;
    is(c === 1, '  ' + f + '() 가 ' + c + '곳에 있다');
  });
  const 이름 = await pg.evaluate(() => [cnFileName(0), cnFileName(1), cnFileName(9)]);
  is(이름.every(x => /^[\x20-\x7E]+$/.test(x)),
     '  이름에 <b>한글이 없다</b> — ' + 이름[0] + ' · ' + 이름[1]);
  is(new Set(이름).size === 3, '  장마다 <b>이름이 다르다</b>');
  is(/[-_]1$/.test(이름[0]) && /[-_]2$/.test(이름[1]), '  <b>번호가 1부터</b> 붙는다');
  is(!/cnDownload\([^)]*'카드뉴스/.test(SRC), '  한글 이름을 넘기던 자리가 <b>남아 있지 않다</b>');
  is(/document\.body\.appendChild\(a\)/.test(SRC.slice(SRC.indexOf('function cnPutA('), SRC.indexOf('function cnPutA(') + 420)),
     '  <a> 를 <b>문서에 붙여</b> 누른다 — 폰에서 안 붙은 것을 무시하기도 한다');

  /* ─────────────────────────────────────────────────────────── */
  head('[2] <b>진짜로 눌러</b> 받아 본다');
  const 장수 = await pg.evaluate(() => cardnewsSlides().length);
  await pg.evaluate(() => cardnewsSaveAll());
  await pg.waitForTimeout(1500 + 장수 * 700);
  is(받음.length === 장수, '  ' + 장수 + '장을 다 받았다 — ' + 받음.length + '개');
  is(new Set(받음).size === 받음.length,
     '  <b>서로 다른 이름</b>으로 받았다 — 덮어쓰지 않는다 (' + new Set(받음).size + '가지)');
  is(받음.every(x => /^[\x20-\x7E]+\.png$/.test(x)),
     '  브라우저가 준 이름이 <b>그대로 살아 있다</b> — ' + (받음[0] || '(없음)'));
  const 큰것 = fs.readdirSync(OUT).map(f => fs.statSync(path.join(OUT, f)).size);
  is(큰것.length === 장수 && 큰것.every(x => x > 50000),
     '  파일이 <b>비어 있지 않다</b> — 가장 작은 것 ' + Math.round(Math.min.apply(null, 큰것) / 1024) + 'KB');

  /* ─────────────────────────────────────────────────────────── */
  head('[3] 장수를 <b>글자로 박지 않는다</b> (5번)');
  const all = SRC.slice(SRC.indexOf('function cardnewsSaveAll('), SRC.indexOf('function cardnewsSaveAll(') + 900);
  is(/slides\.length/.test(all), '  수는 <b>slides.length</b> 에서 온다');
  is(!/'[0-9]+장을 저장/.test(all), '  「N장을 저장합니다」 를 <b>박아 두지 않았다</b>');
  const 말 = (await pg.evaluate(() => window.__toast || [])).join(' | ');
  is(말.indexOf(장수 + '장을 저장') >= 0, '  실제로 <b>' + 장수 + '장</b>이라고 말한다');

  /* ─────────────────────────────────────────────────────────── */
  head('[4] 사진이 빈 장을 <b>말해 주되 막지 않는다</b> (6번)');
  const 빈 = await pg.evaluate(() => cnNoImg(cardnewsSlides()));
  is(빈 === 장수, '  지금은 사진이 하나도 없다 — ' + 빈 + '장');
  is(/사진이 빈 칸/.test(말), '  <b>빈 칸이라고 말해 준다</b>');
  is(/사진 생성|업로드/.test(말), '  <b>채우는 길</b>을 알려 준다');
  is(받음.length === 장수, '  그래도 <b>저장은 된다</b> — 막지 않는다');
  is(말.indexOf('<') < 0, '  말에 <b>꺾쇠가 없다</b> — toast 는 글자 그대로 찍는다');

  /* ─────────────────────────────────────────────────────────── */
  head('[5] <b>출처가 카드에 찍힌다</b> (9번)');
  const 출처 = await pg.evaluate(() => cnSrcOf());
  is(!!출처, '  이 캐러셀의 출처를 앱이 안다 — 「' + 출처 + '」');
  const draw = SRC.slice(SRC.indexOf('function cnDrawSlide('), SRC.indexOf('function cnDrawSlide(') + 9000);
  is(/cnSrcOf\(\)/.test(draw), '  <b>저장 그림</b>이 그것을 찍는다');
  is(/cnSrcOf\(\)/.test(SRC.slice(SRC.indexOf("if(lay==='cta'){\n    return '<div class=\"cnw\">"), SRC.indexOf("if(lay==='cta'){\n    return '<div class=\"cnw\">") + 1200)) ||
     (SRC.match(/cnSrcOf\(\)/g) || []).length >= 3,
     '  <b>화면 미리보기</b>도 그것을 찍는다 — 두 곳이 같은 데 묻는다 (5번)');
  const 찍힘 = await pg.evaluate(() => {
    const s = cardnewsSlides(); const i = s.length - 1;
    const c = cnDrawSlide(s[i], i, s.length);
    /* 캔버스 아래쪽 띠를 글자가 있는지로만 본다 — 글은 못 읽으니 픽셀로 */
    const x = c.getContext('2d');
    const d = x.getImageData(70, 1130, 500, 40).data;
    let 칠해진 = 0;
    for (let k = 0; k < d.length; k += 4) if (d[k] < 200 || d[k + 1] < 200 || d[k + 2] < 200) 칠해진++;
    return 칠해진;
  });
  is(찍힘 > 50, '  그 자리에 <b>실제로 글자가 찍혔다</b> — 칠해진 점 ' + 찍힘 + '개');
  /* 출처가 없으면 빈손 — 지어내지 않는다 (1번) */
  const 빈손 = await pg.evaluate(() => {
    const 본래 = window.cardnewsPick;
    window.cardnewsPick = function () { const o = 본래(); o.src = ''; return o; };
    const r = cnSrcOf(); window.cardnewsPick = 본래; return r;
  });
  is(빈손 === '', '  출처가 없으면 <b>빈손</b>이다 — 지어내지 않는다 (1번)');

  /* ─────────────────────────────────────────────────────────── */
  head('[6] 조용한가');
  const 시끄 = errs.filter(e => !/favicon|net::ERR|Failed to fetch|abort/i.test(e));
  is(시끄.length === 0, '콘솔 에러 ' + 시끄.length + '건' + (시끄.length ? ' ← ' + 시끄[0] : ''));

  try { fs.readdirSync(OUT).forEach(f => fs.unlinkSync(path.join(OUT, f))); fs.rmdirSync(OUT); } catch (e) {}
  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '자리 — 위를 보십시오 (' + n + '가지 중)'); process.exit(1); }
  console.log('✓ 캐러셀 저장 — 이름이 살고, 빈 칸을 말해 주고, 출처가 찍힙니다 (' + n + '자리).');
})();
