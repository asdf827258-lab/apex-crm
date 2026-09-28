/* 📞 <b>전화 기록 창</b> — 세 층이 서고, 날짜는 규칙이 정하는가 (판 ④).

   사장님 말씀 — 「전화를 누르면 상황·할 말·결과 세 층」.
   그림은 docs/mokgak/hansaram.html?call=p1 (vSheet · 1089행).

   ★ <b>전화하면서 알게 된 것을 그 자리에서 못 적으면 안 적게 됩니다.</b>
     그래서 창 안에서 바로 고쳐야 하고, 딴 화면으로 보내면 안 됩니다.

   여기서 확인합니다.
     1. 창에서 <b>고칠 수 있는 칸이 여섯</b>인가 —
        단계 · 요즘 상황 · 첫 문장에 붙일 말 · 가족 · 다음에 할 것 · 들은 말
     2. ★★ <b>결과 다섯</b>이 각각 <b>단계와 다음 날짜</b>를 표대로 바꾸는가
        통화 3일·그대로 / 부재 1일·부재 / 거절 30일·거절 /
        만남 3일·다음 단계 / 다음에 7일·그대로
     3. ★ <b>사장님께 날짜를 고르게 하지 않는가</b> — 결과 층에 날짜 칸이 없다
     4. ★★ <b>새 저장 코드를 안 짰는가</b> (S04) — cshMark 가 서버를 직접
        부르지 않고 hdbCall·hdbTo·cmNextSave·ccMark 를 부르는가
     5. 말을 <b>새로 쓰지 않고</b> apex-stage 에서 읽는가 (5번)
     6. 「다음에」 는 calls 표에 <b>안 담는가</b> — 그 표에 없는 칸을
        지어내면 상담 수가 부풀고 단계가 저절로 올라갑니다 (1번)
     7. 쓴 t- 이름이 전부 ui.css 에 있는가 (새 CSS 0줄) · 누르는 것 44px
     8. 조용히 터진 곳이 없는가

   ★ 저장하는 넷을 <b>바꿔치기해 지켜봅니다</b> — 서버 없이도 「무엇을
     무슨 값으로 불렀나」 를 그대로 잴 수 있습니다. 견본은 홍길동 (3번).  */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
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

