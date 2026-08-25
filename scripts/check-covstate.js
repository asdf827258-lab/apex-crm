/* 보장분석 — <b>상태를 제대로 말하는가.</b>

   상담에서 숫자보다 먼저 무너지는 것이 <b>상태</b>다. 세 자리를 지킨다.

   ① <b>납입완료를 해지와 섞지 않는가.</b>
      「납입완료」는 보험료 낼 의무만 끝났고 <b>보장은 살아 있는</b> 계약이다.
      해지와 같은 칸에 넣으면 살아 있는 보장을 없는 것으로 세게 되고, 고객이
      그 자리에서 「그럼 저 지금 보장 없는 건가요」 라고 묻는다.
      그리고 <b>짐작으로 붙이지 않는다</b> — 가입일이나 납입기간을 못 읽었으면
      「확인필요」다. 틀린 「납입완료」는 보험료를 안 내도 되는 줄 알게 만든다.

   ② <b>뇌·심장 담보를 「외 N개」 에 숨기지 않는가.</b>
      뇌·심장은 담보 이름 하나하나가 보장 범위를 가른다.
        뇌출혈(I60~I62) 10% / 뇌졸중(I60~I63) 50% / 뇌혈관질환(I60~I69) 90%+
        급성심근경색(I21~I22) 30% / 허혈성심장질환(I20~I25) 90%+
      실제로 「허혈성심장질환 외 1개」 로 접히면서 <b>급성심근경색 진단비가
      화면에서 사라져</b>, 고객이 안 들어 있는 줄 알았다. 두 가지가 겹쳤다 —
      카드가 4개에서 자른 것(UI)과, 계열 표에 급성심근경색 줄이 <b>아예 없던
      것</b>(파싱). 둘 다 본다.

   ③ <b>누를 수 없는 AI 문구를 남기지 않는가.</b>
      AI 가 이미 연결돼 있는데도 「AI 를 연결하면 여기서 더 나갑니다」 라고
      적혀 있었다. 어디를 눌러야 하는지도, 지금 연결돼 있는지도 알 수 없는
      <b>죽은 문구</b>다. 가짜 단추를 만들지 않고 <b>진짜 도는 단추</b>를
      가리켜야 한다.                                                        */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': /\.html$/.test(f) ? 'text/html; charset=utf-8' : 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const APP = fs.readFileSync('app/index.html', 'utf8');
