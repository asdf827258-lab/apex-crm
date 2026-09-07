#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   비대면 상담사진·멘트 점검

   비대면 상담은 사진 한 장을 보내고 <b>그 사진이 무슨 말인지 글로</b>
   적어 보내야 합니다. 사진과 할 말이 따로 있으면 사진만 덜렁 갑니다.

   여기서 지키는 것은 넷입니다.
     ① 사진과 <b>보낼 말</b>이 한 자리에 있나
     ② 자료를 <b>여기로 베껴 오지 않았나</b> — 베끼면 두 벌이 되어,
        저쪽에서 멘트를 고쳐도 여기는 옛말을 고객에게 보낸다 (5-1번)
     ③ 못 받아오면 <b>지어내지 않나</b> — 지어낸 멘트가 고객에게 간다 (1번)
     ④ <b>전송 금지 자료</b>가 보내기 화면에 섞이지 않나 (9번)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = process.cwd(), PORT = 8814;
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* ── 정적: 베껴 오지 않았나 ─────────────────────────────────── */
head('[1] 자료를 <여기로 베껴 오지 않았나> — 두 벌이 되면 옛말이 고객에게 간다');
is(/UTP_SITE\s*=\s*'https:\/\/apex-sangdam-photo\.netlify\.app\//.test(SRC),
   '원본 사이트를 <가리키기만> 한다');
