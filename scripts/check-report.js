/* 고객 결과지(토스 테마 재무 리포트)가 믿을 만한가 (판 X185)

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
         느끼고 걱정하도록 … 고객의 입장에서 상담을 스스로 받아보고 … 개선해」 (판 X173)
         · 히어로에 「지금 그대로면」 한 달 30일 칸 — 날 수가 <b>고객 숫자(준비된 돈 ÷ 목표)</b>로만 셈해지나
         · 「잘하고 계신 것」 뒤에 「그런데 — 목표의 N%」 · 빈칸을 얼마나 채우나 · 시작을 미루면 · 원금 돌려받는 나이
         · 「지금 그대로면 / 오늘 제안을 더하면」 두 줄 · 스스로 점검 질문 · 마지막 「가장 마음에 걸린 숫자」
         · ★★ 걱정은 고객 숫자로만 — 바깥 통계·「노후 파산」 같은 겁주는 말이 없나 (1번 · 지시문 「확인 안 된 통계 금지」)
         · 목표를 이미 채운 고객에게는 부족을 지어 말하지 않나 (1번)
     거. 판 X179 — 판정 숫자 FIN_RULE 한 곳(글자 35·45·60·70·20·10 이 0) · 판정식 한 곳 · finData 재사용 · 미래 장면 본인 대출
     하. 판 X178 — 직업군 평균 다섯 줄이 보도자료 숫자 그대로 · 출처 · 손으로 정한 소득 배수 0
     파. 판 X177 — 평균마다 출처 · 못 찾은 평균은 null · 보험료 판정 IP_RULE 한 곳 · 나이대 비율 0 · ipBase 한 곳
     타. 판 X176 — 나이대 문구 IP_AGE 한 곳 · 사슬 0 · 생활비 칸 목록 한 곳
     카. 판 X187 (사장님 말씀 2026-10-22 「점검 필요로 바꾸고, 2번은 만들어줘」) — 「불가」 → 「점검 필요」 ·
         「연금저축·IRP·달러·변액 쌓인 금액」 칸이 비면 모름(0 아님) · 탭과 결과지가 psAccPlan 한 곳에서 세나
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

head('차. 고객이 스스로 부족을 느끼나 — 고객 숫자로만 (판 X173)');
const goal = sample.goal, now = sample.nationalPension.monthly, days = Math.round(now / goal * 30);
is(text.includes('지금 그대로면 — ' + sample.pension.openAge + '세 이후 한 달 ' + R.man(goal) + ' 중'), '히어로에 「지금 그대로면」 이 선다');
const nos = (x) => x.replace(/\s+/g, '');   /* 굵게(<b>)가 공백으로 바뀌므로 공백을 빼고 견줍니다 */
is(nos(text).includes(nos('한 달 30일 중 ' + days + '일은 지금 준비된 돈(' + R.man(now) + ')')) && (html.match(/<i class="on"/g) || []).length >= days,
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
is(/saveP>0&&priv<=0&&!ap\?'※ 지금 모으고 계신 연금저축·IRP·달러·변액/.test(fin), '지금 모으는 연금저축·IRP 를 빼고 셌으면 뺐다고 밝힌다(1번)');
/* 판 X187 — 쌓인 금액 칸 · 탭과 결과지가 한 곳(psAccPlan)에서 센다 · 「불가」 대신 「점검 필요」 */
is(/id="s_pen_acc"[^>]*placeholder="모름"/.test(fin) && !/id="s_pen_acc"[^>]*value="/.test(fin), '「쌓인 금액」 칸이 있고, 비어 있으면 모름이다(0 을 미리 넣지 않는다 · 1번)');
/* 판 X180 — 쌓인 금액 셈(psAccPlan)은 준비된 연금 셈(finReady) 안에서 한 번만 부르고, 탭과 결과지는 finReady 를 부릅니다 */
is((fin.match(/function psAccPlan\(/g) || []).length === 1 && (fin.match(/[^ ]psAccPlan\(\)/g) || []).length === 1 && /acc=psAccPlan\(\)/.test(fin) && (fin.match(/var RD=finReady\(\)|=finReady\(\)/g) || []).length >= 2, '탭과 결과지가 psAccPlan 한 곳에서 센다 — finReady 를 거쳐(5번)');
is(/if\(raw===''\|\|!window\.APEX_REPORT\) return null;/.test(fin), '칸이 비면 null — 0 과 다르다(1번)');
is(/APEX_REPORT\.calc\.RULE\.annuity\.annuityFactor/.test(fin) && !/psAccPlan[\s\S]{0,900}\b200\b/.test(fin.slice(fin.indexOf('function psAccPlan'), fin.indexOf('function psAccPlan') + 900)), '전환계수는 엔진 RULE 한 곳에서 — 200 을 따로 외우지 않는다');
is(/'점검 필요'/.test(fin) && !/:'불가'/.test(fin), '계산기 결과지는 「불가」 대신 「점검 필요」');
/* 판 X176 — 나이대 문구는 IP_AGE 한 곳 (예전엔 if 사슬 · 삼항 사슬로 두 벌) */
is((fin.match(/var IP_AGE=\[/g) || []).length === 1 && (fin.match(/20대 · 시작기/g) || []).length === 1, '나이대 표가 IP_AGE 한 곳에만 있다(5번)');
is(/var ageMsg=ipBand\(d\.age\)\.one;/.test(fin) && !/var ageMsg=d\.age<30\?/.test(fin), '상담 가이드 한 줄도 IP_AGE 를 읽는다 — 삼항 사슬 0');
/* 판 X180 — 「나이별 보험 필요성 피드백」 을 그리던 덧칠(CONTENT-FIRST)은 화면에 한 번도 서지 않는 죽은 판이라 지웠습니다. 남은 자리는 ipBand 를 읽습니다 */
is(!/if\(age<30\)\{\s*stage=/.test(fin) && (!/function insuranceGuideByAge\(/.test(fin) || /var B=ipBand\(age\);/.test(fin)) && /ipBand\(d\.age\)/.test(fin), '「나이별 보험 필요성 피드백」 도 IP_AGE 를 읽는다 — if 사슬 0');
/* 판 X177 — 기준값: 평균은 출처가 붙은 것만 · 보험료 판정 8/15 는 IP_RULE 한 곳 · 나이대 비율 0 */
const avgBlk = fin.slice(fin.indexOf('var IP_AVG={'), fin.indexOf('};', fin.indexOf('var IP_AVG={')));
is(/fam:\s*\{ v:2995,[\s\S]*?src:'[^']+'[\s\S]*?cite:'아주경제 2022\.05\.15[\s\S]*?url:'https:\/\/www\.ajunews\.com\//.test(avgBlk) && /prem:\{ v:39\.1,[\s\S]*?cite:'데이터솜 2022\.01\.19[\s\S]*?url:'http:\/\/www\.datasom\.co\.kr\//.test(avgBlk), '평균마다 출처 · 언론사 · 날짜 · 주소가 붙어 있다(9번)');
is(/me:\s*null/.test(avgBlk), '출처를 못 찾은 진단·치료비 평균은 null — 지어 넣지 않는다(1번)');
is((fin.match(/IP_RULE\.premHi/g) || []).length >= 4 && (fin.match(/IP_RULE\.premLo/g) || []).length >= 3 && !/(insRatio|insRate|ratio)\s*(>=|>|<=|<)\s*(8|10|12|15)\b/.test(fin), '보험료 비중 판정(8 · 15)도 IP_RULE 한 곳을 읽는다(5번)');
const ageBlk = fin.slice(fin.indexOf('var IP_AGE=['), fin.indexOf('];', fin.indexOf('var IP_AGE=[')));
is(!/fam:\d+|me:\d+/.test(ageBlk), '나이대 표에 근거 없는 「가족 : 내 연금」 비율이 없다');
/* 판 X178 — 소득 셈의 배수는 직업군 평균. 숫자는 보도자료 〈표 3-6〉·〈표 4-5〉·〈표 4-7〉 그대로여야 합니다 */
const JOB = { all: [7427, 9534, 4747, 1299], reg: [9519, 12004, 8145, 411], tmp: [4534, 3634, 2986, 322], self: [8000, 12479, 1741, 4833], etc: [4007, 4593, 1462, 256] };
const jobBlk = fin.slice(fin.indexOf('var IP_JOB={'), fin.indexOf('};', fin.indexOf('var IP_JOB={')));
is(Object.keys(JOB).every((k) => new RegExp(k + ':\\s*\\{[^}]*inc:' + JOB[k][0] + ', debt:' + JOB[k][1] + ',\\s*work:' + JOB[k][2] + ', biz:' + JOB[k][3] + '\\}').test(jobBlk)),
  '직업군 평균 다섯 줄이 보도자료 표의 숫자 그대로다 (2025년 가계금융복지조사)');
is(/var IP_JOB_SRC=\{[^}]*2025년 가계금융복지조사[^}]*2025\.12\.04[^}]*url:'https:\/\/mods\.go\.kr\//.test(fin), '배수의 출처(기관 · 발표일 · 주소)가 붙어 있다(9번)');
is(!/famIncomeYears|meIncomeYears/.test(fin), '손으로 정한 소득 배수(3년치 · 1년치)가 남지 않았다');
is(/inc:own>0\?own\*J\.famX:null/.test(fin) && /own\*J\.meX\*R\.meMonths\/12/.test(fin), '소득 셈은 직업군 배수(빚 배수 · 일해서 버는 몫)로');
/* 판 X179 — 계산기 판정 숫자 한 곳 · 기존 계산(finData)을 그대로 · 재구성은 fsPlan 한 곳 */
is((fin.match(/var FIN_RULE=\{/g) || []).length === 1 && !/(dsr<=(35|45)|ltv<=(60|70)|saveRatio>=(20|10)|savingRatio(>=|<)20)(?![0-9.])/.test(fin), '대출·저축률 판정 숫자가 FIN_RULE 한 곳 — 글자로 적힌 35 · 45 · 60 · 70 · 20 · 10 이 0(예전엔 서른네 곳)');
const kindBody = (fn) => (fin.match(new RegExp('function ' + fn + '\\(d\\)\\{([^}]*)\\}')) || [, '1'])[1];
is(!/\d/.test(kindBody('finCashKind').replace(/surplus>=0/g, '')) && !/\d/.test(kindBody('finDebtKind')), '판정식 안에 숫자가 0 — 기준은 FIN_RULE 에서만 (되돌림: 40 을 몰래 넣으면 웁니다)');
is((fin.match(/function finCashKind\(/g) || []).length === 1 && (fin.match(/function finDebtKind\(/g) || []).length === 1 && (fin.match(/finDebtKind\(d\)/g) || []).length >= 4, '현금흐름·대출 판정식도 한 곳 — 최종보고서·상담가이드·고칠 순서가 함께 부른다');
is(/window\.finData=data;/.test(fin) && /var d=finData\(\)/.test(fin) && (fin.match(/function fsPlan\(/g) || []).length === 1, '재구성은 기존 계산(finData)을 그대로 부른다 — 다시 짜지 않는다');
is(/incLater=fam\.inc==null\?null:\(I\.debt>0\?fam\.inc\*debtLater\/I\.debt:fam\.inc\)/.test(fin), '미래 장면의 소득 셈에 본인 대출(그때 0)을 넣는다');
is((fin.match(/function ipBase\(/g) || []).length === 1 && (fin.match(/ipBase\(I\)/g) || []).length >= 3, '기준값은 ipBase 한 곳 — 상담·결과지가 함께 부른다');
is((fin.match(/var RPT_FIXED=/g) || []).length === 1 && /finSum\(RPT_FIXED\)/.test(fin.slice(fin.indexOf('function finCore'), fin.indexOf('function finCore') + 1500)) && /finCore\(\)/.test(fin.slice(fin.indexOf('function ipPlan'), fin.indexOf('function ipPlan') + 900)), '생활비 칸 목록 한 곳 — 결과지와 보험의 자리가 finCore 를 거쳐 함께 읽는다');
is(/openAge:rage, rows:rows,/.test(fin) && /PENSION\.calc\(p,inp\)/.test(fin), '연금은 상품 엔진(PENSION)이 센 줄을 넘긴다 — 엔진 식으로 다시 세지 않는다');

console.log('\n' + (bad ? '✗ ' + bad + '개 어긋남 — 고객 결과지를 믿을 수 없습니다' : '✓ 고객 결과지 — 계산·순서·세금 문구·이름 가리기가 맞습니다'));
process.exit(bad ? 1 : 0);
