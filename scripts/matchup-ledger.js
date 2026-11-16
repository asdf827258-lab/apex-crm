/* 📋 <b>말씀 대장 ↔ 지금 — 473줄을 하나씩</b>
   사장님 말씀 2026-11-16 「제발 내가 말한것들을, 놓치지 말고 이행 되었는지
   내가 원한 결과 값이 나왔는지 <b>일일히 다 확인하고</b> 이미지로 보여주고 대조해줘」.

   ★ 점검이 아닙니다 — CI 에 안 넣습니다. <b>사장님께 보여 드리는 자</b>입니다.
     그림으로 보여 주는 자(scripts/matchup.js)는 <b>홈 아홉 가지</b>를 찍습니다.
     이 자는 <b>대장 전부</b>를 걸어 「시키셨다 → 됐다고 적혀 있다 → 자가 지금
     뭐라 하나」 셋을 나란히 놓습니다.
   ★ <b>재서 적습니다</b> — 「됨」 이라고 적힌 줄도 그 재는 자를 실제로 돌린
     결과로 다시 묻습니다. 자가 울면 그 「됨」 은 <b>거짓</b>입니다 (0-1번).
   ★ 자를 여기서 또 돌리지 않습니다 — 이미 돌린 기록(로그 모음)을 읽습니다.
     한 번 돌린 것을 두 번 돌리면 15분이 30분이 됩니다 (5번·7번).

   쓰는 법
     node scripts/run-checks.js --group fast  > 로그모음/fast.log
     node scripts/run-checks.js --shard 1/6   > 로그모음/w1.log      (… 6까지)
     MATCHUP_CHK=로그모음 node scripts/matchup-ledger.js                      */
'use strict';
const fs = require('fs'), path = require('path');

const ROOT = process.cwd();
const OUT  = process.env.MATCHUP_OUT || path.join(ROOT, '.matchup');
const CHK  = process.env.MATCHUP_CHK || '';

/* ── 대장 읽기 ───────────────────────────────────────────────── */
function 대장() {
  const raw = fs.readFileSync(path.join(ROOT, 'docs/말씀대장.tsv'), 'utf8').split('\n');
  const out = [];
  raw.forEach(line => {
    const t = line.replace(/\r$/, '');
    if (!t.trim() || t.trim().charAt(0) === '#') return;
    const p = t.split('\t');
    if (p.length < 5) return;
    if (!/^[A-Z]?\d|^X\d/.test(p[0].trim())) return;
    out.push({ 번호: p[0].trim(), 날짜: (p[1] || '').trim(), 말씀: (p[2] || '').trim(),
               갈래: (p[3] || '').trim(), 상태: (p[4] || '').trim(),
               재는법: (p[5] || '').trim(), 메모: (p[6] || '').trim() });
  });
  return out;
}

/* ── 돌린 결과 읽기 — ✓/✗ 한 줄씩 ──────────────────────────────
   ⚠ <b>이름이 아니라 명령</b>으로 맞춥니다. checks.tsv 의 이름은 사람 말이라
     대장의 「check-xxx」 와 안 맞습니다. 명령 안의 파일 이름이 다리입니다 (5번). */
function 돌린결과() {
  const 표 = {};                                  /* check-xxx → '✓'|'✗' */
  if (!CHK || !fs.existsSync(CHK)) return { 표, 몇: 0, 쓴로그: [] };
  const 이름줄 = {};                               /* 사람 말 이름 → check-xxx */
  fs.readFileSync(path.join(ROOT, 'scripts/checks.tsv'), 'utf8').split('\n').forEach(l => {
    const t = l.replace(/\r$/, ''); if (!t.trim() || t.trim().charAt(0) === '#') return;
    const p = t.split('\t'); if (p.length < 3) return;
    const m = /scripts\/(check-[\w-]+)\.js/.exec(p[2]);
    if (m) 이름줄[p[1].trim()] = m[1];
  });
  const 쓴로그 = [];
  fs.readdirSync(CHK).filter(f => /\.log$/.test(f)).forEach(f => {
    쓴로그.push(f);
    fs.readFileSync(path.join(CHK, f), 'utf8').split('\n').forEach(l => {
      const m = /^([✓✗])\s+\[\d+\/\d+\]\s+(.*?)\s*\(\d+초\)\s*$/.exec(l);
      if (!m) return;
      const k = 이름줄[m[2].trim()];
      if (k) 표[k] = m[1];
    });
  });
  return { 표, 몇: Object.keys(표).length, 쓴로그 };
}

