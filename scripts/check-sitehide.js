/* 🔐 따로 선 두 판이 본 앱 주소로 새지 않나 (판 X527)

   ⚠ 이 구멍은 <b>라이브에서 눈으로 찾았습니다.</b> 루트 netlify.toml 이
     publish="." 라 저장소가 통째로 올라가는데, site-me 를 막는 줄이 아무 데도
     없었습니다. 즉 apex-os-yunpro.netlify.app/site-me/index.html 로 들어가면
     <b>사장님 얼굴과 풀이가 로그인 없이</b> 그대로 열렸습니다.
     문지기(엣지 함수)는 site-me 를 <b>제 뿌리로 삼는 사이트</b>에서만 돕니다 —
     본 앱에서는 한 번도 안 불립니다. 자물쇠를 달아 두고 뒷문을 연 꼴이었습니다 (3번).

   ★ 실제 파일이 있으므로 <b>강제(!)</b>가 아니면 Netlify 는 파일을 그대로 내보냅니다. */
const fs = require('fs');
const bad = [], ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) bad.push(m); };

const src = fs.readFileSync('_redirects', 'utf8');
const lines = src.split('\n').map(l => l.trim()).filter(l => l && l[0] !== '#');

/* 차례가 중요합니다 — 맨 아래 /* 는 무엇이든 받으므로 그보다 위에 있어야 합니다 */
const idxCatchAll = lines.findIndex(l => /^\/\*\s/.test(l));

/* ⚠ 처음엔 「site-me 로 시작하는 아무 줄」 의 자리를 봤습니다. 그래서 /site-me/* 를
   맨 아래로 내려도 바로 위에 남은 /site-me 한 줄이 가려 주어 <b>안 울었습니다</b>.
   줄마다 제 자리를 따로 봅니다 (8번). */
function at(pat) { return lines.findIndex(l => pat.test(l)); }
function closed(folder) {
  const iStar = at(new RegExp('^\\/' + folder + '\\/\\*\\s+\\S+\\s+404!'));
  const iBare = at(new RegExp('^\\/' + folder + '\\s+\\S+\\s+404!'));
  const above = j => j >= 0 && (idxCatchAll < 0 || j < idxCatchAll);
  return { star: iStar >= 0, bare: iBare >= 0, order: above(iStar) && above(iBare) };
}

console.log('\n[1] ★★ 두 판이 본 앱 주소에서 <b>닫혀 있다</b> (3번)');
for (const f of ['site-me', 'site-saju']) {
  const exists = fs.existsSync(f + '/index.html');
  ok(exists, f + '/index.html 이 저장소에 있다 — 그래서 막는 줄이 필요하다');
  const c = closed(f);
  ok(c.star, '★★ /' + f + '/* 가 <b>강제 404</b> 다' +
     (c.star ? '' : '\n      ← 없으면 그 주소로 파일이 그대로 나갑니다. 404! 의 <b>!</b> 가 없으면 실제 파일이 이깁니다'));
  ok(c.bare, '/' + f + ' (슬래시 없이) 도 막혀 있다');
  ok(c.order, '막는 <b>두 줄이 다</b> 맨 아래 /* 보다 위에 있다 — 아래 있으면 영영 안 닿습니다');
}

console.log('\n[2] ★ 루트가 저장소를 통째로 올린다는 것을 잊지 않는다');
const toml = fs.readFileSync('netlify.toml', 'utf8');
const pub = (toml.match(/publish\s*=\s*"([^"]*)"/) || [])[1];
ok(pub === '.', '루트 publish 가 "." 이다 — ' + pub +
   (pub === '.' ? ' (그래서 위 막음이 반드시 있어야 합니다)' : '\n      ← 바뀌었다면 이 자의 전제가 달라졌습니다. 다시 보십시오'));

console.log('\n──────────────────────────────');
if (bad.length) { console.log('새는 자리 점검 실패 — ' + bad.length + '가지 어긋납니다.'); process.exit(1); }
console.log('따로 선 두 판은 본 앱 주소에서 닫혀 있습니다.');
