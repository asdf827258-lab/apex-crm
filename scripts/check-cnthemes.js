#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   캐러셀 매거진 테마 넷 · 아이디/출처 칸이 제자리에 서나 (판 X227)

   사장님 말씀 (2026-10-28): 「1번부터 6번 총 4가지 테마를 만들었어 이거를
   내 메인세션 캐러셀 만들기에 접목해서, 뉴스를 이 카테고리로 만들수 있도록
   만들고,, 아이디 / 출처 만드는부분들을 따로 만들어서 메인세션에 넣어줘 —
   정책상품뉴스-> 캐러셀 만들기 이 부분이야. 디자인을 올리고 싶어」

   app/apex-cn-themes.js 를 브라우저 없이 vm 으로 돌려, 테마 넷 × 모양 일곱
   (cover · point · stat · quote · list · cta · news) 을 전부 그려 봅니다.

     ① index.html 에 <script> 한 줄로 붙어 있나 (여럿이 고치는 파일 — 한 줄만)
     ② 테마 넷이 다 그려지나 · 그린 글에 undefined / NaN / [object 가 없나
     ③ ★ 아이디 칸에 적은 것이 카드에 찍히나 — 테마마다 한 장 이상
     ④ ★★ 출처 — 적으면 마지막 장에 찍히고, <b>기존 뉴스 카드 스타일</b>에도
        같은 출처가 간다(cnSrcOf 하나를 감쌌으니). 비우면 원래 출처로 돌아간다.
        <b>없으면 빈손</b> — 「자료 ·」 머리만 덩그러니 찍히면 안 된다 (1번)
     ⑤ 마지막 장에 정보 제공 안내 문구가 빠지지 않나 · 심의필 문구를 적으면 찍히나
     ⑥ ★ html2canvas 가 box-shadow 를 상자 <b>위에</b> 칠해 흰 카드가 회색(214)이
        된 일이 있었다 — 굽기 전에 그림자를 떼어 내는 자리(fakeShadows)가 살아 있나
     ⑦ ★ 누구나 따라 하게 (판 X228 · 사장님 말씀 「누구도 따라할수 있게 했어?」 →
        「응 그렇게 해」) — ①테마 ②아이디 ③사진 ④저장 단계 줄이 서고, 한 일만큼
        ✓ 가 켜지고, 지금 할 단계 <b>하나만</b> 강조되나 · 저장 때 아이디·심의필이
        비었으면 <b>묻고</b>, 「아니오」 면 굽지 않나 · 다 채웠으면 <b>안 묻나</b>(헛물음 0)
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = process.cwd();
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);

const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const SRC = fs.readFileSync(path.join(ROOT, 'app/apex-cn-themes.js'), 'utf8');

head('① 붙는 자리');
const tags = IDX.match(/<script src="apex-cn-themes\.js[^"]*"><\/script>/g) || [];
is(tags.length === 1, 'index.html 에 apex-cn-themes.js 를 부르는 줄이 하나 (' + tags.length + ')');
is(IDX.indexOf(tags[0] || '@@') > IDX.lastIndexOf('function renderTodayCard('), '그 줄이 renderTodayCard 정의보다 뒤에 있다 (감쌀 대상이 먼저 있어야 함)');

