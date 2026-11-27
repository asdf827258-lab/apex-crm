/* 🧭💰 상품전략기 → 한장 보험료 비교 → 설계 초안 (판 X588 · 사장님 말씀 2026-11-27
   「이 한장 보험료비교와, 상품전략기 궁합을 통해서 설계안부터 금액까지 짜보는건 어떨까?」 → 「응 1단계 여기서 바로 시작해」)

   상품 서랍(과 🎣 문 열기 대본 카드)에서 「💰 이 조건으로 금액 보기」를 누르면
   한장비교(apex-hb-onecompare)가 그 상품 조건(손보/생보 · 상품유형 · 20년/100세 · 담보 묶음 금액)으로 바로 조회하고
   「📝 설계 초안」(소식지 상품 회사 · 같은 구성 최저가 · 약관 근거)을 띄운다. 한장비교 쪽 코드는 사장님 PC 간편설계\_deploy\one.js.

   지키는 것
     1. 주소에 싣는 건 나이·성별·상품 정보뿐 — 고객 이름·생년월일 칸이 없다
     2. 금액은 회사 한장비교 숫자 — 「설계사용 · 고객에게 보여 주지 마세요」를 카드가 말한다
     3. 종신·연금·달러·기타는 회사 한장비교에 없으니 카드가 서지 않는다
     4. 약관 근거는 원문 대조 ✓ 줄만 싣는다
     5. B안(보장 넓게)은 한장비교 B_CORE 와 같은 규칙 — 카드에 A안·B안 구성을 나란히 (판 X593)
   node scripts/check-insightoc.js */
'use strict';
const fs = require('fs'), path = require('path');
const S = fs.readFileSync(path.join(__dirname, '..', 'app/insight/index.html'), 'utf8');
let bad = 0;
const is = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) bad++; };

const blk = (S.match(/const OC_URL = [\s\S]*?\nfunction ocFrom\([^\n]*\n/) || [''])[0];
is(!!blk, '💰 묶음이 있다 (OC_URL … ocFrom)');
is(/const OC_URL = 'https:\/\/apex-hb-onecompare\.netlify\.app\/'/.test(blk), '한장비교 주소는 apex-hb-onecompare 한 곳');
is(/from: 'insight'/.test(blk) && /age: OC\.age, sex: OC\.sex/.test(blk), '주소에 나이·성별');
is(!/birth|생년|cust|name:/.test(blk.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')), '<1> 주소에 이름·생년월일 칸이 없다');
is(/고객에게 보여 주지 마세요/.test(blk), '<2> 「설계사용 · 고객에게 보여 주지 마세요」');
is(/if \(!\/\^\(cancer\|health\|brainheart\|simple\|care\|kids\|driver\)\$\/\.test\(cat\)\) return null;/.test(blk), '<3> 종신·연금·달러·기타는 카드 없음');
is(/r\.vf && r\.vf\.ok \?/.test(blk), '<4> 약관 근거는 원문 대조 ✓ 줄만');
is(/window\.open\(u, '_blank', 'noopener'\)/.test(blk), '새 창(noopener)으로 연다');
is(/\n  h \+= ocCardHTML\(p\);\r?\n/.test(S), '상품 서랍(openP)에 💰 카드');
is(/ocPlan\(n\.p\) \? `<button class="btn g" onclick="ocFrom\('\$\{n\.p\.id\}'\)">💰 금액 보기<\/button>`/.test(S), '🎣 문 열기 대본 카드에 「💰 금액 보기」');
is(/localStorage\.setItem\('apexOcPick'/.test(blk) && !/sessionStorage|fetch\(/.test(blk), '고른 성별·나이만 이 기기에 기억 — 서버는 안 부른다');

is(blk.includes("const OC_B = [['cancer_diag', 3000], ['cancer_main', 2000], ['brain', 1000], ['heart', 1000], ['surgery', 0], ['nsurg', 0]];"), '<5> B안 규칙 = 한장비교 B_CORE 그대로 (수술은 0 = 회사 기본 가입금액 · 판 X593)');
is(/B안 · 보장 넓게/.test(blk) && /A안 · 이 상품 담보/.test(blk), '<5> 💰 카드에 A안·B안 구성이 나란히');
is(blk.includes("if (!/^(cancer|health|brainheart|simple)$/.test(p.category)) return [];"), '<5> B안은 암·건강·뇌심·간편 상품만 (치매·어린이·운전자는 A안만)');
console.log(bad ? `\n✗ ${bad}건 실패` : '\n✓ 전부 통과');
process.exit(bad ? 1 : 0);
