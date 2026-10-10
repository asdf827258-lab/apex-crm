/* 광고비를 서버가 받아 올 때 <b>숫자를 지어내지 않나</b>.

   ad-spend.js 의 값은 전부 「문지기 넷」 에 있습니다. 문지기는 재 보지
   않으면 문지기가 아닙니다(8번). 그래서 이 자는 함수를 <b>실제로 불러</b>
   봅니다 — fetch 를 갈아 끼워 메타와 Supabase 를 흉내 내고, 그때 함수가
   무엇을 적으려 하는지 들여다봅니다.

     [1] 토큰이 없으면 <b>한 줄도 안 쓰나</b> (1번)
         0 을 적으면 화면이 「안 썼다」 로 읽어 $300·$500 판정이 틀립니다.
         서버를 아예 안 부르는지까지 봅니다.
     [2] 계정 통화가 USD 가 아니면 <b>한 줄도 안 쓰나</b> (4번)
         화면은 $ 를 붙여 찍습니다. 원화를 넣으면 1,300배 틀립니다.
     [3] 소재 번호를 <b>대장에 있는 것만</b> 받나 (1번)
         못 찾으면 빈 칸이어야 합니다. 지어 넣으면 소재별 표가 조용히
         틀립니다. 네 자리가 둘 걸려 애매할 때도 빈 칸이어야 합니다.
     [4] upsert 열쇠가 <b>적어 둔 unique 와 글자까지 같나</b> (5번)
         어긋나면 같은 날 같은 소재가 두 줄로 쌓입니다(5-1번).
     [5] 예약은 <b>-cron 껍데기</b>에 걸려 있고 본체에는 안 걸렸나
         Netlify 는 예약 등록한 함수를 HTTP 로 못 부르게 막습니다(403).
         이 저장소가 ai-daily·push 에서 두 번 겪은 자리입니다.
     [6] 껍데기가 <b>일을 또 안 적나</b> (5번)

   ⚠ 실제 메타·Supabase 로는 한 번도 안 나갑니다. fetch 를 갈아 끼우고,
     나가려 한 주소를 모아 둡니다 — 진짜 서버를 찌르는 점검은 두지 않습니다. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const FN = path.join(ROOT, 'netlify/functions/ad-spend.js');
const CRON = path.join(ROOT, 'netlify/functions/ad-spend-cron.js');
const TOML = path.join(ROOT, 'netlify.toml');

let bad = [], pass = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { bad.push(m); console.log('  ✗ ' + m); } };

/* ── 함수를 새로 불러온다. env 를 머리에서 읽으므로 캐시를 비운다 ─────── */
function load(env) {
  ['META_ADS_TOKEN', 'META_AD_ACCOUNT_ID', 'SUPABASE_SERVICE_ROLE_KEY',
   'SUPABASE_URL', 'META_API_VER', 'CRON_SECRET'].forEach(k => { delete process.env[k]; });
  Object.keys(env || {}).forEach(k => { process.env[k] = env[k]; });
  delete require.cache[require.resolve(FN)];
  return require(FN).handler;
}

/* 메타·Supabase 흉내 — 나간 주소와 보낸 몸통을 모은다 */
function stub(cfg) {
  const seen = { urls: [], posted: [] };
  global.fetch = async (url, opts) => {
    const u = String(url);
    seen.urls.push(u);
    const o = opts || {};
    const J = (obj, okFlag) => ({
      ok: okFlag !== false, status: okFlag === false ? 400 : 200,
      json: async () => obj, text: async () => JSON.stringify(obj)
    });
    if (u.indexOf('graph.facebook.com') >= 0) {
      if (u.indexOf('/insights') >= 0) return J({ data: cfg.insights || [] });
      return J(cfg.account || { currency: 'USD', timezone_name: 'Asia/Seoul', name: '시험계정' });
    }
    if (u.indexOf('/rest/v1/ad_creatives') >= 0) return J((cfg.codes || []).map(c => ({ code: c })));
    if (u.indexOf('/rest/v1/ad_links') >= 0) return J([]);
    if (u.indexOf('/rest/v1/ad_spend') >= 0) {
      if ((o.method || 'GET') === 'POST') {
        seen.posted.push({ url: u, rows: JSON.parse(o.body || '[]') });
        return J([]);
      }
      return J([]);
    }
    return J({});
  };
  return seen;
}
const realFetch = global.fetch;
const EV = { body: '{"next_run":"2026-10-11T00:50:00Z"}', headers: {}, queryStringParameters: null };
const call = async (h) => JSON.parse((await h(EV)).body);

