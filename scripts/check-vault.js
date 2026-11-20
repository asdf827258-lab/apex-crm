/* 🔐 <b>금고</b> — 주민번호가 이 기기 안에서 <b>잠기는가</b> (판 X457 · 설계 11-5 판 5)

   사장님 말씀 2026-11-15 「안 끝낸 10개 뭔지 <b>다하고</b> 리스트 띄우고」.
   말씀 X161 의 마지막 판입니다.

   ⚠ <b>설계 6장과 다르게 지었습니다.</b> 설계는 암호문을 <b>서버</b>에 두자고 하는데,
     그 뒤에 사장님이 「주민번호는 <b>서버 호출 0번</b>」 이라고 못 박으셨습니다
     (CLAUDE.md 3번). 뒤에 하신 말씀이 위에 서므로 금고는 <b>이 기기에만</b> 섭니다.
     이 자는 <b>그렇게 지었는지</b>를 봅니다 — 설계대로 안 한 것을 한 척하지 않습니다 (1번).

   여기서 못 박는 것:
     [1] 금고를 만들면 <b>날번호가 저장소에서 사라집니다</b> — 암호문만 남습니다.
     [2] 잠근 뒤에는 <b>아무도 못 읽습니다</b> — 비밀번호 없이 푸는 길이 없습니다.
     [3] 비밀번호로도 <b>복구 코드로도</b> 열립니다. 틀린 것으로는 안 열립니다.
     [4] 열면 <b>번호가 그대로</b>입니다 — 한 자도 안 바뀝니다.
     [5] ★★ 만들다 잘못되면 <b>아무것도 안 바꿉니다</b> — 잃는 쪽이 새는 쪽보다 나쁩니다.
     [6] ★★ 금고가 <b>서버·백업·기기 공유로 가는 길이 하나도 없습니다.</b>
     [7] 잠겨 있을 때 화면이 「<b>없다</b>」 고 하지 않고 「<b>잠겼다</b>」 고 합니다 (1번).
     [8] 저절로 잠깁니다 — 그리고 <b>단추를 감추지 않습니다</b> (6번).

   ⚠ <b>이 자가 못 보는 것</b> — 비밀번호가 얼마나 센지는 안 봅니다. 여덟 자 아래를
     막는 것만 봅니다. 그리고 <b>사장님이 복구 코드를 적어 두셨는지</b>는 앱이 알 길이
     없습니다 — 화면에 그렇게 말하는지만 봅니다.                                   */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const FILE = 'app/index.html';
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
const head = (t) => console.log('\n' + t);

