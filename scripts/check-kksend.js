/* 고객에게 <b>카톡으로 보내기</b> — 주소가 길어 못 보내던 자리.

   「한장 보험료 비교」가 만들어 주는 고객 링크는 비교한 자료를 통째로
   주소 안(# 뒤)에 담는다. 그래서 <b>500자가 넘고</b>, 카톡에 그냥 붙이면
   그 주소가 한 화면을 덮는다. 고객이 자료보다 그것을 먼저 본다.

   여기서 못 박는 것은 이렇다.

     1. 보낼 글이 <b>토스 말풍선 모양</b>으로 미리 서고, 주소는
        <b>맨 마지막 한 줄</b>이다 — 그래야 카톡이 링크 딱지로 접는다.
     2. 주소가 몇 글자인지 <b>세어서</b> 적는다. 「길다」는 말보다
        숫자가 빠르다.
     3. 짧게 만들면 <b>그때만</b> 서버에 담긴다. 안 누르면 아무것도 안
        남는다 — 원래 그 자료는 # 뒤라 서버로 안 갔다. 무엇을 맞바꾸는지
        화면에 적혀 있어야 한다.
     4. <b>실패를 성공처럼 말하지 않는다.</b> 표가 없거나 서버가 안
        되면 그렇다고 적고, <b>긴 주소는 그대로 쓸 수 있다</b>고 알린다.
     5. 다시 열어도 적어 두신 것이 <b>그대로</b> 있다. 칸은 비었는데
        미리보기에 아까 주소가 남아 있으면 뭘 보내는지 알 수 없다.
     6. 아무 데로나 보내는 발판이 되지 않는다 — <b>우리가 아는 주소</b>만
        줄인다.                                                       */
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
const head = (t) => console.log('\n' + t);

/* 실제로 나오는 꼴 — 자료를 통째로 담아 500자가 넘는다 */
const LONG = 'https://apex-hb-onecompare.netlify.app/c.html#z' + 'H4sIAAAAAAAA'.repeat(40);

