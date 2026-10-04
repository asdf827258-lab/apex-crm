/* 🔑 <b>id 를 만드는 곳은 한 곳인가</b> — 그리고 그 한 곳이 정말 안 겹치나.

   2026-09-27 에 CI 가 잡은 자리입니다. 계약 둘이 <b>같은 id</b> 를 받아
   뒤에 온 것이 앞의 것을 덮었습니다 — <b>있는 보험이 화면에서 없어집니다.</b>
   고객 앞에서 「그 보험 없으시네요」 가 되는 자리입니다.

   그때 babaPlanId 만 고치고 「같은 병이 넷 더 있다」 고 적어 뒀습니다.
   2026-09-28 에 세어 보니 <b>넷이 아니라 열한 자리</b>였습니다 — 제가 한 가지
   모양(Date.now()%1e8 + 난수)만 찾아 셌습니다. 그래서 <b>세는 자리</b>를
   만듭니다. 사람이 눈으로 세면 또 놓칩니다.

   여기서 보는 것.
     1. Math.random() 이 든 줄은 <b>전부 이름이 적혀</b> 있나 —
        새 줄이 생기면 빨간불. id 를 만들 거면 uidOf 를 부르고, 다른 데
        쓸 거면 여기 한 줄을 적는다 (8번 — 예외는 코드에 적어 빠져나간다)
     2. 시각을 이어 붙여 id 를 만드는 자리가 <b>하나도 없나</b>
     3. 열한 자리가 <b>제자리에서</b> uidOf 를 부르나 — 옮겨도 따라간다
     4. ★ uidOf 가 <b>진짜로</b> 안 겹치나 — 시각을 <b>얼려</b> 놓고 잰다
     5. ★★ 이 자가 <b>울릴 수 있나</b> — 옛 식을 그 자리에서 되살려
        정말 빨개지는지 매번 증명한다 (8번 — 안 울리는 알람은 알람이 아니다)
     6. 난수 글자가 <b>늘 여섯 글자</b>인가 — 길이가 흔들리면 그만큼 좁아진다
     7. id 에 NaN·undefined 가 안 박히나

   ★ <b>시각을 얼립니다.</b> 예전 자는 「이백 개를 뽑아 본다」 였고 1/1000 로만
     울렸습니다 — 로컬에서 초록, CI 에서 가끔 빨강. Date.now 를 한 값으로
     묶으면 <b>모든 id 가 같은 밀리초에</b > 태어나, 세는 수가 없는 식은
     비둘기집 원리로 <b>반드시</b> 겹칩니다. 흔들림이 없습니다.

   ⚠ <b>일부러 안 보는 두 자리</b>가 있습니다 (헛것을 잡으면 안 됩니다, 8번).
     · bizUuid() — crypto.randomUUID() 를 씁니다. 시각+난수가 아니라
       진짜 UUID 라 이 병이 없습니다.
     · icsUid(seed) — <b>일부러 씨앗에서 같은 값</b>을 냅니다. 폰 캘린더가
       같은 일정을 고쳐 쓰라고 읽는 이름이라, 유일하게 만들면 일정이
       <b>두 번 생깁니다.</b>

   ⚠ 이 자는 <b>app/index.html</b> 만 봅니다 — uidOf 가 거기 살기 때문입니다.
     app/ba.html 의 nid() 는 세는 수(++uid)를 이미 붙여 안 겹칩니다.
     app/finance.html:10164 은 같은 병('ia'+Date.now()+난수 1/100만)이지만
     <b>다른 갈래·다른 파일</b>입니다. 거기에 uidOf 를 베껴 넣으면 그 순간
     쌍둥이가 됩니다 (5번) — 사장님 판단을 기다립니다.                    */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const LINES = SRC.split('\n');

/* ── 주석을 <b>빈칸으로 바꾼 사본</b> ────────────────────────────────────
   ★ 이 자를 처음 돌렸을 때 제 <b>설명 글</b> 두 줄을 코드로 잡았습니다.
     주석 안에 「Math.random() 은 드물게 짧아집니다」 라고 적어 두었는데,
     줄 첫 글자만 보고 주석인지 판정했기 때문입니다. 블록 주석의 <b>가운데
     줄</b>은 * 로 시작하지 않습니다. 헛것을 잡는 자는 안 잡는 자보다
     나쁩니다 (8번) — 그래서 글자 단위로 따라가 지웁니다.
   줄 수와 자리는 그대로 두고 주석 글자만 빈칸으로 바꿉니다 — 그래야 몇 행인지
   그대로 말할 수 있습니다.                                              */
