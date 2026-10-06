/* ══════════════════════════════════════════════════════════════════
   check-hwho.js — <b>관리자가 「다른 사람들 것」 을 볼 길이 오늘 칸에 있나.</b>

   ── 왜 이 자를 세웠나 (2026-10-06) ───────────────────────────────
   사장님 말씀 — <b>「오늘 에서 다른 사람들 것도 관리자가 볼수 있도록 해야지
   … 핸드폰에서 안보여 보이게 만들어」</b>.

   폭 문제가 아니었습니다. 폰 390 과 컴퓨터 1280 을 나란히 띄워 재 보니
   <b>둘 다 똑같이 고르개가 안 섰습니다.</b> 홈이 <b>실제로 들고 있는 창고</b>
   만 채워 놓고 재니 까닭이 나왔습니다 —

     CM.who(profiles) 18명 · <b>AR.db 0줄</b> · <b>GB.rows 0줄</b>

   홈은 arLoad()·gbLoad() 를 <b>부르지 않습니다</b>(7번 — 무료 한도를 세 배로
   넘긴 그 자리). 그런데 명단을 <b>AR.db(오늘 챙길 것이 있는 사람)</b> 에서
   만들고 있었습니다. 그래서 홈에서는 사람이 <b>나 한 사람</b>뿐이고,
   「고를 사람이 없으면 세우지 않는다」 가 <b>띠를 통째로 지웠습니다.</b>
   컴퓨터에서 보이던 까닭은 <b>길</b>입니다 — 「나」나 고객 365일을 한 번
   지나면 그쪽에서 창고를 채우기 때문입니다. 폰에서는 오늘만 보니 안 찹니다.

   ── 보는 것 (넓게 잡지 않습니다 · 8번) ───────────────────────────
     [1] 묻는 곳이 <b>하나</b>인가 — 이름은 hwhoName · 셈 여부는 hwhoHasN (5번)
     [2] ★★ <b>홈 창고만으로도 띠가 서나</b> — 폰과 컴퓨터 둘 다
     [3] ★★ <b>아무도 말없이 사라지지 않나</b> — 열네 명에서 자르던 자리
     [4] ★ <b>조용한 날에도 사람이 남나</b> — 오늘 0건인 분도 고를 수 있나
     [5] ★ <b>모르는 것을 지어내지 않나</b> — 팀을 모르면 아무도 안 세운다 (1·3번)
         설계사에게는 <b>안 선다</b>
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = process.cwd();
const PORT = 9141;
const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json',
               '.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/json'};
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const SRC = fs.readFileSync('app/index.html', 'utf8');
const 몸 = (nm) => {
  const i = SRC.indexOf('function ' + nm + '(');
  if (i < 0) return '';
  const j = SRC.indexOf('\nfunction ', i + 1);
  return SRC.slice(i, j > i ? j : i + 6000);
};
/* ★★ <b>주석을 먼저 떼고 봅니다.</b> 안 떼면 <b>제 설명이 알리바이</b>가
   됩니다 — hmArm 안에 「arLoad()·gbLoad() 가 홈을 열 때마다 서버까지
   갑니다」 라고 <b>안 부른다는 설명</b>이 적혀 있어서, 글로 찾으면 그것이
   부르는 자리로 읽힙니다. 이 세션에서 벌써 세 번 겪은 병입니다 (8번).  */
const 코드만 = (t) => (t || '').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

console.log('[1] 묻는 곳이 <b>하나</b>인가 (5번)');
const L몸 = 몸('hwhoList'), B몸 = 몸('hwhoBarHtml');
is(!!L몸 && !!B몸, '  hwhoList · hwhoBarHtml 의 몸을 <b>찾았다</b>' +
   ((L몸 && B몸) ? '' : ' ← 이름이 바뀌었으면 이 자도 고쳐야 합니다'));
/* 이름을 두 곳에서 다르게 물으면 <b>같은 사람이 두 이름</b>으로 적힌다.
   예전에 hwhoList 는 arNameOf(GB.rows 만 봄) 를, 띠는 hwhoName(CM.who 도 봄)
   을 불러, 홈에서 전원이 「팀원」 이었습니다. */
