# 투자·경제 실시간 모듈 — 주식관리 · 펀드관리 · 경제동향

APEX YUN PRO 왼쪽 메뉴 **투자·경제** 그룹(주식관리 / 펀드관리 / 경제동향 실시간)의
설계·연결·운영 문서입니다.

---

## 0. 토스는 어디에 어떻게 붙는가

토스 이름이 붙은 것이 **세 가지**인데 역할이 전부 다릅니다. 이걸 섞으면 헷갈립니다.

| 무엇 | 역할 | 이 CRM에서 |
|---|---|---|
| **토스증권 Open API** | OAuth 2.0 REST. 시세·계좌·주문 | **시세 1순위 제공자.** `providers.toss` 에 설정 |
| **토스증권 딥링크** | `tossinvest.com/stocks/A005930` — 종목 화면을 바로 여는 주소 | 종목마다 **`토스 ↗`** 버튼. **API 키 없이도 항상 동작** |
| **토스페이먼츠 API** | 결제·빌링 전용. 시세는 주지 않음 | 지금대로 **구독 결제**만 (`toss-confirm.js`, `toss-billing.js`) |

### 토스증권 Open API

- 신청: <https://corp.tossinvest.com/ko/open-api> → 승인되면 PC 웹에서
  **client_id / client_secret** 발급 + **호출 IP 등록**
- 문서: <https://developers.tossinvest.com/docs>
- 인증: OAuth 2.0 client_credentials
- 종목코드: 국내는 `A005930`(A + 6자리), 해외는 티커
  → **앱에는 `005930` 으로 입력하면 됩니다.** 호출할 때 자동으로 `A` 를 붙입니다.

> ⚠️ **엔드포인트 경로는 코드에 박아두지 않았습니다.** 승인 계정·버전마다 다를 수 있어
> 추측한 경로로 부르면 엉뚱한 에러가 납니다. 문서에서 확인한 값을
> `config/market.json → providers.toss` 의 **base / token_path / paths.quote / field_map**
> 네 군데에 채워 넣으세요. 채우기 전에는 이 제공자를 **조용히 건너뛰고 KIS 를 씁니다.**
> 채운 뒤 **`/api/market?kind=toss-probe`** 를 열면 토큰·경로·필드 중 어디서 막히는지
> 응답 원문 그대로 알려줍니다.

### 나머지 소스

| 데이터 | 제공자 | 성격 |
|---|---|---|
| 주식·ETF 현재가 | **토스증권 Open API**(1순위) → 실패 시 **한국투자증권 KIS** | 실시간(장중) |
| 코스피·코스닥 지수 | **한국투자증권 KIS Developers** | 실시간, 무료 |
| 기준금리·원/달러·CD·국고채·물가 | **한국은행 ECOS OpenAPI** | 일·월 공식 통계, 무료 |
| 공모펀드 기준가·수익률 | **data.go.kr 금융위원회 펀드 API** | 일 1회 기준가, 무료(활용신청) |
| 경제·보험 뉴스 | 저장소에 이미 있던 **`config/sources.json` RSS** | 15분 캐시 |

> 지수(코스피·코스닥)는 KIS 로만 받습니다. **토스와 KIS 둘 다 넣어두는 것을 권합니다** —
> 시세는 토스가, 지수는 KIS 가 받고, 한쪽이 죽으면 다른 쪽이 받습니다.

### 쓰지 않는 것

토스증권 **웹 내부 엔드포인트(WTS)** 를 리버스 엔지니어링해 쓰는 방법이 돌아다니지만
이 CRM에는 넣지 않았습니다. 예고 없이 바뀌고 이용약관 위반 소지가 있어
**고객 자산을 다루는 시스템에 둘 성질이 아닙니다.** 공식 Open API 와 공식 딥링크만 씁니다.

---

## 1. 구조

```
브라우저 (app/index.html · 투자·경제 메뉴)
   │  GET /api/market?kind=quote|index|fund|econ|news|all|health
   ▼
netlify/functions/market.js        ← 유일한 창구. 키는 전부 서버에만 있다.
   │  · 시세: 토스증권 1순위 → 실패하면 KIS 자동 폴백
   │  · OAuth 토큰 캐시(토스·KIS 각각. 동시 요청은 발급 1회로 묶어 호출제한 회피)
   │  · 종류별 TTL 캐시(시세 20초 · 지수 30초 · 지표/펀드 6시간 · 뉴스 15분)
   │  · 한 소스가 죽어도 나머지는 그대로 반환
   ▼
토스증권 / KIS / ECOS / data.go.kr / RSS

netlify/functions/market-daily.js  ← 평일 16:10 KST 자동 실행 (netlify.toml schedule)
   · 보유 종목·펀드 종가 → invest_prices 스냅샷
   · invest_holdings 현재가 갱신
   · 목표 도달 / 손절 이탈 → invest_alerts
   · 한국은행 지표 → econ_indicators
   · AI 시황 브리핑 → invest_briefs (다음 날 아침 앱에 떠 있음)
```

