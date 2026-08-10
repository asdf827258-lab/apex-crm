# -*- coding: utf-8 -*-
"""업무매뉴얼북 — 팀원 · 지점장 · 영업 관리를 실제 화면으로.
   사용활용법(전체 안내)과 달리 이건 「누가 · 언제 · 무엇을」 만 짧게 담는다."""
import base64, io, os, sys

IMG = os.environ.get('MIMG', 'mimg')

BOOK = [
 ('team', '설계사', '팀원이 매일 하는 것',
  '아침 10분 · 낮에 전화 · 저녁 5분. 이 여섯 화면이면 하루가 굴러갑니다.', [

  ('m01-sched', '아침', '내 스케줄을 본다', 'TFA 업무관리 › 스케줄 관리',
   '오늘 잡힌 약속과 고객 할 일이 날짜순으로 섭니다. 이번 주까지 한눈에 보입니다.',
   ['약속이 있는 날은 진하게 표시됩니다. 전날 자료를 준비하라고 알려 줍니다.',
    '고객 365일에 적어 둔 「다음 할 일」 이 그 날짜에 여기로 올라옵니다.']),

  ('m02-todo', '아침', '밀린 것부터 본다', 'TFA 업무관리 › 해야 할 일',
   '기한이 지난 것이 맨 위입니다. 위에서부터 지우면 됩니다.',
   ['붉은 것은 기한이 지난 것입니다. 오늘 안에 정리하십시오.',
    '체크판에서 아직 안 누른 항목도 여기 같이 뜹니다.']),

  ('m03-touch', '낮', '오늘 전화할 사람을 본다', 'TFA 업무관리 › 오늘 터치할 사람',
   '부재 · 거절 · 진행중 · 기고객 · 생일이 한 줄로 섭니다. 오른쪽에 무엇을 할지 적혀 있습니다.',
   ['「부재 6건」 이 아니라 「고객12 · 12일째 · 문자 먼저 남기고 걸기」 로 나옵니다.',
    '위 네 칸이 오늘 순서입니다 — 진행중이 제일 위입니다.',
    '거절한 손님에게는 팔지 않습니다. 소식 하나만 보내라고 나옵니다.']),

  ('m04-feed', '저녁', 'AI 보고를 받는다', 'TFA 업무관리 › 피드백',
   '활동 보고 · 활동 격려 · 공부할 부분 · 상담 컨셉 · 다음 7일 다섯 칸입니다.',
   ['「상담 컨셉」 은 다음 상담에서 그대로 읽으라고 만든 문장입니다.',
    '숫자는 지어내지 않습니다. 실제로 남긴 기록만 씁니다.',
    '오전 8시가 지났으면 이미 만들어져 있습니다.']),

  ('m05-score', '주 1회', '내 점수를 본다', 'TFA 업무관리 › 본인 점수판',
   '출근 · 실행 · 활동 · 고객 · 자료 · 공부 여섯 축을 팀과 나란히 봅니다.',
   ['빨간 막대가 처진 축입니다. 거기부터 손대면 가장 빨리 올라갑니다.',
    '따로 입력할 것이 없습니다. 매일 저절로 다시 계산됩니다.']),

  ('m06-acad', '주 1회', '스스로 점검한다', 'TFA 업무관리 › 본인 점검란',
   '주차별로 무엇을 익혔는지 본인이 체크합니다.',
   ['남이 매기는 점수가 아닙니다. 본인이 아는 것과 모르는 것을 가르는 칸입니다.',
    '여기서 체크한 것이 성장판의 「공부」 축이 됩니다.']),
 ]),

 ('lead', '지점장', '팀을 챙기는 것',
  '아침 20분 · 오후 10분. 사람을 보는 곳은 TFA 업무관리 하나입니다.', [

  ('m07-lead', '아침 20분', '오늘 할 일을 훑는다', 'TFA 업무관리 › 리더 할 일',
   '아침 · 오전 · 오후 · 마감 네 묶음입니다. 줄을 누르면 체크됩니다.',
   ['오른쪽 단추를 누르면 그 일을 하는 화면으로 바로 넘어갑니다.',
    '줄을 누르면 체크, 단추를 누르면 이동 — 따로 눌립니다.',
    '맨 아래 「하지 않는 것」 네 줄을 아침마다 한 번 읽으십시오.']),

  ('m08-team', '아침', '팀 전체를 편다', 'TFA 업무관리 › 팀원 관리',
   '팀별로 묶여 나오고 점수가 낮은 사람이 위에 옵니다.',
   ['위쪽 칩으로 팀을 고릅니다. 지점장은 자기 팀이 먼저 열립니다.',
    '접힌 줄에도 🔥3 📵6 이 붙어 펼치지 않고도 누가 급한지 보입니다.',
    '「전원 보고 한 번에 받기」 로 팀원 전부의 AI 보고를 한 번에 만듭니다.']),

  ('m09-member', '아침', '한 사람을 펼친다', 'TFA 업무관리 › 팀원 관리 › 이름',
   '이름 하나 누르면 그 사람에 대해 앱이 아는 것이 전부 나옵니다.',
   ['여섯 축 · 종합 점수 · 통화 · 상담 · 안 돌린 DB · 기한 지난 할 일',
    '팀 평균과 견준 막대 — 본인은 평균에서 빼고 계산합니다',
    '「오늘 이 사람을 어떻게 챙길까」 — 무엇이 보이는지와 뭐라고 물을지가 짝으로',
    '최근 30일 전화 습관 · 주차별 통화 · 오늘 터치할 사람 · AI 보고 다섯 칸']),

  ('m10-memo', '면담 뒤', '코칭 메모를 남긴다', '팀원 관리 › 이름 › ✏️ 코칭 메모 남기기',
   '강점 · 막힌 곳 · 오늘 정한 일 · 다시 볼 날을 그 자리에서 적습니다.',
   ['화면을 벗어나지 않습니다. 보던 숫자가 그대로 있습니다.',
    '「다시 볼 날」 을 넣으면 그날 「어떻게 챙길까」 맨 위에 올라옵니다.',
    '적어 둔 것은 팀 코칭 화면에도 같이 쌓입니다.']),

  ('m11-touch-team', '아침 회의', '팀 전체가 할 전화를 본다', '오늘 터치할 사람 › 👥 팀 전체',
   '줄마다 담당자 이름이 앞에 붙습니다. 이 화면을 띄우고 위에서부터 읽으면 됩니다.',
   ['설계사에게는 이 단추가 안 뜹니다 — 자기 것만 봅니다.',
    '대표 계정에 배정 DB 가 없어 0 으로 보이던 것이 이걸로 풀립니다.']),

  ('m16-daily', '아침 회의', '팀에 무슨 말을 할지 받는다', '윤시스쿨 › 매일 취합',
   '어제 숫자 · 오늘 꺼낼 소식 · 오늘 볼 것 · 팀에 전할 말 · 이번 주 방향.',
   ['「팀에 전할 말」 은 회의에서 그대로 읽으라고 만든 세 줄입니다.',
    '맨 아래 「내가 정한 것」 에 적어 두면 다음 날 그걸 참고해서 씁니다.']),
 ]),

 ('sales', '영업 관리', '고객이 쌓이는 곳',
  '여기에 남긴 것만 위의 모든 숫자가 됩니다. 안 남기면 아무것도 안 잡힙니다.', [

  ('m12-crm', '통화 직후', 'DB 를 돌리고 남긴다', 'DB CRM › DB 통합 CRM',
   '통화 결과를 부재 · 거절 · 상담 셋 중 하나로 남깁니다. 이 셋이 모든 계산의 바탕입니다.',
   ['상담으로 남기고 약속 날짜를 넣으면 「오늘 터치할 사람」 맨 위로 올라옵니다.',
    '여기 안 남기면 AI 보고에도 점수에도 안 잡힙니다.',
    '통화하고 바로 남기는 것이 이 앱에서 가장 중요한 습관입니다.']),

  ('m13-crmai', '주 1회', '내 전화 습관을 본다', 'DB 통합 CRM › 🧠',
   '전화한 날 · 하루 평균 · 전환율 · 다시 건 비율 · 재통화 간격이 칩으로 뜹니다.',
   ['「AI 에게 물어보기」 를 누르면 지금 습관 / 오늘 바꿀 것 하나 / 이번 주 목표로 답합니다.',
    '이 숫자는 지점장이 팀원 관리에서 보는 것과 같습니다.']),

  ('m14-clients', '계약 뒤', '고객을 1년 붙잡는다', '고객 › 고객 365일',
   '다음에 할 일과 날짜를 적어 둡니다.',
   ['적어 두면 그 날짜에 「오늘 터치할 사람」 에 저절로 뜹니다.',
    '생일을 넣으면 일주일 전부터 D-N 으로 알려 줍니다.',
    '고객 실명은 이 기기에만 남습니다. 서버에는 김○○ 로만 올라갑니다.']),

  ('m15-check', '하루 두 번', '체크판을 채운다', 'TEAM 총괄 › 실행 체크판',
   '오늘 · 이번 주 · 업무 루트를 순서대로 체크합니다.',
   ['누르는 즉시 저장됩니다. 저장 단추가 없습니다.',
    '여기 체크가 성장판의 「실행」 축이 됩니다.',
    '월요일이 되면 「이번 주」 는 저절로 새로 시작합니다.']),
 ]),
]


