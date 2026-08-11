# 투자·경제 켜기 — 사장님이 할 것 / AI에게 시킬 것

한 장짜리 인수인계표입니다. 왼쪽만 하시면 되고, 나머지는 복붙해서 AI에게 넘기세요.

---

## 🔴 지금 당장 (5분) — 이것부터

### 1. 토스증권 키 재발급

채팅창에 붙여넣은 키(`tsck_live_…`)는 **노출된 것으로 봐야 합니다.** 대화 기록에 남습니다.

- 토스증권 개발자 콘솔 → **Regenerate / 재발급**
- 재발급하는 순간 이전 키는 무효가 됩니다

> **앞으로 키는 어디에도 붙여넣지 마세요.** AI에게도, 메신저에도, 문서에도.
> 키가 들어가는 곳은 **Netlify 환경변수 한 곳뿐**입니다.
> 키 없이도 AI는 다 도울 수 있습니다 — 에러 메시지만 보여주면 됩니다.

---

## ✋ 사장님만 할 수 있는 것 (사람 손이 필요한 일)

| # | 할 일 | 어디서 | 시간 |
|---|---|---|---|
| 1 | **토스 키 재발급** | 토스증권 개발자 콘솔 | 2분 |
| 2 | **PR #158 병합** | github.com/asdf827258-lab/apex-crm/pull/158 → Merge | 1분 |
| 3 | **공공데이터 활용신청** | data.go.kr → `금융위원회_주식시세정보`(15094808), `지수시세정보`(15094807) → 활용신청(자동승인) | 5분 |
| 4 | **한국은행 인증키 신청** | ecos.bok.or.kr/api (즉시 발급) | 3분 |
| 5 | **환경변수 입력** | Netlify → Site settings → Environment variables (아래 표) | 5분 |
| 6 | **Supabase SQL 실행** | Supabase → SQL Editor → `migration_33_invest.sql` 붙여넣고 Run | 2분 |
| 7 | **토스 IP 등록 확인** | 토스 콘솔에서 "호출 IP 등록"이 필수인지 확인 | 2분 |

### 5번 — Netlify에 넣을 값

| 변수명 | 값 | 없으면? |
|---|---|---|
| `DATA_GO_KR_KEY` | data.go.kr **일반 인증키(Decoding)** | 전일 종가 안 나옴 |
| `ECOS_API_KEY` | 한국은행 인증키 | 기준금리·환율 안 나옴 |
| `TOSS_CLIENT_ID` | 재발급받은 토스 client_id | 실시간 대신 전일 종가로 동작 |
| `TOSS_CLIENT_SECRET` | 재발급받은 토스 client_secret | 〃 |
| `KIS_APP_KEY` / `KIS_APP_SECRET` | (선택) 한국투자증권 | 지수(코스피) 실시간 안 나옴 |

> **한 세트만 넣어도 화면은 켜집니다.** 여러 개 넣으면 하나가 죽어도 다음이 받습니다.
> 넣은 뒤 **재배포(Trigger deploy)** 를 해야 반영됩니다.

---

## 🤖 AI에게 시킬 것 (그대로 복사해서 붙여넣기)

키는 절대 붙여넣지 마세요. **결과 화면만** 보여주면 됩니다.

### ① 토스 엔드포인트 찾기 (배포 후)

브라우저에서 이 주소를 엽니다 → 나온 JSON을 **통째로 복사**

```
https://apex-os-yunpro.netlify.app/api/market?kind=toss-discover
```

AI에게:

```
apex-crm 저장소의 config/market.json 의 providers.toss 를 채워줘.
아래는 /api/market?kind=toss-discover 결과야.

[여기에 JSON 붙여넣기]
```

### ② 뭐가 빠졌는지 점검

```
https://apex-os-yunpro.netlify.app/api/market?kind=health
```

AI에게:

```
apex-crm 투자·경제 시세 연결 점검 결과야. 뭐가 빠졌고 뭘 하면 되는지
내가 할 것만 순서대로 알려줘.

[여기에 JSON 붙여넣기]
```

### ③ 공공데이터가 안 될 때

```
https://apex-os-yunpro.netlify.app/api/market?kind=krx-probe
```

AI에게:

```
공공데이터포털 연결이 안 돼. 아래 결과 보고 원인이랑 다음 조치 알려줘.

[여기에 JSON 붙여넣기]
```

### ④ 화면이 이상할 때

AI에게 (화면 캡처 첨부):

```
apex-crm 앱 투자·경제 화면인데 이상해. 캡처 보고 원인이랑 고칠 방법 알려줘.
저장소는 asdf827258-lab/apex-crm, 관련 파일은 app/index.html 의 invRender 이하,
netlify/functions/market.js 야.
```

### ⑤ 토스 문서를 대신 읽히기

토스 개발자 문서(`developers.tossinvest.com/docs`)의 **시세 조회 페이지를 캡처**해서:

```
토스증권 오픈API 시세 조회 문서 캡처야. 여기서
base(호스트) / token_path / paths.quote / field_map 네 가지를 뽑아서
apex-crm 의 config/market.json providers.toss 에 넣을 JSON 으로 만들어줘.
```

---

## ✅ 다 됐는지 확인하는 법

`https://apex-os-yunpro.netlify.app/api/market?kind=health` 을 열어서:

- `"quoteProvider": "toss"` → 토스 실시간으로 돌고 있음 ✅
- `"quoteProvider": "kis"` → 한국투자증권 실시간 ✅
- `"quoteProvider": "krx"` → 공공데이터 전일 종가 (화면에 `종가 8/6` 배지) ✅
- `"quoteProvider": "none"` → 아직 아무것도 안 들어감 ❌

앱에서 **투자·경제 → 주식관리** 에 종목코드(예: `005930`)와 수량·평단을 넣었을 때
현재가와 수익률이 채워지면 끝입니다.

---

## 참고

- 키가 하나도 없어도 **종목별 `토스 ↗` 바로가기**와 **수동 입력 수익률 관리**는 됩니다
- 자세한 설계·문제해결은 `docs/INVEST_MARKET_INTEGRATION.md`
