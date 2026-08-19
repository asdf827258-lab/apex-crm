# -*- coding: utf-8 -*-
"""db-crm.html 에 「고객 처방전」을 넣는다.

  오늘의 알림 맨 위에 검색칸 하나. 고객이 한 말을 적으면 처방이 뜬다.
  CRM 안 화면이면 바로 가고, 앱 화면이면 어느 갈래에 있는지 알려 준다.
  기존 코드는 건드리지 않는다 — 붙이기만 한다.
"""
import re, json, sys
sys.stdout.reconfigure(encoding="utf8")
sys.path.insert(0, ".")
from rx_data import RX, FALLBACK

WHERE = json.load(open("rx_where.json", encoding="utf8"))
P = "/home/user/apex-crm/db-crm.html"
C = open(P, encoding="utf8").read()
assert "rxSearch" not in C, "이미 넣었습니다"

# ── 처방 자료 (화면 이름·갈래·CRM 페이지) ───────────────────────
data = []
for say, want, scr, how, show, leave in RX:
    data.append({
        "q": say, "w": want,
        "s": [{"n": s, "g": WHERE[s]["g"], "p": WHERE[s]["p"]} for s in scr],
        "o": re.sub(r"</?b>", "", how),
        "v": re.sub(r"</?b>", "", show),
        "k": leave,
    })
RX_JSON = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
FB_JSON = json.dumps({"s": [{"n": s, "g": WHERE.get(s, {}).get("g", "내 고객"),
                            "p": ""} for s in FALLBACK[1]],
                      "o": re.sub(r"</?b>", "", FALLBACK[2])},
                     ensure_ascii=False, separators=(",", ":"))

# ── 1. 화면에 붙일 칸 ───────────────────────────────────────────
BOX = '''<div class="card section rx-box">
          <div class="rx-hd">
            <div>
              <h3>고객 처방전</h3>
              <p>고객이 한 말을 적으면 <b>무엇을 열지 · 뭐라고 열지 · 무엇을 남길지</b>가 나옵니다.</p>
            </div>
            <button class="btn-ghost rx-fold" id="rxFold" onclick="rxToggle()">접기</button>
          </div>
          <div id="rxWrap">
            <input id="rxSearch" class="rx-in" type="search" autocomplete="off"
                   placeholder="예) 돈이 안 모여요 · 사고 났어요 · 보험 많이 들어 있어요"
                   oninput="rxRender()">
            <div class="rx-chips" id="rxChips"></div>
            <div id="rxOut"></div>
          </div>
        </div>
        '''
old = '''        <div id="touchBody"></div>'''
assert C.count(old) == 1
C = C.replace(old, BOX + old)

