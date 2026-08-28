/* 블로그에 넣을 그림 — 직접 그려서 PNG 로 내보낸다
   ══════════════════════════════════════════════════════════════════════
   글은 다 됐는데 [이미지: …] 자리가 비어 있으면 그 글은 못 올린다.
   캔바를 열어 열 장을 만들다 보면 그날 발행이 끝난다.

   남의 삽화를 떠 오지 않는다 — 인쇄에서 뭉개지고, 무엇보다 남의 것이다.
   사진도 안 쓴다. SVG 로 직접 그린다.

   <b>그림에서 지어내기가 더 위험하다.</b> 글은 읽다가 「출처가 없네」
   하고 넘어가지만, 그래프는 <b>본 사람이 사실로 기억한다.</b> 캡처되면
   우리 글이 아니라 그 그림만 돌아다닌다. 그래서

     · <b>축과 눈금이 있는 그래프를 그리지 않는다.</b> 그 숫자가 우리에게
       없다. 없는 곡선을 그리면 그것이 근거가 되어 버린다.
     · 그림에 들어가는 글자는 <b>글감이나 초안에서 그대로</b> 온다.
     · 여덟 칸 이름은 <b>지도</b>(apex-map-data.js)에서 읽는다. 여기에
       다시 적어 두면 지도가 바뀔 때 한쪽만 늙는다.
     · 꼬리말 회사·이름은 앱에 적어 두신 <b>내 소개</b>에서 읽는다.
       안 적어 두셨으면 아무것도 안 쓴다 — 없는 이름을 만들지 않는다. */

const SV = { w:1200, ink:'#0F172A', sub:'#475569', brand:'#1A56DB', line:'#E2E8F0', soft:'#F8FAFC', bg:'#FFFFFF' };
const FONT = "'Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif";

const xe = s => (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function wrap(s, per){
  s = String(s || '').replace(/\s+/g,' ').trim();
  const out = []; let line = '';
  for (const w of s.split(' ')){
    if (!line) line = w;
    else if ((line + ' ' + w).length <= per) line += ' ' + w;
    else { out.push(line); line = w; }
    while (line.length > per){ out.push(line.slice(0, per)); line = line.slice(per); }
  }
  if (line) out.push(line);
  return out;
}
function tx(lines, x, y, size, lh, fill, weight, anchor){
  return '<text x="'+x+'" y="'+y+'" font-family="'+FONT+'" font-size="'+size+'" font-weight="'+(weight||400)+
    '" fill="'+fill+'" text-anchor="'+(anchor||'start')+'">'+
    lines.map((l,i)=>'<tspan x="'+x+'" dy="'+(i?lh:0)+'">'+xe(l)+'</tspan>').join('')+'</text>';
}
/* 여덟 칸 이름 — 지도에서 읽는다. 지도가 없으면 그 그림은 안 그린다. */
function wallets(){
  try{ const k = APEX_MAP && APEX_MAP.kids && APEX_MAP.kids.wallets;
       return (k && k.length) ? k : []; }catch(e){ return []; }
}
/* 내 소개 — 앱이 아이디별 칸에 저장해 둔 것을 그대로 읽는다 */
function brand(){
  let best = null;
  try{
    for (let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i);
      if (!k || k.indexOf('apex_intro_') !== 0) continue;
      const v = JSON.parse(localStorage.getItem(k) || 'null');
      if (v && (v.org || v.name) && (!best || (v.at || 0) > (best.at || 0))) best = v;
    }
  }catch(e){}
  if (!best) return '';
  return [best.org, best.name ? (best.name + (best.title ? ' ' + best.title : '')) : ''].filter(Boolean).join(' · ');
}
const svg = (w,h,body) => '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+
  '" viewBox="0 0 '+w+' '+h+'"><rect width="'+w+'" height="'+h+'" fill="'+SV.bg+'"/>'+body+'</svg>';
function foot(w,h,c){
  const b = brand();
  return '<rect x="0" y="'+(h-6)+'" width="'+w+'" height="6" fill="'+(c||SV.brand)+'"/>'+
    (b ? tx([b], w-56, h-30, 20, 0, SV.sub, 700, 'end') : '');
}

