/* <b>임시 진단</b> — 공지 확인 점검이 CI 에서만 빨갛다.

   `run-checks.js` 는 빨간 점검의 <b>마지막 40줄만</b> 찍습니다. 그런데
   `check-noticeack` 의 실패는 <b>앞쪽 절</b>에 있어 화면에 안 나옵니다.
   로컬에서는 16판을 돌려도(부하 · CPU 20배 지연 · 가짜 서버 지연 ·
   CI 와 같은 playwright 1.49.1/Chromium 131 · git 체크아웃 · shard 통째)
   한 번도 안 납니다.

   <b>한 판에서 갈렸습니다.</b> 같은 CI 한 판 안에서 [18]번으로 곧장 돈
   것은 <b>✗2개</b>, 50초 뒤 이 껍데기가 부른 것은 <b>초록</b>이었습니다.
   그러니 고정된 자리가 아니라 <b>들쭉날쭉한 자리</b>입니다.

   그래서 <b>여러 판 돌려 빨간 판이 나오면 그 판의 ✗ 줄만</b> 찍습니다.
   전부 초록이면 한 줄만 적고 넘어갑니다 — 헛것을 잡지 않습니다 (8번).
   <b>원인을 보면 지웁니다</b> — 이 파일도, checks.tsv 의 그 한 줄도.   */
const { execFileSync } = require('child_process');
const N = 4;
for (let i = 1; i <= N; i++) {
  let out = '', code = 0;
  try {
    out = execFileSync('node', ['scripts/check-noticeack.js'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { out = String((e.stdout || '') + (e.stderr || '')); code = e.status == null ? 1 : e.status; }
  if (code !== 0) {
    const L = out.split('\n');
    console.log('── ' + i + '판째에 빨간불. 그 판의 절 머리와 ✗ 줄 ──');
    L.forEach((l, k) => {
      if (/^\[/.test(l)) console.log(l);
      if (/✗/.test(l)) { console.log('  ← ' + (L[k - 1] || '').trim()); console.log(l); }
    });
    console.log('── ' + N + '판 중 ' + i + '판째 ──');
    process.exit(1);
  }
}
console.log('── ' + N + '판 모두 초록 (이 판에서는 안 났습니다) ──');
