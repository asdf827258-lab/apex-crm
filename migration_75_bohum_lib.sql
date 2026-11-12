/* 📥 마스터 아카데미 「자료 넣기」 — 팀이 함께 쓰는 자료칸 (판 X427)
   사장님 말씀 (2026-11-12) — 「앞으로 자료를 또는 이미지를 마스터아카데미에 다 넣으면 자동으로
   검색이 될 수 있니 그리고 마스터아카데미에 넣는 칸을 만들어줘 어디서든 공유 되도록」
   → 넣는 사람: 「팀원 누구나」 · 그림 설명: 「AI 가 읽고 자동 설명」

   ★ 읽기 — 로그인한 팀원 모두. 넣기 — 로그인한 사람이 <b>자기 이름으로만</b>(uploader = auth.uid()).
     지우기 · 고치기 — 넣은 사람 또는 대표(is_owner) · 관리자(is_admin).
   ★ 보관함(bohum-lib)은 <b>공개가 아닙니다</b> — 주소를 아는 사람이 아니라 로그인한 팀원만 봅니다.
     원수사 약관은 앱이 올리기 전에 막습니다(9번 — 이 칸에는 안 들어옵니다).
   ★ 같은 파일은 두 번 안 받습니다 — 바이트 지문(sha)에 유일 색인 (5-1번).
   ★ 고객 자료는 담지 않습니다 — 앱이 이 기기에 적힌 고객 이름이 든 글을 막습니다 (3번).
   ★ 세 곳(이 파일 · 서버 · 앱 안 SQL OS_REPAIR_SQL)의 꼴이 <b>같아야</b> 합니다.
   ★ academy_ 로 시작하는 이름은 쓰지 않습니다 — CRM 표와 부딪힌 적이 있습니다(sync.js 머리글). */
create table if not exists public.bohum_lib (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('img','pdf')),
  title      text not null,
  descr      text,
  tags       text,
  excerpt    text,
  path       text not null,
  mime       text,
  size       int,
  sha        text not null,
  tsha       text,
  ai         boolean not null default false,
  uploader   uuid not null default auth.uid(),
  uploader_name text,
  created_at timestamptz not null default now()
);
create unique index if not exists bohum_lib_sha on public.bohum_lib(sha);

alter table public.bohum_lib enable row level security;

drop policy if exists bohum_lib_read on public.bohum_lib;
create policy bohum_lib_read on public.bohum_lib for select to authenticated using (auth.uid() is not null);
drop policy if exists bohum_lib_insert on public.bohum_lib;
create policy bohum_lib_insert on public.bohum_lib for insert to authenticated with check (uploader = auth.uid());
drop policy if exists bohum_lib_update on public.bohum_lib;
create policy bohum_lib_update on public.bohum_lib for update to authenticated
  using (uploader = auth.uid() or public.is_owner() or public.is_admin())
  with check (uploader = auth.uid() or public.is_owner() or public.is_admin());
drop policy if exists bohum_lib_delete on public.bohum_lib;
create policy bohum_lib_delete on public.bohum_lib for delete to authenticated
  using (uploader = auth.uid() or public.is_owner() or public.is_admin());
grant select, insert, update, delete on public.bohum_lib to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bohum-lib', 'bohum-lib', false, 20971520,
        array['image/png','image/jpeg','image/webp','image/gif','application/pdf'])
on conflict (id) do nothing;

drop policy if exists bohum_lib_obj_read on storage.objects;
create policy bohum_lib_obj_read on storage.objects for select to authenticated
  using (bucket_id = 'bohum-lib' and auth.uid() is not null);
drop policy if exists bohum_lib_obj_insert on storage.objects;
create policy bohum_lib_obj_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'bohum-lib' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists bohum_lib_obj_delete on storage.objects;
create policy bohum_lib_obj_delete on storage.objects for delete to authenticated
  using (bucket_id = 'bohum-lib' and (owner = auth.uid() or public.is_owner() or public.is_admin()));

comment on table public.bohum_lib is
  '마스터 아카데미 자료 넣기 — 읽기 로그인 전원 · 넣기 본인 이름 · 지우기 본인/대표/관리자. 파일은 보관함 bohum-lib(비공개).';
