/* 🏥 <b>5세대 실비 · 할인 RP · 못 받은 보험금</b> (2026-10-12 사장님 말씀 「5세대 실비와, 할인 전용 RP 만
   HTML 로 따로 … 못받은 보험금 찾아줌 … 나이대와 비슷한 지역에 찾아준 사례로 니즈환기 … 거절처리 …
   5세대 실비를 한장으로 요약하고 대상자들 정리」)

   못 박는 것 —
     ① 한 장 요약의 숫자는 <b>금융위 원문에 있는 숫자</b>뿐이다 — 아래 ORIG 는 2026-10-12 에 원문
        (fsc.go.kr/no010101/86831 「현행(4세대)·5세대 비교」 표 등)에서 옮겨 적은 글입니다 (1번·9번)
     ② 칸마다 출처 열쇠가 있고, 출처는 제목·낸 곳·날짜·주소가 다 있다 · 블로그가 아니다
     ③ 11월 제도를 말하는 줄은 「예정」 을 단다 — 할인율은 공식 문서도 예시·예상입니다
     ④ 역할극 · 거절처리의 <b>내 말</b>에 「갈아타세요」 · 「무조건」 · 「반값 확정」 이 없다
     ⑤ 역할극 · 거절처리의 말에 확인 안 된 숫자가 없다 (허용한 것만)
     ⑥ 「심사 결과에 따릅니다」 를 단다 (2번)
     ⑦ 찾아 드린 사례 — 하나도 없으면 <b>지어내지 않고</b> 공식 숫자로 말한다 (1번)
        · 나이대·지역이 가까운 것부터 꺼낸다 · 겹치는 게 없으면 「비슷하다」 고 말하지 않는다
        · 금액을 비우면 금액을 말하지 않는다 — 0원으로 적지 않는다 (null ≠ 0 · 1번)
        · 이름 칸이 없고, 지역 칸에 이름을 적으면 안 받는다 (3번)
     ⑧ 서버를 부르지 않는다 (7번) · 인쇄는 탭 없이 고른 칸만 · tnum 을 안 쓴다 (4-1번)
     ⑨ 메뉴에서 열린다 — 본체가 silson5.html 을 띄운다                                */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = process.cwd(), PORT = 9147;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const HTML = fs.readFileSync(path.join(ROOT, 'app/silson5.html'), 'utf8');
