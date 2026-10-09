/* ════════════════════════════════════════════════════════════════
   광고 체계 — 서버에만 있고 <b>저장소에는 한 줄도 없던 것</b>

   2026-10-09. 광고 성과 화면(광고성과.html)은 `ad_v_board` 를 읽고
   `ad_inquiries` 에 넣습니다. 그런데 그 표·뷰가 어떻게 생겼는지가
   저장소 SQL <b>어디에도 없었습니다.</b> grep 으로 열셋을 다 찾아봤고
   전부 0건이었습니다 —

     표 일곱   ad_creatives · ad_events · ad_experiments · ad_inquiries
               ad_landings · ad_links · ad_spend
     뷰 여섯   ad_v_board · ad_v_codes · ad_v_creative_perf
               ad_v_creative_pick · ad_v_daily · ad_v_quiz

   그래서 다음 세션은 <b>화면만 보고 짐작</b>하게 됩니다. 짐작한 칸 이름으로
   insert 를 쓰면 조용히 틀린 줄이 들어갑니다. 그 자리를 메웁니다.

   ★ <b>이 파일은 지어낸 것이 아닙니다.</b> 2026-10-09 에 살아 있는 DB
     (프로젝트 miakdhxtqofpndtlyzxa)에서 information_schema ·
     pg_constraint · pg_indexes · pg_policies · pg_get_viewdef 로
     읽어 그대로 옮겼습니다. 뷰 여섯은 pg_get_viewdef 가 뱉은 글 그대로입니다.

   ★ <b>여러 번 돌려도 안전합니다.</b> 표는 if not exists, 칸도
     add column if not exists, 뷰는 create or replace 입니다. 이미
     있는 줄은 하나도 건드리지 않습니다. 지우는 문장은 없습니다.

   ── 재면서 알게 된 것 다섯 (고치지 않고 적어만 둡니다) ──────────────

   ① <b>화면의 「쓴 돈」 은 메타 지출입니다 — 전체 지출이 아닙니다.</b>
      ad_v_board 의 지출은 `where medium = 'meta'` 를 지납니다. 오늘은
      ad_spend 의 매체가 meta 하나뿐이라 차이가 0 입니다(재었습니다).
      그러나 카카오·네이버를 한 줄이라도 넣는 날, 화면은 그 돈을
      <b>말없이 빼고</b> 「쓴 돈」 이라고 적습니다. 고객이 아니라 사장님이
      보는 숫자지만, 판정($300·$500)이 그 숫자로 갈립니다.

   ② <b>「며칠인가」 를 두 가지로 셉니다</b>(5번). ad_v_board 와
      ad_v_daily 는 `at time zone 'Asia/Seoul'` 로 자르고, ad_v_quiz 는
      그냥 `date_trunc('day', ts)` 입니다. 서버 시간대가 UTC 라
      (재었습니다) 아침 09시 KST 방문은 ad_v_quiz 에서 <b>전날</b>로
      들어갑니다. 같은 물음에 두 답입니다.

   ③ <b>ad_v_quiz 에 날짜가 박혀 있습니다</b> — `ts >= '2026-10-04'`.
      퀴즈를 그날 올렸기 때문으로 보이나, 박힌 값이라 적어 둡니다.

   ④ <b>ad_inquiries 에는 code 와 creative_code 가 둘 다 있습니다.</b>
      뷰 셋(board·creative_perf)은 <b>creative_code</b> 만 봅니다.
      화면도 creative_code 로 넣습니다. code 는 색인까지 있는데
      <b>지금 아무 뷰도 안 보고</b>, 들어 있는 줄도 0 입니다(재었습니다).
      랜딩이 내준 카톡 코드를 나중에 맞춰 보려고(matched) 둔 칸으로
      보입니다. 쓰기 시작할 때 <b>어느 쪽이 소재인지</b> 헷갈리지 않도록
      적어 둡니다.

   ⑤ <b>updated_at 은 트리거가 없습니다.</b> ad_creatives ·
      ad_inquiries 의 updated_at 은 default now() 뿐이라 <b>넣을 때만</b>
      찍히고, 고쳐도 그대로 있습니다. 「언제 고쳤나」 로 읽으면 틀립니다.
      (이 저장소에는 touch_updated_at() 이 이미 있습니다. 붙일지는
      사장님이 정하십니다 — 이 파일은 붙이지 않습니다.)

   ── 권한은 「살아 있는 그대로」 가 아닙니다. 그 한 자리만 다릅니다 ────

   재어 보니 ad_v_codes · ad_v_creative_perf · ad_v_daily 세 뷰에는
   <b>anon(로그인 안 한 손님) 권한이 붙어 있었습니다.</b> Supabase 가
   public 스키마에 기본으로 뿌리는 권한입니다. 화면이 쓰는 두 뷰
   (ad_v_board · ad_v_creative_pick)에는 없습니다 — 누군가 일부러
   뺀 자리로 보입니다.

   ★ 실제로 새는지 <b>anon 키로 여섯 뷰를 다 찔러 봤습니다 — 전부 401</b>
     입니다. 뷰가 security_invoker=on 이라 anon 자기 권한으로 밑의
     ad_events 를 읽어야 하고, anon 에게는 그 권한이 없습니다. 지금은
     <b>닫혀 있습니다.</b>

   그래서 이 파일은 <b>필요한 것만</b> 적습니다 — 여섯 뷰에 authenticated
   와 service_role 의 select. anon 에게 주지도 않고, <b>빼지도 않습니다</b>
   (살아 있는 DB 를 이 파일이 말없이 바꾸면 안 됩니다). 그 세 줄을 닫을지는
   사장님이 정하십니다. 닫는 문장은 맨 아래에 적어 두었습니다.

   ad_events 의 anon insert 는 <b>일부러 있는 것</b>입니다 — 랜딩이
   로그인 없이 방문·읽음·카톡을 보냅니다. 그것만 그대로 둡니다.

   Supabase → SQL Editor 에 통째로 붙여 넣고 한 번 실행하십시오.
   여러 번 실행해도 안전합니다.
   ════════════════════════════════════════════════════════════════ */
