/* 🧭 나만 보는 판 — 내 사주 · 보험 일 (한 파일)

   사장님 말씀 2026-11-20 「그냥 내 사주만 보는거야. 보험과의 어떻게
   궁합이 좋은지, 일은 어떻게 풀어나갈지 말이야」.

   임자는 app/saju-mbti.html 하나입니다. 여기서는 <b>한 줄만</b> 바꿔
   내보냅니다 — MEONLY 를 켜면 탭이 넷(내 네 기둥 · 보험 일과 나 ·
   일 푸는 방식 · 올해·내년)만 서고, 고객 칸·채용 칸·손님용 링크가
   통째로 사라집니다.
   ⚠ site-saju(고객용)와 헷갈리지 마십시오 — 그쪽은 GUEST 를 켜고,
     이쪽은 MEONLY 를 켭니다. 둘 다 같은 임자에서 나옵니다 (5번).

     고친 뒤에는 이것을 돌리십시오 —  node scripts/mk-mesaju.js --write */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const SRC = 'app/saju-mbti.html', DST = 'site-me/index.html';
const sha = b => crypto.createHash('sha256').update(b).digest('hex').slice(0, 12);
const ME_OFF = 'var MEONLY={on:false};';
const ME_ON  = 'var MEONLY={on:true};';

function toMe(buf) {
  const t = buf.toString('utf8');
  const n = t.split(ME_OFF).length - 1;
  if (n !== 1) { console.error('✗ ' + ME_OFF + ' 가 ' + n + '곳입니다 — 한 곳이어야 합니다'); process.exit(2); }
  return Buffer.from(t.replace(ME_OFF, ME_ON), 'utf8');
}
const src = toMe(fs.readFileSync(SRC));
if (fs.existsSync(DST) && sha(fs.readFileSync(DST)) === sha(src)) {
  console.log('그대로입니다 — 고칠 것이 없습니다 (' + sha(src) + ')');
  process.exit(0);
}
if (process.argv.indexOf('--write') < 0) {
  console.log('달라졌습니다. --write 를 붙이면 씁니다.');
  console.log('  ' + SRC + ' (나만 보기 적용) ' + sha(src));
  console.log('  ' + DST + '  ' + (fs.existsSync(DST) ? sha(fs.readFileSync(DST)) : '(없음)'));
  process.exit(1);
}
fs.mkdirSync(path.dirname(DST), { recursive: true });
fs.writeFileSync(DST, src);
console.log('썼습니다 — ' + DST + ' (' + Math.round(src.length / 1024) + 'KB · ' + sha(src) + ')');
