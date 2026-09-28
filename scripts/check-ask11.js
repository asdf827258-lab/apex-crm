/* ❓ <b>앱이 여쭙는 열한 가지</b> — 미리 적어 둔 것이 아닌가 (판 ⑥).

   사장님 말씀 — 「질문을 미리 적어 두지 않습니다. 그 고객의 <b>상황을
   보고</b> 그때 생깁니다.」 목각 asksOf(hansaram.html 1173행).

   여기서 확인합니다.
     1. 열한 가지가 <b>글자 그대로</b> 있는가 — 하나라도 빠지면 안 끝난 것
     2. ★★ <b>상황을 보고 생기고 없어지는가</b> — 상황을 바꾸면 물음이
        나타났다 사라진다. 미리 적어 둔 것이면 안 바뀝니다
     3. ★ <b>한 번에 하나만</b> 여쭙는가
     4. ★ 상황 물음이 <b>CM_FIELDS 물음보다 먼저</b> 서는가 —
        답을 비우면 서고, 다 답하면 물러서는가
     5. 답하면 <b>첫 문장과 상황이 진짜 칸에도</b> 적히는가 —
        그래야 홈 카드가 그 말로 바뀝니다. 답만 쌓아 두면 화면은 그대로
     6. 답한 것이 <b>「✅ 여쭤서 알게 된 것」</b> 에 쌓이고
        <b>「다시 묻기」</b> 로 되돌려지는가
     7. <b>「그래서 다음엔」</b> 이 답에 따라 바뀌는가
     8. ★ <b>모르면 안 여쭙는가</b> (1번) — 단계를 모르면 단계로 갈리는
        물음(걸리는 것·소개·주민번호)을 안 세운다
     9. 쓴 t- 이름이 전부 ui.css 에 있는가 (새 CSS 0줄)
    10. ★ <b>홈에서는 물음과 고를 것만</b> 서는가 — 답이 쌓여도
        홈이 안 길어지는가. 상세에는 그대로 다 서는가 (6번)

   ★ 견본 이름은 <b>홍길동</b> 입니다 (3번). 목각의 가짜 이름 일곱은
     가져오지 않았습니다.                                              */

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