키가 **하나도 없어도** `/api/market` 은 500을 내지 않습니다.
`{ ok:false, need:["TOSS_CLIENT_ID", …] }` 로 무엇이 없는지 알려주고,
앱은 그 자리에 **설정 안내 카드**를 그립니다. 그 상태에서도 계좌·수량·평단·수동 기준가로
**수익률 관리는 그대로 됩니다.**

---

## 2. 켜는 순서 (30분)

### ⓪ 토스증권 Open API — 시세 1순위 (신청 완료 상태라면 여기부터)

1. 승인 확인 후 PC 웹에서 **client_id / client_secret** 발급, **호출 IP 등록**
   (Netlify 아웃바운드 IP. 고정 IP가 필요하면 Netlify 지원 범위를 확인하세요)
2. Netlify 환경변수에 추가

   ```
   TOSS_CLIENT_ID     = 발급받은 client_id
   TOSS_CLIENT_SECRET = 발급받은 client_secret
   ```

3. <https://developers.tossinvest.com/docs> 에서 **시세 조회** 엔드포인트를 확인해
   `config/market.json → providers.toss` 에 채웁니다

   ```jsonc
   "base":       "https://…",          // API 호스트
   "token_path": "/…",                 // 토큰 발급 경로
   "token_style": "form",              // form | json | basic — 문서에 맞게
   "paths": { "quote": "/…/{code}" },  // {code} 자리에 종목코드가 치환됨
   "field_map": { "root": "data", "price": "close", "name": "name", … }
   ```

4. `https://<사이트>/api/market?kind=toss-probe&code=005930` 을 엽니다
   - `step:"config"` → 아직 안 채워진 항목을 알려줍니다
   - `step:"token"` → `token_path` / `token_style` / IP 등록 확인
   - `step:"quote"` → `paths.quote` / `field_map` 을 **응답 원문에 맞게** 수정
   - `ok:true, step:"done"` → 끝. 이제 시세가 토스에서 옵니다

> 이 단계를 건너뛰어도 됩니다. 비어 있으면 아래 KIS 로 자동으로 넘어갑니다.

### ① 한국투자증권 KIS — 시세 폴백 + 지수 (지수는 여기서만 옵니다)

1. <https://apiportal.koreainvestment.com> 가입 → **KIS Developers** 신청
2. 앱 등록 후 **APP KEY / APP SECRET** 발급
3. Netlify → Site settings → Environment variables 에 추가

   ```
   KIS_APP_KEY     = 발급받은 앱키
   KIS_APP_SECRET  = 발급받은 시크릿
   KIS_ENV         = real        (모의투자로 테스트하려면 vts)
   ```

4. 재배포 후 `https://<사이트>/api/market?kind=health` 를 열어 `"kis": true` 와
   `quoteProvider`(toss / kis / none)를 확인합니다

> 계좌 개설이 필요합니다(무료). 조회 전용이라 **매매 권한 없이** 시세만 씁니다.

### ② 한국은행 ECOS — 경제지표

1. <https://ecos.bok.or.kr/api> → 인증키 신청(즉시 발급, 무료)
2. `ECOS_API_KEY = 발급키` 추가

### ③ data.go.kr — 공모펀드 기준가 (선택)

1. <https://www.data.go.kr> 에서 금융위원회 펀드 관련 API **활용신청**
2. 승인되면 **요청 URL** 과 **일반 인증키(Decoding)** 를 받습니다
3. 환경변수 추가

   ```
   FUND_API_URL = https://apis.data.go.kr/… (활용신청한 오퍼레이션 URL 그대로)
   FUND_API_KEY = 일반 인증키(Decoding)
   ```

4. 응답 필드명이 기관마다 다르므로 `config/market.json` 의
   `providers.fund.param_map` / `field_map` 을 응답에 맞게 맞춥니다.

> 이걸 건너뛰어도 됩니다. 펀드관리 화면은 **수동 기준가 입력**으로 그대로 동작합니다.
> 공모펀드는 어차피 기준가가 하루 1회라, 월 1회 입력만으로도 실무에 충분한 경우가 많습니다.

