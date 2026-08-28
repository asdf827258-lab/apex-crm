/* <b>팀이 두 곳에 적혀 있었다 — 조직도와 설정.</b>

   사장님 말씀 그대로입니다 — 「조직도 반영, 아까 설정에 있는 부분으로
   해달라고 했는데 된거니?」

   재 보니 <b>안 됐습니다.</b> 성장판·TFA 가 팀을 읽는 자리는 설정의
   <b>팀원 권한 관리</b>(team_members) 하나뿐이었고, <b>조직도</b>
   (org_members.team)는 아예 안 봤습니다.

   그래서 조직도에 「건우TEAM」 이라 적어 두셔도 그 사람은 화면에
   <b>「소속 없음」</b> 으로 떴고, 설정에서 <b>한 번 더</b> 지정하셔야
   했습니다. 같은 것을 두 곳에 적으시게 만든 자리입니다.

   고친 방식 — <b>설정이 이깁니다.</b>

     · 설정에서 지정하신 사람은 <b>그대로</b> 둔다 (손으로 맞춰 두신 것을
       뒤집지 않는다)
     · 지정 <b>안 된 사람만</b> 조직도의 팀으로 메운다
     · 조직도에 적힌 팀 이름이 설정에 <b>없으면 팀을 만들지 않는다</b>
       (CLAUDE.md 1번) — 대신 그 이름을 그대로 대 준다
     · 메운 것을 <b>말한다</b> — 조용히 메우면 어디서 온 소속인지 모르신다
     · 이름은 <b>띄어쓰기·대소문자를 털고</b> 견준다 — 조직도에 「건우 TEAM」,
       설정에 「건우TEAM」 처럼 적히는 일이 흔하다

   여기서 확인합니다.
     1. 설정에서 지정한 사람은 <b>안 뒤집히는가</b>
     2. 지정 안 된 사람이 <b>조직도 팀으로 메워지는가</b> · 띄어쓰기·대소문자
     3. 설정에 없는 팀을 <b>안 지어내는가</b> · 그 이름을 대 주는가
     4. 계정이 안 이어진 조직도 줄에 <b>안 붙이는가</b>
     5. 서버가 조직도를 못 줘도 <b>조용히 넘어가는가</b>
     6. 화면이 <b>무엇을 어디서 가져왔는지</b> 말하는가 · 안 쓰면 조용한가
     7. gbLoad 가 실제로 조직도를 <b>읽는가</b> (안 읽으면 위 전부가 죽은 판) */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 180)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  const R = await page.evaluate(() => {
    const O = {};
    /* 견본 이름은 홍길동 — 실제 팀원 이름은 쓰지 않는다 (CLAUDE.md 3번) */
    const ORG = { data: [
      { member_id: 'm1', name: '홍길동1', team: '건우TEAM' },   /* 설정이 이겨야 한다 */
      { member_id: 'm2', name: '홍길동2', team: '건우 TEAM' },  /* 띄어쓰기만 다름 */
      { member_id: 'm3', name: '홍길동3', team: '세빈team' },   /* 대소문자만 다름 */
      { member_id: 'm4', name: '홍길동4', team: '없는TEAM' },   /* 설정에 없는 팀 */
      { member_id: 'm5', name: '홍길동5', team: '' },           /* 조직도에도 없음 */
      { member_id: null, name: '홍길동6', team: '건우TEAM' }    /* 계정이 안 이어짐 */
    ] };
    const setup = () => {
      GB.teams = [{ id: 't1', name: '건우TEAM' }, { id: 't2', name: '세빈TEAM' }];
      GB.teamOf = { m1: 't2' };
    };
    setup(); gbOrgFill(ORG);
    O.map = Object.assign({}, GB.teamOf);
    O.fill = GB.orgFill; O.noTeam = GB.orgNoTeam.slice();

    /* 서버가 조직도를 못 줄 때 */
    setup(); gbOrgFill({ error: { message: 'org_members 없음' } });
    O.errKeep = Object.keys(GB.teamOf).length; O.errFill = GB.orgFill;
    setup(); gbOrgFill(null);
    O.nullKeep = Object.keys(GB.teamOf).length;

    /* 화면이 말하는가 */
    setup(); gbOrgFill(ORG);
    GB.rows = [{ id: 'm1', team: 't2' }, { id: 'm2', team: 't1' }, { id: 'm5', team: '' }];
    const h = gbTeamBarHtml('gbTeam');
    O.saysFill = /조직도<\/b>에 적힌 팀으로 채웠습니다/.test(h);
    O.saysN = /<b>2명<\/b>/.test(h);
    O.saysWin = /그쪽이 이깁니다/.test(h);
    O.saysNoTeam = /설정에 그 이름의 팀이 없습니다/.test(h) && /없는TEAM/.test(h);
    O.saysNoMake = /없는 팀을 만들지는 않았습니다/.test(h);
    /* 안 썼으면 조용 */
    GB.orgFill = 0; GB.orgNoTeam = [];
    O.quiet = !/조직도/.test(gbTeamBarHtml('gbTeam'));

    /* ── 감싸였나 ────────────────────────────────────────────────
       String(gbLoad) 로 <b>돌고 있는 함수 본문</b>을 읽었더니, 다른 화면
       (교재 다리)이 window.gbLoad 를 <b>감싸는</b> 순간 그 겉껍질이 잡혀
       「조직도를 안 읽는다」로 잘못 답했다. 앱은 멀쩡한데 점검만 빨간불이
       켜졌다 — 헛알람이다 (CLAUDE.md 8번).

       그래서 <b>읽는 자리는 파일 글에서</b> 본다(아래 [7]). 여기서는 대신
       <b>감싼 쪽이 원본을 부르는지</b>만 본다 — 안 부르면 그때는 진짜로
       죽은 판이고, 조직도가 통째로 반영이 안 된다 (5번). */
    const src = String(gbLoad);
    /* 지금 돌고 있는 gbLoad 가 <b>진짜 그것</b>인가. 아니면 누가 감싼 것이다.
       (감싼 흔적을 찾으면 안 된다 — 흔적을 지우면 그대로 빠져나간다.) */
    O.isReal = /orgSelect/.test(src);
    O.callsThrough = O.isReal || /orig\s*\.\s*(apply|call)\s*\(|orig\s*\(/.test(src);
    return O;
  });

  console.log('\n[1] 설정에서 지정한 사람은 안 뒤집힌다');
  is(R.map.m1 === 't2',
     '  설정 <b>세빈TEAM</b> · 조직도 건우TEAM → <b>' + R.map.m1 + '(세빈)</b> ' +
     '(손으로 맞춰 두신 것이 이긴다)');

  console.log('\n[2] 지정 안 된 사람은 조직도 팀으로 메운다');
  is(R.map.m2 === 't1', '  조직도 「건우 TEAM」 — <b>띄어쓰기</b>가 달라도 메운다 · ' + (R.map.m2 || '(없음)'));
  is(R.map.m3 === 't2', '  조직도 「세빈team」 — <b>대소문자</b>가 달라도 메운다 · ' + (R.map.m3 || '(없음)'));
  is(R.fill === 2, '  메운 사람이 <b>' + R.fill + '명</b>이다');

  console.log('\n[3] 설정에 없는 팀은 안 지어낸다');
  is(!R.map.m4, '  조직도 「없는TEAM」 — <b>팀을 만들지 않는다</b> · ' + (R.map.m4 || '(안 붙임)'));
  is(R.noTeam.length === 1 && R.noTeam[0] === '없는TEAM',
     '  그 <b>이름을 그대로 적어 둔다</b> — ' + (R.noTeam.join(' · ') || '(없음)') +
     ' (뭉뚱그리면 어느 팀을 만들어야 하는지 모르신다)');
  is(!R.map.m5, '  조직도에도 팀이 없으면 <b>그대로 소속 없음</b>');

  console.log('\n[4] 계정이 안 이어진 줄에는 안 붙인다');
  is(!R.map.m6 && Object.keys(R.map).length === 3,
     '  member_id 가 없는 조직도 줄은 <b>건너뛴다</b> — 붙일 데가 없다 · ' +
     '붙은 사람 ' + Object.keys(R.map).length + '명');

  console.log('\n[5] 서버가 조직도를 못 줘도 조용히 넘어간다');
  is(R.errKeep === 1 && R.errFill === 0,
     '  <b>오류가 와도</b> 설정 지정은 그대로 두고 아무것도 안 메운다');
  is(R.nullKeep === 1, '  <b>아무것도 안 와도</b> 안 터진다');

  console.log('\n[6] 화면이 무엇을 어디서 가져왔는지 말한다');
  is(R.saysFill && R.saysN,
     '  <b>「2명은 조직도에 적힌 팀으로 채웠습니다」</b> — 조용히 메우지 않는다');
  is(R.saysWin, '  <b>설정에서 지정하면 그쪽이 이긴다</b>고 알려 준다');
  is(R.saysNoTeam, '  설정에 없는 팀은 <b>그 이름을 대고</b> 말한다');
  is(R.saysNoMake, '  <b>없는 팀을 만들지 않았다</b>고 밝힌다 (CLAUDE.md 1번)');
  is(R.quiet, '  조직도에서 안 가져왔으면 <b>아무 말도 안 한다</b> — 헛알람이 없다');

  console.log('\n[7] 읽는 자리가 실제로 있다');
  /* <b>파일 글</b>에서 본다. 돌고 있는 함수 본문을 읽으면, 누가 gbLoad 를
     감싸는 순간 그 겉껍질이 잡혀 「안 읽는다」로 잘못 답한다 — 실제로 교재
     다리가 감싸면서 그렇게 됐다. 앱은 멀쩡한데 점검만 울면 사람이 점검을
     안 믿게 된다 (CLAUDE.md 8번). */
  const APP = fs.readFileSync('app/index.html', 'utf8');
  const at = APP.indexOf('function gbLoad(');
  const gbSrc = at < 0 ? '' : APP.slice(at, APP.indexOf('\nfunction ', at + 1));
  is(!!gbSrc, '  gbLoad 를 파일에서 찾았다');
  const idx = (gbSrc.match(/gbOrgFill\(\s*r\[(\d+)\]\s*\)/) || [])[1];
  is(/orgSelect\s*\(\s*sb\s*\)/.test(gbSrc) && idx !== undefined,
     '  gbLoad 가 <b>조직도를 읽어</b> gbOrgFill 에 넘긴다 — 안 읽으면 위 전부가 죽은 판이다');
  /* 번호를 못 박으면 앞에 표가 하나 끼는 순간 <b>엉뚱한 것</b>을 조직도로 읽는다.
     그래서 번호 자체가 아니라 <b>맨 끝인지</b>를 본다. */
  const n = (gbSrc.match(/\n    q\(sb\.from|\n    \(typeof orgSelect/g) || []).length;
  is(idx !== undefined && Number(idx) === n - 1,
     '  조직도를 <b>맨 끝</b>에서 읽는다 — r[' + idx + '] · 모두 ' + n + '개 ' +
     '(앞에 표가 끼면 위에서 r[3]·r[4] 로 세어 쓰는 자리가 통째로 어긋난다)');
  is((gbSrc.match(/from\('org_members'\)/g) || []).length === 0,
     '  읽는 자리를 <b>새로 만들지 않았다</b> — 조직도가 쓰던 orgSelect 하나를 쓴다 (5번)');
  is(R.callsThrough,
     '  누가 gbLoad 를 <b>감쌌다면 원본을 그대로 부른다</b> — 안 부르면 조직도가 통째로 죽은 판이다' +
     (R.isReal ? '' : ' (지금 감싸져 있습니다)'));

  console.log('\n[8] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 조직도에 적어도 소속 없음으로 뜹니다')
                  : '✓ 조직도가 반영되고 · 설정이 이기고 · 없는 팀은 안 지어냅니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