function stripComments(src) {
  let out = '', i = 0, inC = false;
  while (i < src.length) {
    const c = src[i];
    if (c === '\n') { out += c; i++; continue; }
    if (!inC && src.startsWith('/*', i)) { inC = true; out += '  '; i += 2; continue; }
    if (inC && src.startsWith('*/', i)) { inC = false; out += '  '; i += 2; continue; }
    if (!inC && src.startsWith('//', i)) {
      const e = src.indexOf('\n', i); const to = e < 0 ? src.length : e;
      out += ' '.repeat(to - i); i = to; continue;
    }
    out += inC ? ' ' : c; i++;
  }
  return { text: out, openAtEnd: inC };
}
const STRIP = stripComments(SRC);
const CODE = STRIP.text.split('\n');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* ── [1] Math.random() 이 든 줄은 전부 이름이 적혀 있나 ──────────────────
   id 를 만드는 줄은 여기 없어야 합니다 — uidOf 를 부르면 됩니다.
   그 밖의 쓸모는 <b>까닭을 적어</b> 빠져나갑니다. 새 줄이 생기면 빨간불이고,
   사람은 「uidOf 를 부를까, 여기 적을까」 한 번 생각하게 됩니다. */
const RANDOM_OK = [
  ['DELAY[tries]+Math.floor(Math.random()*700)', '다시 부르기 사이의 흔들림 — 여럿이 같은 순간에 몰리지 않게'],
  ["pal[Math.floor(Math.random()*pal.length)]",  '팀 색을 고른다 — 겹쳐도 색만 같다'],
  ["C.charAt(Math.floor(Math.random()*36))",     '★ uidRnd — id 의 난수 칸. <b>여기가 그 한 곳</b>이다'],
  ['o+=s.charAt(Math.floor(Math.random()*s.length))', '첫 비밀번호를 만든다 — id 가 아니다'],
  ['(Math.floor(Math.random()*16)+BIZ._seq)%16', 'bizUuid — crypto.randomUUID() 가 없을 때의 받침'],
];

/* ── [3] 열한 자리 — 옮겨도 따라가게 <b>앞뒤를 보고</b> 찾는다 ───────────
   줄 번호를 적으면 다음 판에 낡습니다. 그 자리에만 있는 글로 찾고,
   위아래 두 줄 안에 uidOf 가 있는지 봅니다.                            */
const SITES = [
  ['상담카드',                 'function factNewId('],
  ['내 일정 — 잠깐 세우는 줄', "{id:uidOf('tmp'),d:ds,hm:hm,t:t}", 'd:ds,hm:hm,t:t'],
  ['성장보드 피드백 (비서)',    'member_id:r.id,body:a.what'],
  ['성장보드 피드백 (손으로)',  'member_id:id,body:body,mood:mood,share:share'],
  ['팀원',                     'name:name,rank:rank,team:team,parent:parent'],
  ['파일 올리기',              'osUpRow(uid,file.name)'],
  ['시나리오',                 'function frScenBlank('],
  ['손으로 더한 담보',         "src:'손으로 적음'"],
  ['비포&애프터에서 가져온 담보', "src:'비포&애프터'"],
  ['투자 계좌·종목·거래',       'function invId('],
  ['보장분석 계약',            'function babaPlanId('],
];

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

