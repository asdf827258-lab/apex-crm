/* 모든 화면을 실제로 열어 결과 이미지를 뽑는다.
   가짜 데이터는 검사에 쓰는 것과 같다 — 팀 둘, 사람 넷, 통화 100여 건. */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8873;
const OUT = process.env.SHOTDIR;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const STUB = fs.readFileSync('scripts/check-airep.js', 'utf8').split('const STUB = `')[1].split('\n`;\n')[0];

const AI_REP = `## 활동 보고
최근 30일 출근 18일, 실행 체크판은 하루 평균 7개를 채웠습니다.
통화 67통에서 상담 10건이 나왔습니다. 전환율 14.9% 입니다.
- 고객 카드는 2명, 기한이 지난 할 일이 2건 남아 있습니다.

## 활동 격려
전화한 날이 21일입니다. 몰아서 걸지 않고 매일 거는 습관이 잡혔습니다.
이건 가장 바꾸기 어려운 부분인데 이미 되어 있습니다. 그대로 이어 가십시오.

## 공부할 부분
간병·장기요양이 아직 비어 있습니다. 상담 10건 중 이 이야기가 나온 건이 없습니다.
이번 주에 한 장만 읽고 한 분에게 말로 꺼내 보십시오.

## 상담 컨셉
"보험료를 줄이자는 말씀을 드리려는 게 아닙니다.
나가고 있는 돈이 제 일을 하고 있는지 같이 한번 보자는 겁니다."

## 다음 7일
1. 하루 3통씩 · 주 15통 — 지금 속도를 지키면 됩니다
2. 고객 카드 2명 추가
3. 기한 지난 할 일 2건 이번 주 안에 정리
4. 12일째 부재인 고객12 — 문자 먼저 남기고 다음 날 전화`;

const AI_DG = `## 오늘 볼 것
어제 팀 통화는 31통, 상담 4건이었습니다. 체크판 이행률은 68% 입니다.
박서준 님은 21일째 매일 전화를 걸고 있고, 이지훈 님은 최근 7일 통화가 0입니다.
오늘 먼저 볼 곳은 이지훈 님입니다 — 배정 DB 8건이 한 번도 안 걸렸습니다.

## 팀에 전할 말
"이번 주는 새 사람을 찾기보다, 이미 받아 둔 DB 를 한 번씩 다 건드리는 주로 갑시다.
안 걸린 DB 가 팀 전체에 9건 있습니다. 오늘 안에 첫 통화만 넣어 주십시오."

## 이번 주 방향
전환율보다 통화한 날수를 봅니다. 하루 3통을 다섯 날 하는 사람이
하루 15통을 한 날 하는 사람보다 다음 달에 남습니다.
금요일에 「전화한 날수」만 가지고 한 번 짚겠습니다.`;

