/* ══════════════════════════════════════════════════════════════════
   🧲 증권전달 — <b>냉장고에 붙이는 한 장</b> (s18)              — 판 X372

   사장님이 주신 <b>A+에셋 배포물</b>의 짜임새를 따랐습니다 —
   네 귀퉁이 리본 · 알약 머리줄 · 빨강 ✔ 알약 · 아래 아이콘 넷과 라벨.
   ★ 삽화는 <b>복제하지 않고 직접 SVG 로</b> 그렸습니다 (9번).

   ★★ 이 장의 핵심은 <b>번호 한 줄</b>입니다. 급할 때 고객이 보는 종이라
     번호가 비어 있으면 이 장은 쓸모가 없습니다. 그런데 이 파일은 연락처가
     비면 <b>'-'</b> 를, 이름이 비면 <b>'담당 설계사'</b> 를 넣도록 되어 있어
     그대로 쓰면 「담당 설계사 담당 설계사」 와 「-」 가 찍힙니다.
     [8] 이 그 자리만 봅니다 (1번).

   ★ 이 장은 <b>보관 안내서의 장이 아닙니다</b> — 쪽 번호를 안 먹고,
     표지 차례에는 번호 대신 「＋ 붙이는 한 장」 으로 따로 밝힙니다.
     켜져 있는데 아무 말도 안 하면 「모두 12장」 이 거짓말이 됩니다 (1번).

   되돌림 — 일부러 되돌려 보고 빨간불이 켜지는지 봤습니다 (8번)
     ⓐ s18 에 쪽 번호 칸 달기        → [2] 가 욺
     ⓑ 표지에서 「붙이는 한 장」 빼기 → [3] 이 욺
     ⓒ 글씨를 12px 로 내리기         → [4] 가 욺
     ⓓ 파란색을 도로 박기            → [5] 가 욺
     ⓔ 삽화를 <img> 로 바꾸기        → [6] 이 욺
     ⓕ 이름을 기본값 그대로 찍기     → [8] 이 욺

   ⚠ 바깥을 한 번도 안 부릅니다 — 파일만 엽니다 (7번 · 8번).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const FILE = path.resolve(__dirname, '..', 'app', '증권전달', 'index.html');
const A4 = 1123;
/* 바닥 여유 — CI 의 글꼴은 이 통의 글꼴과 다릅니다. 판 X364 에서 제 자가
   「들어간다」 고 한 장이 CI 에서 +22px 넘쳤습니다. 그래서 눈금을 둡니다. */
const 여유바닥 = 70;
const 글바닥 = 16;   /* 고객이 읽는 글 — 법정 꼬리글(.mgfoot)만 뺍니다 */

let 실패 = 0;
const ok = (c, m) => { console.log((c ? '  ✓   ' : '  ✗   ') + m); if (!c) 실패++; };

