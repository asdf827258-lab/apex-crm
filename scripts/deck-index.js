/* 🎞 <b>상담자료 덱의 장을 자비스가 찾게 — 색인을 뽑는다</b> (판 X273)

   사장님 말씀 2026-10-31 — 「여기 안에 있는 모든 담긴 내용을 찾고 바로 사용할수
   있도록 하는게 목표야」 → 판 X272 에서 덱만 남았고, 「응응」(덱까지 붙여라).

   ── 왜 색인을 따로 뽑나 ─────────────────────────────────────────
   덱 넷은 합쳐 <b>3MB</b> 입니다(메인 상담자료 하나가 1.7MB — 거의 다 스크립트).
   글자만 추리면 <b>약 0.18MB</b> 입니다. 폰에서 물을 때마다 3MB 를 받게 하지 않고,
   이 스크립트가 덱에서 장마다 제목·글을 뽑아 app/apex-deck-index.js 로 둡니다.
   ★ 그 파일은 <b>손으로 고치지 않습니다</b> — 덱을 고치면 이것을 다시 돌립니다.
     check-jvdeck 이 덱과 색인이 어긋나면 빨간불로 알려 줍니다(낡은 글을 고객 앞에
     내놓지 않게 · 1번).
   ★ <b>덱 표는 여기 한 곳</b>입니다(5번) — 파일 · 화면 · 그 장으로 가는 법. 색인에
     같이 실려 자비스가 그것을 읽습니다.

   쓰는 법
     node scripts/deck-index.js          색인을 새로 씁니다
     (require 하면 build() 만 내줍니다 — check-jvdeck 이 씁니다)            */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'app', 'apex-deck-index.js');

/* 덱 — split: 장이 시작하는 곳 · id: 장의 이름표 · tattr: 제목을 담은 속성
   jump: 그 장으로 가는 법 (goToId · scroll · apx · track · file)
   files: 한 파일이 한 장인 덱 — 장마다 그 파일(f)을 엽니다
   win: 앱 화면이 아니라 <b>새 창</b>으로 여는 덱 (앱이 이미 그렇게 엽니다)          */
