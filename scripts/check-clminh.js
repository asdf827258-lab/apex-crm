/* 🏥 <b>청구센터 인하우스</b> — 판 X501 · X502
   사장님 말씀 (2026-11-20) — 「보험금청구센터 고객님이 보험금을 / 보험 연결 되는 부분 [암,뇌,심,운전자] …
     가족 보험 / 미끼 던지는 것 / 고객이 척추전문병원에서 어떻게 끌고 올수 있는지 … 40~60대 … 연령대별로
     어떤 담보와 핵심 … 보험료비교, 보험료할인제도, 숨은보험금찾기, 질문지를 하나로 … 인하우스 전략 …
     어디 시술인지, 소통 하는 부분들을 찾는 것들도 중요하다」

   못 박는 것 —
     ① 말씀의 갈래가 다 선다 — 시술 찾기 · 소통 · 한 장 질문지(보험료 비교 · 할인 · 숨은 보험금) · 40/50/60대 ·
        암·뇌·심·운전자 · 가족 · 미끼 · 동선
     ② <b>금액·한도·할인율 숫자 0</b> — 「약관과 심사 결과에 따릅니다」 (1번·2번)
     ③ 무사고 할인 제도의 숫자를 여기 다시 적지 않는다 — 📞 30초 TA 가 쥔다 (5번)
     ④ 「모름」 은 「없음」 이 아니다 — 모름이면 「확인」, 답 없는 칸은 「아직」 (1번)
     ⑤ 동의가 없으면 질문지를 받지 않는다 · 상담 연락 동의가 없으면 만남을 권하지 않는다
     ⑥ 이름·전화·주민번호 칸 0 · 기억 0 · 서버 0 (3번·7번) · tnum 0 (4-1번)
     ⑦ 「나옵니다」 「무조건」 같은 약속 말 0
     ⑧ 메뉴에서 열린다 · 폰 390px 에서 옆으로 안 밀린다
   판 X502 (사장님 말씀 2026-11-20 「흠 비효율적인데, 알릴의무에 대한 개념을 탑재해서, 이 분들에게 가입 가능한
     보험들이 있고, 우리가 무엇을 비교해야할지 쉽게 비교할수 있고 담보에 대한 이해를 할 수 있도록」) —
     ⑨ 🧭 가입 길 찾기가 첫 탭 — ① 알릴의무 ② 들 수 있는 길 ③ 나란히 비교 ④ 담보 이해
     ⑩ 알릴의무 · 길 글에 <b>숫자 0</b>(기간은 상품마다 다르고 바뀜 · 1번) · 이번 치료도 알릴 대상 · 대신 답하지 않음
     ⑪ 길은 답에서 — 치료 중이면 「기다릴 때」 가 먼저 · <b>모름이면 「먼저 견적」 을 세우지 않음</b> · 「됩니다」 0
     ⑫ 비교의 범위 줄은 <b>셀프 점검(selfcheck-core.js) 보기 그대로</b> · 넓은 쪽에만 초록 · 모름이 섞이면 판정 0 ·
        보험료 · 갱신 · 환급은 맞바꾸는 것이라 판정 0 · 보험료는 원 단위 차이만
     ⑬ 담보 글은 <b>kijun-dict.js 한 벌</b>에서만 — 여기 다시 적지 않음 (5번)
     ⚠ 되돌림 다섯이 웁니다 — 큰 병 모름에 먼저 견적 · 모름을 좁은 쪽으로 판정 · 고지 기간 외워 적기 ·
       담보 글 베껴 적기 · 보험료 싼 쪽에 초록                                                   */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = process.cwd(), PORT = 9163;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const HTML = fs.readFileSync(path.join(ROOT, 'app/claim-inhouse.html'), 'utf8');
const scripts = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const box = {}; vm.createContext(box); vm.runInContext(scripts[0].replace(/^var /gm, 'this.'), box);
const { CI_NAV_G, CI_GJ_IDEA, CI_GJ_Q, CI_PATH, CI_CMP, CI_DAMBO, CI_FLOW, CI_ASK5, CI_DOCS, CI_PROC, CI_TALK, CI_Q, CI_AGE, CI_FOUR, CI_FOUR_NOTE, CI_FAM, CI_HOOK, CI_LINE } = box;
const plain = t => String(t).replace(/<[^>]+>/g, '');
const ALLTXT = plain(JSON.stringify([CI_GJ_IDEA, CI_GJ_Q, CI_PATH, CI_CMP, CI_DAMBO, CI_FLOW, CI_ASK5, CI_DOCS, CI_PROC, CI_TALK, CI_Q, CI_AGE, CI_FOUR, CI_FOUR_NOTE, CI_FAM, CI_HOOK, CI_LINE]))
  + plain(HTML.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<style>[\s\S]*?<\/style>/g, ''));

