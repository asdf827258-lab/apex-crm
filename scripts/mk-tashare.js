/* 📤 <b>신입 TA 공유본</b> 만들기 — 파일 하나로 열리는 HTML (사장님 말씀 X94 · 2026-10-11
   「따로 공유 버전으로 html 만들어서 보내줄래 — 질문지 / ta 스크립트 / 거절처리만 따로」)

     node scripts/mk-tashare.js [내보낼 경로]      (기본: ./신입TA_공유본_무사고할인.html)

   ★ 글은 <b>손으로 옮기지 않습니다</b> — 앱의 두 출처에서 꺼냅니다 (5번).
       app/ta-train.html : 스크립트 · 흐름 · 질문지 · 가까워지는 질문 · 회사표 · 거절 응대(이 전화만의 줄)
       apex-stage.js     : 거절의 받는 말(TA 스크립트와 같은 글)
     앱을 고치면 이것을 다시 돌리면 됩니다.
   ★ <b>자바스크립트 없이도 세 칸이 다 섭니다</b> — 파일 미리보기·메신저 미리보기는 스크립트를
     안 돌립니다. 2026-10-12 「스크립트가 없던데」 — 그런 곳에서 질문지 칸만 보였습니다.
     탭은 그 칸으로 건너뛰는 링크, 단계의 🛡 단추는 그 거절 응대로 건너뛰는 링크입니다.
     스크립트가 돌면 그때만 탭 · 옆 칸 · 아래 판으로 갈라 씁니다.
   ★ 이 파일은 저장소에 <b>만든 결과물을 두지 않습니다</b> — 회원 전용 카페 글이 바탕이라
     공유는 사람이 고른 곳으로만 나갑니다. 점검(check-tatrain [14])이 만들어 보고 지웁니다. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = process.argv[2] || path.join(process.cwd(), '신입TA_공유본_무사고할인.html');
const TT = fs.readFileSync(path.join(ROOT, 'app/ta-train.html'), 'utf8');
const grab = n => { const m = TT.match(new RegExp('var ' + n + '=(\\[[\\s\\S]*?\\n\\]);')); if (!m) throw n; return Function('return ' + m[1])(); };
const STEPS = grab('TT_STEPS'), SHEET = grab('TT_SHEET'), NEAR = grab('TT_NEAR'), CO = grab('TT_CO');
const TOBJ = grab('TT_OBJ'), CDIFF = grab('TT_CORE_DIFF'), CLOSS = grab('TT_CORE_LOSS'), PARK = grab('TT_PARK'), TOP = grab('TT_OB_TOP');
const BACK = Function('return ' + TT.match(/var TT_BACK=(\{[\s\S]*?\n\});/)[1])();
const badge = l => (!l.n && !l.c) ? '질문 0 — 내가 말한다' : (l.n ? '새 질문 ' + l.n : '') + (l.n && l.c ? ' · ' : '') + (l.c ? '확인 ' + l.c : '');
const NEWQ = STEPS.reduce((a, s) => a + (s.lead ? s.lead.n : 0), 0), CONQ = STEPS.reduce((a, s) => a + (s.lead ? s.lead.c : 0), 0);
global.window = {}; require(path.join(ROOT, 'apex-stage.js'));
const S = window.APEX_STAGE, OBJ = S.objList();
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl = s => esc(s).replace(/\n/g, '<br>');
const dot = d => { const p = d.split('-'); return p[0] + '. ' + (+p[1]) + '. ' + (+p[2]); };
const byT = t => { const o = OBJ.filter(x => x.title === t)[0]; if (!o) throw '거절 없음: ' + t; return o; };
/* 앱(ta-train.html)의 ttObjView 와 같은 셈 — 받는 말은 표에서 그대로, 이 전화만의 두 줄은 TT_OBJ 에서 */
const VIEWS = TOBJ.map(o => {
  const st = o.ref ? byT(o.ref) : null, f = t => S.objFill(t, '○○○');
  return { k: o.k, t: o.t, at: o.at, ref: o.ref,
    quick: o.quick || '', first: st ? f(st.text) : o.first, diff: o.diff, loss: o.loss || '',
    ask: st ? f(st.follow) : o.ask, avoid: st ? st.avoid : o.avoid, stop: st ? st.stop : o.stop, bye: o.bye || '' };
});
const viewHtml = (v, step) => { const bk = BACK[step || v.at[0]]; return '<div class="ob-t2">「' + esc(v.t) + '」</div>' +
  '<div class="lb">🗣 바로 이렇게 — 한 숨에</div><div class="quick">' + esc(v.quick) + '</div>' +
  (bk ? '<div class="back"><b>↩ 다시 끌고 오기</b> 「' + esc(bk.say) + '」 → ' + esc(bk.to) + '</div>' : '') +
  '<details class="more"><summary>풀어서 보기 — 받는 말 · 왜 다른가 · 손해 · 이어서 묻기</summary>' +
  '<div class="lb">① 먼저 받는다' + (v.ref ? ' · 앱 TA 스크립트와 같은 글' : '') + '</div><div class="first">' + nl(v.first) + '</div>' +
  '<div class="lb">② 왜 이 전화는 다른가</div><div class="diff">' + esc(v.diff) + '</div>' +
  (v.loss ? '<div class="lb">③ 안 받으시면 손해 (늘 「대상이시면」)</div><div class="loss">' + esc(v.loss) + '</div>' : '') +
  (v.ask ? '<div class="lb">' + (v.loss ? '④' : '③') + ' 이어서 묻는다</div><div class="ask">' + nl(v.ask) + '</div>' : '') +
  (v.avoid ? '<div class="avoid"><b>✕ 피할 말</b> ' + nl(v.avoid) + '</div>' : '') + '</details>' +
  ((v.stop || v.bye) ? '<div class="stop"><b>■ 여기서 멈춘다</b> ' + nl(v.stop) + (v.bye ? ' 마치더라도 이 한마디는 — ' + esc(v.bye) : '') + '</div>' : ''); };
