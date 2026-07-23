-- APEX DB CRM / 관리자 지정 + 담당자 삭제 권한 (5단계)
-- Supabase Dashboard > SQL Editor에서 "내용 전체"를 붙여넣고 실행하세요.
-- 여러 번 실행해도 안전합니다(멱등).

-- ============================================================
-- 1) 관리자만 담당자(profiles)를 삭제할 수 있게 RLS 추가
--    (앱의 담당자 관리 화면 '삭제' 버튼이 동작하려면 필요)
-- ============================================================
drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete on public.profiles
  for delete to authenticated using (public.is_admin());

-- ============================================================
-- 2) 현재 가입된 계정 목록 확인 (윤시현님 이메일을 찾으세요)
--    실행하면 아래 결과 탭에 이메일/이름/권한이 나옵니다.
-- ============================================================
select u.email, p.name, p.role, p.created_at
from auth.users u
join public.profiles p on p.id = u.id
order by p.created_at;

-- ============================================================
-- 3) 윤시현 계정을 최고관리자(admin)로 지정
--    아래 'here@example.com' 을 2)에서 확인한 윤시현님 로그인 이메일로
--    바꾼 뒤, 이 문단만 다시 실행하세요.
-- ============================================================
update public.profiles p
set role = 'admin', name = '윤시현'
from auth.users u
where p.id = u.id
  and u.email = 'here@example.com';

notify pgrst, 'reload schema';
