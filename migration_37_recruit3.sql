/* ============================================================ */
/* 채용 4단계 — 무엇이 통했는지 재기 위한 시각 기록                */
/* ············································································ */
/* 1~3단계로 받고 · 고르고 · 대응하는 일은 돌아간다. 그런데 무엇이      */
/* 통했는지는 아무도 모른다. 특히 우선순위 점수가 실제 입사와 상관이    */
/* 있는지 확인할 방법이 없었다. 점수가 틀렸으면 틀렸다고 말해 주는      */
/* 장치가 있어야 한다.                                                    */
/*                                                                        */
/*   contacted_at  처음 연락한 시각. 접수에서 여기까지 걸린 시간이       */
/*                 채용에서 가장 힘센 한 가지 지표다.                    */
/*   met_at        처음 면담한 시각.                                     */
/*   joined_at     입사한 시각.                                          */
/*                                                                        */
/* 셋 다 "처음" 한 번만 적는다. 단계를 뒤로 돌렸다가 다시 와도 처음     */
/* 시각은 그대로 둔다 — 응답 속도를 되감아 좋게 만들 수 없어야 한다.    */
/* ============================================================ */
set search_path = public;

alter table public.recruits add column if not exists contacted_at timestamptz;
alter table public.recruits add column if not exists met_at       timestamptz;
alter table public.recruits add column if not exists joined_at    timestamptz;

create index if not exists recruits_joined_idx on public.recruits(joined_at)
  where joined_at is not null;

grant update (stage, owner_note, recruiter_id, updated_at, next_at, assigned_at,
              contacted_at, met_at, joined_at)
  on public.recruits to authenticated;

insert into public.app_config(key, value)
values ('schema_version', '37')
on conflict (key) do update set value = excluded.value, updated_at = now();

notify pgrst, 'reload schema';

select
  (select count(*) from public.recruits)                              as 후보수,
  (select count(*) from public.recruits where contacted_at is not null) as 연락한_건,
  (select count(*) from public.recruits where met_at is not null)       as 면담한_건,
  (select count(*) from public.recruits where joined_at is not null)    as 입사한_건,
  (select round(avg(extract(epoch from (contacted_at - created_at)) / 3600)::numeric, 1)
     from public.recruits where contacted_at is not null)               as 첫연락까지_평균시간;
