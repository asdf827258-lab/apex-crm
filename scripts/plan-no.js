/* ══════════════════════════════════════════════════════════════════
   plan-no.js — <b>판 번호를 내주는 자</b>. 적기 <b>전에</b> 부릅니다.

   ── 왜 ────────────────────────────────────────────────────────────
   이틀에 두 번, 다른 세션과 <b>같은 번호</b>를 썼습니다 (X91 · X96 ·
   그 전에 X84). 받아 붙이는 쪽이 번호를 밀고, 그 번호를 가리키는 자리
   (checks.tsv 꼬리표 · 자의 머리글 · 커밋 쪽지)를 <b>하나씩 손으로</b>
   따라가 고쳤습니다.

   까닭은 번호가 <b>두 곳에 흩어져</b> 있어서입니다 —
     ① 대장(docs/말씀대장.tsv)의 <b>줄</b>
     ② <b>줄 없이 번호만</b> 쓴 판 — 고치기만 한 판은 말씀이 새로 생기지
        않아 대장에 줄이 없습니다. 지금 X 번호에 구멍이 일곱 있고
        (24·68~71·75·88) 전부 그런 판입니다. 그러니 「구멍이 없어야 한다」 는
        <b>헛것</b>입니다 — 번호는 임자가 있는데 줄이 없을 뿐입니다 (8번).
   그래서 <b>대장만 보면</b> 다음 번호를 알 수 없고, 더구나 <b>다른 세션이
   지금 쥐고 있는 번호</b>는 내 저장소에 아예 없습니다.

   이 자는 임자를 <b>네 곳</b>에서 모읍니다 —
     ① 대장 줄 (이 저장소 · origin/main)
     ② scripts/ 의 꼬리표·머리글에 적힌 「판 X##」
     ③ main 의 커밋 쪽지에 적힌 「(X##)」  ← 줄 없이 지나간 판이 여기 남습니다
     ④ <b>열린 PR</b> — 제목과 그 갈래의 대장 (다른 세션이 쥔 번호)
   그리고 <b>못 본 자리를 말합니다</b> — PR 이 아직 없는 갈래는 볼 길이
   없습니다. 모르는 것을 모른다고 적습니다 (1번).

   ★ 이것은 <b>점검이 아닙니다</b> — 네트워크를 쓰고, 번호를 고르는 것은
     사람 일입니다. lane.js 처럼 <b>밀기 전·적기 전에 눈으로</b> 보는 자입니다.
     뒷문은 이미 있습니다 — check-ledger 가 「번호가 겹치지 않는다」 를 봅니다.

   쓰는 법
     node scripts/plan-no.js            다음 번호와 임자들
     node scripts/plan-no.js --quiet    번호 한 줄만 — 글자 그대로 X 다음 수
     ⚠ 쓰는 법 보기에 번호를 <b>괄호로</b> 적지 마십시오 — 이 자가 그것을
       임자로 읽습니다. 처음에 괄호 안에 번호를 적어 그 번호가 쥔 것으로
       잡혔습니다. 그래서 <b>이 파일은 훑지 않습니다</b> — 여기 적힌 번호는
       보기이고 임자가 아닙니다.
     node scripts/plan-no.js --local    원격을 안 보고 (빠름 · 눈가림 있음)
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = process.cwd();
const 꼴 = /^([XSH])(\d+)$/;

function 글(p) { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch (e) { return ''; } }
function 셸(cmd, args) {
  try { return execFileSync(cmd, args, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }).toString(); }
  catch (e) { return null; }
}

/* ① 대장 줄 — 이 저장소와 origin/main 것 둘 다 */
function 대장번호(글자) {
  const out = [];
  (글자 || '').split('\n').forEach(l => {
    const t = l.split('\t')[0];
    if (꼴.test(t)) out.push(t);
  });
  return out;
}
/* ②③ 저장소 안에 적힌 「판 X##」 과 커밋 쪽지의 「(X##)」 */
function 적힌번호(글자) {
  const out = [];
  (글자 || '').replace(/판\s*([XSH]\d+)/g, (_, n) => { out.push(n); return _; });
  (글자 || '').replace(/\(([XSH]\d+)\)/g, (_, n) => { out.push(n); return _; });
  return out;
}

