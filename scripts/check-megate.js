/* 🔐 신당 문 — 아이디·비밀번호로 막는다 (판 X525)

   사장님 말씀 2026-11-23 「아이디 비번으로 로그인할건데」.

   ⚠ 이 자는 글만 읽지 않습니다 — 문지기를 <b>실제로 불러서</b> 엽니다.
     로그인 문은 「있다」 가 아니라 「틀린 걸 막는다」 가 돼야 의미가 있습니다 (8번).
   ★ 제일 중요한 줄은 「설정을 빠뜨리면 닫힌다」 입니다. 열려 버리는 쪽이
     훨씬 위험합니다 — 사장님 얼굴과 사장님 풀이가 든 판입니다.            */
const fs = require('fs'), path = require('path');
const bad = [], ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) bad.push(m); };
const GATE = 'site-me/netlify/edge-functions/gate.js';

function basic(u, p) {
  const b = new TextEncoder().encode(u + ':' + p);
  let s = ''; for (const x of b) s += String.fromCharCode(x);
  return 'Basic ' + Buffer.from(b).toString('base64');
}
const req = h => new Request('https://x.test/', { headers: h ? { authorization: h } : {} });
const NEXT = { marker: 'NEXT' };
const ctx = { next: async () => NEXT };

(async () => {
  console.log('\n[1] ★ 문이 제자리에 있다');
  ok(fs.existsSync(GATE), GATE + ' 이 있다');
  ok(fs.existsSync('site-me/netlify.toml'), 'site-me/netlify.toml 이 있다 — 루트 설정 대신 이것을 읽게 합니다');
  ok(!fs.existsSync('netlify/edge-functions'),
     '★★ 저장소 <b>루트</b>에는 엣지 함수가 없다 — 거기 두면 <b>본 앱까지</b> 로그인을 뭅니다');
  ok(fs.readdirSync('site-me').sort().join(' ') === '_redirects index.html netlify netlify.toml robots.txt',
     '올릴 폴더에 딴 파일이 안 섞였다 (9번) — ' + fs.readdirSync('site-me').sort().join(' '));

  console.log('\n[2] ★★ 비밀은 <b>코드에 없다</b> (10번)');
  const src = fs.readFileSync(GATE, 'utf8');
  ok(/ME_USER/.test(src) && /ME_PASS/.test(src), '아이디·비번을 <b>환경변수</b>에서 읽는다 — ME_USER · ME_PASS');
  const lit = src.match(/(?:pass|pw|secret|password)\s*=\s*['"][^'"]{3,}['"]/ig) || [];
  ok(lit.length === 0, '파일에 <b>비밀번호가 박혀 있지 않다</b>' + (lit.length ? (' ← ' + lit[0]) : ''));

  console.log('\n[3] ★★ 문지기를 <b>실제로 불러</b> 본다');
  const mod = await import('data:text/javascript;base64,' + Buffer.from(src, 'utf8').toString('base64'));
  const gate = mod.default;
  ok(typeof gate === 'function', '문지기가 함수로 나온다');
  ok(mod.config && mod.config.path === '/*', '★ <b>모든 주소</b>를 막는다 — path ' + (mod.config && mod.config.path));

  /* ① 설정을 안 했으면 닫힌다 — 여기가 이 자의 뼈대입니다 */
  delete globalThis.Netlify;
  let r = await gate(req(basic('아무개', '아무거나')), ctx);
  ok(r !== NEXT && r.status === 401, '설정이 없으면 아무 아이디·비번도 안 통한다 — ' + (r === NEXT ? 'NEXT' : r.status));
  /* ★★ 여기가 진짜 구멍입니다. 설정이 비어 있으면 <b>빈 아이디·빈 비번</b>이
     빈 값과 「같다」고 나와 그대로 열립니다. 처음에 틀린 비번으로만 재 보니
     막는 줄을 빼도 그냥 통과했습니다 — 안 울리는 알람이었습니다 (8번). */
  r = await gate(req(basic('', '')), ctx);
  ok(r !== NEXT && r.status === 401,
     '★★ 설정을 안 해 두면 <b>빈 아이디·빈 비번으로도 못 들어간다</b> — ' + (r === NEXT ? '그냥 열렸습니다' : r.status) +
     (r !== NEXT && r.status === 401 ? '' : '\n      ← 설정을 빠뜨렸을 때 문이 열리면 선생님 얼굴과 풀이가 그대로 나갑니다'));
  r = await gate(req(null), ctx);
  ok(r !== NEXT && r.status === 401, '설정이 없고 머리글도 없으면 막는다 — ' + (r === NEXT ? 'NEXT' : r.status));

  /* 이제 아이디·비번이 있다고 치고 */
  const U = '윤무당', P = 'p@ss 한글 123';
  globalThis.Netlify = { env: { get: k => (k === 'ME_USER' ? U : k === 'ME_PASS' ? P : '') } };

  r = await gate(req(null), ctx);
  ok(r !== NEXT && r.status === 401, '머리글이 없으면 막는다 — ' + (r === NEXT ? 'NEXT' : r.status));
  ok(r !== NEXT && /^Basic /.test(r.headers.get('www-authenticate') || ''),
     '★ <b>브라우저 로그인창</b>을 띄운다 — WWW-Authenticate: ' + (r === NEXT ? '' : r.headers.get('www-authenticate')));

  r = await gate(req(basic(U, P + 'x')), ctx);
  ok(r !== NEXT && r.status === 401, '★★ <b>비번이 틀리면 막는다</b> — ' + (r === NEXT ? '들여보냈습니다' : r.status));
  r = await gate(req(basic(U + 'x', P)), ctx);
  ok(r !== NEXT && r.status === 401, '★★ <b>아이디가 틀리면 막는다</b> — ' + (r === NEXT ? '들여보냈습니다' : r.status));
  r = await gate(req('Basic %%%'), ctx);
  ok(r !== NEXT && r.status === 401, '망가진 머리글에도 안 터지고 막는다');

  r = await gate(req(basic(U, P)), ctx);
  ok(r === NEXT, '★★ <b>맞으면 들여보낸다</b> — 한글·빈칸·기호가 든 비번도 됩니다' +
     (r === NEXT ? '' : ('\n      ← 맞는데도 막았습니다: ' + r.status)));

  console.log('\n──────────────────────────────');
  if (bad.length) { console.log('신당 문 점검 실패 — ' + bad.length + '가지 어긋납니다.'); process.exit(1); }
  console.log('신당 문 — 틀리면 파일이 안 내려가고, 설정을 빠뜨리면 닫힙니다.');
})().catch(e => { console.log('터졌습니다 — ' + e.message); process.exit(1); });
