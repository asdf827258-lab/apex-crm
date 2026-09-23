/* 고객 동의 — 고객 폰(app/me.html)과 설계사 화면(app/index.html 의 cp*)이
   <b>지켜야 할 것</b>을 실제로 열어 봅니다. (docs/고객참여앱_계획.md)

     1. 고객 화면은 서버를 <b>한 번도</b> 부르지 않는다 — 읽기만 한다
     2. 동의는 <b>아무것도 미리 골라 두지 않는다</b> · 필수와 건강정보를 따로 받는다
     3. 필수에 동의하지 않으면 확인서를 만들지 않는다
     4. 새 링크를 열어도 앞서 한 동의가 이 폰에서 안 지워진다
     4-1. 확인서·이 폰 저장에 <b>실명이 없다</b> — 가린 이름만 (3번)
     5. 보유 기간·받는 곳이 빈 링크는 <b>화면을 세우지 않는다</b> (1번)
     6. 동의서 문구에 외운 숫자가 없다 (2번과 같은 이유)
     7. 설계사가 만드는 링크에 고객 이름이 없다 · 빈 칸이면 안 만든다
     8. <b>다른 분께 보낸 링크의 회신</b>은 이 분 기록에 안 붙는다
     9. 기록은 가린 이름으로만 서버에 · 거둔 알림이 나중이면 「거둠」으로 보인다
    10. 인쇄에 tnum 이 없다 (4-1번)
   견본 이름은 홍길동이다. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json',
               '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
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

const ME_SRC = fs.readFileSync(path.join(ROOT, 'app/me.html'), 'utf8');
const IX_SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const CP = require(path.join(ROOT, 'app/apex-consent.js'));

/* ── 글만 보고 ─────────────────────────────────────────────────── */
console.log('\n[글] 고객 화면 · 동의서 문구');
const meCode = ME_SRC.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
is(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|supabase|createClient/.test(meCode),
   '고객 화면(me.html)에 서버를 부르는 줄이 없다');
