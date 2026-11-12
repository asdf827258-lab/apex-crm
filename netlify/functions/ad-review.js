/* ════════════════════════════════════════════════════════════════════════
   광고 저녁 자가 점검 — 매일 저녁 스스로 보고, 적어 두고, 어제를 돌아본다

   사장님 말씀 2026-11-12:
     「광고관리자를 누구보다 전문적으로 관리하고 효율을 따지고 매일 저녁
       스스로 광고 내용에대해 피드백 하고, 성장하는 광고 시스템」

   ★ 순서가 이 함수의 전부입니다.
     ① 내가 지금 <b>눈이 멀었나</b>  ② 광고가 <b>돌고는 있나</b>
     ③ 그 다음에야 효율            ④ 적어 둔다  ⑤ 어제를 돌아본다

     ①②를 ③보다 앞에 두는 까닭: 2026-11-12 에 재어 보니 광고비가 35일,
     카톡이 20일 멈춰 있었는데 아무도 매일 말해 주지 않았습니다. 그 상태에서
     「문의당 단가」 를 계산하면 <b>멈춘 숫자로 멀쩡한 판단을 지어내는 것</b>
     입니다 (CLAUDE.md 1번). 눈이 멀었으면 그것만 말하고 입을 닫습니다.

   ⑤ 가 없으면 이것은 그냥 보고서입니다. ad_notes 에 어제 판단이 있으면
     먼저 읽고 「부탁한 것이 지켜졌나 · 내가 틀렸나」 를 적습니다. 그래야
     다음 판단이 어제보다 낫습니다 — 그게 「성장」입니다.

   ⚠️ 문지기는 ad-spend.js 와 같은 꼴입니다 (5번 — 두 벌로 두지 않습니다).
      스케줄러가 부르면 통과, 사람이 부르면 CRON_SECRET, 아니면 <b>헛돌기</b>
      (dry) 로 아무것도 안 씁니다.

   ⚠️ 스케줄에 등록된 함수는 HTTP 로 못 부릅니다(403). 그래서 시각은
      ad-review-cron.js 가 받고, 일은 여기서 합니다.

     검사:  node scripts/check-adreview.js   (바깥 서버를 한 번도 안 부릅니다)
   ════════════════════════════════════════════════════════════════════════ */

'use strict';

const AM = require('../../scripts/anthropic-model.js');

const SB_URL = process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AI_KEY = process.env.ANTHROPIC_API_KEY || '';
const SECRET = process.env.CRON_SECRET || '';

/* ── 판단 기준. 숫자를 코드 안에 흩지 않습니다 — 여기 한 곳 (5번) ──
   사장님과 약속된 중단 기준($300·문의 0)은 광고성과 화면과 같은 값입니다. */
const RULE = {
  spendStaleDays: 2,     /* 광고비가 이만큼 밀리면 「눈이 멀었다」 */
  /* 7일 방문이 이 아래면 「광고가 사실상 멈췄다」.
     ★ 왜 100 인가 — 눈대중이 아닙니다. 우리가 가리려는 차이는 카톡율
       1~2% 입니다. 방문이 100명 아래면 <b>한 명이 더 누르는 것만으로 1%가
       움직입니다</b> — 그 수로 「이 소재가 낫다」 고 말하면 동전 던지기를
       판단이라고 부르는 것입니다 (1번).
     ⚠️ 2026-11-12 에 7일 방문이 31명이었는데 처음에 기준을 30 으로 두어
       「돌아감」 이라고 적었습니다. 하루 4명은 광고가 도는 것이 아닙니다. */
  deadVisits7: 100,
  stopSpend: 300,        /* 이만큼 쓰고 문의 0 이면 멈출 때 */
  cpaOk: 60,             /* 문의당 이 아래면 증액 검토 */
  placeMinVisit: 200,    /* 자리 판단에 필요한 최소 방문 */
  placeMinExit: 50,
  readFloorPct: 2,       /* 읽음율이 이 아래면 「아예 안 읽는 자리」 */
  exitBadPct: 60,
  ctaFloorPct: 1
};

const KST = 9 * 3600 * 1000;
function kstToday() { return new Date(Date.now() + KST).toISOString().slice(0, 10); }
function kstAgo(n) { return new Date(Date.now() + KST - n * 86400000).toISOString().slice(0, 10); }
function daysBetween(a, b) {
  return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000);
}
function pct(a, b) { return b ? (100 * a / b) : null; }
function r1(v) { return v == null ? null : Math.round(v * 10) / 10; }

