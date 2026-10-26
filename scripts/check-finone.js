/* 계산기가 같은 숫자를 한 곳에서만 셈하나 (판 X186)

   사장님 말씀 2026-10-22 「전부 손대고 막아봐 우선」 — 판 X210 에서 남겨 둔 쌍둥이를 다 고치고,
   다시 생기지 못하게 막으라는 말씀.

   손대기 전 app/finance.html 은 같은 숫자를 <b>아홉 군데</b>가 따로 셈했고 정의도 달랐습니다.
     · 소득 — 세전 / 세전 × 0.82 어림(「세후 실수령」) / 임대·배당·이자 빠뜨림
     · 지출 — 「기타/월」 을 빠뜨린 곳 두 곳 (남는 돈이 부풀어 그 돈으로 낼 보험료를 제안)
     · 준비된 연금 — × 1.7 / 4% 인출 · 퇴직금 연금화 · 주택연금 늘 합산 / 국민연금+퇴직+개인만
     · 노후 판정 — 부족액 150 기준 / 목표의 80% 기준 · 「지금 월 (부족액 × 0.35)만 더 쌓으면 채워집니다」
     · 점수 — 가중치가 다른 점수식 넷(대시보드 · 최종보고서 · 상담가이드 · 종합 재무설계)
     · 저축률 기준 — 20 / 25 / 15 · 보험료율 기준 — 12 / 15
     · 상속세 — 간이 셈 셋(상속·증여 탭과 공제가 다름)
     · 건보료 · 국민연금 감소 — 어림 셋(하나는 퍼센트를 「만 원」 으로 찍음)
     · ★★ 없는 칸을 읽음 — ins_cancer_diag · ins_care → 최종보고서·점수가 암 진단비 · 간병을 늘 0 으로 봄

   여기서 못 박는 것 (글자만 봅니다 · 몇 초)
     가. finCore · finReady · finInherit · finNhis · finScore 가 한 번씩만 있고, 화면 아홉 곳이 그것을 부르나
     나. 남는 돈 · 준비된 연금 · 연금 부족을 셈하는 식이 finCore 밖에 없나
     다. 어림이 돌아오지 않았나 — × 0.82 소득 · × 1.7 연금 · 4% 인출(전세 기회비용 한 곳만 예외) · × 0.35
     라. 판정 숫자가 FIN_RULE · IP_RULE 밖에 글자로 없나 — 150 · 5000 · 3000/2000/1000 · 저축률 25/15 · 보험료 12 · 0.12
     마. 점수식이 finScore 하나인가 — 다른 곳에 「?18:6」 이나 「score-=」 가 없나
     바. ★★ 읽는 칸이 다 있는 칸인가 — num · val · psN · finNum · finVal · gv · trNum · trVal · n('s_…') 의
         칸 이름이 화면에 있는 id 인가 (그 자리에서 만드는 칸 fldG · selG 도 셉니다)
     사. 확인 안 된 연도 주장(「2056년 고갈」)이 없나 (1번)
     아. ★ 죽은 판이 돌아오지 않았나 — 「최종」 · 「보험」 칸을 그리는 덧칠이 넷이었고 뒤엣것이 앞엣것을 덮어써
         셋은 한 번도 화면에 서지 않으면서 저마다 다른 기준으로 셈했습니다(CONTENT-FIRST · INSURANCE ADD-ON ·
         renderFinal · 안 불리는 quickTax 두 벌). 다시 생기면 웁니다 — 칸마다 그리는 자는 하나

   되돌려 보기 — data() 에 ins_cancer_diag 를 되살리면 바 가 · render() 에 × 0.82 를 되살리면 다·나 가 ·
               trGrade 에 score-=15 를 되살리면 마 가 웁니다.                                           */
