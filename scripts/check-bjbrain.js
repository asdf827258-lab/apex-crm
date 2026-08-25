/* AI 제안서 — <b>비포를 그대로 쓰고, 윤시현의 말로 쓰는가.</b>

   두 가지가 빠져 있었습니다.

   ① <b>화면과 다른 숫자를 AI 에게 넘겼습니다.</b>
      화면은 babaRowsV()(해지를 반영하고 유지분을 더한 값)를 보는데,
      babaBrief() 는 BABA.rows(원본)를 넘겼습니다. 같은 자리를 두 숫자로
      말한 셈이라, AI 가 쓴 글과 그 옆에 선 표가 서로 어긋났습니다.
      숫자만이 아닙니다 — <b>어떤 계약을 유지하고 무엇을 해지하기로 했는지</b>가
      안 갔습니다. 그러면 AI 는 「이 계약은 유지하시니」 라고 말할 수가 없어,
      덱이 계속 <b>「누가 써도 나오는 보장분석」</b> 이 됩니다.

   ② <b>윤시현의 두뇌가 안 탔습니다.</b>
      bjBuild 가 sys(BJ_RULES) 만 불러 정체성과 브랜드 톤까지만 갔습니다.
      8통장·치료비 이중구조·A/B/C·연령별 1순위 같은 <b>실제 상담 프레임</b>과,
      사장님이 두뇌에 넣어 둔 <b>축적 지식</b>이 빠졌습니다. 다른 엔진
      (두뇌·상담·팩트파인딩)은 전부 태우고 있었는데 여기만 빠져 있었습니다.

   여기서 확인합니다.
     1. babaBrief 가 <b>화면과 같은 값</b>을 넘기는가
     2. 계약별 유지·해지·미정이 <b>회사·상품·보험료</b>와 함께 가는가
     3. 해지로 <b>비는 담보</b>를 짚어 주는가
     4. 월 보험료를 <b>보험료를 아는 자리</b> 하나에서 가져오는가
     5. 프롬프트에 <b>YUN CORE · 8통장 · 치료비 · A/B/C · 축적 지식</b>이 타는가
     6. 덱에 <b>윤시현의 코멘트 · 오늘의 방향</b> 장을 시키는가
     7. <b>AI 가 없어도</b> 방향이 서는가 — 그리고 거기서 금액을 지어내지 않는가
     8. 비포&애프터 한 줄 코멘트도 <b>윤시현의 말</b>인가                    */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본 이름은 홍길동 (CLAUDE.md 3번) */
