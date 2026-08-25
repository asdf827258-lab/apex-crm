/* ════════════════════════════════════════════════════════════════
   하루 한 장 — 아침 7시에 <b>서버가 사람마다 미리 완성해 둔다.</b>

   전에는 앱을 열어야 만들어졌다(dgAuto). 대표가 아침에 앱을 안 열면
   그날 한 장은 없었고, 팀원은 아예 자기 것이 없었다. 그래서 시각을
   사람이 아니라 <b>시계</b>에 맡긴다 — netlify.toml 의 schedule 로
   UTC 22:00 = KST 07:00 에 돈다.

   <b>직책대로 범위가 갈린다</b>(조직도 org_members.rank).
     대표(사업단장·본부장) → 전원      리더(지점장·팀장) → 자기 팀
     그 밖                → 자기 것
   삼항 사슬로 나열하면 직책이 늘 때 반드시 하나를 빠뜨리므로
   (CLAUDE.md 5번) 범위는 SCOPE 표 <b>한 곳</b>에서만 답한다.

   <b>서버를 아껴 쓴다</b>(7번). 사람마다 부르면 팀이 서른이면 서른 번이다.
   표마다 <b>한 번씩만</b> 읽고 그 뒤는 메모리에서 가른다.

   <b>지어내지 않는다</b>(1번). 못 읽은 표는 null 로 두고 0 과 구분한다.
   0 은 「했는데 없음」이고 null 은 「모름」이라, 섞으면 화면이 거짓말한다.

   <b>고객 실명은 여기에 담지 않는다</b>(3번). 이 한 장은 서버에 쌓이므로
   팀원 이름과 숫자만 담고 고객은 건수로만 센다.
   ════════════════════════════════════════════════════════════════ */

const SB_URL = process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const KIND = 'daily_brief';

/* 팀원이 올리는 보고의 갈래. 표 한 곳에서만 답한다 — 갈래가 늘어도 빠뜨릴 자리가 없다. */
const SUB_LABEL = { growth: '성장', meeting: '회의', material: '자료', issue: '이슈' };

/* 보고 <b>글</b>은 아무나 못 본다. 앱의 규칙(reports_select)은
     작성자 본인 · 대표 · <b>그 사람의 팀을 이끄는 리더</b>
   이고, 이 한 장이 담는 사람(peopleFor)이 <b>정확히 그 범위</b>다 —
   대표는 전원, 리더는 자기 팀, 그 밖은 자기 것. 그래서 담는 사람만 맞으면
   글을 담아도 규칙과 어긋나지 않는다.

   <b>다만 이 한 장은 service_role 이 쓴다.</b> DB 규칙을 좁히면서 여기를 안 고치면
   그 순간부터 남의 글이 새어 나간다 — 둘은 반드시 같이 움직여야 한다.
   check-brief 가 SQL 규칙과 이 범위가 맞는지 본다. */

/* 직책 → 어디까지 보나. 조직도 직책이 정본이고, 비어 있으면 앱 권한으로 채운다. */
const SCOPE = {
  '사업단장': 'all',
  '본부장': 'all',
  '지점장': 'team',
  '팀장': 'team',
  '설계사': 'self'
};
const ROLE_SCOPE = {
  owner: 'all',
  admin: 'all',
  branch_manager: 'all',
  education_manager: 'team'
};

function kstDate(offsetDays) {
  const d = new Date(Date.now() + 9 * 3600 * 1000 - (offsetDays || 0) * 86400000);
  return d.toISOString().slice(0, 10);
}

