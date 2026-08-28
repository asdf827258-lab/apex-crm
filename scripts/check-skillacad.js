/* <b>「본인 역량 체크가 있는데, 이걸 공부할 데가 없다」</b>

   TFA 업무관리의 <b>🎓 본인 역량 체크</b>는 열두 가지를 늘어놓고
   「하나씩 끝내고 <b>스스로 합격을 줍니다</b>」 라고만 했습니다.
   그런데 <b>무엇을 읽고</b> 합격할지가 없었습니다. 합격 기준만 있고
   교재가 없으니, 결국 아무도 안 찍거나 안 읽고 찍습니다.

   사장님 말씀 — 「이 부분을 공부할수 있도록 <b>보험마스터아카데미에
   연결</b>해서 이해할수 있도록 만들어줘, 클릭하면 관련 자료로」.

   ── 여기서 제일 조심할 것 ─────────────────────────────────────────
   <b>없는 장에 잇는 것</b>입니다(CLAUDE.md 1번). 눌러 들어갔는데 그 주제가
   없으면, 팀원은 「교재가 부실하다」 가 아니라 <b>「내가 못 찾는다」</b> 고
   생각하고 그만둡니다. 그래서 이 점검은 <b>이어 둔 장이 교재에 정말
   있는지</b>, 그리고 <b>그 장에 그 주제가 정말 들어 있는지</b>를
   교재 원문을 세어서 확인합니다.

   지키는 것
     1. 열두 역량이 그대로 있고, 이어 둔 것은 <b>교재에 있는 장</b>이다
     2. 이어 둔 장에 그 주제가 <b>실제로 나온다</b> (원문에서 센다)
     3. 교재에 없는 주제는 <b>빈칸</b>이고, 없다고 <b>말한다</b>
     4. 눌러서 <b>실제로 그 장이 열린다</b> · 이미 떠 있어도 옮겨진다
     5. 교재 단추가 <b>합격 도장을 찍지 않는다</b> — 서로 다른 일이다
     6. 표가 <b>한 벌</b>이다 — 이어 둔 곳이 두 군데면 한쪽만 고친다 (5번) */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const SRC = fs.readFileSync('app/index.html', 'utf8');
const ACAD = ['app/보험아카데미/data1.js', 'app/보험아카데미/data2.js']
  .map(f => fs.readFileSync(f, 'utf8')).join('\n');
/* 교재를 <b>강의 단위</b>로 자른다 — 파일 전체에서 세면 옆 장의 낱말을
   내 장의 것으로 착각한다. */
const LES = {};
ACAD.split(/(?=id:"L\d+", lvl:)/).forEach(s => {
  const m = s.match(/^id:"(L\d+)", lvl:\d+, title:"([^"]*)"/);
  if (m) LES[m[1]] = { title: m[2], body: s };
});

/* 역량마다 「그 장에 정말 있는지」 를 재는 낱말. 여기 적은 낱말이 그 장에
   안 나오면 이은 것이 <b>틀린 것</b>이다.

   ⚠ 낱말은 <b>교재가 쓰는 말</b>로 적어야 한다. 처음에 s2 를 「진단금」으로
   재서 <b>0회</b>가 나왔는데, 이은 곳(L3)이 틀린 것이 아니라 <b>교재가
   「진단비」라고 쓴다</b>는 뜻이었다. 앱은 「진단금」, 교재는 「진단비」다.
   잣대가 틀렸을 때 코드를 고치면 멀쩡한 이음을 끊게 된다 (8번).        */
