/* 짧은 주소 — 고객에게 카톡으로 보낼 때 쓴다.
 *
 * 왜 필요한가
 *   「한장 보험료 비교」가 만들어 주는 고객 링크는 비교한 자료를 통째로
 *   주소 안(# 뒤)에 담는다. 그래서 <b>수백~수천 글자</b>가 되고, 카톡에
 *   붙이면 한 화면을 덮는다. 고객은 그것을 먼저 본다.
 *
 * 무엇을 맞바꾸는가 — <b>먼저 알고 쓰셔야 한다</b>
 *   원래 그 자료는 # 뒤에 있어 <b>서버로 가지 않는다</b>. 짧게 만들면
 *   그 자료가 <b>우리 서버에 저장</b>된다. 그래서
 *     · 사장님이 「짧게 만들기」를 <b>누르셨을 때만</b> 저장한다
 *     · 이름·연락처는 애초에 그 주소에 없다(나이·성별·담보·보험료뿐)
 *     · 90일이 지나면 <b>스스로 만료</b>된다
 *     · 원문 주소는 그대로 두고, 짧은 주소는 <b>덤</b>이다
 *
 * 쓰는 법
 *   POST /.netlify/functions/shortlink   {url:'...'}  → {code:'AB12CD', short:'...'}
 *   GET  /s/AB12CD                        → 그 주소로 보내는 작은 쪽지 한 장
 *
 * 표가 없으면 <b>표가 없다고 말한다.</b> 만든 척하지 않는다.
 */
const SB_URL = process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SHARED_TOKEN = process.env.SHARED_TOKEN || '';

const TABLE = 'short_links';
const DAYS = 90;
const MAX_URL = 60000;   /* 비교 자료가 통째로 들어와도 받을 만큼 */

