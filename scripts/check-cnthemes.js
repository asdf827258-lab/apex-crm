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
const UPBTN = '<button class="btn btn-ghost" onclick="cnPick()">🖼 직접 업로드</button>';
const ctx = {
  document: doc, localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = '' + v; } },
  setTimeout, clearTimeout, Promise, Math, Date, JSON,
  confirm: m => { ctx._asked.push(m); return ctx._answer; }, _asked: [], _answer: false,
  cnGo: k => { ctx.CN.i = k; }, cnPick() {}, _baked: 0,
  ensureHtml2Canvas: () => { ctx._baked++; return new Promise(() => {}); },
  _calls: [], _key: '', _fetchImpl: null,
  cnImgFetch: (m, p, c) => { ctx._calls.push({ m: m, c: c, p: p }); return ctx._fetchImpl(m, p, c); },
  getGeminiKey: () => ctx._key,
  Image: function () { const me = this; Object.defineProperty(me, 'src', { set() { setTimeout(() => me.onerror && me.onerror(), 0); } }); },
  osEsc: s => ('' + (s == null ? '' : s)).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])),
  cnDateStr: () => '2026.10.28',
  CN: { i: 0, imgs: {}, ai: null, aiPlan: null, style: 'news' },
  toast() {}, cnDownload() {}, cnFileName: i => 'f' + i,
  renderTodayCard: () => '<div class="cn-head">📅 오늘의 카드뉴스 <span class="cn-badge">뉴스 카드 스타일</span></div>' + UPBTN + '<div class="cn2-stage">X</div>',
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

