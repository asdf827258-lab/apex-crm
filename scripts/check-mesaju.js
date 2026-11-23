/* 🧭 나만 보는 판 — 내 사주 · 보험 일 (판 X518)

   사장님 말씀 2026-11-20 「그냥 내 사주만 보는거야. 보험과의 어떻게
   궁합이 좋은지, 일은 어떻게 풀어나갈지 말이야」.

   ⚠ 여기가 1번(지어내지 않는다)과 제일 가까운 자리입니다. 「보험과 나의
     궁합」 은 사람의 <b>직업</b>을 두고 하는 말이라, 한 번 지어내면 그 사람의
     한 해가 바뀝니다. 그래서 막대 다섯이 <b>정말 계산에서 나오는지</b>를
     이 자가 직접 불러 재 봅니다 — 글만 보고 넘기지 않습니다.                */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = 8894, ROOT = path.join(process.cwd(), 'site-me');
const bad = [], ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) bad.push(m); };

const srv = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  try { s.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        s.end(fs.readFileSync(path.join(ROOT, p))); } catch (e) { s.writeHead(404); s.end(''); }
}).listen(PORT);

const ME_OFF = 'var MEONLY={on:false};', ME_ON = 'var MEONLY={on:true};';

(async () => {
  console.log('\n[1] ★★ 그림자가 <b>그 한 줄만 다르다</b> (5번)');
  const SRC = 'app/saju-mbti.html', DST = 'site-me/index.html';
  const crypto = require('crypto'), sha = b => crypto.createHash('sha256').update(b).digest('hex').slice(0, 12);
  const a = fs.readFileSync(SRC), b = fs.readFileSync(DST);
  const want = Buffer.from(a.toString('utf8').replace(ME_OFF, ME_ON), 'utf8');
  ok(sha(want) === sha(b), '★★ 바라는 것 ' + sha(want) + ' / 그림자 ' + sha(b) +
    (sha(want) === sha(b) ? '' : '\n      ← 갈라졌습니다. node scripts/mk-mesaju.js --write 로 맞추십시오'));
  ok(b.toString('utf8').indexOf(ME_ON) >= 0, '올리는 판은 <b>MEONLY 가 켜져 있다</b>');
  /* ★ 판 X525 에 둘이 늘었습니다 — netlify.toml(이 사이트만의 설정)과
     netlify/edge-functions/gate.js(아이디·비번 문지기). 그래도 <b>고객 자료가
     섞이지 않았는지</b>는 그대로 봅니다 (9번). 문지기 자체는 check-megate 가 엽니다. */
  ok(fs.readdirSync('site-me').sort().join(' ') === '_redirects index.html netlify netlify.toml robots.txt',
    '올릴 폴더에 <b>올릴 것만</b> 있다 (9번) — ' + fs.readdirSync('site-me').sort().join(' '));

  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 412, height: 900 } });
  /* ★ 바깥을 막습니다 — 집 안 규약과 같은 꼴('**://**')로 적습니다.
     ⚠ 처음엔 함수 꼴로 적었는데, 「바깥을 안 막는 자」 를 세는 check-netblock
       이 글자로 찾기 때문에 <b>안 막는 자로 세어졌습니다</b>. 막기는 막았지만
       세는 자가 못 보면 다음 세션이 안 막은 줄 압니다 (5번 · 8번). */
  let outside = 0;
  await ctx.route('**://**', r =>
    r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : (outside++, r.abort()));
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(1400);

  console.log('\n[1-2] ★ 문간이 <b>정말 그려진다</b> (판 X520)');
  /* 사장님 말씀 2026-11-21 「검색하는 장 부터 디자인을 점집에 들어가는것처럼
     짜줘 … 무당을 만들고」. 그림은 재는 자가 없으면 조용히 빈칸이 됩니다 —
     SVG 한 줄만 깨져도 문법 검사는 통과하고 화면만 허옇습니다 (8번).       */
  const g = await pg.evaluate(() => {
    const w = document.querySelector('.mdg-gate .mdg'); if (!w) return null;
    const r = w.getBoundingClientRect();
    const nm = document.querySelector('.mdg-gate .mdg-nm');
    const im = w.querySelector('image');
    const src = im ? (im.getAttribute('href') || im.getAttribute('xlink:href') || '') : '';
    return { n: w.querySelectorAll('path,rect,ellipse,circle').length,
             w: Math.round(r.width), h: Math.round(r.height),
             face: !!im, embedded: src.slice(0, 11) === 'data:image/', srcHead: src.slice(0, 40),
             nm: nm ? nm.textContent.trim() : '' };
  });
  ok(!!g, '문간에 <b>그림이 있다</b>');
  if (g) {
    ok(g.n >= 60, '★ 장면이다 — 도형 ' + g.n + '개 (픽토그램 하나가 아니라 발·신단·천·무구까지)');
    ok(g.w >= 200 && g.h >= 150, '★ <b>눈에 보이는 크기</b>로 선다 — ' + g.w + '×' + g.h);
    /* 2026-11-23 사장님이 당신 사진을 주시며 「윤무당으로 해서 마지막 최종 만들자」 하셨습니다.
       그림이 사장님 얼굴이 되었으니 이제 선생님이 이 신당의 무당이 맞습니다 — 앞서 「신당」 으로
       바꿔 둔 것을 사장님 말씀대로 되돌립니다. shrineWho() 는 손님용 판 그대로 둡니다 (5번). */
    /* 사장님 얼굴은 <b>파일 안에</b> 있어야 합니다. 주소로 바꾸면 인터넷 없이 열릴 때
       얼굴만 빈칸이 되고, 그 주소를 쥔 바깥이 사장님 얼굴을 보게 됩니다 (3번 · 7번). */
    ok(g.face, '★★ 문간에 <b>사장님 얼굴</b>이 있다 (판 X522)');
    ok(g.embedded, '★★ 얼굴이 <b>파일 안에 박혀</b> 있다 — 서버를 안 부른다 (7번) · 「' + g.srcHead + '…」');
    ok(g.nm === '윤무당',
      '★ 이름표가 <b>윤무당</b>이다 — 「' + g.nm + '」' +
      (g.nm === '윤무당' ? '' : '\n      ← 사장님 말씀 2026-11-23 「윤무당으로 해서」'));
  }

  console.log('\n[2] ★ 네 장만 서고 <b>고객·채용 칸이 안 선다</b>');
  await pg.evaluate(() => { const S_ = (id, v) => { const e = document.getElementById(id); if (!e) return;
      e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
    S_('pName', '홍길동'); S_('pY', 1982); S_('pM', 6); S_('pD', 9); S_('pH', 14); S_('pMi', 0); savePerson(); });
  await pg.waitForTimeout(700);
  const tabs = await pg.evaluate(() => [].slice.call(document.querySelectorAll('.tabs button')).map(x => x.textContent.trim()));
  ok(tabs.length === 4, '탭이 <b>넷</b>이다 — ' + tabs.join(' | '));
  const banned = ['고객', '채용', '영업 가능성', '브리프', '손님', '새 고객'];
  const hit = banned.filter(w => tabs.join(' ').includes(w));
  ok(hit.length === 0, '탭에 <b>고객·채용 말이 없다</b>' + (hit.length ? (' ← ' + hit.join(',')) : ''));

  console.log('\n[3] ★★ 막대 다섯이 <b>정말 계산에서 나온다</b> (1번)');
  const r = await pg.evaluate(() => {
    const s = S.cl.saju, f = insFit(s), c = sipsinTable(s).count, oh = ohCount(s);
    /* ★ 같은 사주면 언제 불러도 같아야 합니다 — 무작위면 지어낸 것입니다 */
    let same = true; for (let i = 0; i < 10; i++)
      if (JSON.stringify(insFit(s)) !== JSON.stringify(f)) same = false;
    /* ★ 근거에 적힌 수가 실제 십신·오행과 같은가 */
    const numOk = f.rows.every(x => {
      const m = x.src.match(/(비겁|식상|재성|관성|인성) (\d+)/g) || [];
      return m.every(t => { const [k, n] = t.split(' '); return c[k] === +n; })
        && (!/토 (\d+)/.test(x.src) || +RegExp.$1 === oh['토'])
        && (!/금 (\d+)/.test(x.src) || +RegExp.$1 === oh['금']);
    });
    /* ★ 사주가 다르면 막대도 달라야 합니다 — 누구나 같으면 점수가 아닙니다 */
    const o = sajuCalc(1973, 11, 2, 3, 0, 0), f2 = insFit(o);
    const differs = JSON.stringify(f2.rows.map(x => x.n)) !== JSON.stringify(f.rows.map(x => x.n));
    /* ★★ <b>축마다</b> 움직이는가 — 여기가 이 자의 뼈대입니다.
       ⚠ 처음에는 위 differs 하나만 보았는데, 한 축을 「8」 로 손으로 박아도
         나머지 넷이 움직여 <b>그냥 통과했습니다</b>. 안 울리는 알람은 알람이
         아닙니다 (8번). 이제 여덟 사주를 돌려 <b>축 하나하나가</b> 두 가지
         이상 값을 갖는지 봅니다 — 박아 둔 축은 늘 같은 값이라 걸립니다. */
    const SEEDS = [[1982,6,9,14],[1973,11,2,3],[1990,1,20,8],[1965,8,30,22],
                   [2001,3,14,11],[1958,12,5,17],[1995,7,7,0],[1988,4,17,10]];
    const seen = {}; f.rows.forEach(x => { seen[x.k] = {}; });
    SEEDS.forEach(d => {
      const g = insFit(sajuCalc(d[0], d[1], d[2], d[3], 0, 0));
      g.rows.forEach(x => { seen[x.k][x.n] = 1; });
    });
    const stuck = Object.keys(seen).filter(k => Object.keys(seen[k]).length < 2);
    const txt = [f, f2].map(z => z.rows.map(x => x.say).join(' ')).join(' ');
    return { n: f.rows.length, same, numOk, differs, stuck,
      range: f.rows.every(x => x.n >= 0 && x.n <= 10),
      ban: /병|암|사고|다치|죽|수명|이혼|파산|그만두|안 맞는|적성이 없/.test(txt),
      srcAll: f.rows.every(x => !!x.src) };
  });
  ok(r.n === 5, '다섯 축이 다 나온다 — ' + r.n);
  ok(r.range, '점수가 <b>0~10 안</b>에 있다');
  ok(r.same, '★ 같은 사주면 <b>언제나 같은 막대</b>다 — 열 번 불러 견줬다 (무작위면 지어낸 것입니다)');
  ok(r.srcAll, '★ 축마다 <b>근거</b>가 붙는다 — 어느 수에서 나왔는지 적는다');
  ok(r.numOk, '★★ 근거에 적힌 수가 <b>실제 십신·오행과 같다</b> — 글만 그럴듯하지 않다');
  ok(r.differs, '★ <b>사주가 다르면 막대도 다르다</b>');
  ok(r.stuck.length === 0,
     '★★ <b>축 다섯이 저마다 움직인다</b> — 여덟 사주를 돌려 봤다' +
     (r.stuck.length ? ('\n      ← 늘 같은 값인 축: ' + r.stuck.join(', ') + ' — 손으로 박아 둔 것입니다 (1번)') : ''));
  ok(!r.ban, '⛔ <b>병·사고·죽음은 물론, 「그만두라」·「적성이 없다」 도 안 적는다</b> — 사주로 직업을 가르지 않습니다 (1번·2번)');

  console.log('\n[3-2] ★★ <b>독한 소리</b>도 여덟 자에서 나온다 (판 X521 · 1번)');
  /* 사장님 말씀 2026-11-22 「냉정하고 좋은말만 하지말고 센것도 디테일하게」.
     ⚠ 세게 말해 달라는 말씀은 <b>지어내도 된다</b>는 말씀이 아닙니다. 아픈 말일수록
       근거가 있어야 합니다 — 틀린 독설은 그 자리에서 사람을 잃습니다. 그래서
       줄마다 적힌 수가 실제 십신·오행과 같은지 여기서 직접 셉니다.            */
  const h = await pg.evaluate(() => {
    const SEEDS = [[1982,6,9,14],[1973,11,2,3],[1990,1,20,9],[1965,8,30,21],
                   [2000,3,3,0],[1958,12,12,17],[1995,7,7,7],[1986,5,15,11]];
    const seen = new Set(); let numOk = true, allHaveWhy = true, maxRows = 0;
    for (const [y, m, d, H] of SEEDS) {
      const s = sajuCalc(y, m, d, H, 0, 0), c = sipsinTable(s).count, oh = ohCount(s);
      const rows = meHard(s); maxRows = Math.max(maxRows, rows.length);
      for (const r of rows) {
        seen.add(r.t);
        if (!r.why) allHaveWhy = false;
        /* 근거에 적은 수가 진짜인가 — 「관성 3개」 라 써 놓고 실제로 2개면 거짓입니다 */
        for (const t of (r.why.match(/(비겁|식상|재성|관성|인성) (\d+)개/g) || []))
          if (c[t.split(' ')[0]] !== +t.match(/(\d+)/)[1]) numOk = false;
        if (/일간 (신강|중화|신약)/.test(r.why) && RegExp.$1 !== strengthOf(s).level) numOk = false;
        for (const k of ['목','화','토','금','수'])
          if (r.why.indexOf('오행에') >= 0 && r.why.indexOf(k) >= 0 && r.why.indexOf(k + '·') < 0
              && r.why.split('오행에')[1].split('가 0개')[0].indexOf(k) >= 0 && oh[k] !== 0) numOk = false;
      }
    }
    const s0 = sajuCalc(1982, 6, 9, 14, 0, 0);
    let same = true, f0 = JSON.stringify(meHard(s0));
    for (let i = 0; i < 10; i++) if (JSON.stringify(meHard(s0)) !== f0) same = false;
    return { kinds: seen.size, numOk, allHaveWhy, maxRows, same, all: [...seen].join(' ') };
  });
  ok(h.maxRows > 0 && h.maxRows <= 4, '한 번에 <b>넷까지만</b> 적는다 — ' + h.maxRows + '줄 (쏟아 부으면 아무것도 안 남습니다)');
  ok(h.allHaveWhy, '★★ 줄마다 <b>근거</b>가 붙는다 — 근거 없는 독설은 그냥 욕입니다');
  ok(h.numOk, '★★ 근거에 적힌 수가 <b>실제 십신·오행·강약과 같다</b> (1번)');
  ok(h.same, '★ 같은 사주면 <b>언제나 같은 말</b>이다 — 열 번 불러 견줬다');
  ok(h.kinds >= 6, '★ <b>사주마다 다른 말</b>이 나온다 — 여덟 사주에서 ' + h.kinds + '가지');
  ok(!/병|암|사고|다치|죽|수명|요절|단명|이혼|파산|그만두|적성이 없/.test(h.all),
     '⛔ 세게 말해도 <b>병·수명·이혼·파산은 안 건드린다</b> — 센 것과 겁주는 것은 다릅니다 (2번)');

  console.log('\n[4] ★ 네 장이 다 글을 내고, 조용하다');
  for (const t of ['mepil', 'meins', 'mework', 'metime']) {
    const n = await pg.evaluate(k => { S.tab = k; draw();
      return document.getElementById('view').innerText.replace(/\s+/g, '').length; }, t);
    ok(n > 150, '  ' + t + ' — 글자 ' + n + '자');
  }
  console.log('\n[5] ★★ 네 장을 <b>한 벌로 인쇄</b>한다 (판 X523)');
  /* 사장님 말씀 2026-11-23 「전체적으로 한번에 인쇄할수 있도록」.
     ⚠ 여기서 <b>실제로 종이가 검게 나오던 것</b>을 찾았습니다 — body 만 희게 해 두고
       .shell 이 먹빛을 쥐고 있어, 신당 화면은 여태 인쇄하면 통째로 새카맸습니다.
       화면만 보고는 절대 못 봅니다. 그래서 이 자는 <b>인쇄 상태의 색을 직접 잽니다</b> (4-1번). */
  const pa = await pg.evaluate(() => {
    /* ★ 일부러 <b>맨 끝이 아닌 장</b>에서 부릅니다. 앞 칸이 'metime' 으로 끝나 두는 바람에
       되돌리기를 빼도 그냥 통과했습니다 — 쌓는 차례의 마지막과 같은 장이면 못 봅니다 (8번). */
    S.tab = 'meins'; draw();
    const before = S.tab;
    const realPrint = window.print; window.print = function () {};
    mePrintAll();
    window.print = realPrint;
    const box = document.getElementById('printAll');
    return { sheets: box.querySelectorAll('.pa-sheet').length,
             ttls: [].slice.call(box.querySelectorAll('.pa-ttl')).map(x => x.textContent.trim()),
             chars: box.innerText.replace(/\s+/g, '').length,
             kept: S.tab === before };
  });
  ok(pa.sheets === 4, '네 장이 <b>한 벌로</b> 쌓인다 — ' + pa.sheets + '장');
  ok(pa.ttls.join('|') === '① 내 네 기둥|② 보험 일과 나|③ 일 푸는 방식|④ 올해·내년',
     '장마다 <b>제목</b>이 붙는다 — ' + pa.ttls.join(' · '));
  ok(pa.chars > 600, '네 장에 글이 다 들어 있다 — ' + pa.chars + '자');
  ok(pa.kept, '★ 인쇄하고 나면 <b>보던 장으로 돌아온다</b> — 딴 장이 떠 있으면 안 됩니다');

  await pg.emulateMedia({ media: 'print' });
  const pr = await pg.evaluate(() => {
    const dark = c => { const m = (c || '').match(/\d+/g); return m && (+m[0] + +m[1] + +m[2]) < 300; };
    const bg = s => getComputedStyle(document.querySelector(s)).backgroundColor;
    const af = getComputedStyle(document.body, '::after').display;
    const bf = getComputedStyle(document.body, '::before').display;
    return { shell: bg('.shell'), body: bg('body'), shellDark: dark(bg('.shell')), bodyDark: dark(bg('body')),
             overlays: af === 'none' && bf === 'none' };
  });
  await pg.emulateMedia({ media: 'screen' });
  ok(!pr.shellDark && !pr.bodyDark,
     '★★ 인쇄하면 <b>종이가 희다</b> — .shell ' + pr.shell + ' · body ' + pr.body +
     ((pr.shellDark || pr.bodyDark) ? '\n      ← 먹빛이 남아 있습니다. 네 장이 통째로 새카맣게 나갑니다' : ''));
  ok(pr.overlays, '★★ 깔개 둘(한지 결·어둠)이 <b>인쇄에서 내려간다</b> — position:fixed 라 종이를 통째로 덮습니다');

  ok(outside === 0, '바깥으로 <b>한 번도 안 나간다</b> — 인터넷 없이도 열립니다 (' + outside + '건)');
  ok(errs.length === 0, '터진 곳이 없다' + (errs.length ? (' ← ' + errs[0]) : ''));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad.length) { console.log('나만 보는 판 점검 실패 — ' + bad.length + '가지 어긋납니다.'); process.exit(1); }
  console.log('나만 보는 판 — 네 장이 서고, 막대가 계산에서 나옵니다.');
})();
