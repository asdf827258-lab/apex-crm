# CURRENT_SYSTEM_ANALYSIS — 현재 시스템 전체 분석

최종 갱신: 2026-07-17 · 분석자: Claude Code · 기준 커밋: `de69d9d` + 백업태그 `backup-before-integration-os-2026-07-17`

> 이 문서는 통합 OS 작업 시작 전 **있는 그대로의 현재 상태**를 기록한다. 이후 문서(FEATURE_MAP·MASTER_INTEGRATION_PLAN)의 기준점이다.

---

## 1. 한눈에

- 정체: 보험설계사(에이플러스에셋 온탑본부 **윤시현**)용 올인원 워크스페이스 → 서버형 보장분석·상담 OS로 확장 중.
- 배포형태: **단일 HTML**(`app/index.html`, 약 742KB) + 서버리스 Claude 프록시(`api/generate.js`) + Supabase(재사용 CRM 프로젝트).
- 개발 이력: Phase 0~2b 완료(git 11커밋). 기반정리·스키마·라이브DB·로그인·고객 CRUD·문서업로드(코드) 완료. Storage 버킷 SQL 실행만 대기.
- baseline 회귀: `node scripts/check.js` = **14/14 PASS**(2026-07-17 재확인). 재무설계 iframe·계산기·생성기 30종·PDF 4메뉴 정상.

## 2. 파일·폴더 구조 (실측)

```
├── app/index.html            단일 SPA. TABS/GEN/CALC 레지스트리 + 라우터 + 로그인셸 + 고객CRUD
├── api/generate.js           Claude 프록시(서버리스, Vercel/Netlify). ANTHROPIC_API_KEY 환경변수
├── scripts/
│   ├── check.js              jsdom 스모크 회귀검증(14항목)
│   └── apply_migrations.mjs   pg로 라이브 DB에 마이그레이션 적용(재사용 모드)
├── supabase/migrations/
│   ├── 0001_schema.sql       OS 26테이블(가산). 라이브 적용됨
│   ├── 0002_rls.sql          OS 테이블 RLS(설계사 본인/팀장 조회/관리자 전체). 라이브 적용됨
│   ├── 0003_seed_reference_data.sql  제도값·아카데미 시드
│   ├── RUN_ALL_IN_SQL_EDITOR.sql     SQL Editor 붙여넣기 통합본
│   ├── RUN_STORAGE_BUCKET_IN_SQL_EDITOR.sql / STEP1_BUCKET_ONLY.sql  버킷(⛔ 실행대기)
├── docs/                     SPEC·YUN_COVERAGE_INTELLIGENCE·COVERAGE_DATA_SCHEMA·ACCEPTANCE_TESTS 등
├── references/claims_evidence_raw/PRIVATE_DO_NOT_DEPLOY.md   지급증거 원본(git 제외)
├── CLAUDE.md · PROMPT_FOR_CLAUDE_CODE.md · README_START_HERE.md
└── node_modules/ (jsdom, pg)
```

## 3. 앱 아키텍처 (`app/index.html` 내부)

핵심은 **3개 레지스트리 + 라우터**. (CLAUDE.md와 일치)

- `TABS` (index.html:782) — 사이드바 네비. group/items 구조. 현재 11개 그룹.
- `TAB_META` (index.html:834) — 페이지 헤더 메타.
- `GEN` (index.html:598~) — Claude 호출형 AI 생성기 배열. `build(v)`→`{system,user,max}`. 공용엔진 `renderTool`/`runGen`.
- `CALC` 패턴 — 무키 클라이언트 계산기(`calcCardX`+`calcX`+`renderCalcPage`).
- 라우터 `go(tab)` — finance는 전용화면(iframe srcdoc), calc/dashboard/settings 개별 렌더, 그 외 `renderToolPage`.
- 재무설계 모듈 — `#finB64`(base64 HTML) → `getFinanceHtml()` 디코드 → iframe. **수정금지 블록.**
- API 클라이언트 `callClaude(system,user,max)` — direct(x-api-key, localStorage) | proxy(api/generate.js). `getConn/getKey/getProxy/aiReady/getModel(기본 claude-sonnet-4-6)`.
- **신규(Phase1~2b)**: Supabase Auth 로그인 셸(pill+모달, onAuthStateChange, profiles 로드, 역할 라벨), 고객 보장분석 CRUD(`clients` 탭), 실명 마스킹(김철수→김*수), 문서 드롭존(SHA-256 체크섬·중복감지·진행률·`documents` 행).

