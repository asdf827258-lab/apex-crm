/* ════════════════════════════════════════════════════════════════════════
   39) 투자 성과 관리 — 거래내역 · 일별 평가액 · 목표배분 · 월간 리포트

   33번(투자·경제)을 먼저 실행한 뒤에 이걸 실행하세요.

   왜 거래내역 표가 필요한가
     지금은 보유 종목의 수량·평단만 있어서 "(평가액-원금)/원금" 밖에 못 낸다.
     그 값은 추가납입이 한 번이라도 있으면 틀린다. 언제 얼마를 넣고 뺐는지
     남겨야 XIRR(실제 번 돈)과 TWR(운용 솜씨)을 제대로 낼 수 있다.

   ⚠️ 이 시스템은 주문을 넣지 않는다. 기록·분석·제안까지만 한다.
   ════════════════════════════════════════════════════════════════════════ */
set search_path = public;

do $$
begin
  if to_regclass('public.invest_accounts') is null then
    raise exception 'migration_33_invest.sql 을 먼저 실행하세요 (invest_accounts 표가 없습니다).';
  end if;
end $$;

/* ── ① 거래내역 — 성과 계산의 원장 ─────────────────────────────────────── */
create table if not exists public.invest_txns(
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.invest_accounts(id) on delete cascade,
  owner_id uuid not null,
  txn_date date not null,
  kind text not null,                    /* buy | sell | deposit | withdraw | dividend | fee */
  code text default '',                  /* 종목코드 (입출금이면 빈 값) */
  name text default '',
  qty numeric,
  price numeric,
  amount numeric not null,               /* 금액(양수로 저장. 방향은 kind 로 판단) */
  currency text default 'KRW',
  memo text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists invest_txns_acc_idx  on public.invest_txns(account_id, txn_date);
create index if not exists invest_txns_owner_idx on public.invest_txns(owner_id);

/* 금액은 양수만 — 부호로 방향을 표현하면 반드시 헷갈린다 */
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'invest_txns_amount_pos') then
    alter table public.invest_txns add constraint invest_txns_amount_pos check (amount >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'invest_txns_kind_ok') then
    alter table public.invest_txns add constraint invest_txns_kind_ok
      check (kind in ('buy','sell','deposit','withdraw','dividend','fee'));
  end if;
end $$;

/* ── ② 일별 평가액 — TWR 계산의 재료 ───────────────────────────────────── */
create table if not exists public.invest_nav(
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.invest_accounts(id) on delete cascade,
  owner_id uuid not null,
  nav_date date not null,
  value numeric not null,                /* 그날 종가 기준 평가액 */
  flow numeric default 0,                /* 그날 순유입 (계좌 기준: 들어오면 +) */
  src text default 'auto',
  created_at timestamptz default now()
);

create unique index if not exists invest_nav_uni on public.invest_nav(account_id, nav_date);
create index if not exists invest_nav_date_idx on public.invest_nav(nav_date desc);

/* ── ③ 목표 자산배분 — 리밸런싱 판정 기준 ──────────────────────────────── */
create table if not exists public.invest_targets(
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.invest_accounts(id) on delete cascade,
  owner_id uuid not null,
  asset_class text not null,             /* 국내주식 | 해외주식 | 채권 | 현금 | 기타 */
  target_pct numeric not null default 0,
  band_pct numeric not null default 5,   /* 이만큼 벗어나면 알림 */
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists invest_targets_uni on public.invest_targets(account_id, asset_class);

/* ── ④ 월간 리포트 — 계좌별로 매달 하나 ────────────────────────────────── */
create table if not exists public.invest_reports(
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.invest_accounts(id) on delete cascade,
  owner_id uuid not null,
  period text not null,                  /* 'YYYY-MM' */
  title text default '',
  body text default '',
  stats jsonb default '{}'::jsonb,       /* xirr, twr, 벤치마크 대비 등 근거 수치 */
  src text default 'auto',
  created_at timestamptz default now()
);

create unique index if not exists invest_reports_uni on public.invest_reports(account_id, period);
create index if not exists invest_reports_period_idx on public.invest_reports(period desc);

/* ── ⑤ 전략 신호 — 모의만. 주문은 나가지 않는다 ────────────────────────── */
create table if not exists public.invest_signals(
  id uuid primary key default gen_random_uuid(),
  account_id uuid,
  owner_id uuid not null,
  ref_date date not null default current_date,
  strategy text not null,                /* 전략 이름 */
  code text not null,
  name text default '',
  side text not null,                    /* buy | sell */
  reason text default '',                /* 왜 이 신호가 났는지 (사람이 읽는 근거) */
  price numeric,
  strength numeric default 0,            /* 0~100 */
  paper boolean not null default true,   /* 항상 true — 모의 전용이라는 표시 */
  acted boolean default false,           /* 설계사가 실제로 처리했는지 (수동 체크) */
  created_at timestamptz default now()
);

create unique index if not exists invest_signals_uni on public.invest_signals(account_id, strategy, code, ref_date);
create index if not exists invest_signals_owner_idx on public.invest_signals(owner_id, ref_date desc);

/* 이 표에 실주문 기록이 섞여 들어오지 못하게 못을 박는다 */
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'invest_signals_paper_only') then
    alter table public.invest_signals add constraint invest_signals_paper_only check (paper = true);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'invest_signals_side_ok') then
    alter table public.invest_signals add constraint invest_signals_side_ok check (side in ('buy','sell'));
  end if;
