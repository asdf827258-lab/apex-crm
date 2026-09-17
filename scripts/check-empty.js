/* ══════════════════════════════════════════════════════════════════
   check-empty.js — <b>「아직」·「없음」·「못 받음」이 다른 화면인가.</b>

   재 보고 알았습니다. 홈을 세 상태로 열어 글자를 찍어 보니 —

     ① 아직 안 왔을 때   1,082자 「오늘 챙길 것이 <b>없습니다</b>」
     ② 진짜 0건일 때     1,116자 「오늘 챙길 것이 <b>없습니다</b>」
     ③ 못 받았을 때      1,082자 「오늘 챙길 것이 <b>없습니다</b>」

   <b>세 자리가 같은 말을 했습니다.</b> 고객 앞에서 서버가 잠깐 안 되면
   화면은 「오늘 챙길 것이 없습니다」 라고 단정하고, 사장님은 그날 전화를
   통째로 건너뜁니다. 못 읽은 것을 0 으로 적으면 <b>「없다」는 뜻</b>이
   되어 버립니다 — CLAUDE.md <b>1번</b> 그대로입니다.

   이 점검은 <b>세 화면이 서로 다른가</b>를 봅니다. 예쁜지는 안 묻습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     ① 세 상태의 글자가 <b>서로 다른가</b> (같으면 그 자리에서 빨간불)
     ② 아직일 때  — <b>뼈대</b>가 서고 「없습니다」라고 <b>단정하지 않는가</b>
     ③ 못 받았을 때 — 까닭과 <b>다시 읽기</b> 단추가 있는가
     ④ 없을 때    — <b>무엇이 채우는지</b>와 갈 단추가 있는가
     ⑤ 숫자를 <b>지어내지 않는가</b> — 모르는데 「0건」·「0명」을 안 적는가
     ⑥ 조사가 맞는가 — 「것<b>를</b>」·「것<b>이(가)</b>」 가 안 나오는가
     ⑦ 넘어져도 <b>「읽는 중」에 갇히지 않는가</b>
     ⑧ 새로 세운 칸도 <b>13px·44px 바닥</b>을 지키는가

   ★ 바깥으로 안 나갑니다. CI 는 인터넷이 되므로, 막지 않으면 늦게 온
     응답이 심어 둔 값을 덮어써 <b>CI 에서만</b> 빨간불이 켜집니다 (8번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8991;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* 견본은 <b>홍길동</b> 집안입니다 (3번) */
const BOOT = `
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(function(x){x.remove()});
  window.toast=function(){};
  /* 진짜 불러오기를 <b>손에 쥐고</b> 덮어씁니다 — 안 쥐면 [8] 에서 진짜를
     못 불러 「못 받았다고 적는가」 를 <b>가짜에게 묻게</b> 됩니다 (5번) */
  window.__realCliLoad=window.osLoadClients;
  window.arLoad=function(){window.__arLoadCalled=(window.__arLoadCalled||0)+1;};
  window.osLoadClients=function(){window.__cliLoadCalled=(window.__cliLoadCalled||0)+1;};
  OS.session={user:{id:'u1'}};
  OS.profile={id:'u1',name:'윤시현',role:'owner',active:true,plan:'vip'};`;

