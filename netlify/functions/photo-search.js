/*
 * APEX YUN PRO — 캐러셀 실사 사진 찾기 (Netlify Functions · 판 X235)
 * ────────────────────────────────────────────────────────────────
 * 사장님 말씀 (2026-10-29): 「사진이 사실적 또는 뉴스에서 사용하는 실제 이미지를
 * 따와서 넣고 싶은거야」 → 고르신 길 「둘 다」 (정책브리핑 + 무료 실사 사진).
 *
 * ⚠ 뉴스 기사 사진은 가져오지 않는다 — 연합뉴스·신문사 저작물이라 보험 광고에
 *   넣으면 저작권 침해다.
 * ⚠ 정책브리핑(korea.kr) 사진도 <b>자동으로는</b> 가져오지 않는다. 저작권 정책에
 *   「사진은 정부기관·연합뉴스 등에 저작권이 나뉘어 있고, 공공누리 표시가 있어도
 *   사진·이미지는 담당자와 협의 후 사용」 이라고 적혀 있다(korea.kr/guide/copyRight.do
 *   9-4). 공식 사진 API 도 없다. 기계가 「써도 된다」 고 판정할 길이 없으므로 안 한다.
 *
 * 그래서 상업적 이용이 허락된 실사 사진 둘만 찾는다 —
 *   Pexels   (PEXELS_API_KEY)       · 사진가 이름 + Pexels 표기
 *   Unsplash (UNSPLASH_ACCESS_KEY)  · 사진가 이름 + Unsplash 표기, 고르면 download 신호
 * 키는 서버 환경변수에만 둔다(팀원 키 불필요 · CLAUDE.md 10번).
 * 키가 없으면 <b>없다고 말한다</b> — 빈 목록으로 조용히 넘기지 않는다(1번).
 *
 * 한글 검색어는 Gemini(GEMINI_API_KEY)로 짧은 영어 검색어로 바꾼다. 실패하면 한글
 * 그대로 찾는다(Pexels 는 locale=ko-KR 로 한글도 받는다).
 *
 *   GET  /api/photo-search?q=검색어&src=all|pexels|unsplash&page=1
 *   GET  /api/photo-search?track=<unsplash download_location>   ← 고른 사진 알림
 */
const cors = () => ({
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-App-Token",
});
const out = (code, obj) => ({ statusCode: code, headers: Object.assign({ "Content-Type": "application/json" }, cors()), body: JSON.stringify(obj) });

