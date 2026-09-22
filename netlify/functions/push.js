/* ══ 폰 알람 — <b>앱이 부르는 자리</b> ═══════════════════════════════
 *
 * 앱(app/index.html 의 alm*)이 여기에 두 가지를 묻습니다 —
 *   GET  ?key=1       이 서버의 공개 열쇠를 주세요 (구독할 때 한 번)
 *   POST {endpoint}   이 폰에 시험 알람을 한 번 보내 주세요
 *
 * ★ <b>여기에 예약(schedule)을 걸지 마십시오.</b> Netlify 는 예약으로 등록한
 *   함수를 <b>HTTP 로 못 부르게</b> 막습니다 — 403 을 돌려줍니다. 처음에는
 *   보내는 일까지 한 함수에 넣고 예약을 걸었는데, 그 순간 앱이 열쇠를 못
 *   받아 <b>폰 알람이 조용히 안 켜졌습니다.</b> 사장님이 알람을 켜셨는데
 *   push_subs 가 0줄이었습니다. 시각에 맞춰 보내는 일은 push-cron.js 가
 *   합니다. check-push 가 이 둘이 섞이지 않는지 지킵니다 (8번).
 *
 * ★ 봉하기·서명은 scripts/push-core.js 한 곳에 있습니다 (5번).
 * ★ 열쇠는 환경변수에만 (10번) · 고객 이름은 여기 안 옵니다 (3번).
 */
const P = require('../../scripts/push-core.js');

