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
 * ★ 열쇠는 <b>환경변수나 push_keys 표</b>에만 둡니다 (10번) — 코드에 적지 않습니다.
 *   둘 다 있으면 환경변수가 먼저입니다. 표는 서버만 읽습니다.
 * ★ 고객 이름은 여기 오지 않습니다 (3번).
 */
const crypto = require('crypto');

const SB_URL = process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
/* 「이 표가 누구 것인가」를 묻는 데는 <b>anon 열쇠면 됩니다</b> — 그게 원래 그
   열쇠가 하는 일이고, 브라우저가 늘 그렇게 씁니다(RLS 가 지킵니다 · 10번).
   ⚠ 2026-09-22. 여기서 <b>service_role 로 물었다가</b> 물렸습니다. 그 열쇠가
     거절당하자 Supabase 가 「Invalid API key」를 돌려줬고, 앱은 그것을
     <b>「사장님 로그인이 확인 안 됩니다」</b> 로 옮겨 적었습니다. 사장님은
     앱을 닫았다 열기를 되풀이하셨습니다 — 고칠 곳은 <b>서버 열쇠</b>였습니다.
     열쇠 하나가 틀렸다고 <b>엉뚱한 사람에게 허물을 돌리면</b> 영영 못 고칩니다 (1번).
   anon 이 없으면 옛날처럼 SB_KEY 로 묻되, <b>무엇으로 물었는지 말합니다</b>. */
const SB_ANON = process.env.SUPABASE_ANON_KEY || '';
/* ── 열쇠는 <b>두 곳</b>에서 올 수 있다 ──────────────────────────
   ① 환경변수 VAPID_* — 예전부터 쓰던 자리. <b>있으면 이것이 먼저</b>다.
   ② push_keys 표(서버만 읽는다) — 앱에서 만들어 저장한 것.

   ②를 만든 까닭: ①을 넣으려면 Netlify 화면에 들어가 세 줄을 손으로
   붙여 넣어야 한다. 설계사가 혼자 하기 어려운 자리라, 알람을 다 만들어
   놓고도 <b>켜지지 못한 채</b>로 있었다. 이제 앱에서 단추 하나로 끝난다.

   ★ 표에서 읽은 열쇠도 <b>앱으로는 안 나간다</b> — 나가는 것은 공개 열쇠
     하나뿐이다(그것은 원래 공개용이다). 비밀 열쇠는 여기서만 쓴다 (10번).
   ★ 한 번 읽으면 이 함수 안에 담아 둔다 — 알람 한 번에 수백 통을 보내는데
     줄마다 서버를 부르면 안 된다 (7번).                                */
const ENV_PUB     = process.env.VAPID_PUBLIC  || '';
const ENV_PRIV    = process.env.VAPID_PRIVATE || '';
const ENV_SUBJECT = process.env.VAPID_SUBJECT || '';
let KEYS = null;                 /* {pub,priv,subject,from} — 한 번만 읽는다 */
async function keys() {
  if (KEYS) return KEYS;
  if (ENV_PUB && ENV_PRIV && ENV_SUBJECT) {
    KEYS = { pub: ENV_PUB, priv: ENV_PRIV, subject: ENV_SUBJECT, from: 'env' };
    return KEYS;
  }
  /* 장부를 못 읽으면 <b>없다고</b> 한다 — 빈 열쇠로 보내는 시늉을 하지 않는다 (1번) */
  if (!SB_KEY) return { pub: ENV_PUB, priv: ENV_PRIV, subject: ENV_SUBJECT, from: 'env' };
  try {
    const r = await sb('push_keys?id=eq.default&select=pub,priv,subject&limit=1');
    const row = (r && r.json && r.json[0]) || null;
    if (row && row.pub && row.priv && row.subject) {
      KEYS = { pub: row.pub, priv: row.priv, subject: row.subject, from: 'db' };
      return KEYS;
    }
  } catch (e) { /* 못 읽으면 아래에서 「없다」 고 말한다 */ }
  return { pub: ENV_PUB, priv: ENV_PRIV, subject: ENV_SUBJECT, from: 'env' };
}
function keysForget() { KEYS = null; }   /* 새로 저장한 직후 다시 읽게 */

/* ── <b>이 표가 누구 것인가</b> ────────────────────────────────────
   돌려주는 것 — { uid, status, msg, by }
     uid 가 있으면 그 사람이다. 없으면 <b>왜 못 봤는지</b>를 그대로 담는다.
     by  는 <b>무엇으로 물었나</b> — 'anon' 이면 제대로, 'service' 면 임시.   */
