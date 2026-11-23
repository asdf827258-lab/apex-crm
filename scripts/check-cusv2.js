/* ═══════════════════════════════════════════════════════════════
   check-cusv2.js — 🪪 <b>새 고객 화면(시안 9차 「고객 한 분」)이 예전 고객 창을 안 깨나</b> (판 X512)

   사장님 말씀 (2026-11-20) — 「그 다음거 해」(③ 고객 화면) ·
   「가장 중요한건 목각 그대로 따라가서, 목각 디자인에서, 맞는 기능들을 채우는게 먼저」 ·
   「새화면을 먼저 기준으로 하고, 구화면을 누르면 전 버전으로」.

   ⚠ 이 자는 <b>안전망</b>입니다 — 「시안과 같은가」 는 시안 사진과 새 화면 사진을 나란히 놓고 봅니다(PR 쪽지).

   ── 보는 것 (브라우저 없이) ──────────────────────────────────────
     [1] ★★ 기본은 새 화면 — 「↩ 예전 화면」 고른 기기(old)·자동 점검(webdriver)만 예전 화면
     [2] ★★ 모두에게 끄는 한 줄(ALLOWED=false)
     [3] ★★ index.html 은 세 자리만 — 싣기 · 요약 자리(cv2Box) · cuwPaint 안 다시 그리기, 모두 typeof/try 안
     [4] ★★ 칸 차례가 시안 openCust 그대로 (이름 → 단추 넷 → 단계 → 지금 상황 → 권할 것 → 아는 것 → 보험 → 기록 → 더 보기)
     [5] ★★ 칸을 채우고 누르면 부르는 라이브 함수가 <b>정말 있다</b>
     [6] ★★ 「＋ 적기」 가 데려가는 칸(cmCare · cmWorry …)이 <b>정말 있다</b> — 없으면 눌러도 아무 데도 못 감
     [7] ★  서버를 안 부르고 저장은 이 기기 고르기 한 칸뿐
     [8] ★  옷은 .cv2 아래 · #cusWin.cv2-on(요약 · 고치기 화면 아닐 때)으로만
     [9] ★  가짜 데이터로 그려 본다 — 단계 칸 · 권할 것 · 배정 줄 없는 분 · 예전 화면 · 한 칸이 터져도
     [12] ★ 판 X513 — 지금 상황 · 걱정 · 기록 시트: 있던 cmSave({care}·{worry}) · cmTouchAdd 만 부르고, 고른 뒤 두 화면을 다시 그린다
     [14] ★  판 X524 — 이름 줄 금액 칸 · 청약 단계 「✓ 계약됐어요」 → 오늘 화면의 그 시트(HOME_V2.amt · won) · 시트가 없는 판이면 예전 글자
     [13] ★★ 판 X515 — 고객 탭 목록(시안 rCust · rList): 담당자 · 찾기는 예전 그대로 거친 줄 · 단계 칩 · 한 줄 칸 · 넣기 · 예전 화면 길
     [10] ★ 이분 여정 — 「지금」 칸을 단계 · 약속 날로 세고, 보낸 날은 지어 붙이지 않는다 · 보낼 말 · 자세히 시트
   ═══════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const SRC = fs.readFileSync(path.join(ROOT, 'app/cus-v2.js'), 'utf8');
const IX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const rd = p => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch (e) { return ''; } };
const OTHER = ['app/hm-door.js', 'app/apex-cusone.js', 'apex-cusone.js', 'ta-open.js', 'apex-stage.js'].map(rd).join('\n');
const 걷기 = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const sc = 걷기(SRC);

/* ── 가짜 창 ── */
function box(store, opt) {
  opt = opt || {};
  const ls = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  const els = {}, Q = [];
  const win = { classList: { s: new Set(), toggle(c, v) { v ? this.s.add(c) : this.s.delete(c); }, remove(c) { this.s.delete(c); }, contains(c) { return this.s.has(c); } } };
  const doc = {
    head: { appendChild: e => { els[e.id] = e; } }, documentElement: {},
    body: { appendChild: e => { els[e.id] = e; } },
    createElement: t => { const cl = new Set(); return { tagName: t, id: '', textContent: '', innerHTML: '', className: '', attrs: {}, setAttribute(k, v) { this.attrs[k] = v; },
      classList: { add: c => cl.add(c), remove: c => cl.delete(c), contains: c => cl.has(c) } }; },
    getElementById: id => {
      if (id === 'cusWin') return win;
      if (id === 'cv2') { const b = els.cv2Box; if (!b || b.innerHTML.indexOf('id="cv2"') < 0) return null; return { classList: { contains: c => c === 'off' && b.innerHTML.indexOf('class="cv2 off"') >= 0 } }; }
      return els[id] || null;
    }
  };
  els.cv2Box = { innerHTML: '' };
  const stage = opt.stage === undefined ? 'AP' : opt.stage;
  const meta = opt.meta || { care: '부모님 일', worry: '엄마 간병이 걱정이에요', fam: '남편', touch: [{ at: '2026-11-18', how: '전화', note: '다음 주에 다시' }] };
  const said = [];
  const g = {
    said, copyText: t => said.push(['copy', t]), cmTouchAdd: (id, note, how, at, cb) => { said.push(['touch', id, note, how, at]); if (cb && cb.ok) cb.ok(at); },
    CM_CARE: ['', '결혼 준비', '부모님 일', '은퇴 준비'], cmSave: (id, p, then) => { said.push(['save', id, JSON.stringify(p)]); if (then) then(); }, cmDetailPaint: id => said.push(['dp', id]),
    MSG_V2: opt.noMsg ? undefined : { open: o => { (g.__msgLog = g.__msgLog || []).push(o); } },
    ccMsgText: () => '[ccMsg] 고객님 안녕하세요',
    HM_TAMSG: { list: x => (x && x.k === 'touch' ? ['m1'] : []), text: (k, x, ch) => '안부 ' + k + '·' + ch, area: () => '' },
    MST_TOUCH: [{ ic: '🧾', t: '청구', why: '받을 돈', say: '영수증' }, { ic: '💳', t: '보험료 잘 빠지는지', why: '미납', say: '이번 달도' }], OS: { profile: { name: '홍판서' } },
    TA_MSG: { MSG: [{ k: 'ok', t: '만남 승낙' }, { k: 'eve', t: '전날 확인' }, { k: 'go', t: '당일 출발' }, { k: 'thanks', t: '만난 직후 감사' }, { k: 'later', t: '결정 보류 1주 후' }, { k: 'signed', t: '계약 감사' }],
      textFor: (k, f, ch) => '[' + k + '] ' + f.c + '님 · ' + (f.me || '') + ' · ' + ch },
    localStorage: ls, navigator: { webdriver: !!opt.robot }, document: doc, setTimeout: f => { Q.push(f); return 0; }, toast: () => {},
    osEsc: s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    OSC: { current: { id: 'c1', name_masked: '홍*동' } },
    cmOf: opt.cmThrow ? () => { throw new Error('boom'); } : () => meta,
    CM_BASE: { c1: opt.base || { by: 1981, gd: 'F', inc: 300 } },
    CUS: { db: opt.noDb ? null : { id: 'd1', stage, region: '순천', dong: '연향동', expect_premium: 150000, source: '보장분석', contract_premium: null }, calls: [] },
    oscAge: by => (by ? 2026 - by : null), cmName: c => c.name_masked, cmWhoName: () => '홍판서',
    cuwToday: () => '2026-11-20', cuwAppt: () => opt.appt || '', cuwApptDay: a => String(a).slice(0, 10), cuwApptTxt: a => a, cmNextAll: () => opt.next || [],
    ccTelOf: () => '010-0000-0000', cmFfCount: () => 4, cmFfTotal: () => 25, cusTabN: k => (k === 'doc' ? 2 : null),
    cusLog: (calls, t) => t.map(x => ({ src: 'touch', kind: x.how, note: x.note, at: x.at })), CC_HOWE: { '전화': '📞' },
    OSCP: { rows: [{}, {}], busy: false },
    osTabAllowed: () => true, navItemOf: id => ({ id, icon: '🔧', title: '도구 ' + id }),
    MK_TALK: { CATS: { care: { label: '간병·노후', hook: '요즘 간병비가 하루 십몇만 원이래요', dambo: ['간병인', '치매'] }, cancer3: { label: '암·뇌·심장', dambo: ['암', '뇌'] }, hospital: { label: '병원비', dambo: ['실손'] }, women: { label: '여성', dambo: ['유방'] }, child: { label: '자녀', dambo: ['어린이'] }, life: { label: '생활·배상', dambo: ['일배책'] }, accident: { label: '상해', dambo: ['골절'] } } },
    APEX_STAGE: { aimText: s => s + ' 목표', objFill: (t, who, src) => String(t).split('OOO').join(who), taAge: [{ k: '4050', t: '40·50대', pt: '가족과 함께 보는 자리', tip: '<b>함께</b> 봅니다', add: '같이 보실까요', no: '혼자 결정 재촉' }], objList: () => [{ key: 'family', title: '가족과 상의할게요', one: 'OOO님 그럼요', follow: '같이 뵙죠', avoid: '재촉' }, { key: 'money', title: '돈 여유 없어요' }, { key: 'think', title: '생각해 볼게요' }, { key: 'many', title: '보험 이미 있어요' }],
      of: s => ({ know: [{ tab: 'wallets', g: '펴 놓을 것', w: '빈 통장' }, { tab: 'treatpay' }] }) },
    HM_DOOR: { THEME_CAT: { silson: 'hospital' }, prods: k => [{ co: '홍손보', nm: '간병 플랜' }] }, TA_OPENER: { db: () => ({ theme: 'silson' }) }, TA5: { THEMES: { silson: { name: '실손 점검' } } }
  };
  g.window = g;
  vm.createContext(g);
  let src = SRC;
  if (opt.allowed === false) src = src.replace('var ALLOWED = true;', 'var ALLOWED = false;');
  vm.runInContext(src, g);
  return { g, els, win, store, flush: () => { while (Q.length) Q.shift()(); } };
}
/* 창에 넣은 뒤에 한 박자(setTimeout) — 브라우저와 같은 차례 */
const paint = B => { B.els.cv2Box.innerHTML = B.g.cusV2Html(B.g.OSC.current); B.flush(); return B.els.cv2Box.innerHTML; };

