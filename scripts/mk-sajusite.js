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

const src = fs.readFileSync(SRC);
if (fs.existsSync(DST) && sha(fs.readFileSync(DST)) === sha(src)) {
  console.log('그대로입니다 — 고칠 것이 없습니다 (' + sha(src) + ')');
  process.exit(0);
}
if (process.argv.indexOf('--write') < 0) {
  console.log('달라졌습니다. --write 를 붙이면 씁니다.');
  console.log('  ' + SRC + '  ' + sha(src));
  console.log('  ' + DST + '  ' + (fs.existsSync(DST) ? sha(fs.readFileSync(DST)) : '(없음)'));
  process.exit(1);
}
fs.mkdirSync(path.dirname(DST), { recursive: true });
fs.writeFileSync(DST, src);
console.log('썼습니다 — ' + DST + ' (' + Math.round(src.length / 1024) + 'KB · ' + sha(src) + ')');
