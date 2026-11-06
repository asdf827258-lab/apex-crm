/* ══════════════════════════════════════════════════════════════════
   💰 증권전달 상담 도구 — <b>연금 사다리</b> (s17)              — 판 X375

   사장님 말씀 2026-11-06
     「연금이나 이런 부분들 계산기 기존에 있던걸
      <b>딱 얼마 모으면 얼마 예시</b>를 하면 좋을거 같아」

   ★★ 이 장의 위험은 <b>숫자가 틀리는 것</b>이 아니라
     <b>숫자끼리 어긋나는 것</b>입니다. 화면에 「매달 62.1만원」 이라 찍어 놓고
     「모두 2억 6,830만원」 이라 적으면, 고객이 계산기를 두드려 보는 순간
     이 종이 전체를 못 믿게 됩니다. [7] 이 그것만 봅니다 (0-1번).

   ★ 숫자는 <b>한 톨도 장 안에 적지 않습니다.</b> 전부 penResult 가 냅니다 —
     지급률 표가 바뀌면 이 장도 같이 바뀌어야 합니다 (5번).

   ★ 조건이 안 맞는 칸은 <b>「—」</b> 입니다. 비슷한 숫자를 끌어다 쓰면
     고객이 그것을 확정 금액으로 믿습니다 (1번).

   되돌림 — 일부러 되돌려 보고 빨간불이 켜지는지 봤습니다 (8번)
     ⓐ 표에 금액을 손으로 박기           → [2] 가 욺
     ⓑ 「예상 수익률 7%」 적기            → [4] 가 욺
     ⓒ 총액을 엔진 소수점으로 곱하기      → [7] 이 욺
     ⓓ 안 되는 칸을 「—」 대신 숫자로     → [5] 가 욺
     ⓔ 상품 이름을 안 적기               → [8] 이 욺

   ⚠ 바깥을 한 번도 안 부릅니다 — 파일만 엽니다 (7번 · 8번).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const FILE = path.resolve(__dirname, '..', 'app', '증권전달', 'index.html');
const A4 = 1123;
/* 바닥 여유 — CI 의 글꼴은 이 통의 글꼴과 미세하게 다릅니다. 제 자가 CI 를
   대신하지 못해 한 번 데였으므로(판 X364) 여유를 눈금으로 둡니다. */
const 여유바닥 = 100;

let 실패 = 0;
const ok = (c, m) => { console.log((c ? '  ✓   ' : '  ✗   ') + m); if (!c) 실패++; };

/* 「2억 6,827만원」 → 26827 (만원) — 화면에 찍힌 글자를 되읽습니다 */
function 만원(t){
  const s = String(t).replace(/\s/g, '');
  const m = /^(?:([0-9,]+)억)?\s*(?:([0-9,]+)만)?원?$/.exec(s);
  if (!m || (!m[1] && !m[2])) return null;
  const 억 = m[1] ? Number(m[1].replace(/,/g, '')) : 0;
  const 만 = m[2] ? Number(m[2].replace(/,/g, '')) : 0;
  return 억 * 10000 + 만;
}

