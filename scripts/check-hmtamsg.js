/* ═══════════════════════════════════════════════════════════════
   check-hmtamsg.js — ☎️ <b>오늘(홈) 카드가 TA 「문자 · 카톡」 을 ta-msg.js 에서 읽나</b> (판 X494)

   사장님 말씀 (2026-11-19) — 「TA스크립트에 약속 내용 그리고 약속후 카톡내용 …
   오늘에서 사용할수 있도록」 → 「오늘에서 TA 문구 쓰는 다음판 진행해줘」.

   ── 보는 것 (브라우저 없이) ──────────────────────────────────────
     [1] ★★ 홈이 ta-msg.js · hm-tamsg.js 를 싣고(ta-open.js 뒤) 카드·「이분 자세히」 가 HM_TAMSG 를 부른다
     [2] ★★ hm-tamsg.js 에 카톡 문장이 <b>다시 적혀 있지 않다</b> — TA_MSG.textFor 로 읽기만 (5번)
     [3] ★★ 약속이 <b>내일</b>이면 「전날 확인」, <b>오늘</b>이면 「당일 출발」 — 그 시각이 글에 들어간다
     [4] ★ 약속이 없거나 모레 이후면 카드 첫 마디를 <b>안 바꾼다</b>
     [5] ★★ 고객 이름은 안 싣는다 — 「고객님」 (3번 · 홈 첫 마디와 같은 규칙), 설계사는 본인 이름
     [6] ★ 달력 약속 줄(id 없음)은 💬·📋 만 — 번호를 모르는 📞 를 세우지 않는다 (1번)
     [7] ★ 단계별 카톡 목록 — 「연락 원치 않음」 은 안 내놓는다(TA 스크립트 쪽지: 기본은 보내지 않는 것)
     [8] ★ 「이분 자세히」 칸이 고르기 · 복사 · 카톡/문자를 갖추고, 글을 이스케이프한다
   ═══════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const rd = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const ymd = d => d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
const D0 = new Date(2026, 10, 19);                         /* 날을 못 박습니다 — 오늘이 바뀌어도 같은 답 */
const T0 = ymd(D0), T1 = ymd(new Date(2026, 10, 20)), T3 = ymd(new Date(2026, 10, 22));
let copied = '';
const win = {
  OS: { profile: { name: '윤시현' } },
  mcalToday: () => T0,
  AR: { db: [
    { id: 'd1', name: '홍길동', stage: 'AP', appt: T1 + 'T14:00:00', src: '보장분석3', region: '순천' },
    { id: 'd2', name: '홍길순', stage: 'AP', appt: T0 + 'T10:30:00', src: '보장분석3' },
    { id: 'd3', name: '홍갑돌', stage: 'TA', appt: '', src: '보장분석1' },
    { id: 'd4', name: '홍말순', stage: 'AP', appt: T3 + 'T15:00:00', src: '보장분석3' },
    { id: 'd5', name: '홍판서', stage: '거절', appt: '', src: '' }
  ] },
  copyText: t => { copied = t; }, toast: () => {}, hmPaint: () => {},
  osEsc: s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
};
win.window = win;
const ctx = vm.createContext(win);
vm.runInContext(rd('ta-open.js'), ctx);
vm.runInContext(rd('ta-msg.js'), ctx);
vm.runInContext(rd('app/hm-tamsg.js'), ctx);
const H = win.HM_TAMSG;
const STEPS = {
  k1: { key: 'k1', k: 'db', tk: 'AP', id: 'd1', t: '홍길동' },
  k2: { key: 'k2', k: 'db', tk: 'AP', id: 'd2', t: '홍길순' },
  k3: { key: 'k3', k: 'db', tk: 'TA', id: 'd3', t: '홍갑돌' },
  k4: { key: 'k4', k: 'db', tk: 'AP', id: 'd4', t: '홍말순' },
  k5: { key: 'k5', k: 'db', tk: '거절', id: 'd5', t: '홍판서' },
  ka: { key: 'ka', k: 'appt', t: '홍길순', s: '10:30 · 순천' }
};
win.hmStepOf = key => STEPS[key] || null;

console.log('\n[1] 홈이 싣고 부른다');
const IX = rd('app/index.html');
const iO = IX.indexOf('<script src="../ta-open.js">'), iM = IX.indexOf('<script src="../ta-msg.js">'), iH = IX.indexOf('<script src="hm-tamsg.js">');
is(iO > 0 && iM > iO, '  ../ta-msg.js 를 ../ta-open.js 뒤에 싣는다');
is(iH > 0, '  hm-tamsg.js 를 싣는다');
is(/HM_TAMSG\.how\(x\)/.test(IX) && /HM_TAMSG\.apptHow\(x\)/.test(IX), '  카드 💬 줄(hmHowHtml)이 HM_TAMSG 를 부른다');
is(/HM_TAMSG\.html\(x\)/.test(IX), '  「이분 자세히」(hmMoreHtml) 가 TA 카톡 칸을 세운다');