(async () => {
  await new Promise(r => srv.listen(0, r));
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 900, height: 960 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + srv.address().port + '/app/', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(2600);
  await pg.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    window.toast = function () {};
  });

  head('[1] 한장 보험료 비교에서 <바로> 열린다');
  const btn = await pg.evaluate(() => {
    var f = document.querySelector('#onecmpScreen .fin-float');
    return {
      has: !!f && /💬/.test(f.textContent || ''),
      wired: !!f && [].slice.call(f.querySelectorAll('button'))
        .some(function (b) { return /kkOpen/.test(b.getAttribute('onclick') || ''); }),
      fn: typeof window.kkOpen === 'function'
    };
  });
  is(btn.has && btn.wired, '「한장 보험료 비교」 도구 줄에 💬 단추가 있다');
  is(btn.fn, '누르면 여는 자리(kkOpen)가 실제로 있다');

  head('[2] 보낼 글이 말풍선으로 서고 · 주소는 맨 마지막 한 줄');
  await pg.evaluate(() => kkOpen());
  await pg.waitForTimeout(300);
  await pg.evaluate((u) => { kkSet('link', u); kkSet('name', '홍길동'); kkSet('note', '편하실 때 보시고 연락 주세요.'); }, LONG);
  await pg.waitForTimeout(250);
  const m = await pg.evaluate(() => {
    var t = document.getElementById('kkMsg').textContent || '';
    var L = t.split('\n');
    return {
      open: !document.getElementById('kkOvl').hidden,
      bub: !!document.querySelector('#kkOvl .kk-bub'),
      text: t, last: L[L.length - 1], first: L[0],
      urlLines: L.filter(function (x) { return /^https:\/\//.test(x); }).length,
      len: (document.getElementById('kkLen') || {}).textContent || ''
    };
  });
  is(m.open && m.bub, '카톡 말풍선 모양으로 미리보기가 선다');
  is(/^https:\/\//.test(m.last), '주소가 <맨 마지막 줄>이다 — 그래야 카톡이 링크로 접는다');
  is(m.urlLines === 1, '글 안에 주소가 <한 번만> 나온다 (' + m.urlLines + '번)');
  is(/홍길동/.test(m.first), '고객 이름이 첫 줄에 들어간다');
  is(/연락 주세요/.test(m.text), '덧붙인 한 줄이 들어간다');

  head('[3] 주소가 몇 글자인지 <세어서> 적는다');
  is(/\d+자/.test(m.len), '글자 수를 적는다 — 「' + m.len.replace(/\s+/g, ' ').slice(0, 60) + '」');
  is(m.len.indexOf(String(LONG.length)) >= 0, '실제 길이(' + LONG.length + '자)를 그대로 말한다');

  head('[4] 무엇을 맞바꾸는지 화면에 적혀 있다');
  const warn = await pg.evaluate(() => (document.getElementById('kkShortOut') || {}).textContent || '');
  is(/서버에 담깁니다|서버에 담긴/.test(warn), '줄이면 <서버에 담긴다>고 미리 말한다');
  is(/이름|연락처/.test(warn), '이름·연락처는 안 들어 있다고 밝힌다');

  head('[5] 실패를 성공처럼 말하지 않는다');
  /* 서버가 없는 자리라 짧게 만들기는 실패한다 — 그때 무엇이라 적는가 */
  await pg.evaluate(() => kkShorten());
  await pg.waitForTimeout(900);
  const f = await pg.evaluate(() => ({
    out: (document.getElementById('kkShortOut') || {}).textContent || '',
    msg: document.getElementById('kkMsg').textContent || ''
  }));
  is(/✗|못|없|않/.test(f.out), '못 만들면 <못 만들었다>고 적는다 — 「' + f.out.replace(/\s+/g, ' ').slice(0, 46) + '」');
  /* 브라우저가 뱉는 영어를 그대로 띄우면 사장님은 무슨 소린지 모른다 */
  is(!/Unexpected token|is not valid JSON|SyntaxError|TypeError|undefined/.test(f.out),
     '<사람 말>로 적는다 — 브라우저 오류 문구를 그대로 띄우지 않는다');
  is(/그대로 쓰실 수 있습니다|그대로 쓸 수 있습니다/.test(f.out),
     '<긴 주소는 그대로 쓸 수 있다>고 알린다 — 보내는 일이 막히지 않는다');
  is(f.msg.indexOf(LONG) >= 0, '실패했으니 글에는 <원래 주소>가 그대로 있다 — 가짜 짧은 주소를 안 만든다');

  head('[6] 다시 열어도 적어 두신 것이 그대로');
  await pg.evaluate(() => { kkClose(); kkOpen(); });
  await pg.waitForTimeout(300);
  const again = await pg.evaluate(() => ({
    box: (document.getElementById('kkLink') || {}).value || '',
    nm: (document.getElementById('kkName') || {}).value || '',
    msg: document.getElementById('kkMsg').textContent || ''
  }));
  is(again.box === LONG, '주소 칸이 <비지 않는다>');
  is(again.nm === '홍길동', '이름 칸도 그대로다');
  is(again.msg.indexOf(LONG) >= 0, '칸과 미리보기가 <같은 주소>를 말한다');

  head('[7] 서버 쪽 — 아무 데로나 보내는 발판이 되지 않는다');
  const src = fs.readFileSync(path.join(ROOT, 'netlify/functions/shortlink.js'), 'utf8');
  is(/function allowed\(/.test(src), '보낼 곳을 <가려 받는> 자리가 있다');
  is(/netlify\\.app|netlify\.app/.test(src), '우리가 아는 주소만 줄인다');
  is(/protocol !== 'https:'/.test(src), 'https 가 아니면 안 받는다');
  is(/expires_at/.test(src) && /DAYS\s*=\s*\d+/.test(src), '<기간이 지나면> 닫힌다');
  is(/no_table/.test(src), '표가 없으면 <표가 없다>고 말한다 — 만든 척하지 않는다');
  is(!/service_role_key\s*=\s*['"][A-Za-z0-9._-]{20,}/i.test(src) &&
     /process\.env\.SUPABASE_SERVICE_ROLE_KEY/.test(src),
     '열쇠를 코드에 안 적고 <환경변수>에서 읽는다 (10번)');
  const sql = fs.readFileSync(path.join(ROOT, 'sql/short_links.sql'), 'utf8');
  is(sql.indexOf('--') < 0, 'SQL 에 -- 주석을 안 쓴다 — /* */ 만 (9번)');
  is(/enable row level security/i.test(sql), 'RLS 를 켠다 — 공개 키로는 아무것도 못 본다');
  const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
  is(/\/s\/:code/.test(toml), '/s/:code 로 들어오면 이 함수로 간다');

  head('[8] 조용한가');
  is(errs.length === 0, errs.length ? ('콘솔 에러 — ' + errs.join(' / ')) : '콘솔에 에러가 없다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') :
    '고객에게 보내기 점검 통과 — 주소는 맨 끝 한 줄, 실패하면 실패했다고 말합니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
