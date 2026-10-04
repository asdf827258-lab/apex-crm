/* ══════════════════════════════════════════════════════════════════
   check-almpex.js — <b>17시 알람이 예상업적을 말하나.</b>

   사장님 말씀 X05 — <b>「17시 예상업적 알람에 숫자」</b>.
   이 말씀은 <b>보류</b>로 남아 있었고, 그 까닭으로 제가 적어 둔 것은
   「expect_premium 은 DB·업적관리에 있어 <b>본체가 못 읽습니다</b>」 였습니다.
   <b>그 말이 거짓이었습니다</b> — 그 금액은 dbs 의 칸이고, 홈이 이미 읽는
   표였습니다(2026-10-02 · X54 에서 밝혀졌습니다). 거짓인 까닭 하나가
   말씀 하나를 <b>여러 판 동안 묶어 두었습니다.</b>

   ── 이 자가 지키는 것 ─────────────────────────────────────────────
     [1] ★★ 표가 <b>「셀 수 있다」</b> 로 돌았고, 거짓이 된 말이 없다
     [2] ★★ 적는 글이 <b>한 함수</b>다 — 앱과 서버가 그것을 부른다.
         서버에 금액 글을 <b>베껴 적은 자리가 없다</b> (5번)
     [3] ★★ 세는 자도 <b>apex-pex.js 하나</b>다 — 판정을 서버에 안 베꼈다
     [4] ★★★ <b>그 분 것만</b> 센다 (3번) — 남의 금액이 섞이면 안 됩니다
     [5] ★★ <b>못 읽으면 숫자를 한 자도 안 적는다</b> (1번)
     [6] ★★ <b>금액이 다 0 이면 안 울린다</b> — 「0원」 알람은 방해입니다
     [7] ★★ <b>장부를 한 사람에 한 번만</b> 읽고, <b>17시에만</b> 읽는다 (7번)
     [8] ★★ <b>이름을 한 칸도 안 받아 온다</b> (3번)
     [9] ★ 금액이 <b>원</b>이다 (4번) — 만 배 오류가 없다
    [10] ★★ <b>앱과 서버가 같은 글</b>을 낸다

   ★ <b>진짜 서버를 읽지 않습니다.</b> SUPABASE_URL 을 못 가는 주소로 두고
     fetch 를 제 것으로 갈아 끼웁니다 — 사장님 장부에 한 번도 안 닿습니다.
   ══════════════════════════════════════════════════════════════════ */
process.env.SUPABASE_URL = 'http://127.0.0.1:9/막음';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-not-a-real-key';

const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const 읽기 = f => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { return ''; } };

const SLOTS = 읽기('app/alm-slots.js');
const CORE  = 읽기('scripts/push-core.js');
const CRON  = 읽기('netlify/functions/push-cron.js');
const IDX   = 읽기('app/index.html');
const TOML  = 읽기('netlify.toml');

/* ── 가짜 장부 ───────────────────────────────────────────────────
   fetch 를 갈아 끼워 <b>무엇을 물었는지</b> 받아 적습니다. 그래서 「그 분
   것만 묻나」·「몇 번 묻나」 를 눈으로 짐작하지 않고 <b>셉니다</b>.      */
const 물음 = [];
let 장부 = [];
global.fetch = async (url, opt) => {
  물음.push(String(url));
  const u = String(url);
  if (u.indexOf('/rest/v1/dbs') < 0) return { ok: false, status: 404, text: async () => '' };
  /* 서버가 준 거르개를 <b>실제로 적용</b>합니다 — 안 하면 거르개가 없어도
     자가 초록이 됩니다 (헛것). */
  const m = /assigned_to=eq\.([^&]+)/.exec(u);
  const who = m ? decodeURIComponent(m[1]) : null;
  const rows = who ? 장부.filter(r => r.assigned_to === who) : 장부;
  return { ok: true, status: 200, text: async () => JSON.stringify(rows) };
};

const P = require('../scripts/push-core.js');
const S = require('../app/alm-slots.js');
const PEX = require('../apex-pex.js');
const WON = require('../apex-won.js');

const 이번달 = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 7);
const 지난달 = PEX.ymShift(이번달, -1);
const 줄 = (who, stage, closed, expect, contract, cdate) =>
  ({ assigned_to: who, stage: stage, closed_reason: closed,
     expect_premium: expect, contract_premium: contract, contracted_at: cdate });

