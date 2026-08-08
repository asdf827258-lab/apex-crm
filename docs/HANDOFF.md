# 이어받기 — 다른 세션에서 계속할 때

이 문서만 읽으면 어디까지 됐고 다음에 무엇을 하면 되는지 알 수 있습니다.
작업은 항상 `git fetch origin main` → 최신 main 에서 브랜치를 따고 시작합니다.

## 이 앱이 굴러가는 규칙

- 화면 하나 = `var TABS` 에 항목 추가 → `go(tab)` 분기 → `renderXxx()` 가 HTML 문자열을 돌려줍니다.
  그린 뒤 할 일은 `osXxxAfterRender()` 에 넣습니다. **기존 경로는 건드리지 않고 더하기만** 합니다.
- 서버는 `osClient()` (이미 연결된 Supabase), 내 정보는 `OS.profile` 을 씁니다.
- AI 는 `callAI(system, user, maxTokens, genId)` 를 그대로 씁니다.
- ES5 로 씁니다 — `var` · `function` · 템플릿 리터럴 없이.
- 보험 관련 문구에는 금융소비자보호법에 따른 안내를 함께 넣습니다.
- 고친 뒤에는 **반드시** 문법 검사와 화면 점검을 돌립니다.

```bash
node scripts/check-html.js app/index.html
python3 scripts/check-sql.py
NODE_PATH=/opt/node22/lib/node_modules node scripts/smoke.js
```

## 새 표를 만들지 않는 저장 방식

새 기능은 이미 있는 표에 얹습니다. **`SETUP_VER` 는 32 그대로** — SQL 을 다시 돌릴 일이 없습니다.

| 기능 | 저장 자리 |
|---|---|
| 실행 체크판 | `daily_checks(member_id, check_date, scope, items)` |
| 도와줄 것 · 합격 | 같은 표, `scope='help'` / `'pass'`, `check_date='2000-01-01'` |
| 고객 365일 | `saved_reports(kind='client_meta')` — 고객 한 명에 한 줄 |
| 재무설계 상담자료 | `saved_reports(kind='fp_deck')` |
| **AI 보고** | `saved_reports(kind='ai_report')` — `content.mid` 가 누구 보고인지 |

`saved_reports` 의 RLS 는 `advisor_id = auth.uid() or is_admin()` 입니다.
그래서 **저장은 언제나 내 이름으로** 남습니다. 리더가 팀원 보고를 만들면 그 줄의 주인은 리더입니다.
`kind='ai_report'` 줄은 성장판 「자료」 축 집계에서 `.neq('kind','ai_report')` 로 빼 두었습니다 —
빼지 않으면 보고를 만들 때마다 점수가 올라갑니다.

## 지금까지 올라간 것

| PR | 무엇 |
|---|---|
| #142 | 두뇌 발표자료 — 물어본 것을 다시 치지 않는다 |
| #143 | 자비스 — 말하면 찾아서 한다 (명령 19개) |
| #144 | 고객 365일 — 밀접하게 관리하기 |
| #145 | PPT 마감 — 보고서로 내놓을 수 있게 |
| #146 | 출발 점검 — 무엇이 남았는지 앱이 직접 본다 |
| #147 | 체크판 좌우 2단 · 역할 지정 · 모델 선택 · 글로 시키기 |
| #148 | 두뇌 키우기 — 모범답안 · 엔진별 지시문 · 회사지식 · 두 번 태우기 |
| 이번 | AI 보고 한 칸 · 화면별 사용법 · 음성 비서 말투 |

## 화면별 담당 코드

| 화면 | 여는 말 | 붙은 검사 |
|---|---|---|
| AI 보고 `airep` | `var AR=` … `renderAiRep()` | `scripts/check-airep.js` |
| 실행 체크판 `ckboard` | `function ckTabs()` … `renderCkBoard()` | `check-ckboard.js` |
| 성장판 `growboard` | `var GB=` … `renderGrowBoard()` | `check-growboard.js` |
| 고객 365일 `clients` | `var CM=` … `renderClientsPage()` | `check-clients.js` |
| 음성 비서 `voiceasst` | `var VA=` … `renderVoiceAsst()` | `check-voice.js` · `check-jarvis.js` |
| 출발 점검 `ready` | `var RD=` … `renderReady()` | `check-ready.js` |
| 화면별 사용법 | `var OS_HELP=` … `osHelpOpen(키)` | `check-airep.js` 안에서 함께 |

## 남은 일

### 사장님이 직접 하셔야 하는 것 (앱에서 홈 → 🚦 출발 점검)

1. 채팅에 한 번 붙었던 Netlify 배포 열쇠 폐기 — **가장 급합니다**
2. 약관·개인정보 문서 변호사·준법감시 확인
3. 통신판매업 신고
4. 서버 준비 SQL 1회 실행 · 사업자 정보 11칸 · 지점장 지정 · 팀 소속
5. Netlify 환경변수(AI 열쇠) · Supabase 자동 백업 · 토스 계약과 `TOSS_SECRET_KEY`
6. 팀 안내와 고객 동의 받는 법 교육

> 열쇠(`service_role`, 토큰, API 키)는 **채팅창에 붙이지 않습니다.**
> Netlify · Supabase 설정 화면에 사장님이 직접 넣으셔야 합니다.

### 코드로 남은 일

- 서버(RLS)에서도 지점장이 자기 팀만 보도록 범위 제한 — 지금은 화면에서만 걸러집니다
- PPT 글꼴 임베딩 · 그래프를 편집 가능한 OOXML 차트로
- 오래된 PR #6 · #57 · #60 은 지워진 파일을 건드립니다 — 닫으면 됩니다

## 사용설명서

`docs/ebook/README.md` 를 보세요. 27쪽짜리 PDF 를 세 줄로 다시 만듭니다.
