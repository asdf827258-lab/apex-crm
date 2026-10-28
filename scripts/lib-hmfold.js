/* ══ 🧷 곁칸 접이를 편다 — 자들이 쓰는 한 곳 (판 X223) ═══════════════════
   사장님 말씀 (2026-10-26) 「지금 할것이 너무 많은 자리를 차지하고 있어」 로
   폰에서 곁칸 셋(📈 이번 주 · 💌 이번 달 관리 · 🔔 알람)이 <b>접힌 채로</b>
   섭니다. 접으면 속이 hidden 이라 자가 그냥 재면 「글이 없다」 고 읽습니다.

   ★★ <b>자를 속이지 않습니다.</b> max-height:0 으로 눈에만 안 보이게 하면
     자는 그대로 통과하는데 사장님 화면에는 아무것도 없습니다 — 그것이
     「안 울리는 알람」 입니다 (CLAUDE.md 8번). 그래서 앱은 제대로 숨기고,
     <b>자가 펴고 잽니다.</b>
   ★ 펴는 자리가 <b>한 곳</b>입니다 (5번) — 자마다 제 손으로 열면 한 자가
     꼴을 바꿀 때 나머지가 조용히 낡습니다.
   ★ 여닫는 자는 앱의 <b>hmFoldToggle 하나</b>입니다 — 여기서 창고
     (localStorage)나 hidden 을 직접 쥐지 않습니다. 이미 펴져 있으면
     아무것도 안 합니다.
   ⚠ 넓은 화면(컴퓨터)에서는 접이가 아예 없습니다 — 그때는 할 일이 없고,
     편 수 0 을 돌려줍니다. 「접이가 없다」 는 빨간불이 아닙니다.         */

/* 곁칸 접이를 모두 편다.
   돌려주는 것 — { 편수, 접힌, 머리 }
     · 편수 : 이 부름으로 펴진 접이 수 (이미 펴져 있었으면 안 셉니다)
     · 접힌 : 펴기 <b>전</b> 높이 {'side_hmMadiSideHtml': 67, …}
       ★ <b>홈이 실제로 치르는 값</b>입니다 — 사장님 화면은 접힌 것이
         기본입니다. 자가 이 수로 「정말 접혔나」 를 봅니다. 접이를 걷어
         내면 이 수가 카드 높이로 되돌아가 그 자리에서 빨간불입니다 (8번).
     · 머리 : 접힌 머리에 적힌 <b>수 한 줄</b> {'side_…': '연속 1일', …}
       ★★ 접기의 <b>값어치가 여기 있습니다</b> — 접어 두고도 수가 보여야
         펴지 않고 압니다. 이것이 비면 사장님은 세 번 눌러야 오늘을
         아십니다. 자가 이 글로 「수가 정말 적히나」 를 봅니다 (8번).
   p — playwright Page.                                                 */
async function 곁칸펴기(p) {
  const r = await p.evaluate(() => {
    const out = { 편수: 0, 접힌: {}, 머리: {} };
    try {
      /* ⚠ <b>읽기 전에 한 번 다시 그립니다.</b> 씨를 뿌린 직후에는 곁칸이
         아직 「못 읽었습니다」 꼴이라 머리에 적힐 수가 비어 있습니다 —
         그대로 읽으면 「수를 안 적는다」 고 거짓 고발을 합니다 (8번).
         다시 그리는 자는 앱의 <b>hmSidePlace 하나</b>입니다 (5번). */
      if (typeof hmSidePlace === 'function') hmSidePlace();
    } catch (e) {}
    try {
      /* 곁칸은 폰이면 #hmSideUp, 컴퓨터면 #hmSideHost 에 섭니다 —
         두 곳 다 봅니다. 자리를 정하는 자는 앱의 hmSidePlace 입니다. */
      const 상자 = ['hmSideUp', 'hmSideHost']
        .map(id => document.getElementById(id)).filter(Boolean);
      for (const b of 상자) {
        for (const f of b.querySelectorAll('.hm-fold[id^="hmFold_side_"]')) {
          const k = f.id.slice('hmFold_'.length);
          out.접힌[k] = Math.round(f.getBoundingClientRect().height);
          /* 접이 머리의 <b>둘째 줄</b>이 수입니다 — hmFoldWrap 이
             `.t` 안에 `<span>` 으로 답니다. 없으면 빈 글. */
          const sp = f.querySelector('.hm-fold-h .t span');
          out.머리[k] = sp ? (sp.textContent || '').trim() : '';
          if (f.classList.contains('on')) continue;      /* 이미 펴졌다 */
          if (typeof hmFoldToggle === 'function') { hmFoldToggle(k); out.편수++; }
        }
      }
    } catch (e) {}
    return out;
  });
  await p.waitForTimeout(400);
  return r;
}

/* ⚠ <b>「카드 길이」 를 재는 자리는 각 자가 그대로 갖습니다.</b> 접이 안에
   들어가면 `.hm-fold-b>.card` 로 한 겹 들어가 재야 뜻이 그대로입니다 —
   접이 머리(47px)는 새로 붙은 테두리라 거기 섞으면 묻는 것이 달라집니다.
   한 줄짜리라 자마다 제자리에 두었습니다(여기로 옮기면 그 자가 무엇을
   재는지 제 파일만 봐서는 알 수 없게 됩니다).                          */

module.exports = { 곁칸펴기 };
