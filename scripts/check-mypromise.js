/* ═══════════════════════════════════════════════════════════════
   check-mypromise.js — 💬 <b>팀원 약속 비서</b>가 말한 대로 도나 (판 X573)

   사장님 말씀 (2026-11-26) — 카톡 비서 팀원판 · 「숫자와 내용까지, 각 담당 지점장이
   알람으로 보고 받게」.

   ── 보는 것 (브라우저 없이 · 몇 초) ────────────────────────────────
     [1] ★★ 판정 — 마감 지남 = 늦음 · 날짜 없이 3일 = 놓칠 뻔 · 2일은 아직 · 오늘 · 끝냄 · 한국 날짜
     [2] ★★ 이름 가리기 — 호칭 앞 이름 · 카톡 말한 사람 칸 · 전화번호 · 「고객님」 같은 말은 안 가림
     [3] ★★ 알람 글(☀️ 아침 조회) — 0건이면 안 울림 · 「팀원 약속 N건 · 놓친 M건」 · 팀원마다 「열린 n·놓친 n」 · 가린 이름만 · 줄 수 상한 · 대표는 팀마다 숫자
     [4] ★★ 서버가 <b>실제로</b> 받는 사람을 가르나 — 지점장은 자기 팀만 · 대표는 전부 · 팀원 · 쉬는 사람은 안 받음
          (가짜 장부로 promisePush 를 돌림) · 규칙은 promise-rule.js 한 곳(서버 · 앱 같은 파일 · included_files)
     [5] ★★ migration — 표 · RLS · 지점장 = leader·branch_manager(자기 팀) · 대표 = admin·owner·master ·
          알람과 같은 갈림 · SECURITY DEFINER 는 public·anon 에서 거둠 · 원문 칸 없음 · 두 줄표 주석 없음
     [6] ★★ 화면을 <b>실제로 돌려</b> 본다 — 붙여 넣고 → 가리고 → AI 에게 가는 글에 실명·전화번호가 없나 ·
          확인을 눌러야 저장 · 저장하는 줄도 가린 꼴 · 원문을 어디에도 안 남김 · 공유 안내 한 줄 · 13px 이상
     [7] ★  home-v2.js 는 한 줄만 · index.html 은 규칙 → 화면 차례로 싣기 · 📅 는 앱의 icsBuild
     [8] ★★ 되돌림 — 가리기를 빼면 · 3일을 바꾸면 · 지점장 거름을 빼면 이 자가 웁니다 (8번)
   ═══════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const rd = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const RULE = rd('app/promise-rule.js'), UI = rd('app/my-promise.js'), HV2 = rd('app/home-v2.js');
const IX = rd('app/index.html'), CORE = rd('scripts/push-core.js'), CRON = rd('netlify/functions/push-cron.js'), PCRON = rd('netlify/functions/promise-cron.js');
const TOML = rd('netlify.toml'), SQL = rd('migration_85_team_promises.sql');

function ruleOf(src) { const box = { module: { exports: {} } }; box.globalThis = box; vm.runInNewContext(src, box); return box.module.exports; }

/* ── [1] 판정 ─────────────────────────────────────────────────── */
function judge(M) {
  const T = '2026-11-26';
  return M.state({ due: '2026-11-24' }, T).k === 'late' && M.state({ due: '2026-11-24' }, T).days === 2 &&
    M.state({ due: T }, T).k === 'today' && M.state({ due: '2026-11-30' }, T).k === 'open' &&
    M.state({ created_at: '2026-11-23T05:00:00Z' }, T).k === 'stale' &&
    M.state({ created_at: '2026-11-24T05:00:00Z' }, T).k === 'open' &&
    M.state({ status: 'done', due: '2026-11-01' }, T).k === 'done';
}
console.log('[1] 판정');
const M = ruleOf(RULE);
is(judge(M), '늦음(마감 지남 · 날 수) · 오늘 · 아직 · 날짜 없이 3일 = 놓칠 뻔 · 2일은 아직 · 끝냄');
is(M.STALE_DAYS === 3, '「놓칠 뻔」 은 3일 — 한 곳(STALE_DAYS)');
/* 한국 날짜 — UTC 25일 16시 = 한국 26일 01시 */
is(M.ymdOf('2026-11-25T16:00:00Z') === '2026-11-26', '적은 날을 한국 날짜로 셈(UTC 로 세면 하루 밀림)');
is(M.missed({ due: '2026-11-01' }, '2026-11-26') && M.missed({ created_at: '2026-11-01' }, '2026-11-26') && !M.missed({ due: '2026-11-26' }, '2026-11-26'),
  '「놓친」 = 늦음 + 놓칠 뻔(오늘 마감은 아님)');

