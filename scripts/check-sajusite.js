/* 🕯️ 혼자 서는 사주 풀이 사이트 — 그림자가 안 늙었나 (판 X514)

   사장님 말씀 2026-11-20 「배포 말고 이것만 따로 사용하려고 한다구요!」
   → 고르신 것 ㉯ 「따로 주소 하나 더」.

   ⚠ 이 자가 왜 있나 — CLAUDE.md 5번이 제일 많이 터지던 자리를 제가
     <b>일부러 하나 더 만들었기 때문</b>입니다. Netlify 는 올릴 폴더를
     가리키므로 site-saju/ 안에 파일이 있어야 하고, 그래서 같은 화면이
     저장소에 두 벌이 됩니다. 두 벌이 되면 <b>한쪽만 고쳐지고 아무도
     모릅니다</b> — FP_MAP·TOFIN_MAP 이 그랬습니다.
   ★ 그래서 바이트로 견줍니다. 한 글자라도 다르면 빨간불이고,
     고치는 길(node scripts/mk-sajusite.js --write)을 같이 찍습니다.
   ★ 임자는 언제나 app/saju-mbti.html 입니다. site-saju/index.html 은
     그림자이고, 그림자를 직접 고치면 다음에 이 자가 덮어쓰라고 합니다. */
const fs = require('fs'), crypto = require('crypto');
const bad = [], ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) bad.push(m); };
const sha = b => crypto.createHash('sha256').update(b).digest('hex').slice(0, 12);
const SRC = 'app/saju-mbti.html', DST = 'site-saju/index.html';

/* ★ 바꾸는 줄은 이 하나뿐입니다 — mk-sajusite.js 와 <b>같은 글</b>을 둡니다.
   여기서 또 적는 것이 꺼림칙하지만(5번), 자가 만드는 쪽을 불러 쓰면
   만드는 쪽이 망가져도 같이 망가져 <b>둘 다 조용해집니다</b>. 자는 제 눈으로
   봅니다. 대신 글이 갈라지면 아래 [1] 이 바로 웁니다. */
const GUEST_OFF = 'var GUEST={on:false};';
const GUEST_ON  = 'var GUEST={on:true};';

console.log('\n[1] ★★ 그림자가 <b>임자와 한 줄만 다르다</b> (5번)');
const hasSrc = fs.existsSync(SRC), hasDst = fs.existsSync(DST);
ok(hasSrc, '임자가 있다 — ' + SRC);
ok(hasDst, '그림자가 있다 — ' + DST);
if (hasSrc && hasDst) {
  const a = fs.readFileSync(SRC), b = fs.readFileSync(DST);
  const want = Buffer.from(a.toString('utf8').replace(GUEST_OFF, GUEST_ON), 'utf8');
  ok(sha(want) === sha(b),
    '★★ <b>그 한 줄 말고는 바이트로 같다</b> — 바라는 것 ' + sha(want) + ' / 그림자 ' + sha(b) +
    (sha(want) === sha(b) ? '' : '\n      ← <b>갈라졌습니다.</b> node scripts/mk-sajusite.js --write 로 맞추십시오'));
  ok(a.length > 200000, '빈 껍데기가 아니다 — ' + Math.round(a.length / 1024) + 'KB (이 자가 헛도는 것을 막습니다 · 8번)');
}

console.log('\n[1-2] ★★ 올리는 판이 <b>고객 화면으로 못 박혀 있다</b>');
/* ⚠ 사장님 말씀 2026-11-20 「아니 내것만 먼저 볼수 있도록 해줘야지」.
   앱 기본값은 설계사 화면이라, 그대로 올리면 주소를 받은 사람이
   「영업 가능성 · 나의 영업법 · 면담 브리프」 를 그대로 봅니다. */
