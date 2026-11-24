#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   check-mstnews.js — 계약 마디 카톡 칸에 <b>기사가 진짜 붙나</b> (판 X546)

   사장님 말씀 2026-11-23 — 「고객이 관심있을만한 것들을 뉴스로 보내던」.

   ★ 라이브에서 <b>그려 보고</b> 찾은 버그입니다. 기사 한 줄은
     {t, u, s, d, cats} 로 담기는데 카톡 칸은 <b>.title · .link · .source</b>
     를 꺼내고 있었습니다. 그래서 —
       · 칸에는 「<b>제목 없음</b> · <b>언론사 미상</b>」 이 찍히고 주소는 #
       · 「📋 보낼 말 복사」 에는 기사가 <b>한 번도 안 붙었습니다</b>
         (L[0].link 가 늘 undefined 라 if 가 아예 안 돌았습니다)
   ★ 먼저 있던 자(check-tamsg·check-ccmsg 들)는 <b>말투와 모양</b>을 봅니다 —
     「기사가 붙었나」 를 묻는 자가 아무도 없었습니다. 그 자리를 만듭니다 (8번).

   재는 것
   [1] 칸에 <b>심은 기사 그대로</b> 선다 — 제목·언론사·주소가 씨와 같다
   [2] 「제목 없음」·「언론사 미상」·href="#" 이 <b>하나도</b> 없다
   [3] 「📋 보낼 말 복사」 의 글에 <b>제목·언론사·주소가 그대로</b> 붙는다
   [4] 받아 둔 기사가 없으면 <b>지어내지 않는다</b> (1번)
   [5] 반만 읽은 줄(주소 없음·제목 없음)은 <b>버린다</b> — 「제목 없음」 을 안 적는다
   [6] 꺼내는 곳은 <b>mstArt 하나</b>다 (5번) — 칸 이름을 외워 쓰는 자리가 없다
   [7] 그리는 동안 터지지 않는다

   되돌려 보기 — mstArt 의 it.t 를 it.title 로 되돌리면 [1][3][5] 가 웁니다.
   mstSay 의 if(a) 를 지우면 [3] 이, mstNewsHtml 의 걸러내기를 빼면 [5] 가 웁니다.
   ══════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = path.resolve(__dirname, '..');

let 깬 = 0, 본 = 0;
function head(t) { console.log('\n' + t.replace(/<[^>]+>/g, '')); }
function is(ok, t) { 본++; if (!ok) 깬++; console.log((ok ? '  ✓ ' : '  ✗ ') + t.replace(/<[^>]+>/g, '')); }

const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json' };

/* 씨 — 견본 이름은 「홍길동」, 주소는 example.com (3번 · 1번) */
const 씨 = [
  { t: '실손의료비 4세대 전환 안내가 나왔습니다', u: 'https://example.com/ins-1',
    s: '점검용신문', d: '2026-11-21', cats: ['ins'] },
  { t: '기준금리 동결 — 저축성보험은 어떻게 되나', u: 'https://example.com/econ-1',
    s: '점검용경제', d: '2026-11-20', cats: ['econ'] },
  /* 반만 읽은 줄 둘 — 버려야 합니다 (1번) */
  { t: '주소를 못 읽은 기사', u: '', s: '점검용신문', d: '2026-11-19', cats: ['ins'] },
  { t: '', u: 'https://example.com/ins-noti', s: '점검용신문', d: '2026-11-18', cats: ['ins'] }
];

