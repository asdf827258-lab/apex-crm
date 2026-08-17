/* ════════════════════════════════════════════════════════════════
   APEX 밤 작업 — 아침에 바로 쓸 물건을 미리 만들어 둔다

   지금까지 밤에는 '숫자 요약'만 만들었다(ai-daily). 읽고 나면 끝이었다.
   여기서는 아침에 그대로 쓸 결과물을 만든다.
   첫 번째: 오늘 약속이 잡힌 고객의 상담 준비 카드.

   한 번에 다 하지 않는다. 서버리스 함수는 오래 못 돌기 때문이다.
   할 일을 night_jobs 에 줄로 쌓아 두고, 실행할 때마다 몇 건씩만
   처리한다. 실패한 줄은 남아서 다음 실행에 다시 시도한다.

   고객 이름과 전화번호는 AI 로 보내지 않는다. 지역·상품·통화 메모만
   보내고, 이름은 우리 서버에서 제목에 붙인다.
   ════════════════════════════════════════════════════════════════ */

const GEMMODEL = require('../../scripts/gemini-model.js');

const SB_URL = process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AI_KEY = process.env.ANTHROPIC_API_KEY || '';
const GM_KEY = process.env.GEMINI_API_KEY || '';
const SECRET = process.env.CRON_SECRET || '';

const BATCH = 6;              /* 한 번 실행에 처리할 최대 건수 */
const TIME_BUDGET_MS = 18000; /* 이 시간을 넘기면 다음 실행으로 넘긴다 */

function kstToday() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}
function kstAgo(n) {
  return new Date(Date.now() + 9 * 3600 * 1000 - n * 86400000).toISOString().slice(0, 10);
}
/* 그날 하루(한국 시간)를 UTC 구간으로 바꾼다 */
function kstDayUtc(dateStr) {
  const s = new Date(dateStr + 'T00:00:00+09:00');
  return [s.toISOString(), new Date(s.getTime() + 86400000).toISOString()];
}
function hhmm(iso) {
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  const h = d.getUTCHours(), m = d.getUTCMinutes();
  return (h < 12 ? '오전 ' : '오후 ') + (h % 12 || 12) + '시' + (m ? (' ' + m + '분') : '');
}

async function sb(path, opts) {
  const r = await fetch(SB_URL + '/rest/v1/' + path, Object.assign({
    headers: {
      apikey: SB_KEY,
      Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }
  }, opts || {}));
  const t = await r.text();
  if (!r.ok) throw new Error(path.split('?')[0] + ' → ' + r.status + ' ' + t.slice(0, 160));
  return t ? JSON.parse(t) : null;
}