const fs = require('fs'), path = require('path');
const FILE = process.argv[2] || path.join(__dirname, '..', 'app', 'finance.html');
const raw = fs.readFileSync(FILE, 'utf8');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);
/* 주석은 지우고 봅니다 — 「전에는 × 0.82 였다」 같은 설명이 헛것으로 걸리지 않게(8번) */
const code = raw.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ').split('\n').map((l) => /^\s*\/\//.test(l) ? '' : l.replace(/\s\/\/ .*$/, '')).join('\n');
const count = (re) => (code.match(re) || []).length;
const fnBody = (name) => { const i = code.indexOf('function ' + name + '('); if (i < 0) return ''; let d = 0, j = code.indexOf('{', i); for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(j, k + 1); } } return ''; };

head('가. 한 곳이 한 번씩 · 화면들이 그것을 부르나');
['finCore', 'finReady', 'finInherit', 'finNhis', 'finScore', 'finCashKind', 'finDebtKind', 'finPenKind', 'finInsKind', 'finEstKind', 'finReqMonthly'].forEach((f) =>
  is(count(new RegExp('function ' + f + '\\(', 'g')) === 1, f + ' 는 한 번'));
const CALLERS = { render: /finCore\(\)/, trCalc: /finCore\(\)/, renderRealEstate: /finCore\(\)/, generate: /finCore\(\)/, plData: /finCore\(\)/, tpD: /finCore\(\)/, rptData: /finCore\(\)/, ipPlan: /finCore\(\)/, renderPensionSim: /finReady\(\)/, renderInherit: /finInherit\(\)/ };
Object.keys(CALLERS).forEach((f) => is(CALLERS[f].test(fnBody(f)), f + ' 가 ' + String(CALLERS[f]).replace(/\\/g, '').slice(1, -1) + ' 을 부른다'));
is((code.match(/function data\(\)\{\s*var C=finCore\(\)/g) || []).length === 2, '최종보고서 · 가이드맵의 data() 두 벌이 finCore 를 그대로 돌려준다');
is(!/function getFinancialSnapshot\(/.test(code), '부르는 곳 없던 사본 getFinancialSnapshot 이 없다');

head('나. 남는 돈 · 준비된 연금 · 연금 부족 식은 finCore 밖에 없나');
const core = fnBody('finCore');
const outside = code.replace(core, '');
is(/surplus=income-fixed-choice-saving/.test(core) && !/\bsurplus\s*=\s*(income|totalIncome|inc|net)\s*-/.test(outside) && !/\brest\s*=\s*inc\s*-/.test(outside), '남는 돈 = 소득 − 지출 − 저축 은 finCore 에만');
is(!/totalPension\s*=\s*(n\(|num\(|nps)/.test(outside) && !/penTotal\s*=\s*nps/.test(outside), '준비된 연금을 다른 곳이 더하지 않는다(finReady)');
is(!/pensionGap\s*=\s*Math\.max\(\s*futureTarget/.test(code) && !/penGap\s*=\s*Math\.max\(\s*fvTarget/.test(code), '연금 부족을 물가 반영 목표로 따로 셈하지 않는다');

head('다. 어림이 돌아오지 않았나');
is(!/gross\s*\/\s*12\s*\)?\s*\*\s*0\.82|monthlyGross\s*\*\s*0\.82|\*\s*0\.82\)\s*\+\s*n\(/.test(code), '세전 × 0.82 로 「세후」 를 어림하지 않는다');
is(!/\*\s*1\.7\)/.test(code), '저축 × 1.7 을 연금이라 하지 않는다');
const four = code.match(/0\.04\s*\/\s*12|\/\s*0\.04\b/g) || [];
is(four.length === 1 && /jeonse\s*\*\s*0\.04\s*\/\s*12/.test(code), '4% 인출 규칙이 없다 — 전세 기회비용(jeonse × 4%) 한 곳만 다른 뜻이라 둡니다');
is(!/gapRet\s*\*\s*0\.35/.test(code), '「부족액 × 0.35 만 더 쌓으면 채워집니다」 가 없다');
is(!/npsGapYears\s*\*\s*0\.8|years\s*\*\s*1\.8\)/.test(code), '국민연금 감소 어림이 finNhis 하나뿐');

head('라. 판정 숫자는 FIN_RULE · IP_RULE 에만');
[[/pensionGap\s*<=\s*150/, '노후 150'], [/inheritTax\s*<\s*5000/, '상속세 5000'], [/cancer\s*>=\s*3000|cancer\s*>=\s*2000|brain\s*>=\s*1000|heart\s*>=\s*1000/, '보장 3000·2000·1000'],
 [/savRate\s*>=\s*25|savRate\s*>=\s*15|saveRatio\s*>=\s*15/, '저축률 25 · 15'], [/\b(insRatio|insRate|ratio)\s*(<=|>=|<|>)\s*\d/, '보험료율 5 · 8 · 12 · 15'],
 [/totalIncome\s*\*\s*0\.12|\/\s*totalIncome\s*>\s*0\.12/, '보험료 0.12'], [/essentialRatio\s*>=\s*(65|55)/, '필수지출 65 · 55']].forEach(([re, m]) =>
  is(!re.test(code), m + ' 이 글자로 없다'));

head('마. 점수식은 finScore 하나');
is(count(/\?18:6/g) === 1 && /\?18:6/.test(fnBody('finScore')), '「남는 돈 18 : 6」 점수식이 finScore 에만');
is(!/score\s*-=/.test(fnBody('trGrade')) && /finScore\(FC\)\.total/.test(fnBody('trGrade')), '종합 재무설계 점수도 finScore');
is(/const healthScore = FSC\.total/.test(code) && !/const scores = \[/.test(code), '대시보드 건전성 점수도 finScore');

head('바. 읽는 칸이 다 있는 칸인가');
const ids = new Set([...raw.matchAll(/id=["']([A-Za-z0-9_\-]+)["']/g)].map((m) => m[1]).concat([...raw.matchAll(/(?:fldG|selG)\('([A-Za-z0-9_]+)'/g)].map((m) => m[1])));
const reads = new Set();
for (const m of code.matchAll(/\b(?:num|val|psN|finNum|finVal|gv|trNum|trVal|v)\('((?:s|ins|inh|r|d)_[A-Za-z0-9_]+)'/g)) reads.add(m[1]);
for (const m of code.matchAll(/(?<![\w.$])n\('([a-z_]+)'\)/g)) reads.add(/^(s|ins|inh|r|d)_/.test(m[1]) ? m[1] : 's_' + m[1]);
const missing = [...reads].filter((r) => !ids.has(r)).sort();
is(reads.size > 50 && !missing.length, '읽는 칸 ' + reads.size + '개가 다 화면에 있다' + (missing.length ? ' — 없는 칸: ' + missing.join(' · ') : ''));
is(!/ins_cancer_diag|'ins_care'/.test(code), '없는 칸 ins_cancer_diag · ins_care 를 읽지 않는다');

head('사. 확인 안 된 연도 주장이 없나 (1번)');
is(!/20\d\d년\s*고갈/.test(code), '「20XX년 고갈」 같은 출처 없는 연도가 없다');

head('아. 죽은 판이 돌아오지 않았나');
is(!/window\.renderContentFirstFinalReport\s*=\s*function|function addInsuranceToFinal\(|function renderFinal\(\)/.test(code), '최종보고서를 그리는 덧칠은 가이드맵(renderFinalMap) 하나');
is(count(/window\.renderInsuranceDashboard\s*=/g) === 1 && !/function getInsEvaluation\(/.test(code), '보험 대시보드를 그리는 자는 renderInsurance 하나');
is(!/function quickTax\(/.test(code) && count(/function finQuickTax\(/g) === 1, '상속세 누진 셈은 finQuickTax 하나(안 불리던 quickTax 두 벌 없음)');

console.log('\n' + (bad ? '✗ ' + bad + '개 어긋남 — 계산기가 한 숫자를 여러 곳에서 셉니다' : '✓ 계산기 숫자는 finCore 한 곳에서 — 사본 · 어림 · 없는 칸 0'));
process.exit(bad ? 1 : 0);
