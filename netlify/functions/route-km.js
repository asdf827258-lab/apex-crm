/* 실제 길찾기 거리 — 카카오모빌리티에 물어본다.
 *
 * 왜 서버를 거치는가
 *   길찾기 API 는 <b>브라우저에서 못 부릅니다.</b> 막혀 있고(CORS), 무엇보다
 *   REST 키는 화면에 노출되면 안 됩니다. 그래서 여기서 대신 묻습니다.
 *
 * 키가 없으면 <b>없다고 말합니다.</b> 지어낸 숫자를 돌려주지 않습니다 —
 *   화면은 그 답을 보고 예전처럼 「어림」으로 되돌아갑니다. 잘못된 거리를
 *   받아 「몇 분」이라고 적으면, 사장님은 그걸 믿고 하루를 짜십니다.
 *
 * 쓰는 법
 *   POST /.netlify/functions/route-km
 *     { legs:[{ox,oy,dx,dy}, ...] }        ox/oy 출발 경도·위도, dx/dy 도착
 *   →  { ok:true, legs:[{km,min}|null, ...] }
 *   →  { ok:false, why:'NOKEY' }           키가 없다 — 화면은 어림으로 간다
 *
 * 한 번에 여러 구간을 받습니다 — 하루 동선이면 대여섯 구간이라, 한 번에
 * 물어야 왕복이 줄어듭니다 (CLAUDE.md 7번).
 */
const KEY = process.env.KAKAO_REST_KEY || '';
const API = 'https://apis-navi.kakaomobility.com/v1/directions';
const MAX_LEGS = 20;          /* 하루 동선이 이보다 길 일은 없다 */

const json = (code, body) => ({
  statusCode: code,
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body)
});

async function one(leg) {
  const u = API + '?origin=' + leg.ox + ',' + leg.oy +
            '&destination=' + leg.dx + ',' + leg.dy +
            '&priority=RECOMMEND&car_fuel=GASOLINE';
  const r = await fetch(u, { headers: { Authorization: 'KakaoAK ' + KEY } });
  if (!r.ok) return null;
  const j = await r.json();
  const s = j && j.routes && j.routes[0] && j.routes[0].summary;
  if (!s || typeof s.distance !== 'number') return null;
  /* 카카오는 미터·초로 답한다 */
  return { km: Math.round(s.distance / 100) / 10, min: Math.max(1, Math.round(s.duration / 60)) };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, why: 'POST' });
  if (!KEY) return json(200, { ok: false, why: 'NOKEY' });

  let legs;
  try { legs = (JSON.parse(event.body || '{}').legs) || []; }
  catch (e) { return json(400, { ok: false, why: 'BADJSON' }); }
  if (!Array.isArray(legs) || !legs.length) return json(400, { ok: false, why: 'NOLEGS' });
  if (legs.length > MAX_LEGS) legs = legs.slice(0, MAX_LEGS);

  const bad = legs.some(l => !l || [l.ox, l.oy, l.dx, l.dy].some(v => typeof v !== 'number' || !isFinite(v)));
  if (bad) return json(400, { ok: false, why: 'BADLEG' });

  try {
    const out = [];
    for (const l of legs) out.push(await one(l).catch(() => null));
    return json(200, { ok: true, legs: out });
  } catch (e) {
    /* 실패를 성공처럼 말하지 않는다 — 화면은 어림으로 되돌아간다 */
    return json(200, { ok: false, why: 'UPSTREAM' });
  }
};
