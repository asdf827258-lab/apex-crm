/* AI 제안서 — 「서버가 몰려 있습니다」 가 다시 나오지 않는가.

   무슨 일이 있었나.
     앱은 제안서 한 장을 통째로, 한 번에 13000자까지 써 달라고 시켰다.
     그런데 회사 공용 서버(netlify/functions/generate.js)는 한 번에
     8000자까지만 내주고 <b>말없이 깎았다.</b> 게다가 잘렸다는 표시
     (stop_reason)조차 앱에 안 돌려줘서, 앱은 토막난 JSON 을 완성된
     것으로 알고 읽다가 실패했다. → 「제대로 인식을 못 한다」

     또 제한시간을 <b>보낸 자료 크기</b>로만 정했다. 글만 보내면 무조건
     2분이었다. 8000자를 쓰는 데는 3분이 걸린다. 끝날 수가 없었다.
     끊긴 것을 앱은 '혼잡' 으로 읽었다. → 「AI 서버가 몰려 있습니다」

   혼잡한 게 아니라 처음부터 시간 안에 끝날 수 없는 주문이었다.

   그래서 여기서 확인한다.
     1. 제한시간이 '보낸 양' 이 아니라 'AI 가 쓸 양' 을 따르는가
     2. 한 조각이 회사 서버가 내주는 양 안에 들어오는가
     3. 토막나거나 붙어 온 JSON 도 살려 내는가
     4. 네 조각 중 하나가 죽어도 문서가 나오는가
     5. 넷 다 죽어도 앱이 읽은 내용으로 문서를 세우는가
     6. 앱이 채운 부분을 숨기지 않고 밝히는가
     7. 프록시가 stop_reason 을 돌려주는가                            */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8851;
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
  auth:{getSession:function(){return Promise.resolve({data:{session:null}})},
   getUser:function(){return Promise.resolve({data:{user:null}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

const FOOT = ' 어느지사 | 어느지점/설계사(000000)/000-0000-0000 ';
const DOC = [
  '홍길동 님의 건강을 위한 보장분석 2026-07-27',
  '홍길동 (36세 ,남자) 님의 전체 계약리스트 6 0 1 5 0 472,797 2026-07-27 13:15:55',
  '※ 기준담보/권장금액 : 기본형(37개)/표준형',
  '1 메리츠화 재 (무) 메리츠 실손의료비보험1904 2019-09-04 0년 44세 보험료미제공',
  '2 롯데손보 무배당 롯데 더알찬 건강보험(1708) 2017-08-10 월납 20년 90세 73,096 원',
  '3 흥국화재 무배당 프리미엄 행복보험(1204) 2012-07-19 월납 20년 100세 21,726 원',
  '4 DB손보 아이(I)러브(LOVE)건강보험2104 2021-04-27 월납 20년 100세 99,945 원',
  '5 DB손보 참좋은운전자상해보험2501 2025-02-27 월납 10년 44세 53,030 원',
  '6 교보생명 무배당교보큰사랑CI보험 2007-02-23 월납 20년 종신 225,000 원',
  FOOT + '5/28',
  '홍길동 (36세 ,남자) 님의 상품별 가입담보상세 2026-07-27 13:15:55 ※ 기준담보/권장금액 : 기본형(37개)/표준형',
  'DB손보 | 가입일자 : 2021-04-27 | 아이(I)러브(LOVE)건강보험2104 홍길동/홍길동 월납/20년/100세만기 2021-04-27~ 2091-04-27 99,945 원',
  '1 정액 일반암진단비 암진단 8,000만 2 정액 암주요치료비(급여) 암주요치료비 1,000만',
  '3 정액 하이클래스(비급여)암주요치료비 비급여암주요치료비 2,000만',
  '4 정액 순환계치료비 순환계질환치료 500만 5 정액 뇌혈관질환진단비 뇌혈관질환진단 1,600만',
  '6 정액 표적항암약물허가치료비 표적항암 2,000만 7 실손 질병입원의료비 질병입원의료비 5,000만',
  FOOT + '11/28',
  '홍길동 (36세 ,남자) 님의 실효/해지계약현황 7 0 2 3 2 ※ 기준담보/권장금액 : 기본형(37개)/표준형 2026-07-27 13:15:55 821,142',
  '1 해지* KB손보 (무)KB운전자보험과안전하게사는이야 기(21.01) 2종 2021-01-15 월납 20년 100세 49,000 원',
  '2 해지* 흥국생명 (무)흥국생명라이프업UL종신보험V3(2 종,100세3%체증형,가산형) 2017-07-25 월납 15년 종신 602,845 원',
  FOOT + '16/28',
  '홍길동 (36세 ,남자) 님의 담보별 진단현황 2026-07-27 13:15:55 ※ 기준담보/권장금액 : 기본형(37개)/표준형',
  '사망/장해 질병80%미만후유장해 권장 1억 가입 6,000만 부족 -4,000만',
  '치매/간병 장기요양간병비 권장 3,000만 가입 0 미가입 -3,000만',
  '암 진단 일반암 권장 5,000만 가입 1억 6,000만 충분 +1억 1,000만',
  '암 진단 유사암 권장 2,000만 가입 600만 부족 -1,400만',
  '뇌/심장 진단 뇌혈관질환 권장 3,000만 가입 1,600만 부족 -1,400만',
  '실손의료비 질병입원의료비 권장 5,000만 가입 5,000만 충분 -',
  '수술/입원 암수술비 권장 300만 가입 200만 부족 -100만',
  FOOT + '28/28'
].join(' ');

let pass = 0, fail = 0;
const ok = m => { pass++; console.log('  ✓ ' + m); };
const no = m => { fail++; console.log('  ✗ ' + m); };
const is = (c, m) => c ? ok(m) : no(m);

(async () => {
  /* ═══ 7. 프록시가 잘렸다는 사실을 돌려주는가 (브라우저 없이) ═══ */
  console.log('\n[7] 회사 공용 서버가 「잘렸다」 를 알려 주는가');
  const src = fs.readFileSync(path.join(ROOT, 'netlify/functions/generate.js'), 'utf8');
  is(/stop_reason:\s*data\.stop_reason/.test(src), 'stop_reason 을 앱에 돌려준다 — 이어쓰기가 살아난다');
  is(!/Math\.min\(body\.max_tokens \|\| 2000, 8000\)/.test(src), '말없이 8000 으로 깎던 자리가 없어졌다');
  is(/clamped/.test(src), '깎았으면 깎았다고 말해 준다');

  const handler = require(path.join(ROOT, 'netlify/functions/generate.js')).handler;
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
  delete process.env.SHARED_TOKEN;
  const seen = {};
  global.fetch = async (url, opt) => {
    seen.body = JSON.parse(opt.body);
    return { ok: true, status: 200,
      text: async () => JSON.stringify({ content: [{ type: 'text', text: '{"a":1' }], stop_reason: 'max_tokens', model: 'm' }) };
  };
  const r = await handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ max_tokens: 4200, messages: [] }) });
  const rb = JSON.parse(r.body);
  is(rb.stop_reason === 'max_tokens', '잘렸을 때 stop_reason=max_tokens 가 넘어온다');
  is(seen.body.max_tokens === 4200, '앱이 부탁한 4200 을 그대로 보낸다 (' + seen.body.max_tokens + ')');
  const r2 = await handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ max_tokens: 99999, messages: [] }) });
  is(JSON.parse(r2.body).clamped === true, '한도를 넘겨 부탁하면 깎았다고 표시한다');

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  await ctx.route('**://**', rq => rq.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? rq.continue() : rq.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);

  const ready = await page.evaluate(() => typeof prAskAll === 'function' && typeof prJson === 'function'
    && typeof prLocalFill === 'function' && typeof aiTimeoutFor === 'function');
  if (!ready) {
    console.log('✗ 앱이 뜨지 않았습니다.');
    errs.slice(0, 4).forEach(m => console.log('    ' + m));
    await browser.close(); srv.close(); process.exit(1);
  }

  /* ═══ 1 ═══ */
  console.log('\n[1] 제한시간이 「AI 가 쓸 양」 을 따르는가');
  const T = await page.evaluate(() => ({
    small: aiTimeoutFor('{"max_tokens":2000}'),
    part: aiTimeoutFor('{"max_tokens":4200}'),
    big: aiTimeoutFor('{"max_tokens":8000}'),
    gem: aiTimeoutFor('{"maxOutputTokens":8000}'),
    huge: aiTimeoutFor('{"max_tokens":40000}'),
    tps: AI_WRITE_TPS, cap: AI_TIMEOUT_MAX
  }));
  is(T.big > 120000, '8000자를 부탁하면 2분보다 길게 준다 (' + Math.round(T.big / 1000) + '초) — 예전엔 120초라 100% 끊겼다');
  is(T.big > T.part && T.part > T.small, '부탁한 양이 많을수록 시간을 더 준다 (' +
    Math.round(T.small / 1000) + ' < ' + Math.round(T.part / 1000) + ' < ' + Math.round(T.big / 1000) + '초)');
  is(T.gem === T.big, 'Gemini 도 같은 잣대로 잰다');
  is(T.huge === T.cap, '그래도 무한정 붙잡지 않는다 (' + Math.round(T.cap / 1000) + '초에서 멈춤)');
  is(T.part >= (4200 / T.tps) * 1000, '한 조각을 쓰기에 충분한 시간이다');

  /* ═══ 2 ═══ */
  console.log('\n[2] 한 조각이 회사 서버가 내주는 양 안에 들어오는가');
  const P = await page.evaluate(() => ({
    n: PR_PART.length,
    toks: PR_PART.map(x => x.tok),
    labels: PR_PART.map(x => x.label),
    keys: PR_PART.map(x => prSchema(x.k)),
    fitAll: PR_PART.map(x => aiTimeoutFor('{"max_tokens":' + x.tok + '}') >= (x.tok / AI_WRITE_TPS) * 1000)
  }));
  /* 문서가 앞뒤로 갈라져 다섯 조각이 됐다 — 슬라이드 열두 장을 한 번에 쓰게 하면
     길이에 걸려 뒷장이 잘렸기 때문이다. 중요한 건 개수가 아니라 「한 조각이 작은가」 다. */
  is(P.n === 5, '다섯 조각으로 나눈다 (' + P.labels.join(' · ') + ')');
  is(Math.max.apply(null, P.toks) <= 8000, '가장 큰 조각도 회사 서버 한도(8000) 안이다 — 최대 ' + Math.max.apply(null, P.toks));
  is(Math.max.apply(null, P.toks) <= 4500, '한 조각이 4500 을 넘지 않는다 (' + P.toks.join(', ') + ')');
  is(P.fitAll.every(Boolean), '모든 조각이 제한시간 안에 끝날 수 있다');
  /* 조각마다 다른 항목을 맡는다 — 겹치면 같은 걸 두 번 쓰느라 시간을 버린다 */
  const allKeys = P.keys.map(k => (k.match(/"([a-zA-Z]+)":/g) || []).map(x => x.slice(1, -2)));
  const flat = [].concat.apply([], allKeys);
  const top = ['title', 'slides', 'wallets', 'reality', 'benefit', 'pension', 'wholelife', 'options', 'nextSteps', 'risks', 'evidence', 'national', 'costmix', 'incomeFit', 'diff', 'before', 'after', 'katalk'];
  const missing = top.filter(k => flat.indexOf(k) < 0);
  is(missing.length === 0, '화면이 쓰는 항목이 하나도 안 빠졌다' + (missing.length ? ' — 빠짐: ' + missing.join(', ') : ''));
  /* slides 는 앞뒤 조각이 <b>나눠서</b> 쓴다 — 같은 것을 두 번 쓰는 게 아니라
     1~6장 / 7~12장으로 갈라 쓰고 앱이 이어 붙인다. 그래서 여기서 뺀다. */
  const dup = ['wallets', 'reality', 'pension', 'diff'].filter(k =>
    allKeys.filter(a => a.indexOf(k) >= 0).length > 1);
  is(dup.length === 0, '같은 항목을 두 조각이 겹쳐 쓰지 않는다' + (dup.length ? ' — 겹침: ' + dup.join(', ') : ''));
  const slideParts = allKeys.filter(a => a.indexOf('slides') >= 0).length;
  is(slideParts === 2, '슬라이드는 앞뒤 두 조각이 나눠 쓴다 (' + slideParts + '조각)');

  /* ═══ 3 ═══ */
  console.log('\n[3] 토막나거나 붙어 온 JSON 도 살려 내는가');
  const J = await page.evaluate(() => {
    var clean = prJson('{"title":"가","slides":[{"title":"한"}]}');
    var fenced = prJson('```json\n{"title":"나"}\n```');
    var glued = prJson('{"title":"다"}{"title":"라"}');
    var cut = prJson('{"title":"마","slides":[{"title":"하나","lead":"ㄱ"},{"title":"둘"');
    var cutStr = prJson('{"title":"바","readDocs":"여기서 말이 끊겼');
    var junk = prJson('아무 말이나 적었습니다');
    return {
      clean: clean && clean.title, cleanN: clean && clean.slides.length,
      fenced: fenced && fenced.title,
      glued: glued && glued.title,
      cut: cut && cut.title, cutN: cut && cut.slides ? cut.slides.length : 0,
      cutStr: cutStr && cutStr.title, junk: junk
    };
  });
  is(J.clean === '가' && J.cleanN === 1, '멀쩡한 JSON 은 그대로 읽는다');
  is(J.fenced === '나', '코드펜스를 붙여 와도 떼어 내고 읽는다');
  is(J.glued === '다', '두 조각이 붙어 오면 첫 덩어리를 읽는다 — 예전엔 통째로 읽다 실패했다');
  is(J.cut === '마' && J.cutN >= 1, '뒤가 잘려 와도 앞에 쓴 것은 살린다 (' + J.cutN + '장 건짐)');
  is(J.cutStr === '바', '문장 한가운데서 잘려도 살린다');
  is(J.junk === null, 'JSON 이 아니면 억지로 만들지 않는다');

  /* ═══ 4 ═══ */
  console.log('\n[4] 네 조각 중 하나가 죽어도 문서가 나오는가');
  const A = await page.evaluate(async () => {
    var calls = [];
    var body = {
      doc: '{"title":"내 보험","slides":[{"title":"표지"},{"title":"현황"}],"katalk":"ㅇ"}',
      diag: '{"wallets":[{"no":"①","name":"생활","status":"부족","note":"두 문장 이상 풀어 쓴 설명입니다."}],"reality":[{"headline":"큰 병"}]}',
      plan: '{"pension":{"needMonthly":"300만"},"wholelife":{"purpose":"가족생활비"},"risks":["ㄱ"]}',
      fact: '{"evidence":[{"claim":"ㄱ","source":"ㄴ"}],"incomeFit":{"verdict":"적정"}}'
    };
    window.callAI = function (sysTxt, user, tok, gen) {
      var which = /"wallets"/.test(sysTxt) ? 'diag' : /"pension"/.test(sysTxt) ? 'plan'
        : /"evidence"/.test(sysTxt) ? 'fact' : 'doc';
      calls.push({ tok: tok, gen: gen, which: which });
      if (which === 'plan') return Promise.reject(new Error('Overloaded'));   /* 한 조각만 죽인다 */
      return Promise.resolve(body[which]);
    };
    var got = await prAskAll('사용자 입력', null);
    return { calls: calls, got: got.got, fails: got.fails,
      title: got.plan.title, wallets: (got.plan.wallets || []).length,
      reality: (got.plan.reality || []).length, evid: (got.plan.evidence || []).length,
      pension: !!got.plan.pension };
  });
  is(A.calls.length === 5, '다섯 번 나눠 부른다 (' + A.calls.length + '번)');
  is(A.calls.every(c => c.tok <= 4500), '한 번도 4500자를 넘겨 부탁하지 않는다 — ' + A.calls.map(c => c.tok).join(', '));
  is(A.calls.every(c => c.gen === 'proposal'), '고객 자료 도구로 라우팅된다 (회사 AI 로 감)');
  is(new Set(A.calls.map(c => c.which)).size === 4, '네 조각이 서로 다른 것을 맡는다');
  is(A.got === 4 && A.fails.length === 1, '하나가 죽어도 넷은 살린다 (' + A.fails.join(', ') + ')');
  is(A.title === '내 보험' && A.wallets >= 1 && A.evid >= 1, '살아남은 조각이 하나로 합쳐진다');
  is(A.pension === false, '죽은 조각은 없는 채로 둔다 — 지어내지 않는다');

  const AllDead = await page.evaluate(async () => {
    window.callAI = function () { var e = new Error('Overloaded'); e.status = 529; return Promise.reject(e); };
    try { await prAskAll('입력', null); return { threw: false }; }
    catch (e) { return { threw: true, flag: !!e.prAllFailed }; }
  });
  is(AllDead.threw && AllDead.flag, '넷 다 죽으면 조용히 넘어가지 않고 알린다');

  /* ═══ 5 ═══ */
  console.log('\n[5] 넷 다 죽어도 앱이 읽은 내용으로 문서를 세우는가');
  const L = await page.evaluate(doc => {
    var sc = insScan(doc);
    var p = prLocalFill({}, sc, 'explain');
    var text = JSON.stringify(p);
    return {
      scanned: !!sc, n: sc ? sc.total.n : 0,
      slides: (p.slides || []).length, wallets: (p.wallets || []).length,
      titles: (p.slides || []).map(s => s.title),
      risks: (p.risks || []).length, riskTxt: (p.risks || []).join(' '),
      read: p.readDocs || '',
      client: p.clientLine || '',
      hasCo: /DB손보|교보생명/.test(text),
      unknownHonest: (p.wallets || []).filter(w => !w.status || w.status === '').length,
      cancer: (p.wallets || []).filter(w => /치료비 통장/.test(w.name))[0],
      pension: (p.wallets || []).filter(w => /은퇴/.test(w.name))[0]
    };
  }, DOC);
  is(L.scanned && L.n === 6, '앱이 먼저 증권을 읽는다 — 유효 계약 ' + L.n + '건');
  is(L.slides >= 5, 'AI 가 하나도 없어도 문서가 ' + L.slides + '장 나온다 (빈 화면이 아니다)');
  is(L.wallets === 8, '8통장이 여덟 칸 다 선다');
  is(L.hasCo, '회사별로 얼마인지가 문서에 들어간다');
  is(/없는 담보|기준에 못 미치는/.test(L.titles.join(' ')), '비어 있는 담보를 짚는다 — ' + L.titles.join(' / '));
  is(L.risks >= 4 && /금융소비자/.test(L.riskTxt), '준법 고지가 빠지지 않는다');
  is(/해지/.test(L.riskTxt), '해지 후 재가입 손해 경고가 들어간다');
  is(/6건/.test(L.read), '무엇을 읽었는지 사실대로 적는다 — ' + L.read.slice(0, 40));
  /* 견본에는 일반암 충분 · 유사암 부족이 함께 있다. 「부족」 이 맞는 판정이다.
     여기서 확인할 것은 '있는 것을 없다고 하지 않는가' 이다. */
  is(L.cancer && L.cancer.status === '부족' && /담보 \d+개/.test(L.cancer.now) && /\d+개가 기준에/.test(L.cancer.need),
    '있는 담보를 없다고 하지 않고, 그중 몇 개가 모자란지 짚는다 (' +
    (L.cancer || {}).now + ' → ' + (L.cancer || {}).need + ')');
  is(L.pension && L.pension.status === '확인 필요', '증권으로 알 수 없는 연금은 「확인 필요」 라고 한다 — 지어내지 않는다');
  is(L.unknownHonest === 0, '판정 없는 칸을 남기지 않는다');
  is(/홍길동님/.test(L.client) && !/object Object/.test(L.client),
    '고객 이름이 사람 이름으로 나온다 — ' + L.client);
  is(/36세/.test(L.client), '나이도 증권에서 읽어 붙인다');

  const keep = await page.evaluate(doc => {
    var sc = insScan(doc);
    /* AI 가 준 것은 앱이 덮어쓰지 않는다 */
    var p = prLocalFill({ title: 'AI 가 지은 제목', wallets: [{ no: '①', name: 'AI 통장' }] }, sc, 'explain');
    return { title: p.title, w: p.wallets.length, wn: p.wallets[0].name, slides: (p.slides || []).length };
  }, DOC);
  is(keep.title === 'AI 가 지은 제목' && keep.wn === 'AI 통장', 'AI 가 쓴 것은 앱이 덮어쓰지 않는다');
  is(keep.slides >= 5, '없는 것만 채운다');

  /* ═══ 6 ═══ */
  console.log('\n[6] 앱이 채운 부분을 숨기지 않고 밝히는가');
  const V = await page.evaluate(doc => {
    var host = document.createElement('div'); host.id = 'prOut'; document.body.appendChild(host);
    var sc = insScan(doc);
    var p = prLocalFill({}, sc, 'explain');
    p._local = true; p._why = '시간초과'; p._mode = 'explain';
    PR.plan = p; PR.view = 'wallet'; prPaint();
    var local = host.innerHTML;
    /* 8통장은 이제 막대 그래프로 그린다. 「확인 필요」 막대가 충분(초록)과
       같은 색이면 준비된 것처럼 보인다 — 실제 막대의 색을 읽어 확인한다.
       초록 #059669 는 충분, 회색 #CBD5E1 은 확인 필요다. */
    var svgTxt = [].slice.call(host.querySelectorAll('svg')).map(function (s) { return s.outerHTML; }).join('');
    var grey = /#CBD5E1/i.test(svgTxt) && /#059669/i.test(svgTxt) &&
      /확인 필요/.test(host.textContent || '') &&
      /fill="#CBD5E1"/i.test(svgTxt);   /* 확인 필요 막대가 회색으로 칠해져 있다 */
    var p2 = prLocalFill({ title: 'ㄱ', slides: [{ title: 'ㄴ' }] }, sc, 'explain');
    p2._local = false; p2._fails = ['연금 · 종신 (시간초과)']; p2._mode = 'explain';
    PR.plan = p2; PR.view = 'wallet'; prPaint();
    var partial = host.innerHTML;
    var p3 = prLocalFill({ wallets: [{ no: '①', name: '생활', status: '부족', note: '월 47만원이 나가는데 그중 생활을 받쳐 줄 돈은 없습니다. 여기부터 봅니다.' }] }, sc, 'explain');
    p3._mode = 'explain'; PR.plan = p3; PR.view = 'wallet'; prPaint();
    var noteHtml = host.innerHTML;
    host.parentNode.removeChild(host);
    return {
      localSaid: /AI 응답을 받지 못했습니다/.test(local),
      localWhy: /시간초과/.test(local),
      localRetry: /AI 로 다시 시도/.test(local),
      partialSaid: /앱이 읽은 내용으로 채웠습니다/.test(partial),
      partialWhich: /연금 · 종신/.test(partial),
      cleanQuiet: !/AI 응답을 받지 못했습니다/.test(noteHtml),
      noteShown: /월 47만원이 나가는데/.test(noteHtml),
      unsureGrey: grey,
      unsureCount: /확인 필요/.test(local) && /증권만으론 모름|증권만으로는 알 수 없/.test(local)
    };
  }, DOC);
  is(V.localSaid, 'AI 가 다 죽었을 때 그렇다고 화면에 밝힌다');
  is(V.localWhy, '왜 그랬는지도 적는다');
  is(V.localRetry, '다시 시도할 단추를 준다');
  is(V.partialSaid && V.partialWhich, '어느 조각을 앱이 채웠는지 이름을 밝힌다');
  is(V.cleanQuiet, '멀쩡할 때는 쓸데없는 경고를 띄우지 않는다');
  is(V.noteShown, '8통장을 풀어 쓴 설명이 화면에 나온다 — 예전엔 쓰라고만 하고 안 띄웠다');
  is(V.unsureGrey, '「확인 필요」 칸을 초록(충분)으로 칠하지 않는다 — 모르는 것을 준비된 것처럼 보이면 안 된다');
  is(V.unsureCount, '몇 칸이 확인 필요인지 따로 말한다');

  /* ═══ 마무리 ═══ */
  console.log('\n[8] 옛 방식이 남아 있지 않은가');
  const app = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is(app.indexOf(",13000,'proposal'") < 0, '한 번에 13000자를 부탁하던 자리가 없어졌다');
  is(!/function aiTimeoutFor\(body\)\{return \(\(''\+body\)\.length/.test(app), '보낸 양만 보고 시간을 정하던 식이 없어졌다');
  is(app.indexOf('t.lastIndexOf(\'}\')') < 0 || !/function prParse\(txt\)\{\s*try\{var t/.test(app),
    '처음 { 부터 마지막 } 까지 통째로 읽던 식이 없어졌다');

  const hard = errs.filter(m => !/ResizeObserver|Failed to fetch|NetworkError/i.test(m));
  is(hard.length === 0, '중간에 터진 곳이 없다' + (hard.length ? ' — ' + hard[0].slice(0, 110) : ''));

  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? 'AI 제안서 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : 'AI 제안서 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  await browser.close(); srv.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