set search_path = public;

/* ── 1. 소재 대장 ───────────────────────────────────────────────────
   code 는 메타 광고의 utm_content 로 들어오는 번호(예: 1514)입니다.    */
create table if not exists public.ad_creatives (
  id            bigserial primary key,
  code          text        not null unique,
  title         text        not null,
  medium        text,
  format        text,
  hook          text,
  body          text,
  asset_path    text,
  review_no     text,
  review_until  date,
  status        text        not null default 'draft',
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.ad_creatives add column if not exists medium       text;
alter table public.ad_creatives add column if not exists format       text;
alter table public.ad_creatives add column if not exists hook         text;
alter table public.ad_creatives add column if not exists body         text;
alter table public.ad_creatives add column if not exists asset_path   text;
alter table public.ad_creatives add column if not exists review_no    text;
alter table public.ad_creatives add column if not exists review_until date;
alter table public.ad_creatives add column if not exists note         text;
alter table public.ad_creatives add column if not exists updated_at   timestamptz not null default now();

/* ── 2. 랜딩이 보내는 발자국 ────────────────────────────────────────
   cnt 가 utm_content, 곧 <b>소재 번호</b>입니다. 뷰들이 이 칸으로
   소재를 가릅니다. sid 는 한 사람의 한 번 방문입니다.
   길이 제한이 칸마다 붙어 있습니다 — 로그인 없이 받는 자리라
   아무나 긴 글을 밀어 넣지 못하게 막아 둔 것입니다.                  */
create table if not exists public.ad_events (
  id       bigserial primary key,
  ts       timestamptz not null default now(),
  ev       text        not null,
  landing  text,
  src      text,
  med      text,
  cmp      text,
  cnt      text,
  trm      text,
  slug     text,
  variant  text,
  sid      text,
  code     text,
  refh     text,
  dev      text,
  dwell    integer,
  extra    jsonb
);

alter table public.ad_events add column if not exists extra jsonb;

do $blk$
begin
  if not exists (select 1 from pg_constraint where conname = 'ad_events_ev_check') then
    alter table public.ad_events add constraint ad_events_ev_check
      check (ev = any (array['view','read25','read50','read75','read100','tool','cta','code','exit']));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ad_events_landing_check') then
    alter table public.ad_events add constraint ad_events_landing_check check (length(landing) <= 40);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ad_events_src_check') then
    alter table public.ad_events add constraint ad_events_src_check check (length(src) <= 40);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ad_events_med_check') then
    alter table public.ad_events add constraint ad_events_med_check check (length(med) <= 40);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ad_events_cmp_check') then
    alter table public.ad_events add constraint ad_events_cmp_check check (length(cmp) <= 60);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ad_events_cnt_check') then
    alter table public.ad_events add constraint ad_events_cnt_check check (length(cnt) <= 60);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ad_events_trm_check') then
    alter table public.ad_events add constraint ad_events_trm_check check (length(trm) <= 60);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ad_events_slug_check') then
    alter table public.ad_events add constraint ad_events_slug_check check (length(slug) <= 40);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ad_events_variant_check') then
    alter table public.ad_events add constraint ad_events_variant_check check (length(variant) <= 8);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ad_events_sid_check') then
    alter table public.ad_events add constraint ad_events_sid_check check (length(sid) <= 24);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ad_events_code_check') then
    alter table public.ad_events add constraint ad_events_code_check check (length(code) <= 16);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ad_events_refh_check') then
    alter table public.ad_events add constraint ad_events_refh_check check (length(refh) <= 80);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ad_events_dev_check') then
    alter table public.ad_events add constraint ad_events_dev_check check (length(dev) <= 2);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ad_events_dwell_check') then
    alter table public.ad_events add constraint ad_events_dwell_check check (dwell >= 0 and dwell <= 86400);
  end if;
end
$blk$;

create index if not exists ad_events_ts_idx      on public.ad_events using btree (ts desc);
create index if not exists ad_events_landing_idx on public.ad_events using btree (landing, ts desc);
create index if not exists ad_events_slug_idx    on public.ad_events using btree (slug, ts desc);
create index if not exists ad_events_code_idx    on public.ad_events using btree (code) where (code is not null);

/* ── 3. A/B 시험 대장 ──────────────────────────────────────────────
   2026-10-09 기준 0줄입니다 — 아직 안 쓰고 있습니다.                 */
create table if not exists public.ad_experiments (
  id          bigserial primary key,
  name        text        not null,
  landing_key text,
  variants    jsonb       not null default '["A", "B"]'::jsonb,
  hypothesis  text,
  status      text        not null default 'running',
  started_at  date        not null default current_date,
  ended_at    date,
  winner      text,
  note        text,
  created_at  timestamptz not null default now()
);

do $blk$
begin
  if not exists (select 1 from pg_constraint where conname = 'ad_experiments_status_check') then
    alter table public.ad_experiments add constraint ad_experiments_status_check
      check (status = any (array['running','done','stopped']));
  end if;
end
$blk$;

/* ── 4. 문의 ────────────────────────────────────────────────────────
   화면이 넣는 칸은 여섯입니다 —
     creative_code · landing · channel · medium · memo · matched
   나머지는 콘솔이나 손으로 채웁니다.

   ★ <b>이름·연락처 칸이 없습니다. 일부러입니다</b>(3번). 실명은 이
     브라우저(localStorage)와 CRM 본 화면에만 둡니다. alias 는 「김○○」
     처럼 <b>가린 이름</b>을 적는 자리입니다 — 실명을 넣지 마십시오.
   ★ client_id 는 uuid 인데 <b>외래키가 없습니다.</b> 살아 있는 DB 에
     없어서 안 걸었습니다. 지어 걸면 없던 제약이 생깁니다.
   ★ premium 은 numeric 입니다. 단위는 DB 가 말해 주지 않습니다 —
     0줄이라 재서 확인할 수도 없습니다. 첫 줄을 넣는 사람이 <b>만원이냐
     원이냐를 정하고 여기 적어</b> 두십시오(4번).                      */
create table if not exists public.ad_inquiries (
  id            bigserial primary key,
  at            timestamptz not null default now(),
  code          text,
  channel       text,
  landing       text,
  medium        text,
  campaign      text,
  creative_code text,
  matched       boolean     not null default false,
  alias         text,
  memo          text,
  stage         text        not null default 'inq',
  contract_at   date,
  premium       numeric,
  client_id     uuid,
  updated_at    timestamptz not null default now()
);

alter table public.ad_inquiries add column if not exists campaign    text;
alter table public.ad_inquiries add column if not exists alias       text;
alter table public.ad_inquiries add column if not exists contract_at date;
alter table public.ad_inquiries add column if not exists premium     numeric;
alter table public.ad_inquiries add column if not exists client_id   uuid;
alter table public.ad_inquiries add column if not exists updated_at  timestamptz not null default now();

do $blk$
begin
  if not exists (select 1 from pg_constraint where conname = 'ad_inquiries_stage_check') then
    alter table public.ad_inquiries add constraint ad_inquiries_stage_check
      check (stage = any (array['inq','book','met','proposal','contract','dead']));
  end if;
end
$blk$;

create index if not exists ad_inquiries_at_idx   on public.ad_inquiries using btree (at desc);
create index if not exists ad_inquiries_code_idx on public.ad_inquiries using btree (code) where (code is not null);

/* ── 5. 랜딩 대장 ──────────────────────────────────────────────────
   key 가 열쇠입니다(dbcompare · selfcheck · bojang 같은 글자).
   화면의 LAND 표가 소재 번호를 이 key 로 옮깁니다.                   */
create table if not exists public.ad_landings (
  key          text        primary key,
  name         text        not null,
  url          text        not null,
  kakao_url    text,
  review_no    text,
  review_until date,
  code_ui      boolean     not null default false,
  active       boolean     not null default true,
  sort         integer     not null default 0,
  note         text,
  created_at   timestamptz not null default now()
);

alter table public.ad_landings add column if not exists kakao_url    text;
alter table public.ad_landings add column if not exists review_no    text;
alter table public.ad_landings add column if not exists review_until date;
alter table public.ad_landings add column if not exists note         text;

/* ── 6. 내보내는 주소 ──────────────────────────────────────────────  */
create table if not exists public.ad_links (
  id            bigserial primary key,
  slug          text        not null unique,
  landing_key   text        references public.ad_landings(key) on delete set null,
  medium        text        not null,
  campaign      text,
  adset         text,
  creative_code text,
  variant       text,
  url           text        not null,
  note          text,
  active        boolean     not null default true,
  created_at    timestamptz not null default now()
);

alter table public.ad_links add column if not exists adset   text;
alter table public.ad_links add column if not exists variant text;
alter table public.ad_links add column if not exists note    text;

/* ── 7. 지출 ────────────────────────────────────────────────────────
   「아침 10시 보고」 가 메타에서 받아 여기 넣습니다. 그 보고는
   2026-10-09 기준 <b>사장님 컴퓨터에서</b> 나가고 있어, 컴퓨터가 꺼지면
   이 표가 안 자랍니다. 실제로 2026-10-08 까지만 들어와 있습니다
   (19줄 · 재었습니다).

   ★ 같은 날 같은 소재를 두 번 넣지 않도록 ad_spend_uniq 가 막습니다.
     보고는 upsert 로 넣어야 합니다 — 그래야 하루를 다시 받아도
     <b>두 벌로 쌓이지 않습니다</b>(5-1번).
   ★ spend 는 <b>달러</b>입니다(메타 계정 통화). 화면도 $ 로 적습니다.
     원이 아닙니다 — 만원·원 규약(4번)에 걸리는 칸이 아닙니다.       */
create table if not exists public.ad_spend (
  id            bigserial primary key,
  d             date        not null,
  medium        text        not null,
  campaign      text        not null default '',
  adset         text        not null default '',
  creative_code text        not null default '',
  impressions   bigint      not null default 0,
  clicks        bigint      not null default 0,
  reach         bigint,
  spend         numeric     not null default 0,
  source        text        not null default 'manual',
  raw           jsonb,
  created_at    timestamptz not null default now(),
  constraint ad_spend_uniq unique (d, medium, campaign, adset, creative_code)
);

alter table public.ad_spend add column if not exists reach bigint;
alter table public.ad_spend add column if not exists raw   jsonb;

create index if not exists ad_spend_d_idx on public.ad_spend using btree (d desc);

/* ════════════════════════════════════════════════════════════════
   뷰 여섯 — pg_get_viewdef 가 뱉은 글 그대로입니다.
   여섯 다 security_invoker=on 입니다. 곧 <b>부르는 사람의 권한</b>으로
   밑의 표를 읽습니다. 그래서 뷰에만 권한을 줘도 표가 안 열립니다.
   ════════════════════════════════════════════════════════════════ */

/* ── ad_v_board — 광고성과.html 이 읽는 그 뷰 ──────────────────────
   하루 × 소재 한 줄. 지출은 ad_spend(meta 만), 방문·읽음·카톡은
   ad_events, 문의는 ad_inquiries 에서 옵니다. 셋을 full join 하므로
   <b>어느 한쪽만 있어도 줄이 섭니다</b> — 지출 없이 방문만 있어도 보입니다.

   ★ 카톡율 칸을 뷰도 내줍니다. 화면은 그것을 <b>안 쓰고</b> 합계로 다시
     셉니다 — 줄마다의 비율은 더할 수 없으니 그 자리에서는 맞습니다.
     고칠 때 <b>두 자리</b>임을 아십시오(5번).                        */
create or replace view public.ad_v_board with (security_invoker = on) as
 with s as (
         select ad_spend.d,
            ad_spend.creative_code,
            sum(ad_spend.impressions) as im,
            sum(ad_spend.clicks) as ck,
            sum(ad_spend.spend) as sp
           from ad_spend
          where ad_spend.medium = 'meta'::text
          group by ad_spend.d, ad_spend.creative_code
        ), e as (
         select date_trunc('day'::text, (ad_events.ts at time zone 'Asia/Seoul'::text))::date as d,
            coalesce(nullif(ad_events.cnt, ''::text), ''::text) as creative_code,
            count(distinct ad_events.sid) filter (where ad_events.ev = 'view'::text) as vis,
            count(distinct ad_events.sid) filter (where ad_events.ev = 'read25'::text) as rd,
            count(distinct ad_events.sid) filter (where ad_events.ev = 'cta'::text) as cta
           from ad_events
          group by (date_trunc('day'::text, (ad_events.ts at time zone 'Asia/Seoul'::text))::date), (coalesce(nullif(ad_events.cnt, ''::text), ''::text))
        ), q as (
         select date_trunc('day'::text, (ad_inquiries.at at time zone 'Asia/Seoul'::text))::date as d,
            coalesce(ad_inquiries.creative_code, ''::text) as creative_code,
            count(*) as inq
           from ad_inquiries
          group by (date_trunc('day'::text, (ad_inquiries.at at time zone 'Asia/Seoul'::text))::date), (coalesce(ad_inquiries.creative_code, ''::text))
        )
 select coalesce(s.d, e.d, q.d) as d,
    coalesce(s.creative_code, e.creative_code, q.creative_code) as "소재",
    coalesce(s.sp, 0::numeric)::numeric(10,2) as "지출",
    coalesce(s.im, 0::numeric) as "노출",
    coalesce(s.ck, 0::numeric) as "클릭",
    coalesce(e.vis, 0::bigint) as "방문",
    coalesce(e.rd, 0::bigint) as "읽음",
    coalesce(e.cta, 0::bigint) as "카톡",
    coalesce(q.inq, 0::bigint) as "문의",
        case
            when coalesce(e.vis, 0::bigint) > 0 then round(100.0 * coalesce(e.cta, 0::bigint)::numeric / e.vis::numeric, 1)
            else null::numeric
        end as "카톡율"
   from s
     full join e on s.d = e.d and s.creative_code = e.creative_code
     full join q on coalesce(s.d, e.d) = q.d and coalesce(s.creative_code, e.creative_code) = q.creative_code
  order by (coalesce(s.d, e.d, q.d)) desc, (coalesce(s.sp, 0::numeric)::numeric(10,2)) desc;

/* ── ad_v_codes — 랜딩이 내준 카톡 코드 한 장에 하나 ───────────────  */
create or replace view public.ad_v_codes with (security_invoker = on) as
 select distinct on (code) code,
    ts as issued_at,
    landing,
    coalesce(med, 'direct'::text) as medium,
    cmp as campaign,
    cnt as creative_code,
    variant,
    slug,
    sid,
    refh,
    dev
   from ad_events
  where code is not null and (ev = any (array['cta'::text, 'code'::text]))
  order by code, ts;

/* ── ad_v_creative_perf — 소재 × 매체 통째 합(기간 없음) ───────────
   계약·보험료까지 셉니다. stage='contract' 인 줄만 셉니다.           */
create or replace view public.ad_v_creative_perf with (security_invoker = on) as
 with s as (
         select coalesce(ad_spend.creative_code, ''::text) as cc,
            coalesce(ad_spend.medium, ''::text) as m,
            sum(ad_spend.impressions) as imp,
            sum(ad_spend.clicks) as clk,
            sum(ad_spend.spend) as spend
           from ad_spend
          group by (coalesce(ad_spend.creative_code, ''::text)), (coalesce(ad_spend.medium, ''::text))
        ), e as (
         select coalesce(ad_events.cnt, ''::text) as cc,
            coalesce(ad_events.med, ''::text) as m,
            count(*) filter (where ad_events.ev = 'view'::text) as views,
            count(distinct ad_events.sid) filter (where ad_events.ev = 'view'::text) as visitors,
            count(*) filter (where ad_events.ev = 'cta'::text) as cta
           from ad_events
          group by (coalesce(ad_events.cnt, ''::text)), (coalesce(ad_events.med, ''::text))
        ), q as (
         select coalesce(ad_inquiries.creative_code, ''::text) as cc,
            coalesce(ad_inquiries.medium, ''::text) as m,
            count(*) as inq,
            count(*) filter (where ad_inquiries.stage = 'contract'::text) as contracts,
            sum(ad_inquiries.premium) filter (where ad_inquiries.stage = 'contract'::text) as premium
           from ad_inquiries
          group by (coalesce(ad_inquiries.creative_code, ''::text)), (coalesce(ad_inquiries.medium, ''::text))
        )
 select coalesce(s.cc, e.cc, q.cc) as creative_code,
    coalesce(s.m, e.m, q.m) as medium,
    coalesce(s.imp, 0::numeric) as impressions,
    coalesce(s.clk, 0::numeric) as clicks,
    coalesce(s.spend, 0::numeric) as spend,
    coalesce(e.views, 0::bigint) as views,
    coalesce(e.visitors, 0::bigint) as visitors,
    coalesce(e.cta, 0::bigint) as cta,
    coalesce(q.inq, 0::bigint) as inquiries,
    coalesce(q.contracts, 0::bigint) as contracts,
    coalesce(q.premium, 0::numeric) as premium
   from s
     full join e on s.cc = e.cc and s.m = e.m
     full join q on q.cc = coalesce(s.cc, e.cc) and q.m = coalesce(s.m, e.m);

/* ── ad_v_creative_pick — 화면의 소재 고르기 칸 ────────────────────
   ad_creatives 에 적힌 것 + <b>대장에 없는데 돈이 나가고 있는 소재</b>.
   뒤쪽을 union 으로 붙여 두었습니다 — 대장에 안 적고 광고를 올려도
   고르는 칸에서 사라지지 않습니다. 그때 title 이 '(목록에 없음)' 입니다.
   화면은 그 글자를 보면 이름을 안 붙입니다(지어내지 않습니다 · 1번).
   「돌고있음」 은 <b>최근 30일</b>에 지출이 있었나입니다.             */
create or replace view public.ad_v_creative_pick with (security_invoker = on) as
 with recent as (
         select ad_spend.creative_code,
            sum(ad_spend.spend) as sp
           from ad_spend
          where ad_spend.d >= (current_date - 30) and coalesce(ad_spend.creative_code, ''::text) <> ''::text
          group by ad_spend.creative_code
        )
 select c.code,
    c.title,
    coalesce(r.sp, 0::numeric)::numeric(10,2) as "최근지출",
    r.creative_code is not null as "돌고있음",
    c.review_until
   from ad_creatives c
     left join recent r on r.creative_code = c.code
union all
 select r.creative_code as code,
    '(목록에 없음)'::text as title,
    r.sp::numeric(10,2) as "최근지출",
    true as "돌고있음",
    null::date as review_until
   from recent r
  where not (exists ( select 1
           from ad_creatives c
          where c.code = r.creative_code))
  order by 4 desc, 3 desc, 1;

/* ── ad_v_daily — 날 × 랜딩 × 매체 × 소재 × 변형 ───────────────────  */
create or replace view public.ad_v_daily with (security_invoker = on) as
 select (ts at time zone 'Asia/Seoul'::text)::date as d,
    coalesce(landing, '?'::text) as landing,
    coalesce(med, 'direct'::text) as medium,
    coalesce(cmp, ''::text) as campaign,
    coalesce(cnt, ''::text) as creative_code,
    coalesce(variant, ''::text) as variant,
    count(*) filter (where ev = 'view'::text) as views,
    count(distinct sid) filter (where ev = 'view'::text) as visitors,
    count(*) filter (where ev = 'read50'::text) as read50,
    count(*) filter (where ev = 'tool'::text) as tool_use,
    count(*) filter (where ev = 'cta'::text) as cta,
    count(distinct code) filter (where ev = 'cta'::text) as codes,
    round(avg(dwell) filter (where ev = 'exit'::text)) as avg_dwell
   from ad_events
  group by ((ts at time zone 'Asia/Seoul'::text)::date), (coalesce(landing, '?'::text)), (coalesce(med, 'direct'::text)), (coalesce(cmp, ''::text)), (coalesce(cnt, ''::text)), (coalesce(variant, ''::text));

/* ── ad_v_quiz — 자가진단 퀴즈가 어디서 끊기나 ─────────────────────
   ★ 날짜가 박혀 있습니다(ts >= '2026-10-04'). 위 ③.
   ★ 날을 UTC 로 자릅니다 — board·daily 와 다릅니다. 위 ②.           */
create or replace view public.ad_v_quiz with (security_invoker = on) as
 select date_trunc('day'::text, ts)::date as d,
    coalesce(nullif(cnt, ''::text), '(없음)'::text) as creative_code,
    count(distinct sid) filter (where ev = 'view'::text) as "방문",
    count(distinct sid) filter (where (extra ->> 'n'::text) = 'quiz_start'::text) as "진단버튼",
    count(distinct sid) filter (where (extra ->> 'n'::text) = 'quiz_pick1'::text) as "q1답함",
    count(distinct sid) filter (where (extra ->> 'n'::text) = 'quiz_q3'::text) as "q3도달",
    count(distinct sid) filter (where (extra ->> 'n'::text) = 'quiz_q6'::text) as "q6도달",
    count(distinct sid) filter (where (extra ->> 'n'::text) = 'quiz_done'::text) as "완료",
    round(avg((extra ->> 'score'::text)::numeric) filter (where (extra ->> 'n'::text) = 'quiz_done'::text), 1) as "평균점수",
    count(distinct sid) filter (where ev = 'cta'::text) as "카톡클릭"
   from ad_events
  where ts >= '2026-10-04 00:00:00+00'::timestamp with time zone
  group by (date_trunc('day'::text, ts)::date), (coalesce(nullif(cnt, ''::text), '(없음)'::text))
  order by (date_trunc('day'::text, ts)::date) desc, (count(distinct sid) filter (where ev = 'view'::text)) desc;

/* ════════════════════════════════════════════════════════════════
   RLS · 권한 — 살아 있는 그대로

   표 일곱 다 RLS 가 켜져 있고, 규칙은 「로그인한 사람은 다 된다」
   하나씩입니다. 광고 숫자는 고객 실명이 아니고 설계사가 함께 보는
   것이라 역할로 더 가르지 않았습니다. ad_events 만 anon insert 가
   하나 더 있습니다 — 랜딩이 로그인 없이 보냅니다.
   ════════════════════════════════════════════════════════════════ */
alter table public.ad_creatives   enable row level security;
alter table public.ad_events      enable row level security;
alter table public.ad_experiments enable row level security;
alter table public.ad_inquiries   enable row level security;
alter table public.ad_landings    enable row level security;
alter table public.ad_links       enable row level security;
alter table public.ad_spend       enable row level security;

drop policy if exists ad_creatives_auth_all   on public.ad_creatives;
drop policy if exists ad_events_auth_all      on public.ad_events;
drop policy if exists ad_events_anon_insert   on public.ad_events;
drop policy if exists ad_experiments_auth_all on public.ad_experiments;
drop policy if exists ad_inquiries_auth_all   on public.ad_inquiries;
drop policy if exists ad_landings_auth_all    on public.ad_landings;
drop policy if exists ad_links_auth_all       on public.ad_links;
drop policy if exists ad_spend_auth_all       on public.ad_spend;

create policy ad_creatives_auth_all   on public.ad_creatives   for all to authenticated using (true) with check (true);
create policy ad_events_auth_all      on public.ad_events      for all to authenticated using (true) with check (true);
create policy ad_experiments_auth_all on public.ad_experiments for all to authenticated using (true) with check (true);
create policy ad_inquiries_auth_all   on public.ad_inquiries   for all to authenticated using (true) with check (true);
create policy ad_landings_auth_all    on public.ad_landings    for all to authenticated using (true) with check (true);
create policy ad_links_auth_all       on public.ad_links       for all to authenticated using (true) with check (true);
create policy ad_spend_auth_all       on public.ad_spend       for all to authenticated using (true) with check (true);

/* 랜딩이 로그인 없이 발자국만 넣는 문. 읽기는 안 줍니다 */
create policy ad_events_anon_insert on public.ad_events for insert to anon with check (true);

grant select, insert, update, delete on public.ad_creatives   to authenticated, service_role;
grant select, insert, update, delete on public.ad_events      to authenticated, service_role;
grant select, insert, update, delete on public.ad_experiments to authenticated, service_role;
grant select, insert, update, delete on public.ad_inquiries   to authenticated, service_role;
grant select, insert, update, delete on public.ad_landings    to authenticated, service_role;
grant select, insert, update, delete on public.ad_links       to authenticated, service_role;
grant select, insert, update, delete on public.ad_spend       to authenticated, service_role;

grant insert on public.ad_events to anon;

/* id 가 nextval 기본값이라 <b>시퀀스 권한이 없으면 insert 가 막힙니다.</b>
   2026-10-09 에 재어 보니 ad_* 시퀀스 여섯 다 anon 에게 usage·select 가
   붙어 있었습니다(Supabase 기본값). 여기서는 <b>정말 필요한 하나만</b>
   적습니다 — 나머지 다섯은 anon 이 insert 할 표가 아닙니다 */
grant usage, select on sequence public.ad_events_id_seq to anon;

grant select on public.ad_v_board         to authenticated, service_role;
grant select on public.ad_v_codes         to authenticated, service_role;
grant select on public.ad_v_creative_perf to authenticated, service_role;
grant select on public.ad_v_creative_pick to authenticated, service_role;
grant select on public.ad_v_daily         to authenticated, service_role;
grant select on public.ad_v_quiz          to authenticated, service_role;

/* ════════════════════════════════════════════════════════════════
   ★ 사장님이 정하실 한 줄 — anon 에게 붙어 있는 세 뷰

   ad_v_codes · ad_v_creative_perf · ad_v_daily 에 anon 권한이
   붙어 있습니다(Supabase 기본값으로 보입니다). 2026-10-09 에 anon 키로
   찔러 보니 <b>셋 다 401</b> 이라 지금은 닫혀 있습니다 —
   security_invoker 덕입니다. 그 하나에 기대고 싶지 않으시면 아래 석 줄을
   SQL Editor 에 따로 붙여 넣으십시오. 이 파일은 <b>스스로 빼지 않습니다.</b>

     revoke all on public.ad_v_codes         from anon;
     revoke all on public.ad_v_creative_perf from anon;
     revoke all on public.ad_v_daily         from anon;
   ════════════════════════════════════════════════════════════════ */
