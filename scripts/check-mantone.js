#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   check-mantone.js — 📘 사용가이드가 안내원 말투로 · 지금 앱을 말하나 (판 X186)
   사장님 말씀 (2026-10-24) — 「앱 사용가이드랑 코드 문제도 이 장 내에서 해결하고,
   말투는 부드럽게 알려주는 안내원 형식과 캐릭터 이모티콘을 사용해줘」.

   [1] ★★ 사용가이드(MAN_CASE … renderManual)의 글에 「합니다 · 하십시오」 가
       남지 않았나 — 562곳을 「해요」 로 바꿨습니다. 단 ① 화면 단추 이름
       (「확인했습니다」·「보냈습니다」 — 앱 단추가 그 글자라 바꾸면 사장님이
       못 찾으십니다) ② 「심사 결과에 따릅니다」(CLAUDE.md 2번 — 그 말 그대로
       빼지 않는다) 는 그대로 둡니다. 주석과 AI 에게 보내는 말(manAI)은 안 봅니다.
   [2] ★ 안내원이 실제로 서나 — 🙋 인사(맨 위·처음이세요) · 💁 한마디 ·
       🙆 같이 해 보기 · 🙅 하지 않는 말.
   [3] ★★ 가이드가 <b>없어진 자리</b>를 가리키지 않나 — 「오늘 터치할 사람」 에서
       고른다 · 홈의 팀 할 일 · 📢 공지 칸 · 이름·연락처·메모 한 줄 · 대본 위
       거절 칸 · 고객 365일에 계약일 · 전화율. 설명서(윤프로 이해하기)를 앱에
       맞춰 고친 그 자리들입니다.
   [4] ★ 보장 전·후의 사용방법도 같은 말투 · 치료 기준 기본값을 blank() 에서
       읽나(안내에 「암 5,000만」 을 적어 둔 채 기본값이 3,000만이었습니다) ·
       표준 담보 수를 STD 가 세나(「39가지」 → 59줄) · 견본 이름이 홍길동인가 ·
       💾 파일로 저장의 파일 이름이 실명을 안 싣나(3번).
   [5] ★★ 세금 요건에 햇수를 적지 않나 — 「10년 유지 등 요건」 이 계산기에
       서른 번 있었습니다 (CLAUDE.md 2번 — 개정되면 바뀌는 숫자).
   [6] ★ TA 스크립트의 거절 수를 표가 세나 — 「17개 + 5단계용 4개」 가 28 이 된
       뒤에도 그대로였습니다 (5번).
   [7] ★ 아침 미션이 몇 가지인지를 HM_MS 가 세나 — 여섯인데 「다섯 가지를 다
       하셨습니다」 라고 말했습니다.

   되돌림: CHK_REF=origin/main node scripts/check-mantone.js — 고치기 전 판으로
   재면 [1]·[3]·[4]·[5]·[6]·[7] 이 다 울려야 합니다 (8번).
   ═══════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const REF = process.env.CHK_REF || '';