/* ── 가짜 브라우저 — 이 파일이 쓰는 만큼만 ── */
function el() { return { style: {}, children: [], appendChild() {}, setAttribute() {}, remove() {}, querySelectorAll() { return []; }, getContext() { return null; } }; }
const store = {};
const doc = { head: el(), body: el(), getElementById: () => null, createElement: el, querySelector: () => null };
let SRCVAL = '생명보험협회';
const ctx = {
  document: doc, localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = '' + v; } },
  setTimeout, clearTimeout, Promise, Math, Date, JSON,
  confirm: m => { ctx._asked.push(m); return ctx._answer; }, _asked: [], _answer: false,
  cnGo: k => { ctx.CN.i = k; }, cnPick() {}, _baked: 0,
  ensureHtml2Canvas: () => { ctx._baked++; return new Promise(() => {}); },
  osEsc: s => ('' + (s == null ? '' : s)).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])),
  cnDateStr: () => '2026.10.28',
  CN: { i: 0, imgs: {}, ai: null, aiPlan: null, style: 'news' },
  toast() {}, cnDownload() {}, cnFileName: i => 'f' + i,
  renderTodayCard: () => '<div class="cn-head">📅 오늘의 카드뉴스 <span class="cn-badge">뉴스 카드 스타일</span></div><div class="cn2-stage">X</div>',
  cnSlidePreview: () => 'ORIG', cnSrcOf: () => SRCVAL, cnImgPrompt: () => 'P',
  cardnewsSaveOne() {}, cardnewsSaveAll() {},
  cnMagText: sl => ({ k: sl.mk || '', t: sl.mt || '', s: sl.ms || '' }),
  cnLayout: sl => sl.layout,
};
ctx.window = ctx;
ctx.cardnewsSlides = () => ctx.CN.ai;
vm.createContext(ctx);
try { vm.runInContext(SRC, ctx, { filename: 'apex-cn-themes.js' }); is(true, '파일이 문법 오류 없이 돈다'); }
catch (e) { is(false, '파일이 돈다 — ' + e.message); process.exit(1); }

const LAYS = ['cover', 'point', 'stat', 'quote', 'list', 'news', 'cta'];
ctx.CN.ai = LAYS.map((L, i) => ({ layout: L, mk: '키커' + i, mt: '제목 **강조** ' + i + '\n둘째 줄', ms: '본문 문장입니다 ' + i,
  big: L === 'stat' ? '2.50%' : '', items: L === 'list' ? ['대출: 가산금리 확인', '예금: 만기 비교', '노후 점검'] : [] }));
const THEMES = ['lime', 'note', 'zine', 'app'];
const draw = (th, i) => { ctx.CN.style = th; return ctx.cnSlidePreview(ctx.CN.ai[i], i, LAYS.length); };