async function sb(path, opts) {
  const r = await fetch(SB_URL + '/rest/v1/' + path, Object.assign({
    headers: {
      apikey: SB_KEY,
      Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    }
  }, opts || {}));
  if (!r.ok) throw new Error(path + ' → ' + r.status + ' ' + (await r.text()).slice(0, 160));
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

/* 못 읽은 표는 <b>빈 배열이 아니라 null</b> 이다 — 「없다」와 「모른다」는 다르다. */
async function readOr(path) {
  try { return await sb(path); } catch (e) { return null; }
}

/* ── 한 사람의 한 장 ─────────────────────────────────────────── */

/* 이 사람이 보는 사람들. 대표는 전원, 리더는 자기 팀, 그 밖은 자기만. */
function peopleFor(scope, me, teamOf, leaderTeams, everyone) {
  if (scope === 'all') return everyone.slice();
  if (scope === 'team') {
    const mine = leaderTeams[me.id] || [];
    if (!mine.length) {
      /* 리더인데 이끄는 팀이 없으면 <b>속한 팀</b>으로 본다. 그것도 없으면 자기만. */
      const t = teamOf[me.id];
      if (!t) return [me];
      return everyone.filter(p => teamOf[p.id] === t);
    }
    const set = {};
    mine.forEach(t => { set[t] = 1; });
    const out = everyone.filter(p => set[teamOf[p.id]]);
    return out.length ? out : [me];
  }
  return [me];
}

/* 숫자를 센다. 원자료가 null(못 읽음)이면 그 칸도 null 로 남긴다. */
function countFor(ids, data, today) {
  const has = {};
  ids.forEach(i => { has[i] = 1; });
  const n = {};

  n.people = ids.length;

  n.attend = data.attendance === null ? null
    : data.attendance.filter(a => has[a.member_id] && a.att_date === today).length;

  n.newClients = data.clients === null ? null
    : data.clients.filter(c => has[c.advisor_id] && (c.created_at || '').slice(0, 10) === today).length;

  n.reports = data.saved === null ? null
    : data.saved.filter(s => has[s.advisor_id] && (s.created_at || '').slice(0, 10) === today).length;

  n.aiUse = data.aiUsage === null ? null
    : data.aiUsage.filter(u => has[u.member_id] && u.usage_date === today)
                  .reduce((s, u) => s + (u.cnt || 0), 0);

  /* 오늘 올라온 보고 — 건수는 누구나 볼 수 있다. 글은 아래에서 따로 가른다. */
  n.subs = data.subs === null ? null
    : data.subs.filter(r => has[r.author_id] && (r.created_at || '').slice(0, 10) === today).length;

  /* 사흘 넘게 아무 기척이 없는 사람 — 리더가 아침에 제일 먼저 볼 자리다.
     출근표를 못 읽었으면 「없다」고 하지 않고 모른다고 남긴다. */
  if (data.attendance === null) {
    n.quiet = null;
  } else {
    const last = {};
    data.attendance.forEach(a => {
      if (!has[a.member_id]) return;
      if (!last[a.member_id] || last[a.member_id] < a.att_date) last[a.member_id] = a.att_date;
    });
    const cut = kstDate(3);
    n.quiet = ids.filter(i => !last[i] || last[i] < cut).length;
  }
  return n;
}

/* 숫자를 사람 말로. <b>없는 숫자는 만들지 않고</b> 무엇을 못 읽었는지 적는다. */
function lines(n, scope) {
  const see = [], miss = [];
  const say = (v, txt, unknown) => {
    if (v === null) { miss.push(unknown); return; }
    see.push(txt(v));
  };

  say(n.attend, v => '오늘 출근 ' + v + '명 / ' + n.people + '명', '출근');
  say(n.newClients, v => '오늘 새로 담은 고객 ' + v + '건', '고객');
  say(n.reports, v => '오늘 만든 자료 ' + v + '건', '상담자료');
  say(n.subs, v => (v > 0 ? '오늘 올라온 보고 ' + v + '건'
                          : '오늘 올라온 보고는 아직 없습니다'), '보고');
  if (scope !== 'self') say(n.quiet, v => (v > 0
    ? '사흘 넘게 기척 없는 사람 ' + v + '명 — 먼저 연락해 보십시오'
    : '사흘 넘게 기척 없는 사람은 없습니다'), '출근');

  return {
    see: see,
    miss: miss.filter((v, i, a) => a.indexOf(v) === i)
  };
}

/* ── 실행 ──────────────────────────────────────────────────── */

exports.handler = async () => {
  const started = Date.now();
  const today = kstDate(0);
  const log = [];

  if (!SB_KEY) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, why: 'no key' }) };
  }

  /* 표마다 딱 한 번씩만 읽는다 (7번). 30일치를 한 번에 받아 메모리에서 가른다. */
  const d30 = kstDate(29);
  const [profs, orgs, teams, tmems, attendance, clients, saved, aiUsage, subs] = await Promise.all([
    readOr('profiles?select=id,name,role,active'),
    readOr('org_members?select=member_id,rank,name'),
    readOr('teams?select=id,name,leader_id'),
    readOr('team_members?select=team_id,member_id'),
    readOr('attendance?select=member_id,att_date&att_date=gte.' + d30),
    readOr('clients?select=advisor_id,created_at&created_at=gte.' + d30 + 'T00:00:00'),
    readOr('saved_reports?select=advisor_id,created_at&kind=neq.' + KIND +
           '&created_at=gte.' + d30 + 'T00:00:00'),
    readOr('ai_usage?select=member_id,usage_date,cnt&usage_date=gte.' + d30),
    /* body 는 받지 않는다 — 팀원이 쓴 본문에는 고객 이야기가 섞일 수 있고(3번),
       한 장에 필요한 것은 「누가 무엇을 올렸나」 뿐이다. */
    readOr('reports?select=author_id,author_name,kind,title,created_at&created_at=gte.' +
           d30 + 'T00:00:00')
  ]);

  /* 명단을 못 읽으면 <b>아무 한 장도 세우지 않는다</b> (1번 — 값이 없으면 화면을 세우지 않는다). */
  if (profs === null) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, why: 'profiles 를 못 읽었습니다' }) };
  }
  const everyone = profs.filter(p => p.active !== false);
  if (!everyone.length) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, why: '명단이 비어 있습니다' }) };
  }

  const rankOf = {};
  (orgs || []).forEach(o => { if (o.member_id && o.rank) rankOf[o.member_id] = o.rank; });

  const teamOf = {};
  (tmems || []).forEach(m => { teamOf[m.member_id] = m.team_id; });

  const leaderTeams = {};
  (teams || []).forEach(t => {
    if (!t.leader_id) return;
    (leaderTeams[t.leader_id] = leaderTeams[t.leader_id] || []).push(t.id);
  });

  const data = { attendance, clients, saved, aiUsage, subs };
  const unknownRanks = {};
  const rows = [];

  everyone.forEach(me => {
    const rank = rankOf[me.id] || '';
    let scope = SCOPE[rank];
    if (!scope && rank) unknownRanks[rank] = 1;
    if (!scope) scope = ROLE_SCOPE[me.role] || 'self';
    /* 팀을 이끄는 사람은 직책이 무엇이든 자기 팀은 본다 */
    if (scope === 'self' && leaderTeams[me.id]) scope = 'team';

    const crew = peopleFor(scope, me, teamOf, leaderTeams, everyone);
    const ids = crew.map(p => p.id);
    const n = countFor(ids, data, today);
    const L = lines(n, scope);

    /* 담는 사람(ids)이 곧 볼 권한이 있는 사람이라, 그 사람들 것만 담으면 된다. */
    let subList = [];
    if (subs) {
      const mine = {};
      ids.forEach(i => { mine[i] = 1; });
      subList = subs
        .filter(r => mine[r.author_id] && (r.created_at || '').slice(0, 10) === today)
        .slice(0, 30)
        .map(r => ({ who: r.author_name || '이름 없음',
                     kind: SUB_LABEL[r.kind] || r.kind || '보고',
                     title: r.title || '(제목 없음)' }));
    }

    rows.push({
      advisor_id: me.id,
      kind: KIND,
      title: today + ' 하루 한 장',
      content: {
        date: today,
        scope: scope,
        rank: rank || null,      /* 조직도에 직책이 없으면 <b>모름</b> — 빈 글자로 눙치지 않는다 */
        byRole: !rank,           /* 직책이 아니라 앱 권한으로 범위를 정했다는 표시 */
        nums: n,
        subs: subList,           /* 오늘 올라온 보고 — 볼 권한이 있는 사람 것만 */
        see: L.see,
        miss: L.miss,            /* 못 읽은 자리를 그대로 밝힌다 */
        madeAt: new Date().toISOString(),
        auto: true
      }
    });
  });

  /* 같은 날 것이 이미 있으면 지우고 새로 넣는다 — 두 벌이 쌓이면
     어느 것이 오늘 것인지 앱이 못 고른다 (5-1 · 같은 것을 두 번 받지 않는다). */
  try {
    await sb('saved_reports?kind=eq.' + KIND + '&created_at=gte.' + today + 'T00:00:00',
             { method: 'DELETE' });
  } catch (e) { log.push('묵은 것 지우기 실패: ' + e.message.slice(0, 60)); }

  let put = 0;
  for (let i = 0; i < rows.length; i += 50) {
    try {
      await sb('saved_reports', { method: 'POST', body: JSON.stringify(rows.slice(i, i + 50)) });
      put += rows.slice(i, i + 50).length;
    } catch (e) { log.push('넣기 실패: ' + e.message.slice(0, 80)); }
  }

  /* 모르는 직책은 <b>조용히 자기 것으로 떨어뜨리지 않고</b> 적어 둔다 —
     조직도에 새 직책이 생기면 SCOPE 표에 한 줄 보태야 한다는 뜻이다. */
  const uk = Object.keys(unknownRanks);
  if (uk.length) log.push('SCOPE 표에 없는 직책: ' + uk.join(', '));

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true, date: today, made: put, of: rows.length,
      secs: Math.round((Date.now() - started) / 1000), log: log
    })
  };
};
