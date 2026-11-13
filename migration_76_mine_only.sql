/* 🔒 계약 · 제안서 · 증권 파일은 <b>담당자 본인만</b> — 판 X429
   (말씀 X161 · 설계 docs/고객한장_설계.md 4장 「보는 사람」)

   사장님 말씀 (2026-10-22) 「모두 가능하게 단 <b>본인만 볼 수 있도록</b>」 ·
                 (2026-10-22) 「그대로 하고」 · (2026-11-13) 「<b>본인만으로 좁혀</b>」

   ── 여태 어땠나 ────────────────────────────────────────────────
   policies · documents · proposals 와 coverage-docs 통이 모두
   can_see_client() 였습니다. 그 자는 셋을 참으로 봅니다 —
     ① 담당자 본인  ② 관리자(is_admin)  ③ <b>팀장</b>(is_my_teammate)
   즉 <b>팀장이 남의 고객 계약과 증권 파일을 볼 수 있었습니다.</b>
   설계 4장은 이 셋을 또렷이 가릅니다 —
     · 사람 기본(clients)      본인 · 관리자 · 팀장
     · 계약 · 제안서 · 증권    <b>본인만</b>  ← 여기
     · 청구(claims)            본인 · 관리자 (판 4 에서 팀장을 뺍니다)
     · 주민번호 · 신분증       담당자 본인만 — 관리자도 못 본다 (판 5 금고)

   ── 좁히기 전에 재어 본 것 (1번) ───────────────────────────────
   · policies 0줄 · documents 0줄 · proposals 0줄 — <b>지금 좁히면
     아무도 잃는 것이 없습니다.</b> 쌓인 뒤에 좁히면 보이던 것이 사라집니다.
   · 고객 166분이 <b>모두 담당이 있습니다</b>(advisor_id 빈 줄 0) —
     주인 없는 고객의 계약이 아무에게도 안 보이게 되는 일은 없습니다.

   ★ <b>묻는 곳을 하나로</b> 둡니다 (5번) — is_my_client() 하나이고,
     표 셋과 통 하나가 그것을 부릅니다. 조건을 네 군데 베껴 적으면
     한 곳만 고쳐지는 날이 옵니다.
   ★ claims 는 <b>한 자도 안 건드립니다</b> — 설계가 다르게 가릅니다(판 4).
   ★ 주석은 /* */ 만 씁니다 (CLAUDE.md 9번).

   되돌리려면:
     아래 여덟 규칙의 public.is_my_client 를 public.can_see_client 로
     되돌리고  drop function public.is_my_client(uuid);                  */

create or replace function public.is_my_client(cid uuid)
returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.clients c
     where c.id = cid and c.advisor_id = auth.uid()
  );
$fn$;
grant execute on function public.is_my_client(uuid) to authenticated;

/* ── 계약 ─────────────────────────────────────────────────────── */
drop policy if exists policies_by_client on public.policies;
drop policy if exists policies_mine      on public.policies;
create policy policies_mine on public.policies for all
  using (public.is_my_client(client_id))
  with check (public.is_my_client(client_id));

/* ── 서류(가입제안서 · 증권 파일) ──────────────────────────────── */
drop policy if exists documents_by_client on public.documents;
drop policy if exists documents_mine      on public.documents;
create policy documents_mine on public.documents for all
  using (public.is_my_client(client_id))
  with check (public.is_my_client(client_id));

/* ── 제안서 날짜 ──────────────────────────────────────────────── */
drop policy if exists proposals_by_client on public.proposals;
drop policy if exists proposals_mine      on public.proposals;
create policy proposals_mine on public.proposals for all
  using (public.is_my_client(client_id))
  with check (public.is_my_client(client_id));

/* ── 올린 PDF 원문이 담기는 통 ─────────────────────────────────
   폴더 첫 칸이 고객 번호입니다 — 꼴은 지금 규칙 그대로 두고
   묻는 자만 바꿉니다.                                            */
drop policy if exists coverage_docs_read   on storage.objects;
create policy coverage_docs_read on storage.objects for select
  using (bucket_id = 'coverage-docs'
         and public.is_my_client(((storage.foldername(name))[1])::uuid));

drop policy if exists coverage_docs_insert on storage.objects;
create policy coverage_docs_insert on storage.objects for insert
  with check (bucket_id = 'coverage-docs'
              and public.is_my_client(((storage.foldername(name))[1])::uuid));

drop policy if exists coverage_docs_update on storage.objects;
create policy coverage_docs_update on storage.objects for update
  using (bucket_id = 'coverage-docs'
         and public.is_my_client(((storage.foldername(name))[1])::uuid));

drop policy if exists coverage_docs_delete on storage.objects;
create policy coverage_docs_delete on storage.objects for delete
  using (bucket_id = 'coverage-docs'
         and public.is_my_client(((storage.foldername(name))[1])::uuid));