async function sb(path, opts) {
  const r = await fetch(SB_URL + '/rest/v1/' + path, Object.assign({
    headers: {
      apikey: SB_KEY,
      Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    }
  }, opts || {}));
  const t = await r.text();
  if (!r.ok) throw new Error(path.split('?')[0] + ' → ' + r.status + ' ' + t.slice(0, 160));
  return t ? JSON.parse(t) : null;
}

/* ── ① 눈 점검 ────────────────────────────────────────────────────────
   무엇을 못 보는지 먼저 셉니다. 비어 있으면 눈이 밝은 것입니다. */
function blindList(o) {
  const out = [];
  if (!o.spendLast) {
    out.push('광고비가 한 줄도 없습니다 — 메타에서 한 번도 못 받아 왔습니다');
  } else if (daysBetween(o.spendLast, o.today) > RULE.spendStaleDays) {
    out.push('광고비가 ' + o.spendLast + ' 에서 멈췄습니다 (' +
      daysBetween(o.spendLast, o.today) + '일) — META_ADS_TOKEN 이 배포된 함수에 안 닿았습니다');
  }
  if (!o.spendCloudRows) {
    out.push('클라우드가 쓴 광고비 줄이 0 입니다 — 아침 보고가 한 번도 안 돌았습니다');
  }
  if (!o.eventsLast) out.push('랜딩 기록이 한 줄도 없습니다');
  else if (daysBetween(o.eventsLast, o.today) > 2) {
    out.push('랜딩 기록이 ' + o.eventsLast + ' 에서 멈췄습니다 — 랜딩이 발자국을 안 보냅니다');
  }
  if (!o.placeView) out.push('자리별 뷰(ad_v_place)가 아직 없습니다 — migration_74 를 안 돌렸습니다');
  return out;
}

/* ── ② 돌고는 있나 ──────────────────────────────────────────────────── */
function stateOf(f) {
  if (!f.v7 && !f.v21) return '모름';
  if (f.v7 < RULE.deadVisits7) return '멈춤';
  if (f.v21 && f.v7 < f.v21 / 6) return '적음';
  return '돌아감';
}

/* ── ③ 효율. 눈이 멀었으면 아예 안 셉니다 ─────────────────────────────
   순수 함수로 둡니다 — 그래서 점검이 표로 잴 수 있습니다. */
function judge(f, blind, state) {
  const say = [];

  if (blind.length) {
    say.push('🛑 먼저 고칠 것이 있어 효율은 재지 않았습니다. ' +
      '멈춘 숫자로 「문의당 얼마」 를 세면 그 수가 거짓이 됩니다.');
    blind.forEach(b => say.push('· ' + b));
    if (state === '멈춤') {
      say.push('· 그리고 광고 자체가 거의 안 돌고 있습니다 — 7일 방문 ' + f.v7 + '명.');
    }
    return say.join('\n');
  }

  if (state === '멈춤') {
    say.push('⏸ 광고가 사실상 멈춰 있습니다 — 7일 방문 ' + f.v7 + '명(기준 ' + RULE.deadVisits7 + ').');
    say.push('이 수로는 어느 소재가 나은지 가릴 수 없습니다. 켜는 것이 먼저입니다.');
    return say.join('\n');
  }
  if (state === '적음') {
    say.push('⚠️ 들어오는 수가 지난 3주 평균보다 많이 줄었습니다 — 7일 ' + f.v7 +
      '명 / 21일 ' + f.v21 + '명. 예산이나 심의 상태를 먼저 보십시오.');
  }

  /* 중단 기준 — 화면과 같은 값입니다 */
  if (!f.inq && f.spend7 >= RULE.stopSpend) {
    say.push('🛑 멈출 때입니다 — 7일 지출 $' + r1(f.spend7) + ' 에 문의 0건. 약속된 수순입니다.');
  } else if (!f.inq) {
    say.push('⚠️ 아직 문의가 없습니다 — 7일 지출 $' + r1(f.spend7) +
      '. $' + RULE.stopSpend + ' · 문의 0 이 되면 멈추고 고칩니다 (남은 여유 $' +
      r1(Math.max(0, RULE.stopSpend - f.spend7)) + ').');
  } else {
    const cpa = f.spend7 / f.inq;
    say.push((cpa <= RULE.cpaOk ? '✅' : '📊') + ' 문의당 $' + r1(cpa) +
      ' (기준 $' + RULE.cpaOk + ')' + (cpa <= RULE.cpaOk ? ' — 증액을 검토할 수 있습니다.' : ' — 소재를 좁히는 편이 낫습니다.'));
  }

  /* 카톡까지 오나 */
  if (f.v7 && !f.cta7) {
    say.push('· 7일 동안 카톡 클릭이 0 입니다. 방문 ' + f.v7 + '명 중 ' + f.r7 +
      '명이 글을 읽었는데도 0 이면, 글이 아니라 <b>단추</b>를 의심할 자리입니다 — ' +
      '앱 안 브라우저가 카톡으로 못 넘겨 주면 눌러도 아무 일이 안 납니다.');
  }

  /* 자리별 — 병을 둘로 갈라 말합니다 (판 X424 와 같은 기준 · 5번) */
  (f.places || []).forEach(p => {
    if (p.방문 < RULE.placeMinVisit || p.이탈기록 < RULE.placeMinExit) return;
    const rd = pct(p.읽음, p.방문), ct = pct(p.카톡, p.방문), ex = pct(p.즉시이탈, p.이탈기록);
    if (rd < RULE.readFloorPct && ex >= RULE.exitBadPct) {
      say.push('🛑 ' + p.자리이름 + ' — 글을 아예 안 읽습니다(읽음 ' + r1(rd) +
        '% · 3초이탈 ' + Math.round(ex) + '%). 메타에서 자리를 손으로 골라 빼십시오.');
    } else if (rd >= RULE.readFloorPct && ct < RULE.ctaFloorPct) {
      say.push('🤔 ' + p.자리이름 + ' — 읽는데 안 누릅니다(읽음 ' + r1(rd) +
        '% · 카톡 ' + r1(ct) + '%). 폰에서 직접 눌러 카톡이 열리는지 보십시오.');
    }
  });

  return say.join('\n');
}