const flowHtml = '<details class="card fold"><summary><h2>🧭 말의 흐름은 내가 끌고 간다 <span class="hint">— 새 질문은 하나뿐 · 눌러서 펼치기</span></h2></summary><p>처음에 질문을 많이 하면 고객은 <b>조사받는다</b>고 느끼고 끊습니다. 처음 30초는 <b>내가 말합니다.</b></p><ol class="rules">' +
  ['<b>첫 30초는 내가 말한다</b> — 누가 · 왜 · 「확인만」 세 마디를 쉬지 않고. 1단계 원문이 그렇게 짜여 있습니다.',
   '<b>묻지 말고 확인받는다</b> — 이미 아는 것(보험료 · 시간 · 주소 · 생년월일)은 <b>내가 말하고</b> 「맞으시죠?」 만.',
   '<b>질문은 한 번에 하나, 답이 쉬운 것</b> — 예·아니오, 아니면 둘 중 하나. 열린 질문은 만나서.',
   '<b>답을 받으면 짧게 받고 바로 내 다음 문장</b> — 「네, 그러시군요.」 하고 <b>원문의 이음말</b>로 넘어갑니다.',
   '<b>옆길로 새면 되돌린다</b> — 설명을 원하시면 「그건 종이로 보여 드릴게요」 — 설명은 방문의 이유가 됩니다.'].map(x => '<li>' + x + '</li>').join('') +
  '</ol><h3>질문 수 지도 — 원문 6단계</h3><div class="qmap">' + STEPS.map((s, i) => '<div class="qc' + (s.lead && s.lead.n ? ' new' : '') + '"><b>' + (i + 1) + '</b><span>' + badge(s.lead || { n: 0, c: 0 }) + '</span></div>').join('') + '</div>' +
  '<p class="note">통화 전체에서 <b>새로 묻는 질문은 ' + NEWQ + '개</b>(3단계 복용약)이고, 나머지 ' + CONQ + '개는 <b>내가 말하고 확인만</b> 받습니다.</p>' +
  '<h3>되돌리는 말 — 옆길에서 제자리로</h3><ul>' + PARK.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></details>';
const coreHtml = '<details class="card core fold"><summary><h2>🛡 거절이 나오면 — 이 전화의 무기 둘 <span class="hint">— 왜 다른가 · 손해 · 눌러서 펼치기</span></h2></summary><div class="two">' +
  '<div><h3>왜 이 전화는 다른가</h3><ol>' + CDIFF.map(x => '<li>' + x + '</li>').join('') + '</ol></div>' +
  '<div><h3>안 받으시면 손해 <span class="at">늘 「대상이시면」</span></h3><ol>' + CLOSS.map(x => '<li>' + x + '</li>').join('') + '</ol></div></div>' +
  '<p class="note">순서 — 먼저 받고(인정) → <b>다른 점</b> 한 문장 → <b>손해</b> 한 문장 → 고르게 묻는다. 두 번째 거절이면 붙잡지 않고, <b>보험사에 물어볼 말 한 줄</b>은 드리고 마칩니다.</p></details>';
