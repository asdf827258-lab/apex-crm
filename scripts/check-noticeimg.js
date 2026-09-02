/* ══ 공지 — 앱을 열 때마다 죽던 것 ═══════════════════════════════════
   실제로 이렇게 되어 있었습니다.

     os_notices 18줄 · 사진 합계 76MB · 가장 새 줄 하나가 11MB
     홈이 열릴 때마다 그 줄을 사진째 읽다가 서버가 스스로 끊었습니다
     → 500 {"code":"57014","message":"canceling statement due to statement timeout"}
     → 공지가 아예 안 떴습니다

   원인이 셋입니다.
     ① 사진을 <b>줄이지 않고</b> 원본 그대로 박았다 (한 장씩만 재고 합계는 안 봄)
     ② 「숨기기」를 누를 때마다 사진째 <b>새 줄</b>을 넣었다 (같은 사진 아홉 벌)
     ③ 홈이 열릴 때 <b>사진까지 같이</b> 읽었다 (글만 있으면 되는데)

   이 점검은 셋을 각각 봅니다.                                          */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const FILE = 'file:///' + path.resolve(__dirname, '..', 'app', 'index.html').replace(/\\/g, '/');
let bad = 0;
function is(ok, t) { console.log((ok ? '  ✓ ' : '  ✗ ') + t); if (!ok) bad++; }

(async () => {
  const src = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');

  console.log('\n[1] 사진을 줄여서 담는가');
  is(/function osNoticeShrink\(/.test(src), '줄이는 곳이 있다');
  is(/OS_NIMG_ALL/.test(src) && /osNoticeImgsBytes\(\)\s*\+/.test(src), '<b>합계</b>도 본다 — 한 장씩만 재지 않는다');

  console.log('\n[2] 열 때 사진을 같이 받지 않는가');
  is(!/select\('id,text,img,active/.test(src) && !/pick\('id,text,img,/.test(src),
     '홈이 열릴 때 <b>사진 칸을 안 읽는다</b>');
  is(/function osNoticeImgLoad\(/.test(src), '사진은 <b>따로</b> 받는 곳이 있다');

  console.log('\n[3] 숨기기가 줄을 쌓지 않는가');
  const clear = src.slice(src.indexOf('function osNoticeClear('), src.indexOf('function osNoticeClear(') + 900);
  is(/update\(\{active:false\}\)\.eq\('id'/.test(clear), '그 줄의 <b>스위치만</b> 내린다 — 새 줄을 안 넣는다');

  const b = await chromium.launch();
  const pg = await b.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));

  /* ── 서버를 가짜로 세워 놓고, 홈이 실제로 무엇을 읽는지 본다 ── */
  await pg.addInitScript(() => { window.__asked = []; });
  await pg.goto(FILE);
  await pg.waitForTimeout(2000);

  console.log('\n[4] 홈을 열면 무엇을 읽는가');
  const asked = await pg.evaluate(async () => {
    const asked = [];
    const rc = window.osClient;
    window.osClient = function () {
      return { from: function (t) {
        const q = { _c: '', _t: t };
        q.select = function (c) { q._c = c; asked.push(t + ' → ' + c); return q; };
        q.eq = function () { return q; };
        q.order = function () { return q; };
        q.limit = function () { return q; };
        q.then = function (ok) { ok({ data: [{ id: 'n1', text: '공지 글', active: true, created_at: '2026-09-01T00:00:00Z', author: '관리자' }] }); return q; };
        return q;
      } };
    };
    osNoticeLoad();
    await new Promise(r => setTimeout(r, 300));
    window.osClient = rc;
    return asked;
  });
  asked.forEach(a => console.log('      ' + a));
  is(asked.length > 0, '공지를 읽으러 간다');
  is(!asked.some(a => /^os_notices → [^→]*\bimg\b/.test(a) && /created_at/.test(a)),
     '첫 읽기에 <b>사진이 안 끼어 있다</b>');
  is(asked.some(a => /os_notices → img$/.test(a)), '사진은 <b>따로</b> 한 번 더 읽는다');

  console.log('\n[5] 사진을 못 받아도 공지는 뜨는가');
  const shown = await pg.evaluate(async () => {
    const rc = window.osClient;
    window.osClient = function () {
      return { from: function (t) {
        const q = {};
        q.select = function (c) { q._c = c; return q; };
        q.eq = function () { return q; };
        q.order = function () { return q; };
        q.limit = function () { return q; };
        q.then = function (ok) {
          if (q._c === 'img') ok({ error: { code: '57014', message: 'canceling statement due to statement timeout' } });
          else ok({ data: [{ id: 'n2', text: '이 글은 보여야 합니다', active: true, created_at: '2026-09-01T00:00:00Z', author: '관리자' }] });
          return q;
        };
        return q;
      } };
    };
    OS_NOTICE = null;
    osNoticeLoad();
    await new Promise(r => setTimeout(r, 400));
    window.osClient = rc;
    return (OS_NOTICE && OS_NOTICE.text) || '';
  });
  is(shown === '이 글은 보여야 합니다', '사진이 <b>시간 초과</b>로 실패해도 공지 글은 그대로 뜬다 — 「' + shown + '」');

  console.log('\n[6] 화면이 멈추지 않는가');
  is(errs.length === 0, errs.length ? '오류 · ' + errs[0] : '오류 없음');

  await b.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '✗ ' + bad + '군데가 걸렸습니다.' : '공지 점검 통과 — 사진 때문에 공지가 죽지 않습니다.');
  process.exit(bad ? 1 : 0);
})();
