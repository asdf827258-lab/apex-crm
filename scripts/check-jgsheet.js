/* ══════════════════════════════════════════════════════════════════
   📜 증권전달 — 고객이 받는 속지·안내장                    — 판 X361
   사장님 말씀 2026-11-06
     「증권전달 이거 디자인 재구성하고 싶어 먼저 파악하고」
     「고객에게 관리해줄수 있는 보험 담당자로써 내용을 재구성 글씨를 키우고
      청구 관리 안내 방법 필요서류 등 디자인 부터 재구성 해보자」

   ★★ 손대기 전에 재어 보니, 글이 든 자리 536곳 가운데 489곳(91%)이
     15px 미만이었습니다. A4 가 794px 이라 11px 은 종이에서 8포인트입니다 —
     60대 고객이 돋보기 없이 못 읽습니다. 그런데 낱장마다 밑이 121~578px
     비어 있었습니다. 키울 자리가 이미 있었던 것입니다.

   ★ 이 자가 보는 것 (열 가지)
     [1] 고객용이 <b>열다섯 장</b>이고 <b>소개(s0)가 맨 앞</b> · <b>담당자가 계약보다 먼저</b> 온다
     [2] 어느 장도 A4 를 안 넘는다
     [3] <b>고객이 읽는 글은 13px 바닥</b> — 법정 고지만 예외
     [4] <b>상담 도구 장(chk)은 한 톨도 안 바뀐다</b> — 어르신용으로 따로
         맞춰 둔 자리가 있어, 전역에 글씨를 키우면 그쪽이 같이 커집니다
     [5] 쪽 번호를 <b>손으로 안 적는다</b> — shNum() 한 곳이 센다
     [6] 「보내는 세 가지 방법」이 <b>한 장에만</b> 있다 (5번)
     [7] 서류 장이 <b>「보험사·상품마다 다릅니다」</b> 와 심사 문구를 말한다 (1번)
     [8] 놓치는 청구 장이 <b>「지급된다」고 단정하지 않는다</b>
     [9] 글씨 크기를 <b>토큰 한 곳</b>에서만 정한다
     [10] 견본 고객 이름이 <b>홍길동</b> 이다 (3번)
     [11] <b>따뜻한 가족을 지키는 색</b>이다 — 고객용 장에 파란 자리 0 (판 X362)
     [12] 가족 그림을 <b>직접 그렸다</b> — 인라인 SVG, 남의 삽화·사진이 아니다 (9번)
     [13] 그림글자(Tossface)를 <b>저장소가 쓰는 그 주소</b>로 한 번만 받는다 (5번)
     [14] <b>상담 도구 장·설계사 매뉴얼은 파란 그대로</b>다 — 고객용만 따뜻해진다
     [2] 어느 장도 A4 를 안 넘고, <b>바닥에 25px 여유</b>를 남긴다 (판 X364) —
          제 기계에서는 들어가고 CI 에서만 넘친 적이 있습니다(s14 +22px).
          글꼴이 다르면 줄 수가 달라지므로 「안 넘쳤다」 로는 모자랍니다.
     [19] 🛎 <b>간병인 장이 단정하지 않고 주민번호를 안 받는다</b> (판 X374) —
          「모든 보험사에서 가족간병이 된다」 는 확인할 수 없는 말입니다.
     [17] 📑 <b>표지 차례를 장에서 읽어</b> 세운다 (판 X369) — 손으로 적어 두면
          장을 끄고 켤 때마다 거짓말이 됩니다.
     [18] ✅ <b>「오늘 확인한 것」 은 켠 것만 찍힌다</b> (판 X369) — 안 하신 것을
          미리 찍어 두면 그 종이가 거짓말을 하고, 고객은 그것을 사실로 믿습니다.
     [16] <b>어려운 말에 풀이가 그 장 안에</b> 붙어 있다 (판 X364) — 사장님 말씀
          2026-11-06 「어른들도 이해하기 쉽게 알려주는 말투로 해」. 다른 장에
          풀이를 적어 두면 그 장을 들고 병원에 가신 분은 못 봅니다.
     [15] 🖼 <b>사진이 눈에 확 들어온다</b> (판 X363) — 장마다 사진 자리가 있고,
          사진은 <b>캐러셀과 같은 길</b>(/api/photo-search)로 찾고, 켤 때 서버를
          안 부르고, 사진이 없으면 <b>가족 그림</b>이 서고, 있으면 <b>사진가 이름</b>이 찍힌다

   ★ 되돌려 보고 빨간불을 확인했습니다 (8번)
     ⓐ --ss-body 를 11.5px 로 되돌림      → [3] 이 「14px 미만 …곳」 으로 욺
     ⓑ 토큰을 :root 로 옮김               → [4] 가 「도구 장이 변했다」 로 욺
     ⓒ .ways 를 연락처 장에 도로 베껴 둠  → [6] 이 「두 곳」 으로 욺
     ⓓ 차례에서 담당자를 계약 뒤로 옮김   → [1] 이 욺
     ⓔ 쪽 번호를 날글로 도로 적음          → [5] 가 욺
     ⓕ 서류 장에서 「보험사·상품마다」 뺌  → [7] 이 욺
     ⓖ 새 장을 지움                       → [1] 이 욺
     ⓗ 고객용 장에 파란색을 도로 박음      → [11] 이 욺
     ⓘ 가족 그림을 <img> 로 바꿈           → [12] 가 욺
     ⓙ 토스페이스 줄을 지움                → [13] 이 욺
     ⓚ 따뜻한 색을 :root 로 올림           → [14] 가 욺(도구 장이 같이 따뜻해집니다)
     ⓛ 색을 옛 벽돌로 되돌림               → [11] 이 욺
     ⓜ 리본 틀을 안 부름                   → [20] 이 욺
     ⓝ 알약 머리줄을 지움                  → [20] 이 욺
     ⓞ 빨강 ✔ 를 옛 점으로 되돌림          → [20] 이 욺

   ★★ 2026-11-06 사장님 말씀 「내가 보낸 속지 테마로 전체적으로 다 바꿔줘」 →
     색을 여쭈니 <b>「A+ 자료처럼 파랑으로」</b>. 그래서 [11] 의 판정을
     <b>뒤집었습니다</b> — 전에는 「고객용에 파란 자리가 0」 이었습니다.
     말씀이 바뀌면 자도 같이 바뀝니다. 옛 눈금을 남겨 두면 그 자가 거짓말을 합니다.
     ⓛ 사진 자리(.jg-hero)를 지움           → [15] 가 욺
     ⓝ 풀이 한 마디를 지움(s14 원무과)      → [16] 이 욺 — 실제로 돌려 봤습니다
     ⓞ 새 장(s14)을 지움                   → [1]·[15] 가 욺 — 실제로 돌려 봤습니다
     ⓟ 표지 차례를 손으로 적음              → [17] 이 욺 — 실제로 돌려 봤습니다
     ⓠ 안 고른 것까지 찍히게 함             → [18] 이 욺 — 실제로 돌려 봤습니다
     ⓡ 간병인 장에 「모두 가능」 이라 적음     → [19] 가 욺 — 실제로 돌려 봤습니다
     ⓢ 간병인 장에 주민번호 칸을 둠           → [19] 가 욺 — 실제로 돌려 봤습니다
     ⓜ 사진 찾는 길을 제 것으로 새로 만듦    → [15] 가 욺(/api/photo-search 가 아니면)
     ⓝ 켤 때 사진을 미리 받게 함             → 「서버를 부른 횟수」 가 욺 (7번)

   ⚠ 바깥을 한 번도 안 부릅니다 — 파일만 엽니다 (8번).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const FILE = path.resolve(__dirname, '..', 'app', '증권전달', 'index.html');

/* 고객이 받는 차례 — 담당자가 계약보다 먼저입니다 */
/* ★ 2026-11-11 (판 X412) — 맨 앞에 <b>s0 · 담당 설계사 소개</b>가 섰습니다.
   사장님 말씀 「첫 장 나를 소개하고 … 앞으로 관리에 대한 약속을 하고」.
   s0 은 쪽 번호를 안 먹습니다(shNum 이 .sh-top .r 없는 장을 건너뜁니다) —
   그래서 [5] 의 쪽 번호 세기는 그대로입니다. */
