/* ══ ▶️ 발표 덱으로 들어가는 문이 종합보고서 메뉴에 선다 ══════════════

   사장님 말씀 (2026-10-28) — <b>「재무설계 계산기에서, 내가 연금부터, 달러,
   발표모드로 계산기 만들어 놓은게 다 사라졌어 복구하고 종합보고서 메뉴에
   넣어놔」</b>.

   ── 재어 보고 안 것 ────────────────────────────────────────────────
   <b>덱도 트랙도 한 번도 안 사라졌습니다.</b> 통합상담 덱(상담자료/
   통합상담_APEX.html)도, 트랙 다섯(₩ 연금 · $ 달러 · 📈 투자·세금 ·
   🎓 교육자금 · 🏢 일시납·쿠폰)도, 고르기 판(apexPickTrack)도 그대로
   있었습니다. 없어진 것은 <b>들어가는 길</b>입니다 —
     · 판 X205 에서 우하단 「발표」 단추를 뺐습니다. 그 쪽지에 그렇게
       적혀 있습니다: 「발표는 『함께 점검 상담』 정리 장의 『발표 덱으로
       이어 보기』 한 곳에서 연다」.
     · 그래서 덱에 닿으려면 🧭 함께 점검 상담을 <b>끝까지 걸어</b> 정리
       장까지 가야 했습니다.
     · 계산기를 열고 재어 보니 첫 화면에 보이는 단추 <b>23개 중 덱으로
       가는 것이 0개</b>였습니다. 사장님께는 「사라진 것」 이 맞습니다.

   ── 그래서 이 자가 보는 것 ─────────────────────────────────────────
     [1] 종합보고서 메뉴에 <b>덱으로 가는 칸</b>이 선다
     [2] 눌렀을 때 고르기 판이 서고 <b>트랙 다섯</b>이 다 있다
     [3] 트랙 이름이 <b>APEX_TRACK_NAME 한 곳</b>에서 온다 (5번) —
         메뉴 칸에 트랙 이름을 또 적어 두면 표와 갈립니다
     [4] 고르면 <b>그 트랙의 덱</b>이 발표 모드로 열린다 (present=1)
     [5] 판 X205 가 만든 <b>옛 길도 그대로</b> 있다 — 문을 하나 더 단
         것이지 바꿔 단 것이 아닙니다 (6번 · 길은 안 지운다)

   ⚠ 이 자는 <b>덱 속을 안 봅니다</b> — 덱이 무엇을 적는지는
     check-trackc · check-mkdeep 이 봅니다 (한 물음에 한 답 · 5번).
   ⚠ 바깥을 한 번도 안 부릅니다.                                      */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    rs.writeHead(404); return rs.end();
  }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  rs.end(fs.readFileSync(f));
});

