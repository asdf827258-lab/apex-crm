/* ════════════════════════════════════════════════════════════════════════
   40) 개인 계좌 잠금 — 팀에 열어도 내 자산은 안 보이게

   Supabase → SQL Editor 에 통째로 붙여넣고 실행하세요. 여러 번 실행해도 안전합니다.

   ── 무엇이 문제였나 ──────────────────────────────────────────────────────
   투자 표 여섯 개의 읽기 정책이 전부 이랬다:

       owner_id = auth.uid() or is_leader() or is_admin() or is_owner()

   원래 이 모듈은 "설계사가 고객 계좌를 관리하고 팀장이 감독한다" 는 용도라
   그게 맞았다. 그런데 대표 본인의 개인 자산을 같은 표에 넣으면, 팀장을 한 명
   만드는 순간 그 사람이 대표 자산을 전부 보게 된다.

   ── 무엇을 바꾸나 ────────────────────────────────────────────────────────
   invest_accounts 에 private 칸을 두고, 켜진 계좌는 본인만 보게 한다.

                      고객 계좌      개인 계좌(private)
       본인             볼 수 있음      볼 수 있음
       팀장·관리자       볼 수 있음      🔒 못 봄
       일반 설계사       못 봄          못 봄

   감독 기능은 그대로 두고 개인 계좌만 잠근다.
   야간 작업·리포트는 서비스 롤 키로 돌아 RLS 를 지나가므로 그대로 동작한다.

   ⚠️ 기본값은 private = false 다. 기존 계좌의 보임 범위는 하나도 바뀌지 않는다.
      개인 계좌로 쓸 것만 앱에서 '개인 계좌' 로 체크하면 된다.
   ════════════════════════════════════════════════════════════════════════ */
set search_path = public;

/* ── ① 표시 칸 ────────────────────────────────────────────────────────── */
alter table public.invest_accounts
  add column if not exists private boolean not null default false;

comment on column public.invest_accounts.private is
  '개인 계좌 — 켜면 팀장·관리자도 못 본다. 본인만 본다.';

create index if not exists invest_accounts_private_idx
  on public.invest_accounts(owner_id, private);

/* ── ② 판정 함수 ──────────────────────────────────────────────────────────
   security definer 로 둔다. 자식 표(보유·거래내역 등)의 정책이 부모 표
   invest_accounts 를 다시 조회하는데, 그때 부모의 RLS 가 또 걸리면
   재귀하거나 조용히 빈 결과가 나온다. 함수 안에서는 RLS 를 지나가게 한다.

   is_leader() 는 이미 admin·owner 를 포함한다(role in
   ('admin','owner','lead','manager','leader','master') or is_owner()).
   그래서 여기서 is_admin()·is_owner() 를 또 나열하지 않는다.        */

