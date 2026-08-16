# -*- coding: utf-8 -*-
"""두 사람의 지도 — 사업단장의 지도와 설계사의 지도, 그리고 둘이 만나는 자리."""
import sys
sys.stdout.reconfigure(encoding="utf8")

BOX_X, BOX_W, BOX_H, PITCH, TOP = 320, 604, 76, 94, 22
HUB = (16, 200, 200, 180)          # x, y, w, h
VB = (940, 580)


def mindmap(aria, hub_lines, branches, tone):
    """hub_lines: [윗줄, 아랫줄] · branches: [(아이콘, 이름, 화면들)] 여섯 개"""
    hx, hy, hw, hh = HUB
    hcx, hcy = hx + hw / 2, hy + hh / 2
    L = [f'    <svg viewBox="0 0 {VB[0]} {VB[1]}" role="img" aria-label="{aria}">']
    ys = [TOP + PITCH * i for i in range(len(branches))]

    for y in ys:                                    # 가지 — 허브에서 각 칸으로
        ty = y + BOX_H / 2
        L.append(f'      <path class="mp-ln" d="M{hx+hw} {hcy:.0f} '
                 f'C {hx+hw+52} {hcy:.0f}, {BOX_X-52} {ty:.0f}, {BOX_X} {ty:.0f}"/>')

    L.append(f'      <rect class="mp-hub {tone}" x="{hx}" y="{hy}" width="{hw}" height="{hh}" rx="20"/>')
    L.append(f'      <text class="mp-hi" x="{hcx:.0f}" y="{hcy-26:.0f}" text-anchor="middle">{hub_lines[0]}</text>')
    L.append(f'      <text class="mp-hn" x="{hcx:.0f}" y="{hcy+14:.0f}" text-anchor="middle">{hub_lines[1]}</text>')
    L.append(f'      <text class="mp-hs" x="{hcx:.0f}" y="{hcy+44:.0f}" text-anchor="middle">{hub_lines[2]}</text>')

    for (ic, name, tools), y in zip(branches, ys):
        L.append(f'      <rect class="mp-box" x="{BOX_X}" y="{y}" width="{BOX_W}" height="{BOX_H}" rx="15"/>')
        L.append(f'      <text x="{BOX_X+20}" y="{y+34}" style="font-size:21px">{ic}</text>')
        L.append(f'      <text class="mp-t" x="{BOX_X+56}" y="{y+33}">{name}</text>')
        L.append(f'      <text class="mp-s {tone}-s" x="{BOX_X+56}" y="{y+59}">{tools}</text>')
    L.append('    </svg>')
    return "\n".join(L)


MINE = mindmap(
    "사업단장의 지도 — 무기를 만들고 판을 세우고 사람을 키운다",
    ["내 지도", "사업단장", "만들고 · 보고 · 키운다"],
    [("🎣", "무기를 만든다", "미끼 레이더 — 약관 원문으로 근거를 판다"),
     ("⚙️", "판을 세운다", "처음 켤 때 · 설정 · 출발 점검 · 시스템 점검"),
     ("👀", "조직을 본다", "AI 조직 라이브 · 대표 브리핑 · 실행 체크판 · 출근 현황"),
     ("🌱", "사람을 키운다", "팀 코칭 · 윤시스쿨 · 승인·규칙 · 90일 로드맵"),
     ("🏢", "판을 넓힌다", "법인 컨설팅 · 광고·유입 · 콘텐츠 제작"),
     ("🤝", "나도 판다", "DB 통합 CRM · 상담카드 · 재무설계 계산기")],
    "mp-a")

THEIRS = mindmap(
    "설계사의 지도 — 열고 걸고 만나고 닫고 지키고 배운다",
    ["설계사 지도", "설계사", "열고 · 걸고 · 지킨다"],
    [("🌅", "아침에 연다", "TFA 업무관리 · 오늘의 알림 — 오늘 만날 사람과 걸 사람"),
     ("📞", "건다", "DB 통합 CRM · TA 맞춤 스크립트 — 15초, 화법은 화면이 든다"),
     ("🗣️", "만난다", "상담카드 · AI 보장분석 · 8통장 진단 · 재무설계 계산기"),
     ("📄", "닫는다", "계약관리 판단 · 비포&애프터 — 증권까지가 계약이다"),
     ("🛡️", "지킨다", "고객 365일 · 청구·사후관리 — 화면이 고른 사람만"),
     ("📚", "배운다", "재무설계 실전화법서 · 본인 점검란 · APEX 사용가이드")],
    "mp-b")

# ── 둘이 주고받는 네 가지
XCH = '''    <svg viewBox="0 0 940 420" role="img" aria-label="사업단장과 설계사가 서로 주고받는 네 가지">
      <defs>
        <marker id="xchR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path class="mp-hd1" d="M0 0 L10 5 L0 10 Z"/></marker>
        <marker id="xchL" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path class="mp-hd2" d="M0 0 L10 5 L0 10 Z"/></marker>
      </defs>
      <rect class="mp-hub mp-a" x="16" y="120" width="176" height="180" rx="20"/>
      <text class="mp-hn" x="104" y="200" text-anchor="middle">사업단장</text>
      <text class="mp-hs" x="104" y="230" text-anchor="middle">무기와 기준</text>

      <rect class="mp-hub mp-b" x="748" y="120" width="176" height="180" rx="20"/>
      <text class="mp-hn" x="836" y="200" text-anchor="middle">설계사</text>
      <text class="mp-hs" x="836" y="230" text-anchor="middle">기록과 결과</text>

      <line class="mp-x1" x1="200" y1="70" x2="740" y2="70" marker-end="url(#xchR)"/>
      <text class="mp-xl mp-xl1" x="470" y="56" text-anchor="middle">약관 근거와 이달의 컨셉 — 무엇을 들고 나갈지</text>

      <line class="mp-x1" x1="200" y1="146" x2="740" y2="146" marker-end="url(#xchR)"/>
      <text class="mp-xl mp-xl1" x="470" y="132" text-anchor="middle">90일 로드맵과 코칭 — 어떤 순서로 할지</text>

      <line class="mp-x2" x1="740" y1="284" x2="200" y2="284" marker-end="url(#xchL)"/>
      <text class="mp-xl mp-xl2" x="470" y="270" text-anchor="middle">통화 기록과 단계 — 조직 화면의 숫자가 된다</text>

      <line class="mp-x2" x1="740" y1="360" x2="200" y2="360" marker-end="url(#xchL)"/>
      <text class="mp-xl mp-xl2" x="470" y="346" text-anchor="middle">건의함 한 줄 — 다음 판에서 고쳐진다</text>

      <text class="mp-note" x="470" y="212" text-anchor="middle">두 지도는 CRM 에서 만납니다</text>
    </svg>'''

