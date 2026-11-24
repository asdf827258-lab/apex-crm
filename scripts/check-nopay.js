/* 💸 결제가 없다 — 그리고 바깥에서 아무것도 안 받아 온다 (판 X530)

   사장님 말씀 2026-11-24 「우선 결제칸 없애고」.

   ★ 걷으면서 두 가지가 제자리를 찾았습니다 —
     ① 이 파일 머리글은 <b>처음부터</b> 「결제 없음. 전부 열려 있다」 고 적혀
        있었습니다. 코드에는 결제가 그대로 있었으니 <b>쪽지가 거짓말</b>을
        하고 있었던 것입니다 (1번).
     ② 결제 칸이 토스 스크립트를 <b>바깥에서 받아왔습니다</b>
        (js.tosspayments.com). 머리글의 「혼자 도는 파일 — 인터넷에서 받아오는
        것이 없다」 와 어긋났습니다. 돌려 보는 자(check-sajusite)는 결제 칸을
        한 번도 안 눌러 보므로 <b>이것을 못 봅니다</b> — 그래서 글로도 봅니다.  */
const fs = require('fs');
const bad = [], ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) bad.push(m); };
const FILES = ['app/saju-mbti.html', 'site-me/index.html', 'site-saju/index.html'];

for (const f of FILES) {
  console.log('\n[' + f + ']');
  const src = fs.readFileSync(f, 'utf8');
  /* 주석은 뺍니다 — 「왜 걷었는지」 를 적어 둔 글까지 잡으면 헛것입니다 (8번) */
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');

  const fns = ['payOpen', 'payCard', 'payBank', 'paySimple', 'isPaid', 'setPaid', 'unlockGo', 'tossReturn']
    .filter(x => new RegExp('function\\s+' + x + '\\s*\\(').test(code));
  ok(fns.length === 0, '★★ 결제 함수가 <b>한 개도 없다</b>' + (fns.length ? ' ← ' + fns.join(', ') : ''));
  ok(!/\bPAY\s*=/.test(code), '★ PAY 라는 이름이 안 남았다 — 결제를 안 담으므로 AGENT 로 바뀌었다 (4번)');
  ok(/\bAGENT\s*=\s*\{/.test(code), '★ 설계사 신원은 <b>AGENT</b> 가 담는다 — 이름이 담는 것과 같다');
  ok(!/tosspayments|toss-confirm|requestPayment/.test(code),
     '★★ 토스 결제가 <b>한 자도 안 남았다</b>');

  /* ★★ 이 파일이 혼자 도는지 — 바깥 주소를 <b>글로</b> 봅니다.
     돌려 보는 자는 안 눌린 길을 못 봅니다. */
  const out = (code.match(/https?:\/\/[a-zA-Z0-9.-]+/g) || [])
    .filter(u => !/^https?:\/\/(www\.)?(w3\.org|schema\.org)/.test(u));
  ok(out.length === 0, '★★ 바깥에서 받아오는 주소가 <b>하나도 없다</b> — 혼자 도는 파일입니다' +
     (out.length ? ('\n      ← ' + [...new Set(out)].slice(0, 4).join(' · ')) : ''));

  ok(/결제 없음. 전부 열려 있다/.test(src), '머리글의 「결제 없음. 전부 열려 있다」 가 <b>이제 참말이다</b>');
}

console.log('\n──────────────────────────────');
if (bad.length) { console.log('결제 없음 점검 실패 — ' + bad.length + '가지 어긋납니다.'); process.exit(1); }
console.log('결제가 없고, 세 파일 모두 바깥에서 아무것도 안 받아 옵니다.');
