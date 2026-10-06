/* ══════════════════════════════════════════════════════════════════
   check-namerule.js — <b>「toss」 가 어느 토스인지 이름이 말하나.</b>

   사장님 말씀 (2026-09-24) — 「<b>브랜치·파일 이름에 toss 를 쓰지
   마십시오(토스페이먼츠와 부딪힙니다)</b>」.

   ── 왜 이 자를 세웠나 ─────────────────────────────────────────────
   이 말씀은 2026-10-06 까지 <b>아무도 안 재고 있었습니다.</b> 말씀대장의
   세 눈금 중 「<b>재는 자 없는 말씀</b>」 에 S09 로 올라 있었습니다 (0-1번).
   「앞으로 새로 만들 때만 피하면 됩니다」 라고 적어 두었는데, <b>적어 둔
   규칙은 규칙이 아닙니다</b> — 다음 세션이 또 만들면 아무 일도 안 일어납니다.

   ── 재서 알게 된 것 — <b>한 낱말이 세 뜻</b>이었습니다 ───────────────
     ① <b>토스페이먼츠</b>(결제)      이름 8가지 · 37번
        toss-billing · toss-confirm · TOSS_SECRET_KEY · TOSS_CLIENT_ID ·
        TOSS_CLIENT_SECRET · TOSS_PLANS · TossPayments · tosspayments
     ② <b>토스증권</b>(주식)          이름 5가지 · 14번
        toss-agent · check-toss-relay · invTossUrl · INV_TOSS_LINK · tossinvest
     ③ <b>토스판</b>(목업·디자인)      이름 15가지 · 61번
        .hm-toss · hmToss* · BABA_TOSS · babaToss*
   ①②는 <b>진짜 그 회사 이름</b>이라 맞습니다. 사장님이 부딪힌다고 하신 것은
   <b>③</b> 입니다 — 결제 열쇠를 찾아 toss 를 그러면 <b>디자인 코드가 걸립니다.</b>

   ── 이 판에 한 것 ─────────────────────────────────────────────────
   ③ 중 <b>파일 이름</b>이던 하나를 바꿨습니다 —
     scripts/check-toss.js → <b>scripts/check-phonefit.js</b>
   재는 것·기준선은 <b>한 자도 안 바꾸고</b> 이름만 바꿨습니다(부르는 자리
   서른두 곳을 같이 고쳤습니다). 이름에 toss 가 든 파일이 <b>5 → 4</b> 가 되고,
   남은 넷은 전부 ①② — <b>진짜 토스 것</b>입니다.

   ── 보는 것 (넓게 잡지 않습니다 · 8번) ────────────────────────────
     [1] 이름에 toss 가 든 <b>파일</b>이 기준선 안쪽인가 (지금 4)
     [2] ★★ 그 넷이 저마다 <b>어느 토스인지 제 입으로</b> 말하나
         — 머리글에 <b>「@toss: …」 이름표 한 줄</b>이 달려 있어야 합니다
           (여는 /*, 공백, @toss:, 뜻, 공백, 닫는 별표슬래시).
         ⚠ 여기 <b>닫는 별표슬래시를 글자로 적지 않습니다</b> — 적으면 이 머리글
           주석이 그 자리에서 닫혀 파일이 터집니다. 제가 그렇게 한 번 터뜨렸습니다.
            적혀 있지 않으면 다음 사람이 또 헤맵니다.
     [3] ★ <b>목업을 뜻하는 toss 이름</b>이 늘지 않았나 (지금 15가지)
         — 클래스 이름까지 바꾸면 화면이 걸린 자리를 다 찾아야 해서 이 판에서
            못 했습니다. <b>늘지 않게</b> 막습니다 (1번 — 못 한 것은 적습니다).
     [4] <b>가지(브랜치)</b> 이름에 toss 가 없나
     [5] ⚠ <b>헛것을 안 잡나</b> — 한국말 「토스」 는 <b>설명</b>이라 세지 않고,
         ①② 이름은 <b>맞는 이름</b>이라 세지 않습니다. 그 둘이 0가지로
         나오면 이 자가 잘못 지운 것입니다.

   ⚠ <b>쪽지를 세지 않습니다.</b> 이 파일과 check-phonefit.js 의 머리글에
     「.hm-toss」 같은 이름이 <b>설명으로</b> 적혀 있어, 날글을 세면 제 쪽지가
     알리바이가 됩니다. 주석을 <b>걷어내고</b> 셉니다 (check-inkrole 과 같은 결).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* ── 추적되는 파일 목록 — git 에게 묻습니다 (손으로 안 적습니다) ────── */