(async () => {
  const src = fs.readFileSync(FILE, 'utf8');
  const m = /<div class="sheet" data-kind="mag" id="s18">([\s\S]*?)\n  <\/div>\n  <div class="sheet off"/.exec(src);
  const 장글 = m ? m[1] : '';

  console.log('[1] 붙이는 한 장이 서나');
  ok(!!m, '<div … data-kind="mag" id="s18"> 이 있다');
  ok(/s18:'붙이는한장'/.test(src), '칩에 「붙이는한장」 이 있다');
  ok(!/off=\{[^}]*s18:1/.test(src), '처음부터 켜져 있다 — 고객에게 드리는 장입니다');
  ok(/'v_foot18'/.test(src), '꼬리말이 다른 고객용 장과 <b>같은 한 곳</b>에서 온다 (5번)');
  ok((src.match(/setH\('v_foot18'/g) || []).length === 0, '제 꼬리글을 따로 또 적지 않았다');

  console.log('[2] 보관 안내서의 쪽을 안 먹나');
  ok(!/sh-top/.test(장글), '쪽 번호가 들어갈 머리띠(.sh-top)가 없다');
  ok(/data-kind="ins"/.test((/function shNum\(\)[\s\S]{0,320}/.exec(src) || [''])[0]),
     '쪽 번호는 ins 장만 셉니다 (mag 은 안 셉니다)');

  console.log('[3] 표지 차례가 거짓말하지 않나 (1번)');
  ok(/const 장수 = out\.length;/.test(src), '장수를 <b>붙이는 한 장을 더하기 전에</b> 센다');
  ok(/붙이는 한 장/.test(src), '표지에 「붙이는 한 장」 을 밝히는 말이 있다');

  console.log('[4] 글씨 사다리를 또 적지 않았나 (5번)');
  ok(/\.sheet\[data-kind="ins"\],\.sheet\[data-kind="let"\],\.sheet\[data-kind="mag"\]\{/.test(src),
     '토큰 묶음 <b>한 곳</b>에 mag 을 더했다 (사다리를 또 안 적는다)');
  ok(!/#s18[^{]*\{[^}]*--ss-(h1|h2|body|lead)\s*:/.test(src), '#s18 안에서 토큰을 다시 정하지 않았다');

  console.log('[6] 삽화를 직접 그렸나 (9번 — 남의 자료를 복제하지 않는다)');
  ok(!/<img/.test(장글), '사진·삽화 파일을 끌어다 쓰지 않았다 (<img> 0개)');
  const svg수 = (장글.match(/<svg/g) || []).length;
  ok(svg수 >= 8, '직접 그린 SVG ' + svg수 + '개 (리본 넷 + 물결 + 아이콘 넷)');

  console.log('[7] 단정하지 않나 (1번 · 2번)');
  ok(!/반드시 받으실 수 있|무조건 지급|틀림없이|확실히 지급|비과세/.test(장글), '받는다고 장담하지 않는다');
  ok(/상법 제662조/.test(장글), '3년은 법조문을 그대로 적는다 (상법 제662조)');
  ok(/보험사·상품마다 다릅니다|보험사와 상품마다 다릅니다/.test(장글),
     '필요서류가 계약마다 다르다고 밝힌다');

  /* ── 브라우저로 ───────────────────────────────────────────── */
  const br = await chromium.launch();
  const p = await br.newPage({ viewport: { width: 1100, height: 1300 } });
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

  const 세우기 = (값) => p.evaluate((값) => {
    Object.keys(값).forEach(k => {
      const e = document.getElementById(k);
      if (e) { e.value = 값[k]; e.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    render();
    const s = document.getElementById('s18');
    const o = {};
    o.있나 = !!s; if (!s) return o;
    o.전화칸 = (s.querySelector('.mgtel') || {}).textContent || '';
    o.이름 = (document.getElementById('v_mgname') || {}).textContent || '';
    o.번호 = (document.getElementById('v_mgtel') || {}).textContent || '';
    o.알약 = s.querySelectorAll('.mgchk div').length;
    o.아이콘 = s.querySelectorAll('.mgicons svg').length;
    o.머리줄 = s.querySelectorAll('.mgbar').length;
    o.체크 = s.querySelectorAll('.mgchk i').length;
    /* ★ 쪽 번호가 <b>s18 을 껐다 켜도 똑같은가</b> — 붙이는 한 장이 끼어들어
       번호를 밀면 고객 종이에 2번 다음 4번이 옵니다.
       ⚠ 처음에는 「번호가 12개여야 한다」 고 적었다가 틀렸습니다 — 표지(s1)는
         머리띠에 번호를 안 적어 11개가 맞습니다. 수를 외우지 말고
         <b>껐다 켠 전후를 견주는</b> 것이 진짜 재는 법입니다 (8번). */
    const 쪽읽기 = () => [...document.querySelectorAll('.sheet[data-kind="ins"] .sh-top .r')]
      .map(e => (e.textContent || '').trim()).filter(Boolean);
    o.쪽 = 쪽읽기();
    s.classList.add('off'); markFirst();
    o.쪽끄고 = 쪽읽기();
    s.classList.remove('off'); markFirst();
    o.차례머리 = (document.getElementById('v_cvtoch') || {}).textContent || '';
    o.차례끝 = (() => { const d = document.querySelectorAll('#v_cvtoc div');
      return d.length ? (d[d.length - 1].textContent || '').trim() : ''; })();
    /* 파란 자리 — 고객이 보는 장은 따뜻한 색만 */
    o.파랑 = [];
    s.querySelectorAll('*').forEach(e => {
      const cs = getComputedStyle(e);
      [cs.color, cs.backgroundColor, cs.borderTopColor, cs.stroke].forEach(v => {
        const g = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(v || ''); if (!g) return;
        const [r, gg, b] = [+g[1], +g[2], +g[3]];
        if (b > r + 25 && b > gg + 15 && b > 120) o.파랑.push(e.tagName + ' ' + v);
      });
    });
    /* 작은 글 — 법정 꼬리글만 뺍니다 */
    o.작은 = [];
    s.querySelectorAll('*').forEach(e => {
      if (e.children.length) return;
      const t = (e.textContent || '').trim(); if (!t) return;
      if (e.closest('.mgfoot')) return;
      const f = parseFloat(getComputedStyle(e).fontSize);
      if (f < 16) o.작은.push(Math.round(f * 10) / 10 + 'px · ' + t.slice(0, 22));
    });
    const mh = s.style.minHeight; s.style.minHeight = '0';
    o.민높이 = Math.round(s.getBoundingClientRect().height); s.style.minHeight = mh;
    o.높이 = Math.round(s.getBoundingClientRect().height);
    o.가로넘침 = s.scrollWidth - s.clientWidth;
    return o;
  }, 값);

  const 진짜 = await 세우기({ f_agent: '윤시현', f_phone: '010-2724-8275',
    f_org: '에이플러스에셋어드바이저 보험대리점', f_reg: '2016012345', f_agency: '2008010456' });

  console.log('[5] 따뜻한 색인가 — 파란 자리가 없나 (판 X362)');
  ok(진짜.파랑.length === 0, '파란 자리 ' + 진짜.파랑.length + '곳'
     + (진짜.파랑.length ? ' ← ' + 진짜.파랑.slice(0, 2).join(' · ') : ''));

  console.log('[8] ★ 이름과 번호가 제대로 찍히나');
  ok(진짜.이름.trim() === '윤시현', '이름이 담당자 칸에서 온다 — ' + (진짜.이름.trim() || '(빈 칸)'));
  ok(/\d{2,4}-\d{3,4}-\d{4}/.test(진짜.번호), '번호가 진짜 찍힌다 — ' + (진짜.번호.trim() || '(빈 칸)'));

  const 빈값 = await 세우기({ f_agent: '', f_phone: '' });
  const 두번 = (빈값.전화칸.match(/담당 설계사/g) || []).length;
  ok(두번 <= 1, '이름을 안 넣으셔도 「담당 설계사」 가 ' + 두번 + '번만 찍힌다 (두 번 찍히면 안 됩니다)');
  ok(빈값.번호.trim() !== '-' && 빈값.번호.trim() !== '',
     '번호가 비면 <b>무엇을 넣어야 하는지</b> 말한다 — ' + 빈값.번호.trim());

  /* 되돌려 놓고 나머지를 봅니다 */
  const 끝 = await 세우기({ f_agent: '윤시현', f_phone: '010-2724-8275' });

  console.log('[9] 짜임새가 A+ 자료 그대로인가');
  ok(끝.머리줄 === 3, '알약 머리줄 ' + 끝.머리줄 + '개 (전화 · 서류 · 알릴 것)');
  ok(끝.알약 === 8, '✔ 알약 ' + 끝.알약 + '개');
  ok(끝.체크 === 8, '빨강 ✔ 네모 ' + 끝.체크 + '개');
  ok(끝.아이콘 === 4, '아래 아이콘 ' + 끝.아이콘 + '개 (직업 · 차 · 집 · 취미)');

  console.log('[10] 쪽 번호와 표지 차례');
  ok(끝.쪽.length > 0 && 끝.쪽.every(t => /보험증권 보관 안내서 · \d\d/.test(t)),
     '보관 안내서 쪽 번호 ' + 끝.쪽.length + '개가 붙어 있다');
  ok(끝.쪽.join('|') === 끝.쪽끄고.join('|'),
     '붙이는 한 장을 껐다 켜도 쪽 번호가 <b>한 자도 안 바뀐다</b>'
     + (끝.쪽.join('|') === 끝.쪽끄고.join('|') ? '' : '\n        켰을 때 ' + 끝.쪽.join(' ')
        + '\n        껐을 때 ' + 끝.쪽끄고.join(' ')));
  ok(/\+ 붙이는 한 장/.test(끝.차례머리), '표지 머리글이 「+ 붙이는 한 장」 을 밝힌다 — ' + 끝.차례머리);
  ok(/붙이시는 한 장/.test(끝.차례끝), '차례 마지막 줄이 붙이는 한 장이다 — ' + 끝.차례끝);

  console.log('[11] A4 한 장에 서고 글씨가 큰가');
  ok(끝.높이 <= A4, '높이 ' + 끝.높이 + 'px (A4 ' + A4 + 'px 안)');
  ok(A4 - 끝.민높이 >= 여유바닥, '바닥 여유 ' + (A4 - 끝.민높이) + 'px (눈금 ' + 여유바닥 + 'px)');
  ok(끝.가로넘침 === 0, '가로로 삐져나간 곳 ' + 끝.가로넘침 + 'px');
  ok(끝.작은.length === 0, 글바닥 + 'px 밑으로 떨어진 글 ' + 끝.작은.length + '곳'
     + (끝.작은.length ? ('\n        ' + 끝.작은.slice(0, 4).join('\n        ')) : ''));

  console.log('[끝] 조용한가');
  ok(터짐.length === 0, '터진 자리 ' + 터짐.length + (터짐.length ? (' ← ' + 터짐[0]) : ''));
  ok(바깥.length === 0, '사장님 서버를 부른 횟수 ' + 바깥.length + ' (7번)');

  await br.close();
  console.log('──────────────────────────────');
  if (실패) { console.log('✗ ' + 실패 + '가지 빨간불'); process.exit(1); }
  console.log('붙이는 한 장 점검 통과 — 번호가 찍히고, 보관 안내서의 쪽을 안 먹습니다.');
})();
