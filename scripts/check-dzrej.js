/* 🛡 <b>질병 보험가이드 — 거절이 나오면</b> (2026-10-11 사장님 말씀 「질병 보험가이드에도 거절 대응 넣어줘」)

   못 박는 것 —
     ① 질병 화면마다 「거절이 나오면」 칸이 선다 (질병 40개 전부)
     ② 그 병의 반론(talk.obj)이 <b>그 칸에</b> 나오고, 「어떻게 말합니까」 칸에는 또 안 나온다
        — 한 화면에 같은 말이 두 번 서면 고칠 때 한쪽만 고쳐집니다 (5번)
     ③ 공통 거절(D.rej.all)에 {병} 자리가 그 병 이름으로 채워진다 — 「{병}」 글자가 남지 않는다
     ④ 공통 거절마다 하지 말 말 · 멈출 자리가 같이 선다 — 무엇을 말할지만 적고 멈출 곳을 안 적으면
        붙잡다 그 고객을 영영 잃습니다
     ⑤ 공통 거절 글에 숫자가 없다 — 확인한 출처 없는 수를 적지 않습니다 (1번·2번)
     ⑥ 가입 이야기를 하는 줄은 「심사 결과에 따릅니다」 를 단다 (2번)
     ⑦ 모아 보기(🛡 거절 대응)가 서고, 주소 #rej 로도 열리고, 검색칸으로 걸러진다
     ⑧ 거절 근육 훈련으로 가는 길이 실제 파일을 가리킨다
     ⑨ 전부 인쇄에도 그 칸이 들어간다 (같은 함수)                                   */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9141;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const PAGE = fs.readFileSync(path.join(ROOT, 'app/재무설계/질병보험가이드.html'), 'utf8');
global.window = global; require(path.join(ROOT, 'app/질병가이드-data.js'));
const D = global.DZ_DATA;

console.log('\n[1] 자료');
const R = (D && D.rej) || {};
is((R.all || []).length >= 5, '공통 거절이 적혀 있다 (' + (R.all || []).length + '가지)');
is((R.mind || []).length >= 1, '마음가짐 줄이 있다');
const plain = s => String(s || '').replace(/<[^>]+>/g, '');
const allText = (R.all || []).map(o => [o.q, o.say, o.next, o.avoid, o.stop].map(plain).join(' ')).join(' ');
is(!/[0-9０-９]/.test(allText), '공통 거절 글에 숫자가 하나도 없다 (1번·2번)');
is((R.all || []).every(o => o.say && o.avoid && o.stop), '공통 거절마다 대답 · 하지 말 말 · 멈출 자리가 다 있다');
const joinUp = (R.all || []).filter(o => /가입/.test(plain(o.say + o.next)));
is(joinUp.every(o => /심사 결과에 따릅니다/.test(plain(o.say + o.next))), '가입 이야기를 하는 줄은 「심사 결과에 따릅니다」 를 단다 (' + joinUp.length + '줄)');
is((R.all || []).some(o => /\{병\}/.test(o.say)), '공통 대답이 {병} 자리로 그 병을 가리킨다');

