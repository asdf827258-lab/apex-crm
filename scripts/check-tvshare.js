/* 약관 판정을 팀이 같이 보는가 — 그리고 약관 원문은 안 나가는가.

   여태 약관 서재는 넣은 브라우저에만 쌓였다. 사무실에서 40건을 넣어도
   팀원 화면은 비어 있었다. 「원수사 약관을 서버에 두지 않는다」 는 원칙
   때문에 일부러 그렇게 만든 구조였다.

   그 원칙은 그대로 두고, <b>판정 결과</b>만 올린다.

     올라가는 것    회사 · 상품명 · 종류 · 등급 · 유리/불리 건수
                    29항목 판정(항목 이름과 판정만) · 독소조항 이름
     안 올라가는 것  약관 원문 · PDF · 조문에서 뽑은 인용 문장

   여기서 확인한다.

     1. 팀 판정 단추가 있고 열리는가
     2. 판정을 하면 <b>저절로</b> 올라가는가
     3. 올라간 것에 <b>약관 원문이 안 섞여 있는가</b> — 이게 제일 중요하다
     4. 다른 사람이 올린 것이 내 화면에 보이는가 (약관을 안 넣었는데도)
     5. 찾기가 되는가
     6. 표가 없거나 권한에 막히면 사람 말로 알려 주는가
     7. 로그인 안 된 화면에서는 그렇다고 말해 주는가                  */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url'), os = require('os');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
const APP_HTML = '<!doctype html><html><head><title>APEX YUN PRO</title></head><body>앱 첫 화면</body></html>';

/* 다른 팀원이 이미 올려 둔 판정 — 내 브라우저엔 그 약관이 없다 */
const TEAM_ROWS = [
  { id: 'v1', owner_id: 'u-2', co: '한화생명', title: '무배당 든든종신보험', kind: '종신',
    grade: 'A', good: 7, bad: 2, by_name: '홍길동', updated_at: '2026-08-14T00:00:00Z',
    verdict: [{ c: '암', k: '진단확정 기준', v: 'good', lab: '임상학적 진단도 인정' }],
    toxic: [{ cat: '갱신', label: '갱신형 특약 보험료 인상 가능' }] },
  { id: 'v2', owner_id: 'u-3', co: '삼성생명', title: '간편심사 건강보험', kind: '건강',
    grade: 'B', good: 4, bad: 5, by_name: '김철수', updated_at: '2026-08-13T00:00:00Z',
    verdict: [{ c: '뇌', k: '뇌혈관질환 범위', v: 'bad', lab: '뇌졸중으로 한정' }],
    toxic: [{ cat: '감액', label: '1년 이내 50% 감액지급' }] }
];

const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname);
  if (p === '/__app.html' || p === '/__nologin.html') {
    const login = p === '/__app.html';
    rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    rs.end('<!doctype html><html><head><meta charset="utf-8"><title>APEX</title></head><body>' +
      '<script>' +
      'window.__up=[];window.__rows=' + JSON.stringify(TEAM_ROWS) + ';window.__err=null;' +
      'function getAppToken(){return "";}' +
      (login ?
        ('window.OS={profile:{id:"u-1",name:"윤시현"}};' +
         'window.osClient=function(){return {from:function(t){return {' +
         '  upsert:function(rows,opts){window.__up.push({t:t,rows:rows,opts:opts});' +
         '    return Promise.resolve({data:rows,error:null});},' +
         '  select:function(){var b={order:function(){return b;},' +
         '    limit:function(){return Promise.resolve({data:window.__err?null:window.__rows,error:window.__err});}};' +
         '    return b;}};}};};')
        : '') +
      '<\/script>' +
      '<iframe id="mk" style="width:1200px;height:900px;border:0" ' +
      'src="/app/%EC%83%81%EB%8B%B4%EC%9E%90%EB%A3%8C/%EB%AF%B8%EB%81%BC%EB%A0%88%EC%9D%B4%EB%8D%94/index.html"></iframe>' +
      '</body></html>');
    return;
  }
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    const idx = path.join(f, 'index.html');
    if (fs.existsSync(idx)) f = idx;
    else { rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); rs.end(APP_HTML); return; }
  }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 진짜 약관처럼 생긴 글 — 여기 있는 문장이 서버로 새면 안 된다 */