function 모으기(opt) {
  const 임자 = {};                      /* 번호 → 어디서 봤나 */
  const 담기 = (n, 어디) => { if (!꼴.test(n)) return; (임자[n] = 임자[n] || []).push(어디); };
  const 눈가림 = [];

  대장번호(글(path.join('docs', '말씀대장.tsv'))).forEach(n => 담기(n, '대장'));
  적힌번호(글(path.join('scripts', 'checks.tsv'))).forEach(n => 담기(n, 'checks.tsv'));



  /* 자들의 머리글 — 줄 없이 지나간 판이 여기 적혀 있습니다 */
  try {
    /* ★ <b>이 파일은 건너뜁니다</b> — 쓰는 법 보기에 적힌 번호는 임자가
       아닙니다. 안 건너뛰면 제 쪽지가 번호를 쥐어 다음 번호가 밀립니다. */
    fs.readdirSync(path.join(ROOT, 'scripts'))
      .filter(f => /\.js$/.test(f) && f !== 'plan-no.js').forEach(f => {
      적힌번호(글(path.join('scripts', f))).forEach(n => 담기(n, f));
    });
  } catch (e) { 눈가림.push('scripts 를 못 읽었습니다'); }

  const main대장 = 셸('git', ['show', 'origin/main:docs/말씀대장.tsv']);
  if (main대장 === null) 눈가림.push('origin/main 의 대장을 못 읽었습니다 (git fetch origin main 을 먼저)');
  else 대장번호(main대장).forEach(n => 담기(n, 'main 대장'));

  const 쪽지 = 셸('git', ['log', 'origin/main', '--format=%s', '-400']);
  if (쪽지 === null) 눈가림.push('main 의 커밋 쪽지를 못 읽었습니다');
  else 적힌번호(쪽지).forEach(n => 담기(n, 'main 커밋'));

  if (!opt.local) {
    const prs = 셸('gh', ['api', 'repos/asdf827258-lab/apex-crm/pulls', '--jq',
                          '.[] | "\\(.number)\\t\\(.head.ref)\\t\\(.title)"']);
    if (prs === null) 눈가림.push('열린 PR 을 못 봤습니다 (gh 가 없거나 네트워크가 막혔습니다) — <b>다른 세션이 쥔 번호를 모릅니다</b>');
    else {
      const 줄 = prs.split('\n').filter(Boolean);
      줄.forEach(r => {
        const [no, ref, title] = r.split('\t');
        적힌번호(title).forEach(n => 담기(n, 'PR #' + no));
        /* 제목에 안 적혀 있을 수 있으니 그 갈래의 대장도 봅니다 */
        const f = 셸('gh', ['api', 'repos/asdf827258-lab/apex-crm/contents/docs/말씀대장.tsv?ref=' + ref,
                            '--jq', '.content']);
        if (f === null) { 눈가림.push('PR #' + no + ' 의 대장을 못 읽었습니다'); return; }
        let 글자 = '';
        try { 글자 = Buffer.from(f.replace(/\s/g, ''), 'base64').toString('utf8'); } catch (e) {}
        대장번호(글자).forEach(n => 담기(n, 'PR #' + no + ' 대장'));
      });
      if (!줄.length) 눈가림.push('열린 PR 이 없습니다 — 그래도 <b>PR 을 아직 안 올린 갈래</b>는 볼 길이 없습니다');
      else 눈가림.push('<b>PR 을 아직 안 올린 갈래</b>는 볼 길이 없습니다');
    }
  } else 눈가림.push('--local 이라 원격을 안 봤습니다 — 다른 세션이 쥔 번호를 모릅니다');

  return { 임자, 눈가림 };
}

/* 다음 번호 — 머리글자(X)마다 따로 셉니다 */
function 다음(머리, opt) {
  머리 = 머리 || 'X';
  const { 임자, 눈가림 } = 모으기(opt || {});
  let 큰 = 0;
  Object.keys(임자).forEach(n => {
    const m = n.match(꼴);
    if (m && m[1] === 머리) 큰 = Math.max(큰, Number(m[2]));
  });
  return { 다음: 머리 + (큰 + 1), 큰: 머리 + 큰, 임자, 눈가림 };
}

module.exports = { 다음, 모으기 };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const opt = { local: argv.indexOf('--local') >= 0 };
  const 조용 = argv.indexOf('--quiet') >= 0;
  const r = 다음('X', opt);
  if (조용) { console.log(r.다음); process.exit(0); }
  console.log('판 번호 — 임자를 네 곳에서 모아 봤습니다\n');
  const ns = Object.keys(r.임자).filter(n => /^X/.test(n))
    .sort((a, b) => Number(b.slice(1)) - Number(a.slice(1))).slice(0, 6);
  ns.forEach(n => console.log('  ' + n + '  ← ' + [...new Set(r.임자[n])].slice(0, 4).join(' · ')));
  console.log('\n  가장 큰 번호 ' + r.큰 + ' → <b>다음은 ' + r.다음 + '</b> 입니다.');
  console.log('\n  대장에 적을 줄머리 (칸은 일곱 · 탭으로 가릅니다)');
  const 오늘 = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);   /* 한국 날짜 */
  console.log('    ' + r.다음 + '\t' + 오늘 + '\t「사장님 말씀」\t갈래\t됨\tcheck-...\t메모');
  if (r.눈가림.length) {
    console.log('\n  ⚠ 못 본 자리 — 모르는 것은 모른다고 적습니다 (1번)');
    r.눈가림.forEach(s => console.log('    · ' + s.replace(/<\/?b>/g, '')));
  }
  console.log('\n  ★ 번호를 밀 때는 <b>가리키는 자리도 같이</b> 고치십시오 —');
  console.log('    checks.tsv 꼬리표 · 자의 머리글 · 커밋·PR 쪽지 (11번 ③)');
}
