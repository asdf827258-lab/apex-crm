# -*- coding: utf-8 -*-
"""9차 — 화면 안쪽 칸 이름까지 정확히. (TFA 업무관리 열 칸 · 홈 배너)"""
import re, sys
sys.stdout.reconfigure(encoding="utf8")
S = open("book-final.html", encoding="utf8").read()
LOG = []


def subn(old, new, tag, n=1):
    global S
    c = S.count(old)
    assert c == n, f"[{tag}] {n}건 기대, 실제 {c}건 — {old[:70]!r}"
    S = S.replace(old, new)
    LOG.append(f"  ✓ {tag} ({n})")


# TFA 업무관리 왼쪽 열 칸 — 화면에 찍힌 이름 그대로
TEN = ("피드백 · 스케줄 관리 · 본인 역량 체크 · 해야 할 일 · 내 업적 · 월간보고 · "
       "내 코칭 · 본인 점검란 · 오늘 터치할 사람 · 리더 할 일 · 팀원 관리")

subn('<b>피드백 · 스케줄 · 역량 체크 · 해야 할 일 · 업적 · 내 코칭 · 본인 점검란 · '
     '오늘 터치할 사람 · 리더 할 일 · 팀원 관리</b> 열 칸이 왼',
     f'<b>{TEN}</b> 열 칸이 왼', "TFA 열 칸 · 6부")

subn('열 칸짜리 종합 관리 — 피드백·스케줄·역량 체크·해야 할 일·업적/월간보고·내 코칭·'
     '본인 점검란·오늘 터치할 사람·리더 할 일·팀원 관리.',
     f'열 칸짜리 종합 관리 — {TEN}.', "TFA 열 칸 · 도구 백과")

subn('TFA 업무관리에서 이번 달 업적을 확인합니다.',
     'TFA 업무관리 → <b>「내 업적 · 월간보고」</b>를 확인합니다.', "내 업적 · 월간보고")

# 홈 배너 안의 단추 이름을 칩에도 그대로
subn('<span class="chip">홈 배너 🔑</span>',
     '<span class="chip">홈 배너 「🔑 열쇠 넣기」</span>', "홈 배너 칩")

open("book-final.html", "w", encoding="utf8").write(S)
print("\n".join(LOG)); print(f"\n{len(S.encode()):,} bytes")