const WORD = {
  s1: ['급여', '비급여'], s2: ['진단비', '일반암', '소액암'], s3: ['뇌출혈', '뇌경색'],
  s4: ['간병'], s5: ['면책', '고지'], s6: ['국민연금'],
  s7: ['변액'], s9: ['퇴직연금'], s10: ['비과세'], s11: ['상속']
};

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('404'); return; }
  const ct = /\.js$/.test(f) ? 'application/javascript'
           : (/\.css$/.test(f) ? 'text/css' : 'text/html');
  rs.writeHead(200, { 'Content-Type': ct + '; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  console.log('\n[1] 교재로 가는 단추가 실제로 붙어 있다');
  const R = await page.evaluate(() => {
    /* 견본 사람은 홍길동 (CLAUDE.md 3번) */
    OS.profile = { id: 'u1', name: '홍길동', role: 'owner', active: true, plan: 'pro' };
    const host = document.getElementById('dynPane') || document.getElementById('main');
    host.innerHTML = arSkillHtml();
    return {
      cards: document.querySelectorAll('.ar-sk').length,
      cur: GB_CUR.length,
      go: document.querySelectorAll('.ar-sk-go').length,
      none: document.querySelectorAll('.ar-sk-none').length,
      noneTx: [...document.querySelectorAll('.ar-sk-none')].map(x => x.textContent.trim()),
      part: [...document.querySelectorAll('.ar-sk-part')].map(x => x.textContent.trim()),
      map: JSON.parse(JSON.stringify(GB_ACAD)),
      ids: GB_CUR.map(c => c[0]),
      foot: (document.querySelector('.notice') || {}).textContent || ''
    };
  });
  is(R.cards === R.cur && R.cur === 12, '  역량이 <b>열둘</b> 그대로다 — 칸 ' + R.cards + '개');
  is(R.go + R.none === R.cur,
     '  칸마다 <b>교재 단추이거나 「없습니다」</b> 둘 중 하나다 — ' +
     R.go + '개 + ' + R.none + '개 = ' + (R.go + R.none));
  is(R.go >= 8, '  <b>' + R.go + '개</b>가 교재로 이어져 있다');

  console.log('\n[2] 이어 둔 장이 교재에 정말 있다 — 없는 곳으로 보내지 않는다 (1번)');
  const linked = R.ids.filter(id => R.map[id]);
  const ghost = linked.filter(id => !LES[R.map[id].l]);
  is(ghost.length === 0,
     '  이어 둔 <b>' + linked.length + '개 장이 모두 교재에 있다</b>' +
     (ghost.length ? ' ← 없는 장: ' + ghost.map(i => i + '→' + R.map[i].l).join(' · ') : ''));
  const badTitle = linked.filter(id => LES[R.map[id].l] && LES[R.map[id].l].title !== R.map[id].t);
  is(badTitle.length === 0,
     '  단추에 적은 <b>장 제목이 교재와 같다</b> — 딴 제목을 보여 주고 딴 데로 보내지 않는다' +
     (badTitle.length ? ' ← ' + badTitle.map(i => i + ': 「' + R.map[i].t + '」 ≠ 「' +
        LES[R.map[i].l].title + '」').join(' · ') : ''));

  console.log('\n[3] 그 장에 그 주제가 실제로 들어 있다 — 원문에서 센다');
  let weak = [];
  Object.keys(WORD).forEach(id => {
    const m = R.map[id];
    if (!m || !LES[m.l]) { weak.push(id + '(이은 데 없음)'); return; }
    const n = WORD[id].reduce((a, w) => a + (LES[m.l].body.split(w).length - 1), 0);
    if (n < 3) weak.push(id + '→' + m.l + ' ' + WORD[id].join('·') + ' ' + n + '회');
  });
  is(weak.length === 0,
     '  잰 <b>' + Object.keys(WORD).length + '개 주제가 모두 그 장에 나온다</b> (각 3회 이상)' +
     (weak.length ? ' ← 약한 곳: ' + weak.join(' · ') : ''));

  console.log('\n[4] 교재에 없는 주제는 빈칸이고, 없다고 말한다');
  const blank = R.ids.filter(id => !R.map[id]);
  is(blank.length > 0,
     '  <b>일부러 비운 것이 있다</b> — ' + blank.join(' · ') +
     ' (열둘을 억지로 다 채우면 없는 장으로 보내게 된다)');
  is(R.noneTx.every(t => /없습니다/.test(t)),
     '  그 자리에 <b>「교재에 이 주제로 된 장이 없습니다」</b> 라고 적는다');
  is(R.part.length > 0 && /교재에 없습니다/.test(R.part[0] || ''),
     '  <b>일부만 다루는 것</b>도 밝힌다 — 「' + (R.part[0] || '(없음)').slice(0, 34) + '…」');
  is(/일부러 비워/.test(R.foot),
     '  카드 아래에도 <b>왜 비었는지</b> 적는다 — 사장님이 「빠뜨렸나」 하시지 않게');

  console.log('\n[5] 눌러서 실제로 그 장이 열린다');
  const G = await page.evaluate(async () => {
    gbOpenAcad('s3');
    await new Promise(r => setTimeout(r, 2500));
    const f = document.getElementById('bohumFrame');
    let h1 = '?'; try { h1 = f.contentWindow.location.hash; } catch (e) { h1 = '막힘'; }
    /* 이미 떠 있을 때 <b>또</b> 눌러도 옮겨져야 한다 — 여기서 안 되면
       두 번째 역량부터는 첫 장만 계속 보게 된다 */
    gbOpenAcad('s5');
    await new Promise(r => setTimeout(r, 1400));
    let h2 = '?'; try { h2 = f.contentWindow.location.hash; } catch (e) { h2 = '막힘'; }
    return { tab: (typeof currentTab === 'function') ? currentTab() : '', h1, h2 };
  });
  is(G.tab === 'bohum', '  <b>교재 화면</b>으로 간다 — 「' + G.tab + '」');
  is(G.h1 === '#' + R.map.s3.l,
     '  s3 을 누르면 교재가 <b>' + R.map.s3.l + '</b> 로 간다 — 지금 「' + G.h1 + '」');
  is(G.h2 === '#' + R.map.s5.l,
     '  이미 떠 있어도 s5 → <b>' + R.map.s5.l + '</b> 로 옮겨진다 — 지금 「' + G.h2 + '」' +
     (G.h2 === '#' + R.map.s5.l ? '' : ' ← 두 번째부터 안 옮겨지면 첫 장만 계속 보십니다'));
  const NO = await page.evaluate(() => {
    let said = ''; const t = window.toast; window.toast = function (m) { said = m; };
    gbOpenAcad('s8'); window.toast = t;
    return { said, tab: (typeof currentTab === 'function') ? currentTab() : '' };
  });
  is(/없습니다/.test(NO.said),
     '  이어 둔 데가 없는 것을 부르면 <b>말하고 안 보낸다</b> — 「' + NO.said.slice(0, 30) + '…」');

  console.log('\n[6] 교재 단추가 합격 도장을 찍지 않는다 — 서로 다른 일이다');
  const S = await page.evaluate(async () => {
    OS.profile = { id: 'u1', name: '홍길동', role: 'owner', active: true, plan: 'pro' };
    const host = document.getElementById('dynPane') || document.getElementById('main');
    host.innerHTML = arSkillHtml();
    let stamped = 0; const real = window.gbStamp;
    window.gbStamp = function () { stamped++; };
    document.querySelector('.ar-sk-go').click();
    await new Promise(r => setTimeout(r, 200));
    window.gbStamp = real;
    return stamped;
  });
  is(S === 0,
     '  교재를 열어도 <b>합격이 안 찍힌다</b> — 읽으러 가려다 합격을 찍으면 안 된다 (' + S + '번)');

  console.log('\n[7] 이어 둔 표가 한 벌이다 (5번)');
  is((SRC.match(/var GB_ACAD\s*=/g) || []).length === 1,
     '  <b>GB_ACAD 가 한 곳</b>에만 있다 — ' + (SRC.match(/var GB_ACAD\s*=/g) || []).length + '군데');
  const noC = SRC.replace(/\/\*[\s\S]*?\*\//g, ' ');
  is((noC.match(/'L(?:[0-9]|10)'\s*,\s*t\s*:/g) || []).length === 0 ||
     (noC.match(/GB_ACAD\[/g) || []).length > 0,
     '  장 번호를 <b>다른 데 또 적어 두지 않았다</b> — 부르는 쪽은 GB_ACAD 를 본다');

  console.log('\n[8] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 역량 체크에서 교재로 못 갑니다')
                  : '✓ 누르면 그 장이 열리고 · 없는 것은 없다고 말합니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
