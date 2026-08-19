# -*- coding: utf-8 -*-
"""상담 약속을 폰 캘린더로 — 알람은 우리가 만들지 않고 폰에 맡긴다.

  .ics 는 규격이 까다롭다. 틀리면 「열 수 없는 파일」이 되고 아무 말도 안 해 준다.
  · 줄 끝은 반드시 CRLF
  · 한 줄 75옥텟을 넘기면 접어야 한다(다음 줄 앞에 공백 한 칸)
  · 쉼표 · 세미콜론 · 역슬래시 · 줄바꿈은 이스케이프
  · 시각은 UTC(Z) 로 적고 폰이 제 시간대로 바꿔 보여 준다
"""
import sys
from datetime import datetime, timedelta, timezone
sys.stdout.reconfigure(encoding="utf8")
KST = timezone(timedelta(hours=9))


def esc(t):
    return (t.replace("\\", "\\\\").replace(";", "\;")
             .replace(",", "\\,").replace("\n", "\\n"))


def fold(line):
    """75옥텟마다 접는다 — 한글은 3바이트라 글자 수로 세면 안 된다"""
    b = line.encode("utf8")
    if len(b) <= 75:
        return line
    out, cur = [], b""
    for ch in line:
        e = ch.encode("utf8")
        if len(cur) + len(e) > (75 if not out else 74):
            out.append(cur.decode("utf8")); cur = b""
        cur += e
    if cur:
        out.append(cur.decode("utf8"))
    return "\r\n ".join(out)


def utc(dt):
    return dt.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def event(uid, start, minutes, title, place, note, alarms):
    L = ["BEGIN:VEVENT",
         f"UID:{uid}@apex-yunpro",
         f"DTSTAMP:{utc(datetime.now(KST))}",
         f"DTSTART:{utc(start)}",
         f"DTEND:{utc(start + timedelta(minutes=minutes))}",
         f"SUMMARY:{esc(title)}"]
    if place:
        L.append(f"LOCATION:{esc(place)}")
    if note:
        L.append(f"DESCRIPTION:{esc(note)}")
    for mins, msg in alarms:
        L += ["BEGIN:VALARM", "ACTION:DISPLAY",
              f"DESCRIPTION:{esc(msg)}",
              f"TRIGGER:-PT{mins}M", "END:VALARM"]
    L.append("END:VEVENT")
    return L


def build(events):
    L = ["BEGIN:VCALENDAR", "VERSION:2.0",
         "PRODID:-//APEX YUN PRO//상담 약속//KO",
         "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
         "X-WR-CALNAME:APEX 상담 약속", "X-WR-TIMEZONE:Asia/Seoul"]
    for e in events:
        L += e
    L.append("END:VCALENDAR")
    return "\r\n".join(fold(x) for x in L) + "\r\n"


# ── 견본 — 이름은 전부 가짜입니다 ────────────────────────────────
base = datetime.now(KST).replace(hour=11, minute=0, second=0, microsecond=0)
d1 = base + timedelta(days=1)
d2 = base + timedelta(days=3, hours=4)

ics = build([
 event("apex-demo-1", d1, 60,
       "홍길동 님 상담 — 보장분석",
       "서울 강남",
       "지난번 어머님 수술 말씀하셨음. 안부 먼저.\n"
       "보장분석 상담자료 → 기·승·전결 순서로.\n"
       "끝나고 30초: 「TA 결과 기록」에 결과·메모·다음 약속.",
       [(1440, "내일 11시 홍길동 님 상담 — 오늘 저녁에 자료 준비"),
        (60, "1시간 뒤 홍길동 님 상담 — 지난 상담 기록 한 번 읽기")]),
 event("apex-demo-2", d2, 60,
       "김철수 님 상담 — 재무설계",
       "성남 분당",
       "보장 이야기는 지난번에 끝. 오늘은 돈 이야기.\n"
       "재무설계 상담자료 여덟 칸을 미리 채워 둘 것.",
       [(1440, "내일 15시 김철수 님 상담 — 계산기 미리 열어 보기"),
        (60, "1시간 뒤 김철수 님 상담")]),
])
open("APEX-상담약속-견본.ics", "w", encoding="utf8", newline="").write(ics)
b = ics.encode("utf8")
print(f"APEX-상담약속-견본.ics · {len(b)} bytes · 줄 {ics.count(chr(13)+chr(10))}")
print(f"  일정 {ics.count('BEGIN:VEVENT')}건 · 알람 {ics.count('BEGIN:VALARM')}개")
over = [l for l in ics.split("\r\n") if len(l.encode()) > 75]
print(f"  75옥텟 넘는 줄: {len(over)}개 {'(접기 실패)' if over else '— 없음'}")
print("\n" + ics.replace("\r\n", "\n")[:520])
