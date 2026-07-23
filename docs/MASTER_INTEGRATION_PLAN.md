# MASTER_INTEGRATION_PLAN — 통합 개발 마스터 플랜

최종 갱신: 2026-07-17. 기존 Phase 0~2b 위에 신규 프롬프트(15메뉴 통합 OS)를 얹는다.

> 원칙: 비파괴·가산. 매 슬라이스 후 `node scripts/check.js` + 커밋. 외부권한 필요 지점만 사용자 요청.

## 0. 현재 지점

Phase 0~2b 완료(기반·스키마·라이브DB·로그인·고객CRUD·문서업로드코드). baseline 14/14. Storage 버킷 실행 대기.

## 1. 통합 로드맵 (신규)

| 단계 | 산출물 | 외부권한 | 검증 |
|---|---|---|---|
| **S0 분석·문서** | 본 문서 포함 분석·설계 11종, 백업태그, baseline | 없음 | check 14/14 ✅ |
| **S1 데이터모델 0004** | advisor_scores·score_evidence·health_profiles·financial_profiles·policy_change_options·consultations·consultation_transcripts·coaching_records·approvals·aftercare_tasks·manuals·notifications·learning_tasks·branches·insurance_knowledge + RLS | SQL Editor 실행(사용자) | SQL 로컬 파싱, 적용 후 스모크 |
| **S2 역할·권한** | role 5종 확장(edu/branch), visibleTabs(role), 역할별 홈 분기, os_* 권한함수 | 관리자 지정 SQL | 권한 테스트(H) |
| **S3 통합 15메뉴·라우팅** | TABS 재편(FEATURE_MAP), 신규 렌더 스텁, 기존 도구 보존 | 없음 | check + 회귀 |
| **S4 홈·오늘의 AI 비서** | 역할별 홈 카드, 능동형 비서(아침브리핑/상담전후/퇴근전, 데이터근거 표시) | 없음 | 스모크 |
| **S5 100점 성장** | 스코어보드(8영역), 근거 연결, 등급, 재평가 | 없음 | 스모크 |
| **S6 고객 360 + 보험해석·계약관리** | 고객 탭 확장, 보험지식사전, 계약관리 판단모듈(17종), 윤시현식 해석·A/B/C | 없음 | 스모크 |
| **S7 재무설계 8통장 + 상담코치** | 8통장 대시보드, 연금·요양 계산, 상담 전/중/후 코치 | 없음 | 스모크 |
| **S8 청구·사후관리 + 교육센터** | 청구 워크플로우, aftercare, 아카데미·퀴즈·오답노트 | 없음 | 스모크 |
| **S9 지점장 코칭 + 본부장 승인·규칙** | 코칭 대시보드, 승인 큐, 규칙 축적 학습루프 | 없음 | 스모크 |
| **S10 업무매뉴얼 + 알림 + 모바일** | 매뉴얼 CRUD·이력, notifications, 반응형/하단탭 | 없음 | 모바일 스모크 |
| **S11 준법·권한·회귀 테스트** | ACCEPTANCE 전수, RLS·마스킹·금지표현·인앱 | 테스트계정 | 전수 |
| **S12 배포** | Netlify/Vercel, 프록시 환경변수, 버킷, README | 배포·키·OTP(사용자) | 실 URL |

## 2. 슬라이스 원칙

- 한 슬라이스 = 화면에 보이거나 테스트로 증명되는 최소단위. "입력→계산→분석→멘트→검수→리포트→후속"이 저장된 고객 프로젝트로 이어지게.
- 미완성은 IMPLEMENTATION_STATUS에 🟡/⛔로 정직히 표기.
- DB 변경은 0004 이후에도 0005, 0006...로 가산.

## 3. 외부권한 필요 목록 (사용자 처리)

1. **0004 마이그레이션 실행** — Supabase SQL Editor(`miakdhxtqofpndtlyzxa`)에 붙여넣기.
2. **Storage 버킷 `coverage-docs`** — STEP1_BUCKET_ONLY.sql 실행.
3. **역할 지정** — `update profiles set role='branch_manager'...` 등.
4. **배포** — Netlify/Vercel 로그인, ANTHROPIC_API_KEY 등록, 도메인.
각 항목은 발생 시점에 "무엇을·어디서·무엇을 누르고·완료 후 보낼 문장"을 제공.

## 4. 완료 판정

`docs/ACCEPTANCE_TESTS.md`(v4/v5 + v6 통합 확장). 각 시나리오 PASS 근거를 IMPLEMENTATION_STATUS에 링크.
