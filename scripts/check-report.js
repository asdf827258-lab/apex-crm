/* 고객 결과지(토스 테마 재무 리포트)가 믿을 만한가 (판 X159)

   사장님 말씀 2026-10-22 「현재 내 메인세션에서 재무설계계산기만 따와서 가져와서 준비해줘
   운영방식을 이해하고 조금 더 고객에게 쉽게 어필할수 있도록 만들자」 — 계산 결과를
   카톡용 HTML 한 장 + A4 PDF 로 내는 엔진(app/apex_report_engine.js)과, 계산기의
   「📄 고객 결과지 보기」 단추.

   이 종이는 고객 손에 그대로 갑니다. 그래서 —
     가. 계산이 사장님이 주신 검증값과 맞나 (변액 2.72억·136만 / 퇴직세 1,506·1,054·903 / 국민연금 184)
     나. 견본을 그려 보면 그 숫자가 화면에 그대로 찍히나 · 순서가 정해진 아홉 장 그대로인가
     다. 바깥 파일·스크립트가 0인가 (카톡으로 받아 비행기 모드에서도 열려야 합니다)
     라. tnum 이 없나 — PDF 숫자가 사라집니다 (CLAUDE.md 4-1번)
     마. 세금을 단정하지 않나 — 「비과세」 곁에 「요건」 · 「심사 결과에 따릅니다」 (2번)
     바. 모르는 연금은 세우지 않나 — 연금이 없으면 수익률 장·이익 장이 안 서고, NaN·undefined 0 (1번)
     사. data 에 넣은 HTML 이 글자로 찍히나
     아. 계산기 — 이름이 가려진 채 나가나 · 실명은 한 번 더 묻나 (3번)
     차. ★ 고객이 스스로 부족을 느끼나 — 사장님 말씀 2026-10-22 「고객이 이걸 통해서 스스로 부족하다고
         느끼고 걱정하도록 … 고객의 입장에서 상담을 스스로 받아보고 … 개선해」 (판 X160)
         · 히어로에 「지금 그대로면」 한 달 30일 칸 — 날 수가 <b>고객 숫자(준비된 돈 ÷ 목표)</b>로만 셈해지나
         · 「잘하고 계신 것」 뒤에 「그런데 — 목표의 N%」 · 빈칸을 얼마나 채우나 · 시작을 미루면 · 원금 돌려받는 나이
         · 「지금 그대로면 / 오늘 제안을 더하면」 두 줄 · 스스로 점검 질문 · 마지막 「가장 마음에 걸린 숫자」
         · ★★ 걱정은 고객 숫자로만 — 바깥 통계·「노후 파산」 같은 겁주는 말이 없나 (1번 · 지시문 「확인 안 된 통계 금지」)
         · 목표를 이미 채운 고객에게는 부족을 지어 말하지 않나 (1번)
     ※ 계산기에서 단추를 눌러 실제로 열어 보는 것은 check-reportweb.js 가 합니다(브라우저 갈래).

   되돌려 보기 —
     · RULE.irpEarly 를 0.7 → 0.75 로 → 가 · 나 가 웁니다
     · @media print 에 font-feature-settings:"tnum" 을 넣으면 → 라 가 웁니다
     · rptData 의 rptMask(raw) 를 raw 로 → 아 가 웁니다
     · rptPension 에서 rows 를 빼면(엔진 식으로 다시 세면) → 아 가 웁니다
     · 비과세 쪽지를 「비과세는 가입하면 적용돼요」 로 → 마 가 웁니다
     · daysOf 의 30 을 31 로 → 차 의 「날 수」 가 웁니다 · 문구에 「노후 파산」 을 넣으면 → 차 가 웁니다                          */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

globalThis.window = globalThis;
require(path.join(ROOT, 'app', 'apex_report_icons.js'));
require(path.join(ROOT, 'app', 'apex_report_engine.js'));
const R = globalThis.APEX_REPORT;
const strip = (h) => h.replace(/<style[\s\S]*?<\/style>/g, '').replace(/src="data:[^"]+"/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

head('가. 계산이 검증값과 맞나');
R.selfTest().forEach((t) => is(t.ok, t.name + ' — ' + Math.round(t.got * 10) / 10 + ' (기대 ' + t.want + ')'));

