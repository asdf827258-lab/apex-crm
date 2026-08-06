/* 화면 파일 안의 자바스크립트가 문법상 깨지지 않았는지 본다.
   이 파일들은 통째로 한 덩어리라, 한 글자만 틀려도 화면 전체가 안 뜬다.
   배포 전에 여기서 걸러낸다. */
const fs = require('fs');
const vm = require('vm');

const files = process.argv.slice(2);
if (!files.length) {
  console.error('검사할 파일을 지정하세요. 예: node scripts/check-html.js app/index.html');
  process.exit(2);
}

let failed = 0;

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log('✗ ' + file + ' — 파일이 없습니다');
    failed++;
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m, n = 0, bad = 0, skipped = 0;

  while ((m = re.exec(html))) {
    const attrs = m[1] || '', src = m[2];
    if (/\bsrc\s*=/.test(attrs)) { skipped++; continue; }          /* 밖에서 받아오는 것 */
    const tm = attrs.match(/type\s*=\s*["']?([^"'\s>]+)/i);
    const type = tm ? tm[1].toLowerCase() : '';
    if (type && type !== 'text/javascript' && type !== 'module' && type !== 'application/javascript') {
      skipped++; continue;                                          /* 자바스크립트가 아닌 데이터 덩어리 */
    }
    if (!src.trim()) continue;
    n++;
    try {
      new vm.Script(src, { filename: file + '#inline' + n });
    } catch (e) {
      bad++;
      const line = html.slice(0, m.index).split('\n').length;
      console.log('✗ ' + file + ' — ' + n + '번째 스크립트 (HTML ' + line + '번째 줄 부근)');
      console.log('    ' + e.message);
    }
  }

  if (bad) { failed++; }
  else console.log('✓ ' + file + ' — 실행되는 스크립트 ' + n + '개 모두 정상 (' + skipped + '개는 데이터/외부라 건너뜀)');
}

if (failed) {
  console.log('\n문법이 깨진 파일이 ' + failed + '개 있습니다. 이대로 배포하면 화면이 뜨지 않습니다.');
  process.exit(1);
}
console.log('\n문법 검사 통과');
