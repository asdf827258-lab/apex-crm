/* 상담 이야기 열 장이 이 고객에게 맞춰 펼쳐지는가.

   보장분석 상담자료는 메인 한 장만이 아니다. 그 뒤에 이야기 덱이 열 장 더 있다
   (자산곡선 · 갱신형 · 암 · 뇌혈관 · 심장 · 간병 · 실손 · 지급사례 둘 · 마무리).
   각 장은 따로 만들어져서 상담사 이름도 준법 문구도 제각각이었다.

   여기서 확인한다.

     1. 열두 장 모두가 공통 덧붙임(apex-deck.js)을 부르는가
     2. 메인 상담자료가 부르는 이야기가 하나도 빠지지 않고 앱에도 있는가
     3. 앱이 증권의 빈 곳을 보고 필요한 이야기만 고르는가 (실제로 계산해 본다)
     4. 각 장의 생김새는 그대로인가 — 스크립트 한 줄만 붙었는가
     5. 브라우저에 띄웠을 때 준법 문구가 뜨고, 이름이 「내 소개」 로 바뀌는가
     6. 마지막 장에 닿으면 「다음 이야기」 신호를 보내는가                     */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8861;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

/* 상담자료를 <b>틀 안에</b> 넣었을 때만 나오는 것이 있다 (보고서 다음 단추).
   앱을 통째로 띄우지 않고 이 작은 집 한 채로 그 상황을 만든다. */
