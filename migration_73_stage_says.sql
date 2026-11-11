/* 💬 TA 첫 마디 — 사장님이 고치시면 팀 모두가 같은 말을 씁니다 (판 X412)
   사장님 말씀 (2026-11-11) — 「보장분석 신청 한 사람들 멘트가 너무 별로여서
   내가 수정하고 공유할수 있도록 만들어, 수정은 오직 운영자만 가능하도록」

   ★ 원래 말은 apex-stage.js 의 TA_SRC 에 그대로 둡니다 — 이 표는 덮어쓰기
     한 겹입니다. 줄을 지우면 원래 말로 돌아옵니다 (6번).
   ★ 고치신 칸만 담습니다 — 안 적으신 칸은 null 이고 원래 말이 섭니다 (1번).
   ★ 고객 자료는 한 글자도 안 담깁니다 (3번).
   ★ 쓰기는 is_owner() 뿐입니다. 대표 이메일(app_config.owner_email)이
     정해져 있어 그 한 분입니다 — 화면만 가리면 안 되고 서버가 막아야 합니다. */
create table if not exists public.stage_says (
  k            text primary key,
  t            text,
  say          text,
  tip          text,
  updated_at   timestamptz not null default now(),
  updated_by   uuid        references auth.users(id) on delete set null,
  updated_name text
);

alter table public.stage_says enable row level security;

/* 읽기 — 로그인한 팀원 모두. 같은 말을 써야 하니까 */
drop policy if exists stage_says_read on public.stage_says;
create policy stage_says_read on public.stage_says
  for select using (auth.uid() is not null);

/* 쓰기 — 오직 운영자 */
drop policy if exists stage_says_write on public.stage_says;
create policy stage_says_write on public.stage_says
  for all using (is_owner()) with check (is_owner());

comment on table public.stage_says is
  'TA 첫 마디 덮어쓰기 — 읽기는 로그인 전원, 쓰기는 is_owner() 만. 줄을 지우면 apex-stage.js 의 원래 말로 돌아갑니다.';
