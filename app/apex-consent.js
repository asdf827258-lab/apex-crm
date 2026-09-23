/* ══ 고객 동의 — <b>문구와 주소 꾸리기는 여기 한 곳</b> ═══════════════════
 *
 * 고객 폰(app/me.html)과 설계사 화면(app/index.html 의 cp*)이 <b>같이</b>
 * 읽습니다. 고객이 본 동의서와 설계사가 기록한 동의서가 다른 글이면 그
 * 기록은 아무것도 증명하지 못합니다 — 그래서 두 벌을 두지 않습니다 (5번).
 *
 * ★ 문구를 고치면 CP_VER 를 반드시 올립니다. 기록에는 판 이름이 남고,
 *   예전 판에 동의한 분은 예전 판에 동의한 것입니다.
 * ★ 보유 기간은 <b>여기 적지 않습니다.</b> 회사 동의서에 적힌 기간을
 *   설계사가 링크를 만들 때 그대로 옮깁니다. 외운 숫자를 적으면 회사
 *   기준과 어긋나는 순간 고객에게 틀린 약속을 한 것이 됩니다 (2번과 같은 이유).
 * ★ 이 문구는 <b>견본</b>입니다(CP_DRAFT). 회사 준법 담당이 준 문구가 있으면
 *   그것으로 바꾸고 CP_DRAFT 를 false 로 내립니다.
 * ★ 주소(# 뒤)에 담는 것 — 고객 <b>실명은 절대 안 담습니다</b> (3번).
 *   돌아오는 확인서에는 가린 이름(홍*동 — apex-cusone.js 의 cusMask 한 벌)과,
 *   이름을 되짚어 볼 수 있는 지문(nh)만 갑니다. 가리는 곳을 또 만들지 않습니다.
 *
 * ES5 로 씁니다 — app/index.html 이 그대로 읽습니다 (6번).
 */
var CP_VER = 'cp-2026-09-24-견본1';
var CP_DRAFT = true;

/* 동의 항목 — 순서가 곧 화면 순서입니다.
   sep:true 는 <b>별도 동의</b>입니다. 다른 항목과 묶어 한 번에 받지 않습니다. */
var CP_TERMS = [
  { k: 'base', t: '개인정보 수집·이용 동의', need: true, sep: false,
    why: '고객님이 가입하신 보험의 보장 내용을 확인하고 비교하는 보장분석과, 그 결과를 설명드리는 상담',
    what: '성함, 가입하신 보험의 보험사·상품명·보장(담보) 이름·가입금액·보험료·납입기간, 보내 주신 보장분석·증권 자료에 적힌 내용',
    no: '동의하지 않으실 수 있습니다. 다만 동의하지 않으시면 보장분석을 해 드릴 수 없습니다.' },
  { k: 'health', t: '민감정보(건강정보) 수집·이용 별도 동의', need: false, sep: true,
    why: '보장분석을 할 때 지금 보장으로 청구가 가능한지, 빠진 보장이 무엇인지를 건강 상태에 맞춰 살펴보는 일',
    what: '보내 주신 자료에 적힌 질병·진단·수술·입원·통원 기록, 상담 중에 말씀해 주신 건강 상태',
    no: '동의하지 않으셔도 보장분석은 받으실 수 있습니다. 그때는 건강 정보를 보지 않고, 가입 내역만으로 분석합니다.' }
];
/* 모든 항목에 공통으로 붙는 말 — 문구가 두 곳에 흩어지지 않게 여기 둡니다 */
var CP_NOTE = [
  '보내 주신 자료는 담당 설계사가 보장분석에만 씁니다. 보험사에 넘기지 않습니다 — 가입을 진행하실 때는 그 보험사의 동의서를 따로 받습니다.',
  '보험 가입 여부와 보험료는 보험사 심사 결과에 따릅니다.',
  '동의는 언제든 거두실 수 있습니다. 이 화면의 「동의 거두기」를 누르시면 됩니다.'
];
function cpTerm(k) {
  for (var i = 0; i < CP_TERMS.length; i++) if (CP_TERMS[i].k === k) return CP_TERMS[i];
  return null;
}

/* ── 주소에 담기 — UTF-8 JSON → base64url ─────────────────────────── */
function cpEnc(o) {
  var s = JSON.stringify(o), b = unescape(encodeURIComponent(s));
  return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function cpDec(s) {
  try {
    s = ('' + (s || '')).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return JSON.parse(decodeURIComponent(escape(atob(s))));
  } catch (e) { return null; }
}
/* 붙여 넣은 글 어디에 있든 #i= · #a= · #w= 한 토막을 찾아 풉니다.
   카톡에서 복사하면 앞뒤에 말이 붙어 옵니다. */
function cpFind(text, kind) {
  var m = new RegExp('#' + kind + '=([A-Za-z0-9_-]+)').exec('' + (text || ''));
  return m ? cpDec(m[1]) : null;
}

/* 링크 번호 — 헷갈리는 글자(0/O, 1/I/l)를 뺍니다 */
function cpId() {
  var A = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ', s = '', i;
  for (i = 0; i < 10; i++) s += A.charAt(Math.floor(Math.random() * A.length));
  return s;
}

/* 동의 기록 한 줄 요약 — 고객 폰·설계사 화면이 같은 말로 적습니다 */
function cpSummary(r) {
  if (!r) return '';
  if (r.k === 'w') return '동의 거둠(' + ((r.what || []).indexOf('base') >= 0 ? '전부' : '건강정보만') + ')';
  var h = r.health && r.health.ok;
  return '필수 동의' + (r.base && r.base.ok ? ' ✓' : ' ✗') + ' · 건강정보 별도 동의' + (h ? ' ✓' : ' ✗');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CP_VER: CP_VER, CP_DRAFT: CP_DRAFT, CP_TERMS: CP_TERMS, CP_NOTE: CP_NOTE,
    cpTerm: cpTerm, cpEnc: cpEnc, cpDec: cpDec, cpFind: cpFind, cpId: cpId, cpSummary: cpSummary };
}
