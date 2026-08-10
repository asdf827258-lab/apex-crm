/* ════════════════════════════════════════════════════════════════
   DB 종류 목록을 팀원 누구나 고칠 수 있게 한다

   36번에서 종류 목록을 app_config 의 db_sources 한 줄에 넣었다.
   그런데 app_config 는 대표·운영자만 쓸 수 있는 표라서,
   팀원이 등록하다가 새 종류를 만나도 넣을 수가 없었다.

   실제로 전화를 돌리는 사람이 새 DB 종류를 제일 먼저 만난다.
   그때마다 대표에게 부탁해야 하면 아무도 안 넣고 '일반' 으로 뭉친다.
   그러면 종류별 타율이라는 것 자체가 의미를 잃는다.

   바뀌는 것:
     - db_sources 한 줄만 팀원 누구나 넣고 고칠 수 있다
     - 나머지 설정(owner_email, pay, 스키마 버전 등)은 그대로 대표만
     - 지우는 것도 그 한 줄뿐이고, 표를 통째로 지우지는 못한다

   고객 자료는 건드리지 않는다. 목록에서 종류를 빼도
   이미 그 종류로 저장된 dbs 줄은 그대로 남는다.

   이 파일은 몇 번을 다시 실행해도 안전하다.
   먼저 migration_36_db_source.sql 을 실행해 두어야 한다.
   ════════════════════════════════════════════════════════════════ */

/* 넣기 — db_sources 한 줄만 */
drop policy if exists app_config_src_insert on public.app_config;

create policy app_config_src_insert on public.app_config for insert to authenticated
with check (key = 'db_sources');

/* 고치기 — db_sources 한 줄만.
   using 과 with check 둘 다 걸어야 다른 줄을 db_sources 로 바꿔치기할 수 없다. */
drop policy if exists app_config_src_update on public.app_config;

create policy app_config_src_update on public.app_config for update to authenticated
using (key = 'db_sources')
with check (key = 'db_sources');

/* 지우는 정책은 만들지 않는다.
   목록을 비우는 일은 화면에서 막고 있고, 줄 자체를 없앨 이유도 없다. */

/* 아직 한 줄도 없으면 만들어 둔다. 있으면 건드리지 않는다. */
insert into public.app_config(key, value) values(
  'db_sources',
  '일반,방송,보장분석,농협,소개,지인,개척'
) on conflict (key) do nothing;
