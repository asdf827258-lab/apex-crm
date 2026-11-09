/* 📥 <b>상품전략기 자료함</b> — 판 X384 · 사장님 말씀 2026-11-09
   「우리 메인세션 crm 어플에다가, 넣어서 할순 없을까? 내가 넣으면 복사본을 너가
   장소 모아두는 곳에 복사해서 사본을 만들고 저장하여 공유토록」

   몸은 app/insight-inbox.js · index.html 엔 script 한 줄. 가져가기는 사장님 PC 의
   pull_sources.py → edge insight-pull(가져가면 서버 사본 삭제 · 사장님 결정).

   ── 보는 것 ─────────────────────────────────────────────────
     [1] 자리 — index.html 에 script 한 줄 · 덮개(#insightScreen .fin-float)가 있다
     [2] ES5 — let/const/=>/`…` 없음 (index.html 과 같은 규칙 · 6번)
     [3] 저장 — 저장 칸 insight-src · 영문 주소(월/시각_지문.pdf) · 지문(SHA-256) 중복 막기
     [4] 안전 — 개인정보 경고 · 가져간 뒤엔 「열기」 없음(9번) · 되풀이 호출 없음(7번)
     [5] 손 — 누르는 줄 44px · 13px 밑 글씨 없음
   브라우저를 안 띄웁니다.                                                       */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);

const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const JS = fs.readFileSync(path.join(ROOT, 'app/insight-inbox.js'), 'utf8');
const CODE = JS.replace(/\/\*[\s\S]*?\*\//g, '');

sec('[1] 자리');
const tags = IDX.match(/<script src="insight-inbox\.js[^"]*"><\/script>/g) || [];
is(tags.length === 1, 'index.html 에 insight-inbox.js script 가 한 줄 (' + tags.length + ')');
is(/<div id="insightScreen">[\s\S]{0,400}class="fin-float"/.test(IDX), '상품전략기 덮개에 fin-float 가 있다 — 단추가 붙을 자리');
is(/#insightScreen \.fin-float/.test(CODE), '자료함이 그 자리를 찾아 붙는다');

sec('[2] ES5');
is(!/\b(let|const)\s/.test(CODE), 'let/const 없음');
is(!/=>/.test(CODE), '화살표 함수 없음');
is(!/`/.test(CODE), '템플릿 문자열 없음');

sec('[3] 저장');
is(/IIB_BUCKET='insight-src'/.test(CODE), '저장 칸 insight-src');
is(/month\+'\/'\+Date\.now\(\)\+'_'\+/.test(CODE) && /'\.pdf'/.test(CODE), '저장 칸 주소는 영문 — 월/시각_지문.pdf (한글 이름은 목록에만)');
is(!/storage_path\s*:\s*[^,]*file\.name/.test(CODE), '파일 이름을 저장 칸 주소에 넣지 않는다');
is(/crypto\.subtle\.digest\('SHA-256'/.test(CODE) && /\.eq\('checksum',sum\)/.test(CODE), '바이트 지문으로 같은 파일을 두 번 안 받는다 (5-1번)');
is(/이미 올라온 파일과 같아요 \('/.test(CODE), '무엇과 겹쳤는지 말한다 (누가 · 언제)');
is(/remove\(\[path\]\)/.test(CODE), '목록에 못 적으면 방금 올린 사본을 치운다 (고아 방지)');

sec('[4] 안전');
is(/고객 서류·개인정보가 든 PDF는 넣지 마세요/.test(JS), '개인정보 경고가 선다');
is(/if\(!r\.pulled_at\)\{[^}]*iibView/.test(CODE), '「열기」는 가져가기 전에만 — 가져가면 서버 사본이 지워진다 (9번)');
is(!/setInterval|setTimeout\(\s*iibLoad/.test(CODE), '되풀이 호출 없음 — 자료함을 열 때 한 번 (7번)');
is(/\.limit\(60\)/.test(CODE), '목록은 60줄까지만 받는다');

sec('[5] 손');
const tooSmall = (CODE.match(/font-size:\s*(\d+(?:\.\d+)?)px/g) || []).filter((m) => parseFloat(m.replace(/\D+/, '')) < 13);
is(!tooSmall.length, '13px 밑 글씨 없음 ' + (tooSmall.join(' ') || ''));
['iib-x', 'iib-seg button', 'iib-in', 'iib-btn'].forEach((k) => {
  const re = new RegExp('\\.' + k.replace(' ', ' ') + '\\{[^}]*(min-height:44px|height:44px)');
  is(re.test(CODE), '.' + k + ' 누르는 줄 44px');
});

console.log(bad ? '\n✗ ' + bad + '개 실패' : '\n✓ 상품전략기 자료함 이상 없음');
process.exit(bad ? 1 : 0);
