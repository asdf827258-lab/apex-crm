/* ════════════════════════════════════════════════════════════════
   접촉 기록을 고칠 수 있게, 그리고 단계를 계약까지 잇는다

   ① 통화 기록 수정·삭제
      저장이 오류로 두세 번 들어가는 일이 있고, 결과를 잘못 고른 일도
      있다. 그런데 지금까지 한 번 남긴 기록은 <b>손댈 수 없었다.</b>
      그 기록이 그대로 남으면 타율이 통째로 틀어진다.
      본인이 남긴 것은 본인이, 팀 것은 리더가 고칠 수 있게 한다.

   ② 단계에 「계약완료」와 「증권전달」
      지금 단계는 미접촉 → TA → AP → PC → CS 에서 끝난다. 계약이
      되고 증권을 전달하는 데까지가 실제 일인데 그 자리가 없었다.

   Supabase → SQL Editor 에 통째로 붙여 넣고 한 번 실행하십시오.
   여러 번 실행해도 안전합니다.
   ════════════════════════════════════════════════════════════════ */
set search_path = public;

/* ── ① 내가 손댈 수 있는 통화 기록인가 ────────────────────────
   본인이 남긴 것 / 대표·운영자 / 내가 리더인 팀의 팀원이 남긴 것.
   다른 함수에 기대지 않고 혼자 판단한다. */
create or replace function public.can_edit_call(author uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select
    author = auth.uid()
    or exists(
         select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin','owner','master','hq','operator','branch_manager')
       )
    or exists(
         select 1
           from public.teams t
           join public.team_members tm on tm.team_id = t.id
          where t.leader_id = auth.uid()
            and tm.member_id = author
       );
$fn$;
grant execute on function public.can_edit_call(uuid) to authenticated;

do $blk$
begin
  if to_regclass('public.calls') is null then
    return;
  end if;

  grant select, insert, update, delete on public.calls to authenticated;

  /* 이미 열려 있는 규칙이 있으면 건드리지 않는다 — 전체 허용 정책이
     남아 있는 환경에서 이 파일이 오히려 문을 좁히면 안 된다. */
  if exists(
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'calls' and cmd = 'DELETE'
  ) then
    raise notice 'calls 에 삭제 규칙이 이미 있습니다 — 그대로 둡니다';
  else
    execute 'create policy calls_own_delete on public.calls
               for delete to authenticated
               using (public.can_edit_call(created_by))';
  end if;

  if exists(
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'calls' and cmd in ('UPDATE','ALL')
  ) then
    raise notice 'calls 에 수정 규칙이 이미 있습니다 — 그대로 둡니다';
  else
    execute 'create policy calls_own_update on public.calls
               for update to authenticated
               using (public.can_edit_call(created_by))
               with check (public.can_edit_call(created_by))';
  end if;
end
$blk$;

/* ── ② 단계 — 계약완료 · 증권전달 ─────────────────────────────
   기존 값(미접촉·TA·AP·PC·CS)은 그대로 두고 두 개를 <b>더한다.</b>
   제약이 걸려 있으면 풀고 새 목록으로 다시 건다. */
do $blk$
declare
  c record;
begin
  if to_regclass('public.dbs') is null then
    return;
  end if;

  for c in
    select conname from pg_constraint
     where conrelid = 'public.dbs'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) like '%stage%'
  loop
    execute format('alter table public.dbs drop constraint %I', c.conname);
  end loop;

  alter table public.dbs add column if not exists stage text;
  alter table public.dbs add column if not exists contracted_at timestamptz;
  alter table public.dbs add column if not exists policy_sent_at timestamptz;
  alter table public.dbs add column if not exists policy_no text;

  execute $chk$
    alter table public.dbs add constraint dbs_stage_chk
      check (stage is null or stage in
        ('미접촉','TA','AP','PC','CS','계약완료','증권전달'))
  $chk$;
end
$blk$;

create index if not exists dbs_stage_idx on public.dbs(stage);
create index if not exists dbs_contracted_idx on public.dbs(contracted_at desc);

/* ── 상담 약속 시각을 잃지 않게 ────────────────────────────────
   약속은 calls.appointment_at 에만 있었다. 그 DB 를 고객으로 넘길 때
   따라가지 못해 약속이 사라졌다. dbs 에도 <b>가장 늦은 약속</b>을 적어
   둔다 — 넘길 때 이 값을 그대로 들고 간다. */
alter table public.dbs add column if not exists next_appt timestamptz;

create or replace function public.sync_db_appt()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.db_id is not null and new.appointment_at is not null then
    update public.dbs
       set next_appt = greatest(coalesce(next_appt, new.appointment_at), new.appointment_at)
     where id = new.db_id;
  end if;
  return new;
end;
$fn$;

drop trigger if exists calls_appt_sync on public.calls;
create trigger calls_appt_sync after insert or update on public.calls
  for each row execute function public.sync_db_appt();

/* 이미 쌓여 있는 약속도 한 번 옮겨 둔다 */
update public.dbs d
   set next_appt = s.mx
  from (select db_id, max(appointment_at) mx
          from public.calls
         where appointment_at is not null
         group by db_id) s
 where s.db_id = d.id
   and (d.next_appt is null or d.next_appt < s.mx);