/* 헷갈리는 글자(0/O, 1/I/l)를 뺀다 — 고객이 눈으로 옮겨 적을 수도 있다 */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function makeCode(n) {
  let s = '';
  for (let i = 0; i < n; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
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
  return { ok: r.ok, status: r.status, text: t, json: (() => { try { return JSON.parse(t); } catch (e) { return null; } })() };
}

const JSON_HEAD = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' };

function esc(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* 보낼 곳이 <b>우리가 아는 주소</b>인지 본다 — 아무 데나 보내는 발판이 되면 안 된다 */
function allowed(u) {
  let h;
  try { h = new URL(u); } catch (e) { return false; }
  if (h.protocol !== 'https:') return false;
  return /(^|\.)netlify\.app$/.test(h.hostname) || /(^|\.)apex-?os/.test(h.hostname);
}

function page(title, body, go) {
  return '<!doctype html><html lang="ko"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex,nofollow"><title>' + esc(title) + '</title>' +
    '<style>html,body{margin:0;height:100%;background:#F2F4F6;' +
    "font-family:-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif;color:#191F28}" +
    '.w{min-height:100%;display:flex;align-items:center;justify-content:center;padding:24px}' +
    '.c{max-width:420px;text-align:center}' +
    '.c h1{font-size:19px;font-weight:800;letter-spacing:-.03em;margin:0 0 8px}' +
    '.c p{font-size:14px;color:#6B7684;line-height:1.7;margin:0}' +
    '.c a{display:inline-block;margin-top:16px;background:#3182F6;color:#fff;text-decoration:none;' +
    'font-size:14px;font-weight:800;border-radius:12px;padding:12px 20px}</style></head>' +
    '<body><div class="w"><div class="c">' + body + '</div></div>' +
    (go ? ('<script>location.replace(' + JSON.stringify(go) + ')</script>') : '') +
    '</body></html>';
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS')
    return { statusCode: 204, headers: Object.assign({}, JSON_HEAD, {
      'Access-Control-Allow-Headers': 'Content-Type, X-App-Token',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }) };

  /* ── 열기 ── */
  if (event.httpMethod === 'GET') {
    const code = ((event.queryStringParameters || {}).c || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
    const H = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' };
    if (!code) return { statusCode: 400, headers: H, body: page('주소가 없습니다',
      '<h1>주소가 비어 있습니다</h1><p>보내 드린 링크를 다시 눌러 주세요.</p>') };
    if (!SB_KEY) return { statusCode: 503, headers: H, body: page('아직 준비되지 않았습니다',
      '<h1>아직 준비되지 않았습니다</h1><p>담당 설계사에게 <b>원래 주소</b>로 다시 보내 달라고 말씀해 주세요.</p>') };
    const r = await sb(TABLE + '?code=eq.' + encodeURIComponent(code) + '&select=url,expires_at&limit=1');
    if (!r.ok || !r.json || !r.json.length)
      return { statusCode: 404, headers: H, body: page('찾을 수 없습니다',
        '<h1>이 링크를 찾을 수 없습니다</h1><p>주소가 잘못되었거나 이미 만료되었습니다. 담당 설계사에게 다시 요청해 주세요.</p>') };
    const row = r.json[0];
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now())
      return { statusCode: 410, headers: H, body: page('기간이 지났습니다',
        '<h1>이 링크는 기간이 지났습니다</h1><p>보험료는 시간이 지나면 바뀌기 때문에 <b>' + DAYS + '일</b>이 지나면 자동으로 닫힙니다. 담당 설계사에게 새로 요청해 주세요.</p>') };
    return { statusCode: 200, headers: H, body: page('여는 중입니다',
      '<h1>보험료 비교를 여는 중입니다</h1><p>잠시만 기다려 주세요.</p>' +
      '<a href="' + esc(row.url) + '">안 열리면 여기를 눌러 주세요</a>', row.url) };
  }

  if (event.httpMethod !== 'POST')
    return { statusCode: 405, headers: JSON_HEAD, body: JSON.stringify({ ok: false, reason: 'GET 또는 POST 만 됩니다' }) };

  /* ── 만들기 ── */
  if (SHARED_TOKEN) {
    const t = (event.headers || {})['x-app-token'] || (event.headers || {})['X-App-Token'];
    if (t !== SHARED_TOKEN)
      return { statusCode: 401, headers: JSON_HEAD, body: JSON.stringify({ ok: false, reason: '공유 토큰이 맞지 않습니다' }) };
  }
  if (!SB_KEY)
    return { statusCode: 503, headers: JSON_HEAD, body: JSON.stringify({
      ok: false, code: 'no_key',
      reason: 'SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다 — 짧은 주소를 만들 수 없습니다.' }) };

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) {}
  const url = String(body.url || '').trim();
  if (!url)
    return { statusCode: 400, headers: JSON_HEAD, body: JSON.stringify({ ok: false, reason: '주소가 비어 있습니다' }) };
  if (url.length > MAX_URL)
    return { statusCode: 413, headers: JSON_HEAD, body: JSON.stringify({ ok: false, reason: '주소가 너무 깁니다' }) };
  if (!allowed(url))
    return { statusCode: 400, headers: JSON_HEAD, body: JSON.stringify({
      ok: false, reason: '우리가 아는 주소가 아닙니다 — 한장 보험료 비교에서 만든 고객 링크만 줄일 수 있습니다.' }) };

  const expires = new Date(Date.now() + DAYS * 86400000).toISOString();
  /* 같은 글자가 겹칠 수 있으니 몇 번 다시 뽑아 본다 */
  let last = null;
  for (let i = 0; i < 5; i++) {
    const code = makeCode(6);
    const r = await sb(TABLE, { method: 'POST', body: JSON.stringify({ code: code, url: url, expires_at: expires }) });
    if (r.ok && r.json && r.json.length)
      return { statusCode: 200, headers: JSON_HEAD, body: JSON.stringify({ ok: true, code: code, days: DAYS, expires_at: expires }) };
    last = r;
    /* 표 자체가 없으면 다시 뽑아도 소용없다 — 바로 말한다 */
    if (r.status === 404 || /relation .* does not exist|Could not find the table/i.test(r.text || ''))
      return { statusCode: 503, headers: JSON_HEAD, body: JSON.stringify({
        ok: false, code: 'no_table',
        reason: '서버에 short_links 표가 아직 없습니다. sql/short_links.sql 을 한 번만 실행해 주세요.' }) };
  }
  return { statusCode: 500, headers: JSON_HEAD, body: JSON.stringify({
    ok: false, reason: '짧은 주소를 만들지 못했습니다 — ' + ((last && last.text) || '').slice(0, 160) }) };
};