async function askAI(system, user, maxTokens) {
  if (AI_KEY) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': AI_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: maxTokens || 1200,
        system: system,
        messages: [{ role: 'user', content: user }]
      })
    });
    if (r.ok) {
      const j = await r.json();
      return (j.content || []).map(c => c.text || '').join('').trim();
    }
    if (!GM_KEY) throw new Error('Anthropic ' + r.status);
  }
  if (!GM_KEY) throw new Error('AI 키가 없습니다');
  const gemModel = await GEMMODEL.resolveModel(GM_KEY);
  const r2 = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/' + gemModel + ':generateContent?key=' + GM_KEY,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: maxTokens || 1200 }
      })
    }
  );
  if (!r2.ok) throw new Error('Gemini ' + r2.status + ' (모델 ' + gemModel + ') — ' + (await r2.text()).slice(0, 200));
  const j2 = await r2.json();
  return ((j2.candidates || [])[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
}

/* ── ① 오늘 할 일을 줄로 쌓는다 ─────────────────────────────────── */
async function plan(today) {
  const [from, to] = kstDayUtc(today);
  const appts = await sb(
    'calls?select=id,db_id,created_by,call_at,result,appointment_at,memo' +
    '&result=eq.' + encodeURIComponent('상담') +
    '&appointment_at=gte.' + encodeURIComponent(from) +
    '&appointment_at=lt.' + encodeURIComponent(to) +
    '&order=appointment_at.asc&limit=200'
  ).catch(() => []);
  if (!appts || !appts.length) return 0;

  const ids = Array.from(new Set(appts.map(a => a.db_id).filter(Boolean)));
  if (!ids.length) return 0;
  const inList = '(' + ids.map(x => '"' + x + '"').join(',') + ')';

  const [dbs, hist] = await Promise.all([
    sb('dbs?select=id,customer_name,phone,region,report_name,memo,assigned_to,assigned_date&id=in.' +
       encodeURIComponent(inList)).catch(() => []),
    sb('calls?select=db_id,call_at,result,memo&db_id=in.' + encodeURIComponent(inList) +
       '&order=call_at.asc&limit=800').catch(() => [])
  ]);
  const dbBy = {};
  (dbs || []).forEach(d => { dbBy[d.id] = d; });

  const rows = [];
  appts.forEach(a => {
    const d = dbBy[a.db_id];
    if (!d) return;
    const mine = (hist || []).filter(h => h.db_id === a.db_id);
    rows.push({
      kind: 'consult_prep',
      ref_id: String(a.db_id),
      ref_date: today,
      status: 'todo',
      payload: {
        advisor_id: d.assigned_to || a.created_by || null,
        name: d.customer_name || '',            /* 제목에만 쓴다. AI 로는 보내지 않는다 */
        at: a.appointment_at,
        region: d.region || '',
        product: d.report_name || '',
        db_memo: (d.memo || '').slice(0, 400),
        assigned_date: d.assigned_date || '',
        history: mine.slice(-12).map(h => ({
          d: String(h.call_at || '').slice(0, 10),
          r: h.result || '',
          m: (h.memo || '').slice(0, 220)
        }))
      }
    });
  });
  if (!rows.length) return 0;

  /* 같은 날 같은 고객은 한 줄만 — 이미 있으면 건드리지 않는다 */
  await sb('night_jobs?on_conflict=kind,ref_date,ref_id', {
    method: 'POST',
    headers: {
      apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal'
    },
    body: JSON.stringify(rows)
  }).catch(() => null);
  return rows.length;
}

/* ── ①-2 어제 팀이 어디서 막혔는지 모은다 ──────────────────────────
   여러 사람이 같은 곳에서 막히면 그건 개인 문제가 아니다. 그걸 찾는다.
   팀원이 말해 주기를 기다리지 않는다 — 대개 말하지 않는다.            */
async function planBlocked(today) {
  const y = kstAgo(1);
  const [hc, sg, fj] = await Promise.all([
    sb('health_checks?select=member_id,check_date,ok_count,warn_count,bad_count,detail' +
       '&check_date=gte.' + y + '&limit=200').catch(() => []),
    sb('suggestions?select=id,author_name,kind,title,body,status,created_at' +
       '&created_at=gte.' + y + 'T00:00:00&order=created_at.desc&limit=60').catch(() => []),
    sb('night_jobs?select=kind,ref_id,last_error,tries&status=eq.failed' +
       '&ref_date=gte.' + kstAgo(3) + '&limit=60').catch(() => [])
  ]);

  /* 같은 항목에서 막힌 사람을 센다 */
  const byItem = {};
  (hc || []).forEach(h => {
    const seen = {};
    (h.detail || []).forEach(d => {
      if (d.s !== 'bad' && d.s !== 'warn') return;
      const k = ((d.g || '') + ' / ' + (d.n || '')).slice(0, 80);
      if (seen[k]) return;
      seen[k] = 1;
      byItem[k] = byItem[k] || { k: k, bad: 0, warn: 0, n: 0, sample: '' };
      byItem[k].n++;
      if (d.s === 'bad') byItem[k].bad++; else byItem[k].warn++;
      if (!byItem[k].sample && d.v) byItem[k].sample = String(d.v).slice(0, 90);
    });
  });
  const items = Object.keys(byItem).map(k => byItem[k]).sort((a, b) =>
    (b.bad - a.bad) || (b.n - a.n));

  const news = (sg || []).filter(x => x.status === 'new');
  const nothing = !items.length && !news.length && !(fj || []).length;

  await sb('night_jobs?on_conflict=kind,ref_date,ref_id', {
    method: 'POST',
    headers: {
      apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal'
    },
    body: JSON.stringify([{
      kind: 'blocked_daily', ref_id: 'daily', ref_date: today, status: 'todo',
      payload: {
        checked: (hc || []).length,
        nothing: nothing,
        items: items.slice(0, 12),
        news: news.slice(0, 10).map(x => ({
          who: x.author_name || '', kind: x.kind || '', t: (x.title || '').slice(0, 90),
          b: (x.body || '').slice(0, 200)
        })),
        fails: (fj || []).slice(0, 8).map(x => ({
          k: x.kind, e: (x.last_error || '').slice(0, 120), n: x.tries
        }))
      }
    }])
  }).catch(() => null);
  return 1;
}

const BLOCK_SYS =
  '너는 팀의 운영을 보는 사람이다. 어제 팀이 어디서 막혔는지 정리해 대표에게 보고한다.\n' +
  '규칙:\n' +
  '1. 주어진 숫자만 쓴다. 없는 사실을 지어내지 않는다.\n' +
  '2. 사람을 탓하지 않는다. 여러 명이 같은 곳에서 막히면 그것은 개인이 아니라 시스템 문제다.\n' +
  '3. 한국어. 존댓말. 문장은 짧게. 미사여구를 넣지 않는다.\n' +
  '형식:\n' +
  '[한 줄] 어제 가장 크게 막힌 곳 한 문장\n' +
  '[여러 명이 같이 막힌 것] 최대 3가지. 각 줄에 몇 명인지와 무엇을 하면 되는지.\n' +
  '[한 사람만 막힌 것] 최대 3가지. 없으면 이 항목을 빼라.\n' +
  '[팀이 올린 것] 새로 올라온 오류·건의를 한 줄씩. 없으면 이 항목을 빼라.\n' +
  '[오늘 할 일] 대표가 오늘 처리할 것 1가지.';

function blockUser(p) {
  const L = [];
  L.push('[어제 점검한 사람] ' + (p.checked || 0) + '명');
  if ((p.items || []).length) {
    L.push('', '[막힌 항목]');
    p.items.forEach(x => L.push(
      '· ' + x.k + ' — ' + x.n + '명(심각 ' + x.bad + ' · 주의 ' + x.warn + ')' +
      (x.sample ? (' / 예: ' + x.sample) : '')));
  }
  if ((p.news || []).length) {
    L.push('', '[팀이 올린 것]');
    p.news.forEach(x => L.push('· [' + (x.kind || '') + '] ' + x.t + (x.b ? (' — ' + x.b) : '')));
  }
  if ((p.fails || []).length) {
    L.push('', '[밤 작업 실패]');
    p.fails.forEach(x => L.push('· ' + x.k + ' ' + x.n + '회 시도 — ' + x.e));
  }
  return L.join('\n');
}

/* ── ①-3 설계사마다 오늘 할 것 ────────────────────────────────────
   AI 가 필요 없다. 규칙만으로 나온다. 그래서 큐를 거치지 않고 바로 쓴다.
   · 오늘 먼저 걸 곳 — 배정받고 아직 한 번도 못 건 DB 중 오래 묵은 순
   · 오래 못 본 고객 — 자료를 만든 지 오래된 고객                     */
const COLD_DAYS = 90;

function dayGap(a, b) {
  return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
}
async function planPersonal(today) {
  const [profs, dbs, calls, cli, reps] = await Promise.all([
    sb('profiles?select=id,name,active,workspace').catch(() => []),
    sb('dbs?select=id,customer_name,region,assigned_to,assigned_date&limit=2000').catch(() => []),
    sb('calls?select=db_id&limit=5000').catch(() => []),
    sb('clients?select=id,advisor_id,name_masked,created_at&limit=2000').catch(() => []),
    sb('saved_reports?select=client_id,created_at&order=created_at.desc&limit=3000').catch(() => [])
  ]);
  const people = (profs || []).filter(p =>
    p.active !== false && (p.workspace == null || p.workspace === 'both' || p.workspace === 'apex'));
  if (!people.length) return 0;

  const touched = {};
  (calls || []).forEach(c => { if (c.db_id) touched[c.db_id] = 1; });
  const lastRep = {};
  (reps || []).forEach(r => {
    if (!r.client_id) return;
    const d = String(r.created_at || '').slice(0, 10);
    if (!lastRep[r.client_id] || lastRep[r.client_id] < d) lastRep[r.client_id] = d;
  });

  const rows = [];
  people.forEach(p => {
    const cold = (dbs || [])
      .filter(d => d.assigned_to === p.id && !touched[d.id])
      .sort((a, b) => String(a.assigned_date || '').localeCompare(String(b.assigned_date || '')))
      .slice(0, 5);
    const stale = (cli || [])
      .filter(c => c.advisor_id === p.id)
      .map(c => ({ c: c, last: lastRep[c.id] || String(c.created_at || '').slice(0, 10) }))
      .filter(x => x.last && dayGap(x.last, today) >= COLD_DAYS)
      .sort((a, b) => a.last.localeCompare(b.last))
      .slice(0, 5);
    if (!cold.length && !stale.length) return;

    const L = [];
    if (cold.length) {
      L.push('[오늘 먼저 걸 곳]');
      cold.forEach(d => {
        const g = d.assigned_date ? dayGap(String(d.assigned_date).slice(0, 10), today) : null;
        L.push('· ' + (d.customer_name || '이름 없음') +
          (d.region ? (' · ' + d.region) : '') +
          (g != null ? (' · 배정 ' + g + '일째') : ''));
      });
      L.push('', '전부 걸 필요는 없습니다. 위에서부터 몇 건까지 걸지 정하고 시작하세요.');
    }
    if (stale.length) {
      if (L.length) L.push('');
      L.push('[오래 못 본 고객]');
      stale.forEach(x => L.push('· ' + (x.c.name_masked || '고객') +
        ' · 마지막 자료 ' + dayGap(x.last, today) + '일 전'));
      L.push('', '안부만 물어도 됩니다. 새 자료를 만들 필요는 없습니다.');
    }
    rows.push({
      kind: 'day_plan', ref_id: String(p.id), ref_date: today, member_id: p.id,
      title: '오늘 할 것 — 걸 곳 ' + cold.length + '건 · 오래 못 본 고객 ' + stale.length + '명',
      body: L.join('\n'),
      meta: { db: cold.length, stale: stale.length }
    });
  });
  if (!rows.length) return 0;
  await sb('night_briefs?on_conflict=kind,ref_date,ref_id', {
    method: 'POST',
    headers: {
      apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(rows)
  }).catch(() => null);
  return rows.length;
}

/* ── ①-4 건의함 묶기 · 콘텐츠 초안 — AI 가 필요하니 줄로 쌓는다 ──── */
async function planExtras(today) {
  const jobs = [];

  const sg = await sb('suggestions?select=id,author_name,kind,title,body,status,created_at' +
    '&created_at=gte.' + kstAgo(60) + 'T00:00:00&order=created_at.desc&limit=120').catch(() => []);
  const open = (sg || []).filter(x => x.status === 'new' || x.status === 'doing');
  if (open.length >= 3) {
    jobs.push({
      kind: 'sugg_group', ref_id: 'daily', ref_date: today, status: 'todo',
      payload: {
        n: open.length,
        list: open.slice(0, 60).map(x => ({
          k: x.kind || '', s: x.status || '',
          t: (x.title || '').slice(0, 90), b: (x.body || '').slice(0, 160)
        }))
      }
    });
  }

  const reps = await sb('saved_reports?select=kind,created_at&created_at=gte.' +
    kstAgo(30) + 'T00:00:00&limit=500').catch(() => []);
  const byKind = {};
  (reps || []).forEach(r => { byKind[r.kind || '기타'] = (byKind[r.kind || '기타'] || 0) + 1; });
  const top = Object.keys(byKind).map(k => k + ' ' + byKind[k] + '건')
    .sort((a, b) => parseInt(b.split(' ')[1], 10) - parseInt(a.split(' ')[1], 10)).slice(0, 5);
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  jobs.push({
    kind: 'content', ref_id: 'daily', ref_date: today, status: 'todo',
    payload: { month: d.getUTCMonth() + 1, top: top }
  });

  if (!jobs.length) return 0;
  await sb('night_jobs?on_conflict=kind,ref_date,ref_id', {
    method: 'POST',
    headers: {
      apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal'
    },
    body: JSON.stringify(jobs)
  }).catch(() => null);
  return jobs.length;
}

const SUGG_SYS =
  '너는 팀이 올린 불편·건의를 정리하는 사람이다. 같은 이야기끼리 묶어 대표가 한눈에 보게 만든다.\n' +
  '규칙:\n' +
  '1. 주어진 목록에 있는 것만 쓴다. 없는 건의를 만들지 않는다.\n' +
  '2. 표현이 달라도 같은 문제면 하나로 묶는다. 몇 건인지 숫자를 적는다.\n' +
  '3. 사람 이름을 쓰지 않는다.\n' +
  '4. 한국어. 존댓말. 짧게.\n' +
  '형식:\n' +
  '[한 줄] 지금 가장 많이 나온 이야기\n' +
  '[묶은 것] 최대 5개. "N건 · 제목 — 무엇을 하면 되는지" 한 줄씩. 건수가 많은 것부터.\n' +
  '[혼자 나온 것] 최대 3개. 제목만.\n' +
  '[먼저 처리할 것] 1가지와 그 이유 한 줄.';

const CONTENT_SYS =
  '너는 보험 설계사의 콘텐츠 글감을 뽑는 편집자다.\n' +
  '규칙:\n' +
  '1. 특정 보험 상품을 권하거나 단정하지 않는다. 확정 수익·지급 보장 표현을 쓰지 않는다.\n' +
  '2. 고객 사례를 지어내지 않는다. 일반적인 상황으로 쓴다.\n' +
  '3. 한국어. 존댓말. 제목은 낚시하지 않는다.\n' +
  '형식: 글감 3개. 각각 아래 네 줄로.\n' +
  '[제목] 검색해서 들어올 만한 제목 한 줄\n' +
  '[누구에게] 어떤 상황의 사람이 읽을지\n' +
  '[첫 문단] 그대로 쓸 수 있는 3문장\n' +
  '[채널] 블로그 / 인스타 / 스레드 중 하나와 그 이유 한 줄';

/* ── ② 한 건 처리 — 상담 준비 카드 ─────────────────────────────── */
const PREP_SYS =
  '너는 보험 설계사의 상담 준비를 돕는다. 오늘 만날 고객의 통화 기록을 받고, ' +
  '설계사가 만나기 전 5분 동안 읽을 준비 카드를 만든다.\n' +
  '규칙:\n' +
  '1. 주어진 기록에 없는 사실을 지어내지 않는다. 모르는 것은 "확인 필요" 로 적는다.\n' +
  '2. 특정 보험 상품을 권하거나 단정하지 않는다. 무엇을 확인할지만 적는다.\n' +
  '3. 확정 수익·지급 보장·원금 보장 같은 표현은 쓰지 않는다.\n' +
  '4. 한국어. 존댓말. 문장은 짧게. 미사여구를 넣지 않는다.\n' +
  '형식:\n' +
  '[한 줄 요약] 이 고객이 지금 어떤 상태인지 한 문장\n' +
  '[먼저 확인할 것] 3가지. 각 한 줄.\n' +
  '[꺼내지 말 것] 1~2가지. 기록으로 보아 지금 꺼내면 역효과인 것.\n' +
  '[오늘 목표] 1가지. 이 만남에서 여기까지만 하면 성공인 것.';

function prepUser(p) {
  const h = (p.history || []).map(x =>
    '· ' + x.d + ' ' + (x.r || '') + (x.m ? (' — ' + x.m) : '')).join('\n');
  return [
    '[오늘 약속] ' + (p.at ? hhmm(p.at) : '시각 미정'),
    '[지역] ' + (p.region || '모름'),
    '[배정 상품] ' + (p.product || '모름'),
    '[배정일] ' + (p.assigned_date || '모름'),
    '[배정 메모] ' + (p.db_memo || '없음'),
    '',
    '[통화 기록 ' + (p.history || []).length + '건]',
    h || '(기록 없음)'
  ].join('\n');
}

async function work(today, startedAt) {
  const jobs = await sb(
    'night_jobs?select=id,kind,ref_id,ref_date,payload,tries' +
    '&status=eq.todo&ref_date=eq.' + today + '&order=created_at.asc&limit=' + BATCH
  ).catch(() => []);
  if (!jobs || !jobs.length) return { done: 0, failed: 0, left: 0 };

  let done = 0, failed = 0, left = 0;
  for (const j of jobs) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) { left++; continue; }
    const p = j.payload || {};
    try {
      let kind, title, body, member = null, meta = {};
      if (j.kind === 'sugg_group') {
        kind = 'sugg_group';
        title = '건의 ' + (p.n || 0) + '건 묶어 보기';
        body = await askAI(SUGG_SYS,
          (p.list || []).map(x => '· [' + x.k + '/' + x.s + '] ' + x.t + (x.b ? (' — ' + x.b) : '')).join('\n'),
          1500);
        if (!body) throw new Error('빈 응답');
        meta = { n: p.n || 0 };
      } else if (j.kind === 'content') {
        kind = 'content';
        title = '오늘의 콘텐츠 글감 3개';
        body = await askAI(CONTENT_SYS,
          '[이번 달] ' + (p.month || '') + '월\n' +
          '[팀이 최근 30일 많이 만든 자료] ' + ((p.top || []).join(' · ') || '기록 없음') + '\n\n' +
          '위를 참고해 지금 시기에 맞는 글감 3개를 뽑아 주세요.', 1600);
        if (!body) throw new Error('빈 응답');
        meta = { month: p.month || 0 };
      } else if (j.kind === 'blocked_daily') {
        kind = 'blocked';
        title = kstAgo(1) + ' 막힌 곳';
        if (p.nothing) {
          body = '[한 줄]\n어제는 막힌 곳이 없었습니다.\n\n[오늘 할 일]\n평소대로 두어도 됩니다.';
        } else {
          body = await askAI(BLOCK_SYS, blockUser(p), 1400);
          if (!body) throw new Error('빈 응답');
        }
        meta = {
          checked: p.checked || 0,
          items: (p.items || []).length,
          news: (p.news || []).length,
          fails: (p.fails || []).length,
          top: (p.items || [])[0] ? ((p.items[0].k || '') + ' · ' + p.items[0].n + '명') : ''
        };
      } else {
        kind = 'consult_prep';
        body = await askAI(PREP_SYS, prepUser(p), 1100);
        if (!body) throw new Error('빈 응답');
        title = (p.name || '고객') + ' · ' + (p.at ? hhmm(p.at) : '시각 미정');
        member = p.advisor_id || null;
        meta = { at: p.at || null, region: p.region || '', product: p.product || '', calls: (p.history || []).length };
      }
      await sb('night_briefs?on_conflict=kind,ref_date,ref_id', {
        method: 'POST',
        headers: {
          apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify([{
          kind: kind, ref_id: j.ref_id, ref_date: today,
          member_id: member, title: title, body: body, meta: meta
        }])
      });
      await sb('night_jobs?id=eq.' + j.id, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'done', tries: (j.tries || 0) + 1, updated_at: new Date().toISOString() })
      });
      done++;
    } catch (e) {
      const tries = (j.tries || 0) + 1;
      await sb('night_jobs?id=eq.' + j.id, {
        method: 'PATCH',
        body: JSON.stringify({
          status: tries >= 3 ? 'failed' : 'todo',   /* 세 번까지는 다음 밤에 다시 */
          tries: tries,
          last_error: String(e.message || e).slice(0, 300),
          updated_at: new Date().toISOString()
        })
      }).catch(() => null);
      failed++;
    }
  }
  const rest = await sb('night_jobs?select=id&status=eq.todo&ref_date=eq.' + today + '&limit=200')
    .catch(() => []);
  return { done: done, failed: failed, left: (rest || []).length + left };
}

