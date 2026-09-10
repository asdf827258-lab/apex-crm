#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   계약 마디 접점 — 1 · 3 · 6 · 9 · 12개월

   계약을 하고 나면 그 다음이 사람 머리에만 있었습니다. 증권만 전하고
   조용해지다가, 한참 뒤에 「해지할까 하는데요」 로 다시 만납니다.

   그래서 계약일에서 마디를 세우고 그 자리에서 보낼 말과 기사를 함께
   놓았습니다. 여기서 못 박는 것은 다섯입니다.

     ① 마디가 <b>날짜로 정확히</b> 선다 — 말일이 넘칠 때 달을 건너뛰지
        않는다 (1월 31일 + 1개월 = 2월 28일이지, 3월 3일이 아니다)
     ② <b>계약일이 없으면 안 세운다.</b> 대신 몇 분이 비었는지 적는다 —
        조용히 빠뜨리면 사장님은 챙긴 줄 아십니다 (1번)
     ③ 기사를 <b>지어내지 않는다.</b> 받아 둔 것이 없으면 없다고 적고,
        있으면 <b>제목·언론사·주소를 그대로</b> 옮긴다 (9번)
     ④ 세금 이야기에 <b>한도·나이·개월 수 같은 숫자를 적지 않는다.</b>
        「비과세입니다」 같은 결론도 내지 않는다 (2번)
     ⑤ 계약일이 <b>저장되고 다시 읽힌다</b> — 화면에만 있다 새로고침에
        사라지면 없는 것과 같다

   견본 이름은 「홍길동」 계열입니다 (3번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8836;
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
  const ctx = await br.newContext({ viewport: { width: 1440, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.addInitScript(STUB);
  await pg.addInitScript(() => { try { localStorage.setItem('apex_guide_seen_v2', '1'); } catch (e) {} });
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#clients', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof mstAdd === 'function' && typeof mstCardHtml === 'function' &&
                                 typeof cmOf === 'function', { timeout: 60000 });
  await clearOvl(pg);

  /* ─────────────────────────────────────────────────────────────
     [1] 날짜 셈이 <b>정확한가</b> — 순수한 셈이라 브라우저에서 바로 잰다  */
  head('[1] 마디가 <b>날짜로 정확히</b> 선다');
  const d = await pg.evaluate(() => ({
    m1:  mstAdd('2026-03-15', 1),
    m3:  mstAdd('2026-03-15', 3),
    m12: mstAdd('2026-03-15', 12),
    end: mstAdd('2026-01-31', 1),          /* 2월은 28일까지 — 3월 3일로 튀면 안 된다 */
    leap: mstAdd('2028-01-31', 1),         /* 윤년 2월은 29일 */
    yr:  mstAdd('2026-12-20', 3),          /* 해를 넘긴다 */
    junk: mstAdd('', 1),
    junk2: mstAdd('아무거나', 3),
    steps: MST_STEPS.map(s => s.m)
  }));
  is(d.m1 === '2026-04-15', '1개월 — 2026-03-15 → ' + d.m1);
  is(d.m3 === '2026-06-15', '3개월 — ' + d.m3);
  is(d.m12 === '2027-03-15', '12개월 — 해가 넘어간다 — ' + d.m12);
  is(d.end === '2026-02-28', '<b>말일이 넘치면 그달 말일로</b> 당긴다 — 1/31 +1개월 = ' + d.end +
     ' (3월로 튀면 그 달을 통째로 건너뜁니다)');
  is(d.leap === '2028-02-29', '윤년은 29일까지 — ' + d.leap);
  is(d.yr === '2027-03-20', '12월 + 3개월 = ' + d.yr);
  is(d.junk === '' && d.junk2 === '', '날짜가 아니면 <b>빈 값</b>을 준다 — 아무 날이나 만들지 않는다');
  is(JSON.stringify(d.steps) === JSON.stringify([1, 3, 6, 9, 12]),
     '마디는 <b>1 · 3 · 6 · 9 · 12개월</b> — ' + d.steps.join(' · '));

  /* ─────────────────────────────────────────────────────────────
     [2] 계약일이 없으면 <b>안 세운다</b> · 몇 분인지 적는다             */
  head('[2] 계약일이 없으면 <b>안 세우고, 몇 분인지 적는다</b>');
  await pg.evaluate(() => {
    const back = d => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
    window.__back = back;
    OSC.list = [
      { id: 'c1', name_masked: '홍○○', advisor_id: 'u1' },
      { id: 'c2', name_masked: '임○○', advisor_id: 'u1' },
      { id: 'c3', name_masked: '장○○', advisor_id: 'u1' }
    ];
    CM.meta = {};                          /* 아무도 계약일이 없다 */
    CM.loaded = true;
  });
  let card = await pg.evaluate(() => mstCardHtml());
  is(/계약일을 아직 아무에게도 안 넣으셨습니다/.test(card),
     '아무도 없으면 <b>그렇게 적는다</b> — 빈 판을 세우지 않는다');
  is(/짐작해서 채우지 않습니다/.test(card),
     '<b>날짜를 짐작하지 않는다</b>고 그 자리에 적는다');
  is(!/개월<\/span><span class="mst-when/.test(card), '줄을 하나도 안 세운다');

  /* 한 사람만 계약일을 넣으면 — 나머지 둘은 「안 넣은 분 2명」 으로 센다 */
  await pg.evaluate(() => {
    CM.meta = { c1: Object.assign(cmBlank(), { cd: window.__back(35) }) };  /* 1개월이 지났다 */
  });
  card = await pg.evaluate(() => mstCardHtml());
  is(/계약일을 아직 안 넣은 분이 2명/.test(card),
     '<b>안 넣은 분이 몇 명인지</b> 적는다 — 조용히 빠뜨리지 않는다');
  is(/1개월/.test(card) && /홍○○|홍/.test(card), '계약일을 넣은 한 분은 <b>줄로 선다</b>');
  is(/일 지났습니다/.test(card), '지난 마디는 <b>며칠 지났는지</b> 적는다');

  /* ─────────────────────────────────────────────────────────────
     [3] 기사를 <b>지어내지 않는다</b>                                   */
  head('[3] 기사를 <b>지어내지 않는다</b>');
  await pg.evaluate(() => { NLIVE.items = []; });
  card = await pg.evaluate(() => mstCardHtml());
  is(/받아 둔 기사가 <b>아직 없습니다/.test(card),
     '받아 온 것이 없으면 <b>없다고 적는다</b>');
  is(/고객에게 전할 뉴스/.test(card), '<b>어디서 모으는지</b>를 같이 알려 준다');
  let say = await pg.evaluate(() => mstSay('c1', 1));
  is(!/기사/.test(say), '기사가 없으면 보낼 말에 <b>기사 자리를 안 만든다</b>');

  /* 진짜로 받아 둔 기사가 있으면 — <b>그대로</b> 옮긴다 */
  await pg.evaluate(() => {
    NLIVE.items = [{ title: '실손보험 청구 절차 간소화 시행', link: 'https://example.com/a1',
                     source: '보험신문', d: '2026-09-08', cats: ['ins'] },
                   { title: '기준금리 동결 결정', link: 'https://example.com/a2',
                     source: '경제일보', d: '2026-09-07', cats: ['econ'] }];
  });
  card = await pg.evaluate(() => mstCardHtml());
  is(/실손보험 청구 절차 간소화 시행/.test(card), '<b>제목을 그대로</b> 옮긴다');
  is(/보험신문/.test(card), '<b>언론사를 그대로</b> 옮긴다');
  is(/https:\/\/example\.com\/a1/.test(card), '<b>주소를 그대로</b> 옮긴다');
  is(!/기준금리 동결/.test(card),
     '1개월 마디에는 <b>보험 칸 기사</b>가 붙는다 — 아무 기사나 붙이지 않는다');
  say = await pg.evaluate(() => mstSay('c1', 1));
  is(/실손보험 청구 절차 간소화 시행/.test(say) && /https:\/\/example\.com\/a1/.test(say),
     '보낼 말 뒤에도 <b>제목과 주소가 그대로</b> 붙는다');

  /* ─────────────────────────────────────────────────────────────
     [4] 세금 이야기에 <b>숫자를 적지 않는다</b> (2번)                   */
  head('[4] 세금 이야기에 <b>한도·나이·개월 수를 적지 않는다</b>');
  const tax = await pg.evaluate(() => MST_STEPS.filter(s => s.cat === 'tax').map(s => s.say).join('\n'));
  is(tax.length > 0, '세금 마디가 있다 (9개월 — 연말 채비)');
  is(!/\d+\s*(만원|원|%|퍼센트|세|년|개월)/.test(tax),
     '<b>금액·나이·개월 수가 없다</b> — 시행령에 있고 개정되면 바뀌는 값이다');
  is(!/비과세입니다|공제됩니다|받으실 수 있습니다/.test(tax),
     '<b>결론을 내지 않는다</b> — 요건 하나가 어긋나면 고객 앞에서 무너진다');
  is(/세무 전문가|국세청/.test(tax), '<b>판단은 전문가에게</b> 넘긴다');
  const all = await pg.evaluate(() => MST_STEPS.map(s => s.say).join('\n'));
  is(/심사 결과에 따릅니다/.test(all), '보장·보험료는 <b>「심사 결과에 따릅니다」</b>를 빼지 않는다');
  is(!/홍길동|김철수/.test(all), '보낼 말에 <b>사람 이름을 박아 두지 않는다</b> — 「고객님」으로 나간다');

  /* ─────────────────────────────────────────────────────────────
     [5] 계약일이 <b>저장되고 다시 읽힌다</b>                            */
  head('[5] 계약일이 <b>저장되고 다시 읽힌다</b>');
  const rt = await pg.evaluate(() => {
    const m = cmBlank();
    m.cd = '2026-03-15'; m.bd = '03-15'; m.fam = '홍길동 가족';
    const body = cmBody(m);                 /* 서버로 보낼 꼴 */
    const back = cmRead(body);              /* 서버에서 읽어 온 꼴 */
    return { sent: body.cd, got: back.cd, bd: back.bd, fam: back.fam,
             keys: CM_FIELDS.map(f => f[0]) };
  });
  is(rt.sent === '2026-03-15', '저장할 때 <b>계약일이 실려 나간다</b> — ' + rt.sent);
  is(rt.got === '2026-03-15', '다시 읽을 때 <b>그대로 돌아온다</b> — ' + rt.got);
  is(rt.bd === '03-15' && rt.fam === '홍길동 가족', '원래 있던 칸도 같이 살아 있다');
  is(rt.keys.indexOf('cd') >= 0, '칸 목록(CM_FIELDS)에 계약일이 <b>한 곳</b>으로 적혀 있다');
  is((SRC.match(/var CM_FIELDS\s*=/g) || []).length === 1,
     '칸 목록이 <b>한 곳에만</b> 있다 (5번) — 세 곳에 적으면 저장이 조용히 빠뜨린다');
  is(/id="cmCd"/.test(SRC), '고객 카드에 <b>계약일 넣는 칸</b>이 있다');

  /* ─────────────────────────────────────────────────────────────
     [6] 화면에 <b>실제로 선다</b>                                       */
  head('[6] 고객 365일에서 <b>실제로 보인다</b>');
  /* 주소 뒤의 #clients 만으로는 그 화면이 안 열립니다 — 실제로 갑니다 */
  await pg.evaluate(() => { OSC.view = 'list'; go('clients'); });
  await pg.waitForSelector('#cli365Top', { timeout: 20000 });
  await clearOvl(pg);
  /* 고객 목록은 서버에서 오는데 견본 서버는 빈 배열을 줍니다 — 우리가 넣은
     견본이 그 사이에 지워지므로, 그리기 직전에 다시 넣습니다.          */
  await pg.evaluate(() => {
    const back = d => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
    OSC.list = [
      { id: 'c1', name_masked: '홍○○', advisor_id: 'u1' },
      { id: 'c2', name_masked: '임○○', advisor_id: 'u1' },
      { id: 'c3', name_masked: '장○○', advisor_id: 'u1' }
    ];
    CM.meta = { c1: Object.assign(cmBlank(), { cd: back(35) }) };
    CM.loaded = true;
    cli365TopPaint();
  });
  await pg.waitForTimeout(250);
  const seen = await pg.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('#cli365Top .mst-row'));
    const b = document.querySelector('#cli365Top .mst-b.p');
    return { rows: rows.length,
             w: rows.length ? Math.round(rows[0].getBoundingClientRect().width) : 0,
             copy: !!b, copyTxt: b ? b.textContent : '' };
  });
  is(seen.rows >= 1, '판이 <b>고객 365일 맨 위에</b> 선다 — 줄 ' + seen.rows + '개');
  is(seen.w > 200, '줄이 눈에 보인다 — 폭 ' + seen.w + 'px');
  is(seen.copy && /복사/.test(seen.copyTxt), '<b>보낼 말 복사</b> 단추가 그 자리에 있다');

  /* 「보냈습니다」 를 누르면 그 마디는 <b>다음 마디로 넘어간다</b> */
  const before = await pg.evaluate(() => document.querySelectorAll('#cli365Top .mst-row').length);
  await clearOvl(pg);
  await pg.evaluate(() => { mstToggle('c1', 1); });
  await pg.waitForTimeout(200);
  const after = await pg.evaluate(() => ({
    rows: document.querySelectorAll('#cli365Top .mst-row').length,
    done: mstIsDone('c1', 1)
  }));
  is(after.done, '「보냈습니다」가 <b>기억된다</b>');
  is(after.rows < before || after.rows === 0,
     '보낸 마디는 <b>목록에서 내려간다</b> — ' + before + '줄 → ' + after.rows + '줄');

  head('[7] 이 판을 그리는 동안 <b>터진 곳이 없다</b>');
  const real = errs.filter(x => !/favicon|net::ERR|Failed to load resource|ERR_FAILED/i.test(x));
  is(real.length === 0, '콘솔 에러 0건' + (real.length ? ' — ' + real.slice(0, 3).join(' / ') : ''));

  await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ 계약 마디 — ' + bad + '/' + n + ' 자리가 막혔습니다'
                          : '✓ 계약 마디 — ' + n + '자리 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
