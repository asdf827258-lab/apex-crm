/* 고객이 한 말을 구조화해 남긴다 — 광고성과.html 에 얹는 한 겹.
 *
 * 왜 만들었나
 *   카카오 일반채널은 고객이 적은 걸 저장해 주지 않는다(알림톡·폼 둘 다 못 씀).
 *   그래서 들은 사람이 그 자리에서 남겨야 한다. 카톡이 끝난 직후 폰에서 누르기 좋게 칩으로 만들었다.
 *
 * 설계 원칙
 *   · 「무엇만」은 **하나만** 고르게 한다. 보험에 지친 사람에게 전체 점검은 또 하나의 숙제다.
 *   · 「이미 본 것」을 받는다. 같은 말을 두 번 하게 만들면 거기서 끝난다.
 *   · **고객 원문을 요약하지 않는다.** 쌓이면 다음 광고 카피가 여기서 나온다.
 *   · 이름·연락처는 받지 않는다. 고객 정보는 CRM 본 화면에 둔다.
 *
 * 저장 위치 : ad_inquiries 의 want / seen / tired / quote (2026-10-17 추가)
 * 읽기      : ad_v_voice (security_invoker · anon 차단)
 *
 * ⚠ 아래 iAdd 처리기는 광고성과.html 의 것을 **대체**한다. 원본이 바뀌면 여기도 맞춰야 한다.
 */
