/* 💬 보낼 말 모음 — 상황마다 보낼 글이 <b>한자리에</b> 있나 · 두 벌이 아닌가 — 판 X275

   사장님 말씀 (2026-10-31) — 「고객에게 <b>상황별로</b> 연락드릴 수 있도록 대본을
   깔끔히 만든 것들을 보고 싶어」. 보여 드리고 아쉬운 자리 둘을 말씀드리니
   「<b>둘다해줘</b>」 라고 하셨습니다.

   ── 아쉬웠던 자리 둘 ────────────────────────────────────────────────
   ① <b>한자리에 모여 있지 않았습니다.</b> 고객 한 분을 열어야 그 단계 것만
      보였고, 전체를 훑어보고 고르는 자리가 없었습니다.
   ② <b>부재·거절 쪽 글이 한 줄도 없었습니다.</b> 표에는 TA·AP·PC·CS 넷뿐이라
      (문자·카톡 36가지), 설계사가 하루에 제일 많이 만나는 자리인 부재와
      거절에는 <b>전화 말머리만</b> 있었습니다.

   여기서 잽니다 —
     [1] 표에 <b>아홉 묶음</b>이 다 있나 — 미접촉·부재·거절·기고객·입원이 늘었나
     [2] 글이 <b>지켜야 할 것</b>을 지키나 — 숫자·단정·실명 (1번·2번·3번)
     [3] 💬 보낼 말 모음 화면이 서나 · 묶음 칩·찾기·📋 복사가 되나
     [4] ★ 「전체」 가 <b>접혀서</b> 한눈에 들어오나 — 38화면짜리를 안 세우나
     [5] 묶음을 고르거나 찾으면 <b>그 안은 펴지나</b>
     [6] ★★ 화면이 대본을 <b>제 손으로 다시 적지 않았나</b> (5번) — 표 하나에서 읽나
     [7] 홈에서 그 상황의 글로 <b>가는 길</b>이 있나 · 글이 없는 상황엔 단추를 안 세우나

   ★ 글은 <b>파일에 들어 있습니다</b> — 서버를 한 번도 안 부릅니다 (7번).
   ★ 본보기에 고객 실명이 없어야 합니다 — 「고객님」 으로만 적힙니다 (3번).      */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8947;

/* 들어간 척하는 씨는 <b>check-hmroute 의 것을 그 파일에서 읽어</b> 씁니다 —
   두 벌 두지 않습니다 (5번). 견본 이름은 홍길동 집안입니다 (3번).
   ⚠ 처음에 씨 없이 go('saybook') 을 불렀더니 <b>화면이 아예 안 섰습니다</b> —
     들어가기 전 화면이 덮고 있었습니다. 자가 틀렸던 자리입니다 (8번). */
const HMR = fs.readFileSync(path.join(ROOT, 'scripts', 'check-hmroute.js'), 'utf8');
const SEEDF = new Function('opt', 'return `' +
  HMR.slice(HMR.indexOf('const SEED=(opt)=>`') + 'const SEED=(opt)=>`'.length,
            HMR.indexOf('`;\n\n(async()=>{')) + '`');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* ── 글로 보는 자리 — 브라우저 없이 ─────────────────────────────── */
const STG = fs.readFileSync(path.join(ROOT, 'apex-stage.js'), 'utf8');
const APP = fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8');
global.window = {};
require(path.join(ROOT, 'apex-stage.js'));
const S = global.window.APEX_STAGE;

head('[1] 표에 <b>아홉 묶음</b>이 다 있다 — 다섯이 늘었다');
const 묶음 = Object.keys(S.touch || {});
const 새것 = ['미접촉', '부재', '거절', '기고객', '입원'];
is(묶음.length >= 9, '  묶음 ' + 묶음.length + '개 — ' + 묶음.join(' · '));
새것.forEach(k => is((S.touchOf(k) || []).length > 0,
  '  <b>' + k + '</b> 에 상황이 ' + (S.touchOf(k) || []).length + '가지 있다'));
