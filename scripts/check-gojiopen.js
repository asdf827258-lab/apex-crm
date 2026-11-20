/* 🩺 고지체크 열기 — 로그인 창 없이 CRM 계정으로 (app/apex-goji-open.js)

   사장님 말씀(2026-11-17) 「안된다. 로그인 창 없애고 해봐」.
   고지체크는 다른 주소라 CRM 로그인을 같이 못 쓴다. 그래서 CRM 이 일회용 표를 받아 건넨다.

   지키는 것
     1. 카드가 [⚠️ 예외질환 인수확인](ref_underwrite) 탭에 선다
     2. 누르면 CRM 토큰을 Authorization 에만 싣고 goji-open 을 부른다 — 주소에 토큰을 안 싣는다
     3. 고지체크는 표(#h=)로만 연다 — CRM 토큰(access/refresh)을 넘기지 않는다
        (같은 토큰을 두 곳이 갱신하면 CRM 이 로그아웃된다)
     4. 창은 누른 순간 먼저 연다 — 기다린 뒤 열면 팝업 차단
     5. 로그인이 없거나 서버가 거절하면 이유를 말하고 빈 창을 닫는다   */

const fs = require('fs');
const vm = require('vm');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const src = fs.readFileSync(__dirname + '/../app/apex-goji-open.js', 'utf8');
const html = fs.readFileSync(__dirname + '/../app/index.html', 'utf8');
is(/<script src="apex-goji-open\.js[^"]*"><\/script>/.test(html), 'index.html 이 apex-goji-open.js 를 싣는다');

function run(session, reply) {
  const els = {}, opened = [], calls = [];
  const win = { closed: false, location: { href: 'about:blank' }, close() { this.closed = true; } };
  const ctx = {
    CUSTOM: [],
    document: {
      getElementById: id => els[id] || (els[id] = { textContent: '', style: {} }),
      addEventListener() {},
    },
    location: { href: 'crm' },
    osClient: () => ({ auth: { getSession: () => Promise.resolve({ data: { session } }) } }),
    fetch: (url, o) => { calls.push({ url, o }); return Promise.resolve({ json: () => Promise.resolve(reply) }); },
  };
  ctx.window = ctx;
  ctx.window.open = (u) => { opened.push(u); return win; };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return { ctx, els, opened, calls, win };
}

(async () => {
  const flush = () => new Promise(r => setTimeout(r, 20));

  /* 1. 카드 자리 */
  const a = run(null, {});
  is(a.ctx.CUSTOM.length === 1 && a.ctx.CUSTOM[0].tab === 'ref_underwrite', '카드가 ref_underwrite 탭에 선다');
  is(/gojiOpen\(\)/.test(a.ctx.CUSTOM[0].render()), '카드 단추가 gojiOpen 을 부른다');

  /* 2·3·4. 정상 — 표로만 연다 */
  const S = { access_token: 'ACC.TOKEN', refresh_token: 'REFRESH' };
  const b = run(S, { h: 'HASH123' });
  b.ctx.gojiOpen();
  is(b.opened.length === 1, '누른 순간 창을 먼저 연다(기다리기 전)');
  await flush();
  const c = b.calls[0] || { url: '', o: { headers: {} } };
  is(/functions\/v1\/goji-open$/.test(c.url), 'goji-open 함수를 부른다');
  is(c.o.headers.Authorization === 'Bearer ACC.TOKEN', 'CRM 토큰은 Authorization 머리에만 싣는다');
  is(!/ACC\.TOKEN|REFRESH/.test(c.url), '부르는 주소에 토큰이 없다');
  is(b.win.location.href === 'https://apex-hb-goji.netlify.app/#h=HASH123', '고지체크를 표(#h=)로 연다');
  is(!/ACC\.TOKEN|REFRESH/.test(b.win.location.href), '고지체크 주소에 CRM 토큰을 넘기지 않는다');

  /* 5. 로그인 없음 · 서버 거절 */
  const d = run(null, {});
  d.ctx.gojiOpen(); await flush();
  is(d.calls.length === 0 && d.win.closed, '로그인이 없으면 서버를 안 부르고 빈 창을 닫는다');
  is(/로그인/.test(d.els.gjo_msg.textContent), '로그인이 없으면 그 이유를 말한다');
  const e = run(S, { error: '사용이 멈춘 계정이에요.' });
  e.ctx.gojiOpen(); await flush();
  is(e.win.closed && /멈춘 계정/.test(e.els.gjo_msg.textContent), '서버가 거절하면 그 말을 그대로 보여 주고 창을 닫는다');

  console.log(bad ? `\n✗ ${bad}개 어긋남` : '\n고지체크 열기 점검 통과');
  process.exit(bad ? 1 : 0);
})();