/* 목각 1058행 그대로 — [열쇠, 며칠 뒤, calls 결과, 단계] */
const WANT = [
  ['call',  3, '상담', ''],
  ['miss',  1, '부재', '부재'],
  ['no',   30, '거절', '거절'],
  ['met',   3, '상담', '@next'],
  ['later', 7, '',     ''],
];

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

  console.log('\n📞 전화 기록 창 — 세 층이 서고, 날짜는 규칙이 정하는가');

  const R = await page.evaluate((want) => {
    const me = 'me-1';
    OS.profile = OS.profile || {}; OS.profile.id = me;
    OS.session = OS.session || { user: { id: me } };
    CM.pick = ''; CM.picked = true;
    window.hwhoFor = function () { return me; };

    /* 고객 한 분 — 다리로 배정 DB 줄과 이어져 있습니다 */
    const cli = [{ id: 'c1', advisor_id: me, name_masked: '홍○○', consent_status: 'none' }];
    CM.meta = { c1: { db: 'd1', next: { what: '만기 안내하고 다음 자리 잡기', due: '2026-09-01' } } };
    OSC.list = cli; OSC.loaded = true;
    AR.cliRows = [{ id: 'c1', who: me, name: '', nm: '홍○○' }];
    AR.db = [{ id: 'd1', who: me, name: '홍길동', region: '강남구', stage: 'AP', src: '배정', days: 3, appt: '' }];
    AR.calls = []; AR.loaded = true;
    /* hdbRow 가 이 줄을 찾아 줘야 단계를 압니다 */
    if (typeof HDB !== 'undefined') { HDB.rows = AR.db.slice(); }

    const out = { seen: [], six: {}, html: '', stageOf: '' };

    /* 창을 엽니다 */
    cshOpen('c1');
    out.html = (document.getElementById('cshHost') || {}).innerHTML || '';

    /* 고칠 수 있는 칸 여섯 */
    ['cshStage', 'cmCare', 'cmWorry', 'cmFam', 'cmNextWhat', 'cmTouchNote']
      .forEach(k => { out.six[k] = !!document.getElementById(k); });

    /* 결과 층에 날짜 칸이 있나 — 있으면 사장님이 고르게 하는 것입니다 */
    const sheet = document.getElementById('cshSheet');
    const third = sheet ? (sheet.querySelectorAll('[data-res]').length) : 0;
    out.resBtns = third;
    /* 결과 단추가 든 카드 안에 date 칸이 있나 */
    let dateInThird = 0;
    if (sheet) {
      const b = sheet.querySelector('[data-res]');
      const card = b ? b.closest('.t-card') : null;
      if (card) dateInThird = card.querySelectorAll('input[type="date"]').length;
    }
    out.dateInThird = dateInThird;

    /* 저장하는 넷을 바꿔치기해 지켜봅니다 */
    const real = { hdbCall: window.hdbCall, hdbTo: window.hdbTo,
                   cmNextSave: window.cmNextSave, ccMark: window.ccMark,
                   osClient: window.osClient, toast: window.toast };
    let direct = 0;
    window.osClient = function () { direct++; return real.osClient ? real.osClient.apply(null, arguments) : null; };
    window.toast = function () {};

    want.forEach(w => {
      const log = { key: w[0], call: null, to: null, due: '', mark: 0, direct0: direct };
      window.hdbCall = function (id, res) { log.call = res; };
      window.hdbTo = function (id, to) { log.to = to; };
      window.cmNextSave = function (id, what, due) { log.due = due; };
      window.ccMark = function () { log.mark++; };
      CSH.id = 'c1'; CSH.dbid = 'd1';
      cshMark('c1', w[0]);
      log.direct = direct - log.direct0;
      out.seen.push(log);
    });
    Object.keys(real).forEach(k => { window[k] = real[k]; });

    /* 오늘에서 며칠 뒤인지 견주려면 오늘이 필요합니다 */
    out.today = cmToday();
    out.stageOf = (AR.db[0] || {}).stage || '';
    out.nextOfAP = (typeof APEX_STAGE !== 'undefined') ? (APEX_STAGE.next('AP') || '') : '';
    cshClose();
    return out;
  }, WANT);

  console.log('\n[1] 창에서 고칠 수 있는 칸이 여섯이다');
  const 여섯 = [['cshStage', '단계'], ['cmCare', '요즘 상황'], ['cmWorry', '첫 문장에 붙일 말'],
                ['cmFam', '가족'], ['cmNextWhat', '다음에 할 것'], ['cmTouchNote', '들은 말']];
  여섯.forEach(([k, nm]) => is(R.six[k], '  ' + nm + ' (' + k + ')'));
  const n6 = 여섯.filter(([k]) => R.six[k]).length;
  is(n6 === 6, '  <b>여섯 개 다</b> 있다 — ' + n6 + '/6');

  console.log('\n[2] ★★ 결과 다섯이 단계와 다음 날짜를 표대로 바꾼다');
  const plus = (n) => {
    const d = new Date((new Date(R.today + 'T00:00:00+09:00')).getTime() + n * 86400000);
    return d.toISOString().slice(0, 10);
  };
  WANT.forEach((w, i) => {
    const g = R.seen[i] || {};
    const 원하는단계 = (w[3] === '@next') ? R.nextOfAP : w[3];
    is(g.due === plus(w[1]),
       '  ' + w[0] + ' — 다음에 뜰 날 <b>' + w[1] + '일 뒤</b> (' + plus(w[1]) + ') · 받은 것 ' + (g.due || '없음'));
    is((g.to || '') === (원하는단계 || ''),
       '  ' + w[0] + ' — 단계 <b>' + (원하는단계 || '그대로') + '</b> · 받은 것 ' + (g.to || '그대로'));
    is((g.call || '') === w[2],
       '  ' + w[0] + ' — calls 에 <b>' + (w[2] || '안 담음') + '</b> · 받은 것 ' + (g.call || '안 담음'));
    is(g.mark === 1, '  ' + w[0] + ' — 접촉 기록을 <b>한 번</b> 남긴다 (ccMark ' + g.mark + '번)');
  });

  console.log('\n[3] ★ 사장님께 날짜를 고르게 하지 않는다 — 규칙이 정한다');
  is(R.resBtns === 5, '  결과 단추가 <b>다섯</b>이다 — ' + R.resBtns + '개');
  is(R.dateInThird === 0, '  결과 층에 <b>날짜 칸이 없다</b> — ' + R.dateInThird + '개');

  console.log('\n[4] ★★ 새 저장 코드를 안 짰다 (S04)');
  const i0 = SRC.indexOf('function cshMark(');
  const body = SRC.slice(i0, SRC.indexOf('\n}', i0));
  is(i0 > 0, '  cshMark 이 있다');
  [['sb.from(', '서버를 직접 부르는 줄'], ['.insert(', '직접 넣는 줄'], ['.update(', '직접 고치는 줄']]
    .forEach(([k, nm]) => is(body.indexOf(k) < 0, '  ' + nm + '이 <b>없다</b> (' + k + ')'));
  [['hdbCall(', '통화 결과'], ['hdbTo(', '단계'], ['cmNextSave(', '다음에 뜰 날'], ['ccMark(', '접촉 기록']]
    .forEach(([k, nm]) => is(body.indexOf(k) >= 0, '  ' + nm + '은 <b>이미 있는 ' + k + '</b> 를 부른다'));
  R.seen.forEach(g => is(g.direct === 0, '  ' + g.key + ' — 서버를 직접 부른 횟수 0 (' + g.direct + ')'));

  console.log('\n[5] 말을 새로 쓰지 않고 apex-stage 에서 읽는다 (5번)');
  const i1 = SRC.indexOf('function cshHtml(');
  const hbody = SRC.slice(i1, SRC.indexOf('\n}', i1));
  is(hbody.indexOf('cmSayHtml(') >= 0, '  둘째 층은 <b>cmSayHtml</b> 을 부른다 — 판 ⑩ 의 그 카드');
  is(hbody.indexOf('cmNoteHtml(') >= 0, '  첫 층은 <b>cmNoteHtml</b> 을 부른다 — 베끼지 않았다');
  is(SRC.indexOf('function cmSayHtml') > 0 &&
     SRC.slice(SRC.indexOf('function cmSayHtml')).indexOf('APEX_STAGE.script') < 4000,
     '  그 카드가 <b>APEX_STAGE.script</b> 를 읽는다 — 말을 여기서 안 쓴다');

  console.log('\n[6] 「다음에」 는 calls 표에 안 담는다 (1번)');
  const later = R.seen.filter(x => x.key === 'later')[0] || {};
  is(!later.call, '  calls 에 <b>안 담았다</b> — ' + (later.call || '안 담음') +
     '\n      (그 표의 결과는 상담·부재·거절 셋뿐입니다. 상담으로 적으면 상담 수가 부풀고' +
     '\n       arStageOf 가 단계를 AP 로 올려 버립니다)');
  is(later.mark === 1 && later.due === plus(7),
     '  그래도 <b>접촉 기록과 다음 날짜</b>는 남는다 — ' + later.due);

  console.log('\n[7] 새 CSS 0줄 · 누르는 것 44px');
  const names = [];
  (R.html.match(/class="(t-[^"]*)"/g) || []).forEach(c => {
    c.replace(/class="|"/g, '').split(/\s+/).forEach(n => { if (n && names.indexOf(n) < 0) names.push(n); });
  });
  const 없는것 = names.filter(n => UICSS.indexOf('.' + n) < 0);
  is(names.length > 0 && 없는것.length === 0,
     '  t- 이름 ' + names.length + '개가 전부 ui.css 에 있다 — ' + names.join(' · ') +
     (없는것.length ? '\n      ✗ 없는 이름: ' + 없는것.join(' · ') : ''));
  const H = await page.evaluate(() => {
    cshOpen('c1');
    const sh = document.getElementById('cshSheet');
    const out = [].slice.call(sh ? sh.querySelectorAll('button') : [])
      .map(b => Math.round(b.getBoundingClientRect().height));
    cshClose();
    return out;
  });
  is(H.length > 0 && H.every(h => h >= 44),
     '  누르는 것 ' + H.length + '개가 모두 44px 이상 — ' + H.join(' · ') + 'px');

  console.log('\n[8] 조용히 터진 곳이 없다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? '\n      ✗ ' + errs.slice(0, 3).join('\n      ✗ ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데 — 전화하면서 그 자리에서 못 적으면 안 적게 됩니다.'); process.exit(1); }
  console.log('✓ 세 층이 서고, 날짜는 규칙이 정하고, 저장은 있던 넷을 부릅니다 (새 저장 코드 0줄).');
})().catch(e => { console.error(e); process.exit(1); });
