/* ═══════════════════════════════════════════════════════════════
   check-tamsg.js — ☎️ <b>TA 「문자 · 카톡」 글이 ta-msg.js 한 곳에서 오나</b> (판 X493)

   사장님 말씀 (2026-11-19) — 「TA스크립트에 약속 내용 그리고 약속후 카톡내용 보면
   잘 다듬어져있는데 그걸 오늘에서 사용할수 있도록」 · 「본판으로 하려면 이렇게 하면
   안되는데」 (시안이 글을 베껴 넣은 것을 보시고).

   글(만남 승낙 · 보류 · 부재 · 전날 확인 · 당일 출발 · 감사 · 분석표 · 보류 1주 후 ·
   계약 감사 …)은 ta-script.html 페이지 안에만 있어 다른 화면이 못 읽었습니다.
   ta-open.js 를 뗐던 것과 같이 ta-msg.js 로 옮겼습니다 — 오늘(홈)이 베끼지 않고
   읽을 수 있게.

   ── 보는 것 (브라우저 없이) ──────────────────────────────────────
     [1] ★★ ta-script.html 에 글이 <b>다시 적혀 있지 않다</b> — TA_MSG 를 부른다 (5번)
     [2] ★ ta-script.html 이 ta-msg.js 를 ta-open.js <b>뒤에</b> 싣는다 (TA5 를 읽으므로)
     [3] ★ 갈래 열둘이 그대로다 (지우면 TA 스크립트 칩이 사라집니다)
     [4] ★★ 다른 화면(textFor)이 칸을 채우면 이름·시간·장소가 들어가고 자리 글(○○)이 안 남는다
     [5] ★★ 칸이 비면 <b>자리 글 그대로</b> — 지어내지 않는다 (1번)
     [6] ★★ 못 알아본 DB 는 <b>출처를 지어내지 않는다</b> (1번 · ta-open.js 와 같은 규칙)
     [7] ★ 화면이 넘기는 칸(fv)·DB 를 그대로 쓴다 — TA 스크립트와 같은 글이 나온다
   ═══════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const rd = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const win = {}; win.window = win;
const ctx = vm.createContext(win);
vm.runInContext(rd('ta-open.js'), ctx);
vm.runInContext(rd('ta-msg.js'), ctx);
const M = win.TA_MSG, D = win.TA5;

console.log('\n[1] TA 스크립트는 글을 부른다 (5번)');
const TS = rd('ta-script.html');
is(!/var MSG\s*=\s*\[/.test(TS), '  ta-script.html 에 글 목록(MSG)이 다시 적혀 있지 않다');
is(!/case 'eve'\s*:/.test(TS) && !/case 'signed'\s*:/.test(TS), '  ta-script.html 에 글을 만드는 줄(msgText 본문)이 다시 적혀 있지 않다');
is(/var MSG\s*=\s*TA_MSG\.MSG/.test(TS) && /TA_MSG\.text\(/.test(TS) && /TA_MSG\.prep\(/.test(TS), '  TA 스크립트가 TA_MSG 의 목록 · 글 · 꺼내 두실 것을 부른다');

console.log('\n[2] 싣는 차례');
const iO = TS.indexOf('<script src="ta-open.js">'), iM = TS.indexOf('<script src="ta-msg.js">');
is(iO > 0 && iM > iO, '  ta-msg.js 를 ta-open.js 뒤에 싣는다');

console.log('\n[3] 갈래 열둘');
const KEYS = ['ok', 'hold', 'info', 'soft', 'hard', 'miss', 'eve', 'go', 'thanks', 'report', 'later', 'signed'];
is(!!M && Array.isArray(M.MSG), '  TA_MSG.MSG 가 있다');
is(M && JSON.stringify(M.MSG.map(m => m.k)) === JSON.stringify(KEYS), '  갈래가 그대로다 — ' + (M ? M.MSG.map(m => m.k).join(' · ') : '(없음)'));

console.log('\n[4] 다른 화면이 고객 칸으로 부르면');
const F = { c: '홍길동', me: '윤시현', area: '순천', when: '11월 20일(금) 오후 2시', where: '댁',
            date: '11월 3일', due: '금요일', r1: '가', r2: '나', r3: '다', db: 'analysis3' };
let leak = [], empty = [];
KEYS.forEach(k => ['kakao', 'sms'].forEach(ch => {
  const t = M.textFor(k, F, ch);
  if (!t) empty.push(k + '/' + ch);
  if (/○○|undefined|null/.test(t)) leak.push(k + '/' + ch);
}));
is(!empty.length, '  스물넷(열두 갈래 × 카톡·문자)이 다 글을 낸다' + (empty.length ? ' — 빈 것: ' + empty.join(', ') : ''));
is(!leak.length, '  칸을 채우면 자리 글(○○)·undefined 가 안 남는다' + (leak.length ? ' — ' + leak.join(', ') : ''));
const ok = M.textFor('ok', F, 'kakao');
is(ok.indexOf('홍길동') >= 0 && ok.indexOf('11월 20일(금) 오후 2시') >= 0 && ok.indexOf('댁') >= 0 && ok.indexOf('윤시현') >= 0,
   '  예약 확인 카톡에 이름 · 시간 · 장소 · 담당이 들어간다');
is(M.textFor('ok', F, 'kakao') === M.textFor('ok', Object.assign({}, F, { db: '보장분석3' }), 'kakao'),
   '  DB 는 키(analysis3)로도 이름표(보장분석3)로도 찾는다');

console.log('\n[5] 칸이 비면 — 지어내지 않는다 (1번)');
const e = M.textFor('eve', {}, 'kakao');
is(/○/.test(e) && e.indexOf('홍길동') < 0, '  이름·시간·장소를 모르면 자리 글(○○)로 남긴다 — 아무 이름이나 넣지 않는다');

console.log('\n[6] 못 알아본 DB — 출처를 지어내지 않는다 (1번)');
const miss = M.textFor('miss', Object.assign({}, F, { db: '처음보는DB' }), 'kakao');
const srcs = D.DBS.map(d => d.src).filter(Boolean);
is(!srcs.some(s => miss.indexOf(s) >= 0), '  부재 문자에 어느 DB 의 출처도 끼워 넣지 않는다');
is(M.textFor('miss', Object.assign({}, F, { db: 'analysis3' }), 'kakao').indexOf(D.DBS.find(d => d.key === 'analysis3').src) >= 0,
   '  알아본 DB 는 그 출처를 그대로 말한다');

console.log('\n[7] TA 스크립트가 넘기는 칸 그대로');
const S = { f: { c: '홍길동', me: '윤시현' }, db: 'analysis1' };
const DEF = { s1: D.SLOTS[0], s2: D.SLOTS[1] };
const TAH = {
  fv: (k, ph) => { const v = (S.f[k] || '').trim(); return v || (ph != null ? ph : (DEF[k] || '○○○')); },
  db: () => D.DBS.filter(d => d.key === S.db)[0] || D.DBS[2],
  th: () => D.THEMES[(D.DBS.filter(d => d.key === S.db)[0] || D.DBS[2]).theme]
};
const viaPage = M.text('ok', 'kakao', TAH), viaFor = M.textFor('ok', { c: '홍길동', me: '윤시현', db: 'analysis1' }, 'kakao');
is(viaPage.length > 0 && viaPage.indexOf('홍길동') >= 0, '  화면의 칸으로 부르면 그 이름으로 글이 나온다');
is(M.prep(TAH).length > 0, '  인쇄판 「꺼내 두실 것」 한 줄이 나온다');
is(viaPage.split('\n')[0] === viaFor.split('\n')[0], '  TA 스크립트와 다른 화면이 같은 첫 줄을 낸다 (같은 글 · 두 벌 아님)');

console.log('\n[8] 「문자로 달라고 할 때」 — 두 가지 서비스 틀 · 심의 걸리는 말 없음 (판 X569 · 사장님 말씀 「두가지 서비스를 제공하는 느낌으로」 → 「그 글에 넣어」)');
['kakao', 'sms'].forEach(ch => {
  const t = M.textFor('info', F, ch);
  is(/보장분석 한 번으로 두 가지를 같이 봐 드려요/.test(t) && /하나, 내 보험 한눈에/.test(t) && /둘, 못 받은 보험금 찾기/.test(t), '  ' + ch + ' — 「보장분석 한 번으로 두 가지」 · 하나 내 보험 한눈에 · 둘 못 받은 보험금 찾기');
  is(!/본인인증|보험\s*비교|찾아\s*드린다|찾아드립니다|무조건|100%|최저|\d[\d,]*\s*(만\s*)?원/.test(t), '  ' + ch + ' — 본인인증(기능 꺼짐) · 보험비교(비교 오인) · 「찾아드린다」(단정) · 금액이 없다');
});
is(!/[📋💰👇🙂📩]/u.test(M.textFor('info', F, 'sms')), '  문자는 이모지 없이 ▶ 줄로');

console.log(bad ? `\n✗ ${bad}개가 어긋났습니다` : '\n✓ TA 문자·카톡이 ta-msg.js 한 곳에서 옵니다');
process.exit(bad ? 1 : 0);