console.log('\n[1] 말씀의 갈래가 다 서나');
is(CI_PROC.length >= 8 && ['주사', '신경성형', '고주파', '내시경', '유합', '압박골절', '도수', '교통사고', '넘어짐'].every(w => CI_PROC.some(p => p.n.indexOf(w) >= 0)), '척추병원 시술 카드 — 주사 · 신경성형 · 고주파 · 내시경 · 유합 · 압박골절 · 도수 · 교통사고 · 넘어짐');
is(CI_PROC.every(p => p.look.length && p.doc && p.say && p.bridge), '카드마다 볼 담보 · 서류 · 말 걸 거리 · 다음 다리');
is(CI_ASK5.length === 5 && CI_ASK5.some(a => /저절로/.test(a.q) && /질병/.test(a.w) && /상해/.test(a.w)), '시술 찾는 다섯 질문 — 질병·상해를 가르는 물음이 있다');
is(CI_DOCS.some(d => /S·T/.test(d[1])), '서류에서 찾는 법 — S·T 코드는 다친 것(상해)');
is(CI_TALK.length >= 5 && CI_TALK.some(t => /결과/.test(t.at)), '장면마다 한마디 — 지급 결과 전화가 2차 접점');
const G = id => CI_Q.find(g => g.items.some(i => i.id === id));
is(['burden', 'renew', 'noacc', 'past', 'pastClaim', 'famHosp'].every(G), '한 장 질문지 하나에 보험료 비교 · 할인 · 숨은 보험금이 다 든다');
is(['40대', '50대', '60대'].every(a => CI_AGE.some(x => x.a === a && x.look.length >= 3 && x.bridge && x.care)), '40·50·60대 — 한마디 · 볼 담보 · 다리 · 조심');
is(['암', '뇌', '심장', '운전자'].every(k => CI_FOUR.some(f => f.k === k && f.bridge && f.look.length)), '암 · 뇌 · 심장 · 운전자로 건너가는 한마디');
is(['배우자', '부모님', '자녀'].every(w => CI_FAM.some(f => f.w === w)), '가족 — 배우자 · 부모님 · 자녀');
is(CI_HOOK.length >= 5 && /무료/.test(CI_HOOK[0].n), '미끼 — 돈 안 드는 것(청구 서류 점검 무료)부터');

console.log('\n[2] 금액·한도·할인율 숫자 0 · 심사 결과');
const money = ALLTXT.match(/[0-9][0-9,.]*\s*(만원|천만원|억|원|%|퍼센트|배)/g) || [];
is(money.length === 0, '금액·비율 숫자가 없다' + (money.length ? ' — ' + money.slice(0, 5).join(' / ') : ''));
const nums = (ALLTXT.match(/[0-9]+/g) || []).filter(n => !/^(40|50|60|1|2|3|4|5|6|0)$/.test(n));
const numAllow = ['50', '51', '30']; /* M50 · M51 진단코드 · 「30초 TA」 는 화면 이름 */
const strange = nums.filter(n => numAllow.indexOf(n) < 0);
is(strange.length === 0, '나이대 · 차례 · 1~5종 · M50/M51 말고 숫자가 없다' + (strange.length ? ' — ' + strange.slice(0, 8).join(',') : ''));
is(/약관과 보험사 심사 결과에 따릅니다/.test(ALLTXT) && /심사 결과에 따릅니다/.test(plain(CI_FOUR_NOTE)), '「약관과 보험사 심사 결과에 따릅니다」 · 새 가입은 「심사 결과에 따릅니다」');
is(/사실대로/.test(plain(CI_FOUR_NOTE)) && /장담하지 않/.test(plain(CI_FOUR_NOTE)), '척추 병력 — 사실대로 알리고, 가입을 장담하지 않는다');

console.log('\n[3] 무사고 할인 숫자는 30초 TA 한 곳에 (5번)');
is(!/6\.5|45\.9|17\.6|1081|116만|3조|404/.test(ALLTXT), '할인율·통계 숫자를 다시 적지 않았다');
is(CI_FAM.some(f => f.link && /30초 TA/.test(f.link)) && CI_HOOK.some(h => /30초 TA/.test(h.to)), '할인 제도 설명은 「📞 30초 TA · 무사고 할인」 으로 보낸다');
is(CI_FAM.some(f => /본인은 대상이 아닐 수/.test(f.look)), '이번에 치료받은 본인은 대상이 아닐 수 있다 — 가족이 다리');

