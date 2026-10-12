/* 📞 <b>한 장 TA — 할인 · 5세대 · 보험금 찾기</b> (2026-10-12 사장님 말씀 「5세대 실비와, 할인 전용 RP …
   못받은 보험금 찾아줌 … 나이대와 비슷한 지역에 찾아준 사례로 니즈환기 … 거절처리 … 5세대 실비를 한장으로
   요약하고 대상자들 정리」 → 같은 날 「아니야 복잡해 html로 만들고 한장으로 한번에 할수 있도록 … 내가 전에
   이미지 첨부한 자료를 기반으로 … ta스크립트가 이정도로 어떻게 고객이 날 만나주냐고」)

   못 박는 것 —
     ① <b>한 장</b>이다 — 탭이 없고, 대본 · 거절 · 5세대 한 장이 한 화면에 차례로 선다
     ② 뼈대는 사장님 이미지의 「보장분석디비 스크립트」 — 원문이라 적은 줄은 🎓 신입 TA 교육
        (ta-train.html TT_STEPS)과 <b>한 글자씩 같다</b>. 한쪽만 고치면 빨간불 (5번)
     ③ 만날 이유 셋(할인 · 5세대 · 못 받은 보험금)을 첫 마디에 · 약속은 둘 중 하나 ·
        거절마다 <b>다시 약속으로</b> 돌아온다
     ④ 숫자는 금융위 원문에 있는 것뿐 (1번·9번) — ORIG 는 2026-10-12 에 원문에서 옮긴 글
     ⑤ 11월 제도는 「예정」 · 할인율은 「예시·예상」 · 「갈아타세요·무조건·반값 확정」 없음
     ⑥ 할인을 주는 곳은 보험회사 — 「금융감독원에서 시행하는」 이라고 말하지 않는다
     ⑦ 또래·근처 사례는 <b>적어 둔 것만</b> — 없거나 안 겹치면 그 줄이 안 선다 · 빈 금액은 0원이
        아니라 말 안 함 · 이름 안 받음 (1번·3번) · 이 기기에만 · 서버 안 부름 (7번)
     ⑧ 「심사 결과에 따릅니다」 · tnum 없음 (4-1번) · 인쇄는 대본·거절·한 장만               */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = process.cwd(), PORT = 9147;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const HTML = fs.readFileSync(path.join(ROOT, 'app/silson5.html'), 'utf8');
