#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   check-newstag.js — <b>뉴스 꼬리표가 통장과 맞물려 있는가.</b>

   사장님 말씀 (2026-09-23) —
     「꼬리표 이름은 8통장 이름 그대로입니다. app/index.html 의 WALLETS 와
      <b>글자가 같아야</b> 고객의 「비어 있는 통장」 과 바로 맞습니다.」
     「②를 꼭 넣으십시오 — 통장 이름이 <b>한 글자만 어긋나도</b> 매칭이
      조용히 0건이 되는데 <b>아무 오류도 안 납니다</b>.」

   ── 보는 것 셋 ────────────────────────────────────────────────────
     [1] <b>낱말이 두 벌이 아닌가</b> (5번) — 화면 파일(app/*.html)에 같은
         낱말 목록을 또 적어 두지 않았는가
     [2] <b>여덟 칸 이름이 WALLETS 와 글자까지 같은가</b> — 이것이 이
         점검의 핵심입니다. 어긋나도 아무 오류가 안 나고 매칭만 0이 됩니다
     [3] <b>꼬리표를 못 단 비율이 절반을 넘지 않는가</b> — 낱말이 모자라면
         기사 대부분이 「판단 못 함」 이 되어 꼬리표가 있으나 마나 합니다

   ── ⚠ [1] 을 <b>넓게 잡지 않습니다</b> (8번) ──────────────────────
   「보험료」·「연금」 같은 낱말은 화면 글에 당연히 나옵니다. 그것을 잡으면
   빨간불이 늘 켜져 아무도 안 믿게 됩니다. 여기서 잡으려는 것은
   <b>목록이 통째로 베껴진 것</b>입니다.

   처음에는 「한 대괄호 안에 <b>다섯 개 이상</b>」 으로 잡았는데
   <b>헛것을 물었습니다</b> — WALLETS 7번 간병·장기요양 통장의 <b>상담
   항목</b>(items: 주 돌봄자 · 간병인 · 재가급여 · 시설급여 · 복지용구…)이
   걸렸습니다. 같은 통장 이야기라 말이 겹치는 것이 <b>당연</b>하고, 그것은
   낱말 목록이 아니라 상담 때 물어볼 항목입니다.

   그래서 좁혔습니다 — <b>여덟 개 이상이면서 그 통장 낱말의 절반 이상</b>이
   한 대괄호에 몰렸을 때만 잡습니다. 한두 개 겹치는 것은 두 벌이 아니고,
   <b>목록을 유지보수하듯 통째로 들고 있는 것</b>이 두 벌입니다.

   ── ⚠ [3] 의 견본에 대하여 ────────────────────────────────────────
   이 점검은 <b>망을 안 씁니다</b>(CI 는 바깥에 못 나갑니다). 그래서 아래
   <b>견본 제목</b>으로 잽니다 — 진짜 기사가 아니라 <b>점검용 견본</b>이고,
   고객 화면에는 한 줄도 안 나갑니다 (9번은 고객에게 보여 주는 인용에
   대한 규칙입니다). 재는 것은 <b>낱말 목록이 실제로 걸리는가</b> 입니다.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const SRC = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/sources.json'), 'utf8'));
/* 꼬리표 다는 함수는 <b>수집기 것을 그대로</b> 부릅니다 — 점검이 제 나름의
   짝퉁을 만들면 수집기가 바뀌어도 옛것만 재고 초록을 켭니다 (5번).      */
const M = require(path.join(ROOT, 'netlify/functions/market.js'));
const KEYS = M._wtag.keys, NAMES = M._wtag.names;

console.log('\n[1] <b>낱말이 두 벌이 아닌가</b> (5번)');
is(KEYS.length === 8, '  sources.json 에 통장 칸이 <b>여덟</b> 이다 — ' + KEYS.length + '칸');
const APPD = path.join(ROOT, 'app');
const htmls = fs.readdirSync(APPD).filter(f => /\.html$/.test(f)).map(f => path.join(APPD, f));
const dup = [];
htmls.forEach(f => {
  const s = fs.readFileSync(f, 'utf8');
  /* 대괄호 하나 안에 든 글자 뭉치만 본다 — 화면 글월은 안 본다 */
  const arrs = s.match(/\[[^\[\]]{20,4000}\]/g) || [];
  KEYS.forEach((k, i) => {
    const words = SRC[k] || [];
    arrs.forEach(a => {
      let n = 0;
      words.forEach(w => { if (a.indexOf("'" + w + "'") >= 0 || a.indexOf('"' + w + '"') >= 0) n++; });
      /* 여덟 개 이상 <b>이면서</b> 그 목록의 절반 이상 — 둘 다일 때만 */
      if (n >= 8 && words.length && n / words.length >= 0.5)
        dup.push(path.basename(f) + ' · ' + NAMES[i] + ' 낱말 ' + n + '/' + words.length + '개');
    });
  });
});
is(dup.length === 0,
   '  화면 파일에 <b>같은 목록을 또 적어 두지 않았다</b> — ' +
   (dup.length ? dup.join(' / ') : htmls.length + '개 파일 모두 깨끗'));

console.log('\n[2] <b>여덟 칸 이름이 WALLETS 와 글자까지 같은가</b>');
/* WALLETS 를 <b>본체에서 그대로</b> 읽습니다 — 여기 손으로 적으면 그것이
   바로 두 벌이고, 본체가 바뀌어도 이 점검은 옛 이름으로 초록을 켭니다. */
const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const at = IDX.indexOf('var WALLETS=');
const W = [];
if (at >= 0) {
  const re = /\{n:(\d),name:'([^']+)'/g; re.lastIndex = at;
  let m, guard = 0;
  while ((m = re.exec(IDX)) && guard++ < 12) {
    W.push({ n: +m[1], name: m[2] });
    if (W.length === 8) break;
  }
}
is(W.length === 8, '  본체 WALLETS 에서 통장 <b>여덟</b>을 읽었다 — ' + W.length + '개');
const wrong = [];
W.forEach((w, i) => {
  const want = '키워드_통장' + w.n + '_' + w.name.replace(/\s*통장$/, '');
  if (KEYS.indexOf(want) < 0) wrong.push(w.n + '번 「' + w.name + '」 → 「' + want + '」 칸이 없다');
});
KEYS.forEach((k, i) => {
  const n = +k.match(/\d+/)[0], w = W[n - 1];
  if (!w) { wrong.push(k + ' — WALLETS 에 ' + n + '번이 없다'); return; }
  if (NAMES[i] + ' 통장' !== w.name)
    wrong.push(k + ' — 꼬리표 「' + NAMES[i] + '」 vs 통장 「' + w.name + '」');
});
is(wrong.length === 0,
   '  <b>한 글자도 안 다르다</b> — ' + (wrong.length ? wrong.join(' / ') : NAMES.join(' · ')));

