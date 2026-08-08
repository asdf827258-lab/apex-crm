# 쉬운 사용설명서 만들기

인쇄해서 쓰는 27쪽짜리 사용설명서를 이 폴더에서 다시 만듭니다.
표를 쓰지 않고, 한 쪽에 한 가지만, 화면 사진에 ①②③ 번호를 붙이는 방식입니다.

## 순서

```bash
export NODE_PATH=/opt/node22/lib/node_modules   # 이 환경에서만 필요
mkdir -p docs/ebook/shots
node docs/ebook/shots.js docs/ebook/shots   # 화면 사진 15장 (저장소 최상단에서 실행)
python3 docs/ebook/easy.py   # 사진을 박아 넣은 easy.html
node docs/ebook/pdf2.js      # easy.html → APEX-쉬운사용설명서.pdf
```

`shots.js` 는 앱을 띄우고 가짜 팀원 다섯 명·고객 넷을 심은 뒤 화면을 찍습니다.
사진 파일은 용량이 커서 저장소에 넣지 않습니다 — 필요할 때 다시 찍으면 됩니다.

## 파일

| 파일 | 하는 일 |
|---|---|
| `dump.js` | 앱에서 메뉴·체크 항목·명령 목록을 뽑아 `app.json` 으로 저장 |
| `shots.js` | 화면 사진 15장 촬영 |
| `easy.py` | 27쪽 HTML 조립 (쪽 번호·차례 자동) |
| `pdf2.js` | A4 PDF 로 출력 |

## 고칠 때

- 쪽을 더하려면 `easy.py` 에서 `page(내용, '장 이름')` 를 호출합니다.
- 차례의 쪽 번호는 장 이름을 보고 **자동으로** 다시 매겨집니다. 손으로 고치지 마세요.
- 사진에 번호를 붙이려면 `shot('파일이름', [(위에서 %, 왼쪽에서 %, 번호), ...])` 를 씁니다.
