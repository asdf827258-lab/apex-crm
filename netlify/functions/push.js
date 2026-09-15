/* ══ 폰 알람 보내기 — <b>앱이 닫혀 있어도 아침에 울린다</b> ═══════════
 *
 * 앱(app/index.html 의 alm*)이 「이 폰에 보내 주세요」 하고 주소를
 * push_subs 에 담아 둡니다. 여기서는 정한 시각에 그 주소로 보냅니다.
 *
 * ★ <b>여기서 오늘 할 일을 세지 않습니다</b> (5번).
 *   세려면 TDO 표(어느 상태를 며칠 만에 다시 볼지)를 서버에도 <b>또</b>
 *   적어야 합니다. 그러면 사장님이 앱에서 기준을 고치셨을 때 알람만
 *   옛 기준으로 말하게 됩니다 — <b>화면과 알람이 다른 말</b>을 합니다.
 *   그래서 여기서는 「확인할 시간입니다」 까지만 하고, 건수는 앱을 열면
 *   그 자리에서 셉니다. <b>지어낸 숫자보다 없는 숫자가 낫습니다</b> (1번).
 *
 * ★ <b>고객 이름이 여기 오지 않습니다</b> (3번). 알람 글에는 이름도 번호도
 *   없습니다. 알람은 애플·구글 서버를 거쳐 가고, 잠금화면은 남이 봅니다.
 *
 * ★ <b>열쇠는 환경변수에만</b> 둡니다 (10번) — VAPID_PUBLIC · VAPID_PRIVATE ·
 *   VAPID_SUBJECT. 코드에 적지 않습니다. 없으면 <b>없다고 대답</b>하고
 *   앱 화면이 그대로 적습니다.
 *
 * ★ 죽은 주소(404·410)는 <b>그 자리에서 지웁니다</b>. 안 지우면 매시간
 *   없는 폰에 계속 두드립니다 (7번).
 *
 * 쓰는 법
 *   GET  ?key=1                → {key, why}   앱이 구독할 때 한 번 묻습니다
 *   POST {endpoint}            → 그 폰에 시험 알람 한 번 (1분에 한 번)
 *   (예약)  매시 정각          → 그 시각으로 정해 둔 폰에 아침 알람
 */
const crypto = require('crypto');

const SB_URL = process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PUB     = process.env.VAPID_PUBLIC  || '';
const PRIV    = process.env.VAPID_PRIVATE || '';
const SUBJECT = process.env.VAPID_SUBJECT || '';

const JSON_HEAD = { 'Content-Type': 'application/json; charset=utf-8' };
const TABLE = 'push_subs';
const TTL = 12 * 3600;           /* 알람은 12시간 안에 못 가면 버린다 — 어제 알람은 뜻이 없다 */
const TEST_GAP_MS = 60000;       /* 시험 알람은 1분에 한 번 */
const MAX_PER_RUN = 500;

