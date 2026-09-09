/* ════════════════════════════════════════════════════════════════
   계정 삭제가 늘 실패하던 것 — 매달린 기록을 먼저 옮긴다

   「계정 삭제」를 눌러도 지워지지 않았습니다. 화면은 서버가 한 말을
   그대로 보여 주고 있었는데, 고칠 자리가 서버였습니다.

   까닭은 이렇습니다. profiles 를 가리키는 표가 <b>34개</b>이고, 그중
   다섯은 <b>비울 수 없는 필수 칸</b>입니다.

     dbs.assigned_to          ← 고객 1,049명이 여기 매달려 있습니다
     calls.created_by
     clients.advisor_id
     consultations.advisor_id
     coaching_records.coach_id

   예전 함수는 hard=true 로 <b>개수 검사만 건너뛰었을 뿐</b> 이 줄들을
   그대로 두고 delete 를 했습니다. 외래키가 막아 언제나 실패했습니다.

   이제 세 갈래로 갑니다.

     ① 넘겨받을 사람(heir)을 주면 — 고객·통화·상담을 그 사람에게 옮기고
        계정을 지웁니다. <b>고객 자료는 하나도 안 없어집니다.</b>
     ② heir 없이 hard=true 면 — 매달린 줄까지 <b>같이 지웁니다.</b>
        그 사람의 고객·통화가 사라집니다. 되돌릴 수 없습니다.
     ③ heir 도 없고 hard 도 아니면 — 무엇이 몇 건 걸렸는지 말하고 멈춥니다.

   ★ 가리키는 표를 <b>손으로 적어 두지 않습니다.</b> 34개를 적어 두면 표가
     하나 늘 때마다 여기가 낡아, 어느 날 다시 못 지우게 됩니다. 지금
     스키마에서 읽어 처리합니다.

   ★ <b>누가 했는지</b>를 적어 두는 칸(audit_logs.actor_id 처럼 비울 수 있는
     칸)은 heir 로 <b>안 바꿉니다.</b> 남이 한 일을 다른 사람이 한 것처럼
     만들면 그 기록이 거짓이 됩니다. 비웁니다.

   Supabase → SQL Editor 에 통째로 붙여 넣고 한 번 실행하십시오.
   여러 번 실행해도 안전합니다.
   ════════════════════════════════════════════════════════════════ */
set search_path = public;

/* ── 무엇이 몇 건 걸렸는지 표별로 ────────────────────────────── */
create or replace function public.admin_account_refs_json(target uuid)
returns jsonb language plpgsql security definer set search_path = public, auth as $fn$
declare r record; n bigint; out jsonb := '[]'::jsonb;
begin
  if not public.is_owner() then
    raise exception '대표만 볼 수 있습니다';
  end if;
  for r in
    select c.conrelid::regclass::text as tbl, a.attname as col, a.attnotnull as req
      from pg_constraint c
      join unnest(c.conkey) with ordinality k(attnum, ord) on true
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
     where c.contype = 'f'
       and c.confrelid = 'public.profiles'::regclass
       and c.confdeltype in ('a', 'r')
     order by a.attnotnull desc, 1, 2
  loop
    execute format('select count(*) from %s where %I = $1', r.tbl, r.col)
      into n using target;
    if n > 0 then
      out := out || jsonb_build_object('t', r.tbl, 'c', r.col, 'n', n, 'req', r.req);
    end if;
  end loop;
  return out;
end;
$fn$;

/* 개수만 묻던 옛 함수는 위 하나를 그대로 씁니다 — 세는 자리가 둘이 되면
   화면에 뜬 숫자와 서버가 막는 숫자가 어긋납니다 */
create or replace function public.admin_account_refs(target uuid)
returns integer language sql security definer set search_path = public as $fn$
  select coalesce(sum((e->>'n')::bigint), 0)::integer
    from jsonb_array_elements(public.admin_account_refs_json(target)) e;
$fn$;

/* ── 삭제 ─────────────────────────────────────────────────────── */
drop function if exists public.admin_delete_account(uuid, boolean);
drop function if exists public.admin_delete_account(uuid, boolean, uuid);

create or replace function public.admin_delete_account(
  target uuid, hard boolean default false, heir uuid default null)
returns text language plpgsql security definer set search_path = public, auth as $fn$
declare
  em text; oe text; r record; blocked text := ''; moved integer := 0;
begin
  if not public.is_owner() then
    raise exception '대표만 계정을 삭제할 수 있습니다';
  end if;
  if target = auth.uid() then
    raise exception '본인 계정은 삭제할 수 없습니다';
  end if;

  select u.email into em from auth.users u where u.id = target;
  if em is null then
    raise exception '없는 계정입니다';
  end if;

  select value into oe from public.app_config where key = 'owner_email' limit 1;
  if oe is not null and lower(btrim(em)) = lower(btrim(oe)) then
    raise exception '대표 계정은 삭제할 수 없습니다';
  end if;

  if heir is not null then
    if heir = target then
      raise exception '넘겨받을 사람이 지울 사람과 같습니다';
    end if;
    if not exists(select 1 from public.profiles where id = heir) then
      raise exception '넘겨받을 사람을 찾을 수 없습니다';
    end if;
  end if;

  /* 스키마에서 읽어 처리합니다 — 표 이름을 여기 적어 두지 않습니다 */
  for r in
    select c.conrelid::regclass::text as tbl, a.attname as col, a.attnotnull as req
      from pg_constraint c
      join unnest(c.conkey) with ordinality k(attnum, ord) on true
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
     where c.contype = 'f'
       and c.confrelid = 'public.profiles'::regclass
       and c.confdeltype in ('a', 'r')
  loop
    if r.req then
      /* 비울 수 없는 칸 — 고객·통화·상담이 여기 매달려 있습니다 */
      if heir is not null then
        execute format('update %s set %I = $1 where %I = $2', r.tbl, r.col, r.col)
          using heir, target;
        get diagnostics moved = row_count;
      elsif hard then
        execute format('delete from %s where %I = $1', r.tbl, r.col) using target;
      else
        execute format('select count(*) from %s where %I = $1', r.tbl, r.col)
          into moved using target;
        if moved > 0 then
          blocked := blocked || r.tbl || '.' || r.col || ' ' || moved || '건, ';
        end if;
      end if;
    else
      /* 「누가 했는가」를 적는 칸은 남에게 넘기지 않고 비웁니다 */
      execute format('update %s set %I = null where %I = $1', r.tbl, r.col, r.col)
        using target;
    end if;
  end loop;

  if blocked <> '' then
    raise exception '이 계정에 매달린 기록이 있습니다 — %. 넘겨받을 사람을 정하거나, 기록까지 함께 지우기를 고르십시오.',
      rtrim(blocked, ', ');
  end if;

  delete from public.profiles where id = target;
  delete from auth.users where id = target;
  return em;
end;
$fn$;

grant execute on function public.admin_account_refs_json(uuid)      to authenticated;
grant execute on function public.admin_account_refs(uuid)           to authenticated;
grant execute on function public.admin_delete_account(uuid, boolean, uuid) to authenticated;

/* ── 확인 ─────────────────────────────────────────────────────── */
select p.proname as 함수, pg_get_function_identity_arguments(p.oid) as 인자
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('admin_delete_account', 'admin_account_refs', 'admin_account_refs_json')
 order by 1;