/* 주석에 적어 둔 설명을 코드로 착각하면 헛알람이 된다 (CLAUDE.md 8번) */
const CODE = APP.replace(/\/\*[\s\S]*?\*\//g, ' ');

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  console.log('\n[1] 납입완료 — 계약 상태와 섞지 않고, 짐작으로 붙이지 않는다');
  /* 글자만 보면 안 된다. <b>실제로 불러</b> 판정이 맞는지 본다. */
  const pay = await page.evaluate(() => {
    if (typeof insPayStatus !== 'function') return null;
    const T = '2026-08-25';
    const c = [
      ['다 낸 계약',            { from: '2006-05-01', years: '10', name: '알파Plus보장보험' }, 'PAID_UP'],
      ['아직 내는 계약',        { from: '2025-05-01', years: '20', name: '건강보험' },        'PAYING'],
      ['오늘이 딱 끝나는 날',   { from: '2016-08-25', years: '10', name: '보험' },            'PAID_UP'],
      ['하루 남음',             { from: '2016-08-26', years: '10', name: '보험' },            'PAYING'],
      ['종신납 — 햇수가 없다',  { from: '2010-01-01', years: '',   name: '종신보험' },        'UNKNOWN'],
      ['가입일을 못 읽었다',    { from: '',           years: '20', name: '보험' },            'UNKNOWN'],
      ['증권에 적혀 있다',      { from: '',           years: '',   name: '알파 (납입완료)' }, 'PAID_UP']
    ];
    return c.map(([why, p, want]) => ({ why: why, want: want,
      got: insPayStatus(p, T), label: insPayLabel(p, T) }));
  });
  is(!!pay, '  판정 함수(insPayStatus)가 있다');
  if (pay) pay.forEach(x => is(x.got === x.want,
    '  ' + x.why + ' → ' + x.label + (x.got === x.want ? '' : ' ← ' + x.want + ' 여야 한다')));
  /* 세 가지가 다 있어야 「모른다」 를 말할 수 있다 */
  const payTbl = (CODE.match(/var INS_PAY\s*=\s*\{([^}]*)\}/) || [])[1] || '';
  is(/PAID_UP/.test(payTbl) && /PAYING/.test(payTbl) && /UNKNOWN/.test(payTbl),
     '  납입중·납입완료·확인필요 세 가지를 표 한 곳에서 답한다');
  is(/확인필요/.test(payTbl), '  모를 때 쓸 말이 있다 — 「확인필요」');
  /* 계약 상태(state)를 납입 상태로 쓰면 해지와 섞인다 */
  is(!/insPayStatus[\s\S]{0,300}p\.state/.test(CODE),
     '  판정에 계약 상태(state)를 끌어다 쓰지 않는다 — 해지와 섞이는 자리다');
  is(/납입상태/.test(APP), '  화면에 「납입상태」 칸이 있다');

  console.log('\n[2] 뇌·심장 — 「외 N개」 에 숨기지 않는다');
  const cov = await page.evaluate(() => {
    if (typeof insAreaShow !== 'function') return null;
    return { heart: insAreaShow('뇌·심장'), circ: insAreaShow('순환계 치료'),
             other: insAreaShow('실손'),
             /* 계열 표가 급성심근경색을 실제로 잡는가 */
             keys: (typeof INS_KEY !== 'undefined')
               ? INS_KEY.filter(k => ['급성심근경색진단비', '급성심근경색증진단금',
                                      '급성 심근경색 진단', '허혈성심장질환진단비',
                                      '허혈성심질환진단비', '뇌졸중진단비', '뇌출혈진단금']
                   .some(n => k.re.test(n))).map(k => k.k)
               : null };
  });
  is(!!cov, '  펼침 한도를 답하는 자리(insAreaShow)가 있다');
  if (cov) {
    is(cov.heart === null || cov.heart > 90, '  뇌·심장은 안 접는다 — 한도 ' + cov.heart);
    is(cov.circ === null || cov.circ > 90, '  순환계 치료도 안 접는다 — 한도 ' + cov.circ);
    /* 전부 펼치면 다른 영역 카드가 길어진다 — 뇌·심장만 푸는 것이 핵심이다 */
    is(cov.other > 0 && cov.other < 90, '  그 밖의 영역은 그대로 접는다 — 한도 ' + cov.other);
    is(!!(cov.keys && cov.keys.indexOf('급성심근경색') >= 0),
       '  계열 표가 급성심근경색을 잡는다 — 잡힌 것: ' + (cov.keys || []).join(', '));
    is(!!(cov.keys && cov.keys.indexOf('허혈성심장질환 (전체)') >= 0),
       '  허혈성심장질환도 그대로 잡는다');
    is(!!(cov.keys && cov.keys.indexOf('뇌졸중') >= 0 && cov.keys.indexOf('뇌출혈') >= 0),
       '  뇌졸중·뇌출혈을 따로 잡는다 — 보장 범위가 다르다');
  }
  /* 객체를 그대로 join 하면 화면에 [object Object] 가 찍힌다 */
  is(!/noG\.slice\(0, 3\)\.join/.test(CODE),
     '  빈 계열을 적을 때 객체를 그대로 잇지 않는다 — [object Object] 자리');

  console.log('\n[3] AI — 죽은 문구를 남기지 않는다');
  is(!/AI 를 연결하면 <em>여기서 더<\/em> 나갑니다/.test(APP),
     '  「AI 를 연결하면 여기서 더 나갑니다」 가 없다');
  const cta = await page.evaluate(() => {
    if (typeof bjActions !== 'function') return null;
    const real = window.aiReady, out = {};
    window.aiReady = function () { return false; }; out.off = bjActions('x');
    window.aiReady = function () { return true; };  out.on = bjActions('x');
    window.aiReady = real;
    return out;
  });
  is(!!cta, '  단추를 만드는 자리(bjActions)가 있다');
  if (cta) {
    is(cta.on.indexOf('AI 상세분석') >= 0, '  AI 가 있으면 「AI 상세분석」 이라고 적는다');
    is(cta.off.indexOf('AI 상세분석') < 0, '  AI 가 없으면 그 이름을 안 쓴다 — 가짜 단추가 아니다');
    /* 같은 일을 하는 단추가 둘이면 어느 것을 눌러야 할지 다시 모른다 (5번) */
    is((cta.on.match(/runPdf/g) || []).length === 1, '  AI 를 돌리는 단추가 하나뿐이다');
  }
  is(/상담용 참고|해지·가입을 단정하지 않습니다|단정하지 않습니다/.test(APP),
     '  AI 결과가 상담용 참고임을 밝힌다');

  console.log('\n[4] 고객정보 — 일부만 고쳐도 나머지가 안 지워진다');
  const cli = await page.evaluate(() => {
    if (typeof osCliInfoPayload !== 'function') return null;
    const mk = (id, v) => { const e = document.createElement('input'); e.id = id; e.value = v; document.body.appendChild(e); };
    mk('cliPhone', '01099999999'); mk('cliBirth', ''); mk('cliMemo', '');
    /* 성별·소득·지출은 아예 안 만든다 — 화면에 없는 칸이다 */
    const one = osCliInfoPayload();
    document.getElementById('cliBirth').value = '1980';
    mk('cliIncome', '500');
    const two = osCliInfoPayload();
    return { one: one, two: two };
  });
  is(!!cli, '  보낼 것을 고르는 자리(osCliInfoPayload)가 있다');
  if (cli) {
    is(cli.one.phone === '01099999999', '  고친 칸은 담긴다');
    is(!('birth_year' in cli.one), '  빈 칸은 아예 안 보낸다 — 옛 값이 안 지워진다');
    is(!('gender' in cli.one), '  화면에 없는 칸은 안 보낸다');
    is(Object.keys(cli.one).length === 1,
       '  전화번호만 고치면 전화번호만 간다 — ' + JSON.stringify(cli.one));
    is(cli.two.birth_year === 1980 && cli.two.monthly_income === 500,
       '  채운 칸은 숫자로 제대로 간다');
  }
  /* ||null 로 만들면 안 건드린 칸이 통째로 지워진다 — 되살아나면 안 되는 자리 */
  is(!/phone:\(osVal\('cliPhone'\)\|\|null\)/.test(CODE),
     '  옛 방식(||null 로 채워 보내기)이 되살아나지 않았다');
  is(/OSC_SAVING/.test(CODE), '  저장 중에는 두 번 눌리지 않는다');
  is(/osCliInfoLoad\(\)/.test(CODE.slice(CODE.indexOf('function osCliInfoSave'),
                                         CODE.indexOf('function osCliInfoSave') + 1400)),
     '  저장 뒤 서버에서 다시 읽는다 — 새로고침에서 되돌아가지 않는다');
  is(/저장에 실패했습니다/.test(APP), '  실패를 성공처럼 말하지 않는다');

  console.log('\n[5] 콘솔이 조용하다');
  is(errs.length === 0, '  오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '✗ ' + bad + '개 어긋남\n'
                  : '보장분석 상태 점검 통과 — 납입완료·뇌심장·AI·고객정보가 다 맞습니다.\n');
  process.exit(bad ? 1 : 0);
})();
