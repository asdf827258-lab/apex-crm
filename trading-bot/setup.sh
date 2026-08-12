#!/usr/bin/env bash
# 가상환경 생성 → 라이브러리 설치 → 코드 검증까지 한 번에 한다.
# 실행:  ./setup.sh
set -euo pipefail

cd "$(dirname "$0")"

echo "==> 1/4  파이썬 확인"
if ! command -v python3 >/dev/null 2>&1; then
  echo "[실패] python3 가 없다. 먼저 설치해라:  brew install python@3.11"
  exit 1
fi

python3 - <<'PY'
import sys
major, minor = sys.version_info[:2]
print(f"     Python {major}.{minor}.{sys.version_info[2]}")
if (major, minor) < (3, 10):
    print(f"[실패] Python 3.10 이상이 필요하다. 현재 {major}.{minor}")
    print("       brew install python@3.11 로 설치한 뒤 다시 실행해라.")
    sys.exit(1)
PY

echo "==> 2/4  가상환경 준비 (.venv)"
if [ ! -d .venv ]; then
  python3 -m venv .venv
  echo "     새로 만들었다."
else
  echo "     이미 있어서 그대로 쓴다."
fi

echo "==> 3/4  라이브러리 설치"
./.venv/bin/pip install --quiet --upgrade pip
./.venv/bin/pip install --quiet -r requirements.txt
echo -n "     alpaca-py 버전: "
./.venv/bin/python -c "import alpaca; print(alpaca.__version__)"

echo "==> 4/4  코드 검증 (실제 접속 없이 셀프테스트)"
./.venv/bin/python selftest.py

echo
echo "설치 완료. 이제 실제 모의계좌에 붙어보면 된다:"
if [ ! -f .env ]; then
  echo "  1) cp .env.example .env       # 그리고 모의계좌 키 2줄을 채운다"
else
  echo "  1) .env 는 이미 있다. 키가 채워져 있는지 확인해라."
fi
echo "  2) source .venv/bin/activate"
echo "  3) python check_account.py    # 계좌 상태가 ACTIVE 로 나오면 끝"
