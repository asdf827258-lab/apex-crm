-- ════════════════════════════════════════════════════════════════════════
-- 30) 투자·경제 모듈 — 주식관리 · 펀드관리 · 경제동향
--     Supabase → SQL Editor 에 통째로 붙여넣고 실행하세요. 여러 번 실행해도 안전합니다.
--
--     이 SQL 없이도 앱의 투자 메뉴는 '이 기기 저장(localStorage)' 으로 동작합니다.
--     이걸 실행하면 팀이 서버로 같이 보고, 야간 자동수집(market-daily)이
--     매 영업일 종가·경제지표·시황 브리핑을 스스로 쌓기 시작합니다.
-- ════════════════════════════════════════════════════════════════════════
set search_path = public;

-- ── ⓪ 사전 확인 — 권한 판별 함수가 있어야 RLS 정책을 만들 수 있다 ────────
--     (없으면 migration_ALL_NOW.sql 을 먼저 실행하세요)
do $$
begin
  if to_regprocedure('public.is_admin()')  is null
  or to_regprocedure('public.is_owner()')  is null
  or to_regprocedure('public.is_leader()') is null then
    raise exception '권한 함수(is_admin/is_owner/is_leader)가 없습니다. migration_ALL_NOW.sql 을 먼저 실행한 뒤 이 SQL을 다시 실행하세요.';
  end if;
end $$;

-- ── ① 투자 계좌 (고객 1명이 여러 계좌를 가질 수 있다) ────────────────────
create table if not exists public.invest_accounts(
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,                 -- 담당 설계사 (auth.uid())
  client_id uuid,                         -- clients.id (없으면 모델 포트폴리오)
  name text not null default '',          -- '홍길동 · 연금저축펀드'
  kind text not null default 'stock',     -- stock | fund | isa | irp | pension
  broker text default '',                 -- 증권사·운용사
  goal_amount numeric,                    -- 목표 금액
  target_return numeric,                  -- 목표 수익률 %  (도달 시 알림)
  stop_loss numeric,                      -- 손절 기준 %    (이탈 시 알림)
  memo text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.invest_accounts add column if not exists client_id uuid;
alter table public.invest_accounts add column if not exists goal_amount numeric;
alter table public.invest_accounts add column if not exists target_return numeric;
alter table public.invest_accounts add column if not exists stop_loss numeric;
alter table public.invest_accounts add column if not exists memo text default '';
alter table public.invest_accounts add column if not exists updated_at timestamptz default now();

create index if not exists invest_accounts_owner_idx  on public.invest_accounts(owner_id);
create index if not exists invest_accounts_client_idx on public.invest_accounts(client_id);

-- ── ② 보유 종목·펀드 ─────────────────────────────────────────────────────
create table if not exists public.invest_holdings(
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.invest_accounts(id) on delete cascade,
  owner_id uuid not null,
  asset_type text not null default 'stock',   -- stock | etf | fund
  code text not null,                         -- 005930 · NAS:AAPL · 펀드코드
  market text default 'KRX',                  -- KRX | NAS | NYS | FUND
  name text default '',
  qty numeric default 0,
  avg_price numeric default 0,
  currency text default 'KRW',
  last_price numeric,                         -- 야간 자동수집이 채운다
  last_price_at timestamptz,
  note text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.invest_holdings add column if not exists last_price numeric;
alter table public.invest_holdings add column if not exists last_price_at timestamptz;
alter table public.invest_holdings add column if not exists note text default '';
alter table public.invest_holdings add column if not exists updated_at timestamptz default now();

create index if not exists invest_holdings_acc_idx   on public.invest_holdings(account_id);
create index if not exists invest_holdings_owner_idx on public.invest_holdings(owner_id);
create index if not exists invest_holdings_code_idx  on public.invest_holdings(code);

-- ── ③ 시세 스냅샷 (일별 종가 — 수익률 추이·리포트 근거) ──────────────────
create table if not exists public.invest_prices(
  id uuid primary key default gen_random_uuid(),
  code text not null,
  market text not null default 'KRX',
  price_date date not null,
  close numeric,
  change_rate numeric,
  currency text default 'KRW',
  name text default '',
  src text default 'api',
  created_at timestamptz default now()
);

alter table public.invest_prices add column if not exists name text default '';
alter table public.invest_prices add column if not exists src text default 'api';

create unique index if not exists invest_prices_uni on public.invest_prices(code, market, price_date);
create index if not exists invest_prices_date_idx on public.invest_prices(price_date desc);

-- ── ④ 경제지표 시계열 (한국은행 ECOS) ────────────────────────────────────
create table if not exists public.econ_indicators(
  id uuid primary key default gen_random_uuid(),
  code text not null,                 -- base_rate · usdkrw · cd91 · ktb3 · cpi
  name text default '',
  ref_date date not null,             -- 수집일
  ref_time text default '',           -- 원 통계 기준시점 (20260731 / 202607)
  value numeric,
  unit text default '',
  src text default 'ecos',
  created_at timestamptz default now()
);

alter table public.econ_indicators add column if not exists ref_time text default '';

create unique index if not exists econ_indicators_uni on public.econ_indicators(code, ref_date);
create index if not exists econ_indicators_date_idx on public.econ_indicators(ref_date desc);

-- ── ⑤ 시황·고객 브리핑 (AI 생성물) ───────────────────────────────────────
create table if not exists public.invest_briefs(
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'market_daily',   -- market_daily | account
  ref_date date not null default current_date,
  account_id uuid,
  title text default '',
  body text default '',
  src text default 'auto',
  created_at timestamptz default now()
);

create unique index if not exists invest_briefs_uni on public.invest_briefs(kind, ref_date);
create index if not exists invest_briefs_date_idx on public.invest_briefs(ref_date desc);

-- ── ⑥ 알림 (목표 도달 · 손절 이탈) ───────────────────────────────────────
create table if not exists public.invest_alerts(
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  account_id uuid,
  holding_id uuid,
  kind text not null default 'target',   -- target | stoploss | news
  ref_date date not null default current_date,
  message text default '',
  is_read boolean default false,
  created_at timestamptz default now()
);

create unique index if not exists invest_alerts_uni on public.invest_alerts(holding_id, kind, ref_date);
create index if not exists invest_alerts_owner_idx on public.invest_alerts(owner_id, is_read);

-- ════════════════════════════════════════════════════════════════════════
-- RLS — 고객 자산은 담당 설계사와 관리자만. 시세·지표·시황은 팀 공용.
-- ════════════════════════════════════════════════════════════════════════
alter table public.invest_accounts  enable row level security;
alter table public.invest_holdings  enable row level security;
alter table public.invest_prices    enable row level security;
alter table public.econ_indicators  enable row level security;
alter table public.invest_briefs    enable row level security;
alter table public.invest_alerts    enable row level security;

-- ① 계좌
drop policy if exists invest_accounts_read on public.invest_accounts;
create policy invest_accounts_read on public.invest_accounts
  for select to authenticated
  using (owner_id = auth.uid() or public.is_leader() or public.is_admin() or public.is_owner());

drop policy if exists invest_accounts_insert on public.invest_accounts;
create policy invest_accounts_insert on public.invest_accounts
  for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists invest_accounts_update on public.invest_accounts;
create policy invest_accounts_update on public.invest_accounts
  for update to authenticated
  using (owner_id = auth.uid() or public.is_admin() or public.is_owner())
  with check (owner_id = auth.uid() or public.is_admin() or public.is_owner());

drop policy if exists invest_accounts_delete on public.invest_accounts;
create policy invest_accounts_delete on public.invest_accounts
  for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin() or public.is_owner());

-- ② 보유
drop policy if exists invest_holdings_read on public.invest_holdings;
create policy invest_holdings_read on public.invest_holdings
  for select to authenticated
  using (owner_id = auth.uid() or public.is_leader() or public.is_admin() or public.is_owner());

drop policy if exists invest_holdings_insert on public.invest_holdings;
create policy invest_holdings_insert on public.invest_holdings
  for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists invest_holdings_update on public.invest_holdings;
create policy invest_holdings_update on public.invest_holdings
  for update to authenticated
  using (owner_id = auth.uid() or public.is_admin() or public.is_owner())
  with check (owner_id = auth.uid() or public.is_admin() or public.is_owner());

drop policy if exists invest_holdings_delete on public.invest_holdings;
create policy invest_holdings_delete on public.invest_holdings
  for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin() or public.is_owner());

