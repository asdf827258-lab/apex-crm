/* ════════════════════════════════════════════════════════════════════════
   광고비를 서버가 스스로 받아 온다 — 「아침 10시 보고」 의 숫자 쪽

   2026-10-09 까지 이 일은 <b>사장님 컴퓨터</b>의 재출발/보고 스크립트가
   했습니다. 그래서 <b>컴퓨터가 꺼지면 숫자가 안 자랍니다.</b> 실제로
   ad_spend 가 2026-10-08 에서 멈춰 있었고, 폰으로 광고성과.html 을 열면
   어제 숫자가 그대로 서 있었습니다. 그 한 자리를 서버로 옮깁니다.

   (netlify.toml 의 schedule 로 매일 KST 09:50 = UTC 00:50 실행 —
    사장님이 10시에 보실 때 이미 채워져 있도록 10분 앞에 돕니다.)

   하는 일은 하나뿐입니다 — 메타에 물어 ad_spend 에 upsert.
   보고 글을 쓰지도, 알람을 보내지도 않습니다. 사장님은 화면을 보십니다.

   ── 지어내지 않기 위해 둔 문지기 넷 (CLAUDE.md 1번) ───────────────────

   ① <b>토큰이 없으면 한 줄도 안 씁니다.</b> 「0」 을 쓰면 화면은
      「안 썼다」 로 읽고 판정($300·$500)이 틀립니다. 모름과 0 은 다릅니다.
   ② <b>계정 통화가 USD 가 아니면 한 줄도 안 씁니다.</b> 화면은 금액에
      <b>$</b> 를 붙여 찍습니다. 원화를 그 칸에 넣으면 그 자리에서
      1,300배 틀립니다 — 이름이 거짓말하게 두지 않습니다(4번).
   ③ <b>소재 번호는 대장에 있는 것만 받습니다.</b> 메타 광고 이름에서 네
      자리를 뽑되, 그 번호가 ad_creatives·ad_links 에 <b>실제로 있을 때만</b>
      씁니다. 없으면 지어 넣지 않고 빈 칸으로 두어 화면에 「(출처 모름)」
      으로 세우고, 어떤 광고 이름이었는지 로그에 남깁니다. 잘못 뽑은 번호가
      그럴듯하게 들어가면 소재별 표가 <b>조용히</b> 틀립니다.
   ④ <b>같은 날 같은 소재를 두 번 쌓지 않습니다.</b> ad_spend_uniq
      (d·medium·campaign·adset·creative_code) 위로 upsert 합니다 —
      며칠을 다시 받아도 덮어쓰기만 됩니다(5-1번). 그래서 기본 7일을
      다시 받아 <b>빠진 날이 저절로 메워집니다.</b>

   ★ 적는 자리는 migration_54_ad.sql 에 적혀 있습니다. 칸 이름을 여기서
     짐작하지 않았습니다 — 그 파일이 살아 있는 DB 에서 받아 적은 것입니다.

   ★ raw 에 메타 응답을 그대로 담습니다. 컴퓨터 쪽 스크립트는 raw 를
     비워 두므로, <b>raw 가 있으면 이 함수가 넣은 줄</b>입니다. source 는
     양쪽 다 'meta_api' 로 둡니다 — 그 칸은 「어디서 돌았나」 가 아니라
     「무슨 자료인가」 를 말하는 칸이라 새 낱말을 만들지 않습니다(5번).

   필요한 환경변수 (Netlify → Site configuration → Environment variables):
     META_ADS_TOKEN             (필수) 메타 마케팅 API 토큰
     META_AD_ACCOUNT_ID         (필수) 광고 계정 — act_ 가 있어도 없어도 됩니다
     SUPABASE_SERVICE_ROLE_KEY  (필수)
     SUPABASE_URL               (선택)
     META_API_VER               (선택) 기본 v23.0 — 메타가 버전을 올리면
                                이것만 바꿉니다. 코드를 안 고칩니다.
     CRON_SECRET                (선택) 사람이 주소로 부를 때의 열쇠
   ════════════════════════════════════════════════════════════════════════ */

const SB_URL = process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TOKEN  = process.env.META_ADS_TOKEN || '';
const ACCT   = process.env.META_AD_ACCOUNT_ID || '';
const VER    = process.env.META_API_VER || 'v23.0';
const SECRET = process.env.CRON_SECRET || '';

const DAYS_DEFAULT = 7;
const DAYS_MAX = 30;

/* 메타 계정 통화가 이것일 때만 적는다 — 화면이 $ 로 찍기 때문이다 */
const CURRENCY_OK = 'USD';

function kstAgo(n) {
  return new Date(Date.now() + 9 * 3600 * 1000 - n * 86400000).toISOString().slice(0, 10);
}
function num(v) { const n = parseFloat(v); return isFinite(n) ? n : 0; }

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

