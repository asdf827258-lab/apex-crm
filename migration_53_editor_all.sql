/* ════════════════════════════════════════════════════════════════
   대표·본부장이 팀원 고객을 <b>고치지 못하던 것</b> — 그런데 화면은
   「됐습니다」라고 말하던 것

   2026-09-21 · 사장님 말씀 「홈화면에서 다 되게하자 했는데 안된다」.

   migration_52 는 <b>보는 쪽</b>을 맞췄습니다. 이번 것은 <b>고치는 쪽</b>입니다.

     역할             인원   남의 줄 읽기   남의 줄 고치기(전)
     member           25    ✗              ✗   ← 앱도 서버도 같음, 정상
     leader            5    ○(팀)          ✗   ← 앱은 단추를 줬다
     admin             3    ○              ○   정상
     master            2    ○              ✗   ← 앱은 단추를 줬다
     branch_manager    1    ○              ✗   ← 앱은 단추를 줬다

   문지기가 갈렸습니다 —
     읽기  is_viewer_all()  admin·owner·master·hq·branch_manager
     쓰기  is_admin()       admin·owner                      ← 여기만 좁았다

   ★ 제일 나쁜 것은 그 다음입니다. Supabase 는 RLS 로 막힌 UPDATE·DELETE 를
     <b>에러가 아니라 「0줄 바뀜」</b>으로 돌려줍니다. 앱은 error 만 보고
     성공으로 쳐서 화면을 바꾸고 「홍길동 님 · TA → AP」 토스트까지 띄웠습니다.
     <b>새로고침하면 원래대로.</b> 진짜 DB 에 대표 계정으로 눌러 재 봤습니다 —
     팀원 고객을 바꾸면 0줄, 지우면 0줄, 화면은 「됐습니다」.
     (앱 쪽은 app/index.html 의 hdbWrote 가 이제 돌려준 줄을 셉니다.)

   ★ <b>지점장(leader)은 안 넣습니다</b> — 사장님이 「대표·본부장까지」로
     정하셨습니다(2026-09-21). 지점장에게는 앱이 단추를 아예 안 내주고
     왜 안 되는지, 누가 할 수 있는지 적습니다.

   ★ 읽기(is_viewer_all)와 쓰기(is_editor_all)를 <b>따로</b> 둡니다. 오늘은
     명단이 같지만 <b>같은 물음이 아닙니다</b> — 한쪽을 넓힐 때 다른 쪽이
     말없이 따라가면 안 됩니다.
   ════════════════════════════════════════════════════════════════ */

create or replace function public.is_editor_all()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists(
    select 1 from public.profiles
     where id = auth.uid()
       and role in ('admin','owner','master','hq','branch_manager')
       and coalesce(active, true) = true
  );
$$;

grant execute on function public.is_editor_all() to authenticated;

/* ── 배정 DB ─────────────────────────────────────────────────────── */
drop policy if exists dbs_update on public.dbs;
create policy dbs_update on public.dbs
  for update
  using       (public.is_editor_all() or assigned_to = auth.uid())
  with check  (public.is_editor_all() or assigned_to = auth.uid());

drop policy if exists dbs_insert on public.dbs;
create policy dbs_insert on public.dbs
  for insert
  with check  (public.is_editor_all() or assigned_to = auth.uid());

drop policy if exists dbs_delete_own on public.dbs;
create policy dbs_delete_own on public.dbs
  for delete
  using (
    public.is_editor_all()
    or assigned_to = auth.uid()
    or (public.is_team_viewer() and exists (
          select 1
            from public.team_members me
            join public.team_members him on him.team_id = me.team_id
           where me.member_id = auth.uid()
             and him.member_id = dbs.assigned_to))
  );

/* ── 통화 기록 ───────────────────────────────────────────────────── */
drop policy if exists calls_insert on public.calls;
create policy calls_insert on public.calls
  for insert
  with check (
    created_by = auth.uid()
    and (public.is_editor_all()
         or exists (select 1 from public.dbs d
                     where d.id = calls.db_id and d.assigned_to = auth.uid()))
  );

drop policy if exists calls_update on public.calls;
create policy calls_update on public.calls
  for update
  using (
    public.is_editor_all()
    or exists (select 1 from public.dbs d
                where d.id = calls.db_id and d.assigned_to = auth.uid())
  )
  with check (
    public.is_editor_all()
    or exists (select 1 from public.dbs d
                where d.id = calls.db_id and d.assigned_to = auth.uid())
  );

drop policy if exists calls_delete_own on public.calls;
create policy calls_delete_own on public.calls
  for delete
  using (
    public.is_editor_all()
    or created_by = auth.uid()
    or exists (select 1 from public.dbs d
                where d.id = calls.db_id and d.assigned_to = auth.uid())
  );

/* ── 고객 365 ─────────────────────────────────────────────────────
   같은 병이 여기에도 있었습니다. clients_update 는 with check 가 없던
   그대로 둡니다 — 담당자 넘기기를 여기서 막으면 이번에 안 물어보신
   것까지 바뀝니다. */
drop policy if exists clients_update on public.clients;
create policy clients_update on public.clients
  for update
  using (advisor_id = auth.uid() or public.is_editor_all());

drop policy if exists clients_insert on public.clients;
create policy clients_insert on public.clients
  for insert
  with check (advisor_id = auth.uid() or public.is_editor_all());

drop policy if exists clients_delete on public.clients;
create policy clients_delete on public.clients
  for delete
  using (advisor_id = auth.uid() or public.is_editor_all());

/* ── 넣은 뒤 진짜로 눌러 확인한 값 (rollback 하고 잰 것) ─────────────
     대표(master)   팀원 고객 바꾸기  0줄 → <b>1줄</b>   내 고객 1줄
     지점장(leader) 팀원 고객 바꾸기  0줄 → <b>0줄</b>   내 고객 1줄  (그대로)
   ════════════════════════════════════════════════════════════════ */
