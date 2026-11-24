/* 📣 직업 설명회 한 장 (판 X534)

   사장님 말씀 2026-11-24 「고객에게도 제공해도 괜찮을 정보들이 같이 들어
   있어서 / 직업 설명회 에서는 신당풀이, 아이스브레이킹, 영업가능성, 인생운,
   고민상담 정도로 이야기 하면 좋을 것 같다 / 디테일하게 한장으로 쭉 풀어줘」.
   그리고 두 가지를 더 정하셨습니다 —
     · 「사장님이 띄워 놓고 함께」 본다 → <b>후보 손에 쥐어 주는 장이 아니다</b>
     · 영업 가능성은 <b>총점·등급을 빼고 다섯 축만</b>

   ⚠ 여기가 위험한 까닭. 이 장은 <b>설계사 화면에서 그리는데 후보가 같이
     봅니다.</b> 그래서 각 장 안에 섞여 있는 「🔒 내 눈」 화법 대본과 리더용
     이탈 위험이 한 줄이라도 새면, 그 자리에서 후보가 자기 평가표를 읽습니다.
     총점·등급도 같습니다 — 숫자 하나가 합격·불합격으로 읽힙니다.
     눈으로는 못 봅니다(열 장 넘게 스크롤입니다). 그래서 기계가 봅니다 (8번).

   ★ 그리고 <b>베끼지 않았는지</b>도 봅니다. 다섯 꼭지를 글로 옮겨 적어 두면
     본 장을 고쳐도 설명회 장은 안 고쳐져, 한 화면이 같은 물음에 두 답을
     냅니다 (5번 · 0-1번).                                                   */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = 8966, ROOT = path.join(process.cwd(), 'app');
const bad = [], ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) bad.push(m); };

const srv = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/saju-mbti.html';
  try { s.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        s.end(fs.readFileSync(path.join(ROOT, p))); } catch (e) { s.writeHead(404); s.end(''); }
}).listen(PORT);

/* 설명회에서 띄우는 다섯 꼭지 — 사장님이 이름으로 말씀하신 그대로 */
const WANT = ['신당 풀이', '아이스브레이킹', '이 일과 어떻게 맞물리나', '인생 운', '고민 상담'];

