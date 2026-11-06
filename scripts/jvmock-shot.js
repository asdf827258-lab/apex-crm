/* 📸 <b>자비스 새 판 목각에 붓는 「실제 결과」 를 뽑는다</b> (판 X328)

   사장님 말씀 2026-11-04 — 「컴퓨터 화면까지 그려서 띄워줘봐 그리고, 결과물도 한번 어떻게 나오는지도」.
   목각(docs/mokgak/자비스.html)의 「결과물」 칸은 <b>지어낸 견본이 아니라</b> 지금 자비스가 실제로
   찾아 내놓는 값입니다. 이 스크립트가 앱을 띄워 열다섯 물음(TA → CS)을 묻고, 답을 그대로
   docs/mokgak/자비스-결과.js 로 적습니다. ★ 그 파일은 <b>손으로 고치지 않습니다</b>.

   쓰는 법
     node scripts/jvmock-shot.js           결과를 새로 뽑아 적습니다
     node scripts/jvmock-shot.js --check   지금 자비스와 적힌 결과가 같은지만 봅니다(CI 에서는 check-jvshot.js 가 이것을 부릅니다 · web)
       — 물음마다 <b>맨 위 답의 갈래 · 제목</b>만 견줍니다. 생일까지 며칠 같은 날마다 바뀌는 값은
         견주지 않습니다(헛것을 잡지 않게 · 8번). 다르면 위 명령을 다시 돌리라고 적어 줍니다.
   ★ 견본 고객은 홍길동 한 분(시험용 번호) · AI 는 끄고 앱 자료만으로 뽑습니다(3번). */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PORT = 9161;
const OUT = path.join(ROOT, 'docs', 'mokgak', '자비스-결과.js');
const CHECK = process.argv.indexOf('--check') >= 0;

/* 물음 — 신입 시뮬레이션(판 X280)의 단계 그대로 · 고객 일 하나 · 앱 쓰는 법 하나 */
const QS = [
  ['TA', '처음 전화 뭐라고 해?'], ['TA', '부재중이면 문자 뭐라고 보내?'], ['TA', '지금 바빠요 라고 끊으려 해'],
  ['AP', '만나기 전에 뭐 준비해?'], ['AP', '고객이 증권 안 가져온대'], ['AP', '홍길동 고객 내일 3시 통화 할 일 넣어줘'],
  ['만남', '협심증 있는 고객 가입돼?'], ['만남', '유사암 진단비가 뭐야?'], ['만남', '노후 걱정하는 고객한테 연금 얘기 어떻게 꺼내'],
  ['PC', '다른 설계사도 만나본대'], ['PC', '50세 남자 월 50만원 10년납 65세부터 연금 얼마'], ['PC', '보장분석 어떻게 해?'],
  ['CS', '청약할 때 뭐 챙겨'], ['CS', '증권 전달할 때 뭐라고 해'], ['CS', '소개 부탁 어떻게 해']
];