# ── 2. 모양 ─────────────────────────────────────────────────────
CSS = '''
/* ══ 고객 처방전 ══ 오늘의 알림 맨 위. 적으면 나오게 한다 */
.rx-box{margin-bottom:13px}
.rx-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;
  padding:15px 17px 12px}
.rx-hd h3{margin:0 0 3px;font-size:16px;font-weight:800;letter-spacing:-.03em}
.rx-hd p{margin:0;font-size:12.5px;color:var(--ink-3,#64748B);line-height:1.55}
.rx-fold{flex:none;font-size:12px;padding:5px 11px}
#rxWrap{padding:0 17px 15px}
.rx-in{width:100%;padding:11px 13px;border:2px solid var(--line,#E2E8F0);border-radius:10px;
  font-size:15px;font-weight:600;font-family:inherit;outline:none;background:#fff}
.rx-in:focus{border-color:#1A56DB}
.rx-chips{display:flex;flex-wrap:wrap;gap:5px;margin:9px 0 0}
.rx-chip{font-size:12px;font-weight:700;color:#475569;background:#F1F5F9;border:1px solid #E2E8F0;
  border-radius:999px;padding:5px 10px;cursor:pointer}
.rx-chip:hover{background:#E0EAFB;border-color:#93B4F0;color:#1A56DB}
.rx-card{border:1px solid var(--line,#E2E8F0);border-radius:12px;margin-top:11px;overflow:hidden;
  background:#fff}
.rx-t{background:#EFF6FF;border-bottom:1px solid #DBE7FA;padding:9px 13px;
  font-size:13.5px;font-weight:800;color:#1A56DB}
.rx-t small{font-weight:600;color:#64748B;margin-left:6px}
.rx-r{display:grid;grid-template-columns:84px 1fr;gap:10px;padding:9px 13px;
  border-top:1px solid #F1F5F9;align-items:start}
.rx-r:first-of-type{border-top:0}
.rx-k{font-size:11.5px;font-weight:800;color:#94A3B8;padding-top:3px}
.rx-v{font-size:13px;color:#334155;line-height:1.6;font-weight:500}
.rx-step{display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap}
.rx-no{width:17px;height:17px;border-radius:50%;background:#1A56DB;color:#fff;font-size:10.5px;
  font-weight:800;display:grid;place-items:center;flex:none}
.rx-go{font-size:12.5px;font-weight:700;color:#1A56DB;background:#EFF6FF;border:1px solid #C7DBFA;
  border-radius:7px;padding:3px 9px;cursor:pointer}
.rx-go:hover{background:#DBEAFE}
.rx-at{font-size:12.5px;font-weight:700;color:#334155;background:#F8FAFC;border:1px solid #E2E8F0;
  border-radius:7px;padding:3px 9px}
.rx-at i{font-style:normal;color:#94A3B8;font-weight:600}
.rx-keep{color:#047857;font-weight:700}
.rx-cp{font-size:11.5px;font-weight:700;color:#64748B;background:#fff;border:1px solid #E2E8F0;
  border-radius:6px;padding:2px 8px;cursor:pointer;margin-left:6px}
.rx-cp:hover{border-color:#1A56DB;color:#1A56DB}
.rx-none{padding:13px;font-size:13px;color:#64748B;line-height:1.65;background:#F8FAFC;
  border-radius:10px;margin-top:11px}
.rx-none b{color:#0F172A}
'''
k = C.rfind("</style>")
C = C[:k] + CSS + C[k:]

