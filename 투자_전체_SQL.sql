/* ════════════════════════════════════════════════════════════════════════
   APEX 투자·경제 — 이 파일 하나만 통째로 붙여넣고 RUN 하시면 됩니다.

   Supabase → 왼쪽 메뉴 SQL Editor → New query → 전체 복사·붙여넣기 → RUN

   · 33번(투자 기본)과 39번(성과 관리)을 순서대로 합쳐 놓았습니다.
   · 여러 번 다시 실행해도 안전합니다. 있는 것은 건드리지 않고 없는 것만 만듭니다.
   · 한글 문구도 SQL 의 일부입니다. 지우지 말고 통째로 붙여넣으세요.
   · 다 되면 맨 아래에 표가 두 줄 나옵니다. 전부 t 이면 성공입니다.
   ════════════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════════
   33) 투자·경제 모듈 — 주식관리 · 펀드관리 · 경제동향
   Supabase → SQL Editor 에 통째로 붙여넣고 실행하세요. 여러 번 실행해도 안전합니다.
   
   이 SQL 없이도 앱의 투자 메뉴는 '이 기기 저장(localStorage)' 으로 동작합니다.
   이걸 실행하면 팀이 서버로 같이 보고, 야간 자동수집(market-daily)이
   매 영업일 종가·경제지표·시황 브리핑을 스스로 쌓기 시작합니다.
   ════════════════════════════════════════════════════════════════════════ */
set search_path = public;

/* ── ⓪ 사전 확인 — 권한 판별 함수가 있어야 RLS 정책을 만들 수 있다 ────────
   (없으면 migration_ALL_NOW.sql 을 먼저 실행하세요) */
do $$
begin
  if to_regprocedure('public.is_admin()')  is null
  or to_regprocedure('public.is_owner()')  is null
  or to_regprocedure('public.is_leader()') is null then
    raise exception '권한 함수(is_admin/is_owner/is_leader)가 없습니다. migration_ALL_NOW.sql 을 먼저 실행한 뒤 이 SQL을 다시 실행하세요.';
  end if;
end $$;

/* ── ① 투자 계좌 (고객 1명이 여러 계좌를 가질 수 있다) ──────────────────── */
create table if not exists public.invest_accounts(
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,  /* 담당 설계사 (auth.uid()) */
  client_id uuid,  /* clients.id (없으면 모델 포트폴리오) */
  name text not null default '',  /* '홍길동 · 연금저축펀드' */
  kind text not null default 'stock',  /* stock | fund | isa | irp | pension */
  broker text default '',  /* 증권사·운용사 */
  goal_amount numeric,  /* 목표 금액 */
  target_return numeric,  /* 목표 수익률 %  (도달 시 알림) */
  stop_loss numeric,  /* 손절 기준 %    (이탈 시 알림) */
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

/* ── ② 보유 종목·펀드 ───────────────────────────────────────────────────── */
create table if not exists public.invest_holdings(
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.invest_accounts(id) on delete cascade,
  owner_id uuid not null,
  asset_type text not null default 'stock',  /* stock | etf | fund */
  code text not null,  /* 005930 · NAS:AAPL · 펀드코드 */
  market text default 'KRX',  /* KRX | NAS | NYS | FUND */
  name text default '',
  qty numeric default 0,
  avg_price numeric default 0,
  currency text default 'KRW',
  last_price numeric,  /* 야간 자동수집이 채운다 */
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

/* ── ③ 시세 스냅샷 (일별 종가 — 수익률 추이·리포트 근거) ────────────────── */
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

/* ── ④ 경제지표 시계열 (한국은행 ECOS) ──────────────────────────────────── */
create table if not exists public.econ_indicators(
  id uuid primary key default gen_random_uuid(),
  code text not null,  /* base_rate · usdkrw · cd91 · ktb3 · cpi */
  name text default '',
  ref_date date not null,  /* 수집일 */
  ref_time text default '',  /* 원 통계 기준시점 (20260731 / 202607) */
  value numeric,
  unit text default '',
  src text default 'ecos',
  created_at timestamptz default now()
);

alter table public.econ_indicators add column if not exists ref_time text default '';

create unique index if not exists econ_indicators_uni on public.econ_indicators(code, ref_date);
create index if not exists econ_indicators_date_idx on public.econ_indicators(ref_date desc);

/* ── ⑤ 시황·고객 브리핑 (AI 생성물) ─────────────────────────────────────── */
create table if not exists public.invest_briefs(
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'market_daily',  /* market_daily | account */
  ref_date date not null default current_date,
  account_id uuid,
  title text default '',
  body text default '',
  src text default 'auto',
  created_at timestamptz default now()
);

create unique index if not exists invest_briefs_uni on public.invest_briefs(kind, ref_date);
create index if not exists invest_briefs_date_idx on public.invest_briefs(ref_date desc);

/* ── ⑥ 알림 (목표 도달 · 손절 이탈) ─────────────────────────────────────── */
create table if not exists public.invest_alerts(
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  account_id uuid,
  holding_id uuid,
  kind text not null default 'target',  /* target | stoploss | news */
  ref_date date not null default current_date,
  message text default '',
  is_read boolean default false,
  created_at timestamptz default now()
);

create unique index if not exists invest_alerts_uni on public.invest_alerts(holding_id, kind, ref_date);
create index if not exists invest_alerts_owner_idx on public.invest_alerts(owner_id, is_read);

/* ════════════════════════════════════════════════════════════════════════
   RLS — 고객 자산은 담당 설계사와 관리자만. 시세·지표·시황은 팀 공용.
   ════════════════════════════════════════════════════════════════════════ */
alter table public.invest_accounts  enable row level security;
alter table public.invest_holdings  enable row level security;
alter table public.invest_prices    enable row level security;
alter table public.econ_indicators  enable row level security;
alter table public.invest_briefs    enable row level security;
alter table public.invest_alerts    enable row level security;

/* ① 계좌 */
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

/* ② 보유 */
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

/* ③ 시세 — 공개 시장정보라 팀 전체가 읽는다. 수동 기준가 입력을 위해 쓰기도 연다. */
drop policy if exists invest_prices_read on public.invest_prices;
create policy invest_prices_read on public.invest_prices
  for select to authenticated using (true);

drop policy if exists invest_prices_write on public.invest_prices;
create policy invest_prices_write on public.invest_prices
  for insert to authenticated with check (true);

drop policy if exists invest_prices_update on public.invest_prices;
create policy invest_prices_update on public.invest_prices
  for update to authenticated using (true) with check (true);

/* ④ 경제지표 — 읽기 전용(쓰기는 야간 자동수집의 service_role 이 담당) */
drop policy if exists econ_indicators_read on public.econ_indicators;
create policy econ_indicators_read on public.econ_indicators
  for select to authenticated using (true);

/* ⑤ 시황 브리핑 — 팀 공용 읽기 */
drop policy if exists invest_briefs_read on public.invest_briefs;
create policy invest_briefs_read on public.invest_briefs
  for select to authenticated using (true);

/* ⑥ 알림 — 내 것만 (관리자는 전체) */
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

/* ── 확인 ───────────────────────────────────────────────────────────────── */
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

/* ══════════ 여기서부터 39번 (성과 관리) ══════════ */

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