(async () => {

console.log('\n[1] ★★ 표가 <b>「셀 수 있다」</b> 로 돌았다 — 거짓이 된 까닭을 지웠다');
const perf = S.almSlotAt(17);
is(!!perf && perf.k === 'perf' && perf.cnt === true,
   '  17시 <b>예상업적</b> 슬롯이 cnt=true 다 — ' + (perf ? ('k=' + perf.k + ' · cnt=' + perf.cnt) : '없다'));
/* ★ <b>낫표 안은 인용이지 주장이 아닙니다</b> — check-hmflow·check-pex 가
   쓰는 그 규약입니다. 처음에 이 줄이 <b>제가 적어 둔 인용</b>을 잡아
   울렸습니다. 거짓이 된 말은 <b>왜 틀렸는지와 함께</b> 남겨 두어야
   다음 세션이 그것을 되살리지 않습니다 — 지우면 까닭이 사라집니다. */
const 민주장 = s => String(s).replace(/「[^」]*」/g, ' ');
is(!/본체가 못 읽습니다/.test(민주장(SLOTS)),
   '  ★ 「본체가 못 읽습니다」 를 <b>주장으로 적은 자리가 없다</b> (인용은 낫표 안에 둡니다)');
is(/그 말이 거짓/.test(SLOTS) || /틀렸습니다/.test(SLOTS),
   '  ★ 그 말이 왜 틀렸는지 <b>적어 두었다</b> — 다음 세션이 되살리지 못하게');

console.log('\n[2] ★★ 적는 글이 <b>한 함수</b>다 — 앱과 서버가 그것을 부른다 (5번)');
is(typeof S.almPerfLine === 'function', '  alm-slots.js 가 <b>almPerfLine</b> 을 들고 있다');
is(/almPerfLine\(/.test(IDX), '  <b>앱</b>(almLineFor)이 그것을 부른다');
is(/S\.almPerfLine\(/.test(CORE), '  <b>서버</b>(slotMsgFor)가 그것을 부른다');
/* 베낀 자리 — 서버 파일에 금액 글의 낱말이 있으면 두 벌입니다 */
const 베낌 = ['진행중 예상', '지난달 ', '만원', '억'].filter(w => CORE.indexOf(w) >= 0 || CRON.indexOf(w) >= 0);
is(베낌.length === 0,
   '  ★★ 서버 파일에 금액 글을 <b>베껴 적은 자리가 없다</b>'
   + (베낌.length ? (' ← ' + 베낌.join(' · ')) : ''));

console.log('\n[3] ★★ 세는 자도 <b>apex-pex.js 하나</b>다');
is(/require\('\.\.\/apex-pex\.js'\)/.test(CORE), '  서버가 <b>apex-pex.js</b> 를 부른다');
const 판정베낌 = ["'계약완료'", "'증권전달'", 'DONE_STAGES ='].filter(w => CORE.indexOf(w) >= 0);
is(판정베낌.length === 0,
   '  ★ 판정(체결이 무엇인가)을 서버에 <b>안 베꼈다</b>'
   + (판정베낌.length ? (' ← ' + 판정베낌.join(' · ')) : ''));
is(/"apex-pex\.js"/.test(TOML) && /"apex-won\.js"/.test(TOML),
   '  ★ 두 파일이 <b>함수에 실제로 올라간다</b> (netlify.toml included_files) — 안 올리면 서버에서 터집니다');

console.log('\n[4] ★★★ <b>그 분 것만</b> 센다 (3번) — 남의 금액이 섞이면 안 됩니다');
장부 = [줄('me', '계약완료', '', 0, 350000000, 이번달 + '-05'),
        줄('u2', '계약완료', '', 0, 900000000, 이번달 + '-06'),
        줄('me', 'AP', '', 900000, 0, '')];
물음.length = 0;
let o = await P.pexFor('me', new Map());
is(!!o && o.now.won === 350000000,
   '  <b>내 것만</b> 센다 — ' + (o ? o.now.won : 'null') + '원 (남의 9억이 안 섞였습니다)');
is(물음.length === 1 && /assigned_to=eq\.me/.test(물음[0]),
   '  ★★ 장부에 <b>그 분 것만</b> 물었다 — 「' + (물음[0] || '').replace(/^.*rest\/v1\//, '').slice(0, 56) + '」');

console.log('\n[5] ★★ <b>못 읽으면 숫자를 한 자도 안 적는다</b> (1번)');
const 참fetch = global.fetch;
global.fetch = async () => ({ ok: false, status: 500, text: async () => '서버가 거절했습니다' });
const 못읽음 = await P.pexFor('me', new Map());
is(못읽음 === null, '  pexFor 가 <b>null</b> 이다 — 0 이 아닙니다');
const 표글 = await P.slotMsgFor(17, { owner_id: 'me' }, new Map());
is(!!표글 && !/[\d,]+\s*(원|만원|억)/.test(표글.body) && /확인할 시간/.test(표글.body),
   '  ★★ 보내는 글에 금액이 <b>한 자도 없다</b> — 「' + (표글 ? 표글.body.slice(0, 34) : '없다') + '」');
global.fetch = 참fetch;

/* ★★ 2026-10-03 · <b>이 토막을 고쳐 물었습니다.</b> 여태 「금액이 다 0 이면
   표의 글로 간다」 를 쟀는데, 아래 [6-b] 를 넣으면서 그때 <b>할 일</b>을
   보내게 되었습니다. 지키려던 것은 「표의 글이 간다」 가 아니라
   <b>「0원 이라는 글자를 안 보낸다」</b> 였습니다 — 그 보호를 그대로 묻습니다.
   「정말 아무것도 없으면 조용하다」 는 [6-b] 가 봅니다.                   */
console.log('\n[6] ★★ <b>금액이 다 0 이면 「0원」 을 안 보낸다</b> — 그런 알람은 방해입니다');
장부 = [줄('me', 'TA', '', 0, 0, '')];
const 영 = await P.slotMsgFor(17, { owner_id: 'me' }, new Map());
is(!!영 && !/0원/.test(영.title + ' ' + 영.body),
   '  보내는 글에 <b>「0원」 이 없다</b> — 「' + (영 ? 영.title : '없다') + '」');
is(!!영 && !/[\d,]+\s*(원|만원|억)/.test(영.body),
   '  ★ 금액이 <b>한 자도 없다</b> — 「' + (영 ? 영.body.split('\n')[0].slice(0, 40) : '') + '」');

/* ══ [6-b] <b>조용한 알람은 고장난 알람으로 보입니다</b> (6번) ══════════
   2026-10-03 · 라이브 장부를 재어 보니 <b>1,550건 가운데 예상업적이 적힌
   것이 0건</b>이었습니다. 기계는 섰는데 자료가 없어, 그대로 두면 17시에
   <b>아무 말도 안 가고</b> 사장님은 알람이 고장난 줄 아십니다.
   ★ 금액이 0 이고 <b>안 적힌 건이 있으면</b> 금액 대신 <b>할 일</b>을 보냅니다.
   ★ <b>정말로 아무것도 없을 때만</b> 조용합니다.
   ★ 그 글에도 <b>금액은 한 자도 없습니다</b> (1번).                     */
console.log('\n[6-b] ★★ <b>금액을 안 적으셨으면 할 일을 알려 준다</b> (6번) — 조용히 사라지지 않습니다');
const 안적힘 = PEX.sum([{ stage: 'AP', closed: '', expect: null, contract: null, cdate: null },
                        { stage: 'PC', closed: '', expect: null, contract: null, cdate: null }], 이번달);
const 할일 = S.almPerfLine(안적힘);
is(!!할일 && /안 적으셨습니다/.test(할일.title) && /빈 2건/.test(할일.body),
   '  금액이 다 0 이고 <b>안 적힌 건이 있으면</b> 할 일이 간다 — 「' + (할일 ? 할일.title : '조용함') + '」');
is(!!할일 && !/[\d,]+\s*(원|만원|억)/.test(할일.body),
   '  ★ 그 글에도 금액이 <b>한 자도 없다</b> (1번) — 「' + (할일 ? 할일.body.split('\n')[0] : '') + '」');
is(!!할일 && /DB · 업적관리/.test(할일.body),
   '  ★ <b>어디서 적는지</b>를 말한다 (6번) — 고칠 자리를 감추지 않습니다');
is(S.almPerfLine(PEX.sum([], 이번달)) === null,
   '  ★ <b>정말로 아무것도 없으면</b> 조용하다 — 없는 일을 만들어 알리지 않습니다');
장부 = [줄('me', 'AP', '', null, null, null), 줄('me', 'PC', '', null, null, null)];
const 서버할일 = await P.slotMsgFor(17, { owner_id: 'me' }, new Map());
is(!!서버할일 && /안 적으셨습니다/.test(서버할일.title),
   '  ★★ <b>서버도 같은 글</b>을 보낸다 — 「' + (서버할일 ? 서버할일.title : '') + '」');

console.log('\n[7] ★★ 장부를 <b>한 사람에 한 번만</b>, <b>17시에만</b> 읽는다 (7번)');
장부 = [줄('me', 'AP', '', 900000, 0, '')];
물음.length = 0;
const 쓰개 = new Map();
await P.slotMsgFor(17, { owner_id: 'me', ua: '아이폰' }, 쓰개);
await P.slotMsgFor(17, { owner_id: 'me', ua: '컴퓨터' }, 쓰개);
is(물음.length === 1, '  폰이 <b>둘</b>이어도 장부는 <b>한 번</b> — ' + 물음.length + '번 물었습니다');
물음.length = 0;
await P.slotMsgFor(9, { owner_id: 'me' }, new Map());
await P.slotMsgFor(13, { owner_id: 'me' }, new Map());
await P.slotMsgFor(21, { owner_id: 'me' }, new Map());
is(물음.length === 0, '  ★★ 아침·낮·저녁에는 장부를 <b>아예 안 읽는다</b> — ' + 물음.length + '번');
is(/cache/.test(CRON) && /slotMsgFor/.test(CRON), '  ★ 서버 판이 그 쓰개를 <b>한 판에 하나</b>만 둔다');

console.log('\n[8] ★★ <b>이름을 한 칸도 안 받아 온다</b> (3번)');
const 받는칸 = (P.PEX_COLS || '').split(',');
const 몰래 = 받는칸.filter(c => /name|phone|tel|birth|jumin|rrn|memo|addr/i.test(c));
is(몰래.length === 0,
   '  받아 오는 칸 ' + 받는칸.length + '개가 다 <b>세는 데 필요한 것</b>이다 — ' + 받는칸.join(' · ')
   + (몰래.length ? ('\n      ✗ ' + 몰래.join(' · ')) : ''));
is(물음.every(u => !/customer_name|\*/.test(u)), '  ★ 실제 물음에도 이름·전체(*)가 없다');

console.log('\n[9] ★ 금액이 <b>원</b>이다 (4번) — 만 배 오류가 없다');
is(WON.txt(350000000) === '3억 5,000만원', '  3억 5,000만원 — 「' + WON.txt(350000000) + '」');
is(WON.txt(500000) === '50만원', '  50만원이 <b>50억</b>으로 안 찍힌다 — 「' + WON.txt(500000) + '」');
is(WON.txt(null) === '—' && WON.txt(0) === '0원', '  ★ <b>모름</b>과 <b>0</b> 을 가른다 — 「' + WON.txt(null) + '」 · 「' + WON.txt(0) + '」');
is(!/10000/.test(읽기('apex-pex.js')), '  ★ <b>세는 자</b>에는 10000 이 여전히 한 번도 없다');
is(/function frWonR\([\s\S]{0,200}APEX_WON\.txt/.test(IDX),
   '  ★★ 앱의 frWonR 이 <b>그 자를 부르기만</b> 한다 — 규칙이 한 곳입니다');

console.log('\n[10] ★★ <b>앱과 서버가 같은 글</b>을 낸다');
장부 = [줄('me', '계약완료', '', 0, 350000000, 이번달 + '-05'),
        줄('me', '증권전달', '', 800000, 0, 지난달 + '-11'),
        줄('me', 'AP', '', 900000, 0, ''),
        줄('me', 'PC', '무산', 5000000, 0, '')];
const 서버글 = await P.slotMsgFor(17, { owner_id: 'me' }, new Map());
const 앱글 = S.almPerfLine(PEX.sum(장부.map(r => ({ stage: r.stage, closed: r.closed_reason,
  expect: r.expect_premium, contract: r.contract_premium, cdate: r.contracted_at })), 이번달));
is(!!서버글 && !!앱글 && 서버글.title === 앱글.title && 서버글.body === 앱글.body,
   '  두 글이 <b>글자까지 같다</b> — 「' + (서버글 ? 서버글.title : '없다') + '」');
is(!!서버글 && /3억 5,000만원/.test(서버글.body) && /보류·무산 1건/.test(서버글.body),
   '  ★ 금액과 <b>뺀 건수</b>를 함께 적는다 — 「' + (서버글 ? 서버글.body.replace(/\n/g, ' / ') : '').slice(0, 92) + '」');

console.log('\n' + '─'.repeat(30));
console.log('⚠ <b>이 자가 증명하지 못하는 것</b> — 폰에 <b>실제로 뜨는지</b>는');
console.log('  사장님 폰에서 17시에 보셔야 합니다. 서버가 보낸 것과 폰이 띄운 것은');
console.log('  다른 일입니다 (브라우저·OS 가 막을 수 있습니다).');
console.log(bad ? '✗ ' + bad + '개' : '✓ 17시 알람이 그 분 예상업적을 말하고, 못 세면 수를 한 자도 안 적습니다.');
process.exit(bad ? 1 : 0);
})();