let 글수 = 0, 상황수 = 0;
묶음.forEach(k => (S.touch[k] || []).forEach(t => { 상황수++; 글수 += (t.msg || []).length }));
is(글수 >= 54, '  문자·카톡 <b>' + 글수 + '가지</b> · 상황 ' + 상황수 + '가지 (손대기 전 36가지 · 12상황)');

head('[2] 글이 <b>지켜야 할 것</b>을 지킨다');
const 모든글 = [];
묶음.forEach(k => (S.touch[k] || []).forEach(t => (t.msg || []).forEach(m => 모든글.push({ g: k, t: m.t, x: m.text }))));
/* 2번 — 한도·나이·개월 수 같은 시행령 숫자를 적지 않는다 */
const 숫자 = 모든글.filter(m => /\d+\s*(만원|년|개월|세|%|퍼센트)/.test(m.x));
is(숫자.length === 0, '  시행령 숫자(만원·년·개월·세·%)가 <b>한 곳도 없다</b> (2번)' +
   (숫자.length ? ' ⚠ ' + 숫자.slice(0, 3).map(m => m.g + '/' + m.t).join(' · ') : ''));
/* 2번 — 단정하지 않는다 */
const 단정 = 모든글.filter(m => /비과세입니다|무조건 (나옵니다|됩니다)|전액 보장/.test(m.x));
is(단정.length === 0, '  「비과세입니다」·「무조건」·「전액 보장」 같은 <b>단정이 없다</b> (2번)' +
   (단정.length ? ' ⚠ ' + 단정.map(m => m.g + '/' + m.t).join(' · ') : ''));
/* 3번 — 실명이 없다. 본보기는 「고객님」 으로만 */
/* ⚠⚠ 처음에 금지된 이름을 <b>글자 그대로</b> 적어 두었다가 check-fakename 에
   스스로 걸렸습니다 — 규약 밖 이름은 자 안에도 적으면 안 됩니다 (3번).
   이름 목록을 들지 않고 <b>「○○님」 꼴</b>을 거둬 「고객님」 뿐인지 봅니다 —
   이름 목록을 들면 새로 지어낸 이름은 어차피 못 잡습니다. */
/* ⚠ <b>이름이 아닌 호칭</b>은 뺍니다 — 처음에 「부모님」 을 실명이라고
   고발했습니다. 헛것을 잡는 자는 안 잡는 자보다 나쁩니다 (8번). */
const 호칭OK = ['고객님', '부모님', '어머님', '아버님', '사모님', '선생님', '기사님', '담당자님', '가족분'];
const 님 = [];
모든글.forEach(m => (m.x.match(/[가-힣]{2,4}님/g) || []).forEach(h => 님.push({ g: m.g, t: m.t, h: h })));
const 남의이름 = 님.filter(x => 호칭OK.indexOf(x.h) < 0);
is(남의이름.length === 0,
   '  본보기의 호칭이 <b>「고객님」 뿐</b>이다 — 실명이 한 곳도 없습니다 (3번)' +
   (남의이름.length ? ' ⚠ ' + 남의이름.slice(0, 3).map(x => x.g + '/' + x.h).join(' · ') : '') +
   ' (「○○님」 ' + 님.length + '곳)');
is(모든글.every(m => !/\d{6}\s*-\s*\d{7}/.test(m.x)), '  주민등록번호 꼴이 없다 (3번)');
/* 보장을 말하면 「심사 결과에 따릅니다」 */
const 보장말 = 모든글.filter(m => /보장(이|을)? ?(되|받)/.test(m.x) || /보장 여부/.test(m.x));
is(보장말.every(m => /심사 결과에 따릅니다/.test(m.x)),
   '  보장을 말하는 글 ' + 보장말.length + '개에 <b>「심사 결과에 따릅니다」</b> 가 붙어 있다 (2번)');
/* 거절에는 「더 연락드리지 않겠습니다」 길이 있다 */
const 거절글 = (S.touchOf('거절') || []).map(t => (t.msg || []).map(m => m.text).join('\n')).join('\n');
is(/더 연락드리지 않겠습니다|더는 보내지 않겠습니다|정리하고 더 연락드리지 않겠습니다/.test(거절글),
   '  거절 글에 <b>「더 연락드리지 않겠습니다」 길</b>이 있다 — 붙잡는 글은 다음이 없습니다');
