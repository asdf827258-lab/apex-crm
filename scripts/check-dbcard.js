/* ══════════════════════════════════════════════════════════════════
   check-dbcard.js — <b>폰에서 표가 카드로 접히는가 · 옆으로 안 새는가.</b>

   재 보고 알았습니다. 폰(390px)에서 —
     · DB 통합 CRM  문서 폭 <b>1108px</b> — 칸 열셋짜리 표가 화면을 밀어냈습니다
     · 보장 전·후   문서 폭 <b>519px</b>

   <b>잘린 줄은 아무도 안 읽습니다.</b> 고객 앞에서 손가락으로 표를 옆으로
   밀며 찾는 동안 대화가 끊깁니다.

   원인은 <b>둘 다 같았습니다</b> — 격자(grid) 칸의 기본 최소폭이 auto(=내용
   크기)라, 안에 넓은 것이 하나 있으면 칸이 그만큼 버티고 화면 밖으로
   밀려납니다. <b>.grid&gt;*{min-width:0}</b> 한 줄로 둘 다 섭니다.

   그리고 칸 열셋짜리 표는 폰에 <b>절대</b> 안 들어갑니다. 옆으로 굴리게
   두는 대신 <b>한 줄을 한 장</b>으로 접습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     ① 폰에서 <b>옆으로 안 샌다</b> — 세 화면 모두
     ② 폰에서 표가 <b>카드로</b> 접힌다 · 머리줄은 숨는다
     ③ 칸 이름이 <b>머리줄에서 그대로</b> 온다 — 여기 또 적지 않는다 (5번)
     ④ 태블릿·데스크에서는 <b>표 그대로</b>다 — 넓은 화면까지 접으면 손해다
     ⑤ 접힌 칸도 <b>손이 닿는다</b> (44px · 2단계)
     ⑥ 빈 손·기다림·못 받음 줄은 <b>안 접는다</b> — 그 줄은 표가 아니라 한 문장이다

   ★ 바깥으로 안 나갑니다 — CI 는 인터넷이 되므로, 막지 않으면 늦게 온
     응답이 심어 둔 값을 덮어써 <b>CI 에서만</b> 빨간불이 켜집니다 (8번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8995;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* 견본은 <b>홍길동</b> 집안입니다 (3번) */
const SEED = `
  document.getElementById('configScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  window.toast=function(){};
  profile={id:'me',name:'홍길동',role:'admin',active:true};
  profiles=[profile]; dbSources=['일반','개척'];
  DBL={loaded:true,busy:false,err:''};
  dbs=[{id:'d1',assigned_to:'me',customer_name:'홍길순',phone:'010-0000-0001',stage:'부재',
        source:'일반',assigned_date:'2026-09-01',region:'순천시'},
       {id:'d2',assigned_to:'me',customer_name:'홍말순',phone:'010-0000-0002',stage:'미접촉',
        source:'개척',assigned_date:'2026-08-20',region:'여수시'}];
  calls=[]; crmTeams=[];crmTeamOf={};cliKeys={};attendance=[];attErr=null;
  fillProfiles();fillSources();fillStages(); goPage('db'); renderAll();`;

