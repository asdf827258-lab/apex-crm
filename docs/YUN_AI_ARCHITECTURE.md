# YUN AI ARCHITECTURE — 윤시현 AI CORE 통합 설계

작성일: 2026-07-19 · promptVersion: `yun-core-1.0.0` · 대상: `app/index.html`

## 1. 설계 원칙

- **단일 정체성, 다중 도구**: 모든 AI 호출은 하나의 윤시현 정체성/판단/화법/준법을 공유한다.
- **최소 침습**: 기존 `sys()` 관문을 재활용해 30+ 도구를 한 번에 통일. 구조 재작성 없음.
- **레이어 분리**: 상위(정체성·준법) = 고정, 중간(브랜드 톤) = 페르소나, 하위(작업지시) = 도구별.
- **버전 관리**: 모든 답변에 `promptVersion` 각인 → 사후 추적·재검토 가능.

## 2. 컴포넌트 맵

```
YUN_CORE (전역 객체)
├── promptVersion            "yun-core-1.0.0"
├── identity                 이름/역할/슬로건/프레임/스탠스
├── philosophies[15]         핵심 철학 15
├── keySentences[10]         대표 화법 문장 10
├── decisionClasses[5]       유지/보완/조정검토/삭제·감액후보/확인필요
├── badges[4]                FACT/INTERPRETATION/RECOMMENDATION/VERIFY (+색)
├── forbidden[]              절대 금지표현
├── analysisOrder[10]        보장분석 고정 순서
├── answerStructure[10]      고정 답변 구조 ①~⑩
├── customerTypes{5}         고객 유형별 화법 조정
└── claimGuidance{}          보험금 청구 안내 정책(지급 확정 금지)

helpers
├── yunSpine()               압축 공통 스파인(정체성+판단4원칙+준법+금지어) — 모든 sys() 앞
├── yunDeep(kind)            도메인 심화: 'analysis' | 'report' | 'consult' | 'claim'
└── sys(extra, deepKind?)    yunSpine + [브랜드 톤]페르소나 + [이번 작업]extra + yunDeep
```

## 3. 데이터 흐름

```
사용자 입력
  → GEN.build(v) / osReasoningPrompt / osReportPrompt
      → sys(작업지시, deepKind?)
          = yunSpine()                 ← 정체성·판단·준법 (전 도구 공통)
          + "[브랜드 톤]" + getPersona() ← 톤 레이어(설정에서 커스터마이즈 가능)
          + "[이번 작업]" + extra        ← 도구별 지시
          + yunDeep(deepKind)           ← 분석/보고서/상담 심화(선택)
      → callAI(system,user,max,genId)  ← provider 라우팅(Claude/Gemini)
  → 결과 렌더 (분석은 배지·CORE버전 각인)
```

## 4. 계약 (Contracts)

### 4.1 outputSchema — 보장분석 (핵심 필드)
`analysisVersion, oneLineConclusion, strengths[], gaps[], duplicates[], structuralRisks[], accounts{8통장}, policyDecisions[{policyId, decision, badge, reasons[], requiredChecks[]}], scenarios[A/B/C], advisorQuestions[], uncertainties[], complianceNotes[]`

- `decision` ∈ 5분류(+레거시 CONVERT/SURRENDER 호환)
- `badge` ∈ FACT|INTERPRETATION|RECOMMENDATION|VERIFY

### 4.2 modelAdapter
`callClaude`(proxy/direct) · `callGemini`(gemini-flash-latest). `providerForGen(id)`가 `CLAUDE_ONLY_GEN`이면 Claude 강제, 아니면 사용자 설정.

### 4.3 contextBuilder
`osBuildAnalysisPayload(pols,covs,ctx)` — 검수된 담보 + 고객상황(나이/소득/고정지출/여력)만 payload화. 추측 금지.

## 5. 확장 가이드

- **새 AI 도구**: `GEN`에 객체 1개 push, `build().system=sys('작업지시')` — 자동으로 CORE 상속.
- **도메인 심화 필요 시**: `sys('작업지시','analysis'|'report'|'consult'|'claim')`.
- **정책 개정**: `YUN_CORE`의 상수만 수정하고 `promptVersion`을 올린다. 전 도구 즉시 반영.

## 6. CRM 통합 관점

기존 CRM(Netlify `apex-crm-a500b6`, Supabase `miakdhxtqofpndtlyzxa`)과 본 OS는 **동일 Supabase 프로젝트/RLS 모델**을 공유하므로, `profiles.role`·`teams`·client/policy 스키마를 공유해 하나의 운영으로 합칠 수 있다. OS의 `clients/policies/coverages/analysis_cases`가 CRM `dbs/calls` 파이프라인과 client_id 기준으로 연결 가능. → 별도 통합 작업은 스키마 매핑(1:1 view) 한 겹이면 충분.
