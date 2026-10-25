/* ══════════════════════════════════════════════════════════════════
   check-nlfeed.js (판 X190) — 📰 <b>부르는 칸 이름이 설정의 칸 이름과
   같은가</b> · 💰 저축 피드가 실제로 서 있나

   사장님 말씀 (2026-10-25) — 「<b>저축 뉴스 피드도 추가해줘</b>」

   ── 왜 이 자가 필요한가 ────────────────────────────────────────────
   판 X187 에서 <b>저축을 일곱째 갈래로</b> 만들었는데, 기사는 경제 피드에서
   걸러 오고 있었습니다. 그래서 저축 칸이 자주 비었습니다. 사장님께는
   「칸은 있는데 기사가 없다」 로 보입니다 — <b>있는 척</b>입니다 (1번).

   ★★ 그리고 이 자리에는 <b>아무도 안 보던 틈</b>이 있었습니다.
     앱은 `NL_FEEDS` 에 적힌 <b>글자 그대로</b> 서버에 칸을 달라고 하고,
     서버(netlify/functions/market.js)는 config/sources.json 의 <b>칸 이름만</b>
     보고 고릅니다. 모르는 이름은 <b>조용히 걸러 버립니다</b>
     (`cats = asked.filter(c => known.indexOf(c) >= 0)`).
     한 글자만 어긋나도 —
       · 오류가 안 납니다
       · 화면도 멀쩡합니다
       · 그 칸 기사만 <b>영영 안 옵니다</b>
     2026-10-25 까지 이 두 자리를 <b>맞대어 보는 자가 한 곳도 없었습니다.</b>

   ── 이 자가 걱정하는 것 ────────────────────────────────────────────
   ⓐ <b>부르는데 없는 칸.</b> NL_FEEDS 에 적었는데 설정에 그 칸이 없다.
   ⓑ <b>있는데 안 부르는 칸.</b> 설정에 피드를 넣어 두고 NL_FEEDS 에 안 넣어
      사장님 서버가 그 피드를 한 번도 안 긁는다 — 넣은 사람은 넣은 줄 압니다.
   ⓒ <b>저축 칸이 비어 있는 것.</b> 갈래(apex-newsfit)는 있는데 피드가 없으면
      그 칸은 다른 칸 기사에 기대 사는 것입니다.
   ⓓ <b>지어낸 주소.</b> 받아 본 적 없는 RSS 를 적어 두면 조용히 0건입니다.
      꼴이라도 봅니다 — 진짜 오는지는 <b>사람이 한 번</b> 받아 봅니다.
   ⓔ <b>모아 주는 피드에 gnews 를 안 단 것.</b> 구글 뉴스 검색 RSS 는 제목 끝에
      「 - 언론사」 가 붙어 오는데, 표시를 안 하면 <b>검색어가 언론사인 척</b>
      찍힙니다(「보험 상품 출시」 가 언론사로 찍혔던 자리).

   ⚠ <b>바깥을 한 번도 안 부릅니다.</b> 점검이 사장님 서버나 남의 신문사를
     부르면, 그쪽이 잠깐 죽은 날 CI 가 빨간불이 됩니다 — 우리 코드는 멀쩡한데요.
     헛것을 잡는 자는 안 잡는 자보다 나쁩니다 (8번 · 「점검이 사장님 진짜
     서버를 읽지 않는다」).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

const SRC = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/sources.json'), 'utf8'));
const IX  = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const MKT = fs.readFileSync(path.join(ROOT, 'netlify/functions/market.js'), 'utf8');

/* 서버가 칸으로 쳐 주는 것만 — market.js 의 feedCats() 와 <b>같은 규칙</b>입니다.
   여기 규칙을 따로 적으면 서버가 규칙을 바꿨을 때 이 자만 낡습니다 (5번).     */
