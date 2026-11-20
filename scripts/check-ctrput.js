/* 🪪 <b>고객 창 판 3 — 계약을 손으로 적어 넣는 자리</b> (판 X446)

   설계 docs/고객한장_설계.md 11-6 「판 3 · 계약 · 제안서 · 증권 (본인만)」.
   사장님 말씀 (2026-10-22~23) 「주민번호까지 받고 가입제안서도 담을 수 있으면 …
   <b>계약정보 관리</b> … 깔끔하게」 · 「1판부터 만들어」 · 「오케이 적용 시켜서
   판을 바꾸자 … <b>절대 어떠한 것도 깨지면 안 된다</b>」.

   ── ⚠ 왜 이것이 7개월 남아 있었나 — 재어 보고 알았습니다 ───────
   서버 규칙은 판 X430 에서 <b>본인만</b>으로 이미 좁혔습니다. 그런데 계약을
   넣는 길이 <b>하나뿐</b>이었습니다 — PDF 를 올려 AI 가 뽑는 것(osMaterialize).
   그래서 고객 <b>166분에 policies 가 0줄</b>입니다. 증권이 종이로만 있거나
   PDF 를 아직 안 올린 분은 <b>적을 자리가 없었습니다.</b>

   ── 이 자가 보는 것 ────────────────────────────────────────────
     1. ★★ 「이 분 계약이 무엇인가」 를 <b>묻는 곳이 하나</b>다 (5번) —
        ctrOf. 가입한 보험 칸도 그것을 본다
     2. ★ 적는 칸이 <b>보장 탭 안</b>에 선다 · 누르면 펴진다
     3. ★★ <b>빈 칸은 null</b> 이다 (1번) — 0 으로 넣으면 「보험료 0원」 이
        되고 합계가 틀린다. 실제로 넣어 보고 <b>보낸 값</b>을 잡아 본다
     4. ★★ <b>이름을 서버에 안 보낸다</b> (3번) — policyholder · insured 를
        적는 칸이 없고, 보내는 줄에도 없다
     5. ★ <b>월 보험료는 원</b>이다 (4번) — 칸 이름에 「원」 · 만원 아님
     6. ★★ 한 칸도 안 적으면 <b>빈 줄을 안 만든다</b> (1번)
     7. ★ <b>어디서 온 값인지</b> 밝힌다 — 손으로 적음 / PDF 에서 읽음
     8. ★ <b>만기를 날짜로</b> 적는다 — 「며칠 남았다」 로 안 적는다 (사장님 말씀)
     9. ★★ <b>PDF 길이 그대로 있다</b> (6번) — 길을 없앤 것이 아니라 하나 더 냄
    10. ★ 고친 뒤 <b>읽는 자를 다시 부른다</b> — 적어 놓고 화면이 옛 값이면
        사장님은 안 들어간 줄 아십니다
    11. ★ 누르는 자리 44px

   ★ 사장님 진짜 서버는 한 번도 안 부릅니다 — Supabase 를 가짜로 갈아 끼워
     <b>보낸 값을 잡아</b> 봅니다 (8번).                                   */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
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
const sec = (t) => console.log('\n' + t);

