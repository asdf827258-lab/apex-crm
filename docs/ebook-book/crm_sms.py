# -*- coding: utf-8 -*-
"""오늘의 알림 카드에 「문자」 · 「복사」 를 붙인다.

  대행사도 심사도 없다. sms: 링크로 **내 폰의 문자앱**이 번호와 본문까지 채워
  열린다. 보내기만 누르면 내 번호로 나간다. 카톡은 특정인에게 본문을 넣어
  열 방법이 없으므로 **복사**까지만 한다 — 붙여넣는 것은 사람이 한다.
"""
import re, sys
sys.stdout.reconfigure(encoding="utf8")
P = "/home/user/apex-crm/db-crm.html"
C = open(P, encoding="utf8").read()
assert "smsBody" not in C, "이미 넣었습니다"

# ── 1. 카드마다 보낼 문구를 같이 만든다 ─────────────────────────
sub = [
 ('why:"아직 첫 통화 전 · "+days+"일 경과",',
  'why:"아직 첫 통화 전 · "+days+"일 경과",sms:days>=7?"first":"",'),
 ('why:abs+"차 부재 · "+days+"일 경과",',
  'why:abs+"차 부재 · "+days+"일 경과",sms:"absent",'),
 ('why:"상담 후 "+days+"일 무접촉",',
  'why:"상담 후 "+days+"일 무접촉",sms:"after",'),
]
for a, b in sub:
    assert C.count(a) == 1, a[:40]
    C = C.replace(a, b)

# ── 2. 문구를 만드는 함수 ───────────────────────────────────────
FN = '''
/* ── 보낼 문구 ──────────────────────────────────────────────
   전화가 먼저다. 문자는 **전화가 안 될 때** 남기는 것이다.
   그래서 첫 통화 전에는 7일이 지나야 문자 단추가 붙는다.
   문구는 짧게 — 길면 안 읽는다. 파는 말은 넣지 않는다.        */
function smsBody(it){
  var nm=(it.d&&it.d.customer_name)?it.d.customer_name:"고객";
  var me=(typeof profile!=="undefined"&&profile&&profile.name)?profile.name:"";
  var sig=me?("에이플러스에셋 "+me+"입니다."):"에이플러스에셋입니다.";
  if(it.sms==="first")
    return nm+"님, 안녕하세요. "+sig+"\\n안내드릴 것이 있어 연락드렸는데 통화가 어려우신 것 같습니다.\\n편한 시간 알려주시면 그때 맞춰 전화드리겠습니다.";
  if(it.sms==="absent")
    return nm+"님, 통화가 어려우신 것 같아 문자 남깁니다. "+sig+"\\n편한 시간 알려주시면 맞춰 전화드리겠습니다.";
  if(it.sms==="after")
    return nm+"님, "+sig+"\\n지난번 말씀하신 것 정리해서 보여드리고 싶은데, 이번 주 언제가 편하실까요?";
  return "";
}

/* 숫자만 남긴다 — 하이픈이 있으면 문자앱이 못 알아듣는 기기가 있다 */
function smsTel(p){ return (''+(p||'')).replace(/[^0-9+]/g,''); }

/* 폰이면 문자앱이 번호와 본문까지 채워 열린다.
   iOS 는 &body=, 안드로이드는 ?body= 를 쓴다 — 둘 다 되게 ?body= 로 보내고
   iOS 에서만 & 로 바꾼다. PC 에서는 열리지 않으므로 복사로 넘긴다. */
function smsOpen(id){
  var it=TT_MAP[id]; if(!it)return;
  var tel=smsTel(it.d.phone), body=smsBody(it);
  if(!tel){toast("연락처가 없습니다. DB 관리에서 번호를 넣어 주세요.",5000);return;}
  var ios=/iPad|iPhone|iPod/.test(navigator.userAgent);
  var url="sms:"+tel+(ios?"&":"?")+"body="+encodeURIComponent(body);
  var mobile=/Android|iPad|iPhone|iPod/.test(navigator.userAgent);
  if(!mobile){ smsCopy(id,null,true); return; }
  location.href=url;
}

/* 카톡은 특정인에게 본문을 넣어 여는 길이 없다 — 복사까지만 한다 */
function smsCopy(id,btn,quiet){
  var it=TT_MAP[id]; if(!it)return;
  var t=smsBody(it); if(!t)return;
  var done=function(ok){
    if(btn){btn.textContent=ok?"복사됨":"실패";setTimeout(function(){btn.textContent="복사";},1500);}
    if(quiet)toast(ok?"문구를 복사했습니다 — 문자나 카톡에 붙여 넣으세요":"복사에 실패했습니다",5000);
  };
  if(navigator.clipboard&&navigator.clipboard.writeText)
    navigator.clipboard.writeText(t).then(function(){done(true);},function(){done(false);});
  else done(false);
}
var TT_MAP={};
'''
m = re.search(r'\nfunction touchItems\(pid\)\{', C)
assert m, "touchItems 를 못 찾음"
C = C[:m.start()] + "\n" + FN + C[m.start():]

# ── 3. 카드에 단추 달기 ─────────────────────────────────────────
OLD = '''      <button class="btn btn-primary btn-sm" onclick="openCall('${it.d.id}')">접촉</button>
    </div>`).join("");'''
NEW = '''      <div class="tt-btns">
        ${it.sms?`<button class="btn btn-ghost btn-sm" onclick="smsOpen('${it.d.id}')" title="내 문자앱이 번호와 문구까지 채워 열립니다">✉ 문자</button>
        <button class="btn btn-ghost btn-sm" onclick="smsCopy('${it.d.id}',this)" title="카톡에 붙여 넣으세요">복사</button>`:""}
        <button class="btn btn-primary btn-sm" onclick="openCall('${it.d.id}')">접촉</button>
      </div>
    </div>`).join("");'''
assert C.count(OLD) == 1
C = C.replace(OLD, NEW)

# 카드를 그릴 때 지도를 채운다
OLD2 = '''  body.innerHTML='<div class="notice" style="margin-bottom:13px"><b>'+items.length+'건</b>'''
NEW2 = '''  TT_MAP={}; items.forEach(function(x){TT_MAP[x.d.id]=x;});
  body.innerHTML='<div class="notice" style="margin-bottom:13px"><b>'+items.length+'건</b>'''
assert C.count(OLD2) == 1
C = C.replace(OLD2, NEW2)

# ── 4. 모양 ─────────────────────────────────────────────────────
CSS = '''
/* 오늘의 알림 — 문자·복사 단추 */
.tt-btns{display:flex;gap:5px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
.tt-btns .btn-sm{white-space:nowrap}
@media(max-width:640px){.tt-btns{width:100%;justify-content:flex-start;margin-top:8px}}
'''
k = C.rfind("</style>")
C = C[:k] + CSS + C[k:]

open(P, "w", encoding="utf8").write(C)
print(f"넣었습니다 · db-crm.html {len(C.encode()):,} bytes")