def esc(t):
    return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def build(inline):
    n = 0
    nav, body = [], []
    for key, who, title, lead, steps in BOOK:
        nav.append('<a class="jump" href="#s-%s">%s</a>' % (key, esc(who)))
        rows = []
        for name, when, head, path, sub, bullets in steps:
            n += 1
            if inline:
                with open(os.path.join(IMG, name + '.jpg'), 'rb') as fh:
                    src = 'data:image/jpeg;base64,' + base64.b64encode(fh.read()).decode('ascii')
            else:
                src = 'img/' + name + '.jpg'
            rows.append(
              '<article class="step">'
              '<div class="marker"><span class="num">%02d</span><span class="when">%s</span></div>'
              '<div class="content">'
              '<h3>%s</h3><p class="path">%s</p><p class="sub">%s</p>'
              '<figure class="shot"><img src="%s" alt="%s" loading="lazy" decoding="async"></figure>'
              '<ul class="pts">%s</ul></div></article>'
              % (n, esc(when), esc(head), esc(path), esc(sub), src, esc(head),
                 ''.join('<li>%s</li>' % esc(b) for b in bullets)))
        body.append(
          '<section class="sec" id="s-%s"><header class="sechd">'
          '<p class="who">%s</p><h2>%s</h2><p class="lead">%s</p></header>%s</section>'
          % (key, esc(who), esc(title), esc(lead), ''.join(rows)))

    return (TPL.replace('{{NAV}}', ''.join(nav))
               .replace('{{BODY}}', ''.join(body))
               .replace('{{N}}', str(n)))


