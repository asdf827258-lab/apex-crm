/* ══════════════════════════════════════════════════════════════════
   check-tasay.js — 🎙 <b>TA 전체 대본</b>이 지어내지 않고, 되묻지 않나.

   사장님 말씀 (2026-10-12) — 「이 내용으로 스크립트 <b>처음부터 거절처리까지</b>
   따로 만들어 … <b>메뉴에 넣고</b> … <b>나로 인해서 이득 전달 보험금을 찾아준다</b>
   … <b>양자택일 약속</b>을 두 가지 중 하나로 제안할 수 있도록 틀을 잡고 …
   <b>? 가 아닌 확신에 !</b> 로 전체 재구성해서」.

   ── 이 자가 지키는 <b>한 줄</b> ───────────────────────────────────
   <b>확신은 「내가 할 일」 에만 둡니다.</b> 「찾아 드리겠습니다」 는 제 일이라
   확신해도 되지만 「받으실 돈이 있습니다」 는 <b>확인 전에는 거짓</b>입니다 (1번).
   그래서 ② 이득 마디에는 언제나 <b>「있으면」</b> 류의 조건이 붙습니다 —
   그 한 낱말이 이 대본의 안전핀이고, 이 자가 그것을 셉니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ 화제 <b>일곱 모두</b> 다섯 마디가 다 있다 — 하나라도 비면 그 자리에서
         설계사가 말을 지어냅니다
     [2] ★★ <b>물음표가 한 개도 없다</b> — 사장님 말씀 그대로입니다
     [3] ★★ <b>고객이 받을 것을 장담하지 않는다</b> (1번) — ② 에 조건이 있고,
         「돈이 있습니다」 · 「무조건」 · 「보장됩니다」 같은 단정이 없다
     [4] ★★ <b>숫자를 안 적는다</b> (1번·2번) — 한도·금액·나이·개월 수는 바뀝니다.
         공단 대표번호만 예외입니다(바뀌지 않고, 고객이 직접 확인하실 길입니다)
     [5] ★★ <b>갈아타기를 권하지 않는다</b> · <b>계좌·주민번호를 안 묻는다</b> (3번)
     [6] ★ <b>양자택일이 두 자리</b>다 — 자리 둘이 다 들어 있고 와/과가 끝소리를 따른다
     [7] ★★ <b>공통 거절 열일곱을 베끼지 않았다</b> (5번) — 화제별 거절은 그 화제에서만
         나오는 것이어야 합니다. 겹치면 같은 거절에 두 대본이 생깁니다
     [8] ★ 화면에 다섯 마디가 <b>차례대로</b> 서고 이름·두 자리가 채워진다
     [9] ★★ 메뉴로 열리고 <b>같은 파일</b>을 띄운다 — 글이 두 벌이 되면 두 메뉴가
         같은 고객에게 다른 말을 합니다 (5번)
    [10] 서버를 안 부른다 (7번) · 안 터진다
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = path.resolve(__dirname, '..'), PORT = 8937;
const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
let hits = 0;
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 글은 Node 에서 바로 읽습니다 — 브라우저 없이도 대부분을 봅니다 */
global.window = global;
require(path.join(ROOT, 'ta-trend.js'));
const T = global.TA_TREND;
const 모두 = (T.list || []).concat(T.bare ? [T.bare] : []);
const 마디 = ['open', 'gain', 'act', 'pick', 'hold'];
const 글모음 = (t) => 마디.map(k => (t.say || {})[k] || '')
  .concat((t.obj || []).map(o => [o.text, o.follow].join(' '))).join(' ');

