/* 연락처와 「다음에 할 일」을 남긴다 — 광고성과.html 에 얹는 한 겹.
 *
 * 왜 만들었나
 *   인스타 DM 은 상대가 대화를 지우면 그걸로 끝이다. 카톡도 나가면 닿을 길이 없다.
 *   전화번호가 있어야 다시 연락하고 관리할 수 있다.
 *   그런데 **랜딩페이지가 번호를 받는 것은 심의 조건으로 영구 금지**다.
 *   그래서 번호는 오직 **대화 중에 고객이 직접 준 것**만 여기에 적는다.
 *
 * 설계 원칙
 *   · 번호는 **선택**이다. 안 주면 안 적는다. 조르지 않는다.
 *   · 번호를 적으면 **「연락해도 된다고 하셨나요」를 반드시 묻는다.**
 *     체크가 없으면 저장은 되지만 「다시 연락할 사람」에 안 띄운다 — 연락하면 안 되니까.
 *   · clients 테이블의 동의 모델을 **우회하지 않는다.** 정식 고객 등록은 CRM 본 화면에서 한다.
 *     여기는 「아직 고객이 아닌 문의」를 놓치지 않기 위한 자리다.
 *   · 다음 할 일은 **날짜 + 한 줄**이면 족하다. 할 일 관리 도구를 또 만들지 않는다.
 *
 * 저장 위치 : ad_inquiries 의 phone / consent_at / next_at / next_todo
 *             (migration ad_inquiries_contact_and_followup, 2026-11-03)
 * 권한      : ad_inquiries 는 authenticated 전용이다(anon 정책 없음).
 *
 * ⚠ 이 파일은 광고성과_목소리.js **다음에** 실행되어야 한다.
 *   목소리.js 가 #iAdd 의 처리기를 갈아끼우므로, 그 위에 다시 얹는다.
 *   두 파일 모두 defer 라 문서 순서대로 실행된다 — script 줄 순서를 바꾸지 말 것.
 */
