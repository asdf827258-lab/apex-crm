/* ════════════════════════════════════════════════════════════════
   APEX 야간 자동 근무 — 매일 새벽 서버에서 스스로 실행
   앱을 켜두지 않아도, 대표가 자는 동안 AI 부서들이 데이터를 읽고
   회의록·부서보고를 만들어 ai_dept_reports 에 쌓아둔다.
   실행 시각은 netlify.toml 의 schedule 로 지정한다.
   ════════════════════════════════════════════════════════════════ */

const GEMMODEL = require('../../scripts/gemini-model.js');

const SB_URL = process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AI_KEY = process.env.ANTHROPIC_API_KEY || '';
const GM_KEY = process.env.GEMINI_API_KEY || '';

const DEPTS = [
  { id: 'sales',   n: '영업지원팀', role: 'DB 배정·통화·약속 전환을 본다' },
  { id: 'consult', n: '상담설계팀', role: '상담자료 생산량과 저장 상태를 본다' },
  { id: 'edu',     n: '교육팀',     role: '본인 점검란 진도와 지연자를 본다' },
  { id: 'content', n: '콘텐츠팀',   role: '콘텐츠 발행과 노출을 본다' },
  { id: 'ops',     n: '운영팀',     role: '출근·활동·시스템 사용을 본다' },
  { id: 'risk',    n: '준법팀',     role: '준법 위험과 점검 항목을 본다' }
];

const TONE =
  '규칙: ① 주어진 실제 데이터만 근거로 삼고 없는 숫자를 지어내지 마라. ' +
  '② AI 티 나는 말투 금지("~인 것 같습니다","도움이 되길 바랍니다" 금지) — 실무자처럼 짧고 단정하게. ' +
  '③ 보험 관련 제안은 금융소비자보호법 준수를 전제로 쓴다.';