console.log('\n[3] <b>꼬리표를 못 단 비율이 절반을 넘지 않는가</b>');
/* 점검용 <b>견본 제목</b>입니다 — 진짜 기사가 아니고 고객 화면에 안 나갑니다.
   여덟 통장을 골고루, 그리고 <b>일부러 상관없는 것 넷</b>을 섞었습니다.
   상관없는 것까지 걸리면 그건 낱말이 너무 넓다는 뜻입니다.             */
const SAMPLE = [
  ['소비자물가 3개월째 상승 … 가계 고정지출 부담', '관리비와 공공요금이 함께 올랐다'],
  ['가계대출 금리 인상 … 원리금 상환 부담 확대', '마이너스통장 이자도 오른다'],
  ['실손보험 청구 전산화 2단계 시행 — 의원급 확대', '비급여 관리 방안도 논의된다'],
  ['도수치료·영양제 주사 본인부담 상향 검토', '3대 비급여 관리가 핵심이다'],
  ['암 진단비 보장 세분화 … 표적항암 포함 상품 출시', '재발과 전이까지 본다'],
  ['뇌혈관·허혈성 보장 범위 확대', '급성심근경색 외 질환도 포함'],
  ['상병수당 시범사업 지역 확대', '아파서 쉬는 동안 소득 공백을 메운다'],
  ['업무상 질병 산재 인정 기준 완화', '후유장해 판정 절차도 손본다'],
  ['종신보험 사망보험금 유동화 논의', '유족 생활비로 쓰게 하자는 취지'],
  ['자녀 교육비 부담 사상 최대 … 학자금 대출 증가', '양육비 지출도 늘었다'],
  ['국민연금 개혁안 국회 논의 본격화', '수급 개시 연령과 보험료율이 쟁점'],
  ['퇴직연금 IRP 수익률 공시 개편', '연금저축 세액공제 한도도 거론'],
  ['노인장기요양보험료 인상 … 요양등급 신청 급증', '간병비 부담이 커졌다'],
  ['치매 환자 돌봄 공백 심화 … 방문요양 대기 증가', '가족 간병이 한계에 달했다'],
  ['상속세 개편안 발표 — 일괄공제 상향 검토', '배우자공제 손질도 함께'],
  ['사전증여 늘자 증여세 신고 건수 최대', '가업승계 공제 요건도 완화'],
  /* ⚠ <b>일부러 셋 이상에 걸리는 제목</b>을 한 건 둡니다 — 장기요양 ·
     연금 · 상속이 한 제목에 다 들어 있습니다. 이것이 없으면 「최대 두
     개」 줄이 <b>안 울리는 알람</b>이 됩니다. 셋까지 달게 고쳐 보고
     빨간불이 안 켜지는 것을 보고 넣었습니다 (8번).                  */
  ['국민연금·장기요양·상속세 손질 한꺼번에 논의', '요양등급 판정과 상속 공제 기준도 함께 본다'],
  ['프로야구 한국시리즈 입장권 예매 시작', '응원 좌석 배치가 공개됐다'],
  ['국내 영화 관객수 회복세 … 극장가 활기', '개봉작이 몰린 영향'],
  ['전국 대부분 맑음 … 낮 최고 27도', '주말까지 비 소식은 없다'],
  ['국가대표 축구 평가전 명단 발표', '유럽파 다수가 합류했다']
];
const OFF = 4;                                  /* 뒤 네 건이 상관없는 것 */
const on = SAMPLE.slice(0, SAMPLE.length - OFF), off = SAMPLE.slice(-OFF);
const miss = on.filter(a => !M._wtag.tagsOf(a[0], a[1]).tags.length);
const rate = miss.length / on.length;
is(rate <= 0.5,
   '  꼬리표를 <b>못 단 것</b>이 ' + miss.length + '/' + on.length + ' = ' +
   Math.round(rate * 100) + '% — 절반 이하' + (miss.length ? (' (못 단 것 · ' + miss.map(x => x[0].slice(0, 18)).join(' / ') + ')') : ''));