(function () {
  "use strict";

  var WANT = ["보험료 줄이기", "보장 확인", "청구 도움", "새로 가입", "그냥 궁금"];
  var SEEN = ["다른 설계사", "다이렉트·TM", "비교사이트", "지인 소개", "처음"];
  var TIRED = ["전화를 너무 받음", "설명이 어려움", "못 믿겠음", "바빠서 미룸", "비교가 어려움"];

  var CSS =
    ".vc{margin-top:16px;padding-top:16px;border-top:1px solid var(--line)}" +
    ".vc h3{font-size:13px;font-weight:700;color:var(--ink2);margin:14px 0 8px}" +
    ".vc h3 span{font-weight:400;color:var(--mute)}" +
    ".vc .chips{display:flex;flex-wrap:wrap;gap:7px}" +
    /* ⚠ 이 페이지엔 전역 button{width:100%} 가 있다. 안 되돌리면 칩이 한 줄에 하나씩 쌓인다 */
    ".vc .chip{width:auto;flex:0 0 auto;border:1px solid var(--line);background:var(--bg);" +
    "color:var(--ink2);border-radius:100px;padding:9px 15px;font:inherit;font-size:13.5px;" +
    "cursor:pointer;-webkit-tap-highlight-color:transparent}" +
    ".vc .chip[aria-pressed=true]{background:var(--bd);border-color:var(--bd);color:#fff;font-weight:700}" +
    ".vc textarea{width:100%;margin-top:6px;padding:11px 12px;border:1px solid var(--line);" +
    "border-radius:9px;background:var(--bg);color:var(--ink);font:inherit;font-size:14px;" +
    "line-height:1.6;min-height:76px;resize:vertical}" +
    ".vlist{margin-top:14px}" +
    ".vrow{border-top:1px solid var(--line);padding:12px 0}" +
    ".vrow .q{font-size:14px;line-height:1.65;color:var(--ink);white-space:pre-wrap}" +
    ".vrow .m{font-size:12px;color:var(--mute);margin-top:5px}";

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g,
      function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  /* 칩 한 줄. single=true 면 라디오처럼 하나만 남는다 */
  function chipRow(items, single) {
    var box = el("div", "chips");
    items.forEach(function (t) {
      var b = el("button", "chip", esc(t));
      b.type = "button";
      b.setAttribute("aria-pressed", "false");
      b.onclick = function () {
        var on = b.getAttribute("aria-pressed") === "true";
        if (single) box.querySelectorAll(".chip").forEach(function (o) {
          o.setAttribute("aria-pressed", "false");
        });
        b.setAttribute("aria-pressed", on ? "false" : "true");
      };
      box.appendChild(b);
    });
    box.picked = function () {
      return Array.prototype.filter
        .call(box.querySelectorAll(".chip"), function (b) { return b.getAttribute("aria-pressed") === "true"; })
        .map(function (b) { return b.textContent; });
    };
    box.clear = function () {
      box.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    };
    return box;
  }

  function boot() {
    var card = document.getElementById("inqCard");
    var addBtn = document.getElementById("iAdd");
    if (!card || !addBtn || typeof sb === "undefined") return setTimeout(boot, 400);

    document.head.appendChild(el("style", null, CSS));

    /* ── 입력칸 ────────────────────────────────────────────── */
    var wrap = el("div", "vc");
    wrap.appendChild(el("h3", null,
      "무엇만 도와드릴까요 <span>· 하나만. 전부 보자고 하면 부담스러워집니다</span>"));
    var cWant = chipRow(WANT, true); wrap.appendChild(cWant);

    wrap.appendChild(el("h3", null,
      "이미 보신 것 <span>· 같은 말을 두 번 하게 만들지 않으려고 받습니다</span>"));
    var cSeen = chipRow(SEEN, false); wrap.appendChild(cSeen);

    wrap.appendChild(el("h3", null, "어디서 지치셨나 <span>· 다음 대화의 톤이 여기서 정해집니다</span>"));
    var cTired = chipRow(TIRED, false); wrap.appendChild(cTired);

    wrap.appendChild(el("h3", null,
      "고객이 한 말 그대로 <span>· 요약하지 마세요. 쌓이면 다음 광고 문구가 됩니다</span>"));
    var ta = el("textarea");
    ta.id = "iQuote";
    ta.placeholder = "예) 보험이 몇 갠지도 모르겠어요. 전화는 자꾸 오는데 뭘 물어야 할지를 모르겠네요";
    wrap.appendChild(ta);

    card.insertBefore(wrap, document.getElementById("inqMsg"));

    /* ── 저장 (광고성과.html 의 처리기를 대체한다) ───────────── */
    var LAND = { "1514": "dbcompare", "1515": "dbcompare", "1516": "dbcompare",
                 "1517": "dbcompare", "1518": "dbcompare", "1519": "dbcompare",
                 "1548": "selfcheck", "1549": "selfcheck", "1550": "selfcheck",
                 "1551": "selfcheck", "1552": "selfcheck" };
    var msg = document.getElementById("inqMsg");

    addBtn.onclick = async function () {
      var cre = document.getElementById("iCre").value;
      var q = ta.value.trim();
      var memo = document.getElementById("iMemo").value.trim();
      var want = cWant.picked(), seen = cSeen.picked(), tired = cTired.picked();
      addBtn.disabled = true;
      var row = {
        creative_code: cre || null,
        landing: cre ? (LAND[cre] || "bojang") : null,
        channel: document.getElementById("iCh").value || null,
        medium: "meta",
        memo: memo || null,
        want: want.length ? want : null,
        seen: seen.length ? seen : null,
        tired: tired.length ? tired : null,
        quote: q || null,
        matched: false
      };
      var r = await sb.from("ad_inquiries").insert([row]);
      addBtn.disabled = false;
      if (r.error) {
        msg.innerHTML = '<div class="ok" style="color:var(--bad)">⚠️ 기록하지 못했습니다 — ' +
          esc(r.error.message) + "</div>";
        return;
      }
      document.getElementById("iMemo").value = "";
      document.getElementById("iCre").value = "";
      ta.value = ""; cWant.clear(); cSeen.clear(); cTired.clear();
      msg.innerHTML = '<div class="ok">✅ 기록했습니다. 위 숫자에 반영됩니다.</div>';
      setTimeout(function () { msg.innerHTML = ""; }, 4000);
      try { if (typeof load === "function") await load(); } catch (e) {}
      recent();
    };

    /* ── 들은 말 모아보기 ──────────────────────────────────── */
    var box = el("div", "card");
    box.innerHTML = '<h2>들은 말 모아보기</h2>' +
      '<p class="sub">고객이 한 말이 그대로 쌓입니다. ' +
      '다음 광고 문구와 상담 화법은 여기서 꺼내 쓰는 게 가장 잘 맞습니다.</p>' +
      '<div class="vlist" id="vlist"></div>';
    card.parentNode.insertBefore(box, card.nextSibling);

    async function recent() {
      var r = await sb.from("ad_v_voice").select("*").limit(40);
      var t = document.getElementById("vlist");
      if (r.error) { t.innerHTML = '<p class="sub">' + esc(r.error.message) + "</p>"; return; }
      var rows = (r.data || []).filter(function (x) { return x.quote || x.want || x.memo; });
      if (!rows.length) {
        t.innerHTML = '<p class="sub">아직 없습니다. 카톡이 오면 위에서 한 줄 남겨 주세요.</p>';
        return;
      }
      t.innerHTML = rows.map(function (x) {
        var tags = [].concat(x.want || [], x.seen || [], x.tired || []);
        return '<div class="vrow"><div class="q">' + esc(x.quote || x.memo) + "</div>" +
          '<div class="m">' + esc(x.d || "") +
          (x.creative_code ? " · 소재 " + esc(x.creative_code) : "") +
          (tags.length ? " · " + esc(tags.join(" / ")) : "") + "</div></div>";
      }).join("");
    }
    recent();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