const STG = ['통화를 시작하자마자 (1단계)', '실비 이야기에서 (2단계)', '방문 전 확인에서 (3단계)', '일정·주소에서 (4단계)', '본인확인에서 (5단계)', '마무리에서 (6단계)'];
let objN = 0;
const objHtml = STG.map((g, i) => {
  const vs = VIEWS.filter(v => v.at[0] === i + 1); if (!vs.length) return '';
  return '<h3 class="grp">' + esc(g) + '</h3>' + vs.map(v => { objN++;
    return '<details class="obj" id="ob-' + v.k + '" open><summary><span class="ob-no">' + objN + '</span><span class="ob-t">「' + esc(v.t) + '」</span><span class="ob-tone">' + esc(v.quick.split(/(?<=[.?—])\s/)[0]) + '</span></summary><div class="ob-b">' + viewHtml(v) + '</div></details>';
  }).join('');
}).join('');
const skipped = [];
const stepHtml = STEPS.map((s, i) => '<div class="step" data-st="' + (i + 1) + '"><h3><span class="no">' + (i + 1) + '</span>' + esc(s.t) + '</h3>' +
  '<div class="orig">' + s.say.replace(/\n/g, '<br>') + '</div>' +
  (s.rule ? '<div class="rule">📌 원문 규칙 — ' + esc(s.rule) + '</div>' : '') +
  (s.extra ? '<div class="orig sm">' + nl(s.extra) + '</div>' : '') +
  (s.lead ? '<div class="lead"><span class="qn' + (s.lead.n ? ' new' : '') + '">' + badge(s.lead) + '</span> 🧭 ' + s.lead.how + '<div class="link">이음말 — 「' + esc(s.lead.link) + '」 · 이 말로 다음으로 넘어갑니다</div></div>' : '') +
  '<p class="why"><b>왜</b> — ' + s.why + '</p><div class="warn"><b>⚠ 조심</b> — ' + s.warn + '</div>' +
  (s.bridge ? '<div class="bridge"><b>🌉 ' + esc(s.bridge.head) + '</b><ul>' + s.bridge.tips.map(x => '<li>' + x + '</li>').join('') + '</ul>' +
    '<div class="lb">이렇게 넘어갑니다 — 교육용으로 다듬은 말 (원문 아님)</div><div class="bridge-say">' + nl(s.bridge.say) + '</div>' +
    '<div class="oblist" style="margin-top:6px">' + s.bridge.obs.map(k => VIEWS.filter(v => v.k === k).map(v => '<a class="ob" href="#ob-' + v.k + '" data-ob="' + v.k + '">「' + esc(v.t) + '」</a>').join('')).join('') + '</div></div>' : '') +
  (VIEWS.some(v => v.at.indexOf(i + 1) >= 0) ? '<div class="stepob"><div class="lb">🛡 이 단계에서 나오는 말 — 누르면 바로 응대</div><div class="oblist">' +
    VIEWS.filter(v => v.at.indexOf(i + 1) >= 0).map(v => '<a class="ob" href="#ob-' + v.k + '" data-ob="' + v.k + '">「' + esc(v.t) + '」</a>').join('') + '</div></div>' : '') +
  '</div>').join('');

const sheetHtml = SHEET.map(q => '<div class="ck"><div class="ck-t"><span class="stg">' + q.s + '단계</span>' + esc(q.t) + '</div>' +
  (q.h ? '<div class="ck-h">' + esc(q.h) + '</div>' : '') + '<div class="opts">' +
  q.o.map(v => '<label><input type="checkbox"> ' + esc(v) + '</label>').join('') + '</div></div>').join('');

const nearHtml = NEAR.map(g => '<h3 class="grp">' + esc(g.g) + ' <span class="at">' + esc(g.at) + '</span></h3>' +
  g.qs.map(q => '<div class="nq"><div class="nq-s">「' + esc(q.say) + '」</div><p><b>왜</b> — ' + q.why + '</p><p><b>답을 들으면</b> — ' + esc(q.next) + '</p></div>').join('')).join('');