TPL = u'''<title>APEX YUN PRO 업무매뉴얼북</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{
  --ground:#F2F5F9; --surface:#FFFFFF; --sunk:#E8EDF4;
  --ink:#0A1A2C; --body:#31465E; --muted:#5A6D85; --line:#D7E0EA;
  --accent:#0F766E; --accent-soft:#E3F5F2; --deep:#0B2447;
  --shadow:0 1px 2px rgba(10,26,44,.06),0 10px 28px -12px rgba(10,26,44,.2);
  --sans:"Pretendard","Pretendard Variable",-apple-system,BlinkMacSystemFont,
         "Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;
  --mono:ui-monospace,"SF Mono","Cascadia Mono","Consolas","Noto Sans Mono",monospace;
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --ground:#091119; --surface:#121E29; --sunk:#0D1822;
    --ink:#E8EFF6; --body:#BAC9D8; --muted:#8A9DB2; --line:#22333F;
    --accent:#5BC7B8; --accent-soft:#12292A; --deep:#BFD9FF;
    --shadow:0 1px 2px rgba(0,0,0,.4),0 12px 30px -14px rgba(0,0,0,.66);
  }
}
:root[data-theme="dark"]{
  --ground:#091119; --surface:#121E29; --sunk:#0D1822;
  --ink:#E8EFF6; --body:#BAC9D8; --muted:#8A9DB2; --line:#22333F;
  --accent:#5BC7B8; --accent-soft:#12292A; --deep:#BFD9FF;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 12px 30px -14px rgba(0,0,0,.66);
}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--body);
  font-family:var(--sans);font-size:16px;line-height:1.75;
  word-break:keep-all;overflow-wrap:break-word;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px 88px}

header.top{padding:64px 0 30px}
.eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;
  color:var(--accent);margin:0 0 13px;font-weight:600}
h1{font-size:clamp(32px,5.4vw,50px);line-height:1.15;letter-spacing:-.025em;
  font-weight:800;color:var(--ink);margin:0 0 16px;text-wrap:balance}
.lead0{font-size:18px;line-height:1.7;color:var(--body);margin:0 0 22px;max-width:620px}
.note{display:flex;gap:11px;align-items:flex-start;max-width:680px;background:var(--accent-soft);
  border:1px solid color-mix(in srgb,var(--accent) 30%,transparent);
  border-radius:12px;padding:14px 16px;font-size:14px;line-height:1.65;color:var(--ink)}
.note b{color:var(--accent)}

nav.jumps{position:sticky;top:0;z-index:20;display:flex;flex-wrap:wrap;gap:8px;padding:13px 0;
  background:color-mix(in srgb,var(--ground) 90%,transparent);
  backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.jump{font-size:13.5px;font-weight:700;color:var(--muted);text-decoration:none;padding:6px 14px;
  border:1px solid var(--line);border-radius:999px;background:var(--surface);transition:.15s}
.jump:hover,.jump:focus-visible{color:var(--accent);border-color:var(--accent)}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

.sec{padding-top:52px;scroll-margin-top:72px}
.sechd{max-width:720px;padding-bottom:6px}
.who{display:inline-block;font-family:var(--mono);font-size:11px;font-weight:700;letter-spacing:.1em;
  color:var(--accent);background:var(--accent-soft);padding:4px 11px;border-radius:999px;margin:0 0 10px}
.sechd h2{font-size:clamp(23px,3.2vw,30px);line-height:1.3;letter-spacing:-.02em;
  font-weight:800;color:var(--ink);margin:0 0 6px}
.sechd .lead{margin:0;color:var(--muted);font-size:15.5px}

.step{display:grid;grid-template-columns:78px minmax(0,1fr);gap:0 20px;
  padding:32px 0;border-top:1px solid var(--line)}
.marker{padding-top:4px;display:flex;flex-direction:column;gap:5px}
.num{font-family:var(--mono);font-size:13px;font-weight:600;color:var(--accent)}
.when{font-size:10.5px;font-weight:800;color:var(--muted);background:var(--sunk);
  border-radius:6px;padding:2px 7px;display:inline-block;width:fit-content}
.content{min-width:0}
.content h3{font-size:20.5px;line-height:1.4;letter-spacing:-.015em;font-weight:800;
  color:var(--ink);margin:0 0 8px;text-wrap:balance}
.path{display:inline-block;font-family:var(--mono);font-size:12px;color:var(--accent);
  background:var(--accent-soft);padding:5px 11px;border-radius:7px;margin:0 0 13px}
.sub{margin:0 0 16px;font-size:16px;line-height:1.72;color:var(--body);max-width:640px}
figure.shot{margin:0 0 16px;border:1px solid var(--line);border-radius:13px;overflow:hidden;
  background:var(--sunk);box-shadow:var(--shadow);max-width:960px}
figure.shot img{display:block;width:100%;height:auto}
ul.pts{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px;max-width:660px}
ul.pts li{position:relative;padding-left:18px;font-size:15px;line-height:1.7}
ul.pts li::before{content:"";position:absolute;left:2px;top:.72em;width:6px;height:6px;
  border-radius:50%;background:var(--accent);opacity:.55}

footer{margin-top:64px;padding-top:26px;border-top:1px solid var(--line);
  font-size:13.5px;line-height:1.75;color:var(--muted);max-width:720px}
footer strong{color:var(--ink)}
@media (max-width:720px){
  .wrap{padding:0 18px 64px} header.top{padding:44px 0 24px}
  .step{grid-template-columns:1fr;gap:0}
  .marker{flex-direction:row;align-items:center;gap:9px;padding:0 0 7px}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>

<div class="wrap">
<header class="top">
  <p class="eyebrow">APEX YUN PRO</p>
  <h1>업무매뉴얼북</h1>
  <p class="lead0">설계사 · 지점장 · 영업 관리 — 실제 화면 {{N}} 장으로 「누가 · 언제 · 무엇을」 만 담았습니다.</p>
  <p class="note"><span>📌</span><span><b>순서는 하루 순서입니다.</b>
     위에서부터 그대로 따라 하시면 됩니다. 화면 속 사람 이름과 고객 이름은
     <b>실제 정보가 아닙니다</b> — 시험용으로 지어낸 것입니다.</span></p>
</header>

<nav class="jumps">{{NAV}}</nav>
{{BODY}}

<footer>
  <p><strong>매일 여는 곳은 둘입니다.</strong> 설계사는 <strong>TFA 업무관리</strong>,
     지점장은 여기에 <strong>매일 취합</strong>을 더하면 됩니다.</p>
  <p><strong>모든 숫자는 DB 통합 CRM 에서 나옵니다.</strong> 통화하고 바로 결과를 남기지 않으면
     보고에도 점수에도 아무것도 안 잡힙니다.</p>
  <p><strong>고객 정보.</strong> 고객 실명은 쓰는 사람 기기에만 남고 서버에는 김○○ 로만 올라갑니다.
     AI 에게는 이름·전화번호·메모를 넘기지 않고 숫자와 상태만 넘깁니다.</p>
  <p>보험 계약 체결 전 상품설명서와 약관을 반드시 확인하셔야 합니다. 이 문서와 앱이 만들어 주는
     문구는 금융소비자보호법상 광고가 아닌 <strong>내부 참고용</strong>이며, 보장 여부·지급 조건은
     해당 보험회사의 약관과 심사 결과에 따릅니다.</p>
</footer>
</div>
'''

if __name__ == '__main__':
    out_repo = os.environ.get('OUT_REPO', '')
    if out_repo:
        with io.open(out_repo, 'w', encoding='utf-8') as f:
            f.write(build(False))
        print('%s  %.0fKB' % (out_repo, os.path.getsize(out_repo) / 1024))
    share = sys.argv[1] if len(sys.argv) > 1 else 'manual-share.html'
    with io.open(share, 'w', encoding='utf-8') as f:
        f.write(build(True))
    print('%s  %.1fMB' % (share, os.path.getsize(share) / 1048576))
