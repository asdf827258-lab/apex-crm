/* 🕯️ 혼자 서는 사주 풀이 사이트를 다시 만든다.

   사장님 말씀 2026-11-20 「배포 말고 이것만 따로 사용하려고 한다구요!」
   → 고르신 것 ㉯ 「따로 주소 하나 더」.

   ⚠ 여기가 CLAUDE.md 5번(같은 것을 두 곳에 두지 않는다)과 부딪히는
     자리입니다. Netlify 는 올릴 폴더를 하나 가리키므로 그 폴더 안에
     파일이 <b>있어야</b> 합니다 — 가리키기로는 안 됩니다.
   ★ 그래서 <b>베끼되, 갈라지면 빨간불이 켜지게</b> 했습니다. 임자는
     언제나 app/saju-mbti.html 하나이고, site-saju/index.html 은 그
     그림자입니다. check-sajusite 가 둘을 바이트로 견줍니다.

     고친 뒤에는 이것을 돌리십시오 —  node scripts/mk-sajusite.js       */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const SRC = 'app/saju-mbti.html', DST = 'site-saju/index.html';
const sha = b => crypto.createHash('sha256').update(b).digest('hex').slice(0, 12);

/* ★★ 올리는 판은 <b>고객 화면으로 못 박습니다</b> (사장님 말씀 2026-11-20
     「아니 내것만 먼저 볼수 있도록 해줘야지」).
   ⚠ 앱의 기본값은 var GUEST={on:false} 라 <b>설계사 화면</b>입니다. 그대로
     올리면 주소를 받은 사람이 「영업 가능성 · 나의 영업법 · 면담 브리프」 를
     그대로 봅니다 — 고객에게 보일 글이 아닙니다.
   ★ GUEST.on 을 켜면 setView 가 언제나 client 로 되돌리고, 설계사 전용 칸
     여덟이 주소로 억지로 열어도 막힙니다(AGENT_TABS · 각 tab 함수의 빗장).
   ★ 바꾸는 줄은 <b>이 한 줄뿐</b>입니다. check-sajusite 가 같은 바꿈을 다시
     적용해 견주므로, 다른 데가 갈라지면 그대로 빨간불입니다 (5번).        */
const GUEST_OFF = 'var GUEST={on:false};';
const GUEST_ON  = 'var GUEST={on:true};';   /* 올리는 판 — 고객 화면 고정 */
function toSite(buf) {
  const t = buf.toString('utf8');
  const n = t.split(GUEST_OFF).length - 1;
  if (n !== 1) { console.error('✗ ' + GUEST_OFF + ' 가 ' + n + '곳입니다 — 한 곳이어야 합니다'); process.exit(2); }
  return Buffer.from(t.replace(GUEST_OFF, GUEST_ON), 'utf8');
}

const src = toSite(fs.readFileSync(SRC));
if (fs.existsSync(DST) && sha(fs.readFileSync(DST)) === sha(src)) {
  console.log('그대로입니다 — 고칠 것이 없습니다 (' + sha(src) + ')');
  process.exit(0);
}
if (process.argv.indexOf('--write') < 0) {
  console.log('달라졌습니다. --write 를 붙이면 씁니다.');
  console.log('  ' + SRC + ' (고객 고정 적용) ' + sha(src));
  console.log('  ' + DST + '  ' + (fs.existsSync(DST) ? sha(fs.readFileSync(DST)) : '(없음)'));
  process.exit(1);
}
fs.mkdirSync(path.dirname(DST), { recursive: true });
fs.writeFileSync(DST, src);
console.log('썼습니다 — ' + DST + ' (' + Math.round(src.length / 1024) + 'KB · ' + sha(src) + ')');