const dataJs = (HTML.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || '';
const box = {}; vm.createContext(box); vm.runInContext(dataJs.replace(/^var /gm, 'this.'), box);
const { S5_SRC, S5_SCRIPT, S5_OBJ, S5_ONE, S5_WHO } = box;

/* ta-train 의 원문 단계 — 같은 표를 꺼내 견줍니다 */
const TT = fs.readFileSync(path.join(ROOT, 'app/ta-train.html'), 'utf8');
const ttBlk = TT.slice(TT.indexOf('var TT_STEPS=['), TT.indexOf('\n];', TT.indexOf('var TT_STEPS=[')));
const ttSay = {};
ttBlk.replace(/\{t:'([^']*)',\s*\n?\s*say:'((?:[^'\\]|\\.)*)'/g, (m, t, s) => { ttSay[t] = s.replace(/\\n/g, '\n').replace(/\\'/g, "'"); });

/* 2026-10-12 에 금융위 원문에서 옮겨 적은 글 */
const ORIG = [
  '보상한도 연간 5천만원 통원 회당 20만원 입원 한도 없음 좌동 연간 1천만원 통원 일당 20만원 입원 (병·의원) 회당 300만원',
  '자기부담률 입원 30% 통원 Max[ 30%, 3만원 ] 좌동 입원 50% 통원 Max[ 50%, 5만원 ] 자기부담 한도 없음 입원 (상종·종병) 500만원 신설',
  '5세대 실손보험료는 현행 4세대 대비 약 30% 저렴하며, 1·2세대 상품보다는 최소 50% 이상 저렴한 가격에 판매된다.',
  '5월 6일부터 16개 보험회사 6개월 이내에 전환을 철회 2013년 3월 이전 26년 11월부터 6개월간 시행',
  '2025년 약 3조 2,470억원 (80만건) 청구건당 평균 404만원'
].join(' ').replace(/\s+/g, '');
/* 연도(2026년 등)는 날짜라 따로 둡니다 · 단위가 붙은 숫자는 글자째로만 대조 (맨숫자 예외가 넓으면 「2천만원」 의 2 가 통과합니다 · 8번) */
const nums = t => (String(t).replace(/<[^>]+>/g, '').replace(/20[0-9]{2}년/g, '').match(/[0-9][0-9,.·]*\s*(만원|천만원|억원|조|%|만건|개월|월|일|년|개사)?/g) || []).map(x => x.replace(/\s+/g, ''));
const inOrig = n => ORIG.indexOf(n) >= 0;
/* 원문이 아닌 숫자 중 허용 — 세대 이름 · 「20분」 「1분」 (내가 하는 약속) · 「7자리」 */
const ALLOW = /[0-9]세대|1~4세대|1·2세대|20분|1분|7자리/g;

console.log('\n[1] 한 장이다');
is(!/data-t="|class="s5-tabs|s5Tab\(/.test(HTML), '탭이 없다 — 한 화면에 차례로');
is(/id="script"/.test(HTML) && /id="objs"/.test(HTML) && /id="one"/.test(HTML), '대본 · 거절 · 5세대 한 장이 한 화면에 선다');

console.log('\n[2] 사장님 이미지의 원문 (5번)');
const orig = S5_SCRIPT.filter(s => s.kind === 'o');
const diff = orig.filter(s => ttSay[s.t] !== s.say).map(s => s.t);
is(orig.length >= 5 && diff.length === 0, '원문이라 적은 ' + orig.length + '단계가 신입 TA 교육과 한 글자씩 같다' + (diff.length ? ' ← ' + diff.join(',') : ''));
const miss = Object.keys(ttSay).filter(t => !S5_SCRIPT.some(s => s.t === t) && t !== '첫 인사 및 담당자 소개');
is(Object.keys(ttSay).length >= 6 && miss.length === 0, '원문 단계가 빠짐없이 있다 (첫 인사는 만날 이유 셋을 얹어 고침)' + (miss.length ? ' ← ' + miss.join(',') : ''));

console.log('\n[3] 만나게 하는 말');
const first = S5_SCRIPT[0].say;
is(/무사고 할인/.test(first) && /5세대/.test(first) && /못 받으신 보험금/.test(first), '첫 마디에 만날 이유 셋 — 할인 · 5세대 · 못 받은 보험금');
is(S5_SCRIPT.some(s => /\{d1\}[\s\S]*\{d2\}/.test(s.say) && /편하세요\?/.test(s.say)), '약속은 둘 중 하나로 묻는다');
const noBack = S5_OBJ.filter(o => !(/\{d1\}/.test(o.a) && /\{d2\}/.test(o.a))).map(o => o.q);
is(S5_OBJ.length >= 8 && noBack.length === 0, '거절 ' + S5_OBJ.length + '가지 모두 다시 약속(둘 중 하나)으로 돌아온다' + (noBack.length ? ' ← ' + noBack.join(',') : ''));
is(S5_OBJ.every(o => o.s), '거절마다 멈출 자리가 있다');

console.log('\n[4] 숫자는 원문에만 (1번·9번)');
const added = S5_SCRIPT.filter(s => s.kind === 'a').map(s => s.say).concat(S5_SCRIPT.filter(s => s.plus).map(s => s.plus), S5_OBJ.map(o => o.a));
const badN = [];
added.forEach(t => nums(t.replace(ALLOW, '')).forEach(n => { if (!inOrig(n)) badN.push(n); }));
S5_ONE.forEach(r => [r[1], r[2]].forEach(t => nums(t).forEach(n => { if (!inOrig(n)) badN.push(r[0] + ':' + n); })));
S5_WHO.forEach(t => nums(t.replace(ALLOW, '')).forEach(n => { if (!inOrig(n)) badN.push('대상:' + n); }));
is(badN.length === 0, '더한 줄 · 거절 · 한 장 · 대상자의 숫자가 모두 원문에 있다' + (badN.length ? ' ← ' + badN.slice(0, 6).join(', ') : ''));
const srcBad = Object.keys(S5_SRC).filter(k => { const s = S5_SRC[k]; return !s.t || !s.o || !/^\d{4}-\d{2}-\d{2}$/.test(s.d) || !/^https:\/\//.test(s.u) || /blog|tistory|cafe\.naver/i.test(s.u); });
is(srcBad.length === 0 && /86831/.test(S5_SRC.f5.u) && /87270/.test(S5_SRC.hb.u), '출처는 금융위원회 보도자료 · 제목·날짜·주소가 다 있다');

console.log('\n[5]·[6] 말의 선');
const nov = S5_WHO.filter(t => /11월/.test(t));
is(nov.length > 0 && nov.every(t => /예정/.test(t) && /예시/.test(t) && /예상/.test(t)), '11월 제도는 「예정」 · 할인율은 「예시·예상」');
const all = S5_SCRIPT.map(s => s.say + (s.plus || '')).concat(S5_OBJ.map(o => o.a)).join('\n');
is(!/갈아타세요|바꾸세요|무조건|반값\s*확정/.test(all), '「갈아타세요 · 무조건 · 반값 확정」 이 없다');
is(!/금융감독원에서 시행/.test(S5_SCRIPT.filter(s => s.kind === 'a').map(s => s.say).join('')) && /할인을 주는 곳은 보험회사/.test(HTML), '할인을 주는 곳은 보험회사 — 「금융감독원에서 시행」 이라고 안 한다');
is((HTML.match(/심사 결과에 따릅니다/g) || []).length >= 2, '「심사 결과에 따릅니다」 를 단다');
is(!/font-feature-settings\s*:\s*["']?tnum/.test(HTML) && !/fetch\(|XMLHttpRequest|supabase/i.test(HTML), 'tnum 없음 · 서버를 부르지 않는다');

console.log('\n[메뉴]');
const IX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
is(/\{id:'silson5'/.test(IX) && /tab==='silson5'\)dyn\.innerHTML=renderSilson5Page\(\)/.test(IX) && /<iframe src="silson5\.html"/.test(IX), '본체 메뉴에서 silson5.html 을 띄운다');

const srv = http.createServer((q, s) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0].split('#')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end(''); return; }
  s.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(s);
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const out = [];
    await ctx.route('**://**', r => { const u = r.request().url(); if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue(); out.push(u); r.fulfill({ status: 200, body: '' }); });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    const U = 'http://127.0.0.1:' + PORT + '/app/silson5.html';
    await p.goto(U, { waitUntil: 'load' }); await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(300);

    console.log('\n[화면]');
    const t0 = await p.evaluate(() => ({ st: document.querySelectorAll('#script .st').length, ob: document.querySelectorAll('#objs .ob').length,
      rows: document.querySelectorAll('#one tbody tr').length, wide: document.documentElement.scrollWidth, cl: !!document.getElementById('caseLine') }));
    is(t0.st === S5_SCRIPT.length && t0.ob === S5_OBJ.length && t0.rows === S5_ONE.length, '대본 ' + t0.st + '단계 · 거절 ' + t0.ob + ' · 한 장 ' + t0.rows + '줄이 한 화면에');
    is(t0.wide <= 392, '폰(390px)에서 옆으로 넘치지 않는다 (' + t0.wide + 'px)');
    is(!t0.cl, '적어 둔 사례가 없으면 사례 줄이 안 선다 — 지어내지 않는다');

    const fill = (id, v) => p.evaluate(a => { const el = document.getElementById(a[0]); el.value = a[1]; el.dispatchEvent(new Event('input')); }, [id, v]);
    await fill('fAgent', '홍길동'); await fill('fD1', '화요일 오전 11시'); await fill('fD2', '목요일 오후 2시');
    const f1 = await p.evaluate(() => ({ s5: document.querySelector('#script .st[data-n="⑤"]').textContent, ob: document.getElementById('objs').textContent, s1: document.querySelector('#script .st').textContent }));
    is(/화요일 오전 11시/.test(f1.s5) && /목요일 오후 2시/.test(f1.s5), '약속 둘을 적으면 ⑤ 대본에 그대로 들어간다');
    is((f1.ob.match(/화요일 오전 11시/g) || []).length === S5_OBJ.length, '거절 받는 말에도 같은 두 시간이 들어간다');
    is(/홍길동입니다/.test(f1.s1), '내 이름이 첫 인사에 들어간다');

    const add = (age, area, kind, man, ym) => p.evaluate(a => {
      document.getElementById('csBox').open = true;
      document.getElementById('cAge').value = a[0]; document.getElementById('cArea').value = a[1];
      document.getElementById('cKind').value = a[2]; document.getElementById('cMan').value = a[3]; document.getElementById('cYm').value = a[4];
      document.getElementById('cAdd').click(); return document.getElementById('cMsg').textContent;
    }, [age, area, kind, man, ym]);
    await add('40대', '순천 연향동', '실손 미청구', '120', '2026-09');
    await add('60대', '여수 학동', '만기보험금', '', '2026-08');
    const nm = await add('40대', '홍길동님', '기타', '', '');
    is(/이름/.test(nm) && (await p.evaluate(() => s5Cases().length)) === 2, '동네 칸에 「○○님」 을 적으면 안 받는다 (3번)');
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem('apex_s5_cases_v1')));
    is(st.every(c => !('name' in c)) && st[1].man === null, '이 기기에만 · 이름 없이 · 비운 금액은 0 이 아니라 null');
    const cl = async (age, area) => { await fill('fAge', age); await fill('fArea', area);
      return p.evaluate(() => ({ cl: (document.getElementById('caseLine') || {}).textContent || '', list: document.getElementById('cList').textContent })); };
    let r = await cl('40대', '순천 조례동');
    is(/고객님 또래, 순천 연향동 사시는 분께/.test(r.cl) && /120만원/.test(r.cl), '같은 나이대 · 같은 시 사례가 ③ 에 붙는다 — 「' + r.cl.slice(0, 44) + '…」');
    r = await cl('60대', '');
    is(/또래 분께/.test(r.cl) && !/만원/.test(r.cl), '금액을 비운 사례는 금액을 말하지 않는다');
    is(/금액 안 적음/.test(r.list) && !/· 0만원|· 0원/.test(r.list), '목록에도 「금액 안 적음」 — 0 으로 적지 않는다');
    r = await cl('30대', '부산 해운대');
    is(!r.cl, '겹치는 사례가 없으면 「비슷하다」 고 말하지 않는다 — 줄이 안 선다');
    await cl('40대', '순천');
    const cp = await p.evaluate(() => { document.getElementById('bCopy').click(); return window.__copied || ''; });
    is(/^① /.test(cp) && /⑧ /.test(cp) && /또래/.test(cp) && !/<em>|<b>/.test(cp), '「대본 전체 복사」 — ①~⑧ 과 사례 줄까지, 태그 없이');

    await p.emulateMedia({ media: 'print' });
    const pr = await p.evaluate(() => ({ fill: getComputedStyle(document.querySelector('.fill')).display, sc: getComputedStyle(document.getElementById('script')).display, cs: getComputedStyle(document.getElementById('csBox').closest('.sec')).display }));
    is(pr.fill === 'none' && pr.cs === 'none' && pr.sc !== 'none', '인쇄는 입력 칸 없이 대본 · 거절 · 한 장만');
    await p.emulateMedia({ media: 'screen' });
    is(errs.length === 0, '스크립트 오류 0' + (errs.length ? ' ← ' + errs.slice(0, 2).join(' | ') : ''));
    const ext = out.filter(u => !/fonts\.googleapis|fonts\.gstatic/.test(u));
    is(ext.length === 0, '바깥 서버를 부르지 않는다' + (ext.length ? ' ← ' + ext[0] : ''));
  } finally { await b.close(); srv.close(); }
  console.log(bad ? '\n✗ 한 장 TA — 고칠 자리 ' + bad + '곳' : '\n✓ 한 장 TA — 모두 통과');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
