/* 재무설계 상담자료의 첫 화면과 두 번째 장.

   두 상담자료를 나란히 열면 한 사람의 것으로 보여야 합니다. 그런데
   보장분석 상담자료는 검은 판에 금색 STARRING 표지인데, 재무설계
   상담자료는 파란 네이비였습니다. 같은 설계사의 자료가 서로 다른
   얼굴을 하고 있었습니다.

   그리고 두 번째 장 — 여기 적는 숫자가 뒤의 스물다섯 장을 전부
   만드는데, 여느 입력 폼과 똑같이 생겨서 고객 앞에서 열기 민망했습니다.

   여기서 확인한다.

     1. 첫 화면이 보장분석 표지와 <b>같은 색·같은 글꼴 스택</b>을 쓰는가
     2. 내 소개를 고치면 첫 화면이 바로 따라오는가
     3. 사진이 없으면 사진 칸이 통째로 숨는가
     4. 두 번째 장에 고객 이름이 서는가
     5. 나머지 장(3~9번)은 <b>손대지 않았는가</b>                        */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8875;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

let pass = 0, fail = 0;
const ok = m => { pass++; console.log('  ✓ ' + m); };
const no = m => { fail++; console.log('  ✗ ' + m); };
const is = (c, m) => c ? ok(m) : no(m);

const FIN = 'app/재무설계/상담자료.html';

