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
    createElement: t => ({ tagName: t, id: '', textContent: '' }),
    getElementById: id => {
      if (id === 'cusWin') return win;
      if (id === 'cv2') { const b = els.cv2Box; if (!b || b.innerHTML.indexOf('id="cv2"') < 0) return null; return { classList: { contains: c => c === 'off' && b.innerHTML.indexOf('class="cv2 off"') >= 0 } }; }
      return els[id] || null;
    }
  };
  els.cv2Box = { innerHTML: '' };
  const stage = opt.stage === undefined ? 'AP' : opt.stage;
  const meta = opt.meta || { care: '부모님 일', worry: '엄마 간병이 걱정이에요', fam: '남편', touch: [{ at: '2026-11-18', how: '전화', note: '다음 주에 다시' }] };
  const g = {
    localStorage: ls, navigator: { webdriver: !!opt.robot }, document: doc, setTimeout: f => { Q.push(f); return 0; }, toast: () => {},
    osEsc: s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    OSC: { current: { id: 'c1', name_masked: '홍*동' } },
    cmOf: opt.cmThrow ? () => { throw new Error('boom'); } : () => meta,
    CM_BASE: { c1: opt.base || { by: 1981, gd: 'F', inc: 300 } },
    CUS: { db: opt.noDb ? null : { id: 'd1', stage, region: '순천', dong: '연향동', expect_premium: 150000, source: '보장분석', contract_premium: null }, calls: [] },
    oscAge: by => (by ? 2026 - by : null), cmName: c => c.name_masked, cmWhoName: () => '홍판서',
    cuwToday: () => '2026-11-20', cuwAppt: () => '', cuwApptDay: () => '', cuwApptTxt: a => a, cmNextAll: () => opt.next || [],
    ccTelOf: () => '010-0000-0000', cmFfCount: () => 4, cmFfTotal: () => 25, cusTabN: k => (k === 'doc' ? 2 : null),
    cusLog: (calls, t) => t.map(x => ({ src: 'touch', kind: x.how, note: x.note, at: x.at })), CC_HOWE: { '전화': '📞' },
    OSCP: { rows: [{}, {}], busy: false },
    osTabAllowed: () => true, navItemOf: id => ({ id, icon: '🔧', title: '도구 ' + id }),
    MK_TALK: { CATS: { care: { label: '간병·노후', dambo: ['간병인', '치매'] }, cancer3: { label: '암·뇌·심장', dambo: ['암', '뇌'] }, hospital: { label: '병원비', dambo: ['실손'] }, women: { label: '여성', dambo: ['유방'] }, child: { label: '자녀', dambo: ['어린이'] }, life: { label: '생활·배상', dambo: ['일배책'] }, accident: { label: '상해', dambo: ['골절'] } } },
    APEX_STAGE: { taAge: [{ k: '4050', pt: '가족과 함께 보는 자리' }], objList: () => [{ key: 'family', title: '가족과 상의할게요' }, { key: 'money', title: '돈 여유 없어요' }, { key: 'think', title: '생각해 볼게요' }, { key: 'many', title: '보험 이미 있어요' }],
      of: s => ({ know: [{ tab: 'wallets' }, { tab: 'treatpay' }] }) },
    HM_DOOR: { THEME_CAT: { silson: 'hospital' } }, TA_OPENER: { db: () => ({ theme: 'silson' }) }, TA5: { THEMES: { silson: { name: '실손 점검' } } }
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
const hostLine = `'<div class="cv2-box" id="cv2Box" data-cus-tab="sum">'+((typeof cusV2Html==='function')?cusV2Html(c):'')+'</div>'+`;
is(IX.split(hostLine).length === 2 && IX.indexOf(hostLine) < IX.indexOf(`cusSec('sum','<div id="cuwNow">'`) && IX.indexOf(hostLine) > IX.indexOf('function osClientDetailHtml(c){'),
  '요약 자리(cv2Box) 한 줄이 osClientDetailHtml 안, 예전 요약(cuwNow) 바로 앞 — 파일이 없어도 빈 칸');
const cp = IX.slice(IX.indexOf('function cuwPaint(c){'), IX.indexOf('function osClientDetailHtml(c){'));
is(/try\{ if\(typeof cusV2Paint==='function'\)cusV2Paint\(c\); \}catch\(eV2\)\{\}/.test(cp), 'cuwPaint 안에서 다시 그리기 — typeof · try 안');
is((IX.match(/cusV2/g) || []).length === 4, 'index.html 에 cusV2 이름은 네 번뿐(싣기 빼고 세 자리)');

console.log('\n[4] 칸 차례 = 시안 openCust');
B = box({}); h = paint(B);
const ORD = ['class="who"', 'class="qa4"', 'class="steps"', 'class="sit"', 'class="recc"', '<b>아는 것</b>', '<b>보험</b>', '<b>기록</b>', '<b>더 보기</b>'];
const at = ORD.map(k => h.indexOf(k));
is(at.every(x => x >= 0) && at.every((x, i) => !i || x > at[i - 1]), '이름 → 단추 넷 → 단계 → 지금 상황 → 권할 것 → 아는 것 → 보험 → 기록 → 더 보기');

console.log('\n[5] 칸을 채우고 누르는 라이브 함수가 있다');
const has = n => new RegExp('function ' + n + '\\(|var ' + n + '\\s*=|g\\.' + n + '\\s*=|window\\.' + n + '\\s*=').test(IX + '\n' + OTHER);
const NEED = ['cmOf', 'oscAge', 'cmName', 'cmWhoName', 'cuwToday', 'cuwAppt', 'cuwApptDay', 'cuwApptTxt', 'cmNextAll', 'ccSms', 'cuwWrite', 'cuwNxOpen',
  'cusTab', 'cuwSheet', 'cusReveal', 'oscTopEdit', 'cqaWal', 'cmFfCount', 'cmFfTotal', 'cusTabN', 'ccTelOf', 'osTabAllowed', 'navItemOf', 'go', 'hmDoorGo', 'CM_BASE', 'CUS', 'CC_HOWE'];
const miss = NEED.filter(n => !has(n));
is(!miss.length, '부르는 함수 ' + NEED.length + '개가 앱에 있다' + (miss.length ? ' — 없음: ' + miss.join(', ') : ''));
is(/cusLog/.test(IX + OTHER), 'cusLog(통화 + 접촉 한 줄기)가 앱에 있다');
const sheets = (IX.match(/var CUW_SHEETS=\[[^\n]*/) || [''])[0];
is(/\['base'/.test(sheets) && /\['stage'/.test(sheets), '부르는 고치기 화면 base · stage 가 CUW_SHEETS 에 있다');
const tabs = (IX.match(/var CUS_TABS=\[[^\n]*/) || [''])[0];
is(['talk', 'cov', 'doc', 'info'].every(k => tabs.indexOf("'" + k + "'") >= 0), '더 보기의 탭 넷(talk · cov · doc · info)이 CUS_TABS 에 있다');

console.log('\n[6] 「＋ 적기」 가 데려가는 칸이 있다');
const F = (sc.match(/cusV2Jump\(\\'([A-Za-z]+)\\'\)/g) || []).map(s => s.match(/\\'([A-Za-z]+)\\'/)[1]);
const Fu = [...new Set(F)];
const nof = Fu.filter(id => !new RegExp('id=\\\\?"' + id + '\\\\?"|id=\\\\?\'' + id + '\\\\?\'').test(IX));
is(Fu.length >= 8 && !nof.length, '칸 ' + Fu.length + '개(' + Fu.join(' · ') + ')가 고객 창에 있다' + (nof.length ? ' — 없음: ' + nof.join(', ') : ''));
const ap = IX.slice(IX.indexOf('var CM_FIELDS=['), IX.indexOf('var CM_FIELDS=[') + 12000);
is(['fam', 'care', 'due', 'worry', 'bd', 'cd', 'ref'].every(k => ap.indexOf("['" + k) >= 0), '읽는 고객 칸 이름(fam · care · due · worry · bd · cd · ref)이 CM_FIELDS 에 있다');

console.log('\n[7] 서버 · 저장');
is(!/\.from\(|fetch\(|supabase|XMLHttpRequest|osClient\(/.test(sc), '서버를 부르지 않는다');
const sets = sc.match(/setItem\([^)]*\)/g) || [];
is(sets.length === 1 && /setItem\(KEY,/.test(sets[0]), '저장은 이 기기 고르기(apex_cus_v2) 한 칸뿐');
is(!/cmSave|cmTouchAdd|cshMark|hdbTo/.test(sc), '고객 칸을 직접 저장하지 않는다 — 있던 고치기 화면으로 데려가기만');

console.log('\n[8] 옷은 .cv2 아래 · 요약 탭에서만 감춘다');
const cssBody = (SRC.match(/var C = \[([\s\S]*?)\];/) || ['', ''])[1];
const rules = [];
(cssBody.match(/'([^']*)'/g) || []).map(s => s.slice(1, -1)).join('').replace(/@media[^{]*\{((?:[^{}]*\{[^}]*\})*)\}/g, (m0, inner) => { inner.replace(/([^{}]+)\{/g, (m, sel) => { rules.push(sel.trim()); }); return ''; })
  .replace(/([^{}]+)\{[^}]*\}/g, (m, sel) => { rules.push(sel.trim()); return ''; });
const badSel = rules.filter(r => r.split(',').some(s => !/^\s*(\.cv2\b|#cusWin\.cv2-on\[data-tab="sum"\]\[data-sheet=""\]>|#cusWin>\.cv2-box)/.test(s)));
is(rules.length > 30 && !badSel.length, '옷 ' + rules.length + '줄 모두 .cv2 · #cusWin.cv2-on(요약·고치기 아닐 때) 아래' + (badSel.length ? ' — 밖: ' + badSel.slice(0, 3).join(' | ') : ''));
is(/#cusWin\.cv2-on\[data-tab="sum"\]\[data-sheet=""\]>\.cus-head\{display:none!important\}/.test(SRC) && /#cusWin\.cv2-on\[data-tab="sum"\]\[data-sheet=""\]>\[data-cus-tab="sum"\]:not\(\.cv2-box\)\{display:none!important\}/.test(SRC),
  '예전 머리 · 요약은 「요약 탭 + 고치기 화면 아님 + 새 화면」 일 때만 감춘다 — 연락 · 보장 · 서류 · 정보 · 고치기는 예전 그대로');
is(/@media print\{#cusWin>\.cv2-box\{display:none!important\}\}/.test(SRC), '인쇄에는 안 나온다(예전 칸이 다 나옴)');

console.log('\n[9] 가짜 데이터로 그려 본다');
B = box({}); h = paint(B);
is(/<button type="button" class="past"[^>]*>첫 전화/.test(h) && /<button type="button" class="cur"[^>]*>첫 만남/.test(h) && !/>보장분석</.test(h), '단계 AP → 첫 전화 지남 · 첫 만남 지금 · 「보장분석」 칸은 라이브 단계가 아니라 안 세움');
is(B.win.classList.contains('cv2-on'), '창에 새 화면 표(cv2-on)가 붙는다');
is(/간병·노후 — 간병인 · 치매/.test(h) && /걱정 한마디/.test(h), '권할 것 — 걱정 한마디(간병)가 지금 상황보다 먼저');
is(/가족과 함께 보는 자리/.test(h) && /「가족과 상의할게요」 「돈 여유 없어요」/.test(h), '어떻게(나이대 45세 → 4050) · 막히면(AP 단계 거절 둘)');
is(/<b>예상 15만원<\/b>|예상 15만원/.test(h) && /순천 연향동/.test(h) && /href="tel:010-0000-0000"/.test(h), '배정 줄의 예상 금액 · 동네, 번호가 있으면 📞 전화');
is(/엄마 간병이 걱정이에요/.test(h) && /다음 주에 다시/.test(h) && /증권 2건/.test(h) && /4 \/ 25칸/.test(h), '걱정 · 기록 · 보험 건수 · 팩트파인딩 칸 수가 라이브 값 그대로');
B = box({}, { noDb: true, meta: {}, base: {} }); h = paint(B);
is(!/사는 곳/.test(h) && !/class="steps"[\s\S]*?class="cur"/.test(h.slice(h.indexOf('class="steps"'), h.indexOf('class="sit"'))) && /담당 홍판서/.test(h) && !/세 ·|d+세/.test(h.slice(0, h.indexOf('class="qa4"'))) && /＋ 적기/.test(h),
  '배정 줄 없는 분 — 사는 곳 칸 없음 · 단계 칸 안 켬 · 빈 칸은 「＋ 적기」(지어내지 않음)');
is(/이번 달 1위/.test(h), '아무것도 모르면 권할 것은 「이번 달 1위」 로(상품전략기에서)');
B = box({}, { stage: '거절' }); h = paint(B);
is(/class="chip w">거절/.test(h), '거절 단계는 이름 줄에 「거절」 딱지');
B = box({}, { cmThrow: true }); h = paint(B);
is(/class="who"/.test(h) && /class="qa4"/.test(h) && /<b>더 보기<\/b>/.test(h), '고객 칸(cmOf)이 터져도 그 칸만 빠지고 나머지는 선다');
B = box({}, { next: [{ what: '보장분석 결과 전화', due: '2026-11-19' }] }); h = paint(B);
is(/기한 지남 · 보장분석 결과 전화/.test(h), '다음 할 일 — 요약 「지금 할 일」 과 같은 차례(기한 지난 할 일)');

console.log(bad ? ('\n✗ ' + bad + '건 어긋남') : '\n✓ 새 고객 화면은 예전 고객 창을 안 깨고 시안 차례로 섭니다');
process.exit(bad ? 1 : 0);