console.log('\n[1] 기본은 새 화면 · 예전 화면은 고른 기기만');
let B = box({});
is(B.g.CUS_V2.on() === true, '고른 적 없는 기기 = 새 화면');
is(box({ apex_cus_v2: 'old' }).g.CUS_V2.on() === false, '「↩ 예전 화면」 고른 기기 = 예전 화면');
is(box({}, { robot: true }).g.CUS_V2.on() === false, '자동 점검 브라우저(webdriver) = 예전 화면 — 옛 고객 창 점검이 그대로 돈다');
B = box({ apex_cus_v2: 'old' }); let h = paint(B);
is(/class="cv2 off"/.test(h) && /cusV2Use\(true\)/.test(h) && !/class="who"/.test(h), '예전 화면이면 「✨ 새 고객 화면」 단추 하나만 선다');
B.g.cusV2Use(true);
is(B.store.apex_cus_v2 === '1' && /class="who"/.test(B.els.cv2Box.innerHTML), '「✨ 새 고객 화면」 → 이 기기에 1 · 바로 다시 그림');
B.g.cusV2Use(false);
is(B.store.apex_cus_v2 === 'old' && !B.win.classList.contains('cv2-on'), '「↩ 예전 화면」 → old · 창에서 새 화면 표(cv2-on)가 떨어진다(예전 요약이 다시 보임)');

console.log('\n[2] 모두에게 끄기');
B = box({ apex_cus_v2: '1' }, { allowed: false }); h = paint(B);
is(/var ALLOWED = true;/.test(SRC) && B.g.CUS_V2.on() === false && !/vchip/.test(h), 'ALLOWED=false 한 줄이면 새 화면도 단추도 안 선다');

console.log('\n[3] index.html 은 세 자리만');
is((IX.match(/<script src="cus-v2\.js"><\/script>/g) || []).length === 1 && IX.indexOf('<script src="cus-v2.js">') > IX.indexOf('<script src="home-v2.js">'), 'cus-v2.js 를 한 번, home-v2.js 뒤에 싣는다');
const hostLine = `'<div class="cv2-box" id="cv2Box">'+((typeof cusV2Html==='function')?cusV2Html(c):'')+'</div>'+`;
is(IX.split(hostLine).length === 2 && IX.indexOf(hostLine) < IX.indexOf(`cusSec('sum','<div id="cuwNow">'`) && IX.indexOf(hostLine) > IX.indexOf('function osClientDetailHtml(c){'),
  '요약 자리(cv2Box) 한 줄이 osClientDetailHtml 안, 예전 요약(cuwNow) 바로 앞 — 파일이 없어도 빈 칸');