(async () => {
  const src = fs.readFileSync(FILE, 'utf8');
  const m = /<div class="sheet off" data-kind="chk" id="s17">([\s\S]*?)\n  <\/div>/.exec(src);
  const 장글 = m ? m[1] : '';

  console.log('[1] 사다리 장이 서고 칩에도 있나');
  ok(!!m, '<div … id="s17"> 이 있다');
  ok(/data-kind="chk"/.test(m ? m[0] : ''), '상담 도구 장(chk)이다 — 고객 배포용이 아니다');
  ok(/s17:'연금사다리'/.test(src), '칩에 「연금사다리」 가 있다');
  ok(/off=\{[^}]*s17:1/.test(src), '처음에는 꺼져 있다 (필요할 때만 켭니다)');
  ok(/'v_foot17'/.test(src), '꼬리말 목록에 v_foot17 이 있다 — 「상담 설명용」 고지가 붙는다');

  console.log('[2] 금액을 장 안에 손으로 적지 않았나 (1번 · 5번)');
  const 손금액 = (장글.match(/[0-9][0-9,.]*\s*만원/g) || []);
  ok(손금액.length === 0, '장 안에 손으로 적은 금액 ' + 손금액.length + '개 (0이어야 합니다'
     + (손금액.length ? ' ← ' + 손금액.slice(0, 3).join(' · ') : '') + ')');
  const 손퍼센트 = (장글.match(/[0-9][0-9.]*\s*%/g) || []);
  ok(손퍼센트.length === 0, '장 안에 손으로 적은 이율 ' + 손퍼센트.length + '개');

  console.log('[3] 엔진을 한 곳에서만 부르나 (5번)');
  ok(/function ladCell\(/.test(src) && /penResult\(\{sex, age, start, pay:payY, monthly:prem\*10000\}\)/.test(src),
     'ladCell 이 penResult 를 부른다 (표를 또 안 적는다)');
  ['ladCell', 'ladFill', 'ladLate'].forEach(f =>
    ok((src.match(new RegExp('function ' + f + '\\(', 'g')) || []).length === 1, f + ' 가 한 벌이다'));
  ok((src.match(/const PPROD\s*=/g) || []).length === 1, 'PPROD 가 한 벌이다 (상품표를 또 안 적는다)');
  ok(!/PDATA\s*\[/.test(장글), '장 안에서 지급률 표를 직접 뒤지지 않는다');

  console.log('[4] 확정(최저보증) 말고 다른 숫자를 쓰지 않나 (1번 · 매뉴얼 09장)');
  ok(/최저보증/.test(장글), '「최저보증」 이라고 밝힌다');
  /* ⚠ 고지문 자신이 「예상 수익률로 부풀린 숫자는 쓰지 않았습니다」 라고 말합니다 —
     그 한 줄은 <b>금지어가 아니라 약속</b>이므로 빼고 봅니다 (8번 「헛것을 잡지 않는다」). */
  const 말글 = 장글.replace('예상 수익률로 부풀린 숫자는 쓰지 않았습니다', '');
  ok(!/예상\s*수익률|기대\s*수익률|원금\s*보장|무조건|반드시\s*받으실|확실히/.test(말글),
     '예상 수익률·원금보장 같은 말을 쓰지 않는다');
  ok(/보험약관 및 보험회사의 심사 결과/.test(장글), '「약관 및 보험회사의 심사 결과」 를 말한다');
  ok(/청약서·상품설명서·약관을 대체하지 않습니다/.test(장글), '약관을 대체하지 않는다고 적는다');

  /* ── 브라우저로 ───────────────────────────────────────────── */
  const br = await chromium.launch();
  const p = await br.newPage({ viewport: { width: 1100, height: 1200 } });
  const 터짐 = [];
  p.on('pageerror', e => 터짐.push(String(e).slice(0, 140)));
  const 바깥 = [];
  /* 바깥을 막습니다 — 이 저장소의 꼴은 '**://**' 입니다 (check-netblock 이 그 글자를 봅니다) */
  await p.route('**://**', r => {
    const u = r.request().url();
    if (/^file:/.test(u)) return r.continue();
    if (/supabase\.co|supabase\.in|netlify\.app|\.netlify\/functions|\/api\//i.test(u)) 바깥.push(u);
    return r.abort();
  });
  await p.goto('file://' + FILE, { waitUntil: 'load' });
  await p.waitForTimeout(1800);

  const 세우기 = (조건) => p.evaluate((조건) => {
    Object.keys(조건).forEach(k => {
      const e = document.getElementById(k);
      if (e) { e.value = 조건[k]; e.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    render();
    const s = document.getElementById('s17'); s.classList.remove('off');
    const o = { 칸: [], 카드: [] };
    o.알약 = [...document.querySelectorAll('#v_ladpill span')].map(e => e.textContent.trim());
    o.머리 = [...document.querySelectorAll('#v_ladhead th')].map(e => e.textContent.trim());
    document.querySelectorAll('#v_ladbody tr').forEach(tr => {
      [...tr.children].slice(1).forEach(td => {
        const mm = td.querySelector('.m'), no = td.querySelector('.no');
        o.칸.push({ 월: mm ? mm.textContent.trim() : '', 빔: !!no });
      });
    });
    o.출처 = (document.getElementById('v_ladsrc').textContent || '').trim();
    o.같은돈 = (document.getElementById('v_ladsame').textContent || '').trim();
    document.querySelectorAll('#v_ladcards .bigcard').forEach(c => o.카드.push({
      k: (c.querySelector('.k') || {}).textContent || '',
      v: (c.querySelector('.v') || {}).textContent || '',
      d: (c.querySelector('.d') || {}).textContent || ''
    }));
    o.미루기 = [...document.querySelectorAll('#v_ladlate .m')].map(e => e.textContent.trim());
    o.미루기보임 = getComputedStyle(document.getElementById('v_ladlatetb')).display !== 'none';
    /* 따뜻한 벽돌색이 새어 들어왔나 — <b>토큰 값</b>을 그대로 읽습니다.
       ⚠ 처음에는 「붉은 자리를 세는」 자를 썼는데, 모든 장이 쓰는 경고 띠의
         호박색(#B26B00)까지 잡아 <b>헛것 8곳</b>을 울렸습니다. 넓게 잡으면
         사람이 점검을 안 믿게 됩니다 (8번). 지금은 토큰만 봅니다. */
    const cs17 = getComputedStyle(s);
    o.토큰 = ['--navy', '--gold', '--cream'].map(k => k + '=' + cs17.getPropertyValue(k).trim()).join(' ');
    const mh = s.style.minHeight; s.style.minHeight = '0';
    o.민높이 = Math.round(s.getBoundingClientRect().height); s.style.minHeight = mh;
    o.높이 = Math.round(s.getBoundingClientRect().height);
    o.작은 = [];
    s.querySelectorAll('*').forEach(e => {
      if (e.children.length) return;
      const t = (e.textContent || '').trim(); if (!t) return;
      const f = parseFloat(getComputedStyle(e).fontSize);
      if (f < 9.5) o.작은.push(Math.round(f * 10) / 10 + 'px · ' + t.slice(0, 22));
    });
    s.classList.add('off');
    return o;
  }, 조건);

  /* ① 보통 조건 — 설계사가 패널에 넣은 그대로 */
  const 보통 = await 세우기({ p_sex: '남성', p_age: '45', p_start: '65', p_prem: '70', p_pay: '7', p_prod: 'auto' });

  console.log('[5] 조건이 안 맞는 칸을 「—」 로 두나 (1번)');
  /* ibk 는 45세 가입·65세 개시에서 20년납이 안 됩니다 — 그 칸만 비어야 합니다 */
  const 한상품 = await 세우기({ p_prod: 'ibk' });
  const 빈칸 = 한상품.칸.filter(c => c.빔).length;
  ok(빈칸 > 0, '한 상품(IBK)으로 좁히면 안 되는 칸이 「—」 로 뜬다 — ' + 빈칸 + '칸');
  ok(한상품.칸.filter(c => !c.빔).length > 0, '되는 칸은 그대로 숫자가 뜬다 (헛것을 잡지 않는다 · 8번)');
  ok(/「—」/.test(한상품.출처), '「—」 가 무슨 뜻인지 적는다');

  console.log('[6] 조건이 없으면 숫자를 만들지 않나 (1번)');
  const 빈조건 = await 세우기({ p_age: '' });
  ok(빈조건.칸.length === 0, '나이를 비우면 칸이 ' + 빈조건.칸.length + '개 (0이어야 합니다)');
  ok(빈조건.알약.join(' ').indexOf('아직 아무 숫자도 만들지 않았습니다') >= 0,
     '「아직 아무 숫자도 만들지 않았습니다」 라고 말한다');
  ok(빈조건.미루기보임 === false, '「미루면」 칸도 같이 감춘다 (빈 표를 세워 두지 않는다)');

  console.log('[7] ★ 화면 숫자끼리 어긋나지 않나 (0-1번)');
  const 받는 = 보통.카드.find(c => /매달 받는 금액/.test(c.k));
  const 월 = 받는 ? parseFloat((받는.v || '').replace(/[^0-9.]/g, '')) : 0;
  const dm = 받는 ? /([0-9]+)년이면 모두 ([0-9억,만원 ]+)입니다/.exec(받는.d) : null;
  ok(월 > 0, '카드에 「매달 받는 금액」 이 찍힌다 — ' + (받는 ? 받는.v : '(없음)'));
  ok(!!dm, '「N년이면 모두 X」 가 찍힌다');
  if (dm) {
    const 년 = Number(dm[1]), 적힌 = 만원(dm[2]), 셈 = Math.round(월 * 12 * 년);
    ok(적힌 === 셈, '찍힌 월 ' + 월 + '만원 × 12 × ' + 년 + '년 = ' + 셈 + '만원 / 종이에 적힌 값 '
       + 적힌 + '만원' + (적힌 === 셈 ? ' — 맞습니다' : ' ← 고객이 계산기를 두드리면 어긋납니다'));
  }
  /* 사다리 칸과 「같은 돈」 칸의 숫자도 같은 말을 해야 합니다 */
  const 칸값 = 보통.칸.filter(c => !c.빔).map(c => c.월);
  const 같은돈수 = (보통.같은돈.match(/([0-9]+\.[0-9])만원/g) || []);
  ok(같은돈수.length === 0 || 같은돈수.every(v => 칸값.some(k => k.indexOf(v) >= 0)),
     '「같은 돈인데 다릅니다」 의 금액이 표 안의 칸과 같다 (' + 같은돈수.join(' · ') + ')');

  console.log('[8] 어느 상품으로 잰 숫자인지 밝히나 (9번)');
  ok(/로 계산한 숫자입니다/.test(보통.출처), '출처를 적는다 — ' + 보통.출처.slice(0, 58));
  ok(/생명|라이프|손해|은행|보험/.test(보통.출처), '상품 이름이 실제로 찍힌다');

  console.log('[9] A4 한 장에 서나');
  ok(보통.높이 <= A4, '높이 ' + 보통.높이 + 'px (A4 ' + A4 + 'px 안)');
  ok(A4 - 보통.민높이 >= 여유바닥, '바닥 여유 ' + (A4 - 보통.민높이) + 'px (눈금 ' + 여유바닥 + 'px)');
  ok(보통.작은.length === 0, '9.5px 밑으로 떨어진 글 ' + 보통.작은.length + '곳'
     + (보통.작은.length ? ('\n        ' + 보통.작은.slice(0, 3).join('\n        ')) : ''));
  ok(보통.머리.length === 6, '표 머리 ' + 보통.머리.length + '칸 (월 납입 + 납입기간 다섯)');

  console.log('[10] 도구 장은 파란 그대로인가 (고객용만 따뜻해진다)');
  /* 고객용 장은 --navy 가 벽돌색(#A04F34)입니다. 도구 장에 그 값이 보이면
     따뜻한 색을 :root 로 올렸다는 뜻입니다 (check-jgsheet 의 되돌림 ⓚ). */
  ok(!/A04F34|7F3B24|C47A58/i.test(보통.토큰),
     '벽돌색 토큰이 도구 장까지 내려오지 않았다 — ' + 보통.토큰);
  ok(/3182F6/i.test(보통.토큰), '도구 장의 --navy 는 파란 그대로다');

  console.log('[끝] 조용한가');
  ok(터짐.length === 0, '터진 자리 ' + 터짐.length + (터짐.length ? (' ← ' + 터짐[0]) : ''));
  ok(바깥.length === 0, '사장님 서버를 부른 횟수 ' + 바깥.length + ' (7번)');

  await br.close();
  console.log('──────────────────────────────');
  if (실패) { console.log('✗ ' + 실패 + '가지 빨간불'); process.exit(1); }
  console.log('연금 사다리 점검 통과 — 숫자가 서로 같은 말을 하고, 모르는 칸은 「—」 입니다.');
})();
