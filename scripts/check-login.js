/* 서버가 안 받아 줄 때 로그인 단추가 <b>멈추지 않는가</b>.

   실제로 이런 일이 있었다. Supabase 가 응답을 멈추자(Cloudflare 522)
   로그인 단추가 「처리 중…」 에 걸린 채 아무 말도 안 나왔다.
   .then 만 달려 있고 .catch 가 없어서, 약속이 <b>거절</b>되면
   단추를 되살리는 done() 이 영영 안 돌았기 때문이다.

   쓰는 사람 눈에는 「내 계정이 갑자기 안 된다」 로 보인다.

   여기서 확인한다.

     1. 서버가 거절해도 단추가 되살아나는가
     2. 「비밀번호 문제가 아니다」 라고 갈라서 말하는가
     3. 틀린 비밀번호는 그대로 틀렸다고 말하는가 — 뭉뚱그리면 안 된다
     4. 계정 등록도 같은가
     5. 영어 오류를 그대로 띄우지 않는가                              */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  /* 로그인 창구를 흉내 낸다. 진짜 서버로는 안 보낸다. */
  const run = (mode, how) => page.evaluate(({ mode, how }) => {
    document.querySelectorAll('#osAuthOvl,#osLoginGate').forEach(x => x.remove());
    const mk = (id, type, val) => {
      let e = document.getElementById(id);
      if (!e) { e = document.createElement(type === 'checkbox' ? 'input' : 'input'); e.id = id; document.body.appendChild(e); }
      if (type === 'checkbox') { e.type = 'checkbox'; e.checked = true; } else e.value = val;
      return e;
    };
    mk('osEmail', 'text', 'hong@example.com');
    mk('osPw', 'text', 'somepassword');
    mk('osName', 'text', '홍길동');
    mk('osAgTerms', 'checkbox');
    mk('osAgPriv', 'checkbox');
    let box = document.getElementById('osErr');
    if (!box) { box = document.createElement('div'); box.id = 'osErr'; document.body.appendChild(box); }
    box.textContent = '';
    let btn = document.getElementById('osSubmit');
    if (!btn) { btn = document.createElement('button'); btn.id = 'osSubmit'; document.body.appendChild(btn); }
    btn.disabled = false; btn.textContent = '로그인';

    /* 가짜 서버 — 거절하거나, {error} 를 돌려주거나 */
    const give = () => {
      if (how === 'reject') return Promise.reject(new TypeError('Failed to fetch'));
      if (how === 'neterr') return Promise.resolve({ error: { message: 'NetworkError when attempting to fetch resource.' } });
      if (how === 'wrongpw') return Promise.resolve({ error: { message: 'Invalid login credentials' } });
      if (how === 'rate') return Promise.resolve({ error: { message: 'Email rate limit exceeded' } });
      return Promise.resolve({ data: {}, error: null });
    };
    OS.sb = { auth: { signInWithPassword: give, signUp: give } };
    window.osCloseModal = function () { window.__closed = true; };
    window.toast = function () {};
    window.__closed = false;
    osMode = mode;
    osSubmit();
    return new Promise(r => setTimeout(() => r({
      msg: document.getElementById('osErr').textContent,
      label: document.getElementById('osSubmit').textContent,
      disabled: document.getElementById('osSubmit').disabled,
      closed: window.__closed
    }), 260));
  }, { mode, how });

  console.log('\n[1] 서버가 거절해도 단추가 되살아난다');
  const rej = await run('login', 'reject');
  is(rej.disabled === false, '  단추가 다시 눌린다');
  is(rej.label === '로그인', '  「처리 중…」 에 멈춰 있지 않다 — ' + rej.label);
  is(!!rej.msg, '  아무 말도 없이 끝나지 않는다');
  is(!rej.closed, '  들어가지지도 않는다');

  console.log('\n[2] 비밀번호 문제가 아니라고 갈라서 말한다');
  is(/비밀번호 문제가 아닙니다/.test(rej.msg), '  「비밀번호 문제가 아닙니다」 — ' + rej.msg.slice(0, 30) + '…');
  is(/서버가 응답하지 않습니다/.test(rej.msg), '  서버가 안 받아 준다고 말한다');
  const net = await run('login', 'neterr');
  is(/서버가 응답하지 않습니다/.test(net.msg), '  {error} 로 와도 같은 말을 한다');
  is(net.disabled === false, '  이때도 단추가 살아난다');

  console.log('\n[3] 틀린 비밀번호는 틀렸다고 말한다 — 뭉뚱그리지 않는다');
  const wrong = await run('login', 'wrongpw');
  is(/이메일 또는 비밀번호가 올바르지 않습니다/.test(wrong.msg), '  ' + wrong.msg);
  is(!/서버가 응답하지 않습니다/.test(wrong.msg), '  서버 탓으로 돌리지 않는다');
  const rate = await run('login', 'rate');
  is(/1~2분 뒤에/.test(rate.msg), '  너무 자주 눌렀을 때도 따로 말한다 — ' + rate.msg);

  console.log('\n[4] 계정 등록도 같다');
  const sRej = await run('signup', 'reject');
  is(sRej.disabled === false, '  단추가 되살아난다');
  is(sRej.label === '계정 등록', '  이름이 「계정 등록」 으로 돌아온다 — ' + sRej.label);
  is(/서버가 응답하지 않습니다/.test(sRej.msg), '  같은 말로 알려 준다');

  console.log('\n[5] 영어 오류를 그대로 띄우지 않는다');
  [rej, net, sRej, wrong, rate].forEach((r, i) =>
    is(!/Failed to fetch|NetworkError|Invalid login credentials|rate limit exceeded/i.test(r.msg),
       '  ' + (i + 1) + '번째 — 영어가 새어 나오지 않는다'));

  console.log('\n[6] 잘 되면 그대로 들어간다');
  const okRun = await run('login', 'ok');
  is(okRun.closed === true, '  로그인 창이 닫힌다');
  is(okRun.disabled === false, '  단추도 되살아난다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '로그인 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '로그인 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