/* ★ s19(소중한 가족) 가 간병인 장 <b>바로 뒤</b>에 섭니다 (판 X414) — 간병인 장이
   「다음 장에 적어 주시면」 이라 말하므로, 사이에 다른 장이 끼면 그 말이 거짓이 됩니다. */
const 차례 = ['s0','s1','s6','s5','s15','s2','s3','s16','s19','s12','s14','s13','s4','s10','s11'];
/* 글씨 바닥 — 고객용 장의 어떤 글도 이 밑으로 안 갑니다 (법정 꼬리글만 예외) */
const 바닥 = 13;
/* ★ A4 바닥에 남겨 둘 여유 — 글꼴이 바뀌면 줄 수가 달라집니다 (판 X364) */
/* ⚠ 눈금을 <b>25 → 45px 로 올립니다</b> (판 X377). 25px 로는 못 막았습니다 —
   제 통에서 s14 가 29px 남았는데 <b>CI 에서는 +1px 넘쳤습니다</b>. 글꼴이 달라
   줄 수가 달라지는데, 그 차이가 이번에 30px 이었습니다. 느슨한 눈금은 알람이
   아닙니다 (8번 · 판 X364 에서 한 번 데인 그 자리입니다). */
const 여유바닥 = 45;
/* ★ 사다리 값이 <b>뒤로 가지 않는지</b>를 봅니다 — 낱낱의 글을 세는 것보다
   이쪽이 튼튼합니다. 한 곳(--ss-…)만 고치면 전부 따라오게 해 두었으니,
   그 한 곳이 작아지지 않는지만 지키면 됩니다 (5번). */
const 사다리 = { '--ss-h2': 30, '--ss-h3': 19, '--ss-lead': 17.5, '--ss-lab': 17, '--ss-body': 16, '--ss-sm': 14, '--ss-foot': 13 };
/* 상담 도구 장은 <b>이 분포 그대로</b>여야 합니다.
   ⚠ 판 X375 에서 <b>다시 쟀습니다</b> — 도구 장이 셋에서 넷으로 늘었기 때문입니다
     (연금 사다리 s17). 기준선을 조용히 올리지 않았습니다: 되돌림 ⓑ(토큰을 :root 로)
     가 새 기준에서도 우는지 다시 확인하고 적었습니다 (8번).
   처음 잰 값은 판 X361 의
     9.5×3 10.5×17 11×14 11.5×39 12×14 12.5×14 13×58 13.5×9 14×15 15×12 16×8 18.5×6 22×1 23×1 26×1 27×2
   입니다 — s17 을 빼면 이 값으로 돌아가야 합니다. */
/* ★ 어려운 말 → 그 말 <b>옆에 반드시 있어야 할 풀이</b> (판 X364)
   [장, 어려운 말, 받아 주는 풀이들] — 그 장에 그 말이 없으면 묻지 않습니다. */