/* 첫 <script> 덩어리(자료)만 따로 돌려 표를 꺼냅니다 */
const dataJs = (HTML.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || '';
const box = {}; vm.createContext(box); vm.runInContext(dataJs.replace(/^var /gm, 'this.'), box);
const { S5_SRC, S5_ONE, S5_ONE_NOTE, S5_WHO, S5_RP5, S5_RPND, S5_OBJ, S5_HIDE } = box;

/* 2026-10-12 에 금융위 원문에서 옮겨 적은 글 — 한 장 요약의 숫자는 여기 있어야 합니다 */
const ORIG = [
  '자기부담률 20% Max[20%, 1·2만원] 20% Max[ 건보 본인부담률, 20%, 1·2만원]',
  '보상한도 연간 5천만원 통원 회당 20만원 입원 한도 없음 좌동 연간 1천만원 통원 일당 20만원 입원 (병·의원) 회당 300만원',
  '자기부담률 입원 30% 통원 Max[ 30%, 3만원 ] 좌동 입원 50% 통원 Max[ 50%, 5만원 ] 자기부담 한도 없음 입원 (상종·종병) 500만원 신설',
  '보험료 갱신 전 1년간 수령한 특약2 보험금에 따라 특약2 갱신 보험료를 할인·할증 (1~5단계 구분)',
  '5세대 실손보험료는 현행 4세대 대비 약 30% 저렴하며, 1·2세대 상품보다는 최소 50% 이상 저렴한 가격에 판매된다. 현행 4세대 대비 약 50% 수준',
  '5월 6일부터 16개 보험회사(생명보험 7개사, 손해보험 9개사) 신한EZ손보 (6.1일)',
  '6개월 이내에 전환을 철회 / 전환 청약일로부터 3개월 이내 / 계약자별 최초 1회',
  '2013년 3월 이전 / 26년 11월부터 6개월간 시행 / 1세대 약 40%대, 2세대 30%대로 예상 / 3년간 50% 할인(예시)',
  '산모가 분만예정일로부터 280일 이전에 실손 보험가입 시 보장 / 태아 상태에서 실손 가입시 18세까지 보장',
  '1세대[\'09.9월이전] 2세대[\'09.10월~\'17.3월] 3세대[\'17.4월~\'21.6월] 7.1일부터 제4세대',
  '\'25년말 10.3조원 \'22년말 12.4조원 \'23년말 12.1조원 \'24년말 11.2조원 중도보험금 7조 7,667억원 만기보험금 1조 9,235억원 휴면보험금 6,237억원 2025년 약 3조 2,470억원 (80만건) 청구건당 평균 404만원 \'25.10.25일 의원 및 약국',
  '잠자고 있는 보험금 10조 3천억원'
].join(' ').replace(/\s+/g, '');
/* 연도(2026년 등)는 날짜라 금액·비율과 따로 둡니다 — 원문은 「'25년말」 처럼 줄여 적어 글자로는 안 맞습니다 (8번) */
const nums = t => (String(t).replace(/20[0-9]{2}년/g, '').replace(/<[^>]+>/g, '').match(/[0-9][0-9,.·]*\s*(만원|천만원|억원|조|%|만건|단계|개월|일|년|월|세|개사)?/g) || []).map(x => x.replace(/\s+/g, ''));
/* 원문은 「5천만원」 처럼 적고 우리는 표에서 그대로 옮겼으니 글자째로 대조합니다.
   ⚠ 「1~5단계」 의 1 · 「Max[20%」 처럼 기호가 붙은 것은 숫자 덩어리만 떼어 봅니다. */
/* ⚠ 처음엔 숫자만 떼어서도 맞춰 봤더니 「2천만원」 의 2 가 원문 어딘가에 있어 통과했습니다 —
   안 울리는 알람입니다(8번). 단위가 붙은 것은 <b>글자째로만</b>, 단위 없는 맨숫자만 숫자로 봅니다. */
const inOrig = n => ORIG.indexOf(n) >= 0 || (/^[0-9]+$/.test(n) && ORIG.indexOf(n) >= 0);

console.log('\n[1] 한 장 요약의 숫자는 원문에 있다 (1번·9번)');
const badNum = [];
S5_ONE.forEach(r => [r[1], r[2]].forEach(t => nums(t).forEach(n => { if (!inOrig(n)) badNum.push(r[0] + ':' + n); })));
S5_ONE_NOTE.concat(S5_WHO.map(w => [w.src, w.d])).forEach(n => nums(n[1]).forEach(x => { if (!inOrig(x)) badNum.push('쪽지:' + x); }));
is(badNum.length === 0, '표·쪽지·대상자 칸의 숫자 ' + S5_ONE.length + '줄 — 원문에 없는 숫자가 없다' + (badNum.length ? ' ← ' + badNum.slice(0, 6).join(', ') : ''));
const hb = [S5_HIDE.left, S5_HIDE.kind, S5_HIDE.back].join(' ');
const badH = nums(hb).filter(n => !inOrig(n));
is(badH.length === 0, '숨은보험금 숫자도 원문 그대로' + (badH.length ? ' ← ' + badH.join(',') : ''));
is(/잔액/.test(HTML) && /환급/.test(HTML) && /섞어 말하지 않습니다/.test(HTML), '잔액(10조 3천억)과 한 해 환급(3조 2,470억)을 나눠 적는다');

console.log('\n[2] 출처');
const srcBad = [];
Object.keys(S5_SRC).forEach(k => { const s = S5_SRC[k];
  if (!s.t || !s.o || !/^\d{4}-\d{2}-\d{2}$/.test(s.d) || !/^https:\/\//.test(s.u)) srcBad.push(k + ' 칸 빠짐');
  if (/blog|tistory|brunch|cafe\.naver|post\.naver/i.test(s.u)) srcBad.push(k + ' 블로그'); });
const keys = S5_ONE.map(r => r[3]).concat(S5_ONE_NOTE.map(n => n[0]), S5_WHO.map(w => w.src), [S5_HIDE.src]);
keys.forEach(k => { if (!S5_SRC[k]) srcBad.push('없는 열쇠 ' + k); });
is(srcBad.length === 0, '칸마다 출처 열쇠가 있고 출처는 제목·낸 곳·날짜·주소가 다 있다 · 블로그 아님' + (srcBad.length ? ' ← ' + srcBad.join(', ') : ''));
is(/fsc\.go\.kr\/no010101\/86831/.test(S5_SRC.f5.u) && /87270/.test(S5_SRC.hb.u), '5세대 · 숨은보험금의 바탕은 금융위원회 보도자료다');

console.log('\n[3] 11월 제도는 「예정」');
const nov = S5_ONE_NOTE.map(n => n[1]).concat(S5_WHO.map(w => w.d)).filter(t => /11월/.test(t));
is(nov.length > 0 && nov.every(t => /예정/.test(t)), '11월을 말하는 칸 ' + nov.length + '곳 모두 「예정」 을 단다');
is(nov.some(t => /예시/.test(t)) && nov.some(t => /예상/.test(t)), '할인율은 「예시」 · 「예상」 이라고 밝힌다');

console.log('\n[4]·[5] 역할극 · 거절처리의 말');
const mine = [];
S5_RP5.concat(S5_RPND).forEach(s => s.L.forEach(l => { if (l[0] === 'm') mine.push(l[1]); }));
S5_OBJ.forEach(o => mine.push(o.say, o.nx));
const push = mine.filter(t => /갈아타세요|바꾸세요|무조건|반값\s*확정|확정이에요/.test(t));
is(push.length === 0, '내 말 ' + mine.length + '줄에 「갈아타세요 · 무조건 · 반값 확정」 이 없다' + (push.length ? ' ← ' + push[0].slice(0, 40) : ''));
/* 허용한 숫자 — 세대 이름 · 원문에서 확인한 몇 개. 그 밖의 숫자가 말에 섞이면 빨간불 */
const ALLOW = /올해 5월|[0-9]세대|1·2세대|1~4세대|4세대|5세대|11월|6개월|약 30%|3조 2,470억원|404만원|1분|20분/g;
const digit = mine.filter(t => /[0-9]/.test(t.replace(ALLOW, '')));
is(digit.length === 0, '내 말에 확인 안 된 숫자가 없다' + (digit.length ? ' ← ' + digit[0].slice(0, 50) : ''));
const allLines = S5_RP5.concat(S5_RPND).reduce((a, s) => a + s.L.length, 0);
is(S5_RP5.length >= 3 && S5_RPND.length >= 2 && allLines >= 30, '역할극 — 5세대 ' + S5_RP5.length + '장면 · 무사고 할인 ' + S5_RPND.length + '장면 · 대사 ' + allLines + '줄');
is(S5_OBJ.length >= 8 && S5_OBJ.every(o => o.say && o.nx && o.no && o.st), '거절 ' + S5_OBJ.length + '가지마다 받는 말 · 다음 한마디 · 하지 말 말 · 멈출 자리');

console.log('\n[6] 심사 · 인쇄 · 서버');
is((HTML.match(/심사 결과에 따릅니다/g) || []).length >= 3, '「심사 결과에 따릅니다」 를 단다');
is(!/font-feature-settings\s*:\s*["']?tnum/.test(HTML), 'tnum 을 쓰지 않는다 (4-1번)');
is(!/fetch\(|XMLHttpRequest|supabase/i.test(HTML), '서버를 부르지 않는다 (7번)');
is(!/홍길동|김○○/.test(HTML.replace(/<!--[\s\S]*?-->/g, '')) && !/id="s5CName"|placeholder="[^"]*이름/.test(HTML), '이름 칸이 없다 (3번)');

console.log('\n[9] 메뉴');
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

    console.log('\n[화면] 탭 · 한 장 · 대상자');
    const t0 = await p.evaluate(() => ({ panes: document.querySelectorAll('.s5-pane').length, rows: document.querySelectorAll('#s5One tbody tr').length,
      wide: document.documentElement.scrollWidth }));
    is(t0.panes === 6 && t0.rows === S5_ONE_LEN(), '탭 여섯 · 한 장 표 ' + t0.rows + '줄');
    function S5_ONE_LEN() { return S5_ONE.length; }
    is(t0.wide <= 392, '폰(390px)에서 옆으로 넘치지 않는다 (' + t0.wide + 'px)');
    await p.goto(U + '#who', { waitUntil: 'load' }); await p.waitForTimeout(200);
    const w = await p.evaluate(() => {
      const on = document.querySelector('.s5-pane.on').id;
      document.querySelector('#s5When [data-k="g1"]').click();
      document.querySelector('#s5Use [data-k="rare"]').click();
      return { on, hit: [].map.call(document.querySelectorAll('.s5-who.hit'), e => e.dataset.k).sort().join(',') };
    });
    is(w.on === 's5-who', '주소 #who 로 대상자 탭이 바로 열린다');
    is(w.hit === 'cheap,old13', '「2009.9 이전 · 거의 안 감」 → 11월 예정 제도 · 전환 검토 두 칸이 켜진다 (' + w.hit + ')');
    const w2 = await p.evaluate(() => { document.querySelector('#s5Use [data-k="dosu"]').click(); return [].map.call(document.querySelectorAll('.s5-who.hit'), e => e.dataset.k).sort().join(','); });
    is(w2 === 'dosu,old13', '도수·주사 자주 → 「지키는 쪽」 칸이 켜지고 전환 칸은 꺼진다 (' + w2 + ')');

    console.log('\n[화면] 역할극');
    const rp = await p.evaluate(() => {
      s5Tab('rp5'); const bx = document.getElementById('s5Rp5');
      const n = bx.querySelectorAll('.s5-line').length;
      bx.querySelector('[data-a="hide"]').click();
      const hid = document.getElementById('s5Rp5').querySelectorAll('.s5-line.m.hide').length;
      document.getElementById('s5Rp5').querySelector('[data-a="step"]').click();
      const vis = [].filter.call(document.getElementById('s5Rp5').querySelectorAll('.s5-line'), e => getComputedStyle(e).display !== 'none').length;
      return { n, hid, vis };
    });
    is(rp.hid > 0, '「내 대사 가리기」 로 내 말 ' + rp.hid + '줄이 가려진다');
    is(rp.vis === 1 && rp.n > 1, '「한 줄씩」 은 한 줄부터 보여 준다');

    console.log('\n[화면] 못 받은 보험금 — 사례');
    const f0 = await p.evaluate(() => { s5Tab('find'); return { no: !!document.getElementById('s5NoCase'), say: document.getElementById('s5Say').textContent }; });
    is(f0.no && /3조 2,470억원/.test(f0.say) && !/또래|근처에 사시는/.test(f0.say), '사례가 없으면 지어내지 않고 공식 숫자로 말한다');
    const add = async (age, area, kind, man, ym) => p.evaluate(a => {
      document.getElementById('s5CAge').value = a[0]; document.getElementById('s5CArea').value = a[1];
      document.getElementById('s5CKind').value = a[2]; document.getElementById('s5CMan').value = a[3]; document.getElementById('s5CYm').value = a[4];
      document.getElementById('s5CAdd').click(); return document.getElementById('s5CMsg') ? document.getElementById('s5CMsg').textContent : '';
    }, [age, area, kind, man, ym]);
    await add('40대', '순천', '실손 미청구', '120', '2026-09');
    await add('60대', '여수', '만기보험금', '', '2026-08');
    const nm = await add('40대', '홍길동님', '기타', '', '');
    is(/이름/.test(nm) && (await p.evaluate(() => s5Cases().length)) === 2, '지역 칸에 「○○님」 을 적으면 안 받는다');
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem('apex_s5_cases_v1')));
    is(st.length === 2 && st.every(c => !('name' in c)) && st[1].man === null, '이 기기에만 · 이름 없이 · 비운 금액은 0 이 아니라 null');
    const pick = async (age, area) => p.evaluate(a => {
      const g = document.getElementById('s5FAge'); g.value = a[0]; g.dispatchEvent(new Event('change'));
      const r = document.getElementById('s5FArea'); r.value = a[1]; r.dispatchEvent(new Event('change'));
      return { say: (document.getElementById('s5Say') || {}).textContent || '', no: !!document.getElementById('s5NoCase'),
               list: document.getElementById('s5Find').textContent };
    }, [age, area]);
    let r1 = await pick('40대', '순천');
    is(/또래시고 가까이/.test(r1.say) && /40대/.test(r1.say) && /순천/.test(r1.say) && /120만원/.test(r1.say), '같은 나이대 · 같은 지역 사례를 꺼낸다 — 「' + r1.say.slice(0, 50) + '…」');
    r1 = await pick('60대', '');
    is(/여수/.test(r1.say) && !/만원/.test(r1.say.replace(/3조 2,470억원/, '')), '금액을 비운 사례는 금액을 말하지 않는다');
    is(/금액 안 적음/.test(r1.list) && !/· 0만원|· 0원/.test(r1.list), '목록에도 「금액 안 적음」 — 0 으로 적지 않는다');
    r1 = await pick('30대', '부산');
    is(r1.no && !/또래|근처에 사시는/.test(r1.say), '겹치는 사례가 없으면 「비슷하다」 고 말하지 않는다');

    console.log('\n[화면] 인쇄 · 오류 · 서버');
    await p.evaluate(() => s5Tab('one'));
    await p.emulateMedia({ media: 'print' });
    const pr = await p.evaluate(() => ({ tabs: getComputedStyle(document.getElementById('s5Tabs')).display,
      who: getComputedStyle(document.getElementById('s5-who')).display, one: getComputedStyle(document.getElementById('s5-one')).display }));
    is(pr.tabs === 'none' && pr.who === 'none' && pr.one !== 'none', '인쇄는 탭 없이 고른 한 장만 나온다');
    await p.emulateMedia({ media: 'screen' });
    is(errs.length === 0, '스크립트 오류 0' + (errs.length ? ' ← ' + errs.slice(0, 2).join(' | ') : ''));
    const ext = out.filter(u => !/fonts\.googleapis|fonts\.gstatic/.test(u));
    is(ext.length === 0, '바깥 서버를 부르지 않는다' + (ext.length ? ' ← ' + ext[0] : ''));
  } finally { await b.close(); srv.close(); }
  console.log(bad ? '\n✗ 5세대 실비 · 할인 RP — 고칠 자리 ' + bad + '곳' : '\n✓ 5세대 실비 · 할인 RP — 모두 통과');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
