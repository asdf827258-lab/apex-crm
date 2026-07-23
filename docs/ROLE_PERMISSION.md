# ROLE_PERMISSION — 역할·권한 설계

최종 갱신: 2026-07-17. 기존 CRM 3역할 위에 OS 5역할을 얹는다(가산·비파괴).

## 1. 역할 매핑

| OS 역할(프롬프트) | 사용자 직책 | profiles.role 값 | 비고 |
|---|---|---|---|
| advisor | 설계사 | `member` | 기존 재사용 |
| team_leader | 팀장 | `leader` | 기존 재사용 |
| education_manager | 교육매니저 | `education_manager` | **신규** |
| branch_manager | 지점장/사업단장 | `branch_manager` | **신규** |
| admin | 본부장 | `admin` | 기존 재사용 |

> 사용자 본인 직책: **지점장 · 사업단장 · 본부장**. 사업단장은 branch_manager 상위 범위로 취급하되, 초기엔 branch_manager 권한 + 광역 조회로 운영하고 필요 시 `branches.parent_id`로 계층 확장.

## 2. profiles.role 확장 방법 (비파괴)

기존 CRM CHECK가 `admin|leader|member`일 경우 값 추가:
```sql
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','leader','member','education_manager','branch_manager'));
```
기존 함수 의미 보존: `is_admin()`=admin, `is_leader()`=leader. 신규 판별 함수는 `os_` 접두로 추가:
```sql
create or replace function public.os_is_branch() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role in ('branch_manager','admin') and active); $$;
create or replace function public.os_is_edu() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role in ('education_manager','admin') and active); $$;
```

## 3. 데이터 접근 매트릭스

| 데이터 | advisor | team_leader | education_manager | branch_manager | admin |
|---|---|---|---|---|---|
| 본인 고객/계약/상담/청구 | CRUD | 팀 조회 | – | 지점 조회 | 전체 |
| 타 설계사 고객 | ✕ | 팀 read | ✕ | 지점 read | 전체 |
| 건강·병력(health_profiles) | 본인고객 | 팀 read(마스킹) | ✕ | 지점 read(마스킹) | 전체 |
| advisor_scores/score_evidence | 본인 | 팀 | 전체 read | 지점 | 전체 |
| learning_tasks/quiz/academy | 본인 | 팀 | 전체 관리 | 지점 | 전체 |
| coaching_records | 본인(관련) | 작성(팀) | read | 작성(지점) | 전체 |
| approvals(고위험) | 요청 | 요청 | – | 검토 | 승인 |
| knowledge_rules(규칙) | read | read | read | read | write/approve |
| claims_cases 검증·승인 | read | read | – | read | write |
| manuals | read | read | 편집(교육범위) | read | write |
| reference_data(제도값) | read | read | read | read | write |
| audit_logs | ✕ | ✕ | ✕ | ✕(지점요약 검토용 별도뷰) | read |

## 4. RLS 원칙

- 신규 테이블 전수 `enable row level security`.
- 고객종속: `public.can_see_client(client_id)`. 손자: 상위 조인.
- 점수·학습·코칭: `advisor_id = auth.uid() or os_is_edu() or os_is_branch() or is_admin() or (is_leader() and is_my_teammate(advisor_id))`.
- 승인: 요청자 본인 + os_is_branch/admin.
- 건강정보: 최소권한. 팀장/지점장 조회 시 앱단 추가 마스킹.
- 쓰기 정책은 읽기보다 좁게(예: 규칙·제도값·매뉴얼·지급사례 검증은 admin/역할한정).

## 5. 프런트 가시성

`visibleTabs(role)`가 15메뉴를 필터:
- advisor: 1~11,14,15
- team_leader: advisor + 12(팀 범위)
- education_manager: 1,2,4,11(관리),14,15 + 점수/학습 read
- branch_manager: 전 메뉴(지점 범위), 12,13(지점)
- admin: 전 메뉴 전체범위, 13(본부장 관리)

프런트 필터는 UX일 뿐, **실제 경계는 RLS가 강제**한다.

## 6. 검증(ACCEPTANCE 연계)

타 설계사 고객 접근 차단 · 로그아웃 후 개인정보 비노출 · 건강정보 최소노출 · service_role 비노출 · 고위험 미승인 발송 차단.