/* 도해 목록을 저장소에 복사해 두면 여기서 걸린다 */
const copied = fs.existsSync(path.join(ROOT, 'app/상담사진')) ||
               fs.existsSync(path.join(ROOT, '상담사진')) ||
               /window\.DOHAE\s*=\s*\[/.test(SRC);
is(!copied, copied ? '도해 목록을 저장소에 베껴 뒀습니다 — 저쪽이 바뀌면 여기가 거짓말을 합니다'
                   : '도해 목록을 <저장소에 안 베꼈다> — 열 때 원본에서 한 번만 읽는다');
is(/utpImg\(n\)\{ return UTP_SITE/.test(SRC.replace(/\s+/g, ' ').replace(/function utpImg\(n\)\s*\{\s*return UTP_SITE/, 'utpImg(n){ return UTP_SITE')),
   '그림도 <원본 자리에서> 그대로 쓴다 — 옮겨 두면 그것도 두 벌이다');
is((SRC.match(/function utpImg\(/g) || []).length === 1,
   '그림 주소를 만드는 자리가 <하나뿐>이다 (5번)');

head('[2] 전송 금지 자료가 보내기 화면에 안 섞이나 (9번)');
const utp = SRC.slice(SRC.indexOf('var UTP_SITE='), SRC.indexOf('function renderFpDeck('));
is(!/보험아카데미|GALLERY|교재 캡처'\s*\+/.test(utp.replace(/교재 캡처\(타사[^<]*/g, '')),
   '교재 캡처(타사·도서)를 <목록에 안 담는다>');
/* 왜 없는지는 <b>소스가 아니라 화면</b>에서 잰다 — 주석에만 적혀 있으면
   사장님은 못 봅니다. 아래 [5] 에서 그린 화면을 보고 잽니다. */

head('[3] 그림을 한꺼번에 안 받나 (7번)');
is(/loading="lazy"/.test(utp), '눈에 들어올 때만 받는다 — 177장을 한 번에 안 받는다');
is(!/setInterval/.test(utp), '되풀이해서 부르는 타이머가 없다');

/* ── 브라우저 ───────────────────────────────────────────────── */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
               '.png': 'image/png', '.svg': 'image/svg+xml' };
const STUB = `
window.supabase={createClient:function(){
 var mk=function(t){var a={select:function(){return a},eq:function(){return a},order:function(){return a},
  limit:function(){return a},single:function(){return a},in:function(){return a},gte:function(){return a},
  lte:function(){return a},is:function(){return a},neq:function(){return a},not:function(){return a},
  range:function(){return a},insert:function(){return a},update:function(){return a},upsert:function(){return a},
  then:function(r){return Promise.resolve({data:[],error:null}).then(r)}};a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({})},getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'t',email:'t@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'t'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;
/* 견본 — 실제 자료가 아니라 같은 모양으로 새로 지은 것입니다 (3번) */
const FIX = `window.DOHAE=[
 {n:"t-guyeo",t:"급여와 비급여, 지갑에서 나가는 돈이 다르다",c:"의료비 현실",
  unit:"LEVEL 1 · 견본",sec:"견본 대목",
  say:["견본 메모 — 영수증은 총액이 아니라 환자부담을 본다"],
  cust:"병원비가 왜 사람마다 다른지 그림 하나 보내드려요.\\n\\n(견본 문장입니다)"},
 {n:"t-stent",t:"좁아진 혈관에 스텐트를 넣는다",c:"심장",unit:"",sec:"",say:[],
  cust:"심장 혈관 그림 보내드립니다.\\n\\n(견본 문장입니다)"},
 {n:"t-nosay",t:"보낼 말이 아직 안 적힌 그림",c:"심장",unit:"",sec:"",say:[],cust:""}
];`;

function serve() {
  return http.createServer((rq, rs) => {
    let p = decodeURIComponent(rq.url.split('?')[0].split('#')[0]);
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
    rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(rs);
  }).listen(PORT);
}

async function open(br, withData) {
  const ctx = await br.newContext({ viewport: { width: 1280, height: 900 } });
  /* 밖으로 나가는 것은 전부 막는다 — 점검이 인터넷에 좌우되면 안 된다.
     그래서 <b>자료를 못 받는 상황</b>이 기본값이 된다. */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(STUB);
  if (withData) await pg.addInitScript(FIX);
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', { timeout: 60000 });
  await pg.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 't', name: '점검', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 't', email: 't@t' } };
    window.toast = function () {};
    window.__copied = ''; window.__copyN = 0;
    window.copyText = function (s) { window.__copied = s; window.__copyN++; };
  });
  return { ctx, pg, errs };
}

(async () => {
  const srv = serve(), br = await chromium.launch();

  /* ─── 메뉴에 서 있나 ─── */
  let { ctx, pg, errs } = await open(br, true);
  head('[4] 상담 도구에 <서 있나>');
  const inMenu = await pg.evaluate(() => {
    let hit = null;
    TABS.forEach(g => (g.items || []).forEach(i => { if (i.id === 'utphoto') hit = { g: g.group, t: i.title }; }));
    return hit;
  });
  is(!!inMenu && inMenu.g === '상담 도구',
     inMenu ? ('「' + inMenu.g + '」 안에 <' + inMenu.t + '>로 서 있다') : '메뉴에 없다');

  await pg.evaluate(() => go('utphoto'));
  await pg.waitForFunction(() => {
    const b = document.getElementById('utpBody');
    return b && /장 담았습니다|장 ·|찾는 사진|못 받아왔습니다/.test(b.innerText);
  }, { timeout: 20000 }).then(() => 1, () => 0);

  head('[5] 사진과 <보낼 말>이 한 자리에 있나 — 비대면의 전부');
  const body = await pg.evaluate(() => document.getElementById('utpBody').innerHTML);
  is(/apex-sangdam-photo\.netlify\.app.*t-guyeo/.test(body.replace(/&#?\w+;/g, '')),
     '그림이 <원본 주소로> 걸린다');
  is(/병원비가 왜 사람마다 다른지/.test(body), '그 그림의 <보낼 말>이 같은 카드에 있다');
  /* 「설계사 참고」라는 <b>글자가 있나</b>가 아니라, 그 메모가 <b>접힌 칸 안에</b>
     있고 <b>닫혀 있나</b>를 잰다. 글자만 보면 딱지를 떼도 통과한다. */
  const fold = await pg.evaluate(() => {
    const d = document.querySelector('#utpBody details');
    const seen = document.getElementById('utpBody').innerText;   /* 눈에 보이는 글만 */
    return { has: !!d, open: !!(d && d.open),
             inside: !!(d && /영수증은 총액이 아니라/.test(d.textContent)),
             seen: /영수증은 총액이 아니라/.test(seen) };
  });
  is(fold.has && !fold.open && fold.inside && !fold.seen,
     '<설계사 참고>가 접힌 칸에 <b>닫힌 채로</b> 있다 — 펴기 전에는 눈에 안 보인다');
  is(/보낼 말이 적혀 있지 않습니다/.test(body) && /지어내지 않았습니다/.test(body),
     '말이 <없는 그림은 없다고> 적는다 — 그럴듯한 문장을 만들지 않는다 (1번)');
  const txt5 = await pg.evaluate(() => document.getElementById('utpBody').innerText);
  is(/교재 캡처/.test(txt5) && /보내면 안 되는/.test(txt5),
     '전송 금지 자료가 <왜 여기 없는지> 화면에 적는다 — 없으면 빠뜨린 줄 안다 (9번)');
  is(/상담사진 사이트 열기/.test(txt5), '띄워만 놓고 쓸 때 갈 <원본 사이트> 길이 있다');

  head('[6] 복사가 <실제로 그 말을> 담나');
  const cp = await pg.evaluate(() => { utpCopy('t-guyeo'); return window.__copied; });
  is(/병원비가 왜 사람마다 다른지/.test(cp) && /견본 문장/.test(cp),
     '카톡에 붙일 <그 말 그대로> 복사된다');
  /* 빈 글자를 복사한 것과 <b>아예 안 부른 것</b>은 붙여넣기 결과가 똑같다.
     글자만 보면 가드를 빼도 점검이 통과한다 — 부른 횟수를 센다. */
  const cpNo = await pg.evaluate(() => { window.__copyN = 0; utpCopy('t-nosay'); return window.__copyN; });
  is(cpNo === 0, '<말이 없는 그림은 복사를 아예 안 부른다> — 빈 말을 보내지 않는다');

  head('[7] 순서대로 담아 <한 번에> 보낼 수 있나');
  const bag = await pg.evaluate(() => {
    utpBagClear(); utpBagToggle('t-guyeo'); utpBagToggle('t-stent');
    window.__copied = ''; utpBagCopy();
    return { n: UTP.bag.length, order: UTP.bag.join(','), txt: window.__copied };
  });
  is(bag.n === 2 && bag.order === 't-guyeo,t-stent', '<담은 순서가 그대로> 남는다');
  is(/병원비가 왜/.test(bag.txt) && /심장 혈관 그림/.test(bag.txt),
     '담은 것의 말이 <전부> 복사된다');
  await pg.evaluate(() => utpBagClear());

  head('[8] 주제로 <골라 보기>');
  const cat = await pg.evaluate(() => {
    utpCat('심장');
    const b = document.getElementById('utpBody').innerText;
    return { sel: UTP.cat, has: /스텐트/.test(b), gone: !/급여와 비급여/.test(b) };
  });
  is(cat.sel === '심장' && cat.has && cat.gone, '주제를 누르면 <그 주제만> 남는다');
  await pg.evaluate(() => utpCat('심장'));
  is((await pg.evaluate(() => UTP.cat)) === '', '다시 누르면 <전체로> 돌아온다');

  is(errs.length === 0, errs.length ? ('콘솔 에러 ' + errs.length + '건 — ' + errs[0]) : '끝까지 콘솔 에러 <0건>');
  await ctx.close();

  /* ─── 자료를 못 받는 상황 ─── */
  ({ ctx, pg, errs } = await open(br, false));
  head('[9] 자료를 <못 받으면> — 지어내지 않는다 (1번)');
  await pg.evaluate(() => go('utphoto'));
  await pg.waitForFunction(() => {
    const b = document.getElementById('utpBody');
    return b && /못 받아왔습니다/.test(b.innerText);
  }, { timeout: 25000 }).then(() => 1, () => 0);
  const f = await pg.evaluate(() => document.getElementById('utpBody').innerText);
  is(/못 받아왔습니다/.test(f), '<못 받았다고> 그대로 말한다');
  is(/아무 사진도 지어내지 않았습니다/.test(f), '<지어내지 않았다>고 밝힌다');
  is(/사이트가 잠시 내려간|인터넷이 끊겼/.test(f), '<무엇 때문인지> 짚어 준다');
  is(/다시 시도/.test(f), '<다시 시도>할 길이 있다');
  is(!/견본|예시 문장/.test(f), '빈 화면을 <예시로 채우지 않는다>');
  is(errs.length === 0, errs.length ? ('콘솔 에러 ' + errs.length + '건 — ' + errs[0]) : '끝까지 콘솔 에러 <0건>');
  await ctx.close();

  await br.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ ' + bad + '가지 빨간불'); process.exit(1); }
  console.log('✓ 비대면 상담사진 점검 통과 — 사진과 말이 한 자리에, 없는 것은 없다고 말합니다.');
})().catch(e => { console.error(e); process.exit(1); });
