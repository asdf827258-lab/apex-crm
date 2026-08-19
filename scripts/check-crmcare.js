/* 고객 케어 — 30일 안에 모두에게 연락하는 것이 되고 있는가.

   이 기능은 「숫자가 맞다」 는 믿음 위에 서 있다. 화면이 6명이라고 하면
   정말 6명이어야 한다. 한 명이라도 조용히 빠지면 그 순간부터 아무도
   이 화면을 안 본다.

   그래서 여기서는 두 가지를 한다.

     1. 세는 규칙(ccRows 둘레의 순수 함수들)을 파일에서 떼어 내
        직접 돌려 본다. 손으로 아는 답과 같은지 본다.
     2. 브라우저로 실제로 열어 눌러 본다. 「오늘 연락함」 을 누르면
        서버로 무엇이 나갔는지 직접 읽어 확인한다.

   특히 지키는 것 —
     · 마지막 연락일이 calls 와 client_meta 중 <b>더 최근 것</b>인가
     · 한 번도 연락 안 한 사람이 「0일」 이 아니라 「없음」 으로 뜨는가
     · 29 · 30 · 31일 경계에서 알람이 맞게 켜지는가
     · 월납 999,999 / 1,000,000 / 1,000,001 에서 VIP 가 갈리는가
     · 못 읽은 보험료가 있는 고객이 VIP 에서 조용히 빠지지 않는가
     · 되돌리면 원래대로 오는가
     · 팀원 것이 남에게 안 보이는가                                    */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8831;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };

const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');

/* ═══════════════════════════════════════════════════════════════════
   1부 — 세는 규칙을 떼어 내 직접 돌린다 (브라우저 없이)
   ═══════════════════════════════════════════════════════════════════ */
console.log('\n[1] 세는 규칙을 손으로 검산한다');

function cut(from, to) {
  const a = src.indexOf(from), b = src.indexOf(to);
  if (a < 0 || b < 0 || b <= a) return '';
  return src.slice(a, b);
}
/* CC 상태와 순수 함수들만 떼어 온다 — 화면·서버는 안 건드린다 */
const core =
  'var CC={cycle:30,vipCycle:14,vipWon:1000000,warn:5,dbs:null,calls:null,rows:null,byId:null};\n' +
  'function osMaskName(name){var s=(""+name).trim();if(s.length<=1)return s;' +
  'if(s.length===2)return s.charAt(0)+"*";var mid="";for(var i=1;i<s.length-1;i++)mid+="*";' +
  'return s.charAt(0)+mid+s.charAt(s.length-1);}\n' +
  cut('function ccToday()', '/* ── 지금 화면이 쓰는 값 ── */') +
  '\nreturn {ccMoney:ccMoney,ccInsSum:ccInsSum,ccVipOf:ccVipOf,ccTouchAt:ccTouchAt,' +
  'ccRows:ccRows,ccSum:ccSum,ccByWho:ccByWho,ccSortRows:ccSortRows,ccLinkFrom:ccLinkFrom,' +
  'ccLabel:ccLabel,ccShort:ccShort,ccRunList:ccRunList,ccStageRank:ccStageRank,CC:CC};';

let C = null;
try { C = new Function(core)(); } catch (e) { console.log('    (떼어 내기 실패: ' + e.message + ')'); }
ok(!!C, '세는 규칙을 화면에서 떼어 낼 수 있다');