const SECRET = '회사는 피보험자가 보험기간 중 암으로 진단확정된 경우 암진단보험금을 지급합니다';
const TERMS =
  '제1조(목적) 이 약관은 보험계약에 관한 사항을 정함을 목적으로 합니다.\n' +
  '제3조(보험금의 지급사유) ' + SECRET + '. 다만 계약일부터 90일이 지나지 아니한 때에는 지급하지 아니합니다. ' +
  '암의 진단확정은 병리학적 진단이 가능하지 않은 경우 임상학적 진단도 인정합니다.\n' +
  '제5조(지급하지 않는 사유) 회사는 피보험자가 고의로 자신을 해친 경우 보험금을 지급하지 않습니다. ' +
  '갱신형 특약의 보험료는 갱신 시점의 나이와 위험률에 따라 인상될 수 있습니다.\n' +
  '제7조(감액지급) 계약일부터 1년 이내에 보험금 지급사유가 발생한 경우 보험금의 50퍼센트를 감액하여 지급합니다.\n';

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto(base + '/__app.html', { waitUntil: 'domcontentloaded' });
  const fr = await (await page.waitForSelector('#mk')).contentFrame();
  await fr.waitForFunction(() => typeof goRun === 'function' && typeof uploadFiles === 'function',
                           null, { timeout: 30000 });
  await fr.waitForFunction(() => !!document.getElementById('tvOpen'), null, { timeout: 20000 });

  console.log('\n[1] 팀 판정 단추가 있고 열린다');
  await fr.waitForFunction(() => tvState().n > 0, null, { timeout: 20000 });
  const pill = await fr.evaluate(() => document.getElementById('tvOpen').textContent);
  is(/팀 판정/.test(pill), '  「🤝 팀 판정」 단추가 있다 — ' + pill);
  is(/2/.test(pill), '  몇 건인지 단추에 보인다');
  await fr.evaluate(() => document.getElementById('tvOpen').click());
  await fr.waitForSelector('#tvList', { timeout: 10000 });
  const box = await fr.evaluate(() => document.getElementById('tvBox').textContent.replace(/\s+/g, ' '));
  is(/다 같이 봅니다/.test(box), '  누구나 로그인하면 본다고 적혀 있다');
  is(/약관 원문[^.]*브라우저에만/.test(box), '  약관 원문은 안 올라간다고도 밝혀 둔다');

  console.log('\n[2] 남이 올린 판정이 내 화면에 보인다 (내 서재는 비어 있는데도)');
  const mine = await fr.evaluate(() => ((state.lib && state.lib.items) || []).length);
  is(mine === 0, '  내 서재는 아직 비어 있다 — ' + mine + '건');
  const listed = await fr.evaluate(() => document.getElementById('tvList').textContent.replace(/\s+/g, ' '));
  is(/든든종신/.test(listed) && /간편심사/.test(listed), '  남이 올린 두 건이 다 보인다');
  is(/한화생명/.test(listed) && /삼성생명/.test(listed), '  회사 이름이 보인다');
  is(/유리 7/.test(listed) && /불리 5/.test(listed), '  유리·불리 건수가 보인다');
  is(/갱신형 특약/.test(listed), '  독소조항이 보인다');
  is(/홍길동/.test(listed) && /김철수/.test(listed), '  누가 올렸는지 보인다');

  console.log('\n[3] 찾기가 된다');
  await fr.evaluate(() => { const q = document.getElementById('tvQ'); q.value = '삼성'; q.oninput.call(q); });
  const found = await fr.evaluate(() => document.getElementById('tvList').textContent);
  is(/간편심사/.test(found) && !/든든종신/.test(found), '  회사 이름으로 걸러진다');
  await fr.evaluate(() => { const q = document.getElementById('tvQ'); q.value = ''; q.oninput.call(q); });

  console.log('\n[4] 판정하면 저절로 올라간다');
  const tmp = path.join(os.tmpdir(), 'tv-terms.txt');
  fs.writeFileSync(tmp, TERMS);
  await fr.evaluate(() => { const t = [...document.querySelectorAll('.tab')].find(x => x.dataset.t === 'lib'); if (t) t.click(); });
  await fr.setInputFiles('#upFiles', tmp);
  await fr.waitForFunction(() => /쌓았습니다/.test((document.getElementById('upState') || {}).innerHTML || ''),
                           null, { timeout: 30000 });
  await fr.evaluate(() => { const t = [...document.querySelectorAll('.tab')].find(x => x.dataset.t === 'start'); if (t) t.click(); });
  await fr.evaluate(() => document.getElementById('btnGo').click());
  await fr.waitForFunction(() => /완료|오류/.test((document.getElementById('goState') || {}).textContent || ''),
                           null, { timeout: 60000 });
  await page.waitForFunction(() => window.__up.length > 0, null, { timeout: 20000 });
  const up = await page.evaluate(() => window.__up);
  is(up.length >= 1, '  판정이 끝나자 저절로 올렸다 — ' + up.length + '번');
  is(up[0].t === 'terms_verdicts', '  올린 곳이 terms_verdicts 다 — ' + up[0].t);
  is(up[0].opts && up[0].opts.onConflict === 'id,owner_id',
     '  같은 상품을 여럿이 판정해도 서로 안 덮어쓴다 (id,owner_id) — ' + (up[0].opts || {}).onConflict);
  const row = up[0].rows[0];
  is(!!row && !!row.id && row.owner_id === 'u-1', '  내 이름으로 올라간다 — ' + (row || {}).owner_id);
  is(!!row && row.by_name === '윤시현', '  올린 사람 이름이 담긴다 — ' + (row || {}).by_name);
  is(!!row && (row.verdict || []).length > 0, '  29항목 판정이 담긴다 — ' + ((row || {}).verdict || []).length + '개');
  is(!!row && (row.toxic || []).length > 0, '  독소조항이 담긴다 — ' +
     ((row || {}).toxic || []).map(t => t.label).join(', ').slice(0, 46));

  console.log('\n[5] 올라간 것에 약관 원문이 안 섞여 있다 — 이게 제일 중요하다');
  const blob = JSON.stringify(up);
  is(blob.indexOf(SECRET) < 0, '  약관 문장이 그대로 안 실린다');
  is(!/제\s*\d+\s*조/.test(blob), '  조문 인용이 안 실린다');
  is(!/지급하지 아니한다|지급하지 않습니다/.test(blob), '  약관 문투가 안 실린다');
  const longest = await page.evaluate(() => {
    let n = 0;
    window.__up.forEach(u => u.rows.forEach(r => {
      Object.keys(r).forEach(k => { if (typeof r[k] === 'string' && r[k].length > n) n = r[k].length; });
      (r.verdict || []).concat(r.toxic || []).forEach(v =>
        Object.keys(v).forEach(k => { if (typeof v[k] === 'string' && v[k].length > n) n = v[k].length; }));
    }));
    return n;
  });
  is(longest <= 120, '  가장 긴 글자도 ' + longest + '자다 (본문이 실릴 수 없는 길이)');

  console.log('\n[6] 서버가 막히면 사람 말로 알려 준다');
  await page.evaluate(() => { window.__err = { code: '42P01', message: 'relation "terms_verdicts" does not exist' }; });
  await fr.evaluate(() => tvPull());
  await fr.waitForFunction(() => tvState().err, null, { timeout: 15000 });
  let err = await fr.evaluate(() => tvState().err);
  is(/서버 준비 SQL/.test(err), '  표가 없으면 준비 SQL 을 실행하라고 말한다 — ' + err.slice(0, 46));
  is(!/relation|does not exist/i.test(err), '  영어 오류를 그대로 던지지 않는다');

  await page.evaluate(() => { window.__err = { code: '42501', message: 'new row violates row-level security policy' }; });
  await fr.evaluate(() => tvPull());
  await fr.waitForFunction(() => /권한/.test(tvState().err), null, { timeout: 15000 });
  err = await fr.evaluate(() => tvState().err);
  is(/권한/.test(err) && /서버 준비 SQL/.test(err), '  권한에 막혀도 무엇을 하면 되는지 말한다');

  console.log('\n[7] 로그인 안 된 화면에서는 그렇다고 말해 준다');
  const solo = await ctx.newPage();
  const sErr = [];
  solo.on('pageerror', e => sErr.push(String(e).slice(0, 140)));
  await solo.goto(base + '/__nologin.html', { waitUntil: 'domcontentloaded' });
  const fr2 = await (await solo.waitForSelector('#mk')).contentFrame();
  await fr2.waitForFunction(() => !!document.getElementById('tvOpen'), null, { timeout: 20000 });
  await fr2.evaluate(() => document.getElementById('tvOpen').click());
  await fr2.waitForSelector('#tvList', { timeout: 10000 });
  await fr2.waitForFunction(() => tvState().err, null, { timeout: 15000 });
  const soloErr = await fr2.evaluate(() => tvState().err);
  is(/앱 안에서 열어 주세요/.test(soloErr), '  로그인한 화면에서만 보인다고 말한다 — ' + soloErr.slice(0, 40));
  is(sErr.length === 0, '  로그인 없이 열어도 안 터진다' + (sErr.length ? ' — ' + sErr[0] : ''));

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  try { fs.unlinkSync(tmp); } catch (e) {}
  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '팀 판정 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '팀 판정 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
