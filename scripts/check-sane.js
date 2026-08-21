/* 숫자 위생 — <b>화면에 말이 안 되는 것이 찍혀 있지 않은가.</b>

   점검이 일흔 개가 넘는데도 이런 것이 샜다.

     · 월 50만원이 <b>「50억」</b> 으로 찍혔다 (원 단위를 만원 함수에 넣어서)
     · 달러 3,000만원이 <b>「3,000억」</b> 으로 찍혔다 (같은 원인)
     · 환율이 <b>「0원 / $1」</b> 이었다

   왜 안 잡혔나. 기존 점검은 전부 <b>기능</b>을 본다 — 「이 단추를 누르면
   이게 나오나」. 나온 숫자가 <b>말이 되는가</b> 는 아무도 안 봤다.
   그런데 고객 앞에서 무너지는 건 언제나 후자다.

   여기서는 기능을 안 본다. 화면을 열어 <b>글자만</b> 훑는다.

     1. 부서진 값이 화면에 나오는가 — NaN · undefined · Infinity · [object Object]
     2. 자릿수가 터졌는가 — 현실적인 값을 넣었는데 <b>조</b> 단위가 나오면
        거의 언제나 만원↔원 혼동이다
     3. 적어 준 금액을 화면이 <b>그대로 되짚는가</b> — 50을 넣었는데
        50억이라 말하면 여기서 걸린다
     4. 화면이 비어 있지 않은가 — 껍데기만 서는 것도 고장이다
     5. 콘솔이 조용한가

   ※ 이 점검은 <b>새 화면이 생겨도 저절로 따라간다.</b> 탭 목록을 화면에서
     읽어 오므로, 탭을 늘리면 늘어난 만큼 자동으로 본다.                */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
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

/* 사람이 실제로 넣을 만한 한 벌. 견본이라 이름은 홍길동이다.
   여기 값을 넣고 나면 화면 어디에도 「조」 가 나올 이유가 없다. */
const PROFILE = {
  s_name: '홍길동', s_age: '42', s_gender: '남성', s_rage: '65',
  s_gross: '6000', s_spouse: '250', s_other: '0',
  s_housing: '80', s_loan: '120', s_food: '150', s_insurance: '45', s_edu: '90',
  s_target: '300', s_nps: '120', s_pension: '34', s_irp: '25', s_isa: '30',
  s_taxfree: '30', s_general: '10',
  s_realty: '50000', s_debt: '20000', s_severance: '4000',
  s_inf: '3', s_ret: '5', ins_life: '10000', ins_monthly: '45'
};