(async () => {
  console.log('\n[1] 🎙 <b>화제 일곱 모두</b> 다섯 마디가 선다');
  is(모두.length === 7, '  화제가 <b>일곱</b>이다 (여섯 + 화제 없이) — ' + 모두.length);
  const 빈 = 모두.filter(t => !t.say || 마디.some(k => !String(t.say[k] || '').trim()));
  is(빈.length === 0, '  ★★ 다섯 마디가 <b>하나도 안 비었다</b> — ' +
     (빈.length ? 빈.map(t => t.key).join(' · ') : '빈 곳 없음'));
  const 거절없음 = 모두.filter(t => !(t.obj || []).length);
  is(거절없음.length === 0, '  화제마다 <b>그 화제 거절</b>이 있다 — ' +
     모두.map(t => (t.obj || []).length).join('·') + '가지');

  console.log('\n[2] ❗ <b>물음표가 한 개도 없다</b> (사장님 「? 가 아닌 !」)');
  const 물음 = [];
  모두.forEach(t => { const g = 글모음(t);
    (g.match(/[?？]/g) || []).forEach(() => 물음.push(t.key)); });
  is(물음.length === 0, '  ★★ 대본 전체에 물음표 <b>' + 물음.length + '개</b>' +
     (물음.length ? ' ← ' + [...new Set(물음)].join(' · ') : ''));

  console.log('\n[3] 🤝 <b>고객이 받을 것을 장담하지 않는다</b> (1번)');
  /* ② 이득 마디는 <b>조건</b>을 달아야 합니다 — 그 한 낱말이 안전핀입니다 */
  const 조건 = /있으면|있는지|계신지|어떻게 되는지|되는지/;
  const 조건없음 = 모두.filter(t => !조건.test(String((t.say || {}).gain || '')));
  is(조건없음.length === 0,
     '  ★★ ② 이득에 <b>조건</b>이 다 붙어 있다 — ' +
     (조건없음.length ? ('없는 화제 ' + 조건없음.map(t => t.key).join(' · ')) : '일곱 다'));
  /* ⚠ <b>좁게 잡습니다</b> (8번) — 「받을 수 있는 것을 찾아 드리겠습니다」 는 제 일이라
     맞는 말입니다. 막는 것은 <b>고객 몫을 단정</b>하는 꼴뿐입니다.          */
  const 단정 = [/받으실 돈이 (꼭 )?있습니다/, /무조건/, /반드시 (받|나옵)/, /보장됩니다/,
                /틀림없이/, /100% ?(받|됩)/];
  const 걸린 = [];
  모두.forEach(t => { const g = 글모음(t);
    단정.forEach(re => { const m = g.match(re); if (m) 걸린.push(t.key + ':' + m[0]); }); });
  is(걸린.length === 0, '  ★★ <b>단정하는 말이 없다</b> — ' +
     (걸린.length ? 걸린.join(' · ') : '없음'));
  is(/심사|확인|공단/.test(글모음(T.find('refund'))),
     '  ★ 환급 화제는 <b>본인이 확인하시는 것</b>이라고 적는다 — 제가 대신 못 합니다');

  console.log('\n[4] 🔢 <b>숫자를 안 적는다</b> (1번·2번)');
  /* ⚠ 공단 대표번호만 봐 줍니다 — 바뀌지 않고, 고객이 <b>직접</b> 확인하실 길입니다.
     ⚠ 「십 초」 처럼 글자로 쓴 것은 숫자가 아니라 세지 않습니다.
     ⚠ 자리 이름([①][②])은 설계사가 치는 값이라 대본 글에 숫자가 없습니다.      */
  const 숫자 = [];
  모두.forEach(t => {
    const g = 글모음(t).split('1577-1000').join('');
    /* ⚠ <b>「5세대」 는 상품 이름</b>이라 안 셉니다 — 나이가 아닙니다. 처음 판에서
       「5세」 로 걸려 울렸습니다(check-tatrend 쪽지에도 같은 덫이 적혀 있습니다 · 8번). */
    (g.match(/\d[\d,.]*\s*(만원|원|%|세(?!대)|개월|년|일|배|퍼센트)/g) || [])
      .forEach(m => 숫자.push(t.key + ':' + m));
  });
  is(숫자.length === 0, '  ★★ 한도·금액·나이·개월 수가 <b>없다</b> — ' +
     (숫자.length ? 숫자.join(' · ') : '없음'));
  is(글모음(T.find('refund')).indexOf('1577-1000') >= 0,
     '  ⚠ 공단 대표번호는 <b>적습니다</b> — 고객이 직접 확인하실 길입니다 (0곳이면 길이 끊깁니다)');

  console.log('\n[5] 🔒 <b>갈아타기를 안 권한다</b> · <b>계좌·주민번호를 안 묻는다</b> (3번)');
  const 권유 = [];
  모두.forEach(t => {
    /* 「갈아타시라는 말씀을 드리려는 것이 아닙니다」 는 <b>안 권하는 말</b>이라 봐 줍니다 */
    const g = 글모음(t);
    (g.match(/갈아타[^.]*/g) || []).forEach(m => {
      if (!/아닙니다|않겠습니다|않습니다|말씀이 아닙니다/.test(m)) 권유.push(t.key + ':' + m.slice(0, 24));
    });
  });
  is(권유.length === 0, '  ★★ <b>갈아타기를 권하는 말이 없다</b> — ' +
     (권유.length ? 권유.join(' · ') : '없음') + ' (금융당국이 승환 관리를 강화하는 자리입니다)');
  const 물어봄 = [];
  모두.forEach(t => { const g = 글모음(t);
    (g.match(/(계좌|주민번호|주민등록번호)[^.]{0,18}/g) || []).forEach(m => {
      if (!/묻지|여쭙지|안 묻|않습니다/.test(m)) 물어봄.push(t.key + ':' + m.slice(0, 26));
    }); });
  is(물어봄.length === 0, '  ★★ <b>계좌·주민번호를 묻는 말이 없다</b> — ' +
     (물어봄.length ? 물어봄.join(' · ') : '없음'));

  console.log('\n[6] 🗓 <b>양자택일이 두 자리</b>다');
  const 자리없음 = 모두.filter(t => {
    const p = String((t.say || {}).pick || '');
    return p.indexOf('[①][와과]') < 0 || p.indexOf('[②]') < 0;
  });
  is(자리없음.length === 0, '  ★ 일곱 다 <b>두 자리</b>를 들고 있다 — ' +
     (자리없음.length ? 자리없음.map(t => t.key).join(' · ') : '빠진 곳 없음'));
  is(모두.every(t => /비워 두었습니다/.test(String((t.say || {}).pick || ''))),
     '  ★ <b>묻지 않고 알립니다</b> — 「비워 두었습니다」');

  console.log('\n[7] 👥 <b>공통 거절 열일곱을 베끼지 않았다</b> (5번)');
  const SRC = fs.readFileSync(path.join(ROOT, 'apex-stage.js'), 'utf8');
  const 공통 = (SRC.match(/title:'([^']+)', tone:/g) || []).map(x => x.slice(7, -8));
  is(공통.length >= 15, '  공통 거절을 <b>' + 공통.length + '가지</b> 찾았다 (apex-stage.js 한 곳)');
  const 겹침 = [];
  모두.forEach(t => (t.obj || []).forEach(o => {
    if (공통.indexOf(o.title) >= 0) 겹침.push(t.key + ':' + o.title); }));
  is(겹침.length === 0, '  ★★ 화제별 거절이 공통과 <b>안 겹친다</b> — ' +
     (겹침.length ? 겹침.join(' · ') : '겹침 없음'));

  /* ══ 화면 ══════════════════════════════════════════════════════ */
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
    hits++; return r.abort();
  });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await p.goto('http://127.0.0.1:' + PORT + '/ta-script.html',
    { waitUntil: 'domcontentloaded', timeout: 60000 });
  /* 2026-10-14 — TA 스크립트를 새 화면으로 바꿨습니다. 메뉴 「🎙 TA 전체 대본」 은 그대로 #sayPanel 로 열고,
     그러면 화제 대본(다섯 마디 + 그 화제 거절 둘)이 섭니다. 이름·두 자리는 상담 정보 칸이 채웁니다. */
  await p.goto('http://127.0.0.1:' + PORT + '/ta-script.html#sayPanel', { waitUntil: 'load', timeout: 60000 });
  await p.waitForFunction(() => !!document.getElementById('script') && !!window.TA_APP, { timeout: 30000 });
  await p.waitForTimeout(1500);
  const hits0 = hits;

  console.log('\n[8] 🖥 화면에 <b>다섯 마디가 차례대로</b> 서고 칸이 채워진다');
  const V = await p.evaluate(() => {
    const set = (id, v) => { const e = document.getElementById(id); e.value = v;
      e.dispatchEvent(new Event('input', { bubbles: true })); };
    if (TA_APP.state.trend === 'none') TA_APP.setTrend(TA_TREND.list[0].key);
    set('i_c', '홍길동'); set('i_me', '홍길순');
    set('i_s1', '목요일 오전 10시'); set('i_s2', '토요일 오후 3시');
    const box = document.getElementById('script');
    const t = (box.innerText || '').replace(/\s+/g, ' ');
    const 마디글 = [...box.querySelectorAll('.st .me')].map(e => e.textContent).join(' ');
    return { 글: t, 칸: box.querySelectorAll('.st').length + box.querySelectorAll('.br').length,
             물음: (마디글.match(/\?/g) || []).length,
             차례: ['여는 말', '이득', '할 일', '양자택일', '못 정하실 때'].map(x => t.indexOf(x)),
             단추: !!document.getElementById('copyScript'), 화제: TA_APP.state.view };
  });
  is(V.화제 === 'trend', '  메뉴 주소(#sayPanel)로 열면 <b>화제 대본</b>이 선다');
  is(V.칸 >= 7, '  칸이 <b>다섯 마디 + 거절 둘</b>이다 — ' + V.칸 + '개');
  is(V.차례.every((n, i) => n >= 0 && (i === 0 || n > V.차례[i - 1])),
     '  ★ 다섯 마디가 <b>차례대로</b> 선다 — ' + JSON.stringify(V.차례));
  is(/홍길동님/.test(V.글) && /홍길순입니다/.test(V.글),
     '  ★ <b>고객 이름과 내 이름이 따로</b> 채워진다 (한 자가 채웁니다 · 5번)');
  is(/목요일 오전 10시와 토요일 오후 3시/.test(V.글),
     '  ★ 두 자리가 <b>와/과까지 맞게</b> 들어간다 — ' + ((V.글.match(/목요일[^,]*,/) || [''])[0]));
  is(V.물음 === 0, '  ★★ 다섯 마디에 물음표가 <b>없다</b> — ' + V.물음 + '개');
  is(V.단추, '  <b>멘트 복사</b> 단추가 있다');
  const W = await p.evaluate(() => {
    const i = document.getElementById('i_s1'); i.value = '내일 오전';
    i.dispatchEvent(new Event('input', { bubbles: true }));
    return ((document.getElementById('script').innerText || '').match(/내일 오전[와과]/) || [''])[0];
  });
  is(W === '내일 오전과', '  ★ 받침이 있으면 <b>과</b>로 읽힌다 — ' + W);

  console.log('\n[9] 🧭 메뉴로 열리고 <b>같은 파일</b>을 띄운다 (5번)');
  const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is(/\{id:'ta_say',/.test(IDX), '  ★ 메뉴에 <b>🎙 TA 전체 대본</b> 줄이 있다');
  is(/tab==='ta_say'\)dyn\.innerHTML=renderTaSayPage\(\)/.test(IDX), '  그 줄이 <b>화면으로 이어진다</b>');
  /* ⚠ 닫는 따옴표까지 붙여 찾다가 울렸습니다 — 그 자리는 <b>"</b> 로 닫습니다.
     글자를 너무 똑같이 찾으면 맞는데도 빨간불이 켜집니다 (8번).            */
  is((IDX.match(/var TASC_URL\s*=/g) || []).length === 1 && /TASC_URL\+'#sayPanel/.test(IDX),
     '  ★★ 주소가 <b>한 곳(TASC_URL)</b>에서 오고 대본 칸으로 내려간다 — 글이 두 벌이 아닙니다');
  is(!/say:\s*\{/.test(IDX),
     '  ★★ 본체에 <b>대본을 옮겨 적지 않았다</b> — 글은 ta-trend.js 한 곳입니다');

  console.log('\n[10] 🌐 서버를 안 부른다 (7번) · 안 터진다');
  is(hits === hits0, '  밖으로 <b>' + (hits - hits0) + '번</b>');
  is(errs.length === 0, '  터진 것이 없다 — ' + JSON.stringify(errs.slice(0, 3)));

  await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '가지가 어긋납니다')
                  : '\n✓ 대본이 지어내지 않고, 되묻지 않고, 두 자리로 약속합니다');
  process.exit(bad ? 1 : 0);
})();