### ④ 서버 저장 켜기 (선택, 권장)

Supabase → SQL Editor 에서 **`migration_30_invest.sql`** 실행.
실행하면:

- 계좌·보유가 팀·다른 기기에서 공유됩니다(계좌바의 `☁ 저장` / `⬇ 불러오기`)
- 야간 자동수집이 종가·지표·시황 브리핑을 매일 쌓기 시작합니다

실행하지 않아도 **이 기기 저장(localStorage)** 으로 전부 동작합니다.

### ⑤ 야간 자동수집 확인

`netlify.toml` 에 이미 스케줄이 있습니다.

```toml
[functions."market-daily"]
  schedule = "10 7 * * 1-5"     # 평일 16:10 KST
```

지금 바로 돌려보려면 `https://<사이트>/api/market-daily` 를 한 번 열면 됩니다.
결과는 앱 → 시스템 점검 / `ai_dept_reports` 의 **📈 투자·경제 자동수집** 항목에 남습니다.

---

## 3. 화면별 쓰는 법

### 📈 주식관리

- **계좌**를 고객 단위로 만듭니다. 예: `홍길동 · 일반계좌`, `홍길동 · ISA`
- 종목코드 표기: 국내는 6자리(`005930`), 해외는 **거래소:심볼**(`NAS:AAPL`, `NYS:KO`)
- 수량·평단만 넣으면 현재가·평가금액·평가손익·수익률이 자동 계산됩니다
- **목표 수익률 / 손절 기준**을 넣어두면 도달·이탈 시 화면 상단에 경고가 뜨고,
  야간 자동수집이 같은 기준으로 `invest_alerts` 에 쌓아둡니다
- 장중에는 30초, 장 마감 후에는 5분마다 자동 갱신됩니다
- 각 행 오른쪽 **`토스 ↗`** — 토스증권 종목 화면을 새 탭으로 엽니다
  (`tossinvest.com/stocks/A005930`). **API 키가 하나도 없어도 이건 동작합니다.**
  고객과 통화하면서 같은 화면을 함께 보는 용도로 씁니다

### 💠 펀드관리

- 공모펀드는 **기준가가 하루 1회**라 오늘 흐름이 안 보입니다.
  그래서 같은 화면에 **실시간 ETF 대안**(KODEX 200, TIGER 미국S&P500 등)을 함께 놓았습니다
- **세제 연결** 섹션 — 같은 펀드라도 연금저축 / IRP / ISA / 일반 중 어디에 담느냐로
  세후 수익이 달라집니다. 상담에서 바로 꺼내 쓰는 요약입니다
- 자동 연동 전에는 각 행의 **기준가 수동 입력** 칸에 숫자만 넣으면 수익률이 계산됩니다

### 🌡️ 경제동향 실시간

- 코스피·코스닥·코스피200, 기준금리·환율·CD·국고채·물가(스파크라인 포함), 관심 종목, 뉴스
- 각 지표 카드 아래 한 줄은 **"이 숫자가 우리 고객에게 뜻하는 것"** 입니다
- **🤖 오늘 시황 브리핑** — 지금 화면의 실제 숫자와 오늘 헤드라인만 근거로,
  ①오늘 한 줄 ②숫자 3줄 ③고객에게 뜻하는 것 ④**카톡에 그대로 붙일 문장**을 만듭니다
- 야간 자동수집이 미리 만들어 둔 브리핑이 있으면 열자마자 먼저 보여줍니다
- 관심 종목 카드에도 **`토스 ↗`** 가 붙습니다. 시세 키가 없으면 숫자는 `—` 로 뜨지만
  종목 목록과 토스 바로가기는 그대로 보입니다

---

## 4. 실무 활용 — 이걸로 뭘 하느냐

이 모듈의 목적은 트레이딩이 아니라 **상담 접점을 만드는 것**입니다.

1. **먼저 연락하는 사람이 됩니다.**
   손절선 이탈 알림이 뜨면 고객이 불안해서 전화하기 **전에** 우리가 겁니다.
   목표 도달 알림은 익절·리밸런싱 상담의 자연스러운 명분이 됩니다.

2. **연금·변액 상담의 근거 숫자가 생깁니다.**
   "금리가 내려서" 대신 "기준금리가 2.75%에서 2.50%로 내려서, 공시이율 연동 상품이…"
   로 말이 바뀝니다. 화면에 그 숫자가 떠 있으니 외울 필요가 없습니다.

