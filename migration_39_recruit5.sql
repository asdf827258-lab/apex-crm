/* ============================================================ */
/* 채용 7단계 — 현장에 내보내기 전 마지막 준비                     */
/* ············································································ */
/* 둘을 넣는다.                                                           */
/*                                                                        */
/* 1) ip_hash — 같은 자리에서 쏟아지는 장난 제출을 막기 위한 칸.         */
/*    원본 주소(IP)는 저장하지 않는다. 소금을 섞어 해시만 남긴다.        */
/*    누가 어디서 들어왔는지 알아내려는 칸이 아니라, 한 자리에서 몇 번   */
/*    넣었는지만 세기 위한 칸이다.                                       */
/*                                                                        */
/* 2) recruit_sends — 문자를 언제 누구에게 몇 건 보냈는지 적는 표.       */
/*    돈이 나가는 일이라 기록이 남아야 한다. 넣는 것은 서버 함수만 하고, */
/*    읽는 것은 관리자·대표만 한다.                                      */
/* ============================================================ */
set search_path = public;

alter table public.recruits add column if not exists ip_hash text;

create index if not exists recruits_ip_idx on public.recruits(ip_hash, created_at desc)
  where ip_hash is not null;

create table if not exists public.recruit_sends(
  id          uuid primary key default gen_random_uuid(),
  sent_by     uuid,
  sent_name   text not null default '',
  segment     text not null default '',
  total       int  not null default 0,
  ok_count    int  not null default 0,
  fail_count  int  not null default 0,
  dry_run     boolean not null default false,
  note        text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists recruit_sends_created_idx on public.recruit_sends(created_at desc);

alter table public.recruit_sends enable row level security;

drop policy if exists recruit_sends_read on public.recruit_sends;
create policy recruit_sends_read on public.recruit_sends
  for select to authenticated
  using (public.is_admin() or public.is_owner() or sent_by = auth.uid());

revoke all on public.recruit_sends from anon, authenticated;
grant select on public.recruit_sends to authenticated;
/* insert 권한은 아무에게도 주지 않는다 — 서버 함수(service_role)만 적는다 */

insert into public.app_config(key, value)
values ('schema_version', '39')
on conflict (key) do update set value = excluded.value, updated_at = now();

notify pgrst, 'reload schema';

select
  (select count(*) from public.recruits where ip_hash is not null)  as 자리표시_있는_건,
  to_regclass('public.recruit_sends') is not null                   as 발송기록_표,
  (select count(*) from public.recruit_sends where not dry_run)     as 실제_발송_묶음,
  (select coalesce(sum(ok_count), 0) from public.recruit_sends
     where not dry_run)                                             as 보낸_건수;
