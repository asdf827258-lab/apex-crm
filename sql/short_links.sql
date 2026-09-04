/* 짧은 주소 표 — Supabase SQL Editor 에서 <b>한 번만</b> 실행합니다.

   무엇을 담나
     「한장 보험료 비교」가 만든 고객 링크를 그대로 담고, 여섯 글자짜리
     code 로 다시 찾습니다. 담기는 것은 나이·성별·담보·보험료뿐이고
     고객 이름·연락처는 애초에 그 주소에 들어 있지 않습니다.

   누가 읽나
     서버(서비스 키)만 읽고 씁니다. RLS 를 켜 두고 정책을 하나도 두지
     않으므로, 공개 anon 키로는 아무것도 못 봅니다.

   언제 사라지나
     expires_at 이 지나면 서버가 열어 주지 않고, 아래 지우기 문장을
     가끔 돌리면 실제로 지워집니다.                                   */

create table if not exists public.short_links (
  code        text primary key,
  url         text not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);

create index if not exists short_links_expires_idx
  on public.short_links (expires_at);

alter table public.short_links enable row level security;

/* 정책을 하나도 만들지 않습니다 — 서비스 키만 지나갑니다.
   (혹시 예전에 만들어 둔 것이 있으면 지웁니다) */
drop policy if exists short_links_anon_read  on public.short_links;
drop policy if exists short_links_anon_write on public.short_links;

/* 기간이 지난 것 지우기 — 가끔 손으로 돌리시거나 스케줄에 걸어 두십시오
   delete from public.short_links where expires_at < now();
*/
