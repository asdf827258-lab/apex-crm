/* ========================================================== */
/* 채용 대기열 (recruits) — 1단계 */
/* ···························································· */
/* 지금까지 후보의 검사 결과는 후보 휴대폰에만 남았다. 그래서 사람이 */
/* 많아지면 카톡으로 캡처를 받아 손으로 정리해야 했다. 이 표가 그 자리를 */
/* 대신한다. 후보가 제출하면 서버 함수(recruit-submit)가 service_role 로 */
/* 여기에 쌓고, 리더는 목록만 본다. */

/* 읽기: 관리자·대표, 그리고 자기에게 배정된 설계사만. */
/* 쓰기: 앱에서는 단계(stage)와 메모만 고칠 수 있다. 후보가 적어낸 값과 */
/* 검사 결과는 앱에서 못 바꾼다(서버 함수만 넣는다). */

/* ※ 성향·사주·혈액형은 당락을 가르는 데 쓰지 않는다. 이 표에 점수 칸을 */
/* 두지 않은 것도 그래서다. 정렬에 쓰는 것은 행동 신호(완주 여부, */
/* 소요 시간, 응답 일관성, 본인이 밝힌 의향)뿐이다. */
/* ========================================================== */
set search_path = public;

create table if not exists public.recruits(
  id            uuid primary key default gen_random_uuid(),
  /* 어디서 들어왔나 */
  org           text not null default '',   /* 본부/지점 */
  recruiter     text not null default '',   /* 담당 설계사 이름(링크에 담긴 값) */
  recruiter_id  uuid,   /* 담당 설계사 계정(있으면 배정) */
  source        text not null default 'link',   /* link · qr · seminar */
  /* 후보가 적어낸 것 */
  name          text not null default '',
  phone         text not null default '',
  phone_hash    text,   /* 같은 사람이 여러 번 내도 한 줄로 합친다 */
  contact_time  text not null default '',   /* 연락 가능한 시간대 */
  intent        text not null default '',   /* now · soon · maybe · no */
  memo          text not null default '',   /* 후보가 남긴 한마디 */
  /* 검사 결과 */
  gender        text not null default '',
  birth_y       int,
  birth_m       int,
  birth_d       int,
  birth_h       int,
  no_time       boolean not null default false,
  mbti          text not null default '',
  blood         text not null default '',
  day_gz        text not null default '',   /* 일주(갑자 두 글자) */
  saju          jsonb not null default '{}'::jsonb,
  answers       jsonb not null default '{}'::jsonb,
  scores        jsonb not null default '{}'::jsonb,
  consistency   int not null default 0,
  /* 행동 신호 — 우선순위를 정하는 재료 (성향이 아니다) */
  finished      boolean not null default false,   /* 48문항을 끝까지 했는가 */
  elapsed_sec   int not null default 0,   /* 검사에 걸린 시간 */
  /* 운영 */
  stage         text not null default 'new',   /* new · contacted · met · joined · hold · closed */
  owner_note    text not null default '',
  /* 개인정보 */
  consent       boolean not null default false,
  consent_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

/* 이미 만들어진 곳에서도 안전하게 돌도록 */
alter table public.recruits add column if not exists recruiter_id uuid;
alter table public.recruits add column if not exists phone_hash   text;
alter table public.recruits add column if not exists day_gz       text not null default '';
alter table public.recruits add column if not exists owner_note   text not null default '';
alter table public.recruits add column if not exists elapsed_sec  int  not null default 0;
alter table public.recruits add column if not exists updated_at   timestamptz not null default now();

create index if not exists recruits_created_idx  on public.recruits(created_at desc);
create index if not exists recruits_stage_idx    on public.recruits(stage, created_at desc);
create index if not exists recruits_owner_idx    on public.recruits(recruiter_id, created_at desc);
/* 같은 번호로 다시 내면 새 줄을 만들지 않고 기존 줄을 갱신한다 */
create unique index if not exists recruits_phone_uniq
  on public.recruits(phone_hash) where phone_hash is not null;

alter table public.recruits enable row level security;

/* 읽기 — 관리자·대표, 또는 자기에게 배정된 건 */
drop policy if exists recruits_read on public.recruits;
create policy recruits_read on public.recruits
  for select to authenticated
  using (public.is_admin() or public.is_owner() or recruiter_id = auth.uid());

/* 고치기 — 같은 범위. 단, 고칠 수 있는 칸은 아래 grant 로 묶는다 */
drop policy if exists recruits_update on public.recruits;
create policy recruits_update on public.recruits
  for update to authenticated
  using (public.is_admin() or public.is_owner() or recruiter_id = auth.uid())
  with check (public.is_admin() or public.is_owner() or recruiter_id = auth.uid());

/* 지우기 — 관리자·대표만 */
drop policy if exists recruits_delete on public.recruits;
create policy recruits_delete on public.recruits
  for delete to authenticated
  using (public.is_admin() or public.is_owner());

revoke all on public.recruits from anon, authenticated;

grant select on public.recruits to authenticated;
grant delete on public.recruits to authenticated;
/* 앱에서 고칠 수 있는 것은 진행 단계·메모·담당자뿐. */
/* 후보가 적어낸 값과 검사 결과는 앱에서 못 바꾼다. */
grant update (stage, owner_note, recruiter_id, updated_at) on public.recruits to authenticated;
/* insert 권한은 아무에게도 주지 않는다. 서버 함수(service_role)만 넣는다. */

/* 보관기간 — 지난 건은 지운다. 기본 180일. */
create or replace function public.recruits_purge(p_days int default 180)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if not (public.is_admin() or public.is_owner()) then
    return 0;
  end if;
  delete from public.recruits
   where created_at < now() - (greatest(p_days, 30) || ' days')::interval
     and stage <> 'joined';
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.recruits_purge(int) from public;
grant execute on function public.recruits_purge(int) to authenticated;

/* schema_version 은 적지 않는다. 메인은 47 이후로 이 값을 더 이상
   쓰지 않는데, 여기서 적으면 라이브(47)를 더 낮은 숫자로 되돌려
   버린다. 버전 표시는 버려진 칸이라 건드리지 않는다. */
notify pgrst, 'reload schema';

select
  to_regclass('public.recruits') is not null                        as 채용대기열_표,
  (select count(*) from public.recruits)                            as 후보수,
  (select count(*) from public.recruits where stage = 'new')         as 새로_들어온_건,
  (select count(*) from public.recruits where finished)              as 끝까지_검사한_사람,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'recruits')          as 정책수,
  to_regprocedure('public.recruits_purge(int)') is not null          as 보관기간_정리함수;
