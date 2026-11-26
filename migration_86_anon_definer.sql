/* ============================================================ */
/* 🔒 로그인 안 한 사람(anon)이 부를 수 있던 서버 함수 다섯 막기 (판 X574) */
/* ············································································ */
/* 보안 점검(get_advisors security)에 anon_security_definer_function_executable */
/* 경고 다섯이 남아 있었다 (2026-11-26).                                   */
/*   is_my_client(cid) · is_my_client_or_admin(cid)                        */
/*   mbti_mark_paid(p_id, p_method) · recruits_assign(p_ids, p_owner)      */
/*   recruits_purge(p_days)                                                */
/* 로그인 안 한 사람이 /rest/v1/rpc/... 로 부를 수 있었다.                */
/*                                                                        */
/* ── 재어 본 것 (1번) ──────────────────────────────────────────── */
/* ① 다섯 다 몸 안에서 이미 막는다 — 지금 뚫린 구멍은 아니다.            */
/*    mbti_mark_paid · recruits_assign · recruits_purge 는                 */
/*    is_admin() or is_owner() 가 아니면 false · 0 을 돌려주고 손대지 않는다. */
/*    두 자 모두 exists(...) 라 로그인 안 하면 NULL 이 아니라 false 다     */
/*    (10-28 pipeline_can_edit 처럼 NULL 이 새는 병은 없다).               */
/*    is_my_client 는 담당자가 나인지 보는 자라 로그인 안 하면 늘 false.  */
/* ② 그래도 막는다 — 지우기(recruits_purge) · 결제 표시(mbti_mark_paid)는 */
/*    한 겹(몸 안 검사)에만 기대면 안 된다. 몸을 누가 고치다 실수하면     */
/*    바로 뚫린다. 권한이 두 번째 겹이다.                                 */
/* ③ 부르는 곳: 저장소 전체에서 recruits_assign 하나만 부르고(app/index.html · */
/*    로그인한 관리자 화면) 나머지 넷은 규칙(RLS) 안에서만 쓰이거나 아무도 */
/*    rpc 로 안 부른다. netlify functions 는 service_role 키로 부르므로   */
/*    여기 권한 회수와 상관없다. 랜딩이 anon 키로 부르는 곳은 0곳.        */
/* ④ migration_80 이 recruits_* 를 「from public」 으로 회수했는데도 anon */
/*    이 남은 까닭 — Supabase 는 anon 에게 따로 직접 준다. 그래서          */
/*    「from public, anon」 둘을 같이 적어야 한다.                         */
/*                                                                        */
/* ── 같이 바꾸는 규칙 일곱 (to authenticated) ──────────────────── */
/* policies_mine · documents_mine · proposals_mine 과 storage 의          */
/* coverage_docs_read/insert/update/delete 일곱은 역할이 public(모두)이고 */
/* 몸에서 is_my_client 를 부른다. anon 실행권만 빼면 로그인 안 한 사람이 */
/* 그 표를 건드릴 때 「빈 답」 이 아니라 「함수 권한 없음」 오류가 난다. */
/* 특히 storage.objects 는 통(버킷) 전체가 한 표라, 다른 통을 anon 으로  */
/* 쓰는 화면이 생기면 그 화면까지 오류가 난다.                          */
/* 규칙을 로그인한 사람(to authenticated)에게만 걸면 anon 은 그 규칙을   */
/* 아예 안 거치고 빈 답을 받는다. 조건(using · with check)은 한 자도     */
/* 안 바꾼다 — 역할만 좁힌다. 청구(claims_mine_admin)는 이미 authenticated. */
/*                                                                        */
/* ★ schema_version 은 안 건드린다 — 표도 칸도 안 생기고 권한만 바뀐다.  */
/*                                                                        */
/* 되돌리려면:                                                            */
/*   grant execute on function (다섯) to anon;                            */
/*   alter policy (일곱) on (표) to public;                               */
/* ============================================================ */

/* ── 다섯 함수: 로그인 안 한 사람 실행권 회수 · 로그인한 사람은 그대로 ── */
revoke execute on function public.is_my_client(uuid)                 from public, anon;
revoke execute on function public.is_my_client_or_admin(uuid)        from public, anon;
revoke execute on function public.mbti_mark_paid(uuid, text)         from public, anon;
revoke execute on function public.recruits_assign(uuid[], uuid)      from public, anon;
revoke execute on function public.recruits_purge(integer)            from public, anon;

grant execute on function public.is_my_client(uuid)                  to authenticated;
grant execute on function public.is_my_client_or_admin(uuid)         to authenticated;
grant execute on function public.mbti_mark_paid(uuid, text)          to authenticated;
grant execute on function public.recruits_assign(uuid[], uuid)       to authenticated;
grant execute on function public.recruits_purge(integer)             to authenticated;

/* ── is_my_client 를 부르는 규칙 일곱: 로그인한 사람에게만 ── */
alter policy policies_mine        on public.policies  to authenticated;
alter policy documents_mine       on public.documents to authenticated;
alter policy proposals_mine       on public.proposals to authenticated;
alter policy coverage_docs_read   on storage.objects  to authenticated;
alter policy coverage_docs_insert on storage.objects  to authenticated;
alter policy coverage_docs_update on storage.objects  to authenticated;
alter policy coverage_docs_delete on storage.objects  to authenticated;
