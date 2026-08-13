/* ════════════════════════════════════════════════════════════════
   상담 약속을 고객 365일까지 들고 간다

   약속은 calls.appointment_at 에 있고, migration_41 에서 dbs.next_appt
   까지는 따라오게 했습니다. 그런데 <b>고객 365일로 넘기는 순간</b> 그
   값이 끊깁니다 — clients 에는 약속을 적을 자리가 없었습니다.

   넘기고 나면 「이 사람 언제 만나기로 했더라」를 아무 데서도 알 수
   없습니다. 그래서 clients 에도 같은 자리를 만듭니다.

   Supabase → SQL Editor 에 통째로 붙여 넣고 한 번 실행하십시오.
   여러 번 실행해도 안전합니다. migration_41 을 먼저 돌렸어야 합니다.
   ════════════════════════════════════════════════════════════════ */
set search_path = public;

/* ── 고객 365일에도 약속 자리 ─────────────────────────────────── */
do $blk$
begin
  if to_regclass('public.clients') is null then
    return;
  end if;

  alter table public.clients add column if not exists next_appt timestamptz;

  /* 이미 넘어간 사람들 것도 한 번 채워 준다.
     이름은 서버에 마스킹만 남아 있어 이름으로는 못 잇는다. 연락처가
     같은 사람을 같은 사람으로 본다 — 담당자까지 같아야 한다. */
  if exists(
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'clients' and column_name = 'phone'
  ) then
    update public.clients c
       set next_appt = d.next_appt
      from public.dbs d
     where d.phone is not null
       and d.phone <> ''
       and c.phone = d.phone
       and c.advisor_id = d.assigned_to
       and d.next_appt is not null
       and (c.next_appt is null or c.next_appt < d.next_appt);
  end if;
end
$blk$;

create index if not exists clients_next_appt_idx on public.clients(next_appt);
create index if not exists dbs_next_appt_idx on public.dbs(next_appt);