const MT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});
/* check-jvfind 와 같은 견본 — 홍길동 한 분 · 서버는 부르지 않습니다 */
const SEED = () => {
  try { localStorage.setItem('apex_login_ok', '1'); } catch (e) {}
  window.osLoadProfile = function(){}; window.osProfileApply = function(){};
  window.osShowLoginGate = function(){}; window.arLoad = function(){};
  window.osLoadClients = function(){}; window.cmLoadAll = function(cb){ if (cb) cb(); };
  window.toast = function(){};
  window.setupDone = function(){ return true; }; window.setupCanRun = function(){ return true; };
  window.osTabAllowed = function(){ return true; };
  OS.profile = { id: 'me', user_id: 'me', name: '윤설계', role: 'fp', team: 'A', active: true };
  OS.session = { user: { id: 'me' } };
  OSC.loaded = true; OSC.busy = false; OSC.err = '';
  CM.loaded = true; AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.db = [];
  OSC.list = [{ id: 'c0', name_masked: '홍○○', advisor_id: 'me', stage: 'AP', created_at: '2026-08-01', phone: '010-1234-5678' }];
  CM.meta = { c0: { nx: [{ k: 'nx1', what: '증권 전달', due: '2026-11-03' }], touch: [] } };
  try { cmRealSet('c0', '홍길동'); } catch (e) {}
  try { osHideLoginGate(); } catch (e) {}
  try { renderNav(); } catch (e) {}
  go('home');
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', rt => { const u = rt.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return rt.continue();
    return rt.fulfill({ status: 200, contentType: 'application/javascript', body: '' }); });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED); await p.waitForTimeout(800);
  await p.evaluate(() => go('apexmap')); await p.waitForTimeout(2200);
  const f = p.frame({ url: /apex-map\.html/ });
  if (!f) { console.log('✗ 자비스 모드가 안 열립니다'); await b.close(); srv.close(); process.exit(1); }
  await f.evaluate(() => { ['gproxy', 'proxy', 'apikey', 'gkey'].forEach(k => LS.del(k)); modeLabel(); jvExtLoad(); });
  await p.waitForTimeout(4000);

  const R = [];
  for (const [st, q] of QS){
    await p.evaluate(() => { try { jvDockEnd(); } catch (e) {} go('apexmap'); }); await p.waitForTimeout(300);
    const r = await f.evaluate(async (q) => {
      jLog.innerHTML = ''; window.speak = function(){}; ask(q); await new Promise(res => setTimeout(res, 1800));
      const c = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop(); if (!c) return {};
      const T = el => el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
      const out = { head: '' };
      const bub = c.querySelector('.bub'); if (bub && bub.firstChild) out.head = T(bub.firstChild).slice(0, 160);
      const act = c.querySelector('.j-act');
      /* 판 X360 — 확인 판이 칸(누구 · 무엇 · 언제)으로 나뉘었습니다. 한 줄 요약은 .ja-q 에 그대로 있습니다 */
      if (act) out.act = { t: T(act.querySelector('b')), line: T(act.querySelector('.ja-q')) || [].slice.call(act.querySelectorAll('div')).map(T).filter(Boolean)[0] || '',
        f: [].slice.call(act.querySelectorAll('.ja-fld')).map(x => [T(x.querySelector('span')), T(x.querySelector('b'))]) };
      const pen = c.querySelector('.j-pen .jf-best');
      if (pen) out.pen = (pen.innerText || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 14);
      const find = c.querySelector('.j-find');
      out.weak = !!(find && /혹시 이것도/.test(find.textContent));
      /* 답 칸은 자비스가 그린 그대로 — jvFind 의 차례 · 갈래 · 줄 */
      let F = []; try { F = jvFind(q); } catch (e) {}
      out.src = F.filter(x => (x.rows || []).length).slice(0, 3).map(x => ({ n: x.n, k: x.k, strong: !!x.strong,
        rows: x.rows.slice(0, 2).map(r => ({ t: r.t, s: (r.s || []).slice(0, 6), say: !!r.say, open: r.open ? r.open.label : '', asks: (r.asks || []).slice(0, 13) })) }));
      out.steps = [].slice.call(c.querySelectorAll('.steps > li')).slice(0, 3).map(li => ({ n: T(li.querySelector('.st-n')), d: T(li.querySelector('.st-d')).slice(0, 120) }));
      return out;
    }, q);
    R.push(Object.assign({ st, q }, r));
  }
  await b.close(); srv.close();

  const key = x => x.q + ' → ' + (x.act ? '일:' + x.act.t : x.pen ? '연금:' + (x.pen[1] || '') : (x.src && x.src[0]) ? x.src[0].k + ':' + x.src[0].rows[0].t : (x.steps && x.steps[0]) ? '길:' + x.steps[0].n : '없음');
  if (CHECK){
    console.log('📸 자비스 새 판 목각의 「결과물」 이 지금 자비스와 같은가 (판 X328)');
    const W = {}; try { new Function('window', fs.readFileSync(OUT, 'utf8'))(W); } catch (e) {}
    const old = (W.JV_SHOT && W.JV_SHOT.r) || [];
    let bad = 0;
    R.forEach((x, i) => { const a = key(x), o = old[i] ? key(old[i]) : '(없음)'; const ok = a === o;
      if (!ok) bad++; console.log((ok ? '  ✓ ' : '  ✗ ') + a + (ok ? '' : '   ← 적힌 것: ' + o)); });
    console.log('\n' + (bad ? '✗ ' + bad + '곳이 다릅니다 — 자비스를 고치셨으면 <b>node scripts/jvmock-shot.js</b> 를 한 번 돌려 목각의 결과를 새로 뽑으십시오 (안 그러면 그림이 옛 답을 보여 줍니다 · 1번)'
                         : '✓ 목각의 결과물이 지금 자비스와 같습니다'));
    process.exit(bad ? 1 : 0);
  }
  const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  fs.writeFileSync(OUT, '/* ⚠ <b>손으로 고치지 마십시오</b> — node scripts/jvmock-shot.js 가 앱을 띄워 뽑습니다 (판 X328).\n' +
    '   지금 자비스(app/apex-map.html)가 열다섯 물음에 <b>실제로 내놓는 답</b>입니다 · 견본 고객 홍길동 · AI 끔.\n' +
    '   자비스를 고쳤으면 다시 돌리십시오 — 어긋나면 jvmock-shot --check 가 빨간불을 켭니다. */\n' +
    'window.JV_SHOT = ' + JSON.stringify({ day: day, r: R }) + ';\n');
  console.log('목각 결과를 적었습니다 — ' + R.length + '물음 (' + day + ')');
  R.forEach(x => console.log('  ' + x.st + ' · ' + key(x)));
})();