const overs = off.filter(a => M._wtag.tagsOf(a[0], a[1]).tags.length);
is(overs.length === 0,
   '  <b>상관없는 기사엔 안 단다</b> — 넓게 잡으면 꼬리표가 뜻을 잃는다 (8번)' +
   (overs.length ? (' · ' + overs.map(x => x[0].slice(0, 20) + ' → ' + M._wtag.tagsOf(x[0], x[1]).tags.join(',')).join(' / ')) : ''));
const two = on.filter(a => M._wtag.tagsOf(a[0], a[1]).tags.length > 2);
is(two.length === 0, '  <b>최대 두 개</b>까지만 단다 — 셋을 달면 어느 통장 이야기인지 흐려진다');
const sure = M._wtag.tagsOf('상속세 개편안 발표', '');
const soft = M._wtag.tagsOf('국회 본회의 소식', '상속세 개편안이 논의됐다');
is(sure.sure === true && soft.sure === false,
   '  <b>제목이면 확실 · 본문만이면 보조</b> — 제목 ' + sure.sure + ' · 본문만 ' + soft.sure);

console.log('\n──────────────────────────────');
if (bad) { console.log('✗ 뉴스 꼬리표 — 고칠 자리 ' + bad + '곳'); process.exit(1); }
console.log('✓ 꼬리표 여덟이 통장 이름과 한 글자도 안 다르고, 낱말은 한 곳에만 있습니다.');
