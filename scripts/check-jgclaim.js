/* ══════════════════════════════════════════════════════════════════
   🧾 증권전달 설계사 매뉴얼 13장 — <b>청구서류 한 자리</b>      — 판 X368

   사장님 말씀 2026-11-06
     「모든 보험사 / 질병, 상해 등 진단마다, 필요서류가 다른데
      주의사항등도 정리해서 알려줘」

   ★★ 이 장의 핵심은 <b>어느 줄에 종이가 있느냐</b>입니다.
     『보험 마스터북』 SECTION 6(p.106~112)에서 옮긴 줄에는 <b>쪽 번호</b>를
     달고, 책에 없는 통상의 요구에는 <b>「일반」</b>을 답니다. 섞어 놓으면
     다음 세션도 사장님도 어느 줄이 근거 있는 줄인지 모릅니다 (1번).

   ★★ <b>보험사별 차이는 지어 적지 않습니다.</b> 원본/사본 · 간편청구 기준 ·
     접수처 · 선지급 가능 여부는 회사마다 다르고 우리 손에 그 자료가
     없습니다. 그래서 「이것만은 그 회사에 물어보셔야 합니다」 라고 적고
     그 자리에 번호를 둡니다 — 이 자가 그 약속을 지킵니다.

   ★ 번호는 <b>INS_LIFE·INS_GEN 한 곳</b>에서 그려 냅니다. 장 안에 번호를
     손으로 적어 두면 두 벌이 되고, 바뀔 때 한쪽만 낡습니다 (5번).

   되돌림 — 일부러 되돌려 보고 빨간불이 켜지는지 봤습니다 (8번)
     ⓐ 쪽 번호 꼬리표를 떼기            → [2] 가 욺
     ⓑ 「일반」 꼬리표를 떼기            → [3] 이 욺
     ⓒ 번호를 장 안에 손으로 적기        → [4] 가 욺
     ⓓ 「물어보셔야 합니다」 칸을 지우기  → [5] 가 욺
     ⓔ 「반드시 받으실 수 있습니다」 적기 → [6] 이 욺
     ⓕ 간편청구 기준에 금액을 지어 적기  → [7] 이 욺

   ⚠ 바깥을 한 번도 안 부릅니다 — 파일만 엽니다 (7번 · 8번).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const FILE = path.resolve(__dirname, '..', 'app', '증권전달', 'index.html');
/* 책에서 옮긴 쪽 — 이 다섯 쪽이 다 쓰여야 합니다 */
const 쪽 = ['p.108', 'p.109', 'p.110', 'p.111', 'p.112'];
/* 「일반」(책에 없는 통상의 요구) 꼬리표 최소 수 — 지금 여덟입니다 */
const 일반바닥 = 6;
/* 숨은 보험금 — 책의 20문항 가운데 이 말들이 빠지면 옮기다 흘린 것입니다 */
const 숨은 = ['용종', '치핵', '쌍꺼풀', '신경차단술', '임플란트', '방사선',
              '스텐트', '계류유산', '비만대사수술', '인공관절', '추간판탈출증',
              '십자인대', '흉터', '골절', '뇌출혈', '암진단', '혈액투석',
              '병원비 할인', 'MRI', '금이 가서'];
/* 보험사마다 물어볼 것 — 여섯 */
const 물음 = ['원본', '간편청구', '접수처', '선지급', '위임장', '추가 서류'];

let 실패 = 0;
const ok = (c, m) => { console.log((c ? '  ✓   ' : '  ✗   ') + m); if (!c) 실패++; };

