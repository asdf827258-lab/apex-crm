/* 📒 TA → CS <b>상황별 터치</b> — 무엇을 보고 · 어떻게 닿고 · 무슨 글을 보내고 · 무엇을 말하나 — 판 X183

   사장님 말씀 (2026-10-24) — 「ta-cs 까지 어떤 상황과 어떻게 터치해야할지 그리고 문자/카톡 내용도
   예시표를 2~3개 만들어서 디테일하게 터치하고 전화까지 할수있도록 · dB통합CRM 에 있는 고객 상황과
   안겹치고 똑같은 화면을 띄우도록」.

   글은 apex-stage.js 의 TOUCH <b>한 곳</b> · 그리는 것은 apex-cusone.js 의 cusTouchHtml <b>한 벌</b>.
   고객 창(연락 탭 · cmSayHtml)과 DB 통합 CRM(「무엇을 할까」 · sgAskHtml)이 그것을 부릅니다.

   여기서 잽니다 —
     [1] 표의 모양 — TA·AP·PC·CS 넷 × 상황 셋 · 상황마다 글 2~3 · 전화 대본(여는 말·물을 것·끝맺음) ·
         하지 말 것 · 다음
     [2] ★ 지어내지 않는다 (1번·2번) — 글·대본에 <b>금액·%·세금·한도·나이·개월</b> 숫자가 없다 ·
         「무조건 · 확정 · 다 나옵니다 · 손해 안」 같은 단정이 없다(「하지 말 것」 칸만 예외 — 그것을 하지
         말라고 적는 칸입니다) · 보험료를 말하는 글은 「심사 결과에 따라」 를 붙인다 ·
         지금 드신 보험을 <b>깨라고</b> 권하는 말이 없다 · 이름이 없다(「고객님」 · 3번)
     [3] 그리는 판 — 글이 <b>보이는 그대로</b> 선다 · {나} 가 남지 않는다 · 번호가 있을 때만 문자·전화 단추 ·
         표에 없는 단계는 <b>아무것도</b> 안 세운다 · TA 첫 마디는 어디서 오신 분인가로 갈린다
     [4] 한 곳 — 글이 app/index.html · db-crm.html 에 <b>베껴져 있지 않다</b> · 두 화면이 같은 함수를 부른다 ·
         같은 판(?v=)을 싣는다
     [5] ★★ 진짜 두 화면 — 같은 단계·같은 종류·같은 번호면 고객 창과 CRM 의 글이 <b>한 글자도 안 다르다</b>
     [6] 고객 창 연락 탭에 서고 · 예전 「💬 보낼 말」 이 <b>또 서지 않는다</b>(한 화면에 한 번)

   ★ 견본 서버는 check-rtteam 의 STUB 을 <b>그 파일에서 읽어</b> 씁니다 — 두 벌 두지 않습니다 (5번).
   ★ 바깥은 끊습니다. 견본 이름은 홍길동 집안입니다 (3번). */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const body = (src, head) => { const i = src.indexOf(head); if (i < 0) return ''; const j = src.indexOf('\n}', i); return src.slice(i, j + 2); };

global.window = global;
require(path.join(ROOT, 'apex-stage.js'));
require(path.join(ROOT, 'app/apex-cusone.js'));
const S = global.APEX_STAGE;
const STAGES = ['TA', 'AP', 'PC', 'CS'];