/* ── 날마다 같은 그림이 나가지 않게 ──────────────────────────────
   매일 올리기로 바꾸고 나서 생긴 문제다. 대표 이미지가 서른 날 똑같으면
   블로그가 죽어 보인다. 그렇다고 <b>없는 것을 그려 넣지는 않는다</b> —
   숫자도 그래프도 아니고, <b>색과 무늬만</b> 바꾼다.
   무늬는 <b>날짜와 갈래에서</b> 나온다. 그래서 같은 글은 다시 그려도
   같은 그림이다 — 어제 올린 글을 다시 뽑았는데 딴 그림이면 헷갈린다. */
function seedn(row){
  const s = String((row && row.ymd) || '') + '|' + String((row && row.kind) || '');
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
/* 갈래 색 — 갈래 표(blog.html)가 답한다. 여기에 다시 적어 두지 않는다. */
function kcolor(row){
  try{ const c = KINDS[row.kind] && KINDS[row.kind].c; if (c) return c; }catch(e){}
  return SV.brand;
}
/* 무늬 넷 — 축도 눈금도 숫자도 없다. 읽을 것이 없으니 근거가 되지 않는다. */
function deco(n, W, H, c){
  const o = 'opacity=".10"', a = [];
  if (n % 4 === 0){
    for (let i = 0; i < 6; i++)
      a.push('<circle cx="'+(W-150-i*34)+'" cy="'+(H-140+((i%2)?26:0))+'" r="'+(90-i*11)+'" fill="none" stroke="'+c+'" stroke-width="10" '+o+'/>');
  } else if (n % 4 === 1){
    for (let i = 0; i < 9; i++)
      a.push('<rect x="'+(W-120-i*46)+'" y="'+(H-60-i*22)+'" width="18" height="'+(40+i*22)+'" rx="9" fill="'+c+'" '+o+'/>');
  } else if (n % 4 === 2){
    for (let i = 0; i < 5; i++)
      a.push('<path d="M '+(W-460+i*40)+' '+H+' A 230 230 0 0 1 '+(W-40)+' '+(H-420+i*40)+'" fill="none" stroke="'+c+'" stroke-width="12" '+o+'/>');
  } else {
    for (let i = 0; i < 7; i++)
      a.push('<rect x="'+(W-330+i*44)+'" y="'+(H-330+i*44)+'" width="180" height="180" rx="26" fill="none" stroke="'+c+'" stroke-width="9" '+o+'/>');
  }
  return a.join('');
}

/* 초안에서 뽑아 쓰는 것 — 있는 줄만 가져온다 */
function pickTitle(row){
  const t = (row && row.out) || '';
  const m = t.match(/##\s*제목\s*후보[^\n]*\n+([\s\S]{0,400}?)\n\s*\n/);
  if (m){
    const first = m[1].split('\n')[0].replace(/^\s*[-*\d.)\s]+/,'').replace(/^["'“”]|["'“”]$/g,'').trim();
    if (first.length > 4) return first;
  }
  return (row && row.seed && row.seed.title) || '';
}
const SKIPHEAD = /제목\s*후보|해시태그|메타\s*설명|딛고\s*선|본문|이미지·삽화|시의성/;
function pickHeads(row){
  const t = (row && row.out) || '', out = []; let m;
  const re = /^##\s+(.+)$/gm;
  while ((m = re.exec(t))){
    const h = m[1].trim().replace(/^\d+[.)]\s*/,'');
    if (SKIPHEAD.test(h) || out.includes(h)) continue;
    out.push(h);
  }
  return out.slice(0, 6);
}

const ART = {
 cover:{ t:'대표 이미지', need:'draft', scan:true,
  why:'글 맨 위에 걸리는 한 장. 초안의 제목이 그대로 들어갑니다.',
  make(row){
    const W = SV.w, H = 630, ttl = pickTitle(row);
    if (!ttl) return { err:'제목을 아직 못 뽑았습니다 — 초안을 먼저 만들어 주세요.' };
    const ls = wrap(ttl, 18), size = ls.length > 3 ? 56 : 66, lh = size + 22;
    const top = Math.max(96, (H - ls.length * lh - 70) / 2);
    const n = seedn(row), c = kcolor(row);
    return { w:W, h:H, alt:ttl, text:ttl, svg: svg(W, H,
      deco(n, W, H, c)+
      '<rect x="0" y="0" width="14" height="'+H+'" fill="'+c+'"/>'+
      tx([KINDS[row.kind].t], 72, top, 26, 0, c, 800)+
      tx(ls, 72, top + 70 + size * 0.2, size, lh, SV.ink, 800)+ foot(W,H,c)) };
  }},

 news:{ t:'뉴스 카드', need:'seed',
  why:'기사 제목·언론사·날짜를 그대로 옮긴 카드입니다. 본문은 옮기지 않습니다.',
  make(row){
    const s = row.seed, W = SV.w, H = 630;
    if (!s || (!s.paper && !s.when)) return { err:'이 글감은 기사가 아닙니다.' };
    const ls = wrap(s.title, 20);
    return { w:W, h:H, text:s.title, alt: s.title + ' — ' + (s.paper||'') + ' 기사 소개 카드',
      svg: svg(W, H,
      '<rect x="56" y="56" width="'+(W-112)+'" height="'+(H-112)+'" rx="20" fill="'+SV.soft+'" stroke="'+SV.line+'"/>'+
      tx(['오늘의 소식'], 104, 148, 24, 0, SV.brand, 800)+
      tx(ls, 104, 218, ls.length>3?42:50, ls.length>3?60:70, SV.ink, 800)+
      tx([[s.paper||'', s.when||''].filter(Boolean).join('  ·  ')], 104, H-140, 24, 0, SV.sub, 700)+
      tx(['기사 제목과 출처만 옮겼습니다. 본문은 원문에서 확인해 주세요.'], 104, H-104, 19, 0, SV.sub, 400)+
      foot(W,H)) };
  }},

 ask:{ t:'질문 카드', need:'seed',
  why:'상담에서 실제로 나온 질문을 그대로 크게 실은 카드입니다.',
  make(row){
    const s = row.seed, W = SV.w, H = 630, ls = wrap(s.title, 17);
    return { w:W, h:H, text:s.title, alt: s.title + ' — 상담에서 자주 나오는 질문 카드',
      svg: svg(W, H,
      '<text x="88" y="240" font-family="'+FONT+'" font-size="180" font-weight="800" fill="'+SV.line+'">“</text>'+
      tx(ls, 180, 210, ls.length>3?46:56, ls.length>3?66:78, SV.ink, 800)+
      tx(['상담에서 실제로 나온 질문입니다'], 180, H-110, 22, 0, SV.brand, 700)+ foot(W,H)) };
  }},

 steps:{ t:'순서 카드', need:'seed',
  why:'전체 지도의 순서를 번호대로 옮긴 카드입니다.',
  make(row){
    const s = row.seed, W = SV.w;
    const raw = String((s && s.steps) || '').split('\n').filter(Boolean);
    if (!raw.length) return { err:'이 글감에는 순서가 없습니다.' };
    const n = Math.min(raw.length, 6), H = 200 + n * 92;
    let b = tx(wrap(s.title, 26), 64, 110, 38, 48, SV.ink, 800);
    for (let i = 0; i < n; i++){
      const y = 170 + i * 92, t = raw[i].replace(/^\d+\.\s*/,'');
      b += '<rect x="64" y="'+y+'" width="'+(W-128)+'" height="72" rx="14" fill="'+SV.soft+'" stroke="'+SV.line+'"/>'+
           '<circle cx="112" cy="'+(y+36)+'" r="22" fill="'+SV.brand+'"/>'+
           tx([String(i+1)], 112, y+45, 24, 0, '#FFFFFF', 800, 'middle')+
           tx([t.slice(0,34)], 152, y+45, 25, 0, SV.ink, 700);
    }
    return { w:W, h:H, text:s.title, alt: s.title + ' — 단계별 진행 순서 카드', svg: svg(W, H, b) };
  }},

 w8:{ t:'8통장 구조도', need:'none',
  why:'지도가 아는 여덟 칸을 그대로 그립니다. 금액은 넣지 않습니다.',
  make(){
    const ws = wallets();
    if (ws.length < 8) return { err:'지도(apex-map-data.js)를 못 읽어 여덟 칸 이름이 없습니다 — 그리지 않습니다.' };
    const W = SV.w, H = 700, cw = (W - 160) / 4, ch = 190;
    let b = tx(['돈이 하는 일을 여덟 칸으로 나눕니다'], 64, 104, 42, 0, SV.ink, 800)+
            tx(['칸마다 하는 일이 다릅니다. 어디가 비었는지부터 봅니다.'], 64, 148, 22, 0, SV.sub, 400);
    for (let i = 0; i < 8; i++){
      const x = 64 + (i % 4) * (cw + 10), y = 200 + ((i / 4) | 0) * (ch + 24);
      b += '<rect x="'+x+'" y="'+y+'" width="'+cw+'" height="'+ch+'" rx="16" fill="'+SV.soft+'" stroke="'+SV.line+'"/>'+
           '<circle cx="'+(x+40)+'" cy="'+(y+44)+'" r="20" fill="'+SV.brand+'"/>'+
           tx([String(i+1)], x+40, y+53, 22, 0, '#FFFFFF', 800, 'middle')+
           tx(wrap(ws[i], 7), x+24, y+108, 25, 32, SV.ink, 800);
    }
    return { w:W, h:H, text:'', alt:'8통장으로 나눈 치료비 통장 구조 인포그래픽', svg: svg(W, H, b + foot(W,H)) };
  }},

 flow:{ t:'진단·치료·요양 흐름', need:'none',
  why:'단계마다 어느 칸이 일하는지 그립니다. 금액은 넣지 않습니다.',
  make(){
    const ws = wallets();
    if (ws.length < 8) return { err:'지도를 못 읽어 칸 이름이 없습니다 — 그리지 않습니다.' };
    const W = SV.w, H = 520, cw = 250, gap = (W - 128 - cw * 4) / 3;
    const st = [['진단', ws[2]], ['치료', ws[1]], ['쉬는 동안', ws[3]], ['오래 아플 때', ws[6]]];
    let b = tx(['병이 지나가는 동안, 어느 칸이 일하나'], 64, 104, 42, 0, SV.ink, 800);
    st.forEach((s, i) => {
      const x = 64 + i * (cw + gap), y = 180;
      b += '<rect x="'+x+'" y="'+y+'" width="'+cw+'" height="200" rx="16" fill="'+SV.soft+'" stroke="'+SV.line+'"/>'+
           tx([s[0]], x+24, y+56, 30, 0, SV.brand, 800)+
           tx(wrap(s[1], 8), x+24, y+112, 24, 32, SV.ink, 700);
      if (i < 3) b += '<path d="M '+(x+cw+8)+' '+(y+100)+' l '+(gap-16)+' 0 m -14 -9 l 14 9 l -14 9" stroke="'+
                      SV.sub+'" stroke-width="3" fill="none"/>';
    });
    b += tx(['보장 내용과 지급 여부는 약관과 심사 결과에 따릅니다.'], 64, H-70, 20, 0, SV.sub, 400) + foot(W,H);
    return { w:W, h:H, text:'', alt:'질병 치료 단계별 보험금 지급 흐름 타임라인', svg: svg(W, H, b) };
  }},

 vs:{ t:'실손과 정액', need:'none',
  why:'두 가지가 어떻게 다른지 그립니다. 막대·눈금은 그리지 않습니다 — 그 숫자가 우리에게 없습니다.',
  make(){
    const ws = wallets();
    if (ws.length < 8) return { err:'지도를 못 읽어 칸 이름이 없습니다 — 그리지 않습니다.' };
    const W = SV.w, H = 560;
    const box = [[ws[1], '쓴 병원비를 정해진 기준에 따라 돌려받는 쪽'],
                 [ws[2], '정해진 사유가 생기면 정해진 금액을 받는 쪽']];
    let b = tx(['두 가지는 하는 일이 다릅니다'], 64, 104, 42, 0, SV.ink, 800);
    box.forEach((o, i) => {
      const x = 64 + i * ((W - 128) / 2 + 16), w = (W - 144) / 2;
      b += '<rect x="'+x+'" y="170" width="'+w+'" height="250" rx="18" fill="'+SV.soft+
           '" stroke="'+(i?SV.line:SV.brand)+'" stroke-width="'+(i?1:2)+'"/>'+
           tx(wrap(o[0], 10), x+32, 232, 32, 42, SV.ink, 800)+
           tx(wrap(o[1], 16), x+32, 320, 24, 34, SV.sub, 400);
    });
    b += tx(['어느 쪽이 더 좋다가 아니라, 하는 일이 다릅니다. 보장 내용은 약관과 심사 결과에 따릅니다.'],
            64, H-70, 20, 0, SV.sub, 400) + foot(W,H);
    return { w:W, h:H, text:'', alt:'실손보험과 정액보험 보장 방식 비교', svg: svg(W, H, b) };
  }},

 toc:{ t:'이 글에서 다루는 것', need:'draft', scan:true,
  why:'초안의 소제목을 그대로 옮긴 카드입니다. 독자가 캡처해 갑니다.',
  make(row){
    const hs = pickHeads(row);
    if (!hs.length) return { err:'초안에서 소제목을 못 찾았습니다.' };
    const W = SV.w, H = 180 + hs.length * 78;
    let b = tx(['이 글에서 다루는 것'], 64, 104, 40, 0, SV.ink, 800);
    hs.forEach((h, i) => {
      const y = 160 + i * 78;
      b += '<rect x="64" y="'+y+'" width="'+(W-128)+'" height="60" rx="12" fill="'+SV.soft+'"/>'+
           '<rect x="64" y="'+y+'" width="6" height="60" rx="3" fill="'+SV.brand+'"/>'+
           tx([h.slice(0,36)], 96, y+39, 25, 0, SV.ink, 700);
    });
    return { w:W, h:H, text:hs.join(' '), alt:'이 글에서 다루는 내용 요약 카드', svg: svg(W, H, b + foot(W,H)) };
  }}
};

function artFile(id, row){
  const base = ART[id].t + '-' + ((row && row.seed && row.seed.title) || 'apex');
  return base.replace(/[\\/:*?"<>|\s]+/g,'-').replace(/-+/g,'-').slice(0, 50) + '.png';
}
function build(id, row){
  const d = ART[id];
  if (!d) return { err:'그런 그림이 없습니다.' };
  if (d.need === 'draft' && !(row && row.out)) return { err:'초안을 먼저 만들어 주세요.' };
  if (d.need === 'seed'  && !(row && row.seed)) return { err:'글감이 없습니다.' };
  let r;
  try { r = d.make(row); } catch(e){ return { err:'그리지 못했습니다 — ' + (e.message || '') }; }
  if (!r || r.err) return r || { err:'그리지 못했습니다.' };
  /* 우리가 <b>엮어 만든</b> 글자(제목·소제목)에는 같은 잣대를 댄다.
     기사 제목·질문·지도 순서처럼 <b>그대로 옮긴 인용</b>은 손대지 않는다 —
     원문을 고치는 것이 더 나쁘다. */
  if (d.scan && r.text){
    const g = guard(r.text);
    if (g.hits.length) return { err:'그림에 들어갈 말에 고칠 곳이 있습니다 — 「'+g.hits[0].w+'」 '+g.hits[0].why };
  }
  r.id = id; r.t = d.t; r.file = artFile(id, row);
  return r;
}
/* 네이버·티스토리 편집기는 SVG 를 안 받는다. PNG 로 바꿔 내려준다. */
function png(r){
  try{
    const img = new Image();
    const u = URL.createObjectURL(new Blob([r.svg], { type:'image/svg+xml;charset=utf-8' }));
    img.onload = () => {
      try{
        const c = document.createElement('canvas'); c.width = r.w; c.height = r.h;
        const g = c.getContext('2d');
        g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, r.w, r.h); g.drawImage(img, 0, 0);
        URL.revokeObjectURL(u);
        c.toBlob(b => {
          if (!b){ toast('그림을 만들지 못했습니다.'); return; }
          const a = document.createElement('a');
          a.href = URL.createObjectURL(b); a.download = r.file;
          document.body.appendChild(a); a.click();
          setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 600);
        }, 'image/png');
      }catch(e){ toast('그림을 만들지 못했습니다 — ' + (e.message || '')); }
    };
    img.onerror = () => { URL.revokeObjectURL(u); toast('그림을 만들지 못했습니다.'); };
    img.src = u;
  }catch(e){ toast('이 브라우저에서는 그림 내려받기가 안 됩니다.'); }
}