const 풀이 = [
  ['s6',  '수익자',          ['보험금 받으실 분', '보험금 받는 사람']],
  ['s6',  '피보험자',        ['보장받는 분', '보장받는 사람']],
  ['s6',  '계약자',          ['보험료 내시는 분', '돈 내는 사람']],
  ['s2',  '실효',            ['보장이 멈출 수 있습니다', '보장이 멈출']],
  ['s3',  '원무과',          ['서류를 떼어 주는 창구', '서류 떼어 주는 창구']],
  ['s14', '원무과',          ['서류를 떼어 주는 창구', '서류 떼어 주는 창구']],
  ['s14', '질병분류기호',    ['병마다 붙는 영문·숫자 기호', '영문·숫자 기호']],
  ['s12', '질병분류기호',    ['병마다 붙는 영문·숫자 기호', '영문·숫자 기호']],
  ['s12', '수술기록지',      ['어떤 수술을 했는지']],
  ['s12', '통원 확인서',     ['다니며 치료받은']],
  ['s12', '조직검사 결과지', ['떼어 낸 조직']],
  ['s12', '진료비 세부내역서',['치료 항목마다 얼마가 들었는지', '항목마다 얼마']],
  ['s4',  '계약 후 알릴 의무',['가입한 뒤에 바뀐 일을 보험사에 알리셔야 하는 의무', '가입한 뒤에 바뀐 일']]
];
const 도구기준 = '9.5×23 10×15 10.5×27 11×26 11.5×46 12×15 12.5×14 13×60 13.5×28 14×15 15×12 16×8 18.5×6 20×1 21×1 22×1 23×1 26×1 27×2';

let 실패 = 0;
const ok  = (c, m) => { console.log((c ? '  ✓   ' : '  ✗   ') + m); if (!c) 실패++; };

