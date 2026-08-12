# Alpaca 모의계좌 연결 확인 (macOS / zsh)

자동매매 봇을 만들기 전, **모의계좌에 접속해서 잔고를 읽어오는 것까지만** 확인하는 단계다.
주문 기능은 들어 있지 않다.

## 빠른 시작

```zsh
cd trading-bot
./setup.sh          # 파이썬 확인 → 가상환경 → 설치 → 코드 검증까지 한 번에
cp .env.example .env   # 모의계좌 키 2줄을 채운다
source .venv/bin/activate
python check_account.py
```

계좌 상태가 **`ACTIVE`** 로 나오면 이 단계는 끝난 것이다.

## 파일 구성

| 파일 | 역할 |
| --- | --- |
| `setup.sh` | 설치 + 검증을 한 번에 하는 스크립트 |
| `check_account.py` | 실제 모의계좌에 붙어 잔고를 읽는다 |
| `selftest.py` | **키·인터넷 없이** 코드가 맞는지 검증한다 (가짜 서버 사용) |
| `alpaca_paper.py` | 위 둘이 공유하는 공통 로직 |
| `.env.example` | 키 템플릿 |

## 두 가지 확인은 서로 다르다

초보자가 가장 많이 헷갈리는 지점이라 분리해뒀다.

**1) 코드가 맞는가** → `python selftest.py`

내 컴퓨터 안에 Alpaca 흉내를 내는 가짜 서버를 잠깐 띄우고, `check_account.py`와
**똑같은 코드 경로**를 태워본다. 키도 인터넷도 필요 없다. 10개 항목을 검사한다:

```
✓ balance_fetch_succeeds     잔고 조회가 되는가
✓ report_renders_balance     출력에 잔고가 나오고 키는 안 새는가
✓ non_active_status_is_caught  ACTIVE 아닌 상태를 잡아내는가
✓ wrong_key_gives_paper_hint   401일 때 올바른 안내가 나오는가
✓ masking_hides_secret       키가 가려지는가
✓ live_url_is_refused        실계좌 주소를 거부하는가
✓ default_url_is_paper       기본 접속지가 모의계좌인가
✓ missing_keys_are_reported  키 없을 때 친절히 알려주는가
✓ quoted_key_is_reported     따옴표 섞인 키를 잡아내는가
✓ proxy_block_is_explained   네트워크 차단을 키 문제와 구분하는가
```

**2) 내 계좌에 실제로 붙는가** → `python check_account.py`

이건 진짜 키가 있어야만 확인된다. 셀프테스트가 통과했다는 건 "코드는 정상"이라는 뜻이지
"계좌 연결이 됐다"는 뜻이 아니다.

## 수동 설치 (setup.sh 대신 직접 하고 싶다면)

```zsh
python3 --version      # 3.10 이상이면 OK. 없으면 brew install python@3.11
pip show alpaca-py     # "Package(s) not found" 면 아직 설치 안 된 것

python3 -m venv .venv
source .venv/bin/activate          # 프롬프트 앞에 (.venv) 가 붙으면 성공
pip install -r requirements.txt

python -c "import alpaca; print(alpaca.__version__)"   # 버전이 찍히면 설치 완료
```

> 가상환경(venv)은 이 프로젝트가 쓰는 라이브러리를 다른 프로젝트와 섞이지 않게 담아두는 상자다.
> 다음에 다시 작업할 때는 `source .venv/bin/activate` 만 하면 된다. 끝낼 때는 `deactivate`.

## 키 발급

Alpaca 대시보드에서 **Paper Trading(모의계좌) 모드로 전환한 상태**에서 발급받아야 한다.
→ <https://app.alpaca.markets/paper/dashboard/overview> 우측 **API Keys → Generate**

시크릿은 발급 순간 딱 한 번만 보인다. 놓쳤으면 재발급하면 된다.
`.env` 는 `.gitignore` 에 걸려 있어 깃에 올라가지 않는다. 키를 코드에 직접 적지 말 것.

## 성공하면 이런 모양

```
키 로딩 확인 : PKAB******** (길이 20)
접속 대상    : https://paper-api.alpaca.markets (모의계좌)
----------------------------------------------
계좌 상태     : ACTIVE
계좌 번호     : PA3XXXXXXXXX
통화          : USD
현금          : 100000
매수 가능 금액: 200000
평가 총액     : 100000
거래 차단 여부: False
----------------------------------------------
[성공] 모의계좌 연결과 잔고 조회까지 정상이다. 주문은 한 건도 넣지 않았다.
```

## 막히면

| 화면에 나오는 말 | 원인과 조치 |
| --- | --- |
| `.env에서 다음 값을 찾지 못했다` | `.env` 를 안 만들었거나 변수 이름 오타. `cp .env.example .env` 부터 |
| `값에 따옴표가 섞여 있다` | `.env` 에서는 `ALPACA_API_KEY=PK...` 처럼 따옴표 없이 값만 적는다 |
| `키가 거부됐다(401)` | 실계좌용 키일 가능성이 높다. Paper 모드에서 재발급 |
| `네트워크가 ... 나가지 못한다` | 키 문제가 아니다. 사내망·VPN·방화벽에서 `paper-api.alpaca.markets` 허용 필요 |
| `계좌 상태가 ACTIVE가 아니다` | Alpaca 대시보드에서 모의계좌 상태 확인 |
| `command not found: python` | 가상환경이 꺼져 있다. `source .venv/bin/activate` |

## 안전장치

이 폴더의 코드는 **조회만** 한다. 주문을 내는 함수 자체가 없다.

- `paper=True` 로 고정되어 있고, 이 값을 바꾸는 경로가 코드에 없다.
- 실계좌 주소(`api.alpaca.markets`, `broker-api.alpaca.markets`)는 코드 차원에서 거부된다
  (`live_url_is_refused` 테스트가 이걸 지킨다).
- 접속 주소 교체는 셀프테스트용 로컬 주소(`127.0.0.1`)만 허용된다.
- API 키는 화면·로그 어디에도 원본이 찍히지 않는다 (앞 4글자만 노출).
