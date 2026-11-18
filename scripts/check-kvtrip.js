/* 🔁 <b>어디서 열어도 같은가</b> — 기기 사이 왕복을 실제로 시켜 봅니다 (판 X449)

   사장님 말씀 2026-11-15 — 「현재 컴퓨터에서 저장하고, 노트북[다른 곳]에서 열면
   <b>안 보이는 것들이 있어서는 안 되</b>. 전체적으로 모든 내용이 공유 되도록
   만들자. 반대로 노트북 핸드폰에서 저장해도, 어디서든 공유되어야 돼.
   "우리 APEX-PRO" <b>모든게</b>」

   ── ⚠ 왜 이 자가 따로 필요한가 ───────────────────────────────────
   check-kvsync 는 <b>글자로만</b> 봅니다 — 「올리게 적혀 있나」 입니다. 그것만으로는
   「<b>정말 올라가고, 다른 기기에서 정말 내려오나</b>」 를 모릅니다. 판 X447 에서
   제가 만든 자가 잠금을 빼도 안 울었던 일이 바로 그 결입니다 (8번).
   그래서 이 자는 <b>창을 둘 띄워</b> 한쪽에서 적고 다른 쪽에서 열어 봅니다.

   ── 보는 것 ───────────────────────────────────────────────────
     [1] <b>기기 ㄱ에서 적으면 서버로 간다</b> — 보낸 값을 가짜 서버가 그대로 잡는다
     [2] ★★ <b>기기 ㄴ에서 열면 보인다</b> — 적은 적 없는 창에 그 값이 선다
     [3] ★★ <b>막은 것은 한 톨도 안 간다</b> — 주민번호 · 열쇠 · 토큰 · 🙈 · 탭
     [4] ★ <b>지우면 지워진 것도 건너간다</b> — 한쪽에서 지운 것이 다른 쪽에 남지 않게
     [5] ★ <b>너무 큰 값은 안 올리고 말한다</b> (1번 · 7번)
     [6] ★ 켤 때 서버를 안 부른다 — 처음 누를 때 받습니다 (7번)

   ★ 사장님 진짜 서버는 <b>한 번도 안 부릅니다</b> — Supabase 를 가짜로 갈아 끼워
     오간 값을 그대로 잡아 봅니다 (8번).                                        */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);

/* ── 가짜 서버 — <b>한 벌</b>을 두 창이 같이 봅니다. 그것이 「다른 기기」 흉내입니다.
      값은 node 쪽 TABLE 에 있고, 창은 window.__srv 로 묻습니다.             ── */
const TABLE = {};              /* { 열쇠: {v, updated_at} } */
let 보낸것 = [];

