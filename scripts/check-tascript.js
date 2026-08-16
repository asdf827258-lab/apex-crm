/* TA 스크립트가 손 닿는 자리에 있는가.

   AI 생성기(GEN)는 정의된 자리와 실제로 붙는 자리가 다르다.
   카드에는 tab:'script' 라고 적혀 있지만, 파일 끝에서
     retab('ta_intro','cs_assist')
   가 실행되면서 「AI 상담 어시스턴트」 안으로 옮겨진다. 그래서 카드에
   적힌 tab 만 보고 「메뉴에 없으니 고아」라고 판단하면 틀린다 — 실제로
   열리는 자리는 retab 을 먹인 뒤에 정해진다.

   반대로 retab 이 메뉴에 없는 칸으로 보내면 그 도구는 진짜로 못 연다.
   그래서 여기서는 retab 을 그대로 적용한 뒤에 도달 가능성을 본다.

   그리고 전화를 거는 자리는 DB 통합 CRM 이다. 화법이 앱 쪽에만 있으면
   신입은 창을 두 개 띄워 놓고 눈을 왔다 갔다 해야 한다. 그래서 통화
   기록 창 안에도 화법을 넣었다.

     1. TA 인트로 멘트가 어느 칸으로 가고, 그 칸이 메뉴에 있는가
     2. 그 칸을 열면 실제로 그려지는가
     3. AI 도구 전부가 열 수 있는 칸에 앉아 있는가 (진짜 고아 잡기)
     4. DB 통합 CRM 통화 기록 창에서 화법을 바로 볼 수 있는가
     5. 결과(부재·거절·상담)를 고르면 그 결과의 다음 말이 켜지는가
     6. 금소법에서 걸리는 말이 안 들어가 있는가                          */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8877;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const STUB = `
window.supabase={createClient:function(){
 var mk=function(){var one=false;var a={
  select:function(){return a},eq:function(){return a},in:function(){return a},or:function(){return a},
  order:function(){return a},limit:function(){return a},gte:function(){return a},lte:function(){return a},
  insert:function(){return a},update:function(){return a},upsert:function(){return a},delete:function(){return a},
  single:function(){one=true;return a},maybeSingle:function(){one=true;return a},
  then:function(f){return Promise.resolve({data:one?null:[],error:null}).then(f)}};
  return a};
 return {from:function(){return mk()},rpc:function(){return Promise.resolve({data:null,error:null})},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'u1'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'u1'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
try{localStorage.setItem('apex_ar_brief_off','1');localStorage.setItem('apex_ar_auto_off','1');}catch(e){}
`;

let pass = 0, fail = 0;
const ok = m => { pass++; console.log('  ✓ ' + m); };
const no = m => { fail++; console.log('  ✗ ' + m); };
const is = (c, m) => c ? ok(m) : no(m);

/* 금소법에서 걸리는 말 — 단정·과장·기만 */
const BANNED = ['무조건', '100% 보장', '전액 보장', '손해 안', '반드시 받', '정부 지원금',
  '국가에서 지급', '마지막 기회', '오늘까지만', '무료로 드립니다'];

function balanced(src, from) {          /* from 위치의 [ 부터 짝 맞는 ] 까지 */
  let d = 0;
  for (let k = from; k < src.length; k++) {
    if (src[k] === '[') d++;
    else if (src[k] === ']') { d--; if (d === 0) return src.slice(from, k + 1); }
  }
  return '';
}