const cp = IX.slice(IX.indexOf('function cuwPaint(c){'), IX.indexOf('function osClientDetailHtml(c){'));
is(/try\{ if\(typeof cusV2Paint==='function'\)cusV2Paint\(c\); \}catch\(eV2\)\{\}/.test(cp), 'cuwPaint 안에서 다시 그리기 — typeof · try 안');
is((IX.match(/cusV2/g) || []).length === 10, 'index.html 에 cusV2 이름은 열 번뿐 — 고객 창 세 자리(네 번) + 고객 목록 세 자리(여섯 번 · 판 X515)');

console.log('\n[4] 칸 차례 = 시안 openCust');
B = box({}); h = paint(B);
const ORD = ['class="who"', 'class="qa4"', 'class="steps"', 'class="sit"', 'class="recc"', '<b>아는 것</b>', '<b>보험</b>', '<b>기록</b>', '<b>더 보기</b>'];
const at = ORD.map(k => h.indexOf(k));
is(at.every(x => x >= 0) && at.every((x, i) => !i || x > at[i - 1]), '이름 → 단추 넷 → 단계 → 지금 상황 → 권할 것 → 아는 것 → 보험 → 기록 → 더 보기');

console.log('\n[5] 칸을 채우고 누르는 라이브 함수가 있다');
const has = n => new RegExp('function ' + n + '\\(|var ' + n + '\\s*=|g\\.' + n + '\\s*=|window\\.' + n + '\\s*=').test(IX + '\n' + OTHER);
const NEED = ['cmOf', 'oscAge', 'cmName', 'cmWhoName', 'cuwToday', 'cuwAppt', 'cuwApptDay', 'cuwApptTxt', 'cmNextAll', 'ccSms', 'cuwWrite', 'cuwNxOpen',
  'cusTab', 'cuwSheet', 'cusReveal', 'oscTopEdit', 'cqaWal', 'cmFfCount', 'cmFfTotal', 'cusTabN', 'ccTelOf', 'osTabAllowed', 'navItemOf', 'go', 'hmDoorGo', 'CM_BASE', 'CUS', 'CC_HOWE', 'copyText', 'cmTouchAdd', 'cregSrcName'];