/* 입원 글에는 파는 말이 없다 */
const 입원글 = (S.touchOf('입원') || [])[0];
is(입원글 && (입원글.msg || []).every(m => !/가입|상품|보험료/.test(m.text)),
   '  <b>입원 중 안부 글</b>에는 파는 말이 한 줄도 없다');

/* ══ 🛡 판 X279 — 무사고 할인 안내 ═══════════════════════════════════════
   사장님 말씀 (2026-10-31) — 「ta 스크립트에 무사고 스크립트 있는데 그런 내용으로
   안내 연락 드리고 찾아뵙도록 하는 것도 추가해 줘」.
   ★ 말은 `app/silson5.html` 에서만 가져옵니다 (5번). 그 화면이 「말하면 안 된다」 고
     적어 둔 넷을 <b>여기서 잽니다</b> — 안 울리는 알람은 알람이 아닙니다 (8번). */
head('[8] 🛡 <b>무사고 할인</b> — silson5 가 정한 선을 지킨다');
const 무 = S.touchOf('무사고') || [];
is(무.length >= 2, '  무사고 묶음에 상황이 ' + 무.length + '가지 있다 — ' + 무.map(x => x.t).join(' · '));
/* 입으로 나가는 모든 칸 (「하지 말 것」 칸은 뺍니다 — 거기엔 금지된 말이 적혀 있어야 합니다) */
const 무말 = [];
무.forEach(x => {
  (x.msg || []).forEach((m, i) => 무말.push([x.k + ' 글' + (i + 1), m.text]));
  (x.call || []).forEach(c => 무말.push([x.k + ' 대본 ' + c.t, c.say]));
  (x.reply || []).forEach((r, i) => 무말.push([x.k + ' 돌아오는 말' + (i + 1), r.a]));
});
const 무글 = 무.reduce((a, x) => a.concat((x.msg || []).map(m => m.text)), []).join('\n');
const 무피 = 무.map(x => x.avoid || '').join('\n');

/* ① 할인을 주는 곳은 <b>보험회사</b>입니다 — 금감원은 2026-10-05 에 개선을 발표했을 뿐 */
const 감 = 무말.filter(([, t]) => /금융감독원|금감원/.test(t));
is(감.length === 0, '  ① 입으로 나가는 말에 <b>금감원</b> 이 없다 — 할인을 주는 곳은 보험회사입니다' +
   (감.length ? ' ⚠ ' + 감.map(x => x[0]).join(' · ') : ''));
is(/보험회사가 보험료를 깎/.test(무글), '  ① 글에 <b>보험회사가</b> 깎아 준다고 적혀 있다');
is(/금융감독원/.test(무피), '  ① 「하지 말 것」 칸에 <b>금감원이라 하지 말라</b>고 적혀 있다');

/* ② 고객님이 보험사에 <b>직접</b> 신청하실 수도 있습니다 — 「저만」 이라 하지 않습니다 (1번) */
const 저만 = 무말.filter(([, t]) => /저만|제가 아니면|저를 통해서만|저밖에/.test(t));
is(저만.length === 0, '  ② 「저만 해 드릴 수 있다」 는 말이 없다 (1번)' +
   (저만.length ? ' ⚠ ' + 저만.map(x => x[0]).join(' · ') : ''));
is(/보험사에 직접 하셔도 됩니다|직접 신청하/.test(무글), '  ② 글에 <b>직접 신청하셔도 된다</b>고 적혀 있다');

/* ③ 할인은 <b>신청한 뒤부터</b>이고 지난 기간은 <b>소급되지 않습니다</b> */
is(/소급되지 않습니다/.test(무글) && /신청하신 뒤부터/.test(무글),
   '  ③ 글에 <b>신청한 뒤부터 · 소급 안 됨</b> 이 적혀 있다 — 늦은 만큼은 그냥 내시게 됩니다');

/* ④ 할인율 숫자를 적지 않습니다 (2번) — 무사고 기간·상품마다 다릅니다 */
const 율 = 무말.filter(([, t]) => /\d+[\d.,]*\s*(%|퍼센트|할)/.test(t));
is(율.length === 0, '  ④ <b>할인율 숫자가 한 곳도 없다</b> (2번)' +
   (율.length ? ' ⚠ ' + 율.map(x => x[0]).join(' · ') : ''));