if (C) {
  /* ── 금액 규칙 — 상담자료의 s10Money 와 같아야 한다 ── */
  console.log('\n[2] 「모름」 과 「0」 을 가른다');
  ok(C.ccMoney(50000) === 50000, '50,000 은 50,000');
  ok(C.ccMoney(-1) === null, 'AI 가 뱉는 -1 은 0 이 아니라 「모름」');
  ok(C.ccMoney(0) === null, '0 도 「모름」 — 공짜 보험은 없다');
  ok(C.ccMoney('') === null, '빈 칸은 「모름」');
  ok(C.ccMoney('abc') === null, '숫자가 아니면 「모름」');
  ok(C.ccMoney(null) === null, '없으면 「모름」');

  const s = C.ccInsSum([{ pay: 300000 }, { pay: -1 }, { pay: 200000 }]);
  ok(s.sum === 500000 && s.known === 2 && s.unknown === 1,
    '못 읽은 건은 합계에서 빼되 몇 건인지 남긴다 (합 ' + s.sum + ' · 모름 ' + s.unknown + ')');

  /* ── VIP 경계 — 999,999 / 1,000,000 / 1,000,001 ── */
  console.log('\n[3] VIP 가 정확히 100만원에서 갈린다');
  ok(C.ccVipOf([{ pay: 999999 }]).vip === false, '999,999 는 VIP 가 아니다');
  ok(C.ccVipOf([{ pay: 1000000 }]).vip === true, '1,000,000 은 VIP 다 — 딱 맞으면 들어간다');
  ok(C.ccVipOf([{ pay: 1000001 }]).vip === true, '1,000,001 은 VIP 다');
  ok(C.ccVipOf([{ pay: 600000 }, { pay: 400000 }]).vip === true, '여러 건은 합쳐서 센다 (60만+40만)');

  console.log('\n[4] 보험료를 못 읽은 고객이 VIP 에서 조용히 빠지지 않는다');
  const u1 = C.ccVipOf([{ pay: 900000 }, { pay: -1 }]);
  ok(u1.vip === false && u1.unsure === true,
    '90만 + 모름 1건 → 「아니다」 가 아니라 「확인 필요」 — 그 한 건이 문턱을 넘길 수 있다');
  const u2 = C.ccVipOf([]);
  ok(u2.vip === false && u2.unsure === true, '보험을 한 건도 안 옮겨 둔 고객도 「확인 필요」 — 0 원이 아니다');
  const u3 = C.ccVipOf([{ pay: 1200000 }, { pay: -1 }]);
  ok(u3.vip === true && u3.unsure === false,
    '이미 문턱을 넘었으면 못 읽은 건이 있어도 VIP 다 — 더 볼 것이 없다');
  const u4 = C.ccVipOf([{ pay: 300000 }]);
  ok(u4.vip === false && u4.unsure === false, '다 읽었고 문턱 아래면 「확인 필요」 가 아니다 (30만)');

  /* ── 접촉 기록 날짜 칸 — at 과 d 를 둘 다 읽는다 ── */
  console.log('\n[5] 접촉 기록의 날짜를 놓치지 않는다');
  ok(C.ccTouchAt({ at: '2026-08-01' }) === '2026-08-01', '고객 365일이 쓰는 at 을 읽는다');
  ok(C.ccTouchAt({ d: '2026-08-02' }) === '2026-08-02', '예전 계산이 쓰던 d 도 읽는다 — 한쪽만 보면 기록이 사라진다');
  ok(C.ccTouchAt(null) === '', '없으면 빈 값');

  /* ── 마지막 연락일 — calls 와 client_meta 중 더 최근 것 ── */
  console.log('\n[6] 마지막 연락일은 둘 중 더 최근 것이다');
  const TODAY = '2026-08-17';
  const cli = [
    { id: 'c1', advisor_id: 'a1', name_masked: '김*수', created_at: '2026-01-01T00:00:00Z' },
    { id: 'c2', advisor_id: 'a1', name_masked: '박*준', created_at: '2026-06-01T00:00:00Z' },
    { id: 'c3', advisor_id: 'a2', name_masked: '최*아', created_at: '2026-05-01T00:00:00Z' }
  ];
  const dbs = [
    { id: 'd1', assigned_to: 'a1', customer_name: '김철수' },
    { id: 'd2', assigned_to: 'a1', customer_name: '박서준' }
  ];
  const calls = [
    { db_id: 'd1', created_by: 'a1', call_at: '2026-08-10T09:00:00Z' },   /* 7일 전 */
    { db_id: 'd2', created_by: 'a1', call_at: '2026-07-01T09:00:00Z' }    /* 47일 전 */
  ];
  const metas = [
    { client_id: 'c1', content: { touch: [{ at: '2026-08-02', how: '카톡' }] } },  /* 통화보다 오래됨 */
    { client_id: 'c2', content: { touch: [{ at: '2026-08-16', how: '만남' }] } }   /* 통화보다 최근 */
  ];
  const R = C.ccRows(cli, metas, dbs, calls, TODAY);
  const by = {}; R.forEach(r => by[r.id] = r);

  ok(by.c1.at === '2026-08-10' && by.c1.src === 'call',
    '통화가 더 최근이면 통화 날짜를 쓴다 (' + by.c1.at + ' / ' + by.c1.src + ')');
  ok(by.c1.d === 7, '지난날 = 오늘 − 마지막 연락일 (7일)');
  ok(by.c2.at === '2026-08-16' && by.c2.src === 'meta',
    '접촉 기록이 더 최근이면 그것을 쓴다 (' + by.c2.at + ' / ' + by.c2.src + ')');
  ok(by.c2.d === 1, '어제 만났으면 1일 (' + by.c2.d + ')');

  console.log('\n[7] 한 번도 연락 안 한 사람은 「0일」 이 아니다');
  ok(by.c3.k === 'never', 'c3 은 never 로 뜬다');
  ok(by.c3.d === null, '지난날은 0 이 아니라 null — 「모른다」 와 「안 했다」 는 다르다');
  ok(by.c3.since === 108, '대신 등록한 날로부터 며칠인지는 센다 (' + by.c3.since + '일)');
  ok(/한 번도 연락 안 함/.test(C.ccLabel(by.c3)), '화면 글도 「한 번도 연락 안 함」 이다');
  ok(C.ccShort(by.c3) === '연락 없음', '줄 배지도 「0일」 이 아니라 「연락 없음」');

  /* ── 29 · 30 · 31일 경계 ── */
  console.log('\n[8] 29 · 30 · 31일 경계에서 알람이 맞게 켜진다');
  const edge = (daysAgo, ins) => {
    const at = new Date(Date.parse(TODAY + 'T00:00:00Z') - daysAgo * 86400000)
      .toISOString().slice(0, 10);
    const r = C.ccRows(
      [{ id: 'x', advisor_id: 'a1', name_masked: '무*명', created_at: '2020-01-01T00:00:00Z' }],
      [{ client_id: 'x', content: { touch: [{ at: at }], ins: ins || [] } }],
      [], [], TODAY);
    return r[0];
  };
  ok(edge(24).k === 'ok', '24일째는 여유');
  ok(edge(25).k === 'soon', '25일째부터 미리 노랗게 — 닥쳐서 몰아치지 않게');
  ok(edge(29).k === 'soon', '29일째는 아직 임박 (넘지 않았다)');
  ok(edge(30).k === 'over', '30일째에 넘김으로 켜진다');
  ok(edge(31).k === 'over', '31일째도 넘김');
  ok(edge(30).d === 30, '30일째면 30일이라고 센다');

  console.log('\n[9] VIP 는 30일이 아니라 14일 주기다');
  const vipIns = [{ pay: 1200000 }];
  ok(edge(8, vipIns).k === 'ok', 'VIP 8일째는 아직 여유');
  ok(edge(9, vipIns).k === 'soon', 'VIP 도 미리 알림이 켜진다 — 14일 주기의 5일 전인 9일째부터');
  ok(edge(13, vipIns).k === 'soon', 'VIP 13일째는 아직 임박 (넘지 않았다)');
  ok(edge(14, vipIns).k === 'over', 'VIP 는 14일째에 넘김으로 켜진다');
  ok(edge(14, vipIns).cycle === 14, '주기 자체가 14일로 잡힌다');
  ok(edge(14).k === 'ok' && edge(14).cycle === 30, '같은 14일이어도 보통 고객은 여유 (주기 30일)');
  ok(edge(14, vipIns).vip === true, 'VIP 표시가 붙는다');

  /* ── 급한 순서 ── */
  console.log('\n[10] 급한 사람이 맨 위로 온다');
  const sorted = C.ccSortRows([
    { id: 'ok', k: 'ok', d: 3 },
    { id: 'over1', k: 'over', d: 35 },
    { id: 'never', k: 'never', since: 200 },
    { id: 'soon', k: 'soon', d: 27 },
    { id: 'over2', k: 'over', d: 61 }
  ]).map(r => r.id);
  ok(sorted[0] === 'never', '한 번도 연락 안 한 사람이 맨 위 (' + sorted.join(' → ') + ')');
  ok(sorted[1] === 'over2' && sorted[2] === 'over1', '그 다음은 많이 지난 순서 (61일 → 35일)');
  ok(sorted[3] === 'soon' && sorted[4] === 'ok', '임박 · 여유가 그 뒤');


  /* ── 지금 진행중인 사람 ── */
  console.log('\n[10-1] 「지금 진행중」 을 가리는 규칙');
  /* 한 사람씩 세워 놓고 무엇이 진행중으로 잡히는지 본다 */
  const one = (opt) => {
    const dbs = opt.db ? [Object.assign({ id: 'dx', assigned_to: 'a1', customer_name: '홍길동' }, opt.db)] : [];
    const cls = (opt.calls || []).map(c => Object.assign({ db_id: 'dx', created_by: 'a1' }, c));
    return C.ccRows(
      [{ id: 'x', advisor_id: 'a1', name_masked: '홍*동', created_at: '2020-01-01T00:00:00Z' }],
      [{ client_id: 'x', content: Object.assign({ touch: [{ at: opt.touch || '2026-08-15' }] }, opt.meta || {}) }],
      dbs, cls, TODAY)[0];
  };
  const soon = '2026-08-21', past = '2026-08-10';

  const appt = one({ db: { next_appt: soon + 'T05:00:00Z' } });   /* 한국 시각 오후 2시 */
  ok(appt.run === true && /약속 2026-08-21/.test(appt.why), '앞으로 약속이 잡혀 있으면 진행중 — ' + appt.why);
  ok(/14:00/.test(appt.why), '약속 시각을 한국 시각으로 적는다 (05:00Z → 14:00) — ' + appt.why);
  /* 밤 약속은 UTC 로 자르면 날짜가 하루 밀린다 — 오전 8시 약속이 어제로 보인다 */
  const night = one({ db: { next_appt: '2026-08-21T23:30:00Z' } });   /* 한국 시각 8/22 오전 8시 30분 */
  ok(/약속 2026-08-22 08:30/.test(night.why),
    '자정을 넘는 약속도 한국 날짜로 뜬다 — ' + night.why);

  const gone = one({ db: { next_appt: past + 'T14:00:00Z' } });
  ok(gone.run === false, '지나간 약속만 있으면 진행중이 아니다 — 끝난 약속이 사람을 붙잡아 두면 안 된다');

  const nx = one({ meta: { next: { what: '증권 받기', due: past } } });
  ok(nx.run === true && /다음 할 일 · 증권 받기/.test(nx.why) && /7일 지남/.test(nx.why),
    '다음 할 일이 잡혀 있으면 진행중 · 며칠 지났는지도 적는다 — ' + nx.why);

  const st = one({ db: { stage: 'AP' } });
  ok(st.run === true && /CRM 단계 AP/.test(st.why), 'CRM 단계가 도는 중이면 진행중 — ' + st.why);
  ok(one({ db: { stage: '미접촉' } }).run === false, '미접촉은 진행중이 아니다');

  const talked = one({ db: {}, touch: '2026-08-05', calls: [{ call_at: '2026-08-05T02:00:00Z', result: '상담' }] });
  ok(talked.run === true && /상담하고 12일째/.test(talked.why), '상담하고 45일 안이면 진행중 — ' + talked.why);
  const cold = one({ db: {}, touch: '2026-06-01', calls: [{ call_at: '2026-06-01T02:00:00Z', result: '상담' }] });
  ok(cold.run === false, '상담한 지 45일이 넘으면 진행중에서 뺀다 — 그건 다시 여는 일이다');
  const miss = one({ db: {}, calls: [{ call_at: '2026-08-15T02:00:00Z', result: '부재' }] });
  ok(miss.run === false, '부재는 진행중이 아니다');

  console.log('\n[10-2] 계약이 끝난 사람은 진행중이 아니다');
  const won1 = one({ db: { stage: '계약완료', next_appt: soon + 'T14:00:00Z' },
                     meta: { next: { what: '증권 전달', due: past } } });
  ok(won1.won === true && won1.run === false,
    '계약완료면 약속이 있어도 · 다음 할 일이 있어도 진행중이 아니다 — 끝난 사람을 섞으면 할 일이 흐려진다');
  ok(one({ db: { stage: '증권전달' } }).won === true, '증권전달도 끝난 것으로 본다');

  console.log('\n[10-3] 급한 순서 — 약속 → 다음 할 일 → 단계 → 상담');
  const runSorted = C.ccRunList([
    { id: '상담', run: true, rOrd: 3, d: 10 },
    { id: '상담오래', run: true, rOrd: 3, d: 40 },
    { id: '단계', run: true, rOrd: 2, rKey: 'AP' },
    { id: '기한지남', run: true, rOrd: 1, rKey: '2026-08-01' },
    { id: '기한나중', run: true, rOrd: 1, rKey: '2026-08-30' },
    { id: '약속내일', run: true, rOrd: 0, rKey: '2026-08-18' },
    { id: '안함', run: false, rOrd: 9 }
  ]).map(r => r.id);
  ok(runSorted.indexOf('안함') < 0, '진행중이 아닌 사람은 아예 안 들어온다');
  ok(runSorted[0] === '약속내일', '약속 잡힌 사람이 맨 위 (' + runSorted.join(' → ') + ')');
  ok(runSorted[1] === '기한지남' && runSorted[2] === '기한나중', '다음 할 일은 기한이 이른 것부터');
  ok(runSorted[3] === '단계', '그 다음이 CRM 단계');
  ok(runSorted[4] === '상담오래' && runSorted[5] === '상담', '상담만 해 둔 사람은 오래된 쪽이 위 — 식어 간다');

  console.log('\n[10-4] 「진행중」 과 「연락 주기」 는 다른 눈이다');
  const justMet = one({ touch: '2026-08-16', meta: { next: { what: '설계안 보내기', due: '2026-08-20' } } });
  ok(justMet.k === 'ok' && justMet.run === true,
    '어제 만난 사람은 주기로는 여유지만 지금 한창 진행중이다 (' + justMet.k + ' · run ' + justMet.run + ')');
  const stale = one({ touch: '2026-06-01' });
  ok(stale.k === 'over' && stale.run === false,
    '오래 안 만났는데 잡아 둔 것도 없으면 밀린 것이지 진행중이 아니다 (' + stale.k + ')');
  ok(C.ccSum([justMet, stale]).run === 1, '합계도 진행중을 따로 센다');

  console.log('\n[10-5] 한 사람에게 DB 가 둘이면 멀리 간 단계를 쓴다');
  ok(C.ccStageRank('CS') > C.ccStageRank('TA'), 'CS 가 TA 보다 멀리 간 단계다');
  const two = C.ccRows(
    [{ id: 'y', advisor_id: 'a1', name_masked: '홍*동', created_at: '2020-01-01T00:00:00Z' }],
    [{ client_id: 'y', content: { touch: [{ at: '2026-08-15' }] } }],
    [{ id: 'p', assigned_to: 'a1', customer_name: '홍길동', stage: '미접촉' },
     { id: 'q', assigned_to: 'a1', customer_name: '홍길동', stage: 'PC' }], [], TODAY)[0];
  ok(two.stage === 'PC' && two.run === true,
    '뒤처진 DB 가 앞선 DB 를 가리지 않는다 (' + two.stage + ')');

  /* ── 팀원별 달성률 ── */
  console.log('\n[11] TFA 달성률이 손으로 센 값과 같다');
  const many = [];
  for (let i = 0; i < 48; i++) many.push({ id: 'h' + i, advisor_id: 'hong', name_masked: '홍*동', created_at: '2020-01-01T00:00:00Z' });
  for (let i = 0; i < 31; i++) many.push({ id: 'k' + i, advisor_id: 'kim', name_masked: '김*수', created_at: '2020-01-01T00:00:00Z' });
  const old = new Date(Date.parse(TODAY + 'T00:00:00Z') - 40 * 86400000).toISOString().slice(0, 10);
  const fresh = new Date(Date.parse(TODAY + 'T00:00:00Z') - 3 * 86400000).toISOString().slice(0, 10);
  const mm = [];
  /* 홍길동 48명 중 6명이 밀림 · 42명은 이번 달 연락 */
  for (let i = 0; i < 48; i++) mm.push({ client_id: 'h' + i, content: { touch: [{ at: i < 6 ? old : fresh }] } });
  /* 김철수 31명 중 12명이 밀림 · 19명은 이번 달 연락 */
  for (let i = 0; i < 31; i++) mm.push({ client_id: 'k' + i, content: { touch: [{ at: i < 12 ? old : fresh }] } });
  const teamRows = C.ccRows(many, mm, [], [], TODAY);
  const team = {}; C.ccByWho(teamRows).forEach(x => team[x.who] = x);
  ok(team.hong.n === 48 && team.hong.due === 6 && team.hong.mon === 42,
    '홍길동 — 전체 48 · 밀림 6 · 이번 달 42 (' + team.hong.n + '/' + team.hong.due + '/' + team.hong.mon + ')');
  ok(team.hong.rate === 87.5, '홍길동 달성률 (48−6)÷48 = 87.5% (' + team.hong.rate + ')');
  ok(team.kim.n === 31 && team.kim.due === 12 && team.kim.mon === 19,
    '김철수 — 전체 31 · 밀림 12 · 이번 달 19 (' + team.kim.n + '/' + team.kim.due + '/' + team.kim.mon + ')');
  ok(team.kim.rate === 61.3, '김철수 달성률 (31−12)÷31 = 61.3% (' + team.kim.rate + ')');
  ok(C.ccByWho(teamRows)[0].who === 'hong' || C.ccByWho(teamRows)[0].who === 'kim',
    '팀원별로 갈린다 — advisor_id 로 이미 갈라져 있다');

  console.log('\n[12] 「이번 달 연락」 은 이번 달만 센다');
  const lastMonth = C.ccRows(
    [{ id: 'z', advisor_id: 'a1', name_masked: '무*명', created_at: '2020-01-01T00:00:00Z' }],
    [{ client_id: 'z', content: { touch: [{ at: '2026-07-31' }] } }], [], [], TODAY);
  ok(lastMonth[0].mon === false, '지난달 말일에 연락한 것은 이번 달에 안 넣는다');
  const thisMonth = C.ccRows(
    [{ id: 'z', advisor_id: 'a1', name_masked: '무*명', created_at: '2020-01-01T00:00:00Z' }],
    [{ client_id: 'z', content: { touch: [{ at: '2026-08-01' }] } }], [], [], TODAY);
  ok(thisMonth[0].mon === true, '이번 달 1일에 연락한 것은 이번 달로 센다');

  /* ── 조용히 세지 않는다 ── */
  console.log('\n[13] 통화 기록과 못 이은 고객을 조용히 넘기지 않는다');
  ok(by.c1.linked === 1 && by.c3.linked === 0,
    '이어진 고객과 못 이은 고객이 구분된다 (c1 ' + by.c1.linked + ' · c3 ' + by.c3.linked + ')');
  ok(R._linked === 2, '이어진 고객 수를 통째로 세어 둔다 (' + R._linked + '명)');
  const dup = C.ccLinkFrom(
    [{ id: 'q', advisor_id: 'a1', name_masked: '김*수' }],
    [{ id: 'x1', assigned_to: 'a1', customer_name: '김철수' },
     { id: 'x2', assigned_to: 'a1', customer_name: '김민수' }]);
  ok(dup.amb === 1, '같은 마스킹 이름(김*수)에 DB 가 둘 걸리면 겹침으로 세어 화면에 적는다');
  const other = C.ccLinkFrom(
    [{ id: 'q', advisor_id: 'a1', name_masked: '김*수' }],
    [{ id: 'x1', assigned_to: 'a2', customer_name: '김철수' }]);
  ok(other.linked === 0, '남이 맡은 DB 는 이름이 같아도 안 잇는다 — 남의 통화가 내 기록이 되면 안 된다');

  /* ── 합계 ── */
  console.log('\n[14] 합계가 각 칸의 합과 같다');
  const S = C.ccSum(R);
  ok(S.n === S.never + S.over + S.soon + S.ok, '전체 = 없음 + 넘음 + 임박 + 여유 (' + S.n + ')');
  ok(S.due === S.over + S.never, '「오늘 안에 연락해야 할 분」 에는 한 번도 안 한 사람이 들어간다');
}