let bad = 0;
const is = (ok, msg) => { if (!ok) bad++; console.log('  ' + (ok ? '✓' : '✗') + '   ' + msg); };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  /* ⚠ <b>바깥으로는 한 번도 안 나갑니다</b> — 이 자가 사장님 진짜 서버를
     읽으면 안 됩니다. 우리 서버(127.0.0.1)만 통과시키고 나머지는 끊습니다.
     check-netblock 이 이것을 셉니다.                                   */
  await ctx.route('**://**', r =>
    r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 130)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/finance.html',
               { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForTimeout(4000);

  /* ── [1] 메뉴에 문이 선다 ──────────────────────────────────────── */
  console.log('\n[1] ▶️ <b>종합보고서 메뉴에 덱으로 가는 칸</b>이 선다');
  const m = await p.evaluate(() => {
    const 보이나 = (e) => {
      const r = e.getBoundingClientRect();
      return r.width > 4 && r.height > 4 && getComputedStyle(e).visibility !== 'hidden';
    };
    const door = document.querySelector('.report-tab[onclick*="apexPickTrack"]');
    const 모든단추 = [...document.querySelectorAll('button,a')].filter(보이나);
    return {
      문: !!door, 보임: door ? 보이나(door) : false,
      글: door ? (door.innerText || '').replace(/\s+/g, ' ').trim() : '',
      높이: door ? Math.round(door.getBoundingClientRect().height) : 0,
      /* 옆 칸들의 높이 — 새로 단 칸이 <b>이방인</b>이 아닌지 봅니다 */
      옆: [...document.querySelectorAll('.report-tab')]
            .filter(e => !/apexPickTrack/.test(e.getAttribute('onclick') || ''))
            .map(e => Math.round(e.getBoundingClientRect().height)),
      칸수: document.querySelectorAll('.report-tab').length,
      /* 덱으로 가는 길이 <b>첫 화면에 몇 개</b>인가 — 0 이면 사라진 것입니다 */
      길: 모든단추.filter(e => /apexPickTrack|apexPresent/.test(e.getAttribute('onclick') || '')).length,
      표: (typeof APEX_TRACK_NAME !== 'undefined') ? APEX_TRACK_NAME : null
    };
  });
  is(m.문 && m.보임, '  ★★ 메뉴에 <b>▶️ 발표 덱</b> 칸이 선다 — 「' + (m.글 || '(없음)') + '」');
  is(m.길 >= 1, '  ★★ 첫 화면에서 덱으로 가는 길이 <b>' + m.길 + '개</b>다 '
     + '(판 X205 뒤에는 0개였습니다 — 그것이 「사라졌다」 입니다)');
  /* ⚠ <b>44px 을 여기서 안 묻습니다</b> — 재어 보니 메뉴 칸 열셋이 <b>다
     34px</b> 입니다(새로 단 것만 그런 것이 아닙니다). 제 칸 하나에만 44px 을
     요구하면 「손가락이 닿나」 를 묻는 척하면서 <b>옆 열둘은 눈감는</b> 자가
     됩니다 — 헛것입니다 (8번). 메뉴 전체를 44px 로 올릴지는 사장님 판단이고,
     그때는 열셋을 함께 올려야 합니다(폰에서 메뉴가 그만큼 길어집니다 ·
     판 X218 이 거기서 잘리던 것을 막 고친 자리입니다).
     ★ 여기서 묻는 것은 <b>「새로 단 칸이 옆과 같은 결인가」</b> 입니다. */
  const 옆 = m.옆 || [];
  is(옆.length > 0 && 옆.every(h => h === m.높이),
     '  ★ 새 칸이 <b>옆 칸과 같은 결</b>이다 — ' + m.높이 + 'px · 옆 '
     + (옆.length ? Math.min.apply(null, 옆) + '~' + Math.max.apply(null, 옆) + 'px' : '(없음)'));
  is(m.칸수 >= 13, '  ★ 메뉴 칸이 <b>' + m.칸수 + '개</b> — 열둘이 그대로 있고 하나가 늘었다 (6번)');

  /* ── [2] 트랙 다섯이 다 선다 ───────────────────────────────────── */
  console.log('\n[2] 🎛 눌렀을 때 <b>트랙 다섯</b>이 다 선다');
  const door = await p.$('.report-tab[onclick*="apexPickTrack"]');
  if (door) { await door.click(); await p.waitForTimeout(900); }
  const pick = await p.evaluate(() => {
    const sh = document.getElementById('apexTrackSheet');
    return { 판: !!sh,
             키: sh ? [...sh.querySelectorAll('[data-tk]')].map(e => e.getAttribute('data-tk')) : [],
             글: sh ? (sh.innerText || '').replace(/\s+/g, ' ') : '' };
  });
  is(pick.판, '  <b>고르기 판</b>이 선다');
  const 키 = (m.표 ? Object.keys(m.표) : []).sort().join(',');
  is(키.length > 0 && pick.키.slice().sort().join(',') === 키,
     '  ★★ 표(APEX_TRACK_NAME)의 트랙이 <b>하나도 안 빠진다</b> — 판 ' + pick.키.join(' ')
     + ' · 표 ' + (키 || '(못 읽음)'));
  /* ★ 삼항 사슬로 늘어놓으면 트랙 하나가 조용히 빠집니다 — 실제로 쿠폰
     트랙이 두 번 그렇게 빠졌습니다 (CLAUDE.md 5번). 그래서 <b>표와 판을
     맞대어</b> 봅니다. */
  const 이름있나 = m.표 ? Object.keys(m.표).every(k => pick.글.indexOf(m.표[k]) >= 0) : false;
  is(이름있나, '  ★★ 다섯 이름이 <b>표의 글자 그대로</b> 선다 — '
     + (m.표 ? Object.keys(m.표).map(k => m.표[k]).join(' · ') : '(못 읽음)'));

  /* ── [3] 메뉴 칸이 트랙 이름을 또 적지 않는다 (5번) ───────────── */
  console.log('\n[3] 🧷 <b>트랙 이름을 두 곳에 두지 않는다</b> (5번)');
  const src = fs.readFileSync(path.join(ROOT, 'app/finance.html'), 'utf8');
  const 문줄 = (src.match(/<button class="report-tab" onclick="apexPickTrack\(\)"[^>]*>.*?<\/button>/) || [''])[0];
  const 베낌 = m.표 ? Object.keys(m.표).filter(k => 문줄.indexOf(m.표[k]) >= 0) : [];
  is(베낌.length === 0, '  ★ 메뉴 칸이 트랙 이름을 <b>안 베낀다</b> — 베낀 것 '
     + (베낌.length ? 베낌.map(k => m.표[k]).join(' · ') : '0개')
     + ' (표가 바뀌면 메뉴만 낡습니다)');

  /* ── [4] 고르면 그 트랙이 발표 모드로 열린다 ───────────────────── */
  console.log('\n[4] ▶ 고르면 <b>그 트랙의 덱</b>이 발표 모드로 열린다');
  const d = await p.$('#apexTrackSheet [data-tk="d"]');
  is(!!d, '  <b>$ 달러</b> 칸을 누를 수 있다');
  if (d) { await d.click(); await p.waitForTimeout(1800); }
  const deck = await p.evaluate(() => {
    const f = document.getElementById('apexDeckFrame');
    return { 창: !!document.getElementById('apexDeckModal'),
             주소: f ? (f.getAttribute('src') || '') : '' };
  });
  is(deck.창, '  덱이 <b>앱 안 창</b>으로 열린다 (새 탭으로 안 튄다)');
  is(deck.주소.indexOf('track=d') >= 0,
     '  ★★ 고른 트랙 그대로 열린다 — <b>track=d</b> · ' + (deck.주소 || '(없음)'));
  is(deck.주소.indexOf('present=1') >= 0, '  ★★ <b>발표 모드</b>로 열린다 (present=1)');
  is(deck.주소.indexOf('통합상담_APEX.html') >= 0, '  덱 파일이 <b>그 덱</b>이다');

  /* ── [5] 옛 길도 그대로 (6번) ──────────────────────────────────── */
  console.log('\n[5] 🚪 <b>판 X205 가 만든 옛 길도 그대로</b> 있다 (6번 · 길은 안 지운다)');
  is(src.indexOf('wkClose();apexPickTrack()') >= 0,
     '  「함께 점검 상담」 정리 장의 <b>「발표 덱으로 이어 보기」</b> 가 그대로 있다');
  is(src.indexOf('function apexPickTrack(') >= 0 && src.indexOf('function apexPresent(') >= 0,
     '  <b>apexPickTrack · apexPresent</b> 둘 다 그대로 있다');

  is(errs.length === 0, '  콘솔이 조용하다 — ' + (errs.length ? errs.join(' | ') : '0건'));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '가지 빨간불 — 발표 덱으로 가는 문이 막혔습니다'); process.exit(1); }
  console.log('✓ 종합보고서 메뉴에서 한 번 눌러 트랙 다섯을 고르고, 고른 덱이 발표 모드로 열립니다.');
})();
