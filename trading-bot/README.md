# Alpaca 모의계좌 연결 확인 (macOS / zsh)

자동매매 봇을 만들기 전, **모의계좌에 접속해서 잔고를 읽어오는 것까지만** 확인하는 단계다.
주문 기능은 들어 있지 않다.

## 1. 파이썬 확인

```zsh
python3 --version      # 3.10 이상이면 OK
pip show alpaca-py     # "Package(s) not found" 가 나오면 아직 설치 안 된 것
```

`python3` 가 없다면 먼저 설치한다:

```zsh
brew install python@3.11
```

## 2. 가상환경 만들고 설치

가상환경(venv)은 이 프로젝트에서 쓰는 라이브러리를 다른 프로젝트와 섞이지 않게 담아두는 상자다.

```zsh
cd trading-bot
python3 -m venv .venv
source .venv/bin/activate          # 프롬프트 앞에 (.venv) 가 붙으면 성공
pip install -r requirements.txt    # alpaca-py, python-dotenv
```

설치 확인:

```zsh
python -c "import alpaca; print(alpaca.__version__)"
```

> 다음에 다시 작업할 때는 `source .venv/bin/activate` 만 하면 된다. 끝낼 때는 `deactivate`.

## 3. 모의계좌 키 넣기

Alpaca 대시보드에서 **Paper Trading(모의계좌) 모드로 전환한 상태**에서 키를 발급받는다.
→ <https://app.alpaca.markets/paper/dashboard/overview> 의 우측 **API Keys → Generate**

시크릿은 발급 순간 한 번만 보인다. 놓쳤으면 재발급하면 된다.

```zsh
cp .env.example .env
# .env 를 열어 ALPACA_API_KEY / ALPACA_SECRET_KEY 두 줄을 채운다
```

`.env` 는 `.gitignore` 에 걸려 있어 깃에 올라가지 않는다. 키를 코드에 직접 적지 말 것.

## 4. 연결 확인

```zsh
python check_account.py
```

성공하면 이런 모양이 나온다 (숫자는 계좌마다 다름):

```
계좌 상태     : ACTIVE
현금          : 100000
매수 가능 금액: 200000
[성공] 모의계좌 연결과 잔고 조회까지 정상이다. 주문은 한 건도 넣지 않았다.
```

**계좌 상태가 `ACTIVE` 로 나오면 이 단계는 끝난 것이다.**

## 막히면

| 증상 | 원인과 조치 |
| --- | --- |
| `.env에서 다음 값을 찾지 못했다` | `.env` 를 안 만들었거나 변수 이름 오타. `cp .env.example .env` 부터 다시 |
| `401 unauthorized` | 실계좌용 키를 발급받았을 가능성이 높다. Paper 모드에서 재발급 |
| `403` / 연결 자체가 안 됨 | 네트워크가 `paper-api.alpaca.markets` 로 못 나가는 상태. 사내망·VPN·방화벽 확인 |
| `command not found: python` | 가상환경이 꺼져 있다. `source .venv/bin/activate` |

## 안전장치

- `check_account.py` 는 `paper=True` 로 고정되어 있다. 이 값이 모의계좌 주소로 보내주는 스위치이므로 건드리지 않는다.
- 실계좌 주소(`api.alpaca.markets`)는 이 폴더 어디에서도 쓰지 않는다.
- 주문 관련 코드는 아직 없다.