/* ── base64url ─────────────────────────────────────────────────── */
function b64u(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64u(s) {
  return Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/* ── HKDF (RFC 5869) — 필요한 길이가 32바이트 이하라 한 덩이면 된다 ── */
function hmac(key, data) { return crypto.createHmac('sha256', key).update(data).digest(); }
function hkdf(salt, ikm, info, len) {
  const prk = hmac(salt, ikm);
  return hmac(prk, Buffer.concat([info, Buffer.from([1])])).subarray(0, len);
}
function info(label) { return Buffer.from('Content-Encoding: ' + label + '\0', 'utf8'); }

/* ── 봉하기 (RFC 8291 · aes128gcm) ──────────────────────────────
   받는 폰만 열 수 있게 봉합니다. 애플·구글 서버도 <b>못 읽습니다</b>. */
function seal(plain, p256dh, auth) {
  const uaPub = unb64u(p256dh);            /* 65바이트 — 0x04 || x || y */
  const authS = unb64u(auth);              /* 16바이트 */
  if (uaPub.length !== 65 || authS.length !== 16) throw new Error('구독 열쇠 모양이 이상합니다');

  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  const asPub  = ecdh.getPublicKey();      /* 65바이트 */
  const shared = ecdh.computeSecret(uaPub);

  /* 둘만 아는 값에서 재료를 뽑는다 — 라벨은 RFC 가 정한 글자 그대로여야 한다 */
  const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0', 'utf8'), uaPub, asPub]);
  const ikm = hkdf(authS, shared, keyInfo, 32);

  const salt  = crypto.randomBytes(16);
  const cek   = hkdf(salt, ikm, info('aes128gcm'), 16);
  const nonce = hkdf(salt, ikm, info('nonce'), 12);

  /* 마지막 덩이라는 표시(0x02)를 글 뒤에 붙인다 */
  const pt = Buffer.concat([Buffer.from(plain, 'utf8'), Buffer.from([2])]);
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const body = Buffer.concat([c.update(pt), c.final(), c.getAuthTag()]);

  const head = Buffer.alloc(5);
  head.writeUInt32BE(4096, 0);             /* 한 덩이 크기 */
  head.writeUInt8(asPub.length, 4);
  return Buffer.concat([salt, head, asPub, body]);
}

/* ── 우리가 보냈다는 서명 (RFC 8292 · VAPID) ──────────────────── */
function vapidKey() {
  const pub = unb64u(PUB);
  if (pub.length !== 65) throw new Error('VAPID_PUBLIC 이 65바이트가 아닙니다');
  return crypto.createPrivateKey({ format: 'jwk', key: {
    kty: 'EC', crv: 'P-256',
    x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)),
    d: b64u(unb64u(PRIV))
  }});
}
function vapidAuth(endpoint) {
  const aud = new URL(endpoint).origin;
  const head = b64u(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' }), 'utf8'));
  const body = b64u(Buffer.from(JSON.stringify({
    aud: aud, exp: Math.floor(Date.now() / 1000) + TTL, sub: SUBJECT
  }), 'utf8'));
  /* 서명은 r||s 64바이트 그대로여야 한다 — DER 로 보내면 401 이 돌아온다 */
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body, 'utf8'),
    { key: vapidKey(), dsaEncoding: 'ieee-p1363' });
  return 'vapid t=' + head + '.' + body + '.' + b64u(sig) + ', k=' + PUB;
}

/* ── 한 폰에 한 번 ─────────────────────────────────────────────── */
async function sendOne(row, msg) {
  const body = seal(JSON.stringify(msg), row.p256dh, row.auth);
  const r = await fetch(row.endpoint, {
    method: 'POST',
    headers: {
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(body.length),
      TTL: String(TTL),
      Authorization: vapidAuth(row.endpoint)
    },
    body: body
  });
  return { ok: r.ok, status: r.status, text: r.ok ? '' : (await r.text()).slice(0, 160) };
}

/* ── 서버 장부 ─────────────────────────────────────────────────── */
async function sb(path, opts) {
  const r = await fetch(SB_URL + '/rest/v1/' + path, Object.assign({
    headers: {
      apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json', Prefer: 'return=representation'
    }
  }, opts || {}));
  const t = await r.text();
  return { ok: r.ok, status: r.status, text: t, json: (() => { try { return JSON.parse(t); } catch (e) { return null; } })() };
}
async function drop(endpoint) {
  await sb(TABLE + '?endpoint=eq.' + encodeURIComponent(endpoint), { method: 'DELETE' });
}
async function touch(endpoint, failed) {
  await sb(TABLE + '?endpoint=eq.' + encodeURIComponent(endpoint), {
    method: 'PATCH',
    body: JSON.stringify(failed ? { last_at: new Date().toISOString(), fail: failed }
                                : { last_at: new Date().toISOString(), fail: 0 })
  });
}

function ready() {
  if (!PUB || !PRIV) return '서버에 알람 열쇠(VAPID_PUBLIC · VAPID_PRIVATE)가 아직 없습니다.';
  if (!SUBJECT) return '서버에 VAPID_SUBJECT(mailto: 주소)가 아직 없습니다.';
  if (!SB_KEY) return '서버가 장부를 못 읽습니다 — SUPABASE_SERVICE_ROLE_KEY 가 없습니다.';
  return '';
}
function kstHour() {
  return new Date(Date.now() + 9 * 3600 * 1000).getUTCHours();
}
/* <b>건수를 말하지 않습니다</b> — 위에 적은 이유 그대로입니다 (1번·5번) */
function morning() {
  return { title: 'APEX YUN PRO', body: '오늘 챙길 분을 확인할 시간입니다.', go: '/app/index.html' };
}