/* ── 한 줄을 재다 ──────────────────────────────────────────────── */
function 재다(r, 표) {
  const 자 = r.재는법.split(/\s+/).filter(x => /^check-/.test(x));
  /* 「손으로」 는 <b>사람이 한 번 보고 적은 줄</b>입니다 — 자가 없는 것과 다릅니다.
     없다고 적으면 사장님이 「안 쟀구나」 하십니다. 있는 그대로 적습니다 (1번). */
  if (!자.length && /손으로/.test(r.재는법)) return { 판정: '손으로', 자, 운자: [], 안돈자: [] };
  if (!자.length) return { 판정: '잴자없음', 자, 운자: [], 안돈자: [] };
  const 운자 = 자.filter(x => 표[x] === '✗');
  const 안돈자 = 자.filter(x => !표[x]);
  if (운자.length) return { 판정: '자가운다', 자, 운자, 안돈자 };
  if (안돈자.length === 자.length) return { 판정: '못돌림', 자, 운자, 안돈자 };
  return { 판정: '자가맞다', 자, 운자, 안돈자 };
}

const L = 대장();
const { 표, 몇, 쓴로그 } = 돌린결과();
L.forEach(r => { r.잼 = 재다(r, 표); });

const 셈 = { 전체: L.length };
['됨', '반만', '안됨', '보류'].forEach(s => { 셈[s] = L.filter(r => r.상태 === s).length; });
const 거짓 = L.filter(r => r.상태 === '됨' && r.잼.판정 === '자가운다');
const 무자 = L.filter(r => r.상태 === '됨' && r.잼.판정 === '잴자없음');
const 손자 = L.filter(r => r.잼.판정 === '손으로');
const 안끝 = L.filter(r => r.상태 !== '됨');
const 갈래 = {};
L.forEach(r => { const g = r.갈래 || '(없음)';
  갈래[g] = 갈래[g] || { 됨: 0, 안끝: 0 };
  if (r.상태 === '됨') 갈래[g].됨++; else 갈래[g].안끝++; });

/* ── 글로 먼저 ─────────────────────────────────────────────────── */
console.log('📋 말씀 대장 — ' + 셈.전체 + '줄');
console.log('   됨 ' + 셈.됨 + ' · 반만 ' + 셈.반만 + ' · 안됨 ' + 셈.안됨 + ' · 보류 ' + 셈.보류);
console.log('   돌린 자 ' + 몇 + '가지 (' + (쓴로그.join(' ') || '로그 없음') + ')');
console.log('   ✗ 「됨」 인데 자가 우는 줄 — ' + 거짓.length);
console.log('   ✗ 「됨」 인데 재는 자가 없는 줄 — ' + 무자.length);
console.log('   · 사람이 손으로 본 줄 — ' + 손자.length);
거짓.forEach(r => console.log('     · ' + r.번호 + '  ' + r.말씀.slice(0, 40) + '  ← ' + r.잼.운자.join(',')));
무자.forEach(r => console.log('     · ' + r.번호 + '  ' + r.말씀.slice(0, 40)));
console.log('   아직 안 끝난 줄 — ' + 안끝.length);
안끝.forEach(r => console.log('     [' + r.상태 + '] ' + r.번호 + '  ' + r.말씀.slice(0, 52)));

module.exports = { L, 셈, 거짓, 무자, 손자, 안끝, 갈래, 몇, 표 };

/* ══ 📸 <b>그림으로</b> — 사장님 말씀 「이미지로 보여주고 대조해줘」 ════════ */
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const 날 = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
let 판 = '';
try { 판 = (/var APP_BUILD\s*=\s*'([^']+)'/.exec(
  fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8').slice(0, 2500000)) || [])[1] || ''; } catch (e) {}

