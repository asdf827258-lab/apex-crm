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
| #149 | AI 보고 한 칸 · 화면별 사용법 · 음성 비서 말투 |
| #150 | AI 관리판 아홉 칸 · 아침 비서 · 부재거절/기고객 재관리 |
| #151 | TEAM 총괄 관리 한 칸 · 설정 여섯 칸 |
| 이번 | 팀별 나눠 보기 · 뉴스 최신화 · 아침 팀 보고 · 사진 전체 캐러셀 |

## 화면별 담당 코드

| 화면 | 여는 말 | 붙은 검사 |
|---|---|---|
| AI 관리판 `airep` | `var AR=` … `renderAiRep()` | `scripts/check-airep.js` |
| TEAM 총괄 `teamhub` | `var TH=` … `renderTeamHub()` | `scripts/check-teamhub.js` |
| 실행 체크판 `ckboard` | `function ckTabs()` … `renderCkBoard()` | `check-ckboard.js` |
| 성장판 `growboard` | `var GB=` … `renderGrowBoard()` | `check-growboard.js` |
| 고객 365일 `clients` | `var CM=` … `renderClientsPage()` | `check-clients.js` |
| 음성 비서 `voiceasst` | `var VA=` … `renderVoiceAsst()` | `check-voice.js` · `check-jarvis.js` |
| 출발 점검 `ready` | `var RD=` … `renderReady()` | `check-ready.js` |
| 화면별 사용법 | `var OS_HELP=` … `osHelpOpen(키)` | `check-airep.js` 안에서 함께 |

## AI 관리판이 어떻게 생겼나

왼쪽 카테고리 아홉 개 → 오른쪽에 그 칸만. `AR_CAT` 이 목록이고 `arBodyHtml(cat)` 이 분기입니다.

| 칸 | 그리는 함수 | 무엇을 보나 |
|---|---|---|
| 피드백 | `arMeHtml` | AI 보고 다섯 칸 |
| 스케줄 관리 | `arSchedHtml` | 잡힌 약속 · 고객 할 일 날짜순 · 이번 주 체크판 |
| 본인 역량 체크 | `arSkillHtml` | `GB_CUR` 열두 개, 누르면 `gbStamp` |
| 해야 할 일 | `arTodoHtml` | `arTodoList()` — 밀린 것부터 |
| 본인 점수판 | `arScoreHtml` | 여섯 축 + 팀 평균 + `gbGapList` 처방 |
| 부재·거절 재관리 | `arColdHtml` | `arCold(who,일수)` — 1주·2주·한 달 |
| 기고객 재관리 | `arOldHtml` | `arOld(who)` — 90일+ 또는 다음 할 일 없음 |
| 리더 할 일 | `arLeadHtml` | `CK_LDR` — 누구나 열람, `arIsLead()` 면 체크 |
| 팀원 관리 | `arTeamHtml` | 팀원 전원 + 각자 보고 |

- 배정 DB 한 건 한 건은 `AR.db` (`arDbCalc`), 고객 한 사람 한 사람은 `AR.cliRows` (`arCliRows`).
- 통화는 30일이 아니라 **최근 4000건**을 읽습니다. 마지막 통화가 40일 전이어도 알아야 다시 겁니다.
- 아침 비서는 `arBriefMaybe()` — `osOnLogin` 에서 하루 한 번. 끄기는 `apex_ar_brief_off`.
- 주기 알림은 `arNudgeStart()` — 95분마다, 하루 세 번까지.
- 「무슨 말로 다시 걸까」는 `arTalk(kind)` — **건수만** AI 로 넘깁니다. 고객 이름은 넘기지 않습니다.

## TEAM 총괄 관리 · 설정이 어떻게 생겼나

**TEAM 총괄 관리** — 실행 체크판 · 성장판 · 내 코칭 · 본인 점검란을 한 칸에 모았습니다.
`TH_CAT` 이 목록, `thBody(cat)` 이 분기입니다. **화면을 두 벌로 만들지 않았습니다** —
원래 화면이 쓰던 그리기 함수를 그대로 부르고, 원래 쓰던 칸 이름(`#ckPane` `#gbPane`
`#mcPane` `#acadBody`)을 그대로 둡니다. 그래서 `ckPaint()` `gbPaint()` 같은 기존 코드가
그대로 돕니다.

- 체크판을 허브 안에서 열 때는 `CK.hub=true` 로 위 탭 줄을 접습니다 (왼쪽이 그 일을 합니다).
- 옛 메뉴 네 개는 **지우지 않았습니다.** `hide:true` 를 붙여 사이드바에만 안 그립니다.
  `osTabAllowed()` · 요금제 판정 · 음성 명령(`go('ckboard')`)이 이 목록을 보고 돌기 때문입니다.
  `renderNav()` 이 `g.hide` 를 건너뜁니다.
- 성장판 칸은 `osTabAllowed('growboard')` 로 요금제를 다시 확인합니다.

**설정** — `SET_SEC` 여섯 칸(팀·권한 / 사업자·법무 / AI 연결 / 결제·구독 / 데이터·백업 /
점검·진단). 카드 사이사이에 `'</div><div class="set-sec" data-sec="…">'` 을 끼워 넣어
나눴습니다. 고른 칸은 `apex_set_sec` 에 남습니다.
카드 접기는 원래 있던 `osFoldApply()` 를 그대로 씁니다 — 처음 오는 사람에게는 칸마다
맨 위 한 장만 펼쳐 두고 나머지는 접습니다(그 기본값을 `apex_fold` 에 적어 둡니다).

## 정책·상품 뉴스가 왜 안 바뀌었나

`BIZ_NEWS` 블록에 「매월 자동 점검 Routine 이 최신화합니다」라고 **주석만** 있었고
그런 Routine 은 어디에도 없었습니다. 그래서 `asOf` 가 계속 과거에 머물렀습니다.

- 실제 Routine 을 만들었습니다 — 매월 1일 23:00 UTC(한국 2일 아침 8시), 새 세션에서
  1차 출처를 확인해 `@auto-update:BIZ_NEWS` 블록을 갱신하고 **PR 을 엽니다.**
  자동 병합하지 않습니다 — 숫자는 사람이 확인하고 병합합니다.
  끄려면 claude.ai 의 Routines 에서 「정책·상품 뉴스 매월 자동 점검」을 끄면 됩니다.
- 앱에서도 바로 올릴 수 있게 했습니다 — 대표 계정에 「＋ 새 소식 올리기」.
  `app_config` 의 `biz_news_extra`(JSON 배열) · `biz_news_asof` 두 칸에 남고
  모든 팀원 화면에 즉시 보입니다. 새 표를 만들지 않았습니다.
- 표가 몇 달 지났는지 화면 맨 위에 적습니다. 3개월이 넘으면 붉게 경고합니다.

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
- 리더 할 일의 체크 상태는 각자의 `daily_checks` 에 남습니다. 팀원이 지점장의 체크 상태까지
  보려면 `is_team_viewer()` 가 열려 있어야 합니다 — 안 열려 있으면 빈 목록으로 보입니다
- PPT 글꼴 임베딩 · 그래프를 편집 가능한 OOXML 차트로
- 오래된 PR #6 · #57 · #60 은 지워진 파일을 건드립니다 — 닫으면 됩니다

## 사용설명서

`docs/ebook/README.md` 를 보세요. 27쪽짜리 PDF 를 세 줄로 다시 만듭니다.