console.log('\n[7] 약속 말 0');
is(!/무조건|100 ?%|반드시 나옵|꼭 나옵|보장됩니다|다 나와요|확실히 나/.test(ALLTXT), '「무조건 · 꼭 나옵니다 · 보장됩니다」 가 없다');
is(CI_LINE.some(l => /약속하지 않습니다/.test(l)) && CI_LINE.some(l => /무료/.test(l) && /손해사정/.test(l)) && CI_LINE.some(l => /따로/.test(l) && /동의/.test(l)) && CI_LINE.some(l => /소개비/.test(l)), '지킬 선 — 지급 약속 0 · 청구 도움 무료(손해사정) · 건강정보 따로 동의 · 소개비 0');

console.log('\n[6] 이름 칸 0 · 기억 0 · 서버 0 · tnum 0');
const BODY = HTML.replace(/<script[\s\S]*?<\/script>/g, '');
is(!/<input[^>]*(type="(text|tel|number)"|placeholder)/i.test(BODY) && !/이름|전화번호|주민/.test(CI_Q.map(g => g.items.map(i => i.q).join()).join() + CI_GJ_Q.map(i => i.q).join() + CI_CMP.map(r => r.n).join()), '이름 · 전화 · 주민번호 칸이 없다 (비교표의 글칸은 상품 조건만)');
is(!/data-sc(-keep)?[=\s>"]/.test(BODY), '셀프 점검 표만 빌린다 — data-sc · data-sc-keep 이 없어 그쪽도 기억하지 않는다');
is(!/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon/.test(scripts.join('\n')), '기억하지 않고 서버를 부르지 않는다');
is(!/tnum/.test(HTML), 'tnum 이 없다 (4-1번)');

console.log('\n[10] 알릴의무 — 기간 숫자 0 · 사실대로');
const gjTxt = plain(CI_GJ_IDEA.join(" ") + JSON.stringify(CI_GJ_Q).replace(/"multi":1/g, "") + JSON.stringify(CI_PATH));
is(!/[0-9]/.test(gjTxt), '알릴의무 · 길 글에 숫자가 하나도 없다 — 기간은 그 상품 청약서에서');
is(/사실대로/.test(gjTxt) && /상품마다 다릅니다/.test(gjTxt) && /청구를 했든 안 했든/.test(gjTxt) && /대신 답하거나/.test(gjTxt), '사실대로 · 기간은 상품마다 · 이번 치료도 알릴 대상 · 대신 답하지 않음');
is(/넣기 전에 거릅니다/.test(gjTxt), '넣기 전에 거른다 — 미리 회사 심사 담당에게');
is(Object.keys(CI_PATH).every(k => !/됩니다|돼요|가입 가능/.test(plain(CI_PATH[k].say))), '길마다 건네는 말에 「됩니다 · 돼요 · 가입 가능」 이 없다');
is(['wait', 'gen', 'easy', 'silson', 'car'].every(k => CI_PATH[k] && CI_PATH[k].good && CI_PATH[k].bad && CI_PATH[k].chk), '길 다섯 — 좋은 점 · 아쉬운 점 · 확인할 것');

console.log('\n[12] 비교 — 범위 줄은 셀프 점검 보기 그대로');
is(['brain', 'heart', 'surg', 'end'].every(k => CI_CMP.some(r => r.k === k && r.sc === k && !r.o && r.w === 1)), '뇌 · 심장 · 수술비 · 보장 끝 줄은 selfcheck-core 의 보기를 빌리고(글 0) 넓은 쪽을 판정');
is(['premWon', 'pay', 'renew', 'refund', 'way'].every(k => CI_CMP.some(r => r.k === k && r.w === 0)), '보험료 · 납입 · 갱신 · 환급 · 심사 방식은 맞바꾸는 것 — 판정하지 않는다');
is(CI_CMP.some(r => r.k === 'excl') && CI_CMP.some(r => r.k === 'cut'), '빠지는 부위·기간 · 감액·면책 기간 줄이 있다');
is(/<script src="selfcheck-core\.js"><\/script>/.test(HTML), 'selfcheck-core.js 를 싣는다');

console.log('\n[13] 담보 글은 kijun-dict.js 한 벌');
const dbox = { window: {} }; vm.createContext(dbox); vm.runInContext(fs.readFileSync(path.join(ROOT, 'app/kijun-dict.js'), 'utf8'), dbox);
const DICT = {}; dbox.window.KJ_DICT.forEach(g => g.d.forEach(d => { DICT[d.id] = d; }));
const ids = [].concat(...CI_DAMBO.map(g => g.ids));
const lost = ids.filter(id => !DICT[id]);
is(lost.length === 0, '고른 담보 ' + ids.length + '개가 다 사전에 있다' + (lost.length ? ' — 없음: ' + lost.join(',') : ''));
is(/<script src="kijun-dict\.js"><\/script>/.test(HTML), 'kijun-dict.js 를 싣는다');
const own = ids.filter(id => DICT[id] && HTML.indexOf(DICT[id].w) >= 0);
is(own.length === 0, '사전 글을 이 파일에 베껴 적지 않았다' + (own.length ? ' — ' + own.join(',') : ''));
is(['cancer', 'brain', 'heart-a', 'surg', 'car-settle', 'silson'].every(id => ids.indexOf(id) >= 0), '암 · 뇌 · 심장 · 수술 · 운전자 · 실손이 다 든다');

const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
console.log('\n[8] 메뉴');
is(/\{id:'clm_inh',tk:'고객',icon:'🏥',title:'청구센터 인하우스'/.test(IDX), 'TABS 에 🏥 청구센터 인하우스');
is(/else if\(tab==='clm_inh'\)dyn\.innerHTML=renderClmInhPage\(\);/.test(IDX) && /src="claim-inhouse\.html"/.test(IDX), 'go() 가 claim-inhouse.html 을 연다');

(async () => {
  const srv = http.createServer((q, r) => {
    const f = path.join(ROOT, 'app', decodeURIComponent(q.url.split('?')[0]));
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
  }).listen(PORT);
  const br = await chromium.launch();
  try {
    const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
    /* 바깥은 막는다 — 127.0.0.1 밖은 끊고, 끊은 것도 아래 「바깥 요청 0」 에 잡힌다 (check-netblock) */
    await pg.route('**://**', r => /^http:\/\/127\.0\.0\.1:/.test(r.request().url()) ? r.continue() : r.abort());
    const errs = []; pg.on('pageerror', e => errs.push(e.message));
    const reqs = []; pg.on('request', q => { if (!/^http:\/\/127\.0\.0\.1:/.test(q.url())) reqs.push(q.url()); });
    await pg.goto('http://127.0.0.1:' + PORT + '/claim-inhouse.html');
    await pg.waitForSelector('#res', { state: 'attached' });
    is(errs.length === 0, '스크립트 오류 0' + (errs.length ? ' — ' + errs[0] : ''));
    const sw = await pg.evaluate(() => document.documentElement.scrollWidth);
    is(sw <= 390, '폰 390px 에서 옆으로 안 밀린다 (' + sw + 'px)');

    console.log('\n[9] 첫 탭은 🧭 가입 길 찾기');
    is(await pg.isVisible('#g-gj') && !(await pg.isVisible('#s-q')), '처음 열면 ① 알릴의무가 보이고 병원 데스크는 접혀 있다');
    is((await pg.$$eval('#nav a', a => a.map(x => x.textContent))).join('|') === CI_NAV_G.map(n => n[1]).join('|'), '위 띠가 가입 길 네 걸음');

    console.log('\n[11] 길은 답에서');
    const P = async g => pg.evaluate(g => window.ciPaths(g), g);
    let r = await P({});
    is(r.L.length === 0, '아무 답도 없으면 길을 세우지 않는다');
    r = await P({ now: '예' });
    is(r.L[0].k === 'wait' && r.L[0].tag === 'first' && r.L.filter(x => x.tag === 'first').length === 1, '치료 중 → 「기다릴 때」 가 먼저 · 견적 길은 「치료 뒤에」');
    r = await P({ now: '아니오', big: '없다' });
    is(r.L[0].k === 'gen' && r.L[0].tag === 'first' && r.L.some(x => x.k === 'easy' && x.tag === 'also'), '치료 끝 · 큰 병 없음 → 일반심사(부담보) 먼저 · 간편심사 같이 비교');
    r = await P({ now: '아니오', big: '있다' });
    is(r.L[0].k === 'easy' && r.L[0].tag === 'first', '큰 병 있음 → 간편심사 먼저 · 일반은 확인 먼저');
    r = await P({ now: '아니오', big: '모름' });
    is(!r.L.some(x => x.tag === 'first') && /모르면/.test(r.notes.join()), '큰 병 「모름」 → 「먼저 견적」 0 — 없다로 세지 않는다');
    r = await P({ now: '모름' });
    is(!r.L.some(x => x.tag === 'first'), '치료 중인지 「모름」 → 「먼저 견적」 0');
    r = await P({ now: '아니오', big: '없다', drug: '있다', kind: ['수술'] });
    is(/약의 병도 알릴 대상/.test(r.notes.join()) && /수술 · 입원/.test(r.notes.join()), '약 · 수술 이력 → 알릴 대상 쪽지');
    await pg.click('input[name="gj_now"][value="아니오"]', { force: true });
    await pg.click('input[name="gj_big"][value="없다"]', { force: true });
    const pt = await pg.textContent('#paths');
    is(/일반심사 — 척추를 빼고/.test(pt) && /먼저 견적/.test(pt) && /심사 결과에 따릅니다/.test(pt), '누르면 길이 서고 「심사 결과에 따릅니다」');
    const since = await pg.evaluate(() => [window.ciSince('2026-08-20', new Date(2026, 10, 20)), window.ciSince('2026-01-31', new Date(2026, 2, 1)), window.ciSince('2027-01-01', new Date(2026, 10, 20))]);
    is(since[0].mo === 3 && since[0].day === 0 && since[1].mo === 1 && since[1].day === 1 && since[2].future === 1, '기준점 날짜 → 지난 달·날을 바로 센다(말일 · 앞날짜) — ' + JSON.stringify(since));

    console.log('\n[12] 나란히 비교');
    const scBrain = await pg.evaluate(() => window.APXSelf.options('brain').filter(o => o[0] !== '?').map(o => o[1]));
    const selBrain = await pg.$$eval('select[data-k="brain"][data-c="A"] option', o => o.map(x => x.textContent));
    is(selBrain[0] === '모름' && selBrain.slice(1).join('|') === scBrain.join('|'), '뇌 범위 보기 = 셀프 점검 보기 그대로 (+ 모름)');
    is(await pg.evaluate(() => window.ciWin('brain', '뇌혈관질환', '뇌출혈만')) === 'A' && await pg.evaluate(() => window.ciWin('brain', '', '뇌출혈만')) === '', '넓은 쪽 판정 · 모름이 섞이면 판정 0');
    is(await pg.evaluate(() => window.ciWin('renew', '없어요 (비갱신)', '있어요')) === '' && await pg.evaluate(() => window.ciWin('refund', '표준형', '무·저해지형')) === '', '갱신 · 환급은 판정하지 않는다');
    await pg.selectOption('select[data-k="heart"][data-c="A"]', { index: 2 });
    await pg.selectOption('select[data-k="heart"][data-c="B"]', { index: 1 });
    is(await pg.$eval('tr[data-row="heart"] td:nth-child(3)', t => t.classList.contains('win')) && !(await pg.$eval('tr[data-row="heart"] td:nth-child(2)', t => t.classList.contains('win'))), '심장 — 넓은 B 칸에만 초록');
    await pg.fill('input[data-k="premWon"][data-c="A"]', '83000');
    await pg.dispatchEvent('input[data-k="premWon"][data-c="A"]', 'change');
    is(!/차이/.test(await pg.textContent('tr[data-row="premWon"]')), '보험료 한쪽만 적으면 차이를 안 센다(모름)');
    await pg.fill('input[data-k="premWon"][data-c="B"]', '95000');
    await pg.dispatchEvent('input[data-k="premWon"][data-c="B"]', 'change');
    const prow = await pg.textContent('tr[data-row="premWon"]');
    is(/한 달 12,000원 차이/.test(prow) && !(await pg.$$('tr[data-row="premWon"] td.win')).length, '둘 다 적으면 원 단위 차이만 · 초록 0');

    console.log('\n[13] 담보 이해');
    const cards = await pg.$$eval('#dambo .dcard[data-id]', c => c.map(x => [x.getAttribute('data-id'), x.querySelector('dd').innerHTML]));
    is(cards.length === ids.length && cards.every(c => c[1] === DICT[c[0]].w), '카드 ' + cards.length + '장 — 글이 사전과 한 글자도 안 다르다');
    is((await pg.$$('#dambo .ladder div')).length === 6, '뇌 · 심장은 좁은 이름 → 넓은 이름 사다리');

    await pg.click('#tabs button[data-t="desk"]');
    is(await pg.isVisible('#s-q') && !(await pg.isVisible('#g-gj')), '🏥 병원 데스크 탭으로 바꾸면 질문지가 선다');

    console.log('\n[4] 「모름」 은 「없음」 이 아니다 · 답 없는 칸은 「아직」');
    const pick = async (n, v) => pg.click('input[name="' + n + '"][value="' + v + '"]', { force: true });
    let res = await pg.textContent('#res');
    is(/아직 고른 답이 없습니다/.test(res) && /없음/.test(res), '아무것도 안 골랐을 때 — 「없음」 으로 세지 않는다고 적는다');
    await pick('agPriv', '동의'); await pick('agHealth', '동의');
    await pick('cancer', '모름');
    res = await pg.textContent('#res');
    is(/암 — 모르심 \(없다는 뜻이 아닙니다\)/.test(res) && !/암 — 비어 있다/.test(res), '암 「모름」 → 「없다는 뜻이 아닙니다 · 증권으로 확인」, 빈칸 다리로 안 감');
    await pick('cancer', '없다');
    res = await pg.textContent('#res');
    is(/암 — 비어 있다고 하심/.test(res), '암 「없다」 → 건너가는 한마디로');
    is(/아직 — \d+칸/.test(res), '답 없는 칸은 「아직 — N칸」');

    console.log('\n[1] 답이 먼저 할 것으로 서나');
    await pick('proc', '압박골절 시멘트'); await pick('cause', '넘어짐·다침');
    await pick('noacc', '있다'); await pick('renew', '있다'); await pick('past', '있다'); await pick('pastClaim', '안 했다');
    res = await pg.textContent('#res');
    is(/척추체성형술/.test(res) && /골절진단비/.test(res), '시술(압박골절) → 그 카드의 볼 담보');
    is(/상해수술비/.test(res), '다침 → 상해 담보');
    is(/무사고 할인 — 가족분/.test(res) && /30초 TA/.test(res), '가족 무사고 → 할인 확인 · 30초 TA 로');
    is(/보험료 비교표/.test(res), '갱신 안내 → 보험료 비교표');
    is(/숨은 보험금/.test(res), '청구 안 한 지난 치료 → 숨은 보험금');
    is(/심사 결과에 따릅니다/.test(res), '결과 아래 「심사 결과에 따릅니다」');
    is(/가입 길 찾기 ① 알릴의무부터/.test(res), '질문지 결과 → 🧭 가입 길 찾기로 잇는다');
    await pg.click('#res a[href="#g-gj"]');
    is(await pg.evaluate(() => window.ciTab()) === 'gil' && await pg.isVisible('#g-gj'), '그 고리를 누르면 탭이 바뀌고 ① 알릴의무로 간다');
    await pg.click('#tabs button[data-t="desk"]');
    await pg.click('#ageBar button[data-age="60대"]');
    res = await pg.textContent('#res');
    is(/60대 — /.test(res) && /실손 유지/.test(res), '나이대(60대)를 고르면 그 나이대 볼 담보');

    console.log('\n[5] 동의가 없으면');
    await pick('agCall', '안 함');
    res = await pg.textContent('#res');
    is(/만남은 권하지 않습니다/.test(res), '상담 연락 동의 안 함 → 결과 안내만, 만남 권유 0');
    await pick('agCall', '동의');
    res = await pg.textContent('#res');
    is(!/만남은 권하지 않습니다/.test(res) && /둘 중 하나/.test(res), '동의 → 결과 전화에서 둘 중 하나로');
    await pick('agHealth', '안 함');
    res = await pg.textContent('#res');
    is(/질문지를 받지 않습니다/.test(res) && !/골절진단비/.test(res), '건강정보 동의 안 함 → 질문지를 받지 않는다(이미 고른 답도 안 씀)');

    await pg.click('#bReset');
    res = await pg.textContent('#res');
    is(/아직 고른 답이 없습니다/.test(res) && (await pg.$$eval('#qs input:checked', x => x.length)) === 0, '처음부터 — 답이 다 지워진다');
    is(reqs.length === 0, '바깥 요청 0' + (reqs.length ? ' — ' + reqs[0] : ''));
  } finally { await br.close(); srv.close(); }
  console.log('\n' + (bad ? '✗ ' + bad + '가지 어긋남' : '✓ 청구센터 인하우스 — 다 맞습니다'));
  process.exit(bad ? 1 : 0);
})();