/* ── [2] 이름 가리기 ─────────────────────────────────────────── */
console.log('[2] 이름 가리기');
function leaks(t) { return /홍길동|임꺽정|이몽룡|홍갑돌|홍길순|홍말순|1234-5678/.test(t); }
const RAW = '[홍길동] [오후 3:12] 임꺽정 고객님 청구서류는 내일까지 보내드릴게요 010-1234-5678\n' +
  '2026. 11. 26. 오후 3:14, 홍길순 : 고객님 감사합니다 이몽룡님께도 여쭤볼게요 홍갑돌씨 건은 체크해 둘게요';
const MK = M.maskText(RAW);
is(!leaks(MK), '실명 다섯 · 전화번호가 다 가려짐 → ' + MK.replace(/\n/g, ' / ').slice(0, 90) + '…');
is(MK.indexOf('임*정') >= 0 && MK.indexOf('[홍*동]') >= 0 && MK.indexOf('010-****-****') >= 0, '가운데 글자만 가림(임*정 · [홍*동] · 010-****-****)');
is(MK.indexOf('고객님 감사') >= 0 && MK.indexOf('보내드릴게요') >= 0, '「고객님」 같은 말은 안 가림(헛것 없음 · 8번)');
is(M.maskName('김수') === '김*' && M.maskName('남궁민수') === '남**수' && M.maskName('임*정') === '임*정' && M.maskName('') === '', '두 글자 · 네 글자 · 이미 가린 것 · 빈 것');
is(M.maskText('성춘향 건 챙기기', ['성춘향']) === '성*향 건 챙기기', '따로 적은 이름도 가림(「더 가리기」)');

