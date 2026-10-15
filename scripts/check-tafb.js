#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   check-tafb.js — 🖨 <b>인쇄</b> · 💬 <b>피드백 끄기</b> (판 X113)

   사장님 말씀 (2026-10-15):
     「인쇄 버튼과, <b>피드백 off 버튼</b> 만들어서 꺼서 <b>한눈에</b>
      들어오게 만들어」

   ★ <b>피드백</b> 은 「저에게 하는 말」 입니다 — 코치 한마디(.coach) ·
     고객 속마음(.heart) · 넘어가는 타이밍(.timing). 끄면 이 셋만 접히고
     <b>고객에게 읽는 말(.st 다섯 단계)은 한 줄도 안 접힙니다.</b>
     재어 보니 통화 탭이 <b>4.86 → 3.87 화면</b> 입니다(1440×900).
   ★ <b>지우지 않고 접습니다</b> (6번) — 끈 동안 단추가 어둡게 서고 이름이
     「켜기」 로 바뀌어, <b>되돌릴 길이 늘 보입니다.</b> 끈 상태는 기억합니다.
   ★ 인쇄는 <b>하는 일이 한 곳</b>(taPrint)입니다 — 누르는 자리는 둘(위 띠 ·
     상담 정보 칸)이지만 둘 다 그것을 부릅니다 (5번).
   ⚠ <b>onclick 을 쓰면 안 됩니다</b> — 이 파일의 JS 는 봉투(IIFE) 안이라
     밖에서 안 보입니다. 처음에 onclick 으로 붙였다가 <b>「taFbToggle is
     not defined」</b> 로 터졌습니다. 받는 자리는 이 파일이 쓰던 그 한 곳입니다.
   ⚠ <b>인쇄본은 따로 짭니다</b>(ps-* 칸) — 피드백을 꺼도 인쇄에는 전부
     나갑니다. 끄는 규칙이 인쇄본까지 먹으면 A4 가 반쪽이 됩니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8713;
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript', '.css':'text/css',
               '.png':'image/png', '.svg':'image/svg+xml', '.json':'application/json' };
