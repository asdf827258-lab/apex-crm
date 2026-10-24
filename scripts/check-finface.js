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

  /* ═══ 0. 첫 「장」이 보장분석 표지와 글자 그대로 같은가 ═══
     .as-* 규칙을 양쪽에서 뽑아 하나하나 대조한다. 한쪽만 손대면 걸린다. */
  console.log('\n[0] 첫 장이 보장분석 STARRING 표지 그대로인가');
  const pick = src => {
    const out = {};
    /* 규칙이 <b>시작</b>하는 자리만 본다. 그냥 `.as-x{` 로 찾으면
       `.wrap.nophoto .as-photo{...}` 같은 덧칠까지 잡혀서, 멀쩡한데도
       다르다고 나온다. */
    const re = /(?:^|\}|,|\{)\s*(\.as-[a-z-]+(?:::?[a-z-]+)?)\s*\{([^}]*)\}/g;
    let m;
    while ((m = re.exec(src))) if (!out[m[1]]) out[m[1]] = m[2];
    return out;
  };
  /* 덱 쪽은 자바스크립트 배열 조각이라 이어 붙여야 진짜 CSS 가 된다 */
  const deckCss = (deck.slice(deck.indexOf('function coverBuildCss()'), deck.indexOf('function coverHtml()'))
    .match(/^\s*'((?:[^'\\]|\\.)*)',?\s*$/gm) || [])
    .map(x => x.trim().replace(/,$/, '').slice(1, -1).replace(/\\'/g, "'")).join('');
  const A = pick(deckCss), B = pick(fin);
  const keys = Object.keys(A);
  is(keys.length >= 15, '표지 규칙을 ' + keys.length + '개 읽어 냈다 — 대조할 거리가 있다');
  const diff = keys.filter(k => A[k] !== B[k]);
  is(diff.length === 0, '.as-* 규칙 ' + keys.length + '개가 <b>한 글자도</b> 안 다르다' +
    (diff.length ? ' — 어긋난 곳: ' + diff.slice(0, 3).join(', ') : ''));
  is(/function starCoverHtml\(/.test(fin), '표지를 짓는 길이 있다');
  ['as-star', 'as-name', 'as-role', 'as-quote', 'as-facts', 'as-chips', 'as-photo', 'as-info']
    .forEach(c => is(fin.indexOf('class="' + c + '"') >= 0 || fin.indexOf("'" + c + "'") >= 0 ||
      new RegExp('class="apex-star-wrap').test(fin), c + ' 를 그대로 쓴다'));
  is(!/class="cover-h"/.test(fin), '파란 옛 표지는 안 쓴다');

  /* ═══ 1. 내 소개는 한 곳에서만 적는다 ═══ */
  console.log('\n[1] 내 소개를 두 번 적지 않는가');
  is(!/id="sec8"/.test(fin), '재무설계 쪽 「내 소개」 입력 카드를 없앴다');
  is(!/id="a_name"/.test(fin), '설계사 입력칸이 남아 있지 않다');
  is(/var ADV *= *\{/.test(fin) && /function advLoad\(/.test(fin), '공용 저장소에서 읽는다');
  is(/apex_intro_/.test(fin) && /s6_profile/.test(fin) && /apex_profile/.test(fin),
    '보장분석 표지와 <b>같은 세 칸</b>을 본다');
  /* 전에는 「보장분석 상담자료 표지에서 고치시라」 고 <b>다른 화면</b>을
     가리켰다. 그 자료에만 고치는 단추가 있었기 때문이다. 팀원마다 소개가
     다른데 고칠 자리가 한 자료에만 있으면 나머지는 손을 못 댄다.
     이제 세 자료가 모두 「내 설정」 한 곳을 가리킨다. */
  is(/내 설정/.test(fin) && !/보장분석 상담자료 표지에서 고치시면/.test(fin),
     '어디서 고치는지 알려 준다 — 「내 설정」 한 곳을 가리킨다');
  is(/data-apex-edit/.test(fin), '표지에 「내 소개 고치기」 단추가 있다');
  is(/apex:editintro/.test(fin), '누르면 앱의 내 설정으로 보낸다');

  /* ═══ 1-2. 첫 화면이 표지 <b>그 자체</b>인가 ═══
     전에는 이름만 가운데 놓은 좁은 띠였다. 두 자료를 나란히 열면 한쪽은
     사진이 화면 절반을 채우고 한쪽은 검은 줄 하나라 남남으로 보였다. */
  console.log('\n[1-2] 첫 화면이 표지 한 장인가');
  is(/\.ff-hero\{[^}]*min-height:100vh/.test(fin.replace(/\s+/g, ' ')),
    '첫 화면이 <b>화면 한 장</b>을 차지한다');
  is(/\.ff-hero\{[^}]*background:#08080A/.test(fin.replace(/\s+/g, ' ')),
    '바탕이 표지와 같은 검정이다');
  is(/\.ff-hero \.apex-star-wrap\{position:absolute;inset:0/.test(fin),
    '표지가 그 판을 꽉 채운다');
  is(/starCoverHtml\(\)/.test(fin.slice(fin.indexOf('function heroPaint'), fin.indexOf('function heroPaint') + 700)),
    '첫 화면과 발표 첫 장이 <b>같은 함수</b>로 그려진다 — 갈라질 수 없다');
  is(!/class="ff-name"/.test(fin) && !/class="ff-star"/.test(fin),
    '이름만 놓던 옛 띠가 사라졌다');
  is(/「내 소개」 가 아직 비어 있습니다/.test(fin), '내 소개가 비면 어디서 채우는지 알려 준다');

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

  console.log('\n[2] 내 소개가 두 화면에 함께 흐르는가');
  const R = await page.evaluate(() => {
    /* 보장분석 표지가 쓰는 그 칸에 적어 둔다 */
    localStorage.setItem('apex_intro_u1', JSON.stringify({
      name: '홍길동', title: '지점장', org: '온탑3지점', motto: '숫자로 말합니다',
      tags: '생애 재무설계, 은퇴 설계', license: 'AFPK', years: '12'
    }));
    ADV.name = ''; ADV.title = ''; ADV.org = ''; ADV.motto = '';
    ADV.tags = ''; ADV.license = ''; ADV.years = '';
    advLoad(); heroPaint();
    const cov = starCoverHtml();
    return {
      heroName: (document.querySelector('#ffHero .as-name') || {}).textContent || '',
      heroRole: (document.querySelector('#ffHero .as-role') || {}).textContent || '',
      heroBg: getComputedStyle(document.querySelector('.ff-hero')).backgroundColor,
      heroH: Math.round(document.getElementById('ffHero').getBoundingClientRect().height),
      nameColor: getComputedStyle(document.querySelector('#ffHero .as-name') || document.body).color,
      covName: (cov.match(/class="as-name">([^<]*)</) || [])[1],
      covRole: (cov.match(/class="as-role">([^<]*)</) || [])[1],
      covChips: (cov.match(/class="as-chip"/g) || []).length,
      covLicense: /AFPK/.test(cov),
      nophoto: /apex-star-wrap nophoto/.test(cov)
    };
  });
  is(R.heroName === '홍길동', '첫 화면 이름이 따라온다 (' + R.heroName + ')');
  is(R.heroRole === '지점장', '직함이 따라온다');
  is(R.heroBg === 'rgb(8, 8, 10)', '실제로 그려진 바탕이 검정이다 (' + R.heroBg + ')');
  /* 창이 좁으면(900px) 82vh 로 낮춘다 — 태블릿 세로에서 아래가 살짝 보여야
     더 있다는 걸 안다. 넓으면 100vh 로 꽉 채운다. */
  is(R.heroH >= 1200 * 0.8, '첫 화면이 화면 한 장을 채운다 (' + R.heroH + 'px · 창 1200px)');
  is(R.nameColor === 'rgb(240, 227, 196)', '실제로 그려진 이름이 금빛이다 (' + R.nameColor + ')');
  is(R.covName === '홍길동', '<b>첫 장 표지</b>에도 같은 이름이 선다 (' + R.covName + ')');
  is(R.covRole === '지점장', '표지 직함도 같다');
  is(R.covChips === 2, '전문 분야가 칩으로 선다 (' + R.covChips + '개)');
  is(R.covLicense, 'LICENSE 도 표지에 오른다');
  is(R.nophoto, '사진이 없으면 사진 칸을 접는다 — 검은 네모만 남지 않는다');

  console.log('\n[3] 첫 장이 실제로 표지로 그려지는가');
  const D = await page.evaluate(() => {
    try {
      const S = buildSlides(analyze(collect()));
      render(S);
      const s1 = document.getElementById('slides').children[0];
      return {
        n: S.length, star: s1.classList.contains('apex-star'),
        wrap: !!s1.querySelector('.apex-star-wrap'),
        bg: getComputedStyle(s1).backgroundColor,
        old: /cover-h/.test(S[0] || ''),
        adv: (collect().adv || {}).name
      };
    } catch (e) { return { err: e.message }; }
  });
  is(!D.err, '슬라이드가 터지지 않고 만들어진다' + (D.err ? ' — ' + D.err : ''));
  is(D.star && D.wrap, '첫 장에 표지가 붙는다');
  is(D.bg === 'rgb(8, 8, 10)', '첫 장 바탕이 표지와 같은 검정이다 (' + D.bg + ')');
  is(!D.old, '파란 옛 표지가 안 나온다');
  is(D.adv === '홍길동', '설계사 이름을 공용 저장소에서 받아 쓴다 (' + D.adv + ')');

  console.log('\n[4] 두 번째 장 — 고객의 상황을 정리합니다');
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
      inpRadius: getComputedStyle(inp).borderTopLeftRadius,
      wide: Math.round(s1.getBoundingClientRect().width),
      sum: (document.getElementById('sec1Sum') || {}).textContent || '',
      hasSec2: !!document.getElementById('sec2'),
      cash: (document.getElementById('sec1Cash') || {}).textContent || '',
      cols: s1.querySelectorAll('.sec1-col').length
    };
  });
  is(/적으시면 여기 섭니다/.test(S.before) && /empty/.test(S.beforeCls),
    '비어 있을 때는 어디에 적으면 되는지 말한다');
  is(S.after === '성춘향 님' && !/empty/.test(S.afterCls), '이름을 적으면 그대로 선다 (' + S.after + ')');
  is(/CLIENT SITUATION/.test(S.eyebrow || ''), '눈썹 한 줄이 붙는다 (' + S.eyebrow + ')');
  is(/고객의 상황을 정리합니다/.test(S.title), '제목이 「고객의 상황을 정리합니다」 다');
  is(S.wide > 760, '가로로 넓어졌다 — ' + S.wide + 'px (전에는 720px 안에 갇혔다)');
  is(!S.hasSec2 && S.cash.indexOf('월 소득') === 0,
    '소득·지출이 <b>같은 장</b>에 들어왔다 — ' + S.cash.slice(0, 46));
  is(S.cols === 2, '가족과 돈을 좌우 두 칸으로 나눠 한 화면에 담는다');
  is(/42세/.test(S.sum) && /배우자/.test(S.sum),
    '적은 것이 한 줄로 되짚어진다 (' + S.sum + ')');
  is(S.stepNo === 'none', '번호 딱지를 뗐다 — 서식이 아니라 자료로 보이게');
  /* 전에는 이 판만 금색·명조·밑줄이었다. 바로 밑 「자산과 부채」 는 앱
     기본(흰 바탕·파란 강조·채워진 칸)이라 <b>한 화면에서 두 디자인이
     싸웠다.</b> 고객 앞에서 내리는 동안 서식이 바뀌어 버린다.
     이제 스킨을 걷어내고 앱 기본을 그대로 쓴다 — 아래 [5] 에서 다른
     장들과 같은 모양인지 함께 본다. */
  is(S.inpBorder === '1px/1px', '입력칸이 네모 상자다 — 아래 장들과 같은 모양 (' + S.inpBorder + ')');
  is(S.inpRadius === '12px', '모서리도 같다 (' + S.inpRadius + ')');
  is(!/#sec1 .field input[^}]*border-bottom/.test(fin), '밑줄 덧칠이 남아 있지 않다');
  is(!/#sec1 [^{]*\{[^}]*Noto Serif KR/.test(fin), '이 판만 명조로 덧칠하지 않는다');
  is(!/#sec1 [^{]*\{[^}]*#B08D45/.test(fin), '이 판만 금색으로 덧칠하지 않는다');

  console.log('\n[5] 일곱 장이 한 장으로 들어왔는가');
  /* 자산 · 연금 · 보장 · 목표 · 걱정이 각각 다른 판이라, 고객 앞에서 일곱 번을
     내려야 상황 하나가 정리됐다. 내려가는 동안 앞에서 적은 것이 화면에서
     사라지니 「아까 소득이 얼마라고 하셨죠」 를 되묻게 된다.

     합치면서 <b>칸을 하나라도 흘리면</b> 그 값이 들어가던 뒤쪽 슬라이드가
     조용히 빈다 — 여기서 전수로 센다. */
  const WANT = [
    'f_name','f_age','f_gender','f_job','f_sname','f_sage','f_sincome',
    'f_income','f_etc','f_living','f_house','f_edu','f_ins','f_loan','f_loanyr',
    'f_home','f_cash','f_inv','f_dc','f_debt','f_save',
    'r_dep','r_eq','r_us','r_va','r_pen','r_inf',
    'f_ret','f_life','f_retspend','f_np','f_npage','f_pp',
    'c_death','c_cancer','c_brain','c_heart','c_care','c_silson'
  ];
  const ONE = await page.evaluate((want) => {
    const s1 = document.getElementById('sec1');
    const inside = want.filter(id => { const e = document.getElementById(id); return !!(e && s1 && s1.contains(e)); });
    const gone = want.filter(id => !document.getElementById(id));
    const cols = s1 ? [...s1.querySelectorAll('.sec1-cols')][0] : null;
    const h = cols ? [...cols.children].map(c => Math.round(c.getBoundingClientRect().height)) : [];
    return {
      still: ['sec3','sec4','sec5','sec6','sec7'].filter(id => document.getElementById(id)),
      sec9: !!document.getElementById('sec9'),
      inside: inside.length, gone: gone,
      grps: [...(s1 ? s1.querySelectorAll('.sec1-grp') : [])].map(e => e.textContent.replace(/^\d/, '').trim()),
      chips: ['goals','worries','focus'].filter(id => { const e = document.getElementById(id); return !!(e && s1 && s1.contains(e)); }).length,
      colH: h,
      navGo: [...document.querySelectorAll('#ffnav button')].map(b => b.dataset.go)
    };
  }, WANT);
  is(ONE.still.length === 0, '자산 · 연금 · 보장 · 목표 · 걱정이 따로 서 있지 않다' +
     (ONE.still.length ? ' — 아직 남음: ' + ONE.still.join(', ') : ''));
  is(ONE.gone.length === 0, '칸이 하나도 안 없어졌다 (' + WANT.length + '칸)' +
     (ONE.gone.length ? ' — 사라짐: ' + ONE.gone.join(', ') : ''));
  is(ONE.inside === WANT.length,
     '그 ' + WANT.length + '칸이 모두 <b>같은 한 장</b> 안에 있다 (' + ONE.inside + '칸)');
  is(ONE.chips === 3, '목표 · 걱정 · 가장 먼저 듣고 싶은 것도 같은 장에 있다 (' + ONE.chips + '/3)');
  is(ONE.grps.length === 5, '묶음 머리 다섯으로 나뉜다 — ' + ONE.grps.join(' / '));
  is(/이 분은/.test(ONE.grps[0] || '') && /걱정/.test(ONE.grps[4] || ''),
     '읽는 순서가 상담 순서다 — 누구십니까 … 무엇이 걱정이십니까');
  is(ONE.sec9, '뉴스 · 자료는 따로 둔다 — 상담 중에 적는 것이 아니다');
  is(ONE.navGo.length === 2 && ONE.navGo.indexOf('sec1') >= 0 && ONE.navGo.indexOf('sec9') >= 0,
     '칸 목록이 없는 판을 안 가리킨다 (' + ONE.navGo.join(', ') + ')');
  /* 두 칸 높이가 크게 벌어지면 한쪽 아래가 통째로 빈다 — 고객 앞에서 눈에 띈다 */
  const gap = ONE.colH.length === 2 ? Math.abs(ONE.colH[0] - ONE.colH[1]) : 9999;
  is(gap <= 200, '왼쪽과 오른쪽 높이가 안 벌어진다 — ' + ONE.colH.join(' vs ') + 'px (차 ' + gap + 'px)');

  console.log('\n[6] 고객 365일로 저장되는 길이 살아 있는가');
  /* 저장은 앱(index.html)이 한다. 이 화면은 apex:snap 으로 값을 넘긴다.
     자기 소개 카드를 지운 뒤에도 <b>고객 값이 그대로 넘어가는지</b>가 핵심이다. */
  const app = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is(/function fpSaveNow\(/.test(app), '앱에 「고객 파일로 저장」 이 있다');
  is(/fpAsk\('deck','apex:snap'/.test(app), '저장할 때 이 화면에서 값을 받아 간다');
  is(/osRepSaveToClient\('fp_deck'/.test(app), '받은 값을 고객 파일로 넣는다');
  is(/client_id:cid/.test(app.replace(/\s/g, '')), '어느 고객 것인지 붙여서 넣는다');
  is(/function snap\(/.test(fin), '이 화면이 값을 넘길 줄 안다');
  const SNAP = await page.evaluate(() => {
    const send = t => new Promise(res => {
      const h = ev => { if (ev.data && ev.data.t === 'apex:snap:ok') { window.removeEventListener('message', h); res(ev.data); } };
      window.addEventListener('message', h);
      window.postMessage({ t: t, id: 1 }, location.origin);
      setTimeout(() => res(null), 900);
    });
    return send('apex:snap');
  });
  is(!!SNAP && !!SNAP.data, '실제로 물어보면 값을 돌려준다');
  if (SNAP && SNAP.data) {
    const f = SNAP.data.f || {};
    is(f.f_name === '성춘향', '고객명이 그대로 넘어간다 (' + f.f_name + ')');
    is(f.f_age && f.f_job, '나이·직업도 넘어간다 (' + f.f_age + '세 · ' + f.f_job + ')');
    is((SNAP.data.kids || []).length >= 1, '자녀 줄도 넘어간다 (' + (SNAP.data.kids || []).length + '명)');
    is((SNAP.data.parents || []).length >= 1, '부모 줄도 넘어간다');
    is(Object.keys(f).filter(k => k.indexOf('a_') === 0).length === 0,
      '설계사 칸은 안 넘어간다 — 없앴으니 당연하고, 고객 파일에 섞이지도 않는다');
    is(Object.keys(f).length >= 20, '고객 칸을 통째로 넘긴다 (' + Object.keys(f).length + '칸)');
  }

  console.log('\n[7] 고른 것이 고객 파일에 함께 담기는가');
  /* 배우자 · 임신 계획 · 목표 · 걱정 · 가장 먼저 듣고 싶은 것은 <button>
     이라 input 이 아니다. snap() 이 훑는 목록에 안 잡혀 <b>통째로 빠졌다.</b>
     「배우자 없음」 으로 저장한 상담을 다시 열면 기본값 「있음」 으로
     되살아났다 — 싱글이신 고객 앞에서 「배우자분은…」 이 나가던 자리다.
     focus 는 계산기의 상담 순서(FOCUS2PAIN)까지 정하므로, 되읽은 상담이
     아예 다른 순서로 흘렀다. */
  const SEL = await page.evaluate(async () => {
    const send = (t, data) => new Promise(res => {
      const k = t + ':ok';
      const h = ev => { if (ev.data && ev.data.t === k) { window.removeEventListener('message', h); res(ev.data); } };
      window.addEventListener('message', h);
      window.postMessage({ t: t, id: 9, data: data }, location.origin);
      setTimeout(() => res(null), 900);
    });
    /* 설계사가 실제로 하는 일 — 싱글로 바꾸고 목표·걱정·관심사를 고른다 */
    const no = [...document.querySelectorAll('[data-tog="spouse"]')].find(b => b.dataset.v === '0');
    if (no) no.click();
    [...document.querySelectorAll('#goals .chip')].slice(0, 2).forEach(c => c.click());
    [...document.querySelectorAll('#worries .chip')].slice(0, 1).forEach(c => c.click());
    [...document.querySelectorAll('#focus .chip')].slice(0, 1).forEach(c => c.click());
    const picked = JSON.parse(JSON.stringify(sel));
    const saved = await send('apex:snap');
    /* 전부 되돌린 뒤 저장본으로 다시 연다 = 고객 파일에서 꺼내 보는 것 */
    sel.spouse = 1; sel.preg = 0; sel.goals = []; sel.worries = []; sel.focus = [];
    selPaint();
    await send('apex:put', saved && saved.data);
    await new Promise(r => setTimeout(r, 200));
    const back = JSON.parse(JSON.stringify(sel));
    const onChips = [...document.querySelectorAll('#goals .chip')].filter(c => c.classList.contains('on')).length;
    return { picked, carried: saved && saved.data && saved.data.sel, back, onChips, v: saved && saved.data && saved.data.v };
  });
  is(!!SEL.carried, '고른 것이 저장에 담긴다');
  is(SEL.v >= 2, '담기 시작한 판이라고 표시한다 — v' + SEL.v);
  is(SEL.carried && SEL.carried.spouse === 0,
    '「배우자 없음」 이 그대로 담긴다 — 되읽어서 「있음」 으로 뒤집히지 않는다');
  is(JSON.stringify(SEL.back) === JSON.stringify(SEL.picked),
    '되읽으면 고른 것이 그대로 돌아온다 (' + JSON.stringify(SEL.back.focus) + ')');
  is(SEL.onChips === (SEL.picked.goals || []).length,
    '칩도 다시 칠해진다 — 값만 돌아오고 화면이 안 따라오면 소용없다 (' + SEL.onChips + '개)');

  console.log('\n[8] 큰 금액을 억으로 되짚어 주는가');
  /* 「50000 만원」 은 한 박자 늦게 읽힌다. 고객 앞에서 5억을 5천만으로
     읽으면 그 자리에서 상담이 어그러진다. 적으신 값을 다시 읽어 줄 뿐,
     없는 값을 만들지는 않는다. */
  const EOK = await page.evaluate(() => {
    const put = (id, v) => { const e = document.getElementById(id); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); } };
    const read = id => { const e = document.getElementById(id); const f = e && e.parentNode && e.parentNode.parentNode; const t = f && f.querySelector('.eok'); return t ? t.textContent : ''; };
    /* 견본값(50000·8000·20000)과 <b>다른</b> 숫자를 넣는다. 같은 값을 쓰면
       앞 절에서 칠해 둔 낡은 딱지가 그대로 맞아떨어져, 되짚기를 통째로
       떼어 내도 이 절이 통과해 버린다 — 안 울리는 알람이 된다. */
    put('f_home', 123456); put('f_cash', 500); put('f_debt', 70000);
    return { home: read('f_home'), cash: read('f_cash'), debt: read('f_debt') };
  });
  is(/12억\s*3,456만원/.test(EOK.home), '억과 만원을 함께 읽어 준다 (' + EOK.home + ')');
  is(/7억원/.test(EOK.debt), '대출도 억으로 읽어 준다 (' + EOK.debt + ')');
  is(EOK.cash === '', '억이 안 되는 값에는 군더더기를 안 붙인다 (500만원)');

  console.log('\n[9] 표지 기본값에 한 사람의 이름·사진이 박혀 있지 않은가');
  /* 기본값에 한 사람의 이름·사진이 박혀 있었다. 다른 설계사가 열면 고객 앞
     첫 화면에 <b>남의 얼굴과 남의 이름</b>이 떴다. 팀원마다 소개가 다른데
     기본값이 한 사람이면 나머지 전부가 틀린 표지를 들고 고객을 만난다. */
  const main = fs.readFileSync(path.join(ROOT, 'app/상담자료/메인 상담자료.html'), 'utf8');
  const person = /이동엽/;
  is(!person.test(main), '보장분석 상담자료에 한 사람의 이름이 안 박혀 있다');
  is(!person.test(fin), '재무설계 상담자료에 한 사람의 이름이 안 박혀 있다');
  /* apex-deck.js 의 OLD_NAME 은 <b>지우는 쪽</b>이다 — 다른 덱 본문에 아직
     박혀 있는 옛 이름을 로그인한 사람 이름으로 쓸어 담는다. 기본값이 아니라
     고치는 장치이므로 여기서 잡지 않는다. 넓게 잡으면 헛것을 잡는다. */
  const sweepLine = /var OLD_NAME = \/[^/]+\/g;/;
  is(!person.test(deck.replace(sweepLine, '')),
     '표지를 짓는 곳에 한 사람의 이름이 <b>기본값으로</b> 안 박혀 있다');
  is(sweepLine.test(deck), '본문에 남은 옛 이름은 로그인한 사람 이름으로 쓸어 담는다');
  is(!/photos:\s*\['[^']/.test(main), '기본 사진에 남의 사진을 넣지 않는다');
  is(!/COVER_FALLBACK/.test(deck),
     '사진이 없을 때 남의 사진으로 메우지 않는다 — 내 이름 옆에 남의 얼굴이 서던 자리');
  is(/nophoto/.test(deck) && /nophoto/.test(fin), '사진이 없으면 두 표지 모두 사진 칸을 안 세운다');
  is(/내 설정/.test(main), '비어 있으면 보장분석 표지도 「내 설정」 을 가리킨다');
  is(/apex:editintro/.test(main), '앱 안에서 고치면 내 설정으로 보낸다 — 두 곳에 안 적는다');

  /* 소개카드도 같은 자리다. 여기는 한 사람의 이름·영문이름·사진 석 장·
     방송·자격·경력·전문분야·팀 이름이 글자 그대로 박혀 있어서, 다른
     설계사가 열면 처음부터 끝까지 남의 소개가 떴다. */
  const card = fs.readFileSync(path.join(ROOT, 'app/상담자료/intro.html'), 'utf8');
  is(!person.test(card), '소개카드에도 한 사람의 이름이 안 박혀 있다');
  is(!/photo1\.jpg|photo2\.png|photo3\.jpg/.test(card), '소개카드가 남의 사진을 안 물고 있다');
  is(!/TEAM ROY|LEE&nbsp;|LDY</.test(card), '팀·영문이름·배경 글자도 값에서 온다');
  is(/apexDeckIntro/.test(card),
     '「내 소개」 를 읽어 둔 <b>한 곳</b>만 본다 — localStorage 를 따로 훑지 않는다');
  is(/window\.apexDeckIntro/.test(deck), '읽어 둔 값을 밖으로 내준다');
  is(/내 설정/.test(card), '비어 있으면 소개카드도 「내 설정」 을 가리킨다');

  console.log('\n[10] 앱이 이 화면에 값을 보낼 줄 아는가');
  /* advFrames() 에 <b>없는 id</b> 가 적혀 있었다. 그런 이름의 함수는 있어도
     그런 틀은 없다. 재무설계 상담자료는 주소 훑기에 겨우 걸려 챙겨졌다. */
  const ids = (app.match(/var out=\[\],ids=\[([^\]]*)\]/) || [])[1] || '';
  const want = ['sangdamFrame', 'fpDeckFrame'];
  want.forEach(id => is(ids.indexOf("'" + id + "'") >= 0, '내 소개를 ' + id + ' 에도 보낸다'));
  (ids.match(/'([^']+)'/g) || []).map(x => x.slice(1, -1)).forEach(id => {
    is(new RegExp('iframe id="' + id + '"').test(app) || /Frame/.test(id) === false ||
       app.indexOf('id="' + id + '"') >= 0,
       id + ' 은 실제로 있는 틀이다');
  });

  console.log('\n[11] 소개카드가 내 값으로 서는가');
  const card2 = await ctx.newPage();
  await card2.goto('http://127.0.0.1:' + PORT + '/app/' +
    ['상담자료', 'intro.html'].map(encodeURIComponent).join('/'), { waitUntil: 'domcontentloaded' });
  await card2.waitForTimeout(1200);
  const EMPTY = await card2.evaluate(() => {
    const t = document.getElementById('iTip');
    return {
      tip: t ? t.textContent : '', name: (document.getElementById('name') || {}).textContent || '',
      photo: getComputedStyle(document.querySelector('.hero .img')).backgroundImage,
      shots: document.querySelectorAll('.gcard').length
    };
  });
  is(/내 설정/.test(EMPTY.tip), '비어 있으면 어디서 채우는지 말한다');
  is(EMPTY.photo === 'none', '사진이 없으면 남의 사진을 안 깐다 (' + EMPTY.photo + ')');
  is(EMPTY.shots === 0, '방송 스틸도 안 세운다');

  const FILLED = await card2.evaluate(() => {
    const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    window.postMessage({ t: 'apex:intro', data: {
      name: '홍길동', nameEn: 'HONG GIL DONG', title: '보장분석 전문가', issue: 'No.03 / 08',
      license: '생명·손해·변액', career: '상담 1,200+ · 8년',
      onair: 'NBN 「보험 불만제로」\n서울경제TV 「인생설계 원픽」',
      tags: '운전자보험, 종신·정기보험, 보장분석', team: 'TEAM ONTOP',
      photo: PNG, photo2: PNG, photo3: PNG
    } }, location.origin);
    return new Promise(r => setTimeout(() => r({
      name: (document.getElementById('name') || {}).textContent || '',
      bg: (document.getElementById('iBg') || {}).textContent || '',
      side: (document.getElementById('iSide') || {}).textContent || '',
      cells: document.querySelectorAll('#iMeta .c').length,
      tags: document.querySelectorAll('#iTags span').length,
      team: (document.getElementById('iFoot') || {}).textContent || '',
      shots: document.querySelectorAll('.gcard').length,
      tipOff: (document.getElementById('iTip') || {}).style ? document.getElementById('iTip').style.display === 'none' : true
    }), 700));
  });
  is(FILLED.name === '홍길동', '내 이름이 선다 (' + FILLED.name + ')');
  is(FILLED.bg === 'HGD', '배경 큰 글자도 내 영문이름에서 나온다 (' + FILLED.bg + ')');
  is(/NBN/.test(FILLED.side) && /서울경제TV/.test(FILLED.side), '방송사가 뽑힌다 — ' + FILLED.side);
  is(FILLED.cells === 3, '자격 · 방송 · 경력 세 칸이 선다 (' + FILLED.cells + ')');
  is(FILLED.tags === 3, '전문 분야가 알약 ' + FILLED.tags + '개로 나뉜다');
  is(FILLED.team === 'TEAM ONTOP', '팀 이름도 내 것이다 (' + FILLED.team + ')');
  is(FILLED.shots === 2, '내가 올린 방송 스틸만 붙는다 (' + FILLED.shots + '컷)');
  is(FILLED.tipOff, '채우고 나면 안내가 사라진다');

  console.log('\n[12] 앱을 안 켜도 누구나 자기 소개를 적을 수 있는가');
  /* 이 카드는 앱 밖에서도 열린다. 고칠 자리가 앱 안에만 있으면 앱을 안 켠
     분은 빈 카드(전에는 남의 카드)를 그대로 들고 고객을 만난다.
     그렇다고 두 곳에 적히면 안 된다 — 앱 안이면 「내 설정」 한 곳으로 보내고,
     밖에서 열렸을 때만 그 자리에서 적는다. */
  const ED = await card2.evaluate(async () => {
    localStorage.clear();
    const btn = document.getElementById('ecEdit');
    if (!btn) return { none: true };          /* 터지지 말고 빨간불을 켠다 */
    btn.click();
    await new Promise(r => setTimeout(r, 250));
    const w = document.getElementById('ecWrap');
    const open = !!(w && w.style.display === 'flex');
    const set = (k, v) => { const e = document.querySelector('#ecWrap [data-k="' + k + '"]'); if (e) e.value = v; };
    set('name', '성춘향'); set('nameEn', 'SUNG CHUN HYANG'); set('title', '재무설계 전문가');
    set('license', '생명·손해'); set('career', '상담 800+ · 6년'); set('team', 'TEAM APEX');
    set('onair', 'KBS 「돈이 되는 이야기」'); set('tags', '연금, 상속, 보장분석');
    const fields = document.querySelectorAll('#ecWrap [data-k]').length;
    const photos = document.querySelectorAll('#ecWrap [data-p]').length;
    document.getElementById('ecSave').click();
    await new Promise(r => setTimeout(r, 500));
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem('apex_profile') || '{}'); } catch (e) {}
    return {
      open: open, fields: fields, photos: photos,
      name: (document.getElementById('name') || {}).textContent || '',
      team: (document.getElementById('iFoot') || {}).textContent || '',
      cells: document.querySelectorAll('#iMeta .c').length,
      closed: !!(w && w.style.display === 'none'),
      keys: Object.keys(stored)
    };
  });
  is(!ED.none, '표지에 「내 소개 고치기」 단추가 있다');
  /* 단추가 없으면 아래가 전부 undefined 라 점검이 <b>터진다.</b> 터지면
     어디가 어긋났는지 안 보인다 — 빈 값으로 채워 빨간불로 보이게 한다. */
  if (ED.none) Object.assign(ED, { open: false, fields: 0, photos: 0, name: '', team: '', cells: 0, closed: false, keys: [] });
  is(ED.open, '앱 밖에서 열면 그 자리에서 적을 수 있다');
  is(ED.fields === 10 && ED.photos === 3,
     '글 ' + ED.fields + '칸 · 사진 ' + ED.photos + '칸이 선다');
  is(ED.name === '성춘향', '저장하면 카드가 바로 그 이름으로 선다 (' + ED.name + ')');
  is(ED.team === 'TEAM APEX' && ED.cells === 3, '팀·자격·방송·경력도 함께 바뀐다');
  is(ED.closed, '저장하면 수정칸이 닫힌다');
  is(ED.keys.indexOf('name') >= 0, '적은 것이 담긴다 (' + ED.keys.length + '칸)');

  /* 다시 열어도 남아 있어야 한다 — 이 브라우저에만 남는다 */
  await card2.reload({ waitUntil: 'domcontentloaded' });
  await card2.waitForTimeout(1100);
  const AGAIN = await card2.evaluate(() => ({
    name: (document.getElementById('name') || {}).textContent || '',
    btn: (document.getElementById('ecEdit') || {}).className || ''
  }));
  is(AGAIN.name === '성춘향', '다시 열어도 남아 있다 (' + AGAIN.name + ')');
  is(AGAIN.btn.indexOf('hot') < 0, '채우고 나면 고치기 단추가 눈에 안 띄게 물러난다');

  /* 앱 안에서는 두 곳에 안 적는다.
     글자만 보면 안 된다 — if (inApp()) 을 if (false) 로 바꿔 놔도 두 낱말이
     그대로 남아 통과해 버린다. 실제로 눌러 본다. */
  const INAPP = await card2.evaluate(async () => {
    const sent = [];
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: function (m) { sent.push(m && m.t); } }
    });
    const w0 = document.getElementById('ecWrap');
    if (w0) w0.style.display = 'none';
    const btn = document.getElementById('ecEdit');
    if (!btn) return { sent: [], opened: false };   /* 터지지 말고 빨간불을 켠다 */
    btn.click();
    await new Promise(r => setTimeout(r, 300));
    const w = document.getElementById('ecWrap');
    return { sent: sent, opened: !!(w && w.style.display === 'flex') };
  });
  is(INAPP.sent.indexOf('apex:editintro') >= 0,
     '앱 안에서 누르면 「내 설정」 으로 보낸다 (' + INAPP.sent.join(',') + ')');
  is(!INAPP.opened, '앱 안에서는 그 자리 수정칸을 안 연다 — 두 곳에 안 적힌다');

  /* 카드가 앱이 모르는 열쇠를 새로 만들면, 앱에서 적은 값이 카드에 안 온다 */
  const advKeys = ((app.match(/var ADV_FIELDS=\[([\s\S]*?)\];/) || [])[1] || '')
    .concat((app.match(/var ADV_PHOTOS=\[([\s\S]*?)\];/) || [])[1] || '')
    .match(/\bk:\s*'([a-zA-Z0-9_]+)'/g) || [];
  const adv = advKeys.map(x => x.replace(/.*'([^']+)'.*/, '$1'));
  const cardKeys = ((card.match(/var CARD_FIELDS = \[([\s\S]*?)\];/) || [])[1] || '')
    .concat((card.match(/var CARD_PHOTOS = \[([\s\S]*?)\];/) || [])[1] || '')
    .match(/\bk:\s*'([a-zA-Z0-9_]+)'/g) || [];
  const ck = cardKeys.map(x => x.replace(/.*'([^']+)'.*/, '$1'));
  is(adv.length >= 15 && ck.length >= 10, '양쪽 칸 이름을 읽어 냈다 — 앱 ' + adv.length + ' · 카드 ' + ck.length);
  const stray = ck.filter(k => adv.indexOf(k) < 0);
  is(stray.length === 0,
     '카드가 앱이 모르는 칸 이름을 새로 만들지 않는다' + (stray.length ? ' — ' + stray.join(', ') : ''));
  is(/max: 900/.test(card) && /max: 520/.test(card) && /900/.test(app) ,
     '사진 줄이는 크기가 앱과 같다 (900 · 520) — 한쪽만 크면 같은 사진이 달라 보인다');
  is(/apex_profile/.test(card) && !/localStorage\.setItem\('apex_intro/.test(card),
     '앱이 이미 읽는 칸에 담는다 — 새 칸을 만들지 않는다');

  /* 로그인한 사람의 칸이 옛 공용 칸을 이겨야 한다 */
  const PRIO = await card2.evaluate(async () => {
    localStorage.setItem('apex_intro_u1', JSON.stringify({ name: '홍길동', title: '로그인 칸' }));
    localStorage.setItem('apex_profile', JSON.stringify({ name: '성춘향', title: '옛 공용 칸' }));
    return true;
  });
  await card2.reload({ waitUntil: 'domcontentloaded' });
  await card2.waitForTimeout(1100);
  const WHO = await card2.evaluate(() => (document.getElementById('name') || {}).textContent || '');
  is(PRIO && WHO === '홍길동',
     '로그인한 사람의 칸이 옛 공용 칸을 이긴다 (' + WHO + ') — 한 브라우저를 같이 써도 안 덮인다');

  /* 옛 칸(s6_profile)이 남아 있어도, 카드에서 고친 것이 살아남아야 한다.
     전에는 고친 직후엔 맞다가 다시 열면 옛 이름으로 되살아났다 —
     「고쳤는데 그대로예요」 가 되는 자리다. */
  const KEEP = await card2.evaluate(async () => {
    localStorage.clear();
    localStorage.setItem('s6_profile', JSON.stringify({ name: '옛날사람', title: '옛 칸' }));
    return true;
  });
  await card2.reload({ waitUntil: 'domcontentloaded' });
  await card2.waitForTimeout(1100);
  const K1 = await card2.evaluate(async () => {
    const before = (document.getElementById('name') || {}).textContent || '';
    document.getElementById('ecEdit').click();
    await new Promise(r => setTimeout(r, 250));
    const f = document.querySelector('#ecWrap [data-k="name"]');
    if (f) f.value = '성춘향';
    document.getElementById('ecSave').click();
    await new Promise(r => setTimeout(r, 400));
    return { before: before, after: (document.getElementById('name') || {}).textContent || '' };
  });
  await card2.reload({ waitUntil: 'domcontentloaded' });
  await card2.waitForTimeout(1100);
  const K2 = await card2.evaluate(() => (document.getElementById('name') || {}).textContent || '');
  is(KEEP && K1.before === '옛날사람', '옛 칸만 있으면 그것이 선다 — 쓰던 값을 안 지운다');
  is(K1.after === '성춘향', '고치면 그 자리에서 바뀐다');
  is(K2 === '성춘향', '다시 열어도 고친 것이 남는다 (' + K2 + ') — 옛 칸이 되살아나지 않는다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));


  await browser.close(); srv.close();

  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? '재무설계 첫 화면 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : '재무설계 첫 화면 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
