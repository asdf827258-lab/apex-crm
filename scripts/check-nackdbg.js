/* <b>임시 진단</b> — 공지 확인 점검이 CI 에서만 빨갛다.

   `run-checks.js` 는 빨간 점검의 <b>마지막 40줄만</b> 찍습니다. 그런데
   `check-noticeack` 의 실패는 <b>앞쪽 절</b>에 있어 화면에 안 나옵니다.
   로컬에서는 16판을 돌려도(부하·CPU 20배 지연·CI 와 같은 playwright
   1.49.1·깨끗한 체크아웃) 한 번도 안 납니다.

   그래서 <b>같은 점검을 그대로 돌리고 앞 45줄만</b> 찍습니다. 판정은
   안쪽 점검 것을 그대로 물려받습니다 — 여기서 새로 판단하지 않습니다.
   <b>원인을 보면 지웁니다.</b> 이 파일도, checks.tsv 의 그 한 줄도.     */
const { execFileSync } = require('child_process');
let out = '', code = 0;
try {
  out = execFileSync('node', ['scripts/check-noticeack.js'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
} catch (e) { out = String((e.stdout || '') + (e.stderr || '')); code = e.status == null ? 1 : e.status; }
const lines = out.split('\n');
console.log('── 앞 45줄 (전체 ' + lines.length + '줄) ──');
lines.slice(0, 45).forEach(l => console.log(l));
console.log('── 안쪽 점검 판정: ' + (code === 0 ? '초록' : '빨강(' + code + ')') + ' ──');
process.exit(code);