exports.handler = async function (event) {
  const q = (event && event.queryStringParameters) || {};
  const method = (event && event.httpMethod) || 'GET';

  /* ① 앱이 열쇠를 묻는다 — 없으면 <b>없다고</b> 대답한다 (1번).
     ⚠ 나가는 것은 <b>공개 열쇠 하나뿐</b>이다. 비밀 열쇠는 여기서 절대
        안 내보낸다 — 있는지 없는지(has)만 말한다 (10번). */
  /* 🩺 <b>서버 열쇠가 성한가</b> — 열쇠는 한 글자도 안 나간다 (10번).
     모양과 Supabase 의 대답만 말한다. 이것이 없어서 「Invalid API key」를
     눈으로 못 보고 사장님 로그인을 의심했다 (8번 — 안 보이면 못 고친다). */
  if (method === 'GET' && (q.diag || '') === '1')
    return { statusCode: 200, headers: P.JSON_HEAD, body: JSON.stringify(await P.keyDiag()) };

  if (method === 'GET') {
    const K = await P.keys();
    const why = K.pub ? '' : '서버에 알람 열쇠가 아직 없습니다.';
    return { statusCode: 200, headers: P.JSON_HEAD,
      body: JSON.stringify({ key: K.pub || null, why: why, from: K.from, has: !!(K.pub && K.priv) }) };
  }

  if (method !== 'POST')
    return { statusCode: 405, headers: P.JSON_HEAD,
      body: JSON.stringify({ ok: false, reason: '쓸 수 없는 방법입니다' }) };

  /* ①-2 <b>열쇠를 저장한다</b> — 앱에서 만든 것을 서버에 담는다.
     여태는 Netlify 환경변수에 손으로 넣어야 했다. 그 한 걸음 때문에
     알람이 켜지지 못한 채로 있었다.

     ★ <b>아무나 못 바꾼다.</b> 로그인한 사람의 표를 Supabase 에게 물어
       확인하고, 그 사람이 <b>대표·관리자</b> 일 때만 받는다. 열쇠가 바뀌면
       이미 담긴 폰들이 전부 못 받게 되므로, 아무나 덮으면 알람이 조용히
       죽는다.
     ★ 받은 것은 <b>되돌려 주지 않는다</b> — 저장됐다는 말만 한다 (10번).
     ★ 모양을 먼저 본다. 65바이트·32바이트가 아니면 <b>담지 않는다</b> —
       담아 두고 아침에 조용히 실패하는 것이 제일 나쁘다 (1번).          */
  if ((q.a || '') === 'setkey') {
    if (!P.SB_KEY) return { statusCode: 200, headers: P.JSON_HEAD,
      body: JSON.stringify({ ok: false, reason: '서버가 장부를 못 읽습니다.' }) };
    let body = {};
    try { body = JSON.parse(event.body || '{}') || {}; } catch (e) { body = {}; }
    const tok = String(body.token || '').trim();
    if (!tok) return { statusCode: 401, headers: P.JSON_HEAD,
      body: JSON.stringify({ ok: false, reason: '로그인한 뒤에 해 주세요.' }) };

    /* 이 토큰이 누구인가 — Supabase 에게 묻는다.
       ⚠ 2026-09-22 아침에 여기서 물렸습니다. 폰을 덮어 두셨다가 여시면
         앱이 들고 있던 표의 <b>시간이 지나</b> 있어서, 그것을 그대로
         보냈습니다. 앱 쪽은 이제 누르는 그 자리에서 표를 새로 받습니다.
       ★ 여기서 돌려보내는 말은 <b>앱이 쓰는 말과 달라야</b> 합니다.
         여태 두 자리가 똑같은 문장이라, 화면만 봐서는 <b>폰이 못 보낸
         것인지 서버가 물린 것인지</b> 알 수가 없었습니다 (1번).
         그래서 서버가 무슨 대답을 했는지(상태 번호)도 같이 적습니다. */
    const d = await P.whoIs(tok);
    const uid = d.uid;
    /* ⚠ <b>허물을 제 자리에</b> 돌린다 (1번). 「Invalid API key」는 사장님
       로그인이 아니라 <b>서버가 내민 열쇠</b>가 거절당한 것이다. 여기서
       「앱을 닫았다 여세요」 라고 적는 바람에 사장님이 그것을 스무 번
       되풀이하셨다 — 고칠 곳은 Netlify 의 환경변수 한 줄이었다. */
    if (!uid && P.isKeyFault(d)) return { statusCode: 200, headers: P.JSON_HEAD,
      /* ⚠ 이유는 <b>맨 글자</b>로만 보낸다. 여기에는 Supabase 가 돌려준 원문이
         섞이는데, 그것을 화면이 <b>날것으로</b> 그리면 남의 글이 우리 화면에서
         돈다. 굵게 적는 것은 <b>앱이 제 말로</b> 만든다 (keyFault 한 글자면 된다). */
      body: JSON.stringify({ ok: false, keyFault: true, reason:
        '서버 대답 ' + (d.status || '없음') + ' · ' + (d.msg || '') }) };
    if (!uid) return { statusCode: 401, headers: P.JSON_HEAD,
      body: JSON.stringify({ ok: false, reason:
        '서버가 로그인 표를 확인하지 못했습니다 — 앱을 닫았다 여신 뒤 다시 눌러 주세요.'
        + ' (서버 대답 ' + (d.status || '없음') + (d.msg ? (' · ' + d.msg) : '') + ')' }) };

    const pr = await P.sb('profiles?id=eq.' + encodeURIComponent(uid) + '&select=role&limit=1');
    const role = ((pr.json || [])[0] || {}).role || '';
    if (['owner', 'admin', 'master'].indexOf(role) < 0)
      return { statusCode: 403, headers: P.JSON_HEAD,
        body: JSON.stringify({ ok: false, reason: '대표·관리자만 알람 열쇠를 넣을 수 있습니다.' }) };

    const pub = String(body.pub || ''), priv = String(body.priv || ''), subject = String(body.subject || '');
    const n = (x) => { try { return P.unb64u(x).length; } catch (e) { return 0; } };
    if (n(pub) !== 65) return { statusCode: 400, headers: P.JSON_HEAD,
      body: JSON.stringify({ ok: false, reason: '공개 열쇠 모양이 맞지 않습니다(65바이트가 아닙니다).' }) };
    if (n(priv) !== 32) return { statusCode: 400, headers: P.JSON_HEAD,
      body: JSON.stringify({ ok: false, reason: '비밀 열쇠 모양이 맞지 않습니다(32바이트가 아닙니다).' }) };
    if (!/^mailto:\S+@\S+$/.test(subject)) return { statusCode: 400, headers: P.JSON_HEAD,
      body: JSON.stringify({ ok: false, reason: '보낼 곳 주소를 mailto:메일 로 적어 주세요.' }) };

    const w = await P.sb('push_keys?on_conflict=id', {
      method: 'POST',
      headers: { apikey: P.SB_KEY, Authorization: 'Bearer ' + P.SB_KEY,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: 'default', pub: pub, priv: priv, subject: subject,
        made_by: uid, made_at: new Date().toISOString() })
    });
    if (!w.ok) {
      const kf = /invalid api key/i.test(String(w.text || ''));
      return { statusCode: 200, headers: P.JSON_HEAD,
        body: JSON.stringify({ ok: false, keyFault: kf, reason: kf
          ? ('담는 자리에서 막혔습니다 · ' + String(w.status || ''))
          : ('저장하지 못했습니다 — ' + String(w.text || '').slice(0, 160)) }) };
    }
    P.keysForget();
    return { statusCode: 200, headers: P.JSON_HEAD,
      body: JSON.stringify({ ok: true, saved: true }) };
  }

  const bad = await P.ready();
  if (bad) return { statusCode: 200, headers: P.JSON_HEAD,
    body: JSON.stringify({ ok: false, reason: bad }) };

  /* ② 시험 — 그 주소를 가진 폰에만. 주소를 아는 것 자체가 그 폰이라는 증거다 */
  let ep = '';
  try { ep = (JSON.parse(event.body || '{}') || {}).endpoint || ''; } catch (e) { ep = ''; }
  if (!ep) return { statusCode: 400, headers: P.JSON_HEAD,
    body: JSON.stringify({ ok: false, reason: '어느 폰인지 안 적혀 있습니다' }) };

  const g = await P.sb(P.TABLE + '?endpoint=eq.' + encodeURIComponent(ep) + '&select=*');
  const row = (g.json || [])[0];
  if (!row) return { statusCode: 404, headers: P.JSON_HEAD,
    body: JSON.stringify({ ok: false, reason: '서버에 담기지 않은 폰입니다' }) };
  if (row.last_at && (Date.now() - new Date(row.last_at).getTime()) < P.TEST_GAP_MS)
    return { statusCode: 429, headers: P.JSON_HEAD,
      body: JSON.stringify({ ok: false, reason: '조금 뒤에 다시 해 주세요' }) };

  let r;
  try { r = await P.sendOne(row, { title: 'APEX YUN PRO (시험)', body: '서버에서 보낸 알람입니다.', go: '/app/index.html' }); }
  catch (e) { return { statusCode: 200, headers: P.JSON_HEAD,
    body: JSON.stringify({ ok: false, reason: String((e && e.message) || e).slice(0, 160) }) }; }

  if (r.status === 404 || r.status === 410) { await P.drop(ep);
    return { statusCode: 200, headers: P.JSON_HEAD,
      body: JSON.stringify({ ok: false, reason: '이 폰 주소가 만료되어 지웠습니다 — 다시 켜 주세요' }) }; }

  await P.touch(ep, r.ok ? 0 : (row.fail || 0) + 1);
  return { statusCode: 200, headers: P.JSON_HEAD,
    body: JSON.stringify({ ok: r.ok, status: r.status, reason: r.text }) };
};
