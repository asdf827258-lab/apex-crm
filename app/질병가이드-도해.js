/* ════════════════════════════════════════════════════════════════
   질병 보험가이드 — 도해 (window.DZ_VIZ)

   고객은 글보다 그림을 먼저 봅니다. 특히 <b>왜 이 술식은 수술이고 저건
   시술인가</b> 는 말로 설명하면 3분, 그림으로 보여 주면 10초입니다.

   ★ 남의 자료 삽화를 복제하지 않습니다. 전부 여기서 <b>직접 그립니다.</b>
     사진은 인쇄에서 뭉개지고 화면 크기마다 달라지지만, SVG 는 어디서나
     같은 선으로 섭니다.
   ★ 해부도가 아니라 <b>설명용 도식</b>입니다. 실제 몸의 모양·비율과
     다릅니다. 화면에도 그렇게 적습니다.
   ★ 3D 는 CSS 원근(perspective)으로 겹을 띄웁니다. 끌면 돌아갑니다.
     바깥에서 아무것도 받아 오지 않습니다.

   쓰는 법:  DZ_VIZ.get('stomach_layer')  →  {t, d, dz:[질병id], html}
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 3D 무대 — 겹을 z 로 띄우고, 끌면 돌아간다 ─────────────
     두 번 고쳤다.
       ① 판 위에 글자를 얹었더니 판이 눕는 순간 글자도 누워 안 읽혔다.
       ② 그래서 이름표를 판에 붙여 따라다니게 하고 돌린 만큼 되돌렸더니,
          이번엔 각도에 따라 이름표가 화면 밖으로 올라가 버렸다.
     그래서 <b>이름표를 3D 에서 아예 떼어</b> 오른쪽에 고정으로 세운다.
     판과는 <b>색과 차례</b>로 잇는다. 어느 각도로 돌려도 이름은 늘 읽힌다.  */
  var SEQ = 0;
  function stage(layers, opt) {
    opt = opt || {};
    var id = 'dzs' + (++SEQ);
    var rx = opt.rx == null ? 58 : opt.rx;
    var ry = opt.ry == null ? -20 : opt.ry;
    var w = opt.w || 330, h0 = opt.h || 126;
    var h = '<div class="dz3d" data-rx="' + rx + '" data-ry="' + ry + '" id="' + id + '">' +
      '<div class="dz3d-box"><div class="dz3d-stage" style="width:' + w + 'px;height:' + h0 + 'px;' +
      'transform:rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)">';
    layers.forEach(function (L) {
      h += '<div class="dz3d-layer" style="transform:translate3d(0,0,' + L.z + 'px)">' + L.svg + '</div>';
    });
    h += '</div><div class="dz3d-hint">끌어서 돌려 보세요</div></div>';
    /* 이름표 — 판과 같은 차례, 같은 색 */
    h += '<div class="dz3d-legend">' + layers.map(function (L) {
      return L.tag ? '<div class="dz3d-tag" style="border-left-color:' + (L.color || '#9CA3AF') + '">' + L.tag + '</div>' : '';
    }).join('') + '</div>';
    h += '</div>';
    return h;
  }

  /* 평면 도해 — 3D 가 필요 없는 것은 굳이 돌리지 않는다 */
  function flat(svg) { return '<div class="dzflat">' + svg + '</div>'; }

  /* ── 자주 쓰는 조각 ─────────────────────────────────────────── */
  function slab(fill, stroke, hatch) {
    /* 겹 하나 — 글자 없는 판. 이름은 바깥의 이름표가 맡는다. */
    var s = '<svg viewBox="0 0 330 126" width="330" height="126">' +
      '<rect x="5" y="5" width="320" height="116" rx="16" fill="' + fill + '" stroke="' + stroke +
      '" stroke-width="2.5"/>';
    if (hatch) {
      for (var i = 0; i < 9; i++) {
        var x = 22 + i * 34;
        s += '<path d="M' + x + ' 18 L' + (x + 16) + ' 108" stroke="' + stroke + '" stroke-width="1.4" opacity=".28"/>';
      }
    }
    s += '</svg>';
    return s;
  }

  var V = {};

  /* ═══ 1. 위·대장 벽은 네 겹 — 어디까지 파고들었나가 술식을 가른다 ═══ */
  function nameTag(t, sub) {
    return '<div style="font-size:13px;font-weight:800;color:#0D1117">' + t + '</div>' +
      '<div style="font-size:11.5px;color:#4B5563;font-weight:600;margin-top:2px">' + sub + '</div>';
  }

  V.wall_layer = {
    t: '벽은 네 겹입니다 — 어디까지 파고들었나',
    d: '위·대장의 벽은 네 겹으로 되어 있습니다. 암이 <b>맨 위 겹(점막)에 머물러 있으면</b> 내시경으로 벗겨 낼 수 있고(ESD), ' +
       '<b>아래 겹까지 파고들었으면</b> 배를 열거나 구멍을 내어 장기를 잘라 냅니다. ' +
       '같은 암인데 술식이 갈리는 이유가 이 그림 한 장에 있습니다. 판을 끌어 돌려 보시면 깊이가 보입니다.',
    dz: ['cancer_major'],
    build: function () {
      var tumor = '<svg viewBox="0 0 330 126" width="330" height="126">' +
        '<rect x="5" y="5" width="320" height="116" rx="16" fill="#FEE2E2" stroke="#EF4444" stroke-width="2.5"/>' +
        '<path d="M120 46 Q142 30 168 42 Q194 54 186 78 Q176 100 148 96 Q118 92 116 70 Z" ' +
        'fill="#DC2626" opacity=".85"/>' +
        '<path d="M132 58 Q150 50 166 60" stroke="#7F1D1D" stroke-width="2" fill="none" opacity=".7"/>' +
        '</svg>';
      return stage([
        { z: 108, svg: tumor, color: '#DC2626',
          tag: nameTag('① 점막 — 종양이 여기 머물면', '내시경으로 벗겨 냅니다 (ESD)') },
        { z: 36, svg: slab('#FEF3C7', '#F59E0B', 0), color: '#D97706',
          tag: nameTag('② 점막하층', '여기 닿으면 내시경만으로는 어렵습니다') },
        { z: -36, svg: slab('#DBEAFE', '#3B82F6', 1), color: '#2563EB',
          tag: nameTag('③ 근육층', '여기 넘으면 → 근치적 절제술') },
        { z: -108, svg: slab('#E5E7EB', '#6B7280', 0), color: '#4B5563',
          tag: nameTag('④ 장막(바깥막)', '뚫으면 배 안으로 퍼질 수 있습니다') }
      ], { rx: 58, ry: -20 });
    }
  };

  /* ═══ 2. 혈관 — 좁아지고, 막히고, 열어 둔다 ═══ */
  function tube(idn, plaque, stent, cap) {
    /* 원통 하나 — 앞뒤 타원으로 두께를 만든다 */
    var s = '<svg viewBox="0 0 210 150" width="210" height="150">';
    s += '<defs><linearGradient id="g' + idn + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#FCA5A5"/><stop offset="1" stop-color="#DC2626"/></linearGradient></defs>';
    /* 바깥 벽 */
    s += '<path d="M30 40 L180 40 A16 32 0 0 1 180 104 L30 104 A16 32 0 0 1 30 40 Z" fill="url(#g' + idn + ')" opacity=".28"/>';
    s += '<ellipse cx="30" cy="72" rx="16" ry="32" fill="#FEE2E2" stroke="#DC2626" stroke-width="2.5"/>';
    s += '<path d="M30 40 L180 40" stroke="#DC2626" stroke-width="2.5" fill="none"/>';
    s += '<path d="M30 104 L180 104" stroke="#DC2626" stroke-width="2.5" fill="none"/>';
    s += '<ellipse cx="180" cy="72" rx="16" ry="32" fill="none" stroke="#DC2626" stroke-width="2.5"/>';
    /* 기름때 */
    if (plaque > 0) {
      var t = 4 + plaque * 20;
      s += '<path d="M70 ' + (40 + t) + ' Q105 ' + (52 + t) + ' 145 ' + (40 + t) + ' L145 40 L70 40 Z" fill="#FBBF24" opacity=".9"/>';
      s += '<path d="M70 ' + (104 - t) + ' Q105 ' + (92 - t) + ' 145 ' + (104 - t) + ' L145 104 L70 104 Z" fill="#FBBF24" opacity=".9"/>';
    }
    /* 스텐트 그물 */
    if (stent) {
      var m = '';
      for (var i = 0; i < 7; i++) {
        var x = 70 + i * 12;
        m += '<path d="M' + x + ' 44 L' + (x + 12) + ' 100 M' + x + ' 100 L' + (x + 12) + ' 44" ' +
             'stroke="#1A56DB" stroke-width="2.2" fill="none" opacity=".95"/>';
      }
      s += m;
    }
    s += '<text x="105" y="132" font-size="12.5" font-weight="800" fill="#0D1117" text-anchor="middle">' + cap + '</text>';
    s += '</svg>';
    return s;
  }
  V.vessel = {
    t: '혈관은 이렇게 좁아지고, 이렇게 엽니다',
    d: '기름때가 쌓여 길이 좁아지다가(협심증), 그 덩어리가 터지면 피떡이 생겨 완전히 막힙니다(심근경색). ' +
       '스텐트는 <b>그 자리에 그물망을 펴서 열어 두는 것</b>이지 기름때를 없애는 것이 아닙니다. ' +
       '그래서 평생 약을 먹고, 다시 좁아지면 또 넣습니다.',
    dz: ['mi', 'stroke', 'chronic'],
    build: function () {
      return flat('<div class="dzrow">' +
        tube(1, 0, 0, '정상 — 길이 열려 있다') +
        tube(2, 1, 0, '협착 — 좁아진다(협심증)') +
        tube(3, 2, 0, '폐색 — 막힌다(심근경색)') +
        tube(4, 1.4, 1, '스텐트 — 열어 둔다(PCI)') +
        '</div>');
    }
  };

  /* ═══ 3. 뇌 — 막힌 자리를 여는 세 가지 길 ═══ */
  V.brain_open = {
    t: '막힌 뇌혈관을 여는 세 가지 길',
    d: '같은 뇌경색인데 <b>어떻게 열었느냐</b>에 따라 보험이 완전히 달라집니다. ' +
       '약으로 녹이면 수술이 아니고, 관을 넣어 꺼내면 시술이며, 머리를 열면 수술입니다. ' +
       '가장 흔한 것은 <b>맨 왼쪽</b>인데, 수술비 담보만 가진 분은 여기서 한 푼도 못 받습니다.',
    dz: ['stroke'],
    build: function () {
      function head(inner, cap, badge, bc) {
        return '<svg viewBox="0 0 200 206" width="200" height="206">' +
          '<path d="M95 16 C136 16 166 46 166 88 C166 118 148 140 128 150 L128 166 L62 166 L62 150 C42 140 24 118 24 88 C24 46 54 16 95 16 Z" ' +
          'fill="#F1F5F9" stroke="#475569" stroke-width="2.5"/>' +
          '<path d="M60 60 Q95 44 130 62 M52 92 Q95 74 138 96 M60 124 Q95 108 130 126" stroke="#CBD5E1" stroke-width="2" fill="none"/>' +
          /* 혈관 */
          '<path d="M52 132 Q72 96 92 84 Q112 72 132 56" stroke="#DC2626" stroke-width="4.5" fill="none" stroke-linecap="round"/>' +
          inner +
          '<rect x="10" y="180" width="180" height="20" rx="10" fill="' + bc + '"/>' +
          '<text x="100" y="194" font-size="11" font-weight="800" fill="#fff" text-anchor="middle">' + badge + '</text>' +
          '<text x="95" y="12" font-size="12" font-weight="800" fill="#0D1117" text-anchor="middle">' + cap + '</text>' +
          '</svg>';
      }
      var clot = '<circle cx="92" cy="84" r="9" fill="#1F2937"/>';
      return flat('<div class="dzrow">' +
        head(clot + '<path d="M138 84 L106 84" stroke="#059669" stroke-width="3" stroke-dasharray="5 4" marker-end="url(#a1)"/>' +
             '<circle cx="92" cy="84" r="13" fill="none" stroke="#059669" stroke-width="2.5" stroke-dasharray="4 4"/>',
             '① 약으로 녹인다', '혈전용해 · 수술 아님', '#059669') +
        head(clot + '<path d="M168 150 Q130 120 104 90" stroke="#7C3AED" stroke-width="3.5" fill="none"/>' +
             '<circle cx="100" cy="87" r="6" fill="none" stroke="#7C3AED" stroke-width="3"/>',
             '② 관을 넣어 꺼낸다', '혈전제거 · 시술', '#7C3AED') +
        head(clot + '<path d="M64 34 A44 44 0 0 1 128 40" stroke="#1A56DB" stroke-width="5" fill="none" stroke-linecap="round"/>' +
             '<path d="M70 40 L120 46" stroke="#1A56DB" stroke-width="2" stroke-dasharray="4 3"/>',
             '③ 머리를 연다', '개두술 · 수술', '#1A56DB') +
        '</div>' +
        '<svg width="0" height="0"><defs><marker id="a1" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">' +
        '<path d="M0 0 L7 3.5 L0 7 Z" fill="#059669"/></marker></defs></svg>');
    }
  };

  /* ═══ 4. 배를 여는 세 가지 — 절개 크기가 다릅니다 ═══ */
  V.approach = {
    t: '배를 여는 세 가지 — 흉터와 회복이 다릅니다',
    d: '같은 장기를 떼어 내도 <b>어떻게 들어가느냐</b>가 다릅니다. 크게 열수록 회복이 길고, 작게 들어갈수록 값이 오릅니다. ' +
       '로봇은 <b>비급여인 경우가 많아</b> 정액 수술비가 나와도 사용료가 자부담으로 남습니다.',
    dz: ['cancer_major', 'surgery', 'cancer_female'],
    build: function () {
      function belly(marks, cap, cost, cc) {
        return '<svg viewBox="0 0 170 200" width="170" height="200">' +
          '<rect x="20" y="20" width="130" height="150" rx="30" fill="#FEF3C7" stroke="#D97706" stroke-width="2.5"/>' +
          '<ellipse cx="85" cy="96" rx="10" ry="12" fill="#FDE68A" stroke="#D97706" stroke-width="1.6"/>' +
          marks +
          '<text x="85" y="14" font-size="12" font-weight="800" fill="#0D1117" text-anchor="middle">' + cap + '</text>' +
          '<rect x="24" y="176" width="122" height="18" rx="9" fill="' + cc + '"/>' +
          '<text x="85" y="189" font-size="10.5" font-weight="800" fill="#fff" text-anchor="middle">' + cost + '</text>' +
          '</svg>';
      }
      return flat('<div class="dzrow">' +
        belly('<path d="M85 44 L85 148" stroke="#DC2626" stroke-width="5" stroke-linecap="round"/>',
              '개복', '크게 연다 · 회복 김', '#DC2626') +
        belly('<circle cx="60" cy="70" r="5" fill="#DC2626"/><circle cx="110" cy="70" r="5" fill="#DC2626"/>' +
              '<circle cx="85" cy="130" r="5" fill="#DC2626"/><circle cx="60" cy="120" r="5" fill="#DC2626"/>',
              '복강경', '구멍 몇 개 · 회복 빠름', '#D97706') +
        belly('<circle cx="58" cy="72" r="5" fill="#DC2626"/><circle cx="112" cy="72" r="5" fill="#DC2626"/>' +
              '<circle cx="85" cy="132" r="5" fill="#DC2626"/><circle cx="58" cy="118" r="5" fill="#DC2626"/>' +
              '<path d="M30 40 L58 66 M140 40 L112 66" stroke="#1A56DB" stroke-width="3" stroke-linecap="round"/>' +
              '<rect x="16" y="26" width="20" height="16" rx="4" fill="#1A56DB"/><rect x="134" y="26" width="20" height="16" rx="4" fill="#1A56DB"/>',
              '로봇', '비급여인 경우 많음', '#1A56DB') +
        '</div>');
    }
  };

  /* ═══ 5. 투석 — 몸 밖에 정수기를 답니다 ═══ */
  V.dialysis = {
    t: '투석은 몸 밖에 정수기를 다는 일입니다',
    d: '콩팥이 못 거르면 <b>팔의 굵은 혈관(동정맥루)</b>에서 피를 빼내 기계의 필터로 걸러 다시 넣습니다. ' +
       '보통 주 3회, 한 번에 서너 시간입니다. 일주일의 절반이 병원 일정이 되므로 <b>치료비보다 소득이 먼저 무너집니다.</b>',
    dz: ['kidney', 'chronic'],
    build: function () {
      return flat('<svg viewBox="0 0 620 230" width="620" height="230">' +
        /* 팔 */
        '<rect x="14" y="70" width="150" height="70" rx="34" fill="#FEF3C7" stroke="#D97706" stroke-width="2.5"/>' +
        '<path d="M30 106 L150 106" stroke="#DC2626" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M30 92 L150 92" stroke="#2563EB" stroke-width="5" stroke-linecap="round"/>' +
        '<circle cx="96" cy="100" r="15" fill="none" stroke="#7C3AED" stroke-width="3"/>' +
        '<text x="89" y="164" font-size="12" font-weight="800" fill="#0D1117">동정맥루(AVF)</text>' +
        '<text x="89" y="182" font-size="11" fill="#6B7280">동맥과 정맥을 이어 만든 굵은 혈관</text>' +
        /* 나가는 관 */
        '<path d="M164 112 Q210 112 240 112" stroke="#DC2626" stroke-width="7" fill="none" stroke-linecap="round"/>' +
        '<polygon points="240,104 258,112 240,120" fill="#DC2626"/>' +
        /* 필터 */
        '<rect x="262" y="52" width="96" height="128" rx="16" fill="#EFF4FF" stroke="#1A56DB" stroke-width="2.5"/>' +
        '<path d="M278 70 L278 162 M294 70 L294 162 M310 70 L310 162 M326 70 L326 162 M342 70 L342 162" ' +
        'stroke="#93C5FD" stroke-width="4" stroke-linecap="round"/>' +
        '<text x="310" y="44" font-size="12.5" font-weight="800" fill="#1A56DB" text-anchor="middle">투석기 · 필터</text>' +
        '<text x="310" y="200" font-size="11" fill="#6B7280" text-anchor="middle">노폐물과 물을 걸러 냅니다</text>' +
        /* 돌아오는 관 */
        '<path d="M358 92 Q420 92 448 92" stroke="#2563EB" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        '<path d="M448 92 L448 150 Q448 168 430 168 L180 168 Q164 168 164 150 L164 128" ' +
        'stroke="#2563EB" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        '<polygon points="156,128 172,128 164,112" fill="#2563EB"/>' +
        /* 시간 */
        '<rect x="470" y="60" width="136" height="112" rx="14" fill="#FEF2F2" stroke="#DC2626" stroke-width="2"/>' +
        '<text x="538" y="88" font-size="12" font-weight="800" fill="#DC2626" text-anchor="middle">주 3회 · 서너 시간</text>' +
        '<text x="538" y="112" font-size="11" fill="#4B5563" text-anchor="middle">월 · 수 · 금</text>' +
        '<text x="538" y="134" font-size="11" fill="#4B5563" text-anchor="middle">일주일의 절반이</text>' +
        '<text x="538" y="152" font-size="11" fill="#4B5563" text-anchor="middle">병원 일정이 됩니다</text>' +
        '</svg>');
    }
  };

  /* ═══ 6. 무릎 — 연골이 닳고, 관절면을 바꿔 끼웁니다 ═══ */
  V.joint = {
    t: '연골이 닳으면 관절면을 바꿔 끼웁니다',
    d: '무릎은 뼈와 뼈 사이에 <b>연골이라는 방석</b>이 있습니다. 이 방석이 닳아 없어지면 뼈끼리 부딪혀 아픕니다. ' +
       '인공관절 치환술은 뼈 끝을 다듬어 <b>금속·플라스틱 관절면으로 갈아 끼우는</b> 수술입니다.',
    dz: ['joint'],
    build: function () {
      function knee(gap, gapColor, impl, cap) {
        var s = '<svg viewBox="0 0 150 190" width="150" height="190">';
        s += '<path d="M46 16 Q75 8 104 16 L104 66 Q98 82 75 82 Q52 82 46 66 Z" fill="#F3F4F6" stroke="#6B7280" stroke-width="2.5"/>';
        s += '<path d="M46 ' + (86 + gap) + ' Q52 ' + (72 + gap) + ' 75 ' + (72 + gap) + ' Q98 ' + (72 + gap) + ' 104 ' + (86 + gap) +
             ' L104 158 Q75 166 46 158 Z" fill="#F3F4F6" stroke="#6B7280" stroke-width="2.5"/>';
        if (gap > 0) s += '<rect x="48" y="' + (74) + '" width="54" height="' + gap + '" rx="' + Math.min(6, gap) + '" fill="' + gapColor + '"/>';
        if (impl) {
          s += '<path d="M44 60 Q75 52 106 60 L106 76 Q75 84 44 76 Z" fill="#94A3B8" stroke="#334155" stroke-width="2"/>';
          s += '<rect x="46" y="86" width="58" height="12" rx="4" fill="#CBD5E1" stroke="#334155" stroke-width="2"/>';
          s += '<rect x="52" y="98" width="46" height="8" rx="3" fill="#94A3B8" stroke="#334155" stroke-width="1.6"/>';
        }
        s += '<text x="75" y="182" font-size="12" font-weight="800" fill="#0D1117" text-anchor="middle">' + cap + '</text>';
        s += '</svg>';
        return s;
      }
      return flat('<div class="dzrow">' +
        knee(14, '#34D399', 0, '정상 — 방석이 있다') +
        knee(6, '#FBBF24', 0, '닳는 중 — 아프기 시작') +
        knee(1, '#EF4444', 0, '뼈끼리 닿음 — 통증') +
        knee(12, '#CBD5E1', 1, '인공관절로 교체') +
        '</div>');
    }
  };

  /* ═══ 7. 치매 — 계단은 내려가기만 합니다 ═══ */
  V.dementia_step = {
    t: '계단은 내려가기만 합니다',
    d: '치매는 한 번에 오지 않고 <b>계단을 내려가듯</b> 진행합니다. 그리고 올라오지 않습니다. ' +
       '보험에서 중요한 것은 <b>몇 번째 계단부터 지급되는가</b> 입니다. 맨 아래 칸에서만 열리는 담보는 실제로 열리는 일이 드뭅니다.',
    dz: ['dementia'],
    build: function () {
      var steps = [
        ['경도인지장애', '깜빡깜빡 · 혼자 생활 가능', '#059669', '대개 담보 안 열림'],
        ['경증', '같은 말 되묻기 · 길 잃음', '#65A30D', '여기부터 열리는 담보인가?'],
        ['중등도', '옷 입기·씻기 도움 필요', '#D97706', '돌봄이 본격적으로 시작'],
        ['중증', '대부분 도움 필요', '#DC2626', '여기만 담는 담보는 늦다']
      ];
      var s = '<svg viewBox="0 0 660 300" width="660" height="300">';
      steps.forEach(function (st, i) {
        var x = 20 + i * 158, y = 40 + i * 56, w = 148, h = 300 - y - 20;
        s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12" fill="' + st[2] + '" opacity=".13" stroke="' + st[2] + '" stroke-width="2"/>';
        s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="30" rx="12" fill="' + st[2] + '"/>';
        s += '<text x="' + (x + w / 2) + '" y="' + (y + 20) + '" font-size="13" font-weight="800" fill="#fff" text-anchor="middle">' + st[0] + '</text>';
        s += '<text x="' + (x + 10) + '" y="' + (y + 52) + '" font-size="11" fill="#374151">' + st[1] + '</text>';
        s += '<text x="' + (x + 10) + '" y="' + (y + 76) + '" font-size="11" font-weight="800" fill="' + st[2] + '">' + st[3] + '</text>';
        if (i < 3) s += '<path d="M' + (x + w + 2) + ' ' + (y + 46) + ' L' + (x + w + 8) + ' ' + (y + 46) + '" stroke="#9CA3AF" stroke-width="2"/>';
      });
      s += '<text x="20" y="24" font-size="12" font-weight="800" fill="#6B7280">← 시간</text>';
      s += '</svg>';
      return flat(s);
    }
  };

  /* ═══ 8. 간 — 굳으면 되돌아오지 않습니다 ═══ */
  V.liver_step = {
    t: '간은 굳으면 되돌아오지 않습니다',
    d: '오랜 염증이 간을 굳게 만듭니다. <b>지방간·간염 단계에서는 되돌릴 여지가 있지만, 굳은 부분은 그대로입니다.</b> ' +
       '그리고 간경변이 있으면 간암 위험이 높아 정기적으로 검사를 받습니다.',
    dz: ['liver', 'chronic'],
    build: function () {
      function liver(fill, texture, cap, sub, cc) {
        var s = '<svg viewBox="0 0 160 175" width="160" height="175">';
        s += '<path d="M22 52 Q26 26 62 24 Q96 22 122 34 Q142 44 138 78 Q134 116 100 128 Q62 140 38 116 Q18 94 22 52 Z" ' +
             'fill="' + fill + '" stroke="#7C2D12" stroke-width="2.5"/>';
        s += texture;
        s += '<text x="80" y="150" font-size="12.5" font-weight="800" fill="#0D1117" text-anchor="middle">' + cap + '</text>';
        s += '<text x="80" y="168" font-size="10.5" fill="' + cc + '" text-anchor="middle" font-weight="700">' + sub + '</text>';
        s += '</svg>';
        return s;
      }
      return flat('<div class="dzrow">' +
        liver('#F87171', '', '정상', '매끈합니다', '#059669') +
        liver('#FCD34D', '<circle cx="60" cy="62" r="5" fill="#FDE68A"/><circle cx="92" cy="80" r="6" fill="#FDE68A"/><circle cx="72" cy="98" r="4" fill="#FDE68A"/>',
              '지방간', '아직 되돌릴 여지', '#65A30D') +
        liver('#C084FC', '<path d="M40 60 L120 74 M36 84 L112 96 M46 104 L104 114" stroke="#7E22CE" stroke-width="2.5"/>',
              '섬유화', '굳기 시작', '#D97706') +
        liver('#9CA3AF', '<circle cx="54" cy="58" r="9" fill="#6B7280"/><circle cx="86" cy="70" r="11" fill="#6B7280"/>' +
              '<circle cx="66" cy="96" r="10" fill="#6B7280"/><circle cx="104" cy="98" r="8" fill="#6B7280"/>',
              '간경변', '되돌아오지 않음', '#DC2626') +
        '</div>');
    }
  };

  /* ═══ 9. 진단비와 치료비는 다른 지갑입니다 ═══ */
  V.wallets = {
    t: '한 사건, 여러 지갑',
    d: '고객은 「암보험 있어요」 라고 말하지만, 실제로는 <b>지갑이 여러 개</b> 열립니다. ' +
       '진단만으로 열리는 지갑, 치료를 받아야 열리는 지갑, 쓴 만큼만 돌려주는 지갑이 서로 다릅니다. ' +
       '하나가 비어 있으면 그 자리는 그대로 본인 몫입니다.',
    dz: ['cancer_major', 'cancer_blood', 'stroke', 'mi'],
    build: function () {
      var W = [
        ['진단비', '확진되면 한 번', '#1A56DB', '치료 방법을 고를 수 있게'],
        ['수술·시술비', '수술을 받으면', '#7C3AED', '시술은 인정이 갈립니다'],
        ['치료비', '치료를 받을 때마다', '#059669', '표적·면역은 여기'],
        ['입원일당', '입원한 날짜만큼', '#D97706', '한도일수를 봅니다'],
        ['실손', '쓴 만큼 돌려받음', '#0891B2', '세대가 부담을 가릅니다']
      ];
      var s = '<svg viewBox="0 0 660 210" width="660" height="210">';
      s += '<rect x="14" y="14" width="632" height="40" rx="12" fill="#0F172A"/>';
      s += '<text x="330" y="40" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">한 번의 진단 · 한 번의 입원</text>';
      W.forEach(function (w, i) {
        var x = 14 + i * 128;
        s += '<path d="M330 54 L' + (x + 56) + ' 84" stroke="' + w[2] + '" stroke-width="2.5" opacity=".6"/>';
        s += '<rect x="' + x + '" y="84" width="112" height="112" rx="14" fill="' + w[2] + '" opacity=".12" stroke="' + w[2] + '" stroke-width="2"/>';
        s += '<rect x="' + x + '" y="84" width="112" height="28" rx="12" fill="' + w[2] + '"/>';
        s += '<text x="' + (x + 56) + '" y="103" font-size="12.5" font-weight="800" fill="#fff" text-anchor="middle">' + w[0] + '</text>';
        s += '<text x="' + (x + 56) + '" y="132" font-size="11" fill="#374151" text-anchor="middle">' + w[1] + '</text>';
        s += '<text x="' + (x + 56) + '" y="164" font-size="10.5" fill="#6B7280" text-anchor="middle">' + w[3].slice(0, 10) + '</text>';
        s += '<text x="' + (x + 56) + '" y="180" font-size="10.5" fill="#6B7280" text-anchor="middle">' + w[3].slice(10) + '</text>';
      });
      s += '</svg>';
      return flat(s);
    }
  };

  /* ═══ 10. 같은 「암」인데 칸이 둘입니다 ═══ */
  V.minor_cancer = {
    t: '같은 「암」인데 칸이 둘입니다',
    d: '진단서에 암이라고 적혀 있어도 보험은 <b>두 칸</b>으로 나눠 놓았습니다. 갑상선암·제자리암·경계성종양은 유사암 칸에 들어가 ' +
       '일반암의 10~20% 가 통상입니다. 이 그림을 <b>가입할 때</b> 보여 드리면, 나중에 항의가 아니라 이해가 됩니다.',
    dz: ['thyroid', 'cancer_female'],
    build: function () {
      var s = '<svg viewBox="0 0 620 240" width="620" height="240">';
      s += '<rect x="16" y="16" width="588" height="36" rx="12" fill="#0F172A"/>';
      s += '<text x="310" y="41" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">진단서에 적힌 말 — 「암」</text>';
      /* 왼쪽 일반암 */
      s += '<path d="M310 52 L180 86" stroke="#1A56DB" stroke-width="3"/>';
      s += '<rect x="30" y="86" width="272" height="132" rx="16" fill="#EFF4FF" stroke="#1A56DB" stroke-width="2.5"/>';
      s += '<rect x="30" y="86" width="272" height="32" rx="14" fill="#1A56DB"/>';
      s += '<text x="166" y="108" font-size="13.5" font-weight="800" fill="#fff" text-anchor="middle">일반암 칸</text>';
      s += '<text x="46" y="140" font-size="12" fill="#374151">위·폐·간·췌·대장·유방 등</text>';
      s += '<text x="46" y="164" font-size="12" fill="#374151">가입금액 그대로 지급</text>';
      s += '<rect x="46" y="176" width="240" height="28" rx="8" fill="#1A56DB" opacity=".16"/>';
      s += '<text x="166" y="195" font-size="13" font-weight="800" fill="#1A56DB" text-anchor="middle">예: 5,000만 → 5,000만</text>';
      /* 오른쪽 유사암 */
      s += '<path d="M310 52 L452 86" stroke="#D97706" stroke-width="3"/>';
      s += '<rect x="318" y="86" width="286" height="132" rx="16" fill="#FFFBEB" stroke="#D97706" stroke-width="2.5"/>';
      s += '<rect x="318" y="86" width="286" height="32" rx="14" fill="#D97706"/>';
      s += '<text x="461" y="108" font-size="13.5" font-weight="800" fill="#fff" text-anchor="middle">유사암 칸 (소액암)</text>';
      s += '<text x="334" y="140" font-size="12" fill="#374151">갑상선암 · 제자리암 · 경계성종양</text>';
      s += '<text x="334" y="164" font-size="12" fill="#374151">일반암의 10~20% 가 통상</text>';
      s += '<rect x="334" y="176" width="254" height="28" rx="8" fill="#D97706" opacity=".18"/>';
      s += '<text x="461" y="195" font-size="13" font-weight="800" fill="#B45309" text-anchor="middle">예: 5,000만 → 500만 수준</text>';
      s += '<text x="310" y="234" font-size="11" fill="#6B7280" text-anchor="middle">금액은 구조를 보여 주는 예시입니다 — 실제 비율과 지급은 가입한 약관이 정합니다</text>';
      s += '</svg>';
      return flat(s);
    }
  };

  /* ── 바깥에 내주는 문 ─────────────────────────────────────── */
  var KEYS = ['wall_layer', 'minor_cancer', 'vessel', 'brain_open', 'approach', 'dialysis', 'joint', 'dementia_step', 'liver_step', 'wallets'];
  window.DZ_VIZ = {
    keys: KEYS,
    /* 손으로 그린 도해입니다 — 어디에 쓰든 이 말을 함께 답니다 */
    note: '설명을 위해 <b>직접 그린 도식</b>입니다. 실제 몸의 모양·비율과 다르며, 진단이나 치료를 대신하지 않습니다.',
    get: function (k) {
      var v = V[k];
      if (!v) return null;
      return { k: k, t: v.t, d: v.d, dz: v.dz, html: v.build() };
    },
    /* 이 질병에 붙는 도해들 */
    forDz: function (id) {
      var out = [], i;
      for (i = 0; i < KEYS.length; i++) {
        if (V[KEYS[i]].dz.indexOf(id) >= 0) out.push(window.DZ_VIZ.get(KEYS[i]));
      }
      return out;
    },
    /* 끌어서 돌리기 — 화면에 붙인 뒤 한 번 불러 준다 */
    bind: function (root) {
      var list = (root || document).querySelectorAll('.dz3d');
      Array.prototype.forEach.call(list, function (el) {
        if (el._bound) return;
        el._bound = true;
        var st = el.querySelector('.dz3d-stage');
        var boxEl = el.querySelector('.dz3d-box') || el;
        var rx = parseFloat(el.getAttribute('data-rx')) || 56;
        var ry = parseFloat(el.getAttribute('data-ry')) || -18;
        var on = false, px = 0, py = 0;
        function paint() {
          st.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
        }
        function down(x, y) { on = true; px = x; py = y; el.classList.add('dragging'); }
        /* 너무 많이 돌리면 판이 실오라기가 되어 아무것도 안 보인다.
           보이는 각도 안에서만 돌게 묶어 둔다. */
        function move(x, y) {
          if (!on) return;
          ry += (x - px) * 0.30;
          rx -= (y - py) * 0.30;
          if (rx > 72) rx = 72; if (rx < 44) rx = 44;
          if (ry > 8) ry = 8; if (ry < -48) ry = -48;
          px = x; py = y; paint();
        }
        function up() { on = false; el.classList.remove('dragging'); }
        boxEl.addEventListener('mousedown', function (e) { down(e.clientX, e.clientY); e.preventDefault(); });
        window.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); });
        window.addEventListener('mouseup', up);
        boxEl.addEventListener('touchstart', function (e) {
          if (e.touches.length !== 1) return;
          down(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        boxEl.addEventListener('touchmove', function (e) {
          if (!on || e.touches.length !== 1) return;
          move(e.touches[0].clientX, e.touches[0].clientY);
          e.preventDefault();
        }, { passive: false });
        boxEl.addEventListener('touchend', up);
      });
    }
  };
})();