/* ── ④ 부탁할 것. 지켜졌나를 다음 저녁에 이것으로 봅니다 ───────────── */
function asksOf(blind, f, state) {
  const a = [];
  blind.forEach(b => {
    if (/META_ADS_TOKEN|한 줄도 없/.test(b)) a.push('Netlify 에 META_ADS_TOKEN 넣고 Trigger deploy');
    if (/ad_v_place/.test(b)) a.push('Supabase 에서 migration_74_ad_place.sql 한 번 실행');
    if (/랜딩이 발자국/.test(b)) a.push('랜딩이 살아 있는지 확인');
  });
  if (state === '멈춤') a.push('광고 켜기 — 지금 거의 안 돌고 있습니다');
  if (f.v7 && !f.cta7) a.push('인스타 앱 안에서 랜딩 열어 카톡 단추 눌러 보기(1분)');
  return a.filter((x, i) => a.indexOf(x) === i);
}

/* ── ⑤ 어제를 돌아본다 ──────────────────────────────────────────────── */
function lookBack(prev, f, blind) {
  if (!prev) return '어제 적어 둔 판단이 없습니다 — 오늘이 첫 줄입니다.';
  const out = ['어제(' + prev.d + ') 제가 이렇게 적었습니다.'];
  const was = prev.blind || [];
  const now = blind;
  const fixed = was.filter(b => now.indexOf(b) < 0);
  const still = was.filter(b => now.indexOf(b) >= 0);
  const newly = now.filter(b => was.indexOf(b) < 0);

  (prev.asks || []).forEach(x => out.push('· 부탁: ' + x));
  if (fixed.length) fixed.forEach(b => out.push('✅ 고쳐졌습니다 — ' + b));
  if (still.length) out.push('⏳ 아직 그대로입니다 — ' + still.length + '가지' +
    (still.length ? ' (' + still[0].split(' —')[0] + (still.length > 1 ? ' 외' : '') + ')' : ''));
  if (newly.length) newly.forEach(b => out.push('🆕 새로 막혔습니다 — ' + b));

  /* 내가 틀렸나 — 어제 「멈춤」이라 했는데 오늘 숫자가 살아 있으면 그렇게 적습니다 */
  const pf = prev.facts || {};
  if (prev.state === '멈춤' && f.v7 >= RULE.deadVisits7) {
    out.push('↩ 어제는 멈췄다고 적었지만 오늘 7일 방문이 ' + f.v7 + '명입니다 — 다시 돌기 시작했습니다.');
  }
  if (pf.v7 != null && f.v7 != null && pf.v7 > 0) {
    const ch = Math.round(100 * (f.v7 - pf.v7) / pf.v7);
    if (Math.abs(ch) >= 20) out.push('· 7일 방문이 어제보다 ' + (ch > 0 ? '+' : '') + ch + '%');
  }
  return out.join('\n');
}

