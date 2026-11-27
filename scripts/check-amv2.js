/* ═══════════════════════════════════════════════════════════════
   check-amv2.js — ☀️ <b>팀 아침 점검 · 지점장 체크리스트</b>가 지어내지 않고 있던 칸만 쓰나 (판 X589)

   사장님 말씀 (2026-11-27) 「팀원들 아침 관리와 체크리스트 정리 하고 싶어」.

   ── 보는 것 (브라우저 없이) ──────────────────────────────────────
     [1] ★★ 싣기 — index.html 에 am-v2.js 한 줄(team-v2.js 바로 뒤) · 여는 단추는 새 오늘 화면 · 팀 한눈에만
     [2] ★★ 지점장 · 대표만 — hwhoCan 이 아니면 시트를 안 엶
     [3] ★★ 팀원 한 줄 — 출근 = 성장판 출근(lastAtt) · 미션 네 칸 = 그날 체크판(GB.ckIt) · 약속 = 배정 줄(AR.db) · 전화 = 팀 한눈에 그대로 · 못 읽으면 「…」
     [4] ★★ 줄 차례 — 출근 전 → 미션 적은 분 · 칸(출근 전 · 미션 안 연 분 · 약속 · 활동 0)을 누르면 그 사람만
     [5] ★★ 카톡 문구 — 팀원 이름만(고객 이름 없음) · 복사만(있던 copyText) · 보내지 않음
     [6] ★★ 지점장 체크리스트 — 실행 체크판 지점장 표(CK_LDR a · b · c · d) 그대로 · ✓ 는 있던 ckToggle('day', id) · 칸 옆 숫자는 ①과 gbMiss
     [7] ★★ 서버에 묻지도 쓰지도 않음 · 이 기기에도 안 담음 · 13px 밑 글씨 없음
   ═══════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const AM = fs.readFileSync(path.join(ROOT, 'app/am-v2.js'), 'utf8');
const IX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const HV = fs.readFileSync(path.join(ROOT, 'app/home-v2.js'), 'utf8');
const TM = fs.readFileSync(path.join(ROOT, 'app/team-v2.js'), 'utf8');
const 걷기 = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TD = '2026-11-27';
const LDR = {
  a: [['a3', '어제 못 끝낸 도와줄 것 먼저', '달력에서 빨간 날을 봅니다', '', ''], ['a2', '출근 체크', '안 찍힌 사람은 바로 연락', '출근 현황', 'attend', 'att']],
  b: [['b1', '보험 컨셉 준비 상태 확인', '', '', '']],
  c: [['c3', '오늘 먼저 볼 사람', '성장판·팀 코칭이 같은 사람을 가리킵니다', '성장판', 'growboard', 'miss']],
  d: [['e2', '오늘 아무 기록도 없는 사람 연락', '내일 아침이면 늦습니다', '성장판', 'growboard', 'noact']]
};

function box(opt) {
  opt = opt || {};
  const els = {}, said = [], store = {};
  const sheetEl = { classList: { contains: () => true }, querySelector: () => sheetEl.box, box: null, innerHTML: '' };
  const doc = { head: { appendChild: e => { els[e.id] = e; } }, documentElement: {}, createElement: () => ({ id: '', textContent: '' }), getElementById: id => (id === 'hv2Sheet' ? sheetEl : (els[id] || null)) };
  const ck = Object.assign({}, opt.ck || {});
  const g = {
    said, document: doc, osEsc: esc, setTimeout: () => 0, toast: t => said.push(['toast', t]), go: t => said.push(['go', t]),
    localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; said.push(['ls', k]); } },
    hwhoCan: () => opt.lead !== false, mcalToday: () => TD, gbDay: () => TD, ckDayK: () => TD,
    GB: opt.gb === false ? { loaded: false, busy: false } : {
      loaded: true, busy: false,
      rows: [{ id: 'u1', lastAtt: TD }, { id: 'u2', lastAtt: '2026-11-26' }, { id: 'u3', lastAtt: TD }],
      ckIt: { u1: { [TD]: { d4: 1, d5: 1, d6: 1, d8: 1, d10: 1, d1: 1 } }, u3: { [TD]: { d4: 1, d5: 1 }, '2026-11-26': { d9: 1, d10: 1 } } }
    },
    AR: opt.ar === false ? { loaded: false } : { loaded: true, db: [
      { id: 'a', who: 'u1', appt: TD + 'T16:30:00', name: '홍갑돌' }, { id: 'b', who: 'u1', appt: TD + 'T14:00:00', name: '임꺽정' },
      { id: 'c', who: 'u3', appt: '2026-11-28T10:00:00', name: '성춘향' }, { id: 'd', who: 'u2', appt: null, name: '변학도' }] },
    TEAM_V2: { team: () => [{ id: 'me', me: true, nm: '나', tm: '본부' }, { id: 'u1', nm: '홍길동', tm: '건우TEAM', call: 12, zero: false },
      { id: 'u2', nm: '홍길순', tm: '건우TEAM', call: 0, zero: true }, { id: 'u3', nm: '홍판서', tm: '미은TEAM', call: null, zero: null }] },
    CK_LDR: LDR, ckLoad: sc => (sc === 'day' ? ck : {}), ckToggle: (sc, id) => { said.push(['ck', sc, id]); if (ck[id]) delete ck[id]; else ck[id] = 1; },
    gbMiss: () => [{}, {}], gbScope: () => [],
    copyText: t => said.push(['copy', t]),
    HOME_V2: { sheet: h => { sheetEl.innerHTML = h; sheetEl.box = { innerHTML: '', set: 1 }; }, close: () => said.push(['close']) },
    teamV2Open: () => said.push(['teamV2Open']), teamV2Member: id => said.push(['teamV2Member', id]),
    arLoad: () => said.push(['arLoad']), gbLoad: () => said.push(['gbLoad'])
  };
  g.window = g;
  vm.createContext(g); vm.runInContext(AM, g);
  return { g, said, sheetEl, ck };
}
const html = B => B.sheetEl.box ? B.sheetEl.box.innerHTML : '';

console.log('\n[1] 싣기 · 여는 자리');
is((IX.match(/<script src="am-v2\.js"><\/script>/g) || []).length === 1 && IX.indexOf('<script src="am-v2.js">') === IX.indexOf('<script src="team-v2.js"></script>') + '<script src="team-v2.js"></script>'.length + (IX.indexOf('<script src="team-v2.js"></script>\r\n') >= 0 ? 2 : 1),
  'index.html 에 am-v2.js 를 한 번 — team-v2.js 바로 다음 줄');
is((IX.match(/amV2|AM_V2/g) || []).length === 0, 'index.html 에는 싣는 줄 말고 손대지 않음');
is(/if \(typeof g\.amV2Open === 'function'\) h \+= '<button type="button" class="tmall" onclick="amV2Open\(\)">☀️ 팀 아침 점검 · 지점장 체크리스트/.test(HV) && /typeof g\.amV2Open === 'function' \? '<button type="button" class="btn g" onclick="amV2Open\(\)">☀️ 팀 아침 점검/.test(TM),
  '여는 단추 = 새 오늘 화면 팀 동그라미 밑(whoHtml · 지점장만) + 팀 한눈에 시트 맨 아래 — 아래 탭 띠 · 🎙/? 는 그대로');

console.log('\n[2] 지점장 · 대표만');
{
  const B = box({ lead: false }); B.g.amV2Open();
  is(!B.sheetEl.box && !B.said.some(x => x[0] === 'gbLoad'), 'hwhoCan 이 아니면 시트도 안 열고 읽기도 안 부름');
  const C = box(); C.g.amV2Open();
  is(!!C.sheetEl.box && /<div class="am2" data-am="1">/.test(C.sheetEl.innerHTML), '지점장이면 새 오늘 화면 시트(HOME_V2.sheet)에 엶');
}

console.log('\n[3] 팀원 한 줄 — 있던 칸만');
{
  const B = box(); B.g.amV2Open(); const h = html(B);
  const L = B.g.AM_V2.team(), by = {}; L.forEach(t => { by[t.id] = t; });
  is(L.length === 3 && !by.me, '나는 빼고 팀원만(TEAM_V2.team 명단 그대로)');
  is(by.u1.att === true && by.u2.att === false && by.u3.att === true, '출근 = 성장판이 읽은 출근(GB.rows lastAtt 가 오늘) — 어제 찍은 분은 출근 전');
  is(by.u1.misN === 3 && JSON.stringify(by.u1.mis) === '[true,true,false,true]' &&JSON.stringify(by.u3.mis) === '[true,false,false,false]' && by.u2.misN === 0, '미션 네 칸 = 그날 체크판(GB.ckIt[오늘]) — 📞 d4·d5 둘 다 · ✍️ d6·d8 둘 다 · 🩺 d9 · 📣 d10 / 어제 칸은 안 셈');
  is(JSON.stringify(by.u1.ap) === '["14:00","16:30"]' && by.u3.ap.length === 0 && by.u2.ap.length === 0, '약속 = 배정 줄(AR.db) 오늘 것만 · 시각 차례로 — 내일 약속 · 약속 없는 줄은 안 셈');
  is(/홍길동<small>건우TEAM<\/small><\/div><span class="at ok">출근 ✓<\/span>/.test(h) && /🤝 약속 <b>2곳<\/b> · 14:00부터/.test(h) && /📞 12통/.test(h) && /📞 …/.test(h),
    '한 줄 — 이름 · 팀 · 출근 · 약속 n곳 · 전화(못 읽은 분은 「…」)');
  is(!/홍갑돌|임꺽정|성춘향|변학도/.test(h), '고객 이름은 한 글자도 안 나옴 — 약속은 곳 수 · 시각만');
  const N = box({ gb: false, ar: false }); N.g.amV2Open(); const n = html(N);
  is(/<span class="at">출근 …<\/span>/.test(n) && /<span>미션 …<\/span>/.test(n) && /🤝 …/.test(n) && !/class="at no"/.test(n) && !/0\/4/.test(n),'아직 못 읽었으면 「…」 — 「출근 전」 · 「0/4」 라고 안 적음(1번)');
  is(N.said.some(x => x[0] === 'gbLoad') && N.said.some(x => x[0] === 'arLoad') && !B.said.some(x => x[0] === 'gbLoad'), '안 읽었을 때만 있던 gbLoad · arLoad 를 부름');
}

console.log('\n[4] 줄 차례 · 칸 누르기');
{
  const B = box(); B.g.amV2Open(); let h = html(B);
  const order = []; h.replace(/<div class="rn">([^<]+)<small>/g, (m, n) => { order.push(n); return m; });
  is(order.join('|') === '홍길순|홍판서|홍길동', '출근 전이 맨 위 → 미션 적은 분부터 — ' + order.join('|'));
  is(/<b class="w">1명<\/b><span>출근 전<\/span>/.test(h) && /<b class="w">1명<\/b><span>미션 아직 안 연 분<\/span>/.test(h) && /<b class="">2곳<\/b><span>오늘 약속 · 1명<\/span>/.test(h) && /<b class="w">1명<\/b><span>오늘 활동 0<\/span>/.test(h),
    '네 칸 — 출근 전 1 · 미션 안 연 분 1 · 오늘 약속 2곳(1명) · 활동 0 1');
  B.g.amV2Q('noatt'); h = html(B);
  is((h.match(/class="r"/g) || []).length === 1 && /홍길순<small>/.test(h), '「출근 전」 을 누르면 그 사람만');
  B.g.amV2Q('noatt'); h = html(B);
  is((h.match(/class="r"/g) || []).length === 3, '한 번 더 누르면 다시 전원');
  B.g.amV2Member('u2');
  is(B.said.some(x => x[0] === 'teamV2Member' && x[1] === 'u2'), '한 줄을 누르면 팀 한눈에의 그분 화면(teamV2Member)');
}

console.log('\n[5] 아침 점검 카톡 문구 — 복사만');
{
  const B = box(); B.g.amV2Open(); B.g.amV2Copy();
  const c = (B.said.filter(x => x[0] === 'copy')[0] || [])[1] || '';
  is(/^\[11\/27\(금\) 아침 점검\]/.test(c) && /✅ 출근 2 \/ 3명/.test(c) && /⏰ 출근 전: 홍길순/.test(c) && /🤝 오늘 약속: 홍길동 2곳/.test(c) && /🎯 미션 아직 안 연 분: 홍길순/.test(c),
    '날짜 · 출근 n / 전원 · 출근 전 · 오늘 약속 · 미션 안 연 분');
  is(!/홍갑돌|임꺽정|성춘향|변학도/.test(c), '고객 이름 없음 — 팀원 이름만');
  is(/오늘의 미션 다섯 칸/.test(c) && !/보험료|보장금액|가입/.test(c), '팀 안 단톡용 — 고객에게 나가는 글이 아님(광고 문구 없음)');
  is(B.said.filter(x => x[0] === 'copy').length === 1 && !B.said.some(x => x[0] === 'ls'), '있던 copyText 로 복사만 — 보내기 · 저장 없음');
  const N = box({ gb: false }); N.g.amV2Open();
  is(!/출근/.test(N.g.AM_V2.msgText(N.g.AM_V2.team())), '출근을 못 읽었으면 출근 줄을 안 씀(지어내지 않음)');
}

console.log('\n[6] 지점장 체크리스트 — 실행 체크판 지점장 표 그대로');
{
  const B = box({ ck: { a3: 1 } }); B.g.amV2Open(); let h = html(B);
  const heads = []; h.replace(/<div class="ckh">([^<]+)<span>([^<]+)<\/span>/g, (m, t, n) => { heads.push(t.trim() + ' ' + n); return m; });
  is(heads.join('|') === '☀️ 아침 · 출근 시간 1 / 2|👤 오전 · 사람에게 물어서 0 / 1|🖥️ 오후 · 화면에서 0 / 1|🌙 마감 · 퇴근 전 0 / 1', '네 묶음(a 아침 · b 오전 · c 오후 · d 마감) 그대로 · 칸 수 — ' + heads.join('|'));
  is(/<h2>📋 지점장 체크리스트<small>1 \/ 5<\/small><\/h2>/.test(h), '전체 몇 개 했나 — 1 / 5');
  is(/<em>출근 전 1명<\/em> · 안 찍힌 사람은 바로 연락/.test(h) && /<em>먼저 볼 사람 2명<\/em>/.test(h) && /<em>오늘 활동 0 · 1명<\/em>/.test(h), '칸 옆 숫자 = ① 출근 · 활동 0 · 성장판 gbMiss 그대로');
  is(/onclick="amV2Go\('attend'\)">출근 현황 ›/.test(h) && /onclick="amV2Go\('growboard'\)">성장판 ›/.test(h), '가는 곳 = 표에 적힌 화면 그대로');
  B.g.amV2Ck('a2'); h = html(B);
  is(JSON.stringify(B.said.filter(x => x[0] === 'ck')) === '[["ck","day","a2"]]' && /<h2>📋 지점장 체크리스트<small>2 \/ 5<\/small>/.test(h) && /class="ci on"><button type="button" class="cb on" aria-label="출근 체크 되돌리기"/.test(h),
    '✓ = 있던 ckToggle(\'day\', id) — 실행 체크판 · 달력과 같은 칸 · 바로 다시 그림');
  B.g.amV2Go('attend');
  is(B.said.some(x => x[0] === 'close') && B.said.some(x => x[0] === 'go' && x[1] === 'attend'), '가기 = 시트 닫고 그 화면(go)');
}

console.log('\n[7] 서버 · 저장 · 글씨');
{
  const code = 걷기(AM);
  is(!/\.from\(|\.rpc\(|fetch\(|osClient|localStorage|setItem|ckSave|ckPush|cmLSSet/.test(code), '서버에 묻지도 쓰지도 않음 · 이 기기에도 안 담음(체크는 있던 ckToggle 하나)');
  const px = (code.match(/font-size:(\d+)px/g) || []).map(x => +x.replace(/\D/g, ''));
  is(px.length > 5 && px.every(n => n >= 13), '13px 밑 글씨 없음 — ' + Math.min.apply(null, px) + 'px');
  is(/min-width:28px;height:24px/.test(code) && /\.am2 \.cb\{flex:none;width:44px;height:44px/.test(code) && /\.am2 \.btn\{[^}]*height:52px/.test(code), '누르는 칸 44px 이상(체크 · 단추)');
}

console.log(bad ? ('\n✗ ' + bad + '건 어긋남') : '\n✓ 팀 아침 점검은 있던 칸만 읽고, 체크는 실행 체크판 그 칸에 담습니다');
process.exit(bad ? 1 : 0);