head('나. 견본(홍길동)을 그려 보면');
const sample = require(path.join(ROOT, 'scripts', 'report', '예시_data.js'))(R);
const html = R.html(sample), text = strip(html);
['136만 원', '1,506만 원', '1,054만 원', '903만 원', '184만 원'].forEach((n) => is(text.includes(n), '「' + n + '」 이 찍힌다'));
const ORDER = ['정리했어요', '매월 낼 돈', '최종 제안', '수익률별 예상 수령액', '얻게 되는 이익', '핵심 이슈', '왜 이렇게 짰나요', '일정', '한눈에 요약'];
let at = -1, inOrder = true;
ORDER.forEach((k) => { const i = text.indexOf(k, at + 1); if (i < 0 || i < at) inOrder = false; at = Math.max(at, i); });
is(inOrder, '순서 — ' + ORDER.join(' → '));
is((text.match(/(\d\d) (최종 제안|수익률별|얻게 되는|핵심 이슈|스스로 점검|참고|왜 이렇게|일정|한눈에)/g) || []).every((m, i, a) => i === 0 || +m.slice(0, 2) === +a[i - 1].slice(0, 2) + 1), '장 번호가 01부터 하나씩 늘어난다');
is(/잘하고 계신 것/.test(text) && /같이 할 일/.test(text), '「잘하고 계신 것」 · 「같이 할 일」 이 선다');
is((text.match(/잘하고 계신 것(.*?)같이 할 일/) || [, ''])[1].split('✓').length <= 4, '잘하고 계신 것은 셋까지');