console.log('\n[2] 화면 코드');
is(/function rejHtml\(d\)/.test(PAGE) && /h \+= rejHtml\(d\);/.test(PAGE), '질병 몸통(detailBody)이 rejHtml 을 부른다');
is(/rej:\s*function\(\)\{ rejAll\(\); \}/.test(PAGE), '길잡이 표(GOTO)에 rej 가 있다 — 주소 #rej · 앱에서 넘어오는 길');
is(/onclick="rejAll\(\)"/.test(PAGE), '위 띠에 🛡 거절 대응 단추가 있다');
const gymHref = (PAGE.match(/href="(\.\.\/reject-gym\.html)[^"]*"/) || [])[1];
is(!!gymHref && fs.existsSync(path.join(ROOT, 'app', 'reject-gym.html')), '거절 근육 훈련으로 가는 길이 실제 파일을 가리킨다');

const srv = http.createServer((q, s) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end(''); return; }
  s.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(s);
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.fulfill({ status: 200, body: '' }));
    const U = 'http://127.0.0.1:' + PORT + '/app/' + encodeURIComponent('재무설계') + '/' + encodeURIComponent('질병보험가이드') + '.html';
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(600);

    console.log('\n[3] 질병 화면마다');
    const res = await p.evaluate(() => D.list.map(d => {
      open_(d.id);
      const pane = document.getElementById('detailPane');
      const secs = [].slice.call(pane.querySelectorAll('.sec'));
      const rej = secs.find(s => /거절이 나오면/.test((s.querySelector('h3') || {}).textContent || ''));
      const talk = secs.find(s => /어떻게 말합니까/.test((s.querySelector('h3') || {}).textContent || ''));
      const own = (d.talk.obj || []).map(o => o[0]);
      return {
        id: d.id,
        hasRej: !!rej,
        ownInRej: !!rej && own.every(q => rej.textContent.indexOf(q) >= 0),
        ownInTalk: !!talk && own.some(q => talk.textContent.indexOf(q) >= 0),
        leftover: !!rej && /\{병\}/.test(rej.textContent),
        nameIn: !!rej && rej.textContent.indexOf(d.name) >= 0,
        stops: rej ? rej.querySelectorAll('.rj-stop').length : 0,
        avoids: rej ? rej.querySelectorAll('.rj-avoid').length : 0
      };
    }));
    const nAll = (R.all || []).length;
    const miss = k => res.filter(r => !r[k]).map(r => r.id);
    is(res.length === D.list.length && miss('hasRej').length === 0, '질병 ' + res.length + '개 모두 「거절이 나오면」 칸이 선다' + (miss('hasRej').length ? ' ← ' + miss('hasRej').join(',') : ''));
    is(miss('ownInRej').length === 0, '그 병의 반론이 전부 그 칸에 나온다' + (miss('ownInRej').length ? ' ← ' + miss('ownInRej').join(',') : ''));
    const dup = res.filter(r => r.ownInTalk).map(r => r.id);
    is(dup.length === 0, '「어떻게 말합니까」 칸에는 반론이 또 안 나온다 — 한 화면에 두 번 서지 않는다' + (dup.length ? ' ← ' + dup.join(',') : ''));
    const left = res.filter(r => r.leftover).map(r => r.id);
    is(left.length === 0, '「{병}」 글자가 화면에 남지 않는다' + (left.length ? ' ← ' + left.join(',') : ''));
    is(miss('nameIn').length === 0, '공통 대답에 그 병 이름이 들어간다');
    is(res.every(r => r.stops === nAll && r.avoids === nAll), '공통 거절마다 하지 말 말 · 멈출 자리가 화면에 선다 (' + nAll + '가지)');

    console.log('\n[4] 모아 보기');
    await p.evaluate(() => { document.getElementById('q').value = ''; rejAll(); });
    const all = await p.evaluate(() => ({ t: document.getElementById('detailPane').textContent, n: document.querySelectorAll('#detailPane .rj-dz').length, h: location.hash }));
    const withObj = D.list.filter(d => (d.talk.obj || []).length).length;
    is(/거절 대응 — 한 화면에/.test(all.t) && all.n === withObj, '🛡 거절 대응 화면에 반론이 있는 질병 ' + withObj + '개가 다 선다 (' + all.n + ')');
    is(all.h === '#rej', '모아 보기 주소가 #rej 다');
    await p.evaluate(() => { document.getElementById('q').value = '실손'; rejAll(); });
    const f = await p.evaluate(() => [].slice.call(document.querySelectorAll('#detailPane .rj-dz .oq')).map(e => e.textContent + ' ' + e.nextSibling.textContent));
    is(f.length > 0 && f.every(t => /실손/.test(t)), '검색칸 글자로 걸러진다 (「실손」 → ' + f.length + '줄)');
    await p.goto(U + '#rej', { waitUntil: 'load' }); await p.waitForTimeout(500);
    is(/거절 대응 — 한 화면에/.test(await p.textContent('#detailPane')), '주소 #rej 로 바로 열린다');

    console.log('\n[5] 전부 인쇄');
    await p.evaluate(() => printAll()); await p.waitForTimeout(300);
    const pr = await p.evaluate(() => document.querySelectorAll('#detailPane .rj-mind').length);
    is(pr === D.list.length, '전부 펼쳐 인쇄에도 질병마다 그 칸이 들어간다 (' + pr + ')');

    is(errs.length === 0, '스크립트 오류 0' + (errs.length ? ' ← ' + errs.slice(0, 3).join(' | ') : ''));
  } finally { await b.close(); srv.close(); }
  console.log(bad ? '\n✗ 질병 보험가이드 거절 대응 — 고칠 자리 ' + bad + '곳' : '\n✓ 질병 보험가이드 거절 대응 — 모두 통과');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
