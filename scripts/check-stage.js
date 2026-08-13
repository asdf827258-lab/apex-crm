/* 계약까지, 그리고 그 다음까지 이어지는가.

   지금까지 이 앱은 「상담」에서 멈췄다. 계약을 해도 화면은 여전히
   상담이라고 했고, 증권을 보냈는지는 아무 데도 안 남았다. 약속은
   고객 365일로 넘기는 순간 사라졌다. 그리고 한 달이 끝나면 다음 달은
   다시 맨바닥에서 시작했다.

   여기서 확인한다.

     1. 단계 — 계약완료 · 증권전달 자리가 실제로 생겼는가
     2. 단계를 손으로 정한 적이 없으면 예전처럼 짐작하는가 (하위호환)
     3. 약속 — dbs.next_appt 를 먼저 보는가, 넘길 때 들고 가는가
     4. TFA 가 단계마다 <b>다른 말</b>을 하는가
     5. 아침에 오늘·내일 약속을 시각까지 알려 주는가
     6. 다음 달에 손댈 사람이 뽑히는가
     7. 밖으로 나가는 그림에 고객 실명이 안 들어가는가                */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8873;
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
   single:function(){one=true;return a},insert:function(){return a},update:function(){return a},
   upsert:function(){return a},
   then:function(res){return Promise.resolve({data:one?null:[],error:null}).then(res)}};
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
  const app = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const crm = fs.readFileSync(path.join(ROOT, 'db-crm.html'), 'utf8');

  /* ═══ 1. 담을 자리 ═══ */
  console.log('\n[1] 약속을 고객 365일까지 들고 갈 자리가 있는가');
  const s42 = path.join(ROOT, 'migration_42_appt.sql');
  is(fs.existsSync(s42), 'migration_42_appt.sql 이 있다');
  const sql = fs.existsSync(s42) ? fs.readFileSync(s42, 'utf8') : '';
  is(/alter table public\.clients add column if not exists next_appt/.test(sql),
    'clients 에도 약속 자리를 만든다');
  is(/update public\.clients c[\s\S]{0,400}from public\.dbs d/.test(sql),
    '이미 넘어간 사람 것도 한 번 채운다');
  is(/c\.advisor_id = d\.assigned_to/.test(sql),
    '연락처가 같아도 <b>담당자까지</b> 같아야 잇는다 — 남의 고객과 안 섞인다');
  is(/information_schema\.columns[\s\S]{0,200}'phone'/.test(sql),
    'phone 칸이 없는 서버에서도 안 죽는다');
  is(!/--/.test(sql), 'SQL 에 -- 주석을 안 쓴다 (붙여넣을 때 깨진다)');

  /* ═══ 2. CRM 단계 — 규칙을 떼어 내 직접 돌린다 ═══ */
  console.log('\n[2] 계약완료 · 증권전달 단계가 도는가');
  is(/const STAGES=\["미접촉","TA","AP","PC","CS","계약완료","증권전달"\]/.test(crm),
    '단계 일곱 개가 정해져 있다');
  const stageSrc = crm.slice(crm.indexOf('const STAGES='), crm.indexOf('function nextAppt('));
  /* 마지막 통화 결과는 밖에서 넣어 준다 — 그래야 짐작 규칙을 그대로 돌려 볼 수 있다 */
  const mkS = res => {
    try {
      return new Function('__res',
        'function result(){return __res}\n' + stageSrc +
        '\nreturn {stageOf:stageOf,stageAuto:stageAuto,isWon:isWon,needPolicy:needPolicy,stageSet:stageSet};')(res);
    } catch (e) { return null; }
  };
  const S = mkS('미진행');
  is(!!S, '단계 규칙을 떼어 낼 수 있다');
  if (S) {
    is(S.stageOf({ id: 'x', stage: '계약완료' }) === '계약완료', '손으로 정한 단계를 그대로 쓴다');
    is(S.stageOf({ id: 'x', stage: '증권전달' }) === '증권전달', '증권전달도 그대로 쓴다');
    is(S.stageOf({ id: 'x', stage: '없는단계' }) === '미접촉', '모르는 값이 들어오면 짐작으로 돌아간다');
    is(S.stageOf({ id: 'x' }) === '미접촉', '단계를 안 정했으면 통화 결과에서 짐작한다');
    is(mkS('상담').stageOf({ id: 'x' }) === 'AP', '상담까지 갔으면 AP 로 짐작한다 (하위호환)');
    is(mkS('부재').stageOf({ id: 'x' }) === 'TA', '부재면 TA 로 짐작한다');
    is(mkS('상담').stageOf({ id: 'x', stage: 'CS' }) === 'CS', '손으로 정한 값이 짐작을 이긴다');
    is(S.isWon({ id: 'x', stage: '계약완료' }) && S.isWon({ id: 'x', stage: '증권전달' }),
      '계약완료 · 증권전달 둘 다 계약으로 센다');
    is(!S.isWon({ id: 'x', stage: 'CS' }), 'CS 는 아직 계약이 아니다');
    is(S.needPolicy({ id: 'x', stage: '계약완료' }) && !S.needPolicy({ id: 'x', stage: '증권전달' }),
      '증권을 아직 안 보낸 사람만 골라낸다');
    is(!S.stageSet({ id: 'x' }) && S.stageSet({ id: 'x', stage: 'PC' }),
      '짐작한 값과 손으로 정한 값을 구분한다');
  }
  is(/id="dbStage"/.test(crm) && /function stagePick\(/.test(crm), '수정 창에서 단계를 고를 수 있다');
  is(/id="contractedAt"/.test(crm) && /id="policySentAt"/.test(crm) && /id="policyNo"/.test(crm),
    '계약일 · 증권 전달일 · 증권번호를 적을 수 있다');
  is(/증권전달이면 계약일도 적어 주세요/.test(crm), '증권만 있고 계약일이 없는 일을 막는다');
  is(/id="stageFilter"/.test(crm) && /__nopol__/.test(crm), '증권 미전달만 따로 뽑아 볼 수 있다');
  is(/migration_41_calls\.sql 을 한 번 실행하세요/.test(crm),
    'SQL 을 안 돌린 서버에서도 저장이 막히지 않는다 — 무엇을 해야 하는지 말한다');
  is(/delete p3\.stage/.test(crm), '단계 칸이 없으면 단계만 빼고 저장한다');

  /* ═══ 3. 약속 ═══ */
  console.log('\n[3] 약속 시각을 잃지 않는가');
  is(/function nextAppt\(/.test(crm), '약속을 한 곳에서 정한다');
  const naSrc = crm.slice(crm.indexOf('function nextAppt('), crm.indexOf('function nextAppt(') + 420);
  is(/d\.next_appt/.test(naSrc), 'dbs.next_appt 를 본다 — 마지막 통화에만 안 기댄다');
  is(/a>b\?a:b/.test(naSrc), '둘 중 <b>더 늦은</b> 약속을 쓴다');
  let NA = null;
  try {
    NA = new Function('CALLS', 'function getCalls(id){return CALLS}\n' +
      crm.slice(crm.indexOf('function nextAppt('), crm.indexOf('function nextAppt(') + 420)
        .replace(/\n\/\*[^]*$/, '') + '\nreturn nextAppt;');
  } catch (e) { NA = null; }
  if (NA) {
    /* 약속을 잡은 뒤 부재 통화가 한 번 더 들어간 상황 — 예전엔 여기서 약속이 사라졌다 */
    const f = NA([{ result: '부재', appointment_at: null }, { result: '상담', appointment_at: '2026-09-01T14:00:00Z' }]);
    is(f({ id: 'x', next_appt: '2026-09-01T14:00:00Z' }) === '2026-09-01T14:00:00Z',
      '약속 뒤에 부재가 한 번 더 들어와도 약속이 안 사라진다');
    const g = NA([]);
    is(g({ id: 'x', next_appt: '2026-09-01T14:00:00Z' }) === '2026-09-01T14:00:00Z',
      '통화 기록이 없어도 DB 에 적힌 약속은 보인다');
    is(g({ id: 'x' }) === '', '약속이 없으면 빈 값이다');
  }
  is(/if\(ap\)payload\.next_appt=ap;/.test(crm), '고객 365일로 넘길 때 약속을 실어 보낸다');
  is(/함께 넘어갑니다/.test(crm), '넘기기 전에 약속이 따라간다고 알려 준다');
  is(/migration_42_appt\.sql 을 한 번 실행하세요/.test(crm),
    '약속 칸이 없는 서버에서도 넘기기 자체는 된다');

  /* ═══ 4~7. 앱 ═══ */
  console.log('\n[4] 앱이 CRM 과 같은 규칙으로 단계를 읽는가');
  is(/var AR_STAGES=\['미접촉','TA','AP','PC','CS','계약완료','증권전달'\]/.test(app),
    '앱도 같은 일곱 단계를 안다');
  is(/function arStageOf\(/.test(app) && /function arWon\(/.test(app), '단계를 읽는 길이 있다');
  is(/stage,next_appt,contracted_at,policy_sent_at/.test(app), '서버에서 단계와 약속을 받아 온다');
  is(/AR\.noStage=true/.test(app) && /return q\(sb\.from\('dbs'\)\.select\(cols\+',source'\)\)/.test(app),
    '단계 칸이 없는 서버면 한 칸 내려가 다시 부른다 — 화면 전체가 안 죽는다');
  is(/\['pol','📜','증권 미전달'\]/.test(app) && /\['won','🏆','계약 직후'\]/.test(app),
    '오늘 터치할 사람에 계약 뒤 칸이 생겼다');

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1200 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  const R = await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    window.__toasts = []; window.toast = m => window.__toasts.push(m);
    if (!window.OS.profile) window.OS.profile = { id: 'u1', name: '윤시현', role: 'admin', plan: 'pro' };
    if (typeof GB !== 'undefined') {
      GB.loaded = true; GB.team = 't1'; GB.teamOf = { u1: 't1', u2: 't1' };
      const mkRow = (id, name) => ({
        id: id, name: name, role: 'member', team: 't1',
        raw: { att: 20, run: 12, call: 40, cli: 8, rep: 3, stu: 2 },
        sc: { att: 80, run: 70, call: 75, cli: 60, rep: 50, stu: 40 },
        total: 62, last: '', lastAtt: '', days: 20, any: true
      });
      GB.rows = [mkRow('u1', '윤시현'), mkRow('u2', '홍보험')];
      GB.teams = [{ id: 't1', name: '온탑2지점' }];
    }

    /* ── 손으로 만든 DB 판 ──
       실제 고객 이름은 쓰지 않는다. 견본은 견본 이름으로. */
    const T = arToday();
    const add = (d) => { const p = T.split('-'); const x = new Date(+p[0], +p[1] - 1, +p[2] + d);
      const q = n => (n < 10 ? '0' : '') + n;
      return x.getFullYear() + '-' + q(x.getMonth() + 1) + '-' + q(x.getDate()); };

    AR.loaded = true;
    AR.db = [
      /* 계약은 했는데 증권을 20일째 못 보냄 — 가장 급한 사람 */
      { id: 'd1', who: 'u1', name: '홍길동', region: '순천', src: '일반', stage: '계약완료',
        cAt: add(-20), pAt: '', got: T.slice(0, 7) + '-01', n: 4, last: add(-20), res: '상담',
        appt: '', memo: '', days: 20 },
      /* 증권을 이틀 전에 전달 — 소개받을 때 */
      { id: 'd2', who: 'u1', name: '임꺽정', region: '순천', src: '일반', stage: '증권전달',
        cAt: add(-30), pAt: add(-2), got: T.slice(0, 7) + '-01', n: 6, last: add(-2), res: '상담',
        appt: '', memo: '', days: 2 },
      /* 내일 약속이 잡힌 사람 */
      { id: 'd3', who: 'u1', name: '성춘향', region: '순천', src: '일반', stage: 'AP',
        cAt: '', pAt: '', got: T.slice(0, 7) + '-02', n: 2, last: add(-1), res: '상담',
        appt: add(1) + 'T14:00:00Z', memo: '', days: 1 },
      /* 상담해 놓고 결론이 안 난 사람 */
      { id: 'd4', who: 'u1', name: '이몽룡', region: '순천', src: '일반', stage: 'PC',
        cAt: '', pAt: '', got: T.slice(0, 7) + '-03', n: 3, last: add(-9), res: '상담',
        appt: '', memo: '', days: 9 },
      /* 부재가 오래된 사람 */
      { id: 'd5', who: 'u1', name: '변학도', region: '순천', src: '일반', stage: 'TA',
        cAt: '', pAt: '', got: T.slice(0, 7) + '-04', n: 5, last: add(-21), res: '부재',
        appt: '', memo: '', days: 21 },
      /* 남의 팀원 것 — 내 화면에 섞이면 안 된다 */
      { id: 'd6', who: 'u2', name: '남의고객', region: '여수', src: '일반', stage: '계약완료',
        cAt: add(-3), pAt: '', got: T.slice(0, 7) + '-05', n: 2, last: add(-3), res: '상담',
        appt: '', memo: '', days: 3 }
    ];
    AR.cliRows = [];

    const touch = arTouch('u1');
    const byK = k => touch.filter(x => x.k === k);
    const cnt = arTkCount('u1');

    /* 단계마다 다른 말을 하는가 */
    const todo = {};
    touch.forEach(x => { todo[x.id] = arTodoOf(x); });

    /* 아침 약속 */
    const appts = arAppts('u1', 1);

    /* 다음 달 */
    const nxt = pfNextList('u1');
    const nc = pfNextCount('u1');
    const nHtml = pfNextHtml();
    const cardNext = pfCardNextHtml('u1');

    return {
      polN: byK('pol').length, wonN: byK('won').length, runN: byK('run').length,
      polId: (byK('pol')[0] || {}).id, wonId: (byK('won')[0] || {}).id,
      cntPol: cnt.pol, cntWon: cnt.won,
      todo: todo,
      apptN: appts.length, apptHm: (appts[0] || {}).hm, apptNm: (appts[0] || {}).nm,
      nxtKinds: nxt.map(x => x.k), nxtNames: nxt.map(x => x.nm), nc: nc,
      nHtml: nHtml, cardNext: cardNext,
      ymNow: pfYm(), ymAdd: pfYmAdd(pfYm(), 1), ymAdd12: pfYmAdd('2026-12', 1)
    };
  });

  is(R.polN === 1 && R.polId === 'd1', '계약했는데 증권 못 보낸 사람이 따로 선다');
  is(R.wonN === 1 && R.wonId === 'd2', '증권을 막 전달한 사람이 따로 선다');
  is(R.runN === 2, '계약된 사람은 「진행중」에 안 섞인다 (진행중 ' + R.runN + '명)');
  is(R.cntPol === 1 && R.cntWon === 1, '칸마다 숫자가 맞는다');
  is(!R.nxtNames.includes('남의고객'), '남의 담당 고객은 내 화면에 안 나온다');

  console.log('\n[5] 단계마다 다른 말을 하는가');
  is(/증권을 못 보냈습니다/.test(R.todo.d1 || ''), '증권 미전달 — 며칠째인지 짚어 준다 (' + (R.todo.d1 || '').slice(0, 40) + ')');
  is(/소개/.test(R.todo.d2 || ''), '증권 전달 직후 — 소개를 여쭙게 한다');
  is(/약속 전날/.test(R.todo.d3 || ''), '약속이 잡혀 있으면 준비하라고 한다');
  is(/제안서/.test(R.todo.d4 || ''), 'PC 단계는 제안서 결론을 물으라고 한다');
  is(R.todo.d1 !== R.todo.d2 && R.todo.d2 !== R.todo.d4, '단계가 다르면 말도 다르다');

  console.log('\n[6] 아침에 약속을 시각까지 알려 주는가');
  is(R.apptN === 1, '오늘·내일 약속만 골라낸다 (' + R.apptN + '건)');
  is(R.apptHm === '14:00', '시각을 그대로 알려 준다 (' + R.apptHm + ')');
  is(R.apptNm === '성춘향', '누구와의 약속인지 말한다');
  is(/function arAppts\(/.test(app) && /k:'appt'/.test(app), '아침 보고 맨 위에 약속이 선다');
  is(/아침 보고는 내 약속만 세운다/.test(app), '리더라도 남의 약속까지 오지 않는다');

  console.log('\n[7] 다음 달에 손댈 사람이 뽑히는가');
  is(R.nxtKinds.length === 5, '이달 기록에서 다섯 명을 뽑았다 (' + R.nxtKinds.length + '명)');
  is(R.nxtKinds[0] === 'appt', '약속 잡힌 사람이 맨 위다');
  is(R.nxtKinds[1] === 'pol', '그다음이 증권 미전달이다');
  is(R.nxtKinds.indexOf('intro') > R.nxtKinds.indexOf('pol'), '소개는 증권보다 뒤다');
  is(R.nxtKinds.indexOf('cold') === -1 || R.nxtKinds.indexOf('cold') === R.nxtKinds.length - 1,
    '식은 고객은 맨 뒤다');
  is(R.nc.appt === 1 && R.nc.pol === 1 && R.nc.intro === 1 && R.nc.warm === 1 && R.nc.no === 1,
    '칸마다 숫자가 맞는다');
  is(/에 손댈 사람/.test(R.nHtml), '다음 달 이름표가 붙는다');
  is(/pfNextCopy\(\)/.test(R.nHtml), '글로 복사해 갈 수 있다');
  is(R.ymAdd12 === '2027-01', '12월 다음은 이듬해 1월이다 (' + R.ymAdd12 + ')');
  is(R.ymNow === (await page.evaluate(() => pfYm())),
    '이름표를 만든다고 보고 있는 달이 바뀌지 않는다');

  console.log('\n[8] 밖으로 나가는 그림에 실명이 안 들어가는가');
  is(R.cardNext.length > 0, '영업보고서에 다음 달 칸이 붙는다');
  is(!/홍길동|임꺽정|성춘향|이몽룡|변학도/.test(R.cardNext),
    '그림에 고객 실명이 <b>하나도</b> 없다');
  is(/성\*향|홍\*동/.test(R.cardNext), '이름은 가려서 넣는다');
  is(/영업보고서 이미지에는 <b>김○○<\/b> 로만 들어갑니다/.test(R.nHtml),
    '화면에서도 그 사실을 밝힌다 — 실명이 어디까지 나가는지 쓰는 사람이 안다');
  is(!/만원|원<|연락처/.test(R.cardNext), '금액과 연락처는 아예 안 넣는다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? '단계 · 약속 · 다음 달 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : '단계 · 약속 · 다음 달 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