console.log('\n[2] 글은 ta-msg.js 한 곳 (5번)');
const HJ = rd('app/hm-tamsg.js');
is(/TA_MSG\.textFor\(/.test(HJ), '  hm-tamsg.js 가 TA_MSG.textFor 로 읽는다');
is(!/뵙기로 한|지금 출발해서|시간 내주셔서 감사|예약 확인\]/.test(HJ), '  hm-tamsg.js 에 카톡 문장이 다시 적혀 있지 않다');

console.log('\n[3] 약속 내일 → 전날 확인 · 오늘 → 당일 출발');
is(H.moment(STEPS.k1) === 'eve', '  약속이 내일인 분 → 전날 확인');
is(H.moment(STEPS.k2) === 'go', '  약속이 오늘인 분 → 당일 출발');
is(H.moment(STEPS.ka) === 'go', '  달력 약속 줄(id 없음)도 → 당일 출발');
const e1 = H.how(STEPS.k1);
is(!!e1 && /11월 20일\(금\) 오후 2시/.test(e1.one), '  전날 확인 글에 약속 시각(11월 20일(금) 오후 2시)이 들어간다');
const g2 = H.how(STEPS.k2);
is(!!g2 && /오전 10시 30분/.test(g2.one), '  당일 출발 글에 오늘 시각(오전 10시 30분)이 들어간다');

console.log('\n[4] 약속이 없거나 멀면 안 바꾼다');
is(H.how(STEPS.k3) === null, '  약속 없는 분 → 카드 첫 마디 그대로');
is(H.how(STEPS.k4) === null, '  약속이 모레 이후인 분 → 카드 첫 마디 그대로');

console.log('\n[5] 이름 (3번)');
const all = [e1.one, g2.one, H.text('eve', STEPS.k1, 'sms'), H.text('go', STEPS.ka, 'kakao')].join('\n');
is(!/홍길동|홍길순/.test(all) && /고객님/.test(all), '  고객 이름을 안 싣고 「고객님」 으로 부른다');
is(/윤시현/.test(H.text('eve', STEPS.k1, 'kakao')), '  설계사는 로그인한 본인 이름');

console.log('\n[6] 달력 약속 줄');
const ah = H.apptHow(STEPS.ka);
is(ah.indexOf('hm-how-t') >= 0 && ah.indexOf('📋') >= 0 && ah.indexOf('📞') < 0, '  💬 와 📋 만 — 번호를 모르는 📞 를 세우지 않는다');
H.copy('ka', 'go');
is(/출발/.test(copied) && /고객님/.test(copied), '  📋 가 TA 「당일 출발」 전문을 베낀다');

console.log('\n[7] 단계별 목록');
is(H.list(STEPS.k5).join() === 'soft', '  거절하신 분 → 「부드러운 거절」 만 (연락 원치 않음은 안 내놓음)');
is(!Object.keys(H.BY_STAGE).some(k => H.BY_STAGE[k].indexOf('hard') >= 0), '  어느 단계에도 「연락 원치 않음」 을 내놓지 않는다');
is(H.list(STEPS.k1)[0] === 'eve' && H.list(STEPS.k3)[0] === 'ok', '  지금 때가 맞는 카톡이 맨 앞(내일 약속 → 전날 확인 · TA → 만남 승낙)');

console.log('\n[8] 「이분 자세히」 칸');
const hx = H.html(STEPS.k1);
is(/HM_TAMSG\.pick\(/.test(hx) && /HM_TAMSG\.copy\(/.test(hx) && /HM_TAMSG\.setCh\(/.test(hx), '  고르기 · 복사 · 카톡/문자가 있다');
is(H.html({ key: 'x', k: 'db', tk: '<img>', id: 'zz', t: '<b>' }) === '', '  맞는 카톡이 없는 줄은 칸을 안 세운다');
is(!/<script/i.test(hx), '  글이 그대로 꽂히지 않는다(이스케이프)');

console.log(bad ? `\n✗ ${bad}개가 어긋났습니다` : '\n✓ 오늘 카드가 TA 문자·카톡을 ta-msg.js 에서 읽어 씁니다');
process.exit(bad ? 1 : 0);
