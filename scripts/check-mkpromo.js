/* 홍보 발췌 — 상품을 찾은 다음이 비어 있던 자리.

   「어떻게 홍보하나」의 답은 기사에 없고 상품설명서·약관에 있다.
   그래서 서재의 문서를 읽어 홍보에 쓸 대목을 뽑는데, 여기서 틀리면
   고객 앞에서 <b>없는 보장을 말하게</b> 된다. 그 자리를 지킨다.

     1. 발췌 기계가 한 벌인가 (약관·상품설명서가 같은 scanRules 를 쓰나)
     2. 상품설명서 룰이 약관 룰과 겹치지 않나 — 두 벌이면 한쪽만 고쳐진다
     3. 룰 표에 한도·나이·보험료 숫자를 적어 두지 않았나 (외운 숫자 금지)
     4. 문서를 읽어 원문 그대로 · 출처와 함께 뽑는가
     5. 유리한 것만 뽑지 않는가 — 주의·독소가 같은 장에 남는가
     6. 못 찾으면 못 찾았다고 적는가 — 빈 자리를 채우지 않는가          */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = process.cwd(), PORT = 8823;
const MK = 'app/상담자료/미끼레이더/index.html';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css', '.json':'application/json' };
let bad = 0;
const is = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) bad++; };

function serve(){ return http.createServer((q,r)=>{
  let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/index.html';
  const f=path.join(ROOT,u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end('no');return}
  r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
  fs.createReadStream(f).pipe(r); }).listen(PORT); }

/* 견본 문서 — 실제 고객 이름을 쓰지 않는다 (CLAUDE.md 3) */
const SPEC = `[[p1]] 홍길동생명 든든암보험 상품설명서
[[p2]] 이 상품은 간편심사로 가입할 수 있는 비갱신형 순수보장형 상품입니다.
[[p3]] 주요 보장 : 암 진단비 3,000 만원, 입원 일당 30,000 원을 지급합니다.
[[p4]] 가입한도 는 주계약 기준 최대 5,000 만원 입니다.
[[p5]] 월 보험료 예시 : 40세 남자, 20년납 100세만기 기준 32,400 원.
[[p6]] 납입 기간 은 10년납 · 20년납 중에서 고르실 수 있습니다.
[[p7]] 선택 특약 : 재진단암특약, 표적항암특약을 추가 가입할 수 있습니다.
[[p8]] 건강체 할인 : 비흡연이고 혈압 기준을 충족하면 보험료를 할인합니다.
[[p9]] 만기 환급금 이 없는 순수보장형 상품입니다.`;
const YAK = `[[p1]] 홍길동생명 든든암보험 약관
[[p12]] 제3조(보장개시일) 암에 대한 보험금은 보장개시일 부터 그 날을 포함하여 90 일이 지난 날의 다음날부터 지급합니다.
[[p13]] 제4조(감액지급) 계약일부터 1년 이내 에 암으로 진단확정된 경우 보험금의 50 % 를 지급합니다.
[[p20]] 제9조(보장범위) 뇌혈관질환 (I60~I69) 으로 진단확정된 경우 보험금을 지급합니다.
[[p21]] 제10조 표적항암 약물허가치료를 받은 경우 보험금을 지급합니다.`;

