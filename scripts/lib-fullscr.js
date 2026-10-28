/* 🪟 <b>전체화면으로 빠져나가는 화면</b>이 어느 것인가 — 묻는 곳은 하나다.

   `go()` 안에서 <code>if(tab==='X'){ … osFullMode('무엇') … return; }</code> 인
   화면은 <b>덮개</b>로 열립니다. 덮개가 서면 <code>.app</code> 이 통째로 숨고,
   목업 옷이 붙는 <code>#dynPane</code> 이 그 안에 있어 <b>옷이 안 보입니다.</b>

   ★★ 그래서 이 화면들은 —
     · <b>T_SKIN 에 적으면 안 됩니다</b>(check-skin2) — 적으면 수만 줄고
       화면은 그대로라, 「됐다」 고 <b>거짓이 적힙니다</b>.
     · <b>「옷 안 입은 화면」 으로 세어도 안 됩니다</b>(check-skinmap) —
       입힐 수가 없는 것을 「아직 안 입혔다」 고 세는 것이라, 눈금이
       <b>영원히 안 내려갑니다.</b> 덮개를 하나 만들 때마다 늘기만 합니다.

   ⚠ <b>두 자가 따로 세고 있었습니다.</b> check-skin2 는 코드에서 찾아내는데
     check-skinmap 은 그냥 T_SKIN 밖을 다 셌습니다. 그래서 2026-10-23 에
     덮개(교육 캘린더)를 하나 만들자 <b>한 자는 「T_SKIN 에 적지 마라」,
     다른 자는 「T_SKIN 에 적어라」</b> 고 서로 반대로 울었습니다.
     묻는 곳을 하나로 둡니다 (CLAUDE.md 5번).

   ⚠ <b>정규식으로 블록을 뜨지 마십시오.</b> check-skin2 가 처음에
     <code>[\s\S]{0,420}?</code> 로 떴다가 안쪽 <code>if(window.innerWidth&lt;=880)
     {…}</code> 의 닫는 괄호에서 끊겨 열한 개 중 <b>0개</b>를 찾았습니다.
     그물이 비면 그 자는 <b>언제나 초록</b>입니다 — 안 잡는 자였습니다.
     <b>중괄호를 세서</b> 블록을 통째로 뜹니다.                          */
'use strict';

/** app/index.html 의 글에서 덮개로 열리는 화면을 찾는다.
 *  @returns {Array<[string,string]>} [화면id, 몸에 붙는 이름] 의 목록 */
function 덮개화면(src) {
  const go = src.slice(src.indexOf('function go(tab){'));
  const out = [];
  const re = /if\s*\(\s*tab\s*===\s*'([a-z_0-9]+)'\s*\)\s*\{/g;
  let g;
  while ((g = re.exec(go))) {
    let i = g.index + g[0].length - 1, d = 0, end = -1;
    for (let k = i; k < go.length && k < i + 4000; k++) {
      if (go[k] === '{') d++;
      else if (go[k] === '}') { d--; if (!d) { end = k; break; } }
    }
    if (end < 0) continue;
    const body = go.slice(i, end);
    const mo = body.match(/osFullMode\(\s*'([a-z-]+)'\s*\)/);
    if (mo && mo[1] && /\breturn\s*;/.test(body))
      if (!out.some(x => x[0] === g[1])) out.push([g[1], mo[1]]);
  }
  /* openBa() 로 나가는 frmake 는 osFullMode('') 라 위 그물에 안 걸립니다 —
     <b>제 전용 화면(#baScreen)이 덮으므로</b> 똑같이 옷이 안 보입니다. */
  if (/if\(tab==='frmake'\)\{\s*osFullMode\(''\);\s*openBa\(\);\s*return;/.test(go))
    out.push(['frmake', '']);
  return out;
}

/** 화면 id 만 */
function 덮개이름(src) { return 덮개화면(src).map(x => x[0]); }

/* ⚠ <b>그물이 비면 두 자가 다 조용히 초록이 됩니다.</b> 그래서 부르는 쪽이
   수를 한 번 더 보게 이 바닥을 같이 내놓습니다 — 지금 열둘입니다.      */
const 적어도 = 11;

module.exports = { 덮개화면, 덮개이름, 적어도 };