end $$;

/* ════════════════════════════════════════════════════════════════════════
   RLS — 고객 자산 원장이라 33번과 같은 기준으로 잠근다
   ════════════════════════════════════════════════════════════════════════ */
alter table public.invest_txns    enable row level security;
alter table public.invest_nav     enable row level security;
alter table public.invest_targets enable row level security;
alter table public.invest_reports enable row level security;
alter table public.invest_signals enable row level security;

drop policy if exists invest_txns_read on public.invest_txns;
create policy invest_txns_read on public.invest_txns for select to authenticated
  using (owner_id = auth.uid() or public.is_leader() or public.is_admin() or public.is_owner());
drop policy if exists invest_txns_insert on public.invest_txns;
create policy invest_txns_insert on public.invest_txns for insert to authenticated
  with check (owner_id = auth.uid());
drop policy if exists invest_txns_update on public.invest_txns;
create policy invest_txns_update on public.invest_txns for update to authenticated
  using (owner_id = auth.uid() or public.is_admin() or public.is_owner())
  with check (owner_id = auth.uid() or public.is_admin() or public.is_owner());
drop policy if exists invest_txns_delete on public.invest_txns;
create policy invest_txns_delete on public.invest_txns for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin() or public.is_owner());

drop policy if exists invest_nav_read on public.invest_nav;
create policy invest_nav_read on public.invest_nav for select to authenticated
  using (owner_id = auth.uid() or public.is_leader() or public.is_admin() or public.is_owner());
drop policy if exists invest_nav_write on public.invest_nav;
create policy invest_nav_write on public.invest_nav for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists invest_targets_read on public.invest_targets;
create policy invest_targets_read on public.invest_targets for select to authenticated
  using (owner_id = auth.uid() or public.is_leader() or public.is_admin() or public.is_owner());
drop policy if exists invest_targets_write on public.invest_targets;
create policy invest_targets_write on public.invest_targets for insert to authenticated
  with check (owner_id = auth.uid());
drop policy if exists invest_targets_update on public.invest_targets;
create policy invest_targets_update on public.invest_targets for update to authenticated
  using (owner_id = auth.uid() or public.is_admin() or public.is_owner())
  with check (owner_id = auth.uid() or public.is_admin() or public.is_owner());
drop policy if exists invest_targets_delete on public.invest_targets;
create policy invest_targets_delete on public.invest_targets for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin() or public.is_owner());

drop policy if exists invest_reports_read on public.invest_reports;
create policy invest_reports_read on public.invest_reports for select to authenticated
  using (owner_id = auth.uid() or public.is_leader() or public.is_admin() or public.is_owner());

drop policy if exists invest_signals_read on public.invest_signals;
create policy invest_signals_read on public.invest_signals for select to authenticated
  using (owner_id = auth.uid() or public.is_leader() or public.is_admin() or public.is_owner());
drop policy if exists invest_signals_update on public.invest_signals;
create policy invest_signals_update on public.invest_signals for update to authenticated
  using (owner_id = auth.uid() or public.is_admin() or public.is_owner())
  with check (owner_id = auth.uid() or public.is_admin() or public.is_owner());

grant select, insert, update, delete on public.invest_txns    to authenticated;
grant select, insert                 on public.invest_nav     to authenticated;
grant select, insert, update, delete on public.invest_targets to authenticated;
grant select                         on public.invest_reports to authenticated;
grant select, update                 on public.invest_signals to authenticated;

notify pgrst, 'reload schema';

select
  to_regclass('public.invest_txns')    is not null as 거래내역표,
  to_regclass('public.invest_nav')     is not null as 일별평가액표,
  to_regclass('public.invest_targets') is not null as 목표배분표,
  to_regclass('public.invest_reports') is not null as 월간리포트표,
  to_regclass('public.invest_signals') is not null as 신호표,
  (select count(*) from pg_policies where schemaname='public'
     and tablename in ('invest_txns','invest_nav','invest_targets','invest_reports','invest_signals')) as 정책수;
