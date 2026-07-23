# INTEGRATION_RISK_REPORT — 통합 위험 보고서

최종 갱신: 2026-07-17. 통합 OS 작업이 기존 기능을 깨뜨릴 수 있는 지점과 완화책.

## 위험 등급: 🔴 높음 / 🟠 중간 / 🟢 낮음

| # | 위험 | 등급 | 영향 | 완화책 |
|---|---|---|---|---|
| R1 | 단일 742KB HTML 편집 중 문법오류 | 🔴 | 앱 전체 백지화 | 매 편집 후 `node scripts/check.js` 필수. 커밋 단위 최소화. 백업태그 유지. |
| R2 | 카톡 인앱 호환 파괴(`?.`/`??`/최신문법) | 🔴 | 인앱에서 핵심기능 정지 | ES5~ES6 한정, `var/function` 위주. check.js에 인앱 호환 린트 추가 검토. |
| R3 | TABS 15메뉴 재편 시 기존 30+ 도구 진입점 소실 | 🔴 | 기능 "사라짐"으로 보임 | FEATURE_MAP 전수 매핑 후에만 재편. 기존 id 유지·하위 이동만. 삭제 금지. |
| R4 | 재무설계 `#finB64` 블록 훼손 | 🔴 | 재무설계 계산기 파괴 | 블록 절대 미수정. check.js "재무설계 iframe 마운트"로 감지. |
| R5 | 라이브 DB(재사용 CRM) 파괴적 마이그레이션 | 🔴 | CRM+OS 동시 장애 | 0004는 가산(create if not exists)만. CRM 테이블(profiles/teams/dbs/calls) 재정의 금지. |
| R6 | RLS 누락으로 타 설계사 고객 노출 | 🔴 | 개인정보 유출·준법 위반 | 신규 테이블 전수 RLS. can_see_client 재사용. 권한 테스트(ACCEPTANCE H) 필수. |
| R7 | 역할 확장(edu/branch) 시 기존 admin/leader/member RLS와 충돌 | 🟠 | 권한 오작동 | role 값 추가는 CHECK 확장으로. 기존 함수 의미 보존, 신규 함수는 os_* 접두. |
| R8 | Storage 버킷 미실행 상태로 문서기능 배포 | 🟠 | 업로드 실패 | 버킷 SQL은 사용자 1회 실행(외부권한). 미실행 시 UI에 안내·비활성. |
| R9 | AI가 미확인 수치/지급/인수를 사실처럼 출력 | 🔴 | 준법·민원 | 추출/판단 분리, 출처 필수, 금지표현 필터, 면책문구. INSURANCE_REASONING_RULES 준수. |
| R10 | 고객·계약 중복 생성(여러 화면에서 insert) | 🟠 | 데이터 정합성 | customer_id/policy_id 단일화. 업서트·체크섬. UI는 기존 고객 검색 우선. |
| R11 | 100점 점수 임의입력만으로 산정 | 🟠 | 신뢰성·공정성 | score_evidence로 근거 연결. 자동집계+관리자 조정 혼합. ADVISOR_100_SCORE_RULES. |
| R12 | 지급사례 원본 이미지 public 배포 | 🔴 | 개인정보·준법 | claims_evidence는 private only. public_usable 게이트(검증·동의·승인). raw는 git 제외 유지. |
| R13 | 프록시 공개 URL 남용 | 🟠 | 비용 폭증 | ALLOWED_ORIGIN 화이트리스트 + SHARED_TOKEN 권장. ai_runs 비용 로그. |
| R14 | 컨텍스트 대비 과대 범위 → 미완성을 완성으로 표기 | 🟠 | 신뢰 훼손 | IMPLEMENTATION_STATUS를 실제 코드/테스트 기준으로만 갱신. Phase 단위 커밋. |

## 롤백 전략

- 백업태그 `backup-before-integration-os-2026-07-17`로 코드 복귀 가능.
- 각 Phase working commit. 파괴적 DB 변경 없음(가산). Storage/키/배포는 외부권한 단계로 분리.

## 착수 전 게이트(반드시 통과)

1. baseline `check.js` 14/14 그린 ✅(2026-07-17)
2. 백업태그 존재 ✅
3. FEATURE_MAP에 기존→신규 메뉴 매핑 완료 후에만 TABS 재편.
4. 0004 마이그레이션은 로컬 검토 → SQL Editor 실행(사용자)로 분리.