## 4. 데이터 저장 방식 (현재)

- **무키 도구**(계산기·재무설계): 브라우저 로컬 계산, `localStorage`(콘텐츠 캘린더·히스토리·API키·연결설정).
- **AI 도구**: Claude 호출, 결과는 화면 렌더 + 인쇄/HTML 저장. **DB 미저장.**
- **PDF 도구**: 메모리 `PDFSTORE`, pdf.js 텍스트추출(페이지·문자 제한, `.slice(0,18000)`) → 단일 Claude 호출(추출+판단 혼합). 페이지출처·표구조·검수·DB 없음.
- **서버형(신규)**: Supabase Postgres(재사용 프로젝트 `miakdhxtqofpndtlyzxa`) + Auth + (예정)private Storage `coverage-docs`. 26개 OS 테이블 + RLS 라이브.

## 5. 인증·권한 (현재)

- Supabase Auth 이메일 로그인. `public.profiles.role` = `admin|leader|member`(CRM 재사용, text CHECK).
- RLS: 설계사(member)=본인 고객, 팀장(leader)=팀 조회, 관리자(admin)=전체. SECURITY DEFINER 함수 `is_admin/is_leader/my_team/is_my_teammate/can_see_client`로 재귀 방지.
- 신규 프롬프트 요구 5역할(advisor/team_leader/education_manager/branch_manager/admin) 중 **education_manager·branch_manager 미도입** → 확장 필요(§ROLE_PERMISSION).

## 6. 보안 현황

| 항목 | 상태 |
|---|---|
| API 키 하드코딩 | 없음(localStorage/서버환경변수). ✅ |
| service_role 노출 | 없음(anon만 프런트). ✅ |
| PDF 원문·건강정보 로그 | audit_logs meta에 민감정보 금지 규정 有. 코드 준수 점검 필요. 🟡 |
| Storage private | 버킷 미생성(SQL 대기). ⛔ |
| 실명/증권번호 마스킹 | clients.name_masked만 저장(전체 실명 금지). 코드 마스킹 적용. ✅ |
| RLS | OS 26테이블 전수 적용. ✅ |

## 7. 배포 방식

- 앱: 단일 HTML → Netlify/Vercel 정적 배포 가능. (CRM은 `apex-crm-a500b6.netlify.app` 별도 운영 중)
- 프록시: `api/generate.js` → Vercel/Netlify Functions, `ANTHROPIC_API_KEY` 환경변수.
- DB: Supabase 재사용 프로젝트. 마이그레이션은 SQL Editor 또는 `apply_migrations.mjs`.

## 8. 재사용 가능한 자산

디자인토큰(Toss/Pretendard/#1A56DB)·컴포넌트클래스, `callClaude`/`sys()`, `GEN`/`CALC`/`renderTool` 엔진, 리포트 렌더·인쇄·HTML저장, 재무설계 iframe, 로그인셸, 고객CRUD, 문서업로드, 26테이블 스키마+RLS, `scripts/check.js` 하네스.

## 9. 위험·중복·미사용 (요약, 상세는 INTEGRATION_RISK_REPORT)

- 단일 742KB HTML — 편집 시 문법오류/카톡 인앱 호환(ES5~ES6, `?.`/`??` 금지) 주의.
- PDF 도구가 추출·판단 혼합(구조적 한계, v4가 해결 대상).
- 신규 15메뉴 재편 시 기존 30+ 생성기 진입점 소실 위험 → FEATURE_MAP로 전수 매핑.
- education_manager/branch_manager 역할 부재로 신규 홈 분기 불완전.