/* 열한 가지 — 사장님 점검표 [1] 글자 그대로 */
const ELEVEN = [
  ['block', '무엇이 걸리셨을까요?'],
  ['due',   '만기 안내부터 할까요, 새로 제안할까요?'],
  ['clm',   '청구부터 도와드릴까요?'],
  ['when',  '언제 뵙는 게 좋을까요?'],
  ['ref',   '이 자리에서 소개를 여쭐까요?'],
  ['hook',  '이분이 제일 걱정하시는 게 뭔가요?'],
  ['care',  '요즘 이분께 무슨 일이 있나요?'],
  ['kb',    '증권을 갖고 계신가요?'],
  ['gap',   '비어 있는 곳 중 어디부터 여쭐까요?'],
  ['rrn',   '주민등록번호를 지금 적어 둘까요?'],
  ['age',   '상령일 이야기를 꺼낼까요?'],
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

  console.log('\n❓ 앱이 여쭙는 열한 가지 — 상황을 보고 생기는가');

  const R = await page.evaluate(() => {
    const me = 'me';
    OS.profile = { id: me, user_id: me, name: '홍길동', role: 'fp', team: 'A', active: true };
    OS.session = { user: { id: me } };
    OSC.loaded = true; OSC.list = [{ id: 'c1', name_masked: '홍○○', advisor_id: me }];
    CM.loaded = true;
    AR.loaded = true; AR.cliRows = [{ id: 'c1', who: me, nm: '홍○○' }];
    AR.db = [{ id: 'd1', who: me, name: '홍길동', region: '강남구', stage: 'AP', appt: '' }];
    if (typeof HDB !== 'undefined') HDB.rows = AR.db.slice();
    window.hwhoFor = function () { return me; };

    const blank = () => { const m = cmBlank(); m._rid = 'r1'; return m; };
    const set = (patch) => { const m = blank(); for (const k in patch) m[k] = patch[k]; CM.meta = { c1: m }; };
    const qs = () => cqaSitOf('c1').map(x => x.id);
    const one = () => { const L = cqaSitOf('c1'); return L.length ? L[0] : null; };

    const out = {};

    /* ── 열한 가지가 다 나오게 상황을 만들어 본다 ── */
    out.all = {};
    /* hook · care · kb 는 빈 칸이면 바로 섭니다 */
    set({ db: 'd1' });
    qs().forEach(k => { out.all[k] = true; });
    /* block — PC 에서 오래 조용할 때 */
    AR.db[0].stage = 'PC';
    set({ db: 'd1', touch: [{ at: '2020-01-01', how: '전화' }] });
    qs().forEach(k => { out.all[k] = true; });
    /* due */
    set({ db: 'd1', due: '2026-12-31' });
    qs().forEach(k => { out.all[k] = true; });
    /* when — 만나는 단계인데 약속 없음 */
    AR.db[0].stage = 'AP'; AR.db[0].appt = '';
    set({ db: 'd1' });
    qs().forEach(k => { out.all[k] = true; });
    /* ref — 증권전달 */
    AR.db[0].stage = '증권전달';
    set({ db: 'd1' });
    qs().forEach(k => { out.all[k] = true; });
    /* rrn — CS 에서 주민번호가 없을 때 */
    AR.db[0].stage = 'CS';
    set({ db: 'd1' });
    qs().forEach(k => { out.all[k] = true; });
    /* gap — 8통장을 붙였고 빈 칸이 있을 때 */
    set({ db: 'd1', wal: { at: '2026-09-01', lv: { 1: 'low', 2: 'ok', 3: 'ok', 4: 'ok', 5: 'ok', 6: 'ok', 7: 'ok', 8: 'ok' } } });
    qs().forEach(k => { out.all[k] = true; });
    /* clm — 받은 돈이 안 적힌 청구 */
    set({ db: 'd1' });
    try { cmClmSet('c1', [{ at: '2026-09-01', what: '입원', wonR: '' }]); } catch (e) {}
    qs().forEach(k => { out.all[k] = true; });
    /* age — 주민번호가 있고 상령일이 가까울 때는 기기에 넣어 봐야 압니다 */
    out.ageReachable = (typeof cqaInsAge === 'function');

    /* ── 상황을 바꾸면 생기고 없어지는가 ── */
    try { cmClmSet('c1', []); } catch (e) {}
    AR.db[0].stage = 'AP';
    set({ db: 'd1' });
    out.beforeHook = qs().indexOf('hook') >= 0;
    set({ db: 'd1', worry: '아이 교육비' });
    out.afterHook = qs().indexOf('hook') >= 0;

    /* ── 한 번에 하나만 ── */
    set({ db: 'd1' });
    const card = cqaHtml('c1');
    out.qInCard = (card.match(/왜 묻나/g) || []).length;
    out.sitCount = qs().length;
    out.card = card;

    /* ── 상황 물음이 먼저 서는가 ── */
    out.sitFirst = card.indexOf('왜 묻나') >= 0;
    set({ db: 'd1', ask: { block: 1, due: 1, clm: 1, when: 1, ref: 1, hook: 1, care: 1, kb: 1, gap: 1, rrn: 1, age: 1 } });
    const card2 = cqaHtml('c1');
    out.afterAllAnswered = card2.indexOf('왜 묻나') < 0;
    out.knewShown = card2.indexOf('여쭤서 알게 된 것') >= 0;
    out.clearBtn = card2.indexOf('다시 묻기') >= 0;

    /* ── 「그래서 다음엔」 ── */
    set({ db: 'd1', ask: { block: '돈이 부담' } });
    out.way1 = cqaWayOf('c1');
    set({ db: 'd1', ask: { block: '회사가 마음에 안 드심' } });
    out.way2 = cqaWayOf('c1');

    /* ── 답하면 진짜 칸에도 적히는가 (cmSave 를 지켜본다) ── */
    set({ db: 'd1' });
    let saved = null;
    const realSave = window.cmSave;
    window.cmSave = function (id, patch, then) { saved = patch; if (then) then(); };
    cqaSitSave('c1', 'hook', '아이 교육비');
    out.hookPatch = saved;
    cqaSitSave('c1', 'care', '출산 · 육아');
    out.carePatch = saved;
    cqaSitSave('c1', 'block', '돈이 부담');
    out.blockPatch = saved;
    window.cmSave = realSave;

    /* ── 모르면 안 여쭙는다 — 다리가 없어 단계를 모를 때 ──
       ★ <b>오래 조용한</b> 상태로 둡니다(touch 가 옛날). 안 그러면
         단계를 무시하게 고쳐도 block 이 어차피 안 서서 <b>이 자가
         안 울립니다</b> — 되돌려 보고 알았습니다 (8번).            */
    set({ touch: [{ at: '2020-01-01', how: '전화' }] });   /* db 없음 → 단계 모름 */
    out.noStage = qs();
    out.noStageIdle = (function () { try { return cmTemp('c1').d; } catch (e) { return -1; } })();

    return out;
  });

  console.log('\n[1] 열한 가지가 글자 그대로 있다');
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  ELEVEN.forEach(([k, q]) => is(src.indexOf(q) >= 0, '  ' + k + ' — 「' + q + '」'));
  const 있는것 = ELEVEN.filter(([, q]) => src.indexOf(q) >= 0).length;
  is(있는것 === 11, '  <b>열한 가지 다</b> 있다 — ' + 있는것 + '/11');

  console.log('\n[2] ★★ 상황을 보고 생긴다 — 상황마다 실제로 섰는가');
  ELEVEN.forEach(([k]) => {
    if (k === 'age') { is(R.ageReachable, '  age — 상령일을 세는 길이 있다 (cqaInsAge)'); return; }
    is(!!R.all[k], '  ' + k + ' — 그 상황을 만들면 <b>선다</b>');
  });

  console.log('\n[3] ★ 상황이 바뀌면 없어진다 — 미리 적어 둔 것이 아니다');
  is(R.beforeHook, '  첫 문장이 비면 「제일 걱정」 을 <b>여쭙는다</b>');
  is(!R.afterHook, '  적어 두면 <b>그 물음이 없어진다</b>');

  console.log('\n[4] ★ 한 번에 하나만 여쭙는다');
  is(R.sitCount > 1, '  설 수 있는 물음이 여럿이다 — ' + R.sitCount + '가지');
  is(R.qInCard === 1, '  그런데 카드에는 <b>하나만</b> 섰다 — ' + R.qInCard + '개');
  is(R.card.indexOf('남은 ' + (R.sitCount - 1) + '가지') >= 0,
     '  나머지는 <b>「이것부터 답하시면 그때」</b> 라고 적는다 — 감추지 않는다');

  console.log('\n[5] ★ 상황 물음이 CM_FIELDS 물음보다 먼저 선다');
  is(R.sitFirst, '  답이 없으면 <b>상황 물음</b>이 선다');
  is(R.afterAllAnswered, '  열한 가지에 다 답하면 <b>물러선다</b> — 그때 CM_FIELDS 물음 차례');

  console.log('\n[6] 답한 것이 쌓이고 「다시 묻기」 로 되돌려진다');
  is(R.knewShown, '  <b>「✅ 여쭤서 알게 된 것」</b> 이 선다');
  is(R.clearBtn, '  <b>「다시 묻기」</b> 가 있다');

  console.log('\n[7] 「그래서 다음엔」 이 답에 따라 바뀐다');
  is(!!R.way1 && !!R.way2 && R.way1 !== R.way2,
     '  답이 다르면 말도 다르다 —\n      「돈이 부담」 → ' + (R.way1 || '없음').replace(/<[^>]*>/g, '') +
     '\n      「회사가 마음에 안 드심」 → ' + (R.way2 || '없음').replace(/<[^>]*>/g, ''));

  console.log('\n[8] ★ 답하면 진짜 칸에도 적힌다 — 그래야 홈 카드가 바뀐다');
  is(R.hookPatch && R.hookPatch.worry === '아이 교육비',
     '  「제일 걱정」 은 <b>worry 칸</b>에도 — ' + ((R.hookPatch && R.hookPatch.worry) || '안 적힘'));
  is(R.carePatch && R.carePatch.care === '출산 · 육아',
     '  「요즘 상황」 은 <b>care 칸</b>에도 — ' + ((R.carePatch && R.carePatch.care) || '안 적힘'));
  is(R.blockPatch && R.blockPatch.ask && R.blockPatch.ask.block === '돈이 부담' &&
     R.blockPatch.worry === undefined,
     '  그 밖의 답은 <b>ask 에만</b> — 엉뚱한 칸을 안 건드린다');

  console.log('\n[9] ★ 모르면 안 여쭙는다 (1번) — 단계를 모를 때');
  ['block', 'ref', 'rrn'].forEach(k => is(R.noStage.indexOf(k) < 0,
    '  단계를 모르면 「' + (ELEVEN.filter(e => e[0] === k)[0] || [])[1] + '」 를 <b>안 세운다</b>'));
  is(R.noStage.length > 0, '  그래도 단계와 상관없는 물음은 <b>선다</b> — ' + R.noStage.join(' · '));
  /* ★ 이 자가 울릴 수 있는지 그 자리에서 증명합니다 — 오래 조용한 상태여야
     「단계를 무시하면 block 이 선다」 가 성립합니다 (8번).            */
  is(R.noStageIdle >= 7,
     '  ★ 그 견본은 <b>' + R.noStageIdle + '일째 조용</b>하다 — 단계만 무시하면 block 이 서는 상태다' +
     (R.noStageIdle >= 7 ? '' : '\n      ✗ 이대로면 단계를 무시하게 고쳐도 이 자가 안 울립니다'));

  /* ══════════════════════════════════════════════════════════════════
     [홈] ★ <b>홈에서는 물음과 고를 것만</b> — 답이 쌓여도 홈이 안 길어진다
     ──────────────────────────────────────────────────────────────────
     2026-09-29 에 실제로 터진 자리입니다. 판 ⑥ 이 홈에도 <b>이름표 ·
     귀띔 · 「남은 N가지」</b> 를 같이 세웠더니 카드가 <b>254px 에서
     448px</b> 로 부풀어 홈이 3.78 → 3.99화면이 됐고, check-homeone ·
     check-msfive · check-toss <b>셋이 한꺼번에</b> 울었습니다.
     ⚠ 그 셋은 <b>답이 하나도 없는 판</b>만 잽니다. 답이 쌓이면
       「✅ 여쭤서 알게 된 것」 이 줄을 열하나까지 늘리는데, 그 판은
       <b>아무도 안 재고 있었습니다.</b> 그 구멍을 여기서 막습니다 —
       답 0개 · 10개 · 11개 세 판을 다 봅니다.
     ★ <b>감춘 것이 아닙니다</b> (6번) — 상세에는 셋이 그대로 서고,
       「다시 묻기」 도 거기 있습니다. 그것도 여기서 같이 봅니다.       */
  console.log('\n[홈] ★ 홈에서는 <b>물음과 고를 것만</b> — 답이 쌓여도 홈이 안 길어진다');
  const HM = await page.evaluate(() => {
    const set = (patch) => { const m = cmBlank(); m._rid = 'r1';
      for (const k in patch) m[k] = patch[k]; CM.meta = { c1: m }; };
    const has = (s) => ({ lab: s.indexOf('❓ 여쭙겠습니다') >= 0,
                          knew: s.indexOf('여쭤서 알게 된 것') >= 0,
                          left: /남은 \d+가지는/.test(s),
                          clear: s.indexOf('다시 묻기') >= 0,
                          rows: (s.match(/class="t-row"/g) || []).length,
                          ask: s.indexOf('왜 묻나') >= 0 });
    const TEN = { block:1, due:1, clm:1, when:1, ref:1, care:1, kb:1, gap:1, rrn:1, age:1 };
    const ALL = { block:1, due:1, clm:1, when:1, ref:1, hook:1, care:1, kb:1, gap:1, rrn:1, age:1 };
    const out = {};
    set({ db:'d1' });                 out.cmp0  = has(cqaHtml('c1',1)); out.full0  = has(cqaHtml('c1'));
    set({ db:'d1', ask:TEN });        out.cmp10 = has(cqaHtml('c1',1)); out.full10 = has(cqaHtml('c1'));
    set({ db:'d1', ask:ALL });        out.cmp11 = has(cqaHtml('c1',1)); out.full11 = has(cqaHtml('c1'));
    return out;
  });
  is(HM.cmp0.ask && !HM.cmp0.lab && !HM.cmp0.left,
     '  홈은 <b>물음과 고를 것만</b> — 이름표도 「남은 N가지」 도 안 선다');
  is(HM.full0.ask && HM.full0.lab && HM.full0.left,
     '  상세에는 <b>셋이 그대로</b> 선다 — 감춘 것이 아니다 (6번)');
  is(HM.cmp10.ask && !HM.cmp10.knew && !HM.cmp10.clear && HM.cmp10.rows === 0,
     '  <b>열 가지를 답해 두어도</b> 홈에는 안 쌓인다 — 줄 ' + HM.cmp10.rows + '개');
  is(HM.full10.knew && HM.full10.clear && HM.full10.rows === 10,
     '  상세에는 <b>열 줄이 쌓이고</b> 「다시 묻기」 가 있다 — 줄 ' + HM.full10.rows + '개');
  is(!HM.cmp11.knew && HM.cmp11.rows === 0,
     '  <b>열한 가지를 다 답해도</b> 홈에는 한 줄도 안 쌓인다');
  is(HM.full11.knew && HM.full11.rows === 11,
     '  상세에는 <b>열한 줄이 다</b> 남는다 — 줄 ' + HM.full11.rows + '개');

  /* ★ <b>글자로만 재지 않습니다</b> — 진짜 홈을 열어 자로 잽니다.
     열 가지를 답해 둔 판입니다(가장 길어지는 판).
     ⚠ 홈 줄이 쓰는 id 는 <b>배정 DB 줄의 id(d1)</b> 입니다 — 고객 id(c1)
       에만 답을 넣어 두면 홈 카드에는 답이 하나도 없어, 「쌓인 답이
       홈을 늘리는가」 를 <b>재지 못한 채</b> 초록이 됩니다. 되돌려 보고
       알았습니다 (8번). 그래서 <b>두 id 에 다</b> 넣습니다.          */
  await page.evaluate(() => {
    const mk = () => { const m = cmBlank(); m._rid = 'r1'; m.db = 'd1';
      m.ask = { block:1, due:1, clm:1, when:1, ref:1, care:1, kb:1, gap:1, rrn:1, age:1 };
      return m; };
    CM.meta = { c1: mk(), d1: mk() };
    try { HM_MORE = true; } catch (e) {}
    go('home');
  });
  await page.waitForTimeout(1600);
  const PX = await page.evaluate(() => {
    const c = document.getElementById('cqaCard');
    if (!c) return { no: true };
    const small = [...c.querySelectorAll('*')].filter(e => {
      const st = getComputedStyle(e);
      return parseFloat(st.fontSize) < 13 && (e.innerText || '').trim() &&
             e.getBoundingClientRect().height > 0;
    }).length;
    /* ★ 그 줄이 <b>정말 답을 들고 있는지</b> 같이 셉니다 — 안 그러면
       답 0개짜리 줄을 재고도 초록이 됩니다 (헛초록) */
    const hid = (c.innerHTML.match(/cqaSitSave\('([^']*)'/) || [])[1] || '';
    let answered = -1;
    try { answered = Object.keys(cqaAnsOf(hid) || {}).length; } catch (e) {}
    return { h: Math.round(c.getBoundingClientRect().height), small, hid, answered,
             rows: (c.innerHTML.match(/class="t-row"/g) || []).length };
  });
  is(!PX.no && PX.h > 0 && PX.h <= 300 && PX.answered === 10,
     '  진짜 홈에서 재면 카드가 <b>' + (PX.no ? '안 섭니다' : PX.h + 'px') + '</b> — 300px 이하 ' +
     '(부풀었을 때 448px · 그 줄에 답 ' + (PX.no ? '?' : PX.answered) + '개를 넣어 두고 잽니다)');
  /* ui.css 의 이름표(11.5px)·귀띔(12.5px)은 목각이 정한 크기라 <b>글자를
     키워 피할 수 있는 것이 아닙니다</b> — 홈에서는 안 세우는 것이 답입니다 */
  is(!PX.no && PX.small === 0 && PX.rows === 0,
     '  그 카드에 <b>13px 아래 글자가 0개</b>다 — check-toss 의 기준선을 안 밀어 올린다 (' +
     (PX.no ? '카드 없음' : PX.small + '개 · 줄 ' + PX.rows + '개') + ')');

  console.log('\n[10] 새 CSS 0줄');
  const names = [];
  (R.card.match(/class="(t-[^"]*)"/g) || []).forEach(c => {
    c.replace(/class="|"/g, '').split(/\s+/).forEach(n => { if (n && names.indexOf(n) < 0) names.push(n); });
  });
  const 없는것 = names.filter(n => UICSS.indexOf('.' + n) < 0);
  is(names.length > 0 && 없는것.length === 0,
     '  t- 이름 ' + names.length + '개가 전부 ui.css 에 있다 — ' + names.join(' · ') +
     (없는것.length ? '\n      ✗ 없는 이름: ' + 없는것.join(' · ') : ''));

  console.log('\n[11] 조용히 터진 곳이 없다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? '\n      ✗ ' + errs.slice(0, 3).join('\n      ✗ ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데 — 미리 적어 둔 질문은 그 고객의 것이 아닙니다.'); process.exit(1); }
  console.log('✓ 열한 가지가 상황을 보고 생기고, 한 번에 하나만 여쭙고, 답이 진짜 칸에도 적힙니다.');
})().catch(e => { console.error(e); process.exit(1); });