const 피드칸 = Object.keys(SRC).filter(k =>
  k[0] !== '_' && k.indexOf('키워드_') !== 0 &&
  Array.isArray(SRC[k]) && SRC[k].length && SRC[k][0] && SRC[k][0].url);

head('[0] 🔎 <b>서버의 규칙</b>을 그대로 읽었나 (5번)');
is(/k\[0\]\s*!==\s*'_'/.test(MKT) && /키워드_/.test(MKT) && /feedCats/.test(MKT),
   '  market.js 가 <b>이름 앞글자와 「키워드_」 로</b> 칸을 가린다 — 이 자도 같은 규칙으로 센다');
is(/cats\s*=\s*asked\.filter\(/.test(MKT),
   '  ★★ 서버가 <b>모르는 칸을 조용히 걸러 버린다</b> — 그래서 이 자가 필요합니다 (오류가 안 납니다)');
is(피드칸.length >= 5,
   '  설정에 선 칸 <b>' + 피드칸.length + '개</b> — ' + 피드칸.join(' · ') +
   (피드칸.length >= 5 ? '' : ' ← 너무 적습니다. 이 자가 아무것도 못 보는 것입니다 (8번)'));

head('[1] ★★ <b>부르는 이름 == 설정의 이름</b> (한 글자도)');
const m = IX.match(/var NL_FEEDS\s*=\s*'([^']*)'/);
is(!!m, '  app/index.html 에서 <b>NL_FEEDS</b> 를 찾았다');
const 부름 = m ? m[1].split(',').map(s => s.trim()).filter(Boolean) : [];
is(부름.length > 0, '  부르는 칸 <b>' + 부름.length + '개</b> — ' + 부름.join(' · '));
const 없는칸 = 부름.filter(c => 피드칸.indexOf(c) < 0);
is(없는칸.length === 0,
   '  ⓐ 부르는데 <b>설정에 없는 칸</b>이 없다' +
   (없는칸.length ? (' ← ' + 없는칸.join(' · ') + ' (이 칸 기사는 영영 안 옵니다)') : ''));
/* ⓑ 는 반대 방향입니다 — 넣어 두고 안 부르는 칸.
   ⚠ 「보험사」 는 일부러 뺀 칸입니다. 미끼 레이더·홍보 발췌가 따로 쓰고,
     NL_FEEDS 로 부르면 상품 출시 기사가 「보험」 칸에 섞입니다. 그래서
     <b>여기 한 줄로 빼 둡니다</b> — 자에 글자를 박는 대신 까닭을 적습니다 (8번). */
const 일부러안부름 = ['보험사'];
const 안부르는칸 = 피드칸.filter(c => 부름.indexOf(c) < 0 && 일부러안부름.indexOf(c) < 0);
is(안부르는칸.length === 0,
   '  ⓑ 설정에 있는데 <b>안 부르는 칸</b>이 없다' +
   (안부르는칸.length ? (' ← ' + 안부르는칸.join(' · ') + ' (사장님 서버가 그 피드를 한 번도 안 긁습니다)')
                      : ' (일부러 뺀 것: ' + 일부러안부름.join(' · ') + ')'));

head('[2] 💰 <b>저축 칸이 제 피드를 가졌나</b> (사장님 말씀 2026-10-25)');
is(부름.indexOf('저축') >= 0, '  NL_FEEDS 가 <b>저축</b>을 부른다');
const 저축 = SRC['저축'] || [];
is(저축.length >= 3,
   '  저축 피드가 <b>' + 저축.length + '개</b> 있다 — ' + 저축.map(f => f.name).join(' · '));
/* ★ 갈래표(apex-newsfit)에도 저축이 있어야 짝이 맞습니다 — 피드만 있고
   갈래가 없으면 받아 온 기사가 저축 칸에 안 들어갑니다 (판 X187 의 반대 짝). */