# ── 3. 움직임 ───────────────────────────────────────────────────
JS = '''
/* ══════════════ 고객 처방전 ══════════════
   화면이 여든여덟 개인데, 「돈이 안 모여요」를 듣고 8통장 진단지도를 떠올리는
   사람은 이미 잘하는 사람이다. 나머지는 아무것도 안 연다.
   외워서 찾게 하지 말고 적으면 나오게 한다.
   마지막 칸이 「남길 것」인 이유는, 추천이 아니라 기록이 목적이기 때문이다. */
var RX_LIST = ''' + RX_JSON + ''';
var RX_FB = ''' + FB_JSON + ''';

function rxNorm(s){ return (s||'').replace(/\\s+/g,'').toLowerCase(); }

/* 적은 말과 처방을 견준다 — 사람은 화면 이름을 정확히 말하지 않는다 */
function rxFind(q){
  var n = rxNorm(q);
  if(!n) return [];
  var hit = RX_LIST.filter(function(r){
    return rxNorm(r.q).indexOf(n) >= 0 || rxNorm(r.w).indexOf(n) >= 0 ||
           r.s.some(function(x){ return rxNorm(x.n).indexOf(n) >= 0; });
  });
  if(hit.length) return hit;
  /* 한 글자씩 흩어서 다시 — 「돈모여」 같이 줄여 적어도 찾게 */
  return RX_LIST.filter(function(r){
    var t = rxNorm(r.q + r.w), i = 0;
    for(var j = 0; j < n.length; j++){ i = t.indexOf(n[j], i); if(i < 0) return false; i++; }
    return true;
  });
}

function rxChips(){
  var el = $("rxChips"); if(!el) return;
  el.innerHTML = RX_LIST.map(function(r){
    return '<span class="rx-chip" onclick="rxPick(' + JSON.stringify(r.q).replace(/"/g,'&quot;') + ')">'
      + esc(r.q) + '</span>';
  }).join('');
}
function rxPick(q){ var i = $("rxSearch"); if(i){ i.value = q; rxRender(); } }

function rxStep(x, i){
  var go = x.p
    ? '<button class="rx-go" onclick="goPage(\\'' + x.p + '\\')">' + esc(x.n) + ' 열기 →</button>'
    : '<span class="rx-at">' + esc(x.n) + ' <i>· 앱 왼쪽 ' + esc(x.g) + '</i></span>';
  return '<div class="rx-step"><span class="rx-no">' + (i + 1) + '</span>' + go + '</div>';
}

function rxCard(r){
  return '<div class="rx-card">'
    + '<div class="rx-t">' + esc(r.q) + '<small>' + esc(r.w) + '</small></div>'
    + '<div class="rx-r"><div class="rx-k">이 순서로</div><div class="rx-v">'
      + r.s.map(rxStep).join('') + '</div></div>'
    + '<div class="rx-r"><div class="rx-k">이렇게 여세요</div><div class="rx-v">' + esc(r.o)
      + '<button class="rx-cp" onclick="rxCopy(this)" data-t="' + esc(r.o) + '">복사</button>'
      + '</div></div>'
    + '<div class="rx-r"><div class="rx-k">보여 줄 것</div><div class="rx-v">' + esc(r.v) + '</div></div>'
    + '<div class="rx-r"><div class="rx-k">끝나면</div><div class="rx-v rx-keep">' + esc(r.k)
      + '</div></div>'
    + '</div>';
}

function rxCopy(b){
  var t = b.getAttribute('data-t') || '';
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(t).then(function(){ b.textContent = '복사됨'; },
                                          function(){ b.textContent = '실패'; });
  } else { b.textContent = '실패'; }
  setTimeout(function(){ b.textContent = '복사'; }, 1500);
}

function rxRender(){
  var out = $("rxOut"), i = $("rxSearch"); if(!out) return;
  var q = i ? i.value.trim() : '';
  if(!q){ out.innerHTML = ''; return; }
  var hit = rxFind(q);
  if(!hit.length){
    /* 억지로 처방을 만들지 않는다 — 팩트파인딩으로 되돌린다 */
    out.innerHTML = '<div class="rx-none"><b>여기 없는 말입니다.</b> '
      + esc(RX_FB.o) + '<div style="margin-top:8px">'
      + RX_FB.s.map(function(x){ return '<span class="rx-at">' + esc(x.n)
          + ' <i>· 앱 왼쪽 ' + esc(x.g) + '</i></span> '; }).join('')
      + '</div></div>';
    return;
  }
  out.innerHTML = hit.slice(0, 3).map(rxCard).join('');
}

function rxToggle(){
  var w = $("rxWrap"), b = $("rxFold"); if(!w || !b) return;
  var hide = w.style.display !== 'none';
  w.style.display = hide ? 'none' : '';
  b.textContent = hide ? '펴기' : '접기';
  try{ localStorage.setItem('rxFold', hide ? '1' : '0'); }catch(e){}
}

function rxInit(){
  rxChips();
  try{ if(localStorage.getItem('rxFold') === '1') rxToggle(); }catch(e){}
}
'''
m = re.search(r'\n</script>\s*</body>', C)
assert m, "스크립트 끝을 못 찾음"
C = C[:m.start()] + "\n" + JS + C[m.start():]

# 켤 때 한 번 부른다 — 기존 시작 함수 뒤에 붙인다
CALL = re.search(r'(loadAll\(\);)', C)
assert CALL, "loadAll() 호출부를 못 찾음"
C = C[:CALL.end()] + "rxInit();" + C[CALL.end():]

open(P, "w", encoding="utf8").write(C)
print(f"넣었습니다 · db-crm.html {len(C.encode()):,} bytes · 처방 {len(data)}개")
