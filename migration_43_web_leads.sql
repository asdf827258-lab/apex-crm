/* ════════════════════════════════════════════════════════════════
   홈페이지에서 들어온 보장분석 신청을 받는 곳

   지금까지 DB(고객 명단)는 전부 안에서 손으로 넣었다. dbs 표가 그것이다.
   그 표는 넣는 순간 assigned_to — 누가 전화할 사람인지 — 를 요구한다.
   밖에서 들어오는 신청은 그걸 정할 수가 없다. 누구에게 줄지는
   사람이 보고 정하는 일이지, 신청서가 정할 일이 아니다.

   그래서 표를 하나 더 둔다. 신청함이다.
     홈페이지 폼 → web_leads (신청함) → 대표가 보고 배정 → dbs (내 DB)

   왜 dbs 에 바로 안 넣는가.
     1. dbs 에 익명 쓰기를 열면 남의 DB 목록에 아무나 줄을 꽂는다
     2. 배정 없는 DB 는 아무도 안 본다 — 리드가 그냥 죽는다
     3. 신청함을 따로 두면 스팸을 배정 전에 걸러낼 수 있다

   누가 무엇을 할 수 있나.
     - 로그인 안 한 사람(홈페이지 방문자): 넣기만. 읽기·수정 못 함
     - 대표·본부장(is_admin): 읽고 상태를 바꾼다
     - 그 외 팀원: 신청함을 못 본다. 배정되면 dbs 에서 본다
   고객 이름·연락처가 들어오는 표라서 읽는 문을 제일 좁게 잡았다.

   광고비를 어디에 썼는지 알려면 어느 소재로 들어왔는지가 남아야 한다.
   utm_* 다섯 칸이 그것이다. 소재 번호까지 그대로 받아 둔다.

   이 파일은 몇 번을 다시 실행해도 안전하다.
   ════════════════════════════════════════════════════════════════ */

create table if not exists public.web_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  /* 고객이 직접 적는 것 — 세 칸이 전부다 */
  customer_name text not null,
  phone text not null,
  empty_accounts text,                    /* 8통장 셀프체크에서 비어 있던 칸 */
  memo text,                              /* 궁금한 점 (선택) */

  /* 동의 — 받은 사실을 남긴다. 필수 동의 없이는 애초에 넘어오지 않는다 */
  consent_privacy boolean not null default false,
  consent_lookup  boolean not null default false,

  /* 어디서 들어왔나 */
  source text not null default '보장분석',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,

  /* 처리 상태 */
  status text not null default '신규'
    check (status in ('신규','배정','보류','스팸')),
  assigned_db_id uuid references public.dbs(id) on delete set null,
  handled_by uuid references public.profiles(id),
  handled_at timestamptz,
  admin_memo text
);

/* 이미 만들어 둔 서버에도 빠진 칸이 있으면 채운다 */
alter table public.web_leads add column if not exists empty_accounts text;
alter table public.web_leads add column if not exists consent_lookup boolean not null default false;
alter table public.web_leads add column if not exists referrer text;
alter table public.web_leads add column if not exists admin_memo text;

/* 새 신청부터 보이게 */
create index if not exists web_leads_created_idx on public.web_leads(created_at desc);
create index if not exists web_leads_status_idx  on public.web_leads(status);

/* 빈 이름·빈 번호로 줄만 쌓이는 것을 막는다.
   제약 이름을 고정해 두고 다시 걸어야 두 번 실행해도 안 터진다. */
alter table public.web_leads drop constraint if exists web_leads_name_len;
alter table public.web_leads add constraint web_leads_name_len
  check (char_length(btrim(customer_name)) between 1 and 40);

alter table public.web_leads drop constraint if exists web_leads_phone_len;
alter table public.web_leads add constraint web_leads_phone_len
  check (char_length(btrim(phone)) between 9 and 20);

alter table public.web_leads drop constraint if exists web_leads_memo_len;
alter table public.web_leads add constraint web_leads_memo_len
  check (memo is null or char_length(memo) <= 1000);

alter table public.web_leads enable row level security;

/* ── 넣기: 로그인하지 않은 방문자에게만 필요한 권한 ──
   읽기는 주지 않는다. 넣은 사람도 자기 것을 다시 못 읽는다. */
grant insert on public.web_leads to anon;
grant insert, select, update on public.web_leads to authenticated;

drop policy if exists web_leads_insert_public on public.web_leads;
create policy web_leads_insert_public on public.web_leads
  for insert to anon, authenticated
  with check (
    status = '신규'
    and assigned_db_id is null
    and handled_by is null
    and consent_privacy = true          /* 동의 없이 들어온 줄은 애초에 안 만든다 */
  );

/* ── 읽기·수정: 대표·본부장만 ── */
drop policy if exists web_leads_select_admin on public.web_leads;
create policy web_leads_select_admin on public.web_leads
  for select to authenticated
  using (public.is_admin());

drop policy if exists web_leads_update_admin on public.web_leads;
create policy web_leads_update_admin on public.web_leads
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

/* 지우는 정책은 만들지 않는다.
   잘못 들어온 줄은 status 를 '스팸' 으로 바꿔 남긴다 —
   어느 소재에서 스팸이 들어오는지도 광고 정보다. */

/* 신청함에서 온 DB 인 것을 종류에서 알아볼 수 있게 목록에 한 줄 넣는다.
   이미 값이 있으면(대표가 고쳐 둔 목록) 건드리지 않는다. */
insert into public.app_config(key, value)
values('db_sources', '일반,보장분석,보장분석-홈페이지,방송,농협,소개,지인,개척')
on conflict (key) do nothing;
