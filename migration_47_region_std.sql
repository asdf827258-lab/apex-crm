/* ════════════════════════════════════════════════════════════════
   지역을 카카오가 정한 이름으로 하나로 모은다

   지역이 자유 입력이라 「순천」·「순천시」·「전남 순천시」가 서로 다른
   지역으로 갈라졌습니다. 갈라지면 이런 일이 납니다.

     · 「이 지역 열 명」에 사람이 덜 뜬다 (다른 이름으로 적힌 사람이 빠짐)
     · 지도 지역 목록에 같은 데가 두 번 뜬다
     · 지역별로 세는 숫자가 어긋난다

   그래서 주소를 카카오에 물어보고, 카카오가 쓰는 행정구역 이름과
   법정동 코드를 같이 적어 둡니다. 코드는 절대 갈라지지 않습니다.

     region_code — 법정동 코드 10자리 (앞 5자리가 시·군·구)
     sido        — 전라남도
     sigungu     — 순천시      ← 지역 칸에 들어갈 표준 이름
     dong        — 조례동

   Supabase → SQL Editor 에 통째로 붙여 넣고 한 번 실행하십시오.
   여러 번 실행해도 안전합니다. migration_46 을 먼저 돌렸어야 합니다.
   ════════════════════════════════════════════════════════════════ */
set search_path = public;

do $blk$
begin
  if to_regclass('public.dbs') is null then
    raise notice 'dbs 표가 없습니다 — 건너뜁니다';
    return;
  end if;

  alter table public.dbs add column if not exists region_code text;
  alter table public.dbs add column if not exists sido        text;
  alter table public.dbs add column if not exists sigungu     text;
  alter table public.dbs add column if not exists dong        text;
end
$blk$;

/* 시·군·구로 뽑아 볼 일이 많습니다 — 앞 5자리로 찾는 색인 */
do $blk$
begin
  if to_regclass('public.dbs') is null then return; end if;
  if not exists(
    select 1 from pg_indexes
     where schemaname = 'public' and tablename = 'dbs' and indexname = 'dbs_sigungu_idx'
  ) then
    execute 'create index dbs_sigungu_idx on public.dbs (left(region_code, 5))';
  end if;
end
$blk$;

/* ── 이름만 보고도 갈라지지 않게 ───────────────────────────────
   코드가 아직 없는 줄끼리도 비교할 수 있어야 합니다. 시·도 이름을
   떼고 끝의 시/군/구를 뗀 「맨 이름」을 만드는 함수입니다.
   화면(apex-route.js)의 regionText() 와 같은 규칙입니다.

     「전남 순천시」 → 순천        「순천」 → 순천
     「여수시」      → 여수        「고흥군」 → 고흥

   시·도 이름밖에 없으면(「광주」) 그대로 둡니다 — 지우면 빈칸이 됩니다. */
create or replace function public.region_key(txt text)
returns text language plpgsql immutable as $fn$
declare s text; t text;
begin
  s := regexp_replace(coalesce(txt, ''), '\s+', '', 'g');
  if s = '' then return ''; end if;

  t := regexp_replace(s,
       '^(서울특별시|서울|부산광역시|부산|대구광역시|대구|인천광역시|인천|'
     ||'광주광역시|대전광역시|대전|울산광역시|울산|세종특별자치시|세종|'
     ||'경기도|경기|강원특별자치도|강원도|강원|충청북도|충북|충청남도|충남|'
     ||'전북특별자치도|전라북도|전북|전라남도|전남|경상북도|경북|경상남도|경남|'
     ||'제주특별자치도|제주도|제주)', '');
  if t <> '' then s := t; end if;

  t := regexp_replace(s, '(특별자치시|특별자치도|특별시|광역시|자치시|자치구|자치도)$', '');
  if t <> '' then s := t; end if;

  t := regexp_replace(s, '(시|군|구)$', '');
  if t <> '' then s := t; end if;

  return lower(s);
end;
$fn$;

/* ── 지역이 몇 갈래로 갈라져 있는지 먼저 보여 준다 ─────────────
   이 결과에서 같은 「맨 이름」이 두 줄 이상이면 갈라져 있는 것입니다.
   화면의 「🏷 지역 정리」 버튼이 이것을 하나로 모아 줍니다. */
select public.region_key(region) as 맨이름,
       region                    as 적힌대로,
       count(*)                  as 건수,
       count(region_code)        as 코드있음
  from public.dbs
 where coalesce(region, '') <> ''
 group by 1, 2
 order by 1, 3 desc;
