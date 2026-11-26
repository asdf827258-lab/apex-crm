/* ============================================================ */
/* 내 설정을 계정에 — user_prefs (판 X572)                          */
/* ············································································ */
/* 사장님 말씀 (2026-11-26) 「기기마다 따로가 아니도록 해줘야지」.       */
/*                                                                        */
/* 새 오늘 화면의 🤖 자비스 「내가 더한 메뉴」 · 🌱 신입 도움말 스위치가 */
/* 이 기기(localStorage)에만 남아 폰 · PC 가 따로 놀았다.                */
/* 사람마다 한 줄 — 그 사람만 읽고 쓴다(팀장 · 대표도 남의 줄은 못 봄).  */
/* kv 는 작은 JSON 한 덩이: { ai_mine: [메뉴 id …], newhelp: 0|1 }       */
/* 고객 정보는 담지 않는다(메뉴 id 와 켜짐 표시뿐).                      */
/* ============================================================ */
set search_path = public;

create table if not exists public.user_prefs(
  owner_id   uuid primary key default auth.uid(),
  kv         jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_prefs enable row level security;

drop policy if exists user_prefs_own_select on public.user_prefs;
create policy user_prefs_own_select on public.user_prefs
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists user_prefs_own_insert on public.user_prefs;
create policy user_prefs_own_insert on public.user_prefs
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists user_prefs_own_update on public.user_prefs;
create policy user_prefs_own_update on public.user_prefs
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

revoke all on public.user_prefs from anon, authenticated;
grant select, insert, update on public.user_prefs to authenticated;
/* delete 는 주지 않는다 — 비우려면 kv 를 {} 로 */

/* schema_version 은 적지 않는다(migration_84 와 같은 까닭 — 라이브 값을 낮추지 않게). */
notify pgrst, 'reload schema';

select to_regclass('public.user_prefs') is not null as 내설정_표,
       (select count(*) from public.user_prefs)       as 줄_수;
