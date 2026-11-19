/* ============================================================ */
/* 채용 6단계 — 입사 이후. 13주 정착을 재기 위한 칸                */
/* ············································································ */
/* 1~5단계는 "입사"에서 끝났다. 그런데 보험업에서 입사는 성공이 아니다.  */
/* 13주를 못 넘기고 나가면 뽑느라 쓴 시간이 통째로 사라진다. 4단계의     */
/* 점수 검증도 "입사"를 성공으로 보고 있었는데, 그건 중간 지점이지       */
/* 결과가 아니다.                                                         */
/*                                                                        */
/*   started_at   위촉·출근을 시작한 날. 주차는 여기서부터 센다.         */
/*                입사 단계로 옮긴 날과 다를 수 있어 따로 받는다.        */
/*   left_at      그만둔 날. 비어 있으면 아직 하고 있다는 뜻이다.        */
/*   left_reason  왜 나갔는지. 다음 채용에서 가장 값진 정보다.           */
/*                                                                        */
/* 13주 정착 = started_at 에서 13주가 지났고, left_at 이 비어 있음.      */
/* ============================================================ */
set search_path = public;

alter table public.recruits add column if not exists started_at  timestamptz;
alter table public.recruits add column if not exists left_at     timestamptz;
alter table public.recruits add column if not exists left_reason text not null default '';

create index if not exists recruits_started_idx on public.recruits(started_at)
  where started_at is not null;

grant update (stage, owner_note, recruiter_id, updated_at, next_at, assigned_at,
              contacted_at, met_at, joined_at, started_at, left_at, left_reason)
  on public.recruits to authenticated;

/* schema_version 은 적지 않는다. 메인은 47 이후로 이 값을 더 이상
   쓰지 않는데, 여기서 적으면 라이브(47)를 더 낮은 숫자로 되돌려
   버린다. 버전 표시는 버려진 칸이라 건드리지 않는다. */
notify pgrst, 'reload schema';

select
  (select count(*) from public.recruits where joined_at is not null)   as 입사,
  (select count(*) from public.recruits where started_at is not null)  as 위촉,
  (select count(*) from public.recruits
     where started_at is not null and left_at is null
       and started_at < now() - interval '13 weeks')                   as 정착_13주,
  (select count(*) from public.recruits where left_at is not null)     as 이탈,
  (select round(avg(extract(epoch from (left_at - started_at)) / 604800)::numeric, 1)
     from public.recruits where left_at is not null and started_at is not null)
                                                                        as 이탈까지_평균주차;
