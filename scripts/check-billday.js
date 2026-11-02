/* 💳 <b>다음 결제일이 밀리지 않나</b> — 판 X291

   사장님 말씀 (2026-11-02) — 결제일이 31일에 시작하면 2~3일씩 뒤로 밀리는
   것을 두고 「<b>처음 날짜를 기억</b>」 으로 하라 하셨습니다.

   ── 손대기 전 ───────────────────────────────────────────────────────
   두 함수가 저마다 `d.setMonth(d.getMonth()+1)` 로 셈했습니다. setMonth 는
   <b>없는 날을 다음 달로 넘깁니다</b> — 1월 31일 + 1개월 = 「2월 31일」 →
   <b>3월 3일</b>. 그래서 31일 구독은 1/31 → 3/3 → 4/3 → 5/3 … 으로
   <b>영영 밀렸습니다.</b> 한 해면 한 달 가까이 밀립니다.

   ── 여기서 재는 것 ──────────────────────────────────────────────────
     [1] ★★ 31일 구독을 <b>서른여섯 달</b> 돌려 — 처음 날로 <b>돌아오나</b>
     [2] ★ 말일이 없는 달에만 내려가고 <b>그 달에 다시 올라오나</b>
     [3] ★ 해마다 결제 · 윤년 2월 29일
     [4] ★ 시각은 그대로인가 · <b>한국 날</b>로 세나 (밤에 시작해도 안 어긋나나)
     [5] ★★ 처음 날을 <b>어디서 아나</b> — 칸을 새로 안 두고 started_at 에서
     [6] ★ 두 함수가 <b>같은 한 곳</b>을 부르나 (5번) · 옛 셈이 안 남았나

   ★ 셈을 여기 베끼지 않습니다 — <b>그 파일을 불러</b> 잽니다 (5번).
   ★ 바깥으로 한 글자도 안 나갑니다 (토스·서버를 안 부릅니다).          */
const fs = require('fs'), path = require('path');
const P = require(path.join(process.cwd(), 'netlify', 'functions', '_period.js'));
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

const 날 = (d) => { const k = P.kstParts(d.getTime());
  return k.y + '-' + ('0' + (k.m + 1)).slice(-2) + '-' + ('0' + k.d).slice(-2); };
const 시 = (d) => { const k = P.kstParts(d.getTime());
  return ('0' + k.hh).slice(-2) + ':' + ('0' + k.mi).slice(-2); };

head('[1] ★★ 31일 구독을 <b>서른여섯 달</b> 돌린다 — 처음 날로 돌아오나');
{
  const 처음 = '2026-01-31T10:00:00+09:00';
  const anchor = P.anchorOf({ started_at: 처음 });
  let cur = new Date(Date.parse(처음)), 길 = [];
  for (let i = 0; i < 36; i++) { cur = P.addPeriod(cur, 'month', anchor); 길.push(날(cur)); }
  is(anchor === 31, '  처음 날을 <b>31일</b> 로 안다 — ' + anchor);
  const 삼십일 = 길.filter(x => /-31$/.test(x)).length;
  is(삼십일 >= 20, '  서른여섯 달 중 <b>31일에 걸리는 달이 ' + 삼십일 + '번</b> — 28일에 굳지 않는다');
  is(길[0] === '2026-02-28' && 길[1] === '2026-03-31',
     '  ★ 2월에 내려갔다가 <b>3월에 다시 31일로</b> — ' + 길[0] + ' → ' + 길[1]);
  const 밀림 = 길.filter(x => /-0[123]$/.test(x) && !/-01$/.test(x));
  is(밀림.length === 0, '  <b>다음 달 초로 넘어간 적이 없다</b> — ' + 밀림.length + '번' +
     (밀림.length ? (' ⚠ ' + 밀림.slice(0, 3).join(' · ')) : ''));
  console.log('      한 해: ' + 길.slice(0, 12).join(' → '));
}

head('[2] ★ 말일 구독 — 그 달에 없으면 말일, 있으면 그 날');
{
  const 돌 = (처음, n, cyc) => {
    const a = P.anchorOf({ started_at: 처음 });
    let cur = new Date(Date.parse(처음)), out = [];
    for (let i = 0; i < n; i++) { cur = P.addPeriod(cur, cyc || 'month', a); out.push(날(cur)); }
    return out;
  };
  const a30 = 돌('2026-01-30T10:00:00+09:00', 3);
  is(a30[0] === '2026-02-28' && a30[1] === '2026-03-30',
     '  30일 구독 — ' + a30.slice(0, 3).join(' → '));
  const a29 = 돌('2026-01-29T10:00:00+09:00', 3);
  is(a29[0] === '2026-02-28' && a29[1] === '2026-03-29',
     '  29일 구독 — ' + a29.slice(0, 3).join(' → '));
  const a15 = 돌('2026-01-15T10:00:00+09:00', 3);
  is(a15.join() === '2026-02-15,2026-03-15,2026-04-15',
     '  15일 구독은 <b>전과 같다</b> — ' + a15.join(' → '));
}