is(/무사고 기간과 상품마다 다릅니다/.test(무글),
   '  ④ 글에 <b>상품마다 다르다</b>고 적혀 있다 — 숫자는 보험사 확인 뒤에');

/* 주민등록번호 — 전화로 안 여쭙는다고 글에 적혀 있다 (3번) */
is(/주민등록번호는 여쭙지 않습니다/.test(무글), '  주민등록번호를 <b>안 여쭙는다</b>고 글에 적혀 있다 (3번)');

/* ★ 아직 약속이 없는 자리 — 약속 확정 안내 글이 붙으면 안 됩니다 */
is((S.apptOf('무사고') || []).length === 0,
   '  ★ <b>약속 안내 글이 안 붙는다</b> — 안 뵙기로 한 분께 「그날 뵙겠습니다」 가 가면 안 됩니다');

/* ★ 광고성이라고 <b>스스로 밝힌다</b> (1번) — 이 묶음만 */
is(무.every(x => x.ad === true), '  ★ 무사고 상황마다 <b>ad</b> 가 달려 있다 — 광고성으로 볼 수 있는 글입니다');
const 딴ad = 묶음.filter(k => k !== '무사고' && (S.touch[k] || []).some(x => x.ad));
is(딴ad.length === 0, '  ★ 다른 묶음에는 ad 가 <b>안</b> 달려 있다 — 안내 글에 광고 딱지를 잘못 붙이지 않습니다 (8번)' +
   (딴ad.length ? ' ⚠ ' + 딴ad.join(' · ') : ''));

/* ★ 출처가 살아 있나 — silson5 가 그 넷을 아직 그렇게 적고 있나 (5번).
   그 화면을 고치면 여기도 같이 봐야 한다는 것을 <b>빨간불로</b> 알려 줍니다. */
const S5 = fs.readFileSync(path.join(ROOT, 'app', 'silson5.html'), 'utf8');
is(/할인을 주는 곳은 <b>보험회사<\/b>/.test(S5) && /소급되지 않습니다/.test(S5) &&
   /「저만 해 드릴 수 있다」 고 하지 않습니다/.test(S5),
   '  ★ 출처(<b>app/silson5.html</b>)가 그 넷을 아직 그렇게 적고 있다 — 고치면 이 글도 같이 봐야 합니다');

head('[6] ★★ 화면이 대본을 <b>제 손으로 다시 적지 않았다</b> (5번)');
const 화면 = APP.slice(APP.indexOf('function sbkRows('), APP.indexOf('function renderTaScriptPage('));
is(화면.length > 1000, '  💬 보낼 말 모음 코드를 찾았다 (' + 화면.length + '자)');
is(/APEX_STAGE\.touch/.test(화면) && /APEX_STAGE\.appt/.test(화면),
   '  <b>apex-stage 의 표</b>(touch · appt)를 읽어 세운다');
is(!/고객님, 안녕하세요/.test(화면),
   '  ★ 화면 안에 <b>본보기 글을 베껴 두지 않았다</b> — 베끼면 한쪽만 늙습니다');
