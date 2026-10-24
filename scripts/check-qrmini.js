/* ══════════════════════════════════════════════════════════════════
   check-qrmini.js — <b>손으로 짠 QR 이 표준과 한 칸도 다르지 않은가</b> (판 X180)

   app/qr-mini.js 는 바깥 셈틀 없이(10번) 표준을 손으로 옮긴 것입니다. QR 은
   한 칸만 틀려도 <b>고객 폰이 못 읽거나 다른 주소로 갑니다.</b>
   그래서 <b>남이 짠 구현</b>이 같은 글·같은 판·같은 마스크로 만든 칸과 견줍니다.

   ── 정답은 어디서 왔나 ─────────────────────────────────────────────
   python qrcode 7.4.2 (독립 구현) 로 뽑은 칸의 sha256 입니다. 만들 때는
   서른 가지 글(판 1~20 · 한글 UTF-8 · 마스크 여덟 모두)을 칸마다 대조했고,
   zxing 으로 다시 읽어 30/30 이 원래 글로 돌아오는 것까지 봤습니다.
   여기에는 그중 다섯을 박아 <b>고친 뒤에 어긋나지 않았나</b>만 잽니다.
   ⚠ 이 자는 「판·마스크 고르기가 그 라이브러리와 같다」 까지 묻습니다 —
     마스크 고르는 벌점을 바꾸면 여기서 울립니다. 그때는 다시 대조해 정답을
     새로 뽑으십시오(읽히는 QR 이어도 정답과 다르면 그냥 넘기지 않습니다 · 8번).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const box = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(process.cwd(), 'app', 'qr-mini.js'), 'utf8'), box);
const Q = box.window.qrMini;
const GOLD = [
  { t: "https://apex-os-yunpro.netlify.app/app/selfcheck.html", v: 4, mask: 3, sha: "b6bb5e18358cca74d64000b2adf131f309b844bebce7f92e38421d2769b0e915" },
  { t: "https://apex-os-yunpro.netlify.app/app/selfcheck.html#q=cancer.brain.heart.similar.surg.ctreat.nonpay.end.pay.claim.renew&by=%ED%99%8D%EA%B8%B8%EB%8F%99&hi=%EC%98%A4%EB%8A%98%20%EC%9D%B4%EC%95%BC%EA%B8%B0%20%EB%93%A4%EC%96%B4%20%EC%A3%BC%EC%85%94%EC%84%9C%20%EA%B3%A0%EB%A7%88%EC%9B%8C%EC%9A%94", v: 13, mask: 2, sha: "06c0b67bcbd1a6b9210ce2b0a38125cce50e50f29f136a003fcf8106ed7b85ab" },
  { t: "홍길동 설계사 · 보험의 기준", v: 3, mask: 4, sha: "4ffc5a11d3e871d9f46dce68600f09d9bb88dfdbd9d7417ab311056ef058497d" },
  { t: "A", v: 1, mask: 4, sha: "177b3a1897a152aee17ab1ee4b667913c6bb873e6ba357debfc5ba243dabff0e" },
  { t: "x7#Lq:9/%=.mZ0aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ8aB9cD0eF1gH2iJ3kL4mN5oP6qR7sT8uV9wX0yZ1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ4aB5cD6eF7gH8iJ9kL0mN1oP2qR3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ0aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4cD5eF6gH7iJ8kL9mN0oP1qR2sT3uV4wX5yZ6", v: 13, mask: 6, sha: "49011e652a0d132bbaae9cd5de8877677e93ff1af00979852b87b408fc717dca" }
];
console.log('\n[1] 표준 구현과 칸마다 같은가');
is(!!(Q && Q.matrix && Q.svg), '  qrMini.matrix · qrMini.svg 가 있다');
for (const g of GOLD) {
  const q = Q.matrix(g.t);
  const m = q ? q.m.map(r => r.join('')).join('\n') : '';
  const sha = crypto.createHash('sha256').update(m).digest('hex');
  is(!!q && q.version === g.v && q.mask === g.mask && sha === g.sha,
     '  ' + JSON.stringify(g.t).slice(0, 46) + (g.t.length > 44 ? '…' : '') + ' — 판 ' + (q && q.version) + ' · 마스크 ' + (q && q.mask) + (sha === g.sha ? ' · 칸 같음' : ' · ✗ 칸이 다름'));
}
console.log('\n[2] 못 담는 글은 지어 자르지 않는다 (1번)');
is(Q.matrix('a'.repeat(667)) === null && Q.svg('a'.repeat(667)) === '', '  667바이트(판 20 M 을 넘음)는 그리지 않는다 — 잘라서 다른 주소를 만들지 않는다');
is(!!Q.matrix('a'.repeat(666)), '  666바이트까지는 그린다');
const sv = Q.svg(GOLD[0].t);
is(/^<svg [^>]*viewBox="0 0 37 37"/.test(sv) && /shape-rendering="crispEdges"/.test(sv), '  SVG — 판 4 (33칸 + 테두리 2씩) · 칸 사이 틈 없이');
console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 손으로 짠 QR 이 표준 구현과 한 칸도 다르지 않습니다.');
process.exit(bad ? 1 : 0);
