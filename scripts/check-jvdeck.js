/* 🎞 <b>자비스의 덱 색인이 덱과 같은가</b> (판 X273)

   자비스는 상담자료 덱 넷(3MB)을 통째로 받지 않고, scripts/deck-index.js 가 뽑아 둔
   색인(app/apex-deck-index.js · 0.3MB)으로 장을 찾습니다. 그래서 <b>덱을 고치고 색인을
   안 뽑으면</b> 자비스가 고객 앞에 <b>옛 글</b>을 내놓습니다 (1번).

   여기서 지키는 것 (브라우저 없이 · 몇 초)
     [1] 색인이 지금 덱에서 뽑은 것과 <b>한 글자도 다르지 않다</b> — 다르면 고칠 명령을 적어 줍니다
     [2] 덱마다 장이 서 있다 · 이름표가 겹치지 않는다 · 제목이 비지 않는다
     [3] 글에 꼬리표·주석·템플릿 자리(<b>, -->, ${…}, &mdash;)가 안 샌다
     [4] 덱이 가리키는 화면이 앱에 있다(TABS) · 가는 법이 자비스가 아는 넷 중 하나다
   ★ 덱을 고치는 갈래(다. 발표 덱)는 고친 뒤 <b>node scripts/deck-index.js</b> 한 번이면 됩니다. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DI = require('./deck-index.js');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

console.log('자비스 덱 색인 — 덱과 같은가 (판 X273)');
const D = DI.build(), want = DI.render(D);
const have = fs.existsSync(DI.OUT) ? fs.readFileSync(DI.OUT, 'utf8') : '';

console.log('\n[1] 색인이 지금 덱과 같다');
is(!!have, 'app/apex-deck-index.js 가 있다');
is(have === want, have === want ? '색인이 덱과 <b>한 글자도 다르지 않다</b>'
  : '색인이 덱과 <b>다릅니다</b> — 덱을 고치셨으면 <b>node scripts/deck-index.js</b> 를 한 번 돌리고 그 파일을 같이 올리십시오' +
    ' (안 그러면 자비스가 고객 앞에 옛 글을 내놓습니다)');

console.log('\n[2] 덱마다 장이 서 있다');
D.forEach(d => {
  const ids = d.slides.map(s => s.id), dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  const empty = d.slides.filter(s => !s.t || !s.x).length;
  is(d.slides.length >= 10 && !dup.length && !empty,
     d.n + ' — ' + d.slides.length + '장 · 겹친 이름표 ' + dup.length + ' · 빈 제목·글 ' + empty +
     (d.slides.length < 10 ? ' ← 장이 거의 안 잡힙니다. 덱의 짜임이 바뀌었으면 scripts/deck-index.js 의 split 을 고치십시오' : ''));
});

console.log('\n[3] 글에 꼬리표·주석·자리가 안 샌다');
const leak = [];
D.forEach(d => d.slides.forEach(s => { if (/<[a-z\/!]|-->|\$\{|&[a-z]+;/i.test(s.t + ' ' + s.x)) leak.push(d.k + ':' + s.id); }));
is(leak.length === 0, '샌 장 ' + leak.length + (leak.length ? ' ← ' + leak.slice(0, 5).join(', ') : ''));

console.log('\n[4] 덱이 가리키는 화면 · 가는 법');
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const JV = fs.readFileSync(path.join(ROOT, 'app/apex-map.html'), 'utf8');
D.forEach(d => {
  const tab = new RegExp("\\{id:'" + d.screen + "'").test(SRC);
  const fr = !d.frame || new RegExp('id="' + d.frame + '"').test(SRC);
  const jp = new RegExp("d\\.jump === '" + d.jump + "'").test(JV);
  is(tab && fr && jp, d.n + ' — 화면 ' + d.screen + (tab ? '' : ' ✗없음') + (d.frame ? ' · 틀 ' + d.frame + (fr ? '' : ' ✗없음') : ' · 새 창') +
     ' · 가는 법 ' + d.jump + (jp ? '' : ' ✗자비스가 모름'));
});

console.log('\n' + (bad ? '✗ ' + bad + '곳이 어긋났습니다' : '✓ 자비스의 덱 색인이 덱과 같습니다'));
process.exit(bad ? 1 : 0);
