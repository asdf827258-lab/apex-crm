/* 📱 보장 전·후 — 고객 카톡판(그림 여러 장) · 판 X507 (app/ba-kakao.js)

   사장님 말씀 2026-11-19 「고객이 카톡버전이나 조금 더 보기 쉽게 정리할수 있도록 버전도」 ·
   「그래도 고객이 내 보험 자세히 이해할수 있도록」 → 11-20 「응 차례대로 진행해」.

   보는 것
     [1] ④ 보여주기에 단추가 있고, 장 수 = 표지 1 + 내 보험 자세히(두 건씩) + 셋
     [2] ★★ 숫자가 화면과 같다 — 한 달 보험료는 옆 칸(premCalc · 다 낸 보험 뺌)과 같고, 계약 줄 금액은 적힌 그대로
     [3] ★★ 정리(해지)가 있을 때만 해지 불이익 ①② 가 심의 문구 그대로 · 약관 · 가입설계 유의 문구는 늘
     [4] 줄어드는 것을 숨기지 않는다 · 실손 여섯 칸은 두 줄로 · 이름이 없으면 「고객님」
     [5] 그림으로 굽는다(1080px) · 보내기 판 · 보내는 요청 0 · 오류 0                                        */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': /\.js$/.test(f) ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [], out = []; pg.on('pageerror', e => errs.push(e.message));
  pg.on('request', q => { if (q.method() !== 'GET') out.push(q.method() + ' ' + q.url()); });
  /* ★ 바깥은 끊는다 — 그림 굽는 html2canvas 만 cdnjs 에서 받는다(check-baterm 과 같음) */
  await pg.route('**://**', r => { const u = r.request().url();
    return (/^http:\/\/127\.0\.0\.1/.test(u) || /cdnjs\.cloudflare\.com\/ajax\/libs\/html2canvas\//.test(u)) ? r.continue() : r.abort(); });
  await pg.goto('http://127.0.0.1:' + port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(800);
  await pg.evaluate(() => { localStorage.clear(); window.confirm = () => true; doSample(); bsGo(4); });
  await pg.waitForTimeout(200);
  /* 글은 화면에 붙여 읽는다 — 떼어 둔 상자의 innerText 는 줄바꿈을 빈칸으로 안 바꾼다 */
  const cards = () => pg.evaluate(() => bkCards().map(c => { const d = document.createElement('div'); d.id = 'bkHost'; d.style.cssText = 'position:absolute;left:-9000px;width:720px';
    d.innerHTML = c.h; document.body.appendChild(d); const txt = d.innerText.replace(/\s+/g, ' '); d.remove(); return { t: c.t, txt: txt, h: c.h }; }));

  head('[1] 단추 · 장 수');
  is(await pg.evaluate(() => !!document.querySelector('.bs-big[onclick="bkOpen()"]')), '④ 보여주기에 「📱 카톡판」 단추');
  let C = await cards();
  const nPol = await pg.evaluate(() => S.before.length + S.after.length);
  is(C.length === 1 + Math.ceil(nPol / 2) + 3, '장 ' + C.length + '개 = 표지 1 + 내 보험 자세히 ' + Math.ceil(nPol / 2) + ' + 셋 — ' + C.map(c => c.t).join(' / '));
  is(C[0].t === '표지 · 목차' && C.slice(1).every((c, i) => C[0].txt.indexOf((i + 2) + ' ' + c.t) >= 0 || C[0].txt.indexOf(c.t) >= 0), '표지 목차에 뒤 장이 다 적혀 있다');

  head('[2] ★★ 숫자가 화면과 같다');
  const P = await pg.evaluate(() => { const o = premCalc(); return { b: fee(o.monB), a: fee(o.monA), side: document.getElementById('sideBox').innerText.replace(/\s+/g, ' ') }; });
  is(C[0].txt.indexOf(P.b + ' → ' + P.a) >= 0, '표지 한 달 보험료 ' + P.b + ' → ' + P.a + ' = premCalc(다 낸 보험 뺌)');
  is(P.side.indexOf(P.b) >= 0 && P.side.indexOf(P.a) >= 0, '옆 요약 칸과 같은 숫자(' + P.b + ' · ' + P.a + ')');
  const last = C[C.length - 1].txt;
  is(last.indexOf(P.b) >= 0 && last.indexOf(P.a) >= 0, '마지막 장 보험료도 같다');
  const pol = C.find(c => c.txt.indexOf('참편한키다리') >= 0).txt;
  is(/암 진단 — 한 번에.*2,000만원/.test(pol) && /지금 50만원 80만원/.test(pol) && /하루 3만원/.test(pol), '한화 줄 — 암 2,000만원 · 다쳐서 수술 지금 50만 → 80만 · 입원 하루 3만원(적힌 그대로)');
  is(/월 42,000원 → 바꾸면 51,000원/.test(pol), '배서 보험료 42,000원 → 51,000원');

  head('[3] ★★ 꼭 보실 것');
  const W1 = '① 질병이력, 연령증가 등으로 가입이 거절되거나 보험료가 인상될 수 있습니다.', W2 = '② 가입 상품에 따라 새로운 면책기간 적용 및 보장 제한 등 기타 불이익이 발생할 수 있습니다.';
  is(last.indexOf(W1) >= 0 && last.indexOf(W2) >= 0, '정리하는 계약이 있으니 해지 불이익 ①② 가 심의 문구 그대로');
  is(last.indexOf('※ 보험사 및 상품별로 상이할 수 있으므로, 관련한 세부사항은 반드시 해당 약관을 참조하시기 바랍니다.') >= 0 &&
     last.indexOf('※ 보험회사 상품별, 성별, 연령, 직업에 따라 가입 가능한 담보와 가입금액, 보험료 등은 달라질 수 있습니다.') >= 0, '약관 · 가입설계 유의 문구 그대로');
  await pg.evaluate(() => { S.before.forEach(p => { if (p.act === 'cancel') p.act = 'keep'; }); save(); });
  C = await cards();
  is(C[C.length - 1].txt.indexOf(W1) < 0, '정리하는 계약이 없으면 해지 불이익 문구는 안 붙는다');

  head('[4] 줄어드는 것 · 실손 · 이름');
  /* 알파PLUS(메리츠)를 정리하면 그 계약에만 있던 보장이 실제로 준다 — 숨기지 않고 그 장에 서야 한다 */
  const lossK = await pg.evaluate(() => { S.before[3].act = 'cancel'; save(); const d = diff(calc()); return d.loss.length ? bkNm(d.loss[0].k) : ''; });
  C = await cards();
  const df = C.find(c => /늘어나는 것/.test(c.t)).txt, dl = df.slice(df.indexOf('줄어들어요'));
  is(!!lossK && /줄어들어요 [1-9]/.test(dl) && dl.indexOf(lossK) >= 0, '줄어드는 보장도 그 장에 선다 — ' + dl.slice(0, 60));
  const p1 = C[1].txt;
  is(/병원비 돌려받기 — 병 \(실손\).*입원 5,000만 · 통원 20만 · 약 10만/.test(p1) && p1.indexOf('질병통원의료비') < 0, '실손 여섯 칸 → 두 줄(입원 · 통원 · 약)');
  await pg.evaluate(() => { S.who.name = ''; save(); });
  is((await cards())[0].txt.indexOf('고객님의 보험 한 번에 보기') >= 0, '이름이 없으면 「고객님」 — 지어내지 않는다');
  await pg.evaluate(() => { localStorage.clear(); doSample(); bsGo(4); });

  head('[5] 그림 · 보내기 판');
  await pg.click('.bs-big[onclick="bkOpen()"]');
  let got = false; try { await pg.waitForFunction(() => window.__BK && window.__BK.length, null, { timeout: 60000 }); got = true; } catch (e) {}
  is(got, '그림을 구웠다' + (got ? '' : ' (html2canvas 를 못 받았으면 인터넷 연결 문제일 수 있음)'));
  if (got) {
    const I = await pg.evaluate(() => ({ n: window.__BK.length, w: window.__BK.map(x => x.w), imgs: document.querySelectorAll('#bkBox .bki img').length,
      btn: [].map.call(document.querySelectorAll('#bkBox .bka button'), b => b.textContent.trim()), fin: (document.querySelector('#bkBox .fin') || {}).textContent || '' }));
    const n = (await cards()).length;
    is(I.n === n && I.imgs === n, n + '장 다 구워 판에 띄웠다');
    is(I.w.every(w => w === 1080), '장마다 1080px (폰 카톡에서 선명하게)');
    is(I.btn.some(t => /모두 저장/.test(t)), '「모두 저장」 단추 — ' + I.btn.join(' / '));
    is(/이 기기 안에서만/.test(I.fin), '고객 자료가 이 기기 밖으로 안 나간다고 적혀 있다');
  }
  is(out.length === 0, '보내는 요청 0' + (out.length ? ' — ' + out.slice(0, 2).join(' / ') : ''));
  is(errs.length === 0, '오류 0' + (errs.length ? ' — ' + errs.join(' / ') : ''));

  await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ ' + bad + '개 빨간불' : '카톡판 점검 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