let F = null; try { F = require(path.join(ROOT, 'apex-newsfit.js')).APEX_FIT; } catch (e) {}
is(!!F && (F.cats || []).some(c => c.id === 'save'),
   '  ★ 갈래표에도 <b>저축(save)</b> 이 있다 — 피드와 갈래가 <b>짝</b>이어야 기사가 그 칸에 듭니다');
is(!!F && (F.main || []).indexOf('save') >= 0,
   '  ★ 앞줄 넷에 저축이 서 있다 (판 X187)');

head('[3] ⓓ <b>주소 꼴</b>이 말이 되나 · ⓔ 모아 주는 피드에 gnews 를 달았나');
let 꼴나쁨 = [], gnews안달림 = [], 중복 = [];
const 본것 = {};
피드칸.forEach(c => (SRC[c] || []).forEach(f => {
  const u = String(f.url || '');
  if (!/^https:\/\/[^\s]+$/.test(u)) 꼴나쁨.push(c + '/' + (f.name || u));
  /* 모아 주는 곳인가 — 주소로 가립니다(이름으로 가리면 이름을 바꾸면 샙니다) */
  if (/news\.google\.com\/rss\/search/.test(u) && !f.gnews) gnews안달림.push(c + '/' + (f.name || ''));
  if (본것[u]) 중복.push((f.name || u) + ' = ' + 본것[u]); else 본것[u] = c + '/' + (f.name || '');
}));
is(꼴나쁨.length === 0,
   '  주소가 전부 <b>https</b> 한 줄이다' + (꼴나쁨.length ? (' ← ' + 꼴나쁨.join(' · ')) : ''));
is(gnews안달림.length === 0,
   '  ⓔ 구글 뉴스 검색 피드에 <b>gnews 가 달려 있다</b>' +
   (gnews안달림.length ? (' ← ' + gnews안달림.join(' · ') + ' (검색어가 언론사인 척 찍힙니다)')
                      : ' — 안 달면 제목 끝의 「 - 언론사」 가 안 떨어집니다'));
is(중복.length === 0,
   '  같은 주소를 <b>두 칸에 두지 않았다</b> (5-1번)' + (중복.length ? (' ← ' + 중복.join(' · ')) : ''));

head('[4] 🤫 <b>이 자는 바깥을 안 부른다</b> (8번)');
/* ⚠ <b>이 자가 저를 고발했습니다.</b> 처음에는 파일 전체에서 「fetch(」 같은
   글자를 찾았는데, <b>찾는 글자가 찾는 줄 안에 그대로 적혀 있어서</b> 늘
   걸렸습니다. 자기 자신을 보는 자가 빠지기 쉬운 자리입니다.
   ★ 그래서 <b>이 칸보다 위</b>만 봅니다 — 일하는 줄은 전부 위에 있고,
     아래는 이 한 줄뿐입니다. 글자를 쪼개 숨기는 것보다 <b>보는 데를
     또렷이 자르는</b> 편이 다음 사람에게 정직합니다.                      */
const 자름 = "head('[4]";
const 나 = fs.readFileSync(__filename, 'utf8').split(자름)[0]
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');   /* 주석은 걷어 내고 본다 */
is(!/\bfetch\s*\(|require\(\s*['"]https?['"]|https\.get|XMLHttpRequest|curl /.test(나),
   '  이 자의 <b>일하는 줄</b>에 바깥을 부르는 데가 없다 — 신문사가 잠깐 죽은 날 CI 가 빨간불이 되면 안 됩니다');
is(/저축/.test(String(SRC['_저축_메모'] || '')),
   '  설정에 <b>왜 이 칸을 만들었는지</b> 적어 두었다 (_저축_메모)');

console.log('\n──────────────────────────────');
if (bad) { console.log('✗ 뉴스 피드 — 고칠 자리 ' + bad + '곳'); process.exit(1); }
console.log('✓ 부르는 이름과 설정의 이름이 같고, 저축 칸이 제 피드를 가졌습니다.');