(async () => {
  const src = fs.readFileSync(FILE, 'utf8');
  /* 13장만 잘라 냅니다 — 다른 장의 글이 섞여 들어오면 헛것을 잡습니다 (8번) */
  const m = /<section id="sec13">([\s\S]*?)<\/section>/.exec(src);
  const 장글 = m ? m[1] : '';

  console.log('[1] 13장이 서고 차례에도 있나');
  ok(!!m, '매뉴얼에 <section id="sec13"> 이 있다');
  ok(/href="#sec13"/.test(src), '차례(toc)에 13장 줄이 있다');
  ok(/청구서류 한 자리/.test(장글), '제목이 「청구서류 한 자리」 다');

  console.log('[2] 책에서 옮긴 줄에 쪽 번호가 붙었나 (9번 — 출처를 밝힌다)');
  ok(/보험 마스터북/.test(장글), '출처(『보험 마스터북』)를 적는다');
  ok(/p\.106~112|p\.106-112/.test(장글), '어느 쪽에서 왔는지 범위를 적는다');
  쪽.forEach(p => ok(장글.indexOf('clsrc">📖 ' + p) >= 0 || new RegExp('clsrc"[^>]*>📖\\s*' + p.replace('.', '\\.')).test(장글),
                     '쪽 꼬리표 ' + p + ' 가 붙어 있다'));

  console.log('[3] 책에 없는 줄은 「일반」 이라고 밝히나 (1번)');
  const 일반수 = (장글.match(/clsrc gen">일반</g) || []).length;
  ok(일반수 >= 일반바닥, '「일반」 꼬리표 ' + 일반수 + '개 (바닥 ' + 일반바닥 + ')');
  ok(/책에 없는 통상의 요구/.test(장글), '머리글이 「책에 없는 통상의 요구」 라고 말한다');

  console.log('[4] 보험사 번호를 한 곳에서 그려 내나 (5번)');
  const 날번호 = (장글.match(/\b1[56]\d{2}-\d{4}\b/g) || []);
  ok(날번호.length === 0, '장 안에 손으로 적은 번호 ' + 날번호.length + '개 (0이어야 합니다'
     + (날번호.length ? ' ← ' + 날번호.slice(0, 3).join(' · ') : '') + ')');
  ok(/id="v_clTel"/.test(장글), '번호를 담을 칸(v_clTel)이 있다');
  ok(/function clTelFill\(\)/.test(src), '그려 내는 자(clTelFill)가 한 곳에 있다');
  ok((src.match(/function clTelFill\(/g) || []).length === 1, 'clTelFill 이 두 벌이 아니다');
  ok(/INS_LIFE/.test(src.slice(src.indexOf('function clTelFill'), src.indexOf('function clTelFill') + 900))
     && /INS_GEN/.test(src.slice(src.indexOf('function clTelFill'), src.indexOf('function clTelFill') + 900)),
     '번호를 INS_LIFE·INS_GEN 에서 읽는다 (목록을 또 안 적는다)');

  console.log('[5] 「보험사마다 다름」 을 말하고 무엇을 물을지 적나');
  ok(/보험사마다 다른 것/.test(장글), '「보험사마다 다른 것」 칸이 있다');
  ok(/지어 적지 않았습니다/.test(장글), '지어 적지 않았다고 밝힌다 (1번)');
  물음.forEach(q => ok(장글.indexOf(q) >= 0, '물어볼 것 — ' + q));

  console.log('[6] 단정하지 않나 (1번 · 2번)');
  ok(!/반드시 받으실 수 있|무조건 지급|틀림없이 나옵니다|확실히 지급/.test(장글),
     '받는다고 장담하지 않는다');
  ok(/약관과 보험회사의 심사 결과/.test(장글), '「약관과 보험회사의 심사 결과」 를 말한다');
  ok(/모두 지급된다는 뜻은 아닙니다/.test(장글), '「모두 지급된다는 뜻은 아닙니다」 를 말한다');
  ok(/상법 제662조/.test(장글), '3년은 법조문을 그대로 적는다 (상법 제662조)');

  console.log('[7] 모르는 값을 지어 적지 않나 (1번)');
  /* 「보험사마다 다름」 칸 안에는 금액·한도 숫자가 한 톨도 없어야 합니다 —
     간편청구 기준을 적는 순간 그것은 지어낸 값입니다. */
  const a = 장글.indexOf('보험사마다 다른 것');
  const b = 장글.indexOf('</div>', 장글.indexOf('v_clTel'));
  const 물음칸 = a >= 0 ? 장글.slice(a, b > a ? b : 장글.length) : '';
  const 금액 = (물음칸.match(/[0-9][0-9,]*\s*(만원|원|만\b)/g) || []);
  ok(금액.length === 0, '물음 칸에 지어 적은 금액 ' + 금액.length + '개'
     + (금액.length ? ' ← ' + 금액.slice(0, 3).join(' · ') : ''));

  console.log('[8] 숨은 보험금 20문항을 다 옮겼나');
  const 빠짐 = 숨은.filter(w => 장글.indexOf(w) < 0);
  ok(빠짐.length === 0, '빠진 문항 ' + 빠짐.length + '개'
     + (빠짐.length ? ' ← ' + 빠짐.join(' · ') : ' (20가지 모두)'));

  /* ── 브라우저로 — 진짜 그려지나 ───────────────────────────── */
  const br = await chromium.launch();
  const p = await br.newPage({ viewport: { width: 1100, height: 1000 } });
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

  const r = await p.evaluate(() => {
    const s = document.getElementById('sec13');
    const tel = document.getElementById('v_clTel');
    const o = { 있나: !!s, 표: 0, 번호: 0, 쪽표: 0, 일반표: 0, 작은: [], 맛: '' };
    if (!s) return o;
    o.표 = s.querySelectorAll('table').length;
    o.쪽표 = s.querySelectorAll('.clsrc:not(.gen)').length;
    o.일반표 = s.querySelectorAll('.clsrc.gen').length;
    if (tel) { o.번호 = tel.querySelectorAll('div').length; o.맛 = (tel.textContent || '').slice(0, 40); }
    /* 설계사가 읽는 글 — 11px 밑으로 떨어지지 않게 */
    s.querySelectorAll('*').forEach(e => {
      if (e.children.length) return;
      const t = (e.textContent || '').trim(); if (!t) return;
      const f = parseFloat(getComputedStyle(e).fontSize);
      if (f < 11) o.작은.push(Math.round(f * 10) / 10 + 'px · ' + t.slice(0, 22));
    });
    return o;
  });

  console.log('[9] 화면에 진짜 그려지나');
  ok(r.있나, '13장이 화면에 선다');
  ok(r.표 >= 7, '표 ' + r.표 + '개 (7개 이상)');
  ok(r.쪽표 >= 5, '쪽 꼬리표 ' + r.쪽표 + '개가 화면에 보인다');
  ok(r.일반표 >= 일반바닥, '「일반」 꼬리표 ' + r.일반표 + '개가 화면에 보인다');
  ok(r.번호 === 36, '보험사 번호 ' + r.번호 + '곳이 그려진다 (생명 20 + 손해 16)');
  ok(/\d{4}-\d{4}/.test(r.맛), '번호가 진짜 찍힌다 — ' + (r.맛 || '(빈 칸)'));
  ok(r.작은.length === 0, '11px 밑으로 떨어진 글 ' + r.작은.length + '곳'
     + (r.작은.length ? ('\n        ' + r.작은.slice(0, 4).join('\n        ')) : ''));

  console.log('[끝] 조용한가');
  ok(터짐.length === 0, '터진 자리 ' + 터짐.length + (터짐.length ? (' ← ' + 터짐[0]) : ''));
  ok(바깥.length === 0, '사장님 서버를 부른 횟수 ' + 바깥.length + ' (7번)');

  await br.close();
  console.log('──────────────────────────────');
  if (실패) { console.log('✗ ' + 실패 + '가지 빨간불'); process.exit(1); }
  console.log('청구서류 13장 점검 통과 — 종이가 있는 줄과 없는 줄이 갈려 있습니다.');
})();
