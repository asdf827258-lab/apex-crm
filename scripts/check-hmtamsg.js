/* ═══════════════════════════════════════════════════════════════
   check-hmtamsg.js — ☎️ <b>오늘(홈) 카드가 TA 「문자 · 카톡」 을 ta-msg.js 에서 읽나</b> (판 X495)

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
   ── 판 X496 「그 다음거 하고 문제되는거 해결해줘」 ──
     [9]  ★★ 담당 지역 — TA 스크립트 칸(ta_final_v1 · f.area)을 읽어 「○○지역」 이 안 남는다 ·
              비어 있으면 적는 칸이 서고, 적으면 같은 곳(f.area)에 들어가 TA 스크립트 다른 칸은 그대로다
     [10] ★★ 고객 365일 줄(touch) — 계약 고객 관리 안부 글(MST_TOUCH)을 읽기만 · 📰 소식 글은 뺀다(1번) ·
              접힌 머리는 「💬 안부 카톡」
     [11] ★ ta-msg.js 앞뒤 빈칸 다듬기가 「s」 글자를 안 지운다
   ── 판 X497 「다음것 해」 (9차 시안 「TA여는말은 그냥 바로 스크립트로」) ──
     [12] ★★ 「☎️ 전체 대본」 이 이분의 DB 종류 · 이름 · 약속을 TA 스크립트 칸(ta_final_v1)에 넣고 연다 ·
              지난 고객 칸은 비우고 설계사 칸은 그대로 · 못 알아본 DB 는 안 바꾼다(1번) · 🙈 가리기면 이름 비움 ·
              주소에 이름을 안 싣는다(3번)
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

console.log('\n[9] 담당 지역 — TA 스크립트 칸과 한 곳 (판 X496)');
const LS = {};
win.localStorage = { getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); } };
is(/○○지역/.test(H.text('ok', STEPS.k3, 'kakao')), '  지역이 비어 있으면 자리 글 「○○지역」 그대로 (지어내지 않음 · 1번)');
const ha = H.html(STEPS.k3);
is(/담당 지역이 비어/.test(ha) && /HM_TAMSG\.setArea\(/.test(ha) && /<input/.test(ha), '  비어 있으면 「이분 자세히」 에 적는 칸이 선다');
LS.ta_final_v1 = JSON.stringify({ db: 'analysis3', f: { me: '윤시현', s1: '화 2시' } });
H.setArea('  광주 서구 ');
const TS = JSON.parse(LS.ta_final_v1);
is(TS.f.area === '광주 서구' && TS.f.s1 === '화 2시' && TS.db === 'analysis3', '  적으면 ta_final_v1 의 f.area 에 들어가고 TA 스크립트 다른 칸은 그대로');
const ok3 = H.text('ok', STEPS.k3, 'kakao');
is(/에이플러스에셋 광주 서구 보장분석 담당/.test(ok3) && !/○○지역/.test(ok3), '  적은 지역이 TA 카톡에 들어가 「○○지역」 이 안 남는다');
is(!/<input/.test(H.html(STEPS.k3)) && /바꾸기/.test(H.html(STEPS.k3)), '  적은 뒤에는 칸 대신 「담당 지역 광주 서구 · 바꾸기」');
is(!/담당 지역/.test(H.html(STEPS.k2)), '  지역이 안 들어가는 글(당일 출발)에는 지역 줄을 안 세운다');

console.log('\n[10] 고객 365일 줄 — 안부 카톡 (판 X496)');
const mi = IX.indexOf('var MST_TOUCH=['), me2 = IX.indexOf('\n];', mi);
vm.runInContext(IX.slice(mi, me2 + 3), ctx);
const TOUCH = { key: 'kt', k: 'touch', id: 'c1', t: '홍철호', s: '40일째' };
STEPS.kt = TOUCH;
const TL = H.list(TOUCH);
const nSay = win.MST_TOUCH.filter(m => m.say && m.ic !== '📰').length;
is(TL.length === nSay && nSay >= 5, '  MST_TOUCH 의 안부 글을 그대로 내놓는다 (' + TL.length + '개)');
is(!TL.some(k => /소식이 있어/.test(H.text(k, TOUCH, 'kakao'))), '  📰 「소식이 있어」 글은 뺀다 — 여기선 기사를 못 붙인다 (1번)');
is(TL.every(k => win.MST_TOUCH.some(m => m.say === H.text(k, TOUCH, 'kakao'))), '  글은 MST_TOUCH 의 say 그대로 (다시 적지 않음 · 5번)');
is(!/홍철호/.test(H.html(TOUCH)) && /💬 안부 카톡/.test(H.html(TOUCH)), '  「💬 안부 카톡」 칸 · 고객 이름을 안 싣는다 (3번)');
is(H.tag(TOUCH) === '💬 안부 카톡' && H.tag(STEPS.k1) === '💬 TA 카톡', '  접힌 머리 이름 — 365일 줄은 안부 카톡, 배정 DB 는 TA 카톡');
is(/HM_TAMSG\.tag\(x\)/.test(IX), '  본체 hmMoreSub 가 HM_TAMSG.tag 로 접힌 머리 이름을 받는다');
is(/- 에이플러스에셋 윤시현$/.test(H.text(TL[0], TOUCH, 'sms')), '  문자로 바꾸면 끝에 설계사 이름을 붙인다');
H.copy('kt', TL[0]);
is(copied === H.text(TL[0], TOUCH, 'kakao'), '  📋 가 그 안부 글을 베낀다');

console.log('\n[11] ta-msg.js 빈칸 다듬기');
is(/에이플러스에셋 sam/.test(win.TA_MSG.textFor('hold', { me: 'sam', area: 'south' }, 'sms')) &&
   /south 담당/.test(win.TA_MSG.textFor('hold', { me: 'sam', area: ' south ' }, 'kakao')), '  「s」 로 시작·끝나는 이름·지역을 안 깎는다');

console.log('\n[12] ☎️ 전체 대본 — 이분에 맞춰 연다 (판 X497)');
let wentTab = '';
win.go = t => { wentTab = t; };
LS.ta_final_v1 = JSON.stringify({ db: 'analysis1', age: '40', f: { me: '윤시현', area: '광주 서구', s1: '화 2시', c: '홍정돌', when: '11월 2일(월) 오후 3시', where: '카페', r1: '앞 고객 결과' } });
H.openTa('k1');
const O1 = JSON.parse(LS.ta_final_v1);
is(wentTab === 'ta_script', '  누르면 TA 스크립트 화면으로 간다');
is(O1.db === 'analysis3', '  이분 DB(보장분석3)로 맞춘다');
is(O1.f.c === '홍길동' && /11월 20일\(금\) 오후 2시/.test(O1.f.when || ''), '  이분 이름 · 약속 시각을 넣는다');
is(!O1.f.where && !O1.f.r1, '  지난 고객 칸(장소 · 결과)은 비운다');
is(O1.f.me === '윤시현' && O1.f.area === '광주 서구' && O1.f.s1 === '화 2시' && O1.age === '40', '  설계사 칸 · 나이대는 그대로');
H.openTa('k3');
const O3 = JSON.parse(LS.ta_final_v1);
is(O3.db === 'analysis3' && O3.f.c === '홍갑돌' && !O3.f.when, '  못 알아본 DB(보장분석1)는 바꾸지 않고 · 약속 없는 분은 시각을 안 넣는다 (1번)');
win.hmNmHidden = () => true;
H.openTa('k1');
is(!JSON.parse(LS.ta_final_v1).f.c, '  🙈 이름 가리기를 켰으면 이름을 비운다');
delete win.hmNmHidden;
is(/HM_TAMSG\.openTa\(/.test(IX) && !/ta-script\.html[^'"]*[?#][^'"]*\+/.test(IX), '  본체 「☎️ 전체 대본」 이 openTa 를 부르고 · 주소에 고객을 싣지 않는다 (3번)');

console.log(bad ? `\n✗ ${bad}개가 어긋났습니다` : '\n✓ 오늘 카드가 TA 문자·카톡을 ta-msg.js 에서 읽어 씁니다');
process.exit(bad ? 1 : 0);
