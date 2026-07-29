-- 11: 자동결제(정기결제) + 결제 현황 (재실행 안전 · 기존 데이터 손상 없음)
-- 토스 빌링키는 서버(service_role)만 접근합니다. 브라우저(anon)에는 billing_key 를 노출하지 않습니다.

-- ── 구독(자동결제) ───────────────────────────────────────────────
create table if not exists public.subscriptions(
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null unique references public.profiles(id) on delete cascade,
  customer_key text,
  billing_key text,                      -- ⚠️ service_role 전용(아래 RLS로 브라우저 차단)
  plan text not null default 'basic',    -- basic | pro | team
  cycle text not null default 'month',   -- month | year
  amount int,
  status text not null default 'active', -- active | past_due | canceled
  card_company text,
  card_number text,
  started_at timestamptz default now(),
  last_paid_at timestamptz,
  next_billing_at timestamptz,
  last_error text,
  updated_at timestamptz default now()
);
create index if not exists subscriptions_due_idx on public.subscriptions(status, next_billing_at);

alter table public.subscriptions enable row level security;

-- 브라우저에서는 '내 구독' 또는 대표/관리자만 조회 (billing_key 는 아래 뷰/컬럼권한으로 보호)
drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions
  for select to authenticated
  using (member_id = auth.uid() or public.is_admin());

-- 쓰기는 서버(service_role)만 — authenticated 에는 insert/update/delete 정책을 두지 않는다.
revoke all on public.subscriptions from authenticated;
grant select (id, member_id, plan, cycle, amount, status, card_company, card_number,
              started_at, last_paid_at, next_billing_at, updated_at)
  on public.subscriptions to authenticated;   -- billing_key/customer_key 는 제외(노출 금지)

-- ── 결제 내역 ────────────────────────────────────────────────────
create table if not exists public.payments(
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  order_id text,
  payment_key text,
  amount int,
  plan text,
  cycle text,
  status text not null default 'paid',   -- paid | failed | refunded
  fail_reason text,
  paid_at timestamptz not null default now()
);
create index if not exists payments_member_idx on public.payments(member_id, paid_at desc);

alter table public.payments enable row level security;

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select to authenticated
  using (member_id = auth.uid() or public.is_admin());

revoke all on public.payments from authenticated;
grant select on public.payments to authenticated;   -- 쓰기는 서버(service_role)만

-- ── 대표(오너) 지정: 앱 설정에서 버튼으로도 가능 ───────────────────
-- 아래 한 줄의 이메일만 본인 것으로 바꿔 실행하면 그 계정만 '설정/보고서'를 볼 수 있습니다.
-- insert into public.app_config(key,value) values('owner_email','여기에@본인이메일')
--   on conflict (key) do update set value=excluded.value, updated_at=now();