const AI_TALK = `부재 6건 · 거절 2건이면 이렇게 여십시오.

부재 — "몇 번 연락드렸는데 계속 어긋났습니다. 바쁘신 것 같아 문자로 남깁니다.
불편하시면 답 안 주셔도 됩니다. 필요하실 때 연락 주십시오."
거절 — 팔지 않습니다. "지난번에 필요 없다고 하셨죠. 그래서 권해 드리려는 게 아니고,
이번에 바뀐 것 하나만 알려 드립니다." 그 다음은 묻지 않고 끊습니다.

※ 보험 계약 체결 전 상품설명서와 약관을 반드시 확인하셔야 하며,
   본 문구는 금융소비자보호법상 광고가 아닌 내부 참고용입니다.`;

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1200 }, deviceScaleFactor: 1.4 });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => {
    /* 아침 비서 팝업·자동 보고는 화면을 가린다 — 찍을 때는 꺼 둔다 */
    try { localStorage.setItem('apex_ar_brief_off', '1'); localStorage.setItem('apex_ar_auto_off', '1'); } catch (e) { }
  });
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  await page.evaluate((t) => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osHelpOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'p1', name: '윤시현', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'p1', email: 'o@t' } };
    window.toast = function () { };
    window.__aiMode = 'rep';
    window.callAI = function () { return Promise.resolve(t[window.__aiMode] || t.rep); };
    if (typeof GB !== 'undefined') { GB.loaded = false; GB.busy = false; GB.rows = []; }
    if (typeof AR !== 'undefined') { AR.loaded = false; AR.busy = ''; AR.rep = {}; AR.open = ''; }
  }, { rep: AI_REP, dg: AI_DG, talk: AI_TALK });

  const shots = [];
  const shot = async (name, note) => {
    await page.waitForTimeout(500);
    /* 안내 덮개가 떠 있으면 걷어낸다 */
    await page.evaluate(() => {
      document.querySelectorAll('#osGuideOvl,#osHelpOvl,#osOvl,#osGuide,#osLoginGate,.os-ovl,.ar-brf-ovl').forEach(x => x.remove());
      document.querySelectorAll('div').forEach(d => {
        var st = getComputedStyle(d);
        if (st.position === 'fixed' && (+st.zIndex) >= 9000 && d.offsetHeight > 300) d.remove();
      });
    });
    await page.waitForTimeout(250);
    const f = path.join(OUT, name + '.png');
    await page.screenshot({ path: f, fullPage: true });
    const kb = Math.round(fs.statSync(f).size / 1024);
    shots.push({ name, note, kb });
    console.log('  📸 ' + name + '  ' + kb + 'KB  — ' + note);
  };
  const go = async (tab, ms) => { await page.evaluate(t => window.go(t), tab); await page.waitForTimeout(ms || 2200); };

  /* ── 1. 홈 ── */
  await go('home', 2600);
  await shot('01-home', '로그인하면 처음 보이는 화면');

  /* ── 2~7. AI 관리판 ── */
  await go('airep', 3000);
  await page.waitForFunction(() => typeof GB !== 'undefined' && GB.loaded && GB.rows.length, { timeout: 12000 }).catch(() => { });
  await page.evaluate(() => arPaint()); await page.waitForTimeout(600);
  await page.evaluate(() => arGoCat('feed')); await page.waitForTimeout(500);
  await shot('02-airep-feed-before', 'AI 관리판 — 보고를 만들기 전');

  await page.evaluate(() => arGen(arMyId())); await page.waitForTimeout(1800);
  await shot('03-airep-feed', 'AI 보고 다섯 칸 — 활동보고·격려·공부·컨셉·다음7일');

  await page.evaluate(() => arGoCat('touch')); await page.waitForTimeout(700);
  await shot('04-airep-touch', '오늘 터치할 사람 — 무엇을 해야 하는지까지');

  await page.evaluate(() => { AR.tkAll = true; arPaint(); }); await page.waitForTimeout(700);
  await shot('05-airep-touch-team', '팀 전체로 놓으면 담당자 이름이 앞에 붙는다');
  await page.evaluate(() => { AR.tkAll = false; });

  await page.evaluate(() => arGoCat('score')); await page.waitForTimeout(700);
  await shot('06-airep-score', '본인 점수판 — 여섯 축과 팀 평균');

  await page.evaluate(() => arGoCat('team')); await page.waitForTimeout(900);
  await page.evaluate(() => { GB.team = ''; arPaint(); }); await page.waitForTimeout(700);
  await shot('07-airep-team', '팀원 관리 — 팀별로 묶여 나온다');

  await page.evaluate(() => arOpen('p2')); await page.waitForTimeout(1200);
  await shot('08-airep-member', '이름을 누르면 그 사람의 모든 것이 한 화면에');

  await page.evaluate(() => { arOpen('p2'); arGoCat('lead'); }); await page.waitForTimeout(700);
  await shot('09-airep-lead', '리더 할 일 — 누구나 보고 지점장이 체크한다');

  /* ── 10~12. TEAM 총괄 ── */
  await go('teamhub', 3000);
  await page.waitForTimeout(1500);
  await shot('10-teamhub-today', 'TEAM 총괄 관리 — 오늘 체크');
  await page.evaluate(() => thGo('grow')); await page.waitForTimeout(1800);
  await shot('11-teamhub-grow', '성장판 — 여섯 축을 팀과 비교');
  await page.evaluate(() => thGo('ck_lead')); await page.waitForTimeout(1800);
  await shot('12-teamhub-lead', '지점장 · 팀 관리');

  /* ── 13~14. 매일 취합 ── */
  await go('daily', 2600);
  await shot('13-daily-before', '매일 취합 — 만들기 전');
  await page.evaluate(() => { window.__aiMode = 'dg'; });
  await page.evaluate(() => dgGen()).catch(() => { }); await page.waitForTimeout(2000);
  await page.evaluate(() => { window.__aiMode = 'rep'; });
  await shot('14-daily', '매일 취합 — 오늘 볼 것 · 팀에 전할 말 · 이번 주 방향');

  /* ── 윤시스쿨 — 앱 안에서 열어야 실제 팀이 뜬다 ── */
  await go('yoonsi', 6000);
  await shot('14b-yoonsi-office', '윤시스쿨 오피스 — 실제 팀원이 자리에 앉는다');
  const ysFrame = page.frames().find(f => f.url().indexOf('index.html') >= 0 && f !== page.mainFrame());
  if (ysFrame) {
    await ysFrame.evaluate(() => { const el = document.querySelector('[data-tab="tracker"]'); if (el) el.click(); });
    await page.waitForTimeout(1400);
  }
  await shot('14c-yoonsi-track', '윤시스쿨 진행판 — 우리 DB 를 단계로');

  /* ── 15~17. 고객·DB ── */
  await go('crm', 2800); await shot('15-crm', 'DB 통합 CRM');
  await go('clients', 2800); await shot('16-clients', '고객 365일');
  await go('biz_news', 2800); await shot('17-biznews', '정책·상품 뉴스');

  /* ── 18. 음성 비서 · 19. 출발 점검 · 20. 설정 ── */
  await go('voiceasst', 2600); await shot('18-voice', '음성 비서');
  await go('ready', 3200); await shot('19-ready', '출발 점검 — 남은 일을 앱이 직접 본다');
  await go('settings', 3000); await shot('20-settings', '설정 여섯 칸');

  /* ── 21~23. 카드뉴스 캐러셀 — 실제로 내려받는 1080×1350 결과물 ── */
  await go('insta', 3000);
  const hasHost = await page.evaluate(() => !!document.getElementById('cnHost'));
  if (!hasHost) {
    const tabs = await page.evaluate(() => Array.prototype.map.call(
      document.querySelectorAll('button,a'), e => (e.textContent || '').trim()).filter(t => /카드뉴스|캐러셀|카드/.test(t)).slice(0, 8));
    console.log('  ! cnHost 없음 — 후보 단추: ' + JSON.stringify(tabs));
  }
  /* 사진 한 장을 만들어 넣는다 — 실제로 업로드했을 때와 같은 상태 */
  await page.evaluate(() => new Promise(res => {
    var c = document.createElement('canvas'); c.width = 1200; c.height = 1600;
    var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 1200, 1600);
    g.addColorStop(0, '#1E3A5F'); g.addColorStop(.45, '#2D6CA8'); g.addColorStop(1, '#7EA8C9');
    x.fillStyle = g; x.fillRect(0, 0, 1200, 1600);
    [[300, 380, 260, 'rgba(255,225,180,.30)'], [900, 300, 200, 'rgba(255,255,255,.16)'],
     [640, 1180, 420, 'rgba(10,30,60,.34)'], [180, 1300, 300, 'rgba(255,255,255,.10)']]
      .forEach(function (b) { var rg = x.createRadialGradient(b[0], b[1], 0, b[0], b[1], b[2]);
        rg.addColorStop(0, b[3]); rg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = rg;
        x.fillRect(b[0] - b[2], b[1] - b[2], b[2] * 2, b[2] * 2); });
    x.fillStyle = 'rgba(12,24,44,.55)';
    x.beginPath(); x.moveTo(0, 1180); x.lineTo(340, 900); x.lineTo(700, 1200); x.lineTo(1000, 980);
    x.lineTo(1200, 1130); x.lineTo(1200, 1600); x.lineTo(0, 1600); x.closePath(); x.fill();
    var url = c.toDataURL('image/jpeg', .9);
    var im = new Image();
    im.onload = function () { for (var i = 0; i < 6; i++) CN.imgs[i] = { img: im, url: url }; res(1); };
    im.src = url;
  }));
  const styles = [['news', '21-carousel-news', '📰 뉴스 카드 — 흰 배경에 사진 블록'],
                  ['full', '22-carousel-full', '🖼 사진 전체 — 검은 그라데이션 위에 글'],
                  ['frost', '23-carousel-frost', '🌫 흐린 칸 — 사진은 그대로, 글자 자리만 흐리게']];
  for (const [st, name, note] of styles) {
    const dataUrl = await page.evaluate((sty) => {
      CN.style = sty; CN.i = 0;
      var sl = cardnewsSlides();
      return cnDrawSlide(sl[0], 0, sl.length).toDataURL('image/png');
    }, st);
    const f = path.join(OUT, name + '.png');
    fs.writeFileSync(f, Buffer.from(dataUrl.split(',')[1], 'base64'));
    const kb = Math.round(fs.statSync(f).size / 1024);
    shots.push({ name, note, kb, card: true });
    console.log('  🃏 ' + name + '  ' + kb + 'KB  — ' + note);
  }

  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(shots, null, 1));
  if (errs.length) console.log('\n⚠ 콘솔 오류 ' + errs.length + '건\n  ' + errs.slice(0, 6).join('\n  '));
  else console.log('\n콘솔 오류 없음');
  console.log('이미지 ' + shots.length + '장');
  await b.close(); srv.close();
})();
