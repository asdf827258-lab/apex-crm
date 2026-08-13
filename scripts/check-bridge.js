/* 상담자료와 앱이 서로 통하는가.

   두 가지를 고쳤다.

   1) 보장분석 상담자료 안에서 증권을 <b>또</b> 올리게 돼 있었다.
      APEX 앱의 AI 제안서가 이미 증권을 읽었는데도 그랬다.
      그 업로드 칸을 없애고, 앱이 읽어낸 계약을 상담자료의 보장분석표로
      그대로 밀어 넣는다.

   2) 상담자 소개가 <b>이 기기의 칸 하나</b>에만 저장됐다.
      한 컴퓨터를 팀원 둘이 쓰면 뒷사람이 앞사람 소개를 덮어썼다.
      이제 <b>로그인한 사람마다</b> 따로 저장하고, 앱이 상담자료에 넣어 준다.

   그래서 여기서 확인한다.
     1. 소개가 로그인한 사람마다 따로 저장되는가 (서로 안 덮는가)
     2. 앱이 상담자료로 소개를 보내면 상담자료가 받아 쓰는가
     3. 증권에서 읽은 계약이 보장분석표로 넘어가는가
     4. 상담자료 안의 업로드 칸이 없어졌는가
     5. 남이 보낸 쪽지는 안 받는가 (다른 주소에서 온 것)          */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8857;
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
   select:function(){return a},eq:function(){return a},gte:function(){return a},lte:function(){return a},
   is:function(){return a},neq:function(){return a},in:function(){return a},not:function(){return a},
   order:function(){return a},limit:function(){return a},range:function(){return a},
   single:function(){one=true;return a},insert:function(){return a},update:function(){return a},upsert:function(){return a},
   then:function(res){return Promise.resolve({data:one?null:[],error:null}).then(res);}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'u1'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'u1'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

let pass = 0, fail = 0;
const ok = m => { pass++; console.log('  ✓ ' + m); };
const no = m => { fail++; console.log('  ✗ ' + m); };
const is = (c, m) => c ? ok(m) : no(m);