const miss = NEED.filter(n => !has(n));
is(!miss.length, '부르는 함수 ' + NEED.length + '개가 앱에 있다' + (miss.length ? ' — 없음: ' + miss.join(', ') : ''));
is(/cusLog/.test(IX + OTHER), 'cusLog(통화 + 접촉 한 줄기)가 앱에 있다');
const sheets = (IX.match(/var CUW_SHEETS=\[[^\n]*/) || [''])[0];
is(/\['base'/.test(sheets) && /\['stage'/.test(sheets), '부르는 고치기 화면 base · stage 가 CUW_SHEETS 에 있다');
const tabs = (IX.match(/var CUS_TABS=\[[^\n]*/) || [''])[0];
is(['talk', 'cov', 'doc', 'info'].every(k => tabs.indexOf("'" + k + "'") >= 0), '더 보기의 탭 넷(talk · cov · doc · info)이 CUS_TABS 에 있다');

console.log('\n[6] 「＋ 적기」 가 데려가는 칸이 있다');
const F = (sc.match(/cusV2Jump\(\\'([A-Za-z]+)\\'\)/g) || []).map(s => s.match(/\\'([A-Za-z]+)\\'/)[1]);
const Fu = [...new Set(F.concat(['cmCare', 'cmWorry']))];   /* 상황 · 걱정은 판 X513 부터 시트 — 그 함수가 없는 판에서만 이 칸으로(jump) */
const nof = Fu.filter(id => !new RegExp('id=\\\\?"' + id + '\\\\?"|id=\\\\?\'' + id + '\\\\?\'').test(IX));
is(Fu.length >= 8 && !nof.length, '칸 ' + Fu.length + '개(' + Fu.join(' · ') + ')가 고객 창에 있다' + (nof.length ? ' — 없음: ' + nof.join(', ') : ''));
const ap = IX.slice(IX.indexOf('var CM_FIELDS=['), IX.indexOf('var CM_FIELDS=[') + 12000);
is(['fam', 'care', 'due', 'worry', 'bd', 'cd', 'ref'].every(k => ap.indexOf("['" + k) >= 0), '읽는 고객 칸 이름(fam · care · due · worry · bd · cd · ref)이 CM_FIELDS 에 있다');

console.log('\n[7] 서버 · 저장');
is(!/\.from\(|fetch\(|supabase|XMLHttpRequest|osClient\(/.test(sc), '서버를 부르지 않는다');
const sets = sc.match(/setItem\([^)]*\)/g) || [];
is(sets.length === 1 && /setItem\(KEY,/.test(sets[0]), '저장은 이 기기 고르기(apex_cus_v2) 한 칸뿐');
{
  const sv = sc.match(/cmSave\([^)]*\)/g) || [];
  is(!/cshMark|hdbTo|cmNextSave/.test(sc) && sv.length === 2 && /cmSave\(id, \{ care: v \}/.test(sc) && /cmSave\(id, \{ worry: v \}/.test(sc) &&
     (sc.match(/cmTouchAdd\(/g) || []).length === 2 && /function cmTouchAdd\(/.test(IX) && /function cmSave\(/.test(IX),
    '고객 칸 저장은 있던 함수뿐 — 상황 · 걱정 = cmSave({care}) · cmSave({worry}) 두 곳, 기록 · 「보냈어요」 = cmTouchAdd 두 곳 (새 저장 코드 없음)');
}

console.log('\n[8] 옷은 .cv2 아래 · 요약 탭에서만 감춘다');
const cssBody = (SRC.match(/var C = \[([\s\S]*?)\];/) || ['', ''])[1];
const rules = [];
(cssBody.match(/'([^']*)'/g) || []).map(s => s.slice(1, -1)).join('').replace(/@media[^{]*\{((?:[^{}]*\{[^}]*\})*)\}/g, (m0, inner) => { inner.replace(/([^{}]+)\{/g, (m, sel) => { rules.push(sel.trim()); }); return ''; })
  .replace(/([^{}]+)\{[^}]*\}/g, (m, sel) => { rules.push(sel.trim()); return ''; });
const badSel = rules.filter(r => r.split(',').some(s => !/^\s*(\.cv2\b|#cv2Sheet\b|#cv2Dim\b|#cusWin(\.cv2-on)?\[data-tab="sum"\]\[data-sheet=""\]>|#cusWin>\.cv2-box)/.test(s)));
/* ★ 판 X512 CI — 새 화면 상자에 예전 칸 표시(data-cus-tab)를 붙였더니 check-cuswin 이 「요약 맨 위」 와 「인쇄 칸 수」 에 그 상자를 세어 빨간불 */
is(!/data-cus-tab/.test(IX.slice(IX.indexOf('id="cv2Box"') - 40, IX.indexOf('id="cv2Box"') + 40)) && /#cusWin>\.cv2-box\{display:none\}/.test(SRC) && /#cusWin\[data-tab="sum"\]\[data-sheet=""\]>\.cv2-box\{display:block\}/.test(SRC),
  '새 화면 상자는 예전 칸 표시(data-cus-tab)를 안 씀 — 요약 · 고치기 아님일 때만 자기 옷으로 보임(예전 창 점검의 맨 위 · 인쇄 칸 수에 안 섞임)');
is(rules.length > 30 && !badSel.length, '옷 ' + rules.length + '줄 모두 .cv2 · #cv2Sheet/#cv2Dim · #cusWin.cv2-on(요약·고치기 아닐 때) 아래' + (badSel.length ? ' — 밖: ' + badSel.slice(0, 3).join(' | ') : ''));
is(/#cusWin\.cv2-on\[data-tab="sum"\]\[data-sheet=""\]>\.cus-head\{display:none!important\}/.test(SRC) && /#cusWin\.cv2-on\[data-tab="sum"\]\[data-sheet=""\]>\[data-cus-tab="sum"\]:not\(\.cv2-box\)\{display:none!important\}/.test(SRC),
  '예전 머리 · 요약은 「요약 탭 + 고치기 화면 아님 + 새 화면」 일 때만 감춘다 — 연락 · 보장 · 서류 · 정보 · 고치기는 예전 그대로');
is(/@media print\{#cusWin>\.cv2-box\{display:none!important\}\}/.test(SRC), '인쇄에는 안 나온다(예전 칸이 다 나옴)');

console.log('\n[9] 가짜 데이터로 그려 본다');
B = box({}); h = paint(B);
is(/<button type="button" class="past"[^>]*>첫 전화/.test(h) && /<button type="button" class="cur"[^>]*>첫 만남/.test(h) && /<button type="button" class=""[^>]*>보장분석</.test(h),
  '단계 여섯 칸(시안 그대로) — AP 면 첫 전화 지남 · 첫 만남 지금 · 보장분석은 아직');
B = box({}, { stage: 'PC' }); let hp = paint(B);
is(/class="past"[^>]*>보장분석/.test(hp) && /class="cur"[^>]*>제안/.test(hp), '제안(PC)이면 보장분석 칸은 「지남」 — 라이브에 따로 된 단계가 없어 「지금」 으로는 안 켜짐');
B = box({}); h = paint(B);
is(B.win.classList.contains('cv2-on'), '창에 새 화면 표(cv2-on)가 붙는다');
is(/간병·노후 — 간병인 · 치매/.test(h) && B.g.CUS_V2.catPick(B.g.OSC.current).why === '걱정 한마디' && !/\(걱정 한마디\)/.test(h) && /cusV2Rec\(\)">자세히</.test(h),
  '권할 것 — 걱정 한마디(간병)가 지금 상황보다 먼저 · 시안처럼 괄호 설명 없이 · 단추는 「자세히」');
is(/가족과 함께 보는 자리/.test(h) && /「가족과 상의할게요」 「돈 여유 없어요」/.test(h), '어떻게(나이대 45세 → 4050) · 막히면(AP 단계 거절 둘)');
is(/<b>예상 15만원<\/b>|예상 15만원/.test(h) && /순천 연향동/.test(h) && /href="tel:010-0000-0000"/.test(h), '배정 줄의 예상 금액 · 동네, 번호가 있으면 📞 전화');
is(/엄마 간병이 걱정이에요/.test(h) && /다음 주에 다시/.test(h) && /증권 2건/.test(h) && /4 \/ 25칸/.test(h), '걱정 · 기록 · 보험 건수 · 팩트파인딩 칸 수가 라이브 값 그대로');
B = box({}, { noDb: true, meta: {}, base: {} }); h = paint(B);
is(/<span>사는 곳<\/span><b>＋ 적기<\/b>/.test(h) && !/class="steps"[\s\S]*?class="cur"/.test(h.slice(h.indexOf('class="steps"'), h.indexOf('class="sit"'))) && /아직 아는 게 적어요/.test(h) && !/담당/.test(h.slice(0, h.indexOf('class="qa4"'))) && /＋ 적기/.test(h),
  '배정 줄 없는 분 — 사는 곳은 빈칸 · 단계 칸 안 켬 · 여정 안 세움 · 빈 칸은 「＋ 적기」(지어내지 않음)');
is(/지금 상황이나 나이를 적으면 나와요/.test(h) && !/이분 여정/.test(h), '아무것도 모르면 권할 것은 지어내지 않고 「적으면 나와요」 · 단계 모르면 여정 칸 없음');
B = box({}, { stage: '거절' }); h = paint(B);
is(/class="chip w">거절/.test(h), '거절 단계는 이름 줄에 「거절」 딱지');
B = box({}, { cmThrow: true }); h = paint(B);
is(/class="who"/.test(h) && /class="qa4"/.test(h) && /<b>더 보기<\/b>/.test(h), '고객 칸(cmOf)이 터져도 그 칸만 빠지고 나머지는 선다');
B = box({}, { next: [{ what: '보장분석 결과 전화', due: '2026-11-19' }] }); h = paint(B);
is(/기한 지남 · 보장분석 결과 전화/.test(h), '다음 할 일 — 요약 「지금 할 일」 과 같은 차례(기한 지난 할 일)');

console.log('\n[10] 이분 여정 · 보낼 말 · 자세히');
const J = (st, appt) => { const b = box({}, { stage: st, appt }); return b.g.CUS_V2.jNow(b.g.OSC.current); };
is(J('미접촉') === 'call' && J('TA', '2026-11-25T05:00:00Z') === 'ok' && J('AP', '2026-11-21T05:00:00Z') === 'eve' && J('AP', '2026-11-20T05:00:00Z') === 'go' &&
   J('AP', '2026-11-18T05:00:00Z') === 'thanks' && J('AP') === 'meet' && J('PC') === 'later' && J('CS') === 'signed' && J('계약완료') === 'pdel' && J('증권전달') === 'done' && J('거절') === null,
  '「지금」 칸 — 첫 전화 · 약속 멀면 예약 확인 · 내일 전날 확인 · 오늘 당일 출발 · 지났으면 감사 · PC 보류 · CS 계약 감사 · 계약완료 증권 전달 · 거절은 없음');
B = box({}, { stage: 'AP', appt: '2026-11-21T05:00:00Z' }); h = paint(B);
const jr = h.slice(h.indexOf('<b>이분 여정</b>'), h.indexOf('<b>아는 것</b>'));
is(h.indexOf('class="recc"') < h.indexOf('<b>이분 여정</b>') && h.indexOf('<b>이분 여정</b>') < h.indexOf('<b>아는 것</b>') && (jr.match(/class="jr-r /g) || []).length === 10,
  '여정 열 칸이 권할 것과 아는 것 사이(시안 차례)');
is((jr.match(/jr-r dn/g) || []).length === 2 && /jr-r now"><i><\/i><span class="jr-t">💬 전날 확인/.test(jr) && /cusV2Msg\('eve'\)">보낼 말/.test(jr) && !/\d{1,2}\/\d{1,2}/.test(jr),
  '내일 약속 → 첫 전화 · 예약 확인 지남, 「전날 확인」 지금 + 보낼 말 · 보낸 날은 지어 붙이지 않음');
B.g.cusV2Msg('eve');
const op = B.g.__msgLog[0] || { items: [] };
is(op.items[0] && op.items[0].k === 'eve' && op.items[0].text('kakao') === '[eve] 홍*동님 · 홍판서 · kakao' && op.items[0].text('sms') === '[eve] 홍*동님 · 홍판서 · sms' && op.tel === '010-0000-0000',
  '보낼 말 → 보내기 화면(MSG_V2) · 맨 앞이 그 TA 글(TA_MSG.textFor · 이분 이름 · 내 이름) · 카톡/문자 따로 · 번호');
is(op.items.some(x => /이분께 맞춘 글/.test(x.lb)) && op.items.some(x => x.lb === '💳 보험료 잘 빠지는지' && x.note === '미납'),
  '같은 화면에 이분께 맞춘 글(ccMsgText) · 계약 고객 안부(MST_TOUCH) 도 고를 수 있다');
op.onSent(op.items[0], 'sms');
is(B.g.said.some(x => x[0] === 'touch' && x[1] === 'c1' && x[2] === 'TA 카톡 · 전날 확인' && x[3] === '문자'),
  '「보냈어요」 → 있던 접촉 기록(cmTouchAdd)에 「TA 카톡 · 전날 확인」 · 문자로 보냈으면 「문자」');
h = paint(B);
is(/<b>안부 카톡 · 문자<\/b>/.test(h) && /class="sayc" onclick="cusV2Say\(\)"/.test(h) && /class="bub">\[ccMsg\]/.test(h) && h.indexOf('<b>안부 카톡 · 문자</b>') < h.indexOf('<b>아는 것</b>'),
  '고객 화면 「안부 카톡 · 문자」 칸 — 이분께 맞춘 글을 카톡 말풍선으로 미리 · 누르면 보내기 화면(여정 다음 · 아는 것 앞)');
is(/onclick="cusV2Say\(\)">💬<span>카톡·문자<\/span>/.test(h), '💬 단추는 보내기 화면(카톡 · 문자 고름)');
B = box({}, { stage: '미접촉' }); h = paint(B);
is(/jr-r now"><i><\/i><span class="jr-t">📞 첫 전화[\s\S]*?go\('ta_script'\)">TA 대본/.test(h), '첫 전화가 지금이면 「TA 대본」(TA 스크립트로)');
B = box({}); paint(B); B.g.cusV2Rec();
const rs = B.els.cv2Sheet.innerHTML;
is(/① 무엇을/.test(rs) && /홍\*동님, /.test(rs) && /이번 달 · 홍손보 · 간병 플랜/.test(rs) && /② 어떻게/.test(rs) && /가족과 함께 보는 자리/.test(rs) &&
   /③ 들고 갈 화면/.test(rs) && /펴 놓을 것/.test(rs) && /④ 이 말이 나오면/.test(rs) && /홍\*동님 그럼요/.test(rs) && /이 권유로 연락 일정 잡기/.test(rs),
  '자세히 시트 — 시안 openRec 그대로 ①②③④ · 이번 달 상품 · 거절 말에 이분 이름');
is(!/<b>함께<\/b>/.test(rs) && !/undefined/.test(rs) && /홍\*동님, 요즘 간병비/.test(rs), '라이브 글의 꼬리표는 걷고 글자만 · 빈 글은 안 세움(undefined 없음) · 던지는 한마디에 이분 이름');

console.log('\n[11] 💬 보내기 화면(msg-v2.js) — 「보내는 화면을 카톡처럼」');
{
  const MS = fs.readFileSync(path.join(ROOT, 'app/msg-v2.js'), 'utf8'), ms = 걷기(MS);
  is((IX.match(/<script src="msg-v2\.js"><\/script>/g) || []).length === 1, 'index.html 이 msg-v2.js 를 한 번 싣는다');
  is(!/\.from\(|fetch\(|supabase|XMLHttpRequest|setItem\(|cmSave|cmTouchAdd|hmQfin/.test(ms), '서버 · 저장 · 기록을 안 함 — 「보냈어요」 는 부르는 쪽 onSent 만');
  const mc = (MS.match(/var C = \[([\s\S]*?)\];/) || ['', ''])[1], ms2 = [];
  (mc.match(/'([^']*)'/g) || []).map(x => x.slice(1, -1)).join('').replace(/([^{}]+)\{[^}]*\}/g, (m, sel) => { ms2.push(sel.trim()); return ''; });
  is(ms2.length > 30 && ms2.every(r => r.split(',').every(x => /^\s*#mv2(Sheet|Dim)\b/.test(x))), '옷 ' + ms2.length + '줄 모두 #mv2Sheet · #mv2Dim 아래');
  const els = {}, loc = { href: '' };
  const mk = () => { const cl = new Set(); return { id: '', innerHTML: '', scrollTop: 0, setAttribute() {}, classList: { add: c => cl.add(c), remove: c => cl.delete(c), contains: c => cl.has(c) } }; };
  const copied = [];
  const W = { document: { head: { appendChild: e => { els[e.id] = e; } }, body: { appendChild: e => { els[e.id] = e; } }, createElement: () => mk(), getElementById: id => els[id] || null },
    setTimeout: f => f(), location: loc, copyText: t => copied.push(t), toast: () => {} };
  W.window = W; vm.createContext(W); vm.runInContext(MS, W);
  let got = null;
  W.MSG_V2.open({ who: '홍길동', tel: '010-1234-5678', items: [{ lb: '🙋 이분께 맞춘 글', note: '이분 사정', text: ch => '안녕하세요 ' + ch }, { lb: '💳 보험료', text: () => '이번 달도' }],
    onSent: (it, ch, t) => { got = [it.lb, ch, t]; } });
  let hs = els.mv2Sheet.innerHTML;
  is(/class="ph kk"/.test(hs) && /class="bub">안녕하세요 kakao</.test(hs) && /<b>1<\/b>/.test(hs) && /MSG_V2\.pick\(1\)/.test(hs) && /이분 사정/.test(hs) && /복사하고 카톡에 붙여 넣기/.test(hs),
    '카톡 — 노란 말풍선 · 안 읽음 1 · 시각, 글 고르는 칩 · 왜 이 글인지 · 「복사하고 카톡에 붙여 넣기」');
  W.MSG_V2.ch('sms'); hs = els.mv2Sheet.innerHTML;
  is(/class="ph sm"/.test(hs) && /안녕하세요 sms/.test(hs) && /010-1234-5678/.test(hs) && /문자 앱으로 보내기/.test(hs), '문자 — 파란 말풍선 · 받는 번호 · 문자 글 · 「문자 앱으로 보내기」');
  W.MSG_V2.edit(true); W.MSG_V2.typed('고쳐 쓴 글'); W.MSG_V2.edit(false); W.MSG_V2.go();
  is(loc.href === 'sms:01012345678?&body=' + encodeURIComponent('고쳐 쓴 글'), '✏️ 고쳐 쓴 글이 문자 앱으로 간다(번호 · 본문)');
  W.MSG_V2.ch('kakao'); W.MSG_V2.go();
  is(copied[0] === '안녕하세요 kakao', '카톡은 그 채널 글을 복사(고쳐 쓴 것은 채널마다 따로)');
  W.MSG_V2.ch('sms'); W.MSG_V2.sent();
  is(got && got[0] === '🙋 이분께 맞춘 글' && got[1] === 'sms' && got[2] === '고쳐 쓴 글' && !els.mv2Sheet.classList.contains('on'), '「보냈어요」 → onSent(고른 글 · 채널 · 보낸 글) 후 닫힘');
}

console.log('\n[12] ✍️ 지금 상황 · 걱정 · 기록 시트 (판 X513 · 시안 editCare · editField · openLog)');
{
  let B2 = box({}); let h2 = paint(B2);
  is(/onclick="cusV2Care\(\)">바꾸기/.test(h2) && /onclick="cusV2Log\(\)">✍️/.test(h2) && /class="more" onclick="cusV2Log\(\)">＋ 기록 남기기/.test(h2) && !/cuwWrite\(\)/.test(h2) && !/cusV2Jump\(\\?'cmCare/.test(h2),
    '상황 「바꾸기」 · ✍️ 기록 · ＋ 기록 남기기 → 새 시트 (예전 고치기 화면 · 연락 입력칸으로 안 넘어감)');
  B2.g.cusV2Care(); B2.flush(); let ss = B2.els.cv2Sheet.innerHTML;
  is(/홍\*동님 지금 상황/.test(ss) && /class="on" onclick="cusV2CarePut\(1\)">부모님 일/.test(ss) && /cusV2CarePut\(0\)">결혼 준비/.test(ss) && /cusV2CarePut\(-1\)">없음 · 모름/.test(ss) && B2.els.cv2Sheet.classList.contains('on'),
    '상황 시트 — CM_CARE 칩(지금 것은 진하게) · 「없음 · 모름」');
  B2.g.said.length = 0; B2.g.cusV2CarePut(2);
  const sv = B2.g.said;
  is(sv[0] && sv[0][0] === 'save' && sv[0][1] === 'c1' && sv[0][2] === '{"care":"은퇴 준비"}' && sv.some(x => x[0] === 'dp') && !B2.els.cv2Sheet.classList.contains('on'),
    '칩 한 번 → 있던 cmSave(id, {care}) · 예전 칸(cmDetailPaint)도 다시 그림 · 시트 닫힘');
  B2.g.said.length = 0; B2.g.cusV2CarePut(1);
  is(!B2.g.said.length, '지금과 같은 상황을 다시 누르면 저장 안 함');
  B2.g.cusV2Worry(); ss = B2.els.cv2Sheet.innerHTML;
  is(/걱정 한마디/.test(ss) && /id="cv2WorryIn"[^>]*value="엄마 간병이 걱정이에요"/.test(ss), '걱정 시트 — 적어 둔 한마디가 칸에 들어 있음');
  B2.els.cv2WorryIn = { value: '  애들 병원비  ' }; B2.g.said.length = 0; B2.g.cusV2WorryPut();
  is(B2.g.said[0] && B2.g.said[0][2] === '{"worry":"애들 병원비"}', '걱정 저장 → 있던 cmSave(id, {worry}) · 앞뒤 빈칸 걷음');
  B2.g.cusV2Log(); ss = B2.els.cv2Sheet.innerHTML;
  is(/홍\*동님 기록/.test(ss) && /class="on" onclick="cusV2LogK\(0\)">📞 전화/.test(ss) && /cusV2LogK\(2\)">🤝 만남/.test(ss) && /id="cv2LogIn"/.test(ss) && /cusTab\('talk'\)/.test(ss),
    '기록 시트 — 전화 · 카톡 · 만남 · 문자 칩 · 한 줄 · 「연락 기록 전체」(예전 탭)');
  B2.els.cv2LogIn = { value: '' }; B2.g.said.length = 0; B2.g.cusV2LogPut();
  is(!B2.g.said.length, '빈 줄이면 안 남김');
  B2.els.cv2LogK = { children: [0, 1, 2, 3].map(() => { const c = new Set(); return { classList: { toggle: (k, v) => v ? c.add(k) : c.delete(k), has: k => c.has(k) } }; }) };
  B2.g.cusV2LogK(2); B2.els.cv2LogIn = { value: '다음 주 화요일 다시' }; B2.g.cusV2LogPut();
  const t = B2.g.said.filter(x => x[0] === 'touch')[0];
  is(t && t[1] === 'c1' && t[2] === '다음 주 화요일 다시' && t[3] === '만남' && t[4] === '2026-11-20' && B2.g.said.some(x => x[0] === 'dp'),
    '남기기 → 있던 cmTouchAdd(id, 한 줄, 고른 갈래 「만남」, 오늘) · 두 화면 다시 그림');
  const B3 = box({}); delete B3.g.cmSave; B3.g.cusV2Care();
  is(!B3.els.cv2Sheet, 'cmSave 가 없는 판이면 시트 대신 예전 칸으로(jump)');
}

console.log('\n[13] 👥 고객 탭 목록 (판 X515 · 시안 rCust · rList)');
{
  const RP = IX.slice(IX.indexOf('function renderClientsPage(){'), IX.indexOf('function osClientsAfterRender(){'));
  is(RP.indexOf("cusV2ListPage") > RP.indexOf("OSC.view==='detail'") && RP.indexOf("cusV2ListPage") < RP.indexOf('<div class="t-h1"') &&
     /try\{ if\(typeof cusV2ListPage==='function'\)\{ var v2l=cusV2ListPage\(\); if\(v2l\)return v2l; \} \}catch\(eV2l\)\{\}/.test(RP) &&
     /\(\(typeof cusV2ListBack==='function'\)\?cusV2ListBack\(\):''\)/.test(RP),
    'renderClientsPage — 고객 한 분 창 다음 · 예전 제목 앞에서 새 목록(빈 글이면 예전 고객 365일) · 예전 화면엔 「✨ 새 고객 목록」 자리 — typeof · try 안');
  const RL = IX.slice(IX.indexOf('function osRenderList(){'), IX.indexOf('function osSetList(html){'));
  is(RL.indexOf('cusV2ListPaint') > RL.indexOf('if(cmHit(all[i],q))rows.push(all[i]);') && RL.indexOf('cusV2ListPaint') < RL.indexOf('var chips=cliFHtml(rows);') &&
     /try\{ if\(typeof cusV2ListPaint==='function'&&cusV2ListPaint\(rows,q\)\)return; \}catch\(eV2p\)\{\}/.test(RL),
    'osRenderList — 담당자 · 찾기(olRows · CM.pick · cmHit)를 다 거른 뒤, 예전 거르개 칩 앞에서 한 줄 — 명단 · 찾기를 새로 안 짬');
  const N2 = ['crmDbsOf', 'cmMetaOf', 'cmTemp', 'cqaTally', 'cmSortRows', 'holdSayOr', 'cmWhoChipsHtml', 'cliWhoPaint', 'osRenderList', 'osClientsFilter', 'osOpenClient', 'hmRtPerson', 'cregOpen'];
  const m2 = N2.filter(n => !has(n));
  is(!m2.length, '목록이 부르는 라이브 함수 ' + N2.length + '개가 앱에 있다' + (m2.length ? ' — 없음: ' + m2.join(', ') : ''));
  is(/function cliFStage\(c\)\{ return \(c&&\(c\.stage\|\|c\.tk\)\)\|\|''; \}/.test(IX) && /stage:r\.stage\|\|''/.test(IX) && /L\[i\]\.stage!=='거절'/.test(IX),
    '단계 값 — 배정 줄(olRows 의 stage) · 거절은 배정 줄 stage 「거절」(rjnTally 와 같은 자)');

  const mkL = (store, opt) => {
    opt = opt || {};
    const B = box(store, opt);
    const g = B.g, said = g.said;
    B.els.cl2 = {}; B.els.oscList = { innerHTML: '' }; B.els.cliWho = { innerHTML: '' };
    const DB = { c1: [{ id: 'd1', stage: 'AP', region: '순천' }], c2: [{ id: 'd2', stage: '계약완료', region: '여수' }], c3: [{ id: 'd3', stage: '거절', region: '' }] };
    Object.assign(g, {
      OSC: { q: opt.q || '', list: [], current: null },
      crmDbsOf: id => DB[id] || [],
      cmMetaOf: id => ({ c1: { care: '부모님 일' }, c2: {} }[id] || null),
      cmTemp: id => (id === 'c1' ? { e: '🔥', t: '3일 전', d: 3 } : { e: '❄️', t: '기록 없음', d: -1 }),
      cqaTally: id => (id === 'c1' ? { got: 4, all: 11 } : null),
      cmSortRows: L => { said.push(['sort', L.length]); },
      CM_BASE: { c1: { by: 1981 }, c2: {}, c3: {} },
      cmName: c => c.name_masked, holdSayOr: () => '<i>wait</i>', cmWhoChipsHtml: () => '<b>who</b>',
      cliWhoPaint: () => said.push(['who']), osRenderList: () => said.push(['re']), go: t => said.push(['go', t])
    });
    return B;
  };
  const ROWS = [{ id: 'c1', name_masked: '홍길동' }, { id: 'c2', name_masked: '성춘향' }, { id: 'c3', name_masked: '변학도' },
    { id: 'db:d9', _db: true, _dbid: 'd9', name_masked: '이*룡', stage: 'TA', region: '광양', src: '보장분석' }];
  let L = mkL({});
  const pg = L.g.cusV2ListPage();
  is(/<h1>고객<\/h1>/.test(pg) && /onclick="cusV2ListUse\(false\)">↩ 예전 화면/.test(pg) && /<div id="cliWho"><b>who<\/b><\/div>/.test(pg) && /id="oscSearch" placeholder="이름 · 전화번호"[^>]*oninput="osClientsFilter\(this\.value\)"/.test(pg) &&
     /<div id="oscList"><i>wait<\/i><\/div>/.test(pg) && /onclick="cregOpen\(\)">＋ 고객 넣기/.test(pg) && pg.indexOf('id="oscSearch"') < pg.indexOf('id="oscList"') && pg.indexOf('id="oscList"') < pg.indexOf('＋ 고객 넣기') &&
     pg.indexOf('id="cliWho"') < pg.indexOf('class="cv2 cl2" id="cl2"'),
    '틀 — 시안 차례(고객 → 찾기 → 목록 → ＋ 고객 넣기) · 찾기 · 목록 칸 id 는 예전 그대로(oscSearch · oscList — 기다림 · 못 받음 그림이 그대로 섬) · 담당자 줄은 .cv2 밖');
  is(/고객 365일 · 예전 목록/.test(pg) && /오늘의 미션 · 4년 유지관리/.test(pg), '예전 고객 365일(미션 · 4년 유지관리 · 달력 · 거르개)로 가는 줄 — 지운 것 없음');
  is(L.g.cusV2ListPaint(ROWS, '') === true, '새 틀이 서 있으면 목록을 그리고 true(osRenderList 는 거기서 멈춤)');
  let lh = L.els.oscList.innerHTML;
  is(/cusV2ListF\('all'\)">전체<small>4/.test(lh) && /cusV2ListF\('s0'\)">첫 전화<small>1/.test(lh) && /cusV2ListF\('s1'\)">첫 만남<small>1/.test(lh) && /cusV2ListF\('s5'\)">관리<small>1/.test(lh) &&
     /cusV2ListF\('rej'\)">거절<small>1/.test(lh) && !/cusV2ListF\('s2'\)/.test(lh) && /cusV2ListF\('s3'\)">제안/.test(lh) && /class="fchip on"[^>]*>전체/.test(lh),
    '단계 칩 — 전체 · 첫 전화 · 첫 만남 · 제안 · 청약 · 관리 · 거절(시안 차례) · 수는 지금 명단 · 「보장분석」 칩 없음(늘 0명)');
  is(/osOpenClient\('c1'\)"><div class="av s">홍<\/div>/.test(lh) && /홍길동님 <small>45세<\/small>/.test(lh) && /<span class="chip b">부모님 일<\/span>3일 전 연락/.test(lh) && /아는 것 4\/11 · 순천/.test(lh) && /<span class="chip b">첫 만남<\/span><\/button>/.test(lh),
    '한 줄 — 이름 · 나이 / 지금 상황 칩 · 마지막 연락 / 아는 것 n/m · 동네 / 단계 칩 (라이브 값 그대로)');
  is(/<span class="chip g">관리<\/span>/.test(lh) && /<span class="chip w">거절<\/span>/.test(lh) && /연락 기록 없음/.test(lh) && !/아는 것 null/.test(lh),
    '관리는 초록 · 거절은 주황 딱지 · 기록 없으면 「연락 기록 없음」 · 모르는 아는 것은 안 적음(0/11 로 지어내지 않음)');
  is(/hmRtPerson\('d9'\)">/.test(lh) && /이\*룡님/.test(lh) && /배정 DB · 보장분석/.test(lh) && /광양/.test(lh) && /<span class="chip b">첫 전화/.test(lh),
    '배정 DB 줄(아직 내 고객 아님) — 예전처럼 hmRtPerson · 가린 이름 · 어디서 왔나 · 동네');
  is(L.g.said.some(x => x[0] === 'sort' && x[1] === 4) && L.g.said.some(x => x[0] === 'who'), '차례는 예전 cmSortRows · 담당자 줄도 같이 다시 그림');
  L.g.cusV2ListF('rej');
  is(L.g.CUS_V2.CL.f === 'rej' && L.g.said.some(x => x[0] === 're'), '칩 → 고른 칸만 · 다시 그리기는 osRenderList 한 곳');
  L.g.cusV2ListPaint(ROWS, ''); lh = L.els.oscList.innerHTML;
  is(/class="fchip on"[^>]*>거절/.test(lh) && /변학도/.test(lh) && !/홍길동/.test(lh), '거절 칸 = 거절 단계 분만');
  L.g.cusV2ListF('s3'); L.g.cusV2ListPaint(ROWS, ''); lh = L.els.oscList.innerHTML;
  is(/이 칸에는 아무도 없어요/.test(lh), '빈 칸이면 「이 칸에는 아무도 없어요 · 전체를 누르면」');
  L.g.cusV2ListF('all'); L.g.cusV2ListPaint([], '김'); lh = L.els.oscList.innerHTML;
  is(/「김」 로 찾는 분이 없어요/.test(lh), '찾아서 없으면 그렇다고');
  const many = Array.from({ length: 75 }, (_, i) => ({ id: 'x' + i, name_masked: '홍갑돌' + i }));
  L.g.cusV2ListPaint(many, ''); lh = L.els.oscList.innerHTML;
  is((lh.match(/class="li"/g) || []).length === 60 && /cusV2ListMore\(\)">15명 더 보기/.test(lh), '한 번에 60명 · 나머지는 「n명 더 보기」');
  L.g.cusV2ListUse(false);
  is(L.store.apex_cus_v2 === 'old' && L.g.said.some(x => x[0] === 'go' && x[1] === 'clients') && L.g.cusV2ListPage() === '', '「↩ 예전 화면」 → old · 고객 탭 다시 그림 · 틀이 빈 글(→ 예전 고객 365일)');
  is(/cusV2ListUse\(true\)">✨ 새 고객 목록/.test(L.g.cusV2ListBack()), '예전 고객 365일 맨 위 「✨ 새 고객 목록」');
  delete L.els.cl2;
  is(L.g.cusV2ListPaint(ROWS, '') === false, '새 틀이 안 서 있으면 false — 예전 목록이 그림');
  is(mkL({}, { robot: true }).g.cusV2ListPage() === '' && mkL({}, { robot: true }).g.cusV2ListBack() === '' && mkL({ apex_cus_v2: '1' }, { allowed: false }).g.cusV2ListPage() === '',
    '자동 점검 브라우저 · 모두 끄기(ALLOWED=false)면 예전 화면 그대로 — 단추도 안 섬(예전 화면 점검이 그대로 돈다)');
}

console.log('\n[14] 💰 금액 칸 · ✓ 계약됐어요 (판 X524)');
{
  let B = box({}); let h = paint(B);
  is(/<span class="amt">예상 15만원<\/span>/.test(h), '오늘 화면 시트가 없는 판이면 예전처럼 글자만(지어낸 단추 없음)');
  B = box({}); B.g.HOME_V2 = { amt: () => {}, won: () => {} }; h = paint(B);
  is(/<button type="button" class="amt" onclick="HOME_V2\.amt\('d1'\)">예상 15만원<\/button>/.test(h) && !/✓ 계약됐어요/.test(h), '이름 줄 금액 칸 → HOME_V2.amt(배정 줄) · 청약 아니면 「계약됐어요」 없음');
  B = box({}, { stage: 'CS' }); B.g.HOME_V2 = { amt: () => {}, won: () => {} }; B.g.CUS.db.expect_premium = null; h = paint(B);
  is(/class="amt miss" onclick="HOME_V2\.amt\('d1'\)">금액 \?/.test(h) && /class="btn ok" onclick="HOME_V2\.won\('d1'\)">✓ 계약됐어요/.test(h) && h.indexOf('✓ 계약됐어요') > h.indexOf('class="steps"') && h.indexOf('✓ 계약됐어요') < h.indexOf('class="sit"'),
    '청약(CS) — 금액이 없으면 「금액 ?」 · 단계 칸 바로 밑 「✓ 계약됐어요」');
  is(!/\.rpc\(|pipeline_save/.test(sc), '고객 화면은 서버를 안 부름 — 저장은 오늘 화면의 한 곳');
}

console.log(bad ? ('\n✗ ' + bad + '건 어긋남') : '\n✓ 새 고객 화면은 예전 고객 창을 안 깨고 시안 차례로 섭니다');
process.exit(bad ? 1 : 0);