/* 세 상태를 심는 곳도 <b>한 곳</b>입니다 — 상태마다 따로 적으면 한쪽만 고칩니다 (5번) */
const PUT = `function(st){
  var S={
    wait:{loaded:false,err:'',busy:true},
    none:{loaded:true, err:'',busy:false},
    fail:{loaded:true, err:'Failed to fetch',busy:false}
  }[st];
  OSC.loaded=S.loaded;OSC.err=S.err;OSC.busy=S.busy;OSC.list=[];OSC.q='';
  AR.loaded=S.loaded;AR.err=S.err;AR.busy=S.busy?'load':'';
  AR.db=[];AR.cliRows=[];AR.calls=[];AR.cat='touch';AR.tk='all';AR.tks='';
}`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  /* 바깥은 막습니다 — 재는 것은 우리 화면이지 서버가 아닙니다 */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(2200);
  await pg.evaluate(BOOT);
  await pg.evaluate(`window.__put=${PUT};`);

  const shot = async (st, tab) => await pg.evaluate((a) => {
    window.__put(a.st);
    try { go(a.tab); } catch (e) { return { err: String(e).slice(0, 120) }; }
    const p = document.getElementById('dynPane');
    if (!p) return { err: 'no pane' };
    const vis = (sel) => [...p.querySelectorAll(sel)].filter(e => e.offsetParent);
    return {
      txt: (p.innerText || '').replace(/\s+/g, ' ').trim(),
      html: p.innerHTML,
      skel: vis('.hold-sk').length,
      fail: vis('.hold-fail').length,
      none: vis('.hold-none').length,
      again: vis('.hold-go').map(e => (e.innerText || '').trim()),
      /* 새로 세운 칸도 손이 닿아야 합니다 (2단계) */
      smallBtn: vis('.hold-go').filter(e => e.getBoundingClientRect().height < 44).length,
      tiny: vis('.hold-b,.hold-n,.hold-t,.hold-m,.hold-y,.hold-go')
              .filter(e => parseFloat(getComputedStyle(e).fontSize) < 13).length
    };
  }, { st, tab });

  head('[1] <b>세 상태가 서로 다른 화면인가</b> — 홈');
  const hw = await shot('wait', 'home'), hn = await shot('none', 'home'), hf = await shot('fail', 'home');
  is(hw.txt !== hn.txt, '<b>아직</b>과 <b>없음</b>이 다르다 — ' + hw.txt.length + '자 / ' + hn.txt.length + '자');
  is(hn.txt !== hf.txt, '<b>없음</b>과 <b>못 받음</b>이 다르다 — ' + hn.txt.length + '자 / ' + hf.txt.length + '자');
  is(hw.txt !== hf.txt, '<b>아직</b>과 <b>못 받음</b>이 다르다');

  head('[2] <b>아직일 때</b> — 「없습니다」라고 단정하지 않는다 (1번)');
  is(hw.skel > 0, '<b>뼈대</b>가 선다 — 올 것의 모양을 세워 화면이 안 튄다 (' + hw.skel + '자리)');
  is(!/오늘 챙길 것이 <em>없습니다<\/em>/.test(hw.html), '머리줄이 <b>「없습니다」라고 안 적는다</b>');
  is(/읽는 중/.test(hw.txt), '<b>읽는 중</b>이라고 적는다');
  is(/아직 「없다」는 뜻이 아닙니다/.test(hw.txt), '<b>「없다는 뜻이 아니다」</b>라고 못 박는다');
  is(hw.fail === 0 && hw.none === 0, '아직인데 <b>실패·빈 손 칸을 세우지 않는다</b>');

  head('[3] <b>못 받았을 때</b> — 왜 그런지와 다시 읽을 자리');
  is(hf.fail > 0, '<b>못 받음 칸</b>이 선다');
  is(/못 받았습니다/.test(hf.txt), '<b>못 받았다</b>고 말한다 — 실패를 성공처럼 말하지 않는다 (1번)');
  is(/0건이라는 뜻이 아니/.test(hf.txt), '<b>0건이 아니라고</b> 못 박는다');
  is(/Failed to fetch/.test(hf.txt), '<b>서버가 준 말</b>을 그대로 옮긴다 — 지어내지 않는다 (1번)');
  is(hf.again.length > 0 && /다시 읽기/.test(hf.again.join(' ')), '<b>다시 읽기</b> 단추가 선다 (' + hf.again.join(' · ') + ')');
  is(hf.skel === 0, '못 받았는데 <b>뼈대를 돌리지 않는다</b> — 영영 기다리는 것처럼 보인다');

  head('[4] <b>없을 때</b> — 무엇이 채우는지와 갈 자리');
  is(hn.none > 0, '<b>빈 손 칸</b>이 선다');
  is(/오늘 챙길 것이 <em>없습니다<\/em>/.test(hn.html), '이때는 <b>「없습니다」라고 적는다</b> — 다 왔으니 그렇게 말할 자격이 있다');
  is(/고객을 넣고 상태를 적어/.test(hn.txt), '<b>무엇이 채우는지</b> 말한다');
  is(/onclick="go\('clients'\)"/.test(hn.html), '<b>채우러 갈 단추</b>가 선다');

  head('[5] <b>숫자를 지어내지 않는다</b> — 고객 365일 「오늘 N건」');
  const cw = await shot('wait', 'clients'), cn = await shot('none', 'clients'), cf = await shot('fail', 'clients');
  is(!/오늘 0건/.test(cw.txt), '아직일 때 <b>「오늘 0건」이라 안 적는다</b>');
  is(!/오늘 0건/.test(cf.txt), '못 받았을 때 <b>「오늘 0건」이라 안 적는다</b>');
  is(/오늘 <b>읽는 중<\/b>|오늘 읽는 중/.test(cw.html), '아직일 때 <b>읽는 중</b>이라 적는다');
  is(/오늘 <b>못 받음<\/b>|오늘 못 받음/.test(cf.html), '못 받았을 때 <b>못 받음</b>이라 적는다');
  is(/오늘 0건/.test(cn.txt), '다 왔는데 0건이면 <b>그때는 0건이라 적는다</b> — 있는 것을 숨기지도 않는다');

  head('[6] <b>오늘 터치할 사람</b> — 모르는데 쪽지를 0명으로 안 세운다');
  const tw = await pg.evaluate(() => { window.__put('wait'); AR.cat = 'touch'; go('airep'); try { arPaint(); } catch (e) {}
    const p = document.getElementById('dynPane'); return { txt: (p.innerText || '').replace(/\s+/g, ' '), skel: p.querySelectorAll('.hold-sk').length }; });
  const tf = await pg.evaluate(() => { window.__put('fail'); AR.cat = 'touch'; go('airep'); try { arPaint(); } catch (e) {}
    const p = document.getElementById('dynPane'); return { txt: (p.innerText || '').replace(/\s+/g, ' '), fail: p.querySelectorAll('.hold-fail').length }; });
  is(!/진행중 — 지금 붙어야/.test(tw.txt), '아직일 때 <b>다섯 쪽지를 안 세운다</b> — 값이 없으면 화면을 안 세운다 (1번)');
  is(tw.skel > 0, '대신 <b>뼈대</b>를 세운다');
  is(!/진행중 — 지금 붙어야/.test(tf.txt), '못 받았을 때도 <b>쪽지를 안 세운다</b>');
  is(tf.fail > 0 && /못 받았습니다/.test(tf.txt), '<b>못 받았다</b>고 말한다');

  head('[7] <b>조사</b>가 맞는가 — 고객 앞에 띄우는 글이다');
  const all = [hw, hn, hf, cw, cn, cf].map(x => x.txt).join(' ') + ' ' + tw.txt + ' ' + tf.txt;
  is(!/것를|사람를|목록를/.test(all), '받침 뒤에 <b>「를」</b>이 안 붙는다');
  is(!/것가|사람가|목록가/.test(all), '받침 뒤에 <b>「가」</b>가 안 붙는다');
  is(!/이\(가\)|을\(를\)|은\(는\)/.test(all), '<b>「이(가)」처럼 둘 다 적지 않는다</b>');

  head('[8] <b>넘어져도 「읽는 중」에 갇히지 않는다</b>');
  const stuckOk = await pg.evaluate(() => {
    /* 서버가 없다고 답하게 한다 — 여태는 <b>조용히 돌아가</b> busy 가 굳었다 */
    const real = window.osClient; window.osClient = function () { return null; };
    OSC.loaded = false; OSC.busy = false; OSC.err = '';
    try { window.__realCliLoad(); } catch (e) { window.osClient = real; return { boom: String(e).slice(0, 80) }; }
    window.osClient = real;
    return { busy: OSC.busy, loaded: OSC.loaded, err: OSC.err };
  });
  is(stuckOk.busy === false && !stuckOk.boom, '서버가 없으면 <b>「읽는 중」으로 안 굳는다</b> (busy=' + stuckOk.busy + ')');
  is(stuckOk.loaded === true && !!stuckOk.err, '<b>못 받았다고 적는다</b> — ' + (stuckOk.err || '(안 적음)'));

  head('[9] <b>다시 읽기</b>가 진짜로 다시 부르는가 — 안 울리는 알람은 알람이 아니다 (8번)');
  const again = await pg.evaluate(() => {
    window.__arLoadCalled = 0; window.__cliLoadCalled = 0;
    window.arLoad = function () { window.__arLoadCalled++; };
    window.osLoadClients = function () { window.__cliLoadCalled++; };
    window.__put('fail');
    go('home');
    const btn = [...document.querySelectorAll('#dynPane .hold-go')].filter(e => /다시 읽기/.test(e.innerText))[0];
    if (!btn) return { no: true };
    btn.click();
    return { ar: window.__arLoadCalled, cli: window.__cliLoadCalled, err: OSC.err, loaded: OSC.loaded };
  });
  is(!again.no, '<b>다시 읽기</b> 단추를 화면에서 찾을 수 있다');
  is(again.cli > 0, '누르면 <b>고객 목록을 다시 부른다</b> (' + again.cli + '번)');
  is(again.ar > 0, '누르면 <b>배정 DB 도 다시 부른다</b> (' + again.ar + '번)');
  is(again.err === '', '누르면 <b>「못 받음」 자국을 지운다</b> — 안 지우면 다시 받아도 빨간 칸이 남는다');

  head('[10] <b>새로 세운 칸</b>도 바닥을 지키는가 (1·2단계)');
  const floors = [hw, hn, hf, cw, cn, cf];
  is(floors.every(x => x.tiny === 0), '<b>13px 아래 글자가 0개</b>');
  is(floors.every(x => x.smallBtn === 0), '<b>44px 아래 단추가 0개</b>');

  /* ── DB 통합 CRM — <b>다른 파일, 같은 판</b> ────────────────────────
     사장님이 제일 먼저 말씀하신 화면입니다. 여태 이 화면은 못 받아도
     <b>토스트 한 줄</b>만 띄우고 표는 「조회할 DB가 없습니다」로 남았습니다.
     토스트는 몇 초 뒤 사라지고, 남은 글자는 <b>배정이 안 온 것</b>과 똑같습니다. */
  head('[12] <b>DB 통합 CRM</b> 도 세 상태가 다른가 — 같은 판(apex-hold.js)을 쓴다');
  const cp = await ctx.newPage();
  const cerrs = [];
  cp.on('pageerror', e => cerrs.push(String(e).slice(0, 160)));
  await cp.goto('http://127.0.0.1:' + PORT + '/db-crm.html', { waitUntil: 'domcontentloaded' });
  await cp.waitForTimeout(1500);
  const crm = async (st) => await cp.evaluate((s) => {
    document.getElementById('configScreen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    window.toast = function () {};
    profile = { id: 'me', name: '홍길동', role: 'admin', active: true };
    profiles = [profile]; calls = []; dbs = []; crmTeams = []; crmTeamOf = {}; cliKeys = {};
    DBL.loaded = (s !== 'wait'); DBL.busy = (s === 'wait'); DBL.err = (s === 'fail') ? 'Failed to fetch' : '';
    try { goPage('db'); renderDb(); } catch (e) { return { boom: String(e).slice(0, 110) }; }
    const t = document.getElementById('dbBody');
    const sk = t.querySelector('.hold-skc');
    return {
      txt: (t.innerText || '').replace(/\s+/g, ' ').trim(),
      skel: t.querySelectorAll('.hold-sk').length,
      fail: t.querySelectorAll('.hold-fail').length,
      again: [...t.querySelectorAll('.hold-go')].map(e => (e.innerText || '').trim()),
      /* ★ 토큰이 <b>없는</b> 화면이다. 대체값을 안 달면 이 줄이 통째로 무효가 되어
         뼈대가 <b>투명하게</b> 선다 — 화면은 멀쩡한데 아무것도 안 보인다. */
      skBg: sk ? getComputedStyle(sk).backgroundColor : '',
      skH: sk ? Math.round(sk.getBoundingClientRect().height) : 0,
      goH: [...t.querySelectorAll('.hold-go')].map(e => Math.round(e.getBoundingClientRect().height))
    };
  }, st);
  const kw = await crm('wait'), kn = await crm('none'), kf = await crm('fail');
  is(!kw.boom && !kn.boom && !kf.boom, '세 상태를 그리는 동안 <b>안 터진다</b>' + (kw.boom || kn.boom || kf.boom || ''));
  is(kw.txt !== kn.txt && kn.txt !== kf.txt && kw.txt !== kf.txt, '<b>세 화면이 서로 다르다</b>');
  is(kw.skel > 0 && !/조회할 DB가 없습니다/.test(kw.txt), '아직일 때 <b>「없습니다」라고 안 하고 뼈대를 세운다</b>');
  is(kf.fail > 0 && !/조회할 DB가 없습니다/.test(kf.txt), '못 받았을 때 <b>「없습니다」라고 안 한다</b>');
  is(/Failed to fetch/.test(kf.txt), '<b>서버가 준 말</b>을 표에 그대로 적는다 — 토스트는 사라진다');
  is(kf.again.some(t => /다시 읽기/.test(t)), '<b>다시 읽기</b> 단추가 표 안에 선다');
  is(/조회할 DB가 없습니다/.test(kn.txt), '다 왔는데 0건이면 <b>그때는 없다고 적는다</b>');

  head('[13] <b>토큰이 없는 화면에서도 보이는가</b> — 제일 찾기 어려운 고장');
  is(/rgb\(/.test(kw.skBg) && kw.skBg !== 'rgba(0, 0, 0, 0)',
     '뼈대에 <b>색이 실제로 실린다</b> — ' + (kw.skBg || '(빈 값)') + ' · var() 에 대체값이 붙어 있다');
  is(kw.skH >= 20, '뼈대가 <b>높이를 갖는다</b> — ' + kw.skH + 'px');
  is(kf.goH.length > 0 && kf.goH.every(h => h >= 44), '다시 읽기 단추가 <b>44px 이상</b> — ' + kf.goH.join('·') + 'px');

  head('[11] 이 판을 그리는 동안 <b>터진 곳이 없다</b>');
  is(errs.length === 0, '본체 콘솔 에러 ' + errs.length + '건' + (errs.length ? ' — ' + errs.slice(0, 3).join(' / ') : ''));
  is(cerrs.length === 0, 'CRM 콘솔 에러 ' + cerrs.length + '건' + (cerrs.length ? ' — ' + cerrs.slice(0, 3).join(' / ') : ''));

  console.log('\n' + (bad ? ('✗ 빈 손·기다림·실패 — ' + bad + '자리가 막혔습니다')
                          : '✓ 빈 손·기다림·실패가 서로 다른 화면입니다'));
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