function kstToday() {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}
function daysAgo(n) {
  const d = new Date(Date.now() + 9 * 3600 * 1000 - n * 86400000);
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

async function askAI(system, user, maxTokens) {
  if (AI_KEY) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': AI_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: maxTokens || 2000,
        system: system,
        messages: [{ role: 'user', content: user }]
      })
    });
    if (r.ok) {
      const j = await r.json();
      return (j.content || []).map(c => c.text || '').join('').trim();
    }
    if (!GM_KEY) throw new Error('Anthropic ' + r.status + ' ' + (await r.text()).slice(0, 140));
  }
  if (!GM_KEY) throw new Error('AI 키가 없습니다 (ANTHROPIC_API_KEY 또는 GEMINI_API_KEY)');
  const gemModel = await GEMMODEL.resolveModel(GM_KEY);
  const r2 = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/' + gemModel + ':generateContent?key=' + GM_KEY,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: maxTokens || 2000 }
      })
    }
  );
  if (!r2.ok) throw new Error('Gemini ' + r2.status + ' (모델 ' + gemModel + ') — ' + (await r2.text()).slice(0, 180));
  const j2 = await r2.json();
  return ((j2.candidates || [])[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
}

async function gatherFacts() {
  const d30 = daysAgo(29);
  const [profs, cli, rep, att, brf, ys] = await Promise.all([
    sb('profiles?select=id,name,active,status,workspace').catch(() => []),
    sb('clients?select=id,created_at&created_at=gte.' + d30 + 'T00:00:00').catch(() => []),
    sb('saved_reports?select=kind,created_at&created_at=gte.' + d30 + 'T00:00:00').catch(() => []),
    sb('attendance?select=member_id,att_date&att_date=gte.' + d30).catch(() => []),
    sb('reports?select=kind,created_at&created_at=gte.' + d30 + 'T00:00:00').catch(() => []),
    sb('ai_dept_reports?select=dept,title,body&dept=eq.yoonsi&order=created_at.desc&limit=1').catch(() => [])
  ]);
  const apex = (profs || []).filter(
    p => p.active !== false && p.workspace !== 'crm' && (p.status == null || p.status === 'approved')
  );
  let txt =
    '[최근 30일 실제 데이터 · 기준일 ' + kstToday() + ']\n' +
    '· APEX 승인 회원 ' + apex.length + '명\n' +
    '· 신규 고객 ' + (cli || []).length + '건\n' +
    '· 상담자료 ' + (rep || []).length + '건\n' +
    '· 출근 ' + (att || []).length + '회(1인 평균 ' + (apex.length ? Math.round((att || []).length / apex.length) : 0) + '회)\n' +
    '· 보고서 ' + (brf || []).length + '건';
  if (ys && ys.length && ys[0].body) {
    txt += '\n\n[윤시스쿨 오피스 현황 — 회의에서 반드시 다룰 것]\n' + String(ys[0].body).slice(0, 1600);
  }
  return txt;
}

async function save(row) {
  await sb('ai_dept_reports?on_conflict=dept,period,ref_date', {
    method: 'POST',
    body: JSON.stringify([row])
  });
}

exports.handler = async function () {
  const started = Date.now();
  const today = kstToday();
  const log = [];

  if (!SB_KEY) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: false,
        reason: 'SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다. Netlify → Site settings → Environment variables 에 추가하세요.'
      })
    };
  }

  let facts;
  try {
    facts = await gatherFacts();
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, reason: '데이터 조회 실패: ' + e.message }) };
  }

  /* ① 부서별 일일보고 */
  for (const d of DEPTS) {
    try {
      const sys =
        '너는 APEX YUN PRO의 ' + d.n + ' 책임자다. 역할: ' + d.role + '\n' + TONE +
        '\n\n형식: 첫 줄에 20자 이내 제목(따옴표 금지), 그다음 줄부터 본문 4~6문장.\n' +
        '본문 순서 — (1) 관측된 사실 (2) 문제·병목 (3) 오늘 할 일 1가지.';
      const txt = await askAI(sys, facts, 800);
      const lines = String(txt || '').split('\n').filter(x => x.trim());
      const title = (lines.shift() || d.n + ' 일일 보고').replace(/^[#*\-\s]+/, '').replace(/["“”]/g, '').slice(0, 60);
      await save({
        dept: d.id, dept_name: d.n, period: 'daily', ref_date: today,
        title: title, body: lines.join('\n')
      });
      log.push(d.n + ' ok');
    } catch (e) {
      log.push(d.n + ' 실패: ' + e.message.slice(0, 80));
    }
  }

  /* ② 전체 회의록 */
  try {
    const sys =
      '너는 APEX YUN PRO의 AI 임원 회의 서기다. 6개 부서(영업지원·상담설계·교육·콘텐츠·운영·준법)와 ' +
      '윤시스쿨 오피스가 새벽 회의를 마친 것처럼 회의록을 쓴다. 윤시스쿨 현황이 주어지면 그 회의·할일을 ' +
      '반드시 안건으로 다루고, 미완료 할일은 실행 과제로 올려라.\n' + TONE +
      '\n\n# 형식\n## 1. 오늘의 결론 (3줄)\n## 2. 부서별 보고\n각 부서 [현황][문제][제안] 각 1줄\n' +
      '## 3. 실행 과제\n- [담당부서] 과제 — 이유 한 줄\n## 4. 아이디어 3개\n"IDEA | 부서 | 제목 | 기대효과" 한 줄씩';
    const txt = await askAI(sys, facts, 2600);
    await save({
      dept: 'meeting', dept_name: '전체 회의', period: 'daily', ref_date: today,
      title: today + ' 전체 회의록 (야간 자동)', body: txt
    });
    log.push('회의록 ok');
  } catch (e) {
    log.push('회의록 실패: ' + e.message.slice(0, 80));
  }

  /* ③ 대표용 아침 브리핑 */
  try {
    const sys =
      '너는 APEX YUN PRO 대표의 비서다. 대표가 아침에 3분 안에 읽을 브리핑을 쓴다.\n' + TONE +
      '\n\n# 형식\n## 오늘 대표가 볼 것 (3줄)\n숫자 근거를 붙여서\n' +
      '## 오늘 반드시 결정할 것 1가지\n왜 오늘인지 한 줄\n## 팀에 던질 한 마디\n단톡에 그대로 붙여넣을 문장 1~2줄';
    const txt = await askAI(sys, facts, 1200);
    await save({
      dept: 'briefing', dept_name: '☀ 아침 브리핑', period: 'daily', ref_date: today,
      title: today + ' 아침 브리핑', body: txt
    });
    log.push('브리핑 ok');
  } catch (e) {
    log.push('브리핑 실패: ' + e.message.slice(0, 80));
  }

  /* ④ 실행 기록 (앱에서 마지막 실행 시각 확인용) */
  try {
    await save({
      dept: 'autorun', dept_name: '🌙 야간 자동 근무', period: 'daily', ref_date: today,
      title: '자동 실행 ' + new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' '),
      body: '- 소요 ' + Math.round((Date.now() - started) / 1000) + '초\n- ' + log.join('\n- ')
    });
  } catch (e) { /* 기록 실패는 무시 */ }

  return { statusCode: 200, body: JSON.stringify({ ok: true, date: today, log: log }) };
};
