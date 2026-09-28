/* 🚗 <b>약속 없는 분도 동선에 서는가</b> — 판 ⑤.

   사장님 말씀 (2026-09-28) — 「약속 없는 분도 동선에」.

   여태 홈의 「오늘 어디로 가시나」 는 <b>약속이 잡힌 분</b>과 <b>오늘 걸
   분</b>만 세웠습니다. 그래서 「그 동네에 사는데 <b>아직 날짜를 못 잡은</b>
   AP·PC」 가 안 보였습니다 — 간 김에 여쭈면 한 번에 끝나는 분들입니다.
   못 여쭈면 그 동네에 <b>또 가야 합니다.</b>

   여기서 확인합니다.
     1. 같은 구에 <b>약속 없는</b> AP 를 두면 <b>선다</b>  ← 사장님이 주신 재는 법
     2. <b>다른 구</b> 는 안 선다 · <b>지역을 모르면</b> 안 선다 (1번)
     3. 단계는 <b>AP·PC·CS·증권전달</b> 넷만 — 미접촉·TA·거절·계약완료는 안 선다
     4. <b>이미 위에 선 분</b>은 또 안 선다 — 두 번 서면 몇 분인지 못 센다
     5. 「이 중 N분」 의 N 이 <b>진짜 수</b>와 같다
     6. <b>앞으로</b> 약속이 있는 분에게는 단추를 안 달고 날짜를 적는다
     7. 오늘 약속이 <b>하나도 없으면</b> 이 자리가 안 선다 — 갈 동네를 모른다
     8. <b>새 CSS 를 한 줄도 안 썼나</b> — 쓴 class 가 전부 ui.css 에 있나
     9. 누르는 것이 44px 이상인가 (철칙)
    10. 조용히 터진 곳이 없나

   ★ <b>44px 은 「재 보니 44 더라」 로 끝내지 않습니다.</b> #dynPane 의
     button 은 CSS 가 이미 바닥을 받쳐서, 재기만 하면 <b>절대 안 울립니다.</b>
     그래서 「받침을 받는 모양인가」(button + .t-chip)를 함께 봅니다 (8번).
   ★ 견본 이름은 <b>홍길동</b> 입니다 (3번).                            */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const UICSS = fs.readFileSync(path.join(ROOT, 'app/ui.css'), 'utf8');
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
  const ctx = await browser.newContext({ viewport: { width: 480, height: 820 } });
  await ctx.route('**://**', r =>
    r.request().url().indexOf('127.0.0.1:' + srv.address().port) >= 0 ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 170)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n🚗 약속 없는 분도 동선에 서는가 — 판 ⑤');

  /* 사람을 심고 카드를 그린다. 자료는 <b>이 시험 안에서만</b> 삽니다. */
  const R = await page.evaluate(() => {
    const me = 'me-1';
    const t = arToday();
    const 앞으로 = (n) => {
      const d = new Date(Date.parse(t + 'T00:00:00+09:00') + n * 86400000);
      return d.toISOString().slice(0, 10);
    };
    OS.profile = OS.profile || {}; OS.profile.id = me;
    AR.loaded = true;

    const row = (o) => Object.assign(
      { who: me, region: '', stage: 'AP', appt: '', days: 3, src: 'dbs', name: '홍길동' }, o);

    const 기본 = [
      /* 오늘 약속 한 분 — 이분이 동네를 정합니다 */
      row({ id: 'a1', name: '홍길동A', region: '강남구', appt: t + 'T14:00', stage: 'AP' }),
      /* 같은 구 · 약속 없음 · AP·PC·CS·증권전달 넷 */
      row({ id: 'm1', name: '홍길동B', region: '강남구', stage: 'AP' }),
      row({ id: 'm2', name: '홍길동C', region: '강남구', stage: 'PC' }),
      row({ id: 'm3', name: '홍길동D', region: '강남구', stage: 'CS' }),
      row({ id: 'm4', name: '홍길동E', region: '강남구', stage: '증권전달' }),
      /* 같은 구지만 만날 단계가 아님 */
      row({ id: 'x1', name: '홍길동F', region: '강남구', stage: '미접촉' }),
      row({ id: 'x2', name: '홍길동G', region: '강남구', stage: 'TA' }),
      row({ id: 'x3', name: '홍길동H', region: '강남구', stage: '거절' }),
      row({ id: 'x4', name: '홍길동I', region: '강남구', stage: '계약완료' }),
      /* 다른 구 · 지역 모름 */
      row({ id: 'y1', name: '홍길동J', region: '서초구', stage: 'AP' }),
      row({ id: 'y2', name: '홍길동K', region: '', stage: 'PC' }),
      /* 같은 구 · <b>앞으로</b> 약속이 있는 분 */
      row({ id: 'z1', name: '홍길동L', region: '강남구', stage: 'PC', appt: 앞으로(5) + 'T10:00' }),
      /* 남의 사람 */
      row({ id: 'o1', name: '홍길동M', region: '강남구', stage: 'AP', who: 'other' }),
    ];

    const 그려보기 = (db) => { AR.db = db; return hmRtHtml(); };

    const out = {};
    AR.db = 기본;
    out.meet = hmRtMeet().map(x => ({ id: x.id, st: x.st, ap: x.ap }));
    out.noAp = hmRtNoAppt(hmRtMeet());
    out.html = 그려보기(기본);

    /* 오늘 약속이 하나도 없는 날 */
    out.noDay = 그려보기(기본.filter(r => r.id !== 'a1'));

    /* 같은 구에 약속 없는 분을 <b>넣기 전</b> — 사장님 재는 법의 앞쪽 */
    out.before = 그려보기(기본.filter(r => ['m1','m2','m3','m4','z1'].indexOf(r.id) < 0));

    AR.db = 기본;
    return out;
  });

  console.log('\n[1] 같은 구에 약속 없는 분을 두면 동선에 선다 — 사장님이 주신 재는 법');
  const ids = R.meet.map(x => x.id).sort();
  is(R.before.indexOf('만나야 할 분') < 0, '  넣기 <b>전</b>에는 그 줄이 없다');
  is(R.html.indexOf('만나야 할 분') >= 0, '  넣은 <b>뒤</b>에는 선다');
  is(R.html.indexOf('날짜 여쭙기') >= 0, '  약속 없는 분에게 <b>「날짜 여쭙기」</b> 단추가 달린다');

  console.log('\n[2] 다른 구 · 지역 모름은 안 선다 (1번 — 모르는 것을 같은 동네라고 안 한다)');
  is(ids.indexOf('y1') < 0, '  다른 구(서초구)는 안 선다');
  is(ids.indexOf('y2') < 0, '  <b>지역을 모르는</b> 분은 안 선다');
  is(ids.indexOf('o1') < 0, '  남의 사람은 안 선다 (3번)');

  console.log('\n[3] 단계는 AP·PC·CS·증권전달 넷만');
  ['m1','m2','m3','m4'].forEach((k, i) =>
    is(ids.indexOf(k) >= 0, '  ' + ['AP','PC','CS','증권전달'][i] + ' 는 선다'));
  ['x1','x2','x3','x4'].forEach((k, i) =>
    is(ids.indexOf(k) < 0, '  ' + ['미접촉','TA','거절','계약완료'][i] + ' 는 안 선다'));

  console.log('\n[4] 이미 위에 선 분은 또 안 선다');
  is(ids.indexOf('a1') < 0, '  오늘 약속이 잡힌 분은 아래에 또 안 선다');

  console.log('\n[5] 「이 중 N분」 의 N 이 진짜 수와 같다');
  const 진짜 = R.meet.filter(x => !x.ap).length;
  const m = R.html.match(/이 중 <b>(\d+)분<\/b>/);
  is(!!m, '  그 줄이 <b>있다</b>' + (m ? '' : ' ✗ 「이 중 N분」 을 못 찾았습니다'));
  is(!!m && Number(m[1]) === 진짜 && R.noAp === 진짜,
     '  화면에 적힌 수 ' + (m ? m[1] : '?') + ' = 세어 본 수 ' + 진짜 + ' = 세는 함수 ' + R.noAp);

  console.log('\n[6] 앞으로 약속이 있는 분에게는 단추를 안 달고 날짜를 적는다');
  const z = R.meet.filter(x => x.id === 'z1')[0];
  is(!!z && !!z.ap, '  닷새 뒤 약속이 있는 분도 <b>동선에는 선다</b> — 날짜 ' + ((z && z.ap) || '없음'));
  is(R.html.indexOf('약속</span>') >= 0, '  그분 자리에는 <b>날짜 딱지</b>가 선다 (.t-tag.ok)');

  console.log('\n[7] 오늘 약속이 하나도 없으면 이 자리가 안 선다 — 갈 동네를 모른다 (1번)');
  is(R.noDay.indexOf('만나야 할 분') < 0, '  약속 없는 날에는 <b>지어내지 않는다</b>');
  is(R.noDay.indexOf('갈 데가 없습니다') >= 0, '  그 자리에 <b>원래 한 줄</b>이 그대로 선다');

  console.log('\n[8] 새 CSS 를 한 줄도 안 썼다 — 쓴 이름이 전부 ui.css 에 있다');
  /* 새로 그린 자리가 쓰는 이름만 봅니다. 옛 hm-rt-* 는 이 판이 만든 것이
     아니라 원래 있던 옷이라 안 봅니다 — 넓게 잡으면 헛것이 됩니다 (8번). */
  const 새이름 = [];
  (R.html.match(/class="(t-[^"]*)"/g) || []).forEach(c => {
    c.replace(/class="|"/g, '').split(/\s+/).forEach(n => { if (n && 새이름.indexOf(n) < 0) 새이름.push(n); });
  });
  const 없는것 = 새이름.filter(n => UICSS.indexOf('.' + n) < 0);
  is(새이름.length > 0, '  새로 그린 자리가 t- 이름 ' + 새이름.length + '개를 쓴다 — ' + 새이름.join(' · '));
  is(없는것.length === 0, '  그 이름이 <b>전부 ui.css 에 있다</b>' +
     (없는것.length ? '\n      ✗ ui.css 에 없는 이름: ' + 없는것.join(' · ') + ' — 새 CSS 를 쓰셨습니다' : ''));

  console.log('\n[9] 누르는 것이 44px 이상이다 (철칙)');
  const P = await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = 'chkHmMeet';
    host.innerHTML = hmRtHtml();
    (document.getElementById('dynPane') || document.body).appendChild(host);
    const out = [];
    host.querySelectorAll('.t-row .r > *').forEach(el => {
      const r = el.getBoundingClientRect();
      out.push({ tag: el.tagName.toLowerCase(), cls: el.className, h: Math.round(r.height) });
    });
    host.remove();
    return out;
  });
  const 누르는것 = P.filter(x => x.tag === 'button');
  is(누르는것.length > 0, '  누르는 것 ' + 누르는것.length + '개를 찾았다');
  /* ★ 빈 목록에 every() 를 물으면 <b>언제나 참</b>입니다 — 되돌려 보니
     단추가 0개일 때 아래 두 줄이 조용히 초록이었습니다. 수부터 묻습니다 (8번). */
  is(누르는것.length > 0 && 누르는것.every(x => /\bt-chip\b/.test(x.cls)),
     '  전부 <b>button + .t-chip</b> 이다 — .t-chip 이 ui.css 에서 44px 을 받친다');
  is(누르는것.length > 0 && 누르는것.every(x => x.h >= 44),
     '  그래서 실제로 잰 높이도 44px 이상 — ' + 누르는것.map(x => x.h).join(' · ') + 'px');
  is(누르는것.length === Math.min(진짜, 5),
     '  단추 수가 <b>약속 없는 분 수</b>와 같다 — 단추 ' + 누르는것.length + '개 · 약속 없는 분 ' + 진짜 + '명');

  console.log('\n[10] 조용히 터진 곳이 없다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? '\n      ✗ ' + errs.slice(0, 3).join('\n      ✗ ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데 — 약속 못 잡은 분이 안 보이면 그 동네에 두 번 가시게 됩니다.'); process.exit(1); }
  console.log('✓ 같은 구에 약속 없는 분이 동선에 섭니다 — 새 CSS 0줄.');
})().catch(e => { console.error(e); process.exit(1); });
