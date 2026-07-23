# IMPLEMENTATION STATUS — APEX YUN PRO 보장분석·상담 OS

> 이 문서는 살아있는 구현 현황판이다. 각 Phase를 시작·완료할 때마다 갱신한다.
> 원칙: **완성되지 않은 기능을 완성으로 표시하지 않는다.** 상태는 실제 코드/테스트 기준으로만 바꾼다.

최종 갱신: 2026-07-17 · 담당: Claude Code · 검토: 윤시현(관리자)

---

## 0. 상태 요약 (한눈에)

| 영역 | 상태 | 근거 |
|---|---|---|
| 저장소 분석 | ✅ 완료 | 아래 §1 데이터 흐름 |
| Node.js 설치 | ✅ 완료 | winget으로 Node v24.18.0 설치, `npm run check` 14/14 PASS |
| 기준 회귀 테스트 | ✅ 완료 | `npm run check` = node --check + jsdom 스모크 14/14 |
| IMPLEMENTATION_STATUS 문서 | ✅ 완료 | 이 문서 |
| DB 마이그레이션 | ✅ **라이브 적용 완료** | `0001~0003` → CRM 프로젝트 `miakdhxtqofpndtlyzxa`에 SQL Editor로 적용(재사용 모드). 2026-07-17 성공 확인 |
| Phase 1 서버 기반(Auth/RLS) | ✅ 완료 | 로그인 셸(pill+모달)·onAuthStateChange·profiles 로드·역할 라벨. 실세션 로그인/재로그인 검증 |
| Phase 2 고객 CRUD | ✅ 완료 | 목록/검색/등록/상세, 실명 마스킹(김철수→김*수), 로그아웃 게이트. 실세션 insert/select/delete 검증 |
| RLS insert 42501 | ✅ 해결 | clients_read 자기참조 → INSERT...RETURNING 실패. 앱은 .select() 제거로 즉시 우회, 정책도 인라인화 |
| Phase 2b 문서 업로드 | ✅ 완료 | 드롭존·SHA-256 체크섬·중복감지·진행률·documents 행·고아정리. 실세션 업로드→스토리지→행→서명URL→UI 렌더 전 구간 검증 |
| Storage 버킷 `coverage-docs` | ✅ **라이브 생성 완료** | 2026-07-17 SQL Editor 실행 성공(버킷 private + 경로 RLS + clients_read 최적화). 실제 업로드 동작 확인 |
| Phase 3 추출+검수 | ✅ 코드 완료 | 문서별 "담보 추출" → pdf.js 페이지추출(document_pages) → Claude 사실추출 JSON(§2, 낮은창의성·출처필수·null허용) → extraction_runs 기록 → policies/coverages 물질화 → 검수 모달(원문명 보존·표준명/금액/분류 교정·검토/수정/승인). npm check 14/14, 프리뷰 렌더·순수함수 검증 |
| Phase 4 분석엔진 | ✅ 코드 완료 | 검수된 담보+고객상황 → Claude 윤시현식 판단 JSON(§3): 강점먼저·갭·중복·구조위험, 8통장 충족도(account_assessments), 계약별 판단(KEEP…SURRENDER), A/B/C 시나리오(comparison_scenarios), 준법 면책. 결과 패널(결론배너·통장카드·판단·시나리오) 렌더 검증. npm check 14/14 |
| Phase 4b 결과물 | ✅ 코드 완료 | 분석결과 → 4종 산출물(설계사 정밀리포트·고객 A4요약·카톡 설명·상담 스크립트) callClaude 생성 → renderMd HTML(카톡은 순수텍스트) → report_versions 버전저장 → 모달(복사·인쇄). npm check 14/14 |
| Phase 5 학습루프 | ✅ 코드 완료 | 분석결과에 교정·피드백 입력 → advisor_feedback 저장. 본부(관리자) 화면에서 피드백→AI 규칙후보(rule_candidates, pending_review)→승인 시 knowledge_rules(active) 축적·활성토글. 다음 분석 osReasoningPrompt에 활성 규칙 주입(우선순위순). 프리뷰: 함수 로드·규칙주입·승인큐 3섹션 렌더 검증. npm check 14/14 |
| Phase 6 배포 | ⛔ 미착수 | Netlify/Vercel 배포·ANTHROPIC_API_KEY·ACCEPTANCE 전수 예정 |
| v5 계산기 3종 | ✅ 코드 완료 | 실무 계산기에 연금 소득공백·간병요양 자금·상속세 개산 추가(가정치 입력·개산 면책). npm check 14/14 |
| v5 가이드 상담 위저드 | ✅ 코드 완료 | 보험 해석 탭 = 윤시현식 의사결정 트리. 5목표 분기(청구/절감/은퇴/간병/모름) 질문+왜, 건너뜀 사유 필수, AI 요약(핵심문제≤3·다음액션·고위험 승인플래그), consultations 저장(고객 진입 시). 프리뷰 전 플로우 검증 |
| v5 90일 아카데미 | ✅ 코드 완료 | 교육 탭 = 3개월 12주 커리큘럼(개념·실습·월 게이트) + 오늘의 루틴 7종(일일 체크·자정 초기화) + 개념 퀴즈 12문(정답 아닌 "왜"를 가르침, 오답도 근거 노출) + 최종 인증 기준. 진행률 localStorage 저장(0004 불필요, 클라이언트 우선). npm check 14/14, 프리뷰: 3개월·12주카드·주차상세·퀴즈 왜노출·루틴토글·인증 전 뷰 검증 |
| v5 청구·지급사례 검증엔진 | ✅ 코드 완료 | 청구 탭 = 지급사례 라이브러리(19건 익명 메타·검증등급 A/B/C/D/X 자동판정·외부사용 가능여부·담보별 지급구성) + AI 상담 스토리 9단계(동일결과 비보장 문구·준법 시스템프롬프트) + 올바른/잘못된 사용 가이드 + 청구 접수 도우미(서류 체크리스트·담보 후보, 지급액 미확정). raw 이미지 미내장. npm check 14/14, 프리뷰: 19카드·등급분포(B6·C7·D3·X3)·X필터 외부금지·가이드·접수 검증 |
| v5 8통장 진단지도 | ✅ 코드 완료 | 신규 탭 = 상담의 전체 지도(8통장: 생활·병원비·치료비·소득공백·가족보호·은퇴연금·간병장기요양·자산이전). 통장별 핵심항목·질문·주의점 + 충족도 3단계(미흡/보통/충분) 셀프진단 + 약한 통장 우선표시 + AI 종합진단(우선순위·연결·단정금지). 진단 localStorage 저장(참고용·지급/수익 미보장). npm check 14/14, 프리뷰: 8카드·충족도 집계·약통장 표시·상세토글·초기화 검증 |
| v5 감사로그 | ✅ 코드 완료 | `osAudit(action,entity,entityId,meta)` 유틸 → 라이브 `audit_logs`(0001, insert=인증사용자·read=관리자) best-effort 삽입 + 이 기기 로컬 링(최근 200). 계측: 로그인/로그아웃·고객등록·문서업로드·분석실행·리포트생성·규칙승인. 민감정보 미기록(식별자·요약만). 관리자 전용 뷰어 탭(본부장 관리): DB/이 기기 소스전환·작업별 필터·시간/작업/대상/요약 테이블. npm check 14/14, 프리뷰: 소스2·필터8·행렌더·approve필터 검증 |

