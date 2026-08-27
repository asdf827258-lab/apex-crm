/* ═══════════════════════════════════════════════════════════════
   3D 도해 라이브러리 — 코어 + 본문 도해
   사용법 : 커리큘럼 블록에  {t:"fig",x:"도해이름"}
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ───────── 팔레트 ───────── */
var T = {
  b:{f:'#e8f3ff',s:'#bcd8fa',d:'#9cc4f5',t:'#1957b8'},   // 파랑
  B:{f:'#3182f6',s:'#1b64da',d:'#164c9f',t:'#ffffff'},   // 진파랑(강조)
  g:{f:'#e7f8f2',s:'#aee2cf',d:'#8fd4bb',t:'#026e51'},   // 초록
  G:{f:'#02a678',s:'#028462',d:'#016348',t:'#ffffff'},
  o:{f:'#fff4e6',s:'#f4d3a4',d:'#eabf85',t:'#a35400'},   // 주황
  O:{f:'#ff8a00',s:'#d97400',d:'#b35f00',t:'#ffffff'},
  r:{f:'#ffeff0',s:'#f8c2c7',d:'#f0a6ad',t:'#c0303b'},   // 빨강
  R:{f:'#f04452',s:'#c9313d',d:'#a52630',t:'#ffffff'},
  n:{f:'#ffffff',s:'#e5e8eb',d:'#d1d6db',t:'#333d4b'},   // 흰
  m:{f:'#f2f4f6',s:'#e0e4e8',d:'#cdd2d8',t:'#4e5968'},   // 회
  k:{f:'#333d4b',s:'#191f28',d:'#0d1117',t:'#ffffff'}    // 검정
};
var INK='#191f28', INK2='#4e5968', INK3='#8b95a1', LINE='#e5e8eb';
function esc(s){return String(s).replace(/&(?!#?\w+;)/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

/* ───────── 3D 박스 ───────── */
function box(x,y,w,h,tone,o){
  o=o||{}; var c=T[tone]||T.n, r=(o.r===0?0:(o.r||13)), z=(o.z===0?0:(o.z||5));
  var s='';
  if(z) s+='<rect x="'+(x+z)+'" y="'+(y+z)+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+c.d+'" opacity="'+(o.zo||.55)+'"/>';
  s+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+c.f+'" stroke="'+c.s+'" stroke-width="'+(o.sw||1.4)+'"/>';
  return s;
}
/* 라벨 있는 3D 박스 : 제목 + 여러 줄 */
function card(x,y,w,h,tone,title,lines,o){
  o=o||{}; var c=T[tone]||T.n, s=box(x,y,w,h,tone,o);
  var cx=x+w/2, ty=y+(o.ty||24);
  if(title) s+=tx(cx,ty,title,{size:o.ts||13.5,w:800,fill:o.tc||c.t});
  (lines||[]).forEach(function(L,i){
    s+=tx(cx, ty+(o.gap||18)+i*(o.lh||16), L, {size:o.ls||11.5,w:500,fill:o.lc||(tone==='k'||tone==='B'||tone==='R'||tone==='G'||tone==='O'?'rgba(255,255,255,.82)':INK2)});
  });
  return s;
}
/* 텍스트 */
function tx(x,y,s,o){
  o=o||{};
  return '<text x="'+x+'" y="'+y+'" text-anchor="'+(o.a||'middle')+'" '+
    'font-size="'+(o.size||12)+'" font-weight="'+(o.w||600)+'" fill="'+(o.fill||INK2)+'"'+
    (o.ls?' letter-spacing="'+o.ls+'"':'')+'>'+s+'</text>';
}
/* 화살표 */
function ar(x1,y1,x2,y2,o){
  o=o||{};
  return '<path d="M'+x1+' '+y1+' L'+x2+' '+y2+'" stroke="'+(o.c||'#a8b0b8')+'" stroke-width="'+(o.w||2.2)+
    '" fill="none" marker-end="url(#mk)"'+(o.dash?' stroke-dasharray="'+o.dash+'"':'')+'/>';
}
function ln(x1,y1,x2,y2,o){
  o=o||{};
  return '<path d="M'+x1+' '+y1+' L'+x2+' '+y2+'" stroke="'+(o.c||LINE)+'" stroke-width="'+(o.w||3)+
    '" fill="none" stroke-linecap="round"'+(o.dash?' stroke-dasharray="'+o.dash+'"':'')+'/>';
}
function wrap(vb,inner){ return '<svg viewBox="0 0 720 '+vb+'" role="img" aria-label="도해">'+inner+'</svg>'; }

/* ───────── 재사용 차트 ───────── */
/* 가로 막대 : rows=[{n,v,c,note}] */
function bars(rows, o){
  o=o||{};
  var x0=o.x0||186, W=o.W||480, top=o.top||34, bh=o.bh||30, gap=o.gap||13;
  var max=o.max||Math.max.apply(null,rows.map(function(r){return r.v;}));
  var s = o.title? tx(360,20,o.title,{size:13.5,w:800,fill:INK}):'';
  rows.forEach(function(r,i){
    var y=top+i*(bh+gap), w=Math.max(4, W*r.v/max), c=T[r.c||'B'];
    s+=tx(x0-12,y+bh/2+4,r.n,{a:'end',size:12,w:700,fill:INK});
    s+='<rect x="'+x0+'" y="'+y+'" width="'+W+'" height="'+bh+'" rx="8" fill="#f2f4f6"/>';
    s+='<rect x="'+(x0+3)+'" y="'+(y+3)+'" width="'+w+'" height="'+bh+'" rx="8" fill="'+c.d+'" opacity=".45"/>';
    s+='<rect x="'+x0+'" y="'+y+'" width="'+w+'" height="'+bh+'" rx="8" fill="'+c.f+'" stroke="'+c.s+'" stroke-width="1.2"/>';
    var inside = w>150;
    s+=tx(inside?(x0+w-12):(x0+w+10), y+bh/2+4.5, r.note||'', {a:inside?'end':'start',size:11.8,w:800,fill:inside?(c.t):INK2});
  });
  return {h: top+rows.length*(bh+gap)+4, s:s};
}
/* 단계 흐름 : items=[{t,d,c}] */
function flow(items,o){
  o=o||{};
  var n=items.length, pad=o.pad||14, W=720-pad*2, gapx=o.gapx||16;
  var w=(W-(n-1)*gapx)/n, h=o.h||96, y=o.y||34;
  var s = o.title? tx(360,20,o.title,{size:13.5,w:800,fill:INK}):'';
  items.forEach(function(it,i){
    var x=pad+i*(w+gapx);
    s+=card(x,y,w,h,it.c||'b','',[],{});
    s+=tx(x+w/2,y+24,'<tspan font-size="10.5" fill="'+INK3+'">'+(i+1)+'</tspan>',{size:10.5});
    s+=tx(x+w/2,y+44,it.t,{size:12.8,w:800,fill:T[it.c||'b'].t});
    (it.d||[]).forEach(function(d,j){ s+=tx(x+w/2,y+62+j*15,d,{size:10.8,w:500,fill:INK2}); });
    if(i<n-1) s+=ar(x+w+2,y+h/2,x+w+gapx-3,y+h/2);
  });
  return {h:y+h+8, s:s};
}
/* 타임라인 : pts=[{x%,t,d[],c}] */
function timeline(pts,o){
  o=o||{};
  var y=o.y||96, L=54, R=666;
  var s = o.title? tx(360,20,o.title,{size:13.5,w:800,fill:INK}):'';
  if(o.sub) s+=tx(360,38,o.sub,{size:11.5,w:500,fill:INK3});
  s+=ln(L,y,R,y,{w:4});
  pts.forEach(function(p){
    var x=L+(R-L)*p.p, c=T[p.c||'B'];
    s+='<circle cx="'+x+'" cy="'+y+'" r="'+(p.big?10:8)+'" fill="'+c.f+'" stroke="'+c.s+'" stroke-width="3"/>';
    s+=tx(x,y-20,p.t,{size:12.4,w:800,fill:INK});
    (p.d||[]).forEach(function(d,j){ s+=tx(x,y+26+j*16,d,{size:11,w:500,fill:INK2}); });
  });
  return {h:y+30+(o.rows||2)*16, s:s};
}
/* 좌우 비교 */
function split(A,B,o){
  o=o||{};
  var y=o.y||34, h=o.h||o.hh||160, w=336;
  var s = o.title? tx(360,20,o.title,{size:13.5,w:800,fill:INK}):'';
  [[14,A],[370,B]].forEach(function(pair){
    var x=pair[0], D=pair[1];
    s+=box(x,y,w,h,D.c||'n',{});
    s+=tx(x+w/2,y+27,D.t,{size:14,w:800,fill:T[D.c||'n'].t});
    if(D.s) s+=tx(x+w/2,y+46,D.s,{size:11,w:600,fill:INK3});
    (D.d||[]).forEach(function(L,i){
      s+=tx(x+w/2, y+(D.s?68:56)+i*17, L, {size:11.6,w:500,fill:INK2});
    });
  });
  if(o.vs) s+=tx(360,y+h/2+5,'vs',{size:12,w:800,fill:INK3});
  return {h:y+h+8, s:s};
}
/* 매트릭스 (히트맵) : cols[], rows=[{n,v:[..]}]  v: 'O'|'D'|'X'|텍스트 */
function matrix(cols,rows,o){
  o=o||{};
  var x0=o.x0||150, W=720-x0-16, cw=W/cols.length, rh=o.rh||30, y0=o.y0||46;
  var s = o.title? tx(360,20,o.title,{size:13.5,w:800,fill:INK}):'';
  cols.forEach(function(c,i){ s+=tx(x0+cw*i+cw/2, y0-10, c, {size:11.2,w:800,fill:INK2}); });
  rows.forEach(function(r,ri){
    var y=y0+ri*rh;
    s+=tx(x0-10,y+rh/2+4,r.n,{a:'end',size:11.6,w:700,fill:INK});
    r.v.forEach(function(v,ci){
      var x=x0+cw*ci, tone = v==='O'?'g':(v==='X'?'r':(v==='△'||v==='D'?'o':'m'));
      var c=T[tone];
      s+='<rect x="'+(x+2)+'" y="'+(y+2)+'" width="'+(cw-4)+'" height="'+(rh-4)+'" rx="7" fill="'+c.f+'" stroke="'+c.s+'" stroke-width="1.1"/>';
      var lab = v==='O'?'○':(v==='X'?'×':(v==='D'?'△':v));
      s+=tx(x+cw/2,y+rh/2+4.5,lab,{size:(lab.length>2?10.4:13),w:800,fill:c.t});
    });
  });
  return {h:y0+rows.length*rh+8, s:s};
}
/* 스택 바 (예산·구성) : segs=[{n,v,c}] */
function stack(segs,o){
  o=o||{};
  var x0=o.x0||40, W=640, y=o.y||44, h=o.h||46;
  var tot=segs.reduce(function(a,b){return a+b.v;},0);
  var s = o.title? tx(360,20,o.title,{size:13.5,w:800,fill:INK}):'';
  var x=x0;
  segs.forEach(function(g,i){
    var w=W*g.v/tot, c=T[g.c||'B'];
    s+='<rect x="'+(x+4)+'" y="'+(y+5)+'" width="'+w+'" height="'+h+'" rx="9" fill="'+c.d+'" opacity=".45"/>';
    s+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="9" fill="'+c.f+'" stroke="'+c.s+'" stroke-width="1.3"/>';
    if(w>52) s+=tx(x+w/2,y+h/2+4.5,g.pct||(Math.round(g.v/tot*100)+'%'),{size:12,w:800,fill:c.t});
    s+=tx(x+w/2, y+h+22, g.n, {size:10.8,w:700,fill:INK2});
    x+=w;
  });
  return {h:y+h+34, s:s};
}
/* 피라미드 / 계층 */
function layers(rows,o){
  o=o||{};
  var y=o.y||34, h=o.lh||42, gap=o.gap||9, cx=360;
  var s = o.title? tx(360,20,o.title,{size:13.5,w:800,fill:INK}):'';
  rows.forEach(function(r,i){
    var w=(o.w0||300)+i*(o.step||88), x=cx-w/2, yy=y+i*(h+gap);
    s+=box(x,yy,w,h,r.c||'b',{r:11});
    s+=tx(cx,yy+18,r.t,{size:12.6,w:800,fill:T[r.c||'b'].t});
    if(r.d) s+=tx(cx,yy+34,r.d,{size:10.8,w:500,fill:INK2});
  });
  return {h:y+rows.length*(h+gap)+6, s:s};
}

/* ───────── 도해 정의 ───────── */
var F = {};
function reg(name,fn){ F[name]=fn; }
function S(o){ return wrap(o.h,o.s); }

/* ═══ LEVEL 0 ═══ */
reg('l0-3month', function(){
  var s = tx(360,20,'신입 6개월 — 두 갈래로 갈린다',{size:13.5,w:800,fill:INK});
  s += ln(60,196,672,196,{w:2.5,c:LINE});
  s += ln(60,40,60,196,{w:2.5,c:LINE});
  ['1개월','2개월','3개월','4개월','5개월','6개월'].forEach(function(m,i){
    s += tx(60+(i+1)*100, 214, m, {size:10.8,w:600,fill:INK3});
  });
  /* 상품 암기 경로 */
  s += '<path d="M60 150 C 160 120, 240 108, 360 130 S 560 190, 660 192" fill="none" stroke="'+T.R.f+'" stroke-width="4" stroke-linecap="round"/>';
  s += tx(600,168,'상품명부터 외운 사람',{a:'end',size:11.6,w:800,fill:T.r.t});
  s += tx(600,184,'초반엔 말이 되지만 질문에서 무너진다',{a:'end',size:10.4,w:500,fill:INK3});
  /* 구조 이해 경로 */
  s += '<path d="M60 178 C 180 176, 250 160, 360 122 S 540 66, 660 48" fill="none" stroke="'+T.G.f+'" stroke-width="4" stroke-linecap="round"/>';
  s += tx(646,38,'손실 구조부터 외운 사람',{a:'end',size:11.6,w:800,fill:T.g.t});
  s += tx(646,54,'3개월째부터 갈라진다',{a:'end',size:10.4,w:500,fill:INK3});
  s += '<circle cx="360" cy="126" r="7" fill="#fff" stroke="'+T.O.f+'" stroke-width="3.5"/>';
  s += tx(360,104,'분기점 — 3개월',{size:11,w:800,fill:T.o.t});
  s += tx(28,118,'실 력',{size:11,w:700,fill:INK3});
  return wrap(232, s);
});

reg('l0-two-intro', function(){
  return S(split(
    {c:'r',t:'"좋은 상품 나왔습니다"',s:'상품을 파는 사람',
     d:['고객은 이미 여러 번 들은 말이다','비교 대상이 되는 순간 가격 싸움','상품이 바뀌면 할 말이 없어진다','재계약·소개가 나오지 않는다']},
    {c:'g',t:'"돈이 언제 끊기는지 보겠습니다"',s:'위험을 관리하는 사람',
     d:['고객이 처음 듣는 각도','비교 대상이 아니라 진단이 된다','상품이 바뀌어도 논리가 남는다','점검 명분이 계속 생긴다']},
    {title:'첫 30초에 무엇을 말하느냐가 나머지를 정한다', h:150, vs:true}));
});

reg('l0-routine', function(){
  return S(flow([
    {c:'b',t:'읽기 25분',d:['본문 1섹션','밑줄 대신 질문 적기']},
    {c:'b',t:'그림 5분',d:['도해만 다시 보기','설명해보기']},
    {c:'o',t:'셀프체크',d:['틀리면 그 자리로','바로 되돌아간다']},
    {c:'g',t:'화법 소리내기',d:['눈으로 읽지 말 것','입으로 3번']},
    {c:'B',t:'검색 습관',d:['모르는 단어는','즉시 검색창에']}
  ],{title:'하루 40분 — 이 순서를 지키면 2주에 한 바퀴', h:104}));
});

/* ═══ LEVEL 1 ═══ */
reg('l1-receipt', function(){
  var s = tx(360,20,'진료비 계산서 · 영수증 — 볼 곳은 딱 세 군데',{size:13.5,w:800,fill:INK});
  s += box(24,34,672,196,'n',{r:14});
  s += tx(360,56,'진 료 비 계 산 서 · 영 수 증',{size:12.5,w:800,fill:INK,ls:'.14em'});
  s += ln(40,66,680,66,{w:1.5});
  /* 항목 열 */
  var items=['진찰료','입원료','투약·조제료','주사료','마취료','처치 및 수술료','검사료','영상진단료','치료재료대','선택진료료'];
  s += tx(120,86,'항목',{size:11,w:800,fill:INK3});
  s += tx(330,86,'급여',{size:11,w:800,fill:T.g.t});
  s += tx(560,86,'비급여',{size:11,w:800,fill:T.r.t});
  s += '<rect x="252" y="74" width="168" height="126" rx="9" fill="'+T.g.f+'" opacity=".55"/>';
  s += '<rect x="470" y="74" width="188" height="126" rx="9" fill="'+T.r.f+'" opacity=".7"/>';
  items.forEach(function(it,i){
    if(i>5) return;
    s += tx(120,106+i*15,it,{size:10.4,w:500,fill:INK2});
    s += tx(330,106+i*15,'· · · ·',{size:10,w:400,fill:INK3});
    s += tx(560,106+i*15, i===5?'1,434만원':'· · · ·', {size:i===5?11.4:10, w:i===5?800:400, fill:i===5?T.r.t:INK3});
  });
  s += tx(120,196,'…',{size:12,w:700,fill:INK3});
  s += ln(40,208,680,208,{w:1.5});
  /* 하단 3칸 */
  var box3=[['⑥ 진료비 총액','19,842,110','m','여기 보지 마세요'],
            ['⑦ 공단부담','4,180,900','m','고객 돈 아님'],
            ['⑧ 환자부담 총액','15,861,210','R','← 이 숫자만 보여준다']];
  box3.forEach(function(b,i){
    var x=32+i*222, w=210;
    s += card(x,220,w,0,'n',null,null,{});
  });
  s = s.replace(/$/,'');
  var s2='';
  box3.forEach(function(b,i){
    var x=32+i*222, w=210, y=244;
    s2 += box(x,y,w,64,b[2],{r:12});
    s2 += tx(x+w/2,y+22,b[0],{size:11.4,w:800,fill:T[b[2]].t});
    s2 += tx(x+w/2,y+42,b[1]+' 원',{size:13.6,w:800,fill:b[2]==='R'?'#fff':INK});
    s2 += tx(x+w/2,y+58,b[3],{size:10,w:600,fill:b[2]==='R'?'rgba(255,255,255,.85)':INK3});
  });
  s2 += tx(360,332,'비급여 칸에서 <tspan font-weight="800" fill="'+T.r.t+'">금액이 가장 큰 항목</tspan>을 찾으면, 그것이 이 치료비의 진짜 원인이다',{size:11.8,w:600,fill:INK2});
  return wrap(348, s+s2);
});

reg('l1-teukrye', function(){
  var s = tx(360,20,'산정특례는 왜 있는데도 파산하는가',{size:13.5,w:800,fill:INK});
  s += tx(360,38,'특례는 급여 칸에만 들어간다',{size:11.4,w:500,fill:INK3});
  /* 급여 경로 */
  s += box(24,56,320,120,'g',{r:14});
  s += tx(184,80,'급여 치료비 1,000만원',{size:12.6,w:800,fill:T.g.t});
  s += '<rect x="48" y="94" width="272" height="24" rx="7" fill="#fff" stroke="'+T.g.s+'"/>';
  s += '<rect x="48" y="94" width="14" height="24" rx="7" fill="'+T.G.f+'"/>';
  s += tx(184,133,'산정특례 적용 → 본인부담 <tspan font-weight="800" fill="'+T.g.t+'">5%</tspan>',{size:11.6,w:600,fill:INK2});
  s += tx(184,155,'실제 낼 돈  50만원',{size:13,w:800,fill:INK});
  /* 비급여 경로 */
  s += box(376,56,320,120,'r',{r:14});
  s += tx(536,80,'비급여 치료비 1,000만원',{size:12.6,w:800,fill:T.r.t});
  s += '<rect x="400" y="94" width="272" height="24" rx="7" fill="#fff" stroke="'+T.r.s+'"/>';
  s += '<rect x="400" y="94" width="272" height="24" rx="7" fill="'+T.R.f+'"/>';
  s += tx(536,133,'특례 <tspan font-weight="800" fill="'+T.r.t+'">적용 안 됨</tspan> → 본인부담 100%',{size:11.6,w:600,fill:INK2});
  s += tx(536,155,'실제 낼 돈  1,000만원',{size:13,w:800,fill:INK});
  /* 아래 결론 */
  s += box(24,192,672,70,'k',{r:14});
  s += tx(360,216,'같은 암, 같은 병원 — 로봇수술을 고르는 순간 특례는 무력화된다',{size:12.6,w:800,fill:'#fff'});
  s += tx(360,240,'실측 : 갑상선암 로봇수술 본인부담 1,586만원 (비급여 처치·수술료 1,434만)',{size:11.2,w:500,fill:'rgba(255,255,255,.8)'});
  return wrap(276, s);
});

reg('l1-notcancer', function(){
  var b = bars([
    {n:'척추유합술',   v:74, c:'R', note:'본인부담 1,102만 · 74%'},
    {n:'하지정맥류',   v:94, c:'R', note:'본인부담 350만 · 94%'},
    {n:'백내장(다초점)',v:88, c:'O', note:'치료재료대 354만'},
    {n:'무릎 인공관절', v:52, c:'O', note:'비급여 비중 절반'},
    {n:'암 · 급여 치료', v:6, c:'G', note:'본인부담 2.2만'}
  ],{title:'암이 아니어도 무너진다 — 총액 대비 본인부담 비율', max:100});
  b.s += tx(360,b.h+16,'암 · 뇌 · 심장 담보만 채우면 <tspan font-weight="800" fill="'+T.r.t+'">위 네 줄이 통째로 빈다</tspan>',{size:11.8,w:600,fill:INK2});
  return wrap(b.h+30, b.s);
});

reg('l1-income', function(){
  var t = timeline([
    {p:0,   c:'B', t:'발병', d:['소득 100%','저축 그대로']},
    {p:.22, c:'O', t:'입원 · 수술', d:['병가 · 무급 시작','치료비 지출 집중']},
    {p:.48, c:'R', t:'치료 6개월', d:['소득 0~30%','생활비는 그대로']},
    {p:.72, c:'o', t:'복직 시도', d:['체력 저하','부서 이동 · 감봉']},
    {p:1,   c:'m', t:'1~2년 뒤', d:['소득 회복 or 이직','저축은 이미 소진']}
  ],{title:'소득공백 — 보험금이 닿지 않는 가장 큰 손실', sub:'치료비는 실손이 막지만, 안 벌리는 돈은 아무도 안 준다', rows:2});
  var s=t.s;
  s += '<rect x="54" y="46" width="612" height="26" rx="8" fill="'+T.r.f+'" stroke="'+T.r.s+'"/>';
  s += tx(360,64,'이 구간을 메우는 건 진단비 · 생활비 담보뿐이다',{size:11.4,w:700,fill:T.r.t});
  return wrap(t.h+8, s);
});

/* ═══ LEVEL 2 ═══ */
reg('l2-why-gen', function(){
  var s = tx(360,20,'실손은 왜 4번이나 바뀌었나 — 손해율의 악순환',{size:13.5,w:800,fill:INK});
  var cyc=[['비급여 진료 증가','o'],['보험사 손해율 상승','r'],['보험료 인상','r'],['가입자 이탈 · 민원','o'],['제도 개편 (새 세대)','b']];
  var cx=360, cy=150, R=98;
  cyc.forEach(function(c,i){
    var a=(-90+i*72)*Math.PI/180, x=cx+R*Math.cos(a)*1.9, y=cy+R*Math.sin(a);
    s += box(x-88,y-22,176,44,c[1],{r:11,z:4});
    s += tx(x,y+5,c[0],{size:11.5,w:800,fill:T[c[1]].t});
  });
  s += '<circle cx="'+cx+'" cy="'+cy+'" r="46" fill="#fff" stroke="'+LINE+'" stroke-width="2"/>';
  s += tx(cx,cy-4,'손해율',{size:12.6,w:800,fill:INK});
  s += tx(cx,cy+14,'악순환',{size:12.6,w:800,fill:INK});
  s += tx(360,290,'세대가 바뀐 건 상품 개선이 아니라 <tspan font-weight="800" fill="'+T.r.t+'">비급여를 통제하려는 시도</tspan>였다',{size:11.8,w:600,fill:INK2});
  return wrap(306, s);
});

reg('l2-exclusion', function(){
  var m = matrix(['1세대','2세대','3세대','4세대'],[
    {n:'자기부담률',      v:['0~20%','10~20%','급여10/20·비급여20~30%','급여20·비급여30%']},
    {n:'도수 · 체외충격파',v:['O','O','특약 분리','특약 · 350만·50회']},
    {n:'비급여 주사',      v:['O','O','특약 분리','특약 · 250만·50회']},
    {n:'MRI · MRA',       v:['O','O','특약 분리','특약 · 300만']},
    {n:'보험료 차등',      v:['X','X','X','O · 최대 +300%']},
    {n:'재가입 주기',      v:['없음','15년','15년','5년']}
  ],{title:'세대별 「보상하지 않는 손해」는 이렇게 늘어났다', rh:32});
  m.s += tx(360,m.h+16,'구실손을 가진 고객에게 <tspan font-weight="800" fill="'+T.r.t+'">먼저 해지를 말하면 안 되는 이유</tspan>가 이 표에 있다',{size:11.6,w:600,fill:INK2});
  return wrap(m.h+30, m.s);
});

reg('l2-switch', function(){
  var s = tx(360,20,'4세대 전환 — 이 세 갈래로만 판단한다',{size:13.5,w:800,fill:INK});
  s += box(268,36,184,50,'k',{r:12});
  s += tx(360,58,'고객이 작년에',{size:11.6,w:700,fill:'#fff'});
  s += tx(360,75,'비급여를 얼마나 썼나?',{size:11.6,w:800,fill:'#fff'});
  s += ar(300,88,150,118);
  s += ar(360,88,360,118);
  s += ar(420,88,570,118);
  var opt=[
    {x:14,c:'g',t:'거의 안 씀',d:['도수·주사·MRI 연 0~2회','급여 위주 진료'],r:'4세대 전환 검토',n:'보험료가 크게 내려간다'},
    {x:246,c:'o',t:'보통',d:['연 3~10회','아직 판단 이름'],r:'1년 더 지켜본다',n:'전환은 되돌릴 수 없다'},
    {x:478,c:'r',t:'많이 씀',d:['도수치료 정기','만성 통증·재활'],r:'전환하지 않는다',n:'4세대면 보험료가 최대 3배'}
  ];
  opt.forEach(function(o){
    s += box(o.x,120,228,148,o.c,{r:13});
    s += tx(o.x+114,144,o.t,{size:13,w:800,fill:T[o.c].t});
    o.d.forEach(function(d,i){ s += tx(o.x+114,166+i*16,d,{size:10.8,w:500,fill:INK2}); });
    s += ln(o.x+22,204,o.x+206,204,{w:1.5});
    s += tx(o.x+114,226,o.r,{size:12.4,w:800,fill:INK});
    s += tx(o.x+114,248,o.n,{size:10.6,w:500,fill:INK3});
  });
  s += tx(360,290,'전환은 <tspan font-weight="800" fill="'+T.r.t+'">되돌릴 수 없다</tspan>. 확신이 없으면 하지 않는 것이 정답이다',{size:11.8,w:600,fill:INK2});
  return wrap(306, s);
});

reg('l2-gap', function(){
  var s = tx(360,20,'실손이 절대 못 막는 네 가지',{size:13.5,w:800,fill:INK});
  s += box(24,38,672,58,'b',{r:13});
  s += tx(360,64,'실손이 하는 일 — 「이미 쓴 치료비」의 일부 회수',{size:12.6,w:800,fill:T.b.t});
  s += tx(360,84,'자기부담을 뺀 나머지를, 영수증이 있어야, 치료비 항목에 한해서',{size:10.8,w:500,fill:INK2});
  var g=[
    {t:'안 벌린 돈',d:['휴직·감봉·폐업','실손은 소득을 안 본다'],c:'r'},
    {t:'간병비',d:['간병인 일당 12~15만','치료비가 아니다'],c:'r'},
    {t:'생활비',d:['월세·학원비·대출','치료와 무관하게 계속 나간다'],c:'r'},
    {t:'선택의 자유',d:['비급여 술식을 고를 목돈','실손은 사후 정산이다'],c:'o'}
  ];
  g.forEach(function(x,i){
    var X=14+i*178;
    s += box(X,112,166,116,x.c,{r:13});
    s += tx(X+83,140,x.t,{size:12.8,w:800,fill:T[x.c].t});
    x.d.forEach(function(d,j){ s += tx(X+83,166+j*17,d,{size:10.6,w:500,fill:INK2}); });
  });
  s += ar(360,232,360,254);
  s += box(146,258,428,52,'G',{r:13});
  s += tx(360,282,'그래서 진단비 · 생활비 · 간병 담보가 따로 존재한다',{size:12.4,w:800,fill:'#fff'});
  s += tx(360,300,'실손 하나로 끝났으면 이 담보들은 애초에 안 만들어졌다',{size:10.4,w:500,fill:'rgba(255,255,255,.85)'});
  return wrap(326, s);
});

/* ═══ LEVEL 3 — 암 ═══ */
reg('l3-era', function(){
  var t = timeline([
    {p:0,   c:'m', t:'~1990년대', d:['암 = 사망 위험','사망보험금 중심']},
    {p:.3,  c:'b', t:'2000년대',  d:['생존율 상승','진단비 등장']},
    {p:.62, c:'B', t:'2010년대',  d:['표적·면역치료','치료비가 폭증']},
    {p:1,   c:'G', t:'지금',      d:['오래 살면서 오래 쓴다','반복 지급형이 핵심'],big:true}
  ],{title:'왜 지금 진단비인가 — 암은 죽는 병에서 오래 앓는 병이 되었다', rows:2});
  var s=t.s;
  s += '<path d="M54 152 C 220 148, 380 140, 666 124" fill="none" stroke="'+T.G.f+'" stroke-width="3" stroke-dasharray="6 5"/>';
  s += tx(360,172,'생존율이 올라갈수록 <tspan font-weight="800" fill="'+T.g.t+'">치료 기간과 비용은 길어진다</tspan> — 목돈이 필요한 이유',{size:11.6,w:600,fill:INK2});
  return wrap(190, s);
});

reg('l3-biopsy', function(){
  var f = flow([
    {c:'m',t:'증상 · 검진',d:['혹이 만져진다','수치가 이상하다']},
    {c:'b',t:'영상검사',d:['초음파·CT·MRI','"암이 의심됩니다"']},
    {c:'O',t:'조직검사',d:['조직을 떼어','현미경으로 확인']},
    {c:'G',t:'확진 진단서',d:['C코드 부여','← 보험 지급 기준점']}
  ],{title:'암은 영상이 아니라 조직검사로 확진된다', h:100});
  var s=f.s;
  s += box(24,f.h+2,336,66,'r',{r:12});
  s += tx(192,f.h+26,'영상 단계에서는 보험금이 안 나온다',{size:11.8,w:800,fill:T.r.t});
  s += tx(192,f.h+46,'"암인 것 같다"는 진단확정이 아니다',{size:10.6,w:500,fill:INK2});
  s += box(376,f.h+2,320,66,'o',{r:12});
  s += tx(536,f.h+26,'검사 목적 수술은 수술비도 안 된다',{size:11.8,w:800,fill:T.o.t});
  s += tx(536,f.h+46,'생검·복강경 검사·세침흡인(천자) 모두 면책',{size:10.6,w:500,fill:INK2});
  s += tx(360,f.h+96,'첫 질문은 언제나 <tspan font-weight="800" fill="'+T.b.t+'">"조직검사 결과지 받으셨어요?"</tspan>',{size:12,w:700,fill:INK});
  return wrap(f.h+114, s);
});

reg('l3-tnm', function(){
  var s = tx(360,20,'병기(TNM)가 왜 돈을 바꾸는가',{size:13.5,w:800,fill:INK});
  var stg=[
    {t:'1기',d:['국소','내시경·최소절제'],c:'g',cost:26,n:'수백만원'},
    {t:'2기',d:['국소 진행','수술 + 보조 항암'],c:'b',cost:42,n:'1천만원대'},
    {t:'3기',d:['림프절 전이','수술 + 항암 + 방사선'],c:'o',cost:66,n:'수천만원'},
    {t:'4기',d:['원격 전이','표적·면역 장기 투여'],c:'r',cost:100,n:'1억 이상도'}
  ];
  stg.forEach(function(x,i){
    var X=14+i*178, H=x.cost*1.5;
    s += box(X+22,206-H,122,H,x.c,{r:10});
    s += tx(X+83,200-H,x.n,{size:11.4,w:800,fill:T[x.c].t});
    s += tx(X+83,228,x.t,{size:14,w:800,fill:INK});
    x.d.forEach(function(d,j){ s += tx(X+83,248+j*16,d,{size:10.6,w:500,fill:INK2}); });
  });
  s += ln(24,210,696,210,{w:2});
  s += box(24,290,672,56,'k',{r:13});
  s += tx(360,314,'T(크기) · N(림프절) · M(원격전이) — 세 글자가 치료 강도와 비용을 함께 정한다',{size:12,w:800,fill:'#fff'});
  s += tx(360,334,'조기 발견이 「생존율」만의 문제가 아닌 이유. 지갑도 여기서 갈린다',{size:10.6,w:500,fill:'rgba(255,255,255,.82)'});
  return wrap(362, s);
});

reg('l3-standard', function(){
  var s = tx(360,20,'표준치료 — 3대 축과 그 위에 얹히는 두 가지',{size:13.5,w:800,fill:INK});
  var base=[{t:'수술',d:'떼어낸다',c:'B'},{t:'항암제',d:'전신을 돈다',c:'B'},{t:'방사선',d:'국소를 태운다',c:'B'}];
  base.forEach(function(b,i){
    var X=44+i*216;
    s += box(X,150,196,92,b.c,{r:13});
    s += tx(X+98,186,b.t,{size:16,w:800,fill:'#fff'});
    s += tx(X+98,210,b.d,{size:11,w:500,fill:'rgba(255,255,255,.85)'});
  });
  s += box(84,44,252,84,'O',{r:13});
  s += tx(210,72,'표적치료',{size:14,w:800,fill:'#fff'});
  s += tx(210,94,'특정 유전자 변이를 겨냥',{size:10.8,w:500,fill:'rgba(255,255,255,.88)'});
  s += tx(210,112,'월 수백만원 · 장기 투여',{size:10.8,w:500,fill:'rgba(255,255,255,.88)'});
  s += box(384,44,252,84,'R',{r:13});
  s += tx(510,72,'면역치료',{size:14,w:800,fill:'#fff'});
  s += tx(510,94,'내 면역세포를 깨운다',{size:10.8,w:500,fill:'rgba(255,255,255,.88)'});
  s += tx(510,112,'급여 조건이 좁다 → 비급여',{size:10.8,w:500,fill:'rgba(255,255,255,.88)'});
  s += ar(210,132,210,146,{c:T.O.s});
  s += ar(510,132,510,146,{c:T.R.s});
  s += tx(360,268,'3대 축은 대체로 <tspan font-weight="800" fill="'+T.g.t+'">급여</tspan>, 위에 얹히는 두 가지가 <tspan font-weight="800" fill="'+T.r.t+'">비급여 폭탄</tspan>이 된다',{size:12,w:600,fill:INK2});
  s += tx(360,290,'암주요치료비 · 재발암 담보가 겨냥하는 곳이 바로 위쪽이다',{size:11,w:500,fill:INK3});
  return wrap(306, s);
});

reg('l3-5years', function(){
  var s = tx(360,20,'왜 하필 5년인가',{size:13.5,w:800,fill:INK});
  s += ln(60,120,660,120,{w:4});
  [0,1,2,3,4,5].forEach(function(y,i){
    var x=60+i*120;
    s += '<circle cx="'+x+'" cy="120" r="7" fill="#fff" stroke="'+(i===5?T.R.f:T.B.f)+'" stroke-width="3"/>';
    s += tx(x,144,y+'년',{size:11.4,w:700,fill:INK2});
  });
  s += '<rect x="60" y="66" width="600" height="34" rx="9" fill="'+T.g.f+'" stroke="'+T.g.s+'"/>';
  s += tx(360,88,'산정특례 — 등록일부터 5년간 급여 본인부담 5%',{size:11.6,w:800,fill:T.g.t});
  s += '<rect x="60" y="164" width="600" height="34" rx="9" fill="'+T.b.f+'" stroke="'+T.b.s+'"/>';
  s += tx(360,186,'암주요치료비 — 진단 후 5년까지 보상하는 상품이 많다',{size:11.6,w:800,fill:T.b.t});
  s += box(432,212,264,74,'r',{r:12});
  s += tx(564,238,'5년 뒤에 생기는 빈칸',{size:12.2,w:800,fill:T.r.t});
  s += tx(564,258,'특례 종료 + 주요치료비 종료',{size:10.6,w:500,fill:INK2});
  s += tx(564,274,'그런데 재발은 5년 뒤에도 온다',{size:10.6,w:500,fill:INK2});
  s += box(24,212,392,74,'G',{r:12});
  s += tx(220,238,'이 빈칸을 메우는 담보',{size:12.2,w:800,fill:'#fff'});
  s += tx(220,258,'재발암 진단비 — 암이 남아 있으면 2년마다 반복',{size:10.6,w:500,fill:'rgba(255,255,255,.86)'});
  s += tx(220,274,'종수술비 — 횟수 제한 없이 수술마다',{size:10.6,w:500,fill:'rgba(255,255,255,.86)'});
  s += tx(360,308,'"5년 지나면 완치죠?" — 통계 기준일 뿐, <tspan font-weight="800" fill="'+T.r.t+'">보장이 끝나는 날</tspan>이기도 하다',{size:11.8,w:600,fill:INK2});
  return wrap(324, s);
});

reg('l3-cancer-stat', function(){
  var b = bars([
    {n:'국민 1인 기대 암발생', v:38, c:'B', note:'약 5명 중 2명 (남 39% · 여 36%)'},
    {n:'5년 상대생존율',       v:72, c:'G', note:'약 72% — 30년 전의 두 배'},
    {n:'위암 재발률',          v:55, c:'R', note:'55%'},
    {n:'유방암 15년 재발',     v:25, c:'R', note:'25% — 10년째에도 14%'},
    {n:'갑상선암 생존율',      v:100,c:'G', note:'거의 100% — 그래서 「오래 쓰는 병」'}
  ],{title:'상담에서 실제로 쓰는 숫자만', max:100});
  b.s += tx(360,b.h+16,'※ 국가암등록통계 · Lancet 2013 등. 고객 제시 시 <tspan font-weight="800">기관명과 연도</tspan>를 함께 말할 것',{size:10.8,w:500,fill:INK3});
  return wrap(b.h+30, b.s);
});

/* ═══ LEVEL 3 — 뇌 ═══ */
reg('l3-ct-first', function(){
  var s = tx(360,20,'왜 CT를 먼저 찍는가 — 치료가 정반대이기 때문',{size:13.5,w:800,fill:INK});
  s += box(280,36,160,44,'k',{r:12});
  s += tx(360,64,'갑자기 쓰러졌다',{size:12.4,w:800,fill:'#fff'});
  s += ar(360,82,360,102);
  s += box(268,104,184,42,'B',{r:12});
  s += tx(360,131,'CT — 5분, 출혈부터 본다',{size:11.8,w:800,fill:'#fff'});
  s += ar(330,148,180,178);
  s += ar(390,148,540,178);
  s += box(24,180,320,132,'r',{r:13});
  s += tx(184,206,'출혈이 보인다 → 뇌출혈',{size:13,w:800,fill:T.r.t});
  s += tx(184,230,'혈압을 낮추고 피를 멈춘다',{size:11.2,w:600,fill:INK2});
  s += tx(184,250,'개두술 · 혈종제거 · 코일/클립',{size:10.8,w:500,fill:INK2});
  s += '<rect x="52" y="264" width="264" height="34" rx="9" fill="#fff" stroke="'+T.r.s+'"/>';
  s += tx(184,286,'여기에 혈전용해제를 쓰면 <tspan font-weight="800" fill="'+T.r.t+'">치명적</tspan>',{size:11,w:700,fill:INK2});
  s += box(376,180,320,132,'b',{r:13});
  s += tx(536,206,'출혈이 없다 → 뇌경색',{size:13,w:800,fill:T.b.t});
  s += tx(536,230,'막힌 혈전을 녹이거나 빼낸다',{size:11.2,w:600,fill:INK2});
  s += tx(536,250,'혈전용해 4.5h · 혈전제거 6h',{size:10.8,w:500,fill:INK2});
  s += '<rect x="404" y="264" width="264" height="34" rx="9" fill="#fff" stroke="'+T.b.s+'"/>';
  s += tx(536,286,'MRI가 더 정확하지만 <tspan font-weight="800" fill="'+T.b.t+'">시간이 없다</tspan>',{size:11,w:700,fill:INK2});
  return wrap(328, s);
});

reg('l3-sequela', function(){
  var m = matrix(['어떤 증상','생활에서','필요한 담보'],[
    {n:'편마비',      v:['한쪽 팔다리 마비','휠체어 · 이동 보조','후유장해 · 간병']},
    {n:'실어증',      v:['말이 안 나온다','의사표현 불가','간병 · 재활']},
    {n:'연하장애',    v:['삼키지 못한다','콧줄 · 흡인성 폐렴','입원일당 ← 상병은 폐렴']},
    {n:'편측무시',    v:['한쪽을 인식 못함','혼자 두면 위험','상시 간병']},
    {n:'인지 · 감정', v:['기억력 · 충동조절','직장 복귀 어려움','생활비 · 소득보전']},
    {n:'경직',        v:['근육이 굳는다','통증 · 관절 변형','재활 · 도수']}
  ],{title:'뇌졸중 후유증 6종 — 여기서부터가 진짜 비용이다', x0:110, rh:32});
  m.s += box(24,m.h+10,672,54,'r',{r:12});
  m.s += tx(360,m.h+34,'연하장애 → 흡인성 폐렴 → 재입원 고리가 가장 위험하다',{size:12,w:800,fill:T.r.t});
  m.s += tx(360,m.h+54,'상병명이 「폐렴」으로 잡혀 <tspan font-weight="800">뇌 담보로는 지급되지 않는다</tspan>',{size:10.8,w:500,fill:INK2});
  return wrap(m.h+80, m.s);
});

reg('l3-rehab', function(){
  var s = tx(360,20,'재활 — 회복에는 창(窓)이 있다',{size:13.5,w:800,fill:INK});
  s += '<defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="0">'+
       '<stop offset="0" stop-color="'+T.G.f+'"/><stop offset="0.45" stop-color="'+T.O.f+'"/>'+
       '<stop offset="1" stop-color="'+T.m.d+'"/></linearGradient></defs>';
  s += '<rect x="54" y="60" width="612" height="30" rx="10" fill="url(#rg)"/>';
  s += tx(150,80,'회복 속도 빠름',{size:11.2,w:800,fill:'#fff'});
  s += tx(580,80,'느려짐 · 고착',{size:11.2,w:800,fill:INK2});
  var ph=[
    {x:14,c:'g',t:'급성기 (~1개월)',d:['생명 유지 · 합병증 예방','침상 재활 시작'],n:'상급종합병원'},
    {x:246,c:'o',t:'회복기 (1~6개월)',d:['가장 많이 좋아지는 구간','집중 재활이 결과를 바꾼다'],n:'재활병원 · 요양병원'},
    {x:478,c:'m',t:'유지기 (6개월~)',d:['속도가 크게 떨어진다','기능 유지가 목표'],n:'외래 · 방문재활'}
  ];
  ph.forEach(function(p){
    s += box(p.x,106,228,126,p.c,{r:13});
    s += tx(p.x+114,132,p.t,{size:12.6,w:800,fill:T[p.c].t});
    p.d.forEach(function(d,i){ s += tx(p.x+114,156+i*17,d,{size:10.8,w:500,fill:INK2}); });
    s += ln(p.x+24,196,p.x+204,196,{w:1.4});
    s += tx(p.x+114,216,p.n,{size:11,w:700,fill:INK});
  });
  s += tx(360,258,'회복기 6개월에 <tspan font-weight="800" fill="'+T.o.t+'">재활병원비와 간병비가 몰린다</tspan>. 진단비를 여기서 다 쓰면 그 다음이 없다',{size:11.8,w:600,fill:INK2});
  return wrap(276, s);
});

reg('l3-disability-time', function(){
  var s = tx(360,20,'후유장해는 언제 판정하나',{size:13.5,w:800,fill:INK});
  s += ln(60,124,660,124,{w:4});
  var pts=[{p:0,t:'발병 · 사고',c:'B'},{p:.35,t:'치료 종료',c:'B'},{p:.72,t:'180일 경과',c:'O',big:1},{p:1,t:'진단서 발급',c:'R',big:1}];
  pts.forEach(function(p){
    var x=60+600*p.p, c=T[p.c];
    s += '<circle cx="'+x+'" cy="124" r="'+(p.big?10:8)+'" fill="'+c.f+'" stroke="'+c.s+'" stroke-width="3"/>';
    s += tx(x,102,p.t,{size:11.8,w:800,fill:INK});
  });
  s += '<rect x="60" y="60" width="492" height="28" rx="9" fill="'+T.b.f+'" stroke="'+T.b.s+'"/>';
  s += tx(306,79,'치료 중에는 판정하지 않는다 — 아직 좋아질 수 있어서',{size:11.2,w:700,fill:T.b.t});
  s += '<rect x="492" y="148" width="168" height="28" rx="9" fill="'+T.o.f+'" stroke="'+T.o.s+'"/>';
  s += tx(576,167,'원칙 180일 이후',{size:11.2,w:700,fill:T.o.t});
  s += box(24,192,672,86,'k',{r:13});
  s += tx(360,218,'소멸시효 기산점은 사고일이 아니라 <tspan fill="'+T.O.f+'">진단서 발급일</tspan>이다',{size:12.6,w:800,fill:'#fff'});
  s += tx(360,240,'→ 3년이 지난 사고라도 아직 진단서를 받지 않았다면 지금 청구할 수 있다',{size:11,w:500,fill:'rgba(255,255,255,.86)'});
  s += tx(360,262,'신규 고객에게 "지난 3년간 크게 다치거나 아프신 적 있으세요?"를 반드시 묻는 이유',{size:11,w:500,fill:'rgba(255,255,255,.7)'});
  return wrap(294, s);
});

/* ═══ LEVEL 3 — 심장 ═══ */
reg('l3-angina3', function(){
  var s = tx(360,20,'협심증의 세 얼굴 — 담보 코드가 갈리는 이유',{size:13.5,w:800,fill:INK});
  var a=[
    {x:14,c:'b',t:'안정형',code:'I20.9',d:['계단 오를 때만 아프다','쉬면 좋아진다','좁아진 채로 안정'],cov:'허혈성(I20~I25) O',cv:'b'},
    {x:246,c:'o',t:'불안정형',code:'I20.0',d:['쉴 때도 아프다','점점 심해진다','플라크가 터지기 직전'],cov:'특정허혈 O · 응급',cv:'O'},
    {x:478,c:'r',t:'변이형',code:'I20.1',d:['새벽·이른 아침','혈관이 경련한다','좁지 않아도 아프다'],cov:'특정허혈 O',cv:'O'}
  ];
  a.forEach(function(x){
    s += box(x.x,36,228,196,x.c,{r:13});
    s += tx(x.x+114,64,x.t,{size:15,w:800,fill:T[x.c].t});
    s += tx(x.x+114,84,x.code,{size:11.4,w:800,fill:INK3,ls:'.06em'});
    x.d.forEach(function(d,i){ s += tx(x.x+114,112+i*18,d,{size:11,w:500,fill:INK2}); });
    s += '<rect x="'+(x.x+22)+'" y="180" width="184" height="34" rx="9" fill="'+T[x.cv].f+'" stroke="'+T[x.cv].s+'"/>';
    s += tx(x.x+114,202,x.cov,{size:10.8,w:800,fill:T[x.cv].t});
  });
  s += tx(360,258,'같은 「협심증」인데 <tspan font-weight="800" fill="'+T.o.t+'">I20.0 · I20.1만 특정허혈 담보에 들어간다</tspan>. 담보명이 아니라 코드를 봐야 하는 이유',{size:11.8,w:600,fill:INK2});
  return wrap(276, s);
});

reg('l3-heart-test', function(){
  var f = flow([
    {c:'m',t:'심전도',d:['5분 · 급여','응급실 1순위']},
    {c:'b',t:'심장초음파',d:['EF(박출률) 측정','판막·심근 확인']},
    {c:'b',t:'운동부하',d:['걸으면서 심전도','증상 재현']},
    {c:'o',t:'관상동맥 CT',d:['혈관을 그림으로','조영제 사용']},
    {c:'R',t:'관상동맥조영술',d:['진단이자 치료 관문','바로 스텐트로 이어짐']}
  ],{title:'심장 검사 5단계 — 마지막 하나가 시술의 입구다', h:104});
  var s=f.s;
  s += box(430,f.h+4,266,64,'r',{r:12});
  s += tx(563,f.h+28,'CAG는 검사이면서 수술의 문',{size:11.6,w:800,fill:T.r.t});
  s += tx(563,f.h+48,'같은 날 스텐트로 넘어가는 경우가 많다',{size:10.6,w:500,fill:INK2});
  s += box(24,f.h+4,388,64,'b',{r:12});
  s += tx(218,f.h+28,'EF 55~70%가 정상, 40% 미만이면 수축기 심부전',{size:11.6,w:800,fill:T.b.t});
  s += tx(218,f.h+48,'심근경색으로 EF가 떨어지면 → 심부전으로 이어진다',{size:10.6,w:500,fill:INK2});
  return wrap(f.h+84, s);
});

reg('l3-heart-fail', function(){
  var s = tx(360,20,'심부전 (I50) — 고령화의 종착역',{size:13.5,w:800,fill:INK});
  s += tx(360,38,'심장이 「펌프」로서 힘을 잃은 상태. 여러 심장병의 공통 종점이다',{size:11.2,w:500,fill:INK3});
  var into=[['고혈압','m'],['심근경색','r'],['판막질환','o'],['부정맥','o'],['심근병증','m']];
  into.forEach(function(x,i){
    var X=24+i*138;
    s += box(X,56,126,40,x[1],{r:10,z:4});
    s += tx(X+63,81,x[0],{size:11.6,w:800,fill:T[x[1]].t});
    s += ar(X+63,98,360,124,{c:'#c9d0d8',w:1.6});
  });
  s += box(252,126,216,54,'R',{r:13});
  s += tx(360,150,'심부전 I50',{size:15,w:800,fill:'#fff'});
  s += tx(360,170,'EF ↓ · NYHA 등급 ↑',{size:10.8,w:500,fill:'rgba(255,255,255,.86)'});
  /* NYHA */
  var ny=[{t:'I급',d:'일상 제한 없음',c:'g'},{t:'II급',d:'평소 활동에서 증상',c:'b'},{t:'III급',d:'가벼운 활동에도',c:'o'},{t:'IV급',d:'안정 시에도 숨참',c:'r'}];
  ny.forEach(function(n,i){
    var X=14+i*178;
    s += box(X,204,166,72,n.c,{r:12});
    s += tx(X+83,230,n.t,{size:13.4,w:800,fill:T[n.c].t});
    s += tx(X+83,252,n.d,{size:10.6,w:500,fill:INK2});
  });
  s += box(24,290,672,58,'k',{r:13});
  s += tx(360,314,'심부전의 비용은 수술이 아니라 <tspan fill="'+T.O.f+'">반복 입원과 간병</tspan>에서 나온다',{size:12.2,w:800,fill:'#fff'});
  s += tx(360,334,'진단비 한 번보다 입원일당 · 간병 담보가 실제로 더 자주 쓰인다',{size:10.6,w:500,fill:'rgba(255,255,255,.8)'});
  return wrap(364, s);
});

reg('l3-valve', function(){
  return S(split(
    {c:'b',t:'판막질환 (I34~I37)',s:'심장의 문이 고장난다',
     d:['협착 — 문이 안 열린다','폐쇄부전 — 문이 안 닫힌다','고령 대동맥판 협착이 대표','개흉 치환술 = 5종','TAVI(경피적) = 3종 계열','같은 병, 방법에 따라 종이 다르다']},
    {c:'o',t:'심근병증 (I42)',s:'심장 근육 자체의 병',
     d:['확장성 — 늘어나 힘이 없다','비후성 — 두꺼워져 안 늘어난다','젊은 돌연사의 원인이 되기도','수술보다 약물·기기 치료','제세동기(ICD) 삽입 = 3종','허혈성 담보로는 안 잡힌다']},
    {title:'빠져 있던 나머지 — 판막과 심근', h:206, vs:true}));
});

reg('l3-why-not-one', function(){
  var s = tx(360,20,'왜 진단비 하나로는 부족한가 — 한 사람의 5년',{size:13.5,w:800,fill:INK});
  var ev=[
    {p:0,   t:'심근경색',   d:['진단비 지급','스텐트 2개'],c:'R'},
    {p:.26, t:'재시술',     d:['재협착','스텐트 추가'],c:'o'},
    {p:.52, t:'심부전',     d:['EF 35%','반복 입원'],c:'o'},
    {p:.78, t:'제세동기',   d:['ICD 삽입','3종 수술'],c:'b'},
    {p:1,   t:'간병',       d:['NYHA III','상시 도움'],c:'m'}
  ];
  var t = timeline(ev,{y:110,rows:2});
  s += t.s;
  s += '<rect x="54" y="44" width="112" height="30" rx="9" fill="'+T.G.f+'"/>';
  s += tx(110,64,'진단비 1회',{size:11.2,w:800,fill:'#fff'});
  s += '<rect x="172" y="44" width="494" height="30" rx="9" fill="'+T.r.f+'" stroke="'+T.r.s+'"/>';
  s += tx(419,64,'그 뒤 4년 — 진단비는 이미 끝났다',{size:11.2,w:800,fill:T.r.t});
  s += box(24,t.h+2,672,72,'k',{r:13});
  s += tx(360,t.h+26,'이 구간을 받치는 건 수술비 · 입원일당 · 간병 · 후유장해다',{size:12.4,w:800,fill:'#fff'});
  s += tx(360,t.h+48,'진단비는 「시작」에만 나오고, 돈은 「그 뒤」에 더 오래 나간다',{size:11,w:500,fill:'rgba(255,255,255,.82)'});
  return wrap(t.h+88, s);
});

/* ═══ LEVEL 4 ═══ */
reg('l4-major5', function(){
  var s = tx(360,20,'암 주요치료비 — 5년짜리 담보의 구조',{size:13.5,w:800,fill:INK});
  s += ln(60,140,660,140,{w:4});
  [0,1,2,3,4,5].forEach(function(y,i){
    var x=60+i*120;
    s += '<circle cx="'+x+'" cy="140" r="7" fill="#fff" stroke="'+T.B.f+'" stroke-width="3"/>';
    s += tx(x,164,y+'년',{size:11,w:700,fill:INK2});
  });
  s += '<rect x="60" y="72" width="600" height="46" rx="10" fill="'+T.b.f+'" stroke="'+T.b.s+'"/>';
  s += tx(360,92,'암 주요치료비 — 항암 · 방사선 · 표적 · 면역 치료비를 실비 또는 정액으로',{size:11.6,w:800,fill:T.b.t});
  s += tx(360,110,'진단 시점부터 5년. 이 5년이 비용이 가장 집중되는 구간이다',{size:10.6,w:500,fill:INK2});
  var g=[
    {x:24,c:'g',t:'0~2년',d:['수술 · 1차 항암','치료 강도 최대'],n:'주요치료비가 핵심'},
    {x:250,c:'b',t:'2~5년',d:['추적 관찰','재발 시 2차 치료'],n:'주요치료비 + 수술비'},
    {x:476,c:'r',t:'5년 이후',d:['주요치료비 종료','산정특례도 종료'],n:'재발암 + 종수술비만 남는다'}
  ];
  g.forEach(function(x){
    s += box(x.x,186,220,108,x.c,{r:13});
    s += tx(x.x+110,212,x.t,{size:13.4,w:800,fill:T[x.c].t});
    x.d.forEach(function(d,i){ s += tx(x.x+110,236+i*17,d,{size:10.8,w:500,fill:INK2}); });
    s += tx(x.x+110,280,x.n,{size:11,w:800,fill:INK});
  });
  s += tx(360,320,'"5년만 보장한다면서요?" → <tspan font-weight="800" fill="'+T.b.t+'">두 겹으로 갑니다</tspan>. 5년은 주요치료비, 그 뒤는 재발암 · 수술비',{size:11.6,w:600,fill:INK2});
  return wrap(338, s);
});

reg('l4-checklist', function(){
  var m = matrix(['진단','1차 치료','재발·전이','5년 이후'],[
    {n:'암 진단비',      v:['O','X','X','X']},
    {n:'재발암 진단비',  v:['X','X','O','O']},
    {n:'암 주요치료비',  v:['X','O','O','X']},
    {n:'종수술비',       v:['X','O','O','O']},
    {n:'암 입원일당',    v:['X','O','O','O']},
    {n:'실손',           v:['O','O','O','O']},
    {n:'생활비 · 소득보전',v:['X','O','O','D']}
  ],{title:'치료비 담보 체크리스트 — 국면별로 누가 일하는가', x0:150, rh:30});
  m.s += tx(360,m.h+16,'한 열이라도 <tspan font-weight="800" fill="'+T.r.t+'">전부 ×</tspan>인 국면이 있으면 그 구간은 고객이 통째로 부담한다',{size:11.6,w:600,fill:INK2});
  return wrap(m.h+30, m.s);
});

/* ═══ LEVEL 5 ═══ */
reg('l5-def', function(){
  var s = tx(360,20,'사전적 「수술」과 약관상 「수술」은 다르다',{size:13.5,w:800,fill:INK});
  s += '<circle cx="268" cy="150" r="104" fill="'+T.b.f+'" stroke="'+T.b.s+'" stroke-width="1.5" opacity=".92"/>';
  s += '<circle cx="452" cy="150" r="104" fill="'+T.g.f+'" stroke="'+T.g.s+'" stroke-width="1.5" opacity=".82"/>';
  s += tx(196,86,'일반인이 생각하는 수술',{size:11.6,w:800,fill:T.b.t});
  s += tx(196,118,'· 시술',{size:11,w:500,fill:INK2});
  s += tx(196,136,'· 흡인 · 천자',{size:11,w:500,fill:INK2});
  s += tx(196,154,'· 신경차단술',{size:11,w:500,fill:INK2});
  s += tx(196,172,'· 체외충격파쇄석',{size:11,w:500,fill:INK2});
  s += tx(196,190,'· 창상봉합(단순)',{size:11,w:500,fill:INK2});
  s += tx(524,86,'약관이 인정하는 수술',{size:11.6,w:800,fill:T.g.t});
  s += tx(524,124,'의사가',{size:11,w:500,fill:INK2});
  s += tx(524,142,'직접 치료 목적으로',{size:11,w:500,fill:INK2});
  s += tx(524,160,'생체에 절단 · 절제',{size:11,w:500,fill:INK2});
  s += tx(524,178,'등의 조작을 하는 것',{size:11,w:500,fill:INK2});
  s += tx(360,142,'겹치는',{size:11.4,w:800,fill:INK});
  s += tx(360,160,'부분만',{size:11.4,w:800,fill:INK});
  s += tx(360,178,'지급',{size:11.4,w:800,fill:INK});
  s += box(24,272,672,60,'r',{r:13});
  s += tx(360,296,'고객이 "수술했는데 왜 안 나와요?"라고 하는 분쟁의 90%가 이 차이에서 나온다',{size:12,w:800,fill:T.r.t});
  s += tx(360,318,'그래서 1-7종(ADRG 코드 방식)이 이 빈 곳을 메우도록 만들어졌다',{size:10.8,w:500,fill:INK2});
  return wrap(348, s);
});

reg('l5-jong', function(){
  var s = tx(360,20,'1~5종은 무엇으로 나뉘나 — 침습도 · 위험도 순',{size:13.5,w:800,fill:INK});
  var j=[
    {n:'1종',c:'g',d:'가장 가벼움',e:'백내장 · 편도절제 · 탈장 · 치핵 · 제왕절개'},
    {n:'2종',c:'b',d:'내시경 · 국소',e:'위·대장 용종 제거 · 충수절제 · 망막박리'},
    {n:'3종',c:'B',d:'경피적 · 절제',e:'갑상선 관혈 · 척추유합 · 심박동기 매입'},
    {n:'4종',c:'o',d:'개흉 · 개복',e:'위 절제 · 간·췌장 관혈 · 심막 관혈'},
    {n:'5종',c:'R',d:'최고 난도',e:'두개내 관혈 · 심장내 관혈 · 장기 이식'}
  ];
  j.forEach(function(x,i){
    var y=42+i*54, w=200+i*82;
    s += box(20,y,w,44,x.c,{r:11});
    s += tx(52,y+28,x.n,{a:'start',size:14,w:800,fill:T[x.c].t});
    s += tx(104,y+28,x.d,{a:'start',size:11,w:600,fill:T[x.c].t});
    s += tx(w+34,y+28,x.e,{a:'start',size:10.6,w:500,fill:INK2});
  });
  s += ln(20,320,696,320,{w:2});
  s += tx(28,340,'가볍다',{a:'start',size:11,w:700,fill:INK3});
  s += tx(692,340,'무겁다 · 보험금이 크다',{a:'end',size:11,w:700,fill:INK3});
  s += tx(360,366,'중요한 건 종의 높낮이가 아니라 <tspan font-weight="800" fill="'+T.b.t+'">내 수술이 분류표에 있느냐</tspan>다',{size:11.8,w:600,fill:INK2});
  return wrap(384, s);
});

reg('l5-ndae', function(){
  var s = tx(360,20,'N대 수술비 — 종수술비와 겹쳐 쌓는 담보',{size:13.5,w:800,fill:INK});
  s += box(24,40,672,44,'m',{r:12});
  s += tx(360,68,'같은 수술 한 번에 여러 담보가 동시에 지급된다 (중복 지급)',{size:12,w:800,fill:INK2});
  var lay=[
    {t:'실손',d:'실제 쓴 돈의 일부',c:'m',w:640},
    {t:'1-5종 / 1-7종 수술비',d:'종에 따라 정액',c:'b',w:540},
    {t:'N대 수술비 (16대 · 32대 등)',d:'지정 수술이면 추가 정액',c:'B',w:420},
    {t:'질병수술비',d:'절단·절제 있으면 추가',c:'o',w:300},
    {t:'암/뇌/심 특정수술비',d:'해당 질환이면 또 추가',c:'R',w:180}
  ];
  lay.forEach(function(l,i){
    var y=98+i*46, x=360-l.w/2;
    s += box(x,y,l.w,38,l.c,{r:10,z:4});
    s += tx(360,y+17,l.t,{size:11.8,w:800,fill:T[l.c].t});
    s += tx(360,y+31,l.d,{size:9.8,w:500,fill:(l.c==='B'||l.c==='R')?'rgba(255,255,255,.82)':INK2});
  });
  s += tx(360,352,'"수술 한 번에 세 군데서 나왔어요"가 나오는 구조. <tspan font-weight="800">복층 설계</tspan>라고 부른다',{size:11.8,w:600,fill:INK2});
  s += tx(360,374,'단, N대 수술 목록은 상품마다 다르다 — 반드시 그 상품의 목록을 확인할 것',{size:10.8,w:500,fill:INK3});
  return wrap(390, s);
});

reg('l5-frequent', function(){
  var b = bars([
    {n:'배액술',           v:62453, c:'R', note:'62,453명 · 1-5종 × / 1-7종 ○'},
    {n:'백내장 수술',       v:58000, c:'o', note:'1종 · 실손 분쟁 최다'},
    {n:'대장 용종 절제',    v:52000, c:'b', note:'2종 · 건강검진에서 바로'},
    {n:'갑상선 수술',       v:30377, c:'b', note:'30,377명 · 3종'},
    {n:'치핵 근본수술',     v:22000, c:'g', note:'1종 · 1-7종이 더 유리한 경우'},
    {n:'하지정맥류',        v:18000, c:'o', note:'1종 · 본인부담 94% 사례'}
  ],{title:'다빈도 수술 — 어디에 담보를 깔아야 하나 (연간 환자 수)', max:66000, x0:150});
  b.s += tx(360,b.h+16,'암 · 뇌 · 심장 수술은 이 목록에 없다. <tspan font-weight="800" fill="'+T.r.t+'">실제로 자주 쓰이는 건 위쪽</tspan>이다',{size:11.6,w:600,fill:INK2});
  b.s += tx(360,b.h+36,'※ 건강보험 통계 기반 개략치. 상담에서는 「배액술 62,453명 = 갑상선의 2배」 한 문장이면 충분하다',{size:10.4,w:500,fill:INK3});
  return wrap(b.h+50, b.s);
});

reg('l5-receipt-op', function(){
  var b = bars([
    {n:'척추유합술',      v:1102, c:'R', note:'본인부담 1,102만 (치료재료 768만)'},
    {n:'위암 로봇수술',   v:1768, c:'R', note:'본인부담 1,768만 (비급여 1,500만)'},
    {n:'갑상선 로봇',     v:1586, c:'R', note:'본인부담 1,586만'},
    {n:'하지정맥류',      v:350,  c:'o', note:'본인부담 350만 · 총액의 94%'},
    {n:'백내장(다초점)',  v:354,  c:'o', note:'치료재료대 354만'},
    {n:'급여 암수술',     v:22,   c:'G', note:'본인부담 2.2만'}
  ],{title:'실제 영수증으로 보는 수술비 (본인부담 · 만원)', max:1800, x0:150});
  b.s += tx(360,b.h+16,'정액 수술비가 왜 필요한가 — <tspan font-weight="800" fill="'+T.r.t+'">비급여를 고르는 순간 실손도 산정특례도 힘을 잃는다</tspan>',{size:11.6,w:600,fill:INK2});
  b.s += tx(360,b.h+36,'※ 개인 · 병원 · 시기에 따라 다를 수 있습니다',{size:10.2,w:500,fill:INK3});
  return wrap(b.h+50, b.s);
});

reg('l5-dispute', function(){
  var m = matrix(['질병수술비','1-5종','1-7종','왜'],[
    {n:'하이푸(자궁근종)',   v:['O','O','X','전액 비급여 · 코드 없음']},
    {n:'경피적 혈전제거',    v:['X','X','O','절제 없음 · 표에 없음']},
    {n:'배액술',             v:['X','X','O','고름만 뺀다 · 절제 없음']},
    {n:'창상봉합술',         v:['D','D','O','변연절제 동반 시만']},
    {n:'체외충격파쇄석',     v:['X','D','O','규정 ⑤ 제외 · 상품별']},
    {n:'제왕절개',           v:['O','O','O','1-7종이 더 클 수도']}
  ],{title:'같은 수술, 담보마다 답이 다르다', x0:132, rh:31});
  m.s += tx(360,m.h+16,'이 표가 <tspan font-weight="800" fill="'+T.b.t+'">1-5종과 1-7종을 함께 넣어야 하는 이유</tspan>다. 우열이 아니라 서로의 빈칸을 메운다',{size:11.6,w:600,fill:INK2});
  return wrap(m.h+30, m.s);
});

reg('l0-map', function(){
  var s = tx(360,20,'교재 전체 지도 — 어디쯤 와 있는지 늘 확인할 것',{size:13.5,w:800,fill:INK});
  var g=[
    {x:14,c:'m',t:'1부 · 기초',d:['L0 관점','L1 손실 구조','L2 실손'],n:'여기서 무너지면 뒤가 전부 흔들린다'},
    {x:190,c:'B',t:'2부 · 담보',d:['L3 진단비(암·뇌·심)','L4 치료비  L5 수술비','L6 입원·간병  L7 생활'],n:'교재의 심장부 · 전체 시간의 60%'},
    {x:366,c:'o',t:'3부 · 실무',d:['L8 고지·면책·청구','L9 저축·연금·세금',''],n:'계약을 지키고 대화를 넓히는 기술'},
    {x:542,c:'g',t:'4부 · 조립',d:['L10 종합 설계','부록 — 질병백과·분석','설계30·케이스9·치료비DB'],n:'여기서 한 장으로 합쳐진다'}
  ];
  g.forEach(function(x,i){
    s += box(x.x,40,164,196,x.c,{r:14});
    s += tx(x.x+82,68,x.t,{size:13.4,w:800,fill:T[x.c].t});
    x.d.forEach(function(d,j){ if(d) s += tx(x.x+82,96+j*20,d,{size:10.5,w:600,fill:INK2}); });
    s += ln(x.x+20,168,x.x+144,168,{w:1.3});
    s += tx(x.x+82,190,x.n.slice(0,14),{size:10,w:500,fill:INK3});
    if(x.n.length>14) s += tx(x.x+82,206,x.n.slice(14),{size:10,w:500,fill:INK3});
    if(i<3) s += ar(x.x+166,138,x.x+188,138);
  });
  s += tx(360,262,'막히면 <tspan font-weight="800" fill="'+T.b.t+'">왼쪽 위 검색창</tspan>에 단어를 넣는다. 용어 · 본문 · 화법 · 질병 · 수술표가 한 번에 나온다',{size:11.6,w:600,fill:INK2});
  return wrap(280, s);
});

reg('l1-guyeo', function(){
  var s = tx(360,20,'같은 100만원 진료비, 지갑에서 나가는 돈은 완전히 다르다',{size:13.5,w:800,fill:INK});
  var col=[
    {x:24,c:'g',t:'급여',bar:[['공단 80만',80,'#8fd4bb'],['본인 20만',20,'#02a678']],n:['산정특례 · 상한제가','여기서만 작동한다'],my:'20만원'},
    {x:252,c:'o',t:'선별급여',bar:[['공단',35,'#eabf85'],['본인 65만',65,'#ff8a00']],n:['급여 칸에 있지만','부담률이 50~90%'],my:'50~80만원'},
    {x:480,c:'r',t:'비급여',bar:[['본인 100만',100,'#f04452']],n:['특례 · 상한제','둘 다 적용 안 됨'],my:'100만원'}
  ];
  col.forEach(function(c){
    s += box(c.x,38,216,224,c.c,{r:14});
    s += tx(c.x+108,66,c.t,{size:14.4,w:800,fill:T[c.c].t});
    var bx=c.x+22, W=172, cx=bx;
    s += '<rect x="'+bx+'" y="84" width="'+W+'" height="30" rx="8" fill="#fff" stroke="'+T[c.c].s+'"/>';
    c.bar.forEach(function(b){
      var w=W*b[1]/100;
      s += '<rect x="'+cx+'" y="84" width="'+w+'" height="30" rx="8" fill="'+b[2]+'"/>';
      if(w>56) s += tx(cx+w/2,104,b[0],{size:10,w:800,fill:'#fff'});
      cx+=w;
    });
    s += tx(c.x+108,146,'내가 내는 돈',{size:10.6,w:600,fill:INK3});
    s += tx(c.x+108,174,c.my,{size:20,w:800,fill:T[c.c].t});
    s += ln(c.x+30,196,c.x+186,196,{w:1.3});
    c.n.forEach(function(n,i){ s += tx(c.x+108,218+i*17,n,{size:10.4,w:500,fill:INK2}); });
  });
  s += box(24,276,672,54,'k',{r:13});
  s += tx(360,300,'영수증에서 비급여 칸의 <tspan fill="'+T.O.f+'">가장 큰 금액</tspan>을 찾는 것이 상담의 시작이다',{size:12.2,w:800,fill:'#fff'});
  s += tx(360,320,'총액이 아니라 이 칸이 고객의 지갑을 결정한다',{size:10.6,w:500,fill:'rgba(255,255,255,.8)'});
  return wrap(346, s);
});

window.FIGS = F;
window.FIGH = {box:box, card:card, tx:tx, ar:ar, ln:ln, wrap:wrap, bars:bars, flow:flow,
                timeline:timeline, split:split, matrix:matrix, stack:stack, layers:layers,
                T:T, INK:INK, INK2:INK2, INK3:INK3, LINE:LINE, S:S, reg:reg};
})();
