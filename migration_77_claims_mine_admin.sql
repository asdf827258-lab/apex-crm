/* 🧾 청구(claims)는 <b>담당자 본인 · 관리자</b>만 — 판 X447
   (말씀 X161 판 4 · 설계 docs/고객한장_설계.md 4장 「보는 사람」)

   migration_76 이 <b>제 손으로 적어 둔 자리</b>입니다 —
     "★ claims 는 한 자도 안 건드립니다 — 설계가 「본인 · 관리자」 로
      가릅니다(판 4)."
   그 판 4 가 이것입니다.

   ── 여태 어땠나 ────────────────────────────────────────────────
   claims 의 규칙은 claims_by_client = can_see_client(client_id) 였습니다.
   그 자는 셋을 참으로 봅니다 — ① 담당자 본인 ② 관리자(is_admin)
   ③ <b>팀장</b>(is_my_teammate).
   즉 <b>팀장이 남의 고객 청구를 볼 수 있었습니다.</b> 그리고 claims 에는
   diagnosis · kcd_code · treatment · surgery · admit_type 이 있습니다 —
   <b>병력</b>입니다. 계약·증권보다 더 좁혀야 하는 자리인데 더 넓었습니다.

   설계 4장은 넷을 또렷이 가릅니다 —
     · 사람 기본(clients)      본인 · 관리자 · 팀장
     · 계약 · 제안서 · 증권    본인만                  (판 X430 에서 했습니다)
     · 청구(claims)            <b>본인 · 관리자</b>     ← 여기
     · 주민번호 · 신분증       본인만 — 관리자도 못 본다 (판 5 금고)

   ── 좁히기 전에 재어 본 것 (1번) ───────────────────────────────
   · claims <b>0줄</b> · aftercare_tasks <b>0줄</b> — 지금 좁히면
     <b>아무도 잃는 것이 없습니다.</b> 쌓인 뒤에 좁히면 보이던 것이 사라집니다.
   · 고객 166분이 모두 담당이 있습니다(advisor_id 빈 줄 0) — 주인 없는
     고객의 청구가 아무에게도 안 보이게 되는 일은 없습니다.

   ★ <b>묻는 곳을 하나로</b> 둡니다 (5번) — is_my_client_or_admin() 하나이고,
     그 자는 <b>본인을 또 적지 않고</b> 판 X430 의 is_my_client() 를 부릅니다.
     「본인이란 무엇인가」 가 두 곳에 적히면 한 곳만 고쳐지는 날이 옵니다.
   ★ aftercare_tasks 는 <b>한 자도 안 건드립니다</b> — 사후관리 할 일은
     병력이 아니고, 설계가 따로 가르지 않았습니다. 넓게 잡아 같이 좁히면
     설계에 없는 일을 제 손으로 정하는 것입니다 (1번 · 8번).
   ★ 주석은 별표 주석만 씁니다 — 두 줄표(마이너스 둘)를 안 씁니다 (CLAUDE.md 9번).

   되돌리려면:
     create or replace 로 claims_by_client 를 can_see_client 로 되돌리고
     drop function public.is_my_client_or_admin(uuid);                   */

create or replace function public.is_my_client_or_admin(cid uuid)
returns boolean
language sql stable security definer set search_path = public as $fn$
  select public.is_admin() or public.is_my_client(cid);
$fn$;
grant execute on function public.is_my_client_or_admin(uuid) to authenticated;

/* ── 청구 ─────────────────────────────────────────────────────── */
drop policy if exists claims_by_client  on public.claims;
drop policy if exists claims_mine_admin on public.claims;
create policy claims_mine_admin on public.claims for all
  using (public.is_my_client_or_admin(client_id))
  with check (public.is_my_client_or_admin(client_id));