/* ── [3] 알람 글 ─────────────────────────────────────────────── */
console.log('[3] 알람 글');
const T0 = '2026-11-26';
const ROWS = [
  { member_id: 'a', team_id: 't1', text: '청구서류 보내드리기', who: '임꺽정', created_at: '2026-11-20' },
  { member_id: 'a', team_id: 't1', text: '설계안 다시', who: '홍말순', due: '2026-11-24' },
  { member_id: 'b', team_id: 't1', text: '보장분석 보내기', who: '홍갑돌', due: T0 },
  { member_id: 'b', team_id: 't2', text: '끝난 것', status: 'done' }
];
const NM = { a: '홍판서', b: '홍참판' };
is(M.pushFor([], NM, T0) === null && M.pushFor([ROWS[3]], NM, T0) === null, '열린 약속 0건이면 안 울림(「0건」 알람은 방해)');
const P1 = M.pushFor(ROWS, NM, T0);
is(P1 && P1.title === '☀️ 아침 조회 · 팀원 약속 3건 · 놓친 2건', '제목에 숫자 — ' + (P1 && P1.title));
is(P1 && P1.body.split('\n')[0] === '홍판서 열린 2·놓친 2 / 홍참판 열린 1', '팀원마다 「열린 n·놓친 n」 — 놓친 사람이 앞(아침 조회에서 먼저 부를 사람) — ' + (P1 && P1.body.split('\n')[0]));
is(P1 && P1.tag === M.TAG && M.TAG !== 'apex-today', '알람 딱지가 따로(같은 시각 다른 알람과 안 덮어씀)');
is(P1 && P1.body.indexOf('홍판서 · 임*정님 청구서류 보내드리기 · 6일째') >= 0 && P1.body.indexOf('홍*순님') >= 0, '내용 — 팀원 이름 · 가린 고객 이름 · 무엇 · 며칠');
is(P1 && !leaks(P1.body) && P1.body.indexOf('홍말순') < 0, '알람 글에 고객 실명 0(잠긴 화면에 뜸 · 3번)');
const many = Array.from({ length: 9 }, (_, i) => ({ member_id: 'a', text: '일' + i, due: '2026-11-0' + (i + 1) }));
const P2 = M.pushFor(many, NM, T0);
is(P2 && P2.body.split('\n').length === M.LIST_MAX + 3 && /외 5건/.test(P2.body), '이름 적는 줄은 ' + M.LIST_MAX + '줄까지 · 나머지는 「외 N건」');
const P3 = M.pushFor(ROWS, NM, T0, { all: true, teams: { t1: '상승지점' } });
is(P3 && P3.title.indexOf('☀️ 아침 조회 · 사업단 약속 3건') === 0 && P3.body.split('\n')[0] === '상승지점 3(놓침 2)' && P3.body.split('\n')[1] === '홍판서 열린 2·놓친 2', '대표 — 사업단 숫자 + 팀마다 숫자 한 줄 + 놓친 팀원만');
/* 팀원 본인 — 8 · 12 · 17 · 30분 전 */
const ME8 = M.memberPush(ROWS, 8, T0), ME12 = M.memberPush(ROWS, 12, T0);
is(ME8 && ME8.title === '☀️ 오늘 챙길 약속 3건 · 놓친 2건' && ME12 && ME12.title === '📋 아직 남은 약속 3건 · 놓친 2건' && ME8.tag === M.TAG_ME, '본인 8시 「오늘 챙길」 · 12시 「아직 남은」 — ' + (ME8 && ME8.title));
is(M.memberPush(ROWS, 10, T0) === null && M.memberPush(ROWS, 12, T0, 0) && M.MEM_H.join() === '8,12,17', '본인 알람은 8 · 12 · 17시만');
is(M.memberPush([{ text: '나중 일', who: '홍길동', due: '2999-01-01' }], 12, T0) === null, '마감이 남은 약속만 있으면 안 울림(「0건」 은 방해)');
is(M.memberPush(ROWS.map(p => Object.assign({}, p, { status: 'done' })), 17, T0) === null, '「✓ 했어요」 를 다 누르면 다음 알림이 안 옴');
const TM = [{ text: '보장분석 전화', who: '홍갑돌', due: T0, time: '15:00:00' }, { text: '증권 전달', who: '홍길순', due: T0, time: '15:20' }];
const SO = M.soonPush(TM, T0, 14 * 60 + 30);
is(SO && SO.title === '⏰ 곧 약속 2건' && SO.body === '15:00 홍*돌님 보장분석 전화\n15:20 홍*순님 증권 전달' && SO.tag === M.TAG_SOON, '30분 전 — 둘이면 한 장에 시각 순 — ' + (SO && SO.title));
is(M.soonPush(TM, T0, 14 * 60) === null && M.soonPush(TM, T0, 15 * 60) === null && M.soonPush([TM[0]], T0, 14 * 60 + 30).title === '⏰ 15:00 홍*돌님 보장분석 전화', '30분 전 창은 겹치지 않음 — 한 약속에 한 번');
is(M.soonPush([Object.assign({}, TM[0], { due: '2026-11-27' })], T0, 14 * 60 + 30) === null, '내일 약속은 오늘 30분 전 알람에 안 걸림');
is(new Set([M.TAG, M.TAG_ME, M.TAG_SOON, 'apex-today']).size === 4, '딱지 넷이 다 다름 — 지점장이 8시에 팀 보고와 자기 약속을 둘 다 봄');
is(!leaks(ME8.body + ME8.title + SO.body + SO.title), '본인 알람 글에도 고객 실명 0');