전체 진척: **v4 코어(추출→검수→분석→결과물→학습루프) + v5 대형기능 전부 코드 완료 — 가이드 상담 위저드·90일 아카데미·청구/지급사례 검증엔진·8통장 진단지도·감사로그·계산기 3종. 남은 것은 오직 Phase 6 실배포(Netlify/Vercel·ANTHROPIC_API_KEY·ACCEPTANCE 전수) — 사용자 계정/키가 필요한 외부 벽.**

---

## 1. 현재 PDF 도구 데이터 흐름 (AS-IS)

단일 파일 `app/index.html` 안에서 다음으로 동작한다.

```
[사용자] PDF 드래그 → PDFSTORE[toolId:slotId] (메모리 File[])
   │
   ▼  runPdf(id)                     (index.html:1352)
extractPdfText(File)                 브라우저 pdf.js, 페이지별 text만
   │  · 최대 페이지/문자 제한, .slice(0,18000)     ← 손실 지점
   │  · 표 구조·좌표·이미지·페이지 출처 없음         ← 손실 지점
   ▼
p.build(parts, opts) → { system, user, max }   PDF원문 텍스트를 프롬프트에 그대로 삽입
   │  · 추출 + 판단(리모델링 의견)이 한 번의 호출에 혼합  ← 구조적 한계
   ▼
callClaude(system,user,max)          direct(x-api-key) | proxy(api/generate.js)
   │  · 단일 호출, 재시도/idempotency/토큰로그 없음
   ▼
renderReport(md) → reportResultBox   Toss 스타일 HTML, 인쇄/HTML저장
   · DB 저장 없음, 사람 검수 없음, 규칙 축적 없음, 권한/멀티유저 없음
```

4개 PDF 도구: `bojang`(1:1 보장분석) · `baba`(비포&애프터) · `compare`(제안서 비교) · `katalk`(카톡 설명). 모두 위 흐름을 공유한다.