3. **환율이 달러보험과 이어집니다.**
   원/달러와 해외펀드·달러보험 환노출을 한 화면에서 보면
   "환율 때문에 손해 아니냐"는 질문에 숫자로 답할 수 있습니다.

4. **그릇을 바꾸는 상담으로 넘어갑니다.**
   펀드관리의 세제 섹션 → 절세 계좌 배치 제안 → 연금저축·IRP·ISA 가입으로 연결됩니다.
   투자 수익률을 못 바꿔도 **세후 수익률은 바꿀 수 있다**는 게 설계사의 자리입니다.

5. **매일 아침 3분.**
   야간 자동수집이 만든 시황 브리핑을 열어 카톡 문장만 복사해 보내면
   접촉 빈도가 유지됩니다.

6. **화면을 같이 봅니다.**
   `토스 ↗` 로 고객이 실제로 쓰는 토스증권 화면을 그대로 열어 설명하면
   "설계사가 보는 숫자"와 "고객이 보는 숫자"가 어긋나지 않습니다.

---

## 5. 준법 (반드시)

- 이 화면과 AI 생성물은 **정보 제공·상담 준비용**이며 **특정 종목·펀드의 매매 권유가 아닙니다.**
- AI 프롬프트에 다음이 규칙으로 박혀 있습니다 — 매수/매도 권유 금지, 없는 숫자 생성 금지,
  "무조건·확정 수익" 단정 표현 금지, **원금손실 가능성 고지 필수**.
- 화면 하단과 생성물 하단에 `config/compliance.json` 의 투자상품 문구와 같은 취지의
  고지가 자동으로 붙습니다.
- 고객 발송물은 **회사 준법감시인 광고심의 절차**를 거쳐야 합니다. 이 도구는 초안 생성 보조입니다.
- 투자권유는 자격(투자권유대행인·투자권유자문인력 등) 범위 안에서만 하십시오.

---

## 6. 문제가 생기면

| 증상 | 확인 |
|---|---|
| 전부 `—` 로 나온다 | `/api/market?kind=health` 의 `quoteProvider` 확인. `none` 이면 토스·KIS 둘 다 미설정 |
| 토스가 안 잡힌다 | `/api/market?kind=toss-probe` → `step` 이 config / token / quote 중 어디인지 보고 그 항목만 고칩니다 |
| 토스 `step:"token"` 401 | client_id/secret 오타, **호출 IP 미등록**, 또는 `token_style` 불일치(form/json/basic) |
| 토스 `step:"quote"` | `paths.quote` 경로 또는 `field_map`(root/price)이 실제 응답과 다름. probe 응답 원문을 보고 맞춥니다 |
| 토스는 되는데 지수가 없다 | 정상입니다. 코스피·코스닥 지수는 KIS 로만 받습니다 — KIS 키도 넣으세요 |
| `KIS 토큰 발급 실패` | 앱키/시크릿 오타, 또는 `KIS_ENV` 가 실계좌/모의계좌와 안 맞음 |
| 해외 종목만 안 나온다 | 표기가 `NAS:AAPL` 형식인지 확인(거래소 코드 필요) |
| 펀드가 안 나온다 | `FUND_API_URL` 미설정이면 정상. 수동 입력 칸을 쓰거나 3번 절차 진행 |
| 뉴스가 비어 있다 | 죽은 RSS는 자동으로 건너뜁니다. `config/sources.json` 에서 피드 교체 |
| `☁ 저장` 이 실패한다 | `migration_30_invest.sql` 미실행. Supabase에서 실행 후 재시도 |
| 지표 코드가 바뀌었다 | `config/market.json` 의 `econ[].stat/item` 을 ECOS 통계코드검색에서 확인 후 수정 |

---

## 7. 건드리는 파일

| 파일 | 역할 |
|---|---|
| `config/market.json` | 제공자(토스·KIS·ECOS·펀드)·지수·지표코드·관심종목·딥링크·캐시 TTL. **코드 수정 없이 여기만 고치면 됩니다** |
| `config/sources.json` | 뉴스 RSS 목록 (기존 파일 재사용) |
| `netlify/functions/market.js` | 실시간 데이터 창구 |
| `netlify/functions/market-daily.js` | 평일 장 마감 후 자동수집 |
| `migration_30_invest.sql` | 서버 저장용 표·RLS |
| `app/index.html` | 화면 (`invRender` / `invAfterRender` 이하 투자·경제 모듈) |