/* ═══════════════════════════════════════════════════════════════════
   2부 — 실제로 열어서 눌러 본다
   ═══════════════════════════════════════════════════════════════════ */
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

/* 40일 전 · 3일 전 — 오늘을 기준으로 만든다 */
const dayAgo = n => new Date(Date.now() + 9 * 3600 * 1000 - n * 86400000).toISOString().slice(0, 10);

const STUB = `
window.__saved=[];window.__seq=100;window.__calls=[];window.__callSeq=0;
window.__clients=[
 {id:'c1',advisor_id:'me',name_masked:'김*수',consent_status:'granted',created_at:'2025-01-10T00:00:00Z'},
 {id:'c2',advisor_id:'me',name_masked:'박*준',consent_status:'none',created_at:'2025-02-11T00:00:00Z'},
 {id:'c3',advisor_id:'me',name_masked:'최*아',consent_status:'none',created_at:'2025-03-12T00:00:00Z'},
 {id:'c9',advisor_id:'p2',name_masked:'남*것',consent_status:'none',created_at:'2025-03-12T00:00:00Z'}
];
window.__dbs=[{id:'d1',assigned_to:'me',customer_name:'김철수',stage:'AP',next_appt:''}];
window.__calls=[{db_id:'d1',created_by:'me',call_at:'${dayAgo(40)}T02:00:00Z'}];
/* c1 — 40일 전 통화 한 번 (넘김) · VIP 아님
   c2 — 3일 전 접촉 · 월납 120만 (VIP · 3일이면 여유)
   c3 — 아무 기록 없음 (한 번도 연락 안 함) */
window.__seedMeta=[
 {id:'r1',client_id:'c2',advisor_id:'me',kind:'client_meta',content:{touch:[{at:'${dayAgo(3)}',how:'만남',note:''}],ins:[{co:'A생명',nm:'종신',pay:1200000}],fp:{},fam:'',rel:'',next:{what:'설계안 보내드리기',due:'${dayAgo(-2)}'},bd:'',up:1}},
 {id:'r2',client_id:'c1',advisor_id:'me',kind:'client_meta',content:{touch:[],ins:[{co:'B화재',nm:'실손',pay:-1}],fp:{},fam:'',rel:'',next:null,bd:'',up:1}}
];
window.__saved=window.__seedMeta.slice();
window.supabase={createClient:function(){
 var mk=function(tbl){
  var f={},neq={},up=null,del=false,sng=false,a={
   select:function(){return a},gte:function(){return a},lte:function(){return a},is:function(){return a},
   in:function(){return a},not:function(){return a},order:function(){return a},
   limit:function(){return a},single:function(){sng=true;return a},range:function(){return a},
   eq:function(k,v){f[k]=v;return a},
   neq:function(k,v){neq[k]=v;return a},
   insert:function(r){
     if(tbl==='saved_reports'){r.id='r'+(++window.__seq);r.created_at=new Date().toISOString();
       window.__saved.push(JSON.parse(JSON.stringify(r)));}
     if(tbl==='calls'){r.id='k'+(++window.__callSeq);r.created_by='me';
       window.__calls.push(JSON.parse(JSON.stringify(r)));}
     return a},
   update:function(r){up=r;return a},
   upsert:function(){return a},
   then:function(res){
     var out=[],i,tgt;
     if(del){
       tgt=(tbl==='calls')?window.__calls:[];
       for(i=tgt.length-1;i>=0;i--){var mm=true,kk;
         for(kk in f)if((''+tgt[i][kk])!==(''+f[kk]))mm=false;
         if(mm)tgt.splice(i,1);}
       return Promise.resolve({data:null,error:null}).then(res);
     }
     if(up){
       tgt=(tbl==='saved_reports')?window.__saved:(tbl==='clients'?window.__clients:[]);
       for(i=0;i<tgt.length;i++){
         var m=true,k;
         for(k in f)if((''+tgt[i][k])!==(''+f[k]))m=false;
         if(m)for(k in up)tgt[i][k]=JSON.parse(JSON.stringify(up[k]));
       }
       return Promise.resolve({data:null,error:null}).then(res);
     }
     if(tbl==='saved_reports'){
       out=window.__saved.filter(function(x){
         for(var k in f)if((''+x[k])!==(''+f[k]))return false;
         for(var k2 in neq)if((''+x[k2])===(''+neq[k2]))return false;
         return true;});
     }
     else if(tbl==='clients')out=window.__clients.filter(function(x){
       for(var k in f)if((''+x[k])!==(''+f[k]))return false;return true;});
     else if(tbl==='dbs')out=window.__dbs.slice();
     else if(tbl==='calls')out=window.__calls.slice();
     else if(tbl==='profiles')out=[{id:'me',name:'점검',role:'owner',active:true,plan:'vip',workspace:'both'},
       {id:'p2',name:'박서준',role:'member',active:true,workspace:'both'}]
       .filter(function(x){for(var k in f)if((''+x[k])!==(''+f[k]))return false;return true;});
     else out=[];
     return Promise.resolve({data:(sng?(out[0]||null):out),error:null}).then(res)}};
  a['delete']=function(){del=true;return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'me',email:'me@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'me'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
window.__errs=[];
`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.addInitScript(STUB);
  page.on('pageerror', e => page.evaluate(m => window.__errs.push(m), '' + e.message).catch(() => {}));

  await page.goto('http://localhost:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  await page.evaluate(() => go('clients'));
  await page.waitForTimeout(2600);

  console.log('\n[15] 고객 365일에 케어가 뜬다');
  const top = await page.evaluate(() => {
    const e = document.querySelector('.cc-top');
    return e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
  });
  ok(/오늘 안에 연락해야 할 분/.test(top), '맨 위에 「오늘 안에 연락해야 할 분 N명」 이 뜬다');
  ok(/2명/.test(top.split('오늘 안에 연락해야 할 분')[1] || ''),
    '넘긴 한 명 + 한 번도 안 한 한 명 = 2명 — ' + top.slice(0, 60));
  ok(/한 번도 없음/.test(top), '「한 번도 없음」 을 따로 센다');
  ok(/확인 필요/.test(top), '보험료를 못 읽은 고객을 「확인 필요」 로 적는다');
  ok(/접촉 기록만으로 셉니다/.test(top), '통화 기록과 못 이은 고객이 몇 명인지 적는다 — 조용히 세지 않는다');

  console.log('\n[16] 급한 사람이 목록 맨 위에 온다');
  const order = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#oscList .cm-row .cm-nm'), e => e.textContent.trim()));
  const dds = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#oscList .cm-row'), e => {
      const n = e.querySelector('.cm-nm'), d = e.querySelector('.cc-dd');
      return (n ? n.textContent.replace(/[0-9]+일|연락 없음|👑|❓/g, '').trim() : '') + '=' + (d ? d.textContent.trim() : '');
    }));
  ok(dds.length === 3, '내 고객 세 명만 선다 — 남의 고객은 안 섞인다 (' + dds.length + ')');
  ok(/연락 없음/.test(dds[0] || ''), '한 번도 연락 안 한 고객이 맨 위 (' + dds.join(' · ') + ')');
  ok(/=\d+일/.test(dds[1] || ''), '그 다음이 날짜가 지난 고객');
  ok(!/=0일/.test(dds.join(' ')), '「0일」 로 채운 줄이 하나도 없다');

  const crowns = await page.evaluate(() => document.querySelectorAll('#oscList .cc-vip').length);
  ok(crowns === 1, '월납 120만원인 고객에게만 👑 가 붙는다 (' + crowns + '개)');
  const q = await page.evaluate(() => document.querySelectorAll('#oscList .cc-unsure').length);
  ok(q >= 1, '월납을 못 읽은 고객에게 ❓ 가 붙는다 (' + q + '개)');


  console.log('\n[16-1] 「지금 진행중인 분」 칸');
  const runBox = await page.evaluate(() => {
    const e = document.querySelector('.cc-run');
    return e ? { txt: e.textContent.replace(/\s+/g, ' ').trim(), rows: e.querySelectorAll('.cc-rr').length } : null;
  });
  ok(!!runBox, '목록 맨 위에 「지금 진행중인 분」 칸이 선다');
  ok(/지금 진행중인 분 2명/.test(runBox.txt),
    'CRM 단계가 도는 김철수 + 다음 할 일이 잡힌 박서준 = 2명 — ' + runBox.txt.slice(0, 46));
  ok(runBox.rows === 2, '두 줄이 실제로 그려진다 (' + runBox.rows + '줄)');
  ok(/다음 할 일 · 설계안 보내드리기/.test(runBox.txt), '왜 진행중인지 줄마다 적는다');
  ok(/CRM 단계 AP/.test(runBox.txt), 'CRM 단계로 잡힌 사람도 그 까닭이 적힌다');
  ok(/계약이 끝난 분은 여기 없습니다/.test(runBox.txt), '무엇이 빠졌는지 밝힌다');
  const runChip = await page.evaluate(() => {
    const L = document.querySelectorAll('.cc-top .cc-chip');
    for (let i = 0; i < L.length; i++) if (/진행중/.test(L[i].textContent)) return L[i].textContent.replace(/\s+/g, ' ').trim();
    return '';
  });
  ok(/2 .*진행중/.test(runChip), '맨 위 요약에도 진행중 숫자가 뜬다 — ' + runChip);

  console.log('\n[16-2] 「이분들만 보기」');
  await page.evaluate(() => ccRunToggle());
  await page.waitForTimeout(500);
  const only = await page.evaluate(() => ({
    n: document.querySelectorAll('#oscList .cm-row').length,
    lab: Array.prototype.map.call(document.querySelectorAll('#oscList .cm-lab'),
      e => e.textContent).join(' | ')
  }));
  ok(only.n === 2, '진행중인 두 명만 남는다 (' + only.n + '명)');
  ok(/진행중인 분만 보는 중/.test(only.lab), '왜 줄었는지 적어 준다 — 안 적으면 고장으로 본다');
  await page.evaluate(() => ccRunToggle());
  await page.waitForTimeout(500);
  const allBack = await page.evaluate(() => document.querySelectorAll('#oscList .cm-row').length);
  ok(allBack === 3, '끄면 다시 전부 나온다 (' + allBack + '명)');

  const goBadge = await page.evaluate(() => document.querySelectorAll('#oscList .cc-go').length);
  ok(goBadge === 2, '줄에도 🏃 진행중 표시가 붙는다 (' + goBadge + '개)');

  console.log('\n[17] 「오늘 연락함」 을 누르면 D-day 가 0 이 된다');
  const before = await page.evaluate(() => (ccOf('c1') || {}).d);
  await page.evaluate(() => ccDid('c1', '상담'));
  await page.waitForTimeout(1200);
  const after = await page.evaluate(() => { ccDrop(); return (ccOf('c1') || {}).d; });
  ok(before >= 30, '누르기 전에는 30일이 넘어 있었다 (' + before + '일)');
  ok(after === 0, '누른 즉시 0 일이 된다 (' + after + '일)');
  const st = await page.evaluate(() => (ccOf('c1') || {}).k);
  ok(st === 'ok', '목록에서 아래로 내려간다 (상태 ' + st + ')');

  const wrote = await page.evaluate(() => window.__calls.filter(c => c.db_id === 'd1' && c.result === '상담').length);
  ok(wrote === 1, 'calls 에 한 줄이 들어갔다 — 결과까지 골라서 (' + wrote + '건)');
  const savedTouch = await page.evaluate(() => {
    const r = window.__saved.filter(x => x.client_id === 'c1' && x.kind === 'client_meta').pop();
    return (r && r.content && r.content.touch) ? r.content.touch.length : 0;
  });
  ok(savedTouch === 1, '고객 365일 접촉 기록에도 같이 남는다 (' + savedTouch + '건)');

  console.log('\n[18] 되돌리면 원래대로 온다');
  await page.evaluate(() => ccUndo('c1'));
  await page.waitForTimeout(1200);
  const back = await page.evaluate(() => { ccDrop(); return (ccOf('c1') || {}); });
  ok(back.k === 'over' && back.d >= 30, '되돌리면 다시 넘김으로 돌아온다 (' + back.d + '일 · ' + back.k + ')');
  const left = await page.evaluate(() => window.__calls.filter(c => c.result === '상담').length);
  ok(left === 0, 'calls 에 넣은 줄도 같이 지워진다 — 안 지우면 타율이 거짓이 된다 (' + left + '건)');
  const leftTouch = await page.evaluate(() => {
    const r = window.__saved.filter(x => x.client_id === 'c1' && x.kind === 'client_meta').pop();
    return (r && r.content && r.content.touch) ? r.content.touch.length : 0;
  });
  ok(leftTouch === 0, '접촉 기록에서도 지워진다 (' + leftTouch + '건)');

  console.log('\n[19] CRM 과 안 이어진 고객도 남길 수는 있다');
  await page.evaluate(() => ccDid('c3', '부재'));
  await page.waitForTimeout(1200);
  const c3 = await page.evaluate(() => { ccDrop(); return (ccOf('c3') || {}); });
  ok(c3.d === 0 && c3.k === 'ok', 'CRM DB 가 없어도 고객 365일에는 남는다 (' + c3.d + '일)');
  const noCall = await page.evaluate(() => window.__calls.filter(c => c.result === '부재').length);
  ok(noCall === 0, 'calls 에는 넣을 자리가 없으니 안 넣는다 — 없는 DB 로 억지로 만들지 않는다');
  await page.evaluate(() => ccUndo('c3'));
  await page.waitForTimeout(900);

  console.log('\n[20] 보험 월납을 고치면 VIP 가 바로 갈린다');
  await page.evaluate(() => { OSC.view = 'detail'; OSC.current = { id: 'c1', advisor_id: 'me', name_masked: '김*수' }; });
  await page.evaluate(() => go('clients'));
  await page.waitForTimeout(1800);
  const panel = await page.evaluate(() => {
    const e = document.querySelector('.cc-panel');
    return e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
  });
  ok(/연락 주기/.test(panel), '고객 한 사람 화면에 연락 주기 칸이 있다');
  ok(/오늘 연락함/.test(panel), '거기에도 「오늘 연락함」 단추가 있다');
  const insPanel = await page.evaluate(() => {
    const L = document.querySelectorAll('.osc-panel h3');
    for (let i = 0; i < L.length; i++) if (/보험 월납/.test(L[i].textContent)) return L[i].textContent.replace(/\s+/g, ' ').trim();
    return '';
  });
  ok(/확인 필요/.test(insPanel), '월납을 못 읽은 고객은 「확인 필요」 로 뜬다 — ' + insPanel);

  await page.evaluate(() => {
    const e = document.getElementById('ccIpay0');
    if (e) e.value = '1000000';
    ccInsSave('c1');
  });
  await page.waitForTimeout(1400);
  const nowVip = await page.evaluate(() => { ccDrop(); return (ccOf('c1') || {}); });
  ok(nowVip.vip === true && nowVip.cycle === 14,
    '100만원을 채우면 바로 👑 VIP · 14일 주기 (' + nowVip.sum + '원 · ' + nowVip.cycle + '일)');
  const insSaved = await page.evaluate(() => {
    const r = window.__saved.filter(x => x.client_id === 'c1' && x.kind === 'client_meta').pop();
    return (r && r.content && r.content.ins) ? r.content.ins.length : 0;
  });
  ok(insSaved === 1, '보험 목록이 client_meta 에 저장된다 — 새 표를 안 만든다 (' + insSaved + '건)');

  console.log('\n[20-1] 증권에서 가져오기 — 서류의 「보험료」 를 월납으로 옮긴다');
  /* 통합조회 서류가 주는 모양 그대로 심는다. fee 는 -1 이 「보험료 미제공」 이다. */
  const scanRows = await page.evaluate(() => {
    window.PR = window.PR || {};
    PR.scan = { who: { name: '김철수', age: 45, sex: '남' }, plans: [
      { co: 'A생명', name: '종신보험',   from: '2015-03-01', pay: '월납',    fee: 300000 },
      { co: 'B화재', name: '실손의료비', from: '2018-06-01', pay: '연납',    fee: 1200000 },
      { co: 'C생명', name: '암보험',     from: '2020-01-01', pay: '3개월납', fee: 300000 },
      { co: 'D화재', name: '운전자',     from: '2021-01-01', pay: '6개월납', fee: 300000 },
      { co: 'E생명', name: '연금',       from: '2019-01-01', pay: '일시납',  fee: 50000000 },
      { co: 'F화재', name: '치아',       from: '2022-01-01', pay: '전기납',  fee: 40000 },
      { co: 'G생명', name: '어린이',     from: '2023-01-01', pay: '',        fee: 70000 },
      { co: 'H화재', name: '주택',       from: '2024-01-01', pay: '월납',    fee: -1 }
    ] };
    return ccScanRows();
  });
  const sr = {}; scanRows.forEach(r => sr[r.co] = r);
  ok(sr['A생명'].pay === 300000, '월납 30만원은 그대로 30만원');
  ok(sr['B화재'].pay === 100000,
    '연납 120만원은 12로 나눠 10만원 — 그대로 두면 없던 VIP 가 생긴다 (' + sr['B화재'].pay + ')');
  ok(sr['C생명'].pay === 100000, '3개월납 30만원은 3으로 나눠 10만원');
  ok(sr['D화재'].pay === 50000, '6개월납 30만원은 6으로 나눠 5만원');
  ok(sr['E생명'].pay === null && /일시납/.test(sr['E생명'].why),
    '일시납은 매달 나가는 돈이 아니다 → 0 이 아니라 「모름」 — ' + sr['E생명'].why);
  ok(sr['F화재'].pay === null && /전기납/.test(sr['F화재'].why),
    '전기납도 서류만으로는 알 수 없다 → 「모름」');
  ok(sr['G생명'].pay === 70000 && /월납으로 봤습니다/.test(sr['G생명'].why),
    '주기가 안 적혔으면 월납으로 보되 그렇다고 적는다 — ' + sr['G생명'].why);
  ok(sr['H화재'].pay === null && /안 적혀/.test(sr['H화재'].why),
    '「보험료 미제공」(-1) 은 0 이 아니라 「모름」');
  ok(sr['A생명'].yr === 2015, '가입 연도도 같이 옮긴다 (' + sr['A생명'].yr + ')');

  console.log('\n[20-2] 상담자료로 가는 길도 같은 규칙을 쓴다');
  const sd = await page.evaluate(() => {
    const m = {}; sdPlanRows().forEach(r => m[r.company] = r.monthlyPayment); return m;
  });
  ok(sd['B화재'] === 100000, '상담자료 보장분석표에도 연납은 한 달치로 간다 (' + sd['B화재'] + ')');
  ok(sd['E생명'] === 0, '못 옮긴 것은 여태처럼 0 으로 넘긴다 — 저쪽 s10Money() 가 「모름」 으로 받는다');
  ok(sd['A생명'] === 300000, '월납은 그대로');

  console.log('\n[20-3] 남의 증권을 남의 고객에게 옮기지 않는다');
  const match = await page.evaluate(() => {
    /* c1 은 김*수 → 김철수 와 맞다. c2 는 박*준 → 안 맞다. */
    return { c1: ccScanMatch('c1'), c2: ccScanMatch('c2'),
             none: (function () { const w = PR.scan.who; PR.scan.who = null;
               const r = ccScanMatch('c1'); PR.scan.who = w; return r; })() };
  });
  ok(match.c1 === 'yes', '마스킹 이름(김*수)이 증권의 김철수와 맞으면 yes');
  ok(match.c2 === 'no', '박*준 고객에게는 no — 이름이 다르면 조용히 옮기지 않는다');
  ok(match.none === 'unknown', '견줄 이름이 없으면 「맞다」 가 아니라 「모른다」');

  console.log('\n[20-4] 자료를 고객에게 저장하면 월납도 같이 옮겨진다');
  const auto = await page.evaluate(() => {
    cmOf('c1').ins = []; cmOf('c2').ins = [];        /* 빈 상태에서 시작 */
    ccInsAfterSave('bojang', 'c1');
    ccInsAfterSave('bojang', 'c2');                  /* 이름이 달라 안 들어가야 한다 */
    ccInsAfterSave('finance', 'c3');                 /* 증권과 무관한 자료 */
    return null;
  });
  await page.waitForTimeout(1400);
  const filled = await page.evaluate(() => {
    ccDrop();
    return { c1: ccInsOf('c1').length, c2: ccInsOf('c2').length, c3: ccInsOf('c3').length,
             vip: (ccOf('c1') || {}).vip, sum: (ccOf('c1') || {}).sum,
             saved: (window.__saved.filter(x => x.client_id === 'c1' && x.kind === 'client_meta').pop() || {}).content };
  });
  ok(filled.c1 === 8, '이름이 맞는 고객에게는 여덟 건이 그대로 들어간다 (' + filled.c1 + ')');
  ok(filled.c2 === 0, '이름이 다른 고객에게는 안 들어간다 (' + filled.c2 + ')');
  ok(filled.c3 === 0, '증권과 무관한 자료(재무설계)로는 아무것도 안 옮긴다');
  ok(filled.sum === 620000,
    '읽어 낸 것만 더한다 = 30만 + 10만 + 10만 + 5만 + 7만 = 62만 (' + filled.sum + ')');
  ok(filled.vip === false, '62만이므로 아직 VIP 는 아니다 (' + filled.sum + '원)');
  const unsure = await page.evaluate(() => (ccOf('c1') || {}).unsure);
  ok(unsure === true,
    '다만 「모름」 이 셋 남아 있어 「확인 필요」 로 둔다 — 그 셋이 문턱을 넘길 수 있다');
  ok(!!(filled.saved && filled.saved.ins && filled.saved.ins.length === 8),
    '서버 client_meta 에 실제로 저장됐다 — 새 표는 안 만든다');
  ok((filled.saved.ins.filter(x => x.cyc === '연납')[0] || {}).pay === 100000,
    '서류에 적혀 있던 주기(연납)도 같이 남는다 — 어디서 온 숫자인지 나중에 견줄 수 있게');

  console.log('\n[20-5] 이미 적어 둔 보험 목록은 안 덮는다');
  const keep = await page.evaluate(() => {
    ccInsAfterSave('bojang', 'c1');   /* 이미 여덟 건이 있다 */
    return ccInsOf('c1').length;
  });
  await page.waitForTimeout(900);
  const kept = await page.evaluate(() => { ccDrop(); return ccInsOf('c1').length; });
  ok(kept === 8, '손으로 고쳐 둔 것이 있으면 증권이 다시 와도 안 덮는다 (' + kept + ')');

  console.log('\n[21] TFA 업무관리에 팀원별 달성률이 뜬다');
  await page.evaluate(() => { OSC.view = 'list'; OSC.current = null; });
  await page.evaluate(() => go('airep'));
  await page.waitForTimeout(2600);
  await page.evaluate(() => arLoad(true));
  await page.waitForTimeout(2600);
  await page.evaluate(() => arGoCat('care'));
  await page.waitForTimeout(2600);
  const care = await page.evaluate(() => {
    const e = document.querySelector('#arPane .ar-main');
    return e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
  });
  ok(/고객 연락 관리/.test(care), 'TFA 에 「고객 연락 관리」 칸이 있다');
  const head = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#arPane .cc-tb thead th'), e => e.textContent.trim()));
  ok(head.join('|') === '팀원|전체|기한 넘음|이번 달 연락|달성률|👑 VIP',
    '표가 요청한 칸을 그대로 세운다 — ' + head.join(' · '));
  const bodyRows = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#arPane .cc-tb tbody tr'), tr => Array.prototype.map.call(
      tr.querySelectorAll('td'), td => td.textContent.trim()).join('|')));
  ok(bodyRows.length === 3, '팀원 두 줄 + 합계 한 줄 (' + bodyRows.length + '줄)');
  const mineRow = bodyRows.filter(r => /\(나\)/.test(r))[0] || '';
  ok(/^점검 \(나\)\|3\|2 중 연락 없음 1\|/.test(mineRow),
    '내 줄 — 전체 3 · 기한 넘음 2 (그중 연락 없음 1) : ' + mineRow);
  ok(/\|33\.3%\|/.test(mineRow), '달성률 (3−2)÷3 = 33.3% — ' + mineRow);
  /* 같은 사람의 같은 숫자가 고객 365일 쪽에서도 나와야 한다 */
  const cross = await page.evaluate(() => { ccDrop(); const s = ccSum(ccMineRows()); return [s.n, s.due, s.never]; });
  ok(cross.join(',') === '3,2,1', '고객 365일 쪽 숫자와 같다 (' + cross.join(' · ') + ')');
  ok(/한 번도 연락 안 한 고객/.test(care), '「기한 넘음」 에 무엇이 들어 있는지 밝힌다');
  ok(/통화 기록과 이어진 고객/.test(care), '몇 명이 통화 기록과 이어졌는지 적는다');

  console.log('\n[22] 팀원 것이 남에게 안 보인다');
  const asMember = await page.evaluate(() => {
    /* 설계사로 바꿔 다시 그린다 */
    const wasLead = window.arIsLead;
    window.arIsLead = function () { return false; };
    const rows = arCareHtml().match(/<tbody>([\s\S]*?)<\/tbody>/);
    window.arIsLead = wasLead;
    return rows ? (rows[1].match(/<tr/g) || []).length : -1;
  });
  ok(asMember === 1, '설계사로 보면 자기 줄 하나만 나온다 (' + asMember + '줄) — 리더만 팀 전체');

  console.log('\n[23] 메뉴 배지와 홈 한 줄');
  const badge = await page.evaluate(() => {
    ccDrop(); ccNavPaint();
    const e = document.querySelector('.tab-btn[data-tab="clients"] .cc-nav');
    return e ? { t: e.textContent.trim(), bg: e.style.background } : null;
  });
  ok(!!badge && +badge.t >= 1, '「고객 365일」 메뉴에 밀린 사람 수가 붙는다 (' + (badge ? badge.t : '없음') + ')');
  ok(!!badge && /240, 68, 82|#F04452|rgb\(240, 68, 82\)/i.test(badge.bg),
    '이 한 자리에만 빨강을 쓴다 — 다 빨가면 아무것도 안 급해 보인다');
  await page.evaluate(() => go('home'));
  await page.waitForTimeout(1600);
  const home = await page.evaluate(() => {
    const e = document.getElementById('ccHome');
    return e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
  });
  ok(/오늘 안에 연락해야 할 분/.test(home) || /연락 주기 안에 있습니다/.test(home),
    '홈에 한 줄이 뜬다 — ' + home.slice(0, 70));

  console.log('\n[24] 연락 거리 — 「고객에게 전할 뉴스」 에서 가져온다');
  const news = await page.evaluate(() => {
    /* 이 칸이 보는 것은 「VIP 에게 무엇을 고르는가」 다.
       앞 단계가 c1 의 보험 목록을 바꿔 놓았으므로 여기서 직접 VIP 로 세운다. */
    cmOf('c1').ins = [{ co: 'A생명', nm: '종신', pay: 1200000 }];
    ccDrop();
    NLIVE.items = [
      { t: '전세 대출 금리 인하', u: 'https://x/1', cats: ['realty'], s: '한겨레' },
      { t: '연말정산 세액공제 확대', u: 'https://x/2', cats: ['tax'], s: '조선' },
      { t: '실손보험 개편안', u: 'https://x/3', cats: ['ins'], s: '매경' }
    ];
    /* c1 은 VIP → 세금 칸을 먼저 고른다 */
    if (!(ccOf('c1') || {}).vip) return { title: '(VIP 로 안 잡혔습니다)', msg: '' };
    const i = ccNewsPick('c1');
    return { i: i, title: (NLIVE.items[i] || {}).t, msg: nlMsg(i) };
  });
  ok(news.title === '연말정산 세액공제 확대', 'VIP 에게는 세금 소식을 먼저 고른다 — ' + news.title);
  ok(/고객님/.test(news.msg) && !/김철수/.test(news.msg),
    '문구에 고객 이름은 안 넣는다 (「고객님」) — 지금 규칙 그대로');
  const young = await page.evaluate(() => {
    cmOf('c3').fp = { f_age: '32' };
    cmOf('c3').ins = [];
    ccDrop();
    const i = ccNewsPick('c3');
    return (NLIVE.items[i] || {}).t;
  });
  ok(young === '전세 대출 금리 인하', '젊은 층에게는 부동산 소식 — ' + young);

  console.log('\n[25] 마무리');
  const errs = await page.evaluate(() => window.__errs || []);
  ok(errs.length === 0, '자바스크립트 오류 없음' + (errs.length ? (' — ' + errs.join(' / ')) : ''));

  await page.evaluate(() => go('clients'));
  await page.waitForTimeout(1800);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(700);
  const w = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  ok(w[0] <= w[1] + 1, '390px 가로 스크롤 없음 (' + w[0] + '/' + w[1] + ')');

  await browser.close();
  srv.close();

  console.log('\n' + (fail ? ('실패 ' + fail + '건') : '고객 케어 점검 통과') + ' — 통과 ' + pass + '건');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
