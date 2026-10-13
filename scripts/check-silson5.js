/* 📞 <b>30초 TA — 무사고 할인 · 못 받은 보험금</b>
   사장님 말씀 (2026-10-12, 세 번에 걸쳐) —
     「5세대 실비와, 할인 전용 RP … 못받은 보험금 찾아줌 … 또래 사례로 니즈환기 … 거절처리 … 5세대 한장 요약」
     「아니야 복잡해 … 한장으로 한번에 … 이미지 첨부한 자료를 기반으로 … 어떻게 고객이 날 만나주냐고」
     「2026년 10월부터 보험료할인 제도는 뭐야? 그리고 시간이 너무 오래걸린다 … 너가 고객이라고 생각하고 …
      그리고 거절처리 바로 볼수 있도록 해야하는데 안되어 있네」

   못 박는 것 —
     ① <b>짧다</b> — 대본은 네 마디, 한 마디 130자 · 모두 합쳐 420자 안쪽(소리 내어 30초 남짓)
     ② <b>거절이 늘 보인다</b> — 화면 아래에 떠 있고, 맨 아래로 내려도 보이고, 누르면 답이 <b>화면 안</b>에 뜬다
     ③ 거절의 답은 <b>다시 약속(둘 중 하나)</b>으로 — 「번호 어떻게 알았냐」 만 빼고
     ④ 사장님 이미지의 원문 6단계는 그대로 접어 둔다 — 🎓 신입 TA 교육 TT_STEPS 와 한 글자씩 같다 (5번)
     ⑤ 숫자는 원문(금융위 보도자료 · 10월 5일 기사 둘)에 있는 것뿐 (1번·9번)
     ⑥ 대본·거절에서 「금감원에서 시행하는 할인」 이라고 하지 않는다 · 고객이 직접 신청할 수 있다고 말한다
     ⑦ 또래·근처 사례는 적어 둔 것이 겹칠 때만 · 빈 금액은 0원이 아님 · 이름 안 받음 (1번·3번)
     ⑧ 「심사 결과에 따릅니다」 · 11월 제도는 예정·예시·예상 · tnum 없음 · 서버 안 부름                */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = process.cwd(), PORT = 9147;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const HTML = fs.readFileSync(path.join(ROOT, 'app/silson5.html'), 'utf8');