create or replace function public.invest_can_read(acc uuid, own uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select
    own = auth.uid()
    or (
      public.is_leader()
      and acc is not null
      and exists (
        select 1 from public.invest_accounts a
         where a.id = acc and coalesce(a.private, false) = false
      )
    );
$fn$;
grant execute on function public.invest_can_read(uuid, uuid) to authenticated;

/* 고칠 수 있는 범위는 더 좁다 — 관리자만, 그것도 개인 계좌가 아닐 때만 */
create or replace function public.invest_can_write(acc uuid, own uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select
    own = auth.uid()
    or (
      public.is_admin()
      and acc is not null
      and exists (
        select 1 from public.invest_accounts a
         where a.id = acc and coalesce(a.private, false) = false
      )
    );
$fn$;
grant execute on function public.invest_can_write(uuid, uuid) to authenticated;

/* ── ③ 계좌 표 (부모 — private 이 여기 있으니 함수를 안 쓴다) ──────────── */
drop policy if exists invest_accounts_read on public.invest_accounts;
create policy invest_accounts_read on public.invest_accounts
  for select to authenticated
  using (owner_id = auth.uid() or (public.is_leader() and coalesce(private, false) = false));

drop policy if exists invest_accounts_update on public.invest_accounts;
create policy invest_accounts_update on public.invest_accounts
  for update to authenticated
  using (owner_id = auth.uid() or (public.is_admin() and coalesce(private, false) = false))
  with check (owner_id = auth.uid() or (public.is_admin() and coalesce(private, false) = false));

drop policy if exists invest_accounts_delete on public.invest_accounts;
create policy invest_accounts_delete on public.invest_accounts
  for delete to authenticated
  using (owner_id = auth.uid() or (public.is_admin() and coalesce(private, false) = false));

/* ── ④ 자식 표 여섯 개 ────────────────────────────────────────────────── */

/* 보유 종목 */
drop policy if exists invest_holdings_read on public.invest_holdings;
create policy invest_holdings_read on public.invest_holdings
  for select to authenticated using (public.invest_can_read(account_id, owner_id));
drop policy if exists invest_holdings_update on public.invest_holdings;
create policy invest_holdings_update on public.invest_holdings
  for update to authenticated
  using (public.invest_can_write(account_id, owner_id))
  with check (public.invest_can_write(account_id, owner_id));
drop policy if exists invest_holdings_delete on public.invest_holdings;
create policy invest_holdings_delete on public.invest_holdings
  for delete to authenticated using (public.invest_can_write(account_id, owner_id));

/* 거래내역 */
drop policy if exists invest_txns_read on public.invest_txns;
create policy invest_txns_read on public.invest_txns
  for select to authenticated using (public.invest_can_read(account_id, owner_id));
drop policy if exists invest_txns_update on public.invest_txns;
create policy invest_txns_update on public.invest_txns
  for update to authenticated
  using (public.invest_can_write(account_id, owner_id))
  with check (public.invest_can_write(account_id, owner_id));
drop policy if exists invest_txns_delete on public.invest_txns;
create policy invest_txns_delete on public.invest_txns
  for delete to authenticated using (public.invest_can_write(account_id, owner_id));

/* 일별 평가액 */
drop policy if exists invest_nav_read on public.invest_nav;
create policy invest_nav_read on public.invest_nav
  for select to authenticated using (public.invest_can_read(account_id, owner_id));

/* 목표 배분 */
drop policy if exists invest_targets_read on public.invest_targets;
create policy invest_targets_read on public.invest_targets
  for select to authenticated using (public.invest_can_read(account_id, owner_id));
drop policy if exists invest_targets_update on public.invest_targets;
create policy invest_targets_update on public.invest_targets
  for update to authenticated
  using (public.invest_can_write(account_id, owner_id))
  with check (public.invest_can_write(account_id, owner_id));
drop policy if exists invest_targets_delete on public.invest_targets;
create policy invest_targets_delete on public.invest_targets
  for delete to authenticated using (public.invest_can_write(account_id, owner_id));

/* 리포트 (월간·아침 브리핑) */
drop policy if exists invest_reports_read on public.invest_reports;
create policy invest_reports_read on public.invest_reports
  for select to authenticated using (public.invest_can_read(account_id, owner_id));

/* 전략 신호 — account_id 가 비어 있을 수 있다.
   그 경우 위 함수가 false 를 돌려주므로 본인만 보게 된다. 안전한 쪽으로 둔다. */
drop policy if exists invest_signals_read on public.invest_signals;
create policy invest_signals_read on public.invest_signals
  for select to authenticated using (public.invest_can_read(account_id, owner_id));
drop policy if exists invest_signals_update on public.invest_signals;
create policy invest_signals_update on public.invest_signals
  for update to authenticated
  using (public.invest_can_write(account_id, owner_id))
  with check (public.invest_can_write(account_id, owner_id));

/* ── ⑤ 시황 브리핑 — 여기에도 구멍이 있었다 ──────────────────────────────
   invest_briefs 는 두 가지를 한 표에 담는다:
     kind='market_daily' → 오늘의 시황. 계좌와 무관한 공개 글이다.
     kind='account'      → 계좌별 브리핑. 남의 자산 이야기다.
   그런데 읽기 정책이 using (true) 였다 — 로그인한 사람 누구나 계좌별
   브리핑까지 읽을 수 있었다. 계좌가 붙은 글은 그 계좌의 보임 범위를 따르게 한다.
   이 표에는 owner_id 칸이 없어서 계좌를 거쳐 판정한다.                    */
create or replace function public.invest_brief_can_read(acc uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select
    acc is null                                     /* 시황 — 계좌와 무관, 팀 공개 */
    or exists (
      select 1 from public.invest_accounts a
       where a.id = acc
         and ( a.owner_id = auth.uid()
               or ( public.is_leader() and coalesce(a.private, false) = false ) )
    );
$fn$;
grant execute on function public.invest_brief_can_read(uuid) to authenticated;

do $$
begin
  if to_regclass('public.invest_briefs') is not null then
    execute 'drop policy if exists invest_briefs_read on public.invest_briefs';
    execute 'create policy invest_briefs_read on public.invest_briefs
               for select to authenticated
               using (public.invest_brief_can_read(account_id))';
  end if;
end $$;

/* ── ⑥ 알림 표가 있으면 같이 잠근다 (33번에서 만들어진다) ──────────────── */
do $$
begin
  if to_regclass('public.invest_alerts') is not null then
    execute 'drop policy if exists invest_alerts_read on public.invest_alerts';
    execute 'create policy invest_alerts_read on public.invest_alerts
               for select to authenticated
               using (public.invest_can_read(account_id, owner_id))';
  end if;
end $$;

notify pgrst, 'reload schema';

/* ── ⑦ 확인 ────────────────────────────────────────────────────────────
   컬럼 이름을 따옴표로 감싼다. 브라우저 자동번역이 한글 별칭을 건드려
   "독서판정함수" 같은 엉뚱한 머리글이 나오는 걸 줄인다.

   ⚠️ to_regproc 을 쓰면 안 된다. 그건 인자 목록을 못 읽어서
      to_regproc('f(uuid,uuid)') 가 함수가 멀쩡히 있어도 null 을 돌려준다.
      실제로 이 자리에서 한 번 틀렸다. 시그니처로 찾을 때는 to_regprocedure 다. */
select
  exists(select 1 from information_schema.columns
          where table_schema='public' and table_name='invest_accounts'
            and column_name='private')                              as "개인계좌칸(t면정상)",
  (select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public'
      and p.proname in ('invest_can_read','invest_can_write','invest_brief_can_read')
  )                                                                 as "판정함수(3이면정상)",
  (select count(*) from pg_policies
    where schemaname='public' and qual like '%invest_can_read%')    as "새정책적용(6이상)",
  (select coalesce(bool_and(coalesce(private,false) = false), true)
     from public.invest_accounts)                                   as "기존계좌_공개유지(t)",
  (select qual from pg_policies
    where schemaname='public' and tablename='invest_briefs'
      and cmd='SELECT')                                             as "브리핑정책";
