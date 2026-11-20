/* ════════════════════════════════════════════════════════════════
   광고가 <b>어느 자리에서 왔나</b> — 그리고 인스타는 왜 카톡까지 안 오나

   2026-11-12. 사장님 물음 「유입의 문제점은 뭘까 … 왜케 어려워하고
   카톡까진 안 오까」. 발자국 2,689건을 자리별로 갈라 재어 보니
   <b>원인이 페이지도 심의 문안도 아니었습니다.</b>

     자리                 방문    읽음    읽음→카톡
     an(오디언스 네트워크) 1,310   0.8%    (수가 너무 적음)
     ig(인스타그램)        1,120   8.1%    <b>6.6%</b>
     fb(페이스북)            181  12.7%    <b>82.6%</b>

   ★ <b>읽기까지는 인스타가 페이스북과 비슷하게 옵니다.</b> 무너지는 것은
     「읽고 나서 카톡으로 넘어가는 그 한 칸」 뿐입니다 — 같은 페이지,
     같은 심의 문안인데 12배 갈립니다. 그래서 고칠 자리는 페이지의 글이
     아니라 <b>노출 자리</b>와 <b>카톡으로 넘기는 길</b>입니다.

   ★ AN 은 거의 전부 헛클릭입니다 — 이탈 997건 중 710건이 3초 이하.
     남의 앱·게임 안에서 손가락이 잘못 닿은 것입니다.

   이 판이 하는 일은 둘입니다.

   ── ① 자리별로 재는 자를 하나 둡니다 (ad_v_place) ─────────────────

   여태 이 수는 <b>제가 그때그때 SQL 을 써서</b> 재야 나왔습니다. 그러면
   다음에 또 물어보셔야 하고, 묻는 사람마다 다르게 셀 수 있습니다(5번).
   뷰 하나로 못 박아 화면이 바로 읽게 합니다.

   ★ <b>자리별 「지출」 은 넣지 않았습니다 — 없는 값입니다</b>(1번).
     ad_spend 에는 자리(src) 칸이 아예 없습니다. 메타가 지출을 자리별로
     쪼개 주지 않으면 우리가 알 길이 없고, <b>방문 수로 나눠 지어내면
     그것이 사실로 보입니다.</b> 그래서 이 뷰는 <b>방문·읽음·카톡만</b>
     셉니다. 화면도 그 칸에 $ 를 한 자도 안 찍습니다.

   ★ <b>비율 칸도 넣지 않았습니다</b>(5번). ad_v_board 가 「카톡율」 을
     내주는데 화면은 그것을 안 쓰고 합계로 다시 셉니다 — 줄마다의 비율은
     더할 수 없기 때문입니다. 같은 자리를 두 번 만들지 않으려고, 비율은
     <b>화면이 합계에서 한 번만</b> 셉니다.

   ★ 「(모름)」·「(치환안됨)」 을 숨기지 않습니다. 실제로 56건이
     utm_source 가 <b>`{{site_source_name}}` 글자 그대로</b> 들어와
     있었습니다 — 메타가 그 자리를 안 바꿔 준 것이고, 그 줄은 어느
     자리인지 모릅니다. 모르는 것은 모른다고 세웁니다(1번).

   ── ② 인스타 DM 으로 가는 길의 <b>자리만</b> 냅니다 ────────────────

   사장님 생각(「사이트로 들어갔다가 → DM 으로」)이 맞는 방향입니다.
   인스타 사람은 앱을 떠나기 싫어합니다. 그래서 랜딩에 DM 단추를 둘
   자리를 마련합니다 — ad_landings 에 칸 둘.

     dm_url      인스타 DM 주소 (ig.me/m/<계정> 꼴). <b>비워 두면
                 DM 단추를 세우지 않습니다</b> — 기본값을 주지 않은
                 까닭입니다. 값이 없으면 화면을 세우지 않습니다(1번).
     dm_sources  어느 유입 자리에만 DM 을 보일지. 기본 {ig}.
                 짐작으로 전부에 보이지 않습니다.

   ★ <b>단추 자체는 이 저장소에서 못 만듭니다.</b> 랜딩(bojang ·
     dbcompare · selfcheck)은 별개 Netlify 사이트입니다. 여기서 두는 것은
     <b>그 사이트들이 같이 읽을 표 한 벌</b>입니다 — 규칙을 양쪽에 각자
     적으면 한쪽만 고쳐집니다(5번). 랜딩은 이미 Supabase 에 발자국을
     보내고 있으니 이 칸을 그대로 읽으면 됩니다.

   ★ <b>열기 전에 정할 것 넷이 남아 있습니다</b> — 이 판은 그중 아무것도
     정하지 않습니다. dm_url 이 비어 있으면 어제와 똑같이 돕니다.
       · 심의 — DM 은 새 유입 창구이고 자동응대 문구도 심의 대상일 수 있음
       · 자동응대 — 카카오 채널의 버튼 6개에 해당하는 것이 DM 에는 없음
       · 문의 기록 — DM 은 인스타에 쌓이므로 365일로 오는 길이 따로 필요
       · 개인정보 — DM 은 상대 인스타 아이디가 따라옴 (3번)

   Supabase → SQL Editor 에 통째로 붙여 넣고 한 번 실행하십시오.
   여러 번 실행해도 안전합니다. 지우는 문장은 없습니다.
   ════════════════════════════════════════════════════════════════ */
set search_path = public;

/* ── ① 자리별로 재는 자 ──────────────────────────────────────────── */
create or replace view public.ad_v_place with (security_invoker = on) as
 select
   (ad_events.ts at time zone 'Asia/Seoul'::text)::date as d,
   case
     when coalesce(ad_events.src, ''::text) = ''::text then '(모름)'::text
     when ad_events.src ~ '^\{\{.*\}\}$'::text            then '(치환안됨)'::text
     else ad_events.src
   end as "자리",
   case coalesce(ad_events.src, ''::text)
     when 'fb'::text  then '페이스북'::text
     when 'ig'::text  then '인스타그램'::text
     when 'an'::text  then '오디언스 네트워크'::text
     when 'msg'::text then '메신저'::text
     when ''::text    then '어디서 왔는지 모름'::text
     else case when ad_events.src ~ '^\{\{.*\}\}$'::text
               then '메타가 자리 이름을 안 넣어 줌'::text
               else ad_events.src end
   end as "자리이름",
   count(distinct ad_events.sid) filter (where ad_events.ev = 'view'::text)   as "방문",
   count(distinct ad_events.sid) filter (where ad_events.ev = 'read25'::text) as "읽음",
   count(distinct ad_events.sid) filter (where ad_events.ev = 'cta'::text)    as "카톡",
   count(*) filter (where ad_events.ev = 'exit'::text and ad_events.dwell <= 3) as "즉시이탈",
   count(*) filter (where ad_events.ev = 'exit'::text)                          as "이탈기록"
 from ad_events
 group by 1, 2, 3;

grant select on public.ad_v_place to authenticated, service_role;

/* ── ② 인스타 DM 으로 가는 길의 자리 ─────────────────────────────── */
alter table public.ad_landings add column if not exists dm_url     text;
alter table public.ad_landings add column if not exists dm_sources text[] default '{ig}'::text[];

comment on column public.ad_landings.dm_url is
  '인스타 DM 주소(ig.me/m/<계정>). 비어 있으면 DM 단추를 세우지 않는다 — 값이 없으면 화면을 세우지 않는다(1번)';
comment on column public.ad_landings.dm_sources is
  '어느 유입 자리(utm_source)에만 DM 을 보일지. 기본 {ig} — 짐작으로 전부에 보이지 않는다';