(async () => {
head('⑧ AI 사진 — 화보 촬영처럼 (판 X231)');
ctx.CN.style = 'news';
is(ctx.cnImgPrompt(ctx.CN.ai[0]) === 'P', '기본 뉴스 카드는 원래 사진 지시를 그대로 쓴다');
const P = {};
THEMES.forEach(th => { ctx.CN.style = th; P[th] = LAYS.map((L, i) => ctx.cnImgPrompt(ctx.CN.ai[i])); });
THEMES.forEach(th => {
  const all = P[th].join(' ');
  is(!/navy and blue tones|Korean business context/.test(all), th + ' — ★ 「navy · business」 꼬리가 떨어졌다 (모든 장이 경제신문 자료사진이 되던 까닭)');
  is(P[th].every(p => /4:5/.test(p) && /no text/i.test(p) && /85mm/.test(p)), th + ' — 장마다 4:5 · 글자 금지 · 렌즈 지시가 있다');
});
is(/seamless backdrop/.test(P.lime[0]) && /Han River/.test(P.note[0]) && /rooftop/.test(P.zine[0]) && /cafe in Seoul at night/.test(P.app[0]),
   '테마마다 촬영 장소가 다르다 (스튜디오 · 한강 · 옥상 · 밤 카페 — 참고 이미지 네 갈래)');
is(/close-up portrait/.test(P.lime[0]) && /smile/.test(P.lime[LAYS.indexOf('cta')]) && /profile/.test(P.lime[LAYS.indexOf('quote')]),
   '장 모양마다 구도가 다르다 (표지 클로즈업 · 인용 옆얼굴 · 마지막 장 미소)');
const model = p => (p.match(/Model: ([^.]*)\./) || [])[1] || '';
is(new Set(P.lime.map(model)).size === 1 && model(P.lime[0]), '★ 한 덱은 같은 모델 — 일곱 장 모두 「' + model(P.lime[0]).slice(0, 30) + '…」');
ctx.cxField('who', 'none'); ctx.CN.style = 'zine';
is(/no people at all/.test(ctx.cnImgPrompt(ctx.CN.ai[0])) && !/Model:/.test(ctx.cnImgPrompt(ctx.CN.ai[0])), '「인물 없이」 를 고르면 사람을 안 넣는다');
ctx.cxField('who', 'm30');
is(/mid-30s/.test(ctx.cnImgPrompt(ctx.CN.ai[1])), '인물을 고르면 그 사람으로 찍는다 (30대 남성)');
ctx.cxField('who', '');

/* 모델 고르기 */
const ok = () => Promise.resolve('data:image/png;base64,AAAA');
ctx.CN.style = 'lime';
ctx._calls = []; ctx._key = ''; ctx._fetchImpl = ok;
await ctx.cnImgFetch('gemini-2.5-flash-image', 'x');
let c0 = ctx._calls;
is(c0.length === 1 && c0[0].m === 'gemini-2.5-flash-image' && c0[0].c && c0[0].c.imageConfig.aspectRatio === '4:5',
   '공용 연결 — 표준 모델을 <b>4:5</b> 로 부른다 (Pro 는 서버 10초 한도에 잘려 안 부른다)');
ctx._calls = []; ctx._key = 'AIzaTEST';
await ctx.cnImgFetch('gemini-2.5-flash-image', 'x');
c0 = ctx._calls;
is(c0.length === 1 && c0[0].m === 'gemini-3-pro-image-preview' && c0[0].c.imageConfig.imageSize === '2K' && c0[0].c.imageConfig.aspectRatio === '4:5',
   '개인 키 — 최고 모델(Pro · 2K · 4:5)을 먼저 부른다');
ctx._calls = []; ctx._fetchImpl = (m) => /pro/.test(m) ? Promise.reject(Object.assign(new Error('RESOURCE_EXHAUSTED quota'), { status: 429 })) : ok();
let got = ''; try { got = await ctx.cnImgFetch('gemini-2.5-flash-image', 'x'); } catch (e) { got = 'ERR ' + e.message; }
c0 = ctx._calls.map(x => x.m);
is(c0.join(',') === 'gemini-3-pro-image-preview,gemini-2.5-flash-image' && /^data:/.test(got), '★ Pro 가 한도로 막히면 그 자리에서 표준으로 내려가 사진을 받는다 — 빈손 0');
ctx._calls = []; await ctx.cnImgFetch('gemini-2.5-flash-image', 'x');
is(ctx._calls.map(x => x.m).join(',') === 'gemini-2.5-flash-image', '한 번 막힌 Pro 는 이번 접속 동안 다시 안 부른다 (헛기다림 0)');
ctx.CN.style = 'news'; ctx._calls = []; ctx._fetchImpl = ok;
await ctx.cnImgFetch('gemini-2.5-flash-image', 'x');
is(ctx._calls.length === 1 && !ctx._calls[0].c, '기본 뉴스 카드의 사진 부르기는 그대로 둔다');
is(/function cnImgFetch\(mdl,prompt,cfg\)/.test(IDX) && /payload\.generationConfig\[ck\]=cfg\[ck\]/.test(IDX), 'index.html 의 cnImgFetch 가 cfg(4:5 · 2K)를 실제로 싣는다');

head('⑨ 실사 사진 찾기 (판 X235)');
/* 서버 함수 — 바깥을 한 번도 안 부르고 fetch 를 갈아 끼워 잽니다 (8번) */
const FN = path.join(ROOT, 'netlify/functions/photo-search.js');
const FSRC = fs.readFileSync(FN, 'utf8');
is(/\/api\/photo-search\s+\/\.netlify\/functions\/photo-search\s+200/.test(fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8')), '_redirects 에 /api/photo-search 길이 열렸다');
is(!/korea\.kr\/[^\s"']*\.(jpg|png)|yna\.co\.kr|imgnews|og:image/i.test(FSRC), '★ 뉴스 기사·정책브리핑 사진을 긁어 오는 길이 없다 (저작권 · 머리글에 까닭)');
const realFetch = global.fetch; const env0 = Object.assign({}, process.env);
const FAKE = { calls: [] };
global.fetch = async (u, o) => {
  FAKE.calls.push(String(u));
  const J = (b, st) => ({ ok: (st || 200) < 300, status: st || 200, json: async () => b, text: async () => JSON.stringify(b) });
  if (/generativelanguage/.test(u)) return J({ candidates: [{ content: { parts: [{ text: 'korean doctor hospital' }] } }] });
  if (/api\.pexels\.com/.test(u)) return J({ photos: [{ id: 1, alt: 'a', photographer: 'Kim P', url: 'https://www.pexels.com/photo/1', src: { medium: 'https://images.pexels.com/m1.jpg', original: 'https://images.pexels.com/o1.jpg' } }] });
  if (/api\.unsplash\.com\/search/.test(u)) return J({ results: [{ id: 'u1', alt_description: 'b', user: { name: 'Lee U', links: { html: 'https://unsplash.com/@lee' } }, urls: { small: 'https://images.unsplash.com/s1', raw: 'https://images.unsplash.com/r1?ixid=1' }, links: { download_location: 'https://api.unsplash.com/photos/u1/download?ixid=1' } }] });
  if (/api\.unsplash\.com\/photos\/.*\/download/.test(u)) return J({ url: 'x' });
  return J({}, 404);
};
const fnRun = async (qs, hdr) => { delete require.cache[require.resolve(FN)]; const m = require(FN); const r = await m.handler({ httpMethod: 'GET', headers: hdr || {}, queryStringParameters: qs }); return { st: r.statusCode, b: JSON.parse(r.body || '{}') }; };
delete process.env.PEXELS_API_KEY; delete process.env.UNSPLASH_ACCESS_KEY; delete process.env.GEMINI_API_KEY; delete process.env.SHARED_TOKEN;
let R = await fnRun({ q: '병원 진료비' });
is(R.b.ok && R.b.items.length === 0 && R.b.missing.join(',') === 'PEXELS_API_KEY,UNSPLASH_ACCESS_KEY', '★ 키가 없으면 「없다」 고 이름까지 말한다 — 빈 목록으로 조용히 넘기지 않는다 (1번)');
process.env.PEXELS_API_KEY = 'pk'; process.env.UNSPLASH_ACCESS_KEY = 'uk'; process.env.GEMINI_API_KEY = 'gk'; FAKE.calls = [];
R = await fnRun({ q: '병원 진료비' });
is(R.b.translated && R.b.query === 'korean doctor hospital', '한글 검색어를 영어 사진 검색어로 바꾼다 (Gemini)');
is(R.b.items.length === 2 && R.b.items[0].src === 'Pexels' && R.b.items[1].src === 'Unsplash', '두 곳 결과를 번갈아 섞는다');
is(R.b.items.every(x => x.name && x.link && x.thumb && /w=1080/.test(x.full) && /h=1350/.test(x.full)), '사진마다 사진가 이름·링크가 있고, 1080×1350 으로 잘라 받는다');
is(FAKE.calls.some(u => /orientation=portrait/.test(u)), '세로 사진만 찾는다');
R = await fnRun({ q: 'x', src: 'unsplash' });
is(R.b.items.length === 1 && R.b.items[0].track, 'Unsplash 사진은 고를 때 알릴 주소(download_location)를 들고 온다');
FAKE.calls = []; R = await fnRun({ track: 'https://api.unsplash.com/photos/u1/download?ixid=1' });
is(R.b.ok && FAKE.calls.length === 1, '고른 Unsplash 사진은 download 신호를 보낸다 (API 지침)');
R = await fnRun({ track: 'https://evil.example.com/steal' });
is(R.st === 400, 'track 에 Unsplash 가 아닌 주소를 넣으면 안 부른다 (아무 데나 대신 부르는 문 0)');
process.env.SHARED_TOKEN = 'tok';
R = await fnRun({ q: 'x' });
is(R.st === 401, '공유 토큰이 걸려 있으면 토큰 없이는 못 쓴다 (gemini 프록시와 같은 문)');
R = await fnRun({ q: 'x' }, { 'x-app-token': 'tok' });
is(R.st === 200 && R.b.ok, '토큰이 맞으면 쓴다');
global.fetch = realFetch; for (const k of ['PEXELS_API_KEY', 'UNSPLASH_ACCESS_KEY', 'GEMINI_API_KEY', 'SHARED_TOKEN']) { if (k in env0) process.env[k] = env0[k]; else delete process.env[k]; }

/* 앱 — 사진가 이름이 카드와 마지막 장에 */
ctx.CN.style = 'lime'; ctx.CN.imgs = {}; SRCVAL = '생명보험협회'; ctx.cxField('src', '');
ctx.CN.imgs[1] = { url: 'data:x', credit: { name: 'Kim P', src: 'Pexels', link: 'https://www.pexels.com/photo/1' } };
is(draw('lime', 1).indexOf('Photo · Kim P / Pexels') >= 0, '★ 고른 실사 사진의 장에 사진가 이름이 찍힌다');
is(THEMES.every(th => draw(th, 1).indexOf('Photo · Kim P') >= 0), '테마 넷 모두 찍힌다');
is(draw('lime', 2).indexOf('Photo ·') < 0 || !ctx.CN.imgs[2], '사진이 없는 장에 남의 이름을 함부로 안 찍는다(배경으로 빌려 쓴 장만)');
is(THEMES.every(th => draw(th, CTA).indexOf('사진 Pexels') >= 0), '마지막 장 자료 줄에 「사진 Pexels」 가 붙는다');
ctx.CN.style = 'news';
is(/생명보험협회 \/ 사진 Pexels/.test(ctx.cnSrcOf()), '기본 뉴스 카드의 자료 줄에도 「사진 Pexels」 가 붙는다 (스타일을 바꿔도 출처가 안 빠짐)');
ctx.CN.imgs = {};
is(ctx.cnSrcOf() === '생명보험협회', '실사 사진이 없으면 자료 줄은 그대로');
ctx.CN.style = 'lime'; ctx.cxField('id', 'apex.test');
S = steps();
is(/누르면 실사 사진 찾기/.test(S), '③ 사진 넣기 단계가 실사 사진 찾기로 이어진다');
is(ctx.renderTodayCard().indexOf('📷 실사 사진 찾기') >= 0, '테마를 켜면 단추 줄에 「📷 실사 사진 찾기」 가 선다');
is(IDX.indexOf(UPBTN) >= 0, '★ 그 단추를 붙이는 자리(「🖼 직접 업로드」 단추 글자)가 index.html 에 그대로 있다 — 글자가 바뀌면 단추가 조용히 사라집니다');

console.log('\n' + (bad ? '✗ ' + bad + '/' + n + ' 실패' : '✓ ' + n + '가지 모두 통과'));
process.exit(bad ? 1 : 0);
})();
