/* ❤️ 심장 치료 한 바퀴 — 가장 흔한 <b>협심증</b>으로 보여 주나 (판 X496)
   사장님 말씀 2026-11-19 「심장질환에서 치료과정 보이는것들 너무 좋은데, 가장 많이 걸리는 협심증으로 체크해줘」.

   허혈성 심장병 진료인원 중 협심증 68.4% · 급성심근경색 10.2% (심평원 2011~2015 · ba-report SRC hira_heart).
   예시를 급성심근경색으로 들면 「급성심근경색 진단비」 가 첫 단계부터 열려 보여서,
   정작 가장 흔한 협심증에선 그 담보가 <b>0원</b>이라는 것이 가려진다. 그래서 여기서 못 박는 것:

     1. 보고서(ba-report.html) 심장 여정 — 예시 병이 협심증, 다섯 단계(가슴 조임 → 조영술 확진 → 스텐트 → 입원 → 약)
     2. 확진 단계에서 「허혈성」 은 한 번 열리고 「급성심근경색」 은 안 열린다(m:'none')
     3. 어느 단계에서도 급성심근경색 진단비가 돈으로 잡히지 않는다
     4. 시술 이해하기 그림 — 「협심증은 이렇게 옵니다」 → 스텐트 (혈전 시뮬레이션이 아님)
     5. 단계마다 사진이 있고, 확진 단계에 「좁아진 관상동맥」 사진이 옮겨 와 있다
     6. 보장 전·후(ba.html) 「이 병이 오면」 심장 첫 단계 pay 에 mi 가 없다 · 치료 여정 표 이름이 협심증
     7. 고객 자료(#d=)가 들어와도 예시 병 이름이 협심증으로 붙는다                         */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));

  console.log('\n[1~5] 보고서 — 심장 여정');
  await pg.goto('http://127.0.0.1:' + port + '/app/ba-report.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => document.querySelectorAll('section.sl').length > 10, null, { timeout: 30000 });
  const R = await pg.evaluate(() => {
    const st = J.heart.st;
    const pays = st.map(s => s.pay.map(p => p.k + ':' + p.m));
    const ph = st.map((s, i) => (PHOTOS['heart_' + i] || []).map(p => p.t));
    const sl = [].slice.call(document.querySelectorAll('section.sl')).map(s => s.innerText.replace(/\s+/g, ' '));
    return { cs: J.heart.case, k: st.map(s => s.k), pays, ph,
      px: (PXLIST.heart || []).map(k => PX[k] && PX[k].t),
      pxSlide: sl.some(t => /협심증은 이렇게 옵니다/.test(t)),
      txSlide: sl.some(t => /혈전을 녹이고/.test(t)) };
  });
  is(/협심증/.test(R.cs) && !/급성심근경색/.test(R.cs), '예시 병 — ' + R.cs);
  is(R.k.length === 5 && /가슴 조임/.test(R.k[0]) && /협심증 확진/.test(R.k[1]) && /스텐트/.test(R.k[2]),
    '다섯 단계 — ' + R.k.join(' → '));
  const conf = R.pays[1] || [];
  is(conf.indexOf('heart:once') >= 0 && conf.indexOf('mi:none') >= 0, '확진 단계 — 허혈성은 열리고 급성심근경색은 안 열림 (' + conf.join(' · ') + ')');
  is(!R.pays.some(a => a.some(x => /^mi:(once|day|month)$/.test(x))), '어느 단계에서도 급성심근경색 진단비가 돈으로 잡히지 않음');
  is(R.px[0] === '협심증은 이렇게 옵니다' && R.pxSlide && !R.txSlide, '시술 이해하기 — 「' + R.px.join('」 → 「') + '」 (혈전 시뮬레이션 장 없음)');
  is(R.ph.every(a => a.length > 0) && R.ph[1].some(t => /좁아진/.test(t)) && !R.ph[0].some(t => /좁아진|구급차/.test(t)),
    '단계마다 사진 ' + R.ph.map(a => a.length).join('·') + ' — 확진 단계에 좁아진 관상동맥');

  console.log('\n[7] 고객 자료가 들어와도');
  const d = encodeURIComponent(JSON.stringify({ n: '김협심', age: 52, sex: '남', b: { mi: 3000 }, a: { mi: 3000, heart: 2000 }, embed: 0 }));
  await pg.goto('about:blank');
  await pg.goto('http://127.0.0.1:' + port + '/app/ba-report.html#d=' + d, { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => document.querySelectorAll('section.sl').length > 10, null, { timeout: 30000 });
  const cs2 = await pg.evaluate(() => J.heart.case);
  is(/^52세 남성 · 협심증/.test(cs2) && !/급성심근경색/.test(cs2), '고객 자료 — ' + cs2);

  console.log('\n[6] 보장 전·후 — 이 병이 오면');
  const src = fs.readFileSync(path.join(ROOT, 'app/ba.html'), 'utf8');
  const hb = src.slice(src.indexOf(" {k:'heart',t:'심장'"), src.indexOf(" {k:'care',t:'간병 · 요양'"));
  const first = (hb.match(/sim:\[\{[^}]*pay:\[([^\]]*)\]/) || [])[1] || '';
  is(first && first.indexOf("'mi'") < 0 && /협심증/.test(hb), '심장 첫 단계 pay — ' + first);
  is(/\{id:'mi',name:'협심증/.test(src), '치료 여정 표 이름 — 협심증 (열쇠 mi 는 그대로)');

  is(!errs.length, '페이지 오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  await br.close(); srv.close();
  console.log(bad ? '\n✗ ' + bad + '개 실패' : '\n✓ 전부 통과');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