(async () => {
  const SRC = fs.readFileSync('app/saju-mbti.html', 'utf8');

  console.log('\n[1] ★ 글을 <b>베끼지 않았다</b> — 다섯 장을 그대로 부른다 (5번)');
  const body = (SRC.match(/function tabShow\(\)\{[\s\S]*?\n\}/) || [''])[0];
  ok(body.length > 0, 'tabShow 가 있다');
  ['tabDang()', 'tabIce()', 'tabLife()', 'tabWorry()', 'tabSales({show:true})'].forEach(f =>
    ok(body.indexOf(f) >= 0, '<b>' + f + '</b> 를 불러 쓴다 — 글을 옮겨 적지 않았다'));
  /* ★★ 그리는 동안 고객 화면으로 바꿔 두는 그 한 줄. 이것이 「🔒 내 눈」 을 막는
     유일한 자이므로, 글자로도 한 번 봅니다 — 지워지면 [4] 가 울지만 왜 울었는지
     여기서 바로 읽힙니다. */
  ok(/S\.view\s*=\s*'client'/.test(body), "★★ 그리는 동안 <b>S.view='client'</b> 로 둔다 — 「🔒 내 눈」 이 저절로 빠진다");
  ok(/finally\s*\{[^}]*S\.view\s*=\s*keepV/.test(body), '★ finally 로 <b>반드시 되돌린다</b> — 중간에 터져도 설계사 화면이 고객 화면으로 남지 않는다');

  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 900, height: 1150 } });
  let outside = 0;
  await ctx.route('**://**', r =>
    r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : (outside++, r.abort()));
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(1200);

  const seed = () => pg.evaluate(() => {
    S.mode = 'saju'; S.view = 'agent';
    S.cl = { name: '홍길동', gender: 'M', mbti: '', y: '1983', m: '7', d: '22',
             H: 14, Mi: 0, noTime: false, adj: false, saju: null, res: null };
    calcPerson(S.cl); S.step = 'board'; S.tab = 'show'; draw();
  });

  console.log('\n[2] 탭이 <b>설계사 화면에만</b> 선다');
  const t = await pg.evaluate(() => {
    S.mode = 'saju';
    S.cl = { name: '홍길동', gender: 'M', mbti: '', y: '1983', m: '7', d: '22',
             H: 14, Mi: 0, noTime: false, adj: false, saju: null, res: null };
    calcPerson(S.cl);
    return { ag: tabsFor('saju', 'agent'), cl: tabsFor('saju', 'client'),
             blood: tabsFor('blood', 'agent'), nm: TAB_NAME['show'] || '' };
  });
  ok(t.ag.indexOf('show') >= 0, '설계사 화면 탭에 <b>있다</b> — ' + t.ag.join(' '));
  ok(t.cl.indexOf('show') < 0, '★★ 고객 화면 탭에는 <b>없다</b> (AGENT_TABS 가 막는다) — ' + t.cl.join(' '));
  ok(t.blood.indexOf('show') < 0, '★ 혈액형만 받은 갈래에는 <b>안 선다</b> — 신당 풀이가 못 서는 자리다 (1번)');
  ok(/설명회/.test(t.nm), '탭 이름이 <b>설명회</b>라고 말한다 — ' + t.nm);
  /* ★★ 목록에 없는 것만으로는 모자랍니다. 손님이 주소나 콘솔로 <b>억지로</b>
     그 탭을 세워 보는 자리가 실제로 있습니다 — 그때도 안 열려야 합니다. */
  const force = await pg.evaluate(() => {
    const keep = S.view;
    /* ⚠ 결과 화면(board)에 서 있어야 draw 가 탭을 추립니다. 처음엔 이 줄이
       없어 걸음이 board 가 아니었고, 그래서 <b>좋은 판에서도 빨간불</b>이
       떴습니다 — 헛것을 잡는 자가 될 뻔했습니다 (8번). */
    S.step = 'board';
    setView('client'); S.tab = 'show'; draw();
    const r = { tab: S.tab, txt: document.querySelector('#view').innerText.slice(0, 400) };
    setView(keep); return r;
  });
  ok(force.tab !== 'show', '★★ 고객 화면에서 <b>억지로 세워도</b> 딴 탭으로 돌아간다 — ' + force.tab);
  ok(!/한 장으로 쭉/.test(force.txt), '★★ 설명회 장의 글이 <b>한 줄도 안 그려진다</b>');

  console.log('\n[3] 다섯 꼭지가 <b>전부</b> 한 줄로 선다 (사장님 말씀 그대로)');
  await seed(); await pg.waitForTimeout(400);
  const secs = await pg.evaluate(() =>
    [].slice.call(document.querySelectorAll('#view .shw-h h2')).map(e => e.innerText.replace(/\s+/g, ' ').trim()));
  ok(secs.length === 5, '꼭지가 <b>다섯</b>이다 — ' + secs.length + '개');
  WANT.forEach(w => ok(secs.some(x => x.indexOf(w) >= 0), '「' + w + '」 이 선다'));
  const grew = await pg.evaluate(() => document.querySelector('#view').innerText.length);
  ok(grew > 8000, '★ 「디테일하게 쭉」 — 한 장이 <b>' + grew + '자</b>다 (요약이 아니다)');

  console.log('\n[4] ★★ <b>평가표가 아니다</b> — 총점·등급이 안 찍힌다 (사장님 결정 2026-11-24)');
  const sal = await pg.evaluate(() => {
    const sc = salesCalc(S.cl);
    return { show: tabSales({ show: true }), full: tabSales(),
             total: String(sc.total), grade: sc.level.t };
  });
  ok(sal.full.indexOf('class="score"') >= 0,
    '본 장(영업 가능성)에는 총점 칸이 <b>그대로 있다</b> — 뺀 것은 설명회 장뿐이다');
  ok(sal.show.indexOf('class="score"') < 0, '★★ 설명회 꼴에는 총점 칸이 <b>없다</b>');
  ok(sal.show.indexOf(sal.grade) < 0, '★★ 등급(' + sal.grade + ')이 <b>안 찍힌다</b>');
  /* ⚠ 「총점 숫자가 안 보인다」 는 <b>안 잽니다.</b> 총점은 다섯 축의 평균이라
     축 값 하나와 같은 수가 나올 때가 있습니다 — 그걸 총점이 샌 것으로 세면
     헛것을 잡는 자가 됩니다 (8번). 총점은 <b>칸(class="score")</b> 으로 셉니다. */
  ok(sal.show.indexOf('다섯 축') >= 0 && sal.show.indexOf('채널') >= 0,
    '★ 그래도 <b>다섯 축과 채널은 그대로</b> 나온다 — 뺀 것은 가르는 숫자뿐이다');
  /* 그려 놓은 화면에서도 한 번 더 — 함수만 보고 넘기면 머리 카드에서 샐 수 있습니다 */
  const pageTxt = await pg.evaluate(() => {
    const v = document.querySelector('#view'), c = [].slice.call(v.children);
    c.shift();                               /* 내가 적은 머리 카드는 「총점을 뺐다」고 말한다 */
    return c.map(x => x.innerText).join('\n');
  });
  ok(pageTxt.indexOf('등급') < 0 && pageTxt.indexOf('총점') < 0,
    '★★ 그려진 화면에도 <b>총점·등급이라는 말이 없다</b>');

  console.log('\n[5] ★★ 「🔒 내 눈」 이 <b>한 줄도 안 샌다</b> — 후보와 같이 보는 장이다');
  ok(pageTxt.indexOf('🔒') < 0, '★★ 자물쇠(🔒)가 <b>없다</b>');
  ok(pageTxt.indexOf('리더') < 0, '★★ 「리더용 이탈 위험」 이 <b>안 뜬다</b>');
  ok(pageTxt.indexOf('설계사 전용') < 0, '★ 「설계사 전용입니다」 안내가 <b>안 뜬다</b> (영업 가능성이 제대로 열렸다)');
  const after = await pg.evaluate(() => ({ view: S.view, tab: S.tab }));
  ok(after.view === 'agent', '★★ 그린 뒤 <b>설계사 화면으로 되돌아왔다</b> — ' + after.view);
  ok(after.tab === 'show', '탭도 그대로다 — ' + after.tab);

  console.log('\n[6] 꼬리글·인쇄 단추가 <b>한 벌만</b> (다섯 번 찍히지 않는다)');
  const dup = await pg.evaluate(() => {
    const vis = e => e.offsetParent !== null || getComputedStyle(e).display !== 'none';
    const v = document.querySelector('#view');
    return { foot: [].slice.call(v.querySelectorAll('.foot')).filter(vis).length,
             pr: [].slice.call(v.querySelectorAll('button')).filter(b =>
                   /인쇄/.test(b.innerText) && vis(b)).length };
  });
  ok(dup.foot === 1, '꼬리글이 <b>하나</b>다 — ' + dup.foot + '개');
  ok(dup.pr === 1, '인쇄 단추가 <b>하나</b>다 — ' + dup.pr + '개');

  console.log('\n[7] ★ 인쇄하면 <b>다섯 꼭지가 전부</b> 나온다 (4-1번)');
  /* 사장님이 「한 번에 인쇄」 를 이미 한 번 시키셨던 자리입니다. 설명회 장은
     쪽수가 많아, 꼭지 하나가 통째로 빠져도 화면에서는 안 보입니다. */
  const out = path.join(require('os').tmpdir(), 'showone-' + process.pid + '.pdf');
  await pg.emulateMedia({ media: 'print' });
  await pg.pdf({ path: out, format: 'A4', printBackground: true });
  await pg.emulateMedia({ media: 'screen' });
  const raw = fs.readFileSync(out, 'latin1');
  const pages = (raw.match(/\/Type\s*\/Page[^s]/g) || []).length;
  ok(pages >= 5, '쪽이 <b>' + pages + '쪽</b> 나온다 — 꼭지마다 새 쪽에서 시작한다');
  let txt = null;
  try { txt = require('child_process').execFileSync('pdftotext', [out, '-'], { encoding: 'utf8' }); } catch (e) { }
  if (txt === null) console.log('     (pdftotext 가 없어 다시 읽기는 건너뜁니다 — 없는 것을 있다고 하지 않습니다)');
  else {
    const flat = txt.replace(/\s/g, '');
    WANT.forEach(w => ok(flat.indexOf(w.replace(/\s/g, '')) >= 0, '인쇄에 「' + w + '」 이 <b>있다</b>'));
    ok(flat.indexOf('리더용') < 0 && txt.indexOf('🔒') < 0, '★★ 인쇄에도 「🔒 내 눈」 이 <b>안 샌다</b>');
    ok(flat.indexOf('등급') < 0, '★★ 인쇄에도 <b>등급이 없다</b>');
  }
  try { fs.unlinkSync(out); } catch (e) { }

  console.log('\n[8] 조용히 터지지 않았다');
  ok(errs.length === 0, '콘솔 오류 0 — ' + (errs.join(' / ') || '없음'));
  ok(outside === 0, '바깥을 안 부른다 (7번) — ' + outside + '건');

  await br.close(); srv.close();
  console.log(bad.length ? '\n✗ ' + bad.length + '가지\n' : '\n✓ 설명회 한 장 — 모두 통과\n');
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
