/* 🎣 <b>이분께 꺼낼 한 줄</b> — 오늘(홈) 한 분 카드 「이분 자세히」 맨 앞 (판 X474)
   사장님 말씀 2026-11-17 「상품화법들을, 오늘에 띄워서 고객들에게 연락할 접점을 만들어줘」
   · 고르는 기준 「안내대로 해」(나이 → DB 종류 → 이번 달 1위).

   ★ 말은 <b>상담자료/mikki-talk-data.js(MK_TALK) 한 곳</b> — 🧭 상품전략기 「🎣 문 열기」 와 책 RP 제조기가
     같이 읽는 상황 10가지의 「던지는 한마디」 · 담보입니다. 여기서 말을 새로 짓지 않습니다 (5번).
   ★ 고르는 차례 (1번 — 모르면 지어내지 않습니다)
     ① 나이대를 알면(생년 · 아침 미션에서 손으로 고른 것 — hmMsAge 한 곳) 그 나이대의 걱정
     ② 모르면 DB 종류(ta-open.js TA5 의 주제 — 실손 점검 · 못 받은 보험금 · 보험료 점검 …)
     ③ 둘 다 모르면 고르지 않고, 상품전략기 「🎣 문 열기」 를 <b>이번 달 1위 상품</b>으로 엽니다
       (순위는 상품전략기 안에만 있습니다 — 홈이 따로 세지 않습니다).
   ★ 호칭은 늘 「고객님」 — 성별·직업을 모르니 「사장님 · 어머님」 을 붙이지 않습니다 (3번).
   ★ 단추 「🧭 이어 갈 이번 달 상품」 은 상품전략기 「🎣 문 열기」 를 그 걱정으로 엽니다 —
     거기서 이번 달 상품 셋 · 5분 대본 · 약관이 이어집니다.
   ★ 판 X479 · 사장님 말씀 2026-11-18 「응 상품명도 띄워」 — 그 셋의 <b>이름</b>을 카드에 바로 적습니다.
     이름은 hm-door-top.js(HM_DOOR_TOP) — scripts/door-top.js 가 상품전략기의 고르기 코드를 그대로 돌려
     뽑은 것이라 🧭 를 누르면 같은 셋이 섭니다. 홈이 순위를 따로 세지 않습니다 (5번).
   ★ 판 X498 · 사장님 말씀 2026-11-20 「상품전략기 꺼내」 — 접힌 「이분 자세히」 <b>옆</b>에 「🧭 이분 걱정 상품」
     단추(btn)를 세웁니다. 걱정은 위 pick 그대로, 누르면 hmDoorGo — 안쪽 🎣 칸의 🧭 와 같은 길입니다.
     새 줄을 안 만듭니다 — 접기 단추와 한 줄에 나란히 서서 홈이 안 길어집니다(check-homeone).
     소식지 상품이라 「설계사용」 이라고 붙입니다 — 고객 화면에 옮기지 않습니다.                */
