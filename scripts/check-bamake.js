/* ══════════════════════════════════════════════════════════════════
   보장분석 전 · 후 만들기 — 메뉴를 누르면 <b>바로</b> 이 화면이 뜨는가.
   그리고 고객 365일에 <b>한 고객 한 줄</b>로 저장되는가.

   ■ 이 화면은 app/ba.html 한 파일이다. 앱은 <b>띄우고 저장만</b> 한다.
   ■ 아무 창이나 보낸 쪽지로 고객 파일에 글이 써지면 안 된다.
   ────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd();
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);

const srv = http.createServer((rq, rs) => {
  let pn = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, pn);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': /\.html$/.test(f) ? 'text/html; charset=utf-8' : 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

(async () => {
  console.log('보장분석 전 · 후 만들기 — 메뉴에서 바로 뜨는가 · 고객에게 저장되는가');
  is(fs.existsSync(path.join(ROOT, 'app/ba.html')), 'app/ba.html 파일이 있다');
  const BA = fs.readFileSync(path.join(ROOT, 'app/ba.html'), 'utf8');

  sec('[1] 이 화면이 들고 있어야 할 것 — 하나라도 빠지면 안 된다');
  [['자동 보장분석', 'function fitCalc('], ['윤시현의 두뇌', 'function brainPick('],
   ['상담 포인트', 'function pointCalc('], ['연령대별 기준', 'var AGE_GUIDE='],
   ['보장분석 기준', 'var STUDY_DOC'], ['사용방법', 'function guideHtml('],
   ['시뮬레이션', 'function simCalc('], ['경제활동기', 'function lifeCalc('],
   ['인체 해부도', 'function anatSvg('], ['납입 보험료', 'function premCalc('],
   ['표준 담보표', 'function stBody('], ['KB 보장분석 읽기', 'function kbParse('],
   ['셈하는 기준(가정치)', 'function assumeHtml('], ['더 넣을 것', 'function needList('],
   ['옛 자료 되살리기', 'function migrate('],
   ['상담 흐름', 'function flowCalc('], ['왜 나에게 맞는가', 'function whyHtml(']
  ].forEach(function (x) { is(BA.indexOf(x[1]) >= 0, x[0] + ' 이 들어 있다'); });
  is(/AI\s*를 부르지 않는다|AI 판단/.test(BA), 'AI 를 부르지 않는다고 적혀 있다');
  is(!/callAI\s*\(|generateContent|api\.openai/.test(BA), '실제로 <b>AI 를 부르지 않는다</b>');

  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  sec('[2] 메뉴를 누르면 바로 뜨는가');
  const m = await page.evaluate(() => {
    let it = null, grp = null;
    TABS.forEach(g => (g.items || []).forEach(x => { if (x.id === 'frmake') { it = x; grp = g.group; } }));
    return { has: !!it, title: it && it.title, grp: grp, hide: !!(it && it.hide),
             opens: (typeof openBa === 'function'),
             wired: /openBa\(\)/.test(String(go)) };
  });
  is(m.has && !m.hide, '메뉴에 「' + (m.title || '?') + '」 가 보이게 있다 (' + m.grp + ')');
  is(m.opens && m.wired, '그 메뉴가 <b>이 화면</b>을 연다 — 옛 리포트가 아니다');

  const opened = await page.evaluate(() => {
    OSC.current = { id: 'c-test', name_masked: '홍○동' };
    openBa();
    return { on: document.getElementById('baScreen').classList.contains('on'),
             src: document.getElementById('baFrame').getAttribute('src'),
             cid: BA.cid };
  });
  is(opened.on && opened.src === 'ba.html', '누르면 <b>바로</b> 전용 화면이 뜬다 (' + opened.src + ')');
  is(opened.cid === 'c-test', '보던 고객을 <b>들고</b> 연다');
  /* 「바로」 라는 말은 <b>싣기를 기다리지 않는다</b>는 뜻이다 */
  const fast = await page.evaluate(() => {
    document.getElementById('baScreen').classList.remove('on');
    const f = document.getElementById('baFrame');
    f._mounted = false; f.removeAttribute('src');
    openBa();
    /* 부른 <b>그 순간</b> 화면이 이미 서 있어야 한다 */
    return { on: document.getElementById('baScreen').classList.contains('on'),
             hash: location.hash };
  });
  is(fast.on, '누른 <b>그 순간</b> 화면이 선다 — 싣기를 기다리지 않는다');
  is(fast.hash === '#frmake', '주소가 <b>#frmake</b> 로 남아 새로고침해도 돌아온다');
  const boot = await page.evaluate(() => (typeof baBoot === 'function') && /frmake/.test(String(baBoot)));
  is(boot, '주소로 바로 들어와도 <b>그 화면</b>이 뜬다 (baBoot)');
  const keep = await page.evaluate(() => /_mounted/.test(String(exitBa)) === false);
  is(keep, '나갔다 들어와도 <b>틀을 안 내린다</b> — 두 번째부터는 즉시 뜨고 적은 것도 안 사라진다');

  await page.waitForTimeout(2200);
  const fr = page.frames().filter(f => /ba\.html/.test(f.url()))[0];
  is(!!fr, '화면이 실제로 실린다');
  if (fr) {
    /* ★ 「1초 기다렸으니 다 실렸겠지」 로 재지 않는다. ba.html 은 6천 줄이
       넘어서, 느린 기계에서는 그 사이에 스크립트가 아직 안 돈다. 그러면
       <b>화면은 멀쩡한데 점검만</b> 「INFRAME is not defined」 로 터진다 —
       기계가 느리다는 이유로 우는 알람은 사람이 점검을 안 믿게 만든다 (8번).
       실려야 할 것이 <b>실제로 실렸는지</b>를 기다리고, 그래도 안 실리면
       터지지 말고 <b>못 실렸다고 말한다.</b>                              */
    let ready = true;
    try {
      await fr.waitForFunction(
        () => typeof INFRAME !== 'undefined' && !!document.getElementById('baSaveBtn'),
        { timeout: 20000 });
    } catch (e) { ready = false; }
    is(ready, '화면 안의 스크립트가 <b>끝까지 돈다</b>' + (ready ? '' : ' — 20초를 기다려도 안 돌았다'));
    const inside = ready ? await fr.evaluate(() => ({
      alive: typeof S === 'object' && S !== null,
      inframe: INFRAME === true,
      btn: !!document.getElementById('baSaveBtn'),
      shown: document.getElementById('baSaveBtn').style.display !== 'none'
    })) : { alive: false, inframe: false, btn: false, shown: false };
    is(inside.alive, '화면 안이 <b>멈추지 않고</b> 살아 있다');
    is(inside.inframe && inside.btn && inside.shown, '워크스페이스 안이라 <b>「고객 365일에 저장」</b> 단추가 선다');

    /* ══ 🔁 갱신주기 — 판 X423 ═══════════════════════════════════════════
       판 X131 이 「갱신일은 못 합니다」 라고 화면에 적어 둔 자리입니다.
       보험 한 줄에 그 칸이 없었기 때문입니다. 칸을 만들었으니, 이제
       <b>적은 것만</b> 셈이 되는지 · <b>안 적은 것은 안 세우는지</b> 를 봅니다.
       ★ 셈을 여기서 베껴 적지 않습니다 — 「7해 전에 들고 3년마다면
         <b>2해 뒤</b>」 라는 것은 손으로 셀 수 있는 사실이고, 그것만 견줍니다.
       ★ 오늘이 언제든 같은 답이 나오게 <b>오늘에서 거꾸로</b> 세웁니다.    */
    sec('[2-1] 🔁 갱신 — 적어 두신 계약만 · 날짜는 가입일+주기로 (판 X423)');
    const RN = ready ? await fr.evaluate(() => {
      const d = new Date(), ty = d.getFullYear(), mm = ('0' + (d.getMonth() + 1)).slice(-2);
      const put = (rnw, start) => {
        S.before = [{ id: 'p1', co: '삼성', nm: '암보험', term: '', start: start,
                      years: '', rnw: rnw, premMan: '', act: 'keep', kb: false,
                      cov: {}, cov2: {} }];
        const e = baEndOf();
        return (e && e.rnw) ? (e.rnw.ym + '/' + e.rnw.every) : null;
      };
      /* 칸을 <b>진짜로 그려</b> 봅니다 — 손으로 만든 반쪽 계약이 아니라
         addPol 이 만드는 그 줄로 (그래야 이 자가 화면과 같은 것을 봅니다) */
      let row = '';
      try {
        S.before = []; addPol('before'); S.before[0].rnw = '5';
        row = polHtml(S.before[0], 'before', 0);
      } catch (e) { row = 'ERR ' + e; }
      return {
        칸: /갱신주기/.test(row) && /'rnw'/.test(row),
        줄: row.slice(0, 120),
        고를것: /value="no"[^>]*>비갱신</.test(row) && /value="3"/.test(row),
        고른것: /value="5" selected/.test(row),
        기본모름: (typeof addPol === 'function') ? (function () {
            const keep = S.before.slice(); addPol('before');
            const v = S.before[S.before.length - 1].rnw; S.before = keep; return v;
          })() : 'x',
        셋:       put('3',  (ty - 7) + '-' + mm),
        모름:     put('',   (ty - 7) + '-' + mm),
        비갱신:   put('no', (ty - 7) + '-' + mm),
        가입일없음: put('3', ''),
        해지한것: (function () {
            S.before = [{ id: 'p1', co: '삼성', nm: '암보험', start: (ty - 7) + '-' + mm,
                          rnw: '3', act: 'cancel', cov: {}, cov2: {} }];
            const e = baEndOf(); return (e && e.rnw) ? e.rnw.ym : null;
          })(),
        바람: (ty + 2) + '-' + mm + '/3'
      };
    }) : null;
    is(!!RN && RN.칸, '계약 적는 칸에 <b>갱신주기</b> 가 선다' +
       (RN && !RN.칸 ? ' — ' + RN.줄 : ''));
    is(!!RN && RN.고를것 && RN.고른것,
       '고를 것에 <b>비갱신</b>·햇수가 있고, 적어 둔 것이 골라져 있다');
    is(!!RN && RN.기본모름 === '',
       '새 계약은 <b>「모름」 으로 시작한다</b> — 「비갱신」 으로 짐작해 두지 않는다 (1번)');
    is(!!RN && RN.셋 === RN.바람,
       '7해 전 가입 · 3년 갱신 → <b>2해 뒤 그 달</b>이다 (받음 ' +
       (RN && RN.셋) + ' · 바람 ' + (RN && RN.바람) + ')');
    is(!!RN && RN.모름 === null,
       '<b>주기를 안 적으면 아무 날도 안 만든다</b> (1번) — 받음 ' + (RN && RN.모름));
    is(!!RN && RN.비갱신 === null,
       '<b>「비갱신」 은 아는 답</b>이라 역시 안 세운다 — 받음 ' + (RN && RN.비갱신));
    is(!!RN && RN.가입일없음 === null,
       '가입 달을 모르면 <b>주기만으로 날을 만들지 않는다</b> (1번) — 받음 ' +
       (RN && RN.가입일없음));
    is(!!RN && RN.해지한것 === null,
       '<b>해지할 보험</b>의 갱신은 안 세운다 — 없어질 보험입니다 (받음 ' +
       (RN && RN.해지한것) + ')');

    sec('[3] 저장 — 한 고객에 한 줄, 아무나 못 쓴다');
    const said = await page.evaluate(async () => {
      window.__t = [];
      const o = window.toast; window.toast = function (x) { window.__t.push(x); };
      /* ① 남의 창이 보낸 쪽지 — <b>받으면 안 된다</b> */
      window.postMessage({ type: 'apexBaSave', title: '나쁜 저장', state: {} }, '*');
      await new Promise(r => setTimeout(r, 300));
      const bad = window.__t.slice();
      window.toast = o;
      return { bad: bad };
    });
    is(said.bad.length === 0, '<b>우리가 띄운 틀이 아닌 곳</b>에서 온 쪽지는 안 받는다');

    const said2 = await page.evaluate(() => {
      window.__t = [];
      const o = window.toast; window.toast = function (x) { window.__t.push(x); };
      baSave({ title: 't', state: { v: 3 } });
      window.toast = o;
      return window.__t.join(' | ');
    });
    is(/로그인/.test(said2), '로그인 없이 저장하면 <b>그렇다고 말한다</b> — 조용히 실패하지 않는다');

    const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
    const seg = src.slice(src.indexOf('function baSave('), src.indexOf('function baAskSave('));
    is(/kind:'ba_state'/.test(seg), '저장은 <b>이미 있는 표</b>(saved_reports)에 한다 — 새 표를 안 만든다');
    is(/BA\.rid[\s\S]{0,200}update\(/.test(seg), '두 번 저장해도 <b>한 고객에 한 줄</b>이다 — 쌓지 않는다');
    is(/osRepMask/.test(seg), '제목은 <b>가린 이름</b>으로 저장한다');
    /* ── 실명이 <b>정말</b> 안 나가는지 서버로 가는 것을 잡아 본다 ──
       osRepMask 는 CRM 이 아는 이름만 가린다. 화면에 손으로 적은 이름은
       모르니 그대로 나갔다 — 「홍철호 보장 전·후」 가 실제로 찍혔다.  */
    const leak = await page.evaluate(async () => {
      const bak = { p: OS.profile, s: OS.session };
      OS.profile = { id:'x', role:'advisor' }; OS.session = { user:{ id:'adv-1' } };
      BA.cid='c-test'; BA.name=''; BA.rid=null;
      let sent=null; const rc=window.osClient, rt=window.toast;
      /* 가짜 서버는 <b>진짜 클라이언트만큼</b> 갖춰야 한다. 이 창이 열려 있는
         동안 앱은 표 열여덟 개를 건드린다 — 출근표·오늘 점검·설정값·통화…
         메서드가 하나라도 빠지면 그 배경 쓰기가 터지고, 재려는 것과 아무
         상관 없는 자리에서 [5] 「오류가 없다」 가 빨개진다. 어느 표에 쓰기가
         떨어지는지는 타이밍이라 판마다 켜졌다 꺼졌다 했다 — 그런 알람은
         안 잡는 것보다 나쁘다 (CLAUDE.md 8).
         그리고 <b>재는 표만</b> 기록한다. 배경 쓰기가 sent 에 들어앉으면
         엉뚱한 줄을 놓고 「실명이 안 나갔다」 고 답하게 된다. */
      const fake=function(val){
        const q=val||{data:[],error:null};
        const o={ then:function(f,g){ return Promise.resolve(q).then(f,g); },
                  catch:function(f){ return Promise.resolve(q).catch(f); } };
        ['select','eq','neq','in','is','gt','gte','lt','lte','like','ilike','or','not',
         'order','limit','range','single','maybeSingle'].forEach(function(k){ o[k]=function(){ return o; }; });
        return o;
      };
      window.osClient=function(){ return { from:function(t){
        const put=function(row){ if(t==='saved_reports') sent={t:t,row:row};
                                 return fake({data:[{id:'r1'}],error:null}); };
        const o=fake();
        o.insert=put; o.update=put; o.upsert=put; o.delete=function(){ return fake(); };
        return o;
      } }; };
      window.toast=function(){};
      baSave({ title:'홍철호 보장 전·후', state:{ v:3, who:{ name:'홍철호', age:'45' } }, sum:{ name:'홍철호' } });
      await new Promise(r=>setTimeout(r,400));
      window.osClient=rc; window.toast=rt; OS.profile=bak.p; OS.session=bak.s;
      if(!sent)return { none:true };
      const str=JSON.stringify(sent.row);
      return { real: str.indexOf('홍철호')>=0, title: sent.row.title, name:(sent.row.content.state.who||{}).name };
    });
    is(!leak.none && leak.real === false,
       '화면에 <b>손으로 적은 실명</b>도 서버로 안 나간다 — 제목 「' + (leak.title||'?') + '」 · 자료 안 「' + (leak.name||'?') + '」');
  }

  sec('[4] 혼자서도 열리는가 — 파일을 그냥 열었을 때');
  const solo = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const se = []; solo.on('pageerror', e => se.push(e.message));
  await solo.goto('http://127.0.0.1:' + srv.address().port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await solo.waitForTimeout(1200);
  const s2 = await solo.evaluate(() => ({
    app: document.getElementById('app').innerHTML.length,
    inframe: INFRAME,
    btn: document.getElementById('baSaveBtn').style.display
  }));
  is(s2.app > 5000, '워크스페이스 <b>없이도</b> 그대로 열린다 (' + s2.app + '자)');
  is(s2.inframe === false && s2.btn === 'none', '혼자 열면 <b>고객 저장 단추를 안 세운다</b> — 저장할 데가 없으니');

  sec('[5] 화면이 멈추지 않는가');
  is(errs.length === 0, '워크스페이스에서 오류가 없다' + (errs.length ? ' — ' + errs[0] : ''));
  is(se.length === 0, '혼자 열 때 오류가 없다' + (se.length ? ' — ' + se[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데가 걸렸습니다.') : '보장 전 · 후 만들기 점검 통과 — 메뉴에서 바로 뜨고, 고객에게 한 줄로 저장됩니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
