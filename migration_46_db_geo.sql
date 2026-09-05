/* ════════════════════════════════════════════════════════════════
   DB 에 「어디」를 적을 자리를 만든다 — 지역 동선·지도용

   지금까지 위치는 지역 한 칸(「순천」)뿐이었습니다. 그 한 글자로는
   지도에 점을 찍을 수 없고, 하루 동선도 짤 수 없었습니다.

   ① dbs.addr / lat / lng      — 고객이 사는 동네(조례동, 아파트 이름)
   ② calls.appt_place / lat/lng — 그 약속을 어디서 만나기로 했는지
   ③ dbs.next_appt_place / lat/lng — 다음 약속 장소를 목록까지 끌어올림
      (migration_41 의 next_appt 와 똑같은 방식으로 따라옵니다)

   Supabase → SQL Editor 에 통째로 붙여 넣고 한 번 실행하십시오.
   여러 번 실행해도 안전합니다. migration_41 을 먼저 돌렸어야 합니다.
   ════════════════════════════════════════════════════════════════ */
set search_path = public;

/* ── ① 고객이 사는 곳 ─────────────────────────────────────────── */
do $blk$
begin
  if to_regclass('public.dbs') is null then
    raise notice 'dbs 표가 없습니다 — 건너뜁니다';
    return;
  end if;

  alter table public.dbs add column if not exists addr text;
  alter table public.dbs add column if not exists lat  double precision;
  alter table public.dbs add column if not exists lng  double precision;

  /* ── ③ 다음 약속 장소도 목록에서 바로 보이게 ── */
  alter table public.dbs add column if not exists next_appt_place text;
  alter table public.dbs add column if not exists next_appt_lat   double precision;
  alter table public.dbs add column if not exists next_appt_lng   double precision;
end
$blk$;

/* ── ② 약속 장소 ──────────────────────────────────────────────── */
do $blk$
begin
  if to_regclass('public.calls') is null then
    raise notice 'calls 표가 없습니다 — 건너뜁니다';
    return;
  end if;

  alter table public.calls add column if not exists appt_place text;
  alter table public.calls add column if not exists appt_lat   double precision;
  alter table public.calls add column if not exists appt_lng   double precision;
end
$blk$;

/* ── 약속 장소를 dbs 로 끌어올리는 규칙 ────────────────────────
   migration_41 의 sync_db_appt 를 그대로 이어받아, 날짜만이 아니라
   장소까지 같이 옮깁니다. 「가장 늦은 약속」의 장소만 남습니다 —
   그래야 목록에 뜬 날짜와 장소가 서로 다른 약속을 가리키지 않습니다. */
create or replace function public.sync_db_appt()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.db_id is not null and new.appointment_at is not null then
    update public.dbs
       set next_appt = greatest(coalesce(next_appt, new.appointment_at), new.appointment_at)
     where id = new.db_id;

    /* 이 약속이 그 사람의 가장 늦은 약속일 때만 장소를 덮어씁니다 */
    update public.dbs d
       set next_appt_place = new.appt_place,
           next_appt_lat   = new.appt_lat,
           next_appt_lng   = new.appt_lng
     where d.id = new.db_id
       and (d.next_appt is null or d.next_appt <= new.appointment_at);
  end if;
  return new;
end;
$fn$;

drop trigger if exists calls_appt_sync on public.calls;
create trigger calls_appt_sync after insert or update on public.calls
  for each row execute function public.sync_db_appt();

/* 이미 쌓여 있는 약속 장소도 한 번 옮겨 둡니다 */
update public.dbs d
   set next_appt_place = c.appt_place,
       next_appt_lat   = c.appt_lat,
       next_appt_lng   = c.appt_lng
  from public.calls c
 where c.db_id = d.id
   and c.appointment_at is not null
   and d.next_appt is not null
   and c.appointment_at = d.next_appt
   and c.appt_place is not null
   and d.next_appt_place is null;

/* ── 카카오 지도 키를 팀이 같이 쓴다 ───────────────────────────
   대표가 CRM 화면에서 한 번 넣으면 app_config 에 저장되고, 팀원은
   따로 넣지 않아도 지도가 열립니다. 여기서는 자리만 비워 둡니다. */
do $blk$
begin
  if to_regclass('public.app_config') is null then
    raise notice 'app_config 표가 없습니다 — 키는 각자 브라우저에만 저장됩니다';
    return;
  end if;
  begin
    insert into public.app_config(key, value)
    values ('kakao_js_key', '')
    on conflict (key) do nothing;
  exception when others then
    /* app_config 모양이 다르면 그냥 넘어갑니다 — 키는 각자 브라우저에 저장됩니다 */
    raise notice 'app_config 에 자리를 못 만들었습니다: %', sqlerrm;
  end;
end
$blk$;

/* ── 확인 ─────────────────────────────────────────────────────── */
select column_name
  from information_schema.columns
 where table_schema = 'public'
   and ((table_name = 'dbs'   and column_name in ('addr','lat','lng','next_appt_place','next_appt_lat','next_appt_lng'))
     or (table_name = 'calls' and column_name in ('appt_place','appt_lat','appt_lng')))
 order by table_name, column_name;