/* 가짜 Supabase — <b>보낸 값을 그대로 잡아 둡니다</b>. 진짜 서버로는 한 번도 안 나갑니다 (8번) */
const FAKE = `
window.__SENT=[];
window.osClient=function(){
  var mk=function(tbl){
    var o={__t:tbl,__f:{}};
    o.select=function(){return o;}; o.eq=function(k,v){o.__f[k]=v;return o;};
    o.order=function(){return o;}; o.limit=function(){return o;}; o.range=function(){return o;};
    o.insert=function(row){ window.__SENT.push({op:'insert',tbl:tbl,row:row}); return Promise.resolve({data:[{id:'new1'}],error:null}); };
    o.update=function(row){ window.__SENT.push({op:'update',tbl:tbl,row:row}); return Promise.resolve({data:[],error:null}); };
    o.delete=function(){ window.__SENT.push({op:'delete',tbl:tbl}); return Promise.resolve({data:[],error:null}); };
    o.upsert=function(row){ window.__SENT.push({op:'upsert',tbl:tbl,row:row}); return Promise.resolve({data:[],error:null}); };
    o.then=function(f,g){ return Promise.resolve({data:[],error:null}).then(f,g); };
    return o;
  };
  return { from:mk, storage:{ from:function(){ return { upload:function(){return Promise.resolve({data:{},error:null});},
                                                       createSignedUrl:function(){return Promise.resolve({data:{},error:null});} }; } } };
};
`;

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r =>
    r.request().url().startsWith('http://127.0.0.1:') ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  await page.evaluate(FAKE);
  await page.evaluate(() => {
    window.toast = function () {};
    window.confirm = function () { return true; };
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    OS.profile = { id: 'me', name: '윤시현', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'me' } };
    /* 견본 고객 — 이름은 홍길동 식구만 (3번) */
    OSC.current = { id: 'c1', name_masked: '홍○동', created_at: '2026-01-02T00:00:00Z' };
    OSC.list = [OSC.current];
    /* ⚠ <b>진짜 자리를 세웁니다</b> — ctrOpen 은 #ctrHost 에 그립니다. 자리를 안 세우고
       ctrSave 를 부르면 칸이 없어 값이 다 빈 채로 읽혀 「적으신 칸이 없습니다」 가
       됩니다. 처음에 그렇게 재어 멀쩡한 자리를 고발했습니다 (8번).
       ★ <b>#dynPane 안</b>에 세웁니다 — 누르는 자리 44px 규칙이 거기서 섭니다. */
    const pane = document.getElementById('dynPane') || document.body;
    const host = document.createElement('div'); host.id = 'ctrHost';
    pane.appendChild(host);
  });

  const SRC = fs.readFileSync('app/index.html', 'utf8');

  sec('[1] ★★ 「이 분 계약이 무엇인가」 를 <b>묻는 곳이 하나</b>다 (5번)');
  is(/function ctrOf\(/.test(SRC), 'ctrOf 가 있다');
  const POL = SRC.slice(SRC.indexOf('function oscPolHtml()'), SRC.indexOf('function oscPolPaint()'));
  is(/ctrOf\(/.test(POL), '  가입한 보험 칸도 <b>ctrOf</b> 를 본다 — 두 곳이 다른 답을 할 수 없다');
  const ONE = await page.evaluate(() => {
    OSCP.cid = 'c1'; OSCP.busy = false; OSCP.err = '';
    const out = {};
    OSCP.rows = null;                       out.못읽음 = ctrOf('c1');
    OSCP.busy = true; OSCP.rows = [];       out.읽는중 = ctrOf('c1');
    OSCP.busy = false; OSCP.rows = [{ id: 'p1' }]; out.한건 = (ctrOf('c1') || []).length;
    out.딴사람 = ctrOf('zzz');
    return out;
  });
  is(ONE.못읽음 === null && ONE.읽는중 === null,
     '  ★ 못 읽었거나 읽는 중이면 <b>null</b> — 「0건」 이라고 안 한다 (1번)');
  is(ONE.한건 === 1, '  읽었으면 그 줄을 준다');
  is(ONE.딴사람 === null, '  ★ <b>다른 분 것을 안 준다</b> — 읽어 둔 것이 그 분 것이 아니면 null');

  sec('[2] 적는 칸이 <b>보장 탭 안</b>에 선다 · 누르면 펴진다');
  is(/cusSec\('cov','<div id="ctrHost">'/.test(SRC.replace(/\s+/g, ' ')) ||
     /id="ctrHost"/.test(SRC),
     '✍️ 계약 적기 칸이 <b>보장(cov) 탭</b>에 선다');
  const OPEN = await page.evaluate(async () => {
    OSCP.cid = 'c1'; OSCP.busy = false; OSCP.rows = []; OSCP.err = '';
    const 닫힘 = ctrHtml(OSC.current);
    ctrOpen('');
    await new Promise(z => setTimeout(z, 120));
    const 열림 = ctrHtml(OSC.current);
    return { 닫힘칸: /ctr_insurer/.test(닫힘), 열림칸: /ctr_insurer/.test(열림),
             단추: /＋ 계약/.test(닫힘), 원: /월 보험료 \(<b>원<\/b>\)/.test(열림) };
  });
  is(OPEN.닫힘칸 === false && OPEN.단추, '  처음에는 <b>접혀</b> 있고 「＋ 계약」 단추가 선다');
  is(OPEN.열림칸, '  누르면 <b>적는 칸이 펴진다</b>');

  sec('[3]·[4]·[5] ★★ <b>빈 칸은 null</b> · 이름을 안 보낸다 · 원 단위');
  is(OPEN.원, '월 보험료 칸 이름에 <b>원</b>이 적혀 있다 (4번) — 만원이 아닙니다');
  is(!/id="ctr_policyholder"|id="ctr_insured"/.test(SRC),
     '★★ <b>계약자·피보험자를 적는 칸이 없다</b> (3번) — 이름은 서버로 안 갑니다');
  const PUT = await page.evaluate(async () => {
    window.__SENT = [];
    ctrOpen('');
    await new Promise(z => setTimeout(z, 160));
    const set = (k, v) => { const e = document.getElementById('ctr_' + k); if (e) e.value = v; };
    /* 보험사와 보험료만 적고 <b>나머지는 비웁니다</b> */
    set('insurer', '삼성생명'); set('monthly_premium', '120000');
    ctrSave();
    await new Promise(z => setTimeout(z, 300));
    return window.__SENT.slice();
  });
  const sent = PUT.filter(x => x.tbl === 'policies' && x.op === 'insert')[0];
  is(!!sent, '적어 넣으면 <b>policies 에 한 줄</b>을 보낸다' + (sent ? '' : ' ← 안 보냈습니다'));
  if (sent) {
    const r = sent.row;
    is(r.monthly_premium === 120000,
       '  ★ 월 보험료가 <b>원 그대로</b> 간다 — ' + r.monthly_premium + ' (만원이면 12 였을 것입니다)');
    is(r.product_name === null && r.expire_at === null && r.issue_date === null,
       '  ★★ <b>안 적은 칸은 null</b> 이다 (1번) — 0 이나 빈 글자가 아닙니다');
    is(r.renewable === null, '  ★ 「모름」 을 고르면 <b>null</b> — 「비갱신」 으로 단정하지 않는다 (1번)');
    is(!('policyholder' in r) && !('insured' in r),
       '  ★★ 보내는 줄에 <b>이름 칸이 아예 없다</b> (3번)');
    is(r.client_id === 'c1', '  그 고객에게 붙는다');
  }

  sec('[6] ★★ 한 칸도 안 적으면 <b>빈 줄을 안 만든다</b> (1번)');
  const EMPTY = await page.evaluate(async () => {
    window.__SENT = [];
    ctrOpen('');
    await new Promise(z => setTimeout(z, 120));
    ctrSave();
    await new Promise(z => setTimeout(z, 250));
    return window.__SENT.filter(x => x.tbl === 'policies').length;
  });
  is(EMPTY === 0, '아무것도 안 적고 누르면 <b>한 줄도 안 보낸다</b> — ' + EMPTY + '번');

  sec('[7]·[8] <b>어디서 온 값인지</b> · 만기를 <b>날짜로</b>');
  const SHOW = await page.evaluate(() => {
    OSCP.cid = 'c1'; OSCP.busy = false; OSCP.err = '';
    OSCP.rows = [
      { id: 'p1', insurer: '삼성생명', product_name: '종합보험', monthly_premium: 120000,
        pay_end_at: '2041-03-01', expire_at: '2075-03-01', source_document_id: null },
      { id: 'p2', insurer: '한화생명', product_name: '암보험', monthly_premium: null,
        source_document_id: 'd1' }
    ];
    const t = oscPolHtml().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    return { 글: t, 날짜: /2041-03/.test(t), 남음: /남았|D-|일 남/.test(t) };
  });
  is(/손으로 적음 1건/.test(SHOW.글) && /PDF 에서 읽음 1건/.test(SHOW.글),
     '★ 손으로 적은 것과 PDF 에서 읽은 것을 <b>갈라 적는다</b> (1번)');
  is(/1건은 보험료 확인 필요/.test(SHOW.글) && /120,000원/.test(SHOW.글),
     '  ★ 모르는 보험료는 <b>안 더한다</b> (1번) — 「' + (SHOW.글.match(/2건[^·]*·[^<]{0,26}/) || [''])[0].trim() + '」');
  is(SHOW.날짜 && !SHOW.남음,
     '  ★ 만기를 <b>날짜로</b> 적는다 — 「며칠 남았다」 로 안 적습니다 (사장님 말씀)');
  is(/심사 결과에 따릅니다/.test(SHOW.글), '  보험료·보장은 <b>심사 결과에 따릅니다</b> (2번)');

  sec('[9] ★★ <b>PDF 길이 그대로</b> 있다 (6번)');
  is(/function osMaterialize\(/.test(SRC) && /oscDrop/.test(SRC) && /osPickFile\(\)/.test(SRC),
     'PDF 를 올려 AI 가 뽑는 길을 <b>한 줄도 안 지웠다</b> — 길을 하나 더 냈을 뿐입니다');

  sec('[10] 고친 뒤 <b>읽는 자를 다시 부른다</b>');
  const SAV = SRC.slice(SRC.indexOf('function ctrSave()'), SRC.indexOf('function ctrDel()'));
  is(/oscPolLoad\(true\)/.test(SAV),
     '적어 넣은 뒤 <b>oscPolLoad(true)</b> 로 다시 읽는다 — 옛 값이 남으면 안 들어간 줄 아십니다');
  is(!/\.select\('.*'\)\.eq\('client_id'/.test(SAV),
     '  ★ 여기서 <b>따로 안 읽는다</b> — 읽는 자는 하나입니다 (5번 · 7번)');

  sec('[11] 누르는 자리 44px · 화면이 안 터진다');
  /* ⚠ <b>진짜 자리에서</b> 잽니다 — 떼어 낸 칸에서 재면 키가 0 으로 나와
     멀쩡한 자리를 고발합니다 (8번). */
  const TAP = await page.evaluate(async () => {
    ctrOpen('');
    await new Promise(z => setTimeout(z, 200));
    const host = document.getElementById('ctrHost');
    const b = host ? [].slice.call(host.querySelectorAll('button')).filter(x => x.offsetParent) : [];
    return { 작은: b.filter(x => x.getBoundingClientRect().height < 44).length, 모두: b.length };
  });
  is(TAP.모두 > 0 && TAP.작은 === 0, '누르는 자리 ' + TAP.모두 + '개가 모두 <b>44px 위</b>다');
  is(errs.length === 0, '터진 것 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데가 걸렸습니다.')
                  : '종이 증권도 그 자리에서 적어 넣습니다 — 모르는 칸은 모른 채로.');
  process.exit(bad ? 1 : 0);
})();