const look = async (ctx, W) => {
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:' + PORT + '/db-crm.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  const r = await page.evaluate((seed) => {
    (0, eval)(seed);
    const tr = document.querySelector('#dbBody tr');
    const tds = tr ? [...tr.querySelectorAll('td')] : [];
    const lab = (e) => (getComputedStyle(e, '::before').content || '').replace(/^"|"$/g, '');
    /* ★ 값은 <b>지우기 전에</b> 다 읽는다. 표를 먼저 지우면 칸이 문서에서 떨어져
       나가 computed style 이 전부 빈 값이 된다 — 그러면 이 점검이 <b>제 실수</b>를
       화면 탓으로 적는다. 실제로 한 번 그랬다 (8번). */
    const dbTable = document.querySelector('#dbBody').closest('table');
    const out = {
      docW: document.documentElement.scrollWidth,
      cliW: document.documentElement.clientWidth,
      rowDisp: tr ? getComputedStyle(tr).display : '(줄 없음)',
      theadOff: getComputedStyle(dbTable.querySelector('thead')).display === 'none',
      labels: tds.filter(t => t.hasAttribute('data-th')).map(lab).filter(x => x && x !== 'none'),
      ths: [...dbTable.querySelectorAll('thead th')].map(t => (t.innerText || '').trim()).filter(Boolean),
      small: tds.filter(t => { const h = t.getBoundingClientRect().height; return h > 0 && h < 44 && t.hasAttribute('data-th'); }).length
    };
    /* 이제 빈 손 줄을 본다 — 한 문장짜리 줄을 접으면 이름표가 붙어 우스워진다 */
    DBL = { loaded: false, busy: true, err: '' };
    dbs = []; renderDb();
    const waitTd = (document.querySelector('#dbBody tr') || {}).querySelector
      ? document.querySelector('#dbBody tr').querySelector('td') : null;
    out.waitLab = waitTd ? lab(waitTd) : '(칸 없음)';
    out.waitFolded = waitTd ? getComputedStyle(waitTd).display === 'flex' : false;
    return out;
  }, SEED);
  await page.close();
  return r;
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const mk = async (W) => {
    const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const r = await look(ctx, W);
    await ctx.close();
    return r;
  };
  const P = await mk(390), T = await mk(820), D = await mk(1280);

  head('[1] <b>폰에서 옆으로 안 샌다</b> — 잘린 줄은 아무도 안 읽는다');
  is(P.docW <= P.cliW + 1, 'DB 통합 CRM — 문서 폭 ' + P.docW + 'px / 화면 ' + P.cliW + 'px');

  head('[2] 폰에서 표가 <b>카드로</b> 접힌다');
  is(P.rowDisp === 'block', '한 줄이 <b>한 장</b>으로 선다 — ' + P.rowDisp);
  is(P.theadOff, '<b>머리줄은 숨는다</b> — 이름표가 칸마다 붙으니 위에 또 둘 이유가 없다');
  is(P.labels.length >= 10, '칸마다 <b>이름표</b>가 붙는다 — ' + P.labels.length + '개');

  head('[3] 이름표는 <b>머리줄에서 그대로</b> 온다 (5번)');
  const miss = P.labels.filter(x => P.ths.indexOf(x) < 0);
  is(miss.length === 0, '이름표가 모두 머리줄에 <b>있는 말</b>이다' + (miss.length ? ' ← 어긋남: ' + miss.join(' · ') : ''));
  is(P.ths.filter(t => P.labels.indexOf(t) >= 0).length >= 10,
     '머리줄 ' + P.ths.length + '칸 중 <b>' + P.ths.filter(t => P.labels.indexOf(t) >= 0).length + '칸</b>이 이름표로 온다');

  head('[4] <b>넓은 화면에서는 표 그대로</b> — 넓은 데까지 접으면 손해다');
  is(T.rowDisp === 'table-row' && !T.theadOff, '태블릿(820) — 표 그대로 · 머리줄 보임');
  is(D.rowDisp === 'table-row' && !D.theadOff, '데스크(1280) — 표 그대로 · 머리줄 보임');
  is(T.labels.length === 0 && D.labels.length === 0, '넓은 화면에서는 <b>이름표를 안 붙인다</b> — 머리줄이 이미 있다');

  head('[5] 접힌 칸도 <b>손이 닿는다</b> (2단계)');
  is(P.small === 0, '44px 아래인 칸이 <b>' + P.small + '개</b>');

  head('[6] <b>빈 손·기다림 줄은 안 접는다</b> — 그 줄은 표가 아니라 한 문장이다 (5단계)');
  is(!P.waitFolded, '기다림 줄에 <b>칸 모양을 안 입힌다</b>');
  is(!P.waitLab || P.waitLab === 'none', '기다림 줄에 <b>이름표를 안 붙인다</b> — ' + (P.waitLab || '(없음)'));

  head('[7] <b>보장 전·후 만들기</b>도 폰에서 안 샌다');
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx2.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const bp = await ctx2.newPage();
  await bp.goto('http://127.0.0.1:' + PORT + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await bp.waitForTimeout(1600);
  const B = await bp.evaluate(() => ({
    docW: document.documentElement.scrollWidth, cliW: document.documentElement.clientWidth,
    /* 격자 칸의 바닥이 0 으로 내려가 있는가 — 여기가 원인이었다 */
    gridMin: (() => { const g = document.querySelector('.grid > *'); return g ? getComputedStyle(g).minWidth : '(격자 없음)'; })()
  }));
  await ctx2.close();
  is(B.docW <= B.cliW + 1, '보장 전·후 — 문서 폭 ' + B.docW + 'px / 화면 ' + B.cliW + 'px');
  is(B.gridMin === '0px', '격자 칸의 <b>바닥이 0</b>이다 — auto 면 안쪽 넓은 것이 칸을 밀어낸다 (' + B.gridMin + ')');

  console.log('\n' + (bad ? ('✗ 폰에서 표가 안 접히거나 옆으로 샙니다 — ' + bad + '자리')
                          : '✓ 폰에서 표가 카드로 접히고, 세 화면 모두 옆으로 안 샙니다'));
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