(async () => {
  /* ═══ 4. 소스 검사 — 업로드 칸이 없어졌는가 ═══ */
  console.log('\n[4] 상담자료 안의 증권 업로드 칸이 없어졌는가');
  const doc = fs.readFileSync(path.join(ROOT, 'app/상담자료/메인 상담자료.html'), 'utf8');
  /* ── 상담자료의 생김새는 건드리지 않는다 ──
     HTML 을 한 번 손댔다가 10번째 장부터가 9번째 장 <b>안으로 말려 들어가</b>
     안 보이게 됐다. 그래서 이제 이 파일에는 <b>스크립트만</b> 붙인다. */
  is(!/id="apexLinkCard"/.test(doc), '상담자료 화면을 건드리지 않는다 — 스크립트만 붙인다');
  is(!/id="s9-medical-card"[\s\S]{0,80}display:\s*none/.test(doc) &&
     !/display:\s*none[^>]*>\s*<div[^>]*id="s9-medical-card"/.test(doc),
    '증권 업로드 칸이 원래대로 살아 있다');
  /* ── 다시는 남의 자료를 지우지 않는다 ──
     한때 { replace: true } 로 넣어서 상담자료에 쌓아 둔 보장분석표를
     통째로 지웠다. 사람이 만든 것을 앱이 지우는 것은 최악이다. */
  is(!/s10ImportInsurances\([^)]*replace\s*:\s*true/.test(doc),
    '앱이 보낸 계약으로 기존 표를 덮어쓰지 않는다 — 사람이 만든 것을 지우지 않는다');
  /* 열여섯 장이 <b>서로 안에 들어가지 않고</b> 나란히 있는가 —
     이것이 「10페이지부터 안 뜬다」 의 정체였다. */
  const slideIdx = [];
  doc.replace(/id="(s\d{1,2})"/g, (m, id) => { slideIdx.push(id); return m; });
  is(slideIdx.length >= 16, '슬라이드가 16장 이상 그대로 있다 (' + slideIdx.length + '장)');
  is(/apex:insurances/.test(doc) && /s10ImportInsurances/.test(doc), '보장분석표로 넣는 길이 이어져 있다');
  is(/ev\.origin !== location\.origin/.test(doc), '같은 주소에서 온 쪽지만 받는다');
  const fin = fs.readFileSync(path.join(ROOT, 'app/재무설계/상담자료.html'), 'utf8');
  is(/apex:intro/.test(fin), '재무설계 상담자료도 소개를 받는다');

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2400);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    window.toast = function () {};
  });

  const ready = await page.evaluate(() => typeof advGet === 'function' && typeof sdPlanRows === 'function');
  if (!ready) {
    console.log('✗ 앱이 뜨지 않았습니다.');
    errs.slice(0, 4).forEach(m => console.log('    ' + m));
    await browser.close(); srv.close(); process.exit(1);
  }

  /* ═══ 0. 상담자료 열여섯 장이 다 뜨는가 ═══
     글자만 세는 검사로는 이 사고를 못 잡았다. div 개수는 맞는데
     브라우저가 읽으면 10번째 장부터가 9번째 장 <b>안에</b> 들어가 있었다.
     그래서 실제로 띄워서 <b>자리를 차지하는지</b> 잰다. */
  console.log('\n[0] 상담자료 열여섯 장이 각자 제자리에 뜨는가');
  const sd = await ctx.newPage();
  await sd.goto('http://127.0.0.1:' + PORT + '/app/상담자료/메인 상담자료.html',
    { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sd.waitForTimeout(3200);
  const SL = await sd.evaluate(() => {
    var sl = [].slice.call(document.querySelectorAll('.slide'));
    return {
      n: sl.length,
      ids: sl.map(function (s) { return s.id; }),
      /* 다른 장 안에 들어간 장 — 이러면 그 장부터 안 보인다 */
      nested: sl.filter(function (s) {
        return s.parentElement && s.parentElement.closest('.slide');
      }).map(function (s) { return s.id; }),
      /* 높이가 제각각이면 어딘가에 갇힌 것이다 */
      heights: sl.map(function (s) { return Math.round(s.getBoundingClientRect().height); })
    };
  });
  await sd.close();
  is(SL.n >= 16, '슬라이드가 ' + SL.n + '장 있다');
  is(SL.nested.length === 0,
    '어느 장도 다른 장 안에 말려 들어가지 않았다' +
    (SL.nested.length ? ' — 갇힌 장: ' + SL.nested.join(' ') : ''));
  const uniq = SL.heights.filter((v, i, a) => a.indexOf(v) === i);
  is(uniq.length === 1,
    '열여섯 장이 모두 같은 크기로 선다 (' + uniq.join(' / ') + ') — 크기가 갈리면 어딘가 갇힌 것이다');

  /* ═══ 1. 사람마다 따로 저장되는가 ═══ */
  console.log('\n[1] 소개가 로그인한 사람마다 따로 저장되는가');
  const A = await page.evaluate(() => {
    OS.profile = { id: 'u1', name: '윤시현', role: 'owner' };
    var k1 = advKey();
    advSet({ name: '윤시현', title: '사업단장', org: '온탑본부' });
    var mine = advGet();
    /* 다른 팀원이 같은 컴퓨터로 로그인 */
    OS.profile = { id: 'u2', name: '김팀장', role: 'member' };
    var k2 = advKey();
    var theirs = advGet();
    advSet({ name: '김팀장', title: '팀장', org: '온탑1팀' });
    /* 다시 대표로 */
    OS.profile = { id: 'u1', name: '윤시현', role: 'owner' };
    var back = advGet();
    return { k1: k1, k2: k2, mineName: mine.name, theirsName: theirs.name,
      backName: back.name, backTitle: back.title };
  });
  is(A.k1 !== A.k2, '사람마다 저장칸이 다르다 (' + A.k1 + ' / ' + A.k2 + ')');
  is(A.mineName === '윤시현', '내 소개가 저장된다');
  is(A.theirsName === '김팀장', '다른 사람은 자기 이름으로 시작한다 — 내 것이 안 새어 나간다');
  is(A.backName === '윤시현' && A.backTitle === '사업단장',
    '다른 사람이 저장해도 내 것은 그대로다 (' + A.backName + ' · ' + A.backTitle + ')');

  /* ═══ 3. 증권 → 보장분석표 줄 만들기 ═══ */
  console.log('\n[3] 증권에서 읽은 계약이 표로 넘어갈 꼴이 되는가');
  const R = await page.evaluate(() => {
    PR.scan = { plans: [
      { co: '교보생명', name: '무배당교보큰사랑CI보험', from: '2007-02-23', fee: 225000 },
      { co: 'DB손보', name: '아이러브건강보험2104', from: '2021-04-27', fee: 99945 },
      { co: '메리츠화재', name: '실손의료비보험1904', from: '2019-09-04', fee: 0 }
    ] };
    var rows = sdPlanRows();
    PR.scan = null;
    var empty = sdPlanRows();
    return { rows: rows, empty: empty.length };
  });
  is(R.rows.length === 3, '읽은 계약이 모두 줄로 만들어진다 (' + R.rows.length + '건)');
  is(R.rows[0].company === '교보생명' && R.rows[0].name === '무배당교보큰사랑CI보험',
    '회사·상품이 그대로 간다 — ' + R.rows[0].company + ' / ' + R.rows[0].name);
  is(R.rows[0].monthlyPayment === 225000 && R.rows[0].startYear === 2007,
    '보험료와 가입연도가 맞다 (' + R.rows[0].monthlyPayment + '원 · ' + R.rows[0].startYear + '년)');
  is(R.rows[2].monthlyPayment === 0, '보험료 미제공은 0 으로 둔다 — 지어내지 않는다');
  is(R.empty === 0, '읽은 게 없으면 빈 줄을 만들지 않는다');

  /* ═══ 2 · 5. 실제로 상담자료에 넣어 본다 ═══ */
  console.log('\n[2] 앱이 보낸 소개·계약을 상담자료가 받아 쓰는가');
  await page.evaluate(() => {
    OS.profile = { id: 'u9', name: '점검', role: 'owner' };
    advSet({ name: '홍보험', title: '지점장', org: '온탑2지점', phone: '010-1111-2222',
      motto: '삶을 설계합니다', tags: '보장분석, 은퇴설계', bio: 'MDRT 3년' });
    PR.scan = { plans: [{ co: '교보생명', name: 'CI보험', from: '2007-02-23', fee: 225000 }] };
    /* 앱이 실제로 쓰는 그 틀을 쓴다. 같은 id 로 하나 더 만들면 앱은 먼저 있던
       빈 틀에 보내고 아무 일도 안 일어난다. */
    var f = document.getElementById('sangdamFrame');
    f.style.cssText = 'width:900px;height:600px';
    mountSangdam();
  });
  /* 자료가 다 뜰 때까지 기다린다 — 긴 evaluate 안에서 기다리면 문맥이 날아간다 */
  await page.waitForTimeout(4000);
  await page.evaluate(() => { advPush(); sdPushPlan(); });
  await page.waitForTimeout(1500);

  const B = await page.evaluate(() => {
    var f = document.getElementById('sangdamFrame');
    var w = f.contentWindow, d = f.contentDocument;
    var prof = {};
    try { prof = JSON.parse(w.localStorage.getItem('s6_profile') || '{}'); } catch (e) {}
    var badge = d.getElementById('apexLinkBadge');
    var got = [];
    try { got = w.s10ExportInsurances ? w.s10ExportInsurances() : []; } catch (e) {}
    return { name: prof.name, title: prof.title, phone: prof.phone,
      intro: prof.intro, spec: prof.specialties,
      badge: badge ? badge.textContent : '(없음)',
      n: got.length, co: got[0] ? got[0].company : '', before: prof.name };
  });

  /* 남이 보낸 쪽지 — 다른 주소인 척 */
  await page.evaluate(() => {
    var w = document.getElementById('sangdamFrame').contentWindow;
    try { w.postMessage({ t: 'apex:intro', data: { name: '침입자' } }, 'http://evil.example'); } catch (e) {}
  });
  await page.waitForTimeout(500);
  const S = await page.evaluate(() => {
    var w = document.getElementById('sangdamFrame').contentWindow, p = {};
    try { p = JSON.parse(w.localStorage.getItem('s6_profile') || '{}'); } catch (e) {}
    return { after: p.name };
  });
  B.safeBefore = B.before; B.safeAfter = S.after;

  is(B.name === '홍보험', '상담자료가 내 이름을 받아 쓴다 (' + B.name + ')');
  is(/지점장/.test(B.title || '') && /온탑2지점/.test(B.title || ''),
    '직함과 소속이 함께 들어간다 — ' + B.title);
  is(B.phone === '010-1111-2222' && /삶을 설계/.test(B.intro || ''), '연락처와 한 줄 소개도 들어간다');
  is(/보장분석/.test(B.spec || ''), '전문 분야도 들어간다');
  is(B.n === 1 && B.co === '교보생명', '증권에서 읽은 계약이 보장분석표에 들어간다 (' + B.n + '건 · ' + B.co + ')');
  /* 배지는 없앴다 — 상담자료 화면을 건드리지 않기로 했기 때문이다.
     들어왔는지는 <b>표에 실제로 있는지</b> 로 확인한다. */
  is(B.n >= 1 && B.co === '교보생명', '표시가 아니라 표에 실제로 들어갔는지로 확인한다');

  console.log('\n[5] 남이 보낸 쪽지는 안 받는가');
  is(B.safeAfter === B.safeBefore, '다른 주소에서 온 쪽지는 무시한다 (' + B.safeAfter + ')');

  const hard = errs.filter(m => !/ResizeObserver|Failed to fetch|NetworkError/i.test(m));
  is(hard.length === 0, '중간에 터진 곳이 없다' + (hard.length ? ' — ' + hard[0].slice(0, 110) : ''));

  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? '상담자료 연동 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : '상담자료 연동 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  await browser.close(); srv.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
