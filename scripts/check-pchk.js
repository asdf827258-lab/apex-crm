/* ═══════════════════════════════════════════════════════════════
   check-pchk.js — 📱 <b>폰 확인 한 장이 바르게 서고, 남긴 것이 계정 한 줄로만 가나</b> (판 X574)

   사장님 고름 (2026-11-26) 「폰 확인 한 장」 — 시안 9차 점검표 ⑨ + 오늘 올린 것을 폰에서 한 줄씩 눌러 보고 남기기.

   ── 보는 것 (브라우저 없이) ──────────────────────────────────────
     [1] ★★ index.html 싣기 한 줄(team-v2.js 다음) · 🙋 나 시트 「📱 폰 확인 한 장」 은 대표만
     [2] ★★ ?pchk=1 일 때만 · 새 오늘 화면이 선 뒤에 저절로 엶
     [3] ★★ 열두 줄(대표) · 팀원은 「상황별 추천 메뉴 고치기」 빠짐 · 「가기 ›」 는 부를 함수가 있을 때만
     [4] ★★ 가기 → 시트 닫고 그 함수를 부르고 · 위에 「📱 폰 확인 n/12 · 돌아가기」 알약
     [5] ★★ ✓ 됐어요 · 이상해요(메모) · 지우기 → 이 기기 한 칸 + HOME_V2.prefPut('pchk') 하나 · 결과 복사 글
     [6] ★★ 이 파일은 서버를 직접 부르지 않음 · 담는 칸은 apex_pchk_ 하나 · 옷은 #hv2Sheet · #pchkPill 아래 · 13px 밑 글씨 없음
     [7] ★  home-v2 — 내 설정 한 줄에 다른 칸(pchk)을 얹어도 ai_mine · newhelp 를 덮지 못하고, 올릴 때 지우지 않음
   ═══════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const PC = fs.readFileSync(path.join(ROOT, 'app/pchk-v2.js'), 'utf8');
const IX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const TM = fs.readFileSync(path.join(ROOT, 'app/team-v2.js'), 'utf8');
const HV = fs.readFileSync(path.join(ROOT, 'app/home-v2.js'), 'utf8');
const 걷기 = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

function box(opt) {
  opt = opt || {};
  const store = opt.store || {}, said = [], els = {};
  const ls = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  const mk = id => ({ id, style: {}, textContent: '', innerHTML: '', parentNode: null, focus() {} });
  const body = { appendChild: e => { els[e.id] = e; e.parentNode = { removeChild: x => { delete els[x.id]; } }; } };
  const doc = { readyState: 'complete', head: { appendChild: e => { els[e.id] = e; } }, documentElement: {}, body,
    createElement: () => mk(''), getElementById: id => els[id] || null, addEventListener: () => {} };
  if (opt.hv2) els.hv2 = mk('hv2');
  const H = {
    sheet: h => { said.push(['sheet']); X.html = h; }, close: () => said.push(['close']),
    prefPut: (k, v) => { said.push(['put', k, JSON.stringify(v)]); return opt.acct !== false; }, prefGet: k => (opt.srv || {})[k],
    mis: i => said.push(['mis', i]), step: i => said.push(['step', i]), careEdit: c => said.push(['careEdit', c]), aiAdd: () => said.push(['aiAdd']), ai: () => said.push(['ai'])
  };
  let timers = 0;
  const g = { said, localStorage: ls, document: doc, location: { search: opt.q || '' }, navWho: () => 'u1',
    osIsAppAdmin: () => !!opt.boss, toast: t => said.push(['toast', t]), copyText: t => said.push(['copy', t]),
    go: t => said.push(['go', t]), teamV2Open: () => said.push(['team']), meV2Open: () => said.push(['me']),
    setTimeout: f => { f(); return 0; },
    setInterval: f => { let stop = false; const id = ++timers; g._stop = () => { stop = true; }; for (let i = 0; i < 3 && !stop; i++) f(); return id; },
    clearInterval: () => { if (g._stop) g._stop(); } };
  if (!opt.noHome) g.HOME_V2 = H;
  g.window = g;
  const X = { g, els, said, store, html: '' };
  vm.createContext(g); vm.runInContext(PC, g);
  return X;
}

console.log('\n[1] 싣기 한 줄 · 나 시트는 대표만');
{
  const a = IX.indexOf('<script src="team-v2.js"></script>'), b = IX.indexOf('<script src="pchk-v2.js"></script>');
  is(a > 0 && b > a && b - a < 260 && IX.split('pchk-v2.js"></script>').length === 2, 'index.html — team-v2.js 바로 뒤 한 줄');
  is(/var pcRow = \(typeof g\.pchkOpen === 'function' && T\(function \(\) \{ return g\.osIsAppAdmin\(\); \}, false\)\)/.test(TM) && /onclick="pchkOpen\(\)"/.test(TM) && /'<h1 style="margin-bottom:12px">나<\/h1>' \+ pcRow \+ nwRow \+/.test(TM),
    '🙋 나 시트 — 「📱 폰 확인 한 장」 은 대표(osIsAppAdmin)만 · 신입 도움말 위');
}

console.log('\n[2] ?pchk=1 일 때만 저절로');
is(!box({ hv2: 1, boss: 1 }).said.length, '주소에 pchk 가 없으면 아무것도 안 함');
is(box({ hv2: 1, boss: 1, q: '?pchk=1' }).said.some(x => x[0] === 'sheet'), '?pchk=1 + 새 오늘 화면이 서 있으면 시트를 엶');
is(!box({ boss: 1, q: '?pchk=1' }).said.length, '새 오늘 화면이 아직 없으면(로그인 전) 안 엶 — 기다림');
is(box({ hv2: 1, q: '?go=crm&pchk=1' }).said.some(x => x[0] === 'sheet') && !box({ hv2: 1, q: '?pchk=10' }).said.length, '다른 물음표와 같이 와도 됨 · pchk=10 같은 것은 아님');
is(box({ noHome: 1, hv2: 1 }).g.pchkOpen() === false, '새 오늘 화면(HOME_V2)이 없으면 열지 않고 false');

console.log('\n[3] 열두 줄 · 가기는 부를 것이 있을 때만');
{
  const B = box({ boss: 1 }); B.g.pchkOpen();
  const n = (B.html.match(/class="pc-r[^"]*" id="pchkR/g) || []).length;
  is(n === 12 && /0 \/ 12 확인/.test(B.html) && /상황별 추천 메뉴 고치기/.test(B.html), '대표 — 열두 줄 · 0 / 12');
  const M = box({}); M.g.pchkOpen();
  is((M.html.match(/id="pchkR/g) || []).length === 11 && !/상황별 추천 메뉴 고치기/.test(M.html) && /0 \/ 11 확인/.test(M.html), '팀원 — 「상황별 추천 메뉴 고치기」 빠진 열한 줄');
  is((B.html.match(/>가기 ›</g) || []).length === 12, '부를 함수가 다 있으면 가기 열두 개');
  const C = box({ boss: 1 }); delete C.g.teamV2Open; C.g.pchkOpen();
  is((C.html.match(/>가기 ›</g) || []).length === 11, 'teamV2Open 이 없으면 그 줄의 「가기」 만 안 섬');
  const ids = B.g.PCHK_V2.ITEMS.map(x => x.id).join(',');
  is(ids === 'mis,sit,care,jvb,rec,sms,met,cal,team,newh,aim,sync', '차례 — 미션 · 상황 · 고치기 · 말풍선 · 권할 것 · 문자 · 만났어요 · 달력 · 팀 · 신입 · 자비스 · 폰·PC — ' + ids);
  is(!/홍길|010-|\d{6}-\d/.test(PC), '고객 이름 · 번호 없음');
}

console.log('\n[4] 가기 → 닫고 · 부르고 · 알약');
{
  const B = box({ boss: 1 }); B.g.pchkOpen(); B.said.length = 0;
  B.g.pchkGo(7);
  is(B.said[0][0] === 'close' && B.said[1].join() === 'go,mycal' && B.els.pchkPill && /📱 폰 확인 0\/12 · 돌아가기/.test(B.els.pchkPill.textContent), '달력 줄 — 시트 닫고 go(mycal) · 위에 알약');
  B.said.length = 0; B.g.pchkGo(0); is(B.said[1].join() === 'mis,0', '미션 줄 — HOME_V2.mis(0)');
  B.said.length = 0; B.g.pchkGo(6); is(B.said[1].join() === 'mis,1', '만났어요 줄 — HOME_V2.mis(1) = 오늘 약속 카드로');
  B.said.length = 0; B.g.pchkGo(8); is(B.said[1].join() === 'team', '팀 줄 — teamV2Open');
  B.said.length = 0; B.g.pchkGo(11); is(B.said[1].join() === 'ai', '폰·PC 줄 — 자비스 시트(HOME_V2.ai)');
  B.said.length = 0; B.els.pchkPill.onclick(); is(B.said[0][0] === 'sheet' && !B.els.pchkPill, '알약 누르면 다시 시트 · 알약은 걷힘');
}

console.log('\n[5] 남기기 — 이 기기 한 칸 + 계정 한 줄(prefPut)');
{
  const B = box({ boss: 1 }); B.g.pchkOpen(); B.said.length = 0;
  B.g.pchkSet(0, 'ok');
  const put = B.said.filter(x => x[0] === 'put');
  is(put.length === 1 && put[0][1] === 'pchk' && JSON.parse(put[0][2]).mis.s === 'ok' && JSON.parse(B.store.apex_pchk_u1).mis.s === 'ok', '✓ 됐어요 → apex_pchk_u1 + prefPut(pchk)');
  B.els.pchkT3 = { value: '  말풍선이 아래 탭을 가려요  ' };
  B.g.pchkSet(3, 'bad');
  const o = JSON.parse(B.store.apex_pchk_u1);
  is(o.jvb.s === 'bad' && o.jvb.m === '말풍선이 아래 탭을 가려요' && B.said.some(x => x[0] === 'toast' && /고칠게요/.test(x[1])), '이상해요 → 메모와 같이 · 「고칠게요」');
  is(Object.keys(o).sort().join() === '_at,jvb,mis', '담는 것은 칸 id · 됐어요/이상해요 · 메모 · 시각뿐');
  B.g.pchkSet(0, ''); is(!JSON.parse(B.store.apex_pchk_u1).mis, '지우기 → 그 칸 빠짐');
  const t = B.g.PCHK_V2.text();
  is(/^📱 폰 확인 결과 \(1\/12\)/.test(t) && /⚠️ 자비스 말풍선 — 말풍선이 아래 탭을 가려요/.test(t) && /⬜ 오늘의 미션/.test(t), '결과 복사 글 — 몇 개 · ⚠️ 메모 · ⬜ 아직');
  B.g.pchkCopy(); is(B.said.some(x => x[0] === 'copy' && x[1] === t), '「📋 결과 복사」 → 있던 copyText');
  const N = box({ boss: 1, acct: false }); N.g.pchkOpen(); N.g.pchkSet(0, 'ok');
  is(N.said.some(x => x[0] === 'toast' && /결과 복사/.test(x[1])) && JSON.parse(N.store.apex_pchk_u1).mis.s === 'ok', '계정이 아직 안 이어졌으면 이 폰에만 · 「결과 복사」 로 보내 달라고');
  const S = box({ boss: 1, srv: { pchk: { sms: { s: 'ok' } } } }); S.g.pchkOpen();
  is(/0|1 \/ 12/.test(S.html) && /1 \/ 12 확인/.test(S.html), '이 폰에 없으면 계정에 남긴 것을 보여 줌(PC 에서 남긴 것)');
}

console.log('\n[6] 서버 직접 부름 없음 · 담는 칸 하나 · 옷');
{
  const c = 걷기(PC);
  is(!/\.from\(|fetch\(|supabase|\.rpc\(|XMLHttpRequest/.test(c), '서버는 HOME_V2.prefPut 으로만(이 파일은 직접 안 부름)');
  is((c.match(/setItem\(/g) || []).length === 1 && /setItem\(key\(\)/.test(c) && /var KEY = 'apex_pchk_';/.test(c), '이 기기에 담는 칸은 apex_pchk_<누구> 하나');
  const css = (c.match(/'(#[^']*\{[^']*)'/g) || []).join('\n');
  const sel = css.split(/\}/).map(x => x.split('{')[0].replace(/^[\s',]+/, '').trim()).filter(Boolean);
  is(sel.length > 10 && sel.every(s => s.split(',').every(p => /^#hv2Sheet \.pc-|^#pchkPill/.test(p.trim()))), '옷은 #hv2Sheet .pc-* · #pchkPill 아래만');
  const fs2 = (css.match(/font-size:(\d+)px/g) || []).map(x => +x.replace(/\D/g, ''));
  is(fs2.length > 5 && fs2.every(n => n >= 13), '13px 밑 글씨 없음 — ' + fs2.join(','));
}

console.log('\n[7] home-v2 — 내 설정 한 줄에 얹는 몫');
{
  is(/function prefPut\(k, v\) \{ if \(k === 'ai_mine' \|\| k === 'newhelp'\) return false; PREF\.more\[k\] = v; prefPush\(\); return PREF\.done; \}/.test(HV), 'prefPut — ai_mine · newhelp 는 못 덮음 · 얹고 바로 올림');
  is(/Object\.keys\(PREF\.more\)\.forEach\(function \(k\) \{ if \(!\(k in o\)\) o\[k\] = PREF\.more\[k\]; \}\);/.test(HV), '올릴 때 얹은 몫(pchk)을 지우지 않고 같이');
  is(/Object\.keys\(kv\)\.forEach\(function \(k\) \{ if \(k !== 'ai_mine' && k !== 'newhelp' && !\(k in PREF\.more\)\) PREF\.more\[k\] = kv\[k\]; \}\);/.test(HV), '받아 올 때 얹힌 몫을 기억(다음에 올릴 때 안 사라짐)');
  is(/prefPut: function \(k, v\) \{ return prefPut\(k, v\); \}/.test(HV) && /prefGet: function \(k\) \{ return PREF\.more\[k\]; \}/.test(HV), 'HOME_V2.prefPut · prefGet');
}

console.log(bad ? ('\n✗ ' + bad + '건 어긋남') : '\n✓ 모두 맞음');
process.exit(bad ? 1 : 0);
