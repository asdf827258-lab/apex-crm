/* AI 에게 줄 꾸러미를 만듭니다 — ChatGPT · Gemini 어디에 줘도 됩니다.

   왜 필요한가.
     app/index.html 이 <b>3.4MB · 45,000줄</b>입니다. 통째로 올리면 AI 가
     다 못 읽고 <b>그럴듯한 거짓말</b>을 합니다. 「그 함수 고쳤습니다」라는데
     실제로는 없는 함수인 일이 생깁니다.

   그래서 <b>지도</b>를 줍니다. 전문(全文)이 아니라
     · 이 저장소가 무엇이고 무엇을 하면 안 되는가
     · 어느 파일에 무엇이 있는가
     · 화면 이름과 아이디
     · 함수 이름과 <b>줄 번호</b>  ← 이게 핵심입니다
     · 점검이 무엇을 보는가
   AI 는 이걸 읽고 「몇 번째 줄부터 몇 줄만 보여 주세요」 라고 되물을 수 있습니다.

   자동으로 만듭니다. 손으로 적어 두면 두 벌이 되고 한쪽이 낡습니다 (CLAUDE.md 5).

     node scripts/ai-pack.js            → outputs/ai-pack/ 에 씁니다      */

const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const OUT = path.join(ROOT, 'outputs', 'ai-pack');
fs.mkdirSync(OUT, { recursive: true });
const W = (n, s) => { fs.writeFileSync(path.join(OUT, n), s); return [n, s.length]; };
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const kb = n => Math.round(n / 1024) + 'KB';
const wrote = [];

/* ── 0. 먼저 읽으세요 ── */
const claude = fs.existsSync(path.join(ROOT, 'CLAUDE.md')) ? read('CLAUDE.md') : '';
wrote.push(W('00_먼저_읽으세요.md', `# 이 저장소를 고치기 전에

여기는 <b>보험 설계사가 고객 앞에서 여는 화면</b>입니다.
**화면에 찍힌 숫자가 틀리면 그 자리에서 계약이 깨집니다.**

## 이 꾸러미는 무엇인가

저장소 전문이 아니라 **지도**입니다. \`app/index.html\` 하나가 3.4MB · 45,000줄이라
통째로 읽을 수 없기 때문입니다.

- \`01_저장소_지도.md\` — 어느 폴더에 무엇이 있나
- \`02_화면_목록.md\` — 화면 아이디와 이름 (앱 메뉴)
- \`03_함수_색인.md\` — 함수 이름과 **줄 번호**
- \`04_점검_목록.md\` — 무엇을 지키는 점검이 있나
- \`05_규약.md\` — 반드시 지켜야 하는 규칙

## AI 에게 시킬 때 지켜야 하는 것

1. **없는 것을 지어내지 마십시오.** 함수 이름·화면 이름은 \`03\`·\`02\` 에 있는
   것만 씁니다. 없으면 "그 함수는 색인에 없습니다"라고 답하십시오.
2. **고칠 자리를 먼저 말하십시오.** "\`app/index.html\` 12,340줄 근처"처럼.
   그 부분을 받아 본 뒤에 고칩니다. **파일 전체를 다시 쓰지 마십시오.**
3. 이 앱은 \`app/index.html\` 이 **ES5** 입니다 (\`var\` / \`function\`).
   \`app/finance.html\` 과 상담자료는 ES6 을 써도 됩니다.
4. 고친 뒤에는 반드시 \`04_점검_목록.md\` 의 점검을 돌려야 합니다.

## 절대 하면 안 되는 것

- **모르는 값을 그럴듯하게 채우지 않습니다.** 못 읽은 값은 \`null\` 로 둡니다.
  0 으로 적으면 "보장이 없다"는 뜻이 되어 버립니다.
- **제안서에 없는 표를 만들지 않습니다.** 5년납 표만 있으면 7년납은 만들지 않습니다.
- **세금은 결론을 말하지 않습니다.** 요건만 보여 주고 "요건 충족 시"를 붙입니다.
  한도·나이·개월 수 같은 숫자는 적지 않습니다 (시행령이 바뀝니다).
- **보험료·보장은 "심사 결과에 따릅니다"** 를 빼지 않습니다.
- **고객 실명을 서버·코드·예시에 넣지 않습니다.** 견본은 \`홍길동\` 입니다.
- **같은 것을 두 곳에 두지 않습니다.** 표는 한 벌만 두고 다른 곳은 그것을 가리킵니다.

---

## 원문 규칙서

아래는 이 저장소의 규칙서 \`CLAUDE.md\` 전문입니다. 위 요약과 충돌하면 **아래가 맞습니다.**

${claude || '(CLAUDE.md 를 못 찾았습니다)'}
`));

