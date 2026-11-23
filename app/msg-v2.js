/* ═══════════════════════════════════════════════════════════════════
   msg-v2.js — 💬 <b>안부 · TA 카톡 · 문자 「보내기 화면」 — 고객 폰에 보일 모습 그대로</b> (판 X512)

   사장님 말씀 (2026-11-21)
     「안부 카톡이나 문자도 디자인 짜라니까 하나도 안되어 있고」
     → 고르신 것: 「보내는 화면을 카톡처럼」 · 「고객 화면에도 안부 보내기」

   ── 무엇을 하나 ──────────────────────────────────────────────────
   ★ 아래에서 올라오는 시트 하나 — 카톡 · 문자 고르기 → 보낼 글 고르기(칩) → <b>고객 폰에 보일 말풍선</b>
     (카톡은 노란 말풍선 · 문자는 파란 말풍선) → ✏️ 고쳐 쓰기 → 카톡은 복사 · 문자는 문자 앱 → ✅ 보냈어요.
   ★ 글은 <b>부르는 쪽이 라이브 원본에서</b> 넘깁니다 — 이 파일은 글을 짓지 않습니다:
       오늘 화면 카드  — HM_TAMSG.list · text (계약 고객 안부 MST_TOUCH · TA 스크립트 문자·카톡 TA_MSG)
       고객 화면       — ccMsgText(이분께 맞춘 글) · MST_TOUCH · TA_MSG
   ★ 저장하지 않습니다 — 「보냈어요」 는 부르는 쪽이 준 onSent 를 부르기만 합니다(홈 hmQfin · 고객 cmTouchAdd).
   ★ 서버를 부르지 않습니다. 옷은 #mv2Sheet · #mv2Dim 아래로만.

   부르는 법  MSG_V2.open({ who:'이름', tel:'010…', items:[{ lb:'💳 보험료 잘 빠지는지', note:'왜', text:function(ch){…} }],
                            ch:'kakao'|'sms', onSent:function(item, ch, text){…} })
   점검: scripts/check-cusv2.js [11]
   ═══════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var ST = null;   /* 지금 열린 것 — { o, i, ch, edit, txt:{} } */

  function el(id) { return g.document.getElementById(id); }
  function E(s) {
    if (typeof g.osEsc === 'function') return g.osEsc(s == null ? '' : String(s));
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function T(fn, def) { try { var v = fn(); return (v === undefined || v === null) ? def : v; } catch (e) { return def; } }
  function strip(s) { return String(s == null ? '' : s).replace(/<[^>]*>/g, ''); }
  function hhmm() {
    var d = new Date(), h = d.getHours(), m = ('0' + d.getMinutes()).slice(-2);
    return (h < 12 ? '오전 ' : '오후 ') + (h % 12 || 12) + ':' + m;
  }

  function css() {
    var d = g.document;
    if (el('msgV2Css')) return;
    var C = [
      '#mv2Dim{position:fixed;inset:0;background:rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:opacity .2s;z-index:9992}',
      '#mv2Dim.on{opacity:1;pointer-events:auto}',
      '#mv2Sheet{--ink:#191F28;--sub:#4E5968;--sub2:#6B7684;--sub3:#8B95A1;--line2:#F2F4F6;--blue:#1A56DB;--blue-l:#EAF1FF;' +
        'position:fixed;left:0;right:0;bottom:0;margin:0 auto;max-width:560px;background:#F2F4F6;border-radius:24px 24px 0 0;max-height:92vh;overflow-y:auto;' +
        'transform:translateY(102%);transition:transform .28s cubic-bezier(.2,.8,.2,1);z-index:9993;padding:10px 20px calc(24px + env(safe-area-inset-bottom,0px));' +
        'scrollbar-width:none;color:var(--ink);font-size:15px;line-height:1.45;word-break:keep-all;-webkit-font-smoothing:antialiased}',
      '#mv2Sheet.on{transform:none}',
      '#mv2Sheet *{box-sizing:border-box}',
      '#mv2Sheet button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;margin:0}',
      '#mv2Sheet .grab{width:40px;height:5px;border-radius:3px;background:#D1D6DB;margin:0 auto 12px}',
      '#mv2Sheet .who2{font-size:14px;color:var(--sub2);font-weight:600}',
      '#mv2Sheet h1{font-size:24px;font-weight:800;letter-spacing:-.4px;line-height:1.3;margin:4px 0 12px}',
      /* 카톡 · 문자 */
      '#mv2Sheet .seg{display:grid;grid-template-columns:1fr 1fr;gap:4px;background:#E5E8EB;border-radius:14px;padding:4px}',
      '#mv2Sheet .seg button{height:44px;border-radius:11px;font-size:15px;font-weight:700;color:var(--sub);text-align:center}',
      '#mv2Sheet .seg button.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.08)}',
      /* 글 고르기 */
      '#mv2Sheet .chips{display:flex;flex-wrap:nowrap;gap:6px;overflow-x:auto;scrollbar-width:none;margin:12px -20px 0;padding:0 20px 2px}',
      '#mv2Sheet .chips::-webkit-scrollbar{display:none}',
      '#mv2Sheet .chips button{flex:none;white-space:nowrap;height:40px;padding:0 13px;border-radius:20px;background:#fff;font-size:14px;font-weight:600;color:var(--sub)}',
      '#mv2Sheet .chips button.on{background:var(--ink);color:#fff}',
      '#mv2Sheet .note{font-size:13px;color:var(--blue);background:var(--blue-l);border-radius:10px;padding:8px 10px;margin-top:10px}',
      /* 고객 폰 — 카톡 */
      '#mv2Sheet .ph{margin-top:12px;border-radius:22px;overflow:hidden;border:1px solid #D9DEE3;background:#fff}',
      '#mv2Sheet .ph-top{display:flex;align-items:center;gap:10px;height:48px;padding:0 14px;font-size:15px;font-weight:700}',
      '#mv2Sheet .ph-top .bk{font-size:22px;color:var(--sub);font-weight:400}',
      '#mv2Sheet .ph-top .av{width:30px;height:30px;border-radius:11px;display:grid;place-items:center;font-size:13px;font-weight:800;background:#E5E8EB;color:var(--sub)}',
      '#mv2Sheet .ph-top small{display:block;font-size:12px;font-weight:500;color:var(--sub3)}',
      '#mv2Sheet .ph-body{padding:16px 12px 18px;min-height:150px}',
      '#mv2Sheet .ph.kk .ph-top{background:#BACEE0}',
      '#mv2Sheet .ph.kk .ph-body{background:#BACEE0}',
      '#mv2Sheet .ph .day{text-align:center;margin:0 0 12px}',
      '#mv2Sheet .ph .day span{display:inline-block;font-size:12px;padding:3px 10px;border-radius:10px;background:rgba(0,0,0,.12);color:#fff}',
      '#mv2Sheet .ph.sm .day span{background:none;color:var(--sub3)}',
      '#mv2Sheet .row{display:flex;justify-content:flex-end;align-items:flex-end;gap:5px}',
      '#mv2Sheet .meta{display:flex;flex-direction:column;align-items:flex-end;font-size:11px;color:#556677;line-height:1.3;flex:none}',
      '#mv2Sheet .meta b{color:#F5C400;font-weight:800}',
      '#mv2Sheet .bub{max-width:78%;padding:9px 12px;font-size:15px;line-height:1.5;white-space:pre-wrap;word-break:break-all;text-align:left}',
      '#mv2Sheet .ph.kk .bub{background:#FEE500;color:#191919;border-radius:14px 4px 14px 14px}',
      /* 고객 폰 — 문자 */
      '#mv2Sheet .ph.sm .ph-top{justify-content:center;flex-direction:column;gap:2px;height:auto;padding:10px 14px;border-bottom:1px solid var(--line2);text-align:center}',
      '#mv2Sheet .ph.sm .ph-top .av{width:40px;height:40px;border-radius:50%;font-size:16px}',
      '#mv2Sheet .ph.sm .bub{background:#1A73E8;color:#fff;border-radius:18px 18px 4px 18px}',
      '#mv2Sheet .ph.sm .meta{color:var(--sub3)}',
      /* 고쳐 쓰기 */
      '#mv2Sheet .edt{width:100%;min-height:170px;margin-top:12px;border:1.5px solid var(--blue);border-radius:16px;padding:12px 14px;font:inherit;font-size:15px;line-height:1.55;background:#fff;color:var(--ink);resize:vertical}',
      '#mv2Sheet .tools{display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:13px;color:var(--sub3)}',
      '#mv2Sheet .tools button{height:40px;padding:0 10px;font-size:14px;font-weight:700;color:var(--blue)}',
      '#mv2Sheet .btn{display:flex;align-items:center;justify-content:center;gap:6px;height:52px;border-radius:14px;font-size:16px;font-weight:700;width:100%;text-align:center;margin-top:10px;text-decoration:none}',
      '#mv2Sheet .btn.kk{background:#FEE500;color:#191919}',
      '#mv2Sheet .btn.sm{background:#1A73E8;color:#fff}',
      '#mv2Sheet .btn.g{background:#fff;color:var(--ink)}',
      '#mv2Sheet .btn.ok{background:var(--ink);color:#fff}',
      '#mv2Sheet .empty{background:#fff;border-radius:16px;padding:18px;margin-top:12px;color:var(--sub2);text-align:center}'
    ];
    var s = d.createElement('style'); s.id = 'msgV2Css'; s.textContent = C.join('\n');
    (d.head || d.documentElement).appendChild(s);
  }

  function cur() { return ST && ST.o.items[ST.i] ? ST.o.items[ST.i] : null; }
  /* 지금 보일 글 — 고쳐 쓴 것이 있으면 그것, 없으면 부르는 쪽이 준 글(채널별) */
  function textNow() {
    var it = cur(); if (!it) return '';
    var key = ST.i + ':' + ST.ch;
    if (ST.txt[key] != null) return ST.txt[key];
    var t = T(function () { return typeof it.text === 'function' ? it.text(ST.ch) : it.text; }, '') || '';
    return String(t);
  }
  function telOf() { return String((ST && ST.o.tel) || '').replace(/[^0-9+]/g, ''); }

  function html() {
    var o = ST.o, it = cur(), who = o.who || '고객', ch = ST.ch, tx = textNow();
    var h = '<div class="grab"></div><div class="who2">' + E(who) + '님께</div><h1>' + E(o.title || '💬 보내기') + '</h1>' +
      '<div class="seg"><button type="button" class="' + (ch === 'kakao' ? 'on' : '') + '" onclick="MSG_V2.ch(\'kakao\')">💬 카톡</button>' +
      '<button type="button" class="' + (ch === 'sms' ? 'on' : '') + '" onclick="MSG_V2.ch(\'sms\')">✉️ 문자</button></div>';
    if (!o.items.length) return h + '<div class="empty">보낼 글이 아직 없어요</div>';
    if (o.items.length > 1) h += '<div class="chips">' + o.items.map(function (x, i) {
      return '<button type="button" class="' + (i === ST.i ? 'on' : '') + '" onclick="MSG_V2.pick(' + i + ')">' + E(x.lb) + '</button>';
    }).join('') + '</div>';
    if (it && it.note) h += '<div class="note">' + E(strip(it.note)) + '</div>';
    if (ST.edit) {
      h += '<textarea class="edt" id="mv2Edit" oninput="MSG_V2.typed(this.value)">' + E(tx) + '</textarea>' +
        '<div class="tools"><span>' + tx.length + '자</span><button type="button" onclick="MSG_V2.edit(false)">✓ 다 고쳤어요</button></div>';
    } else {
      var av = E(String(who).charAt(0));
      h += ch === 'kakao'
        ? '<div class="ph kk"><div class="ph-top"><span class="bk">‹</span><span class="av">' + av + '</span><span>' + E(who) + '</span></div>' +
          '<div class="ph-body"><div class="day"><span>오늘</span></div><div class="row"><div class="meta"><b>1</b>' + hhmm() + '</div><div class="bub">' + E(tx) + '</div></div></div></div>'
        : '<div class="ph sm"><div class="ph-top"><span class="av">' + av + '</span><span>' + E(who) + '<small>' + E(o.tel || '번호 없음') + '</small></span></div>' +
          '<div class="ph-body"><div class="day"><span>문자 메시지 · 오늘 ' + hhmm() + '</span></div><div class="row"><div class="bub">' + E(tx) + '</div></div></div></div>';
      h += '<div class="tools"><span>' + tx.length + '자' + (ch === 'sms' && tx.length > 90 ? ' · 장문(LMS)' : '') + '</span><button type="button" onclick="MSG_V2.edit(true)">✏️ 고쳐 쓰기</button></div>';
    }
    h += ch === 'kakao'
      ? '<button type="button" class="btn kk" onclick="MSG_V2.go()">💬 복사하고 카톡에 붙여 넣기</button>'
      : '<button type="button" class="btn sm" onclick="MSG_V2.go()">✉️ 문자 앱으로 보내기</button>';
    h += '<button type="button" class="btn ok" onclick="MSG_V2.sent()">✅ 보냈어요</button>' +
      '<button type="button" class="btn g" onclick="MSG_V2.close()">닫기</button>';
    return h;
  }
  function paint() { var sh = el('mv2Sheet'); if (sh && ST) sh.innerHTML = html(); }

  function open(o) {
    try {
      o = o || {}; o.items = (o.items || []).filter(function (x) { return x && x.lb; });
      css();
      ST = { o: o, i: 0, ch: o.ch === 'sms' ? 'sms' : 'kakao', edit: false, txt: {} };
      var d = g.document, dim = el('mv2Dim'), sh = el('mv2Sheet');
      if (!dim) { dim = d.createElement('div'); dim.id = 'mv2Dim'; dim.setAttribute('onclick', 'MSG_V2.close()'); d.body.appendChild(dim); }
      if (!sh) { sh = d.createElement('div'); sh.id = 'mv2Sheet'; d.body.appendChild(sh); }
      paint(); sh.scrollTop = 0;
      g.setTimeout(function () { dim.classList.add('on'); sh.classList.add('on'); }, 10);
    } catch (e) {}
  }
  function close() { var a = el('mv2Dim'), b = el('mv2Sheet'); if (a) a.classList.remove('on'); if (b) b.classList.remove('on'); }
  function copy(t) {
    try { if (typeof g.copyText === 'function') { g.copyText(t); return; } } catch (e) {}
    try { g.navigator.clipboard.writeText(t); } catch (e2) {}
  }
  function toast(m) { try { if (typeof g.toast === 'function') g.toast(m); } catch (e) {} }

  g.MSG_V2 = {
    open: open, close: close,
    ch: function (c) { if (!ST) return; ST.ch = c === 'sms' ? 'sms' : 'kakao'; paint(); },
    pick: function (i) { if (!ST) return; ST.i = i; ST.edit = false; paint(); },
    edit: function (v) { if (!ST) return; ST.edit = !!v; paint(); var t = el('mv2Edit'); if (t) try { t.focus(); } catch (e) {} },
    typed: function (v) { if (!ST) return; ST.txt[ST.i + ':' + ST.ch] = String(v); },
    go: function () {
      if (!ST) return;
      var t = textNow(), tel = telOf();
      if (ST.ch === 'sms' && tel) {
        try { g.location.href = 'sms:' + tel + '?&body=' + encodeURIComponent(t); } catch (e) {}
        return;
      }
      copy(t);
      toast(ST.ch === 'sms' ? '번호가 없어 글만 복사했어요 — 문자 앱에 붙여 넣으세요' : '복사했어요 — 카톡 대화방에 붙여 넣으세요');
    },
    sent: function () {
      if (!ST) return;
      var it = cur(), t = textNow(), ch = ST.ch;
      try { if (typeof ST.o.onSent === 'function') ST.o.onSent(it, ch, t); } catch (e) {}
      close();
    },
    state: function () { return ST; }
  };
})(window);