async function whoIs(token) {
  const ak = SB_ANON || SB_KEY;
  const by = SB_ANON ? 'anon' : 'service';
  if (!ak) return { uid: '', status: 0, msg: '서버에 Supabase 열쇠가 없습니다', by: 'none' };
  try {
    const r = await fetch(SB_URL + '/auth/v1/user',
      { headers: { apikey: ak, Authorization: 'Bearer ' + String(token || '') } });
    const j = await r.json().catch(() => null);
    const uid = (j && j.id) || '';
    const msg = uid ? '' : String((j && (j.msg || j.message || j.error_description)) || '').slice(0, 90);
    return { uid: uid, status: r.status || 0, msg: msg, by: by };
  } catch (e) { return { uid: '', status: 0, msg: '서버에 닿지 못했습니다', by: by }; }
}
/* <b>「Invalid API key」는 사장님 탓이 아니다</b> — 서버가 내민 열쇠를 Supabase 가
   거절한 것이다. 이 한 줄이 있고 없고가 「앱을 껐다 켜세요」를 스무 번 하느냐
   마느냐를 가른다.                                                        */
function isKeyFault(d) {
  return /invalid api key/i.test(String((d && d.msg) || ''));
}

/* ── 🩺 <b>서버 열쇠가 성한가</b> ───────────────────────────────────
   ★ <b>열쇠 자체는 한 글자도 안 내보낸다</b> (10번). 내보내는 것은
     <b>모양</b>(무슨 꼴인지·몇 글자인지)과 <b>Supabase 의 대답</b>뿐이다.
   ★ JWT 의 가운데 토막(payload)은 서명이 아니라 <b>누구나 읽을 수 있는 자리</b>다.
     거기서 role 과 ref(어느 프로젝트 것인지)만 본다 — 열쇠가 <b>다른 프로젝트</b>
     것이어도 똑같이 「Invalid API key」가 나오기 때문에, 이 둘을 갈라야 한다. */
function keyShape(k) {
  const s = String(k || '');
  if (!s) return { kind: 'none', len: 0 };
  const out = { kind: 'other', len: s.length };
  if (/^sb_secret_/.test(s)) { out.kind = 'sb_secret'; return out; }
  if (/^sb_publishable_/.test(s)) { out.kind = 'sb_publishable'; return out; }
  const p = s.split('.');
  if (p.length === 3) {
    out.kind = 'jwt';
    try {
      const j = JSON.parse(Buffer.from(p[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
      out.role = String(j.role || '');
      out.ref = String(j.ref || '');
      out.refOk = !!(out.ref && SB_URL.indexOf(out.ref) >= 0);
    } catch (e) { /* 못 읽으면 모양만 말한다 */ }
  }
  return out;
}
async function keyDiag() {
  const d = { url: String(SB_URL).replace(/^https?:\/\//, ''),
              key: keyShape(SB_KEY), anon: !!SB_ANON, vapidEnv: !!(ENV_PUB && ENV_PRIV && ENV_SUBJECT) };
  if (!SB_KEY) { d.live = { status: 0, msg: 'SUPABASE_SERVICE_ROLE_KEY 가 아예 없습니다' }; return d; }
  try {
    const r = await fetch(SB_URL + '/rest/v1/push_keys?select=id&limit=1',
      { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } });
    const t = (await r.text()).slice(0, 120);
    let msg = '';
    if (!r.ok) { try { const j = JSON.parse(t); msg = String(j.message || j.msg || j.hint || t); }
                 catch (e) { msg = t; } }
    d.live = { status: r.status || 0, msg: msg };
  } catch (e) { d.live = { status: 0, msg: '서버에 닿지 못했습니다' }; }
  return d;
}

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
function vapidKey(K) {
  const pub = unb64u(K.pub);
  if (pub.length !== 65) throw new Error('VAPID_PUBLIC 이 65바이트가 아닙니다');
  return crypto.createPrivateKey({ format: 'jwk', key: {
    kty: 'EC', crv: 'P-256',
    x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)),
    d: b64u(unb64u(K.priv))
  }});
}
function vapidAuth(endpoint, K) {
  const aud = new URL(endpoint).origin;
  const head = b64u(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' }), 'utf8'));
  const body = b64u(Buffer.from(JSON.stringify({
    aud: aud, exp: Math.floor(Date.now() / 1000) + TTL, sub: K.subject
  }), 'utf8'));
  /* 서명은 r||s 64바이트 그대로여야 한다 — DER 로 보내면 401 이 돌아온다 */
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body, 'utf8'),
    { key: vapidKey(K), dsaEncoding: 'ieee-p1363' });
  return 'vapid t=' + head + '.' + body + '.' + b64u(sig) + ', k=' + K.pub;
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
      Authorization: vapidAuth(row.endpoint, await keys())
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

async function ready() {
  if (!SB_KEY) return '서버가 장부를 못 읽습니다 — SUPABASE_SERVICE_ROLE_KEY 가 없습니다.';
  const K = await keys();
  if (!K.pub || !K.priv) return '서버에 알람 열쇠가 아직 없습니다 — 앱의 「🔑 알람 켜기 마무리」 를 눌러 주세요.';
  if (!K.subject) return '서버에 보낼 곳 주소(mailto:)가 아직 없습니다.';
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
  JSON_HEAD, TABLE, TTL, TEST_GAP_MS, MAX_PER_RUN, SB_KEY, SB_ANON,
  whoIs, isKeyFault, keyDiag, keyShape,
  keys, keysForget,
  b64u, unb64u, seal, vapidAuth, sendOne, sb, drop, touch, ready, kstHour, morning, onePerDevice
};