async function toEnglish(q, key) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + encodeURIComponent(key);
  const prompt = "Turn this Korean card-news topic into ONE short English stock-photo search query (2 to 4 words). " +
    "Prefer a real-life scene with people (add 'korean' or 'asian' when a person fits). No quotes, no punctuation, answer with the query only.\n\nTopic: " + q;
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 20 } }) });
  if (!r.ok) throw new Error("translate " + r.status);
  const d = await r.json();
  const t = (((d.candidates || [])[0] || {}).content || {}).parts || [];
  const s = (t.map(p => p.text || "").join(" ") || "").replace(/["'.\n]/g, " ").replace(/\s+/g, " ").trim();
  if (!s || /[가-힣]/.test(s)) throw new Error("translate empty");
  return s.slice(0, 60);
}

async function pexels(q, page, key, ko) {
  const u = "https://api.pexels.com/v1/search?orientation=portrait&per_page=15&page=" + page + "&query=" + encodeURIComponent(q) + (ko ? "&locale=ko-KR" : "");
  const r = await fetch(u, { headers: { Authorization: key } });
  if (!r.ok) throw new Error("Pexels " + r.status);
  const d = await r.json();
  return (d.photos || []).map(p => ({
    src: "Pexels", id: "px" + p.id, alt: p.alt || "",
    thumb: p.src && (p.src.medium || p.src.small),
    full: p.src && p.src.original ? p.src.original + "?auto=compress&cs=tinysrgb&fit=crop&w=1080&h=1350" : "",
    name: p.photographer || "", link: p.url || "https://www.pexels.com",
  })).filter(x => x.thumb && x.full);
}

async function unsplash(q, page, key) {
  const u = "https://api.unsplash.com/search/photos?orientation=portrait&content_filter=high&per_page=15&page=" + page + "&query=" + encodeURIComponent(q);
  const r = await fetch(u, { headers: { Authorization: "Client-ID " + key, "Accept-Version": "v1" } });
  if (!r.ok) throw new Error("Unsplash " + r.status);
  const d = await r.json();
  return (d.results || []).map(p => ({
    src: "Unsplash", id: "us" + p.id, alt: p.alt_description || "",
    thumb: p.urls && p.urls.small,
    full: p.urls && p.urls.raw ? p.urls.raw + "&fm=jpg&q=85&fit=crop&crop=faces,entropy&w=1080&h=1350" : "",
    name: (p.user && p.user.name) || "",
    link: ((p.user && p.user.links && p.user.links.html) || "https://unsplash.com") + "?utm_source=apex_yun_pro&utm_medium=referral",
    track: (p.links && p.links.download_location) || "",
  })).filter(x => x.thumb && x.full);
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors(), body: "" };
  if (event.httpMethod !== "GET") return out(405, { ok: false, error: "GET만 허용됩니다." });
  const SHARED = process.env.SHARED_TOKEN || "";
  if (SHARED) {
    const t = event.headers["x-app-token"] || event.headers["X-App-Token"];
    if (t !== SHARED) return out(401, { ok: false, error: "토큰이 올바르지 않습니다." });
  }
  const P = event.queryStringParameters || {};
  const PK = process.env.PEXELS_API_KEY || "", UK = process.env.UNSPLASH_ACCESS_KEY || "", GK = process.env.GEMINI_API_KEY || "";

  /* 고른 사진 알림 — Unsplash API 지침(고르면 download_location 을 부른다) */
  if (P.track) {
    const tr = String(P.track);
    if (!/^https:\/\/api\.unsplash\.com\/photos\/[A-Za-z0-9_-]+\/download(\?[^\s]*)?$/.test(tr)) return out(400, { ok: false, error: "track 주소가 Unsplash 것이 아닙니다." });
    if (!UK) return out(200, { ok: false, error: "UNSPLASH_ACCESS_KEY 가 없습니다." });
    try { const r = await fetch(tr, { headers: { Authorization: "Client-ID " + UK } }); return out(200, { ok: r.ok }); }
    catch (e) { return out(200, { ok: false, error: String(e.message || e) }); }
  }

  const q = String(P.q || "").trim().slice(0, 80);
  if (!q) return out(400, { ok: false, error: "검색어가 없습니다." });
  const src = /^(pexels|unsplash)$/.test(P.src || "") ? P.src : "all";
  const page = Math.max(1, Math.min(10, parseInt(P.page, 10) || 1));
  const missing = [];
  if ((src === "all" || src === "pexels") && !PK) missing.push("PEXELS_API_KEY");
  if ((src === "all" || src === "unsplash") && !UK) missing.push("UNSPLASH_ACCESS_KEY");

  let en = q, ko = /[가-힣]/.test(q), translated = false;
  if (ko && GK) { try { en = await toEnglish(q, GK); translated = true; } catch (e) { en = q; } }

  const jobs = [], errors = [];
  if ((src === "all" || src === "pexels") && PK) jobs.push(pexels(en, page, PK, ko && !translated).catch(e => { errors.push(String(e.message || e)); return []; }));
  if ((src === "all" || src === "unsplash") && UK) jobs.push(unsplash(en, page, UK).catch(e => { errors.push(String(e.message || e)); return []; }));
  const lists = await Promise.all(jobs);
  /* 두 곳을 번갈아 섞는다 — 한쪽만 위에 몰리지 않게 */
  const items = [], mx = Math.max(0, ...lists.map(l => l.length));
  for (let i = 0; i < mx; i++) lists.forEach(l => { if (l[i]) items.push(l[i]); });
  return out(200, { ok: true, query: en, translated, items, missing, errors });
};