(async () => {
  const fin = fs.readFileSync(path.join(ROOT, FIN), 'utf8');
  const deck = fs.readFileSync(path.join(ROOT, 'app/상담자료/apex-deck.js'), 'utf8');

  /* ═══ 1. 같은 얼굴인가 ═══ */
  console.log('\n[1] 첫 화면이 보장분석 표지와 같은 언어를 쓰는가');
  /* 표지가 쓰는 값을 소스에서 직접 뽑아 와 견준다 — 한쪽만 바뀌면 여기서 걸린다 */
  const deckBg = /#s1\.apex-star\{[^']*background:(#[0-9A-Fa-f]{6})/.exec(deck);
  const BG = deckBg ? deckBg[1] : '#08080A';
  is(new RegExp('\\.ff-hero\\{[^}]*background:' + BG).test(fin.replace(/\s+/g, ' ')),
    '바탕이 표지와 같은 검정이다 (' + BG + ')');
  is(/\.as-name\{[\s\S]{0,320}color:#F0E3C4/.test(deck) && /\.ff-name\{[\s\S]{0,320}color:#F0E3C4/.test(fin),
    '이름 색이 표지와 같다 (#F0E3C4)');
  is(/#D4B978/.test(fin) && /#C8A25B/.test(fin), '금색 두 가지를 표지와 똑같이 쓴다');
  is(/class="ff-star">STARRING</.test(fin), 'STARRING 라벨이 있다');
  is(/\.ff-star::before\{[\s\S]{0,200}linear-gradient\(90deg,transparent,#C8A25B\)/.test(fin),
    'STARRING 앞 금색 가로선까지 같은 방식이다');

  /* 글꼴 스택은 글자 그대로 같아야 한다. 한쪽만 다르면 같은 기기에서
     서로 다른 글꼴로 떨어져 두 자료가 남남으로 보인다. */
  const stack = '"Noto Serif KR","Nanum Myeongjo","Noto Sans KR",serif';
  is(deck.indexOf(stack) >= 0, '표지의 글꼴 스택을 읽어 낼 수 있다');
  is(fin.indexOf(stack) >= 0, '첫 화면이 <b>글자 그대로 같은</b> 글꼴 스택을 쓴다');
  is(!/font-family:"Noto Serif KR","Nanum Myeongjo",serif/.test(fin),
    '스택을 줄여 쓴 곳이 없다 — 줄이면 엉뚱한 글꼴로 떨어진다');

  /* ═══ 2~5. 실제로 열어 본다 ═══ */
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const url = 'http://127.0.0.1:' + PORT + '/' + FIN.split('/').map(encodeURIComponent).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(1500);

  console.log('\n[2] 내 소개를 고치면 첫 화면이 따라오는가');
  const R = await page.evaluate(() => {
    const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
    set('a_name', '홍길동');
    set('a_title', '지점장');
    set('a_org', '온탑3지점');
    set('a_motto', '숫자로 말합니다');
    const face0 = document.getElementById('ffFace').classList.contains('off');
    /* 사진을 넣으면 사진 칸이 열려야 한다 */
    const px = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    window.PHOTO = px;
    /* PHOTO 는 스크립트 안의 지역 변수라 밖에서 못 바꾼다. 사진 등록 경로를 그대로 탄다 */
    return {
      name: document.getElementById('ffName').textContent,
      role: document.getElementById('ffRole').textContent,
      quote: document.getElementById('ffQuote').textContent,
      faceOffNoPhoto: face0,
      heroBg: getComputedStyle(document.querySelector('.ff-hero')).backgroundColor,
      nameColor: getComputedStyle(document.getElementById('ffName')).color
    };
  });
  is(R.name === '홍길동', '이름이 바로 바뀐다 (' + R.name + ')');
  is(/지점장/.test(R.role) && /온탑3지점/.test(R.role), '직함과 소속이 따라온다');
  is(/숫자로 말합니다/.test(R.quote), '한 줄 철학이 따라온다');
  is(R.heroBg === 'rgb(8, 8, 10)', '실제로 그려진 바탕이 검정이다 (' + R.heroBg + ')');
  is(R.nameColor === 'rgb(240, 227, 196)', '실제로 그려진 이름이 금빛이다 (' + R.nameColor + ')');

  console.log('\n[3] 사진이 없으면 사진 칸이 숨는가');
  is(R.faceOffNoPhoto, '사진이 없으면 사진 칸이 통째로 숨는다 — 빈 네모가 안 남는다');
  const withPhoto = await page.evaluate(() => {
    const px = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const dt = new DataTransfer();
    dt.items.add(new File([Uint8Array.from(atob(px.split(',')[1]), c => c.charCodeAt(0))], 'a.gif', { type: 'image/gif' }));
    const inp = document.getElementById('a_photo');
    inp.files = dt.files;
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    return new Promise(r => setTimeout(() => r({
      off: document.getElementById('ffFace').classList.contains('off'),
      src: (document.getElementById('ffFaceImg').getAttribute('src') || '').slice(0, 10)
    }), 400));
  });
  is(!withPhoto.off && withPhoto.src === 'data:image', '사진을 등록하면 첫 화면에 바로 걸린다');

  console.log('\n[4] 두 번째 장에 고객이 서는가');
  const S = await page.evaluate(() => {
    const e = document.getElementById('f_name');
    const before = document.getElementById('sec1Who').textContent;
    const beforeCls = document.getElementById('sec1Who').className;
    e.value = '성춘향'; e.dispatchEvent(new Event('input', { bubbles: true }));
    const s1 = document.getElementById('sec1');
    const inp = s1.querySelector('.field input');
    return {
      before: before, beforeCls: beforeCls,
      after: document.getElementById('sec1Who').textContent,
      afterCls: document.getElementById('sec1Who').className,
      eyebrow: (s1.querySelector('.sec1-eyebrow') || {}).textContent,
      title: (s1.querySelector('h2') || {}).textContent,
      stepNo: getComputedStyle(s1.querySelector('.step-no')).display,
      inpBorder: getComputedStyle(inp).borderTopWidth + '/' + getComputedStyle(inp).borderBottomWidth,
      inpRadius: getComputedStyle(inp).borderTopLeftRadius
    };
  });
  is(/적으시면 여기 섭니다/.test(S.before) && /empty/.test(S.beforeCls),
    '비어 있을 때는 어디에 적으면 되는지 말한다');
  is(S.after === '성춘향 님' && !/empty/.test(S.afterCls), '이름을 적으면 그대로 선다 (' + S.after + ')');
  is(S.eyebrow === 'CLIENT PROFILE', '금색 라벨이 붙는다');
  is(/오늘 만나는 분/.test(S.title), '제목이 사람 얘기로 바뀌었다');
  is(S.stepNo === 'none', '번호 딱지를 뗐다 — 서식이 아니라 자료로 보이게');
  is(S.inpBorder === '0px/1px', '입력칸이 네모 상자가 아니라 밑줄이다 (' + S.inpBorder + ')');
  is(S.inpRadius === '0px', '밑줄이라 모서리가 없다');

  console.log('\n[5] 나머지 장은 손대지 않았는가');
  const O = await page.evaluate(() => {
    const out = {};
    ['sec2', 'sec3', 'sec4', 'sec5', 'sec6', 'sec7', 'sec9'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) { out[id] = 'MISSING'; return; }
      const inp = el.querySelector('.field input');
      out[id] = {
        radius: getComputedStyle(el).borderTopLeftRadius,
        stepNo: el.querySelector('.step-no') ? getComputedStyle(el.querySelector('.step-no')).display : 'none',
        inpRadius: inp ? getComputedStyle(inp).borderTopLeftRadius : '-'
      };
    });
    return out;
  });
  ['sec2', 'sec3', 'sec4', 'sec5', 'sec6', 'sec7', 'sec9'].forEach(id => {
    const v = O[id];
    is(v !== 'MISSING' && v.stepNo !== 'none' && v.inpRadius !== '0px',
      id + ' 은 예전 그대로다 (번호 딱지 ' + (v.stepNo || '?') + ' · 입력칸 모서리 ' + (v.inpRadius || '?') + ')');
  });

  console.log('\n[6] 슬라이드는 예전 그대로 만들어지는가');
  const D = await page.evaluate(() => {
    try {
      /* 앱이 실제로 부르는 순서 그대로: collect · analyze · buildSlides */
      const S = buildSlides(analyze(collect()));
      render(S);
      return { n: S.length, first: (S[0] || '').slice(0, 60), boxN: document.getElementById('slides').children.length };
    } catch (e) { return { err: (e && e.message) || 'fail' }; }
  });
  is(!D.err, '슬라이드가 터지지 않고 만들어진다' + (D.err ? ' — ' + D.err : ''));
  is(D.n >= 20, '스물 장 넘게 나온다 (' + D.n + '장)');
  is(D.boxN === D.n, '만든 만큼 화면에 붙는다');
  is(/cover-h/.test(D.first || ''), '슬라이드 1번 표지는 예전 그대로다 — 여기는 안 건드렸다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? '재무설계 첫 화면 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : '재무설계 첫 화면 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