head('② 테마 넷 × 모양 일곱');
THEMES.forEach(th => {
  const outs = LAYS.map((L, i) => draw(th, i));
  const empty = outs.filter(h => !/class="cx /.test(h)).length;
  const junk = outs.filter(h => /undefined|NaN|\[object /.test(h)).length;
  is(!empty && !junk, th + ' — 일곱 장이 다 그려지고(빈 장 ' + empty + ') 찌꺼기 글자가 없다(' + junk + ')');
});
ctx.CN.style = 'news';
is(ctx.cnSlidePreview(ctx.CN.ai[0], 0, 7) === 'ORIG', '기본 스타일(뉴스 카드)은 원래 함수가 그린다');

head('③ 아이디');
ctx.cxField('id', 'apex.test');
THEMES.forEach(th => {
  const hit = LAYS.some((L, i) => draw(th, i).indexOf('@apex.test') >= 0);
  is(hit, th + ' — 「@apex.test」 가 카드에 찍힌다 (@ 는 저절로 붙음)');
});

head('④ 출처');
const CTA = LAYS.indexOf('cta');
THEMES.forEach(th => is(draw(th, CTA).indexOf('생명보험협회') >= 0, th + ' — 비워 두면 원래 출처(생명보험협회)가 마지막 장에'));
ctx.cxField('src', '금융위원회 보도자료 2026.10.27');
THEMES.forEach(th => is(draw(th, CTA).indexOf('금융위원회 보도자료') >= 0, th + ' — 적은 출처가 마지막 장에'));
is(ctx.cnSrcOf() === '금융위원회 보도자료 2026.10.27', '★ 기존 뉴스 카드 스타일도 같은 출처를 받는다 (cnSrcOf)');
ctx.cxField('src', '');
SRCVAL = '';
is(ctx.cnSrcOf() === '', '출처 칸을 비우고 원래 출처도 없으면 빈손 — 지어내지 않는다');
THEMES.forEach(th => { const h = draw(th, CTA); is(!/자료 · <b><\/b>|자료 · (<br>|<\/)|SOURCE<\/div><div class="cxC-src"><\/div>/.test(h), th + ' — 출처가 없을 때 「자료 ·」 머리만 남지 않는다'); });

head('⑤ 안내 문구 · 심의필');
THEMES.forEach(th => is(draw(th, CTA).indexOf('정보 제공 목적') >= 0, th + ' — 마지막 장에 정보 제공 안내 문구'));
ctx.cxField('seal', '에이플러스에셋 준법감시필 00-0000-0000');
THEMES.forEach(th => is(draw(th, CTA).indexOf('준법감시필 00-0000-0000') >= 0, th + ' — 심의필 문구를 적으면 마지막 장에 찍힌다'));

head('⑥ 그림자');
is(/function fakeShadows\(/.test(SRC) && /fakeShadows\(node\)/.test(SRC), '굽기 전에 box-shadow 를 떼어 내는 자리가 있고, 실제로 부른다');
is(/boxShadow = 'none'/.test(SRC), '떼어 낸다 (box-shadow → none)');

head('⑦ 단계 줄 · 저장 전 물음');
ctx.cxField('id', ''); ctx.cxField('seal', ''); ctx.CN.imgs = {}; ctx.CN.style = 'news';
const steps = () => { const m = ctx.renderTodayCard().match(/<div class="cxs" id="cxSteps">([\s\S]*?)<\/div><div class="cxp-hd">/); return m ? m[1] : ''; };
const btns = h => h.split('<button').slice(1);
const curOf = h => btns(h).map((b, i) => (/class="cxs-b[^"]*\bcur\b/.test(b) ? i + 1 : 0)).filter(Boolean).join(',');
const okN = h => btns(h).filter(b => /class="cxs-b[^"]*\bok\b/.test(b)).length;
let S = steps();
is(btns(S).length === 4, '단계 줄에 단추가 넷');
is(curOf(S) === '1' && okN(S) === 0, '처음엔 ① 테마만 강조, ✓ 0');
ctx.CN.style = 'lime'; S = steps();
is(curOf(S) === '2' && okN(S) === 1, '테마를 고르면 ① ✓ · ② 아이디 강조');
ctx.cxField('id', 'apex.test'); S = steps();
is(curOf(S) === '3' && okN(S) === 2, '아이디를 적으면 ② ✓ · ③ 사진 강조');
is(S.indexOf('빈 장 7개') >= 0, '③ 에 빈 장 수가 찍힌다 (7장 중 7)');
LAYS.forEach((L, i) => { ctx.CN.imgs[i] = { url: 'data:x' }; }); S = steps();
is(curOf(S) === '4' && okN(S) === 3, '사진을 다 넣으면 ③ ✓ · ④ 저장 강조');
ctx.CN.imgs = {};
ctx.cxField('id', ''); ctx._asked = []; ctx._answer = false; ctx._baked = 0;
ctx.cardnewsSaveOne();
is(ctx._asked.length === 1 && /아이디/.test(ctx._asked[0]) && /준법감시필/.test(ctx._asked[0]), '★ 아이디·심의필이 비면 저장 전에 묻는다 (둘 다 말함)');
is(ctx._baked === 0, '★ 「아니오」 면 굽지 않는다');
ctx._asked = []; ctx.cardnewsSaveAll();
is(ctx._asked.length === 1 && ctx._baked === 0, '모두 저장도 같이 묻고, 「아니오」 면 안 굽는다');
ctx._asked = []; ctx._answer = true; ctx.cardnewsSaveOne();
is(ctx._baked === 1, '「예」 면 그대로 굽는다 — 막지 않는다 (6번)');
ctx.cxField('id', 'apex.test'); ctx.cxField('seal', '에이플러스에셋 준법감시필 00-0000-0000'); ctx._asked = []; ctx._baked = 0;
ctx.cardnewsSaveOne();
is(ctx._asked.length === 0 && ctx._baked === 1, '다 채웠으면 묻지 않는다 (헛물음 0)');
ctx.CN.style = 'news'; ctx.cxField('id', ''); ctx._asked = []; ctx.cardnewsSaveOne();
is(ctx._asked.length === 0, '기본 뉴스 카드는 아이디를 안 찍으니 묻지 않는다');

console.log('\n' + (bad ? '✗ ' + bad + '/' + n + ' 실패' : '✓ ' + n + '가지 모두 통과'));
process.exit(bad ? 1 : 0);