const 칼 = '<colgroup><col class="c1"><col class="c2"><col><col class="c4"></colgroup>';
const 뱃 = r => {
  const j = r.잼.판정;
  if (r.상태 !== '됨') return '<i class="b half">' + esc(r.상태) + '</i>';
  if (j === '자가운다')  return '<i class="b x">됨이라는데 자가 운다</i>';
  if (j === '잴자없음')  return '<i class="b x">재는 자 없음</i>';
  if (j === '손으로')    return '<i class="b h">됨 · 손으로 봄</i>';
  if (j === '못돌림')    return '<i class="b n">됨 · 이번에 안 돌림</i>';
  return '<i class="b o">됨 · 자가 맞다</i>';
};

const CSS = `
*{box-sizing:border-box} body{margin:0;background:#F2F4F6;font-family:-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:#191F28}
.w{width:1400px;margin:0 auto;padding:26px}
h1{font-size:27px;margin:0 0 6px} .sub{color:#6B7684;font-size:14px;margin:0 0 18px}
.card{background:#fff;border:1px solid #E5E8EB;border-radius:14px;padding:18px 20px;margin:0 0 16px}
.big{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 16px}
.big div{flex:1;min-width:150px;background:#fff;border:1px solid #E5E8EB;border-radius:14px;padding:14px 16px}
.big b{display:block;font-size:30px;line-height:1.1} .big span{color:#6B7684;font-size:13px}
.ok b{color:#1763E6} .bad b{color:#E03131} .mid b{color:#C2810B}
table{width:100%;border-collapse:collapse;font-size:13.5px;table-layout:fixed} th,td{text-align:left;padding:7px 9px;border-bottom:1px solid #EEF1F4;vertical-align:top;word-break:break-word}
col.c1{width:66px} col.c2{width:96px} col.c4{width:176px}
th{color:#6B7684;font-weight:700;font-size:12.5px;background:#FAFBFC}
td.no{white-space:nowrap;font-weight:800;color:#1763E6;width:62px}
td.dt{white-space:nowrap;color:#8B95A1;width:94px;font-size:12px}
td.st{white-space:nowrap;width:168px}
.b{font-style:normal;display:inline-block;padding:2px 8px;border-radius:999px;font-size:11.5px;font-weight:800}
.b.o{background:#E8F3FF;color:#1763E6} .b.x{background:#FFE9E9;color:#E03131}
.b.half{background:#FFF4E0;color:#B45309} .b.h{background:#EEF1F4;color:#4E5968} .b.n{background:#F5F6F7;color:#8B95A1}
.q{font-weight:600;line-height:1.5}
.say{background:#F7F9FC;border-left:3px solid #1763E6;padding:10px 12px;border-radius:0 8px 8px 0;margin:6px 0 0;font-size:13px;line-height:1.6;color:#333D4B}
h2{font-size:17px;margin:22px 0 10px} .foot{color:#8B95A1;font-size:12px;margin-top:18px;line-height:1.7}
.gr{display:flex;flex-wrap:wrap;gap:8px} .gr div{background:#fff;border:1px solid #E5E8EB;border-radius:10px;padding:8px 12px;font-size:13px}
.gr b{color:#1763E6}
`;

