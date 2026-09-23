#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   mkscreens.js — <b>화면 목록을 한 곳에서 뽑는다.</b>

   ── 왜 있나 ───────────────────────────────────────────────────────
   2026-09-23 · 사장님 말씀 — 「APEX 쉬운판 하고 본 세션이 <b>안 맞아,
   계속</b>」.

   재 보니 그 말씀이 맞았습니다. 화면 목록이 <b>두 벌</b>이었습니다 —
   본 앱의 `var TABS` 와, 밖에 세워 둔 「APEX 쉬운 판」 의 `var ALL`.
   둘 다 사람이 손으로 고치니 <b>여섯 군데</b>가 어긋나 있었습니다.

     · 쉬운 판에 <b>없는 화면 둘</b> — dz_guide(질병 보험가이드) ·
       pdel(증권 전달)
     · <b>이름</b> 하나 — fp_deck 이 「재무설계 상담자료」 인데 본 앱은
       「재무&보장 상담자료」
     · <b>갈래</b> 셋 — ckboard·mycoach·academy 가 「업무매뉴얼 도구」 라는
       <b>본 앱에 없는 갈래</b>에 서 있었다

   CLAUDE.md 5번 — 「같은 것을 두 곳에 두지 않는다. 표는 하나만 두고
   다른 곳은 그것을 가리킨다」. 그 자리입니다.

   ── 무엇을 하나 ───────────────────────────────────────────────────
   `app/index.html` 의 <b>TABS 를 그대로</b> 읽어 `docs/화면목록.json` 에
   씁니다. <b>지어내지 않습니다</b> — 읽은 것만 적습니다 (1번).
   밖에 세우는 것(쉬운 판 · 지도 · 안내서)은 <b>이 파일을 베껴</b> 갑니다.

   `check-screens.js` 가 둘이 어긋나면 빨간불을 켭니다. 그래서 메뉴를
   고치고 이것을 안 돌리면 <b>CI 에서 걸립니다</b> — 조용히 낡지 않습니다.

   ── 쓰는 법 ───────────────────────────────────────────────────────
     node scripts/mkscreens.js          # 무엇이 달라지는지 보여만 준다
     node scripts/mkscreens.js --write  # 실제로 쓴다
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const APP = path.join(ROOT, 'app/index.html');
const OUT = path.join(ROOT, 'docs/화면목록.json');

/* `var TABS=[ … ]` 를 <b>대괄호를 세어</b> 통째로 떼어 온다.
   정규식으로 끊으면 안쪽 주석의 `]` 에서 잘린다 — 실제로 그랬다.  */
function cutArray(src, startPat) {
  const i = src.indexOf(startPat);
  if (i < 0) throw new Error('못 찾았습니다 — ' + startPat);
  const j = src.indexOf('[', i);
  let depth = 0;
  for (let k = j; k < src.length; k++) {
    const c = src[k];
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) return src.slice(j, k + 1); }
  }
  throw new Error('끝 대괄호를 못 찾았습니다 — ' + startPat);
}

/* 본 앱이 아는 그대로 읽는다. ak(권한 열쇠)는 <b>안 내보낸다</b> —
   밖에서 쓸 일이 없고, 나가면 어느 화면이 어느 요금제인지가 드러난다. */
function readTabs(srcPath) {
  const src = fs.readFileSync(srcPath || APP, 'utf8');
  const TABS = eval(cutArray(src, 'var TABS='));          /* eslint-disable-line no-eval */
  const build = (src.match(/var APP_BUILD='([^']*)'/) || [])[1] || '';
  const groups = TABS.map(g => ({
    group: g.group,
    items: g.items.map(it => ({
      id: it.id, icon: it.icon, title: it.title,
      /* hide 는 <b>메뉴에만</b> 안 선다는 뜻이다. 🔎 찾기·음성·주소로는
         그대로 열린다. 밖에서 「없는 화면」 으로 적으면 거짓말이 된다 (1번). */
      hide: !!it.hide
    }))
  }));
  const n = groups.reduce((s, g) => s + g.items.length, 0);
  const shown = groups.reduce((s, g) => s + g.items.filter(x => !x.hide).length, 0);
  return { build, groups, n, shown };
}

function build(srcPath) {
  const t = readTabs(srcPath);
  return {
    설명: 'app/index.html 의 var TABS 에서 그대로 뽑은 것입니다. 손으로 고치지 마십시오 — node scripts/mkscreens.js --write 로 다시 뽑습니다.',
    뽑은판: t.build,
    갈래수: t.groups.length,
    화면수: t.n,
    메뉴에서는수: t.shown,
    'hide란': '메뉴 목록에만 안 섭니다. 찾기·음성·?go= 주소로는 그대로 열립니다.',
    갈래: t.groups
  };
}

const TEXT = (o) => JSON.stringify(o, null, 2) + '\n';

module.exports = { readTabs, build, cutArray, OUT, TEXT };

if (require.main === module) {
  const now = build();
  const txt = TEXT(now);
  const had = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (had === txt) { console.log('그대로입니다 — 고칠 것이 없습니다 (' + now.화면수 + '개 · ' + now.갈래수 + '갈래)'); process.exit(0); }
  if (process.argv.indexOf('--write') < 0) {
    console.log('달라졌습니다. --write 를 붙이면 씁니다.');
    console.log('  지금 파일 · ' + (had ? (JSON.parse(had).화면수 + '개 · ' + JSON.parse(had).갈래수 + '갈래') : '(없음)'));
    console.log('  본 앱   · ' + now.화면수 + '개 · ' + now.갈래수 + '갈래 (메뉴에 서는 것 ' + now.메뉴에서는수 + ')');
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT + '.tmp', txt);
  fs.renameSync(OUT + '.tmp', OUT);
  console.log('썼습니다 — ' + OUT + ' (' + now.화면수 + '개 · ' + now.갈래수 + '갈래 · 메뉴에 서는 것 ' + now.메뉴에서는수 + ')');
}
