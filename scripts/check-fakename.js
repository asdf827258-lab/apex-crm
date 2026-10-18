/* 🙎 견본 이름이 <b>한눈에 가짜</b>인가 — 판 X124

   사장님 말씀 (2026-10-18) — 폰 사진에서 「김철수」 를 보시고 「응 고쳐줘」.
   CLAUDE.md 3번 — 「점검·견본 데이터에는 <b>「홍길동」</b>을 쓴다.
   <b>실제 고객 이름 금지.</b>」

   화면에 「김철수」 「박서준」 처럼 <b>진짜 같은 이름</b>이 서 있으면, 보는
   사람이 그것이 견본인지 진짜 고객인지 가릴 수 없습니다. 저장소는 이미
   가짜 이름 식구를 씁니다 — 홍길동·홍길순·홍갑돌·홍말순·홍판서·임꺽정·
   이몽룡·성춘향·변학도. 그 식구만 쓰면 한눈에 견본입니다.

   ── 어떻게 재나 ──────────────────────────────────────────────
   ⚠ <b>이름처럼 생긴 글자를 찾아내지 않습니다.</b> 처음에 그렇게 짰다가
     「나스닥」 「배우자」 「제조업」 「안정형」 을 이름이라고 <b>19개나 고발</b>
     했습니다. 한국말 낱말과 사람 이름은 글자꼴로 못 가릅니다 —
     <b>헛것을 잡는 자는 안 잡는 자보다 나쁩니다</b> (8번).
   ★ 그래서 <b>이미 찾아낸 규약 밖 이름의 목록</b>으로 잽니다. 돌아오는
     것을 막는 자이지, 새로 지어낸 이름을 찾아내는 자가 아닙니다 —
     그 한계를 여기 적어 둡니다 (1번).

   여기서 확인한다.
     1. <b>app/ · db-crm.html 에는 0</b> — 사장님이 보는 화면
     2. scripts/ 는 <b>기준선</b> — 늘면 빨간불, 줄이면 손으로 내린다
     3. ⚠ <b>목각(docs/mokgak · docs/APEX_목각*)은 안 본다</b> — 디자이너가
        준 원본이라 우리가 고칠 자리가 아니다 (사장님 지시)
     4. 자가 가짜 이름 식구를 <b>헛되이 잡지 않는다</b>                      */
const fs = require('fs'), path = require('path');

/* 저장소에서 찾아낸 <b>규약 밖 이름</b> — 돌아오면 빨간불.
   새로 쓰실 때는 아래 가짜 식구 중에서 골라 주십시오. */
const 규약밖 = ['김철수','김민수','김영희','김성호','김지점','김팀장',
               '박서준','박정은','박영수','이강주','이하늘','이지훈','이지점',
               '최유진','최영숙','최민수','최민아','최영수',
               '정다은','정하늘','강태오','강옥분','한소희','오준혁',
               '윤도현','조민석','조혜인'];
/* 써도 되는 <b>가짜 이름 식구</b> — 늘려도 됩니다 */
const 가짜 = ['홍길동','홍길순','홍갑돌','홍말순','홍판서','홍철호','홍기동','홍정돌',
             '임꺽정','이몽룡','성춘향','변학도'];

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const 훑기 = (뿌리) => {
  const out = {};
  const go = (d) => {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f), rel = p.replace(/^\.\//, '');
      if (f === 'node_modules' || f.startsWith('.')) continue;
      if (/^docs\/(mokgak|APEX_목각)/.test(rel)) continue;   /* 목각은 안 본다 */
      /* ★ <b>자기 자신</b>은 안 센다 — 규약 밖 목록이 이 파일 안에 있어서,
         안 빼면 자가 스스로를 고발하고 기준선이 영영 한 칸 부풀어 있습니다. */

      if (fs.statSync(p).isDirectory()) { go(p); continue; }
      if (!/\.(html|js|css)$/.test(f)) continue;
      const s = fs.readFileSync(p, 'utf8');
      for (const w of 규약밖) {
        const n = s.split(w).length - 1;
        if (n) (out[rel] = out[rel] || []).push(w + '×' + n);
      }
    }
  };
  if (fs.existsSync(뿌리)) {
    if (fs.statSync(뿌리).isDirectory()) go(뿌리);
    else {
      const s = fs.readFileSync(뿌리, 'utf8'), rel = 뿌리.replace(/^\.\//, '');
      for (const w of 규약밖) { const n = s.split(w).length - 1;
        if (n) (out[rel] = out[rel] || []).push(w + '×' + n); }
    }
  }
  return out;
};

console.log('\n[1] 사장님이 보는 화면 — app/ · db-crm.html 에는 0');
const A = Object.assign(훑기('./app'), 훑기('./db-crm.html'));
const 파일A = Object.keys(A);
is(파일A.length === 0, '  규약 밖 이름을 쓰는 파일 ' + 파일A.length + '개' +
   (파일A.length ? ('\n      ✗ ' + 파일A.slice(0, 8).map(f => f + ' [' + A[f].join(',') + ']').join('\n      ✗ ')) : ''));

console.log('\n[2] 자(scripts/) — 기준선 안쪽인가');
/* ★ 자들은 「박서준」 같은 이름을 <b>씨앗</b>으로 쓰고 그 글자로 견줍니다.
   한꺼번에 바꾸면 견주는 자리까지 같이 손봐야 해서 한 판에 못 합니다.
   늘지만 않게 못 박아 두고, 줄일 때마다 이 수를 손으로 내립니다 (0-1번). */
const S_BASE = 25;
const S = 훑기('./scripts');
const 파일S = Object.keys(S);
is(파일S.length <= S_BASE, '  규약 밖 이름을 쓰는 자 ' + 파일S.length + '개 — 기준선 ' + S_BASE +
   (파일S.length > S_BASE ? ('\n      ✗ 늘었습니다: ' + 파일S.slice(0, 10).join(' ')) : ''));
if (파일S.length < S_BASE)
  console.log('      ↓ 줄었습니다 — 이 자의 S_BASE 를 ' + 파일S.length + ' 로 내려 주십시오');

console.log('\n[3] 가짜 이름 식구는 헛되이 안 잡는다 (8번)');
const 겹침 = 가짜.filter(w => 규약밖.indexOf(w) >= 0);
is(겹침.length === 0, '  가짜 식구 ' + 가짜.length + '명이 규약 밖 목록에 없다');
const 낱말 = ['나스닥','배우자','제조업','안정형','현대차','진단비','연락처','고객님'];
const 헛 = 낱말.filter(w => 규약밖.indexOf(w) >= 0);
is(헛.length === 0, '  한국말 낱말 ' + 낱말.length + '개를 이름으로 안 센다 — 헛것 ' + 헛.length + '개');

console.log('\n[4] 목각은 안 본다 (사장님 지시)');
const 목각 = ['docs/mokgak', 'docs/APEX_목각.html', 'docs/APEX_목각_폰.html']
  .filter(p => fs.existsSync(p));
is(목각.length > 0, '  목각 원본이 그대로 있다 — ' + 목각.length + '자리 (건드리지 않습니다)');

console.log('\n──────────────────────────────');
console.log(bad ? ('✗ 고칠 자리 ' + bad + '곳') : '✓ 견본 이름이 한눈에 가짜입니다');
process.exit(bad ? 1 : 0);
