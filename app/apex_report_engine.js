/* ═══════════════════════════════════════════════════════════════
   APEX 재무 리포트 엔진 — 토스 테마 (카톡용 HTML 1장 · A4 PDF)

   APEX_REPORT.html(data)      → 완성된 HTML 문자열 (외부 파일 0)
   APEX_REPORT.open(data)      → 새 창으로 열기
   APEX_REPORT.download(data)  → .html 로 저장
   APEX_REPORT.calc.*          → 계산만 (변액연금 · 퇴직소득세 · 국민연금 · 4대보험)
   APEX_REPORT.selfTest()      → 검증값 대조 (scripts/check-report.js 가 부릅니다)

   ★ 계산 규칙은 RULE 한 곳에만 둡니다. 화면 글이 따로 숫자를 외우지 않습니다 (CLAUDE.md 5번).
   ★ 모르는 값은 그리지 않습니다 — 적립금·연금이 없으면 그 칸을 세우지 않고 무엇을
     채워야 하는지 적습니다. 가정한 값은 「가정」 꼬리표를 끝까지 달고 다닙니다 (1번).
   ★ 세금은 언제나 「요건 충족 시」 · 한도·나이·개월 숫자는 글로 적지 않습니다 (2번).
   ★ tnum(font-feature-settings) 을 쓰지 않습니다 — PDF 로 뽑으면 숫자가 사라집니다 (4-1번).
   ★ 강조는 **굵게**, 줄바꿈은 \n — data 에 HTML 을 넣어도 글자 그대로 찍힙니다.
   단위는 전부 「만 원」 입니다.
   ═══════════════════════════════════════════════════════════════ */