(async () => {
  const app = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const crm = fs.readFileSync(path.join(ROOT, 'db-crm.html'), 'utf8');

  const tabsSrc = balanced(app, app.indexOf('var TABS=[') + 'var TABS='.length);
  const genSrc = balanced(app, app.indexOf('var GEN=[') + 'var GEN='.length);
  const menuIds = new Set([...tabsSrc.matchAll(/id:'([a-z_0-9]+)'/g)].map(m => m[1]));

  /* 카드에 적힌 자리 → retab 을 먹인 뒤의 진짜 자리 */
  const cards = [...genSrc.matchAll(/\{id:'([a-z_0-9]+)',tab:'([a-z_0-9]+)',icon:'([^']*)',title:'([^']*)'/g)]
    .map(m => ({ id: m[1], tab: m[2], icon: m[3], title: m[4] }));
  const moves = {};
  [...app.matchAll(/retab\('([a-z_0-9]+)','([a-z_0-9]+)'\)/g)].forEach(m => { moves[m[1]] = m[2]; });
  cards.forEach(c => { c.real = moves[c.id] || c.tab; });

  /* ═══ 1 ═══ */
  console.log('\n[1] TA 인트로 멘트가 어느 칸으로 가는가');
  const ta = cards.find(c => c.id === 'ta_intro');
  is(!!ta, 'GEN 에 「TA 인트로 멘트」가 있다');
  is(ta && ta.tab !== ta.real,
    '카드에 적힌 자리(' + (ta && ta.tab) + ')와 실제 자리(' + (ta && ta.real) + ')가 다르다 — retab 이 옮긴다');
  is(ta && menuIds.has(ta.real),
    '옮겨 간 자리가 메뉴에 있다 — ' + (ta && ta.real) + ' (💬 AI 상담 어시스턴트)');

  /* ═══ 3 (소스로 먼저) ═══ */
  console.log('\n[2] AI 도구 전부가 열 수 있는 칸에 앉아 있는가');
  const orphans = cards.filter(c => !menuIds.has(c.real));
  is(orphans.length === 0,
    'AI 도구 ' + cards.length + '개가 전부 메뉴에 있는 칸에 앉아 있다' +
    (orphans.length ? ' — 못 여는 것: ' + orphans.map(o => o.title + '(' + o.real + ')').join(' · ') : ''));

  /* ═══ 2 (실제로 열어 본다) ═══ */
  console.log('\n[3] 그 칸을 열면 실제로 그려지는가');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  const errs = []; page.on('pageerror', e => errs.push('' + e));
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home',
    { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(3000);
  /* 상담 도구는 유료 칸이다 — 점검은 열람 권한이 있는 사람으로 본다 */
  await page.evaluate(() => { if (window.OS) OS.profile = Object.assign({}, OS.profile || {}, { role: 'owner' }); });
  await page.evaluate(() => go('home'));
  await page.waitForTimeout(500);
  await page.evaluate((t) => go(t), ta ? ta.real : 'cs_assist');
  await page.waitForTimeout(1200);
  const drawn = await page.evaluate(() => {
    const t = document.body.innerText;
    return { intro: t.indexOf('TA 인트로 멘트') >= 0, consult: t.indexOf('상담 스크립트') >= 0,
             objection: t.indexOf('반론 처리 화법') >= 0, blocked: t.indexOf('상위 플랜 기능') >= 0 };
  });
  is(!drawn.blocked, '등급 때문에 막히지 않았다');
  is(drawn.intro, '「TA 인트로 멘트」가 화면에 뜬다');
  is(drawn.consult && drawn.objection, '같이 옮겨 간 화법 도구도 뜬다');

  /* ═══ 4~6. CRM 통화 기록 창 ═══ */
  console.log('\n[4] DB 통합 CRM 통화 기록 창에서 바로 보이는가');
  const crmPage = await browser.newPage({ viewport: { width: 980, height: 950 } });
  crmPage.on('pageerror', e => errs.push('' + e));
  await crmPage.addInitScript(STUB);
  await crmPage.goto('http://127.0.0.1:' + PORT + '/db-crm.html', { waitUntil: 'load', timeout: 90000 });
  await crmPage.waitForTimeout(1600);
  is(await crmPage.evaluate(() => typeof taPaint === 'function'), '통화 기록 창이 화법을 그릴 줄 안다');
  is(/id="taScript"/.test(crm) && crm.indexOf('id="taScript"') < crm.indexOf('id="callResult"'),
    '화법 칸이 결과 입력칸보다 위에 있다 (걸기 전에 읽는다)');
  is(/function openCall\([^)]*\)\{[^}]*toggleAppointment\(\)/.test(crm.replace(/\s+/g, '')) ||
     /toggleAppointment\(\);renderHistory/.test(crm.replace(/\s+/g, '')),
    '창을 열 때 화법이 같이 그려진다');

  const panel = await crmPage.evaluate(() => {
    document.getElementById('callResult').value = '부재';
    taPaint();
    const b = document.getElementById('taScriptBody');
    return { openers: b.querySelectorAll('.ta-o').length,
             copy: b.querySelectorAll('.cp').length,
             link: /AI 상담 어시스턴트|AI 화법/.test(b.innerText), text: b.innerText };
  });
  is(panel.openers === 9, '여는 말 여섯 + 결과별 셋 = 아홉 줄이 나온다 — 지금 ' + panel.openers);
  is(panel.copy === 6, '여는 말마다 복사 단추가 있다 — 지금 ' + panel.copy);
  is(panel.link, '더 필요하면 앱의 어느 칸으로 가라고 적어 준다');

  console.log('\n[5] 결과를 고르면 그 결과의 다음 말이 켜지는가');
  for (const [r, want] of [['부재', '부재'], ['거절', '거절'], ['상담', '상담 약속']]) {
    const lit = await crmPage.evaluate((r) => {
      document.getElementById('callResult').value = r;
      toggleAppointment();
      return [...document.querySelectorAll('#taScriptBody .ta-o.on')].map(e => e.querySelector('.k').textContent);
    }, r);
    is(lit.length === 1 && lit[0].indexOf(want) === 0,
      '결과를 「' + r + '」로 두면 그 줄만 켜진다 — ' + (lit[0] || '없음'));
  }

  console.log('\n[6] 금소법에서 걸리는 말이 없는가');
  const hits = BANNED.filter(w => panel.text.indexOf(w) >= 0);
  is(hits.length === 0, '단정·과장하는 말이 없다' + (hits.length ? ' — ' + hits.join(' · ') : ''));
  is(/소속과 이름을/.test(panel.text), '소속과 이름을 먼저 밝히라고 적혀 있다');
  is(/다시 설득하지 않습니다/.test(panel.text), '거절하면 그 통화에서 다시 설득하지 말라고 적혀 있다');
  is(/없는 마감이나 없는 혜택/.test(panel.text), '없는 마감·혜택을 만들지 말라고 적혀 있다');

  const hard = errs.filter(m => !/ResizeObserver|Failed to fetch|NetworkError|supabase/i.test(m));
  is(hard.length === 0, '중간에 터진 곳이 없다' + (hard.length ? ' — ' + hard[0].slice(0, 130) : ''));

  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? 'TA 스크립트 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : 'TA 스크립트 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  await browser.close(); srv.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
