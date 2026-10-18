#!/usr/bin/env node
/* ═════════════════════════════════════════════════════════════════
   check-rjnews.js — 📰 <b>거절 고객 소식</b>이 서나 (판 X129 · 2026-10-18)

   사장님 말씀 — 「거절 고객들에게도 보험 점검, 경제뉴스, 연금뉴스등 전달할
   수 있도록 만들고 매일 · 뉴스는 지금 불러오고 있는거 알고 있어서 활용잘하도록」.

   여태 거절하신 분의 카톡 글에는 <b>소식이 한 줄도 안 들어갔습니다</b> —
   배정 DB 에서 온 분은 적힌 것이 없어 apex-newsfit 이 「아직 읽을 것이 없다」
   고 했기 때문입니다. 인사와 「전화 드려도 될까요」 만 나갔습니다.

   재는 것
     [1] 표가 <b>하나</b>인가 — 소식 갈래표(RJN_TOPICS) 하나 · 누구에게는 arTouch 한 곳 ·
         카톡 글은 hmMsKt 한 곳 · 통화 기록(calls)에 안 적나.
     [2] 화면이 서나 — 팔지 않는다 · <b>받을 뜻</b>을 밝힌 분께만이라는 말.
     [3] ★ <b>매일 바뀌나</b> — 닷새 동안 다섯 갈래가 다 한 번씩.
     [4] ★★ 받아 둔 <b>진짜 기사</b>가 글에 들어가나 · 그만 받는 길이 붙나 ·
         숫자·실명이 없나 · 보험 점검은 기사 없이 서나.
     [5] ★★ 기사가 없으면 <b>지어내지 않나</b> (1번).
     [6] 누구에게 — 기준이 지난 분만 · 그만 받으신 분은 빼고 · 이름은 가린 꼴 ·
         <b>읽은 분과 못 읽은 분을 갈라 말하나</b>.
     [7] ★★ 「보냈습니다」 가 서버 한 줄에 <b>번호와 날짜만</b> 적히고, 이 화면과
         「오늘 터치할 사람」 에서 <b>같이</b> 빠지나 (5번).
     [8] ★ 「그만 받기」 도 서버에 적히고 다시 안 서나 · 되돌릴 수 있나.
     [9] 홈 아침 미션 카톡에도 같은 소식이 들어가나 — 거절이 아닌 분은 그대로인가.
     [10] 폰 390px · 콘솔 에러 0.

   견본 이름은 「홍길동」 계열입니다 (3번).
   ═════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8853;
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
               '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const STUB = `
window.supabase={createClient:function(){
 var mk=function(){var a={select:function(){return a},eq:function(){return a},order:function(){return a},
  limit:function(){return a},single:function(){return a},in:function(){return a},gte:function(){return a},
  lte:function(){return a},is:function(){return a},neq:function(){return a},not:function(){return a},
  range:function(){return a},insert:function(){return a},update:function(){return a},upsert:function(){return a},
  then:function(r){return Promise.resolve({data:[],error:null}).then(r)}};a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({})},getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'u1',email:'u1@example.com'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'u1'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;
function serve() {
  return http.createServer((rq, rs) => {
    const f = path.join(ROOT, decodeURIComponent(rq.url.split('?')[0].split('#')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
    rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(rs);
  }).listen(PORT);
}
const SEL = '#osLoginGate,#osGuide,[id$="Ovl"],[id$="Pop"]';
const clearOvl = pg => pg.evaluate(sel => {
  const wipe = () => document.querySelectorAll(sel).forEach(x => x.remove());
  wipe();
  if (!window.__ovlWatch) {
    window.__ovlWatch = new MutationObserver(wipe);
    window.__ovlWatch.observe(document.body, { childList: true, subtree: false });
  }
}, SEL);


const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = nm => { const m = new RegExp('function ' + nm + '\\([^)]*\\)\\{([\\s\\S]*?)\\n\\}').exec(CODE); return m ? m[1] : ''; };

head('[1] 표가 <b>하나</b>인가 (5번)');
{
  is((CODE.match(/var RJN_TOPICS\s*=/g) || []).length === 1, '소식 갈래표(RJN_TOPICS)는 <b>한 번만</b> 선다');
  const T = /var RJN_TOPICS=\[([\s\S]*?)\n\];/.exec(CODE);
  is(!!T && /보험 점검/.test(T[1]) && /경제/.test(T[1]) && /연금/.test(T[1]),
     '  갈래에 <b>보험 점검 · 경제 · 연금</b>이 있다 — 사장님이 말씀하신 셋');
  is(/function rjnPeople\(\)\{[\s\S]{0,300}arTouch\(/.test(CODE), '  누구에게는 <b>arTouch</b> 가 정한다 — 여기서 다시 세지 않는다');
  is(/rjnOf\(r\.id\)/.test(fnBody('arTouch')), '  ★ arTouch 가 보낸 날·그만 받기를 <b>같이</b> 본다 — 두 화면이 같은 말을 한다');
  is(/rjnBody\(\)/.test(fnBody('hmMsKt')) && /hmMsKt\(/.test(fnBody('rjnMsg')), '  카톡 글은 <b>hmMsKt 한 곳</b>이 만든다 — 홈과 이 화면이 같은 글');
  const rj = CODE.slice(CODE.indexOf('var RJN_KIND'), CODE.indexOf('function rjnCss'));
  is(rj.length > 1000 && !/from\('calls'\)|hdbCall\(/.test(rj), '  ★ 통화 기록(calls)에 <b>안 적는다</b> — 소식 문자를 거절·빈칸으로 적으면 수가 부풀거나 단계가 내려간다');
  is(/\{id:'rjnews'[^}]*title:'거절 고객 소식'/.test(SRC), '메뉴(TABS)에 「거절 고객 소식」 이 있다');
}

const NEWS = [
  { t: '기준금리 동결 — 대출 금리 흐름은', u: 'https://example.com/econ', s: '연합뉴스', d: '2026-10-17', cats: ['econ'] },
  { t: '국민연금 수령 시기 미루면 달라지는 것', u: 'https://example.com/pen', s: '한겨레', d: '2026-10-17', cats: ['help'] },
  { t: '실손보험 갱신 보험료 안내', u: 'https://example.com/ins', s: '매일경제', d: '2026-10-17', cats: ['ins'] }
];

(async () => {
  const srv = serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1440, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await pg.addInitScript(STUB);
  await pg.addInitScript(n => { try { localStorage.setItem('apex_guide_seen_v2', '1');
    localStorage.removeItem('apex_rjn_pick');
    localStorage.setItem('apex_newslive', JSON.stringify({ at: '2026-10-17', got: 3, drop: 0, items: n })); } catch (e) {} }, NEWS);
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof renderRjNews === 'function' && typeof arTouch === 'function' &&
                                 typeof hmMsKt === 'function' && typeof go === 'function', { timeout: 60000 });
  await clearOvl(pg);
  await pg.evaluate(() => {
    OS.profile = OS.profile || { id: 'u1', name: '홍길동', role: 'fp' };
    window.confirm = function () { return true; };
    window.copyText = function (t) { window.__copied = t; };
    window.cmUid = function () { return 'u1'; };
    window.hwhoFor = function () { return ''; };
    /* 서버에 무엇이 적히나 — 적는 것만 붙잡습니다 */
    window.__w = [];
    /* 무엇을 이어 불러도 같은 사슬 — 다른 화면이 limit·order 를 불러도 안 터지게 */
    const chain = res => { const a = new Proxy({}, { get: (o, k) => k === 'then' ? ((f, g) => Promise.resolve(res).then(f, g)) : (() => a) }); return a; };
    window.osClient = function () { return { from: tb => ({
      insert: o => { __w.push({ tb, op: 'insert', o }); return chain({ data: [{ id: 'rr1' }], error: null }); },
      update: o => { __w.push({ tb, op: 'update', o }); return chain({ data: [], error: null }); },
      select: () => chain({ data: [], error: null }), upsert: () => chain({ data: [], error: null }),
      delete: () => chain({ data: [], error: null }) }), rpc: () => chain({ data: null, error: null }) }; };
    nlLoad();
    AR.loaded = true; AR.busy = ''; AR.err = '';
    AR.db = [
      { id: 'r1', who: 'u1', name: '홍길동가', region: '순천', src: '개척', stage: '거절', days: 20, n: 1, res: '거절', cAt: '', pAt: '' },
      { id: 'r2', who: 'u1', name: '홍길동나', region: '순천', src: '개척', stage: '거절', days: 3, n: 1, res: '거절', cAt: '', pAt: '' },
      { id: 'r3', who: 'u1', name: '홍길동다', region: '광양', src: '소개', stage: '거절', days: 30, n: 2, res: '거절', cAt: '', pAt: '',
        memo: '실손 갱신 보험료 부담된다고 하심', last: '2026-09-15' },
      { id: 'r4', who: 'u1', name: '홍길동라', region: '광양', src: '소개', stage: '거절', days: 40, n: 2, res: '거절', cAt: '', pAt: '' },
      { id: 'r5', who: 'u1', name: '홍길동마', region: '순천', src: '일반', stage: '미접촉', days: 5, n: 0, res: '미진행', cAt: '', pAt: '' }
    ];
    AR.cliRows = []; AR.calls = [];
    rjnTake({ data: [{ id: 'oth', advisor_id: 'u9', content: { sent: {}, stop: { r4: '2026-10-01' } } }] }, 'u1');
  });
  await pg.evaluate(() => go('rjnews'));
  await pg.waitForTimeout(400);
  const txt = () => pg.evaluate(() => (document.querySelector('.tab-pane.on') || document.body).innerText || '');

  head('[2] 화면이 서나 — 팔지 않는다 · 받을 뜻 (3번·준법)');
  const t2 = await txt();
  is(/거절 고객 소식/.test(t2), '메뉴에서 열린다 — 「📰 거절 고객 소식」');
  is(/팔지 않습니다/.test(t2), '「<b>팔지 않습니다</b>」 를 먼저 말한다');
  is(/받을 뜻을 미리 밝힌 분께만/.test(t2) && /준법/.test(t2), '  ★ 광고성 문자는 <b>받을 뜻을 밝힌 분께만</b> — 회사 준법 기준을 따르라고 적는다');

  head('[3] ★ <b>매일 바뀌나</b> — 닷새 동안 다섯 갈래');
  const rot = await pg.evaluate(() => {
    const keep = window.rjnToday, out = [];
    for (let i = 0; i < 5; i++) { window.rjnToday = () => '2026-11-0' + (i + 1); out.push(rjnTopicToday().k); }
    window.rjnToday = keep; return out;
  });
  is(new Set(rot).size === 5, '닷새 동안 <b>다섯 갈래가 다</b> 한 번씩 — ' + rot.join(' → '));

  head('[4] ★★ 받아 둔 <b>진짜 기사</b>가 들어가나 · 그만 받는 길 · 숫자·실명 없음');
  const m4 = await pg.evaluate(() => { rjnPick('econ'); const e = rjnMsg(''); rjnPick('pen'); const p = rjnMsg('');
    rjnPick('check'); const c = rjnMsg(''); return { e, p, c, t: (document.querySelector('#rjnBox') || {}).innerText || '' }; });
  is(m4.e.indexOf('기준금리 동결') >= 0 && m4.e.indexOf('https://example.com/econ') >= 0, '경제 소식 — 받아 둔 기사 <b>제목과 링크</b>가 그대로');
  is(m4.p.indexOf('국민연금 수령') >= 0, '연금 소식 — 제목에 「연금」 이 든 기사를 고른다 (갈래가 지원금이어도)');
  is(/그만/.test(m4.e) && /그만/.test(m4.c), '  ★ 글 끝에 <b>그만 받는 길</b>이 붙는다');
  is(/증권만 보고 정리/.test(m4.c) && m4.c.indexOf('https://') < 0, '보험 점검 — <b>기사 없이</b> 서는 글');
  const strip = t => t.split('\n').filter(l => !/^https?:\/\//.test(l.trim()) && !/^\[/.test(l.trim())).join('\n');
  is(![m4.e, m4.p, m4.c].some(t => /[0-9]/.test(strip(t))), '  말 안에 <b>숫자가 없다</b> (2번 — 링크·기사 제목은 원문 그대로)');
  is(![m4.e, m4.p, m4.c].some(t => /홍길동/.test(t)), '  <b>이름이 안 들어간다</b> — 「고객님」 (3번)');
  is(/고르신 것 · 오늘만/.test(m4.t), '손으로 고르면 <b>「고르신 것 · 오늘만」</b> 이라고 밝힌다');

  head('[5] ★★ 기사가 없으면 <b>지어내지 않는다</b> (1번)');
  const m5 = await pg.evaluate(() => { const keep = NLIVE.items; NLIVE.items = keep.filter(x => !/연금/.test(x.t));
    rjnPick('pen'); const r = { m: rjnMsg(''), t: document.querySelector('#rjnBox').innerText };
    NLIVE.items = keep; rjnPick('econ'); return r; });
  is(/아직 못 받았습니다/.test(m5.t) && /지어내지 않습니다/.test(m5.t), '「연금」 기사가 없으면 <b>못 받았다</b>고 적는다');
  is(m5.m.indexOf('https://') < 0 && !/소식이 있어/.test(m5.m), '  그때 글에 <b>기사도 빈말도 없다</b>');
  is(/기사 없음/.test(m5.t), '  고르는 칩에도 「기사 없음」 이 선다');

  head('[6] 누구에게 — 기준이 지난 분만 · 그만 받으신 분은 빼고 · 이름은 가린 꼴');
  const p6 = await pg.evaluate(() => ({ ids: rjnPeople().map(x => x.id), t: document.querySelector('#rjnBox').innerText }));
  is(p6.ids.indexOf('r1') >= 0 && p6.ids.indexOf('r3') >= 0,
     '거절하고 기준(' + 14 + '일)이 지난 두 분이 선다 — ' + p6.ids.join(','));
  is(p6.ids.indexOf('r2') < 0, '  사흘밖에 안 된 분은 <b>안 선다</b>');
  is(p6.ids.indexOf('r4') < 0, '  ★ <b>그만 받으신 분</b>은 다른 사람이 적었어도 안 선다');
  is(p6.ids.indexOf('r5') < 0, '  거절이 아닌 분은 안 선다');
  is(p6.t.indexOf('홍길동가') < 0 && /홍\*+가/.test(p6.t), '  이름은 <b>가린 꼴</b>로만 (3번)');
  is(/적힌 것을 읽어/.test(p6.t) && /이 분을 읽어 고른 것이 아닙니다/.test(p6.t),
     '  ★★ <b>읽은 분</b>(메모가 있는 분)과 <b>못 읽은 분</b>을 갈라 말한다 — 고른 척하지 않는다 (1번)');
  const own = await pg.evaluate(() => rjnMsg('r3'));
  is(own.indexOf('실손보험 갱신') >= 0, '  읽은 분 글에는 <b>그 분 갈래 기사</b>가 들어간다');

  head('[7] ★★ 「보냈습니다」 — 번호와 날짜만 · 두 화면에서 같이 빠진다');
  await pg.evaluate(() => { __w.length = 0; rjnSent('r1'); });
  await pg.waitForTimeout(250);
  const w7 = await pg.evaluate(() => ({ w: JSON.parse(JSON.stringify(__w)), ids: rjnPeople().map(x => x.id),
    tk: arTouch('').filter(x => x.k === '거절').map(x => x.id), t: document.querySelector('#rjnBox').innerText, today: rjnToday() }));
  const ins = w7.w.filter(x => x.tb === 'saved_reports')[0];
  is(!!ins && ins.o.kind === 'rj_news' && ins.o.content && ins.o.content.sent && ins.o.content.sent.r1 === w7.today,
     '서버 한 줄(saved_reports · rj_news)에 <b>그 분 번호와 오늘 날짜</b>가 적힌다');
  is(!!ins && JSON.stringify(ins.o).indexOf('홍길동') < 0, '  ★ <b>이름은 안 올라간다</b> (3번)');
  is(w7.w.every(x => x.tb !== 'calls'), '  통화 기록(calls)에는 아무것도 안 적는다');
  is(w7.ids.indexOf('r1') < 0, '  ★ 이 목록에서 빠진다');
  is(w7.tk.indexOf('r1') < 0, '  ★★ 「오늘 터치할 사람」(arTouch)에서도 <b>같이</b> 빠진다 (5번)');
  is(/오늘 보낸 분 1/.test(w7.t), '  「오늘 보낸 분 1」 로 센다');

  head('[8] ★ 「그만 받기」 — 서버에 적히고 다시 안 서고, 되돌릴 수 있다');
  await pg.evaluate(() => { __w.length = 0; rjnStop('r3'); });
  await pg.waitForTimeout(250);
  const w8 = await pg.evaluate(() => ({ w: JSON.parse(JSON.stringify(__w)), ids: rjnPeople().map(x => x.id),
    tk: arTouch('').filter(x => x.k === '거절').map(x => x.id), t: document.querySelector('#rjnBox').innerText }));
  const up = w8.w.filter(x => x.tb === 'saved_reports')[0];
  is(!!up && up.op === 'update' && up.o.content.stop && !!up.o.content.stop.r3 && up.o.content.sent.r1,
     '같은 줄을 <b>고쳐 씁니다</b> — 그만 받기가 붙고 보낸 날은 그대로');
  is(w8.ids.indexOf('r3') < 0 && w8.tk.indexOf('r3') < 0, '  ★ 이 목록과 「오늘 터치할 사람」 에서 다시 안 선다');
  is(/그만 받으신 분 2/.test(w8.t), '  그만 받으신 분 수가 선다(다른 분이 적은 것까지)');
  await pg.evaluate(() => { rjnUnstop('r3'); });
  await pg.waitForTimeout(250);
  const back = await pg.evaluate(() => rjnPeople().map(x => x.id));
  is(back.indexOf('r3') >= 0, '  잘못 눌렀으면 <b>되돌릴 수 있다</b>');
  const oth = await pg.evaluate(() => { rjnUnstop('r4'); return rjnPeople().map(x => x.id); });
  is(oth.indexOf('r4') < 0, '  다른 분이 적은 그만 받기는 <b>함부로 안 지운다</b>');

  head('[9] 홈 아침 미션 카톡에도 같은 소식 — 거절이 아닌 분은 그대로');
  const h9 = await pg.evaluate(() => ({ rj: hmMsKt({ k: '거절', id: 'r1' }), no: hmMsKt({ k: '미접촉', id: 'r5' }),
    has: hmMsKtHasNews({ k: '거절', id: 'r1' }), has5: hmMsKtHasNews({ k: '미접촉', id: 'r5' }) }));
  is(h9.rj.indexOf('기준금리 동결') >= 0 && /그만/.test(h9.rj), '거절하신 분 카톡 — <b>오늘의 소식</b>과 그만 받는 길');
  is(h9.no.indexOf('https://') < 0 && !/그만/.test(h9.no) && !h9.has5, '  ★ 거절이 아닌 분(못 읽은 분)은 <b>여태 그대로</b> — 아무 기사나 안 준다');
  is(h9.has, '  거절하신 분은 「기사가 들어갔다」 로 센다 — 「아직 읽을 것이 없습니다」 줄이 겹쳐 안 선다');

  head('[10] 폰 390px · 그리는 동안 터진 곳');
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.evaluate(() => go('rjnews'));
  await pg.waitForTimeout(400);
  const wide = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  is(wide <= 2, '폰(390px)에서 <b>옆으로 안 밀린다</b> — 넘친 폭 ' + wide + 'px');
  is(errs.length === 0, '콘솔 에러 ' + errs.length + '건' + (errs.length ? ' — ' + errs[0].slice(0, 120) : ''));

  await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ 거절 고객 소식 — ' + bad + '/' + n + ' 자리가 막혔습니다'
                          : '✓ 거절 고객 소식 — ' + n + '자리 통과 · 매일 바뀌는 소식 · 지어내지 않음 · 그만 받기'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('점검 중 오류:', e.message); process.exit(1); });