(async () => {
  const APP = fs.readFileSync('app/index.html', 'utf8');
  const CRM = fs.readFileSync('db-crm.html', 'utf8');

  console.log('\n[1] 표의 모양 — 넷 × 셋 · 글 셋은 저마다 다르게 · 대본 여섯 걸음');
  is(typeof S.touchOf === 'function' && S.touch, '  APEX_STAGE.touchOf · touch 가 밖에서 보인다');
  const all = [];
  const STEPS = ['인사·소개', '용건', '듣기', '제안', '확인', '마무리'];
  STAGES.forEach(st => {
    const L = S.touchOf(st);
    is(L.length === 3, '  ' + st + ' — 상황 ' + L.length + '가지 (' + L.map(x => x.t).join(' · ') + ')');
    L.forEach(x => {
      all.push(Object.assign({ st: st }, x));
      const ok = x.k && x.t && x.ch && x.when && x.how && x.avoid && x.next &&
                 Array.isArray(x.call) && x.call.map(c => c.t).join() === STEPS.join() && x.call.every(c => c.say && c.say.length >= 15) &&
                 Array.isArray(x.reply) && x.reply.length >= 2 && x.reply.every(r => r.q && r.a && r.a.length >= 20) &&
                 Array.isArray(x.msg) && x.msg.length === 3 &&
                 x.msg.every(m => (m.ch === '문자' || m.ch === '카톡') && m.t && m.text);
      is(ok, '    ' + x.k + ' — 글 ' + (x.msg || []).length + ' · 대본 ' + (x.call || []).length + '걸음(' + STEPS.join('→') + ') · 돌아오는 말 ' + (x.reply || []).length + ' · 하지 말 것 · 다음');
      /* ★ 사장님 말씀 「너무 짧고」 — 글 하나가 <b>네 줄 · 140자</b> 밑이면 짧은 것입니다(손대기 전 평균 90자) */
      const short = x.msg.filter(m => m.text.length < 140 || m.text.split('\n').filter(l => l.trim()).length < 4);
      is(!short.length, '    글마다 140자 · 네 줄 이상 — ' + x.msg.map(m => m.text.length + '자').join(' · ') + (short.length ? ' ✗ 짧은 글: ' + short.map(m => m.t).join(' · ') : ''));
      /* ★ 「메시지의 디테일을 조금 더 다르게」 — 셋이 같은 말을 길이만 바꾼 것이면 안 됩니다.
         글자 둘씩 짝(bigram)으로 견주어 <b>절반 넘게 겹치면</b> 같은 글로 봅니다 */
      const bg = t => { const o = new Set(); const z = t.replace(/\{[^}]+\}|\s/g, ''); for (let i = 0; i < z.length - 1; i++) o.add(z.slice(i, i + 2)); return o; };
      let worst = 0;
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
        const A = bg(x.msg[i].text), B = bg(x.msg[j].text); let n = 0; A.forEach(g => { if (B.has(g)) n++; });
        worst = Math.max(worst, n / Math.min(A.size, B.size));
      }
      is(worst < 0.5 && new Set(x.msg.map(m => m.t)).size === 3, '    글 셋의 쓰임이 다르다 — 이름 셋이 다르고, 가장 닮은 두 글의 겹침 ' + Math.round(worst * 100) + '% (50% 밑)');
    });
  });
  const ks = all.map(x => x.k);
  is(new Set(ks).size === ks.length, '  상황 이름표(k)가 겹치지 않는다 — ' + ks.length + '개');
  is(S.touchOf('미접촉').length === 0 && S.touchOf('').length === 0 && S.touchOf(null).length === 0,
     '  표에 없는 단계는 <b>빈 배열</b> — 지어내지 않는다 (1번)');
  const c1 = S.touchOf('TA'); c1.pop();
  is(S.touchOf('TA').length === 3, '  받아 간 쪽이 고쳐도 표는 안 바뀐다 (복사본을 준다)');

  console.log('\n[2] ★ 태도 · 지어내지 않는다 — 숫자 · 단정 · 깨라는 말 · 이름');
  const said = [];   /* [이름표, 글, 갈래] — 「하지 말 것」 칸은 뺍니다 */
  all.forEach(x => {
    x.msg.forEach((m, i) => said.push([x.k + ' 글' + (i + 1), m.text, 'msg']));
    x.call.forEach(c => said.push([x.k + ' 대본 ' + c.t, c.say, 'call'], [x.k + ' 요령 ' + c.t, c.tip, 'how']));
    x.reply.forEach((r, i) => said.push([x.k + ' 돌아오는 말' + (i + 1), r.a, 'call']));
    said.push([x.k + ' 이럴 때', x.when, 'how'], [x.k + ' 이렇게', x.how, 'how'], [x.k + ' 다음', x.next, 'how']);
  });
  S.appt.forEach(a => said.push(['약속 안내 ' + a.k, a.text, 'msg']));
  /* 금액·비율·세금·한도·나이·개월 — 걸리는 시간(분)만 됩니다 */
  const NUM = /\d[\d,.~]*\s*(원|만|억|%|퍼센트|세\b|살|개월|년|회차|배)/;
  const numHit = said.filter(([, t]) => NUM.test(t.replace(/<[^>]*>/g, '')));
  is(!numHit.length, '  금액·%·나이·개월 숫자 0곳' + (numHit.length ? ' — ' + numHit.map(x => x[0] + '「' + x[1].match(NUM)[0] + '」').join(' · ') : ''));
  const TAX = /비과세|세액공제|소득공제|절세|면세|한도/;
  const taxHit = said.filter(([, t]) => TAX.test(t));
  is(!taxHit.length, '  세금·한도 말 0곳 (2번 — 요건만 · 판단은 세무 전문가)' + (taxHit.length ? ' — ' + taxHit.map(x => x[0]).join(' · ') : ''));
  const SURE = /무조건|확정입니다|확정됩니다|다 나옵니다|손해 안|100\s*%|보장해 드립니다|틀림없/;
  const sureHit = said.filter(([, t]) => SURE.test(t));
  is(!sureHit.length, '  단정하는 말 0곳 (「하지 말 것」 칸 밖)' + (sureHit.length ? ' — ' + sureHit.map(x => x[0] + '「' + x[1].match(SURE)[0] + '」').join(' · ') : ''));
  const premNo = said.filter(([, t, w]) => w === 'msg' && /보험료/.test(t) && !/심사 결과에 따라/.test(t));
  is(!premNo.length, '  보험료를 말하는 글은 「심사 결과에 따라」 를 붙인다' + (premNo.length ? ' — ' + premNo.map(x => x[0]).join(' · ') : ''));
  const BREAK = /해지하(시|세)|해지해 (드|주)|갈아타(시|세)|깨(시|세)고|정리하시고 새로/;
  const brHit = said.filter(([, t]) => BREAK.test(t));
  is(!brHit.length, '  지금 드신 보험을 <b>깨라고</b> 권하는 말 0곳' + (brHit.length ? ' — ' + brHit.map(x => x[0]).join(' · ') : ''));
  is(all.filter(x => x.st === 'PC').some(x => /그대로 두/.test(x.how + x.msg.map(m => m.text).join(''))),
     '  PC 의 「지금 보험 걱정」 은 <b>그대로 두고 견주기만</b> 한다고 적혀 있다');
  const NAME = /홍길동|홍길순|김○○|[가-힣]○○/;
  const nmHit = said.filter(([, t]) => NAME.test(t));
  is(!nmHit.length, '  이름 0곳 — 「고객님」 으로 나간다 (3번)' + (nmHit.length ? ' — ' + nmHit.map(x => x[0]).join(' · ') : ''));
  is(all.every(x => x.msg.every(m => /고객님/.test(m.text))) && S.appt.every(a => /고객님/.test(a.text)), '  글마다 「고객님」 으로 부른다');
  const AD = /이벤트|혜택|사은품|할인|특가|가입하세요|가입하시면/;
  const adHit = said.filter(([, t, w]) => w === 'msg' && AD.test(t));
  is(!adHit.length, '  광고성 말 0곳 — 약속·안내 글(정보성)만 · 광고는 수신 동의가 있어야 합니다' + (adHit.length ? ' — ' + adHit.map(x => x[0]).join(' · ') : ''));
  /* ★ 사장님 말씀 「고객을 대하는 태도가 너무 엉망」 — 탓하고 재촉하고 낮춰 부르는 말이 없어야 합니다 */
  const RUDE = /몇 번이나|연락도 없이|기다렸는데|오늘 안에|지금 아니면|빨리 결정|왜 안 |하셔야 합니다|해야 돼요|바쁘신 것 같아 글로|길게 안 붙잡|2분만|잠깐이면 돼/;
  const rudeHit = said.filter(([, t, w]) => w !== 'how' && RUDE.test(t));
  is(!rudeHit.length, '  탓하는 말 · 재촉하는 말 0곳 (「하지 말 것」 칸 밖)' + (rudeHit.length ? ' — ' + rudeHit.map(x => x[0] + '「' + x[1].match(RUDE)[0] + '」').join(' · ') : ''));
  /* ★ 사장님 말씀 「더 가독성 있게 · 강조해서 · 이모지 등 활용해서」 — 문자·카톡은 굵게·색이 안 되므로
     강조는 <b>모양</b>입니다. ① 첫 줄 [제목](폰 알림에는 첫 줄만 보입니다) ② 꼭 볼 줄은 이모지나 ①②③ 으로
     시작 ③ 이모지는 <b>정해 둔 것만 · 한 글에 아홉까지</b> — 광고처럼 번쩍이면 오히려 안 읽힙니다 */
  const EMO_OK = '🙂😊🙏📞⏰📅📍📝📋📄✅☑📌💡🔎🩺🪪👪💬🔔🤝⚠🏥💊📱📸✏✔👉🏢👤🔒';
  const emos = t => (t.match(/\p{Extended_Pictographic}/gu) || []);
  const msgs = said.filter(([, , w]) => w === 'msg');
  const badEmo = msgs.filter(([, t]) => emos(t).some(e => EMO_OK.indexOf(e) < 0) || emos(t).length > 9);
  is(!badEmo.length, '  이모지는 정해 둔 ' + Array.from(EMO_OK).length + '가지만 · 한 글에 아홉까지' + (badEmo.length ? ' — ' + badEmo.map(x => x[0] + '(' + emos(x[1]).join('') + ')').join(' · ') : ''));
  const noTitle = msgs.filter(([, t]) => !/^\[[^\]\n]{2,24}\]\n/.test(t));
  is(!noTitle.length, '  글마다 첫 줄이 <b>[제목]</b> — 폰 알림에 첫 줄만 보여도 무슨 글인지 안다' + (noTitle.length ? ' — ' + noTitle.map(x => x[0]).join(' · ') : ''));
  const flat = msgs.filter(([, t]) => t.split('\n').filter(l => /^(\p{Extended_Pictographic}|[①-⑨])/u.test(l)).length < 2);
  is(!flat.length, '  글마다 꼭 볼 줄이 둘 이상 이모지·번호로 시작한다 — 문단에 묻히지 않게' + (flat.length ? ' — ' + flat.map(x => x[0]).join(' · ') : ''));
  const apF = S.appt.filter(a => /\{일시\}/.test(a.text) && !/^📅 일시 : \{일시\}$/m.test(a.text) && !/\{일시\}에/.test(a.text) && !/^📅 뵙기로 한 날 : \{일시\}$/m.test(a.text));
  is(!apF.length && S.appt.filter(a => /\{장소\}/.test(a.text)).every(a => /^📍 (장소|만날 곳) : \{장소\}$/m.test(a.text)),
     '  약속 글의 일시·장소는 <b>제 줄</b>에 📅 · 📍 로 선다');
  is(all.every(x => /\{나\}/.test(x.call[0].say)), '  대본 첫 걸음마다 <b>소속·이름을 먼저</b> 밝힌다({나})');
  is(all.every(x => x.msg.every(m => /\{서명\}\s*$/.test(m.text))) && S.appt.every(a => /\{서명\}\s*$/.test(a.text)),
     '  글마다 끝에 <b>서명</b>({서명} — 소속·이름·직함 드림)이 붙는다');
  const ta1 = all.filter(x => x.k === 'ta-first')[0], ta3 = all.filter(x => x.k === 'ta-kakao')[0];
  is(/원하지 않으시면/.test(ta1.msg[0].text) && /원하지 않으시면/.test(ta3.msg[2].text),
     '  처음 연락드리는 글에는 「원하지 않으시면 더 연락드리지 않겠습니다」 의 문이 열려 있다');
  const cs = all.filter(x => x.k === 'cs-prep')[0];
  is(cs && /있는 그대로/.test(cs.how + cs.msg.map(m => m.text).join('')), '  서명 전날 — 알릴 의무를 「있는 그대로」 라고 적는다');
  /* ★ 사장님 말씀 (2026-10-24) 「본인인증 번호 하나만으로 확인할수 있고, 개인정보는 제가 수집하지 않고 따로 입력하여
     개인 정보보호받도록 도와드린다」 — 서명 자리 글에 그 세 가지가 서고, 신분증·주민번호를 <b>받는</b> 말이 없어야 합니다 */
  const signTexts = [cs.msg[0].text, S.appt.filter(a => a.k === 'sign')[0].text];
  is(signTexts.every(t => /인증번호/.test(t) && /직접 입력/.test(t) && /받아 적지 않습니다/.test(t) && /보호받으실/.test(t)),
     '  서명 자리 글 — 본인 확인은 <b>인증번호 하나</b> · 개인정보는 <b>받아 적지 않고 고객님이 직접 입력</b> · 보호받으시도록');
  const idAsk = said.filter(([, t]) => /신분증/.test(t) || (/주민(등록)?번호/.test(t) && !/(받아 적지 않|불러 주지 않|여쭙거나 받아 적지 않|불러 달라고 하지 않)/.test(t)));
  is(!idAsk.length && cs.reply.some(r => /주민번호/.test(r.q) && /불러 주지 않으셔도/.test(r.a)),
     '  신분증·주민번호를 <b>받는</b> 말 0곳 · 「주민번호 불러 드려야 하나요?」 에 「아닙니다」 로 답한다' + (idAsk.length ? ' — ' + idAsk.map(x => x[0]).join(' · ') : ''));
  const csw = all.filter(x => x.k === 'cs-wait')[0];
  is(csw && /심사/.test(csw.how) && /단정/.test(csw.avoid), '  심사 기다리는 동안 — 결과를 단정하지 말라고 「하지 말 것」 에 적혀 있다');

  console.log('\n[3] 그리는 판 — cusTouchHtml');
  is(typeof global.cusTouchHtml === 'function', '  cusTouchHtml 이 밖에서 보인다');
  const T = h => h.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ');
  const cnt = (h, re) => (h.match(re) || []).length;
  const ME = { name: '홍판서', title: '팀장', org: '견본지점', phone: '010-9999-0000' };
  const fillMe = t => t.split('{나}').join('견본지점 홍판서 팀장').split('{이름}').join('홍판서 팀장').split('{서명}').join('────────\n견본지점\n홍판서 팀장 드림');
  STAGES.forEach(st => {
    const L = S.touchOf(st);
    const h1 = cusTouchHtml({ stage: st, phone: '010-1234-5678', me: ME, key: 'c1' });
    const h0 = cusTouchHtml({ stage: st, phone: '', me: '' });
    const nSms = L.reduce((n, x) => n + x.msg.filter(m => m.ch === '문자').length, 0);
    const nMsg = L.reduce((n, x) => n + x.msg.length, 0);
    is(cnt(h1, /class="cus-tc-s"/g) === L.length && cnt(h1, /class="t-script cus-tc-m"/g) === nMsg && cnt(h1, /class="cus-tc-rp"/g) === L.reduce((n, x) => n + x.reply.length, 0),
       '  ' + st + ' — 상황 ' + L.length + ' · 글 ' + nMsg + ' · 돌아오는 말이 다 선다');
    const nAp = S.apptOf(st).length ? 1 : 0;
    is(cnt(h1, /onclick="cusTouchSms\(this\)"/g) === nSms + nAp && cnt(h1, /href="tel:01012345678"/g) === L.length,
       '    번호가 있으면 💬 문자로 열기 ' + (nSms + nAp) + '개(문자 글마다 + 📅 약속 안내) · 📞 걸기 ' + L.length + '개(대본마다)');
    is(cnt(h0, /cusTouchSms\(this\)/g) === 0 && cnt(h0, /href="tel:/g) === 0 && /번호가 없어/.test(h0),
       '    번호가 없으면 문자·걸기 단추 0개 · 「번호가 없어」 라고 말한다');
    is(!/\{(나|이름|서명|일시|장소|시각|장소에서|자리|소개줄)\}/.test(h1 + h0) && /견본지점 홍판서 팀장입니다/.test(T(h1)) && /견본지점 홍판서 팀장 드림/.test(T(h1)) &&
       /담당 설계사입니다/.test(T(h0)) && /담당 설계사 드림/.test(T(h0)) && /설정 → 내 소개/.test(h0) && !/설정 → 내 소개/.test(h1),
       '    자리 글자가 안 남는다 — 「내 소개」 가 있으면 소속·이름·직함 · 없으면 「담당 설계사」(소속을 지어 넣지 않고, 넣는 곳을 알려 준다)');
    const txt = T(h1);
    is(L.every(x => x.msg.every(m => txt.indexOf(T(fillMe(m.text))) >= 0) && x.call.every(c => txt.indexOf(T(fillMe(c.say))) >= 0)),
       '    글 · 대본이 <b>표 그대로</b> 선다 (고치거나 줄이지 않는다)');
  });
  is(cusTouchHtml({ stage: '미접촉' }) === '' && cusTouchHtml({ stage: '부재' }) === '' && cusTouchHtml({}) === '',
     '  표에 없는 단계는 빈 글 — 아무것도 안 세운다 (1번)');
  const hb = cusTouchHtml({ stage: 'TA', src: '보장분석3DB', me: ME });
  const hg = cusTouchHtml({ stage: 'TA', src: '', me: ME });
  const sayB = S.script('TA', '보장분석3DB').say;
  is(T(hb).indexOf(T(sayB)) >= 0 && /이 분께 맞춘 첫 마디 — 보장분석을 신청하신 분/.test(hb),
     '  TA 처음 연락드리는 분 — 보장분석 DB 면 그에 맞춘 첫 마디(APEX_STAGE.script)가 따로 선다');
  is(!/이 분께 맞춘 첫 마디/.test(hg), '  못 알아본 종류(일반)면 안 세운다 — 지어내지 않는다');
  const hx = cusTouchHtml({ stage: 'AP', me: '<img src=x onerror=alert(1)>', phone: '"><b>' });
  is(!/<img/.test(hx) && /&lt;img/.test(hx) && /data-ph=""/.test(hx), '  받은 이름·번호를 그대로 끼우지 않는다 (이름은 글자로 씻고 · 번호는 숫자만)');

  console.log('\n[3-1] 📅 약속 안내 문자 — 약속이 잡히면 골라서 바로');
  is(Array.isArray(S.appt) && S.appt.length >= 6 && typeof S.apptOf === 'function', '  약속 안내 글 ' + (S.appt || []).length + '가지가 apex-stage.js 한 곳에 있다');
  const keysOf = st => S.apptOf(st).map(a => a.k).join(',');
  is(['set', 'card', 'eve', 'day', 'move'].every(k => STAGES.every(st => keysOf(st).split(',').indexOf(k) >= 0)),
     '  네 단계 모두 — 확정 안내 · 명함 · 전날 · 당일 아침 · 일정 변경');
  is(keysOf('CS').indexOf('sign') >= 0 && keysOf('CS').indexOf('ready') < 0 && keysOf('TA').indexOf('sign') < 0,
     '  서명 자리 준비물은 CS 에만 · 증권 가져오실 것은 CS 에는 안 선다');
  is(S.apptOf('부재').length === 0 && S.apptOf('미접촉').length === 0, '  표 밖 단계에는 약속 글도 없다');
  /* 기존 TA 스크립트가 통화 끝에 한 약속 — 「이름이랑 명함을 문자로 · 일정 변경이 필요하시면 미리 연락 · ○월○일 ○시에 ○○에서」 */
  const TT = fs.readFileSync('app/ta-train.html', 'utf8');
  is(/명함 및 방문 안내/.test(TT) && /명함을 문자나 카카오톡으로 보내드리겠습니다/.test(TT), '  기존 TA 스크립트에 「명함 및 방문 안내」 약속이 있다 (그 약속을 지키는 글이 여기 있다)');
  const aSet = S.appt.filter(a => a.k === 'set')[0], aCard = S.appt.filter(a => a.k === 'card')[0];
  is(/\{일시\}/.test(aSet.text) && /\{장소\}/.test(aSet.text) && /일정이 바뀌시면 미리/.test(aSet.text) && /\{소개줄\}/.test(aCard.text),
     '  확정 안내에 일시·장소·「일정이 바뀌시면 미리」 · 명함에 소속·이름·연락처');
  const R0 = cusApptText('TA', 0, ME, '', '', '');
  const R1 = cusApptText('TA', 0, ME, '2026-10-28', '19:30', '');
  const R2 = cusApptText('TA', 0, ME, '2026-10-28', '19:30', '역 앞 카페');
  is(!R0.ok && /【날짜·시간을 넣어 주세요】/.test(R0.text), '  날짜·시간이 없으면 <b>못 보낸다</b> — 빈자리를 지어 채우지 않는다 (1번)');
  is(R1.ok && /10월 28일 \(수\) 오후 7시 30분/.test(R1.text) && /정해지는 대로 다시 알려 드리겠습니다/.test(R1.text),
     '  날짜·시간을 넣으면 「10월 28일 (수) 오후 7시 30분」 · 장소가 비면 「정해지는 대로 다시 알려 드리겠습니다」');
  is(/📍 장소 : 역 앞 카페/.test(R2.text) && /보장 점검 상담/.test(R2.text) && /────────\n견본지점\n홍판서 팀장 드림$/.test(R2.text.trim()),
     '  장소를 넣으면 그대로 · 내용은 단계의 자리(TA = 보장 점검 상담) · 끝에 구분선 아래 서명 두 줄');
  is(/청약 서명/.test(cusApptText('CS', 0, ME, '2026-10-28', '10:00', '').text) && /설계 내용 설명/.test(cusApptText('PC', 0, ME, '2026-10-28', '10:00', '').text),
     '  단계마다 자리 이름이 다르다 — PC 설계 내용 설명 · CS 청약 서명');
  is(/오늘 오전 10시에 뵙기로/.test(cusApptText('AP', S.apptOf('AP').map(a => a.k).indexOf('day'), ME, '2026-10-28', '10:00', '').text) &&
     /오늘 오후 2시에 역 앞에서 뵙기로/.test(cusApptText('AP', S.apptOf('AP').map(a => a.k).indexOf('day'), ME, '2026-10-28', '14:00', '역 앞').text),
     '  당일 아침 — 장소가 없으면 그 말을 빼고, 있으면 「○○에서」 로 잇는다');
  const PT = cusApptParts;
  is(PT('2026-10-28T10:00:00Z').t === '19:00' && PT('2026-10-28T19:00').t === '19:00' && PT('2026-10-28').t === '' && PT('').d === '',
     '  읽은 약속을 한국 시각으로 — 시간대가 붙으면 바꾸고 · 안 붙으면 적힌 그대로 · 날짜만이면 시간은 비운다');
  const hA = cusTouchHtml({ stage: 'AP', phone: '010-1234-5678', me: ME, appt: '2026-10-28T10:30:00Z' });
  const hN = cusTouchHtml({ stage: 'AP', phone: '010-1234-5678', me: ME });
  is(/<details class="cus-tc-s cus-ap" data-k="appt" open>/.test(hA) && /value="2026-10-28"/.test(hA) && /value="19:30"/.test(hA) && !/cus-ap-b"[^>]*disabled/.test(hA) &&
     /<details class="cus-tc-s" data-k="ap-eve">/.test(hA),
     '  약속이 읽히면 📅 칸이 <b>맨 위에 펴져</b> 날짜·시간이 채워지고 보내기가 눌린다 (첫 상황은 접힌다)');
  is(/<details class="cus-tc-s cus-ap" data-k="appt">/.test(hN) && /value=""/.test(hN) && /cus-ap-b"[^>]*disabled/.test(hN) && /<details class="cus-tc-s" data-k="ap-eve" open>/.test(hN),
     '  약속이 없으면 📅 칸은 접히고 · 보내기 단추는 <b>못 누른다</b> · 첫 상황이 펴진다');
  is(cnt(hA, /class="cus-ap-c( on)?"/g) === S.apptOf('AP').length, '  고를 글 ' + S.apptOf('AP').length + '가지가 단추로 선다');

  console.log('\n[4] 한 곳 — 베끼지 않았다 (5번)');
  const probe = all.map(x => x.msg[0].text.split('\n')[1] || x.msg[0].text).filter(t => t.length > 12);
  const inApp = probe.filter(t => APP.indexOf(t) >= 0), inCrm = probe.filter(t => CRM.indexOf(t) >= 0);
  is(!inApp.length && !inCrm.length, '  표의 글이 app/index.html · db-crm.html 에 <b>0줄</b> 베껴져 있다 (' + probe.length + '줄 대 봄)');
  const say = body(APP, 'function cmSayHtml(');
  is(/cusTouchHtml\(/.test(say) && /touchOf/.test(say), '  고객 창 — cmSayHtml 이 cusTouchHtml 을 부른다');
  const ask = body(CRM, 'function sgAskHtml(');
  is(/cusTouchHtml\(/.test(ask), '  CRM — sgAskHtml(「무엇을 할까」) 가 cusTouchHtml 을 부른다');
  const va = (APP.match(/apex-cusone\.js\?v=(\d+)/) || [])[1], vc = (CRM.match(/apex-cusone\.js\?v=(\d+)/) || [])[1];
  is(va && va === vc, '  두 화면이 같은 판을 싣는다 — 앱 v=' + va + ' · CRM v=' + vc);
  is(!/function cusTouchHtml|function cusTouch/.test(APP + CRM), '  그리는 함수가 두 화면에 또 없다');

  console.log('\n[5] ★★ 진짜 두 화면 — 같은 고객이면 같은 글');
  const RT = fs.readFileSync('scripts/check-rtteam.js', 'utf8');
  const STUB = (RT.match(/const STUB = `([\s\S]*?)`;/) || [])[1] || '';
  const srv = http.createServer((q, s) => {
    let fp = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    try { if (fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html'); } catch (e) {}
    fs.readFile(fp, (e, b) => {
      if (e) { s.writeHead(404); s.end(''); }
      else { s.writeHead(200, { 'content-type': MIME[path.extname(fp)] || 'application/octet-stream' }); s.end(b); }
    });
  });
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch();
  const page = async (url, stub) => {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(String(e.message || e)));
    await ctx.route('**://**', async r => {
      const u = r.request().url();
      if (stub && /supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB });
      if (u.startsWith('http://localhost:' + P)) return r.continue();
      if (/^https?:/.test(u)) return r.abort();
      return r.continue();
    });
    await pg.goto('http://localhost:' + P + url, { waitUntil: 'domcontentloaded' });
    return { ctx, pg, errs };
  };
  const C = await page('/db-crm.html?mig=1&me=u1', true);
  await C.pg.waitForFunction(() => { try { return (eval('dbs') || []).length > 0 } catch (e) { return false } }, { timeout: 30000 });
  const A = await page('/app/index.html', false);
  await A.pg.waitForFunction(() => typeof window.cmSayHtml === 'function' && typeof window.cusTouchHtml === 'function', { timeout: 30000 });
  const CASES = [['TA', '보장분석3DB'], ['TA', '소개'], ['AP', '일반'], ['PC', '방송'], ['CS', '']];
  const PH = '010-1234-5678';
  for (const [st, src] of CASES) {
    const crm = await C.pg.evaluate(([st, src, PH]) => {
      const d = eval('dbs')[0];
      d.stage = st; d.source = src; d.phone = PH; d.next_appt = '2030-01-15T01:30:00Z';
      try { const pf = eval('profile'); pf.name = '홍판서'; localStorage.setItem('apex_intro_' + pf.id, JSON.stringify({ name: '홍판서', title: '팀장', org: '견본지점' })); window.__pid = pf.id; } catch (e) {}
      sgAsk(d.id);
      const r = document.querySelector('#askBody .cus-tc');
      return r ? { t: r.textContent.replace(/\s+/g, ' ').trim(), ks: [].map.call(r.querySelectorAll('.cus-tc-s'), e => e.getAttribute('data-k')).join(','),
                   sms: r.querySelectorAll('[onclick^="cusTouchSms"]').length, tel: r.querySelectorAll('a[href^="tel:"]').length,
                   open: document.getElementById('askModal').classList.contains('open') } : null;
    }, [st, src, PH]);
    const app = await A.pg.evaluate(([st, src, PH]) => {
      window.cmCliOf = () => ({ id: 'c1', stage: st });
      window.CUS = window.CUS || {}; CUS.db = { stage: st, source: src, phone: PH, next_appt: '2030-01-15T01:30:00Z' }; CUS.calls = [];
      try { OS.profile = OS.profile || {}; OS.profile.id = 'pX'; OS.profile.name = '홍판서';
            localStorage.setItem('apex_intro_pX', JSON.stringify({ name: '홍판서', title: '팀장', org: '견본지점' })); } catch (e) {}
      const box = document.createElement('div'); box.innerHTML = cmSayHtml('c1');
      const r = box.querySelector('.cus-tc');
      return r ? { t: r.textContent.replace(/\s+/g, ' ').trim(), ks: [].map.call(r.querySelectorAll('.cus-tc-s'), e => e.getAttribute('data-k')).join(','),
                   sms: r.querySelectorAll('[onclick^="cusTouchSms"]').length, tel: r.querySelectorAll('a[href^="tel:"]').length,
                   old: [].some.call(box.querySelectorAll('.t-script'), e => !e.closest('.cus-tc')) } : null;
    }, [st, src, PH]);
    is(!!crm && crm.open, '  CRM 「무엇을 할까」 — ' + st + (src ? ' · ' + src : '') + ' 에 터치 칸이 선다' + (crm ? ' (' + crm.ks + ')' : ''));
    is(!!app, '  고객 창 — ' + st + ' 에 터치 칸이 선다' + (app ? ' (' + app.ks + ')' : ''));
    is(!!crm && !!app && crm.t === app.t && crm.ks === app.ks && crm.sms === app.sms && crm.tel === app.tel,
       '    ★ 두 화면의 글이 <b>한 글자도 안 다르다</b> — ' + (crm ? crm.t.length : 0) + '자 · 문자 ' + (crm ? crm.sms : '-') + ' · 걸기 ' + (crm ? crm.tel : '-'));
    is(!!app && !app.old, '    고객 창에 예전 「💬 보낼 말」 상자가 <b>또 서지 않는다</b> — 한 화면에 한 번');
  }
  /* 표에 없는 단계는 두 화면 다 안 세운다 */
  const none = await C.pg.evaluate(() => { const d = eval('dbs')[0]; d.stage = '부재'; sgAsk(d.id); return !!document.querySelector('#askBody .cus-tc'); });
  is(!none, '  CRM — 부재(표 밖)에는 터치 칸이 안 선다');
  const old = await A.pg.evaluate(() => { CUS.db = { stage: '부재', source: '' }; window.cmCliOf = () => ({ id: 'c1', stage: '부재' });
    const b = document.createElement('div'); b.innerHTML = cmSayHtml('c1'); return { tc: !!b.querySelector('.cus-tc'), say: !!b.querySelector('.t-script') }; });
  is(!old.tc && old.say, '  고객 창 — 부재는 예전 「💬 보낼 말」 그대로 (지운 것이 없다)');

  console.log('\n[6] 문자를 열면 접촉 기록 한 줄 · 전화도');
  const mark = await A.pg.evaluate(() => {
    const got = []; window.ccMark = (id, how) => got.push(id + '|' + how);
    window.cmCliOf = () => ({ id: 'c1', stage: 'AP' }); CUS.db = { stage: 'AP', source: '', phone: '010-1234-5678' };
    const b = document.createElement('div'); b.innerHTML = cmSayHtml('c1'); document.body.appendChild(b);
    let href = '';
    const L = window.location;
    try { cusTouchTel(b.querySelector('a[href^="tel:"]')); } catch (e) {}
    const btn = b.querySelector('[onclick^="cusTouchSms"]');
    const t = (btn.closest('.t-script').querySelector('.cus-tc-tx') || {}).textContent || '';
    b.remove();
    return { got: got, t: t };
  });
  is(mark.got.indexOf('c1|전화') >= 0, '  📞 걸기 → 접촉 기록(ccMark) 「전화」 한 줄 — ' + mark.got.join(' · '));
  is(mark.t.length > 30, '  💬 문자로 열기가 담는 글 = 그 상자의 글 (' + mark.t.length + '자)');
  /* ★ 단계는 배정 DB 가 <b>창이 열린 뒤에</b> 옵니다 — 처음엔 몰라 빈 칸, 오면 다시 그려야 합니다.
     화면을 찍다 실제로 빈 칸으로 남은 것을 찾았습니다(판 X183). */
  const late = await A.pg.evaluate(() => {
    const host = document.createElement('div'); host.id = 'cuwSay'; document.body.appendChild(host);
    window.cmCliOf = () => ({ id: 'c1' }); CUS.db = null;
    cuwSayPaint({ id: 'c1' }); const before = host.querySelectorAll('.cus-tc').length;
    CUS.db = { stage: 'PC', source: '', phone: '010-1234-5678' };
    cuwSayPaint({ id: 'c1' }); const after = [].map.call(host.querySelectorAll('.cus-tc-s:not(.cus-ap)'), e => e.getAttribute('data-k')).join(',');
    const f = host.querySelector('details.cuw-fold'); f.open = true; const node = host.firstChild;
    cuwSayPaint({ id: 'c1' }); const kept = host.firstChild === node && host.querySelector('details.cuw-fold').open;
    CUS.db = { stage: 'CS', source: '', phone: '010-1234-5678' };
    cuwSayPaint({ id: 'c1' }); const cs = [].map.call(host.querySelectorAll('.cus-tc-s:not(.cus-ap)'), e => e.getAttribute('data-k')).join(',');
    const reopen = host.querySelector('details.cuw-fold').open;
    host.remove();
    return { before, after, kept, cs, reopen };
  });
  is(late.before === 0 && late.after === 'pc-sent,pc-think,pc-family',
     '  배정 DB 가 늦게 와도 💬 칸이 <b>다시 선다</b> — 처음 ' + late.before + '칸 → 온 뒤 ' + late.after);
  is(late.kept, '  같은 글이면 손대지 않는다 — 펴 둔 칸이 안 닫힌다');
  is(late.cs === 'cs-prep,cs-wait,cs-done' && late.reopen, '  단계가 바뀌면 새 글로 · 펴 둔 것은 편 채로 — ' + late.cs);
  is(/cuwSayPaint\(c\)/.test(body(APP, 'function cuwPaint(')), '  cuwPaint(고객 창을 다시 그리는 한 곳)가 cuwSayPaint 를 부른다');
  /* 📅 진짜 화면에서 — 장소를 적고 글을 고르면 미리 보기가 그 자리에서 바뀌고, 보낼 글이 그것이다 */
  const AP7 = await A.pg.evaluate(() => {
    window.cmCliOf = () => ({ id: 'c1', stage: 'AP' });
    CUS.db = { stage: 'AP', source: '', phone: '010-1234-5678', next_appt: '' }; CUS.calls = [];
    const b = document.createElement('div'); b.innerHTML = cmSayHtml('c1'); document.body.appendChild(b);
    const box = b.querySelector('.cus-ap'), btns = () => [].slice.call(box.querySelectorAll('.cus-ap-b'));
    const before = { off: btns().every(x => x.disabled), tx: box.querySelector('.cus-ap-tx').textContent };
    const set = (sel, v) => { const e = box.querySelector(sel); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
    set('.cus-ap-d', '2026-10-28'); set('.cus-ap-t', '19:30');
    const mid = { on: btns().every(x => !x.disabled), tx: box.querySelector('.cus-ap-tx').textContent };
    set('.cus-ap-p', '역 앞 카페');
    const pick = [].filter.call(box.querySelectorAll('.cus-ap-c'), x => /전날/.test(x.textContent))[0];
    pick.click();
    const smsBtn = box.querySelector('[onclick="cusTouchSms(this)"]');
    const sent = cusTouchText(smsBtn);
    let stored = false; try { for (let i = 0; i < localStorage.length; i++) if ((localStorage.getItem(localStorage.key(i)) || '').indexOf('역 앞 카페') >= 0) stored = true; } catch (e) {}
    b.remove();
    return { before, mid, sent, stored, onPick: pick.classList.contains('on') };
  });
  is(AP7.before.off && /【날짜·시간을 넣어 주세요】/.test(AP7.before.tx), '  📅 약속이 없을 때 — 보내기 단추가 잠겨 있고 빈자리를 비워 둔다');
  is(AP7.mid.on && /10월 28일 \(수\) 오후 7시 30분/.test(AP7.mid.tx), '  날짜·시간을 넣는 그 자리에서 글이 채워지고 단추가 풀린다');
  is(AP7.onPick && /내일 뵙기로 한 약속/.test(AP7.sent) && /📍 장소 : 역 앞 카페/.test(AP7.sent) && /10월 28일 \(수\) 오후 7시 30분/.test(AP7.sent),
     '  「전날 확인」 을 고르면 💬 문자로 열기가 담는 글이 그 글이다 — 적은 장소·날짜 그대로');
  is(!AP7.stored, '  적은 장소는 <b>어디에도 저장하지 않는다</b> (이 기기 저장칸 0곳)');
  const TAB = await A.pg.evaluate(() => {
    window.cmCliOf = () => ({ id: 'c1', stage: 'PC' }); CUS.db = { stage: 'PC', source: '', phone: '010-1234-5678' }; CUS.calls = [];
    const b = document.createElement('div'); b.innerHTML = cmSayHtml('c1'); document.body.appendChild(b);
    const sit = b.querySelector('.cus-tc-s[data-k="pc-sent"]'); sit.open = true;
    const shown = () => [].filter.call(sit.querySelectorAll('.cus-tc-pane'), e => getComputedStyle(e).display !== 'none').map(e => e.getAttribute('data-p')).join(',');
    const h0 = sit.getBoundingClientRect().height, s0 = shown();
    sit.querySelector('.cus-tc-tabs [data-p="call"]').click();
    const s1 = shown(), call = sit.querySelectorAll('.cus-tc-pane.on .sl2').length;
    b.remove();
    return { s0, s1, call, h0: Math.round(h0) };
  });
  is(TAB.s0 === 'msg' && TAB.s1 === 'call' && TAB.call === 6,
     '  상황 안은 탭 셋 — 처음엔 보낼 글만, 「📞 전화 대본」 을 누르면 대본 여섯 걸음만 (' + TAB.s0 + ' → ' + TAB.s1 + ' · 펼친 높이 ' + TAB.h0 + 'px)');
  is(!A.errs.length && !C.errs.length, '  조용히 터진 곳이 없다' + ((A.errs[0] || C.errs[0]) ? ' — ' + (A.errs[0] || C.errs[0]) : ''));
  await A.ctx.close(); await C.ctx.close(); await br.close(); srv.close();

  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데 — 두 화면이 같은 고객에게 다른 말을 하거나, 지어낸 말이 나갑니다.'); process.exit(1); }
  console.log('✓ TA → CS 상황 열둘 · 글 ' + all.reduce((n, x) => n + x.msg.length, 0) + '가지 · 대본 열둘이 한 표에서 나와 두 화면에 같은 글로 섭니다.');
})().catch(e => { console.error(e); process.exit(1); });