const BEFORE = [
  '가입설계서 계약자 홍길동 48세 남',
  '삼성화재 (무)무배당 A종합보험  월보험료 50,000원',
  '  암진단비(유사암제외)   3,000만원',
  '  뇌혈관질환진단비       1,000만원',
  '현대해상 (무)무배당 B건강보험  월보험료 40,000원',
  '  암진단비(유사암제외)   2,000만원',
  '  급성심근경색진단비     1,000만원'
].join('\n');
const AFTER = [
  '가입설계서 계약자 홍길동 48세 남',
  '흥국화재 (무)무배당 C치료보험  월보험료 90,000원',
  '  암진단비(유사암제외)   2,000만원',
  '  허혈성심장질환진단비   2,000만원'
].join('\n');
/* 보장분석표 꼴 — 프롬프트를 세우는 데 쓴다 */
const DOC = [
  '보장분석 리포트  홍길동 (48세, 남자)',
  '홍길동 님의 전체 계약리스트',
  '1 정상 삼성생명 무배당 알파Plus보장보험 2006-05-01 월납 10 년 100 세 87,300 원',
  '2 정상 메리츠화재 내맘같은 건강보험 2025-05-01 월납 20 년 100 세 112,400 원',
  '홍길동 님의 담보별 진단현황',
  '암 진단 일반암진단비 권장 5,000만 가입 3,000만 부족 -2,000만',
  '뇌/심장 진단 급성심근경색증진단비 권장 3,000만 가입 3,000만 충분 -'
].join('\n');

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 180)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  console.log('\n[1] 비포&애프터를 세우고 유지·해지를 찍는다');
  const st = await page.evaluate((d) => {
    window.osTabAllowed = function () { return true; };
    localStorage.removeItem(BABA_PLAN_KEY); localStorage.removeItem(BABA_ROW_KEY);
    /* 두뇌에 넣어 둔 지식이 실제로 실리는지 보려고 한 줄 심어 둔다 */
    localStorage.setItem('apex_brain_kb', '나는 첫 마디를 늘 「잘 준비하셨습니다」 로 연다.');
    BABA.plans = null; babaPlans();
    const bm = babaScan(d.b), am = babaScan(d.a);
    BABA.rows = BABA_TERMS.map(t => {
      const b = bm[t.k] || null, a = am[t.k] || null;
      return { k: t.k, n: t.n, b: b ? b.won : null, a: a ? a.won : null, raw: (b && b.raw) || '' };
    });
    babaSave();
    babaPlanMerge(babaPlanScan(d.b), 'b');
    babaPlanMerge(babaPlanScan(d.a), 'a');
    const P = babaPlanOf('b');
    babaPlanSet(P[0].id, 'keep', 'keep');   /* 삼성화재 유지 */
    babaPlanSet(P[1].id, 'keep', 'drop');   /* 현대해상 해지 */
    return { keeps: babaPlanOf('b').map(x => x.co + '=' + (x.keep || '미정')) };
  }, { b: BEFORE, a: AFTER });
  is(st.keeps.length === 2 && /삼성화재=keep/.test(st.keeps.join(' ')),
     '  기존 2건 · 유지 1 · 해지 1 — ' + st.keeps.join(' / '));

  console.log('\n[2] babaBrief 가 화면과 같은 값을 넘긴다');
  const br = await page.evaluate(() => {
    const v = babaRowsV().filter(r => r.k === 'cancer')[0] || {};
    const raw = BABA.rows.filter(r => r.k === 'cancer')[0] || {};
    return { brief: babaBrief(), screen: [v.b, v.a], raw: [raw.b, raw.a] };
  });
  const line = new RegExp('일반암[^|]*\\|\\s*' + br.screen[0] + '\\s*\\|\\s*' + br.screen[1] + '\\s*\\|');
  is(line.test(br.brief),
     '  담보 표가 화면 값과 같다 — 화면 ' + br.screen.join(' / ') + ' · 원본 ' + br.raw.join(' / '));
  /* 원본과 화면이 실제로 다른 자료여야 이 점검에 뜻이 있다 */
  is(br.screen[1] !== br.raw[1],
     '  이 견본은 화면과 원본이 실제로 다르다 — 안 그러면 이 점검이 헛돈다');

  console.log('\n[3] 계약별 결정이 회사·상품·보험료와 함께 간다');
  is(/유지 1 · 해지 1/.test(br.brief), '  유지·해지·미정 건수');
  is(/삼성화재.*유지/.test(br.brief.replace(/\n/g, ' ')), '  유지한 계약이 「유지」 로');
  is(/현대해상.*해지/.test(br.brief.replace(/\n/g, ' ')), '  해지한 계약이 「해지」 로');
  is(/흥국화재/.test(br.brief), '  새로 제안드리는 계약도 간다');
  is(/해지 안 한 기존 계약 \+ 새 제안서/.test(br.brief),
     '  「신규」 가 무슨 뜻인지 밝힌다 — 유지분이 포함된다는 것');

  console.log('\n[4] 해지로 비는 담보를 짚어 준다');
  is(/해지하면 비는 담보/.test(br.brief), '  「해지하면 비는 담보」 칸이 있다');
  is(/급성심근경색\s+1000\s*→\s*0/.test(br.brief), '  해지한 계약이 들고 있던 담보가 이름과 금액으로');

  console.log('\n[5] 월 보험료는 한 곳에서만 가져온다');
  is(/■ 월 보험료/.test(br.brief), '  보험료를 따로 적는다');
  is(/원 단위/.test(br.brief), '  만원과 안 섞이게 단위를 밝힌다 (CLAUDE.md 4번)');
  is(/해지 뒤 실제로 매달 낼 돈/.test(br.brief), '  해지를 반영한 실제 부담액을 준다');
  is(/어긋난다/.test(br.brief),
     '  표와 계약 합이 어긋나면 <b>단정하지 말라고</b> 적는다');
  /* 담보 표(만원)에 보험료 줄이 또 들어가면 만원/원이 섞인다.
     계약 표 머리글의 「| 월 보험료 |」 까지 잡으면 헛알람이 된다 —
     <b>숫자 두 칸이 뒤따르는 줄</b>만 본다. */
  is(!/\|\s*월 보험료\s*\|\s*[\d확]/.test(br.brief),
     '  담보 표(만원)에 보험료 줄을 넣지 않는다');

  console.log('\n[6] 윤시현의 두뇌가 프롬프트에 탄다');
  const sp = await page.evaluate((D) => {
    const spec = bjBuild([{ name: '보장분석표', text: D }], {});
    const S = spec.system, U = spec.user;
    return { len: S.length,
      spine: S.indexOf('윤시현 AI CORE') >= 0,
      deep: S.indexOf('보장분석 심화 규칙') >= 0,
      eight: S.indexOf('8통장 프레임') >= 0,
      chiryo: S.indexOf('치료비 통장') >= 0,
      abc: S.indexOf('A/B/C안') >= 0,
      ages: S.indexOf('대상별 1순위') >= 0,
      kb: S.indexOf('잘 준비하셨습니다') >= 0,
      cmt: U.indexOf('윤시현의 코멘트') >= 0,
      dir: U.indexOf('오늘의 방향') >= 0 };
  }, DOC);
  console.log('    system ' + sp.len + '자');
  is(sp.spine, '  YUN CORE 정체성 · 준법');
  is(sp.deep, '  보장분석 심화 규칙 (yunDeep analysis)');
  is(sp.eight, '  8통장 프레임');
  is(sp.chiryo, '  치료비 통장 이중구조 — 브랜드 핵심');
  is(sp.abc, '  A/B/C 상담 마무리 틀');
  is(sp.ages, '  연령·직군별 1순위 통장');
  is(sp.kb, '  사장님이 두뇌에 넣어 둔 지식이 최우선으로 실린다');

  console.log('\n[7] 덱에 코멘트·방향 장을 시킨다');
  is(sp.cmt, '  「윤시현의 코멘트」 장을 시킨다');
  is(sp.dir, '  「오늘의 방향」 장을 시킨다');

  console.log('\n[8] AI 가 없어도 방향이 선다 — 그리고 지어내지 않는다');
  const loc = await page.evaluate((D) => {
    const sc = insScan(D);
    const d = bjLocalDeck([{ name: 'x', text: D }], {}, 'AI 가 아직 연결되지 않았습니다.', sc);
    const dir = (d.slides || []).filter(s =>
      /오늘의 방향|정하실 것은 없습니다/.test((s.eyebrow || '') + (s.title || '')))[0];
    return { n: (d.slides || []).length, has: !!dir,
             cards: dir ? (dir.cards || []).map(c => (c.label || '') + ' ' + (c.title || '')) : [],
             txt: dir ? JSON.stringify(dir).replace(/<[^>]+>/g, ' ') : '' };
  }, DOC);
  is(loc.has, '  「오늘의 방향」 장이 선다 — 덱 ' + loc.n + '장');
  is(loc.cards.length === 3, '  A/B/C 세 갈래 — ' + loc.cards.join(' / '));
  /* 없는 금액을 만들면 그 자리에서 계약이 깨진다 (CLAUDE.md 1번) */
  is(!/[0-9][0-9,]{2,}\s*(만원|원|만)/.test(loc.txt),
     '  금액을 한 줄도 지어내지 않는다' +
     (/[0-9][0-9,]{2,}\s*(만원|원|만)/.test(loc.txt) ? ' — ' + loc.txt.slice(0, 120) : ''));
  is(/심사 결과에 따릅니다|심사 결과에 따라/.test(loc.txt),
     '  보험료·보장은 「심사 결과에 따릅니다」');
  is(/요건을 충족할 때/.test(loc.txt), '  세금은 요건 충족 시로만 말한다 (CLAUDE.md 2번)');
  is(!/한도|[0-9]+세 이상|[0-9]+개월/.test(loc.txt),
     '  시행령에 있는 한도·나이·개월 수를 적지 않는다');

  console.log('\n[9] 비포&애프터 한 줄 코멘트도 윤시현의 말이다');
  const ai = await page.evaluate(() => {
    let seen = null;
    const real = window.callAI, ready = window.aiReady;
    window.callAI = function (s, u) { seen = { sys: s, usr: u }; return Promise.reject(new Error('stub')); };
    window.aiReady = function () { return true; };
    const done = () => { window.callAI = real; window.aiReady = ready; return seen; };
    return babaAiFill().then(done, done);
  });
  is(!!ai, '  babaAiFill 이 AI 를 부른다');
  if (ai) {
    is(ai.sys.indexOf('윤시현 AI CORE') >= 0, '  YUN CORE 가 실린다');
    is(ai.sys.indexOf('상담 화법 규칙') >= 0, '  상담 화법 규칙(yunDeep consult)이 실린다');
    is(ai.sys.indexOf('강점을 먼저 인정') >= 0, '  강점을 먼저 인정하라고 시킨다');
  }

  console.log('\n[10] 콘솔이 조용하다');
  is(errs.length === 0, '  오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '✗ ' + bad + '개 어긋남\n'
                  : 'AI 제안서 점검 통과 — 비포를 그대로 쓰고, 윤시현의 말로 씁니다.\n');
  process.exit(bad ? 1 : 0);
})();