/* ── [4] 서버가 받는 사람을 가르나 ───────────────────────────── */
console.log('[4] 서버 — 받는 사람');
async function serverRun(coreSrc, ruleSrc, call, extra) {
  const FAKE = {
    profiles: [
      { id: 'L1', name: '지점장갑', role: 'leader' }, { id: 'B1', name: '지점장을', role: 'branch_manager' },
      { id: 'A1', name: '대표', role: 'admin' }, { id: 'M9', name: '마스터', role: 'master' },
      { id: 'X1', name: '쉬는지점장', role: 'leader', active: false },
      { id: 'u1', name: '팀원1', role: 'member' }, { id: 'u2', name: '팀원2', role: 'member' }, { id: 'u3', name: '팀원3', role: 'member' }
    ],
    teams: [{ id: 't1', name: '갑팀' }, { id: 't2', name: '을팀' }],
    team_members: [{ team_id: 't1', member_id: 'L1' }, { team_id: 't1', member_id: 'u1' }, { team_id: 't2', member_id: 'B1' },
      { team_id: 't2', member_id: 'u2' }, { team_id: 't2', member_id: 'u3' }, { team_id: 't1', member_id: 'X1' }],
    team_promises: [
      { member_id: 'u1', team_id: 't1', text: '청구서류', who: '임꺽정', due: '2000-01-01', status: 'open' },
      { member_id: 'u2', team_id: 't2', text: '설계안', who: '홍말순', status: 'open', created_at: '2000-01-01' },
      { member_id: 'u3', team_id: 't2', text: '보장분석', who: '홍갑돌', due: '2999-01-01', status: 'open' }
    ].concat(extra || [])
  };
  const urls = [];
  const box = { module: { exports: {} }, require: null, process: { env: {} }, Buffer, URL, console };
  box.fetch = async (u) => {
    urls.push(u);
    const t = Object.keys(FAKE).find(k => u.indexOf('/rest/v1/' + k + '?') >= 0);
    const body = JSON.stringify(t ? FAKE[t] : []);
    return { ok: true, status: 200, text: async () => body, json: async () => JSON.parse(body) };
  };
  box.require = (m) => {
    if (m === '../app/promise-rule.js') return ruleOf(ruleSrc);
    return require(m);
  };
  vm.runInNewContext(coreSrc, box);
  const P = box.module.exports;
  const r = await (call ? call(P) : P.promisePush(0, { force: true, dry: true }));
  return { r, P, urls };
}
(async () => {
  const S0 = await serverRun(CORE, RULE);
  const mm = (S0.r && S0.r.msgs) || new Map();
  const b = id => (mm.get(id) || {}).body || '', t = id => (mm.get(id) || {}).title || '';
  is(S0.r && S0.r.ok && mm.size === 4, '받는 사람 넷 — 지점장 둘 · 대표 둘 (팀원 · 쉬는 사람 · 0건 아님)');
  is(t('L1') === '☀️ 아침 조회 · 팀원 약속 1건 · 놓친 1건' && b('L1').indexOf('임*정') >= 0 && b('L1').indexOf('홍*순') < 0, 'leader — 자기 팀(갑팀) 것만');
  is(t('B1') === '☀️ 아침 조회 · 팀원 약속 2건 · 놓친 1건' && b('B1').indexOf('홍*순') >= 0 && b('B1').indexOf('임*정') < 0, 'branch_manager — 자기 팀(을팀) 것만(모든 팀 아님)');
  is(t('A1').indexOf('☀️ 아침 조회 · 사업단 약속 3건 · 놓친 2건') === 0 && t('M9') === t('A1') && b('A1').indexOf('갑팀') >= 0, '대표(admin · master) — 전부 + 팀마다 숫자');
  is(!mm.has('X1') && !mm.has('u1'), '쉬는 지점장 · 팀원에게는 안 감');
  is([...mm.values()].every(x => !leaks(x.body)), '서버 알람 글에도 고객 실명 0');
  is(/require\('\.\.\/app\/promise-rule\.js'\)/.test(CORE) && !/STALE_DAYS\s*=|maskName\s*\(\s*s\s*\)\s*\{/.test(CORE), '서버는 promise-rule.js 를 불러 씀 — 규칙을 다시 안 적음(5번)');
  is(/P\.promisePush\(h,\s*\{\s*min:\s*min\s*\}\)/.test(PCRON) && !/promisePush/.test(CRON), 'promise-cron 이 한 줄로 부르고 · push-cron 은 약속을 모름(30분마다 돌려도 다른 알람이 두 번 안 감)');
  is(/\[functions\."promise-cron"\]\s*\r?\n\s*schedule = "0,30 \* \* \* \*"/.test(TOML) && /\[functions\."push-cron"\]\s*\r?\n\s*schedule = "0 \* \* \* \*"/.test(TOML), '예약 — promise-cron 은 30분마다 · push-cron 은 그대로 정각');

  /* ── [4b] 팀원 본인 알람 (사업단장 「각자 팀원들에게도 … 수시적으로 안내」) ── */
  console.log('[4b] 팀원 본인 알람');
  const S8 = await serverRun(CORE, RULE, P => P.promisePush(8, { dry: true, today: '2026-11-27' }));
  const o8 = (S8.r && S8.r.out) || new Map();
  const me = id => (o8.get(id) || []).filter(x => x.tag === M.TAG_ME)[0];
  is(me('u1') && me('u1').title === '☀️ 오늘 챙길 약속 1건 · 놓친 1건' && me('u2') && !me('u3'), '8시 — 팀원 본인에게 오늘 챙길 약속(마감이 남은 약속만 있는 사람은 안 울림) — ' + (me('u1') && me('u1').title));
  is((o8.get('L1') || []).some(x => x.tag === M.TAG) && !(o8.get('X1')), '8시 — 지점장은 팀 보고도 같이 · 쉬는 사람은 안 받음');
  is([].concat.apply([], [...o8.values()]).every(x => !leaks(x.body) && !leaks(x.title)), '본인 알람에도 고객 실명 0');
  const S10 = await serverRun(CORE, RULE, P => P.promisePush(10, { dry: true, today: '2026-11-27' }));
  is(S10.r && S10.r.ok && S10.r.people === 0, '10시 — 보고도 본인 알람도 없음(오늘 시각 있는 약속이 없으면 조용)');
  is(S10.urls.every(u => u.indexOf('/rest/v1/profiles') < 0) && S10.urls.some(u => /due=eq\.2026-11-27&time=not\.is\.null/.test(u)), '정각 보고가 없는 판은 오늘 시각 있는 약속만 읽음(30분마다 가볍게 · 7번)');
  const SOON = [{ member_id: 'u3', team_id: 't2', text: '보장분석 전화', who: '홍갑돌', due: '2026-11-27', time: '15:00:00', status: 'open' }];
  const S1430 = await serverRun(CORE, RULE, P => P.promisePush(14, { min: 30, dry: true, today: '2026-11-27' }), SOON);
  const s3 = ((S1430.r && S1430.r.out && S1430.r.out.get('u3')) || [])[0];
  is(s3 && s3.tag === M.TAG_SOON && s3.title === '⏰ 15:00 홍*돌님 보장분석 전화', '14:30 — 15:00 약속 30분 전 알람 — ' + (s3 && s3.title));
  const S1500 = await serverRun(CORE, RULE, P => P.promisePush(15, { min: 0, dry: true, today: '2026-11-27' }), SOON);
  const S1400 = await serverRun(CORE, RULE, P => P.promisePush(14, { min: 0, dry: true, today: '2026-11-27' }), SOON);
  is(S1500.r.people === 0 && S1400.r.people === 0, '같은 약속은 한 번만 — 14:00 · 15:00 판에는 안 걸림');
  is(/included_files[^\]]*"app\/promise-rule\.js"/.test(TOML), 'netlify.toml included_files 에 promise-rule.js(서버가 같은 파일을 읽음)');
  is(/PUSH_H\s*=\s*8\b/.test(RULE) && M.PUSH_H < 9, '보고 시각 ' + M.PUSH_H + '시 — ☀️ 아침 조회(8:30) 전에 폰에 와 있음 · 한 곳');
  is(/tag:\s*m\.tag/.test(CORE) && /tag:\s*d\.tag\s*\|\|/.test(rd('app/sw.js')), '서버가 딱지를 실어 보내고 sw.js 가 그 딱지로 띄움 — 8시 「블로그 한 줄」 과 서로 안 지움');

  /* ── [5] migration ─────────────────────────────────────────── */
  console.log('[5] migration_85');
  const sq = SQL.replace(/\/\*[\s\S]*?\*\//g, '');
  is(/create table if not exists public\.team_promises/.test(sq), '표 team_promises(이름 충돌 없음 — em_todo_items · team_todos 와 다름)');
  ['member_id', 'team_id', 'text', 'who', 'due', 'time', 'status', 'created_at', 'done_at', 'client_id']
    .forEach(c => is(new RegExp('\\n\\s+' + c + '\\s').test(sq), '  칸 ' + c));
  is(!/\b(raw|original|chat|body)\s+text/.test(sq), '카톡 원문을 담는 칸이 없음');
  is(/alter table public\.team_promises enable row level security/.test(sq), 'RLS 켬');
  const boss = (sq.match(/p\.role in \(([^)]*)\)/) || [])[1] || '', lead = (sq.match(/me\.role in \(([^)]*)\)/) || [])[1] || '';
  const arr = s => s.replace(/'/g, '').split(',').map(x => x.trim()).sort().join(',');
  is(arr(boss) === S0.P.TP_BOSS.slice().sort().join(','), '대표 = ' + arr(boss) + ' — 알람(TP_BOSS)과 같은 갈림');
  is(arr(lead) === S0.P.TP_LEAD.slice().sort().join(','), '지점장 · 팀장 = ' + arr(lead) + ' — 알람(TP_LEAD)과 같은 갈림');
  is(/join public\.team_members his\s+on his\.team_id\s+= mine\.team_id/.test(sq) && !/leads_team/.test(sq), '자기 팀만(team_members) — leads_team(branch_manager = 모든 팀)을 안 씀');
  is(/for select\s+to authenticated using \(public\.tp_can_read\(member_id\)\)/.test(sq), '읽기 = tp_can_read 하나(묻는 곳 하나 · 5번)');
  is(/for insert\s+to authenticated with check \(member_id = auth\.uid\(\)\)/.test(sq) && /for update\s+to authenticated using \(member_id = auth\.uid\(\)\)/.test(sq) && /for delete\s+to authenticated using \(member_id = auth\.uid\(\)\)/.test(sq), '쓰기 · 고치기 · 지우기 = 본인만');
  const defs = (sq.match(/create or replace function public\.(\w+)\([^)]*\)[\s\S]*?security definer/g) || []).map(x => x.match(/public\.(\w+)/)[1]);
  is(defs.length === 2 && defs.every(f => new RegExp('revoke all on function public\\.' + f + '\\([^)]*\\) from public, anon').test(sq)), 'SECURITY DEFINER ' + defs.join(' · ') + ' — public · anon 에서 거둠');
  is(/new\.member_id := auth\.uid\(\)/.test(sq) && /from public\.team_members tm where tm\.member_id = auth\.uid\(\)/.test(sq), '주인 · 팀은 서버가 채움(앱이 보낸 값 안 믿음)');
  is(/repeat\('\*'/.test(sq), '서버도 who 를 한 번 더 가림');
  is(!/(^|[^-])--(?!-)/m.test(sq.replace(/'[^']*'/g, '')), 'SQL 주석은 /* */ 만(CLAUDE.md 9번)');

  /* ── [6] 화면을 돌려 본다 ──────────────────────────────────── */
  console.log('[6] 화면');
  const U0 = await uiRun(UI, RULE);
  is(U0.html.indexOf('담당 지점장·사업단장에게 공유돼요') >= 0 && U0.html.indexOf('data-mp="share"') < U0.html.indexOf('id="mpForm"'), '「이 약속은 담당 지점장·사업단장에게 공유돼요」 — 붙여넣기 칸 바로 위');
  is(U0.preview && !leaks(U0.preview), 'AI 에 보내기 전에 가린 글을 먼저 보여 줌');
  is(U0.sent && !leaks(U0.sent) && U0.sent.indexOf('임*정') >= 0, 'AI 로 가는 글에 실명 · 전화번호 0');
  is(U0.sentAfterMore && U0.sentAfterMore.indexOf('성춘향') < 0 && U0.sentAfterMore.indexOf('성*향') >= 0, '「더 가리기」 로 적은 이름도 가려서 감');
  is(U0.pasteGone, 'AI 로 보낸 뒤 붙여 넣은 원문은 칸에 안 남음');
  is(U0.insBefore === 0, '뽑기만 해서는 저장 안 됨 — ✓ 확인을 눌러야');
  is(U0.ins.length === 1 && U0.ins[0].who === '임*정' && !leaks(JSON.stringify(U0.ins)), '확인 → 저장하는 줄도 가린 꼴(사람이 실명을 쳐 넣어도)');
  is(U0.ins.length === 1 && U0.ins[0].due === '2026-11-27' && U0.ins[0].time === '15:00' && !('member_id' in U0.ins[0]) && !('team_id' in U0.ins[0]), '누구 · 무엇 · 언제까지 · 시각 — 주인 · 팀은 안 보냄(서버가 채움)');
  is(U0.store === 0, '원문을 이 기기(localStorage)에도 안 남김');
  is(/MPR\.|R\(\)/.test(UI) && !/STALE_DAYS\s*=\s*\d/.test(UI) && !/3\s*\*\s*86400000/.test(UI), '화면도 판정을 promise-rule.js 에서(다시 셈 안 함)');
  is(/AI 답을 못 읽었어요/.test(UI) && /날짜 · 시각이 대화에 없으면 지어내지 말고/.test(UI), 'AI 답을 못 읽으면 말하고 · 날짜를 지어내지 말라고 시킴(1번)');
  const px = (UI.match(/font-size:(\d+(?:\.\d+)?)px/g) || []).map(x => +x.match(/[\d.]+/)[0]);
  is(px.length > 0 && Math.min.apply(null, px) >= 13, '글씨 ' + Math.min.apply(null, px) + 'px 이상(13px 바닥)');
  is(!/send|kakao\.|Kakao\.|sms/i.test(UI.replace(/\/\*[\s\S]*?\*\//g, '').replace(/sent/g, '')), '고객에게 자동으로 보내는 자리 없음');
  is(!/setInterval/.test(UI) && (UI.match(/\.from\(TABLE\)\.select/g) || []).length === 1, '서버 읽기는 한 자리 · 되풀이 없음(7번)');

  /* ── [7] 붙는 자리 ─────────────────────────────────────────── */
  console.log('[7] 붙는 자리');
  is((HV2.match(/MY_PROMISE/g) || []).length === 2 && /g\.MY_PROMISE \? g\.MY_PROMISE\.html\(\) : ''/.test(HV2), 'home-v2.js 는 한 줄 — 파일이 없어도 시트는 섬');
  const iR = IX.indexOf('<script src="promise-rule.js">'), iU = IX.indexOf('<script src="my-promise.js">'), iH = IX.indexOf('<script src="home-v2.js">');
  is(iR > iH && iU > iR, 'index.html — home-v2.js 뒤에 promise-rule.js → my-promise.js 차례');
  is(/g\.icsBuild\('APEX 약속'/.test(UI) && /p\.due && p\.time \?/.test(UI), '📅 폰 달력에 담기 — 시각 있는 약속에만 · 앱의 icsBuild(한 벌)');

  /* ── [8] 되돌림 ────────────────────────────────────────────── */
  console.log('[8] 되돌림 — 일부러 망가뜨리면 우나');
  const U1 = await uiRun(UI.replace('S.masked = M.maskText(raw.slice(0, 6000));', 'S.masked = raw.slice(0, 6000);'), RULE, { noMore: true });
  is(U1.sent && leaks(U1.sent), '가리기를 빼면 → AI 로 실명이 간다고 잡음');
  is(!judge(ruleOf(RULE.replace('var STALE_DAYS = 3;', 'var STALE_DAYS = 9;'))), '3일을 9일로 바꾸면 → 판정이 틀렸다고 잡음');
  const S1 = await serverRun(CORE.replace('L = rows.filter(r => ids.has(r.member_id));', 'L = rows;'), RULE);
  const t1 = ((S1.r.msgs || new Map()).get('L1') || {}).title || '';
  is(t1 !== '☀️ 아침 조회 · 팀원 약속 1건 · 놓친 1건', '지점장 거름을 빼면 → 남의 팀 것까지 간다고 잡음');
  const U2 = await uiRun(UI.replace('return {\n      text: M.maskText(c.what, raw ? [raw] : []).slice(0, 200),\n      who: who || null,', 'return {\n      text: c.what,\n      who: c.who || null,'), RULE);
  is(U2.ins.length === 1 && leaks(JSON.stringify(U2.ins)), '저장 직전 가리기를 빼면 → 실명이 저장된다고 잡음');
  const RB = ruleOf(RULE.replace("p.status !== 'done' && mustToday(p, today)", "p.status !== 'done'"));
  is(RB.memberPush([{ text: '나중 일', who: '홍길동', due: '2999-01-01' }], 12, '2026-11-26') !== null, '「오늘 챙길 것」 거름을 빼면 → 마감 남은 약속으로도 울린다고 잡음');
  const RS = ruleOf(RULE.replace('var a = nowMin + SOON_MIN, b = a + 30;', 'var a = nowMin, b = a + 60;'));
  const hit = R0 => [14 * 60, 14 * 60 + 30].filter(n => R0.soonPush([{ text: '전화', due: '2026-11-26', time: '14:40' }], '2026-11-26', n)).length;
  is(hit(M) === 1 && hit(RS) === 2, '30분 창을 넓히면 → 같은 약속이 두 번 울린다고 잡음');

  console.log(bad ? '\n✗ ' + bad + '곳이 어긋났습니다' : '\n✓ 팀원 약속 비서 — 다 맞습니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('  ✗ 점검이 터졌습니다 — ' + (e && e.stack || e)); process.exit(1); });

/* ── 가짜 창에서 my-promise.js 를 돌림 ──────────────────────────── */
async function uiRun(uiSrc, ruleSrc, opt) {
  opt = opt || {};
  const els = {}, Q = [], store = {};
  const mk = id => (els[id] = els[id] || { id, value: '', checked: false, innerHTML: '', textContent: '', style: {} });
  ['mpForm', 'mpList', 'mpCnt'].forEach(mk);
  const doc = { getElementById: id => els[id] || null, createElement: () => ({ style: {} }), head: { appendChild: e => { if (e.id) els[e.id] = e; } }, body: { appendChild() {} } };
  const out = { ins: [], insBefore: -1, store: 0 };
  const sbStub = {
    from: () => {
      const q = {
        select() { return q; }, eq() { return q; }, order() { return q; }, limit() { return q; },
        insert(rows) { out.ins = rows; return { select: () => Promise.resolve({ data: rows.map((r, i) => Object.assign({ id: 'n' + i, status: 'open', created_at: '2026-11-26T01:00:00Z' }, r)), error: null }) }; },
        update() { return q; },
        then(a, b) { return Promise.resolve({ data: [], error: null }).then(a, b); }
      };
      return q;
    }
  };
  const w = {
    document: doc, console, URL, Blob: function () {}, Date, JSON, Math, String, Array, Object, RegExp, Promise,
    setTimeout: f => { Q.push(f); return 0; },
    localStorage: { setItem: () => { out.store++; }, getItem: () => null },
    OS: { profile: { id: 'u1', name: '홍판서' } }, osClient: () => sbStub, toast: () => {},
    callClaude: (sys, user) => { out.sentAll = (out.sentAll || []).concat(user); return Promise.resolve('[{"who":"임*정","what":"청구서류 보내드리기","due":"2026-11-27","time":"15:00"}]'); }
  };
  w.window = w; w.globalThis = w;
  vm.runInNewContext(ruleSrc, w);
  vm.runInNewContext(uiSrc, w);
  const MP = w.MY_PROMISE;
  out.html = MP.html();
  while (Q.length) Q.shift()();
  await new Promise(r => setImmediate(r));
  /* 붙여넣기 → 가리고 보기 */
  mk('mpPaste').value = RAW + '\n성춘향 건 서류 체크해 둘게요';
  MP.mask();
  out.preview = MP._s.masked;
  delete els.mpPaste;                       /* 화면이 다시 그려져 원문 칸이 사라진 것과 같게 */
  mk('mpMore').value = '성춘향';
  if (!opt.noMore) MP.more();   /* 「더 가리기」 는 가린 글을 한 번 더 가리므로 되돌림 시험에서는 안 누름 */
  MP.ask();
  await new Promise(r => setImmediate(r));
  out.sent = (out.sentAll || [])[0] || '';
  out.sentAfterMore = out.sent;
  out.pasteGone = !els.mpPaste && MP._s.masked === '' && JSON.stringify(MP._s).indexOf('010-1234') < 0 && JSON.stringify(MP._s).indexOf('임꺽정') < 0;
  out.insBefore = out.ins.length;
  /* 사람이 칸에 실명을 쳐 넣은 뒤 ✓ 확인 */
  mk('mpOn0').checked = true; mk('mpWho0').value = '임꺽정님'; mk('mpTxt0').value = '임꺽정 고객님 청구서류 보내드리기';
  mk('mpDue0').value = '2026-11-27'; mk('mpTm0').value = '15:00';
  MP.save();
  await new Promise(r => setImmediate(r));
  out.store = out.store;
  return out;
}