let FILES = [];
try {
  /* ⚠★ 처음에 <b>git ls-files</b> 만 썼더니, 되돌림 시험으로 만들어 본
     scripts/toss-sample.js 를 <b>자가 못 봤습니다</b> — 그것은 아직
     <b>추적되지 않는</b> 파일이라서입니다. CI 에서는 이미 담긴 뒤라 보이지만,
     <b>알아야 하는 때는 밀기 전</b>입니다. 그래서 --others 로 <b>아직 안 담은
     파일까지</b> 봅니다(.gitignore 가 가린 것은 뺍니다).                 */
  FILES = execSync('git ls-files --cached --others --exclude-standard',
                   { encoding: 'utf8', maxBuffer: 1 << 24 })
    .split('\n').map(s => s.trim()).filter(Boolean);
  FILES = [...new Set(FILES)];
} catch (e) { FILES = []; }

console.log('[0] 저장소 파일 목록을 <b>git 에게</b> 물었다');
is(FILES.length > 100,
   '  추적되는 파일 ' + FILES.length + '개 (100개 아래면 이 자가 아무것도 못 보는 것입니다 · 8번)');

console.log('\n[1] 이름에 <b>toss</b> 가 든 파일이 기준선 안쪽인가');
/* ★ 4 는 <b>재서 적은 수</b>입니다 (2026-10-06). check-toss.js 를
   check-phonefit.js 로 바꿔 5 → 4 가 되었습니다. <b>줄이면 같이 내리고,
   늘면 빨간불</b>입니다 — 새 파일 이름에 toss 를 쓰면 그 자리에서 걸립니다. */
const BASE = { 파일: 4, 목업이름: 15 };
const toss파일 = FILES.filter(f => /toss/i.test(path.basename(f)));
is(toss파일.length <= BASE.파일,
   '  이름에 toss 가 든 파일 <b>' + toss파일.length + '개</b> — 기준선 ' + BASE.파일 +
   (toss파일.length > BASE.파일
     ? ' ← ★ <b>늘었습니다.</b> ' + toss파일.join(' · ') +
       ' — 토스페이먼츠와 부딪힙니다 (사장님 말씀). 다른 이름으로 지으십시오'
     : (toss파일.length < BASE.파일 ? ' ← 줄었습니다. 기준선을 ' + toss파일.length + ' 로 내려 주십시오' : '')));
toss파일.forEach(f => console.log('      · ' + f));

console.log('\n[2] ★★ 그 파일들이 <b>어느 토스인지 제 입으로</b> 말하나');
/* ⚠ 머리글 <b>40줄 안</b>에서 찾습니다 — 파일 아무 데나 「토스증권」 이
   한 번 나오면 통과시키면, 본문에서 지나가듯 적은 것도 통과합니다.   */
const 안말한것 = [];
toss파일.forEach(f => {
  let 머리 = '';
  try { 머리 = fs.readFileSync(f, 'utf8').split('\n').slice(0, 40).join('\n'); } catch (e) {}
  /* ⚠★ <b>처음에 글로 찾다가 제 쪽지에 속았습니다.</b> check-toss-relay.js 에
     「<b>토스페이먼츠</b>(결제)도 아니고」 라고 적어 두었는데, 자가 그 낱말만
     보고 「토스페이먼츠다」 로 읽었습니다 — <b>초록이었지만 틀린 초록</b>입니다.
     그래서 <b>기계가 읽는 이름표</b>를 답니다: /* @toss: 토스증권 *​/.
     「오늘 몇 분인가」 를 data-ask 로 다는 것과 같은 결입니다 (0-1번).      */
  const m = 머리.match(/@toss:\s*(토스페이먼츠|토스증권)/);
  const 뜻 = m ? m[1] : '';
  if (!뜻) 안말한것.push(f);
  console.log('      · ' + f.padEnd(38) + (뜻 || '⚠ 안 적혀 있습니다'));
});
is(안말한것.length === 0,
   '  ★★ 넷이 다 <b>어느 토스인지</b> 머리글에 적혀 있다' +
   (안말한것.length ? ' ← ' + 안말한것.join(' · ') + ' — 머리글에 <b>/* @toss: 토스페이먼츠 */</b> 또는 <b>/* @toss: 토스증권 */</b> 한 줄을 달아 주십시오' : ''));

console.log('\n[3] ★ <b>목업을 뜻하는 toss 이름</b>이 늘지 않았나');
/* 주석을 걷어내고 셉니다 — 제 쪽지가 알리바이가 되지 않게 */
/* ⚠★★ <b>제 판 쪽지가 알리바이가 됐습니다.</b> 주석은 걷어냈는데
   <b>APP_BUILD_NOTE</b> 를 안 걷어냈습니다. 그 줄에 「.hm-toss · hmToss*」 라고
   <b>설명으로</b> 적자 자가 「이름이 늘었다」 고 울렸습니다 — 고친 것이 없는데
   빨간불입니다. 판 쪽지는 <b>글</b>이고 이름이 아닙니다.
   ★ check-ttok · check-inkrole 이 이미 같은 일을 합니다 (5번 — 같은 수를 저마다
     세지 않습니다. 걷어내는 법을 여기서도 똑같이 씁니다).                   */