**핵심 한계(= v4/v5가 해결해야 할 것):**
1. 추출과 판단이 한 호출에 섞임 → 숫자 근거·출처 소실, 검증 불가.
2. 페이지 출처·표 구조·이미지 없음 → 스캔 PDF/OCR 취약.
3. 구조화 DB 없음 → 검수·비교·버전·학습 불가.
4. 멀티유저/권한/감사로그 없음 → 팀 공용 서비스 불가.

## 2. 목표 파이프라인 (TO-BE, 4단계)

```
Ingestion → Extraction(JSON) → Human Review → Reasoning(JSON) → Report
  Storage      COVERAGE_DATA_SCHEMA §2      검수·승인      §3 분석JSON     고객용/설계사용
  checksum     낮은 창의성·출처필수                        규칙버전·근거    카톡·스크립트
  페이지처리    합계검증·confidence                        사실/해석/제안
```

각 단계는 DB에 저장되고(문서 §COVERAGE_DATA_SCHEMA), 관리자 수정 → 규칙 후보 → 승인 → 다음 분석 반영의 학습 루프로 연결된다.

## 3. 보존해야 하는 기존 자산 (절대 삭제 금지)

Toss 디자인 토큰·Pretendard / 재무설계 base64 iframe(`finB64`) / 18개+ AI 생성기(`GEN`) / 계산기 4종(`CALC`) / PDF 4메뉴 / 리포트 렌더·인쇄·HTML저장 / direct·proxy 연결 / 카톡 인앱 ES5~ES6 호환 / `npm run check`.

---

## 4. Phase 로드맵 (Acceptance Tests 매핑)

| Phase | 산출물 | Acceptance | 상태 |
|---|---|---|---|
| **0 기반정리** | 저장소분석·데이터흐름도·baseline·본 문서·마이그레이션 초안 | A1 | ✅ 문서/스키마 완료, baseline 🟡(§5) |
| **1 서버기반** | Supabase Auth/RLS/Storage, profiles·clients, 환경변수, 앱 로그인 셸 | B1~B6 | ⛔ (Supabase 키 필요) |
| **2 고객/문서** | 고객 프로젝트 CRUD, 업로드(checksum·진행률), 페이지 처리, 추출 JSON, 검수 UI | C1~C7, H | ✅ 코드 완료(추출·검수 포함) |
| **3 분석엔진** | 담보 정규화 사전, 8통장 모델, 현재보장·전후비교·A/B/C, 출처표시 | D1~D10, E | ✅ 코드 완료(판단·8통장·A/B/C) |
| **4 결과물** | 설계사 리포트·고객 A4·카톡·상담스크립트·PDF/HTML·버전관리 | G1~G8 | ✅ 코드 완료(4종 산출물·report_versions·인쇄) |
| **5 학습루프** | 피드백 저장→규칙후보→승인→RAG→적용근거 | F1~F7 | ✅ 코드 완료(피드백→AI규칙후보→승인→분석주입) |
| **6 배포/검증** | Netlify/Vercel 배포, 테스트계정, ACCEPTANCE 전수, 운영매뉴얼 | 전체 | ⛔ |
| **v5 확장** | 8통장 대시보드, Guided Wizard, 연금·요양 계산기, 지급사례 검증등급, 90일 아카데미, 제도값 버전관리 | v5 A~D | ⛔ |

---

## 5. 블로커 (외부 계정·환경이 필요한 지점)

### B-1. Node.js 정식 설치 (검증 하네스) — ✅ 해결
- winget으로 Node v24.18.0 설치 완료. `npm install`·`npm run check`(jsdom 스모크) 정상. 회귀 기준선 14/14 복구.

### B-2. Supabase 프로젝트 + 키 (서버 데이터 계층) — ✅ 해결(재사용)
- 결정: 기존 CRM 프로젝트 `miakdhxtqofpndtlyzxa` **재사용**(가산 마이그레이션). 2026-07-17 라이브 적용 성공.
- anon key/URL: CRM `config.js`에서 재사용(프런트 공개용). service_role 키는 프런트에 넣지 않음.

### B-3. 배포 대상 (Netlify 또는 Vercel) — ⏳ 대기
- 서버 프록시(`api/generate.js`)와 앱 배포, 환경변수(ANTHROPIC_API_KEY) 등록.
- 로그인/OTP/토큰 등 계정 권한이 필요한 순간에만 요청 예정.

---

## 6. 다음 액션 (착수 순서)

1. **B-1 해결** → `npm install && npm run check` 그린 확인(회귀 기준선 복구).
2. **B-2 해결** → `supabase/migrations` 적용, Auth/Storage 버킷 생성, `app/config.js`에 anon 키.
3. Phase 1 앱 셸: 로그인 게이트 + 기존 워크스페이스 유지(비로그인은 기존 무키 계산기/생성기, 로그인 시 고객 프로젝트 활성).
4. Phase 2부터 순차 구현, 각 Phase 종료 시 `npm run check` + 본 문서 갱신 + 커밋.
