# 키가 어디에 들어가는지 — 전부

코드를 훑어서 만든 목록입니다. 기억이 아니라 실제로 `process.env` 를 읽는 자리를 센 것입니다.

**키는 두 군데에 나뉘어 들어갑니다. 섞으면 안 됩니다.**

| 어디 | 무엇이 들어가나 | 누가 읽나 |
|---|---|---|
| **Netlify 환경변수** | 사이트·서버가 쓰는 것 전부 | `netlify/functions/*.js` |
| **`paper-trading-bot/.env`** | 자동매매 봇 전용 | 형님 컴퓨터에서 도는 파이썬 |

봇은 서버가 아니라 형님 컴퓨터에서 돕니다. **Alpaca 키를 Netlify에 넣으면 아무 일도 일어나지 않습니다.**

---

## ⚠️ 제일 헷갈리는 것 — 토스가 두 개다

이름이 비슷한 완전히 다른 키가 둘 있습니다.

| 변수 | 무엇 | 쓰는 곳 |
|---|---|---|
| `TOSS_SECRET_KEY` | 토스**페이먼츠** — 구독 **결제** | `toss-confirm.js` · `toss-billing.js` |
| `TOSS_CLIENT_ID` + `TOSS_CLIENT_SECRET` | 토스**증권** — **시세** | `market.js` |

결제용 자리에 시세 키를 넣으면 **결제가 멈춥니다.** 반대로 넣으면 시세만 안 붙습니다.

토스증권 키는 접두사로 구분됩니다 — 글자 하나 차이입니다:

- `ts**c**k_live_…` = **c**lient key → `TOSS_CLIENT_ID`
- `ts**s**k_live_…` = **s**ecret key → `TOSS_CLIENT_SECRET` ← Netlify에서 **"Contains secret values" 체크**

---

## ① Netlify 환경변수