const 벗기기 = (t) => t.replace(/\/\*[\s\S]*?\*\//g, ' ')
                        .replace(/<!--[\s\S]*?-->/g, ' ')
                        .replace(/^var APP_BUILD_NOTE=.*$/m, ' ');
const 목업족 = /(?:\.?hm-toss|hmToss[A-Za-z0-9_]*|BABA_TOSS|babaToss[A-Za-z0-9_]*)/g;
const 결제족 = /(?:TossPayments|TOSS_SECRET_KEY|TOSS_CLIENT_ID|TOSS_CLIENT_SECRET|TOSS_PLANS|tosspayments|toss-billing|toss-confirm)/g;
const 증권족 = /(?:tossinvest|invToss[A-Za-z0-9_]*|INV_TOSS_LINK|iv-toss|toss-agent|toss-relay)/g;
const 모으기 = (rx) => {
  const s = new Set();
  FILES.filter(f => /^app\//.test(f) && /\.(html|js|css)$/i.test(f)).forEach(f => {
    let t = ''; try { t = 벗기기(fs.readFileSync(f, 'utf8')); } catch (e) { return; }
    (t.match(rx) || []).forEach(m => s.add(m));
  });
  return [...s].sort();
};
const 목업이름 = 모으기(목업족), 결제이름 = 모으기(결제족), 증권이름 = 모으기(증권족);
is(목업이름.length <= BASE.목업이름,
   '  목업을 뜻하는 toss 이름 <b>' + 목업이름.length + '가지</b> — 기준선 ' + BASE.목업이름 +
   (목업이름.length > BASE.목업이름
     ? ' ← ★ <b>늘었습니다.</b> 목업 쪽에 toss 이름을 새로 만들지 마십시오 (S09)'
     : (목업이름.length < BASE.목업이름 ? ' ← 줄었습니다. 기준선을 ' + 목업이름.length + ' 로 내려 주십시오' : '')));
console.log('      ' + 목업이름.join(' · '));

console.log('\n[4] <b>가지(브랜치)</b> 이름에 toss 가 없나');
/* CI 에서는 git 이 꼭지만 떼어 와 가지 이름이 HEAD 로 보입니다 —
   GitHub 이 넣어 주는 값을 먼저 봅니다 (GITHUB_HEAD_REF · GITHUB_REF_NAME). */
let 가지 = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || '';
if (!가지) { try { 가지 = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(); } catch (e) {} }
if (!가지 || 가지 === 'HEAD') {
  console.log('  · 가지 이름을 알 수 없습니다 — 안 셉니다 (모를 때는 모른다고 합니다 · 1번)');
} else {
  is(!/toss/i.test(가지),
     '  가지 이름 <b>' + 가지 + '</b> 에 toss 가 없다' +
     (/toss/i.test(가지) ? ' ← 토스페이먼츠와 부딪힙니다 (사장님 말씀)' : ''));
}

console.log('\n[5] ⚠ <b>헛것을 안 잡나</b> — 맞는 이름은 세지 않습니다 (8번)');
is(결제이름.length >= 3,
   '  <b>토스페이먼츠</b> 이름 ' + 결제이름.length + '가지는 <b>그대로 있다</b>' +
   ' (0가지면 이 자가 맞는 이름을 지운 것입니다)');
is(증권이름.length >= 3,
   '  <b>토스증권</b> 이름 ' + 증권이름.length + '가지도 <b>그대로 있다</b>');
/* 한국말 「토스」 는 설명입니다 — 세면 쪽지마다 빨간불이 켜져 아무도 못 적습니다 */
let 한국말 = 0;
FILES.filter(f => /\.(html|js|css|tsv|md)$/i.test(f)).forEach(f => {
  try { 한국말 += (fs.readFileSync(f, 'utf8').match(/토스/g) || []).length; } catch (e) {}
});
is(한국말 > 0,
   '  한국말 「<b>토스</b>」 ' + 한국말 + '번은 <b>설명이라 안 셉니다</b>' +
   ' — 부딪히는 것은 <b>영문 이름</b>뿐입니다');

console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '가지 빨간불')
  : '✓ toss 는 진짜 토스 것에만 · 목업 쪽은 늘지 않습니다.');
process.exit(bad ? 1 : 0);
