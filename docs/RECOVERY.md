# APEX YUN PRO — 백업 · 복구 · 관리 매뉴얼

> 이 문서 하나면 **앱이 통째로 날아가도 되살릴 수 있다.**
> 윤시현 사업단장(운영자·관리자) 전용. 어려운 용어는 풀어서 적었다.

---

## 0. 30초 요약 (급할 때 이것만)

1. **이 앱은 딱 한 개의 HTML 파일이다.** → 그 파일 하나만 있으면 어디서든 100% 복구된다.
2. **접속 주소 자체가 항상 최신 백업본이다.** → `https://apex-os-yunpro.netlify.app`
3. **정기 백업:** 앱 → `설정` → `🛟 백업·복구` → **「앱 전체 백업(HTML 다운로드)」** 클릭 → 파일 보관.
4. **복구:** 받아둔 백업 HTML을 [Netlify](https://app.netlify.com) 사이트에 끌어다 놓으면 즉시 다시 배포된다.
5. **막히면:** Claude Code에게 **"APEX 복구해줘"** 라고 말하면 이 문서 절차대로 되살린다.

---

## 1. 이 앱의 구조 (왜 복구가 쉬운가)

- 모든 기능(계산기·AI 도구·CRM·재무설계·로그인·요금제)이 **`app/index.html` 단일 파일**에 들어 있다.
- 외부 의존은 CDN 폰트/pdf.js와 **Supabase(로그인·DB)** 뿐이다.
- 재무설계 계산기와 CRM은 이 HTML 안에 **base64로 임베드**되어 있어, 파일 하나가 곧 앱 전체다.
- 따라서 **HTML 한 개 = 앱 전체**. 이 파일만 지키면 된다.

```
APEX_YUNPRO_...ClaudeCode/
├── app/index.html      ← ★ 이것이 앱 전체(배포본). 이 파일만 지키면 됨
├── scripts/check.js    ← 검증기 (수정 후 항상 14/14 확인)
├── scripts/embed_crm.js← CRM 폴더를 HTML에 다시 임베드하는 도구
├── docs/RECOVERY.md    ← 지금 이 문서
└── netlify.toml        ← 배포 설정(publish = "app")
```

---

## 2. 정기 백업 (평소에 해둘 일)

### 방법 A — 앱 안에서 (가장 쉬움, 권장)
1. 앱 접속 → 로그인 → 좌측 **`설정`** 메뉴.
2. **🛟 백업·복구** 카드에서:
   - **「💾 앱 전체 백업(HTML 다운로드)」** → `APEX_YUN_PRO_backup_날짜.html` 저장.
     → **이 파일 하나가 앱 전체다.** 큰 변경 전후로 눌러 보관.
   - **「📤 내 설정·지식 백업(JSON)」** → 윤시현의 두뇌 지식·설정값을 JSON으로 저장.
     → *보안상 API 비밀키는 제외*되므로, 복원 후 키만 다시 입력하면 된다.
3. 저장한 파일을 클라우드(드라이브)·USB 등 **2곳 이상**에 보관.

### 방법 B — 개발 폴더에서 (내 PC)
- `C:\Users\USER\Downloads\APEX_YUNPRO_...ClaudeCode\app\index.html` 을 통째로 복사해 보관.
- git 체크포인트가 자동으로 쌓이므로, 개발 폴더 자체가 이력 백업이 된다.

### 백업 주기 권장
- **큰 변경(기능 추가/배포) 직전·직후 매번.**
- 그 외 최소 **주 1회**.

---

## 3. 복구 (앱이 이상해지거나 날아갔을 때)

### 길 ① 저장해 둔 백업 HTML로 복구 — 가장 빠름
1. [Netlify 로그인](https://app.netlify.com) → 사이트 **apex-os-yunpro** 선택.
2. **Deploys** 탭 → 백업 HTML 파일이 든 폴더를 화면에 **끌어다 놓기(drag & drop)**.
   - 단, Netlify는 폴더를 올린다. 백업 HTML을 `index.html`로 이름을 바꿔 폴더에 넣고 그 폴더를 올리면 된다.
3. 30초 내 재배포 완료 → 주소로 접속해 확인.

### 길 ② 지금 이 사이트에서 최신본 다시 받기
- 앱이 아직 열린다면 → `설정 → 🛟 백업·복구 → 앱 전체 백업` 으로 최신본을 언제든 다시 받는다.

### 길 ③ 개발 이력(git)에서 되돌리기 — Claude Code에게 요청
- 문제가 생기면 **"APEX를 직전 안정본으로 되돌려줘"** 라고 말하면 된다.
- 내부적으로 하는 일:
  ```bash
  cd "C:\Users\USER\Downloads\APEX_YUNPRO_...ClaudeCode"
  git log --oneline           # 안정 체크포인트 확인
  git checkout <커밋> -- app/index.html   # 해당 시점 파일로 복구
  node scripts/check.js       # 14/14 확인
  # 배포 명령으로 재배포
  ```

---

## 4. 처음부터 다시 배포하는 법 (사이트가 아예 없어졌을 때)

> Netlify 계정만 살아 있으면 5분이면 된다.

1. [Netlify](https://app.netlify.com) 로그인 → **Add new site → Deploy manually**.
2. `app` 폴더(안에 `index.html`)를 끌어다 놓기.
3. 새 주소가 생기면, 원래 주소(`apex-os-yunpro`)를 쓰려면 **Site settings → Change site name** 에서 이름을 맞춘다.
4. **로그인·CRM이 동작하려면 Supabase가 연결돼 있어야 한다** (§5).

### 명령줄 재배포 (Claude Code가 대신 실행)
```bash
export PATH="$PATH:/c/Program Files/nodejs"
cd "C:\Users\USER\Downloads\APEX_YUNPRO_...ClaudeCode"
node scripts/check.js   # 반드시 14/14
NETLIFY_AUTH_TOKEN='<임시토큰>' npx -y netlify-cli deploy --prod \
  --site 358d3c54-b3cb-4d48-bfaf-f2eb72d38816
```
- 토큰은 그때그때 발급하는 **임시 개인 토큰**이며, 배포 후 즉시 폐기한다(§6).

---

## 5. 반드시 기억할 핵심 정보 (분실 주의)

| 항목 | 값 |
|---|---|
| **배포 주소** | `https://apex-os-yunpro.netlify.app` |
| **Netlify Site ID** | `358d3c54-b3cb-4d48-bfaf-f2eb72d38816` |
| **로그인·DB 서버(Supabase) 프로젝트** | `miakdhxtqofpndtlyzxa` |
| **배포 폴더(publish)** | `app` (netlify.toml에 설정) |
| **검증 명령** | `node scripts/check.js` → **14/14** 여야 정상 |

### 계정으로 지켜야 할 3가지
1. **Netlify 계정** — 배포/재배포 권한. 로그인 정보 분실 금지.
2. **Supabase 계정 + 프로젝트 `miakdhxtqofpndtlyzxa`** — 로그인·회원·CRM 데이터. **이게 사라지면 데이터가 사라진다.** 정기적으로 Supabase 대시보드에서 DB 백업.
3. **앱 백업 HTML** — 위 §2 파일.

> ⚠️ **service_role 키는 절대 앱(프런트)에 넣지 않는다.** 앱은 공개용 anon 키만 쓴다. 비밀키는 Netlify/Supabase 서버 환경변수에만.

---

## 6. 보안 · 토큰 관리

- **Netlify 배포 토큰**은 배포할 때만 임시 발급 → **배포 직후 폐기**:
  `https://app.netlify.com/user/applications#personal-access-tokens`
- **API 키(Claude/Gemini/Toss)** 는 소스코드에 절대 넣지 않는다. 앱 `설정`에서 브라우저(localStorage)에만 저장된다.
- 토스 **시크릿 키**는 Netlify 환경변수 `TOSS_SECRET_KEY` 로만. (서버 확인 함수 `netlify/functions/toss-confirm.js`)

---

## 7. 앞으로 기능 추가·관리하는 법 (운영 워크플로)

새 기능이 필요하면 Claude Code에게 자연어로 말하면 된다. 예:

> "APEX **블로그 도구에** 실손 세대개편 설명 자동생성 **추가해줘**"
> "요금제에 **평생 이용권 플랜 하나 더** 넣어줘"

그때마다 자동으로 지켜지는 안전 순서:

1. **ⓐ 자동 검증** — `node scripts/check.js` 14/14 통과 확인(기존 기능 안 깨짐).
2. **ⓑ 백업/체크포인트** — 변경 전 git 체크포인트 + 필요 시 HTML 백업.
3. **ⓒ 배포** — 검증 통과 시에만 프로덕션 반영.

### 지켜지는 규칙(자동)
- 기존 기능·재무설계 계산기(base64)·18개 생성기는 **절대 깨지 않는다**.
- 디자인 토큰 고정(#1A56DB, Pretendard, Toss 스타일).
- 카카오톡 인앱 호환(ES5~ES6).
- 준법 우선: 모든 AI 출력에 "게시 전 준법감시 확인" + 진단/인수/고지 면책.

---

## 8. 상용화 관련 남은 서버 작업 (운영자 1회 설정)

앱 프런트는 완성돼 있고, 아래는 **실제 과금·승인 강제**를 위해 서버에서 한 번만 해두면 되는 일이다.

### 8-1. 가입 승인 게이트 활성화 (Supabase SQL)
- 앱 `설정 → 가입 승인` 카드에 있는 **`OS_APPROVAL_SQL`** 을 Supabase SQL 편집기에서 1회 실행.
- 실행 전까지는 게이트가 **무효(모두 통과)** 라 로그인이 절대 막히지 않는다(안전).
- 실행 후: 신규 가입자는 `pending` 상태 → **관리자(윤시현) 승인** 후에만 입장.

### 8-2. 토스 실결제 연결
- 앱 `설정 → 토스페이먼츠 결제 연결` 카드:
  1. 토스 가맹점 가입 → 클라이언트 키/시크릿 키 발급.
  2. **클라이언트 키**만 앱에 저장(공개 가능).
  3. 카드에 있는 **서버 확인 함수 코드**를 `netlify/functions/toss-confirm.js` 로 배포 + Netlify 환경변수 `TOSS_SECRET_KEY` 등록.
  4. 배포된 함수 주소를 앱에 저장 → 실제 결제·정산 완료.

---

## 9. 문제별 빠른 대처표

| 증상 | 대처 |
|---|---|
| 앱이 안 열린다 | Netlify 사이트 상태 확인 → §3 길① 백업 HTML 재배포 |
| 로그인이 안 된다 | Supabase 프로젝트 `miakdhxtqofpndtlyzxa` 살아있는지 확인 |
| 방금 바꾼 뒤 기능이 깨졌다 | Claude Code에 "직전 안정본으로 되돌려줘" (§3 길③) |
| AI 답변이 자꾸 끊긴다 | 자동 이어쓰기 내장 + Gemini↔Claude 자동 대체. `설정`에서 대안 5가지 안내 참고 |
| 회원이 못 들어온다 | `설정 → 가입 승인`에서 대기 목록 승인 |
| 백업 파일을 잃었다 | 접속되는 배포 주소에서 §2-A로 즉시 새로 받기 |

---

*최종 갱신: 2026-07-21 · 작성 보조: Claude Code · 운영자: 윤시현 사업단장(에이플러스에셋 온탑본부)*