function 머리(제목, 쪽) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="w">
  <h1>📋 ${esc(제목)}</h1>
  <p class="sub">사장님 말씀 「제발 내가 말한것들을, 놓치지 말고 이행 되었는지 내가 원한 결과 값이 나왔는지 <b>일일히 다 확인하고 이미지로 보여주고 대조해줘</b>」 · 판 ${esc(판)} · ${esc(날)}${쪽 ? ' · ' + esc(쪽) : ''}</p>`;
}

function 요약쪽() {
  let h = 머리('말씀 대장 ' + 셈.전체 + '줄 — 하나씩 다 걸었습니다');
  h += `<div class="big">
    <div><b>${셈.전체}</b><span>시키신 말씀</span></div>
    <div class="ok"><b>${셈.됨}</b><span>됨</span></div>
    <div class="mid"><b>${셈.반만 + 셈.보류}</b><span>반만 ${셈.반만} · 보류 ${셈.보류}</span></div>
    <div class="${거짓.length ? 'bad' : 'ok'}"><b>${거짓.length}</b><span>「됨」 인데 자가 우는 줄</span></div>
    <div class="${무자.length ? 'bad' : 'ok'}"><b>${무자.length}</b><span>「됨」 인데 재는 자 없는 줄</span></div>
    <div><b>${몇}</b><span>이번에 돌린 자</span></div>
  </div>`;
  h += `<div class="card"><b>읽는 법</b> — 「됨」 이라고 적힌 줄도 <b>그 재는 자를 실제로 돌려</b> 다시 물었습니다. 자가 울면 그 「됨」 은 거짓입니다. 「손으로 봄」 은 기계가 못 재서 사람이 눈으로 본 줄입니다 — 숨기지 않고 그대로 적습니다.</div>`;

  h += '<h2>⚠ 아직 안 끝난 ' + 안끝.length + '줄 — 사장님께 드리는 그대로</h2><div class="card"><table>' + 칼 + '<tr><th>번호</th><th>날짜</th><th>사장님 말씀</th><th>상태</th></tr>';
  안끝.forEach(r => {
    const 왜 = (r.메모.match(/⛔\[아직:[^\]]*\]\s*([^⚠★]{0,220})/) || [])[1] || '';
    h += `<tr><td class="no">${esc(r.번호)}</td><td class="dt">${esc(r.날짜)}</td>
      <td><div class="q">${esc(r.말씀.slice(0, 150))}</div>${왜 ? '<div class="say">' + esc(왜.replace(/<[^>]*>/g, '').trim()) + '</div>' : ''}</td>
      <td class="st">${뱃(r)}</td></tr>`;
  });
  h += '</table></div>';

  h += '<h2>🗂 갈래별</h2><div class="gr">';
  Object.keys(갈래).sort((a, b) => 갈래[b].됨 + 갈래[b].안끝 - 갈래[a].됨 - 갈래[a].안끝)
    .forEach(g => { h += `<div>${esc(g)} <b>${갈래[g].됨}</b>${갈래[g].안끝 ? ' <span style="color:#B45309">+' + 갈래[g].안끝 + '</span>' : ''}</div>`; });
  h += '</div>';
  h += `<p class="foot">★ 이 장은 점검이 아니라 <b>보고</b>입니다 — CI 에 안 넣습니다. 점검은 제가 지키려고 만든 것만 보지만, 이 장은 <b>사장님 말씀을 머리글로</b> 두고 그 옆에 지금을 붙입니다.<br>★ 쓰는 법 — <code>MATCHUP_CHK=&lt;로그모음&gt; node scripts/matchup-ledger.js</code></p></div></body></html>`;
  return h;
}

function 목록쪽(목, i, n) {
  let h = 머리('말씀 하나씩 — ' + (i + 1) + ' / ' + n, 목[0].번호 + ' … ' + 목[목.length - 1].번호);
  h += '<div class="card"><table>' + 칼 + '<tr><th>번호</th><th>날짜</th><th>사장님 말씀</th><th>지금</th></tr>';
  목.forEach(r => {
    h += `<tr><td class="no">${esc(r.번호)}</td><td class="dt">${esc(r.날짜)}</td>
      <td class="q">${esc(r.말씀.slice(0, 190))}</td><td class="st">${뱃(r)}</td></tr>`;
  });
  return h + '</table></div></div></body></html>';
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { chromium } = require('playwright');
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 1.6 });
  const pg = await ctx.newPage();
  const 낸것 = [];
  const 찍 = async (html, 파일) => {
    const f = path.join(OUT, 파일 + '.html');
    fs.writeFileSync(f, html);
    await pg.goto('file://' + f, { waitUntil: 'networkidle' });
    await pg.screenshot({ path: path.join(OUT, 파일 + '.png'), fullPage: true });
    fs.unlinkSync(f);
    낸것.push(path.join(OUT, 파일 + '.png'));
  };
  await 찍(요약쪽(), '대조-대장');
  const 덩 = 150, 쪽수 = Math.ceil(L.length / 덩);
  for (let i = 0; i < 쪽수; i++) await 찍(목록쪽(L.slice(i * 덩, (i + 1) * 덩), i, 쪽수), '대조-목록' + (i + 1));
  await br.close();
  console.log('\n📸 ' + 낸것.map(f => f.replace(ROOT + '/', '')).join('\n   '));
})();
