/* ============================================================ */
/* 채용 3단계 — 후속 일정과 담당자 배정                           */
/* ············································································ */
/* 2단계까지는 "지금 누구부터 전화할까"를 풀었다. 3단계는 그 다음이다.  */
/*                                                                        */
/*   next_at     다음에 다시 꺼낼 날. 지금 연락할 사람이 아니라           */
/*               석 달 뒤에 다시 볼 사람을 잊지 않기 위한 칸이다.         */
/*   assigned_at 담당자가 정해진 시각. 설명회처럼 한 링크로 여럿이        */
/*               들어온 건을 나눠 맡을 때 쓴다.                           */
/*                                                                        */
/* ※ 세그먼트(지금·숙성·장기·미완주)는 표에 저장하지 않는다. 행동 신호로 */
/*   그때그때 계산한다. 저장해 두면 신호가 바뀌어도 낡은 값이 남는다.     */
/* ============================================================ */
set search_path = public;

alter table public.recruits add column if not exists next_at     timestamptz;
alter table public.recruits add column if not exists assigned_at timestamptz;

create index if not exists recruits_next_idx on public.recruits(next_at)
  where next_at is not null;

/* 앱에서 고칠 수 있는 칸에 둘을 더한다. 후보가 적어낸 값과 검사 결과는 */
/* 여전히 앱에서 못 바꾼다.                                              */
grant update (stage, owner_note, recruiter_id, updated_at, next_at, assigned_at)
  on public.recruits to authenticated;

/* 담당자 없는 건을 팀원들에게 돌아가며 나눠 맡긴다.                     */
/* 관리자·대표만 쓸 수 있고, 이미 담당자가 있는 건은 건드리지 않는다.    */
create or replace function public.recruits_assign(p_ids uuid[], p_owner uuid)
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
  if p_owner is null or not exists (select 1 from public.profiles where id = p_owner) then
    return 0;
  end if;
  update public.recruits
     set recruiter_id = p_owner,
         assigned_at  = now(),
         updated_at   = now()
   where id = any(p_ids)
     and recruiter_id is null;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.recruits_assign(uuid[], uuid) from public;
grant execute on function public.recruits_assign(uuid[], uuid) to authenticated;

/* schema_version 은 적지 않는다. 메인은 47 이후로 이 값을 더 이상
   쓰지 않는데, 여기서 적으면 라이브(47)를 더 낮은 숫자로 되돌려
   버린다. 버전 표시는 버려진 칸이라 건드리지 않는다. */
notify pgrst, 'reload schema';

select
  to_regclass('public.recruits') is not null                          as 채용대기열_표,
  (select count(*) from public.recruits where next_at is not null)     as 후속_예약된_건,
  (select count(*) from public.recruits where recruiter_id is null)    as 담당자_없는_건,
  to_regprocedure('public.recruits_assign(uuid[],uuid)') is not null   as 일괄배정_함수;
