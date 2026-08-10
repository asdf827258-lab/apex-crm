/* 업무매뉴얼북에 쓸 화면 — 팀원 스케줄 · 지점장 관리 · 영업 관리 */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8911, OUT = process.env.SHOTDIR;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
}).listen(PORT);
const STUB = fs.readFileSync('scripts/check-airep.js', 'utf8').split('const STUB = `')[1].split('\n`;\n')[0];
const AI_REP = `## 활동 보고
최근 30일 출근 18일, 실행 체크판은 하루 평균 7개를 채웠습니다.
통화 67통에서 상담 10건이 나왔습니다. 전환율 14.9% 입니다.

## 활동 격려
전화한 날이 21일입니다. 몰아서 걸지 않고 매일 거는 습관이 잡혔습니다.

## 공부할 부분
간병·장기요양이 아직 비어 있습니다. 이번 주에 한 명에게 말로 꺼내 보십시오.

## 상담 컨셉
"보험료를 줄이자는 게 아니라, 나가는 돈이 제 일을 하고 있는지 같이 보자는 겁니다."

## 다음 7일
1. 하루 3통씩 · 주 15통
2. 고객 카드 2명 추가
3. 12일째 부재인 고객12 — 문자 먼저`;

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1180 }, deviceScaleFactor: 1.35 });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => { try { localStorage.setItem('apex_ar_brief_off','1'); localStorage.setItem('apex_ar_auto_off','1'); } catch(e){} });
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  await page.evaluate((t) => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osHelpOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id:'p1', name:'윤시현', role:'owner', plan:'vip' };
    OS.session = { user:{ id:'p1', email:'o@t' } };
    window.toast = function(){};
    window.callAI = () => Promise.resolve(t);
    if (typeof GB !== 'undefined') { GB.loaded=false; GB.rows=[]; }
    if (typeof AR !== 'undefined') { AR.loaded=false; AR.rep={}; }
  }, AI_REP);

  const shots = [];
  const shot = async (name, note) => {
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      document.querySelectorAll('#osGuideOvl,#osHelpOvl,#osOvl,#owOvl,#osRoleFix').forEach(x => x.remove());
    });
    await page.waitForTimeout(200);
    const f = path.join(OUT, name + '.png');
    await page.screenshot({ path: f, fullPage: true });
    shots.push({ name, note, kb: Math.round(fs.statSync(f).size/1024) });
    console.log('  📸 ' + name + '  — ' + note);
  };
  const cat = async (k, ms) => { await page.evaluate(c => arGoCat(c), k); await page.waitForTimeout(ms || 1400); };

  await page.evaluate(() => go('airep'));
  await page.waitForTimeout(3200);
  await page.waitForFunction(() => typeof GB!=='undefined' && GB.loaded && GB.rows.length, { timeout: 14000 }).catch(()=>{});

  /* ── 팀원 ── */
  await cat('sched', 1800);  await shot('m01-sched',  '내 스케줄 — 오늘·이번 주 약속과 할 일');
  await cat('todo');         await shot('m02-todo',   '해야 할 일 — 밀린 것부터 위에');
  await cat('touch');        await shot('m03-touch',  '오늘 터치할 사람 — 무엇을 할지까지');
  await page.evaluate(() => arGen(arMyId())); await page.waitForTimeout(1800);
  await cat('feed');         await shot('m04-feed',   'AI 보고 다섯 칸');
  await cat('score');        await shot('m05-score',  '내 점수 — 여섯 축과 팀 안 순위');
  await cat('acad', 2600);   await shot('m06-acad',   '본인 점검란 — 주차별로 스스로');

  /* ── 지점장 ── */
  await cat('lead');         await shot('m07-lead',   '리더 할 일 — 오른쪽 단추로 그 화면 바로');
  await cat('team', 3200);
  await page.evaluate(() => { GB.team=''; arPaint(); }); await page.waitForTimeout(900);
  await shot('m08-team', '팀원 관리 — 팀별로 묶여 나온다');
  await page.evaluate(() => arOpen('p2')); await page.waitForTimeout(1300);
  await shot('m09-member', '이름을 누르면 그 사람의 모든 것');
  await page.evaluate(() => arMemoOpen('p2')); await page.waitForTimeout(700);
  await shot('m10-memo', '코칭 메모 — 이 자리에서 적고 저장');
  await page.evaluate(() => { arMemoOpen('p2'); arOpen('p2'); });
  await cat('touch');
  await page.evaluate(() => { AR.tkAll = true; arPaint(); }); await page.waitForTimeout(900);
  await shot('m11-touch-team', '팀 전체 — 줄마다 담당자 이름');
  await page.evaluate(() => { AR.tkAll = false; });

  /* ── 영업 관리 ── */
  await page.evaluate(() => go('crm')); await page.waitForTimeout(2800);
  await shot('m12-crm', 'DB 통합 CRM — 통화를 남기는 곳');
  await page.evaluate(() => { crmFeedOpen(); }); await page.waitForTimeout(900);
  await page.evaluate(() => crmFeedAsk()).catch(()=>{}); await page.waitForTimeout(900);
  await shot('m13-crmai', 'CRM 안에서 받는 내 전화 습관 진단');
  await page.evaluate(() => { crmFeedClose(); exitCrm(); go('clients'); }); await page.waitForTimeout(2600);
  await shot('m14-clients', '고객 365일 — 계약한 뒤 1년');
  await page.evaluate(() => go('teamhub')); await page.waitForTimeout(2600);
  await shot('m15-check', '실행 체크판 — 오늘·이번 주·업무 루트');
  await page.evaluate(() => go('daily')); await page.waitForTimeout(2600);
  await page.evaluate(() => dgGen()).catch(()=>{}); await page.waitForTimeout(2000);
  await shot('m16-daily', '매일 취합 — 팀에 전할 말');

  fs.writeFileSync(path.join(OUT,'index.json'), JSON.stringify(shots,null,1));
  console.log(errs.length ? ('\n⚠ ' + errs.slice(0,4).join(' | ')) : '\n콘솔 오류 없음');
  console.log(shots.length + '장');
  await b.close(); srv.close();
})();
