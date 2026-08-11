/* 증권에서 「무엇이 몇 건, 어느 회사에 얼마」 를 제대로 읽는가.

   실제로 이런 일이 있었다. 스물여덟 쪽짜리 보장분석 PDF 를 넣었더니
   「계속 분석이 안 된다」 고 했다. 뜯어 보니 PDF 는 멀쩡했다 —
   글자가 27,000자 다 들어 있었다. 앱이 <b>앞 18,000자만 보내고
   9,000자를 버리고</b> 있었다. 버려진 쪽이 하필 진단 절반이었다.

   그리고 이 문서에는 계약 목록이 세 개 들어 있다 —
   유효 6건 / 실효·해지 7건 / 자동차 4건.
   구간을 안 나누고 날짜만 보고 긁으면 셋이 섞이고, 담보 한 줄 한 줄까지
   계약으로 세어 「계약 123건」 이 나온다. 실제로 그랬다.

   그래서 여기서 확인한다.
     1. 유효 계약만 정확히 센다 — 실효·자동차와 안 섞인다
     2. 회사별 보험료와 비중이 맞는다
     3. 담보별 진단(권장/가입/부족)을 읽는다
     4. 글자를 함부로 안 버린다
     5. 이상한 자료가 와도 안 터진다
     6. AI 에게 넘길 표와 화면 카드가 같은 값을 말한다              */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8843;
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
 var mk=function(){var a={
   select:function(){return a},eq:function(){return a},gte:function(){return a},lte:function(){return a},
   is:function(){return a},neq:function(){return a},in:function(){return a},not:function(){return a},
   order:function(){return a},limit:function(){return a},single:function(){return a},range:function(){return a},
   insert:function(){return a},update:function(){return a},upsert:function(){return a},
   then:function(res){return Promise.resolve({data:[],error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{
   getSession:function(){return Promise.resolve({data:{session:{user:{id:'ir',email:'ir@test'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'ir'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

/* 실제 보장분석 PDF 와 같은 모양으로 만든 견본.
   고객 이름·전화는 실제 값을 쓰지 않는다 — 저장소에 남기지 않는다. */
const FOOT = ' 어느지사 | 어느지점/설계사(000000)/000-0000-0000 ';
const DOC = [
  '홍길동 님의 건강을 위한 보장분석 2026-07-27',
  '홍길동 (36세 ,남자) 님의 전체 보장현황 6 0 1 5 0 472,797 2026-07-27 13:15:55',
  '※ 기준담보/권장금액 : 기본형(37개)/표준형 사망 장해 상해사망 4억 6,000만 - 1억 6,000만 3억 -',
  FOOT + '3/28',
  '홍길동 (36세 ,남자) 님의 전체 계약리스트 6 0 1 5 0 472,797 2026-07-27 13:15:55',
  '※ 기준담보/권장금액 : 기본형(37개)/표준형',
  '1 메리츠화 재 (무) 메리츠 실손의료비보험1904 2019-09-04 0년 44세 보험료미제공',
  '2 롯데손보 무배당 롯데 더알찬 건강보험(1708) 2017-08-10 월납 20년 90세 73,096 원',
  '3 흥국화재 무배당 프리미엄 행복보험(1204) 2012-07-19 월납 20년 100세 21,726 원',
  '4 DB손보 아이(I)러브(LOVE)건강보험2104 2021-04-27 월납 20년 100세 99,945 원',
  '5 DB손보 참좋은운전자상해보험2501 2025-02-27 월납 10년 44세 53,030 원',
  '6 교보생명 무배당교보큰사랑CI보험 2007-02-23 월납 20년 종신 225,000 원',
  FOOT + '5/28',
  /* 담보 상세 — 날짜가 잔뜩 있지만 계약이 아니다. 여기에 속으면 안 된다. */
  '홍길동 (36세 ,남자) 님의 상품별 가입담보상세 2026-07-27 13:15:55',
  'DB손보 아이(I)러브(LOVE)건강보험2104 일반암진단비 8,000만 2021-04-27 2091-04-27 유지',
  'DB손보 아이(I)러브(LOVE)건강보험2104 뇌혈관질환진단비 1,600만 2021-04-27 2091-04-27 유지',
  '교보생명 무배당교보큰사랑CI보험 입원특약 6만 2007-02-23 9999-12-31 유지',
  '롯데손보 무배당 롯데 더알찬 건강보험(1708) 질병수술비 30만 2017-08-10 2081-08-10 유지',
  FOOT + '9/28',
  /* 실효·해지 — 유효 계약과 절대 합치면 안 된다 */
  '홍길동 (36세 ,남자) 님의 실효/해지계약현황 7 0 2 3 2 ※ 기준담보/권장금액 : 기본형(37개)/표준형 2026-07-27 13:15:55 821,142',
  '1 해지* KB손보 (무)KB운전자보험과안전하게사는이야 기(21.01) 2종 2021-01-15 월납 20년 100세 49,000 원',
  '2 해지* KB손보 (무)KB 운전자보험과 안전하게 사는 이 야기(22.04)_2종 2022-04-05 월납 20년 100세 49,000 원',
  '3 해지* 롯데손보 무배당 let:drive 운전자보험(2308) 2023-08-04 월납 20년 53세 48,510 원',
  '4 해지* 흥국화재 무배당 든든한 SMILE 운전자보험 (1606) 2016-06-22 월납 20년 46세 10,612 원',
  '5 해지* 삼성화재 무배당 삼성화재 상해보험 안심동행 (1910.19) 1종(연만기) 2020-03-06 월납 20년 49세 31,775 원',
  '6 해지* 흥국생명 (무)흥국생명라이프업UL종신보험V3(2 종,100세3%체증형,가산형) 2017-07-25 월납 15년 종신 602,845 원',
  '7 해지* 라이나생명 무배당THE든든한치아보험Ⅱ(갱신형) 2017-07-19 월납 10년 37세 29,400 원',
  FOOT + '16/28',
  '홍길동 (36세 ,남자) 님의 자동차 보험 조회 2026-07-27 13:15:55 * 신용정보원 데이터 기반 회사명 상품명 담보유형 담보명 보험기간 가입금액',
  '현대해상 Hicar 다이렉트(CM형) 개인용자동차보험 무보험차상해 무보험차에 의한 상해(개인용,업무용,이륜차) 2025-08-21~ 2026-08-21 2억',
  '현대해상 Hicar 다이렉트(CM형) 개인용자동차보험 다른자동차상해 다른 자동차 운전담보 2025-08-21~ 2026-08-21 1,000',
  'DB손보 건설기계영업용 무보험차상해 무보험차에 의한 상해(영업용) 2026-01-15~ 2027-01-15 5억',
  FOOT + '17/28',
  '홍길동 (36세 ,남자) 님의 담보별 진단현황 2026-07-27 13:15:55 ※ 기준담보/권장금액 : 기본형(37개)/표준형',
  '사망/장해 질병80%미만후유장해 권장 1억 가입 6,000만 부족 -4,000만',
  '치매/간병 장기요양간병비 권장 3,000만 가입 0 미가입 -3,000만',
  '치매/간병 경증치매진단 권장 1억 가입 0 미가입 -1억',
  '암 진단 일반암 권장 5,000만 가입 1억 6,000만 충분 +1억 1,000만',
  '암 진단 유사암 권장 2,000만 가입 600만 부족 -1,400만',
  '암 진단 고액(표적)항암치료비 권장 3,000만 가입 0 미가입 -3,000만',
  '뇌/심장 진단 뇌혈관질환 권장 3,000만 가입 1,600만 부족 -1,400만',
  '뇌/심장 진단 허혈성심장질환 권장 3,000만 가입 1,600만 부족 -1,400만',
  '실손의료비 질병입원의료비 권장 5,000만 가입 5,000만 충분 -',
  '수술/입원 암수술비 권장 300만 가입 200만 부족 -100만',
  '운전자/기타 화재벌금 권장 2,000만 가입 0 미가입 -2,000만',
  FOOT + '28/28'
].join(' ');

let pass = 0, fail = 0;
const ok = m => { pass++; console.log('  ✓ ' + m); };
const no = m => { fail++; console.log('  ✗ ' + m); };
const is = (c, m) => c ? ok(m) : no(m);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2300);

  const ready = await page.evaluate(() => typeof insScan === 'function' && typeof insBrief === 'function');
  if (!ready) {
    console.log('✗ 증권 추출기가 실려 있지 않습니다.');
    errs.slice(0, 4).forEach(m => console.log('    ' + m));
    await browser.close(); srv.close(); process.exit(1);
  }

  /* ── 1 ── */
  console.log('\n[1] 유효 계약만 정확히 세는가');
  const sc = await page.evaluate(d => {
    var s = insScan(d);
    return s && { who: s.who, total: s.total, byCo: s.byCo,
      plans: s.plans.map(function (p) { return { co: p.co, fee: p.fee, till: p.till, from: p.from }; }),
      lapsedCo: s.lapsed.map(function (p) { return p.co; }),
      cars: s.cars.length, diagN: s.diags.length, shortN: s.short.length,
      diagNames: s.diags.map(function (x) { return x.name; }) };
  }, DOC);
  is(!!sc, '읽어 냈다');
  is(sc && sc.total.n === 6, '유효 계약 6건 (' + (sc ? sc.total.n : 0) + '건)');
  is(sc && sc.total.fee === 472797, '월 보험료 합계 472,797원 (' + (sc ? sc.total.fee.toLocaleString() : 0) + ')');
  is(sc && sc.total.unknown === 1, '보험료 미제공 1건을 따로 센다');
  is(sc && sc.total.saidN === 6, '문서 머리글이 말하는 건수도 읽는다 (' + (sc ? sc.total.saidN : 0) + ')');
  is(sc && sc.who.name === '홍길동' && sc.who.age === 36, '고객 이름·나이를 읽는다');

  /* 담보 상세에 날짜가 잔뜩 있어도 계약으로 세지 않는다 — 예전에 123건이 나왔다 */
  is(sc && sc.total.n < 10, '담보 줄을 계약으로 세지 않는다 (' + (sc ? sc.total.n : 0) + '건)');

  /* ── 2 ── */
  console.log('\n[2] 실효·자동차와 안 섞이는가');
  is(sc && sc.total.lapsedN === 7, '실효·해지 7건을 따로 센다 (' + (sc ? sc.total.lapsedN : 0) + '건)');
  is(sc && sc.total.lapsedFee === 821142, '실효 당시 월 보험료도 센다 (' + (sc ? sc.total.lapsedFee.toLocaleString() : 0) + ')');
  is(sc && sc.cars === 3, '자동차보험을 따로 센다 (' + (sc ? sc.cars : 0) + '건)');
  const mixed = sc ? sc.plans.filter(p => ['KB손보', '삼성화재', '흥국생명', '라이나생명'].indexOf(p.co) >= 0).length : 9;
  is(mixed === 0, '해지된 회사가 유효 계약에 안 섞인다 (' + mixed + '건 섞임)');
  is(sc && sc.lapsedCo.indexOf('KB손보') >= 0, '해지 목록에는 그 회사가 들어 있다');

  /* ── 3 ── */
  console.log('\n[3] 회사별 집계');
  const co = sc ? sc.byCo : [];
  const find = n => co.filter(c => c.co === n)[0];
  is(co.length === 5, '회사 5곳 (' + co.length + '곳)');
  is(find('교보생명') && find('교보생명').fee === 225000, '교보생명 225,000원');
  is(find('DB손보') && find('DB손보').n === 2 && find('DB손보').fee === 152975, 'DB손보 2건 152,975원');
  is(find('메리츠화재') && find('메리츠화재').unknown === 1, '메리츠화재는 보험료 미제공으로 표시');
  is(co[0] && co[0].co === '교보생명', '많이 내는 회사부터 나온다');
  const pct = co.reduce((a, c) => a + c.pct, 0);
  is(Math.abs(pct - 100) < 0.5, '비중 합이 100% (' + pct.toFixed(1) + '%)');
  is(find('메리츠화재') && find('메리츠화재').fee === 0, '미제공을 0원으로 두고 합계에 안 넣는다');

  /* ── 4 ── */
  console.log('\n[4] 담보별 진단');
  is(sc && sc.diagN === 11, '담보 진단 11개 (' + (sc ? sc.diagN : 0) + '개)');
  is(sc && sc.shortN === 9, '부족·미가입 9개 (' + (sc ? sc.shortN : 0) + '개)');
  is(sc && sc.diagNames.indexOf('질병80%미만후유장해') >= 0, '「80%」 같은 기호가 안 잘린다');
  is(sc && sc.diagNames.indexOf('고액(표적)항암치료비') >= 0, '괄호가 든 담보명도 온전하다');
  is(sc && sc.diagNames.indexOf('뇌혈관질환') >= 0 && sc.diagNames.indexOf('허혈성심장질환') >= 0,
    '뇌·심장 담보를 읽는다');
  const dirty = sc ? sc.diagNames.filter(n => /표준형|기본형|^\d/.test(n)).length : 9;
  is(dirty === 0, '머리글 찌꺼기가 담보명에 안 붙는다 (' + dirty + '개)');

  /* ── 5 ── */
  console.log('\n[5] 글자를 함부로 안 버리는가');
  const lim = await page.evaluate(() => ({ one: PDF_TEXT_MAX, all: PDF_TEXT_TOTAL }));
  is(lim.one >= 50000, '파일 하나당 ' + lim.one.toLocaleString() + '자까지 보낸다 (예전 18,000자)');
  is(lim.all >= 100000, '여러 개 합쳐 ' + lim.all.toLocaleString() + '자까지 보낸다');
  const trim = await page.evaluate(() => {
    var big = function (n) { var s = ''; while (s.length < n) s += '가나다라마바사아자차'; return s.slice(0, n); };
    var parts = [{ name: 'A', text: big(90000) }, { name: 'B', text: big(90000) }, { name: 'C', text: big(90000) }];
    var r = pdfTrimParts(parts);
    var tot = 0; r.parts.forEach(function (p) { tot += p.text.length; });
    return { tot: tot, note: r.note, each: r.parts.map(function (p) { return p.text.length; }) };
  });
  is(trim.tot <= 150000, '한도를 넘으면 줄여서 보낸다 (' + trim.tot.toLocaleString() + '자)');
  is(!!trim.note, '무엇을 얼마나 줄였는지 말해 준다 — ' + (trim.note || '').slice(0, 46));
  is(trim.each.every(n => n > 20000), '한 파일만 통째로 버리지 않고 고르게 줄인다 (' + trim.each.join('/') + ')');

  /* ── 6 ── */
  console.log('\n[6] AI 에게 넘길 표 · 화면 카드');
  const brief = await page.evaluate(d => insBrief(insScan(d)), DOC);
  is(/유효 계약 6건/.test(brief) && /472,797원/.test(brief), '표에 유효 6건·472,797원이 적힌다');
  is(/실효·해지 계약 7건/.test(brief), '실효·해지를 따로 적는다');
  is(/절대 합치지 않는다/.test(brief), 'AI 에게 합치지 말라고 못 박는다');
  is(/교보생명 — 1건 · 월 225,000원/.test(brief), '회사별 표가 들어간다');
  is(/직접 계산해 검증할 것/.test(brief), '원본 판정을 베끼지 말라고 적는다');
  is(brief.length > 1200 && brief.length < 12000, '표 길이가 적당하다 (' + brief.length + '자)');

  const card = await page.evaluate(d => {
    var s = insScan(d);
    insCssMount();
    document.body.innerHTML = '<div id="stage"></div>';
    document.getElementById('stage').innerHTML = insCardHtml(s);
    var el = document.getElementById('stage');
    return { txt: (el.textContent || '').replace(/\s+/g, ' '), rows: el.querySelectorAll('.ir-tb tbody tr').length,
      bars: el.querySelectorAll('.ir-cob span').length, css: !!document.getElementById('insReadCss') };
  }, DOC);
  is(card.css, '카드 스타일이 실린다');
  is(card.rows === 6, '표에 유효 계약 6줄 (' + card.rows + '줄)');
  is(card.bars === 5, '회사별 막대 5개 (' + card.bars + '개)');
  is(/472,797원/.test(card.txt), '화면에도 같은 합계가 나온다');
  is(/실효·해지 7건/.test(card.txt), '화면에 실효·해지가 따로 나온다');
  is(/유효 계약과 합쳐 세지 않습니다/.test(card.txt), '왜 따로 두는지 화면에도 적힌다');

  /* ── 7 ── */
  console.log('\n[7] 이상한 자료가 와도');
  const junk = await page.evaluate(() => {
    var r = {};
    r.empty = insScan('') === null;
    r.short = insScan('안녕') === null;
    r.noPlan = insScan('아무 말이나 잔뜩 적힌 문서입니다. 보험과 상관없는 내용. '.repeat(40)) === null;
    var s = insScan('홍길동 (40세 ,여자) 님의 전체 계약리스트 1 0 0 1 0 10,000 1 삼성화재 어떤보험 2020-01-01 월납 20년 100세 10,000 원');
    r.one = !!(s && s.total.n === 1 && s.total.fee === 10000);
    r.card = insCardHtml(null) === '';
    r.brief = insBrief(null) === '';
    /* 회사 이름이 없는 줄은 계약으로 세지 않는다 */
    var s2 = insScan('홍길동 님의 전체 계약리스트 1 0 0 0 0 0 1 없는회사이름 어떤보험 2020-01-01 월납 20년 100세 10,000 원');
    r.unknownCo = !s2 || s2.total.n === 0;
    return r;
  });
  is(junk.empty && junk.short, '빈 것·너무 짧은 것은 조용히 넘어간다');
  is(junk.noPlan, '보험 자료가 아니면 아무것도 안 만든다');
  is(junk.one, '계약 한 건짜리도 읽는다');
  is(junk.card && junk.brief, '못 읽었을 때 카드·표가 빈 문자열이다');
  is(junk.unknownCo, '모르는 회사 이름은 계약으로 안 센다');

  /* 다섯 도구에 붙어 있는가 */
  const wired = await page.evaluate(() => {
    var on = [];
    PDF_TOOLS.forEach(function (p) { if (p.scan) on.push(p.id); });
    return on;
  });
  is(wired.indexOf('bojang') >= 0 && wired.indexOf('baba') >= 0 && wired.indexOf('compare') >= 0,
    '보장분석·비포애프터·제안서비교에 붙어 있다 (' + wired.join(', ') + ')');

  const hard = errs.filter(m => !/ResizeObserver|Failed to fetch|NetworkError/i.test(m));
  is(hard.length === 0, '중간에 터진 곳이 없다' + (hard.length ? ' — ' + hard[0].slice(0, 100) : ''));

  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? '증권 읽기 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : '증권 읽기 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  await browser.close(); srv.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