(async () => {
  /* ── [1] 토큰이 없으면 한 줄도 안 쓴다 ───────────────────────────── */
  console.log('\n[1] 토큰이 없으면 한 줄도 안 쓰나 (1번)');
  {
    const h = load({ SUPABASE_SERVICE_ROLE_KEY: 'x' });
    const seen = stub({});
    const r = await call(h);
    ok(r.ok === false, '됐다고 하지 않는다 (ok=false)');
    ok(Array.isArray(r.need) && r.need.indexOf('META_ADS_TOKEN') >= 0,
      '무엇이 없는지 이름으로 말한다' + (r.need ? (' — ' + r.need.join(' · ')) : ''));
    ok(/아무 숫자도 만들지 않습니다/.test(r.reason || ''),
      '「아무 숫자도 만들지 않습니다」 라고 적는다');
    ok(seen.posted.length === 0 && seen.urls.length === 0,
      '서버를 한 번도 안 부른다 (나간 주소 ' + seen.urls.length + '개)');
  }

  /* ── [2] 통화가 USD 가 아니면 한 줄도 안 쓴다 ────────────────────── */
  console.log('\n[2] 계정 통화가 USD 가 아니면 한 줄도 안 쓰나 (4번)');
  {
    const h = load({ SUPABASE_SERVICE_ROLE_KEY: 'x', META_ADS_TOKEN: 't', META_AD_ACCOUNT_ID: '123' });
    const seen = stub({
      account: { currency: 'KRW', timezone_name: 'Asia/Seoul', name: '원화계정' },
      codes: ['1525'],
      insights: [{ date_start: '2026-10-09', campaign_name: 'C', adset_name: 'A', ad_name: '1525 가', impressions: '10', clicks: '1', reach: '9', spend: '12345' }]
    });
    const r = await call(h);
    ok(r.ok === false, '됐다고 하지 않는다');
    ok(/KRW/.test(r.reason || '') && /\$/.test(r.reason || ''), '통화가 무엇이고 왜 안 되는지 말한다');
    ok(seen.posted.length === 0, 'ad_spend 에 한 줄도 안 보낸다 (보낸 묶음 ' + seen.posted.length + '개)');
    ok(!/환율.*1[,.]?3/.test(r.reason || '') && /정해 주시면/.test(r.reason || ''),
      '환율을 제 손으로 지어 쓰지 않고 사장님께 묻는다 (1번)');
  }

  /* ── [3] 소재 번호는 대장에 있는 것만 ───────────────────────────── */
  console.log('\n[3] 소재 번호를 대장에 있는 것만 받나 (1번)');
  {
    const h = load({ SUPABASE_SERVICE_ROLE_KEY: 'x', META_ADS_TOKEN: 't', META_AD_ACCOUNT_ID: 'act_123' });
    const seen = stub({
      codes: ['1525', '1528'],
      insights: [
        { date_start: '2026-10-09', campaign_name: 'C', adset_name: 'A', ad_name: '1525 아는번호', impressions: '10', clicks: '1', reach: '9', spend: '1.5' },
        { date_start: '2026-10-09', campaign_name: 'C', adset_name: 'A', ad_name: '9999 모르는번호', impressions: '20', clicks: '2', reach: '19', spend: '2.5' },
        { date_start: '2026-10-09', campaign_name: 'C', adset_name: 'B', ad_name: '1525 와 1528 둘다', impressions: '30', clicks: '3', reach: '29', spend: '3.5' }
      ]
    });
    const r = await call(h);
    ok(r.ok === true, '쓸 것은 쓴다 (ok=true)');
    const rows = [].concat(...seen.posted.map(p => p.rows));
    const get = (ad, as) => rows.find(x => x.adset === as && x.creative_code === ad);
    ok(!!get('1525', 'A'), '대장에 있는 번호는 그대로 적는다 (1525)');
    const unk = rows.find(x => x.adset === 'A' && x.creative_code === '');
    ok(!!unk, '대장에 없는 9999 는 <b>빈 칸</b>으로 둔다 — 지어 넣지 않는다');
    ok(rows.every(x => x.creative_code !== '9999'), '9999 가 어디에도 안 적힌다');
    const amb = get('', 'B');
    ok(!!amb, '네 자리가 둘 걸려 애매하면 빈 칸으로 둔다');
    ok(Array.isArray(r.unknown) && r.unknown.some(s => /9999/.test(s)),
      '못 찾은 광고 이름을 알려 준다 (빠뜨린 줄 알게 되지 않도록)');
    ok(rows.every(x => x.source === 'meta_api'), 'source 를 컴퓨터 쪽과 같은 meta_api 로 둔다 (5번)');
    ok(rows.every(x => x.medium === 'meta'), 'medium 은 meta');
  }

  /* ── [4] upsert 열쇠가 적어 둔 unique 와 같은가 ──────────────────── */
  console.log('\n[4] upsert 열쇠가 적어 둔 unique 와 글자까지 같나 (5번)');
  {
    const h = load({ SUPABASE_SERVICE_ROLE_KEY: 'x', META_ADS_TOKEN: 't', META_AD_ACCOUNT_ID: '1' });
    const seen = stub({
      codes: ['1525'],
      insights: [{ date_start: '2026-10-09', campaign_name: 'C', adset_name: 'A', ad_name: '1525', impressions: '1', clicks: '1', reach: '1', spend: '1' }]
    });
    await call(h);
    const url = (seen.posted[0] || {}).url || '';
    const m = url.match(/on_conflict=([^&]+)/);
    ok(!!m, 'on_conflict 로 보낸다 (안 쓰면 같은 날이 또 쌓입니다)');
    const sent = m ? decodeURIComponent(m[1]).split(',').map(s => s.trim()) : [];
    const sql = fs.readFileSync(path.join(ROOT, 'migration_54_ad.sql'), 'utf8');
    const u = sql.match(/constraint ad_spend_uniq unique \(([^)]+)\)/i);
    ok(!!u, 'migration_54_ad.sql 에서 ad_spend_uniq 를 찾았다');
    const want = u ? u[1].split(',').map(s => s.trim()) : [];
    ok(want.length > 0 && sent.join(',') === want.join(','),
      '열쇠가 같다 — 보냄 [' + sent.join(',') + '] · 적힘 [' + want.join(',') + ']');
  }

  /* ── [5][6] 예약은 껍데기에, 일은 본체에 ────────────────────────── */
  console.log('\n[5] 예약은 -cron 껍데기에 걸려 있나 (Netlify 403 함정)');
  const toml = fs.readFileSync(TOML, 'utf8');
  ok(/\[functions\."ad-spend-cron"\]\s*\n\s*schedule\s*=/.test(toml),
    'ad-spend-cron 에 schedule 이 걸려 있다');
  ok(!/\[functions\."ad-spend"\]\s*\n\s*schedule\s*=/.test(toml),
    'ad-spend(본체)에는 schedule 이 안 걸려 있다 — 걸면 사람이 못 부릅니다(403)');
  const cronSrc = fs.readFileSync(CRON, 'utf8');
  console.log('\n[6] 껍데기가 일을 또 안 적나 (5번)');
  ok(/require\(['"]\.\/ad-spend\.js['"]\)\.handler/.test(cronSrc),
    '껍데기는 본체의 handler 를 그대로 가리킨다');
  const codeLines = cronSrc.split('\n')
    .filter(l => l.trim() && !/^\s*(\/\*|\*|\/\/)/.test(l.trim()) && l.indexOf('*/') < 0);
  ok(codeLines.length === 1, '껍데기에 코드가 한 줄뿐이다 (지금 ' + codeLines.length + '줄)');

  global.fetch = realFetch;
  console.log('\n──────────────────────────────');
  if (bad.length) {
    console.log('광고비 받기 점검 실패 — ' + bad.length + '가지 어긋납니다 (통과 ' + pass + ').');
    process.exit(1);
  }
  console.log('광고비 받기 점검 통과 — 숫자를 지어내지 않습니다 (' + pass + '가지).');
})().catch(e => { console.log('\n✗ 점검 자체가 터졌습니다 — ' + (e && e.stack || e)); process.exit(1); });