async function graph(path, params) {
  const q = new URLSearchParams(Object.assign({ access_token: TOKEN }, params || {}));
  const r = await fetch('https://graph.facebook.com/' + VER + '/' + path + '?' + q.toString());
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || j.error) {
    /* 메타가 하는 말을 그대로 올린다 — 버전이 낡았으면 그쪽이 알려 준다 */
    const m = (j && j.error && (j.error.message || j.error.type)) || ('HTTP ' + r.status);
    throw new Error('메타 ' + path.split('/').pop() + ': ' + String(m).slice(0, 200));
  }
  return j;
}

/* act_ 접두사를 사장님이 넣으셨든 안 넣으셨든 같게 만든다 */
function acctId() {
  const s = String(ACCT).trim();
  return /^act_/.test(s) ? s : ('act_' + s);
}

/* ── 소재 번호 뽑기 — 대장에 있는 번호만 받는다 (문지기 ③) ────────────
   메타 광고 이름 어디에 번호가 있는지는 계정마다 다릅니다. 그래서
   <b>이름에서 네 자리를 다 뽑아 보고, 대장에 있는 것 하나만</b> 고릅니다.
   둘 이상 걸리거나 하나도 없으면 <b>빈 칸</b>으로 둡니다 — 지어내지
   않습니다. 규칙을 고칠 자리는 이 함수 하나뿐입니다(5번).            */
function pickCode(adName, known) {
  const hits = String(adName || '').match(/\d{4}/g) || [];
  const ok = [];
  hits.forEach(h => { if (known.has(h) && ok.indexOf(h) < 0) ok.push(h); });
  return ok.length === 1 ? ok[0] : '';
}

