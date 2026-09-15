/* ══ 폰 알람 — <b>봉하고 서명하는 자리 한 곳</b> ═══════════════════════
 *
 * 알람을 보내는 일은 <b>두 함수</b>가 나눠 합니다 —
 *   netlify/functions/push.js        앱이 부른다 (열쇠 주기 · 시험 보내기)
 *   netlify/functions/push-cron.js   Netlify 가 시각에 맞춰 부른다
 *
 * <b>왜 나눴나.</b> Netlify 는 예약(schedule)으로 등록한 함수를 <b>HTTP 로
 * 못 부르게</b> 막습니다 — 403 을 돌려줍니다. 처음에는 한 함수에 세 가지를
 * 다 넣었는데, 예약으로 올리는 순간 앱이 열쇠를 못 받아 <b>폰 알람이
 * 조용히 안 켜졌습니다.</b> 실제로 그렇게 배포됐고, 사장님이 알람을 켜셨는데
 * push_subs 가 0줄이었습니다.
 *
 * 나누면 <b>봉하는 법이 두 벌</b>이 되기 쉽습니다 (5번). 그래서 봉하기·
 * 서명·장부는 여기 <b>한 곳</b>에 두고 두 함수가 가리키기만 합니다.
 *
 * ★ 열쇠는 환경변수에만 둡니다 (10번) — 코드에 적지 않습니다.
 * ★ 고객 이름은 여기 오지 않습니다 (3번).
 */
const crypto = require('crypto');

const SB_URL = process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PUB     = process.env.VAPID_PUBLIC  || '';
const PRIV    = process.env.VAPID_PRIVATE || '';
const SUBJECT = process.env.VAPID_SUBJECT || '';

const JSON_HEAD = { 'Content-Type': 'application/json; charset=utf-8' };
const TABLE = 'push_subs';
const TTL = 12 * 3600;           /* 12시간 안에 못 가면 버린다 — 어제 알람은 뜻이 없다 */
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
/* ── <b>한 기기에 한 번</b> ────────────────────────────────────
   홈 화면에 아이콘을 여럿 담으면(달력·CRM·TFA·고객365일) 아이폰은 그것을
   <b>각각 다른 웹앱</b>으로 봅니다. 그래서 같은 폰인데 구독 줄이 여러 개
   생기고, 그대로 두면 아침에 <b>그 수만큼</b> 울립니다. 「0건 알람은
   방해」라고 해 놓고 중복으로 울리면 같은 잘못입니다.

   같은 사람(owner_id)·같은 기기(ua)는 <b>가장 최근에 켠 줄</b>에만 보냅니다.
   기기 이름(ua)이 비어 있으면 묶지 않습니다 — 모르는 것을 같은 것으로
   치면 <b>안 울려야 할 폰이 아니라 울려야 할 폰이 빠집니다</b> (1번). */
function onePerDevice(rows) {
  const by = new Map();
  for (const r of rows) {
    const k = (r.owner_id || '') + '\u0000' + (r.ua || ('@' + r.endpoint));
    const p = by.get(k);
    if (!p || String(r.created_at || '') > String(p.created_at || '')) by.set(k, r);
  }
  return Array.from(by.values());
}
function kstHour() {
  return new Date(Date.now() + 9 * 3600 * 1000).getUTCHours();
}
/* <b>건수를 말하지 않습니다</b> — 서버가 세려면 「어느 상태를 며칠 만에
   다시 볼지」 표를 서버에도 또 적어야 하고, 그러면 사장님이 기준을 고치셨을
   때 화면과 알람이 다른 말을 합니다 (1번·5번). */
function morning() {
  return { title: 'APEX YUN PRO', body: '오늘 챙길 분을 확인할 시간입니다.', go: '/app/index.html' };
}

module.exports = {
  PUB, SUBJECT, JSON_HEAD, TABLE, TTL, TEST_GAP_MS, MAX_PER_RUN,
  b64u, unb64u, seal, vapidAuth, sendOne, sb, drop, touch, ready, kstHour, morning, onePerDevice
};