exports.handler = async function (event) {
  const startedAt = Date.now();
  const today = kstToday();

  if (!SB_KEY) {
    return { statusCode: 200, body: JSON.stringify({
      ok: false, reason: 'SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.' }) };
  }
  /* 예약 실행이 아니라 사람이 주소로 부른 경우엔 열쇠를 확인한다 */
  const body = (event && event.body) || '';
  const scheduled = body.indexOf('next_run') >= 0;
  if (!scheduled && SECRET) {
    const given = (event && event.headers &&
      (event.headers['x-cron-secret'] || event.headers['X-Cron-Secret'])) || '';
    if (given !== SECRET) return { statusCode: 401, body: JSON.stringify({ ok: false, reason: '권한 없음' }) };
  }

  const log = [];
  let planned = 0;
  try {
    planned = await plan(today);
    log.push('오늘 약속 ' + planned + '건 확인');
  } catch (e) {
    log.push('계획 실패: ' + String(e.message || e).slice(0, 120));
  }
  try {
    await planBlocked(today);
    log.push('어제 막힌 곳 모음 준비');
  } catch (e) {
    log.push('막힌 곳 모으기 실패: ' + String(e.message || e).slice(0, 120));
  }
  try {
    const n = await planPersonal(today);
    log.push('오늘 할 것 ' + n + '명분');
  } catch (e) {
    log.push('오늘 할 것 실패: ' + String(e.message || e).slice(0, 120));
  }
  try {
    const n = await planExtras(today);
    log.push('건의 묶기·콘텐츠 ' + n + '건 준비');
  } catch (e) {
    log.push('건의·콘텐츠 준비 실패: ' + String(e.message || e).slice(0, 120));
  }

  let r = { done: 0, failed: 0, left: 0 };
  try {
    r = await work(today, startedAt);
    log.push('처리한 일 ' + r.done + '건' + (r.failed ? (' · 실패 ' + r.failed) : '') +
             (r.left ? (' · 남은 일 ' + r.left) : ' · 남은 일 없음'));
  } catch (e) {
    log.push('처리 실패: ' + String(e.message || e).slice(0, 120));
  }

  /* 언제 무엇을 했는지 남긴다 — 앱 시스템 점검에서 본다 */
  try {
    await sb('night_briefs?on_conflict=kind,ref_date,ref_id', {
      method: 'POST',
      headers: {
        apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify([{
        kind: 'run_log', ref_id: 'night', ref_date: today, member_id: null,
        title: '밤 작업 ' + new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(11, 16),
        body: log.join('\n'),
        meta: { sec: Math.round((Date.now() - startedAt) / 1000), done: r.done, left: r.left }
      }])
    });
  } catch (e) { /* 기록 실패는 넘어간다 */ }

  return { statusCode: 200, body: JSON.stringify({
    ok: true, date: today, planned: planned, done: r.done, failed: r.failed, left: r.left, log: log }) };
};