/* ── 숫자 모으기 ────────────────────────────────────────────────────── */
async function gather() {
  const today = kstToday();
  const from7 = kstAgo(7), from21 = kstAgo(21);

  const spendRows = await sb('ad_spend?select=d,spend,raw&order=d.desc&limit=400');
  const spendLast = spendRows.length ? spendRows[0].d : null;
  const spendCloudRows = spendRows.filter(x => x.raw != null).length;
  const spend7 = spendRows.filter(x => x.d >= from7).reduce((a, x) => a + Number(x.spend || 0), 0);

  /* 발자국은 수가 많습니다 — 21일만, 필요한 칸만 받습니다 (7번) */
  const ev = await sb('ad_events?select=ts,ev,sid&ts=gte.' + from21 + 'T00:00:00Z&limit=20000');
  const sidsIn = (from, kind) => {
    const s = {};
    ev.forEach(x => {
      if (x.ev !== kind) return;
      const d = new Date(new Date(x.ts).getTime() + KST).toISOString().slice(0, 10);
      if (d >= from) s[x.sid] = 1;
    });
    return Object.keys(s).length;
  };
  const eventsLast = ev.length
    ? ev.map(x => new Date(new Date(x.ts).getTime() + KST).toISOString().slice(0, 10)).sort().slice(-1)[0]
    : null;

  const inqRows = await sb('ad_inquiries?select=id&limit=2000');

  /* 자리별 뷰는 아직 안 세워졌을 수 있습니다 — 없으면 없다고 둡니다 (1번) */
  let places = null, placeView = false;
  try {
    places = await sb('ad_v_place?select=*&d=gte.' + from7 + '&limit=2000');
    placeView = true;
  } catch (e) { places = null; }

  const byPlace = {};
  (places || []).forEach(r => {
    const k = r['자리이름'] || '(모름)';
    const o = byPlace[k] || (byPlace[k] = { 자리이름: k, 방문: 0, 읽음: 0, 카톡: 0, 즉시이탈: 0, 이탈기록: 0 });
    ['방문', '읽음', '카톡', '즉시이탈', '이탈기록'].forEach(f => o[f] += Number(r[f] || 0));
  });

  return {
    today: today,
    spendLast: spendLast, spendCloudRows: spendCloudRows, placeView: placeView,
    eventsLast: eventsLast,
    f: {
      v7: sidsIn(from7, 'view'), r7: sidsIn(from7, 'read25'), cta7: sidsIn(from7, 'cta'),
      v21: sidsIn(from21, 'view'),
      spend7: spend7, inq: inqRows.length,
      places: Object.keys(byPlace).map(k => byPlace[k]).sort((a, b) => b.방문 - a.방문)
    }
  };
}

/* ── 문구 초안 — 심의 전. 없으면 없다고 둡니다 ──────────────────────── */
const COPY_SYSTEM = [
  '당신은 보험 설계사의 광고 문구를 고치는 사람입니다. 한국어로만 답합니다.',
  '규칙(어기면 쓸 수 없는 초안입니다):',
  '· 비과세·세금 혜택을 단정하지 않습니다. 말하려면 「요건 충족 시」 를 반드시 붙입니다.',
  '· 한도·나이·개월 수 같은 시행령 숫자를 적지 않습니다. 개정되면 바뀝니다.',
  '· 보험료·보장은 「심사 결과에 따릅니다」 를 뺴지 않습니다.',
  '· 수익률·원금보장·최고·유일·1위 같은 단정과 비교 표현을 쓰지 않습니다.',
  '· 주어진 숫자 밖의 수치를 새로 만들지 않습니다.',
  'JSON 하나만 답합니다: {"why":"지금 문구가 왜 안 먹히는지 한 문장",',
  '"drafts":[{"head":"제목 한 줄","body":"본문 두 줄 이내","why":"왜 이게 나은지"}]}',
  'drafts 는 셋 이하. 확신이 없으면 빈 배열로 둡니다 — 지어내는 것보다 낫습니다.'
].join('\n');