head('다. 바깥 파일 0 — 카톡으로 받아도 그대로 열린다');
is(!/<script/i.test(html), '결과지 안에 스크립트가 없다');
is(!/(src|href)\s*=\s*["']?(https?:)?\/\//i.test(html) && !/url\(\s*["']?(https?:)?\/\//i.test(html) && !/@import/i.test(html), '바깥 주소(src·href·url·@import)가 없다');
is((html.match(/src="data:image\/png;base64,/g) || []).length >= 10, '아이콘이 base64 로 안에 들어 있다 (' + (html.match(/src="data:image\/png;base64,/g) || []).length + '개)');

head('라. PDF 숫자가 살아남나 (4-1번)');
const eng = fs.readFileSync(path.join(ROOT, 'app', 'apex_report_engine.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
is(!/font-feature-settings|tnum|font-variant-numeric/.test(eng + html), 'tnum · font-feature-settings 를 쓰지 않는다');
is(/break-inside:avoid/.test(html), '카드가 쪽에서 안 잘리게 break-inside:avoid');

head('마. 세금을 단정하지 않나 (2번)');
/* 문장마다 봅니다 — 칸(div·li·p…)과 「 — 」 · 마침표에서 끊습니다. 넓게 보면 옆 문장의 「요건」 이
   결론을 덮어 줍니다(되돌려 보기에서 그랬습니다 · 8번). 칸 이름뿐인 글은 LABEL 에 정확히 적어 뺍니다. */
const LABEL = ['비과세 대상 이익'];
const sents = html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<\/(div|li|p|h1|h2|td|th|span)>|<br>/g, '\n').replace(/<[^>]+>/g, '')
  .split(/\n| — |[.!?](?=\s|$)/).map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
const tf = sents.filter((x) => /비과세/.test(x) && !/요건/.test(x) && LABEL.indexOf(x) < 0);
is(sents.some((x) => /비과세/.test(x)) && !tf.length, '「비과세」 를 말하는 문장마다 「요건」 이 있다' + (tf.length ? ' — ' + tf.join(' / ') : ''));
is(!/비과세\s*(상품입니다|됩니다|돼요|입니다)/.test(text), '「비과세됩니다」 같은 결론이 없다');
is(/심사 결과에 따릅니다/.test(text), '「심사 결과에 따릅니다」 가 있다');
is(!/\d+\s*만\s*원\s*이하|\d+\s*년\s*이상\s*(납입|유지)/.test(text), '비과세 한도·기간 숫자를 글로 적지 않는다');

head('바. 모르는 것은 세우지 않나 (1번)');
const bare = R.html({ client: { name: '홍길동', age: 40 }, topic: '지출 점검', summary: ['한 줄'] }), bt = strip(bare);
is(!/수익률별|얻게 되는 이익/.test(bt), '연금이 없으면 수익률 장 · 이익 장을 세우지 않는다');
[html, bare].forEach((h, i) => is(!/NaN|undefined|Infinity|\[object/.test(strip(h)), (i ? '빈 data' : '견본') + ' — NaN · undefined 가 없다'));
is(/>가정</.test(html), '가정한 값에 「가정」 꼬리표가 붙는다');
is(/견본 고객/.test(text) && /사업비 차감/.test(text), '가정이 면책에 모인다');

head('사. data 의 HTML 은 글자로');
const evil = R.html({ client: { name: '<img src=x onerror=alert(1)>' }, summary: ['<script>x</script>'] });
is(!/<img src=x|<script>x/.test(evil), '태그를 넣어도 글자로 찍힌다');

head('차. 고객이 스스로 부족을 느끼나 — 고객 숫자로만 (판 X160)');
const goal = sample.goal, now = sample.nationalPension.monthly, days = Math.round(now / goal * 30);
is(text.includes('지금 그대로면 — ' + sample.pension.openAge + '세 이후 한 달 ' + R.man(goal) + ' 중'), '히어로에 「지금 그대로면」 이 선다');
const nos = (x) => x.replace(/\s+/g, '');   /* 굵게(<b>)가 공백으로 바뀌므로 공백을 빼고 견줍니다 */
is(nos(text).includes(nos('한 달 30일 중 ' + days + '일만 지금 준비된 돈(' + R.man(now) + ')')) && (html.match(/<i class="on"/g) || []).length >= days,
  '30일 중 ' + days + '일 — 준비된 돈 ' + R.man(now) + ' ÷ 목표 ' + R.man(goal) + ' 로만 셈한다');
is(text.indexOf('지금 그대로면') < text.indexOf('매월 낼 돈'), '부족이 상품보다 먼저 나온다 (히어로 → KPI)');
is(text.includes('그런데 — 지금 준비된 것을 다 합쳐도 목표의 ' + Math.round(now / goal * 100) + '%'), '「잘하고 계신 것」 뒤에 「그런데 — 목표의 N%」');
is(/이 제안으로 빈칸을 얼마나 채우나요/.test(text), '이 제안이 빈칸을 얼마나 채우나');
const late = R.calc.annuity(Object.assign({}, sample.pension, { startAge: sample.pension.startAge + 5 })).at(sample.pension.targetRate).monthly;
is(text.includes('5년 뒤 시작 월 ' + R.man(late)), '시작을 미루면 — 5년 뒤 시작 ' + R.man(late) + ' (같은 엔진으로 셈)');
is(/낸 돈을 다 돌려받는 나이/.test(text), '낸 돈을 다 돌려받는 나이');
is(text.indexOf('지금 그대로면 매달') >= 0 && /오늘 제안을 더하면 매달/.test(text), '「지금 그대로면 / 오늘 제안을 더하면」 두 줄로 견준다');
is((html.match(/<input type="checkbox">/g) || []).length >= 3, '스스로 점검 질문 — 눌러 볼 수 있다(스크립트 없이)');
is(/가장 마음에 걸린 숫자/.test(text), '마지막에 「가장 마음에 걸린 숫자」 를 묻는다');
const SCARE = /노후\s*파산|파산|빈곤층|고독사|하류|\d+(\.\d+)?\s*%\s*의\s*(노인|은퇴자|국민|가구|사람|직장인)|통계청|OECD|평균\s*수명/;
is(!SCARE.test(text), '걱정은 고객 숫자로만 — 바깥 통계·겁주는 말이 없다' + (SCARE.test(text) ? ' — ' + text.match(SCARE)[0] : ''));
const rich = strip(R.html({ client: { name: '홍길동', age: 50 }, goal: 300, nationalPension: { monthly: 200 }, otherIncome: [{ label: '퇴직연금', value: 150 }], summary: ['한 줄'] }));
is(/한 달을 다 채워요/.test(rich) && !/아직 비어 있어요|그런데 —/.test(rich), '목표를 이미 채운 고객에게는 부족을 지어 말하지 않는다');
is(!/지금 그대로면/.test(bt), '목표를 모르면 「지금 그대로면」 을 세우지 않는다');

head('아. 계산기 — 이름을 가린 채 내보내나 (3번)');
const fin = fs.readFileSync(path.join(ROOT, 'app', 'finance.html'), 'utf8');
is(/<script src="apex_report_engine\.js"><\/script>/.test(fin) && /<script src="apex_report_icons\.js"><\/script>/.test(fin), '엔진·아이콘을 <script src> 한 줄씩으로 싣는다');
is((fin.match(/onclick="rptPanel\(\)"/g) || []).length >= 1, '「고객 결과지」 단추가 있다');
is(/name=opt\.real&&raw&&raw!=='고객님'\? raw : rptMask\(raw\)/.test(fin), '실명은 opt.real 일 때만 — 기본은 rptMask');
is(/confirm\('카톡으로 나가는 파일에 고객 실명이 들어갑니다/.test(fin), '실명을 켜면 한 번 더 묻는다');
is(/worryNote:saveP>0&&priv<=0\?/.test(fin), '지금 모으는 연금저축·IRP 를 빼고 셌으면 뺐다고 밝힌다(1번)');
is(/openAge:rage, rows:rows,/.test(fin) && /PENSION\.calc\(p,inp\)/.test(fin), '연금은 상품 엔진(PENSION)이 센 줄을 넘긴다 — 엔진 식으로 다시 세지 않는다');

console.log('\n' + (bad ? '✗ ' + bad + '개 어긋남 — 고객 결과지를 믿을 수 없습니다' : '✓ 고객 결과지 — 계산·순서·세금 문구·이름 가리기가 맞습니다'));
process.exit(bad ? 1 : 0);
