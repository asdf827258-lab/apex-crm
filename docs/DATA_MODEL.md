# DATA_MODEL — 통합 OS 데이터 모델

최종 갱신: 2026-07-17. 기존 0001 스키마(26테이블, 라이브) + 신규 0004(통합 OS 확장).

> 공통 규칙: 모든 신규 테이블은 `id uuid pk default gen_random_uuid()`, `created_at`, 필요 시 `updated_at`, 작성자(`created_by → public.profiles(id)`), 소속 경계 컬럼을 갖는다. 핵심 수치엔 출처(`source_page/source_text`). 고객 1인=1 `client_id`, 계약 1건=1 `policy_id`.

## 1. 기존(라이브, 0001) — 그대로 사용

고객/가구: `clients`, `households` · 문서: `documents`, `document_pages`, `extraction_runs` · 계약/담보: `policies`, `coverages` · 제안: `proposals`, `proposal_plans`, `proposal_coverages` · 분석: `analysis_cases`, `comparison_scenarios`, `account_assessments`(8통장) · 학습루프: `advisor_feedback`, `rule_candidates`, `knowledge_rules` · 결과물: `report_versions` · 지급사례: `claims_cases`, `claims_evidence` · 제도값: `reference_data` · 아카데미: `academy_modules`, `academy_quiz_questions`, `academy_progress`, `academy_evaluations` · 로그: `ai_runs`, `audit_logs`.

세부 컬럼은 `supabase/migrations/0001_schema.sql` 및 `COVERAGE_DATA_SCHEMA.md` 참조.

## 2. 신규(0004) — 통합 OS 확장 (가산)

프롬프트 §20 엔티티 중 기존 미보유분. 기존 것과 중복 신설 금지(매핑 명시).

| 신규 테이블 | 목적 | 핵심 컬럼 | 소속/RLS 경계 |
|---|---|---|---|
| `branches` | 지점/사업단 조직 | name, parent_id, manager_id | admin write, 전원 read |
| `financial_profiles` | 고객 재무 상세(households 보강) | client_id, savings, emergency_fund, national_pension, retirement_pension, personal_pension, retire_expense_wish, loans_json | can_see_client |
| `health_profiles` | 건강·병력(민감, 분리 저장) | client_id, conditions_json, meds, disclosures_json, sensitivity='high' | can_see_client + 최소권한 |
| `policy_change_options` | 계약관리 판단(배서·대체납입·감액완납 등 17종) | policy_id, change_type, before_json, after_json, premium_delta, coverage_delta, pros, cons, insurer_checks, docs_needed, reversibility, customer_script, approval_required | via policy→client |
| `consultations` | 상담 기록(전/중/후) | client_id, advisor_id, phase(pre/live/post), summary, checklist_json, next_action, due_date, reviewer_id | can_see_client |
| `consultation_transcripts` | 녹취 분석 | consultation_id, transcript, metrics_json(질문수·발화비율·단정표현), risk_flags | via consultation→client |
| `advisor_scores` | 100점 성장(8영역) | advisor_id, period, total, breakdown_json(8영역), grade, prev_delta, restricted(준법제한), evaluated_at | 본인+leader+branch+admin |
| `score_evidence` | 점수 근거 연결 | advisor_id, area, source_type, source_id, delta, note | 본인+상위 |
| `learning_tasks` | 개인 성장/오답 과제 | advisor_id, origin(quiz/consult/analysis), title, concept, status, due_date | 본인+상위 |
| `quiz_attempts` | 퀴즈 응시 | advisor_id, question_id, chosen_idx, correct, created_at | 본인+상위 |
| `coaching_records` | 지점장 코칭 | advisor_id, coach_id, strengths, weaknesses, praise, coach_note, recommend_quiz, recheck_date | 상위+본인 |
| `approvals` | 본부장 승인 큐(고위험) | entity, entity_id, request_type, risk_level, requested_by, status, approver_id, decision_note, decided_at | 요청자·상위 |
| `aftercare_tasks` | 청구·사후관리 후속 | client_id, kind, status, due_date, assignee_id, note | can_see_client |
| `claims` | 보험금 청구 워크플로우 | client_id, diagnosis, kcd_code, treatment, admit_type, date, candidate_coverages_json, docs_json, status(접수/보완/지급/삭감/부지급), payout_amount, waiver | can_see_client |
| `manuals` | 업무매뉴얼 | slug, title, category, content_md, updated_by, version, updated_at | 전원 read, 관리자 write, 이력 |
| `manual_revisions` | 매뉴얼 변경이력 | manual_id, content_md, editor_id, created_at | 관리자 |
| `notifications` | 알림/능동비서 큐 | user_id, kind, title, body, ref_entity, ref_id, due_at, read_at | 본인 |
| `insurance_products` | 보험지식사전(20종) | code, name, category, simple_desc, customer_desc, expert_desc, cautions | 전원 read, 관리자 write |
| `coverage_dictionary` | 담보 지식/정규화 사전 | code, name, what, when_paid, pay_count, vs_similar, role, terms_ref, misconceptions, customer_line | 전원 read, 관리자 write |

매핑: `analyses`(프롬프트) = 기존 `analysis_cases`. `quizzes` = `academy_quiz_questions`. `roles` = `profiles.role`(text). `reasoning_rules` = `knowledge_rules`.

## 3. 관계 요약

```
branches ─< profiles(역할) ─< clients ─┬─< households / financial_profiles / health_profiles
                                        ├─< documents ─< document_pages / extraction_runs
                                        ├─< policies ─< coverages / policy_change_options
                                        ├─< proposals ─< proposal_plans ─< proposal_coverages
                                        ├─< analysis_cases ─< comparison_scenarios / account_assessments(8) / advisor_feedback / report_versions
                                        ├─< consultations ─< consultation_transcripts
                                        ├─< claims / aftercare_tasks
advisor(profiles) ─< advisor_scores ─< score_evidence ; learning_tasks ; quiz_attempts ; coaching_records ; academy_progress/evaluations
knowledge_rules/rule_candidates(학습) ; approvals(승인큐) ; manuals/manual_revisions ; notifications ; claims_cases/claims_evidence ; reference_data ; insurance_products/coverage_dictionary
```

## 4. 마이그레이션 규칙

- 0004는 `create table if not exists` + enum은 `do $$ ... duplicate_object` 가드. CRM/OS 0001 테이블 재정의 금지.
- 각 신규 테이블 RLS 즉시 부여(ROLE_PERMISSION 매트릭스). 손자 테이블은 상위 조인으로 판단.
- 적용: 로컬 파싱 검토 → SQL Editor 실행(사용자) 또는 `apply_migrations.mjs`.