[Site settings → Environment variables](https://app.netlify.com/sites/apex-os-yunpro/configuration/env)

> **Key 칸에는 아래 대문자 이름만.** 실제 키 값은 **Values 칸**입니다. 바꿔 넣으면 "already exists" 오류가 납니다.

### 시세 — 하나만 있어도 화면은 돕니다

셋 다 있으면 **① 토스증권 → ② 한국투자증권 → ③ 공공데이터포털** 순서로 시도하고, 실패하면 다음으로 넘어갑니다.

| 변수 | 무엇 | 승인 | 없으면 |
|---|---|---|---|
| `TOSS_CLIENT_ID`<br>`TOSS_CLIENT_SECRET` | 토스증권 (실시간·1순위) | 신청·승인 필요 | 건너뜀 |
| `KIS_APP_KEY`<br>`KIS_APP_SECRET` | 한국투자증권 (실시간·2순위, **지수도 여기**) | 계좌 필요 | 건너뜀 |
| `KIS_ENV` | `real`(기본) 또는 `vts`(모의) | — | `real` |
| `DATA_GO_KR_KEY` | 공공데이터포털 (전일 종가·3순위) | **자동승인** | 건너뜀 |

> 토스증권은 **키 2개만으로는 안 켜집니다.** `config/market.json` 의 `base` · `token_path` · `paths.quote` 까지 채워야 합니다. 승인 문서의 값을 넣으세요. `/api/market?kind=toss-probe` 가 어디서 막혔는지 알려줍니다.

### 그 밖의 데이터

| 변수 | 무엇 | 없으면 |
|---|---|---|
| `ECOS_API_KEY` | 한국은행 — 기준금리·**환율**·CD·국고채·물가 | 경제지표 빔. **환율이 없으면 USD 종목이 자산배분 계산에서 빠집니다** |
| `FUND_API_URL`<br>`FUND_API_KEY` | 공모펀드 기준가 | 펀드 화면만 빔 |
| — | 뉴스 (RSS 12개) | **키 불필요.** `config/sources.json` 에서 추가·삭제 |

### AI · 저장소 · 보안

| 변수 | 무엇 | 없으면 |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | 서버가 DB에 쓰는 키 (**필수**) | 야간 작업·리포트 전부 안 돎 |
| `SUPABASE_URL` | 저장소 주소 | 기본값 사용 |
| `ANTHROPIC_API_KEY` | Claude — 리포트 문장 | Gemini로 넘어감 |
| `GEMINI_API_KEY` | Gemini — 대체 | **숫자만 담긴 리포트**가 만들어짐 (빈손은 아님) |
| `SHARED_TOKEN` | 프록시 남용 방지 | 누구나 우리 API를 태울 수 있음 |
| `ALLOWED_ORIGIN` | 호출 허용 도메인 | 제한 없음 |
| `CRON_SECRET` | 예약 작업 보호 | 외부에서 강제 실행 가능 |
| `MARKET_BASE_URL` | 야간 작업이 자기 사이트를 부를 주소 | Netlify가 자동으로 넣어줌 |

> `SHARED_TOKEN` 을 켜두셨다면 앱 **설정 → AI 연결 → 공유 토큰** 칸에 같은 값이 있어야 합니다. 없으면 투자 화면이 401로 죽습니다.

---

## ② 봇 — `paper-trading-bot/.env`

**형님 컴퓨터에서만** 씁니다. `.gitignore` 에 있어서 깃에 안 올라갑니다.

```bash
cd paper-trading-bot
cp .env.example .env
```

| 변수 | 무엇 | 받는 곳 |
|---|---|---|
| `ALPACA_API_KEY`<br>`ALPACA_SECRET_KEY` | 모의계좌 (**무료 · 신분증·입금 불필요**) | [alpaca.markets](https://alpaca.markets) → 우측 상단 **Paper** 전환 후 발급 |
| `ALPACA_PAPER` | `true`(기본·모의) / `false`(실계좌) | — |
| `ALPACA_LIVE_CONFIRM` | 실계좌 2번째 열쇠 | 아래 참고 |
| `REPORT_WEBHOOK_URL` | 브리핑 보낼 슬랙·디스코드 주소 | 비우면 파일로만 남김 |

> Alpaca Secret 은 **발급 순간 한 번만** 보입니다. 그때 복사하세요.
> 웹훅 주소 자체가 비밀입니다 — 아는 사람은 누구나 그 채널에 글을 쓸 수 있습니다.

### 실계좌 3중 잠금

셋이 **동시에** 있어야 열립니다. 하나라도 없으면 조용히 실패하지 않고 **모의로 내려간 뒤 무엇이 빠졌는지 알려줍니다.**

```
.env   ALPACA_PAPER=false
.env   ALPACA_LIVE_CONFIRM=I_UNDERSTAND_REAL_MONEY
명령줄  --live
```

여덟 조합(2×2×2)을 전부 도는 테스트가 있고, **정확히 한 줄만 실계좌**인지 셉니다 (`tests/test_live_requires_triple_confirm.py`).

---

## 무엇을 하려면 무엇이 필요한가

| 하고 싶은 것 | 필요한 키 | 어디 |
|---|---|---|
| 데스크 화면에서 **내 포트폴리오 보기** | **없음** | — |
| 뉴스 | **없음** | — |
| 화면에 **실제 시세** | 시세 키 하나 (`DATA_GO_KR_KEY` 가 제일 빠름) | Netlify |
| **토스증권 실시간** | `TOSS_CLIENT_ID`+`SECRET` **＋ 설정 3개** | Netlify + `config/market.json` |
| **자동매매 봇** | `ALPACA_API_KEY`+`SECRET` | 봇 `.env` (**Netlify 아님**) |
| **AI 리포트 문장** | `ANTHROPIC_API_KEY` 또는 `GEMINI_API_KEY` | Netlify |
| 아침·월간 리포트 자체 | `SUPABASE_SERVICE_ROLE_KEY` | Netlify |

---

## 진단 주소

넣고 나서 여기를 열면 무엇이 꽂혔고 어디서 막혔는지 알려줍니다. **키 값은 마스킹돼서 나옵니다.**

| 주소 | 무엇 |
|---|---|
| `/api/market?kind=health` | 어떤 키가 있는지 전체 진단 |
| `/api/market?kind=toss-probe` | 토스증권 연결이 어디서 막혔는지 |
| `/api/market?kind=toss-discover` | 키는 있는데 경로를 모를 때 자동 탐색 |
| `/api/market?kind=krx-probe` | 공공데이터포털 진단 |
| `/api/invest-daily` | 아침 브리핑 수동 실행 |
| `/api/invest-monthly` | 월간 리포트 수동 실행 |

봇 쪽은 `python main.py status`.

---

## 키를 잘못 흘렸을 때

1. **즉시 재발급(rotate)** 하세요. 지운다고 없던 일이 되지 않습니다 — 캡처·로그·대화 기록에 남습니다.
2. 새 값을 Netlify에 넣고, 옛 키를 발급처에서 **폐기**하세요.
3. `.env` 는 절대 커밋하지 마세요. `.gitignore` 에 들어 있지만, `git status` 로 한 번 더 확인하는 습관이 안전합니다.

**저에게 키를 보내실 때는 앞 4자 + 뒤 4자만** 주세요 (`tsck…22BD`). 어느 키인지 알아보는 데 그거면 충분합니다. 전체 값은 형님이 Netlify에만 붙여넣으시면 됩니다.

캡처를 보내실 때는 값 칸의 **👁 아이콘을 눌러 가린 뒤** 찍으세요.