-- ③ 시세 — 공개 시장정보라 팀 전체가 읽는다. 수동 기준가 입력을 위해 쓰기도 연다.
drop policy if exists invest_prices_read on public.invest_prices;
create policy invest_prices_read on public.invest_prices
  for select to authenticated using (true);

drop policy if exists invest_prices_write on public.invest_prices;
create policy invest_prices_write on public.invest_prices
  for insert to authenticated with check (true);

drop policy if exists invest_prices_update on public.invest_prices;
create policy invest_prices_update on public.invest_prices
  for update to authenticated using (true) with check (true);

-- ④ 경제지표 — 읽기 전용(쓰기는 야간 자동수집의 service_role 이 담당)
drop policy if exists econ_indicators_read on public.econ_indicators;
create policy econ_indicators_read on public.econ_indicators
  for select to authenticated using (true);

-- ⑤ 시황 브리핑 — 팀 공용 읽기
drop policy if exists invest_briefs_read on public.invest_briefs;
create policy invest_briefs_read on public.invest_briefs
  for select to authenticated using (true);

-- ⑥ 알림 — 내 것만 (관리자는 전체)
drop policy if exists invest_alerts_read on public.invest_alerts;
create policy invest_alerts_read on public.invest_alerts
  for select to authenticated
  using (owner_id = auth.uid() or public.is_leader() or public.is_admin() or public.is_owner());

drop policy if exists invest_alerts_update on public.invest_alerts;
create policy invest_alerts_update on public.invest_alerts
  for update to authenticated
  using (owner_id = auth.uid() or public.is_admin() or public.is_owner())
  with check (owner_id = auth.uid() or public.is_admin() or public.is_owner());

grant select                     on public.invest_accounts  to authenticated;
grant insert, update, delete     on public.invest_accounts  to authenticated;
grant select                     on public.invest_holdings  to authenticated;
grant insert, update, delete     on public.invest_holdings  to authenticated;
grant select, insert, update     on public.invest_prices    to authenticated;
grant select                     on public.econ_indicators  to authenticated;
grant select                     on public.invest_briefs    to authenticated;
grant select, update             on public.invest_alerts    to authenticated;

notify pgrst, 'reload schema';

-- ── 확인 ─────────────────────────────────────────────────────────────────
select
  to_regclass('public.invest_accounts') is not null as 투자계좌표,
  to_regclass('public.invest_holdings') is not null as 보유표,
  to_regclass('public.invest_prices')   is not null as 시세표,
  to_regclass('public.econ_indicators') is not null as 경제지표표,
  to_regclass('public.invest_briefs')   is not null as 브리핑표,
  to_regclass('public.invest_alerts')   is not null as 알림표,
  (select count(*) from pg_policies
    where schemaname = 'public'
      and tablename in ('invest_accounts','invest_holdings','invest_prices',
                        'econ_indicators','invest_briefs','invest_alerts')) as 정책수;
