/* 💬 팀원 약속 — 판 X569
   (사장님 말씀 2026-11-26 「숫자와 내용까지, 각 담당 지점장이 알람으로 보고 받게」)

   ── 무엇을 담나 ─────────────────────────────────────────────────
   팀원이 카톡에서 고객에게 한 약속 한 줄(누구에게 · 무엇을 · 언제까지).
   ★ 카톡 원문은 <b>안 담습니다</b> — 앱이 AI 로 한 줄을 뽑은 뒤 원문을 버립니다.
   ★ 고객 이름은 <b>가운데 글자를 가린 꼴</b>(김*수)만 담습니다 (CLAUDE.md 3번).
     앱(app/promise-rule.js 의 maskName · maskText)이 가리고, 아래 트리거가 한 번 더 봅니다.
   ★ 고객에게 자동으로 보내는 칸은 없습니다.

   ── 누가 보나 ───────────────────────────────────────────────────
     본인            읽기 · 쓰기 · 고치기 · 지우기
     지점장 · 팀장   (role leader · branch_manager) 자기 팀 사람 것 읽기만
     대표            (role admin · owner · master) 전부 읽기만
   ★ 팀은 <b>team_members</b> 로 봅니다 — 앱의 팀원 권한 관리가 쓰는 표입니다.
     profiles.team_id 는 team_members 와 28줄이 어긋나 있어 쓰지 않습니다(2026-11-26 재어 봄).
     teams.leader_id 는 비어 있어 쓰지 않습니다.
   ★ 「자기 팀」 은 <b>지금</b> 같은 팀인지로 봅니다 — 팀을 옮기면 새 지점장이 봅니다.
     team_id 칸은 적은 때의 팀을 남겨 두는 기록입니다(알람의 팀별 숫자).
   ⚠ leads_team() 은 쓰지 않습니다 — 그 자는 branch_manager 를 <b>모든 팀</b>으로 봅니다.
     이 표에서 지점장은 자기 팀만 봅니다.

   ── 묻는 곳은 하나 ──────────────────────────────────────────────
   tp_can_read(member) 하나가 「이 사람의 약속을 내가 읽어도 되나」 를 답합니다 (5번).
   새 SECURITY DEFINER 함수는 public · anon 에서 거두고 authenticated 에만 줍니다.

   되돌리려면:
     drop table if exists public.team_promises;
     drop function if exists public.tp_can_read(uuid);
     drop function if exists public.tp_fill();                                    */

create table if not exists public.team_promises (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  team_id     uuid references public.teams(id) on delete set null,
  text        text not null check (char_length(text) between 1 and 200),
  who         text check (who is null or char_length(who) <= 20),
  due         date,
  time        time,
  status      text not null default 'open' check (status in ('open','done')),
  created_at  timestamptz not null default now(),
  done_at     timestamptz,
  client_id   uuid
);
create index if not exists team_promises_member_idx on public.team_promises(member_id, status);
create index if not exists team_promises_open_idx   on public.team_promises(status) where status = 'open';

/* ── 이 사람의 약속을 내가 읽어도 되나 ──────────────────────────── */
create or replace function public.tp_can_read(member uuid)
returns boolean
language sql stable security definer set search_path = public as $fn$
  select member = auth.uid()
      or exists (select 1 from public.profiles p
                  where p.id = auth.uid() and coalesce(p.active, true)
                    and p.role in ('admin','owner','master'))
      or exists (select 1
                   from public.profiles me
                   join public.team_members mine on mine.member_id = me.id
                   join public.team_members his  on his.team_id   = mine.team_id
                  where me.id = auth.uid() and coalesce(me.active, true)
                    and me.role in ('leader','branch_manager')
                    and his.member_id = member);
$fn$;
revoke all on function public.tp_can_read(uuid) from public, anon;
grant execute on function public.tp_can_read(uuid) to authenticated;

/* ── 적을 때 — 주인 · 팀 · 끝낸 시각은 서버가 채웁니다 ─────────────
   ★ member_id 는 언제나 본인(auth.uid()) — 남의 이름으로 못 적습니다.
   ★ team_id 는 team_members 에서 — 앱이 보낸 값은 안 믿습니다.
   ★ who 가 한글 이름 꼴(2~5자)인데 가린 표시(* ○)가 없으면 가운데를 가립니다.  */
create or replace function public.tp_fill()
returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  if tg_op = 'INSERT' then
    new.member_id := auth.uid();
    select tm.team_id into new.team_id
      from public.team_members tm where tm.member_id = auth.uid() limit 1;
    new.created_at := now();
  else
    new.member_id  := old.member_id;
    new.team_id    := old.team_id;
    new.created_at := old.created_at;
  end if;
  if new.who is not null and new.who ~ '^[가-힣]{2,5}$' then
    new.who := case when char_length(new.who) = 2 then left(new.who, 1) || '*'
                    else left(new.who, 1) || repeat('*', char_length(new.who) - 2) || right(new.who, 1) end;
  end if;
  if new.status = 'done' and new.done_at is null then new.done_at := now(); end if;
  if new.status = 'open' then new.done_at := null; end if;
  return new;
end;
$fn$;
revoke all on function public.tp_fill() from public, anon;

drop trigger if exists team_promises_fill on public.team_promises;
create trigger team_promises_fill before insert or update on public.team_promises
  for each row execute function public.tp_fill();

/* ── 규칙 ─────────────────────────────────────────────────────── */
alter table public.team_promises enable row level security;

drop policy if exists team_promises_read   on public.team_promises;
drop policy if exists team_promises_insert on public.team_promises;
drop policy if exists team_promises_update on public.team_promises;
drop policy if exists team_promises_delete on public.team_promises;

create policy team_promises_read on public.team_promises for select
  to authenticated using (public.tp_can_read(member_id));
create policy team_promises_insert on public.team_promises for insert
  to authenticated with check (member_id = auth.uid());
create policy team_promises_update on public.team_promises for update
  to authenticated using (member_id = auth.uid()) with check (member_id = auth.uid());
create policy team_promises_delete on public.team_promises for delete
  to authenticated using (member_id = auth.uid());

revoke all on public.team_promises from anon;
grant select, insert, update, delete on public.team_promises to authenticated;
