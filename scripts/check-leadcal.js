/* <b>「리더 할일 간소화 · 교육매니저 · 스케줄 달력 · 챗지피티로 가져가기」</b>

   ① TFA 「스케줄 관리」 에 달력이 선다 — 그리고 그 달력은 <b>내 캘린더와
      같은 것</b>이다. 두 벌을 만들면 한쪽에만 약속이 뜬다 (5번).
   ② 달력에 <b>약속</b>(DB 통합 CRM)이 찍힌다 — 여태 고객 365일 쪽만
      있어서 「몇 시에 누구를 만나는지」 가 빠져 있었다.
   ③ 「교육매니저 할 일」 이 있다. 여태 역할 이름만 있고 할 일이 없었다.
      · 모든 줄은 <b>앱에 실제로 있는 화면</b>으로 간다 (없는 화면 금지)
      · 리더 할 일과 <b>id 가 겹치지 않는다</b> — 겹치면 한쪽을 체크할 때
        다른 쪽이 같이 켜진다 (체크는 id 하나로 저장된다)
      · 체크는 교육매니저만, 보기는 누구나
   ④ 챗지피티로 가져가는 글이 <b>앱이 실제로 쓰는 지침</b>이다. 그리고
      <b>열쇠는 빼고</b> 나간다 (10번).                                */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n[1] 스케줄 관리에 달력이 선다 — 내 캘린더와 같은 것');
  const A = await page.evaluate(() => {
    /* 견본 사람은 홍길동 (CLAUDE.md 3번) */
    const t = mcalToday();
    AR.db = [{ id: 'd1', who: 'me', name: '홍길동', name_masked: '홍○동',
               appt: t + 'T14:00:00', region: '강남' }];
    AR.cliRows = [];
    const one = mcalCardHtml({ title: '이번 달 한눈에' });
    const sch = arSchedHtml();
    return { one: one.length, inSched: sch.indexOf('이번 달 한눈에') >= 0,
             grid: (sch.match(/mcal-hd/g) || []).length,
             my: (renderMyCal().match(/mcal-hd/g) || []).length,
             phone: sch.indexOf('폰 기본 달력에 넣기') >= 0 };
  });
  is(A.inSched && A.grid === 1, '  스케줄 관리에 달력이 <b>한 벌</b> 선다');
  is(A.my === 1, '  내 캘린더도 같은 달력을 <b>한 벌</b>만 그린다');
  is(!A.phone, '  스케줄 관리에는 <b>폰 내보내기 칸을 또 붙이지 않는다</b> — 그건 내 캘린더 자리다');

  console.log('\n[2] 약속(DB 통합 CRM)이 달력에 찍힌다');
  const B = await page.evaluate(() => {
    const t = mcalToday();
    AR.db = [{ id: 'd1', who: 'me', name: '홍길동', name_masked: '홍○동',
               appt: t + 'T14:00:00', region: '강남' },
             { id: 'd2', who: 'me', name: '홍길순', name_masked: '홍○순',
               appt: '2000-01-01T09:00:00', region: '' }];
    const it = mcalItems();
    const today = (it[t] || []).filter(x => x.k === 'appt');
    const all = Object.keys(it).reduce((n, k) => n + it[k].filter(x => x.k === 'appt').length, 0);
    return { today: today.length, all, t: today[0] ? today[0].t : '', s: today[0] ? today[0].s : '',
             kind: !!MCAL_KIND.appt };
  });
  is(B.today === 1 && B.kind, '  오늘 약속이 오늘 자리에 찍힌다 — 「' + B.t + ' ' + B.s + '」');
  is(/○/.test(B.t), '  달력에는 <b>가린 이름</b>으로 찍힌다 (3번)');
  is(B.all === 1, '  <b>지나간 약속을 오늘로 끌어오지 않는다</b> — 없는 일정을 만들지 않는다 (1번)');

  console.log('\n[3] 교육매니저 할 일');
  const C = await page.evaluate(() => {
    const ids = [], seen = {}, dup = [];
    ['a','b','c','d'].forEach(k => CK_EDU[k].forEach(r => {
      ids.push(r[0]); if (seen[r[0]]) dup.push(r[0]); seen[r[0]] = 1;
    }));
    const ldr = [];
    ['a','b','c','d','week','month'].forEach(k => (CK_LDR[k]||[]).forEach(r => ldr.push(r[0])));
    const mem = [];
    ['day','week'].forEach(k => (CK_ITEMS[k]||[]).forEach(r => mem.push(r[0])));
    const clash = ids.filter(x => ldr.indexOf(x) >= 0 || mem.indexOf(x) >= 0);
    /* 가리키는 화면이 진짜 있나 */
    const tabs = [];
    TABS.forEach(g => (g.items || []).forEach(x => tabs.push(x.id)));
    const ghost = [];
    ['a','b','c','d'].forEach(k => CK_EDU[k].forEach(r => {
      if (r[4] && tabs.indexOf(r[4]) < 0) ghost.push(r[1] + ' → ' + r[4]);
    }));
    /* 그려지나 · 메뉴에 있나 */
    const html = arEduHtml();
    const inMenu = AR_CAT.filter(c => c[0] === 'edu').length;
    /* arBodyHtml 은 기록을 다 읽기 전에는 「불러오는 중」 을 낸다 —
       길만 보는 자리라 다 읽은 것으로 두고 잰다 */
    const was = GB.loaded; GB.loaded = true;
    const body = arBodyHtml('edu').indexOf('교육매니저 할 일') >= 0;
    GB.loaded = was;
    return { n: ids.length, dup, clash, ghost, inMenu,
             drawn: html.indexOf('교육매니저 할 일') >= 0 && html.indexOf('ar-lk') >= 0,
             body: body };
  });
  is(C.n >= 8 && !C.dup.length, '  할 일이 ' + C.n + '개 · id 가 안 겹친다');
  is(!C.clash.length,
     '  리더·설계사 목록과 <b>id 가 안 부딪힌다</b>' + (C.clash.length ? ' — ' + C.clash.join(',') : ''));
  is(!C.ghost.length,
     '  <b>없는 화면을 가리키지 않는다</b>' + (C.ghost.length ? ' — ' + C.ghost.join(' / ') : ''));
  is(C.inMenu === 1 && C.drawn && C.body, '  왼쪽 메뉴에 한 칸 서고 실제로 그려진다');

  console.log('\n[4] 체크는 교육매니저만 · 보기는 누구나');
  const D = await page.evaluate(() => {
    let said = ''; const rt = window.toast; window.toast = m => { said += m; };
    OS.profile = { id: 'u1', role: 'member' };
    const asMember = arEduHtml();
    arEduTog('day', 'g1');
    const memberChecked = !!ckLoad('day').g1;
    OS.profile = { id: 'u1', role: 'education_manager' };
    const asEdu = arEduHtml();
    arEduTog('day', 'g1');
    const eduChecked = !!ckLoad('day').g1;
    ckToggle('day', 'g1');
    window.toast = rt;
    return { said, memberChecked, eduChecked,
             memberSees: asMember.indexOf('교육매니저 할 일') >= 0,
             memberRo: asMember.indexOf('보기만') >= 0,
             eduRo: asEdu.indexOf('보기만') >= 0 };
  });
  is(!D.memberChecked && /교육매니저만/.test(D.said), '  설계사는 <b>체크가 안 되고</b> 이유를 말한다');
  is(D.eduChecked, '  교육매니저는 <b>체크된다</b>');
  is(D.memberSees && D.memberRo && !D.eduRo, '  설계사도 <b>보이기는 한다</b> — 「보기만」 이라고 적힌다');

  console.log('\n[4-2] 리더 할 일 — 앱이 아는 것은 앱이 답한다');
  const G2 = await page.evaluate(() => {
    const t = arToday();
    /* 견본 사람은 홍길동 (CLAUDE.md 3번) */
    const mk = (id, nm, lastAtt, last) => ({ id, name: nm, role: 'member', team: '',
      raw: {}, sc: { call: 99 }, total: 50, last, lastAtt, days: 9, any: true });
    const was = GB.rows, wasT = GB.team, wasL = GB.loaded;
    GB.loaded = true; GB.team = ''; GB.notes = [];
    OS.profile = { id: 'boss', role: 'leader' };

    /* ① 아직 못 읽었으면 — <b>답한 척하지 않는다</b> */
    GB.rows = [];
    const unknown = arLeadFact('att');

    /* ② 안 찍힌 사람이 있으면 이름을 댄다 */
    GB.rows = [mk('u1', '홍길동', t, t), mk('u2', '홍길순', '2020-01-01', t),
               mk('u3', '홍판서', '2020-01-01', '2020-01-01')];
    const att = arLeadFact('att'), noact = arLeadFact('noact');
    const boxSome = arCkBox('☀️', '아침', '20분', CK_LDR.a, true, 'arLeadTog');

    /* ③ 다 찍혔으면 그 줄은 접힌다 */
    GB.rows = [mk('u1', '홍길동', t, t), mk('u2', '홍길순', t, t)];
    const att0 = arLeadFact('att');
    const boxNone = arCkBox('☀️', '아침', '20분', CK_LDR.a, true, 'arLeadTog');
    const undone = arUndone('day', CK_LDR.a).map(r => r[0]);

    GB.rows = was; GB.team = wasT; GB.loaded = wasL;
    return { unknown, attN: att.who.length, attWho: att.who.join('·'),
             noactN: noact.who.length, att0: att0.who.length,
             someShows: boxSome.indexOf('출근 안 찍힌 2명') >= 0,
             noneFolds: boxNone.indexOf('앱이 확인했습니다') >= 0
                     && boxNone.indexOf('출근 안 찍힌') < 0,
             undone };
  });
  is(G2.unknown === null, '  아직 <b>못 읽었으면 답한 척하지 않는다</b> — 예전처럼 손으로 체크 (1번)');
  is(G2.attN === 2 && /홍길순/.test(G2.attWho),
     '  안 찍힌 사람을 <b>이름으로</b> 댄다 — ' + G2.attN + '명 · ' + G2.attWho);
  is(G2.someShows, '  그 줄에 <b>답이 그대로</b> 뜬다 — 「출근 안 찍힌 2명 — …」');
  is(G2.noactN === 1, '  오늘 기록 없는 사람도 센다 — ' + G2.noactN + '명');
  is(G2.att0 === 0 && G2.noneFolds,
     '  다 찍힌 날은 그 줄이 <b>접히고, 접었다고 말한다</b>');
  is(G2.undone.indexOf('a2') < 0,
     '  접힌 줄은 <b>빨간 숫자에도 안 들어간다</b> — 다 됐는데 숫자가 남으면 숫자를 안 믿는다');

  console.log('\n[4-3] 리더 할 일 — 자리 정리');
  const G3 = await page.evaluate(() => {
    const day = ['a','b','c','d'].reduce((n, k) => n + CK_LDR[k].length, 0);
    const ids = k => (CK_LDR[k] || []).map(r => r[0]);
    return { day, week: ids('week'),
             c: ids('c'), d: ids('d'),
             c3: (CK_LDR.c.find(r => r[0] === 'c3') || [])[1] || '' };
  });
  is(G3.week.indexOf('c4') >= 0 && G3.c.indexOf('c4') < 0,
     '  「금요일 전에 한 번」 인 c4 가 <b>주간으로</b> 갔다');
  is(G3.c.indexOf('c5') < 0 && /먼저 볼 사람/.test(G3.c3),
     '  같은 질문을 두 번 묻던 c5·c3 이 <b>한 줄</b>이 됐다 — 「' + G3.c3 + '」');
  is(G3.day === 13, '  매일 줄이 15 → <b>' + G3.day + '줄</b>');

  console.log('\n[5] 챗지피티로 가져가기');
  const E = await page.evaluate(() => {
    const real = brainKbGet();
    /* 열쇠와 전화번호가 섞인 지식을 일부러 넣어 본다 */
    brainKbSet('내 상담 원칙.\n키 sk-abcdefghijklmnop1234567890\n홍길동 010-1234-5678');
    const t = bgptText();
    const risk = bgptRisk(t);
    const card = bgptCardHtml();
    brainKbSet(real);
    const clean = bgptText();
    return { has: t.indexOf('내 상담 원칙') >= 0,
             key: /sk-abcdefghijklmnop/.test(t),
             masked: t.indexOf('열쇠는 빼고 내보냈습니다') >= 0,
             risk: risk.join(' · '),
             warn: card.indexOf('그 회사 서버로 나갑니다') >= 0,
             same: clean.indexOf(brainSys().slice(0, 120)) >= 0,
             btn: card.indexOf('bgptCopy()') >= 0 && card.indexOf('bgptSave()') >= 0 };
  });
  is(E.has, '  두뇌에 넣어 둔 지식이 <b>함께 나간다</b>');
  is(!E.key && E.masked, '  <b>열쇠는 빼고</b> 나간다 (10번)');
  is(/전화번호처럼/.test(E.risk), '  전화번호가 섞였으면 <b>말해 준다</b> — 「' + E.risk + '」');
  is(E.warn, '  <b>붙여 넣으면 밖으로 나간다</b>고 적는다');
  is(E.same, '  앱이 실제로 쓰는 지침 <b>그대로</b>다 — 따로 짓지 않는다 (5번)');
  is(E.btn, '  복사·파일 저장 단추가 있다');

  console.log('\n[6] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 어긋납니다')
                  : '✓ 달력 한 벌 · 약속까지 · 교육매니저 할 일 · 지침 내보내기 다 섭니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