const dataJs = (HTML.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || '';
const box = {}; vm.createContext(box); vm.runInContext(dataJs.replace(/^var /gm, 'this.'), box);
const { S5_SRC, S5_BEATS, S5_OBJ, S5_WHAT, S5_ORIG, S5_ONE, S5_WHO } = box;
const plain = t => String(t).replace(/<[^>]+>/g, '');

const TT = fs.readFileSync(path.join(ROOT, 'app/ta-train.html'), 'utf8');
const ttBlk = TT.slice(TT.indexOf('var TT_STEPS=['), TT.indexOf('\n];', TT.indexOf('var TT_STEPS=[')));
const ttSay = {};
ttBlk.replace(/\{t:'([^']*)',\s*\n?\s*say:'((?:[^'\\]|\\.)*)'/g, (m, t, s) => { ttSay[t] = s.replace(/\\n/g, '\n').replace(/\\'/g, "'"); });

/* 2026-10-12 에 원문에서 옮긴 글 — 금융위 보도자료 둘 · 데일리안·SBS Biz 2026-10-05 */
const ORIG = [
  '보상한도 연간 5천만원 연간 1천만원 입원 30% 입원 50% 입원 (상종·종병) 500만원 신설',
  '5세대 실손보험료는 현행 4세대 대비 약 30% 저렴하며, 1·2세대 상품보다는 최소 50% 이상 저렴한 가격에 판매된다.',
  '6개월 이내에 전환을 철회 2013년 3월 이전 26년 11월부터',
  '2025년 약 3조 2,470억원 (80만건) 청구건당 평균 404만원',
  '금융감독원은 5일 건강보험 무사고 계약전환 제도를 계약자 중심으로 개선했다고 밝혔다. 현재 손해보험사 9곳과 생명보험사 9곳이 운영하고 있다.',
  '40대 남성 가입자는 1년 무사고 시 보험료가 6.5% 할인되고 10년 무사고 시 할인율이 45.9%까지 높아진다.',
  '지난 5월 말 기준 무사고 전환제도가 적용되는 계약은 총 1081만건이다. 1년 이상 지난 657만건 중 보험료 할인을 받고 있는 계약은 116만건으로 17.6%에 그쳤다.',
  '내년 1월까지 전산시스템과 보험약관 정비를 마칠 예정이다.'
].join(' ').replace(/[\s,]+/g, '');
const nums = t => (plain(t).replace(/20[0-9]{2}년/g, '').match(/[0-9][0-9,.·]*\s*(만원|천만원|억원|조|%|만건|개월|월|일|년|곳|개사)?/g) || []).map(x => x.replace(/[\s,]+/g, ''));
const inOrig = n => ORIG.indexOf(n) >= 0;
/* 원문 아닌 숫자 중 허용 — 내가 하는 약속(30초 · 20분) · 세대 이름 · 「10월」(이번 달) · 「7자리」 */
const ALLOW = /30초|20분|[0-9]세대|1~4세대|1·2세대|10월|7자리/g;

console.log('\n[1] 짧다 — 30초');
const lens = S5_BEATS.map(b => plain(b.say).replace(/\{[^}]+\}/g, '○○').length);
const total = lens.reduce((a, b) => a + b, 0);
is(S5_BEATS.length === 4, '대본은 네 마디');
is(lens.every(n => n <= 130) && total <= 420, '한 마디 130자 · 모두 ' + total + '자 (420자 안쪽 — 소리 내어 30초 남짓) · ' + lens.join('/'));
is(!/복용|고혈압|주민|뒷 ?번호|3조|404/.test(S5_BEATS.map(b => b.say).join('')), '대본 네 마디에 복용약·주민번호·통계가 없다 — 물으실 때만 꺼낸다');
is(/둘 중 하나|\{d1\}이 편하세요, \{d2\}가 편하세요\?/.test(S5_BEATS[2].say), '셋째 마디가 둘 중 하나로 약속을 잡는다');

console.log('\n[3] 거절의 답은 다시 약속으로');
const noBack = S5_OBJ.filter(o => o.k !== 'who' && !(/\{d1\}[\s\S]*\{d2\}/.test(o.b) || /나으세요[\s\S]*나으세요/.test(o.b))).map(o => o.q);
is(S5_OBJ.length >= 9 && noBack.length === 0, '거절 ' + S5_OBJ.length + '가지 — 「번호」 를 빼고 모두 둘 중 하나로 돌아온다' + (noBack.length ? ' ← ' + noBack.join(',') : ''));
is(S5_OBJ.every(o => o.s), '거절마다 멈출 자리가 있다');
const who = S5_OBJ.filter(o => o.k === 'who')[0];
is(!!who && /지워 드릴게요/.test(who.a) && !who.b, '「번호 어떻게」 — 지워 드린다고 하고 약속을 밀지 않는다');

console.log('\n[4] 사장님 이미지의 원문 (5번)');
const diff = S5_ORIG.filter(o => ttSay[o.t] !== o.say).map(o => o.t);
is(S5_ORIG.length === Object.keys(ttSay).length && S5_ORIG.length >= 6 && diff.length === 0, '원문 ' + S5_ORIG.length + '단계가 신입 TA 교육과 한 글자씩 같다' + (diff.length ? ' ← ' + diff.join(',') : ''));

console.log('\n[5] 숫자는 원문에만 (1번·9번)');
const said = S5_BEATS.map(b => b.say).concat(S5_OBJ.map(o => o.a + ' ' + (o.b || '')), S5_WHAT, S5_WHO);
const badN = [];
said.forEach(t => nums(String(t).replace(ALLOW, '')).forEach(n => { if (!inOrig(n)) badN.push(n); }));
S5_ONE.forEach(r => [r[1], r[2]].forEach(t => nums(t).forEach(n => { if (!inOrig(n)) badN.push(r[0] + ':' + n); })));
is(badN.length === 0, '대본 · 거절 · 「10월 할인이 뭐냐」 · 한 장의 숫자가 모두 원문에 있다' + (badN.length ? ' ← ' + badN.slice(0, 6).join(', ') : ''));
const srcBad = Object.keys(S5_SRC).filter(k => { const s = S5_SRC[k]; return !s.t || !s.o || !/^\d{4}-\d{2}-\d{2}$/.test(s.d) || !/^https:\/\//.test(s.u) || /blog|tistory|cafe\.naver/i.test(s.u); });
is(srcBad.length === 0, '출처마다 제목·낸 곳·날짜·주소 · 블로그 아님');

console.log('\n[6] 말의 선');
const talk = S5_BEATS.map(b => b.say).concat(S5_OBJ.map(o => o.a + (o.b || ''))).join('\n');
is(!/금융감독원에서 시행|금감원에서 시행/.test(talk), '대본·거절에서 「금감원에서 시행하는 할인」 이라고 하지 않는다');
is(/직접 신청/.test((S5_OBJ.filter(o => o.k === 'self')[0] || {}).a || ''), '「보험사가 해 준다던데」 — 고객이 직접 신청해도 된다고 말한다 (1번)');
is(/소급되지 않습니다/.test(S5_WHAT.join('')) && /보험회사/.test(S5_WHAT.join('')), '「10월 할인이 뭐냐」 — 소급 안 됨 · 할인은 보험회사가');
is(!/갈아타세요|바꾸세요|무조건|반값\s*확정/.test(talk), '「갈아타세요 · 무조건 · 반값 확정」 이 없다');
const nov = S5_WHO.filter(t => /11월/.test(t));
is(nov.length > 0 && nov.every(t => /예정/.test(t) && /예시/.test(t) && /예상/.test(t)), '11월 제도는 「예정」 · 할인율은 「예시·예상」');
is((HTML.match(/심사 결과에 따릅니다/g) || []).length >= 2 && !/font-feature-settings\s*:\s*["']?tnum/.test(HTML) && !/fetch\(|XMLHttpRequest|supabase/i.test(HTML), '「심사 결과에 따릅니다」 · tnum 없음 · 서버 안 부름');

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

    console.log('\n[2] 거절이 늘 보인다');
    const vis = () => p.evaluate(() => { const r = document.getElementById('obar').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: innerHeight, pos: getComputedStyle(document.getElementById('obar')).position }; });
    let v = await vis();
    is(v.pos === 'fixed' && v.bottom <= v.h + 1 && v.top < v.h, '처음 열었을 때 화면 아래에 거절 단추가 떠 있다');
    await p.evaluate(() => { document.getElementById('mOne').open = true; document.getElementById('mOrig').open = true; scrollTo(0, document.body.scrollHeight); });
    v = await vis();
    is(v.bottom <= v.h + 1 && v.top < v.h, '맨 아래까지 내려도 그대로 보인다');
    await p.evaluate(() => scrollTo(0, 0));
    const a1 = await p.evaluate(() => { document.querySelector('#ochips [data-k="busy"]').click(); const a = document.getElementById('oans'); const r = a.getBoundingClientRect();
      return { on: a.classList.contains('on'), top: r.top, bottom: r.bottom, h: innerHeight, sy: scrollY, t: a.textContent }; });
    is(a1.on && a1.top >= 0 && a1.bottom <= a1.h + 1 && a1.sy === 0, '누르면 답이 <b>스크롤 없이</b> 화면 안에 뜬다');
    const chips = await p.evaluate(() => document.querySelectorAll('#ochips button').length);
    is(chips === S5_OBJ.length, '거절 ' + chips + '가지 단추가 한 줄로');
    const a2 = await p.evaluate(() => { document.querySelector('#oans .x').click(); return document.getElementById('oans').classList.contains('on'); });
    is(!a2, '✕ 로 닫힌다');

    console.log('\n[화면] 대본');
    const t0 = await p.evaluate(() => ({ n: document.querySelectorAll('#beats .beat').length, wide: document.documentElement.scrollWidth, cl: !!document.getElementById('caseLine') }));
    is(t0.n === 4 && t0.wide <= 392, '대본 네 마디 · 폰(390px)에서 옆으로 안 넘친다 (' + t0.wide + 'px)');
    is(!t0.cl, '적어 둔 사례가 없으면 사례 줄이 안 선다 — 지어내지 않는다');
    const fill = (id, val) => p.evaluate(a => { const el = document.getElementById(a[0]); el.value = a[1]; el.dispatchEvent(new Event('input')); }, [id, val]);
    await fill('fAgent', '홍길동'); await fill('fD1', '화요일 오전 11시'); await fill('fD2', '목요일 오후 2시');
    const f1 = await p.evaluate(() => ({ b: document.getElementById('beats').textContent,
      ob: (document.querySelector('#ochips [data-k="phone"]').click(), document.getElementById('oans').textContent) }));
    is(/홍길동입니다/.test(f1.b) && /화요일 오전 11시이 편하세요, 목요일 오후 2시가 편하세요/.test(f1.b), '이름 · 약속 둘이 대본에 들어간다');
    is(/화요일 오전 11시/.test(f1.ob) && /목요일 오후 2시/.test(f1.ob), '거절 답에도 같은 두 시간이 들어간다');

    console.log('\n[7] 사례');
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
      return p.evaluate(() => ({ cl: (document.getElementById('caseLine') || {}).textContent || '', list: document.getElementById('cList').textContent,
        ob: (document.querySelector('#ochips [data-k="nomoney"]').click(), document.getElementById('oans').textContent) })); };
    let r = await cl('40대', '순천 조례동');
    is(/고객님 또래, 순천 연향동 사시는 분께/.test(r.cl) && /120만원/.test(r.cl), '같은 나이대 · 같은 시 사례가 ② 에 붙는다 — 「' + r.cl.slice(0, 40) + '…」');
    is(/순천 연향동/.test(r.ob), '「받을 보험금 없어요」 답에도 그 사례가 붙는다');
    r = await cl('60대', '');
    is(/또래 분께/.test(r.cl) && !/만원/.test(r.cl), '금액을 비운 사례는 금액을 말하지 않는다');
    is(/금액 안 적음/.test(r.list) && !/· 0만원|· 0원/.test(r.list), '목록에도 「금액 안 적음」 — 0 으로 적지 않는다');
    r = await cl('30대', '부산 해운대');
    is(!r.cl && !/찾아 드렸어요/.test(r.ob), '겹치는 사례가 없으면 대본에도 거절 답에도 사례가 안 선다');

    await fill('fAge', '40대'); await fill('fArea', '순천');
    const cp = await p.evaluate(() => { document.getElementById('bCopy').click(); return window.__copied || ''; });
    is(/^1\. /.test(cp) && /4\. /.test(cp) && /또래/.test(cp) && !/<em>|<b>/.test(cp), '「대본 복사」 — 네 마디와 사례 줄까지, 태그 없이');

    await p.emulateMedia({ media: 'print' });
    const pr = await p.evaluate(() => ({ bar: getComputedStyle(document.getElementById('obar')).display, beats: getComputedStyle(document.getElementById('beats')).display }));
    is(pr.bar === 'none' && pr.beats !== 'none', '인쇄에는 떠 있는 거절 줄이 안 찍힌다');
    await p.emulateMedia({ media: 'screen' });
    is(errs.length === 0, '스크립트 오류 0' + (errs.length ? ' ← ' + errs.slice(0, 2).join(' | ') : ''));
    const ext = out.filter(u => !/fonts\.googleapis|fonts\.gstatic/.test(u));
    is(ext.length === 0, '바깥 서버를 부르지 않는다' + (ext.length ? ' ← ' + ext[0] : ''));
  } finally { await b.close(); srv.close(); }
  console.log(bad ? '\n✗ 30초 TA — 고칠 자리 ' + bad + '곳' : '\n✓ 30초 TA — 모두 통과');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