(function (g) {
'use strict';

/* ── 계산 규칙 (2026 기준 · 사장님 지정값) ─────────────────────── */
var RULE = {
  annuity: { costDrag: 0.0206, annuityFactor: 200, receiveUntil: 90 },
  /* 근속연수공제 : [n 이하, 기본, n 초과분 1년당, 기준 n] */
  serviceDeduct: [[5, 0, 100, 0], [10, 500, 200, 5], [20, 1500, 250, 10], [Infinity, 4000, 300, 20]],
  /* 환산급여공제 : [이하, 기본, 초과분 비율, 기준] */
  convDeduct: [[800, 0, 1, 0], [7000, 800, 0.60, 800], [10000, 4520, 0.55, 7000], [30000, 6170, 0.45, 10000], [Infinity, 15170, 0.35, 30000]],
  /* 종합소득세율 : [이하, 세율, 누진공제] (만 원) */
  incomeTax: [[1400, 0.06, 0], [5000, 0.15, 126], [8800, 0.24, 576], [15000, 0.35, 1544], [30000, 0.38, 1994], [50000, 0.40, 2594], [100000, 0.42, 3594], [Infinity, 0.45, 6594]],
  localTax: 0.10,
  irpEarly: 0.70, irpLate: 0.60,          /* 연금으로 받으면 내는 비율 (초기 / 장기) */
  irpLimitMul: 1.2,
  nps: { k: 1.29, A: 319.35, bMin: 41, bMax: 659, rate: 0.095 },
  social: { nps: 0.0475, health: 0.03595, care: 0.1314, employ: 0.009 }
};

function r0(v) { return Math.round(Number(v) || 0); }
function pick(tbl, x) { for (var i = 0; i < tbl.length; i++) if (x <= tbl[i][0]) return tbl[i]; return tbl[tbl.length - 1]; }

/* 변액연금 — 최저보증은 단리(매 납입월마다), 펀드는 월복리 */
function annuity(p) {
  p = p || {};
  var prem = +p.premium || 0, pay = +p.payYears || 0;
  var M = Math.max(0, ((+p.openAge || 0) - (+p.startAge || 0)) * 12), n = Math.min(pay * 12, M);
  var drag = p.costDrag != null ? +p.costDrag : RULE.annuity.costDrag;
  var fac = +p.annuityFactor || RULE.annuity.annuityFactor;
  var gr = p.guaranteeRate == null || p.guaranteeRate === '' ? null : +p.guaranteeRate;
  var principal = prem * n;
  var guaranteed = null;
  if (gr != null) { guaranteed = 0; for (var k = 0; k < n; k++) guaranteed += prem * (1 + gr * (M - k) / 12); }
  function fund(rate) {
    var net = rate - drag, bal = 0;
    for (var m = 0; m < M; m++) { if (m < n) bal += prem; bal *= 1 + net / 12; }
    return bal;
  }
  function at(rate) {
    var f = fund(rate), base = guaranteed != null ? Math.max(guaranteed, f) : f;
    return { rate: rate, fund: f, base: base, monthly: base / fac, byGuarantee: guaranteed != null && guaranteed >= f };
  }
  return { principal: principal, guaranteed: guaranteed, guaranteedMonthly: guaranteed != null ? guaranteed / fac : null,
           months: M, payMonths: n, factor: fac, drag: drag, fund: fund, at: at };
}

function incomeTax(base) { base = Math.max(0, base); var b = pick(RULE.incomeTax, base); return Math.max(0, base * b[1] - b[2]); }

/* 퇴직소득세 — 일시금 / IRP 연금 수령(초기·장기) */
function retireTax(severance, years) {
  severance = +severance || 0; years = Math.max(1, Math.ceil(+years || 0));
  var s = pick(RULE.serviceDeduct, years), sd = s[1] + s[2] * (years - s[3]);
  var conv = Math.max(0, severance - sd) * 12 / years;
  var c = pick(RULE.convDeduct, conv), cd = conv <= 800 ? conv : c[1] + (conv - c[3]) * c[2];
  var base = Math.max(0, conv - cd);
  var nat = incomeTax(base) * years / 12, total = nat * (1 + RULE.localTax);
  return { severance: severance, years: years, serviceDeduct: sd, converted: conv, convDeduct: cd, base: base,
           national: nat, local: nat * RULE.localTax, total: total,
           irpEarly: total * RULE.irpEarly, irpLate: total * RULE.irpLate };
}
/* 연금수령 한도(연) — 평가액 ÷ (11 − 수령연차) × 120% */
function irpLimit(value, yearNo) { var d = 11 - (+yearNo || 1); return d > 0 ? value / d * RULE.irpLimitMul : null; }

/* 국민연금 추정 — 공단 조회액이 있으면 이것을 쓰지 않습니다 */
function nps(B, years) {
  var N = RULE.nps, b = Math.min(N.bMax, Math.max(N.bMin, +B || 0)), y = +years || 0;
  var m = N.k * (N.A + b) * (1 + 0.05 * (y - 20)) / 12;
  if (y < 20) m = N.k * (N.A + b) / 12 * y / 20;
  return { monthly: m, B: b, years: y };
}

/* 4대보험 근로자 부담분 (월) */
function social(monthlyGross) {
  var S = RULE.social, N = RULE.nps, w = +monthlyGross || 0;
  var pn = Math.min(N.bMax, Math.max(N.bMin, w)) * S.nps, h = w * S.health, c = h * S.care, e = w * S.employ;
  return { nps: pn, health: h, care: c, employ: e, total: pn + h + c + e };
}

var calc = { RULE: RULE, annuity: annuity, retireTax: retireTax, irpLimit: irpLimit, nps: nps, social: social, incomeTax: incomeTax };

/* 사장님이 주신 검증값 — 하나라도 벗어나면 리포트를 믿을 수 없습니다 */
function selfTest() {
  var out = [];
  function t(name, got, want, tol) { out.push({ name: name, got: got, want: want, ok: Math.abs(got - want) <= tol }); }
  var a = annuity({ premium: 100, payYears: 10, startAge: 42, openAge: 65, guaranteeRate: 0.07 });
  t('변액 최저보증 적립금 (약 2.72억)', a.guaranteed, 27200, 100);
  t('변액 최저보증 월연금 (약 136만)', a.guaranteedMonthly, 136, 1);
  var rt = retireTax(35000, 30);
  t('퇴직소득세 일시금 (약 1,506만)', rt.total, 1506, 1);
  t('퇴직소득세 IRP 초기 (약 1,054만)', rt.irpEarly, 1054, 1);
  t('퇴직소득세 IRP 장기 (약 903만)', rt.irpLate, 903, 1);
  t('국민연금 추정 (약 184만)', nps(659, 35).monthly, 184, 1);
  return out;
}

/* ── 글 ─────────────────────────────────────────────────────── */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function txt(s) { return esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\\n|\n/g, '<br>'); }
function josa(word, a, b) { var c = String(word || '').replace(/[\s)」』"']+$/, '').slice(-1).charCodeAt(0); if (c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28 ? a : b; return b; }
function comma(n) { return r0(n).toLocaleString('ko-KR'); }
/* 큰 숫자 + 작은 단위 — 27155 → 2억 7,155만 원 */
function man(v, opt) {
  opt = opt || {};
  if (v == null || v === '' || !isFinite(+v)) return '<span class="nv">—</span>';
  var n = r0(v), neg = n < 0, a = Math.abs(n), e = Math.floor(a / 10000), r = a % 10000, s = neg ? '−' : '';
  var u = opt.unit != null ? opt.unit : '만 원';
  if (e) return '<span class="nb">' + s + e + '</span><span class="nu">억</span>' + (r ? ' <span class="nb">' + comma(r) + '</span><span class="nu">' + u + '</span>' : '<span class="nu">' + (u === '만 원' ? ' 원' : '') + '</span>');
  return '<span class="nb">' + s + comma(r) + '</span><span class="nu">' + u + '</span>';
}
function manTxt(v) { var n = r0(v), a = Math.abs(n), e = Math.floor(a / 10000), r = a % 10000; return (n < 0 ? '−' : '') + (e ? e + '억' + (r ? ' ' + comma(r) + '만' : '') : comma(r) + '만') + ' 원'; }
function big(v, unit) {
  if (typeof v === 'number') return man(v, unit != null ? { unit: unit } : null);
  if (v == null || v === '') return '<span class="nv">—</span>';
  return '<span class="nb">' + esc(v) + '</span>' + (unit ? '<span class="nu">' + esc(unit) + '</span>' : '');
}
var TONE = { blue: '#3182F6', green: '#03B26C', orange: '#FE9800', red: '#F04452', purple: '#8B5CF6', mint: '#18A5A5', gray: '#8B95A1' };
var TONE_BG = { blue: '#E8F3FF', green: '#E5F8F0', orange: '#FFF3E0', red: '#FDECEE', purple: '#F1ECFE', mint: '#E3F5F5', gray: '#F2F4F6' };
var TONE_ORDER = ['blue', 'mint', 'purple', 'orange', 'green', 'red', 'gray'];
function tone(t, i) { return TONE[t] ? t : TONE_ORDER[(i || 0) % TONE_ORDER.length]; }
function icon(k, cls) {
  var I = g.APEX_REPORT_ICONS || {};
  return I[k] ? '<img class="' + (cls || 'ic') + '" src="' + I[k] + '" alt="">' : '';
}
function tag(t) { return t ? '<span class="as">' + esc(t === true ? '가정' : t) + '</span>' : ''; }

/* ── 차트 (SVG/CSS 직접) ────────────────────────────────────── */
function donut(items, center, sub) {
  var tot = 0; items.forEach(function (x) { tot += Math.max(0, +x.value || 0); });
  var R = 62, C = 2 * Math.PI * R, off = 0, segs = '';
  items.forEach(function (x, i) {
    var v = Math.max(0, +x.value || 0); if (!tot || !v) return;
    var len = C * v / tot;
    segs += '<circle cx="80" cy="80" r="' + R + '" fill="none" stroke="' + TONE[tone(x.tone, i)] + '" stroke-width="24" stroke-dasharray="' +
      (len - 1.5).toFixed(2) + ' ' + (C - len + 1.5).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 80 80)"/>';
    off += len;
  });
  var legend = items.map(function (x, i) {
    var v = +x.value || 0;
    return '<div class="lg"><i style="background:' + TONE[tone(x.tone, i)] + '"></i><span class="lg-n">' + esc(x.name) + tag(x.assumed) +
      '</span><span class="lg-v">' + manTxt(v) + '<em>' + (tot ? Math.round(v / tot * 100) : 0) + '%</em></span></div>';
  }).join('');
  return '<div class="donut"><svg viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="배분 도넛">' +
    '<circle cx="80" cy="80" r="' + R + '" fill="none" stroke="#F2F4F6" stroke-width="24"/>' + segs +
    '<text x="80" y="76" text-anchor="middle" class="dc1">' + esc(sub || '매월') + '</text>' +
    '<text x="80" y="98" text-anchor="middle" class="dc2">' + esc(center != null ? center : manTxt(tot)) + '</text></svg>' +
    '<div class="legend">' + legend + '</div></div>';
}
function hbars(items, unit) {
  var max = 0; items.forEach(function (x) { max = Math.max(max, +x.value || 0); });
  return '<div class="hb">' + items.map(function (x, i) {
    var v = +x.value || 0, w = max ? Math.max(2, v / max * 100) : 0, t = tone(x.tone || (x.hi ? 'blue' : 'gray'), i);
    return '<div class="hb-row' + (x.hi ? ' hi' : '') + '"><div class="hb-l">' + esc(x.label) + (x.badge ? '<span class="bd" style="background:' + TONE_BG[t] + ';color:' + TONE[t] + '">' + esc(x.badge) + '</span>' : '') + '</div>' +
      '<div class="hb-t"><div class="hb-f" style="width:' + w.toFixed(1) + '%;background:' + TONE[t] + '"></div></div>' +
      '<div class="hb-v">' + (x.display != null ? esc(x.display) : (unit === '%' ? esc(v) + '%' : manTxt(v))) + '</div></div>';
  }).join('') + '</div>';
}
/* 누적 막대 + 목표선 */
function stack(items, goal, goalLabel) {
  var tot = 0; items.forEach(function (x) { tot += Math.max(0, +x.value || 0); });
  var scale = Math.max(tot, +goal || 0) * 1.08 || 1, gl = goal ? (goal / scale * 100) : null;
  var segs = items.map(function (x, i) {
    var v = Math.max(0, +x.value || 0);
    return v ? '<div class="st-s" style="width:' + (v / scale * 100).toFixed(2) + '%;background:' + TONE[tone(x.tone, i)] + '"></div>' : '';
  }).join('');
  var legend = items.map(function (x, i) {
    return '<div class="lg"><i style="background:' + TONE[tone(x.tone, i)] + '"></i><span class="lg-n">' + esc(x.label) + tag(x.assumed) + '</span><span class="lg-v">' + manTxt(x.value) + '</span></div>';
  }).join('');
  var gap = goal ? tot - goal : null;
  return '<div class="st"><div class="st-bar">' + segs +
    (gl != null ? '<div class="st-goal" style="left:' + gl.toFixed(2) + '%"><span>' + esc(goalLabel || '목표') + ' ' + manTxt(goal) + '</span></div>' : '') + '</div>' +
    '<div class="st-sum"><span>합계 <b>' + manTxt(tot) + '</b></span>' +
    (gap != null ? '<span class="' + (gap >= 0 ? 'ok' : 'ng') + '">' + (gap >= 0 ? '목표보다 ' + manTxt(gap) + ' 여유' : '목표까지 ' + manTxt(-gap) + ' 부족') + '</span>' : '') +
    '</div><div class="legend">' + legend + '</div></div>';
}
function timeline(steps) {
  return '<div class="tl" style="--n:' + steps.length + '">' + steps.map(function (s, i) {
    var t = tone(s.tone || (i === steps.length - 1 ? 'blue' : 'gray'), i);
    return '<div class="tl-i"><div class="tl-d" style="background:' + TONE[t] + '"></div><div class="tl-a">' + esc(s.age != null ? s.age + '세' : (s.when || '')) +
      '</div><div class="tl-t">' + esc(s.label) + '</div>' + (s.sub ? '<div class="tl-s">' + txt(s.sub) + '</div>' : '') + '</div>';
  }).join('') + '</div>';
}

/* 한 달 30일 — 「지금 준비된 돈으로 며칠을 사나」.
   ★ 고객 본인의 숫자(준비된 돈 ÷ 목표)로만 셉니다. 바깥 통계·겁주는 말로 부족을 만들지 않습니다(1번). */
function daysOf(now, goal) { return goal > 0 ? Math.max(0, Math.min(30, Math.round(now / goal * 30))) : 0; }
function dayGrid(n, t) {
  var s = '';
  for (var i = 1; i <= 30; i++) s += '<i' + (i <= n ? ' class="on" style="background:' + TONE[tone(t || 'blue', 0)] + '"' : '') + '>' + i + '</i>';
  return '<div class="dg" role="img" aria-label="한 달 30일 중 ' + n + '일">' + s + '</div>';
}
function daysText(n, now, goal) {
  return n >= 30 ? '지금 준비된 돈(**' + manTxt(now) + '**)으로 한 달을 다 채워요.'
    : '한 달 30일 중 **' + n + '일**만 지금 준비된 돈(**' + manTxt(now) + '**)으로 살 수 있어요.\n나머지 **' + (30 - n) + '일**, 매달 **' + manTxt(goal - now) + '**은 아직 비어 있어요.';
}
function progress(p, t) {
  var w = Math.max(0, Math.min(100, p * 100));
  return '<div class="pg"><i style="width:' + w.toFixed(1) + '%;background:' + TONE[tone(t || 'blue', 0)] + '"></i></div>';
}
/* 누적 막대 여러 줄 — 「지금 그대로」 와 「제안 후」 를 같은 자로 견줍니다 */
function stackRows(rows, goal, goalLabel) {
  var max = +goal || 0;
  rows.forEach(function (r) { var s = 0; r.items.forEach(function (x) { s += Math.max(0, +x.value || 0); }); r.total = s; max = Math.max(max, s); });
  var scale = max * 1.08 || 1, gl = goal ? goal / scale * 100 : null, seen = {}, legend = [];
  var body = rows.map(function (r, ri) {
    var segs = r.items.map(function (x, i) {
      var v = Math.max(0, +x.value || 0), tn = tone(x.tone, i);
      if (!seen[x.label]) { seen[x.label] = 1; legend.push('<div class="lg"><i style="background:' + TONE[tn] + '"></i><span class="lg-n">' + esc(x.label) + tag(x.assumed) + '</span><span class="lg-v">' + manTxt(x.value) + '</span></div>'); }
      return v ? '<div class="st-s" style="width:' + (v / scale * 100).toFixed(2) + '%;background:' + TONE[tn] + '"></div>' : '';
    }).join('');
    var gap = goal ? r.total - goal : null;
    return '<div class="sr"><div class="sr-l">' + esc(r.label) + '</div><div class="st-bar' + (ri ? ' st-n' : '') + '">' + segs +
      (gl != null ? '<div class="st-goal" style="left:' + gl.toFixed(2) + '%">' + (ri ? '' : '<span>' + esc(goalLabel || '목표') + ' ' + manTxt(goal) + '</span>') + '</div>' : '') + '</div>' +
      '<div class="st-sum"><span>매달 <b>' + manTxt(r.total) + '</b></span>' +
      (gap != null ? '<span class="' + (gap >= 0 ? 'ok' : 'ng') + '">' + (gap >= 0 ? '목표보다 ' + manTxt(gap) + ' 여유' : '매달 ' + manTxt(-gap) + ' 부족') + '</span>' : '') + '</div></div>';
  }).join('');
  return '<div class="st">' + body + '<div class="legend">' + legend.join('') + '</div></div>';
}

/* ── 카드 ───────────────────────────────────────────────────── */
var VERDICT = { '가능': 'green', '주의': 'orange', '점검 필요': 'red', '불가': 'red' };   /* 고객 결과지는 「불가」 대신 「점검 필요」 (판 X161) */
function cardHead(c) {
  return c.title ? '<div class="ch">' + icon(c.icon, 'ic') + '<div><div class="ct">' + txt(c.title) + tag(c.assumed) + '</div>' + (c.sub ? '<div class="cs">' + txt(c.sub) + '</div>' : '') + '</div></div>' : '';
}
function tiles(items, cols) {
  return '<div class="tiles c' + cols + '">' + (items || []).map(function (x, i) {
    var t = tone(x.tone, i);
    return '<div class="tile"' + (x.tone ? ' style="background:' + TONE_BG[t] + '"' : '') + '><div class="tk">' + esc(x.label) + tag(x.assumed) + '</div>' +
      '<div class="tv"' + (x.tone ? ' style="color:' + TONE[t] + '"' : '') + '>' + big(x.value, x.unit) + '</div>' + (x.sub ? '<div class="ts">' + txt(x.sub) + '</div>' : '') + '</div>';
  }).join('') + '</div>';
}
var CARD = {
  verdict: function (c) {
    var t = VERDICT[c.status] || tone(c.tone, 0);
    return '<div class="vd" style="border-color:' + TONE[t] + '"><div class="vd-h"><span class="vd-b" style="background:' + TONE[t] + '">' + esc(c.status || '확인') + '</span>' +
      '<div class="vd-t">' + txt(c.title || '') + '</div></div>' + (c.text ? '<p class="p">' + txt(c.text) + '</p>' : '') +
      (c.reasons && c.reasons.length ? '<div class="vd-k">근거</div><ul class="ul">' + c.reasons.map(function (x) { return '<li>' + txt(x) + '</li>'; }).join('') + '</ul>' : '') +
      (c.checks && c.checks.length ? '<div class="vd-k">확인할 것</div><ul class="ul chk">' + c.checks.map(function (x) { return '<li>' + txt(x) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
  },
  tiles: function (c) { return tiles(c.items, 2); },
  tiles3: function (c) { return tiles(c.items, 3); },
  rows: function (c) {
    return '<div class="rows">' + (c.items || []).map(function (x) {
      return '<div class="row' + (x.strong ? ' strong' : '') + '"><div><div class="rl">' + txt(x.label) + tag(x.assumed) + '</div>' + (x.note ? '<div class="rn">' + txt(x.note) + '</div>' : '') + '</div>' +
        '<div class="rv">' + (typeof x.value === 'number' ? manTxt(x.value) : esc(x.value)) + '</div></div>';
    }).join('') + '</div>';
  },
  table: function (c) {
    return '<div class="tb-w"><table class="tb"><thead><tr>' + (c.head || []).map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (c.rows || []).map(function (r, i) {
        return '<tr' + (c.highlight === i ? ' class="hi"' : '') + '>' + r.map(function (v) { return '<td>' + (typeof v === 'number' ? manTxt(v) : txt(v)) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>' + (c.note ? '<div class="note">' + txt(c.note) + '</div>' : '');
  },
  bars: function (c) { return hbars(c.items || [], c.unit); },
  stack: function (c) { return c.rows ? stackRows(c.rows, c.goal, c.goalLabel) : stack(c.items || [], c.goal, c.goalLabel); },
  days: function (c) { var n = daysOf(c.now, c.goal); return dayGrid(n, c.tone) + '<p class="p dg-t">' + txt(c.text || daysText(n, c.now, c.goal)) + '</p>'; },
  /* 스스로 점검 — 고객이 「나는 이걸 모르는구나」 를 스스로 느끼는 칸. 체크는 HTML 그대로 눌립니다(스크립트 0) */
  quiz: function (c) {
    return '<ol class="qz">' + (c.items || []).map(function (x) {
      return '<li><div class="q">' + txt(x.q || x) + '</div>' + (x.hint ? '<div class="h">' + txt(x.hint) + '</div>' : '') +
        '<label><input type="checkbox"> 바로 답할 수 있어요</label></li>';
    }).join('') + '</ol>';
  },
  progress: function (c) { return progress(c.value, c.tone) + (c.text ? '<p class="p pg-t">' + txt(c.text) + '</p>' : ''); },
  grid: function (c) {
    return '<div class="grid">' + (c.items || []).map(function (x, i) {
      return '<div class="gi">' + icon(x.icon, 'gic') + '<div class="gt">' + txt(x.title) + '</div><div class="gx">' + txt(x.text || '') + '</div></div>';
    }).join('') + '</div>';
  },
  how: function (c) {
    return '<ol class="how">' + (c.items || []).map(function (x, i) {
      return '<li><span class="hn">' + (i + 1) + '</span><div><div class="ht">' + txt(x.title || x) + '</div>' + (x.text ? '<div class="hx">' + txt(x.text) + '</div>' : '') + '</div></li>';
    }).join('') + '</ol>';
  },
  text: function (c) { return '<p class="p">' + txt(c.text || '') + '</p>'; },
  steps: function (c) { return vsteps(c.items || []); }
};
function vsteps(items) {
  return '<div class="vs">' + items.map(function (x, i) {
    var t = tone(x.tone || 'blue', i);
    return '<div class="vs-i"><div class="vs-d" style="border-color:' + TONE[t] + '"></div><div class="vs-w">' + esc(x.when || '') + '</div>' +
      '<div class="vs-t">' + txt(x.title || '') + '</div>' + (x.text ? '<div class="vs-x">' + txt(x.text) + '</div>' : '') + '</div>';
  }).join('') + '</div>';
}
function card(c) {
  var f = CARD[c.type] || CARD.text;
  return '<div class="card">' + (c.type === 'verdict' ? '' : cardHead(c)) + f(c) + (c.type !== 'table' && c.note ? '<div class="note">' + txt(c.note) + '</div>' : '') + '</div>';
}
function section(no, kicker, title, body, ico) {
  return '<section class="sec"><div class="sh"><div class="sk">' + (no ? '<b>' + no + '</b> ' : '') + esc(kicker) + '</div><h2>' + icon(ico, 'hic') + txt(title) + '</h2></div>' + body + '</section>';
}

/* ── 연금 숫자 — 엔진이 직접 셉니다 (rows 가 오면 그것을 씁니다) ── */
function pensionModel(p) {
  if (!p) return null;
  var a = annuity(p), target = p.targetRate != null ? +p.targetRate : null;
  var rates = (p.rates && p.rates.length ? p.rates.slice() : [0.05, 0.07, 0.095]).map(Number);
  if (target != null && rates.indexOf(target) < 0) rates.push(target);
  rates.sort(function (x, y) { return x - y; });
  var rows = p.rows;  /* 화면이 이미 센 값(예: 계산기의 상품 엔진)을 그대로 넘길 때 */
  if (!rows) {
    rows = [];
    if (a.guaranteed != null) rows.push({ label: '최저보증', monthly: a.guaranteedMonthly, fund: a.guaranteed, guarantee: true });
    rates.forEach(function (r) {
      var x = a.at(r);
      rows.push({ label: (r === target ? '목표 ' : '') + pctTxt(r), rate: r, monthly: x.monthly, fund: x.base, target: r === target, byGuarantee: x.byGuarantee });
    });
  }
  var tg = null; rows.forEach(function (x) { if (x.target) tg = x; });
  if (!tg) rows.forEach(function (x) { if (!x.guarantee && !tg) tg = x; });
  var until = +p.receiveUntil || RULE.annuity.receiveUntil, yrs = Math.max(0, until - (+p.openAge || 0));
  return { input: p, a: a, rows: rows, target: tg, principal: p.principal != null ? +p.principal : a.principal, receiveUntil: until, receiveYears: yrs,
           untilAssumed: p.receiveUntil == null };
}
function pctTxt(r) { return (Math.round(r * 10000) / 100) + '%'; }

/* ── CSS ────────────────────────────────────────────────────── */
var CSS = [
  ':root{--bg:#F2F4F6;--card:#fff;--blue:#3182F6;--blue-d:#1B64DA;--blue-l:#E8F3FF;--t1:#191F28;--t2:#4E5968;--t3:#8B95A1;--line:#E5E8EB}',
  '*{box-sizing:border-box;margin:0;padding:0}',
  'html{-webkit-text-size-adjust:100%}',
  'body{background:var(--bg);color:var(--t2);font-family:Pretendard,"Pretendard Variable",-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif;font-size:15px;line-height:1.6;word-break:keep-all;overflow-wrap:anywhere;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
  '.wrap{max-width:560px;margin:0 auto;padding:20px 16px 40px}',
  'b{color:var(--t1);font-weight:700}',
  '.ic{width:36px;height:36px;flex:none}.hic{width:28px;height:28px;vertical-align:-6px;margin-right:6px}.gic{width:32px;height:32px;display:block;margin-bottom:8px}',
  '.as{display:inline-block;white-space:nowrap;margin-left:5px;padding:1px 6px;border-radius:6px;background:#FFF3E0;color:#C46A00;font-size:11px;font-weight:700;vertical-align:2px;line-height:1.5}',
  /* 히어로 */
  '.hero{background:var(--card);border-radius:20px;padding:28px 22px 24px;margin-bottom:12px}',
  '.hero .hi0{width:56px;height:56px;margin-bottom:12px}',
  '.hero .who{font-size:13px;color:var(--t3);font-weight:600;margin-bottom:6px}',
  '.hero h1{font-size:26px;line-height:1.38;color:var(--t1);font-weight:800;letter-spacing:-.02em}',
  '.hero .one{margin-top:10px;font-size:16px;color:var(--t2)}',
  '.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px}.chip{background:var(--bg);color:var(--t2);font-size:13px;font-weight:600;padding:5px 11px;border-radius:999px}',
  /* KPI */
  '.kpi{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}',
  '.kp{background:var(--card);border-radius:20px;padding:18px 18px 16px;min-width:0}',
  '.kp .kl{font-size:13px;font-weight:600;color:var(--t3);display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px}.kp .kl img{width:22px;height:22px}',
  '.kp .kv{margin-top:8px;color:var(--t1);line-height:1.2}',
  '.kp .ks{margin-top:6px;font-size:12.5px;color:var(--t3);line-height:1.5}',
  '.nb{font-size:28px;font-weight:800;letter-spacing:-.03em}.nu{font-size:14px;font-weight:600;margin-left:2px;color:inherit;opacity:.8}.nv{font-size:22px;color:var(--t3)}',
  /* 섹션 */
  '.sec{margin-top:28px}',
  '.sh{padding:0 6px 12px}.sk{font-size:13px;font-weight:700;color:var(--blue)}.sk b{color:var(--blue)}',
  '.sh h2{font-size:21px;line-height:1.4;color:var(--t1);font-weight:800;letter-spacing:-.02em;margin-top:4px}',
  '.card{background:var(--card);border-radius:20px;padding:22px 20px;margin-bottom:10px;break-inside:avoid;page-break-inside:avoid}',
  '.ch{display:flex;gap:10px;align-items:center;margin-bottom:14px}.ct{font-size:17px;font-weight:700;color:var(--t1);line-height:1.4}.cs{font-size:13px;color:var(--t3);margin-top:2px}',
  '.p{font-size:15px;line-height:1.75}',
  '.note{margin-top:12px;font-size:12.5px;color:var(--t3);line-height:1.6}',
  /* 도넛 */
  '.donut{display:flex;gap:18px;align-items:center;flex-wrap:wrap}.donut svg{flex:none}',
  '.dc1{font-size:11px;fill:#8B95A1;font-weight:600}.dc2{font-size:15px;fill:#191F28;font-weight:800}',
  '.legend{flex:1 1 200px;min-width:0;display:flex;flex-direction:column;gap:8px}',
  '.lg{display:flex;align-items:center;gap:8px;font-size:14px}.lg i{width:10px;height:10px;border-radius:3px;flex:none}',
  '.lg-n{flex:1;min-width:0;color:var(--t2)}.lg-v{font-weight:700;color:var(--t1);white-space:nowrap}.lg-v em{font-style:normal;color:var(--t3);font-weight:600;margin-left:6px;font-size:12px}',
  /* 타임라인 */
  '.tl{display:grid;grid-template-columns:repeat(var(--n),1fr);position:relative;margin-top:4px}',
  '.tl:before{content:"";position:absolute;left:calc(50% / var(--n));right:calc(50% / var(--n));top:7px;height:2px;background:var(--line)}',
  '.tl-i{text-align:center;position:relative;padding:0 2px}.tl-d{width:16px;height:16px;border-radius:50%;margin:0 auto 8px;border:3px solid #fff;box-shadow:0 0 0 1px var(--line);position:relative}',
  '.tl-a{font-size:16px;font-weight:800;color:var(--t1)}.tl-t{font-size:13px;font-weight:700;color:var(--t2)}.tl-s{font-size:11.5px;color:var(--t3);line-height:1.45;margin-top:2px}',
  /* 리스트 */
  '.ul{list-style:none;display:flex;flex-direction:column;gap:8px}.ul li{position:relative;padding-left:22px;font-size:14.5px;line-height:1.6}',
  '.ul li:before{content:"";position:absolute;left:4px;top:8px;width:7px;height:7px;border-radius:50%;background:var(--t3)}',
  '.good li:before{content:"✓";background:none;color:#03B26C;font-weight:800;top:0;left:2px;width:auto;height:auto}',
  '.chk li:before{content:"□";background:none;color:var(--blue);top:0;left:2px;width:auto;height:auto;font-weight:700}',
  '.todo{counter-reset:td}.todo li{counter-increment:td;padding-left:30px}.todo li:before{content:counter(td);background:var(--blue-l);color:var(--blue);width:20px;height:20px;border-radius:50%;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;left:0;top:2px}',
  '.lst-h{font-size:14px;font-weight:800;color:var(--t1);margin:18px 0 10px;display:flex;align-items:center;gap:6px}.lst-h img{width:22px;height:22px}',
  /* 가로 막대 */
  '.hb{display:flex;flex-direction:column;gap:12px}',
  '.hb-row{display:grid;grid-template-columns:96px 1fr auto;gap:10px;align-items:center}',
  '.hb-l{font-size:13.5px;font-weight:600;color:var(--t2);line-height:1.3}.hb-row.hi .hb-l{color:var(--t1);font-weight:800}',
  '.bd{display:inline-block;font-size:10.5px;font-weight:800;padding:1px 5px;border-radius:5px;margin-left:4px;vertical-align:1px}',
  '.hb-t{height:14px;background:var(--bg);border-radius:7px;overflow:hidden}.hb-f{height:100%;border-radius:7px}',
  '.hb-v{font-size:14px;font-weight:700;color:var(--t1);text-align:right;white-space:nowrap}.hb-row.hi .hb-v{color:var(--blue)}',
  /* 누적 */
  '.st-bar{position:relative;height:30px;background:var(--bg);border-radius:10px;display:flex;overflow:visible;margin:30px 0 10px}',
  '.st-s{height:100%}.st-s:first-child{border-radius:10px 0 0 10px}',
  '.st-goal{position:absolute;top:-8px;bottom:-8px;width:0;border-left:2px dashed #F04452}',
  '.st-goal span{position:absolute;bottom:100%;right:-2px;transform:translateX(50%);white-space:nowrap;font-size:12px;font-weight:800;color:#F04452;margin-bottom:2px}',
  '.st-sum{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:14px;margin-bottom:14px}.st-sum .ok{color:#03B26C;font-weight:800}.st-sum .ng{color:#F04452;font-weight:800}',
  /* 타일 */
  '.tiles{display:grid;gap:8px}.tiles.c2{grid-template-columns:1fr 1fr}.tiles.c3{grid-template-columns:repeat(3,1fr)}',
  '.tile{background:var(--bg);border-radius:14px;padding:14px 14px 12px;min-width:0}',
  '.tk{font-size:12.5px;font-weight:600;color:var(--t3)}.tv{margin-top:6px;color:var(--t1);line-height:1.25}.tv .nb{font-size:21px}.tv .nu{font-size:12.5px}.ts{font-size:12px;color:var(--t3);margin-top:4px;line-height:1.45}',
  '.tiles.c3 .tv .nb{font-size:18px}',
  /* 줄 */
  '.rows{display:flex;flex-direction:column}.row{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid var(--line)}.row:last-child{border-bottom:0}',
  '.rl{font-size:14.5px;color:var(--t2)}.rn{font-size:12px;color:var(--t3);margin-top:2px}.rv{font-size:15px;font-weight:700;color:var(--t1);white-space:nowrap;text-align:right}',
  '.row.strong .rl,.row.strong .rv{color:var(--blue);font-weight:800}',
  /* 표 */
  '.tb-w{overflow-x:auto}.tb{width:100%;border-collapse:collapse;font-size:13.5px}',
  '.tb th{background:var(--bg);color:var(--t3);font-weight:700;font-size:12.5px;padding:9px 6px;text-align:right}.tb th:first-child{text-align:left;border-radius:10px 0 0 10px}.tb th:last-child{border-radius:0 10px 10px 0}',
  '.tb td{padding:11px 6px;border-bottom:1px solid var(--line);text-align:right;color:var(--t1);font-weight:600;white-space:nowrap}.tb td:first-child{text-align:left;color:var(--t2)}',
  '.tb tr.hi td{color:var(--blue);font-weight:800;background:var(--blue-l)}',
  /* 판정 */
  '.vd{border-left:4px solid;padding-left:14px}.vd-h{display:flex;align-items:center;gap:10px;margin-bottom:10px}',
  '.vd-b{color:#fff;font-size:13px;font-weight:800;padding:4px 10px;border-radius:8px;flex:none}.vd-t{font-size:17px;font-weight:800;color:var(--t1);line-height:1.4}',
  '.vd-k{font-size:12.5px;font-weight:800;color:var(--t3);margin:14px 0 6px}',
  /* 그리드 · 방법 · 세로 단계 */
  '.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.gi{background:var(--bg);border-radius:14px;padding:14px}.gt{font-size:14.5px;font-weight:800;color:var(--t1);line-height:1.4}.gx{font-size:13px;margin-top:4px;line-height:1.55}',
  '.how{list-style:none;display:flex;flex-direction:column;gap:14px}.how li{display:flex;gap:12px}.hn{flex:none;width:26px;height:26px;border-radius:50%;background:var(--blue);color:#fff;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center}',
  '.ht{font-size:15px;font-weight:700;color:var(--t1);line-height:1.45}.hx{font-size:13.5px;margin-top:2px;line-height:1.6}',
  '.vs{position:relative;padding-left:22px}.vs:before{content:"";position:absolute;left:6px;top:6px;bottom:6px;width:2px;background:var(--line)}',
  '.vs-i{position:relative;padding-bottom:16px}.vs-i:last-child{padding-bottom:0}.vs-d{position:absolute;left:-22px;top:4px;width:14px;height:14px;border-radius:50%;border:3px solid;background:#fff}',
  '.vs-w{font-size:12.5px;font-weight:800;color:var(--blue)}.vs-t{font-size:15px;font-weight:700;color:var(--t1);line-height:1.45}.vs-x{font-size:13.5px;line-height:1.6;margin-top:2px}',
  /* Q&A · 요약 */
  '.qa{border-bottom:1px solid var(--line);padding:14px 0}.qa:first-child{padding-top:0}.qa:last-child{border-bottom:0;padding-bottom:0}.qq{font-size:15.5px;font-weight:800;color:var(--t1);margin-bottom:6px}.qq:before{content:"Q. ";color:var(--blue)}',
  '.sum{list-style:none;counter-reset:s}.sum li{counter-increment:s;display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);font-size:15px;line-height:1.6}.sum li:last-child{border-bottom:0}',
  '.sum li:before{content:counter(s);flex:none;width:22px;height:22px;border-radius:7px;background:var(--blue-l);color:var(--blue);font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;margin-top:1px}',
  '.disc{margin-top:12px;background:transparent;padding:4px 6px;font-size:12px;color:var(--t3);line-height:1.7}.disc b{color:var(--t2)}.disc ul{list-style:none}.disc li{padding-left:10px;position:relative}.disc li:before{content:"·";position:absolute;left:0}',
  '.foot{margin-top:18px;text-align:center;font-size:12px;color:var(--t3)}',
  /* 지금 그대로면 — 30일 격자 */
  '.worry{margin-top:18px;padding:16px 14px;border-radius:16px;background:#FFF4F4}',
  '.wk{font-size:13.5px;font-weight:800;color:#F04452;margin-bottom:10px}',
  '.dg{display:grid;grid-template-columns:repeat(10,1fr);gap:4px}',
  '.dg i{font-style:normal;aspect-ratio:1/1;border-radius:6px;background:#fff;border:1.5px dashed #F7A1AA;font-size:10px;color:#F04452;display:flex;align-items:center;justify-content:center;font-weight:700}',
  '.dg i.on{border:0;color:#fff}',
  '.worry p,.dg-t{margin-top:10px;font-size:14.5px;color:var(--t1);line-height:1.65}',
  '.pg{height:16px;background:#FDECEE;border-radius:8px;overflow:hidden;margin-top:4px}.pg i{display:block;height:100%;border-radius:8px}',
  '.pg-t{margin-top:10px}',
  '.pg-l{display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:var(--t2)}.pg-l b{color:var(--blue)}',
  '.but{margin-top:14px;padding:12px 14px;background:#FFF4F4;border-radius:12px;font-size:14.5px;color:var(--t1);line-height:1.6}',
  '.sr+.sr{margin-top:6px}.sr-l{font-size:13px;font-weight:800;color:var(--t2);margin-top:14px}.st-bar.st-n{margin-top:8px}',
  '.qz{list-style:none;display:flex;flex-direction:column;gap:10px}.qz li{background:var(--bg);border-radius:14px;padding:14px}',
  '.qz .q{font-size:15px;font-weight:800;color:var(--t1);line-height:1.45}.qz .h{font-size:13px;margin-top:4px;line-height:1.55}',
  '.qz label{display:flex;align-items:center;gap:8px;margin-top:8px;min-height:32px;font-size:13.5px;font-weight:700;color:var(--blue-d)}.qz input{width:18px;height:18px}',
  '.aic{width:28px;height:28px;vertical-align:-8px;margin-right:6px}',
  '.wn{margin-top:8px;font-size:12.5px;color:var(--t2);line-height:1.6}',
  '.ask{background:var(--blue-l);border-radius:14px;padding:13px 15px;margin-top:12px;font-size:14px;color:var(--blue-d);font-weight:600;line-height:1.6}',
  '.empty{background:var(--bg);border-radius:14px;padding:16px;font-size:14px;color:var(--t2);line-height:1.7}',
  '@media (max-width:400px){.nb{font-size:24px}.tiles.c3{grid-template-columns:1fr}.hb-row{grid-template-columns:76px 1fr auto}.hero h1{font-size:23px}}',
  '@page{size:A4;margin:12mm 11mm}',
  '@media print{body{font-size:13.5px}.wrap{max-width:none;padding:0}.sec{margin-top:18px}.sh{break-inside:avoid;page-break-inside:avoid;break-after:avoid;page-break-after:avoid}.hero,.kpi,.kp,.tile,.gi{break-inside:avoid;page-break-inside:avoid}.hero{margin-top:0}}'
].join('\n');

/* ── 본문 ──────────────────────────────────────────────────── */
function html(d) {
  d = d || {};
  var c = d.client || {}, name = c.name || '고객';
  var P = pensionModel(d.pension), SP = pensionModel(d.spousePension);
  var NP = d.nationalPension || null;
  var assumed = [];                                   /* 화면의 「가정」 을 면책에 모읍니다 */
  function A(label, why) {                            /* data 가 같은 이름으로 이미 적었으면 두 번 적지 않습니다 */
    for (var i = 0; i < assumed.length; i++) if (String(assumed[i]).indexOf('**' + label + '**') === 0) return;
    assumed.push('**' + label + '** — ' + why);
  }
  (d.assumptions || []).forEach(function (x) { assumed.push(x); });
  if (P) {
    if (P.input.costDrag == null && !P.input.rows) A('사업비 차감', '연 ' + pctTxt(RULE.annuity.costDrag) + ' (설계서마다 다릅니다)');
    if (P.input.annuityFactor == null && !P.input.rows) A('연금 전환계수', RULE.annuity.annuityFactor + ' (실제는 개시 나이·성별·상품에 따릅니다)');
    if (P.untilAssumed) A('수령 기간', P.receiveUntil + '세까지 받는다고 보고 총액을 셌습니다');
  }
  if (NP && NP.estimated) A('국민연금', '공단 조회액이 아니라 식으로 낸 **추정**입니다 — 공단 조회액이 오면 바꿉니다');

  /* 지금 그대로면 — 제안을 더하기 전, 이미 들어올 돈만 (국민연금 + otherIncome) */
  var SQ = null;
  if (+d.goal > 0) {
    var sq = NP && NP.monthly ? +NP.monthly : 0;
    (d.otherIncome || []).forEach(function (x) { sq += +x.value || 0; });
    SQ = { now: sq, goal: +d.goal, gap: Math.max(0, +d.goal - sq), days: daysOf(sq, +d.goal) };
  }
  var openAt = P ? P.input.openAge : c.retireAge;

  var out = [];
  /* 1. 히어로 */
  var topic = d.topic || d.proposalTitle || '재무설계';
  out.push('<header class="hero">' + icon(d.heroIcon || 'sparkles', 'hi0') +
    '<div class="who">' + esc(d.advisor || 'APEX 사업단') + (d.date ? ' · ' + esc(d.date) : '') + '</div>' +
    '<h1>' + esc(name) + ' 님,<br>' + esc(topic) + josa(topic, '을', '를') + ' 정리했어요</h1>' +
    (d.oneLine ? '<p class="one">' + txt(d.oneLine) + '</p>' : '') +
    '<div class="chips">' + [c.age != null ? c.age + '세' : null].concat(c.chips || [], [c.family, c.region, c.job]).filter(Boolean)
      .map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join('') + '</div>' +
    (SQ && d.worry !== false ? '<div class="worry"><div class="wk">지금 그대로면 — ' + (openAt ? openAt + '세 이후 ' : '은퇴 후 ') + '한 달 ' + manTxt(SQ.goal) + ' 중</div>' +
      dayGrid(SQ.days, 'mint') + '<p>' + txt(daysText(SQ.days, SQ.now, SQ.goal)) + '</p>' +
      (d.worryNote ? '<div class="wn">' + txt(d.worryNote) + '</div>' : '') + '</div>' : '') + '</header>');

  /* 2. KPI 4칸 — 비면 연금에서 채웁니다 */
  var K = (d.kpis || []).slice();
  if (P && K.length < 4) {
    var auto = [
      { label: '매월 낼 돈', value: +P.input.premium, sub: P.input.payYears + '년 동안', icon: 'coin' },
      P.target ? { label: '나중에 매월 받을 돈', value: P.target.monthly, sub: P.input.openAge + '세부터 · ' + P.target.label + ' 가정', icon: 'money', tone: 'blue' } : null,
      P.target ? { label: '얻는 이익', value: P.target.fund - P.principal, sub: '적립금 − 낸 돈 · 요건 충족 시 비과세 대상', icon: 'gift', tone: 'green' } : null
    ].filter(Boolean);
    while (K.length < 4 && auto.length) K.push(auto.shift());
  }
  out.push('<div class="kpi">' + K.slice(0, 4).map(function (k) {
    var t = k.tone && TONE[k.tone] ? k.tone : null;
    return '<div class="kp"><div class="kl">' + icon(k.icon) + esc(k.label) + tag(k.assumed) + '</div><div class="kv"' + (t ? ' style="color:' + TONE[t] + '"' : '') + '>' + big(k.value, k.unit) +
      '</div>' + (k.sub ? '<div class="ks">' + txt(k.sub) + '</div>' : '') + '</div>';
  }).join('') + '</div>');

  var no = 0; function N() { no++; return (no < 10 ? '0' : '') + no; }

  /* 3. 최종 제안 */
  var steps = d.steps;
  if (!steps && P) {
    var pi = P.input, done = (+pi.startAge) + (+pi.payYears);
    steps = [{ age: pi.startAge, label: '지금', sub: '가입' }, { age: done, label: '납입 완료', sub: '이후엔 내지 않아요' }];
    if (c.retireAge && c.retireAge !== pi.openAge && c.retireAge !== done) steps.push({ age: c.retireAge, label: '은퇴' });
    steps.push({ age: pi.openAge, label: '연금 개시', sub: P.target ? '월 ' + manTxt(P.target.monthly) : '', tone: 'blue' });
  }
  var b3 = '';
  if (d.allocation && d.allocation.length) b3 += card({ type: 'text', title: d.proposalTitle || '이렇게 나눠 담아요', icon: 'chart', text: d.principle || '' }).replace(/<\/div>$/, donut(d.allocation, d.allocationCenter, d.allocationLabel) + '</div>');
  else if (d.proposalTitle || d.principle) b3 += card({ type: 'text', title: d.proposalTitle, icon: 'chart', text: d.principle || '' });
  if (SQ && SQ.gap > 0 && P && P.target) {
    var prop = P.target.monthly + (SP && SP.target ? SP.target.monthly : 0), fill = Math.min(1, prop / SQ.gap), rem = Math.max(0, SQ.gap - prop);
    var more = rem > 0 ? P.input.premium * rem / P.target.monthly : 0;
    b3 += '<div class="card">' + cardHead({ title: '이 제안으로 빈칸을 얼마나 채우나요', sub: '매달 비는 ' + manTxt(SQ.gap) + ' 기준', icon: 'target' }) +
      '<div class="pg-l"><span>채우는 몫</span><b>' + Math.round(fill * 100) + '%</b></div>' + progress(fill, 'blue') +
      '<p class="p pg-t">' + txt('매달 비는 **' + manTxt(SQ.gap) + '** 중 **' + manTxt(prop) + '**을 채워요(' + P.target.label + ' 가정).' +
        (rem > 0 ? '\n남은 **' + manTxt(rem) + '**까지 같은 방식으로 채우려면 매달 약 **' + manTxt(more) + '**을 더 모아야 해요 — 한 번에 어렵다면, 오늘이 첫 걸음이에요.' : '\n오늘 제안으로 빈칸이 다 채워져요.')) + '</p>' +
      (rem > 0 ? '<div class="note">' + txt('같은 상품·같은 가정으로 단순히 비례해 셌어요(설계서로 다시 확인).') + '</div>' : '') + '</div>';
  }
  if (steps && steps.length) b3 += '<div class="card">' + cardHead({ title: '언제 무엇이 일어나나요', icon: 'hourglass' }) + timeline(steps) + '</div>';
  if ((d.good && d.good.length) || (d.todo && d.todo.length)) {
    b3 += '<div class="card">' +
      (d.good && d.good.length ? '<div class="lst-h" style="margin-top:0">' + icon('star') + '잘하고 계신 것</div><ul class="ul good">' + d.good.slice(0, 3).map(function (x) { return '<li>' + txt(x) + '</li>'; }).join('') + '</ul>' +
        (SQ && SQ.gap > 0 ? '<p class="but">' + txt('그런데 — 지금 준비된 것을 다 합쳐도 목표의 **' + Math.round(SQ.now / SQ.goal * 100) + '%**예요.') + '</p>' : '') : '') +
      (d.todo && d.todo.length ? '<div class="lst-h">' + icon('memo') + '같이 할 일</div><ul class="ul todo">' + d.todo.slice(0, 4).map(function (x) { return '<li>' + txt(x) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
  }
  if (b3) out.push(section(N(), '최종 제안', d.proposalHeadline || '결론부터 말씀드릴게요', b3, 'target'));

  /* 4. 수익률별 예상 수령액 */
  if (P) {
    var bars = P.rows.map(function (x) {
      return { label: x.label, value: x.monthly, hi: !!x.target, tone: x.guarantee ? 'green' : (x.target ? 'blue' : 'gray'),
               badge: x.guarantee ? '보증' : (x.byGuarantee ? '보증 적용' : null), display: '월 ' + manTxt(x.monthly) };
    });
    var b4 = '<div class="card">' + cardHead({ title: P.input.openAge + '세부터 매달 받는 돈', sub: '월 ' + manTxt(P.input.premium) + ' × ' + P.input.payYears + '년 · 펀드가 이만큼 났다면', icon: 'bars' }) + hbars(bars) +
      '<div class="note">' + (P.a.guaranteed != null && !P.input.rows ? '최저보증은 낸 돈마다 개시까지 연 ' + pctTxt(+P.input.guaranteeRate) + ' 단리로 쌓은 값이고, 둘 중 큰 쪽이 연금이 돼요. ' : '') +
      txt('수익률은 **가정**이며 보장되지 않아요 — 실적에 따라 달라집니다.') + '</div></div>';
    var CP = P.input.compare;                       /* 화면이 상품 엔진으로 이미 센 비교표 */
    if (CP && CP.rows && CP.rows.length > 1)
      b4 += card({ type: 'table', title: '납입기간을 바꾸면', sub: '같은 상품 · 같은 월 ' + manTxt(P.input.premium), icon: 'calendar', head: CP.head, rows: CP.rows, highlight: CP.highlight,
        note: CP.note || '같은 상품에 납입기간만 바꿔 셌어요. 이 나이·개시 나이로 **가입할 수 있는 기간만** 보여 드려요.' });
    var cmpYears = P.input.rows ? null : (P.input.compareYears || uniq([5, 7, 10, +P.input.payYears]).filter(function (y) { return y > 0 && (+P.input.startAge) + y <= +P.input.openAge; }));
    if (cmpYears && cmpYears.length > 1) {
      var tr = P.input.targetRate != null ? +P.input.targetRate : null;
      var head = ['납입기간', '낸 돈', '최저보증 월'].concat(tr != null ? ['목표 ' + pctTxt(tr) + ' 월'] : []);
      var hi = -1, rows = cmpYears.map(function (y, i) {
        var q = {}; for (var k in P.input) q[k] = P.input[k]; q.payYears = y;
        var m = annuity(q); if (y === +P.input.payYears) hi = i;
        return [y + '년납', m.principal, m.guaranteedMonthly != null ? m.guaranteedMonthly : '—'].concat(tr != null ? [m.at(tr).monthly] : []);
      });
      b4 += card({ type: 'table', title: '납입기간을 바꾸면', sub: '같은 월 ' + manTxt(P.input.premium) + '을 낼 때', icon: 'calendar', head: head, rows: rows, highlight: hi,
        note: '같은 가정(사업비·전환계수)으로 낸 **단순 비교**예요. 실제 상품은 납입기간마다 사업비·해지공제가 달라 설계서 숫자가 기준입니다.' });
    }
    /* 늦게 시작하면 — 같은 월 보험료·같은 납입기간·같은 개시 나이로, 시작만 미룹니다 */
    var DL = P.input.delay;                          /* 화면이 상품 엔진으로 이미 센 것 [{label, monthly}] */
    if (!DL && !P.input.rows) {
      DL = [];
      [0, 5, 10].forEach(function (k) {
        var s0 = +P.input.startAge + k; if (s0 + (+P.input.payYears) > +P.input.openAge) return;
        var q = {}; for (var kk in P.input) q[kk] = P.input[kk]; q.startAge = s0;
        var m = annuity(q), tr2 = P.input.targetRate != null ? +P.input.targetRate : null;
        DL.push({ label: k ? k + '년 뒤 시작' : '지금 시작', monthly: tr2 != null ? m.at(tr2).monthly : (m.guaranteedMonthly != null ? m.guaranteedMonthly : m.at(0.05).monthly) });
      });
    }
    if (DL && DL.length > 1) {
      var lost = DL[0].monthly - DL[1].monthly;
      b4 += '<div class="card">' + cardHead({ title: '시작을 미루면', sub: '같은 월 ' + manTxt(P.input.premium) + ' · 같은 ' + P.input.payYears + '년납 · 같은 ' + P.input.openAge + '세 개시', icon: 'hourglass' }) +
        hbars(DL.map(function (x, i) { return { label: x.label, value: x.monthly, hi: i === 0, tone: i ? 'red' : 'blue', display: '월 ' + manTxt(x.monthly) }; })) +
        '<p class="p pg-t">' + txt('**' + DL[1].label + '**하면 매달 **' + manTxt(lost) + '** 줄어요 — ' + P.receiveYears + '년 받으면 **' + manTxt(lost * 12 * P.receiveYears) + '**이에요.\n쌓일 시간이 줄어든 만큼이에요.') + '</p>' +
        '<div class="note">' + txt((P.target ? P.target.label + ' 가정 · ' : '') + '수익률은 보장되지 않아요.') + '</div></div>';
    }
    out.push(section(N(), '수익률별 예상 수령액', '수익률에 따라 이렇게 달라져요', b4, 'chart'));

    /* 5. 얻게 되는 이익 */
    var t = P.target, totalGet = t ? t.monthly * 12 * P.receiveYears : null;
    var items = [];
    if (t) {
      var gRow = null; P.rows.forEach(function (x) { if (x.guarantee) gRow = x; });
      var beM = gRow ? gRow.monthly : t.monthly, beAge = beM > 0 ? Math.ceil(+P.input.openAge + P.principal / (beM * 12)) : null;
      items.push({ label: '낸 돈 대비', value: (Math.round(totalGet / P.principal * 10) / 10) + '', unit: '배', sub: '낸 돈 ' + manTxt(P.principal) + ' · ' + P.receiveUntil + '세까지', tone: 'blue', assumed: P.untilAssumed });
      items.push({ label: '총 수령액', value: totalGet, sub: '월 ' + manTxt(t.monthly) + ' × ' + P.receiveYears + '년', assumed: P.untilAssumed });
      if (beAge) items.push({ label: '낸 돈을 다 돌려받는 나이', value: beAge + '', unit: '세', sub: (gRow ? '**최저보증만** 받아도' : t.label + ' 가정') + '\n그 뒤로는 전부 더 받는 돈', tone: 'mint' });
      items.push({ label: '비과세 대상 이익', value: Math.max(0, t.fund - P.principal), sub: '개시 때 적립금 − 낸 돈 · **요건 충족 시**', tone: 'green' });
    }
    (d.extraBenefits || []).forEach(function (x) { items.push(x); });
    var b5 = items.length ? card({ type: 'tiles', title: '원금보다 얼마나 더 받나요', icon: 'gift', items: items,
      note: '비과세는 **요건 충족 시**에만 적용돼요 — 납입 방식·기간·유지 기간·한도 요건은 가입 전 세무 전문가와 꼭 확인해요.' }) : '';
    if (d.goal) {
      var parts = [];
      if (NP && NP.monthly) parts.push({ label: '국민연금' + (NP.estimated ? ' (추정)' : ''), value: NP.monthly, tone: 'mint', assumed: NP.estimated ? '추정' : null });
      (d.otherIncome || []).forEach(function (x) { parts.push(x); });
      if (t) parts.push({ label: '제안 연금 (' + t.label + ')', value: t.monthly, tone: 'blue' });
      if (SP && SP.target) parts.push({ label: '배우자 연금 (' + SP.target.label + ')', value: SP.target.monthly, tone: 'purple', assumed: d.spousePension.assumed });
      var nBase = (NP && NP.monthly ? 1 : 0) + (d.otherIncome || []).length;
      b5 += card({ type: 'stack', title: d.goalTitle || '은퇴 후 매달 쓸 돈, 채워질까요?', icon: 'target', goal: d.goal, goalLabel: '목표', assumed: d.goalAssumed,
        rows: [{ label: '지금 그대로면', items: parts.slice(0, nBase) }, { label: '오늘 제안을 더하면', items: parts }] });
    }
    if (b5) out.push(section(N(), '얻게 되는 이익', '낸 돈보다 이만큼 더 돌아와요', b5, 'gift'));
  }

  /* 6. 고객 핵심 이슈 */
  (d.sections || []).forEach(function (s) {
    out.push(section(N(), s.kicker || '핵심 이슈', s.title || '', (s.cards || []).map(card).join('') + (s.ask ? '<div class="ask">' + txt(s.ask) + '</div>' : ''), s.icon || 'pin'));
  });

  /* 7. 설명 */
  if (d.explain) {
    var ex = typeof d.explain === 'string' ? '<p class="p">' + txt(d.explain) + '</p>'
      : d.explain.map(function (x) { return '<div class="qa"><div class="qq">' + txt(x.q) + '</div><div class="p">' + txt(x.a) + '</div></div>'; }).join('');
    out.push(section(N(), '왜 이렇게 짰나요', d.explainTitle || '쉽게 풀어 볼게요', '<div class="card">' + ex + '</div>', 'bulb'));
  }
  /* 8. 일정 */
  if (d.schedule && d.schedule.length) out.push(section(N(), '일정', '이 순서로 함께 해요', '<div class="card">' + vsteps(d.schedule) + '</div>', 'calendar'));

  /* 9. 요약 + 면책 */
  var disc = assumed.concat(d.disclaimer || [], [
    '이 자료는 상담을 돕기 위한 **예상**이며 확정 금액이 아닙니다. 실제 금액은 가입 상품의 설계서·약관을 따릅니다.',
    '보험료·보장은 **심사 결과에 따릅니다.**',
    '세금(비과세·퇴직소득세 감면)은 **요건 충족 시**의 이야기이며, 판단은 세무 전문가 확인이 필요합니다.',
    '변액 상품의 펀드 수익률은 보장되지 않으며 실적에 따라 달라집니다.'
  ]);
  var closing = d.closing != null ? d.closing : '오늘 본 숫자 중 **가장 마음에 걸린 숫자**는 무엇이었나요?\n그 숫자부터 같이 줄여 봐요 — 편한 시간을 알려 주세요.';
  var b9 = (d.summary && d.summary.length ? '<div class="card"><ol class="sum">' + d.summary.slice(0, 6).map(function (x) { return '<li><div>' + txt(x) + '</div></li>'; }).join('') + '</ol></div>' : '') +
    (closing ? '<div class="ask">' + icon('speech', 'aic') + txt(closing) + '</div>' : '') +
    '<div class="disc"><b>꼭 읽어 주세요</b><ul>' + disc.map(function (x) { return '<li>' + txt(x) + '</li>'; }).join('') + '</ul></div>';
  out.push(section(N(), '한눈에 요약', '오늘 이야기, 여섯 줄로', b9, 'check'));
  out.push('<div class="foot">' + esc(d.advisor || 'APEX 사업단') + (d.contact ? ' · ' + esc(d.contact) : '') + '</div>');

  return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light"><title>' + esc(name) + ' 님 재무 리포트</title><style>' + CSS + '</style></head><body><main class="wrap">' +
    out.join('') + '</main></body></html>';
}
function uniq(a) { var o = []; a.forEach(function (x) { if (o.indexOf(x) < 0) o.push(x); }); return o.sort(function (x, y) { return x - y; }); }

function open(d) {
  var w = g.open('', '_blank');
  if (!w) { alert('팝업이 막혀 있습니다. 이 사이트의 팝업을 허용해 주세요.'); return null; }
  w.document.open(); w.document.write(html(d)); w.document.close(); return w;
}
function download(d, file) {
  var name = (d && d.client && d.client.name) || '고객';
  var blob = new Blob([html(d)], { type: 'text/html;charset=utf-8' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = file || (name + '님_재무리포트.html'); document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

g.APEX_REPORT = { html: html, open: open, download: download, calc: calc, selfTest: selfTest, man: manTxt, version: '2026.10' };
})(typeof window !== 'undefined' ? window : globalThis);