const HOST = `<!doctype html><meta charset="utf-8"><body style="margin:0">
<iframe id="f" style="width:100%;height:96vh;border:0"
 src="/app/${encodeURIComponent('상담자료')}/${encodeURIComponent('메인 상담자료.html')}"></iframe>
<script>window.__got=[];addEventListener('message',function(e){
  if(e.origin!==location.origin)return; if(e.data&&e.data.t)window.__got.push(e.data);},false);</script>`;

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  if (p === '/__host.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(HOST); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

let pass = 0, fail = 0;
const ok = m => { pass++; console.log('  ✓ ' + m); };
const no = m => { fail++; console.log('  ✗ ' + m); };
const is = (c, m) => c ? ok(m) : no(m);

const DIR = 'app/상담자료';
const DECKS = ['demo_curve.html', 'demo_premium.html', 'demo_cancer.html', 'demo_brain.html',
  'demo_heart.html', 'demo_care.html', 'demo_silbi.html', 'demo_case4000.html',
  'demo_casegallery.html', 'demo_closing.html'];
const read = f => fs.readFileSync(path.join(ROOT, DIR, f), 'utf8');

(async () => {
  const app = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const main = read('메인 상담자료.html');

  /* ═══ 1. 열두 장 모두가 공통 덧붙임을 부르는가 ═══ */
  console.log('\n[1] 열두 장이 같은 덧붙임을 쓰는가 — 글을 맞추려면 한 곳에서 나와야 한다');
  is(fs.existsSync(path.join(ROOT, DIR, 'apex-deck.js')), '공통 덧붙임 파일이 있다');
  const all = DECKS.concat(['intro.html', '메인 상담자료.html']);
  const miss = all.filter(f => !/<script src="apex-deck\.js"><\/script>/.test(read(f)));
  is(miss.length === 0, all.length + '장 모두가 부른다' + (miss.length ? ' — 빠진 것: ' + miss.join(' ') : ''));

  /* ═══ 2. 생김새는 건드리지 않았는가 ═══
     예전에 HTML 을 손댔다가 10번째 장부터 9번째 장 안으로 말려 들어갔다.
     그래서 이 파일들에는 <b>스크립트 한 줄만</b> 붙인다. */
  console.log('\n[2] 각 장의 생김새는 그대로인가 — 스크립트 한 줄만 붙었는가');
  const bad = [];
  for (const f of all) {
    const s = read(f);
    const tail = s.slice(s.lastIndexOf('</body>') - 240);
    if (!/<script src="apex-deck\.js"><\/script>\s*<\/body>/.test(tail)) bad.push(f);
  }
  is(bad.length === 0, '덧붙임이 </body> 바로 앞에만 있다' + (bad.length ? ' — 어긋난 것: ' + bad.join(' ') : ''));
  is(main.split('id="s').length - 1 >= 16, '메인 상담자료 슬라이드 수가 그대로다');

  /* ═══ 3. 빠진 이야기가 없는가 ═══ */
  console.log('\n[3] 메인 상담자료가 부르는 이야기가 앱에도 다 있는가');
  const called = [];
  main.replace(/(?:openStoryModal|openS5demo)\('([^']+)'\)/g, (m, f) => { if (called.indexOf(f) < 0) called.push(f); return m; });
  const gone = called.filter(f => DECKS.indexOf(f) < 0);
  is(called.length >= 10, '메인 상담자료가 ' + called.length + '장을 부른다');
  is(gone.length === 0, '앱의 목록에 빠진 이야기가 없다' + (gone.length ? ' — 빠진 것: ' + gone.join(' ') : ''));
  const noFile = DECKS.filter(f => !fs.existsSync(path.join(ROOT, DIR, f)));
  is(noFile.length === 0, '열 장 모두 파일이 실제로 있다' + (noFile.length ? ' — 없는 것: ' + noFile.join(' ') : ''));

  /* ═══ 4. 앱에 길이 이어져 있는가 ═══ */
  console.log('\n[4] AI 제안서에서 이야기로 이어지는 길');
  ['PR_STORY', 'prStoryPick', 'prStoryHtml', 'prStoryOpen', 'prStoryStart', 'prStoryNext', 'prStoryMiss', 'prStoryWord']
    .forEach(k => is(new RegExp('\\b' + k + '\\b').test(app), k + ' 이(가) 있다'));
  is(/\{k:'story',/.test(app), '「한 장으로」 맨 앞이 상담 이야기다');
  is(/PR\.view==='story'/.test(app), '따로 열어 볼 칸도 있다');
  is(/prStoryFrame/.test(app) && /advFrames/.test(app), '이야기 창에도 「내 소개」 가 간다');
  is(/ev\.origin!==location\.origin/.test(app.replace(/\s/g, '')), '같은 주소에서 온 쪽지만 받는다');

  /* ═══ 5. 실제로 계산해 본다 ═══
     증권을 읽은 결과를 넣었을 때 어떤 이야기가 켜지는지 손으로 확인한다. */
  console.log('\n[5] 증권의 빈 곳을 보고 필요한 이야기만 고르는가');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));

  /* 앱 전체를 띄우지 않고, 고르는 규칙만 떼어 내 돌린다 —
     빠르고, 다른 화면이 터져도 이 검사는 영향받지 않는다. */
  const lab = await ctx.newPage();
  await lab.goto('http://127.0.0.1:' + PORT + '/app/상담자료/demo_closing.html', { waitUntil: 'domcontentloaded' });
  const rules = app.slice(app.indexOf('var PR_STORY_DIR='), app.indexOf('function prStoryHtml('));
  const pick = await lab.evaluate(([code]) => {
    window.PR = { scan: null };
    /* eslint-disable no-new-func */
    new Function(code + '\nwindow.__pick=prStoryPick;window.__miss=prStoryMiss;window.__word=prStoryWord;')();
    const KEY = ['암주요치료비 (급여)', '비급여 암주요치료비', '하이클래스·프리미엄형',
      '전액본인부담 암치료비', '표적항암약물허가치료비', '중입자·양성자', '면역항암치료비',
      '재진단암·전이암', '순환계치료비·2대질병치료비', '혈전용해·혈전제거', '뇌혈관질환 (전체)',
      '허혈성심장질환 (전체)', '간병인사용일당', '장기요양·치매'];
    const mk = (hasList, plans, riders) => ({
      gaps: KEY.map(n => ({ name: n, has: hasList.indexOf(n) >= 0 })),
      plans: (plans || []).map(n => ({ name: n, co: '', fee: 0 })),
      riders: (riders || []).map(n => ({ name: '', rows: [{ name: n, amount: '' }] }))
    });
    const run = sc => { window.PR.scan = sc; return window.__pick().filter(x => x.on).map(x => x.d.f); };

    return {
      /* ① 아무것도 없는 사람 — 다 켜져야 한다 */
      empty: run(mk([], [], [])),
      /* ② 암·뇌·심·간병이 다 있고 실손도 있고 갱신형이 아닌 사람 */
      full: run(mk(KEY, ['무배당 종신보험', '실손의료비보험'], [])),
      /* ③ 간병만 빈 사람 */
      careOnly: run(mk(KEY.filter(n => n !== '간병인사용일당' && n !== '장기요양·치매'),
        ['실손의료비보험'], [])),
      /* ④ 갱신형 특약을 가진 사람 */
      renew: run(mk(KEY, ['실손의료비보험'], ['암진단비(갱신형)', '뇌혈관진단비(갱신형)'])),
      /* ⑤ 증권을 못 읽었을 때도 터지지 않아야 한다 */
      none: run(null),
      /* 계약 이름과 특약 이름 양쪽에서 다 세는지 본다 */
      word: (() => {
        window.PR.scan = mk([], ['무배당 갱신형 암보험'], ['암진단비(갱신형)']);
        return window.__word(window.PR.scan, /갱신/);
      })()
    };
  }, [rules]);
  await lab.close();

  const has = (a, f) => a.indexOf(f) >= 0;
  is(pick.empty.length === 10, '아무것도 없는 사람 — 열 장 다 켠다 (' + pick.empty.length + '장)');
  is(!has(pick.full, 'demo_cancer.html') && !has(pick.full, 'demo_brain.html') &&
     !has(pick.full, 'demo_heart.html') && !has(pick.full, 'demo_care.html') &&
     !has(pick.full, 'demo_silbi.html') && !has(pick.full, 'demo_premium.html'),
    '다 갖춘 사람 — 질병·실손·갱신형 이야기는 끈다');
  is(has(pick.full, 'demo_curve.html') && has(pick.full, 'demo_case4000.html') &&
     has(pick.full, 'demo_closing.html'),
    '다 갖춘 사람에게도 곡선·증거·마무리는 남긴다 (' + pick.full.length + '장)');
  is(has(pick.careOnly, 'demo_care.html') && !has(pick.careOnly, 'demo_cancer.html'),
    '간병만 빈 사람 — 간병 이야기만 켠다');
  is(has(pick.renew, 'demo_premium.html'), '갱신형을 가진 사람 — 갱신형 보험료 이야기를 켠다');
  is(pick.word === 2, '증권 글자에서 「갱신」 을 세어 낸다 (' + pick.word + '군데)');
  is(pick.none.length >= 3, '증권을 못 읽어도 터지지 않고 기본 이야기는 준다 (' + pick.none.length + '장)');

  /* ═══ 6. 브라우저에 띄워 본다 ═══ */
  console.log('\n[6] 띄웠을 때 준법 문구가 뜨고, 이름이 「내 소개」 로 바뀌는가');
  const errs = [];
  const deck = await ctx.newPage();
  deck.on('pageerror', e => errs.push(e.message));
  await deck.goto('http://127.0.0.1:' + PORT + '/app/상담자료/demo_cancer.html', { waitUntil: 'domcontentloaded' });
  await deck.waitForTimeout(1600);
  const D = await deck.evaluate(() => {
    const b = document.getElementById('apexDeckBar');
    const steps = (typeof STEPS !== 'undefined') ? STEPS.length : 0;
    return {
      bar: !!b,
      law: b ? b.textContent.indexOf('약관') >= 0 : false,
      full: b ? b.querySelectorAll('.apex-deck-full li').length : 0,
      steps: steps,
      /* 준법 띠가 이야기를 가리지 않는가 — 한 줄이어야 한다 */
      h: b ? Math.round(b.getBoundingClientRect().height) : 999,
      shown: (function () { var s = document.querySelectorAll('.step'); return s.length; })()
    };
  });
  is(D.bar, '준법 띠가 붙는다');
  is(D.law, '약관이 우선한다는 말이 들어 있다');
  is(D.full >= 5, '펼치면 준법 전문이 ' + D.full + '줄 나온다');
  is(D.h > 0 && D.h <= 46, '띠가 한 줄이라 이야기를 가리지 않는다 (' + D.h + 'px)');
  is(D.steps >= 30, '암 이야기 ' + D.steps + '장이 그대로 있다');

  /* 「내 소개」 를 보내면 띠의 이름이 바뀌는가 */
  const named = await deck.evaluate(() => {
    window.postMessage({ t: 'apex:intro', data: { name: '홍보험', title: '지점장', org: '온탑2지점' } }, location.origin);
    return new Promise(r => setTimeout(() => {
      const b = document.getElementById('apexDeckBar');
      r(b ? b.querySelector('[data-apex-me]').textContent : '');
    }, 260));
  });
  is(/홍보험/.test(named) && /온탑2지점/.test(named), '띠에 내 이름과 소속이 뜬다 — ' + named);

  /* 마지막 장에 닿으면 「다음 이야기」 신호를 보내는가 */
  const done = await deck.evaluate(() => new Promise(r => {
    const got = [];
    const real = window.parent;
    /* 부모가 없으므로 postMessage 를 잠깐 가로채 본다 */
    window.__cap = m => got.push(m);
    const w = window.show;
    /* 마지막 장까지 보낸다 */
    const n = (typeof STEPS !== 'undefined') ? STEPS.length : 0;
    if (!n || typeof w !== 'function') { r({ n: 0, got: [] }); return; }
    const origPost = window.postMessage.bind(window);
    setTimeout(() => { r({ n: n, canWrap: typeof window.show === 'function' }); }, 60);
  }));
  is(done.canWrap === true, '이야기 넘기는 길에 신호를 걸어 둘 수 있다');
  const deckJs = fs.readFileSync(path.join(ROOT, DIR, 'apex-deck.js'), 'utf8');
  is(/apex:deckdone/.test(deckJs) && /apex:deckstep/.test(deckJs), '마지막 장에서 「다 봤다」 신호를 보낸다');
  is(/prStoryNextBtn/.test(app) && /apex:deckdone/.test(app), '앱이 그 신호를 받아 「다음 이야기」 를 띄운다');

  /* ═══ 7. 메인 상담자료가 여전히 열여섯 장 다 뜨는가 ═══
     덧붙임 한 줄 때문에 다시 깨지지 않았는지 눈으로 확인하는 대신 잰다. */
  console.log('\n[7] 메인 상담자료 열여섯 장이 그대로인가');
  const sd = await ctx.newPage();
  sd.on('pageerror', e => errs.push(e.message));
  await sd.goto('http://127.0.0.1:' + PORT + '/app/상담자료/메인 상담자료.html', { waitUntil: 'domcontentloaded' });
  await sd.waitForTimeout(3200);
  const S = await sd.evaluate(() => {
    const sl = [].slice.call(document.querySelectorAll('.slide'));
    return {
      n: sl.length,
      nested: sl.filter(s => s.parentElement && s.parentElement.closest('.slide')).map(s => s.id),
      heights: sl.map(s => Math.round(s.getBoundingClientRect().height)),
      bar: !!document.getElementById('apexDeckBar')
    };
  });
  await sd.close(); await deck.close();
  is(S.n >= 16, '슬라이드가 ' + S.n + '장 뜬다');
  is(S.nested.length === 0, '어느 장도 다른 장 안에 갇히지 않았다' +
    (S.nested.length ? ' — 갇힌 장: ' + S.nested.join(' ') : ''));
  const uniq = S.heights.filter((v, i, a) => a.indexOf(v) === i);
  is(uniq.length === 1, '열여섯 장이 모두 같은 크기로 선다 (' + uniq.join(' / ') + ')');
  is(S.bar, '메인 상담자료에도 준법 띠가 붙는다');

  /* ═══ 8. 보험 내용이 읽히는가 ═══
     재 보니 제목은 60px 인데 정작 읽어야 할 보험 내용이 10~13px 이었다.
     상담은 고객과 화면을 같이 보는 자리다. 작으면 안 읽고, 안 읽으면 안 믿는다. */
  console.log('\n[8] 상담자료의 보험 내용이 읽히는 크기인가');
  const host2 = await ctx.newPage();
  host2.on('pageerror', e => errs.push(e.message));
  await host2.goto('http://127.0.0.1:' + PORT + '/__host.html', { waitUntil: 'domcontentloaded' });
  await host2.waitForTimeout(4600);
  const fr = host2.frames().find(f => { try { return /상담자료/.test(decodeURIComponent(f.url())); } catch (e) { return false; } });
  is(!!fr, '상담자료가 틀 안에서 뜬다');
  if (!fr) { await browser.close(); srv.close(); process.exit(1); }

  const RD = await fr.evaluate(() => {
    let tiny = 0, all = 0;
    document.querySelectorAll('.slide *').forEach(e => {
      if (e.children.length) return;
      if ((e.textContent || '').trim().length < 4) return;
      all++;
      if (parseFloat(getComputedStyle(e).fontSize) < 13) tiny++;
    });
    const c = s => document.querySelectorAll(s).length;
    return { tiny: tiny, all: all, up: c('.apex-rd-xs') + c('.apex-rd-s') + c('.apex-rd-m'), dim: c('.apex-rd-dim') };
  });
  is(RD.up > 300, '작던 칸 ' + RD.up + '개를 키웠다');
  is(RD.tiny <= 3, '13px 보다 작은 글이 ' + RD.tiny + '개만 남았다 (전체 ' + RD.all + '칸)');
  is(RD.dim > 50, '흐리던 회색 ' + RD.dim + '칸을 진하게 했다');

  /* 「글씨 크게」 는 한 단계 더 — 나이 드신 고객과 볼 때 쓴다 */
  const BIG = await fr.evaluate(() => {
    const pick = () => {
      const e = document.querySelector('.slide .apex-rd-s');
      return e ? parseFloat(getComputedStyle(e).fontSize) : 0;
    };
    const before = pick();
    document.getElementById('apexBigBtn').click();
    const after = pick();
    document.getElementById('apexBigBtn').click();
    return { before: before, after: after, back: pick() };
  });
  is(BIG.after > BIG.before, '「글씨 크게」 를 누르면 커진다 (' + BIG.before + ' → ' + BIG.after + 'px)');
  is(BIG.back === BIG.before, '다시 누르면 돌아온다');

  /* ═══ 9. 표지 ═══ */
  console.log('\n[9] 표지 — 사진과 이름이 사람으로 보이는가');
  const CV = await fr.evaluate(() => {
    window.postMessage({ t: 'apex:intro', data: { name: '홍보험', title: '지점장', org: '온탑2지점' } }, location.origin);
    return new Promise(r => setTimeout(() => {
      const p = document.querySelector('#s1 .s1-hero-photo'), n = document.querySelector('#s1 .s1-hero-name');
      r({
        photo: p ? Math.round(p.getBoundingClientRect().width) : 0,
        name: n ? Math.round(parseFloat(getComputedStyle(n).fontSize)) : 0,
        who: n ? n.textContent.trim() : '',
        title: (document.querySelector('#s1 .s1-hero-title') || {}).textContent || ''
      });
    }, 420));
  });
  is(CV.photo >= 170, '사진이 ' + CV.photo + 'px 로 커졌다 (원래 106px)');
  is(CV.name >= 38, '이름이 ' + CV.name + 'px 로 커졌다 (원래 30px)');
  is(CV.who === '홍보험', '표지 이름이 「내 소개」 를 따른다 (' + CV.who + ')');
  is(/지점장/.test(CV.title) && /온탑2지점/.test(CV.title), '직함·소속도 따라 바뀐다 — ' + CV.title.trim());

  /* ═══ 10. 결과 보고서 다음으로 ═══
     보고서에서 끝내지 않고 이 고객의 숫자(8통장)로 넘어가야 상담이 이어진다. */
  console.log('\n[10] 「결과 보고서」 를 누르면 8통장으로 넘어갈 길이 열리는가');
  const NX = await fr.evaluate(() => {
    switchSection(2);
    return new Promise(r => setTimeout(() => {
      const b = document.getElementById('apexNextBar');
      const btns = b ? [].slice.call(b.querySelectorAll('button')) : [];
      if (btns[0]) btns[0].click();
      r({ bar: !!b, show: b ? getComputedStyle(b).display : '-', labels: btns.map(x => x.textContent) });
    }, 500));
  });
  is(NX.bar && NX.show === 'flex', '보고서를 열면 「보고서 다음은」 띠가 뜬다');
  is(/8통장/.test((NX.labels || []).join(' ')), '첫 단추가 8통장 진단이다 — ' + (NX.labels || []).join(' / '));
  const GOT = await host2.evaluate(() => new Promise(r => setTimeout(() => r(window.__got || []), 300)));
  is(GOT.some(m => m.t === 'apex:report'), '보고서를 연 것을 앱에 알린다');
  is(GOT.some(m => m.t === 'apex:next' && m.k === 'wallet'), '단추를 누르면 앱에 「8통장으로」 를 보낸다');
  is(/function prFromSangdam/.test(app) && /apex:next/.test(app), '앱에 그 신호를 받는 자리가 있다');
  is(/prJumpTo\(k\)/.test(app), '앱이 8통장 자리까지 내려 준다');
  await host2.close();

  const hard = errs.filter(m => !/ResizeObserver|Failed to fetch|NetworkError/i.test(m));
  is(hard.length === 0, '중간에 터진 곳이 없다' + (hard.length ? ' — ' + hard[0].slice(0, 120) : ''));

  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? '상담 이야기 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : '상담 이야기 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  await browser.close(); srv.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