(async () => {
  const src = fs.readFileSync(MK, 'utf8');

  console.log('\n[1] 발췌 기계가 한 벌인가');
  is(/function scanRules\(t,rules,marks\)/.test(src), '  룰표를 받는 scanRules 가 있다');
  is(/const finds=scanRules\(t,TERM_RULES,marks\)/.test(src),
     '  약관 분석기도 그 기계를 쓴다 — 따로 돌지 않는다');
  is(/function rulesFor\(kind\)/.test(src), '  문서 종류로 표를 고르는 자리가 하나다');
  is(/kind==='약관' \? TERM_RULES : TERM_RULES\.concat\(SPEC_RULES\)/.test(src),
     '  약관에는 상품설명서 룰을 안 돌린다 — 헛것을 잡지 않게');

  console.log('\n[2] 상품설명서 룰이 약관 룰과 겹치지 않는가');
  const ids = t => [...t.matchAll(/\{id:'([^']+)'/g)].map(m => m[1]);
  const blk = n => (src.match(new RegExp('const ' + n + '=\\[([\\s\\S]*?)\\n\\];')) || [, ''])[1];
  const term = ids(blk('TERM_RULES')), spec = ids(blk('SPEC_RULES'));
  is(term.length >= 40, '  TERM_RULES 가 그대로 있다 (' + term.length + '개)');
  is(spec.length >= 5, '  SPEC_RULES 가 있다 (' + spec.length + '개)');
  const dup = spec.filter(x => term.includes(x));
  is(!dup.length, '  겹치는 id 가 없다' + (dup.length ? ' — 겹침: ' + dup.join(',') : ''));
  /* 낱말까지 겹치면 같은 대목이 두 번 잡힌다 */
  const reOf = (t, id) => (t.match(new RegExp("\\{id:'" + id + "'[\\s\\S]*?re:(/[\\s\\S]*?/),")) || [, ''])[1];
  const termRes = term.map(i => reOf(blk('TERM_RULES'), i));
  const same = spec.filter(i => termRes.includes(reOf(blk('SPEC_RULES'), i)));
  is(!same.length, '  똑같은 낱말표를 다시 적어 두지 않았다' + (same.length ? ' — ' + same.join(',') : ''));

  console.log('\n[3] 룰 표에 외운 숫자를 적어 두지 않았는가');
  /* 한도·나이·보험료는 시행령·요율로 바뀐다. 표에 박아 두면 그게 무너진다.
     talk(고객에게 읽어 주는 말)에 금액이 들어 있으면 잡는다. */
  const talks = [...blk('SPEC_RULES').matchAll(/talk:'((?:[^'\\]|\\.)*)'/g)].map(m => m[1]);
  is(talks.length === spec.length, '  룰마다 화법이 있다');
  const withNum = talks.filter(t => /\d[\d,]{2,}\s*(만\s*원|만원|원)|\d+\s*세|\d+\s*개월/.test(t));
  is(!withNum.length, '  화법에 금액·나이·개월 수를 적어 두지 않았다'
     + (withNum.length ? ' — ' + withNum[0].slice(0, 40) : ''));
  is(/심사 결과에 따릅니다/.test(blk('SPEC_RULES')),
     '  「심사 결과에 따릅니다」 를 화법에 넣어 두었다');

  console.log('\n[4] 화면이 붙어 있는가');
  is(/id="p-promo"/.test(src), '  홍보 발췌 판이 있다');
  is(/subs:\['radar','concept','new','promo'\]/.test(src), '  차림표에 올라 있다');
  is(/promo:'홍보 발췌'/.test(src), '  이름이 붙어 있다');
  is(/window\.promoFor=function/.test(src), '  회사별 신상품에서 넘어오는 문이 있다');
  is(/npco-pm/.test(src), '  상품마다 홍보 발췌 단추가 있다');

  /* ── 실제로 읽어 보는 자리 ─────────────────────────────────── */
  const server = serve(); const browser = await chromium.launch();
  try {
    const pg = await browser.newPage();
    const errs = [];
    pg.on('console', m => { if (m.type() !== 'error') return; const t = m.text();
      if (/ERR_CONNECTION_RESET|api\/market|Failed to load resource/.test(t)) return; errs.push(t); });
    await pg.route('**/api/market**', r => r.abort());
    await pg.goto('http://127.0.0.1:' + PORT + '/' + MK.split('/').map(encodeURIComponent).join('/'),
      { waitUntil: 'domcontentloaded', timeout: 60000 });
    /* 잠금은 이제 <b>골라 쓰는 것</b>이다 — 안 걸려 있으면 그냥 열린다.
       걸려 있을 때만 푼다. 없는 것을 기다리면 여기서 20초를 버린다. */
    if (await pg.$('#lockPw')) {
      await pg.fill('#lockPw', 'test1234'); await pg.click('#lockGo');
      await pg.waitForSelector('#lockOv', { state: 'detached', timeout: 10000 });
    }
    await pg.waitForFunction('typeof pmRepaint==="function"', { timeout: 20000 });
    await pg.evaluate(() => document.querySelector('.tab[data-t="promo"]').click());

    console.log('\n[5] 상품설명서를 읽어 원문 그대로 뽑는가');
    await pg.evaluate(([s]) => {
      state.ups = { d_spec: { id: 'd_spec', text: s } };
      state.lib = { items: [{ id: 'd_spec', title: '홍길동생명_든든암보험_상품설명서',
        kind: '상품설명서', co: '홍길동생명', pages: 9 }] };
      pmRepaint();
    }, [SPEC]);
    await pg.click('.pmrow'); await pg.click('#pmRun'); await pg.waitForTimeout(1200);
    let out = await pg.evaluate(() => document.querySelector('#pmOut').innerText);
    is(out.includes('3,000'), '  주요 보장 금액을 원문 그대로 옮긴다');
    is(out.includes('5,000'), '  가입한도를 옮긴다');
    is(/40세 남자/.test(out), '  보험료 예시를 조건과 함께 옮긴다 — 금액만 떼어 내지 않는다');
    is(/할인/.test(out), '  할인 제도를 잡는다');
    is(/상품설명서/.test(out), '  출처에 문서 이름이 붙는다');
    is(/심사 결과에 따릅니다/.test(out), '  「심사 결과에 따릅니다」 가 화면에 있다');
    is(/약관을 안 넣으셨습니다/.test(out), '  약관이 빠졌으면 그렇다고 말한다');

    console.log('\n[6] 약관까지 넣으면 출처가 조·쪽까지 붙는가');
    await pg.evaluate(([s, y]) => {
      state.ups = { d_spec: { id: 'd_spec', text: s }, d_yak: { id: 'd_yak', text: y } };
      state.lib = { items: [
        { id: 'd_spec', title: '홍길동생명_든든암보험_상품설명서', kind: '상품설명서', co: '홍길동생명', pages: 9 },
        { id: 'd_yak', title: '홍길동생명_든든암보험_약관', kind: '약관', co: '홍길동생명', pages: 210 }] };
      pmRepaint();
    }, [SPEC, YAK]);
    await pg.evaluate(() => document.querySelectorAll('.pmck').forEach(c => { if (!c.checked) c.click() }));
    await pg.click('#pmRun'); await pg.waitForTimeout(1200);
    out = await pg.evaluate(() => document.querySelector('#pmOut').innerText);
    is(!/약관을 안 넣으셨습니다/.test(out), '  약관을 넣으면 그 경고가 사라진다');
    is(/제3조/.test(out), '  출처에 제N조 가 붙는다');
    is(/12쪽|13쪽|20쪽/.test(out), '  출처에 쪽수가 붙는다');
    is(/90\s*일/.test(out), '  약관의 대기기간을 잡는다');

    console.log('\n[7] 유리한 것만 뽑지 않는가');
    is(/반드시 같이 말할 것/.test(out), '  주의·독소 칸이 같은 장에 있다');
    const cp = await pg.evaluate(async () => { let g = '';
      navigator.clipboard.writeText = async t => { g = t };
      document.querySelector('#pmCopy').click();
      await new Promise(r => setTimeout(r, 300)); return g; });
    is(/③ 반드시 같이 말할 것/.test(cp), '  복사본에도 그 칸이 함께 담긴다');
    is(/90/.test(cp), '  복사본에 불리한 조건이 실제로 들어 있다');
    is(/심사 결과에 따릅니다/.test(cp), '  복사본에도 심사 문구가 붙는다');

    console.log('\n[8] 못 읽거나 못 찾으면 그렇다고 적는가');
    await pg.evaluate(() => {
      state.ups = { d_scan: { id: 'd_scan', text: '[[p1]] ' } };
      state.lib = { items: [{ id: 'd_scan', title: '홍길동생명_스캔본', kind: '상품설명서',
        co: '홍길동생명', pages: 40, scanned: true }] };
      pmRepaint();
    });
    await pg.click('.pmrow'); await pg.click('#pmRun'); await pg.waitForTimeout(900);
    out = await pg.evaluate(() => document.querySelector('#pmOut').innerText);
    is(/읽지 못한 문서/.test(out), '  스캔본은 읽지 못했다고 말한다 — 0건으로 삼키지 않는다');
    is(/못 찾았습니다/.test(out), '  못 찾은 칸은 못 찾았다고 적는다');
    is(!errs.length, '  콘솔이 조용하다' + (errs.length ? ' — ' + errs[0].slice(0, 90) : ''));
  } finally {
    await browser.close(); server.close();
  }

  console.log('\n──────────────────────────────');
  console.log(bad ? '홍보 발췌 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '홍보 발췌 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