function read(rel) {
  if (REF) return cp.execFileSync('git', ['show', REF + ':' + rel], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = t => console.log('\n' + t);

/* 주석을 건너뛰고 문자열 몸통만 모읍니다 (skip = 건너뛸 함수 이름) */
function strings(src, a, b, skipFns) {
  const skip = (skipFns || []).map(fn => { const s = src.indexOf(fn, a); return s < 0 ? null : [s, src.indexOf('\n}\n', s) + 2]; }).filter(Boolean);
  const out = []; let i = a;
  while (i < b) {
    const sk = skip.find(([s, e]) => s <= i && i < e); if (sk) { i = sk[1]; continue; }
    if (src.startsWith('/*', i)) { i = src.indexOf('*/', i + 2) + 2; continue; }
    const c = src[i];
    if (c === "'" || c === '"') {
      let j = i + 1; while (j < b && src[j] !== c) { if (src[j] === '\\') j++; j++; }
      out.push(src.slice(i + 1, j)); i = j + 1; continue;
    }
    i++;
  }
  return out;
}
const KEEP = [/「✅ 보냈습니다」/g, /「보냈습니다」/g, /「확인했습니다」/g, /심사 결과에 따릅니다/g];
function formal(list) {
  const hit = [];
  list.forEach(t => {
    let x = t; KEEP.forEach(r => { x = x.replace(r, ''); });
    const m = x.match(/[가-힣]+(니다|니까|십시오)(?![가-힣])/g);
    if (m) hit.push(...m);
  });
  return hit;
}

console.log('📘 사용가이드 — 안내원 말투 · 지금 앱 (판 X186)' + (REF ? '  ← ' + REF + ' 로 재는 중' : ''));
const IDX = read('app/index.html');
const ma = IDX.indexOf('var MAN_CASE=['), mb = IDX.indexOf('/* ════════ 조직도 ════════ */', ma);
is(ma > 0 && mb > ma, '사용가이드 자리를 찾았다 (MAN_CASE … renderManual)');
const MS = strings(IDX, ma, mb, ['function manAI(){']);
const MT = MS.join('\n');

sec('[1] 사용가이드에 「합니다 · 하십시오」 가 안 남았나');
const f1 = formal(MS);
is(f1.length === 0, '합니다체 끝말 ' + f1.length + '곳' + (f1.length ? ' ← ' + Array.from(new Set(f1)).slice(0, 8).join(' · ') : ''));
is(/심사 결과에 따릅니다/.test(MT), '  「심사 결과에 따릅니다」 는 그 말 그대로 남았다 (2번)');
is(/「확인했습니다」/.test(MT), '  화면 단추 이름 「확인했습니다」 는 단추 글자 그대로');

sec('[2] 안내원이 서나');
const intro = (IDX.slice(IDX.indexOf('function manBody(){'), IDX.indexOf('function renderManual(){')) || '');
is(/tp-call">🙋[^']*윤프로 안내원/.test(intro), '🙋 가이드 맨 위에서 안내원이 인사한다');
is(/🙋 안녕하세요, <b>윤프로 안내원<\/b>/.test(IDX.slice(IDX.indexOf('function manEasyHtml(){'), IDX.indexOf('function manCapture('))), '🙋 「처음이세요」 칸에도 안내원이 선다');
is(/💁 '\+x\.x/.test(MT + IDX.slice(ma, mb)) && /💁 '\+osEsc\(tip\)/.test(IDX.slice(ma, mb)), '💁 일곱 걸음 · 현장의 하루의 한마디');
is(/🙆 같이 해 볼까요\? — 직접 해 보세요/.test(IDX.slice(ma, mb)), '🙆 「이럴 때는 이렇게」 의 연습');
is(/🙅 하지 않는 말/.test(IDX.slice(ma, mb)), '🙅 하지 않는 말');

sec('[3] 없어진 자리를 가리키지 않나');
const STALE = [
  [/「오늘 터치할 사람」 에서 그 분/, '「오늘 터치할 사람」 에서 고른다 (메뉴에서 빠졌습니다 — 아침 미션)'],
  [/「오늘 터치할 사람」 의 📵 부재 줄/, '「오늘 터치할 사람」 의 부재 줄'],
  [/TFA 업무관리[^']{0,30}오늘 터치할 사람/, 'TFA 업무관리에서 오늘 터치할 사람'],
  [/홈[^']{0,6}<b>✅ 팀 할 일<\/b>|홈의 <b>팀 할 일<\/b>|홈 → 팀 할 일/, '홈의 팀 할 일 (설정으로 갔습니다)'],
  [/📢 공지 칸/, '홈의 📢 공지 칸 (📢 공지사항 화면)'],
  [/이름 · 연락처 · 메모 한 줄/, '이름 · 연락처 · 메모 한 줄 (세 걸음 고객 넣기)'],
  [/대본 위 거절 칸/, '대본 위 거절 칸 (아래 띠 「⏱ 바빠요」)'],
  [/고객 365일에 <b>계약일<\/b>만/, '고객 365일에 계약일 (고객 창 정보 탭)'],
  [/전화율|약속율|계약율/, '전화율 · 약속율 · 계약율 (접촉률 · 상담 전환율 · 부재율)']
];
STALE.forEach(([r, m]) => is(!r.test(MT), '안 남았다 — ' + m));

sec('[4] 보장 전·후 사용방법');
const BA = read('app/ba.html');
const ga = BA.indexOf('var GUIDE_FAST=['), gb = BA.indexOf('/* ══ 🧠 윤시현의 두뇌', ga);
const GS = strings(BA, ga, gb, []);
const f4 = formal(GS);
is(ga > 0 && f4.length === 0, '사용방법에 합니다체 ' + f4.length + '곳' + (f4.length ? ' ← ' + Array.from(new Set(f4)).slice(0, 6).join(' · ') : ''));
const gsec = BA.slice(ga, gb);
is(/guideScenTxt\(\)/.test(gsec) && !/암 \d[\d,]*만 · 뇌/.test(gsec), '치료 기준 안내가 blank() 의 기본값을 읽는다 — 숫자를 손으로 안 적음');
is(/'\+stdRowN\(\)\+'가지/.test(gsec) && !/표준 담보 <b>\d+가지/.test(gsec), '표준 담보 수를 STD 가 센다');
is(/고객 365일에 저장/.test(gsec), '「적은 것이 어디에 저장되나요」 가 고객 365일 저장을 말한다');
is(!/홍철호/.test(BA) && !/홍철호/.test(IDX) && !/홍철호/.test(read('app/team.html')), '견본 이름 「홍철호」 가 안 남았다 — 홍길동 식구로 (3번)');
let who = null;
try { const m = BA.match(/function baFileWho[\s\S]*?\n}\n/); who = m ? new Function(m[0] + ';return baFileWho;')() : null; } catch (e) { who = null; }
is(!!who && who('홍길동') === '홍○○' && who('') === '고객' && /baFileWho\(S\.who\.name\)/.test(BA), '💾 파일 이름이 실명을 안 싣는다 — 「' + (who ? who('홍길동') : '?') + '」');

sec('[5] 세금 요건에 햇수를 안 적나');
const TAXF = ['app/finance.html', 'app/상담자료/미끼레이더/index.html', 'app/상담자료/메인 상담자료.html', 'app/상담자료/통합상담_APEX.html', 'app/보험아카데미/cases2.js', 'app/재무설계/상담자료.html'];
TAXF.forEach(f => {
  let t = ''; try { t = read(f); } catch (e) { t = null; }
  if (t === null) { console.log('  · ' + f + ' — 못 읽었습니다 (모르는 것은 모른다고)'); return; }
  const n = (t.match(/\d+년 유지(?:·| 등| 비과세| 요건|\))/g) || []).length;
  is(n === 0, f + ' — 「N년 유지」 요건 ' + n + '곳');
});

sec('[6] TA 스크립트의 거절 수');
const TA = read('ta-script.html');
is(!/거절처리 17개/.test(TA) && /\$\('objN'\)\.textContent = String\(V3\.length\)/.test(TA), '거절 수를 apex-stage 표(V3)가 센다');

sec('[7] 아침 미션이 몇 가지인지');
is(!/아침 미션 다섯 가지를 다/.test(IDX) && !/일<\/b> 다섯 가지를 다 하셨/.test(IDX) && /function hmMsWord\(\)\{ var n=HM_MS\.length/.test(IDX), '「다섯 가지」 를 손으로 안 적고 HM_MS 가 센다');

console.log('\n' + (bad ? '✗ ' + bad + '가지가 어긋났습니다' : '✓ 사용가이드 점검 통과'));
process.exit(bad ? 1 : 0);