/* 부서진 값 — 화면 글자에 이게 보이면 무조건 고장이다 */
const BROKEN = [
  ['NaN', /NaN/],
  ['undefined', /undefined/],
  ['Infinity', /Infinity/],
  ['[object Object]', /\[object Object\]/],
  ['-0원', /(^|[^0-9])-0원/]
];

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page.goto(base + '/app/finance.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n[1] 사람이 넣을 만한 값 한 벌을 넣는다');
  const put = await page.evaluate((P) => {
    let n = 0, miss = [];
    for (const id in P) {
      const e = document.getElementById(id);
      if (!e) { miss.push(id); continue; }
      e.value = P[id];
      try {
        e.dispatchEvent(new Event('input', { bubbles: true }));
        e.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (x) {}
      n++;
    }
    try { if (typeof render === 'function') render(); } catch (x) {}
    return { n: n, miss: miss };
  }, PROFILE);
  is(put.n >= 20, '  ' + put.n + '칸을 채웠다' + (put.miss.length ? ' (없는 칸: ' + put.miss.join(',') + ')' : ''));
  is(put.miss.length === 0, '  사이드바에 없어진 칸이 없다');

  console.log('\n[2] 탭 목록을 화면에서 읽어 온다 — 새 탭이 생겨도 저절로 따라간다');
  const tabs = await page.evaluate(() =>
    [].map.call(document.querySelectorAll('.tab-pane'), e => e.id.replace(/^tab-/, ''))
      .filter(Boolean));
  is(tabs.length >= 8, '  탭 ' + tabs.length + '개 — ' + tabs.join(' '));

  console.log('\n[3] 화면마다 — 부서진 값 · 자릿수 · 빈 화면');
  for (const t of tabs) {
    const r = await page.evaluate(async (tab) => {
      try { if (typeof switchTab === 'function') switchTab(tab); } catch (e) {}
      await new Promise(r => setTimeout(r, 260));
      const pane = document.getElementById('tab-' + tab);
      const txt = pane ? (pane.innerText || pane.textContent || '') : '';
      /* 「N조」 또는 억이 만 이상 — 현실적인 값을 넣었으니 나올 수 없다.
         ※ <b>법 조문 번호</b>를 돈으로 착각하면 안 된다. 「상증법 제18조」의
           18 은 금액이 아니다. 앞에 「제」 가 붙으면 조문이다 — 이걸 안
           가려내면 점검이 매번 헛것을 잡고, 그러면 사람이 점검을 안 믿는다.
           점검이 틀리는 것은 버그를 놓치는 것만큼 나쁘다.              */
      const jo = (txt.match(/(.{0,2})([0-9][0-9,]*)\s*조/g) || [])
        .filter(m => !/제\s*[0-9][0-9,]*\s*조$/.test(m));
      const bigEok = (txt.match(/([0-9][0-9,]{4,})\s*억/g) || []);
      return { txt: txt, len: txt.replace(/\s+/g, '').length, jo: jo, bigEok: bigEok };
    }, t);
    let hit = [];
    BROKEN.forEach(b => { if (b[1].test(r.txt)) hit.push(b[0]); });
    is(hit.length === 0, '  ' + t + ' — 부서진 값 없음' + (hit.length ? ' ✗ ' + hit.join(', ') : ''));
    is(r.jo.length === 0 && r.bigEok.length === 0,
       '  ' + t + ' — 자릿수 정상' +
       ((r.jo.length || r.bigEok.length) ? ' ✗ ' + r.jo.concat(r.bigEok).slice(0, 3).join(' / ') : ''));
    /* 단추를 눌러야 그려지는 화면(PPT 등)은 머리글만 있어도 정상이다.
       기준을 너무 높이면 멀쩡한 화면을 고장이라 부른다. */
    is(r.len > 80, '  ' + t + ' — 화면이 비어 있지 않다 (' + r.len + '자)');
  }

  console.log('\n[4] 적어 준 금액을 화면이 그대로 되짚는가');
  /* 만원↔원 혼동의 지문은 <b>정확히 10,000배</b>다. 50 을 넣고 「50억」 이
     나오면 여기서 걸린다. 되짚어 말하는 자리를 목록으로 들고 있는다. */
  const ECHO = [
    { name: '클로징 · 매달', tab: 'total',
      set: 'CZ.mode="month";CZ.amt=50;CZ.years=10;czPaint();',
      box: 'closeOne', want: /50만원/, deny: /50억/ },
    { name: '클로징 · 목돈', tab: 'total',
      set: 'CZ.mode="lump";CZ.amt=10000;czPaint();',
      box: 'closeOne', want: /1억/, deny: /1조|10,000억/ },
    { name: '상속 · 남기려는 금액', tab: 'inherit',
      set: 'lgvSet("face",30000);',
      box: 'inherit-content', pick: '.card', want: /3억/, deny: /30,000억|300,000만원/ },
    { name: '부동산 · 집값', tab: 'realestate',
      set: 'document.getElementById("s_realty").value="50000";renderRealEstate();',
      box: 'realestate-content', pick: '.card', want: /5억/, deny: /50,000만원|5조/ }
  ];
  for (const e of ECHO) {
    const r = await page.evaluate(async (E) => {
      try { if (typeof switchTab === 'function') switchTab(E.tab); } catch (x) {}
      await new Promise(r => setTimeout(r, 200));
      try { eval(E.set); } catch (x) { return { err: String(x).slice(0, 90) }; }
      await new Promise(r => setTimeout(r, 200));
      /* pick 이 있으면 <b>그 한 장 안에서만</b> 본다 — 옆 칸의 옛 표기까지
         끌어다 잡으면 고쳐도 안 꺼지는 헛경보가 된다. */
      let b = document.getElementById(E.box);
      if (b && E.pick) b = b.querySelector(E.pick) || b;
      return { txt: b ? (b.innerText || b.textContent || '').replace(/\s+/g, ' ') : '' };
    }, e);
    if (r.err) { is(false, '  ' + e.name + ' — 세우지 못했다: ' + r.err); continue; }
    is(new RegExp(e.want.source).test(r.txt), '  ' + e.name + ' — 적어 준 대로 되짚는다');
    is(!new RegExp(e.deny.source).test(r.txt),
       '  ' + e.name + ' — 만 배로 부풀지 않는다' +
       (new RegExp(e.deny.source).test(r.txt) ? ' ✗ 단위가 어긋났다' : ''));
  }

  console.log('\n[5] 콘솔이 조용하다');
  is(errs.length === 0, '  오류 없음' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log(bad ? '\n✗ ' + bad + '개 어긋남\n'
                  : '\n──────────────────────────────\n숫자 위생 점검 통과 — 화면에 말이 안 되는 것이 없습니다.\n');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
