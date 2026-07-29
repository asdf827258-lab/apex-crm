/*
 * APEX YUN PRO — 토스페이먼츠 자동결제(빌링) — Netlify Functions
 * ─────────────────────────────────────────────────────────────────────────
 * 흐름:
 *  1) 앱에서 카드 등록(requestBillingAuth) → 성공 시 authKey/customerKey 수신
 *  2) 이 함수 action:'issue' → 토스에 빌링키 발급 요청 → 첫 결제 즉시 승인
 *     → subscriptions/payments 기록 + profiles.plan/plan_until 자동 부여
 *  3) 매월(또는 매년) action:'charge-due' (크론)로 만기 도래분 자동 결제
 *  4) action:'cancel' → 자동결제 해지(이용기간은 유지)
 *
 * 필요한 Netlify 환경변수 (Site settings → Environment variables):
 *   TOSS_SECRET_KEY            = 토스 시크릿 키(test_sk_… / live_sk_…)   ← 필수·비밀
 *   SUPABASE_SERVICE_ROLE_KEY  = Supabase → API → service_role 키        ← 필수·비밀
 *   SUPABASE_URL               = (선택) 기본값 내장
 *   CRON_SECRET                = (선택) charge-due 호출 보호용 임의 문자열
 *
 * ⚠️ 시크릿·service_role 키는 반드시 환경변수에만 두세요(앱/브라우저 금지).
 * ⚠️ 빌링키는 서버(service_role)만 접근 가능한 컬럼에 저장됩니다.
 */

const TOSS_ISSUE_URL = "https://api.tosspayments.com/v1/billing/authorizations/issue";
const TOSS_CHARGE_URL = "https://api.tosspayments.com/v1/billing/"; // + billingKey
const DEFAULT_SUPABASE_URL = "https://miakdhxtqofpndtlyzxa.supabase.co";

const PLANS = {
  basic: { name: "베이직", month: 26500, year: 265000 },
  pro: { name: "프로", month: 49900, year: 499000 },
  team: { name: "팀·프리미엄", month: 119000, year: 1190000 },
};

function json(statusCode, body, cors) {
  return { statusCode, headers: cors, body: JSON.stringify(body) };
}

function addPeriod(from, cycle) {
  const d = new Date(from);
  if (cycle === "year") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

async function sb(path, opts, url, key) {
  const res = await fetch(url + "/rest/v1/" + path, {
    ...opts,
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      Prefer: (opts && opts.prefer) || "return=representation",
      ...((opts && opts.headers) || {}),
    },
  });
  const txt = await res.text();
  let data = null;
  try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = txt; }
  if (!res.ok) {
    const err = new Error((data && data.message) || txt || "supabase error");
    err.status = res.status;
    throw err;
  }
  return data;
}

async function tossCall(url, secret, payload, idempotencyKey) {
  const auth = Buffer.from(secret + ":").toString("base64");
  const headers = { Authorization: "Basic " + auth, "Content-Type": "application/json" };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "toss error");
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

/** 한 건 결제 + 기록 + 등급 부여 */
async function chargeOne(sub, ctx) {
  const { secret, SUPA, SKEY } = ctx;
  const plan = PLANS[sub.plan] || PLANS.basic;
  const cycle = sub.cycle === "year" ? "year" : "month";
  const amount = sub.amount || plan[cycle];
  const orderId = "APEXB-" + sub.plan + "-" + (cycle === "year" ? "Y" : "M") + "-" + Date.now();

  let paid, failReason = null;
  try {
    paid = await tossCall(
      TOSS_CHARGE_URL + encodeURIComponent(sub.billing_key),
      secret,
      {
        customerKey: sub.customer_key,
        amount,
        orderId,
        orderName: "APEX YUN PRO " + plan.name + " (" + (cycle === "year" ? "연간" : "월간") + ")",
      },
      orderId
    );
  } catch (e) {
    failReason = (e && e.message) || "결제 실패";
  }

  const now = new Date();
  await sb("payments", {
    method: "POST",
    body: JSON.stringify({
      member_id: sub.member_id,
      subscription_id: sub.id || null,
      order_id: orderId,
      amount,
      plan: sub.plan,
      cycle,
      status: failReason ? "failed" : "paid",
      fail_reason: failReason,
      payment_key: paid && paid.paymentKey ? paid.paymentKey : null,
      paid_at: now.toISOString(),
    }),
    prefer: "return=minimal",
  }, SUPA, SKEY).catch(() => {});

  if (failReason) {
    await sb("subscriptions?id=eq." + sub.id, {
      method: "PATCH",
      body: JSON.stringify({ status: "past_due", last_error: failReason, updated_at: now.toISOString() }),
      prefer: "return=minimal",
    }, SUPA, SKEY).catch(() => {});
    return { ok: false, error: failReason };
  }

  const next = addPeriod(now, cycle);
  await sb("subscriptions?id=eq." + sub.id, {
    method: "PATCH",
    body: JSON.stringify({
      status: "active",
      last_paid_at: now.toISOString(),
      next_billing_at: next.toISOString(),
      last_error: null,
      updated_at: now.toISOString(),
    }),
    prefer: "return=minimal",
  }, SUPA, SKEY).catch(() => {});

  await sb("profiles?id=eq." + sub.member_id, {
    method: "PATCH",
    body: JSON.stringify({ plan: sub.plan, status: "approved", plan_until: next.toISOString() }),
    prefer: "return=minimal",
  }, SUPA, SKEY).catch(() => {});

  return { ok: true, amount, next_billing_at: next.toISOString() };
}

