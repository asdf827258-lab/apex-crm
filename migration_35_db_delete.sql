/* ════════════════════════════════════════════════════════════════
   본인에게 배정된 DB 는 본인이 지울 수 있게 한다

   지금까지 삭제는 운영자만 할 수 있었다.
     using (public.is_admin())

   그런데 잘못 배정된 DB, 중복으로 들어온 DB 를 정리하는 사람은
   그걸 실제로 돌리는 본인이다. 매번 운영자에게 부탁해야 하면
   아무도 안 지우고 화면에 쓰레기가 쌓인다.

   바뀌는 것:
     - 본인에게 배정된 DB 는 본인이 지운다
     - 지점장·본부장은 자기 팀 것을 지운다
     - 운영자는 전부 지운다
     - 남의 것은 여전히 못 지운다

   통화 기록은 dbs 를 지우면 함께 지워진다 (on delete cascade).

   이 파일은 몇 번을 다시 실행해도 안전하다.
   ════════════════════════════════════════════════════════════════ */

drop policy if exists "dbs_admin_delete" on public.dbs;
drop policy if exists "dbs_delete_own" on public.dbs;

create policy "dbs_delete_own" on public.dbs for delete to authenticated
using (
  public.is_admin()
  or assigned_to = auth.uid()
  or (
    public.is_team_viewer()
    and exists (
      select 1
      from public.team_members me
      join public.team_members him on him.team_id = me.team_id
      where me.member_id = auth.uid()
        and him.member_id = public.dbs.assigned_to
    )
  )
);

/* 통화 기록도 같은 규칙으로 지운다.
   DB 는 남기고 잘못 남긴 통화 한 건만 지우고 싶을 때가 있다. */
drop policy if exists "calls_delete_own" on public.calls;

create policy "calls_delete_own" on public.calls for delete to authenticated
using (
  public.is_admin()
  or created_by = auth.uid()
  or exists (
    select 1 from public.dbs d
    where d.id = public.calls.db_id
      and d.assigned_to = auth.uid()
  )
);
