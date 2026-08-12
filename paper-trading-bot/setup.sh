#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# paper-trading-bot 설치·검증 — macOS / zsh 용
#
#   sh setup.sh
#
# 하는 일: ① 파이썬·alpaca-py 설치 여부 확인 → ② 없으면 가상환경 만들고 설치
#          → 검증 명령 실행 → ③ 모의계좌 잔고 조회까지
# 주문은 한 건도 넣지 않습니다. 실계좌 주소에는 접속하지 않습니다.
# ─────────────────────────────────────────────────────────────────────────
set -u

cd "$(dirname "$0")" || exit 1

line() { printf '%s\n' "────────────────────────────────────────────────────────"; }
step() { printf '\n\033[1m%s\033[0m\n' "$1"; line; }
ok()   { printf '  ✅ %s\n' "$1"; }
bad()  { printf '  ❌ %s\n' "$1"; }
info() { printf '     %s\n' "$1"; }

# ── ① 설치 여부 확인 ──────────────────────────────────────────────────
step "① 설치 여부 확인"

if ! command -v python3 >/dev/null 2>&1; then
  bad "python3 가 없습니다."
  info "해결: Xcode 개발자도구를 설치하세요 →  xcode-select --install"
  info "또는 https://www.python.org/downloads/macos/ 에서 3.10 이상 설치"
  exit 1
fi

PYV=$(python3 -c 'import sys; print("%d.%d"%sys.version_info[:2])')
printf '  $ python3 --version → %s (%s)\n' "$(python3 --version 2>&1)" "$(command -v python3)"

if ! python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)'; then
  bad "Python $PYV 입니다. 3.10 이상이 필요합니다."
  info "해결: brew install python@3.12   (또는 python.org 설치본)"
  exit 1
fi
ok "Python $PYV — 요구사항(3.10+) 충족"

printf '  $ pip show alpaca-py → '
if pip show alpaca-py >/dev/null 2>&1; then
  printf '이미 설치됨 (시스템 전역)\n'
else
  printf '없음 → 아래에서 가상환경에 설치합니다\n'
fi

# ── ② 가상환경 + 설치 ─────────────────────────────────────────────────
step "② 가상환경 만들고 설치"

if [ -d .venv ]; then
  ok ".venv 가 이미 있습니다 (재사용)"
else
  printf '  $ python3 -m venv .venv\n'
  if ! python3 -m venv .venv; then
    bad "가상환경 생성 실패."
    info "해결: python3 -m ensurepip --upgrade  실행 후 다시 시도"
    exit 1
  fi
  ok ".venv 생성 완료"
fi

PY=.venv/bin/python
"$PY" -m pip install --quiet --upgrade pip >/dev/null 2>&1

printf '  $ pip install alpaca-py python-dotenv\n'
if ! "$PY" -m pip install --quiet alpaca-py python-dotenv; then
  bad "설치 실패."
  info "해결: .venv/bin/python -m pip install alpaca-py python-dotenv"
  info "      (위 명령을 -quiet 없이 돌려 전체 오류를 확인하세요)"
  exit 1
fi
"$PY" -m pip install --quiet pytest >/dev/null 2>&1   # 테스트용 (선택)
ok "alpaca-py $("$PY" -m pip show alpaca-py | awk '/^Version:/{print $2}') · python-dotenv $("$PY" -m pip show python-dotenv | awk '/^Version:/{print $2}')"

# ── 검증 1단계 ────────────────────────────────────────────────────────
step "검증 1 — import alpaca"
printf '  $ python -c "import alpaca; print(alpaca.__version__)"\n'
if VER=$("$PY" -c 'import alpaca; print(alpaca.__version__)' 2>&1); then
  ok "출력: $VER"
else
  bad "import 실패: $VER"
  exit 1
fi

# ── 안전장치 테스트 (인터넷 불필요) ───────────────────────────────────
if [ -f test_safety.py ]; then
  step "안전장치 테스트 (오프라인)"
  "$PY" -m pytest -q 2>&1 | tail -3
fi

# ── ③ 모의계좌 잔고 조회 ──────────────────────────────────────────────
step "③ 모의계좌 잔고 조회"

if [ ! -f .env ]; then
  bad ".env 파일이 없습니다. 여기까지가 자동으로 되는 마지막입니다."
  info ""
  info "다음 조치 (2분):"
  info "  1) cp .env.example .env"
  info "  2) https://app.alpaca.markets 로그인 → 우측 상단을 'Paper' 로 전환"
  info "  3) Generate New Key → 나온 두 값을 .env 에 붙여넣기"
  info "  4) sh setup.sh  다시 실행"
  exit 1
fi

"$PY" check_account.py
