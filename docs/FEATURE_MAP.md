# FEATURE_MAP — 기존 기능 → 통합 15메뉴 매핑

최종 갱신: 2026-07-17.

> **규칙: 기존 도구 id는 유지한다.** 15메뉴는 상위 그룹(라우팅 네임스페이스)일 뿐, 하위에 기존 GEN/CALC/EXT 도구를 그대로 연결한다. 도구가 이동한 위치를 이 표로 추적한다.

## 통합 15메뉴 (신규 상위 구조)

| # | 메뉴 id | 제목 | 주 사용자 |
|---|---|---|---|
| 1 | home | 홈 | 전원(역할별 분기) |
| 2 | assistant | 오늘의 AI 비서 | 전원 |
| 3 | growth | 내 성장(100점) | advisor/leader |
| 4 | clients | 고객 | 전원 |
| 5 | interpret | 보험 해석 | advisor+ |
| 6 | contracts | 계약관리 | advisor+ |
| 7 | coverage | 보장분석 | advisor+ |
| 8 | finance | 재무설계 | advisor+ |
| 9 | coach | 상담 AI 코치 | advisor+ |
| 10 | claims | 청구·사후관리 | advisor+ |
| 11 | academy | 교육센터 | 전원 |
| 12 | branch_coach | 지점장 코칭 | branch_manager/leader |
| 13 | hq | 본부장 관리 | admin |
| 14 | manual | 업무매뉴얼 | 전원 |
| 15 | settings | 시스템 설정 | 전원(관리 항목은 권한별) |

## 기존 → 신규 이동표 (기존 기능 보존 매핑)

| 기존 id | 기존 위치 | → 신규 메뉴 | 비고 |
|---|---|---|---|
| dashboard | 시작 | **1 home** | 역할별 홈으로 확장. 기존 대시보드 렌더는 home 내 카드로 유지 |
| clients | 상담 OS | **4 고객** | 고객 360 탭 확장(개요/가족재무/건강/계약/해석/보장/재무/상담/청구/다음행동/검수) |
| finance | 재무설계 | **8 재무설계** | iframe 그대로. 8통장 대시보드·계산기 추가 |
| bojang/baba/compare/katalk | 제안서·보장분석 | **7 보장분석** | 4단계 파이프라인으로 확장. 기존 GEN 진입점 유지 |
| blog/threads/insta/video/simui/calendar | 콘텐츠 제작 | **14 업무매뉴얼 하위 "콘텐츠 스튜디오"** 또는 settings 인접 | 마케팅 도구 묶음 유지. simui는 준법 필터로 coach에도 링크 |
| ref_jeonsan/ref_hira/ref_hidden | 보험 레퍼런스 | **6 계약관리 / 5 보험해석 레퍼런스 패널** | 외부링크 유지(새 탭) |
| ref_underwrite/med_disclosure/med_checkup/med_silbi | 보험 레퍼런스·건강의료 | **5 보험해석 / 10 청구** 관련 패널 | 인수·알릴의무는 해석·청구 흐름에 연결 |
| ref_kcd/ref_surgery | 보험 레퍼런스 | **6 계약관리 / 보험지식사전 데이터** | 질병코드·수술명 검색 유지 |
| mkt_* (5종) | 마케팅 | **콘텐츠 스튜디오(마케팅)** | 유지 |
| cs_assist/cs_feedback/cs_needs/cs_gso | 고객 상담 도구 | **9 상담 AI 코치** | 상담 전/중/후 코치로 재배치. 기존 GEN 유지 |
| calc(4종) | 실무 계산기 | **8 재무설계 / 6 계약관리 계산 패널** | 보험나이·BMI·일할·일정 유지 |
| ext_reply/ext_thread/ext_naver | 외부 프로그램 | **콘텐츠 스튜디오(외부 연동)** | 유지(EXT) |
| settings | 관리 | **15 시스템 설정** | 연결(direct/proxy)·키·역할관리 추가 |

## 구현 방식 (비파괴)

- `TABS`를 15개 상위 group로 재편하되, **각 group.items에 기존 도구 id를 그대로 배치**. `renderToolPage(tab)`·`GEN`·`CALC`는 변경 없음.
- 신규 메뉴(assistant/growth/interpret/contracts/coach/claims/branch_coach/hq/manual)는 새 렌더 함수 추가 + `go()`에 분기 1줄.
- 역할별 가시성: `TABS` 필터를 `role`로 감싼다(신규 `visibleTabs(role)`). 기존 도구는 advisor 기본 노출로 회귀 방지.
- **이동 시 기존 진입 경로가 사라지지 않도록** home·검색에서 전체 도구 접근 유지.

> 각 도구를 실제로 옮길 때마다 이 표의 "비고"에 커밋 해시를 남긴다.
