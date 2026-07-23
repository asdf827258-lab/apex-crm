# EXISTING_FEATURE_INVENTORY — 기존 기능 전수 인벤토리

최종 갱신: 2026-07-17 · 기준: `app/index.html` TABS/GEN/CALC + Phase1~2b 신규.

> **원칙: 아래 기능은 삭제/단순화 금지.** 통합 15메뉴 재편 시 반드시 새 위치로 이동·연결하고 FEATURE_MAP에 기록한다.

## A. 현재 사이드바 메뉴 (TABS, index.html:782)

| group | id | 제목 | 유형 |
|---|---|---|---|
| 시작 | dashboard | 통합 대시보드 | 렌더 |
| 상담 OS | clients | 고객 보장분석 | 서버(CRUD·문서) |
| 재무설계 | finance | 재무설계 계산기 | iframe(base64) |
| 콘텐츠 제작 | blog / threads / insta / video / simui / calendar | 블로그·Threads·인스타·유튜브&릴스·외부글 심의필터·콘텐츠 캘린더 | GEN/CALC |
| 제안서·보장분석 | bojang / baba / compare / katalk | AI 보장분석·비포&애프터·제안서 비교·제안서 카톡설명 | GEN(PDF) |
| 보험 레퍼런스 | ref_jeonsan / ref_underwrite / ref_kcd / ref_surgery / ref_hira / ref_hidden | 보험사 전산·예외질환 인수확인·질병코드특약·수술명검색·건강보험심사평가원·숨은보험금찾기 | EXT/데이터 |
| 마케팅 | mkt_meta / mkt_volume / mkt_combine / mkt_landing / mkt_card | 메타광고 가이드·키워드 검색량·키워드 조합기·리드 랜딩페이지·디지털 명함 | GEN/CALC |
| 고객 상담 도구 | cs_assist / cs_feedback / cs_needs / cs_gso | AI 상담 어시스턴트·AI 상담 피드백·니즈 시뮬레이터·금소법 AI | GEN |
| 건강·의료 분석 | med_silbi / med_checkup / med_disclosure | AI 실비계산기·AI 건강검진·알릴의무 필터 | GEN/데이터 |
| 실무 계산기 | calc | 계산기(4종) | CALC |
| 외부 프로그램 | ext_reply / ext_thread / ext_naver | 소상공인 AI 답글·스레드 반자동발행·네이버 광고 대량등록기 | EXT |
| 관리 | settings | 설정 | 렌더 |

## B. AI 생성기 (GEN 배열, 30종+)

콘텐츠: blog_post, blog_titles, threads, insta_caption, facebook, cardnews, youtube, reels · 상담화법: consult_script, objection, coverage_talk, ta_intro · SEO/마케팅: keywords, copy, lead_msg · 소개/신뢰: self_intro, review, referral · 보장분석(PDF): bojang, baba, compare, katalk · 그 외 각 탭의 도구.
`sys(extra)`가 브랜드 페르소나+준법 규칙 자동 프리픽스. 검증: check.js "AI 생성기 30종+" PASS.

## C. 계산기 (CALC, 4종)

보험나이 · BMI · 일할(보험료 일할계산) · 일정. 무키·클라이언트 계산. check.js 각각 결과 검증 PASS.

## D. 재무설계 모듈

`#finB64` base64 임베드 HTML → iframe srcdoc. 전용화면 전환(`body.finance-mode`), Esc/플로팅 복귀. **수정금지.**

## E. PDF 보장분석 파이프라인 (현재)

`PDFSTORE` → `extractPdfText`(pdf.js) → `p.build` → `callClaude` → `renderReport`(인쇄/HTML저장). 4메뉴 공유. 한계는 CURRENT_SYSTEM_ANALYSIS §4·§9.

## F. 서버형 기능 (Phase 1~2b 신규)

- 로그인 셸: Supabase Auth, onAuthStateChange, profiles 로드, 역할 라벨, 로그아웃 게이트.
- 고객 보장분석 CRUD: 목록/검색/등록/상세, 실명 마스킹, RLS 소유권.
- 문서 업로드: 드롭존, SHA-256 체크섬, 중복감지, 진행률, `documents` 행, 고아정리. (버킷 실행 후 happy-path 검증)

## G. 공용 인프라

디자인토큰·컴포넌트클래스 · `callClaude`/`sys` · direct/proxy 연결 · 리포트 렌더/인쇄/HTML저장 · localStorage(캘린더·히스토리·설정) · `scripts/check.js` 회귀 하네스 · 카톡 인앱 ES5~ES6 호환.

## H. DB 자산 (라이브)

clients, households, documents, document_pages, extraction_runs, policies, coverages, proposals, proposal_plans, proposal_coverages, analysis_cases, comparison_scenarios, account_assessments(8통장), advisor_feedback, rule_candidates, knowledge_rules, report_versions, claims_cases, claims_evidence, reference_data, academy_modules, academy_quiz_questions, academy_progress, academy_evaluations, ai_runs, audit_logs (26). + RLS 전수.

## I. 신규 프롬프트 대비 미구현 (통합 대상)

오늘의 AI 비서(능동형) · 100점 성장 스코어보드 · 보험지식사전(20종×4단계) · 계약관리 판단모듈(17종) · 청구 워크플로우/사후관리 · 지점장 코칭 대시보드 · 본부장 승인 큐 · 업무매뉴얼 · 알림 · 5역할(edu/branch) · 역할별 첫화면 분기.