(async () => {
  console.log('📜 증권전달 — 고객이 받는 속지·안내장 (판 X361)');
  console.log('──────────────────────────────');

  const src = fs.readFileSync(FILE, 'utf8');

  /* ── [9] 크기를 토큰 한 곳에서만 정하나 ───────────────────── */
  console.log('[9] 글씨 크기를 토큰 한 곳에서 정하나');
  /* ⚠ 판 X376 에서 고객용 갈래가 셋이 되었습니다(ins · let · <b>mag</b> = 붙이는 한 장).
     묶음은 <b>여전히 한 곳</b>이고 선택자만 길어졌습니다 — 토큰을 또 적었다면
     여기가 아니라 #s18 쪽에서 걸립니다 (check-jgmag [4]). */
  const 토큰블록 = /\.sheet\[data-kind="ins"\],\.sheet\[data-kind="let"\](?:,\.sheet\[data-kind="mag"\])?\{([^}]*)\}/.exec(src);
  ok(!!토큰블록, '고객용 장에만 거는 토큰 묶음이 있다');
  if (토큰블록) {
    Object.keys(사다리).forEach(k => {
      const m = new RegExp(k + ':\\s*([0-9.]+)px').exec(토큰블록[1]);
      const v = m ? parseFloat(m[1]) : 0;
      ok(v >= 사다리[k], k + ' = ' + (m ? m[1] + 'px' : '(없음)') + ' (바닥 ' + 사다리[k] + 'px)');
    });
  }
  ok(!/--ss-[a-z]+\s*:/.test((/:root\{[^}]*\}/.exec(src) || [''])[0]),
     '토큰을 :root 에 두지 않았다 (전역에 걸면 상담 도구 장이 같이 커집니다)');
  /* 낱장 CSS 가 크기를 또 박지 않는지 — 고객용 장만 가리키는 #s 규칙에 날 px */
  const 박은곳 = (src.match(/#s(?:1|2|3|4|5|6|10|11|12|13)\s[^{]*\{[^}]*font-size:\s*[0-9]/g) || []);
  ok(박은곳.length === 0, '고객용 장에 크기를 또 박은 자리 ' + 박은곳.length + '곳'
     + (박은곳.length ? ('\n        ' + 박은곳.slice(0, 4).join('\n        ')) : ''));

  /* ── [5] 쪽 번호를 손으로 안 적나 ────────────────────────── */
  console.log('[5] 쪽 번호를 손으로 안 적나');
  const 날번호 = (src.match(/보험증권 보관 안내서 · \d/g) || []).length;
  ok(날번호 === 0, 'HTML 에 손으로 적은 쪽 번호 ' + 날번호 + '개 (0이어야 합니다)');
  ok(/function shNum\(\)/.test(src), '세는 자(shNum)가 한 곳에 있다');
  ok((src.match(/function shNum\(/g) || []).length === 1, 'shNum 이 두 벌이 아니다');

  /* ── [6] 보내는 세 가지 방법이 한 곳에만 ─────────────────── */
  console.log('[6] 「보내는 세 가지 방법」이 한 장에만 있나');
  const ways = (src.match(/<div class="ways">/g) || []).length;
  ok(ways === 1, '.ways 덩이 ' + ways + '개 (1이어야 합니다 · 5번)');

  /* ── [10] 견본 이름 ───────────────────────────────────── */
  console.log('[10] 견본 고객 이름이 홍길동인가');
  ok(/홍길동/.test(src), '홍길동을 쓴다 (3번)');

  /* ── [12] 가족 그림 · [13] 그림글자 ──────────────────────── */
  console.log('[12] 가족 그림을 직접 그렸나 (9번)');
  const fam = (src.match(/<svg class="jgfam"/g) || []).length;
  ok(fam >= 1, '인라인 SVG 가족 그림 ' + fam + '개');
  ok(!/<img[^>]+(jgfam|family|가족)/i.test(src), '그림을 <img> 로 불러오지 않는다 (남의 삽화 금지)');
  ok(/stroke-linecap:round/.test(src), '선으로 그렸다 — 인쇄에서 안 뭉개집니다');

  console.log('[13] 그림글자를 저장소가 쓰는 그 주소로 한 번만 받나');
  const tf = (src.match(/tossface@[0-9.]+\/dist\/tossface\.css/g) || []);
  ok(tf.length === 1, 'Tossface 를 ' + tf.length + '번 받는다 (1번이어야 합니다 · 5번)');
  const other = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'apex-map.html'), 'utf8');
  const 남의것 = (/tossface@[0-9.]+/.exec(other) || [''])[0];
  ok(tf.length === 1 && tf[0].indexOf(남의것) === 0,
     '다른 화면(apex-map)과 <b>같은 판</b>을 받는다 — ' + (남의것 || '(못 읽음)'));

  /* ── 브라우저로 재는 것 ─────────────────────────────────── */
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const 터짐 = [];
  p.on('pageerror', e => 터짐.push(String(e).slice(0, 110)));
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

  const r = await p.evaluate(({ 바닥 }) => {
    const A4 = 1123;
    const 장 = [];
    document.querySelectorAll('.sheet[data-kind="ins"],.sheet[data-kind="let"]').forEach(s => {
      if (s.classList.contains('off')) return;
      const q = s.getBoundingClientRect();
      const no = s.querySelector('.sh-top .r');
      /* ★ 여유도 같이 잽니다 (판 X364) — min-height 를 잠깐 풀면 글이 실제로
         차지하는 높이가 나옵니다. A4 에서 그만큼 뺀 것이 남는 자리입니다. */
      const mh = s.style.minHeight;
      s.style.minHeight = '0';
      const 민높이 = s.getBoundingClientRect().height;
      s.style.minHeight = mh;
      장.push({ id: s.id, 높이: Math.round(q.height), 넘침: Math.max(0, Math.round(q.height - A4)),
                여유: Math.round(A4 - 민높이),
                쪽: no ? (no.textContent || '').trim() : '' });
    });
    /* 작은 글 — 읽는 글만 셉니다 */
    const 작은 = [];
    document.querySelectorAll('.sheet[data-kind="ins"],.sheet[data-kind="let"]').forEach(s => {
      if (s.classList.contains('off')) return;
      s.querySelectorAll('*').forEach(e => {
        if (e.children.length) return;
        const t = (e.textContent || '').trim();
        if (!t) return;
        if (e.closest('.sh-foot')) return;                /* 법정 고지만 12px 입니다 */
        const f = parseFloat(getComputedStyle(e).fontSize);
        if (f < 바닥) 작은.push(Math.round(f * 10) / 10 + 'px · ' + t.slice(0, 30));
      });
    });
    /* 상담 도구 장 — 잠깐 켜서 분포를 잰다 */
    const chk = [...document.querySelectorAll('.sheet[data-kind="chk"]')];
    const was = chk.map(s => s.classList.contains('off'));
    chk.forEach(s => s.classList.remove('off'));
    const c = {};
    chk.forEach(s => s.querySelectorAll('*').forEach(e => {
      if (e.children.length) return;
      const t = (e.textContent || '').trim(); if (!t) return;
      const f = Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10;
      c[f] = (c[f] || 0) + 1;
    }));
    chk.forEach((s, i) => { if (was[i]) s.classList.add('off'); });
    const 도구 = Object.keys(c).map(Number).sort((x, y) => x - y).map(f => f + '×' + c[f]).join(' ');
    /* 장을 하나 꺼 보고 쪽 번호가 다시 매겨지나 */
    const t13 = document.getElementById('s13');
    let 다시 = '';
    if (t13) {
      t13.classList.add('off');
      try { markFirst(); } catch (e) {}
      const l = document.getElementById('s11').querySelector('.sh-top .r');
      다시 = l ? (l.textContent || '').trim() : '';
      t13.classList.remove('off');
      try { markFirst(); } catch (e) {}
    }
    /* 🧡 파란 자리를 셉니다 — 고객용은 0, 도구 장은 그대로여야 합니다 (판 X362) */
    const 파랑 = (c) => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || '');
      if (!m) return false; const R = +m[1], G = +m[2], B2 = +m[3];
      return B2 > R + 28 && B2 > 100; };
    const 푸른곳 = (sel) => { const out = [];
      document.querySelectorAll(sel).forEach(s => {
        if (s.classList.contains('off')) return;
        const cs0 = getComputedStyle(s);
        if (파랑(cs0.backgroundColor) || 파랑(cs0.backgroundImage)) out.push(s.id + ' · 장 바탕');
        s.querySelectorAll('*').forEach(e => { const cs = getComputedStyle(e);
          ['color','backgroundColor','backgroundImage','borderTopColor','borderRightColor',
           'borderBottomColor','borderLeftColor'].forEach(k => {
            if (파랑(cs[k])) out.push(s.id + ' · ' + (e.className || e.tagName) + ' · ' + k); }); }); });
      return out; };
    const 고객파랑 = 푸른곳('.sheet[data-kind="ins"],.sheet[data-kind="let"]');
    /* 🎨 고객용 장의 <b>토큰 값</b>을 그대로 읽습니다 (판 X377) — 색 세기보다
       정확합니다. A+ 파랑 #0B60B0 이어야 하고, 옛 벽돌 #A04F34 면 안 됩니다. */
    const 고객토큰 = (() => { const s0 = document.querySelector('.sheet[data-kind="ins"]');
      if (!s0) return ''; const cs = getComputedStyle(s0);
      return ['--navy','--navy2','--gold-l','--ap-chk','--ap-red']
        .map(k => k + '=' + cs.getPropertyValue(k).trim()).join(' '); })();
    /* 🎀 A+ 의 표식이 장마다 붙었나 */
    const 틀 = [...document.querySelectorAll('.sheet[data-kind="ins"],.sheet[data-kind="let"],.sheet[data-kind="mag"]')]
      .filter(x => !x.classList.contains('off'))
      .map(x => x.id + ':' + x.querySelectorAll(':scope > .apfr').length + '틀'
                 + x.querySelectorAll(':scope > .aprib').length + '리본');
    const 알약머리 = [...document.querySelectorAll('.sheet[data-kind="ins"] .subhead,.sheet[data-kind="let"] .subhead')]
      .filter(e => getComputedStyle(e).textAlign === 'center'
                && /rgb\(185, 233, 255\)/.test(getComputedStyle(e).backgroundColor)).length;
    const 머리모두 = document.querySelectorAll('.sheet[data-kind="ins"] .subhead,.sheet[data-kind="let"] .subhead').length;
    /* ⚠ 처음에는 「빨강 ✔ 가 한 곳이라도 있으면 된다」 로 적었다가, 서류 목록의
       ✔ 를 옛 점으로 되돌려도 <b>안 울었습니다</b> — 떼는 요령 쪽 ✔ 가 남아
       통과시켰습니다. 알람이 아닙니다 (8번). 이제 <b>줄마다</b> 있는지 봅니다. */
    const 체크줄 = [...document.querySelectorAll('.sheet[data-kind="ins"] .ds li,.sheet[data-kind="ins"] .jgtip-r')];
    const 빨강체크 = 체크줄.filter(e => /rgb\(254, 0, 0\)/.test(getComputedStyle(e, '::before').borderBottomColor)).length;
    const 체크모두 = 체크줄.length;
    const chk2 = [...document.querySelectorAll('.sheet[data-kind="chk"]')];
    const was2 = chk2.map(s => s.classList.contains('off'));
    chk2.forEach(s => s.classList.remove('off'));
    const 도구파랑 = 푸른곳('.sheet[data-kind="chk"]').length;
    chk2.forEach((s, i) => { if (was2[i]) s.classList.add('off'); });
    /* 🖼 사진 자리 — 없을 때와 있을 때를 둘 다 봅니다 (판 X363).
       진짜 사진 API 는 안 부릅니다(바깥을 막아 두었습니다) — 길만 돌립니다. */
    const hero = document.querySelector('.jg-hero[data-ph="s3"]');
    const 띠 = { 사진없을때: { 가족그림: !!(hero && getComputedStyle(hero.querySelector('.jg-hero-fam')).display !== 'none') },
                 사진넣으면: { 참: false, 말: '', 출처: '' } };
    try {
      const c = document.createElement('canvas'); c.width = 60; c.height = 40;
      const x = c.getContext('2d'); x.fillStyle = '#C4714A'; x.fillRect(0, 0, 60, 40);
      const u = c.toDataURL('image/jpeg', 0.7);
      JGPH.s3 = { url: u, by: '홍길동', src: 'Pexels' };
      jgphPaint();
      띠.사진넣으면.참 = hero.classList.contains('has') && /data:image/.test(hero.style.backgroundImage)
                        && getComputedStyle(hero.querySelector('.jg-hero-fam')).display === 'none';
      띠.사진넣으면.말 = '띠가 차고 가족 그림은 물러난다';
      const cr = document.querySelector('#s3 .jg-credit');
      띠.사진넣으면.출처 = cr ? cr.textContent.trim() : '';
      delete JGPH.s3; jgphPaint();
    } catch (e) { 띠.사진넣으면.말 = '터졌습니다 — ' + ((e && e.message) || ''); }
    const 글 = (id) => { const e = document.getElementById(id); return e ? (e.innerText || '') : ''; };
    /* 📑 표지 차례 — 장에서 읽어 세우나 (판 X369) */
    /* ★ s0(담당 설계사 소개)도 뺍니다 (판 X412) — 표지(s1) 앞에 서는 장이라
       「이 안에 들어 있는 것」 의 본문 장이 아닙니다. 넣으면 머리글의
       「모두 N장」 이 안내서 본문 수와 어긋납니다. */
    const 켜진 = [...document.querySelectorAll('.sheet[data-kind="ins"],.sheet[data-kind="let"]')]
      .filter(x => !x.classList.contains('off') && x.id !== 's1' && x.id !== 's0');
    const 차례 = { 줄: document.querySelectorAll('#v_cvtoc div:not(.ex)').length, 켜진: 켜진.length,
                   머리: (document.getElementById('v_cvtoch') || {}).textContent || '', 끈뒤: -1 };
    (function () {
      const c = document.querySelector('.chip input[data-s="s13"]');
      if (!c) return;
      c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true }));
      차례.끈뒤 = document.querySelectorAll('#v_cvtoc div:not(.ex)').length;
      c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true }));
    })();
    /* ✅ 오늘 함께 확인한 것 — 켠 것만 찍히나 (판 X369 · 1번) */
    const 확인 = { 처음줄: document.querySelectorAll('.okl .r').length,
                   처음안내: !!document.querySelector('.oknone'),
                   켠뒤: -1, 켠뒤안내: true, 패널: document.querySelectorAll('#okHost input[data-ok]').length };
    (function () {
      const ks = ['nm', 'ac', 'cal'];
      ks.forEach(k => { const el = document.querySelector('#okHost input[data-ok="' + k + '"]');
        if (el) { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); } });
      확인.켠뒤 = document.querySelectorAll('.okl .r').length;
      확인.켠뒤안내 = !!document.querySelector('.oknone');
      ks.forEach(k => { const el = document.querySelector('#okHost input[data-ok="' + k + '"]');
        if (el) { el.checked = false; el.dispatchEvent(new Event('change', { bubbles: true })); } });
    })();
    const 장글 = {};
    document.querySelectorAll('.sheet[data-kind="ins"],.sheet[data-kind="let"]')
      .forEach(sh => { 장글[sh.id] = sh.innerText || ''; });
    return { 장, 작은, 도구, 다시, s12: 글('s12'), s13: 글('s13'), 장글, 차례, 확인,
             고객파랑: [...new Set(고객파랑)], 도구파랑, 띠,
             고객토큰, 틀, 알약머리, 머리모두, 빨강체크, 체크모두 };
  }, { 바닥 });

  console.log('[1] 고객용이 열다섯 장이고 소개가 맨 앞 · 담당자가 계약보다 먼저 오나');
  const 선차례 = r.장.map(x => x.id);
  ok(선차례.length === 차례.length, '고객용 ' + 선차례.length + '장 (' + 차례.length + '장이어야 합니다)');
  ok(선차례.join('>') === 차례.join('>'), '차례 — ' + 선차례.join(' → '));
  ok(선차례.indexOf('s5') < 선차례.indexOf('s2'), '담당자(s5)가 계약(s2)보다 앞에 선다');
  ok(선차례.indexOf('s12') >= 0 && 선차례.indexOf('s13') >= 0, '필요서류(s12)·놓치는 청구(s13) 장이 있다');

  console.log('[2] 어느 장도 A4 를 안 넘나');
  const 넘 = r.장.filter(x => x.넘침 > 0);
  ok(넘.length === 0, '넘치는 장 ' + 넘.length + '개' + (넘.length ? (' — ' + 넘.map(x => x.id + ' +' + x.넘침 + 'px').join(' · ')) : ''));
  /* ★★ <b>여유를 남겨 둡니다</b> (판 X364) — 2026-11-06 에 제 기계에서는 들어가고
     CI 에서만 s14 가 +22px 넘쳤습니다. 글꼴이 다르면 줄 수가 달라지기 때문입니다.
     그래서 「안 넘쳤다」 로는 모자랍니다 — <b>재는 그 자리에서</b> 바닥 여유를
     요구합니다. 눈금은 그때 벌어진 22px 보다 조금 넉넉한 25px 입니다. */
  const 빠듯 = r.장.filter(x => x.여유 < 여유바닥);
  ok(빠듯.length === 0, '바닥 여유가 ' + 여유바닥 + 'px 안 되는 장 ' + 빠듯.length + '개'
     + (빠듯.length ? (' — ' + 빠듯.map(x => x.id + ' ' + x.여유 + 'px').join(' · ')) : '')
     + ' (지금 가장 빠듯한 장 ' + (function(){ const m = r.장.slice().sort((a,c)=>a.여유-c.여유)[0];
         return m ? m.id + ' ' + m.여유 + 'px' : '?'; })() + ')');

  console.log('[3] 고객이 읽는 글이 ' + 바닥 + 'px 바닥을 지키나');
  ok(r.작은.length === 0, '바닥 밑으로 떨어진 글 ' + r.작은.length + '곳'
     + (r.작은.length ? ('\n        ' + r.작은.slice(0, 6).join('\n        ')) : ''));

  console.log('[4] 상담 도구 장이 한 톨도 안 바뀌었나');
  ok(r.도구 === 도구기준, '도구 장 글씨 분포' + (r.도구 === 도구기준 ? ' 그대로' : ('\n        잰 값 ' + r.도구 + '\n        기준 ' + 도구기준)));

  console.log('[5] 장을 끄면 쪽 번호가 다시 매겨지나');
  ok(/· 11$/.test(r.다시), '놓치는 청구 장을 끄니 연락처가 12 → ' + (r.다시 || '(못 읽음)'));

  console.log('[7] 서류 장이 단정하지 않나 (1번 · 2번)');
  ok(/보험사와 상품마다 다릅니다/.test(r.s12), '「보험사와 상품마다 다릅니다」 를 말한다');
  ok(/약관과 보험회사의 심사/.test(r.s12), '「약관과 보험회사의 심사」 를 말한다');
  ok(!/반드시 받으실 수 있|모두 지급됩니다|틀림없이/.test(r.s12), '받는다고 장담하지 않는다');

  console.log('[8] 놓치는 청구 장이 지급을 단정하지 않나');
  ok(/모두 지급된다는 뜻은 아닙니다/.test(r.s13), '「모두 지급된다는 뜻은 아닙니다」 를 말한다');
  ok(/약관과 보험회사의 심사/.test(r.s13), '「약관과 보험회사의 심사」 를 말한다');
  ok(/상법 제662조/.test(r.s13), '3년은 법조문을 그대로 적는다 (상법 제662조)');

  console.log('[11] 🎨 A+ 자료의 파랑인가 (판 X377)');
  /* ⚠ 판 X362 에서는 <b>거꾸로</b> 「고객용에 파란 자리가 0이어야 한다」 였습니다.
     사장님이 2026-11-06 에 「내가 보낸 속지 테마로 전체적으로 다 바꿔줘」 →
     색을 여쭈니 <b>「A+ 자료처럼 파랑으로」</b> 를 고르셔서 판정을 뒤집었습니다.
     말씀이 바뀌면 자도 같이 바뀝니다 — 옛 눈금을 남겨 두면 그 자가 거짓말을 합니다. */
  ok(/--navy=#0B60B0/i.test(r.고객토큰), '고객용 --navy 가 A+ 파랑(#0B60B0)이다 — ' + r.고객토큰);
  ok(!/A04F34|7F3B24|C47A58|E8A33D/i.test(r.고객토큰), '옛 벽돌·호박 토큰이 남아 있지 않다');
  ok(r.고객파랑.length >= 300, '고객용 장의 파란 자리 ' + r.고객파랑.length + '곳 (눈금 300 · 잰 값 454)');

  console.log('[14] 상담 도구 장은 파란 그대로인가 (고객용만 따뜻해진다)');
  /* ★ 눈금을 <b>재어서</b> 놓았습니다 (판 X362) — 따뜻한 색을 :root 로 올려
     보니 도구 장의 파란 자리가 <b>255 → 111</b> 로 떨어졌습니다. 처음에 「20곳
     이상」 으로 두었더니 그 되돌림이 <b>안 울었습니다</b>. 안 울리는 알람은
     알람이 아닙니다 (8번). 도구 장이 줄면 빨간불입니다. */
  ok(r.도구파랑 >= 250, '도구 장의 파란 자리 ' + r.도구파랑 + '곳 (눈금 250 · 잰 값 255)'
     + (r.도구파랑 >= 250 ? ' — 그대로 남아 있다' : ' ← 따뜻한 색이 전역으로 샜습니다'));

  console.log('[15] 사진이 눈에 확 들어오나 (판 X363)');
  const 띠 = (src.match(/class="jg-hero" data-ph=/g) || []).length;
  ok(띠 === 12, '사진 띠가 ' + 띠 + '장에 있다 (표지는 장 전체라 따로)');
  ok(/data-ph="s1"/.test(src), '표지도 사진 자리를 가졌다');
  ok(/\/api\/photo-search\?q=/.test(src), '사진을 캐러셀과 같은 길로 찾는다 (/api/photo-search · 5번)');
  ok(!/api\.pexels\.com|api\.unsplash\.com/.test(src), '사진 서버를 직접 안 부른다 (열쇠가 새지 않게 · 10번)');
  ok(/d\.missing/.test(src), '서버에 사진 키가 없으면 없다고 말한다 (1번)');
  ok(/jg-credit/.test(src), '사진가 이름을 찍는 자리가 있다 (라이선스)');
  ok(r.띠.사진없을때.가족그림, '사진이 없으면 가족 그림이 선다 — 빈 구멍을 안 둡니다 (1번)');
  ok(r.띠.사진넣으면.참, '사진을 넣으면 띠가 찬다 — ' + r.띠.사진넣으면.말);
  ok(r.띠.사진넣으면.출처, '사진가 이름이 꼬리글에 찍힌다 — ' + (r.띠.사진넣으면.출처 || '(없음)'));

  console.log('[16] 어려운 말에 풀이가 붙어 있나 (판 X364)');
  /* 사장님 말씀 2026-11-06 「어른들도 이해하기 쉽게 알려주는 말투로 해」.
     ★ <b>그 말이 쓰인 장 안에</b> 풀이가 같이 있어야 합니다. 다른 장에 적어
       두면 그 장을 들고 병원에 가신 분은 못 봅니다.
     ★ 풀이말은 <b>여러 가지를 받습니다</b> — 글을 조금 다듬었다고 빨간불이
       켜지면 사람이 점검을 안 믿게 됩니다 (8번). 풀이가 <b>통째로 사라질 때</b>
       울리는 눈입니다. */
  풀이.forEach(([장, 말, 풀]) => {
    const t = (r.장글 && r.장글[장]) || '';
    if (t.indexOf(말) < 0) { ok(true, 장 + ' — 「' + 말 + '」 를 안 씁니다 (풀이가 필요 없음)'); return; }
    const 있나 = 풀.some(p => t.indexOf(p) >= 0);
    ok(있나, 장 + ' · 「' + 말 + '」 옆에 풀이' + (있나 ? ' 있음 — 「' + 풀.find(p => t.indexOf(p) >= 0) + '」' : ' 없음 ← 「' + 풀[0] + '」 같은 말을 붙여 주십시오'));
  });

  console.log('[17] 표지 차례를 장에서 읽어 세우나 (판 X369 · 5번)');
  /* ★ 표지에 손으로 적어 두면 장을 끄고 켤 때마다 <b>거짓말</b>이 됩니다.
     그래서 「장에서 제목을 읽어」 세우고, 끄면 따라 빠지는지 봅니다. */
  ok(r.차례.줄 === r.차례.켜진, '차례 ' + r.차례.줄 + '줄 = 켜진 장 ' + r.차례.켜진 + '개(표지 빼고)');
  ok(/모두 \d+장/.test(r.차례.머리), '머리글이 장 수를 말한다 — ' + (r.차례.머리 || '(빈 칸)'));
  ok(r.차례.끈뒤 === r.차례.켜진 - 1,
     '장을 하나 끄니 차례가 ' + r.차례.줄 + ' → ' + r.차례.끈뒤 + '줄로 따라 빠진다');
  ok(/function cvTocFill\(/.test(src) && (src.match(/function cvTocFill\(/g) || []).length === 1,
     '세우는 자(cvTocFill)가 한 곳에 있다');

  console.log('[18] 「오늘 확인한 것」 은 켠 것만 찍히나 (판 X369 · 1번)');
  /* ★★ 안 하신 것을 미리 찍어 두면 그 종이가 거짓말을 합니다. 고객은
     그것을 사실로 믿습니다. 그래서 <b>기본은 한 줄도 안 찍힘</b>입니다. */
  ok(r.확인.패널 === 8, '패널에 고를 것 ' + r.확인.패널 + '가지 (8가지)');
  ok(r.확인.처음줄 === 0, '아무것도 안 골랐을 때 찍히는 줄 ' + r.확인.처음줄 + '개 (0이어야 합니다)');
  ok(r.확인.처음안내, '대신 무엇을 고르면 되는지 적는다 (빈 구멍을 안 둡니다)');
  ok(r.확인.켠뒤 === 3, '셋을 고르니 ' + r.확인.켠뒤 + '줄이 찍힌다 (고른 수 그대로)');
  ok(!r.확인.켠뒤안내, '고르고 나면 안내 글이 물러난다');
  ok(/var OKITEMS\s*=/.test(src) && (src.match(/var OKITEMS\s*=/g) || []).length === 1,
     '고를 것 목록(OKITEMS)이 한 곳에만 있다 (5번)');

  console.log('[19] 간병인 장이 단정하지 않고 주민번호를 안 받나 (판 X374 · 1번 · 3번)');
  /* ★★ 사장님께서 「모두 가족간병 가능」 이라 하셨지만 제 자료로는 회사별로
     그렇다는 것을 확인할 수 없습니다. 고객 종이에 단정해 적었다가 한 건만
     안 돼도 그 자리에서 무너집니다. 그래서 <b>「되는 계약이 있습니다 ·
     제가 확인해 드립니다」</b> 로 적기로 했습니다(사장님이 고르신 길).
     ★ 주민등록번호는 <b>안 받습니다</b> — 필요하면 보험사 서식에 고객이
     직접 적으실 자리입니다 (3번). */
  const s16 = (r.장글 && r.장글.s16) || '';
  ok(!!s16, '간병인 장(s16)이 선다');
  ok(/부르시기 전|쓰시기 전|미리/.test(s16), '「미리 · 부르시기 전」 을 말한다');
  ok(/되는 계약이 있습니다/.test(s16), '「되는 계약이 있습니다」 로 적는다 (단정하지 않음)');
  ok(!/모든 보험사|전부 가능|모두 가능|언제나 됩니다/.test(s16),
     '「모든 보험사에서 된다」 고 단정하지 않는다');
  ok(/확인해 말씀드리겠습니다|확인해서 말씀드리겠습니다/.test(s16), '「제가 확인해 드립니다」 로 잇는다');
  ok(/주민등록번호는 안 알려 주셔도|주민등록번호는 알려 주지 않으셔도/.test(s16),
     '주민등록번호를 받지 않는다고 적는다 (3번)');
  ok(!/주민등록번호\s*(:|：)?\s*(입력|적어|써)/.test(s16) && (s16.match(/주민등록번호/g) || []).length === 1,
     '주민번호를 적는 칸을 두지 않는다');
  ok(/약관과 보험회사의 심사 결과/.test(s16), '지급은 약관과 심사에 따른다고 말한다');

  console.log('[20] 🎀 A+ 테마가 장마다 입혀졌나 (판 X377)');
  const 틀모자람 = r.틀.filter(t => !/:1틀4리본$/.test(t));
  ok(틀모자람.length === 0, '켜진 고객용 장 ' + r.틀.length + '장에 틀 1 + 리본 4가 다 있다'
     + (틀모자람.length ? ' ← ' + 틀모자람.join(' · ') : ''));
  ok((src.match(/function apFrame\(/g) || []).length === 1, '그려 붙이는 자(apFrame)가 한 벌이다 (5번)');
  /* ⚠ 처음에는 「<svg class="aprib 가 하나도 없어야 한다」 로 적었다가
     <b>그리는 자의 본보기 글귀</b>를 제가 잡았습니다 — 헛것입니다 (8번).
     본보기는 딱 한 벌이고, 장 안에 손으로 적으면 둘이 됩니다. */
  const 리본글 = (src.match(/<svg class="aprib/g) || []).length;
  ok(리본글 === 1, '리본 SVG 글귀가 ' + 리본글 + '벌 — 그리는 자의 본보기 하나뿐이다 (5번)');
  ok(r.머리모두 > 0 && r.알약머리 === r.머리모두,
     '고객용 머리줄 ' + r.머리모두 + '개가 모두 <b>A+ 알약</b>이다 (' + r.알약머리 + '개)');
  ok(r.체크모두 > 0 && r.빨강체크 === r.체크모두,
     '서류·요령 줄 ' + r.체크모두 + '곳이 <b>모두</b> A+ 의 빨강 ✔ 다 (' + r.빨강체크 + '곳)');
  ok(/aprib ap-tl/.test(src) || /ap-tl/.test(src), '귀퉁이 이름에 ap- 접두사가 붙어 있다 (.tl 과 안 부딪히게)');

  console.log('[끝] 조용한가');
  ok(터짐.length === 0, '터진 자리 ' + 터짐.length + (터짐.length ? (' ← ' + 터짐[0]) : ''));
  ok(바깥.length === 0, '사장님 서버를 부른 횟수 ' + 바깥.length + ' (7번)');

  await b.close();
  console.log('──────────────────────────────');
  if (실패) { console.log('✗ ' + 실패 + '가지 빨간불'); process.exit(1); }
  console.log('증권전달 속지 점검 통과 — 고객이 읽을 수 있는 크기로 섭니다.');
})();