head('[3] ★ 해마다 결제 · 윤년 2월 29일');
{
  const a = P.anchorOf({ started_at: '2028-02-29T10:00:00+09:00' });
  const y1 = P.addPeriod(new Date(Date.parse('2028-02-29T10:00:00+09:00')), 'year', a);
  const y2 = P.addPeriod(y1, 'year', a);
  const y4 = P.addPeriod(P.addPeriod(y2, 'year', a), 'year', a);
  is(a === 29, '  처음 날을 29일로 안다');
  is(날(y1) === '2029-02-28', '  2028-02-29 + 1년 → <b>' + 날(y1) + '</b> (3월 1일로 안 넘어간다)');
  is(날(y4) === '2032-02-29', '  ★ 다음 윤년에 <b>29일로 돌아온다</b> — ' + 날(y4));
  const m = P.addPeriod(new Date(Date.parse('2026-01-31T10:00:00+09:00')), 'year', 31);
  is(날(m) === '2027-01-31', '  해마다 결제도 날이 그대로 — ' + 날(m));
}

head('[4] ★ 시각은 그대로 · <b>한국 날</b>로 센다');
{
  const d = P.addPeriod(new Date(Date.parse('2026-01-31T10:30:00+09:00')), 'month', 31);
  is(시(d) === '10:30', '  시각이 그대로다 — ' + 시(d));
  /* 한국 밤 = UTC 로는 그 전날. 서버 날로 세면 하루 어긋납니다. */
  const 밤 = '2026-03-31T23:30:00+09:00';            /* UTC 로는 3월 31일 14:30 */
  const a = P.anchorOf({ started_at: 밤 });
  is(a === 31, '  한국 밤 11시 반에 시작해도 처음 날이 <b>31일</b> — ' + a);
  const n = P.addPeriod(new Date(Date.parse(밤)), 'month', a);
  is(날(n) === '2026-04-30' && 시(n) === '23:30',
     '  그 다음은 ' + 날(n) + ' ' + 시(n) + ' (4월은 30일까지)');
}

head('[5] ★★ 처음 날을 <b>어디서 아나</b> — 칸을 새로 안 두고');
{
  is(P.anchorOf({ started_at: '2026-01-31T10:00:00+09:00' }) === 31,
     '  started_at 에서 뽑는다 — 사장님이 SQL 을 돌리실 일이 없다');
  is(P.anchorOf({ anchor_day: 7, started_at: '2026-01-31T10:00:00+09:00' }) === 7,
     '  나중에 칸을 두시면 <b>그쪽이 이긴다</b> — 7');
  is(P.anchorOf({}, Date.parse('2026-06-05T10:00:00+09:00')) === 5,
     '  둘 다 없으면 <b>그때 날</b>에서 — 5 (지어내지 않는다 · 1번)');
  is(P.anchorOf({ started_at: '망가진 글자' }, Date.parse('2026-06-05T10:00:00+09:00')) === 5,
     '  깨진 글자에도 안 터진다 — 5');
  const SQL = fs.readFileSync(path.join(process.cwd(), 'app', 'index.html'), 'utf8');
  is(/started_at timestamptz default now\(\)/.test(SQL),
     '  표에 <b>started_at</b> 이 이미 있다 — 새 칸을 안 만든 까닭');
  const B = fs.readFileSync(path.join(process.cwd(), 'netlify', 'functions', 'toss-billing.js'), 'utf8');
  is(!/anchor_day/.test(B),
     '  ★ <b>없는 칸을 적어 보내지 않는다</b> — 보내면 PostgREST 가 400 으로 되돌려 구독 만들기가 통째로 막힙니다 (1번)');
}

head('[6] ★ 두 함수가 <b>같은 한 곳</b>을 부른다 (5번)');
{
  const B = fs.readFileSync(path.join(process.cwd(), 'netlify', 'functions', 'toss-billing.js'), 'utf8');
  const C = fs.readFileSync(path.join(process.cwd(), 'netlify', 'functions', 'toss-confirm.js'), 'utf8');
  is(/require\("\.\/_period\.js"\)/.test(B), '  toss-billing 이 _period.js 를 부른다');
  is(/require\("\.\/_period\.js"\)/.test(C), '  toss-confirm 이 _period.js 를 부른다');
  const 날글 = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');     /* 쪽지는 빼고 날글만 */
  is(!/setMonth\(|setFullYear\(/.test(날글(B)) && !/setMonth\(|setFullYear\(/.test(날글(C)),
     '  ★ <b>옛 셈(setMonth·setFullYear)이 안 남았다</b> — 한쪽만 고치면 두 곳이 다른 날을 말합니다');
  /* ⚠⚠ 처음에 <b>/anchorOf/</b> 가 날글에 있나만 봤습니다 — 그러면 맨 위
     require 줄에서 보고 통과합니다. 처음 날을 <b>안 넘기게</b> 되돌려도
     자가 안 울었습니다. 재야 하는 것은 「그 이름이 어딘가 있나」 가 아니라
     <b>부르는 그 자리에 넘기나</b> 입니다 (8번 — 틀린 자리에서 재면
     영영 안 울립니다).                                                */
  const 셈자리 = (t) => (날글(t).match(/addPeriod\s*\([^)]*\)/g) || []).join(' | ');
  is(/addPeriod\s*\(\s*now\s*,\s*cycle\s*,\s*anchorOf\s*\(/.test(날글(B)),
     '  ★ billing 이 <b>부르는 자리에서</b> 처음 날을 넘긴다 — ' + 셈자리(B));
  is(!/anchorOf/.test(날글(C)),
     '  confirm 은 한 번 사는 것이라 처음 날이 없다 — ' + 셈자리(C));
}

console.log('\n' + '─'.repeat(30));
if (bad) { console.log('✗ 빨간불 ' + bad + '곳'); process.exit(1); }
console.log('✓ 31일 구독이 서른여섯 달을 돌아도 처음 날로 돌아옵니다.');
