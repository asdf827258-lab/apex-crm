# 업무매뉴얼북 만드는 법

`index.html` 은 손으로 쓰지 않습니다. 두 걸음으로 다시 만듭니다.

## 1. 화면 찍기

```
export NODE_PATH=/opt/node22/lib/node_modules
export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
export SHOTDIR=/tmp/mshots && mkdir -p $SHOTDIR
node docs/manual/shoot.js
```

진짜 앱을 `scripts/check-airep.js` 의 시험 자료로 띄워 열여섯 장을 찍습니다.
검사와 같은 자료라 검사가 통과하면 이 그림도 그때 화면 그대로입니다.

## 2. 줄여서 책 만들기

PNG 를 1100px 폭 JPEG 로 줄여 `img/` 에 넣은 뒤:

```
MIMG=docs/manual/img OUT_REPO=docs/manual/index.html \
  python3 docs/manual/mkmanual.py /tmp/manual-share.html
```

- `docs/manual/index.html` — 사진은 옆 `img/` 폴더 (저장소·배포용)
- 인자로 준 경로 — 사진을 안에 넣은 한 장 (공유·인쇄·PDF용)

PDF 는 그 한 장짜리를 헤드리스 크로미움으로 인쇄합니다.

## 사용활용법과 무엇이 다른가

| | 담는 것 |
|---|---|
| `docs/guide` 사용활용법 | 앱 **전체** 안내 25장 — 무엇이 어디 있는지 |
| `docs/manual` 업무매뉴얼북 | **누가 · 언제 · 무엇을** 16장 — 설계사 / 지점장 / 영업 관리 |

글을 고치려면 `mkmanual.py` 맨 위 `BOOK` 배열만 고칩니다.
묶음 → (그림 이름, 언제, 제목, 누를 곳, 한 줄 설명, 볼 것 목록) 순서입니다.
