/* 📒 TA → CS <b>상황별 터치</b> — 무엇을 보고 · 어떻게 닿고 · 무슨 글을 보내고 · 무엇을 말하나 — 판 X180

   사장님 말씀 (2026-10-24) — 「ta-cs 까지 어떤 상황과 어떻게 터치해야할지 그리고 문자/카톡 내용도
   예시표를 2~3개 만들어서 디테일하게 터치하고 전화까지 할수있도록 · dB통합CRM 에 있는 고객 상황과
   안겹치고 똑같은 화면을 띄우도록」.

   글은 apex-stage.js 의 TOUCH <b>한 곳</b> · 그리는 것은 apex-cusone.js 의 cusTouchHtml <b>한 벌</b>.
   고객 창(연락 탭 · cmSayHtml)과 DB 통합 CRM(「무엇을 할까」 · sgAskHtml)이 그것을 부릅니다.

   여기서 잽니다 —
     [1] 표의 모양 — TA·AP·PC·CS 넷 × 상황 셋 · 상황마다 글 2~3 · 전화 대본(여는 말·물을 것·끝맺음) ·
         하지 말 것 · 다음
     [2] ★ 지어내지 않는다 (1번·2번) — 글·대본에 <b>금액·%·세금·한도·나이·개월</b> 숫자가 없다 ·
         「무조건 · 확정 · 다 나옵니다 · 손해 안」 같은 단정이 없다(「하지 말 것」 칸만 예외 — 그것을 하지
         말라고 적는 칸입니다) · 보험료를 말하는 글은 「심사 결과에 따라」 를 붙인다 ·
         지금 드신 보험을 <b>깨라고</b> 권하는 말이 없다 · 이름이 없다(「고객님」 · 3번)
     [3] 그리는 판 — 글이 <b>보이는 그대로</b> 선다 · {나} 가 남지 않는다 · 번호가 있을 때만 문자·전화 단추 ·
         표에 없는 단계는 <b>아무것도</b> 안 세운다 · TA 첫 마디는 어디서 오신 분인가로 갈린다
     [4] 한 곳 — 글이 app/index.html · db-crm.html 에 <b>베껴져 있지 않다</b> · 두 화면이 같은 함수를 부른다 ·
         같은 판(?v=)을 싣는다
     [5] ★★ 진짜 두 화면 — 같은 단계·같은 종류·같은 번호면 고객 창과 CRM 의 글이 <b>한 글자도 안 다르다</b>
     [6] 고객 창 연락 탭에 서고 · 예전 「💬 보낼 말」 이 <b>또 서지 않는다</b>(한 화면에 한 번)

   ★ 견본 서버는 check-rtteam 의 STUB 을 <b>그 파일에서 읽어</b> 씁니다 — 두 벌 두지 않습니다 (5번).
   ★ 바깥은 끊습니다. 견본 이름은 홍길동 집안입니다 (3번). */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const body = (src, head) => { const i = src.indexOf(head); if (i < 0) return ''; const j = src.indexOf('\n}', i); return src.slice(i, j + 2); };

global.window = global;
require(path.join(ROOT, 'apex-stage.js'));
require(path.join(ROOT, 'app/apex-cusone.js'));
const S = global.APEX_STAGE;
const STAGES = ['TA', 'AP', 'PC', 'CS'];

