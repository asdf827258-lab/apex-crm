/* ══════════════════════════════════════════════════════════════════
   check-clmcov.js — <b>담보 종류 → 색이 표 하나에서 오나.</b>

   ── 왜 이 자를 세웠나 ─────────────────────────────────────────────
   「청구·사후관리」 화면이 목업 옷을 못 입던 까닭을 쫓아가 보니, <b>색 문제가
   아니라 쌍둥이 문제</b>였습니다 — 「암진단비」 의 색이 <b>열여섯 곳에 따로</b>
   적혀 있었습니다. 지급사례 자료 29줄에 색이 <b>105번</b>, 담보는 <b>33가지</b>.
   색을 한 번 바꾸려면 105곳을 고쳐야 합니다 (CLAUDE.md 5번).

   그래서 <b>갈래 일곱</b>(고액암 · 후유장해 · 실손 · 입원 · 항암 · 수술 · 진단)으로
   묶은 표 하나(CLM_TAGCOL)를 세우고, 그리는 세 자리(칩 글자·테두리 · 막대 · 범례)가
   모두 그 표에게 묻게 했습니다.

   ── ⚠ 갈래를 넘지 않았습니다 ──────────────────────────────────────
   자료 파일 <b>app/질병가이드-data.js</b> 는 <b>app/재무설계/질병보험가이드.html</b>
   도 읽습니다 — <b>다른 갈래</b>입니다(CLAUDE.md 11번 「자기 갈래만 만진다」).
   그래서 자료의 color 칸은 <b>그대로 두었습니다</b>. 그러면 자료와 표가 어긋날 수
   있으니, <b>이 자가 둘을 견줍니다</b> — 다르면 적어 둔 여섯 말고는 빨간불입니다.
   그것이 「표는 하나」 를 갈래를 안 넘고 지키는 길입니다 (5번·8번).

   ── 보는 것 (넓게 잡지 않습니다 · 8번) ────────────────────────────
     [1] 표가 <b>본체 한 곳</b>에 있고 갈래 일곱이 다 있나
     [2] ★★ 자료의 담보 <b>전부</b>가 규칙에 걸리나 — 안 걸리는 것이 있으면
         그 담보는 <b>색 없이</b> 서게 되므로 그 자리에서 울립니다
     [3] ★★ 표의 색이 <b>자료의 색과 같나</b> — 다른 것은 <b>적어 둔 여섯뿐</b>인가
         (색을 슬그머니 바꾸지 못하게 합니다)
     [4] ★ 그리는 세 자리가 <b>다 표에게 묻나</b> — 하나라도 p.color 를 읽으면
         칩과 막대가 <b>다른 색</b>이 되어 한 화면이 두 말을 합니다 (0-1번)
     [5] ★ 모르는 담보에 <b>색을 지어내지 않나</b> — 안 걸리면 잉크(--t-ink)
     ⚠ 인수심사 화면(uw-path)의 p.color 는 <b>다른 p</b> 입니다 — 안 셉니다 (8번)
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const SRC = fs.readFileSync('app/index.html', 'utf8');
const DATA = fs.readFileSync('app/질병가이드-data.js', 'utf8');
const CSS = fs.readFileSync('app/ui.css', 'utf8');
/* 토큰 이름 → 값. --teal 은 ui.css 가 아니라 본체 :root 에 있습니다(목업에 짝 없음) */
const TOK = {};
(CSS.match(/--t-[a-z0-9-]+\s*:\s*#[0-9A-Fa-f]{6}/g) || []).forEach(x => {
  const i = x.indexOf(':'); TOK[x.slice(0, i).trim()] = x.slice(i + 1).trim().toUpperCase();
});
const teal = (SRC.match(/--teal\s*:\s*(#[0-9A-Fa-f]{6})/) || [])[1];
if (teal) TOK['--teal'] = teal.toUpperCase();

console.log('[1] 표가 <b>본체 한 곳</b>에 있나');
const 표 = (SRC.match(/var\s+CLM_TAGCOL\s*=\s*\[([\s\S]*?)\];/) || [])[1] || '';
is(!!표, '  CLM_TAGCOL 표를 <b>찾았다</b>' + (표 ? ' — ' + 표.length + '자' : ' ← 이름이 바뀌었으면 이 자도 고쳐야 합니다'));
const 줄 = [];
(표.match(/\{[^{}]*\}/g) || []).forEach(d => {
  const g = (d.match(/갈래\s*:\s*'([^']*)'/) || [])[1];
  const 꼴 = (d.match(/꼴\s*:\s*\/([^/]*)\//) || [])[1];
  const c = (d.match(/색\s*:\s*'var\((--[a-z0-9-]+)\)'/) || [])[1];
  if (g && 꼴 && c) 줄.push({ g: g, rx: new RegExp(꼴), tok: c });
});
is(줄.length === 7, '  갈래 <b>' + 줄.length + '가지</b>를 읽었다 — ' + 줄.map(x => x.g).join(' · ') +
   (줄.length === 7 ? '' : ' ← 일곱이어야 합니다(늘리셨으면 이 수도 올려 주십시오)'));
is((SRC.match(/var\s+CLM_TAGCOL\s*=/g) || []).length === 1, '  ★ 표가 <b>한 번만</b> 적혀 있다 (5번)');
줄.forEach(x => is(!!TOK[x.tok], '  ' + x.g.padEnd(6) + ' → ' + x.tok + ' 가 <b>색표에 있다</b>' +
   (TOK[x.tok] ? ' (' + TOK[x.tok] + ')' : ' ← 없는 이름입니다')));

console.log('\n[2] ★★ 자료의 담보 <b>전부</b>가 규칙에 걸리나');
const 짝 = {};
(DATA.match(/tag\s*:\s*'([^']+)'\s*,\s*color\s*:\s*'(#[0-9A-Fa-f]{6})'/g) || []).forEach(x => {
  const t = x.match(/tag\s*:\s*'([^']+)'/)[1];
  짝[t] = x.match(/(#[0-9A-Fa-f]{6})/)[1].toUpperCase();
});
is(Object.keys(짝).length >= 20,
   '  자료에서 담보→색 짝 <b>' + Object.keys(짝).length + '가지</b>를 읽었다' +
   ' (20가지 아래면 이 자가 자료를 못 읽은 것입니다 · 8번)');
const 집기 = t => { for (let i = 0; i < 줄.length; i++) if (줄[i].rx.test(t)) return 줄[i]; return null; };
const 안걸림 = Object.keys(짝).filter(t => !집기(t));
is(안걸림.length === 0,
   '  ★★ 담보 ' + Object.keys(짝).length + '가지가 <b>다 규칙에 걸린다</b>' +
   (안걸림.length ? ' ← ' + 안걸림.join(' · ') + ' — 이 담보는 <b>색 없이(잉크로) 섭니다.</b> CLM_TAGCOL 에 갈래를 더하십시오' : ''));

console.log('\n[3] ★★ 표의 색이 <b>자료의 색과 같나</b> — 다른 것은 적어 둔 여섯뿐인가');
/* ★ 이 여섯은 <b>재서 고른 것</b>입니다. 셋 다 대비가 올라갑니다 —
     항암·방사선 2.54 → 3.77(「항암치료비」 와 같은 초록으로 모음) ·
     후유장해 6.29 → 6.47 · 고액암 7.90 → 9.93.
   ⚠ 여기 적지 않은 담보의 색을 바꾸면 그 자리에서 빨간불입니다.        */
const 봐주는것 = ['항암·방사선치료비', '후유장해(예시)', '질병후유장해',
                  '후유장해(고지급률 예시)', '고액암진단비', '혈액암진단비(고액암)'];
const 어긋 = [];
Object.entries(짝).forEach(([t, c]) => {
  const r = 집기(t); if (!r) return;
  if (TOK[r.tok] !== c && 봐주는것.indexOf(t) < 0) 어긋.push(t + ' 자료 ' + c + ' / 표 ' + r.tok + '(' + TOK[r.tok] + ')');
});
is(어긋.length === 0,
   '  ★★ 자료와 표가 <b>같다</b> — 적어 둔 여섯만 다릅니다' +
   (어긋.length ? ' ← ★ <b>슬그머니 바뀐 색:</b> ' + 어긋.join(' · ') +
     ' — 바꾸시려면 이 자의 봐주는것 목록에 까닭과 함께 적으십시오 (1번)' : ''));
const 이제같음 = 봐주는것.filter(t => { const r = 집기(t); return 짝[t] && r && TOK[r.tok] === 짝[t]; });
if (이제같음.length) console.log('      · 이제 자료와 같아진 짝 ' + 이제같음.length + '가지 — 목록에서 지우셔도 됩니다: ' + 이제같음.join(' · '));
const 없는담보 = 봐주는것.filter(t => !짝[t]);
if (없는담보.length) console.log('      · 자료에 <b>이제 없는 담보</b> ' + 없는담보.length + '가지 — ' + 없는담보.join(' · '));

console.log('\n[4] ★★ 그리는 세 자리가 <b>다 표에게 묻나</b> (5번 · 0-1번)');
const 그리기 = [
  ['칩(글자·테두리)', /clm-dref-cov" style="border-color:'\+clmCovColor\(p\.tag\)/],
  ['막대(segs)',      /color\s*:\s*clmCovColor\(p\.tag\)/],
  ['범례(legend)',    /rpt-legend[\s\S]{0,160}?background:'\+clmCovColor\(p\.tag\)/]
];
그리기.forEach(([nm, rx]) => is(rx.test(SRC), '  ' + nm + ' 가 <b>clmCovColor</b> 를 부른다'));
/* ⚠ 인수심사 화면(uw-path)의 p.color 는 <b>다른 p</b>(p.ic · p.name 을 가진 것)
   입니다 — 세면 헛것입니다 (8번). 지급사례 쪽만 봅니다.                */
const 청구쪽 = (() => { const i = SRC.indexOf('function clmDiseaseRef'); if (i < 0) return '';
  const j = SRC.indexOf('function clmCardHtml', i); return SRC.slice(i, j > i ? j : i + 9000); })();
is(!!청구쪽 && !/p\.color/.test(청구쪽),
   '  ★ 지급사례 쪽에 <b>p.color 를 읽는 자리가 없다</b>' +
   (/p\.color/.test(청구쪽) ? ' ← 자료 색을 직접 읽으면 표와 두 벌이 됩니다 (5번)' : ''));

console.log('\n[5] ★ 모르는 담보에 <b>색을 지어내지 않나</b> (1번)');
const 몸 = (SRC.match(/function\s+clmCovColor\s*\([^)]*\)\s*\{[\s\S]*?\n\}/) || [''])[0];
is(!!몸, '  clmCovColor 의 몸을 <b>찾았다</b> — ' + (몸 ? 몸.length + '자' : '못 찾았습니다'));
is(!!몸 && /return\s*'var\(--t-ink\)'/.test(몸),
   '  ★ 규칙에 안 걸리면 <b>잉크</b>로 둔다 — 틀린 색은 「색으로 거짓말하는 것」 이라 빈 것보다 나쁩니다');
is(!!몸 && /for\s*\(/.test(몸) && !/\?\s*'var\(/.test(몸),
   '  ★ <b>삼항 사슬이 아니라</b> 표를 차례로 본다 — 갈래가 늘어도 빠뜨릴 자리가 없습니다 (5번)');

console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '가지 빨간불')
  : '✓ 담보 색이 표 하나에서 오고, 자료와 어긋나지 않습니다.');
process.exit(bad ? 1 : 0);