/* ── 1. 저장소 지도 ── */
function walk(dir, depth, out) {
  if (depth > 2) return out;
  let ents;
  try { ents = fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }); } catch (e) { return out; }
  ents.filter(e => !/^(\.git|node_modules|outputs)$/.test(e.name)).forEach(e => {
    const rel = dir ? dir + '/' + e.name : e.name;
    if (e.isDirectory()) {
      let n = 0, sz = 0;
      const st = [path.join(ROOT, rel)];
      while (st.length) {
        const d = st.pop();
        let ee; try { ee = fs.readdirSync(d, { withFileTypes: true }); } catch (x) { continue; }
        ee.forEach(f => { const p2 = path.join(d, f.name);
          if (f.isDirectory()) st.push(p2); else { n++; try { sz += fs.statSync(p2).size; } catch (x) {} } });
      }
      out.push({ rel, dir: true, n, sz, depth });
      walk(rel, depth + 1, out);
    } else {
      let sz = 0; try { sz = fs.statSync(path.join(ROOT, rel)).size; } catch (x) {}
      if (sz > 20 * 1024 || /\.(md|js|html|sql)$/.test(e.name)) out.push({ rel, dir: false, sz, depth });
    }
  });
  return out;
}
const ROLE = {
  'app/index.html': '**본체.** 화면 90개가 여기 다 있습니다. ES5. 여기를 고칠 땐 줄 번호로 좁혀서.',
  'app/finance.html': '재무설계 계산기. 연금·달러·투자·교육자금 트랙. ES6 가능.',
  'app/교육': '교육 커리큘럼과 전자책. 자료(plan/master/easy/ment.js)와 화면이 나뉘어 있습니다.',
  'app/상담자료': '고객 앞에서 여는 발표 자료(덱).',
  'app/보험아카데미': '보험 지식 교재 데이터.',
  'app/재무설계': '재무설계 상담자료·실전화법서.',
  'netlify/functions': '서버 함수. 여기만 서버입니다.',
  'scripts': '**점검.** 고친 뒤 반드시 돌립니다.',
  'docs': '설계 메모와 인계 문서. 오래된 것이 섞여 있습니다.',
  'config': '설정.'
};
const tree = walk('', 0, []);
wrote.push(W('01_저장소_지도.md', `# 저장소 지도

파일 ${tree.filter(t => !t.dir).length}개 (20KB 넘는 것과 코드·문서만 적었습니다).

## 큰 파일부터

| 파일 | 크기 | 무엇 |
|---|---|---|
${tree.filter(t => !t.dir).sort((a, b) => b.sz - a.sz).slice(0, 18)
  .map(t => `| \`${t.rel}\` | ${kb(t.sz)} | ${ROLE[t.rel] || ''} |`).join('\n')}

## 폴더

| 폴더 | 파일 | 크기 | 무엇 |
|---|---|---|---|
${tree.filter(t => t.dir && t.depth <= 1).sort((a, b) => b.sz - a.sz).slice(0, 22)
  .map(t => `| \`${t.rel}/\` | ${t.n} | ${kb(t.sz)} | ${ROLE[t.rel] || ''} |`).join('\n')}

## 갈래 — 어디를 만지면 무엇이 움직이나

| 갈래 | 맡는 곳 |
|---|---|
| 본체 | \`app/index.html\` |
| 계산기 | \`app/finance.html\` |
| 발표 덱 | \`app/상담자료/*.html\` |
| 교육 | \`app/교육/\` |
| 서버 | \`netlify/functions/\` · \`config/\` |
| 지도 | \`app/apex-map*\` |
`));