OUT = f'''  <h3>두 사람의 지도 — 나는 이렇게, 설계사는 이렇게</h3>
  <p>
    같은 앱인데 <b>여는 순서가 다릅니다.</b> 사업단장은 <b>만들고 보고 키우는</b> 쪽으로 돌고,
    설계사는 <b>열고 걸고 지키는</b> 쪽으로 돕니다. 둘을 겹쳐 놓으면
    「누가 무엇을 해야 하는가」가 한 장으로 보입니다.
  </p>

  <h4>내 지도 — 사업단장</h4>
  <p>
    내가 직접 계약을 하나 더 하는 것보다, <b>같은 방식으로 일하는 사람을 하나 더 만드는 것</b>이 큽니다.
    그래서 내 여섯 갈래는 대부분 <b>남이 쓸 것을 만드는 일</b>입니다.
  </p>
  <figure class="cyc-fig mp-fig">
{MINE}
    <figcaption>사업단장의 여섯 갈래 — <b>여섯 중 넷이 「남이 쓸 것을 만드는 일」</b>입니다.
    마지막 「나도 판다」를 빼면 리더의 말이 서지 않습니다.</figcaption>
  </figure>

  <h4>설계사 지도 — 오늘 하루</h4>
  <p>
    설계사의 여섯 갈래는 <b>하루 동선 그대로</b>입니다. 위에서 아래로 순서대로 돌면 하루가 끝납니다.
    <b>고를 것이 없게 만드는 것</b>이 이 지도의 목적입니다.
  </p>
  <figure class="cyc-fig mp-fig">
{THEIRS}
    <figcaption>설계사의 여섯 갈래 — 아침에 열고, 걸고, 만나고, 닫고, 지키고, 하루 한 장 배웁니다.
    <b>제1부 여덟 단계</b>가 이 여섯 갈래 안에서 돕니다.</figcaption>
  </figure>

  <h4>두 지도가 만나는 자리</h4>
  <p>
    지도가 둘이라고 따로 도는 것이 아닙니다. <b>네 가지를 주고받습니다.</b>
    이 네 줄이 끊기면 리더는 「왜 안 하지」 하고, 설계사는 「뭘 하라는 거지」 합니다.
  </p>
  <figure class="cyc-fig mp-fig">
{XCH}
    <figcaption>위 둘은 <b>리더가 주는 것</b>, 아래 둘은 <b>설계사가 올려 보내는 것</b>입니다.
    주고받는 자리가 전부 <b>CRM</b> 이라서, CRM 기록이 밀리면 네 줄이 한꺼번에 끊깁니다.</figcaption>
  </figure>

  <div class="scroll"><table>
    <thead><tr><th>주고받는 것</th><th>사업단장이 하는 일</th><th>설계사가 하는 일</th><th>끊기면</th></tr></thead>
    <tbody>
      <tr><td class="s">무기</td><td>미끼 레이더로 <b>약관 근거</b>를 뽑아 이달의 컨셉을 하나 정한다</td>
          <td>그 근거를 <b>고객 앞에서 원문으로</b> 보여 준다</td>
          <td class="k">저마다 다른 말을 해서 팀에 기준이 없어진다</td></tr>
      <tr><td class="s">순서</td><td>90일 로드맵과 코칭으로 <b>어떤 순서로</b> 할지 준다</td>
          <td>본인 점검란에서 <b>주차별 합격선</b>을 채운다</td>
          <td class="k">열심히는 하는데 늘지 않는다</td></tr>
      <tr><td class="s">숫자</td><td>조직 화면에서 <b>누가 어디서 막혔는지</b> 본다</td>
          <td>통화 기록과 단계를 <b>그날</b> 남긴다</td>
          <td class="k">리더가 감으로 코칭하게 된다</td></tr>
      <tr><td class="s">고칠 곳</td><td>올라온 한 줄을 <b>다음 판에서 고친다</b></td>
          <td>막히는 곳을 <b>건의함에 한 줄</b> 남긴다</td>
          <td class="k">같은 불편을 1년 동안 참는다</td></tr>
    </tbody>
  </table></div>

  <div class="card blue"><p class="card-h">리더가 자주 하는 착각</p>
  <p style="margin:0"><b>「시켰는데 안 한다」</b>의 대부분은 사람 문제가 아니라 <b>주는 것이 빠진 문제</b>입니다.
  위 표의 왼쪽 칸을 먼저 보십시오 — 무기를 안 줬는지, 순서를 안 줬는지.
  둘 다 줬는데 안 하면 그때가 <b>사람 이야기</b>를 할 자리입니다.</p></div>
'''

open("frag_maps.html", "w", encoding="utf8").write(OUT)
print(f"두 지도: {len(OUT.encode()):,} bytes")