exports.handler = async function (event) {
  const q = (event && event.queryStringParameters) || {};
  const method = (event && event.httpMethod) || 'GET';

  /* ① 앱이 열쇠를 묻는다 — 없으면 <b>없다고</b> 대답한다 */
  if (method === 'GET' && q.key) {
    const why = PUB ? '' : '서버에 알람 열쇠(VAPID_PUBLIC)가 아직 없습니다.';
    return { statusCode: 200, headers: JSON_HEAD,
      body: JSON.stringify({ key: PUB || null, why: why }) };
  }

  const bad = ready();
  if (bad) return { statusCode: 200, headers: JSON_HEAD,
    body: JSON.stringify({ ok: false, sent: 0, reason: bad }) };

  /* ② 시험 — 그 주소를 가진 폰에만. 주소를 아는 것 자체가 그 폰이라는 증거다 */
  if (method === 'POST') {
    let ep = '';
    try { ep = (JSON.parse(event.body || '{}') || {}).endpoint || ''; } catch (e) { ep = ''; }
    if (!ep) return { statusCode: 400, headers: JSON_HEAD,
      body: JSON.stringify({ ok: false, reason: '어느 폰인지 안 적혀 있습니다' }) };
    const g = await sb(TABLE + '?endpoint=eq.' + encodeURIComponent(ep) + '&select=*');
    const row = (g.json || [])[0];
    if (!row) return { statusCode: 404, headers: JSON_HEAD,
      body: JSON.stringify({ ok: false, reason: '서버에 담기지 않은 폰입니다' }) };
    if (row.last_at && (Date.now() - new Date(row.last_at).getTime()) < TEST_GAP_MS)
      return { statusCode: 429, headers: JSON_HEAD,
        body: JSON.stringify({ ok: false, reason: '조금 뒤에 다시 해 주세요' }) };
    let r;
    try { r = await sendOne(row, { title: 'APEX YUN PRO (시험)', body: '서버에서 보낸 알람입니다.', go: '/app/index.html' }); }
    catch (e) { return { statusCode: 200, headers: JSON_HEAD,
      body: JSON.stringify({ ok: false, reason: String((e && e.message) || e).slice(0, 160) }) }; }
    if (r.status === 404 || r.status === 410) { await drop(ep);
      return { statusCode: 200, headers: JSON_HEAD,
        body: JSON.stringify({ ok: false, reason: '이 폰 주소가 만료되어 지웠습니다 — 다시 켜 주세요' }) }; }
    await touch(ep, r.ok ? 0 : (row.fail || 0) + 1);
    return { statusCode: 200, headers: JSON_HEAD,
      body: JSON.stringify({ ok: r.ok, status: r.status, reason: r.text }) };
  }

  /* ③ 예약 — 매시 정각. <b>그 시각으로 정해 둔 폰에만</b> 보낸다 */
  const h = kstHour();
  const g = await sb(TABLE + '?hour=eq.' + h + '&select=*&limit=' + MAX_PER_RUN);
  if (!g.ok) return { statusCode: 200, headers: JSON_HEAD,
    body: JSON.stringify({ ok: false, sent: 0, reason: '장부를 못 읽었습니다 — ' + g.text.slice(0, 160) }) };
  const rows = g.json || [];
  const msg = morning();
  let sent = 0, gone = 0, failed = 0;
  for (const row of rows) {
    let r;
    try { r = await sendOne(row, msg); }
    catch (e) { failed++; continue; }
    if (r.ok) { sent++; await touch(row.endpoint, 0); }
    else if (r.status === 404 || r.status === 410) { gone++; await drop(row.endpoint); }
    else { failed++; await touch(row.endpoint, (row.fail || 0) + 1); }
  }
  return { statusCode: 200, headers: JSON_HEAD,
    body: JSON.stringify({ ok: true, kstHour: h, subs: rows.length, sent: sent, gone: gone, failed: failed }) };
};
