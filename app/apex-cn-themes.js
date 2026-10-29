/*
 * APEX YUN PRO — 캐러셀 매거진 테마 4종 + 아이디·출처 칸
 * ════════════════════════════════════════════════════════════════════════
 * [정책·상품 뉴스] 맨 위 「📅 오늘의 카드뉴스」(#cnHost) 에 붙는다.
 *
 * 2026-10-28 · 사장님 말씀 「4가지 테마를 만들었어 — 내 메인세션 캐러셀
 * 만들기에 접목해서 뉴스를 이 카테고리로 만들 수 있도록, 아이디/출처
 * 만드는 부분들을 따로 만들어서」. 참고 이미지 20장을 네 갈래로 옮겼다.
 *
 *   lime  📁 라임 매거진 — 사진 위 흰 글씨 + 라임 형광 띠 + 노란 폴더
 *   note  💙 블루 노트   — 연하늘 바탕 + 「01.」 머리 + 테이프 붙인 메모지
 *   zine  💗 핑크 진     — 찢어진 종이 + 핑크 테이프 번호 + 스티커·낙서
 *   app   📱 앱 화면     — 휴대폰 앱 상단바 + 노트 카드 + 체크 목록
 *
 * ── 그리는 법 ─────────────────────────────────────────────────────────
 * 한 장을 1080×1350 짜리 HTML 하나로 만든다. 화면 미리보기는 그것을
 * 줄여(scale) 보여 주고, 저장은 같은 HTML 을 html2canvas 로 굽는다.
 * 그래서 「보이는 그대로」 저장된다 — 캔버스로 따로 그리면 두 벌이 된다.
 * ⚠ html2canvas 는 filter·clip-path 를 못 그린다. 흐린 배경은 미리 캔버스로
 *   흐려 둔 사진(cxBlur)을, 찢어진 종이는 SVG 를 쓴다.
 *
 * ── 아이디 · 출처 ─────────────────────────────────────────────────────
 * 「🏷 내 계정 · 출처」 칸에 적은 값은 이 브라우저(localStorage)에만 둔다.
 * 출처는 cnSrcOf() 를 감싸서 바꾸므로 기존 뉴스 카드 스타일의 마지막 장에도
 * 같이 찍힌다. ★ 출처를 비워 두면 원래대로(AI 가 적은 출처 · 주제의 출처) —
 *   없으면 빈손이다. 지어내지 않는다 (CLAUDE.md 1번).
 *
 * ── 이 파일을 따로 둔 이유 ────────────────────────────────────────────
 * app/index.html 은 여럿이 동시에 고친다. 거기엔 <script> 한 줄만 넣고
 * 나머지는 원래 함수를 감싸서(monkey-patch) 처리한다.
 *   cnSlidePreview · renderTodayCard · cnSrcOf · cnImgPrompt
 *   cardnewsSaveOne · cardnewsSaveAll
 *
 * ── 누구나 따라 하게 (판 X228) ─────────────────────────────────────────
 * 사장님 말씀 「누구도 따라할수 있게 했어?」 → 「응 그렇게 해」.
 * 테마 넷과 칸 다섯이 한꺼번에 서 있어 처음 보는 팀원은 무엇부터 할지 몰랐다.
 * ① 테마 → ② 내 아이디 → ③ 사진 → ④ 저장 단계 줄을 세우고, 끝난 단계는 ✓,
 * 지금 할 단계는 강조한다. 단계를 누르면 그 일을 바로 한다.
 * 저장할 때 아이디·심의필이 비었으면 <b>한 번 묻는다</b> — 막지는 않는다(6번).
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof window.renderTodayCard !== 'function') return;

  var THEMES = [
    { id: 'lime', ic: '📁', name: '라임 매거진', sub: '사진 + 형광 띠', sw: ['#1B1B1B', '#B6FF3B', '#FFC83D'] },
    { id: 'note', ic: '💙', name: '블루 노트', sub: '연하늘 + 메모지', sw: ['#E6EAED', '#5AC8FA', '#111111'] },
    { id: 'zine', ic: '💗', name: '핑크 진', sub: '찢은 종이 + 스티커', sw: ['#F3F3F1', '#FF5FA2', '#D4F75A'] },
    { id: 'app', ic: '📱', name: '앱 화면', sub: '앱 상단바 + 노트', sw: ['#4E7891', '#1DA1F2', '#FFFFFF'] }
  ];
  function isMine(s) { for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === s) return true; return false; }
  function themeOf(s) { for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === s) return THEMES[i]; return null; }

  /* ── 내 계정 · 출처 (이 브라우저에만) ── */
  var KEY = 'apex_cn_brand_v1';
  var B = { id: '', mast: '', src: '', tags: '', seal: '', theme: '', who: '' };
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv) for (var k in sv) if (B.hasOwnProperty(k)) B[k] = '' + (sv[k] || ''); } catch (e) {}
  function bSave() { try { localStorage.setItem(KEY, JSON.stringify(B)); } catch (e) {} }
  if (isMine(B.theme) && window.CN) window.CN.style = B.theme;

  function E(s) { return (typeof osEsc === 'function') ? osEsc(s) : ('' + (s == null ? '' : s)).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cxId() { var v = ('' + B.id).trim(); if (!v) return '@내아이디'; return v.charAt(0) === '@' ? v : '@' + v; }
  function cxMast() { return ('' + B.mast).trim() || 'APEX YUN PRO'; }
  function cxShort() { var w = cxMast().split(/\s+/)[0] || 'APEX'; return w.slice(0, 6); }
  var _origSrc = window.cnSrcOf;
  function autoSrc() { try { return _origSrc ? ('' + (_origSrc() || '')) : ''; } catch (e) { return ''; } }
  function cxSrc() { return ('' + B.src).trim() || autoSrc(); }
  function cxDate() { try { return cnDateStr(); } catch (e) { return ''; } }
  function cxDow() { return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()]; }
  function cxMonth() { var d = new Date(); return ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'][d.getMonth()] + ' ' + d.getFullYear(); }
  function cxTags(sl) {
    var out = [], raw = ('' + B.tags).trim();
    if (raw) out = raw.split(/[\s,]+/).filter(Boolean).map(function (t) { return t.charAt(0) === '#' ? t : '#' + t; });
    if (!out.length) { try { var cap = (CN.aiPlan && CN.aiPlan.caption) || ''; out = (('' + cap).match(/#[^\s#]+/g) || []); } catch (e) {} }
    if (!out.length) { var m = cnMagText(sl || {}); var kk = ('' + (m.k || '')).replace(/^[^\w가-힣]+/, '').replace(/\s+/g, ''); if (kk && !/^POINT/i.test(kk)) out.push('#' + kk); }
    if (!out.length) out.push('#' + cxMast().replace(/\s+/g, ''));
    return out.slice(0, 2);
  }
  var DISC = '본 콘텐츠는 일반적인 정보 제공 목적이며, 투자·의료·보험의 최종 판단은 개인 상황과 공식 자료 확인 후 결정해야 합니다.';

  /* ── 글 다루기 ── */
  function plain(t) { return ('' + (t || '')).replace(/\*\*/g, ''); }
  /* 강조(**…**) 가 없으면 여러 줄 제목의 마지막 줄을 강조한다 — 참고 디자인이 그렇다 */
  function autoHl(t) { t = '' + (t || ''); if (t.indexOf('**') >= 0) return t; var ls = t.split('\n'); if (ls.length > 1) { ls[ls.length - 1] = '**' + ls[ls.length - 1] + '**'; return ls.join('\n'); } return t; }
  function hl(t, cls) { return E(t).replace(/\*\*(.+?)\*\*/g, '<span class="' + cls + '">$1</span>').replace(/\n/g, '<br>'); }
  /* 한 줄씩 나눈다 — 줄마다 형광 띠를 따로 칠할 때 */
  function linesOf(t) { return ('' + (t || '')).split('\n').filter(function (x) { return x.trim(); }); }
  /* 메모지 줄 칸 — 12자 남짓으로 끊는다 (줄 칸 사이에 글이 걸치지 않게) */
  function rowsOf(t, max) {
    var out = [];
    linesOf(t).forEach(function (ln) {
      var bare = plain(ln); if (bare.length <= max) { out.push(ln); return; }
      var ws = ln.split(' '), cur = '';
      ws.forEach(function (w) { var nx = cur ? cur + ' ' + w : w; if (plain(nx).length > max && cur) { out.push(cur); cur = w; } else cur = nx; });
      if (cur) out.push(cur);
    });
    /* 줄을 넘어 갈라진 ** 짝을 맞춘다 */
    var open = false;
    return out.map(function (r) { var s = (open ? '**' : '') + r; var c = (r.match(/\*\*/g) || []).length; if (c % 2) open = !open; if (open) s += '**'; return s; });
  }
  function splitItem(it) {
    var s = '' + (it || ''), m = s.match(/^\s*\[?([^\]:：—\-]{1,10})\]?\s*[:：—\-]\s*(.+)$/);
    return m ? { lb: m[1].trim(), tx: m[2].trim() } : { lb: '', tx: s.trim() };
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function sub2(s, n) { s = '' + (s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  /* ── 사진 ── */
  function phUrl(idx) { var im = CN.imgs && CN.imgs[idx]; return (im && im.url) ? im.url : ''; }
  function anyIdx(idx) { if (phUrl(idx)) return idx; for (var k in CN.imgs) if (CN.imgs.hasOwnProperty(k) && CN.imgs[k] && CN.imgs[k].url) return +k; return -1; }
  function bgStyle(url, fb) { return url ? 'background-image:url(' + url + ');background-size:cover;background-position:center' : 'background:' + fb; }
  /* 흐린 사진 — html2canvas 가 filter 를 못 그려서 미리 흐려 둔다 */
  var BLUR = {};
  function cxBlur(idx) {
    var im = CN.imgs && CN.imgs[idx]; if (!im || !im.img) return '';
    var key = idx + ':' + im.url.length + ':' + im.url.slice(-24);
    if (BLUR[key]) return BLUR[key];
    try {
      var W = 270, H = 338, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
      x.filter = 'blur(7px)';
      var ir = im.img.width / im.img.height, cr = W / H, dw, dh, dx, dy;
      if (ir > cr) { dh = H * 1.12; dw = dh * ir; } else { dw = W * 1.12; dh = dw / ir; }
      dx = (W - dw) / 2; dy = (H - dh) / 2; x.drawImage(im.img, dx, dy, dw, dh);
      BLUR[key] = c.toDataURL('image/jpeg', 0.82);
    } catch (e) { BLUR[key] = im.url; }
    return BLUR[key];
  }
  function noPh(pv, idx) { return (pv && !phUrl(idx)) ? '<div class="cx-noph">사진 없음 · ✨ AI 사진 생성 / 🖼 업로드</div>' : ''; }

  /* ── 작은 그림들 (SVG) ── */
  function rnd(seed) { var a = (seed * 2654435761) >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  /* 찢어진 종이 — sides: 'tb' 위아래, 't' 위만, 'l' 왼쪽만 */
  function torn(w, h, sides, seed, fill) {
    var r = rnd(seed || 7), j = 16, p = [], i, step = 26;
    var top = sides.indexOf('t') >= 0, bot = sides.indexOf('b') >= 0, lef = sides.indexOf('l') >= 0;
    if (lef) { p.push((j + r() * j) + ',0'); } else p.push('0,' + (top ? j : 0));
    if (top) { for (i = lef ? step : 0; i <= w; i += step) p.push(Math.min(i, w) + ',' + (r() * j * 1.6).toFixed(1)); } else p.push(w + ',0');
    p.push(w + ',' + (bot ? h - j : h));
    if (bot) { for (i = w; i >= 0; i -= step) p.push(Math.max(i, 0) + ',' + (h - r() * j * 1.6).toFixed(1)); } else p.push((lef ? j : 0) + ',' + h);
    if (lef) { for (i = h; i >= 0; i -= step) p.push((r() * j * 1.8).toFixed(1) + ',' + Math.max(i, 0)); }
    var pts = p.join(' ');
    return '<svg class="cx-svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><filter id="ts' + seed + '" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-opacity=".35"/></filter></defs>' +
      '<polygon points="' + pts + '" fill="' + (fill || '#F3F3F1') + '" filter="url(#ts' + seed + ')"/>' +
      '<polygon points="' + pts + '" fill="none" stroke="#FFFFFF" stroke-width="3" opacity=".8"/></svg>';
  }
  function squig(w, col) {
    var d = 'M4 14', x = 4; while (x < w - 20) { d += ' q 13 -11 26 0'; x += 26; }
    return '<svg class="cx-svg" width="' + w + '" height="28" viewBox="0 0 ' + w + ' 28"><path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="7" stroke-linecap="round"/></svg>';
  }
  function starO(s) { return '<svg class="cx-svg" width="' + s + '" height="' + s + '" viewBox="0 0 100 100"><path d="M50 6 L63 92 L8 36 L94 38 L36 94 Z" fill="none" stroke="#111" stroke-width="6" stroke-linejoin="round"/></svg>'; }
  function starF(s, c) { return '<svg class="cx-svg" width="' + s + '" height="' + s + '" viewBox="0 0 100 100"><polygon points="50,4 62,38 98,38 69,59 80,94 50,72 20,94 31,59 2,38 38,38" fill="' + c + '"/></svg>'; }
  function arrowDoodle(w, h, c, flip) {
    return '<svg class="cx-svg" width="' + w + '" height="' + h + '" viewBox="0 0 160 220"' + (flip ? ' style="transform:scaleX(-1)"' : '') + '><path d="M118 10 C150 60 150 110 110 120 C80 128 78 92 104 92 C140 92 120 170 30 196" fill="none" stroke="' + c + '" stroke-width="8" stroke-linecap="round"/><path d="M58 172 L28 198 L66 206" fill="none" stroke="' + c + '" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function smiley(s) {
    return '<svg class="cx-svg" width="' + s + '" height="' + s + '" viewBox="0 0 200 200"><circle cx="100" cy="100" r="96" fill="#D7F56A"/><circle cx="100" cy="100" r="84" fill="none" stroke="#3E5A12" stroke-width="2.5" stroke-dasharray="3 5"/>' +
      '<defs><path id="cxTop" d="M38 100 A62 62 0 0 1 162 100"/><path id="cxBot" d="M44 112 A58 58 0 0 0 156 112"/></defs>' +
      '<text font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="25" fill="#2E4A0C" letter-spacing="2"><textPath href="#cxTop" startOffset="50%" text-anchor="middle">GOOD VIBES</textPath></text>' +
      '<text font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="25" fill="#2E4A0C" letter-spacing="3"><textPath href="#cxBot" startOffset="50%" text-anchor="middle">ONLY</textPath></text>' +
      '<ellipse cx="86" cy="92" rx="6" ry="11" fill="#2E4A0C"/><ellipse cx="114" cy="92" rx="6" ry="11" fill="#2E4A0C"/><path d="M70 110 Q100 140 130 110" fill="none" stroke="#2E4A0C" stroke-width="7" stroke-linecap="round"/>' +
      '<text x="30" y="108" font-size="18" fill="#2E4A0C">★</text><text x="156" y="108" font-size="18" fill="#2E4A0C">★</text></svg>';
  }
  function burst(s, c) {
    var p = [], n = 22, i; for (i = 0; i < n * 2; i++) { var a = Math.PI * i / n, rr = (i % 2) ? 0.78 : 1; p.push((100 + Math.cos(a) * 98 * rr).toFixed(1) + ',' + (100 + Math.sin(a) * 98 * rr).toFixed(1)); }
    return '<svg class="cx-svg" width="' + s + '" height="' + s + '" viewBox="0 0 200 200"><polygon points="' + p.join(' ') + '" fill="' + c + '"/></svg>';
  }
  function folder(w) { var h = Math.round(w * 0.8); return '<div class="cx-fold" style="width:' + w + 'px;height:' + h + 'px"><b></b><i></i></div>'; }
  function heartSq(s) { return '<span class="cx-hsq" style="width:' + s + 'px;height:' + s + 'px"><svg class="cx-svg" width="' + (s * 0.62) + '" height="' + (s * 0.62) + '" viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.4 5c2 0 3.6 1.2 4.6 2.7C12 6.2 13.6 5 15.6 5 19 5 21.1 8.4 19.6 11.8 17.5 16.4 12 21 12 21z" fill="#FF5FA2"/></svg></span>'; }
  function chk() { return '<svg class="cx-svg" width="46" height="46" viewBox="0 0 24 24"><rect x="2.5" y="4.5" width="15" height="15" rx="2.5" fill="none" stroke="#1DA1F2" stroke-width="1.8"/><path d="M7 11.5l3.2 3.2L21 3.8" fill="none" stroke="#1DA1F2" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  function appBar(title) {
    return '<div class="cxD-bar"><svg class="cx-svg" width="52" height="52" viewBox="0 0 24 24"><path d="M20 12H4m0 0l7-7m-7 7l7 7" fill="none" stroke="#111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '<div class="cxD-bt">' + E(sub2(title, 14)) + '</div>' +
      '<svg class="cx-svg" width="50" height="50" viewBox="0 0 24 24"><path d="M12 15V3m0 0l-4.5 4.5M12 3l4.5 4.5M5 12v7.5h14V12" fill="none" stroke="#111" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '<svg class="cx-svg" width="54" height="54" viewBox="0 0 24 24" style="margin-left:22px"><path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke="#111" stroke-width="1.6" stroke-linecap="round"/></svg></div>';
  }

  /* ════════ ① 라임 매거진 ════════ */
  function limeTitle(t, all) {
    var ls = linesOf(all ? plain(t) : autoHl(t));
    return ls.map(function (ln) {
      if (all) return '<div class="ln"><span class="cxA-hl">' + E(ln) + '</span></div>';
      return '<div class="ln">' + E(ln).replace(/\*\*(.+?)\*\*/g, '<span class="cxA-hl">$1</span>').replace(/\*\*/g, '') + '</div>';
    }).join('');
  }
  function lime(sl, idx, n, pv) {
    var m = cnMagText(sl), lay = cnLayout(sl), u = phUrl(idx), tg = cxTags(sl);
    var dark = 'linear-gradient(160deg,#2B2B2B,#0E0E0E)';
    if (lay === 'cover') {
      return '<div class="cx cxA" style="' + bgStyle(u, dark) + '"><div class="cxA-shade cv"></div>' + noPh(pv, idx) +
        '<div class="cxA-mast">' + E(cxMast()) + '</div><div class="cxA-mr">NEWS ISSUE</div>' +
        '<div class="cxA-tag" style="right:82px;top:622px">' + E(tg[0]) + '</div>' +
        '<div class="cxA-foot">' + folder(96) + '<div class="cxA-t cv">' + limeTitle(m.t) + '</div>' +
        (m.s ? '<div class="cxA-sub">' + E(sub2(m.s, 40)) + '</div>' : '') +
        '<div class="cxA-date">' + E(cxDate()) + ' · ' + E(sub2(plain(m.k) || 'NEWS', 16)) + '</div></div>' +
        '<div class="cxA-rule"></div></div>';
    }
    if (lay === 'cta') {
      var bi = anyIdx(idx), bu = bi === idx ? u : (bi >= 0 ? cxBlur(bi) : '');
      var src = srcLine();
      return '<div class="cx cxA" style="' + bgStyle(bu, dark) + '"><div class="cxA-shade dim"></div>' +
        '<div class="cxA-mast">' + E(cxMast()) + '</div><div class="cxA-mr">NEWS ISSUE</div>' +
        '<div class="cxA-card"><div class="cxA-av" style="' + bgStyle(u ? cxBlur(idx) : '', 'linear-gradient(140deg,#1F3A2C,#0C1A12)') + '"><span>' + E(cxShort()) + '<em>✳</em></span></div>' +
        '<div class="cxA-ct">' + E(plain(m.t)).replace(/\n/g, '<br>') + '</div>' +
        '<div class="cxA-pill">' + E(cxId()) + '</div></div>' +
        '<div class="cxA-pins">' +
        (src ? '<div><span class="pin">📌</span><span class="bx">자료 · <b>' + E(sub2(src, 30)) + '</b></span></div>' : '') +
        '<div><span class="pin">📌</span><span class="bx">' + E(sub2(m.s || '저장해 두고 필요할 때 다시 보세요', 22)) + '</span></div></div>' +
        '<div class="cxA-disc">' + E(DISC) + (B.seal ? '<br>' + E(B.seal) : '') + '</div><div class="cxA-rule"></div></div>';
    }
    if (lay === 'list') {
      var bi2 = anyIdx(idx), bg2 = bi2 >= 0 ? cxBlur(bi2) : '';
      var its = (sl.items || []).slice(0, 5), many = its.length >= 5;
      var rows = its.map(function (it, i) {
        var p = splitItem(it);
        return '<div class="cxA-row' + (many ? ' sm' : '') + '"><div class="cxA-pl"><span class="nm">' + pad2(i + 1) + ' &nbsp;|&nbsp; ' + (p.lb ? E(p.lb) : '') + '</span>' +
          (p.lb ? '<span class="cl">:</span><span class="tx">' + E(sub2(p.tx, 20)) + '</span>' : '<span class="tx">' + E(sub2(p.tx, 22)) + '</span>') + '</div>' +
          ((p.lb && p.tx.length > 20) ? '<div class="cxA-rd">' + E(sub2(p.tx, 44)) + '</div>' : '') + '</div>';
      }).join('');
      return '<div class="cx cxA" style="' + bgStyle(bg2, dark) + '"><div class="cxA-shade dim2"></div>' +
        '<div class="cxA-wcard"><div class="cxA-id">' + E(cxId()) + '</div><div class="cxA-fc">' + folder(80) + '</div>' +
        '<div class="cxA-wt">' + limeTitle(m.t) + '</div>' + (m.s ? '<div class="cxA-ws">' + E(sub2(m.s, 60)) + '</div>' : '') +
        '<div class="cxA-rows">' + rows + '</div><div class="cxA-pg">' + pad2(idx) + '</div><div class="cxA-wrule"></div></div></div>';
    }
    if (lay === 'quote') {
      return '<div class="cx cxA" style="' + bgStyle(u, dark) + '"><div class="cxA-shade side"></div>' + noPh(pv, idx) +
        '<div class="cxA-id tl">' + E(cxId()) + '</div>' +
        '<div class="cxA-qb">' + folder(80) + (m.k ? '<div class="cxA-ql">' + E(sub2(plain(m.k), 30)) + '</div>' : '') +
        '<div class="cxA-qt">' + limeTitle(m.t, true) + '</div>' + (m.s ? '<div class="cxA-qs">' + E(sub2(m.s, 70)) + '</div>' : '') +
        '<div class="cxA-qa">— ' + E(cxMast()) + '</div></div>' +
        '<div class="cxA-next">다음 슬라이드에서 계속 &nbsp;→</div><div class="cxA-rule"></div></div>';
    }
    /* point · stat · news — 홀수 장은 흰 카드, 짝수 장은 사진 전체 */
    var big = sl.big || '';
    if (idx % 2 === 1) {
      return '<div class="cx cxA gray"><div class="cxA-wcard"><div class="cxA-id">' + E(cxId()) + '</div><div class="cxA-fc">' + folder(80) + '</div>' +
        '<div class="cxA-wt one">' + limeTitle(m.t) + '</div>' +
        '<div class="cxA-band" style="' + bgStyle(u, 'linear-gradient(140deg,#3A3A3A,#161616)') + '">' + noPh(pv, idx) +
        '<div class="cxA-tag" style="left:58px;bottom:130px">' + E(tg[0]) + '</div>' + (tg[1] ? '<div class="cxA-tag" style="right:36px;bottom:42px">' + E(tg[1]) + '</div>' : '') +
        (big ? '<div class="cxA-big">' + E(sub2(big, 14)) + '</div>' : '') + '</div>' +
        '<div class="cxA-wb">' + E(sub2(m.s, 80)) + '</div><div class="cxA-pg">' + pad2(idx) + '</div><div class="cxA-wrule"></div></div></div>';
    }
    return '<div class="cx cxA" style="' + bgStyle(u, dark) + '"><div class="cxA-shade pt"></div>' + noPh(pv, idx) +
      '<div class="cxA-id tl">' + E(cxId()) + '</div><div class="cxA-tag" style="right:80px;top:250px">' + E(tg[0]) + '</div>' +
      '<div class="cxA-foot pt">' + folder(80) + (big ? '<div class="cxA-bigl">' + E(sub2(big, 14)) + '</div>' : '') +
      '<div class="cxA-t">' + limeTitle(m.t) + '</div>' + (m.s ? '<div class="cxA-b">' + E(sub2(m.s, 80)) + '</div>' : '') + '</div>' +
      '<div class="cxA-pgw">' + pad2(idx) + '</div><div class="cxA-rule"></div></div>';
  }

  /* ════════ ② 블루 노트 ════════ */
  function note(sl, idx, n, pv) {
    var m = cnMagText(sl), lay = cnLayout(sl), u = phUrl(idx), tg = cxTags(sl);
    var mast = '<div class="cxB-mast">' + E(cxMast()) + '</div>';
    if (lay === 'cover') {
      var ls = linesOf(autoHl(m.t));
      return '<div class="cx cxB cv" style="' + bgStyle(u, 'linear-gradient(170deg,#9DB7C6,#4A7C98)') + '"><div class="cxB-shade"></div>' + noPh(pv, idx) +
        '<div class="cxB-mast w">' + E(cxMast()) + '</div>' +
        '<div class="cxB-cvb"><div class="cxB-kk">' + E(sub2(plain(m.k) || 'NEWS ISSUE', 18)) + '<span class="cxB-tog"><i></i></span></div>' +
        '<div class="cxB-ct">' + ls.map(function (l) { return '<div>' + hl(l, 'cxB-bl') + '</div>'; }).join('') + '</div></div>' +
        '<div class="cxB-date">' + E(cxMonth()) + ' · ' + E(sub2(plain(m.k) || 'NEWS', 14)) + '</div></div>';
    }
    if (lay === 'cta') {
      var bi = anyIdx(idx), bg = bi >= 0 ? cxBlur(bi) : '';
      var src = srcLine();
      return '<div class="cx cxB" style="' + bgStyle(bg, 'linear-gradient(170deg,#55636C,#2F5B73)') + '"><div class="cxB-dim"></div>' +
        '<div class="cxB-mast w">' + E(cxMast()) + '</div>' +
        '<div class="cxB-card"><div class="cxB-logo"><span>' + E(cxShort().slice(0, 2).toUpperCase()) + '</span></div>' +
        '<div class="cxB-nm">' + E(cxMast()) + '</div><div class="cxB-id">' + E(cxId()) + '</div><div class="cxB-fol">Follow</div></div>' +
        '<div class="cxB-cta">' + hl(plain(m.t), 'x') + '</div>' +
        '<div class="cxB-src">' + (src ? '자료 · ' + E(sub2(src, 40)) + '<br>' : '') + E(DISC) + (B.seal ? '<br>' + E(B.seal) : '') + '</div>' +
        '<div class="cxB-date w">' + E(cxMonth()) + '</div></div>';
    }
    if (lay === 'list') {
      var its = (sl.items || []).slice(0, 5), sm = its.length >= 5;
      return '<div class="cx cxB">' + mast + '<div class="cxB-ll">' + pad2(idx) + '. INSIGHT LIST</div>' +
        '<div class="cxB-lt"><span class="mk"></span><span class="tx">' + E(sub2(plain(m.t), 18)) + '</span></div>' +
        '<div class="cxB-its' + (sm ? ' sm' : '') + '">' + its.map(function (it, i) {
          var p = splitItem(it);
          return '<div class="cxB-it"><div class="h"><span class="no">' + (i + 1) + '</span>' + (p.lb ? '[' + E(p.lb) + '] ' : '') + E(sub2(p.lb ? p.tx : p.tx, p.lb ? 16 : 22)) + '</div>' +
            ((p.lb && p.tx.length > 16) ? '<div class="d">' + E(sub2(p.tx, 40)) + '</div>' : '') + '</div>';
        }).join('') + '</div>' + (m.s ? '<div class="cxB-lsub">' + E(sub2(m.s, 46)) + '</div>' : '') + '</div>';
    }
    if (lay === 'quote') {
      var rows = rowsOf(m.t, 11).slice(0, 6);
      return '<div class="cx cxB">' + mast + '<div class="cxB-paper"><div class="cxB-tape"></div>' +
        '<div class="cxB-rows">' + rows.map(function (r, i) { return '<div class="r">' + (i === 0 ? '“' : '') + hl(r, 'b') + (i === rows.length - 1 ? '”' : '') + '</div>'; }).join('') + '</div>' +
        (m.s ? '<div class="cxB-qs">' + E(sub2(m.s, 60)) + '</div>' : '') +
        '<div class="cxB-qa">- ' + E(cxMast()) + ' -</div></div>' +
        '<div class="cxB-frule"></div><div class="cxB-fl">다음 슬라이드에서 계속</div><div class="cxB-arr">&gt; &gt; &gt;</div></div>';
    }
    var big = sl.big || '';
    if (idx % 2 === 1) {
      return '<div class="cx cxB">' + mast +
        '<div class="cxB-ph" style="' + bgStyle(u, 'linear-gradient(150deg,#C9D9E3,#8FB4C9)') + '">' + noPh(pv, idx) + '</div>' +
        '<div class="cxB-emo h">💙</div><div class="cxB-emo b">💬</div>' +
        (big ? '<div class="cxB-big">' + E(sub2(big, 14)) + '</div>' : '') +
        '<div class="cxB-h"><span>' + pad2(idx) + '.</span>' + E(sub2(plain(m.t), 20)) + '</div>' +
        '<div class="cxB-body">' + hl(sub2(m.s, 80), 'b') + '</div>' +
        '<div class="cxB-frule"></div><div class="cxB-fl">' + E(tg.join(' ')) + '</div><div class="cxB-arr">&gt; &gt; &gt;</div></div>';
    }
    return '<div class="cx cxB">' + mast +
      '<div class="cxB-no">' + pad2(idx) + '.</div><div class="cxB-h2">' + E(sub2(plain(m.t), 24)) + '</div>' +
      '<div class="cxB-body2">' + hl(sub2(m.s, 90), 'b') + '</div>' +
      '<div class="cxB-cut" style="' + bgStyle(u, 'linear-gradient(150deg,#C9D9E3,#8FB4C9)') + '">' + noPh(pv, idx) + '</div>' +
      '<div class="cxB-memo"><div class="cxB-tape s"></div><div class="cxB-memot">' + E(sub2(big || plain(m.k) || cxMast(), 22)) + '</div><div class="cxB-memoa">- ' + E(cxMast()) + '</div></div></div>';
  }

  /* ════════ ③ 핑크 진 ════════ */
  function zTape(txt, bg, col, x, y, rot) { return '<div class="cxC-tape" style="left:' + x + 'px;top:' + y + 'px;background:' + bg + ';color:' + col + ';transform:rotate(' + rot + 'deg)">' + E(txt) + '</div>'; }
  function zine(sl, idx, n, pv) {
    var m = cnMagText(sl), lay = cnLayout(sl), u = phUrl(idx), tg = cxTags(sl);
    var grunge = 'linear-gradient(160deg,#3B3B3B,#151515)';
    var lab = '<div class="cxC-lab">' + heartSq(66) + '<span>TREND ISSUE</span></div>';
    if (lay === 'cover') {
      return '<div class="cx cxC" style="' + bgStyle(u, grunge) + '"><div class="cxC-shade cv"></div>' + noPh(pv, idx) +
        '<div class="cxC-lab tl">' + heartSq(66) + '<span>' + E(cxDate()) + ' · ISSUE</span></div>' +
        '<div class="cxC-note">' + '<div class="hrt">♥</div>' + E(sub2(plain(m.k) || '오늘의 소식', 14)) + '</div>' +
        '<div class="cxC-bub p">' + E(sub2(tg[0], 14)) + '</div><div class="cxC-bub w">저장해 두세요 ♥</div>' +
        '<div class="cxC-burst">' + burst(250, '#FFF04A') + '<span>지금 바로<br>저장각!</span></div>' +
        '<div class="cxC-stk cv">' + smiley(190) + '</div>' +
        '<div class="cxC-cvb">' + (m.s ? '<div class="cxC-ul">' + E(sub2(m.s, 22)) + '</div>' : '') +
        '<div class="cxC-ct">' + hl(autoHl(m.t), 'pk') + '</div></div>' +
        '<div class="cxC-ft"><span>' + E(cxId()) + '</span><i></i><span>' + E(cxMast()) + '</span></div></div>';
    }
    if (lay === 'cta') {
      var bi = anyIdx(idx), bg = bi >= 0 ? cxBlur(bi) : '';
      var src = srcLine();
      return '<div class="cx cxC" style="' + bgStyle(bg, grunge) + '"><div class="cxC-shade dk"></div>' +
        '<div class="cxC-lab ctr">' + heartSq(66) + '<span>END OF ISSUE</span></div>' +
        '<div class="cxC-card"><div class="cxC-av">' + E(cxShort().toUpperCase()) + '</div><div class="cxC-id">' + E(cxId()) + '</div><div class="cxC-dot"></div>' +
        '<div class="cxC-ctt">' + E(plain(m.t)).replace(/\n/g, '<br>') + '</div>' +
        '<div class="cxC-btn">팔로우 ' + E(cxId()) + '</div><div class="cxC-btn">이 게시물 저장하기</div></div>' +
        (src ? '<div class="cxC-srcl">SOURCE</div><div class="cxC-src">' + E(sub2(src, 34)) + '</div>' : '') +
        '<div class="cxC-disc">' + E(DISC) + (B.seal ? '<br>' + E(B.seal) : '') + '</div>' +
        '<div class="cxC-bot"><span>' + E(cxMast()) + ' · ' + E(cxDate()) + '</span><b>' + E(tg.join(' ')) + '</b></div></div>';
    }
    if (lay === 'list') {
      var its = (sl.items || []).slice(0, 5), sm = its.length >= 5;
      return '<div class="cx cxC" style="' + bgStyle(anyIdx(idx) >= 0 ? cxBlur(anyIdx(idx)) : '', grunge) + '">' +
        '<div class="cxC-pp" style="top:120px">' + torn(1080, 1150, 'tb', idx + 3) + '</div>' +
        '<div class="cxC-mr">TREND ISSUE</div>' + zTape(pad2(idx), '#FF5FA2', '#111', 170, 104, -4) +
        '<div class="cxC-ss" style="left:106px;top:286px">' + starO(96) + '</div><div class="cxC-ss" style="left:80px;top:410px">' + starF(50, '#FF5FA2') + '</div>' +
        '<div class="cxC-ss" style="right:68px;top:320px">' + arrowDoodle(150, 200, '#FF5FA2', true) + '</div>' +
        '<div class="cxC-lt">' + hl(autoHl(sub2(m.t, 24)), 'pk') + '<div class="sq">' + squig(530, '#FF5FA2') + '</div></div>' +
        '<div class="cxC-its' + (sm ? ' sm' : '') + '">' + its.map(function (it, i) {
          var p = splitItem(it), alt = i % 2;
          return '<div class="cxC-it"><div class="no" style="color:' + (alt ? '#FF5FA2' : '#D4F75A') + '">' + pad2(i + 1) + '</div><div class="bd">' +
            '<div class="hd">' + (p.lb ? '<span class="lb ' + (alt ? 'p' : 'g') + '">[' + E(p.lb) + ']</span>' : '') + '<span class="tp">' + E(sub2(p.lb ? p.tx : p.tx, p.lb ? 15 : 20)) + '</span></div>' +
            ((p.lb && p.tx.length > 15) ? '<div class="ds">: ' + E(sub2(p.tx, 42)) + '</div>' : '') + '</div></div>';
        }).join('') + '</div></div>';
    }
    if (lay === 'quote') {
      return '<div class="cx cxC" style="' + bgStyle(u, grunge) + '"><div class="cxC-shade q"></div>' + noPh(pv, idx) + '<div class="cxC-mr w">TREND ISSUE</div>' +
        '<div class="cxC-pp" style="left:170px;top:610px">' + torn(740, 430, 'tb', idx + 11) + '</div>' +
        zTape(pad2(idx), '#FF5FA2', '#111', 140, 576, -5) +
        '<div class="cxC-hand">' + E(plain(m.t)).replace(/\n/g, '<br>') + '<div class="by">- ' + E(cxMast()) + '</div></div>' +
        '<div class="cxC-stk q">' + smiley(180) + '</div>' +
        '<div class="cxC-nx">다음 슬라이드에서 계속 &nbsp;→</div></div>';
    }
    var big = sl.big || '';
    if (idx % 2 === 1) {
      return '<div class="cx cxC paper"><div class="cxC-lp" style="' + bgStyle(u, grunge) + '">' + noPh(pv, idx) + '</div>' +
        '<div class="cxC-pp" style="left:300px;top:0">' + torn(780, 1350, 'l', idx + 5) + '</div>' +
        '<div class="cxC-stk lp">' + smiley(180) + '</div><div class="cxC-mr">TREND ISSUE</div>' +
        zTape(pad2(idx), '#1A1A1A', '#D4F75A', 438, 186, -3) +
        '<div class="cxC-pt">' + hl(autoHl(sub2(m.t, 22)), 'pk') + '<div class="sq">' + squig(520, '#FF5FA2') + '</div></div>' +
        (big ? '<div class="cxC-big">' + E(sub2(big, 12)) + '</div>' : '') +
        '<div class="cxC-pb">' + E(sub2(m.s, 80)) + '</div>' +
        '<div class="cxC-tags">' + tg.map(function (t) { return '<span>' + E(t) + '</span>'; }).join('') + '</div>' +
        '<div class="cxC-ss" style="left:820px;top:860px">' + arrowDoodle(130, 180, '#FF5FA2', true) + '</div>' +
        '<div class="cxC-ss" style="left:930px;top:1090px">' + starO(86) + '</div><div class="cxC-ss" style="left:880px;top:1200px">' + starF(54, '#FF5FA2') + '</div></div>';
    }
    return '<div class="cx cxC paper"><div class="cxC-tp" style="' + bgStyle(u, grunge) + '">' + noPh(pv, idx) + '</div>' +
      '<div class="cxC-pp" style="left:0;top:400px">' + torn(1080, 950, 't', idx + 9) + '</div>' +
      '<div class="cxC-mr w">TREND ISSUE</div><div class="cxC-bub p sm">' + E(sub2(tg[0], 12)) + '</div>' +
      zTape(pad2(idx), '#FF5FA2', '#111', 166, 384, -4) +
      '<div class="cxC-ss" style="left:930px;top:1010px">' + starO(90) + '</div><div class="cxC-ss" style="left:880px;top:1120px">' + starF(54, '#FF5FA2') + '</div>' +
      '<div class="cxC-ct2">' + hl(autoHl(sub2(m.t, 22)), 'pk') + '</div>' +
      (big ? '<div class="cxC-big c">' + E(sub2(big, 12)) + '</div>' : '') +
      '<div class="cxC-pb c">' + E(sub2(m.s, 80)) + '</div>' +
      '<div class="cxC-ss" style="left:48px;top:900px">' + arrowDoodle(110, 150, '#FF5FA2') + '</div>' +
      (m.k ? '<div class="cxC-blk"><span>“' + E(sub2(plain(m.k), 26)) + '”</span><em>— ' + E(cxMast()) + '</em></div>' : '') + '</div>';
  }

  /* ════════ ④ 앱 화면 ════════ */
  function app(sl, idx, n, pv) {
    var m = cnMagText(sl), lay = cnLayout(sl), u = phUrl(idx);
    if (lay === 'cover') {
      var ls = linesOf(autoHl(m.t));
      return '<div class="cx cxD">' + appBar(cxMast()) +
        '<div class="cxD-ph" style="' + bgStyle(u, 'linear-gradient(160deg,#4B4B4B,#141414)') + '">' + noPh(pv, idx) + '<div class="cxD-sh"></div>' +
        '<div class="cxD-emo">🫶</div><div class="cxD-poll"><div class="q">' + E(sub2(plain(m.k) || '오늘 소식 같이 볼까요', 16)) + ' ♥</div><div class="y">Yes</div><div class="n">No</div></div>' +
        '<div class="cxD-cv">' + ls.map(function (l) { return '<div>' + hl(l, 'bl') + '</div>'; }).join('') +
        (m.s ? '<div class="s">: ' + E(sub2(m.s, 30)) + '</div>' : '') + '</div></div></div>';
    }
    var src = srcLine(), isCta = lay === 'cta';
    var inner = '';
    if (isCta) {
      inner = '<div class="cxD-prof"><div class="av">' + E(cxShort().slice(0, 2).toUpperCase()) + '</div><div><b>' + E(cxMast()) + '</b><span>' + E(cxId()) + '</span></div><div class="fo">팔로우</div></div>' +
        '<div class="cxD-pt">' + hl(plain(m.t), 'bl') + '</div>' + (m.s ? '<div class="cxD-tx c one">' + E(sub2(m.s, 26)) + '</div>' : '') +
        '<div class="cxD-dsc">' + (src ? '<b>자료</b> ' + E(sub2(src, 40)) + '<br>' : '') + E(DISC) + (B.seal ? '<br>' + E(B.seal) : '') + '</div>';
    } else if (lay === 'list') {
      var its = (sl.items || []).slice(0, 5);
      inner = '<div class="cxD-pt">' + hl(sub2(m.t, 24), 'bl') + '</div><div class="cxD-ck">' + its.map(function (it) {
        var p = splitItem(it); return '<div class="r">' + chk() + '<span>' + (p.lb ? '<b>' + E(p.lb) + '</b> ' : '') + E(sub2(p.tx, p.lb ? 18 : 22)) + '</span></div>';
      }).join('') + '</div>';
    } else if (lay === 'quote') {
      inner = '<div class="cxD-qm">“</div><div class="cxD-pt q">' + hl(m.t, 'bl') + '</div>' + (m.s ? '<div class="cxD-tx c">' + E(sub2(m.s, 70)) + '</div>' : '');
    } else {
      inner = (sl.big ? '<div class="cxD-big">' + E(sub2(sl.big, 14)) + '</div>' : '') +
        '<div class="cxD-pt">' + hl(sub2(m.t, 24), 'bl') + '</div>' +
        (u ? '<div class="cxD-iph" style="' + bgStyle(u, '#ccc') + '"></div>' : '') +
        '<div class="cxD-tx' + (u ? ' sh' : '') + '">' + E(sub2(m.s, u ? 44 : 90)) + '</div>';
    }
    var foot = isCta ? '저장해 두고, 필요할 때 다시 꺼내 보세요!' : (lay === 'list' ? '하나씩 체크해 보세요!' : '쉽게 읽고, 내 상황에 비춰 보세요!');
    return '<div class="cx cxD gb">' + appBar(isCta ? cxMast() : '노트') +
      '<div class="cxD-note' + (isCta ? ' cta' : '') + '"><div class="cxD-nh"><span class="orb"></span>' + E(cxShort()) + ' Note ' + E(cxDate()) + '(' + cxDow() + ')</div>' +
      '<div class="cxD-pan">' + inner + '</div>' +
      '<div class="cxD-nf">' + (isCta ? '' : E(foot)) + '<span class="emo">' + (isCta ? '🙌' : '✌️') + '</span></div></div>' +
      '<div class="cxD-go">' + (isCta ? '저장하고 다시 보기' : '슬라이드 넘겨서 확인') + ' &nbsp;→</div><div class="cxD-id">' + E(cxId()) + '</div></div>';
  }

  var DRAW = { lime: lime, note: note, zine: zine, app: app };
  /* 고른 실사 사진의 사진가 이름을 장마다 얹는다 (판 X235 · creditOf) */
  function slideHtml(sl, idx, n, pv) { var f = DRAW[CN.style]; if (!f) return ''; var h = f(sl || {}, idx, n, pv), c = creditHtml(idx); return c ? h.replace(/<\/div>$/, c + '</div>') : h; }

  /* ── 스타일 · 글꼴 ── */
  (function inject() {
    if (document.getElementById('cxStyle')) return;
    [['cxFontP', 'https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/pretendard-dynamic-subset.css'],
     ['cxFontG', 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,900&family=Nanum+Pen+Script&display=swap']].forEach(function (f) {
      if (document.getElementById(f[0])) return; var l = document.createElement('link'); l.id = f[0]; l.rel = 'stylesheet'; l.href = f[1]; document.head.appendChild(l);
    });
    var FF = "'Pretendard','Noto Sans KR','Malgun Gothic',sans-serif";
    var s = document.createElement('style'); s.id = 'cxStyle';
    s.textContent = [
      /* 판 */
      '.cx-pv{position:relative;width:340px;height:425px;border-radius:14px;overflow:hidden;box-shadow:var(--shadow-lg,0 10px 30px rgba(0,0,0,.18));margin:0 auto;background:#111}',
      '.cx-pv>.cx{transform:scale(.314815);transform-origin:0 0}',
      '.cx{position:relative;width:1080px;height:1350px;overflow:hidden;box-sizing:border-box;font-family:' + FF + ';color:#111;letter-spacing:-.02em;word-break:keep-all;text-align:left}',
      '.cx *{box-sizing:border-box}',
      '.cx-svg{display:block}',
      '.cx-noph{position:absolute;left:50%;top:44%;transform:translateX(-50%);background:rgba(0,0,0,.55);color:#fff;font-size:34px;font-weight:700;padding:16px 30px;border-radius:40px;white-space:nowrap;z-index:1}',
      '.cx-fold{position:relative}.cx-fold b{position:absolute;left:0;top:0;width:44%;height:30%;background:#F5A524;border-radius:10px 10px 0 0}.cx-fold i{position:absolute;left:0;top:15%;width:100%;height:85%;background:#FFC83D;border-radius:10px}',
      '.cx-hsq{display:inline-flex;align-items:center;justify-content:center;background:#fff;flex:0 0 auto}',
      /* ① 라임 */
      '.cxA{background:#111;color:#fff}.cxA.gray{background:linear-gradient(180deg,#E3E3E3,#CFCFCF)}',
      '.cxA-shade{position:absolute;inset:0}.cxA-shade.cv{background:linear-gradient(180deg,rgba(0,0,0,.38) 0%,rgba(0,0,0,0) 22%,rgba(0,0,0,.05) 45%,rgba(0,0,0,.78) 100%)}',
      '.cxA-shade.pt{background:linear-gradient(180deg,rgba(0,0,0,.28) 0%,rgba(0,0,0,0) 25%,rgba(0,0,0,.2) 48%,rgba(0,0,0,.82) 100%)}',
      '.cxA-shade.side{background:linear-gradient(90deg,rgba(0,0,0,.66) 0%,rgba(0,0,0,.25) 62%,rgba(0,0,0,.05) 100%),linear-gradient(180deg,rgba(0,0,0,0) 60%,rgba(0,0,0,.55))}',
      '.cxA-shade.dim{background:rgba(0,0,0,.42)}.cxA-shade.dim2{background:rgba(0,0,0,.30)}',
      '.cxA-mast{position:absolute;left:62px;top:50px;font-size:30px;font-weight:800;letter-spacing:.02em;color:#fff}',
      '.cxA-mr{position:absolute;right:58px;top:52px;font-size:28px;font-weight:500;color:rgba(255,255,255,.85);letter-spacing:.04em}',
      '.cxA-tag{position:absolute;background:#fff;color:#111;font-size:36px;font-weight:700;padding:6px 18px;white-space:nowrap}',
      '.cxA-id{position:absolute;right:52px;top:46px;background:#000;color:#fff;font-size:32px;font-weight:700;padding:2px 6px;white-space:nowrap}.cxA-id.tl{left:80px;right:auto;top:56px}',
      '.cxA-foot{position:absolute;left:94px;right:80px;bottom:136px}.cxA-foot.pt{bottom:150px}',
      '.cxA-t{margin-top:34px;font-size:96px;font-weight:800;line-height:1.24;color:#fff;letter-spacing:-.04em}.cxA-t.cv{font-size:104px}',
      '.cxA-t .ln{margin:4px 0}',
      '.cxA-hl{display:inline-block;background:#B6FF3B;color:#111;padding:0 16px;margin-left:-16px;line-height:1.16}',
      '.cxA-sub{margin-top:30px;font-size:40px;font-weight:500;color:rgba(255,255,255,.9);line-height:1.45}',
      '.cxA-date{margin-top:26px;font-size:38px;font-weight:400;color:rgba(255,255,255,.82);letter-spacing:.01em}',
      '.cxA-b{margin-top:30px;font-size:40px;font-weight:400;line-height:1.55;color:rgba(255,255,255,.93);max-height:250px;overflow:hidden}',
      '.cxA-rule{position:absolute;left:54px;right:54px;bottom:60px;height:2px;background:rgba(255,255,255,.45)}',
      '.cxA-pgw{position:absolute;right:88px;bottom:96px;font-size:36px;font-weight:800;color:#fff}',
      '.cxA-bigl{margin-top:30px;display:inline-block;font-size:110px;font-weight:900;color:#B6FF3B;line-height:1}',
      '.cxA-wcard{position:absolute;left:70px;top:70px;right:72px;bottom:70px;background:#fff;border-radius:44px;overflow:hidden;color:#111;box-shadow:0 20px 50px rgba(0,0,0,.18)}',
      '.cxA-fc{display:flex;justify-content:center;margin-top:76px}',
      '.cxA-wt{text-align:center;font-size:76px;font-weight:800;line-height:1.24;margin:36px 40px 0;color:#222;max-height:300px;overflow:hidden}.cxA-wt .cxA-hl{margin-left:0;padding:0 14px}',
      '.cxA-wt.one{font-size:72px;max-height:190px}',
      '.cxA-ws{text-align:center;font-size:34px;color:#555;margin:18px 60px 0}',
      '.cxA-band{position:relative;margin-top:44px;height:510px}',
      '.cxA-big{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;font-size:150px;font-weight:900;color:#B6FF3B;text-shadow:0 6px 24px rgba(0,0,0,.5)}',
      '.cxA-wb{text-align:center;font-size:38px;line-height:1.6;color:#222;margin:56px 72px 0;max-height:190px;overflow:hidden}',
      '.cxA-pg{position:absolute;right:52px;bottom:88px;font-size:36px;font-weight:800}',
      '.cxA-wrule{position:absolute;left:44px;right:44px;bottom:56px;height:2px;background:#C9C9C9}',
      '.cxA-rows{margin:44px 74px 0;display:flex;flex-direction:column;gap:30px}',
      '.cxA-row.sm .cxA-pl{height:80px;font-size:34px}.cxA-rows .cxA-row.sm{margin-bottom:-6px}',
      '.cxA-pl{height:90px;border-radius:46px;background:#222;color:#fff;display:flex;align-items:center;padding:0 58px;font-size:38px;font-weight:700;white-space:nowrap;overflow:hidden}',
      '.cxA-pl .nm{color:#B6FF3B}.cxA-pl .cl{margin:0 18px;color:#fff}.cxA-pl .nm+.tx{margin-left:16px}',
      '.cxA-rd{font-size:34px;color:#333;margin:18px 0 0 30px}',
      '.cxA-qb{position:absolute;left:96px;right:120px;top:430px}',
      '.cxA-ql{margin-top:40px;font-size:44px;font-weight:500;color:#fff;line-height:1.45}',
      '.cxA-qt{margin-top:46px;font-size:86px;font-weight:800;line-height:1.22;color:#111}.cxA-qt .ln{margin:0 0 14px}.cxA-qt .cxA-hl{margin-left:0;padding:4px 14px}',
      '.cxA-qs{margin-top:30px;font-size:36px;color:rgba(255,255,255,.9);line-height:1.5}',
      '.cxA-qa{margin-top:52px;font-size:38px;color:rgba(255,255,255,.75)}',
      '.cxA-next{position:absolute;right:94px;bottom:134px;background:#fff;color:#111;font-size:38px;font-weight:600;padding:20px 40px;border-radius:50px}',
      '.cxA-card{position:absolute;left:256px;top:262px;width:568px;height:686px;background:rgba(255,255,255,.96);border-radius:30px;color:#222;text-align:center}',
      '.cxA-av{width:258px;height:258px;border-radius:50%;margin:92px auto 0;display:flex;align-items:center;justify-content:center;overflow:hidden}',
      '.cxA-av span{font-size:46px;font-weight:900;color:#fff;letter-spacing:-.02em;line-height:1}.cxA-av em{font-style:normal;color:#B6FF3B;margin-left:6px}',
      '.cxA-ct{margin:52px 36px 0;font-size:40px;font-weight:500;line-height:1.4;max-height:120px;overflow:hidden}',
      '.cxA-pill{margin:44px auto 0;width:408px;height:66px;line-height:66px;border-radius:34px;background:#222;color:#fff;font-size:36px;font-weight:700}',
      '.cxA-pins{position:absolute;left:150px;right:80px;top:1010px;display:flex;flex-direction:column;gap:22px}',
      '.cxA-pins>div{display:flex;align-items:center;gap:18px}.cxA-pins .pin{font-size:44px}',
      '.cxA-pins .bx{background:rgba(0,0,0,.72);color:#fff;font-size:34px;padding:4px 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:720px}.cxA-pins b{color:#B6FF3B;font-weight:700}',
      '.cxA-disc{position:absolute;left:80px;right:80px;bottom:84px;font-size:22px;line-height:1.5;color:rgba(255,255,255,.7);text-align:center}',
      /* ② 블루 노트 */
      '.cxB{background:linear-gradient(180deg,#E6EAED 0%,#E3E8EC 62%,#BFE2F4 100%);color:#111}',
      '.cxB-mast{position:absolute;right:54px;top:48px;font-size:32px;font-weight:700;letter-spacing:.03em}.cxB-mast.w{color:#fff}',
      '.cxB-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.18) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,.12) 55%,rgba(18,92,130,.92) 100%)}',
      '.cxB-cvb{position:absolute;left:96px;right:80px;bottom:240px;color:#fff}',
      '.cxB-kk{display:flex;align-items:center;gap:34px;font-size:46px;font-weight:800;letter-spacing:.01em}',
      '.cxB-tog{display:inline-block;width:86px;height:48px;border-radius:26px;background:#4FC3F7;position:relative;box-shadow:0 2px 6px rgba(0,0,0,.2)}.cxB-tog i{position:absolute;right:6px;top:6px;width:36px;height:36px;border-radius:50%;background:#fff}',
      '.cxB-ct{margin-top:30px;font-size:112px;font-weight:800;line-height:1.18;letter-spacing:-.04em;text-shadow:0 4px 18px rgba(0,0,0,.25)}.cxB-bl{color:#4FC3F7}',
      '.cxB-date{position:absolute;left:0;right:0;bottom:70px;text-align:center;font-size:34px;color:#fff;letter-spacing:.02em}',
      '.cxB-ph{position:absolute;left:180px;top:120px;width:560px;height:560px;border-radius:44px;box-shadow:0 18px 40px rgba(0,0,0,.18)}',
      '.cxB-emo{position:absolute;font-size:120px;line-height:1}.cxB-emo.h{left:780px;top:200px}.cxB-emo.b{left:800px;top:400px;font-size:110px}',
      '.cxB-big{position:absolute;left:180px;width:560px;top:560px;text-align:center;font-size:96px;font-weight:900;color:#fff;text-shadow:0 4px 18px rgba(0,0,0,.45)}',
      '.cxB-h{position:absolute;left:92px;right:80px;top:770px;font-size:64px;font-weight:800;line-height:1.25}.cxB-h span{margin-right:22px}',
      '.cxB-body{position:absolute;left:92px;right:90px;top:900px;font-size:42px;line-height:1.62;max-height:260px;overflow:hidden}.cxB-body .b,.cxB-body2 .b{font-weight:800}',
      '.cxB-frule{position:absolute;left:86px;right:86px;top:1194px;height:2px;background:#555}',
      '.cxB-fl{position:absolute;left:90px;top:1232px;font-size:34px;color:#333}.cxB-arr{position:absolute;right:88px;top:1228px;font-size:36px;color:#333;letter-spacing:4px}',
      '.cxB-no{position:absolute;left:108px;top:148px;font-size:64px;font-weight:700}',
      '.cxB-h2{position:absolute;left:108px;right:80px;top:236px;font-size:64px;font-weight:800;line-height:1.25}',
      '.cxB-body2{position:absolute;left:108px;right:90px;top:400px;font-size:44px;line-height:1.62;max-height:360px;overflow:hidden}',
      '.cxB-cut{position:absolute;right:30px;bottom:0;width:470px;height:560px;border-radius:40px 40px 0 0}',
      '.cxB-memo{position:absolute;left:88px;top:900px;width:500px;height:350px;background:#fff;transform:rotate(-4deg);box-shadow:0 12px 26px rgba(0,0,0,.18);display:flex;flex-direction:column;justify-content:center;align-items:center;padding:30px}',
      '.cxB-tape{position:absolute;left:282px;top:-36px;width:166px;height:70px;background:rgba(116,203,247,.88);transform:rotate(-8deg)}.cxB-tape.s{left:170px;top:-24px;width:140px;height:54px;transform:rotate(2deg)}',
      '.cxB-memot{font-family:\'Nanum Pen Script\',cursive;font-size:76px;line-height:1.1;text-align:center;color:#222}',
      '.cxB-memoa{font-family:\'Nanum Pen Script\',cursive;font-size:46px;color:#555;margin-top:18px}',
      '.cxB-ll{position:absolute;left:0;right:0;top:132px;text-align:center;font-size:46px;font-weight:600;letter-spacing:.02em}',
      '.cxB-lt{position:absolute;left:0;right:0;top:200px;text-align:center}.cxB-lt .tx{position:relative;font-size:68px;font-weight:900}',
      '.cxB-lt .mk{position:absolute;left:190px;right:180px;top:60px;height:34px;border-radius:20px;background:#A8DDF5}',
      '.cxB-its{position:absolute;left:108px;right:96px;top:380px}',
      '.cxB-it{padding:34px 0 38px;border-bottom:3px dotted #9AA3AA}.cxB-it:last-child{border-bottom:none}.cxB-its.sm .cxB-it{padding:22px 0 26px}',
      '.cxB-it .h{font-size:48px;font-weight:800;display:flex;align-items:center;white-space:nowrap;overflow:hidden}',
      '.cxB-it .no{flex:0 0 52px;height:52px;border-radius:50%;background:#111;color:#fff;font-size:32px;display:inline-flex;align-items:center;justify-content:center;margin-right:24px}',
      '.cxB-it .d{font-size:36px;color:#333;margin-top:16px}',
      '.cxB-lsub{position:absolute;left:108px;right:96px;bottom:84px;font-size:34px;color:#444}',
      '.cxB-paper{position:absolute;left:172px;top:212px;width:744px;height:870px;background:#fff;box-shadow:0 26px 50px rgba(0,0,0,.16)}',
      '.cxB-paper .cxB-tape{left:282px}',
      '.cxB-rows{margin:122px 86px 0;border-top:3px solid #B9E3F7}.cxB-rows .r{height:106px;line-height:106px;border-bottom:3px solid #B9E3F7;text-align:center;font-size:56px;font-weight:500;white-space:nowrap;overflow:hidden}.cxB-rows .r .b{font-weight:900}',
      '.cxB-qs{margin:30px 80px 0;text-align:center;font-size:32px;color:#555;line-height:1.5}',
      '.cxB-qa{position:absolute;left:0;right:0;bottom:84px;text-align:center;font-size:36px;color:#333}',
      '.cxB-dim{position:absolute;inset:0;background:rgba(20,28,36,.45)}',
      '.cxB-card{position:absolute;left:308px;top:240px;width:466px;height:602px;border-radius:56px;background:#fff;text-align:center}',
      '.cxB-logo{width:188px;height:188px;border-radius:50%;background:#5BC8F5;margin:68px auto 0;display:flex;align-items:center;justify-content:center}.cxB-logo span{font-size:96px;font-weight:900;color:#fff;letter-spacing:-.06em}',
      '.cxB-nm{margin-top:40px;font-size:46px;font-weight:900}.cxB-id{margin-top:10px;font-size:38px;font-weight:600;color:#888}',
      '.cxB-fol{margin:36px auto 0;width:350px;height:98px;line-height:98px;border-radius:22px;background:#000;color:#fff;font-size:46px;font-weight:600}',
      '.cxB-cta{position:absolute;left:80px;right:80px;top:930px;text-align:center;font-size:52px;font-weight:800;color:#fff;line-height:1.42}',
      '.cxB-src{position:absolute;left:110px;right:110px;bottom:140px;text-align:center;font-size:24px;line-height:1.55;color:rgba(255,255,255,.82)}',
      '.cxB-date.w{bottom:62px}',
      /* ③ 핑크 진 */
      '.cxC{background:#1A1A1A;color:#111}.cxC.paper{background:#F3F3F1}',
      '.cxC-shade{position:absolute;inset:0}.cxC-shade.cv{background:linear-gradient(180deg,rgba(0,0,0,.15) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,.25) 55%,rgba(0,0,0,.72) 100%)}',
      '.cxC-shade.dk{background:rgba(0,0,0,.62)}.cxC-shade.q{background:rgba(0,0,0,.18)}',
      '.cxC-pp{position:absolute}',
      '.cxC-lab{position:absolute;display:flex;align-items:stretch;border:2px solid #fff;background:#111}.cxC-lab span:last-child{display:flex;align-items:center;padding:0 26px;color:#fff;font-size:34px;font-weight:700;letter-spacing:.14em}',
      '.cxC-lab.tl{left:66px;top:60px}.cxC-lab.ctr{left:362px;top:114px}',
      '.cxC-note{position:absolute;left:120px;top:262px;width:226px;min-height:144px;background:#F7F7F2;transform:rotate(-8deg);box-shadow:0 10px 20px rgba(0,0,0,.25);padding:56px 18px 22px;text-align:center;font-family:\'Nanum Pen Script\',cursive;font-size:44px;line-height:1.05;color:#222}',
      '.cxC-note .hrt{position:absolute;left:12px;top:-34px;font-size:84px;color:#F06AA5;font-family:Arial,sans-serif;transform:rotate(-10deg)}',
      '.cxC-bub{position:absolute;padding:20px 40px;border-radius:44px;font-size:36px;font-weight:800;white-space:nowrap}',
      '.cxC-bub.p{right:66px;top:260px;background:#FF5FA2;color:#fff}.cxC-bub.w{right:54px;top:388px;background:#fff;color:#111}',
      '.cxC-bub.sm{right:auto;left:312px;top:84px;font-size:34px;padding:18px 34px}',
      '.cxC-burst{position:absolute;left:150px;top:470px;width:250px;height:250px}.cxC-burst svg{position:absolute;inset:0}.cxC-burst span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;font-size:36px;font-weight:900;line-height:1.25;color:#111}',
      '.cxC-stk{position:absolute}.cxC-stk.cv{right:104px;top:668px;transform:rotate(-12deg)}.cxC-stk.lp{left:50px;top:915px;transform:rotate(-10deg)}.cxC-stk.q{right:140px;top:890px;transform:rotate(-12deg)}',
      '.cxC-cvb{position:absolute;left:68px;right:80px;bottom:150px;color:#fff}',
      '.cxC-ul{display:inline-block;font-size:42px;font-weight:500;border-bottom:3px solid #fff;padding-bottom:4px;margin-bottom:24px}',
      '.cxC-ct{font-size:124px;font-weight:800;line-height:1.08;letter-spacing:-.05em}.cxC-ct .pk,.cxC-lt .pk,.cxC-pt .pk,.cxC-ct2 .pk{color:#FF5FA2}',
      '.cxC-ft{position:absolute;left:66px;right:66px;bottom:72px;display:flex;align-items:center;gap:26px;color:#fff;font-size:36px;font-weight:600}.cxC-ft i{flex:1;height:2px;background:rgba(255,255,255,.8)}',
      '.cxC-tape{position:absolute;padding:14px 40px;font-family:\'Fraunces\',Georgia,serif;font-weight:900;font-size:110px;line-height:1;box-shadow:0 6px 12px rgba(0,0,0,.18)}',
      '.cxC-mr{position:absolute;right:56px;top:66px;font-size:34px;font-weight:700;letter-spacing:.16em;color:#111}.cxC-mr.w{color:#fff}',
      '.cxC-lp{position:absolute;left:0;top:0;width:420px;height:1350px}',
      '.cxC-pt{position:absolute;left:470px;right:70px;top:330px;font-size:90px;font-weight:800;line-height:1.14;letter-spacing:-.04em}.cxC-pt .sq{margin-top:10px}',
      '.cxC-big{position:absolute;left:470px;top:640px;font-family:\'Fraunces\',Georgia,serif;font-size:96px;font-weight:900;color:#FF5FA2}.cxC-big.c{left:0;right:0;text-align:center;top:760px}',
      '.cxC-pb{position:absolute;left:470px;right:150px;top:720px;font-size:38px;line-height:1.6;color:#222;max-height:300px;overflow:hidden;border-top:3px dotted #999;padding-top:40px}',
      '.cxC-pb.c{left:150px;right:150px;top:870px;text-align:center;border-top:none;padding-top:0}',
      '.cxC-tags{position:absolute;left:470px;top:1080px;display:flex;flex-direction:column;gap:22px}.cxC-tags span{display:inline-block;background:#111;color:#D4F75A;font-size:36px;font-weight:800;padding:14px 30px;border-radius:16px;white-space:nowrap}',
      '.cxC-ss{position:absolute}',
      '.cxC-tp{position:absolute;left:0;top:0;width:1080px;height:470px}',
      '.cxC-ct2{position:absolute;left:100px;right:100px;top:520px;text-align:center;font-size:96px;font-weight:800;line-height:1.12;letter-spacing:-.04em}',
      '.cxC-blk{position:absolute;left:146px;right:130px;bottom:120px;background:#1A1A1A;color:#fff;padding:30px 40px;transform:rotate(-1deg);text-align:center}.cxC-blk span{display:block;font-size:40px;font-style:italic;font-weight:600}.cxC-blk em{display:block;margin-top:12px;font-size:32px;font-style:normal;color:#D4F75A}',
      '.cxC-lt{position:absolute;left:0;right:0;top:250px;text-align:center;font-size:96px;font-weight:800;line-height:1.1;letter-spacing:-.04em}.cxC-lt .sq{display:flex;justify-content:center;margin-top:8px}',
      '.cxC-its{position:absolute;left:100px;right:92px;top:540px}',
      '.cxC-it{display:flex;gap:36px;padding:26px 0;border-bottom:3px dotted #9A9A9A}.cxC-it:last-child{border-bottom:none}.cxC-its.sm .cxC-it{padding:16px 0}',
      '.cxC-it .no{flex:0 0 96px;height:96px;border-radius:14px;background:#111;display:flex;align-items:center;justify-content:center;font-family:\'Fraunces\',Georgia,serif;font-weight:900;font-size:54px}',
      '.cxC-it .bd{flex:1;min-width:0}.cxC-it .hd{display:flex;align-items:center;gap:16px;white-space:nowrap;overflow:hidden}',
      '.cxC-it .lb{font-size:42px;font-weight:900;padding:0 6px}.cxC-it .lb.g{background:linear-gradient(transparent 50%,#DDF58D 50%)}.cxC-it .lb.p{background:linear-gradient(transparent 50%,#FFC2DB 50%)}',
      '.cxC-it .tp{background:#1A1A1A;color:#fff;font-size:34px;font-weight:600;padding:8px 26px;transform:rotate(-1deg)}',
      '.cxC-it .ds{margin-top:14px;font-size:30px;color:#222;white-space:nowrap;overflow:hidden}',
      '.cxC-hand{position:absolute;left:230px;right:230px;top:680px;text-align:center;font-family:\'Nanum Pen Script\',cursive;font-size:68px;line-height:1.3;color:#222;max-height:300px;overflow:hidden}.cxC-hand .by{font-size:48px;color:#444;margin-top:22px}',
      '.cxC-nx{position:absolute;left:268px;right:268px;bottom:96px;height:80px;line-height:76px;text-align:center;background:#000;color:#fff;border:2px solid #fff;font-size:40px;font-weight:600}',
      '.cxC-card{position:absolute;left:322px;top:230px;width:436px;height:678px;background:#fff;border-radius:30px;text-align:center}',
      '.cxC-av{width:192px;height:192px;border-radius:50%;background:#000;color:#fff;margin:34px auto 0;display:flex;align-items:center;justify-content:center;font-size:46px;font-weight:900;letter-spacing:.18em}',
      '.cxC-id{margin-top:28px;font-size:38px;font-weight:800}.cxC-dot{margin:24px 54px 0;border-top:3px dotted #AAA}',
      '.cxC-ctt{margin:28px 30px 0;font-size:34px;line-height:1.4;color:#222;max-height:100px;overflow:hidden}',
      '.cxC-btn{margin:20px 28px 0;height:80px;line-height:80px;border-radius:14px;background:#FF5FA2;color:#fff;font-size:36px;font-weight:800;white-space:nowrap;overflow:hidden}',
      '.cxC-srcl{position:absolute;left:0;right:0;top:960px;text-align:center;font-size:34px;font-weight:700;letter-spacing:.16em;color:#D4F75A}',
      '.cxC-src{position:absolute;left:80px;right:80px;top:1018px;text-align:center;font-size:42px;font-weight:600;color:#fff}',
      '.cxC-disc{position:absolute;left:96px;right:96px;top:1100px;text-align:center;font-size:23px;line-height:1.55;color:rgba(255,255,255,.72)}',
      '.cxC-bot{position:absolute;left:96px;right:96px;bottom:46px;padding-top:24px;border-top:3px dotted rgba(255,255,255,.5);display:flex;justify-content:space-between;font-size:30px;color:#fff;white-space:nowrap}.cxC-bot b{color:#D4F75A;font-weight:600}',
      /* ④ 앱 화면 */
      '.cxD{background:#111}.cxD.gb{background:linear-gradient(180deg,#5F6E77 0%,#557587 55%,#4A7891 100%)}',
      '.cxD-bar{position:absolute;left:0;right:0;top:0;height:142px;background:#fff;display:flex;align-items:center;padding:0 44px;gap:0;z-index:2}',
      '.cxD-bt{flex:1;text-align:center;font-size:40px;font-weight:800;color:#111;padding-left:70px}',
      '.cxD-ph{position:absolute;left:0;right:0;top:142px;bottom:0}.cxD-sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(0,0,0,.78) 100%)}',
      '.cxD-emo{position:absolute;right:42px;top:390px;font-size:150px;line-height:1}',
      '.cxD-poll{position:absolute;left:582px;top:510px;width:438px;background:#fff;border-radius:30px;padding:36px 24px 26px;box-shadow:0 10px 30px rgba(0,0,0,.2);text-align:center}',
      '.cxD-poll .q{font-size:30px;font-weight:600;color:#111;margin-bottom:24px}.cxD-poll .y,.cxD-poll .n{height:50px;line-height:50px;border-radius:26px;font-size:30px;margin-top:12px}.cxD-poll .y{background:#2EA3F2;color:#fff}.cxD-poll .n{background:#EAEAEA;color:#111}',
      '.cxD-cv{position:absolute;left:74px;right:60px;bottom:90px;color:#fff;font-size:96px;font-weight:800;line-height:1.16;letter-spacing:-.04em}.cxD-cv .bl{color:#1DA1F2}.cxD-cv .s{font-size:44px;font-weight:600;margin-top:30px;letter-spacing:-.02em}',
      '.cxD-note{position:absolute;left:160px;right:160px;top:262px;background:#fff;border-radius:26px;box-shadow:0 30px 60px rgba(0,0,0,.25);overflow:hidden}',
      '.cxD-nh{height:104px;display:flex;align-items:center;justify-content:center;font-size:34px;color:#999;border-bottom:3px solid #DDD;margin:0 26px;position:relative}',
      '.cxD-nh .orb{position:absolute;left:6px;top:24px;width:54px;height:54px;border-radius:50%;background:radial-gradient(circle at 34% 30%,#BFE6FF 0%,#2B8FE0 45%,#0B4FA8 100%);box-shadow:0 3px 6px rgba(0,0,0,.25)}',
      '.cxD-pan{background:#E3F1FD;margin:0 26px;padding:46px 40px 36px;min-height:470px}',
      '.cxD-pt{text-align:center;font-size:52px;font-weight:800;line-height:1.3;color:#111}.cxD-pt .bl{color:#1DA1F2}.cxD-pt.q{font-size:54px;margin-top:6px}',
      '.cxD-qm{text-align:center;font-size:110px;line-height:.8;color:#1DA1F2;font-weight:900;height:70px}',
      '.cxD-big{text-align:center;font-size:110px;font-weight:900;color:#1DA1F2;line-height:1.1;margin-bottom:20px}',
      '.cxD-ck{margin-top:40px}.cxD-ck .r{display:flex;align-items:center;gap:28px;padding:20px 0;border-bottom:3px dotted #9FB3C2;font-size:38px;color:#111;white-space:nowrap;overflow:hidden}.cxD-ck .r b{color:#1DA1F2;font-weight:800}',
      '.cxD-tx{margin-top:34px;font-size:38px;line-height:1.6;color:#222;max-height:310px;overflow:hidden}.cxD-tx.c{text-align:center}',
      '.cxD-iph{margin-top:28px;height:210px;border-radius:18px}.cxD-tx.sh{max-height:124px;margin-top:26px}.cxD-tx.one{white-space:nowrap;overflow:hidden;max-height:62px}',
      '.cxD-note.cta .cxD-nf{padding:10px 90px 30px;min-height:60px}.cxD-note.cta .cxD-nf .emo{top:-60px}',
      '.cxD-prof{display:flex;align-items:center;gap:24px;margin-bottom:36px}.cxD-prof .av{flex:0 0 110px;height:110px;border-radius:50%;background:#1DA1F2;color:#fff;font-size:48px;font-weight:900;display:flex;align-items:center;justify-content:center}',
      '.cxD-prof b{display:block;font-size:40px}.cxD-prof span{display:block;font-size:32px;color:#666;margin-top:4px}.cxD-prof>div:nth-child(2){flex:1}.cxD-prof .fo{background:#1DA1F2;color:#fff;font-size:32px;font-weight:700;padding:16px 30px;border-radius:16px}',
      '.cxD-dsc{margin-top:26px;font-size:22px;line-height:1.5;color:#556}',
      '.cxD-nf{position:relative;text-align:center;font-size:40px;font-weight:600;color:#111;padding:30px 90px 36px}.cxD-nf .emo{position:absolute;right:6px;top:-30px;font-size:120px}',
      '.cxD-go{position:absolute;left:308px;right:308px;bottom:112px;height:80px;line-height:80px;border-radius:40px;background:#000;color:#fff;text-align:center;font-size:36px;font-weight:600}',
      '.cxD-id{position:absolute;left:0;right:0;bottom:46px;text-align:center;font-size:32px;font-weight:700;color:#111}',
      /* 고르는 칸 */
      '.cxp{border:1px solid var(--t-line,#E5E7EB);border-radius:var(--r,12px);padding:12px 13px;margin:0 0 12px;background:var(--t-card,#fff)}',
      '.cxp-hd{font-size:var(--t6);font-weight:800;color:var(--t-ink);margin-bottom:9px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.cxp-hd span{font-weight:600;color:var(--t-sub)}',
      '.cxp-th{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}',
      '@media(max-width:640px){.cxp-th{grid-template-columns:repeat(2,minmax(0,1fr))}.cxp-br{grid-template-columns:1fr!important}}',
      '.cxp-tb{display:flex;flex-direction:column;align-items:flex-start;gap:4px;min-height:44px;padding:9px 10px;border:1.5px solid var(--t-line,#E5E7EB);border-radius:10px;background:var(--t-card,#fff);cursor:pointer;text-align:left;font:inherit;color:var(--t-ink)}',
      '.cxp-tb.on{border-color:#7C3AED;box-shadow:0 0 0 3px rgba(124,58,237,.14)}.cxp-tb b{font-size:var(--t6);font-weight:800}.cxp-tb small{font-size:13px;color:var(--t-sub)}',
      '.cxp-sw{display:flex;gap:3px}.cxp-sw i{width:16px;height:16px;border-radius:4px;border:1px solid rgba(0,0,0,.12)}',
      '.cxp-br{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 10px;margin-top:11px}',
      '.cxp-f{display:flex;flex-direction:column;gap:3px}.cxp-f label{font-size:13px;font-weight:700;color:var(--t-sub)}.cxp-f input{min-height:44px;padding:0 11px;border:1px solid var(--t-line,#D1D5DB);border-radius:9px;font:inherit;font-size:var(--t6);background:var(--t-card,#fff);color:var(--t-ink)}',
      '.cxp-f.span2{grid-column:1/-1}',
      '.cxp-f select{min-height:44px;padding:0 9px;border:1px solid var(--t-line,#D1D5DB);border-radius:9px;font:inherit;font-size:var(--t6);background:var(--t-card,#fff);color:var(--t-ink)}',
      '.cxp-ph{margin-top:9px;font-size:13px;line-height:1.55;color:var(--t-sub)}',
      '.cxs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-bottom:12px}',
      '@media(max-width:640px){.cxs{grid-template-columns:repeat(2,minmax(0,1fr))}}',
      '.cxs-b{display:flex;align-items:center;gap:8px;min-height:52px;padding:7px 9px;border:1.5px solid var(--t-line,#E5E7EB);border-radius:10px;background:var(--t-card,#fff);cursor:pointer;text-align:left;font:inherit;color:var(--t-sub,#6B7280)}',
      '.cxs-n{flex:0 0 26px;height:26px;border-radius:50%;background:var(--t-line,#E5E8EB);color:var(--t-ink);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900}',
      '.cxs-t{display:flex;flex-direction:column;min-width:0}.cxs-t b{font-size:var(--t6);font-weight:800;color:var(--t-ink)}.cxs-t small{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.cxs-b.ok{border-color:#A7F3D0;background:#ECFDF5}.cxs-b.ok .cxs-n{background:#10B981;color:#fff}',
      '.cxs-b.cur{border-color:#7C3AED;background:#F5F3FF;box-shadow:0 0 0 3px rgba(124,58,237,.14)}.cxs-b.cur .cxs-n{background:#7C3AED;color:#fff}',
      '.cx-cr{position:absolute;right:26px;bottom:14px;z-index:6;background:rgba(0,0,0,.42);color:#fff;font-size:19px;font-weight:500;line-height:1.3;padding:4px 12px;border-radius:12px;white-space:nowrap;letter-spacing:0}',
      '.cxk{border:1.5px solid #7C3AED;border-radius:var(--r,12px);padding:12px 13px;margin:0 0 12px;background:var(--t-card,#fff)}',
      '.cxk-hd{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:var(--t6);color:var(--t-ink);margin-bottom:9px}',
      '.cxk-x{min-height:44px;padding:0 14px;border:1px solid var(--t-line,#E5E8EB);border-radius:9px;background:var(--t-card,#fff);color:var(--t-sub);font:inherit;font-size:13px;cursor:pointer}',
      '.cxk-row{display:flex;gap:6px;flex-wrap:wrap}.cxk-row input{flex:1 1 200px;min-height:44px;padding:0 11px;border:1px solid var(--t-line,#D1D5DB);border-radius:9px;font:inherit;font-size:var(--t6);color:var(--t-ink);background:var(--t-card,#fff)}',
      '.cxk-row select{min-height:44px;padding:0 9px;border:1px solid var(--t-line,#D1D5DB);border-radius:9px;font:inherit;font-size:var(--t6);color:var(--t-ink);background:var(--t-card,#fff)}.cxk-row .btn{min-height:44px}',
      '.cxk-msg{margin-top:8px;font-size:13px;line-height:1.55;color:var(--t-sub)}',
      '.cxk-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:10px;max-height:520px;overflow:auto}',
      '@media(max-width:640px){.cxk-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}',
      '.cxk-it{display:flex;flex-direction:column;gap:3px;padding:0;border:2px solid transparent;border-radius:10px;background:none;cursor:pointer;text-align:left;font:inherit;min-height:44px}',
      '.cxk-it:hover{border-color:#7C3AED}.cxk-it img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:8px;display:block;background:var(--t-line,#E5E8EB)}',
      '.cxk-it span{font-size:13px;color:var(--t-sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px}',
      '.cxk-ft{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.cxk-ft .btn{min-height:44px}',
      '.cxk-nt{margin-top:9px;font-size:13px;line-height:1.55;color:var(--t-sub)}',
      '.cxp-nt{margin-top:9px;font-size:13px;line-height:1.55;color:#8A6A2F;background:#FFF9EC;border:1px solid #F3E2B8;border-radius:8px;padding:7px 10px}'
    ].join('\n');
    document.head.appendChild(s);
  })();

  /* ── 미리보기 · 고르는 칸 ── */
  function pvHtml(sl, idx, n) { return '<div class="cx-pv" id="cxPv">' + slideHtml(sl, idx, n, true) + '</div>'; }
  var _origPv = window.cnSlidePreview;
  window.cnSlidePreview = function (sl, idx, n) { return isMine(CN.style) ? pvHtml(sl, idx, n) : _origPv.apply(this, arguments); };

  /* 출처 칸에 적으면 기존 스타일의 마지막 장에도 그 출처가 찍힌다 */
  window.cnSrcOf = function () { var v = ('' + B.src).trim() || autoSrc(), p = (typeof photoSum === 'function') ? photoSum() : ''; return [v, p ? '사진 ' + p : ''].filter(Boolean).join(' / '); };

  /* ── AI 사진 — 화보 촬영처럼 (판 X231) ─────────────────────────────────
     사장님 말씀 「사진도 고퀄리티로 만들어줘야만해. 내가 첨부한 퀄리티 보았지」.
     재어 보니 화질이 무른 까닭이 셋이었다.
       ① <b>정사각형(1:1)</b>으로 받아 4:5 로 잘랐다 — 1024 의 위아래를 잘라 819px 폭을
          1080 으로 늘린 셈. → 처음부터 <b>4:5</b> 로 받는다(imageConfig.aspectRatio).
       ② 글 맨 끝에 「navy and blue tones · Korean business context」 가 붙어 모든 장이
          <b>경제신문 자료사진</b>이 됐다. → 테마가 켜지면 그 꼬리를 떼고 테마마다
          <b>촬영 지시서</b>(장소·조명·옷·색보정·렌즈)를 쓴다. 참고 이미지 네 갈래를 옮겼다.
       ③ 장마다 다른 사람이 나왔다. → 한 덱은 <b>같은 모델</b>(덱 제목으로 고정 · 칸에서 고름).
     ★ 개인 Gemini 키가 있으면 <b>최고 모델(Pro · 2K)</b> 을 먼저 쓴다. 공용 프록시는
       서버 함수 시간 한도(약 10초)가 있어 느린 Pro 가 잘리므로 표준 모델로 간다 — 둘 다 4:5.
       Pro 가 한도·권한으로 막히면 그 자리에서 표준으로 내려가고, 이번 접속 동안은 다시 안 묻는다.
     ★ 받은 사진은 <b>1080×1350 JPEG</b> 로 맞춰 둔다 — 2K 원본(수 MB)을 장마다 화면에 다시
       그리면 폰이 무거워진다. 카드 크기가 1080×1350 이라 잃는 것이 없다.            */
  var WHO = [['auto', '자동 (덱마다 한 사람)'], ['w20', '20대 여성'], ['w30', '30대 여성'], ['m20', '20대 남성'], ['m30', '30대 남성'], ['none', '인물 없이 (사물·풍경)']];
  var PEOPLE = {
    w20: 'a Korean woman in her mid-20s with long dark layered hair and fresh natural makeup',
    w30: 'a Korean woman in her early 30s with shoulder-length soft wavy hair, elegant and approachable',
    m20: 'a Korean man in his late 20s with a soft textured two-block haircut, clean-shaven, friendly',
    m30: 'a Korean man in his mid-30s with neat short hair, smart-casual, calm and trustworthy'
  };
  var LOOK = {
    lime: 'Setting: a minimal photo studio with a warm light-grey seamless backdrop; a professional camera on a tripod sits softly out of focus in the near foreground. Light: large soft window key light with gentle fill. Wardrobe: a simple white tank top or plain knit. Grade: clean K-beauty magazine look, neutral warm tones, subtle filmic softness.',
    note: 'Setting: a sunny Han River park or a bright minimal cafe in Seoul, pale sky and soft greenery. Light: bright airy daylight with a hint of golden-hour warmth. Wardrobe: a soft cream knit or light linen shirt. Grade: fresh pastel, pale sky-blue and white palette, low contrast, like a candid photo taken by a stylish friend.',
    zine: 'Setting: a Seoul rooftop in daytime with the city skyline, or a wall covered in graffiti and torn posters. Light: direct on-camera flash mixed with hard daylight. Wardrobe: an oversized blue striped shirt over a white tank top, baseball cap or small sunglasses, Y2K street style. Grade: 35mm film grain, punchy contrast, slightly cool shadows.',
    app: 'Setting: a cozy dim cafe in Seoul at night, warm tungsten pendant lights, a laptop and an iced coffee on a wooden table. Light: warm low ambient light with soft falloff. Wardrobe: a black knit, hair in a loose bun. Grade: moody and intimate, natural smartphone-like grain.'
  };
  var SHOT = {
    cover: 'Shot: tight editorial close-up portrait from the chest up, subject looking straight into the lens, face placed in the upper half of the frame.',
    point: 'Shot: natural medium shot, subject candidly engaged in an everyday moment that fits the story (checking a phone, reading papers, talking with someone), not posing for the camera.',
    stat: 'Shot: medium close-up, hands holding a smartphone or paper documents, focus on a real, quiet moment of checking something important.',
    quote: 'Shot: three-quarter profile, subject gazing thoughtfully away from the camera, generous negative space on one side.',
    list: 'Shot: calm environmental wide shot, subject small in the frame, uncluttered background.',
    cta: 'Shot: warm half-body portrait with a gentle, genuine smile, relaxed and approachable.'
  };
  var QUALITY = 'Ultra-realistic high-end Korean magazine editorial photograph, shot on a full-frame mirrorless camera with an 85mm f/1.4 lens (35mm for wide shots), shallow depth of field, creamy bokeh, tack-sharp focus on the eyes, true-to-life skin texture with fine pores, natural hands with correct fingers, accurate anatomy, professional color grading, high dynamic range, crisp fine detail.';
  var NEG = 'Absolutely no text, letters, numbers, captions, logos, brand marks, watermarks, signage text, UI elements, borders or collage frames. No distorted faces, no extra fingers, no plastic or airbrushed skin, no cartoon, 3D render or illustration style.';
  function deckSeed() { try { var s = cardnewsSlides(), t = plain((cnMagText(s[0] || {}).t) || ''); var h = 0; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h; } catch (e) { return 0; } }
  function whoKey() { var w = B.who || 'auto'; if (w !== 'auto') return w; return ['w20', 'w30', 'w20', 'm20'][deckSeed() % 4]; }
  function cxPrompt(sl) {
    var m = cnMagText(sl || {}), lay = cnLayout(sl || {}), wk = whoKey();
    if (lay === 'news') lay = 'point';
    var story = plain(m.t).replace(/\n/g, ' ') + (m.s ? ' — ' + plain(m.s) : '');
    var who = wk === 'none'
      ? 'Subject: no people at all — a styled, atmospheric still-life or scene with everyday objects that quietly symbolize the story.'
      : 'Model: ' + PEOPLE[wk] + '. Keep the same model, hair and styling as every other photo in this series.';
    var shot = wk === 'none' ? 'Shot: carefully composed still-life with intentional props, editorial product-photography quality.' : (SHOT[lay] || SHOT.point);
    return [QUALITY, who, LOOK[CN.style] || '', shot,
      (sl && sl.img ? 'Scene idea: ' + ('' + sl.img).slice(0, 160) + '.' : ''),
      'Story context (Korean, for mood only — never render it as text): "' + story.slice(0, 140) + '".',
      'Vertical 4:5 frame. Keep the lower third calm and slightly darker so a headline can sit on top.', NEG].filter(Boolean).join(' ');
  }
  window.cxPrompt = cxPrompt; /* 점검용 */
  var _origPrompt = window.cnImgPrompt;
  if (typeof _origPrompt === 'function') window.cnImgPrompt = function (sl) { return isMine(CN.style) ? cxPrompt(sl) : _origPrompt.apply(this, arguments); };

  /* 모델 · 4:5 · 2K — cnImgFetch(mdl, prompt, cfg) 의 cfg 로 넘긴다 */
  var PRO = 'gemini-3-pro-image-preview', proDead = false;
  function ownKey() { try { return typeof getGeminiKey === 'function' && !!getGeminiKey(); } catch (e) { return false; } }
  /* 1080×1350 JPEG 로 맞춘다 — 가운데 기준 cover */
  function fit1080(uri) {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () {
        try {
          var W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
          x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
          var ir = im.width / im.height, cr = W / H, dw, dh; if (ir > cr) { dh = H; dw = H * ir; } else { dw = W; dh = W / ir; }
          x.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
          res(c.toDataURL('image/jpeg', 0.93));
        } catch (e) { res(uri); }
      };
      im.onerror = function () { res(uri); };
      im.src = uri;
    });
  }
  var _origFetch = window.cnImgFetch;
  if (typeof _origFetch === 'function') window.cnImgFetch = function (mdl, prompt, cfg) {
    if (!isMine(CN.style) || cfg) return _origFetch.apply(this, arguments);
    var std = { imageConfig: { aspectRatio: '4:5' } };
    var stdTry = function () {
      return _origFetch(mdl, prompt, std)['catch'](function (e) {
        /* 이 모델이 imageConfig 를 모르면 예전 방식으로 한 번 더 */
        if (/imageConfig|aspect|Unknown name|Invalid JSON payload/i.test((e && e.message) || '')) return _origFetch(mdl, prompt);
        throw e;
      });
    };
    var go;
    if (ownKey() && !proDead && /flash-image/.test(mdl)) {
      toast('최고화질(Pro · 2K)로 촬영 중입니다 — 20~40초 걸립니다', 4000);
      go = _origFetch(PRO, prompt, { imageConfig: { aspectRatio: '4:5', imageSize: '2K' } })['catch'](function (e) {
        proDead = true; /* 한도·권한·이름 — 무엇이든 이번 접속은 표준으로 */
        return stdTry();
      });
    } else go = stdTry();
    return go.then(fit1080);
  };

  /* ── 📷 실사 사진 찾기 (판 X235) ─────────────────────────────────────
     사장님 말씀 「사진이 사실적 또는 뉴스에서 사용하는 실제 이미지를 따와서 넣고
     싶은거야」 → 고르신 길 「둘 다」.
     ⚠ 뉴스 기사 사진 · 정책브리핑 사진은 <b>자동으로 안 가져옵니다</b> — 기사 사진은
       언론사 저작물이고, 정책브리핑도 「사진은 담당자와 협의 후 사용」 이라 적혀 있어
       기계가 「써도 된다」 고 판정할 길이 없습니다(netlify/functions/photo-search.js 머리글).
     그래서 상업적 이용이 허락된 <b>진짜 사진</b>(Pexels · Unsplash)을 찾습니다.
     ★ 고른 사진에는 <b>사진가 이름이 카드에 저절로</b> 찍힙니다(두 곳 지침 · creditOf).
     ★ 고르면 다음 빈 장으로 넘어가 그 장의 검색어로 바로 찾습니다 — 열 장을 연달아 고르게.  */
  var PK = { open: false, q: '', src: 'all', page: 1, items: [], busy: false, msg: '', en: '', idx: -1 };
  function slideQuery(i) {
    var sl = cardnewsSlides()[i] || {}, m = cnMagText(sl);
    var k = plain(m.k).replace(/POINT\s*\d+/i, '').replace(/[^\w가-힣\s·]/g, ' ');
    var t = plain(m.t).replace(/\n/g, ' ').replace(/[^\w가-힣\s%.,]/g, ' ');
    return (k + ' ' + t).replace(/\s+/g, ' ').trim().slice(0, 60);
  }
  function apiHdr() { var h = {}; try { var t = (typeof getAppToken === 'function') ? getAppToken() : ''; if (t) h['X-App-Token'] = t; } catch (e) {} return h; }
  function firstEmpty(from) { var sl = cardnewsSlides(), j; for (j = from || 0; j < sl.length; j++) if (!(CN.imgs && CN.imgs[j])) return j; for (j = 0; j < (from || 0); j++) if (!(CN.imgs && CN.imgs[j])) return j; return -1; }
  function pkSearch(q, src, page) {
    return fetch('/api/photo-search?q=' + encodeURIComponent(q) + '&src=' + encodeURIComponent(src || 'all') + '&page=' + (page || 1), { headers: apiHdr() })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok && !(d && d.error)) throw new Error('HTTP ' + r.status); return d; }); });
  }
  function keyMsg(d) {
    var m = (d && d.missing) || [];
    if (!m.length) return '';
    return '⚠ 서버에 사진 키가 없습니다: <b>' + m.map(E).join(' · ') + '</b> — 관리자가 Netlify 환경변수에 넣으면 그쪽 사진도 나옵니다.';
  }
  function pkRun() {
    PK.busy = true; PK.msg = '찾는 중…'; pkPaint();
    pkSearch(PK.q, PK.src, PK.page).then(function (d) {
      PK.busy = false;
      if (!d || !d.ok) { PK.items = []; PK.msg = '⚠ ' + E((d && d.error) || '찾지 못했습니다'); pkPaint(); return; }
      PK.items = d.items || []; PK.en = d.query || '';
      var bits = [];
      if (d.translated) bits.push('영어 검색어 「' + E(d.query) + '」 로 찾았습니다');
      if (keyMsg(d)) bits.push(keyMsg(d));
      if ((d.errors || []).length) bits.push('⚠ ' + E(d.errors.join(' · ')));
      if (!PK.items.length && !keyMsg(d)) bits.push('맞는 사진이 없습니다 — 검색어를 짧게(예: 「병원」 「직장인」 「노후」) 바꿔 보세요.');
      PK.msg = bits.join('<br>'); pkPaint();
    })['catch'](function (e) { PK.busy = false; PK.items = []; PK.msg = '⚠ 사진을 찾지 못했습니다 — ' + E((e && e.message) || e); pkPaint(); });
  }
  function creditOf(idx) {
    var im = CN.imgs && CN.imgs[idx]; if (im && im.credit) return im.credit;
    var j = anyIdx(idx); im = (j >= 0 && CN.imgs) ? CN.imgs[j] : null; /* 다른 장 사진을 흐려 쓴 장 */
    return (im && im.credit && j !== idx && !(CN.imgs && CN.imgs[idx])) ? im.credit : null;
  }
  function creditHtml(idx) { var c = creditOf(idx); return c ? '<div class="cx-cr">Photo · ' + E(sub2(c.name || c.src, 28)) + ' / ' + E(c.src) + '</div>' : ''; }
  function photoSum() { var s = {}, k; for (k in CN.imgs) if (CN.imgs.hasOwnProperty(k) && CN.imgs[k] && CN.imgs[k].credit) s[CN.imgs[k].credit.src] = 1; return Object.keys(s).join('·'); }
  function srcLine() { var a = cxSrc(), p = photoSum(); return [a, p ? '사진 ' + p : ''].filter(Boolean).join(' / '); }
  function pkHtml() {
    if (!PK.open || !isMine(CN.style)) return '';
    var n = cardnewsSlides().length;
    var grid = PK.items.map(function (it, i) {
      return '<button type="button" class="cxk-it" onclick="cxPkUse(' + i + ')" title="' + E(it.alt || '') + '"><img src="' + E(it.thumb) + '" alt="" loading="lazy"><span>' + E(sub2(it.name || '', 16)) + ' · ' + E(it.src) + '</span></button>';
    }).join('');
    return '<div class="cxk" id="cxPick"><div class="cxk-hd"><b>📷 실사 사진 찾기 — ' + (PK.idx + 1) + ' / ' + n + '번째 장</b>' +
      '<button type="button" class="cxk-x" onclick="cxPkClose()">닫기</button></div>' +
      '<div class="cxk-row"><input id="cxPkQ" value="' + E(PK.q) + '" placeholder="검색어 (예: 병원 진료 · 직장인 · 노후)" onkeydown="if(event.key===\'Enter\')cxPkGo()">' +
      '<select id="cxPkS" onchange="cxPkGo()">' + [['all', '전체'], ['pexels', 'Pexels'], ['unsplash', 'Unsplash']].map(function (o) { return '<option value="' + o[0] + '"' + (PK.src === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
      '<button type="button" class="btn btn-primary" onclick="cxPkGo()"' + (PK.busy ? ' disabled' : '') + '>찾기</button>' +
      '<button type="button" class="btn btn-ghost" onclick="cxPkMore()"' + (PK.busy || !PK.items.length ? ' disabled' : '') + '>다른 사진</button></div>' +
      (PK.msg ? '<div class="cxk-msg">' + PK.msg + '</div>' : '') +
      (grid ? '<div class="cxk-grid">' + grid + '</div>' : '') +
      '<div class="cxk-ft"><button type="button" class="btn btn-ghost" onclick="cxPkAuto()"' + (PK.busy ? ' disabled' : '') + '>⚡ 빈 장 자동 채우기 (' + emptyPh() + ')</button>' +
      '<button type="button" class="btn btn-ghost" onclick="cnGenImage(CN.i,this)">✨ 이 장은 AI 사진</button>' +
      '<button type="button" class="btn btn-ghost" onclick="cnPick()">🖼 내 사진 올리기</button></div>' +
      '<div class="cxk-nt">상업적 이용이 허락된 실사 사진(Pexels · Unsplash)만 찾습니다 — <b>사진가 이름이 카드에 저절로</b> 들어갑니다. ' +
      '뉴스 기사 사진은 언론사 저작물이라 가져오지 않습니다. 사진 속 사람이 상품을 <b>추천하는 것처럼</b> 쓰지 마세요.</div></div>';
  }
  function pkPaint() { var o = document.getElementById('cxPick'); if (!o) return; var t = document.createElement('div'); t.innerHTML = pkHtml(); if (t.firstChild) o.parentNode.replaceChild(t.firstChild, o); }
  function hostPaint() { var h = document.getElementById('cnHost'); if (h) h.innerHTML = window.renderTodayCard(); }
  window.cxPkOpen = function (idx) {
    if (!isMine(CN.style)) { toast('먼저 ① 테마를 고르세요.', 3000); return; }
    var j = (idx == null) ? firstEmpty(CN.i) : idx; if (j < 0) j = CN.i;
    PK.open = true; PK.idx = j; PK.q = slideQuery(j); PK.page = 1; PK.items = []; PK.msg = '';
    if (j !== CN.i && typeof cnGo === 'function') cnGo(j); else hostPaint();
    var o = document.getElementById('cxPick'); if (o && o.scrollIntoView) o.scrollIntoView({ block: 'start', behavior: 'smooth' });
    pkRun();
  };
  window.cxPkClose = function () { PK.open = false; hostPaint(); };
  window.cxPkGo = function () { var q = document.getElementById('cxPkQ'), s = document.getElementById('cxPkS'); PK.q = q ? ('' + q.value).trim() : PK.q; PK.src = s ? s.value : PK.src; PK.page = 1; if (PK.q) pkRun(); };
  window.cxPkMore = function () { PK.page = PK.page >= 10 ? 1 : PK.page + 1; pkRun(); };
  /* 고른 사진을 data:URL 로 받아 그 장에 넣는다 — 카드 굽기(html2canvas)가 바깥 주소를 못 그리므로 */
  function useItem(it, idx) {
    return fetch(it.full).then(function (r) { if (!r.ok) throw new Error('사진 받기 ' + r.status); return r.blob(); }).then(function (b) {
      return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res('' + fr.result); }; fr.onerror = rej; fr.readAsDataURL(b); });
    }).then(function (url) {
      return new Promise(function (res, rej) {
        var im = new Image(); im.onload = function () { CN.imgs[idx] = { img: im, url: url, credit: { name: it.name, src: it.src, link: it.link } }; res(); }; im.onerror = function () { rej(new Error('사진을 읽지 못했습니다')); }; im.src = url;
      });
    }).then(function () {
      if (it.track) fetch('/api/photo-search?track=' + encodeURIComponent(it.track), { headers: apiHdr() })['catch'](function () {});
    });
  }
  window.cxPkUse = function (i) {
    var it = PK.items[i]; if (!it || PK.busy) return;
    var idx = PK.idx; PK.busy = true; toast((idx + 1) + '번째 장에 사진을 넣는 중…', 2000);
    useItem(it, idx).then(function () {
      PK.busy = false;
      var nx = firstEmpty(idx + 1);
      if (nx < 0) { PK.open = false; hostPaint(); toast('모든 장에 사진이 들어갔습니다 — 이제 ④ 저장을 누르세요.', 4000); return; }
      window.cxPkOpen(nx);
    })['catch'](function (e) { PK.busy = false; pkPaint(); toast('사진을 넣지 못했습니다 — ' + ((e && e.message) || e), 6000); });
  };
  /* 빈 장마다 그 장의 검색어로 찾아 첫 사진을 넣는다 — 같은 사진은 두 번 안 쓴다 */
  window.cxPkAuto = function () {
    if (PK.busy) return;
    var used = {}, k; for (k in CN.imgs) if (CN.imgs.hasOwnProperty(k) && CN.imgs[k] && CN.imgs[k].credit) used[CN.imgs[k].credit.link + CN.imgs[k].credit.name] = 1;
    var todo = [], sl = cardnewsSlides(); for (k = 0; k < sl.length; k++) if (!(CN.imgs && CN.imgs[k])) todo.push(k);
    if (!todo.length) { toast('빈 장이 없습니다.', 2500); return; }
    PK.busy = true; var done = 0, miss = 0, keyWarn = '';
    (function step() {
      if (!todo.length) { PK.busy = false; PK.open = false; hostPaint(); toast(done + '장에 실사 사진을 넣었습니다' + (miss ? ' · ' + miss + '장은 못 찾아 비워 두었습니다' : '') + (keyWarn ? ' · ' + keyWarn : ''), 6000); return; }
      var idx = todo.shift();
      toast((idx + 1) + '번째 장 사진 찾는 중… (' + (done + miss + 1) + '/' + (done + miss + todo.length + 1) + ')', 2500);
      pkSearch(slideQuery(idx), PK.src, 1).then(function (d) {
        if (d && (d.missing || []).length) keyWarn = '서버에 ' + d.missing.join('·') + ' 없음';
        var pick = null; (d && d.items || []).some(function (it) { if (used[it.link + it.name]) return false; pick = it; return true; });
        if (!pick) { miss++; return; }
        used[pick.link + pick.name] = 1;
        return useItem(pick, idx).then(function () { done++; }, function () { miss++; });
      }, function () { miss++; }).then(function () { setTimeout(step, 250); });
    })();
  };
  window.cxCreditOf = creditOf; /* 점검용 */

  /* ── 단계 줄 — 어디까지 했고 지금 무엇을 할지 ── */
  function emptyPh() { try { var sl = cardnewsSlides(), c = 0; for (var k = 0; k < sl.length; k++) if (!(CN.imgs && CN.imgs[k])) c++; return c; } catch (e) { return 0; } }
  function stepState() {
    var t = isMine(CN.style), id = !!('' + B.id).trim(), e = emptyPh();
    var st = [
      { n: '1', t: '테마 고르기', d: t ? themeOf(CN.style).name : '아래 넷 중 하나', ok: t, go: 'cxStepGo(1)' },
      { n: '2', t: '내 아이디 적기', d: id ? cxId() : '카드에 찍힐 인스타 아이디', ok: id, go: 'cxStepGo(2)' },
      { n: '3', t: '사진 넣기', d: e ? ('빈 장 ' + e + '개 · 누르면 실사 사진 찾기') : '모든 장에 사진 있음', ok: !e, go: 'cxStepGo(3)' },
      { n: '4', t: '저장', d: '1080×1350 PNG 로 전부', ok: false, go: 'cxStepGo(4)' }
    ];
    for (var i = 0; i < st.length; i++) if (!st[i].ok) { st[i].cur = true; break; }
    return st;
  }
  function stepsHtml() {
    return '<div class="cxs" id="cxSteps">' + stepState().map(function (x) {
      return '<button type="button" class="cxs-b' + (x.ok ? ' ok' : '') + (x.cur ? ' cur' : '') + '" onclick="' + x.go + '">' +
        '<span class="cxs-n">' + (x.ok ? '✓' : x.n) + '</span><span class="cxs-t"><b>' + E(x.t) + '</b><small>' + E(x.d) + '</small></span></button>';
    }).join('') + '</div>';
  }
  function repaintSteps() { var o = document.getElementById('cxSteps'); if (!o) return; var tmp = document.createElement('div'); tmp.innerHTML = stepsHtml(); if (tmp.firstChild) o.parentNode.replaceChild(tmp.firstChild, o); }
  window.cxStepGo = function (k) {
    if (k === 1) { var th = document.querySelector('#cnHost .cxp-th'); if (th && th.scrollIntoView) th.scrollIntoView({ block: 'center', behavior: 'smooth' }); if (!isMine(CN.style)) toast('아래 테마 넷 중 마음에 드는 것을 누르세요.'); return; }
    if (k === 2) { var f = document.getElementById('cxIdIn'); if (f) { f.focus(); if (f.scrollIntoView) f.scrollIntoView({ block: 'center', behavior: 'smooth' }); } return; }
    if (k === 3) {
      /* 빈 장으로 옮겨 그 장의 검색어로 실사 사진을 찾는다 (판 X235) — AI·업로드는 그 칸 아래에 */
      if (firstEmpty(0) < 0) { toast('모든 장에 사진이 있습니다. 바꾸려면 그 장에서 「📷 실사 사진 찾기」 를 누르세요.', 4000); return; }
      window.cxPkOpen(); return;
    }
    if (k === 4) { if (!isMine(CN.style)) { toast('먼저 ① 테마를 고르세요.', 3000); window.cxStepGo(1); return; } window.cardnewsSaveAll(); }
  };
  /* 저장 전에 빈 칸을 <b>한 번 묻는다</b> — 「아니오」 면 그 칸으로 데려간다 */
  function cxAsk() {
    var miss = [];
    if (!('' + B.id).trim()) miss.push(['cxIdIn', '내 아이디 — 카드에 「@내아이디」 로 찍힙니다']);
    if (!('' + B.seal).trim()) miss.push(['cxSealIn', '준법감시필 문구 — 보험 이야기 게시물은 심의필을 받은 뒤 올려야 합니다']);
    if (!miss.length) return true;
    var ok = true;
    try { ok = confirm('⚠ 비어 있는 칸이 있습니다\n\n' + miss.map(function (m) { return '· ' + m[1]; }).join('\n') + '\n\n그래도 저장할까요? (취소하면 그 칸으로 갑니다)'); } catch (e) { ok = true; }
    if (!ok) { var f = document.getElementById(miss[0][0]); if (f) { f.focus(); if (f.scrollIntoView) f.scrollIntoView({ block: 'center' }); } }
    return ok;
  }
  window.cxAsk = cxAsk; /* 점검용 */
  function panelHtml() {
    var on = CN.style;
    var th = THEMES.map(function (t) {
      return '<button type="button" class="cxp-tb' + (on === t.id ? ' on' : '') + '" onclick="cxTheme(\'' + t.id + '\')"><span class="cxp-sw">' +
        t.sw.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span><b>' + t.ic + ' ' + t.name + '</b><small>' + t.sub + '</small></button>';
    }).join('');
    function fld(id, key, lab, ph, wide) {
      return '<div class="cxp-f' + (wide ? ' span2' : '') + '"><label for="' + id + '">' + lab + '</label><input id="' + id + '" value="' + E(B[key]) + '" placeholder="' + E(ph) + '" oninput="cxField(\'' + key + '\',this.value)"></div>';
    }
    var auto = autoSrc();
    return '<div class="cxp">' + stepsHtml() + '<div class="cxp-hd">✨ 매거진 테마 <span>— 뉴스를 이 디자인으로 바로 만듭니다 · 다시 누르면 기본 뉴스 카드</span></div>' +
      '<div class="cxp-th">' + th + '</div>' +
      '<div class="cxp-br">' +
      fld('cxIdIn', 'id', '🏷 내 아이디 (카드에 찍힘)', '@내인스타아이디') +
      fld('cxMastIn', 'mast', '📰 매거진 이름 (맨 위 이름)', 'APEX YUN PRO') +
      fld('cxSrcIn', 'src', '🔗 출처 (비우면 자동)', auto ? ('자동: ' + auto) : '예) 한국경제 2026.10.28 · 금융위원회 보도자료') +
      fld('cxTagIn', 'tags', '# 해시태그 (2개까지 카드에)', '#보험정보 #절세') +
      '<div class="cxp-f"><label for="cxWhoIn">📷 AI 사진 속 인물</label><select id="cxWhoIn" onchange="cxField(\'who\',this.value)">' +
        WHO.map(function (w) { return '<option value="' + w[0] + '"' + ((B.who || 'auto') === w[0] ? ' selected' : '') + '>' + w[1] + '</option>'; }).join('') + '</select></div>' +
      fld('cxSealIn', 'seal', '✅ 준법감시필 문구 (마지막 장 맨 아래)', '에이플러스에셋 준법감시필 00-0000-0000 (0000.00.00 ~ 0000.00.00)', true) +
      '</div><div class="cxp-ph">📷 AI 사진은 고른 테마에 맞춘 <b>화보 촬영 지시서</b>로 세로 4:5 로 만듭니다. ' + (ownKey() ? '개인 Gemini 키가 있어 <b>최고화질(Pro · 2K)</b>로 찍습니다(장당 20~40초).' : '공용 연결이라 <b>표준 모델</b>로 찍습니다 — 개인 Gemini 키를 넣으면 최고화질(Pro · 2K)로 바뀝니다.') + '</div>' +
      '<div class="cxp-nt">아이디·이름·출처는 <b>이 기기에만</b> 저장됩니다. 출처는 지어내지 않습니다 — 비워 두면 AI·주제가 가진 출처만 찍히고, 없으면 빈칸입니다. ' +
      '보험 이야기가 들어간 게시물은 <b>준법감시필을 받은 뒤</b> 올리세요.</div></div>';
  }
  window.cxTheme = function (id) {
    CN.style = (CN.style === id) ? 'news' : id;
    B.theme = isMine(CN.style) ? CN.style : ''; bSave();
    var h = document.getElementById('cnHost'); if (h) h.innerHTML = window.renderTodayCard();
  };
  /* 글자를 칠 때마다 미리보기만 다시 그린다 — 칸을 통째로 다시 그리면 커서가 빠진다 */
  var _pt = null;
  window.cxField = function (k, v) {
    B[k] = '' + v; bSave();
    clearTimeout(_pt); _pt = setTimeout(function () {
      repaintSteps();
      var st = document.querySelector('#cnHost .cn2-stage'); if (!st) return;
      var slides = cardnewsSlides(), cur = st.children[1];
      if (cur) { var tmp = document.createElement('div'); tmp.innerHTML = window.cnSlidePreview(slides[CN.i], CN.i, slides.length); if (tmp.firstChild) st.replaceChild(tmp.firstChild, cur); }
    }, 160);
  };
  var _origRender = window.renderTodayCard;
  window.renderTodayCard = function () {
    var h = _origRender.apply(this, arguments);
    var t = themeOf(CN.style);
    if (t) {
      var n = cardnewsSlides().length;
      h = h.replace(/<span class="cn-badge">[^<]*<\/span>/, '<span class="cn-badge">' + n + '장 · ' + t.ic + ' ' + t.name + '</span>');
    }
    if (t) h = h.replace('<button class="btn btn-ghost" onclick="cnPick()">🖼 직접 업로드</button>',
      '<button class="btn" style="background:var(--t-ink,#191F28);color:#fff;border:none" onclick="cxPkOpen(CN.i)">📷 실사 사진 찾기</button><button class="btn btn-ghost" onclick="cnPick()">🖼 직접 업로드</button>');
    var at = h.indexOf('<div class="cn2-stage">');
    return at < 0 ? h : h.slice(0, at) + panelHtml() + pkHtml() + h.slice(at);
  };

  /* ── 저장 — 화면과 같은 HTML 을 html2canvas 로 굽는다 ── */
  function fontsReady() { try { return document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(); } catch (e) { return Promise.resolve(); } }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  /* ⚠ html2canvas 1.4.1 은 box-shadow 를 <b>상자 위에</b> 칠한다 — 흰 카드가 회색(214)으로
     구워졌다(2026-10-28 실측: 그림자 끄면 255, 흐림만 빼도 214). 그래서 굽기 직전에
     그림자를 지우고, 같은 자리·같은 각도의 반투명 판을 <b>바로 앞 형제</b>로 깔아 대신한다. */
  function fakeShadows(root) {
    var els = root.querySelectorAll('*'), i;
    for (i = 0; i < els.length; i++) {
      var el = els[i], cs = getComputedStyle(el), bs = cs.boxShadow;
      if (!bs || bs === 'none') continue;
      el.style.boxShadow = 'none';
      if (cs.position !== 'absolute' || el.offsetParent !== el.parentNode) continue;
      var m = bs.match(/rgba?\(([^)]+)\)\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/);
      if (!m) continue;
      var ch = m[1].split(','), a = ch.length > 3 ? parseFloat(ch[3]) : 1, dy = parseFloat(m[3]), bl = parseFloat(m[4]);
      [[0.55, dy * 0.6, 0], [0.28, dy, bl * 0.35]].forEach(function (L) {
        var sh = document.createElement('div'), g = L[2];
        sh.style.cssText = 'position:absolute;left:' + (el.offsetLeft - g) + 'px;top:' + (el.offsetTop + L[1] - g) + 'px;width:' + (el.offsetWidth + g * 2) + 'px;height:' + (el.offsetHeight + g * 2) + 'px;' +
          'border-radius:' + cs.borderRadius + ';transform:' + cs.transform + ';background:rgba(0,0,0,' + (a * L[0]).toFixed(3) + ')';
        el.parentNode.insertBefore(sh, el);
      });
    }
  }
  function bake(sl, idx, n) {
    var get = window.ensureHtml2Canvas ? window.ensureHtml2Canvas() : (window.html2canvas ? Promise.resolve(window.html2canvas) : Promise.reject(new Error('html2canvas 없음')));
    return get.then(function (h2c) {
      var host = document.createElement('div');
      host.setAttribute('aria-hidden', 'true');
      host.style.cssText = 'position:absolute;left:-12000px;top:0;width:1080px;height:1350px;overflow:hidden;pointer-events:none';
      host.innerHTML = slideHtml(sl, idx, n, false);
      document.body.appendChild(host);
      var node = host.firstChild;
      try { fakeShadows(node); } catch (e) {}
      return wait(60).then(fontsReady).then(function () { return wait(120); }).then(fontsReady).then(function () {
        return h2c(node, { scale: 1, width: 1080, height: 1350, backgroundColor: null, useCORS: true, logging: false, scrollX: 0, scrollY: 0, windowWidth: 1280, windowHeight: 1400 });
      }).then(function (c) { try { host.remove(); } catch (e) {} return c; }, function (e) { try { host.remove(); } catch (x) {} throw e; });
    });
  }
  window.cxBake = bake; /* 점검용 */
  function failSay(e) { return (typeof flFailText === 'function') ? flFailText(e) : ('' + (e && e.message || e)); }
  var _origOne = window.cardnewsSaveOne, _origAll = window.cardnewsSaveAll;
  window.cardnewsSaveOne = function () {
    if (!isMine(CN.style)) return _origOne.apply(this, arguments);
    if (!cxAsk()) return;
    if (typeof cnNumAsk === 'function' && !cnNumAsk()) return;
    var slides = cardnewsSlides(), i = CN.i;
    toast('이 장을 굽는 중입니다…');
    bake(slides[i], i, slides.length).then(function (c) {
      cnDownload(c, cnFileName(i));
      var empty = !(CN.imgs && CN.imgs[i]);
      toast(empty ? '이 장을 저장했습니다 (1080×1350) — 사진이 빈 칸입니다. 「AI 사진 생성」 이나 「직접 업로드」 로 채우면 더 좋습니다.' : '이 장을 저장했습니다 (1080×1350).', empty ? 8000 : 1900);
    }).catch(function (e) { toast('이미지를 굽지 못했습니다 — ' + failSay(e), 8000); });
  };
  window.cardnewsSaveAll = function () {
    if (!isMine(CN.style)) return _origAll.apply(this, arguments);
    if (!cxAsk()) return;
    if (typeof cnNumAsk === 'function' && !cnNumAsk()) return;
    var slides = cardnewsSlides(), n = slides.length, i = 0;
    toast((typeof cnSaveSay === 'function') ? cnSaveSay(slides, n + '장을 차례로 굽습니다. 여러 파일 저장 안내가 뜨면 허용하세요.') : n + '장을 굽습니다.', 6000);
    (function step() {
      if (i >= n) { toast(n + '장을 모두 저장했습니다 (1080×1350).', 2600); return; }
      var k = i;
      bake(slides[k], k, n).then(function (c) { cnDownload(c, cnFileName(k)); i++; setTimeout(step, 350); })
        .catch(function (e) { toast((k + 1) + '번째 장을 굽지 못했습니다 — ' + failSay(e), 8000); });
    })();
  };

  /* 이미 그려져 있으면 다시 그린다 (이 파일이 늦게 붙었을 때) */
  try { var hh = document.getElementById('cnHost'); if (hh && hh.innerHTML) hh.innerHTML = window.renderTodayCard(); } catch (e) {}
})();
