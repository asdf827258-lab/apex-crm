/* 신당 문 — 아이디·비밀번호가 맞아야 파일이 내려갑니다 (판 X525).
 *
 * 사장님 말씀 2026-11-23 「아이디 비번으로 로그인할건데」.
 *
 * ★ 화면 안에 비밀번호 칸을 두는 것은 <b>보안이 아닙니다.</b> 그때는 파일이
 *   이미 내려간 뒤라 소스를 열면 풀이도 사진도 그대로 보입니다. 그래서
 *   <b>내려주기 전에</b> 여기서 막습니다 — 틀리면 index.html 자체가 안 갑니다.
 *
 * ⚠ 아이디·비밀번호는 <b>이 파일에 안 적습니다.</b> Netlify 의 환경변수
 *   ME_USER · ME_PASS 로만 둡니다 (CLAUDE.md 10번 — 비밀은 코드에 안 붙인다).
 */
const enc = new TextEncoder();

/* 글자 수가 달라도 같은 시간을 쓰게 — 몇 글자까지 맞았는지 시간으로 새지 않게 합니다 */
function sameBytes(a, b) {
  const x = enc.encode(a), y = enc.encode(b);
  let d = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) d |= (x[i] || 0) ^ (y[i] || 0);
  return d === 0;
}

function envOf(k) {
  try { if (globalThis.Netlify && Netlify.env && Netlify.env.get) return Netlify.env.get(k) || ''; } catch (e) {}
  try { if (globalThis.Deno && Deno.env && Deno.env.get) return Deno.env.get(k) || ''; } catch (e) {}
  return '';
}

function deny(msg) {
  return new Response(msg + '\n', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Yun Shindang", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });
}

export default async (request, context) => {
  const user = envOf('ME_USER'), pass = envOf('ME_PASS');

  /* ★★ 아이디·비번을 안 넣어 두었으면 <b>아무도 못 들어갑니다.</b>
     설정을 빠뜨렸을 때 문이 열려 버리는 쪽이 훨씬 위험합니다 — 선생님
     얼굴과 선생님 풀이가 든 판입니다. 막힌 채로 두고 알려 주는 편이 낫습니다. */
  if (!user || !pass) return deny('아직 아이디·비밀번호가 설정되지 않았습니다. Netlify 환경변수 ME_USER · ME_PASS 를 넣어 주십시오.');

  const h = request.headers.get('authorization') || '';
  if (h.slice(0, 6).toLowerCase() !== 'basic ') return deny('로그인이 필요합니다.');

  let got = '';
  try {
    /* 한글 비밀번호도 되게 — atob 은 바이트를 주므로 UTF-8 로 다시 읽습니다 */
    const bin = atob(h.slice(6).trim());
    got = new TextDecoder().decode(Uint8Array.from(bin, function (c) { return c.charCodeAt(0); }));
  } catch (e) { return deny('로그인이 필요합니다.'); }

  const i = got.indexOf(':');
  if (i < 0) return deny('로그인이 필요합니다.');

  /* 둘 다 재고 나서 판정합니다 — 아이디가 틀렸다고 먼저 빠져나가지 않습니다 */
  const okU = sameBytes(got.slice(0, i), user);
  const okP = sameBytes(got.slice(i + 1), pass);
  if (!(okU && okP)) return deny('아이디 또는 비밀번호가 다릅니다.');

  return context.next();
};

export const config = { path: '/*' };