if (hasSrc && hasDst) {
  const a = fs.readFileSync(SRC, 'utf8'), b = fs.readFileSync(DST, 'utf8');
  ok(a.split(GUEST_OFF).length - 1 === 1,
    '임자는 <b>설계사 화면이 기본</b>이다 — 사장님은 앱·파일에서 그대로 쓰십니다');
  ok(b.split(GUEST_ON).length - 1 === 1 && b.indexOf(GUEST_OFF) < 0,
    '★★ 올리는 판은 <b>GUEST.on 이 켜져 있다</b> — 주소를 받은 사람은 고객 화면만 봅니다');
  /* 켜 두면 정말 막히는가 — 빗장이 코드에 살아 있는지도 같이 봅니다 */
  ok(/function setView\(v\)\{if\(GUEST\.on\)v='client';/.test(b),
    '  setView 가 <b>언제나 client 로 되돌린다</b> (단추로도 못 넘어갑니다)');
  ok((b.match(/이 화면은 설계사 전용입니다/g) || []).length >= 8,
    '  설계사 전용 칸 여덟이 <b>주소로 억지로 열어도 막힌다</b> — 빗장 ' +
    (b.match(/이 화면은 설계사 전용입니다/g) || []).length + '개');
}

console.log('\n[2] ★ 따로 선 자리에서도 <b>서버 쓰는 둘이 산다</b>');
/* 화면 안 주소가 상대 경로(/api/...)라, 따로 세우면 그 자리에 함수가 없습니다.
   넘겨받기(proxy) 규칙이 그것을 본 앱으로 보냅니다. */
const RD = 'site-saju/_redirects';
const rd = fs.existsSync(RD) ? fs.readFileSync(RD, 'utf8') : '';
ok(!!rd, '올릴 폴더에 _redirects 가 있다');
ok(/^\/api\/\*\s+https:\/\/\S+\/api\/:splat\s+200\b/m.test(rd),
  '★★ <b>/api/* 를 본 앱으로 넘긴다</b> (200) — 채용 제출 · 결제 확인이 404 가 안 됩니다');
const app = fs.existsSync(SRC) ? fs.readFileSync(SRC, 'utf8') : '';
const apis = (app.match(/'(\/api\/[a-z-]+)'/g) || []).map(x => x.replace(/'/g, ''));
ok(apis.length >= 2 && apis.every(u => /^\/api\//.test(u)),
  '  화면이 부르는 서버 자리가 모두 /api/ 로 시작한다 — ' + [...new Set(apis)].join(' · ') +
  ' (딴 꼴이 생기면 위 규칙이 못 덮습니다)');
ok(/^\/\*\s+\/index\.html\s+200\b/m.test(rd), '주소를 잘못 쳐도 사주 풀이로 온다');

console.log('\n[3] ★ 검색에 안 올린다 — 본부 이름이 적힌 상담 도구입니다 (3번)');
const RB = 'site-saju/robots.txt';
const rb = fs.existsSync(RB) ? fs.readFileSync(RB, 'utf8') : '';
ok(/User-agent:\s*\*/i.test(rb) && /Disallow:\s*\//.test(rb),
  'robots.txt 가 <b>통째로 막는다</b>' + (rb ? '' : ' ← 없습니다'));

console.log('\n[4] ★ 올릴 폴더에 <b>딴 것이 안 섞였다</b>');
const files = fs.existsSync('site-saju') ? fs.readdirSync('site-saju').sort() : [];
ok(files.join(' ') === '_redirects index.html robots.txt',
  '세 파일뿐이다 — ' + (files.join(' ') || '(빈 폴더)') +
  ' (고객 자료나 약관이 섞여 올라가면 안 됩니다 · 9번)');

console.log('\n[5] ★ 바깥에서 <b>아무것도 안 받아 온다</b> — 인터넷 없이도 열립니다');
if (hasDst) {
  const t = fs.readFileSync(DST, 'utf8');
  const out = (t.match(/(?:src|href)="https?:\/\/[^"]+"/g) || [])
    .filter(x => !/^href="https?:\/\/[^"]*"$/.test('') );
  ok(out.length === 0, '글에 박힌 바깥 주소가 <b>0개</b>' + (out.length ? (' ← ' + out.slice(0, 3).join(' · ')) : ''));
  ok(!/@import/.test(t), '@import 로 끌어오는 것도 없다');
}

console.log('\n──────────────────────────────');
if (bad.length) { console.log('혼자 서는 사주 사이트 점검 실패 — ' + bad.length + '가지 어긋납니다.'); process.exit(1); }
console.log('혼자 서는 사주 사이트가 임자와 같고, 따로 서도 성합니다.');