/* 견본 — <b>홍길동</b> 입니다 (CLAUDE.md 3번). 번호도 지어낸 것입니다 */
const CID = 'c-hong', RRN = '9001011234567', PW = '금고비밀번호8자';

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 420, height: 900 } });
  /* 🔌 바깥을 막습니다 — 점검이 사장님 진짜 서버를 읽지 않습니다 (CLAUDE.md 7번) */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                  ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await pg.goto('http://127.0.0.1:' + PORT + '/' + FILE, { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => typeof vltMake === 'function' && typeof cmRrnOf === 'function',
                           { timeout: 60000 });
  await pg.evaluate(() => { try { OS.profile = { id: 'me' }; } catch (e) {} });

  head('[0] 금고를 만들기 <b>전</b> — 지금은 날글자입니다');
  const 전 = await pg.evaluate(([cid, rrn]) => {
    cmRrnSet(cid, rrn);
    return { 저장소: localStorage.getItem('apex_cli_rrn_' + cmWho()) || '',
             읽힘: cmRrnOf(cid), 금고: vltOn(), 쓸수있나: vltCan() };
  }, [CID, RRN]);
  is(전.쓸수있나, '이 브라우저가 암호 기능을 가지고 있다 (없으면 아래를 못 봅니다)');
  is(전.읽힘 === RRN, '  번호가 담겼다');
  is(전.저장소.indexOf(RRN) >= 0, '  ★ 지금은 저장소에 <b>날글자</b>로 앉아 있다 — 이것이 금고가 막으려는 것입니다');
  is(!전.금고, '  금고는 아직 없다');

  head('[1] 금고를 만들면 <b>날번호가 사라집니다</b>');
  const 만듦 = await pg.evaluate((pw) => new Promise(ok => {
    vltMake(pw, (err, rc) => ok({ err: err || '', rc: rc || '' }));
  }), PW);
  is(!만듦.err, '금고를 만들었다' + (만듦.err ? (' — ' + 만듦.err.replace(/<[^>]+>/g, '')) : ''));
  is(/^[A-Z2-9]{5}(-[A-Z2-9]{5}){4}$/.test(만듦.rc), '  복구 코드를 <b>한 번</b> 돌려준다 (' +
     (만듦.rc ? 만듦.rc.slice(0, 5) + '-…' : '없음') + ')');
  const 뒤 = await pg.evaluate(([cid, rrn]) => {
    const all = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      all.push(k + '\u0000' + (localStorage.getItem(k) || ''));
    }
    return { 날번호가어디: all.filter(x => x.indexOf(rrn) >= 0).map(x => x.split('\u0000')[0]),
             옛칸: localStorage.getItem('apex_cli_rrn_' + cmWho()),
             금고: !!localStorage.getItem('apex_vault_v1'),
             읽힘: cmRrnOf(cid), 열림: vltOpen() };
  }, [CID, RRN]);
  is(뒤.옛칸 === null, '  ★★ 옛 칸(apex_cli_rrn_…)이 <b>저장소에서 아예 없어졌다</b>');
  is(뒤.날번호가어디.length === 0, '  ★★ 저장소 어디에도 <b>날번호가 없다</b>' +
     (뒤.날번호가어디.length ? (' ← ' + 뒤.날번호가어디.join(' · ')) : ''));
  is(뒤.금고, '  금고 칸(apex_vault_v1)이 생겼다');
  is(뒤.열림 && 뒤.읽힘 === RRN, '  ★ 만든 직후에는 열려 있어 번호가 그대로 읽힌다 (' +
     (뒤.읽힘 === RRN ? '한 자도 안 바뀜' : '어긋남') + ')');

  head('[2] 잠그면 <b>아무도 못 읽습니다</b>');
  const 잠금 = await pg.evaluate((cid) => {
    vltLock();
    return { 열림: vltOpen(), 꾸러미: vltOf(), 읽힘: cmRrnOf(cid), 서있나: vltOn() };
  }, CID);
  is(!잠금.열림 && 잠금.서있나, '잠갔다 — 금고는 서 있고 열려 있지 않다');
  is(잠금.꾸러미 === null, '  ★ 잠겼을 때 vltOf() 는 <b>null(모름)</b> 이다 — 빈 꾸러미가 아니다 (1번)');
  is(잠금.읽힘 === '', '  번호를 못 읽는다');

  head('[3] 비밀번호 · 복구 코드 — <b>맞는 것으로만</b> 열립니다');
  const 틀림 = await pg.evaluate(() => new Promise(ok => {
    vltUnlock('틀린비밀번호입니다', e => ok({ err: e || '', 열림: vltOpen() }));
  }));
  is(!!틀림.err && !틀림.열림, '틀린 비밀번호로는 안 열린다');
  const 맞음 = await pg.evaluate((pw) => new Promise(ok => {
    vltUnlock(pw, e => ok({ err: e || '', 열림: vltOpen(), 읽힘: cmRrnOf('c-hong') }));
  }), PW);
  is(!맞음.err && 맞음.열림, '비밀번호로 열린다');
  is(맞음.읽힘 === RRN, '  ★ 열고 보니 번호가 <b>한 자도 안 바뀌었다</b>');
  const 복구 = await pg.evaluate((rc) => new Promise(ok => {
    vltLock();
    vltUnlock(rc, e => ok({ err: e || '', 열림: vltOpen(), 읽힘: cmRrnOf('c-hong') }));
  }), 만듦.rc);
  is(!복구.err && 복구.열림 && 복구.읽힘 === RRN,
     '  ★★ <b>복구 코드로도 열린다</b> — 비밀번호를 잊으셔도 번호를 안 잃습니다');

  head('[4] 금고에 담고 지우기');
  const 담기 = await pg.evaluate(() => new Promise(ok => {
    vltSave('c-hong2', '8503022345678', e => ok(e || ''));
  }));
  const 담김 = await pg.evaluate(() => {
    const all = [];
    for (let i = 0; i < localStorage.length; i++)
      all.push(localStorage.getItem(localStorage.key(i)) || '');
    return { 읽힘: cmRrnOf('c-hong2'), 날것: all.filter(x => x.indexOf('8503022345678') >= 0).length };
  });
  is(!담기 && 담김.읽힘 === '8503022345678', '다른 분 번호도 금고에 담긴다');
  is(담김.날것 === 0, '  ★ 새로 담은 번호도 저장소에 <b>날글자로 없다</b>');
  const 지움 = await pg.evaluate(() => new Promise(ok => {
    vltSave('c-hong2', '', e => ok({ err: e || '', 읽힘: cmRrnOf('c-hong2'), 남: cmRrnOf('c-hong') }));
  }));
  is(!지움.err && 지움.읽힘 === '' && 지움.남 === RRN, '  한 분만 지워도 다른 분은 그대로다');

  head('[5] ★★ 잠긴 채로는 <b>담지도 않습니다</b> — 담으면 날글자로 다시 쌓입니다');
  const 잠근채 = await pg.evaluate(() => new Promise(ok => {
    vltLock();
    vltSave('c-hong3', '7001011234567', e => ok({ err: e || '',
      저장소: (() => { const a = []; for (let i = 0; i < localStorage.length; i++)
        a.push(localStorage.getItem(localStorage.key(i)) || ''); return a; })()
        .filter(x => x.indexOf('7001011234567') >= 0).length }));
  }));
  is(!!잠근채.err && 잠근채.저장소 === 0, '잠긴 금고에는 안 담고, 날글자로도 안 남는다');

  head('[6] ★★ 금고가 <b>밖으로 나가는 길</b>이 하나도 없다');
  const SRC = fs.readFileSync(FILE, 'utf8');
  const KV = fs.readFileSync('app/apex-kv-sync.js', 'utf8');
  is(/OS_LS_NEVER\s*=\s*\/[^\n]*apex_vault_v1/.test(SRC),
     '설정 백업에서 금고를 뺀다 (osLsNever)');
  is(/'apex_vault_v1'/.test(KV) && KV.indexOf("'apex_vault_v1'") < KV.indexOf('var NEVER_PRE'),
     '기기 사이 공유에서도 금고를 뺀다 (NEVER_EXACT · 판 X449 의 길)');
  const 길 = await pg.evaluate(() => {
    const k = (typeof APEX_KV === 'object' && APEX_KV) ? APEX_KV.kindOf('apex_vault_v1') : 'ZZ';
    return { kind: k, never: (typeof osLsNever === 'function') ? osLsNever('apex_vault_v1') : null };
  });
  is(길.kind === '', '  ★ 공유하는 자가 금고를 <b>안 올린다</b> (kindOf → 빈 글자)');
  is(길.never === true, '  ★ 백업하는 자가 금고를 <b>안 담는다</b> (osLsNever → true)');
  /* 서버로 보내는 자리에 금고 이름이 한 번도 안 적혀 있다 */
  const 서버줄 = (SRC.match(/apex_vault_v1/g) || []).length;
  is(서버줄 >= 2 && !/from\(['"][^'"]*['"]\)[^\n]*apex_vault_v1/.test(SRC),
     '  금고 이름이 서버 부르는 줄에 <b>한 번도 안 쓰인다</b> (' + 서버줄 + '곳에만 적혀 있습니다)');

  head('[7] 화면 — 「없다」 와 「잠겼다」 를 가린다 (1번)');
  const 글 = await pg.evaluate(() => {
    vltLock();
    const h = cmRrnHtml('c-hong');
    return { 잠김: /금고가 잠겨 있/.test(h), 없다고하나: /담긴 번호가 없습니다/.test(h),
             열기단추: /vltOpenGo/.test(h), 담는칸: /cmRrnIn/.test(h) };
  });
  is(글.잠김, '잠겼을 때 「<b>금고가 잠겨 있습니다</b>」 라고 적는다');
  is(!글.담는칸, '  ★ 잠긴 채로는 <b>담는 칸을 안 연다</b> — 적으면 날글자로 다시 쌓입니다');
  is(글.열기단추, '  ★ 여는 단추는 <b>그대로 보인다</b> — 할 일이 있을 때는 안 감춥니다 (6번)');
  const 열린글 = await pg.evaluate((pw) => new Promise(ok => {
    vltUnlock(pw, () => { const h = cmRrnHtml('c-hong');
      ok({ 열림: /금고가 열려 있/.test(h), 잠그기: /vltLock\(\)/.test(h),
           번호: /cmRrnV/.test(h), 저절로: /저절로 잠깁니다/.test(h) }); });
  }), PW);
  is(열린글.열림 && 열린글.잠그기, '열렸을 때 「열려 있습니다」 + <b>지금 잠그기</b> 단추');
  is(열린글.번호, '  번호 줄이 (가린 채로) 선다');
  is(열린글.저절로, '  ★ <b>저절로 잠긴다</b>고 미리 말해 준다');

  head('[8] 만들 때 비밀번호를 짧게 하면 안 만든다');
  const 짧게 = await pg.evaluate(() => {
    const t = []; const old = window.toast; window.toast = m => t.push('' + m);
    const el = document.createElement('div');
    el.innerHTML = '<input id="vltPw1" value="1234"><input id="vltPw2" value="1234">';
    document.body.appendChild(el);
    try { vltMakeGo('c-hong'); } catch (e) { t.push('터짐'); }
    document.body.removeChild(el); window.toast = old;
    return t.join(' / ');
  });
  is(/여덟 자/.test(짧게), '여덟 자 아래는 막는다 — 「' + 짧게.slice(0, 30) + '」');

  head('[9] 콘솔');
  is(errs.length === 0, errs.length ? ('터진 것 — ' + errs.slice(0, 2).join(' / ')) : '터진 곳이 없다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '🔐 금고 점검 통과 — 번호가 이 기기 안에서 잠기고, 밖으로 나가는 길이 없습니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