(async () => {
  console.log('══ 📰 계약 마디 카톡 칸에 기사가 진짜 붙나 (판 X546) ══');
  const srv = http.createServer((q, r) => {
    const p = path.join(ROOT, decodeURIComponent(url.parse(q.url).pathname));
    fs.readFile(p, (e, b) => {
      if (e) { r.statusCode = 404; r.end('no'); return; }
      r.setHeader('Content-Type', MIME[path.extname(p)] || 'application/octet-stream');
      r.end(b);
    });
  });
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
  const P = srv.address().port;

  const 터짐 = [];
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 1280, height: 900 } });
  /* 바깥은 끊습니다 — 점검이 사장님 진짜 서버를 두드리면 안 됩니다 */
  await ctx.route('**://**', rt => rt.request().url().indexOf('127.0.0.1:' + P) >= 0
    ? rt.continue() : rt.abort());
  const pg = await ctx.newPage();
  pg.on('pageerror', e => 터짐.push(String(e.message).slice(0, 110)));
  pg.on('dialog', d => d.accept());
  await pg.goto('http://127.0.0.1:' + P + '/app/index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForTimeout(3200);

  const r = await pg.evaluate(씨 => {
    const o = { 없음: [] };
    ['nlKey', 'nlLoad', 'mstArt', 'mstNewsHtml', 'mstSay', 'mstCardHtml', 'mstStep']
      .forEach(n => { if (typeof window[n] !== 'function') o.없음.push(n); });
    if (o.없음.length) return o;

    /* ① 기사를 심습니다 */
    localStorage.setItem(nlKey(), JSON.stringify({ items: 씨, at: '2026-11-22', got: 씨.length, drop: 0 }));
    nlLoad();
    o.NLIVE = (window.NLIVE && NLIVE.items) ? NLIVE.items.length : -1;

    /* ② 고객 한 분과 계약일을 심습니다 — 1개월째가 지나도록 */
    const 어제 = new Date(Date.now() - 40 * 86400000).toISOString().slice(0, 10);
    try {
      window.OSC = window.OSC || {};
      OSC.list = [{ id: 'hong-check', name_masked: '홍○○', name: '홍길동', advisor_id: '' }];
      if (window.CM) { CM.meta = CM.meta || {}; CM.meta['hong-check'] = { cd: 어제 }; }
      localStorage.removeItem('apex_mst_done');
      localStorage.removeItem('apex_mst_ans');
    } catch (e) { o.심기 = String(e).slice(0, 60); }

    /* ③ 카드를 <b>진짜로 그려</b> 봅니다 — 글자만 세지 않습니다 */
    const d = document.createElement('div');
    try { d.innerHTML = mstCardHtml(true); } catch (e) { o.카드터짐 = String(e).slice(0, 80); }
    o.줄 = d.querySelectorAll('.mst-row').length;
    const a = d.querySelectorAll('.mst-news a.mst-ni');
    o.기사줄 = a.length;
    o.보이는글 = Array.prototype.map.call(a, e => ({
      제목: (e.querySelector('b') ? e.querySelector('b').textContent : '').trim(),
      꼬리: (e.querySelector('span') ? e.querySelector('span').textContent : '').trim(),
      주소: e.getAttribute('href') || ''
    }));
    const H = d.innerHTML;
    o.제목없음 = /제목 없음/.test(H);
    o.언론사미상 = /언론사 미상/.test(H);
    o.빈주소 = /href="#"/.test(H);
    /* 반만 읽은 줄의 제목이 섞여 들어오지 않았나 — 제일 날카로운 자리입니다 */
    o.깨진제목 = H.indexOf('주소를 못 읽은 기사') >= 0;
    o.심은ins = 씨.filter(x => x.cats.indexOf('ins') >= 0).length;
    o.온전한ins = 씨.filter(x => x.cats.indexOf('ins') >= 0 && x.t && x.u).length;

    /* ④ 보낼 말 — ins 마디(1개월)와 econ 마디(3개월) */
    try { o.말ins = String(mstSay('hong-check', 1) || ''); } catch (e) { o.말터짐 = String(e).slice(0, 60); }
    try { o.말econ = String(mstSay('hong-check', 3) || ''); } catch (e) { o.말터짐 = String(e).slice(0, 60); }
    /* ⑤ 받아 둔 기사가 없는 갈래 — 9개월째는 tax 입니다 */
    o.탁갈래 = (mstStep(9) || {}).cat || '';
    try { o.말tax = String(mstSay('hong-check', 9) || ''); } catch (e) {}
    o.빈칸글 = mstNewsHtml('tax');

    /* ⑥ 반만 읽은 줄을 버렸나 — mstArt 에게 직접 묻습니다 */
    o.버림 = [mstArt(null), mstArt({ t: '제목만', u: '' }), mstArt({ t: '', u: 'https://example.com/x' })]
      .every(x => x === null);
    o.살림 = !!mstArt({ t: 'ㄱ', u: 'https://example.com/y', s: 'ㄴ', d: '2026-11-01' });
    return o;
  }, 씨);

  if (r.없음 && r.없음.length) {
    is(false, '  함수를 못 찾았습니다 — ' + r.없음.join(', '));
    await br.close(); srv.close();
    console.log('\n✗ ' + 깬 + '/' + 본 + ' 깨짐'); process.exit(1);
  }

  /* ★★ 제일 먼저 — <b>씨가 거짓말을 못 하게</b> 합니다.
     check-mstone 이 초록인 채로 샌 까닭이 바로 이것입니다: 그 자는
     {title, link, source} 를 심고 있었고 앱도 그 이름을 읽고 있어
     <b>자와 버그가 서로 맞아떨어졌습니다</b>. 자가 쓰는 칸 이름을
     <b>앱이 실제로 담는 자리(nlPull)</b> 와 맞대어 봅니다 (8번).      */
  head('[0] 자가 심는 칸 이름이 앱이 담는 그대로인가 — 씨가 거짓말을 못 하게');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  /* <b>nlPull 안</b>에서만 찾습니다 — 파일에 list.push 는 여러 곳에 있습니다 */
  const i0 = SRC.indexOf('\nfunction nlPull(');
  const i1 = i0 < 0 ? -1 : SRC.indexOf('\nfunction ', i0 + 1);
  const 몸 = i0 < 0 ? '' : SRC.slice(i0, i1 < 0 ? i0 + 6000 : i1);
  const m = 몸.match(/list\.push\(\{([^}]*)\}\)/);
  const 앱칸 = m ? m[1].split(',').map(x => x.split(':')[0].trim()).filter(Boolean).sort() : [];
  const 씨칸 = Object.keys(씨[0]).sort();
  is(앱칸.length > 0, '  앱이 기사를 담는 자리를 찾았다 (nlPull) — [' + 앱칸.join(' ') + ']');
  is(앱칸.join(',') === 씨칸.join(','),
    '  ★★ 씨의 칸 이름이 <b>앱이 담는 그대로</b>다 — 씨 [' + 씨칸.join(' ') + ']');

  head('[1] 칸에 심은 기사 그대로 서나');
  is(r.NLIVE === 씨.length, '  기사 ' + 씨.length + '줄이 들어갔다 (' + r.NLIVE + ')');
  is(r.줄 >= 1, '  계약 마디 줄이 섰다 (' + r.줄 + ')');
  is(r.기사줄 >= 1, '  기사 줄이 <b>섰다</b> (' + r.기사줄 + ')');
  const 첫 = (r.보이는글 && r.보이는글[0]) || {};
  is(첫.제목 === 씨[0].t, '  제목이 <b>씨와 같다</b> — 「' + (첫.제목 || '없음') + '」');
  is((첫.꼬리 || '').indexOf(씨[0].s) === 0, '  언론사가 <b>씨와 같다</b> — 「' + (첫.꼬리 || '없음') + '」');
  is(첫.주소 === 씨[0].u, '  주소가 <b>씨와 같다</b> — ' + (첫.주소 || '없음'));

  head('[2] 「제목 없음」·「언론사 미상」·빈 주소가 하나도 없나');
  is(!r.제목없음, '  「제목 없음」 이 <b>없다</b>');
  is(!r.언론사미상, '  「언론사 미상」 이 <b>없다</b>');
  is(!r.빈주소, '  href="#" 가 <b>없다</b>');

  head('[3] 「📋 보낼 말 복사」 의 글에 기사가 그대로 붙나');
  const M = r.말ins || '';
  is(M.indexOf('[읽어 보실 만한 기사]') >= 0, '  ★★ 기사 머리글이 <b>붙었다</b>');
  is(M.indexOf(씨[0].t) >= 0, '  <b>제목</b>이 그대로 들어 있다');
  is(M.indexOf(씨[0].s) >= 0, '  <b>언론사</b>가 그대로 들어 있다');
  is(M.indexOf(씨[0].u) >= 0, '  <b>주소</b>가 그대로 들어 있다');
  is((r.말econ || '').indexOf(씨[1].u) >= 0,
    '  갈래가 다른 마디(3개월·econ)에는 <b>그 갈래 기사</b>가 붙는다');
  is((r.말ins || '').indexOf(씨[1].u) < 0, '  갈래를 <b>섞지 않는다</b>');

  head('[4] 받아 둔 기사가 없으면 지어내지 않나 (1번)');
  is(r.탁갈래 === 'tax', '  9개월째 갈래는 tax 다 (' + r.탁갈래 + ')');
  is((r.말tax || '').indexOf('[읽어 보실 만한 기사]') < 0,
    '  ★ 기사가 없으면 머리글을 <b>안 적는다</b> — 빈 자리를 안 만듭니다');
  is(/아직 없습니다/.test(r.빈칸글 || ''), '  칸은 「<b>아직 없습니다</b>」 라고 말한다');
  is(!/제목 없음/.test(r.빈칸글 || ''), '  빈 칸에도 「제목 없음」 을 안 적는다');

  head('[5] 반만 읽은 줄은 버리나');
  is(r.버림 === true, '  주소나 제목이 없는 줄은 <b>null 로 버린다</b>');
  is(r.살림 === true, '  다 있는 줄은 <b>살린다</b> — 헛것을 안 막습니다 (8번)');
  is(r.기사줄 === r.온전한ins,
    '  심은 ins ' + r.심은ins + '줄 가운데 <b>온전한 ' + r.온전한ins + '줄</b>만 섰다 (' +
    r.기사줄 + ') — 반만 읽은 ' + (r.심은ins - r.온전한ins) + '줄은 안 섰습니다');
  is(r.깨진제목 === false,
    '  ★ 주소를 못 읽은 기사의 <b>제목이 안 섞였다</b> — 눌러도 아무 데도 안 가는 줄은 안 세웁니다');

  head('[6] 꺼내는 곳이 하나인가 (5번)');
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  function 토막(nm) {
    const i = src.indexOf('\nfunction ' + nm + '(');
    if (i < 0) return '';
    const j = src.indexOf('\nfunction ', i + 1);
    return src.slice(i, j < 0 ? i + 4000 : j);
  }
  const A = 토막('mstArt'), N = 토막('mstNewsHtml'), S = 토막('mstSay');
  is(A.length > 0, '  <b>mstArt</b> 가 있다 — 기사 한 줄을 읽는 곳');
  is(/\.t\b/.test(A) && /\.u\b/.test(A) && /\.s\b/.test(A), '  mstArt 가 <b>.t · .u · .s</b> 를 읽는다');
  const 외운 = /\.(title|link|source)\b/;
  is(!외운.test(N), '  mstNewsHtml 은 칸 이름을 <b>외워 쓰지 않는다</b>');
  is(!외운.test(S), '  mstSay 도 칸 이름을 <b>외워 쓰지 않는다</b>');
  is(N.indexOf('mstArt(') >= 0 && S.indexOf('mstArt(') >= 0, '  둘 다 <b>mstArt 를 부른다</b>');

  head('[7] 그리는 동안 터지지 않았나');
  if (r.카드터짐) console.log('      · 카드: ' + r.카드터짐);
  if (r.말터짐) console.log('      · 보낼 말: ' + r.말터짐);
  if (터짐.length) 터짐.slice(0, 5).forEach(e => console.log('      · ' + e));
  is(!r.카드터짐 && !r.말터짐, '  카드와 보낼 말이 <b>안 터졌다</b>');
  is(터짐.length === 0, '  터진 곳 <b>0</b>');

  await br.close();
  srv.close();
  console.log('\n' + (깬 ? ('✗ ' + 깬 + '/' + 본 + ' 깨짐')
    : ('✓ ' + 본 + '가지 모두 통과 — 기사가 칸에도, 보낼 말에도 붙습니다')));
  process.exit(깬 ? 1 : 0);
})().catch(e => { console.error('터짐: ' + (e && e.stack || e)); process.exit(1); });