const srv = http.createServer((rq, rs) => {
  const f = path.join(ROOT, decodeURIComponent(rq.url.split('?')[0].split('#')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
}).listen(PORT);

const SRC = fs.readFileSync(path.join(ROOT, 'ta-script.html'), 'utf8');
const 날 = SRC.replace(/\/\*[\s\S]*?\*\//g, '');     /* 쪽지는 뺍니다 */

(async () => {
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1440, height: 900 } });
  /* 바깥을 막습니다 — 점검이 사장님 진짜 서버를 읽지 않습니다 (abort) */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const errs = [];
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e.message || e)));
  await p.goto('http://127.0.0.1:' + PORT + '/ta-script.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForFunction(() => !!document.querySelector('#tabs .tab'), { timeout: 30000 });
  await p.waitForTimeout(900);

  const 재기 = () => p.evaluate(() => {
    const 봄 = sel => [].slice.call(document.querySelectorAll(sel)).filter(x => x.offsetHeight > 0).length;
    const b = document.getElementById('fbBtn');
    return { 화면: +(document.body.scrollHeight / 900).toFixed(2),
             코치: 봄('.coach'), 속마음: 봄('.heart'), 타이밍: 봄('.timing'),
             읽는말: 봄('.st'), 거절줄: 봄('.objrow'),
             /* ⚠ 판 X115 에서 단추가 <i>아이콘</i>+<span>글자</span> 로 나뉘었습니다 —
                폰에서 글자를 접어도 무엇인지 보이게 하려고입니다. 그래서
                <b>글자 칸</b>을 읽습니다(아이콘은 따로 묻습니다). */
             이름: (document.getElementById('fbTxt') || b || {}).textContent ?
                   (document.getElementById('fbTxt') || b).textContent.trim() : '(단추 없음)',
             아이콘: !!(b && b.querySelector('i')),
             어둡나: !!(b && b.classList.contains('off')),
             /* ★ 클래스만 보면 <b>안 울리는 알람</b>입니다 — 어두운 꼴을 지워도
                클래스는 그대로 붙습니다(되돌림 D 가 그래서 안 울렸습니다 · 8번).
                <b>눈에 보이는 색</b>을 잽니다. */
             단추색: b ? getComputedStyle(b).backgroundColor : '',
             보이나: !!(b && b.offsetHeight > 0),
             인쇄자리: document.querySelectorAll('[data-act="print"]').length,
             인쇄본: (document.getElementById('printSheet') || {}).innerHTML ?
                     document.getElementById('printSheet').innerHTML.length : 0 };
  });

  head('[1] 위 띠에 단추 <b>둘</b>이 선다 — 🖨 인쇄 · 💬 피드백');
  const A = await 재기();
  is(A.보이나, '  💬 피드백 단추가 <b>눈에 보인다</b> — 「' + A.이름 + '」');
  is(A.이름 === '피드백 끄기', '  처음에는 <b>켜져</b> 있고 단추는 <b>끄기</b>를 가리킨다 — 「' + A.이름 + '」');
  is(A.아이콘, '  ★ 단추에 <b>아이콘</b>이 남아 있다 — 폰에서는 글자를 접고 아이콘만 섭니다 (판 X115)');
  is(A.인쇄자리 === 2, '  🖨 인쇄를 <b>누를 자리가 둘</b>이다(위 띠 · 상담 정보 칸) — ' + A.인쇄자리 + '곳');
  const 띠 = SRC.slice(SRC.indexOf('<header class="top">'), SRC.indexOf('</header>'));
  is(/id="fbBtn"/.test(띠) && /data-act="print"/.test(띠), '  둘이 <b>위 띠 안</b>에 있다 — 화면을 옮겨도 늘 보인다');
  /* ⚠ 전에는 class 글자에 noprint 가 붙었나로 물었습니다 — 판 X115 에서 단추를
     noprint 묶음(.tools) 안으로 옮기자 글자가 사라져 빨간불이 켜졌습니다.
     <b>묻는 것은 꼴이 아니라 「인쇄에서 안 보이나」</b> 입니다 — 그렇게 잽니다 (8번). */
  await p.emulateMedia({ media: 'print' });
  await p.waitForTimeout(300);
  const 인쇄에 = await p.evaluate(() => {
    const b = document.getElementById('fbBtn'), pr = document.querySelector('[data-act="print"]');
    const 숨 = e => !e || e.getClientRects().length === 0;
    return 숨(b) && 숨(pr);
  });
  await p.emulateMedia({ media: 'screen' });
  await p.waitForTimeout(200);
  is(인쇄에, '  ★ 둘 다 <b>인쇄에는 안 나온다</b> — 인쇄 판으로 바꿔 놓고 재었습니다');

  head('[2] 인쇄는 <b>하는 일이 한 곳</b>이다 (5번)');
  is((날.match(/window\.print\(\)/g) || []).length === 1,
     '  window.print() 가 <b>파일에 한 번</b>만 있다 — 지금 ' + (날.match(/window\.print\(\)/g) || []).length + '곳');
  is(/function taPrint\(\)\{\s*window\.print\(\);\s*\}/.test(날), '  그 한 번이 <b>taPrint() 안</b>에 있다');
  is(!/onclick="ta(Print|FbToggle)\(\)"/.test(날),
     '  ★ <b>onclick 으로 안 부른다</b> — 봉투(IIFE) 안이라 밖에서 안 보입니다(실제로 터졌습니다)');
  is(/\[data-act="print"\]/.test(날) && /\[data-act="fb"\]/.test(날),
     '  받는 자리가 <b>이 파일이 쓰던 그 한 곳</b>이다');

  head('[3] ★★ 눌러 보면 — <b>저에게 하는 말만</b> 접힌다');
  await p.click('#fbBtn');
  /* ⚠ ★ 누른 뒤 <b>마우스를 치웁니다</b> — 안 치우면 단추 위에 남아
     <b>올려놓은 색(:hover)</b>을 재고, 어두운 꼴을 지워도 색이 달라 보여
     되돌림이 <b>안 울렸습니다</b> (8번). */
  await p.mouse.move(5, 5);
  await p.waitForTimeout(500);
  const B = await 재기();
  is(B.코치 === 0 && B.속마음 === 0 && B.타이밍 === 0,
     '  코치·속마음·타이밍이 <b>접혔다</b> — 코치 ' + A.코치 + '→' + B.코치 + ' · 속마음 ' + A.속마음 + '→' + B.속마음 +
     ' · 타이밍 ' + A.타이밍 + '→' + B.타이밍);
  is(B.읽는말 === A.읽는말 && B.읽는말 >= 5,
     '  ★★ <b>고객에게 읽는 말은 그대로</b>다 — 다섯 단계 ' + A.읽는말 + '→' + B.읽는말 + '칸');
  is(B.거절줄 === A.거절줄, '  통화 중 누르는 <b>거절 단추 줄도 그대로</b>다 — ' + A.거절줄 + '줄');
  is(B.화면 < A.화면 - 0.3,
     '  ★ <b>한눈에 더 들어온다</b> — 통화 탭 ' + A.화면 + ' → <b>' + B.화면 + ' 화면</b>');

  head('[4] <b>끈 것이 보이고</b>, 되돌릴 길이 있다 (6번)');
  is(B.이름 === '피드백 켜기', '  단추 이름이 <b>켜기</b>로 바뀐다 — 「' + B.이름 + '」');
  is(B.어둡나 && B.단추색 !== A.단추색,
     '  ★ 단추가 <b>눈에 다르게</b> 서서 접혀 있다는 것이 보인다 — ' + A.단추색 + ' → ' + B.단추색);
  await p.click('#fbBtn');
  /* ⚠ ★ 누른 뒤 <b>마우스를 치웁니다</b> — 안 치우면 단추 위에 남아
     <b>올려놓은 색(:hover)</b>을 재고, 어두운 꼴을 지워도 색이 달라 보여
     되돌림이 <b>안 울렸습니다</b> (8번). */
  await p.mouse.move(5, 5);
  await p.waitForTimeout(500);
  const C = await 재기();
  is(C.코치 === A.코치 && C.속마음 === A.속마음 && C.화면 === A.화면,
     '  다시 누르면 <b>전부 돌아온다</b> — 코치 ' + C.코치 + ' · 속마음 ' + C.속마음 + ' · ' + C.화면 + ' 화면');

  head('[5] 끈 것을 <b>기억한다</b> — 다시 열어도 그대로');
  await p.click('#fbBtn');
  await p.mouse.move(5, 5);
  await p.waitForTimeout(400);
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1600);
  const D = await 재기();
  is(D.이름 === '피드백 켜기' && D.코치 === 0, '  다시 열어도 <b>접힌 채</b>다 — 「' + D.이름 + '」 · 코치 ' + D.코치);
  is(/S\.fb/.test(날) && /persist\(\)/.test(날), '  이 기기(localStorage)에만 담는다 — 서버를 안 부른다 (3번·7번)');

  head('[6] <b>묻는 곳이 하나</b>다 (5번)');
  is((날.match(/S\.fb\s*!==\s*false/g) || []).length === 1,
     '  「지금 켜져 있나」 를 <b>taFbOn() 한 곳</b>만 안다 — 지금 ' + (날.match(/S\.fb\s*!==\s*false/g) || []).length + '곳');
  is((날.match(/function taFbName\(\)/g) || []).length === 1 &&
     (날.match(/💬 피드백 끄기/g) || []).length <= 2,
     '  단추 이름도 <b>한 곳</b>에서 온다(taFbName) — 글자는 옷·자리 합쳐 ' + (날.match(/💬 피드백 끄기/g) || []).length + '번');

  head('[7] ★★ <b>인쇄본은 피드백과 무관</b>하다 — A4 가 반쪽이 되지 않는다');
  is(D.인쇄본 > 500, '  인쇄본이 <b>짜여 있다</b> — ' + D.인쇄본 + '자 (끈 상태에서 읽었습니다)');
  is(A.인쇄본 === D.인쇄본, '  켜짐·꺼짐에서 <b>인쇄본 길이가 같다</b> — ' + A.인쇄본 + ' = ' + D.인쇄본 + '자');
  is(/body\.fb-off \.coach,body\.fb-off \.heart,body\.fb-off \.timing\{display:none/.test(SRC),
     '  접는 규칙이 <b>그 셋만</b> 가리킨다 — 인쇄본 칸(ps-*)은 건드리지 않는다');
  is(/class="ps-co/.test(날) && /class="ps-ht/.test(날) && /class="ps-tm/.test(날),
     '  인쇄본은 <b>제 칸(ps-co · ps-ht · ps-tm)</b>으로 따로 짠다');

  head('[8] 조용한가');
  const 시끄 = errs.filter(e => !/favicon|net::ERR|Failed to fetch|abort/i.test(e));
  is(시끄.length === 0, '콘솔 에러 ' + 시끄.length + '건' + (시끄.length ? ' ← ' + 시끄[0] : ''));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '자리 — 위를 보십시오 (' + n + '가지 중)'); process.exit(1); }
  console.log('✓ 인쇄 단추는 한 자를 부르고, 피드백을 끄면 읽는 말만 남습니다 (' + n + '자리).');
})();