(function () {
  "use strict";

  var CSS =
    ".ct{margin-top:16px;padding-top:16px;border-top:1px solid var(--line)}" +
    ".ct h3{font-size:13px;font-weight:700;color:var(--ink2);margin:0 0 8px}" +
    ".ct h3 span{font-weight:400;color:var(--mute)}" +
    ".ct .row{display:flex;flex-wrap:wrap;gap:8px}" +
    ".ct .row>*{flex:1 1 150px;min-width:0}" +
    ".ct input{width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:9px;" +
    "background:var(--bg);color:var(--ink);font:inherit;font-size:14px}" +
    /* ⚠ 이 페이지엔 전역 button{width:100%} 가 있다 — 동의 체크는 버튼이 아니라 label 로 만든다 */
    ".ct .ok{display:flex;align-items:center;gap:8px;margin-top:9px;font-size:13.5px;" +
    "color:var(--ink2);cursor:pointer}" +
    ".ct .ok input{width:18px;height:18px;flex:0 0 auto;padding:0}" +
    ".ct .warn{margin-top:7px;font-size:12.5px;color:#C23B3B;line-height:1.55}" +
    ".nx{margin-top:14px}" +
    ".nx .hd{display:flex;align-items:baseline;gap:8px;margin-bottom:4px}" +
    ".nx h2{font-size:16px;margin:0}" +
    ".nx .cnt{font-size:12.5px;color:var(--mute)}" +
    ".nrow{border-top:1px solid var(--line);padding:12px 0;display:flex;" +
    "align-items:flex-start;gap:10px}" +
    ".nrow .d{flex:0 0 auto;font-size:12.5px;font-weight:700;color:var(--mute);" +
    "min-width:52px;padding-top:2px}" +
    ".nrow.late .d{color:#C23B3B}" +
    ".nrow .b{flex:1 1 auto;min-width:0}" +
    ".nrow .t{font-size:14px;line-height:1.6;color:var(--ink)}" +
    ".nrow .m{font-size:12px;color:var(--mute);margin-top:4px}" +
    ".nrow a.tel{display:inline-block;margin-top:6px;font-size:13.5px;font-weight:700;" +
    "color:var(--bd);text-decoration:none}" +
    ".nrow .no{display:inline-block;margin-top:6px;font-size:12.5px;color:#C23B3B}";

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  /* 숫자만 남긴다. 010-1234-5678 / 010 1234 5678 / +82 10 … 을 모두 받아들인다. */
  function digits(s) {
    var d = String(s || "").replace(/[^0-9]/g, "");
    if (d.indexOf("8210") === 0) d = "0" + d.slice(2);
    return d;
  }
  function phoneOk(s) {
    var d = digits(s);
    return d.length >= 9 && d.length <= 11;
  }
  function today() {
    var t = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    return t.toISOString().slice(0, 10);
  }

  function boot() {
    var card = document.getElementById("inqCard");
    var addBtn = document.getElementById("iAdd");
    if (!card || !addBtn) return false;

    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);

    /* ── 입력 칸 ───────────────────────────────────────────── */
    var wrap = el("div", "ct");
    wrap.appendChild(el("h3", null,
      '연락처 <span>고객이 먼저 주셨을 때만 — 묻지 않습니다</span>'));
    var row = el("div", "row");
    var ph = el("input");
    ph.id = "cPhone"; ph.type = "tel"; ph.inputMode = "numeric";
    ph.placeholder = "010-0000-0000";
    ph.autocomplete = "off";
    row.appendChild(ph);
    wrap.appendChild(row);

    var okLab = el("label", "ok");
    var okBox = el("input");
    okBox.type = "checkbox"; okBox.id = "cOk";
    okLab.appendChild(okBox);
    okLab.appendChild(document.createTextNode("연락해도 된다고 하셨습니다"));
    wrap.appendChild(okLab);
    var warn = el("div", "warn");
    warn.id = "cWarn";
    wrap.appendChild(warn);

    wrap.appendChild(el("h3", null,
      '다시 연락할 날 <span>그날 「다시 연락할 사람」에 뜹니다</span>'));
    var row2 = el("div", "row");
    var dt = el("input"); dt.id = "cNext"; dt.type = "date";
    var td = el("input"); td.id = "cTodo";
    td.placeholder = "증권 받아서 보장 정리해 드리기";
    row2.appendChild(dt); row2.appendChild(td);
    wrap.appendChild(row2);

    card.insertBefore(wrap, document.getElementById("inqMsg"));

    function paintWarn() {
      var has = ph.value.trim() !== "";
      if (has && !phoneOk(ph.value)) {
        warn.textContent = "번호가 짧거나 깁니다. 들은 그대로 다시 확인해 주세요.";
      } else if (has && !okBox.checked) {
        warn.textContent =
          "연락해도 된다는 말을 못 들으셨으면 체크하지 마세요. " +
          "저장은 되지만 「다시 연락할 사람」에는 안 띄웁니다.";
      } else {
        warn.textContent = "";
      }
    }
    ph.oninput = paintWarn;
    okBox.onchange = paintWarn;

    /* ── 저장에 얹기 ───────────────────────────────────────── */
    var prev = addBtn.onclick;
    addBtn.onclick = async function (ev) {
      var raw = ph.value.trim();
      if (raw && !phoneOk(raw)) { paintWarn(); ph.focus(); return; }
      window.__apexContact = {
        phone: raw ? digits(raw) : null,
        consent_at: (raw && okBox.checked) ? new Date().toISOString() : null,
        next_at: dt.value || null,
        next_todo: td.value.trim() || null
      };
      if (prev) await prev.call(this, ev);
      ph.value = ""; okBox.checked = false;
      dt.value = ""; td.value = ""; warn.textContent = "";
      window.__apexContact = null;
      setTimeout(loadNext, 600);
    };

    /* 앞 겹이 만든 insert 에 이 네 칸을 끼워 넣는다.
       supabase-js 의 insert 를 한 번 감싼다 — ad_inquiries 로 가는 것만 건드린다. */
    hookInsert();

    /* ── 다시 연락할 사람 ──────────────────────────────────── */
    var box = el("div", "card nx");
    box.id = "nextCard";
    box.innerHTML =
      '<div class="hd"><h2>다시 연락할 사람</h2>' +
      '<span class="cnt" id="nxCnt"></span></div>' +
      '<p class="sub">약속한 날이 오늘이거나 지난 분들입니다. ' +
      '번호를 주셨고 <b>연락해도 된다고 하신 분만</b> 전화 버튼이 보입니다.</p>' +
      '<div id="nxList"></div>';
    card.parentNode.insertBefore(box, card.nextSibling);
    loadNext();
    return true;
  }

  /* insert 를 감싸서 연락 칸을 함께 보낸다.
     ⚠ 앞 겹(목소리)의 코드를 고치지 않으려고 이 방법을 쓴다. */
  var wrapped = null;
  function hookInsert() {
    function wrap(client) {
      if (!client || client.__apexWrapped) return;
      var from = client.from.bind(client);
      client.from = function (name) {
        var q = from(name);
        if (name === "ad_inquiries" && q && typeof q.insert === "function") {
          var ins = q.insert.bind(q);
          q.insert = function (rows) {
            var c = window.__apexContact;
            if (c && Array.isArray(rows)) {
              rows.forEach(function (r) {
                if (c.phone) r.phone = c.phone;
                if (c.consent_at) r.consent_at = c.consent_at;
                if (c.next_at) r.next_at = c.next_at;
                if (c.next_todo) r.next_todo = c.next_todo;
              });
            }
            return ins(rows);
          };
        }
        return q;
      };
      client.__apexWrapped = true;
      wrapped = client;
    }
    /* sb 는 로그인할 때 만들어지고, 다시 대입되기도 한다. 바뀌면 다시 감싼다. */
    setInterval(function () {
      if (typeof sb !== "undefined" && sb && sb !== wrapped) wrap(sb);
    }, 500);
  }

  async function loadNext() {
    var list = document.getElementById("nxList");
    var cnt = document.getElementById("nxCnt");
    if (!list || typeof sb === "undefined" || !sb) return;
    var r = await sb.from("ad_inquiries")
      .select("id,at,alias,memo,phone,consent_at,next_at,next_todo,channel,stage")
      .not("next_at", "is", null)
      .lte("next_at", today())
      .order("next_at", { ascending: true })
      .limit(50);
    if (r.error) {
      list.innerHTML = '<div class="vrow"><div class="m">읽지 못했습니다 — ' +
        esc(r.error.message) + "</div></div>";
      return;
    }
    var rows = r.data || [];
    cnt.textContent = rows.length ? rows.length + "명" : "";
    if (!rows.length) {
      list.innerHTML = '<div class="vrow"><div class="m">' +
        "오늘 다시 연락하기로 한 분은 없습니다.</div></div>";
      return;
    }
    var out = "";
    rows.forEach(function (x) {
      var late = x.next_at < today();
      var d = String(x.next_at).slice(5).replace("-", "/");
      var who = x.alias || x.memo || "(메모 없음)";
      out += '<div class="nrow' + (late ? " late" : "") + '">' +
        '<div class="d">' + esc(d) + (late ? " 지남" : "") + "</div>" +
        '<div class="b"><div class="t">' + esc(x.next_todo || who) + "</div>" +
        '<div class="m">' + esc(who) + " · " + esc(x.channel || "경로 모름") + "</div>";
      if (x.phone && x.consent_at) {
        out += '<a class="tel" href="tel:' + esc(x.phone) + '">📞 ' +
          esc(x.phone) + "</a>";
      } else if (x.phone) {
        out += '<span class="no">번호는 있지만 연락 동의를 못 받았습니다</span>';
      }
      out += "</div></div>";
    });
    list.innerHTML = out;
  }

  /* 로그인 전에는 #inqCard 가 숨어 있다. 나타날 때까지 지켜본다. */
  if (!boot()) {
    var n = 0;
    var t = setInterval(function () {
      if (boot() || ++n > 120) clearInterval(t);
    }, 500);
  }
})();
