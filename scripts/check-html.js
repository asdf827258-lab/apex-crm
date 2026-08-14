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

  /* 통짜 자바스크립트 파일은 <script> 태그가 없다. 그냥 통째로 본다.
     이걸 안 하면 「스크립트 0개 정상」 이라고 나와서 검사한 척이 된다. */
  if (/\.[cm]?js$/i.test(file)) {
    try {
      new vm.Script(html, { filename: file });
      console.log('✓ ' + file + ' — 자바스크립트 파일 정상');
    } catch (e) {
      failed++;
      console.log('✗ ' + file + ' — 자바스크립트 파일');
      console.log('    ' + e.message);
    }
    continue;
  }

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

  /* ── 같은 이름의 함수를 두 번 만들지 않았는가 ──────────────────
     이 파일은 통짜라 이름이 겹쳐도 아무 말 없이 넘어간다.
     자바스크립트는 <b>나중에 쓴 것이 이긴다.</b> 그래서 화면은 뜨는데
     엉뚱한 것이 그려진다. 문법 검사로는 절대 안 잡힌다.

     실제로 이렇게 당했다.
       prNum      — 숫자에 쉼표 찍는 함수 위에 입력칸 만드는 함수를 얹어
                    「국가혜택·근거」 화면에 입력칸 31개가 튀어나왔다
       prWon      — 「1,200만원」 을 만드는 함수가 쉼표만 찍는 함수에 가려져
                    치료비 표 금액이 전부 0 으로 찍혔다
       prDeckHtml — 상담 이야기 목록이 제안서 슬라이드에 가려져 안 나왔다

     다만 <b>서로 다른 우리(IIFE)</b> 안에 같은 이름이 있는 것은 충돌이
     아니다. 파일 전체를 한 덩어리로 보면 멀쩡한 것을 두고 「깨졌다」고
     말하게 되고, 그런 헛경고가 몇 번 뜨면 사람이 이 검사를 안 믿는다.
     그래서 우리 단위로 나눠서 센다.                                */
  const seen = {}, dup = [];
  let scope = 0, depth = 0;
  html.split('\n').forEach(line => {
    /* 이 저장소는 IIFE 를 줄 맨 앞에서 열고 닫는다 — 그 모양만 센다 */
    if (/^\(\s*(function|\(\s*\)\s*=>)/.test(line)) { depth++; scope++; return; }
    if (/^\}\s*\)\s*\(\s*\)\s*;?\s*$/.test(line) || /^\}\s*\(\s*\)\s*\)\s*;?\s*$/.test(line)) {
      if (depth > 0) depth--;
      return;
    }
    const m = /^function\s+([A-Za-z_$][\w$]*)\s*\(/.exec(line);
    if (!m) return;
    const key = (depth > 0 ? 's' + scope + ':' : '') + m[1];
    seen[key] = (seen[key] || 0) + 1;
  });
  Object.keys(seen).forEach(k => {
    if (seen[k] > 1) dup.push(k.replace(/^s\d+:/, '') + ' ×' + seen[k]);
  });
  if (dup.length) {
    bad++;
    console.log('✗ ' + file + ' — 같은 이름의 함수가 두 번 있습니다: ' + dup.join(', '));
    console.log('    나중에 쓴 것이 이깁니다. 앞의 것을 부르던 자리가 조용히 망가집니다.');
  }

  if (bad) { failed++; }
  else console.log('✓ ' + file + ' — 실행되는 스크립트 ' + n + '개 모두 정상 (' + skipped +
    '개는 데이터/외부라 건너뜀) · 함수 ' + Object.keys(seen).length + '개 이름 안 겹침');
}

if (failed) {
  console.log('\n문법이 깨진 파일이 ' + failed + '개 있습니다. 이대로 배포하면 화면이 뜨지 않습니다.');
  process.exit(1);
}
console.log('\n문법 검사 통과');