const DECKS = [
  { k: 'main', n: '보장분석 상담자료', file: '상담자료/메인 상담자료.html', screen: 'sangdam', frame: 'sangdamFrame',
    jump: 'goToId', split: /(?=<div class="slide[^"]*" id=")/, id: /^<div class="slide[^"]*" id="([^"]+)"/,
    title: /class="slide-title"[^>]*>([\s\S]*?)<\/div>/ },
  { k: 'kijun', n: '보험의 기준', file: '상담자료/보험의기준.html', screen: 'kijun', win: 1,
    jump: 'apx', split: /(?=<section class="slide)/, tattr: 'data-title', end: '</section>' },
  /* 통합상담은 장들이 <b>트랙 다섯</b>(연금 · 달러 · 투자 · 교육 · 쿠폰) 안에 들어 있습니다 — 그 트랙으로
     바꾼 뒤(덱의 window.__go) 그 장으로 굴립니다. 덱의 다른 go 를 부르면 아무 일도 안 납니다 */
  { k: 'tonghap', n: '통합상담 (연금·상속)', file: '상담자료/통합상담_APEX.html', screen: 'fp_deck', win: 1,
    jump: 'track', split: /(?=<section id=")/, id: /^<section id="([^"]+)"/, end: '</section>' },
  { k: 'mikki', n: '미끼상품 & 접촉전략', file: '상담자료/미끼상품_접촉전략.html', screen: 'mikki_talk', frame: 'mkTalkFrame',
    jump: 'scroll', split: /(?=<section id=")/, id: /^<section id="([^"]+)"/, end: '</section>',
    title: /<h2 class="chap">([\s\S]*?)<\/h2>/ },
  /* 시네마틱 스토리 — 보장분석 상담자료가 장 안에서 띄우는 이야기 열 편(openStoryModal).
     한 파일이 한 장입니다(files). 그 파일을 그대로 엽니다 */
  { k: 'story', n: '시네마틱 스토리', dir: '상담자료/', screen: 'sangdam', win: 1, jump: 'file',
    files: ['demo_curve.html', 'demo_premium.html', 'demo_cancer.html', 'demo_brain.html', 'demo_heart.html',
            'demo_silbi.html', 'demo_care.html', 'demo_case4000.html', 'demo_casegallery.html', 'demo_closing.html'] }
];
const MAXT = 1000;                      /* 장 하나의 글 — 찾기와 앞부분 보이기에 넉넉한 만큼 */

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', hellip: '…', rarr: '→', larr: '←',
              mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', times: '×', le: '≤', ge: '≥' };
function unent(s) {
  return s.replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
          .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(parseInt(d, 10)))
          .replace(/&([a-z]+);/gi, (m, n) => (ENT[n.toLowerCase()] != null ? ENT[n.toLowerCase()] : m));
}
/* 글자만 — 스크립트 · 스타일 · 그림 속 글 · 템플릿 자리(${…})는 뺀다 */
function text(h) {
  return unent(String(h)
    .replace(/<!--[\s\S]*?-->/g, ' ')                     /* 주석 — 안에 「>」 가 있어 꼬리가 새던 자리 */
    .replace(/<(script|style|svg|template|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\$\{[^}]*\}/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function firstHead(h) {
  const m = /<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/i.exec(h);
  return m ? text(m[2]) : '';
}
function build() {
  return DECKS.map(d => {
    if (d.files) {
      const slides = d.files.map((fn, i) => {
        const src = fs.readFileSync(path.join(ROOT, 'app', d.dir, fn), 'utf8');
        const tm = /<title>([\s\S]*?)<\/title>/i.exec(src), body = src.replace(/<head\b[\s\S]*?<\/head>/i, ' ');
        const x = text(body), tt = tm ? text(tm[1]) : '';
        return { id: fn, n: i + 1, t: (tt || firstHead(body) || x.slice(0, 40)).slice(0, 80), x: x.slice(0, MAXT), f: d.dir + fn };
      }).filter(s => s.x);
      return { k: d.k, n: d.n, file: d.dir, screen: d.screen, frame: '', win: 1, jump: d.jump, slides: slides };
    }
    const src = fs.readFileSync(path.join(ROOT, 'app', d.file), 'utf8');
    /* 덱 뒤쪽 스크립트가 마지막 장에 붙지 않게 — 본문만 */
    const body = src.replace(/<script\b[\s\S]*?<\/script>/gi, ' ');
    const parts = body.split(d.split).slice(1);
    const slides = [];
    parts.forEach((p, i) => {
      if (d.end) { const e = p.indexOf(d.end); if (e > 0) p = p.slice(0, e); }
      let id = '', t = '';
      if (d.id) { const m = d.id.exec(p); id = m ? m[1] : ''; }
      if (d.tattr) { const m = new RegExp(d.tattr + '="([^"]*)"').exec(p); t = m ? unent(m[1]).trim() : ''; id = t; }
      const x = text(p);
      if (!t && d.title) { const m = d.title.exec(p); t = m ? text(m[1]) : ''; }
      if (!t) t = firstHead(p) || x.slice(0, 40);
      if (!x || !id) return;
      slides.push({ id: id, n: slides.length + 1, t: t.slice(0, 80), x: x.slice(0, MAXT) });
    });
    return { k: d.k, n: d.n, file: d.file, screen: d.screen, frame: d.frame || '', win: d.win ? 1 : 0, jump: d.jump, slides: slides };
  });
}
function render(D) {
  return '/* ⚠ <b>손으로 고치지 마십시오</b> — node scripts/deck-index.js 가 덱에서 뽑습니다 (판 X273).\n' +
         '   덱을 고쳤으면 그 명령을 다시 돌리십시오. 어긋나면 check-jvdeck 이 빨간불을 켭니다.\n' +
         '   🤖 자비스 모드(app/apex-map.html)가 이것으로 상담자료 덱의 장을 찾고 그 장을 엽니다. */\n' +
         'window.APEX_DECKS = ' + JSON.stringify(D) + ';\n';
}
module.exports = { build, render, OUT, DECKS };
if (require.main === module) {
  const D = build();
  fs.writeFileSync(OUT, render(D));
  console.log('덱 색인을 썼습니다 — ' + D.map(d => d.n + ' ' + d.slides.length + '장').join(' · ') +
              ' (' + Math.round(fs.statSync(OUT).size / 1024) + 'KB)');
}
