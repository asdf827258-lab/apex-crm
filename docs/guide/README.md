# 사용활용법 만드는 법

`index.html` 은 손으로 쓰지 않습니다. 아래 두 걸음으로 다시 만듭니다.

## 1. 화면 찍기

```
export NODE_PATH=/opt/node22/lib/node_modules
export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
export SHOTDIR=/tmp/shots && mkdir -p $SHOTDIR
node docs/guide/shoot.js
```

진짜 앱(`app/index.html`)을 시험용 자료로 띄워 스물세 장을 찍습니다.
자료는 `scripts/check-airep.js` 안의 `STUB` 을 그대로 씁니다 — 검사와 같은 자료라
검사가 통과하면 이 그림도 그때 화면 그대로입니다.

아침 비서 팝업과 오전 8시 자동 보고는 화면을 가리므로 찍을 때만 꺼 둡니다
(`apex_ar_brief_off` · `apex_ar_auto_off`).

캐러셀 세 장은 화면을 찍은 것이 아니라 **실제로 내려받는 1080×1350 결과물**입니다.
`cnDrawSlide()` 를 직접 불러 캔버스를 그대로 저장합니다.

## 2. 줄여서 페이지 만들기

PNG 를 1120px 폭 JPEG 로 줄여 `img/` 에 넣은 뒤:

```
python3 docs/guide/mkguide.py /tmp/guide-share.html
```

- `docs/guide/index.html` — 사진은 옆 `img/` 폴더를 봅니다 (저장소·배포용)
- 두 번째 인자로 준 경로 — 사진을 안에 넣은 한 장짜리 (공유·인쇄용)

글을 고치려면 `mkguide.py` 맨 위 `S` 배열만 고치면 됩니다.
묶음 → 단계 → (그림 이름, 제목, 누를 곳, 한 줄 설명, 볼 것 목록) 순서입니다.