async function draftCopy(f, state, fetchImpl) {
  /* ★ 「지을 거리가 있나」 를 키보다 먼저 봅니다 — 광고가 안 돌면 어느 문구가
     안 먹히는지 가릴 수 없습니다. 그때 AI 를 부르면 돈만 쓰고 지어낸 글을
     받습니다 (1번 · 7번). 키가 있든 없든 안 짓는 것이 먼저입니다. */
  if (state === '멈춤' || state === '모름') {
    return { draft: null, model: null, why: '광고가 안 돌아 어느 문구가 안 먹히는지 가릴 수 없어 초안을 안 지었습니다' };
  }
  if (!AI_KEY) return { draft: null, model: null, why: 'ANTHROPIC_API_KEY 가 없어 문구 초안은 못 지었습니다' };
  const user = [
    '최근 7일 광고 성적입니다. 이 숫자만 보고 답하십시오.',
    '방문 ' + f.v7 + '명 · 글을 읽은 사람 ' + f.r7 + '명 · 카톡 누른 사람 ' + f.cta7 + '명',
    (f.places || []).slice(0, 5).map(p =>
      '자리 ' + p.자리이름 + ': 방문 ' + p.방문 + ' 읽음 ' + p.읽음 + ' 카톡 ' + p.카톡).join('\n'),
    '상품은 저축·연금성 보험입니다. 고객은 40~60대입니다.'
  ].join('\n');
  try {
    const got = await AM.askClaude(AI_KEY, { system: COPY_SYSTEM, user: user, maxTokens: 1200 }, fetchImpl);
    let j = null;
    const m = (got.text || '').match(/\{[\s\S]*\}/);
    if (m) { try { j = JSON.parse(m[0]); } catch (e) { j = null; } }
    if (!j) return { draft: null, model: got.model, why: 'AI 가 답했지만 꼴이 맞지 않아 버렸습니다 — 지어 적지 않습니다' };
    return { draft: j, model: got.model, why: null };
  } catch (e) {
    return { draft: null, model: null, why: 'AI 를 못 불렀습니다 — ' + String(e.message || e).slice(0, 160) };
  }
}

exports.handler = async function (event) {
  const body = (event && event.body) || '';
  const qs = (event && event.queryStringParameters) || {};
  const h = (event && event.headers) || {};
  const given = h['x-cron-secret'] || h['X-Cron-Secret'] || '';
  const scheduled = body.indexOf('next_run') >= 0;

  let authed = scheduled;
  if (!scheduled && given) {
    if (!SECRET || given !== SECRET) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, reason: '권한 없음 — 열쇠가 다릅니다' }) };
    }
    authed = true;
  }
  const dry = !authed || qs.dry === '1';

  if (!SB_KEY) {
    return { statusCode: 200, body: JSON.stringify({
      ok: false, need: ['SUPABASE_SERVICE_ROLE_KEY'],
      reason: '아무것도 적지 않습니다 — 서버 열쇠가 없습니다' }) };
  }

  try {
    const g = await gather();
    const blind = blindList(g);
    const state = stateOf(g.f);

    let prev = null;
    try {
      const rows = await sb('ad_notes?select=*&d=lt.' + g.today + '&order=d.desc&limit=1');
      prev = rows && rows.length ? rows[0] : null;
    } catch (e) {
      blind.push('판단 기록(ad_notes)이 아직 없습니다 — migration_75 를 안 돌렸습니다');
    }

    const verdict = judge(g.f, blind, state);
    const asks = asksOf(blind, g.f, state);
    const back = lookBack(prev, g.f, blind);
    const cp = await draftCopy(g.f, state, null);

    const row = {
      d: g.today,
      blind: blind,
      state: state,
      facts: g.f,
      verdict: verdict,
      asks: asks,
      looked_back: back,
      copy_draft: cp.draft,
      model: cp.model,
      note: cp.why || null
    };

    if (dry) {
      return { statusCode: 200, body: JSON.stringify({
        ok: true, dry: true, reason: '헛돌기 — 아무것도 적지 않았습니다', row: row }, null, 1) };
    }
    await sb('ad_notes?on_conflict=d', { method: 'POST', body: JSON.stringify([row]) });
    return { statusCode: 200, body: JSON.stringify({ ok: true, d: g.today, state: state,
      blind: blind.length, asks: asks.length, model: cp.model }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, reason: String(e.message || e).slice(0, 300) }) };
  }
};

/* 점검이 규칙만 따로 재도록 내놓습니다 — 바깥 서버를 안 부르고 표로 잴 수 있게 */
exports._rules = { RULE, blindList, stateOf, judge, asksOf, lookBack, COPY_SYSTEM, draftCopy };