const coRow = g => CO.filter(c => c.g === g).map(c => '<tr><td>' + esc(c.n) + '</td><td>' + dot(c.d) + '</td></tr>').join('');

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>신입 TA 공유본 — 무사고 할인 전환</title>
<script>document.documentElement.className+=' js';</script>
<style>
:root{--bg:#F5F7FB;--card:#fff;--ink:#111827;--sub:#5B6475;--line:#E3E7EE;--pt:#1B4FD8;--pt-l:#EAF1FF;--pt-d:#173C9E;
  --neg:#C62828;--neg-l:#FDECEC;--warn:#B76E00;--warn-l:#FFF6E5;--pos:#18794E;--pos-l:#E8F6EE;--r:16px}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);line-height:1.62;letter-spacing:-.01em;
  font-family:"Pretendard Variable",Pretendard,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",system-ui,sans-serif}
.wrap{max-width:820px;margin:0 auto;padding:16px 16px 56px}
.hd{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:18px}
.hd h1{margin:0 0 4px;font-size:21px;line-height:1.35}
.hd .sub{margin:0;color:var(--sub);font-size:13.5px}
.must{margin-top:12px;background:var(--neg-l);border-radius:12px;padding:10px 14px;font-size:14px}
.must b{color:var(--neg)}
.must ul{margin:4px 0 0;padding-left:18px}
.tabs{position:sticky;top:0;z-index:5;display:flex;gap:6px;padding:10px 0;background:var(--bg)}
.tabs a,.tabs button{display:flex;align-items:center;justify-content:center;text-decoration:none;flex:1;min-height:46px;border:1px solid var(--line);border-radius:12px;background:var(--card);
  font:inherit;font-weight:800;font-size:14.5px;cursor:pointer;color:var(--ink);white-space:nowrap;padding:0 6px}
.tabs a.on{background:var(--pt);border-color:var(--pt);color:#fff}
.tabs .pr{flex:0 0 46px;padding:0;display:none}
.js .tabs .pr{display:flex}
/* ★ 자바스크립트 없이도 세 칸이 다 선다 — 파일 미리보기·메신저 미리보기는 스크립트를 안 돌린다
   (2026-10-12 「스크립트가 없던데」 — 스크립트가 꺼진 곳에서 질문지 칸만 보였다). 돌 때만 탭으로 가른다 */
section{display:block;scroll-margin-top:70px}
.js section{display:none}
.js section.on{display:block}
.nojs-note{background:var(--pt-l);border-radius:10px;padding:8px 12px;font-size:13.5px;margin:0 0 10px}
.js .nojs-note{display:none}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:16px 18px;margin-bottom:12px}
h2{margin:0 0 6px;font-size:18px}
h3{font-size:16px;margin:0 0 8px}
h3.grp{margin:18px 0 8px;font-size:15px;color:var(--pt-d)}
h3.grp:first-child{margin-top:4px}
.at{font-size:12px;font-weight:700;color:var(--sub);background:var(--bg);border:1px solid var(--line);border-radius:999px;padding:1px 8px}
.note{color:var(--sub);font-size:13.5px;margin:4px 0 0}
.flow{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 0}
.flow span{font-size:13px;font-weight:800;padding:3px 10px;border-radius:999px;background:var(--pt-l);color:var(--pt-d)}
.step{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:16px;margin-bottom:12px}
.step h3{display:flex;align-items:center;gap:10px;font-size:17px}
.no{flex:0 0 32px;height:32px;border-radius:50%;background:var(--pt);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900}
.orig{border-left:4px solid var(--pt);background:var(--pt-l);border-radius:0 10px 10px 0;padding:10px 12px;font-size:16px}
.orig.sm{font-size:14.5px;margin-top:8px}
.orig em{font-style:normal;font-weight:900;color:var(--neg)}
.rule{margin-top:8px;border:2px solid var(--neg);background:var(--neg-l);border-radius:10px;padding:8px 12px;font-weight:800}
.why{font-size:14.5px;margin:10px 0 0}
.warn{margin-top:8px;background:var(--warn-l);border:1px solid var(--warn);border-radius:10px;padding:8px 12px;font-size:14px}
.ck{border-top:1px solid var(--line);padding:10px 0}
.ck:first-child{border-top:0}
.ck-t{font-weight:800}
.stg{display:inline-block;font-size:12px;font-weight:800;color:var(--pt-d);background:var(--pt-l);border-radius:6px;padding:0 6px;margin-right:6px}
.ck-h{font-size:13px;color:var(--sub)}
.opts{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:6px}
.opts label{display:flex;align-items:center;gap:6px;min-height:36px;font-size:14.5px;cursor:pointer}
.opts input{width:20px;height:20px;accent-color:var(--pt)}
.memo{margin-top:10px;border:1px dashed var(--line);border-radius:10px;min-height:70px;padding:8px 12px;color:var(--sub);font-size:13px}
.nq{border-top:1px solid var(--line);padding:10px 0}
.nq-s{font-size:16px;font-weight:800}
.nq p{margin:4px 0 0;font-size:14px}
.nq p b,.why b{color:var(--pt-d)}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{padding:6px;border-bottom:1px solid var(--line);text-align:left}
th{font-size:12.5px;color:var(--sub)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media (max-width:620px){.two{grid-template-columns:1fr}}
.flow4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px}
@media (max-width:620px){.flow4{grid-template-columns:1fr 1fr}}
.flow4 div{background:var(--bg);border-radius:10px;padding:10px}
.flow4 b{display:block;color:var(--pt-d)}
.flow4 span{font-size:13px}
.obj{scroll-margin-top:70px;border:1px solid var(--line);border-radius:12px;margin-bottom:8px;background:var(--card)}
.obj summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:28px 1fr;gap:2px 10px;padding:12px 14px;align-items:center}
.obj summary::-webkit-details-marker{display:none}
.ob-no{grid-row:span 2;width:28px;height:28px;border-radius:50%;background:var(--pt-l);color:var(--pt-d);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px}
.ob-t{font-weight:900;font-size:16px}
.ob-tone{font-size:13px;color:var(--sub)}
.obj[open] summary{border-bottom:1px solid var(--line)}
.ob-b{padding:4px 14px 14px}
.lb{font-size:12.5px;font-weight:800;color:var(--sub);margin:10px 0 3px}
.say{background:var(--pt-l);border-radius:10px;padding:10px 12px;font-size:15.5px}
.say2{background:var(--bg);border-radius:10px;padding:10px 12px;font-size:15px}
.ob-b p{margin:0;font-size:14px}
.avoid{margin-top:8px;font-size:14px;background:var(--neg-l);border-radius:10px;padding:8px 12px}
.avoid b{color:var(--neg)}
.stop{margin-top:6px;font-size:14px;background:var(--bg);border-radius:10px;padding:8px 12px}
/* 🛡 스크립트 옆 바로 응대 */
.core ol{margin:4px 0 0;padding-left:20px}.core li{font-size:14.5px;margin:3px 0}.core h3{margin:6px 0 2px}
.duo{display:block}
.js .duo{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:12px;align-items:start}
.objp{display:none}
.js .objp{display:block;position:sticky;top:66px;max-height:calc(100vh - 76px);overflow:auto;background:var(--card);border:2px solid var(--pt);border-radius:var(--r);padding:12px}
.objp-hd{display:flex;align-items:center;justify-content:space-between;font-size:16px;margin-bottom:6px}
.objp-x{display:none;min-width:44px;min-height:44px;border:0;background:none;font-size:18px;cursor:pointer}
.objp-body:empty{display:none}
.objp-body{margin-bottom:10px;border-bottom:1px solid var(--line);padding-bottom:10px}
.objp-hint{font-size:12.5px;font-weight:800;color:var(--sub);margin-bottom:4px}
.objp-more{display:none;width:100%;min-height:44px;border:1px solid var(--line);border-radius:12px;background:var(--bg);font:inherit;font-weight:800;cursor:pointer}
.oblist{display:flex;flex-wrap:wrap;gap:5px}
.ob{display:inline-flex;align-items:center;text-decoration:none;min-height:36px;padding:0 10px;border:1px solid var(--line);border-radius:999px;background:var(--card);font:inherit;font-weight:700;font-size:13px;cursor:pointer;text-align:left;color:var(--ink)}
.ob.on{background:var(--pt);border-color:var(--pt);color:#fff}
.stepob{margin-top:10px;padding-top:8px;border-top:1px dashed var(--line)}
.fold{padding:12px 18px}.fold>summary{cursor:pointer;list-style:none;min-height:44px;display:flex;align-items:center}
.fold>summary::-webkit-details-marker{display:none}.fold>summary h2{margin:0;font-size:16px}
.fold .hint{font-size:12.5px;font-weight:700;color:var(--sub)}
.rules{margin:6px 0;padding-left:20px}.rules li{font-size:14.5px;margin:4px 0}
.qmap{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:6px 0}
@media (max-width:620px){.qmap{grid-template-columns:repeat(3,1fr)}}
.qc{background:var(--bg);border-radius:10px;padding:8px 6px;text-align:center;font-size:12.5px;line-height:1.35}
.qc b{display:block;font-size:18px;color:var(--pt-d)}.qc.new{background:var(--warn-l)}
.lead{margin-top:10px;background:var(--bg);border-radius:10px;padding:8px 10px;font-size:14px}
.qn{display:inline-block;font-size:12px;font-weight:900;padding:1px 8px;border-radius:999px;background:var(--pt-l);color:var(--pt-d);margin-right:4px}
.qn.new{background:var(--warn-l);color:var(--warn)}
.link{margin-top:4px;font-size:13px;color:var(--sub)}
.oblist .sub{flex:0 0 100%;font-size:12px;font-weight:800;color:var(--sub);margin-top:4px}
.ob.top{border-color:var(--pt)}
.quick{background:var(--pt);color:#fff;border-radius:10px;padding:10px 12px;font-size:16px;font-weight:800;line-height:1.55}
.back{margin-top:6px;font-size:14px;background:var(--pos-l);border-radius:10px;padding:6px 10px}
.more{margin-top:8px}.more summary{cursor:pointer;font-size:13px;font-weight:800;color:var(--pt-d);min-height:36px;display:flex;align-items:center}
.bridge{margin-top:10px;border:1px solid var(--pos);background:var(--pos-l);border-radius:10px;padding:10px 12px;font-size:14px}
.bridge ul{margin:4px 0 0;padding-left:18px}
.bridge-say{background:var(--card);border-radius:10px;padding:8px 10px;font-size:15px;font-weight:700}
.ob-t2{font-size:17px;font-weight:900;margin-bottom:2px}
.first{background:var(--bg);border-radius:10px;padding:8px 10px;font-size:14px}
.diff{background:var(--pt-l);border-left:4px solid var(--pt);border-radius:0 10px 10px 0;padding:8px 10px;font-size:15px;font-weight:700}
.loss{background:var(--warn-l);border-left:4px solid var(--warn);border-radius:0 10px 10px 0;padding:8px 10px;font-size:15px;font-weight:700}
.ask{background:var(--pos-l);border-radius:10px;padding:8px 10px;font-size:14.5px}
.fab{display:none}
@media (max-width:900px){
  .js .duo{grid-template-columns:1fr}
  .objp{position:fixed;left:0;right:0;bottom:0;top:auto;max-height:72vh;z-index:20;border-radius:var(--r) var(--r) 0 0;border-width:2px 0 0;
    box-shadow:0 -8px 24px rgba(0,0,0,.18);transform:translateY(105%);transition:transform .2s}
  .objp.open{transform:none}
  .objp-x{display:block}
  .objp.has .oblist,.objp.has .objp-hint{display:none}
  .objp.has .objp-more{display:block}
  .js #s.on .fab{display:block;position:fixed;right:16px;bottom:16px;z-index:19;min-height:48px;padding:0 18px;border:0;border-radius:999px;
    background:var(--pt);color:#fff;font:inherit;font-weight:900;font-size:15px;box-shadow:0 6px 16px rgba(0,0,0,.2)}
}
.foot{color:var(--sub);font-size:12.5px;margin-top:18px}
.foot a{color:var(--pt)}
@media print{
  body{background:#fff}
  .tabs{display:none}
  section{display:block!important;break-before:page}
  section:first-of-type{break-before:auto}
  .step,.obj,.ck,.nq{break-inside:avoid}
  .obj summary{border-bottom:1px solid var(--line)}
  .objp,.fab,.stepob{display:none!important}
  details.more{display:block}
  .nojs-note{display:none}
  .duo{display:block}
}
</style>
</head>
<body>
<div class="wrap">
  <div class="hd">
    <h1>📞 신입 TA 공유본 — 건강보험 무사고 할인 전환</h1>
    <p class="sub">보장분석 DB 전화용 · 질문지 / TA 스크립트 / 거절처리 세 갈래로 나눴습니다. 인쇄하면 세 갈래가 한 장씩 차례로 나옵니다.</p>
    <div class="must"><b>전화 전에 꼭</b>
      <ul>
        <li>대상 여부·할인율은 <b>보험사가 확인·심사</b>합니다 — 「대상이십니다」「몇 % 깎여요」라고 말하지 않습니다.</li>
        <li>할인은 <b>신청한 날부터</b> 적용되고 지난 보험료는 <b>소급되지 않습니다.</b></li>
        <li>입원·수술 사실은 보험사에 <b>사실대로</b> 알려야 합니다 — 안 알리면 전환 무효·할인분 반환이 될 수 있습니다.</li>
        <li>신입은 <b>주민번호를 전화로 받지 않습니다</b> — 현장에서, 회사 절차로.</li>
      </ul>
    </div>
  </div>

  <div class="tabs" id="tabs">
    <a href="#q" data-t="q" class="on">📝 질문지</a>
    <a href="#s" data-t="s">☎️ 스크립트</a>
    <a href="#o" data-t="o">🛡️ 거절처리</a>
    <button class="pr" onclick="window.print()" aria-label="인쇄">🖨️</button>
  </div>

  <p class="nojs-note">이 화면은 <b>질문지 → 스크립트 → 거절처리</b> 순서로 이어집니다. 위 단추를 누르면 그 칸으로 건너뜁니다. 스크립트 안의 「🛡 이 단계에서 나오는 말」을 누르면 그 거절의 응대로 갑니다.</p>
  <section id="q" class="on">
    <div class="card">
      <h2>통화 질문지</h2>
      <p class="note">스크립트 순서대로 짚습니다. 고객 이름·주민번호·약 이름·병명은 <b>적지 않습니다.</b></p>
      ${sheetHtml}
      <div class="memo">메모 (이름·번호·병명 없이)</div>
    </div>
    <div class="card">
      <h2>고객과 가까워지고 이해하는 질문</h2>
      <p class="note">스크립트는 할 말, 이 질문들은 <b>들을 자리</b>입니다. 단계 사이에 하나씩 — 다 묻지 않습니다. 묻고 기다리고, 고객의 말을 그대로 되받고, 대상·할인율은 「보험사에서 확인해 드려요」로 넘깁니다.</p>
      ${nearHtml}
    </div>
    <div class="card">
      <h2>참고 — 회사별 최초 판매일</h2>
      <p class="note">2022년 7월 이전 가입은 대부분 해당 없음 · 같은 회사라도 상품명·유형·개정 시점에 따라 다름 → <b>반드시 보험사 확인</b></p>
      <div class="two">
        <table><thead><tr><th>손해보험사</th><th>최초 판매</th></tr></thead><tbody>${coRow('손해보험사')}</tbody></table>
        <table><thead><tr><th>생명보험사</th><th>최초 판매</th></tr></thead><tbody>${coRow('생명보험사')}</tbody></table>
      </div>
    </div>
  </section>

  <section id="s">
    <div class="card">
      <h2>보장분석 DB 스크립트 — 6단계</h2>
      <div class="flow">${STEPS.map((s, i) => '<span>' + (i + 1) + ' ' + esc(s.t) + '</span>').join('')}</div>
      <p class="note">파란 칸은 <b>원문 그대로</b>입니다(A+에셋 미라클지점). ○○○ 자리는 DB에 적힌 것으로 채웁니다. 질문 뒤에는 고객이 답할 때까지 먼저 말하지 않습니다.</p>
    </div>
    ${flowHtml}
    ${coreHtml}
    <div class="duo">
      <div>${stepHtml}</div>
      <aside class="objp" id="objp" aria-label="거절 바로 응대">
        <div class="objp-hd"><b>🛡 바로 응대</b><button class="objp-x" id="objpX" aria-label="닫기">✕</button></div>
        <div class="objp-body" id="objpBody"></div>
        <button class="objp-more" id="objpMore">↩ 다른 말 고르기</button>
        <div class="objp-hint">고객이 한 말을 고르세요</div>
        <div class="oblist"><div class="sub">자주 나오는 말</div>${TOP.map(k => VIEWS.filter(v => v.k === k)[0]).map(v => '<button class="ob top" data-ob="' + v.k + '">' + esc(v.t) + '</button>').join('')}<div class="sub">그 밖의 말</div>${VIEWS.filter(v => TOP.indexOf(v.k) < 0).map(v => '<button class="ob" data-ob="' + v.k + '">' + esc(v.t) + '</button>').join('')}</div>
      </aside>
    </div>
    <button class="fab" id="fab">🛡 거절 나왔다</button>
  </section>

  <section id="o">
    ${coreHtml}
    <div class="card">
      <h2>거절처리 — 기본 순서</h2>
      <div class="flow4">
        <div><b>1 먼저 인정</b><span>「그럴 수 있습니다」로 감정을 먼저 받아 줍니다.</span></div>
        <div><b>2 목적 한 문장</b><span>길게 설명하지 않고 연락 목적을 한 문장으로.</span></div>
        <div><b>3 선택 질문</b><span>예·아니오 대신 두 가지 중 고르게.</span></div>
        <div><b>4 존중하며 종료</b><span>두 번째 거절이면 붙잡지 않고 마칩니다.</span></div>
      </div>
    </div>
    <div class="card">
      <h2>이 스크립트 원문에 있는 반론 둘</h2>
      <h3 class="grp">「주민번호는 왜요?」 — 뒷자리 확인을 거부하실 때</h3>
      <div class="say">(직접 입력하실수있는 kb에서 셀프인증 하나 카카오톡으로 보내드렸는데 직접확인부탁드리겠습니다.)</div>
      <div class="rule" style="margin-top:8px">📌 신입분들은 주민번호 수집하지말고 현장에가서 받을것</div>
      <h3 class="grp">「노트북으로 보면 되잖아요」 — 방문 대신 화면으로 하자실 때 (간편반론)</h3>
      <div class="say">방문해서 노트북으로 설명도와드릴수있는데 대부분의 고객님들이 종이로 되어있는 자료를 선호하십니다</div>
    </div>
    <div class="card">
      <h2>이 전화에서 나오는 거절 ${objN}가지</h2>
      <p class="note">눌러서 펼칩니다. 단계 순서대로 놓았습니다. 받는 말은 앱 TA 스크립트의 거절처리와 같은 글이고, <b>왜 다른가 · 손해</b>는 이 전화만의 말입니다. ○○○ 은 내 이름, “유입 경로” 는 DB를 받은 경로.</p>
      ${objHtml}
    </div>
  </section>

  <p class="foot">바탕 — 에이플러스에셋 온탑HB본부 카페 글(회원 전용) · 「보장분석디비 스크립트」(A+에셋 미라클지점) · 회사별 최초 판매 표.
  숫자 대조 — <a href="https://www.dailian.co.kr/news/view/1697867/">데일리안 「건강보험 무사고 할인 쉬워진다…전화 한 번으로 신청」</a> 2026.10.05 ·
  <a href="https://biz.sbs.co.kr/amp/article/20000338289">SBS Biz 「건강보험 '무사고 할인' 더 손쉽게…전화·모바일로 신청」</a> 2026.10.05.
  「가까워지는 질문」·코칭·「왜 다른가」·「손해」 줄은 교육용으로 새로 쓴 것이고, 거절의 받는 말은 APEX 앱 TA 스크립트의 표와 같은 글입니다. 보험료·보장은 심사 결과에 따릅니다.</p>
</div>
<script>
(function(){
  var tabs=document.getElementById('tabs');
  tabs.onclick=function(e){
    var b=e.target.closest('[data-t]'); if(!b)return; e.preventDefault();
    var bs=tabs.querySelectorAll('[data-t]'),i;
    for(i=0;i<bs.length;i++)bs[i].classList.toggle('on',bs[i]===b);
    var ss=document.querySelectorAll('section');
    for(i=0;i<ss.length;i++)ss[i].classList.toggle('on',ss[i].id===b.getAttribute('data-t'));
    var y=tabs.getBoundingClientRect().top+(window.pageYOffset||0); window.scrollTo(0,y>0?y:0);
  };
  /* 🛡 바로 응대 — 단계 안 단추든 옆 칸 단추든 같은 한 자리로 */
  var V=${JSON.stringify(VIEWS.reduce((m, v) => { m[v.k] = {}; [0, 1, 2, 3, 4, 5, 6].forEach(st => { m[v.k][st] = viewHtml(v, st && v.at.indexOf(st) >= 0 ? st : (st || 0)); }); return m; }, {})).replace(/</g, '\\u003c')};
  var pane=document.getElementById('objp'),body=document.getElementById('objpBody');
  function show(k,st){
    var bs=document.querySelectorAll('.ob'),i;
    for(i=0;i<bs.length;i++)bs[i].classList.toggle('on',bs[i].getAttribute('data-ob')===k);
    if(!k||!V[k]){ body.innerHTML=''; pane.classList.remove('has'); return; }
    body.innerHTML=V[k][st||0]; pane.classList.add('has'); pane.classList.add('open'); pane.scrollTop=0;
  }
  document.getElementById('s').addEventListener('click',function(e){ var b=e.target.closest('.ob'); if(!b)return; e.preventDefault();
    var sp=b.closest('.step'); show(b.getAttribute('data-ob'),sp?+sp.getAttribute('data-st'):0); });
  document.getElementById('fab').onclick=function(){ pane.classList.add('open'); };
  document.getElementById('objpX').onclick=function(){ pane.classList.remove('open'); };
  document.getElementById('objpMore').onclick=function(){ show(''); };
  /* 스크립트가 돌면 거절처리 목록은 접어 둔다(없으면 펴 둔 채로 — 건너뛰어 와서 바로 읽게) */
  var od=document.querySelectorAll('details.obj'),oi; for(oi=0;oi<od.length;oi++)od[oi].open=false;
  /* 인쇄할 때는 접힌 거절처리를 다 편다 */
  window.addEventListener('beforeprint',function(){
    var d=document.querySelectorAll('details.obj,details.fold,details.more'),i; for(i=0;i<d.length;i++)d[i].open=true;
  });
})();
</script>
</body>
</html>
`;
fs.writeFileSync(OUT, html);
console.log('썼습니다', OUT, (html.length / 1024).toFixed(1) + 'KB', '· 거절', objN);