is(!!L몸 && !/arNameOf\s*\(/.test(L몸),
   '  ★ hwhoList 가 <b>arNameOf 를 직접 안 부른다</b> — 이름은 hwhoName 한 곳' +
   (/arNameOf\s*\(/.test(L몸) ? ' ← GB.rows 만 보므로 홈에서 전원이 「팀원」 이 됩니다' : ''));
is(/function\s+hwhoName\s*\(/.test(SRC) && /hwhoName\s*\(\s*ids\[i\]\s*\)/.test(L몸),
   '  ★ hwhoList 가 <b>hwhoName 에게 묻는다</b>');
is((SRC.match(/function\s+hwhoHasN\s*\(/g) || []).length === 1,
   '  ★ 「오늘 건수를 셀 수 있나」 를 아는 곳이 <b>hwhoHasN 하나</b>다');
/* 모름은 osNoVal 한 곳이 적는다 (1번·5번) */
is(!!B몸 && /osNoVal\s*\(/.test(B몸),
   '  ★ 모름을 <b>osNoVal</b> 로 적는다 — 0 으로 적으면 「오늘 할 것이 없다」 는 거짓말' );
/* 말없는 자르기 금지 */
is(!!B몸 && !/i\s*<\s*14/.test(B몸),
   '  ★ 열네 명에서 <b>말없이 자르지 않는다</b>' +
   (/i\s*<\s*14/.test(B몸) ? ' ← 열여덟 분이면 네 분은 열 길이 아예 없습니다' : ''));
is(!!B몸 && /hwhoMore\(\)/.test(B몸) && /function\s+hwhoMore\s*\(/.test(SRC),
   '  ★ 넘치면 <b>「＋N명 더」</b> 로 접는다 — 접힌 것은 펼 수 있다 (6번)');
/* ★ 이 판의 <b>전제</b> — 홈은 서버를 스스로 안 부릅니다 (7번).
     전제가 깨지면 이 자가 지키는 설계도 뜻이 없어지므로 같이 봅니다. */
const 홈 = 코드만(몸('hmArm') + 몸('hmTodayHtml'));
is(!!홈 && !/\barLoad\s*\(/.test(홈) && !/\bgbLoad\s*\(/.test(홈),
   '  ★ 홈이 <b>arLoad·gbLoad 를 스스로 안 부른다</b> (7번 — 무료 한도 사고)' );
is(/function\s+hwhoReload\s*\(/.test(SRC) && /onclick="hwhoReload\(\)"/.test(B몸),
   '  ★ 읽기는 <b>눌렀을 때만</b> — ↻ 단추가 서 있다 (7번·6번)');

(async () => {
  console.log('\n[2]~[5] <b>브라우저로 재 봅니다</b> — 홈 창고만 채워 놓고');
  const srv = http.createServer((q, s) => {
    const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    fs.readFile(f, (e, b) => { if (e) { s.writeHead(404); s.end(''); }
      else { s.writeHead(200, {'content-type': MIME[path.extname(f)] || 'application/octet-stream'}); s.end(b); } });
  });
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch();

  /* ★ <b>홈이 실제로 들고 있는 것만</b> 채웁니다 — 그것이 사장님이 폰에서
       오늘만 여셨을 때의 모양입니다. 더 채우면 이 자가 헛것이 됩니다 (8번). */
  const SEED = (cfg) => {
    try { localStorage.setItem('apex_login_ok', '1'); } catch (e) {}
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients','osCliInfoLoad',
     'osRepListLoad','osLoadAnalysis','nlLoad','gbLoad'].forEach(k => { window[k] = function () {}; });
    window.toast = function () {};
    window.cmLoadAll = function (cb) { if (cb) cb(); };
    window.osTabAllowed = function () { return true; };
    window.setupDone = function () { return true; };
    window.setupCanRun = function () { return true; };
    OS.profile = {id:'me', user_id:'me', name:'홍길동', role:cfg.role, active:true, plan:'vip', team_id:'t1'};
    OS.session = {user:{id:'me'}};
    const chain = v => { const o = {then:function (f) { try { f(v); } catch (e) {} return o; }, catch:function () { return o; }};
      ['eq','neq','select','order','limit','in','gte','lte','is','not','or','filter','ilike','like','range','contains','overlaps']
        .forEach(k => { o[k] = function () { return o; }; });
      o.single = function () { return chain({data:null}); };
      o.maybeSingle = function () { return chain({data:null}); }; return o; };
    window.osClient = function () { return {from:function () { return {
      select:function () { return chain({data:[], count:0}); }, update:function () { return chain({}); },
      insert:function () { return chain({}); }, upsert:function () { return chain({}); },
      delete:function () { return chain({}); }}; }, rpc:function () { return chain({data:[]}); }}; };
    /* 견본 이름은 <b>홍길동</b> 입니다 — 실제 고객 이름 금지 (3번) */
    var 사람 = [['me','홍길동']], i2;
    for (i2 = 2; i2 <= cfg.n; i2++) 사람.push(['m' + i2, '홍길순' + i2]);
    CM.who = {}; 사람.forEach(p => { CM.who[p[0]] = p[1]; });
    CM.loaded = true; CM.meta = {};
    if (cfg.gb) { GB.rows = 사람.map(p => ({id:p[0], name:p[1]}));
      GB.teamOf = {}; 사람.forEach(p => { GB.teamOf[p[0]] = 't1'; });
      GB.teams = [{id:'t1', name:'A팀'}]; GB.loaded = true; }
    else { GB.rows = []; GB.teamOf = {}; GB.teams = []; GB.loaded = false; }
    AR.cliRows = []; AR.db = [];
    if (cfg.ar) { AR.loaded = true; AR.busy = '';
      var n = 0, 몇 = cfg.few ? 3 : 사람.length;
      사람.forEach(function (p, pi) { if (pi >= 몇) return;
        for (var i = 0; i < (pi % 4) + 1; i++)
          AR.db.push({id:'d' + (++n), name:'홍길동', stage:'AP', who:p[0], days:1, region:'서울', src:'db'}); }); }
    else { AR.loaded = false; AR.busy = ''; }
    OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = [];
    go('home');
  };
  const 본다 = pg => pg.evaluate(() => {
    const T = e => (e.textContent || '').trim().replace(/[\s ]+/g, ' ');
    const hw = document.querySelector('.hwho');
    return {
      can: (() => { try { return !!hwhoCan(); } catch (e) { return null; } })(),
      명단: (() => { try { return (hwhoList() || []).length; } catch (e) { return -1; } })(),
      띠: !!hw,
      칩: [].map.call(document.querySelectorAll('.hwho-c'), e => T(e)),
      흐린칩: document.querySelectorAll('.hwho-c.z').length,
      더: [].map.call(document.querySelectorAll('.hwho-more'), e => T(e)),
      까닭: (() => { const n = document.querySelector('.hwho-none'); return n ? T(n) : ''; })(),
      모름: hw ? (hw.innerHTML.match(/—/g) || []).length : 0
    };
  });
  const 열기 = async (cfg, w) => {
    const ctx = await br.newContext({viewport:{width:w, height:844}});
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const pg = await ctx.newPage(); pg.on('pageerror', () => {});
    await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', {waitUntil:'domcontentloaded'});
    await pg.waitForTimeout(2300);
    await pg.evaluate(([t, c]) => { eval('(' + t + ')')(c); }, [SEED.toString(), cfg]);
    await pg.waitForTimeout(1500);
    return {ctx:ctx, pg:pg};
  };

  try {
    /* ── [2] 홈 창고만으로도 띠가 서나 — <b>폰과 컴퓨터 둘 다</b> ── */
    for (const w of [390, 1280]) {
      const {ctx, pg} = await 열기({role:'owner', n:18, ar:false, gb:false}, w);
      const r = await 본다(pg);
      is(r.띠, '  [2] ' + w + 'px — <b>고르개가 선다</b>' +
         (r.띠 ? ' · 명단 ' + r.명단 + '명 · 칩 ' + r.칩.length + '개' :
          ' ← 관리자가 다른 사람 것을 볼 길이 화면에 <b>없습니다</b>'));
      is(r.칩.length >= 3, '  [2] ' + w + 'px — 칩이 <b>세 개 이상</b> 선다 (사람 + 팀 전체)');
      /* 못 읽은 건수를 <b>0 으로 적지 않는다</b> (1번) */
      is(r.모름 >= 2, '  [2] ' + w + 'px — 오늘 건수를 <b>모름(—)</b> 으로 적는다' +
         (r.모름 >= 2 ? ' (' + r.모름 + '군데)' : ' ← 0 으로 적으면 「오늘 할 것이 없다」 는 뜻이 됩니다'));
      is(/오늘 건수는/.test(r.까닭), '  [2] ' + w + 'px — <b>왜 모르는지</b> 화면이 말한다');
      await ctx.close();
    }
    /* ── [3] 아무도 말없이 사라지지 않나 ── */
    {
      const {ctx, pg} = await 열기({role:'owner', n:18, ar:true, gb:true}, 390);
      const r = await 본다(pg);
      const 더 = r.더.filter(x => /명 더/.test(x));
      is(r.명단 === 18, '  [3] 열여덟 분이 <b>다 명단에 있다</b> — ' + r.명단 + '명');
      is(더.length === 1, '  [3] <b>「＋N명 더」 가 서 있다</b> — ' + (더[0] || '없음') +
         (더.length === 1 ? '' : ' ← 넘치는 분이 말없이 사라집니다'));
      const btn = await pg.$('.hwho-more');
      if (btn) { await btn.click(); await pg.waitForTimeout(600); }
      const r2 = await 본다(pg);
      is(r2.칩.length === 19, '  [3] 누르면 <b>열여덟 분 + 팀 전체</b> 가 다 선다 — ' + r2.칩.length + '개');
      is(r2.더.some(x => /접기/.test(x)), '  [3] 펴 놓으면 <b>접기</b> 가 선다');
      await ctx.close();
    }
    /* ── [4] 조용한 날에도 사람이 남나 ── */
    {
      const {ctx, pg} = await 열기({role:'owner', n:18, ar:true, gb:true, few:true}, 390);
      const r = await 본다(pg);
      is(r.명단 === 18, '  [4] 오늘 건수가 <b>세 분뿐</b>인 날에도 명단은 열여덟 — ' + r.명단 + '명' +
         (r.명단 === 18 ? '' : ' ← 명단을 「오늘 건수」 에서 만들면 조용한 날 사람이 사라집니다'));
      is(r.흐린칩 >= 1, '  [4] 오늘 <b>0건인 분</b>도 칩으로 선다 (흐리게 · ' + r.흐린칩 + '개)');
      is(r.띠, '  [4] 띠가 <b>사라지지 않는다</b>');
      /* ★★ <b>0건인 분을 골라도 글자가 보이나.</b> 「연하게」 를 .on 보다
           뒤에 적으면 셈이 같아(0,2,0) <b>나중 것이 이겨</b> 파란 칩에
           회색 글자가 됩니다 — 이 세션에서 .t-skin button 으로 똑같이
           한 번 깨졌습니다. 색을 눈으로 안 믿고 <b>재서</b> 봅니다.      */
      const z = await pg.$('.hwho-c.z');
      if (z) {
        await z.click(); await pg.waitForTimeout(600);
        const g = await pg.evaluate(() => {
          const e = document.querySelector('.hwho-c.on');
          if (!e) return null;
          const cs = getComputedStyle(e);
          const n = v => (String(v).match(/[\d.]+/g) || []).slice(0, 3).map(Number);
          const lum = c => { const f = c.map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
            return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
          const a = lum(n(cs.color)), b = lum(n(cs.backgroundColor));
          return {색:cs.color, 바탕:cs.backgroundColor, 대비:Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100};
        });
        is(!!g && g.대비 >= 4.5,
           '  [4] ★★ 0건인 분을 <b>골라도 글자가 보인다</b>' +
           (g ? ' — ' + g.색 + ' / ' + g.바탕 + ' 대비 ' + g.대비 + ':1' : ' ← 고른 칩을 못 찾았습니다') +
           (g && g.대비 < 4.5 ? ' ← 「연하게」 가 「골랐다」 를 덮었습니다 (CSS 자리)' : ''));
      } else is(false, '  [4] 0건 칩을 <b>못 찾았다</b> — 위 자가 먼저 울려야 합니다');
      await ctx.close();
    }
    /* ── [5] 모르는 것을 지어내지 않나 (1번·3번) ── */
    {
      const {ctx, pg} = await 열기({role:'manager', n:18, ar:false, gb:false}, 390);
      const r = await 본다(pg);
      is(r.띠 && r.칩.length === 0,
         '  [5] 팀장이 <b>팀 나눔을 못 읽었으면 아무도 안 세운다</b>' +
         (r.칩.length ? ' ← 칩 ' + r.칩.length + '개 — 남의 팀이 섞입니다 (3번)' : ' · 띠는 그대로 선다'));
      is(/내 팀인지 아직 못 읽었습니다/.test(r.까닭),
         '  [5] <b>까닭을 적고 ↻ 단추를 세운다</b> — 사라지지 않는다 (6번)');
      await ctx.close();
    }
    {
      const {ctx, pg} = await 열기({role:'member', n:18, ar:true, gb:true}, 390);
      const r = await 본다(pg);
      is(r.can === false && !r.띠,
         '  [5] <b>설계사에게는 안 선다</b> — 못 보시는 분께 세워 봐야 눌러도 아무 일이 없습니다 (8번)');
      await ctx.close();
    }
  } catch (e) {
    is(false, '  재는 중에 터졌습니다 — ' + (e && e.message));
  }
  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 관리자가 「다른 사람들 것」 을 볼 길이 폰에도 서 있고, 아무도 말없이 사라지지 않습니다.');
  process.exit(bad ? 1 : 0);
})();