(function(g){
  var AGE_CAT = { '2030':'hospital', '4050':'cancer3', '60':'care' };
  var AGE_WHY = { '2030':'20·30대라', '4050':'40·50대라', '60':'60대 이상이라' };
  /* TA 대본의 주제(ta-open.js TA5.THEMES) → 미끼 상황. 신청하신 것과 가장 가까운 걱정으로 엽니다 */
  var THEME_CAT = { silson:'hospital', claim:'hospital', hidden:'hospital', dup:'hospital',
                    save:'cancer3', survey:'cancer3', general:'cancer3', fire:'life' };
  function esc(s){ return (typeof g.osEsc==='function') ? g.osEsc(s) : String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function pick(x){
    var M = g.MK_TALK; if(!M || !x) return null;
    var band = '';
    try{ band = (typeof g.hmMsAge === 'function') ? (g.hmMsAge(x) || '') : ''; }catch(e){ band = ''; }
    if(band && AGE_CAT[band] && M.CATS[AGE_CAT[band]])
      return { cat:AGE_CAT[band], by:'age', band:band, why:AGE_WHY[band] };
    var d = null;
    try{ d = (g.TA_OPENER && g.TA_OPENER.db) ? g.TA_OPENER.db(x.src) : null; }catch(e1){ d = null; }
    if(d && THEME_CAT[d.theme] && M.CATS[THEME_CAT[d.theme]]){
      var th = (g.TA5 && g.TA5.THEMES && g.TA5.THEMES[d.theme]) || {};
      return { cat:THEME_CAT[d.theme], by:'db', why:(th.name || d.label) + ' 신청이라' };
    }
    return { cat:'', by:'none' };
  }
  /* 이분께 꺼낼 말 — 던지는 한마디(+ 20·30대면 그 나이 꼬리말). 고객님 호칭은 MK_TALK.TYPES.general 그대로 */
  function line(P){
    var M = g.MK_TALK; if(!M || !P || !P.cat) return '';
    var C = M.CATS[P.cat], T = (P.band === '2030' && M.TYPES.y2030) ? M.TYPES.y2030 : null;
    return C.hook + (T && T.tail ? (' ' + T.tail) : '');
  }
  /* 이어 갈 이번 달 상품 이름 — 없거나(파일 안 실림) 비면 줄을 안 그립니다 */
  function prods(cat){
    var T = g.HM_DOOR_TOP; if(!T) return [];
    var L = cat ? (T.cats && T.cats[cat]) : (T.top ? [T.top] : []);
    return (L || []).filter(function(p){ return p && p.nm; }).slice(0, 3);
  }
  function prodsHtml(L, head){
    if(!L.length) return '';
    return '<div class="hm-door-p"><div class="hm-door-ph">'+esc(head)+' <span>설계사용 · 소식지 기준</span></div>'+
      L.map(function(p, i){ return '<div class="hm-door-pi"><b>'+(i + 1)+'</b><span>'+esc(p.co)+' · <em>'+esc(p.nm)+'</em></span></div>'; }).join('')+'</div>';
  }
  function css(){
    if(document.getElementById('hmDoorCss')) return;
    var st = document.createElement('style'); st.id = 'hmDoorCss';
    st.textContent =
      '.hm-door{border:1px solid var(--t-line);border-radius:var(--t-r-sm,13px);padding:10px 12px;margin-bottom:10px;background:var(--t-card,#fff)}'+
      '.hm-door-h{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:var(--t6);font-weight:800;color:var(--t-ink)}'+
      '.hm-door-why{font-weight:600;color:var(--t-sub)}'+
      '.hm-door-t{margin-top:6px;font-size:var(--t6);line-height:1.5;color:var(--t-ink);font-weight:600}'+
      '.hm-door-d{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}'+
      '.hm-door-d span{padding:2px 8px;border-radius:999px;background:var(--t-bg,#F2F4F6);color:var(--t-sub);font-size:var(--t7);font-weight:700}'+
      '.hm-door-p{margin-top:8px;padding:8px 10px;border-radius:10px;background:var(--t-bg,#F2F4F6)}'+
      '.hm-door-ph{font-size:var(--t7);font-weight:800;color:var(--t-sub)}'+
      '.hm-door-ph span{font-weight:600}'+
      '.hm-door-pi{display:flex;gap:6px;align-items:baseline;margin-top:4px;font-size:var(--t6);line-height:1.4;color:var(--t-sub)}'+
      '.hm-door-pi b{color:var(--t-point);font-weight:800}'+
      '.hm-door-pi em{font-style:normal;font-weight:800;color:var(--t-ink)}'+
      '.hm-door-a{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}'+
      '.hm-door-a button{min-height:44px;padding:0 12px;border:0;border-radius:10px;font-family:inherit;font-size:var(--t6);font-weight:800;cursor:pointer;'+
        'background:var(--t-point-l);color:var(--t-point)}'+
      '.hm-door-a button.g{background:var(--t-bg,#F2F4F6);color:var(--t-sub);font-weight:700}'+
      '.hm-door-o{flex:0 0 auto;max-width:48%;min-height:44px;padding:0 12px;border:0;border-radius:var(--t-r-sm,13px);'+
        'background:var(--t-point-l);color:var(--t-point);font-family:inherit;font-size:var(--t6);font-weight:800;cursor:pointer;'+
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}';
    document.head.appendChild(st);
  }
  function html(x){
    var M = g.MK_TALK, P = pick(x); if(!M || !P) return '';
    css();
    if(P.by === 'none')
      return '<div class="hm-door"><div class="hm-door-h">🎣 이분께 꺼낼 한 줄</div>'+
        '<div class="hm-door-t" style="font-weight:500;color:var(--t-sub)">나이도 신청 경로도 몰라 걱정을 고르지 않았습니다 — 이번 달 1위 상품으로 여는 말을 보세요.</div>'+
        prodsHtml(prods(''), '🏆 이번 달 1위')+
        '<div class="hm-door-a"><button type="button" onclick="hmDoorGo(\'\')">🧭 이번 달 1위 상품으로 문 열기</button></div></div>';
    var C = M.CATS[P.cat], t = line(P), k = esc(x.key || x.id || '');
    LAST[x.key || x.id || ''] = t;
    return '<div class="hm-door"><div class="hm-door-h">🎣 이분께 꺼낼 한 줄 · '+esc(C.label)+
        '<span class="hm-door-why">— '+esc(P.why)+'</span></div>'+
      '<div class="hm-door-t">“'+esc(t)+'”</div>'+
      '<div class="hm-door-d">'+C.dambo.slice(0, 3).map(function(d){ return '<span>'+esc(d)+'</span>'; }).join('')+'</div>'+
      prodsHtml(prods(P.cat), '🧭 이어 갈 이번 달 상품')+
      '<div class="hm-door-a"><button type="button" class="g" onclick="hmDoorCopy(\''+k+'\')">📋 복사</button>'+
        '<button type="button" onclick="hmDoorGo(\''+esc(P.cat)+'\',\''+(P.band === '2030' ? 'y2030' : '')+'\')">🧭 이어 갈 이번 달 상품</button></div></div>';
  }
  /* 🧭 접힌 「이분 자세히」 옆 단추 (판 X498) — 걱정을 모르면 「이번 달 1위」 로 (지어내지 않음 · 1번) */
  function btn(x){
    var M = g.MK_TALK, P = pick(x); if(!M || !P) return '';
    css();
    var cat = (P.by === 'none') ? '' : P.cat, C = cat ? M.CATS[cat] : null;
    var lab = C ? (C.label + ' 상품') : '이번 달 1위 상품';
    return '<button type="button" class="hm-door-o" onclick="hmDoorGo(\''+esc(cat)+'\',\''+(P.band === '2030' ? 'y2030' : '')+'\')" '+
      'title="상품전략기 「🎣 문 열기」 를 '+esc(C ? C.label + ' 걱정으로' : '이번 달 1위 상품으로')+' 엽니다">🧭 '+esc(lab)+'</button>';
  }
  /* 그린 말을 그 분 열쇠로 들고 있다가 📋 가 그대로 베낍니다 — 다시 고르면 다른 말이 나갈 수 있습니다 */
  var LAST = {};
  g.hmDoorCopy = function(k){
    var t = LAST[k] || '';
    if(!t){ if(typeof g.toast === 'function') g.toast('복사할 말을 못 찾았습니다'); return; }
    if(typeof g.copyText === 'function') g.copyText(t);
  };
  /* 🧭 상품전략기 「🎣 문 열기」 로 — 걱정을 고른 채로(cat), 모르면 이번 달 1위 상품으로.
     틀이 이미 떠 있으면 주소 꼬리(#talk/…)만 바뀌어 그 화면이 hashchange 로 따라옵니다.
     꼬리 = #talk/모드/걱정/호칭/번호 — 끝 번호는 같은 걱정을 두 번 눌러도 꼬리가 바뀌게(안 바뀌면 안 따라옵니다) */
  g.hmDoorGo = function(cat, type){
    var u = (typeof g.INSIGHT_URL === 'string' ? g.INSIGHT_URL : 'insight/index.html') +
            '#talk/' + (cat ? 'sit' : 'prod') + '/' + (cat || '-') + '/' + (type || '-') + '/' + (Date.now() % 100000);
    try{
      var f = document.getElementById('insightFrame');
      if(f){ f.src = u; f._mounted = true; }
      if(typeof g.go === 'function') g.go('insight');
      else location.href = u;
    }catch(e){ location.href = u; }
  };
  g.HM_DOOR = { pick:pick, line:line, html:html, btn:btn, prods:prods, AGE_CAT:AGE_CAT, THEME_CAT:THEME_CAT };
})(typeof window !== 'undefined' ? window : this);
