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
     ※ 계산기에서 단추를 눌러 실제로 열어 보는 것은 check-reportweb.js 가 합니다(브라우저 갈래).

   되돌려 보기 —
     · RULE.irpEarly 를 0.7 → 0.75 로 → 가 · 나 가 웁니다
     · @media print 에 font-feature-settings:"tnum" 을 넣으면 → 라 가 웁니다
     · rptData 의 rptMask(raw) 를 raw 로 → 아 가 웁니다
     · rptPension 에서 rows 를 빼면(엔진 식으로 다시 세면) → 아 가 웁니다
     · 비과세 쪽지를 「비과세는 가입하면 적용돼요」 로 → 마 가 웁니다                          */
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
is((text.match(/(\d\d) (최종 제안|수익률별|얻게 되는|핵심 이슈|참고|왜 이렇게|일정|한눈에)/g) || []).every((m, i, a) => i === 0 || +m.slice(0, 2) === +a[i - 1].slice(0, 2) + 1), '장 번호가 01부터 하나씩 늘어난다');
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

head('아. 계산기 — 이름을 가린 채 내보내나 (3번)');
const fin = fs.readFileSync(path.join(ROOT, 'app', 'finance.html'), 'utf8');
is(/<script src="apex_report_engine\.js"><\/script>/.test(fin) && /<script src="apex_report_icons\.js"><\/script>/.test(fin), '엔진·아이콘을 <script src> 한 줄씩으로 싣는다');
is((fin.match(/onclick="rptPanel\(\)"/g) || []).length >= 1, '「고객 결과지」 단추가 있다');
is(/name=opt\.real&&raw&&raw!=='고객님'\? raw : rptMask\(raw\)/.test(fin), '실명은 opt.real 일 때만 — 기본은 rptMask');
is(/confirm\('카톡으로 나가는 파일에 고객 실명이 들어갑니다/.test(fin), '실명을 켜면 한 번 더 묻는다');
is(/openAge:rage, rows:rows,/.test(fin) && /PENSION\.calc\(p,inp\)/.test(fin), '연금은 상품 엔진(PENSION)이 센 줄을 넘긴다 — 엔진 식으로 다시 세지 않는다');

console.log('\n' + (bad ? '✗ ' + bad + '개 어긋남 — 고객 결과지를 믿을 수 없습니다' : '✓ 고객 결과지 — 계산·순서·세금 문구·이름 가리기가 맞습니다'));
process.exit(bad ? 1 : 0);