exports.handler = async (event) => {
  const started = Date.now();
  const log = [];

  if (!SB_KEY) {
    return { statusCode: 200, body: JSON.stringify({
      ok: false, reason: 'SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.' }) };
  }

  /* 예약 실행이 아니라 사람이 주소로 부른 경우엔 열쇠를 확인한다
     (night-work.js 와 같은 규칙) */
  const body = (event && event.body) || '';
  const scheduled = body.indexOf('next_run') >= 0;
  if (!scheduled && SECRET) {
    const h = (event && event.headers) || {};
    const given = h['x-cron-secret'] || h['X-Cron-Secret'] || '';
    if (given !== SECRET) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, reason: '권한 없음' }) };
    }
  }

  /* ── 문지기 ① 토큰이 없으면 아무 숫자도 만들지 않는다 ──────────────── */
  if (!TOKEN || !ACCT) {
    const need = [];
    if (!TOKEN) need.push('META_ADS_TOKEN');
    if (!ACCT) need.push('META_AD_ACCOUNT_ID');
    return { statusCode: 200, body: JSON.stringify({
      ok: false,
      need: need,
      reason: '아무 숫자도 만들지 않습니다 — ' + need.join(' · ') + ' 가 없습니다. ' +
              'Netlify → Site configuration → Environment variables 에 넣으면 ' +
              '다음 배포부터 읽습니다. (0 을 적으면 화면이 「안 썼다」 로 읽어 ' +
              '$300·$500 판정이 틀립니다)'
    }) };
  }

  const days = Math.min(DAYS_MAX, Math.max(1,
    parseInt((event && event.queryStringParameters && event.queryStringParameters.days) || DAYS_DEFAULT, 10) || DAYS_DEFAULT));
  const since = kstAgo(days);
  const until = kstAgo(0);

  try {
    /* ── 문지기 ② 통화 확인 — 화면이 $ 로 찍는다 ────────────────────── */
    const acc = await graph(acctId(), { fields: 'currency,timezone_name,name' });
    if (acc.currency !== CURRENCY_OK) {
      return { statusCode: 200, body: JSON.stringify({
        ok: false,
        reason: '한 줄도 쓰지 않았습니다 — 계정 통화가 ' + acc.currency + ' 입니다. ' +
                '화면은 금액에 $ 를 붙여 찍으므로 이대로 넣으면 그 자리에서 틀립니다. ' +
                '환산 규칙을 정해 주시면 그대로 넣겠습니다(어떤 날 환율로 바꿀지가 ' +
                '정해져야 합니다 — 제가 고를 일이 아닙니다).'
      }) };
    }
    log.push('계정 ' + (acc.name || acctId()) + ' · ' + acc.currency + ' · ' + (acc.timezone_name || '시간대 모름'));
    if (acc.timezone_name && acc.timezone_name !== 'Asia/Seoul') {
      log.push('⚠ 계정 시간대가 Asia/Seoul 이 아닙니다 — 하루 경계가 화면(서울 기준)과 어긋날 수 있습니다');
    }

    /* 대장에 있는 소재 번호를 모은다 (문지기 ③ 의 재료) */
    const known = new Set();
    const cre = await sb('ad_creatives?select=code');
    (cre || []).forEach(r => { if (r.code) known.add(String(r.code)); });
    const lnk = await sb('ad_links?select=creative_code');
    (lnk || []).forEach(r => { if (r.creative_code) known.add(String(r.creative_code)); });
    log.push('대장에 있는 소재 번호 ' + known.size + '개');
    if (!known.size) {
      return { statusCode: 200, body: JSON.stringify({
        ok: false, log: log,
        reason: '한 줄도 쓰지 않았습니다 — 소재 대장(ad_creatives·ad_links)이 비어 있어 ' +
                '메타 광고를 어느 소재로 적어야 할지 확인할 길이 없습니다.'
      }) };
    }

    /* ── 메타에서 하루 × 광고 단위로 받는다 ──────────────────────────── */
    let rows = [], pages = 0;
    let next = null;
    let j = await graph(acctId() + '/insights', {
      level: 'ad',
      fields: 'date_start,campaign_name,adset_name,ad_name,ad_id,impressions,clicks,reach,spend',
      time_increment: '1',
      time_range: JSON.stringify({ since: since, until: until }),
      limit: '500'
    });
    while (true) {
      pages++;
      rows = rows.concat(j.data || []);
      next = j.paging && j.paging.next;
      if (!next || pages >= 20) break;
      const r = await fetch(next);
      const nj = await r.json().catch(() => null);
      if (!r.ok || !nj || nj.error) break;
      j = nj;
    }
    log.push(since + '~' + until + ' · 메타 ' + rows.length + '줄 (' + pages + '쪽)');

    if (!rows.length) {
      log.push('받은 줄이 없습니다 — 그 기간에 집행이 없었거나 계정이 꺼져 있었습니다. 아무 것도 쓰지 않았습니다.');
      return { statusCode: 200, body: JSON.stringify({ ok: true, wrote: 0, log: log }) };
    }

    /* ── ad_spend 로 옮긴다 ─────────────────────────────────────────── */
    const unknown = [];
    const out = rows.map(x => {
      const code = pickCode(x.ad_name, known);
      if (!code) unknown.push(String(x.ad_name || '(이름 없음)'));
      return {
        d: x.date_start,
        medium: 'meta',
        campaign: x.campaign_name || '',
        adset: x.adset_name || '',
        creative_code: code,
        impressions: Math.round(num(x.impressions)),
        clicks: Math.round(num(x.clicks)),
        reach: x.reach == null ? null : Math.round(num(x.reach)),
        spend: num(x.spend),
        source: 'meta_api',
        raw: x
      };
    });

    /* 같은 열쇠(d·medium·campaign·adset·creative_code)가 한 묶음에 두 번
       있으면 Postgres 가 거부합니다 — 번호를 못 뽑아 빈 칸이 된 광고가
       여럿이면 실제로 겹칩니다. 그래서 보내기 전에 합칩니다(5-1번). */
    const byKey = new Map();
    out.forEach(r => {
      const k = [r.d, r.medium, r.campaign, r.adset, r.creative_code].join('\u0001');
      const p = byKey.get(k);
      if (!p) { byKey.set(k, r); return; }
      p.impressions += r.impressions;
      p.clicks += r.clicks;
      p.reach = (p.reach == null && r.reach == null) ? null : num(p.reach) + num(r.reach);
      p.spend = Math.round((p.spend + r.spend) * 1e6) / 1e6;
      p.raw = [].concat(p.raw, r.raw);
    });
    const merged = [...byKey.values()];
    if (merged.length !== out.length) {
      log.push('열쇠가 겹친 ' + (out.length - merged.length) + '줄을 합쳤습니다(번호를 못 뽑은 광고들)');
    }

    /* 쪼개 보낸다 — 한 번에 너무 많으면 요청이 길어진다 */
    let wrote = 0;
    for (let i = 0; i < merged.length; i += 100) {
      const chunk = merged.slice(i, i + 100);
      await sb('ad_spend?on_conflict=d,medium,campaign,adset,creative_code',
        { method: 'POST', body: JSON.stringify(chunk) });
      wrote += chunk.length;
    }
    log.push('ad_spend ' + wrote + '줄 upsert');

    if (unknown.length) {
      const uniq = [...new Set(unknown)];
      log.push('⚠ 소재 번호를 대장에서 못 찾은 광고 ' + uniq.length + '가지 — 빈 칸으로 두었습니다(화면에 「(출처 모름)」). ' +
               '이름: ' + uniq.slice(0, 8).join(' / '));
    }

    const sum = merged.reduce((a, r) => a + r.spend, 0);
    log.push('기간 지출 합계 $' + (Math.round(sum * 100) / 100));
    log.push('소요 ' + Math.round((Date.now() - started) / 1000) + '초');

    return { statusCode: 200, body: JSON.stringify({
      ok: true, since: since, until: until, wrote: wrote,
      unknown: [...new Set(unknown)], log: log }) };

  } catch (e) {
    log.push('실패: ' + String(e.message || e).slice(0, 200));
    /* 터져도 숫자를 지어내지 않습니다 — 쓴 것이 없으면 없다고 말합니다 */
    return { statusCode: 200, body: JSON.stringify({ ok: false, log: log }) };
  }
};