(async () => {
  console.log('\n🔑 id 를 만드는 곳은 한 곳인가 — app/index.html');

  console.log('\n[1] Math.random() 이 든 줄은 전부 이름이 적혀 있다');
  /* 주석을 못 따라갔으면 <b>모른다고 말한다</b> — 조용히 초록이 되면 안 된다 (1번) */
  is(!STRIP.openAtEnd,
     '주석을 끝까지 따라갔다 — 여닫이가 맞는다' +
     (STRIP.openAtEnd ? '\n      ✗ 파일 끝이 주석 안입니다. 아래 [1][2] 는 <b>믿을 수 없습니다.</b>' : ''));
  const randLines = [];
  CODE.forEach((ln, i) => {
    if (ln.indexOf('Math.random()') < 0) return;
    randLines.push({ no: i + 1, ln: LINES[i] });
  });
  const unknown = randLines.filter(r => !RANDOM_OK.some(k => r.ln.indexOf(k[0]) >= 0));
  is(unknown.length === 0,
     'Math.random() 이 든 줄 ' + randLines.length + '개가 <b>모두 이름이 적혀</b> 있다' +
     (unknown.length ? unknown.map(u => '\n      ✗ ' + u.no + '행 — ' + u.ln.trim().slice(0, 90) +
        '\n        → id 를 만드는 줄이면 <b>uidOf 를 부르십시오.</b> 아니면 check-uid.js 의' +
        '\n          RANDOM_OK 에 까닭과 함께 한 줄 적으십시오 (8번)') .join('') : ''));
  RANDOM_OK.forEach(k => {
    const hit = randLines.filter(r => r.ln.indexOf(k[0]) >= 0);
    is(hit.length >= 1, '  ' + k[1] + (hit.length ? ' — ' + hit[0].no + '행' : ' — <b>사라졌습니다</b>'));
  });

  console.log('\n[2] 시각을 이어 붙여 id 를 만드는 자리가 없다');
  /* id: 'x' + … Date.now() / getTime() 꼴. 문자열 하나로 시작해 시각을
     이어 붙이는 것만 본다 — 좁게 잡는다 (8번).                         */
  const TIMEID = /\b(u?id|Id)\s*[:=]\s*['"][^'"]{0,8}['"]\s*\+[^;,\n]{0,80}(Date\.now\(\)|getTime\(\))/;
  const timeIds = [];
  CODE.forEach((ln, i) => { if (TIMEID.test(ln)) timeIds.push((i + 1) + '행 — ' + LINES[i].trim().slice(0, 80)); });
  is(timeIds.length === 0, '시각을 이어 붙여 만드는 id 가 <b>0개</b>' +
     (timeIds.length ? timeIds.map(t => '\n      ✗ ' + t).join('') : ''));

  console.log('\n[3] 열한 자리가 제자리에서 uidOf 를 부른다');
  /* ★ <b>만드는 곳 자신</b>은 시각·난수를 씁니다 — 거기가 그 한 곳입니다.
     그 줄 범위를 빼고 봅니다. 안 빼면 바로 뒤에 붙어 있는 babaPlanId 가
     uidOf 의 배 속을 제 것으로 잡아 <b>헛것</b>이 됩니다 (실제로 그랬습니다). */
  const iRnd = CODE.findIndex(l => l.indexOf('function uidRnd(') >= 0);
  const iOf  = CODE.findIndex(l => l.indexOf('function uidOf(') >= 0);
  let iEnd = -1;
  for (let i = iOf; i >= 0 && i < CODE.length; i++) { if (CODE[i].trim() === '}') { iEnd = i; break; } }
  is(iRnd >= 0 && iOf > iRnd && iEnd > iOf,
     '만드는 곳이 한 덩이로 있다 — uidRnd ' + (iRnd + 1) + '행 · uidOf ' + (iOf + 1) + '~' + (iEnd + 1) + '행');
  const inMaker = (i) => i >= iRnd && i <= iEnd;

  SITES.forEach(s => {
    const [name, anchor] = s;
    let at = -1;
    for (let i = 0; i < CODE.length; i++) { if (CODE[i].indexOf(anchor) >= 0) { at = i; break; } }
    if (at < 0) { is(false, name + ' — <b>찾는 글이 없어졌습니다</b> (「' + anchor + '」) · 자를 고쳐야 합니다'); return; }
    const lo = Math.max(0, at - 2), hi = Math.min(CODE.length, at + 3);
    const win = [], own = [];
    for (let i = lo; i < hi; i++) { win.push(CODE[i]); if (!inMaker(i)) own.push(CODE[i]); }
    const calls = win.join('\n').indexOf('uidOf(') >= 0;
    const dirty = /Date\.now\(\)|getTime\(\)|Math\.random\(\)/.test(own.join('\n'));
    is(calls && !dirty, name + ' — ' + (at + 1) + '행에서 uidOf 를 부른다' +
       (calls ? '' : '\n      ✗ uidOf 가 없습니다 — 손으로 만들고 있습니다') +
       (dirty ? '\n      ✗ 그 자리에 아직 시각·난수가 남아 있습니다' : ''));
  });

  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 480, height: 820 } });
  await ctx.route('**://**', r =>
    r.request().url().indexOf('127.0.0.1:' + srv.address().port) >= 0 ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 170)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  /* ── [4][5] 시각을 얼려 놓고 잰다 ───────────────────────────────────
     같은 밀리초에 전부 태어나게 하면, 세는 수가 없는 식은 난수 칸 수보다
     많이 뽑는 순간 <b>비둘기집 원리로 반드시</b> 겹칩니다. 흔들림이 없습니다. */
  const N = 3000;
  const R = await page.evaluate((n) => {
    const real = Date.now;
    Date.now = function () { return 1700000000000; };
    const RealDate = Date;
    /* new Date().getTime() 도 얼린다 — 옛 식 몇 개가 그것을 썼다 */
    try { RealDate.prototype.getTime = function () { return 1700000000000; }; } catch (e) {}
    const out = {};
    const draw = (f) => { const a = []; for (let i = 0; i < n; i++) a.push(String(f())); return a; };
    /* ★★ 2026-10-03 · <b>이 줄이 거저 빨개졌습니다.</b> id <b>전체</b>에서
       「null」 글자를 찾았는데, <b>꼬리의 난수 여섯 글자는 36진법</b>
       (0-9a-z)이라 <b>우연히 null 이 나옵니다</b> — CI 에서 실제로
       <b>fc_0_5616_nullwg</b> 가 나와 빨간불이 켜졌습니다. 고칠 것이 하나도
       없는 빨간불입니다. 3,000개 × 다섯 자리면 <b>서른일곱 판에 한 번쯤</b>
       이렇게 됩니다. <b>헛것을 잡는 자는 안 잡는 자보다 나쁩니다</b> (8번) —
       사람이 자를 안 믿게 됩니다.
       ★ 잡으려던 것은 <b>수 자리에 NaN·undefined 가 박히는 것</b>입니다
         (uidOf 의 머리글이 그 까닭을 적어 두었습니다 — UID_N 이 끌어올려지기
         전에 불리면 NaN 이 박힙니다). 그 자리는 <b>머리</b>이고, 난수는
         <b>맨 끝 한 토막</b>입니다. 그래서 <b>난수를 떼고 머리만</b> 봅니다 —
         보호는 그대로이고 헛것은 사라집니다.                              */
    const 머리 = x => { const i = String(x).lastIndexOf('_'); return i < 0 ? String(x) : String(x).slice(0, i); };
    const rep = (a) => ({ n: a.length, uniq: new Set(a).size,
                          bad: a.filter(x => /NaN|undefined|null/i.test(머리(x))).slice(0, 2) });

    /* ★★ <b>이 줄이 울릴 수 있나</b> 를 같은 식으로 증명해 내보냅니다 (8번).
       식을 바깥에 또 적으면 두 벌이 되어, 한쪽만 고쳐질 때 거짓 안심이 됩니다. */
    out.probe = {
      머리에NaN:      rep(['fc_NaN_3_abcdef']).bad.length,
      머리에undefined: rep(['fc_0_undefined_q1w2e3']).bad.length,
      꼬리에null:      rep(['fc_0_5616_nullwg']).bad.length,
      꼬리에nan:       rep(['fc_0_5616_nanxyz']).bad.length
    };
    out.uidOf     = rep(draw(() => uidOf('t')));
    out.fact      = rep(draw(() => factNewId()));
    out.baba      = rep(draw(() => babaPlanId()));
    out.inv       = rep(draw(() => invId('a')));
    out.scen      = rep(draw(() => frScenBlank().id));

    /* ★★ 자가 울릴 수 있는지 그 자리에서 증명한다 — 옛 식을 되살려 본다 */
    out.oldWay    = rep(draw(() => 'p' + Math.round(Date.now() % 1e8) + Math.round(Math.random() * 999)));
    out.oldNoRnd  = rep(draw(() => 'tmp' + (new Date()).getTime()));

    /* 난수 칸 — 늘 여섯 글자인가, 정말 흩어지나 */
    const rs = draw(() => uidRnd());
    out.rnd = { n: rs.length, uniq: new Set(rs).size,
                len: Array.from(new Set(rs.map(x => x.length))).sort(),
                shape: rs.filter(x => !/^[0-9a-z]{6}$/.test(x)).slice(0, 2) };

    /* ★★ 난수도 <b>얼려</b> 본다 — 길이가 흔들리는 옛 식은 이렇게만 걸린다.
       (0.5).toString(36) 은 "0.i" 라 slice(2,6) 이 <b>한 글자</b>다.
       3000번 뽑아 보는 것으로는 안 걸린다 — 드물기 때문이다. 얼리면 반드시
       걸린다. 「안 울리는 알람은 알람이 아니다」 (8번) */
    const realR = Math.random;
    out.frozen = [0, 0.25, 0.5, 0.75, 0.999].map((v) => {
      Math.random = function () { return v; };
      let t = ''; try { t = String(uidRnd()); } catch (e) { t = '터짐:' + e.message; }
      return { v: v, s: t, len: t.length };
    });
    Math.random = realR;

    Date.now = real;
    return out;
  }, N);

  console.log('\n[4] ★ 시각을 얼려 놓고 ' + N + '개씩 뽑아도 uidOf 는 안 겹친다');
  [['uidOf 직접', R.uidOf], ['상담카드 factNewId', R.fact], ['보장분석 babaPlanId', R.baba],
   ['투자 invId', R.inv], ['시나리오 frScenBlank', R.scen]].forEach(([nm, r]) => {
    is(r.uniq === r.n, '  ' + nm + ' — ' + r.n + '개 모두 다르다 (다른 id ' + r.uniq + '개)' +
       (r.uniq === r.n ? '' : '\n      ✗ ' + (r.n - r.uniq) + '개가 겹쳤습니다 — 그만큼이 서로를 덮습니다'));
    is(r.bad.length === 0, '  ' + nm + ' — <b>수 자리</b>에 NaN·undefined 가 안 박혔다 (난수 꼬리는 36진법이라 안 봅니다)' +
       (r.bad.length ? ' ✗ ' + r.bad.join(' / ') : ''));
  });

  /* ★★ 2026-10-03 — <b>난수를 떼고 머리만 보게</b> 고친 그 줄이 여전히
     울리는지 그 자리에서 증명합니다. 안 울리게 되면 보호가 사라진 것입니다. */
  const PB = R.probe || {};
  is(PB.머리에NaN === 1 && PB.머리에undefined === 1,
    '  ★★ <b>수 자리</b>에 NaN·undefined 를 박아 보면 <b>잡힌다</b> — 보호가 살아 있습니다 (NaN '
      + PB.머리에NaN + ' · undefined ' + PB.머리에undefined + ')');
  is(PB.꼬리에null === 0 && PB.꼬리에nan === 0,
    '  ★ <b>난수 꼬리</b>에 null·nan 이 나와도 <b>안 잡는다</b> — 36진법이라 우연히 나오는 글자입니다 (헛것 0)');

  console.log('\n[5] ★★ 이 자는 울릴 수 있다 — 옛 식을 그 자리에서 되살려 본다');
  is(R.oldWay.uniq < R.oldWay.n,
     '  시각+난수(0~999) 옛 식은 ' + R.oldWay.n + '개 중 <b>' + (R.oldWay.n - R.oldWay.uniq) +
     '개가 겹친다</b> — 자가 이것을 잡는다' +
     (R.oldWay.uniq < R.oldWay.n ? '' : '\n      ✗ 안 겹쳤습니다 — <b>이 자는 알람이 아닙니다.</b> 뽑는 수를 늘리십시오'));
  is(R.oldNoRnd.uniq === 1,
     '  난수가 없던 옛 식은 ' + R.oldNoRnd.n + '개가 <b>전부 같은 값</b>이다 — 다른 값 ' + R.oldNoRnd.uniq + '개');

  console.log('\n[6] 난수 칸은 늘 여섯 글자다 — 길이가 흔들리면 그만큼 좁아진다');
  is(R.rnd.len.length === 1 && R.rnd.len[0] === 6,
     '  ' + R.rnd.n + '번 뽑아도 길이가 <b>6</b> 하나다 — 나온 길이 ' + JSON.stringify(R.rnd.len));
  is(R.rnd.shape.length === 0, '  36진법 글자만 쓴다' + (R.rnd.shape.length ? ' ✗ ' + R.rnd.shape.join(' / ') : ''));
  is(R.rnd.uniq > R.rnd.n * 0.9,
     '  정말 흩어진다 — ' + R.rnd.n + '번에 다른 값 ' + R.rnd.uniq + '개 (21억 가지 중)');
  const shortOnes = R.frozen.filter(f => f.len !== 6);
  is(shortOnes.length === 0,
     '  ★★ <b>난수를 얼려도</b> 여섯 글자다 — ' +
     R.frozen.map(f => f.v + '→' + f.s).join(' · ') +
     (shortOnes.length ? shortOnes.map(f => '\n      ✗ Math.random() 이 ' + f.v +
        ' 일 때 「' + f.s + '」 ' + f.len + '글자입니다 — 그만큼 겹칠 자리가 넓어집니다') .join('') : ''));

  console.log('\n[7] 조용히 터진 곳이 없다');
  is(errs.length === 0, '터진 곳이 없다' + (errs.length ? '\n      ✗ ' + errs.slice(0, 3).join('\n      ✗ ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데 — id 가 겹치면 뒤에 온 것이 앞의 것을 덮습니다. 있는 보험이 화면에서 없어집니다.'); process.exit(1); }
  console.log('✓ id 를 만드는 곳은 <b>한 곳</b>입니다 — 열한 자리가 그것을 부르고, 시각을 얼려도 안 겹칩니다.');
})().catch(e => { console.error(e); process.exit(1); });