is(!/setInterval/.test(meCode), '고객 화면이 되풀이해서 도는 것이 없다 (7번)');
is(!/tnum/.test(meCode), '고객 화면에 tnum 이 없다 (4-1번)');
is(!/\bchecked\b(?!'|\s*:)/.test(meCode.replace(/\(a==='(yes|no)'\?' checked':''\)/g, '')),
   '동의 칸에 미리 골라 둔(checked) 것이 없다 — 고른 뒤 다시 그릴 때만 붙는다');
const base = CP.cpTerm('base'), hl = CP.cpTerm('health');
is(!!base && base.need === true, '필수 동의 항목이 있다');
is(!!hl && hl.sep === true, '건강정보는 <별도 동의>로 따로 있다');
const words = CP.CP_TERMS.map(t => [t.t, t.why, t.what, t.no].join(' ')).concat(CP.CP_NOTE).join(' ');
is(CP.CP_TERMS.every(t => t.why && t.what && t.no), '항목마다 목적·받는 것·거부했을 때가 다 적혀 있다');
is(!/[0-9]/.test(words), '동의서 문구에 숫자(외운 기간·한도)가 없다 — 보유 기간은 설계사가 회사 동의서에서 옮긴다');
is(/심사 결과에 따릅니다/.test(words), '「심사 결과에 따릅니다」가 붙어 있다 (2번)');
const rt = CP.cpDec(CP.cpEnc({a: '홍길동 보장분석 ✓'}));
is(rt && rt.a === '홍길동 보장분석 ✓', '주소 꾸리기가 한글을 그대로 되돌린다');

console.log('\n[글] 설계사 쪽 — 링크에 이름을 안 담나');
const mk = (IX_SRC.match(/function cpMake\(\)\{[\s\S]*?\n\}/) || [''])[0];
is(!!mk, 'cpMake 가 있다');
const invLine = (mk.match(/var inv=\{[^;]*\};/) || [''])[0];
is(!!invLine && !/name|nm\b|cmName/.test(invLine), '링크에 담는 칸(inv)에 고객 이름이 없다');
is(/apex-consent\.js/.test(IX_SRC) && !/var CP_TERMS\s*=/.test(IX_SRC), '동의서 문구를 본체에 다시 적지 않고 apex-consent.js 를 싣는다 (5번)');

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port, H = 'http://127.0.0.1:' + PORT;
  const b = await chromium.launch();
  const ctx = await b.newContext();
  const asked = [];
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) {
      if (r.request().method() !== 'GET' || /\.netlify|functions|supabase/.test(u)) asked.push(u);
      return r.continue();
    }
    /* 글꼴(css·woff)을 받아 오는 GET 은 자료를 보내는 것이 아니다. 그 밖은 전부 센다. */
    if (/me\.html/.test(r.request().frame() && r.request().frame().url() || '') &&
        (r.request().method() !== 'GET' || !/\.(css|woff2?|otf|ttf)(\?|$)/.test(u))) asked.push(u);
    return r.abort();
  });

  /* ── 고객 폰 ───────────────────────────────────────────────── */
  console.log('\n[고객 폰] app/me.html');
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('' + e));
  const INV = { v: 1, id: 'TESTLINK23', adv: '윤설계', ph: '010-0000-0000', org: '견본대리점',
                keep: '회사 동의서에 적힌 기간', ask: ['health'], ver: CP.CP_VER };

  /* 빈 칸이 있는 링크 — 세우지 않는다 */
  await p.goto(H + '/app/me.html#i=' + CP.cpEnc(Object.assign({}, INV, { keep: '' })));
  await p.waitForTimeout(300);
  let t = await p.evaluate(() => document.body.innerText);
  is(/온전하지 않습니다/.test(t) && !(await p.$('input[type=radio]')), '보유 기간이 빈 링크는 동의 화면을 세우지 않는다');

  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto(H + '/app/me.html#i=' + CP.cpEnc(INV));
  await p.reload();
  await p.waitForTimeout(300);
  const radios = await p.$$eval('input[type=radio]', a => a.map(x => ({ n: x.name, c: x.checked })));
  is(radios.length === 4, '필수·건강정보 두 항목이 각각 따로 선다 (라디오 ' + radios.length + '개)');
  is(radios.every(x => !x.c), '아무것도 미리 골라 두지 않았다');
  t = await p.evaluate(() => document.body.innerText);
  is(t.indexOf('회사 동의서에 적힌 기간') >= 0 && t.indexOf('견본대리점') >= 0, '보유 기간·받는 곳을 링크에 적힌 그대로 보여 준다');
  is(/별도 동의/.test(t), '건강정보에 「별도 동의」 표시가 붙는다');

  /* 아무것도 안 고르고 누른다 */
  await p.fill('#meName', '홍길동');
  await p.click('#meGoBtn'); await p.waitForTimeout(200);
  let st = await p.evaluate(() => ({ rec: !!ME.rec, msg: ME.msg }));
  is(!st.rec && /골라/.test(st.msg), '고르지 않으면 확인서를 만들지 않는다');

  /* 필수 거부 */
  await p.check('input[name=cp_base][value=no]'); await p.waitForTimeout(100);
  await p.check('input[name=cp_health][value=no]'); await p.waitForTimeout(100);
  await p.fill('#meName', '홍길동');
  await p.click('#meGoBtn'); await p.waitForTimeout(200);
  st = await p.evaluate(() => ({ rec: !!ME.rec, msg: ME.msg }));
  is(!st.rec && /해 드릴 수 없습니다/.test(st.msg), '필수에 동의하지 않으면 확인서를 안 만들고 이유를 말한다');

  /* 필수 동의 · 건강정보 거부 */
  await p.check('input[name=cp_base][value=yes]'); await p.waitForTimeout(100);
  await p.fill('#meName', '홍길동');
  await p.click('#meGoBtn'); await p.waitForTimeout(400);
  st = await p.evaluate(() => ({ rec: ME.rec, txt: ME.rec ? meRecText() : '', ls: localStorage.getItem('apex_me') || '',
                                 body: document.body.innerText }));
  is(!!st.rec && st.rec.base.ok === true && st.rec.health.ok === false && st.rec.health.asked === true,
     '필수 ✓ · 건강정보 ✗ 가 따로 적힌다');
  is(st.txt.indexOf('홍길동') < 0 && st.txt.indexOf('길동') < 0, '카톡으로 보낼 확인서에 실명이 없다');
  const back = CP.cpFind(st.txt, 'a');
  is(!!back && back.id === 'TESTLINK23' && back.nm && back.nm.indexOf('길동') < 0, '확인서를 풀면 링크 번호와 가린 이름만 나온다 (' + (back && back.nm) + ')');
  is(st.ls.indexOf('길동') < 0, '이 폰 저장(localStorage)에도 실명이 없다');
  is(/진료·청구 기록이 적힌 쪽은 빼고/.test(st.body), '건강정보를 거부하면 무엇을 빼고 보낼지 말해 준다');

  /* 다시 열어도 그 동의가 그대로 */
  await p.goto(H + '/app/me.html'); await p.waitForTimeout(300);
  t = await p.evaluate(() => document.body.innerText);
  is(/동의해 주셨습니다/.test(t), '링크 없이 다시 열어도(폰 홈 화면) 한 동의가 보인다');

  /* 건강정보를 묻지 않은 링크 */
  const p2 = await ctx.newPage();
  await p2.goto(H + '/app/me.html#i=' + CP.cpEnc(Object.assign({}, INV, { id: 'TESTLINK24', ask: [] })));
  await p2.waitForTimeout(300);
  is((await p2.$$('input[name=cp_health]')).length === 0, '건강정보를 요청하지 않은 링크에는 그 칸이 없다');

  /* 거두기 */
  await p.goto(H + '/app/me.html#i=' + CP.cpEnc(INV)); await p.reload(); await p.waitForTimeout(300);
  is(await p.evaluate(() => !!ME.rec && ME.rec.id === 'TESTLINK23'), '다른 링크를 연 뒤에도 앞서 한 동의가 안 지워진다');
  p.once('dialog', d => d.accept());
  await p.evaluate(() => meWithdraw(['base', 'health'])); await p.waitForTimeout(200);
  st = await p.evaluate(() => ({ gone: !!ME.rec.gone, wd: ME.rec.wd }));
  is(st.gone && st.wd && st.wd.k === 'w', '「모두 거두기」가 거둔 알림을 만든다');

  /* 설계사가 확인서를 누른 경우 — 보여 주기만 */
  const p3 = await ctx.newPage();
  await p3.goto(H + '/app/me.html#a=' + CP.cpEnc(back)); await p3.waitForTimeout(300);
  t = await p3.evaluate(() => document.body.innerText);
  is(/동의 확인서/.test(t) && /회신 붙여넣기/.test(t), '확인서를 누르면 APEX 에 붙여 넣으라고 알려 준다');
  is(!errs.length, '고객 화면에 스크립트 오류가 없다' + (errs.length ? ' — ' + errs[0] : ''));
  is(!asked.length, '고객 화면이 서버를 부르지 않았다' + (asked.length ? ' — ' + asked[0] : ''));

  /* ── 설계사 화면 ───────────────────────────────────────────── */
  console.log('\n[설계사] app/index.html 의 cp*');
  const q = await ctx.newPage();
  await q.goto(H + '/app/index.html'); await q.waitForTimeout(2500);
  const ix = await q.evaluate((REC) => {
    const o = {};
    try { localStorage.removeItem('apex_cp_inv'); localStorage.removeItem('apex_cp_me'); } catch (e) {}
    OSC.current = { id: 'c-1', name_masked: '홍*동' };
    OSC.reps = []; OSC.repsLoaded = true;
    o.none = cpRowHtml();
    o.inBa = oscBaHtml().indexOf('cp-row') >= 0;
    cpOpen();
    document.getElementById('cpAdv').value = '윤설계';
    document.getElementById('cpOrg').value = '견본대리점';
    document.getElementById('cpKeep').value = '';
    cpMake();
    o.emptyText = CP.text; o.emptyMsg = CP.msg;
    cpOpen();
    document.getElementById('cpAdv').value = '윤설계';
    document.getElementById('cpOrg').value = '견본대리점';
    document.getElementById('cpKeep').value = '회사 동의서에 적힌 기간';
    cpMake();
    o.link = CP.link;
    o.inv = cpFind(CP.link, 'i');
    /* 다른 분께 보낸 링크의 회신 */
    const m = JSON.parse(localStorage.getItem('apex_cp_inv') || '{}');
    m[REC.id] = { cid: 'c-2', at: '' }; localStorage.setItem('apex_cp_inv', JSON.stringify(m));
    document.getElementById('cpPaste').value = '[보장분석 동의 확인서]\nhttps://x/app/me.html#a=' + cpEnc(REC);
    cpTake();
    o.otherMsg = CP.msg;
    /* 이 분께 보낸 링크의 회신 — 서버는 흉내 */
    m[REC.id] = { cid: 'c-1', at: '' }; localStorage.setItem('apex_cp_inv', JSON.stringify(m));
    let row = null;
    window.osClient = () => ({ from: () => ({ insert: (r) => { row = r; return Promise.resolve({ error: null }); } }) });
    window.arMyId = () => 'u-1';
    window.osRepListLoad = () => {};
    document.getElementById('cpPaste').value = '[보장분석 동의 확인서]\nhttps://x/app/me.html#a=' + cpEnc(REC);
    cpTake();
    return new Promise(res => setTimeout(() => {
      o.row = row;
      OSC.reps = [{ kind: 'cp_consent', content: { rec: REC } }];
      o.ok = cpRowHtml();
      OSC.reps = [{ kind: 'cp_consent', content: { rec: { k: 'w', v: 1, id: REC.id, at: '2099-01-01T00:00:00Z', what: ['base', 'health'] } } },
                  { kind: 'cp_consent', content: { rec: REC } }];
      o.gone = cpState().s;
      cpClose();
      res(o);
    }, 100));
  }, back);
  is(/아직 동의를 받지 않았습니다/.test(ix.none), '동의 기록이 없으면 「아직 받지 않았다」고 말한다');
  is(ix.inBa, '고객 365일 전·후 칸 안에 동의 줄이 선다');
  is(!ix.emptyText && /보유·이용 기간/.test(ix.emptyMsg), '보유 기간이 비면 링크를 만들지 않고 무엇이 비었는지 말한다');
  is(/me\.html#i=/.test(ix.link) && ix.inv && ix.inv.keep === '회사 동의서에 적힌 기간', '링크가 me.html 로 가고 보유 기간이 그대로 담긴다');
  is(ix.inv && JSON.stringify(ix.inv).indexOf('홍') < 0, '링크에 고객 이름(가린 것도)이 없다');
  is(/다른 분께 보낸 링크/.test(ix.otherMsg), '다른 분께 보낸 링크의 회신은 이 분 기록에 안 붙인다');
  is(!!ix.row && ix.row.kind === 'cp_consent' && ix.row.client_id === 'c-1', '이 분 카드(client_id)에 cp_consent 로 남긴다');
  is(!!ix.row && JSON.stringify(ix.row).indexOf('길동') < 0, '서버로 가는 기록에 실명이 없다');
  is(/건강정보 동의가 없습니다/.test(ix.ok || ''), '건강정보 동의가 없으면 「진료·청구 기록은 보지 말라」고 적는다');
  is(ix.gone === 'gone', '거둔 알림이 나중이면 「거둠」으로 본다');

  await b.close(); srv.close();
  console.log(bad ? '\n✗ ' + bad + '개 어긋남' : '\n고객 동의 점검 통과');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
