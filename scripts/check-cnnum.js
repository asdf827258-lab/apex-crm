#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   AI 가 <b>지어낸 숫자</b>가 숨지 못하나 (판 X106)

   사장님 말씀 (2026-10-14): 「X104로 해줘」 — 제가 캐러셀을 AI 로 실제로
   만들어 보고 드린 제안을 받아 주신 것입니다.
   ⚠ X104·X105 는 다른 세션이 먼저 썼습니다 → 이 판은 <b>X106</b> 입니다 (11번 ③).

   ★★ 무슨 일이 있었나 — 주제 <b>한 줄만</b> 보냈는데 AI 가 3번 카드에
   「<b>매년 수조 원</b>의 미청구 자산 — <b>금융감독원에 따르면</b>…」 이라
   적었습니다. 그런 수치를 준 적이 없습니다. <b>확인 안 된 수를 기관 이름에
   붙인 것</b>이고, 고객에게 나가는 카드에서 이 앱이 가장 경계하는 자리입니다.
   AI 지침에 「입력 자료에 있는 숫자만」 이라 적혀 있는데도 새어 나왔습니다 —
   <b>지침은 알람이 아닙니다.</b>

   여기서 못 박는 것은 다섯입니다.

     ① 묻는 곳이 <b>하나</b>다 (5번)
     ② <b>진짜로 나왔던 그것</b>을 잡는다 — 「수조 원」
     ③ ★★ <b>헛것을 안 잡는다</b> (8번) — 법 조항(제18조) · 세대(4세대) ·
        연도·날짜 · 나이·연령대 · 차례·가짓수 · 「점수만」 같은 말 ·
        그리고 <b>사장님이 본문을 붙여넣어 입력에 있던 수</b>
     ④ <b>세 자리</b>에서 말해 준다 — 만든 뒤 · 기획안 · 보고 있는 장
     ⑤ 저장 전에 <b>한 번 더 여쭙고</b>, 「아니오」 면 안 내보낸다.
        <b>막지는 않습니다</b> — 「예」 면 그대로 나갑니다 (6번).
        의심이 없으면 <b>안 묻습니다</b> — 헛물음도 헛알람입니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8876;
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
    if (rq.url.indexOf('/api/') === 0) { rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{"ok":true,"news":[]}'); return; }
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
  if (!window.__ovlWatch) { window.__ovlWatch = new MutationObserver(wipe); window.__ovlWatch.observe(document.body, { childList: true, subtree: false }); }
}, SEL);

/* 진짜로 나왔던 그 판을 그대로 씁니다 — 견본을 지어내지 않습니다 */
const 그판 = () => {
  window.bizNewsCanEdit = function () { return true; };
  window.__toast = []; window.toast = function (m) { window.__toast.push(String(m)); };
  CN.aiTopic = '숨은 돈 — 안 찾아간 내 돈, 숨은 보험금·계좌 (자료 금융감독원)';
  CN.aiPlan = { pickTitle: '잠든 내 돈, 숨은 보험금 찾는 법', target: '35~55세 직장인',
                sources: '금융감독원 숨은 금융자산 조회 안내 자료 (기준일: 2026.10.14)' };
  CN.ai = [
    { t: 'cover', layout: 'cover', mk: '숨은 돈', mt: '잠든 내 돈, **숨은 보험금** 찾는 법', ms: '' },
    { t: 'point', layout: 'point', mk: '01', mt: '바쁜 일상 속 **잠자는 계좌**', ms: '' },
    { t: 'point', layout: 'stat', mk: '02', mt: '매년 수조 원의 **미청구 자산**',
      ms: '금융감독원에 따르면 주인을 찾지 못해 잠든 숨은 보험금과 예금이 매년 대규모로 발생합니다.' },
    { t: 'cta', layout: 'cta', mk: 'CTA', mt: '지금 **치료비 통장**을 점검하세요', ms: '' }
  ];
  CN.i = 0; CN.imgs = {};
};