/* ── 2. 화면 목록 ── */
const app = read('app/index.html');
const tabs = [];
let grp = '';
app.split('\n').forEach(l => {
  const g = l.match(/\{group:'([^']+)'/); if (g) grp = g[1];
  const m = l.match(/\{id:'([a-z_0-9]+)',icon:'([^']*)',title:'([^']*)'/);
  if (m) tabs.push({ id: m[1], icon: m[2], title: m[3], grp, hide: /hide:true/.test(l) });
});
wrote.push(W('02_화면_목록.md', `# 화면 목록 — ${tabs.length}개

주소 뒤에 \`?go=<아이디>\` 를 붙이면 그 화면이 바로 열립니다.
**여기 없는 아이디는 존재하지 않습니다.** 지어내지 마십시오.

| 아이디 | 이름 | 묶음 | 메뉴에 보임 |
|---|---|---|---|
${tabs.map(t => `| \`${t.id}\` | ${t.icon} ${t.title} | ${t.grp} | ${t.hide ? '숨김' : '보임'} |`).join('\n')}
`));

/* ── 3. 함수 색인 ── */
function fnIndex(file) {
  const src = read(file).split('\n');
  const out = [];
  src.forEach((l, i) => {
    const m = l.match(/^\s*function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (m) out.push({ n: m[1], line: i + 1 });
  });
  return out;
}
const FILES = ['app/index.html', 'app/finance.html'];
let fnMd = `# 함수 색인

**줄 번호가 붙어 있습니다.** AI 에게 시키실 때 이렇게 쓰십시오 —
「\`app/index.html\` 의 \`renderClients\` (12,340줄) 부터 80줄만 보여 주세요」.

파일 전체를 올리지 마십시오. 필요한 줄만 잘라 주면 됩니다.
잘라 내는 법(맥/리눅스): \`sed -n '12340,12420p' app/index.html\`

`;
FILES.forEach(f => {
  if (!fs.existsSync(path.join(ROOT, f))) return;
  const list = fnIndex(f);
  fnMd += `## ${f} — 함수 ${list.length}개\n\n`;
  const per = 4;
  for (let i = 0; i < list.length; i += per) {
    fnMd += list.slice(i, i + per).map(x => `\`${x.n}\` ${x.line}`).join(' · ') + '\n';
  }
  fnMd += '\n';
});
wrote.push(W('03_함수_색인.md', fnMd));

/* ── 4. 점검 목록 ── */
const checks = fs.readdirSync(path.join(ROOT, 'scripts'))
  .filter(f => /^check-.*\.js$/.test(f)).sort();
let ck = `# 점검 — 고친 뒤 반드시 돌립니다

\`\`\`bash
export NODE_PATH=/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers

node scripts/check-twins.js    # 몇 초 — 같은 것이 두 곳에 있나
node scripts/check-html.js app/index.html app/finance.html
node scripts/check-sane.js     # 화면에 말이 안 되는 숫자가 찍혔나
node scripts/smoke.js          # 화면이 실제로 열리나
\`\`\`

앞의 둘은 브라우저를 안 띄워 **몇 초**면 끝납니다. 고치는 중에 계속 돌리십시오.

## 전체 ${checks.length}개

| 점검 | 무엇을 보나 |
|---|---|
`;
/* 설명은 CI 워크플로의 name 이 제일 낫습니다 — 사람이 다듬어 둔 한 줄이니까요.
   없으면 파일 첫 주석에서 가져오되, 장식선(═ ─)은 건너뜁니다. */
let flow = '';
try { flow = read('.github/workflows/check.yml'); } catch (e) {}
const flowName = {};
flow.split('\n').forEach((l, i, a) => {
  const m = l.match(/^\s*-\s*name:\s*(.+?)\s*$/);
  if (!m) return;
  for (let j = i + 1; j < Math.min(i + 4, a.length); j++) {
    const r = a[j].match(/node\s+scripts\/(check-[\w-]+\.js)/);
    if (r) { flowName[r[1]] = m[1].replace(/^["']|["']$/g, ''); break; }
  }
});
function firstReal(src) {
  const lines = src.split('\n');
  for (let i = 0; i < Math.min(12, lines.length); i++) {
    let t = lines[i].replace(/^\s*\/\*+/, '').replace(/\*+\/\s*$/, '').trim();
    t = t.replace(/<\/?b>/g, '');
    if (!t || /^[═─—-]{4,}$/.test(t)) continue;
    return t;
  }
  return '';
}
let noDesc = [];
checks.forEach(f => {
  let one = flowName[f] || firstReal(read('scripts/' + f));
  one = one.replace(/\|/g, '·').trim();
  if (one.length > 96) one = one.slice(0, 95) + '…';
  if (!one) noDesc.push(f);
  ck += `| \`${f}\` | ${one || '(설명 없음)'} |\n`;
});
if (noDesc.length) ck += `\n> 설명을 못 찾은 점검: ${noDesc.join(', ')}\n`;
wrote.push(W('04_점검_목록.md', ck));

/* ── 5. 규약 ── */
wrote.push(W('05_규약.md', `# 반드시 지키는 규약

## 돈 단위 — "50만원"이 "50억"으로 찍힌 자리

| 이름 | 받는 단위 |
|---|---|
| \`xxxWon(v)\` | **만원** |
| \`xxxWonR(v)\` | **원** |
| 변수 \`*Won\` / \`won\` | **원**을 담는다 |

- 따라서 \`xxxWon(yyyWon)\` 은 거의 언제나 만 배 오류입니다 — \`check-twins\` 가 잡습니다.
- 정말 맞는 경우에만 그 줄에 \`「원단위OK」\` 라고 적어 빠져나갑니다.
- 큰 금액은 **억**으로 적습니다.

## 화면 구조

- 메뉴는 \`var TABS\` 그룹 → \`go(tab)\` 라우팅.
- \`renderTab(tab)\` 이 HTML 을 return 하거나, \`go()\` 안에서 \`dyn.innerHTML=…\`.
- \`el.className = '…'\` 로 통째 대입하지 않습니다 — \`classList.add/remove\` 를 씁니다.
- \`function X(){}\` 를 두고 나중에 \`window.X = 다른것\` 으로 덮어쓰지 않습니다.

## 인쇄 · PDF

- \`font-feature-settings:"tnum"\` 을 켠 채로 인쇄하지 않습니다.
  켜고 PDF 로 저장하면 **숫자가 유니코드를 잃습니다.** 쓰려면 \`@media screen\` 안에만.

## 서버

- 되풀이해서 서버를 부르지 않습니다. \`document.hidden\` 이면 쉽니다.
- 목록에 미리 다 받아 두지 않습니다 — 필요할 때 그 한 줄만.
- \`check-egress.js\` 가 이것을 봅니다.

## 비밀

- \`service_role\` 키 · \`SHARED_TOKEN\` 을 채팅·로그·코드에 붙이지 않습니다.
- Supabase \`anon\` 키는 공개용(RLS 보호)이라 저장소에 있어도 됩니다.
- TLS 검증을 끄거나 \`HTTPS_PROXY\` 를 지우지 않습니다.

## PR 마다

- \`APP_BUILD\` 와 \`APP_BUILD_NOTE\` 두 줄을 함께 고칩니다 (줄 단위로 통째 교체).
`));

/* ── 안내 ── */
const total = wrote.reduce((a, w) => a + w[1], 0);
wrote.push(W('README.md', `# APEX CRM — AI 에게 주는 꾸러미

만든 날 ${new Date().toISOString().slice(0, 10)} · ${wrote.length + 1}개 파일 · ${kb(total)}

## 쓰는 법

1. 이 폴더의 파일을 **전부** ChatGPT 대화창에 올립니다.
2. 아래 문장을 붙여 넣습니다.

\`\`\`
이건 제가 만든 보험 설계사용 CRM 입니다.
올린 파일은 저장소 전문이 아니라 <지도>입니다 — 본체 파일이 3.4MB 라 통째로 못 올립니다.

먼저 00_먼저_읽으세요.md 를 읽고 규칙을 지켜 주세요. 특히:
· 색인(02·03)에 없는 화면·함수를 지어내지 마세요. 없으면 없다고 하세요.
· 고칠 자리를 <파일 + 줄 번호>로 먼저 말해 주세요. 제가 그 부분만 잘라서 드리겠습니다.
· 파일 전체를 다시 쓰지 마세요. 바뀌는 줄만 주세요.
· app/index.html 은 ES5 입니다 (var / function).

준비되셨으면 "무엇을 도와드릴까요"라고만 답하고 기다려 주세요.
\`\`\`

3. 그 다음부터 물어보시면 됩니다. AI 가 줄 번호를 말하면 이렇게 잘라서 주십시오.

\`\`\`bash
sed -n '12340,12420p' app/index.html
\`\`\`

## 이 꾸러미 다시 만들기

앱을 고치면 색인이 낡습니다. 다시 만드십시오.

\`\`\`bash
node scripts/ai-pack.js
\`\`\`
`));

console.log('\n  outputs/ai-pack/ 에 썼습니다\n');
wrote.forEach(w => console.log('   ' + w[0].padEnd(24) + kb(w[1])));
console.log('\n   합계 ' + kb(total + wrote[wrote.length - 1][1]) + '\n');
