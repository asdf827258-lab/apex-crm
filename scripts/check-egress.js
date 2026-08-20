/* 서버에서 <b>쓸데없이 많이</b> 받아 오지 않는가.

   실제로 이런 일이 있었다. 「AI 조직 라이브」 화면이 60초마다 AI 보고서
   <b>본문 120건</b>을 통째로 다시 받았다. body 는 AI 가 쓴 글이라 길이
   제한이 없다. 화면 하나 열어 두면 한 시간에 수십 MB 가 나갔고,
   그것이 쌓여 Supabase 무료 한도(월 5GB)를 <b>세 배(15GB)</b> 로 넘겼다.
   한도를 넘기자 프로젝트가 통째로 막혔고 — <b>로그인까지 안 됐다.</b>

   그 화면은 2026-08-20 에 지웠다. 그런데 없앤 것으로 끝이 아니다.
   <b>같은 실수를 다시 하지 않는 것</b>이 중요하다. 숫자가 새는 것은
   눈에 안 보이기 때문이다.

   여기서 지킨다.

     1. 2분 안쪽으로 되풀이하면서 <b>본문</b>을 받아 오는 타이머가 없는가
     2. 저절로 도는 것은 화면을 안 볼 때 <b>쉬는가</b>
     3. 지운 화면이 정말 없어졌는가 — 되살아나면 다시 샌다
     4. 지운 칸을 가리키는 옛 즐겨찾기·주소가 앱을 깨뜨리지 않는가

   저절로 움직이는 것을 새로 넣을 때는 이것부터 계산한다 —
   <b>한 번에 몇 바이트 × 하루 몇 번 × 몇 사람.</b>                   */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
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

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');

(async () => {
  console.log('\n[1] 되풀이하면서 본문을 받아 오는 타이머가 없다');
  /* 소스에서 setInterval 을 훑어, 2분 안쪽인데 본문을 받는 것이 있는지 본다 */
  const fast = [];
  const re = /setInterval\(([\s\S]{0,500}?),\s*(\d+)\s*\)/g;
  let m;
  while ((m = re.exec(SRC))) {
    const secs = +m[2] / 1000;
    if (secs > 0 && secs < 120 && /\.select\(|\.from\(|body/.test(m[1]))
      fast.push(Math.round(secs) + '초 · ' + m[1].replace(/\s+/g, ' ').slice(0, 70));
  }
  is(fast.length === 0, '  2분 안쪽으로 서버를 부르는 타이머가 없다' +
     (fast.length ? ' — ' + fast.join(' / ') : ''));
  /* 처음엔 「본문 서른 건 넘게 받지 마라」 로 잡았는데 그건 과했다.
     코칭 기록·건의처럼 사람이 쓴 짧은 글을 화면 열 때 한 번 받는 것은
     정상이다. 문제는 <b>되풀이</b> 와 <b>죽은 자료</b> 다.
     날마다 도는 백업이 아무도 안 보는 표를 본문까지 실어 나르지 않는지 본다. */
  const bk = (SRC.match(/function osBackupRun[\s\S]{0,3000}?\n\}\n/) || [''])[0];
  is(bk.length > 200, '  자동 백업 코드를 찾았다');
  /* 주석에 적힌 표 이름을 코드로 착각하면 안 된다 — 실제 sb.from() 만 본다 */
  const tabs = (bk.match(/sb\.from\('([a-z_]+)'\)/g) || []).map(x => x.match(/'([a-z_]+)'/)[1]);
  const dead = tabs.filter(t => t === 'ai_dept_reports' || t === 'ai_ideas');
  is(dead.length === 0, '  날마다 도는 백업이 지운 화면의 표를 안 실어 나른다' +
     (dead.length ? ' — ' + dead.join(',') : ' (' + tabs.join(' · ') + ')'));
  const idx = (bk.match(/r\[(\d+)\]/g) || []).map(x => +x.match(/\d+/)[0]);
  const froms = (bk.match(/sb\.from\(/g) || []).length;
  is(idx.every(i => i < froms),
     '  꾸러미가 없는 자리를 안 가리킨다 (표 ' + froms + '개 · 가장 큰 자리 ' + Math.max(0, ...idx) + ')');

  console.log('\n[2] 저절로 도는 것은 안 볼 때 쉰다');
  const timers = SRC.match(/function inv(?:Start)?Timer\s*\([\s\S]{0,400}?\n\}/g) || [];
  is(timers.length > 0 && timers.every(t => /document\.hidden/.test(t)),
     '  시세 새로고침이 다른 탭에 있으면 쉰다');

  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n[3] 지운 화면이 정말 없어졌다');
  const gone = await page.evaluate(() => {
    const ids = [];
    TABS.forEach(g => g.items.forEach(it => ids.push(it.id)));
    return {
      menu: ['yoonsi', 'ai_org', 'ai_meet', 'ai_desk'].filter(x => ids.indexOf(x) >= 0),
      fns: ['renderAiOrg', 'aoLoad', 'aoTick', 'renderAiMeet', 'renderAiDeskPage',
            'mountYoonsi', 'exitYoonsi', 'ysHandle', 'aqRun']
            .filter(n => typeof window[n] === 'function'),
      frame: !!document.getElementById('yoonsiFrame')
    };
  });
  is(gone.menu.length === 0, '  메뉴에 안 남아 있다' + (gone.menu.length ? ' — ' + gone.menu.join(',') : ''));
  is(gone.fns.length === 0, '  함수가 안 남아 있다' + (gone.fns.length ? ' — ' + gone.fns.join(',') : ''));
  is(!gone.frame, '  윤시스쿨 창(iframe)도 없다');

  console.log('\n[4] 옛 즐겨찾기·주소가 앱을 깨뜨리지 않는다');
  const stale = await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    window.toast = function () {};
    OS.profile = { id: 'me', name: '점검', role: 'owner', plan: 'vip' };
    const out = { errs: [], panes: [] };
    ['yoonsi', 'ai_org', 'ai_meet', 'ai_desk'].forEach(t => {
      try { go(t); } catch (e) { out.errs.push(t + ': ' + String(e).slice(0, 60)); }
      const p = document.getElementById('dynPane');
      out.panes.push((p ? p.textContent : '').replace(/\s+/g, ' ').trim().length);
    });
    /* 지운 칸이 즐겨찾기에 남아 있어도 메뉴가 서야 한다 */
    try { localStorage.setItem('apex_nav_fav_me', JSON.stringify(['yoonsi', 'ai_org', 'clients'])); } catch (e) {}
    try { renderNav(); } catch (e) { out.errs.push('renderNav: ' + String(e).slice(0, 60)); }
    const host = document.getElementById('navHost');
    out.favRows = host ? host.querySelectorAll('.nav-pin .nav-row').length : -1;
    return out;
  });
  is(stale.errs.length === 0, '  지운 칸을 열어도 안 터진다' + (stale.errs.length ? ' — ' + stale.errs[0] : ''));
  is(stale.panes.every(n => n > 0), '  빈 화면이 아니라 안내가 뜬다');
  is(stale.favRows === 1, '  즐겨찾기에 남은 옛 칸은 조용히 걸러진다 (살아 있는 1개만) — ' + stale.favRows);

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '서버 사용량 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '서버 사용량 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