is(/function sbkCopy\(/.test(화면) && /copyText\(/.test(화면),
   '  복사는 <b>이미 있는 copyText</b> 를 부른다 — 여기서 새로 안 짭니다 (5번)');
is(!/fetch\(|supabase|sb\.from/.test(화면), '  <b>서버를 한 번도 안 부른다</b> — 글은 파일에 있습니다 (7번)');
is(/function sbkHas\(/.test(APP) && /sbkHas\(k\)/.test(APP),
   '  [7] 홈 단추는 <b>글이 있을 때만</b> 선다 — 눌러도 빈 화면이 안 뜹니다 (6번)');
is(/function sbkGo\(/.test(APP), '  [7] 홈에서 <b>그 상황으로 열어</b> 줍니다 — 열고 또 찾게 하지 않습니다');

/* ── 띄워서 보는 자리 ───────────────────────────────────────────── */
const srv = http.createServer((rq, rs) => {
  let f = path.join(ROOT, decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]));
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 390, height: 900 } });
  /* ★ <b>바깥을 막습니다</b> — 점검이 사장님 진짜 서버를 읽지 않습니다.
     이 화면은 서버를 안 부르지만, 본체가 뜨면서 부르는 것이 있습니다.    */
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.startsWith('http://127.0.0.1:' + PORT)) return r.continue();
    if (/^https?:/.test(u)) return r.abort();
    return r.continue();
  });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(2200);

  head('[3] 화면이 선다 — 묶음 칩 · 찾기 · 📋 복사');
  const A = await pg.evaluate(async (seed) => {
    (0, eval)(seed);
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    go('saybook');
    await new Promise(r => setTimeout(r, 400));
    const T = s => (s || '').replace(/\s+/g, ' ').trim();
    const p = document.querySelector('.tab-pane.on') || document.getElementById('dynPane');
    const 작 = [...p.querySelectorAll('button,.btn,input,select')]
      .filter(e => { const q = e.getBoundingClientRect(); return q.width > 0 && q.height > 0 && q.height < 44 });
    return { 머리: T((p.querySelector('.sbk-head h2') || {}).innerText),
             묶음: [...p.querySelectorAll('.sbk-g')].map(x => T(x.innerText)),
             상황: p.querySelectorAll('.sbk-sit').length,
             편글: p.querySelectorAll('.sbk-tx').length,
             쪽키: Math.round(p.scrollHeight), 창: window.innerHeight,
             옆: Math.round(document.documentElement.scrollWidth - window.innerWidth),
             작은: 작.map(e => T(e.innerText || e.value).slice(0, 14) + ' ' + Math.round(e.getBoundingClientRect().height)),
             찾기칸: !!document.getElementById('sbkQ') };
  }, SEEDF({}));
  is(/보낼 말 모음/.test(A.머리), '  머리글 — 「' + A.머리 + '」');
  is(A.묶음.length >= 11, '  묶음 칩 ' + A.묶음.length + '개 — ' + A.묶음.join(' / '));
  is(A.상황 >= 20, '  상황 칸 <b>' + A.상황 + '개</b>가 선다');
  is(A.찾기칸, '  찾는 칸이 있다');
  is(A.작은.length === 0, '  44px 아래 누를 곳 ' + A.작은.length + '곳' + (A.작은.length ? ' ⚠ ' + A.작은.join(' / ') : ''));
  is(A.옆 <= 1, '  가로로 안 넘친다 — ' + A.옆 + 'px');

  head('[4] ★ 「전체」 는 <b>접혀서</b> 한눈에 — 38화면짜리를 안 세운다');
  is(A.편글 === 0, '  전체일 때는 글이 <b>접혀 있다</b> — 펴진 글 ' + A.편글 + '개');
  is(A.쪽키 <= 6000, '  쪽 길이 <b>' + A.쪽키 + 'px</b> (' + (A.쪽키 / A.창).toFixed(1) +
     '화면) — 다 펴면 31,907px(38화면)이었습니다');

  head('[5] 묶음을 고르거나 찾으면 <b>그 안은 펴진다</b>');
  const B = await pg.evaluate(async () => {
    const T = s => (s || '').replace(/\s+/g, ' ').trim();
    sbkPick('거절'); await new Promise(r => setTimeout(r, 250));
    const 거절 = { 글: document.querySelectorAll('.sbk-tx').length,
                   딱지: [...new Set([...document.querySelectorAll('.sbk-tag')].map(x => T(x.innerText)))] };
    sbkPick('거절'); sbkType('청구'); await new Promise(r => setTimeout(r, 250));
    const 찾음 = document.querySelectorAll('.sbk-tx').length;
    sbkType('없는글자zzz'); await new Promise(r => setTimeout(r, 250));
    const 빈손 = T((document.querySelector('.sbk-no') || {}).innerText);
    sbkType('');
    await new Promise(r => setTimeout(r, 250));
    /* 손으로 펴는 것이 이긴다 */
    const h = document.querySelector('.sbk-sh');
    const 전 = document.querySelectorAll('.sbk-tx').length;
    h.click(); await new Promise(r => setTimeout(r, 250));
    const 후 = document.querySelectorAll('.sbk-tx').length;
    return { 거절, 찾음, 빈손, 전, 후 };
  });
  is(B.거절.글 >= 3 && B.거절.딱지.length === 1 && B.거절.딱지[0] === '거절',
     '  묶음 「거절」 을 고르니 <b>' + B.거절.글 + '개가 펴진다</b> — 딱지 ' + B.거절.딱지.join(','));
  is(B.찾음 >= 1, '  「청구」 로 찾으니 <b>' + B.찾음 + '개가 펴진다</b>');
  is(/찾으시는 글이 없습니다/.test(B.빈손), '  없으면 <b>없다고 말한다</b> — 「' + B.빈손.slice(0, 30) + '」 (1번)');
  is(B.전 === 0 && B.후 >= 1, '  머리글을 누르면 <b>그 상황이 펴진다</b> — ' + B.전 + ' → ' + B.후 + '개');
  is(!errs.length, '  조용히 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));
  const 실명화면 = await pg.evaluate(ok =>
    (document.body.innerText.match(/[가-힣]{2,4}님/g) || []).filter(h => ok.indexOf(h) < 0), 호칭OK);
  is(실명화면.length === 0, '  화면의 호칭에 <b>사람 이름이 없다</b> (3번)' +
     (실명화면.length ? ' ⚠ ' + [...new Set(실명화면)].slice(0, 3).join(' · ') : ''));


  head('[9] 🛡 무사고 묶음이 서고 — <b>광고성 알림은 접혀 있어도 보인다</b>');
  const C = await pg.evaluate(async () => {
    const T = s => (s || '').replace(/\s+/g, ' ').trim();
    sbkType(''); sbkPick('무사고'); await new Promise(r => setTimeout(r, 250));
    const 폄 = { 상황: document.querySelectorAll('.sbk-sit').length,
                 글: document.querySelectorAll('.sbk-tx').length,
                 알림: [...document.querySelectorAll('.sbk-ad')].map(x => T(x.innerText)) };
    /* ★ 다시 「전체」 로 — 묶음이 <b>접힌</b> 채로도 알림이 떠 있나 (6번) */
    sbkPick('무사고'); await new Promise(r => setTimeout(r, 250));
    const V = e => { const q = e.getBoundingClientRect(); return q.width > 0 && q.height > 0 };
    const 접 = { 편글: document.querySelectorAll('.sbk-tx').length,
                 알림: [...document.querySelectorAll('.sbk-ad')].filter(V).length,
                 딴곳: 0 };
    /* 다른 묶음에는 알림이 안 붙어야 합니다 — 헛것을 잡지 않습니다 (8번) */
    [...document.querySelectorAll('.sbk-sit')].forEach(s => {
      const g = T((s.querySelector('.sbk-tag') || {}).innerText);
      if (g !== '무사고' && s.querySelector('.sbk-ad')) 접.딴곳++;
    });
    sbkPick('');
    return { 폄, 접 };
  });
  is(C.폄.상황 === 2 && C.폄.글 === 5,
     '  묶음 「무사고」 — 상황 <b>' + C.폄.상황 + '가지</b> · 글 <b>' + C.폄.글 + '가지</b>가 선다');
  is(C.폄.알림.length === 2 && C.폄.알림.every(t => /광고성으로 볼 수 있는 글/.test(t) && /동의 네 갈래/.test(t)),
     '  📣 상황마다 <b>광고성 알림</b>이 뜬다 — 「' + (C.폄.알림[0] || '').slice(0, 34) + '…」');
  is(C.접.편글 === 0 && C.접.알림 === 2,
     '  ★ 접으면 글은 숨지만 <b>알림은 ' + C.접.알림 + '개 그대로 보인다</b> — 접어서 숨으면 안 됩니다 (6번)');
  is(C.접.딴곳 === 0, '  다른 묶음에는 알림이 <b>안</b> 붙는다 — ' + C.접.딴곳 + '곳');

  await ctx.close(); await br.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ 빨간불 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 상황마다 보낼 글이 한자리에 있고, 대본은 표 하나에서 옵니다.');
})();