exports.handler = async function (event) {
  const cors = {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Cron-Secret",
    "Content-Type": "application/json",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" }, cors);

  const secret = process.env.TOSS_SECRET_KEY;
  const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPA = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;

  if (!secret) return json(500, { error: "결제 서버 미설정", hint: "Netlify 환경변수 TOSS_SECRET_KEY 를 등록하세요." }, cors);
  if (!SKEY) return json(500, { error: "결제 서버 미설정", hint: "Netlify 환경변수 SUPABASE_SERVICE_ROLE_KEY 를 등록하세요." }, cors);

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (e) { return json(400, { error: "잘못된 요청" }, cors); }

  const ctx = { secret, SUPA, SKEY };
  const action = body.action || "issue";

  try {
    /* ── 1) 빌링키 발급 + 첫 결제 ── */
    if (action === "issue") {
      const { authKey, customerKey, memberId } = body;
      if (!authKey || !customerKey || !memberId) return json(400, { error: "필수 값 누락" }, cors);

      const planId = PLANS[body.plan] ? body.plan : "basic";
      const cycle = body.cycle === "year" ? "year" : "month";
      const amount = PLANS[planId][cycle];

      const issued = await tossCall(TOSS_ISSUE_URL, secret, { authKey, customerKey });
      const billingKey = issued.billingKey;
      if (!billingKey) return json(502, { error: "빌링키 발급 실패" }, cors);

      const now = new Date();
      const rows = await sb("subscriptions", {
        method: "POST",
        body: JSON.stringify({
          member_id: memberId,
          customer_key: customerKey,
          billing_key: billingKey,
          plan: planId,
          cycle,
          amount,
          status: "active",
          card_company: (issued.card && issued.card.company) || null,
          card_number: (issued.card && issued.card.number) || null,
          started_at: now.toISOString(),
          next_billing_at: now.toISOString(),
          updated_at: now.toISOString(),
        }),
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      }, SUPA, SKEY);

      const sub = Array.isArray(rows) ? rows[0] : rows;
      const charged = await chargeOne(
        { ...sub, member_id: memberId, billing_key: billingKey, customer_key: customerKey, plan: planId, cycle, amount },
        ctx
      );
      if (!charged.ok) return json(402, { error: charged.error }, cors);
      return json(200, { ok: true, plan: planId, cycle, amount, next_billing_at: charged.next_billing_at }, cors);
    }

    /* ── 2) 만기 도래분 자동 결제 (크론) ── */
    if (action === "charge-due") {
      const cronSecret = process.env.CRON_SECRET;
      if (cronSecret) {
        const got = (event.headers && (event.headers["x-cron-secret"] || event.headers["X-Cron-Secret"])) || body.cronSecret;
        if (got !== cronSecret) return json(401, { error: "unauthorized" }, cors);
      }
      const nowIso = new Date().toISOString();
      const due = await sb(
        "subscriptions?status=in.(active,past_due)&next_billing_at=lte." + encodeURIComponent(nowIso) + "&select=*",
        { method: "GET" }, SUPA, SKEY
      );
      const results = [];
      for (const sub of due || []) {
        const r = await chargeOne(sub, ctx);
        results.push({ member_id: sub.member_id, ok: r.ok, error: r.error || null });
      }
      return json(200, { ok: true, charged: results.length, results }, cors);
    }

    /* ── 3) 자동결제 해지 ── */
    if (action === "cancel") {
      const { memberId } = body;
      if (!memberId) return json(400, { error: "필수 값 누락" }, cors);
      await sb("subscriptions?member_id=eq." + memberId, {
        method: "PATCH",
        body: JSON.stringify({ status: "canceled", updated_at: new Date().toISOString() }),
        prefer: "return=minimal",
      }, SUPA, SKEY);
      return json(200, { ok: true }, cors);
    }

    return json(400, { error: "알 수 없는 요청" }, cors);
  } catch (e) {
    return json(e.status && e.status >= 400 && e.status < 500 ? 400 : 502, {
      error: (e && e.message) || "서버 오류",
      code: (e && e.code) || null,
    }, cors);
  }
};