(async () => {
  const srv = serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1280, height: 1100 }, acceptDownloads: true });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  let 내려받음 = 0;
  pg.on('download', async d => { 내려받음++; try { await d.cancel(); } catch (e) {} });
  await pg.addInitScript(STUB);
  await pg.addInitScript(() => { try { localStorage.setItem('apex_guide_seen_v2', '1'); } catch (e) {} });
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof cnNumsOf === 'function' && typeof cnNewNums === 'function' &&
                                 typeof cnNumWarn === 'function' && typeof cnNumAsk === 'function',
                           { timeout: 60000 });
  await clearOvl(pg);

  /* ─────────────────────────────────────────────────────────── */
  head('[1] 묻는 곳이 <b>하나</b>다 (5번)');
  ['cnNumsOf', 'cnNewNums', 'cnNumWarn', 'cnNumSay', 'cnNumAsk'].forEach(f => {
    const c = (SRC.match(new RegExp('function\\s+' + f + '\\s*\\(', 'g')) || []).length;
    is(c === 1, '  ' + f + '() 가 ' + c + '곳에 있다');
  });

  /* ─────────────────────────────────────────────────────────── */
  head('[2] <b>진짜로 나왔던 그것</b>을 잡는다');
  const 잡 = await pg.evaluate(() => {
    const 재 = (입력, 장) => { CN.aiTopic = 입력; return cnNewNums(장); };
    const 주제 = '숨은 돈 — 안 찾아간 내 돈, 숨은 보험금·계좌 (자료 금융감독원)';
    return {
      수조: 재(주제, { mt: '매년 수조 원의 **미청구 자산**', ms: '금융감독원에 따르면 매년 대규모로 발생합니다.' }),
      돈: 재(주제, { mt: '보험료 3만원, 수익률 5.2%, 치료비 3배', ms: '1,200억원이 잠들어 있습니다' })
    };
  });
  is(잡.수조.indexOf('수조원') >= 0, '  「매년 <b>수조 원</b>」 을 잡는다 — ' + JSON.stringify(잡.수조));
  is(잡.돈.length >= 4, '  돈·비율·배수도 잡는다 — ' + 잡.돈.join(' · '));

  /* ─────────────────────────────────────────────────────────── */
  head('[3] ★★ <b>헛것을 안 잡는다</b> (8번)');
  const 헛 = await pg.evaluate(() => {
    const 재 = (입력, 장) => { CN.aiTopic = 입력; return cnNewNums(장); };
    const 주제 = '숨은 돈 — 안 찾아간 내 돈 (자료 금융감독원)';
    return {
      '법 조항': 재(주제, { mt: '상증법 제18조 공제', ms: '소득세법 제59조 2항' }),
      '세대·연도·날짜': 재(주제, { mt: '4세대 실손 2026년 10월 14일 시행', ms: '2026.10.14 기준' }),
      '나이·연령대': 재(주제, { mt: '35세부터 40대까지', ms: '65세 이상' }),
      '차례·가짓수': 재(주제, { mt: '3가지 점검, 2단계, 첫 번째', ms: '5장으로 정리, 1위' }),
      '「점수만」 같은 말': 재(주제, { mt: '점수만 보고 고르지 마세요', ms: '보수만 믿지 마세요' }),
      '본문을 붙여넣은 경우': 재(주제 + ' 매년 수조 원 규모로 발생한다고 밝혔다.',
                                { mt: '매년 수조 원의 미청구 자산', ms: '' }),
      '입력에 있던 수': 재('기준금리 3.5% 동결, 1,200억원 규모',
                           { mt: '기준금리 3.5% 동결', ms: '1,200억원 규모' })
    };
  });
  Object.keys(헛).forEach(k => {
    is(헛[k].length === 0, '  ' + k + ' 을 안 잡는다' + (헛[k].length ? ' ← ' + 헛[k].join('·') : ''));
  });

  /* ─────────────────────────────────────────────────────────── */
  head('[4] <b>세 자리</b>에서 말해 준다');
  await pg.evaluate(() => go('biz_news'));
  await pg.waitForSelector('#cnHost', { timeout: 30000 });
  await pg.evaluate(그판);
  await pg.evaluate(() => { var h = document.getElementById('cnHost'); if (h) h.innerHTML = renderTodayCard(); });
  await pg.waitForTimeout(600);
  const 본 = await pg.evaluate(() => {
    const w = cnNumWarn();
    return {
      몇장: w.length, 말: cnNumSay(w),
      기획안: (document.querySelector('.cn-plan-num') || {}).innerText || '',
      그장있나: !!document.querySelector('.cn-numwarn'),
      그장: (document.querySelector('.cn-numwarn') || {}).innerText || ''
    };
  });
  is(본.몇장 === 1, '  의심되는 장이 <b>하나</b>다 — ' + 본.몇장 + '장');
  is(/원문에 없던 숫자/.test(본.기획안), '  <b>기획안</b>이 빨갛게 말한다');
  is(/수조/.test(본.기획안), '  어느 숫자인지 적는다 — ' + 본.기획안.replace(/\s+/g, ' ').slice(0, 54));
  /* 1장(표지)에는 없고 3장에는 있어야 합니다 */
  is(!본.그장있나, '  <b>1장</b>(깨끗한 장)에는 표시가 없다');
  const 삼 = await pg.evaluate(() => { cnGo(2); const e = document.querySelector('.cn-numwarn'); return e ? e.innerText : ''; });
  is(/수조/.test(삼), '  <b>3장</b>(그 장)으로 넘기면 표시가 뜬다 — ' + 삼.replace(/\s+/g, ' ').slice(0, 44));
  const 토 = await pg.evaluate(() => (window.__toast || []).join(' | '));
  const 만든뒤 = SRC.slice(SRC.indexOf('function cnAiGen('), SRC.indexOf('function cnAiGen(') + 2600);
  is(/cnNumSay\(\)/.test(만든뒤), '  <b>만들자마자</b>도 말해 준다 (cnAiGen)');
  is(cnNumSayNoTag(본.말), '  그 말에 <b>꺾쇠가 없다</b> — toast 는 글자 그대로 찍는다');
  function cnNumSayNoTag(s) { return s.indexOf('<') < 0; }

  /* ─────────────────────────────────────────────────────────── */
  head('[5] 저장 전에 <b>여쭙고</b>, 막지는 않는다 (6번)');
  await pg.evaluate(() => { window.__ask = []; window.confirm = function (m) { window.__ask.push(m); return false; }; });
  내려받음 = 0;
  await pg.evaluate(() => cardnewsSaveAll());
  await pg.waitForTimeout(1200);
  const 물음 = await pg.evaluate(() => window.__ask || []);
  is(물음.length === 1, '  <b>여쭙는다</b> — ' + 물음.length + '번');
  is(/수조/.test(물음[0] || ''), '  물음에 <b>그 숫자</b>가 적힌다');
  is(내려받음 === 0, '  「아니오」 면 <b>안 내보낸다</b> — 받은 파일 ' + 내려받음 + '개');
  await pg.evaluate(() => { window.__ask = []; window.confirm = function (m) { window.__ask.push(m); return true; }; });
  내려받음 = 0;
  await pg.evaluate(() => cardnewsSaveAll());
  await pg.waitForTimeout(1200 + 4 * 700);
  is(내려받음 === 4, '  「예」 면 <b>그대로 나간다</b> — 막지 않는다 (' + 내려받음 + '장)');
  /* 의심이 없으면 안 묻는다 — 헛물음도 헛알람입니다 */
  await pg.evaluate(() => { CN.ai = null; CN.aiPlan = null; window.__ask = []; });
  내려받음 = 0;
  await pg.evaluate(() => cardnewsSaveAll());
  await pg.waitForTimeout(1200 + 5 * 700);
  const 안물음 = await pg.evaluate(() => (window.__ask || []).length);
  is(안물음 === 0, '  의심이 없으면 <b>안 묻는다</b> — ' + 안물음 + '번');
  is(내려받음 > 0, '  그때도 저장은 된다 — ' + 내려받음 + '장');

  /* ─────────────────────────────────────────────────────────── */
  head('[6] 조용한가');
  const 시끄 = errs.filter(e => !/favicon|net::ERR|Failed to fetch|abort/i.test(e));
  is(시끄.length === 0, '콘솔 에러 ' + 시끄.length + '건' + (시끄.length ? ' ← ' + 시끄[0] : ''));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '자리 — 위를 보십시오 (' + n + '가지 중)'); process.exit(1); }
  console.log('✓ 지어낸 숫자 — 막지는 않아도 숨지는 못합니다 (' + n + '자리).');
})();