const PAGE = `<!doctype html><html data-theme="light"><head><meta charset="utf-8"><title>kv</title></head><body>
<script>
window.OS={ sb:null, session:{user:{id:'me'}}, profile:{id:'me',name:'윤시현',role:'owner'} };
OS.sb=(function(){
  var mk=function(tbl){
    var o={__t:tbl,__f:{},__sel:''};
    o.select=function(c){ o.__sel=c||''; return o; };
    o.eq=function(k,v){ o.__f[k]=v; return o; };
    o.in=function(){ return o; };
    o.upsert=function(row){ o.__up=row; return o; };
    o.then=function(f,g){
      var pr;
      if(o.__up) pr=window.__srvPut(tbl,o.__up);
      else       pr=window.__srvGet(tbl);
      return Promise.resolve(pr).then(f,g);
    };
    return o;
  };
  return { from:mk };
})();
<\/script>
<script src="/app/apex-kv-sync.js"><\/script>
</body></html>`;

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();

  /* 창을 열고 가짜 서버를 붙입니다. 두 창이 <b>같은 TABLE</b> 을 봅니다 */
  const 창열기 = async (이름) => {
    const ctx = await browser.newContext();
    await ctx.route('**://**', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
    const pg = await ctx.newPage();
    pg.on('pageerror', e => { console.log('    (터짐 ' + 이름 + ') ' + String(e).slice(0, 110)); });
    await pg.exposeFunction('__srvPut', (tbl, row) => {
      보낸것.push({ tbl, row });
      const at = new Date(Date.now() + 보낸것.length).toISOString();
      TABLE[row.k] = { v: row.v, updated_at: at };
      return { data: [{ updated_at: at }], error: null };
    });
    await pg.exposeFunction('__srvGet', (tbl) => {
      if (tbl !== 'apex_user_kv') return { data: [], error: null };
      return { data: Object.keys(TABLE).map(k => ({ k, v: TABLE[k].v, updated_at: TABLE[k].updated_at })), error: null };
    });
    await pg.route(base + '/page', r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: PAGE }));
    await pg.goto(base + '/page', { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => !!window.APEX_KV, { timeout: 15000 });
    /* 이 자는 「처음 누를 때」 받습니다 (7번) — 눌러서 깨웁니다 */
    await pg.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' })); });
    await pg.waitForTimeout(1600);
    return pg;
  };

  sec('[1] <b>기기 ㄱ에서 적으면 서버로 간다</b>');
  const ㄱ = await 창열기('ㄱ');
  보낸것 = [];
  await ㄱ.evaluate(() => {
    localStorage.setItem('apex_baba_rows', JSON.stringify([{ id: 'b1', 이름: '홍길동' }]));
    localStorage.setItem('apex_mcal_my_me', JSON.stringify({ '2026-11-20': ['홍길동 만남'] }));
    /* ★★ 판 X465 — <b>apex_ 이름을 안 쓰는 열쇠</b>도 한 가지 실어 보냅니다.
       이번에 찾은 여섯(🏠 출발지 · ⏱ 상담 분 · ✅ 챙긴 표시 · 🎓 셋)이 전부
       그런 이름이라, apex_ 둘만 건너보내면 <b>그 길은 한 번도 안 재는 셈</b>입니다
       — 사장님이 「다시 확인해봐」 하셔서 찾은 자리가 바로 거기입니다 (8번). */
    localStorage.setItem('apexRouteStayV1', '45');
  });
  await ㄱ.waitForTimeout(2600);
  const 간것 = 보낸것.filter(x => x.tbl === 'apex_user_kv').map(x => x.row.k);
  is(간것.indexOf('apex_baba_rows') >= 0, '보장분석 전·후가 서버로 갔다 — apex_baba_rows');
  is(간것.indexOf('apex_mcal_my_me') >= 0, '내 캘린더 일정도 갔다 — apex_mcal_my_me');
  is(간것.indexOf('apexRouteStayV1') >= 0,
     '★★ <b>apex_ 이름이 아닌 것도 갔다</b> — apexRouteStayV1 (⏱ 상담 한 건에 몇 분 · 판 X465)');
  is((보낸것.find(x => x.row.k === 'apex_baba_rows') || { row: {} }).row.user_id === 'me',
     '  누구 것인지 붙여 보낸다 — user_id');

  sec('[2] ★★ <b>기기 ㄴ에서 열면 보인다</b> — 적은 적 없는 창입니다');
  const ㄴ = await 창열기('ㄴ');
  await ㄴ.waitForTimeout(2600);
  const 본것 = await ㄴ.evaluate(() => ({
    baba: localStorage.getItem('apex_baba_rows'),
    cal: localStorage.getItem('apex_mcal_my_me'),
    stay: localStorage.getItem('apexRouteStayV1')
  }));
  is(!!본것.baba && 본것.baba.indexOf('홍길동') >= 0,
     '★★ <b>기기 ㄴ에 보장분석이 그대로 섰다</b> — ' + String(본것.baba).slice(0, 44));
  is(!!본것.cal && 본것.cal.indexOf('2026-11-20') >= 0, '★★ 내 캘린더 일정도 섰다');
  is(본것.stay === '45',
     '★★ <b>⏱ 상담 한 건에 몇 분도 그대로 섰다</b> — ' + String(본것.stay) +
     '분 (컴퓨터에서 45분으로 잡으면 노트북 동선도 45분으로 하루를 짭니다 · 판 X465)');

  sec('[3] ★★ <b>막은 것은 한 톨도 안 간다</b>');
  보낸것 = [];
  await ㄱ.evaluate(() => {
    localStorage.setItem('apex_cli_rrn_c1', '900101-1234567');   /* ⛔ 주민번호 */
    localStorage.setItem('apex_personal_key', 'sk-xxxx');        /* ⛔ 열쇠 */
    localStorage.setItem('apex_studio_apptoken', 'tok-xxxx');    /* ⛔ 토큰 */
    localStorage.setItem('apex_hm_hidenm', '1');                 /* ⛔ 🙈 — 그 폰에서만 */
    localStorage.setItem('apex_last_tab', 'home');               /* ⛔ 이 기기 취향 */
    localStorage.setItem('apex_pay_cfg', '{"bank":"x"}');        /* ⛔ 결제 설정 */
  });
  await ㄱ.waitForTimeout(2600);
  const 샌것 = 보낸것.map(x => x.row.k);
  is(샌것.length === 0, '막은 여섯이 <b>한 줄도 안 갔다</b> (받음 ' + 샌것.length + '줄' +
     (샌것.length ? ' ← ' + 샌것.join(' · ') : '') + ')');
  /* ★ 값으로도 한 번 더 — 이름이 아니라 <b>보낸 글</b>에 주민번호가 섞이지 않았나 */
  const 글 = JSON.stringify(보낸것);
  is(글.indexOf('900101') < 0 && 글.indexOf('sk-xxxx') < 0 && 글.indexOf('tok-xxxx') < 0,
     '  ★ 보낸 글 어디에도 <b>주민번호 · 열쇠 · 토큰이 없다</b> (3번 · 10번)');
  const ㄴ본것 = await ㄴ.evaluate(() => localStorage.getItem('apex_cli_rrn_c1'));
  is(ㄴ본것 === null, '  ★ 기기 ㄴ 에도 주민번호가 <b>안 건너왔다</b> — 그 기기에서 다시 적으셔야 합니다');

  sec('[4] ★ <b>지우면 지워진 것도 건너간다</b>');
  보낸것 = [];
  await ㄱ.evaluate(() => { localStorage.removeItem('apex_baba_rows'); });
  await ㄱ.waitForTimeout(2600);
  is(보낸것.some(x => x.row.k === 'apex_baba_rows' && x.row.v === ''),
     '지운 것도 서버로 간다 — 한쪽에서 지운 것이 다른 쪽에 남으면 안 됩니다');

  sec('[5] ★ <b>너무 큰 값은 안 올리고 말한다</b> (1번 · 7번)');
  보낸것 = [];
  const 큰 = await ㄱ.evaluate(async () => {
    const max = window.APEX_KV.maxV;
    localStorage.setItem('apex_big_test_v1', 'x'.repeat(max + 10));
    await new Promise(z => setTimeout(z, 2400));
    return { 큰것: Object.keys(window.APEX_KV.tooBig), max: max };
  });
  is(보낸것.length === 0, '선(' + 큰.max + '자)을 넘는 값은 <b>안 올린다</b> (받음 ' + 보낸것.length + '줄)');
  is(큰.큰것.indexOf('apex_big_test_v1') >= 0,
     '  ★ <b>안 올렸다고 남긴다</b> — 조용히 빠뜨리면 까닭을 영영 모르십니다 (1번)');

  sec('[6] ★ 켤 때 서버를 안 부른다 — 처음 누를 때 받습니다 (7번)');
  const KV = fs.readFileSync(path.join(ROOT, 'app/apex-kv-sync.js'), 'utf8');
  is(/armed=go1;/.test(KV) && /EV=\['keydown','pointerdown','touchstart'\]/.test(KV),
     '로그인 끝나자마자 바로 안 받는다 — 처음 누르거나 · 치거나 · 창으로 돌아올 때');

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데가 걸렸습니다.'); process.exit(1); }
  console.log('✓ 한쪽에서 적으면 다른 쪽에서 보입니다 — 막은 것(주민번호·열쇠·토큰)은 한 톨도 안 갑니다.');
})().catch(e => { console.error('터짐: ' + e.message); try { srv.close(); } catch (x) {} process.exit(1); });