(async () => {
  const APP = fs.readFileSync('app/index.html', 'utf8');
  const CRM = fs.readFileSync('db-crm.html', 'utf8');

  console.log('\n[1] 표의 모양 — 넷 × 셋');
  is(typeof S.touchOf === 'function' && S.touch, '  APEX_STAGE.touchOf · touch 가 밖에서 보인다');
  const all = [];
  STAGES.forEach(st => {
    const L = S.touchOf(st);
    is(L.length === 3, '  ' + st + ' — 상황 ' + L.length + '가지 (' + L.map(x => x.t).join(' · ') + ')');
    L.forEach(x => {
      all.push(Object.assign({ st: st }, x));
      const ok = x.k && x.t && x.ch && x.when && x.how && x.avoid && x.next &&
                 x.call && x.call.open && x.call.ask && x.call.close &&
                 Array.isArray(x.msg) && x.msg.length >= 2 && x.msg.length <= 3 &&
                 x.msg.every(m => (m.ch === '문자' || m.ch === '카톡') && m.t && m.text && m.text.length >= 30);
      is(ok, '    ' + x.k + ' — 글 ' + (x.msg || []).length + '가지 · 대본 셋 · 하지 말 것 · 다음');
    });
  });
  const ks = all.map(x => x.k);
  is(new Set(ks).size === ks.length, '  상황 이름표(k)가 겹치지 않는다 — ' + ks.length + '개');
  is(S.touchOf('미접촉').length === 0 && S.touchOf('').length === 0 && S.touchOf(null).length === 0,
     '  표에 없는 단계는 <b>빈 배열</b> — 지어내지 않는다 (1번)');
  const c1 = S.touchOf('TA'); c1.pop();
  is(S.touchOf('TA').length === 3, '  받아 간 쪽이 고쳐도 표는 안 바뀐다 (복사본을 준다)');

  console.log('\n[2] ★ 지어내지 않는다 — 숫자 · 단정 · 깨라는 말 · 이름');
  const said = [];   /* [이름표, 글] — 「하지 말 것」 칸은 뺍니다 */
  all.forEach(x => {
    x.msg.forEach((m, i) => said.push([x.k + ' 글' + (i + 1), m.text, 'msg']));
    ['open', 'ask', 'close'].forEach(k => said.push([x.k + ' 대본 ' + k, x.call[k], 'call']));
    said.push([x.k + ' 이럴 때', x.when, 'how'], [x.k + ' 이렇게', x.how, 'how'], [x.k + ' 다음', x.next, 'how']);
  });
  /* 금액·비율·세금·한도·나이·개월 — 「2~3분 · 10분 · 15분」 처럼 <b>걸리는 시간</b>(분)만 됩니다 */
  const NUM = /\d[\d,.~]*\s*(원|만|억|%|퍼센트|세\b|살|개월|년|회차|배)/;
  const numHit = said.filter(([, t]) => NUM.test(t.replace(/<[^>]*>/g, '')));
  is(!numHit.length, '  금액·%·나이·개월 숫자 0곳' + (numHit.length ? ' — ' + numHit.map(x => x[0] + '「' + x[1].match(NUM)[0] + '」').join(' · ') : ''));
  const TAX = /비과세|세액공제|소득공제|절세|면세|한도/;
  const taxHit = said.filter(([, t]) => TAX.test(t));
  is(!taxHit.length, '  세금·한도 말 0곳 (2번 — 요건만 · 판단은 세무 전문가)' + (taxHit.length ? ' — ' + taxHit.map(x => x[0]).join(' · ') : ''));
  const SURE = /무조건|확정입니다|확정됩니다|다 나옵니다|손해 안|100\s*%|보장해 드립니다|틀림없/;
  const sureHit = said.filter(([, t]) => SURE.test(t));
  is(!sureHit.length, '  단정하는 말 0곳 (「하지 말 것」 칸 밖)' + (sureHit.length ? ' — ' + sureHit.map(x => x[0] + '「' + x[1].match(SURE)[0] + '」').join(' · ') : ''));
  const premNo = said.filter(([, t, w]) => w === 'msg' && /보험료/.test(t) && !/심사 결과에 따라/.test(t));
  is(!premNo.length, '  보험료를 말하는 글은 「심사 결과에 따라」 를 붙인다' + (premNo.length ? ' — ' + premNo.map(x => x[0]).join(' · ') : ''));
  const BREAK = /해지하(시|세)|해지해 (드|주)|갈아타(시|세)|깨(시|세)고|정리하시고 새로/;
  const brHit = said.filter(([, t]) => BREAK.test(t));
  is(!brHit.length, '  지금 드신 보험을 <b>깨라고</b> 권하는 말 0곳' + (brHit.length ? ' — ' + brHit.map(x => x[0]).join(' · ') : ''));
  is(all.filter(x => x.st === 'PC').some(x => /그대로 두/.test(x.how + x.msg.map(m => m.text).join(''))),
     '  PC 의 「지금 보험 걱정」 은 <b>그대로 두고 견주기만</b> 한다고 적혀 있다');
  const NAME = /홍길동|홍길순|김○○|[가-힣]○○/;
  const nmHit = said.filter(([, t]) => NAME.test(t));
  is(!nmHit.length, '  이름 0곳 — 「고객님」 으로 나간다 (3번)' + (nmHit.length ? ' — ' + nmHit.map(x => x[0]).join(' · ') : ''));
  is(all.every(x => x.msg.every(m => /고객님/.test(m.text))), '  글마다 「고객님」 으로 부른다');
  const AD = /이벤트|혜택|사은품|할인|특가|가입하세요|가입하시면/;
  const adHit = said.filter(([, t, w]) => w === 'msg' && AD.test(t));
  is(!adHit.length, '  광고성 말 0곳 — 약속·안내 글(정보성)만 · 광고는 수신 동의가 있어야 합니다' + (adHit.length ? ' — ' + adHit.map(x => x[0]).join(' · ') : ''));
  const cs = all.filter(x => x.k === 'cs-prep')[0];
  is(cs && /있는 그대로/.test(cs.how + cs.msg.map(m => m.text).join('')), '  서명 전날 — 알릴 의무를 「있는 그대로」 라고 적는다');
  const csw = all.filter(x => x.k === 'cs-wait')[0];
  is(csw && /심사/.test(csw.how) && /단정/.test(csw.avoid), '  심사 기다리는 동안 — 결과를 단정하지 말라고 「하지 말 것」 에 적혀 있다');

  console.log('\n[3] 그리는 판 — cusTouchHtml');
  is(typeof global.cusTouchHtml === 'function', '  cusTouchHtml 이 밖에서 보인다');
  const T = h => h.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ');
  const cnt = (h, re) => (h.match(re) || []).length;
  STAGES.forEach(st => {
    const L = S.touchOf(st);
    const h1 = cusTouchHtml({ stage: st, phone: '010-1234-5678', me: '홍길동', key: 'c1' });
    const h0 = cusTouchHtml({ stage: st, phone: '', me: '' });
    const nSms = L.reduce((n, x) => n + x.msg.filter(m => m.ch === '문자').length, 0);
    const nMsg = L.reduce((n, x) => n + x.msg.length, 0);
    is(cnt(h1, /class="cus-tc-s"/g) === L.length && cnt(h1, /cus-tc-m"/g) === nMsg,
       '  ' + st + ' — 상황 ' + L.length + ' · 글 ' + nMsg + ' 이 다 선다');
    is(cnt(h1, /cusTouchSms\(this\)/g) === nSms && cnt(h1, /href="tel:01012345678"/g) === L.length,
       '    번호가 있으면 💬 문자로 열기 ' + nSms + '개(문자 글마다) · 📞 걸기 ' + L.length + '개(대본마다)');
    is(cnt(h0, /cusTouchSms\(this\)/g) === 0 && cnt(h0, /href="tel:/g) === 0 && /번호가 없어/.test(h0) && cnt(h0, /cusTouchCopy\(this\)/g) === nMsg + L.length,
       '    번호가 없으면 문자·걸기 단추 0개 · 「번호가 없어」 라고 말한다 · 복사는 그대로');
    is(!/\{나\}/.test(h1) && !/\{나\}/.test(h0) && /홍길동입니다/.test(T(h1)) && /담당 설계사입니다/.test(T(h0)),
       '    {나} 가 안 남는다 — 이름을 주면 그 이름 · 모르면 「담당 설계사」');
    const x0 = L[0], txt = T(h1);
    is(x0.msg.every(m => txt.indexOf(T(m.text.split('{나}').join('홍길동'))) >= 0),
       '    글이 <b>표 그대로</b> 선다 (고치거나 줄이지 않는다)');
  });
  is(cusTouchHtml({ stage: '미접촉' }) === '' && cusTouchHtml({ stage: '부재' }) === '' && cusTouchHtml({}) === '',
     '  표에 없는 단계는 빈 글 — 아무것도 안 세운다 (1번)');
  const hb = cusTouchHtml({ stage: 'TA', src: '보장분석3DB', me: '홍길동' });
  const hg = cusTouchHtml({ stage: 'TA', src: '', me: '홍길동' });
  const sayB = S.script('TA', '보장분석3DB').say;
  is(T(hb).indexOf(T(sayB)) >= 0 && /보장분석을 신청하신 분/.test(hb),
     '  TA 처음 거는 분 — 보장분석 DB 면 그 첫 마디(APEX_STAGE.script)가 여는 말이다');
  is(T(hg).indexOf(T(S.touchOf('TA')[0].call.open.split('{나}').join('홍길동'))) >= 0 && !/어디서 오신 분인가로 갈립니다/.test(hg),
     '  못 알아본 종류(일반)면 표의 기본 여는 말 — 누구인지 먼저 밝힌다');
  const hx = cusTouchHtml({ stage: 'AP', me: '<img src=x onerror=alert(1)>', phone: '"><b>' });
  is(!/<img/.test(hx) && /&lt;img/.test(hx) && /data-ph=""/.test(hx), '  받은 이름·번호를 그대로 끼우지 않는다 (이름은 글자로 씻고 · 번호는 숫자만)');

  console.log('\n[4] 한 곳 — 베끼지 않았다 (5번)');
  const probe = all.map(x => x.msg[0].text.split('\n')[1] || x.msg[0].text).filter(t => t.length > 12);
  const inApp = probe.filter(t => APP.indexOf(t) >= 0), inCrm = probe.filter(t => CRM.indexOf(t) >= 0);
  is(!inApp.length && !inCrm.length, '  표의 글이 app/index.html · db-crm.html 에 <b>0줄</b> 베껴져 있다 (' + probe.length + '줄 대 봄)');
  const say = body(APP, 'function cmSayHtml(');
  is(/cusTouchHtml\(/.test(say) && /touchOf/.test(say), '  고객 창 — cmSayHtml 이 cusTouchHtml 을 부른다');
  const ask = body(CRM, 'function sgAskHtml(');
  is(/cusTouchHtml\(/.test(ask), '  CRM — sgAskHtml(「무엇을 할까」) 가 cusTouchHtml 을 부른다');
  const va = (APP.match(/apex-cusone\.js\?v=(\d+)/) || [])[1], vc = (CRM.match(/apex-cusone\.js\?v=(\d+)/) || [])[1];
  is(va && va === vc, '  두 화면이 같은 판을 싣는다 — 앱 v=' + va + ' · CRM v=' + vc);
  is(!/function cusTouchHtml|function cusTouch/.test(APP + CRM), '  그리는 함수가 두 화면에 또 없다');

  console.log('\n[5] ★★ 진짜 두 화면 — 같은 고객이면 같은 글');
  const RT = fs.readFileSync('scripts/check-rtteam.js', 'utf8');
  const STUB = (RT.match(/const STUB = `([\s\S]*?)`;/) || [])[1] || '';
  const srv = http.createServer((q, s) => {
    let fp = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    try { if (fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html'); } catch (e) {}
    fs.readFile(fp, (e, b) => {
      if (e) { s.writeHead(404); s.end(''); }
      else { s.writeHead(200, { 'content-type': MIME[path.extname(fp)] || 'application/octet-stream' }); s.end(b); }
    });
  });
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch();
  const page = async (url, stub) => {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(String(e.message || e)));
    await ctx.route('**://**', async r => {
      const u = r.request().url();
      if (stub && /supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB });
      if (u.startsWith('http://localhost:' + P)) return r.continue();
      if (/^https?:/.test(u)) return r.abort();
      return r.continue();
    });
    await pg.goto('http://localhost:' + P + url, { waitUntil: 'domcontentloaded' });
    return { ctx, pg, errs };
  };
  const C = await page('/db-crm.html?mig=1&me=u1', true);
  await C.pg.waitForFunction(() => { try { return (eval('dbs') || []).length > 0 } catch (e) { return false } }, { timeout: 30000 });
  const A = await page('/app/index.html', false);
  await A.pg.waitForFunction(() => typeof window.cmSayHtml === 'function' && typeof window.cusTouchHtml === 'function', { timeout: 30000 });
  const CASES = [['TA', '보장분석3DB'], ['TA', '소개'], ['AP', '일반'], ['PC', '방송'], ['CS', '']];
  const PH = '010-1234-5678';
  for (const [st, src] of CASES) {
    const crm = await C.pg.evaluate(([st, src, PH]) => {
      const d = eval('dbs')[0];
      d.stage = st; d.source = src; d.phone = PH;
      try { eval('profile').name = '홍길동'; } catch (e) {}
      sgAsk(d.id);
      const r = document.querySelector('#askBody .cus-tc');
      return r ? { t: r.textContent.replace(/\s+/g, ' ').trim(), ks: [].map.call(r.querySelectorAll('.cus-tc-s'), e => e.getAttribute('data-k')).join(','),
                   sms: r.querySelectorAll('[onclick^="cusTouchSms"]').length, tel: r.querySelectorAll('a[href^="tel:"]').length,
                   open: document.getElementById('askModal').classList.contains('open') } : null;
    }, [st, src, PH]);
    const app = await A.pg.evaluate(([st, src, PH]) => {
      window.cmCliOf = () => ({ id: 'c1', stage: st });
      window.CUS = window.CUS || {}; CUS.db = { stage: st, source: src, phone: PH };
      try { OS.profile = OS.profile || {}; OS.profile.name = '홍길동'; } catch (e) {}
      const box = document.createElement('div'); box.innerHTML = cmSayHtml('c1');
      const r = box.querySelector('.cus-tc');
      return r ? { t: r.textContent.replace(/\s+/g, ' ').trim(), ks: [].map.call(r.querySelectorAll('.cus-tc-s'), e => e.getAttribute('data-k')).join(','),
                   sms: r.querySelectorAll('[onclick^="cusTouchSms"]').length, tel: r.querySelectorAll('a[href^="tel:"]').length,
                   old: !!box.querySelector('.t-script:not(.cus-tc-m):not(.cus-tc-call)') } : null;
    }, [st, src, PH]);
    is(!!crm && crm.open, '  CRM 「무엇을 할까」 — ' + st + (src ? ' · ' + src : '') + ' 에 터치 칸이 선다' + (crm ? ' (' + crm.ks + ')' : ''));
    is(!!app, '  고객 창 — ' + st + ' 에 터치 칸이 선다' + (app ? ' (' + app.ks + ')' : ''));
    is(!!crm && !!app && crm.t === app.t && crm.ks === app.ks && crm.sms === app.sms && crm.tel === app.tel,
       '    ★ 두 화면의 글이 <b>한 글자도 안 다르다</b> — ' + (crm ? crm.t.length : 0) + '자 · 문자 ' + (crm ? crm.sms : '-') + ' · 걸기 ' + (crm ? crm.tel : '-'));
    is(!!app && !app.old, '    고객 창에 예전 「💬 보낼 말」 상자가 <b>또 서지 않는다</b> — 한 화면에 한 번');
  }
  /* 표에 없는 단계는 두 화면 다 안 세운다 */
  const none = await C.pg.evaluate(() => { const d = eval('dbs')[0]; d.stage = '부재'; sgAsk(d.id); return !!document.querySelector('#askBody .cus-tc'); });
  is(!none, '  CRM — 부재(표 밖)에는 터치 칸이 안 선다');
  const old = await A.pg.evaluate(() => { CUS.db = { stage: '부재', source: '' }; window.cmCliOf = () => ({ id: 'c1', stage: '부재' });
    const b = document.createElement('div'); b.innerHTML = cmSayHtml('c1'); return { tc: !!b.querySelector('.cus-tc'), say: !!b.querySelector('.t-script') }; });
  is(!old.tc && old.say, '  고객 창 — 부재는 예전 「💬 보낼 말」 그대로 (지운 것이 없다)');

  console.log('\n[6] 문자를 열면 접촉 기록 한 줄 · 전화도');
  const mark = await A.pg.evaluate(() => {
    const got = []; window.ccMark = (id, how) => got.push(id + '|' + how);
    window.cmCliOf = () => ({ id: 'c1', stage: 'AP' }); CUS.db = { stage: 'AP', source: '', phone: '010-1234-5678' };
    const b = document.createElement('div'); b.innerHTML = cmSayHtml('c1'); document.body.appendChild(b);
    let href = '';
    const L = window.location;
    try { cusTouchTel(b.querySelector('a[href^="tel:"]')); } catch (e) {}
    const btn = b.querySelector('[onclick^="cusTouchSms"]');
    const t = (btn.closest('.t-script').querySelector('.cus-tc-tx') || {}).textContent || '';
    b.remove();
    return { got: got, t: t };
  });
  is(mark.got.indexOf('c1|전화') >= 0, '  📞 걸기 → 접촉 기록(ccMark) 「전화」 한 줄 — ' + mark.got.join(' · '));
  is(mark.t.length > 30, '  💬 문자로 열기가 담는 글 = 그 상자의 글 (' + mark.t.length + '자)');
  /* ★ 단계는 배정 DB 가 <b>창이 열린 뒤에</b> 옵니다 — 처음엔 몰라 빈 칸, 오면 다시 그려야 합니다.
     화면을 찍다 실제로 빈 칸으로 남은 것을 찾았습니다(판 X180). */
  const late = await A.pg.evaluate(() => {
    const host = document.createElement('div'); host.id = 'cuwSay'; document.body.appendChild(host);
    window.cmCliOf = () => ({ id: 'c1' }); CUS.db = null;
    cuwSayPaint({ id: 'c1' }); const before = host.querySelectorAll('.cus-tc').length;
    CUS.db = { stage: 'PC', source: '', phone: '010-1234-5678' };
    cuwSayPaint({ id: 'c1' }); const after = [].map.call(host.querySelectorAll('.cus-tc-s'), e => e.getAttribute('data-k')).join(',');
    const f = host.querySelector('details.cuw-fold'); f.open = true; const node = host.firstChild;
    cuwSayPaint({ id: 'c1' }); const kept = host.firstChild === node && host.querySelector('details.cuw-fold').open;
    CUS.db = { stage: 'CS', source: '', phone: '010-1234-5678' };
    cuwSayPaint({ id: 'c1' }); const cs = [].map.call(host.querySelectorAll('.cus-tc-s'), e => e.getAttribute('data-k')).join(',');
    const reopen = host.querySelector('details.cuw-fold').open;
    host.remove();
    return { before, after, kept, cs, reopen };
  });
  is(late.before === 0 && late.after === 'pc-sent,pc-think,pc-family',
     '  배정 DB 가 늦게 와도 💬 칸이 <b>다시 선다</b> — 처음 ' + late.before + '칸 → 온 뒤 ' + late.after);
  is(late.kept, '  같은 글이면 손대지 않는다 — 펴 둔 칸이 안 닫힌다');
  is(late.cs === 'cs-prep,cs-wait,cs-done' && late.reopen, '  단계가 바뀌면 새 글로 · 펴 둔 것은 편 채로 — ' + late.cs);
  is(/cuwSayPaint\(c\)/.test(body(APP, 'function cuwPaint(')), '  cuwPaint(고객 창을 다시 그리는 한 곳)가 cuwSayPaint 를 부른다');
  is(!A.errs.length && !C.errs.length, '  조용히 터진 곳이 없다' + ((A.errs[0] || C.errs[0]) ? ' — ' + (A.errs[0] || C.errs[0]) : ''));
  await A.ctx.close(); await C.ctx.close(); await br.close(); srv.close();

  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데 — 두 화면이 같은 고객에게 다른 말을 하거나, 지어낸 말이 나갑니다.'); process.exit(1); }
  console.log('✓ TA → CS 상황 열둘 · 글 ' + all.reduce((n, x) => n + x.msg.length, 0) + '가지 · 대본 열둘이 한 표에서 나와 두 화면에 같은 글로 섭니다.');
})().catch(e => { console.error(e); process.exit(1); });
